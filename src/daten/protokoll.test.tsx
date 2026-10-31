import { act, render, screen } from '@testing-library/react';
import { protokollImArbeitsspeicher } from './protokoll.ts';
import { ProtokollProvider, useEreignisse } from './ProtokollKontext.tsx';

function Anzahl() {
  const ereignisse = useEreignisse();
  return <p>{ereignisse === undefined ? 'lädt' : `${ereignisse.length} Ereignisse`}</p>;
}

describe('Protokoll', () => {
  it('speichert Ereignisse mit Gerät und Zeit', async () => {
    const protokoll = protokollImArbeitsspeicher();
    const e = await protokoll.hinzufuegen({
      typ: 'runde-beendet',
      richtig: 3,
      mitHilfe: 0,
      verbessert: 1,
    });
    expect(e.geraet).toBe('test-geraet');
    expect(await protokoll.alle()).toEqual([e]);
  });

  it('aktualisiert Komponenten nach einem neuen Ereignis', async () => {
    const protokoll = protokollImArbeitsspeicher();
    render(
      <ProtokollProvider protokoll={protokoll}>
        <Anzahl />
      </ProtokollProvider>,
    );
    expect(await screen.findByText('0 Ereignisse')).toBeInTheDocument();
    await act(() =>
      protokoll.hinzufuegen({ typ: 'runde-beendet', richtig: 0, mitHilfe: 0, verbessert: 0 }),
    );
    expect(await screen.findByText('1 Ereignisse')).toBeInTheDocument();
  });
});
