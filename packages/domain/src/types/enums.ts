/**
 * Constantes y enums del dominio de Equmanager.
 * Fuente única de verdad para opciones de UI.
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
 * Roles dentro de un club.
 *  - owner: dueño de la hípica, control total
 *  - admin: gestiona caballos, jinetes, instructores, configuración
 *  - instructor: imparte clases y eventos
 *  - groom: mozo de cuadra, ejecuta checklists de cuidado
 *  - horse_owner: propietario de uno o más caballos del club
 *  - rider: alumno/corredor, se apunta a clases y eventos
 */
export const CLUB_ROLES = [
  'owner',
  'admin',
  'instructor',
  'groom',
  'horse_owner',
  'rider',
] as const;
export type ClubRole = (typeof CLUB_ROLES)[number];

export const CLUB_PLANS = ['free', 'pro', 'enterprise'] as const;
export type ClubPlan = (typeof CLUB_PLANS)[number];

export const COURSE_STATUSES = [
  'borrador',
  'publicado',
  'cerrado',
  'archivado',
] as const;
export type CourseStatus = (typeof COURSE_STATUSES)[number];

export const EVENT_KINDS = [
  'competicion',
  'concurso_social',
  'salida',
  'clinic',
  'charla',
  'otros',
] as const;
export type EventKind = (typeof EVENT_KINDS)[number];

export const EVENT_STATUSES = [
  'borrador',
  'publicado',
  'finalizado',
  'cancelado',
] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const ENROLLMENT_TARGET_TYPES = [
  'curso',
  'clase',
  'evento',
] as const;
export type EnrollmentTargetType = (typeof ENROLLMENT_TARGET_TYPES)[number];

export const ENROLLMENT_STATUSES = [
  'pendiente',
  'confirmada',
  'cancelada',
  'lista_espera',
] as const;
export type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[number];

export const PAYMENT_STATUSES = [
  'pendiente',
  'procesando',
  'completado',
  'fallido',
  'reembolsado',
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_PROVIDERS = ['stripe_fake', 'stripe', 'efectivo'] as const;
export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];

export const CARE_ITEM_KINDS = [
  'alimentacion',
  'agua',
  'limpieza_box',
  'cepillado',
  'cascos',
  'salida_paddock',
  'medicacion',
  'observacion_general',
  'otros',
] as const;
export type CareItemKind = (typeof CARE_ITEM_KINDS)[number];

export const VOICE_NOTE_STATUSES = [
  'subida',
  'transcribiendo',
  'analizando',
  'lista_para_revision',
  'confirmada',
  'descartada',
  'error',
] as const;
export type VoiceNoteStatus = (typeof VOICE_NOTE_STATUSES)[number];

export const FEEDBACK_SOURCES = ['manual', 'ia', 'auto'] as const;
export type FeedbackSource = (typeof FEEDBACK_SOURCES)[number];

export const NOTIFICATION_KINDS = [
  'sistema',
  'inscripcion',
  'pago',
  'checklist',
  'feedback',
  'insignia',
  'evento',
  'noticia',
] as const;
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];
