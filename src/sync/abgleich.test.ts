import { gesamtPunkte } from '../belohnung/logik.ts';
import { erstelleEreignis } from '../daten/ereignisse.ts';
import { protokollImArbeitsspeicher } from '../daten/protokoll.ts';
import { wertImArbeitsspeicher } from '../daten/schluesselWert.ts';
import { ausJsonl, eigeneDatei, gleicheAb, zuJsonl, type AbgleichStand } from './abgleich.ts';
import { dropboxAttrappe, verbundenesDropbox, type DropboxAttrappe } from './dropboxAttrappe.ts';

const RUNDE = { typ: 'runde-beendet', richtig: 5, mitHilfe: 0, verbessert: 0 } as const;

// Ein Gerät mit eigenem Protokoll und eigener Dropbox-Verbindung zum gemeinsamen App-Ordner
async function geraet(id: string, seite: DropboxAttrappe) {
  const protokoll = protokollImArbeitsspeicher([], id);
  const stand = wertImArbeitsspeicher<AbgleichStand>();
  const dropbox = await verbundenesDropbox(seite);
  return { protokoll, stand, abgleichen: () => gleicheAb({ dropbox, protokoll, stand }) };
}

describe('JSONL', () => {
  it('schreibt und liest Ereignisse verlustfrei', () => {
    const e = [
      erstelleEreignis(RUNDE, 'kind'),
      erstelleEreignis({ typ: 'eingeloest', belohnungId: 'kino', preis: 1300 }, 'kind'),
    ];
    expect(ausJsonl(zuJsonl(e))).toEqual(e);
    expect(zuJsonl([])).toBe('');
  });

  it('überspringt kaputte und unbekannte Zeilen', () => {
    const gut = erstelleEreignis(RUNDE, 'kind');
    const text = [
      JSON.stringify(gut),
      '{kaputt',
      JSON.stringify({ ...gut, id: 'x', typ: 'unbekannt' }),
      JSON.stringify({ ...gut, id: 'y', zeit: 'gestern' }),
      JSON.stringify({ id: 'z' }),
      '42',
      '',
    ].join('\n');
    expect(ausJsonl(text)).toEqual([gut]);
  });
});

describe('gleicheAb', () => {
  it('lädt die eigenen Ereignisse in die eigene Datei hoch', async () => {
    const seite = dropboxAttrappe();
    const kind = await geraet('kind-1', seite);
    await kind.protokoll.hinzufuegen(RUNDE);
    expect(await kind.abgleichen()).toEqual({ neu: 0, hochgeladen: true });
    const datei = seite.dateien.get(eigeneDatei('kind-1'))!;
    expect(ausJsonl(datei.inhalt)).toHaveLength(1);
  });

  it('bringt zwei Geräte auf denselben Stand, ohne Doppeltes', async () => {
    const seite = dropboxAttrappe();
    const kind = await geraet('kind-1', seite);
    const eltern = await geraet('eltern-1', seite);
    await kind.protokoll.hinzufuegen(RUNDE);
    await kind.protokoll.hinzufuegen(RUNDE);
    await eltern.protokoll.hinzufuegen({ typ: 'bestaetigt', einloesungId: 'e1' });

    await kind.abgleichen();
    await eltern.abgleichen();
    await kind.abgleichen();
    // Mehrfaches Abgleichen ändert nichts mehr
    await eltern.abgleichen();
    await kind.abgleichen();

    const k = await kind.protokoll.alle();
    const e = await eltern.protokoll.alle();
    expect(k.map((x) => x.id).sort()).toEqual(e.map((x) => x.id).sort());
    expect(k).toHaveLength(3);
    expect(gesamtPunkte(k)).toBe(gesamtPunkte(e));
  });

  it('holt beim Offline-Üben Verpasstes später nach', async () => {
    const seite = dropboxAttrappe();
    const kind = await geraet('kind-1', seite);
    const eltern = await geraet('eltern-1', seite);

    seite.setzeOffline(true);
    await kind.protokoll.hinzufuegen(RUNDE);
    await expect(kind.abgleichen()).rejects.toThrow();
    await kind.protokoll.hinzufuegen(RUNDE);

    seite.setzeOffline(false);
    await kind.abgleichen();
    await eltern.abgleichen();
    expect(await eltern.protokoll.alle()).toHaveLength(2);
  });

  it('lädt nichts erneut herunter oder hoch, wenn sich nichts geändert hat', async () => {
    const seite = dropboxAttrappe();
    const kind = await geraet('kind-1', seite);
    const eltern = await geraet('eltern-1', seite);
    await kind.protokoll.hinzufuegen(RUNDE);
    await kind.abgleichen();
    await eltern.abgleichen();

    const vorher = seite.aufrufe.length;
    expect(await eltern.abgleichen()).toEqual({ neu: 0, hochgeladen: false });
    const danach = seite.aufrufe.slice(vorher).map((a) => a.url.split('/2/')[1]);
    expect(danach).toEqual(['files/list_folder']);
  });

  it('lädt die eigene Datei neu hoch, wenn sie in Dropbox fehlt', async () => {
    const seite = dropboxAttrappe();
    const kind = await geraet('kind-1', seite);
    await kind.protokoll.hinzufuegen(RUNDE);
    await kind.abgleichen();
    seite.dateien.delete(eigeneDatei('kind-1'));
    expect((await kind.abgleichen()).hochgeladen).toBe(true);
    expect(seite.dateien.has(eigeneDatei('kind-1'))).toBe(true);
  });

  it('übernimmt nach dem Zurücksetzen eines Geräts die alten Punkte wieder', async () => {
    const seite = dropboxAttrappe();
    const altesKind = await geraet('kind-alt', seite);
    await altesKind.protokoll.hinzufuegen(RUNDE);
    await altesKind.abgleichen();

    // App-Daten gelöscht: neues Gerät mit neuer id
    const neuesKind = await geraet('kind-neu', seite);
    expect((await neuesKind.abgleichen()).neu).toBe(1);
    expect(gesamtPunkte(await neuesKind.protokoll.alle())).toBe(20);
  });

  it('kommt mit einem leeren App-Ordner zurecht', async () => {
    const seite = dropboxAttrappe();
    const kind = await geraet('kind-1', seite);
    expect(await kind.abgleichen()).toEqual({ neu: 0, hochgeladen: true });
  });
});
