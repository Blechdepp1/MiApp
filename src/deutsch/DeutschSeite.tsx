import { useState } from 'react';
import { Seite } from '../basis/Seite.tsx';
import { VorleseKnopf } from '../basis/VorleseKnopf.tsx';
import { tagVon } from '../belohnung/logik.ts';
import type { LernEreignis } from '../daten/ereignisse.ts';
import { useEreignisse } from '../daten/ProtokollKontext.tsx';
import { FortschrittBalken } from '../eltern/Fortschrittsanzeigen.tsx';
import {
  berechneStaende,
  rundeAuswaehlen,
  type RundenWort,
  type WortStand,
} from '../vokabeln-en/leitner.ts';
import type { Zufall } from '../vokabeln-en/runde.ts';
import { deutschAuswahl, fortschrittThema, type Wahl } from './auswahl.ts';
import { DeutschRunde } from './DeutschRunde.tsx';
import { THEMEN } from './themen.ts';
import type { Thema } from './typen.ts';
import '../vokabeln-en/Vokabeln.css';
import './Deutsch.css';

type Start = { runde: number; ereignisse: LernEreignis[]; woerter: RundenWort<Thema>[] };

export function DeutschSeite({
  themen = THEMEN,
  zufall,
}: {
  themen?: readonly Thema[];
  zufall?: Zufall;
}) {
  const ereignisse = useEreignisse();
  const [wahl, setWahl] = useState<Wahl | null>(null);
  const [runde, setRunde] = useState(0);
  const [start, setStart] = useState<Start | null>(null);
  const heute = tagVon(new Date().toISOString());

  // Stand zu Beginn der Runde einfrieren (wie bei den Vokabeln)
  if (wahl && ereignisse && start?.runde !== runde) {
    setStart({
      runde,
      ereignisse,
      woerter: deutschAuswahl(wahl, themen, berechneStaende(ereignisse), heute, zufall),
    });
  }

  function waehle(neu: Wahl) {
    setWahl(neu);
    setStart(null);
    setRunde((r) => r + 1);
  }

  if (!wahl || !start) {
    return (
      <Seite titel="Deutsch" vorlesetext="Deutsch üben. Was möchtest du üben?">
        {!ereignisse ? (
          <p>Einen Moment …</p>
        ) : (
          <Auswahl
            themen={themen}
            staende={berechneStaende(ereignisse)}
            heute={heute}
            onWaehle={waehle}
          />
        )}
      </Seite>
    );
  }

  const thema = wahl.art === 'thema' ? themen.find((t) => t.id === wahl.id) : undefined;
  return (
    <Seite titel="Deutsch" vorlesetext="Deutsch üben">
      <DeutschRunde
        key={runde}
        woerter={start.woerter}
        ereignisse={start.ereignisse}
        heute={heute}
        hinweis={thema ? `Du übst jetzt: ${thema.titel}` : undefined}
        onNochEinmal={() => setRunde((r) => r + 1)}
        onAndereAuswahl={() => setWahl(null)}
      />
    </Seite>
  );
}

function Auswahl({
  themen,
  staende,
  heute,
  onWaehle,
}: {
  themen: readonly Thema[];
  staende: Map<string, WortStand>;
  heute: string;
  onWaehle: (w: Wahl) => void;
}) {
  const heuteDran = rundeAuswaehlen(themen, staende, heute).length;
  const mixUnter =
    heuteDran > 0
      ? `Die App sucht aus, was heute dran ist: ${heuteDran} Aufgaben.`
      : 'Für heute ist alles geschafft. Wiederhole, was du schon kannst.';
  return (
    <div className="auswahl">
      <ul className="auswahl-liste">
        <li className="auswahl-karte haupt">
          <button type="button" onClick={() => onWaehle({ art: 'mix' })}>
            <span className="auswahl-titel">🎲 Mix für heute</span>
            <span className="auswahl-unter">{mixUnter}</span>
          </button>
          <VorleseKnopf text={`Mix für heute. ${mixUnter}`} />
        </li>
      </ul>

      <h2>📒 Ein Thema üben</h2>
      <ul className="auswahl-liste">
        {themen.map((t) => {
          const f = fortschrittThema(t, staende);
          const unter =
            f.sicher > 0
              ? `${f.sicher} von ${f.gesamt} Aufgaben sicher`
              : f.lernt > 0
                ? `${f.gesamt} Aufgaben, ${f.lernt} schon angefangen`
                : `${f.gesamt} neue Aufgaben`;
          return (
            <li key={t.id} className="auswahl-karte">
              <button type="button" onClick={() => onWaehle({ art: 'thema', id: t.id })}>
                <span className="auswahl-titel">
                  {t.symbol} {t.titel}
                </span>
                <FortschrittBalken f={f} />
                <span className="auswahl-unter">
                  {unter} · Deutsch Fit {t.seiten}
                </span>
              </button>
              <VorleseKnopf text={`${t.titel}. ${unter}.`} />
              <details className="deutsch-merkwissen">
                <summary>💡 Merkwissen</summary>
                <ul>
                  {t.merkwissen.map((m) => (
                    <li key={m}>
                      <VorleseKnopf text={m} />
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
              </details>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
