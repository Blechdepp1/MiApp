# Entwurf: Deutsch-Module `rechtschreibung-de` und `lesen-de`

Status: **Entwurf zur Diskussion** (01.11.2026). Umgesetzt ist bisher **Grammatik nach „Deutsch Fit“** (02.11.2026, siehe unten); Rechtschreibung (R1–R5) und Lesen (L1–L4) folgen.
Grundlage: [SPEC.md](../SPEC.md) (LRS-Grundsätze, Abschnitt 2, 2a, 10a) · Forschungsstand: [didaktik-deutsch.md](didaktik-deutsch.md) (Verweise wie „B1“ beziehen sich darauf)

## 1. Ziel

Milena übt Deutsch so, wie es bei LRS nach heutigem Wissen am meisten bringt: **Rechtschreibung über Regeln, Silben und Wortbausteine mit Lernwörtern in Abständen** und **Lesen über wiederholtes lautes Lesen kurzer Texte nach einem Vorbild**, ergänzt um Verständnisfragen. Die Inhalte kommen aus ihrem echten Unterricht (Fotos von Lernwörterlisten, Diktaten, Buchseiten).

**Erfolg heißt**
- Eine Lernwörterliste oder Lesebuchseite ist in **unter 3 Minuten** vom Foto bis zur Übung auf ihrem Gerät (wie bei Englisch).
- Sie übt Deutsch an mindestens 2 Tagen pro Woche, ohne Erinnerung (zusätzlich zu Englisch, im selben Tagesziel).
- Nach 8 Wochen: weniger Fehler in den geübten Fehlerschwerpunkten in Schuldiktaten (Einschätzung der Eltern/Lehrkraft) und messbar schnelleres Lesen geübter **und** neuer Texte gleicher Schwierigkeit (Selbstmessung in der App).

**Grundsätze (zusätzlich zu SPEC 1)**
- Alles vorlesbar, auch Lesetexte und Fragen. **Im Lesetraining** liest Milena aber zuerst selbst und holt sich Hilfe gezielt (Wort antippen), sonst übt sie das Lesen nicht (C5).
- Fehlerfreundlich: Nach einem Fehler zeigt die App **die Stelle** und **die passende Strategie**, dann schreibt Milena das Wort noch einmal richtig. Keine roten Kreuze, kein Zeitdruck, kein Punktabzug.
- Punkte für Einsatz, nie für Noten, nie Abzug. Verbesserung gegenüber **sich selbst** darf belohnt werden (wie „verbessert“ beim Vokabeltrainer), nie ein Vergleich mit anderen.
- Die App **bewertet selbst** (Vergleich mit dem freigegebenen Zielwort, Auswahlfragen). Die KI wird nur beim Import genutzt, ihre Ergebnisse prüfen die Eltern vor der Freigabe.
- Begriffe wie in der Schule: Wenn Schule oder Förderung mit FRESCH arbeitet, heißen die Strategien **Schwingen, Verlängern, Ableiten, Merken** (B4); sonst einstellbar (offene Frage 3).

## 2. Vorschläge, priorisiert nach Nutzen × Aufwand

Nutzen: ●●● hoch (starke Evidenz, direkt Milenas Alltag) · ●● mittel · ● gering. Aufwand: S (bis 1 Tag), M (2–4 Tage), L (> 1 Woche).

| # | Vorschlag | Modul | Nutzen | Aufwand | Evidenz | Reihenfolge |
|---|---|---|---|---|---|---|
| R1 | Lernwörter-Training: anhören → schreiben → Leitner | rechtschreibung-de | ●●● | M | B1, B6 | 1 |
| R2 | Strategie-Hinweis und Fehlerstelle je Lernwort | rechtschreibung-de | ●●● | S–M | B1–B4 | 1 (mit R1) |
| L1 | Wiederholtes Lesen mit Vorbild (Lese-Tandem light) | lesen-de | ●●● | M | C1, C2 | 2 |
| R3 | Fehlerschwerpunkte aus Diktat-Fotos und App-Fehlern | rechtschreibung-de, eltern | ●●● | M | B5 | 3 |
| L2 | Verständnisfragen und Lesestrategien | lesen-de | ●● | M | C4 | 4 |
| R4 | Wortbaustein-Übung: Ableiten und Wortfamilien | rechtschreibung-de | ●● (●●● ab Kl. 6) | M | B1, B3 | 5 |
| L3 | Wort-Hilfe beim Lesen und Blitzlesen schwieriger Wörter | lesen-de | ●● | S–M | C1, C3, C5 | 6 |
| R5 | Lückensätze (das/dass, Großschreibung im Satz) | rechtschreibung-de | ●● | M | B5 | 7 |
| L4 | Darstellung beim Lesen: Silbenbögen/-färbung, Zeilenfokus | lesen-de, basis | ● | M | C3, D1 | 8 |
| E1 | Eltern-Tandem-Modus und Wochenübersicht Deutsch | eltern | ●● | S | C2, E1 | mit L1/R3 |

