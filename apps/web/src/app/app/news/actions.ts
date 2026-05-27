'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db, schema } from '@equmanager/database';
import { and, eq } from 'drizzle-orm';

import { ensureSession } from '@/lib/db';

async function assertStaff() {
  const session = await ensureSession();
  if (!['owner', 'admin', 'instructor'].includes(session.primary.role)) {
    redirect('/app');
  }
  return session;
}

export async function createNewsAction(formData: FormData) {
  const session = await assertStaff();
  const title = String(formData.get('title') ?? '').trim();
  const body = String(formData.get('body') ?? '').trim();
  const pinned = formData.get('pinned') === 'on';

  if (!title || !body) return;

  await db.insert(schema.news).values({
    clubId: session.primary.clubId,
    title,
    body,
    pinned,
    publishedAt: new Date(),
    createdBy: session.user.id,
  });
  revalidatePath('/app/news');
}

export async function deleteNewsAction(formData: FormData) {
  const session = await assertStaff();
  const id = String(formData.get('id'));
  await db
    .delete(schema.news)
    .where(
      and(
        eq(schema.news.id, id),
        eq(schema.news.clubId, session.primary.clubId),
      ),
    );
  revalidatePath('/app/news');
}

export async function togglePinNewsAction(formData: FormData) {
  const session = await assertStaff();
  const id = String(formData.get('id'));
  const pinned = formData.get('pinned') === 'true';
  await db
    .update(schema.news)
    .set({ pinned: !pinned, updatedAt: new Date() })
    .where(
      and(
        eq(schema.news.id, id),
        eq(schema.news.clubId, session.primary.clubId),
      ),
    );
  revalidatePath('/app/news');
}
