# Entwurf: Fach-Modul `mathe`

Status: **Entwurf zur Diskussion** (01.11.2026), noch kein Spec und kein Code.
Grundlage: [didaktik-mathe.md](didaktik-mathe.md) (Forschungsstand), [SPEC.md](../SPEC.md) Abschnitte 1, 2, 2a und 10a.
Die konkreten Themen der Klasse sind noch offen. Der Entwurf deckt deshalb Klasse 5–7 allgemein ab. Die Fragen an euch stehen am Ende.

## Grundidee in drei Sätzen

1. Die App kennt einen festen **Katalog von Aufgabentypen** (zum Beispiel „Brüche addieren, ungleichnamig“). Zu jedem Typ gibt es ein Programmstück, das neue Zahlen erzeugt, die richtige Lösung **exakt selbst ausrechnet** und Antworten prüft.
2. Aus Fotos von Buch und Heft **ordnet die KI nur zu**: welche Aufgabentypen auf der Seite vorkommen, in welchem Zahlenbereich und mit welchen Beispielen. Die KI rechnet nichts, was später als richtig oder falsch gewertet wird.
3. Geübt wird wie bei den Vokabeln: kurze Runden, alles vorlesbar, Fehler kosten nie Punkte, Wiederholung in Abständen. Neu dazu kommen vorgerechnete Beispiele, Bilder (Zahlenstrahl, Bruchstreifen) und Rückmeldungen, die typische Denkfehler erkennen.

## Wie aus einem Foto sichere Übungsaufgaben werden

Dieser Ablauf gilt für alle Vorschläge unten. Er erweitert den bestehenden Foto-Import (SPEC 2a) um das Fach Mathe.

```
Foto(s) ──► KI: Aufgabentypen zuordnen ──► App: Beispiele nachrechnen ──► Eltern: Vorschau prüfen ──► Lektion
            (strukturiertes JSON,           (mit eigenem Rechenkern,       (Beispielaufgaben mit
             nur Typen aus dem Katalog)      Abweichungen markieren)        neuen Zahlen ansehen)
```

1. **Fotografieren und einordnen:** wie bisher, Fach „Mathe“, Titel zum Beispiel „Brüche addieren“, optional das Datum der Klassenarbeit.
2. **KI-Auswertung:** Die App schickt die Fotos mit der Liste der bekannten Aufgabentypen an die Claude API. Wie beim Englisch-Import kommt die Antwort als strukturiertes JSON nach festem Schema (`output_config.format`). Die KI liefert je erkanntem Thema:
   - `typ`: eine id aus dem Katalog (andere Werte lehnt das Schema ab),
   - `parameter`: Zahlenbereich und Schwierigkeit, etwa „Nenner bis 12“, „mit gemischten Zahlen“, „Ergebnis kürzen“,
   - `beispiele`: die Aufgaben von der Seite, so wie sie dastehen, mit der Lösung aus dem Buch, falls eine abgedruckt ist,
   - `vorgerechnet`: optional ein Lösungsweg aus einem „Beispiel“- oder „Merke“-Kasten, als Schritte,
   - `textvorlage` (nur bei Textaufgaben): der Text mit Platzhaltern für die Zahlen, etwa „{a} Kinder teilen sich {b} Pizzen …“, und eine Rechenvorschrift im festen Format, etwa `b / a`.
   - Aufgaben, zu denen kein Katalog-Typ passt, meldet die KI als `unbekannt` mit kurzer Beschreibung. Sie werden nicht automatisch geübt.
3. **Nachrechnen durch die App:** Die App rechnet jedes abfotografierte Beispiel mit ihrem eigenen Rechenkern nach. Stimmt das Ergebnis nicht mit der Lösung aus dem Buch überein, oder liefert eine Textvorlage für die Originalzahlen ein anderes Ergebnis, wird das Thema in der Vorschau **gelb markiert** („Bitte prüfen: Die App kommt auf 7/12, im Buch steht 5/12“). So fallen Lesefehler der KI und Fehler im Zahlenbereich auf.
4. **Vorschau für die Eltern:** Pro Thema zeigt die Vorschau den Typ in Klartext, den Zahlenbereich und **drei neu erzeugte Beispielaufgaben mit Lösung**. Die Eltern können Typ und Zahlenbereich ändern, Themen löschen oder unbekannte Aufgaben als **feste Aufgabe** mit eigener Lösung übernehmen (ohne neue Zahlen). Erst nach der Freigabe wird die Lektion gespeichert.
5. **Üben:** Beim Üben erzeugt die App jedes Mal neue Zahlen im freigegebenen Bereich und prüft die Antworten selbst.

### Wie die App sicher selbst prüft

