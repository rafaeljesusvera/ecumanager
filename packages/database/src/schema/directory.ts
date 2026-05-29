/**
 * Directorio público de clubes hípicos en España.
 *
 * Es SEPARADO de `clubs` (que son los operativos en Equmanager). Esta tabla
 * actúa como "yellow pages": cuando un propietario va al onboarding y crea
 * su hípica, autocompletamos nombre/provincia/web buscando en este
 * directorio. Una entrada aquí no implica que el club esté usando la app.
 *
 * Se alimenta vía script desde dataset oficial (RFHE / federaciones
 * autonómicas) — NO desde el flujo de usuarios.
 *
 * Cuando un usuario reclama una entrada del directorio creando un `clubs`,
 * guardamos el vínculo en `clubs.directoryClubId` (FK desde clubs/clubs.ts).
 */
import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { SPAIN_FEDERATIONS } from '@equmanager/domain';

export const spainFederationEnum = pgEnum(
  'spain_federation',
  SPAIN_FEDERATIONS,
);

export const directoryClubs = pgTable(
  'directory_clubs',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    /**
     * Identificador en la fuente original (p.ej. código RFHE). Permite
     * upsertar el mismo registro al re-ingestar el dataset.
     */
    externalId: text('external_id').notNull(),
    federation: spainFederationEnum('federation').notNull(),
    name: text('name').notNull(),
    /**
     * Slug derivado del nombre para búsqueda rápida sin acentos.
     */
    searchSlug: text('search_slug').notNull(),
    province: text('province'),
    city: text('city'),
    address: text('address'),
    postalCode: text('postal_code'),
    phone: text('phone'),
    email: text('email'),
    website: text('website'),
    latitude: text('latitude'),
    longitude: text('longitude'),
    sourceUrl: text('source_url'),
    /**
     * Volcado del registro original para no perder campos auxiliares y
     * permitir re-procesado si cambiamos el modelo.
     */
    raw: jsonb('raw'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    uniqExternal: uniqueIndex('directory_clubs_external_unique').on(
      t.federation,
      t.externalId,
    ),
    byProvince: index('directory_clubs_province_idx').on(t.province),
    bySearchSlug: index('directory_clubs_search_slug_idx').on(t.searchSlug),
  }),
);
