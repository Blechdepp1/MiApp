import { useState } from 'react';
import { useVerlassenBestaetigen } from '../basis/verlassen.ts';
import { VorleseKnopf } from '../basis/VorleseKnopf.tsx';
import { punkteFuerRunde, tagesziel } from '../belohnung/logik.ts';
import { PUNKTE } from '../belohnung/werte.ts';
import type { LernEreignis, Uebung } from '../daten/ereignisse.ts';
import { useProtokoll } from '../daten/ProtokollKontext.tsx';
import { AufhoerenFrage } from '../vokabeln-en/AufhoerenFrage.tsx';
import {
  berechneStaende,
  naechsterStand,
  schluessel,
  wortStand,
  type RundenWort,
} from '../vokabeln-en/leitner.ts';
import { MarkierteLoesung } from '../vokabeln-en/Nachschreiben.tsx';
import { Zusammenfassung, type Ergebnis } from '../vokabeln-en/Zusammenfassung.tsx';
import {
  AufgabeAntippen,
  AufgabeSchreiben,
  AufgabeWaehlen,
  type DeutschAntwort,
} from './Aufgaben.tsx';
import { loesungVon } from './auswahl.ts';
import { lobText } from '../vokabeln-en/rueckmeldung.ts';
import { HINWEIS_TEXT } from './bewertung.ts';
import type { Aufgabe, Thema } from './typen.ts';
import '../vokabeln-en/Vokabeln.css';
import './Deutsch.css';

type Schritt = { eintrag: RundenWort<Thema>; wiederholung: boolean };

const UEBUNG: Record<Aufgabe['art'], Uebung> = {
  waehlen: 'de-waehlen',
  schreiben: 'de-schreiben',
  antippen: 'de-antippen',
};

// Eine Deutsch-Runde: bis zu 10 Aufgaben, falsche kommen einmal wieder. Punkte, Tagesziel und
// Wiederholungsplan wie bei den Vokabeln; nie Punkte abziehen.
export function DeutschRunde({
  woerter,
  ereignisse,
  heute,
  hinweis,
  onNochEinmal,
  onAndereAuswahl,
}: {
  woerter: RundenWort<Thema>[];
  ereignisse: LernEreignis[];
  heute: string;
  hinweis?: string;
  onNochEinmal: () => void;
  onAndereAuswahl: () => void;
}) {
  const protokoll = useProtokoll();
  const [staende, setStaende] = useState(() => berechneStaende(ereignisse));
  const [schritte, setSchritte] = useState<Schritt[]>(() =>
    woerter.map((eintrag) => ({ eintrag, wiederholung: false })),
  );
  const [nr, setNr] = useState(0);
  const [antwort, setAntwort] = useState<(DeutschAntwort & { lob?: string }) | null>(null);
  const [zaehler, setZaehler] = useState({ richtig: 0, mitHilfe: 0, verbessert: 0 });
  const [ergebnis, setErgebnis] = useState<Ergebnis | null>(null);
  const verlassen = useVerlassenBestaetigen((nr > 0 || antwort !== null) && !ergebnis);

  if (ergebnis)
    return (
      <Zusammenfassung
        ergebnis={ergebnis}
        onNochEinmal={onNochEinmal}
        onAndereAuswahl={onAndereAuswahl}
      />
    );

  const schritt = schritte[nr];
  if (!schritt) {
    const text = 'Hier gibt es gerade nichts zu üben.';
    return (
      <p className="runde-leer">
        <VorleseKnopf text={text} />
        <span>{text}</span>
      </p>
    );
  }
  const { liste, wort: aufgabe } = schritt.eintrag;

  function beantworten(a: DeutschAntwort) {
    const vorher = wortStand(staende, liste.id, aufgabe.id);
    const { stand, verbessert } = naechsterStand(
      vorher,
      { richtig: a.richtig, uebung: UEBUNG[aufgabe.art], mitHilfe: a.mitHilfe },
      heute,
    );
    setStaende((alt) => new Map(alt).set(schluessel(liste.id, aufgabe.id), stand));
    setZaehler((z) => ({
      richtig: z.richtig + (a.richtig && !a.mitHilfe ? 1 : 0),
      mitHilfe: z.mitHilfe + (a.richtig && a.mitHilfe ? 1 : 0),
      verbessert: z.verbessert + (verbessert ? 1 : 0),
    }));
    if (!a.richtig && !schritt!.wiederholung) {
      setSchritte((s) => [...s, { eintrag: schritt!.eintrag, wiederholung: true }]);
    }
    setAntwort({
      ...a,
      ...(a.richtig && {
        lob: a.mitHilfe
          ? 'Richtig! Der Tipp hat geholfen. Morgen probierst du es ohne Tipp.'
          : lobText(vorher, stand, { verbessert, nr, heute }),
      }),
    });
    protokoll.hinzufuegen({
      typ: 'antwort',
      listeId: liste.id,
      wortId: aufgabe.id,
      uebung: UEBUNG[aufgabe.art],
      richtig: a.richtig,
      ...(a.mitHilfe && { mitHilfe: true }),
    });
  }

  async function weiter() {
    // Bei der letzten Aufgabe bleibt die Rückmeldung bis zur Zusammenfassung stehen
    if (schritte[nr + 1]) {
      setAntwort(null);
      setNr(nr + 1);
      return;
    }
    await protokoll.hinzufuegen({ typ: 'runde-beendet', ...zaehler, fach: 'deutsch' });
    const vorher = tagesziel(ereignisse, heute);
    const zielGeradeErreicht = vorher.runden + 1 === vorher.ziel;
    setErgebnis({
      punkte: punkteFuerRunde(zaehler) + (zielGeradeErreicht ? PUNKTE.tagesziel : 0),
      tageszielGeradeErreicht: zielGeradeErreicht,
      rundenHeute: vorher.runden + 1,
      gelernt: [],
    });
  }

  return (
    <div className="runde">
      {verlassen.frage && (
        <AufhoerenFrage
          uebrig={schritte.length - nr - (antwort ? 1 : 0)}
          onBleiben={verlassen.bleiben}
          onAufhoeren={verlassen.verlassen}
        />
      )}
      {hinweis && nr === 0 && (
        <p className="runde-extra">
          <VorleseKnopf text={hinweis} />
          <span>{hinweis}</span>
        </p>
      )}
      <div className="runde-fortschritt">
        <span>
          Aufgabe {nr + 1} von {schritte.length}
        </span>
        <progress max={schritte.length} value={nr} aria-label="Fortschritt in der Runde" />
      </div>
      <p className="deutsch-thema">
        {liste.symbol} {liste.titel}
      </p>
      {aufgabe.art === 'waehlen' ? (
        <AufgabeWaehlen key={nr} aufgabe={aufgabe} onAntwort={beantworten} />
      ) : aufgabe.art === 'schreiben' ? (
        <AufgabeSchreiben key={nr} aufgabe={aufgabe} onAntwort={beantworten} />
      ) : (
        <AufgabeAntippen key={nr} aufgabe={aufgabe} onAntwort={beantworten} />
      )}
      {antwort && <div className="runde-platz-rueckmeldung" aria-hidden="true" />}
      {antwort && (
        <Rueckmeldung
          antwort={antwort}
          aufgabe={aufgabe}
          kommtNochmal={!schritt.wiederholung}
          onWeiter={weiter}
        />
      )}
    </div>
  );
}

