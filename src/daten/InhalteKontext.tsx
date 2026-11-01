import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { INHALTE, type InhaltDaten, type InhaltName } from '../belohnung/inhalte.ts';
import { dexieInhalte, type InhalteSpeicher } from './inhalte.ts';

const Kontext = createContext<InhalteSpeicher>(dexieInhalte);

export function InhalteProvider({
  speicher,
  children,
}: {
  speicher: InhalteSpeicher;
  children: ReactNode;
}) {
  return <Kontext.Provider value={speicher}>{children}</Kontext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useInhalteSpeicher(): InhalteSpeicher {
  return useContext(Kontext);
}

// Aktueller Inhalt mit Startwert, solange nichts gespeichert ist; aktualisiert sich nach Abgleich
// eslint-disable-next-line react-refresh/only-export-components
export function useInhalt<N extends InhaltName>(
  name: N,
): [InhaltDaten[N], (daten: InhaltDaten[N]) => Promise<void>] {
  const speicher = useInhalteSpeicher();
  const [daten, setDaten] = useState<InhaltDaten[N]>(INHALTE[name].start as InhaltDaten[N]);

  useEffect(() => {
    let aktiv = true;
    const laden = () =>
      speicher
        .lade(name)
        .then((e) => {
          if (aktiv && e) setDaten(e.daten);
        })
        .catch(() => {
          // Nicht lesbar (z. B. privater Modus): bei den Startwerten bleiben
        });
    laden();
    const abmelden = speicher.beobachte(laden);
    return () => {
      aktiv = false;
      abmelden();
    };
  }, [speicher, name]);

  const speichern = useCallback(
    (neu: InhaltDaten[N]) =>
      speicher.speichere({ name, daten: neu, geaendert: new Date().toISOString() }),
    [speicher, name],
  );

  return [daten, speichern];
}
