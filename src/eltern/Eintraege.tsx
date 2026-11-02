import { MitwachsendesFeld } from '../basis/MitwachsendesFeld.tsx';
import type { Verb } from '../lektionen/lektion.ts';
import type { Eintrag } from './eintragsArten.ts';

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
