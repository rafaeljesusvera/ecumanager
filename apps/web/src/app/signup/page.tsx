import Link from 'next/link';
import { signUpWithPassword } from '../auth/actions';

export const metadata = { title: 'Crear cuenta' };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-stone-900 to-stone-800 p-6">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <div className="mb-2 text-5xl">🏇</div>
          <h1 className="text-2xl font-black text-stone-900">Crear cuenta</h1>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3 text-xs font-bold text-green-700">
            {message}
          </div>
        )}

        <form action={signUpWithPassword} className="space-y-3">
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-stone-500">
              Nombre completo
            </span>
            <input
              required
              type="text"
              name="fullName"
              className="w-full rounded-xl border-2 border-stone-200 p-3 text-sm font-bold outline-none focus:border-brand-400"
            />
          </label>
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
              Contraseña (mín. 8)
            </span>
            <input
              required
              type="password"
              name="password"
              minLength={8}
              className="w-full rounded-xl border-2 border-stone-200 p-3 text-sm font-bold outline-none focus:border-brand-400"
            />
          </label>
          <button
            type="submit"
            className="w-full rounded-xl bg-stone-900 py-3 text-sm font-black uppercase tracking-widest text-brand-300 transition hover:bg-stone-800"
          >
            Crear cuenta
          </button>
        </form>

        <p className="mt-5 text-center text-xs font-bold text-stone-500">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-brand-600 underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </main>
  );
}
