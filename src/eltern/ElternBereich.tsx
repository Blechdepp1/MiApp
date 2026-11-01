import { Seite } from '../basis/Seite.tsx';
import type { Dropbox } from '../sync/dropbox.ts';
import { useSync } from '../sync/SyncKontext.tsx';
import { SyncStatus } from '../sync/SyncStatus.tsx';
import { DropboxVerbinden } from '../sync/Verbinden.tsx';
import { BelohnungenVerwalten } from './BelohnungenVerwalten.tsx';
import { Einloesungen } from './Einloesungen.tsx';
import { ElternTuer } from './ElternTuer.tsx';
import { KiEinstellungen } from './KiEinstellungen.tsx';
import { Lektionen } from './Lektionen.tsx';
import { LevelVerwalten } from './LevelVerwalten.tsx';
import { useGeraet } from './GeraetKontext.tsx';

export function ElternBereich({ dropbox }: { dropbox: Dropbox }) {
  const { geraet } = useGeraet();
  const { abgleichen } = useSync();
  return (
    <Seite titel="Eltern-Bereich">
      <ElternTuer>
        <p>
          Dieses Gerät gehört:{' '}
          <strong>{geraet?.rolle === 'eltern' ? 'den Eltern' : 'dem Kind'}</strong>
        </p>
        <Einloesungen />
        <Lektionen />
        <DropboxVerbinden dropbox={dropbox} onAenderung={abgleichen} />
        <SyncStatus />
        <BelohnungenVerwalten />
        <LevelVerwalten />
        <KiEinstellungen />
      </ElternTuer>
    </Seite>
  );
}
