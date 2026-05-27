-- =============================================================================
-- Seed demo: pobla los clubs existentes con datos verosímiles.
-- Idempotente parcialmente: cada DO block detecta si ya se ejecutó por club
-- mirando si hay ya N caballos. Si los hay, salta (evita duplicar).
-- =============================================================================

DO $seed$
DECLARE
  v_club_id    uuid;
  v_owner_id   uuid;
  v_template   uuid;
  v_existing   integer;

  h_id         uuid;
  r_id         uuid;
  c_id         uuid;
  e_id         uuid;
  l_id         uuid;
  b_id         uuid;
  badge_id     uuid;
  voice_id     uuid;

  h_sultan     uuid; h_trueno  uuid; h_picaro  uuid; h_lola    uuid;
  h_luna       uuid; h_tornado uuid; h_estrella uuid; h_bambino uuid;

  r_lucia      uuid; r_marcos  uuid; r_ines    uuid; r_pablo   uuid;
  r_clara      uuid; r_diego   uuid; r_sara    uuid; r_alex    uuid;

  bd_progreso  uuid; bd_primer_galope uuid; bd_primer_salto uuid; bd_competicion uuid;
BEGIN
  -- ------------------------------------------------------------------
  -- CLUB: Valdebebas
  -- ------------------------------------------------------------------
  SELECT id INTO v_club_id FROM clubs WHERE slug = 'valdebebas';
  IF v_club_id IS NULL THEN
    RAISE NOTICE 'Club valdebebas no encontrado, saltando.';
  ELSE
    SELECT count(*) INTO v_existing FROM horses WHERE club_id = v_club_id;
    IF v_existing >= 5 THEN
      RAISE NOTICE 'Valdebebas ya tiene datos demo, saltando.';
    ELSE
      SELECT profile_id INTO v_owner_id
      FROM club_members WHERE club_id = v_club_id AND role = 'owner' LIMIT 1;

      -- Plantilla cuidados (puede existir ya)
      SELECT id INTO v_template FROM horse_care_templates WHERE club_id = v_club_id LIMIT 1;
      IF v_template IS NULL THEN
        INSERT INTO horse_care_templates (club_id, name, description, items)
        VALUES (
          v_club_id, 'Cuidados diarios',
          'Checklist estándar mañana/tarde para cada caballo.',
          '[
            {"key":"alimentacion","label":"Alimentación","kind":"alimentacion"},
            {"key":"agua","label":"Agua fresca","kind":"agua"},
            {"key":"cepillado","label":"Cepillado","kind":"cepillado"},
            {"key":"cascos","label":"Revisión de cascos","kind":"cascos"},
            {"key":"paddock","label":"Salida a paddock","kind":"salida_paddock"},
            {"key":"observaciones","label":"Observaciones","kind":"observacion_general"}
          ]'::jsonb
        )
        RETURNING id INTO v_template;
      END IF;

      -- =============================================================
      -- CABALLOS
      -- =============================================================
      INSERT INTO horses (club_id, name, kind, breed, birth_year, color, status, photo_url, notes)
      VALUES
        (v_club_id, 'Sultán', 'caballo', 'PRE', 2016, 'Tordo', 'activo',
         'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=800',
         'Carácter tranquilo, ideal para iniciación. Sensible a la mano.')
      RETURNING id INTO h_sultan;

      INSERT INTO horses (club_id, name, kind, breed, birth_year, color, status, photo_url, notes)
      VALUES
        (v_club_id, 'Trueno', 'caballo', 'Hispano-árabe', 2014, 'Castaño', 'activo',
         'https://images.unsplash.com/photo-1568041829748-72d7c4cc7df8?w=800',
         'Energético, requiere asiento firme. Excelente saltador.')
      RETURNING id INTO h_trueno;

      INSERT INTO horses (club_id, name, kind, breed, birth_year, color, status, photo_url, notes)
      VALUES
        (v_club_id, 'Pícaro', 'pony', 'Connemara', 2018, 'Negro', 'activo',
         'https://images.unsplash.com/photo-1598974357801-cbca100e65d3?w=800',
         'Pony con mucho carácter, perfecto para niveles intermedios.')
      RETURNING id INTO h_picaro;

      INSERT INTO horses (club_id, name, kind, breed, birth_year, color, status, photo_url, notes)
      VALUES
        (v_club_id, 'Lola', 'caballo', 'KWPN', 2013, 'Alazán', 'activo',
         'https://images.unsplash.com/photo-1534773728080-33d31da27ae5?w=800',
         'Yegua tranquila y noble. Cuidado con la pierna derecha (cicatriz).')
      RETURNING id INTO h_lola;

      INSERT INTO horses (club_id, name, kind, breed, birth_year, color, status, photo_url, notes)
      VALUES
        (v_club_id, 'Luna', 'caballo', 'PRE', 2017, 'Torda rodada', 'activo',
         'https://images.unsplash.com/photo-1452857297128-d9c29adba80b?w=800',
         'Sensible y elegante, muy buena para doma.')
      RETURNING id INTO h_luna;

      INSERT INTO horses (club_id, name, kind, breed, birth_year, color, status, photo_url, notes)
      VALUES
        (v_club_id, 'Tornado', 'caballo', 'Lusitano', 2015, 'Negro', 'descanso',
         'https://images.unsplash.com/photo-1605641532449-4bcc04ac2c00?w=800',
         'En recuperación por molestia en el corvejón izquierdo.')
      RETURNING id INTO h_tornado;

      INSERT INTO horses (club_id, name, kind, breed, birth_year, color, status, photo_url, notes)
      VALUES
        (v_club_id, 'Estrella', 'pony', 'Welsh', 2019, 'Bayo', 'activo',
         'https://images.unsplash.com/photo-1591456983933-0aa910a48fff?w=800',
         'Pony muy dócil, ideal para iniciación de niños.')
      RETURNING id INTO h_estrella;

      INSERT INTO horses (club_id, name, kind, breed, birth_year, color, status, photo_url, notes)
      VALUES
        (v_club_id, 'Bambino', 'shetland', 'Shetland', 2020, 'Pío', 'activo',
         'https://images.unsplash.com/photo-1517867065192-91e0a4daedca?w=800',
         'Shetland juguetón. Solo paseos cortos con niños pequeños.')
      RETURNING id INTO h_bambino;

      -- =============================================================
      -- ALUMNOS
      -- =============================================================
      INSERT INTO riders (club_id, name, email, phone, category, tier, photo_url, status, notes)
      VALUES (v_club_id, 'Lucía Pérez', 'lucia.perez@correo.com', '+34 612 345 678', 'juvenil', 'avanzado',
              'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600', 'activo',
              'Compite en categoría juvenil. Trabajando la posición de pierna.')
      RETURNING id INTO r_lucia;

      INSERT INTO riders (club_id, name, email, phone, category, tier, photo_url, status, notes)
      VALUES (v_club_id, 'Marcos Ruiz', 'marcos.ruiz@correo.com', '+34 623 456 789', 'adulto', 'avanzado',
              'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600', 'activo',
              'Vuelve a montar tras 2 años de parón. Le cuesta la mano izquierda.')
      RETURNING id INTO r_marcos;

      INSERT INTO riders (club_id, name, email, phone, category, tier, photo_url, status, notes)
      VALUES (v_club_id, 'Inés Vidal', 'ines.vidal@correo.com', '+34 634 567 890', 'adulto', 'competicion',
              'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600', 'activo',
              'Prepara concurso social de otoño. Excelente trabajo en plano.')
      RETURNING id INTO r_ines;

      INSERT INTO riders (club_id, name, email, phone, category, tier, photo_url, status, notes)
      VALUES (v_club_id, 'Pablo Castro', 'pablo.castro@correo.com', '+34 645 678 901', 'infantil', 'iniciacion',
              'https://images.unsplash.com/photo-1503455637927-730bce8583c0?w=600', 'activo',
              'Empezó hace 6 meses. Mucha confianza con Estrella.')
      RETURNING id INTO r_pablo;

      INSERT INTO riders (club_id, name, email, phone, category, tier, photo_url, status, notes)
      VALUES (v_club_id, 'Clara Soto', 'clara.soto@correo.com', '+34 656 789 012', 'pony_c', 'avanzado',
              'https://images.unsplash.com/photo-1517462964-21fdcec3f25b?w=600', 'activo',
              'Lista para subir a nivel competición pony.')
      RETURNING id INTO r_clara;

      INSERT INTO riders (club_id, name, email, phone, category, tier, photo_url, status, notes)
      VALUES (v_club_id, 'Diego Morales', 'diego.morales@correo.com', '+34 667 890 123', 'adulto', 'iniciacion',
              'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600', 'activo',
              'Reciente lesión leve de rodilla, evitar cargas largas.')
      RETURNING id INTO r_diego;

      INSERT INTO riders (club_id, name, email, phone, category, tier, photo_url, status, notes)
      VALUES (v_club_id, 'Sara Núñez', 'sara.nunez@correo.com', '+34 678 901 234', 'juvenil', 'competicion',
              'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=600', 'activo',
              'Top alumna de doma juvenil. Disciplinada y constante.')
      RETURNING id INTO r_sara;

      INSERT INTO riders (club_id, name, email, phone, category, tier, photo_url, status, notes)
      VALUES (v_club_id, 'Alex Iturri', 'alex.iturri@correo.com', '+34 689 012 345', 'adulto', 'avanzado',
              'https://images.unsplash.com/photo-1463453091185-61582044d556?w=600', 'baja',
              'En pausa por mudanza. Volverá en primavera.')
      RETURNING id INTO r_alex;

      -- =============================================================
      -- INSIGNIAS (badges)
      -- =============================================================
      INSERT INTO badges (club_id, code, name, description, color)
      VALUES (v_club_id, 'progreso_constante', 'Progreso constante',
              'Reconocimiento al esfuerzo sostenido durante varias semanas.', '#3f8649')
      RETURNING id INTO bd_progreso;

      INSERT INTO badges (club_id, code, name, description, color)
      VALUES (v_club_id, 'primer_galope', 'Primer galope',
              'Has galopado por primera vez en pista.', '#f4b020')
      RETURNING id INTO bd_primer_galope;

      INSERT INTO badges (club_id, code, name, description, color)
      VALUES (v_club_id, 'primer_salto', 'Primer salto',
              'Saltaste tu primer obstáculo. ¡Enhorabuena!', '#dc2626')
      RETURNING id INTO bd_primer_salto;

      INSERT INTO badges (club_id, code, name, description, color)
      VALUES (v_club_id, 'primera_competicion', 'Primera competición',
              'Participaste en tu primer concurso social.', '#2563eb')
      RETURNING id INTO bd_competicion;

      INSERT INTO rider_badges (rider_id, badge_id, awarded_by, notes, awarded_at)
      VALUES
        (r_lucia, bd_progreso, v_owner_id, 'Cinco semanas de progreso ininterrumpido.', now() - interval '12 days'),
        (r_lucia, bd_primer_salto, v_owner_id, 'Saltó 70cm sin titubear.', now() - interval '30 days'),
        (r_sara, bd_competicion, v_owner_id, 'Concurso social Valdebebas Junior.', now() - interval '45 days'),
        (r_sara, bd_progreso, v_owner_id, NULL, now() - interval '6 days'),
        (r_clara, bd_primer_galope, v_owner_id, 'Primer galope estable con Pícaro.', now() - interval '21 days'),
        (r_ines, bd_competicion, v_owner_id, 'Tercera competición esta temporada.', now() - interval '10 days');

      -- =============================================================
      -- CURSOS
      -- =============================================================
      INSERT INTO courses (club_id, title, description, discipline, start_date, end_date, price_cents, max_students, photo_url, status, created_by)
      VALUES (v_club_id, 'Iniciación al salto',
              'Programa de 8 sesiones para empezar a saltar con seguridad. Incluye trabajo en plano, pequeños obstáculos y técnica de aproximación.',
              'salto', now() + interval '7 days', now() + interval '56 days', 24000, 8,
              'https://images.unsplash.com/photo-1487252665478-49b61b47f302?w=1200', 'publicado', v_owner_id);

      INSERT INTO courses (club_id, title, description, discipline, start_date, end_date, price_cents, max_students, photo_url, status, created_by)
      VALUES (v_club_id, 'Doma clásica intermedia',
              'Trabajo de figuras, transiciones y media parada. 10 sesiones de 1h.',
              'doma', now() + interval '14 days', now() + interval '84 days', 32000, 6,
              'https://images.unsplash.com/photo-1455875571723-a73a3d57b8e0?w=1200', 'publicado', v_owner_id);

      INSERT INTO courses (club_id, title, description, discipline, start_date, end_date, price_cents, max_students, photo_url, status, created_by)
      VALUES (v_club_id, 'Campamento de verano',
              'Una semana intensiva en julio. Para todos los niveles. Incluye gymkhana final y ruta por el campo.',
              'iniciacion', '2026-07-06', '2026-07-12', 38000, 16,
              'https://images.unsplash.com/photo-1515688594390-b649af70d282?w=1200', 'borrador', v_owner_id);

      -- =============================================================
      -- EVENTOS
      -- =============================================================
      INSERT INTO events (club_id, kind, title, description, location, starts_at, price_cents, max_attendees, photo_url, status, created_by)
      VALUES (v_club_id, 'competicion', 'Concurso Social Otoño',
              'Concurso de salto y doma para todas las categorías. Premios y barbacoa al final.',
              'Pista cubierta Valdebebas', now() + interval '21 days', 2500, 50,
              'https://images.unsplash.com/photo-1591815302525-756a9bcc3425?w=1200', 'publicado', v_owner_id);

      INSERT INTO events (club_id, kind, title, description, location, starts_at, price_cents, max_attendees, photo_url, status, created_by)
      VALUES (v_club_id, 'salida', 'Ruta por la Sierra de Guadarrama',
              'Día completo a caballo por sendas señalizadas. Almuerzo en ruta. Plazas limitadas.',
              'Punto de encuentro: Cercedilla', now() + interval '35 days', 6500, 12,
              'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200', 'publicado', v_owner_id);

      INSERT INTO events (club_id, kind, title, description, location, starts_at, price_cents, max_attendees, photo_url, status, created_by)
      VALUES (v_club_id, 'clinic', 'Clinic con Beatriz Ferrer-Salat',
              'Sesión magistral de doma con la jinete olímpica. Una jornada completa con plazas limitadas.',
              'Pista cubierta Valdebebas', now() + interval '60 days', 12000, 8,
              'https://images.unsplash.com/photo-1605418658060-29d0d4f7eaeb?w=1200', 'publicado', v_owner_id);

      -- =============================================================
      -- NOTICIAS
      -- =============================================================
      INSERT INTO news (club_id, title, body, pinned, photo_url, published_at, created_by)
      VALUES (v_club_id, 'Cambio de horario por puente del 1 de noviembre',
              E'El sábado 1 de noviembre las clases se trasladan al domingo 2.\n\nLas clases de la tarde se mantienen normalmente. Si tienes alguna duda escríbenos.',
              true,
              'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200',
              now() - interval '3 days', v_owner_id);

      INSERT INTO news (club_id, title, body, pinned, photo_url, published_at, created_by)
      VALUES (v_club_id, 'Inscripciones abiertas: campamento de verano',
              'Ya puedes reservar plaza para el campamento del 6 al 12 de julio. Solo 16 plazas, primero llega primero coge.',
              false,
              'https://images.unsplash.com/photo-1521335751210-d6c3f0a08b95?w=1200',
              now() - interval '7 days', v_owner_id);

      INSERT INTO news (club_id, title, body, pinned, photo_url, published_at, created_by)
      VALUES (v_club_id, 'Tornado vuelve a la pista en dos semanas',
              'Buenas noticias: la veterinaria ha confirmado que Tornado podrá retomar el trabajo en pista en quince días, empezando suave.',
              false, NULL, now() - interval '1 day', v_owner_id);

      -- =============================================================
      -- BONOS
      -- =============================================================
      INSERT INTO bonos (club_id, name, description, total_classes, price_cents, validity_days, active, photo_url)
      VALUES (v_club_id, 'Bono 5 clases',
              'Cinco clases para empezar sin compromiso.',
              5, 15000, 90, true,
              'https://images.unsplash.com/photo-1583912267550-d6c2ac3196c0?w=1200');

      INSERT INTO bonos (club_id, name, description, total_classes, price_cents, validity_days, active, photo_url)
      VALUES (v_club_id, 'Bono 10 clases',
              'El más popular. Ahorra un 15% respecto a clases sueltas.',
              10, 25000, 180, true,
              'https://images.unsplash.com/photo-1568041829748-72d7c4cc7df8?w=1200');

      INSERT INTO bonos (club_id, name, description, total_classes, price_cents, validity_days, active, photo_url)
      VALUES (v_club_id, 'Bono 20 clases',
              'Para quien viene cada semana sin falta. Mejor precio por clase.',
              20, 44000, 240, true,
              'https://images.unsplash.com/photo-1605641532449-4bcc04ac2c00?w=1200');

      -- =============================================================
      -- CLASES (lessons + asistentes)
      -- =============================================================
      -- Clase pasada 1
      INSERT INTO lessons (club_id, instructor_id, date, duration_minutes, discipline, status, notes)
      VALUES (v_club_id, v_owner_id, now() - interval '5 days' + interval '11 hours', 60, 'salto', 'realizada',
              'Sesión de obstáculos cruzados. Buen ritmo general.')
      RETURNING id INTO l_id;
      INSERT INTO lesson_attendees (lesson_id, rider_id, horse_id, attended)
      VALUES
        (l_id, r_lucia, h_sultan, true),
        (l_id, r_marcos, h_trueno, true),
        (l_id, r_ines, h_picaro, true);

      -- Feedback IA para la clase pasada
      INSERT INTO ai_voice_notes (club_id, instructor_id, lesson_id, transcript, summary, structured_output, status)
      VALUES (v_club_id, v_owner_id, l_id,
              'Hoy en la de las once: Lucía con Sultán muy buen ritmo en el galope, dadle insignia de progreso. Marcos con Trueno cuidar la mano izquierda en el círculo abierto. Inés excelente posición de pierna, lista para subir nivel.',
              'Clase de salto · 3 alumnos · varios comentarios positivos',
              jsonb_build_object(
                'summary','Clase de salto · 3 alumnos · varios comentarios positivos',
                'items', jsonb_build_array(
                  jsonb_build_object('riderId', r_lucia, 'riderName','Lucía Pérez','horseId',h_sultan,'horseName','Sultán','feedback','Muy buen ritmo en el galope. Mantente así la próxima sesión.','suggestedBadge','Progreso constante','confidence',0.95),
                  jsonb_build_object('riderId', r_marcos, 'riderName','Marcos Ruiz','horseId',h_trueno,'horseName','Trueno','feedback','Cuida la mano izquierda en el círculo abierto. Trabaja contacto sin tirar.','confidence',0.92),
                  jsonb_build_object('riderId', r_ines, 'riderName','Inés Vidal','horseId',h_picaro,'horseName','Pícaro','feedback','Excelente posición de pierna. Lista para subir nivel.','confidence',0.97)
                ),
                'unmatched', jsonb_build_array(),
                'source','anthropic'
              ),
              'confirmada')
      RETURNING id INTO voice_id;

      INSERT INTO lesson_feedback (lesson_id, rider_id, body, source, voice_note_id, badges_suggested, created_by)
      VALUES
        (l_id, r_lucia, 'Muy buen ritmo en el galope. Mantente así la próxima sesión.', 'ia', voice_id, '["Progreso constante"]'::jsonb, v_owner_id),
        (l_id, r_marcos, 'Cuida la mano izquierda en el círculo abierto. Trabaja contacto sin tirar.', 'ia', voice_id, '[]'::jsonb, v_owner_id),
        (l_id, r_ines, 'Excelente posición de pierna. Lista para subir nivel.', 'ia', voice_id, '[]'::jsonb, v_owner_id);

      -- Clase pasada 2
      INSERT INTO lessons (club_id, instructor_id, date, duration_minutes, discipline, status, notes)
      VALUES (v_club_id, v_owner_id, now() - interval '3 days' + interval '17 hours', 60, 'doma', 'realizada', NULL)
      RETURNING id INTO l_id;
      INSERT INTO lesson_attendees (lesson_id, rider_id, horse_id, attended)
      VALUES
        (l_id, r_sara, h_luna, true),
        (l_id, r_clara, h_picaro, true);

      -- Clase pasada 3
      INSERT INTO lessons (club_id, instructor_id, date, duration_minutes, discipline, status, notes)
      VALUES (v_club_id, v_owner_id, now() - interval '2 days' + interval '10 hours 30 minutes', 45, 'iniciacion', 'realizada',
              'Primer galope para Pablo. Lo lleva muy bien.')
      RETURNING id INTO l_id;
      INSERT INTO lesson_attendees (lesson_id, rider_id, horse_id, attended)
      VALUES (l_id, r_pablo, h_estrella, true);

      -- Clase próxima 1
      INSERT INTO lessons (club_id, instructor_id, date, duration_minutes, discipline, status, notes)
      VALUES (v_club_id, v_owner_id, now() + interval '1 day' + interval '11 hours', 60, 'salto', 'programada',
              'Recordad traer gorras.')
      RETURNING id INTO l_id;
      INSERT INTO lesson_attendees (lesson_id, rider_id, horse_id, attended)
      VALUES
        (l_id, r_lucia, h_sultan, false),
        (l_id, r_marcos, h_lola, false);

      -- Clase próxima 2
      INSERT INTO lessons (club_id, instructor_id, date, duration_minutes, discipline, status, notes)
      VALUES (v_club_id, v_owner_id, now() + interval '2 days' + interval '17 hours 30 minutes', 60, 'doma', 'programada', NULL)
      RETURNING id INTO l_id;
      INSERT INTO lesson_attendees (lesson_id, rider_id, horse_id, attended)
      VALUES
        (l_id, r_sara, h_luna, false),
        (l_id, r_ines, h_picaro, false);

      -- Clase próxima 3
      INSERT INTO lessons (club_id, instructor_id, date, duration_minutes, discipline, status, notes)
      VALUES (v_club_id, v_owner_id, now() + interval '4 days' + interval '10 hours', 45, 'iniciacion', 'programada', NULL)
      RETURNING id INTO l_id;
      INSERT INTO lesson_attendees (lesson_id, rider_id, horse_id, attended)
      VALUES
        (l_id, r_pablo, h_estrella, false),
        (l_id, r_diego, h_bambino, false);

      -- =============================================================
      -- OPINIONES sobre caballos (horse_reviews)
      -- =============================================================
      INSERT INTO horse_reviews (horse_id, rider_id, rating, title, body)
      VALUES
        (h_sultan, r_lucia, 5, 'Maravilloso para iniciación', 'Es muy noble, te escucha si llevas la mano suave.'),
        (h_sultan, r_marcos, 4, NULL, 'Tranquilo pero un poco perezoso al galope.'),
        (h_trueno, r_marcos, 4, 'Mucho temperamento', 'Cuidado con las transiciones. Si te impones bien, responde de lujo.'),
        (h_picaro, r_ines, 5, 'Pony con clase', 'Muy fino al salto, sensible al lateral.'),
        (h_luna, r_sara, 5, NULL, 'La mejor para doma. Sigue cada media parada.'),
        (h_estrella, r_pablo, 5, 'Mi favorita', 'Es la primera con la que galopé. Súper paciente.');

      -- =============================================================
      -- AFINIDAD
      -- =============================================================
      INSERT INTO horse_affinity (horse_id, rider_id, rides_count, score) VALUES
        (h_sultan, r_lucia, 18, 92),
        (h_sultan, r_marcos, 7, 70),
        (h_trueno, r_marcos, 12, 80),
        (h_picaro, r_ines, 15, 85),
        (h_picaro, r_clara, 9, 75),
        (h_luna, r_sara, 22, 95),
        (h_estrella, r_pablo, 11, 88),
        (h_bambino, r_diego, 3, 60)
      ON CONFLICT DO NOTHING;

      -- =============================================================
      -- CUIDADOS REGISTRADOS (último día)
      -- =============================================================
      INSERT INTO horse_care_logs (club_id, horse_id, groom_id, template_id, for_date, items_done, notes, completed_at)
      VALUES
        (v_club_id, h_sultan, v_owner_id, v_template, current_date - 1,
         '[{"key":"alimentacion","done":true},{"key":"agua","done":true},{"key":"cepillado","done":true},{"key":"cascos","done":true},{"key":"paddock","done":true},{"key":"observaciones","done":true}]'::jsonb,
         'Sin novedades.', now() - interval '1 day' + interval '8 hours'),
        (v_club_id, h_trueno, v_owner_id, v_template, current_date - 1,
         '[{"key":"alimentacion","done":true},{"key":"agua","done":true},{"key":"cepillado","done":true},{"key":"cascos","done":false},{"key":"paddock","done":true},{"key":"observaciones","done":true,"notes":"Casco delantero izquierdo a revisar"}]'::jsonb,
         'Marcar visita herrador esta semana.', now() - interval '1 day' + interval '8 hours 20 minutes'),
        (v_club_id, h_luna, v_owner_id, v_template, current_date,
         '[{"key":"alimentacion","done":true},{"key":"agua","done":true},{"key":"cepillado","done":true},{"key":"cascos","done":true},{"key":"paddock","done":true},{"key":"observaciones","done":true}]'::jsonb,
         NULL, now() - interval '4 hours');

      -- =============================================================
      -- INSCRIPCIONES (enrollments) + pagos fake
      -- =============================================================
      -- Lucía paga el bono 10
      INSERT INTO payments (club_id, profile_id, amount_cents, currency, status, provider, reference, description, completed_at, metadata)
      VALUES (v_club_id, v_owner_id, 25000, 'EUR', 'completado', 'stripe_fake',
              'fake_demo_001', 'Bono 10 clases (Lucía)', now() - interval '20 days', '{"simulated":true,"demo":true}'::jsonb);

      -- =============================================================
      -- NOTIFICACIONES
      -- =============================================================
      INSERT INTO notifications (profile_id, club_id, kind, title, body, link, created_at)
      VALUES
        (v_owner_id, v_club_id, 'checklist', 'Checklist de Sultán completado',
         'El mozo terminó el cuidado de ayer sin incidencias.', '/app/horses', now() - interval '20 hours'),
        (v_owner_id, v_club_id, 'checklist', 'Atención: Trueno necesita herrador',
         'Cuidado pendiente: casco delantero izquierdo a revisar.', '/app/horses', now() - interval '19 hours'),
        (v_owner_id, v_club_id, 'feedback', 'IA preparó feedback de 3 alumnos',
         'Revisa la bandeja y confirma envío.', '/app/ai', now() - interval '4 days'),
        (v_owner_id, v_club_id, 'evento', 'Concurso Social Otoño publicado',
         'Tus alumnos ya pueden apuntarse.', '/app/events', now() - interval '6 days'),
        (v_owner_id, v_club_id, 'sistema', 'Datos demo cargados',
         'Hemos sembrado caballos, alumnos, clases, eventos, noticias y bonos de ejemplo.', '/app', now());

      RAISE NOTICE 'Valdebebas sembrada correctamente.';
    END IF;
  END IF;

  -- ------------------------------------------------------------------
  -- CLUB: Prueba Estefi (sólo lo básico)
  -- ------------------------------------------------------------------
  SELECT id INTO v_club_id FROM clubs WHERE slug = 'prueba-estefi';
  IF v_club_id IS NULL THEN
    RAISE NOTICE 'Club prueba-estefi no encontrado, saltando.';
  ELSE
    SELECT count(*) INTO v_existing FROM horses WHERE club_id = v_club_id;
    IF v_existing >= 3 THEN
      RAISE NOTICE 'Prueba Estefi ya tiene datos demo, saltando.';
    ELSE
      SELECT profile_id INTO v_owner_id
      FROM club_members WHERE club_id = v_club_id AND role = 'owner' LIMIT 1;

      INSERT INTO horses (club_id, name, kind, breed, birth_year, color, status, photo_url, notes)
      VALUES
        (v_club_id, 'Capitán', 'caballo', 'PRE', 2015, 'Negro', 'activo',
         'https://images.unsplash.com/photo-1568041829748-72d7c4cc7df8?w=800',
         'Carácter equilibrado, ideal para todo tipo de alumno.'),
        (v_club_id, 'Maya', 'caballo', 'Hispano-árabe', 2017, 'Alazán', 'activo',
         'https://images.unsplash.com/photo-1534773728080-33d31da27ae5?w=800',
         'Buena en doma, atenta a las ayudas.'),
        (v_club_id, 'Coco', 'pony', 'Welsh', 2019, 'Bayo', 'activo',
         'https://images.unsplash.com/photo-1591456983933-0aa910a48fff?w=800',
         'Pony juguetón, perfecto para iniciación.');

      INSERT INTO riders (club_id, name, email, phone, category, tier, photo_url, status)
      VALUES
        (v_club_id, 'Marta Gómez', 'marta@correo.com', '+34 611 222 333', 'adulto', 'iniciacion',
         'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600', 'activo'),
        (v_club_id, 'Hugo Ramírez', 'hugo@correo.com', '+34 622 333 444', 'infantil', 'iniciacion',
         'https://images.unsplash.com/photo-1503455637927-730bce8583c0?w=600', 'activo'),
        (v_club_id, 'Lola Fernández', 'lola@correo.com', '+34 633 444 555', 'juvenil', 'avanzado',
         'https://images.unsplash.com/photo-1517462964-21fdcec3f25b?w=600', 'activo');

      INSERT INTO news (club_id, title, body, pinned, photo_url, published_at, created_by)
      VALUES (v_club_id, 'Bienvenidos a Prueba Estefi',
              'Este es un club de prueba con datos demo. Pulsa sobre cualquier registro para ver su ficha.',
              true, NULL, now(), v_owner_id);

      INSERT INTO bonos (club_id, name, description, total_classes, price_cents, validity_days, active)
      VALUES (v_club_id, 'Bono 5 clases', 'Cinco clases iniciales.', 5, 15000, 90, true);

      RAISE NOTICE 'Prueba Estefi sembrada correctamente.';
    END IF;
  END IF;
END
$seed$;
