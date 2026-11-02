/* OceanQuest – Spielstand (LocalStorage, robust gegen fehlende/beschädigte Daten) */
(function (root) {
  'use strict';
  const KEY = 'oceanquest.save.v1';
  const ITEMS = [
    { id: 'piratenhut', name: 'Piratenhut', slot: 'head', price: 750, cat: 'aussehen' },
    { id: 'krone', name: 'Krone', slot: 'head', price: 1000, cat: 'aussehen' },
    { id: 'taucherbrille', name: 'Taucherbrille', slot: 'eyes', price: 600, cat: 'aussehen' },
    { id: 'sonnenbrille', name: 'Sonnenbrille', slot: 'eyes', price: 500, cat: 'aussehen' },
    { id: 'kopfhoerer', name: 'Kopfhörer', slot: 'head', price: 700, cat: 'aussehen' },
    { id: 'schnorchel', name: 'Schnorchel', slot: 'eyes', price: 650, cat: 'aussehen' },
    { id: 'feuer', name: 'Feuerdelfin-Look', slot: 'skin', price: 1800, cat: 'aussehen' },
    { id: 'regenbogen', name: 'Regenbogen-Look', slot: 'skin', price: 2000, cat: 'aussehen' },
    { id: 'galaxie', name: 'Galaxie-Look', slot: 'skin', price: 2200, cat: 'aussehen' },
    { id: 'kristall', name: 'Kristall-Look', slot: 'skin', price: 1900, cat: 'aussehen' },
    { id: 'hai', name: 'Hai-Flossen', slot: 'fins', price: 1200, cat: 'aussehen' },
    { id: 'gold', name: 'Goldene Flossen', slot: 'fins', price: 1500, cat: 'aussehen' },
    { id: 'trail-blubber', name: 'Blubber-Trail', slot: 'trail', price: 400, cat: 'effekte' },
    { id: 'trail-sterne', name: 'Sternen-Trail', slot: 'trail', price: 900, cat: 'effekte' },
    { id: 'trail-regenbogen', name: 'Regenbogen-Trail', slot: 'trail', price: 1300, cat: 'effekte' },
    { id: 'schildkroete', name: 'Mini-Begleiter', slot: 'companion', price: 1600, cat: 'begleiter' }
  ];
  const CATMAP = { 'Trikots': 'trikots', 'Badeanzüge': 'baden', 'Perücken': 'perruecken', 'Begleiter': 'begleiter' };
  if (root.ArtExtras) root.ArtExtras.ITEMS.forEach(i => ITEMS.push({ id: i.id, name: i.name, hint: i.hint, slot: i.slot, price: i.price, cat: CATMAP[i.cat], premium: !!i.premium }));
  const SLOTS = ['head', 'eyes', 'skin', 'fins', 'body', 'hair', 'trail', 'companion'];
  const COLORS = ['blau', 'rosa', 'gruen', 'lila', 'gelb'];

  function defaults() {
    return {
      v: 1, created: false, name: 'Flipper', childName: '', color: 'blau', unlocked: 1,
      defeated: [false, false, false, false, false, false, false, false],
      score: 0, coins: 0, best: {}, playTime: 0,
      exam: { unlocked: false, passed: false, best: 0, date: null, score: '' },
      owned: [], equipped: { head: null, eyes: null, skin: null, fins: null, body: null, hair: null, trail: null, companion: null },
      settings: { music: true, sfx: true, musicVol: 0.55, sfxVol: 0.8, touch: 'auto' }
    };
  }
  const num = (v, d, lo, hi) => (typeof v === 'number' && isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d);
  const str = (v, d, max) => (typeof v === 'string' ? v.slice(0, max || 40) : d);
  const bool = (v, d) => (typeof v === 'boolean' ? v : d);

  function sanitize(raw) {
    const d = defaults(); if (!raw || typeof raw !== 'object') return d;
    d.created = bool(raw.created, false);
    d.name = str(raw.name, d.name, 16).trim() || 'Flipper';
    d.childName = str(raw.childName, '', 30);
    d.color = COLORS.includes(raw.color) ? raw.color : 'blau';
    d.unlocked = Math.round(num(raw.unlocked, 1, 1, 8));
    if (Array.isArray(raw.defeated)) d.defeated = d.defeated.map((_, i) => !!raw.defeated[i]);
    d.score = Math.round(num(raw.score, 0, 0, 1e9));
    d.coins = Math.round(num(raw.coins, 0, 0, 1e9));
    d.playTime = num(raw.playTime, 0, 0, 1e8);
    if (raw.best && typeof raw.best === 'object') for (let w = 1; w <= 8; w++) {
      const b = raw.best[w]; if (b && typeof b === 'object') d.best[w] = { time: num(b.time, 0, 0, 1e6), score: Math.round(num(b.score, 0, 0, 1e9)), stars: Math.round(num(b.stars, 0, 0, 3)) };
    }
    if (raw.exam && typeof raw.exam === 'object') d.exam = { unlocked: bool(raw.exam.unlocked, false), passed: bool(raw.exam.passed, false), best: Math.round(num(raw.exam.best, 0, 0, 15)), date: str(raw.exam.date, null, 30), score: str(raw.exam.score, '', 10) };
    if (d.defeated[7]) d.exam.unlocked = true;
    if (Array.isArray(raw.owned)) d.owned = raw.owned.filter(id => ITEMS.some(i => i.id === id));
    if (raw.equipped && typeof raw.equipped === 'object') SLOTS.forEach(s => { const id = raw.equipped[s]; d.equipped[s] = d.owned.includes(id) && ITEMS.find(i => i.id === id).slot === s ? id : null; });
    if (raw.settings && typeof raw.settings === 'object') {
      const s = raw.settings; d.settings = { music: bool(s.music, true), sfx: bool(s.sfx, true), musicVol: num(s.musicVol, 0.55, 0, 1), sfxVol: num(s.sfxVol, 0.8, 0, 1), touch: ['auto', 'an', 'aus'].includes(s.touch) ? s.touch : 'auto' };
    }
    return d;
  }

  const Save = {
    ITEMS, SLOTS, data: defaults(),
    load() {
      let raw = null;
      try { const s = localStorage.getItem(KEY); if (s) raw = JSON.parse(s); } catch (e) { raw = null; }
      this.data = sanitize(raw); return this.data;
    },
    save() { try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (e) { /* privat/voll – Spiel läuft weiter */ } },
    resetProgress() { const s = this.data.settings; this.data = defaults(); this.data.settings = s; this.save(); },
    pearls() { return this.data.defeated.filter(Boolean).length; },
    cosmetics() { return Object.assign({}, this.data.equipped); },
    _sanitize: sanitize
  };
  root.Save = Save;
})(window);
