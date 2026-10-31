import { Einstellungen } from './basis/Einstellungen.tsx';
import { EinstellungenProvider } from './basis/EinstellungenKontext.tsx';
import { dexieSpeicher } from './basis/einstellungenSpeicher.ts';
import type { EinstellungsSpeicher } from './basis/einstellungen.ts';
import './basis/thema.css';
import './App.css';

// Bis zur Navigation (Aufgabe 5) zeigt die App direkt die Einstellungen
export function App({ speicher = dexieSpeicher }: { speicher?: EinstellungsSpeicher }) {
  return (
    <EinstellungenProvider speicher={speicher}>
      <main>
        <Einstellungen />
      </main>
    </EinstellungenProvider>
  );
}
