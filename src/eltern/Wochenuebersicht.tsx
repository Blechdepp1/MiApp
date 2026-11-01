import { tagVon } from '../belohnung/logik.ts';
import { useEreignisse } from '../daten/ProtokollKontext.tsx';
import {
  alsVokabelliste,
  istVokabelLektion,
  sortiereLektionen,
  statusVon,
} from '../lektionen/lektion.ts';
import { useLektionen } from '../lektionen/LektionenKontext.tsx';
import { berechneStaende } from '../vokabeln-en/leitner.ts';
import { FortschrittBalken, FortschrittLegende } from './Fortschrittsanzeigen.tsx';
import {
  fortschritt,
  schwierigeWoerter,
  wannText,
  wochenUebersicht,
  zuletztGeuebt,
} from './statistik.ts';
import './Fortschritt.css';

const WOCHENTAG = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

// Wochenübersicht für die Eltern: Lerntage, Runden, Minuten, Fortschritt und schwierige Wörter
export function Wochenuebersicht({ heute = tagVon(new Date().toISOString()) }: { heute?: string }) {
  const ereignisse = useEreignisse() ?? [];
  const lektionen = sortiereLektionen((useLektionen() ?? []).filter(istVokabelLektion));
  const listen = lektionen.map(alsVokabelliste);
  const staende = berechneStaende(ereignisse);
  const woche = wochenUebersicht(ereignisse, heute, listen);
  const schwer = schwierigeWoerter(listen, ereignisse, heute);
  const aktuell = lektionen.filter((l) => statusVon(l) === 'aktiv');

  return (
    <>
      <section className="verbinden" aria-label="Die letzten 7 Tage">
        <h2>Die letzten 7 Tage</h2>
        <ul className="woche-tage">
          {woche.tage.map((t) => (
            <li key={t.tag}>
              <span>{WOCHENTAG[new Date(`${t.tag}T12:00:00`).getDay()]}</span>
              <span
                className={t.runden > 0 ? 'woche-punkt geuebt' : 'woche-punkt'}
                aria-label={`${t.runden} Runden`}
              >
                {t.runden > 0 ? t.runden : ''}
              </span>
            </li>
          ))}
        </ul>
        <dl className="woche-zahlen">
          <div>
            <dt>Lerntage</dt>
            <dd>{woche.lerntage}</dd>
          </div>
          <div>
            <dt>Runden</dt>
            <dd>{woche.runden}</dd>
          </div>
          <div>
            <dt>Minuten</dt>
            <dd>≈ {woche.minuten}</dd>
          </div>
          <div>
            <dt>Neu sicher</dt>
            <dd>{woche.neuSicher}</dd>
          </div>
        </dl>
      </section>

      <section className="verbinden" aria-label="Gerade dran">
        <h2>Gerade dran</h2>
        {aktuell.length === 0 ? (
          <p>Gerade ist keine Lektion als „Gerade dran“ markiert.</p>
        ) : (
          <ul className="woche-lektionen">
            {aktuell.map((l) => {
              const f = fortschritt(alsVokabelliste(l), staende);
              return (
                <li key={l.id}>
                  <strong>{l.titel}</strong>
                  <FortschrittBalken f={f} />
                  <FortschrittLegende f={f} />
                  <span className="eltern-hinweis">
                    Zuletzt geübt: {wannText(zuletztGeuebt(l.id, ereignisse), heute)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="verbinden" aria-label="Fällt ihr gerade schwer">
        <h2>Fällt ihr gerade schwer</h2>
        {schwer.length === 0 ? (
          <p>In den letzten 14 Tagen gab es keine Fehler.</p>
        ) : (
          <table className="test-tabelle">
            <thead>
              <tr>
                <th>Wort</th>
                <th>Lektion</th>
                <th>Falsch</th>
              </tr>
            </thead>
            <tbody>
              {schwer.map((s) => (
                <tr key={`${s.liste.id}/${s.wort.id}`}>
                  <td>
                    <span lang="en">{s.wort.en}</span>
                    <span className="test-thema">{s.wort.de}</span>
                  </td>
                  <td>{s.liste.name}</td>
                  <td>{s.falsch}×</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="eltern-hinweis">
          Fehler sind normal und gehören zum Lernen. Diese Wörter kommen in den Runden automatisch
          öfter dran.
        </p>
      </section>
    </>
  );
}
