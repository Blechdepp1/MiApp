import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Diktat } from './Diktat.tsx';
import type { ErkennungsFabrik } from './spracherkennung.ts';

// Nachgebaute Spracherkennung, die der Test „sprechen“ lassen kann
function attrappe() {
  const erkennung = {
    lang: '',
    interimResults: false,
    continuous: true,
    onresult: null as ((e: unknown) => void) | null,
    onerror: null as ((e: { error: string }) => void) | null,
    onend: null as (() => void) | null,
    start: vi.fn(),
    stop: vi.fn(() => erkennung.onend?.()),
  };
  const sage = (text: string, isFinal: boolean) =>
    act(() =>
      erkennung.onresult?.({ resultIndex: 0, results: [{ isFinal, 0: { transcript: text } }] }),
    );
  const fabrik = (() => erkennung) as unknown as ErkennungsFabrik;
  return { erkennung, sage, fabrik };
}

describe('Diktat', () => {
  it('hört auf Deutsch zu, zeigt Zwischenergebnisse und übernimmt den Satz', async () => {
    const { erkennung, sage, fabrik } = attrappe();
    const onText = vi.fn();
    render(<Diktat onText={onText} erkennung={fabrik} />);
    await userEvent.click(screen.getByRole('button', { name: /Sprechen/ }));
    expect(erkennung.start).toHaveBeenCalled();
    expect(erkennung.lang).toBe('de-DE');
    expect(screen.getByRole('status')).toHaveTextContent('Ich höre zu');

    sage('Die Stimme', false);
    expect(screen.getByRole('status')).toHaveTextContent('„Die Stimme …“');
    sage(' Die Stimme ist zu schnell ', true);
    expect(onText).toHaveBeenCalledWith('Die Stimme ist zu schnell');

    await userEvent.click(screen.getByRole('button', { name: /Fertig gesprochen/ }));
    expect(erkennung.stop).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /Sprechen/ })).toBeInTheDocument();
  });

  it('erklärt, wenn das Mikrofon nicht erlaubt ist', async () => {
    const { erkennung, fabrik } = attrappe();
    render(<Diktat onText={vi.fn()} erkennung={fabrik} />);
    await userEvent.click(screen.getByRole('button', { name: /Sprechen/ }));
    act(() => {
      erkennung.onerror?.({ error: 'not-allowed' });
      erkennung.onend?.();
    });
    expect(screen.getByRole('alert')).toHaveTextContent('Mikrofon ist nicht erlaubt');
  });

  it('erscheint nicht, wenn das Gerät keine Spracherkennung hat', () => {
    render(<Diktat onText={vi.fn()} erkennung={null} />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});
