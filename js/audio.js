/* OceanQuest – Musik-Playlist (eigene Tracks) + synthetische Soundeffekte (WebAudio) */
(function (root) {
  'use strict';
  const TRACKS = [
    { file: 'assets/music/whale-call-at-dawn.mp3', title: 'Whale Call at Dawn' },
    { file: 'assets/music/deep-currents.mp3', title: 'Deep Currents' },
    { file: 'assets/music/deep-reflections.mp3', title: 'Deep Reflections' },
    { file: 'assets/music/whale-call-at-dawn-2.mp3', title: 'Whale Call at Dawn II' },
    { file: 'assets/music/deep-reflections-2.mp3', title: 'Deep Reflections II' },
    { file: 'assets/music/ocean-quest.mp3', title: 'Ocean Quest' },
    { file: 'assets/music/ocean-breeze.mp3', title: 'Ocean Breeze' },
    { file: 'assets/music/whale-calling.mp3', title: 'Whale Calling' },
    { file: 'assets/music/whale-call-nostalgia.mp3', title: 'Whale Call Nostalgia' }
  ];
  // Jede Welt startet mit ihrer eigenen Stimmung (Taste M schaltet jederzeit weiter)
  const WORLD_TRACK = { 0: 5, 1: 6, 2: 1, 3: 2, 4: 4, 5: 0, 6: 7, 7: 2, 8: 4, 9: 5, 10: 8, 11: 7, 12: 6, 13: 8, 14: 1, 15: 3 };

  const A = {
    TRACKS, ctx: null, el: null, idx: 0, unlocked: false, music: true, sfxOn: true, musicVol: 0.55, sfxVol: 0.8, onChange: null, _fade: null,
    init(settings) {
      this.music = settings.music; this.sfxOn = settings.sfx; this.musicVol = settings.musicVol; this.sfxVol = settings.sfxVol;
      this.el = new Audio(); this.el.preload = 'auto'; this.el.loop = false;
      this.el.addEventListener('ended', () => this.next(true));
      this.el.addEventListener('error', () => { if (this.unlocked && this.music) setTimeout(() => this.next(true), 500); });
    },
    unlock(defer) {
      if (this.unlocked) return; this.unlocked = true; this.deferred = !!defer;
      try { const AC = window.AudioContext || window.webkitAudioContext; if (AC) { this.ctx = new AC(); this.master = this.ctx.createGain(); this.master.gain.value = this.sfxVol; this.master.connect(this.ctx.destination); } } catch (e) { this.ctx = null; }
      if (this.music && !defer) this.play(this.idx);
    },
    startMusic() { this.deferred = false; if (this.music) this.play(this.idx, true); },
    play(i, quiet) {
      this.idx = ((i % TRACKS.length) + TRACKS.length) % TRACKS.length;
      if (!this.el) return;
      const t = TRACKS[this.idx];
      this.el.src = t.file; this.el.currentTime = 0;
      if (this.unlocked && this.music && !this.deferred) { this.el.volume = 0; const p = this.el.play(); if (p && p.catch) p.catch(() => {}); this.fadeTo(this.musicVol, 900); }
      if (!quiet && this.onChange) this.onChange(t, this.idx);
    },
    fadeTo(v, ms) {
      clearInterval(this._fade); const el = this.el; const start = el.volume; const t0 = performance.now();
      this._fade = setInterval(() => { const k = Math.min(1, (performance.now() - t0) / ms); el.volume = Math.max(0, Math.min(1, start + (v - start) * k)); if (k >= 1) clearInterval(this._fade); }, 40);
    },
    next(auto) { this.play(this.idx + 1); if (!auto) this.sfx('switch'); },
    current() { return TRACKS[this.idx]; },
    forWorld(w) { const i = WORLD_TRACK[w] !== undefined ? WORLD_TRACK[w] : 0; if (i !== this.idx || this.el.paused) this.play(i, true); if (this.onChange) this.onChange(TRACKS[this.idx], this.idx, true); },
    setMusic(on) { this.music = on; if (!this.el) return; if (on && this.unlocked) { const p = this.el.play(); if (p && p.catch) p.catch(() => {}); this.fadeTo(this.musicVol, 600); } else this.el.pause(); },
    setMusicVol(v) { this.musicVol = v; if (this.el) this.el.volume = v; },
    setSfx(on) { this.sfxOn = on; },
    setSfxVol(v) { this.sfxVol = v; if (this.master) this.master.gain.value = v; },

    /* ---------- Soundeffekte ---------- */
    tone(f, dur, type, vol, f2, delay) {
      const c = this.ctx; if (!c) return; const t = c.currentTime + (delay || 0);
      const o = c.createOscillator(), g = c.createGain(); o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.3, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.05);
    },
    noise(dur, vol, freq, delay) {
      const c = this.ctx; if (!c) return; const t = c.currentTime + (delay || 0);
      const len = Math.floor(c.sampleRate * dur); const b = c.createBuffer(1, len, c.sampleRate); const d = b.getChannelData(0); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const s = c.createBufferSource(); s.buffer = b; const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq || 1200; const g = c.createGain(); g.gain.value = vol || 0.3;
      s.connect(f); f.connect(g); g.connect(this.master); s.start(t);
    },
    sfx(name) {
      if (!this.sfxOn || !this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();
      const T = (...a) => this.tone(...a);
      switch (name) {
        case 'bubble': T(300 + Math.random() * 200, 0.12, 'sine', 0.12, 900); break;
        case 'swim': this.noise(0.18, 0.05, 600); break;
        case 'shell': T(988, 0.09, 'triangle', 0.2); T(1319, 0.14, 'triangle', 0.2, null, 0.06); break;
        case 'pearl': [880, 1109, 1319, 1760].forEach((f, i) => T(f, 0.18, 'triangle', 0.18, null, i * 0.06)); break;
        case 'slap': this.noise(0.2, 0.35, 900); T(160, 0.18, 'sine', 0.35, 60); break;
        case 'knock': T(520, 0.12, 'square', 0.12, 260); this.noise(0.1, 0.2, 2000); break;
        case 'klonk': T(220, 0.15, 'square', 0.15, 180); T(330, 0.12, 'square', 0.08, null, 0.03); break;
        case 'hit': T(440, 0.25, 'sawtooth', 0.18, 110); this.noise(0.15, 0.2, 700); break;
        case 'chest': [523, 659, 784, 1047, 1319].forEach((f, i) => T(f, 0.2, 'triangle', 0.18, null, i * 0.07)); break;
        case 'correct': [523, 659, 784, 1047].forEach((f, i) => T(f, 0.22, 'triangle', 0.22, null, i * 0.08)); break;
        case 'wrong': T(220, 0.18, 'square', 0.12, 180); T(180, 0.3, 'square', 0.12, 150, 0.15); break;
        case 'bossAppear': T(80, 1.0, 'sawtooth', 0.2, 160); T(120, 1.0, 'sawtooth', 0.12, 240, 0.1); this.noise(1.0, 0.15, 300); break;
        case 'bossHit': T(300, 0.3, 'sawtooth', 0.2, 90); this.noise(0.25, 0.25, 1200); break;
        case 'bossDefeat': [392, 523, 659, 784, 659, 784, 1047].forEach((f, i) => T(f, 0.28, 'triangle', 0.22, null, i * 0.13)); break;
        case 'unlock': [784, 988, 1175, 1568].forEach((f, i) => T(f, 0.25, 'sine', 0.2, null, i * 0.09)); break;
        case 'certificate': [523, 659, 784, 1047, 784, 1047, 1319, 1568].forEach((f, i) => T(f, 0.35, 'triangle', 0.22, null, i * 0.15)); break;
        case 'switch': T(660, 0.08, 'square', 0.1); T(990, 0.12, 'square', 0.1, null, 0.07); break;
        case 'gate': T(90, 0.8, 'sawtooth', 0.15, 60); this.noise(0.8, 0.15, 400); break;
        case 'checkpoint': [659, 880, 1175].forEach((f, i) => T(f, 0.2, 'sine', 0.2, null, i * 0.08)); break;
        case 'click': T(700, 0.05, 'triangle', 0.12); break;
        case 'buy': [1047, 1319, 1568].forEach((f, i) => T(f, 0.15, 'triangle', 0.2, null, i * 0.05)); break;
        case 'lock': T(196, 0.9, 'sine', 0.2); T(247, 0.9, 'sine', 0.12, null, 0.05); T(294, 0.9, 'sine', 0.1, null, 0.1); break;
        case 'lava': this.noise(0.6, 0.18, 300); break;
      }
    }
  };
  root.Sound = A;
})(window);
