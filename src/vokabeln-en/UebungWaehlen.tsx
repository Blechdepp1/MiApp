import { useEffect, useState } from 'react';
import { useEinstellungen } from '../basis/EinstellungenKontext.tsx';
import { vorlesen, type Sprache } from '../basis/vorlesen.ts';
import { VorleseKnopf } from '../basis/VorleseKnopf.tsx';
import { sprechtext } from './runde.ts';
import type { Vokabel } from './typen.ts';

// Wort sehen und hören, dann aus drei Möglichkeiten die Übersetzung antippen
export function UebungWaehlen({
  wort,
  optionen,
  richtung,
  onAntwort,
}: {
  wort: Vokabel;
  optionen: Vokabel[];
  richtung: 'en-de' | 'de-en';
  onAntwort: (richtig: boolean) => void;
}) {
  const { einstellungen } = useEinstellungen();
  const [gewaehlt, setGewaehlt] = useState<string | null>(null);
  const [frageSprache, antwortSprache]: [Sprache, Sprache] =
    richtung === 'en-de' ? ['en', 'de'] : ['de', 'en'];
  const frage = richtung === 'en-de' ? wort.en : wort.de;
  const text = (v: Vokabel) => (richtung === 'en-de' ? v.de : v.en);
  const anweisung =
    richtung === 'en-de'
      ? 'Hör zu. Was heißt das auf Deutsch?'
      : 'Was heißt das auf Englisch? Tippe auf das richtige Wort.';

  // Das Wort beim Erscheinen einmal vorlesen
  useEffect(() => {
    vorlesen(sprechtext(frage), frageSprache, { tempo: einstellungen.tempo });
  }, [frage, frageSprache, einstellungen.tempo]);

  function waehlen(option: Vokabel) {
    if (gewaehlt) return;
    setGewaehlt(option.id);
    onAntwort(option.id === wort.id);
  }

  return (
    <div className="uebung">
      <p className="uebung-anweisung">
        <VorleseKnopf text={anweisung} />
        <span>{anweisung}</span>
      </p>

      <div className="uebung-frage" lang={frageSprache}>
        <VorleseKnopf text={sprechtext(frage)} sprache={frageSprache} />
        <span>{frage}</span>
      </div>

      <ul className="uebung-optionen">
        {optionen.map((o) => {
          const zustand = !gewaehlt
            ? undefined
            : o.id === wort.id
              ? 'richtig'
              : o.id === gewaehlt
                ? 'daneben'
                : 'aus';
          return (
            <li key={o.id} lang={antwortSprache}>
              <button
                type="button"
                className="uebung-option"
                data-zustand={zustand}
                disabled={gewaehlt !== null}
                onClick={() => waehlen(o)}
              >
                {zustand === 'richtig' && <span aria-hidden="true">✓ </span>}
                {text(o)}
              </button>
              <VorleseKnopf text={sprechtext(text(o))} sprache={antwortSprache} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
