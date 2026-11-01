import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Einrichtung } from './Einrichtung.tsx';
import { ElternTuer, setzeSperreZurueck } from './ElternTuer.tsx';
import { geraetImArbeitsspeicher, type GeraetSpeicher } from './geraet.ts';
import { GeraetProvider } from './GeraetKontext.tsx';
import { erzeugePruefwert, istGueltigePin, MAX_FEHLVERSUCHE, pruefePin } from './pin.ts';

async function tippePin(pin: string) {
  for (const z of pin) await userEvent.click(screen.getByRole('button', { name: z }));
}

describe('PIN', () => {
  it('speichert nur einen gesalzenen Prüfwert', async () => {
    const wert = await erzeugePruefwert('1234');
    expect(JSON.stringify(wert)).not.toContain('1234');
    expect(await pruefePin('1234', wert)).toBe(true);
    expect(await pruefePin('4321', wert)).toBe(false);
  });

  it('erzeugt bei gleicher PIN verschiedene Prüfwerte', async () => {
    const a = await erzeugePruefwert('1234');
    const b = await erzeugePruefwert('1234');
    expect(a.hash).not.toBe(b.hash);
  });

  it('akzeptiert nur 4 Ziffern', async () => {
    expect(istGueltigePin('1234')).toBe(true);
    expect(istGueltigePin('123')).toBe(false);
    expect(istGueltigePin('12a4')).toBe(false);
    await expect(erzeugePruefwert('12')).rejects.toThrow();
  });
});

describe('Einrichtung', () => {
  function zeige(speicher: GeraetSpeicher = geraetImArbeitsspeicher()) {
    render(
      <GeraetProvider speicher={speicher}>
        <Einrichtung />
      </GeraetProvider>,
    );
    return speicher;
  }

  it('speichert Rolle und PIN nach zweimaliger Eingabe', async () => {
    const speicher = zeige();
    await userEvent.click(screen.getByRole('button', { name: /Mein Kind zum Lernen/ }));
    expect(screen.getByRole('heading', { name: 'Eltern-PIN festlegen' })).toBeInTheDocument();
    await tippePin('2580');
    expect(screen.getByRole('heading', { name: 'PIN noch einmal eingeben' })).toBeInTheDocument();
    await tippePin('2580');
    await vi.waitFor(async () => expect(await speicher.rolle.laden()).toBe('kind'));
    expect(await pruefePin('2580', (await speicher.pin.laden())!)).toBe(true);
  });

  it('fängt von vorn an, wenn die Wiederholung nicht passt', async () => {
    const speicher = zeige();
    await userEvent.click(screen.getByRole('button', { name: /Wir Eltern/ }));
    await tippePin('1111');
    await tippePin('2222');
    expect(screen.getByRole('alert')).toHaveTextContent('unterschiedlich');
    expect(screen.getByRole('heading', { name: 'Eltern-PIN festlegen' })).toBeInTheDocument();
    expect(await speicher.rolle.laden()).toBeUndefined();
  });

  it('kann eine Ziffer löschen', async () => {
    zeige();
    await userEvent.click(screen.getByRole('button', { name: /Mein Kind/ }));
    await tippePin('12');
    await userEvent.click(screen.getByRole('button', { name: 'Löschen' }));
    expect(screen.getByLabelText('1 von 4 Ziffern')).toBeInTheDocument();
  });
});

describe('ElternTuer', () => {
  beforeEach(() => setzeSperreZurueck());

  async function zeige(jetzt = () => Date.now()) {
    const speicher = geraetImArbeitsspeicher({
      rolle: 'kind',
      pin: await erzeugePruefwert('1234'),
    });
    render(
      <GeraetProvider speicher={speicher}>
        <ElternTuer jetzt={jetzt}>
          <p>Geheimer Eltern-Inhalt</p>
        </ElternTuer>
      </GeraetProvider>,
    );
    await screen.findByRole('heading', { name: 'Eltern-PIN eingeben' });
  }

  it('zeigt den Inhalt erst nach der richtigen PIN', async () => {
    await zeige();
    expect(screen.queryByText('Geheimer Eltern-Inhalt')).toBeNull();
    await tippePin('1234');
    expect(await screen.findByText('Geheimer Eltern-Inhalt')).toBeInTheDocument();
  });

  it('meldet eine falsche PIN', async () => {
    await zeige();
    await tippePin('0000');
    expect(await screen.findByRole('alert')).toHaveTextContent('Die PIN stimmt nicht.');
    expect(screen.queryByText('Geheimer Eltern-Inhalt')).toBeNull();
  });

  it('sperrt nach zu vielen Fehlversuchen für eine Minute', async () => {
    await zeige();
    for (let i = 0; i < MAX_FEHLVERSUCHE; i++) {
      await tippePin('0000');
      await screen.findByRole('alert');
    }
    expect(screen.getByRole('alert')).toHaveTextContent('eine Minute warten');
    expect(screen.getByRole('button', { name: '1' })).toBeDisabled();
  });

  it('bleibt gesperrt, auch wenn die Seite neu geöffnet wird', async () => {
    await zeige();
    for (let i = 0; i < MAX_FEHLVERSUCHE; i++) {
      await tippePin('0000');
      await screen.findByRole('alert');
    }
    cleanup();
    await zeige();
    expect(screen.getByRole('button', { name: '1' })).toBeDisabled();
  });

  it('erklärt, was bei vergessener PIN zu tun ist', async () => {
    await zeige();
    await userEvent.click(screen.getByRole('button', { name: 'PIN vergessen?' }));
    expect(screen.getByText(/Daten der App auf diesem Gerät löscht/)).toBeInTheDocument();
  });
});