- **Exakt rechnen statt Kommazahlen:** Alle Rechnungen laufen über Brüche aus ganzen Zahlen (`BigInt`-Zähler und -Nenner). Dezimalzahlen werden intern als Brüche geführt (0,35 = 35/100). So gibt es keine Rundungsfehler wie bei `0.1 + 0.2` in JavaScript.
- **Erzeugen nur mit „schönen“ Ergebnissen:** Jeder Aufgabentyp legt fest, welche Ergebnisse erlaubt sind (zum Beispiel ganzzahlig, höchstens zwei Nachkommastellen, Nenner bis 24). Die Zahlen werden so lange neu gewürfelt, bis das passt. Das prüfen Tests mit vielen tausend zufälligen Aufgaben.
- **Antworten nach Wert vergleichen, Form getrennt prüfen:** 2/4 und 1/2 haben denselben Wert. Ob „gekürzt“ verlangt ist, legt der Typ fest. Ist die Antwort richtig, aber nicht gekürzt, sagt die App: „Richtig! Kannst du noch kürzen?“ Das zählt als richtig.
- **Terme:** Ein Term wird geprüft, indem die App beide Terme an mehreren zufälligen Stellen ausrechnet. Stimmen alle Werte überein, sind die Terme gleich. Zusätzlich prüft die App die verlangte Form (etwa „zusammengefasst“: höchstens ein x-Glied und eine Zahl).
- **Gleichungen:** Die Lösung wird durch Einsetzen geprüft.
- **Geometrie:** Längen und Flächen werden aus den erzeugten Maßen exakt berechnet. Bei Mess- und Zeichenaufgaben am Bildschirm gilt eine feste Toleranz, etwa ±2° oder ±1 mm.
- **Einheiten:** Die Einheit steht fest neben dem Eingabefeld. Milena muss sie nicht tippen.
- **Rechenvorschriften aus Textvorlagen** werden nicht als Programmcode ausgeführt. Ein kleiner eigener Parser kennt nur Zahlen, Platzhalter, `+ − · : ( )` und Prozent. Alles andere lehnt die App ab.

## Katalog der Aufgabentypen (Startvorschlag Klasse 5–7)

Jeder Typ hat eine id, einen Namen in Klartext, Parameter, einen Erzeuger, eine Prüfung, ein vorgerechnetes Standardbeispiel und eine Liste typischer Fehler. Der Katalog wächst mit den Themen der Klasse. Fett markiert ist, was für den Start wohl am wichtigsten ist (ohne eure Antworten nur geschätzt).

| Bereich | Aufgabentypen |
|---|---|
| Natürliche Zahlen | Stellenwert, runden, schriftlich rechnen (+ − · :), Teilbarkeit, ggT/kgV, Potenzen |
| **Brüche** | **erweitern/kürzen**, **vergleichen**, **auf dem Zahlenstrahl**, **addieren/subtrahieren** (gleich- und ungleichnamig), multiplizieren, dividieren, Bruchteil von einer Größe, gemischte Zahlen |
| **Dezimalzahlen** | **umwandeln Bruch ↔ Dezimal**, **vergleichen/ordnen**, runden, rechnen |
| Prozent | Bruch ↔ Prozent, Prozentwert, Prozentsatz, Grundwert |
| Negative Zahlen | ordnen am Zahlenstrahl, addieren/subtrahieren, multiplizieren/dividieren |
| Terme und Gleichungen | Termwert berechnen, gleichartige Glieder zusammenfassen, Gleichungen `ax + b = c` lösen |
| Zuordnungen | proportional (Dreisatz), antiproportional |
| Geometrie | Umfang und Fläche (Rechteck, Dreieck, zusammengesetzt), Volumen und Oberfläche Quader, Winkel (Neben-, Scheitel-, Winkelsumme), Koordinaten |
| Größen | Einheiten umrechnen (Länge, Masse, Zeit, Geld, Fläche, Volumen) |
| Daten | Mittelwert, Diagramme ablesen |

## Vorschläge, priorisiert nach Nutzen × Aufwand

Nutzen und Aufwand sind auf einer Skala von 1 (gering) bis 3 (hoch) geschätzt. Priorität A = gehört in die erste Mathe-Version.

| # | Vorschlag | Nutzen | Aufwand | Priorität |
|---|---|---|---|---|
| M1 | Rechenkern und erste Aufgabentypen | 3 | 2 | **A** (Grundlage) |
| M2 | Mathe-Runde: vorlesbar, Ziffernblock, fehlerfreundlich, Punkte | 3 | 2 | **A** |
| M3 | Wiederholung in Abständen und gemischtes Üben | 3 | 1 | **A** |
| M4 | Lektion aus Fotos für Mathe | 3 | 2 | **A** |
| M5 | Vorgerechnete Beispiele und Hilfe in Stufen | 3 | 2 | **A** |
| M6 | Typische Denkfehler erkennen und erklären | 2 | 1 | B |
| M7 | Bilder: Zahlenstrahl, Bruchstreifen, Geometrie-Skizzen | 3 | 3 | B |
| M8 | Klassenarbeit vorbereiten | 2 | 1 | B |
| M9 | Fortschritt für Eltern: was sitzt, wo es hakt | 2 | 1 | B |
| M10 | Textaufgaben Schritt für Schritt | 2 | 3 | C |
| M11 | Grundlagen-Training (Einmaleins, Bruch–Dezimal–Prozent) | 1 | 1 | C |

Die Reihenfolge innerhalb von A: M1 → M2 → M3 → M5 → M4. So kann Milena schon mit eingebauten Beispiel-Themen üben, bevor der Foto-Import für Mathe fertig ist, genau wie bei den Vokabeln mit der eingebauten Beispielliste.

---

### M1 – Rechenkern und erste Aufgabentypen (A)

