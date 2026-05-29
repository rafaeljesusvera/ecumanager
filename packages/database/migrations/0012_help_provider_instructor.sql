-- =============================================================================
-- 0012 — Artículos de ayuda para proveedor y monitor
-- =============================================================================
-- Añade cobertura del Centro de Ayuda para roles 'provider' (0 artículos hoy)
-- y 'instructor' (solo 1 hoy). Idempotente: ON CONFLICT actualiza por slug.
-- =============================================================================

-- 1. Proveedor — Guía rápida -------------------------------------------------
INSERT INTO help_articles (slug, title, summary, body, section, "order", role_visibility, published)
VALUES
('guia-proveedores',
 'Guía rápida para proveedores',
 'Veterinario, herrador, dentista o fisio: cómo darte de alta y empezar a recibir avisos de clubes.',
 $md$
# Guía rápida para proveedores

En Equmanager los **proveedores** sois los profesionales que dais servicio a los clubes: veterinarios, herradores, dentistas, fisios, nutrición, transporte o seguros.

## 1. Date de alta con tu especialidad

Al crear cuenta elige el perfil **Proveedor** y selecciona una o varias especialidades. Puedes tener varias (p. ej. veterinario y dentista).

Cada especialidad genera una ficha pública con:

- Nombre comercial o tu propio nombre.
- Teléfono de contacto.
- Notas (zona, horario, idiomas...).

## 2. Conecta con los clubes

Los clubes te encontrarán por especialidad. Cuando uno te añada a su agenda, recibirás un aviso y aparecerás en su tablón de contactos.

También puedes pedir tú mismo unirte a un club desde el directorio público.

## 3. Cómo organizas tu día

Tu panel arranca con:

- **Próximas visitas** acordadas (caballo, club, hora).
- **Solicitudes pendientes** de clubes y propietarios.
- **Mensajes** con cada club con el que trabajas.

## 4. Confianza, no factura

Equmanager **no gestiona pagos ni facturas**. Es una herramienta para coordinar visitas, dejar notas y mantener a todos al día. La facturación sigue tu canal habitual.

---

> ¿Dudas? Escribe a **hola@equmanager.app** o usa el botón "Soporte" del menú.
$md$,
 'guia',
 4,
 ARRAY['provider']::text[],
 true
)
ON CONFLICT (slug) DO UPDATE
  SET title = EXCLUDED.title,
      summary = EXCLUDED.summary,
      body = EXCLUDED.body,
      section = EXCLUDED.section,
      "order" = EXCLUDED."order",
      role_visibility = EXCLUDED.role_visibility,
      updated_at = now();

-- 2. Proveedor — Agenda y visitas --------------------------------------------
INSERT INTO help_articles (slug, title, summary, body, section, "order", role_visibility, published)
VALUES
('proveedor-agenda-visitas',
 'Tu agenda: visitas, reservas y disponibilidad',
 'Cómo aceptar peticiones de visita y mantener tu calendario al día sin liarte con varios clubes.',
 $md$
# Agenda del proveedor

Tu agenda es la columna vertebral de tu día. Aquí ves todas las visitas confirmadas y las peticiones que aún tienes que contestar, sin importar de qué club vengan.

## Recibir una petición

Cuando un propietario o el responsable de una hípica te pide una visita, llega como **petición pendiente**:

1. Abres la petición y ves: caballo, club, motivo y fecha propuesta.
2. **Aceptas** (queda confirmada y aparece en tu calendario) o **propones otra fecha**.
3. Si rechazas, escribe una nota corta — el club lo agradecerá.

## Marcar disponibilidad

Desde **Mi agenda → Disponibilidad** puedes bloquear días o franjas en las que no atiendes. Los clubes ven ese bloqueo cuando intentan pedirte hora.

## Cerrar la visita

Después de cada visita anota lo que se ha hecho. Esa nota la verá el propietario y queda en el historial del caballo, dentro del club.

Si el caballo necesita seguimiento (p. ej. revisar herraje en 6 semanas), crea ya el siguiente recordatorio. Te avisará a ti y al club.

---

> Truco: si trabajas con varios clubes, usa los **filtros por club** del calendario para no perder vista de cada uno.
$md$,
 'guia',
 5,
 ARRAY['provider']::text[],
 true
)
ON CONFLICT (slug) DO UPDATE
  SET title = EXCLUDED.title,
      summary = EXCLUDED.summary,
      body = EXCLUDED.body,
      section = EXCLUDED.section,
      "order" = EXCLUDED."order",
      role_visibility = EXCLUDED.role_visibility,
      updated_at = now();

