/* OceanQuest – Tastatur- und Multitouch-Eingabe */
(function (root) {
  'use strict';
  const I = { left: false, right: false, up: false, down: false, action: false, actionPressed: false, escPressed: false, nextPressed: false, anyPressed: false, touch: {}, enabled: true };
  const map = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', Space: 'action' };
  const isTyping = () => { const a = document.activeElement; return a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA'); };
  window.addEventListener('keydown', e => {
    if (isTyping()) return;
    const k = map[e.code];
    if (k) { if (k === 'action' && !I.action && !e.repeat) I.actionPressed = true; I[k] = true; e.preventDefault(); }
    if (e.code === 'Escape') I.escPressed = true;
    if (e.code === 'KeyM' && !e.repeat) I.nextPressed = true;
    I.anyPressed = true;
  });
  window.addEventListener('keyup', e => { const k = map[e.code]; if (k) I[k] = false; });
  window.addEventListener('blur', () => { I.left = I.right = I.up = I.down = I.action = false; });

  // Multitouch: jede Schaltfläche verfolgt eigene Pointer-IDs
  I.bindTouch = function (el) {
    const btns = el.querySelectorAll('[data-k]');
    btns.forEach(b => {
      const k = b.dataset.k; const ids = new Set();
      const set = () => { const on = ids.size > 0; if (k === 'action' && on && !I.action) I.actionPressed = true; I[k] = on; b.classList.toggle('on', on); };
      b.addEventListener('pointerdown', e => { e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch (_) {} ids.add(e.pointerId); set(); });
      const up = e => { ids.delete(e.pointerId); set(); };
      b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('lostpointercapture', up);
      b.addEventListener('contextmenu', e => e.preventDefault());
    });
  };
  I.consume = function () { const r = { action: I.actionPressed, esc: I.escPressed, next: I.nextPressed }; I.actionPressed = I.escPressed = I.nextPressed = false; return r; };
  root.Input = I;
})(window);
