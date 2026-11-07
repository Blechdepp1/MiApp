import { useEffect, useSyncExternalStore } from 'react';

// Navigation über den Hash (#/vokabeln): funktioniert auf GitHub Pages ohne Server-Regeln
export const ZIELE = [
  'start',
  'vokabeln',
  'deutsch',
  'mathe',
  'tests',
  'erfolge',
  'belohnungen',
  'einstellungen',
  'eltern',
] as const;
export type Ziel = (typeof ZIELE)[number];

export function zielAusHash(hash: string): Ziel {
  const name = hash.replace(/^#\/?/, '');
  return (ZIELE as readonly string[]).includes(name) ? (name as Ziel) : 'start';
}

export function pfad(ziel: Ziel): string {
  return ziel === 'start' ? '#/' : `#/${ziel}`;
}

// Merker im Verlaufseintrag: „unter dieser Seite liegt die Startseite“
type VerlaufsZustand = { ueberStart?: true } | null;

function meldeWechsel() {
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

// Eine Seite (z. B. eine laufende Runde) kann das Verlassen erst bestätigen lassen
type Wache = (ziel: Ziel) => void;
let wache: Wache | null = null;

export function setzeWache(neu: Wache | null): void {
  wache = neu;
}

// Der Verlauf bleibt flach: höchstens [Startseite, eine Unterseite].
// So führt die Zurück-Taste von Android immer direkt zur Startseite und dort aus der App.
export function navigiere(ziel: Ziel, { ohneWache = false } = {}): void {
  const aktuell = zielAusHash(window.location.hash);
  if (ziel === aktuell) return;
  if (wache && !ohneWache) {
    wache(ziel);
    return;
  }
  const zustand = window.history.state as VerlaufsZustand;

  if (ziel === 'start') {
    if (zustand?.ueberStart) {
      window.history.back();
    } else {
      window.history.replaceState(null, '', pfad('start'));
      meldeWechsel();
    }
    return;
  }

  if (aktuell === 'start') {
    window.history.pushState({ ueberStart: true }, '', pfad(ziel));
  } else {
    // Von Unterseite zu Unterseite: ersetzen statt stapeln
    window.history.replaceState(zustand, '', pfad(ziel));
  }
  meldeWechsel();
}

function beobachte(z: () => void) {
  window.addEventListener('hashchange', z);
  return () => window.removeEventListener('hashchange', z);
}

export function useZiel(): Ziel {
  const ziel = useSyncExternalStore(beobachte, () => zielAusHash(window.location.hash));
  useEffect(() => {
    window.scrollTo?.(0, 0);
  }, [ziel]);
  return ziel;
}
