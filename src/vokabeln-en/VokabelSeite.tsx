import { useState, type ReactNode } from 'react';
import { Seite } from '../basis/Seite.tsx';
import { VorleseKnopf } from '../basis/VorleseKnopf.tsx';
import { tagVon } from '../belohnung/logik.ts';
import { useEreignisse } from '../daten/ProtokollKontext.tsx';
import type { LernEreignis } from '../daten/ereignisse.ts';
import { FortschrittBalken } from '../eltern/Fortschrittsanzeigen.tsx';
import { fortschritt } from '../eltern/statistik.ts';
import { statusVon, type Lektion } from '../lektionen/lektion.ts';
import { useLektionen } from '../lektionen/LektionenKontext.tsx';
import { alleTests, sichtbareTests, testVorrang } from '../klassenarbeiten/logik.ts';
import { berechneStaende, rundeAuswaehlen, type RundenWort, type WortStand } from './leitner.ts';
import { schwierigeRunde, woerterFuer, type Modus } from './modus.ts';
import { endspurt, vokabelQuellen, type Endspurt } from './quellen.ts';
import { Runde } from './Runde.tsx';
import type { Zufall } from './runde.ts';
import type { Vokabelliste } from './typen.ts';
import './Vokabeln.css';

type Grundlage = {
  ereignisse: LernEreignis[];
  staende: Map<string, WortStand>;
  listen: Vokabelliste[];
  vorrang: Set<string>;
  endspurt: Endspurt[];
};

type Start = Grundlage & { runde: number; woerter?: RundenWort[] };

function grundlage(
  ereignisse: LernEreignis[],
  lektionen: readonly Lektion[],
  heute: string,
): Grundlage {
  // Eingetragene Tests mit Lektion: deren Wörter sind dabei und haben Vorrang
  const fuerTests = testVorrang(ereignisse, heute);
  const staende = berechneStaende(ereignisse);
  const quellen = vokabelQuellen(lektionen, heute, staende, fuerTests);
  const termine = sichtbareTests(alleTests(ereignisse)).flatMap((t) =>
    t.lektionId ? [{ lektionId: t.lektionId, datum: t.datum }] : [],
  );
  return {
    ereignisse,
    staende,
    listen: quellen.listen,
    vorrang: new Set([...quellen.vorrang, ...fuerTests]),
    endspurt: endspurt(lektionen, termine, heute),
  };
}

function hinweisFuer(modus: Modus, listen: readonly Vokabelliste[]): string | undefined {
  if (modus.art === 'schwierig') return '💪 Diese Wörter waren zuletzt knifflig. Du schaffst das!';
  if (modus.art === 'lektion') {
    const name = listen.find((l) => l.id === modus.listeId)?.name;
    return name ? `📖 Du übst jetzt: ${name}` : undefined;
  }
  return undefined;
}

export function VokabelSeite({ zufall }: { zufall?: Zufall }) {
  const ereignisse = useEreignisse();
  const lektionen = useLektionen();
  const [modus, setModus] = useState<Modus | null>(null);
  const [runde, setRunde] = useState(0);
  const heute = tagVon(new Date().toISOString());
  // Stand zu Beginn der Runde einfrieren, damit neue Antworten oder ein Abgleich die laufende Runde nicht neu mischen
  const [start, setStart] = useState<Start | null>(null);
  if (modus && ereignisse && lektionen && start?.runde !== runde) {
    const g = grundlage(ereignisse, lektionen, heute);
    setStart({
      ...g,
      runde,
      woerter: woerterFuer(modus, g.listen, ereignisse, g.staende, heute, zufall),
    });
  }

  function waehle(neu: Modus) {
    setModus(neu);
    setStart(null);
    setRunde((r) => r + 1);
  }

  if (!modus) {
    return (
      <Seite titel="Vokabeln" vorlesetext="Vokabeln üben. Was möchtest du üben?">
        {!ereignisse || !lektionen ? (
          <p>Einen Moment …</p>
        ) : (
          <Auswahl
            g={grundlage(ereignisse, lektionen, heute)}
            lektionen={lektionen}
            heute={heute}
            onWaehle={waehle}
          />
        )}
      </Seite>
    );
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
          endspurt={modus.art === 'mix' ? start.endspurt : []}
          woerter={start.woerter}
          hinweis={hinweisFuer(modus, start.listen)}
          zufall={zufall}
          onNochEinmal={() => setRunde((r) => r + 1)}
          onAndereAuswahl={() => setModus(null)}
        />
      )}
    </Seite>
  );
}

