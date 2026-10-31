import { useState } from 'react';
import { punkteFuerRunde, tagesziel } from '../belohnung/logik.ts';
import { PUNKTE } from '../belohnung/werte.ts';
import { useProtokoll } from '../daten/ProtokollKontext.tsx';
import type { LernEreignis, Uebung } from '../daten/ereignisse.ts';
import { VorleseKnopf } from '../basis/VorleseKnopf.tsx';
import {
  berechneStaende,
  naechsterStand,
  rundeAuswaehlen,
  schluessel,
  uebungFuer,
  wortStand,
  type RundenWort,
  type WortStand,
} from './leitner.ts';
import { antwortOptionen, sprechtext, type Zufall } from './runde.ts';
import type { Vokabel, Vokabelliste } from './typen.ts';
import { UebungWaehlen } from './UebungWaehlen.tsx';
import { Zusammenfassung, type Ergebnis } from './Zusammenfassung.tsx';

type Schritt = { eintrag: RundenWort; wiederholung: boolean };

// Übung und Antwortmöglichkeiten werden beim Erscheinen eines Wortes festgelegt
type Aktuell = { nr: number; uebung: Uebung; optionen: Vokabel[] };

function vorbereiten(
  nr: number,
  schritt: Schritt,
  staende: Map<string, WortStand>,
  alleWoerter: Vokabel[],
  zufall: Zufall,
): Aktuell {
  const { liste, wort } = schritt.eintrag;
  // Schreiben folgt in Aufgabe 10; bis dahin wird Deutsch → Englisch gewählt
  const uebung: Uebung =
    uebungFuer(wortStand(staende, liste.id, wort.id)) === 'erkennen' ? 'erkennen' : 'waehlen-de-en';
  const feld = uebung === 'erkennen' ? 'de' : 'en';
  return { nr, uebung, optionen: antwortOptionen(wort, alleWoerter, feld, zufall) };
}

export function Runde({
  listen,
  ereignisse,
  heute,
  zufall = Math.random,
  onNochEinmal,
}: {
  listen: Vokabelliste[];
  ereignisse: LernEreignis[];
  heute: string;
  zufall?: Zufall;
  onNochEinmal: () => void;
}) {
  const protokoll = useProtokoll();
  const alleWoerter = listen.flatMap((l) => l.woerter);
  const [staende, setStaende] = useState(() => berechneStaende(ereignisse));
  const [schritte, setSchritte] = useState<Schritt[]>(() =>
    rundeAuswaehlen(listen, staende, heute).map((eintrag) => ({ eintrag, wiederholung: false })),
  );
  const [aktuell, setAktuell] = useState<Aktuell | null>(() =>
    schritte[0] ? vorbereiten(0, schritte[0], staende, alleWoerter, zufall) : null,
  );
  const [antwortRichtig, setAntwortRichtig] = useState<boolean | null>(null);
  const [zaehler, setZaehler] = useState({ richtig: 0, verbessert: 0, gelernt: [] as Vokabel[] });
  const [ergebnis, setErgebnis] = useState<Ergebnis | null>(null);

  if (ergebnis) return <Zusammenfassung ergebnis={ergebnis} onNochEinmal={onNochEinmal} />;

  if (!aktuell) {
    const text = 'Super! Für heute hast du alle Wörter geübt. Morgen geht es weiter.';
    return (
      <p className="runde-leer">
        <VorleseKnopf text={text} />
        <span>{text} 🎉</span>
      </p>
    );
  }

  const schritt = schritte[aktuell.nr]!;
  const { liste, wort } = schritt.eintrag;

  function beantworten(richtig: boolean) {
    const stand = wortStand(staende, liste.id, wort.id);
    const { stand: neu, verbessert } = naechsterStand(
      stand,
      { richtig, uebung: aktuell!.uebung },
      heute,
    );
    setStaende((alt) => new Map(alt).set(schluessel(liste.id, wort.id), neu));
    setZaehler((z) => ({
      richtig: z.richtig + (richtig ? 1 : 0),
      verbessert: z.verbessert + (verbessert ? 1 : 0),
      gelernt: richtig && !z.gelernt.includes(wort) ? [...z.gelernt, wort] : z.gelernt,
    }));
    // Falsche Wörter kommen in dieser Runde noch einmal dran (einmal)
    if (!richtig && !schritt.wiederholung) {
      setSchritte((s) => [...s, { eintrag: schritt.eintrag, wiederholung: true }]);
    }
    setAntwortRichtig(richtig);
    protokoll.hinzufuegen({
      typ: 'antwort',
      listeId: liste.id,
      wortId: wort.id,
      uebung: aktuell!.uebung,
      richtig,
    });
  }

  async function weiter() {
    setAntwortRichtig(null);
    const naechster = schritte[aktuell!.nr + 1];
    if (naechster) {
      setAktuell(vorbereiten(aktuell!.nr + 1, naechster, staende, alleWoerter, zufall));
      return;
    }
    const runde = { richtig: zaehler.richtig, mitHilfe: 0, verbessert: zaehler.verbessert };
    await protokoll.hinzufuegen({ typ: 'runde-beendet', ...runde });
    const vorher = tagesziel(ereignisse, heute);
    const zielGeradeErreicht = vorher.runden + 1 === vorher.ziel;
    setErgebnis({
      punkte: punkteFuerRunde(runde) + (zielGeradeErreicht ? PUNKTE.tagesziel : 0),
      tageszielGeradeErreicht: zielGeradeErreicht,
      rundenHeute: vorher.runden + 1,
      gelernt: zaehler.gelernt,
    });
  }

  return (
    <div className="runde">
      <Fortschritt aktuell={aktuell.nr + 1} gesamt={schritte.length} />
      <UebungWaehlen
        key={aktuell.nr}
        wort={wort}
        optionen={aktuell.optionen}
        richtung={aktuell.uebung === 'erkennen' ? 'en-de' : 'de-en'}
        onAntwort={beantworten}
      />
      {antwortRichtig !== null && (
        <Rueckmeldung
          richtig={antwortRichtig}
          wort={wort}
          kommtNochmal={!schritt.wiederholung}
          onWeiter={weiter}
        />
      )}
    </div>
  );
}

function Fortschritt({ aktuell, gesamt }: { aktuell: number; gesamt: number }) {
  return (
    <div className="runde-fortschritt">
      <span>
        Wort {aktuell} von {gesamt}
      </span>
      <progress max={gesamt} value={aktuell - 1} aria-label="Fortschritt in der Runde" />
    </div>
  );
}

function Rueckmeldung({
  richtig,
  wort,
  kommtNochmal,
  onWeiter,
}: {
  richtig: boolean;
  wort: Vokabel;
  kommtNochmal: boolean;
  onWeiter: () => void;
}) {
  const lob = 'Richtig! Super gemacht!';
  return (
    <div className="runde-rueckmeldung" role="status" data-richtig={richtig}>
      {richtig ? (
        <p>
          <VorleseKnopf text={lob} />
          <span>{lob} 🎉</span>
        </p>
      ) : (
        <>
          <p>So ist es richtig:</p>
          <p className="runde-loesung">
            <span lang="en">
              <VorleseKnopf text={sprechtext(wort.en)} sprache="en" /> {wort.en}
            </span>
            <span aria-hidden="true">=</span>
            <span>
              <VorleseKnopf text={wort.de} /> {wort.de}
            </span>
          </p>
          {kommtNochmal && <p>Das Wort kommt gleich noch einmal.</p>}
        </>
      )}
      <button type="button" className="runde-weiter" onClick={onWeiter}>
        Weiter →
      </button>
    </div>
  );
}
