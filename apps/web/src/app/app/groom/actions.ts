'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db, schema } from '@equmanager/database';
import { and, eq } from 'drizzle-orm';

import { ensureSession } from '@/lib/db';

async function assertGroomOrStaff() {
  const session = await ensureSession();
  const ok = session.memberships.some((m) =>
    ['owner', 'admin', 'instructor', 'groom'].includes(m.role),
  );
  if (!ok) redirect('/app');
  return session;
}

type CareItem = { key: string; label: string; kind?: string };
type CareItemDone = { key: string; done: boolean; notes?: string };

export async function submitCareLogAction(formData: FormData) {
  const session = await assertGroomOrStaff();
  const horseId = String(formData.get('horseId'));
  const templateId = String(formData.get('templateId'));
  const forDate = new Date().toISOString().slice(0, 10);
  const notes = String(formData.get('notes') ?? '').trim() || null;

  // Recupera la plantilla para saber qué keys hay
  const [tpl] = await db
    .select()
    .from(schema.horseCareTemplates)
    .where(
      and(
        eq(schema.horseCareTemplates.id, templateId),
        eq(schema.horseCareTemplates.clubId, session.primary.clubId),
      ),
    )
    .limit(1);

  const items: CareItem[] = Array.isArray(tpl?.items)
    ? (tpl!.items as CareItem[])
    : [];

  const itemsDone: CareItemDone[] = items.map((it) => ({
    key: it.key,
    done: formData.get(`item-${it.key}`) === 'on',
    notes: String(formData.get(`note-${it.key}`) ?? '').trim() || undefined,
  }));

  await db.insert(schema.horseCareLogs).values({
    clubId: session.primary.clubId,
    horseId,
    groomId: session.user.id,
    templateId: tpl?.id ?? null,
    forDate,
    itemsDone,
    notes,
    completedAt: new Date(),
  });

  // Notifica al propietario del caballo (si lo hay)
  const ownerRows = await db
    .select({ profileId: schema.horseOwners.profileId, role: schema.horseOwners.role })
    .from(schema.horseOwners)
    .where(eq(schema.horseOwners.horseId, horseId));

  const [horse] = await db
    .select({ name: schema.horses.name })
    .from(schema.horses)
    .where(eq(schema.horses.id, horseId))
    .limit(1);

  for (const o of ownerRows) {
    await db.insert(schema.notifications).values({
      profileId: o.profileId,
      clubId: session.primary.clubId,
      kind: 'checklist',
      title: `Checklist de ${horse?.name ?? 'caballo'} completado`,
      body: `El mozo ha terminado el cuidado del día.`,
      link: '/app/horse-owner',
    });
  }

  revalidatePath('/app/groom');
  revalidatePath('/app/horse-owner');
  redirect('/app/groom?done=' + encodeURIComponent(horse?.name ?? ''));
}
