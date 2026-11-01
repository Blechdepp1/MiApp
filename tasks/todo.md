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

### Aufgabe 8: Leitner-Logik und Antwortbewertung ✅
**Beschreibung:** Reine Funktionen für den Leitner-Stand aus den Ereignissen (5 Fächer, Fälligkeit), die Auswahl einer Runde (höchstens 10 Wörter, fällige zuerst, falsche kommen in der Runde wieder) und die Phase pro Wort (erkennen → schreiben nach 2× richtig erkannt). Dazu die Bewertung von Schreibantworten: richtig, fast richtig (Abstand 1) oder falsch, Groß-/Kleinschreibung egal.
**Akzeptanz:**
- [x] Ein falsches Wort ist am nächsten Tag wieder fällig (das Wiederholen in derselben Runde übernimmt die Runde in Aufgabe 9).
- [x] „fast richtig“ (ein Buchstabe falsch, fehlend, zu viel oder vertauscht; ab 4 Buchstaben) wird erkannt; als richtig mit Hinweis zählt es in Aufgabe 10.
- [x] Mindestens 90 % Testabdeckung (Zeilen 100 %).
**Festgelegt:** Pausen je Fach 1/1/3/7/14 Tage; höchstens 5 neue Wörter pro Runde; Reihenfolge der Übungen: anhören & erkennen → Deutsch → Englisch wählen → schreiben; ein Fehler und die Korrektur am selben Tag zählen nicht als „verbessert“ (sonst wäre absichtlich falsch antworten lohnender).
**Prüfen:** `npm test -- vokabeln-en --coverage`
**Abhängig von:** 7
**Dateien:** `src/vokabeln-en/leitner.ts`, `src/vokabeln-en/bewertung.ts`, `src/vokabeln-en/*.test.ts`
**Umfang:** S

### Aufgabe 9: Erste Vokabelrunde (Anhören → Wählen) mit Punkten ✅
**Beschreibung:** Eine eingebaute Beispiel-Vokabelliste anlegen. Der Rundenbildschirm spielt das englische Wort vor, sie wählt aus 3 deutschen Antworten. Nach einem Fehler sieht sie die richtige Lösung mit Vorlesen und kommt weiter. Am Rundenende gibt es eine Zusammenfassung mit den erhaltenen Punkten. Die Ereignisse werden gespeichert.
**Akzeptanz:**
- [x] Eine Runde lässt sich komplett durchspielen, die Punkte stimmen mit Aufgabe 7 überein (Komponenten- und E2E-Test).
- [x] Nirgends gibt es rote Kreuze oder einen Timer, und die Zusammenfassung zeigt das Gelernte.
**Vorgezogen aus Aufgabe 10:** „Deutsch → Englisch wählen“ ist schon dabei (gleiche Komponente); Wörter, die schon geschrieben werden müssten, kommen bis Aufgabe 10 ebenfalls als „Deutsch → Englisch wählen“.
**Prüfen:** Komponententest der Runde; Playwright „Runde durchspielen“.
**Abhängig von:** 5, 8
**Dateien:** `src/vokabeln-en/beispielliste.ts`, `src/vokabeln-en/Runde.tsx`, `src/vokabeln-en/UebungWaehlen.tsx`, `src/vokabeln-en/Zusammenfassung.tsx`, `e2e/vokabelrunde.spec.ts`
**Umfang:** M

### Aufgabe 10: Übungsarten „Deutsch → Englisch wählen“ und „Schreiben“ ✅ (Gerätetest offen)
**Beschreibung:** Die Übungsart „DE → EN wählen“ und „Englisch schreiben“ mit Buchstaben-Hilfe (Anfangsbuchstabe und Länge als Kästchen, Tipp auf „Hilfe“ deckt einen Buchstaben auf). Die Runde wählt die Übungsart nach der Phase des Wortes.
**Akzeptanz:**
- [x] Ein Wort kommt erst nach 2× richtig erkannt in die Schreibübung.
- [x] Hilfe kostet keine Punkte. Ohne Hilfe gibt es die vollen +2, mit Hilfe +1.
- [ ] Die Bildschirmtastatur verdeckt das Eingabefeld nicht (`interactive-widget=resizes-content`; auf dem Gerät prüfen).
**Prüfen:** Komponententests; manuell Schreiben auf dem Gerät.
**Abhängig von:** 9
**Dateien:** `src/vokabeln-en/UebungDeEn.tsx`, `src/vokabeln-en/UebungSchreiben.tsx`, `src/vokabeln-en/Runde.tsx`
**Umfang:** M