**Nicht empfohlen** (bewusst weggelassen): automatische Bewertung des lauten Lesens per Spracherkennung (D2), Zeitdruck- oder Wettbewerbsspiele, Silbenfärbung als Standard (C3), Abschreiben als Hauptübung (B6), reine Merkwort-Listen ohne Strategie (B1).

**Vorschlag für die Scheiben:** Scheibe 1 = R1 + R2 + Import „Lernwörter“ (kleinste nützliche Version, sofort im Schulalltag nutzbar). Scheibe 2 = L1 + Import „Lesetext“ + E1. Scheibe 3 = R3 + L2. Danach R4, L3, R5, L4 nach Rückmeldung von Milena.

---

## 3. Vorschläge im Einzelnen

### R1. Lernwörter-Training

**Was Milena erlebt:** Auf der Startseite gibt es eine neue Kachel **„✏️ Deutsch“**. Eine Runde hat bis zu 10 Lernwörter (≈ 5 Minuten). Bei jedem Wort hört sie es zuerst, in einem kurzen Satz (*„Fahrrad – Ich fahre mit dem Fahrrad zur Schule.“*), und schreibt es dann aus dem Gedächtnis. Richtig: kurze Freude, weiter. Nicht richtig: Die App zeigt das Wort, markiert **die Stelle**, die anders ist, und gibt den Strategie-Hinweis (R2). Dann schreibt sie es noch einmal; das zählt als „mit Hilfe“. Am Ende: Zusammenfassung mit den Wörtern, die sie jetzt kann, und den Strategien, die sie benutzt hat, keine Fehlerliste.

Neue Wörter werden zuerst **angesehen und gegliedert** (Wort erscheint, wird vorgelesen, Silben werden angetippt oder geschwungen), erst dann geschrieben. Das entspricht „erst erkennen, dann schreiben“ beim Vokabeltrainer.

**Warum:** Abrufen statt Abschreiben und Wiederholen in Abständen (B6), aber nur mit Strategie (B1). Sofortige Korrektur verhindert, dass sich falsche Schreibweisen einprägen.

**Wie die Wörter hineinkommen:**
- Eltern fotografieren die **Lernwörterliste**, den **Rechtschreib-Hefteintrag** oder das **korrigierte Diktat** (R3) und wählen Fach „Deutsch“, Art „Lernwörter“.
- Die KI liefert je Wort: Schreibweise, Beispielsatz, Silben, Fehlerschwerpunkt(e), Strategie und Hilfe (R2). Wörter aus Handschrift werden gegen die Schreibweise im Bild geprüft; Unsicheres markiert die KI zur Prüfung.
- Wortliste auch als Text einfügbar (eine Zeile pro Wort, optional `Wort – Satz`), wie bei Englisch (SPEC 10a).

**Bewertung (anders als Englisch):**
- **Groß- und Kleinschreibung zählt** (sie ist Lernziel). Ein vergessener Großbuchstabe am Wortanfang bekommt aber einen eigenen, freundlichen Hinweis („Fast! Ist es ein Nomen? Mach die Artikelprobe: *das* Fahrrad“).
- „Fast richtig“ (eine Stelle anders) zählt für Leitner **nicht** als gewusst, denn genau diese Stelle ist das Lernziel. Für die Punkte zählt das Nachschreiben wie „mit Hilfe“. So bleibt es fehlerfreundlich, und das Wort kommt bald wieder.
- Leerzeichen am Rand, Satzzeichen am Ende werden ignoriert.

**Betroffene Dateien (Vorschlag):**
- neu `src/rechtschreibung-de/`: `typen.ts` (LernWort), `bewertung.ts` (Vergleich, Fehlerstelle bestimmen), `runde.ts`, `DeutschSeite.tsx`, `UebungSchreiben.tsx`, `Zusammenfassung.tsx`, `Deutsch.css`, Tests daneben
- `src/vokabeln-en/leitner.ts`: Leitner-Kern (Fächer, Pausen, Fälligkeit, `naechsterStand`, `rundeAuswaehlen`, `extraRundeAuswaehlen`) nach `src/lernen/leitner.ts` verschieben und für beide Fächer nutzen; die englische Übungsfolge (`uebungFuer`) bleibt in `vokabeln-en`
- `src/lektionen/lektion.ts`: neuer Inhaltstyp `lernwoerter`, `pruefeLernwoerter`, `istLernwortLektion`
- `src/daten/ereignisse.ts`: `Uebung` um `'de-ansehen' | 'de-schreiben'` erweitern (Antwort-Ereignis bleibt gleich: `listeId` = Lektion, `wortId` = Lernwort)
- `src/eltern/fotoImport.ts`, `src/eltern/ki.ts`: Auswahl der Art, eigenes Schema und eigene Anweisung für Deutsch
- `src/eltern/LektionBearbeiten.tsx`, `Lerninhalte.tsx`, `statistik.ts`: Lernwörter bearbeiten, Fortschritt neu/am Lernen/sicher auch für Deutsch
- `src/basis/navigation.ts`, `src/basis/Startseite.tsx`: Ziel und Kachel „Deutsch“
- `e2e/`: eine Deutsch-Runde komplett, Foto-Import mit gemockter KI-Antwort

