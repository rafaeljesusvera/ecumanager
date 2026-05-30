'use client';

import { useMemo, useState } from 'react';
import {
  MagnifyingGlassIcon,
  ShieldStarIcon,
  XCircleIcon,
  EyeIcon,
} from '@phosphor-icons/react/dist/ssr';
import { Avatar, Badge, Input, Select } from '@/components/ui';
import { roleLabel } from '@/lib/role-label';
import type { ClubRole } from '@equmanager/domain';
import { impersonateUserAction } from './actions';

export type UserRow = {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  createdAt: string; // ISO desde server (Date no serializa al client)
  isSuperadmin: boolean | null;
  memberships: Array<{ role: ClubRole; clubName: string }>;
};

const ROLE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: 'Todos los roles' },
  { value: 'owner', label: 'Propietario hípica' },
  { value: 'admin', label: 'Administrador' },
  { value: 'instructor', label: 'Instructor' },
  { value: 'horse_owner', label: 'Propietario caballo' },
  { value: 'rider', label: 'Alumno' },
  { value: 'groom', label: 'Mozo' },
];

export function UsersExplorer({
  users,
  clubs,
  currentUserId,
}: {
  users: UserRow[];
  clubs: string[];
  currentUserId: string;
}) {
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [clubFilter, setClubFilter] = useState('');
  const [onlySuper, setOnlySuper] = useState(false);
  const [withoutClub, setWithoutClub] = useState(false);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return users.filter((u) => {
      if (onlySuper && !u.isSuperadmin) return false;
      if (withoutClub && u.memberships.length > 0) return false;
      if (role && !u.memberships.some((m) => m.role === role)) return false;
      if (clubFilter && !u.memberships.some((m) => m.clubName === clubFilter))
        return false;
      if (needle) {
        const hay = `${u.fullName ?? ''} ${u.email}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [users, q, role, clubFilter, onlySuper, withoutClub]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const u of filtered) {
      for (const m of u.memberships) {
        c[m.role] = (c[m.role] ?? 0) + 1;
      }
    }
    return c;
  }, [filtered]);

  const hasActiveFilter =
    q.trim().length > 0 ||
    role !== '' ||
    clubFilter !== '' ||
    onlySuper ||
    withoutClub;

  function clearAll() {
    setQ('');
    setRole('');
    setClubFilter('');
    setOnlySuper(false);
    setWithoutClub(false);
  }

  return (
    <>
      {/* Filtros */}
      <div className="mt-6 rounded-3xl border border-stone-200 bg-white p-4 shadow-card">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="relative">
              <MagnifyingGlassIcon
                size={14}
                weight="bold"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
              />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por nombre o email…"
                className="pl-9"
              />
            </div>
          </div>
          <div className="md:col-span-3">
            <Select value={role} onChange={(e) => setRole(e.target.value)}>
              {ROLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="md:col-span-3">
            <Select
              value={clubFilter}
              onChange={(e) => setClubFilter(e.target.value)}
            >
              <option value="">Todos los clubes</option>
              {clubs.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex items-center justify-end md:col-span-1">
            {hasActiveFilter && (
              <button
                type="button"
                onClick={clearAll}
                className="flex h-9 items-center gap-1.5 rounded-xl border border-stone-200 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-stone-600 transition hover:border-red-300 hover:text-red-700"
                aria-label="Quitar filtros"
              >
                <XCircleIcon size={14} weight="bold" />
                Quitar
              </button>
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <ToggleChip active={onlySuper} onClick={() => setOnlySuper((v) => !v)}>
            <ShieldStarIcon size={11} weight="fill" /> Solo superadmin
          </ToggleChip>
          <ToggleChip
            active={withoutClub}
            onClick={() => setWithoutClub((v) => !v)}
          >
            Sin club
          </ToggleChip>
        </div>
      </div>

      {/* KPIs reactivos al filtro */}
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-6">
        <Kpi label="Usuarios" value={filtered.length} />
        <Kpi label="Propietarios hípica" value={counts['owner'] ?? 0} />
        <Kpi label="Administradores" value={counts['admin'] ?? 0} />
        <Kpi label="Instructores" value={counts['instructor'] ?? 0} />
        <Kpi label="Propietarios caballo" value={counts['horse_owner'] ?? 0} />
        <Kpi label="Alumnos" value={counts['rider'] ?? 0} />
      </div>

      {/* Tabla */}
      <div className="mt-6 overflow-x-auto rounded-3xl border border-stone-200 bg-white shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
            <tr>
              <th className="w-12 px-4 py-3"></th>
              <th className="px-4 py-3 text-left">Usuario</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Perfil</th>
              <th className="px-4 py-3 text-left">Hípica</th>
              <th className="px-4 py-3 text-left">Alta</th>
              <th className="px-4 py-3 text-left">Sistema</th>
              <th className="w-12 px-4 py-3 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-10 text-center text-sm font-medium text-stone-500"
                >
                  Sin resultados con esos filtros.
                </td>
              </tr>
            ) : (
              filtered.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3">
                    <Avatar
                      name={u.fullName ?? u.email}
                      src={u.avatarUrl}
                      size="md"
                    />
                  </td>
                  <td className="px-4 py-3 font-bold text-stone-900">
                    {u.fullName ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-stone-600">{u.email}</td>
                  <td className="px-4 py-3">
                    {u.memberships.length === 0 ? (
                      <span className="text-stone-400">—</span>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {u.memberships.map((m, i) => (
                          <span
                            key={i}
                            className="inline-flex w-fit items-center rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-800"
                          >
                            {roleLabel(m.role)}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {u.memberships.length === 0 ? (
                      <span className="text-stone-400">—</span>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {u.memberships.map((m, i) => (
                          <span
                            key={i}
                            className="text-xs font-medium text-stone-700"
                          >
                            {m.clubName}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-stone-500">
                    {new Date(u.createdAt).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3">
                    {u.isSuperadmin && <Badge tone="brand">Superadmin</Badge>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {u.id !== currentUserId && (
                      <form action={impersonateUserAction}>
                        <input
                          type="hidden"
                          name="profileId"
                          value={u.id}
                        />
                        <button
                          type="submit"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-stone-200 text-stone-600 transition hover:border-brand-300 hover:text-brand-700"
                          title={`Ver Equmanager como ${u.fullName ?? u.email}`}
                          aria-label={`Ver como ${u.fullName ?? u.email}`}
                        >
                          <EyeIcon size={14} weight="bold" />
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

function ToggleChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] transition ${
        active
          ? 'border-brand-300 bg-brand-50 text-brand-800'
          : 'border-stone-200 bg-white text-stone-600 hover:border-brand-300 hover:text-brand-700'
      }`}
    >
      {children}
    </button>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-card">
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold tracking-tight text-stone-900">
        {value}
      </div>
    </div>
  );
}
