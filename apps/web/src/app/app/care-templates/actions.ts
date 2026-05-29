'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db, schema } from '@equmanager/database';
import { and, eq } from 'drizzle-orm';
import {
  CARE_ITEM_KINDS,
  type CareItemKind,
} from '@equmanager/domain';

import { ensureSession } from '@/lib/db';

type CareItem = { key: string; label: string; kind: CareItemKind };

async function assertOwnerOrAdmin() {
  const session = await ensureSession();
  if (!['owner', 'admin'].includes(session.primary.role)) redirect('/app');
  return session;
}

function slugifyKey(input: string) {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 40);
}

export async function createTemplateAction(formData: FormData) {
  const session = await assertOwnerOrAdmin();
  const name = String(formData.get('name') ?? '').trim();
  const description =
    String(formData.get('description') ?? '').trim() || null;
  if (name.length < 2) {
    redirect('/app/care-templates?error=' + encodeURIComponent('Nombre muy corto'));
  }
  await db.insert(schema.horseCareTemplates).values({
    clubId: session.primary.clubId,
    name,
    description,
    items: [],
  });
  revalidatePath('/app/care-templates');
  redirect('/app/care-templates?message=' + encodeURIComponent('Plantilla creada.'));
}

export async function addTemplateItemAction(formData: FormData) {
  const session = await assertOwnerOrAdmin();
  const templateId = String(formData.get('templateId') ?? '');
  const label = String(formData.get('label') ?? '').trim();
  const kind = (formData.get('kind') ?? 'otros') as CareItemKind;

  if (!templateId || !label || !CARE_ITEM_KINDS.includes(kind)) return;

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
  if (!tpl) return;

  const items = Array.isArray(tpl.items) ? (tpl.items as CareItem[]) : [];
  let key = slugifyKey(label);
  let n = 1;
  while (items.some((i) => i.key === key)) {
    key = `${slugifyKey(label)}_${n++}`;
  }
  items.push({ key, label, kind });

  await db
    .update(schema.horseCareTemplates)
    .set({ items, updatedAt: new Date() })
    .where(eq(schema.horseCareTemplates.id, templateId));
  revalidatePath('/app/care-templates');
}

export async function removeTemplateItemAction(formData: FormData) {
  const session = await assertOwnerOrAdmin();
  const templateId = String(formData.get('templateId') ?? '');
  const itemKey = String(formData.get('itemKey') ?? '');
  if (!templateId || !itemKey) return;

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
  if (!tpl) return;
  const items = Array.isArray(tpl.items)
    ? (tpl.items as CareItem[]).filter((i) => i.key !== itemKey)
    : [];
  await db
    .update(schema.horseCareTemplates)
    .set({ items, updatedAt: new Date() })
    .where(eq(schema.horseCareTemplates.id, templateId));
  revalidatePath('/app/care-templates');
}

export async function deleteTemplateAction(formData: FormData) {
  const session = await assertOwnerOrAdmin();
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  await db
    .delete(schema.horseCareTemplates)
    .where(
      and(
        eq(schema.horseCareTemplates.id, id),
        eq(schema.horseCareTemplates.clubId, session.primary.clubId),
      ),
    );
  revalidatePath('/app/care-templates');
}