**Akzeptanzkriterien**
- [ ] Eine freigegebene Lernwörter-Lektion erscheint auf Milenas Gerät; die Kachel „Deutsch“ zeigt, ob heute etwas fällig ist.
- [ ] Jedes Wort und jeder Beispielsatz wird vor dem Schreiben vorgelesen und lässt sich beliebig oft wiederholen.
- [ ] Neue Wörter kommen erst nach dem Ansehen/Gliedern in die Schreibübung; höchstens 5 neue Wörter pro Runde.
- [ ] Nach einer falschen Eingabe sieht sie das richtige Wort mit markierter Stelle und Strategie-Hinweis und kann es erneut schreiben; es gibt keinen Punktabzug.
- [ ] Groß-/Kleinschreibung wird geprüft und mit eigenem Hinweis erklärt.
- [ ] Falsche oder „fast richtige“ Wörter kommen in derselben Runde und am nächsten Tag wieder (Leitner wie bei Englisch, gemeinsamer Code).
- [ ] Kein Tageslimit: Ist nichts fällig, gibt es Extra-Runden mit normalen Punkten (SPEC `vokabeln-en`, Memory „Üben ohne Tageslimit“).
- [ ] Eine Deutsch-Runde zählt fürs Tagesziel (2 Runden) und bringt dieselben Punkte wie eine Vokabelrunde.
- [ ] Die Bewertung ist vollständig unit-getestet (≥ 90 % Abdeckung in `rechtschreibung-de/` Logik).

### R2. Strategie-Hinweis und Fehlerstelle

**Was Milena erlebt:** Bei jedem Wort gibt es einen **💡-Knopf** (vorher, freiwillig) und nach einem Fehler automatisch einen kurzen Hinweis mit Symbol, z. B.:
- 👋 **Schwingen:** „Sprich es in Silben: Fahr-rad. Hörst du beide r?“
- ↔️ **Verlängern:** „Hund – verlängere: die Hun-de. Also mit d.“
- 🌳 **Ableiten:** „Räuber kommt von rauben, also äu.“
- 🧠 **Merken:** „Vater ist ein Merkwort mit V. Merksatz: …“
- 🔠 **Großschreibung:** „Artikelprobe: das Lesen → groß.“

Jeder Hinweis ist vorlesbar und höchstens 2 kurze Sätze lang.

**Warum:** Regel- und Bausteinwissen ist der wirksame Kern (B1–B3); Merken allein ist schwach belegt, deshalb steht „Merken“ nur dort, wo keine Regel greift.

**Wie es hineinkommt:** Die KI schlägt beim Import je Wort Fehlerschwerpunkt und Strategie mit Hilfetext vor (aus einer **festen Liste**, siehe Datenmodell). Die Eltern sehen sie in der Vorschau und können sie ändern. Die **Fehlerstelle** berechnet die App selbst (Buchstabenvergleich, wie `abstand` in `vokabeln-en/bewertung.ts`, aber mit Positionsangabe).

**Betroffene Dateien:** `src/rechtschreibung-de/strategien.ts` (feste Liste mit Symbol, Name, Kurzerklärung), `bewertung.ts` (`fehlerstelle(eingabe, ziel)`), `StrategieHinweis.tsx`; KI-Schema in `src/eltern/ki.ts`/`fotoImport.ts`.

**Akzeptanzkriterien**
- [ ] Jedes Lernwort hat genau eine Hauptstrategie aus der festen Liste und optional einen Hilfetext (≤ 120 Zeichen).
- [ ] Die markierte Fehlerstelle stimmt für Ersetzen, Auslassen, Hinzufügen und Vertauschen (Unit-Tests mit typischen Fehlern: *Fahrad, Hunt, Reuber, vater, dass/das*).
- [ ] Der 💡-Knopf ist vor dem Schreiben nutzbar; ein Wort, das mit Hinweis richtig geschrieben wurde, zählt wie „mit Hilfe“.
- [ ] Die Strategienamen sind in den Einstellungen der Eltern umbenennbar (z. B. an die Schule angepasst).

### L1. Wiederholtes Lesen mit Vorbild (Lese-Tandem light)

**Was Milena erlebt:** Kachel **„📖 Lesen“**. Ein Leseabschnitt ist kurz (≈ 80–200 Wörter, aus ihrem Lesebuch oder einem Sachtext). Ablauf in drei Schritten, jeder mit großem Knopf:
1. **Anhören und mitlesen:** Die App liest den Abschnitt in ruhigem Tempo vor, der aktuelle Satz ist hervorgehoben.
2. **Selbst laut lesen (2–3×):** Sie tippt „Los“, liest laut, tippt „Fertig“. Die App zeigt ihre Zeit im Vergleich zu **ihrem** ersten Durchgang („2. Mal: 18 Sekunden schneller 🎉“). Einzelne Wörter kann sie antippen und vorlesen lassen (L3).
3. **Kurze Frage** zum Inhalt (L2, sobald vorhanden).

Ein Abschnitt kommt nach einigen Tagen noch einmal (ein „kalter“ Durchgang ohne Anhören), damit sichtbar wird, was hängen geblieben ist. Mit **Eltern-Tandem** (E1) hört ein Elternteil zu.

