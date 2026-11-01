import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useProtokoll } from '../daten/ProtokollKontext.tsx';
import { dexieWert, type GespeicherterWert } from '../daten/schluesselWert.ts';
import { gleicheAb, type AbgleichStand } from './abgleich.ts';
import { DropboxFehler, type Dropbox } from './dropbox.ts';

export type SyncZustand = {
  verbunden: boolean;
  laeuft: boolean;
  zuletzt?: Date;
  fehler?: string;
};

type Wert = SyncZustand & { abgleichen: () => Promise<void> };

const Kontext = createContext<Wert>({
  verbunden: false,
  laeuft: false,
  abgleichen: async () => {},
});

const standardStand = dexieWert<AbgleichStand>('abgleich-stand');

export const INTERVALL_MS = 30_000;
// Kurz warten, damit nach einer Antwort nicht sofort und mehrfach übertragen wird
export const VERZOEGERUNG_MS = 3_000;

// Gleicht automatisch ab: beim Start, nach neuen Ereignissen, wenn das Netz zurückkommt,
// beim Zurückkehren in die App und alle 30 Sekunden, solange sie sichtbar ist
export function SyncProvider({
  dropbox,
  stand = standardStand,
  intervallMs = INTERVALL_MS,
  verzoegerungMs = VERZOEGERUNG_MS,
  children,
}: {
  dropbox: Dropbox;
  stand?: GespeicherterWert<AbgleichStand>;
  intervallMs?: number;
  verzoegerungMs?: number;
  children: ReactNode;
}) {
  const protokoll = useProtokoll();
  const [zustand, setZustand] = useState<SyncZustand>({ verbunden: false, laeuft: false });
  const laeuft = useRef(false);

  const abgleichen = useCallback(async () => {
    if (laeuft.current) return;
    laeuft.current = true;
    try {
      if (!(await dropbox.verbunden())) {
        setZustand({ verbunden: false, laeuft: false });
        return;
      }
      setZustand((z) => ({ ...z, verbunden: true, laeuft: true }));
      await gleicheAb({ dropbox, protokoll, stand });
      setZustand({ verbunden: true, laeuft: false, zuletzt: new Date() });
    } catch (fehler) {
      setZustand((z) => ({
        ...z,
        laeuft: false,
        fehler:
          fehler instanceof DropboxFehler
            ? fehler.message
            : 'Abgleich gerade nicht möglich (kein Internet?). Es wird später erneut versucht.',
      }));
    } finally {
      laeuft.current = false;
    }
  }, [dropbox, protokoll, stand]);

  useEffect(() => {
    let verzoegert: ReturnType<typeof setTimeout> | undefined;
    const spaeter = () => {
      clearTimeout(verzoegert);
      verzoegert = setTimeout(abgleichen, verzoegerungMs);
    };
    const wennSichtbar = () => {
      if (document.visibilityState === 'visible') abgleichen();
    };

    abgleichen();
    const abmelden = protokoll.beobachte(spaeter);
    const intervall = setInterval(wennSichtbar, intervallMs);
    window.addEventListener('online', abgleichen);
    document.addEventListener('visibilitychange', wennSichtbar);
    return () => {
      clearTimeout(verzoegert);
      abmelden();
      clearInterval(intervall);
      window.removeEventListener('online', abgleichen);
      document.removeEventListener('visibilitychange', wennSichtbar);
    };
  }, [abgleichen, protokoll, intervallMs, verzoegerungMs]);

  return <Kontext.Provider value={{ ...zustand, abgleichen }}>{children}</Kontext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSync(): Wert {
  return useContext(Kontext);
}
