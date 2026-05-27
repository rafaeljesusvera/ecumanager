-- =============================================================================
-- 0001 — Refactor multi-rol: cursos, eventos, noticias, bonos, IA, cuidados
-- =============================================================================
-- Idempotente: usar IF NOT EXISTS / DO blocks. Aplicable directamente a
-- Supabase. RLS se cubre en migración aparte.
-- =============================================================================

-- ----------------------------------------------------------------------------
-- 1. Ampliar enum club_role con groom y horse_owner
-- ----------------------------------------------------------------------------

DO $$ BEGIN
  ALTER TYPE club_role ADD VALUE IF NOT EXISTS 'groom';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE club_role ADD VALUE IF NOT EXISTS 'horse_owner';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ----------------------------------------------------------------------------
-- 2. Nuevos enums
-- ----------------------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE course_status AS ENUM ('borrador', 'publicado', 'cerrado', 'archivado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE event_kind AS ENUM ('competicion','concurso_social','salida','clinic','charla','otros');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE event_status AS ENUM ('borrador','publicado','finalizado','cancelado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE enrollment_target_type AS ENUM ('curso','clase','evento');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE enrollment_status AS ENUM ('pendiente','confirmada','cancelada','lista_espera');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pendiente','procesando','completado','fallido','reembolsado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_provider AS ENUM ('stripe_fake','stripe','efectivo');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE voice_note_status AS ENUM ('subida','transcribiendo','analizando','lista_para_revision','confirmada','descartada','error');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE feedback_source AS ENUM ('manual','ia','auto');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE notification_kind AS ENUM ('sistema','inscripcion','pago','checklist','feedback','insignia','evento','noticia');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ----------------------------------------------------------------------------
-- 3. Courses
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  discipline text NOT NULL DEFAULT 'iniciacion',
  start_date timestamptz,
  end_date timestamptz,
  price_cents integer NOT NULL DEFAULT 0,
  max_students integer,
  photo_url text,
  status course_status NOT NULL DEFAULT 'borrador',
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS courses_club_idx ON courses(club_id);
CREATE INDEX IF NOT EXISTS courses_club_status_idx ON courses(club_id, status);

CREATE TABLE IF NOT EXISTS course_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  date timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 60,
  notes text
);
CREATE INDEX IF NOT EXISTS course_sessions_course_date_idx ON course_sessions(course_id, date);

-- ----------------------------------------------------------------------------
-- 4. Events
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  kind event_kind NOT NULL DEFAULT 'otros',
  title text NOT NULL,
  description text,
  location text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  price_cents integer NOT NULL DEFAULT 0,
  max_attendees integer,
  photo_url text,
  status event_status NOT NULL DEFAULT 'borrador',
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS events_club_date_idx ON events(club_id, starts_at);
CREATE INDEX IF NOT EXISTS events_club_status_idx ON events(club_id, status);

-- ----------------------------------------------------------------------------
-- 5. News
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  photo_url text,
  pinned boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS news_club_date_idx ON news(club_id, published_at);

-- ----------------------------------------------------------------------------
-- 6. Bonos
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS bonos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  total_classes integer NOT NULL DEFAULT 10,
  price_cents integer NOT NULL DEFAULT 0,
  validity_days integer NOT NULL DEFAULT 180,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bonos_club_idx ON bonos(club_id);

CREATE TABLE IF NOT EXISTS bono_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bono_id uuid NOT NULL REFERENCES bonos(id) ON DELETE CASCADE,
  rider_id uuid NOT NULL REFERENCES riders(id) ON DELETE CASCADE,
  classes_left integer NOT NULL,
  purchased_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  payment_id uuid
);
CREATE INDEX IF NOT EXISTS bono_purchases_rider_idx ON bono_purchases(rider_id);
CREATE INDEX IF NOT EXISTS bono_purchases_bono_idx ON bono_purchases(bono_id);

-- ----------------------------------------------------------------------------
-- 7. Enrollments
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  rider_id uuid REFERENCES riders(id) ON DELETE SET NULL,
  target_type enrollment_target_type NOT NULL,
  target_id uuid NOT NULL,
  status enrollment_status NOT NULL DEFAULT 'pendiente',
  notes text,
  payment_id uuid,
  confirmed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS enrollments_club_idx ON enrollments(club_id);
CREATE INDEX IF NOT EXISTS enrollments_target_idx ON enrollments(target_type, target_id);
CREATE INDEX IF NOT EXISTS enrollments_profile_idx ON enrollments(profile_id);
CREATE INDEX IF NOT EXISTS enrollments_rider_idx ON enrollments(rider_id);

-- ----------------------------------------------------------------------------
-- 8. Payments
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  amount_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'EUR',
  status payment_status NOT NULL DEFAULT 'pendiente',
  provider payment_provider NOT NULL DEFAULT 'stripe_fake',
  reference text,
  description text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS payments_club_idx ON payments(club_id);
CREATE INDEX IF NOT EXISTS payments_profile_idx ON payments(profile_id);
CREATE INDEX IF NOT EXISTS payments_status_idx ON payments(status);

