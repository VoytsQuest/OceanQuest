/* OceanQuest – Start & Hauptschleife */
(function () {
  'use strict';
  const stage = document.getElementById('stage');
  const cv = document.getElementById('cv');
  const ctx = cv.getContext('2d');

  function fit() {
    const s = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
    stage.style.transform = `translate(-50%, -50%) scale(${s})`;
  }
  window.addEventListener('resize', fit); fit();

  Save.load();
  Sound.init(Save.data.settings);
  // Startbildschirm + VoytsQuest-Intro (Ton erst nach Nutzerinteraktion erlaubt)
  const splash = document.getElementById('splash'), video = document.getElementById('intro');
  let introDone = false;
  const endIntro = () => { if (introDone) return; introDone = true; Limit.active = true; try { video.pause(); } catch (e) {} splash.classList.add('fade'); setTimeout(() => splash.remove(), 600); if (!Limit.locked) Sound.startMusic(); };
  const startIntro = () => {
    if (splash.classList.contains('playing')) return;
    Sound.unlock(true); splash.classList.add('playing');
    video.volume = Save.data.settings.music ? 0.9 : 0; video.muted = !Save.data.settings.music && !Save.data.settings.sfx;
    const p = video.play(); if (p && p.catch) p.catch(() => endIntro());
  };
  document.getElementById('sp-btn').addEventListener('click', startIntro);
  document.getElementById('sp-start').addEventListener('click', startIntro);
  document.getElementById('sp-skip').addEventListener('click', e => { e.stopPropagation(); endIntro(); });
  video.addEventListener('ended', endIntro); video.addEventListener('error', () => { if (splash.classList.contains('playing')) endIntro(); });
  video.addEventListener('click', endIntro);
  window.addEventListener('keydown', e => { if (introDone) return; e.stopPropagation(); e.preventDefault(); if (!splash.classList.contains('playing')) { if (e.code === 'Enter' || e.code === 'Space') startIntro(); } else if (['Escape', 'Space', 'Enter'].includes(e.code)) endIntro(); }, true);
  const unlock = () => { if (introDone) Sound.unlock(); };
  window.addEventListener('pointerdown', unlock); window.addEventListener('keydown', unlock);
  // Finale: Maus/Finger auf dem Spielfeld
  const toLogical = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * 1280 / r.width, (e.clientY - r.top) * 720 / r.height]; };
  cv.addEventListener('pointerdown', e => { if (UI.mode !== 'finale') return; try { cv.setPointerCapture(e.pointerId); } catch (_) {} Finale.pointer('down', ...toLogical(e), e.pointerId); });
  cv.addEventListener('pointermove', e => { if (UI.mode === 'finale' && (e.buttons || e.pointerType === 'touch')) Finale.pointer('move', ...toLogical(e), e.pointerId); });
  ['pointerup', 'pointercancel'].forEach(t => cv.addEventListener(t, e => Finale.pointer('up', 0, 0, e.pointerId)));

  const start = () => {
    UI.init(); Limit.init();
    let last = performance.now();
    function frame(now) {
      const dt = Math.min(1 / 30, Math.max(0, (now - last) / 1000)); last = now;
      const ev = Input.consume();
      if (Limit.locked) { requestAnimationFrame(frame); return; }
      if (ev.next) Sound.next();
      if (!introDone) { UI.renderMenu(ctx, dt); requestAnimationFrame(frame); return; }
      if (UI.mode === 'expedition') { if (ev.esc) UI.togglePause(); Expedition.update(dt, ev); Expedition.render(ctx); }
      else if (UI.mode === 'finale') { if (ev.esc) UI.togglePause(); Finale.update(dt, ev); Finale.render(ctx); }
      else if (UI.mode === 'game' && Game.L) {
        if (ev.esc) UI.togglePause();
        Game.update(dt, ev); Game.render(ctx);
      } else {
        if (ev.esc) UI.back();
        UI.renderMenu(ctx, dt);
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  };
  // Schrift laden (falls verfügbar), dann starten
  const fontReady = document.fonts && document.fonts.load ? Promise.race([Promise.all([document.fonts.load('bold 30px Fredoka'), document.fonts.load('500 30px Fredoka')]), new Promise(r => setTimeout(r, 1500))]) : Promise.resolve();
  fontReady.then(start, start);
})();
