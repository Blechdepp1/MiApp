import type {
  Abstand,
  Einstellungen,
  Hintergrund,
  Schrift,
  Schriftgroesse,
} from './einstellungen.ts';

export type Farben = {
  hintergrund: string;
  flaeche: string;
  text: string;
  textLeise: string;
  akzent: string;
  aufAkzent: string;
  belohnung: string;
  aufBelohnung: string;
};

// Weicher Kontrast: kein reines Schwarz auf reinem Weiß (außer bei „weiß“)
export const FARBEN: Record<Hintergrund, Farben> = {
  creme: {
    hintergrund: '#FBF6EC',
    flaeche: '#F1E7D3',
    text: '#2B2B2B',
    textLeise: '#5C5548',
    akzent: '#2E6F60',
    aufAkzent: '#FFFFFF',
    belohnung: '#F2B544',
    aufBelohnung: '#2B2B2B',
  },
  weiss: {
    hintergrund: '#FFFFFF',
    flaeche: '#F0F0F0',
    text: '#222222',
    textLeise: '#575757',
    akzent: '#2E6F60',
    aufAkzent: '#FFFFFF',
    belohnung: '#F2B544',
    aufBelohnung: '#222222',
  },
  hellblau: {
    hintergrund: '#E8F1FA',
    flaeche: '#D5E5F4',
    text: '#1F2A36',
    textLeise: '#46525E',
    akzent: '#2B5F8A',
    aufAkzent: '#FFFFFF',
    belohnung: '#F2B544',
    aufBelohnung: '#1F2A36',
  },
  dunkel: {
    hintergrund: '#1E2124',
    flaeche: '#2C3035',
    text: '#E8E4DA',
    textLeise: '#B5B0A6',
    akzent: '#7CCBB7',
    aufAkzent: '#10201C',
    belohnung: '#F2B544',
    aufBelohnung: '#1E2124',
  },
};

const GROESSE: Record<Schriftgroesse, string> = {
  normal: '20px',
  gross: '24px',
  'sehr-gross': '28px',
};

const ABSTAENDE: Record<Abstand, { buchstaben: string; woerter: string; zeilen: string }> = {
  normal: { buchstaben: '0.03em', woerter: '0.12em', zeilen: '1.5' },
  weit: { buchstaben: '0.09em', woerter: '0.3em', zeilen: '1.8' },
};

const SCHRIFTEN: Record<Schrift, string> = {
  standard: "'Atkinson Hyperlegible Next', system-ui, sans-serif",
  opendyslexic: "'OpenDyslexic', 'Atkinson Hyperlegible Next', sans-serif",
};

export function themaVariablen(e: Einstellungen): Record<string, string> {
  const f = FARBEN[e.hintergrund];
  const a = ABSTAENDE[e.abstand];
  return {
    '--farbe-hintergrund': f.hintergrund,
    '--farbe-flaeche': f.flaeche,
    '--farbe-text': f.text,
    '--farbe-text-leise': f.textLeise,
    '--farbe-akzent': f.akzent,
    '--farbe-auf-akzent': f.aufAkzent,
    '--farbe-belohnung': f.belohnung,
    '--farbe-auf-belohnung': f.aufBelohnung,
    '--schrift-groesse': GROESSE[e.schriftgroesse],
    '--schrift-familie': SCHRIFTEN[e.schrift],
    '--abstand-buchstaben': a.buchstaben,
    '--abstand-woerter': a.woerter,
    '--abstand-zeilen': a.zeilen,
  };
}

export function wendeThemaAn(e: Einstellungen, ziel: HTMLElement = document.documentElement) {
  for (const [name, wert] of Object.entries(themaVariablen(e))) {
    ziel.style.setProperty(name, wert);
  }
  ziel.dataset.hintergrund = e.hintergrund;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', FARBEN[e.hintergrund].hintergrund);
}

// WCAG-Kontrastverhältnis zweier Hex-Farben
export function kontrast(a: string, b: string): number {
  const [hell, dunkel] = [leuchtdichte(a), leuchtdichte(b)].sort((x, y) => y - x);
  return (hell! + 0.05) / (dunkel! + 0.05);
}

function leuchtdichte(hex: string): number {
  const kanaele = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = kanaele.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}
