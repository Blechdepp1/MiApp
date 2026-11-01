import { useState } from 'react';
import { Seite } from '../basis/Seite.tsx';
import { Verweis } from '../basis/Verweis.tsx';
import { VorleseKnopf } from '../basis/VorleseKnopf.tsx';
import { gesamtPunkte, tagVon } from '../belohnung/logik.ts';
import { useInhalt } from '../daten/InhalteKontext.tsx';
import { useEreignisse } from '../daten/ProtokollKontext.tsx';
import { SICHER_AB_FACH } from '../eltern/statistik.ts';
import { berechneStaende, plusTage } from '../vokabeln-en/leitner.ts';
import {
  gutschriften,
  kalender,
  tageMitErfolgen,
  woche,
  zusammengefasst,
  type Tag,
} from './verlauf.ts';
import './Erfolge.css';

const WOCHENTAGE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const WOCHENTAGE_LANG = [
  'Montag',
  'Dienstag',
  'Mittwoch',
  'Donnerstag',
  'Freitag',
  'Samstag',
  'Sonntag',
];
const MONATE = [
  'Januar',
  'Februar',
  'März',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Dezember',
];
const TAGE_PRO_SEITE = 7;

function datum(tag: string): Date {
  return new Date(`${tag}T12:00:00`);
}

function tagName(tag: string, heute: string): string {
  if (tag === heute) return 'Heute';
  if (tag === plusTage(heute, -1)) return 'Gestern';
  const d = datum(tag);
  return `${WOCHENTAGE_LANG[(d.getDay() + 6) % 7]}, ${d.getDate()}. ${MONATE[d.getMonth()]}`;
}

// Kindgerechte Übersicht: was Milena wann geschafft hat. Nur Erfolge, nie Fehler oder Vergleiche,
// die entmutigen (der Vergleich mit der Vorwoche erscheint nur, wenn diese Woche besser ist).
export function ErfolgeSeite({ heute = tagVon(new Date().toISOString()) }: { heute?: string }) {
  const ereignisse = useEreignisse();
  const [stufen] = useInhalt('level');
  if (!ereignisse) return <Seite titel="Meine Erfolge">{null}</Seite>;

  const liste = gutschriften(ereignisse, stufen);
  const tage = tageMitErfolgen(liste);
  if (liste.length === 0) {
    const leer = 'Hier siehst du bald alles, was du geschafft hast. Starte deine erste Runde!';
    return (
      <Seite titel="Meine Erfolge">
        <p className="erfolge-leer">
          <VorleseKnopf text={leer} />
          <span>{leer}</span>
        </p>
        <Verweis className="erfolge-los" ziel="vokabeln">
          📚 Vokabeln üben
        </Verweis>
      </Seite>
    );
  }

  const punkte = gesamtPunkte(ereignisse);
  const lerntage = tage.filter((t) => t.runden > 0).length;
  const runden = tage.reduce((s, t) => s + t.runden, 0);
  const sicher = [...berechneStaende(ereignisse).values()].filter(
    (s) => s.fach >= SICHER_AB_FACH,
  ).length;
  const zusammenfassung =
    `Du hast schon ${punkte} Punkte gesammelt. ` +
    `Du hast an ${lerntage} Tagen gelernt und ${runden} Runden geschafft.` +
    (sicher > 0 ? ` ${sicher} Wörter kannst du schon sicher.` : '');

  return (
    <Seite titel="Meine Erfolge" vorlesetext="Meine Erfolge. Schau, was du alles geschafft hast!">
      <section className="erfolge-karte" aria-label="Alles zusammen">
        <div className="erfolge-kopf">
          <h2>Das hast du geschafft</h2>
          <VorleseKnopf text={zusammenfassung} />
        </div>
        <dl className="erfolge-zahlen">
          <Zahl symbol="🪙" wert={punkte} text="Punkte" />
          <Zahl symbol="📅" wert={lerntage} text={lerntage === 1 ? 'Lerntag' : 'Lerntage'} />
          <Zahl symbol="📚" wert={runden} text={runden === 1 ? 'Runde' : 'Runden'} />
          {/* Eine Null wäre hier eher entmutigend: erst zeigen, wenn es etwas zu zeigen gibt */}
          {sicher > 0 && <Zahl symbol="✅" wert={sicher} text="Wörter sicher" />}
        </dl>
      </section>

      <Wochenbalken tage={tage} heute={heute} />
      <Kalender tage={tage} heute={heute} />
      <Verlauf tage={tage} heute={heute} />
    </Seite>
  );
}

