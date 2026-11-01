import { useState } from 'react';
import { MAX_NAME, pruefeLevel } from '../belohnung/inhalte.ts';
import type { Levelstufe } from '../belohnung/werte.ts';
import { useInhalt } from '../daten/InhalteKontext.tsx';
import { useGeraet } from './GeraetKontext.tsx';

// Level-Titel und Punkte-Schwellen bearbeiten
export function LevelVerwalten() {
  const [stufen, speichern] = useInhalt('level');
  const darfAendern = useGeraet().geraet?.rolle === 'eltern';
  const [entwurf, setEntwurf] = useState<Levelstufe[] | null>(null);
  const [meldung, setMeldung] = useState<{ ok: boolean; text: string } | null>(null);
  const liste = entwurf ?? stufen;

  function aendere(i: number, aenderung: Partial<Levelstufe>) {
    setMeldung(null);
    setEntwurf(liste.map((s, j) => (j === i ? { ...s, ...aenderung } : s)));
  }

  function hinzufuegen() {
    setMeldung(null);
    const letzte = liste.at(-1)?.ab ?? 0;
    setEntwurf([...liste, { ab: letzte + 2500, titel: '' }]);
  }

  async function sichern() {
    const fehler = pruefeLevel(liste);
    if (fehler) {
      setMeldung({ ok: false, text: fehler });
      return;
    }
    await speichern(liste.map((s) => ({ ...s, titel: s.titel.trim() })));
    setEntwurf(null);
    setMeldung({ ok: true, text: 'Gespeichert ✓' });
  }

  return (
    <section className="verbinden verwalten">
      <h2>Level</h2>
      <p className="eltern-hinweis">Nach dem letzten Level gibt es alle 2500 Punkte einen Stern.</p>
      <ol className="verwalten-liste">
        {liste.map((s, i) => (
          <li key={i}>
            <span className="verwalten-nr">{i + 1}.</span>
            <input
              aria-label={`Titel Level ${i + 1}`}
              value={s.titel}
              maxLength={MAX_NAME}
              disabled={!darfAendern}
              onChange={(e) => aendere(i, { titel: e.target.value })}
            />
            <label className="verwalten-zahl">
              <span>ab</span>
              <input
                aria-label={`Punkte für Level ${i + 1}`}
                type="number"
                inputMode="numeric"
                min={0}
                value={Number.isNaN(s.ab) ? '' : s.ab}
                disabled={!darfAendern || i === 0}
                onChange={(e) => aendere(i, { ab: e.target.valueAsNumber })}
              />
            </label>
            {darfAendern && i > 0 && i === liste.length - 1 && (
              <button
                type="button"
                className="verwalten-entfernen"
                aria-label={`Level ${i + 1} löschen`}
                onClick={() => setEntwurf(liste.slice(0, -1))}
              >
                🗑️
              </button>
            )}
          </li>
        ))}
      </ol>
      {darfAendern && (
        <div className="verbinden-knoepfe">
          <button type="button" onClick={hinzufuegen}>
            + Level
          </button>
          <button type="button" className="verbinden-haupt" onClick={sichern} disabled={!entwurf}>
            Speichern
          </button>
        </div>
      )}
      {meldung && (
        <p
          className={meldung.ok ? 'verbinden-ok' : 'verbinden-fehler'}
          role={meldung.ok ? 'status' : 'alert'}
        >
          {meldung.text}
        </p>
      )}
    </section>
  );
}
