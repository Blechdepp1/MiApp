// Alle Punktwerte an einer Stelle, damit wir sie nach dem ersten Test leicht anpassen können (SPEC: belohnung)

export const PUNKTE = {
  runde: 10,
  richtig: 2,
  mitHilfe: 1,
  verbessert: 5,
  tagesziel: 20,
} as const;

export const TAGESZIEL_RUNDEN = 2;

export type Levelstufe = { ab: number; titel: string };

// Thema „Entdeckerin“: am Anfang schnell, später längere Abstände
export const LEVEL_START: Levelstufe[] = [
  { ab: 0, titel: 'Wort-Sammlerin' },
  { ab: 150, titel: 'Spurenleserin' },
  { ab: 500, titel: 'Pfadfinderin' },
  { ab: 1100, titel: 'Entdeckerin' },
  { ab: 2000, titel: 'Kartenzeichnerin' },
  { ab: 3200, titel: 'Expeditionsleiterin' },
  { ab: 4800, titel: 'Weltreisende' },
  { ab: 7000, titel: 'Sprach-Legende' },
];

// Nach dem letzten Level gibt es alle so viele Punkte einen Stern
export const PUNKTE_PRO_STERN = 2500;
