import type { CSSProperties } from 'react';
import { TEMPO_MAX, TEMPO_MIN, type Einstellungen as Werte } from './einstellungen.ts';
import { useEinstellungen } from './EinstellungenKontext.tsx';
import { FARBEN } from './thema.ts';
import { VorleseKnopf } from './VorleseKnopf.tsx';
import './Einstellungen.css';

type Option<T extends string> = { wert: T; text: string; stil?: CSSProperties };

const GROESSEN: Option<Werte['schriftgroesse']>[] = [
  { wert: 'normal', text: 'Normal', stil: { fontSize: '20px' } },
  { wert: 'gross', text: 'Groß', stil: { fontSize: '24px' } },
  { wert: 'sehr-gross', text: 'Sehr groß', stil: { fontSize: '28px' } },
];

const ABSTAENDE: Option<Werte['abstand']>[] = [
  { wert: 'normal', text: 'Normal', stil: { letterSpacing: '0.03em' } },
  { wert: 'weit', text: 'Weit', stil: { letterSpacing: '0.12em' } },
];

const HINTERGRUENDE: Option<Werte['hintergrund']>[] = (
  [
    ['creme', 'Creme'],
    ['weiss', 'Weiß'],
    ['hellblau', 'Hellblau'],
    ['dunkel', 'Dunkel'],
  ] as const
).map(([wert, text]) => ({
  wert,
  text,
  stil: { background: FARBEN[wert].hintergrund, color: FARBEN[wert].text },
}));

const SCHRIFTEN: Option<Werte['schrift']>[] = [
  { wert: 'standard', text: 'Standard', stil: { fontFamily: "'Atkinson Hyperlegible Next'" } },
  { wert: 'opendyslexic', text: 'OpenDyslexic', stil: { fontFamily: "'OpenDyslexic'" } },
];

const VORSCHAU = 'Der Hund läuft über die Wiese. Die Biene fliegt zur Blume.';

export function Einstellungen() {
  const { einstellungen, aendern } = useEinstellungen();

  return (
    <section className="einstellungen">
      <div className="einstellungen-vorschau" aria-label="Vorschau">
        <VorleseKnopf text={VORSCHAU} />
        <p>{VORSCHAU}</p>
      </div>

      <Auswahl
        titel="Schriftgröße"
        optionen={GROESSEN}
        wert={einstellungen.schriftgroesse}
        waehlen={(schriftgroesse) => aendern({ schriftgroesse })}
      />
      <Auswahl
        titel="Abstand"
        optionen={ABSTAENDE}
        wert={einstellungen.abstand}
        waehlen={(abstand) => aendern({ abstand })}
      />
      <Auswahl
        titel="Hintergrund"
        optionen={HINTERGRUENDE}
        wert={einstellungen.hintergrund}
        waehlen={(hintergrund) => aendern({ hintergrund })}
      />
      <Auswahl
        titel="Schrift"
        optionen={SCHRIFTEN}
        wert={einstellungen.schrift}
        waehlen={(schrift) => aendern({ schrift })}
      />

      <div className="einstellungen-gruppe">
        <Titel
          text="Vorlese-Tempo"
          vorlesetext="Vorlese-Tempo. Schieb nach links für langsamer, nach rechts für schneller."
        />
        <div className="einstellungen-tempo">
          <span aria-hidden="true">🐢</span>
          <input
            type="range"
            aria-label="Vorlese-Tempo"
            min={TEMPO_MIN}
            max={TEMPO_MAX}
            step="0.1"
            value={einstellungen.tempo}
            onChange={(e) => aendern({ tempo: Number(e.target.value) })}
          />
          <span aria-hidden="true">🐇</span>
        </div>
      </div>
    </section>
  );
}

function Titel({ text, vorlesetext }: { text: string; vorlesetext?: string }) {
  return (
    <div className="einstellungen-titel">
      <h2>{text}</h2>
      <VorleseKnopf text={vorlesetext ?? text} />
    </div>
  );
}

function Auswahl<T extends string>({
  titel,
  optionen,
  wert,
  waehlen,
}: {
  titel: string;
  optionen: Option<T>[];
  wert: T;
  waehlen: (wert: T) => void;
}) {
  const vorlesetext = `${titel}. Du kannst wählen: ${optionen.map((o) => o.text).join(', ')}.`;
  return (
    <div className="einstellungen-gruppe">
      <Titel text={titel} vorlesetext={vorlesetext} />
      <div role="radiogroup" aria-label={titel} className="einstellungen-optionen">
        {optionen.map((o) => (
          <button
            key={o.wert}
            type="button"
            role="radio"
            aria-checked={o.wert === wert}
            style={o.stil}
            onClick={() => waehlen(o.wert)}
          >
            {o.text}
          </button>
        ))}
      </div>
    </div>
  );
}
