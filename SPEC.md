# Spec: MiApp – Lern-App bei LRS

Status: **v1.1** (01.11.2026) – v1.0 freigegeben am 31.10.2026; ergänzt um Lektionen aus Fotos und Mathe (Abschnitt 2a)
Hintergrund: [Recherche-LRS.md](Recherche-LRS.md)

## 1. Ziel

Wir bauen eine Lern-App für unsere Tochter (Klasse 5–7, Lese-Rechtschreib-Schwäche) auf ihrem Android-Gerät.
Sie soll **regelmäßig und gern** üben: zuerst englische Vokabeln aus der Schule, später deutsche Rechtschreibung, Lesen und Mathe – jeweils mit Inhalten, die wir aus Schulbüchern, Heften und Arbeitsblättern abfotografieren.
Das Lernen wird mit einem **Punkte- und Level-System** belohnt, und die Eltern legen echte Belohnungen fest.

**Nutzer:innen**
- **Kind:** übt in kurzen Einheiten (5–10 Min.), kann sich alles vorlesen lassen, sammelt Punkte, steigt Level auf und löst Belohnungen ein.
- **Eltern:** fotografieren Vokabellisten, die KI macht daraus Übungen; sie prüfen das Ergebnis, legen Belohnungen fest, bestätigen Einlösungen und sehen den Fortschritt.

**Erfolg heißt**
- Sie übt an mindestens 4 Tagen pro Woche, ohne dass man sie erinnern muss.
- Eine neue Vokabelliste von der Schule ist in **unter 3 Minuten** vom Foto bis zur fertigen Übung auf ihrem Gerät.
- Sie kann die App bedienen, ohne dass Lesen eine Hürde ist: Jeder Text ist vorlesbar.

### LRS-Grundsätze (gelten für alle Module)
1. Jeder sichtbare Text und jede Anweisung lässt sich per Lautsprecher-Symbol vorlesen.
2. Darstellung einstellbar: Schriftgröße, Buchstaben- und Zeilenabstand, Hintergrundfarbe (Standard: creme, dunkelgrauer Text, serifenlose Schrift, Zeilenabstand 1,5).
3. Fehler kosten **nie** Punkte. Nach einem Fehler zeigt die App die richtige Lösung und lässt es nochmal versuchen. Keine roten Kreuze, kein Zeitdruck.
4. Kurze Texte, Symbole statt Textmenüs, große Touch-Flächen (mindestens 48 px).
5. Keine Werbung, keine Tracker, keine Ranglisten mit anderen.

## 2. Modulübersicht

| Modul | Aufgabe | Baut auf |
|---|---|---|
| `lrs-basis` | PWA-Gerüst, LRS-Darstellung + Einstellungen, Vorlese-Funktion (TTS), Navigation, lokale Datenbank | – |
| `sync` | Abgleich über Dropbox (App-Ordner): Inhalte und Lern-Ereignisse zwischen Kind- und Eltern-Gerät, offline zuerst | `lrs-basis` |
| `belohnung` | Punkte, Level & Titel, echte Belohnungen definieren/einlösen | `lrs-basis`, `sync` |
| `vokabeln-en` | Englisch-Vokabeltrainer mit Wiederholung in Abständen | `lrs-basis`, `sync`, `belohnung` |
| `eltern-bereich` | Eltern-Modus (PIN): Lektion aus Fotos (Foto → KI → Vorschau → Freigabe), Belohnungen verwalten, Einlösungen bestätigen, Fortschritt | `sync`, `belohnung`, `vokabeln-en` |
| `rechtschreibung-de` | *(später)* Training der Fehlerschwerpunkte, Lernwörter aus Lektionen | `lrs-basis`, `sync`, `belohnung`, `eltern-bereich` |
| `lesen-de` | *(später)* Lesetraining, Textverständnis, Lesetexte aus Lektionen | `lrs-basis`, `sync`, `belohnung`, `eltern-bereich` |
| `mathe` | *(später, neu)* Übungsaufgaben zu den Themen aus Lektionen, Textaufgaben vorlesbar, Schritt-für-Schritt-Hilfen | `lrs-basis`, `sync`, `belohnung`, `eltern-bereich` |

**Reihenfolge:** `lrs-basis` → `sync` → `belohnung` → `vokabeln-en` → `eltern-bereich` = **Version 1**. Danach folgen `rechtschreibung-de`, `lesen-de` und `mathe`, jeweils mit eigenem Spec.

