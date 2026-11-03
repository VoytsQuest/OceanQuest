/* OceanQuest – Spiel-Engine: Levelaufbau, Physik, Kollisionen, Gegner, Bossablauf, Rendering */
(function (root) {
  'use strict';
  const VW = 1280, VH = 720, LH = 960, FLOOR = 910, CEIL = 50;
  const ACC = 1700, MAXV = 350, HW = 32, HH = 15, SLAP_CD = 0.7, SLAP_DUR = 0.34;
  const ER = { fish: 20, piranha: 20, crab: 20, jelly: 22, puffer: 22, urchin: 20, inkpus: 22, lantern: 22, eel: 24, bigfish: 34 };
  const solidCache = {}; const bgCache = {};
  let L = null; let dark = null;

  /* ================= LEVELAUFBAU ================= */
  function build(wid) {
    const W = WORLDS[wid - 1], m = W.mech;
    const r = Art.rng(wid * 7919 + 31);
    const R = (a, b) => a + r() * (b - a), pick = a => a[Math.floor(r() * a.length)];
    const L = { W, wid, solids: [], movers: [], crates: [], gates: [], switches: [], enemies: [], shells: [], pearls: [], chests: [], checkpoints: [], currents: [], vents: [], ink: [], lights: [], signs: [], weeds: [], schools: [], fx: [], parts: [] };
    const rock = (x, y, w, h, ceil, kind) => { const s = { x, y, w, h, ceil: !!ceil, kind: kind || 'rock', id: L.solids.length }; L.solids.push(s); return s; };
    const shell = (x, y) => L.shells.push({ x, y, got: false });
    const shellLine = (x0, y0, x1, y1, n) => { for (let i = 0; i < n; i++) { const k = n === 1 ? 0 : i / (n - 1); shell(x0 + (x1 - x0) * k, y0 + (y1 - y0) * k); } };
    const shellRing = (cx, cy, rad, n) => { for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; shell(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad); } };
    const enemy = (type, x, y, o) => {
      o = o || {}; const big = type === 'eel' || type === 'bigfish';
      if (type === 'crab' && o.groundY === undefined) y = FLOOR - 22; else if (type === 'crab') y = o.groundY - 22;
      const e = { type, x, y, hx: x, hy: y, r: ER[type] * (big ? 1.45 : 1), big, invuln: big || type === 'urchin', seed: r() * 10, range: o.range || R(70, 140), spd: (o.spd || 1) * m.enemySpeed, face: 1, vx: 0, vy: 0, chase: (type === 'piranha' || type === 'lantern') && r() < 0.5 + m.chase, inkT: R(1, 4), t: r() * 10, knocked: false, kt: 0, spin: 0, inflate: 0 };
      L.enemies.push(e); return e;
    };
    const smallEnemy = (x, range) => { const type = pick(W.enemies); const y = type === 'crab' ? FLOOR : R(CEIL + 180, FLOOR - 180); return enemy(type, x, y, { range }); };
    const pillar = (px, w, gap) => {
      const t = r();
      if (t < 0.5) {
        const gc = R(CEIL + gap / 2 + 110, FLOOR - gap / 2 - 110);
        rock(px, CEIL - 40, w, gc - gap / 2 - (CEIL - 40), true); rock(px, gc + gap / 2, w, FLOOR + 40 - (gc + gap / 2));
        shellLine(px + w / 2 - 30, gc, px + w / 2 + 30, gc, 2);
      } else if (t < 0.78) {
        const h = R(320, FLOOR - CEIL - gap - 80); rock(px, FLOOR - h, w, h + 40);
        if (r() < 0.55) { enemy('urchin', px + w / 2, FLOOR - h - 20); shell(px + w / 2, FLOOR - h - 110); } else shell(px + w / 2, FLOOR - h - 60);
      } else {
        const h = R(320, FLOOR - CEIL - gap - 80); rock(px, CEIL - 40, w, h + 40, true); shell(px + w / 2, CEIL + h + 60);
      }
    };
    const blockKind = wid === 3 ? 'iceblock' : wid === 2 ? 'crate' : 'boulder';

    // --- 1. Startbereich
    let cx = 0;
    if (m.tutorial) {
      L.signs.push({ x: 330, y: FLOOR, text: 'Pfeiltasten / WASD: schwimmen' }, { x: 820, y: FLOOR, text: 'Leertaste: Flossenschlag!' });
    } else L.signs.push({ x: 330, y: FLOOR, text: 'Welt ' + wid + ': ' + W.short });
    shellLine(420, 520, 760, 400, 5);
    rock(560, FLOOR - 60, 130, 100);
    enemy(m.tutorial ? 'crab' : pick(W.enemies.filter(t => t !== 'lantern')), 980, m.tutorial ? FLOOR : 560, { range: 60, spd: 0.6 });
    cx = 1150;
    // --- Easter Egg: Buchstaben aus Sammelmuscheln (Welt 1: 5B, Welt 3: IGS)
    const EGG = { 1: '5B', 3: 'IGS' }[wid];
    if (EGG) {
      const FONT = { '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'], 'B': ['11110', '10001', '10001', '11110', '10001', '10001', '11110'], 'I': ['11111', '00100', '00100', '00100', '00100', '00100', '11111'], 'G': ['01110', '10001', '10000', '10111', '10001', '10001', '01111'], 'S': ['01111', '10000', '10000', '01110', '00001', '00001', '11110'] };
      const cell = 30, x0 = cx + 120, y0 = CEIL + 70; let n = 0;
      [...EGG].forEach((ch, k) => FONT[ch].forEach((row, ry) => [...row].forEach((v, rx) => { if (v === '1') { L.shells.push({ x: x0 + k * 6 * cell + rx * cell, y: y0 + ry * cell, got: false, egg: true }); n++; } })));
      L.egg = { text: EGG, total: n, got: 0, found: false };
      cx = x0 + EGG.length * 6 * cell + 200;
    }
    // --- 2. Erste Hinderniszone
    for (let i = 0; i < m.pillars; i++) {
      const w = R(110, 170); pillar(cx, w, m.gap + 40);
      const space = R(260, 340);
      if (i % 2 === 0 || wid >= 5) smallEnemy(cx + w + space / 2, Math.min(90, space / 3));
      if (m.roots && i % 2) { rock(cx + w + space / 2 - 22, CEIL - 40, 44, R(220, 360), true, 'rock'); }
      cx += w + space;
    }
    // --- 3. Sammelbereich (Schatztruhe + versteckte Perle hinter Kiste)
    const cz = cx + 100;
    shellRing(cz + 120, 430, 90, 8); shellRing(cz + 420, 640, 70, 6); shellLine(cz, 260, cz + 500, 260, 6);
    L.chests.push({ x: cz + 300, y: FLOOR - 22, open: false });
    const P = cz + 620;
    rock(P, FLOOR - 140, 300, 50); rock(P + 260, FLOOR - 100, 40, 140);
    L.crates.push({ x: P, y: FLOOR - 84, w: 84, h: 84, vx: 0, kind: blockKind === 'iceblock' ? 'iceblock' : 'crate', id: 'c' + L.crates.length });
    L.pearls.push({ x: P + 55, y: FLOOR - 42, got: false });
    L.signs.push({ x: P - 140, y: FLOOR, text: m.tutorial ? 'Schiebe die Kiste mit dem Flossenschlag!' : 'Geheimversteck?' });
    cx = P + 420;
    L.checkpoints.push({ x: cx, y: FLOOR, active: false });
    cx += 260;
    // --- 4. Schwierigerer Abschnitt
    const n2 = m.pillars + 2; let mv = 0, cu = 0, vent = 0;
    for (let i = 0; i < n2; i++) {
      const w = R(110, 160); const space = R(270, 360);
      if (mv < m.moving && i % 2 === 1) {
        const h = R(150, 200), bw = R(110, 140);
        const axis = wid === 3 && mv % 2 ? 'x' : 'y';
        L.movers.push({ x: cx, y: CEIL + 90, w: bw, h, bx: cx, by: CEIL + 90, axis, lo: CEIL + 90, hi: FLOOR - 90 - h, amp: 150, spd: R(0.5, 0.9), ph: r() * 6, kind: blockKind, id: 'm' + mv });
        shell(cx + bw / 2, (FLOOR + CEIL) / 2); mv++; cx += bw + space; continue;
      }
      pillar(cx, w, m.gap);
      const gx = cx + w;
      if (cu < m.currents && i % 3 === 1) {
        const up = r() < 0.5; L.currents.push({ x: gx + 30, y: CEIL, w: space - 60, h: FLOOR - CEIL, fx: up ? 0 : -260, fy: up ? (r() < 0.5 ? -520 : 520) : 0 }); cu++;
      }
      if (m.lava && vent < 6) { L.vents.push({ x: gx + space / 2, period: R(2.8, 3.6), ph: r() * 3 }); vent++; }
      else smallEnemy(gx + space / 2, Math.min(110, space / 3));
      if (W.big.length && i % 3 === 2) enemy(pick(W.big), gx + space / 2, R(CEIL + 200, FLOOR - 200), { range: 60, spd: 0.6 });
      if (m.roots && i % 2 === 0) rock(gx + space / 2 - 20, FLOOR - R(200, 330), 40, 400, false);
      if (m.ink && i % 2 === 0) L.ink.push({ x: gx + space / 2, y: R(260, 700), r: R(90, 140), life: 1e9, max: 1e9 });
      cx = gx + space;
    }
    // --- 5. Rätsel: Muschelschalter öffnen das Tor
    const need = m.switches || 1;
    const gate = { x: cx + 760, y0: CEIL - 40, y: CEIL - 40, w: 64, h: FLOOR - CEIL + 80, open: 0, opening: false, need, kind: 'gate', id: 'g' };
    L.gates.push(gate);
    L.switches.push({ x: cx + 260, y: FLOOR, on: false, gate });
    if (need > 1) { rock(cx + 470, 300, 230, 40); L.switches.push({ x: cx + 585, y: 300, on: false, gate }); }
    else rock(cx + 420, FLOOR - 160, 120, 200);
    L.signs.push({ x: cx + 80, y: FLOOR, text: need > 1 ? 'Zwei Schalter öffnen das Tor!' : 'Muschelschalter: Flossenschlag!' });
    shellLine(cx + 200, 560, cx + 650, 560, 5);
    if (m.dark) L.lights.push({ x: cx + 260, y: FLOOR - 30 }, { x: cx + 585, y: 300 });
    cx = gate.x + gate.w + 220;
    L.checkpoints.push({ x: cx, y: FLOOR, active: false });
    // --- 6. Bossarena
    const A = cx + 260;
    L.arena = { x: A, wall: { x: A - 70, w: 54, y0: CEIL - 40, h: FLOOR - CEIL + 80, closed: 0, closing: false, kind: 'gate' } };
    L.length = A + VW;
    shellLine(A + 100, 360, A + 100, 640, 3);
    // Deko: Wasserpflanzen, Fischschwärme, Orientierungslichter (Tiefsee)
    for (let x = 40; x < L.length; x += R(50, 130)) L.weeds.push({ x, h: R(50, 150), ph: r() * 6, c: r() });
    for (let i = 0; i < 4; i++) L.schools.push({ x: r() * L.length, y: R(180, 720), vx: R(30, 70) * (r() < 0.5 ? -1 : 1), n: 6 + Math.floor(r() * 6), seed: r() * 10 });
    const PROPS = { coral: ['coral', 'starfish', 'anemone', 'coral'], ship: ['barrel', 'anchor', 'coins', 'barrel'], ice: ['crystal', 'crystal', 'starfish'], jungle: ['leaf', 'leaf', 'log'], temple: ['column', 'urn', 'column'], cave: ['mushroom', 'crystal', 'mushroom'], deep: ['glowplant', 'glowplant', 'mushroom'], volcano: ['lavarock', 'lavarock', 'crystal'] }[L.W.theme.far];
    L.props = []; for (let x = 120; x < L.length; x += R(110, 260)) { if (L.solids.some(s => !s.ceil && x > s.x - 40 && x < s.x + s.w + 40 && s.y < FLOOR)) continue; L.props.push({ x, kind: pick(PROPS), s: R(0.7, 1.25), seed: r() * 100 }); }
    if (m.dark) for (let x = 300; x < L.length; x += R(300, 420)) L.lights.push({ x, y: r() < 0.6 ? FLOOR - 20 : CEIL + 20 });
    return L;
  }

  /* ================= SPIELABLAUF ================= */
  const Game = {
    VW, VH, hooks: {}, paused: false, get L() { return L; },
    start(wid, resume) {
      L = build(wid);
      L.baseShells = L.shells.length; L.basePearls = L.pearls.length;
      const th = L.W.theme;
      if (!bgCache[wid]) bgCache[wid] = Art.buildBackground(th, LH);
      L.bg = bgCache[wid];
      if (!solidCache[wid]) solidCache[wid] = {};
      const sc = solidCache[wid];
      L.solids.forEach(s => { const k = 's' + s.id; if (!sc[k]) sc[k] = Art.renderSolid(s, th, wid * 1000 + s.id); s.img = sc[k]; });
      L.movers.forEach(s => { s.img = Art.renderSolid(s, th, 7); });
      L.crates.forEach(s => { s.img = Art.renderSolid(s, th, 9); });
      L.gates.forEach(g => { g.img = Art.renderSolid(g, th, 3); });
      L.arena.wall.img = Art.renderSolid(L.arena.wall, th, 4);
      const S = Save.data;
      L.d = { x: 200, y: 520, vx: 0, vy: 0, facing: 1, angle: 0, slapT: -1, slapCd: 0, slapDone: false, invuln: 0, t: 0, trail: [], trailT: 0, comp: { x: 120, y: 520 }, color: S.color, cos: Save.cosmetics(), jump: 0, lunge: -1 };
      L.cam = { x: 0, y: (LH - VH) / 2 };
      L.cp = { x: 200, y: 520 };
      L.hearts = 3; L.time = 0; L.score = 0; L.shellsGot = 0; L.pearlsGot = 0; L.correct = 0; L.fails = 0; L.deaths = 0; L.knocks = 0;
      L.state = 'title'; L.stateT = 0; L.t = 0; L.shake = 0; L.boss = null; L.bossStarted = false; L.magic = null;
      L.totalShells = L.shells.length;
      this.paused = false;
      if (resume && resume.world === wid) applyResume(resume);
      Sound.forWorld(wid);
    },
    stop() { L = null; },

    update(dt, ev) {
      if (!L || this.paused) return;
      L.t += dt; L.stateT += dt; const d = L.d; d.t += dt;
      L.shake = Math.max(0, L.shake - dt * 3);
      if (L.state === 'title' && L.stateT > 2.2) this.setState('play');
      const control = L.state === 'play' || L.state === 'collect' || L.state === 'title';
      if (L.state === 'play' || L.state === 'collect') L.time += dt;
      // Bewegliche Elemente
      updateMovers(dt);
      updateGates(dt);
      if (control) controlDolphin(dt, ev);
      else if (L.state === 'dead') { if (L.stateT > 1.1) respawn(); }
      else autoDolphin(dt);
      updateEnemies(dt, control);
      updateCrates(dt);
      updatePickups(dt, control);
      updateFx(dt);
      updateBoss(dt);
      updateCamera(dt);
    },
    setState(s) { L.state = s; L.stateT = 0; },
    respawnAtCheckpoint() { if (L && (L.state === 'play' || L.state === 'collect')) { L.deaths++; respawn(); } },
    // Bosskampf-Schnittstelle (wird von der UI aufgerufen)
    setTalk(on) { if (L && L.boss) L.boss.talk = on; },
    setLamp(on) { if (L && L.boss) L.boss.lampOn = on; },
    bossHit() {
      const b = L.boss; b.hp--; b.hit = 1; L.correct++; L.score += 100; L.d.lunge = 0; L.shake = 0.6;
      setTimeout(() => { Sound.sfx('bossHit'); for (let i = 0; i < 14; i++) addPart(b.x - 60, b.y, 'star'); }, 260);
    },
    bossMiss() { L.fails++; const b = L.boss; b.talk = true; setTimeout(() => { if (L && L.boss) L.boss.talk = false; }, 900); },
    bossDefeat() { this.setState('bossDefeat'); Sound.sfx('bossDefeat'); },
    stats() {
      const W = L.W; const time = L.time; const timeBonus = Math.max(0, Math.round((W.par - time) * 5));
      const stars = 1 + (L.fails <= 1 ? 1 : 0) + (time <= W.par ? 1 : 0);
      const levelScore = L.score + 500 + timeBonus;
      const coins = L.shellsGot * 5 + L.pearlsGot * 25 + L.correct * 15 + 150 + (L.egg && L.egg.found ? 300 : 0);
      return { egg: L.egg && L.egg.found ? L.egg.text : null, world: L.wid, name: W.name, time, timeBonus, shells: L.shellsGot, totalShells: L.totalShells, pearls: L.pearlsGot, correct: L.correct, fails: L.fails, score: levelScore, stars, coins, deaths: L.deaths };
    },
    render(ctx) { if (L) render(ctx); },
    // Spielstand mitten im Level: letzter Checkpoint + bereits gesammelte Dinge
    snapshot() {
      if (!L || L.finished || L.magic) return null;
      const idx = (arr, n, f) => arr.slice(0, n).map((x, i) => f(x) ? i : -1).filter(i => i >= 0);
      let cp = -1; L.checkpoints.forEach((c, i) => { if (c.active) cp = i; });
      return { world: L.wid, cp, time: L.time, score: L.score, shellsGot: L.shellsGot, pearlsGot: L.pearlsGot, knocks: L.knocks,
        shells: idx(L.shells, L.baseShells, s => s.got), pearls: idx(L.pearls, L.basePearls, p => p.got), chests: idx(L.chests, L.chests.length, c => c.open), switches: idx(L.switches, L.switches.length, s => s.on), egg: !!(L.egg && L.egg.found) };
    }
  };
  function applyResume(r) {
    for (let i = 0; i <= r.cp && i < L.checkpoints.length; i++) L.checkpoints[i].active = true;
    if (r.cp >= 0 && L.checkpoints[r.cp]) { const c = L.checkpoints[r.cp]; L.cp = { x: c.x, y: FLOOR - 200 }; L.d.x = L.cp.x; L.d.y = L.cp.y; L.d.comp.x = L.d.x - 80; L.cam.x = Math.max(0, L.d.x - VW * 0.4); }
    L.time = r.time; L.score = r.score; L.shellsGot = r.shellsGot; L.pearlsGot = r.pearlsGot; L.knocks = r.knocks;
    r.shells.forEach(i => { if (L.shells[i]) L.shells[i].got = true; }); r.pearls.forEach(i => { if (L.pearls[i]) L.pearls[i].got = true; });
    r.chests.forEach(i => { if (L.chests[i]) L.chests[i].open = true; }); r.switches.forEach(i => { if (L.switches[i]) L.switches[i].on = true; });
    L.gates.forEach(g => { if (L.switches.filter(s => s.gate === g && s.on).length >= g.need) { g.opening = true; g.open = 1; g.y = g.y0 - (g.h - 70); } });
    if (L.egg) { L.egg.got = L.shells.filter(s => s.egg && s.got).length; L.egg.found = r.egg; }
    L.d.invuln = 2; L.resumed = true;
  }

  /* ================= PHYSIK & STEUERUNG ================= */
  function solidsNear(x0, x1) {
    const out = [];
    for (const s of L.solids) if (s.x < x1 && s.x + s.w > x0) out.push(s);
    for (const s of L.movers) if (s.x < x1 && s.x + s.w > x0) out.push(s);
    for (const s of L.crates) if (s.x < x1 && s.x + s.w > x0) out.push(s);
    for (const g of L.gates) if (g.x < x1 && g.x + g.w > x0) out.push(g);
    const w = L.arena.wall; if (w.closed > 0 && w.x < x1 && w.x + w.w > x0) out.push(w);
    return out;
  }
  const ov = (ax, ay, aw, ah, s) => ax < s.x + s.w && ax + aw > s.x && ay < s.y + s.h && ay + ah > s.y;

  function moveDolphin(dt) {
    const d = L.d; const list = solidsNear(d.x - 400, d.x + 400);
    d.x += d.vx * dt;
    for (const s of list) if (ov(d.x - HW, d.y - HH, HW * 2, HH * 2, s)) { if (d.vx > 0) d.x = s.x - HW - 0.01; else if (d.vx < 0) d.x = s.x + s.w + HW + 0.01; d.vx *= -0.15; }
    d.y += d.vy * dt;
    for (const s of list) if (ov(d.x - HW, d.y - HH, HW * 2, HH * 2, s)) { if (d.vy > 0) d.y = s.y - HH - 0.01; else if (d.vy < 0) d.y = s.y + s.h + HH + 0.01; d.vy *= -0.15; }
    // Entwirren, falls etwas in den Delfin geschoben wurde
    for (const s of list) if (ov(d.x - HW, d.y - HH, HW * 2, HH * 2, s)) {
      const pl = d.x + HW - s.x, pr = s.x + s.w - (d.x - HW), pu = d.y + HH - s.y, pd = s.y + s.h - (d.y - HH);
      const m = Math.min(pl, pr, pu, pd);
      if (m === pl) d.x -= pl; else if (m === pr) d.x += pr; else if (m === pu) d.y -= pu; else d.y += pd;
    }
    const minX = L.boss && L.state !== 'play' ? L.arena.x + 10 : HW;
    d.x = Math.max(minX, Math.min(L.length - HW, d.x)); d.y = Math.max(CEIL + HH, Math.min(FLOOR - HH, d.y));
  }

  function controlDolphin(dt, ev) {
    const d = L.d, I = Input;
    let ix = (I.right ? 1 : 0) - (I.left ? 1 : 0), iy = (I.down ? 1 : 0) - (I.up ? 1 : 0);
    const len = Math.hypot(ix, iy); if (len > 0) { ix /= len; iy /= len; }
    const slip = L.W.mech.slippery;
    d.vx += ix * ACC * dt; d.vy += iy * ACC * dt;
    const drag = len > 0 ? (slip ? 0.6 : 1.4) : (slip ? 1.5 : 5.5);
    d.vx *= Math.exp(-drag * dt); d.vy *= Math.exp(-drag * dt);
    let sp = Math.hypot(d.vx, d.vy); if (sp > MAXV) { d.vx *= MAXV / sp; d.vy *= MAXV / sp; }
    for (const c of L.currents) if (d.x > c.x && d.x < c.x + c.w && d.y > c.y && d.y < c.y + c.h) { d.vx += c.fx * dt; d.vy += c.fy * dt; }
    if (ix) d.facing = ix > 0 ? 1 : -1;
    moveDolphin(dt);
    sp = Math.hypot(d.vx, d.vy);
    const ta = Math.max(-1, Math.min(1, d.vy / MAXV)) * 0.5 * (Math.abs(d.vx) > 30 || Math.abs(d.vy) > 30 ? 1 : 0);
    d.angle += (ta - d.angle) * Math.min(1, dt * 8);
    if (sp > 200 && Math.random() < dt * 8) addPart(d.x - d.facing * 50, d.y + (Math.random() - 0.5) * 10, 'bubble');
    if (sp > 260 && Math.random() < dt * 1.2) Sound.sfx('swim');
    // Flossenschlag
    d.slapCd -= dt; d.invuln -= dt;
    if (ev.action && d.slapCd <= 0) { d.slapT = 0; d.slapCd = SLAP_CD; d.slapDone = false; Sound.sfx('slap'); }
    if (d.slapT >= 0) {
      d.slapT += dt;
      if (!d.slapDone && d.slapT > SLAP_DUR * 0.45) { d.slapDone = true; doSlap(); }
      if (d.slapT > SLAP_DUR) d.slapT = -1;
    }
    trail(dt);
    // Checkpoints
    for (const cp of L.checkpoints) if (!cp.active && d.x > cp.x - 20) { cp.active = true; L.cp = { x: cp.x, y: FLOOR - 200 }; Sound.sfx('checkpoint'); popup(cp.x, FLOOR - 160, 'Checkpoint – gespeichert!', '#5affb0'); Game.hooks.autosave && Game.hooks.autosave(); }
    // Bossarena betreten
    if (!L.bossStarted && d.x > L.arena.x + 240) startBoss();
  }
  function autoDolphin(dt) {
    const d = L.d; trail(dt);
    if (L.state === 'bossIntro' || L.state === 'dialog' || L.state === 'math' || L.state === 'bossDefeat') {
      const battle = L.state === 'math' || L.state === 'dialog'; const tx = L.arena.x + (battle ? 830 : 330), ty = LH / 2 + (battle ? 150 : 40);
      d.x += (tx - d.x) * Math.min(1, dt * 2.5); d.y += (ty - d.y) * Math.min(1, dt * 2.5); d.facing = 1; d.angle *= 0.9; d.vx = d.vy = 0;
      if (d.lunge >= 0) { d.lunge += dt / 0.6; if (d.lunge >= 1) d.lunge = -1; }
    }
    if (L.state === 'victory') { d.jump = Math.min(1, L.stateT / 1.6); if (L.stateT > 2.4 && !L.finished) { L.finished = true; Game.hooks.results && Game.hooks.results(Game.stats()); } }
    d.slapT = d.slapT >= 0 ? (d.slapT + dt > SLAP_DUR ? -1 : d.slapT + dt) : -1;
  }
  function trail(dt) {
    const d = L.d; d.trailT += dt;
    if (d.trailT > 0.035) { d.trailT = 0; d.trail.push({ x: d.x - d.facing * 50, y: d.y, t: L.t }); if (d.trail.length > 26) d.trail.shift(); }
    const c = d.comp; c.x += (d.x - d.facing * 85 - c.x) * Math.min(1, dt * 3.5); c.y += (d.y + 30 + Math.sin(L.t * 2) * 8 - c.y) * Math.min(1, dt * 3.5);
  }
  function doSlap() {
    const d = L.d; const hx = d.x + d.facing * 48, hy = d.y, hr = 72;
    L.fx.push({ type: 'ring', x: hx, y: hy, t: 0, max: 0.4 });
    for (let i = 0; i < 8; i++) addPart(hx, hy, 'bubble');
    for (const e of L.enemies) {
      if (e.knocked || e.dead) continue;
      if (Math.hypot(e.x - hx, e.y - hy) < hr + e.r * 0.8) {
        if (e.invuln) { if (e.type !== 'urchin') { popup(e.x, e.y - 40, 'Klonk!', '#ffd23a'); Sound.sfx('klonk'); d.vx -= d.facing * 250; } continue; }
        e.knocked = true; e.kt = 0; const dir = Math.sign(e.x - d.x) || d.facing; e.vx = dir * 720; e.vy = -220 + Math.random() * 120;
        L.score += 20; L.knocks++; Sound.sfx('knock'); popup(e.x, e.y - 30, '+20', '#fff'); for (let i = 0; i < 5; i++) addPart(e.x, e.y, 'star');
      }
    }
    for (const s of L.switches) if (!s.on && Math.hypot(s.x - hx, s.y - 20 - hy) < hr + 40) {
      s.on = true; Sound.sfx('switch'); popup(s.x, s.y - 80, 'Klick!', '#5affb0');
      const g = s.gate; const n = L.switches.filter(x => x.gate === g && x.on).length;
      if (n >= g.need) { g.opening = true; Sound.sfx('gate'); popup(g.x + 30, 400, 'Das Tor öffnet sich!', '#ffd23a'); L.shake = 0.5; }
      else popup(s.x, s.y - 120, 'Noch ' + (g.need - n) + ' Schalter!', '#fff');
    }
    for (const c of L.crates) if (Math.abs(c.x + c.w / 2 - hx) < c.w / 2 + hr * 0.8 && Math.abs(c.y + c.h / 2 - hy) < c.h / 2 + hr * 0.6) { c.vx = Math.sign(c.x + c.w / 2 - d.x) * 700; Sound.sfx('klonk'); }
    for (const ch of L.chests) if (!ch.open && Math.hypot(ch.x - hx, ch.y - hy) < hr + 40) openChest(ch);
  }
  function openChest(ch) {
    ch.open = true; Sound.sfx('chest'); popup(ch.x, ch.y - 70, 'Schatz!', '#ffd23a');
    for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * 0.35; L.shells.push({ x: ch.x, y: ch.y - 30, got: false, vx: Math.cos(a) * 260, vy: Math.sin(a) * 260, fly: 0.8 }); L.totalShells++; }
    L.pearls.push({ x: ch.x, y: ch.y - 90, got: false });
  }
  function damage(fromX, fromY) {
    const d = L.d; if (d.invuln > 0 || L.state !== 'play' && L.state !== 'collect') return;
    L.hearts--; d.invuln = 1.6; Sound.sfx('hit'); L.shake = 0.8;
    const a = Math.atan2(d.y - fromY, d.x - fromX); d.vx = Math.cos(a) * 420; d.vy = Math.sin(a) * 420;
    popup(d.x, d.y - 50, 'Autsch!', '#ff7a7a');
    if (L.hearts <= 0) { L.deaths++; Game.setState('dead'); Sound.sfx('wrong'); }
  }
  function respawn() {
    const d = L.d; d.x = L.cp.x; d.y = L.cp.y; d.vx = d.vy = 0; d.invuln = 2; L.hearts = 3; d.trail = [];
    L.enemies.forEach(e => { if (!e.knocked && Math.abs(e.hx - d.x) < 360) { e.x = e.hx; e.y = e.hy; } if (Math.abs(e.x - d.x) < 220 && Math.abs(e.y - d.y) < 220 && !e.knocked) { e.x = e.hx; e.y = e.hy; } });
    L.state = L.bossStarted && L.magic ? 'collect' : 'play'; L.stateT = 0;
    popup(d.x, d.y - 60, 'Zurück zum Checkpoint!', '#fff');
  }

  /* ================= WELT-ELEMENTE ================= */
  function updateMovers(dt) {
    const d = L.d;
    for (const m of L.movers) {
      const k = (Math.sin(L.t * m.spd + m.ph) + 1) / 2; const ox = m.x, oy = m.y;
      if (m.axis === 'y') m.y = m.lo + (m.hi - m.lo) * k; else m.x = m.bx + (k - 0.5) * 2 * m.amp;
      if (ov(d.x - HW, d.y - HH, HW * 2, HH * 2, m)) { d.x += m.x - ox; d.y += m.y - oy; }
    }
  }
  function updateGates(dt) {
    for (const g of L.gates) if (g.opening && g.open < 1) { g.open = Math.min(1, g.open + dt * 0.8); g.y = g.y0 - g.open * (g.h - 70); }
    const w = L.arena.wall; if (w.closing && w.closed < 1) w.closed = Math.min(1, w.closed + dt * 1.5);
    w.y = w.y0 - (1 - w.closed) * w.h;
  }
  function updateCrates(dt) {
    for (const c of L.crates) {
      if (Math.abs(c.vx) < 1) { c.vx = 0; continue; }
      const nx = c.x + c.vx * dt; const others = L.solids.concat(L.movers).filter(s => s !== c);
      let hit = false; for (const s of others) if (ov(nx, c.y, c.w, c.h, s)) { hit = true; c.x = c.vx > 0 ? s.x - c.w - 0.01 : s.x + s.w + 0.01; break; }
      if (!hit) c.x = nx; if (hit) c.vx = 0; c.vx *= Math.exp(-3 * dt);
    }
  }
  function updateEnemies(dt, control) {
    const d = L.d; const m = L.W.mech;
    for (let i = L.enemies.length - 1; i >= 0; i--) {
      const e = L.enemies[i]; e.t += dt;
      if (Math.abs(e.x - d.x) > 1500 && !e.knocked) continue;
      if (e.knocked) { e.kt += dt; e.x += e.vx * dt; e.y += e.vy * dt; e.vx *= 0.985; e.spin += dt * 14; if (e.kt > 1.2) L.enemies.splice(i, 1); continue; }
      const t = e.t * e.spd;
      switch (e.type) {
        case 'fish': case 'puffer': case 'inkpus': case 'bigfish': case 'eel': {
          const nx = e.hx + Math.sin(t * (e.big ? 0.6 : 1.1)) * e.range; e.face = nx > e.x ? 1 : -1; e.x = nx; e.y = e.hy + Math.sin(t * 1.7) * (e.big ? 30 : 14);
          if (e.type === 'puffer') { const near = Math.hypot(d.x - e.x, d.y - e.y) < 200; e.inflate += ((near ? 1 : 0) - e.inflate) * Math.min(1, dt * 5); e.r = ER.puffer * (1 + e.inflate * 0.35); }
          if (e.type === 'inkpus') { e.inkT -= dt; if (e.inkT <= 0 && Math.abs(d.x - e.x) < 650) { e.inkT = 3.5 + Math.random() * 2; L.ink.push({ x: e.x, y: e.y, r: 20, tr: 110, life: 7, max: 7 }); if (L.ink.length > 22) L.ink.splice(L.ink.findIndex(k => k.max < 1e9), 1); } }
          break;
        }
        case 'jelly': e.y = e.hy + Math.sin(t * 1.3) * e.range; e.x = e.hx + Math.sin(t * 0.5) * 24; break;
        case 'crab': { const nx = e.hx + Math.sin(t * 1.2) * Math.min(e.range, 80); e.face = nx > e.x ? 1 : -1; e.x = nx; break; }
        case 'piranha': case 'lantern': {
          const dist = Math.hypot(d.x - e.x, d.y - e.y);
          if (e.chase && control && dist < 380 && d.invuln <= 0) { const sp = 150 * e.spd; e.vx += (d.x - e.x) / dist * sp * 3 * dt; e.vy += (d.y - e.y) / dist * sp * 3 * dt; const v = Math.hypot(e.vx, e.vy); if (v > sp) { e.vx *= sp / v; e.vy *= sp / v; } }
          else { const tx = e.hx + Math.sin(t) * e.range, ty = e.hy + Math.sin(t * 1.6) * 20; e.vx += (tx - e.x) * dt * 2; e.vy += (ty - e.y) * dt * 2; e.vx *= Math.exp(-2 * dt); e.vy *= Math.exp(-2 * dt); }
          e.x += e.vx * dt; e.y += e.vy * dt; e.y = Math.max(CEIL + 30, Math.min(FLOOR - 30, e.y)); if (Math.abs(e.vx) > 5) e.face = e.vx > 0 ? 1 : -1; break;
        }
      }
      if (control && hits(e, d)) damage(e.x, e.y);
    }
    // Lavaschlote
    for (const v of L.vents) {
      const p = (L.t + v.ph) % v.period; v.active = p > v.period - 1.3; v.warn = p > v.period - 2.1 && !v.active; v.k = v.active ? Math.min(1, (p - (v.period - 1.3)) / 0.25) : 0;
      if (v.active && !v.snd && Math.abs(v.x - d.x) < 700) { v.snd = true; Sound.sfx('lava'); } if (!v.active) v.snd = false;
      if (v.active && control && Math.abs(d.x - v.x) < 38 + HW * 0.6 && d.y > FLOOR - 420 * v.k) damage(v.x, FLOOR);
      if (v.warn && Math.random() < dt * 10) addPart(v.x + (Math.random() - 0.5) * 30, FLOOR - 5, 'ember');
    }
    for (let i = L.ink.length - 1; i >= 0; i--) { const k = L.ink[i]; if (k.max < 1e9) { k.life -= dt; k.r += (k.tr - k.r) * Math.min(1, dt * 2); if (k.life <= 0) L.ink.splice(i, 1); } }
  }
  function hits(e, d) {
    const k = e.r / 20; const pr = 24;
    const pts = [[d.x, d.y], [d.x + d.facing * 34, d.y], [d.x - d.facing * 30, d.y]];
    if (e.type === 'eel') {
      const x0 = e.x - e.face * 70 * k, x1 = e.x + e.face * 40 * k;
      return pts.some(([px, py]) => { const lo = Math.min(x0, x1), hi = Math.max(x0, x1); const cx = Math.max(lo, Math.min(hi, px)); return Math.hypot(px - cx, py - e.y) < pr * 0.6 + 9 * k; });
    }
    const rr = e.type === 'urchin' ? e.r * 1.2 : e.r * 0.85;
    return pts.some(([px, py], i) => Math.hypot(px - e.x, py - e.y) < rr + (i === 0 ? pr : 14));
  }
  function updatePickups(dt, control) {
    const d = L.d;
    for (const s of L.shells) {
      if (s.got) continue;
      if (s.fly > 0) { s.fly -= dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vx *= 0.94; s.vy *= 0.94; continue; }
      const dist = Math.hypot(s.x - d.x, s.y - d.y);
      if (control && dist < 95) { s.x += (d.x - s.x) * Math.min(1, dt * 7); s.y += (d.y - s.y) * Math.min(1, dt * 7); }
      if (control && dist < 36) { s.got = true; L.shellsGot++; L.score += 10; Sound.sfx('shell'); addPart(s.x, s.y, 'spark');
        if (s.egg && L.egg && !L.egg.found && ++L.egg.got >= L.egg.total) { L.egg.found = true; L.score += 500; Sound.sfx('unlock'); popup(s.x, s.y - 50, 'Easter Egg „' + L.egg.text + '“ gefunden! +500', '#ffe08a'); Game.hooks.toast && Game.hooks.toast('🥚 Easter Egg „' + L.egg.text + '“ komplett! +300 Coins'); for (let i = 0; i < 24; i++) addPart(s.x, s.y, 'star'); } }
    }
    for (const p of L.pearls) if (!p.got && control && Math.hypot(p.x - d.x, p.y - d.y) < 40) { p.got = true; L.pearlsGot++; L.score += 50; Sound.sfx('pearl'); popup(p.x, p.y - 40, 'Perle! +50', '#e8d8ff'); }
    for (const ch of L.chests) if (!ch.open && control && Math.hypot(ch.x - d.x, ch.y - d.y) < 55) openChest(ch);
    if (L.magic && !L.magic.got && control) {
      const mg = L.magic; mg.y += Math.sin(L.t * 2) * 0.3;
      if (Math.hypot(mg.x - d.x, mg.y - d.y) < 55) { mg.got = true; Sound.sfx('unlock'); Game.setState('victory'); L.d.vx = L.d.vy = 0; for (let i = 0; i < 30; i++) addPart(mg.x, mg.y, 'star'); }
    }
  }

  /* ================= BOSS ================= */
  function startBoss() {
    L.bossStarted = true; Game.setState('bossIntro');
    const A = L.arena.x; L.arena.wall.closing = true;
    L.boss = { x: A + VW + 300, y: LH / 2 + 10, tx: A + VW - 300, ty: LH / 2 + 10, hp: L.W.hp, max: L.W.hp, hit: 0, defeat: 0, talk: false, lampOn: true };
    Sound.sfx('bossAppear'); L.shake = 1;
  }
  function updateBoss(dt) {
    const b = L.boss; if (!b) return;
    b.hit = Math.max(0, b.hit - dt * 1.6);
    if (L.state === 'bossIntro') {
      b.x += (b.tx - b.x) * Math.min(1, dt * 2);
      if (L.stateT > 2.0) {
        Game.setState('dialog');
        const name = Save.data.name;
        const lines = L.W.intro.map(s => s.replace('{name}', name));
        Game.hooks.dialog && Game.hooks.dialog(L.W, lines, () => { Game.setState('math'); Game.hooks.bossMath && Game.hooks.bossMath(L.W, b); });
      }
    } else if (L.state === 'bossDefeat') {
      b.defeat = Math.min(1, L.stateT / 2.2); b.y -= dt * 40;
      if (L.stateT > 2.3 && !L.magic) { L.magic = { x: b.tx - 120, y: LH / 2, got: false }; b.gone = true; Game.setState('collect'); Game.hooks.toast && Game.hooks.toast('Schwimm zur magischen Perle!'); }
    } else b.x += (b.tx - b.x) * Math.min(1, dt * 2);
  }

  /* ================= EFFEKTE ================= */
  function addPart(x, y, type) {
    if (L.parts.length > 260) L.parts.shift();
    const a = Math.random() * Math.PI * 2, s = 40 + Math.random() * 160;
    L.parts.push({ x, y, vx: Math.cos(a) * s * (type === 'bubble' ? 0.4 : 1), vy: Math.sin(a) * s * (type === 'bubble' ? 0.4 : 1) - (type === 'bubble' ? 60 : 0), life: type === 'bubble' ? 1.4 : 0.8, max: type === 'bubble' ? 1.4 : 0.8, type, r: type === 'bubble' ? 2 + Math.random() * 5 : 3 + Math.random() * 4 });
  }
  function popup(x, y, text, col) { L.fx.push({ type: 'text', x, y, text, col, t: 0, max: 1.3 }); }
  function updateFx(dt) {
    for (let i = L.parts.length - 1; i >= 0; i--) { const p = L.parts[i]; p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.type === 'bubble') { p.vy -= 40 * dt; p.vx *= 0.97; } else { p.vx *= 0.93; p.vy *= 0.93; } if (p.type === 'ember') p.vy -= 80 * dt; if (p.life <= 0) L.parts.splice(i, 1); }
    for (let i = L.fx.length - 1; i >= 0; i--) { const f = L.fx[i]; f.t += dt; if (f.t > f.max) L.fx.splice(i, 1); }
  }
  function updateCamera(dt) {
    const d = L.d, c = L.cam;
    let tx, ty;
    if (L.bossStarted && L.state !== 'play') { tx = L.arena.x; ty = (LH - VH) / 2; }
    else { tx = d.x - VW * 0.4 + d.facing * 60; ty = d.y - VH / 2; }
    tx = Math.max(0, Math.min(L.length - VW, tx)); ty = Math.max(0, Math.min(LH - VH, ty));
    const k = 1 - Math.exp(-dt * 5); c.x += (tx - c.x) * k; c.y += (ty - c.y) * k;
  }

  /* ================= RENDERING ================= */
  function render(ctx) {
    const th = L.W.theme, c = L.cam, t = L.t, d = L.d;
    const sx = L.shake > 0 ? (Math.random() - 0.5) * 12 * L.shake : 0, sy = L.shake > 0 ? (Math.random() - 0.5) * 12 * L.shake : 0;
    // Wasser-Verlauf
    const g = ctx.createLinearGradient(0, -c.y, 0, LH - c.y); g.addColorStop(0, th.top); g.addColorStop(1, th.bottom);
    ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
    // Lichtstrahlen
    if (th.rays > 0) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 7; i++) {
        const bx = ((i * 260 - c.x * 0.15) % (VW + 400) + VW + 400) % (VW + 400) - 200; const sw = Math.sin(t * 0.4 + i) * 40;
        const a = th.rays * (0.14 + 0.06 * Math.sin(t * 0.7 + i * 2));
        const gg = ctx.createLinearGradient(0, -c.y, 0, 700 - c.y); gg.addColorStop(0, `rgba(255,255,230,${a})`); gg.addColorStop(1, 'rgba(255,255,230,0)');
        ctx.fillStyle = gg; ctx.beginPath(); ctx.moveTo(bx, -c.y - 20); ctx.lineTo(bx + 70, -c.y - 20); ctx.lineTo(bx + 230 + sw, 760 - c.y); ctx.lineTo(bx + 90 + sw, 760 - c.y); ctx.fill();
      }
      ctx.restore();
    }
    // Parallax-Ebenen
    const tile = (img, px, py, alpha) => { ctx.globalAlpha = alpha; const W = L.bg.W; let ox = -((c.x * px) % W); if (ox > 0) ox -= W; for (let x = ox; x < VW; x += W) ctx.drawImage(img, x, -c.y * py); ctx.globalAlpha = 1; };
    tile(L.bg.far, 0.2, 0.55, 0.75);
    // Fischschwärme (harmlose Deko)
    for (const s of L.schools) {
      s.x += s.vx * 0.016; if (s.x < -200) s.x = L.length + 200; if (s.x > L.length + 200) s.x = -200;
      const scx = s.x - c.x * 0.6, scy = s.y - c.y * 0.75; if (scx < -200 || scx > VW + 200) continue;
      for (let i = 0; i < s.n; i++) { const fx = scx + Math.sin(i * 2.3 + s.seed) * 50 + Math.sin(t * 2 + i) * 6, fy = scy + Math.cos(i * 1.7 + s.seed) * 30; ctx.save(); ctx.translate(fx, fy); ctx.scale(s.vx > 0 ? 1 : -1, 1); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(0, 0, 9, 4, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(-14, -4); ctx.lineTo(-14, 4); ctx.fill(); ctx.restore(); }
    }
    tile(L.bg.mid, 0.5, 0.8, 0.85);
    // Weltkoordinaten
    ctx.save(); ctx.translate(Math.round(-c.x + sx), Math.round(-c.y + sy));
    const x0 = c.x - 100, x1 = c.x + VW + 100; const vis = (x, w) => x + (w || 0) > x0 && x < x1;
    // Strömungen
    for (const cu of L.currents) if (vis(cu.x, cu.w)) {
      ctx.save(); ctx.beginPath(); ctx.rect(cu.x, cu.y, cu.w, cu.h); ctx.clip();
      ctx.fillStyle = 'rgba(200,240,255,0.06)'; ctx.fillRect(cu.x, cu.y, cu.w, cu.h);
      ctx.strokeStyle = 'rgba(220,250,255,0.45)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      const dx = Math.sign(cu.fx), dy = Math.sign(cu.fy);
      for (let i = 0; i < 16; i++) {
        const px = cu.x + ((i * 53.7) % cu.w), py = cu.y + ((i * 131.3) % cu.h);
        const off = ((t * 240 + i * 70) % 600);
        const x = dx ? cu.x + ((px - cu.x + off * dx) % cu.w + cu.w) % cu.w : px, y = dy ? cu.y + ((py - cu.y + off * dy) % cu.h + cu.h) % cu.h : py;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - dx * 34, y - dy * 34); ctx.stroke();
      }
      ctx.restore();
    }
    // Pflanzen
    for (const w of L.weeds) if (vis(w.x - 30, 60)) {
      ctx.beginPath(); ctx.moveTo(w.x, FLOOR + 6);
      for (let k = 1; k <= 6; k++) { const y = FLOOR + 6 - w.h * k / 6; ctx.lineTo(w.x + Math.sin(t * 1.6 + w.ph + k * 0.6) * k * 3.2, y); }
      ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.strokeStyle = th.cap === 'lava' ? '#5a2a2a' : th.cap === 'snow' ? '#7ac8d8' : th.cap === 'glow' ? '#8a5ad8' : th.cap === 'biolum' ? '#2a5a8a' : w.c < 0.5 ? '#3aa84a' : '#2a8a5a'; ctx.stroke();
      if ((th.cap === 'biolum' || th.cap === 'glow') && w.c > 0.6) { const yy = FLOOR - w.h; const gg = ctx.createRadialGradient(w.x, yy, 0, w.x, yy, 16); gg.addColorStop(0, 'rgba(140,255,240,0.9)'); gg.addColorStop(1, 'rgba(140,255,240,0)'); ctx.fillStyle = gg; ctx.fillRect(w.x - 16, yy - 16, 32, 32); }
    }
    for (const pr of L.props) if (vis(pr.x - 80, 160)) Art.drawProp(ctx, pr, FLOOR + 4, t);
    // Boden + Decke
    const fg = ctx.createLinearGradient(0, FLOOR - 10, 0, LH); fg.addColorStop(0, th.floor); fg.addColorStop(1, Art.shade(th.floor, -45));
    ctx.fillStyle = fg; ctx.beginPath(); ctx.moveTo(x0, LH); for (let x = Math.floor(x0 / 40) * 40; x <= x1 + 40; x += 40) ctx.lineTo(x, FLOOR - 4 + Math.sin(x * 0.02) * 5); ctx.lineTo(x1 + 40, LH); ctx.fill();
    ctx.fillStyle = Art.shade(th.rock[1], -35); ctx.beginPath(); ctx.moveTo(x0, 0); for (let x = Math.floor(x0 / 50) * 50; x <= x1 + 50; x += 50) ctx.lineTo(x, CEIL + 8 + Math.sin(x * 0.05) * 10 + (x % 150 === 0 ? 14 : 0)); ctx.lineTo(x1 + 50, 0); ctx.fill();
    // Lichter (Tiefsee)
    for (const lg of L.lights) if (vis(lg.x - 40, 80)) { const gg = ctx.createRadialGradient(lg.x, lg.y, 0, lg.x, lg.y, 40); gg.addColorStop(0, 'rgba(150,255,230,0.95)'); gg.addColorStop(1, 'rgba(150,255,230,0)'); ctx.fillStyle = gg; ctx.fillRect(lg.x - 40, lg.y - 40, 80, 80); Art.ell(ctx, lg.x, lg.y, 6, 9); ctx.fillStyle = '#eafffa'; ctx.fill(); }
    // Schilder, Checkpoints
    for (const s of L.signs) if (vis(s.x - 200, 400)) drawSign(ctx, s);
    for (const cp of L.checkpoints) if (vis(cp.x - 60, 120)) Art.drawCheckpoint(ctx, cp.x, cp.y, cp.active, t);
    // Hindernisse
    for (const s of L.solids) if (vis(s.x - 30, s.w + 60)) ctx.drawImage(s.img.canvas, s.x - s.img.pad, s.y - s.img.pad);
    for (const s of L.movers) if (vis(s.x - 30, s.w + 60)) ctx.drawImage(s.img.canvas, s.x - s.img.pad, s.y - s.img.pad);
    for (const s of L.crates) if (vis(s.x - 30, s.w + 60)) ctx.drawImage(s.img.canvas, s.x - s.img.pad, s.y - s.img.pad);
    for (const gt of L.gates) if (vis(gt.x - 30, gt.w + 60)) ctx.drawImage(gt.img.canvas, gt.x - gt.img.pad, gt.y - gt.img.pad);
    const aw = L.arena.wall; if (aw.closed > 0) ctx.drawImage(aw.img.canvas, aw.x - aw.img.pad, aw.y - aw.img.pad);
    for (const s of L.switches) if (vis(s.x - 40, 80)) Art.drawSwitch(ctx, s.x, s.y, s.on, t);
    // Lava
    for (const v of L.vents) if (vis(v.x - 60, 120)) {
      Art.ell(ctx, v.x, FLOOR, 46, 12); ctx.fillStyle = '#2a1010'; ctx.fill(); Art.ell(ctx, v.x, FLOOR - 2, 30, 6); ctx.fillStyle = v.warn || v.active ? '#ff8a2a' : '#7a2a10'; ctx.fill();
      if (v.active) { const h = 420 * v.k; const gg = ctx.createLinearGradient(0, FLOOR - h, 0, FLOOR); gg.addColorStop(0, 'rgba(255,220,80,0)'); gg.addColorStop(0.3, 'rgba(255,140,30,0.85)'); gg.addColorStop(1, 'rgba(255,60,10,0.95)'); ctx.fillStyle = gg; ctx.beginPath(); ctx.moveTo(v.x - 30, FLOOR); for (let y = 0; y <= h; y += 30) ctx.lineTo(v.x - 30 - Math.sin(t * 20 + y * 0.1) * 8 + y * 0.03, FLOOR - y); for (let y = h; y >= 0; y -= 30) ctx.lineTo(v.x + 30 + Math.sin(t * 18 + y * 0.1) * 8 - y * 0.03, FLOOR - y); ctx.fill(); }
    }
    // Sammelobjekte
    for (const ch of L.chests) if (vis(ch.x - 60, 120)) Art.drawChest(ctx, ch.x, ch.y, ch.open, t);
    for (const s of L.shells) if (!s.got && vis(s.x - 20, 40)) { if (s.egg) { ctx.fillStyle = `rgba(255,240,150,${0.25 + 0.15 * Math.sin(t * 4 + s.x)})`; ctx.beginPath(); ctx.arc(s.x, s.y, 17, 0, 7); ctx.fill(); } Art.drawShell(ctx, s.x, s.y, t, 1); }
    for (const p of L.pearls) if (!p.got && vis(p.x - 30, 60)) Art.drawPearl(ctx, p.x, p.y, t, 11);
    if (L.magic && !L.magic.got) Art.drawPearl(ctx, L.magic.x, L.magic.y + Math.sin(t * 2) * 10, t, 26, true);
    // Gegner
    for (const e of L.enemies) if (vis(e.x - 120, 240)) Art.drawEnemy(ctx, e, t, L.wid);
    // Boss
    if (L.boss && !L.boss.gone) Art.drawBoss(ctx, L.W.boss, L.boss.x, L.boss.y, 1.25, { t, hit: L.boss.hit, defeat: L.boss.defeat, talk: L.boss.talk, lampOn: L.boss.lampOn });
    // Spur + Begleiter + Delfin
    drawTrail(ctx);
    if (d.cos.companion) Art.drawCompanion(ctx, d.cos.companion, d.comp.x, d.comp.y, t, d.facing);
    let dx = d.x, dy = d.y, ang = d.angle;
    if (d.lunge >= 0) { dx += Math.sin(d.lunge * Math.PI) * 140; dy -= Math.sin(d.lunge * Math.PI) * 90; }
    if (L.state === 'victory') { dy -= Math.sin(d.jump * Math.PI) * 160; ang = -d.jump * Math.PI * 2; }
    const sp = Math.min(1, Math.hypot(d.vx, d.vy) / MAXV);
    const slap = d.lunge >= 0 ? Math.min(1, d.lunge * 1.6) : d.slapT >= 0 ? d.slapT / SLAP_DUR : -1;
    Art.drawDolphin(ctx, { x: dx, y: dy, facing: d.facing, angle: ang, color: d.color, t: d.t, slap, hurt: d.invuln > 0 && L.state !== 'dead', cos: d.cos, speed: sp, happy: L.state === 'victory' || L.state === 'collect' });
    // Partikel + Effekte
    for (const p of L.parts) {
      const a = Math.max(0, p.life / p.max);
      if (p.type === 'bubble') { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.strokeStyle = `rgba(230,250,255,${a * 0.8})`; ctx.lineWidth = 1.5; ctx.stroke(); }
      else if (p.type === 'star') { ctx.globalAlpha = a; Art.star(ctx, p.x, p.y, p.r + 2, '#ffe04a'); ctx.globalAlpha = 1; }
      else if (p.type === 'spark') { ctx.fillStyle = `rgba(255,240,150,${a})`; ctx.fillRect(p.x - 2, p.y - 2, 4, 4); }
      else if (p.type === 'ember') { ctx.fillStyle = `rgba(255,${120 + Math.random() * 100 | 0},40,${a})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 0.7, 0, 7); ctx.fill(); }
    }
    for (const f of L.fx) {
      const k = f.t / f.max;
      if (f.type === 'ring') { ctx.beginPath(); ctx.arc(f.x, f.y, 20 + k * 70, 0, 7); ctx.strokeStyle = `rgba(220,250,255,${1 - k})`; ctx.lineWidth = 6 * (1 - k) + 1; ctx.stroke(); ctx.beginPath(); ctx.arc(f.x, f.y, 10 + k * 45, -1, 1); ctx.stroke(); }
      if (f.type === 'text') { ctx.globalAlpha = 1 - k * k; ctx.font = 'bold 26px Fredoka, sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 5; ctx.strokeStyle = '#0a2a4a'; ctx.strokeText(f.text, f.x, f.y - k * 40); ctx.fillStyle = f.col; ctx.fillText(f.text, f.x, f.y - k * 40); ctx.globalAlpha = 1; }
    }
    // Tintenwolken
    for (const k of L.ink) if (vis(k.x - k.r, k.r * 2)) {
      const a = k.max < 1e9 ? Math.min(1, k.life / 1.5) : 1; const gg = ctx.createRadialGradient(k.x, k.y, 0, k.x, k.y, k.r);
      gg.addColorStop(0, `rgba(20,8,40,${0.92 * a})`); gg.addColorStop(0.6, `rgba(30,12,60,${0.75 * a})`); gg.addColorStop(1, 'rgba(30,12,60,0)');
      ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(k.x, k.y, k.r, 0, 7); ctx.fill();
    }
    ctx.restore();
    // Dunkelheit (Welt 7)
    if (L.W.mech.dark) drawDark(ctx, sx, sy);
    // Umgebungsblasen
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    const pt = th.particles;
    for (let i = 0; i < 28; i++) {
      const px = ((i * 197 - c.x * 0.3) % VW + VW) % VW, py = VH - ((t * (20 + i % 5 * 8) + i * 83) % (VH + 40));
      if (pt === 'snow') { ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.arc(px + Math.sin(t + i) * 10, VH - py, 2 + i % 3, 0, 7); ctx.fill(); }
      else if (pt === 'embers') { ctx.fillStyle = `rgba(255,${100 + i * 5},40,0.6)`; ctx.fillRect(px, py, 3, 3); }
      else if (pt === 'glow' || pt === 'spores') { ctx.fillStyle = pt === 'glow' ? 'rgba(160,255,240,0.5)' : 'rgba(220,255,160,0.45)'; ctx.beginPath(); ctx.arc(px + Math.sin(t + i) * 14, py, 2, 0, 7); ctx.fill(); }
      else { ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(px + Math.sin(t * 1.5 + i) * 6, py, 2 + i % 4, 0, 7); ctx.stroke(); }
    }
    drawHUD(ctx);
    // Titelkarte / Tod
    if (L.state === 'title') {
      const a = L.stateT < 0.3 ? L.stateT / 0.3 : L.stateT > 1.8 ? Math.max(0, 1 - (L.stateT - 1.8) / 0.4) : 1;
      ctx.globalAlpha = a; banner(ctx, VW / 2, VH / 2 - 40, 'Welt ' + L.wid, L.W.name, 560); ctx.globalAlpha = 1;
    }
    if (L.state === 'dead') { ctx.fillStyle = `rgba(0,10,30,${Math.min(0.8, L.stateT)})`; ctx.fillRect(0, 0, VW, VH); ctx.font = 'bold 44px Fredoka, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText('Keine Herzen mehr – zurück zum Checkpoint!', VW / 2, VH / 2); }
  }
  function drawDark(ctx, sx, sy) {
    if (!dark) { dark = document.createElement('canvas'); dark.width = VW; dark.height = VH; }
    const g = dark.getContext('2d'); const c = L.cam;
    g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, VW, VH); g.fillStyle = 'rgba(1,4,16,0.94)'; g.fillRect(0, 0, VW, VH);
    g.globalCompositeOperation = 'destination-out';
    const hole = (x, y, r) => { const gg = g.createRadialGradient(x, y, r * 0.25, x, y, r); gg.addColorStop(0, 'rgba(0,0,0,1)'); gg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gg; g.fillRect(x - r, y - r, r * 2, r * 2); };
    hole(L.d.x - c.x + sx, L.d.y - c.y + sy, 250);
    for (const l of L.lights) if (Math.abs(l.x - c.x - VW / 2) < VW) hole(l.x - c.x, l.y - c.y, 110);
    for (const e of L.enemies) if (e.type === 'lantern') hole(e.x - c.x, e.y - c.y, 80);
    for (const p of L.pearls) if (!p.got) hole(p.x - c.x, p.y - c.y, 50);
    if (L.boss && !L.boss.gone) hole(L.boss.x - c.x, L.boss.y - c.y, L.boss.lampOn ? 420 : 160);
    if (L.magic) hole(L.magic.x - c.x, L.magic.y - c.y, 140);
    ctx.drawImage(dark, 0, 0);
  }
  function drawTrail(ctx) {
    const d = L.d, tr = d.cos.trail; if (!tr || d.trail.length < 2) return;
    const n = d.trail.length;
    if (tr === 'trail-regenbogen') {
      ['#ff5a5a', '#ffb13a', '#ffe94a', '#5ee36a', '#4ab8ff', '#9a6aff'].forEach((col, j) => { ctx.beginPath(); d.trail.forEach((p, i) => { const y = p.y - 10 + j * 4; i ? ctx.lineTo(p.x, y) : ctx.moveTo(p.x, y); }); ctx.strokeStyle = col; ctx.globalAlpha = 0.7; ctx.lineWidth = 4; ctx.stroke(); });
      ctx.globalAlpha = 1; return;
    }
    d.trail.forEach((p, i) => {
      const a = i / n; if (i % 2) return;
      if (tr === 'trail-sterne') { ctx.globalAlpha = a; Art.star(ctx, p.x + Math.sin(i) * 6, p.y + Math.cos(i * 1.3) * 8, 3 + a * 6, '#ffe04a'); ctx.globalAlpha = 1; }
      else { ctx.beginPath(); ctx.arc(p.x + Math.sin(i) * 5, p.y + Math.cos(i * 1.7) * 7, 2 + a * 6, 0, 7); ctx.strokeStyle = `rgba(220,250,255,${a})`; ctx.lineWidth = 2; ctx.stroke(); }
    });
  }
  function drawSign(ctx, s) {
    ctx.save(); ctx.font = 'bold 20px Fredoka, sans-serif'; const w = ctx.measureText(s.text).width + 36;
    Art.rr(ctx, s.x - 6, s.y - 120, 12, 120, 3); Art.fillS(ctx, '#8a5a2a', 2.5, '#3a2010');
    Art.rr(ctx, s.x - w / 2, s.y - 168, w, 52, 10); Art.fillS(ctx, '#f4e2b0', 3.5, '#7a5420');
    ctx.fillStyle = '#4a2a10'; ctx.textAlign = 'center'; ctx.fillText(s.text, s.x, s.y - 135); ctx.restore();
  }
  function banner(ctx, x, y, top, main, w) {
    ctx.save(); ctx.textAlign = 'center';
    Art.rr(ctx, x - w / 2, y - 60, w, 130, 22); const g = ctx.createLinearGradient(0, y - 60, 0, y + 70); g.addColorStop(0, '#8a5a2a'); g.addColorStop(1, '#5a3418'); Art.fillS(ctx, g, 5, '#ffcc4a');
    ctx.font = 'bold 26px Fredoka, sans-serif'; ctx.fillStyle = '#ffe08a'; ctx.fillText(top, x, y - 18);
    ctx.font = 'bold 36px Fredoka, sans-serif'; ctx.lineWidth = 6; ctx.strokeStyle = '#2a1408'; ctx.strokeText(main, x, y + 30); ctx.fillStyle = '#fff'; ctx.fillText(main, x, y + 30);
    ctx.restore();
  }
  function heart(ctx, x, y, s, full) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.beginPath(); ctx.moveTo(0, 6); ctx.bezierCurveTo(-14, -4, -10, -16, 0, -9); ctx.bezierCurveTo(10, -16, 14, -4, 0, 6);
    Art.fillS(ctx, full ? '#ff3a5a' : 'rgba(255,255,255,0.25)', 1.6, '#5a0a1a'); if (full) { Art.ell(ctx, -5, -8, 2.5, 1.6, -0.5); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fill(); } ctx.restore();
  }
  function hudPill(ctx, x, y, w) { Art.rr(ctx, x, y, w, 46, 23); ctx.fillStyle = 'rgba(8,30,60,0.72)'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(255,210,90,0.85)'; ctx.stroke(); }
  function drawHUD(ctx) {
    ctx.save(); ctx.font = 'bold 26px Fredoka, sans-serif'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    hudPill(ctx, 16, 14, 150); for (let i = 0; i < 3; i++) heart(ctx, 46 + i * 44, 39, 1.55, i < L.hearts);
    hudPill(ctx, 176, 14, 130); Art.drawShell(ctx, 204, 36, 0, 1.05); ctx.fillStyle = '#fff'; ctx.fillText(String(L.shellsGot), 228, 38);
    hudPill(ctx, 316, 14, 170); Art.star(ctx, 344, 37, 14, '#ffd23a'); ctx.fillStyle = '#fff'; ctx.fillText(MathGen.fmt(L.score), 366, 38);
    hudPill(ctx, 496, 14, 140); ctx.beginPath(); ctx.arc(522, 37, 13, 0, 7); Art.fillS(ctx, '#fff', 3, '#ffd23a'); ctx.beginPath(); ctx.moveTo(522, 37); ctx.lineTo(522, 29); ctx.moveTo(522, 37); ctx.lineTo(528, 40); Art.stroke(ctx, 2.5, '#0a2a4a');
    const s = Math.floor(L.time); ctx.fillStyle = '#fff'; ctx.fillText(String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'), 544, 38);
    ctx.font = 'bold 20px Fredoka, sans-serif'; const nm = 'Welt ' + L.wid + ': ' + L.W.short; const nw = ctx.measureText(nm).width + 40;
    hudPill(ctx, 646, 14, nw); ctx.fillStyle = '#ffe08a'; ctx.fillText(nm, 666, 38);
    // Boss-Energie
    if (L.boss && !L.boss.gone && L.state !== 'bossIntro') {
      const b = L.boss, w = 420, x = VW / 2 - w / 2, y = 80; hudPill(ctx, x - 10, y - 6, w + 20);
      ctx.font = 'bold 20px Fredoka, sans-serif'; ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.fillText(L.W.bossName, x + 8, y + 17);
      const bw = (w - 120) / b.max; for (let i = 0; i < b.max; i++) { Art.rr(ctx, x + 110 + i * bw, y + 6, bw - 5, 22, 6); Art.fillS(ctx, i < b.hp ? '#ff5a6a' : 'rgba(255,255,255,0.18)', 2, '#2a0a1a'); }
    }
    // Abklingzeit Flossenschlag
    const d = L.d; if (d.slapCd > 0 && (L.state === 'play' || L.state === 'collect')) { ctx.beginPath(); ctx.arc(d.x - L.cam.x, d.y - L.cam.y - 46, 9, -Math.PI / 2, -Math.PI / 2 + (1 - d.slapCd / SLAP_CD) * Math.PI * 2); ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 4; ctx.stroke(); }
    ctx.restore();
  }

  Game._build = build;
  root.Game = Game;
})(window);
