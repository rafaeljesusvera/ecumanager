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
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4 md:mb-10">
      <div className="min-w-0">
        <p className="label-eyebrow">{eyebrow}</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-stone-900 md:text-6xl">
          {title}
        </h1>
        {description && (
          <p className="mt-3 max-w-xl text-sm font-medium leading-relaxed text-stone-500 md:text-base">
            {description}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </header>
  );
}
