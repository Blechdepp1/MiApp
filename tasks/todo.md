# Aufgaben: MiApp Version 1

Plan: [plan.md](plan.md) · Spec: [SPEC.md](../SPEC.md)
Für jede Aufgabe gilt zusätzlich: `npm run typecheck`, `npm run lint` und `npm test` sind grün, und die LRS-Grundsätze (SPEC Abschnitt 1) sind eingehalten.

---

## Phase 1: Grundlage

### Aufgabe 1: Projekt einrichten ✅
**Beschreibung:** Node.js LTS installieren, die Dropbox-Ausnahmen setzen, Git initialisieren und ein Vite-Projekt mit React und TypeScript anlegen. Dazu ESLint, Prettier, Vitest und Playwright einrichten, alle npm-Skripte aus SPEC Abschnitt 5 anlegen und eine `.gitignore` erstellen.
**Akzeptanz:**
- [x] Alle Befehle aus SPEC Abschnitt 5 laufen fehlerfrei. Es gibt mindestens einen Beispiel-Test, und er ist grün.
- [x] `node_modules`, `dist`, `coverage`, `test-results` und `playwright-report` werden von Dropbox ignoriert.
- [x] TypeScript läuft im Modus `strict`.
**Prüfen:** `npm test && npm run build`; in Dropbox ist `node_modules` als ignoriert markiert (graues Symbol).
**Abhängig von:** –
**Dateien:** `package.json`, `vite.config.ts`, `tsconfig.json`, `eslint.config.js`, `playwright.config.ts`, `.gitignore`
**Umfang:** M

### Aufgabe 2: PWA installierbar und Deployment auf GitHub Pages ✅
**Beschreibung:** vite-plugin-pwa mit Manifest (Name, Icons, Vollbild, Hochformat) und Offline-Cache einbinden. Ein öffentliches GitHub-Repo anlegen und eine GitHub Action einrichten, die bei jedem Push auf `main` baut und auf Pages veröffentlicht.
**Akzeptanz:**
- [x] Die App ist unter `https://blechdepp1.github.io/MiApp/` erreichbar. Manifest und Service Worker laufen.
- [x] Auf Android lässt sie sich über Chrome mit „Zum Startbildschirm hinzufügen“ installieren und startet im Vollbild.
- [x] Im Flugmodus startet sie nach dem ersten Laden.
**Prüfen:** Lighthouse-PWA-Check ohne Fehler; manuell auf ihrem Gerät installieren.
**Abhängig von:** 1
**Dateien:** `vite.config.ts`, `public/icons/*`, `.github/workflows/deploy.yml`, `index.html`
**Umfang:** M

### Aufgabe 3: Vorlese-Funktion ✅
**Beschreibung:** Einen Dienst `vorlesen(text, sprache)` auf Basis von `speechSynthesis` bauen. Er wählt die passende Stimme für Deutsch bzw. Englisch, unterstützt eine Geschwindigkeit und bricht eine laufende Ausgabe ab. Dazu die Komponente `<VorleseKnopf text sprache />` mit großem Lautsprecher-Symbol.
**Akzeptanz:**
- [x] Auf dem Android-Gerät (Handy der Eltern) klingen deutsche und englische Texte jeweils in der richtigen Stimme.
- [x] Ein zweiter Tipp stoppt das Vorlesen, und ein neuer Knopf unterbricht den alten.
- [x] Fehlt eine Stimme, bekommt sie einen verständlichen Hinweis (Symbol + Text), und die App stürzt nicht ab.
**Prüfen:** Unit-Tests mit gemocktem `speechSynthesis`; manuell auf dem Gerät DE und EN.
**Abhängig von:** 1
**Dateien:** `src/basis/vorlesen.ts`, `src/basis/vorlesen.test.ts`, `src/basis/VorleseKnopf.tsx`
**Umfang:** S

### Aufgabe 4: LRS-Darstellung und Einstellungen ✅
**Beschreibung:** Das Dexie-Grundschema anlegen und die Darstellung über CSS-Variablen steuern (Schriftgröße 3 Stufen, Abstand 2 Stufen, Hintergrund creme/weiß/hellblau/dunkel, Schrift Standard/OpenDyslexic lokal). Dazu ein Einstellungsbildschirm mit Live-Vorschau und Vorlese-Knöpfen.
**Akzeptanz:**
- [x] Jede Änderung wirkt sofort auf alle Bildschirme und bleibt nach einem Neustart erhalten (Unit- und E2E-Test).
- [x] Standardwerte entsprechen SPEC Abschnitt 1, Punkt 2.
- [x] Der Kontrast erfüllt in allen Hintergründen WCAG AA (automatischer Test aller Farbpaare).
**Prüfen:** Komponententest (Einstellung ändern → CSS-Variable gesetzt → nach Reload noch da); manuell auf dem Gerät.
**Abhängig von:** 3
**Dateien:** `src/daten/db.ts`, `src/basis/einstellungen.ts`, `src/basis/Einstellungen.tsx`, `src/basis/thema.css`, `public/fonts/*`
**Umfang:** M

