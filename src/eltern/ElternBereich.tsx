import { useEffect, useState, type ReactNode } from 'react';
import { IST_VORSCHAU } from '../basis/kanal.ts';
import { Seite } from '../basis/Seite.tsx';
import { Version } from '../basis/Version.tsx';
import { VERSION_TEXT } from '../basis/version.ts';
import { tagVon } from '../belohnung/logik.ts';
import { useInhalt } from '../daten/InhalteKontext.tsx';
import { useEreignisse } from '../daten/ProtokollKontext.tsx';
import { rueckmeldungen } from '../feedback/logik.ts';
import { alleTests, datumText, zuBestaetigen } from '../klassenarbeiten/logik.ts';
import { statusVon } from '../lektionen/lektion.ts';
import { useLektionen } from '../lektionen/LektionenKontext.tsx';
import type { Dropbox } from '../sync/dropbox.ts';
import { useSync } from '../sync/SyncKontext.tsx';
import { SyncStatus } from '../sync/SyncStatus.tsx';
import { DropboxVerbinden } from '../sync/Verbinden.tsx';
import { BelohnungenVerwalten } from './BelohnungenVerwalten.tsx';
import { Einloesungen, useOffeneEinloesungen } from './Einloesungen.tsx';
import { ElternTuer } from './ElternTuer.tsx';
import { useGeraet } from './GeraetKontext.tsx';
import { standardKiSchluessel } from './ki.ts';
import { KiEinstellungen } from './KiEinstellungen.tsx';
import { Lektionen } from './Lektionen.tsx';
import { LevelVerwalten } from './LevelVerwalten.tsx';
import { zeitText } from './liveKopie.ts';
import { LiveDatenUebernehmen, useKopieStand } from './LiveDatenUebernehmen.tsx';
import { Rueckmeldungen } from './Rueckmeldungen.tsx';
import { TestUebersicht } from './TestUebersicht.tsx';
import './ElternBereich.css';

// Aufbau wie die Einstellungen von Android und iOS: eine Übersicht mit Gruppen, jede Zeile zeigt
// ihren aktuellen Stand und öffnet eine eigene Unterseite. Die Unterseite steht im Verlauf,
// so führen die Zurück-Taste und „Zurück“ zur Übersicht, und nach dem Neuladen bleibt sie offen.
type Bereich =
  | 'einloesungen'
  | 'tests'
  | 'rueckmeldungen'
  | 'lektionen'
  | 'belohnungen'
  | 'level'
  | 'dropbox'
  | 'ki'
  | 'testkanal'
  | 'version';

const TITEL: Record<Bereich, string> = {
  einloesungen: 'Einlösungen',
  tests: 'Tests & Klassenarbeiten',
  rueckmeldungen: 'Rückmeldungen',
  lektionen: 'Lektionen',
  belohnungen: 'Belohnungen',
  level: 'Level & Titel',
  dropbox: 'Dropbox & Abgleich',
  ki: 'KI (Claude)',
  testkanal: 'Daten aus Milenas App',
  version: 'Version & Neuigkeiten',
};

type VerlaufMitBereich = { elternBereich?: Bereich } | null;

function bereichAusVerlauf(): Bereich | null {
  return (window.history.state as VerlaufMitBereich)?.elternBereich ?? null;
}

function useBereich(): [Bereich | null, (b: Bereich) => void] {
  const [bereich, setBereich] = useState<Bereich | null>(bereichAusVerlauf);
  useEffect(() => {
    const beiZurueck = () => setBereich(bereichAusVerlauf());
    window.addEventListener('popstate', beiZurueck);
    return () => window.removeEventListener('popstate', beiZurueck);
  }, []);
  useEffect(() => {
    window.scrollTo?.(0, 0);
  }, [bereich]);

  function oeffne(b: Bereich) {
    // Bisherigen Zustand behalten (z. B. „über der Startseite“), damit „Zurück“ zur Übersicht führt
    window.history.pushState(
      { ...window.history.state, elternBereich: b },
      '',
      window.location.href,
    );
    setBereich(b);
  }
  return [bereich, oeffne];
}