## 2a. Lektionen aus Fotos (gilt für alle Fächer)

Schulmaterial (Buchseiten, Hefteinträge, Arbeitsblätter, Lernzettel) kommt über **Lektionen** in die App:

1. **Fotografieren:** Im Eltern-Bereich ein oder mehrere Fotos aufnehmen (z. B. Buchseite + Hefteintrag).
2. **Einordnen:** Fach (Englisch, Deutsch, Mathe) und Titel wählen (z. B. „Unit 3“, „Brüche“), optional das Datum einer Klassenarbeit.
3. **Auswerten:** Die Claude API erkennt den Inhalt und liefert strukturierte Übungsdaten je Fach:
   - **Englisch:** Wortpaare EN/DE → Vokabeltrainer (`vokabeln-en`, Version 1).
   - **Deutsch:** Lernwörter/Diktatwörter → `rechtschreibung-de`; Lesetexte mit Verständnisfragen → `lesen-de`.
   - **Mathe:** erkannte Aufgabentypen → `mathe` erzeugt **ähnliche Aufgaben mit neuen Zahlen**. Ob eine Antwort stimmt, **rechnet die App selbst nach** (nicht die KI).
4. **Prüfen und freigeben:** Die Eltern sehen eine bearbeitbare Vorschau; erst nach Freigabe wird die Lektion als `inhalte/lektionen/<id>.json` gespeichert und per Dropbox verteilt.
5. **Klassenarbeit:** Hat eine Lektion ein Datum, übt die App sie in den Tagen davor bevorzugt.

**Format:** Jede Lektion hat `id`, `fach`, `titel`, optional `klassenarbeit` (Datum), `erstellt` und fachspezifische `inhalte`. In Version 1 gibt es nur Englisch-Lektionen; neue Fächer ergänzen nur einen neuen Inhaltstyp und ein Übungsmodul, der Foto-Import bleibt gleich.

**Datenschutz:** Fotos gehen nur zur Auswertung an die Claude API und werden nicht gespeichert; auf Arbeitsblättern möglichst keine Namen. Schulmaterial wird nur privat in der Familie genutzt.

**Offen für später:** Welche Mathe-Themen in ihrer Klasse dran sind (wird vor dem `mathe`-Spec erfragt).

## 3. Was jedes Modul in Version 1 können muss

### `lrs-basis`
- Die App lässt sich auf Android über Chrome zum Startbildschirm hinzufügen und startet im Vollbild, auch offline.
- Jeder Bildschirm hat bei Texten und Anweisungen ein Lautsprecher-Symbol. Das Vorlesen läuft über die Web Speech API, auf Deutsch und Englisch, und die Geschwindigkeit ist einstellbar.
- Im Einstellungsbildschirm lassen sich Schriftgröße (3 Stufen), Abstand (2 Stufen), Hintergrund (creme/weiß/hellblau/dunkel) und Schriftart (Standard = Atkinson Hyperlegible Next, mit eindeutigen Buchstaben wie I/l/1 und b/d / OpenDyslexic) wählen. Beide Schriften liegen lokal in der App (SIL OFL). Die Änderung wirkt sofort und bleibt nach einem Neustart erhalten.
- Auf einem Mittelklasse-Android-Gerät startet die App in unter 2 Sekunden.

### `sync`
- Die Eltern verbinden jedes Gerät einmal mit Dropbox. Die Anmeldung läuft über OAuth PKCE, die App bekommt nur Zugriff auf ihren eigenen Ordner `Apps/MiApp`, nicht auf den übrigen Dropbox-Inhalt.
- **Ein Schreiber pro Datei**, damit es keine Konflikte gibt:
  - `inhalte/*.json` schreibt nur das Eltern-Gerät (Vokabellisten, Belohnungen, Level-Tabelle).
  - `ereignisse/<geraete-id>.jsonl` schreibt nur das jeweilige Gerät. Das ist ein Protokoll, an das nur angehängt wird (Übung erledigt, Punkte bekommen, Einlösung gewünscht/bestätigt).
- Offline wird alles lokal gespeichert (IndexedDB). Sobald wieder Netz da ist, wird abgeglichen, spätestens 30 Sekunden später.
- Punktestand und Fortschritt werden **aus dem Ereignis-Protokoll berechnet** und nicht als Zahl gespeichert. Dadurch kann nichts doppelt oder verloren gezählt werden.

