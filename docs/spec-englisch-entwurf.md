# Entwurf: Englisch-Vokabeltrainer weiterentwickeln

Stand: 01.11.2026 · **Entwurf, nicht freigegeben** · Grundlage: [didaktik-englisch.md](didaktik-englisch.md)

Dieser Entwurf leitet aus dem Forschungsstand Vorschläge für `vokabeln-en` ab. Er ändert nichts an SPEC.md. Was davon umgesetzt wird, entscheiden die Eltern. Danach wird SPEC.md ergänzt und `tasks/todo.md` bekommt die Aufgaben.

**Zeichen für die Evidenz:** 🟢 Meta-Analyse · 🟡 Studie(n) · ⚪ Expertenkonsens (Erklärung im Didaktik-Dokument)

---

## 1. Was die App heute schon richtig macht

| Erkenntnis | Heute in der App | Bewertung |
|---|---|---|
| Verteiltes Üben 🟢 | Leitner mit 5 Fächern, Pausen 1/1/3/7/14 Tage (`leitner.ts`) | ✅ erfüllt. Gleiche oder wachsende Abstände sind laut Forschung ähnlich gut. |
| Abrufen statt Wiederlesen 🟢 | Jede Übung ist eine Abfrage, kein reines Anschauen | ✅ erfüllt |
| Erst erkennen, dann aktiv abrufen 🟡 | Neues Wort: 1× erkennen (EN→DE), 1× DE→EN wählen, danach immer schreiben (`uebungFuer`) | ✅ erfüllt. Ab Fach 3 wird nur noch geschrieben, also aktiv abgerufen. |
| Rückmeldung sofort mit Lösung, später noch einmal 🟢/🟡 | Lösung wird sofort gezeigt und vorgelesen. Falsche Wörter kommen am Rundenende und am nächsten Tag wieder | ✅ erfüllt |
| Misslungene Versuche schaden nicht 🟡 | Fehler kosten nie Punkte, „Nicht schlimm! So ist es richtig“ | ✅ erfüllt |
| Hören + Sehen zusammen 🟡/⚪ | Jedes Wort wird beim Erscheinen und nach der Antwort vorgesprochen (britische Stimme bevorzugt) | ✅ erfüllt |
| Wenige neue Wörter 🟡 | Höchstens 5 neue pro Runde, Runde höchstens 10 Wörter | ✅ erfüllt, Startwert passt. Anpassung siehe V9. |
| Wörter nicht künstlich mischen 🟢 | Fällige Wörter aus allen Lektionen gemischt nach Fach | ✅ passt |
| Motivation ohne Druck 🟢/⚪ | Punkte für Einsatz, nie Abzug, keine Ranglisten, kein Zeitdruck, Zusammenfassung ohne Fehlerliste, Extra-Runden ohne Limit | ✅ erfüllt |
| Fehlertolerante Bewertung beim Schreiben ⚪ | Groß-/Kleinschreibung egal, ein Buchstabe Abstand = „fast richtig“ | ✅ erfüllt, mit offener Frage zu „fast“ (siehe V5) |

## 2. Wo die App dem Forschungsstand nicht entspricht oder Lücken hat

