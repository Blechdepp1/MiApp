import { useEffect, useRef, useState } from 'react';
import { zielAusHash } from '../basis/navigation.ts';
import { VERSION_TEXT } from '../basis/version.ts';
import { VorleseKnopf } from '../basis/VorleseKnopf.tsx';
import { useProtokoll } from '../daten/ProtokollKontext.tsx';
import type { Stimmung } from '../daten/ereignisse.ts';
import { geraetInfo, STIMMUNGEN } from './logik.ts';
import './SagUnsWas.css';

const FRAGE = 'Wie gefällt dir MiApp gerade?';
const SATZ =
  'Willst du uns noch etwas sagen? Du musst nicht tippen: Tipp auf das Mikrofon auf der Tastatur und sprich.';
const DANKE = 'Danke! Wir lesen das ganz bestimmt.';

// „Sag uns was“: Smiley antippen, optional einen Satz diktieren – ohne tippen zu müssen
export function SagUnsWas() {
  const [offen, setOffen] = useState(false);
  return (
    <>
      <button type="button" className="sag-uns-was-knopf" onClick={() => setOffen(true)}>
        <span aria-hidden="true">💬</span> Sag uns was
      </button>
      {offen && <SagUnsWasDialog onSchliessen={() => setOffen(false)} />}
    </>
  );
}

function SagUnsWasDialog({ onSchliessen }: { onSchliessen: () => void }) {
  const protokoll = useProtokoll();
  const [stimmung, setStimmung] = useState<Stimmung | null>(null);
  const [text, setText] = useState('');
  const [gesendet, setGesendet] = useState(false);
  const [sendet, setSendet] = useState(false);
  const erster = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    erster.current?.focus();
  }, []);

  async function abschicken() {
    if (sendet) return;
    setSendet(true);
    try {
      await protokoll.hinzufuegen({
        typ: 'feedback',
        art: 'rueckmeldung',
        ...(stimmung && { stimmung }),
        ...(text.trim() && { text: text.trim() }),
        seite: zielAusHash(window.location.hash),
        version: VERSION_TEXT,
        geraetInfo: geraetInfo(navigator.userAgent),
      });
      setGesendet(true);
    } finally {
      setSendet(false);
    }
  }

  return (
    <div className="aufhoeren" role="dialog" aria-modal="true" aria-label="Sag uns was">
      <div className="aufhoeren-karte sag-uns-was">
        {gesendet ? (
          <>
            <p className="aufhoeren-symbol" aria-hidden="true">
              💛
            </p>
            <div className="sag-uns-was-zeile">
              <VorleseKnopf text={DANKE} />
              <p role="status">{DANKE}</p>
            </div>
            <button type="button" className="sag-uns-was-haupt" onClick={onSchliessen}>
              Schließen
            </button>
          </>
        ) : (
          <>
            <div className="sag-uns-was-zeile">
              <VorleseKnopf text={FRAGE} />
              <h2>{FRAGE}</h2>
            </div>
            <div className="sag-uns-was-smileys" role="group" aria-label="Wie gefällt dir MiApp?">
              {STIMMUNGEN.map((s, i) => (
                <button
                  key={s.stimmung}
                  ref={i === 0 ? erster : undefined}
                  type="button"
                  aria-label={s.name}
                  aria-pressed={stimmung === s.stimmung}
                  onClick={() => setStimmung(s.stimmung)}
                >
                  {s.symbol}
                </button>
              ))}
            </div>
            <div className="sag-uns-was-zeile">
              <VorleseKnopf text={SATZ} />
              <label htmlFor="sag-uns-was-text">Willst du noch etwas sagen? 🎤</label>
            </div>
            <textarea
              id="sag-uns-was-text"
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <button
              type="button"
              className="sag-uns-was-haupt"
              disabled={(!stimmung && !text.trim()) || sendet}
              onClick={abschicken}
            >
              Abschicken
            </button>
            <button type="button" onClick={onSchliessen}>
              Abbrechen
            </button>
          </>
        )}
      </div>
    </div>
  );
}