### Aufgabe 11: Fortschritt auf der Startseite und Level-Aufstieg ✅ (Gerätetest offen)
**Beschreibung:** Auf der Startseite Level, Titel, Guthaben, einen Fortschrittsbalken zum nächsten Level und das Tagesziel (0/2, 1/2, ✓) anzeigen. Beim Level-Aufstieg eine Feier-Animation mit Ton, bei der der neue Titel vorgelesen wird.
**Akzeptanz:**
- [x] Die Anzeige stimmt nach jeder Runde sofort.
- [x] Die Feier kommt genau einmal pro Aufstieg (auch für jeden neuen Stern).
- [x] Die Animation ist aus, wenn im System „Bewegung reduzieren“ eingestellt ist.
**Prüfen:** Komponententest; Playwright „Runde → Level 2 → Feier“ mit vorbefülltem Protokoll.
**Abhängig von:** 7, 9
**Dateien:** `src/belohnung/Fortschritt.tsx`, `src/belohnung/LevelFeier.tsx`, `src/basis/Startseite.tsx`
**Umfang:** M

### Zusätzlich nach Rückmeldung der Eltern (01.11.2026) ✅
- [x] Kein Tageslimit: Extra-Runden zum Wiederholen, wenn nichts mehr fällig ist (vorgezogene richtige Antworten stufen nicht hoch).
- [x] Zurück-Taste des Handys: flacher Verlauf, führt immer direkt zur Startseite und dort aus der App.
- [x] Kindgerechte Nachfrage „Möchtest du wirklich aufhören?“ beim Verlassen einer angefangenen Runde (App-Zurück und Handy-Zurück).

### ✅ Checkpoint B
- [x] Alle Tests grün (198 Unit, 8 E2E), Abdeckung der Fachlogik mindestens 90 %
- [x] Auf dem Android-Handy der Eltern geprüft: Runde, Fehler, Extra-Runden, Level 2 mit Feier, Zurück-Taste, Nachfrage
- [ ] Noch auf dem Gerät prüfen: Schreibübung (frühestens am Tag nach den ersten Runden) – verdeckt die Tastatur etwas?
- [ ] **Eure Tochter testet** einige Tage mit der Beispielliste
- [ ] Rückmeldung einholen: Sind Punkte und Tempo motivierend? Ist alles verständlich? Werte bei Bedarf in `werte.ts` anpassen

---

## Phase 3: Sync und Belohnungen

### Aufgabe 12: Geräte-Rolle und Eltern-PIN ✅
**Beschreibung:** Bei der Ersteinrichtung „Das ist das Gerät von: Kind / Eltern“ wählen. Auf jedem Gerät eine 4-stellige PIN festlegen, die lokal gehasht gespeichert wird. Das Eltern-Schloss auf der Startseite öffnet den Eltern-Bereich nur mit PIN.
**Akzeptanz:**
- [x] Ohne PIN ist der Eltern-Bereich nicht erreichbar, auch nicht per URL (Unit- und E2E-Test).
- [x] Wer die PIN vergisst, kann sie nur zurücksetzen, indem die lokalen Daten gelöscht und neu synchronisiert werden („PIN vergessen?“ erklärt das).
**Ergänzt:** Zahlenfeld statt Tastatur; gesalzener SHA-256-Prüfwert; nach 5 Fehlversuchen 1 Minute Sperre.
**Prüfen:** Komponententests; Playwright „Eltern-Bereich ohne PIN gesperrt“.
**Abhängig von:** 5
**Dateien:** `src/eltern/rolle.ts`, `src/eltern/Pin.tsx`, `src/eltern/ElternBereich.tsx`
**Umfang:** S