// Ermutigend formuliert: eine Null bei „sicher“ steht nie allein da
function lernstandText(f: { sicher: number; lernt: number; neu: number; gesamt: number }): string {
  if (f.sicher > 0) return `${f.sicher} von ${f.gesamt} Wörtern sicher`;
  if (f.lernt > 0) return `${f.gesamt} Wörter, ${f.lernt} schon angefangen`;
  return `${f.gesamt} neue Wörter`;
}

function testText(tage: number): string {
  if (tage === 0) return '📝 Test heute';
  if (tage === 1) return '📝 Test morgen';
  return `📝 Test in ${tage} Tagen`;
}

// Was möchtest du üben? Der Mix ist die Empfehlung und steht groß oben.
function Auswahl({
  g,
  lektionen,
  heute,
  onWaehle,
}: {
  g: Grundlage;
  lektionen: readonly Lektion[];
  heute: string;
  onWaehle: (modus: Modus) => void;
}) {
  const heuteDran = rundeAuswaehlen(g.listen, g.staende, heute, g.vorrang).length;
  const mixUnter =
    heuteDran > 0
      ? `Die App sucht aus, was heute dran ist: ${heuteDran} Wörter.`
      : 'Für heute ist alles geschafft. Wiederhole, was du schon kannst.';
  const schwierig = schwierigeRunde(g.listen, g.ereignisse, g.staende, heute).length;
  const schwierigUnter =
    schwierig > 0
      ? `${schwierig} ${schwierig === 1 ? 'Wort' : 'Wörter'}, die zuletzt knifflig waren.`
      : 'Gerade gibt es keine kniffligen Wörter. Super!';

  const status = new Map(lektionen.map((l) => [l.id, statusVon(l)]));
  // Lektionen mit anstehendem Test zuerst (der nächste Termin oben), sonst Reihenfolge der Eltern
  const testIn = (id: string) => g.endspurt.find((e) => e.lektionId === id)?.tage ?? Infinity;
  const aktuell = g.listen
    .filter((l) => status.get(l.id) !== 'archiviert')
    .map((l, i) => ({ l, i }))
    .sort((a, b) => testIn(a.l.id) - testIn(b.l.id) || a.i - b.i)
    .map(({ l }) => l);
  const aelter = g.listen.filter((l) => status.get(l.id) === 'archiviert');

  return (
    <div className="auswahl">
      <ul className="auswahl-liste">
        <Karte
          haupt
          titel="🎲 Mix für heute"
          unter={mixUnter}
          onClick={() => onWaehle({ art: 'mix' })}
        />
      </ul>

      <h2>📖 Eine Lektion üben</h2>
      <LektionsListe listen={aktuell} g={g} onWaehle={onWaehle} />
      {aelter.length > 0 && (
        <details>
          <summary>Ältere Lektionen ({aelter.length})</summary>
          <LektionsListe listen={aelter} g={g} onWaehle={onWaehle} />
        </details>
      )}

      <h2>💪 Zum Dranbleiben</h2>
      <ul className="auswahl-liste">
        <Karte
          titel="Knifflige Wörter üben"
          unter={schwierigUnter}
          disabled={schwierig === 0}
          onClick={() => onWaehle({ art: 'schwierig' })}
        />
      </ul>
    </div>
  );
}

function LektionsListe({
  listen,
  g,
  onWaehle,
}: {
  listen: Vokabelliste[];
  g: Grundlage;
  onWaehle: (modus: Modus) => void;
}) {
  return (
    <ul className="auswahl-liste">
      {listen.map((liste) => {
        const f = fortschritt(liste, g.staende);
        const test = g.endspurt.find((e) => e.lektionId === liste.id);
        return (
          <Karte
            key={liste.id}
            titel={liste.name}
            unter={lernstandText(f)}
            zusatz={test && testText(test.tage)}
            onClick={() => onWaehle({ art: 'lektion', listeId: liste.id })}
          >
            <FortschrittBalken f={f} />
          </Karte>
        );
      })}
    </ul>
  );
}

function Karte({
  titel,
  unter,
  zusatz,
  haupt = false,
  disabled = false,
  onClick,
  children,
}: {
  titel: string;
  unter: string;
  zusatz?: string;
  haupt?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children?: ReactNode;
}) {
  const vorlesen = [titel.replace(/^\P{L}+/u, ''), zusatz?.replace(/^\P{L}+/u, ''), unter]
    .filter(Boolean)
    .join('. ');
  return (
    <li className={haupt ? 'auswahl-karte haupt' : 'auswahl-karte'}>
      <button type="button" disabled={disabled} onClick={onClick}>
        <span className="auswahl-titel">{titel}</span>
        {zusatz && <span className="auswahl-test">{zusatz}</span>}
        {children}
        <span className="auswahl-unter">{unter}</span>
      </button>
      <VorleseKnopf text={vorlesen} />
    </li>
  );
}
