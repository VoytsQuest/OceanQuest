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
js/extras.js          Shop-Erweiterung: Trikots, Badeanzüge, Perücken, Begleiter
assets/video/         VoytsQuest-Intro
js/audio.js           Musik-Playlist + synthetische Soundeffekte
js/input.js           Tastatur + Multitouch
js/save.js            Spielstand (robust gegen beschädigte Daten)
tests/mathgen.test.js Automatischer Test: node tests/mathgen.test.js  (24.000 Aufgaben)
tests/browser.test.js Playwright-Test inkl. Erreichbarkeitsprüfung aller 8 Level
```
Alle Grafiken werden im Code gezeichnet – keine fremden Assets. Die Schrift „Fredoka“ wird von Google Fonts geladen
(offline greift automatisch eine Systemschrift).
