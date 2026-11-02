/* OceanQuest – Weltdaten (8 Welten) */
(function (root) {
  'use strict';
  const WORLDS = [
    {
      id: 1, name: 'Willys buntes Korallenriff', short: 'Korallenriff', boss: 'willy', bossName: 'Willy', bossTitle: 'die Qualle mit Brille', hp: 3, par: 150,
      theme: { top: '#46d6ec', bottom: '#0a5d93', rays: 0.4, far: 'coral', farCol: '#2a8fb8', midCol: '#1f7aa3', rock: ['#d79a6a', '#9a6440'], cap: 'coral', particles: 'bubbles', floor: '#e8cf9a' },
      enemies: ['fish', 'crab', 'jelly'], big: [], hazards: ['urchin'],
      mech: { gap: 330, pillars: 5, moving: 0, currents: 1, enemySpeed: 0.8, chase: 0, tutorial: true },
      intro: ['Moment! Wo ist meine Brille? … Ach, da ist sie ja – auf meiner Nase!', 'Ich bin Professor Willy. Niemand kommt an mir vorbei, ohne zu rechnen!', 'Na, {name}? Zeig mir, was du im Kopf hast!'],
      hits: ['Autsch! Richtig gerechnet!', 'Hmm, das stand so nicht in meinem Lehrbuch …', 'Meine Brille beschlägt vor lauter Staunen!'],
      wrong: ['Hihi, knapp daneben! Schau nochmal genau hin.', 'Selbst ich mit Brille sehe: Das stimmt noch nicht.'],
      defeat: 'Unglaublich! Du rechnest schneller, als ich meine Brille suche. Hier, die erste magische Perle!'
    },
    {
      id: 2, name: 'Timmys versunkenes Piratenschiff', short: 'Schiffswrack', boss: 'timmy', bossName: 'Timmy', bossTitle: 'der Piratenhai', hp: 4, par: 180,
      theme: { top: '#2fa7c9', bottom: '#0a3d66', rays: 0.3, far: 'ship', farCol: '#24688c', midCol: '#1b5878', rock: ['#8b5a34', '#5a3920'], cap: 'planks', particles: 'bubbles', floor: '#c8b07a' },
      enemies: ['fish', 'crab', 'puffer'], big: ['bigfish'], hazards: ['urchin'],
      mech: { gap: 300, pillars: 6, moving: 2, currents: 2, enemySpeed: 1, chase: 0.2 },
      intro: ['Arrr! Ich bin Timmy, der gefährlichste Hai der sieben Meere!', 'Dieser Schatz gehört MIR! … Ist das da hinten etwa ein Seestern?! Nein? Puh.', 'Rechne, {name}, oder du musst die Planke entlangschwimmen!'],
      hits: ['Arrr! Ein Volltreffer!', 'Meine Goldmünzen! Ähm … ich meine: Gut gerechnet.', 'Das tut mehr weh als ein Seestern im Hut!'],
      wrong: ['Harr harr! Daneben, Landratte!', 'Fast! Aber ein Pirat zählt genauer.'],
      defeat: 'Ich ergebe mich! Aber erzähl niemandem, dass ich Angst vor Seesternen habe. Nimm die Perle!'
    },
    {
      id: 3, name: 'Günthers eisige Lagune', short: 'Eislagune', boss: 'guenther', bossName: 'Günther', bossTitle: 'der Eiskunstläufer-Orca', hp: 4, par: 200,
      theme: { top: '#9fe6f5', bottom: '#174f80', rays: 0.25, far: 'ice', farCol: '#6fb6d6', midCol: '#4d93bd', rock: ['#d8f2ff', '#8fc3e0'], cap: 'snow', particles: 'snow', floor: '#e6f6ff' },
      enemies: ['fish', 'jelly', 'puffer'], big: ['eel'], hazards: ['urchin'],
      mech: { gap: 280, pillars: 6, moving: 3, currents: 3, enemySpeed: 1, chase: 0.2, slippery: true },
      intro: ['Sieh her: ein dreifacher Orca-Salto! … Na gut, es war ein einfacher.', 'Ich bin Günther, der eleganteste Eiskunstläufer der Lagune.', '{name}, rechne geschickt – so geschickt wie ich tanze!'],
      hits: ['Diese Rechnung ist schwieriger als mein dreifacher Orca-Salto!', 'Uiii, ich rutsche aus!', 'Brrr, das war eiskalt gerechnet!'],
      wrong: ['Hoppla, ausgerutscht! Versuch es nochmal.', 'Nicht so eilig, auf Eis muss man vorsichtig sein!'],
      defeat: 'Bravo! Das war eine Rechen-Kür mit Bestnote. Hier ist deine Perle!'
    },
    {
      id: 4, name: 'Bobs versunkener Dschungel', short: 'Dschungel', boss: 'bob', bossName: 'Bob', bossTitle: 'der Mini-Piranha', hp: 5, par: 220,
      theme: { top: '#5fcf9a', bottom: '#0d4a3a', rays: 0.3, far: 'jungle', farCol: '#2f7f5f', midCol: '#226a4c', rock: ['#7a5a3a', '#4a3420'], cap: 'moss', particles: 'spores', floor: '#6b5a35' },
      enemies: ['piranha', 'fish', 'crab'], big: ['eel'], hazards: ['urchin'],
      mech: { gap: 260, pillars: 8, moving: 2, currents: 2, enemySpeed: 1.15, chase: 0.5, roots: true },
      intro: ['HALT! Ich bin Bob, der gefährlichste Piranha im ganzen Dschungel!', 'Ich könnte einen ganzen Wal verschlingen! … Na gut, einen kleinen Wal. Eine Krabbe. Einen Keks.', '{name}, ich bin vielleicht klein, aber mein Gehirn ist RIESIG!'],
      hits: ['Grrr! Meine Zähne klappern vor Schreck!', 'Das war … beeindruckend. Für einen Delfin.', 'Ich bin vielleicht klein, aber mein Gehirn ist RIESIG! … War es zumindest.'],
      wrong: ['Hah! Mein riesiges Gehirn hat es gleich gemerkt!', 'Klapp-klapp! Versuch es noch einmal.'],
      defeat: 'Okay, okay! Du bist schlauer als ich. Und ich bin ziemlich schlau. Hier, die Perle!'
    },
    {
      id: 5, name: 'Lamas vergessener Wassertempel', short: 'Wassertempel', boss: 'lama', bossName: 'Lama', bossTitle: 'das Krokodil-König', hp: 5, par: 240,
      theme: { top: '#3fb2c9', bottom: '#103a5c', rays: 0.35, far: 'temple', farCol: '#3d7f94', midCol: '#2c6880', rock: ['#c9b48a', '#8a7650'], cap: 'stone', particles: 'glyphs', floor: '#b8a47a' },
      enemies: ['crab', 'fish', 'jelly'], big: ['bigfish'], hazards: ['urchin'],
      mech: { gap: 270, pillars: 6, moving: 4, currents: 2, enemySpeed: 1.1, chase: 0.3, switches: 2 },
      intro: ['Verneigt euch! Ich bin Lama, König des Wassertempels!', 'Als König befehle ich dir … Moment, was wollte ich noch mal?', 'Ach ja! {name}, löse meine königlichen Rätsel!'],
      hits: ['Meine Krone wackelt!', 'Das … das befehle ich nicht! Oder doch? Ich habe es vergessen.', 'Ein königlicher Treffer!'],
      wrong: ['Ha! Selbst ich weiß, dass das nicht stimmt. Glaube ich.', 'Falsch! … Oder? Ja, falsch!'],
      defeat: 'Ich befehle dir … diese Perle zu nehmen! Ja, genau das wollte ich sagen.'
    },
    {
      id: 6, name: 'Ottos Labyrinth der acht Arme', short: 'Labyrinth', boss: 'otto', bossName: 'Otto', bossTitle: 'der Socken-Oktopus', hp: 6, par: 260,
      theme: { top: '#7d5fd6', bottom: '#1c1145', rays: 0.15, far: 'cave', farCol: '#4a3590', midCol: '#3a2878', rock: ['#6a4fa8', '#3a2a6a'], cap: 'glow', particles: 'glow', floor: '#4a3a7a' },
      enemies: ['inkpus', 'jelly', 'fish'], big: ['eel'], hazards: ['urchin'],
      mech: { gap: 250, pillars: 8, moving: 4, currents: 3, enemySpeed: 1.15, chase: 0.4, ink: true },
      intro: ['Hallo, hallo, hallo, hallo, hallo, hallo, hallo, hallo! Ich bin Otto!', 'Ich trage acht verschiedene Socken – die Mode der Tiefsee!', 'Acht Arme und trotzdem nicht genug Finger zum Rechnen! Hilf mir, {name}!'],
      hits: ['Ups, jetzt habe ich mich verknotet!', 'Arm drei weiß nicht, was Arm sieben rechnet!', 'Meine Socken rutschen vor Staunen!'],
      wrong: ['Hihi, das hat Arm fünf auch gedacht. War aber falsch!', 'Knapp! Zähl nochmal nach – mit allen Armen.'],
      defeat: 'Du hast mich entknotet! Hier ist die Perle – und behalte ruhig eine Socke!'
    },
    {
      id: 7, name: 'Herberts leuchtende Tiefsee', short: 'Tiefsee', boss: 'herbert', bossName: 'Herbert', bossTitle: 'der Anglerfisch', hp: 6, par: 280,
      theme: { top: '#173a6e', bottom: '#030a1c', rays: 0, far: 'deep', farCol: '#0f2a52', midCol: '#0b2244', rock: ['#2c3c5c', '#141e33'], cap: 'biolum', particles: 'glow', floor: '#1d2a44' },
      enemies: ['lantern', 'jelly', 'piranha'], big: ['eel'], hazards: ['urchin'],
      mech: { gap: 250, pillars: 8, moving: 4, currents: 3, enemySpeed: 1.25, chase: 0.6, dark: true },
      intro: ['Wer hat das Licht ausgemacht? … Oh. Ich.', '*klick* So! Ich bin Herbert, der hellste Kopf der Tiefsee!', '{name}, mal sehen, ob dir ein Licht aufgeht!'],
      hits: ['Meine Lampe flackert!', 'Uff! Da ist mir ein Licht aufgegangen.', 'Hast du das Licht gesehen? Ich nicht, es war aus.'],
      wrong: ['Hmm, da tappst du noch im Dunkeln.', 'Fast! Schalte deine Gedanken-Lampe an.'],
      defeat: 'Du bist wirklich ein helles Köpfchen! Diese leuchtende Perle gehört dir.'
    },
    {
      id: 8, name: 'Mbappés Abgrund der sieben Meere', short: 'Abgrund', boss: 'mbappe', bossName: 'Mbappé', bossTitle: 'der Megalodon', hp: 12, par: 320,
      theme: { top: '#3a2a5a', bottom: '#120508', rays: 0.1, far: 'volcano', farCol: '#3a1f2f', midCol: '#2a1420', rock: ['#4a3a3a', '#241818'], cap: 'lava', particles: 'embers', floor: '#3a2020' },
      enemies: ['piranha', 'puffer', 'inkpus', 'lantern'], big: ['bigfish', 'eel'], hazards: ['urchin'],
      mech: { gap: 250, pillars: 9, moving: 5, currents: 4, enemySpeed: 1.3, chase: 0.6, lava: true, ink: false },
      intro: ['ICH bin Mbappé, der unbesiegbare Herrscher der Tiefsee!', 'Niemand hat jemals meine acht Prüfungen bestanden!', 'Na gut, {name} … du hast sieben Bosse besiegt. Aber ICH bin viel größer. Und schneller. Und hübscher.'],
      hits: ['WAS?! Das kann nicht sein!', 'Okay, das war ein guter Treffer. Aber nur ein bisschen gut.', 'Mein Zahnarzt wird das nicht glauben!', 'Ich bin trotzdem noch hübscher!'],
      wrong: ['HA! Selbst die Größten irren sich mal. Vor allem du!', 'Nochmal! Ein Megalodon wartet gern … nicht.'],
      defeat: 'Unglaublich … zwölf richtige Antworten! Aber auf dem Fußballplatz schlägt mich NIEMAND. Komm zum großen Finale!'
    }
  ];
  root.WORLDS = WORLDS;
})(window);
