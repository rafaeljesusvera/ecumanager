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
};

export function getCompetitionData(email: string | null | undefined): SeasonStats | null {
  if (!email) return null;
  return DATA[email.toLowerCase()] ?? null;
}