function Rueckmeldung({
  antwort,
  aufgabe,
  kommtNochmal,
  onWeiter,
}: {
  antwort: DeutschAntwort & { lob?: string };
  aufgabe: Aufgabe;
  kommtNochmal: boolean;
  onWeiter: () => void;
}) {
  const loesung = loesungVon(aufgabe);
  const lob = antwort.lob ?? 'Richtig! Super gemacht!';
  const nochmal = kommtNochmal ? ' Die Aufgabe kommt gleich noch einmal.' : '';
  const erklaerung = antwort.hinweis ? HINWEIS_TEXT[antwort.hinweis] : 'Nicht schlimm!';
  return (
    <div className="runde-rueckmeldung" data-richtig={antwort.richtig}>
      <div role="status">
        {antwort.richtig ? (
          <p>
            <VorleseKnopf text={lob} />
            <span>{lob} 🎉</span>
          </p>
        ) : (
          <>
            <p>
              <VorleseKnopf text={`${erklaerung} Richtig ist: ${loesung}.${nochmal}`} />
              <span>{erklaerung} Richtig ist:</span>
            </p>
            <p className="runde-loesung">
              {aufgabe.art === 'schreiben' && antwort.eingabe ? (
                <MarkierteLoesung
                  eingabe={antwort.eingabe}
                  loesung={loesung}
                  lang="de"
                  grossKlein
                />
              ) : (
                <span>{loesung}</span>
              )}
            </p>
            {aufgabe.hilfe && (
              <p className="deutsch-tipp">
                <VorleseKnopf text={aufgabe.hilfe} />
                <span>💡 {aufgabe.hilfe}</span>
              </p>
            )}
            {kommtNochmal && <p>Die Aufgabe kommt gleich noch einmal.</p>}
          </>
        )}
      </div>
      <button type="button" className="runde-weiter" onClick={onWeiter}>
        Weiter →
      </button>
    </div>
  );
}
