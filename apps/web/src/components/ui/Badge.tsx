import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type Tone = 'brand' | 'neutral' | 'success' | 'warn' | 'danger' | 'info';

const tones: Record<Tone, string> = {
  brand: 'bg-brand-100 text-brand-800 ring-1 ring-inset ring-brand-200',
  neutral: 'bg-stone-100 text-stone-700 ring-1 ring-inset ring-stone-200',
  success: 'bg-emerald-100 text-emerald-800 ring-1 ring-inset ring-emerald-200',
  warn: 'bg-amber-100 text-amber-800 ring-1 ring-inset ring-amber-200',
  danger: 'bg-red-100 text-red-800 ring-1 ring-inset ring-red-200',
  info: 'bg-sky-100 text-sky-800 ring-1 ring-inset ring-sky-200',
};

export function Badge({
  className,
  tone = 'neutral',
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em]',
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
