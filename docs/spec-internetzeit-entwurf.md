# Entwurf: Internetzeit am Fernseher als Belohnung (FRITZ!Box)

Status: **Entwurf, geparkt** (02.11.2026). Noch kein Spec und kein Code. Vor dem Bauen steht eine Machbarkeitsprüfung an der FRITZ!Box (Phase 0), danach die offenen Fragen am Ende.
Grundlage: [SPEC.md](../SPEC.md) (Belohnungen, Ereignis-Protokoll, Dropbox-Abgleich), AVM-Schnittstelle TR-064 mit dem Dienst [X_AVM-DE_HostFilter](https://fritz.com/fileadmin/user_upload/Global/Service/Schnittstellen/x_hostfilterSCPD.pdf) (Übersicht: [fritz.com/pages/interfaces](https://fritz.com/en/pages/interfaces)).

## Grundidee in drei Sätzen

1. Die Eltern legen in MiApp eine besondere Belohnung an, z. B. „📺 30 Minuten Fernseh-Internet“. Milena löst sie wie jede Belohnung mit ihren Punkten ein.
2. Ein kleines Programm, die **Internet-Brücke**, läuft auf dem immer eingeschalteten Rechner **SVR-NAS-01** im Heimnetz. Es sieht die Einlösung im Ereignis-Protokoll in der Dropbox und schaltet über die FRITZ!Box das Internet für den Fernseher für die gekaufte Zeit frei.
3. Die App zeigt Milena, dass die Zeit läuft und bis wann. Danach sperrt die Brücke wieder. Das FRITZ!Box-Passwort verlässt dabei nie den SVR-NAS-01.

## Warum nicht direkt aus der App

- MiApp ist eine statische Webseite (GitHub Pages). Die TR-064-Schnittstelle der FRITZ!Box ist nur im Heimnetz erreichbar (`http://fritz.box:49000`, verschlüsselt `https://fritz.box:49443`) und verlangt Benutzer und Passwort.
- Ein Browser darf von einer https-Seite aus nicht mit `http://fritz.box` sprechen (gemischte Inhalte), und die FRITZ!Box erlaubt keine Aufrufe fremder Webseiten (CORS).
- Zugangsdaten zur FRITZ!Box gehören weder in die App noch in die Dropbox noch ins öffentliche Repository (SPEC: keine Geheimnisse im Client).

Deshalb gibt es einen Vermittler im Heimnetz. MiApp und Brücke sprechen nur über die Dropbox miteinander, wie es die Geräte heute schon tun.

```
Milenas Handy (MiApp)        Dropbox (App-Ordner)                 SVR-NAS-01 (Internet-Brücke)          FRITZ!Box
  „📺 30 Min einlösen“  ──►  /ereignisse/<kind>.jsonl   ──liest──►  prüft Regeln, merkt sich Zeitfenster
                             /ereignisse/svr-nas-01.jsonl ◄─schreibt─ „frei bis 19:30“ / „abgelehnt“   ──TR-064──►  Fernseher frei / gesperrt
  zeigt „läuft bis 19:30“ ◄─ (Abgleich wie heute)
```

## Was die FRITZ!Box laut AVM-Dokumentation kann

Dienst `X_AVM-DE_HostFilter` (TR-064):

| Aktion | Zweck |
| --- | --- |
| `GetWANAccessByIP` | Darf das Gerät mit dieser IPv4-Adresse ins Internet? (granted / denied / error) |
| `DisallowWANAccessByIP` | Internet für dieses Gerät sperren (`1`) oder die Sperre aufheben (`0`) |
| `GetTicketIDStatus`, `MarkTicket`, `DiscardAllTickets` | Kindersicherungs-Tickets (verlängern die Online-Zeit eines Zugangsprofils) abfragen und entwerten |

**Nicht** über TR-064 dokumentiert: das Zeitbudget oder die Sperrzeiten eines Zugangsprofils ändern oder ein Gerät einem anderen Profil zuordnen. Das ginge nur über die Weboberfläche (inoffiziell, bricht bei FRITZ!OS-Updates). Das ist hier bewusst nicht vorgesehen.

Ungeklärt und deshalb Teil von Phase 0:
- **Sperre und Zeitbudget:** Hebt `DisallowWANAccessByIP = 0` nur die eigene Sperre auf, oder auch eine Sperre wegen eines verbrauchten Zeitbudgets? Vermutlich nur die eigene.
- **Tickets:** Wie die Tickets im Ablauf genau wirken (ein Ticket = 45 Minuten mehr für das Profil?) und ob `MarkTicket` sie für ein Gerät einlöst oder nur als verbraucht markiert.

## Drei mögliche Wege (Entscheidung nach Phase 0)

### Weg A – Tickets (bevorzugt, falls er trägt)
Das Zugangsprofil des Fernsehers bleibt wie heute (Zeitbudget, Sperrzeiten). Löst Milena Internetzeit ein, löst die Brücke ein Kindersicherungs-Ticket für das Profil ein.
- **Vorteil:** Die heutige Einstellung bleibt, die FRITZ!Box rechnet selbst.
- **Nachteil:** Die Zeit ist an die Ticketlänge gebunden (bei AVM 45 Minuten), und unklar ist, ob das per TR-064 überhaupt so geht.

### Weg B – Die Brücke steuert die Fernsehzeit selbst
Der Fernseher bekommt in der FRITZ!Box ein Profil ohne Zeitbudget. Die Brücke sperrt ihn per `DisallowWANAccessByIP` und gibt ihn frei:
- **feste Zeiten** nach einem Wochenplan, den die Eltern in MiApp festlegen (ersetzt das heutige Zeitbudget), und
- **verdiente Zeiten** aus eingelösten Belohnungen.
- **Vorteil:** beliebige Minuten, alles in einer Hand, für die Familie in der App sichtbar.
- **Nachteil:** Umbau der heutigen Kindersicherung. Ist der SVR-NAS-01 aus, bleibt der Fernseher im letzten Zustand. Deshalb gibt es eine Rückfallregel, siehe I4.

### Weg C – nur zusätzliche Sperre
Das Zeitbudget bleibt. Die Brücke kann nur zusätzlich sperren, nicht verlängern. Das bringt für „mehr Internetzeit“ nichts und taugt nur als Notbremse. Hier nur der Vollständigkeit halber.

## Phase 0 – Machbarkeit prüfen (vor jeder App-Änderung)

Ein kleines Prüfskript auf dem SVR-NAS-01, das nichts dauerhaft verändert. Ihr seid dabei und schaut auf den Fernseher.

1. Die FRITZ!Box antwortet unter `http://fritz.box:49000/tr64desc.xml`, und der Dienst `X_AVM-DE_HostFilter` steht in der Liste.
2. In der FRITZ!Box einen **eigenen Benutzer** anlegen, z. B. `miapp-bruecke`, mit möglichst wenig Rechten. Herausfinden, welches Recht `DisallowWANAccessByIP` mindestens braucht. Mit diesem Benutzer anmelden (Digest-Anmeldung).
3. Die IP-Adresse des Fernsehers feststellen. In der FRITZ!Box „immer die gleiche IPv4-Adresse zuweisen“ einschalten, sonst stimmt die Sperre nach einem Neustart nicht mehr.
4. `GetWANAccessByIP` für den Fernseher: Antwort vergleichen mit dem, was der Fernseher gerade kann.
5. `DisallowWANAccessByIP 1`: Wird der Fernseher gesperrt? Nach wie vielen Sekunden? Läuft ein laufender Stream weiter?
6. `DisallowWANAccessByIP 0`: Kommt das Internet wieder?
7. Zeitbudget heute aufgebraucht (oder Sperrzeit aktiv), dann `DisallowWANAccessByIP 0`: Kommt das Internet trotzdem? Damit ist Weg C geklärt und Weg B bestätigt.
8. `GetTicketIDStatus` und `MarkTicket` mit einem Ticket aus der FRITZ!Box-Oberfläche: Verlängert sich die Zeit für den Fernseher? Damit ist Weg A geklärt.
9. Hat der Fernseher eine IPv6-Adresse und kommt er darüber an der Sperre vorbei? Die Aktionen arbeiten mit IPv4-Adressen.

**Ergebnis von Phase 0:** eine kurze Notiz hier im Dokument (welcher Weg, welche Rechte, Verhalten bei IPv6). Danach wird aus dem Entwurf ein freigegebener Abschnitt in `SPEC.md`.

## Teile

### I1 – Belohnungsart „Internetzeit“ (App)

**Was Milena erlebt:** In „Belohnungen“ steht z. B. „📺 30 Minuten Fernseh-Internet – 150 Punkte“. Tippt sie auf Einlösen, sagt die App vorher, wann es gilt: „Sofort, bis 19:30“ oder „Heute nicht mehr möglich: Ab 20:00 Uhr ist Schluss.“ Danach steht oben auf der Startseite „📺 Internet am Fernseher bis 19:30“.

**Für Eltern:** In „Belohnungen verwalten“ gibt es eine neue Art „Internetzeit“ mit Minuten und Preis. Dazu kommen Einstellungen:
- **Höchstens pro Tag**, z. B. 60 Minuten extra.
- **Erlaubte Uhrzeiten**, z. B. Montag bis Freitag 15:00–20:00, am Wochenende 9:00–20:30.
- **Bestätigung nötig** an oder aus. Ist sie an, startet die Zeit erst, wenn ihr auf einem Eltern-Gerät bestätigt (wie heute bei Einlösungen).

**Datenformat (🔒 erst fragen, SPEC 9):**
- `Belohnung` bekommt die optionalen Felder `art: 'internet'` und `minuten: number`. Ältere App-Versionen zeigen sie als normale Belohnung ohne Vorab-Prüfung. Das ist unkritisch, weil die Brücke jede Einlösung selbst prüft und notfalls ablehnt (Punkte kommen dann zurück).
- Neue Ereignisse, geschrieben **nur von der Brücke** in ihre eigene Datei `/ereignisse/svr-nas-01.jsonl`:
  - `{ typ: 'internet-frei', einloesungId, von, bis }`
  - `{ typ: 'internet-abgelehnt', einloesungId, grund }` mit `grund`: `'tageslimit' | 'uhrzeit' | 'fritzbox' | 'punkte' | 'zu-spaet'` (`zu-spaet`: die Brücke hat die Einlösung erst nach mehr als 10 Minuten gesehen, z. B. nach einem Ausfall)
  - `{ typ: 'bruecke-lebt', zeit }`, höchstens alle 5 Minuten, damit die App weiß, ob die Brücke läuft
- `LESART` steigt. Ältere App-Versionen überspringen die neuen Zeilen ohne Fehler (wie bei Deutsch).

**Punkte:**
- Abgelehnte Einlösungen kosten keine Punkte. Die App rechnet `internet-abgelehnt` als Rückgabe (SPEC: nie Punkte verlieren).
- Nicht genutzte Restminuten verfallen nicht als Punkte, sie werden aber auch nicht zurückgegeben. Das sagt die App vor dem Einlösen.

**Akzeptanzkriterien:**
- [ ] Internetzeit lässt sich nur einlösen, wenn die Punkte reichen, das Tageslimit nicht erreicht ist und die Uhrzeit passt. Die App prüft vorher und sagt den Grund in einfachen Worten, mit Vorlese-Knopf.
- [ ] Gab es in den letzten 15 Minuten kein `bruecke-lebt`, ist Einlösen gesperrt, und die App sagt: „Der Fernseh-Rechner antwortet gerade nicht. Frag Mama oder Papa.“
- [ ] Kommt nach dem Einlösen 2 Minuten lang keine Antwort, sagt die App: „Das dauert gerade länger. Deine Punkte bleiben, bis es geklappt hat.“ Antwortet die Brücke später mit `internet-abgelehnt`, sind die Punkte wieder da.
- [ ] Startseite und Erfolge zeigen laufende und vergangene Internetzeiten.
- [ ] Ohne Brücke (z. B. bei anderen Familien) ist die Belohnungsart ausgeblendet.

### I2 – Die Internet-Brücke (SVR-NAS-01)

**Aufgabe:** Ereignisse lesen, Regeln prüfen, FRITZ!Box schalten, Ergebnis zurückschreiben.

**Technik (Vorschlag):**
- **Node.js-Programm** (wie MiApp: TypeScript, dieselben Prüffunktionen für Ereignisse, `src/sync/abgleich.ts` wiederverwenden), eigener Ordner `bruecke/` im Repository, ohne Geheimnisse.
- **Dropbox-Zugriff:** eigener Zugang über die bestehende Dropbox-App „MiApp-Lernen“ mit Refresh-Token, gespeichert nur auf dem SVR-NAS-01. Auf Änderungen wartet sie per Longpoll wie die App. Sie schreibt nur in ihre eigene Datei.
- **FRITZ!Box-Zugang:** Benutzer und Passwort nur auf dem SVR-NAS-01, nicht im Repository, nicht in der Dropbox (bei Windows z. B. in der Anmeldeinformationsverwaltung, sonst eine Datei, die nur der Dienst-Benutzer lesen darf).
- **Läuft als Dienst** (Windows-Dienst bzw. systemd/Docker, je nach SVR-NAS-01), startet von selbst nach einem Neustart.
- **Kanal:** Die Brücke hört auf den echten Ordner, nicht auf `/vorschau`. Zum Testen gibt es einen Schalter `--vorschau` (eigener Ordner, eigenes Testgerät statt Fernseher).

**Regeln, die die Brücke selbst prüft** (die App kann sich irren oder alt sein):
- Punkte reichen: Die Brücke rechnet den Kontostand aus dem ganzen Protokoll nach, mit derselben Logik wie die App.
- Tageslimit und Uhrzeiten nach den Einstellungen der Eltern.
- Ist die Bestätigung an: Es gibt ein `bestaetigt` von einem Eltern-Gerät.
- Jede Einlösung wird genau einmal geschaltet, auch nach einem Neustart der Brücke (sie merkt sich das in ihrer eigenen Ereignisdatei).
- Überschneiden sich Zeiten, hängt die neue Zeit hinten an.

**Akzeptanzkriterien:**
- [ ] Vom Einlösen bis zum Internet am Fernseher dauert es höchstens 1 Minute.
- [ ] Nach Ablauf der Zeit ist der Fernseher spätestens 1 Minute später gesperrt (Weg B) bzw. das Ticket verbraucht (Weg A).
- [ ] Startet der SVR-NAS-01 neu, stellt die Brücke den richtigen Zustand wieder her (laufende Zeit weiter frei, abgelaufene gesperrt).
- [ ] Die FRITZ!Box ist nicht erreichbar: `internet-abgelehnt` mit `grund: 'fritzbox'`, Punkte bleiben, und im Eltern-Bereich erscheint ein Hinweis.
- [ ] Protokoll nur auf dem SVR-NAS-01, ohne Passwörter, höchstens 30 Tage.
- [ ] Tests mit nachgebauter FRITZ!Box und nachgebauter Dropbox (keine echten Aufrufe in Tests, wie in der App).

### I3 – Feste Fernsehzeiten (nur Weg B)

Ersetzt das heutige Zeitbudget der FRITZ!Box: Wochenplan in den Eltern-Einstellungen von MiApp (z. B. Mo–Fr 17:00–18:30). Die Brücke gibt in diesen Zeiten frei, verdiente Zeit kommt dazu.

### I4 – Sicherheit und Rückfallregeln

- **Rückfallregel bei Ausfall:** Für Weg B legt ihr in der FRITZ!Box zusätzlich eine harte Sperrzeit fest (z. B. 21:00–6:00) als Sicherheitsnetz. Läuft die Brücke nicht, gilt mindestens diese.
- **Fälschen von Einlösungen:** Wer die Dropbox-Dateien schreiben kann, könnte eine Einlösung vortäuschen. Die Brücke rechnet die Punkte nach, und mit „Bestätigung nötig“ braucht es ein Eltern-Gerät. Das reicht für den Familienalltag. Eine echte Absicherung (Signatur je Gerät) wäre deutlich aufwendiger und ist nicht vorgesehen.
- **Rechte:** Der FRITZ!Box-Benutzer der Brücke darf nur, was Phase 0 als nötig ermittelt hat. Kein Fernzugang (MyFRITZ) für diesen Benutzer.
- **Nur der Fernseher:** Die Brücke schaltet ausschließlich die in ihrer Einstellung eingetragene(n) IP-Adresse(n). Milenas Handy bleibt bei Google Family Link.

## Pädagogik (kurz)

- Die Punkte gibt es weiter für Anstrengung, nicht für Noten, und nie wird abgezogen. Internetzeit ist eine Belohnung unter mehreren, kein Ersatz für die anderen.
- Das **Tageslimit** schützt davor, dass Lernen nur noch in Bildschirmzeit getauscht wird. Üben selbst bleibt unbegrenzt.
- Empfehlung: Internetzeit nicht billiger machen als die anderen Belohnungen und nach ein paar Wochen gemeinsam mit Milena schauen, ob es sie motiviert oder Druck macht.

## Aufwand (grob, nach Phase 0)

| Teil | Aufwand |
| --- | --- |
| Phase 0 (Prüfskript, gemeinsamer Test) | 0,5 Tage |
| I1 App (Belohnungsart, Einstellungen, Anzeige, Ereignisse) | 1–1,5 Tage |
| I2 Brücke (Dienst, Dropbox, TR-064, Regeln, Tests) | 1,5–2 Tage |
| I3 feste Zeiten (nur Weg B) | 0,5 Tage |
| Einrichtung auf dem SVR-NAS-01 | 0,5 Tage |

## Offene Fragen an die Eltern

1. **SVR-NAS-01:** Welches Betriebssystem (Windows, Windows Server, Linux, Synology/QNAP)? Läuft dort schon Node.js oder Docker? Habe ich später Zugriff zum Einrichten, oder richtet ihr es nach Anleitung ein?
2. **FRITZ!Box:** Welches Modell und welche FRITZ!OS-Version?
3. **Heutige Kindersicherung am Fernseher:** Zugangsprofil mit Zeitbudget, mit Sperrzeiten oder beides? Wie viel pro Tag?
4. **Welcher Fernseher:** Nur Milenas Fernseher oder der Familienfernseher? Eine Sperre trifft alle, die ihn nutzen. Hängt er per LAN oder WLAN, oder läuft er über einen Stick (Fire TV, Chromecast)? Dann muss dessen IP-Adresse gesperrt werden.
5. **Regeln:** Wie viele Minuten pro Einlösung, welcher Preis, welches Tageslimit, welche Uhrzeiten? Soll die Bestätigung durch euch nötig sein?
6. **Weg A oder B:** Wollt ihr die heutige Kindersicherung behalten (Tickets, falls es geht) oder die Fernsehzeit ganz über MiApp steuern?
7. **Reaktion bei Missbrauch:** Wenn Milena z. B. nachts einlösen will, reicht „heute nicht mehr möglich“, oder sollen die Eltern eine Nachricht bekommen?
