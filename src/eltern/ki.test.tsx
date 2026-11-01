import Anthropic from '@anthropic-ai/sdk';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { protokollImArbeitsspeicher } from '../daten/protokoll.ts';
import { inhalteImArbeitsspeicher } from '../daten/inhalte.ts';
import { wertImArbeitsspeicher } from '../daten/schluesselWert.ts';
import { geraetImArbeitsspeicher, type Rolle } from './geraet.ts';
import { GeraetProvider } from './GeraetKontext.tsx';
import { KiEinstellungen } from './KiEinstellungen.tsx';
import {
  KI_MODELL,
  pruefeSchluessel,
  schluesselEnde,
  siehtWieSchluesselAus,
  type KiClientFabrik,
} from './ki.ts';
import { erzeugePruefwert } from './pin.ts';

const SCHLUESSEL = 'sk-ant-api03-' + 'a'.repeat(40) + 'WXYZ';

// Nachgebauter Client: models.retrieve gelingt oder wirft den angegebenen Fehler
function fabrik(fehler?: unknown): KiClientFabrik & { aufrufe: string[] } {
  const aufrufe: string[] = [];
  const f = async (schluessel: string) => {
    aufrufe.push(schluessel);
    return {
      models: {
        retrieve: async (id: string) => {
          if (fehler) throw fehler;
          return { id };
        },
      },
    } as unknown as Anthropic;
  };
  return Object.assign(f, { aufrufe });
}

function apiFehler(status: number) {
  return Anthropic.APIError.generate(status, { error: { message: 'x' } }, 'x', new Headers());
}

describe('pruefeSchluessel', () => {
  it('fragt das Modell ab und meldet ok', async () => {
    const f = fabrik();
    expect(await pruefeSchluessel(`  ${SCHLUESSEL} `, f)).toBe('ok');
    expect(f.aufrufe).toEqual([SCHLUESSEL]);
  });

  it.each([
    [401, 'ungueltig'],
    [403, 'keine-berechtigung'],
    [404, 'keine-berechtigung'],
    [500, 'fehler'],
  ])('ordnet HTTP %i als %s ein', async (status, erwartet) => {
    expect(await pruefeSchluessel(SCHLUESSEL, fabrik(apiFehler(status)))).toBe(erwartet);
  });

  it('erkennt fehlendes Netz', async () => {
    const fehler = new Anthropic.APIConnectionError({ message: 'offline' });
    expect(await pruefeSchluessel(SCHLUESSEL, fabrik(fehler))).toBe('kein-netz');
  });
});

describe('Schlüssel-Helfer', () => {
  it('erkennt das Format und zeigt nur das Ende', () => {
    expect(siehtWieSchluesselAus(SCHLUESSEL)).toBe(true);
    expect(siehtWieSchluesselAus('hallo')).toBe(false);
    expect(schluesselEnde(SCHLUESSEL)).toBe('…WXYZ');
  });

  it('nutzt Claude Opus 5.5', () => {
    expect(KI_MODELL).toBe('claude-opus-5-5');
  });
});

describe('KiEinstellungen', () => {
  async function zeige(rolle: Rolle, f = fabrik(), speicher = wertImArbeitsspeicher<string>()) {
    render(
      <GeraetProvider
        speicher={geraetImArbeitsspeicher({ rolle, pin: await erzeugePruefwert('1234') })}
      >
        <KiEinstellungen speicher={speicher} fabrik={f} />
      </GeraetProvider>,
    );
    await screen.findByRole('heading', { name: 'KI (Claude)' });
    return speicher;
  }

  it('speichert einen funktionierenden Schlüssel und zeigt nur sein Ende', async () => {
    const speicher = await zeige('eltern');
    await userEvent.type(await screen.findByLabelText('API-Schlüssel'), SCHLUESSEL);
    await userEvent.click(screen.getByRole('button', { name: 'Speichern und prüfen' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Schlüssel funktioniert');
    expect(screen.getByText('…WXYZ')).toBeInTheDocument();
    expect(screen.queryByText(SCHLUESSEL)).toBeNull();
    expect(await speicher.laden()).toBe(SCHLUESSEL);
  });

  it('speichert einen abgelehnten Schlüssel nicht', async () => {
    const speicher = await zeige('eltern', fabrik(apiFehler(401)));
    await userEvent.type(await screen.findByLabelText('API-Schlüssel'), SCHLUESSEL);
    await userEvent.click(screen.getByRole('button', { name: 'Speichern und prüfen' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('nicht angenommen');
    expect(await speicher.laden()).toBeUndefined();
  });

  it('weist offensichtlich falsche Eingaben ohne Anfrage zurück', async () => {
    const f = fabrik();
    await zeige('eltern', f);
    await userEvent.type(await screen.findByLabelText('API-Schlüssel'), 'mein-passwort');
    await userEvent.click(screen.getByRole('button', { name: 'Speichern und prüfen' }));
    expect(screen.getByRole('alert')).toHaveTextContent('sk-ant-');
    expect(f.aufrufe).toEqual([]);
  });

  it('kann den Schlüssel wieder entfernen', async () => {
    const speicher = await zeige('eltern', fabrik(), wertImArbeitsspeicher(SCHLUESSEL));
    await userEvent.click(await screen.findByRole('button', { name: 'Entfernen' }));
    expect(await screen.findByLabelText('API-Schlüssel')).toBeInTheDocument();
    expect(await speicher.laden()).toBe('');
  });

  it('bietet auf dem Kind-Gerät keine Eingabe an', async () => {
    await zeige('kind');
    expect(screen.queryByLabelText('API-Schlüssel')).toBeNull();
    expect(screen.getByText(/nur auf einem Eltern-Gerät/)).toBeInTheDocument();
  });

  it('landet nicht in Ereignissen oder Inhalten, die abgeglichen werden', async () => {
    // Der Schlüssel hat einen eigenen, gerätegebundenen Speicher; Protokoll und Inhalte bleiben leer
    const protokoll = protokollImArbeitsspeicher();
    const inhalte = inhalteImArbeitsspeicher();
    await zeige('eltern');
    await userEvent.type(await screen.findByLabelText('API-Schlüssel'), SCHLUESSEL);
    await userEvent.click(screen.getByRole('button', { name: 'Speichern und prüfen' }));
    await screen.findByRole('status');
    const alles = JSON.stringify([await protokoll.alle(), await inhalte.alle()]);
    expect(alles).not.toContain('sk-ant-');
  });
});
