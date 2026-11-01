import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { KANAL } from '../basis/kanal.ts';
import { useGeraet } from './GeraetKontext.tsx';
import { MAX_FEHLVERSUCHE, pruefePin, SPERRE_MS } from './pin.ts';
import { PinEingabe } from './PinEingabe.tsx';

// Fehlversuche gelten für die ganze Sitzung, nicht nur für einen Besuch der Seite
let fehlversuche = 0;
let gesperrtBis = 0;

// eslint-disable-next-line react-refresh/only-export-components
export function setzeSperreZurueck() {
  fehlversuche = 0;
  gesperrtBis = 0;
}

// Android beendet die App oft im Hintergrund, während die Kamera offen ist. Damit die PIN
// danach nicht erneut gefragt wird, merkt sich der Tab die Freigabe kurz (nur sessionStorage).
export const FREIGABE_MS = 10 * 60 * 1000;
const FREIGABE_SCHLUESSEL = `${KANAL.speicherPraefix}-eltern-offen`;

function freigabeGilt(jetzt: number) {
  try {
    const seit = Number(sessionStorage.getItem(FREIGABE_SCHLUESSEL));
    return seit > 0 && jetzt - seit < FREIGABE_MS;
  } catch {
    return false;
  }
}

function merkeFreigabe(wert: number | null) {
  try {
    if (wert === null) sessionStorage.removeItem(FREIGABE_SCHLUESSEL);
    else sessionStorage.setItem(FREIGABE_SCHLUESSEL, String(wert));
  } catch {
    // ohne sessionStorage wird die PIN eben wieder gefragt
  }
}

// Zeigt den Inhalt erst nach richtiger PIN; beim Verlassen der Seite ist wieder zu
export function ElternTuer({
  children,
  jetzt = Date.now,
}: {
  children: ReactNode;
  jetzt?: () => number;
}) {
  const { geraet } = useGeraet();
  const [offen, setOffen] = useState(() => freigabeGilt(jetzt()));
  const [fehler, setFehler] = useState<string | null>(null);
  const [gesperrt, setGesperrt] = useState(() => gesperrtBis > jetzt());
  const [vergessen, setVergessen] = useState(false);

  // Solange der Bereich offen ist, gilt die Freigabe; wer ihn verlässt, schließt ihn wieder
  useEffect(() => {
    if (!offen) return;
    merkeFreigabe(jetzt());
    const timer = setInterval(() => merkeFreigabe(jetzt()), 60 * 1000);
    return () => {
      clearInterval(timer);
      merkeFreigabe(null);
    };
  }, [offen, jetzt]);

  useEffect(() => {
    if (!gesperrt) return;
    const timer = setTimeout(() => setGesperrt(false), Math.max(0, gesperrtBis - jetzt()));
    return () => clearTimeout(timer);
  }, [gesperrt, jetzt]);

  const pinEingegeben = useCallback(
    async (pin: string) => {
      if (!geraet) return;
      if (await pruefePin(pin, geraet.pin)) {
        fehlversuche = 0;
        setOffen(true);
        return;
      }
      fehlversuche++;
      if (fehlversuche >= MAX_FEHLVERSUCHE) {
        fehlversuche = 0;
        gesperrtBis = jetzt() + SPERRE_MS;
        setGesperrt(true);
        setFehler('Zu viele falsche Versuche. Bitte eine Minute warten.');
      } else {
        setFehler('Die PIN stimmt nicht.');
      }
    },
    [geraet, jetzt],
  );

  if (offen) return <>{children}</>;

  return (
    <div className="eltern-tuer">
      <PinEingabe
        titel="Eltern-PIN eingeben"
        fehler={gesperrt ? 'Zu viele falsche Versuche. Bitte eine Minute warten.' : fehler}
        gesperrt={gesperrt}
        onFertig={pinEingegeben}
      />
      <button type="button" className="einrichtung-zurueck" onClick={() => setVergessen((v) => !v)}>
        PIN vergessen?
      </button>
      {vergessen && (
        <p className="eltern-hinweis">
          Die PIN lässt sich nur zurücksetzen, indem ihr die Daten der App auf diesem Gerät löscht
          (Chrome → Einstellungen → Website-Einstellungen → blechdepp1.github.io → Daten löschen)
          und das Gerät neu einrichtet. Nach dem Abgleich mit Dropbox sind Punkte und Listen wieder
          da.
        </p>
      )}
    </div>
  );
}
