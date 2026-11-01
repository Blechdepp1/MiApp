import Anthropic from '@anthropic-ai/sdk';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { wertImArbeitsspeicher } from '../daten/schluesselWert.ts';
import { LektionenProvider } from '../lektionen/LektionenKontext.tsx';
import { lektionenImArbeitsspeicher, type LektionenSpeicher } from '../lektionen/speicher.ts';
import {
  bereinige,
  erkenneVokabeln,
  FotoImportFehler,
  type Bild,
  type Erkennung,
} from './fotoImport.ts';
import { geraetImArbeitsspeicher, type Rolle } from './geraet.ts';
import { GeraetProvider } from './GeraetKontext.tsx';
import type { KiClientFabrik } from './ki.ts';
import { Lektionen } from './Lektionen.tsx';
import { erzeugePruefwert } from './pin.ts';

const BILD: Bild = { base64: 'abc', medienTyp: 'image/jpeg' };

// Nachgebauter Client: beta.messages.parse liefert die angegebene Antwort oder wirft
function fabrik(antwort: unknown, fehler?: unknown) {
  const anfragen: unknown[] = [];
  const f: KiClientFabrik = async () =>
    ({
      beta: {
        messages: {
          parse: async (anfrage: unknown) => {
            anfragen.push(anfrage);
            if (fehler) throw fehler;
            return antwort;
          },
        },
      },
    }) as unknown as Anthropic;
  return { f, anfragen };
}

describe('erkenneVokabeln', () => {
  it('schickt die Fotos mit Modell, festem Format und Rückfallebene', async () => {
    const { f, anfragen } = fabrik({
      stop_reason: 'end_turn',
      parsed_output: { woerter: [{ en: 'house', de: 'Haus', ergaenzt: false }], hinweis: '' },
    });
    const ergebnis = await erkenneVokabeln('sk-ant-x', [BILD, BILD], f);
    expect(ergebnis.woerter.map((w) => [w.en, w.de])).toEqual([['house', 'Haus']]);
    const anfrage = anfragen[0] as Record<string, unknown> & {
      messages: { content: { type: string }[] }[];
    };
    expect(anfrage).toMatchObject({
      model: 'claude-opus-5-5',
      fallbacks: 'default',
      betas: ['server-side-fallback-2026-07-01'],
      output_config: { format: { type: 'json_schema' } },
    });
    expect(anfrage.messages[0]!.content.filter((c) => c.type === 'image')).toHaveLength(2);
  });

  it('meldet eine Ablehnung', async () => {
    const { f } = fabrik({ stop_reason: 'refusal', parsed_output: null });
    await expect(erkenneVokabeln('k', [BILD], f)).rejects.toMatchObject({ art: 'abgelehnt' });
  });

  it('meldet fehlendes Netz', async () => {
    const { f } = fabrik(null, new Anthropic.APIConnectionError({ message: 'offline' }));
    await expect(erkenneVokabeln('k', [BILD], f)).rejects.toMatchObject({ art: 'kein-netz' });
  });

  it('meldet sonstige API-Fehler', async () => {
    const fehler = Anthropic.APIError.generate(500, { error: {} }, 'x', new Headers());
    const { f } = fabrik(null, fehler);
    await expect(erkenneVokabeln('k', [BILD], f)).rejects.toMatchObject({ art: 'fehler' });
  });
});

describe('bereinige', () => {
  it('entfernt Leeres und Doppeltes und vergibt ids', () => {
    let n = 0;
    const { woerter, hinweis } = bereinige(
      [
        { en: ' house ', de: 'Haus' },
        { en: 'House', de: 'haus' },
        { en: '', de: 'leer' },
        { en: 'dog', de: '  Hund   ' },
      ],
      ' Zeile 3 unleserlich ',
      () => `id${++n}`,
    );
    expect(woerter).toEqual([
      { id: 'id1', en: 'house', de: 'Haus' },
      { id: 'id2', en: 'dog', de: 'Hund' },
    ]);
    expect(hinweis).toBe('Zeile 3 unleserlich');
  });

  it('merkt sich, welche Übersetzungen die KI ergänzt hat', () => {
    let n = 0;
    const { ergaenzt } = bereinige(
      [
        { en: 'began', de: 'anfangen, beginnen', ergaenzt: false },
        { en: 'came', de: 'kommen', ergaenzt: true },
      ],
      '',
      () => `id${++n}`,
    );
    expect(ergaenzt).toEqual(['id2']);
  });

  it('meldet, wenn nichts erkannt wurde', () => {
    expect(() => bereinige([{ en: ' ', de: '' }])).toThrow(FotoImportFehler);
  });
});