| # | Befund | Wo im Code |
|---|---|---|
| L1 | **Klassenarbeit:** Vorrang sortiert nur die *ohnehin fälligen* Wörter nach vorn. Ein Wort in Fach 4 oder 5 (Pause 7 oder 14 Tage) wird vor der Arbeit eventuell gar nicht mehr abgefragt. Laut Forschung sollte die letzte Wiederholung 1–2 Tage vor dem Termin liegen. | `rundeAuswaehlen`, `hatVorrang` |
| L2 | **Hilfe-Buchstaben und „fast richtig“ stufen hoch** wie eine richtige Antwort. Ein Wort kann so in „sicher“ (Fach 3+) landen, obwohl es nie ganz allein geschrieben wurde. | `naechsterStand` |
| L3 | **Nach einem Schreibfehler** sieht sie die Lösung, aber nicht, **an welcher Stelle** ihr Wort abweicht, und schreibt das Wort nicht gleich noch einmal richtig. | `Rueckmeldung` in `Runde.tsx`, `UebungSchreiben.tsx` |
| L4 | **Laut sprechen** wird nicht angeregt. Sie hört viel, spricht aber nicht selbst. | `Runde.tsx` |
| L5 | **Unregelmäßige Verben, Wortfamilien, Sätze:** Das Format kennt nur Wortpaare EN/DE. *„go, went, gone“* würde von `erlaubteAntworten` als drei Alternativen gelesen. | `typen.ts`, `bewertung.ts`, `fotoImport.ts` |
| L6 | **SPEC sagt „Anhören → Bild/Wort wählen“**, Bilder gibt es in der App nicht. | SPEC.md `vokabeln-en` |
| L7 | **Neue Wörter kommen in Listenreihenfolge.** Im Schulbuch stehen Wortfelder oft beieinander (alle Farben, alle Wochentage), die dann gleichzeitig neu sind. | `rundeAuswaehlen` |
| L8 | **Nach Fach 5** bleibt die Pause bei 14 Tagen, auch für Wörter, die schon lange sitzen. | `PAUSE_TAGE` |

Nichts in der App **widerspricht** den LRS-Grundsätzen oder dem Forschungsstand grundsätzlich. Die Lücken sind Verbesserungen, keine Fehler.

---

## 3. Vorschläge, priorisiert

**Nutzen** = Stärke der Evidenz × erwartete Wirkung für Milena (hoch / mittel / gering).
**Aufwand** = S (bis ½ Tag) · M (1–2 Tage) · L (mehrere Tage, Formatänderung).
🔒 = berührt eine „Erst fragen“-Grenze aus SPEC Abschnitt 9 (Dropbox-Format, Punkte).

| Rang | Vorschlag | Nutzen | Aufwand | 🔒 |
|---|---|---|---|---|
| 1 | V1 Endspurt vor der Klassenarbeit | hoch | S | – |
| 2 | V2 Laut nachsprechen | mittel–hoch | S | – |
| 3 | V3 Schreibfehler zeigen und gleich richtig nachschreiben | hoch | M | – |
| 4 | V4 Unregelmäßige Verben | hoch | L | 🔒 Format |
| 5 | V5 Hilfe zählt als Üben, nicht als „gekonnt“ | mittel | S | – |
| 6 | V6 Mündlich abrufen (Sprechkarte) | mittel | M | 🔒 Format (Ereignis) |
| 7 | V7 Buchstabieren und Buchstabengruppen | mittel | S–M | – |
| 8 | V8 Neue Wörter an ihr Tempo anpassen | mittel | S | – |
| 9 | V9 Lückensätze | mittel | L | 🔒 Format |
| 10 | V10 Selbst wählen, was sie übt | mittel | S | – |
| 11 | V11 Langzeit-Fach | gering–mittel | S | – |
| 12 | V12 Rückmeldetexte, die informieren | gering | S | – |
| 13 | V13 Ähnliche neue Wörter trennen | gering | S | – |

---

### V1 Endspurt vor der Klassenarbeit (Rang 1)

