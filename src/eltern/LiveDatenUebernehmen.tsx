import { useEffect, useState } from 'react';
import type { GespeicherterWert } from '../daten/schluesselWert.ts';
import { dropboxLive } from '../sync/verbindung.ts';
import {
  fuerVorschau,
  istLeer,
  kopieStand,
  leseLiveDaten,
  leseLiveDatenAusDropbox,
  schreibeInVorschau,
  standardKopieStand,
  zeitText,
  zusammenfassung,
  type KopieStand,
  type LiveDaten,
} from './liveKopie.ts';

// Erst aus Dropbox (geht auf jedem Gerät), sonst aus Milenas App auf diesem Gerät
async function standardLesen(): Promise<LiveDaten | null> {
  return (await leseLiveDatenAusDropbox(dropboxLive)) ?? (await leseLiveDaten());
}

type Zustand = { art: 'bereit' } | { art: 'arbeitet' } | { art: 'fehler'; text: string };

// Stand der zuletzt übernommenen Daten (auch für die Übersicht im Eltern-Bereich)
// eslint-disable-next-line react-refresh/only-export-components
export function useKopieStand(
  speicher: GespeicherterWert<KopieStand> = standardKopieStand,
): KopieStand | null | undefined {
  const [stand, setStand] = useState<KopieStand | null>();
  useEffect(() => {
    let aktiv = true;
    speicher
      .laden()
      .catch(() => undefined)
      .then((s) => aktiv && setStand(s ?? null));
    return () => {
      aktiv = false;
    };
  }, [speicher]);
  return stand;
}

// Nur im Testkanal: Inhalte aus Milenas App übernehmen
export function LiveDatenUebernehmen({
  lesen = standardLesen,
  schreiben = schreibeInVorschau,
  neuLaden = () => window.location.reload(),
  standSpeicher = standardKopieStand,
}: {
  lesen?: () => Promise<LiveDaten | null>;
  schreiben?: (daten: LiveDaten, stand: KopieStand) => Promise<void>;
  neuLaden?: () => void;
  standSpeicher?: GespeicherterWert<KopieStand>;
}) {
  const [zustand, setZustand] = useState<Zustand>({ art: 'bereit' });
  const stand = useKopieStand(standSpeicher);

  async function uebernehmen() {
    setZustand({ art: 'arbeitet' });
    try {
      const live = await lesen();
      if (!live || istLeer(live)) {
        setZustand({
          art: 'fehler',
          text: `Keine Daten aus Milenas App gefunden${live ? ` (${live.quelle})` : ''}. Am einfachsten: den Testkanal mit Dropbox verbinden, dann kommen die Daten von dort.`,
        });
        return;
      }
      const frage = `Aus ${live.quelle} übernehmen: ${zusammenfassung(live)}.\n\nDas ersetzt Lektionen, Belohnungen, Level und Punkte im Testkanal. Milenas App bleibt unverändert.`;
      if (!window.confirm(frage)) {
        setZustand({ art: 'bereit' });
        return;
      }
      const jetzt = new Date().toISOString();
      await schreiben(fuerVorschau(live, jetzt), kopieStand(live, jetzt));
      neuLaden();
    } catch {
      setZustand({
        art: 'fehler',
        text: 'Das Übernehmen hat nicht geklappt. Bitte noch einmal versuchen.',
      });
    }
  }

  return (
    <section className="verbinden">
      <h2>Stand des Testkanals</h2>
      {stand === null && <p>Im Testkanal sind noch eigene Testdaten, nichts übernommen.</p>}
      {stand && (
        <dl className="kopie-stand" aria-label="Übernommener Stand">
          <dt>Übernommen am</dt>
          <dd>{zeitText(stand.zeit)} Uhr</dd>
          <dt>Quelle</dt>
          <dd>{stand.quelle}</dd>
          <dt>Inhalt</dt>
          <dd>
            {stand.lektionen} Lektionen, {stand.runden} Runden
          </dd>
          {stand.letzteRunde && (
            <>
              <dt>Letzte Runde von Milena</dt>
              <dd>{zeitText(stand.letzteRunde)} Uhr</dd>
            </>
          )}
        </dl>
      )}
      <p className="eltern-hinweis">
        Übernimmt Lektionen, Belohnungen, Level und Punkte aus Milenas App – aus Dropbox, wenn der
        Testkanal verbunden ist, sonst von diesem Gerät. Milenas App wird dabei nur gelesen, nicht
        verändert. Danach gilt nur noch das, was ihr im Testkanal ändert.
      </p>
      {zustand.art === 'fehler' && (
        <p className="verbinden-fehler" role="alert">
          {zustand.text}
        </p>
      )}
      <div className="verbinden-knoepfe">
        <button
          type="button"
          className="verbinden-haupt"
          disabled={zustand.art === 'arbeitet'}
          onClick={uebernehmen}
        >
          {zustand.art === 'arbeitet'
            ? 'Einen Moment …'
            : stand
              ? 'Neu übernehmen'
              : 'Daten übernehmen'}
        </button>
      </div>
    </section>
  );
}
