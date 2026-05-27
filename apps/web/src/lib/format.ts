export function formatCents(
  cents: number | null | undefined,
  currency = 'EUR',
): string {
  if (cents == null) return '—';
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function parseEurosToCents(input: string | number | null): number {
  if (input == null) return 0;
  const n =
    typeof input === 'number'
      ? input
      : Number(String(input).replace(/[^0-9.,]/g, '').replace(',', '.'));
  return Math.round((Number.isFinite(n) ? n : 0) * 100);
}

export function formatDateTime(
  d: Date | string | null | undefined,
  opts?: Intl.DateTimeFormatOptions,
): string {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    ...opts,
  }).format(date);
}

export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function toDatetimeLocal(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
