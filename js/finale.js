/* OceanQuest – Das große Finale: Unterwasser-Fußball gegen Mbappé (spielt sich wie Airhockey) */
(function (root) {
  'use strict';
  const VW = 1280, VH = 720;
  const F = { x: 110, y: 196, w: 1060, h: 492 };
  const MID = F.x + F.w / 2, MIDY = F.y + F.h / 2, GH = 250, GY0 = MIDY - GH / 2, GY1 = MIDY + GH / 2;
  const RB = 19, RP = 40, RA = 50;
  const TAUNTS = {
    ai: ['Tooor! Siehst du? Unbesiegbar!', 'Zu schnell für dich, kleiner Delfin!', 'Das nennt man Megalodon-Power!', 'Hast du das überhaupt gesehen?'],
    player: ['WAS?! Der Schiri hat geschlafen!', 'Okay … das war ein schönes Tor.', 'Mein T-Shirt ist schuld!', 'Glück gehabt! Nochmal schaffst du das nicht!'],
    lose: 'Ha! Der König der Tiefsee bleibt ungeschlagen! Revanche?',
    win: 'Ich … ich gebe auf. Du bist der wahre Meister der acht Meere!'
  };
  const KINDS = ['begleiter-ente', 'begleiter-krabbe', 'begleiter-krake', 'begleiter-kugelfisch', 'begleiter-seepferdchen', 'begleiter-babyhai', 'schildkroete', 'fish', 'jelly', 'puffer'];
  let S = null;

  const ENEMY_T = ['fish', 'jelly', 'puffer', 'crab', 'piranha', 'inkpus', 'lantern'];
  function spectators(O) {
    const r = Art.rng(77), list = [], KINDS = O.kinds;
    const rows = [{ y: 66, s: 0.75 }, { y: 112, s: 0.9 }, { y: 158, s: 1.05 }];
    rows.forEach((row, ri) => { for (let x = 40 + ri * 20; x < VW - 20; x += 62 + r() * 18) if (ri < 2 || x < 220 || x > 1100) list.push({ x, y: row.y, s: row.s, kind: KINDS[Math.floor(r() * KINDS.length)], ph: r() * 6, seed: Math.floor(r() * 10), boss: null }); });
    // Die besiegten Bosse sitzen in der VIP-Reihe
    if (O.vip) ['willy', 'timmy', 'guenther', 'bob', 'lama', 'otto', 'herbert'].forEach((b, i) => list.push({ x: 250 + i * 128 + (i > 2 ? 40 : 0), y: 176, s: 1, boss: b, ph: i }));
    return list.sort((a, b) => a.y - b.y);
  }

  const Finale = {
    active: false, paused: false, onEnd: null,
    start(onEnd, opts) {
      this.onEnd = onEnd; this.active = true; this.paused = false;
      const O = Object.assign({ boss: 'mbappe', name: 'Mbappé', win: 5, ai: 330, scale: 0.3, theme: null, stadium: 'OCEANQUEST CUP · VOYTSQUEST', taunts: TAUNTS, vip: true, kinds: KINDS, track: 9 }, opts || {});
      S = { o: O, t: 0, state: 'intro', st: 0, ps: 0, as: 0, ball: { x: MID, y: MIDY, vx: 0, vy: 0, rot: 0 }, p: { x: F.x + 170, y: MIDY, vx: 0, vy: 0 }, a: { x: F.x + F.w - 170, y: MIDY, vx: 0, vy: 0, tx: F.x + F.w - 170, ty: MIDY, think: 0 },
        spec: spectators(O), cheer: 0, sad: 0, msg: '', msgT: 0, banner: '', bannerT: 0, sprint: 0, sprintCd: 0, pointer: null, parts: [], lastHit: 0, stillT: 0 };
      Sound.forWorld(O.track);
    },
    kickoff() { S.state = 'count'; S.st = 0; },
    stop() { this.active = false; S = null; },
    update(dt, ev) {
      if (!S || this.paused) return;
      S.t += dt; S.st += dt; S.msgT -= dt; S.bannerT -= dt; S.cheer = Math.max(0, S.cheer - dt); S.sad = Math.max(0, S.sad - dt);
      if (S.state === 'count' && S.st > 2.4) { S.state = 'play'; S.st = 0; whistle(); }
      if (S.state === 'goal' && S.st > 2.0) { resetPositions(); if (S.ps >= S.o.win || S.as >= S.o.win) { S.state = 'end'; S.st = 0; const won = S.ps >= S.o.win; say(won ? S.o.taunts.win : S.o.taunts.lose, 6); Sound.sfx(won ? 'certificate' : 'wrong'); if (won) S.cheer = 6; setTimeout(() => this.onEnd && this.onEnd(won, S.ps + ':' + S.as), 2200); } else { S.state = 'count'; S.st = 0.9; } }
      const n = 4, h = dt / n;
      for (let i = 0; i < n; i++) step(h, ev && i === 0 ? ev : null);
      for (let i = S.parts.length - 1; i >= 0; i--) { const p = S.parts[i]; p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.g || 0) * dt; if (p.life <= 0) S.parts.splice(i, 1); }
      if (S.parts.length > 240) S.parts.splice(0, S.parts.length - 240);
    },
    render(ctx) { if (S) render(ctx); },
    pointer(type, x, y) {
      if (!S) return;
      if (type === 'up') { S.pointer = null; return; }
      if (type === 'down' && (x > MID || y < F.y - 30)) return;
      if (type === 'down' || S.pointer) S.pointer = { x, y };
    }
  };

  function say(text, dur) { S.msg = text; S.msgT = dur || 2.6; }
  function whistle() { Sound.tone && (Sound.tone(2300, 0.18, 'square', 0.07), Sound.tone(2500, 0.32, 'square', 0.07, null, 0.2)); }
  function resetPositions() {
    S.p.x = F.x + 170; S.p.y = MIDY; S.p.vx = S.p.vy = 0;
    S.a.x = F.x + F.w - 170; S.a.y = MIDY; S.a.vx = S.a.vy = 0;
    const toAI = S.lastGoal === 'player';
    S.ball.x = MID + (toAI ? 70 : -70); S.ball.y = MIDY; S.ball.vx = S.ball.vy = 0;
  }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function moveMallet(m, dx, dy, maxV, dt, minX, maxX, r) {
    const k = Math.min(1, dt * 14); m.vx += (dx - m.vx) * k; m.vy += (dy - m.vy) * k;
    const sp = Math.hypot(m.vx, m.vy); if (sp > maxV) { m.vx *= maxV / sp; m.vy *= maxV / sp; }
    m.x = clamp(m.x + m.vx * dt, minX, maxX); m.y = clamp(m.y + m.vy * dt, F.y + r, F.y + F.h - r);
  }
  function collide(m, r) {
    const b = S.ball; const dx = b.x - m.x, dy = b.y - m.y, d = Math.hypot(dx, dy);
    if (d >= r + RB || d === 0) return false;
    const nx = dx / d, ny = dy / d; b.x = m.x + nx * (r + RB + 0.5); b.y = m.y + ny * (r + RB + 0.5);
    const rvx = b.vx - m.vx, rvy = b.vy - m.vy, dot = rvx * nx + rvy * ny;
    if (dot < 0) { b.vx -= 1.9 * dot * nx; b.vy -= 1.9 * dot * ny; }
    let sp = Math.hypot(b.vx, b.vy); if (sp < 470) { b.vx += nx * (470 - sp); b.vy += ny * (470 - sp); sp = Math.hypot(b.vx, b.vy); }
    if (sp > 1150) { b.vx *= 1150 / sp; b.vy *= 1150 / sp; }
    // Eingeklemmt an der Bande? Dann weicht die Figur zurück, der Ball rutscht entlang der Bande
    walls(b); const d2 = Math.hypot(b.x - m.x, b.y - m.y);
    if (d2 < r + RB - 1) { const qx = (m.x - b.x) / (d2 || 1), qy = (m.y - b.y) / (d2 || 1); m.x = b.x + qx * (r + RB); m.y = b.y + qy * (r + RB); m.vx = qx * 120; m.vy = qy * 120;
      const along = Math.abs(qx) > Math.abs(qy) ? 'y' : 'x'; if (along === 'x') { b.vx = (b.x < MID ? 1 : -1) * 420; b.vy *= 0.2; } else { b.vy = (b.y < MIDY ? 1 : -1) * 420; b.vx *= 0.2; } }
    if (S.t - S.lastHit > 0.12) { Sound.sfx('knock'); for (let i = 0; i < 6; i++) bubble(b.x, b.y); S.lastHit = S.t; }
    return true;
  }
  function bubble(x, y) { const a = Math.random() * 6.28, s = 30 + Math.random() * 90; S.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40, life: 0.8, type: 'b', r: 2 + Math.random() * 4 }); }

  function step(dt, ev) {
    const play = S.state === 'play'; const P = S.p, A = S.a, b = S.ball;
    // Spieler
    S.sprint -= dt; S.sprintCd -= dt;
    if (ev && ev.action && S.sprintCd <= 0 && play) { S.sprint = 0.45; S.sprintCd = 1.4; Sound.sfx('slap'); }
    const boost = S.sprint > 0 ? 1.55 : 1;
    let dx = 0, dy = 0, maxV = 560 * boost;
    if (S.pointer) { dx = (S.pointer.x - P.x) * 12; dy = (S.pointer.y - P.y) * 12; maxV = 700; }
    else { let ix = (Input.right ? 1 : 0) - (Input.left ? 1 : 0), iy = (Input.down ? 1 : 0) - (Input.up ? 1 : 0); const l = Math.hypot(ix, iy); if (l) { ix /= l; iy /= l; } dx = ix * maxV; dy = iy * maxV; }
    if (!play && S.state !== 'count') { dx = dy = 0; }
    moveMallet(P, dx, dy, maxV, dt, F.x + RP - 6, MID - RP, RP);
    // KI: Mbappé
    A.think -= dt;
    if (A.think <= 0) {
      A.think = 0.18 + Math.random() * 0.14; const goalX = F.x, goalY = MIDY;
      if (b.x > MID - 20) {
        let gx = b.x - goalX, gy = b.y - goalY; const gl = Math.hypot(gx, gy) || 1; gx /= gl; gy /= gl;
        const bx = b.x + gx * (RB + RA + 14), by = b.y + gy * (RB + RA + 14);
        const feasible = bx < F.x + F.w - RA && by > F.y + RA && by < F.y + F.h - RA;
        if (!feasible) { A.tx = b.x; A.ty = b.y; }
        else if (A.x > b.x + 8 && Math.hypot(A.x - bx, A.y - by) < 70) { A.tx = b.x - gx * 30; A.ty = b.y - gy * 30; }
        else { A.tx = bx; A.ty = by; }
      } else { A.tx = F.x + F.w - 150 - Math.random() * 60; A.ty = MIDY + (b.y - MIDY) * 0.55; }
      A.tx += (Math.random() - 0.5) * 24; A.ty += (Math.random() - 0.5) * 24;
    }
    const aiMax = (S.o.ai + (S.ps - S.as) * 18) * (play ? 1 : 0.6);
    moveMallet(A, play ? (A.tx - A.x) * 7 : 0, play ? (A.ty - A.y) * 7 : 0, aiMax, dt, MID + RA, F.x + F.w - RA + 6, RA);
    if (!play) { b.vx *= 0.9; b.vy *= 0.9; return; }
    // Ball
    b.x += b.vx * dt; b.y += b.vy * dt; const fr = Math.exp(-0.14 * dt); b.vx *= fr; b.vy *= fr; b.rot += (b.vx / RB) * dt;
    walls(b);
    collide(P, RP); collide(A, RA);
    walls(b);
    // Ball liegt fest? Sanft anstupsen
    if (Math.hypot(b.vx, b.vy) < 12) { S.stillT += dt; if (S.stillT > 3) { b.vx = (b.x > MID ? -1 : 1) * 160; b.vy = (Math.random() - 0.5) * 120; S.stillT = 0; } } else S.stillT = 0;
    // Ball klemmt in einer Ecke? Schiedsrichterball in der Mitte
    if (!S.anchor || Math.hypot(b.x - S.anchor.x, b.y - S.anchor.y) > 80) S.anchor = { x: b.x, y: b.y, t: 0 }; else S.anchor.t += dt;
    if (S.anchor.t > 3) { S.anchor = null; for (let i = 0; i < 12; i++) bubble(b.x, b.y); b.x = MID; b.y = MIDY; b.vx = 0; b.vy = (Math.random() < 0.5 ? -1 : 1) * 140; P.x = Math.min(P.x, MID - 160); A.x = Math.max(A.x, MID + 160); say('Schiedsrichterball!', 1.5); }
    // Tor?
    if (b.x < F.x - RB) goal('ai'); else if (b.x > F.x + F.w + RB) goal('player');
  }
  function walls(b) {
    if (b.y < F.y + RB) { b.y = F.y + RB; b.vy = Math.abs(b.vy) * 0.9; }
    if (b.y > F.y + F.h - RB) { b.y = F.y + F.h - RB; b.vy = -Math.abs(b.vy) * 0.9; }
    const inGoalY = b.y > GY0 + 4 && b.y < GY1 - 4;
    if (b.x < F.x + RB && !inGoalY) { b.x = F.x + RB; b.vx = Math.abs(b.vx) * 0.9; }
    if (b.x > F.x + F.w - RB && !inGoalY) { b.x = F.x + F.w - RB; b.vx = -Math.abs(b.vx) * 0.9; }
    for (const [px, py] of [[F.x, GY0], [F.x, GY1], [F.x + F.w, GY0], [F.x + F.w, GY1]]) { const ddx = b.x - px, ddy = b.y - py, d = Math.hypot(ddx, ddy); if (d < RB + 5 && d > 0) { const nx = ddx / d, ny = ddy / d; b.x = px + nx * (RB + 5); b.y = py + ny * (RB + 5); const dot = b.vx * nx + b.vy * ny; if (dot < 0) { b.vx -= 1.8 * dot * nx; b.vy -= 1.8 * dot * ny; } } }
    if (b.x < F.x || b.x > F.x + F.w) { b.y = clamp(b.y, GY0 + RB, GY1 - RB); }
  }
  function goal(who) {
    S.state = 'goal'; S.st = 0; S.lastGoal = who;
    if (who === 'player') { S.ps++; S.cheer = 2.4; Sound.sfx('bossDefeat'); S.banner = 'TOOOR!'; say(S.o.taunts.player[(S.ps - 1) % S.o.taunts.player.length]); for (let i = 0; i < 60; i++) S.parts.push({ x: F.x + F.w + 20, y: MIDY, vx: (Math.random() - 0.8) * 500, vy: (Math.random() - 0.5) * 500, life: 1.4, type: 'c', g: 300, col: ['#ffd23a', '#ff5a8a', '#5ad1ff', '#7aff9a'][i % 4] }); }
    else { S.as++; S.sad = 2; Sound.sfx('wrong'); S.banner = 'Tor für ' + S.o.name; say(S.o.taunts.ai[(S.as - 1) % S.o.taunts.ai.length]); }
    S.bannerT = 1.9;
  }

  /* ---------------- Zeichnen ---------------- */
  function render(ctx) {
    const t = S.t;
    // Wasser
    const g = ctx.createLinearGradient(0, 0, 0, VH); const th = S.o.theme; g.addColorStop(0, th ? th.top : '#2fb6d8'); g.addColorStop(0.35, th ? Art.shade(th.bottom, 15) : '#0f6ea3'); g.addColorStop(1, th ? th.bottom : '#073a62'); ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 7; i++) { const bx = i * 200 - 60 + Math.sin(t * 0.4 + i) * 30; const gg = ctx.createLinearGradient(0, 0, 0, 600); gg.addColorStop(0, `rgba(255,255,230,${0.1 + 0.04 * Math.sin(t + i)})`); gg.addColorStop(1, 'rgba(255,255,230,0)'); ctx.fillStyle = gg; ctx.beginPath(); ctx.moveTo(bx, 0); ctx.lineTo(bx + 60, 0); ctx.lineTo(bx + 220, 700); ctx.lineTo(bx + 100, 700); ctx.fill(); }
    ctx.restore();
    // Tribüne (Korallen-Stufen)
    for (let i = 0; i < 3; i++) { const y = 76 + i * 46; Art.rr(ctx, 0, y, VW, 50, 0); ctx.fillStyle = S.o.theme ? Art.shade(S.o.theme.rock[1], -10 - i * 12) : ['#5a6e8a', '#4e6280', '#435574'][i]; ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(0, y, VW, 4); }
    for (let x = 30; x < VW; x += 160) { ctx.fillStyle = ['#ff6a8a', '#ffb03a', '#c86ae8'][(x / 160 | 0) % 3]; ctx.beginPath(); ctx.arc(x, 74, 10, Math.PI, 0); ctx.fill(); }
    const jump = S.cheer > 0 ? 1 : 0;
    for (const s of S.spec) {
      const hop = jump ? Math.abs(Math.sin(t * 9 + s.ph)) * 16 : Math.abs(Math.sin(t * 1.5 + s.ph)) * 3;
      const sadDrop = S.sad > 0 && !s.boss ? 3 : 0;
      ctx.save(); ctx.translate(s.x, s.y - hop + sadDrop);
      if (s.boss) Art.drawBoss(ctx, s.boss, 0, -18, 0.2, { t: t + s.ph, talk: jump });
      else { ctx.scale(s.s, s.s);
        if (ENEMY_T.includes(s.kind)) Art.drawEnemy(ctx, { type: s.kind, x: 0, y: -14, r: 15, face: 1, seed: s.seed, knocked: false }, t);
        else Art.drawCompanion(ctx, s.kind, 0, -14, t + s.ph, 1); }
      if (jump && s.boss === null && Math.sin(s.ph * 7) > 0.3) { ctx.fillStyle = ['#ffd23a', '#ff5a8a', '#5ad1ff'][s.seed % 3]; ctx.fillRect(-2, -54, 4, 22); ctx.beginPath(); ctx.moveTo(2, -54); ctx.lineTo(24, -48); ctx.lineTo(2, -40); ctx.fill(); }
      ctx.restore();
    }
    // Banden
    Art.rr(ctx, F.x - 70, F.y - 22, F.w + 140, 16, 4); ctx.fillStyle = '#ffcc4a'; ctx.fill();
    ctx.font = 'bold 13px Fredoka, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#4a2a00';
    for (let x = F.x + 90; x < F.x + F.w; x += 260) ctx.fillText(S.o.stadium, x, F.y - 10);
    // Spielfeld (Seegras-Rasen)
    for (let i = 0; i < 10; i++) { ctx.fillStyle = i % 2 ? '#2f9a62' : '#36a86c'; ctx.fillRect(F.x + i * F.w / 10, F.y, F.w / 10 + 1, F.h); }
    const sh = ctx.createLinearGradient(0, F.y, 0, F.y + F.h); sh.addColorStop(0, 'rgba(20,90,140,0.28)'); sh.addColorStop(1, 'rgba(0,30,60,0.25)'); ctx.fillStyle = sh; ctx.fillRect(F.x, F.y, F.w, F.h);
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 4;
    ctx.strokeRect(F.x, F.y, F.w, F.h); ctx.beginPath(); ctx.moveTo(MID, F.y); ctx.lineTo(MID, F.y + F.h); ctx.stroke();
    ctx.beginPath(); ctx.arc(MID, MIDY, 74, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.arc(MID, MIDY, 5, 0, 7); ctx.fillStyle = '#fff'; ctx.fill();
    ctx.strokeRect(F.x, MIDY - 150, 150, 300); ctx.strokeRect(F.x + F.w - 150, MIDY - 150, 150, 300);
    ctx.beginPath(); ctx.arc(F.x + 150, MIDY, 60, -1.1, 1.1); ctx.stroke(); ctx.beginPath(); ctx.arc(F.x + F.w - 150, MIDY, 60, Math.PI - 1.1, Math.PI + 1.1); ctx.stroke();
    // Tore mit Netz
    drawGoal(ctx, F.x, -1); drawGoal(ctx, F.x + F.w, 1);
    // Bande unten
    ctx.fillStyle = '#0a2a4a'; ctx.fillRect(0, F.y + F.h + 6, VW, VH);
    for (let x = 0; x < VW; x += 30) { ctx.fillStyle = '#3aa84a'; ctx.beginPath(); ctx.moveTo(x, VH); ctx.quadraticCurveTo(x + 8 + Math.sin(t * 2 + x) * 4, VH - 18, x + 4, VH - 28); ctx.lineTo(x + 8, VH); ctx.fill(); }
    // Ball-Schatten, Figuren
    const P = S.p, A = S.a, b = S.ball;
    ctx.fillStyle = 'rgba(0,30,20,0.3)'; Art.ell(ctx, b.x + 6, b.y + 10, RB, RB * 0.55); ctx.fill(); Art.ell(ctx, P.x + 6, P.y + 26, 40, 12); ctx.fill(); Art.ell(ctx, A.x - 6, A.y + 34, 52, 14); ctx.fill();
    const d = Save.data; const cos = Save.cosmetics();
    if (cos.companion) Art.drawCompanion(ctx, cos.companion, F.x + 26, F.y + F.h - 26, t, 1);
    const sp = Math.min(1, Math.hypot(P.vx, P.vy) / 560);
    Art.drawDolphin(ctx, { x: P.x, y: P.y, facing: 1, angle: clamp(P.vy / 900, -0.4, 0.4), color: d.color, t, cos, scale: 0.78, speed: sp, slap: S.sprint > 0 ? 1 - S.sprint / 0.45 : -1, happy: S.cheer > 0 });
    ctx.save(); ctx.translate(A.x, A.y); ctx.scale(-1, 1); Art.drawBoss(ctx, S.o.boss, 0, 0, S.o.scale, { t, talk: S.msgT > 0 && S.lastGoal === 'ai' }); ctx.restore();
    drawBall(ctx, b);
    if (S.pointer) { ctx.beginPath(); ctx.arc(S.pointer.x, S.pointer.y, 16, 0, 7); ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 3; ctx.stroke(); }
    for (const p of S.parts) { const a = Math.max(0, p.life); if (p.type === 'b') { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.strokeStyle = `rgba(230,250,255,${a})`; ctx.lineWidth = 1.5; ctx.stroke(); } else { ctx.globalAlpha = Math.min(1, a); ctx.fillStyle = p.col; ctx.fillRect(p.x, p.y, 7, 10); ctx.globalAlpha = 1; } }
    // Anzeigetafel
    Art.rr(ctx, VW / 2 - 230, 8, 460, 58, 16); const sg = ctx.createLinearGradient(0, 8, 0, 66); sg.addColorStop(0, '#8a5a2a'); sg.addColorStop(1, '#5a3418'); Art.fillS(ctx, sg, 4, '#ffcc4a');
    ctx.font = 'bold 24px Fredoka, sans-serif'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff';
    ctx.textAlign = 'right'; ctx.fillText(d.name, VW / 2 - 70, 38); ctx.textAlign = 'left'; ctx.fillText(S.o.name, VW / 2 + 70, 38);
    ctx.textAlign = 'center'; ctx.font = 'bold 38px Fredoka, sans-serif'; ctx.fillStyle = '#ffe08a'; ctx.fillText(S.ps + ' : ' + S.as, VW / 2, 39);
    ctx.font = '500 15px Fredoka, sans-serif'; ctx.fillStyle = '#bfe8ff'; ctx.textBaseline = 'alphabetic'; ctx.fillText('Wer zuerst ' + S.o.win + ' Tore schießt, gewinnt', VW / 2, 86);
    // Sprechblase Mbappé
    if (S.msgT > 0) { ctx.font = 'italic 600 20px Fredoka, sans-serif'; const w = Math.min(560, ctx.measureText(S.msg).width + 40); const x = VW - w - 24, y = 92; Art.rr(ctx, x, y, w, 44, 16); Art.fillS(ctx, '#fff', 3, '#6a4a10'); ctx.fillStyle = '#3a2410'; ctx.textAlign = 'center'; ctx.fillText(S.msg, x + w / 2, y + 29, w - 20); }
    // Texte
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (S.state === 'count') { const n = Math.ceil(2.4 - S.st); big(ctx, n > 0 ? String(n) : 'Anpfiff!', 90); }
    if (S.state === 'goal' && S.bannerT > 0) big(ctx, S.banner, S.lastGoal === 'player' ? 110 : 64, S.lastGoal === 'player' ? '#ffd23a' : '#ff8a9a');
    if (S.state === 'end') big(ctx, S.ps >= S.o.win ? 'SIEG!' : 'Verloren …', 100, S.ps >= S.o.win ? '#ffd23a' : '#ff8a9a');
    if (S.sprintCd > 0 && S.state === 'play') { ctx.beginPath(); ctx.arc(P.x, P.y - 52, 9, -Math.PI / 2, -Math.PI / 2 + (1 - S.sprintCd / 1.4) * Math.PI * 2); ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 4; ctx.stroke(); }
    ctx.textBaseline = 'alphabetic';
  }
  function big(ctx, text, size, col) { ctx.font = `bold ${size}px Fredoka, sans-serif`; ctx.lineWidth = 10; ctx.strokeStyle = '#0a2a4a'; ctx.strokeText(text, VW / 2, MIDY); ctx.fillStyle = col || '#fff'; ctx.fillText(text, VW / 2, MIDY); }
  function drawGoal(ctx, x, dir) {
    const depth = 58; const x2 = x + dir * depth;
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(Math.min(x, x2), GY0, depth, GH);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1.5;
    for (let y = GY0; y <= GY1; y += 14) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y); ctx.stroke(); }
    for (let k = 0; k <= depth; k += 14) { ctx.beginPath(); ctx.moveTo(x + dir * k, GY0); ctx.lineTo(x + dir * k, GY1); ctx.stroke(); }
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, GY0); ctx.lineTo(x2, GY0); ctx.lineTo(x2, GY1); ctx.lineTo(x, GY1); ctx.stroke(); ctx.lineCap = 'butt';
  }
  function drawBall(ctx, b) {
    ctx.save(); ctx.translate(b.x, b.y); ctx.beginPath(); ctx.arc(0, 0, RB, 0, 7); ctx.fillStyle = '#fff'; ctx.fill(); ctx.clip(); ctx.rotate(b.rot);
    const pent = (x, y, r) => { ctx.beginPath(); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * Math.PI * 2 / 5; ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } ctx.closePath(); ctx.fillStyle = '#1a1a22'; ctx.fill(); };
    pent(0, 0, 7); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * Math.PI * 2 / 5 + Math.PI / 5; pent(Math.cos(a) * 17, Math.sin(a) * 17, 6); }
    ctx.strokeStyle = '#555'; ctx.lineWidth = 1; for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * Math.PI * 2 / 5; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 7, Math.sin(a) * 7); ctx.lineTo(Math.cos(a) * 13, Math.sin(a) * 13); ctx.stroke(); }
    ctx.restore();
    ctx.beginPath(); ctx.arc(b.x, b.y, RB, 0, 7); ctx.strokeStyle = '#2a2a3a'; ctx.lineWidth = 2; ctx.stroke();
    const hl = ctx.createRadialGradient(b.x - 6, b.y - 7, 1, b.x, b.y, RB); hl.addColorStop(0, 'rgba(255,255,255,0.7)'); hl.addColorStop(0.5, 'rgba(255,255,255,0)'); hl.addColorStop(1, 'rgba(0,0,0,0.25)'); ctx.fillStyle = hl; ctx.beginPath(); ctx.arc(b.x, b.y, RB, 0, 7); ctx.fill();
  }

  Finale._F = F; Finale._dbg = () => S;
  root.Finale = Finale;
})(window);
