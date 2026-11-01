import type { LernEreignis, Stimmung } from '../daten/ereignisse.ts';

// Rückmeldungen von Milena und automatisch gemeldete Fehler (SPEC 10a), aus dem Protokoll

export type Rueckmeldung = {
  id: string;
  art: 'rueckmeldung' | 'fehler';
  stimmung?: Stimmung;
  text?: string;
  seite: string;
  version: string;
  geraetInfo?: string;
  zeit: string;
  erledigt: boolean;
};

export const STIMMUNGEN: { stimmung: Stimmung; symbol: string; name: string }[] = [
  { stimmung: 'gut', symbol: '😀', name: 'Gut' },
  { stimmung: 'mittel', symbol: '😐', name: 'Geht so' },
  { stimmung: 'schlecht', symbol: '😟', name: 'Nicht gut' },
];

export function stimmungSymbol(s?: Stimmung): string {
  return STIMMUNGEN.find((x) => x.stimmung === s)?.symbol ?? '💬';
}

// Neueste zuerst
export function rueckmeldungen(ereignisse: readonly LernEreignis[]): Rueckmeldung[] {
  const erledigt = new Set(
    ereignisse.flatMap((e) => (e.typ === 'feedback-erledigt' ? [e.feedbackId] : [])),
  );
  return ereignisse
    .flatMap((e) =>
      e.typ === 'feedback'
        ? [
            {
              id: e.id,
              art: e.art,
              ...(e.stimmung && { stimmung: e.stimmung }),
              ...(e.text && { text: e.text }),
              seite: e.seite,
              version: e.version,
              ...(e.geraetInfo && { geraetInfo: e.geraetInfo }),
              zeit: e.zeit,
              erledigt: erledigt.has(e.id),
            },
          ]
        : [],
    )
    .sort((a, b) => b.zeit.localeCompare(a.zeit));
}

// Kurze Geräte-Angabe ohne persönliche Daten, z. B. „Android 14 · Chrome 141“
export function geraetInfo(ua: string): string {
  const system = /Android [\d.]+/.exec(ua)?.[0] ?? (/Windows/.test(ua) ? 'Windows' : '');
  const browser = /(?:Chrome|Firefox|Version)\/(\d+)/.exec(ua);
  const name = browser
    ? /Firefox/.test(browser[0])
      ? 'Firefox'
      : /Chrome/.test(browser[0])
        ? 'Chrome'
        : 'Safari'
    : '';
  return [system, browser && `${name} ${browser[1]}`].filter(Boolean).join(' · ');
}

export const MAX_FEHLER_TEXT = 500;
