import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import changelog from '../../CHANGELOG.md?raw';
import { speicherImArbeitsspeicher } from './einstellungen.ts';
import { EinstellungenProvider } from './EinstellungenKontext.tsx';
import { VERSION, wasIstNeu } from './version.ts';
import { Version } from './Version.tsx';

const TEXT = `# Was ist neu

## 1.1.0 – 03.11.2026
- Neu A
- Neu B

## 1.0.0 – 01.11.2026
- Alt
`;

describe('wasIstNeu', () => {
  it('liefert die Stichpunkte genau dieser Version', () => {
    expect(wasIstNeu(TEXT, '1.1.0')).toEqual(['Neu A', 'Neu B']);
    expect(wasIstNeu(TEXT, '1.0.0')).toEqual(['Alt']);
  });

  it('liefert nichts für eine unbekannte Version', () => {
    expect(wasIstNeu(TEXT, '2.0.0')).toEqual([]);
    expect(wasIstNeu(TEXT, '1.1')).toEqual([]);
  });

  it('jede Version der App steht im CHANGELOG', () => {
    expect(wasIstNeu(changelog, VERSION).length).toBeGreaterThan(0);
  });
});

describe('Version', () => {
  it('zeigt Versionsnummer und „Was ist neu?“', async () => {
    render(
      <EinstellungenProvider speicher={speicherImArbeitsspeicher()}>
        <Version />
      </EinstellungenProvider>,
    );
    expect(screen.getByText(VERSION)).toBeInTheDocument();
    await userEvent.click(screen.getByText('Was ist neu?'));
    expect(screen.getAllByRole('listitem').length).toBeGreaterThan(0);
  });
});
