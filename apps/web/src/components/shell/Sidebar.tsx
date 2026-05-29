import Link from 'next/link';
import {
  SignOutIcon,
  CaretDownIcon,
  ShieldStarIcon,
  ArrowRightIcon,
} from '@phosphor-icons/react/dist/ssr';
import { signOut } from '@/app/auth/actions';
import { LogoMark } from '@/components/brand/Logo';
import { NavIcon } from './NavIcon';
import { roleLabel } from '@/lib/db/session';
import type { CurrentSession } from '@/lib/db/profile';
import { buildNav } from '@/lib/nav';

export function Sidebar({ session }: { session: CurrentSession }) {
  const roles = Array.from(new Set(session.memberships.map((m) => m.role)));
  const sections = buildNav(roles);
  const primary = session.primary!;
  const isSuperadmin = session.profile?.isSuperadmin === true;

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-stone-200 bg-white md:flex">
      <div className="p-5">
        <div className="flex items-center gap-2">
          <LogoMark size={32} />
          <div>
            <div className="text-sm font-bold text-stone-900">Equmanager</div>
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
              Panel
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 p-3">
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
            Club activo
          </div>
          <div className="mt-0.5 flex items-center justify-between">
            <div className="text-sm font-bold text-stone-900">
              {primary.clubName}
            </div>
            {session.memberships.length > 1 && (
              <CaretDownIcon size={14} className="text-stone-400" />
            )}
          </div>
          <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-800">
            {roleLabel(primary.role)}
          </div>
        </div>

        {isSuperadmin && (
          <Link
            href="/admin"
            className="group mt-3 flex items-center justify-between gap-2 rounded-2xl border border-amber-300 bg-gradient-to-br from-amber-50 to-amber-100 px-3 py-2.5 transition hover:from-amber-100 hover:to-amber-200"
          >
            <div className="flex items-center gap-2 min-w-0">
              <ShieldStarIcon
                size={18}
                weight="fill"
                className="shrink-0 text-amber-700"
              />
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700">
                  Superadmin
                </div>
                <div className="truncate text-xs font-bold text-stone-900">
                  Panel del sistema
                </div>
              </div>
            </div>
            <ArrowRightIcon
              size={12}
              weight="bold"
              className="shrink-0 text-amber-700 transition group-hover:translate-x-0.5"
            />
          </Link>
        )}
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-6">
        {sections.map((section) => (
          <div key={section.title}>
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400">
              {section.title}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-bold text-stone-700 transition hover:bg-stone-100 hover:text-brand-700"
                >
                  <span className="text-stone-400 transition group-hover:text-brand-600">
                    <NavIcon name={item.icon} weight="duotone" />
                  </span>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-stone-200 p-4">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400">
          Sesión
        </div>
        <div className="truncate px-3 pb-2 text-xs font-medium text-stone-600">
          {session.user.email}
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-stone-500 transition hover:bg-stone-100 hover:text-red-700"
          >
            <SignOutIcon size={14} weight="bold" /> Salir
          </button>
        </form>
      </div>
    </aside>
  );
}
