import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { erstelleEreignis } from '../daten/ereignisse.ts';
import { protokollImArbeitsspeicher, type Protokoll } from '../daten/protokoll.ts';
import { ProtokollProvider } from '../daten/ProtokollKontext.tsx';
import { Rueckmeldungen } from '../eltern/Rueckmeldungen.tsx';
import { FehlerMelder } from './FehlerMelder.tsx';
import { rueckmeldungen } from './logik.ts';
import { SagUnsWas } from './SagUnsWas.tsx';

function mit(protokoll: Protokoll, inhalt: ReactNode) {
  return render(<ProtokollProvider protokoll={protokoll}>{inhalt}</ProtokollProvider>);
}

describe('Sag uns was', () => {
  it('schickt mit zwei Tipps einen Smiley, ohne tippen zu müssen', async () => {
    const protokoll = protokollImArbeitsspeicher();
    mit(protokoll, <SagUnsWas />);
    await userEvent.click(screen.getByRole('button', { name: /Sag uns was/ }));
    const dialog = screen.getByRole('dialog', { name: 'Sag uns was' });
    expect(within(dialog).getByRole('button', { name: 'Abschicken' })).toBeDisabled();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Gut' }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Abschicken' }));
    expect(await within(dialog).findByRole('status')).toHaveTextContent('Danke');

    const [r] = rueckmeldungen(await protokoll.alle());
    expect(r).toMatchObject({ art: 'rueckmeldung', stimmung: 'gut', seite: 'start' });
    expect(r!.version).toMatch(/^\d+\.\d+\.\d+/);
    await userEvent.click(within(dialog).getByRole('button', { name: 'Schließen' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('schickt auch nur einen (diktierten) Satz', async () => {
    const protokoll = protokollImArbeitsspeicher();
    mit(protokoll, <SagUnsWas />);
    await userEvent.click(screen.getByRole('button', { name: /Sag uns was/ }));
    await userEvent.type(
      screen.getByLabelText(/Willst du noch etwas sagen/),
      'Die Stimme ist zu schnell',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Abschicken' }));
    await screen.findByRole('status');
    expect(rueckmeldungen(await protokoll.alle())[0]).toMatchObject({
      text: 'Die Stimme ist zu schnell',
    });
  });
});

describe('FehlerMelder', () => {
  beforeEach(() => localStorage.clear());

  it('meldet technische Fehler einmal, höchstens fünf pro Tag', async () => {
    const protokoll = protokollImArbeitsspeicher();
    mit(protokoll, <FehlerMelder />);
    act(() => {
      for (const text of ['A', 'A', 'B', 'C', 'D', 'E', 'F']) {
        window.dispatchEvent(new ErrorEvent('error', { message: text }));
      }
    });
    await vi.waitFor(async () => expect(rueckmeldungen(await protokoll.alle())).toHaveLength(5));
    const texte = rueckmeldungen(await protokoll.alle()).map((r) => [r.art, r.text]);
    expect(texte).toContainEqual(['fehler', 'A']);
    expect(texte).not.toContainEqual(['fehler', 'F']);
  });

  it('meldet denselben Fehler nach einem Neustart am selben Tag nicht noch einmal', async () => {
    const protokoll = protokollImArbeitsspeicher();
    const { unmount } = mit(protokoll, <FehlerMelder />);
    act(() => void window.dispatchEvent(new ErrorEvent('error', { message: 'Immer wieder' })));
    await vi.waitFor(async () => expect(await protokoll.alle()).toHaveLength(1));
    unmount();
    mit(protokoll, <FehlerMelder />);
    act(() => void window.dispatchEvent(new ErrorEvent('error', { message: 'Immer wieder' })));
    await new Promise((r) => setTimeout(r, 50));
    expect(await protokoll.alle()).toHaveLength(1);
  });

  it('meldet nicht abgefangene Promise-Fehler', async () => {
    const protokoll = protokollImArbeitsspeicher();
    mit(protokoll, <FehlerMelder />);
    act(() => {
      const e = new Event('unhandledrejection') as PromiseRejectionEvent;
      Object.defineProperty(e, 'reason', { value: new Error('kaputt') });
      window.dispatchEvent(e);
    });
    await vi.waitFor(async () =>
      expect(rueckmeldungen(await protokoll.alle())[0]?.text).toBe('Nicht abgefangen: kaputt'),
    );
  });
});

describe('Rückmeldungen (Eltern)', () => {
  it('zeigt neue Rückmeldungen und hakt sie ab', async () => {
    const protokoll = protokollImArbeitsspeicher([
      erstelleEreignis(
        {
          typ: 'feedback',
          art: 'rueckmeldung',
          stimmung: 'schlecht',
          text: 'Zu viele Wörter',
          seite: 'vokabeln',
          version: '0.11.0',
        },
        'kind',
      ),
    ]);
    mit(protokoll, <Rueckmeldungen />);
    expect(await screen.findByText('Milena: Nicht gut')).toBeInTheDocument();
    expect(screen.getByText('„Zu viele Wörter“')).toBeInTheDocument();
    expect(screen.getByText(/Vokabeln · Version 0\.11\.0/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Erledigt' }));
    expect(await screen.findByText('Keine neuen Rückmeldungen.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Erledigte zeigen (1)' }));
    expect(screen.getByText('„Zu viele Wörter“')).toBeInTheDocument();
  });
});
