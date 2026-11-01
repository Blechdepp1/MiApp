import {
  dexieWert,
  wertImArbeitsspeicher,
  type GespeicherterWert,
} from '../daten/schluesselWert.ts';
import type { PinPruefwert } from './pin.ts';

// Wem gehört dieses Gerät? Bestimmt später, wer Inhalte schreiben und die KI nutzen darf.
export type Rolle = 'kind' | 'eltern';

export type Geraet = { rolle: Rolle; pin: PinPruefwert };

export type GeraetSpeicher = {
  rolle: GespeicherterWert<Rolle>;
  pin: GespeicherterWert<PinPruefwert>;
};

export const dexieGeraetSpeicher: GeraetSpeicher = {
  rolle: dexieWert<Rolle>('geraet-rolle'),
  pin: dexieWert<PinPruefwert>('eltern-pin'),
};

export function geraetImArbeitsspeicher(start: Partial<Geraet> = {}): GeraetSpeicher {
  return {
    rolle: wertImArbeitsspeicher(start.rolle),
    pin: wertImArbeitsspeicher(start.pin),
  };
}
