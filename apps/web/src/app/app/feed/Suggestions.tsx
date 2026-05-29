import { db, schema } from '@equmanager/database';
import { and, eq, inArray, ne, notInArray, or } from 'drizzle-orm';
import { UserPlusIcon } from '@phosphor-icons/react/dist/ssr';
import { Avatar } from '@/components/ui';
import { roleLabel } from '@/lib/role-label';
import { ConnectButton } from './ConnectButton';

export async function Suggestions({ ownerId }: { ownerId: string }) {
  // Clubmates
  const myClubs = await db
    .select({ clubId: schema.clubMembers.clubId })
    .from(schema.clubMembers)
    .where(eq(schema.clubMembers.profileId, ownerId));
  const clubIds = myClubs.map((c) => c.clubId);
  if (clubIds.length === 0) return null;

  // Conexiones existentes (pendientes o aceptadas)
  const conns = await db
    .select({
      requester: schema.connections.requesterId,
      recipient: schema.connections.recipientId,
      status: schema.connections.status,
    })
    .from(schema.connections)
    .where(
      or(
        eq(schema.connections.requesterId, ownerId),
        eq(schema.connections.recipientId, ownerId),
      ),
    );

  const knownIds = new Set<string>([ownerId]);
  for (const c of conns) {
    knownIds.add(c.requester === ownerId ? c.recipient : c.requester);
  }

  const peers = await db
    .select({
      id: schema.profiles.id,
      fullName: schema.profiles.fullName,
      email: schema.profiles.email,
      avatarUrl: schema.profiles.avatarUrl,
      role: schema.clubMembers.role,
    })
    .from(schema.clubMembers)
    .innerJoin(
      schema.profiles,
      eq(schema.profiles.id, schema.clubMembers.profileId),
    )
    .where(
      and(
        inArray(schema.clubMembers.clubId, clubIds),
        ne(schema.clubMembers.profileId, ownerId),
      ),
    )
    .limit(50);

  const candidates = Array.from(new Map(peers.map((p) => [p.id, p])).values())
    .filter((p) => !knownIds.has(p.id))
    .slice(0, 8);

  if (candidates.length === 0) {
    return (
      <div className="rounded-3xl border border-stone-200 bg-white p-4 shadow-card">
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
          Sugerencias
        </div>
        <p className="mt-2 text-xs font-medium text-stone-500">
          Ya conoces a todos los de tu(s) centro(s).
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-4 shadow-card">
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
        Conectar con…
      </div>
      <ul className="mt-3 space-y-2">
        {candidates.map((p) => (
          <li
            key={p.id}
            className="flex items-center gap-2.5 rounded-2xl border border-stone-200 bg-stone-50 p-2"
          >
            <Avatar
              name={p.fullName ?? p.email}
              src={p.avatarUrl}
              size="sm"
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-bold text-stone-900">
                {p.fullName ?? p.email}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
                {roleLabel(p.role)}
              </div>
            </div>
            <ConnectButton recipientId={p.id} />
          </li>
        ))}
      </ul>
    </div>
  );
}
