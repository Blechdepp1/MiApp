import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { KANAL } from '../basis/kanal.ts';
import { useGeraet } from './GeraetKontext.tsx';
import { MAX_FEHLVERSUCHE, pruefePin, SPERRE_MS } from './pin.ts';
import { PinEingabe } from './PinEingabe.tsx';

// Fehlversuche und Sperre überstehen ein Neuladen (localStorage). Jede weitere Sperre dauert
// länger, damit Durchprobieren aller 10 000 PINs aussichtslos ist.
type Sperre = { fehlversuche: number; gesperrtBis: number; stufe: number };
const SPERRE_SCHLUESSEL = `${KANAL.speicherPraefix}-pin-sperre`;
const SPERR_FAKTOR = [1, 5, 15, 60];

function ladeSperre(): Sperre {
  try {
    const s = JSON.parse(localStorage.getItem(SPERRE_SCHLUESSEL) ?? 'null') as Sperre | null;
    if (s && Number.isFinite(s.fehlversuche) && Number.isFinite(s.gesperrtBis)) {
      return { fehlversuche: s.fehlversuche, gesperrtBis: s.gesperrtBis, stufe: s.stufe ?? 0 };
    }
  } catch {
    // ohne Speicher gilt die Sperre nur bis zum Neuladen
  }
  return { fehlversuche: 0, gesperrtBis: 0, stufe: 0 };
}

let sperre = ladeSperre();

function speichereSperre(neu: Sperre) {
  sperre = neu;
  try {
    localStorage.setItem(SPERRE_SCHLUESSEL, JSON.stringify(neu));
  } catch {
    // siehe ladeSperre
  }
}

// eslint-disable-next-line react-refresh/only-export-components
export function setzeSperreZurueck() {
  speichereSperre({ fehlversuche: 0, gesperrtBis: 0, stufe: 0 });
}

// Offener Bereich schließt sich nach so langer Zeit ohne Eingabe oder im Hintergrund
export const INAKTIV_MS = 5 * 60 * 1000;
export const HINTERGRUND_MS = 2 * 60 * 1000;

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
  const [gesperrt, setGesperrt] = useState(() => sperre.gesperrtBis > jetzt());
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

  // Ohne Eingabe oder lange im Hintergrund wieder zu, z. B. wenn das Handy zurück ans Kind geht
  useEffect(() => {
    if (!offen) return;
    let zuletzt = jetzt();
    let versteckt = 0;
    const schliessen = () => {
      merkeFreigabe(null);
      setOffen(false);
    };
    const aktiv = () => {
      zuletzt = jetzt();
    };
    const sichtbarkeit = () => {
      if (document.hidden) versteckt = jetzt();
      else if (versteckt && jetzt() - versteckt > HINTERGRUND_MS) schliessen();
    };
    const timer = setInterval(() => {
      if (jetzt() - zuletzt > INAKTIV_MS) schliessen();
    }, 15 * 1000);
    window.addEventListener('pointerdown', aktiv);
    window.addEventListener('keydown', aktiv);
    document.addEventListener('visibilitychange', sichtbarkeit);
    return () => {
      clearInterval(timer);
      window.removeEventListener('pointerdown', aktiv);
      window.removeEventListener('keydown', aktiv);
      document.removeEventListener('visibilitychange', sichtbarkeit);
    };
  }, [offen, jetzt]);

  useEffect(() => {
    if (!gesperrt) return;
    const timer = setTimeout(() => setGesperrt(false), Math.max(0, sperre.gesperrtBis - jetzt()));
    return () => clearTimeout(timer);
  }, [gesperrt, jetzt]);

  const minuten = Math.max(1, Math.ceil((sperre.gesperrtBis - jetzt()) / 60_000));
  const sperrText = `Zu viele falsche Versuche. Bitte ${minuten === 1 ? 'eine Minute' : `${minuten} Minuten`} warten.`;

  const pinEingegeben = useCallback(
    async (pin: string) => {
      if (!geraet) return;
      if (await pruefePin(pin, geraet.pin)) {
        setzeSperreZurueck();
        setOffen(true);
        return;
      }
      const fehlversuche = sperre.fehlversuche + 1;
      if (fehlversuche >= MAX_FEHLVERSUCHE) {
        const faktor = SPERR_FAKTOR[Math.min(sperre.stufe, SPERR_FAKTOR.length - 1)]!;
        speichereSperre({
          fehlversuche: 0,
          gesperrtBis: jetzt() + SPERRE_MS * faktor,
          stufe: sperre.stufe + 1,
        });
        setGesperrt(true);
        setFehler(null);
      } else {
        speichereSperre({ ...sperre, fehlversuche });
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
        fehler={gesperrt ? sperrText : fehler}
        gesperrt={gesperrt}
        onFertig={pinEingegeben}
      />
      <button type="button" className="einrichtung-zurueck" onClick={() => setVergessen((v) => !v)}>
        PIN vergessen?
      </button>
      {vergessen && (
        <p className="eltern-hinweis">
          Wie ihr die PIN zurücksetzt, steht in der Anleitung für Eltern (docs/eltern.md).
        </p>
      )}
    </div>
  );
}
