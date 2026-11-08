/* OceanQuest – Spielzeit-Limit: 90 Minuten pro Gerät und Tag (Reset um Mitternacht) */
(function (root) {
  'use strict';
  const KEY = 'oceanquest.playtime.v1', LIMIT = 90 * 60, TICK = 5;
  const today = () => { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
  function read() { try { const o = JSON.parse(localStorage.getItem(KEY)); if (o && o.day === today() && typeof o.sec === 'number' && isFinite(o.sec)) return Math.max(0, o.sec); } catch (e) { } return 0; }
  function write(sec) { try { localStorage.setItem(KEY, JSON.stringify({ day: today(), sec: Math.round(sec) })); } catch (e) { } }

  const Limit = {
    LIMIT, active: false, locked: false, warned: {},
    used() { return read(); },
    remaining() { return Math.max(0, LIMIT - read()); },
    init() {
      if (read() >= LIMIT) this.lock();
      setInterval(() => this.tick(TICK), TICK * 1000);
    },
    tick(dt) {
      if (this.locked) { if (read() < LIMIT) location.reload(); return; } // neuer Tag → wieder frei
      if (!this.active || document.hidden) return;
      const s = read() + dt; write(s); const left = LIMIT - s;
      const warn = (min, text) => { if (left <= min * 60 && !this.warned[min]) { this.warned[min] = true; if (root.UI && UI.toast) UI.toast(text); } };
      warn(10, '⏰ Noch 10 Minuten Spielzeit für heute'); warn(5, '⏰ Noch 5 Minuten – denk ans Speichern!'); warn(1, '⏰ Noch 1 Minute für heute');
      if (s >= LIMIT) this.lock();
    },
    lock() {
      if (this.locked && document.getElementById('limit')) return;
      this.locked = true;
      try { if (root.Game && Game.L && Game.hooks && Game.hooks.autosave) Game.hooks.autosave(); } catch (e) { }
      try { if (root.Game) Game.paused = true; if (root.Finale) Finale.paused = true; if (root.Sound && Sound.el) Sound.el.pause(); } catch (e) { }
      const ov = document.createElement('div'); ov.id = 'limit';
      ov.innerHTML = `<div class="limitpanel"><canvas id="limitcv" width="420" height="190"></canvas>
        <h2>Zeit für eine Pause!</h2>
        <p class="limitmsg">Vielen Dank, dass du dich den Mathematik-Herausforderungen des Ozeans gestellt hast, aber nun solltest du eine Pause vom Spiel bis morgen machen.</p>
        <p class="limitinfo">Heute gespielt: <b>90 Minuten</b> · Dein Fortschritt ist gespeichert.<br>Ab morgen (00:00 Uhr) geht das Abenteuer weiter! 🐬</p></div>`;
      (document.getElementById('stage') || document.body).appendChild(ov);
      const cv = document.getElementById('limitcv'), ctx = cv.getContext('2d'); let t = 0;
      const draw = () => {
        if (!document.getElementById('limitcv')) return; t += 1 / 60; ctx.clearRect(0, 0, 420, 190);
        const g = ctx.createRadialGradient(210, 120, 10, 210, 110, 220); g.addColorStop(0, '#3a6ad8'); g.addColorStop(1, '#0a1a4a'); ctx.fillStyle = g; ctx.fillRect(0, 0, 420, 190);
        ctx.fillStyle = '#fff6c0'; ctx.beginPath(); ctx.arc(340, 46, 24, 0, 7); ctx.fill(); ctx.fillStyle = '#1a2a6a'; ctx.beginPath(); ctx.arc(352, 38, 22, 0, 7); ctx.fill();
        for (let i = 0; i < 14; i++) { ctx.fillStyle = `rgba(255,255,255,${0.4 + 0.4 * Math.sin(t * 2 + i)})`; ctx.fillRect((i * 67) % 400 + 10, (i * 37) % 80 + 8, 2, 2); }
        let cos = {}; try { cos = Save.cosmetics(); } catch (e) { }
        if (root.Art) Art.drawDolphin(ctx, { x: 190, y: 120 + Math.sin(t * 1.2) * 4, facing: 1, angle: 0.08, color: (root.Save && Save.data.color) || 'blau', t: t * 0.3, cos, scale: 1.25, speed: 0.05, happy: true });
        ctx.font = 'bold 26px Fredoka, sans-serif'; ctx.fillStyle = '#fff';
        ['z', 'Z', 'Z'].forEach((z, i) => { const k = (t * 0.5 + i / 3) % 1; ctx.globalAlpha = 1 - k; ctx.fillText(z, 250 + i * 14 + k * 30, 90 - i * 14 - k * 40); });
        ctx.globalAlpha = 1; requestAnimationFrame(draw);
      };
      draw();
    }
  };
  root.Limit = Limit;
})(window);