**Warum:** Wiederholtes Lesen ist die am besten belegte Methode für Leseflüssigkeit; mit vorherigem Anhören am stärksten (C1). Lautlese-Tandems wurden für Klasse 6 entwickelt (C2). Spracherkennung zur Bewertung ist ungeeignet (D2), deshalb Selbstmessung.

**Wie Texte hineinkommen:** Eltern fotografieren eine **Buchseite** oder ein **Arbeitsblatt** und wählen Art „Lesetext“. Die KI liefert den Text **wortgetreu** (keine Umformulierung), aufgeteilt in Abschnitte, und optional Silben je Wort (für L4) und Fragen (L2). Eltern können Abschnitte kürzen oder zusammenlegen. Texte aus dem Internet können als Text eingefügt werden. Hinweis zum Urheberrecht: nur privat in der Familie, wie in SPEC 2a.

**Betroffene Dateien:** neu `src/lesen-de/` (`typen.ts`, `lesetempo.ts` – Wörter pro Minute, Vergleich mit eigenen Durchgängen; `LeseSeite.tsx`, `Mitlesen.tsx`, `Lesen.css`, Tests); `src/basis/vorlesen.ts` (Satz-für-Satz-Vorlesen mit Rückmeldung, welcher Satz gerade läuft); `src/lektionen/lektion.ts` (Inhaltstyp `lesetext`); `src/daten/ereignisse.ts` (neues Ereignis `lesen`); `src/belohnung/werte.ts` und `logik.ts` (Punkte für Lesen, siehe Abschnitt 5); Navigation/Startseite; KI-Import.

**Akzeptanzkriterien**
- [ ] Ein Leseabschnitt hat höchstens 200 Wörter und passt auf dem Handy auf höchstens 2 Bildschirmhöhen bei mittlerer Schrift.
- [ ] Beim Anhören ist der vorgelesene Satz hervorgehoben; Anhalten und Weiter sind möglich; das Tempo folgt der Vorlese-Einstellung.
- [ ] Jeder Durchgang speichert Dauer und Wortzahl als Ereignis; die App zeigt nur den Vergleich mit eigenen früheren Durchgängen, nie eine Norm oder andere Kinder.
- [ ] Ein Durchgang, der unrealistisch kurz ist (z. B. > 300 Wörter/Minute), wird freundlich nachgefragt („Hast du alles gelesen?“), nicht bestraft.
- [ ] Ein abgeschlossener Abschnitt (Anhören + mindestens 2 eigene Durchgänge) zählt als Runde für Tagesziel und Punkte.
- [ ] Keine Audioaufnahme, keine Spracherkennung in diesem Ablauf.

### R3. Fehlerschwerpunkte aus Diktat-Fotos und App-Fehlern

**Was Milena erlebt:** Wenig direkt: Ihre Runden enthalten öfter Wörter mit „ihren“ Regeln, und die Zusammenfassung sagt z. B. „Heute hast du 6 Wörter mit Verlängern geschafft.“

**Was die Eltern erleben:** Im Eltern-Bereich unter Deutsch eine Übersicht **„Fehlerschwerpunkte“**: Balken je Kategorie (z. B. Doppelkonsonant/ck/tz, ie/i, Dehnungs-h, s/ss/ß, das/dass, Großschreibung, d/t–g/k am Ende, ä/e–äu/eu, Merkwörter), getrennt nach „aus Diktaten“ und „in der App“, mit Verlauf über Wochen. Unter jeder Kategorie die Wörter, mit denen sie gerade kämpft.

**Wie es hineinkommt:** Eltern fotografieren ein **korrigiertes Diktat oder einen Aufsatz** (Art „Diktat auswerten“). Die KI liest die von der Lehrkraft markierten Fehler, ordnet sie Kategorien zu und schlägt die korrigierten Wörter als Lernwörter vor. Eltern prüfen und geben frei; nur die Wörter und Kategorien werden gespeichert, kein Foto und kein Aufsatztext (Datenschutz, SPEC 2a). Zusätzlich zählt die App die Kategorien der Wörter, die sie in Runden falsch schreibt.

**Gezieltes Üben:** Ist eine Kategorie auffällig, bietet die App im Eltern-Bereich an, **weitere Übungswörter dieser Kategorie** zu ergänzen (Vorschlag der KI aus dem Grundwortschatz Klasse 5/6, nach Freigabe als eigene Lektion „Übungswörter: Verlängern“). In Runden werden Wörter mit Schwerpunkt-Kategorien bevorzugt, ähnlich dem Vorrang vor Klassenarbeiten.

**Warum:** Gezielte Arbeit an Strategien/Regeln statt Fehler zählen (B5) und regelbasiertes Training wirkt (B1, B2).

**Betroffene Dateien:** `src/rechtschreibung-de/schwerpunkte.ts` (Kategorienliste, Auswertung aus Ereignissen und Diktat-Lektionen); `src/eltern/Fehlerschwerpunkte.tsx`; KI-Schema für „Diktat auswerten“; `src/lektionen/lektion.ts` (Feld `quelle: 'liste' | 'diktat' | 'uebung'` an Lernwort-Lektionen); `rundeAuswaehlen` um Gewichtung erweitern.

