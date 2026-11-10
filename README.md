# OceanQuest – Die 8 Prüfungen der Tiefsee
Ein 2D-Mathematik-Abenteuer für Klasse 5 · **VoytsQuest**

## Starten
- **Lokal:** Ordner mit einem kleinen Webserver öffnen (z. B. `python3 -m http.server`) und `http://localhost:8000` aufrufen.
  (Ein direkter Doppelklick auf `index.html` funktioniert meist auch, die Musik braucht aber je nach Browser einen Server.)
- **GitHub Pages:** Den kompletten Ordner in ein Repository hochladen → *Settings → Pages → Branch: main / root*. Fertig.

Keine Installation, keine Anmeldung, keine Datenübertragung. Der Spielstand liegt nur im LocalStorage des Geräts.

## Steuerung
| Taste | Aktion |
|---|---|
| ← → ↑ ↓ / WASD | schwimmen (auch diagonal) |
| Leertaste | Flossenschlag (Abklingzeit 0,7 s) |
| **M** | **nächster Musik-Track** (auch über den ♫-Knopf oben rechts) |
| Esc | Pause |

Auf dem iPad erscheinen Touch-Tasten (Multitouch: Bewegen + Flossenschlag gleichzeitig).

## Ablauf
VoytsQuest-Intro → 8 Welten mit Bossen (Mbappé stellt 12 Fragen) → **großes Finale: Unterwasser-Fußball gegen Mbappé**
(spielt sich wie Airhockey, wer zuerst 5 Tore schießt, gewinnt) → Urkunde „Meister der 8 Meere“.
Nach jedem Level geht es über die Shop-Leiste direkt in den Delfin-Shop (Trikots, Badeanzüge, Perücken, Begleiter …).
Easter Eggs: In Welt 1 und Welt 3 sind Muscheln zu Buchstaben angeordnet – wer alle sammelt, bekommt einen Bonus.

## Speichern
- **3 Spielstände** (z. B. für mehrere Kinder an einem iPad) – jeder mit eigenem Delfin, Fortschritt, Coins und Items.
- **Automatisch** an jedem Checkpoint, beim Verlassen eines Levels und beim Schließen der Seite. Zusätzlich gibt es einen 💾-Knopf im Pausenmenü.
- **Fortsetzen** startet am letzten Checkpoint – inklusive bereits gesammelter Muscheln.
- **Gerät wechseln:** Spielstände → „Code anzeigen“ und auf dem anderen Gerät „Code eingeben“.

## Mathe-Contest: Die große Muschel-Show
Delfin auswählen, dann 15 Fragen von leicht (Welt 1) bis schwer (Welt 7) mit je 4 Antworten.
Gewinnleiter 20 → 5.000 Muschel-Coins, Sicherheitsstufen bei Frage 5 (150) und 10 (800),
Joker: 50:50, Publikum und Anruf bei Professor Willy. Aussteigen ist jederzeit möglich. Showmaster ist Otto.

## Fußball-Modus
Öffnet sich, wenn das Spiel durchgespielt (Finale gewonnen) und im Mathe-Contest mindestens Frage 5 erreicht ist.
Liga durch die 8 Stadien der Bosse (Willy bis Mbappé), wer zuerst 3 Tore schießt, gewinnt. Vor jedem Spiel 3 Aufwärm-Aufgaben
(+50 Coins pro richtiger Antwort). Belohnungen: Goldene Brille (Stadion 2), Goldene Kette (4), Fußball-Fisch (6), Winner-Trikot (8).

## Fußball-Duell (2 Spieler, 1 Gerät)
Öffnet sich, wenn alle 8 Stadien im Fußball-Modus gewonnen sind. Jeder wählt eine Figur (eigene Delfine aus den
Spielständen oder einen der 8 Bosse) und die Torzahl (3, 5 oder 7).
Spieler 1 (links): W A S D + Leertaste (Sprint) · Spieler 2 (rechts): Pfeiltasten + Enter (Sprint).
Auf dem iPad zieht jeder mit dem Finger auf seiner Spielfeldhälfte – beide gleichzeitig.

