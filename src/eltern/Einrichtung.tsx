import { useCallback, useState } from 'react';
import { VorleseKnopf } from '../basis/VorleseKnopf.tsx';
import type { Rolle } from './geraet.ts';
import { useGeraet } from './GeraetKontext.tsx';
import { erzeugePruefwert } from './pin.ts';
import { PinEingabe } from './PinEingabe.tsx';
import './Eltern.css';

type Schritt =
  | { art: 'rolle' }
  | { art: 'pin'; rolle: Rolle }
  | { art: 'wiederholen'; rolle: Rolle; pin: string };

// Einmalige Einrichtung eines Geräts durch die Eltern
export function Einrichtung() {
  const { einrichten } = useGeraet();
  const [schritt, setSchritt] = useState<Schritt>({ art: 'rolle' });
  const [fehler, setFehler] = useState<string | null>(null);

  const pinGewaehlt = useCallback(
    async (pin: string) => {
      if (schritt.art === 'pin') {
        setFehler(null);
        setSchritt({ art: 'wiederholen', rolle: schritt.rolle, pin });
      } else if (schritt.art === 'wiederholen') {
        if (pin !== schritt.pin) {
          setFehler('Die beiden PINs waren unterschiedlich. Bitte noch einmal.');
          setSchritt({ art: 'pin', rolle: schritt.rolle });
          return;
        }
        await einrichten({ rolle: schritt.rolle, pin: await erzeugePruefwert(pin) });
      }
    },
    [schritt, einrichten],
  );

  if (schritt.art === 'rolle') {
    const frage = 'Willkommen! Wer benutzt dieses Gerät?';
    return (
      <section className="einrichtung">
        <div className="einrichtung-titel">
          <h1>{frage}</h1>
          <VorleseKnopf text={frage} />
        </div>
        <p>Das richten Eltern einmal ein.</p>
        <div className="einrichtung-rollen">
          <button type="button" onClick={() => setSchritt({ art: 'pin', rolle: 'kind' })}>
            <span aria-hidden="true">🧒</span>
            <span>Mein Kind zum Lernen</span>
          </button>
          <button type="button" onClick={() => setSchritt({ art: 'pin', rolle: 'eltern' })}>
            <span aria-hidden="true">👨‍👩‍👧</span>
            <span>Wir Eltern</span>
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="einrichtung">
      <PinEingabe
        key={schritt.art}
        titel={schritt.art === 'pin' ? 'Eltern-PIN festlegen' : 'PIN noch einmal eingeben'}
        hinweis={
          schritt.art === 'pin'
            ? 'Mit dieser PIN öffnet ihr später den Eltern-Bereich. Das Kind sollte sie nicht kennen.'
            : undefined
        }
        fehler={fehler}
        onFertig={pinGewaehlt}
      />
      <button
        type="button"
        className="einrichtung-zurueck"
        onClick={() => {
          setFehler(null);
          setSchritt({ art: 'rolle' });
        }}
      >
        ← Andere Auswahl
      </button>
    </section>
  );
}
