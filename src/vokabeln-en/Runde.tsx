import { useEffect, useRef, useState } from 'react';
import { punkteFuerRunde, tagesziel } from '../belohnung/logik.ts';
import { PUNKTE } from '../belohnung/werte.ts';
import { useProtokoll } from '../daten/ProtokollKontext.tsx';
import type { LernEreignis, Uebung } from '../daten/ereignisse.ts';
import { useVerlassenBestaetigen } from '../basis/verlassen.ts';
import { VorleseKnopf } from '../basis/VorleseKnopf.tsx';
import { AufhoerenFrage } from './AufhoerenFrage.tsx';
import {
  berechneStaende,
  extraRundeAuswaehlen,
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
import { UebungSchreiben } from './UebungSchreiben.tsx';
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
  const uebung = uebungFuer(wortStand(staende, liste.id, wort.id));
  if (uebung === 'schreiben') return { nr, uebung, optionen: [] };
  const feld = uebung === 'erkennen' ? 'de' : 'en';
  return { nr, uebung, optionen: antwortOptionen(wort, alleWoerter, feld, zufall) };
}

type Antwort = { richtig: boolean; fast?: boolean; mitHilfe?: boolean };

export function Runde({
  listen,
  ereignisse,
  heute,
  vorrang,
  zufall = Math.random,
  onNochEinmal,
}: {
  listen: Vokabelliste[];
  ereignisse: LernEreignis[];
  heute: string;
  // Listen, deren Wörter zuerst kommen (Klassenarbeit steht an)
  vorrang?: ReadonlySet<string>;
  zufall?: Zufall;
  onNochEinmal: () => void;
}) {
  const protokoll = useProtokoll();
  const alleWoerter = listen.flatMap((l) => l.woerter);
  const [staende, setStaende] = useState(() => berechneStaende(ereignisse));
  // Ist heute nichts mehr fällig, darf sie freiwillig weiter wiederholen
  const [auswahl] = useState(() => {
    const normal = rundeAuswaehlen(listen, staende, heute, vorrang);
    return normal.length > 0
      ? { extra: false, woerter: normal }
      : { extra: true, woerter: extraRundeAuswaehlen(listen, staende, zufall, vorrang) };
  });
  const [schritte, setSchritte] = useState<Schritt[]>(() =>
    auswahl.woerter.map((eintrag) => ({ eintrag, wiederholung: false })),
  );
  const [aktuell, setAktuell] = useState<Aktuell | null>(() =>
    schritte[0] ? vorbereiten(0, schritte[0], staende, alleWoerter, zufall) : null,
  );
  const [antwort, setAntwort] = useState<Antwort | null>(null);
  const [zaehler, setZaehler] = useState({
    richtig: 0,
    mitHilfe: 0,
    verbessert: 0,
    gelernt: [] as Vokabel[],
  });
  const [ergebnis, setErgebnis] = useState<Ergebnis | null>(null);
  // Nachfragen, sobald die erste Antwort gegeben ist und solange die Runde läuft
  const angefangen = aktuell !== null && (aktuell.nr > 0 || antwort !== null);
  const verlassen = useVerlassenBestaetigen(angefangen && !ergebnis);

  if (ergebnis) return <Zusammenfassung ergebnis={ergebnis} onNochEinmal={onNochEinmal} />;

  if (!aktuell) {
    const text = 'Hier gibt es noch keine Wörter zum Üben.';
    return (
      <p className="runde-leer">
        <VorleseKnopf text={text} />
        <span>{text} 🎉</span>
      </p>
    );
  }

  const schritt = schritte[aktuell.nr]!;
  const { liste, wort } = schritt.eintrag;

  function beantworten({ richtig, fast = false, mitHilfe = false }: Antwort) {
    const stand = wortStand(staende, liste.id, wort.id);
    const { stand: neu, verbessert } = naechsterStand(
      stand,
      { richtig, uebung: aktuell!.uebung },
      heute,
    );
    setStaende((alt) => new Map(alt).set(schluessel(liste.id, wort.id), neu));
    // Richtig ohne Hilfe gibt volle Punkte, mit Hilfe etwas weniger; Hilfe kostet aber nie etwas
    setZaehler((z) => ({
      richtig: z.richtig + (richtig && !mitHilfe ? 1 : 0),
      mitHilfe: z.mitHilfe + (richtig && mitHilfe ? 1 : 0),
      verbessert: z.verbessert + (verbessert ? 1 : 0),
      gelernt: richtig && !z.gelernt.includes(wort) ? [...z.gelernt, wort] : z.gelernt,
    }));
    // Falsche Wörter kommen in dieser Runde noch einmal dran (einmal)
    if (!richtig && !schritt.wiederholung) {
      setSchritte((s) => [...s, { eintrag: schritt.eintrag, wiederholung: true }]);
    }
    setAntwort({ richtig, fast, mitHilfe });
    protokoll.hinzufuegen({
      typ: 'antwort',
      listeId: liste.id,
      wortId: wort.id,
      uebung: aktuell!.uebung,
      richtig,
      ...(fast && { fastRichtig: true }),
      ...(mitHilfe && { mitHilfe: true }),
    });
  }

  async function weiter() {
    setAntwort(null);
    const naechster = schritte[aktuell!.nr + 1];
    if (naechster) {
      setAktuell(vorbereiten(aktuell!.nr + 1, naechster, staende, alleWoerter, zufall));
      return;
    }
    const runde = {
      richtig: zaehler.richtig,
      mitHilfe: zaehler.mitHilfe,
      verbessert: zaehler.verbessert,
    };
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
      {verlassen.frage && (
        <AufhoerenFrage
          uebrig={schritte.length - aktuell.nr - (antwort ? 1 : 0)}
          onBleiben={verlassen.bleiben}
          onAufhoeren={verlassen.verlassen}
        />
      )}
      {auswahl.extra && aktuell.nr === 0 && <ExtraHinweis />}
      <Fortschritt aktuell={aktuell.nr + 1} gesamt={schritte.length} />
      {aktuell.uebung === 'schreiben' ? (
        <UebungSchreiben
          key={aktuell.nr}
          wort={wort}
          onAntwort={({ bewertung, mitHilfe }) =>
            beantworten({ richtig: bewertung !== 'falsch', fast: bewertung === 'fast', mitHilfe })
          }
        />
      ) : (
        <UebungWaehlen
          key={aktuell.nr}
          wort={wort}
          optionen={aktuell.optionen}
          richtung={aktuell.uebung === 'erkennen' ? 'en-de' : 'de-en'}
          onAntwort={(richtig) => beantworten({ richtig })}
        />
      )}
      {antwort && (
        <Rueckmeldung
          antwort={antwort}
          wort={wort}
          kommtNochmal={!schritt.wiederholung}
          onWeiter={weiter}
        />
      )}
    </div>
  );
}