### Aufgabe 5: App-Gerüst mit Startseite und Navigation ✅
**Beschreibung:** Routing einrichten (Hash-Navigation `#/…`, ohne zusätzliche Bibliothek). Dazu eine Startseite mit großen Symbol-Kacheln (Vokabeln, Belohnungen, Einstellungen, Eltern-Schloss) und eine einheitliche Seitenvorlage mit Zurück-Knopf und Vorlese-Knopf für den Titel.
**Akzeptanz:**
- [x] Jede Kachel hat Symbol, kurzen Text und Vorlese-Knopf; die Touch-Flächen sind mindestens 48 px groß (E2E-Test).
- [x] Jede Seite ist mit höchstens 2 Tipps von der Startseite erreichbar (aktuell 1 Tipp).
**Prüfen:** Komponententest „jede Seite hat einen Vorlese-Knopf im Titel“; Playwright-Smoke-Test im Android-Viewport.
**Abhängig von:** 4
**Dateien:** `src/App.tsx`, `src/basis/Seite.tsx`, `src/basis/Startseite.tsx`, `e2e/smoke.spec.ts`
**Umfang:** M

### Aufgabe 6: Dropbox-Durchstich ✅
**Beschreibung:** Gemeinsam mit dir in der Dropbox App Console eine App mit Zugriffstyp „App folder“ anlegen (Redirect auf die Pages-Adresse und localhost). Dann „Mit Dropbox verbinden“ über OAuth PKCE umsetzen, den Refresh-Token lokal speichern und eine Testdatei schreiben und lesen.
**Akzeptanz:**
- [x] Die Verbindung klappt auf dem Android-Handy in der installierten PWA (Test erfolgreich am 01.11.2026, 00:21).
- [x] Nach Ablauf des Access-Tokens funktioniert der Zugriff ohne neue Anmeldung (Unit-Test; auf dem Gerät wird es sich im Alltag zeigen, Access-Tokens laufen nach 4 Stunden ab).
- [x] Die App sieht nur ihren App-Ordner (Zugriffstyp „App folder“).
**Prüfen:** Unit-Test des Token-Handlings mit gemocktem SDK; manuell eine Testdatei in deiner Dropbox prüfen.
**Abhängig von:** 2
**Dateien:** `src/sync/dropbox.ts`, `src/sync/dropbox.test.ts`, `src/sync/Verbinden.tsx`
**Umfang:** M

### ✅ Checkpoint A
- [x] Alle Tests grün (94 Unit, 4 E2E), Build fehlerfrei
- [x] Auf dem Android-Handy installiert: Vorlesen DE/EN funktioniert, Einstellungen wirken, Dropbox-Testdatei geschrieben
- [ ] Gemeinsamer Blick auf den Stand, bevor es weitergeht

---

## Phase 2: Vokabeln mit Punkten (lokal)

### Aufgabe 7: Ereignis-Protokoll und Punkte-/Level-Logik ✅
**Beschreibung:** Typen für Lern-Ereignisse und eine Dexie-Tabelle anlegen. Dazu reine Funktionen für `gesamtPunkte`, `guthaben`, `level` (mit Start-Tabelle „Entdeckerin“ und Sternen ab Level 8) und `tagesziel` (2 Runden). Alle Punktwerte stehen zentral in `belohnung/werte.ts`.
**Akzeptanz:**
- [x] Die Berechnungen entsprechen exakt SPEC `belohnung`. Fehler senken nie die Punkte, Einlösungen senken nur das Guthaben.
- [x] Den Tagesziel-Bonus gibt es höchstens einmal pro Tag (wird aus den Runden pro Tag berechnet, nicht gespeichert).
- [x] Mindestens 90 % Testabdeckung (Zeilen 100 %).
**Ergänzung:** „Mit Hilfe“ richtig gibt +1 statt +2 (siehe Aufgabe 10).
**Prüfen:** `npm test -- belohnung --coverage`
**Abhängig von:** 4
**Dateien:** `src/daten/ereignisse.ts`, `src/belohnung/logik.ts`, `src/belohnung/werte.ts`, `src/belohnung/logik.test.ts`
**Umfang:** S

