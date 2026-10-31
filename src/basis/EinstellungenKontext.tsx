import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  bereinige,
  STANDARD,
  type Einstellungen,
  type EinstellungsSpeicher,
} from './einstellungen.ts';
import { wendeThemaAn } from './thema.ts';

type Wert = {
  einstellungen: Einstellungen;
  aendern: (aenderung: Partial<Einstellungen>) => void;
};

// Ohne Provider (z. B. in einzelnen Komponententests) gelten die Standardwerte
const Kontext = createContext<Wert>({ einstellungen: STANDARD, aendern: () => {} });

export function EinstellungenProvider({
  speicher,
  children,
}: {
  speicher: EinstellungsSpeicher;
  children: ReactNode;
}) {
  const [einstellungen, setEinstellungen] = useState<Einstellungen>(STANDARD);
  // Hat das Kind schon etwas geändert, darf das (spätere) Laden das nicht überschreiben
  const geaendert = useRef(false);

  useEffect(() => {
    let aktiv = true;
    speicher
      .laden()
      .then((gespeichert) => {
        if (aktiv && !geaendert.current) setEinstellungen(bereinige(gespeichert));
      })
      .catch(() => {
        // Speicher nicht lesbar (z. B. privater Modus): mit Standardwerten weitermachen
      });
    return () => {
      aktiv = false;
    };
  }, [speicher]);

  useEffect(() => {
    wendeThemaAn(einstellungen);
    if (geaendert.current) speicher.speichern(einstellungen).catch(() => {});
  }, [einstellungen, speicher]);

  function aendern(aenderung: Partial<Einstellungen>) {
    geaendert.current = true;
    setEinstellungen((alt) => ({ ...alt, ...aenderung }));
  }

  return <Kontext.Provider value={{ einstellungen, aendern }}>{children}</Kontext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useEinstellungen(): Wert {
  return useContext(Kontext);
}
