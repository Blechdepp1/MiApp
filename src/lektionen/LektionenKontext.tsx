import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Lektion } from './lektion.ts';
import { dexieLektionen, type LektionenSpeicher } from './speicher.ts';

const Kontext = createContext<LektionenSpeicher>(dexieLektionen);

export function LektionenProvider({
  speicher,
  children,
}: {
  speicher: LektionenSpeicher;
  children: ReactNode;
}) {
  return <Kontext.Provider value={speicher}>{children}</Kontext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLektionenSpeicher(): LektionenSpeicher {
  return useContext(Kontext);
}

// Alle nicht gelöschten Lektionen, neueste zuerst; undefined, solange geladen wird
// eslint-disable-next-line react-refresh/only-export-components
export function useLektionen(): Lektion[] | undefined {
  const speicher = useLektionenSpeicher();
  const [lektionen, setLektionen] = useState<Lektion[]>();
  useEffect(() => {
    let aktiv = true;
    const laden = () =>
      speicher
        .alle()
        .then((alle) => {
          if (!aktiv) return;
          setLektionen(
            alle.filter((l) => !l.geloescht).sort((a, b) => b.erstellt.localeCompare(a.erstellt)),
          );
        })
        .catch(() => {
          if (aktiv) setLektionen([]);
        });
    laden();
    const abmelden = speicher.beobachte(laden);
    return () => {
      aktiv = false;
      abmelden();
    };
  }, [speicher]);
  return lektionen;
}
