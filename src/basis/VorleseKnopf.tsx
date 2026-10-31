import { useId, useState, useSyncExternalStore } from 'react';
import { beobachteVorlesen, liestGerade, stoppen, vorlesen, type Sprache } from './vorlesen.ts';
import './VorleseKnopf.css';

const HINWEIS: Record<Sprache, string> = {
  de: 'Keine deutsche Stimme auf diesem Gerät',
  en: 'Keine englische Stimme auf diesem Gerät',
};

type Props = {
  text: string;
  sprache?: Sprache;
  tempo?: number;
};

export function VorleseKnopf({ text, sprache = 'de', tempo }: Props) {
  const id = useId();
  const aktiv = useSyncExternalStore(beobachteVorlesen, liestGerade) === id;
  const [hinweis, setHinweis] = useState<string | null>(null);

  async function tippen() {
    if (aktiv) {
      stoppen();
      return;
    }
    setHinweis(null);
    const ergebnis = await vorlesen(text, sprache, { id, tempo });
    if (ergebnis === 'keine-stimme') setHinweis(HINWEIS[sprache]);
    if (ergebnis === 'nicht-verfuegbar') setHinweis('Vorlesen geht in diesem Browser nicht');
  }

  return (
    <span className="vorlese-knopf">
      <button
        type="button"
        onClick={tippen}
        aria-label={aktiv ? 'Vorlesen stoppen' : 'Vorlesen'}
        aria-pressed={aktiv}
      >
        {aktiv ? <StoppSymbol /> : <LautsprecherSymbol />}
      </button>
      {hinweis && (
        <span className="vorlese-hinweis" role="status">
          <LautsprecherSymbol durchgestrichen /> {hinweis}
        </span>
      )}
    </span>
  );
}

function LautsprecherSymbol({ durchgestrichen = false }: { durchgestrichen?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true">
      <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
      {durchgestrichen ? (
        <path d="M3 3l18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      ) : (
        <>
          <path d="M16 9q2 3 0 6" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M18.5 6.5q4 5.5 0 11" fill="none" stroke="currentColor" strokeWidth="2" />
        </>
      )}
    </svg>
  );
}

function StoppSymbol() {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true">
      <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
    </svg>
  );
}