### Aufgabe 8: Leitner-Logik und Antwortbewertung
**Beschreibung:** Reine Funktionen für den Leitner-Stand aus den Ereignissen (5 Fächer, Fälligkeit), die Auswahl einer Runde (höchstens 10 Wörter, fällige zuerst, falsche kommen in der Runde wieder) und die Phase pro Wort (erkennen → schreiben nach 2× richtig erkannt). Dazu die Bewertung von Schreibantworten: richtig, fast richtig (Abstand 1) oder falsch, Groß-/Kleinschreibung egal.
**Akzeptanz:**
- [ ] Ein falsches Wort kommt in derselben Runde und am nächsten Tag wieder.
- [ ] „fast richtig“ zählt als richtig mit Hinweis.
- [ ] Mindestens 90 % Testabdeckung.
**Prüfen:** `npm test -- vokabeln-en --coverage`
**Abhängig von:** 7
**Dateien:** `src/vokabeln-en/leitner.ts`, `src/vokabeln-en/bewertung.ts`, `src/vokabeln-en/*.test.ts`
**Umfang:** S

### Aufgabe 9: Erste Vokabelrunde (Anhören → Wählen) mit Punkten
**Beschreibung:** Eine eingebaute Beispiel-Vokabelliste anlegen. Der Rundenbildschirm spielt das englische Wort vor, sie wählt aus 3 deutschen Antworten. Nach einem Fehler sieht sie die richtige Lösung mit Vorlesen und kommt weiter. Am Rundenende gibt es eine Zusammenfassung mit den erhaltenen Punkten. Die Ereignisse werden gespeichert.
**Akzeptanz:**
- [ ] Eine Runde lässt sich komplett durchspielen, die Punkte stimmen mit Aufgabe 7 überein.
- [ ] Nirgends gibt es rote Kreuze oder einen Timer, und die Zusammenfassung zeigt das Gelernte.
**Prüfen:** Komponententest der Runde; Playwright „Runde durchspielen“.
**Abhängig von:** 5, 8
**Dateien:** `src/vokabeln-en/beispielliste.ts`, `src/vokabeln-en/Runde.tsx`, `src/vokabeln-en/UebungWaehlen.tsx`, `src/vokabeln-en/Zusammenfassung.tsx`, `e2e/vokabelrunde.spec.ts`
**Umfang:** M

### Aufgabe 10: Übungsarten „Deutsch → Englisch wählen“ und „Schreiben“
**Beschreibung:** Die Übungsart „DE → EN wählen“ und „Englisch schreiben“ mit Buchstaben-Hilfe (Anfangsbuchstabe und Länge als Kästchen, Tipp auf „Hilfe“ deckt einen Buchstaben auf). Die Runde wählt die Übungsart nach der Phase des Wortes.
**Akzeptanz:**
- [ ] Ein Wort kommt erst nach 2× richtig erkannt in die Schreibübung.
- [ ] Hilfe kostet keine Punkte. Ohne Hilfe gibt es die vollen +2.
- [ ] Die Bildschirmtastatur verdeckt das Eingabefeld nicht (Android-Viewport).
**Prüfen:** Komponententests; manuell Schreiben auf dem Gerät.
**Abhängig von:** 9
**Dateien:** `src/vokabeln-en/UebungDeEn.tsx`, `src/vokabeln-en/UebungSchreiben.tsx`, `src/vokabeln-en/Runde.tsx`
**Umfang:** M

### Aufgabe 11: Fortschritt auf der Startseite und Level-Aufstieg
**Beschreibung:** Auf der Startseite Level, Titel, Guthaben, einen Fortschrittsbalken zum nächsten Level und das Tagesziel (0/2, 1/2, ✓) anzeigen. Beim Level-Aufstieg eine Feier-Animation mit Ton, bei der der neue Titel vorgelesen wird.
**Akzeptanz:**
- [ ] Die Anzeige stimmt nach jeder Runde sofort.
- [ ] Die Feier kommt genau einmal pro Aufstieg.
- [ ] Die Animation ist abschaltbar, wenn „Bewegung reduzieren“ eingestellt ist.
**Prüfen:** Komponententest; Playwright „Runde → Level 2 → Feier“ mit vorbefülltem Protokoll.
**Abhängig von:** 7, 9
**Dateien:** `src/belohnung/Fortschritt.tsx`, `src/belohnung/LevelFeier.tsx`, `src/basis/Startseite.tsx`
**Umfang:** M

