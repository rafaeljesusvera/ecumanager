import Image from 'next/image';

export function LogoFull({ className = '' }: { className?: string }) {
  return (
    <Image
      src="/equmanager-logo.png"
      alt="Equmanager"
      width={420}
      height={210}
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
  return (
    <Image
      src="/equmanager-mark.png"
      alt="Equmanager"
      width={size}
      height={size}
      priority
      className={className}
    />
  );
}
