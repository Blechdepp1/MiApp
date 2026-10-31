import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { hauptform } from './bewertung.ts';
import { UebungSchreiben } from './UebungSchreiben.tsx';

const HAUS = { id: 'house', en: 'house', de: 'Haus' };

function zeige(wort = HAUS) {
  const onAntwort = vi.fn();
  const ansicht = render(<UebungSchreiben wort={wort} onAntwort={onAntwort} />);
  return { ...ansicht, onAntwort };
}

function kaestchen(container: HTMLElement) {
  return [...container.querySelectorAll('.schreib-kasten')].map((k) => k.textContent);
}

describe('UebungSchreiben', () => {
  it('zeigt das deutsche Wort und je Buchstabe ein Kästchen', () => {
    const { container } = zeige();
    expect(screen.getByText('Haus')).toBeInTheDocument();
    expect(kaestchen(container)).toEqual(['', '', '', '', '']);
    expect(screen.getByLabelText('Das Wort hat 5 Buchstaben')).toBeInTheDocument();
  });

  it('bewertet eine richtige Antwort ohne Hilfe', async () => {
    const { onAntwort } = zeige();
    await userEvent.type(screen.getByRole('textbox'), 'House{Enter}');
    expect(onAntwort).toHaveBeenCalledWith({ bewertung: 'richtig', mitHilfe: false });
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('erkennt „fast richtig“', async () => {
    const { onAntwort } = zeige();
    await userEvent.type(screen.getByRole('textbox'), 'hous');
    await userEvent.click(screen.getByRole('button', { name: 'Prüfen' }));
    expect(onAntwort).toHaveBeenCalledWith({ bewertung: 'fast', mitHilfe: false });
  });

  it('deckt mit Hilfe Buchstabe für Buchstabe auf und merkt sich die Hilfe', async () => {
    const { container, onAntwort } = zeige();
    await userEvent.click(screen.getByRole('button', { name: '💡 Hilfe' }));
    await userEvent.click(screen.getByRole('button', { name: '💡 Hilfe' }));
    expect(kaestchen(container)).toEqual(['h', 'o', '', '', '']);
    await userEvent.type(screen.getByRole('textbox'), 'house{Enter}');
    expect(onAntwort).toHaveBeenCalledWith({ bewertung: 'richtig', mitHilfe: true });
  });

  it('überspringt Leerzeichen und lässt Optionales weg', async () => {
    const { container } = zeige({ id: 'ice', en: '(an) ice cream', de: 'Eis' });
    expect(kaestchen(container)).toHaveLength(8);
    for (let i = 0; i < 4; i++)
      await userEvent.click(screen.getByRole('button', { name: '💡 Hilfe' }));
    expect(kaestchen(container).join('')).toBe('icec');
  });

  it('lässt leere Antworten nicht prüfen', async () => {
    const { onAntwort } = zeige();
    expect(screen.getByRole('button', { name: 'Prüfen' })).toBeDisabled();
    await userEvent.type(screen.getByRole('textbox'), '   {Enter}');
    expect(onAntwort).not.toHaveBeenCalled();
  });
});

describe('hauptform', () => {
  it.each([
    ['(to) play', 'play'],
    ['big, large', 'big'],
    ['(an) ice cream', 'ice cream'],
  ])('%s → %s', (loesung, form) => {
    expect(hauptform(loesung)).toBe(form);
  });
});
