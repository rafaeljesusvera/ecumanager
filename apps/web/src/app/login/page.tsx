import Link from 'next/link';
import { signInWithPassword } from '../auth/actions';
import { LogoMark } from '@/components/brand/Logo';
import { Button, Field, Input } from '@/components/ui';

export const metadata = { title: 'Iniciar sesión' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-stone-50 to-stone-100 p-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center">
          <LogoMark size={56} />
          <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.22em] text-stone-500">
            Bienvenido de vuelta
          </p>
        </div>

        <div className="rounded-3xl border border-stone-200 bg-white p-7 shadow-soft">
          <h1 className="text-xl font-bold text-stone-900">Iniciar sesión</h1>
          <p className="mt-1 text-sm font-medium text-stone-500">
            Accede a tu panel con tu correo.
          </p>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
              {error}
            </div>
          )}

          <form action={signInWithPassword} className="mt-5 space-y-3">
            <Field label="Email">
              <Input required type="email" name="email" placeholder="tu@correo.com" />
            </Field>
            <Field label="Contraseña">
              <Input required type="password" name="password" minLength={6} />
            </Field>
            <Button type="submit" size="lg" className="mt-2 w-full">
              Entrar
            </Button>
          </form>

          <p className="mt-6 text-center text-xs font-medium text-stone-500">
            ¿No tienes cuenta?{' '}
            <Link
              href="/signup"
              className="font-bold uppercase tracking-[0.14em] text-brand-700 hover:text-brand-900"
            >
              Crear una
            </Link>
          </p>
        </div>

        <p className="mt-4 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-stone-400">
          <Link href="/" className="hover:text-brand-700">
            ← Volver al inicio
          </Link>
        </p>
      </div>
    </main>
  );
}
