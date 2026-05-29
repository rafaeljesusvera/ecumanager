/**
 * Cookie del "perfil activo" para el switcher tipo Google.
 *
 * Cuando un usuario tiene perfiles vinculados (sus hijos riders, su madre,
 * etc.), elige uno desde el panel del header. Aquí guardamos la elección.
 *
 * Formato del valor: `<scope>:<id>` donde scope es `profile` o `rider`.
 * Si la cookie está vacía o no se reconoce, se asume el perfil propio.
 */
import { cookies } from 'next/headers';

const COOKIE = 'eq_active_profile';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 días

export type ActiveProfileSelection =
  | { kind: 'self' }
  | { kind: 'profile'; profileId: string }
  | { kind: 'rider'; riderId: string };

export async function setActiveProfile(selection: ActiveProfileSelection) {
  const store = await cookies();
  if (selection.kind === 'self') {
    store.delete(COOKIE);
    return;
  }
  const value =
    selection.kind === 'profile'
      ? `profile:${selection.profileId}`
      : `rider:${selection.riderId}`;
  store.set(COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: MAX_AGE,
    path: '/',
  });
}

export async function getActiveProfile(): Promise<ActiveProfileSelection> {
  const store = await cookies();
  const raw = store.get(COOKIE)?.value;
  if (!raw) return { kind: 'self' };
  const [scope, id] = raw.split(':');
  if (scope === 'profile' && id) return { kind: 'profile', profileId: id };
  if (scope === 'rider' && id) return { kind: 'rider', riderId: id };
  return { kind: 'self' };
}

export async function clearActiveProfile() {
  const store = await cookies();
  store.delete(COOKIE);
}
