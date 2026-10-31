import { useEffect, useSyncExternalStore } from 'react';

// Navigation über den Hash (#/vokabeln): funktioniert auf GitHub Pages ohne Server-Regeln
export const ZIELE = ['start', 'vokabeln', 'belohnungen', 'einstellungen', 'eltern'] as const;
export type Ziel = (typeof ZIELE)[number];

export function zielAusHash(hash: string): Ziel {
  const name = hash.replace(/^#\/?/, '');
  return (ZIELE as readonly string[]).includes(name) ? (name as Ziel) : 'start';
}

export function pfad(ziel: Ziel): string {
  return ziel === 'start' ? '#/' : `#/${ziel}`;
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
