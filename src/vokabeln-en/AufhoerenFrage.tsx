import { useEffect, useRef } from 'react';
import { VorleseKnopf } from '../basis/VorleseKnopf.tsx';

// Kindgerechte Nachfrage, bevor eine angefangene Runde verlassen wird
export function AufhoerenFrage({
  uebrig,
  onBleiben,
  onAufhoeren,
}: {
  uebrig: number;
  onBleiben: () => void;
  onAufhoeren: () => void;
}) {
  const weiter = useRef<HTMLButtonElement>(null);
  const nochText =
    uebrig <= 0
      ? 'Du bist gleich fertig!'
      : uebrig === 1
        ? 'Nur noch 1 Wort!'
        : `Nur noch ${uebrig} Wörter!`;
  const text = `Möchtest du wirklich aufhören? Wenn du jetzt aufhörst, bekommst du für diese Runde keine Punkte. ${nochText}`;

  useEffect(() => {
    weiter.current?.focus();
  }, []);

  return (
    <div className="aufhoeren" role="dialog" aria-modal="true" aria-labelledby="aufhoeren-titel">
      <div className="aufhoeren-karte">
        <p className="aufhoeren-symbol" aria-hidden="true">
          🤔
        </p>
        <div className="aufhoeren-titel">
          <h2 id="aufhoeren-titel">Möchtest du wirklich aufhören?</h2>
          <VorleseKnopf text={text} />
        </div>
        <p>
          Wenn du jetzt aufhörst, bekommst du für diese Runde <strong>keine Punkte</strong>.
        </p>
        <p className="aufhoeren-noch">
          {nochText} <span aria-hidden="true">💪</span>
        </p>
        <div className="aufhoeren-knoepfe">
          <button ref={weiter} type="button" className="runde-weiter" onClick={onBleiben}>
            Weiter üben
          </button>
          <button type="button" className="schreib-hilfe" onClick={onAufhoeren}>
            Aufhören
          </button>
        </div>
      </div>
    </div>
  );
}