**Was Milena erlebt:** Ein paar Tage vor einer eingetragenen Englisch-Arbeit sieht sie: „📝 Noch 3 Tage bis zur Arbeit. 24 Wörter aus *Unit 3* frischen wir auf.“ In ihren normalen Runden kommen dann alle Wörter der Lektion noch einmal dran, auch die, die sie längst kann. Am Tag vor der Arbeit kommt jedes Wort mindestens einmal.
**Warum:** Der beste Abstand zur Prüfung beträgt etwa 10–20 % der Zeit bis dahin, bei einer Woche also 1–2 Tage (Cepeda u. a. 2008 🟢). Heute kann ein Wort in Fach 5 vor der Arbeit 14 Tage lang nicht abgefragt werden (L1).
**Dateien:** `src/vokabeln-en/leitner.ts` (`rundeAuswaehlen`, `WortStand` um `zuletzt` ergänzen, `berechneStaende`), `src/vokabeln-en/quellen.ts`, `src/lektionen/lektion.ts` (`hatVorrang`), `src/vokabeln-en/Runde.tsx` (Hinweis), Tests in `leitner.test.ts`
**Akzeptanzkriterien:**
- [ ] Hat eine Lektion eine Arbeit in höchstens 7 Tagen (Lektionsdatum oder eingetragener Test), gilt jedes schon geübte Wort dieser Lektion als fällig, wenn es seit mindestens 2 Tagen nicht abgefragt wurde, egal in welchem Fach.
- [ ] Diese vorgezogenen Wiederholungen ändern den Leitner-Plan nur wie eine Extra-Runde: richtig = kein Hochstufen, falsch = zurück in Fach 1.
- [ ] Noch nie geübte Wörter der Lektion kommen weiterhin als neue Wörter mit Vorrang (höchstens 5 pro Runde).
- [ ] Der Hinweis ist vorlesbar und nennt Tage und Wortzahl. Kein Countdown-Druck: Er erscheint nur am Rundenstart, nicht bei jedem Wort.
- [ ] Am Tag nach der Arbeit gilt wieder der normale Plan.

### V2 Laut nachsprechen (Rang 2)

**Was Milena erlebt:** Nach jeder Antwort steht unter der Lösung: „🗣️ Sag es laut: *night*“ mit einem Knopf zum nochmal Hören. Sie spricht es nach. Niemand bewertet das, und „Weiter“ geht sofort.
**Warum:** Laut gesprochene Wörter werden besser behalten (Produktionseffekt, Fawcett 2013 🟢, bei Kindern Icht & Mama 2015 🟡). Das nutzt den Hör-Sprech-Weg, der bei LRS stärker ist.
**Dateien:** `src/vokabeln-en/Runde.tsx` (`Rueckmeldung`), `src/basis/einstellungen.ts` (Schalter „Nachsprechen“ an/aus, Standard an), `src/basis/Einstellungen.tsx`, `src/vokabeln-en/Vokabeln.css`, Tests in `Runde.test.tsx`
**Akzeptanzkriterien:**
- [ ] Die Aufforderung erscheint nach jeder Antwort (richtig, fast, falsch) mit dem englischen Wort und einem Vorlese-Knopf.
- [ ] Es gibt **keine** Aufnahme und keine Spracherkennung. (Die Spracherkennung in Chrome schickt Audio an Google, siehe `spracherkennung.ts`.)
- [ ] Punkte und Leitner bleiben unverändert. „Weiter“ ist sofort bedienbar.
- [ ] In den Einstellungen abschaltbar.

### V3 Schreibfehler zeigen und gleich richtig nachschreiben (Rang 3)

**Was Milena erlebt:** Sie schreibt *„nite“*. Die App zeigt ihr Wort und das richtige untereinander, die abweichende Stelle ist sanft markiert (unterstrichen, nicht rot): *n**igh**t*. Darunter: „Schau es dir an und sprich es. Dann verstecken wir es, und du schreibst es noch einmal.“ Sie tippt auf „Bereit“, das Wort verschwindet, sie schreibt es aus dem Kopf und sieht den Vergleich. Sie kann den Schritt auch mit „Weiter“ überspringen.
**Warum:** Rückmeldung wirkt am stärksten, wenn sie genau informiert (Wisniewski u. a. 2020 🟢). *Ansehen – abdecken – schreiben – vergleichen* ist für das Rechtschreiblernen von Kindern mit Lernschwierigkeiten untersucht (Joseph u. a. 2012 🟢). Die LRS-Grundsätze verlangen schon „richtige Lösung zeigen und nochmal versuchen“; heute passiert das erst am Rundenende (L3).
**Dateien:** `src/vokabeln-en/bewertung.ts` (neue reine Funktion `unterschiede(eingabe, loesung)`, die abweichende Stellen liefert), `src/vokabeln-en/UebungSchreiben.tsx` oder neue `Nachschreiben.tsx`, `src/vokabeln-en/Runde.tsx`, `Vokabeln.css`, Tests
**Akzeptanzkriterien:**
- [ ] Nach „falsch“ und „fast“ in der Schreibübung werden die abweichenden Buchstaben markiert, ohne Rot und ohne Kreuz.
- [ ] Das Nachschreiben ist freiwillig, überspringbar und ändert weder Punkte noch Leitner (die erste Antwort zählt, wie bisher).
- [ ] Das Wort am Rundenende kommt weiterhin noch einmal.
- [ ] Alles ist vorlesbar, das englische Wort auch buchstabiert (siehe V7).
- [ ] `unterschiede` hat Unit-Tests (fehlender, zusätzlicher, vertauschter Buchstabe).

