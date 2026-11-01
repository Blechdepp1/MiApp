import { codeChallenge } from './pkce.ts';
import { DropboxFehler, erstelleDropbox, type Tokens } from './dropbox.ts';
import { tokenSpeicherImArbeitsspeicher } from './tokenSpeicher.ts';
import { dropboxAttrappe } from './dropboxAttrappe.ts';

const REDIRECT = 'https://blechdepp1.github.io/MiApp/';
const STUNDE = 3_600_000;

function aufbau(start = 1_000_000, ordner?: string) {
  const dropboxSeite = dropboxAttrappe();
  const speicher = tokenSpeicherImArbeitsspeicher();
  let uhr = start;
  const dropbox = erstelleDropbox({
    speicher,
    redirectUri: REDIRECT,
    ordner,
    abrufen: dropboxSeite.abrufen as unknown as typeof fetch,
    jetzt: () => uhr,
  });
  return {
    dropbox,
    speicher,
    dropboxSeite,
    vorspulen: (ms: number) => (uhr += ms),
  };
}

async function verbinde(a: ReturnType<typeof aufbau>) {
  const url = new URL(await a.dropbox.anmeldeAdresse());
  const state = url.searchParams.get('state')!;
  await a.dropbox.schliesseAnmeldungAb(`${REDIRECT}?code=abc&state=${state}`);
}

describe('Anmeldung mit PKCE', () => {
  it('baut die Anmelde-Adresse mit Challenge, Offline-Zugriff und Rücksprung', async () => {
    const a = aufbau();
    const url = new URL(await a.dropbox.anmeldeAdresse());
    const anmeldung = (await a.speicher.ladeAnmeldung())!;
    expect(url.origin + url.pathname).toBe('https://www.dropbox.com/oauth2/authorize');
    expect(url.searchParams.get('client_id')).toBe('8wr24zsi7hndkun');
    expect(url.searchParams.get('token_access_type')).toBe('offline');
    expect(url.searchParams.get('redirect_uri')).toBe(REDIRECT);
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(url.searchParams.get('code_challenge')).toBe(await codeChallenge(anmeldung.verifier));
    expect(url.searchParams.get('state')).toBe(anmeldung.state);
  });

  it('tauscht den Code gegen Tokens und schickt dabei den Verifier mit', async () => {
    const a = aufbau();
    await verbinde(a);
    expect(await a.dropbox.verbunden()).toBe(true);
    const tokenAufruf = new URLSearchParams(String(a.dropboxSeite.aufrufe.at(-1)!.init.body));
    expect(tokenAufruf.get('grant_type')).toBe('authorization_code');
    expect(tokenAufruf.get('code_verifier')).toBeTruthy();
    expect(tokenAufruf.get('client_id')).toBe('8wr24zsi7hndkun');
    expect(tokenAufruf.has('client_secret')).toBe(false);
    expect(await a.speicher.ladeAnmeldung()).toBeUndefined();
  });

  it('lehnt einen fremden state ab', async () => {
    const a = aufbau();
    await a.dropbox.anmeldeAdresse();
    await expect(
      a.dropbox.schliesseAnmeldungAb(`${REDIRECT}?code=abc&state=falsch`),
    ).rejects.toThrow(DropboxFehler);
    expect(await a.dropbox.verbunden()).toBe(false);
  });

  it('meldet, wenn der Zugriff abgelehnt wurde', async () => {
    const a = aufbau();
    await expect(
      a.dropbox.schliesseAnmeldungAb(`${REDIRECT}?error=access_denied&state=x`),
    ).rejects.toThrow('nicht erlaubt');
  });

  it('ignoriert eine normale Adresse ohne Code', async () => {
    const a = aufbau();
    expect(await a.dropbox.schliesseAnmeldungAb(`${REDIRECT}#/einstellungen`)).toBe(false);
  });
});

describe('Dateien', () => {
  it('schreibt und liest eine Datei, auch mit Umlauten im Pfad', async () => {
    const a = aufbau();
    await verbinde(a);
    await a.dropbox.hochladen('/test/Prüfung.json', '{"grüße":"hallo"}');
    expect(await a.dropbox.herunterladen('/test/Prüfung.json')).toBe('{"grüße":"hallo"}');
    const header = a.dropboxSeite.aufrufe.at(-1)!.init.headers as Record<string, string>;
    expect(header['Dropbox-API-Arg']).toBe('{"path":"/test/Pr\\u00fcfung.json"}');
  });

  it('liefert undefined für eine fehlende Datei', async () => {
    const a = aufbau();
    await verbinde(a);
    expect(await a.dropbox.herunterladen('/gibts-nicht.json')).toBeUndefined();
  });

  it('wirft ohne Verbindung einen verständlichen Fehler', async () => {
    const a = aufbau();
    await expect(a.dropbox.hochladen('/x.json', '{}')).rejects.toThrow(
      'Nicht mit Dropbox verbunden',
    );
  });
});

