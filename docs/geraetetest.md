# Neue Version prüfen und freigeben

MiApp gibt es zweimal:

| | Adresse | Für wen | Daten |
|---|---|---|---|
| **Live-App** | https://blechdepp1.github.io/MiApp/ | Milena (und Eltern) | echte Punkte, Lektionen, Belohnungen |
| **Testkanal** | https://blechdepp1.github.io/MiApp-Vorschau/ | nur Eltern | eigene Testdaten, Dropbox-Unterordner `vorschau/` |

Jede Änderung landet zuerst im **Testkanal**. Milenas App ändert sich erst, wenn ihr eine Version **freigebt**.

Der Testkanal liegt absichtlich nicht unter `/MiApp/`: Android ordnet sonst alles darunter der installierten Live-App zu („bereits installiert“), und er ließe sich nicht als eigene App installieren. Veröffentlicht wird er vom Repository `Blechdepp1/MiApp-Vorschau`: Dessen Workflow baut den aktuellen Stand von MiApp, sobald hier die Prüfungen bestanden sind (von Hand ausgelöst und alle 15 Minuten). Die alte Adresse `/MiApp/vorschau/` leitet um.

## Testkanal einmal einrichten (Eltern-Handy)

1. In Chrome https://blechdepp1.github.io/MiApp-Vorschau/ öffnen → Menü → „Installieren“. Die App heißt **„MiApp Test“**, das Symbol ist gelb, die Leiste oben orange.
2. Gerät einrichten (Rolle und PIN wie gewohnt). Der Testkanal hat **eigene Daten** – was ihr dort übt oder anlegt, sieht Milena nicht.
3. Optional Dropbox verbinden. Dafür muss die Adresse `https://blechdepp1.github.io/MiApp-Vorschau/` einmal in der Dropbox App Console unter **Redirect URIs** eingetragen sein. Die Testdaten liegen dann im Unterordner `vorschau/`.

## Checkliste vor jeder Freigabe (ca. 5 Minuten, im Testkanal)

- [ ] Einstellungen: Unten steht die neue Versionsnummer, „Was ist neu?“ passt.
- [ ] Vorlesen: Startseite und ein Wort in der Runde werden vorgelesen (deutsch und englisch).
- [ ] Eine Vokabelrunde komplett: anhören, auswählen, schreiben; Punkte kommen dazu.
- [ ] Zurück-Taste: aus der Runde kommt die Frage „Möchtest du wirklich aufhören?“.
- [ ] Belohnung einlösen und im Eltern-Bereich bestätigen.
- [ ] Eltern-Bereich: neue Lektion aus Foto (Kamera) bis zur Vorschau.
- [ ] Abgleich: „Zuletzt abgeglichen“ ist aktuell (falls Dropbox verbunden).
- [ ] Was in dieser Version neu ist, einmal ausprobieren.

Alles gut? Dann Claude sagen: **„Version freigeben“**.

## Freigeben (macht Claude)

1. Version in `package.json` erhöhen und den Abschnitt in `CHANGELOG.md` schreiben (einfache Worte, für Milena verständlich).
2. Committen und pushen → der Testkanal zeigt genau diese Version.
3. Nach dem OK der Eltern: `npm run freigeben` – setzt den Tag `v<version>`, legt das GitHub-Release an und startet die Veröffentlichung.
4. Milenas App lädt die neue Version beim nächsten Öffnen (ggf. App einmal ganz schließen).

**Zurück zur vorherigen Version:** Tag der kaputten Version löschen (`git push origin :refs/tags/vX.Y.Z`) und die Veröffentlichung neu starten – dann wird wieder die vorherige Freigabe gebaut.