### V4 Unregelmäßige Verben (Rang 4) 🔒

**Was Milena erlebt:** Eine eigene Lektionsart „Verben“. Sie hört die Reihe im Rhythmus (*go – went – gone*) und spricht mit, wählt dann die richtige Vergangenheitsform aus drei, später schreibt sie einzelne Formen („gehen, Vergangenheit: ___“). Verben mit gleichem Klangmuster stehen in Gruppen (*sing/sang/sung, drink/drank/drunk*).
**Warum:** In Klasse 6 kommen meist das *simple past* und die unregelmäßigen Verben. Sie müssen auswendig gelernt werden. Konsens: nach Häufigkeit und Klangmuster ordnen, laut im Rhythmus sprechen, jede Form einzeln abfragen (⚪, Klangmuster 🟡). Heute lassen sich Dreierreihen nicht sinnvoll eintragen (L5).
**Dateien:** `src/lektionen/lektion.ts` (neue Inhaltsart `{ art: 'verben', verben: { id, de, formen: [inf, past, participle] }[] }`), `src/eltern/fotoImport.ts` (Schema und Anweisung für Verbtabellen), `src/eltern/LektionBearbeiten.tsx`, neues Übungsmodul (z. B. `src/vokabeln-en/verben.ts` + `UebungVerb.tsx`), `leitner.ts` (Stand je Verb**form**, Schlüssel `listeId/verbId/form`), `quellen.ts`, Tests und E2E
**Akzeptanzkriterien:**
- [ ] Eine fotografierte Verbtabelle wird als Verb-Lektion erkannt, in der Vorschau bearbeitbar und erst nach Freigabe gespeichert.
- [ ] Jede der drei Formen hat einen eigenen Leitner-Stand.
- [ ] Ältere App-Versionen behalten die Lektion und überspringen sie (wie heute bei unbekannten Inhaltsarten).
- [ ] Punkte wie bei Vokabeln, keine neuen Punktwerte.
- **Übergangslösung ohne Code:** Eltern tragen einzelne Formen als Wortpaare ein, z. B. `went – ging (go)`.

### V5 Hilfe zählt als Üben, nicht als „gekonnt“ (Rang 5)

**Was Milena erlebt:** Nichts Sichtbares. Punkte bleiben wie heute (mit Hilfe +1 statt +2). Ein Wort, das sie nur mit Hilfe-Buchstaben geschafft hat, kommt am nächsten Tag wieder statt erst in 3 Tagen.
**Warum:** Ins nächste Fach sollte ein Wort nur kommen, wenn sie es selbst aus dem Kopf geholt hat (Abrufen 🟢, Nakata 2016 🟡). Heute stuft Hilfe hoch (L2).
**Dateien:** `src/vokabeln-en/leitner.ts` (`naechsterStand` bekommt `mitHilfe`, `berechneStaende` liest es aus dem Ereignis), `leitner.test.ts`
**Akzeptanzkriterien:**
- [ ] Richtig mit Hilfe: Fach bleibt, `faelligAb` = morgen, „verbessert“ zählt nicht.
- [ ] Punkte unverändert (`PUNKTE.mitHilfe`).
- [ ] Hinweis: Die Leitner-Stände werden aus dem Protokoll neu berechnet, die Regel gilt also auch rückwirkend. Einige Wörter rutschen dadurch einmalig ein Fach tiefer. Das ist gewollt, sollte den Eltern aber gesagt werden.
- [ ] **„Fast richtig“** bleibt vorerst wie heute (stuft hoch). Ob das so bleibt, hängt von Frage 1 an die Eltern ab.