export function ElternBereich({ dropbox }: { dropbox: Dropbox }) {
  const [bereich, oeffne] = useBereich();
  return (
    <Seite
      titel={bereich ? TITEL[bereich] : 'Eltern-Bereich'}
      zurueck={
        bereich ? { text: 'Eltern-Bereich', onClick: () => window.history.back() } : undefined
      }
    >
      <ElternTuer>
        {bereich ? (
          <div className="eltern-unterseite">
            <Unterseite bereich={bereich} dropbox={dropbox} />
          </div>
        ) : (
          <Uebersicht oeffne={oeffne} />
        )}
      </ElternTuer>
    </Seite>
  );
}

function Unterseite({ bereich, dropbox }: { bereich: Bereich; dropbox: Dropbox }) {
  const { abgleichen } = useSync();
  switch (bereich) {
    case 'einloesungen':
      return <Einloesungen />;
    case 'tests':
      return <TestUebersicht />;
    case 'rueckmeldungen':
      return <Rueckmeldungen />;
    case 'lektionen':
      return <Lektionen />;
    case 'belohnungen':
      return <BelohnungenVerwalten />;
    case 'level':
      return <LevelVerwalten />;
    case 'dropbox':
      return (
        <>
          <DropboxVerbinden dropbox={dropbox} onAenderung={abgleichen} />
          <SyncStatus />
        </>
      );
    case 'ki':
      return <KiEinstellungen />;
    case 'testkanal':
      return <LiveDatenUebernehmen />;
    case 'version':
      return <Version />;
  }
}

function Uebersicht({ oeffne }: { oeffne: (b: Bereich) => void }) {
  const { geraet } = useGeraet();
  const offen = useOffeneEinloesungen();
  const ereignisse = useEreignisse() ?? [];
  const tests = alleTests(ereignisse);
  const noten = zuBestaetigen(tests).length;
  const neueRueckmeldungen = rueckmeldungen(ereignisse).filter((r) => !r.erledigt).length;
  const lektionen = (useLektionen() ?? []).filter((l) => !l.geloescht);
  const [belohnungen] = useInhalt('belohnungen');
  const [stufen] = useInhalt('level');
  const sync = useSync();
  const kiSchluessel = useKiSchluesselDa();
  const kopie = useKopieStand();
  const istEltern = geraet?.rolle === 'eltern';
  const dran = lektionen.filter((l) => statusVon(l) === 'aktiv').length;
  const heute = tagVon(new Date().toISOString());
  const naechster = [...tests].reverse().find((t) => t.datum >= heute);

  const dropboxText = !sync.verbunden
    ? 'Nicht verbunden'
    : sync.fehler
      ? '⚠️ Problem beim Abgleich'
      : sync.zuletzt
        ? `Verbunden · zuletzt ${sync.zuletzt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr`
        : 'Verbunden';

  return (
    <div className="eltern-uebersicht">
      <p className="eltern-geraet">
        Dieses Gerät gehört <strong>{istEltern ? 'den Eltern' : 'dem Kind'}</strong>
      </p>

      {offen + noten + neueRueckmeldungen > 0 && (
        <Gruppe titel="Zu erledigen">
          {offen > 0 && (
            <Zeile
              symbol="✅"
              titel="Einlösungen bestätigen"
              text={`${offen} ${offen === 1 ? 'Belohnung wartet' : 'Belohnungen warten'}`}
              zahl={offen}
              onClick={() => oeffne('einloesungen')}
            />
          )}
          {noten > 0 && (
            <Zeile
              symbol="📝"
              titel="Noten bestätigen"
              text={`${noten} ${noten === 1 ? 'Note wartet' : 'Noten warten'}`}
              zahl={noten}
              onClick={() => oeffne('tests')}
            />
          )}
          {neueRueckmeldungen > 0 && (
            <Zeile
              symbol="💬"
              titel="Neue Rückmeldungen"
              text="Von Milena oder automatisch gemeldet"
              zahl={neueRueckmeldungen}
              onClick={() => oeffne('rueckmeldungen')}
            />
          )}
        </Gruppe>
      )}

      <Gruppe titel="Lernen">
        <Zeile
          symbol="📚"
          titel="Lektionen"
          text={
            lektionen.length === 0
              ? 'Noch keine – neue aus Fotos anlegen'
              : `${lektionen.length} Lektionen · ${dran} gerade dran`
          }
          onClick={() => oeffne('lektionen')}
        />
        <Zeile
          symbol="📝"
          titel="Tests & Klassenarbeiten"
          text={
            tests.length === 0
              ? 'Noch keine eingetragen'
              : `${tests.length} eingetragen${naechster ? ` · nächster ${datumText(naechster.datum)}` : ''}`
          }
          onClick={() => oeffne('tests')}
        />
      </Gruppe>

      <Gruppe titel="Belohnungen">
        <Zeile
          symbol="🎁"
          titel="Belohnungen"
          text={`${belohnungen.length} zur Auswahl`}
          onClick={() => oeffne('belohnungen')}
        />
        {offen === 0 && (
          <Zeile
            symbol="✅"
            titel="Einlösungen"
            text="Nichts offen"
            onClick={() => oeffne('einloesungen')}
          />
        )}
        <Zeile
          symbol="🏆"
          titel="Level & Titel"
          text={`${stufen.length} Level`}
          onClick={() => oeffne('level')}
        />
      </Gruppe>

      <Gruppe titel="Verbindung">
        <Zeile
          symbol="☁️"
          titel="Dropbox & Abgleich"
          text={dropboxText}
          warnung={!!sync.fehler}
          onClick={() => oeffne('dropbox')}
        />
        {istEltern && (
          <Zeile
            symbol="🤖"
            titel="KI (Claude)"
            text={
              kiSchluessel === undefined
                ? ''
                : kiSchluessel
                  ? 'Schlüssel hinterlegt'
                  : 'Kein Schlüssel – nötig für Fotos'
            }
            onClick={() => oeffne('ki')}
          />
        )}
      </Gruppe>

      {IST_VORSCHAU && (
        <Gruppe titel="Testkanal">
          <Zeile
            symbol="🧪"
            titel="Daten aus Milenas App"
            text={
              kopie === undefined
                ? ''
                : kopie
                  ? `Stand: übernommen am ${zeitText(kopie.zeit)} Uhr`
                  : 'Noch nichts übernommen'
            }
            onClick={() => oeffne('testkanal')}
          />
        </Gruppe>
      )}

      <Gruppe titel="Info">
        <Zeile
          symbol="💬"
          titel="Rückmeldungen"
          text={neueRueckmeldungen > 0 ? `${neueRueckmeldungen} neu` : 'Nichts Neues'}
          onClick={() => oeffne('rueckmeldungen')}
        />
        <Zeile
          symbol="ℹ️"
          titel="Version & Neuigkeiten"
          text={`Version ${VERSION_TEXT}`}
          onClick={() => oeffne('version')}
        />
      </Gruppe>
    </div>
  );
}