**Akzeptanzkriterien**
- [ ] Die Kategorienliste ist fest im Code (mit Namen und Beispielen) und mit der Strategieliste aus R2 verknüpft.
- [ ] Aus einem Diktat-Foto entstehen nach Freigabe Lernwörter mit Kategorie; das Foto wird nicht gespeichert.
- [ ] Die Übersicht zeigt pro Kategorie Anzahl Fehler der letzten 14 und 56 Tage, getrennt nach Quelle.
- [ ] Vorgeschlagene Übungswörter werden erst nach Freigabe gespeichert und sind als eigene Lektion bearbeitbar.
- [ ] Milena sieht keine Fehlerzahlen, nur Erfolge.

### L2. Verständnisfragen und Lesestrategien

**Was Milena erlebt:** Nach dem Lesen 2–4 Fragen, alle vorgelesen: Auswahlfragen („Warum ist Tom weggelaufen?“ – 3 Antworten), **„Wo steht das?“** (sie tippt den Satz im Text an) und gelegentlich eine Strategie-Frage vor dem Lesen („Lies die Überschrift. Was glaubst du, worum es geht?“ – Antwort per Mikrofon, wird nicht bewertet). Falsche Antwort: Die App zeigt die passende Textstelle und lässt nochmal wählen.

**Warum:** Strategien ausdrücklich üben verbessert Verstehen (C4); Fragen vorlesen, damit Lesen nicht das Verstehen-Prüfen verfälscht.

**Wie es hineinkommt:** Die KI schlägt beim Import des Lesetextes Fragen mit Antworten und der Belegstelle (Satznummer) vor; Eltern prüfen und bearbeiten. Bewertet wird nur, was eindeutig ist (Auswahl, Satz antippen).

**Betroffene Dateien:** `src/lesen-de/fragen.ts`, `Frage.tsx`; Erweiterung des Inhaltstyps `lesetext`; KI-Schema.

**Akzeptanzkriterien**
- [ ] Jede Frage und jede Antwortmöglichkeit hat einen Vorlese-Knopf.
- [ ] Eine Frage hat genau eine richtige Antwort und eine Belegstelle; nach einem Fehler wird die Belegstelle hervorgehoben.
- [ ] Freie Antworten (Mikrofon) werden nie bewertet und nur auf Wunsch den Eltern gezeigt.
- [ ] Richtige Antworten bringen Punkte wie richtige Vokabeln.

### R4. Wortbaustein-Übung: Ableiten und Wortfamilien

**Was Milena erlebt:** Kurze Spiele zwischen den Lernwörtern: ein langes Wort in Bausteine **zerschneiden** (*Ver|kehr|s|schild*), den **Stamm finden** in einer Wortfamilie (*fahren, Fahrt, Gefährt, Fähre*), oder entscheiden „e oder ä?“ mit Begründung („weil *Hände* von *Hand* kommt“).

**Warum:** Morphologische Ansätze wirken stark und werden mit dem Alter wichtiger (B1, B3). Erklärt viele Klasse-6-Fehler (ä/äu, d/t, Doppelkonsonant in der Wortfamilie).

**Wie es hineinkommt:** Aus den Lernwörtern: Die KI liefert beim Import Bausteine (`ver|kehr|s|schild`) und 2–4 verwandte Wörter; Eltern prüfen.

**Betroffene Dateien:** `src/rechtschreibung-de/bausteine.ts`, `UebungBausteine.tsx`; Felder `bausteine`, `familie` am Lernwort.

**Akzeptanzkriterien**
- [ ] Zerschneiden per Antippen zwischen Buchstaben, große Tippflächen (≥ 48 px), rückgängig möglich.
- [ ] Jede Entscheidung zeigt nach der Antwort die Begründung mit dem verwandten Wort.
- [ ] Die Übung wird nur für Lernwörter mit hinterlegten Bausteinen angeboten.

### L3. Wort-Hilfe beim Lesen und Blitzlesen

**Was Milena erlebt:** Beim Lesen tippt sie ein schwieriges Wort an: Es wird in Silben gezeigt und vorgelesen. Angetippte Wörter sammelt die App; in einer kurzen Übung „⚡ Blitzlesen“ erscheinen sie einzeln für kurze Zeit (Zeit einstellbar, ohne Wertung), sie liest laut und tippt selbst „konnte ich“ oder „nochmal“.

**Warum:** Gezielte Hilfe statt Dauer-Vorlesen (C5); schnelles Erkennen häufiger Wörter und Silben unterstützt die Flüssigkeit (C1, C3).

**Betroffene Dateien:** `src/lesen-de/WortHilfe.tsx`, `blitzlesen.ts`; Ereignis `lese-hilfe` (Wort, Lektion); Silben aus dem Import (L4).

**Akzeptanzkriterien**
- [ ] Ein Tipp auf ein Wort liest genau dieses Wort vor und zeigt die Silben.
- [ ] Blitzlesen bewertet sich selbst (Milena entscheidet), es gibt Punkte für das Durchgehen, nicht für „konnte ich“.
- [ ] Die Anzeigedauer ist in den Einstellungen wählbar und standardmäßig großzügig.