### Aufgabe 13: Dropbox-Sync von Ereignissen und Inhalten ✅ Ereignisse (mit zwei Geräten geprüft) · Inhalte → Aufgabe 14
**Beschreibung:** Jedes Gerät hängt seine Ereignisse an `ereignisse/<geraete-id>.jsonl` an und lädt die Protokolle der anderen. Nur das Eltern-Gerät schreibt `inhalte/*.json`. Die Protokolle werden ohne Duplikate zusammengeführt (Ereignis-IDs). Abgeglichen wird beim Start, nach jeder Runde, bei wiederkehrendem Netz und alle 30 Sekunden im Vordergrund.
**Akzeptanz:**
- [x] Zwei Geräte, eins offline, üben beide: Nach dem Abgleich zeigen beide dieselben Punkte, und kein Ereignis fehlt oder ist doppelt (Unit-Test mit zwei simulierten Geräten; echter Test mit zwei Handys offen).
- [x] Das Kind-Gerät schreibt nie nach `inhalte/` (umgesetzt mit Aufgabe 14, Unit-Test).
- [x] Die Merge-Logik hat mindestens 90 % Testabdeckung (`abgleich.ts`: 100 % Zeilen).
**Umsetzung:** Eigene Datei wird nur neu hochgeladen, wenn eigene Ereignisse dazugekommen sind oder sie fehlt; fremde Dateien nur bei geänderter Revision geladen. Kaputte Zeilen werden übersprungen. Status und „Jetzt abgleichen“ im Eltern-Bereich.
**Prüfen:** Unit-Tests des Merges mit gemocktem Dropbox; manuell zwei Geräte, eins im Flugmodus.
**Abhängig von:** 6, 7, 12
**Dateien:** `src/sync/abgleich.ts`, `src/sync/abgleich.test.ts`, `src/sync/useSync.ts`, `src/daten/db.ts`
**Umfang:** M

### Aufgabe 14: Belohnungen und Level-Tabelle verwalten (Eltern) ✅ (Gerätetest offen)
**Beschreibung:** Im Eltern-Bereich Belohnungen anlegen, ändern und löschen (Name, Symbol, Preis) und die Level-Tabelle bearbeiten. Die Startwerte aus SPEC sind vorbelegt. Gespeichert wird in `inhalte/belohnungen.json` und `inhalte/level.json`.
**Akzeptanz:**
- [x] Eine Änderung ist nach dem Abgleich auf dem Kind-Gerät sichtbar (Unit-Test; auf dem Gerät prüfen – Level-Titel erscheinen auf der Startseite, Belohnungen ab Aufgabe 15).
- [x] Ungültige Eingaben (Preis 0, Schwellen nicht aufsteigend) werden verständlich abgelehnt.
**Umsetzung:** Nur Eltern-Geräte schreiben Inhalte; bei zwei Eltern-Geräten gewinnt der neueste Stand. Auf dem Kind-Gerät werden Belohnungen/Level im Eltern-Bereich nur angezeigt.
**Prüfen:** Komponententests; manuell Änderung am Eltern-Handy → Kind-Handy.
**Abhängig von:** 13
**Dateien:** `src/eltern/BelohnungenVerwalten.tsx`, `src/eltern/LevelVerwalten.tsx`, `src/belohnung/inhalte.ts`
**Umfang:** M

### Aufgabe 15: Belohnung einlösen und bestätigen ✅ (auf den Geräten geprüft)
**Beschreibung:** Das Kind sieht alle Belohnungen mit Preis und Fortschritt („noch 300 Punkte“). Es löst ein, wenn das Guthaben reicht, und die Einlösung ist dann „offen“. Die Eltern sehen offene Einlösungen und bestätigen sie. Beides sind Ereignisse.
**Akzeptanz:**
- [x] Das Guthaben sinkt sofort beim Einlösen, das Level nicht (Unit- und E2E-Test).
- [x] Doppeltes Einlösen durch doppeltes Tippen ist nicht möglich (Unit-Test).
- [x] Nach der Bestätigung sieht das Kind „✓ bestätigt“ (E2E-Test).
**Ergänzt:** Kindgerechte Nachfrage vor dem Einlösen; Hinweis-Banner auf der Startseite von Eltern-Geräten, wenn etwas wartet.
**Prüfen:** Unit- und Komponententests; manuell auf beiden Geräten.
**Abhängig von:** 14
**Dateien:** `src/belohnung/Belohnungen.tsx`, `src/eltern/Einloesungen.tsx`, `src/belohnung/logik.ts`
**Umfang:** M

### ✅ Checkpoint C
- [x] Alle Tests grün (277 Unit, 10 E2E)
- [x] Kind- und Eltern-Handy synchron, Belohnung einlösen und bestätigen klappt (geprüft am 01.11.2026)
- [ ] Noch offen von den Eltern: geänderter Level-Titel auf dem Kind-Gerät, Plausibilität der Lernzeiten

---

## Phase 4: Eltern-Bereich mit KI