-- 3. Proveedor — Comunicarte con clubes --------------------------------------
INSERT INTO help_articles (slug, title, summary, body, section, "order", role_visibility, published)
VALUES
('proveedor-mensajes-clubes',
 'Comunicarte con clubes y propietarios',
 'Mensajes directos y avisos masivos cuando necesitas decir algo a varios clubes a la vez.',
 $md$
# Mensajes para proveedores

El sistema de mensajería interna te ahorra WhatsApps cruzados con cinco clubes distintos. Todo queda dentro de Equmanager, con histórico.

## Mensaje directo

Para hablar con una persona concreta — el responsable de la hípica, el propietario de un caballo o un mozo — abres **Mensajes → Nuevo**, lo buscas y empiezas el hilo. Las respuestas llegan a su panel y, si lo tiene activado, también como notificación.

## Avisar a varios clubes a la vez (broadcast)

Si vas a estar de vacaciones, cambias de tarifas o pasas un cambio de horario, mándalo como **anuncio**:

1. **Mensajes → Nuevo anuncio**.
2. Elige los clubes a los que quieres avisar.
3. Escribe el mensaje y envía.

Cada club lo recibe en su tablón. No hace falta abrir un hilo por club.

## Buenas prácticas

- Para una pregunta concreta, mejor mensaje directo.
- Para informar a varios, mejor anuncio.
- Cierra los hilos viejos para tener la bandeja limpia.

---

> Los mensajes quedan guardados; puedes recuperar acuerdos pasados sin tener que apuntarlos aparte.
$md$,
 'guia',
 6,
 ARRAY['provider']::text[],
 true
)
ON CONFLICT (slug) DO UPDATE
  SET title = EXCLUDED.title,
      summary = EXCLUDED.summary,
      body = EXCLUDED.body,
      section = EXCLUDED.section,
      "order" = EXCLUDED."order",
      role_visibility = EXCLUDED.role_visibility,
      updated_at = now();

-- 4. Monitor — Programar clases ----------------------------------------------
INSERT INTO help_articles (slug, title, summary, body, section, "order", role_visibility, published)
VALUES
('monitor-programar-clases',
 'Programar clases y asignar caballos',
 'Tu semana en una vista: cómo encajar alumnos, caballos y horarios sin liarte.',
 $md$
# Programar clases como monitor

La planificación semanal es donde más tiempo te ahorra Equmanager. La idea: cada clase tiene **horario, instructor, caballo y alumnos**. Si los cuatro encajan, la clase se publica.

## Crear una clase

1. **Calendario → Nueva clase** o pulsa una franja libre.
2. Pon nombre (p. ej. "Iniciación adultos") y elige día y hora.
3. Asigna al **instructor** que la imparte (puedes ser tú mismo).
4. Elige los **caballos** disponibles esa hora.
5. Añade los **alumnos** que la van a recibir.

Equmanager te avisa si un caballo o un alumno ya tiene otra clase a la misma hora.

## Repetir cada semana

Si la clase se repite, márcala como **recurrente**. Se replica las semanas siguientes y solo tienes que ajustar lo que cambie.

## Cancelar o mover

Una clase puede **cancelarse** (los alumnos lo ven y, si tenían bono, se reembolsa la sesión) o **moverse** (cambia el horario y los alumnos reciben aviso).

## Caballo de reserva

Si un caballo se lesiona o no está disponible, Equmanager te propone alternativas según la afinidad histórica de cada alumno con cada caballo.

---

> Truco: bloquea las horas en las que **tú** no das clase desde tu perfil. El sistema dejará de proponerte como instructor.
$md$,
 'guia',
 7,
 ARRAY['instructor','owner','admin']::text[],
 true
)
ON CONFLICT (slug) DO UPDATE
  SET title = EXCLUDED.title,
      summary = EXCLUDED.summary,
      body = EXCLUDED.body,
      section = EXCLUDED.section,
      "order" = EXCLUDED."order",
      role_visibility = EXCLUDED.role_visibility,
      updated_at = now();