### R5. Lückensätze

**Was Milena erlebt:** Ein Satz wird vorgelesen, ein Wort fehlt und wird geschrieben (z. B. *„Ich hoffe, ___ du kommst.“* oder *„Beim ___ (lesen) brauche ich Ruhe.“*).

**Warum:** Manche Schwerpunkte (das/dass, Großschreibung von Nominalisierungen) zeigen sich nur im Satz (B5, wortübergreifende Strategie).

**Wie es hineinkommt:** Aus Beispielsätzen der Lernwörter und aus Diktat-Auswertungen; für das/dass eine kleine eingebaute Satzsammlung.

**Akzeptanzkriterien**
- [ ] Der ganze Satz wird vorgelesen, die Lücke ist deutlich und groß.
- [ ] Bewertung nur des Lückenworts, mit Hinweis aus R2 (z. B. „Ersatzprobe: Kannst du *welches* sagen? Dann *das*.“).

### L4. Darstellung beim Lesen

**Was Milena erlebt:** In den Einstellungen unter „Lesen“: **Silbenbögen** oder **Silben farbig** (aus), **Zeilenfokus** (nur aktuelle Zeile hell), **extra Buchstabenabstand**. Sie kann beim Lesen schnell umschalten.

**Warum:** Silbenfärbung ist nicht allgemein hilfreich, manchen Kindern aber angenehm (C3); mehr Buchstabenabstand kann helfen (D1). Deshalb Wahl, Standard aus.

**Wie Silben hineinkommen:** Silbentrennung liefert die KI beim Import (wird mit dem Text gespeichert). Eine Trennbibliothek wäre eine neue Abhängigkeit (SPEC 9: erst fragen).

**Betroffene Dateien:** `src/basis/einstellungen.ts`, `Einstellungen.tsx`, `thema.css`; `src/lesen-de/Lesetext.tsx`.

**Akzeptanzkriterien**
- [ ] Alle Optionen sind standardmäßig aus und wirken sofort.
- [ ] Silbenbögen/-farben verändern nicht die Textfarbe-Kontraste unter WCAG AA.

### E1. Eltern-Tandem-Modus und Wochenübersicht Deutsch

**Was die Eltern erleben:** Beim Lesen gibt es einen Knopf „👥 Mit Mama/Papa“: Ein Elternteil sitzt daneben, tippt beim Zuhören Wörter an, bei denen Milena stockt; diese kommen in ihr Blitzlesen (L3). In der Wochenübersicht: Lerntage, Deutsch-Runden, gelesene Abschnitte, Lesetempo-Verlauf (eigene Werte), Fehlerschwerpunkte (R3).

**Warum:** Tandem-Lesen mit einer stärkeren Leserin oder einem stärkeren Leser (C2); Eltern sehen, was wirkt.

**Betroffene Dateien:** `src/lesen-de/Tandem.tsx`; `src/eltern/statistik.ts`, `Wochenuebersicht.tsx`.

**Akzeptanzkriterien**
- [ ] Tandem-Markierungen werden nur auf Milenas Gerät gespeichert und mit dem Lesedurchgang verknüpft; Milena sieht sie als „Wörter zum Üben“, nicht als Fehler.
- [ ] Die Wochenübersicht zeigt Deutsch getrennt von Englisch.

---

## 4. Datenmodell (Vorschlag)

Neue Inhaltstypen fügen sich in `Lektion.inhalt` ein, ohne das Dateiformat zu ändern: Ältere App-Versionen behalten unbekannte Arten und üben sie nicht (`lektion.ts`, `pruefeLektion`). **Eine Lektion hat eine Art**; Lernwörter und Lesetext aus derselben Buchseite werden zwei Lektionen.

```ts
// lektionen/lektion.ts (Erweiterung)
export type LernwortInhalt = {
  art: 'lernwoerter';
  // woher die Wörter stammen: Liste der Schule, korrigiertes Diktat, vorgeschlagene Übungswörter
  quelle: 'liste' | 'diktat' | 'uebung';
  woerter: LernWort[];
};

export type LesetextInhalt = {
  art: 'lesetext';
  // Quellenangabe für die Eltern, z. B. "Lesebuch S. 42"
  herkunft?: string;
  abschnitte: Leseabschnitt[];
};

// rechtschreibung-de/typen.ts
export type LernWort = {
  id: string;
  wort: string; // genaue Schreibweise inkl. Groß-/Kleinschreibung
  satz?: string; // Beispielsatz zum Vorlesen
  silben?: string; // "Fahr-rad"
  bausteine?: string; // "ver|kehr|s|schild"
  familie?: string[]; // verwandte Wörter
  schwerpunkte: Schwerpunkt[]; // feste Liste, z. B. 'doppelkonsonant', 'auslaut', 'aeu-eu'
  strategie: Strategie; // 'schwingen' | 'verlaengern' | 'ableiten' | 'merken' | 'gross'
  hilfe?: string; // kurzer Hinweis, ≤ 120 Zeichen
};

// lesen-de/typen.ts
export type Leseabschnitt = {
  id: string;
  saetze: string[]; // wortgetreu, für Hervorhebung und "Wo steht das?"
  silben?: Record<string, string>; // Wort → "Fahr-rad"
  fragen?: Lesefrage[];
};
export type Lesefrage = { id: string; frage: string; antworten: string[]; richtig: number; beleg: number };
```