### V6 Mündlich abrufen: Sprechkarte (Rang 6) 🔒

**Was Milena erlebt:** Eine zusätzliche Übung zwischen „wählen“ und „schreiben“: Sie sieht und hört das deutsche Wort, sagt das englische laut, tippt auf „Aufdecken“, hört und sieht die Lösung und tippt „✅ Gewusst“ oder „🔁 Noch nicht“.
**Warum:** Aktives Abrufen wirkt stärker als Wiedererkennen (🟢/🟡), mündlich geht das ohne die Schreibhürde. Laut sprechen hilft zusätzlich (🟢). Wenn ihre Rechtschreibung in Englisch nicht bewertet wird, ist das die wichtigste Übungsform.
**Dateien:** neue `src/vokabeln-en/UebungSagen.tsx`, `src/daten/ereignisse.ts` (`Uebung` um `'sagen'` erweitern → Ereignisformat, 🔒), `leitner.ts` (`uebungFuer`), `Runde.tsx`, Tests
**Akzeptanzkriterien:**
- [ ] Selbsteinschätzung „Gewusst“ stuft höchstens bis Fach 2 hoch, darüber nur Schreiben (oder, je nach Antwort auf Frage 1, auch Sprechen).
- [ ] „Noch nicht“ ist kein Fehler im Ton: „Gut, dass du ehrlich bist. Es kommt gleich nochmal.“
- [ ] Ältere App-Versionen ignorieren das neue Ereignis, ohne abzustürzen.

### V7 Buchstabieren und Buchstabengruppen (Rang 7)

**Was Milena erlebt:** In der Schreibübung und in der Lösung gibt es „🔤 Buchstabieren“: Das Wort wird auf Englisch Buchstabe für Buchstabe vorgelesen. Häufige Buchstabengruppen (*igh, ea, ee, oo, th, wh, sh, ch, tion*) sind in der Lösung dezent zusammengefasst (unterstrichen), nicht bunt.
**Warum:** MSL setzt auf ausdrückliche Laut-Buchstaben-Muster und mehrere Sinne (🟡/⚪). Buchstabieren auf Englisch wird in der Schule ohnehin geübt.
**Dateien:** `src/vokabeln-en/runde.ts` (reine Funktionen `buchstabiert(wort)` und `buchstabengruppen(wort)`), `UebungSchreiben.tsx`, `Runde.tsx`, `src/basis/vorlesen.ts` (Pausen zwischen Buchstaben), Tests
**Akzeptanzkriterien:**
- [ ] Buchstabieren nutzt die englische Stimme, Tempo wie in den Einstellungen.
- [ ] Die Gruppen-Markierung ist abschaltbar und nutzt keine Farbe als einziges Merkmal.

### V8 Neue Wörter an ihr Tempo anpassen (Rang 8)

**Was Milena erlebt:** Nichts Sichtbares. Wenn ihr neue Wörter schwerfallen, kommen ein paar Tage lang 3 statt 5 neue pro Runde.
**Warum:** Wird die Menge an das Kind angepasst, bleibt mehr hängen (Burns u. a. 2016 🟡).
**Dateien:** `src/vokabeln-en/leitner.ts` (`NEU_PRO_RUNDE` → Funktion `neuProRunde(ereignisse, heute)`), Tests
**Akzeptanzkriterien:**
- [ ] Werden von den Wörtern, die in den letzten 3 Tagen neu waren, bei der ersten Wiederholung weniger als 60 % richtig beantwortet, gibt es 3 neue Wörter pro Runde, sonst 5.
- [ ] Bei Vorrang vor einer Arbeit (V1) gelten immer 5.

