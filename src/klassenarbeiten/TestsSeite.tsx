import { useId, useState, type ReactNode } from 'react';
import { Diktat } from '../basis/Diktat.tsx';
import { KANAL } from '../basis/kanal.ts';
import { Seite } from '../basis/Seite.tsx';
import { insBildHolen } from '../basis/sichtbarerBereich.ts';
import { VorleseKnopf } from '../basis/VorleseKnopf.tsx';
import { tagVon } from '../belohnung/logik.ts';
import { TEST_PUNKTE } from '../belohnung/werte.ts';
import type { TestArt, TestFach } from '../daten/ereignisse.ts';
import { useEreignisse, useProtokoll } from '../daten/ProtokollKontext.tsx';
import { istVokabelLektion, sortiereLektionen } from '../lektionen/lektion.ts';
import { useLektionen } from '../lektionen/LektionenKontext.tsx';
import {
  alleTests,
  ARTEN,
  artName,
  datumText,
  FAECHER,
  fachName,
  NOTEN,
  ohneNote,
  punkteFuerTest,
  sichtbareTests,
  type TestEintrag,
} from './logik.ts';
import './Tests.css';

const SPAETER_SCHLUESSEL = `${KANAL.speicherPraefix}-test-spaeter`;

function ladeSpaeter(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(SPAETER_SCHLUESSEL) ?? '{}') as Record<string, string>;
  } catch {
    return {};
  }
}

function speichereSpaeter(wert: Record<string, string>) {
  try {
    localStorage.setItem(SPAETER_SCHLUESSEL, JSON.stringify(wert));
  } catch {
    // dann fragt die App beim nächsten Öffnen eben wieder
  }
}

function beschreibe(t: TestEintrag): string {
  return `${artName(t.art)} in ${fachName(t.fach)} am ${datumText(t.datum)}${t.thema ? `: ${t.thema}` : ''}`;
}

