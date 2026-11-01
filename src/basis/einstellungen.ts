// Darstellungs- und Vorlese-Einstellungen eines Geräts

export type Schriftgroesse = 'normal' | 'gross' | 'sehr-gross';
export type Abstand = 'normal' | 'weit';
export type Hintergrund = 'creme' | 'weiss' | 'hellblau' | 'dunkel';
export type Schrift = 'standard' | 'opendyslexic';
export type AnAus = 'an' | 'aus';

export type Einstellungen = {
  schriftgroesse: Schriftgroesse;
  abstand: Abstand;
  hintergrund: Hintergrund;
  schrift: Schrift;
  tempo: number;
  // Nach jeder Antwort das englische Wort einmal vorsprechen (Klang + Schriftbild + Bedeutung)
  wortVorsagen: AnAus;
  // Nach jeder Antwort „Sag es laut“ zeigen (laut Sprechen hilft beim Behalten)
  nachsprechen: AnAus;
};

export const STANDARD: Einstellungen = {
  schriftgroesse: 'normal',
  abstand: 'normal',
  hintergrund: 'creme',
  schrift: 'standard',
  tempo: 0.9,
  wortVorsagen: 'an',
  nachsprechen: 'an',
};

export const TEMPO_MIN = 0.5;
export const TEMPO_MAX = 1.3;

export type EinstellungsSpeicher = {
  laden(): Promise<Partial<Einstellungen> | undefined>;
  speichern(einstellungen: Einstellungen): Promise<void>;
};

const ERLAUBT = {
  schriftgroesse: ['normal', 'gross', 'sehr-gross'],
  abstand: ['normal', 'weit'],
  hintergrund: ['creme', 'weiss', 'hellblau', 'dunkel'],
  schrift: ['standard', 'opendyslexic'],
  wortVorsagen: ['an', 'aus'],
  nachsprechen: ['an', 'aus'],
} as const;

// Gespeicherte Werte prüfen, damit alte oder kaputte Daten nie die Darstellung zerstören
export function bereinige(gespeichert: Partial<Einstellungen> | undefined): Einstellungen {
  const e = { ...STANDARD };
  if (!gespeichert) return e;
  for (const schluessel of Object.keys(ERLAUBT) as (keyof typeof ERLAUBT)[]) {
    const wert = gespeichert[schluessel];
    if ((ERLAUBT[schluessel] as readonly unknown[]).includes(wert)) {
      Object.assign(e, { [schluessel]: wert });
    }
  }
  const tempo = gespeichert.tempo;
  if (typeof tempo === 'number' && tempo >= TEMPO_MIN && tempo <= TEMPO_MAX) e.tempo = tempo;
  return e;
}

export function speicherImArbeitsspeicher(start?: Partial<Einstellungen>): EinstellungsSpeicher {
  let inhalt = start;
  return {
    laden: async () => inhalt,
    speichern: async (e) => {
      inhalt = { ...e };
    },
  };
}
