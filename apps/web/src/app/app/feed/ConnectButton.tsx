'use client';

import { useState, useTransition } from 'react';
import { UserPlusIcon, CheckIcon } from '@phosphor-icons/react/dist/ssr';
import { connectAction } from './actions';

export function ConnectButton({ recipientId }: { recipientId: string }) {
  const [sent, setSent] = useState(false);
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={sent || pending}
      onClick={() => {
        start(async () => {
          const fd = new FormData();
          fd.set('recipientId', recipientId);
          await connectAction(fd);
          setSent(true);
        });
      }}
      className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${
        sent
          ? 'bg-emerald-100 text-emerald-700'
          : 'border border-stone-300 text-stone-700 hover:border-brand-300 hover:text-brand-700'
      }`}
      title="Conectar"
    >
      {sent ? (
        <CheckIcon size={12} weight="bold" />
      ) : (
        <UserPlusIcon size={12} weight="bold" />
      )}
    </button>
  );
}