function Zahl({ symbol, wert, text }: { symbol: string; wert: number; text: string }) {
  return (
    <div>
      <dt>
        <span aria-hidden="true">{symbol} </span>
        {text}
      </dt>
      <dd>{wert}</dd>
    </div>
  );
}

function Wochenbalken({ tage, heute }: { tage: Tag[]; heute: string }) {
  const w = woche(tage, heute);
  const hoechster = Math.max(1, ...w.tage.map((t) => t.punkte));
  const besser = w.punkte > w.letzteWoche && w.letzteWoche > 0;
  const satz =
    w.punkte === 0
      ? 'Diese Woche geht es gleich los. Jede Runde zählt!'
      : `Diese Woche hast du ${w.punkte} Punkte gesammelt.` +
        (besser ? ' Das ist schon mehr als letzte Woche!' : '');
  const vorlesen =
    satz +
    ' ' +
    w.tage
      .filter((t) => t.punkte > 0)
      .map((t) => `${WOCHENTAGE_LANG[w.tage.indexOf(t)]}: ${t.punkte} Punkte.`)
      .join(' ');

  return (
    <section className="erfolge-karte" aria-label="Diese Woche">
      <div className="erfolge-kopf">
        <h2>Diese Woche</h2>
        <VorleseKnopf text={vorlesen} />
      </div>
      <ol className="erfolge-balken">
        {w.tage.map((t, i) => (
          <li
            key={t.tag}
            data-heute={t.tag === heute || undefined}
            aria-label={`${WOCHENTAGE_LANG[i]}: ${t.punkte} Punkte${t.tagesziel ? ', Tagesziel geschafft' : ''}`}
          >
            <span className="erfolge-balken-zahl">{t.punkte > 0 ? t.punkte : ''}</span>
            <span className="erfolge-balken-saeule">
              <span style={{ height: `${(t.punkte / hoechster) * 100}%` }} />
            </span>
            <span className="erfolge-balken-tag">{WOCHENTAGE[i]}</span>
            <span className="erfolge-balken-ziel" aria-hidden="true">
              {t.tagesziel ? '⭐' : ''}
            </span>
          </li>
        ))}
      </ol>
      <p className="erfolge-satz">
        {satz} {besser && <span aria-hidden="true">🎉</span>}
      </p>
      <p className="erfolge-legende">⭐ = Tagesziel geschafft</p>
    </section>
  );
}

