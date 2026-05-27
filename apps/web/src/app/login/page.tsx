import Link from 'next/link';
import { signInWithPassword } from '../auth/actions';

export const metadata = { title: 'Iniciar sesión' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-stone-900 to-stone-800 p-6">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <div className="mb-2 text-5xl">🏇</div>
          <h1 className="text-2xl font-black text-stone-900">Equmanager</h1>
          <p className="mt-1 text-xs font-bold uppercase tracking-widest text-stone-500">
            Iniciar sesión
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700">
            {error}
          </div>
        )}

        <form action={signInWithPassword} className="space-y-3">
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-stone-500">
              Email
            </span>
            <input
              required
              type="email"
              name="email"
              className="w-full rounded-xl border-2 border-stone-200 p-3 text-sm font-bold outline-none focus:border-brand-400"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-stone-500">
              Contraseña
            </span>
            <input
              required
              type="password"
              name="password"
              minLength={6}
              className="w-full rounded-xl border-2 border-stone-200 p-3 text-sm font-bold outline-none focus:border-brand-400"
            />
          </label>
          <button
            type="submit"
            className="w-full rounded-xl bg-stone-900 py-3 text-sm font-black uppercase tracking-widest text-brand-300 transition hover:bg-stone-800"
          >
            Entrar
          </button>
        </form>

        <p className="mt-5 text-center text-xs font-bold text-stone-500">
          ¿No tienes cuenta?{' '}
          <Link href="/signup" className="text-brand-600 underline">
            Crear una
          </Link>
        </p>
      </div>
    </main>
  );
}
