/* OceanQuest – Shop-Erweiterung: Trikots, Badeanzüge, Perücken, witzige Begleiter (Vorschau) */
(function (root) {
  'use strict';
  const TAU = Math.PI * 2, OUT = '#16324f';
  const A = () => root.Art;
  const ell = (c, x, y, rx, ry, r) => { c.beginPath(); c.ellipse(x, y, Math.abs(rx), Math.abs(ry), r || 0, 0, TAU); };
  const fs = (c, f, w, s) => { c.fillStyle = f; c.fill(); if (w) { c.lineWidth = w; c.strokeStyle = s || OUT; c.stroke(); } };

  /* ---------- Trikots & Badeanzüge (Körperbereich, auf den Delfinkörper zugeschnitten) ---------- */
  const OUTFITS = {
    'trikot-weiss':   { kind: 'jersey', base: '#fbfbf8', stripes: null, trim: '#d4a72c', num: '#c9a02a', numOut: '#6a5210', shine: true },
    'trikot-rotstreif': { kind: 'jersey', base: '#dc052d', stripes: ['#9c0322', 7, 5], trim: '#ffffff', num: '#ffffff', numOut: '#7a0018' },
    'trikot-rot':     { kind: 'jersey', base: '#e2121c', stripes: null, trim: '#ffffff', num: '#ffffff', numOut: '#7a0a10' },
    'trikot-blaurot': { kind: 'jersey', base: '#a50044', stripes: ['#1b3f94', 12, 12], trim: '#f6c700', num: '#f6c700', numOut: '#4a1028' },
    'trikot-schwarz': { kind: 'jersey', base: '#1c1c1f', stripes: null, trim: '#e1000f', trim2: '#ffffff', num: '#ffffff', numOut: '#e1000f' },
    'badeanzug-retro':  { kind: 'swim', base: '#ffffff', hstripes: '#e8323a' },
    'badeanzug-punkte': { kind: 'swim', base: '#ffd23a', dots: '#ffffff' }
  };
  function jerseyPath(c) { c.beginPath(); c.moveTo(-27, -40); c.lineTo(20, -40); c.quadraticCurveTo(12, -14, 25, 30); c.lineTo(-27, 30); c.quadraticCurveTo(-20, -4, -27, -40); c.closePath(); }
  function swimPath(c) { c.beginPath(); c.moveTo(-33, -6); c.quadraticCurveTo(-8, -16, 16, -8); c.quadraticCurveTo(10, 8, 20, 30); c.lineTo(-30, 30); c.quadraticCurveTo(-26, 10, -33, -6); c.closePath(); }
  function outfit(c, id, t) {
    const o = OUTFITS[id]; if (!o) return;
    c.save();
    if (o.kind === 'jersey') {
      jerseyPath(c); c.fillStyle = o.base; c.fill(); c.save(); jerseyPath(c); c.clip();
      if (o.stripes) { const [col, w, gap] = o.stripes; c.fillStyle = col; for (let x = -27 + gap; x < 26; x += w + gap) c.fillRect(x, -40, w, 72); }
      const sh = c.createLinearGradient(0, -28, 0, 22); sh.addColorStop(0, 'rgba(0,0,0,0.18)'); sh.addColorStop(0.45, 'rgba(255,255,255,0.10)'); sh.addColorStop(1, 'rgba(0,0,0,0.22)'); c.fillStyle = sh; c.fillRect(-30, -40, 60, 72);
      c.strokeStyle = 'rgba(0,0,0,0.12)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-12, -20); c.quadraticCurveTo(-8, 0, -14, 18); c.moveTo(8, -22); c.quadraticCurveTo(4, -4, 10, 16); c.stroke();
      if (o.shine) { const g = c.createLinearGradient(-20, -30, 20, 20); g.addColorStop(0.35, 'rgba(255,240,190,0)'); g.addColorStop(0.5, `rgba(255,236,160,${0.35 + 0.25 * Math.sin(t * 3)})`); g.addColorStop(0.65, 'rgba(255,240,190,0)'); c.fillStyle = g; c.fillRect(-30, -40, 60, 72); }
      c.font = 'bold 15px Fredoka, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 3; c.strokeStyle = o.numOut; c.strokeText('10', -4, 3); c.fillStyle = o.num; c.fillText('10', -4, 3);
      c.restore();
      // Kragen (vorn) und Saum (hinten)
      c.lineCap = 'round';
      c.beginPath(); c.moveTo(20, -40); c.quadraticCurveTo(12, -14, 25, 30); c.lineWidth = 4; c.strokeStyle = o.trim; c.stroke();
      if (o.trim2) { c.beginPath(); c.moveTo(16.5, -40); c.quadraticCurveTo(8.5, -14, 21.5, 30); c.lineWidth = 1.8; c.strokeStyle = o.trim2; c.stroke(); }
      c.beginPath(); c.moveTo(-27, -40); c.quadraticCurveTo(-20, -4, -27, 30); c.lineWidth = 3; c.strokeStyle = o.trim; c.stroke();
      if (o.shine) { c.save(); c.translate(-4, -14); A().star(c, 0, 0, 4, '#ffd23a'); c.restore(); }
    } else {
      swimPath(c); c.fillStyle = o.base; c.fill(); c.save(); swimPath(c); c.clip();
      if (o.hstripes) { c.fillStyle = o.hstripes; for (let y = -16; y < 32; y += 10) c.fillRect(-36, y, 60, 5); }
      if (o.dots) { c.fillStyle = o.dots; for (let y = -14; y < 30; y += 9) for (let x = -34 + ((y / 9) & 1) * 5; x < 22; x += 10) { ell(c, x, y, 2.6, 2.6); c.fill(); } }
      const sh = c.createLinearGradient(0, -10, 0, 24); sh.addColorStop(0, 'rgba(255,255,255,0.15)'); sh.addColorStop(1, 'rgba(0,0,0,0.2)'); c.fillStyle = sh; c.fillRect(-36, -18, 60, 50);
      c.restore();
      c.beginPath(); c.moveTo(-33, -6); c.quadraticCurveTo(-8, -16, 16, -8); c.lineWidth = 2.5; c.strokeStyle = o.hstripes || '#e89a00'; c.stroke();
      // Träger über den Rücken
      c.lineCap = 'round'; c.lineWidth = 4; c.strokeStyle = o.hstripes || '#e8a800';
      c.beginPath(); c.moveTo(8, -10); c.quadraticCurveTo(6, -22, 2, -30); c.moveTo(-20, -10); c.quadraticCurveTo(-18, -20, -16, -28); c.stroke();
      if (o.dots) { ell(c, 14, 6, 4, 3); fs(c, '#ff7ab8', 1.5, '#a83a6a'); }
    }
    c.restore();
  }
  function sleeve(c, id) {
    const o = OUTFITS[id]; if (!o || o.kind !== 'jersey') return;
    c.save(); c.translate(14, 9); c.rotate(0.35);
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-4, 16, -16, 22); c.quadraticCurveTo(-8, 8, -10, -2); c.closePath(); c.clip();
    c.fillStyle = o.stripes ? o.stripes[0] : o.base; c.fillRect(-20, -6, 30, 13);
    c.beginPath(); c.moveTo(-20, 7); c.lineTo(10, 7); c.lineWidth = 3; c.strokeStyle = o.trim; c.stroke();
    c.restore();
  }

  /* ---------- Perücken (auf dem Kopf, Auge bleibt frei) ---------- */
  function curl(c, x, y, r, col, line) { ell(c, x, y, r, r); fs(c, col, 1.6, line); }
  const WIGS = {
    afro(c, t) { const cols = ['#ff4a5a', '#ff9a2a', '#ffd83a', '#4ad86a', '#3aa8ff', '#9a5aff']; let k = 0;
      for (let ring = 0; ring < 3; ring++) for (let i = 0; i <= 6 - ring; i++) { const a = Math.PI * 1.02 + (i / (6 - ring)) * Math.PI * 0.9; const rr = 26 - ring * 9; curl(c, 13 + Math.cos(a) * rr, -20 + Math.sin(a) * rr * 0.95 + Math.sin(t * 3 + k) * 0.6, 8, cols[k++ % 6], 'rgba(0,0,0,0.35)'); } },
    blond(c, t) { const g = c.createLinearGradient(0, -44, 0, 0); g.addColorStop(0, '#fff2a0'); g.addColorStop(1, '#e8b830');
      c.beginPath(); c.moveTo(36, -18); c.quadraticCurveTo(34, -40, 10, -40); c.quadraticCurveTo(-22, -40, -32, -18);
      for (let i = 0; i < 4; i++) { const y = -14 + i * 6, s = Math.sin(t * 2 + i) * 2; c.quadraticCurveTo(-40 + s, y + 3, -34 + s, y + 6); }
      c.quadraticCurveTo(-18, -16, -6, -24); c.quadraticCurveTo(14, -28, 24, -22); c.quadraticCurveTo(30, -18, 36, -18); fs(c, g, 2, '#a87a10');
      c.strokeStyle = 'rgba(160,110,10,0.55)'; c.lineWidth = 1.4; for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(24 - i * 10, -36); c.quadraticCurveTo(14 - i * 12, -30, 6 - i * 12, -22 + i * 2); c.stroke(); }
      c.beginPath(); c.moveTo(36, -18); c.quadraticCurveTo(40, -24, 34, -30); stroke(c, 2, '#a87a10');
      ell(c, -2, -34, 6, 3, -0.3); c.fillStyle = 'rgba(255,255,255,0.6)'; c.fill(); },
    iro(c, t) { const pts = [[30, -20, 0.55], [22, -26, 0.25], [12, -28, 0], [1, -27, -0.25], [-10, -25, -0.5]];
      pts.forEach(([x, y, a], i) => { c.save(); c.translate(x, y); c.rotate(a + Math.sin(t * 4 + i) * 0.04); const h = 20 + (i === 2 ? 6 : i % 2 ? 2 : 0); c.beginPath(); c.moveTo(-6, 2); c.lineTo(0, -h); c.lineTo(6, 2); c.closePath(); const g = c.createLinearGradient(0, -h, 0, 2); g.addColorStop(0, '#c8ff3a'); g.addColorStop(1, '#2ab84a'); fs(c, g, 2, '#1a6a2a'); c.restore(); }); },
    clown(c, t) { ell(c, 14, -25, 16, 6, -0.05); fs(c, 'rgba(255,220,200,0.0)');
      for (const [x, y] of [[-8, -30], [-14, -22], [-2, -36], [-12, -38], [-20, -30]]) curl(c, x, y + Math.sin(t * 3 + x) * 0.6, 8, '#ff7a1a', '#a83a00');
      for (const [x, y] of [[36, -24], [42, -18], [32, -32]]) curl(c, x, y, 6, '#ff7a1a', '#a83a00');
      ell(c, 14, -27, 10, 3, -0.1); c.fillStyle = 'rgba(255,255,255,0.55)'; c.fill(); },
    tolle(c, t) { const g = c.createLinearGradient(0, -50, 0, -20); g.addColorStop(0, '#3a3a4a'); g.addColorStop(1, '#0a0a12');
      c.beginPath(); c.moveTo(-14, -24); c.quadraticCurveTo(-10, -42, 10, -46); c.quadraticCurveTo(38, -52, 46, -38); c.quadraticCurveTo(48, -28, 38, -30); c.quadraticCurveTo(40, -36, 30, -36); c.quadraticCurveTo(30, -26, 22, -24); c.quadraticCurveTo(4, -28, -14, -24); fs(c, g, 2, '#000');
      c.strokeStyle = 'rgba(120,130,160,0.7)'; c.lineWidth = 1.3; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-10 + i * 4, -25); c.quadraticCurveTo(4 + i * 6, -44 + i * 2, 38 - i * 3, -40 + i * 2); c.stroke(); }
      c.beginPath(); c.moveTo(38, -30); c.quadraticCurveTo(46, -34, 42, -40); c.quadraticCurveTo(40, -44, 36, -40); c.lineWidth = 2; c.strokeStyle = '#000'; c.stroke();
      c.beginPath(); c.moveTo(18, -24); c.quadraticCurveTo(22, -18, 20, -14); c.lineWidth = 4; c.strokeStyle = '#1a1a24'; c.stroke();
      c.beginPath(); c.moveTo(4, -41); c.quadraticCurveTo(24, -49, 40, -43); c.lineWidth = 3; c.strokeStyle = `rgba(255,255,255,${0.45 + 0.2 * Math.sin(t * 3)})`; c.stroke(); },
    barock(c, t) { ell(c, 10, -30, 22, 10); fs(c, '#f4f4f0', 2, '#9a9a9a');
      for (let col = 0; col < 3; col++) for (let row = 0; row < 4; row++) curl(c, -6 - col * 9, -32 + row * 9 + col * 2, 6, '#f8f8f4', '#9a9a9a');
      for (let i = 0; i < 5; i++) curl(c, 0 + i * 8, -38 + Math.abs(i - 2) * 1.5, 5.5, '#ffffff', '#9a9a9a');
      c.save(); c.translate(-30, -20); c.beginPath(); c.moveTo(0, 0); c.lineTo(-8, -6); c.lineTo(-8, 6); c.closePath(); c.moveTo(0, 0); c.lineTo(8, -6); c.lineTo(8, 6); c.closePath(); fs(c, '#1a1a1a', 1, '#000'); c.restore(); },
    zoepfe(c, t) { const br = '#8a4a1e';
      c.beginPath(); c.moveTo(36, -18); c.quadraticCurveTo(30, -38, 8, -38); c.quadraticCurveTo(-14, -36, -18, -22); c.quadraticCurveTo(4, -28, 36, -18); fs(c, br, 2, '#4a2208');
      c.beginPath(); c.moveTo(30, -26); c.lineTo(16, -32); c.moveTo(20, -24); c.lineTo(6, -33); stroke(c, 1.5, '#4a2208');
      [[-16, -24, 0], [-4, -30, 0.6]].forEach(([x, y, ph]) => { const sw = Math.sin(t * 2.5 + ph) * 3;
        for (let i = 0; i < 4; i++) { ell(c, x - 6 - i * 4 + sw * i / 4, y + 6 + i * 7, 5, 4.2, 0.5); fs(c, br, 1.6, '#4a2208'); }
        const bx = x - 22 + sw, by = y + 32; ell(c, bx, by, 4, 3); fs(c, '#8a4a1e', 1.4, '#4a2208');
        c.beginPath(); c.moveTo(x - 4, y + 3); c.lineTo(x - 11, y - 3); c.lineTo(x - 11, y + 7); c.closePath(); c.moveTo(x - 4, y + 3); c.lineTo(x + 3, y - 3); c.lineTo(x + 3, y + 7); c.closePath(); fs(c, '#ff6ab0', 1.4, '#a8205a'); }); }
  };
  function stroke(c, w, s) { c.lineWidth = w; c.strokeStyle = s; c.stroke(); }
  function wig(c, id, t) { const f = WIGS[id.replace('peruecke-', '')]; if (f) { c.save(); f(c, t); c.restore(); } }

  /* ---------- Witzige Begleiter ---------- */
  const BUDDIES = {
    seepferdchen(c, t) { const g = c.createLinearGradient(-10, -30, 10, 20); g.addColorStop(0, '#ffe04a'); g.addColorStop(1, '#ff9a2a');
      c.beginPath(); c.moveTo(4, -26); c.quadraticCurveTo(14, -30, 18, -22); c.lineTo(26, -20); c.lineTo(26, -15); c.lineTo(16, -15); c.quadraticCurveTo(10, -10, 10, 0); c.quadraticCurveTo(10, 14, 2, 18); c.quadraticCurveTo(-8, 22, -6, 30); c.quadraticCurveTo(-2, 36, 4, 32); c.quadraticCurveTo(0, 30, 0, 27); c.quadraticCurveTo(8, 24, 2, 26); c.quadraticCurveTo(-10, 22, -6, 10); c.quadraticCurveTo(-10, -6, -2, -16); c.quadraticCurveTo(-4, -24, 4, -26); fs(c, g, 2, '#a85a00');
      c.save(); c.translate(-8, 0); c.rotate(Math.sin(t * 12) * 0.3); c.beginPath(); c.moveTo(0, -6); c.quadraticCurveTo(-10, 0, 0, 6); fs(c, 'rgba(255,240,200,0.9)', 1.2, '#a85a00'); c.restore();
      for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-6 + i, -8 + i * 6); c.lineTo(8 + i * 0.5, -8 + i * 6); stroke(c, 1, 'rgba(168,90,0,0.5)'); }
      ell(c, 10, -21, 3, 3); fs(c, '#fff', 1, '#a85a00'); ell(c, 11, -21, 1.6, 1.8); c.fillStyle = '#111'; c.fill(); },
    krake(c, t) { for (let i = 0; i < 6; i++) { c.beginPath(); const x = -12 + i * 5; c.moveTo(x, 4); c.quadraticCurveTo(x - 4 + Math.sin(t * 6 + i) * 5, 14, x + Math.sin(t * 5 + i) * 4, 22); stroke(c, 4.5, '#8a4ad8'); }
      ell(c, 0, -4, 15, 12); fs(c, '#a86af0', 2, '#4a2a8a'); ell(c, -5, -4, 3, 3.4); fs(c, '#fff', 1); ell(c, 5, -4, 3, 3.4); fs(c, '#fff', 1); c.fillStyle = '#111'; ell(c, -4.4, -3.6, 1.6, 2); c.fill(); ell(c, 5.6, -3.6, 1.6, 2); c.fill();
      c.beginPath(); c.arc(0, 2, 3, 0.2, Math.PI - 0.2); stroke(c, 1.5, '#4a2a8a');
      c.save(); c.translate(2, -15); c.rotate(-0.15 + Math.sin(t * 2) * 0.06); ell(c, 0, 0, 13, 3); fs(c, '#1a1a22', 1.4, '#000'); c.fillStyle = '#1a1a22'; c.fillRect(-8, -16, 16, 16); c.strokeStyle = '#000'; c.lineWidth = 1.4; c.strokeRect(-8, -16, 16, 16); c.fillStyle = '#e8323a'; c.fillRect(-8, -5, 16, 3.5); c.restore(); },
    ente(c, t) { c.save(); c.rotate(Math.sin(t * 2.5) * 0.12);
      c.beginPath(); c.moveTo(-18, 2); c.quadraticCurveTo(-24, -10, -14, -6); c.quadraticCurveTo(-4, -4, 10, -2); c.quadraticCurveTo(20, 2, 14, 12); c.quadraticCurveTo(-4, 20, -18, 2); fs(c, '#ffd82a', 2, '#a87a00');
      c.beginPath(); c.moveTo(-6, 4); c.quadraticCurveTo(2, 0, 6, 8); stroke(c, 1.6, '#c89a00');
      ell(c, 8, -12, 10, 10); fs(c, '#ffd82a', 2, '#a87a00');
      c.beginPath(); c.moveTo(16, -12); c.quadraticCurveTo(26, -12, 24, -8); c.quadraticCurveTo(20, -6, 16, -8); fs(c, '#ff8a1a', 1.5, '#a84a00');
      ell(c, 11, -15, 2, 2.4); c.fillStyle = '#111'; c.fill(); ell(c, 4, -9, 3, 2); c.fillStyle = 'rgba(255,120,120,0.5)'; c.fill(); c.restore(); },
    krabbe(c, t) { const w = Math.sin(t * 6);
      for (let s = -1; s <= 1; s += 2) for (let j = 0; j < 3; j++) { c.beginPath(); c.moveTo(s * 6, 5); c.lineTo(s * (12 + j * 3), 11 + (j % 2 ? w : -w) * 2); stroke(c, 2.2, '#a8281a'); }
      ell(c, 0, 2, 13, 9); fs(c, '#ef4a35', 2, '#7a1a0a');
      c.beginPath(); c.moveTo(-9, -3); c.lineTo(-15, -10); stroke(c, 2.2, '#a8281a'); ell(c, -16, -12, 4.5, 4); fs(c, '#ef4a35', 1.6, '#7a1a0a');
      c.save(); c.translate(10, -3); c.rotate(-0.6 + w * 0.5); c.beginPath(); c.moveTo(0, 0); c.lineTo(6, -9); stroke(c, 2.2, '#a8281a'); ell(c, 7, -12, 5, 4.5); fs(c, '#ef4a35', 1.6, '#7a1a0a'); c.restore();
      c.beginPath(); c.moveTo(-3, -4); c.lineTo(-3, -9); c.moveTo(3, -4); c.lineTo(3, -9); stroke(c, 1.5, '#7a1a0a');
      c.beginPath(); c.moveTo(-9, -12); c.lineTo(9, -12); c.lineTo(8, -8); c.quadraticCurveTo(4, -6, 1, -9); c.quadraticCurveTo(-4, -6, -8, -8); c.closePath(); fs(c, '#111', 1, '#000');
      c.beginPath(); c.moveTo(-6, -11); c.lineTo(-3, -11); stroke(c, 1, 'rgba(255,255,255,0.7)');
      c.beginPath(); c.arc(0, 3, 3.5, 0.2, Math.PI - 0.2); stroke(c, 1.5, '#7a1a0a'); },
    kugelfisch(c, t) { const k = 1 + Math.max(0, Math.sin(t * 1.4)) * 0.45; c.save(); c.scale(k, k);
      c.fillStyle = '#e8a800'; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; c.beginPath(); c.moveTo(Math.cos(a - 0.15) * 11, Math.sin(a - 0.15) * 11); c.lineTo(Math.cos(a) * 16, Math.sin(a) * 16); c.lineTo(Math.cos(a + 0.15) * 11, Math.sin(a + 0.15) * 11); c.fill(); }
      ell(c, 0, 0, 12, 11); fs(c, '#ffd84a', 1.8, '#a87a00'); ell(c, 2, 5, 8, 5); c.fillStyle = '#fff4c0'; c.fill();
      ell(c, 5, -3, 3, 3.2); fs(c, '#fff', 1); ell(c, 5.8, -2.6, 1.6, 1.8); c.fillStyle = '#111'; c.fill();
      ell(c, 3, 4, 2.6, 2.2); fs(c, '#ff7a7a', 1, '#a83a3a'); ell(c, -4, 1, 3, 2); c.fillStyle = 'rgba(255,120,150,0.5)'; c.fill(); c.restore(); },
    babyhai(c, t) { c.save(); c.translate(-14, 0); c.rotate(Math.sin(t * 8) * 0.3); c.beginPath(); c.moveTo(2, 0); c.lineTo(-10, -9); c.lineTo(-7, 0); c.lineTo(-10, 8); c.closePath(); fs(c, '#7a9ab8', 1.6, '#2a4a6a'); c.restore();
      c.beginPath(); c.moveTo(-3, -8); c.lineTo(-6, -17); c.lineTo(4, -8); fs(c, '#7a9ab8', 1.6, '#2a4a6a');
      ell(c, 0, 0, 16, 9); fs(c, '#8fb0d0', 1.8, '#2a4a6a'); c.save(); ell(c, 0, 0, 16, 9); c.clip(); ell(c, 2, 8, 16, 5); c.fillStyle = '#eef4f8'; c.fill(); c.restore(); ell(c, 0, 0, 16, 9); stroke(c, 1.8, '#2a4a6a');
      ell(c, 8, -2, 2.6, 2.8); fs(c, '#fff', 1, '#2a4a6a'); ell(c, 8.6, -1.8, 1.4, 1.6); c.fillStyle = '#111'; c.fill();
      ell(c, 17, 3, 4, 4); fs(c, '#ff8ac8', 1.4, '#a8306a'); c.beginPath(); c.arc(21, 3, 3, -1.2, 1.2); stroke(c, 1.6, '#a8306a'); ell(c, 15, 3, 2, 3); c.fillStyle = '#ffd0e8'; c.fill(); }
  };
  function drawBuddy(c, id, x, y, t, f) { const fn = BUDDIES[id.replace('begleiter-', '')]; if (!fn) return; c.save(); c.translate(x, y); c.scale(f || 1, 1); fn(c, t); c.restore(); }

  const ITEMS = [
    { id: 'trikot-weiss', name: 'Real', hint: 'Weiß mit Gold', slot: 'body', price: 4000, cat: 'Trikots', premium: true },
    { id: 'trikot-rotstreif', name: 'Bayern', hint: 'Rot mit dunkelroten Streifen', slot: 'body', price: 1800, cat: 'Trikots' },
    { id: 'trikot-rot', name: 'Mainz', hint: 'Knallrot', slot: 'body', price: 1500, cat: 'Trikots' },
    { id: 'trikot-blaurot', name: 'Barcelona', hint: 'Blau-rot gestreift', slot: 'body', price: 1800, cat: 'Trikots' },
    { id: 'trikot-schwarz', name: 'Frankfurt', hint: 'Schwarz mit Rot', slot: 'body', price: 1500, cat: 'Trikots' },
    { id: 'badeanzug-retro', name: 'Retro-Badeanzug', hint: 'Rot-weiß gestreift wie anno 1920', slot: 'body', price: 700, cat: 'Badeanzüge' },
    { id: 'badeanzug-punkte', name: 'Pünktchen-Badeanzug', hint: 'Gelb mit weißen Punkten', slot: 'body', price: 800, cat: 'Badeanzüge' },
    { id: 'peruecke-afro', name: 'Regenbogen-Afro', hint: 'Jede Locke eine andere Farbe', slot: 'hair', price: 900, cat: 'Perücken' },
    { id: 'peruecke-blond', name: 'Surfer-Mähne', hint: 'Lange blonde Wellen', slot: 'hair', price: 800, cat: 'Perücken' },
    { id: 'peruecke-iro', name: 'Punk-Iro', hint: 'Giftgrüner Irokese', slot: 'hair', price: 700, cat: 'Perücken' },
    { id: 'peruecke-clown', name: 'Clown-Locken', hint: 'Orange Büschel, Glatze in der Mitte', slot: 'hair', price: 600, cat: 'Perücken' },
    { id: 'peruecke-tolle', name: 'Rock-’n’-Roll-Tolle', hint: 'Schwarz und glänzend', slot: 'hair', price: 850, cat: 'Perücken' },
    { id: 'peruecke-barock', name: 'Richter-Perücke', hint: 'Weiße Barocklocken mit Schleife', slot: 'hair', price: 1100, cat: 'Perücken' },
    { id: 'peruecke-zoepfe', name: 'Zöpfe', hint: 'Zwei Zöpfe mit pinken Schleifen', slot: 'hair', price: 650, cat: 'Perücken' },
    { id: 'begleiter-seepferdchen', name: 'Seepferdchen Sunny', hint: 'Flattert mit der Rückenflosse', slot: 'companion', price: 1400, cat: 'Begleiter' },
    { id: 'begleiter-krake', name: 'Krake mit Zylinder', hint: 'Sehr vornehm, sehr wackelig', slot: 'companion', price: 1700, cat: 'Begleiter' },
    { id: 'begleiter-ente', name: 'Quietsche-Ente', hint: 'Hat sich irgendwie ins Meer verirrt', slot: 'companion', price: 1200, cat: 'Begleiter' },
    { id: 'begleiter-krabbe', name: 'Coole Krabbe', hint: 'Sonnenbrille, winkt mit der Schere', slot: 'companion', price: 1300, cat: 'Begleiter' },
    { id: 'begleiter-kugelfisch', name: 'Pump-Kugelfisch', hint: 'Bläst sich alle paar Sekunden auf', slot: 'companion', price: 1500, cat: 'Begleiter' },
    { id: 'begleiter-babyhai', name: 'Baby-Hai', hint: 'Mit rosa Schnuller', slot: 'companion', price: 1600, cat: 'Begleiter' }
  ];
  root.ArtExtras = { outfit, sleeve, wig, drawBuddy, ITEMS, OUTFITS };
})(window);
