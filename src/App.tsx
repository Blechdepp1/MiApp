import type { ReactNode } from 'react';
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
import { Einrichtung } from './eltern/Einrichtung.tsx';
import { ElternBereich } from './eltern/ElternBereich.tsx';
import { dexieGeraetSpeicher, type GeraetSpeicher } from './eltern/geraet.ts';
import { GeraetProvider, useGeraet } from './eltern/GeraetKontext.tsx';
import type { AbgleichStand } from './sync/abgleich.ts';
import type { Dropbox } from './sync/dropbox.ts';
import { SyncProvider } from './sync/SyncKontext.tsx';
import { dropbox as standardDropbox } from './sync/verbindung.ts';
import { VokabelSeite } from './vokabeln-en/VokabelSeite.tsx';
import './basis/thema.css';
import './App.css';

export function App({
  speicher = dexieSpeicher,
  protokoll = dexieProtokoll,
  dropbox = standardDropbox,
  gesehenesLevel,
  geraet = dexieGeraetSpeicher,
  abgleichStand,
}: {
  abgleichStand?: GespeicherterWert<AbgleichStand>;
  speicher?: EinstellungsSpeicher;
  protokoll?: Protokoll;
  dropbox?: Dropbox;
  gesehenesLevel?: GespeicherterWert<number>;
  geraet?: GeraetSpeicher;
}) {
  return (
    <EinstellungenProvider speicher={speicher}>
      <ProtokollProvider protokoll={protokoll}>
        <SyncProvider dropbox={dropbox} stand={abgleichStand}>
          <GeraetProvider speicher={geraet}>
            <Eingerichtet>
              <main>
                <Inhalt dropbox={dropbox} />
              </main>
              <LevelFeier gesehen={gesehenesLevel} />
            </Eingerichtet>
          </GeraetProvider>
        </SyncProvider>
      </ProtokollProvider>
    </EinstellungenProvider>
  );
}

// Beim ersten Start richten die Eltern das Gerät ein (Rolle und PIN)
function Eingerichtet({ children }: { children: ReactNode }) {
  const { geraet } = useGeraet();
  if (geraet === undefined) return null;
  if (geraet === null) {
    return (
      <main>
        <Einrichtung />
      </main>
    );
  }
  return <>{children}</>;
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
