import { codeChallenge, zufallsText } from './pkce.ts';

// App key der Dropbox-App „MiApp“ (öffentlich, kein Geheimnis; Zugriff nur auf Apps/<App-Name>)
export const APP_KEY = '8wr24zsi7hndkun';

const AUTORISIEREN = 'https://www.dropbox.com/oauth2/authorize';
const TOKEN = 'https://api.dropboxapi.com/oauth2/token';
const API = 'https://api.dropboxapi.com/2';
const INHALT = 'https://content.dropboxapi.com/2';

// Token erst kurz vor Ablauf erneuern, aber nie auf den letzten Drücker
const PUFFER_MS = 60_000;

export type Tokens = { accessToken: string; ablauf: number; refreshToken: string };
export type DropboxDatei = { name: string; pfad: string; rev: string };

type ListFolderAntwort = {
  entries: { '.tag': string; name: string; path_display: string; rev: string }[];
  cursor: string;
  has_more: boolean;
};
export type Anmeldung = { verifier: string; state: string };

export type TokenSpeicher = {
  ladeTokens(): Promise<Tokens | undefined>;
  speichereTokens(tokens: Tokens): Promise<void>;
  ladeAnmeldung(): Promise<Anmeldung | undefined>;
  speichereAnmeldung(anmeldung: Anmeldung): Promise<void>;
  vergiss(): Promise<void>;
};

export class DropboxFehler extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

type Optionen = {
  speicher: TokenSpeicher;
  redirectUri: string;
  // Unterordner im App-Ordner, z. B. „/vorschau“ für den Testkanal; Pfade bleiben für Aufrufer gleich
  ordner?: string;
  appKey?: string;
  abrufen?: typeof fetch;
  jetzt?: () => number;
};

// Dropbox verlangt im Header Dropbox-API-Arg reines ASCII
function headerJson(wert: unknown): string {
  return JSON.stringify(wert).replace(
    /[\u007f-￿]/g,
    (z) => '\\u' + z.charCodeAt(0).toString(16).padStart(4, '0'),
  );
}

