import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useEinstellungen } from '../basis/EinstellungenKontext.tsx';
import { insBildHolen } from '../basis/sichtbarerBereich.ts';
import { vorlesen } from '../basis/vorlesen.ts';
import { VorleseKnopf } from '../basis/VorleseKnopf.tsx';
import { bewerteSchreiben, hauptform, type Bewertung } from './bewertung.ts';
import { sprechtext } from './runde.ts';
import type { Vokabel } from './typen.ts';

export type SchreibErgebnis = { bewertung: Bewertung; mitHilfe: boolean; eingabe: string };

// Deutsches Wort sehen und hören, englisches Wort schreiben; Kästchen zeigen die Länge
export function UebungSchreiben({
  wort,
  onAntwort,
}: {
  wort: Vokabel;
  onAntwort: (ergebnis: SchreibErgebnis) => void;
}) {
  const { einstellungen } = useEinstellungen();
  const ziel = hauptform(wort.en);
  const [eingabe, setEingabe] = useState('');
  const [aufgedeckt, setAufgedeckt] = useState(0);
  const [fertig, setFertig] = useState(false);
  const feld = useRef<HTMLInputElement>(null);
  const anweisung = 'Schreib das Wort auf Englisch.';
  const buchstabenGesamt = ziel.replace(/ /g, '').length;

  useEffect(() => {
    vorlesen(wort.de, 'de', { tempo: einstellungen.tempo });
  }, [wort.de, einstellungen.tempo]);

  function hilfe() {
    // Deckt den nächsten Buchstaben auf (Leerzeichen werden übersprungen)
    let n = aufgedeckt + 1;
    while (ziel[n - 1] === ' ') n++;
    setAufgedeckt(Math.min(n, ziel.length));
    feld.current?.focus();
  }

  function pruefen(e: FormEvent) {
    e.preventDefault();
    if (fertig || !eingabe.trim()) return;
    setFertig(true);
    onAntwort({
      bewertung: bewerteSchreiben(eingabe, wort.en),
      mitHilfe: aufgedeckt > 0,
      eingabe: eingabe.trim(),
    });
  }

  return (
    <form className="uebung" onSubmit={pruefen}>
      <p className="uebung-anweisung">
        <VorleseKnopf text={anweisung} />
        <span>{anweisung}</span>
      </p>

      <div className="uebung-frage">
        <VorleseKnopf text={wort.de} />
        <span>{wort.de}</span>
      </div>

      <div
        className="schreib-kaestchen"
        aria-label={`Das Wort hat ${buchstabenGesamt} Buchstaben`}
        lang="en"
      >
        {[...ziel].map((z, i) =>
          z === ' ' ? (
            <span key={i} className="schreib-luecke" />
          ) : (
            <span key={i} className="schreib-kasten">
              {i < aufgedeckt ? z : ''}
            </span>
          ),
        )}
      </div>

      <label className="schreib-feld">
        <span className="unsichtbar">Englisches Wort</span>
        <input
          ref={feld}
          type="text"
          lang="en"
          value={eingabe}
          onChange={(e) => setEingabe(e.target.value)}
          disabled={fertig}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          enterKeyHint="go"
          placeholder="Hier schreiben …"
          onFocus={(e) =>
            insBildHolen(e.currentTarget.closest('form') ?? e.currentTarget, 300, 'end')
          }
        />
      </label>

      <div className="schreib-knoepfe">
        <button type="submit" className="runde-weiter" disabled={fertig || !eingabe.trim()}>
          Prüfen
        </button>
        <button
          type="button"
          className="schreib-hilfe"
          onClick={hilfe}
          disabled={fertig || aufgedeckt >= ziel.length}
        >
          💡 Hilfe
        </button>
        <button
          type="button"
          className="schreib-hilfe"
          onClick={() => vorlesen(sprechtext(wort.en), 'en', { tempo: einstellungen.tempo })}
          disabled={fertig}
        >
          🔊 Englisch anhören
        </button>
      </div>
    </form>
  );
}
