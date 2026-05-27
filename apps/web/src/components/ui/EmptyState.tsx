import type { ReactNode } from 'react';

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-stone-300 bg-white p-10 text-center">
      {icon && (
        <div className="mb-3 flex justify-center text-brand-600">{icon}</div>
      )}
      <h2 className="text-lg font-bold text-stone-900">{title}</h2>
      {description && (
        <p className="mx-auto mt-2 max-w-md text-sm font-medium text-stone-500">
          {description}
        </p>
      )}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