**Was Milena erlebt:** Noch nichts Sichtbares. Später bekommt sie Aufgaben, die immer neu und immer lösbar sind, und deren Bewertung immer stimmt.

**Warum:** SPEC 2a verlangt, dass die App selbst nachrechnet, nicht die KI. Ähnliche Aufgaben mit neuen Zahlen sind die Voraussetzung für verteiltes und gemischtes Üben ([didaktik-mathe.md](didaktik-mathe.md) 2.1, 2.3). Eine falsche Bewertung („falsch“, obwohl richtig) wäre für ein Kind mit Mathe-Unsicherheit besonders schädlich (7).

**Fotos und Prüfung:** Hier entsteht der Rechenkern, den alle anderen Teile nutzen (siehe „Wie die App sicher selbst prüft“).

**Dateien (neu):**
- `src/mathe/zahl.ts`: exakte Bruchzahl (`BigInt`), Rechnen, Kürzen, Vergleichen, Umwandeln in Dezimal und Prozent
- `src/mathe/eingabe.ts`: Antworten einlesen („3/4“, „1 1/2“, „0,75“, „−5“, „75 %“)
- `src/mathe/term.ts`: kleiner Parser für Terme und Rechenvorschriften, Auswerten, Gleichheit durch Einsetzen
- `src/mathe/typen/*.ts`: ein Modul je Aufgabentyp (Erzeuger, Prüfung, Sprechtext, vorgerechnetes Beispiel, typische Fehler)
- `src/mathe/katalog.ts`: Liste aller Typen mit Klartext-Namen
- dazu `*.test.ts` neben jeder Datei

**Akzeptanzkriterien:**
- [ ] Für jeden Typ erzeugen 10.000 zufällige Aufgaben nur gültige Aufgaben (Ergebnis im erlaubten Bereich, keine Division durch null, keine doppelten Antwortoptionen).
- [ ] Für jeden Typ wird die erzeugte Lösung von der eigenen Prüfung als richtig erkannt (Eigentest), und mindestens ein typischer Fehler wird als falsch erkannt.
- [ ] `0,1 + 0,2` ergibt genau `0,3`. `2/4` gilt als wertgleich mit `1/2`, `0,5` und `50 %`.
- [ ] Rechenvorschriften mit anderen Zeichen als Zahlen, Platzhaltern, `+ − · : ( ) %` werden abgelehnt. Es gibt kein `eval`.
- [ ] Mindestens 90 % Testabdeckung in `src/mathe/` (wie bei der übrigen Fachlogik, SPEC 8).
- [ ] Startumfang: 8–10 Typen aus Brüche und Dezimalzahlen, danach je nach euren Antworten.

### M2 – Mathe-Runde: vorlesbar, Ziffernblock, fehlerfreundlich, Punkte (A)

**Was Milena erlebt:** Eine neue Kachel „➗ Mathe“ auf der Startseite. Eine Runde hat etwa 8 Aufgaben und dauert 5–10 Minuten. Jede Aufgabe kann sie sich vorlesen lassen, und zwar so, wie man Mathe spricht: „drei Viertel plus ein Sechstel“. Sie tippt die Antwort auf einem großen **Mathe-Ziffernblock** mit Bruchtaste, Komma und Minus. Brüche erscheinen beim Tippen übereinander. Die normale Tastatur braucht sie nicht. Ist eine Antwort falsch, kommt kein rotes Kreuz, sondern ein freundlicher Hinweis, der richtige Weg und eine zweite Chance mit einer ähnlichen Aufgabe. Ein Knopf **„Zeig mir, wie es geht“** ist immer da und kostet nichts. Am Ende zeigt die Zusammenfassung, was sie geschafft hat („Du hast heute 6 Brüche addiert“), keine Fehlerliste. Danach kann sie beliebig viele Extra-Runden machen.

**Warum:** Vorlesen senkt die Lesehürde (1.2, 1.3). Selbst rechnen ist Abrufübung (2.2). Kein Zeitdruck und Fehler ohne Folgen helfen gegen Mathe-Angst (7). Es gibt kein Tageslimit für das Üben.

**Fotos und Prüfung:** Die Aufgaben kommen aus M1 (eingebaute Beispiel-Themen) und später aus Lektionen (M4). Geprüft wird nur mit dem Rechenkern.

**Dateien:**
- neu: `src/mathe/MatheSeite.tsx`, `src/mathe/Runde.tsx`, `src/mathe/Ziffernblock.tsx`, `src/mathe/Bruchanzeige.tsx`, `src/mathe/Zusammenfassung.tsx`, `src/mathe/Mathe.css`, `src/mathe/runde.ts`, `src/mathe/sprechen.ts` (Mathe-Sprechtexte: Brüche, Minus, Komma, Potenzen, Einheiten), `src/mathe/beispielthemen.ts`
- geändert: `src/basis/Startseite.tsx` und `src/basis/navigation.ts` (Kachel), `src/daten/ereignisse.ts` (neues Ereignis, siehe unten), `src/belohnung/logik.ts` (Mathe-Runden zählen für Punkte und Tagesziel), `src/vokabeln-en/AufhoerenFrage.tsx` (gemeinsam nutzen statt kopieren)
- Tests: Komponententests für Runde und Ziffernblock, ein E2E-Test in `e2e/` (eine Mathe-Runde komplett durchspielen)

