import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { LernEreignis } from './ereignisse.ts';
import { dexieProtokoll, type Protokoll } from './protokoll.ts';

const Kontext = createContext<Protokoll>(dexieProtokoll);

export function ProtokollProvider({
  protokoll,
  children,
}: {
  protokoll: Protokoll;
  children: ReactNode;
}) {
  return <Kontext.Provider value={protokoll}>{children}</Kontext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useProtokoll(): Protokoll {
  return useContext(Kontext);
}

// Alle Ereignisse, aktualisiert nach jedem neuen Eintrag; undefined, solange noch geladen wird
// eslint-disable-next-line react-refresh/only-export-components
export function useEreignisse(): LernEreignis[] | undefined {
  const protokoll = useProtokoll();
  const [ereignisse, setEreignisse] = useState<LernEreignis[]>();
  useEffect(() => {
    let aktiv = true;
    const laden = () =>
      protokoll
        .alle()
        .then((alle) => {
          if (aktiv) setEreignisse(alle);
        })
        .catch(() => {
          // Speicher nicht lesbar (z. B. privater Modus): als leer behandeln statt hängen zu bleiben
          if (aktiv) setEreignisse([]);
        });
    laden();
    const abmelden = protokoll.beobachte(laden);
    return () => {
      aktiv = false;
      abmelden();
    };
  }, [protokoll]);
  return ereignisse;
}
