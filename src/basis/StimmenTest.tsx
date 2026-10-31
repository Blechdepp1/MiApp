import { useEffect, useState } from 'react';
import { ladeStimmen, stimmeFuer, type Sprache } from './vorlesen.ts';
import { VorleseKnopf } from './VorleseKnopf.tsx';

// Vorübergehende Testseite für Aufgabe 3: Vorlesen auf dem echten Gerät prüfen
const BEISPIELE: { text: string; sprache: Sprache }[] = [
  { text: 'Hallo! Ich lese dir alles vor, was du antippst.', sprache: 'de' },
  { text: 'Die Straße, der Fuß, das Schiff, die Biene.', sprache: 'de' },
  { text: 'Hello! My name is Mia. I like reading books.', sprache: 'en' },
  { text: 'house, through, thought, beautiful, Wednesday', sprache: 'en' },
];

export function StimmenTest() {
  const [stimmen, setStimmen] = useState<SpeechSynthesisVoice[] | null>(null);
  const [tempo, setTempo] = useState(0.9);

  useEffect(() => {
    ladeStimmen().then(setStimmen);
  }, []);

  return (
    <section>
      <h2>Vorlese-Test</h2>
      <ul className="stimmen-beispiele">
        {BEISPIELE.map((b) => (
          <li key={b.text} lang={b.sprache}>
            <VorleseKnopf text={b.text} sprache={b.sprache} tempo={tempo} />
            <span>{b.text}</span>
          </li>
        ))}
      </ul>

      <label className="stimmen-tempo">
        Tempo: {tempo.toFixed(1)}
        <input
          type="range"
          min="0.5"
          max="1.3"
          step="0.1"
          value={tempo}
          onChange={(e) => setTempo(Number(e.target.value))}
        />
      </label>

      <h3>Stimmen auf diesem Gerät</h3>
      {stimmen === null ? (
        <p>Stimmen werden geladen …</p>
      ) : (
        <dl className="stimmen-diagnose">
          <dt>Deutsch</dt>
          <dd>{beschreibe(stimmeFuer('de', stimmen))}</dd>
          <dt>Englisch</dt>
          <dd>{beschreibe(stimmeFuer('en', stimmen))}</dd>
          <dt>Insgesamt</dt>
          <dd>{stimmen.length} Stimmen</dd>
        </dl>
      )}
    </section>
  );
}

function beschreibe(stimme: SpeechSynthesisVoice | undefined): string {
  if (!stimme) return 'keine gefunden';
  return `${stimme.name} (${stimme.lang}${stimme.localService ? ', offline' : ', online'})`;
}
