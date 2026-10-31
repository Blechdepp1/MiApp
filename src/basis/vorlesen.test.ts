import {
  entferneSprachausgabe,
  installiereSprachausgabe,
  stimme,
} from './sprachausgabeAttrappe.ts';
import { ladeStimmen, liestGerade, stimmeFuer, stoppen, vorlesen } from './vorlesen.ts';

afterEach(() => {
  stoppen();
  entferneSprachausgabe();
});

describe('stimmeFuer', () => {
  it('nimmt britisches Englisch vor amerikanischem', () => {
    const us = stimme('en-US');
    const gb = stimme('en-GB');
    expect(stimmeFuer('en', [us, gb])).toBe(gb);
  });

  it('nimmt eine lokale Stimme vor einer Netzwerk-Stimme', () => {
    const netz = stimme('de-DE', 'netz', false);
    const lokal = stimme('de-DE', 'lokal', true);
    expect(stimmeFuer('de', [netz, lokal])).toBe(lokal);
  });

  it('versteht Android-Schreibweise mit Unterstrich', () => {
    const de = stimme('de_DE');
    expect(stimmeFuer('de', [de])).toBe(de);
  });

  it('weicht auf irgendeine Stimme der Sprache aus', () => {
    const ie = stimme('en-IE');
    expect(stimmeFuer('en', [stimme('de-DE'), ie])).toBe(ie);
  });

  it('liefert nichts, wenn die Sprache fehlt', () => {
    expect(stimmeFuer('en', [stimme('de-DE')])).toBeUndefined();
  });
});

describe('ladeStimmen', () => {
  it('wartet auf voiceschanged, wenn die Liste zuerst leer ist', async () => {
    const sprache = installiereSprachausgabe([]);
    const geladen = ladeStimmen();
    sprache.setzeStimmen([stimme('de-DE')]);
    expect(await geladen).toHaveLength(1);
  });

  it('gibt nach der Wartezeit eine leere Liste zurück', async () => {
    installiereSprachausgabe([]);
    expect(await ladeStimmen(10)).toEqual([]);
  });

  it('liefert ohne Sprachausgabe eine leere Liste', async () => {
    expect(await ladeStimmen()).toEqual([]);
  });
});

describe('vorlesen', () => {
  it('spricht mit passender Stimme, Sprache und Tempo', async () => {
    const en = stimme('en-GB');
    const sprache = installiereSprachausgabe([stimme('de-DE'), en]);
    const fertig = vorlesen('house', 'en', { tempo: 0.8 });
    await vi.waitFor(() => expect(sprache.gesprochen).toHaveLength(1));
    const a = sprache.gesprochen[0]!;
    expect(a.text).toBe('house');
    expect(a.voice).toBe(en);
    expect(a.lang).toBe('en-GB');
    expect(a.rate).toBe(0.8);
    sprache.beendeAktuelle();
    expect(await fertig).toBe('fertig');
  });

  it('merkt sich, welcher Knopf gerade vorliest', async () => {
    const sprache = installiereSprachausgabe([stimme('de-DE')]);
    const fertig = vorlesen('Hallo', 'de', { id: 'knopf-1' });
    await vi.waitFor(() => expect(liestGerade()).toBe('knopf-1'));
    sprache.beendeAktuelle();
    await fertig;
    expect(liestGerade()).toBeNull();
  });

  it('bricht eine laufende Ausgabe ab, wenn eine neue startet', async () => {
    const sprache = installiereSprachausgabe([stimme('de-DE')]);
    const erste = vorlesen('eins', 'de', { id: 'a' });
    await vi.waitFor(() => expect(liestGerade()).toBe('a'));
    const zweite = vorlesen('zwei', 'de', { id: 'b' });
    expect(await erste).toBe('abgebrochen');
    await vi.waitFor(() => expect(liestGerade()).toBe('b'));
    sprache.beendeAktuelle();
    expect(await zweite).toBe('fertig');
  });

  it('meldet fehlende Stimme, wenn die Sprache nicht installiert ist', async () => {
    const sprache = installiereSprachausgabe([stimme('de-DE')]);
    expect(await vorlesen('house', 'en')).toBe('keine-stimme');
    expect(sprache.gesprochen).toHaveLength(0);
  });

  it('versucht es trotzdem, wenn das Gerät keine Stimmen meldet', async () => {
    const sprache = installiereSprachausgabe([]);
    const fertig = vorlesen('Hallo', 'de');
    await vi.waitFor(() => expect(sprache.gesprochen).toHaveLength(1), { timeout: 3000 });
    expect(sprache.gesprochen[0]!.lang).toBe('de-DE');
    sprache.beendeAktuelle();
    expect(await fertig).toBe('fertig');
  });

  it('meldet, wenn der Browser kein Vorlesen kann', async () => {
    expect(await vorlesen('Hallo', 'de')).toBe('nicht-verfuegbar');
  });
});
