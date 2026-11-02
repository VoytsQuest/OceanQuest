// Browser-Test (Playwright): node tests/browser.test.js <url> <shotdir>
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://localhost:8765/';
const out = process.argv[3] || '.';
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = []; p.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/fonts|ERR_|Failed to load resource/.test(m.text())) errs.push(m.text()); });
  await p.goto(url); await p.waitForTimeout(800); await p.screenshot({ path: out + '/00-splash.png' }); await p.click('.sp-sub'); await p.waitForTimeout(1500); await p.screenshot({ path: out + '/00-intro.png' }); await p.click('#sp-skip'); await p.waitForTimeout(800);
  await p.screenshot({ path: out + '/01-menu.png' });
  await p.click('[data-act=new]'); await p.waitForTimeout(300);
  await p.fill('#dname', 'Flipper'); await p.click('.swatch[data-arg=rosa]');
  await p.screenshot({ path: out + '/02-create.png' });
  await p.click('[data-act=createdone]'); await p.waitForTimeout(2600);
  // Spielen: nach rechts schwimmen + Flossenschlag
  await p.keyboard.down('ArrowRight'); await p.waitForTimeout(900); await p.keyboard.press('Space'); await p.waitForTimeout(500); await p.keyboard.up('ArrowRight');
  await p.screenshot({ path: out + '/03-world1.png' });
  const moved = await p.evaluate(() => Game.L.d.x); console.log('Delfin x nach Bewegung:', Math.round(moved));
  await p.keyboard.press('KeyM'); await p.waitForTimeout(200);
  console.log('Track nach M:', await p.evaluate(() => Sound.current().title));

  // Erreichbarkeit aller Level (Gitter-Suche mit Delfin-Hitbox; Tore offen, Mover in Ruhelage ignoriert = beweglich)
  const reach = await p.evaluate(() => {
    const res = [];
    for (let w = 1; w <= 8; w++) {
      const L = Game._build(w); const cell = 10, HW = 32, HH = 15; const W = Math.ceil(L.length / cell), H = Math.ceil(960 / cell);
      const solids = L.solids.concat(L.crates.map(c => ({ ...c, x: c.x + 250 })));
      const blocked = new Uint8Array(W * H);
      for (let gx = 0; gx < W; gx++) for (let gy = 0; gy < H; gy++) {
        const x = gx * cell, y = gy * cell;
        if (y < 50 + HH || y > 910 - HH) { blocked[gy * W + gx] = 1; continue; }
        for (const s of solids) if (x - HW < s.x + s.w && x + HW > s.x && y - HH < s.y + s.h && y + HH > s.y) { blocked[gy * W + gx] = 1; break; }
      }
      const start = Math.floor(520 / cell) * W + Math.floor(200 / cell); const seen = new Uint8Array(W * H); const q = [start]; seen[start] = 1; let maxX = 0;
      while (q.length) { const i = q.pop(); const gx = i % W, gy = (i / W) | 0; if (gx > maxX) maxX = gx; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = gx + dx, ny = gy + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const j = ny * W + nx; if (!seen[j] && !blocked[j]) { seen[j] = 1; q.push(j); } } }
      const sw = L.switches.every(s => { const gx = Math.round(s.x / cell), gy = Math.round((s.y - 40) / cell); for (let dx = -8; dx <= 8; dx++) for (let dy = -8; dy <= 8; dy++) if (seen[(gy + dy) * W + gx + dx]) return true; return false; });
      const shellsReach = L.shells.filter(s => { const gx = Math.round(s.x / cell), gy = Math.round(s.y / cell); for (let dx = -3; dx <= 3; dx++) for (let dy = -3; dy <= 3; dy++) if (seen[(gy + dy) * W + gx + dx]) return true; return false; }).length;
      res.push({ w, length: L.length, reachedX: maxX * cell, arena: L.arena.x, ok: maxX * cell > L.arena.x + 300, switchesReachable: sw, shells: shellsReach + '/' + L.shells.length, enemies: L.enemies.length });
    }
    return res;
  });
  console.table(reach);

  // Boss-Test Welt 1: zur Arena teleportieren
  await p.evaluate(() => { const L = Game.L; L.gates.forEach(g => { g.opening = true; g.open = 1; g.y = g.y0 - (g.h - 70); }); L.d.x = L.arena.x + 260; L.d.y = 540; });
  await p.waitForTimeout(2600); await p.screenshot({ path: out + '/04-boss-dialog.png' });
  for (let i = 0; i < 4; i++) { if (await p.$('#dialog')) { await p.click('#dialog'); await p.waitForTimeout(150); await p.click('#dialog'); await p.waitForTimeout(200); } }
  await p.waitForTimeout(500); await p.screenshot({ path: out + '/05-boss-math.png' });
  // Aufgaben richtig beantworten
  for (let k = 0; k < 6; k++) {
    const done = await p.evaluate(() => !document.querySelector('.mathpanel'));
    if (done) break;
    await p.evaluate(() => {
      // Aktuelle Aufgabe aus dem Generator ist nicht direkt sichtbar → richtige Antwort via Prüfung aller Optionen finden
      const panel = document.querySelector('.mathpanel'); const choices = panel.querySelectorAll('.choice');
      if (choices.length) { window.__tryChoices = [...choices].map(c => c.dataset.v); }
    });
    // falsch einmal testen, dann Lösung über Testhook
    await p.evaluate(() => { const ans = window.__lastTask; });
    await p.waitForTimeout(100);
    await p.evaluate(() => UI._cur && UI._cur.solve());
    await p.waitForTimeout(1800);
  }
  await p.screenshot({ path: out + '/06-after-math.png' });
  console.log('Fehler:', errs.length ? errs : 'keine');
  await b.close();
})();