### V9 Lückensätze (Rang 9) 🔒

**Was Milena erlebt:** Bei Wörtern, die schon sitzen (Fach 3+), kommt ab und zu statt der Übersetzung ein kurzer Satz: *„I ___ my teeth every morning.“* Er wird vorgelesen, mit einem Ton an der Lücke. Sie wählt aus drei Wörtern oder schreibt.
**Warum:** Lückensätze üben, wie ein Wort benutzt wird, das wird in Klassenarbeiten verlangt (🟡, gemischt). Mehr Lesen ist bei LRS eine Hürde, deshalb erst bei sicheren Wörtern und mit Vorlesen.
**Dateien:** `src/vokabeln-en/typen.ts` (`Vokabel.satz?`), `src/lektionen/lektion.ts` (`pruefeVokabeln`), `src/eltern/fotoImport.ts` (Beispielsatz aus dem Buch übernehmen, sonst einen einfachen erzeugen, nur mit Wörtern aus der Lektion), `LektionBearbeiten.tsx`, neue `UebungLuecke.tsx`, `leitner.ts`, Tests
**Akzeptanzkriterien:**
- [ ] Sätze sind höchstens 8 Wörter lang. Die Eltern sehen und bearbeiten sie in der Vorschau.
- [ ] Ohne Satz bleibt alles wie heute. Ältere App-Versionen ignorieren das Feld.
- [ ] Höchstens jede dritte Wiederholung eines Wortes ist ein Lückensatz.

### V10 Selbst wählen, was sie übt (Rang 10)

**Was Milena erlebt:** Vor einer Extra-Runde kann sie antippen: „Alles gemischt“ oder eine bestimmte Lektion („Unit 3“).
**Warum:** Selbstbestimmung stärkt die Motivation, besonders mit 11–13 (⚪/🟡).
**Dateien:** `src/vokabeln-en/VokabelSeite.tsx`, `Runde.tsx`, `leitner.ts` (`extraRundeAuswaehlen` mit Filter)
**Akzeptanzkriterien:**
- [ ] Nur für Extra-Runden. Die fälligen Wörter kommen weiter nach Plan.
- [ ] Auswahl über große Kacheln mit Vorlese-Knopf.

### V11 Langzeit-Fach (Rang 11)

**Was Milena erlebt:** Nichts. Wörter, die zweimal hintereinander in Fach 5 richtig waren, kommen erst nach 30 Tagen wieder. So bleibt mehr Platz für Neues, und alte Lektionen werden trotzdem nicht vergessen.
**Warum:** Längere Abstände zahlen sich beim langfristigen Behalten aus (Kim & Webb 2022 🟢).
**Dateien:** `src/vokabeln-en/leitner.ts` (`FAECHER = 6`, `PAUSE_TAGE[6] = 30`), Fortschrittsanzeige im Eltern-Bereich („sicher“ = Fach 3+ bleibt), Tests. SPEC sagt „5 Fächer“ und müsste angepasst werden.

### V12 Rückmeldetexte, die informieren (Rang 12)

**Was Milena erlebt:** Statt immer „Richtig! Super gemacht!“ wechseln die Texte und sagen manchmal, was passiert: „Richtig! *night* kennst du jetzt seit einer Woche.“ / „Richtig! Das Wort kommt erst in 7 Tagen wieder.“
**Warum:** Informierende Rückmeldung wirkt stärker als reines Lob (Wisniewski u. a. 2020 🟢), und Kompetenzerleben motiviert (⚪).
**Dateien:** `src/vokabeln-en/Runde.tsx` (`Rueckmeldung`), Tests

### V13 Ähnliche neue Wörter trennen (Rang 13)

**Was Milena erlebt:** Nichts. Neue Wörter werden nicht mehr streng in Listenreihenfolge eingeführt, sondern über die Lektion verteilt, damit z. B. nicht fünf Farben am selben Tag neu sind.
**Warum:** Ähnliche neue Wörter werden leichter verwechselt (Nakata & Suzuki 2019 🟡). Die Evidenz ist schwach, der Aufwand aber klein.
**Dateien:** `src/vokabeln-en/leitner.ts` (`rundeAuswaehlen`: neue Wörter mit festem Schritt aus der Liste wählen), Tests

