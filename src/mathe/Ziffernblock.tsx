import { useEffect, useRef } from 'react';

export const MAX_STELLEN = 3;

// Großer Ziffernblock statt Handy-Tastatur: immer gleich angeordnet, gut mit dem Daumen zu treffen.
// Am PC gehen auch die Zifferntasten, Rücktaste und Enter.
export function Ziffernblock({
  wert,
  onAendern,
  onFertig,
}: {
  wert: string;
  onAendern: (wert: string) => void;
  onFertig: () => void;
}) {
  const aktuell = useRef({ wert, onAendern, onFertig });
  useEffect(() => {
    aktuell.current = { wert, onAendern, onFertig };
  });

  useEffect(() => {
    function taste(e: KeyboardEvent) {
      const { wert, onAendern, onFertig } = aktuell.current;
      if (/^[0-9]$/.test(e.key) && wert.length < MAX_STELLEN) onAendern(wert + e.key);
      else if (e.key === 'Backspace') onAendern(wert.slice(0, -1));
      else if (e.key === 'Enter' && wert) onFertig();
      else return;
      e.preventDefault();
    }
    window.addEventListener('keydown', taste);
    return () => window.removeEventListener('keydown', taste);
  }, []);

  const ziffer = (z: string) => (
    <button
      key={z}
      type="button"
      className="ziffer"
      disabled={wert.length >= MAX_STELLEN}
      onClick={() => onAendern(wert + z)}
    >
      {z}
    </button>
  );
  return (
    <div className="ziffernblock" role="group" aria-label="Ziffernblock">
      {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(ziffer)}
      <button
        type="button"
        className="ziffer ziffer-weg"
        aria-label="Letzte Ziffer löschen"
        disabled={!wert}
        onClick={() => onAendern(wert.slice(0, -1))}
      >
        ⌫
      </button>
      {ziffer('0')}
      <button type="button" className="ziffer ziffer-fertig" disabled={!wert} onClick={onFertig}>
        Prüfen
      </button>
    </div>
  );
}
