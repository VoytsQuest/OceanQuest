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
  const CATMAP = { 'Aussehen': 'aussehen', 'Trikots': 'trikots', 'Badeanzüge': 'baden', 'Perücken': 'perruecken', 'Begleiter': 'begleiter' };
  if (root.ArtExtras) root.ArtExtras.ITEMS.forEach(i => ITEMS.push({ id: i.id, name: i.name, hint: i.hint, slot: i.slot, price: i.price, cat: CATMAP[i.cat], premium: !!i.premium, reward: !!i.reward }));
  const SLOTS = ['head', 'eyes', 'skin', 'fins', 'body', 'hair', 'neck', 'trail', 'companion'];
  const COLORS = ['blau', 'rosa', 'gruen', 'lila', 'gelb'];

  function defaults() {
    return {
      v: 1, created: false, name: 'Flipper', childName: '', color: 'blau', unlocked: 1,
      defeated: [false, false, false, false, false, false, false, false],
      score: 0, coins: 0, best: {}, playTime: 0,
      exam: { unlocked: false, passed: false, best: 0, date: null, score: '' },
      owned: [], equipped: { head: null, eyes: null, skin: null, fins: null, body: null, hair: null, neck: null, trail: null, companion: null },
      settings: { music: true, sfx: true, musicVol: 0.55, sfxVol: 0.8, touch: 'auto' },
      resume: null, contest: { played: 0, best: 0, won: 0, last: null }, savedAt: null,
      stats: { correct: 0, wrong: 0, shells: 0, knocks: 0 },
      football: { won: [false, false, false, false, false, false, false, false], scores: ['', '', '', '', '', '', '', ''], goals: 0, against: 0, tasks: 0, tasksRight: 0, points: 0, date: null }
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
    if (raw.resume && typeof raw.resume === 'object' && raw.resume.world >= 1 && raw.resume.world <= d.unlocked) {
      const r = raw.resume, ints = a => Array.isArray(a) ? a.filter(n => Number.isInteger(n) && n >= 0 && n < 500).slice(0, 500) : [];
      d.resume = { world: Math.round(r.world), cp: Math.round(num(r.cp, -1, -1, 5)), time: num(r.time, 0, 0, 1e5), score: Math.round(num(r.score, 0, 0, 1e7)), shellsGot: Math.round(num(r.shellsGot, 0, 0, 999)), pearlsGot: Math.round(num(r.pearlsGot, 0, 0, 99)), knocks: Math.round(num(r.knocks, 0, 0, 999)), shells: ints(r.shells), pearls: ints(r.pearls), chests: ints(r.chests), switches: ints(r.switches), egg: bool(r.egg, false) };
    }
    if (raw.contest && typeof raw.contest === 'object') d.contest = { played: Math.round(num(raw.contest.played, 0, 0, 1e6)), best: Math.round(num(raw.contest.best, 0, 0, 15)), won: Math.round(num(raw.contest.won, 0, 0, 1e9)) };
    d.savedAt = str(raw.savedAt, null, 30);
    if (raw.contest && raw.contest.last && typeof raw.contest.last === 'object') { const l = raw.contest.last; d.contest.last = { step: Math.round(num(l.step, 0, 0, 15)), prize: Math.round(num(l.prize, 0, 0, 1e6)), how: ['win', 'walk', 'wrong'].includes(l.how) ? l.how : 'wrong', jokers: Math.round(num(l.jokers, 0, 0, 3)), date: str(l.date, '', 30) }; }
    if (raw.stats && typeof raw.stats === 'object') ['correct', 'wrong', 'shells', 'knocks'].forEach(k => d.stats[k] = Math.round(num(raw.stats[k], 0, 0, 1e7)));
    if (raw.football && typeof raw.football === 'object') { const f = raw.football;
      if (Array.isArray(f.won)) d.football.won = d.football.won.map((_, i) => !!f.won[i]);
      if (Array.isArray(f.scores)) d.football.scores = d.football.scores.map((_, i) => str(f.scores[i], '', 8));
      ['goals', 'against', 'tasks', 'tasksRight', 'points'].forEach(k => d.football[k] = Math.round(num(f[k], 0, 0, 1e7))); d.football.date = str(f.date, null, 30); }
    return d;
  }

  const CKEY = 'oceanquest.slots.v1';
  const Save = {
    ITEMS, SLOTS, data: defaults(),
    active: 0, slots: [null, null, null], settings: defaults().settings,
    load() {
      let c = null;
      try { const s = localStorage.getItem(CKEY); if (s) c = JSON.parse(s); } catch (e) { c = null; }
      if (!c || !Array.isArray(c.slots)) { // Übernahme des alten Einzel-Spielstands in Spielstand 1
        let old = null; try { const s = localStorage.getItem(KEY); if (s) old = JSON.parse(s); } catch (e) { old = null; }
        c = { active: 0, slots: [old && old.created ? old : null, null, null], settings: old && old.settings };
      }
      this.slots = [0, 1, 2].map(i => { const r = c.slots[i]; if (!r || typeof r !== 'object' || !r.created) return null; return sanitize(r); });
      this.settings = sanitize({ settings: c.settings }).settings;
      this.active = [0, 1, 2].includes(c.active) ? c.active : 0;
      this.data = this.slots[this.active] || defaults(); this.data.settings = this.settings;
      return this.data;
    },
    save() {
      this.data.settings = this.settings;
      if (this.data.created) { this.data.savedAt = new Date().toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' }); this.slots[this.active] = this.data; }
      try { localStorage.setItem(CKEY, JSON.stringify({ active: this.active, slots: this.slots, settings: this.settings })); } catch (e) { /* privat/voll – Spiel läuft weiter */ }
    },
    useSlot(i) { this.active = i; this.data = this.slots[i] || defaults(); this.data.settings = this.settings; this.save(); return this.data; },
    deleteSlot(i) { this.slots[i] = null; if (this.active === i) { this.data = defaults(); this.data.settings = this.settings; } this.save(); },
    resetProgress() { this.data = defaults(); this.data.settings = this.settings; this.slots[this.active] = null; this.save(); },
    exportCode() { const o = Object.assign({}, this.data, { sig: 'OQ1' }); delete o.settings; return btoa(unescape(encodeURIComponent(JSON.stringify(o)))); },
    importCode(code) {
      try { const raw = JSON.parse(decodeURIComponent(escape(atob(String(code).replace(/\s+/g, ''))))); if (!raw || raw.sig !== 'OQ1') return false;
        raw.created = true; const d = sanitize(raw); d.settings = this.settings; this.data = d; this.slots[this.active] = d; this.save(); return true; } catch (e) { return false; }
    },
    pearls() { return this.data.defeated.filter(Boolean).length; },
    cosmetics() { return Object.assign({}, this.data.equipped); },
    _sanitize: sanitize
  };
  root.Save = Save;
})(window);
