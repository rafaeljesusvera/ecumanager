import { type LabelHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Label({
  className,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        'mb-1.5 block text-[11px] font-bold uppercase tracking-[0.16em] text-stone-600',
        className,
      )}
      {...props}
    />
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="block">
      <Label>{label}</Label>
      {children}
      {hint && (
        <p className="mt-1 text-[11px] font-medium text-stone-500">{hint}</p>
      )}
    </div>
  );
}
