import { useState } from 'react';
import { Seite } from '../basis/Seite.tsx';
import { tagVon } from '../belohnung/logik.ts';
import { useEreignisse } from '../daten/ProtokollKontext.tsx';
import type { LernEreignis } from '../daten/ereignisse.ts';
import { BEISPIELLISTE } from './beispielliste.ts';
import { Runde } from './Runde.tsx';
import type { Zufall } from './runde.ts';
import type { Vokabelliste } from './typen.ts';
import './Vokabeln.css';

export function VokabelSeite({
  listen = [BEISPIELLISTE],
  zufall,
}: {
  listen?: Vokabelliste[];
  zufall?: Zufall;
}) {
  const ereignisse = useEreignisse();
  const [runde, setRunde] = useState(0);
  // Stand zu Beginn der Runde einfrieren, damit neue Antworten die laufende Runde nicht neu mischen
  const [start, setStart] = useState<{ runde: number; ereignisse: LernEreignis[] } | null>(null);
  if (ereignisse && start?.runde !== runde) setStart({ runde, ereignisse });

  return (
    <Seite titel="Vokabeln" vorlesetext="Vokabeln üben">
      {!start ? (
        <p>Einen Moment …</p>
      ) : (
        <Runde
          key={runde}
          listen={listen}
          ereignisse={start.ereignisse}
          heute={tagVon(new Date().toISOString())}
          zufall={zufall}
          onNochEinmal={() => setRunde((r) => r + 1)}
        />
      )}
    </Seite>
  );
}
