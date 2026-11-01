# Umsetzungsplan: MiApp Version 1

Grundlage: [SPEC.md](../SPEC.md) v1.0 · Aufgaben im Detail: [todo.md](todo.md)

## Überblick

Wir bauen die PWA in dünnen, lauffähigen Scheiben. Zuerst kommt die Grundlage: App installierbar, Vorlesen, LRS-Darstellung. Die riskanten Teile (Vorlesen auf dem echten Android-Gerät, Dropbox-Anmeldung) testen wir **früh** mit einem Durchstich.
Danach entsteht der Vokabeltrainer mit Punkten **lokal auf einem Gerät**. Diese Version kann eure Tochter schon ausprobieren, bevor Sync und Eltern-Bereich fertig sind.
Danach folgen Sync, Belohnungen einlösen und zuletzt der Foto-Import mit KI.

## Architektur-Entscheidungen

- **Ereignis-Protokoll als Kern:** Jede Lernaktion wird als Ereignis lokal gespeichert (Dexie). Punkte, Level, Guthaben und der Leitner-Stand werden daraus *berechnet*. Der Sync muss deshalb nur Protokolle austauschen und zusammenführen und kennt keine Konflikte bei Zahlen.
- **Fachlogik ohne React:** Punkte, Level, Leitner, Antwortbewertung und Merge sind reine Funktionen in `*/logik.ts` und vollständig unit-getestet.
- **Lokal zuerst:** Die App funktioniert komplett ohne Dropbox. Der Sync ist eine Schicht darüber, die Dateien abgleicht.
- **Eingebaute Beispiel-Vokabelliste**, damit der Vokabeltrainer vor dem Foto-Import testbar ist.
- **Geräte-Rolle** (Kind/Eltern) wird beim Einrichten gewählt und lokal gespeichert. Der KI-Schlüssel kann nur auf einem Eltern-Gerät hinterlegt werden.

## Aufgabenliste (Index)

### Phase 1: Grundlage
- [x] 1. Projekt einrichten
- [x] 2. PWA installierbar + Deployment auf GitHub Pages
- [x] 3. Vorlese-Funktion
- [x] 4. LRS-Darstellung und Einstellungen
- [x] 5. App-Gerüst mit Startseite und Navigation
- [x] 6. Dropbox-Durchstich

**Checkpoint A:** App ist auf ihrem Handy installiert, liest vor und kann eine Testdatei in Dropbox schreiben.

### Phase 2: Vokabeln mit Punkten (lokal)
- [x] 7. Ereignis-Protokoll und Punkte-/Level-Logik
- [x] 8. Leitner-Logik und Antwortbewertung
- [x] 9. Erste Vokabelrunde (Anhören → Wählen) mit Punkten
- [x] 10. Übungsarten „Deutsch → Englisch wählen“ und „Schreiben“
- [x] 11. Fortschritt auf der Startseite und Level-Aufstieg

**Checkpoint B:** Sie kann auf ihrem Gerät üben und Punkte sammeln. **Erster Test mit eurer Tochter.**

### Phase 3: Sync und Belohnungen
- [x] 12. Geräte-Rolle und Eltern-PIN
- [x] 13. Dropbox-Sync von Ereignissen und Inhalten
- [x] 14. Belohnungen und Level-Tabelle verwalten (Eltern)
- [x] 15. Belohnung einlösen und bestätigen

**Checkpoint C:** Kind- und Eltern-Handy zeigen dieselben Punkte, und eine Belohnung lässt sich einlösen und bestätigen.

### Phase 4: Eltern-Bereich mit KI
- [x] 16. KI-Schlüssel hinterlegen
- [x] 17a. Lektionen: Format, Speicherung, Abgleich (vorbereitet für Deutsch und Mathe)
- [ ] 17b. Lektion aus Fotos (Englisch)
- [ ] 18. Wochenübersicht für Eltern
- [ ] 19. End-to-End-Tests und Abnahme auf dem Gerät

**Checkpoint D:** Alle Abnahmekriterien aus SPEC.md Abschnitt 10 sind erfüllt, und Version 1 ist fertig.

### Nach Version 1 (jeweils mit eigenem Spec)
- `rechtschreibung-de` – Lernwörter aus Deutsch-Lektionen, Fehlerschwerpunkte
- `lesen-de` – Lesetexte aus Lektionen mit Verständnisfragen
- `mathe` – ähnliche Aufgaben zu den Themen aus Mathe-Lektionen; vorher Themen der Klasse erfragen

## Risiken

| Risiko | Auswirkung | Gegenmaßnahme |
|---|---|---|
| Android hat keine oder schlechte deutsche/englische Stimme im Browser | Hoch | Früh in Aufgabe 3 auf dem echten Gerät prüfen. Notfalls Google-Sprachdaten in den Android-Einstellungen nachinstallieren, im Notfall vorab erzeugte Audiodateien. |
| Dropbox-Anmeldung (PKCE) aus der PWA klappt nicht sauber (Weiterleitung, Token-Erneuerung) | Hoch | Durchstich in Aufgabe 6, bevor wir darauf aufbauen. |
| Claude API direkt aus dem Browser (CORS) | Mittel | Die API erlaubt Browser-Aufrufe mit eigenem Header. Kurzer Test zu Beginn von Aufgabe 17. Notfalls Import am PC. |
| Handschrift oder schlechte Fotos werden falsch erkannt | Mittel | Bearbeitbare Vorschau vor der Freigabe, das ist ohnehin Pflicht. |
| `node_modules` in Dropbox | Niedrig | Ausnahme per `com.dropbox.ignored` vor dem ersten `npm install` (Aufgabe 1). |
| Punktwerte motivieren nicht wie gedacht | Mittel | Nach Checkpoint B mit ihr testen und Werte anpassen. Sie liegen zentral in einer Datei. |

## Offene Fragen

Keine. Die Dropbox-App wird in Aufgabe 6 gemeinsam angelegt.
