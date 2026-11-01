import { useState } from 'react';
import { PIN_LAENGE } from './pin.ts';
import './Eltern.css';

const TASTEN = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

// Großes Zahlenfeld statt Tastatur; schickt die PIN ab, sobald alle Ziffern da sind
export function PinEingabe({
  titel,
  hinweis,
  fehler,
  gesperrt = false,
  onFertig,
}: {
  titel: string;
  hinweis?: string;
  fehler?: string | null;
  gesperrt?: boolean;
  onFertig: (pin: string) => void;
}) {
  const [ziffern, setZiffern] = useState('');

  function tippe(taste: string) {
    if (gesperrt) return;
    if (taste === '⌫') {
      setZiffern(ziffern.slice(0, -1));
      return;
    }
    const neu = ziffern + taste;
    if (neu.length < PIN_LAENGE) {
      setZiffern(neu);
    } else {
      setZiffern('');
      onFertig(neu);
    }
  }

  return (
    <div className="pin">
      <h2>{titel}</h2>
      {hinweis && <p>{hinweis}</p>}
      <div className="pin-punkte" aria-label={`${ziffern.length} von ${PIN_LAENGE} Ziffern`}>
        {Array.from({ length: PIN_LAENGE }, (_, i) => (
          <span key={i} data-voll={i < ziffern.length} />
        ))}
      </div>
      {fehler && (
        <p className="pin-fehler" role="alert">
          {fehler}
        </p>
      )}
      <div className="pin-tasten">
        {TASTEN.map((taste, i) =>
          taste ? (
            <button
              key={i}
              type="button"
              onClick={() => tippe(taste)}
              disabled={gesperrt}
              aria-label={taste === '⌫' ? 'Löschen' : taste}
            >
              {taste}
            </button>
          ) : (
            <span key={i} />
          ),
        )}
      </div>
    </div>
  );
}
