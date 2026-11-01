import { useEffect, useState } from 'react';
import { DROPBOX_ORDNER_ANZEIGE } from '../basis/kanal.ts';
import { DropboxFehler, type Dropbox } from './dropbox.ts';
import './Verbinden.css';

type Zustand =
  | { art: 'pruefen' }
  | { art: 'getrennt'; fehler?: string }
  | { art: 'verbunden'; meldung?: string; fehler?: string }
  | { art: 'arbeitet' };

const TESTDATEI = '/verbindungstest.json';

// Die Rückkehr von Dropbox darf nur einmal verarbeitet werden (React StrictMode ruft Effekte doppelt auf)
const abgeschlossen = new Map<string, Promise<boolean>>();

function fehlertext(fehler: unknown): string {
  if (fehler instanceof DropboxFehler) return fehler.message;
  return 'Keine Verbindung zu Dropbox. Ist das Internet an?';
}

function standardNavigieren(url: string) {
  window.location.assign(url);
}

// Entfernt ?code=…&state=… aus der Adresse, damit ein Neuladen nichts doppelt verarbeitet
function standardBereinigen() {
  window.history.replaceState(null, '', window.location.pathname + window.location.hash);
}

export function DropboxVerbinden({
  dropbox,
  adresse,
  navigieren = standardNavigieren,
  adresseBereinigen = standardBereinigen,
  onAenderung,
}: {
  dropbox: Dropbox;
  adresse?: string;
  navigieren?: (url: string) => void;
  adresseBereinigen?: () => void;
  // Wird nach Verbinden und Trennen aufgerufen (z. B. um sofort abzugleichen)
  onAenderung?: () => void;
}) {
  const [zustand, setZustand] = useState<Zustand>({ art: 'pruefen' });
  const [startAdresse] = useState(() => adresse ?? window.location.href);

  useEffect(() => {
    let aktiv = true;
    const setze = (z: Zustand) => aktiv && setZustand(z);
    const suche = new URL(startAdresse).search;
    if (!abgeschlossen.has(suche)) {
      abgeschlossen.set(suche, dropbox.schliesseAnmeldungAb(startAdresse));
    }
    abgeschlossen
      .get(suche)!
      .then(async (neuVerbunden) => {
        if (neuVerbunden) adresseBereinigen();
        const verbunden = await dropbox.verbunden();
        setze(
          verbunden
            ? { art: 'verbunden', meldung: neuVerbunden ? 'Verbunden ✓' : undefined }
            : { art: 'getrennt' },
        );
      })
      .catch((fehler) => {
        adresseBereinigen();
        setze({ art: 'getrennt', fehler: fehlertext(fehler) });
      });
    return () => {
      aktiv = false;
    };
  }, [dropbox, startAdresse, adresseBereinigen]);

  // Direkt nach dem Verbinden einmal abgleichen lassen
  const geradeVerbunden = zustand.art === 'verbunden' && zustand.meldung === 'Verbunden ✓';
  useEffect(() => {
    if (geradeVerbunden) onAenderung?.();
  }, [geradeVerbunden, onAenderung]);

  async function verbinden() {
    setZustand({ art: 'arbeitet' });
    navigieren(await dropbox.anmeldeAdresse());
  }

  async function testen() {
    setZustand({ art: 'arbeitet' });
    const zeit = new Date().toISOString();
    try {
      await dropbox.hochladen(TESTDATEI, JSON.stringify({ zeit }));
      const gelesen = await dropbox.herunterladen(TESTDATEI);
      const ok = gelesen !== undefined && JSON.parse(gelesen).zeit === zeit;
      setZustand(
        ok
          ? {
              art: 'verbunden',
              meldung: `Test erfolgreich ✓ Datei geschrieben und gelesen (${new Date(zeit).toLocaleTimeString('de-DE')})`,
            }
          : { art: 'verbunden', fehler: 'Gelesene Datei passt nicht zur geschriebenen' },
      );
    } catch (fehler) {
      setZustand({ art: 'verbunden', fehler: fehlertext(fehler) });
    }
  }

  async function trennen() {
    setZustand({ art: 'arbeitet' });
    await dropbox.trennen();
    setZustand({ art: 'getrennt' });
    onAenderung?.();
  }

  return (
    <section className="verbinden">
      <h2>Dropbox</h2>
      {zustand.art === 'pruefen' && <p>Verbindung wird geprüft …</p>}
      {zustand.art === 'arbeitet' && <p>Einen Moment …</p>}

      {zustand.art === 'getrennt' && (
        <>
          <p>
            Dieses Gerät ist nicht verbunden. Die App bekommt nur Zugriff auf ihren eigenen Ordner
            in deiner Dropbox: <strong>{DROPBOX_ORDNER_ANZEIGE}</strong>
          </p>
          <button type="button" className="verbinden-haupt" onClick={verbinden}>
            Mit Dropbox verbinden
          </button>
        </>
      )}

      {zustand.art === 'verbunden' && (
        <>
          <p>Dieses Gerät ist mit Dropbox verbunden.</p>
          <p>
            Ordner: <strong>{DROPBOX_ORDNER_ANZEIGE}</strong>
          </p>
          <div className="verbinden-knoepfe">
            <button type="button" className="verbinden-haupt" onClick={testen}>
              Verbindung testen
            </button>
            <button type="button" onClick={trennen}>
              Trennen
            </button>
          </div>
        </>
      )}

      {'meldung' in zustand && zustand.meldung && (
        <p className="verbinden-ok" role="status">
          {zustand.meldung}
        </p>
      )}
      {'fehler' in zustand && zustand.fehler && (
        <p className="verbinden-fehler" role="alert">
          {zustand.fehler}
        </p>
      )}
    </section>
  );
}
