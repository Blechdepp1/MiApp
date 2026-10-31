import { render, screen } from '@testing-library/react';
import { App } from './App.tsx';

describe('App', () => {
  it('zeigt den App-Namen', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'MiApp' })).toBeInTheDocument();
  });
});
