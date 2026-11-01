import { useState } from 'react';
import { useEreignisse, useProtokoll } from '../daten/ProtokollKontext.tsx';
import { useLektionen } from '../lektionen/LektionenKontext.tsx';
import {
  alleTests,
  artName,
  datumText,
  fachName,
  NOTEN,
  punkteFuerTest,
  zuBestaetigen,
  type TestEintrag,
} from '../klassenarbeiten/logik.ts';

// Übersicht aller Tests und Klassenarbeiten; Noten bestätigen (erst dann zählt der Bonus)
export function TestUebersicht() {
  const ereignisse = useEreignisse() ?? [];
  const protokoll = useProtokoll();
  const lektionen = useLektionen() ?? [];
  const [laeuft, setLaeuft] = useState(false);
  const tests = alleTests(ereignisse);
  const offen = zuBestaetigen(tests);

  async function schreibe(aktion: () => Promise<unknown>) {
    if (laeuft) return;
    setLaeuft(true);
    try {
      await aktion();
    } finally {
      setLaeuft(false);
    }
  }

  const lektionTitel = (t: TestEintrag) =>
    t.lektionId ? lektionen.find((l) => l.id === t.lektionId)?.titel : undefined;

  return (
    <>
      <section className="verbinden verwalten">
        <h2>Noten bestätigen</h2>
        {offen.length === 0 ? (
          <p>Gerade wartet keine Note auf eure Bestätigung.</p>
        ) : (
          <ul className="verwalten-liste test-uebersicht">
            {offen.map((t) => (
              <li key={t.id}>
                <span className="lektion-text">
                  <strong>
                    {artName(t.art)} {fachName(t.fach)} · Note {t.note}
                  </strong>
                  <span>
                    {datumText(t.datum)}
                    {t.thema && ` · ${t.thema}`}
                  </span>
                </span>
                <label className="test-note-aendern">
                  <span>Note</span>
                  <select
                    value={t.note}
                    disabled={laeuft}
                    onChange={(e) =>
                      schreibe(() =>
                        protokoll.hinzufuegen({
                          typ: 'test-ergebnis',
                          testId: t.id,
                          note: Number(e.target.value),
                        }),
                      )
                    }
                  >
                    {NOTEN.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  className="verbinden-haupt"
                  disabled={laeuft}
                  onClick={() =>
                    schreibe(async () => {
                      // Nicht doppelt bestätigen, falls ein anderes Gerät schneller war
                      const aktuell = alleTests(await protokoll.alle()).find((x) => x.id === t.id);
                      if (!aktuell?.bestaetigt) {
                        await protokoll.hinzufuegen({ typ: 'test-bestaetigt', testId: t.id });
                      }
                    })
                  }
                >
                  Bestätigen
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="eltern-hinweis">
          Milena bekommt Punkte fürs Eintragen und – nach eurer Bestätigung – fürs Nachtragen der
          Note, egal wie sie ausfällt. Ist sie besser als die letzte im selben Fach, gibt es einen
          Extra-Bonus. Stimmt die Note nicht, wählt vor dem Bestätigen die richtige aus.
        </p>
      </section>

      <section className="verbinden verwalten">
        <h2>Alle Tests</h2>
        {tests.length === 0 ? (
          <p>Noch keine Tests eingetragen.</p>
        ) : (
          <table className="test-tabelle">
            <thead>
              <tr>
                <th>Datum</th>
                <th>Test</th>
                <th>Note</th>
                <th>Punkte</th>
              </tr>
            </thead>
            <tbody>
              {tests.map((t) => (
                <tr key={t.id}>
                  <td>{datumText(t.datum)}</td>
                  <td>
                    {artName(t.art)} {fachName(t.fach)}
                    {t.thema && <span className="test-thema">{t.thema}</span>}
                    {lektionTitel(t) && (
                      <span className="test-thema">Lektion: {lektionTitel(t)}</span>
                    )}
                  </td>
                  <td>
                    {t.note === undefined ? '–' : t.bestaetigt ? `${t.note} ✓` : `${t.note} ⏳`}
                  </td>
                  <td>{punkteFuerTest(t)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