### ✅ Checkpoint B
- [ ] Alle Tests grün, Abdeckung der Fachlogik mindestens 90 %
- [ ] **Eure Tochter testet** einige Tage mit der Beispielliste
- [ ] Rückmeldung einholen: Sind Punkte und Tempo motivierend? Ist alles verständlich? Werte bei Bedarf in `werte.ts` anpassen

---

## Phase 3: Sync und Belohnungen

### Aufgabe 12: Geräte-Rolle und Eltern-PIN
**Beschreibung:** Bei der Ersteinrichtung „Das ist das Gerät von: Kind / Eltern“ wählen. Auf jedem Gerät eine 4-stellige PIN festlegen, die lokal gehasht gespeichert wird. Das Eltern-Schloss auf der Startseite öffnet den Eltern-Bereich nur mit PIN.
**Akzeptanz:**
- [ ] Ohne PIN ist der Eltern-Bereich nicht erreichbar, auch nicht per URL.
- [ ] Wer die PIN vergisst, kann sie nur zurücksetzen, indem die lokalen Daten gelöscht und neu synchronisiert werden.
**Prüfen:** Komponententests; Playwright „Eltern-Bereich ohne PIN gesperrt“.
**Abhängig von:** 5
**Dateien:** `src/eltern/rolle.ts`, `src/eltern/Pin.tsx`, `src/eltern/ElternBereich.tsx`
**Umfang:** S

### Aufgabe 13: Dropbox-Sync von Ereignissen und Inhalten
**Beschreibung:** Jedes Gerät hängt seine Ereignisse an `ereignisse/<geraete-id>.jsonl` an und lädt die Protokolle der anderen. Nur das Eltern-Gerät schreibt `inhalte/*.json`. Die Protokolle werden ohne Duplikate zusammengeführt (Ereignis-IDs). Abgeglichen wird beim Start, nach jeder Runde, bei wiederkehrendem Netz und alle 30 Sekunden im Vordergrund.
**Akzeptanz:**
- [ ] Zwei Geräte, eins offline, üben beide: Nach dem Abgleich zeigen beide dieselben Punkte, und kein Ereignis fehlt oder ist doppelt.
- [ ] Das Kind-Gerät schreibt nie nach `inhalte/`.
- [ ] Die Merge-Logik hat mindestens 90 % Testabdeckung.
**Prüfen:** Unit-Tests des Merges mit gemocktem Dropbox; manuell zwei Geräte, eins im Flugmodus.
**Abhängig von:** 6, 7, 12
**Dateien:** `src/sync/abgleich.ts`, `src/sync/abgleich.test.ts`, `src/sync/useSync.ts`, `src/daten/db.ts`
**Umfang:** M

### Aufgabe 14: Belohnungen und Level-Tabelle verwalten (Eltern)
**Beschreibung:** Im Eltern-Bereich Belohnungen anlegen, ändern und löschen (Name, Symbol, Preis) und die Level-Tabelle bearbeiten. Die Startwerte aus SPEC sind vorbelegt. Gespeichert wird in `inhalte/belohnungen.json` und `inhalte/level.json`.
**Akzeptanz:**
- [ ] Eine Änderung ist nach dem Abgleich auf dem Kind-Gerät sichtbar.
- [ ] Ungültige Eingaben (Preis 0, Schwellen nicht aufsteigend) werden verständlich abgelehnt.
**Prüfen:** Komponententests; manuell Änderung am Eltern-Handy → Kind-Handy.
**Abhängig von:** 13
**Dateien:** `src/eltern/BelohnungenVerwalten.tsx`, `src/eltern/LevelVerwalten.tsx`, `src/belohnung/inhalte.ts`
**Umfang:** M

### Aufgabe 15: Belohnung einlösen und bestätigen
**Beschreibung:** Das Kind sieht alle Belohnungen mit Preis und Fortschritt („noch 300 Punkte“). Es löst ein, wenn das Guthaben reicht, und die Einlösung ist dann „offen“. Die Eltern sehen offene Einlösungen und bestätigen sie. Beides sind Ereignisse.
**Akzeptanz:**
- [ ] Das Guthaben sinkt sofort beim Einlösen, das Level nicht.
- [ ] Doppeltes Einlösen durch doppeltes Tippen ist nicht möglich.
- [ ] Nach der Bestätigung sieht das Kind „eingelöst ✓“.
**Prüfen:** Unit- und Komponententests; manuell auf beiden Geräten.
**Abhängig von:** 14
**Dateien:** `src/belohnung/Belohnungen.tsx`, `src/eltern/Einloesungen.tsx`, `src/belohnung/logik.ts`
**Umfang:** M

