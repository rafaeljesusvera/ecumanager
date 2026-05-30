'use client';

export function MessageTime({ date }: { date: Date | string }) {
  return (
    <>
      {new Date(date).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      })}
    </>
  );
}