**Neues Ereignis (Vorschlag, braucht eure Zustimmung, weil sich das Dropbox-Format ändert):**
```ts
| {
    typ: 'mathe-antwort';
    lektionId: string;   // oder 'beispiel' für eingebaute Themen
    themaId: string;
    aufgabentyp: string; // id aus dem Katalog
    aufgabe: string;     // die gestellte Aufgabe in Kurzform, z. B. "3/4+1/6"
    richtig: boolean;
    mitHilfe?: boolean;
    fehlerMuster?: string; // erkannter typischer Fehler (M6)
  }
```
`runde-beendet` bleibt unverändert und gilt für alle Fächer. Ältere App-Versionen ignorieren unbekannte Ereignisse. Das Feld `format` wird erhöht (SPEC 10a).

**Punkte:** Dieselben Werte wie bei den Vokabeln aus `src/belohnung/werte.ts` (10 je Runde, 2 je richtige Antwort, 1 mit Hilfe, 5 für „früher falsch, jetzt richtig“ je Aufgabentyp). Keine neuen Werte, also keine Rückfrage nötig. Ob Mathe-Runden für das Tagesziel zählen, steht bei den Fragen.

**Akzeptanzkriterien:**
- [ ] Jede Aufgabe, jeder Hinweis und jeder Knopf hat ein Lautsprecher-Symbol. Brüche, negative Zahlen, Dezimalzahlen, Prozent und Einheiten werden korrekt gesprochen (Tests für `sprechen.ts`, etwa `-3/4` → „minus drei Viertel“, `2,05 m` → „zwei Komma null fünf Meter“).
- [ ] Die Eingabe ist ohne Systemtastatur möglich. Alle Tasten sind mindestens 48 px groß.
- [ ] Nach einer falschen Antwort gibt es keinen Punktabzug, keine roten Kreuze und keine Zeitanzeige. Es kommt die richtige Lösung und eine ähnliche Aufgabe mit neuen Zahlen.
- [ ] „Zeig mir, wie es geht“ ist jederzeit erreichbar. Eine danach gelöste Aufgabe zählt als „mit Hilfe“ (1 Punkt).
- [ ] Schriftgröße, Abstand, Hintergrund und Schriftart aus den Einstellungen wirken auch auf Ziffernblock und Bruchanzeige.
- [ ] Ist nichts mehr fällig, bietet die App Extra-Runden an, ohne Grenze.

### M3 – Wiederholung in Abständen und gemischtes Üben (A)

**Was Milena erlebt:** Die App sucht die Aufgaben selbst aus. In einer Runde kommen 2–3 verschiedene Aufgabentypen gemischt vor, darunter auch ältere Themen („Weißt du das noch?“). Ein ganz neues Thema übt sie zuerst ein paar Aufgaben am Stück, danach wird gemischt.

**Warum:** Verteiltes Üben (2.1) und gemischtes Üben (2.3) gehören in Mathe zu den am besten belegten Maßnahmen. Erst im Block einführen, dann mischen, damit der Einstieg nicht entmutigt (2.3, 7).

**Fotos und Prüfung:** Betrifft nur die Auswahl. Weil die Zahlen immer neu sind, gibt es den Leitner-Stand **je Aufgabentyp und Lektion**, nicht je einzelner Aufgabe.

**Dateien:**
- `src/vokabeln-en/leitner.ts`: die allgemeinen Teile (Fächer, Pausen, `naechsterStand`, `plusTage`) nach `src/lernplan/leitner.ts` verschieben, damit Vokabeln und Mathe dieselbe Logik nutzen. Vokabeln verhalten sich danach genau wie vorher (bestehende Tests bleiben grün).
- neu: `src/mathe/auswahl.ts` (Runde zusammenstellen: fällige Typen, neue Typen im Block, Mischung, Extra-Runden)

**Akzeptanzkriterien:**
- [ ] Ein Typ steigt erst ein Leitner-Fach auf, wenn in einer Runde mindestens 2 von 3 Aufgaben dieses Typs ohne Hilfe richtig waren. Ein Fehler setzt ihn auf Fach 1 zurück, wie bei den Vokabeln.
- [ ] Ein neuer Typ kommt in seiner ersten Runde mit 3 Aufgaben am Stück, nach einem vorgerechneten Beispiel (M5).
- [ ] Ab der zweiten Runde sind keine zwei Aufgaben desselben Typs direkt hintereinander, sofern mindestens zwei Typen fällig sind.
- [ ] Ältere, sichere Typen (Fach 3 und höher) erscheinen nach Plan wieder, auch wenn die Lektion archiviert ist.
- [ ] Extra-Runden verschieben Typen nicht nach oben, Fehler setzen sie aber zurück (wie SPEC `vokabeln-en`).

### M4 – Lektion aus Fotos für Mathe (A)

**Was die Eltern erleben:** Im Eltern-Bereich wie bisher: Fotos aufnehmen, Fach „Mathe“ wählen, Titel eingeben. Nach etwa 20 Sekunden erscheint die Vorschau: „Erkannt: Brüche addieren (ungleichnamig), Nenner bis 12, Ergebnis kürzen“ mit drei neuen Beispielaufgaben samt Lösung. Gelb markiert ist, was die App nicht bestätigen konnte. Ändern, freigeben, fertig.