**Ereignisse** (`daten/ereignisse.ts`):
- Rechtschreibung nutzt das bestehende `antwort`-Ereignis (`listeId` = Lektion, `wortId` = Lernwort, neue `Uebung`-Werte `de-ansehen`, `de-schreiben`, `de-luecke`, `de-bausteine`). Dadurch funktionieren Leitner, Punkte, „schwierige Wörter“ und Abgleich ohne neue Logik.
- Lesen bekommt neue Ereignisse: `{ typ: 'lesen'; lektionId; abschnittId; durchgang: 'anhoeren' | 'selbst' | 'kalt'; sekunden; woerter; tandem?: string[] }` und `{ typ: 'lese-frage'; lektionId; frageId; richtig }`.
- `runde-beendet` bekommt optional `fach: 'englisch' | 'deutsch'` für die Wochenübersicht.

Die Änderung von Ereignis- und Lektionsformat betrifft beide Geräte → laut SPEC 9 **vor der Umsetzung mit euch abstimmen**; `format` wird erhöht.

## 5. Punkte (Vorschlag, Werte in `belohnung/werte.ts`, erst fragen)

| Aktion | Punkte | Begründung |
|---|---|---|
| Rechtschreib-Runde beendet | wie Vokabelrunde (10 + 2 je richtig + 1 mit Hilfe + 5 verbessert) | gleicher Einsatz, gleiche Punkte |
| Leseabschnitt abgeschlossen (anhören + 2 Durchgänge) | 10 + 2 je eigener Durchgang | Einsatz zählt |
| Schneller als beim eigenen ersten Durchgang | +5 (einmal je Abschnitt) | Verbesserung gegenüber sich selbst, wie „verbessert“ |
| Verständnisfrage richtig | 2 | wie richtige Antwort |
| Tagesziel | unverändert: 2 Runden, egal welches Fach | Wahlfreiheit stärkt Motivation (E1) |

Nie Punkte abziehen, keine Punkte für Noten.

## 6. KI-Import (gemeinsam für alle Deutsch-Arten)

- Der bestehende Ablauf (SPEC 2a) bleibt: Fotos → Fach „Deutsch“ → **Art wählen** (Lernwörter · Diktat auswerten · Lesetext) → KI → bearbeitbare Vorschau → Freigabe.
- Je Art ein eigenes JSON-Schema (wie bei Englisch über strukturierte Ausgabe) mit **festen Listen** für Schwerpunkte und Strategien, damit die App deterministisch damit arbeiten kann.
- Die KI-Anweisung verlangt: Schreibweise exakt nach amtlicher Rechtschreibung; bei Handschrift unsichere Wörter markieren; Lesetexte wortgetreu, nicht vereinfachen; Fragen nur mit eindeutiger Belegstelle.
- Die App prüft das Ergebnis (`pruefeLernwoerter`, `pruefeLesetext`): Pflichtfelder, Längen, Wortzahl je Abschnitt, Fragen mit gültigem `richtig`/`beleg`.
- Tests immer mit gemockter KI-Antwort (SPEC 8).

## 7. Offene Fragen an die Eltern

1. **Fehlerschwerpunkte:** Habt ihr korrigierte Diktate oder Aufsätze der letzten Monate? Welche Fehler fallen euch und der Lehrkraft am meisten auf (z. B. Doppelkonsonanten, ie, das/dass, Großschreibung)? Gibt es ein Gutachten oder einen Test (HSP, DRT, SLRT-II) mit Strategieprofil?
2. **Förderunterricht / Therapie:** Bekommt Milena LRS-Förderung in der Schule oder außerhalb? Mit welchem Programm oder Material (z. B. Marburger Rechtschreibtraining, FRESCH, Lautgetreue Rechtschreibförderung)? Die App sollte dieselben Begriffe und Symbole verwenden.
3. **Begriffe der Schule:** Welche Strategie-Wörter nutzt die Deutschlehrkraft (Schwingen/Verlängern/Ableiten/Merken oder andere)? Gibt es Symbole?
4. **Lehrkraft einbeziehen:** Dürfen wir die Lehrkraft fragen, welche Lernwörter und Lesetexte in den nächsten Wochen dran sind? Gibt es einen Nachteilsausgleich oder Notenschutz (z. B. Rechtschreibung wird nicht bewertet), der beeinflusst, was ihr wichtig ist?
5. **Lernwörter in der Schule:** Gibt es feste Lernwörterlisten oder einen Rechtschreib-Grundwortschatz der Klasse 6? Wie werden Diktate angekündigt (Datum, Wörter)?
6. **Lesen:** Wo hakt es mehr: Tempo, Genauigkeit oder Verstehen? Was liest sie gern (Themen, Bücher)? Liest sie laut vor, wenn jemand zuhört, oder ist das unangenehm?
7. **Tandem:** Hat jemand von euch 2–3-mal pro Woche 10 Minuten Zeit, beim Lesen zuzuhören (E1)?
8. **Silben:** Hat sie in der Grundschule mit Silbenbögen oder farbigen Silben gelernt, und mag sie das noch?
9. **Gewichtung:** Soll Deutsch und Englisch gleichwertig im Tagesziel zählen, oder wollt ihr Deutsch an bestimmten Tagen bevorzugen?
10. **Datenschutz Diktate:** Ist es für euch in Ordnung, korrigierte Diktate (ohne Namen) zur Auswertung an die Claude API zu schicken? Gespeichert werden nur Wörter und Kategorien.

