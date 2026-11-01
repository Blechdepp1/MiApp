import { useState } from 'react';
import { Seite } from '../basis/Seite.tsx';
import { tagVon } from '../belohnung/logik.ts';
import { useEreignisse } from '../daten/ProtokollKontext.tsx';
import type { LernEreignis } from '../daten/ereignisse.ts';
import { useLektionen } from '../lektionen/LektionenKontext.tsx';
import { alleTests, sichtbareTests, testVorrang } from '../klassenarbeiten/logik.ts';
import { berechneStaende } from './leitner.ts';
import { endspurt, vokabelQuellen, type Endspurt } from './quellen.ts';
import { Runde } from './Runde.tsx';
import type { Zufall } from './runde.ts';
import type { Vokabelliste } from './typen.ts';
import './Vokabeln.css';

type Start = {
  runde: number;
  ereignisse: LernEreignis[];
  listen: Vokabelliste[];
  vorrang: Set<string>;
  endspurt: Endspurt[];
};

export function VokabelSeite({ zufall }: { zufall?: Zufall }) {
  const ereignisse = useEreignisse();
  const lektionen = useLektionen();
  const [runde, setRunde] = useState(0);
  const heute = tagVon(new Date().toISOString());
  // Stand zu Beginn der Runde einfrieren, damit neue Antworten oder ein Abgleich die laufende Runde nicht neu mischen
  const [start, setStart] = useState<Start | null>(null);
  if (ereignisse && lektionen && start?.runde !== runde) {
    // Eingetragene Tests mit Lektion: deren Wörter sind dabei und haben Vorrang
    const fuerTests = testVorrang(ereignisse, heute);
    const quellen = vokabelQuellen(lektionen, heute, berechneStaende(ereignisse), fuerTests);
    const vorrang = new Set([...quellen.vorrang, ...fuerTests]);
    const termine = sichtbareTests(alleTests(ereignisse)).flatMap((t) =>
      t.lektionId ? [{ lektionId: t.lektionId, datum: t.datum }] : [],
    );
    setStart({
      runde,
      ereignisse,
      listen: quellen.listen,
      vorrang,
      endspurt: endspurt(lektionen, termine, heute),
    });
  }

  return (
    <Seite titel="Vokabeln" vorlesetext="Vokabeln üben">
      {!start ? (
        <p>Einen Moment …</p>
      ) : (
        <Runde
          key={runde}
          listen={start.listen}
          ereignisse={start.ereignisse}
          heute={heute}
          vorrang={start.vorrang}
          endspurt={start.endspurt}
          zufall={zufall}
          onNochEinmal={() => setRunde((r) => r + 1)}
        />
      )}
    </Seite>
  );
}