-- 5. Monitor — Usar la IA tras la clase --------------------------------------
INSERT INTO help_articles (slug, title, summary, body, section, "order", role_visibility, published)
VALUES
('monitor-ia-feedback',
 'Usar la IA tras cada clase',
 'Dicta una nota de voz de 2 minutos y la IA reparte los comentarios e insignias a cada alumno.',
 $md$
# IA después de la clase

Tu objetivo es que cada alumno reciba **feedback útil** sin que tú tengas que escribir cinco mensajes. La IA hace el reparto.

## Flujo recomendado

1. Al acabar la clase, abre **IA → Notas de voz**.
2. Pulsa "Nueva nota" y elige la clase que acabas de dar.
3. Graba: di los nombres tal cual aparecen en la lista de alumnos.

Ejemplo real:

> "Hoy en la de las 11, Lucía con Sultán muy buen ritmo en el galope, dadle insignia de progreso. Marcos con Trueno cuidar la mano izquierda."

4. La IA propone: a quién va cada comentario, qué insignia sugerir, y a qué caballo lo relaciona.
5. Ajustas lo que quieras y pulsas **Confirmar**.

Los alumnos lo reciben en su perfil al instante.

## Errores frecuentes

- **No dijiste el nombre del alumno**: la IA pide que lo identifiques tú a mano.
- **Dos alumnos con nombres similares**: di apellido o "el de Trueno" para desambiguar.
- **Caballos con nombre poco común**: si la IA no lo coge, edita el reparto antes de confirmar.

## Sin nota de voz

También puedes pegar texto en lugar de grabar, o ir alumno por alumno escribiendo el feedback directamente. La IA solo es una vía rápida; no es obligatoria.

---

> Consejo: graba en cuanto acabes la clase, no más tarde. Los detalles se pierden rápido.
$md$,
 'guia',
 8,
 ARRAY['instructor','owner','admin']::text[],
 true
)
ON CONFLICT (slug) DO UPDATE
  SET title = EXCLUDED.title,
      summary = EXCLUDED.summary,
      body = EXCLUDED.body,
      section = EXCLUDED.section,
      "order" = EXCLUDED."order",
      role_visibility = EXCLUDED.role_visibility,
      updated_at = now();

-- 6. Monitor — Avisar a tus alumnos -----------------------------------------
INSERT INTO help_articles (slug, title, summary, body, section, "order", role_visibility, published)
VALUES
('monitor-avisar-alumnos',
 'Avisar a tus alumnos con un solo mensaje',
 'Anuncios a todos los alumnos de una clase o curso sin abrir un hilo por persona.',
 $md$
# Avisos a tus alumnos

Cuando tienes que decir lo mismo a varios alumnos — clase cancelada por lluvia, cambio de pista, recordatorio de un evento — no abras hilos sueltos. Usa un **anuncio**.

## Mandar un anuncio

1. **Mensajes → Nuevo anuncio**.
2. Elige a quién va: una clase concreta, un curso completo o todos tus alumnos del club.
3. Escribe el mensaje y envía.

Cada alumno lo recibe en su bandeja. Tú ves quién lo ha leído.

## Mensaje directo

Para algo personal (lesión, dudas con la inscripción, agradecimiento), abre un hilo directo con esa persona. Queda separado de los anuncios y es privado.

## Recordatorios automáticos

Equmanager ya manda un recordatorio el día anterior de cada clase. No hace falta que lo dupliques. Reserva tus anuncios para cosas no rutinarias.

## Tono

Los anuncios cortos funcionan mejor:

- ✅ "Mañana la clase de las 10 pasa a las 11 por la lluvia."
- ❌ "Buenos días a todos, espero que estéis bien. Os escribo porque..."

---

> Si tienes que avisar al **propietario** del caballo de un alumno (no al alumno), abre un mensaje directo con él. Los anuncios solo van a alumnos.
$md$,
 'guia',
 9,
 ARRAY['instructor','owner','admin']::text[],
 true
)
ON CONFLICT (slug) DO UPDATE
  SET title = EXCLUDED.title,
      summary = EXCLUDED.summary,
      body = EXCLUDED.body,
      section = EXCLUDED.section,
      "order" = EXCLUDED."order",
      role_visibility = EXCLUDED.role_visibility,
      updated_at = now();
