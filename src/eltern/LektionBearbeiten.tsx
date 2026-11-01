import { useEffect, useMemo, useState } from 'react';
import {
  MAX_TITEL,
  STATUS,
  STATUS_TEXT,
  statusVon,
  type Lektion,
  type LektionStatus,
  type VokabelInhalt,
} from '../lektionen/lektion.ts';
import { liesWortliste } from '../lektionen/wortliste.ts';
import type { Vokabel } from '../vokabeln-en/typen.ts';

export type Aenderung = {
  titel: string;
  klassenarbeit?: string;
  status: LektionStatus;
  inhalt: VokabelInhalt;
};

const STATUS_HINWEIS: Record<LektionStatus, string> = {
  aktiv: 'Wird geübt.',
  pausiert: 'Wird noch nicht geübt.',
  archiviert: 'Nur noch Wiederholung der Wörter, die sie schon gelernt hat.',
};

// Eine Vokabel-Lektion bearbeiten. Wörter behalten ihre id, damit der Lernstand erhalten bleibt.
export function LektionBearbeiten({
  lektion,
  onSpeichern,
  onLoeschen,
  onGeaendert,
  onZurueck,
}: {
  lektion: Lektion & { inhalt: VokabelInhalt };
  // liefert einen Fehlertext oder null
  onSpeichern: (aenderung: Aenderung) => Promise<string | null>;
  onLoeschen: () => void;
  onGeaendert: (ungespeichert: boolean) => void;
  onZurueck: () => void;
}) {
  const start = useMemo(
    () => ({
      titel: lektion.titel,
      klassenarbeit: lektion.klassenarbeit ?? '',
      status: statusVon(lektion),
      woerter: lektion.inhalt.woerter,
    }),
    [lektion],
  );
  const [stand, setStand] = useState(start);
  const [meldung, setMeldung] = useState<{ text: string; fehler: boolean } | null>(null);
  const [einfuegen, setEinfuegen] = useState('');
  const [nichtErkannt, setNichtErkannt] = useState<string[]>([]);

  const ungespeichert = JSON.stringify(stand) !== JSON.stringify(start);
  useEffect(() => onGeaendert(ungespeichert), [ungespeichert, onGeaendert]);

  function aendere(neu: Partial<typeof stand>) {
    setMeldung(null);
    setStand((s) => ({ ...s, ...neu }));
  }

  function aendereWort(i: number, feld: 'en' | 'de', wert: string) {
    aendere({ woerter: stand.woerter.map((w, j) => (j === i ? { ...w, [feld]: wert } : w)) });
  }

  function uebernehmeListe() {
    const { paare, fehler } = liesWortliste(einfuegen);
    const vorhanden = new Set(stand.woerter.map((w) => `${w.en}|${w.de}`.toLowerCase()));
    const neu: Vokabel[] = paare
      .filter((p) => !vorhanden.has(`${p.en}|${p.de}`.toLowerCase()))
      .map((p) => ({ id: crypto.randomUUID(), ...p }));
    aendere({ woerter: [...stand.woerter, ...neu] });
    setNichtErkannt(fehler);
    setEinfuegen(fehler.join('\n'));
    setMeldung({ text: `${neu.length} Wörter übernommen.`, fehler: false });
  }

  async function speichern() {
    const woerter = stand.woerter.map((w) => ({ ...w, en: w.en.trim(), de: w.de.trim() }));
    const fehler = await onSpeichern({
      titel: stand.titel.trim(),
      ...(stand.klassenarbeit && { klassenarbeit: stand.klassenarbeit }),
      status: stand.status,
      inhalt: { art: 'vokabeln', woerter },
    });
    if (fehler) {
      setMeldung({ text: fehler, fehler: true });
      return;
    }
    setStand((s) => ({ ...s, titel: s.titel.trim(), woerter }));
    setMeldung({ text: '✓ Gespeichert', fehler: false });
  }

  return (
    <div className="bearbeiten">
      <button type="button" className="nur-handy bearbeiten-zurueck" onClick={onZurueck}>
        ← Alle Lektionen
      </button>
      <label>
        <span>Titel</span>
        <input
          value={stand.titel}
          maxLength={MAX_TITEL}
          onChange={(e) => aendere({ titel: e.target.value })}
        />
      </label>
      <label>
        <span>Klassenarbeit am (optional)</span>
        <input
          type="date"
          value={stand.klassenarbeit}
          onChange={(e) => aendere({ klassenarbeit: e.target.value })}
        />
      </label>

      <fieldset className="bearbeiten-status">
        <legend>Status</legend>
        <div>
          {STATUS.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={stand.status === s}
              onClick={() => aendere({ status: s })}
            >
              {STATUS_TEXT[s]}
            </button>
          ))}
        </div>
        <p className="eltern-hinweis">{STATUS_HINWEIS[stand.status]}</p>
      </fieldset>

      <h3>Wörter ({stand.woerter.length})</h3>
      <ul className="verwalten-liste bearbeiten-woerter">
        {stand.woerter.map((w, i) => (
          <li key={w.id}>
            <input
              aria-label={`Englisch ${i + 1}`}
              lang="en"
              value={w.en}
              onChange={(e) => aendereWort(i, 'en', e.target.value)}
            />
            <input
              aria-label={`Deutsch ${i + 1}`}
              value={w.de}
              onChange={(e) => aendereWort(i, 'de', e.target.value)}
            />
            <button
              type="button"
              className="verwalten-entfernen"
              aria-label={`Wort ${i + 1} löschen`}
              onClick={() => aendere({ woerter: stand.woerter.filter((_, j) => j !== i) })}
            >
              🗑️
            </button>
          </li>
        ))}
      </ul>
      <div className="verbinden-knoepfe">
        <button
          type="button"
          onClick={() =>
            aendere({ woerter: [...stand.woerter, { id: crypto.randomUUID(), en: '', de: '' }] })
          }
        >
          + Wort
        </button>
      </div>

      <details className="bearbeiten-einfuegen">
        <summary>Wortliste einfügen</summary>
        <label>
          <span>Eine Zeile pro Wort, z. B. „began – anfangen, beginnen“</span>
          <textarea rows={6} value={einfuegen} onChange={(e) => setEinfuegen(e.target.value)} />
        </label>
        {nichtErkannt.length > 0 && (
          <p className="eltern-hinweis">
            Diese Zeilen haben keine Übersetzung oder keinen Trenner und stehen noch oben im Feld.
          </p>
        )}
        <div className="verbinden-knoepfe">
          <button type="button" disabled={!einfuegen.trim()} onClick={uebernehmeListe}>
            Übernehmen
          </button>
        </div>
      </details>

      {meldung && (
        <p className={meldung.fehler ? 'verbinden-fehler' : 'verbinden-ok'} role="status">
          {meldung.text}
        </p>
      )}
      <div className="verbinden-knoepfe">
        <button
          type="button"
          className="verbinden-haupt"
          disabled={!ungespeichert}
          onClick={speichern}
        >
          Speichern
        </button>
        <button type="button" disabled={!ungespeichert} onClick={() => setStand(start)}>
          Änderungen verwerfen
        </button>
        <button type="button" className="bearbeiten-loeschen" onClick={onLoeschen}>
          🗑️ Lektion löschen
        </button>
      </div>
    </div>
  );
}
