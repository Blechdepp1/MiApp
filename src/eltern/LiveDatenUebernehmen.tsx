import { useState } from 'react';
import { dropboxLive } from '../sync/verbindung.ts';
import {
  fuerVorschau,
  istLeer,
  leseLiveDaten,
  leseLiveDatenAusDropbox,
  schreibeInVorschau,
  zusammenfassung,
  type LiveDaten,
} from './liveKopie.ts';

// Erst aus Dropbox (geht auf jedem Gerät), sonst aus Milenas App auf diesem Gerät
async function standardLesen(): Promise<LiveDaten | null> {
  return (await leseLiveDatenAusDropbox(dropboxLive)) ?? (await leseLiveDaten());
}

type Zustand = { art: 'bereit' } | { art: 'arbeitet' } | { art: 'fehler'; text: string };

// Nur im Testkanal: Inhalte aus Milenas App auf diesem Gerät übernehmen
export function LiveDatenUebernehmen({
  lesen = standardLesen,
  schreiben = schreibeInVorschau,
  neuLaden = () => window.location.reload(),
}: {
  lesen?: () => Promise<LiveDaten | null>;
  schreiben?: (daten: LiveDaten) => Promise<void>;
  neuLaden?: () => void;
}) {
  const [zustand, setZustand] = useState<Zustand>({ art: 'bereit' });

  async function uebernehmen() {
    setZustand({ art: 'arbeitet' });
    try {
      const live = await lesen();
      if (!live || istLeer(live)) {
        setZustand({
          art: 'fehler',
          text: `Keine Daten aus Milenas App gefunden${live ? ` (${live.quelle})` : ''}. Am einfachsten: den Testkanal oben mit Dropbox verbinden, dann kommen die Daten von dort.`,
        });
        return;
      }
      const frage = `Aus ${live.quelle} übernehmen: ${zusammenfassung(live)}.\n\nDas ersetzt Lektionen, Belohnungen, Level und Punkte im Testkanal. Milenas App bleibt unverändert.`;
      if (!window.confirm(frage)) {
        setZustand({ art: 'bereit' });
        return;
      }
      await schreiben(fuerVorschau(live, new Date().toISOString()));
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
      <h2>🧪 Daten aus Milenas App</h2>
      <p>
        Übernimmt Lektionen, Belohnungen, Level und Punkte aus Milenas App in den Testkanal – aus
        Dropbox, wenn der Testkanal verbunden ist, sonst von diesem Gerät. Milenas App wird dabei
        nur gelesen, nicht verändert.
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
          {zustand.art === 'arbeitet' ? 'Einen Moment …' : 'Daten übernehmen'}
        </button>
      </div>
    </section>
  );
}