### `belohnung`
- **Punkte (gemischt):** 10 Punkte für jede abgeschlossene Übungsrunde, +2 je richtige Antwort, +5 wenn ein früher falsches Wort jetzt richtig ist, +20 für das erreichte Tagesziel (**2 Runden pro Tag**). Punkte werden nie abgezogen. Bei 2 Runden pro Tag sind das ungefähr 90 Punkte am Tag.
- **Level & Titel:** Die Gesamtpunkte, die nie sinken, bestimmen das Level. Am Anfang geht es schnell aufwärts, später werden die Abstände länger. Die Eltern können die Tabelle ändern. Beim Aufstieg gibt es eine Animation mit Ton und Vorlesen. Startwerte (Thema „Entdeckerin“):

  | Level | Ab Punkten | Titel | ≈ nach |
  |---|---|---|---|
  | 1 | 0 | Wort-Sammlerin | Start |
  | 2 | 150 | Spurenleserin | 2 Tagen |
  | 3 | 500 | Pfadfinderin | 1 Woche |
  | 4 | 1.100 | Entdeckerin | 2 Wochen |
  | 5 | 2.000 | Kartenzeichnerin | 3 Wochen |
  | 6 | 3.200 | Expeditionsleiterin | 5 Wochen |
  | 7 | 4.800 | Weltreisende | 7–8 Wochen |
  | 8 | 7.000 | Sprach-Legende | 11 Wochen |

  Danach folgt alle 2.500 Punkte ein Stern auf „Sprach-Legende“ (★, ★★ …).
- **Echte Belohnungen:** Die Eltern legen Belohnungen mit Preis fest. Das Kind löst eine Belohnung aus seinem **Guthaben** ein; das Level bleibt dabei unverändert. Die Einlösung ist „offen“, bis die Eltern sie bestätigen. Startbeispiele (Ausflüge & Erlebnisse):

  | Belohnung | Preis | ≈ Sparzeit |
  |---|---|---|
  | Schwimmbad | 900 | 1,5 Wochen |
  | Kino | 1.300 | 2–3 Wochen |
  | Kletterhalle / Trampolinpark | 1.800 | 3 Wochen |
  | Freizeitpark | 4.000 | 6–7 Wochen |
- Auf der Startseite sieht das Kind Level, Titel, Guthaben, den Fortschrittsbalken zum nächsten Level und die nächste erreichbare Belohnung.

### `vokabeln-en`
- Übungsarten: **Anhören → Bild/Wort wählen**, **Deutsch → Englisch wählen**, **Englisch schreiben** mit Buchstaben-Hilfe. Jede Übung lässt sich anhören.
- **Erst erkennen, dann schreiben:** Ein neues Wort wird zuerst angehört und erkannt (EN → DE). In die Schreibübung (DE → EN) kommt es erst, wenn es zweimal richtig erkannt wurde.
- Wiederholung in Abständen (Leitner-System, 5 Fächer): Falsch beantwortete Wörter kommen in derselben Runde und am nächsten Tag wieder.
- **Kein Tageslimit:** Ist heute nichts mehr fällig, gibt es beliebig viele freiwillige Extra-Runden zum Wiederholen, mit normalen Punkten. Richtige Antworten in Extra-Runden verschieben ein Wort nicht im Wiederholungsplan, Fehler setzen es aber zurück.
- Eine Runde hat höchstens 10 Wörter und dauert etwa 5 Minuten. Am Ende gibt es eine Zusammenfassung, die das Gelernte zeigt, keine Fehlerliste.
- Beim Schreiben gilt Groß-/Kleinschreibung nicht als Fehler, und kleine Tippfehler (Abstand 1) gelten als „fast richtig“ mit Hinweis.

### `eltern-bereich`
- Er ist über ein Symbol + 4-stellige PIN erreichbar. Die PIN wird nur lokal gehasht gespeichert.
- **Lektion aus Fotos** (siehe 2a): In Version 1 für Englisch. Die Eltern fotografieren eine oder mehrere Seiten, geben Titel und optional ein Klassenarbeits-Datum an. Die App schickt die Bilder an die Claude API (Modell mit Bildverständnis) und bekommt Wortpaare EN/DE zurück. Die Eltern sehen eine **bearbeitbare Vorschau** und geben sie frei, erst dann wird die Lektion nach `inhalte/lektionen/` geschrieben. Fotos werden nicht gespeichert. Das Lektionsformat ist so angelegt, dass Deutsch und Mathe später ohne Umbau dazukommen.
- Der **KI-Schlüssel** wird nur auf dem Eltern-Gerät gespeichert und **nie** nach Dropbox synchronisiert.
- Die Eltern verwalten Belohnungen und die Level-Tabelle, bestätigen Einlösungen und sehen eine Wochenübersicht (Lerntage, Minuten, gelernte Wörter, schwierige Wörter).

