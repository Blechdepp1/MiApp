import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  MAX_TITEL,
  STATUS,
  STATUS_TEXT,
  statusVon,
  type EnglischInhalt,
  type Lektion,
  type LektionStatus,
} from '../lektionen/lektion.ts';
import { liesVerbliste, liesWortliste } from '../lektionen/wortliste.ts';
import { EintragFelder } from './Eintraege.tsx';
import {
  eintraegeVon,
  inhaltAus,
  leererEintrag,
  NAME,
  vergleichsText,
  type Eintrag,
} from './eintragsArten.ts';

export type Aenderung = {
  titel: string;
  klassenarbeit?: string;
  status: LektionStatus;
  inhalt: EnglischInhalt;
};

const STATUS_HINWEIS: Record<LektionStatus, string> = {
  aktiv: 'Wird geübt.',
  pausiert: 'Wird noch nicht geübt.',
  archiviert: 'Nur noch Wiederholung der Wörter, die sie schon gelernt hat.',
};

// Eingefügten Text lesen: Wortpaare oder Verben mit drei Formen
function liesEinfuegen(art: EnglischInhalt['art'], text: string) {
  if (art === 'verben') {
    const { verben, fehler } = liesVerbliste(text);
    return { neu: verben.map((v): Eintrag => ({ id: crypto.randomUUID(), ...v })), fehler };
  }
  const { paare, fehler } = liesWortliste(text);
  return { neu: paare.map((p): Eintrag => ({ id: crypto.randomUUID(), ...p })), fehler };
}

// Eine Englisch-Lektion (Vokabeln oder unregelmäßige Verben) bearbeiten. Einträge behalten ihre
// id, damit der Lernstand erhalten bleibt.
export function LektionBearbeiten({
  lektion,
  onSpeichern,
  onLoeschen,
  onGeaendert,
  onZurueck,
  kopf,
}: {
  lektion: Lektion & { inhalt: EnglischInhalt };
  // Wird unter „Alle Lektionen“ angezeigt (z. B. der Lernstand)
  kopf?: ReactNode;
  // liefert einen Fehlertext oder null
  onSpeichern: (aenderung: Aenderung) => Promise<string | null>;
  onLoeschen: () => void;
  onGeaendert: (ungespeichert: boolean) => void;
  onZurueck: () => void;
}) {
  const art = lektion.inhalt.art;
  const name = NAME[art];
  const start = useMemo(
    () => ({
      titel: lektion.titel,
      klassenarbeit: lektion.klassenarbeit ?? '',
      status: statusVon(lektion),
      woerter: eintraegeVon(lektion.inhalt),
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

  function aendereWort(i: number, neu: Eintrag) {
    aendere({ woerter: stand.woerter.map((w, j) => (j === i ? neu : w)) });
  }

  function uebernehmeListe() {
    const gelesen = liesEinfuegen(art, einfuegen);
    const vorhanden = new Set(stand.woerter.map(vergleichsText));
    const neu = gelesen.neu.filter((e) => !vorhanden.has(vergleichsText(e)));
    aendere({ woerter: [...stand.woerter, ...neu] });
    setNichtErkannt(gelesen.fehler);
    setEinfuegen(gelesen.fehler.join('\n'));
    setMeldung({ text: `${neu.length} ${name.viele} übernommen.`, fehler: false });
  }

  async function speichern() {
    const inhalt = inhaltAus(art, stand.woerter);
    const fehler = await onSpeichern({
      titel: stand.titel.trim(),
      ...(stand.klassenarbeit && { klassenarbeit: stand.klassenarbeit }),
      status: stand.status,
      inhalt,
    });
    if (fehler) {
      setMeldung({ text: fehler, fehler: true });
      return;
    }
    setStand((s) => ({ ...s, titel: s.titel.trim(), woerter: eintraegeVon(inhalt) }));
    setMeldung({ text: '✓ Gespeichert', fehler: false });
  }

  return (
    <div className="bearbeiten">
      <button type="button" className="nur-handy bearbeiten-zurueck" onClick={onZurueck}>
        ← Alle Lektionen
      </button>
      {kopf}
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

      <h3>
        {name.viele} ({stand.woerter.length})
      </h3>
      {art === 'verben' && (
        <p className="eltern-hinweis">
          Je Verb: 1. Form (infinitive), 2. Form (simple past), 3. Form (past participle), dann
          Deutsch. Mehrere Möglichkeiten mit Komma, z. B. „was, were“.
        </p>
      )}
      <ul className="verwalten-liste bearbeiten-woerter">
        {stand.woerter.map((w, i) => (
          <li key={w.id}>
            <EintragFelder eintrag={w} nr={i + 1} onAendern={(neu) => aendereWort(i, neu)} />
            <button
              type="button"
              className="verwalten-entfernen"
              aria-label={`${name.einer} ${i + 1} löschen`}
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
          onClick={() => aendere({ woerter: [...stand.woerter, leererEintrag(art)] })}
        >
          + {name.einer}
        </button>
      </div>

      <details className="bearbeiten-einfuegen">
        <summary>{art === 'verben' ? 'Verbliste' : 'Wortliste'} einfügen</summary>
        <label>
          <span>
            {art === 'verben'
              ? 'Eine Zeile pro Verb, z. B. „go – went – gone – gehen“'
              : 'Eine Zeile pro Wort, z. B. „began – anfangen, beginnen“'}
          </span>
          <textarea rows={6} value={einfuegen} onChange={(e) => setEinfuegen(e.target.value)} />
        </label>
        {nichtErkannt.length > 0 && (
          <p className="eltern-hinweis">
            {art === 'verben'
              ? 'Diese Zeilen haben nicht drei Formen und eine Bedeutung und stehen noch oben im Feld.'
              : 'Diese Zeilen haben keine Übersetzung oder keinen Trenner und stehen noch oben im Feld.'}
          </p>
        )}
        <div className="verbinden-knoepfe">
          <button type="button" disabled={!einfuegen.trim()} onClick={uebernehmeListe}>
            Übernehmen
          </button>
        </div>
      </details>

      <div className="bearbeiten-loeschen-bereich">
        <button type="button" className="bearbeiten-loeschen" onClick={onLoeschen}>
          🗑️ Lektion löschen
        </button>
      </div>

      {/* Speichern bleibt unten im Daumen-Bereich sichtbar, auch bei langen Wortlisten */}
      <div className="bearbeiten-leiste">
        {meldung && (
          <p className={meldung.fehler ? 'verbinden-fehler' : 'verbinden-ok'} role="status">
            {meldung.text}
          </p>
        )}
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
      </div>
    </div>
  );
}