function Kalender({ tage, heute }: { tage: Tag[]; heute: string }) {
  const jetzt = datum(heute);
  const [monat, setMonat] = useState({ jahr: jetzt.getFullYear(), monat: jetzt.getMonth() });
  const felder = kalender(tage, monat.jahr, monat.monat);
  const geuebt = felder.filter((f) => f?.geuebt).length;
  const istAktuell = monat.jahr === jetzt.getFullYear() && monat.monat === jetzt.getMonth();
  const name = `${MONATE[monat.monat]}${monat.jahr === jetzt.getFullYear() ? '' : ` ${monat.jahr}`}`;
  const satz =
    geuebt === 0
      ? `Im ${name} hast du noch nicht geübt.`
      : `Im ${name} hast du an ${geuebt} ${geuebt === 1 ? 'Tag' : 'Tagen'} gelernt.`;

  function blaettern(schritt: number) {
    const d = new Date(monat.jahr, monat.monat + schritt, 1);
    setMonat({ jahr: d.getFullYear(), monat: d.getMonth() });
  }

  return (
    <section className="erfolge-karte" aria-label="Dein Kalender">
      <div className="erfolge-kopf">
        <h2>Dein Kalender</h2>
        <VorleseKnopf text={satz} />
      </div>
      <div className="erfolge-monat">
        <button type="button" aria-label="Monat davor" onClick={() => blaettern(-1)}>
          ‹
        </button>
        <strong>{name}</strong>
        <button
          type="button"
          aria-label="Monat danach"
          onClick={() => blaettern(1)}
          disabled={istAktuell}
        >
          ›
        </button>
      </div>
      <div className="erfolge-kalender" role="grid" aria-label={satz}>
        <div role="row" className="erfolge-kalender-zeile">
          {WOCHENTAGE.map((t) => (
            <span key={t} role="columnheader" className="erfolge-kalender-wochentag">
              {t}
            </span>
          ))}
        </div>
        {Array.from({ length: Math.ceil(felder.length / 7) }, (_, zeile) => (
          <div role="row" className="erfolge-kalender-zeile" key={zeile}>
            {felder.slice(zeile * 7, zeile * 7 + 7).map((f, i) =>
              f ? (
                <span
                  key={f.tag}
                  role="gridcell"
                  className="erfolge-kalender-tag"
                  data-geuebt={f.geuebt || undefined}
                  data-heute={f.tag === heute || undefined}
                  aria-label={`${datum(f.tag).getDate()}.${f.geuebt ? ' geübt' : ''}${f.tagesziel ? ', Tagesziel' : ''}`}
                >
                  {datum(f.tag).getDate()}
                  {f.tagesziel && (
                    <span className="erfolge-kalender-stern" aria-hidden="true">
                      ⭐
                    </span>
                  )}
                </span>
              ) : (
                <span key={`leer-${i}`} role="gridcell" />
              ),
            )}
          </div>
        ))}
      </div>
      <p className="erfolge-satz">{satz}</p>
      <p className="erfolge-legende">
        <span className="erfolge-legende-geuebt" aria-hidden="true" /> = geübt · ⭐ = Tagesziel
      </p>
    </section>
  );
}

function Verlauf({ tage, heute }: { tage: Tag[]; heute: string }) {
  const [anzahl, setAnzahl] = useState(TAGE_PRO_SEITE);
  const sichtbar = tage.slice(0, anzahl);
  return (
    <section className="erfolge-karte" aria-label="So hast du gesammelt">
      <h2>So hast du gesammelt</h2>
      <ol className="erfolge-verlauf">
        {sichtbar.map((t) => {
          const eintraege = zusammengefasst(t.eintraege);
          const name = tagName(t.tag, heute);
          const vorlesen =
            `${name}: ${t.punkte} Punkte. ` +
            eintraege
              .map((g) => (g.punkte > 0 ? `${g.text}, ${g.punkte} Punkte.` : `${g.text}.`))
              .join(' ');
          return (
            <li key={t.tag}>
              <div className="erfolge-verlauf-kopf">
                <h3>{name}</h3>
                {t.punkte > 0 && <span className="erfolge-plus">+{t.punkte}</span>}
                <VorleseKnopf text={vorlesen} />
              </div>
              <ul>
                {eintraege.map((g, i) => (
                  <li key={i} data-art={g.art}>
                    <span aria-hidden="true">{g.symbol}</span>
                    <span>{g.text}</span>
                    {g.punkte > 0 && <span className="erfolge-punkte">+{g.punkte}</span>}
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ol>
      {anzahl < tage.length && (
        <button
          type="button"
          className="erfolge-mehr"
          onClick={() => setAnzahl((a) => a + TAGE_PRO_SEITE)}
        >
          Ältere Tage zeigen
        </button>
      )}
    </section>
  );
}
