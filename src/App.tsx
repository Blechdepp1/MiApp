import { Einstellungen } from './basis/Einstellungen.tsx';
import { EinstellungenProvider } from './basis/EinstellungenKontext.tsx';
import { dexieSpeicher } from './basis/einstellungenSpeicher.ts';
import type { EinstellungsSpeicher } from './basis/einstellungen.ts';
import { useZiel } from './basis/navigation.ts';
import { KommtBald, Seite } from './basis/Seite.tsx';
import { Startseite } from './basis/Startseite.tsx';
import { LevelFeier } from './belohnung/LevelFeier.tsx';
import { dexieProtokoll, type Protokoll } from './daten/protokoll.ts';
import type { GespeicherterWert } from './daten/schluesselWert.ts';
import { ProtokollProvider } from './daten/ProtokollKontext.tsx';
import { ElternBereich } from './eltern/ElternBereich.tsx';
import type { Dropbox } from './sync/dropbox.ts';
import { dropbox as standardDropbox } from './sync/verbindung.ts';
import { VokabelSeite } from './vokabeln-en/VokabelSeite.tsx';
import './basis/thema.css';
import './App.css';

export function App({
  speicher = dexieSpeicher,
  protokoll = dexieProtokoll,
  dropbox = standardDropbox,
  gesehenesLevel,
}: {
  speicher?: EinstellungsSpeicher;
  protokoll?: Protokoll;
  dropbox?: Dropbox;
  gesehenesLevel?: GespeicherterWert<number>;
}) {
  return (
    <EinstellungenProvider speicher={speicher}>
      <ProtokollProvider protokoll={protokoll}>
        <main>
          <Inhalt dropbox={dropbox} />
        </main>
        <LevelFeier gesehen={gesehenesLevel} />
      </ProtokollProvider>
    </EinstellungenProvider>
  );
}

function Inhalt({ dropbox }: { dropbox: Dropbox }) {
  switch (useZiel()) {
    case 'einstellungen':
      return (
        <Seite titel="Einstellungen">
          <Einstellungen />
        </Seite>
      );
    case 'vokabeln':
      return <VokabelSeite />;
    case 'belohnungen':
      return <KommtBald titel="Belohnungen" />;
    case 'eltern':
      return <ElternBereich dropbox={dropbox} />;
    case 'start':
      return <Startseite />;
  }
}