function ExtraHinweis() {
  const text = 'Alle Wörter für heute sind geschafft! Das ist eine Extra-Runde zum Wiederholen.';
  return (
    <p className="runde-extra">
      <VorleseKnopf text={text} />
      <span>⭐ {text}</span>
    </p>
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
  antwort,
  wort,
  kommtNochmal,
  onWeiter,
}: {
  antwort: Antwort;
  wort: Vokabel;
  kommtNochmal: boolean;
  onWeiter: () => void;
}) {
  const kasten = useRef<HTMLDivElement>(null);
  useEffect(() => {
    kasten.current?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
  }, []);
  const lob = 'Richtig! Super gemacht!';
  const fast = 'Fast richtig! Das zählt. So schreibt man es:';
  return (
    <div ref={kasten} className="runde-rueckmeldung" data-richtig={antwort.richtig}>
      <div role="status">
        {antwort.fast ? (
          <>
            <p>
              <VorleseKnopf text={fast} />
              <span>{fast}</span>
            </p>
            <p className="runde-loesung" lang="en">
              <VorleseKnopf text={sprechtext(wort.en)} sprache="en" /> {wort.en}
            </p>
          </>
        ) : antwort.richtig ? (
          <p>
            <VorleseKnopf text={lob} />
            <span>{lob} 🎉</span>
          </p>
        ) : (
          <>
            <p>
              <VorleseKnopf
                text={`Nicht schlimm! So ist es richtig: ${wort.de}.${kommtNochmal ? ' Das Wort kommt gleich noch einmal.' : ''}`}
              />
              <span>Nicht schlimm! So ist es richtig:</span>
            </p>
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
      </div>
      <button type="button" className="runde-weiter" onClick={onWeiter}>
        Weiter →
      </button>
    </div>
  );
}
