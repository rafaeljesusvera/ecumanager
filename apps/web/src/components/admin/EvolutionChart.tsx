/**
 * Gráfica SVG de evolución mensual (acumulada), sin librerías externas.
 * - Eje X implícito: meses (etiquetas debajo).
 * - Eje Y implícito: valor total al cierre de cada mes.
 * - Pinta área + línea + último punto destacado.
 */

export type EvolutionPoint = {
  label: string;
  value: number;
};

export function EvolutionChart({
  data,
  title,
  total,
  growthLabel,
  accent = '#3f8649',
}: {
  data: EvolutionPoint[];
  title: string;
  total: number;
  growthLabel?: string;
  accent?: string;
}) {
  const W = 320;
  const H = 80;
  const PAD = 4;

  const max = Math.max(1, ...data.map((d) => d.value));
  const stepX = data.length > 1 ? (W - PAD * 2) / (data.length - 1) : 0;
  const points = data.map((d, i) => {
    const x = PAD + i * stepX;
    const y =
      H - PAD - ((H - PAD * 2) * d.value) / max;
    return { x, y, d };
  });
  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ');
  const areaPath =
    points.length === 0
      ? ''
      : `${linePath} L ${(PAD + (points.length - 1) * stepX).toFixed(2)} ${H - PAD} L ${PAD} ${H - PAD} Z`;
  const last = points[points.length - 1];

  return (
    <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-card">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
            {title}
          </h3>
          <div className="mt-1 text-3xl font-bold tracking-tight text-stone-900">
            {total.toLocaleString('es-ES')}
          </div>
        </div>
        {growthLabel && (
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em]"
            style={{ background: `${accent}1A`, color: accent }}
          >
            {growthLabel}
          </span>
        )}
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="mt-3 h-20 w-full"
        aria-hidden
      >
        <defs>
          <linearGradient id={`grad-${title}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.35" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </linearGradient>
        </defs>
        {areaPath && (
          <path d={areaPath} fill={`url(#grad-${title})`} stroke="none" />
        )}
        {linePath && (
          <path
            d={linePath}
            stroke={accent}
            strokeWidth="1.5"
            fill="none"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}
        {last && (
          <circle
            cx={last.x}
            cy={last.y}
            r="2.5"
            fill={accent}
            stroke="#fff"
            strokeWidth="1.2"
          />
        )}
      </svg>

      {data.length > 0 && (
        <div className="mt-1 flex items-center justify-between text-[9px] font-bold uppercase tracking-widest text-stone-400">
          <span>{data[0]!.label}</span>
          <span>{data[data.length - 1]!.label}</span>
        </div>
      )}
    </article>
  );
}
