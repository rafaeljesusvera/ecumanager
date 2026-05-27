'use server';

import { createAdminClient, createServerClient } from '@equmanager/auth';
import { redirect } from 'next/navigation';

export async function signInWithPassword(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  const supabase = await createServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }
  redirect('/app');
}

/**
 * Signup directo sin confirmación de email: creamos el usuario con
 * `email_confirm: true` usando la service role key y a continuación
 * iniciamos sesión con el cliente SSR. Cuando vayamos a producción real
 * volveremos a activar la doble verificación.
 */
export async function signUpWithPassword(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const fullName = String(formData.get('fullName') ?? '').trim();

  if (!email || password.length < 8) {
    redirect('/signup?error=' + encodeURIComponent('Email o contraseña inválidos'));
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }
  if (!data?.user) {
    redirect('/signup?error=' + encodeURIComponent('No se pudo crear la cuenta'));
  }

  // Inicia sesión inmediatamente con el cliente SSR para que las cookies
  // queden establecidas en la respuesta.
  const supabase = await createServerClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError) {
    redirect(`/login?error=${encodeURIComponent(signInError.message)}`);
  }

  redirect('/onboarding');
}

export async function signOut() {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  redirect('/login');
}
