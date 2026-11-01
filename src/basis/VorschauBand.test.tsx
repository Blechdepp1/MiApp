import { render, screen } from '@testing-library/react';
import { VERSION } from './version.ts';
import { VorschauBand } from './VorschauBand.tsx';

it('zeigt im Testkanal deutlich „Testversion“ mit Versionsnummer', () => {
  render(<VorschauBand />);
  expect(screen.getByRole('note')).toHaveTextContent(`Testversion ${VERSION}`);
});
