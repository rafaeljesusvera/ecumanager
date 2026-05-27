/**
 * Constantes y enums del dominio de Equmanager.
 *
 * Extraído del prototipo original (legacy/equmanager.html) y normalizado.
 * Esta es la fuente única de verdad: cualquier lista de opciones de la UI
 * debe importar de aquí.
 */

export const HORSE_KINDS = ['caballo', 'pony', 'shetland'] as const;
export type HorseKind = (typeof HORSE_KINDS)[number];

export const HORSE_STATUSES = ['activo', 'baja', 'descanso'] as const;
export type HorseStatus = (typeof HORSE_STATUSES)[number];

export const DISCIPLINES = [
  'salto',
  'doma',
  'iniciacion',
  'concurso_completo',
  'raid',
  'otros',
] as const;
export type Discipline = (typeof DISCIPLINES)[number];

export const LESSON_STATUSES = ['programada', 'realizada', 'cancelada'] as const;
export type LessonStatus = (typeof LESSON_STATUSES)[number];

export const RIDER_CATEGORIES = [
  'pony_a',
  'pony_b',
  'pony_c',
  'pony_d',
  'infantil',
  'juvenil',
  'adulto',
  'veterano',
] as const;
export type RiderCategory = (typeof RIDER_CATEGORIES)[number];

export const RIDER_TIERS = ['iniciacion', 'avanzado', 'competicion'] as const;
export type RiderTier = (typeof RIDER_TIERS)[number];

/**
 * Roles dentro de un club. Definen permisos vía RLS.
 *
 * - owner: dueño del club, control total, no se puede eliminar mientras exista
 * - admin: gestiona caballos, jinetes, instructores, configuración
 * - instructor: imparte clases, gestiona sus propios eventos
 * - rider: jinete del club, solo lee sus propios datos
 */
export const CLUB_ROLES = ['owner', 'admin', 'instructor', 'rider'] as const;
export type ClubRole = (typeof CLUB_ROLES)[number];

/**
 * Planes de suscripción. Por ahora solo "free", preparado para crecer.
 */
export const CLUB_PLANS = ['free', 'pro', 'enterprise'] as const;
export type ClubPlan = (typeof CLUB_PLANS)[number];
