import { useState } from 'react';
import { useVerlassenBestaetigen } from '../basis/verlassen.ts';
import { VorleseKnopf } from '../basis/VorleseKnopf.tsx';
import { punkteFuerRunde, tagesziel } from '../belohnung/logik.ts';
import { PUNKTE } from '../belohnung/werte.ts';
import type { LernEreignis } from '../daten/ereignisse.ts';
import { useProtokoll } from '../daten/ProtokollKontext.tsx';
import { Tipp } from '../deutsch/Aufgaben.tsx';
import { AufhoerenFrage } from '../vokabeln-en/AufhoerenFrage.tsx';
import {
  berechneStaende,
  naechsterStand,
  schluessel,
  wortStand,
  type RundenWort,
  type WortStand,
} from '../vokabeln-en/leitner.ts';
import { lobText } from '../vokabeln-en/rueckmeldung.ts';
import type { Zufall } from '../vokabeln-en/runde.ts';
import { Zusammenfassung, type Ergebnis } from '../vokabeln-en/Zusammenfassung.tsx';
import { antwortOptionen, aufgabeText, sprechText } from './einmaleins.ts';
import type { MatheThema, RechenAufgabe } from './typen.ts';
import { Ziffernblock } from './Ziffernblock.tsx';
import '../vokabeln-en/Vokabeln.css';
import '../deutsch/Deutsch.css';
import './Mathe.css';

type Schritt = { eintrag: RundenWort<MatheThema>; wiederholung: boolean };
type Antwort = { richtig: boolean; mitHilfe: boolean; eingabe: number; lob?: string };
type Uebung = 'ma-waehlen' | 'ma-tippen';

// Neue Aufgaben erst auswählen, danach aus dem Kopf eintippen (Abrufen)
function uebungFuer(stand: WortStand): Uebung {
  return stand.erkannt >= 1 ? 'ma-tippen' : 'ma-waehlen';
}

