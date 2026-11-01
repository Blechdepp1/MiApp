import { useState, type FormEvent } from 'react';
import { VorleseKnopf } from '../basis/VorleseKnopf.tsx';
import { bewerteSchreiben, hauptform, unterschiede } from './bewertung.ts';
import { sprechtext } from './runde.ts';
import type { Vokabel } from './typen.ts';

// Lösung mit sanft markierten Stellen, die anders waren (unterstrichen, nicht rot)
export function MarkierteLoesung({ eingabe, loesung }: { eingabe: string; loesung: string }) {
  return (
    <span className="schreib-vergleich" lang="en">
      {unterschiede(eingabe, loesung).map((b, i) =>
        b.anders ? (
          <span key={i} className="schreib-anders">
            {b.zeichen}
          </span>
        ) : (
          <span key={i}>{b.zeichen}</span>
        ),
      )}
    </span>
  );
}

const ANLEITUNG =
  'Schau es dir an und sprich es. Dann verstecken wir es, und du schreibst es noch einmal.';

type Schritt = 'ansehen' | 'schreiben' | 'geschafft' | 'nochmal';

// Nach einem Schreibfehler: Fehlerstelle zeigen, dann freiwillig aus dem Kopf nachschreiben
// (ansehen – abdecken – schreiben – vergleichen). Ändert weder Punkte noch Lernstand.
export function Nachschreiben({ eingabe, wort }: { eingabe: string; wort: Vokabel }) {
  const ziel = hauptform(wort.en);
  const [schritt, setSchritt] = useState<Schritt>('ansehen');
  const [versuch, setVersuch] = useState('');
  const [letzter, setLetzter] = useState(eingabe);

  function pruefen(e: FormEvent) {
    e.preventDefault();
    if (!versuch.trim()) return;
    setLetzter(versuch.trim());
    setSchritt(bewerteSchreiben(versuch, wort.en) === 'richtig' ? 'geschafft' : 'nochmal');
    setVersuch('');
  }

  if (schritt === 'schreiben') {
    return (
      <form className="nachschreiben" onSubmit={pruefen}>
        <p>
          <VorleseKnopf text={`Schreib ${wort.de} auf Englisch.`} />
          <span>Jetzt du – aus dem Kopf:</span>
        </p>
        <input
          aria-label="Wort noch einmal schreiben"
          lang="en"
          value={versuch}
          autoFocus
          autoCapitalize="none"
          autoComplete="off"
          spellCheck={false}
          onChange={(e) => setVersuch(e.target.value)}
        />
        <button type="submit" className="schreib-hilfe" disabled={!versuch.trim()}>
          Vergleichen
        </button>
      </form>
    );
  }

  if (schritt === 'geschafft') {
    return (
      <p className="nachschreiben">
        <VorleseKnopf text="Super, jetzt hast du es richtig geschrieben!" />
        <span>✓ Super, jetzt richtig geschrieben!</span>
      </p>
    );
  }

  return (
    <div className="nachschreiben">
      <p>
        <span>Du: </span>
        <span lang="en">{letzter}</span>
      </p>
      <p className="runde-loesung">
        <VorleseKnopf text={sprechtext(wort.en)} sprache="en" />
        <MarkierteLoesung eingabe={letzter} loesung={ziel} />
      </p>
      <p>
        <VorleseKnopf text={ANLEITUNG} />
        <span>{ANLEITUNG}</span>
      </p>
      <button type="button" className="schreib-hilfe" onClick={() => setSchritt('schreiben')}>
        {schritt === 'nochmal' ? 'Noch einmal versuchen' : 'Bereit'}
      </button>
    </div>
  );
}
