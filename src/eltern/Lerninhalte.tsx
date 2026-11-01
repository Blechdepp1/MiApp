import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  istVokabelLektion,
  pruefeLektion,
  sortiereLektionen,
  STATUS,
  STATUS_TEXT,
  statusVon,
  verschiebe,
  type Lektion,
} from '../lektionen/lektion.ts';
import { useLektionen, useLektionenSpeicher } from '../lektionen/LektionenKontext.tsx';
import { LektionBearbeiten, type Aenderung } from './LektionBearbeiten.tsx';

const FAECHER: { fach: string; name: string }[] = [
  { fach: 'englisch', name: 'Englisch' },
  { fach: 'deutsch', name: 'Deutsch' },
  { fach: 'mathe', name: 'Mathe' },
];

const VERWERFEN = 'Deine Änderungen an dieser Lektion sind noch nicht gespeichert. Verwerfen?';

function beschreibung(l: Lektion): string {
  const teile = [istVokabelLektion(l) ? `${l.inhalt.woerter.length} Wörter` : l.fach];
  if (l.klassenarbeit) {
    teile.push(`Klassenarbeit ${new Date(l.klassenarbeit).toLocaleDateString('de-DE')}`);
  }
  return teile.join(' · ');
}

// Lerninhalte verwalten: Fach → Lektion → Wörter. Am Handy erst die Liste, dann die Lektion;
// am PC beides nebeneinander (SPEC 10a).
export function Lerninhalte({
  startId,
  onSchliessen,
}: {
  startId?: string;
  onSchliessen: () => void;
}) {
  const lektionen = (useLektionen() ?? []).filter((l) => !l.geloescht);
  const speicher = useLektionenSpeicher();
  const [gewaehlt, setGewaehlt] = useState<string | null>(startId ?? null);
  const [ungespeichert, setUngespeichert] = useState(false);
  const [verschiebt, setVerschiebt] = useState(false);

  // Eigener Verlaufseintrag: Die Zurück-Taste schließt nur die Lerninhalte und fragt vorher,
  // wenn etwas nicht gespeichert ist
  const ungespeichertRef = useRef(false);
  const schliessenRef = useRef(onSchliessen);
  useLayoutEffect(() => {
    ungespeichertRef.current = ungespeichert;
    schliessenRef.current = onSchliessen;
  });
  useEffect(() => {
    const eintrag = () => ({ ...window.history.state, lerninhalte: true });
    if (!window.history.state?.lerninhalte) {
      window.history.pushState(eintrag(), '', window.location.href);
    }
    const beiZurueck = () => {
      if (ungespeichertRef.current && !window.confirm(VERWERFEN)) {
        window.history.pushState(eintrag(), '', window.location.href);
        return;
      }
      schliessenRef.current();
    };
    window.addEventListener('popstate', beiZurueck);
    return () => window.removeEventListener('popstate', beiZurueck);
  }, []);

  function schliessen() {
    if (!darfWechseln()) return;
    ungespeichertRef.current = false;
    if (window.history.state?.lerninhalte) window.history.back();
    else onSchliessen();
  }
  const merkeUngespeichert = useCallback((u: boolean) => setUngespeichert(u), []);

  const lektion = lektionen.find((l) => l.id === gewaehlt);
  const faecher = FAECHER.filter(
    (f) => f.fach === 'englisch' || lektionen.some((l) => l.fach === f.fach),
  );

  function darfWechseln() {
    return !ungespeichert || window.confirm(VERWERFEN);
  }

  function waehle(id: string | null) {
    if (id === gewaehlt || !darfWechseln()) return;
    setUngespeichert(false);
    setGewaehlt(id);
  }

  async function verschieben(gruppe: Lektion[], id: string, richtung: -1 | 1) {
    if (verschiebt) return;
    setVerschiebt(true);
    try {
      const jetzt = new Date().toISOString();
      for (const l of verschiebe(gruppe, id, richtung)) {
        await speicher.speichere({ ...l, geaendert: jetzt });
      }
    } finally {
      setVerschiebt(false);
    }
  }

  async function speichern(alt: Lektion, aenderung: Aenderung): Promise<string | null> {
    // Aktuellen Stand nehmen (Reihenfolge kann sich inzwischen geändert haben)
    const basis = lektionen.find((l) => l.id === alt.id) ?? alt;
    const neu: Lektion = { ...basis, ...aenderung, geaendert: new Date().toISOString() };
    if (!aenderung.klassenarbeit) delete neu.klassenarbeit;
    // Neuer Status: Platz in der alten Gruppe gilt nicht mehr, sie kommt hinter die sortierten
    if (aenderung.status !== statusVon(basis)) delete neu.reihenfolge;
    const fehler = pruefeLektion(neu);
    if (fehler) return fehler;
    await speicher.speichere(neu);
    return null;
  }

  async function loeschen(l: Lektion) {
    if (!window.confirm(`Lektion „${l.titel}“ wirklich löschen? Ihr Lernstand dazu geht verloren.`))
      return;
    await speicher.speichere({ ...l, geloescht: true, geaendert: new Date().toISOString() });
    setUngespeichert(false);
    setGewaehlt(null);
  }

  return (
    <div
      className={`lerninhalte${lektion ? ' mit-auswahl' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Lerninhalte"
    >
      <header className="lerninhalte-kopf">
        <h2>📚 Lerninhalte</h2>
        <button type="button" onClick={schliessen}>
          Schließen
        </button>
      </header>

      <nav className="lerninhalte-liste" aria-label="Lektionen">
        {faecher.map(({ fach, name }) => {
          const desFachs = lektionen.filter((l) => l.fach === fach);
          return (
            <section key={fach}>
              <h3>{name}</h3>
              {desFachs.length === 0 && <p className="eltern-hinweis">Noch keine Lektionen.</p>}
              {STATUS.map((status) => {
                const gruppe = sortiereLektionen(desFachs.filter((l) => statusVon(l) === status));
                if (gruppe.length === 0) return null;
                return (
                  <div key={status} className="lerninhalte-gruppe">
                    <h4>{STATUS_TEXT[status]}</h4>
                    <ul>
                      {gruppe.map((l, i) => (
                        <li key={l.id}>
                          <button
                            type="button"
                            className="lerninhalte-eintrag"
                            aria-current={l.id === gewaehlt}
                            onClick={() => waehle(l.id)}
                          >
                            <strong>{l.titel}</strong>
                            <span>{beschreibung(l)}</span>
                          </button>
                          <button
                            type="button"
                            className="lerninhalte-pfeil"
                            aria-label={`${l.titel} nach oben`}
                            disabled={i === 0 || verschiebt}
                            onClick={() => verschieben(gruppe, l.id, -1)}
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            className="lerninhalte-pfeil"
                            aria-label={`${l.titel} nach unten`}
                            disabled={i === gruppe.length - 1 || verschiebt}
                            onClick={() => verschieben(gruppe, l.id, 1)}
                          >
                            ↓
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </section>
          );
        })}
      </nav>

      <div className="lerninhalte-detail">
        {!lektion ? (
          <p className="eltern-hinweis">Wähle eine Lektion, um sie anzusehen und zu bearbeiten.</p>
        ) : istVokabelLektion(lektion) ? (
          <LektionBearbeiten
            key={lektion.id}
            lektion={lektion}
            onSpeichern={(a) => speichern(lektion, a)}
            onLoeschen={() => loeschen(lektion)}
            onGeaendert={merkeUngespeichert}
            onZurueck={() => waehle(null)}
          />
        ) : (
          <p className="eltern-hinweis">
            Diese Lektion kann diese App-Version noch nicht bearbeiten.
          </p>
        )}
      </div>
    </div>
  );
}