## 4. Tech Stack

| Bereich | Wahl |
|---|---|
| Sprache | TypeScript (strict) |
| UI | React 19 + Vite |
| PWA | vite-plugin-pwa (Workbox) |
| Lokale Daten | Dexie (IndexedDB) |
| Sync | Dropbox HTTP API v2 direkt per `fetch` (ohne SDK, ca. 200 Zeilen in `src/sync/dropbox.ts`), OAuth PKCE mit Refresh-Token, App-Ordner-Zugriff |
| Vorlesen | Web Speech API (`speechSynthesis`) |
| KI | Claude API direkt aus dem Browser des Eltern-Geräts |
| Tests | Vitest + Testing Library, Playwright für End-to-End |
| Hosting | GitHub Pages (Deployment per GitHub Actions bei Push auf `main`) |

Voraussetzung: **Node.js 26 LTS**, installiert ohne Administratorrechte in `%LOCALAPPDATA%\Programs\node-v26.13.0-win-x64` (im Benutzer-PATH).
Repository: **öffentlich** auf GitHub, damit GitHub Pages kostenlos ist. Im Code stehen keine Schlüssel und keine Kinderdaten.

## 5. Befehle

```
Installieren:   npm install
Entwickeln:     npm run dev            # Vite-Dev-Server, http://localhost:5173
Tests:          npm test               # Vitest (einmal)
Tests (watch):  npm run test:watch
E2E-Tests:      npm run test:e2e       # Playwright, Android-Viewport
Lint:           npm run lint           # ESLint + Prettier-Check
Typen:          npm run typecheck      # tsc --noEmit
Bauen:          npm run build          # Ausgabe in dist/
Vorschau:       npm run preview        # gebaute PWA lokal testen
```

## 6. Projektstruktur

```
src/
  basis/            → lrs-basis: Layout, Einstellungen, Vorlesen, Navigation
  sync/             → Dropbox-Anbindung, Ereignis-Protokoll, Abgleich
  belohnung/        → Punkteberechnung, Level, Belohnungen
  vokabeln-en/      → Vokabeltrainer, Leitner-Logik, Übungsarten
  eltern/           → Eltern-Bereich, Foto-Import, KI-Aufruf
  daten/            → Dexie-Schema, gemeinsame Typen
  App.tsx, main.tsx
tests/              → Unit-Tests neben der Logik als *.test.ts, hier nur Helfer
e2e/                → Playwright-Tests
public/             → Icons, Manifest, Schriftarten (OpenDyslexic lokal)
docs/               → Entscheidungen (ADRs)
SPEC.md, Recherche-LRS.md
```

## 7. Code-Stil

- Bezeichner für Fachbegriffe auf **Deutsch** (`vokabel`, `punkte`, `belohnung`), technische Begriffe auf Englisch (`useSync`, `fetch`).
- Reine Logik (Punkte, Leitner, Abgleich) steht in reinen Funktionen ohne React und ist dadurch einfach testbar.
- Prettier-Standard, 2 Leerzeichen, Semikolons, einfache Anführungszeichen.

```ts
// belohnung/punkte.ts
export type LernEreignis =
  | { typ: 'runde-beendet'; zeit: string; richtig: number; verbessert: number }
  | { typ: 'tagesziel'; zeit: string }
  | { typ: 'eingeloest'; zeit: string; belohnungId: string; preis: number };

export function gesamtPunkte(ereignisse: LernEreignis[]): number {
  return ereignisse.reduce((summe, e) => {
    switch (e.typ) {
      case 'runde-beendet':
        return summe + 10 + e.richtig * 2 + e.verbessert * 5;
      case 'tagesziel':
        return summe + 20;
      default:
        return summe; // Einlösen senkt nur das Guthaben, nie die Gesamtpunkte
    }
  }, 0);
}
```

