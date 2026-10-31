import { db } from './db.ts';

// Ein einzelner, gerätegebundener Wert (wird nicht synchronisiert)
export type GespeicherterWert<T> = {
  laden(): Promise<T | undefined>;
  speichern(wert: T): Promise<void>;
};

export function dexieWert<T>(id: string): GespeicherterWert<T> {
  return {
    laden: async () => (await db.schluessel.get(id))?.wert as T | undefined,
    speichern: async (wert) => {
      await db.schluessel.put({ id, wert });
    },
  };
}

export function wertImArbeitsspeicher<T>(start?: T): GespeicherterWert<T> {
  let wert = start;
  return {
    laden: async () => wert,
    speichern: async (neu) => {
      wert = neu;
    },
  };
}
