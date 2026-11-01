import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Geraet, GeraetSpeicher } from './geraet.ts';

type Wert = {
  // undefined: wird geladen; null: noch nicht eingerichtet
  geraet: Geraet | null | undefined;
  einrichten: (geraet: Geraet) => Promise<void>;
};

const Kontext = createContext<Wert>({ geraet: undefined, einrichten: async () => {} });

export function GeraetProvider({
  speicher,
  children,
}: {
  speicher: GeraetSpeicher;
  children: ReactNode;
}) {
  const [geraet, setGeraet] = useState<Geraet | null>();

  useEffect(() => {
    let aktiv = true;
    Promise.all([speicher.rolle.laden(), speicher.pin.laden()]).then(([rolle, pin]) => {
      if (aktiv) setGeraet(rolle && pin ? { rolle, pin } : null);
    });
    return () => {
      aktiv = false;
    };
  }, [speicher]);

  async function einrichten(neu: Geraet) {
    await speicher.pin.speichern(neu.pin);
    await speicher.rolle.speichern(neu.rolle);
    setGeraet(neu);
  }

  return <Kontext.Provider value={{ geraet, einrichten }}>{children}</Kontext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useGeraet(): Wert {
  return useContext(Kontext);
}
