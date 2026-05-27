'use client';

import { useRef, type SelectHTMLAttributes } from 'react';

export function AutoSubmitSelect({
  className = 'rounded-full border border-stone-200 bg-stone-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-stone-700 outline-none',
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  const ref = useRef<HTMLSelectElement>(null);
  return (
    <select
      ref={ref}
      className={className}
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
      {...props}
    />
  );
}
