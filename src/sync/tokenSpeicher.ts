import { db } from '../daten/db.ts';
import type { Anmeldung, Tokens, TokenSpeicher } from './dropbox.ts';

const TOKENS = 'dropbox-tokens';
const ANMELDUNG = 'dropbox-anmeldung';

async function lade<T>(id: string): Promise<T | undefined> {
  return (await db.schluessel.get(id))?.wert as T | undefined;
}

export const dexieTokenSpeicher: TokenSpeicher = {
  ladeTokens: () => lade<Tokens>(TOKENS),
  speichereTokens: async (tokens) => {
    // Nach erfolgreicher Anmeldung wird der Verifier nicht mehr gebraucht
    await db.transaction('rw', db.schluessel, async () => {
      await db.schluessel.put({ id: TOKENS, wert: tokens });
      await db.schluessel.delete(ANMELDUNG);
    });
  },
  ladeAnmeldung: () => lade<Anmeldung>(ANMELDUNG),
  speichereAnmeldung: async (anmeldung) => {
    await db.schluessel.put({ id: ANMELDUNG, wert: anmeldung });
  },
  vergiss: async () => {
    await db.schluessel.bulkDelete([TOKENS, ANMELDUNG]);
  },
};

export function tokenSpeicherImArbeitsspeicher(): TokenSpeicher {
  let tokens: Tokens | undefined;
  let anmeldung: Anmeldung | undefined;
  return {
    ladeTokens: async () => tokens,
    speichereTokens: async (t) => {
      tokens = t;
      anmeldung = undefined;
    },
    ladeAnmeldung: async () => anmeldung,
    speichereAnmeldung: async (a) => {
      anmeldung = a;
    },
    vergiss: async () => {
      tokens = undefined;
      anmeldung = undefined;
    },
  };
}