### Aufgabe 16: KI-Schlüssel hinterlegen ✅ (auf dem Eltern-Handy geprüft)
**Beschreibung:** Im Eltern-Bereich den Anthropic-API-Schlüssel eingeben, mit einem kleinen Testaufruf prüfen und nur lokal speichern. Das geht nur auf Geräten mit der Rolle „Eltern“.
**Akzeptanz:**
- [x] Der Schlüssel landet nie in Dropbox, im Repo oder in Logs (gerätegebundener Speicher, Test).
- [x] Ein ungültiger Schlüssel gibt einen klaren Hinweis.
- [x] Der Schlüssel lässt sich wieder löschen.
**Umsetzung:** Offizielles SDK `@anthropic-ai/sdk` (freigegeben), nur bei Bedarf geladen; Modell `claude-opus-5-5` (freigegeben); Prüfung über die kostenlose Modell-Abfrage.
**Prüfen:** Unit-Test: Sync-Dateien enthalten keinen Schlüssel; manuell mit deinem Schlüssel.
**Abhängig von:** 12
**Dateien:** `src/eltern/kiSchluessel.ts`, `src/eltern/KiEinstellungen.tsx`
**Umfang:** S

### Aufgabe 17a: Lektionen – Format, Speicherung, Abgleich ✅
**Beschreibung:** Lektions-Format nach SPEC 2a (`id`, `fach`, `titel`, `klassenarbeit?`, `erstellt`, fachspezifische `inhalte`; Version 1: Englisch-Wortpaare). Lektionen werden lokal gespeichert und als `inhalte/lektionen/<id>.json` abgeglichen (nur Eltern schreiben). Der Vokabeltrainer übt alle aktiven Englisch-Lektionen statt nur der Beispielliste; steht eine Klassenarbeit an, kommen deren Wörter bevorzugt.
**Akzeptanz:**
- [x] Eine Lektion vom Eltern-Gerät erscheint nach dem Abgleich auf dem Kind-Gerät und wird in Vokabelrunden geübt (Unit-Tests; auf dem Gerät mit 17b).
- [x] Das Format lässt weitere Fächer zu, ohne bestehende Lektionen zu ändern (unbekanntes Fach wird behalten, aber nicht geübt).
- [x] Wörter einer Lektion mit Klassenarbeit in den nächsten 7 Tagen kommen in Runden zuerst (auch in Extra-Runden).
**Umsetzung:** Gelöschte Lektionen bleiben als Markierung, damit das Löschen auf allen Geräten ankommt. Die Beispielliste wird nur geübt, solange es keine Englisch-Lektion gibt.
**Prüfen:** Unit-Tests für Format, Abgleich und Rundenauswahl.
**Abhängig von:** 13, 14
**Dateien:** `src/lektionen/lektion.ts`, `src/lektionen/lektion.test.ts`, `src/sync/inhalteAbgleich.ts`, `src/vokabeln-en/leitner.ts`
**Umfang:** M

### Aufgabe 17b: Lektion aus Fotos (Englisch) ✅ (Test mit echtem Blatt offen)
**Beschreibung:** Im Eltern-Bereich „Neue Lektion“: Fach (vorerst Englisch), Titel, optional Klassenarbeits-Datum, ein oder mehrere Fotos (`<input capture>`), verkleinern, an die Claude API mit Bildverständnis schicken. Sie liefert Wortpaare EN/DE als JSON (mit Schema). Die Eltern sehen eine bearbeitbare Tabelle und geben die Lektion frei. Fotos werden nicht gespeichert.
**Akzeptanz:**
- [ ] Ein typisches Schulbuch-Vokabelblatt ist in unter 3 Minuten vom Foto bis zur Lektion auf ihrem Gerät (auf dem Gerät messen).
- [x] Erkannte Paare lassen sich vor der Freigabe ändern, löschen und ergänzen.
- [x] Ohne Netz oder bei einem KI-Fehler gibt es einen verständlichen Hinweis und nichts geht verloren (Fotos bleiben).
**Umsetzung:** Strukturierte Ausgabe per JSON-Schema (`betaJSONSchemaOutputFormat`), Rückfallebene `fallbacks: "default"`; Fotos im Browser auf 1600 px verkleinert; Lektionen-Liste mit Löschen im Eltern-Bereich.
**Nach dem ersten echten Test (01.11.2026):** Fehlende Übersetzungen ergänzt die KI passend zur 6. Klasse und markiert sie (✨); Kamera direkt in der App (Android beendete die App bei der System-Kamera); Entwurf und Eltern-Freigabe überstehen einen Neustart; „Neue Lektion“ als Vollbild. Mit Foto-Upload auf dem Handy geprüft: „sehr gut“.
**Prüfen:** Unit-Test der Antwort-Verarbeitung mit gemockter API-Antwort; manuell mit einem echten Blatt aus der Schule.
**Abhängig von:** 16, 17a
**Dateien:** `src/eltern/fotoImport.ts`, `src/eltern/fotoImport.test.ts`, `src/eltern/LektionAusFotos.tsx`
**Umfang:** M

