import { useState } from 'react';
import {
  MAX_NAME,
  MAX_PREIS,
  pruefeBelohnungen,
  SYMBOLE,
  type Belohnung,
} from '../belohnung/inhalte.ts';
import { lernrate, lernzeitText, MIN_RUNDEN_FUER_MESSUNG } from '../belohnung/lernzeit.ts';
import { useInhalt } from '../daten/InhalteKontext.tsx';
import { useEreignisse } from '../daten/ProtokollKontext.tsx';
import { useGeraet } from './GeraetKontext.tsx';

// Belohnungen anlegen, ändern, löschen – gespeichert wird erst mit „Speichern“
export function BelohnungenVerwalten() {
  const [belohnungen, speichern] = useInhalt('belohnungen');
  const darfAendern = useGeraet().geraet?.rolle === 'eltern';
  const [entwurf, setEntwurf] = useState<Belohnung[] | null>(null);
  const [meldung, setMeldung] = useState<{ ok: boolean; text: string } | null>(null);
  const liste = entwurf ?? belohnungen;
  const rate = lernrate(useEreignisse() ?? []);

  function aendere(i: number, aenderung: Partial<Belohnung>) {
    setMeldung(null);
    setEntwurf(liste.map((b, j) => (j === i ? { ...b, ...aenderung } : b)));
  }

  function hinzufuegen() {
    setMeldung(null);
    setEntwurf([...liste, { id: crypto.randomUUID(), symbol: '🎁', name: '', preis: 500 }]);
  }

  function entfernen(i: number) {
    setMeldung(null);
    setEntwurf(liste.filter((_, j) => j !== i));
  }

  async function sichern() {
    const fehler = pruefeBelohnungen(liste);
    if (fehler) {
      setMeldung({ ok: false, text: fehler });
      return;
    }
    await speichern(liste.map((b) => ({ ...b, name: b.name.trim() })));
    setEntwurf(null);
    setMeldung({ ok: true, text: 'Gespeichert ✓' });
  }

  return (
    <section className="verbinden verwalten">
      <h2>Belohnungen</h2>
      {!darfAendern && (
        <p className="eltern-hinweis">
          Belohnungen ändert ihr auf einem Eltern-Gerät. Hier werden sie nur angezeigt.
        </p>
      )}
      <ul className="verwalten-liste">
        {liste.map((b, i) => (
          <li key={b.id}>
            <select
              aria-label={`Symbol für ${b.name || 'neue Belohnung'}`}
              value={b.symbol}
              disabled={!darfAendern}
              onChange={(e) => aendere(i, { symbol: e.target.value })}
            >
              {[...new Set([b.symbol, ...SYMBOLE])].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <input
              aria-label="Name"
              value={b.name}
              maxLength={MAX_NAME}
              placeholder="z. B. Kino"
              disabled={!darfAendern}
              onChange={(e) => aendere(i, { name: e.target.value })}
            />
            <label className="verwalten-zahl">
              <input
                aria-label={`Preis für ${b.name || 'neue Belohnung'}`}
                type="number"
                inputMode="numeric"
                min={1}
                max={MAX_PREIS}
                value={Number.isNaN(b.preis) ? '' : b.preis}
                disabled={!darfAendern}
                onChange={(e) => aendere(i, { preis: e.target.valueAsNumber })}
              />
              <span>Punkte</span>
            </label>
            {darfAendern && (
              <button
                type="button"
                className="verwalten-entfernen"
                aria-label={`${b.name || 'Belohnung'} löschen`}
                onClick={() => entfernen(i)}
              >
                🗑️
              </button>
            )}
            {b.preis > 0 && (
              <span className="verwalten-lernzeit">
                {lernzeitText(b.preis, rate.punkteProMinute)} Lernzeit
              </span>
            )}
          </li>
        ))}
      </ul>
      <p className="eltern-hinweis">
        {rate.gemessen
          ? `Lernzeit gemessen aus ${rate.runden} Runden: etwa ${Math.round(rate.punkteProMinute)} Punkte pro Minute.`
          : `Lernzeit geschätzt (etwa ${rate.punkteProMinute} Punkte pro Minute). Nach ${MIN_RUNDEN_FUER_MESSUNG} Runden wird mit echten Werten gerechnet.`}
      </p>
      {darfAendern && (
        <div className="verbinden-knoepfe">
          <button type="button" onClick={hinzufuegen}>
            + Belohnung
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
