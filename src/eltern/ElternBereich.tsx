import { Seite } from '../basis/Seite.tsx';
import type { Dropbox } from '../sync/dropbox.ts';
import { DropboxVerbinden } from '../sync/Verbinden.tsx';
import { ElternTuer } from './ElternTuer.tsx';
import { useGeraet } from './GeraetKontext.tsx';

export function ElternBereich({ dropbox }: { dropbox: Dropbox }) {
  const { geraet } = useGeraet();
  return (
    <Seite titel="Eltern-Bereich">
      <ElternTuer>
        <p>
          Dieses Gerät gehört:{' '}
          <strong>{geraet?.rolle === 'eltern' ? 'den Eltern' : 'dem Kind'}</strong>
        </p>
        <DropboxVerbinden dropbox={dropbox} />
      </ElternTuer>
    </Seite>
  );
}
