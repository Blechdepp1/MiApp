# Anleitung für Eltern

## Eltern-PIN vergessen

Die PIN liegt nur verschlüsselt auf dem Gerät. Zurücksetzen geht nur, indem ihr die Daten der App auf diesem Gerät löscht und es neu einrichtet:

1. Chrome → ⋮ → Einstellungen → Website-Einstellungen → Alle Websites → `blechdepp1.github.io` → **Daten löschen**.
2. MiApp öffnen, Gerät neu einrichten (Rolle und neue PIN), im Eltern-Bereich wieder mit Dropbox verbinden.
3. Nach dem Abgleich sind Punkte, Lektionen und Belohnungen wieder da. Den KI-Schlüssel müsst ihr neu eintragen.

Diese Anleitung steht absichtlich nicht in der App.

## Sicherheit: was wir eingerichtet haben und was ihr tun könnt

- **Bestätigen nur auf Eltern-Geräten:** Einlösungen und Noten lassen sich nur auf einem Gerät mit der Rolle „Eltern“ bestätigen.
- **PIN:** Nach 5 falschen Versuchen ist der Eltern-Bereich gesperrt, jedes Mal länger (1, 5, 15, 60 Minuten), auch nach einem Neuladen. Ohne Eingabe schließt er sich nach 5 Minuten, im Hintergrund nach 2 Minuten.
- **Dropbox auf Milenas Handy:** Nach dem Verbinden in Chrome auf dropbox.com **abmelden**. Die App bleibt verbunden, aber ein erneutes Verbinden braucht dann euer Dropbox-Passwort.
- **KI-Schlüssel:** Am besten einen eigenen Schlüssel nur für MiApp mit niedrigem **Monatslimit** in der Anthropic-Konsole anlegen. Bei Verdacht dort widerrufen und neu anlegen.
- **Keine weiteren GitHub-Pages-Seiten** unter dem Konto `Blechdepp1` veröffentlichen: Sie liefen unter derselben Adresse wie MiApp und könnten deren Daten im Browser lesen. Aus demselben Grund geht jede Änderung, die in den Testkanal kommt, schon unter dieser Adresse online.

## Datenschutz

- **Dropbox:** Punkte, Lektionen, Noten von Tests und Rückmeldungen liegen in eurer Dropbox unter `Apps/MiApp-Lernen` (Testkanal: `Apps/MiApp-Lernen/vorschau`).
- **Fotos für Lektionen** gehen zur Auswertung an Anthropic (Claude) und werden in der App nicht gespeichert. Am besten nur die Wortliste fotografieren, ohne Namen.
- **„🎤 Sprechen“** nutzt die Spracherkennung von Chrome. Dafür schickt Chrome die Aufnahme an Google, genau wie bei der Diktierfunktion der Tastatur.
- **Fehlermeldungen** enthalten nur die Fehlermeldung, die Seite, die Version und eine grobe Geräteangabe (z. B. „Android 14 · Chrome 141“).
