import { useState } from 'react';
import { einloesungen } from '../belohnung/logik.ts';
import { useEreignisse, useProtokoll } from '../daten/ProtokollKontext.tsx';
import { useGeraet } from './GeraetKontext.tsx';

// Eingelöste Belohnungen bestätigen (z. B. wenn der Kinobesuch ausgemacht ist)
export function Einloesungen() {
  const ereignisse = useEreignisse() ?? [];
  const protokoll = useProtokoll();
  const [laeuft, setLaeuft] = useState<string | null>(null);
  // Bestätigen ist Sache der Eltern; auf dem Gerät des Kindes nur ansehen
  const istEltern = useGeraet().geraet?.rolle === 'eltern';
  const alle = einloesungen(ereignisse);
  const offen = alle.filter((e) => !e.bestaetigt);
  const erledigt = alle.filter((e) => e.bestaetigt).slice(0, 5);

  async function bestaetigen(id: string) {
    if (laeuft) return;
    setLaeuft(id);
    try {
      // Nicht doppelt bestätigen, falls inzwischen ein anderes Gerät bestätigt hat
      if (!einloesungen(await protokoll.alle()).find((e) => e.id === id)?.bestaetigt) {
        await protokoll.hinzufuegen({ typ: 'bestaetigt', einloesungId: id });
      }
    } finally {
      setLaeuft(null);
    }
  }

  return (
    <section className="verbinden verwalten">
      <h2>Einlösungen</h2>
      {offen.length === 0 && <p>Gerade wartet nichts auf eure Bestätigung.</p>}
      {offen.length > 0 && !istEltern && (
        <p className="eltern-hinweis">Bestätigen geht nur auf einem Eltern-Gerät.</p>
      )}
      {offen.length > 0 && (
        <ul className="verwalten-liste">
          {offen.map((e) => (
            <li key={e.id}>
              <span aria-hidden="true">{e.symbol ?? '🎁'}</span>
              <span>
                <strong>{e.name ?? 'Belohnung'}</strong> · {e.preis} Punkte ·{' '}
                {new Date(e.zeit).toLocaleDateString('de-DE')}
              </span>
              {istEltern && (
                <button
                  type="button"
                  className="verbinden-haupt"
                  onClick={() => bestaetigen(e.id)}
                  disabled={laeuft !== null}
                >
                  Bestätigen
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {erledigt.length > 0 && (
        <p className="eltern-hinweis">
          Zuletzt bestätigt:{' '}
          {erledigt.map((e) => `${e.symbol ?? ''} ${e.name ?? 'Belohnung'}`).join(', ')}
        </p>
      )}
    </section>
  );
}

// Anzahl offener Einlösungen, z. B. für einen Hinweis auf der Startseite
// eslint-disable-next-line react-refresh/only-export-components
export function useOffeneEinloesungen(): number {
  const ereignisse = useEreignisse() ?? [];
  return einloesungen(ereignisse).filter((e) => !e.bestaetigt).length;
}
