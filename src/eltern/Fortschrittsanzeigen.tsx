import type { LernEreignis } from '../daten/ereignisse.ts';
import type { WortStand } from '../vokabeln-en/leitner.ts';
import type { Vokabelliste } from '../vokabeln-en/typen.ts';
import {
  fortschritt,
  wortDetails,
  wannText,
  zuletztGeuebt,
  type Fortschritt,
  type Lernstand,
} from './statistik.ts';
import './Fortschritt.css';

const STAND_TEXT: Record<Lernstand, string> = { neu: 'neu', lernt: 'am Lernen', sicher: 'sicher' };

// Balken aus „sicher“, „am Lernen“ und „neu“
export function FortschrittBalken({ f }: { f: Fortschritt }) {
  const anteil = (n: number) => (f.gesamt ? `${(n / f.gesamt) * 100}%` : '0');
  const text = `${f.sicher} sicher, ${f.lernt} am Lernen, ${f.neu} neu`;
  return (
    <div className="fortschritt-balken" role="img" aria-label={text} title={text}>
      <span className="fb-sicher" style={{ width: anteil(f.sicher) }} />
      <span className="fb-lernt" style={{ width: anteil(f.lernt) }} />
      <span className="fb-neu" style={{ width: anteil(f.neu) }} />
    </div>
  );
}

export function FortschrittLegende({ f }: { f: Fortschritt }) {
  return (
    <p className="fortschritt-legende">
      <span>
        <i className="fl fb-sicher" aria-hidden="true" /> {f.sicher} sicher
      </span>
      <span>
        <i className="fl fb-lernt" aria-hidden="true" /> {f.lernt} am Lernen
      </span>
      <span>
        <i className="fl fb-neu" aria-hidden="true" /> {f.neu} neu
      </span>
    </p>
  );
}

// Fortschritt einer Lektion: Balken, zuletzt geübt und Lernstand jedes Worts
export function LektionFortschritt({
  liste,
  ereignisse,
  staende,
}: {
  liste: Vokabelliste;
  ereignisse: readonly LernEreignis[];
  staende: ReadonlyMap<string, WortStand>;
}) {
  const f = fortschritt(liste, staende);
  const details = wortDetails(liste, ereignisse, staende);
  const schwer = details.filter((d) => d.falsch > 0).sort((a, b) => b.falsch - a.falsch);

  return (
    <section className="lektion-fortschritt" aria-label="Fortschritt">
      <h3>Wo steht Milena?</h3>
      <FortschrittBalken f={f} />
      <FortschrittLegende f={f} />
      <p className="eltern-hinweis">
        Zuletzt geübt: {wannText(zuletztGeuebt(liste.id, ereignisse))}
      </p>
      {schwer.length > 0 && (
        <p>
          <strong>Fällt ihr schwer:</strong>{' '}
          {schwer
            .slice(0, 5)
            .map((d) => `${d.wort.en} (${d.falsch}×)`)
            .join(', ')}
        </p>
      )}
      <details>
        <summary>Alle Wörter mit Lernstand</summary>
        <table className="test-tabelle">
          <thead>
            <tr>
              <th>Wort</th>
              <th>Stand</th>
              <th>Zuletzt</th>
              <th>Falsch</th>
            </tr>
          </thead>
          <tbody>
            {details.map((d) => (
              <tr key={d.wort.id}>
                <td>
                  <span lang="en">{d.wort.en}</span>
                  <span className="test-thema">{d.wort.de}</span>
                </td>
                <td>{STAND_TEXT[d.stand]}</td>
                <td>{wannText(d.zuletzt)}</td>
                <td>{d.falsch}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </section>
  );
}
