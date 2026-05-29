/**
 * Etiqueta legible para cada ClubRole. Módulo neutro (sin importar
 * @equmanager/auth/server) para poder usarse desde server y client.
 */
import type { ClubRole } from '@equmanager/domain';

export function roleLabel(role: ClubRole): string {
  return {
    owner: 'Propietario hípica',
    admin: 'Administrador',
    instructor: 'Monitor',
    groom: 'Mozo',
    horse_owner: 'Propietario caballo',
    rider: 'Alumno',
    provider: 'Proveedor',
  }[role];
}
