import { useEffect } from 'react';
import { zielAusHash } from '../basis/navigation.ts';
import { VERSION_TEXT } from '../basis/version.ts';
import { useProtokoll } from '../daten/ProtokollKontext.tsx';
import { geraetInfo, MAX_FEHLER_TEXT } from './logik.ts';

// Höchstens so viele Fehler pro Sitzung, damit ein Fehler in einer Schleife das Protokoll nicht füllt
const MAX_PRO_SITZUNG = 5;

// Schreibt technische Fehler als Rückmeldung ins Protokoll; die Eltern sehen sie nach dem
// Abgleich in ihrer Liste. Kein externer Dienst, keine persönlichen Daten.
export function FehlerMelder() {
  const protokoll = useProtokoll();

  useEffect(() => {
    const gemeldet = new Set<string>();
    function melde(text: string) {
      const kurz = text.slice(0, MAX_FEHLER_TEXT);
      if (gemeldet.has(kurz) || gemeldet.size >= MAX_PRO_SITZUNG) return;
      gemeldet.add(kurz);
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
