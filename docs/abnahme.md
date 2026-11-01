# Abnahme Version 1.0 (Aufgabe 19)

Grundlage: SPEC.md Abschnitt 10 und 10a. Automatische Prüfungen laufen bei jeder Änderung; die Punkte unten prüft ihr auf den echten Geräten.
Am besten mit der freigegebenen Version auf **Milenas Handy** und dem **Eltern-Handy** (nicht im Testkanal), damit der Abgleich mit echten Daten geprüft wird.

## Automatisch geprüft ✅

- [x] Alle Unit- und E2E-Tests grün (bei GitHub vor jeder Veröffentlichung).
- [x] Abdeckung der Fachlogik ≥ 90 % (Untergrenze im CI erzwungen).
- [x] Hauptabläufe als E2E: Vokabelrunde, Level-Aufstieg, Belohnung einlösen und bestätigen, Lektion aus Foto (KI nachgestellt), Eltern-PIN, Tests eintragen und bestätigen, Rückmeldung, Lerninhalte am Handy und PC, Zurück-Taste.

## Auf den Geräten prüfen

| # | Prüfung | Wie | OK? |
|---|---|---|---|
| 1 | Läuft offline | Milenas Handy in den Flugmodus, App öffnen, eine Runde spielen. Danach wieder online: Punkte kommen auf dem Eltern-Handy an. | ☐ |
| 2 | Foto → Übung in unter 3 Minuten | Eltern-Handy: Vokabelblatt fotografieren, prüfen, freigeben. Stoppuhr bis die Wörter auf Milenas Handy in einer Runde auftauchen (ggf. App dort kurz öffnen). | ☐ |
| 3 | Runde ohne Lesehilfe | Milena macht eine Runde allein; alles Nötige lässt sich vorlesen. | ☐ |
| 4 | Gleiche Zahlen auf beiden Geräten | Punkte, Level und Guthaben auf beiden Handys vergleichen (nach „Jetzt abgleichen“). | ☐ |
| 5 | Einlösen und bestätigen | Milena löst eine Belohnung ein, das Eltern-Handy zeigt „Zu erledigen“ und bestätigt; Milena sieht „✓ bestätigt“. | ☐ |
| 6 | Tests | Milena trägt einen Test ein (+20), am Tag danach die Note; Eltern bestätigen auf ihrem Handy. | ☐ |
| 7 | Rückmeldung | Milena schickt „Sag uns was“ mit 🎤 Sprechen; sie erscheint auf dem Eltern-Handy. | ☐ |
| 8 | Level-Titel | Nach einem Level-Aufstieg erscheint der neue Titel auf Milenas Handy. | ☐ |
| 9 | Schreibübung | Bei „Schreiben“ verdeckt die Tastatur weder Wort noch „Weiter“. | ☐ |
| 10 | Wochenübersicht | Eltern-Bereich → Wochenübersicht zeigt die Runden der Woche plausibel (Minuten, Lerntage). | ☐ |

Alles ✓? Dann sagt „Version 1.0 freigeben“. Vorher läuft noch der Startcheck (`ship`).