## Expeditionen (Abenteuer-Modus)
Öffnet sich, wenn alle anderen Modi geschafft sind (inkl. aller 8 Fußball-Stadien). Sechs Expeditionen mit je Bronze/Silber/Gold:
1. **Die Hai-Jagd** – Bruno jagt dich, das Bild scrollt automatisch; Rechentore mit drei Ergebnissen (richtig = Turbo).
2. **Riff-Erkundung** – offenes Riff mit Mini-Karte, 10 Schätze mit Zahlenschlössern (3 hinter Geheimwänden), 12 Meerestiere fürs Lexikon.
3. **Tauchgang in die Tiefe** – senkrecht nach unten, Sauerstoffanzeige, Luftstationen mit Sachaufgaben, zunehmende Dunkelheit.
4. **Vulkanflucht** – steigende Lava, Felsbrocken wegschieben, Doppelschalter, Lava-Schlösser (Lava pausiert bei Aufgaben).
5. **Rettungsmission** – Netzknoten lösen (je eine Aufgabe), danach Babyschildkröte Tilda sicher zum Strand bringen.
6. **Albtraum-Tiefsee** – die 8 Welten mit nur 1 Herz, schnelleren Gegnern, schwereren Aufgaben, Boss mit 2 Fragen mehr.

Neue Bewegungen: **Dash** (Umschalt oder K, auf dem iPad eigener Knopf) mit kurzer Unverwundbarkeit, **Verstecken im Seegras**,
Barrakudas mit erkennbarem Angriffsmuster (rotes Leuchten vor dem Angriff), Steinschlag mit Schatten-Vorwarnung.
Belohnungen: Haizahn-Kette, Forscherhut, Helmlampe (macht dunkle Level heller), Taucherflossen, Rettungsring, Expeditions-Trikot.
Meeres-Lexikon mit 12 Tieren und echten Fakten, Expeditions-Urkunde.

## Spielzeit-Limit
90 Minuten pro Gerät und Tag (gezählt wird nur, solange das Spiel sichtbar geöffnet ist; neuer Tag ab 00:00 Uhr).
Warnungen bei 10, 5 und 1 Minute Restzeit, danach wird der Fortschritt gespeichert und eine Pausen-Nachricht angezeigt.
Die heutige Spielzeit steht unter Einstellungen. Grenze ändern: `LIMIT` in `js/limit.js`.

## Urkunden
Drei druckbare Urkunden (auch als PDF): Spiel durchgespielt (mit richtigen/falschen Antworten, Muscheln und weggestoßenen Gegnern),
Mathe-Contest und Fußball-Modus.

## Musik
`assets/music/` enthält die 5 eigenen Tracks (Whale Call at Dawn I/II, Deep Currents, Deep Reflections I/II).
Jede Welt startet mit eigener Stimmung, nach Trackende geht es automatisch weiter. Musik startet erst nach der
ersten Nutzerinteraktion (Browser-Regel) und ist in den Einstellungen abschaltbar. Weitere Tracks: Datei in
`assets/music/` legen und in `js/audio.js` → `TRACKS` eintragen.

## Projektstruktur
```
index.html            Einstieg
css/style.css         Maritime UI (Holz, Pergament, Gold)
js/mathgen.js         Mathematikgenerator (UI-unabhängig, 14 Themen, 5 Antwortformate)
js/worlds.js          Daten der 8 Welten + Bossdialoge
js/game.js            Engine: Levelaufbau, Physik, Kollisionen, Gegner-KI, Bossablauf, Rendering
js/art.js             Prozedurale Cartoon-Grafik (Delfin, Gegner, 8 Bosse, Hintergründe)
js/ui.js              Menüs, Delfin, Shop, Bosskampf, Ergebnis, Finale-Start, Urkunde (Druck + PDF)
js/finale.js          Finale: Unterwasser-Fußball (Airhockey-Physik, Mbappé-KI, Zuschauer)
js/expedition.js      Expeditionen: eigene Engine (Autoscroll, offene Karte, Sauerstoff, Lava, Eskorte)
js/extras.js          Shop-Erweiterung: Trikots, Badeanzüge, Perücken, Begleiter
assets/video/         VoytsQuest-Intro
js/audio.js           Musik-Playlist + synthetische Soundeffekte
js/input.js           Tastatur + Multitouch
js/save.js            Spielstand (robust gegen beschädigte Daten)
js/limit.js           Spielzeit-Limit (90 Minuten pro Tag)
tests/mathgen.test.js Automatischer Test: node tests/mathgen.test.js  (46.500 Aufgaben inkl. Quiz)
tests/browser.test.js Playwright-Test inkl. Erreichbarkeitsprüfung aller 8 Level
```
Alle Grafiken werden im Code gezeichnet – keine fremden Assets. Die Schrift „Fredoka“ wird von Google Fonts geladen
(offline greift automatisch eine Systemschrift).
