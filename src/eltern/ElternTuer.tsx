import { useCallback, useEffect, useState, type ReactNode } from 'react';
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

// Zeigt den Inhalt erst nach richtiger PIN; beim Verlassen der Seite ist wieder zu
export function ElternTuer({
  children,
  jetzt = Date.now,
}: {
  children: ReactNode;
  jetzt?: () => number;
}) {
  const { geraet } = useGeraet();
  const [offen, setOffen] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [gesperrt, setGesperrt] = useState(() => gesperrtBis > jetzt());
  const [vergessen, setVergessen] = useState(false);

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
