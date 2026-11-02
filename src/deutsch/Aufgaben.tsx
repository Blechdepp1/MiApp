import { useState, type FormEvent } from 'react';
import { insBildHolen } from '../basis/sichtbarerBereich.ts';
import { VorleseKnopf } from '../basis/VorleseKnopf.tsx';
import {
  bewerteAntippen,
  bewerteSchreiben,
  bewerteWaehlen,
  woerterIm,
  type Hinweis,
} from './bewertung.ts';
import type { AntippAufgabe, SchreibAufgabe, WaehlAufgabe } from './typen.ts';

export type DeutschAntwort = {
  richtig: boolean;
  mitHilfe: boolean;
  hinweis?: Hinweis;
  // Was sie geschrieben hat (für die markierte Fehlerstelle)
  eingabe?: string;
};

// Der Tipp (Prüffrage) vor dem Antworten: freiwillig, zählt dann als „mit Hilfe“
function Tipp({ hilfe, onGezeigt }: { hilfe?: string; onGezeigt: () => void }) {
  const [offen, setOffen] = useState(false);
  if (!hilfe) return null;
  if (!offen)
    return (
      <button
        type="button"
        className="schreib-hilfe deutsch-tipp-knopf"
        onClick={() => {
          setOffen(true);
          onGezeigt();
        }}
      >
        💡 Tipp
      </button>
    );
  return (
    <p className="deutsch-tipp">
      <VorleseKnopf text={hilfe} />
      <span>💡 {hilfe}</span>
    </p>
  );
}

// Frage und Inhalt: vorlesbar per Knopf, aber nicht automatisch – lesen übt sie selbst
function Kopf({ frage, inhalt }: { frage: string; inhalt?: string }) {
  return (
    <>
      <p className="uebung-anweisung">
        <VorleseKnopf text={frage} />
        <span>{frage}</span>
      </p>
      {inhalt && (
        <div className="uebung-frage deutsch-inhalt">
          <VorleseKnopf text={inhalt.replace(/…/g, 'Lücke')} />
          <span>{inhalt}</span>
        </div>
      )}
    </>
  );
}

export function AufgabeWaehlen({
  aufgabe,
  onAntwort,
}: {
  aufgabe: WaehlAufgabe;
  onAntwort: (a: DeutschAntwort) => void;
}) {
  const [gewaehlt, setGewaehlt] = useState<string | null>(null);
  const [tipp, setTipp] = useState(false);
  return (
    <div className="uebung">
      <Kopf frage={aufgabe.frage} inhalt={aufgabe.inhalt} />
      <ul className="uebung-optionen deutsch-optionen">
        {aufgabe.optionen.map((o) => {
          const zustand = !gewaehlt
            ? undefined
            : aufgabe.richtig.includes(o)
              ? 'richtig'
              : o === gewaehlt
                ? 'daneben'
                : 'aus';
          return (
            <li key={o}>
              <button
                type="button"
                className="uebung-option"
                data-zustand={zustand}
                disabled={gewaehlt !== null}
                onClick={() => {
                  setGewaehlt(o);
                  onAntwort({ richtig: bewerteWaehlen(o, aufgabe), mitHilfe: tipp });
                }}
              >
                {zustand === 'richtig' && <span aria-hidden="true">✓ </span>}
                {o}
              </button>
            </li>
          );
        })}
      </ul>
      {!gewaehlt && <Tipp hilfe={aufgabe.hilfe} onGezeigt={() => setTipp(true)} />}
    </div>
  );
}

export function AufgabeSchreiben({
  aufgabe,
  onAntwort,
}: {
  aufgabe: SchreibAufgabe;
  onAntwort: (a: DeutschAntwort) => void;
}) {
  const [eingabe, setEingabe] = useState('');
  const [fertig, setFertig] = useState(false);
  const [tipp, setTipp] = useState(false);

  function pruefen(e: FormEvent) {
    e.preventDefault();
    if (fertig || !eingabe.trim()) return;
    setFertig(true);
    const ergebnis = bewerteSchreiben(eingabe, aufgabe);
    onAntwort({ ...ergebnis, mitHilfe: tipp, eingabe: eingabe.trim() });
  }

  return (
    <form className="uebung" onSubmit={pruefen}>
      <Kopf frage={aufgabe.frage} inhalt={aufgabe.inhalt} />
      <label className="schreib-feld">
        <span className="unsichtbar">Deine Antwort</span>
        {/* Keine automatische Großschreibung: groß oder klein ist hier Teil der Aufgabe */}
        <input
          type="text"
          lang="de"
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
      </div>
      {!fertig && <Tipp hilfe={aufgabe.hilfe} onGezeigt={() => setTipp(true)} />}
    </form>
  );
}

export function AufgabeAntippen({
  aufgabe,
  onAntwort,
}: {
  aufgabe: AntippAufgabe;
  onAntwort: (a: DeutschAntwort) => void;
}) {
  const woerter = woerterIm(aufgabe.satz);
  const [gewaehlt, setGewaehlt] = useState<number[]>([]);
  const [fertig, setFertig] = useState(false);
  const [tipp, setTipp] = useState(false);

  function umschalten(i: number) {
    if (fertig) return;
    setGewaehlt((g) => (g.includes(i) ? g.filter((x) => x !== i) : [...g, i]));
  }

  function pruefen() {
    setFertig(true);
    onAntwort({ richtig: bewerteAntippen(gewaehlt, aufgabe), mitHilfe: tipp });
  }

  return (
    <div className="uebung">
      <Kopf frage={aufgabe.frage} />
      <div className="deutsch-satz">
        <VorleseKnopf text={aufgabe.satz} />
        <div className="deutsch-woerter" role="group" aria-label="Wörter im Satz">
          {woerter.map((w, i) => {
            const zustand = !fertig
              ? undefined
              : aufgabe.richtig.includes(i)
                ? 'richtig'
                : gewaehlt.includes(i)
                  ? 'daneben'
                  : undefined;
            return (
              <button
                key={i}
                type="button"
                className="deutsch-wort"
                aria-pressed={gewaehlt.includes(i)}
                data-zustand={zustand}
                disabled={fertig}
                onClick={() => umschalten(i)}
              >
                {w}
              </button>
            );
          })}
        </div>
      </div>
      {!fertig && (
        <>
          <div className="schreib-knoepfe">
            <button
              type="button"
              className="runde-weiter"
              disabled={gewaehlt.length === 0}
              onClick={pruefen}
            >
              Prüfen
            </button>
          </div>
          <Tipp hilfe={aufgabe.hilfe} onGezeigt={() => setTipp(true)} />
        </>
      )}
    </div>
  );
}
