/* OceanQuest – prozedurale Cartoon-Grafik (Canvas 2D) */
(function (root) {
  'use strict';
  const TAU = Math.PI * 2;
  const COLORS = {
    blau: { body: '#4aa6ec', dark: '#1d5c99', belly: '#e2f4ff', name: 'Blau' },
    rosa: { body: '#f58cbc', dark: '#a43c74', belly: '#ffe8f2', name: 'Rosa' },
    gruen: { body: '#4fcf8e', dark: '#1e7a4c', belly: '#e3fbea', name: 'Grün' },
    lila: { body: '#a57ce6', dark: '#56369a', belly: '#f1e8ff', name: 'Lila' },
    gelb: { body: '#f7cf43', dark: '#9a760c', belly: '#fff8da', name: 'Gelb' }
  };
  const OUT = '#16324f';

  function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; }; }
  function ell(ctx, x, y, rx, ry, rot) { ctx.beginPath(); ctx.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot || 0, 0, TAU); }
  function stroke(ctx, w, c) { ctx.lineWidth = w; ctx.strokeStyle = c || OUT; ctx.stroke(); }
  function fillS(ctx, fill, w, c) { ctx.fillStyle = fill; ctx.fill(); if (w) stroke(ctx, w, c); }
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); }

  /* ================= DELFIN ================= */
  function bodyPath(ctx) {
    ctx.beginPath();
    ctx.moveTo(66, 7);
    ctx.bezierCurveTo(62, 1, 52, 0, 43, -1);
    ctx.bezierCurveTo(42, -22, 24, -30, 4, -27);
    ctx.bezierCurveTo(-18, -24, -38, -14, -50, -4);
    ctx.lineTo(-55, -1);
    ctx.lineTo(-54, 3);
    ctx.bezierCurveTo(-36, 15, -12, 23, 14, 21);
    ctx.bezierCurveTo(36, 19, 54, 15, 66, 7);
    ctx.closePath();
  }
  function skinFill(ctx, c, skin, t) {
    if (skin === 'feuer') { const g = ctx.createLinearGradient(-55, 0, 64, 0); g.addColorStop(0, '#ffd23a'); g.addColorStop(0.45, '#ff7a1a'); g.addColorStop(1, '#e8261a'); return g; }
    if (skin === 'regenbogen') { const g = ctx.createLinearGradient(-55, -20, 64, 20); ['#ff5a5a', '#ffb13a', '#ffe94a', '#5ee36a', '#4ab8ff', '#9a6aff'].forEach((col, i) => g.addColorStop(i / 5, col)); return g; }
    if (skin === 'galaxie') { const g = ctx.createLinearGradient(-55, -20, 64, 20); g.addColorStop(0, '#2a1a6a'); g.addColorStop(0.5, '#6a2ab0'); g.addColorStop(1, '#2a3ab8'); return g; }
    if (skin === 'kristall') { const g = ctx.createLinearGradient(-55, -24, 64, 24); g.addColorStop(0, '#bff4ff'); g.addColorStop(0.5, '#7fd8f5'); g.addColorStop(1, '#e8fdff'); return g; }
    const g = ctx.createLinearGradient(0, -24, 0, 20); g.addColorStop(0, shade(c.body, -18)); g.addColorStop(0.5, c.body); g.addColorStop(1, shade(c.body, 12)); return g;
  }
  function shade(hex, p) {
    const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const f = p / 100; r = Math.round(Math.min(255, Math.max(0, r + (f > 0 ? (255 - r) * f : r * f)))); g = Math.round(Math.min(255, Math.max(0, g + (f > 0 ? (255 - g) * f : g * f)))); b = Math.round(Math.min(255, Math.max(0, b + (f > 0 ? (255 - b) * f : b * f))));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  /* o: {x,y,facing,angle,color,t,slap(0..1|-1),hurt,cos:{head,eyes,skin,fins},scale,speed,happy} */
  function drawDolphin(ctx, o) {
    const c = COLORS[o.color] || COLORS.blau; const cos = o.cos || {}; const s = o.scale || 1; const t = o.t || 0;
    const skin = cos.skin; const outline = skin === 'galaxie' ? '#160c3a' : (skin ? '#3a2a2a' : c.dark);
    ctx.save(); ctx.translate(o.x, o.y); ctx.scale((o.facing || 1) * s, s);
    let ang = o.angle || 0;
    if (o.slap >= 0) ang += Math.sin(o.slap * Math.PI) * -0.5 + (o.slap < 1 ? o.slap * TAU * 0 : 0);
    ctx.rotate(ang);
    const sp = o.speed === undefined ? 0.4 : o.speed;
    const wag = Math.sin(t * (5 + sp * 9)) * (0.22 + sp * 0.18) + (o.slap >= 0 ? Math.sin(o.slap * Math.PI) * 1.2 : 0);
    if (o.hurt && Math.floor(t * 20) % 2 === 0) ctx.globalAlpha = 0.45;
    const finFill = cos.fins === 'gold' ? '#ffcf3a' : cos.fins === 'hai' ? '#5d6f80' : null;
    const bodyFill = skinFill(ctx, c, skin, t);
    // Schwanzflosse
    ctx.save(); ctx.translate(-53, 1); ctx.rotate(wag);
    ctx.beginPath(); ctx.moveTo(4, 0); ctx.quadraticCurveTo(-6, -14, -24, -22); ctx.quadraticCurveTo(-16, -6, -18, 0); ctx.quadraticCurveTo(-16, 6, -24, 22); ctx.quadraticCurveTo(-6, 14, 4, 0);
    fillS(ctx, finFill || bodyFill, 2.5, outline); ctx.restore();
    // Rückenflosse
    ctx.beginPath();
    if (cos.fins === 'hai') { ctx.moveTo(8, -21); ctx.lineTo(-6, -50); ctx.quadraticCurveTo(-14, -34, -22, -18); }
    else { ctx.moveTo(2, -25); ctx.quadraticCurveTo(-4, -42, -17, -45); ctx.quadraticCurveTo(-11, -32, -20, -21); }
    fillS(ctx, finFill || bodyFill, 2.5, outline);
    // Körper
    bodyPath(ctx); ctx.fillStyle = bodyFill; ctx.fill();
    ctx.save(); bodyPath(ctx); ctx.clip();
    ell(ctx, 20, 19, 48, 13); ctx.fillStyle = skin === 'galaxie' ? 'rgba(200,170,255,0.35)' : skin ? 'rgba(255,255,255,0.45)' : c.belly; ctx.fill();
    if (skin === 'galaxie') { const r = rng(7); for (let i = 0; i < 26; i++) { ctx.fillStyle = `rgba(255,255,255,${0.5 + 0.5 * Math.sin(t * 3 + i)})`; ctx.fillRect(-55 + r() * 119, -24 + r() * 42, 2, 2); } }
    if (skin === 'kristall') { ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1.5; for (let i = -50; i < 60; i += 16) { ctx.beginPath(); ctx.moveTo(i, -24); ctx.lineTo(i + 10, 0); ctx.lineTo(i, 20); ctx.stroke(); } }
    if (skin === 'feuer') { ctx.fillStyle = 'rgba(255,240,120,0.6)'; for (let i = 0; i < 4; i++) { ctx.beginPath(); const fx = -40 + i * 22; ctx.moveTo(fx, -22); ctx.quadraticCurveTo(fx + 6, -10 + Math.sin(t * 8 + i) * 3, fx + 14, -22); ctx.fill(); } }
    if (cos.body && root.ArtExtras) root.ArtExtras.outfit(ctx, cos.body, t);
    ell(ctx, 6, -14, 34, 5, -0.05); ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.fill();
    ctx.restore();
    bodyPath(ctx); stroke(ctx, 2.8, outline);
    // Brustflosse
    const pf = Math.sin(t * 4) * 0.15;
    ctx.save(); ctx.translate(14, 9); ctx.rotate(0.35 + pf);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-4, 16, -16, 22); ctx.quadraticCurveTo(-8, 8, -10, -2); ctx.closePath();
    fillS(ctx, finFill || shade(c.body, -10), 2.2, outline);
    if (cos.body && root.ArtExtras) root.ArtExtras.sleeve(ctx, cos.body, t);
    ctx.restore();
    // Auge + Mund
    drawEye(ctx, 30, -10, o.happy, t);
    ctx.beginPath(); ctx.moveTo(42, 8); ctx.quadraticCurveTo(54, 15, 64, 8); stroke(ctx, 2.4, outline);
    if (o.happy) { ctx.beginPath(); ctx.moveTo(45, 9); ctx.quadraticCurveTo(54, 19, 62, 9); ctx.fillStyle = '#d0475f'; ctx.fill(); }
    ell(ctx, 38, 3, 5, 3); ctx.fillStyle = 'rgba(255,120,150,0.5)'; ctx.fill();
    if (cos.hair && root.ArtExtras) root.ArtExtras.wig(ctx, cos.hair, t);
    drawCosmetics(ctx, cos, t);
    ctx.restore();
  }
  function drawEye(ctx, x, y, happy, t) {
    const blink = (Math.floor(t * 10) % 37) === 0;
    if (happy || blink) { ctx.beginPath(); ctx.arc(x, y + 1, 4.5, Math.PI * 1.1, Math.PI * 1.9); stroke(ctx, 2.4, OUT); return; }
    ell(ctx, x, y, 7, 8); fillS(ctx, '#fff', 1.8, OUT);
    ell(ctx, x + 2, y + 0.8, 4.4, 5.2); ctx.fillStyle = '#111d33'; ctx.fill();
    ell(ctx, x + 3.4, y - 1.6, 1.8, 1.8); ctx.fillStyle = '#fff'; ctx.fill(); ell(ctx, x + 0.6, y + 3, 0.9, 0.9); ctx.fill();
  }
  function drawCosmetics(ctx, cos, t) {
    const h = cos.head, e = cos.eyes;
    if (e === 'taucherbrille') { rr(ctx, 26, -17, 18, 15, 5); fillS(ctx, 'rgba(150,230,255,0.55)', 2.5, '#e8a800'); ctx.beginPath(); ctx.moveTo(26, -10); ctx.lineTo(-2, -14); stroke(ctx, 3, '#e8a800'); }
    if (e === 'sonnenbrille') { ctx.beginPath(); ctx.moveTo(25, -14); ctx.lineTo(46, -14); ctx.lineTo(44, -4); ctx.quadraticCurveTo(34, 0, 27, -5); ctx.closePath(); fillS(ctx, '#111', 1.5, '#000'); ctx.beginPath(); ctx.moveTo(25, -13); ctx.lineTo(4, -17); stroke(ctx, 2.5, '#111'); ctx.beginPath(); ctx.moveTo(30, -12); ctx.lineTo(36, -12); stroke(ctx, 1.5, 'rgba(255,255,255,0.6)'); }
    if (e === 'schnorchel') { rr(ctx, 26, -17, 18, 15, 5); fillS(ctx, 'rgba(150,230,255,0.55)', 2.5, '#ff7a1a'); ctx.beginPath(); ctx.moveTo(26, -10); ctx.lineTo(0, -14); stroke(ctx, 3, '#ff7a1a'); ctx.beginPath(); ctx.moveTo(22, -14); ctx.lineTo(22, -46); ctx.quadraticCurveTo(22, -52, 28, -52); stroke(ctx, 5, '#ff7a1a'); }
    if (h === 'piratenhut') {
      ctx.save(); ctx.translate(14, -26); ctx.rotate(-0.12);
      ctx.beginPath(); ctx.moveTo(-28, 4); ctx.quadraticCurveTo(-20, -24, 0, -24); ctx.quadraticCurveTo(20, -24, 28, 4); ctx.quadraticCurveTo(0, -4, -28, 4); fillS(ctx, '#1e1e26', 2.5, '#000');
      ctx.beginPath(); ctx.moveTo(-28, 4); ctx.quadraticCurveTo(0, -4, 28, 4); stroke(ctx, 2.5, '#e8b400');
      ell(ctx, 0, -12, 5, 4.5); ctx.fillStyle = '#fff'; ctx.fill(); ctx.fillStyle = '#1e1e26'; ctx.fillRect(-3, -14, 2, 2); ctx.fillRect(1, -14, 2, 2);
      ctx.beginPath(); ctx.moveTo(-6, -4); ctx.lineTo(6, -2); ctx.moveTo(6, -4); ctx.lineTo(-6, -2); stroke(ctx, 1.6, '#fff');
      ctx.restore();
    }
    if (h === 'krone') {
      ctx.save(); ctx.translate(16, -26); ctx.rotate(-0.1);
      ctx.beginPath(); ctx.moveTo(-16, 4); ctx.lineTo(-18, -14); ctx.lineTo(-9, -5); ctx.lineTo(0, -18); ctx.lineTo(9, -5); ctx.lineTo(18, -14); ctx.lineTo(16, 4); ctx.closePath();
      fillS(ctx, '#ffcc2a', 2.5, '#a87a00'); ell(ctx, 0, -2, 3, 3); ctx.fillStyle = '#e8213a'; ctx.fill();
      [[-18, -14], [0, -18], [18, -14]].forEach(([x, y]) => { ell(ctx, x, y, 2.6, 2.6); ctx.fillStyle = '#fff3a0'; ctx.fill(); });
      ctx.restore();
    }
    if (h === 'kopfhoerer') {
      ctx.beginPath(); ctx.arc(14, -12, 22, Math.PI * 1.05, Math.PI * 1.95); stroke(ctx, 5, '#2a3a8a');
      ell(ctx, -6, -6, 7, 9); fillS(ctx, '#ffcc2a', 2.5, '#2a3a8a'); ell(ctx, 34, -6, 6, 8); fillS(ctx, '#ffcc2a', 2.5, '#2a3a8a');
    }
  }
  /* Begleiter-Schildkröte */
  function drawTurtle(ctx, x, y, t, f) {
    ctx.save(); ctx.translate(x, y); ctx.scale(f || 1, 1);
    const fl = Math.sin(t * 6) * 0.4;
    ctx.save(); ctx.translate(8, 8); ctx.rotate(fl); ell(ctx, 4, 4, 7, 3.5, 0.6); fillS(ctx, '#7fd36a', 1.5, '#2a6a2a'); ctx.restore();
    ctx.save(); ctx.translate(-8, 8); ctx.rotate(-fl); ell(ctx, -3, 4, 6, 3, -0.6); fillS(ctx, '#7fd36a', 1.5, '#2a6a2a'); ctx.restore();
    ell(ctx, 18, -2, 8, 7); fillS(ctx, '#8fe07a', 1.8, '#2a6a2a');
    ell(ctx, 21, -4, 2.2, 2.6); ctx.fillStyle = '#111'; ctx.fill();
    ctx.beginPath(); ctx.arc(0, 2, 15, Math.PI, TAU); ctx.closePath(); fillS(ctx, '#4aa64a', 2, '#2a6a2a');
    ctx.beginPath(); ctx.moveTo(-8, -2); ctx.lineTo(0, -8); ctx.lineTo(8, -2); stroke(ctx, 1.5, '#2a6a2a');
    ctx.restore();
  }

  function drawCompanion(ctx, id, x, y, t, f) { if (id === 'schildkroete') drawTurtle(ctx, x, y, t, f); else if (root.ArtExtras) root.ArtExtras.drawBuddy(ctx, id, x, y, t, f); }

  /* ================= GEGNER ================= */
  function drawEnemy(ctx, e, t, world) {
    ctx.save(); ctx.translate(e.x, e.y);
    if (e.knocked) { ctx.rotate(e.spin); ctx.globalAlpha = Math.max(0, 1 - e.kt / 1.2); }
    const f = e.face || 1; ctx.scale(f, 1);
    const r = e.r; const k = r / 20;
    ctx.scale(k, k);
    const tt = t + e.seed;
    switch (e.type) {
      case 'fish': {
        const col = ['#ff8a3a', '#ff5a6a', '#ffcf3a', '#5ad1ff'][e.seed % 4 | 0];
        ctx.save(); ctx.translate(-18, 0); ctx.rotate(Math.sin(tt * 10) * 0.3); ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(-12, -11); ctx.lineTo(-10, 0); ctx.lineTo(-12, 11); ctx.closePath(); fillS(ctx, shade(col, -15), 2); ctx.restore();
        ell(ctx, 0, 0, 22, 15); fillS(ctx, col, 2.2);
        ctx.beginPath(); ctx.moveTo(-6, -13); ctx.quadraticCurveTo(0, -24, 8, -13); fillS(ctx, shade(col, -15), 2);
        ell(ctx, 10, -4, 5, 5.5); fillS(ctx, '#fff', 1.4); ell(ctx, 11.5, -3.5, 2.4, 2.8); ctx.fillStyle = '#111'; ctx.fill();
        ctx.beginPath(); ctx.moveTo(4, -11); ctx.lineTo(15, -8); stroke(ctx, 2.4);
        ctx.beginPath(); ctx.moveTo(14, 6); ctx.lineTo(20, 4); stroke(ctx, 2);
        break;
      }
      case 'piranha': {
        ctx.save(); ctx.translate(-18, 0); ctx.rotate(Math.sin(tt * 14) * 0.35); ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(-12, -12); ctx.lineTo(-12, 12); ctx.closePath(); fillS(ctx, '#5a6a7a', 2); ctx.restore();
        ell(ctx, 0, 0, 22, 17); fillS(ctx, '#7a8a9a', 2.2);
        ctx.save(); ell(ctx, 0, 0, 22, 17); ctx.clip(); ell(ctx, 4, 12, 22, 10); ctx.fillStyle = '#e8463a'; ctx.fill(); ctx.restore();
        ell(ctx, 0, 0, 22, 17); stroke(ctx, 2.2);
        ell(ctx, 9, -6, 4.5, 4.5); fillS(ctx, '#ffe04a', 1.4); ell(ctx, 10, -6, 2, 2.5); ctx.fillStyle = '#111'; ctx.fill();
        ctx.beginPath(); ctx.moveTo(3, -12); ctx.lineTo(15, -8); stroke(ctx, 2.6);
        ctx.beginPath(); ctx.moveTo(8, 4); for (let i = 0; i < 4; i++) { ctx.lineTo(10 + i * 3, 9); ctx.lineTo(11.5 + i * 3, 4); } ctx.closePath(); fillS(ctx, '#fff', 1.2);
        break;
      }
      case 'crab': {
        const w = Math.sin(tt * 8);
        for (let i = -1; i <= 1; i += 2) for (let j = 0; j < 3; j++) { ctx.beginPath(); ctx.moveTo(i * 10, 6); ctx.lineTo(i * (18 + j * 4), 14 + (j % 2 ? w : -w) * 3); stroke(ctx, 3, '#a8281a'); }
        ell(ctx, 0, 2, 20, 13); fillS(ctx, '#ef4a35', 2.2);
        for (let i = -1; i <= 1; i += 2) { ctx.beginPath(); ctx.moveTo(i * 14, -4); ctx.lineTo(i * 22, -14 + w * 2); stroke(ctx, 3, '#a8281a'); ell(ctx, i * 24, -18 + w * 2, 7, 6); fillS(ctx, '#ef4a35', 2); ctx.beginPath(); ctx.moveTo(i * 24, -18 + w * 2); ctx.lineTo(i * 30, -22 + w * 2); stroke(ctx, 2); }
        for (let i = -1; i <= 1; i += 2) { ctx.beginPath(); ctx.moveTo(i * 5, -8); ctx.lineTo(i * 6, -16); stroke(ctx, 2); ell(ctx, i * 6, -18, 4, 4); fillS(ctx, '#fff', 1.4); ell(ctx, i * 6.5, -18, 2, 2); ctx.fillStyle = '#111'; ctx.fill(); }
        ctx.beginPath(); ctx.arc(0, 4, 5, 0.2, Math.PI - 0.2); stroke(ctx, 2);
        break;
      }
      case 'jelly': {
        const p = Math.sin(tt * 3);
        ctx.strokeStyle = 'rgba(255,170,230,0.9)'; ctx.lineWidth = 2.5;
        for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * 6, 4); for (let y = 0; y < 26; y += 4) ctx.lineTo(i * 6 + Math.sin(tt * 4 + y * 0.3 + i) * 3, 6 + y); ctx.stroke(); }
        ctx.beginPath(); ctx.moveTo(-20, 6); ctx.bezierCurveTo(-22 - p * 2, -24, 22 + p * 2, -24, 20, 6); ctx.quadraticCurveTo(0, 12, -20, 6); fillS(ctx, 'rgba(255,140,210,0.85)', 2, '#a8337a');
        ell(ctx, -6, -8, 6, 3, -0.4); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fill();
        ell(ctx, -5, -2, 2.4, 3); ctx.fillStyle = '#4a1a3a'; ctx.fill(); ell(ctx, 5, -2, 2.4, 3); ctx.fill();
        break;
      }
      case 'puffer': {
        const inf = 1 + (e.inflate || 0) * 0.35;
        ctx.scale(inf, inf);
        ctx.fillStyle = '#e8a800';
        for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; ctx.beginPath(); ctx.moveTo(Math.cos(a - 0.12) * 18, Math.sin(a - 0.12) * 18); ctx.lineTo(Math.cos(a) * 26, Math.sin(a) * 26); ctx.lineTo(Math.cos(a + 0.12) * 18, Math.sin(a + 0.12) * 18); ctx.fill(); }
        ell(ctx, 0, 0, 20, 19); fillS(ctx, '#ffd23a', 2.2);
        ell(ctx, 3, 8, 13, 8); ctx.fillStyle = '#fff4c0'; ctx.fill();
        ell(ctx, 8, -5, 5, 5.5); fillS(ctx, '#fff', 1.4); ell(ctx, 9.5, -4.5, 2.5, 2.8); ctx.fillStyle = '#111'; ctx.fill();
        ctx.beginPath(); ctx.moveTo(2, -12); ctx.lineTo(14, -9); stroke(ctx, 2.4);
        ell(ctx, 16, 5, 3, 2.5); fillS(ctx, '#ff8a6a', 1.4);
        break;
      }
      case 'urchin': {
        ctx.strokeStyle = '#3a1a5a'; ctx.lineWidth = 2.5;
        for (let i = 0; i < 18; i++) { const a = i / 18 * TAU + Math.sin(tt * 2) * 0.03; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * 30, Math.sin(a) * 30); ctx.stroke(); }
        ell(ctx, 0, 0, 17, 17); fillS(ctx, '#7a3ab8', 2.2, '#3a1a5a');
        ell(ctx, -5, -5, 5, 4); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fill();
        break;
      }
      case 'inkpus': {
        for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-12 + i * 6, 8); ctx.quadraticCurveTo(-14 + i * 6 + Math.sin(tt * 6 + i) * 5, 20, -10 + i * 6, 28); stroke(ctx, 4, '#c0508a'); }
        ell(ctx, 0, -2, 17, 15); fillS(ctx, '#e06aa8', 2.2);
        ell(ctx, -6, -3, 4, 4.5); fillS(ctx, '#fff', 1.2); ell(ctx, 6, -3, 4, 4.5); fillS(ctx, '#fff', 1.2);
        ell(ctx, -5, -2, 2, 2.5); ctx.fillStyle = '#111'; ctx.fill(); ell(ctx, 7, -2, 2, 2.5); ctx.fill();
        break;
      }
      case 'lantern': {
        const glow = 0.6 + 0.4 * Math.sin(tt * 5);
        const g = ctx.createRadialGradient(20, -26, 0, 20, -26, 34); g.addColorStop(0, `rgba(180,255,240,${0.7 * glow})`); g.addColorStop(1, 'rgba(180,255,240,0)'); ctx.fillStyle = g; ctx.fillRect(-14, -60, 68, 68);
        ctx.beginPath(); ctx.moveTo(4, -14); ctx.quadraticCurveTo(10, -36, 20, -26); stroke(ctx, 2, '#4a3a2a');
        ell(ctx, 20, -26, 4.5, 4.5); ctx.fillStyle = '#c8fff0'; ctx.fill();
        ctx.save(); ctx.translate(-18, 0); ctx.rotate(Math.sin(tt * 9) * 0.3); ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(-10, -10); ctx.lineTo(-10, 10); ctx.closePath(); fillS(ctx, '#3a2a3a', 2); ctx.restore();
        ell(ctx, 0, 0, 21, 17); fillS(ctx, '#5a3a4a', 2.2, '#1a0a1a');
        ctx.beginPath(); ctx.moveTo(6, 4); for (let i = 0; i < 5; i++) { ctx.lineTo(8 + i * 3, 11); ctx.lineTo(9.5 + i * 3, 4); } ctx.closePath(); fillS(ctx, '#fff', 1);
        ell(ctx, 9, -6, 4, 4); ctx.fillStyle = '#ffe04a'; ctx.fill(); ell(ctx, 10, -6, 1.6, 2.6); ctx.fillStyle = '#111'; ctx.fill();
        break;
      }
      case 'eel': {
        ctx.beginPath();
        for (let i = 0; i <= 20; i++) { const x = 30 - i * 5, y = Math.sin(tt * 4 + i * 0.5) * 6 * (i / 20); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        stroke(ctx, 16, '#1a3a2a'); ctx.stroke(); ctx.lineWidth = 12; ctx.strokeStyle = '#3e8a5a'; ctx.stroke();
        ell(ctx, 32, 0, 11, 9); fillS(ctx, '#3e8a5a', 2.2, '#1a3a2a');
        ell(ctx, 35, -3, 3.4, 3.4); fillS(ctx, '#ffe04a', 1); ell(ctx, 36, -3, 1.4, 2.2); ctx.fillStyle = '#111'; ctx.fill();
        ctx.beginPath(); ctx.moveTo(36, 4); ctx.lineTo(43, 3); stroke(ctx, 2, '#1a3a2a');
        break;
      }
      case 'bigfish': {
        ctx.save(); ctx.translate(-26, 0); ctx.rotate(Math.sin(tt * 5) * 0.25); ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(-16, -16); ctx.lineTo(-12, 0); ctx.lineTo(-16, 16); ctx.closePath(); fillS(ctx, '#4a6a8a', 2.2); ctx.restore();
        ell(ctx, 0, 0, 30, 18); fillS(ctx, '#6a8aaa', 2.4);
        ctx.save(); ell(ctx, 0, 0, 30, 18); ctx.clip(); ell(ctx, 0, 14, 30, 9); ctx.fillStyle = '#c8d8e8'; ctx.fill(); for (let i = -20; i < 24; i += 9) { ctx.beginPath(); ctx.moveTo(i, -18); ctx.lineTo(i - 4, 4); stroke(ctx, 1.5, 'rgba(30,50,80,0.35)'); } ctx.restore();
        ell(ctx, 0, 0, 30, 18); stroke(ctx, 2.4);
        ell(ctx, 17, -5, 4.5, 4.5); fillS(ctx, '#fff', 1.2); ell(ctx, 18, -5, 2, 2.6); ctx.fillStyle = '#111'; ctx.fill();
        ctx.beginPath(); ctx.moveTo(12, -11); ctx.lineTo(23, -9); stroke(ctx, 2.4);
        ctx.beginPath(); ctx.moveTo(18, 6); ctx.lineTo(30, 4); stroke(ctx, 2);
        ctx.beginPath(); ctx.moveTo(-8, -17); ctx.lineTo(-2, -28); ctx.lineTo(8, -17); fillS(ctx, '#4a6a8a', 2);
        break;
      }
    }
    ctx.restore();
  }

  /* ================= BOSSE ================= */
  // st: {t, hit(0..1), defeat(0..1), lampOn, talk}
  function drawBoss(ctx, id, x, y, s, st) {
    st = st || {}; const t = st.t || 0;
    ctx.save(); ctx.translate(x, y);
    const d = st.defeat || 0;
    if (d > 0) { ctx.rotate(d * TAU * 1.5); ctx.scale(1 - d * 0.6, 1 - d * 0.6); }
    if (st.hit > 0) ctx.translate(Math.sin(st.hit * 40) * 10 * st.hit, 0);
    ctx.scale(s, s);
    const bob = Math.sin(t * 2) * 6; ctx.translate(0, bob);
    const talk = st.talk ? Math.abs(Math.sin(t * 12)) : 0;
    const B = BOSSES[id]; if (B) B(ctx, t, talk, st);
    if (st.hit > 0) { ctx.globalCompositeOperation = 'source-atop'; ctx.fillStyle = `rgba(255,255,255,${st.hit * 0.6})`; ctx.fillRect(-200, -200, 400, 400); ctx.globalCompositeOperation = 'source-over'; }
    if (d > 0.1) for (let i = 0; i < 5; i++) { const a = t * 4 + i * TAU / 5; star(ctx, Math.cos(a) * 70, -90 + Math.sin(a) * 18, 9, '#ffe04a'); }
    ctx.restore();
  }
  function star(ctx, x, y, r, col) { ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU - Math.PI / 2, rr2 = i % 2 ? r * 0.45 : r; ctx.lineTo(x + Math.cos(a) * rr2, y + Math.sin(a) * rr2); } ctx.closePath(); fillS(ctx, col, 1.5, '#a87a00'); }
  function eyes(ctx, x, y, r, look, t) { [[-1, 0], [1, 0]].forEach(([i]) => { ell(ctx, x + i * r * 1.25, y, r, r * 1.1); fillS(ctx, '#fff', 2.4); ell(ctx, x + i * r * 1.25 + look * r * 0.3, y + r * 0.15, r * 0.48, r * 0.55); ctx.fillStyle = '#111'; ctx.fill(); ell(ctx, x + i * r * 1.25 + look * r * 0.3 + r * 0.18, y - r * 0.15, r * 0.16, r * 0.16); ctx.fillStyle = '#fff'; ctx.fill(); }); }
  const BOSSES = {
    willy(ctx, t, talk) {
      ctx.strokeStyle = 'rgba(220,140,240,0.9)'; ctx.lineWidth = 7; ctx.lineCap = 'round';
      for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * 16, 30); for (let y = 0; y < 110; y += 8) ctx.lineTo(i * 16 + Math.sin(t * 3 + y * 0.06 + i) * 10, 30 + y); ctx.stroke(); }
      ctx.lineCap = 'butt';
      ctx.beginPath(); ctx.moveTo(-85, 30); ctx.bezierCurveTo(-95, -110, 95, -110, 85, 30); ctx.quadraticCurveTo(60, 44, 40, 30); ctx.quadraticCurveTo(20, 46, 0, 30); ctx.quadraticCurveTo(-20, 46, -40, 30); ctx.quadraticCurveTo(-60, 44, -85, 30);
      const g = ctx.createRadialGradient(-20, -50, 10, 0, -20, 120); g.addColorStop(0, '#ffd6f5'); g.addColorStop(1, '#c86ae0'); fillS(ctx, g, 4, '#6a2a7a');
      ell(ctx, -35, -50, 22, 10, -0.5); ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fill();
      const look = Math.sin(t * 0.9) > 0.6 ? 1 : Math.sin(t * 0.9) < -0.6 ? -1 : 0;
      eyes(ctx, 0, -18, 13, look, t);
      ctx.beginPath(); ctx.arc(-17, -18, 24, 0, TAU); ctx.moveTo(41, -18); ctx.arc(17, -18, 24, 0, TAU); stroke(ctx, 6, '#3a2a1a');
      ctx.beginPath(); ctx.moveTo(-7, -20); ctx.quadraticCurveTo(0, -27, 7, -20); stroke(ctx, 5, '#3a2a1a');
      ctx.fillStyle = 'rgba(200,240,255,0.25)'; ell(ctx, -17, -18, 22, 22); ctx.fill(); ell(ctx, 17, -18, 22, 22); ctx.fill();
      ell(ctx, 0, 15, 14, 4 + talk * 9); fillS(ctx, '#6a1a4a', 3, '#6a2a7a');
      ctx.beginPath(); ctx.moveTo(-30, -62); ctx.lineTo(0, -82); ctx.lineTo(30, -62); ctx.lineTo(0, -50); ctx.closePath(); fillS(ctx, '#2a2a3a', 3, '#111');
      ctx.beginPath(); ctx.moveTo(22, -62); ctx.lineTo(30, -40); stroke(ctx, 2, '#ffcc2a'); ell(ctx, 30, -38, 4, 4); ctx.fillStyle = '#ffcc2a'; ctx.fill();
    },
    timmy(ctx, t, talk) {
      ctx.save(); ctx.translate(-120, 0); ctx.rotate(Math.sin(t * 4) * 0.2); ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-30, -50); ctx.lineTo(-18, 0); ctx.lineTo(-30, 45); ctx.closePath(); fillS(ctx, '#5f7f9a', 4); ctx.restore();
      ctx.beginPath(); ctx.moveTo(-10, -50); ctx.lineTo(-30, -105); ctx.quadraticCurveTo(10, -70, 30, -48); fillS(ctx, '#5f7f9a', 4);
      ctx.beginPath(); ctx.moveTo(130, 10); ctx.bezierCurveTo(120, -50, 40, -62, -20, -55); ctx.bezierCurveTo(-80, -48, -110, -20, -120, 0); ctx.bezierCurveTo(-100, 30, -40, 52, 20, 50); ctx.bezierCurveTo(80, 48, 125, 35, 130, 10);
      const g = ctx.createLinearGradient(0, -60, 0, 50); g.addColorStop(0, '#6f90ae'); g.addColorStop(1, '#8fb0cc'); fillS(ctx, g, 4);
      ctx.save(); ctx.clip(); ell(ctx, 30, 48, 100, 30); ctx.fillStyle = '#eef4f8'; ctx.fill(); ctx.restore();
      ctx.beginPath(); ctx.moveTo(-20, 30); ctx.lineTo(-40, 70); ctx.lineTo(10, 40); fillS(ctx, '#5f7f9a', 3);
      ctx.beginPath(); ctx.moveTo(40, 20 - talk * 4); ctx.quadraticCurveTo(85, 50 + talk * 18, 122, 18); ctx.quadraticCurveTo(85, 36, 40, 20 - talk * 4); fillS(ctx, '#7a1a2a', 3);
      ctx.fillStyle = '#fff'; for (let i = 0; i < 7; i++) { const x = 50 + i * 10; ctx.beginPath(); ctx.moveTo(x, 22 + i * 0.5); ctx.lineTo(x + 5, 32 + talk * 4); ctx.lineTo(x + 10, 22 + i * 0.5); ctx.fill(); }
      ell(ctx, 70, -18, 13, 14); fillS(ctx, '#fff', 3); ell(ctx, 74, -16, 6, 7); ctx.fillStyle = '#111'; ctx.fill(); ell(ctx, 76, -19, 2, 2); ctx.fillStyle = '#fff'; ctx.fill();
      ctx.beginPath(); ctx.moveTo(55, -36); ctx.lineTo(88, -30); stroke(ctx, 5);
      ctx.save(); ctx.translate(40, -56); ctx.rotate(-0.15);
      ctx.beginPath(); ctx.moveTo(-75, 10); ctx.quadraticCurveTo(-55, -55, 0, -55); ctx.quadraticCurveTo(55, -55, 75, 10); ctx.quadraticCurveTo(0, -8, -75, 10); fillS(ctx, '#1e1e26', 4, '#000');
      ctx.beginPath(); ctx.moveTo(-75, 10); ctx.quadraticCurveTo(0, -8, 75, 10); stroke(ctx, 5, '#e8b400');
      ell(ctx, 0, -28, 12, 11); ctx.fillStyle = '#fff'; ctx.fill(); ctx.fillStyle = '#111'; ell(ctx, -4, -30, 3, 3); ctx.fill(); ell(ctx, 4, -30, 3, 3); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-14, -10); ctx.lineTo(14, -4); ctx.moveTo(14, -10); ctx.lineTo(-14, -4); stroke(ctx, 3.5, '#fff');
      ctx.restore();
    },
    guenther(ctx, t, talk) {
      ctx.save(); ctx.translate(-130, 10); ctx.rotate(Math.sin(t * 3) * 0.25); ctx.beginPath(); ctx.moveTo(10, 0); ctx.quadraticCurveTo(-10, -30, -40, -38); ctx.quadraticCurveTo(-26, 0, -40, 38); ctx.quadraticCurveTo(-10, 30, 10, 0); fillS(ctx, '#1a1a24', 4, '#000'); ctx.restore();
      ctx.beginPath(); ctx.moveTo(-10, -55); ctx.quadraticCurveTo(-20, -120, -40, -125); ctx.quadraticCurveTo(-30, -80, -50, -50); fillS(ctx, '#1a1a24', 4, '#000');
      ctx.beginPath(); ctx.moveTo(130, 10); ctx.bezierCurveTo(130, -50, 60, -70, 0, -62); ctx.bezierCurveTo(-70, -55, -120, -20, -130, 8); ctx.bezierCurveTo(-110, 40, -40, 62, 30, 58); ctx.bezierCurveTo(90, 54, 130, 40, 130, 10);
      fillS(ctx, '#22222e', 4, '#000');
      ctx.save(); ctx.clip(); ell(ctx, 40, 55, 110, 32); ctx.fillStyle = '#f4f6fa'; ctx.fill(); ell(ctx, 55, -22, 26, 13, -0.2); ctx.fill(); ctx.restore();
      ctx.beginPath(); ctx.moveTo(70, 25); ctx.quadraticCurveTo(100, 40 + talk * 12, 125, 22); stroke(ctx, 4, '#000');
      ell(ctx, 72, -8, 8, 9); fillS(ctx, '#fff', 2.4, '#000'); ell(ctx, 74, -7, 4, 5); ctx.fillStyle = '#111'; ctx.fill();
      ell(ctx, 95, 12, 9, 5); ctx.fillStyle = 'rgba(255,120,150,0.6)'; ctx.fill();
      ctx.save(); ctx.translate(50, -60); ctx.rotate(-0.2);
      ctx.beginPath(); ctx.moveTo(-50, 8); ctx.quadraticCurveTo(-50, -55, 0, -58); ctx.quadraticCurveTo(50, -55, 50, 8); ctx.closePath(); fillS(ctx, '#e8323a', 4, '#7a0a10');
      rr(ctx, -54, -2, 108, 18, 8); fillS(ctx, '#fff', 3, '#9a9aa8');
      for (let i = -40; i <= 40; i += 16) { ctx.beginPath(); ctx.moveTo(i, -40); ctx.lineTo(i + 4, -6); stroke(ctx, 3, '#ff7a7a'); }
      ell(ctx, 4, -64, 16, 16); fillS(ctx, '#fff', 3, '#9a9aa8');
      ctx.restore();
      rr(ctx, 30, 30, 80, 16, 8); fillS(ctx, '#3a8ae8', 3, '#1a3a7a');
    },
    bob(ctx, t, talk) {
      ctx.scale(0.75, 0.75);
      ctx.save(); ctx.translate(-80, 0); ctx.rotate(Math.sin(t * 12) * 0.3); ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-30, -35); ctx.lineTo(-30, 35); ctx.closePath(); fillS(ctx, '#e86a1a', 4); ctx.restore();
      ell(ctx, 0, 0, 90, 72); fillS(ctx, '#ff8a2a', 4);
      ctx.save(); ell(ctx, 0, 0, 90, 72); ctx.clip(); ell(ctx, 10, 55, 90, 40); ctx.fillStyle = '#ffd23a'; ctx.fill(); ctx.restore(); ell(ctx, 0, 0, 90, 72); stroke(ctx, 4);
      ctx.beginPath(); ctx.moveTo(-30, -66); ctx.lineTo(-10, -100); ctx.lineTo(20, -70); fillS(ctx, '#e86a1a', 4);
      ctx.beginPath(); ctx.moveTo(10, 10); ctx.quadraticCurveTo(60, 70 + talk * 20, 92, 10); ctx.quadraticCurveTo(60, 30, 10, 10); fillS(ctx, '#7a0a1a', 4);
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 5; i++) { const x = 18 + i * 14; ctx.beginPath(); ctx.moveTo(x, 12); ctx.lineTo(x + 7, 50 + talk * 6); ctx.lineTo(x + 14, 12); ctx.fill(); ctx.stroke(); }
      for (let i = 0; i < 4; i++) { const x = 24 + i * 14; ctx.beginPath(); ctx.moveTo(x, 60 + talk * 18); ctx.lineTo(x + 7, 30 + talk * 18); ctx.lineTo(x + 14, 60 + talk * 18); ctx.fill(); ctx.stroke(); }
      ell(ctx, 40, -25, 20, 22); fillS(ctx, '#fff', 3); ell(ctx, 46, -22, 9, 11); ctx.fillStyle = '#111'; ctx.fill(); ell(ctx, 49, -26, 3, 3); ctx.fillStyle = '#fff'; ctx.fill();
      ctx.beginPath(); ctx.moveTo(14, -54); ctx.lineTo(64, -40); stroke(ctx, 8);
    },
    lama(ctx, t, talk) {
      ctx.save(); ctx.translate(-120, 20); ctx.rotate(Math.sin(t * 3) * 0.2); ctx.beginPath(); ctx.moveTo(10, -14); ctx.quadraticCurveTo(-50, -10, -80, 20); ctx.quadraticCurveTo(-40, 10, 10, 14); fillS(ctx, '#4aa64a', 4, '#1a5a1a'); ctx.restore();
      ell(ctx, -40, 10, 90, 48); fillS(ctx, '#5abf5a', 4, '#1a5a1a');
      for (let i = -100; i < 30; i += 22) { ctx.beginPath(); ctx.moveTo(i, -32); ctx.lineTo(i + 10, -50); ctx.lineTo(i + 20, -32); fillS(ctx, '#3a9a3a', 2.5, '#1a5a1a'); }
      ell(ctx, -30, 38, 70, 16); ctx.fillStyle = '#c8f0a0'; ctx.fill();
      ctx.save(); ctx.translate(40, -10);
      ctx.beginPath(); ctx.moveTo(0, -30); ctx.quadraticCurveTo(80, -36, 140, -14); ctx.quadraticCurveTo(150, -2, 138, 4); ctx.lineTo(10, 8); ctx.closePath(); fillS(ctx, '#5abf5a', 4, '#1a5a1a');
      ctx.save(); ctx.rotate(talk * 0.25); ctx.beginPath(); ctx.moveTo(10, 10); ctx.lineTo(136, 8); ctx.quadraticCurveTo(140, 26, 120, 28); ctx.lineTo(10, 30); ctx.closePath(); fillS(ctx, '#4aa64a', 4, '#1a5a1a');
      ctx.fillStyle = '#fff'; for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.moveTo(30 + i * 13, 10); ctx.lineTo(36 + i * 13, 2); ctx.lineTo(42 + i * 13, 10); ctx.fill(); } ctx.restore();
      ctx.fillStyle = '#fff'; for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.moveTo(30 + i * 13, 6); ctx.lineTo(36 + i * 13, 14); ctx.lineTo(42 + i * 13, 6); ctx.fill(); }
      ell(ctx, 130, -18, 4, 3); ctx.fillStyle = '#1a5a1a'; ctx.fill();
      ell(ctx, 30, -36, 16, 17); fillS(ctx, '#ffe04a', 3, '#1a5a1a'); ell(ctx, 33, -34, 4, 12); ctx.fillStyle = '#111'; ctx.fill();
      ctx.beginPath(); ctx.moveTo(12, -40); ctx.quadraticCurveTo(30, -60, 50, -40); stroke(ctx, 4, '#1a5a1a');
      ctx.save(); ctx.translate(10, -62); ctx.rotate(-0.2 + Math.sin(t * 1.7) * 0.08);
      ctx.beginPath(); ctx.moveTo(-34, 10); ctx.lineTo(-38, -26); ctx.lineTo(-18, -8); ctx.lineTo(0, -34); ctx.lineTo(18, -8); ctx.lineTo(38, -26); ctx.lineTo(34, 10); ctx.closePath(); fillS(ctx, '#ffcc2a', 4, '#a87a00');
      ell(ctx, 0, -2, 6, 6); ctx.fillStyle = '#e8213a'; ctx.fill(); ell(ctx, -20, 2, 4, 4); ctx.fillStyle = '#2a8ae8'; ctx.fill(); ell(ctx, 20, 2, 4, 4); ctx.fill();
      ctx.restore(); ctx.restore();
    },
    otto(ctx, t, talk) {
      const socks = ['#e8323a', '#3a8ae8', '#ffcc2a', '#4ac84a', '#a85ae8', '#ff8a2a', '#ffffff', '#2ad8d8'];
      for (let i = 0; i < 8; i++) {
        const bx = -70 + i * 20; ctx.beginPath(); ctx.moveTo(bx, 30);
        const ex = bx + (i - 3.5) * 22 + Math.sin(t * 3 + i) * 18, ey = 120 + Math.cos(t * 2.5 + i) * 14;
        ctx.quadraticCurveTo(bx + (i - 3.5) * 14 + Math.sin(t * 2 + i) * 30, 80, ex, ey); stroke(ctx, 22, '#7a2a5a'); ctx.lineWidth = 17; ctx.strokeStyle = '#ef7ab8'; ctx.stroke();
        ell(ctx, ex, ey + 8, 12, 16); fillS(ctx, socks[i], 3);
        ctx.beginPath(); ctx.moveTo(ex - 11, ey); ctx.lineTo(ex + 11, ey); stroke(ctx, 4, i % 2 ? '#fff' : '#111');
      }
      ctx.beginPath(); ctx.moveTo(-85, 40); ctx.bezierCurveTo(-110, -120, 110, -120, 85, 40); ctx.quadraticCurveTo(0, 60, -85, 40);
      const g = ctx.createRadialGradient(-20, -50, 10, 0, -20, 120); g.addColorStop(0, '#ffb0dc'); g.addColorStop(1, '#d85aa0'); fillS(ctx, g, 4, '#7a2a5a');
      [[-40, -60, 8], [30, -75, 6], [50, -30, 7], [-55, -10, 5]].forEach(([x, y, r]) => { ell(ctx, x, y, r, r); ctx.fillStyle = 'rgba(160,40,110,0.45)'; ctx.fill(); });
      eyes(ctx, 0, -14, 15, Math.sin(t * 2), t);
      ctx.beginPath(); ctx.arc(-19, -14, 22, 0, TAU); ctx.moveTo(41, -14); ctx.arc(19, -14, 22, 0, TAU); stroke(ctx, 4, '#2a2a2a');
      ell(ctx, 0, 22, 14 + talk * 4, 6 + talk * 8); fillS(ctx, '#7a1a4a', 3, '#7a2a5a');
    },
    herbert(ctx, t, talk, st) {
      const on = st.lampOn !== false;
      if (on) { const g = ctx.createRadialGradient(110, -130, 0, 110, -130, 120); g.addColorStop(0, 'rgba(200,255,240,0.75)'); g.addColorStop(1, 'rgba(200,255,240,0)'); ctx.fillStyle = g; ctx.fillRect(-10, -250, 240, 240); }
      ctx.beginPath(); ctx.moveTo(10, -70); ctx.quadraticCurveTo(40, -170, 110, -130); stroke(ctx, 6, '#3a2a2a');
      ell(ctx, 110, -128, 16, 16); fillS(ctx, on ? '#d8fff4' : '#6a7a7a', 3, '#2a3a3a');
      ctx.save(); ctx.translate(-120, 0); ctx.rotate(Math.sin(t * 3) * 0.2); ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-40, -40); ctx.lineTo(-40, 40); ctx.closePath(); fillS(ctx, '#4a2a3a', 4); ctx.restore();
      ell(ctx, 0, 0, 125, 85); const g2 = ctx.createRadialGradient(-20, -30, 20, 0, 0, 130); g2.addColorStop(0, '#9a5a6a'); g2.addColorStop(1, '#4a2a3a'); fillS(ctx, g2, 4, '#1a0a12');
      ctx.beginPath(); ctx.moveTo(20, 10); ctx.quadraticCurveTo(80, 90 + talk * 15, 128, 0); ctx.quadraticCurveTo(80, 40, 20, 10); fillS(ctx, '#1a0a12', 4);
      ctx.fillStyle = '#fff'; for (let i = 0; i < 7; i++) { const x = 30 + i * 13; ctx.beginPath(); ctx.moveTo(x, 12 + i * 0.5); ctx.lineTo(x + 6, 40); ctx.lineTo(x + 12, 12 + i * 0.5); ctx.fill(); }
      for (let i = 0; i < 6; i++) { const x = 40 + i * 13; ctx.beginPath(); ctx.moveTo(x, 66 + talk * 12); ctx.lineTo(x + 6, 46 + talk * 10); ctx.lineTo(x + 12, 62 + talk * 12); ctx.fill(); }
      ell(ctx, 50, -35, 22, 24); fillS(ctx, '#ffe86a', 3); ell(ctx, 54, -33, 8, 16); ctx.fillStyle = '#111'; ctx.fill();
      ctx.beginPath(); ctx.moveTo(22, -62); ctx.lineTo(76, -54); stroke(ctx, 6);
    },
    mbappe(ctx, t, talk) {
      ctx.scale(1.25, 1.25);
      ctx.save(); ctx.translate(-150, 0); ctx.rotate(Math.sin(t * 3) * 0.2); ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-40, -70); ctx.lineTo(-24, 0); ctx.lineTo(-40, 60); ctx.closePath(); fillS(ctx, '#4a5a6a', 4); ctx.restore();
      ctx.beginPath(); ctx.moveTo(-20, -60); ctx.lineTo(-40, -130); ctx.quadraticCurveTo(10, -90, 30, -56); fillS(ctx, '#4a5a6a', 4);
      ctx.beginPath(); ctx.moveTo(160, 10); ctx.bezierCurveTo(150, -60, 60, -75, -20, -66); ctx.bezierCurveTo(-100, -55, -140, -20, -150, 0); ctx.bezierCurveTo(-120, 40, -50, 65, 30, 62); ctx.bezierCurveTo(100, 58, 155, 40, 160, 10);
      const g = ctx.createLinearGradient(0, -70, 0, 60); g.addColorStop(0, '#4f6276'); g.addColorStop(1, '#7a8ea2'); fillS(ctx, g, 4);
      ctx.save(); ctx.clip(); ell(ctx, 40, 60, 120, 34); ctx.fillStyle = '#e8eef4'; ctx.fill();
      // weißes T-Shirt
      const shirt = () => { ctx.beginPath(); ctx.moveTo(-80, -90); ctx.lineTo(36, -90); ctx.quadraticCurveTo(16, -30, 22, 14); ctx.quadraticCurveTo(26, 46, 42, 80); ctx.lineTo(-80, 80); ctx.quadraticCurveTo(-68, 0, -80, -90); ctx.closePath(); };
      shirt(); const sg = ctx.createLinearGradient(0, -70, 0, 64); sg.addColorStop(0, '#ffffff'); sg.addColorStop(0.6, '#f2f5f9'); sg.addColorStop(1, '#d4dde8'); ctx.fillStyle = sg; ctx.fill();
      ctx.strokeStyle = 'rgba(80,100,130,0.22)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-40, -50); ctx.quadraticCurveTo(-30, 0, -44, 50); ctx.moveTo(-6, -56); ctx.quadraticCurveTo(-14, -6, -2, 46); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(36, -90); ctx.quadraticCurveTo(16, -30, 22, 14); ctx.quadraticCurveTo(26, 46, 42, 80); ctx.lineWidth = 6; ctx.strokeStyle = '#dfe6ee'; ctx.stroke(); ctx.lineWidth = 2; ctx.strokeStyle = '#9aa8b8'; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-80, -90); ctx.quadraticCurveTo(-68, 0, -80, 80); ctx.lineWidth = 5; ctx.strokeStyle = '#c8d2de'; ctx.stroke();
      ctx.restore();
      // Brustflosse mit Ärmel
      ctx.save(); ctx.beginPath(); ctx.moveTo(10, 36); ctx.quadraticCurveTo(-6, 70, -34, 86); ctx.quadraticCurveTo(-18, 56, -22, 34); ctx.closePath(); fillS(ctx, '#5a6e82', 3.5);
      ctx.clip(); ctx.fillStyle = '#f6f8fb'; ctx.fillRect(-40, 28, 60, 26); ctx.beginPath(); ctx.moveTo(-40, 54); ctx.lineTo(20, 54); ctx.lineWidth = 3; ctx.strokeStyle = '#9aa8b8'; ctx.stroke(); ctx.restore();
      ctx.beginPath(); ctx.moveTo(30, 20 - talk * 5); ctx.quadraticCurveTo(100, 70 + talk * 25, 152, 18); ctx.quadraticCurveTo(100, 40, 30, 20 - talk * 5); fillS(ctx, '#5a0a1a', 4);
      ctx.fillStyle = '#fff'; for (let i = 0; i < 9; i++) { const x = 42 + i * 12; ctx.beginPath(); ctx.moveTo(x, 22); ctx.lineTo(x + 6, 40 + talk * 6); ctx.lineTo(x + 12, 22); ctx.fill(); ctx.stroke(); }
      ell(ctx, 88, -22, 15, 16); fillS(ctx, '#fff', 3); ell(ctx, 92, -20, 7, 9); ctx.fillStyle = '#111'; ctx.fill(); ell(ctx, 94, -23, 2.5, 2.5); ctx.fillStyle = '#fff'; ctx.fill();
      ctx.beginPath(); ctx.moveTo(68, -44); ctx.lineTo(108, -36); stroke(ctx, 6);
      ctx.save(); ctx.beginPath(); ctx.moveTo(48, -71); ctx.bezierCurveTo(105, -72, 150, -50, 160, 10); ctx.lineTo(150, 10); ctx.bezierCurveTo(140, -42, 102, -58, 48, -59); ctx.closePath(); fillS(ctx, '#ffcc2a', 3, '#a87a00'); ctx.restore();
      star(ctx, 100, -64, 10, '#fff3a0');
    }
  };

  /* ================= OBJEKTE ================= */
  function drawShell(ctx, x, y, t, s) {
    ctx.save(); ctx.translate(x, y + Math.sin(t * 3 + x) * 3); ctx.scale(s || 1, s || 1);
    ctx.beginPath(); ctx.moveTo(0, 12); ctx.lineTo(-14, -2); ctx.quadraticCurveTo(-12, -14, 0, -14); ctx.quadraticCurveTo(12, -14, 14, -2); ctx.closePath();
    const g = ctx.createLinearGradient(0, -14, 0, 12); g.addColorStop(0, '#ffe680'); g.addColorStop(1, '#ffb02a'); fillS(ctx, g, 2, '#a8650a');
    for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(0, 10); ctx.lineTo(i * 5.5, -12); stroke(ctx, 1.4, '#c8801a'); }
    rr(ctx, -5, 9, 10, 5, 2); fillS(ctx, '#ffcf5a', 1.4, '#a8650a');
    ell(ctx, -5, -8, 3, 2); ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fill();
    ctx.restore();
  }
  function drawPearl(ctx, x, y, t, r, magic) {
    r = r || 11; const pulse = 1 + Math.sin(t * 4) * 0.08;
    const g0 = ctx.createRadialGradient(x, y, 0, x, y, r * 3); g0.addColorStop(0, magic ? 'rgba(180,140,255,0.6)' : 'rgba(255,255,255,0.5)'); g0.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g0; ctx.fillRect(x - r * 3, y - r * 3, r * 6, r * 6);
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r * pulse);
    if (magic) { g.addColorStop(0, '#ffffff'); g.addColorStop(0.4, '#d8b8ff'); g.addColorStop(1, '#7a4ad8'); } else { g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, '#f4eefc'); g.addColorStop(1, '#c8b8e0'); }
    ell(ctx, x, y, r * pulse, r * pulse); fillS(ctx, g, 2, magic ? '#4a2a9a' : '#8a7aa8');
  }
  function drawChest(ctx, x, y, open, t) {
    ctx.save(); ctx.translate(x, y);
    if (open) { const g = ctx.createRadialGradient(0, -20, 0, 0, -20, 70); g.addColorStop(0, 'rgba(255,230,120,0.7)'); g.addColorStop(1, 'rgba(255,230,120,0)'); ctx.fillStyle = g; ctx.fillRect(-70, -90, 140, 140); }
    rr(ctx, -30, -18, 60, 36, 4); fillS(ctx, '#8a5a2a', 3, '#3a2010');
    for (const xx of [-22, 22]) { ctx.fillStyle = '#e8b400'; ctx.fillRect(xx - 3, -18, 6, 36); }
    ctx.save(); ctx.translate(0, -18); if (open) ctx.rotate(-0.9);
    ctx.beginPath(); ctx.moveTo(-31, 0); ctx.quadraticCurveTo(-31, -22, 0, -22); ctx.quadraticCurveTo(31, -22, 31, 0); ctx.closePath(); fillS(ctx, '#a06a32', 3, '#3a2010');
    ctx.restore();
    if (open) { ell(ctx, 0, -18, 24, 6); ctx.fillStyle = '#ffd23a'; ctx.fill(); }
    rr(ctx, -6, -24, 12, 14, 3); fillS(ctx, '#ffcc2a', 2, '#a87a00');
    ctx.restore();
  }
  function drawCheckpoint(ctx, x, y, active, t) {
    ctx.save(); ctx.translate(x, y);
    if (active) { const g = ctx.createRadialGradient(0, -30, 0, 0, -30, 80); g.addColorStop(0, 'rgba(120,255,200,0.55)'); g.addColorStop(1, 'rgba(120,255,200,0)'); ctx.fillStyle = g; ctx.fillRect(-80, -110, 160, 160); }
    rr(ctx, -5, -90, 10, 90, 4); fillS(ctx, '#c8a46a', 2.5, '#5a3a1a');
    const wv = Math.sin(t * 4) * 6;
    ctx.beginPath(); ctx.moveTo(5, -88); ctx.quadraticCurveTo(30, -84 + wv, 55, -78); ctx.quadraticCurveTo(30, -66 - wv, 5, -62); ctx.closePath(); fillS(ctx, active ? '#3ae8a0' : '#9aa8b8', 2.5, active ? '#0a6a4a' : '#4a5a6a');
    ell(ctx, 0, 0, 26, 8); fillS(ctx, '#e8d0a0', 2, '#7a5a2a');
    ctx.restore();
  }
  function drawSwitch(ctx, x, y, on, t) {
    ctx.save(); ctx.translate(x, y);
    rr(ctx, -26, -8, 52, 18, 6); fillS(ctx, '#7a7a8a', 2.5, '#2a2a3a');
    ctx.save(); ctx.translate(0, -8); if (on) ctx.scale(1, 0.55);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-22, -6); ctx.quadraticCurveTo(-20, -36, 0, -38); ctx.quadraticCurveTo(20, -36, 22, -6); ctx.closePath();
    fillS(ctx, on ? '#5aff9a' : '#ff9ac8', 2.5, on ? '#0a6a3a' : '#9a2a5a');
    for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(0, -2); ctx.lineTo(i * 8, -34); stroke(ctx, 1.5, 'rgba(0,0,0,0.25)'); }
    ctx.restore();
    if (!on) { ctx.font = 'bold 22px Fredoka, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.strokeStyle = '#0a2a4a'; ctx.lineWidth = 4; const yy = -62 + Math.sin(t * 4) * 4; ctx.strokeText('!', 0, yy); ctx.fillText('!', 0, yy); }
    ctx.restore();
  }

  /* Felsen/Hindernisse vorrendern */
  function renderSolid(s, theme, seed) {
    const pad = 24; const w = Math.ceil(s.w + pad * 2), h = Math.ceil(s.h + pad * 2);
    const c = document.createElement('canvas'); c.width = w; c.height = h; const ctx = c.getContext('2d');
    const r = rng(seed); ctx.translate(pad, pad);
    const kind = s.kind || 'rock';
    if (kind === 'gate') {
      rr(ctx, 0, 0, s.w, s.h, 8); const g = ctx.createLinearGradient(0, 0, s.w, 0); g.addColorStop(0, '#6a5a8a'); g.addColorStop(0.5, '#9a8ac8'); g.addColorStop(1, '#6a5a8a'); fillS(ctx, g, 4, '#2a1a4a');
      for (let y = 20; y < s.h; y += 60) { ell(ctx, s.w / 2, y + 10, 12, 12); fillS(ctx, '#ffcc2a', 2.5, '#7a5a00'); }
      return { canvas: c, pad };
    }
    if (kind === 'crate' || kind === 'iceblock' || kind === 'boulder') {
      if (kind === 'crate') { rr(ctx, 0, 0, s.w, s.h, 6); fillS(ctx, '#b07a3a', 4, '#4a2a10'); ctx.beginPath(); ctx.moveTo(6, 6); ctx.lineTo(s.w - 6, s.h - 6); ctx.moveTo(s.w - 6, 6); ctx.lineTo(6, s.h - 6); stroke(ctx, 6, '#7a4a1a'); rr(ctx, 4, 4, s.w - 8, s.h - 8, 4); stroke(ctx, 3, '#7a4a1a'); }
      else if (kind === 'iceblock') { rr(ctx, 0, 0, s.w, s.h, 10); const g = ctx.createLinearGradient(0, 0, s.w, s.h); g.addColorStop(0, '#e8fbff'); g.addColorStop(1, '#8fd0f0'); fillS(ctx, g, 4, '#3a7aa8'); ctx.beginPath(); ctx.moveTo(10, 14); ctx.lineTo(s.w * 0.5, 10); stroke(ctx, 4, 'rgba(255,255,255,0.9)'); }
      else { ell(ctx, s.w / 2, s.h / 2, s.w / 2, s.h / 2); fillS(ctx, '#8a8a9a', 4, '#3a3a4a'); ell(ctx, s.w * 0.35, s.h * 0.3, s.w * 0.15, s.h * 0.1); ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fill(); }
      return { canvas: c, pad };
    }
    // Felsen mit unregelmäßiger Kontur
    const pts = []; const step = 34;
    const jit = () => (r() - 0.5) * 14;
    for (let x = 0; x <= s.w; x += step) pts.push([Math.min(x, s.w) + jit() * 0.4, jit()]);
    for (let y = step; y <= s.h; y += step) pts.push([s.w + jit(), Math.min(y, s.h)]);
    for (let x = s.w; x >= 0; x -= step) pts.push([x + jit() * 0.4, s.h + jit()]);
    for (let y = s.h; y >= step; y -= step) pts.push([jit(), y]);
    ctx.beginPath(); pts.forEach((p, i) => { const n = pts[(i + 1) % pts.length]; const mx = (p[0] + n[0]) / 2, my = (p[1] + n[1]) / 2; i ? ctx.quadraticCurveTo(p[0], p[1], mx, my) : ctx.moveTo(mx, my); }); ctx.closePath();
    const [c1, c2] = theme.rock; const g = ctx.createLinearGradient(0, 0, s.w * 0.3, s.h); g.addColorStop(0, c1); g.addColorStop(1, c2);
    ctx.save(); ctx.fillStyle = g; ctx.fill(); ctx.clip();
    for (let i = 0; i < (s.w * s.h) / 1800; i++) { ell(ctx, r() * s.w, r() * s.h, 4 + r() * 12, 3 + r() * 8, r() * 3); ctx.fillStyle = r() < 0.5 ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.10)'; ctx.fill(); }
    if (theme.cap === 'planks') { for (let y = 0; y < s.h; y += 26) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(s.w, y + 3); stroke(ctx, 3, 'rgba(40,20,5,0.5)'); } }
    if (theme.cap === 'stone') { for (let y = 0; y < s.h; y += 40) for (let x = (y / 40) % 2 ? 0 : 30; x < s.w; x += 60) { ctx.strokeStyle = 'rgba(60,40,10,0.35)'; ctx.lineWidth = 2.5; ctx.strokeRect(x, y, 60, 40); } }
    ctx.restore();
    stroke(ctx, 4, shade(c2, -45));
    // Kappe (Oberseite für Bodenfelsen, Unterseite für Deckenfelsen)
    const top = !s.ceil;
    const edgeY = top ? 0 : s.h;
    const cap = theme.cap;
    for (let x = 6; x < s.w - 6; x += 10 + r() * 14) {
      if (cap === 'coral' && top) { const col = ['#ff6a8a', '#ffb03a', '#c86ae8', '#ff8a5a'][(r() * 4) | 0]; const hh = 10 + r() * 22; ctx.beginPath(); ctx.moveTo(x, 4); ctx.lineTo(x, -hh); ctx.moveTo(x, -hh * 0.5); ctx.lineTo(x - 7, -hh * 0.8); ctx.moveTo(x, -hh * 0.6); ctx.lineTo(x + 6, -hh); ctx.lineCap = 'round'; stroke(ctx, 5, col); }
      else if (cap === 'snow') { ell(ctx, x, edgeY, 12, 6); ctx.fillStyle = '#ffffff'; ctx.fill(); if (!top) { ctx.beginPath(); ctx.moveTo(x - 4, edgeY); ctx.lineTo(x, edgeY + 10 + r() * 16); ctx.lineTo(x + 4, edgeY); ctx.fillStyle = '#d8f6ff'; ctx.fill(); } }
      else if (cap === 'moss' || cap === 'coral') { ell(ctx, x, edgeY, 9, 5); ctx.fillStyle = cap === 'moss' ? '#5aaa3a' : '#7ac85a'; ctx.fill(); if (!top && r() < 0.4) { ctx.beginPath(); ctx.moveTo(x, edgeY); ctx.quadraticCurveTo(x + 6, edgeY + 20, x, edgeY + 30 + r() * 20); stroke(ctx, 3, '#3a8a2a'); } }
      else if (cap === 'glow' || cap === 'biolum') { if (r() < 0.35) { const yy = top ? -6 : s.h + 6; const gg = ctx.createRadialGradient(x, yy, 0, x, yy, 12); gg.addColorStop(0, cap === 'glow' ? 'rgba(120,255,240,0.95)' : 'rgba(120,200,255,0.95)'); gg.addColorStop(1, 'rgba(120,255,240,0)'); ctx.fillStyle = gg; ctx.fillRect(x - 12, yy - 12, 24, 24); ell(ctx, x, yy, 3, 3); ctx.fillStyle = '#fff'; ctx.fill(); } }
      else if (cap === 'lava') { if (r() < 0.3) { ctx.beginPath(); ctx.moveTo(x, edgeY); ctx.lineTo(x + (r() - 0.5) * 20, top ? 20 + r() * 40 : s.h - 20 - r() * 40); stroke(ctx, 3, '#ff6a1a'); } }
      else if (cap === 'stone') { if (r() < 0.2) { ell(ctx, x, edgeY, 7, 4); ctx.fillStyle = '#6aa04a'; ctx.fill(); } }
      else if (cap === 'planks') { if (r() < 0.25) { ell(ctx, x, edgeY, 6, 3); ctx.fillStyle = '#5a8a3a'; ctx.fill(); } }
    }
    return { canvas: c, pad };
  }

  /* Hintergrund-Ebenen vorrendern */
  function buildBackground(theme, H) {
    const W = 2048;
    const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
    const far = mk(), mid = mk(); const fctx = far.getContext('2d'), mctx = mid.getContext('2d');
    const r = rng(theme.far.length * 97 + 13);
    const sil = (ctx, col, kind, base, amp, density) => {
      ctx.fillStyle = col;
      if (kind === 'coral' || kind === 'jungle' || kind === 'cave' || kind === 'deep') {
        ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W; x += 40) ctx.lineTo(x, base - amp * (0.5 + 0.5 * Math.sin(x * 0.006 + density) * Math.sin(x * 0.013))); ctx.lineTo(W, H); ctx.fill();
        for (let i = 0; i < 18 * density; i++) {
          const x = r() * W, y = base - amp * 0.4 - r() * amp * 0.3;
          if (kind === 'coral') { ctx.beginPath(); ctx.arc(x, y, 18 + r() * 40, Math.PI, TAU); ctx.fill(); for (let k = 0; k < 4; k++) { ctx.fillRect(x - 30 + k * 18, y - 40 - r() * 70, 8, 80); } }
          else if (kind === 'jungle') { ctx.fillRect(x, 0, 18 + r() * 30, H); ctx.beginPath(); ctx.arc(x + 15, 60 + r() * 100, 60 + r() * 80, 0, TAU); ctx.fill(); }
          else if (kind === 'cave') { ctx.beginPath(); ctx.moveTo(x - 60, 0); ctx.lineTo(x, 120 + r() * 220); ctx.lineTo(x + 60, 0); ctx.fill(); }
          else { ctx.beginPath(); ctx.moveTo(x - 40, H); ctx.lineTo(x, base - amp - r() * 200); ctx.lineTo(x + 40, H); ctx.fill(); }
        }
      } else if (kind === 'ship') {
        ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W; x += 60) ctx.lineTo(x, base - amp * 0.4 * (1 + Math.sin(x * 0.004))); ctx.lineTo(W, H); ctx.fill();
        for (let k = 0; k < 2; k++) {
          const x = 300 + k * 1000 + r() * 200, y = base - 60; ctx.save(); ctx.translate(x, y); ctx.rotate(-0.12 + k * 0.2);
          ctx.beginPath(); ctx.moveTo(-260, -60); ctx.lineTo(260, -80); ctx.lineTo(200, 40); ctx.lineTo(-200, 40); ctx.closePath(); ctx.fill();
          ctx.fillRect(-90, -360, 16, 300); ctx.fillRect(80, -300, 14, 230);
          ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.moveTo(-74, -340); ctx.quadraticCurveTo(10, -280, -74, -150); ctx.fill(); ctx.globalAlpha = 1; ctx.restore();
        }
      } else if (kind === 'ice') {
        for (let i = 0; i < 10 * density; i++) { const x = r() * W, w = 120 + r() * 220, hh = 200 + r() * amp * 1.4; ctx.beginPath(); ctx.moveTo(x - w / 2, H); ctx.lineTo(x - w * 0.3, H - hh * 0.7); ctx.lineTo(x, H - hh); ctx.lineTo(x + w * 0.25, H - hh * 0.8); ctx.lineTo(x + w / 2, H); ctx.fill(); }
        for (let i = 0; i < 8 * density; i++) { const x = r() * W, w = 100 + r() * 200, hh = 60 + r() * 140; ctx.beginPath(); ctx.moveTo(x - w / 2, 0); ctx.lineTo(x, hh); ctx.lineTo(x + w / 2, 0); ctx.fill(); }
      } else if (kind === 'temple') {
        ctx.fillRect(0, base, W, H - base);
        for (let i = 0; i < 9 * density; i++) { const x = r() * W, hh = 250 + r() * amp; ctx.fillRect(x, base - hh, 46, hh); ctx.fillRect(x - 12, base - hh - 18, 70, 20); ctx.fillRect(x - 12, base - 14, 70, 14); }
        for (let i = 0; i < 2; i++) { const x = 400 + i * 900 + r() * 200, y = base; ctx.beginPath(); ctx.moveTo(x - 220, y - 300); ctx.lineTo(x, y - 420); ctx.lineTo(x + 220, y - 300); ctx.fill(); ctx.fillRect(x - 200, y - 300, 400, 300); }
      } else if (kind === 'volcano') {
        for (let i = 0; i < 3; i++) { const x = 300 + i * 700 + r() * 200, w = 500 + r() * 300, hh = amp * 1.6 + r() * 200; ctx.beginPath(); ctx.moveTo(x - w / 2, H); ctx.lineTo(x - 50, H - hh); ctx.lineTo(x + 50, H - hh); ctx.lineTo(x + w / 2, H); ctx.fill(); if (density > 1) { ctx.fillStyle = 'rgba(255,90,20,0.6)'; ctx.fillRect(x - 40, H - hh, 80, 12); ctx.beginPath(); ctx.moveTo(x - 10, H - hh + 10); ctx.lineTo(x - 30, H - hh + 160); ctx.lineTo(x + 5, H - hh + 10); ctx.fill(); ctx.fillStyle = col; } }
        for (let i = 0; i < 6; i++) { const x = r() * W; ctx.fillRect(x, base - 200 - r() * 200, 40, 600); }
      }
    };
    sil(fctx, theme.farCol, theme.far, H * 0.62, 260, 1);
    sil(mctx, theme.midCol, theme.far, H * 0.78, 200, 1.4);
    // Leuchtende Details in mittlerer Ebene
    if (theme.far === 'cave' || theme.far === 'deep') { for (let i = 0; i < 60; i++) { const x = r() * W, y = r() * H; const g = mctx.createRadialGradient(x, y, 0, x, y, 10); g.addColorStop(0, theme.far === 'cave' ? 'rgba(160,255,230,0.6)' : 'rgba(120,180,255,0.6)'); g.addColorStop(1, 'rgba(0,0,0,0)'); mctx.fillStyle = g; mctx.fillRect(x - 10, y - 10, 20, 20); } }
    return { far, mid, W };
  }

  /* Boden-Deko je Welt */
  function drawProp(ctx, p, y, t) {
    ctx.save(); ctx.translate(p.x, y); ctx.scale(p.s, p.s); const sd = p.seed;
    const cols = ['#ff6a8a', '#ffb03a', '#c86ae8', '#ff8a5a', '#5ad8c8'];
    switch (p.kind) {
      case 'coral': { const c = cols[(sd | 0) % 5]; ctx.lineCap = 'round'; const br = (x, yy, a, len, w, d) => { if (d > 3) return; const x2 = x + Math.sin(a) * len, y2 = yy - Math.cos(a) * len; ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x2, y2); ctx.lineWidth = w; ctx.strokeStyle = shade(c, -20 + d * 8); ctx.stroke(); br(x2, y2, a - 0.45 + Math.sin(t + sd) * 0.04, len * 0.72, w * 0.72, d + 1); br(x2, y2, a + 0.5, len * 0.7, w * 0.72, d + 1); }; br(0, 0, -0.1, 40, 13, 0); break; }
      case 'starfish': { ctx.rotate(sd); ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU, r = i % 2 ? 7 : 20; ctx.lineTo(Math.cos(a) * r, -8 + Math.sin(a) * r * 0.6); } ctx.closePath(); fillS(ctx, '#ff8a3a', 2.5, '#a8400a'); break; }
      case 'anemone': for (let i = 0; i < 9; i++) { const a = -1.2 + i * 0.3 + Math.sin(t * 2 + i + sd) * 0.12; ctx.beginPath(); ctx.moveTo(0, -12); ctx.quadraticCurveTo(Math.sin(a) * 20, -24, Math.sin(a) * 30, -12 - Math.cos(a) * 34); ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.strokeStyle = '#ff7ab8'; ctx.stroke(); } ell(ctx, 0, -6, 18, 12); fillS(ctx, '#e8508a', 2.5, '#8a1a4a'); break;
      case 'barrel': ctx.rotate(sd % 1 > 0.5 ? 0.25 : 0); rr(ctx, -20, -50, 40, 50, 10); fillS(ctx, '#9a6a32', 3, '#3a2010'); ctx.fillStyle = '#5a5a6a'; ctx.fillRect(-20, -42, 40, 5); ctx.fillRect(-20, -12, 40, 5); break;
      case 'anchor': ctx.rotate(0.4); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, -70); ctx.lineTo(0, -6); ctx.moveTo(-14, -56); ctx.lineTo(14, -56); stroke(ctx, 7, '#4a5a6a'); ctx.beginPath(); ctx.arc(0, -26, 22, 0.2, Math.PI - 0.2); stroke(ctx, 7, '#4a5a6a'); ell(ctx, 0, -76, 7, 7); stroke(ctx, 4, '#4a5a6a'); break;
      case 'coins': for (let i = 0; i < 6; i++) { ell(ctx, -18 + i * 7, -5 - (i % 3) * 6, 9, 5); fillS(ctx, '#ffcc2a', 1.5, '#a87a00'); } break;
      case 'crystal': [[-10, 40, -0.2], [6, 56, 0.1], [18, 30, 0.4]].forEach(([x, h, a]) => { ctx.save(); ctx.translate(x, 0); ctx.rotate(a); ctx.beginPath(); ctx.moveTo(-7, 0); ctx.lineTo(-7, -h * 0.75); ctx.lineTo(0, -h); ctx.lineTo(7, -h * 0.75); ctx.lineTo(7, 0); ctx.closePath(); fillS(ctx, 'rgba(170,230,255,0.85)', 2, '#3a7aa8'); ctx.restore(); }); break;
      case 'leaf': for (let i = -1; i <= 1; i++) { ctx.save(); ctx.rotate(i * 0.5 + Math.sin(t + sd + i) * 0.06); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-26, -50, 0, -90); ctx.quadraticCurveTo(26, -50, 0, 0); fillS(ctx, i ? '#3a9a4a' : '#4ab85a', 2.5, '#1a5a2a'); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -86); stroke(ctx, 1.5, '#1a5a2a'); ctx.restore(); } break;
      case 'log': rr(ctx, -50, -24, 100, 24, 12); fillS(ctx, '#6a4a2a', 3, '#2a1a0a'); ell(ctx, 50, -12, 8, 12); fillS(ctx, '#c8a46a', 2, '#2a1a0a'); break;
      case 'column': rr(ctx, -16, -70, 32, 70, 3); fillS(ctx, '#c8b88a', 3, '#6a5a3a'); rr(ctx, -22, -78, 44, 12, 3); fillS(ctx, '#d8c89a', 3, '#6a5a3a'); ctx.beginPath(); ctx.moveTo(-6, -66); ctx.lineTo(-6, -4); ctx.moveTo(6, -66); ctx.lineTo(6, -4); stroke(ctx, 2, 'rgba(90,70,40,0.4)'); break;
      case 'urn': ctx.beginPath(); ctx.moveTo(-10, -50); ctx.quadraticCurveTo(-30, -30, -14, 0); ctx.lineTo(14, 0); ctx.quadraticCurveTo(30, -30, 10, -50); ctx.closePath(); fillS(ctx, '#c8783a', 3, '#5a2a0a'); ctx.beginPath(); ctx.moveTo(-18, -26); ctx.lineTo(18, -26); stroke(ctx, 3, '#ffcc4a'); break;
      case 'mushroom': [[-12, 26, 14], [10, 40, 18]].forEach(([x, h, r]) => { rr(ctx, x - 4, -h, 8, h, 3); fillS(ctx, '#e8e0f8', 2, '#5a4a7a'); ctx.beginPath(); ctx.arc(x, -h, r, Math.PI, TAU); ctx.closePath(); const g = ctx.createRadialGradient(x, -h - 4, 0, x, -h, r * 2); g.addColorStop(0, '#9affea'); g.addColorStop(1, '#6a4ad8'); fillS(ctx, g, 2, '#3a2a7a'); }); break;
      case 'glowplant': { const g = ctx.createRadialGradient(0, -50, 0, 0, -50, 40); g.addColorStop(0, `rgba(120,220,255,${0.5 + 0.3 * Math.sin(t * 2 + sd)})`); g.addColorStop(1, 'rgba(120,220,255,0)'); ctx.fillStyle = g; ctx.fillRect(-40, -90, 80, 80); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(10, -30, 0, -50); stroke(ctx, 4, '#2a6a8a'); ell(ctx, 0, -52, 7, 9); ctx.fillStyle = '#d8f8ff'; ctx.fill(); break; }
      case 'lavarock': ctx.beginPath(); ctx.moveTo(-36, 0); ctx.lineTo(-26, -30); ctx.lineTo(4, -40); ctx.lineTo(30, -22); ctx.lineTo(38, 0); ctx.closePath(); fillS(ctx, '#3a2a2a', 3, '#120808'); ctx.beginPath(); ctx.moveTo(-20, -24); ctx.lineTo(-4, -14); ctx.lineTo(14, -28); ctx.moveTo(-4, -14); ctx.lineTo(0, 0); ctx.strokeStyle = `rgba(255,${110 + 60 * Math.sin(t * 3 + sd) | 0},30,0.95)`; ctx.lineWidth = 3; ctx.stroke(); break;
    }
    ctx.restore();
  }

  /* Kosmetik-Icons (Shop) */
  function drawItemIcon(ctx, id, cx, cy, s, t) {
    ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s);
    const dol = (cos, col) => drawDolphin(ctx, { x: 0, y: 6, facing: 1, color: col || 'blau', t, cos, scale: 0.75, speed: 0.2 });
    switch (id) {
      case 'piratenhut': case 'krone': ctx.translate(-26, 66); ctx.scale(1.8, 1.8); drawCosmetics(ctx, { head: id }, t); break;
      case 'kopfhoerer': ctx.translate(-25, 28); ctx.scale(1.75, 1.75); drawCosmetics(ctx, { head: id }, t); break;
      case 'taucherbrille': case 'sonnenbrille': ctx.translate(-42, 20); ctx.scale(2, 2); drawCosmetics(ctx, { eyes: id }, t); break;
      case 'schnorchel': ctx.translate(-36, 46); ctx.scale(1.6, 1.6); drawCosmetics(ctx, { eyes: id }, t); break;
      case 'feuer': case 'regenbogen': case 'galaxie': case 'kristall': dol({ skin: id }); break;
      case 'hai': case 'gold': dol({ fins: id }, 'blau'); break;
      case 'trail-blubber': for (let i = 0; i < 6; i++) { ell(ctx, -36 + i * 14, Math.sin(i) * 8, 4 + i, 4 + i); fillS(ctx, 'rgba(200,240,255,0.5)', 2, '#bff'); } break;
      case 'trail-sterne': for (let i = 0; i < 5; i++) star(ctx, -36 + i * 18, Math.sin(i * 1.4) * 10, 5 + i * 1.5, '#ffe04a'); break;
      case 'trail-regenbogen': ['#ff5a5a', '#ffb13a', '#ffe94a', '#5ee36a', '#4ab8ff', '#9a6aff'].forEach((c, i) => { ctx.beginPath(); ctx.moveTo(-44, -10 + i * 4); ctx.quadraticCurveTo(0, -30 + i * 4, 44, -10 + i * 4); stroke(ctx, 4, c); }); break;
      case 'schildkroete': ctx.scale(1.8, 1.8); drawTurtle(ctx, -4, 0, t, 1); break;
      default: {
        const X = root.ArtExtras; if (!X) break;
        if (X.OUTFITS[id]) drawDolphin(ctx, { x: 0, y: 6, facing: 1, color: 'blau', t, cos: { body: id }, scale: 0.8, speed: 0.2 });
        else if (id.startsWith('peruecke-')) drawDolphin(ctx, { x: -18, y: 26, facing: 1, color: 'blau', t, cos: { hair: id }, scale: 1.05, speed: 0.2 });
        else if (id.startsWith('begleiter-')) { ctx.scale(1.5, 1.5); X.drawBuddy(ctx, id, 0, 2, t, 1); }
      }
    }
    ctx.restore();
  }

  root.Art = { drawCompanion, bodyPath, COLORS, drawProp, drawDolphin, drawTurtle, drawEnemy, drawBoss, drawShell, drawPearl, drawChest, drawCheckpoint, drawSwitch, renderSolid, buildBackground, drawItemIcon, star, shade, rng, ell, fillS, stroke, rr };
})(window);
