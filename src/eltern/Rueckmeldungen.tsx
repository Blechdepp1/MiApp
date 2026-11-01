import { useState } from 'react';
import { useEreignisse, useProtokoll } from '../daten/ProtokollKontext.tsx';
import {
  rueckmeldungen,
  stimmungSymbol,
  STIMMUNGEN,
  type Rueckmeldung,
} from '../feedback/logik.ts';

const SEITEN: Record<string, string> = {
  start: 'Startseite',
  vokabeln: 'Vokabeln',
  tests: 'Tests',
  belohnungen: 'Belohnungen',
  einstellungen: 'Einstellungen',
  eltern: 'Eltern-Bereich',
};

function zeit(iso: string): string {
  return new Date(iso).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Rückmeldungen von Milena und automatisch gemeldete Fehler; erledigte lassen sich abhaken
export function Rueckmeldungen() {
  const ereignisse = useEreignisse() ?? [];
  const protokoll = useProtokoll();
  const [alleZeigen, setAlleZeigen] = useState(false);
  const liste = rueckmeldungen(ereignisse);
  const offen = liste.filter((r) => !r.erledigt);
  const erledigt = liste.filter((r) => r.erledigt);

  return (
    <section className="verbinden verwalten">
      <h2>Rückmeldungen</h2>
      {offen.length === 0 && <p>Keine neuen Rückmeldungen.</p>}
      <ul className="rueckmeldungen">
        {offen.map((r) => (
          <Eintrag
            key={r.id}
            r={r}
            onErledigt={() => protokoll.hinzufuegen({ typ: 'feedback-erledigt', feedbackId: r.id })}
          />
        ))}
      </ul>
      {erledigt.length > 0 && (
        <>
          <button type="button" onClick={() => setAlleZeigen(!alleZeigen)}>
            {alleZeigen ? 'Erledigte ausblenden' : `Erledigte zeigen (${erledigt.length})`}
          </button>
          {alleZeigen && (
            <ul className="rueckmeldungen rueckmeldungen-erledigt">
              {erledigt.map((r) => (
                <Eintrag key={r.id} r={r} />
              ))}
            </ul>
          )}
        </>
      )}
      <p className="eltern-hinweis">
        Milena schickt Rückmeldungen über „💬 Sag uns was“ auf der Startseite. Technische Fehler
        meldet die App selbst (🛠️).
      </p>
    </section>
  );
}

function Eintrag({ r, onErledigt }: { r: Rueckmeldung; onErledigt?: () => void }) {
  const stimmung = STIMMUNGEN.find((s) => s.stimmung === r.stimmung)?.name;
  return (
    <li>
      <span className="rueckmeldung-symbol" aria-hidden="true">
        {r.art === 'fehler' ? '🛠️' : stimmungSymbol(r.stimmung)}
      </span>
      <span className="rueckmeldung-text">
        <strong>
          {r.art === 'fehler' ? 'Technischer Fehler' : stimmung ? `Milena: ${stimmung}` : 'Milena'}
        </strong>
        {r.text && <span>„{r.text}“</span>}
        <span className="rueckmeldung-info">
          {zeit(r.zeit)} · {SEITEN[r.seite] ?? r.seite} · Version {r.version}
          {r.geraetInfo && ` · ${r.geraetInfo}`}
        </span>
      </span>
      {onErledigt && (
        <button type="button" onClick={onErledigt}>
          Erledigt
        </button>
      )}
    </li>
  );
}
