import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { speicherImArbeitsspeicher, STANDARD } from './einstellungen.ts';
import { Einstellungen } from './Einstellungen.tsx';
import { EinstellungenProvider } from './EinstellungenKontext.tsx';
import { FARBEN } from './thema.ts';

function zeige(speicher = speicherImArbeitsspeicher()) {
  return render(
    <EinstellungenProvider speicher={speicher}>
      <Einstellungen />
    </EinstellungenProvider>,
  );
}

function variable(name: string) {
  return document.documentElement.style.getPropertyValue(name);
}

describe('Einstellungen', () => {
  it('wendet eine Änderung sofort an', async () => {
    zeige();
    const gruppe = screen.getByRole('radiogroup', { name: 'Hintergrund' });
    await userEvent.click(within(gruppe).getByRole('radio', { name: 'Dunkel' }));
    await vi.waitFor(() => expect(variable('--farbe-hintergrund')).toBe(FARBEN.dunkel.hintergrund));
    expect(within(gruppe).getByRole('radio', { name: 'Dunkel' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('behält Einstellungen nach einem Neustart', async () => {
    const speicher = speicherImArbeitsspeicher();
    const erster = zeige(speicher);
    const groesse = screen.getByRole('radiogroup', { name: 'Schriftgröße' });
    await userEvent.click(within(groesse).getByRole('radio', { name: 'Sehr groß' }));
    erster.unmount();

    wendeThemaZurueck();
    zeige(speicher);
    const neu = screen.getByRole('radiogroup', { name: 'Schriftgröße' });
    expect(
      await within(neu).findByRole('radio', { name: 'Sehr groß', checked: true }),
    ).toBeVisible();
    // Das Thema wird in einem Effekt nach dem Rendern gesetzt
    await vi.waitFor(() => expect(variable('--schrift-groesse')).toBe('28px'));
  });

  it('überschreibt eine Auswahl nicht, wenn das Laden länger dauert', async () => {
    let ladenFertig: (wert: undefined) => void = () => {};
    const langsam = {
      laden: () => new Promise<undefined>((r) => (ladenFertig = r)),
      speichern: vi.fn(async () => {}),
    };
    zeige(langsam);
    const gruppe = screen.getByRole('radiogroup', { name: 'Abstand' });
    await userEvent.click(within(gruppe).getByRole('radio', { name: 'Weit' }));
    ladenFertig(undefined);
    await vi.waitFor(() => expect(langsam.speichern).toHaveBeenCalled());
    expect(within(gruppe).getByRole('radio', { name: 'Weit' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('startet mit den LRS-Standardwerten', async () => {
    zeige();
    expect(await screen.findByRole('radio', { name: 'Creme', checked: true })).toBeInTheDocument();
    await vi.waitFor(() => expect(variable('--abstand-zeilen')).toBe('1.5'));
    expect(screen.getByRole('slider', { name: 'Vorlese-Tempo' })).toHaveValue(
      String(STANDARD.tempo),
    );
  });

  it('hat für jede Überschrift einen Vorlese-Knopf', () => {
    zeige();
    const ueberschriften = screen.getAllByRole('heading');
    for (const u of ueberschriften) {
      expect(
        within(u.parentElement!).getByRole('button', { name: 'Vorlesen' }),
      ).toBeInTheDocument();
    }
    expect(ueberschriften.length).toBe(5);
  });

  it('stellt das Vorlese-Tempo ein', async () => {
    const speicher = speicherImArbeitsspeicher();
    zeige(speicher);
    const regler = screen.getByRole('slider', { name: 'Vorlese-Tempo' });
    fireEvent.change(regler, { target: { value: '1.2' } });
    expect(regler).toHaveValue('1.2');
    expect(await speicher.laden()).toMatchObject({ tempo: 1.2 });
  });
});

function wendeThemaZurueck() {
  document.documentElement.removeAttribute('style');
}