**Was Milena erlebt:** Wenig später erscheint in Mathe das neue Thema mit dem Titel aus der Schule („Brüche addieren – wie im Buch S. 54“).

**Warum:** Üben, was gerade im Unterricht dran ist, ist der Kern der App (SPEC 1, 2a). Richtige Beispiele aus dem eigenen Schulbuch machen die Übung vertraut (2.4).

**Fotos und Prüfung:** Siehe Abschnitt „Wie aus einem Foto sichere Übungsaufgaben werden“. Die KI wählt nur aus dem Katalog, die App rechnet alle Beispiele nach, die Eltern geben frei.

**Dateien:**
- `src/lektionen/lektion.ts`: neuer Inhaltstyp, Prüfung `pruefeMathe`, `istMatheLektion`
  ```ts
  export type MatheThema = {
    id: string;
    typ: string;                     // id aus src/mathe/katalog.ts
    parameter: Record<string, number | boolean | string>;
    beispiele?: { aufgabe: string; loesung?: string }[];
    vorgerechnet?: { schritte: string[] };
    textvorlage?: { text: string; rechnung: string; einheit?: string };
    feste?: { aufgabe: string; loesung: string }[]; // von den Eltern eingetragen, ohne neue Zahlen
  };
  export type MatheInhalt = { art: 'mathe'; themen: MatheThema[] };
  ```
- `src/eltern/fotoImport.ts`: `erkenneMathe` mit eigenem System-Text und JSON-Schema (Typ-ids als `enum` aus dem Katalog)
- `src/eltern/LektionBearbeiten.tsx`, `src/eltern/Lektionen.tsx`, `src/eltern/Lerninhalte.tsx`: Fach-Auswahl, Mathe-Vorschau mit Beispielaufgaben und gelben Hinweisen, Bearbeiten von Typ und Zahlenbereich
- Tests: `fotoImport.test.tsx` mit **gemockter** KI-Antwort (SPEC 8), E2E „Mathe-Lektion aus Foto“

**Akzeptanzkriterien:**
- [ ] Die KI-Antwort wird gegen das Schema geprüft. Typ-ids außerhalb des Katalogs werden zu `unbekannt` und nie automatisch geübt.
- [ ] Jedes abfotografierte Beispiel mit Buchlösung wird nachgerechnet. Abweichungen erscheinen in der Vorschau gelb mit beiden Ergebnissen.
- [ ] Eine Textvorlage wird nur übernommen, wenn ihre Rechenvorschrift für die Originalzahlen das Ergebnis aus dem Buch liefert oder die Eltern sie ausdrücklich bestätigen.
- [ ] Die Vorschau zeigt je Thema drei neu erzeugte Aufgaben mit Lösung.
- [ ] Unbekannte Aufgaben können die Eltern als feste Aufgabe mit eigener Lösung übernehmen.
- [ ] Fotos werden nicht gespeichert. Der KI-Schlüssel bleibt nur auf dem Eltern-Gerät.
- [ ] Vom Foto bis zur Lektion auf Milenas Gerät dauert es unter 3 Minuten (wie bei Englisch).
- [ ] Ältere App-Versionen behalten Mathe-Lektionen, üben sie aber nicht (das kann `lektion.ts` heute schon).

### M5 – Vorgerechnete Beispiele und Hilfe in Stufen (A)

**Was Milena erlebt:** Bei einem neuen Thema sieht sie zuerst ein **vorgerechnetes Beispiel**: Schritt für Schritt, jeder Schritt wird vorgelesen und farbig hervorgehoben, sie tippt auf „Weiter“. Dann kommt ein Beispiel, bei dem der letzte Schritt fehlt, und dann rechnet sie selbst. Wenn sie später hängt, gibt es Hilfe in drei Stufen:
1. **Tipp:** ein kurzer Satz oder ein Bild („Mach die Nenner gleich.“)
2. **Erster Schritt:** Der erste Schritt ist vorgemacht, sie rechnet weiter.
3. **Ganzer Weg:** wie im Beispiel, danach eine ähnliche Aufgabe mit neuen Zahlen.

**Warum:** Vorgerechnete Beispiele mit schrittweisem Ausblenden wirken in Mathe deutlich, richtige Beispiele am besten (2.4). Für LRS ersetzen Schritte mit Vorlesen lange Erklärtexte. Gestufte Hilfe hält die Erfolgsquote hoch (7).

**Fotos und Prüfung:** Jeder Typ bringt ein Standardbeispiel mit, das aus den erzeugten Zahlen berechnet wird, also immer stimmt. Liegt aus dem Foto ein Lösungsweg aus dem Schulbuch vor (`vorgerechnet`), zeigt die App dessen Schritte als Text zum Vorlesen, **rechnet die Zahlen darin aber selbst** und verwendet ihn nur, wenn das Ergebnis stimmt. So erkennt Milena die Schreibweise ihrer Lehrkraft wieder.

**Dateien:** neu `src/mathe/Beispiel.tsx`, `src/mathe/Hilfe.tsx`; in `src/mathe/typen/*.ts` je Typ `schritte(aufgabe)` und `tipp`.