describe('Lektionen (Ansicht)', () => {
  const ERKANNT: Erkennung = {
    woerter: [
      { id: 'w1', en: 'house', de: 'Haus' },
      { id: 'w2', en: 'scool', de: 'Schule' },
    ],
    hinweis: 'Ein Wort war schwer zu lesen.',
    ergaenzt: [],
  };

  async function zeige({
    rolle = 'eltern' as Rolle,
    erkenne = vi.fn(async () => ERKANNT),
    schluessel = 'sk-ant-test' as string | undefined,
    lektionen = lektionenImArbeitsspeicher() as LektionenSpeicher,
  } = {}) {
    const leseBild = vi.fn(async () => BILD);
    render(
      <LektionenProvider speicher={lektionen}>
        <GeraetProvider
          speicher={geraetImArbeitsspeicher({ rolle, pin: await erzeugePruefwert('1234') })}
        >
          <Lektionen
            kiSchluessel={wertImArbeitsspeicher(schluessel)}
            erkenne={erkenne}
            leseBild={leseBild}
          />
        </GeraetProvider>
      </LektionenProvider>,
    );
    await screen.findByRole('heading', { name: 'Lektionen' });
    return { lektionen, erkenne, leseBild };
  }

  async function fotoHochladen() {
    const datei = new File(['x'], 'blatt.jpg', { type: 'image/jpeg' });
    await userEvent.upload(screen.getByLabelText('🖼️ Aus Galerie'), datei);
  }

  beforeAll(() => {
    URL.createObjectURL = vi.fn(() => `blob:${Math.random()}`);
    URL.revokeObjectURL = vi.fn();
  });

  it('legt eine Lektion aus Fotos an: auswerten, korrigieren, freigeben', async () => {
    const { lektionen, erkenne } = await zeige();
    await userEvent.click(await screen.findByRole('button', { name: '📷 Neue Lektion aus Fotos' }));
    await userEvent.type(screen.getByLabelText('Titel'), 'Unit 3');
    await fotoHochladen();
    expect(screen.getByAltText('Foto 1')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Fotos auswerten' }));

    expect(await screen.findByText(/2 Wörter erkannt/)).toBeInTheDocument();
    expect(screen.getByText(/Ein Wort war schwer zu lesen/)).toBeInTheDocument();
    expect(erkenne).toHaveBeenCalledWith('sk-ant-test', [BILD]);

    // Tippfehler der Erkennung korrigieren und ein Wort ergänzen
    const zwei = screen.getByLabelText('Englisch 2');
    await userEvent.clear(zwei);
    await userEvent.type(zwei, 'school');
    await userEvent.click(screen.getByRole('button', { name: '+ Wort' }));
    await userEvent.type(screen.getByLabelText('Englisch 3'), 'teacher');
    await userEvent.type(screen.getByLabelText('Deutsch 3'), 'Lehrer');
    await userEvent.click(screen.getByRole('button', { name: 'Freigeben' }));

    expect(await screen.findByText('Unit 3')).toBeInTheDocument();
    const [gespeichert] = await lektionen.alle();
    expect(gespeichert).toMatchObject({ fach: 'englisch', titel: 'Unit 3' });
    expect(gespeichert!.inhalt).toMatchObject({
      art: 'vokabeln',
      woerter: [
        { en: 'house', de: 'Haus' },
        { en: 'school', de: 'Schule' },
        { en: 'teacher', de: 'Lehrer' },
      ],
    });
  });

  it('markiert von der KI ergänzte Übersetzungen, bis sie angepasst werden', async () => {
    const erkenne = vi.fn(async () => ({ ...ERKANNT, ergaenzt: ['w2'] }));
    await zeige({ erkenne });
    await userEvent.click(await screen.findByRole('button', { name: '📷 Neue Lektion aus Fotos' }));
    await fotoHochladen();
    await userEvent.click(screen.getByRole('button', { name: 'Fotos auswerten' }));

    expect(await screen.findByText(/1 Übersetzung hat die KI ergänzt/)).toBeInTheDocument();
    const zeile = screen.getByLabelText('Deutsch 2').closest('li')!;
    expect(within(zeile).getByRole('img', { name: 'Von der KI ergänzt' })).toBeInTheDocument();
    expect(screen.getByLabelText('Deutsch 1').closest('li')).not.toHaveClass('lektion-ergaenzt');

    await userEvent.type(screen.getByLabelText('Deutsch 2'), ', Unterricht');
    expect(screen.queryByRole('img', { name: 'Von der KI ergänzt' })).toBeNull();
    expect(screen.queryByText(/die KI ergänzt/)).toBeNull();
  });

  it('verlangt vor der Freigabe einen Titel', async () => {
    const { lektionen } = await zeige();
    await userEvent.click(await screen.findByRole('button', { name: '📷 Neue Lektion aus Fotos' }));
    await fotoHochladen();
    await userEvent.click(screen.getByRole('button', { name: 'Fotos auswerten' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Freigeben' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Titel');
    expect(await lektionen.alle()).toEqual([]);
  });

  it('behält die Fotos, wenn das Auswerten scheitert', async () => {
    const erkenne = vi.fn(async () => {
      throw new FotoImportFehler('kein-netz');
    });
    await zeige({ erkenne });
    await userEvent.click(await screen.findByRole('button', { name: '📷 Neue Lektion aus Fotos' }));
    await fotoHochladen();
    await userEvent.click(screen.getByRole('button', { name: 'Fotos auswerten' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Keine Verbindung');
    expect(screen.getByAltText('Foto 1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Fotos auswerten' })).toBeEnabled();
  });

  it('weist auf den fehlenden KI-Schlüssel hin', async () => {
    const erkenne = vi.fn(async () => ERKANNT);
    // Ein entfernter Schlüssel ist als leerer Text gespeichert
    await zeige({ schluessel: '', erkenne });
    await userEvent.click(await screen.findByRole('button', { name: '📷 Neue Lektion aus Fotos' }));
    await fotoHochladen();
    await userEvent.click(screen.getByRole('button', { name: 'Fotos auswerten' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('KI-Schlüssel');
    expect(erkenne).not.toHaveBeenCalled();
  });

  it('löscht eine Lektion nach Rückfrage (als Markierung für den Abgleich)', async () => {
    const lektionen = lektionenImArbeitsspeicher([
      {
        id: 'a',
        fach: 'englisch',
        titel: 'Unit 1',
        erstellt: '2026-11-01T10:00:00Z',
        geaendert: '2026-11-01T10:00:00Z',
        inhalt: { art: 'vokabeln', woerter: [{ id: '1', en: 'dog', de: 'Hund' }] },
      },
    ]);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    await zeige({ lektionen });
    const zeile = (await screen.findByText('Unit 1')).closest('li')!;
    expect(within(zeile).getByText('1 Wörter')).toBeInTheDocument();
    await userEvent.click(within(zeile).getByRole('button', { name: 'Unit 1 löschen' }));
    expect(await screen.findByText(/Noch keine Lektionen/)).toBeInTheDocument();
    expect((await lektionen.lade('a'))?.geloescht).toBe(true);
  });

  it('bietet auf dem Kind-Gerät kein Anlegen an', async () => {
    await zeige({ rolle: 'kind' });
    expect(screen.queryByRole('button', { name: '📷 Neue Lektion aus Fotos' })).toBeNull();
    expect(screen.getByText(/auf einem Eltern-Gerät/)).toBeInTheDocument();
  });
});
