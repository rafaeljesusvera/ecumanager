import Image from 'next/image';

// Dimensiones reales de los PNG:
//   em_logo.png  (LogoFull):  1208 x 993   (caballo + texto debajo)
//   em_fav.png   (LogoMark):  956 x 993    (sólo caballo)
const FULL_RATIO = 1208 / 993;
const MARK_RATIO = 956 / 993;

export function LogoFull({ className = '' }: { className?: string }) {
  return (
    <Image
      src="/em_logo.png"
      alt="Equmanager"
      width={420}
      height={Math.round(420 / FULL_RATIO)}
      priority
      className={className}
    />
  );
}

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
      src="/em_fav.png"
      alt="Equmanager"
      width={width}
      height={size}
      priority
      className={className}
    />
  );
}