-- ----------------------------------------------------------------------------
-- 9. Horse care
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS horse_care_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS horse_care_templates_club_idx ON horse_care_templates(club_id);

CREATE TABLE IF NOT EXISTS horse_care_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  horse_id uuid NOT NULL REFERENCES horses(id) ON DELETE CASCADE,
  groom_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  template_id uuid REFERENCES horse_care_templates(id) ON DELETE SET NULL,
  for_date date NOT NULL,
  items_done jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS horse_care_logs_horse_date_idx ON horse_care_logs(horse_id, for_date);
CREATE INDEX IF NOT EXISTS horse_care_logs_club_date_idx ON horse_care_logs(club_id, for_date);
CREATE INDEX IF NOT EXISTS horse_care_logs_groom_idx ON horse_care_logs(groom_id);

-- ----------------------------------------------------------------------------
-- 10. Reviews y afinidad
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS horse_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  horse_id uuid NOT NULL REFERENCES horses(id) ON DELETE CASCADE,
  rider_id uuid NOT NULL REFERENCES riders(id) ON DELETE CASCADE,
  rating integer NOT NULL DEFAULT 5,
  title text,
  body text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS horse_reviews_horse_idx ON horse_reviews(horse_id);
CREATE INDEX IF NOT EXISTS horse_reviews_rider_idx ON horse_reviews(rider_id);
CREATE UNIQUE INDEX IF NOT EXISTS horse_reviews_horse_rider_unique ON horse_reviews(horse_id, rider_id);

CREATE TABLE IF NOT EXISTS horse_affinity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  horse_id uuid NOT NULL REFERENCES horses(id) ON DELETE CASCADE,
  rider_id uuid NOT NULL REFERENCES riders(id) ON DELETE CASCADE,
  rides_count integer NOT NULL DEFAULT 0,
  score integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS horse_affinity_horse_rider_unique ON horse_affinity(horse_id, rider_id);
CREATE INDEX IF NOT EXISTS horse_affinity_rider_idx ON horse_affinity(rider_id);
CREATE INDEX IF NOT EXISTS horse_affinity_horse_idx ON horse_affinity(horse_id);

-- ----------------------------------------------------------------------------
-- 11. AI
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ai_voice_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  instructor_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id uuid REFERENCES lessons(id) ON DELETE SET NULL,
  audio_url text,
  transcript text,
  summary text,
  structured_output jsonb NOT NULL DEFAULT '{}'::jsonb,
  status voice_note_status NOT NULL DEFAULT 'subida',
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ai_voice_notes_club_idx ON ai_voice_notes(club_id);
CREATE INDEX IF NOT EXISTS ai_voice_notes_instructor_idx ON ai_voice_notes(instructor_id);
CREATE INDEX IF NOT EXISTS ai_voice_notes_status_idx ON ai_voice_notes(status);

CREATE TABLE IF NOT EXISTS lesson_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  rider_id uuid NOT NULL REFERENCES riders(id) ON DELETE CASCADE,
  body text NOT NULL,
  source feedback_source NOT NULL DEFAULT 'manual',
  voice_note_id uuid REFERENCES ai_voice_notes(id) ON DELETE SET NULL,
  badges_suggested jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS lesson_feedback_lesson_idx ON lesson_feedback(lesson_id);
CREATE INDEX IF NOT EXISTS lesson_feedback_rider_idx ON lesson_feedback(rider_id);

-- ----------------------------------------------------------------------------
-- 12. Notifications
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  club_id uuid REFERENCES clubs(id) ON DELETE CASCADE,
  kind notification_kind NOT NULL DEFAULT 'sistema',
  title text NOT NULL,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_profile_unread_idx ON notifications(profile_id, read_at);
CREATE INDEX IF NOT EXISTS notifications_profile_date_idx ON notifications(profile_id, created_at);

-- ----------------------------------------------------------------------------
-- 13. Help articles
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS help_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  title text NOT NULL,
  summary text,
  body text NOT NULL,
  section text NOT NULL DEFAULT 'general',
  role_visibility text[] NOT NULL DEFAULT '{}'::text[],
  "order" integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS help_articles_slug_unique ON help_articles(slug);
CREATE INDEX IF NOT EXISTS help_articles_section_idx ON help_articles(section, "order");

-- ----------------------------------------------------------------------------
-- 14. Seed help articles
-- ----------------------------------------------------------------------------