## 8. Nächste Schritte

1. Eltern beantworten die offenen Fragen (vor allem 1–3).
2. Daraus wird ein freigegebener Abschnitt in `SPEC.md` (v1.3) und ein Plan in `tasks/plan.md` (Phase 6: Deutsch), beginnend mit Scheibe 1 (R1 + R2).
3. Vor dem ersten Code: Abstimmung zu Ereignis-/Lektionsformat und Punktwerten (SPEC 9 „Erst fragen“).

---

## 9. Umgesetzt: Grammatik nach „Deutsch Fit“ (Version 0.18.0)

**Anlass:** Milena arbeitet in der Schule mit dem Heft „Deutsch Fit“ (Kl. 5/6). Die Eltern haben S. 3–10 fotografiert: Wortarten, Nomen (Artikel, Mehrzahl, zusammengesetzte Nomen), Verben (beugen, Vergangenheit), Adjektive (Gegenteil, steigern), Wortarten im Text, Satzarten, Satzzeichen, Subjekt und Prädikat.

**Was ihre Einträge im Heft zeigen** (Grundlage für Schwerpunkte und Hinweise, B5):
- Wortarten werden verwechselt (S. 3: *leise* als Nomen, *mutig* als Verb, *springen* als Adjektiv; S. 5: *mutig* als Verb) → Wortarten stehen im Mix zuerst, jede Aufgabe hat eine Prüffrage (Artikelprobe, „ich …“, „Das ist …“).
- Verbformen mit Stamm-h und Vokalwechsel (*du gest, er get*; *ich liste, ich kommte*) → eigene Aufgaben mit Hinweis „Das h bleibt“ bzw. unregelmäßige Vergangenheit.
- Umlaut in der Mehrzahl fehlt (*Buche, Baume*) → Ableiten-Hinweis „aus a, o, u wird oft ä, ö, ü“ (B3); die App erkennt einen reinen Umlaut-Fehler und sagt es freundlich.
- Steigerung (*lusteger, am spannendnen*) und Zusammenschreibung (*Haus tür, Lese buch*) → eigene Aufgaben mit Hinweis.

**Wie die Forschung umgesetzt ist** (Verweise auf `didaktik-deutsch.md`):
- **Regeln mit Prüffragen statt Raten** (A1, B1, B2): Jede Aufgabe hat einen 💡-Tipp (freiwillig vorher, automatisch nach einem Fehler); je Thema gibt es das Merkwissen aus dem Heft zum Vorlesen.
- **Abrufen und verteiltes Üben** (B6): Formen werden aus dem Gedächtnis geschrieben; Wiederholung nach dem gleichen Plan wie bei den Vokabeln (Leitner). Mit Tipp gelöst zählt als „mit Hilfe“ und steigt nicht auf.
- **Wortbausteine/Ableiten** (B3): Hinweise wie *Baum → Bäume*, *geh-st*, *groß → größer*.
- **Groß-/Kleinschreibung zählt**, denn sie hängt an der Wortart (HSP: wortübergreifende Strategie, B5); Fehler nur bei groß/klein bekommen einen eigenen Hinweis. Die Tastatur schreibt nicht automatisch groß.
- **Sofortige, freundliche Rückmeldung**: richtige Lösung mit markierter Stelle, falsche Aufgaben kommen in der Runde noch einmal; keine roten Kreuze, kein Zeitdruck, kein Punktabzug.
- **Vorlesen per Knopf, nicht automatisch** (C5): Sie liest Aufgabe und Satz zuerst selbst.
- **Menge und Regelmäßigkeit** (A3): kurze Runden (höchstens 5 neue Aufgaben), zählen fürs gemeinsame Tagesziel.

**Technik:** `src/deutsch/` (Themen mit festen Aufgaben, die App bewertet selbst). Antworten nutzen das bestehende `antwort`-Ereignis mit `uebung` `de-waehlen | de-schreiben | de-antippen`, Runden `runde-beendet` mit `fach: 'deutsch'`; `LESART` 3, damit Geräte nach dem Update auch vorher übersprungene Deutsch-Zeilen lesen. Ältere App-Versionen überspringen diese Zeilen ohne Fehler.

**Noch offen:** Neue Deutsch-Seiten per Foto importieren (KI erzeugt Aufgaben, Eltern prüfen), Rechtschreibung mit Lernwörtern (R1/R2), Lesen (L1).
