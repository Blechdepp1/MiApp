import { useEffect, useRef, useState } from 'react';
import { navigiere, setzeWache, type Ziel } from './navigation.ts';

// Fragt nach, bevor eine Seite verlassen wird – über den App-Knopf und über die Zurück-Taste des Handys.
// Für die Zurück-Taste liegt ein zusätzlicher Verlaufseintrag (gleiche Adresse) „davor“,
// den die Taste zuerst wegnimmt; das ist das Signal für die Nachfrage.
export function useVerlassenBestaetigen(aktiv: boolean) {
  const [frage, setFrage] = useState<Ziel | null>(null);
  const wacheImVerlauf = useRef(false);
  const nachZurueck = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!aktiv) return;

    const wacheSetzen = () => {
      window.history.pushState({ ...window.history.state, wache: true }, '', window.location.href);
      wacheImVerlauf.current = true;
    };
    const beiZurueck = () => {
      if (nachZurueck.current) {
        const danach = nachZurueck.current;
        nachZurueck.current = null;
        danach();
        return;
      }
      if (wacheImVerlauf.current) {
        wacheImVerlauf.current = false;
        setFrage('start');
      }
    };

    wacheSetzen();
    setzeWache((ziel) => setFrage(ziel));
    window.addEventListener('popstate', beiZurueck);
    return () => {
      setzeWache(null);
      window.removeEventListener('popstate', beiZurueck);
      // Zusatzeintrag wieder entfernen, damit die Zurück-Taste danach normal funktioniert
      if (wacheImVerlauf.current) {
        wacheImVerlauf.current = false;
        window.history.back();
      }
    };
  }, [aktiv]);

  function bleiben() {
    setFrage(null);
    if (!wacheImVerlauf.current) {
      window.history.pushState({ ...window.history.state, wache: true }, '', window.location.href);
      wacheImVerlauf.current = true;
    }
  }

  function verlassen() {
    const ziel = frage ?? 'start';
    setFrage(null);
    setzeWache(null);
    if (wacheImVerlauf.current) {
      // Erst den Zusatzeintrag entfernen, dann wirklich wechseln
      wacheImVerlauf.current = false;
      nachZurueck.current = () => navigiere(ziel, { ohneWache: true });
      window.history.back();
    } else {
      navigiere(ziel, { ohneWache: true });
    }
  }

  return { frage: frage !== null, bleiben, verlassen };
}
