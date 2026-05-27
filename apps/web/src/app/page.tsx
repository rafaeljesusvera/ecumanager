import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 px-6 text-white">
      <div className="mb-6 text-7xl">🏇</div>
      <h1 className="mb-2 text-5xl font-black tracking-tight">Equmanager</h1>
      <p className="mb-10 max-w-md text-center text-sm font-bold text-stone-400">
        Sistema de gestión integral para clubes ecuestres.
      </p>

      <div className="flex w-full max-w-xs flex-col gap-3">
        <Link
          href="/login"
          className="w-full rounded-2xl bg-brand-400 px-5 py-4 text-center text-sm font-black uppercase tracking-widest text-stone-900 transition hover:bg-brand-300"
        >
          Acceder al panel
        </Link>
        <Link
          href="/signup"
          className="w-full rounded-2xl border border-stone-700 px-5 py-4 text-center text-sm font-black uppercase tracking-widest text-white transition hover:bg-stone-800"
        >
          Crear cuenta
        </Link>
      </div>

      <p className="mt-10 text-[10px] font-bold text-stone-600">
        v0.1.0 · próximamente versión completa
      </p>
    </main>
  );
}