### Nicht empfohlen

- **Aussprache automatisch bewerten:** Bei Kinderstimmen und Lernenden zu unzuverlässig, würde frustrieren. Außerdem geht das Audio an Google.
- **Bunte Silben oder Spezialschrift als Kernfunktion:** Wirkung nicht belegt (Recherche-LRS.md).
- **Interleaving „künstlich“ erzwingen:** Bei Wörtern eher nachteilig (Brunmair & Richter 2019 🟢). Das heutige Mischen über das Leitner-System reicht.
- **Serien („Streaks“) mit Verlust bei einem Tag Pause:** Erzeugen Druck und widersprechen den Grundsätzen.
- **Bilder zum Wählen** (SPEC, L6): Für Klasse-6-Vokabeln sind viele Wörter nicht abbildbar (*although, decide*), und Bilder bräuchten eine Quelle oder KI-Bilder. Vorschlag: In SPEC „Bild/Wort wählen“ durch „Wort wählen“ ersetzen.

---

## 4. Offene Fragen an die Eltern

**Antworten der Eltern (01.11.2026):**
- Milena hat einen **Nachteilsausgleich**. Schule: **Realschule in Nordrhein-Westfalen**. Ob ihre Rechtschreibung in Englisch bewertet wird (Notenschutz), ist noch offen.
- Lehrbuch: **Lighthouse Advanced 2** (Cornelsen, Klasse 6).
- Unregelmäßige Verben: Das Vokabelheft (Foto vom 01.11.2026) enthält gerade eine Liste mit Vergangenheitsformen (*began, blew, broke, brought, built, bought, caught, chose, came, cost, cut, did*). Sie sind also offenbar gerade dran – V4 wird damit wichtiger.
- Abfrage durch die Lehrkraft und lautes Sprechen: fragen die Eltern nach.
- LRS-Förderung gibt es in der Schule (keine Abstimmung nötig), eine Therapie derzeit nicht.
- Folgerung bis zur Klärung: Schreiben bleibt Übungsform (es hilft beim Lernen), „fast richtig“ stuft weiter hoch, die Sprechkarte (V6) bleibt vorgemerkt.


1. **Nachteilsausgleich / Notenschutz in Englisch:** Hat Milena einen Bescheid? Wird ihre **Rechtschreibung in Englisch bewertet**? Davon hängt ab, wie stark die App auf Schreiben setzt (V3, V5, V6) und ob „fast richtig“ weiter hochstufen soll.
2. **Bundesland und Schulart:** Damit wir die geltenden LRS-Regeln nachlesen können.
3. **Wie fragt die Lehrkraft Vokabeln ab?** Schriftlich DE→EN, EN→DE, mündlich, in Sätzen? Die App sollte ähnlich üben.
4. **Lehrbuch:** Welches (z. B. *English G Lighthouse*, *Green Line*, *Access*)? Stehen auf den Vokabelseiten Beispielsätze, die der Foto-Import mitnehmen kann (V9)?
5. **Unregelmäßige Verben:** Sind sie schon dran oder wann kommen sie (V4)?
6. **Laut sprechen:** Übt Milena dort, wo andere sie hören? Ist ihr laut Sprechen unangenehm? (V2 lässt sich abschalten.)
7. **LRS-Förderung oder -Therapie:** Gibt es eine? Dann stimmen wir V3 und V7 am besten mit der Therapeutin oder dem Therapeuten ab.
8. **Hilfe-Buchstaben:** Ist es für euch in Ordnung, dass Wörter mit Hilfe öfter wiederkommen (V5)? Für Milena ändert sich an den Punkten nichts.
9. **Reihenfolge:** Passt die vorgeschlagene Reihenfolge, oder ist z. B. die nächste Klassenarbeit wichtiger (dann zuerst V1 und V4)?