### ✅ Checkpoint C
- [ ] Alle Tests grün
- [ ] Kind- und Eltern-Handy synchron, Belohnung einlösen und bestätigen klappt
- [ ] Gemeinsame Durchsicht

---

## Phase 4: Eltern-Bereich mit KI

### Aufgabe 16: KI-Schlüssel hinterlegen
**Beschreibung:** Im Eltern-Bereich den Anthropic-API-Schlüssel eingeben, mit einem kleinen Testaufruf prüfen und nur lokal speichern. Das geht nur auf Geräten mit der Rolle „Eltern“.
**Akzeptanz:**
- [ ] Der Schlüssel landet nie in Dropbox, im Repo oder in Logs.
- [ ] Ein ungültiger Schlüssel gibt einen klaren Hinweis.
- [ ] Der Schlüssel lässt sich wieder löschen.
**Prüfen:** Unit-Test: Sync-Dateien enthalten keinen Schlüssel; manuell mit deinem Schlüssel.
**Abhängig von:** 12
**Dateien:** `src/eltern/kiSchluessel.ts`, `src/eltern/KiEinstellungen.tsx`
**Umfang:** S

### Aufgabe 17: Foto-Import einer Vokabelliste
**Beschreibung:** Das Vokabelblatt mit der Kamera fotografieren (`<input capture>`), verkleinern und an die Claude API mit Bildverständnis schicken. Sie liefert Wortpaare EN/DE als JSON (mit Schema). Die Eltern sehen eine bearbeitbare Tabelle, geben der Liste einen Namen und geben sie frei. Danach wird sie nach `inhalte/vokabeln/<id>.json` geschrieben. Das Foto wird nicht gespeichert.
**Akzeptanz:**
- [ ] Ein typisches Schulbuch-Vokabelblatt ist in unter 3 Minuten vom Foto bis zur Liste auf ihrem Gerät.
- [ ] Erkannte Paare lassen sich vor der Freigabe ändern, löschen und ergänzen.
- [ ] Ohne Netz oder bei einem KI-Fehler gibt es einen verständlichen Hinweis und nichts geht verloren.
**Prüfen:** Unit-Test der Antwort-Verarbeitung mit gemockter API-Antwort; manuell mit einem echten Blatt aus der Schule.
**Abhängig von:** 13, 16
**Dateien:** `src/eltern/fotoImport.ts`, `src/eltern/fotoImport.test.ts`, `src/eltern/FotoImport.tsx`, `src/vokabeln-en/listen.ts`
**Umfang:** M

### Aufgabe 18: Wochenübersicht für Eltern
**Beschreibung:** Im Eltern-Bereich eine Übersicht der letzten 7 Tage: Lerntage, Minuten, Runden, gelernte Wörter (Leitner-Fach 3 oder höher) und die schwierigsten Wörter. Dazu Auswahl, welche Vokabellisten aktiv sind.
**Akzeptanz:**
- [ ] Die Zahlen stimmen mit dem Ereignis-Protokoll überein (Unit-Test).
- [ ] Inaktive Listen kommen nicht mehr in Runden vor.
**Prüfen:** Unit- und Komponententests.
**Abhängig von:** 13, 17
**Dateien:** `src/eltern/Wochenuebersicht.tsx`, `src/eltern/statistik.ts`, `src/eltern/statistik.test.ts`
**Umfang:** M

### Aufgabe 19: End-to-End-Tests und Abnahme auf dem Gerät
**Beschreibung:** Playwright-Tests für die Hauptabläufe ergänzen: Runde, Level-Aufstieg, Einlösen und Bestätigen, Foto-Import (gemockt), Eltern-PIN. Danach die Abnahme aus SPEC Abschnitt 10 auf den echten Geräten durchgehen.
**Akzeptanz:**
- [ ] Alle E2E-Tests grün.
- [ ] Jeder Punkt aus SPEC Abschnitt 10 ist abgehakt.
**Prüfen:** `npm run test:e2e`; Abnahme-Checkliste gemeinsam.
**Abhängig von:** 15, 17, 18
**Dateien:** `e2e/*.spec.ts`
**Umfang:** M

### ✅ Checkpoint D: Version 1 fertig
- [ ] Alle Abnahmekriterien aus SPEC Abschnitt 10 erfüllt
- [ ] Planung der nächsten Module (`rechtschreibung-de`, `lesen-de`)
