'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db, schema } from '@equmanager/database';
import { and, eq } from 'drizzle-orm';

import { ensureSession } from '@/lib/db';
import { runAiMatch } from '@/lib/ai/match';

async function assertStaff() {
  const session = await ensureSession();
  if (!['owner', 'admin', 'instructor'].includes(session.primary.role)) {
    redirect('/app');
  }
  return session;
}

export async function createVoiceNoteAction(formData: FormData) {
  const session = await assertStaff();
  const transcript = String(formData.get('transcript') ?? '').trim();
  const lessonId = String(formData.get('lessonId') ?? '') || null;

  if (transcript.length < 5) {
    redirect('/app/ai?error=' + encodeURIComponent('La nota es muy corta'));
  }

  const [noteRow] = await db
    .insert(schema.aiVoiceNotes)
    .values({
      clubId: session.primary.clubId,
      instructorId: session.user.id,
      lessonId,
      transcript,
      status: 'analizando',
    })
    .returning();

  // Carga contexto: riders y horses del club
  const [riders, horses] = await Promise.all([
    db
      .select({ id: schema.riders.id, name: schema.riders.name })
      .from(schema.riders)
      .where(eq(schema.riders.clubId, session.primary.clubId)),
    db
      .select({ id: schema.horses.id, name: schema.horses.name })
      .from(schema.horses)
      .where(eq(schema.horses.clubId, session.primary.clubId)),
  ]);

  try {
    const result = await runAiMatch({ transcript, riders, horses });
    await db
      .update(schema.aiVoiceNotes)
      .set({
        summary: result.summary,
        structuredOutput: result as unknown as Record<string, unknown>,
        status: 'lista_para_revision',
        updatedAt: new Date(),
      })
      .where(eq(schema.aiVoiceNotes.id, noteRow!.id));
  } catch (err) {
    await db
      .update(schema.aiVoiceNotes)
      .set({
        status: 'error',
        errorMessage: err instanceof Error ? err.message : 'desconocido',
        updatedAt: new Date(),
      })
      .where(eq(schema.aiVoiceNotes.id, noteRow!.id));
  }

  revalidatePath('/app/ai');
  redirect(`/app/ai/${noteRow!.id}`);
}

export async function confirmVoiceNoteAction(formData: FormData) {
  const session = await assertStaff();
  const noteId = String(formData.get('noteId'));

  const [note] = await db
    .select()
    .from(schema.aiVoiceNotes)
    .where(
      and(
        eq(schema.aiVoiceNotes.id, noteId),
        eq(schema.aiVoiceNotes.clubId, session.primary.clubId),
      ),
    )
    .limit(1);
  if (!note) redirect('/app/ai');

  const structured = (note.structuredOutput ?? {}) as {
    items?: Array<{
      riderId: string | null;
      riderName: string;
      horseId: string | null;
      feedback: string;
      suggestedBadge?: string | null;
    }>;
  };

  const items = structured.items ?? [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i]!;
    const edited = String(formData.get(`feedback-${i}`) ?? item.feedback).trim();
    const include = formData.get(`include-${i}`) === 'on';
    if (!include || !item.riderId || !edited) continue;

    await db.insert(schema.lessonFeedback).values({
      lessonId: note.lessonId!,
      riderId: item.riderId,
      body: edited,
      source: 'ia',
      voiceNoteId: note.id,
      badgesSuggested: item.suggestedBadge ? [item.suggestedBadge] : [],
      createdBy: session.user.id,
    });

    // Si el rider tiene profile, notifícale
    const [rider] = await db
      .select({ profileId: schema.riders.profileId, name: schema.riders.name })
      .from(schema.riders)
      .where(eq(schema.riders.id, item.riderId))
      .limit(1);

    if (rider?.profileId) {
      await db.insert(schema.notifications).values({
        profileId: rider.profileId,
        clubId: session.primary.clubId,
        kind: 'feedback',
        title: 'Nuevo comentario de tu instructor',
        body: edited.slice(0, 140),
        link: '/app/me',
      });
    }
  }

  await db
    .update(schema.aiVoiceNotes)
    .set({ status: 'confirmada', updatedAt: new Date() })
    .where(eq(schema.aiVoiceNotes.id, note.id));

  revalidatePath('/app/ai');
  revalidatePath('/app/me');
  redirect('/app/ai?ok=1');
}

export async function discardVoiceNoteAction(formData: FormData) {
  const session = await assertStaff();
  const noteId = String(formData.get('noteId'));
  await db
    .update(schema.aiVoiceNotes)
    .set({ status: 'descartada', updatedAt: new Date() })
    .where(
      and(
        eq(schema.aiVoiceNotes.id, noteId),
        eq(schema.aiVoiceNotes.clubId, session.primary.clubId),
      ),
    );
  revalidatePath('/app/ai');
  redirect('/app/ai');
}