## 8. Teststrategie

- **Unit (Vitest):** gesamte Fachlogik, also Punkte, Level, Guthaben, Leitner, Bewertung „fast richtig“ und das Zusammenführen der Ereignis-Protokolle. Ziel: **90 % Abdeckung** in `belohnung/`, `vokabeln-en/` (Logik) und `sync/` (Merge).
- **Komponenten (Testing Library):** Jeder Text hat einen Vorlese-Knopf, die Einstellungen wirken, nach einem Fehler gibt es keinen Punktabzug.
- **E2E (Playwright, Android-Viewport 412×915):** Vokabelrunde komplett durchspielen, Level-Aufstieg, Belohnung einlösen und bestätigen, Foto-Import mit **gemockter** KI-Antwort.
- Dropbox und Claude API werden in Tests **immer gemockt**. Echte Aufrufe gibt es nur bei manuellen Tests.
- **Manuell auf dem echten Gerät:** Installation als PWA, Vorlesen DE/EN, Offline-Modus, Abgleich zwischen zwei Geräten.

## 9. Grenzen

**Immer**
- LRS-Grundsätze (Abschnitt 1) bei jedem neuen Bildschirm einhalten.
- Tests und Typecheck laufen lassen, bevor etwas als fertig gilt.
- Kinderdaten minimal halten: kein Klarname, keine Fotos speichern, nur das Nötige in Dropbox.

**Erst fragen**
- Neue Abhängigkeiten (npm-Pakete) hinzufügen.
- Format der Dateien in Dropbox ändern (betrifft beide Geräte).
- Punktwerte oder Level-Schwellen ändern.
- Weitere externe Dienste neben Dropbox und Claude API anbinden.

**Nie**
- Den KI-Schlüssel oder Dropbox-Tokens ins Repository, nach Dropbox oder auf das Kind-Gerät schreiben (Ausnahme: der Dropbox-Token des Kind-Geräts selbst).
- Punkte abziehen oder Fehler bestrafen.
- Werbung, Analytics/Tracker oder Ranglisten einbauen.
- Echte Dropbox- oder KI-Aufrufe in automatisierten Tests.

## 10. Abnahme Version 1

- [ ] Die App ist auf ihrem Android-Gerät installiert und läuft offline.
- [ ] Ein fotografiertes Vokabelblatt ist in unter 3 Minuten als Übung auf ihrem Gerät.
- [ ] Sie kann eine Vokabelrunde komplett ohne Lesehilfe von außen machen.
- [ ] Punkte, Level und Guthaben stimmen auf beiden Geräten überein.
- [ ] Eine Belohnung lässt sich einlösen, und die Eltern können sie bestätigen.
- [ ] Alle automatischen Tests sind grün, die Abdeckung der Fachlogik liegt bei mindestens 90 %.

## 11. Offene Fragen

1. ~~Hosting~~ → **entschieden: GitHub Pages.** Der Code enthält keine Geheimnisse, deshalb darf die Seite öffentlich sein.
2. **Dropbox-App** → **entschieden: wird angelegt, wenn `sync` dran ist** (App Console, Zugriffstyp „App folder“, Anleitung Schritt für Schritt).
3. ~~Claude API-Schlüssel~~ → **entschieden: Anthropic-API-Konto ist vorhanden.** Der Schlüssel wird im Eltern-Bereich eingegeben, nicht im Code.
4. ~~Projektordner~~ → **entschieden: bleibt in Dropbox.** `node_modules`, `dist`, `coverage`, `test-results` und `playwright-report` werden von der Dropbox-Synchronisierung ausgenommen:
   ```powershell
   foreach ($d in 'node_modules','dist','coverage','test-results','playwright-report') {
     New-Item -ItemType Directory -Force $d | Out-Null
     Set-Content -Path $d -Stream com.dropbox.ignored -Value 1
   }
   ```
   Das passiert einmal beim Einrichten, **vor** dem ersten `npm install`.
5. ~~Startwerte~~ → **entschieden:** Thema „Entdeckerin“, am Anfang schneller Aufstieg, Ausflüge als Belohnungen, Tagesziel 2 Runden (siehe `belohnung`).
6. ~~Vokabelrichtung~~ → **entschieden:** beides, erst erkennen, dann schreiben (siehe `vokabeln-en`).

Keine offenen Fragen mehr, die die Umsetzung blockieren.