### Aufgabe 18a: Lerninhalte verwalten – Gliederung und Bearbeiten (SPEC 10a)
**Beschreibung:** Eigene Ansicht „Lerninhalte“ im Eltern-Bereich: Fach → Lektion → Wörter. Lektionen mit Status (aktiv, pausiert, archiviert) und Reihenfolge; Wörter bearbeiten, ergänzen, löschen, Liste als Text einfügen. Am PC zweispaltig.
**Akzeptanz:**
- [ ] Eine bestehende Lektion lässt sich bearbeiten; bearbeitete Wörter behalten ihren Lernstand (gleiche `id`).
- [ ] Pausierte und archivierte Lektionen kommen nicht in neue Runden (archivierte nur noch als Wiederholung fälliger Wörter).
- [ ] Änderungen erscheinen nach dem Abgleich auf Milenas Gerät.
- [ ] Am PC (Breite ≥ 1000 px) zweispaltig, am Handy einspaltig ohne waagerechtes Scrollen.
**Prüfen:** Unit-Tests (Status-Filter, Text einfügen), Komponententests, E2E im Desktop- und Handy-Format; manuell am PC.
**Abhängig von:** 17a, 17b
**Dateien:** `src/lektionen/lektion.ts`, `src/eltern/Lerninhalte.tsx`, `src/eltern/LektionBearbeiten.tsx`, `src/vokabeln-en/quellen.ts`
**Umfang:** M

### Aufgabe 18b: Fortschritt pro Lektion und Wochenübersicht
**Beschreibung:** In der Ansicht „Lerninhalte“ pro Lektion den Fortschritt (neu / am Lernen / sicher) und pro Wort Fach, zuletzt geübt und Fehlerzahl. Dazu „Wörter, die ihr gerade schwerfallen“ und die Wochenübersicht der letzten 7 Tage (Lerntage, Minuten, Runden, gelernte Wörter).
**Akzeptanz:**
- [ ] Die Zahlen stimmen mit dem Ereignis-Protokoll überein (Unit-Test).
- [ ] Sichtbar ist, welche Lektion gerade dran ist und wann sie zuletzt geübt hat.
**Prüfen:** Unit- und Komponententests.
**Abhängig von:** 13, 18a
**Dateien:** `src/eltern/statistik.ts`, `src/eltern/statistik.test.ts`, `src/eltern/Wochenuebersicht.tsx`
**Umfang:** M

### Aufgabe 19: End-to-End-Tests und Abnahme auf dem Gerät
**Beschreibung:** Playwright-Tests für die Hauptabläufe ergänzen: Runde, Level-Aufstieg, Einlösen und Bestätigen, Foto-Import (gemockt), Eltern-PIN. Danach die Abnahme aus SPEC Abschnitt 10 auf den echten Geräten durchgehen.
**Akzeptanz:**
- [ ] Alle E2E-Tests grün.
- [ ] Jeder Punkt aus SPEC Abschnitt 10 ist abgehakt.
**Prüfen:** `npm run test:e2e`; Abnahme-Checkliste gemeinsam.
**Abhängig von:** 15, 17, 18a, 18b
**Dateien:** `e2e/*.spec.ts`
**Umfang:** M

### ✅ Checkpoint D: Version 1 fertig
- [ ] Alle Abnahmekriterien aus SPEC Abschnitt 10 erfüllt
- [ ] Planung der nächsten Module (`rechtschreibung-de`, `lesen-de`, `mathe`)

---

## Phase 5: Betrieb und Rückmeldungen (SPEC 10a)

