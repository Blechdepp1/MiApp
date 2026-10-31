import { render, screen } from '@testing-library/react';
import { speicherImArbeitsspeicher } from './basis/einstellungen.ts';
import { App } from './App.tsx';

describe('App', () => {
  it('zeigt die Einstellungen', () => {
    render(<App speicher={speicherImArbeitsspeicher()} />);
    expect(screen.getByRole('heading', { name: 'Einstellungen' })).toBeInTheDocument();
  });
});
