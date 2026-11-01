import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { geraetImArbeitsspeicher } from '../eltern/geraet.ts';
import { GeraetProvider } from '../eltern/GeraetKontext.tsx';
import { erzeugePruefwert } from '../eltern/pin.ts';
import { VERSION } from './version.ts';
import { VorschauBand } from './VorschauBand.tsx';

async function zeige() {
  const pin = await erzeugePruefwert('1234');
  const speicher = geraetImArbeitsspeicher({ rolle: 'eltern', pin });
  render(
    <GeraetProvider speicher={speicher}>
      <VorschauBand />
    </GeraetProvider>,
  );
  return { speicher, pin };
}

it('zeigt im Testkanal deutlich „Testversion“ mit Versionsnummer', async () => {
  await zeige();
  expect(screen.getByRole('note')).toHaveTextContent(`Testversion ${VERSION}`);
});

it('wechselt zwischen Eltern- und Kind-Ansicht und behält die PIN', async () => {
  const { speicher, pin } = await zeige();
  await userEvent.click(await screen.findByRole('button', { name: /zur Kind-Ansicht/ }));
  expect(await screen.findByRole('button', { name: /zur Eltern-Ansicht/ })).toBeInTheDocument();
  expect(await speicher.rolle.laden()).toBe('kind');
  expect(await speicher.pin.laden()).toEqual(pin);
  await userEvent.click(screen.getByRole('button', { name: /zur Eltern-Ansicht/ }));
  expect(await speicher.rolle.laden()).toBe('eltern');
});
