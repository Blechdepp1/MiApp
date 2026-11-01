import { LEVEL_START, type Levelstufe } from './werte.ts';

// Echte Belohnungen, die die Eltern festlegen und das Kind mit Punkten einlöst
export type Belohnung = { id: string; symbol: string; name: string; preis: number };

// Günstigste zuerst; bei gleichem Preis bleibt die Reihenfolge der Eltern
export function nachPreis(belohnungen: Belohnung[]): Belohnung[] {
  return [...belohnungen].sort((a, b) => a.preis - b.preis);
}

export const BELOHNUNGEN_START: Belohnung[] = [
  { id: 'schwimmbad', symbol: '🏊', name: 'Schwimmbad', preis: 900 },
  { id: 'kino', symbol: '🎬', name: 'Kino', preis: 1300 },
  { id: 'kletterhalle', symbol: '🧗', name: 'Kletterhalle / Trampolinpark', preis: 1800 },
  { id: 'freizeitpark', symbol: '🎢', name: 'Freizeitpark', preis: 4000 },
];

export const SYMBOLE = [
  '🏊',
  '🎬',
  '🧗',
  '🎢',
  '🍕',
  '🍦',
  '📱',
  '🎮',
  '📚',
  '🎁',
  '⚽',
  '🐴',
  '🎨',
  '🛍️',
  '⭐',
];

export const MAX_NAME = 40;
export const MAX_PREIS = 100_000;

// Gibt einen verständlichen Fehler zurück oder null, wenn alles passt
export function pruefeBelohnungen(wert: unknown): string | null {
  if (!Array.isArray(wert)) return 'Ungültige Daten';
  const ids = new Set<string>();
  for (const b of wert as Partial<Belohnung>[]) {
    if (typeof b?.id !== 'string' || !b.id || ids.has(b.id)) return 'Ungültige Daten';
    ids.add(b.id);
    if (typeof b.name !== 'string' || !b.name.trim()) return 'Jede Belohnung braucht einen Namen.';
    if (b.name.length > MAX_NAME) return `Namen dürfen höchstens ${MAX_NAME} Zeichen haben.`;
    if (typeof b.symbol !== 'string' || !b.symbol) return 'Jede Belohnung braucht ein Symbol.';
    if (!Number.isInteger(b.preis) || b.preis! < 1 || b.preis! > MAX_PREIS) {
      return `„${b.name}“: Der Preis muss eine ganze Zahl zwischen 1 und ${MAX_PREIS} sein.`;
    }
  }
  return null;
}

export function pruefeLevel(wert: unknown): string | null {
  if (!Array.isArray(wert) || wert.length === 0) return 'Es muss mindestens ein Level geben.';
  let vorher = -1;
  for (const [i, s] of (wert as Partial<Levelstufe>[]).entries()) {
    if (typeof s?.titel !== 'string' || !s.titel.trim())
      return `Level ${i + 1} braucht einen Titel.`;
    if (s.titel.length > MAX_NAME) return `Titel dürfen höchstens ${MAX_NAME} Zeichen haben.`;
    if (!Number.isInteger(s.ab) || s.ab! < 0)
      return `Level ${i + 1}: Punkte müssen eine ganze Zahl sein.`;
    if (i === 0 && s.ab !== 0) return 'Level 1 muss bei 0 Punkten beginnen.';
    if (s.ab! <= vorher) return `Level ${i + 1} muss mehr Punkte brauchen als Level ${i}.`;
    vorher = s.ab!;
  }
  return null;
}

export const INHALTE = {
  belohnungen: { start: BELOHNUNGEN_START, pruefe: pruefeBelohnungen },
  level: { start: LEVEL_START, pruefe: pruefeLevel },
} as const;

export type InhaltName = keyof typeof INHALTE;
export type InhaltDaten = { belohnungen: Belohnung[]; level: Levelstufe[] };
