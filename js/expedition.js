/* OceanQuest – Expeditionen: Hai-Jagd, Riff-Erkundung, Tauchgang, Vulkanflucht, Rettungsmission
 * Eigene kleine Engine (frei scrollende Kamera, Dash, Verstecken im Seegras, Gegnermuster, Steinschlag).
 * Die Albtraum-Tiefsee nutzt die normale Spiel-Engine (game.js) mit Profi-Einstellungen. */
(function (root) {
  'use strict';
  const VW = 1280, VH = 720, ACC = 1700, MAXV = 340, HW = 30, HH = 14, SLAP_CD = 0.7, SLAP_DUR = 0.34, DASH_CD = 1.2;
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  let X = null, dark = null;

  const DEFS = [
    { id: 'haijagd', name: 'Die Hai-Jagd', icon: '🦈', short: 'Bruno, der Riesenhai, ist hinter dir her! Schwimm durch das Tor mit dem richtigen Ergebnis – das gibt Tempo.', reward: 'haizahnkette', track: 2, theme: 1, medals: ['Ziel erreicht', '4 Tore richtig', 'Alle 6 Tore richtig, höchstens 1 Treffer'] },
    { id: 'riff', name: 'Riff-Erkundung', icon: '🧭', short: 'Erkunde ein riesiges Riff in alle Richtungen. Öffne Zahlenschlösser, finde Geheimgänge und entdecke Meerestiere fürs Lexikon.', reward: 'forscherhut', track: 3, theme: 1, medals: ['3 Schätze', '8 Schätze', 'Alle 10 Schätze + 12 Meerestiere'] },
    { id: 'tauchgang', name: 'Tauchgang in die Tiefe', icon: '🫧', short: 'Tauche bis zum Meeresgrund. Luftblasen füllen deinen Sauerstoff auf, Luftstationen öffnest du mit Sachaufgaben.', reward: 'helmlampe', track: 7, theme: 7, medals: ['Meeresgrund erreicht', 'Höchstens 2 Herzen verloren', 'Kein Herz verloren, alle Stationen beim 1. Versuch'] },
    { id: 'vulkan', name: 'Vulkanflucht', icon: '🌋', short: 'Unter dir steigt die Lava! Räum Felsbrocken weg, löse Schalterketten und Lava-Schlösser und flieh nach oben.', reward: 'taucherflossen', track: 4, theme: 8, medals: ['Entkommen', 'Höchstens 3 Treffer', 'Höchstens 1 Treffer'] },
    { id: 'rettung', name: 'Rettungsmission', icon: '🛟', short: 'Befreie sechs Meerestiere aus Fischernetzen und bring die Babyschildkröte Tilda sicher an den Strand.', reward: 'rettungsring', track: 1, theme: 2, medals: ['Tilda gerettet', 'Wenige Fehler, Tilda höchstens 1× getroffen', 'Fast fehlerfrei, Tilda unverletzt'] },
    { id: 'albtraum', name: 'Albtraum-Tiefsee', icon: '💀', short: 'Die 8 Welten als Profi-Version: nur 1 Herz, schnellere Gegner, schwerere Aufgaben.', reward: 'trikot-expedition', track: 4, theme: 8, medals: ['2 Albtraum-Welten', '5 Albtraum-Welten', 'Alle 8 Albtraum-Welten'] }
  ];
  const CREATURES = [
    { id: 'oktopus', name: 'Oktopus', fact: 'Ein Oktopus hat drei Herzen und blaues Blut. Mit seinen Armen kann er sogar schmecken!' },
    { id: 'seepferdchen', name: 'Seepferdchen', fact: 'Beim Seepferdchen trägt der Vater die Eier in einer Bauchtasche aus und bringt die Babys zur Welt.' },
    { id: 'schildkroete', name: 'Meeresschildkröte', fact: 'Meeresschildkröten legen ihre Eier oft an genau dem Strand ab, an dem sie selbst geschlüpft sind.' },
    { id: 'clownfisch', name: 'Clownfisch', fact: 'Clownfische wohnen in Seeanemonen. Eine Schleimschicht schützt sie vor deren Nesselgift.' },
    { id: 'kugelfisch', name: 'Kugelfisch', fact: 'Bei Gefahr pumpt sich der Kugelfisch mit Wasser auf, bis er mehrmals so groß ist wie vorher.' },
    { id: 'qualle', name: 'Qualle', fact: 'Quallen haben kein Gehirn, kein Herz und keine Knochen – sie bestehen fast nur aus Wasser.' },
    { id: 'seestern', name: 'Seestern', fact: 'Verliert ein Seestern einen Arm, kann ihm ein neuer nachwachsen.' },
    { id: 'delfin', name: 'Großer Tümmler', fact: 'Delfine schlafen mit nur einer Gehirnhälfte – die andere passt auf und kümmert sich ums Atmen.' },
    { id: 'manta', name: 'Mantarochen', fact: 'Mantarochen können über 7 Meter breit werden – und fressen trotzdem nur winziges Plankton.' },
    { id: 'einsiedler', name: 'Einsiedlerkrebs', fact: 'Einsiedlerkrebse wohnen in leeren Schneckenhäusern. Wird das Haus zu eng, ziehen sie um.' },
    { id: 'papageifisch', name: 'Papageifisch', fact: 'Papageifische knabbern an Korallen. Was sie wieder ausscheiden, wird zu feinem weißem Sand.' },
    { id: 'muraene', name: 'Muräne', fact: 'Muränen haben im Hals ein zweites Kiefer, mit dem sie ihre Beute nach hinten ziehen.' }
  ];

  /* ================= Hilfen ================= */
  function rng(seed) { return Art.rng(seed); }
  const ov = (ax, ay, aw, ah, s) => ax < s.x + s.w && ax + aw > s.x && ay < s.y + s.h && ay + ah > s.y;
  function addSolid(x, y, w, h, kind, extra) { const s = Object.assign({ x, y, w, h, kind: kind || 'rock', ceil: false, id: X.solids.length }, extra || {}); X.solids.push(s); return s; }
  function walls(W, H, top) { addSolid(-200, -200, 260, H + 400, 'wall'); addSolid(W - 60, -200, 260, H + 400, 'wall'); addSolid(-200, H - 60, W + 400, 260, 'wall'); if (top) addSolid(-200, -200, W + 400, 200 + top, 'wall'); }
  function enemy(type, x, y, o) {
    o = o || {}; const R = { fish: 20, piranha: 20, crab: 20, jelly: 22, puffer: 22, urchin: 20, inkpus: 22, lantern: 22, eel: 34, bigfish: 46, barracuda: 40 };
    const e = { type, x, y, hx: x, hy: y, r: R[type], range: o.range || 120, spd: o.spd || 1, face: 1, vx: 0, vy: 0, t: Math.random() * 10, seed: (Math.random() * 10) | 0, knocked: false, kt: 0, spin: 0, inflate: 0,
      invuln: type === 'urchin' || type === 'eel' || type === 'bigfish' || type === 'barracuda', chase: type === 'piranha' || type === 'lantern', mode: 'idle', mt: Math.random() * 2, groundY: o.groundY };
    X.enemies.push(e); return e;
  }
  function popup(x, y, text, col) { X.fx.push({ x, y, text, col: col || '#fff', t: 0 }); }
  function part(x, y, type, n) { for (let i = 0; i < (n || 1); i++) { if (X.parts.length > 260) X.parts.shift(); const a = Math.random() * TAU, s = 40 + Math.random() * 150; X.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - (type === 'bubble' ? 60 : 0), life: type === 'bubble' ? 1.3 : 0.8, max: type === 'bubble' ? 1.3 : 0.8, type, r: 2 + Math.random() * 4 }); } }
  function quickTask(maxLevel) {
    // kurze Zahlenaufgabe mit 3 Antwortmöglichkeiten (für Rechentore)
    for (let k = 0; k < 60; k++) {
      const G = MathGen._gens; const g = [() => G.add(100), () => G.sub(100), G.times, () => G.add(1000), () => G.sub(1000), () => G.bracketsEval(4)][Math.floor(Math.random() * Math.min(6, maxLevel + 2))];
      const t = g(); if (typeof t.answer !== 'number') continue;
      const pr = t.prompt.replace(/^.*\n/, '').replace(' = ?', ''); if (pr.length > 22) continue;
      const opts = new Set([t.answer]); const ds = [10, -10, 1, -1, 2, -2, 9, 11, -9, -11, 100, -100].sort(() => Math.random() - 0.5);
      for (const dd of ds) { if (opts.size >= 3) break; if (t.answer + dd >= 0) opts.add(t.answer + dd); }
      return { q: pr, answer: t.answer, opts: [...opts].sort(() => Math.random() - 0.5), label: t.label };
    }
    return { q: '25 + 17', answer: 42, opts: [42, 32, 43], label: 'Addition' };
  }

  /* ================= Aufbau der Expeditionen ================= */
  const BUILD = {
    haijagd() {
      const W = 9800, H = 900, CEIL = 40, FLOOR = 860, r = rng(11); X.W = W; X.H = H; walls(W, H, 40);
      X.cam = { x: 0, y: 90 }; X.d.x = 420; X.d.y = 450; X.cp = { x: 420, y: 450 };
      let x = 900; X.gates = []; let gi = 0;
      while (x < W - 900) {
        if ((x > 1400 + gi * 1300) && gi < 6) {
          const g = { x, w: 110, task: null, passed: false, ok: null, holes: [] }; const gap = 150, wallH = (FLOOR - CEIL - 3 * gap) / 4;
          let y = CEIL; for (let i = 0; i < 3; i++) { addSolid(x, y - 10, g.w, wallH + 10, 'rock'); y += wallH; g.holes.push({ y0: y, y1: y + gap }); y += gap; } addSolid(x, y, g.w, FLOOR - y + 60, 'rock');
          X.gates.push(g); gi++; x += 520; continue;
        }
        const w = 120 + r() * 60, t = r(), gap = 250 + r() * 60;
        if (t < 0.45) { const gc = CEIL + 120 + gap / 2 + r() * (FLOOR - CEIL - 240 - gap); addSolid(x, -20, w, gc - gap / 2 + 20, 'rock', { ceil: true }); addSolid(x, gc + gap / 2, w, FLOOR - gc - gap / 2 + 60, 'rock'); X.shells.push({ x: x + w / 2, y: gc, got: false }); }
        else if (t < 0.75) { const h = 260 + r() * 260; addSolid(x, FLOOR - h, w, h + 60, 'rock'); if (r() < 0.6) enemy('urchin', x + w / 2, FLOOR - h - 20); X.shells.push({ x: x + w / 2, y: FLOOR - h - 110, got: false }); }
        else { const h = 260 + r() * 260; addSolid(x, -20, w, h + 20 + CEIL, 'rock', { ceil: true }); X.shells.push({ x: x + w / 2, y: CEIL + h + 70, got: false }); }
        if (r() < 0.6) enemy(['fish', 'puffer', 'jelly'][Math.floor(r() * 3)], x + w + 160, CEIL + 150 + r() * (FLOOR - CEIL - 300), { range: 70 });
        if (r() < 0.25) X.rockSpawns.push({ x: x + w + 120 + r() * 80, every: 2.4 + r(), t: r() * 2 });
        x += w + 300 + r() * 120;
      }
      X.goal = { x: W - 380, y: 450 }; X.cave = { x: W - 520 };
      addSolid(W - 520, -20, 140, 330, 'rock', { ceil: true }); addSolid(W - 520, 590, 140, 330, 'rock');
      X.shark = { off: 0, offT: 0, mouth: 0 }; X.scroll = 200; X.gatesRight = 0; X.autoscroll = true;
    },
    riff() {
      const W = 4300, H = 2500, TOP = 140, r = rng(23); X.W = W; X.H = H; walls(W, H, TOP); X.solids[X.solids.length - 1].kind = 'surface';
      X.d.x = 330; X.d.y = 300; X.cp = { x: 330, y: 300 }; X.boat = { x: 300, y: TOP + 10 };
      const cw = 610, ch = 560, cols = 7, rows = 4, oy = 220; const cells = [];
      for (let cy = 0; cy < rows; cy++) for (let cx = 0; cx < cols; cx++) if (cx + cy > 0) cells.push({ cx, cy, x: 40 + cx * cw, y: oy + cy * ch });
      cells.sort(() => r() - 0.5);
      const secret = cells.slice(0, 3), normal = cells.slice(3);
      X.chests = []; X.creatures = []; X.cracks = [];
      secret.forEach((c, i) => {
        const px = c.x + cw / 2 - 130, py = c.y + ch / 2 - 100, pw = 260, ph = 200, T = 34; const side = Math.floor(r() * 4);
        const segs = [[px - T, py - T, pw + 2 * T, T], [px - T, py + ph, pw + 2 * T, T], [px - T, py, T, ph], [px + pw, py, T, ph]];
        segs.forEach((sg, k) => { if (k === side) X.cracks.push(addSolid(sg[0], sg[1], sg[2], sg[3], 'crack', { hp: 2 })); else addSolid(sg[0], sg[1], sg[2], sg[3], 'rock'); });
        X.chests.push({ x: px + pw / 2, y: py + ph - 26, open: false, secret: true });
      });
      normal.forEach((c, i) => {
        const nb = 1 + Math.floor(r() * 2); const blobs = [];
        for (let k = 0; k < nb; k++) { const w = 130 + r() * 150, h = 110 + r() * 130, x = c.x + 130 + r() * (cw - 260 - w), y = c.y + 120 + r() * (ch - 240 - h); blobs.push(addSolid(x, y, w, h, 'rock')); }
        if (i < 7) { const b = blobs[0]; X.chests.push({ x: b.x + b.w / 2, y: b.y - 26, open: false, secret: false }); }
        else if (X.creatures.length < 12) X.creatures.push({ id: CREATURES[X.creatures.length].id, x: c.x + 60, y: c.y + 60, found: false, ph: r() * 6 });
        if (r() < 0.35) X.grass.push({ x: c.x + 20, y: c.y + ch - 150, w: 220, h: 150 });
        if (r() < 0.5) X.shells.push({ x: c.x + cw - 70, y: c.y + ch - 70, got: false });
      });
      for (let i = X.creatures.length; i < 12; i++) { const c = cells[(i * 5) % cells.length]; X.creatures.push({ id: CREATURES[i].id, x: c.x + cw - 70, y: c.y + 70, found: false, ph: r() * 6 }); }
      [[900, 900], [2300, 1500], [3500, 700], [1500, 2100], [3000, 2200], [600, 1700]].forEach(([x, y], i) => enemy(i < 2 ? 'piranha' : ['jelly', 'puffer', 'crab', 'fish'][i % 4], x, y, { range: 90 }));
      X.lexicon = (Save.data.expeditions.lexicon || []).slice();
    },
    tauchgang() {
      const W = 1500, H = 6400, r = rng(37); X.W = W; X.H = H; walls(W, H, 0);
      X.d.x = W / 2; X.d.y = 220; X.cp = { x: W / 2, y: 220 }; X.oxygen = 100; X.stations = []; X.vents = [];
      const lw = W * 0.62; let k = 0;
      for (let y = 650; y < H - 400; y += 520, k++) {
        const left = k % 2 === 0; const lx = left ? 60 : W - 60 - lw; addSolid(lx, y, lw, 60, 'rock');
        const vx = left ? lx + 120 + r() * (lw - 240) : lx + 120 + r() * (lw - 240); X.vents.push({ x: vx, y, t: r() });
        const openX = left ? 60 + lw + (W - 120 - lw) / 2 : 60 + (W - 120 - lw) / 2;
        if (r() < 0.5) { const bx = left ? lx + 60 : lx + lw - 260; addSolid(bx, y - 140, 200, 40, 'rock'); }
        const depth = y / H;
        const pool = depth < 0.3 ? ['jelly', 'fish'] : depth < 0.6 ? ['jelly', 'lantern', 'barracuda'] : ['lantern', 'eel', 'barracuda'];
        enemy(pool[k % pool.length], left ? W * 0.35 : W * 0.65, y + 260, { range: 160 });
        if ([3, 6, 9].includes(k)) X.stations.push({ x: openX, y: y + 280, used: false });
      }
      X.goal = { x: W / 2, y: H - 140 }; X.darkFrom = 900; X.firstTry = 0;
    },
    vulkan() {
      const W = 1500, H = 5600, r = rng(53); X.W = W; X.H = H; walls(W, H, 0);
      X.d.x = W / 2; X.d.y = H - 220; X.cp = { x: W / 2, y: H - 220 }; X.lava = { y: H + 150, v: 34 }; X.cps = []; X.boulders = []; X.locks = []; X.pairs = [];
      const lw = W * 0.6; let k = 0;
      for (let y = H - 620; y > 450; y -= 560, k++) {
        const left = k % 2 === 0; const lx = left ? 60 : W - 60 - lw; addSolid(lx, y, lw, 60, 'rock');
        const gx = left ? 60 + lw : 60, gw = W - 120 - lw;
        if (k === 1 || k === 5) X.boulders.push(addSolid(gx, y - 10, gw, 80, 'boulder', { boulder: true }));
        else if (k === 3 || k === 7) X.locks.push(addSolid(gx, y, gw, 60, 'gate', { lock: true, open: false }));
        else if (k === 4) { const g = addSolid(gx, y, gw, 60, 'gate', { timed: true, open: false }); X.pairs.push({ gate: g, sw: [{ x: 160, y: y + 250, t: 0 }, { x: W - 160, y: y + 250, t: 0 }] }); }
        if (k % 2 === 1) X.cps.push({ x: W / 2, y: y - 120, active: false });
        if (r() < 0.7) enemy(['fish', 'puffer', 'piranha'][k % 3], W / 2, y + 260, { range: 200 });
        X.shells.push({ x: left ? lx + lw - 80 : lx + 80, y: y - 60, got: false });
      }
      X.rockSpawns.push({ x: -1, every: 2.6, t: 0 }); X.goal = { x: W / 2, y: 260 }; X.lavaHits = 0;
    },
    rettung() {
      const W = 7400, H = 900, CEIL = 40, FLOOR = 860, r = rng(71); X.W = W; X.H = H; walls(W, H, 40);
      X.d.x = 260; X.d.y = 450; X.cp = { x: 260, y: 450 }; X.nets = []; X.mistakes = 0;
      const animals = ['schildkroete', 'seepferdchen', 'oktopus', 'clownfisch', 'kugelfisch', 'einsiedler'];
      for (let i = 0; i < 6; i++) {
        const x = 700 + i * 560, y = 260 + r() * 360; const n = { x, y, w: 170, h: 150, animal: animals[i], knots: [{ dx: -85, dy: -75 }, { dx: 85, dy: -75 }, { dx: 0, dy: 75 }].map(k => ({ x: x + k.dx, y: y + k.dy, ok: false })), free: false, fy: 0 };
        X.nets.push(n);
        if (i < 5) { const px = x + 280, h = 200 + r() * 200; if (r() < 0.5) addSolid(px, FLOOR - h, 110, h + 60, 'rock'); else addSolid(px, -20, 110, h + 60, 'rock', { ceil: true }); }
        enemy(['crab', 'fish', 'jelly'][i % 3], x + 280, i % 3 === 0 ? FLOOR - 22 : 200 + r() * 500, { range: 60, groundY: FLOOR });
      }
      X.cps = [{ x: 4200, y: 450, active: false }];
      X.tilda = { x: 4400, y: FLOOR - 70, vx: 0, vy: 0, hp: 3, inv: 0, active: false, hits: 0, wait: 0, hx: 4400, hy: FLOOR - 70 };
      for (let i = 0; i < 9; i++) { const x = 4800 + i * 260; if (i % 2) enemy('crab', x, FLOOR - 22, { range: 90, groundY: FLOOR }); else enemy('piranha', x, 250 + r() * 400, { range: 80 }); }
      for (let i = 0; i < 4; i++) addSolid(4900 + i * 560, FLOOR - 90, 140, 150, 'rock');
      X.beach = W - 420; X.freed = 0;
    }
  };

  /* ================= Ablauf ================= */
  const Expedition = {
    DEFS, CREATURES, hooks: {}, active: false, paused: false,
    get X() { return X; },
    start(id) {
      const def = DEFS.find(d => d.id === id); const theme = WORLDS[def.theme - 1].theme;
      X = { def, id, theme, solids: [], enemies: [], shells: [], grass: [], currents: [], rockSpawns: [], rocks: [], parts: [], fx: [], cps: [], hearts: 3, maxHearts: 3, hits: 0, deaths: 0, t: 0, time: 0, state: 'title', st: 0, score: 0, shellsGot: 0, coins: 0,
        d: { x: 0, y: 0, vx: 0, vy: 0, facing: 1, angle: 0, slapT: -1, slapCd: 0, slapDone: false, dashT: 0, dashCd: 0, invuln: 0, t: 0, trail: [], hidden: false, boostT: 0, slowT: 0, comp: { x: 0, y: 0 } }, cam: { x: 0, y: 0 } };
      BUILD[id]();
      X.d.comp.x = X.d.x - 80; X.d.comp.y = X.d.y;
      if (!X.autoscroll) { X.cam.x = clamp(X.d.x - VW / 2, 0, X.W - VW); X.cam.y = clamp(X.d.y - VH / 2, 0, X.H - VH); }
      X.bg = Art.buildBackground(theme, 1080);
      X.cos = Save.cosmetics(); X.lamp = X.cos.head === 'helmlampe';
      this.active = true; this.paused = false; Sound.forWorld(def.track);
    },
    stop() { this.active = false; X = null; },
    resume() { if (X && X.state === 'modal') { X.state = 'play'; X.st = 0; } },
    update(dt, ev) {
      if (!X || this.paused) return;
      X.t += dt; X.st += dt; const d = X.d; d.t += dt;
      if (X.state === 'title' && X.st > 1.8) { X.state = 'play'; X.st = 0; }
      const play = X.state === 'play' || X.state === 'title';
      if (X.state === 'play') X.time += dt;
      if (X.state === 'modal') { updateFx(dt); return; }
      if (play) controlDolphin(dt, ev || {});
      if (X.state === 'dead' && X.st > 1.0) respawn();
      if (X.state === 'won' && X.st > 1.6 && !X.reported) { X.reported = true; this.hooks.finish && this.hooks.finish(result()); }
      updateEnemies(dt, X.state === 'play');
      updateRocks(dt, X.state === 'play');
      SPECIAL[X.id] && SPECIAL[X.id](dt, X.state === 'play');
      updatePickups(dt);
      updateFx(dt);
      updateCamera(dt);
    },
    render(ctx) { if (X) render(ctx); }
  };

  /* ================= Steuerung ================= */
  function solidsNear(x, y, rad) { return X.solids.filter(s => !s.gone && !(s.open && (s.lock || s.timed)) && s.x < x + rad && s.x + s.w > x - rad && s.y < y + rad && s.y + s.h > y - rad); }
  function controlDolphin(dt, ev) {
    const d = X.d, I = Input; let ix = (I.right ? 1 : 0) - (I.left ? 1 : 0), iy = (I.down ? 1 : 0) - (I.up ? 1 : 0); const l = Math.hypot(ix, iy); if (l) { ix /= l; iy /= l; }
    const maxv = MAXV * (d.boostT > 0 ? 1.4 : 1) * (d.slowT > 0 ? 0.6 : 1); d.boostT -= dt; d.slowT -= dt;
    d.vx += ix * ACC * dt; d.vy += iy * ACC * dt; const drag = l ? 1.4 : 5.5; d.vx *= Math.exp(-drag * dt); d.vy *= Math.exp(-drag * dt);
    if (d.dashT > 0) d.dashT -= dt; else { const sp = Math.hypot(d.vx, d.vy); if (sp > maxv) { d.vx *= maxv / sp; d.vy *= maxv / sp; } }
    if (ix) d.facing = ix > 0 ? 1 : -1;
    d.dashCd -= dt; d.invuln -= dt;
    if (ev.dash && d.dashCd <= 0) { const dx = l ? ix : d.facing, dy = l ? iy : 0; d.vx = dx * 860; d.vy = dy * 860; d.dashT = 0.22; d.dashCd = DASH_CD; d.invuln = Math.max(d.invuln, 0.35); Sound.sfx('swim'); part(d.x - d.facing * 40, d.y, 'bubble', 8); }
    // Bewegung mit Kollision
    const list = solidsNear(d.x, d.y, 450);
    d.x += d.vx * dt; for (const s of list) if (ov(d.x - HW, d.y - HH, HW * 2, HH * 2, s)) { if (d.vx > 0) d.x = s.x - HW - 0.01; else if (d.vx < 0) d.x = s.x + s.w + HW + 0.01; d.vx *= -0.15; }
    d.y += d.vy * dt; for (const s of list) if (ov(d.x - HW, d.y - HH, HW * 2, HH * 2, s)) { if (d.vy > 0) d.y = s.y - HH - 0.01; else if (d.vy < 0) d.y = s.y + s.h + HH + 0.01; d.vy *= -0.15; }
    for (const s of list) if (ov(d.x - HW, d.y - HH, HW * 2, HH * 2, s)) { const pl = d.x + HW - s.x, pr = s.x + s.w - (d.x - HW), pu = d.y + HH - s.y, pd = s.y + s.h - (d.y - HH); const m = Math.min(pl, pr, pu, pd); if (m === pl) d.x -= pl; else if (m === pr) d.x += pr; else if (m === pu) d.y -= pu; else d.y += pd; }
    if (X.autoscroll) { const minX = X.cam.x + 40; if (d.x < minX) { d.x = minX; if (d.vx < 0) d.vx = 0; } d.x = Math.min(d.x, X.cam.x + VW - 40); }
    d.x = clamp(d.x, HW, X.W - HW); d.y = clamp(d.y, HH, X.H - HH);
    const sp = Math.hypot(d.vx, d.vy);
    d.angle += ((clamp(d.vy / MAXV, -1, 1) * 0.5 * (sp > 30 ? 1 : 0)) - d.angle) * Math.min(1, dt * 8);
    if (sp > 220 && Math.random() < dt * 8) part(d.x - d.facing * 50, d.y, 'bubble');
    d.hidden = sp < 230 && X.grass.some(g => d.x > g.x && d.x < g.x + g.w && d.y > g.y && d.y < g.y + g.h);
    // Flossenschlag
    d.slapCd -= dt;
    if (ev.action && d.slapCd <= 0) { d.slapT = 0; d.slapCd = SLAP_CD; d.slapDone = false; Sound.sfx('slap'); }
    if (d.slapT >= 0) { d.slapT += dt; if (!d.slapDone && d.slapT > SLAP_DUR * 0.45) { d.slapDone = true; slap(); } if (d.slapT > SLAP_DUR) d.slapT = -1; }
    // Spur + Begleiter
    d.trail.push({ x: d.x - d.facing * 50, y: d.y }); if (d.trail.length > 24) d.trail.shift();
    d.comp.x += (d.x - d.facing * 85 - d.comp.x) * Math.min(1, dt * 3.5); d.comp.y += (d.y + 30 - d.comp.y) * Math.min(1, dt * 3.5);
  }
  function slap() {
    const d = X.d, hx = d.x + d.facing * 48, hy = d.y, hr = 74;
    X.fx.push({ ring: true, x: hx, y: hy, t: 0 }); part(hx, hy, 'bubble', 6);
    for (const e of X.enemies) { if (e.knocked) continue; if (Math.hypot(e.x - hx, e.y - hy) < hr + e.r * 0.8) {
      if (e.invuln) { if (e.type !== 'urchin') { popup(e.x, e.y - 40, 'Klonk!', '#ffd23a'); Sound.sfx('klonk'); d.vx -= d.facing * 260; } continue; }
      e.knocked = true; e.kt = 0; const dir = Math.sign(e.x - d.x) || d.facing; e.vx = dir * 720; e.vy = -200; X.score += 20; Sound.sfx('knock'); popup(e.x, e.y - 30, '+20'); part(e.x, e.y, 'star', 4); } }
    for (const s of X.solids) {
      if (s.gone) continue; const near = Math.abs(s.x + s.w / 2 - hx) < s.w / 2 + hr * 0.7 && Math.abs(s.y + s.h / 2 - hy) < s.h / 2 + hr * 0.7;
      if (!near) continue;
      if (s.kind === 'crack') { s.hp--; Sound.sfx('klonk'); part(hx, hy, 'spark', 6); if (s.hp <= 0) { s.gone = true; Sound.sfx('gate'); popup(s.x + s.w / 2, s.y, 'Geheimgang!', '#ffe08a'); part(s.x + s.w / 2, s.y + s.h / 2, 'star', 12); } else popup(s.x + s.w / 2, s.y, 'Noch einmal!', '#fff'); }
      if (s.boulder) { s.gone = true; s.fall = { x: s.x, y: s.y, vy: 0, rot: 0 }; X.rolling = X.rolling || []; X.rolling.push(s); Sound.sfx('gate'); popup(s.x + s.w / 2, s.y - 20, 'Weggeschoben!', '#ffe08a'); }
    }
    if (X.nets) for (const n of X.nets) for (const k of n.knots) if (!k.ok && !n.free && Math.hypot(k.x - hx, k.y - hy) < hr + 16) { knotTask(n, k); return; }
    if (X.pairs) for (const p of X.pairs) if (!p.gate.open) for (const s of p.sw) if (Math.hypot(s.x - hx, s.y - 20 - hy) < hr + 40) { s.t = 6; Sound.sfx('switch'); popup(s.x, s.y - 70, '6 Sekunden!', '#5affb0'); }
  }

  /* ================= Mathe-Aufgaben (Spiel pausiert, kein Zeitdruck) ================= */
  function ask(task, done) {
    X.state = 'modal'; X.st = 0; Input.left = Input.right = Input.up = Input.down = false;
    Expedition.hooks.math(task, firstTry => { done(firstTry); if (X && X.state === 'modal') { X.state = 'play'; X.st = 0; } });
  }
  function knotTask(n, k) {
    ask(MathGen.generate(1 + Math.floor(Math.random() * 3)), first => {
      if (!first) X.mistakes++; k.ok = true; Sound.sfx('switch'); part(k.x, k.y, 'spark', 8);
      if (n.knots.every(q => q.ok)) { n.free = true; X.freed++; X.score += 150; Sound.sfx('pearl'); popup(n.x, n.y - 100, 'Befreit! Danke!', '#7affb0'); part(n.x, n.y, 'star', 16); }
    });
  }

  /* ================= Expeditionsspezifische Regeln ================= */
  const SPECIAL = {
    haijagd(dt, play) {
      const d = X.d, sh = X.shark; sh.offT -= dt; if (sh.offT <= 0) sh.off += (0 - sh.off) * Math.min(1, dt * 1.5);
      const next = X.gates.find(g => !g.passed); const prog = clamp(X.cam.x / (X.W - VW), 0, 1);
      let v = 200 + prog * 60; if (next && next.x - d.x < 950 && next.x - d.x > -40) v = 120;
      if (play) X.cam.x = Math.min(X.W - VW, X.cam.x + v * dt);
      if (next && !next.task && next.x - X.cam.x < VW + 500) next.task = quickTask(Math.min(4, X.gates.indexOf(next) + 1));
      if (next && next.task && play && d.x > next.x + next.w / 2) {
        next.passed = true; const hole = next.holes.findIndex(h => d.y > h.y0 - 20 && d.y < h.y1 + 20); const val = next.task.opts[hole];
        next.ok = val === next.task.answer;
        if (next.ok) { X.gatesRight++; X.score += 100; d.boostT = 3; sh.off = -170; sh.offT = 4; Sound.sfx('correct'); popup(d.x, d.y - 60, 'Richtig! Turbo!', '#7affb0'); }
        else { d.slowT = 2; sh.off = 90; sh.offT = 3; Sound.sfx('wrong'); popup(d.x, d.y - 60, 'Falsch! ' + next.task.q + ' = ' + next.task.answer, '#ff9aa6'); }
      }
      sh.mouth = (Math.sin(X.t * 4) + 1) / 2;
      const biteX = X.cam.x + 150 + sh.off;
      if (play && d.x - HW < biteX && d.invuln <= 0) { damage(d.x - 100, d.y, 'Bruno schnappt zu!'); d.x = Math.max(d.x, X.cam.x + 420); d.invuln = 2; }
      if (play && d.x > X.W - 420) win();
    },
    riff(dt, play) {
      const d = X.d;
      for (const c of X.chests) if (!c.open && play && Math.hypot(c.x - d.x, c.y - d.y) < 60) {
        c.open = true; ask(Object.assign(MathGen.generate(2 + Math.floor(Math.random() * 4)), {}), first => { X.chestsFound = (X.chestsFound || 0) + 1; const bonus = first ? 80 : 30; X.coins += bonus; X.score += first ? 200 : 80; Sound.sfx('chest'); popup(c.x, c.y - 70, (c.secret ? 'Geheimschatz! ' : 'Schatz! ') + '+' + bonus + ' Coins', '#ffe08a'); part(c.x, c.y - 30, 'star', 14); });
      }
      for (const c of X.creatures) if (!c.found && play && Math.hypot(c.x - d.x, c.y - d.y) < 75) {
        c.found = true; const info = CREATURES.find(q => q.id === c.id); if (!X.lexicon.includes(c.id)) X.lexicon.push(c.id);
        X.score += 50; Sound.sfx('pearl'); X.state = 'modal'; Expedition.hooks.fact(info, X.lexicon.length, () => { if (X) { X.state = 'play'; X.st = 0; } });
      }
      const found = X.chestsFound || 0;
      if (play && Math.hypot(d.x - X.boat.x, d.y - (X.boat.y + 60)) < 110) {
        if (found >= 3 && !X.askedBoat) { X.askedBoat = true; X.state = 'modal'; Expedition.hooks.confirm(`Zurück ins Boot? Du hast ${found} von 10 Schätzen und ${X.creatures.filter(c => c.found).length} von 12 Meerestieren gefunden.`, 'Expedition beenden', 'Weiter erkunden', yes => { if (!X) return; X.state = 'play'; if (yes) win(); }); }
      } else if (Math.hypot(d.x - X.boat.x, d.y - X.boat.y) > 260) X.askedBoat = false;
      if (play && found >= 10 && X.creatures.every(c => c.found) && !X.allDone) { X.allDone = true; Expedition.hooks.toast && Expedition.hooks.toast('🏆 Alles gefunden! Schwimm zurück zum Boot.'); }
    },
    tauchgang(dt, play) {
      const d = X.d;
      if (play) { X.oxygen -= dt * 1.6; if (X.oxygen <= 0) { X.oxygen = 60; damage(d.x, d.y + 40, 'Keine Luft mehr!'); } }
      if (X.oxygen < 25 && Math.floor(X.t * 2) % 2 === 0 && !X.lowWarn) { X.lowWarn = true; Sound.sfx('wrong'); } if (X.oxygen > 30) X.lowWarn = false;
      for (const v of X.vents) { v.t -= dt; if (v.t <= 0) { v.t = 0.9; X.bubbles = X.bubbles || []; X.bubbles.push({ x: v.x + (Math.random() - 0.5) * 20, y: v.y - 10, r: 9 + Math.random() * 6 }); } }
      if (X.bubbles) for (let i = X.bubbles.length - 1; i >= 0; i--) { const b = X.bubbles[i]; b.y -= 85 * dt; b.x += Math.sin(X.t * 3 + i) * 0.4; if (play && Math.hypot(b.x - d.x, b.y - d.y) < 34) { X.oxygen = Math.min(100, X.oxygen + 10); Sound.sfx('bubble'); X.bubbles.splice(i, 1); continue; } if (b.y < 0 || X.bubbles.length > 120 || solidsNear(b.x, b.y, 4).length) X.bubbles.splice(i, 1); }
      for (const s of X.stations) if (!s.used && play && Math.hypot(s.x - d.x, s.y - d.y) < 80) {
        s.used = true; X.cp = { x: s.x, y: s.y }; Sound.sfx('checkpoint');
        ask(MathGen.generate(5), first => { if (first) X.firstTry++; X.oxygen = first ? 100 : 75; Sound.sfx('pearl'); popup(s.x, s.y - 80, first ? 'Luft voll! (Checkpoint)' : 'Luft aufgefüllt! (Checkpoint)', '#bff4ff'); });
      }
      if (play && Math.hypot(d.x - X.goal.x, d.y - X.goal.y) < 80) win();
    },
    vulkan(dt, play) {
      const d = X.d, L = X.lava;
      if (play) { const climbed = clamp((X.H - d.y) / X.H, 0, 1); L.v = 34 + climbed * 34; L.y -= L.v * dt; }
      if (L.y > d.y + 900) L.y = d.y + 900; // Lava bleibt in Sichtweite
      if (play && d.y + HH > L.y && d.invuln <= 0) { X.lavaHits++; damage(d.x, L.y + 50, 'Heiß! Weg von der Lava!'); d.vy = -600; L.y = Math.min(X.H + 150, L.y + 380); }
      for (const c of X.cps) if (!c.active && d.y < c.y) { c.active = true; X.cp = { x: c.x, y: c.y }; Sound.sfx('checkpoint'); popup(c.x, c.y - 60, 'Checkpoint!', '#5affb0'); }
      for (const s of X.locks) if (!s.open && play && Math.abs(d.x - (s.x + s.w / 2)) < s.w / 2 + 40 && Math.abs(d.y - (s.y + s.h + 40)) < 70) {
        s.open = true; ask(MathGen.generate(6), first => { if (first) X.score += 150; Sound.sfx('gate'); popup(s.x + s.w / 2, s.y - 30, 'Lava-Schloss offen!', '#ffd23a'); });
      }
      for (const p of X.pairs) { p.sw.forEach(s => s.t -= dt); if (!p.gate.open && p.sw.every(s => s.t > 0)) { p.gate.open = true; Sound.sfx('gate'); popup(p.gate.x + p.gate.w / 2, p.gate.y - 30, 'Die Klappe ist offen!', '#ffd23a'); } }
      if (X.rolling) for (const s of X.rolling) { s.fall.vy += 900 * dt; s.fall.y += s.fall.vy * dt; s.fall.rot += dt * 5; }
      if (play && d.y < X.goal.y) win();
    },
    rettung(dt, play) {
      const d = X.d, T = X.tilda;
      for (const n of X.nets) if (n.free) { n.fy -= 60 * dt; }
      for (const c of X.cps) if (!c.active && d.x > c.x) { c.active = true; X.cp = { x: c.x, y: c.y }; Sound.sfx('checkpoint'); popup(c.x, c.y - 60, 'Checkpoint! Tilda wartet auf dich.', '#5affb0'); }
      const dist = Math.hypot(d.x - T.x, d.y - T.y);
      if (!T.active && dist < 220) { T.active = true; Sound.sfx('unlock'); popup(T.x, T.y - 60, 'Tilda: „Bringst du mich zum Strand?“', '#fff'); }
      if (T.active) {
        T.inv -= dt;
        if (dist < 330) { const tx = d.x - d.facing * 90, ty = d.y + 40; const dx = tx - T.x, dy = ty - T.y, l = Math.hypot(dx, dy) || 1; const sp = Math.min(175, l * 2); T.vx += (dx / l * sp - T.vx) * Math.min(1, dt * 3); T.vy += (dy / l * sp - T.vy) * Math.min(1, dt * 3); T.wait = 0; }
        else { T.vx *= 0.9; T.vy *= 0.9; T.wait += dt; if (T.wait > 3) { T.wait = 0; popup(T.x, T.y - 50, 'Warte auf mich!', '#fff'); } }
        T.x += T.vx * dt; T.y = clamp(T.y + T.vy * dt, 80, 820);
        for (const e of X.enemies) if (!e.knocked && !e.invuln && T.inv <= 0 && Math.hypot(e.x - T.x, e.y - T.y) < e.r + 22) { T.hp--; T.hits++; T.inv = 1.5; Sound.sfx('hit'); popup(T.x, T.y - 50, 'Aua!', '#ff9aa6'); if (T.hp <= 0) { popup(T.x, T.y - 80, 'Tilda ist erschöpft – zurück zum Checkpoint', '#fff'); X.state = 'dead'; X.st = 0; X.deaths++; } }
        if (T.x > X.beach) win();
      }
    }
  };

  function damage(fx, fy, text) {
    const d = X.d; if (d.invuln > 0 || X.state !== 'play') return;
    X.hearts--; X.hits++; d.invuln = 1.6; Sound.sfx('hit'); const a = Math.atan2(d.y - fy, d.x - fx); d.vx = Math.cos(a) * 420; d.vy = Math.sin(a) * 420; popup(d.x, d.y - 50, text || 'Autsch!', '#ff9aa6'); X.shake = 0.7;
    if (X.hearts <= 0) { X.deaths++; X.state = 'dead'; X.st = 0; }
  }
  function respawn() {
    const d = X.d; d.x = X.cp.x; d.y = X.cp.y; d.vx = d.vy = 0; d.invuln = 2; X.hearts = X.maxHearts; X.state = 'play'; X.st = 0;
    if (X.id === 'haijagd') { d.x = X.cam.x + 420; d.y = 450; }
    if (X.id === 'vulkan') X.lava.y = Math.max(X.lava.y, X.cp.y + 800);
    if (X.id === 'tauchgang') X.oxygen = 100;
    if (X.id === 'rettung' && X.tilda.active) { const T = X.tilda; T.x = X.cp.x + 140; T.y = 760; T.hp = 3; T.vx = T.vy = 0; d.x = X.cp.x; d.y = X.cp.y; }
    X.enemies.forEach(e => { if (!e.knocked && Math.hypot(e.x - d.x, e.y - d.y) < 300) { e.x = e.hx; e.y = e.hy; e.mode = 'idle'; } });
    popup(d.x, d.y - 60, 'Weiter geht’s!', '#fff');
  }
  function win() { if (X.state === 'won') return; X.state = 'won'; X.st = 0; Sound.sfx('bossDefeat'); part(X.d.x, X.d.y, 'star', 30); }
  function result() {
    const id = X.id; let medal = 1; const lines = [['Zeit', fmtTime(X.time)], ['Treffer', X.hits]];
    if (id === 'haijagd') { medal = X.gatesRight >= 6 && X.hits <= 1 ? 3 : X.gatesRight >= 4 ? 2 : 1; lines.unshift(['Rechentore richtig', X.gatesRight + ' / 6']); }
    if (id === 'riff') { const c = X.chestsFound || 0, n = X.creatures.filter(q => q.found).length; medal = c >= 10 && n >= 12 ? 3 : c >= 8 ? 2 : 1; lines.unshift(['Schätze', c + ' / 10'], ['Meerestiere entdeckt', n + ' / 12']); }
    if (id === 'tauchgang') { medal = X.hits === 0 && X.firstTry === X.stations.length ? 3 : X.hits <= 2 ? 2 : 1; lines.unshift(['Luftstationen beim 1. Versuch', X.firstTry + ' / ' + X.stations.length]); }
    if (id === 'vulkan') { medal = X.hits <= 1 ? 3 : X.hits <= 3 ? 2 : 1; lines.unshift(['Lava-Berührungen', X.lavaHits]); }
    if (id === 'rettung') { medal = X.mistakes <= 1 && X.tilda.hits === 0 ? 3 : X.mistakes <= 4 && X.tilda.hits <= 1 ? 2 : 1; lines.unshift(['Tiere befreit', X.freed + ' / 6'], ['Rechenfehler', X.mistakes], ['Tilda getroffen', X.tilda.hits]); }
    return { id, medal, lines, coins: 150 + medal * 100 + X.coins, score: X.score, lexicon: X.lexicon || null, shells: X.shellsGot };
  }
  const fmtTime = s => { s = Math.floor(s); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };

  /* ================= Gegner, Steinschlag, Sammeln ================= */
  function target(e) {
    const d = X.d; let tx = d.x, ty = d.y, valid = !d.hidden;
    if (X.tilda && X.tilda.active && (e.type === 'piranha' || e.type === 'crab')) { const T = X.tilda; if (Math.hypot(T.x - e.x, T.y - e.y) < Math.hypot(d.x - e.x, d.y - e.y)) { tx = T.x; ty = T.y; valid = true; } }
    return { tx, ty, valid };
  }
  function updateEnemies(dt, play) {
    const d = X.d;
    for (let i = X.enemies.length - 1; i >= 0; i--) {
      const e = X.enemies[i]; e.t += dt; if (Math.abs(e.x - d.x) > 1500 || Math.abs(e.y - d.y) > 1100) continue;
      if (e.knocked) { e.kt += dt; e.x += e.vx * dt; e.y += e.vy * dt; e.vx *= 0.985; e.spin += dt * 14; if (e.kt > 1.2) X.enemies.splice(i, 1); continue; }
      const t = e.t * e.spd;
      if (e.type === 'barracuda') {
        e.mt -= dt; const dist = Math.hypot(d.x - e.x, d.y - e.y);
        if (e.mode === 'idle') { e.x = e.hx + Math.sin(t * 0.8) * e.range; e.face = Math.cos(t * 0.8) > 0 ? 1 : -1; if (dist < 420 && !d.hidden && e.mt <= 0) { e.mode = 'warn'; e.mt = 0.9; e.face = d.x > e.x ? 1 : -1; } }
        else if (e.mode === 'warn') { if (e.mt <= 0) { e.mode = 'lunge'; e.mt = 0.55; const l = dist || 1; e.vx = (d.x - e.x) / l * 720; e.vy = (d.y - e.y) / l * 720; } }
        else if (e.mode === 'lunge') { e.x += e.vx * dt; e.y += e.vy * dt; if (e.mt <= 0 || solidsNear(e.x, e.y, 30).length) { e.mode = 'rest'; e.mt = 1.6; } }
        else if (e.mode === 'rest') { e.x += (e.hx - e.x) * dt * 0.8; e.y += (e.hy - e.y) * dt * 0.8; if (e.mt <= 0) { e.mode = 'idle'; e.mt = 0.6; } }
      } else if (e.type === 'jelly') { e.y = e.hy + Math.sin(t * 1.3) * Math.min(e.range, 140); e.x = e.hx + Math.sin(t * 0.5) * 24; }
      else if (e.type === 'crab') { const nx = e.hx + Math.sin(t * 1.2) * Math.min(e.range, 90); e.face = nx > e.x ? 1 : -1; e.x = nx; }
      else if (e.chase) {
        const tg = target(e), dist = Math.hypot(tg.tx - e.x, tg.ty - e.y);
        if (tg.valid && dist < 380 && play) { const sp = 160 * e.spd; e.vx += (tg.tx - e.x) / dist * sp * 3 * dt; e.vy += (tg.ty - e.y) / dist * sp * 3 * dt; const v = Math.hypot(e.vx, e.vy); if (v > sp) { e.vx *= sp / v; e.vy *= sp / v; } e.lost = false; }
        else { if (!e.lost && d.hidden && dist < 400) { e.lost = true; popup(e.x, e.y - 30, '?', '#fff'); } const tx = e.hx + Math.sin(t) * e.range, ty = e.hy + Math.sin(t * 1.6) * 20; e.vx += (tx - e.x) * dt * 2; e.vy += (ty - e.y) * dt * 2; e.vx *= Math.exp(-2 * dt); e.vy *= Math.exp(-2 * dt); }
        e.x += e.vx * dt; e.y += e.vy * dt; if (Math.abs(e.vx) > 5) e.face = e.vx > 0 ? 1 : -1;
      } else { const nx = e.hx + Math.sin(t * (e.invuln ? 0.6 : 1.1)) * e.range; e.face = nx > e.x ? 1 : -1; e.x = nx; e.y = e.hy + Math.sin(t * 1.7) * 14; if (e.type === 'puffer') { const near = Math.hypot(d.x - e.x, d.y - e.y) < 200; e.inflate += ((near ? 1 : 0) - e.inflate) * Math.min(1, dt * 5); } }
      if (play && d.invuln <= 0) { const k = e.type === 'urchin' ? 1.2 : e.type === 'barracuda' ? 0.7 : 0.85; if (Math.hypot(d.x - e.x, d.y - e.y) < e.r * k + 24) damage(e.x, e.y); }
    }
  }
  function groundBelow(x, y) { let g = X.H - 60; for (const s of X.solids) if (!s.gone && !(s.open && (s.lock || s.timed)) && x > s.x && x < s.x + s.w && s.y > y && s.y < g) g = s.y; return g; }
  function updateRocks(dt, play) {
    for (const sp of X.rockSpawns) {
      sp.t -= dt; if (sp.t > 0 || !play) continue; sp.t = sp.every;
      const x = sp.x < 0 ? X.cam.x + 120 + Math.random() * (VW - 240) : sp.x; if (Math.abs(x - X.d.x) > 900) continue;
      const y = X.cam.y - 40; X.rocks.push({ x, y, vy: 0, gy: groundBelow(x, y + 20), r: 18 + Math.random() * 10, rot: 0 });
    }
    for (let i = X.rocks.length - 1; i >= 0; i--) {
      const r = X.rocks[i]; r.vy = Math.min(520, r.vy + 600 * dt); r.y += r.vy * dt; r.rot += dt * 4;
      if (play && Math.hypot(r.x - X.d.x, r.y - X.d.y) < r.r + 22) { damage(r.x, r.y - 40, 'Steinschlag!'); X.rocks.splice(i, 1); continue; }
      if (r.y > r.gy - r.r) { part(r.x, r.gy - 6, 'spark', 8); X.rocks.splice(i, 1); }
    }
  }
  function updatePickups(dt) {
    const d = X.d;
    for (const s of X.shells) { if (s.got) continue; const dist = Math.hypot(s.x - d.x, s.y - d.y); if (dist < 90) { s.x += (d.x - s.x) * Math.min(1, dt * 7); s.y += (d.y - s.y) * Math.min(1, dt * 7); } if (dist < 36) { s.got = true; X.shellsGot++; X.score += 10; Sound.sfx('shell'); part(s.x, s.y, 'spark', 3); } }
  }
  function updateFx(dt) {
    for (let i = X.parts.length - 1; i >= 0; i--) { const p = X.parts[i]; p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.95; p.vy *= 0.95; if (p.type === 'bubble') p.vy -= 50 * dt; if (p.life <= 0) X.parts.splice(i, 1); }
    for (let i = X.fx.length - 1; i >= 0; i--) { X.fx[i].t += dt; if (X.fx[i].t > (X.fx[i].ring ? 0.4 : 1.4)) X.fx.splice(i, 1); }
    X.shake = Math.max(0, (X.shake || 0) - dt * 3);
  }
  function updateCamera(dt) {
    const d = X.d, c = X.cam, k = 1 - Math.exp(-dt * 5);
    if (!X.autoscroll) { const tx = clamp(d.x - VW / 2 + d.facing * 60, 0, X.W - VW); c.x += (tx - c.x) * k; }
    const ty = clamp(d.y - VH / 2, 0, X.H - VH); c.y += (ty - c.y) * k;
  }

  /* ================= Zeichnen ================= */
  function drawCreature(ctx, id, x, y, t, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s || 1, s || 1);
    const E = (type, extra) => Art.drawEnemy(ctx, Object.assign({ type, x: 0, y: 0, r: 22, face: 1, seed: 1, knocked: false }, extra || {}), t);
    switch (id) {
      case 'oktopus': E('inkpus'); break;
      case 'seepferdchen': Art.drawCompanion(ctx, 'begleiter-seepferdchen', 0, 0, t, 1); break;
      case 'schildkroete': Art.drawTurtle(ctx, 0, 0, t, 1); break;
      case 'kugelfisch': E('puffer', { inflate: (Math.sin(t) + 1) / 2 }); break;
      case 'qualle': E('jelly'); break;
      case 'muraene': ctx.scale(0.7, 0.7); E('eel', { r: 30 }); break;
      case 'delfin': Art.drawDolphin(ctx, { x: 0, y: 0, facing: 1, color: 'blau', t, scale: 0.5, speed: 0.4 }); break;
      case 'seestern': ctx.rotate(Math.sin(t) * 0.2); Art.star(ctx, 0, 0, 20, '#ff8a3a'); break;
      case 'clownfisch': { ctx.save(); ctx.translate(-16, 0); ctx.rotate(Math.sin(t * 10) * 0.3); ctx.beginPath(); ctx.moveTo(2, 0); ctx.lineTo(-10, -9); ctx.lineTo(-10, 9); ctx.closePath(); Art.fillS(ctx, '#ff7a1a', 2); ctx.restore();
        Art.ell(ctx, 0, 0, 20, 13); Art.fillS(ctx, '#ff7a1a', 2); ctx.save(); Art.ell(ctx, 0, 0, 20, 13); ctx.clip(); ctx.fillStyle = '#fff'; [-9, 3, 13].forEach(bx => { ctx.fillRect(bx - 3, -14, 6, 28); }); ctx.restore(); Art.ell(ctx, 0, 0, 20, 13); Art.stroke(ctx, 2);
        Art.ell(ctx, 10, -3, 3, 3.4); Art.fillS(ctx, '#fff', 1); Art.ell(ctx, 10.6, -3, 1.6, 2); ctx.fillStyle = '#111'; ctx.fill(); break; }
      case 'papageifisch': { ctx.save(); ctx.translate(-20, 0); ctx.rotate(Math.sin(t * 8) * 0.25); ctx.beginPath(); ctx.moveTo(2, 0); ctx.lineTo(-12, -11); ctx.lineTo(-12, 11); ctx.closePath(); Art.fillS(ctx, '#2ab8a8', 2); ctx.restore();
        Art.ell(ctx, 0, 0, 24, 14); const g = ctx.createLinearGradient(-24, 0, 24, 0); g.addColorStop(0, '#2ab8a8'); g.addColorStop(1, '#5ae86a'); Art.fillS(ctx, g, 2);
        ctx.beginPath(); ctx.moveTo(20, -4); ctx.quadraticCurveTo(30, 0, 21, 6); Art.fillS(ctx, '#f4f0d0', 1.5); [-8, 0, 8].forEach(bx => { ctx.beginPath(); ctx.arc(bx, 0, 6, -1, 1); Art.stroke(ctx, 1.2, 'rgba(255,120,200,0.8)'); });
        Art.ell(ctx, 12, -4, 3, 3.2); Art.fillS(ctx, '#fff', 1); Art.ell(ctx, 12.6, -4, 1.5, 1.8); ctx.fillStyle = '#111'; ctx.fill(); break; }
      case 'manta': { const fl = Math.sin(t * 2) * 6; ctx.beginPath(); ctx.moveTo(26, 0); ctx.quadraticCurveTo(0, -30 - fl, -26, -4); ctx.quadraticCurveTo(-14, 0, -26, 4); ctx.quadraticCurveTo(0, 30 + fl, 26, 0); Art.fillS(ctx, '#2a3a5a', 2); ctx.beginPath(); ctx.moveTo(-22, 0); ctx.lineTo(-44, 2); Art.stroke(ctx, 2.5, '#2a3a5a'); Art.ell(ctx, 2, 0, 12, 6); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fill(); Art.ell(ctx, 18, -5, 2, 2); ctx.fillStyle = '#fff'; ctx.fill(); break; }
      case 'einsiedler': { ctx.beginPath(); ctx.moveTo(-18, 10); ctx.quadraticCurveTo(-22, -20, 4, -16); ctx.quadraticCurveTo(14, -6, 6, 10); ctx.closePath(); Art.fillS(ctx, '#f0c89a', 2, '#8a5a2a'); ctx.beginPath(); ctx.arc(-6, -2, 7, 0, 5); Art.stroke(ctx, 1.5, '#8a5a2a');
        Art.ell(ctx, 12, 4, 7, 6); Art.fillS(ctx, '#ef4a35', 1.6, '#7a1a0a'); Art.ell(ctx, 20, -2, 5, 4); Art.fillS(ctx, '#ef4a35', 1.4, '#7a1a0a'); ctx.beginPath(); ctx.moveTo(12, -2); ctx.lineTo(13, -9); Art.stroke(ctx, 1.4, '#7a1a0a'); Art.ell(ctx, 13, -10, 2, 2); ctx.fillStyle = '#111'; ctx.fill(); break; }
    }
    ctx.restore();
  }
  function drawBruno(ctx, x, y, t, mouth) {
    ctx.save(); ctx.translate(x, y); ctx.scale(1.6, 1.6);
    ctx.save(); ctx.translate(-150, 0); ctx.rotate(Math.sin(t * 5) * 0.2); ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-40, -60); ctx.lineTo(-24, 0); ctx.lineTo(-40, 55); ctx.closePath(); Art.fillS(ctx, '#56687a', 4); ctx.restore();
    ctx.beginPath(); ctx.moveTo(-10, -58); ctx.lineTo(-30, -120); ctx.quadraticCurveTo(10, -80, 30, -55); Art.fillS(ctx, '#56687a', 4);
    ctx.beginPath(); ctx.moveTo(150, 8); ctx.bezierCurveTo(140, -60, 60, -70, -20, -62); ctx.bezierCurveTo(-100, -52, -140, -20, -150, 0); ctx.bezierCurveTo(-120, 38, -50, 62, 30, 60); ctx.bezierCurveTo(100, 56, 148, 38, 150, 8);
    const g = ctx.createLinearGradient(0, -70, 0, 60); g.addColorStop(0, '#5f7488'); g.addColorStop(1, '#8aa0b4'); Art.fillS(ctx, g, 4);
    ctx.save(); ctx.clip(); Art.ell(ctx, 40, 58, 120, 32); ctx.fillStyle = '#eef3f6'; ctx.fill(); ctx.restore();
    const mo = 10 + mouth * 26; ctx.beginPath(); ctx.moveTo(40, 14 - mo * 0.3); ctx.quadraticCurveTo(100, 30 + mo, 146, 12); ctx.quadraticCurveTo(100, 22, 40, 14 - mo * 0.3); Art.fillS(ctx, '#5a0a1a', 3);
    ctx.fillStyle = '#fff'; for (let i = 0; i < 8; i++) { const xx = 52 + i * 11; ctx.beginPath(); ctx.moveTo(xx, 15); ctx.lineTo(xx + 5, 26 + mouth * 6); ctx.lineTo(xx + 10, 15); ctx.fill(); }
    Art.ell(ctx, 92, -18, 11, 12); Art.fillS(ctx, '#fff', 3); Art.ell(ctx, 96, -16, 5, 6); ctx.fillStyle = '#111'; ctx.fill(); ctx.beginPath(); ctx.moveTo(76, -36); ctx.lineTo(108, -28); Art.stroke(ctx, 5);
    ctx.font = 'bold 22px Fredoka, sans-serif'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText('BRUNO', -40, 8);
    ctx.restore();
  }
  function render(ctx) {
    const c = X.cam, t = X.t, th = X.theme, d = X.d;
    const depth = clamp((c.y + VH / 2) / X.H, 0, 1);
    const g = ctx.createLinearGradient(0, 0, 0, VH);
    const top = X.id === 'tauchgang' ? mix('#46c6e8', '#020814', depth) : X.id === 'vulkan' ? mix('#5a2a2a', '#2a0a10', 1 - depth) : th.top;
    const bot = X.id === 'tauchgang' ? mix('#0a4a7a', '#010409', depth) : X.id === 'vulkan' ? mix('#3a1010', '#120408', 1 - depth) : th.bottom;
    g.addColorStop(0, top); g.addColorStop(1, bot); ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
    if (c.y < 900 && X.id !== 'vulkan') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 6; i++) { const bx = ((i * 260 - c.x * 0.15) % (VW + 300) + VW + 300) % (VW + 300) - 150; const gg = ctx.createLinearGradient(0, -c.y, 0, 700 - c.y); gg.addColorStop(0, `rgba(255,255,230,${0.18 * (1 - c.y / 900)})`); gg.addColorStop(1, 'rgba(255,255,230,0)'); ctx.fillStyle = gg; ctx.beginPath(); ctx.moveTo(bx, -c.y); ctx.lineTo(bx + 70, -c.y); ctx.lineTo(bx + 230, 700 - c.y); ctx.lineTo(bx + 90, 700 - c.y); ctx.fill(); } ctx.restore(); }
    const bgW = X.bg.W; ctx.globalAlpha = 0.55; let ox = -((c.x * 0.2) % bgW); if (ox > 0) ox -= bgW; const oy = -((c.y * 0.25) % 1080);
    for (let xx = ox; xx < VW; xx += bgW) for (let yy = oy; yy < VH; yy += 1080) ctx.drawImage(X.bg.far, xx, yy); ctx.globalAlpha = 1;
    ctx.save(); ctx.translate(Math.round(-c.x + (X.shake ? (Math.random() - 0.5) * 10 * X.shake : 0)), Math.round(-c.y));
    const vis = (x, y, w, h) => x + w > c.x - 60 && x < c.x + VW + 60 && y + h > c.y - 60 && y < c.y + VH + 60;
    // Seegras-Verstecke
    for (const gz of X.grass) if (vis(gz.x, gz.y, gz.w, gz.h)) for (let x = gz.x + 10; x < gz.x + gz.w; x += 16) { ctx.beginPath(); ctx.moveTo(x, gz.y + gz.h); for (let k = 1; k <= 6; k++) ctx.lineTo(x + Math.sin(t * 1.5 + x * 0.1 + k * 0.6) * k * 3, gz.y + gz.h - gz.h * k / 6); ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.strokeStyle = x % 32 ? '#2e9a4a' : '#3ab85a'; ctx.stroke(); }
    // Festkörper
    for (const s of X.solids) {
      if (s.gone && !s.fall) continue; if (!vis(s.x, s.y, s.w, s.h) && !s.fall) continue;
      if (s.kind === 'wall') { ctx.fillStyle = Art.shade(th.rock[1], -45); ctx.fillRect(s.x, s.y, s.w, s.h); continue; }
      if (s.kind === 'surface') { const sg = ctx.createLinearGradient(0, s.y + s.h - 140, 0, s.y + s.h); sg.addColorStop(0, '#d8f4ff'); sg.addColorStop(1, '#7fd8f0'); ctx.fillStyle = sg; ctx.fillRect(s.x, s.y, s.w, s.h); ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 4; ctx.beginPath(); for (let x = Math.max(s.x, c.x - 40); x < Math.min(s.x + s.w, c.x + VW + 40); x += 30) ctx.lineTo(x, s.y + s.h - 4 + Math.sin(x * 0.04 + t * 2) * 4); ctx.stroke(); continue; }
      if (s.fall) { if (s.fall.y > X.lava.y + 200) continue; ctx.save(); ctx.translate(s.fall.x + s.w / 2, s.fall.y + s.h / 2); ctx.rotate(s.fall.rot); Art.ell(ctx, 0, 0, s.h * 0.7, s.h * 0.7); Art.fillS(ctx, '#8a8a9a', 4, '#3a3a4a'); ctx.restore(); continue; }
      if ((s.lock || s.timed) && s.open) { ctx.globalAlpha = 0.25; }
      if (!s.img) s.img = Art.renderSolid(s.kind === 'crack' ? Object.assign({}, s, { kind: 'rock' }) : s, th, 300 + s.id);
      ctx.drawImage(s.img.canvas, s.x - s.img.pad, s.y - s.img.pad); ctx.globalAlpha = 1;
      if (s.kind === 'crack') { ctx.strokeStyle = 'rgba(255,240,200,0.9)'; ctx.lineWidth = 3; ctx.beginPath(); const cx = s.x + s.w / 2, cy = s.y + s.h / 2; ctx.moveTo(cx - 14, cy - 12); ctx.lineTo(cx, cy); ctx.lineTo(cx - 6, cy + 14); ctx.moveTo(cx, cy); ctx.lineTo(cx + 14, cy - 6); ctx.stroke(); }
      if (s.lock && !s.open) { ctx.font = 'bold 30px Fredoka, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('🔒', s.x + s.w / 2, s.y + 42); }
      if (s.timed && !s.open) { ctx.font = 'bold 18px Fredoka, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText('2 Schalter gleichzeitig!', s.x + s.w / 2, s.y + 38); }
    }
    // Boot (Riff)
    if (X.boat) { const b = X.boat; ctx.save(); ctx.translate(b.x, b.y - 30 + Math.sin(t * 1.5) * 4); ctx.beginPath(); ctx.moveTo(-110, -30); ctx.lineTo(110, -30); ctx.lineTo(80, 20); ctx.lineTo(-80, 20); ctx.closePath(); Art.fillS(ctx, '#c8643a', 4, '#5a2a10'); ctx.fillStyle = '#fff'; ctx.fillRect(-90, -24, 180, 8); ctx.restore(); ctx.font = 'bold 20px Fredoka, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText('⚓ Boot', b.x, b.y + 50); }
    // Rechentore
    if (X.gates) for (const gt of X.gates) if (vis(gt.x - 100, 0, gt.w + 200, X.H) && gt.task) gt.holes.forEach((h, i) => {
      const cx = gt.x - 46, cy = (h.y0 + h.y1) / 2; const col = gt.passed ? (gt.task.opts[i] === gt.task.answer ? '#3ad87a' : '#9aa8b8') : '#ffcc2a';
      Art.ell(ctx, cx, cy, 40, 40); Art.fillS(ctx, col, 4, '#5a3a00'); ctx.font = 'bold 26px Fredoka, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#3a2000'; ctx.fillText(MathGen.fmt(gt.task.opts[i]), cx, cy + 9);
      ctx.strokeStyle = 'rgba(255,230,120,0.5)'; ctx.lineWidth = 3; ctx.setLineDash([8, 8]); ctx.strokeRect(gt.x, h.y0, gt.w, h.y1 - h.y0); ctx.setLineDash([]);
    });
    // Netze, Schalter, Stationen, Schlote, Truhen, Tiere
    if (X.nets) for (const n of X.nets) if (vis(n.x - 120, n.y - 140, 240, 280)) {
      drawCreature(ctx, n.animal, n.x, n.y + n.fy, t, 1.4);
      if (!n.free) { ctx.strokeStyle = 'rgba(230,220,180,0.9)'; ctx.lineWidth = 2.5; for (let i = -85; i <= 85; i += 20) { ctx.beginPath(); ctx.moveTo(n.x + i, n.y - 75); ctx.lineTo(n.x + i + Math.sin(t + i) * 3, n.y + 75); ctx.stroke(); } for (let j = -75; j <= 75; j += 20) { ctx.beginPath(); ctx.moveTo(n.x - 85, n.y + j); ctx.lineTo(n.x + 85, n.y + j); ctx.stroke(); }
        n.knots.forEach(k => { if (k.ok) return; Art.ell(ctx, k.x, k.y, 14, 14); Art.fillS(ctx, '#c8a46a', 3, '#5a3a10'); ctx.font = 'bold 16px Fredoka, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText('!', k.x, k.y + 6); }); }
    }
    if (X.pairs) for (const p of X.pairs) for (const s of p.sw) { Art.drawSwitch(ctx, s.x, s.y, s.t > 0, t); if (s.t > 0) { ctx.font = 'bold 20px Fredoka, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#5affb0'; ctx.fillText(Math.ceil(s.t) + ' s', s.x, s.y - 60); } }
    if (X.stations) for (const s of X.stations) if (vis(s.x - 90, s.y - 90, 180, 180)) { ctx.beginPath(); ctx.arc(s.x, s.y + 30, 70, Math.PI, TAU); ctx.closePath(); ctx.fillStyle = s.used ? 'rgba(160,240,255,0.25)' : 'rgba(160,240,255,0.5)'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#bff4ff'; ctx.stroke(); ctx.font = 'bold 18px Fredoka, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText(s.used ? '✔ Luftstation' : '💨 Luftstation', s.x, s.y + 10); }
    if (X.vents) for (const v of X.vents) if (vis(v.x - 30, v.y - 30, 60, 60)) { Art.ell(ctx, v.x, v.y, 18, 6); ctx.fillStyle = '#2a3a4a'; ctx.fill(); }
    if (X.bubbles) for (const b of X.bubbles) { ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.fillStyle = 'rgba(200,245,255,0.35)'; ctx.fill(); ctx.strokeStyle = 'rgba(230,252,255,0.9)'; ctx.lineWidth = 2; ctx.stroke(); }
    if (X.chests) for (const ch of X.chests) if (vis(ch.x - 60, ch.y - 60, 120, 120)) Art.drawChest(ctx, ch.x, ch.y, ch.open, t);
    if (X.creatures) for (const cr of X.creatures) if (vis(cr.x - 80, cr.y - 80, 160, 160)) { const by = cr.y + Math.sin(t * 1.4 + cr.ph) * 6; if (!cr.found) { const gg = ctx.createRadialGradient(cr.x, by, 10, cr.x, by, 60); gg.addColorStop(0, 'rgba(255,255,200,0.4)'); gg.addColorStop(1, 'rgba(255,255,200,0)'); ctx.fillStyle = gg; ctx.fillRect(cr.x - 60, by - 60, 120, 120); } drawCreature(ctx, cr.id, cr.x, by, t + cr.ph, 1.5); if (!cr.found) { ctx.font = 'bold 18px Fredoka, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText('?', cr.x + 34, by - 30); } }
    if (X.goal && X.id === 'tauchgang') Art.drawPearl(ctx, X.goal.x, X.goal.y + Math.sin(t * 2) * 8, t, 28, true);
    if (X.id === 'haijagd') { const cx = X.W - 520; ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(cx + 140, 310, 400, 280); ctx.font = 'bold 22px Fredoka, sans-serif'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText('Rettende Höhle →', cx + 70, 290); }
    if (X.id === 'vulkan') { ctx.font = 'bold 26px Fredoka, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#ffe08a'; ctx.fillText('⬆ Ausgang – hier bist du in Sicherheit!', X.W / 2, 220); for (const cp of X.cps) Art.drawCheckpoint(ctx, cp.x - 200, cp.y + 120, cp.active, t); }
    if (X.cps && X.id === 'rettung') for (const cp of X.cps) Art.drawCheckpoint(ctx, cp.x, 860, cp.active, t);
    if (X.id === 'rettung') { ctx.fillStyle = '#f0d89a'; ctx.beginPath(); ctx.moveTo(X.beach, 860); ctx.quadraticCurveTo(X.beach + 200, 760, X.W, 520); ctx.lineTo(X.W, 900); ctx.lineTo(X.beach, 900); ctx.fill(); ctx.font = 'bold 26px Fredoka, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText('🏖 Strand', X.beach + 160, 640); }
    for (const s of X.shells) if (!s.got && vis(s.x - 20, s.y - 20, 40, 40)) Art.drawShell(ctx, s.x, s.y, t, 1);
    // Steinschlag mit Schatten
    for (const r of X.rocks) { const k = clamp(1 - (r.gy - r.y) / 700, 0.15, 1); Art.ell(ctx, r.x, r.gy - 4, r.r * k * 1.2, 6 * k); ctx.fillStyle = `rgba(0,0,0,${0.5 * k})`; ctx.fill(); ctx.save(); ctx.translate(r.x, r.y); ctx.rotate(r.rot); ctx.beginPath(); for (let i = 0; i < 7; i++) { const a = i / 7 * TAU, rr = r.r * (0.8 + (i % 2) * 0.25); ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.closePath(); Art.fillS(ctx, '#7a6a5a', 3, '#2a2018'); ctx.restore(); }
    // Gegner
    for (const e of X.enemies) if (vis(e.x - 120, e.y - 120, 240, 240)) {
      if (e.type === 'barracuda') { if (e.mode === 'warn') { ctx.beginPath(); ctx.arc(e.x, e.y, 60 + Math.sin(t * 30) * 6, 0, TAU); ctx.fillStyle = 'rgba(255,60,60,0.3)'; ctx.fill(); ctx.font = 'bold 30px Fredoka, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#ff5a5a'; ctx.fillText('!', e.x, e.y - 50); }
        Art.drawEnemy(ctx, Object.assign({}, e, { type: 'bigfish', r: 40 }), t); continue; }
      Art.drawEnemy(ctx, e, t);
    }
    // Tilda
    if (X.tilda) { const T = X.tilda; if (!(T.inv > 0 && Math.floor(t * 20) % 2)) { ctx.save(); ctx.translate(T.x, T.y); ctx.scale(1.3, 1.3); Art.drawTurtle(ctx, 0, 0, t, T.vx < -5 ? -1 : 1); ctx.restore(); } ctx.font = 'bold 16px Fredoka, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText('Tilda ' + '❤'.repeat(Math.max(0, T.hp)), T.x, T.y - 34); }
    // Delfin
    if (X.cos.companion) Art.drawCompanion(ctx, X.cos.companion, d.comp.x, d.comp.y, t, d.facing);
    if (d.dashT > 0) for (let i = 0; i < 4; i++) { ctx.globalAlpha = 0.25 - i * 0.05; Art.drawDolphin(ctx, { x: d.x - d.vx * 0.02 * (i + 1), y: d.y - d.vy * 0.02 * (i + 1), facing: d.facing, angle: d.angle, color: Save.data.color, t: d.t, cos: X.cos, speed: 1 }); } ctx.globalAlpha = 1;
    if (d.hidden) ctx.globalAlpha = 0.5;
    Art.drawDolphin(ctx, { x: d.x, y: d.y, facing: d.facing, angle: d.angle, color: Save.data.color, t: d.t, slap: d.slapT >= 0 ? d.slapT / SLAP_DUR : -1, hurt: d.invuln > 0 && X.state === 'play', cos: X.cos, speed: Math.min(1, Math.hypot(d.vx, d.vy) / MAXV), happy: X.state === 'won' });
    ctx.globalAlpha = 1;
    if (d.hidden) { ctx.font = 'bold 16px Fredoka, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#bfffd2'; ctx.fillText('versteckt', d.x, d.y - 40); }
    // Lava
    if (X.lava && X.lava.y < c.y + VH + 100) { const ly = X.lava.y; const lg = ctx.createLinearGradient(0, ly - 30, 0, ly + 300); lg.addColorStop(0, 'rgba(255,200,60,0.95)'); lg.addColorStop(0.2, '#ff6a1a'); lg.addColorStop(1, '#8a1a0a'); ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(c.x - 50, c.y + VH + 100); for (let x = c.x - 50; x <= c.x + VW + 60; x += 40) ctx.lineTo(x, ly + Math.sin(x * 0.03 + t * 3) * 10); ctx.lineTo(c.x + VW + 60, c.y + VH + 100); ctx.fill(); for (let i = 0; i < 6; i++) { ctx.fillStyle = 'rgba(255,230,120,0.8)'; ctx.beginPath(); ctx.arc(c.x + ((i * 233 + t * 40) % VW), ly - ((t * 60 + i * 50) % 120), 3, 0, TAU); ctx.fill(); } }
    // Partikel, Texte
    for (const p of X.parts) { const a = Math.max(0, p.life / p.max); if (p.type === 'bubble') { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.strokeStyle = `rgba(230,250,255,${a})`; ctx.lineWidth = 1.5; ctx.stroke(); } else if (p.type === 'star') { ctx.globalAlpha = a; Art.star(ctx, p.x, p.y, p.r + 3, '#ffe04a'); ctx.globalAlpha = 1; } else { ctx.fillStyle = `rgba(255,230,150,${a})`; ctx.fillRect(p.x - 2, p.y - 2, 4, 4); } }
    for (const f of X.fx) { if (f.ring) { const k = f.t / 0.4; ctx.beginPath(); ctx.arc(f.x, f.y, 20 + k * 70, 0, TAU); ctx.strokeStyle = `rgba(220,250,255,${1 - k})`; ctx.lineWidth = 5 * (1 - k) + 1; ctx.stroke(); continue; } const k = f.t / 1.4; ctx.globalAlpha = 1 - k * k; ctx.font = 'bold 24px Fredoka, sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 5; ctx.strokeStyle = '#0a2a4a'; ctx.strokeText(f.text, f.x, f.y - k * 40); ctx.fillStyle = f.col; ctx.fillText(f.text, f.x, f.y - k * 40); ctx.globalAlpha = 1; }
    ctx.restore();
    // Bruno
    if (X.id === 'haijagd') drawBruno(ctx, -95 + X.shark.off, clamp(d.y - c.y, 190, VH - 170), t, X.shark.mouth);
    // Dunkelheit (Tiefsee)
    if (X.id === 'tauchgang') drawDark(ctx);
    drawHUD(ctx);
    if (X.state === 'title') { const a = X.st < 0.3 ? X.st / 0.3 : X.st > 1.4 ? Math.max(0, 1 - (X.st - 1.4) / 0.4) : 1; ctx.globalAlpha = a; banner(ctx, X.def.icon + ' ' + X.def.name); ctx.globalAlpha = 1; }
    if (X.state === 'dead') { ctx.fillStyle = `rgba(0,10,30,${Math.min(0.7, X.st)})`; ctx.fillRect(0, 0, VW, VH); }
  }
  function mix(a, b, k) { const p = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; const A = p(a), B = p(b); return 'rgb(' + A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(',') + ')'; }
  function drawDark(ctx) {
    const c = X.cam, depth = clamp((c.y - 600) / 3800, 0, 0.93); if (depth <= 0.02) return;
    if (!dark) { dark = document.createElement('canvas'); dark.width = VW; dark.height = VH; }
    const g = dark.getContext('2d'); g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, VW, VH); g.fillStyle = `rgba(1,4,16,${depth})`; g.fillRect(0, 0, VW, VH); g.globalCompositeOperation = 'destination-out';
    const hole = (x, y, r) => { const gg = g.createRadialGradient(x, y, r * 0.25, x, y, r); gg.addColorStop(0, 'rgba(0,0,0,1)'); gg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gg; g.fillRect(x - r, y - r, r * 2, r * 2); };
    hole(X.d.x - c.x, X.d.y - c.y, X.lamp ? 380 : 250);
    X.enemies.forEach(e => { if (e.type === 'lantern' || e.type === 'jelly') hole(e.x - c.x, e.y - c.y, 90); });
    X.stations.forEach(s => hole(s.x - c.x, s.y - c.y, 160)); if (X.bubbles) X.bubbles.forEach(b => hole(b.x - c.x, b.y - c.y, 30)); hole(X.goal.x - c.x, X.goal.y - c.y, 180);
    ctx.drawImage(dark, 0, 0);
  }
  function banner(ctx, text) { ctx.save(); ctx.textAlign = 'center'; Art.rr(ctx, VW / 2 - 330, VH / 2 - 60, 660, 110, 22); const g = ctx.createLinearGradient(0, VH / 2 - 60, 0, VH / 2 + 50); g.addColorStop(0, '#8a5a2a'); g.addColorStop(1, '#5a3418'); Art.fillS(ctx, g, 5, '#ffcc4a'); ctx.font = 'bold 42px Fredoka, sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText(text, VW / 2, VH / 2 + 12); ctx.restore(); }
  function pill(ctx, x, y, w) { Art.rr(ctx, x, y, w, 44, 22); ctx.fillStyle = 'rgba(8,30,60,0.75)'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(255,210,90,0.85)'; ctx.stroke(); }
  function drawHUD(ctx) {
    ctx.save(); ctx.font = 'bold 22px Fredoka, sans-serif'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    pill(ctx, 16, 14, 40 + X.maxHearts * 34); for (let i = 0; i < X.maxHearts; i++) { ctx.fillStyle = i < X.hearts ? '#ff3a5a' : 'rgba(255,255,255,0.25)'; ctx.fillText('❤', 34 + i * 34, 37); }
    let x = 70 + X.maxHearts * 34; const box = (text, w) => { pill(ctx, x, 14, w); ctx.fillStyle = '#fff'; ctx.fillText(text, x + 16, 37); x += w + 10; };
    box('⏱ ' + fmtTime(X.time), 120); box('★ ' + X.score, 120);
    if (X.id === 'haijagd') box('Tore ' + X.gatesRight + '/6', 130);
    if (X.id === 'riff') { box('💰 ' + (X.chestsFound || 0) + '/10', 120); box('📖 ' + X.creatures.filter(q => q.found).length + '/12', 120); }
    if (X.id === 'rettung') box('🐢 Befreit ' + X.freed + '/6', 170);
    if (X.id === 'tauchgang') { pill(ctx, x, 14, 260); ctx.fillStyle = '#fff'; ctx.fillText('O₂', x + 14, 37); Art.rr(ctx, x + 52, 26, 190, 22, 11); ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fill(); Art.rr(ctx, x + 52, 26, 190 * X.oxygen / 100, 22, 11); ctx.fillStyle = X.oxygen < 25 ? (Math.floor(X.t * 4) % 2 ? '#ff5a5a' : '#ffb03a') : '#5ad8ff'; ctx.fill(); x += 270; box(Math.round(X.d.y / 10) + ' m', 110); }
    if (X.id === 'vulkan') { const gap = Math.max(0, Math.round((X.lava.y - X.d.y) / 10)); box('🌋 Lava: ' + gap + ' m', 190); box('⬆ ' + Math.round((X.H - X.d.y) / 10) + ' m', 120); }
    // Dash-Anzeige
    if (X.d.dashCd > 0 && X.state === 'play') { ctx.beginPath(); ctx.arc(X.d.x - X.cam.x, X.d.y - X.cam.y - 50, 9, -Math.PI / 2, -Math.PI / 2 + (1 - X.d.dashCd / DASH_CD) * TAU); ctx.strokeStyle = 'rgba(120,220,255,0.9)'; ctx.lineWidth = 4; ctx.stroke(); }
    // Frage am Rechentor
    if (X.gates) { const g = X.gates.find(q => !q.passed && q.task); if (g && g.x - X.cam.x < VW + 400) { const txt = g.task.q + ' = ?'; ctx.font = 'bold 40px Fredoka, sans-serif'; const w = ctx.measureText(txt).width + 120; Art.rr(ctx, VW / 2 - w / 2, 70, w, 70, 20); Art.fillS(ctx, 'rgba(255,240,190,0.97)', 4, '#b8860b'); ctx.textAlign = 'center'; ctx.fillStyle = '#3a2410'; ctx.fillText(txt, VW / 2, 106); ctx.font = '600 16px Fredoka, sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText('Schwimm durch das Tor mit dem richtigen Ergebnis!', VW / 2, 158); } }
    // Mini-Karte (Riff)
    if (X.id === 'riff') { const mw = 240, mh = mw * X.H / X.W, mx = VW - mw - 18, my = VH - mh - 18; ctx.fillStyle = 'rgba(4,30,60,0.75)'; ctx.fillRect(mx - 4, my - 4, mw + 8, mh + 8); ctx.strokeStyle = '#ffcc4a'; ctx.lineWidth = 2; ctx.strokeRect(mx - 4, my - 4, mw + 8, mh + 8); const k = mw / X.W;
      ctx.fillStyle = 'rgba(180,140,100,0.8)'; X.solids.forEach(s => { if (s.kind !== 'wall' && !s.gone) ctx.fillRect(mx + s.x * k, my + s.y * k, Math.max(1, s.w * k), Math.max(1, s.h * k)); });
      X.chests.forEach(ch => { ctx.fillStyle = ch.open ? '#3ad87a' : 'rgba(255,210,58,0.55)'; ctx.fillRect(mx + ch.x * k - 2.5, my + ch.y * k - 2.5, 5, 5); });
      X.creatures.forEach(cr => { if (cr.found) { ctx.fillStyle = '#bfe8ff'; ctx.fillRect(mx + cr.x * k - 2, my + cr.y * k - 2, 4, 4); } });
      ctx.fillStyle = '#ff7a3a'; ctx.fillRect(mx + X.boat.x * k - 4, my + X.boat.y * k - 2, 8, 4); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(mx + X.d.x * k, my + X.d.y * k, 3.5, 0, TAU); ctx.fill();
      ctx.font = '600 12px Fredoka, sans-serif'; ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.fillText('Karte · gelb = Schatz', mx, my - 12); }
    ctx.restore();
  }

  Expedition._result = () => X && result();
  root.Expedition = Expedition;
  root.ExpeditionArt = { drawCreature };
})(window);