// Eine Mathe-Runde: bis zu 10 Aufgaben, falsche kommen einmal wieder. Ohne Uhr und ohne Zeitdruck;
// Punkte, Tagesziel und Wiederholungsplan wie bei den Vokabeln, nie Punkte abziehen.
export function MatheRunde({
  woerter,
  ereignisse,
  heute,
  hinweis,
  zufall = Math.random,
  onNochEinmal,
  onAndereAuswahl,
}: {
  woerter: RundenWort<MatheThema>[];
  ereignisse: LernEreignis[];
  heute: string;
  hinweis?: string;
  zufall?: Zufall;
  onNochEinmal: () => void;
  onAndereAuswahl: () => void;
}) {
  const protokoll = useProtokoll();
  const [staende, setStaende] = useState(() => berechneStaende(ereignisse));
  const [schritte, setSchritte] = useState<Schritt[]>(() =>
    woerter.map((eintrag) => ({ eintrag, wiederholung: false })),
  );
  const [nr, setNr] = useState(0);
  const [antwort, setAntwort] = useState<Antwort | null>(null);
  const [zaehler, setZaehler] = useState({ richtig: 0, mitHilfe: 0, verbessert: 0 });
  const [ergebnis, setErgebnis] = useState<Ergebnis | null>(null);
  // Die Übungsart wird beim Erscheinen der Aufgabe festgelegt, nicht nach der Antwort neu
  const [fest, setFest] = useState<{ nr: number; uebung: Uebung } | null>(null);
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
  const vorher = wortStand(staende, liste.id, aufgabe.id);
  const uebung = fest?.nr === nr ? fest.uebung : uebungFuer(vorher);
  if (fest?.nr !== nr) setFest({ nr, uebung });

  function beantworten(eingabe: number, mitHilfe: boolean) {
    const richtig = eingabe === aufgabe.ergebnis;
    const { stand, verbessert } = naechsterStand(vorher, { richtig, uebung, mitHilfe }, heute);
    setStaende((alt) => new Map(alt).set(schluessel(liste.id, aufgabe.id), stand));
    setZaehler((z) => ({
      richtig: z.richtig + (richtig && !mitHilfe ? 1 : 0),
      mitHilfe: z.mitHilfe + (richtig && mitHilfe ? 1 : 0),
      verbessert: z.verbessert + (verbessert ? 1 : 0),
    }));
    if (!richtig && !schritt!.wiederholung) {
      setSchritte((s) => [...s, { eintrag: schritt!.eintrag, wiederholung: true }]);
    }
    setAntwort({
      richtig,
      mitHilfe,
      eingabe,
      ...(richtig && {
        lob: mitHilfe
          ? 'Richtig! Der Tipp hat geholfen. Morgen probierst du es ohne Tipp.'
          : lobText(vorher, stand, { verbessert, nr, heute }),
      }),
    });
    protokoll.hinzufuegen({
      typ: 'antwort',
      listeId: liste.id,
      wortId: aufgabe.id,
      uebung,
      richtig,
      ...(mitHilfe && { mitHilfe: true }),
    });
  }

  async function weiter() {
    // Bei der letzten Aufgabe bleibt die Rückmeldung bis zur Zusammenfassung stehen
    if (schritte[nr + 1]) {
      setAntwort(null);
      setNr(nr + 1);
      return;
    }
    await protokoll.hinzufuegen({ typ: 'runde-beendet', ...zaehler, fach: 'mathe' });
    const vorherZiel = tagesziel(ereignisse, heute);
    const zielGeradeErreicht = vorherZiel.runden + 1 === vorherZiel.ziel;
    setErgebnis({
      punkte: punkteFuerRunde(zaehler) + (zielGeradeErreicht ? PUNKTE.tagesziel : 0),
      tageszielGeradeErreicht: zielGeradeErreicht,
      rundenHeute: vorherZiel.runden + 1,
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
      <MatheAufgabe
        key={nr}
        aufgabe={aufgabe}
        uebung={uebung}
        zufall={zufall}
        beantwortet={antwort}
        onAntwort={beantworten}
      />
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

function MatheAufgabe({
  aufgabe,
  uebung,
  zufall,
  beantwortet,
  onAntwort,
}: {
  aufgabe: RechenAufgabe;
  uebung: Uebung;
  zufall: Zufall;
  beantwortet: Antwort | null;
  onAntwort: (eingabe: number, mitHilfe: boolean) => void;
}) {
  const [optionen] = useState(() => antwortOptionen(aufgabe, zufall));
  const [eingabe, setEingabe] = useState('');
  const [tipp, setTipp] = useState(false);
  const frage = uebung === 'ma-waehlen' ? 'Was kommt heraus? Wähle aus.' : 'Rechne im Kopf.';
  return (
    <div className="uebung">
      <p className="uebung-anweisung">
        <VorleseKnopf text={frage} />
        <span>{frage}</span>
      </p>
      <div className="uebung-frage">
        <VorleseKnopf text={sprechText(aufgabe)} />
        <span className="mathe-aufgabe">
          {aufgabeText(aufgabe)} ={' '}
          {uebung === 'ma-tippen' ? (
            <span
              className="mathe-eingabe"
              role="textbox"
              aria-readonly="true"
              aria-label="Deine Antwort"
            >
              {eingabe || '?'}
            </span>
          ) : (
            '?'
          )}
        </span>
      </div>
      {/* Tipp über dem Ziffernblock, damit er nicht unter der Leiste verschwindet */}
      {!beantwortet && <Tipp hilfe={aufgabe.hilfe} onGezeigt={() => setTipp(true)} />}
      {uebung === 'ma-waehlen' ? (
        <ul className="uebung-optionen deutsch-optionen">
          {optionen.map((o) => {
            const zustand = !beantwortet
              ? undefined
              : o === aufgabe.ergebnis
                ? 'richtig'
                : o === beantwortet.eingabe
                  ? 'daneben'
                  : 'aus';
            return (
              <li key={o}>
                <button
                  type="button"
                  className="uebung-option"
                  data-zustand={zustand}
                  disabled={beantwortet !== null}
                  onClick={() => onAntwort(o, tipp)}
                >
                  {zustand === 'richtig' && <span aria-hidden="true">✓ </span>}
                  {o}
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        !beantwortet && (
          <Ziffernblock
            wert={eingabe}
            onAendern={setEingabe}
            onFertig={() => onAntwort(Number(eingabe), tipp)}
          />
        )
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
  antwort: Antwort;
  aufgabe: RechenAufgabe;
  kommtNochmal: boolean;
  onWeiter: () => void;
}) {
  const lob = antwort.lob ?? 'Richtig! Super gemacht!';
  const loesung = `${aufgabeText(aufgabe)} = ${aufgabe.ergebnis}`;
  const gesprochen = `${sprechText(aufgabe)} ist ${aufgabe.ergebnis}`;
  const nochmal = kommtNochmal ? ' Die Aufgabe kommt gleich noch einmal.' : '';
  return (
    <div className="runde-rueckmeldung" data-richtig={antwort.richtig}>
      <div role="status">
        {antwort.richtig ? (
          <p>
            <VorleseKnopf text={`${lob} ${gesprochen}.`} />
            <span>
              {lob} 🎉 <strong>{loesung}</strong>
            </span>
          </p>
        ) : (
          <>
            <p>
              <VorleseKnopf text={`Nicht schlimm! Richtig ist: ${gesprochen}.${nochmal}`} />
              <span>Nicht schlimm! Richtig ist:</span>
            </p>
            <p className="runde-loesung">
              <span className="mathe-aufgabe">{loesung}</span>
            </p>
            <p className="deutsch-tipp">
              <VorleseKnopf text={aufgabe.hilfe} />
              <span>💡 {aufgabe.hilfe}</span>
            </p>
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
