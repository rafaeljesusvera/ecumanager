import Image from 'next/image';
import { HorseIcon, MedalIcon } from '@phosphor-icons/react/dist/ssr';

export type BadgeCardData = {
  name: string;
  subtitle?: string | null;
  categoryLabel?: string | null;
  description?: string | null;
  iconUrl?: string | null;
  color?: string | null;
};

/**
 * Tarjeta de insignia tipo carta coleccionable.
 *  - Fondo con el color elegido + bandas diagonales sutiles.
 *  - Medallón circular con laurel dorado alrededor de la foto/icono.
 *  - Título grande en uppercase + chip con el subtítulo.
 *  - Categoría con separador y línea identificadora del club.
 */
export function BadgeCard({
  badge,
  clubName,
  recipientName,
  recipientLabel = 'Alumno',
  ratio = 'card',
}: {
  badge: BadgeCardData;
  clubName?: string;
  recipientName?: string | null;
  recipientLabel?: string;
  ratio?: 'card' | 'tall' | 'compact';
}) {
  const color = badge.color ?? '#3f8649';
  const aspect =
    ratio === 'tall'
      ? 'aspect-[5/8]'
      : ratio === 'compact'
        ? 'aspect-[3/4]'
        : 'aspect-[3/4.4]';

  return (
    <article
      className={`relative ${aspect} w-full overflow-hidden rounded-[28px] shadow-soft ring-1 ring-black/5`}
      style={{ backgroundColor: color }}
    >
      {/* Bandas diagonales decorativas */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 35%),
            linear-gradient(115deg, rgba(0,0,0,0.0) 50%, rgba(0,0,0,0.18) 75%, rgba(0,0,0,0) 95%),
            linear-gradient(60deg, rgba(255,255,255,0.0) 50%, rgba(255,255,255,0.22) 62%, rgba(255,255,255,0) 75%)
          `,
        }}
      />

      {/* Brillo superior */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 left-1/2 h-48 w-[140%] -translate-x-1/2 rounded-full"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 70%)',
        }}
      />

      <div className="relative flex h-full flex-col items-center px-5 py-6 text-white">
        <p className="text-[10px] font-black uppercase tracking-[0.32em] text-white/80">
          {clubName ?? 'Hípica'}
        </p>

        {/* Medallón */}
        <div className="mt-3">
          <Medallion src={badge.iconUrl ?? null} alt={badge.name} />
        </div>

        {/* Title */}
        <h3 className="mt-3 line-clamp-2 px-2 text-center text-xl font-black uppercase tracking-tight text-white drop-shadow-sm md:text-2xl">
          {badge.name}
        </h3>

        {/* Subtitle chip */}
        {badge.subtitle && (
          <span className="mt-2 inline-flex items-center rounded-full bg-white/95 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-stone-900 shadow ring-1 ring-black/5">
            {badge.subtitle}
          </span>
        )}

        {/* Category line */}
        {badge.categoryLabel && (
          <p className="mt-3 text-center text-sm font-black uppercase tracking-[0.18em] text-white">
            {badge.categoryLabel}
          </p>
        )}

        {/* Recipient block */}
        <div className="mt-auto flex w-full items-end gap-3 pt-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/30">
            <HorseIcon size={18} weight="duotone" className="text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/80">
              {recipientLabel}
            </p>
            <p className="line-clamp-1 text-sm font-black text-white">
              {recipientName ?? clubName ?? '—'}
            </p>
            {clubName && recipientName && (
              <p className="line-clamp-1 text-[10px] font-bold text-white/80">
                Club de Hípica {clubName}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-3 w-full border-t border-white/25 pt-2 text-center text-[10px] font-black uppercase tracking-[0.22em] text-white/90">
          Escuela de hípica · {clubName ?? 'Equmanager'}
        </div>
      </div>
    </article>
  );
}

function Medallion({ src, alt }: { src: string | null; alt: string }) {
  return (
    <div className="relative h-32 w-32 md:h-40 md:w-40">
      {/* Aro exterior dorado */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            'conic-gradient(from 220deg, #f7e08a, #b48721, #f4c757, #8a5e10, #f7e08a)',
          padding: 4,
        }}
      >
        <div className="h-full w-full rounded-full bg-stone-900/20" />
      </div>

      {/* Laurel SVG */}
      <Laurel className="absolute inset-0 h-full w-full text-amber-200/95" />

      {/* Imagen / icono interior */}
      <div className="absolute inset-3 overflow-hidden rounded-full bg-stone-100 ring-2 ring-white/70">
        {src ? (
          <Image
            src={src}
            alt={alt}
            fill
            className="object-cover"
            sizes="160px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-stone-200 to-stone-300">
            <MedalIcon
              size={56}
              weight="duotone"
              className="text-stone-500"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function Laurel({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <g opacity="0.85">
        {/* Rama izquierda */}
        <path d="M14 50c0-14 8-26 22-32" />
        <path d="M16 42c4 0 8-2 10-6" />
        <path d="M19 48c4 0 8-2 10-6" />
        <path d="M22 54c4 0 8-2 10-6" />
        <path d="M26 60c4 0 8-2 10-6" />
        <path d="M30 66c4 0 8-2 10-6" />
        {/* Rama derecha */}
        <path d="M86 50c0-14-8-26-22-32" />
        <path d="M84 42c-4 0-8-2-10-6" />
        <path d="M81 48c-4 0-8-2-10-6" />
        <path d="M78 54c-4 0-8-2-10-6" />
        <path d="M74 60c-4 0-8-2-10-6" />
        <path d="M70 66c-4 0-8-2-10-6" />
        {/* Estrellas */}
        <circle cx="50" cy="14" r="1.5" fill="currentColor" />
        <circle cx="40" cy="16" r="1" fill="currentColor" />
        <circle cx="60" cy="16" r="1" fill="currentColor" />
      </g>
    </svg>
  );
}
