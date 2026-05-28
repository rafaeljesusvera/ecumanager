import Image from 'next/image';

// Dimensiones reales de los PNG:
//   equmanager-logo.png  (LogoFull):  900 x 472   (texto + caballo)
//   equmanager-mark.png  (LogoMark):  677 x 369   (sólo caballo)
const FULL_RATIO = 900 / 472;
const MARK_RATIO = 677 / 369;

export function LogoFull({ className = '' }: { className?: string }) {
  return (
    <Image
      src="/equmanager-logo.png"
      alt="Equmanager"
      width={420}
      height={Math.round(420 / FULL_RATIO)}
      priority
      className={className}
    />
  );
}

/**
 * Marca (sólo el caballo). El `size` define la **altura** en píxeles;
 * el ancho se calcula automáticamente respetando el aspect ratio real
 * del PNG (1.83:1), así no sale chafado ni pierde proporción.
 */
export function LogoMark({
  size = 40,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  const width = Math.round(size * MARK_RATIO);
  return (
    <Image
      src="/equmanager-mark.png"
      alt="Equmanager"
      width={width}
      height={size}
      priority
      className={className}
    />
  );
}