### Aufgabe 20: Versionierung
**Beschreibung:** Versionsnummer nach SemVer aus `package.json` zur Build-Zeit in die App; Anzeige in Einstellungen und Eltern-Bereich mit „Was ist neu“ (aus `CHANGELOG.md`, Abschnitt der aktuellen Version). Git-Tag und GitHub-Release je Version. Feld `format` in allen Dropbox-Dateien; unbekannte neuere Formate werden beim Abgleich übersprungen statt überschrieben.
**Akzeptanz:**
- [ ] Die App zeigt „Version 1.x.y“ und „Was ist neu“.
- [ ] `CHANGELOG.md` beschreibt jede Version in einfachen Worten; zu jeder Version gibt es einen Tag.
- [ ] Ein Gerät mit älterer App-Version überschreibt keine Datei in neuerem Format (Unit-Test).
**Abhängig von:** –
**Dateien:** `vite.config.ts`, `CHANGELOG.md`, `src/basis/Version.tsx`, `src/sync/*Abgleich.ts`
**Umfang:** M

### Aufgabe 21: Qualitätssicherung und Testkanal
**Beschreibung:** GitHub Action ergänzen: E2E-Tests (Playwright) und Abdeckungsschwelle. Zwei Ziele auf GitHub Pages: `main` → `/MiApp/vorschau/` (Testkanal), Freigabe per Tag `v*` → `/MiApp/` (Milena). Gerätetest-Checkliste `docs/geraetetest.md`.
**Akzeptanz:**
- [ ] Ein Push auf `main` aktualisiert nur den Testkanal; Milenas App ändert sich erst nach einer Freigabe.
- [ ] Rote E2E-Tests oder zu wenig Abdeckung verhindern jede Veröffentlichung.
- [ ] Testkanal und Live-App haben getrennte Daten auf dem Gerät (eigene Installation).
**Abhängig von:** 20
**Dateien:** `.github/workflows/deploy.yml`, `vite.config.ts`, `docs/geraetetest.md`
**Umfang:** M

### Aufgabe 22: Feedback „Sag uns was“
**Beschreibung:** Knopf auf der Startseite: Smiley (😀 😐 😟) + optionaler Satz (Textfeld, für Spracheingabe der Android-Tastatur ausgelegt), alles vorlesbar. Kontext automatisch (Version, Seite, Gerät, Zeit). Technische Fehler (`window.onerror`, `unhandledrejection`) werden lokal gesammelt und mitgeschickt. Ablage in Dropbox `feedback/<geraete-id>.jsonl` (ein Schreiber pro Datei); Liste im Eltern-Bereich mit „erledigt“.
**Akzeptanz:**
- [ ] Milena kann in unter 30 Sekunden ein Feedback abschicken, ohne tippen zu müssen.
- [ ] Feedback erscheint nach dem Abgleich im Eltern-Bereich des anderen Geräts.
- [ ] Ein absichtlich ausgelöster Fehler landet als technische Meldung in der Liste.
**Abhängig von:** 13, 20
**Dateien:** `src/feedback/*`, `src/sync/feedbackAbgleich.ts`, `src/eltern/FeedbackListe.tsx`
**Umfang:** M

### Aufgabe 23: Klassenarbeiten und Tests eintragen
**Beschreibung:** Kachel „📝 Tests“: eintragen (Fach, Art, Datum, Thema, bei Englisch optional Lektion → Vorrang), nach dem Datum „Wie lief dein Test?“ mit Note oder „weiß ich noch nicht“. Ereignisse `test-eingetragen`, `test-ergebnis`, `test-bestaetigt`. Bonus für Einsatz: Eintragen sofort, Ergebnis- und Verbesserungsbonus nach Bestätigung durch die Eltern. Übersicht im Eltern-Bereich.
**Akzeptanz:**
- [ ] Punkte gibt es fürs Eintragen und Nachtragen unabhängig von der Note; Verbesserung im selben Fach gibt Extra-Bonus (Unit-Tests).
- [ ] Ergebnis-Bonus zählt erst nach Bestätigung der Eltern.
- [ ] Eine eingetragene Englisch-Arbeit mit Lektion gibt deren Wörtern Vorrang.
**Abhängig von:** 15, 17a
**Dateien:** `src/tests/*`, `src/belohnung/werte.ts`, `src/belohnung/logik.ts`, `src/eltern/TestUebersicht.tsx`
**Umfang:** L (ggf. in 23a Eintragen/Bonus und 23b Übersicht teilen)

### ✅ Checkpoint E
- [ ] Neue Versionen gehen zuerst in den Testkanal
- [ ] Milena kann Feedback geben und Tests eintragen; Bonus und Bestätigung funktionieren