**Akzeptanzkriterien:**
- [ ] Jeder Typ im Katalog hat ein Beispiel mit 2–5 Schritten, einen Tipp und einen ersten Schritt. Ein Test prüft, dass das Beispiel zur erzeugten Lösung führt.
- [ ] Ein neues Thema beginnt immer mit dem vollständigen Beispiel, dann folgt ein Beispiel mit Lücke.
- [ ] Jeder Schritt ist einzeln vorlesbar. Kein Schritt hat mehr als zwei kurze Sätze.
- [ ] Hilfe nutzen kostet nie Punkte. Die Aufgabe zählt dann als „mit Hilfe“.

### M6 – Typische Denkfehler erkennen und erklären (B)

**Was Milena erlebt:** Tippt sie bei `1/2 + 1/3` die Antwort `2/5`, sagt die App nicht nur „Noch nicht“, sondern: „Ich glaube, du hast oben und unten getrennt gerechnet. Bei Brüchen müssen zuerst die Nenner gleich sein.“ Dazu ein kleines Bild der zwei Bruchstreifen.

**Warum:** Viele Fehler folgen einer vorhersagbaren falschen Regel (4). Erklärende Rückmeldung wirkt deutlich besser als „richtig/falsch“, in Mathe besonders (5).

**Fotos und Prüfung:** Jeder Typ berechnet zu einer Aufgabe die Ergebnisse der bekannten Fehlerregeln (zum Beispiel „Zähler + Zähler, Nenner + Nenner“). Stimmt die Eingabe mit einem davon überein, gibt es die passende Erklärung. Das ist reine Rechnung, ohne KI. Erkannte Muster werden im Ereignis gespeichert (`fehlerMuster`).

**Dateien:** `src/mathe/typen/*.ts` (Liste `typischeFehler` mit Rechenregel und Erklärtext), `src/mathe/Rueckmeldung.tsx`.

**Akzeptanzkriterien:**
- [ ] Mindestens die Fehler aus der Tabelle in [didaktik-mathe.md](didaktik-mathe.md) Abschnitt 4 werden erkannt, sofern ihr Typ im Katalog ist.
- [ ] Ein Fehlermuster wird nur gemeldet, wenn sein Ergebnis sich von der richtigen Lösung unterscheidet (Test für jede Fehlerregel).
- [ ] Die Erklärung ist höchstens zwei kurze Sätze lang, vorlesbar und spricht über die Aufgabe, nie über Milena („Bei Brüchen …“, nicht „Du kannst …“).

### M7 – Bilder: Zahlenstrahl, Bruchstreifen, Geometrie-Skizzen (B)

**Was Milena erlebt:** Bei Brüchen, Dezimalzahlen und negativen Zahlen gibt es einen **Zahlenstrahl**, auf dem sie Zahlen per Finger einträgt („Wo liegt 3/4?“) und der beim Vergleichen hilft. Bruchstreifen zeigen beim Addieren, warum gleiche Nenner nötig sind. Bei Geometrie-Aufgaben ist die Figur mit den Maßen gezeichnet. Die Bilder sind auch Teil von Tipps und Beispielen.

**Warum:** Der Zahlenstrahl ist das am besten belegte Bild für Brüche und negative Zahlen (3). Bilder ersetzen Text, was bei LRS doppelt hilft. Mit der Zeit werden die Bilder weniger, damit sie keine Krücke bleiben.

**Fotos und Prüfung:** Die Bilder werden aus den erzeugten Zahlen als SVG gezeichnet, nicht aus den Fotos übernommen. Beim Eintragen auf dem Zahlenstrahl gilt eine Toleranz von ±5 % der Strahllänge, die angezeigt wird („nah dran“ zählt als richtig).

**Dateien:** neu `src/mathe/bilder/Zahlenstrahl.tsx`, `Bruchstreifen.tsx`, `Figur.tsx` (Rechteck, Dreieck, Quader, Winkel), dazu reine Funktionen für Skalierung und Toleranz.

**Akzeptanzkriterien:**
- [ ] Neue Aufgabentypen „Zahl auf dem Zahlenstrahl eintragen“ für Brüche, Dezimalzahlen und negative Zahlen.
- [ ] Bilder sind auf 412 px Breite gut lesbar und funktionieren mit allen Hintergründen, auch „dunkel“.
- [ ] Jedes Bild hat einen Vorlesetext („Ein Zahlenstrahl von 0 bis 1, in Viertel geteilt“).
- [ ] Ziehen auf dem Zahlenstrahl geht mit Finger und mit Tippen. Die Touch-Fläche ist mindestens 48 px hoch.
- [ ] Ist ein Typ sicher (Leitner-Fach 3 und höher), erscheint das Bild nur noch als Tipp.

### M8 – Klassenarbeit vorbereiten (B)

**Was Milena erlebt:** Hat eine Mathe-Lektion ein Klassenarbeitsdatum oder ist in „📝 Tests“ eine Mathe-Arbeit eingetragen, kommen deren Themen in den 7 Tagen davor bevorzugt dran, **gemischt**. In den letzten zwei Tagen gibt es eine „Probe-Runde“: alle Themen der Lektion gemischt, ohne Bilder als Standard (Bilder als Tipp verfügbar), wie in der Arbeit.