describe('liste', () => {
  it('listet alle Dateien eines Ordners über mehrere Seiten', async () => {
    const a = aufbau();
    await verbinde(a);
    for (const name of ['a', 'b', 'c', 'd', 'e'])
      await a.dropbox.hochladen(`/ordner/${name}.jsonl`, name);
    await a.dropbox.hochladen('/anderer/x.json', 'x');
    const dateien = await a.dropbox.liste('/ordner');
    expect(dateien.map((d) => d.name)).toEqual([
      'a.jsonl',
      'b.jsonl',
      'c.jsonl',
      'd.jsonl',
      'e.jsonl',
    ]);
    expect(dateien[0]).toMatchObject({ pfad: '/ordner/a.jsonl', rev: expect.any(String) });
    expect(a.dropboxSeite.aufrufe.filter((x) => x.url.endsWith('/continue'))).toHaveLength(2);
  });

  it('liefert eine leere Liste, wenn es den Ordner nicht gibt', async () => {
    const a = aufbau();
    await verbinde(a);
    expect(await a.dropbox.liste('/gibts-nicht')).toEqual([]);
  });

  it('legt im Testkanal alles in einen eigenen Unterordner', async () => {
    const a = aufbau(1_000_000, '/vorschau');
    await verbinde(a);
    await a.dropbox.hochladen('/ordner/a.jsonl', 'a');
    expect([...a.dropboxSeite.dateien.keys()]).toEqual(['/vorschau/ordner/a.jsonl']);
    expect(await a.dropbox.herunterladen('/ordner/a.jsonl')).toBe('a');
    expect(await a.dropbox.liste('/ordner')).toEqual([
      { name: 'a.jsonl', pfad: '/ordner/a.jsonl', rev: expect.any(String) },
    ]);
  });

  it('meldet andere Fehler', async () => {
    const a = aufbau();
    await verbinde(a);
    a.dropboxSeite.abrufen.mockResolvedValueOnce(new Response('kaputt', { status: 500 }));
    await expect(a.dropbox.liste('/ordner')).rejects.toThrow('Ordner lesen fehlgeschlagen');
  });
});

describe('Token-Erneuerung', () => {
  it('erneuert den Access-Token nach Ablauf ohne neue Anmeldung', async () => {
    const a = aufbau();
    await verbinde(a);
    a.vorspulen(24 * STUNDE);
    await a.dropbox.hochladen('/a.json', '1');
    const urls = a.dropboxSeite.aufrufe.map((x) => x.url);
    expect(urls.at(-2)).toMatch(/oauth2\/token$/);
    expect(a.dropboxSeite.dateien.get('/a.json')?.inhalt).toBe('1');
    const tokens = (await a.speicher.ladeTokens()) as Tokens;
    expect(tokens.refreshToken).toBe('refresh-1');
    expect(tokens.ablauf).toBeGreaterThan(1_000_000 + 24 * STUNDE);
  });

  it('nutzt einen noch gültigen Token ohne Erneuerung', async () => {
    const a = aufbau();
    await verbinde(a);
    const vorher = a.dropboxSeite.aufrufe.length;
    a.vorspulen(STUNDE);
    await a.dropbox.hochladen('/a.json', '1');
    expect(a.dropboxSeite.aufrufe.length).toBe(vorher + 1);
  });

  it('erneuert und wiederholt einmal, wenn Dropbox 401 meldet', async () => {
    const a = aufbau();
    await verbinde(a);
    a.dropboxSeite.widerrufeToken();
    await a.dropbox.hochladen('/a.json', '2');
    expect(a.dropboxSeite.dateien.get('/a.json')?.inhalt).toBe('2');
  });
});

describe('trennen', () => {
  it('widerruft den Token und vergisst ihn lokal', async () => {
    const a = aufbau();
    await verbinde(a);
    await a.dropbox.trennen();
    expect(a.dropboxSeite.aufrufe.at(-1)!.url).toMatch(/auth\/token\/revoke$/);
    expect(await a.dropbox.verbunden()).toBe(false);
  });

  it('trennt lokal auch ohne Netz', async () => {
    const a = aufbau();
    await verbinde(a);
    a.dropboxSeite.abrufen.mockRejectedValue(new TypeError('offline'));
    await a.dropbox.trennen();
    expect(await a.dropbox.verbunden()).toBe(false);
  });
});
