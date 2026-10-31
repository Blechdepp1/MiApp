import { Einstellungen } from './basis/Einstellungen.tsx';
import { EinstellungenProvider } from './basis/EinstellungenKontext.tsx';
import { dexieSpeicher } from './basis/einstellungenSpeicher.ts';
import type { EinstellungsSpeicher } from './basis/einstellungen.ts';
import { useZiel } from './basis/navigation.ts';
import { KommtBald, Seite } from './basis/Seite.tsx';
import { Startseite } from './basis/Startseite.tsx';
import { ElternBereich } from './eltern/ElternBereich.tsx';
import type { Dropbox } from './sync/dropbox.ts';
import { dropbox as standardDropbox } from './sync/verbindung.ts';
import './basis/thema.css';
import './App.css';

export function App({
  speicher = dexieSpeicher,
  dropbox = standardDropbox,
}: {
  speicher?: EinstellungsSpeicher;
  dropbox?: Dropbox;
}) {
  return (
    <EinstellungenProvider speicher={speicher}>
      <main>
        <Inhalt dropbox={dropbox} />
      </main>
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
      return <KommtBald titel="Vokabeln" />;
    case 'belohnungen':
      return <KommtBald titel="Belohnungen" />;
    case 'eltern':
      return <ElternBereich dropbox={dropbox} />;
    case 'start':
      return <Startseite />;
  }
}
