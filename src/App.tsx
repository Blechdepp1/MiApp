import { Einstellungen } from './basis/Einstellungen.tsx';
import { EinstellungenProvider } from './basis/EinstellungenKontext.tsx';
import { dexieSpeicher } from './basis/einstellungenSpeicher.ts';
import type { EinstellungsSpeicher } from './basis/einstellungen.ts';
import { useZiel } from './basis/navigation.ts';
import { KommtBald, Seite } from './basis/Seite.tsx';
import { Startseite } from './basis/Startseite.tsx';
import './basis/thema.css';
import './App.css';

export function App({ speicher = dexieSpeicher }: { speicher?: EinstellungsSpeicher }) {
  return (
    <EinstellungenProvider speicher={speicher}>
      <main>
        <Inhalt />
      </main>
    </EinstellungenProvider>
  );
}

function Inhalt() {
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
      return <KommtBald titel="Eltern-Bereich" />;
    case 'start':
      return <Startseite />;
  }
}