export function erstelleDropbox({
  speicher,
  redirectUri,
  ordner = '',
  appKey = APP_KEY,
  abrufen = (...args) => fetch(...args),
  jetzt = Date.now,
}: Optionen) {
  async function tokenAnfrage(felder: Record<string, string>): Promise<{
    access_token: string;
    expires_in: number;
    refresh_token?: string;
  }> {
    const antwort = await abrufen(TOKEN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: appKey, ...felder }),
    });
    if (!antwort.ok)
      throw new DropboxFehler('Anmeldung bei Dropbox fehlgeschlagen', antwort.status);
    return antwort.json();
  }

  async function erneuern(tokens: Tokens): Promise<Tokens> {
    const neu = await tokenAnfrage({
      grant_type: 'refresh_token',
      refresh_token: tokens.refreshToken,
    });
    const erneuert = {
      accessToken: neu.access_token,
      ablauf: jetzt() + neu.expires_in * 1000,
      refreshToken: tokens.refreshToken,
    };
    await speicher.speichereTokens(erneuert);
    return erneuert;
  }

  async function gueltigeTokens(erzwingen = false): Promise<Tokens> {
    const tokens = await speicher.ladeTokens();
    if (!tokens) throw new DropboxFehler('Nicht mit Dropbox verbunden');
    if (!erzwingen && tokens.ablauf - PUFFER_MS > jetzt()) return tokens;
    return erneuern(tokens);
  }

  // Ein abgelaufener oder widerrufener Access-Token wird einmal erneuert und der Aufruf wiederholt
  async function mitAnmeldung(url: string, init: RequestInit): Promise<Response> {
    let tokens = await gueltigeTokens();
    for (let versuch = 0; ; versuch++) {
      const antwort = await abrufen(url, {
        ...init,
        headers: { ...init.headers, Authorization: `Bearer ${tokens.accessToken}` },
      });
      if (antwort.status !== 401 || versuch > 0) return antwort;
      tokens = await gueltigeTokens(true);
    }
  }

  const voll = (pfad: string) => ordner + pfad;
  const relativ = (pfad: string) =>
    ordner && pfad.toLowerCase().startsWith(ordner.toLowerCase() + '/')
      ? pfad.slice(ordner.length)
      : pfad;

  return {
    async verbunden(): Promise<boolean> {
      return (await speicher.ladeTokens()) !== undefined;
    },

    async anmeldeAdresse(): Promise<string> {
      const anmeldung = { verifier: zufallsText(64), state: zufallsText(24) };
      await speicher.speichereAnmeldung(anmeldung);
      const parameter = new URLSearchParams({
        client_id: appKey,
        response_type: 'code',
        code_challenge: await codeChallenge(anmeldung.verifier),
        code_challenge_method: 'S256',
        token_access_type: 'offline',
        redirect_uri: redirectUri,
        state: anmeldung.state,
      });
      return `${AUTORISIEREN}?${parameter}`;
    },

    // Wird beim App-Start mit der aktuellen Adresse aufgerufen; true, wenn eine Anmeldung abgeschlossen wurde
    async schliesseAnmeldungAb(adresse: string): Promise<boolean> {
      const parameter = new URL(adresse).searchParams;
      const code = parameter.get('code');
      const state = parameter.get('state');
      if (parameter.get('error')) throw new DropboxFehler('Dropbox-Zugriff wurde nicht erlaubt');
      if (!code || !state) return false;
      const anmeldung = await speicher.ladeAnmeldung();
      if (!anmeldung || anmeldung.state !== state) {
        throw new DropboxFehler('Anmeldung passt nicht zu dieser App, bitte neu verbinden');
      }
      const antwort = await tokenAnfrage({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        code_verifier: anmeldung.verifier,
      });
      if (!antwort.refresh_token)
        throw new DropboxFehler('Dropbox hat keinen Refresh-Token geliefert');
      await speicher.speichereTokens({
        accessToken: antwort.access_token,
        ablauf: jetzt() + antwort.expires_in * 1000,
        refreshToken: antwort.refresh_token,
      });
      return true;
    },

    async hochladen(pfad: string, inhalt: string): Promise<void> {
      const antwort = await mitAnmeldung(`${INHALT}/files/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'Dropbox-API-Arg': headerJson({ path: voll(pfad), mode: 'overwrite', mute: true }),
        },
        body: new TextEncoder().encode(inhalt),
      });
      if (!antwort.ok) throw new DropboxFehler('Hochladen fehlgeschlagen', antwort.status);
    },

    // undefined, wenn die Datei nicht existiert
    async herunterladen(pfad: string): Promise<string | undefined> {
      const antwort = await mitAnmeldung(`${INHALT}/files/download`, {
        method: 'POST',
        headers: { 'Dropbox-API-Arg': headerJson({ path: voll(pfad) }) },
      });
      if (antwort.status === 409) return undefined;
      if (!antwort.ok) throw new DropboxFehler('Herunterladen fehlgeschlagen', antwort.status);
      return antwort.text();
    },

    // Dateien eines Ordners mit Revision (ändert sich bei jeder neuen Version); leer, wenn es ihn nicht gibt
    async liste(pfad: string): Promise<DropboxDatei[]> {
      const dateien: DropboxDatei[] = [];
      let url = `${API}/files/list_folder`;
      let koerper: object = { path: voll(pfad) };
      for (;;) {
        const antwort = await mitAnmeldung(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(koerper),
        });
        if (antwort.status === 409) return [];
        if (!antwort.ok) throw new DropboxFehler('Ordner lesen fehlgeschlagen', antwort.status);
        const seite = (await antwort.json()) as ListFolderAntwort;
        for (const e of seite.entries) {
          if (e['.tag'] === 'file')
            dateien.push({ name: e.name, pfad: relativ(e.path_display), rev: e.rev });
        }
        if (!seite.has_more) return dateien;
        url = `${API}/files/list_folder/continue`;
        koerper = { cursor: seite.cursor };
      }
    },

    async trennen(): Promise<void> {
      try {
        await mitAnmeldung(`${API}/auth/token/revoke`, { method: 'POST' });
      } catch {
        // Auch ohne Netz lokal trennen
      }
      await speicher.vergiss();
    },
  };
}

export type Dropbox = ReturnType<typeof erstelleDropbox>;