**Warum:** Verteilt vor der Arbeit üben statt am Vorabend (2.1). Gemischtes Üben trainiert genau das Erkennen der Aufgabenart, das in der Arbeit verlangt wird (2.3).

**Fotos und Prüfung:** Nichts Neues. Es werden `hatVorrang` aus `src/lektionen/lektion.ts` und die Test-Einträge aus `src/klassenarbeiten/logik.ts` genutzt.

**Dateien:** `src/mathe/auswahl.ts` (Vorrang), `src/mathe/MatheSeite.tsx` (Hinweis „Noch 5 Tage bis zur Mathe-Arbeit“).

**Akzeptanzkriterien:**
- [ ] Themen einer Lektion mit Vorrang machen mindestens die Hälfte einer Runde aus, solange sie nicht alle sicher sind.
- [ ] Die Probe-Runde mischt alle Themen der Lektion und zeigt keine Uhr.
- [ ] Bonus für das Eintragen und Nachtragen der Note gilt auch für Mathe, wie in SPEC 10a.

### M9 – Fortschritt für Eltern: was sitzt, wo es hakt (B)

**Was die Eltern erleben:** In „Lerninhalte“ hat jede Mathe-Lektion einen Fortschrittsbalken (*neu* / *am Lernen* / *sicher*) je Thema. Dazu „Was ihr gerade schwerfällt“ mit den häufigsten Fehlermustern der letzten 14 Tage in Klartext („Addiert bei Brüchen Zähler und Nenner getrennt“). Hält sich ein Grundlagen-Fehler (etwa Stellenwert, Größenvergleich, Einmaleins) über mehrere Wochen, zeigt die App einen ruhigen Hinweis: „Das könnt ihr mit der Lehrkraft besprechen.“

**Warum:** LRS und Rechenschwäche treten gehäuft zusammen auf (1.1). Die App kann nichts diagnostizieren, aber Muster sichtbar machen. Fehlermuster sind für Eltern und Lehrkraft aussagekräftiger als eine Trefferquote (4).

**Fotos und Prüfung:** Nichts Neues. Alles wird aus dem Ereignis-Protokoll berechnet (SPEC `sync`).

**Dateien:** `src/eltern/statistik.ts`, `src/eltern/Fortschrittsanzeigen.tsx`, `src/eltern/Lerninhalte.tsx`, `src/eltern/Wochenuebersicht.tsx` (Mathe-Runden und -Minuten mitzählen).

**Akzeptanzkriterien:**
- [ ] Die Wochenübersicht zählt Mathe-Runden und -Minuten mit.
- [ ] Fehlermuster erscheinen in Klartext, mit Anzahl und letztem Datum.
- [ ] Der Hinweis auf ein Gespräch mit der Lehrkraft erscheint nur auf Eltern-Geräten, nie bei Milena, und ist vorsichtig formuliert (keine Diagnose).

### M10 – Textaufgaben Schritt für Schritt (C)

**Was Milena erlebt:** Eine Textaufgabe wird automatisch vorgelesen, wichtige Zahlen sind hervorgehoben. Statt sofort zu rechnen, geht sie in kleinen Schritten vor: „Was ist gesucht?“ (Auswahl aus drei vorgelesenen Antworten), „Welche Rechnung passt?“ (Auswahl oder Balkenmodell zum Antippen), dann rechnen. Die Zahlen sind jedes Mal neu, die Geschichte bleibt aus dem Schulbuch.

**Warum:** Bei Textaufgaben ist für Kinder mit LRS oft das Lesen die Hürde (1.2). Vorlesen hilft (1.3). Den Weg vom Text zur Rechnung in Schritte zu zerlegen und mit einem Schema zu stützen, ist ein empfohlenes Vorgehen für Kinder mit Mathe-Schwierigkeiten (IES Practice Guide 26, Empfehlung 5).

**Fotos und Prüfung:** Aus dem Foto kommt die `textvorlage` mit Platzhaltern und Rechenvorschrift (M4). Die App setzt die Originalzahlen ein und vergleicht mit der Buchlösung. Neue Zahlen werden nur in Bereichen erzeugt, in denen die Geschichte stimmig bleibt (ganze Kinder, keine negativen Preise). Diese Grenzen geben die Eltern in der Vorschau vor oder bestätigen sie. Die Auswahl-Antworten bei „Was ist gesucht?“ schlägt die KI vor, die Eltern sehen sie in der Vorschau.

**Dateien:** `src/mathe/Textaufgabe.tsx`, `src/mathe/textvorlage.ts` (Platzhalter füllen, Grenzen prüfen), Erweiterung `erkenneMathe`.

**Akzeptanzkriterien:**
- [ ] Der Aufgabentext wird beim Öffnen automatisch vorgelesen (abschaltbar in den Einstellungen).
- [ ] Jede erzeugte Variante erfüllt die Grenzen der Vorlage (Test mit 10.000 Varianten).
- [ ] Die Schritte „Was ist gesucht?“ und „Welche Rechnung?“ lassen sich überspringen, wenn ein Typ sicher ist.
- [ ] Eine Vorlage ohne bestätigte Rechenvorschrift wird nie geübt.

