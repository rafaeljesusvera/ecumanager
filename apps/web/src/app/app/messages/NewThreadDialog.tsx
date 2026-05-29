'use client';

import { useState } from 'react';
import { PlusIcon, XIcon } from '@phosphor-icons/react/dist/ssr';
import { Avatar, Button, Input, Textarea } from '@/components/ui';
import { roleLabel } from '@/lib/role-label';
import type { ClubRole } from '@equmanager/domain';
import { startDirectThreadAction } from './actions';

type Peer = {
  id: string;
  fullName: string | null;
  email: string;
  avatarUrl: string | null;
  clubName: string;
  role: ClubRole;
};

export function NewThreadDialog({ peers }: { peers: Peer[] }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [body, setBody] = useState('');

  const filtered = peers
    .filter((p) => {
      if (!q.trim()) return true;
      const hay = `${p.fullName ?? ''} ${p.email}`.toLowerCase();
      return hay.includes(q.toLowerCase());
    })
    .slice(0, 40);

  const selected = peers.find((p) => p.id === selectedId);

  function reset() {
    setOpen(false);
    setQ('');
    setSelectedId(null);
    setBody('');
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm" variant="outline">
        <PlusIcon size={14} weight="bold" /> Nuevo mensaje
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4">
          <div className="w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-lift">
            <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
              <h2 className="text-base font-bold text-stone-900">
                Nuevo mensaje
              </h2>
              <button
                type="button"
                onClick={reset}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-stone-500 hover:bg-stone-100"
              >
                <XIcon size={14} weight="bold" />
              </button>
            </div>

            {!selected ? (
              <div className="p-5">
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Busca a alguien de tu(s) centro(s)…"
                  autoFocus
                />
                <div className="mt-3 max-h-72 overflow-y-auto rounded-2xl border border-stone-200">
                  {filtered.length === 0 ? (
                    <p className="px-3 py-5 text-center text-xs font-medium text-stone-500">
                      Sin resultados.
                    </p>
                  ) : (
                    filtered.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedId(p.id)}
                        className="flex w-full items-center gap-3 border-b border-stone-100 px-3 py-2 text-left last:border-b-0 hover:bg-stone-50"
                      >
                        <Avatar
                          name={p.fullName ?? p.email}
                          src={p.avatarUrl}
                          size="md"
                        />
                        <div className="min-w-0">
                          <div className="truncate text-sm font-bold text-stone-900">
                            {p.fullName ?? p.email}
                          </div>
                          <div className="truncate text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
                            {roleLabel(p.role)} · {p.clubName}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <form
                action={async (fd: FormData) => {
                  fd.set('recipientId', selected.id);
                  fd.set('body', body);
                  await startDirectThreadAction(fd);
                  reset();
                }}
                className="p-5"
              >
                <div className="mb-3 flex items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-3">
                  <Avatar
                    name={selected.fullName ?? selected.email}
                    src={selected.avatarUrl}
                    size="md"
                  />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-stone-900">
                      {selected.fullName ?? selected.email}
                    </div>
                    <div className="truncate text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
                      {roleLabel(selected.role)} · {selected.clubName}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedId(null)}
                    className="ml-auto rounded-lg border border-stone-300 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-stone-600 hover:border-red-300 hover:text-red-700"
                  >
                    Cambiar
                  </button>
                </div>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={4}
                  placeholder="Escribe tu mensaje…"
                  required
                />
                <div className="mt-3 flex justify-end">
                  <Button type="submit" disabled={!body.trim()}>
                    Enviar
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
