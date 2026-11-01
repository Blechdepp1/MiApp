import { useEffect, useRef, useState } from 'react';
import { standardErkennung, type Erkennung, type ErkennungsFabrik } from './spracherkennung.ts';
import './Diktat.css';

const FEHLER: Record<string, string> = {
  'not-allowed': 'Das Mikrofon ist nicht erlaubt. Frag deine Eltern.',
  'service-not-allowed': 'Das Mikrofon ist nicht erlaubt. Frag deine Eltern.',
  'no-speech': 'Ich habe nichts gehört. Tipp noch einmal und sprich.',
  network: 'Für das Sprechen braucht das Handy Internet.',
};

// „🎤 Sprechen“: Gesprochenes wird als Text angehängt. Zeigt beim Sprechen live, was erkannt wird.
export function Diktat({
  onText,
  erkennung = standardErkennung(),
}: {
  onText: (text: string) => void;
  erkennung?: ErkennungsFabrik | null;
}) {
  const [hoert, setHoert] = useState(false);
  const [vorlaeufig, setVorlaeufig] = useState('');
  const [fehler, setFehler] = useState<string | null>(null);
  const laufend = useRef<Erkennung | null>(null);

  useEffect(() => () => laufend.current?.stop(), []);

  if (!erkennung) return null;

  function starten() {
    if (!erkennung) return;
    setFehler(null);
    const e = erkennung();
    e.lang = 'de-DE';
    e.interimResults = true;
    e.continuous = false;
    e.onresult = ({ resultIndex, results }) => {
      let zwischen = '';
      for (let i = resultIndex; i < results.length; i++) {
        const r = results[i]!;
        if (r.isFinal) onText(r[0].transcript.trim());
        else zwischen += r[0].transcript;
      }
      setVorlaeufig(zwischen);
    };
    e.onerror = ({ error }) => {
      if (error !== 'aborted') setFehler(FEHLER[error] ?? 'Das Sprechen hat nicht geklappt.');
    };
    e.onend = () => {
      laufend.current = null;
      setHoert(false);
      setVorlaeufig('');
    };
    laufend.current = e;
    setHoert(true);
    e.start();
  }

  return (
    <div className="diktat">
      <button
        type="button"
        className={hoert ? 'diktat-knopf diktat-aktiv' : 'diktat-knopf'}
        aria-pressed={hoert}
        onClick={() => (hoert ? laufend.current?.stop() : starten())}
      >
        <span aria-hidden="true">{hoert ? '⏹' : '🎤'}</span>{' '}
        {hoert ? 'Fertig gesprochen' : 'Sprechen'}
      </button>
      {hoert && (
        <p className="diktat-status" role="status">
          {vorlaeufig ? `„${vorlaeufig} …“` : 'Ich höre zu …'}
        </p>
      )}
      {fehler && (
        <p className="diktat-status" role="alert">
          {fehler}
        </p>
      )}
    </div>
  );
}