**Hinweis zum Aufwand:** Textaufgaben sind der riskanteste Teil, weil die KI hier am meisten interpretieren muss. Deshalb Priorität C, erst nach den Erfahrungen mit M1–M8.

### M11 – Grundlagen-Training (C)

**Was Milena erlebt:** Eine kurze freiwillige Runde „Kopf-Fit“ (2–3 Minuten): Einmaleins, Teilbarkeit oder Paare wie 1/4 = 0,25 = 25 %. Ohne Uhr. Wer will, kann einen „eigenen Rekord“ einschalten, der nur mit früheren eigenen Ergebnissen vergleicht.

**Warum:** Sicher abrufbare Grundfakten entlasten beim Lernen neuer Themen. Verständnis und Fertigkeit stärken sich gegenseitig (6). Bei LRS ist der Faktenabruf oft langsamer (1.4). Zeitdruck nur freiwillig, wegen Mathe-Angst (7).

**Fotos und Prüfung:** Eingebaute Typen, keine Fotos nötig.

**Dateien:** `src/mathe/typen/grundlagen-*.ts`, `src/mathe/KopfFit.tsx`, eine neue Einstellung „eigener Rekord“ in `src/basis/einstellungen.ts`.

**Akzeptanzkriterien:**
- [ ] Standardmäßig ohne Uhr. Die Rekord-Anzeige vergleicht nur mit Milenas eigenen früheren Runden.
- [ ] Gibt Punkte wie eine normale Runde.

---

## Was bewusst nicht vorgesehen ist

- **KI beim Üben:** Milenas Gerät ruft nie die KI auf. Alles Üben läuft offline mit dem Rechenkern.
- **Freie Rechenwege handschriftlich erkennen:** zu fehleranfällig. Geprüft werden Ergebnisse und einzelne Schritte, die über den Ziffernblock eingegeben werden.
- **Zeitdruck, Ranglisten, Punkte für Noten:** widersprechen den LRS-Grundsätzen.
- **Diagnose einer Rechenschwäche:** gehört in Fachhände. Die App zeigt den Eltern nur Muster (M9).

## Was vor dem Bauen mit euch zu klären ist (SPEC 9 „Erst fragen“)

- **Dropbox-Format:** neues Ereignis `mathe-antwort` und neuer Lektionsinhalt `mathe` (M2, M4). Ältere Versionen ignorieren beides. Das Feld `format` wird erhöht.
- **Gemeinsame Leitner-Logik:** Der allgemeine Teil wandert aus `vokabeln-en` heraus (M3). Für die Vokabeln ändert sich dabei nichts.
- **Keine neuen npm-Pakete nötig:** Bruchrechnung und Term-Parser sind klein genug zum Selberschreiben, und das ist sicherer als ein fremder Formel-Parser.

## Offene Fragen an die Eltern

**Themen und Material**
1. Welche Klasse und welche Schulform besucht Milena gerade, und in welchem Bundesland (wegen Lehrplan und Nachteilsausgleich)?
2. Welche Mathe-Themen sind **jetzt** dran, und welche kommen bis zum Schuljahresende? Gibt es einen Stoffverteilungsplan der Schule?
3. Welches Schulbuch nutzt die Klasse (Titel, Verlag, Band, zum Beispiel „Lambacher Schweizer 6“, „Mathematik Neue Wege 6“, „Schnittpunkt 6“)? Gibt es ein Arbeitsheft mit Lösungen?
4. Wie sieht ein typischer Hefteintrag aus: Schreibt die Lehrkraft Rechenwege vor (etwa „erst gleichnamig machen, dann addieren“)? Ein Foto davon wäre für die Beispiele (M5) hilfreich.

**Klassenarbeiten**
5. Wann sind die nächsten Mathe-Arbeiten, und gibt es vorher Übungsblätter oder Checklisten („Das musst du können“)?
6. Hat Milena in Mathe einen **Nachteilsausgleich** (zum Beispiel Vorlesen der Aufgaben, mehr Zeit)? Wenn ja, sollte die App genau das üben.
7. Was ging in den letzten Arbeiten schief: eher Textaufgaben, eher Rechnen, eher Flüchtigkeit oder Zeit?

**Wo es hakt**
8. Wie sicher ist Milena bei den Grundlagen: Einmaleins, schriftliches Rechnen, Stellenwerte? Gab es schon einmal den Verdacht auf eine Rechenschwäche oder eine Testung?
9. Hat sie Angst vor Mathe oder vor Arbeiten? Gibt es etwas, das sie in Mathe besonders gern macht (Geometrie, Knobeln …)?

**App-Gestaltung**
10. Sollen Mathe-Runden für das Tagesziel (2 Runden) zählen, oder soll es ein gemeinsames Ziel über alle Fächer geben?
11. Die Level-Titel sind sprachlich („Wort-Sammlerin“, „Sprach-Legende“). Wollt ihr sie fachneutral machen, wenn Mathe dazukommt?
12. Soll die Rechnung im Heft parallel laufen (App stellt die Aufgabe, Milena rechnet im Heft, tippt nur das Ergebnis)? Oder soll alles in der App passieren?
13. Ist ein freiwilliger „eigener Rekord“ beim Kopfrechnen (M11) für Milena motivierend oder eher stressig?
