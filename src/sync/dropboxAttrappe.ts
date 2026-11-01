// Nachgebautes Dropbox für Tests: Tokens, Dateien im App-Ordner, Ordnerlisten mit Seiten
import { erstelleDropbox } from './dropbox.ts';
import { tokenSpeicherImArbeitsspeicher } from './tokenSpeicher.ts';

type Aufruf = { url: string; init: RequestInit };

export function dropboxAttrappe({ eintraegeProSeite = 2 } = {}) {
  const aufrufe: Aufruf[] = [];
  const dateien = new Map<string, { inhalt: string; rev: string }>();
  let gueltigerToken = 'access-1';
  let tokenZaehler = 1;
  let revZaehler = 0;
  let offline = false;
  // Offene Longpoll-Anfragen, die bei der nächsten Änderung antworten
  const wartende = new Set<() => void>();
  const geaendert = () => {
    for (const antworte of wartende) antworte();
    wartende.clear();
  };

  const abrufen = vi.fn(async (eingabe: RequestInfo | URL, init: RequestInit = {}) => {
    if (offline) throw new TypeError('Failed to fetch');
    const url = String(eingabe);
    aufrufe.push({ url, init });
    const header = (init.headers ?? {}) as Record<string, string>;

    if (url.endsWith('/oauth2/token')) {
      const felder = new URLSearchParams(String(init.body));
      if (
        felder.get('grant_type') === 'refresh_token' &&
        felder.get('refresh_token') !== 'refresh-1'
      ) {
        return new Response('{"error":"invalid_grant"}', { status: 400 });
      }
      gueltigerToken = `access-${++tokenZaehler}`;
      return Response.json({
        access_token: gueltigerToken,
        expires_in: 14400,
        ...(felder.get('grant_type') === 'authorization_code' && { refresh_token: 'refresh-1' }),
      });
    }

    if (url.endsWith('/files/list_folder/longpoll')) {
      // Wie bei Dropbox: Ist die Marke schon veraltet, kommt die Antwort sofort
      const { cursor } = JSON.parse(String(init.body)) as { cursor: string };
      if (cursor !== `stand-${revZaehler}`) return Response.json({ changes: true });
      return new Promise<Response>((antworte, abbrechen) => {
        const fertig = () => antworte(Response.json({ changes: true }));
        wartende.add(fertig);
        init.signal?.addEventListener('abort', () => {
          wartende.delete(fertig);
          abbrechen(new DOMException('abgebrochen', 'AbortError'));
        });
      });
    }

    if (header.Authorization !== `Bearer ${gueltigerToken}`) {
      return new Response('{"error":"expired_access_token"}', { status: 401 });
    }
    const arg = JSON.parse(header['Dropbox-API-Arg'] ?? '{}') as { path?: string };
    if (url.endsWith('/files/upload')) {
      const inhalt = new TextDecoder().decode(init.body as Uint8Array);
      dateien.set(arg.path!, { inhalt, rev: `rev${++revZaehler}` });
      geaendert();
      return Response.json({ path_display: arg.path });
    }
    if (url.endsWith('/files/download')) {
      const datei = dateien.get(arg.path!);
      return datei === undefined
        ? new Response('{"error":"path/not_found"}', { status: 409 })
        : new Response(datei.inhalt);
    }
    if (url.endsWith('/files/list_folder') || url.endsWith('/files/list_folder/continue')) {
      const koerper = JSON.parse(String(init.body)) as { path?: string; cursor?: string };
      const [ordner, start] = koerper.cursor
        ? [koerper.cursor.split('|')[0]!, Number(koerper.cursor.split('|')[1])]
        : [koerper.path!, 0];
      const passend = [...dateien.entries()].filter(([pfad]) => pfad.startsWith(`${ordner}/`));
      if (passend.length === 0 && !koerper.cursor) {
        return new Response('{"error":"path/not_found"}', { status: 409 });
      }
      const seite = passend.slice(start, start + eintraegeProSeite);
      return Response.json({
        entries: seite.map(([pfad, d]) => ({
          '.tag': 'file',
          name: pfad.split('/').pop(),
          path_display: pfad,
          rev: d.rev,
        })),
        cursor: `${ordner}|${start + eintraegeProSeite}`,
        has_more: start + eintraegeProSeite < passend.length,
      });
    }
    if (url.endsWith('/files/list_folder/get_latest_cursor')) {
      return Response.json({ cursor: `stand-${revZaehler}` });
    }
    if (url.endsWith('/auth/token/revoke')) return new Response(null);
    return new Response('unbekannt', { status: 404 });
  });

  return {
    aufrufe,
    dateien,
    abrufen,
    widerrufeToken() {
      gueltigerToken = 'neu-und-unbekannt';
    },
    // Wie eine Änderung von einem anderen Gerät: weckt wartende Geräte auf
    legeAb(pfad: string, inhalt: string) {
      dateien.set(pfad, { inhalt, rev: `rev${++revZaehler}` });
      geaendert();
    },
    setzeOffline(wert: boolean) {
      offline = wert;
    },
  };
}

export type DropboxAttrappe = ReturnType<typeof dropboxAttrappe>;

// Ein bereits verbundenes Gerät, das mit der Attrappe spricht
export async function verbundenesDropbox(seite: DropboxAttrappe) {
  const speicher = tokenSpeicherImArbeitsspeicher();
  await speicher.speichereTokens({
    accessToken: 'access-1',
    ablauf: Date.now() + 3_600_000,
    refreshToken: 'refresh-1',
  });
  return erstelleDropbox({
    speicher,
    redirectUri: 'https://blechdepp1.github.io/MiApp/',
    abrufen: seite.abrufen as unknown as typeof fetch,
  });
}
