import { Seite } from '../basis/Seite.tsx';
import type { Dropbox } from '../sync/dropbox.ts';
import { DropboxVerbinden } from '../sync/Verbinden.tsx';

// PIN-Schutz folgt in Aufgabe 12
export function ElternBereich({ dropbox }: { dropbox: Dropbox }) {
  return (
    <Seite titel="Eltern-Bereich">
      <DropboxVerbinden dropbox={dropbox} />
    </Seite>
  );
}
