/**
 * Datos de competición para el dashboard del corredor.
 *
 * La RFHE publica el calendario y los resultados de competiciones oficiales
 * en su web pero NO ofrece API pública abierta para extraer la información
 * de un jinete concreto. Hasta que tengamos convenio con la federación,
 * usamos un dataset demo curado por email para enseñar la experiencia.
 *
 * Si el jinete no tiene dataset, devolvemos `null` y el widget no se pinta.
 */

export type CompetitionEvent = {
  date: string; // ISO
  title: string;
  venue: string;
  category: string;
  status: 'inscrito' | 'pre_inscrito' | 'siguiente';
};

export type CompetitionResult = {
  date: string;
  title: string;
  venue: string;
  category: string;
  position: number | null;
  total: number;
  faults?: number | null;
  time?: string | null;
  horse: string;
};

export type SeasonStats = {
  rfheLicense?: string;
  category: string;
  ranking?: { position: number; total: number; tour: string };
  bestRound?: { faults: number; time: string; venue: string };
  upcoming: CompetitionEvent[];
  results: CompetitionResult[];
};

const DATA: Record<string, SeasonStats> = {
  // -------------------------------------------------------------------------
  // Fixture original (POC). Activable por email exacto.
  // -------------------------------------------------------------------------
  'emg.mayeste@gmail.com': {
    rfheLicense: 'RFHE-2024-08412',
    category: 'Adulto · 1,15 m',
    ranking: {
      position: 17,
      total: 124,
      tour: 'Copa Federación CCAA Madrid 2026',
    },
    bestRound: { faults: 0, time: '54.21', venue: 'CDM Casas Novas' },
    upcoming: [
      {
        date: '2026-06-12',
        title: 'CSN** Club de Campo Villa de Madrid',
        venue: 'Madrid',
        category: '1,10 m / 1,20 m',
        status: 'inscrito',
      },
      {
        date: '2026-06-27',
        title: 'Copa Federación · 5ª Jornada',
        venue: 'Hípica Valdebebas',
        category: '1,15 m',
        status: 'pre_inscrito',
      },
      {
        date: '2026-07-04',
        title: 'CSN*** Sunshine Tour Vejer',
        venue: 'Vejer de la Frontera',
        category: '1,20 m',
        status: 'siguiente',
      },
    ],
    results: [
      {
        date: '2026-05-08',
        title: 'CSN** Hípica La Moraleja',
        venue: 'Alcobendas',
        category: '1,15 m',
        position: 3,
        total: 42,
        faults: 0,
        time: '56.84',
        horse: 'Bambino du Rouet',
      },
      {
        date: '2026-04-20',
        title: 'Copa Federación · 3ª Jornada',
        venue: 'Hípica Valdebebas',
        category: '1,10 m',
        position: 6,
        total: 38,
        faults: 4,
        time: '58.10',
        horse: 'Bambino du Rouet',
      },
      {
        date: '2026-03-29',
        title: 'CSN* Real Club Pineda',
        venue: 'Sevilla',
        category: '1,10 m',
        position: 11,
        total: 51,
        faults: 4,
        time: '60.32',
        horse: 'Quintana Z',
      },
      {
        date: '2026-03-08',
        title: 'CSN** Club Hípico Cañada Real',
        venue: 'Madrid',
        category: '1,05 m',
        position: 2,
        total: 35,
        faults: 0,
        time: '54.21',
        horse: 'Bambino du Rouet',
      },
    ],
  },

  // -------------------------------------------------------------------------
  // Demo · Estania Mayayo García
  // Joven amateur de Aragón compitiendo en 1,30 m. Datos ficticios para
  // mostrar el dashboard sin necesidad de integración con la RFHE.
  // -------------------------------------------------------------------------
  'estania.mayayo@equmanager.demo': {
    rfheLicense: 'RFHE-2026-12047',
    category: 'Joven · 1,30 m',
    ranking: {
      position: 8,
      total: 95,
      tour: 'Copa Federación Aragón 2026',
    },
    bestRound: { faults: 0, time: '56.78', venue: 'CDM Casas Novas' },
    upcoming: [
      {
        date: '2026-06-06',
        title: 'CSN*** Real Sociedad Hípica Zaragoza',
        venue: 'Zaragoza',
        category: '1,25 m / 1,30 m',
        status: 'inscrito',
      },
      {
        date: '2026-06-21',
        title: 'Copa Federación · 4ª Jornada',
        venue: 'Club Hípico La Pinilla',
        category: '1,30 m',
        status: 'inscrito',
      },
      {
        date: '2026-07-10',
        title: 'CSN*** Sunshine Tour Vejer',
        venue: 'Vejer de la Frontera',
        category: '1,30 m',
        status: 'pre_inscrito',
      },
      {
        date: '2026-08-15',
        title: 'Campeonato de España de Jóvenes',
        venue: 'CDM Casas Novas, Arteixo',
        category: '1,35 m',
        status: 'siguiente',
      },
    ],
    results: [
      {
        date: '2026-05-17',
        title: 'CSN** Hípica Tordesillas',
        venue: 'Tordesillas',
        category: '1,30 m',
        position: 1,
        total: 28,
        faults: 0,
        time: '58.42',
        horse: 'Querida del Castaño',
      },
      {
        date: '2026-05-03',
        title: 'Copa Federación · 3ª Jornada',
        venue: 'Club Hípico La Pinilla',
        category: '1,30 m',
        position: 4,
        total: 31,
        faults: 0,
        time: '60.11',
        horse: 'Querida del Castaño',
      },
      {
        date: '2026-04-19',
        title: 'CSN*** Real Sociedad Hípica Zaragoza',
        venue: 'Zaragoza',
        category: '1,25 m',
        position: 2,
        total: 44,
        faults: 0,
        time: '56.78',
        horse: 'Querida del Castaño',
      },
      {
        date: '2026-04-05',
        title: 'CSN** Hípica Valdebebas',
        venue: 'Madrid',
        category: '1,30 m',
        position: 7,
        total: 39,
        faults: 4,
        time: '59.04',
        horse: 'Rubí de Marlot',
      },
      {
        date: '2026-03-22',
        title: 'CSN** Club de Campo Villa de Madrid',
        venue: 'Madrid',
        category: '1,25 m',
        position: 3,
        total: 51,
        faults: 0,
        time: '57.62',
        horse: 'Querida del Castaño',
      },
      {
        date: '2026-03-01',
        title: 'CSN* Hípica El Trébol',
        venue: 'Huesca',
        category: '1,20 m',
        position: 5,
        total: 27,
        faults: 4,
        time: '62.18',
        horse: 'Rubí de Marlot',
      },
    ],
  },
};

// Permite también activar el dataset por nombre completo del perfil
// (normalizado sin acentos ni mayúsculas). Útil cuando no hay control
// sobre el email auth del usuario demo.
const DATA_BY_NAME: Record<string, string> = {
  'estania mayayo garcia': 'estania.mayayo@equmanager.demo',
};

function normalizeName(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

export function getCompetitionData(email: string | null | undefined): SeasonStats | null {
  if (!email) return null;
  return DATA[email.toLowerCase()] ?? null;
}

/**
 * Busca el dataset por email primero y, si no encuentra, por nombre completo
 * normalizado. Pensado para entornos demo donde el email del auth no coincide
 * con la clave del fixture.
 */
export function findCompetitionData({
  email,
  fullName,
}: {
  email?: string | null;
  fullName?: string | null;
}): SeasonStats | null {
  const byEmail = getCompetitionData(email);
  if (byEmail) return byEmail;
  if (!fullName) return null;
  const key = DATA_BY_NAME[normalizeName(fullName)];
  return key ? DATA[key] ?? null : null;
}
