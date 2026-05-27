export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
          {eyebrow}
        </p>
        <h1 className="mt-1 text-3xl font-bold text-stone-900 md:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 max-w-xl text-sm font-medium text-stone-500">
            {description}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </header>
  );
}
