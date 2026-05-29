import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  BuildingsIcon,
  HorseIcon,
  GraduationCapIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  ArrowLeftIcon,
} from '@phosphor-icons/react/dist/ssr';
import { db, schema } from '@equmanager/database';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@equmanager/auth';
import { LogoMark } from '@/components/brand/Logo';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const [profile] = await db
    .select({ isSuperadmin: schema.profiles.isSuperadmin })
    .from(schema.profiles)
    .where(eq(schema.profiles.id, user.id))
    .limit(1);
  if (!profile?.isSuperadmin) redirect('/app');

  return (
    <div className="flex min-h-screen bg-stone-50">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-stone-200 bg-white md:flex">
        <div className="p-5">
          <div className="flex items-center gap-2">
            <LogoMark size={32} />
            <div>
              <div className="text-sm font-bold text-stone-900">Equmanager</div>
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700">
                Superadmin
              </div>
            </div>
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 px-3 pb-6">
          <AdminLink href="/admin" icon={<ChartBarIcon size={18} weight="duotone" />}>
            Resumen
          </AdminLink>
          <AdminLink href="/admin/clubs" icon={<BuildingsIcon size={18} weight="duotone" />}>
            Clubes
          </AdminLink>
          <AdminLink href="/admin/horses" icon={<HorseIcon size={18} weight="duotone" />}>
            Caballos
          </AdminLink>
          <AdminLink href="/admin/riders" icon={<GraduationCapIcon size={18} weight="duotone" />}>
            Jinetes
          </AdminLink>
          <AdminLink href="/admin/directory" icon={<MagnifyingGlassIcon size={18} weight="duotone" />}>
            Directorio público
          </AdminLink>
        </nav>
        <div className="border-t border-stone-200 p-4">
          <Link
            href="/app"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-stone-500 transition hover:bg-stone-100 hover:text-brand-700"
          >
            <ArrowLeftIcon size={12} weight="bold" /> Volver a la app
          </Link>
        </div>
      </aside>
      <main className="flex-1 overflow-x-hidden">{children}</main>
    </div>
  );
}

function AdminLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-bold text-stone-700 transition hover:bg-stone-100 hover:text-brand-700"
    >
      <span className="text-stone-400 transition group-hover:text-brand-600">
        {icon}
      </span>
      {children}
    </Link>
  );
}
