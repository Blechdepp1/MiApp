# Umsetzungsplan: MiApp Version 1

Grundlage: [SPEC.md](../SPEC.md) v1.0 Â· Aufgaben im Detail: [todo.md](todo.md)

## Ãœberblick

Wir bauen die PWA in dÃ¼nnen, lauffÃ¤higen Scheiben. Zuerst kommt die Grundlage: App installierbar, Vorlesen, LRS-Darstellung. Die riskanten Teile (Vorlesen auf dem echten Android-GerÃ¤t, Dropbox-Anmeldung) testen wir **frÃ¼h** mit einem Durchstich.
Danach entsteht der Vokabeltrainer mit Punkten **lokal auf einem GerÃ¤t**. Diese Version kann eure Tochter schon ausprobieren, bevor Sync und Eltern-Bereich fertig sind.
Danach folgen Sync, Belohnungen einlÃ¶sen und zuletzt der Foto-Import mit KI.

## Architektur-Entscheidungen

- **Ereignis-Protokoll als Kern:** Jede Lernaktion wird als Ereignis lokal gespeichert (Dexie). Punkte, Level, Guthaben und der Leitner-Stand werden daraus *berechnet*. Der Sync muss deshalb nur Protokolle austauschen und zusammenfÃ¼hren und kennt keine Konflikte bei Zahlen.
- **Fachlogik ohne React:** Punkte, Level, Leitner, Antwortbewertung und Merge sind reine Funktionen in `*/logik.ts` und vollstÃ¤ndig unit-getestet.
- **Lokal zuerst:** Die App funktioniert komplett ohne Dropbox. Der Sync ist eine Schicht darÃ¼ber, die Dateien abgleicht.
- **Eingebaute Beispiel-Vokabelliste**, damit der Vokabeltrainer vor dem Foto-Import testbar ist.
- **GerÃ¤te-Rolle** (Kind/Eltern) wird beim Einrichten gewÃ¤hlt und lokal gespeichert. Der KI-SchlÃ¼ssel kann nur auf einem Eltern-GerÃ¤t hinterlegt werden.

## Aufgabenliste (Index)

### Phase 1: Grundlage
- [x] 1. Projekt einrichten
- [x] 2. PWA installierbar + Deployment auf GitHub Pages
- [x] 3. Vorlese-Funktion
- [x] 4. LRS-Darstellung und Einstellungen
- [x] 5. App-GerÃ¼st mit Startseite und Navigation
- [x] 6. Dropbox-Durchstich

**Checkpoint A:** App ist auf ihrem Handy installiert, liest vor und kann eine Testdatei in Dropbox schreiben.

### Phase 2: Vokabeln mit Punkten (lokal)
- [x] 7. Ereignis-Protokoll und Punkte-/Level-Logik
- [ ] 8. Leitner-Logik und Antwortbewertung
- [ ] 9. Erste Vokabelrunde (AnhÃ¶ren â†’ WÃ¤hlen) mit Punkten
- [ ] 10. Ãœbungsarten â€žDeutsch â†’ Englisch wÃ¤hlenâ€œ und â€žSchreibenâ€œ
- [ ] 11. Fortschritt auf der Startseite und Level-Aufstieg

**Checkpoint B:** Sie kann auf ihrem GerÃ¤t Ã¼ben und Punkte sammeln. **Erster Test mit eurer Tochter.**

### Phase 3: Sync und Belohnungen
- [ ] 12. GerÃ¤te-Rolle und Eltern-PIN
- [ ] 13. Dropbox-Sync von Ereignissen und Inhalten
- [ ] 14. Belohnungen und Level-Tabelle verwalten (Eltern)
- [ ] 15. Belohnung einlÃ¶sen und bestÃ¤tigen

**Checkpoint C:** Kind- und Eltern-Handy zeigen dieselben Punkte, und eine Belohnung lÃ¤sst sich einlÃ¶sen und bestÃ¤tigen.

### Phase 4: Eltern-Bereich mit KI
- [ ] 16. KI-SchlÃ¼ssel hinterlegen
- [ ] 17. Foto-Import einer Vokabelliste
- [ ] 18. WochenÃ¼bersicht fÃ¼r Eltern
- [ ] 19. End-to-End-Tests und Abnahme auf dem GerÃ¤t

**Checkpoint D:** Alle Abnahmekriterien aus SPEC.md Abschnitt 10 sind erfÃ¼llt, und Version 1 ist fertig.

## Risiken

| Risiko | Auswirkung | GegenmaÃŸnahme |
|---|---|---|
| Android hat keine oder schlechte deutsche/englische Stimme im Browser | Hoch | FrÃ¼h in Aufgabe 3 auf dem echten GerÃ¤t prÃ¼fen. Notfalls Google-Sprachdaten in den Android-Einstellungen nachinstallieren, im Notfall vorab erzeugte Audiodateien. |
| Dropbox-Anmeldung (PKCE) aus der PWA klappt nicht sauber (Weiterleitung, Token-Erneuerung) | Hoch | Durchstich in Aufgabe 6, bevor wir darauf aufbauen. |
| Claude API direkt aus dem Browser (CORS) | Mittel | Die API erlaubt Browser-Aufrufe mit eigenem Header. Kurzer Test zu Beginn von Aufgabe 17. Notfalls Import am PC. |
| Handschrift oder schlechte Fotos werden falsch erkannt | Mittel | Bearbeitbare Vorschau vor der Freigabe, das ist ohnehin Pflicht. |
| `node_modules` in Dropbox | Niedrig | Ausnahme per `com.dropbox.ignored` vor dem ersten `npm install` (Aufgabe 1). |
| Punktwerte motivieren nicht wie gedacht | Mittel | Nach Checkpoint B mit ihr testen und Werte anpassen. Sie liegen zentral in einer Datei. |

## Offene Fragen

Keine. Die Dropbox-App wird in Aufgabe 6 gemeinsam angelegt.
