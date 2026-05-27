import Link from 'next/link';
import { BellIcon } from '@phosphor-icons/react/dist/ssr';
import { db, schema } from '@equmanager/database';
import { and, eq, isNull, sql } from 'drizzle-orm';

export async function Topbar({ profileId }: { profileId: string }) {
  const [unread] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.notifications)
    .where(
      and(
        eq(schema.notifications.profileId, profileId),
        isNull(schema.notifications.readAt),
      ),
    );

  const count = unread?.n ?? 0;

  return (
    <header className="sticky top-0 z-10 flex items-center justify-end border-b border-stone-200 bg-white/80 px-6 py-3 backdrop-blur">
      <Link
        href="/app/notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 text-stone-600 transition hover:border-brand-300 hover:text-brand-700"
        aria-label="Notificaciones"
      >
        <BellIcon size={18} weight="duotone" />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-700 px-1 text-[10px] font-bold text-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </Link>
    </header>
  );
}