INSERT INTO help_articles (slug, title, summary, body, section, "order", role_visibility, published)
VALUES
('como-empezar',
 'Cómo empezar con Equmanager',
 'Guía rápida para entender los 4 perfiles y el flujo principal en menos de 5 minutos.',
 $md$
# Cómo empezar con Equmanager

Equmanager es **un mismo espacio para hípica, propietarios, mozos y alumnos**. Lo que necesitas saber al entrar la primera vez.

## 1. Elige tu perfil al registrarte

Después de crear cuenta verás un onboarding. Elige qué eres:

- **Propietario de hípica** → te creamos tu club, eres dueño y administras todo.
- **Propietario de un caballo** → te unes con código de invitación y ves la agenda y los cuidados de tu caballo.
- **Alumno / corredor** → te unes con código y empiezas a inscribirte a clases, cursos y eventos.
- **Mozo** → entras desde un enlace específico que te manda la hípica.

Un mismo usuario puede tener varios roles en distintos clubes.

## 2. Si eres propietario de hípica

Tu panel arranca con cuatro bloques:

- **Cursos y clases**: planifica tu calendario semanal; cada clase tiene caballo, instructor y alumnos.
- **Eventos y noticias**: publica concursos, salidas y comunicados al tablón.
- **Bonos**: define packs de clases (ej. 10 clases por 250 €) para que tus alumnos compren.
- **Mozos y cuidados**: asigna las plantillas de checklist (alimentación, cascos, paddock...) y supervisa.

## 3. Si eres propietario de un caballo

Verás cada caballo tuyo con:

- Agenda diaria de cuidados (qué le toca hoy).
- Historial de montura (quién ha montado, cuándo y con qué resultado).
- Comentarios del instructor y del mozo.

Recibes notificaciones cuando se completa un checklist o hay algo relevante.

## 4. Si eres alumno o corredor

Tu panel muestra:

- Próximas clases y el caballo que te toca.
- Historial de caballos que has montado, con tu afinidad calculada.
- Opiniones de otros jinetes sobre cada caballo (consejos antes de subirte).
- Insignias conseguidas y eventos abiertos para apuntarte.

## 5. Si eres mozo

Tu panel es la lista de **caballos del día**. Cada caballo abre un checklist sencillo (alimentación, agua, cepillado, cascos, paddock...). Marcas, añades una nota si hace falta, y listo: el propietario lo ve al instante.

## 6. El truco: la IA

Como instructor puedes grabar una **nota de voz** después de la clase:

> "Hoy en la de las 11, Lucía con Sultán muy buen ritmo en el galope, dadle insignia de progreso. Marcos con Trueno cuidar la mano izquierda."

Equmanager transcribe, identifica a cada alumno y caballo, y prepara los comentarios. Tú solo revisas y confirmas. Los alumnos lo reciben en su perfil al instante.

## 7. Pagos

De momento los pagos son simulados (la pasarela está en modo prueba). Cuando un alumno se inscribe a un curso o bono, recibe una confirmación inmediata. Más adelante conectaremos Stripe real.

---

> ¿Algo no funciona como esperas? Dale a "Soporte" en el menú lateral o escríbenos a **hola@equmanager.app**.
$md$,
 'guia',
 1,
 ARRAY[]::text[],
 true
)
ON CONFLICT (slug) DO UPDATE
  SET title = EXCLUDED.title,
      summary = EXCLUDED.summary,
      body = EXCLUDED.body,
      "order" = EXCLUDED."order",
      updated_at = now();

INSERT INTO help_articles (slug, title, summary, body, section, "order", role_visibility, published)
VALUES
('grabar-nota-voz',
 'Grabar una nota de voz después de la clase',
 'Cómo dictar los comentarios de tus alumnos y dejar que la IA los reparta.',
 $md$
# Grabar una nota de voz

1. Entra en **IA → Notas de voz** desde el panel de hípica/instructor.
2. Pulsa "Nueva nota" y elige a qué clase corresponde (o déjala libre).
3. Graba o pega la transcripción.
4. Equmanager te muestra la propuesta: a quién va cada comentario, qué insignia sugerir.
5. Ajusta lo que quieras y pulsa **Confirmar**.

Cada alumno mencionado recibe el feedback en su perfil al instante.

**Truco**: di los nombres tal cual aparecen en la lista de alumnos. La IA tolera variantes ("Lu", "Lucía", "Lucia") pero si dudas, mira el panel antes de grabar.
$md$,
 'guia',
 2,
 ARRAY['owner','admin','instructor']::text[],
 true
)
ON CONFLICT (slug) DO UPDATE
  SET title = EXCLUDED.title,
      summary = EXCLUDED.summary,
      body = EXCLUDED.body,
      "order" = EXCLUDED."order",
      updated_at = now();

INSERT INTO help_articles (slug, title, summary, body, section, "order", role_visibility, published)
VALUES
('checklist-mozos',
 'Hacer el checklist diario como mozo',
 'Cómo registrar el cuidado de cada caballo en menos de un minuto.',
 $md$
# Checklist diario del mozo

1. Abre **Mi día** en tu panel.
2. Verás la lista de caballos asignados.
3. Pulsa uno y marca cada tarea (alimentación, agua, cepillado, paddock, cascos, observaciones...).
4. Si algo te llama la atención, escribe una nota corta. El propietario y el instructor la verán.
5. Al guardar, el caballo aparece como "Listo" y el propietario recibe la notificación.

No hace falta repetir el checklist del día siguiente: cada nuevo día se reinicia automáticamente.
$md$,
 'guia',
 3,
 ARRAY['groom','owner','admin']::text[],
 true
)
ON CONFLICT (slug) DO UPDATE
  SET title = EXCLUDED.title,
      summary = EXCLUDED.summary,
      body = EXCLUDED.body,
      "order" = EXCLUDED."order",
      updated_at = now();
