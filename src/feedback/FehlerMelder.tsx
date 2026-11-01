import { useEffect } from 'react';
import { KANAL } from '../basis/kanal.ts';
import { zielAusHash } from '../basis/navigation.ts';
import { tagVon } from '../belohnung/logik.ts';
import { VERSION_TEXT } from '../basis/version.ts';
import { useProtokoll } from '../daten/ProtokollKontext.tsx';
import { geraetInfo, MAX_FEHLER_TEXT } from './logik.ts';

// Höchstens so viele Fehler pro Tag und jeder nur einmal am Tag (auch über Neustarts hinweg),
// damit ein immer wiederkehrender Fehler das abgeglichene Protokoll nicht füllt
const MAX_PRO_TAG = 5;
const GEMELDET_SCHLUESSEL = `${KANAL.speicherPraefix}-fehler-gemeldet`;

function ladeGemeldet(tag: string): string[] {
  try {
    const g = JSON.parse(localStorage.getItem(GEMELDET_SCHLUESSEL) ?? 'null') as {
      tag: string;
      texte: string[];
    } | null;
    return g?.tag === tag ? g.texte : [];
  } catch {
    return [];
  }
}

function speichereGemeldet(tag: string, texte: string[]) {
  try {
    localStorage.setItem(GEMELDET_SCHLUESSEL, JSON.stringify({ tag, texte }));
  } catch {
    // dann gilt die Grenze nur für diese Sitzung
  }
}

// Schreibt technische Fehler als Rückmeldung ins Protokoll; die Eltern sehen sie nach dem
// Abgleich in ihrer Liste. Kein externer Dienst, keine persönlichen Daten.
export function FehlerMelder() {
  const protokoll = useProtokoll();

  useEffect(() => {
    function melde(text: string) {
      const kurz = text.slice(0, MAX_FEHLER_TEXT);
      const tag = tagVon(new Date().toISOString());
      const gemeldet = ladeGemeldet(tag);
      if (gemeldet.includes(kurz) || gemeldet.length >= MAX_PRO_TAG) return;
      speichereGemeldet(tag, [...gemeldet, kurz]);
      protokoll
        .hinzufuegen({
          typ: 'feedback',
          art: 'fehler',
          text: kurz,
          seite: zielAusHash(window.location.hash),
          version: VERSION_TEXT,
          geraetInfo: geraetInfo(navigator.userAgent),
        })
        .catch(() => {});
    }
    const beiFehler = (e: ErrorEvent) => {
      const ort = e.filename ? ` (${e.filename.split('/').pop()}:${e.lineno})` : '';
      melde(`${e.message || 'Unbekannter Fehler'}${ort}`);
    };
    const beiAblehnung = (e: PromiseRejectionEvent) => {
      const grund = e.reason instanceof Error ? e.reason.message : String(e.reason);
      melde(`Nicht abgefangen: ${grund}`);
    };
    window.addEventListener('error', beiFehler);
    window.addEventListener('unhandledrejection', beiAblehnung);
    return () => {
      window.removeEventListener('error', beiFehler);
      window.removeEventListener('unhandledrejection', beiAblehnung);
    };
  }, [protokoll]);

  return null;
}
