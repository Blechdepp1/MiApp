import { useState } from 'react';
import { MitwachsendesFeld } from '../basis/MitwachsendesFeld.tsx';
import type { Verb } from '../lektionen/lektion.ts';
import { ausText, type Art, type Eintrag } from './eintragsArten.ts';

const FORMEN = ['1. Form', '2. Form', '3. Form'] as const;

// Felder eines Eintrags: Englisch und Deutsch oder drei Verbformen und Deutsch
export function EintragFelder({
  eintrag,
  nr,
  onAendern,
}: {
  eintrag: Eintrag;
  nr: number;
  onAendern: (neu: Eintrag) => void;
}) {
  if ('formen' in eintrag) {
    return (
      <span className="eintrag-verb">
        {FORMEN.map((name, i) => (
          <MitwachsendesFeld
            key={name}
            aria-label={`${name} ${nr}`}
            lang="en"
            value={eintrag.formen[i]!}
            onChange={(wert) =>
              onAendern({
                ...eintrag,
                formen: eintrag.formen.map((f, j) => (j === i ? wert : f)) as Verb['formen'],
              })
            }
          />
        ))}
        <MitwachsendesFeld
          aria-label={`Deutsch ${nr}`}
          value={eintrag.de}
          onChange={(wert) => onAendern({ ...eintrag, de: wert })}
        />
      </span>
    );
  }
  return (
    <>
      <MitwachsendesFeld
        aria-label={`Englisch ${nr}`}
        lang="en"
        value={eintrag.en}
        onChange={(wert) => onAendern({ ...eintrag, en: wert })}
      />
      <MitwachsendesFeld
        aria-label={`Deutsch ${nr}`}
        value={eintrag.de}
        onChange={(wert) => onAendern({ ...eintrag, de: wert })}
      />
    </>
  );
}

// Liste einfügen, z. B. vom PC aus Word oder einer Nachricht. Nicht erkannte Zeilen bleiben zum
// Korrigieren im Feld.
export function ListeEinfuegen({
  art,
  eintraege,
  offen = false,
  onUebernehmen,
}: {
  art: Art;
  eintraege: readonly Eintrag[];
  offen?: boolean;
  onUebernehmen: (neu: Eintrag[]) => void;
}) {
  const [text, setText] = useState('');
  const [nichtErkannt, setNichtErkannt] = useState<string[]>([]);

  function uebernehmen() {
    const { neu, fehler } = ausText(art, text, eintraege);
    setNichtErkannt(fehler);
    setText(fehler.join('\n'));
    onUebernehmen(neu);
  }

  return (
    <details className="bearbeiten-einfuegen" open={offen}>
      <summary>{art === 'verben' ? 'Verbliste' : 'Wortliste'} einfügen</summary>
      <label>
        <span>
          {art === 'verben'
            ? 'Eine Zeile pro Verb, z. B. „go – went – gone – gehen“'
            : 'Eine Zeile pro Wort, z. B. „began – anfangen, beginnen“'}
        </span>
        <textarea rows={6} value={text} onChange={(e) => setText(e.target.value)} />
      </label>
      {nichtErkannt.length > 0 && (
        <p className="eltern-hinweis">
          {art === 'verben'
            ? 'Diese Zeilen haben nicht drei Formen und eine Bedeutung und stehen noch oben im Feld.'
            : 'Diese Zeilen haben keine Übersetzung oder keinen Trenner und stehen noch oben im Feld.'}
        </p>
      )}
      <div className="verbinden-knoepfe">
        <button type="button" disabled={!text.trim()} onClick={uebernehmen}>
          Übernehmen
        </button>
      </div>
    </details>
  );
}
