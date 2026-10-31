import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  entferneSprachausgabe,
  installiereSprachausgabe,
  stimme,
} from './sprachausgabeAttrappe.ts';
import { stoppen } from './vorlesen.ts';
import { VorleseKnopf } from './VorleseKnopf.tsx';

afterEach(() => {
  stoppen();
  entferneSprachausgabe();
});

describe('VorleseKnopf', () => {
  it('liest den Text vor und zeigt währenddessen Stopp', async () => {
    const sprache = installiereSprachausgabe([stimme('de-DE')]);
    render(<VorleseKnopf text="Hallo Welt" />);
    await userEvent.click(screen.getByRole('button', { name: 'Vorlesen' }));
    expect(await screen.findByRole('button', { name: 'Vorlesen stoppen' })).toBeInTheDocument();
    expect(sprache.gesprochen[0]!.text).toBe('Hallo Welt');
  });

  it('stoppt beim zweiten Tippen', async () => {
    installiereSprachausgabe([stimme('de-DE')]);
    render(<VorleseKnopf text="Hallo" />);
    await userEvent.click(screen.getByRole('button', { name: 'Vorlesen' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Vorlesen stoppen' }));
    expect(await screen.findByRole('button', { name: 'Vorlesen' })).toBeInTheDocument();
  });

  it('setzt den alten Knopf zurück, wenn ein anderer startet', async () => {
    installiereSprachausgabe([stimme('de-DE'), stimme('en-GB')]);
    render(
      <>
        <VorleseKnopf text="eins" />
        <VorleseKnopf text="two" sprache="en" />
      </>,
    );
    const [erster, zweiter] = screen.getAllByRole('button');
    await userEvent.click(erster!);
    await vi.waitFor(() => expect(erster).toHaveAttribute('aria-pressed', 'true'));
    await userEvent.click(zweiter!);
    await vi.waitFor(() => expect(zweiter).toHaveAttribute('aria-pressed', 'true'));
    expect(erster).toHaveAttribute('aria-pressed', 'false');
  });

  it('zeigt einen Hinweis, wenn die Stimme fehlt', async () => {
    installiereSprachausgabe([stimme('de-DE')]);
    render(<VorleseKnopf text="house" sprache="en" />);
    await userEvent.click(screen.getByRole('button', { name: 'Vorlesen' }));
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Keine englische Stimme auf diesem Gerät',
    );
  });

  it('zeigt einen Hinweis, wenn der Browser nicht vorlesen kann', async () => {
    render(<VorleseKnopf text="Hallo" />);
    await userEvent.click(screen.getByRole('button', { name: 'Vorlesen' }));
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Vorlesen geht in diesem Browser nicht',
    );
  });
});
