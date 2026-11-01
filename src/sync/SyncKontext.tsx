import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useInhalteSpeicher } from '../daten/InhalteKontext.tsx';
import { useProtokoll } from '../daten/ProtokollKontext.tsx';
import { useGeraet } from '../eltern/GeraetKontext.tsx';
import { useLektionenSpeicher } from '../lektionen/LektionenKontext.tsx';
import { gleicheInhalteAb, type InhalteStand } from './inhalteAbgleich.ts';
import { gleicheLektionenAb, type LektionenStand } from './lektionenAbgleich.ts';
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
const standardInhalteStand = dexieWert<InhalteStand>('inhalte-stand');
const standardLektionenStand = dexieWert<LektionenStand>('lektionen-stand');

export const INTERVALL_MS = 30_000;
// Nach einem Fehler beim Warten auf Änderungen (z. B. kein Netz) erst so viel später wieder lauschen
export const LAUSCH_PAUSE_MS = 30_000;
// Kurz warten, damit nach einer Antwort nicht sofort und mehrfach übertragen wird
export const VERZOEGERUNG_MS = 3_000;

// Gleicht automatisch ab: beim Start, nach neuen Ereignissen, wenn das Netz zurückkommt,
// beim Zurückkehren in die App und alle 30 Sekunden, solange sie sichtbar ist. Außerdem lauscht die
// sichtbare App bei Dropbox auf Änderungen anderer Geräte und gleicht dann sofort ab (fast wie Push).
// Beim Verlassen der App wird ein noch ausstehender Abgleich sofort erledigt.
export function SyncProvider({
  dropbox,
  stand = standardStand,
  inhalteStand = standardInhalteStand,
  lektionenStand = standardLektionenStand,
  intervallMs = INTERVALL_MS,
  verzoegerungMs = VERZOEGERUNG_MS,
  lauschPauseMs = LAUSCH_PAUSE_MS,
  children,
}: {
  dropbox: Dropbox;
  stand?: GespeicherterWert<AbgleichStand>;
  inhalteStand?: GespeicherterWert<InhalteStand>;
  lektionenStand?: GespeicherterWert<LektionenStand>;
  intervallMs?: number;
  verzoegerungMs?: number;
  lauschPauseMs?: number;
  children: ReactNode;
}) {
  const protokoll = useProtokoll();
  const inhalte = useInhalteSpeicher();
  const lektionen = useLektionenSpeicher();
  // Nur Eltern-Geräte dürfen Inhalte schreiben
  const darfInhalteSchreiben = useGeraet().geraet?.rolle === 'eltern';
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
      await gleicheInhalteAb({
        dropbox,
        inhalte,
        darfSchreiben: darfInhalteSchreiben,
        stand: inhalteStand,
      });
      await gleicheLektionenAb({
        dropbox,
        lektionen,
        darfSchreiben: darfInhalteSchreiben,
        stand: lektionenStand,
      });
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
  }, [
    dropbox,
    protokoll,
    stand,
    inhalte,
    darfInhalteSchreiben,
    inhalteStand,
    lektionen,
    lektionenStand,
  ]);

  useEffect(() => {
    let verzoegert: ReturnType<typeof setTimeout> | undefined;
    const spaeter = () => {
      clearTimeout(verzoegert);
      verzoegert = setTimeout(() => {
        verzoegert = undefined;
        abgleichen();
      }, verzoegerungMs);
    };
    const wennSichtbar = () => {
      if (document.visibilityState === 'visible') abgleichen();
      else if (verzoegert !== undefined) {
        // Im Hintergrund laufen Zeitgeber oft nicht weiter: Änderungen gleich hochladen
        clearTimeout(verzoegert);
        verzoegert = undefined;
        abgleichen();
      }
    };

    abgleichen();
    const abmelden = protokoll.beobachte(spaeter);
    const abmeldenInhalte = inhalte.beobachte(spaeter);
    const abmeldenLektionen = lektionen.beobachte(spaeter);
    const intervall = setInterval(wennSichtbar, intervallMs);
    window.addEventListener('online', abgleichen);
    document.addEventListener('visibilitychange', wennSichtbar);
    return () => {
      clearTimeout(verzoegert);
      abmelden();
      abmeldenInhalte();
      abmeldenLektionen();
      clearInterval(intervall);
      window.removeEventListener('online', abgleichen);
      document.removeEventListener('visibilitychange', wennSichtbar);
    };
  }, [abgleichen, protokoll, inhalte, lektionen, intervallMs, verzoegerungMs]);

  // Lauschen auf Änderungen anderer Geräte, solange die App sichtbar und verbunden ist
  const verbunden = zustand.verbunden;
  useEffect(() => {
    if (!verbunden) return;
    let steuerung: AbortController | undefined;

    async function lauschen(signal: AbortSignal) {
      const pause = (ms: number) =>
        new Promise<void>((weiter) => {
          const zeit = setTimeout(weiter, ms);
          signal.addEventListener('abort', () => {
            clearTimeout(zeit);
            weiter();
          });
        });
      let marke: string | undefined;
      while (!signal.aborted) {
        try {
          marke ??= await dropbox.aenderungsMarke();
          const { geaendert, pauseSekunden } = await dropbox.warteAufAenderung(marke, { signal });
          if (geaendert) {
            // Neue Marke vor dem Abgleich holen, damit keine Änderung dazwischen verloren geht
            marke = await dropbox.aenderungsMarke();
            await abgleichen();
          }
          if (pauseSekunden > 0) await pause(pauseSekunden * 1000);
        } catch {
          marke = undefined;
          await pause(lauschPauseMs);
        }
      }
    }

    const starten = () => {
      steuerung?.abort();
      steuerung = undefined;
      if (document.visibilityState !== 'visible') return;
      steuerung = new AbortController();
      void lauschen(steuerung.signal);
    };
    starten();
    document.addEventListener('visibilitychange', starten);
    return () => {
      steuerung?.abort();
      document.removeEventListener('visibilitychange', starten);
    };
  }, [verbunden, dropbox, abgleichen, lauschPauseMs]);

  return <Kontext.Provider value={{ ...zustand, abgleichen }}>{children}</Kontext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSync(): Wert {
  return useContext(Kontext);
}
