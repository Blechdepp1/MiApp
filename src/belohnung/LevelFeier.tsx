import { useEffect, useRef, useState } from 'react';
import { useEinstellungen } from '../basis/EinstellungenKontext.tsx';
import { vorlesen } from '../basis/vorlesen.ts';
import { Dialog } from '../basis/Dialog.tsx';
import { VorleseKnopf } from '../basis/VorleseKnopf.tsx';
import { useInhalt } from '../daten/InhalteKontext.tsx';
import { useEreignisse } from '../daten/ProtokollKontext.tsx';
import { dexieWert, type GespeicherterWert } from '../daten/schluesselWert.ts';
import { gesamtPunkte, level, rang } from './logik.ts';
import { spieleFanfare } from './ton.ts';
import './Belohnung.css';

const standardGesehen = dexieWert<number>('gesehenes-level');

// Feiert jeden Level-Aufstieg (und jeden neuen Stern) genau einmal, egal auf welcher Seite
export function LevelFeier({
  gesehen = standardGesehen,
  ton = spieleFanfare,
}: {
  gesehen?: GespeicherterWert<number>;
  ton?: () => void;
}) {
  const ereignisse = useEreignisse();
  const { einstellungen } = useEinstellungen();
  const [gesehenerRang, setGesehenerRang] = useState<number | null>(null);
  const knopf = useRef<HTMLButtonElement>(null);
  const [stufen] = useInhalt('level');
  const aktuell = ereignisse ? level(gesamtPunkte(ereignisse), stufen) : null;
  const aktuellerRang = aktuell ? rang(aktuell) : null;

  useEffect(() => {
    if (aktuellerRang === null || gesehenerRang !== null) return;
    let aktiv = true;
    gesehen.laden().then((wert) => {
      if (!aktiv) return;
      // Beim allerersten Start nichts feiern, nur den Stand merken
      if (wert === undefined) gesehen.speichern(aktuellerRang);
      setGesehenerRang(wert ?? aktuellerRang);
    });
    return () => {
      aktiv = false;
    };
  }, [aktuellerRang, gesehen, gesehenerRang]);

  const feiern = aktuell !== null && gesehenerRang !== null && aktuellerRang! > gesehenerRang;
  // Gleiches Level wie zuletzt gesehen, aber mehr Sterne
  const nurStern = feiern && Math.floor(gesehenerRang / 1000) === aktuell.nummer;
  const ueberschrift = nurStern ? 'Neuer Stern!' : 'Neues Level!';
  const text = !feiern
    ? ''
    : nurStern
      ? `Neuer Stern! Du hast jetzt ${aktuell.sterne} Sterne als ${aktuell.titel}!`
      : `Neues Level! Du bist jetzt Level ${aktuell.nummer}: ${aktuell.titel}!`;

  useEffect(() => {
    if (!text) return;
    ton();
    vorlesen(text, 'de', { tempo: einstellungen.tempo });
    knopf.current?.focus();
  }, [text, ton, einstellungen.tempo]);

  if (!feiern) return null;

  function schliessen() {
    setGesehenerRang(aktuellerRang);
    gesehen.speichern(aktuellerRang!);
  }

  return (
    <Dialog
      className="feier"
      beschriftetVon="feier-titel"
      startFokus={knopf}
      onAbbrechen={schliessen}
    >
      <div className="feier-konfetti" aria-hidden="true">
        {Array.from({ length: 14 }, (_, i) => (
          <span
            key={i}
            style={{ left: `${(i * 7.3) % 100}%`, animationDelay: `${(i % 5) * 0.25}s` }}
          >
            {['⭐', '🎉', '✨'][i % 3]}
          </span>
        ))}
      </div>
      <div className="feier-karte">
        <p className="feier-symbol" aria-hidden="true">
          🏆
        </p>
        <h2 id="feier-titel">{ueberschrift}</h2>
        <p className="feier-text">
          <VorleseKnopf text={text} />
          <span>
            Level {aktuell.nummer}: <strong>{aktuell.titel}</strong>
            {aktuell.sterne > 0 && ` ${'★'.repeat(aktuell.sterne)}`}
          </span>
        </p>
        <button ref={knopf} type="button" className="runde-weiter" onClick={schliessen}>
          Juhu! 🎉
        </button>
      </div>
    </Dialog>
  );
}
