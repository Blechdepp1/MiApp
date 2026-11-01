import { useRef } from 'react';
import { Dialog } from '../basis/Dialog.tsx';
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
  // Ermutigen statt drohen: was sie noch schafft, nicht was sie verliert
  const nochText =
    uebrig <= 0
      ? 'Du bist gleich fertig!'
      : uebrig === 1
        ? 'Nur noch 1 Wort!'
        : `Nur noch ${uebrig} Wörter!`;
  const text = `Möchtest du aufhören? ${nochText} Dann bekommst du deine Punkte für diese Runde.`;

  return (
    <Dialog
      className="aufhoeren"
      beschriftetVon="aufhoeren-titel"
      startFokus={weiter}
      onAbbrechen={onBleiben}
    >
      <div className="aufhoeren-karte">
        <p className="aufhoeren-symbol" aria-hidden="true">
          🤔
        </p>
        <div className="aufhoeren-titel">
          <h2 id="aufhoeren-titel">Möchtest du aufhören?</h2>
          <VorleseKnopf text={text} />
        </div>
        <p className="aufhoeren-noch">
          {nochText} <span aria-hidden="true">💪</span>
        </p>
        <p>Dann bekommst du deine Punkte für diese Runde.</p>
        <div className="aufhoeren-knoepfe">
          <button ref={weiter} type="button" className="runde-weiter" onClick={onBleiben}>
            Weiter üben
          </button>
          <button type="button" className="schreib-hilfe" onClick={onAufhoeren}>
            Später weiter
          </button>
        </div>
      </div>
    </Dialog>
  );
}