// Milena trägt Klassenarbeiten und Tests ein und später die Note (SPEC 10a).
// Punkte gibt es für den Einsatz, nicht für die Note.
export function TestsSeite({ heute = tagVon(new Date().toISOString()) }: { heute?: string }) {
  const ereignisse = useEreignisse();
  const protokoll = useProtokoll();
  const [eintragen, setEintragen] = useState(false);
  // „Weiß ich noch nicht“: heute nicht mehr fragen, morgen wieder (auf diesem Gerät gemerkt)
  const [spaeter, setSpaeter] = useState<Record<string, string>>(ladeSpaeter);
  const [meldung, setMeldung] = useState<string | null>(null);

  if (!ereignisse) {
    return (
      <Seite titel="Meine Tests">
        <p>Einen Moment …</p>
      </Seite>
    );
  }

  const tests = sichtbareTests(alleTests(ereignisse));
  const fragen = ohneNote(tests, heute).filter((t) => spaeter[t.id] !== heute);
  const bald = tests.filter((t) => t.datum > heute).reverse();
  const mitNote = tests.filter((t) => t.note !== undefined);

  async function noteEintragen(t: TestEintrag, note: number) {
    await protokoll.hinzufuegen({ typ: 'test-ergebnis', testId: t.id, note });
    setMeldung(
      `Danke! Sobald deine Eltern die Note bestätigt haben, bekommst du ${TEST_PUNKTE.ergebnis} Punkte – egal welche Note.`,
    );
  }

  return (
    <Seite titel="Meine Tests" vorlesetext="Meine Tests und Klassenarbeiten">
      {meldung && (
        <div className="tests-meldung">
          <VorleseKnopf text={meldung} />
          <p role="status">{meldung}</p>
        </div>
      )}

      {fragen.map((t) => {
        const frage = `Wie lief dein Test? ${beschreibe(t)}`;
        return (
          <section key={t.id} className="tests-karte tests-frage">
            <div className="tests-zeile">
              <VorleseKnopf text={frage} />
              <h2>Wie lief dein Test?</h2>
            </div>
            <p>{beschreibe(t)}</p>
            <div className="tests-noten" role="group" aria-label="Welche Note hast du?">
              {NOTEN.map((n) => (
                <button key={n} type="button" onClick={() => noteEintragen(t, n)}>
                  {n}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="tests-leise"
              onClick={() => {
                const neu = { ...spaeter, [t.id]: heute };
                setSpaeter(neu);
                speichereSpaeter(neu);
              }}
            >
              Weiß ich noch nicht
            </button>
          </section>
        );
      })}

      {eintragen ? (
        <TestEintragen
          onFertig={(text) => {
            setEintragen(false);
            if (text) setMeldung(text);
          }}
        />
      ) : (
        <button
          type="button"
          className="tests-haupt"
          onClick={() => {
            setMeldung(null);
            setEintragen(true);
          }}
        >
          ➕ Test eintragen
        </button>
      )}

      <section className="tests-liste" aria-label="Bald">
        <div className="tests-zeile">
          <VorleseKnopf
            text={
              bald.length === 0
                ? 'Bald: Gerade ist kein Test eingetragen.'
                : `Bald: ${bald.map(beschreibe).join('. ')}`
            }
          />
          <h2>Bald</h2>
        </div>
        {bald.length === 0 ? (
          <p>Gerade ist kein Test eingetragen.</p>
        ) : (
          <ul>
            {bald.map((t) => (
              <li key={t.id}>
                <strong>{datumText(t.datum)}</strong> {artName(t.art)} in {fachName(t.fach)}
                {t.thema && ` · ${t.thema}`}
              </li>
            ))}
          </ul>
        )}
      </section>

      {mitNote.length > 0 && (
        <section className="tests-liste" aria-label="Schon geschrieben">
          <h2>Schon geschrieben</h2>
          <ul>
            {mitNote.map((t) => (
              <li key={t.id}>
                <strong>{datumText(t.datum)}</strong> {artName(t.art)} in {fachName(t.fach)} · Note{' '}
                {t.note} ·{' '}
                {t.bestaetigt ? `✓ +${punkteFuerTest(t)} Punkte` : '⏳ wartet auf Bestätigung'}
              </li>
            ))}
          </ul>
        </section>
      )}
    </Seite>
  );
}

function TestEintragen({ onFertig }: { onFertig: (meldung?: string) => void }) {
  const protokoll = useProtokoll();
  const lektionen = sortiereLektionen((useLektionen() ?? []).filter(istVokabelLektion));
  const [fach, setFach] = useState<TestFach | null>(null);
  const [art, setArt] = useState<TestArt>('klassenarbeit');
  const [datum, setDatum] = useState('');
  const [thema, setThema] = useState('');
  const [lektionId, setLektionId] = useState('');
  const [sendet, setSendet] = useState(false);
  const id = useId();

  async function speichern() {
    if (!fach || !datum || sendet) return;
    setSendet(true);
    try {
      const ereignis = await protokoll.hinzufuegen({
        typ: 'test-eingetragen',
        fach,
        art,
        datum,
        ...(thema.trim() && { thema: thema.trim() }),
        ...(fach === 'englisch' && lektionId && { lektionId }),
      });
      const punkte =
        alleTests(await protokoll.alle()).find((t) => t.id === ereignis.id)?.punkte.eintragen ?? 0;
      onFertig(
        punkte > 0
          ? `Super, eingetragen! +${punkte} Punkte. Nach dem Test fragt dich die App nach der Note.`
          : 'Super, eingetragen! Nach dem Test fragt dich die App nach der Note.',
      );
    } finally {
      setSendet(false);
    }
  }

  return (
    <section className="tests-karte" aria-label="Test eintragen">
      <div className="tests-zeile">
        <VorleseKnopf text="Welches Fach?" />
        <h2>Welches Fach?</h2>
      </div>
      <div className="tests-auswahl" role="group" aria-label="Fach">
        {FAECHER.map((f) => (
          <button
            key={f.fach}
            type="button"
            aria-pressed={fach === f.fach}
            onClick={() => setFach(f.fach)}
          >
            <span aria-hidden="true">{f.symbol}</span> {f.name}
          </button>
        ))}
      </div>

      <div className="tests-zeile">
        <VorleseKnopf text="Was für ein Test? Klassenarbeit, Test oder Vokabeltest." />
        <h2>Was für ein Test?</h2>
      </div>
      <div className="tests-auswahl" role="group" aria-label="Art">
        {ARTEN.map((a) => (
          <button
            key={a.art}
            type="button"
            aria-pressed={art === a.art}
            onClick={() => setArt(a.art)}
          >
            {a.name}
          </button>
        ))}
      </div>

      <Feld id={`${id}-datum`} titel="Wann?" vorlesen="Wann ist der Test?">
        <input
          id={`${id}-datum`}
          type="date"
          value={datum}
          onChange={(e) => setDatum(e.target.value)}
        />
      </Feld>

      <Feld
        id={`${id}-thema`}
        titel="Worum geht es? (freiwillig)"
        vorlesen="Worum geht es? Das musst du nicht ausfüllen. Du kannst auch auf Sprechen tippen und es sagen."
      >
        <Diktat onText={(t) => setThema((alt) => (alt ? `${alt} ${t}` : t).slice(0, 80))} />
        <input
          id={`${id}-thema`}
          value={thema}
          maxLength={80}
          onChange={(e) => setThema(e.target.value)}
          onFocus={(e) => insBildHolen(e.currentTarget)}
        />
      </Feld>

      {fach === 'englisch' && lektionen.length > 0 && (
        <Feld
          id={`${id}-lektion`}
          titel="Welche Lektion kommt dran?"
          vorlesen="Welche Lektion kommt dran? Dann übst du diese Wörter vorher öfter."
        >
          <select
            id={`${id}-lektion`}
            value={lektionId}
            onChange={(e) => setLektionId(e.target.value)}
          >
            <option value="">Weiß ich nicht</option>
            {lektionen.map((l) => (
              <option key={l.id} value={l.id}>
                {l.titel}
              </option>
            ))}
          </select>
        </Feld>
      )}

      <button
        type="button"
        className="tests-haupt"
        disabled={!fach || !datum || sendet}
        onClick={speichern}
      >
        Eintragen
      </button>
      <button type="button" className="tests-leise" onClick={() => onFertig()}>
        Abbrechen
      </button>
    </section>
  );
}

// Beschriftetes Eingabefeld; der Vorlese-Knopf steht neben der Beschriftung, nicht darin
function Feld({
  id,
  titel,
  vorlesen,
  children,
}: {
  id: string;
  titel: string;
  vorlesen: string;
  children: ReactNode;
}) {
  return (
    <div className="tests-feld">
      <div className="tests-zeile">
        <VorleseKnopf text={vorlesen} />
        <label htmlFor={id}>
          <strong>{titel}</strong>
        </label>
      </div>
      {children}
    </div>
  );
}