function useKiSchluesselDa(): boolean | undefined {
  const [da, setDa] = useState<boolean>();
  useEffect(() => {
    let aktiv = true;
    standardKiSchluessel
      .laden()
      .catch(() => undefined)
      .then((s) => aktiv && setDa(!!s));
    return () => {
      aktiv = false;
    };
  }, []);
  return da;
}

function Gruppe({ titel, children }: { titel: string; children: ReactNode }) {
  return (
    <section className="eltern-gruppe" aria-label={titel}>
      <h2>{titel}</h2>
      <ul>{children}</ul>
    </section>
  );
}

function Zeile({
  symbol,
  titel,
  text,
  zahl,
  warnung = false,
  onClick,
}: {
  symbol: string;
  titel: string;
  text: string;
  zahl?: number;
  warnung?: boolean;
  onClick: () => void;
}) {
  return (
    <li>
      <button type="button" className="eltern-zeile" onClick={onClick}>
        <span className="eltern-zeile-symbol" aria-hidden="true">
          {symbol}
        </span>
        <span className="eltern-zeile-text">
          <strong>{titel}</strong>
          {text && <span className={warnung ? 'eltern-zeile-warnung' : undefined}>{text}</span>}
        </span>
        {zahl !== undefined && <span className="eltern-zeile-zahl">{zahl}</span>}
        <span className="eltern-zeile-pfeil" aria-hidden="true">
          ›
        </span>
      </button>
    </li>
  );
}
