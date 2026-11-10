/* OceanQuest – Benutzeroberfläche: Menüs, Delfin, Shop, Bosskampf, Ergebnisse, Prüfung, Urkunde */
(function (root) {
  'use strict';
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = n => MathGen.fmt(n);
  const fmtTime = s => { s = Math.floor(s); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
  const S = () => Save.data;
  const COLOR_KEYS = ['blau', 'rosa', 'gruen', 'lila', 'gelb'];
  let ui, mode = 'menu', screen = 'main', anims = [], menuBg = null;

  const UI = {
    get mode() { return mode; },
    init() {
      ui = $('#ui');
      ui.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (b && !b.disabled) { Sound.sfx('click'); act(b.dataset.act, b.dataset.arg, b); } });
      $('#btn-music').addEventListener('click', () => Sound.next());
      $('#btn-pause').addEventListener('click', () => UI.togglePause());
      Sound.onChange = (t, i, silent) => { $('#track-name').textContent = t.title; if (!silent) toast('♫ ' + t.title); };
      $('#track-name').textContent = Sound.current().title;
      Input.bindTouch($('#touch'));
      Game.hooks = { dialog: showDialog, bossMath, results: showResults, toast, autosave };
      document.addEventListener('keydown', onKey);
      window.addEventListener('pagehide', () => { if (mode === 'game') autosave(); });
      document.addEventListener('visibilitychange', () => { if (document.hidden && mode === 'game') autosave(); if (document.hidden && mode === 'game' && !Game.paused && Game.L && Game.L.state === 'play') UI.togglePause(); });
      show('main');
    },
    togglePause() {
      if (mode === 'expedition') {
        const X = Expedition.X; if (!X || ['modal', 'won'].includes(X.state)) return;
        if (Expedition.paused) { if (X.intro) return; Expedition.paused = false; closeOverlay(); return; }
        Expedition.paused = true; overlay(`<div class="panel pause"><h2>Pause</h2><button class="btn big" data-act="resume">▶ Weiter</button><button class="btn" data-act="expstart" data-arg="${X.id}">⟲ Expedition neu starten</button><button class="btn" data-act="music">${Sound.music ? '♫ Musik aus' : '♫ Musik an'}</button><button class="btn" data-act="expquit">🧭 Zur Expeditionskarte</button></div>`); return;
      }
      if (mode === 'finale') {
        if (Finale.paused) { Finale.paused = false; closeOverlay(); return; }
        Finale.paused = true; const lg = footIdx !== null, du = duelOn;
        overlay(`<div class="panel pause"><h2>Pause</h2><button class="btn big" data-act="resume">▶ Weiter</button><button class="btn" data-act="${du ? 'duelgo' : lg ? 'leaguematch' : 'final'}" data-arg="${lg ? footIdx : ''}">⟲ Spiel neu starten</button><button class="btn" data-act="music">${Sound.music ? '♫ Musik aus' : '♫ Musik an'}</button><button class="btn" data-act="${du ? 'duelquit' : lg ? 'leaguequit' : 'quit'}">⌂ ${du ? 'Zur Figurenwahl' : lg ? 'Zur Liga' : 'Zur Weltkarte'}</button></div>`); return;
      }
      if (mode !== 'game') return;
      const L = Game.L; if (!L) return;
      if (Game.paused) { Game.paused = false; closeOverlay(); updateChrome(); return; }
      if (['dialog', 'math', 'victory'].includes(L.state)) return;
      Game.paused = true; overlay(`<div class="panel pause"><h2>Pause</h2>
        <button class="btn big" data-act="resume">▶ Weiter</button>
        <button class="btn gold" data-act="savegame">💾 Speichern</button>
        <button class="btn" data-act="cprestart">↺ Zum Checkpoint</button>
        <button class="btn" data-act="restartlvl">⟲ Level neu starten</button>
        <button class="btn" data-act="music">${Sound.music ? '♫ Musik aus' : '♫ Musik an'}</button>
        <button class="btn" data-act="quit">⌂ Zur Weltkarte</button></div>`); updateChrome();
    },
    back() { if (screen !== 'main' && !['finale', 'cert', 'contest', 'expedition'].includes(screen)) show(['lexicon', 'nightmare'].includes(screen) ? 'expmap' : 'main'); },
    renderMenu(ctx, dt) { renderMenuScene(ctx, dt); },
    toast
  };

  /* ---------- Hilfsfunktionen ---------- */
  function autosave() { if (Game.L && Game.L.nightmare) return false; const s = Game.snapshot(); if (s && S().created) { S().resume = s; Save.save(); return true; } return false; }
  function toast(text) { const t = $('#toast'); t.textContent = text; t.classList.remove('show'); void t.offsetWidth; t.classList.add('show'); }
  function overlay(html) { let o = $('#overlay'); if (!o) { o = document.createElement('div'); o.id = 'overlay'; ui.appendChild(o); } o.innerHTML = html; o.style.display = 'flex'; return o; }
  function closeOverlay() { const o = $('#overlay'); if (o) { o.style.display = 'none'; o.innerHTML = ''; } }
  function updateChrome() {
    const st = S().settings; const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    const showTouch = (st.touch === 'an' || (st.touch === 'auto' && isTouch)) && ((mode === 'game' && !Game.paused && Game.L && ['play', 'collect', 'title'].includes(Game.L.state)) || (mode === 'expedition' && !Expedition.paused && Expedition.X && ['play', 'title'].includes(Expedition.X.state)));
    $('#touch').style.display = showTouch ? 'block' : 'none';
    $('#btn-pause').style.display = mode === 'game' || mode === 'finale' || mode === 'expedition' ? 'flex' : 'none';
  }
  setInterval(() => updateChrome(), 300);
  function miniCanvas(w, h, draw, animate) {
    const c = document.createElement('canvas'); const dpr = Math.min(2, window.devicePixelRatio || 1); c.width = w * dpr; c.height = h * dpr; c.style.width = w + 'px'; c.style.height = h + 'px';
    const ctx = c.getContext('2d'); const paint = t => { ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h); draw(ctx, t); };
    paint(0); if (animate) anims.push({ c, paint }); return c;
  }
  function tickAnims(t) { anims = anims.filter(a => a.c.isConnected); anims.forEach(a => a.paint(t)); }
  function dolphinCanvas(w, h, scale, opts) { return miniCanvas(w, h, (ctx, t) => Art.drawDolphin(ctx, Object.assign({ x: w / 2, y: h / 2 + Math.sin(t * 2) * 4, facing: 1, color: S().color, t, cos: Save.cosmetics(), scale, speed: 0.35 }, opts || {})), true); }
  function bossCanvas(id, w, h, s, grey) { return miniCanvas(w, h, (ctx, t) => { if (grey) ctx.filter = 'grayscale(1) brightness(0.55)'; Art.drawBoss(ctx, id, w / 2, h / 2 + 8, s, { t: grey ? 0 : t }); ctx.filter = 'none'; }, !grey); }
  function onKey(e) {
    const dlg = $('#dialog');
    if (dlg && dlg.style.display !== 'none' && (e.code === 'Enter' || e.code === 'Space' || e.code === 'NumpadEnter')) { e.preventDefault(); dlg.click(); return; }
    const kp = document.querySelector('.numpad'); const active = document.activeElement && document.activeElement.tagName === 'INPUT';
    if (kp && !active) {
      if (/^(Digit|Numpad)\d$/.test(e.code)) { kp.dispatchEvent(new CustomEvent('key', { detail: e.code.slice(-1) })); e.preventDefault(); }
      else if (e.code === 'Backspace') { kp.dispatchEvent(new CustomEvent('key', { detail: 'del' })); e.preventDefault(); }
      else if (e.code === 'Enter' || e.code === 'NumpadEnter') { kp.dispatchEvent(new CustomEvent('key', { detail: 'ok' })); e.preventDefault(); }
    } else if (!active && (e.code === 'Enter' || e.code === 'NumpadEnter')) { const def = ui.querySelector('[data-default]'); if (def) { e.preventDefault(); def.click(); } }
    const choiceKeys = { KeyA: 0, KeyB: 1, KeyC: 2, KeyD: 3, Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3 };
    if (!kp && !active && choiceKeys[e.code] !== undefined) { const ch = ui.querySelectorAll('.choices .choice'); const b = ch[choiceKeys[e.code]]; if (b && mode === 'game') b.click(); }
  }

  /* ---------- Aktionen ---------- */
  function act(a, arg, el) {
    switch (a) {
      case 'new': if (!Save.slots.some(Boolean)) { Save.useSlot(0); show('create', { fresh: true }); break; } show('slots'); break;
      case 'newold': if (S().created && S().defeated.some(Boolean)) { overlay(`<div class="panel"><h2>Neues Spiel?</h2><p>Dein bisheriger Fortschritt (${Save.pearls()} Perlen) wird gelöscht. Muschel-Coins und Shop-Items bleiben erhalten.</p><div class="row"><button class="btn" data-act="closeov">Abbrechen</button><button class="btn warn" data-act="newyes">Ja, neu beginnen</button></div></div>`); } else show('create', { fresh: true }); break;
      case 'newyes': { const keep = { coins: S().coins, owned: S().owned, equipped: S().equipped }; Save.resetProgress(); Object.assign(S(), keep); Save.save(); closeOverlay(); show('create', { fresh: true }); break; }
      case 'continue': if (!S().created) show('slots'); else if (S().resume) startWorld(S().resume.world, S().resume); else show('worlds'); break;
      case 'savegame': if (autosave()) toast('💾 Gespeichert! Du machst später am letzten Checkpoint weiter.'); else toast(Game.L && Game.L.nightmare ? 'Im Albtraum-Modus wird nicht zwischengespeichert.' : 'Gerade nicht möglich – der Boss ist schon besiegt.'); break;
      case 'slotplay': Save.useSlot(+arg); Sound.sfx('switch'); toast('Spielstand ' + (+arg + 1) + ': ' + S().name); show('main'); break;
      case 'slotnew': Save.useSlot(+arg); show('create', { fresh: true }); break;
      case 'slotdel': overlay(`<div class="panel"><h2>Spielstand löschen?</h2><p>Spielstand ${+arg + 1} (${esc(Save.slots[+arg] ? Save.slots[+arg].name : '')}) mit allen Perlen, Coins und Items wird gelöscht.</p><div class="row"><button class="btn" data-act="closeov">Abbrechen</button><button class="btn warn" data-act="slotdelyes" data-arg="${arg}">Ja, löschen</button></div></div>`); break;
      case 'slotdelyes': Save.deleteSlot(+arg); closeOverlay(); toast('Spielstand gelöscht.'); show('slots'); break;
      case 'codeshow': {
        if (!S().created) { toast('Wähle zuerst einen Spielstand.'); break; }
        const code = Save.exportCode();
        overlay(`<div class="panel codepanel"><h2>Spielstand-Code</h2><p>Kopiere diesen Code und gib ihn auf dem anderen Gerät unter <b>Spielstände → Code eingeben</b> ein.</p><textarea id="codeout" readonly>${code}</textarea><div class="row"><button class="btn gold" id="copybtn">📋 Kopieren</button><button class="btn" data-act="closeov">Schließen</button></div></div>`);
        const ta = $('#codeout'); $('#copybtn').onclick = () => { const done = () => toast('Code kopiert!'); const sel = () => { ta.focus(); ta.select(); toast('Code markiert – jetzt kopieren (Strg+C).'); }; try { navigator.clipboard.writeText(code).then(done, sel); } catch (e) { sel(); } };
        break;
      }
      case 'codein': overlay(`<div class="panel codepanel"><h2>Code eingeben</h2><p>Der Code wird in <b>Spielstand ${Save.active + 1}</b> geladen${Save.slots[Save.active] ? ' und ersetzt den Delfin <b>' + esc(Save.slots[Save.active].name) + '</b>' : ''}.</p><textarea id="codein" placeholder="Code hier einfügen"></textarea><div class="row"><button class="btn" data-act="closeov">Abbrechen</button><button class="btn gold" data-act="codeload">Laden</button></div></div>`); setTimeout(() => $('#codein') && $('#codein').focus(), 50); break;
      case 'codeload': if (Save.importCode($('#codein').value)) { closeOverlay(); Sound.sfx('unlock'); toast('Spielstand geladen: ' + S().name); show('main'); } else toast('Dieser Code ist ungültig. Bitte vollständig einfügen.'); break;
      case 'contest': if (!Save.slots.some(Boolean)) { toast('Erstelle zuerst einen Delfin!'); show('slots'); } else show('contestpick'); break;
      case 'contestgo': Save.useSlot(+arg); startContest(); break;
      case 'contestquit': closeOverlay(); C = null; Sound.forWorld(0); show('main'); break;
      case 'goto': if (arg === 'main') SCREENS._from = 0; show(arg); break;
      case 'shopafter': SCREENS._from = +arg; Game.stop(); show('shop', { from: +arg }); break;
      case 'closeov': closeOverlay(); break;
      case 'color': S().color = arg; Save.save(); ui.querySelectorAll('.swatch').forEach(s => s.classList.toggle('sel', s.dataset.arg === arg)); break;
      case 'createdone': {
        const n = ($('#dname').value || '').trim().slice(0, 16); if (!n) { toast('Gib deinem Delfin einen Namen!'); $('#dname').focus(); return; }
        S().name = n; S().childName = ($('#cname').value || '').trim().slice(0, 30); const first = !S().created; S().created = true; Save.save();
        if (first || el.dataset.fresh) startWorld(1); else show('main'); break;
      }
      case 'play': { const r = S().resume; startWorld(+arg, r && r.world === +arg ? r : null); break; }
      case 'locked': toast('Besiege zuerst den Boss der vorherigen Welt!'); break;
      case 'resume': UI.togglePause(); break;
      case 'cprestart': Game.paused = false; closeOverlay(); Game.respawnAtCheckpoint(); break;
      case 'restartlvl': { Game.paused = false; closeOverlay(); const w = Game.L.wid; if (S().resume && S().resume.world === w) { S().resume = null; Save.save(); } startWorld(w); break; }
      case 'quit': if (mode === 'game' && Game.L && Game.L.nightmare) { Game.paused = false; closeOverlay(); Game.stop(); show('nightmare'); break; }
        if (mode === 'game') autosave(); Game.paused = false; Finale.paused = false; Finale.stop(); closeOverlay(); Game.stop(); mode = 'menu'; Sound.forWorld(0); show('worlds'); break;
      case 'music': S().settings.music = !S().settings.music; Sound.setMusic(S().settings.music); Save.save(); if (el) el.textContent = S().settings.music ? '♫ Musik aus' : '♫ Musik an'; if (screen === 'settings' && mode === 'menu') show('settings'); break;
      case 'sfx': S().settings.sfx = !S().settings.sfx; Sound.setSfx(S().settings.sfx); Save.save(); show('settings'); break;
      case 'touch': S().settings.touch = arg; Save.save(); show('settings'); break;
      case 'nexttrack': Sound.next(); break;
      case 'reset': overlay(`<div class="panel"><h2>Spielstand löschen?</h2><p>Alle Welten, Perlen, Bestzeiten, Coins und Items dieses Delfins werden gelöscht. Die anderen Spielstände bleiben erhalten.</p><div class="row"><button class="btn" data-act="closeov">Abbrechen</button><button class="btn warn" data-act="resetyes">Ja, alles löschen</button></div></div>`); break;
      case 'resetyes': Save.resetProgress(); closeOverlay(); toast('Spielstand gelöscht.'); show('slots'); break;
      case 'shopcat': show('shop', { cat: arg }); break;
      case 'buy': buy(arg); break;
      case 'nextworld': startWorld(Math.min(8, +arg + 1)); break;
      case 'final': Finale.paused = false; Game.stop(); startFinal(); break;
      case 'kickoff': closeOverlay(); Finale.kickoff(); break;
      case 'cert': show('cert', { kind: arg || 'game' }); break;
      case 'football': if (footballOpen()) show('league'); else overlay(`<div class="panel"><h2>⚽ Fußball-Modus</h2><p>Der Fußball-Modus öffnet sich, wenn du beides geschafft hast:</p><ul class="checks req"><li class="${S().exam.passed ? 'ok' : 'no'}">Das Spiel durchgespielt (Finale gegen Mbappé gewonnen)</li><li class="${S().contest.best >= 5 ? 'ok' : 'no'}">Im Mathe-Contest mindestens die erste Sicherheitsstufe (Frage 5) erreicht</li></ul><div class="row"><button class="btn gold" data-act="closeov" data-default>Alles klar!</button></div></div>`); break;
      case 'leaguego': startWarmup(+arg); break;
      case 'duel': if (duelOpen()) show('duelpick'); else overlay(`<div class="panel"><h2>🤝 Fußball-Duell</h2><p>Das Duell für zwei Spieler öffnet sich, wenn du im <b>Fußball-Modus alle 8 Stadien</b> gewonnen hast.</p><p>Bisher: <b>${S().football.won.filter(Boolean).length} von 8</b></p><div class="row"><button class="btn gold" data-act="closeov" data-default>Alles klar!</button></div></div>`); break;
      case 'duelfig': { const [pl, i] = arg.split(':'); DUEL[pl] = +i; ui.querySelectorAll(`.figtile[data-pl="${pl}"]`).forEach(b => b.classList.toggle('sel', +b.dataset.i === +i)); Sound.sfx('switch'); updateDuelBar(); break; }
      case 'duelwin': DUEL.win = +arg; ui.querySelectorAll('.winbtn').forEach(b => b.classList.toggle('sel', +b.dataset.arg === DUEL.win)); break;
      case 'duelgo': Finale.paused = false; startDuel(); break;
      case 'expeditions': if (duelOpen()) show('expmap'); else overlay(`<div class="panel"><h2>🧭 Expeditionen</h2><p>Die Expeditionen öffnen sich, wenn du <b>alle Modi</b> freigeschaltet hast – also auch alle 8 Stadien im Fußball-Modus gewonnen.</p><p>Fußball-Liga bisher: <b>${S().football.won.filter(Boolean).length} von 8</b></p><div class="row"><button class="btn gold" data-act="closeov" data-default>Alles klar!</button></div></div>`); break;
      case 'expstart': Expedition.paused = false; closeOverlay(); if (arg === 'albtraum') show('nightmare'); else startExpedition(arg); break;
      case 'expgo': { const X = Expedition.X; if (X) X.intro = false; Expedition.paused = false; closeOverlay(); break; }
      case 'expquit': Expedition.paused = false; Expedition.stop(); Game.stop(); closeOverlay(); Sound.forWorld(0); show('expmap'); break;
      case 'nightplay': startWorld(+arg, null, { nightmare: true }); break;
      case 'duelquit': Finale.paused = false; Finale.stop(); closeOverlay(); duelOn = false; Sound.forWorld(0); show('duelpick'); break;
      case 'leaguematch': Finale.paused = false; closeOverlay(); startLeagueMatch(+arg); break;
      case 'leaguequit': Finale.paused = false; Finale.stop(); closeOverlay(); footIdx = null; Sound.forWorld(0); show('league'); break;
      case 'equip': { const it = Save.ITEMS.find(i => i.id === arg); if (it && S().owned.includes(arg)) { S().equipped[it.slot] = arg; Save.save(); Sound.sfx('buy'); toast(it.name + ' angelegt!'); if (el) { el.disabled = true; el.textContent = '✔ Angelegt'; } } break; }
      case 'print': printCert(); break;
      case 'pdf': pdfCert(); break;
    }
  }

  function startWorld(w, resume, opts) {
    if (w > S().unlocked) { toast('Diese Welt ist noch gesperrt.'); return; }
    mode = 'game'; screen = 'game'; ui.innerHTML = ''; ui.className = 'ingame';
    Game.start(w, resume, opts); updateChrome();
    if (resume) setTimeout(() => toast('💾 Weiter am Checkpoint in Welt ' + w), 400);
  }

  /* ---------- Bildschirme ---------- */
  function show(name, opts) {
    opts = opts || {}; mode = 'menu'; screen = name; ui.className = 'menu scr-' + name; closeOverlay();
    const f = SCREENS[name]; ui.innerHTML = ''; f(opts); updateChrome();
  }
  const header = (title, sub) => `<div class="hdr"><button class="btn back" data-act="goto" data-arg="main" aria-label="Zurück">←</button><h1 class="plank">${title}</h1>${sub ? `<div class="sub">${sub}</div>` : ''}</div>`;
  const coinsChip = () => `<div class="coins"><span class="shell-ico"></span>${fmt(S().coins)}</div>`;

  const SCREENS = {
    main() {
      const has = S().created;
      ui.innerHTML = `<div class="title-wrap"><div class="logo">OceanQuest</div><div class="plank subtitle">Die 8 Prüfungen der Tiefsee</div></div>
      <nav class="mainmenu">
        <button class="btn big" data-act="new" ${has ? '' : 'data-default'}>▶ Neues Spiel</button>
        <button class="btn" data-act="continue" ${has ? 'data-default' : 'disabled'}>⟳ Fortsetzen${has && S().resume ? ' · Welt ' + S().resume.world : ''}</button>
        <button class="btn" data-act="goto" data-arg="slots">💾 Spielstände</button>
        <button class="btn contestbtn" data-act="contest">🎤 Mathe-Contest</button>
        <button class="btn footbtn ${has && footballOpen() ? '' : 'lockedbtn'}" data-act="football">⚽ Fußball-Modus${has && footballOpen() ? '' : ' 🔒'}</button>
        <button class="btn footbtn ${has && duelOpen() ? '' : 'lockedbtn'}" data-act="duel">🤝 Fußball-Duell${has && duelOpen() ? '' : ' 🔒'}</button>
        <button class="btn expbtn ${has && duelOpen() ? '' : 'lockedbtn'}" data-act="expeditions">🧭 Expeditionen${has && duelOpen() ? '' : ' 🔒'}</button>
        <button class="btn" data-act="goto" data-arg="create">🐬 Mein Delfin</button>
        <button class="btn" data-act="goto" data-arg="shop">🐚 Delfin-Shop</button>
        <button class="btn" data-act="${has ? 'goto' : 'continue'}" data-arg="worlds">🗺 Welten</button>
        <button class="btn" data-act="goto" data-arg="scores">🏆 Bestleistungen</button>
        <button class="btn" data-act="goto" data-arg="settings">⚙ Einstellungen</button>
        <button class="btn" data-act="goto" data-arg="help">📖 Anleitung</button>
      </nav>
      <div class="pearlbar">${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<span class="pearl ${S().defeated[i] ? 'got' : ''}" title="Perle ${i + 1}"></span>`).join('')}</div>
      ${has ? `<div class="hello">Spielstand ${Save.active + 1}: <b>${esc(S().name)}</b> ${coinsChip()}</div>` : ''}
      <footer>ein Lernspiel von <b>VoytsQuest</b></footer>`;
    },
    create(o) {
      ui.innerHTML = header('Dein Delfin') + `<div class="panel create"><div class="cl">
        <div class="preview" id="dprev"></div>
        <div class="arrows"><button class="btn round" data-act="color" data-arg="${COLOR_KEYS[(COLOR_KEYS.indexOf(S().color) + 4) % 5]}" aria-label="Vorherige Farbe">‹</button><button class="btn round" data-act="color" data-arg="${COLOR_KEYS[(COLOR_KEYS.indexOf(S().color) + 1) % 5]}" aria-label="Nächste Farbe">›</button></div>
        <div class="lbl">Farbe wählen:</div>
        <div class="swatches">${COLOR_KEYS.map(k => `<button class="swatch ${S().color === k ? 'sel' : ''}" data-act="color" data-arg="${k}" style="--c:${Art.COLORS[k].body}"><span></span>${Art.COLORS[k].name}</button>`).join('')}</div></div>
        <div class="cr"><label class="lbl">Name deines Delfins:<input id="dname" maxlength="16" value="${esc(S().created ? S().name : '')}" placeholder="z. B. Flipper" autocomplete="off"></label>
        <label class="lbl small">Dein Name für die Urkunde (freiwillig):<input id="cname" maxlength="30" value="${esc(S().childName)}" placeholder="optional" autocomplete="off"></label>
        <p class="note">Die Farbe gilt auch im Spiel. Mützen, Brillen und Looks gibt es im Delfin-Shop.</p>
        <button class="btn big gold" data-act="createdone" ${o.fresh ? 'data-fresh="1"' : ''} data-default>Los geht's!</button></div></div>`;
      $('#dprev').appendChild(dolphinCanvas(460, 260, 2.3));
      ui.querySelectorAll('.arrows .btn').forEach(b => b.addEventListener('click', () => setTimeout(() => show('create', o), 0)));
      $('#dname').addEventListener('keydown', e => { if (e.key === 'Enter') ui.querySelector('[data-act=createdone]').click(); });
      if (!S().created) setTimeout(() => { const n = $('#dname'); if (n) n.focus(); }, 50);
    },
    worlds() {
      const d = S();
      ui.innerHTML = header('Die 8 Meereswelten', `${esc(d.name)} · ${Save.pearls()} von 8 magischen Perlen`) + `<div class="worldgrid">${WORLDS.map(w => {
        const open = w.id <= d.unlocked, done = d.defeated[w.id - 1], b = d.best[w.id];
        return `<button class="wcard ${open ? '' : 'locked'} ${done ? 'done' : ''}" data-act="${open ? 'play' : 'locked'}" data-arg="${w.id}">
          ${d.resume && d.resume.world === w.id ? '<span class="wc-save">💾 Checkpoint</span>' : ''}<div class="wc-boss" data-boss="${w.boss}" data-grey="${open ? 0 : 1}"></div>
          <div class="wc-name">${w.id}. ${w.bossName}<small>${w.short}</small></div>
          <div class="wc-info">${open ? (b ? `${'★'.repeat(b.stars)}${'☆'.repeat(3 - b.stars)} · ${fmtTime(b.time)}` : 'Neu!') : '🔒 gesperrt'}</div>
          ${done ? '<span class="wc-pearl" title="Perle erhalten"></span>' : ''}</button>`;
      }).join('')}</div>
      <div class="examrow">${d.exam.unlocked ? `<button class="btn big gold" data-act="final">⚽ Großes Finale: Fußball gegen Mbappé</button>${d.exam.passed ? '<button class="btn" data-act="cert" data-arg="game">📜 Urkunde ansehen</button>' : ''}` : '<div class="note">Besiege alle 8 Bosse – dann wartet Mbappé zum großen Fußball-Finale.</div>'}</div>`;
      ui.querySelectorAll('.wc-boss').forEach(el => el.appendChild(bossCanvas(el.dataset.boss, 200, 130, 0.42, el.dataset.grey === '1')));
    },
    shop(o) {
      const cat = o.cat || SCREENS._cat || 'aussehen'; SCREENS._from = o.from !== undefined ? o.from : SCREENS._from;
      const items = Save.ITEMS.filter(i => cat === 'alle' || i.cat === cat);
      const from = SCREENS._from; const nextBtn = from ? `<button class="btn gold shopnext" data-act="${from >= 8 ? 'final' : 'nextworld'}" data-arg="${from}">${from >= 8 ? '⚽ Zum Finale ▶' : 'Weiter zu Welt ' + (from + 1) + ' ▶'}</button>` : '';
      ui.innerHTML = header('Delfin-Shop', 'Gib deine Muschel-Coins aus und mache deinen Delfin einzigartig!') + coinsChip() + nextBtn + `<div class="shop">
        <div class="shopside"><div class="preview" id="sprev"></div>
          ${[['aussehen', '👒 Aussehen'], ['trikots', '⚽ Trikots'], ['baden', '👙 Badeanzüge'], ['perruecken', '💇 Perücken'], ['effekte', '✨ Effekte'], ['begleiter', '🐢 Begleiter'], ['alle', '🧰 Alle Items']].map(([k, l]) => `<button class="btn ${k === cat ? 'sel' : ''}" data-act="shopcat" data-arg="${k}">${l}</button>`).join('')}
          <p class="note">Coins verdienst du mit Muscheln, Perlen und richtigen Antworten.</p></div>
        <div class="itemgrid">${items.map(it => {
          const own = S().owned.includes(it.id), eq = S().equipped[it.slot] === it.id;
          return `<button class="item ${own ? 'own' : ''} ${eq ? 'eq' : ''} ${it.premium ? 'premium' : ''}" data-act="buy" data-arg="${it.id}" title="${esc(it.hint || it.name)}">${it.premium ? '<span class="ptag">Premium</span>' : ''}<div class="ico" data-ico="${it.id}"></div><div class="iname">${it.name}</div>
            <div class="price ${it.reward && !own ? 'rwd' : ''}">${eq ? '✔ angelegt' : own ? 'Anlegen' : it.reward ? '🏆 Fußball-Modus' : `<span class="shell-ico"></span>${fmt(it.price)}`}</div></button>`;
        }).join('')}</div></div>`;
      $('#sprev').appendChild(miniCanvas(300, 190, (ctx, t) => { const c = Save.cosmetics(); if (c.companion) Art.drawCompanion(ctx, c.companion, 62, 132, t, 1); Art.drawDolphin(ctx, { x: 160, y: 95 + Math.sin(t * 2) * 5, facing: 1, color: S().color, t, cos: c, scale: 1.45, speed: 0.4 }); }, true));
      ui.querySelectorAll('.ico').forEach(el => el.appendChild(miniCanvas(150, 86, (ctx, t) => Art.drawItemIcon(ctx, el.dataset.ico, 75, 46, 1, t), true)));
      SCREENS._cat = cat;
    },
    scores() {
      const d = S(); const total = WORLDS.reduce((a, w) => a + (d.best[w.id] ? d.best[w.id].score : 0), 0);
      ui.innerHTML = header('Bestleistungen', esc(d.name)) + `<div class="panel scores"><table><thead><tr><th>Welt</th><th>Boss</th><th>Bestzeit</th><th>Punkte</th><th>Sterne</th></tr></thead><tbody>
        ${WORLDS.map(w => { const b = d.best[w.id]; return `<tr><td>${w.id}. ${w.short}</td><td>${d.defeated[w.id - 1] ? '✔ ' : ''}${w.bossName}</td><td>${b ? fmtTime(b.time) : '–'}</td><td>${b ? fmt(b.score) : '–'}</td><td class="stars">${b ? '★'.repeat(b.stars) + '☆'.repeat(3 - b.stars) : '–'}</td></tr>`; }).join('')}
        </tbody></table><div class="sumrow"><span>Gesamtpunkte: <b>${fmt(total)}</b></span><span>Perlen: <b>${Save.pearls()}/8</b></span><span>Spielzeit: <b>${fmtTime(d.playTime)}</b></span><span>Finale: <b>${d.exam.passed ? 'gewonnen ' + esc(d.exam.score) : '–'}</b></span></div></div>`;
    },
    settings() {
      const st = S().settings;
      ui.innerHTML = header('Einstellungen') + `<div class="panel settings">
        <div class="setrow"><span>Musik</span><button class="btn small" data-act="music">${st.music ? 'An ✔' : 'Aus'}</button><input type="range" min="0" max="1" step="0.05" value="${st.musicVol}" id="mvol" aria-label="Musiklautstärke"></div>
        <div class="setrow"><span>Aktueller Track</span><b id="trk">${esc(Sound.current().title)}</b><button class="btn small" data-act="nexttrack">⏭ Nächster (M)</button></div>
        <div class="setrow"><span>Soundeffekte</span><button class="btn small" data-act="sfx">${st.sfx ? 'An ✔' : 'Aus'}</button><input type="range" min="0" max="1" step="0.05" value="${st.sfxVol}" id="svol" aria-label="Effektlautstärke"></div>
        <div class="setrow"><span>Touch-Steuerung</span>${['auto', 'an', 'aus'].map(k => `<button class="btn small ${st.touch === k ? 'sel' : ''}" data-act="touch" data-arg="${k}">${k === 'auto' ? 'Automatisch' : k === 'an' ? 'Immer an' : 'Aus'}</button>`).join('')}</div>
        <div class="setrow"><span>Spielzeit heute</span><b>${Math.floor(Limit.used() / 60)} von 90 Minuten</b><small class="note">Limit pro Gerät und Tag, neuer Tag ab 00:00 Uhr</small></div>
        <div class="setrow"><span>Spielstand</span><button class="btn small" data-act="goto" data-arg="slots">💾 Spielstände</button><button class="btn small warn" data-act="reset">Diesen Spielstand löschen</button></div>
        <p class="note">Der Spielstand wird nur auf diesem Gerät gespeichert. Es werden keine Daten übertragen.</p></div>`;
      $('#mvol').addEventListener('input', e => { st.musicVol = +e.target.value; Sound.setMusicVol(st.musicVol); Save.save(); });
      $('#svol').addEventListener('input', e => { st.sfxVol = +e.target.value; Sound.setSfxVol(st.sfxVol); Save.save(); });
    },
    help() {
      ui.innerHTML = header('Anleitung') + `<div class="panel help"><div class="cols">
        <div><h3>Steuerung</h3><table class="keys">
          <tr><td><kbd>↑</kbd> <kbd>W</kbd></td><td>nach oben schwimmen</td></tr>
          <tr><td><kbd>←</kbd><kbd>→</kbd> <kbd>A</kbd><kbd>D</kbd></td><td>nach links / rechts</td></tr>
          <tr><td><kbd>↓</kbd> <kbd>S</kbd></td><td>nach unten tauchen</td></tr>
          <tr><td><kbd class="wide">Leertaste</kbd></td><td>Flossenschlag: kleine Gegner wegschieben, Schalter drücken, Kisten schieben</td></tr>
          <tr><td><kbd>M</kbd></td><td>nächster Musik-Track</td></tr>
          <tr><td><kbd>Esc</kbd></td><td>Pause</td></tr></table>
          <p>Auf dem iPad erscheinen Touch-Tasten: links das Steuerkreuz, rechts die große Action-Taste.</p></div>
        <div><h3>So geht's</h3><ul class="checks">
          <li>Schwimme frei in alle Richtungen.</li><li>Sammle Muscheln (10 Punkte) und Perlen (50 Punkte).</li>
          <li>Große Gegner (Aale, Riesenfische) und Seeigel sind geschützt – schwimm drumherum!</li>
          <li>Checkpoints (Fahnen) merken sich deinen Fortschritt.</li>
          <li>Am Ende jeder Welt wartet ein Boss. Besiege ihn mit richtigen Rechnungen!</li>
          <li>Falsche Antwort? Kein Problem – du bekommst einen Tipp und darfst es nochmal versuchen.</li></ul>
          <div class="goal"><b>Dein Ziel:</b> Besiege alle 8 Meeresbosse, bestehe die große Prüfung und erhalte die Urkunde „Meister der 8 Meere“!</div></div></div></div>`;
    },
    cert(o) { renderCertScreen(o.kind || 'game'); },
    slots() {
      ui.innerHTML = header('Spielstände', 'Jeder Spielstand hat seinen eigenen Delfin, Fortschritt und eigene Coins') + `<div class="slotgrid">${[0, 1, 2].map(i => { const d = Save.slots[i];
        return d ? `<div class="slot ${i === Save.active ? 'act' : ''}"><div class="slot-no">Spielstand ${i + 1}${i === Save.active ? ' · aktiv' : ''}</div><div class="slot-cv" data-i="${i}"></div><div class="slot-name">${esc(d.name)}</div>
          <div class="slot-info"><span class="pearlmini">${d.defeated.filter(Boolean).length}/8 Perlen</span> · <span class="shell-ico"></span>${fmt(d.coins)}</div>
          <div class="slot-sub">${d.resume ? '💾 Checkpoint in Welt ' + d.resume.world : d.exam.passed ? '🏆 Meister der 8 Meere' : 'Welt ' + d.unlocked + ' freigeschaltet'}<br><small>gespeichert: ${esc(d.savedAt || '–')}</small></div>
          <div class="row"><button class="btn gold" data-act="slotplay" data-arg="${i}" ${i === Save.active ? 'data-default' : ''}>▶ Spielen</button><button class="btn small warn" data-act="slotdel" data-arg="${i}" aria-label="Spielstand ${i + 1} löschen">🗑</button></div></div>`
          : `<div class="slot empty"><div class="slot-no">Spielstand ${i + 1}</div><div class="slot-plus">+</div><div class="slot-sub">Noch frei</div><button class="btn gold" data-act="slotnew" data-arg="${i}">➕ Neuer Delfin</button></div>`; }).join('')}</div>
        <div class="codebar"><span>📲 Auf ein anderes Gerät wechseln:</span><button class="btn small" data-act="codeshow">Code für Spielstand ${Save.active + 1} anzeigen</button><button class="btn small" data-act="codein">Code eingeben</button></div>`;
      ui.querySelectorAll('.slot-cv').forEach(el => { const d = Save.slots[+el.dataset.i]; el.appendChild(miniCanvas(300, 130, (ctx, t) => { const c = Object.assign({}, d.equipped); if (c.companion) Art.drawCompanion(ctx, c.companion, 58, 92, t, 1); Art.drawDolphin(ctx, { x: 160, y: 62 + Math.sin(t * 2 + +el.dataset.i) * 4, facing: 1, color: d.color, t, cos: c, scale: 1.2, speed: 0.35 }); }, true)); });
    },
    league() {
      const d = S(), f = d.football; const wins = f.won.filter(Boolean).length; Sound.forWorld(0);
      ui.innerHTML = header('Fußball-Modus', `${esc(d.name)} · ${wins} von 8 Stadien gewonnen · vor jedem Spiel 3 Aufwärm-Aufgaben`) + `<div class="leaguegrid">${WORLDS.map((W, i) => { const open = i === 0 || f.won[i - 1], won = f.won[i], rw = REWARDS[i];
        return `<button class="stadium ${open ? '' : 'locked'} ${won ? 'won' : ''}" data-act="${open ? 'leaguego' : 'closeov'}" data-arg="${i}" ${open ? '' : 'title="Gewinne zuerst im vorherigen Stadion"'}><div class="st-cv" data-boss="${W.boss}" data-grey="${open ? 0 : 1}"></div><div class="st-name">${STADIUMS[i]}</div><div class="st-res">${won ? '✔ Gewonnen ' + f.scores[i] : open ? '▶ Aufwärmen & Anpfiff' : '🔒 gesperrt'}</div>${rw ? `<span class="st-rw" title="Belohnung">🏆</span>` : ''}</button>`; }).join('')}</div>
        <div class="rewardbar"><b>Belohnungen:</b>${Object.entries(REWARDS).map(([i, id]) => { const it = Save.ITEMS.find(x => x.id === id); const own = d.owned.includes(id); return `<span class="rw ${own ? 'own' : ''}"><span class="rwico" data-ico="${id}"></span>${esc(it.name)}<small>${own ? '✔ gewonnen' : 'Stadion ' + (+i + 1)}</small></span>`; }).join('')}${f.won.every(Boolean) ? '<button class="btn gold small" data-act="cert" data-arg="football">📜 Urkunde</button>' : ''}</div>`;
      ui.querySelectorAll('.st-cv').forEach(el => el.appendChild(bossCanvas(el.dataset.boss, 200, 110, 0.36, el.dataset.grey === '1')));
      ui.querySelectorAll('.rwico').forEach(el => el.appendChild(itemIcon(el.dataset.ico, 90, 54)));
    },
    expmap() {
      const e = S().expeditions; const all = e.medals.every(m => m >= 1); Sound.forWorld(0);
      const MED = ['🥉', '🥈', '🥇'];
      ui.innerHTML = header('Expeditionen', `${esc(S().name)} · ${e.medals.filter(m => m).length} von 6 geschafft · Dash: Umschalttaste oder K · im Seegras kannst du dich verstecken`) + `<div class="expgrid">${Expedition.DEFS.map((D, i) => {
        const m = e.medals[i]; const it = Save.ITEMS.find(x => x.id === D.reward); const own = S().owned.includes(D.reward);
        return `<button class="expcard ${m ? 'done' : ''} ${D.id === 'albtraum' ? 'night' : ''}" data-act="expstart" data-arg="${D.id}"><div class="ex-ico">${D.icon}</div><div class="ex-name">${D.name}</div><div class="ex-desc">${D.short}</div>
          <div class="ex-med">${[1, 2, 3].map(k => `<span class="${m >= k ? 'on' : ''}" title="${esc(D.medals[k - 1])}">${MED[k - 1]}</span>`).join('')}</div><div class="ex-rw"><span class="rwico" data-ico="${D.reward}"></span>${esc(it.name)} ${own ? '✔' : ''}</div></button>`; }).join('')}</div>
        <div class="expbar"><button class="btn small" data-act="goto" data-arg="lexicon">📖 Meeres-Lexikon (${e.lexicon.length}/12)</button><span class="note">Medaillen: 🥉 geschafft · 🥈 gut · 🥇 perfekt – Fahre mit der Maus über eine Medaille für die Bedingung.</span>${all ? '<button class="btn gold small" data-act="cert" data-arg="expedition">📜 Expeditions-Urkunde</button>' : ''}</div>`;
      ui.querySelectorAll('.rwico').forEach(el => el.appendChild(itemIcon(el.dataset.ico, 70, 42)));
    },
    lexicon() {
      const lx = S().expeditions.lexicon;
      ui.innerHTML = header('Meeres-Lexikon', `${lx.length} von 12 Meerestieren entdeckt – finde sie bei der Riff-Erkundung`) + `<div class="lexgrid">${Expedition.CREATURES.map(c => { const f = lx.includes(c.id); return `<div class="lexcard ${f ? '' : 'unknown'}"><div class="lex-cv" data-id="${c.id}" data-f="${f ? 1 : 0}"></div><b>${f ? esc(c.name) : '???'}</b><p>${f ? esc(c.fact) : 'Noch nicht entdeckt.'}</p></div>`; }).join('')}</div>`;
      ui.querySelectorAll('.lex-cv').forEach(el => el.appendChild(miniCanvas(150, 70, (ctx, t) => { if (el.dataset.f === '0') ctx.filter = 'brightness(0) opacity(0.35)'; ExpeditionArt.drawCreature(ctx, el.dataset.id, 75, 38, t, 1.2); ctx.filter = 'none'; }, true)));
      const b = ui.querySelector('.hdr .back'); if (b) b.dataset.arg = 'expmap';
    },
    nightmare() {
      const nm = S().expeditions.nightmare; Sound.forWorld(8);
      ui.innerHTML = header('Albtraum-Tiefsee', `${nm.filter(Boolean).length} von 8 geschafft · nur 1 Herz · schnellere Gegner · schwerere Aufgaben · Boss mit 2 Fragen mehr`) + `<div class="worldgrid night">${WORLDS.map((W, i) => `<button class="wcard nightcard ${nm[i] ? 'done' : ''}" data-act="nightplay" data-arg="${W.id}"><div class="wc-boss" data-boss="${W.boss}"></div><div class="wc-name">${W.id}. ${W.bossName}<small>Albtraum-${W.short}</small></div><div class="wc-info">${nm[i] ? '💀 geschafft' : '▶ wagen'}</div></button>`).join('')}</div>`;
      ui.querySelectorAll('.wc-boss').forEach(el => el.appendChild(miniCanvas(200, 130, (ctx, t) => { Art.drawBoss(ctx, el.dataset.boss, 100, 74, 0.42, { t }); ctx.globalCompositeOperation = 'source-atop'; ctx.fillStyle = 'rgba(160,0,40,0.35)'; ctx.fillRect(0, 0, 200, 130); ctx.globalCompositeOperation = 'source-over'; }, true)));
      const b = ui.querySelector('.hdr .back'); if (b) b.dataset.arg = 'expmap';
    },
    duelpick() {
      const figs = duelFigs(); DUEL.p1 = Math.min(DUEL.p1, figs.length - 1); DUEL.p2 = Math.min(DUEL.p2 === null ? figs.length - 1 : DUEL.p2, figs.length - 1);
      const panel = (pl, title, keys) => `<div class="duelside ${pl}"><div class="ds-head"><b>${title}</b><span>${keys}</span></div><div class="figgrid">${figs.map((f, i) => `<button class="figtile ${DUEL[pl] === i ? 'sel' : ''}" data-act="duelfig" data-arg="${pl}:${i}" data-pl="${pl}" data-i="${i}"><div class="fig-cv" data-i="${i}"></div><span>${esc(f.name)}</span></button>`).join('')}</div></div>`;
      ui.innerHTML = header('Fußball-Duell', 'Zwei Spieler an einem Gerät – wählt eure Figuren!') + `<div class="duelwrap">${panel('p1', 'Spieler 1 · links', '<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> + <kbd class="wide2">Leertaste</kbd>')}${panel('p2', 'Spieler 2 · rechts', '<kbd>↑</kbd><kbd>←</kbd><kbd>↓</kbd><kbd>→</kbd> + <kbd class="wide2">Enter</kbd>')}</div>
        <div class="duelbar"><span id="duelvs"></span><span class="winsel">Bis ${[3, 5, 7].map(n => `<button class="btn small winbtn ${DUEL.win === n ? 'sel' : ''}" data-act="duelwin" data-arg="${n}">${n}</button>`).join('')} Tore</span><button class="btn big gold" data-act="duelgo" data-default>⚽ Anpfiff!</button></div>`;
      ui.querySelectorAll('.fig-cv').forEach(el => { const f = figs[+el.dataset.i]; el.appendChild(miniCanvas(110, 64, (ctx, t) => { if (f.kind === 'dolphin') Art.drawDolphin(ctx, { x: 55, y: 34, facing: 1, color: f.color, t, cos: f.cos, scale: 0.75, speed: 0.3 }); else Art.drawBoss(ctx, f.id, 55, 36, f.scale * 0.75, { t }); }, true)); });
      updateDuelBar();
    },
    contestpick() {
      ui.innerHTML = header('Mathe-Contest', 'Wähle deinen Delfin – die gewonnenen Muschel-Coins landen auf seinem Konto') + `<div class="slotgrid">${[0, 1, 2].map(i => { const d = Save.slots[i];
        return d ? `<button class="slot pick" data-act="contestgo" data-arg="${i}"><div class="slot-no">Spielstand ${i + 1}</div><div class="slot-cv" data-i="${i}"></div><div class="slot-name">${esc(d.name)}</div><div class="slot-info"><span class="shell-ico"></span>${fmt(d.coins)} Coins</div><div class="slot-sub">${d.contest.played ? 'Bester Lauf: Frage ' + d.contest.best + ' von 15' : 'Noch nie in der Show'}</div><span class="btn gold">🎤 Mit ${esc(d.name)} spielen</span></button>`
          : `<div class="slot empty"><div class="slot-no">Spielstand ${i + 1}</div><div class="slot-plus">+</div><button class="btn small" data-act="slotnew" data-arg="${i}">➕ Delfin erstellen</button></div>`; }).join('')}</div>
        <div class="rulesbar"><b>So geht's:</b> 15 Fragen von leicht bis schwer · jede richtige Antwort klettert die Gewinnleiter hoch · Sicherheitsstufen bei Frage 5 und 10 · 3 Joker · jederzeit aussteigen und Coins mitnehmen · bis zu <b>5.000 Coins</b></div>`;
      ui.querySelectorAll('.slot-cv').forEach(el => { const d = Save.slots[+el.dataset.i]; el.appendChild(miniCanvas(300, 130, (ctx, t) => Art.drawDolphin(ctx, { x: 150, y: 62 + Math.sin(t * 2 + +el.dataset.i) * 4, facing: 1, color: d.color, t, cos: Object.assign({}, d.equipped), scale: 1.2, speed: 0.35 }), true)); });
    },
    exam() { }
  };

  function buy(id) {
    const it = Save.ITEMS.find(i => i.id === id); const d = S();
    if (it.reward && !d.owned.includes(id)) { toast('🏆 ' + it.name + ' gewinnst du im Fußball-Modus!'); return; }
    if (d.owned.includes(id)) { d.equipped[it.slot] = d.equipped[it.slot] === id ? null : id; Save.save(); Sound.sfx('switch'); }
    else if (d.coins >= it.price) { d.coins -= it.price; d.owned.push(id); d.equipped[it.slot] = id; Save.save(); Sound.sfx('buy'); toast(it.name + ' gekauft!'); }
    else { toast(`Dir fehlen noch ${fmt(it.price - d.coins)} Muschel-Coins.`); return; }
    show('shop', { cat: SCREENS._cat });
  }

  /* ---------- Bosskampf ---------- */
  function showDialog(W, lines, done) {
    let i = 0; const box = document.createElement('div'); box.id = 'dialog'; box.className = 'dialog';
    box.innerHTML = `<div class="dportrait"></div><div class="dbody"><div class="dname">${W.bossName} <small>${W.bossTitle}</small></div><div class="dtext"></div><div class="dnext">Weiter ▶ <small>(Klick / Leertaste)</small></div></div>`;
    ui.appendChild(box); box.querySelector('.dportrait').appendChild(bossCanvas(W.boss, 150, 120, 0.36));
    const txt = box.querySelector('.dtext'); let typing = null;
    const showLine = () => {
      Game.setTalk(true); if (W.boss === 'herbert') Game.setLamp(i !== 0);
      const full = lines[i]; let k = 0; clearInterval(typing); txt.textContent = '';
      typing = setInterval(() => { k += 2; txt.textContent = full.slice(0, k); if (k >= full.length) { clearInterval(typing); typing = null; Game.setTalk(false); } }, 22);
    };
    box.addEventListener('click', () => {
      if (typing) { clearInterval(typing); typing = null; txt.textContent = lines[i]; Game.setTalk(false); return; }
      i++; if (i >= lines.length) { box.remove(); Game.setTalk(false); Game.setLamp(true); done && done(); } else showLine();
    });
    showLine();
  }

  function bossMath(W, boss) {
    const panel = document.createElement('div'); panel.className = 'mathpanel'; ui.appendChild(panel);
    let task, attempts = 0;
    const say = (text, cls) => { const b = panel.querySelector('.bubble'); b.textContent = text; b.className = 'bubble ' + (cls || ''); };
    const next = () => {
      task = MathGen.generate(Game.L && Game.L.nightmare ? Math.min(8, W.id + 1) : W.id); attempts = 0;
      panel.innerHTML = `<div class="mp-head"><span class="tag">${esc(task.label)}</span><span class="hp">${W.bossName}: ${'❤'.repeat(boss.hp)}<span class="lost">${'❤'.repeat(boss.max - boss.hp)}</span></span></div>
        <div class="bubble"></div><div class="task"></div><div class="fb" aria-live="polite"></div>`;
      say(boss.hp === boss.max ? 'Löse meine Aufgabe, ' + S().name + '!' : 'Noch ' + boss.hp + ' Aufgabe' + (boss.hp > 1 ? 'n' : '') + ' bis zum Sieg!');
      const api = renderTask(panel.querySelector('.task'), task, submit);
      UI._cur = { task, solve: () => submit(answerOf(task), api) };
    };
    const submit = (input, api) => {
      const fb = panel.querySelector('.fb');
      if (MathGen.check(task, input)) {
        Sound.sfx('correct'); Game.bossHit(); api.lock(true);
        fb.className = 'fb ok'; fb.innerHTML = '✔ Richtig! <b>+100</b>'; say(W.hits[Math.floor(Math.random() * W.hits.length)], 'hit');
        if (boss.hp <= 0) setTimeout(() => { panel.remove(); showDialog(W, [W.defeat], () => Game.bossDefeat()); }, 1500);
        else setTimeout(next, 1600);
      } else {
        Sound.sfx('wrong'); Game.bossMiss(); attempts++;
        say(W.wrong[Math.floor(Math.random() * W.wrong.length)], 'laugh');
        if (attempts < 3) { fb.className = 'fb bad'; fb.innerHTML = `✘ Noch nicht richtig. <span class="hint">${esc(task.hint)}</span>`; api.reset(); }
        else { api.lock(true); fb.className = 'fb bad'; fb.innerHTML = `${esc(task.solution)} <button class="btn small" data-default id="nt">Neue Aufgabe ▶</button>`; fb.querySelector('#nt').onclick = () => { Sound.sfx('click'); next(); }; }
      }
    };
    next();
  }

  /* Antwortformate: choice | brackets | input | order | pyramid */
  function renderTask(el, task, submit) {
    let locked = false; const api = { lock(v) { locked = v; el.classList.toggle('locked', v); }, reset() { } };
    const prompt = `<div class="prompt">${esc(task.prompt).replace(/\n/g, '<br>').replace(/___/g, '<span class="gap">?</span>')}</div>`;
    if (task.format === 'choice' || task.format === 'brackets') {
      el.innerHTML = prompt + `<div class="choices ${task.choices.some(c => c.label.length > 14) ? 'wide' : ''}">${task.choices.map((c, i) => `<button class="choice" data-v="${esc(c.value)}"><span class="letter">${'ABCD'[i]}</span>${esc(c.label)}</button>`).join('')}</div>`;
      el.querySelectorAll('.choice').forEach(b => b.onclick = () => { if (locked) return; el.querySelectorAll('.choice').forEach(x => x.classList.remove('picked', 'wrong')); b.classList.add('picked'); const ok = MathGen.check(task, b.dataset.v); if (!ok) b.classList.add('wrong'); submit(b.dataset.v, api); });
    } else if (task.format === 'input') {
      el.innerHTML = prompt + `<div class="inputrow"><div class="answer" id="ans"></div></div>` + numpad();
      let v = ''; const ans = el.querySelector('#ans'); const upd = () => ans.textContent = v || ' ';
      api.reset = () => { v = ''; upd(); ans.classList.add('shake'); setTimeout(() => ans.classList.remove('shake'), 400); };
      bindPad(el, k => { if (locked) return; if (k === 'del') v = v.slice(0, -1); else if (k === 'ok') { if (v) submit(v, api); } else if (v.length < 5) v += k; upd(); }); upd();
    } else if (task.format === 'order') {
      el.innerHTML = prompt + `<div class="orderitems">${task.items.map((s, i) => `<button class="oitem" data-i="${i}"><span class="badge"></span>${esc(s)}</button>`).join('')}</div><div class="row"><button class="btn small" id="ordreset">↺ Zurücksetzen</button><button class="btn small gold" id="ordok" disabled>Prüfen ✔</button></div>`;
      let seq = []; const btns = [...el.querySelectorAll('.oitem')];
      const upd = () => { btns.forEach((b, i) => { const p = seq.indexOf(i); b.classList.toggle('sel', p >= 0); b.querySelector('.badge').textContent = p >= 0 ? p + 1 : ''; }); el.querySelector('#ordok').disabled = seq.length !== task.items.length; };
      btns.forEach((b, i) => b.onclick = () => { if (locked || seq.includes(i)) return; seq.push(i); upd(); });
      el.querySelector('#ordreset').onclick = () => { if (!locked) { seq = []; upd(); } };
      el.querySelector('#ordok').onclick = () => { if (!locked) submit(seq.slice(), api); };
      api.reset = () => { seq = []; upd(); };
    } else if (task.format === 'pyramid') {
      const { rows, blanks } = task.pyramid; const isBlank = (r, c) => blanks.some(([a, b]) => a === r && b === c);
      let vals = {}; let sel = blanks[0][0] + ',' + blanks[0][1];
      el.innerHTML = prompt + `<div class="pyr">${rows.map((row, r) => ({ row, r })).reverse().map(({ row, r }) => `<div class="prow">${row.map((v, c) => isBlank(r, c) ? `<button class="pcell blank" data-k="${r},${c}"></button>` : `<div class="pcell">${v}</div>`).join('')}</div>`).join('')}</div>` + numpad();
      const cells = [...el.querySelectorAll('.pcell.blank')];
      const upd = () => cells.forEach(c => { c.textContent = vals[c.dataset.k] || ''; c.classList.toggle('sel', c.dataset.k === sel); });
      cells.forEach(c => c.onclick = () => { if (!locked) { sel = c.dataset.k; upd(); } });
      api.reset = () => { vals = {}; sel = cells[0].dataset.k; upd(); };
      bindPad(el, k => {
        if (locked) return; const cur = vals[sel] || '';
        if (k === 'del') vals[sel] = cur.slice(0, -1);
        else if (k === 'ok') { const filled = cells.every(c => vals[c.dataset.k]); if (!filled) { const empty = cells.find(c => !vals[c.dataset.k]); sel = empty.dataset.k; upd(); toast('Fülle zuerst alle leeren Steine aus.'); return; } submit(Object.assign({}, vals), api); return; }
        else if (cur.length < 4) { vals[sel] = cur + k; }
        upd();
      });
      upd();
    }
    return api;
  }
  const answerOf = t => t.format === 'order' ? t.answer.slice() : t.format === 'pyramid' ? Object.assign({}, t.answer) : String(t.answer);
  const numpad = () => `<div class="numpad">${['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'ok'].map(k => `<button class="key ${k}" data-key="${k}">${k === 'del' ? '⌫' : k === 'ok' ? 'OK' : k}</button>`).join('')}</div>`;
  function bindPad(el, fn) { const pad = el.querySelector('.numpad'); pad.querySelectorAll('.key').forEach(b => b.onclick = () => fn(b.dataset.key)); pad.addEventListener('key', e => fn(e.detail)); }

  /* ---------- Ergebnis ---------- */
  function showResults(st) {
    if (st.nightmare) { nightmareResult(st); return; }
    const d = S(); const w = st.world; const prev = d.best[w];
    const isBest = !prev || st.score > prev.score;
    d.best[w] = { time: prev ? Math.min(prev.time, st.time) : st.time, score: prev ? Math.max(prev.score, st.score) : st.score, stars: prev ? Math.max(prev.stars, st.stars) : st.stars };
    const firstWin = !d.defeated[w - 1]; d.defeated[w - 1] = true;
    let unlockedMsg = '';
    if (w < 8 && d.unlocked < w + 1) { d.unlocked = w + 1; unlockedMsg = `🔓 Welt ${w + 1} freigeschaltet: ${WORLDS[w].name}!`; }
    if (w === 8 && !d.exam.unlocked) { d.exam.unlocked = true; unlockedMsg = '⚽ Das große Finale gegen Mbappé ist freigeschaltet!'; }
    if (d.resume && d.resume.world === w) d.resume = null;
    d.stats.correct += st.correct; d.stats.wrong += st.fails; d.stats.shells += st.shells; d.stats.knocks += st.knocks || 0;
    d.coins += st.coins; d.playTime += st.time; d.score = WORLDS.reduce((a, x) => a + (d.best[x.id] ? d.best[x.id].score : 0), 0); Save.save();
    if (unlockedMsg) setTimeout(() => Sound.sfx('unlock'), 600);
    const o = overlay(`<div class="panel results"><h2>${WORLDS[w - 1].bossName} besiegt!</h2>
      <div class="bigstars">${[1, 2, 3].map(i => `<span class="${i <= st.stars ? 'on' : ''}" style="animation-delay:${i * 0.25}s">★</span>`).join('')}</div>
      <div class="magic">${firstWin ? '✨ Du hast die ' + Save.pearls() + '. magische Perle erhalten!' : 'Welt erneut gemeistert!'}</div>
      <table class="rt"><tr><td>Benötigte Zeit</td><td>${fmtTime(st.time)}</td></tr><tr><td>Muscheln</td><td>${st.shells} / ${st.totalShells}</td></tr><tr><td>Perlen</td><td>${st.pearls}</td></tr>
      <tr><td>Richtige Rechenantworten</td><td>${st.correct}</td></tr><tr><td>Fehlversuche</td><td>${st.fails}</td></tr><tr><td>Zeitbonus</td><td>+${fmt(st.timeBonus)}</td></tr>
      <tr class="tot"><td>Punkte</td><td>${fmt(st.score)}${isBest ? ' <span class="nb">Rekord!</span>' : ''}</td></tr><tr><td>Muschel-Coins verdient</td><td>+${fmt(st.coins)}</td></tr>${st.egg ? `<tr><td>🥚 Easter Egg „${st.egg}“</td><td>gefunden!</td></tr>` : ''}</table>
      ${unlockedMsg ? `<div class="unlock">${unlockedMsg}</div>` : ''}
      <div class="row">${w < 8 ? `<button class="btn big gold" data-act="nextworld" data-arg="${w}" data-default>Nächste Welt ▶</button>` : `<button class="btn big gold" data-act="final" data-default>⚽ Zum großen Finale ▶</button>`}
      <button class="btn" data-act="play" data-arg="${w}">⟲ Nochmal</button><button class="btn" data-act="quit">🗺 Weltkarte</button></div>
      <button class="shopbar" data-act="shopafter" data-arg="${w}"><span class="sb-ico"></span><span class="sb-txt"><b>Delfin-Shop</b><small>Trikots, Perücken, Begleiter & mehr</small></span><span class="sb-coins"><span class="shell-ico"></span>${fmt(d.coins)}</span><span class="sb-go">Einkaufen ▶</span></button></div>`);
    o.classList.add('celebrate');
  }

  /* ---------- Großes Finale: Fußball gegen Mbappé ---------- */
  function startFinal() {
    footIdx = null; duelOn = false; const d = S(); if (!d.exam.unlocked) { toast('Besiege zuerst alle 8 Bosse!'); return; }
    closeOverlay(); mode = 'finale'; screen = 'finale'; ui.innerHTML = ''; ui.className = 'ingame';
    Finale.start((won, score) => {
      if (won) { d.exam.passed = true; d.exam.score = score; d.exam.date = new Date().toLocaleDateString('de-DE'); d.coins += 1000; Save.save(); }
      overlay(`<div class="panel results"><h2>${won ? '🏆 Du hast gewonnen!' : 'Mbappé gewinnt …'}</h2><div class="bignum">${score}</div>
        <p>${won ? `Du hast Mbappé im großen Unterwasser-Finale geschlagen. Du bist der wahre Meister der acht Meere! <b>+1.000 Muschel-Coins</b>` : 'Knapp! Mbappé ist schnell – aber er lässt hinten Lücken. Versuch es nochmal!'}</p>
        <div class="row">${won ? '<button class="btn big gold" data-act="cert" data-default>📜 Zur Urkunde</button>' : '<button class="btn big gold" data-act="final" data-default>⟲ Revanche!</button>'}<button class="btn" data-act="quit">🗺 Weltkarte</button></div></div>`);
      if (won) confetti();
    });
    overlay(`<div class="panel"><h2>⚽ Das große Finale</h2>
      <p>Mbappé fordert dich zum Unterwasser-Fußball heraus! Schieß den Ball in sein Tor rechts und verteidige dein Tor links.<br><b>Wer zuerst 5 Tore schießt, gewinnt.</b></p>
      <table class="keys"><tr><td><kbd>←</kbd><kbd>↑</kbd><kbd>↓</kbd><kbd>→</kbd> / <kbd>WASD</kbd></td><td>schwimmen</td></tr><tr><td><kbd class="wide">Leertaste</kbd></td><td>kurzer Sprint</td></tr><tr><td>👆 Finger / Maus</td><td>auf deiner Hälfte ziehen</td></tr></table>
      <div class="row"><button class="btn big gold" data-act="kickoff" data-default>Anpfiff! ▶</button></div></div>`);
  }
  function confetti() {
    const box = document.createElement('div'); box.className = 'confetti'; ui.appendChild(box);
    for (let i = 0; i < 80; i++) { const s = document.createElement('i'); s.style.left = Math.random() * 100 + '%'; s.style.background = ['#ffd23a', '#ff5a8a', '#5ad1ff', '#7aff9a', '#c89aff'][i % 5]; s.style.animationDelay = Math.random() * 2 + 's'; s.style.animationDuration = 2.5 + Math.random() * 2 + 's'; box.appendChild(s); }
  }

  /* ---------- Urkunde ---------- */
  function drawCertificate(cv, kind) {
    kind = kind || 'game';
    const ctx = cv.getContext('2d'); const W = cv.width, H = cv.height; const d = S(); const k = W / 1600; const cl = d.contest.last || { step: 0, prize: 0, how: 'wrong', jokers: 0, date: '' }; const f = d.football;
    ctx.save(); ctx.scale(k, k); const w = 1600, h = 1131;
    const g = ctx.createRadialGradient(w / 2, h / 2, 200, w / 2, h / 2, 1000); g.addColorStop(0, '#fff8e2'); g.addColorStop(1, '#ecd49a'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    const r = Art.rng(42); for (let i = 0; i < 400; i++) { ctx.fillStyle = `rgba(150,110,40,${r() * 0.06})`; ctx.beginPath(); ctx.arc(r() * w, r() * h, 2 + r() * 30, 0, 7); ctx.fill(); }
    ctx.lineWidth = 14; ctx.strokeStyle = '#b8860b'; ctx.strokeRect(40, 40, w - 80, h - 80); ctx.lineWidth = 4; ctx.strokeStyle = '#7a5a10'; ctx.strokeRect(64, 64, w - 128, h - 128);
    ctx.lineWidth = 2; ctx.strokeStyle = '#d4a940'; ctx.strokeRect(76, 76, w - 152, h - 152);
    [[90, 90, 1, 1], [w - 90, 90, -1, 1], [90, h - 90, 1, -1], [w - 90, h - 90, -1, -1]].forEach(([x, y, sx, sy]) => { ctx.save(); ctx.translate(x, y); ctx.scale(sx, sy); ctx.beginPath(); ctx.moveTo(0, 70); ctx.quadraticCurveTo(0, 0, 70, 0); ctx.moveTo(10, 50); ctx.quadraticCurveTo(20, 20, 50, 10); ctx.lineWidth = 5; ctx.strokeStyle = '#b8860b'; ctx.stroke(); Art.ell(ctx, 18, 18, 9, 9); ctx.fillStyle = '#d4a940'; ctx.fill(); ctx.restore(); });
    // Korallen
    const coral = (x, s, col) => { ctx.save(); ctx.translate(x, h - 82); ctx.scale(s, s); ctx.strokeStyle = col; ctx.lineCap = 'round'; ctx.lineWidth = 12; [[0, -120, -40], [0, -90, 40], [-30, -60, -70], [30, -50, 70]].forEach(([x0, y1, x2]) => { ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(x0, y1 * 0.6, x2 * 0.6, y1); ctx.stroke(); }); ctx.restore(); };
    coral(150, 1, '#e86a6a'); coral(230, 0.7, '#ff9a5a'); coral(w - 150, 1, '#c86ae8'); coral(w - 230, 0.7, '#e86a9a');
    ctx.textAlign = 'center';
    const gt = ctx.createLinearGradient(0, 120, 0, 220); gt.addColorStop(0, '#2a8ad8'); gt.addColorStop(1, '#0a4a8a');
    ctx.font = 'bold 110px Fredoka, sans-serif'; ctx.lineWidth = 10; ctx.strokeStyle = '#ffd23a'; ctx.strokeText('OCEANQUEST', w / 2, 210); ctx.fillStyle = gt; ctx.fillText('OCEANQUEST', w / 2, 210);
    const SUB = { game: 'MEISTER DER 8 MEERE', contest: cl.how === 'win' ? 'MUSCHEL-MILLIONÄR' : 'DIE GROSSE MUSCHEL-SHOW', football: 'FUSSBALL-MEISTER DER 8 MEERE', expedition: 'EXPEDITIONS-LEITER DER 8 MEERE' }[kind];
    ctx.font = `bold ${SUB.length > 26 ? 44 : 56}px Fredoka, sans-serif`; ctx.fillStyle = '#7a4a10'; ctx.fillText(SUB, w / 2, 290);
    ctx.font = '600 30px Fredoka, sans-serif'; ctx.fillStyle = '#4a3010'; ctx.fillText(kind === 'contest' && cl.how !== 'win' ? 'Super gemacht!' : 'Herzlichen Glückwunsch!', w / 2, 360);
    const nm = d.childName ? `${d.childName} mit Delfin ${d.name}` : `Delfin ${d.name}`;
    ctx.font = 'bold 64px Fredoka, sans-serif'; ctx.fillStyle = '#0a3a6a'; ctx.fillText(nm, w / 2, 445);
    ctx.beginPath(); ctx.moveTo(w / 2 - 420, 470); ctx.lineTo(w / 2 + 420, 470); ctx.lineWidth = 3; ctx.strokeStyle = '#b8860b'; ctx.stroke();
    ctx.font = '500 28px Fredoka, sans-serif'; ctx.fillStyle = '#3a2a10';
    const LINES = {
      game: ['Du hast alle acht Meeresbosse besiegt, die Geheimnisse der Tiefsee entdeckt', 'und Mbappé im großen Unterwasser-Finale ' + (d.exam.score || '') + ' geschlagen.', 'Du bist ein wahrer Meister der acht Meere!'],
      contest: cl.how === 'win' ? ['Du hast in der großen Muschel-Show alle 15 Mathe-Fragen', 'richtig beantwortet und den Hauptgewinn geholt.', 'Ein echtes Rechen-Ass!'] : [`Du hast in der großen Muschel-Show ${cl.step} von 15 Mathe-Fragen`, `richtig beantwortet und ${fmt(cl.prize)} Muschel-Coins gewonnen.`, cl.step >= 10 ? 'Eine starke Leistung!' : cl.step >= 5 ? 'Gut gerechnet – weiter so!' : 'Jede Show macht dich besser!'],
      football: ['Du hast in allen acht Stadien gegen die Meeresbosse gewonnen', `und dabei ${f.goals} Tore geschossen.`, 'Ein wahrer Unterwasser-Fußballstar!'],
      expedition: ['Du bist vor Bruno geflohen, hast das Riff erkundet, bist bis zum Meeresgrund getaucht,', 'der Lava entkommen, Meerestiere gerettet und dich der Albtraum-Tiefsee gestellt.', 'Eine wahre Expeditions-Leitung!']
    }[kind];
    LINES.forEach((l, i) => ctx.fillText(l, w / 2, 520 + i * 42));
    if (kind === 'expedition') {
      const ex = d.expeditions; const MC = ['#d8d0c0', '#cd7f32', '#c0c8d0', '#ffcc2a'];
      Expedition.DEFS.forEach((D, i) => { const x = w / 2 + (i - 2.5) * 170, y = 735; Art.ell(ctx, x, y, 52, 52); Art.fillS(ctx, MC[ex.medals[i]], 5, '#8a6200'); ctx.font = '44px sans-serif'; ctx.fillText(D.icon, x, y + 16); ctx.font = 'bold 19px Fredoka, sans-serif'; ctx.fillStyle = '#3a2a10'; ctx.fillText(D.name, x, y + 80); ctx.font = '500 16px Fredoka, sans-serif'; ctx.fillText(['–', 'Bronze', 'Silber', 'Gold'][ex.medals[i]], x, y + 100); });
    } else if (kind === 'contest') {
      const LAD = [20, 40, 70, 100, 150, 200, 300, 400, 600, 800, 1000, 1500, 2000, 3000, 5000];
      for (let i = 0; i < 15; i++) { const x = w / 2 + (i - 7) * 74, y = 730, got = i < cl.step, safe = i === 4 || i === 9;
        Art.ell(ctx, x, y, 30, 30); Art.fillS(ctx, got ? '#ffcc2a' : '#f4e6c0', safe ? 5 : 3, safe ? '#c8283a' : '#a87a00');
        ctx.font = 'bold 22px Fredoka, sans-serif'; ctx.fillStyle = got ? '#5a3a00' : '#b8a070'; ctx.fillText(String(i + 1), x, y + 8);
        ctx.font = '500 15px Fredoka, sans-serif'; ctx.fillStyle = '#5a4a2a'; ctx.fillText(fmt(LAD[i]), x, y + 52); }
      ctx.font = 'bold 30px Fredoka, sans-serif'; ctx.fillStyle = '#0a4a7a'; ctx.fillText(`Gewinn: ${fmt(cl.prize)} Muschel-Coins`, w / 2, 830);
    } else {
      WORLDS.forEach((W, i) => { const x = 330 + i * 134, y = 735; Art.ell(ctx, x, y, 56, 56); Art.fillS(ctx, '#0a4a7a', 5, '#d4a940'); ctx.save(); ctx.beginPath(); ctx.arc(x, y, 52, 0, 7); ctx.clip(); Art.drawBoss(ctx, W.boss, x, y + 6, 0.22, { t: 0 }); ctx.restore(); ctx.font = 'bold 20px Fredoka, sans-serif'; ctx.fillStyle = '#3a2a10'; ctx.fillText(W.bossName + (kind === 'football' ? ' ' + (f.scores[i] || '') : ' ✔'), x, y + 82); });
    }
    ctx.fillStyle = '#3a2a10'; const total = WORLDS.reduce((a, x) => a + (d.best[x.id] ? d.best[x.id].score : 0), 0); const st = d.stats;
    const VALS = {
      game: [`Richtig gelöste Aufgaben: ${fmt(st.correct)}   ·   Falsche Antworten: ${fmt(st.wrong)}   ·   Gesammelte Muscheln: ${fmt(st.shells)}   ·   Weggestoßene Gegner: ${fmt(st.knocks)}`, `Gesamtpunktzahl: ${fmt(total)}   ·   Gesamtspielzeit: ${fmtTime(d.playTime)}   ·   Finale: ${d.exam.score || '–'}`],
      contest: [`Richtig beantwortet: ${cl.step} von 15   ·   Joker eingesetzt: ${cl.jokers} von 3   ·   Gewinn: ${fmt(cl.prize)} Coins`, `Bester Lauf bisher: Frage ${d.contest.best}   ·   Shows gespielt: ${d.contest.played}`],
      football: [`Tore: ${f.goals} : ${f.against}   ·   Aufwärm-Aufgaben richtig: ${f.tasksRight} von ${f.tasks}`, `Fußball-Punkte: ${fmt(f.points)}`],
      expedition: [`Goldmedaillen: ${d.expeditions.medals.filter(m => m === 3).length} von 6   ·   Meeres-Lexikon: ${d.expeditions.lexicon.length} von 12 Tieren`, `Albtraum-Welten geschafft: ${d.expeditions.nightmare.filter(Boolean).length} von 8`]
    }[kind];
    ctx.font = '600 24px Fredoka, sans-serif'; ctx.fillText(VALS[0], w / 2, 878); ctx.font = '500 22px Fredoka, sans-serif'; ctx.fillText(VALS[1], w / 2, 916);
    ctx.font = '600 26px Fredoka, sans-serif'; ctx.textAlign = 'left'; ctx.fillText('Datum: ' + ({ game: d.exam.date, contest: cl.date, football: f.date, expedition: d.expeditions.date }[kind] || new Date().toLocaleDateString('de-DE')), 150, 990);
    ctx.textAlign = 'center'; ctx.font = 'bold 34px Fredoka, sans-serif'; ctx.fillStyle = '#0a4a8a'; ctx.fillText('VoytsQuest', w / 2, 1000); ctx.font = '500 18px Fredoka, sans-serif'; ctx.fillStyle = '#5a4a2a'; ctx.fillText('Lernspiele mit Abenteuer', w / 2, 1026);
    // Delfin + Siegel
    Art.drawDolphin(ctx, { x: 210, y: 300, facing: 1, color: d.color, t: 0.3, cos: Save.cosmetics(), scale: 1.6, happy: true });
    ctx.save(); ctx.translate(w - 250, 985); for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; Art.ell(ctx, Math.cos(a) * 70, Math.sin(a) * 70, 20, 20); ctx.fillStyle = '#a81a2a'; ctx.fill(); }
    Art.ell(ctx, 0, 0, 76, 76); Art.fillS(ctx, '#c8283a', 4, '#7a0a1a'); Art.ell(ctx, 0, 0, 58, 58); Art.stroke(ctx, 3, '#ffb0b0');
    ctx.font = 'bold 18px Fredoka, sans-serif'; ctx.fillStyle = '#ffe0e0'; ctx.textAlign = 'center'; ctx.fillText({ game: '8 MEERE', contest: 'SHOW', football: 'CHAMPION', expedition: 'EXPEDITION' }[kind], 0, -24); Art.drawPearl(ctx, 0, 10, 0, 18, true); ctx.restore();
    ctx.restore();
  }
  function renderCertScreen(kind) {
    const d = S(); const ok = { game: d.exam.passed, contest: !!d.contest.last, football: d.football.won.every(Boolean), expedition: d.expeditions.medals.every(m => m >= 1) }[kind];
    if (!ok) { toast('Diese Urkunde gibt es noch nicht.'); show('main'); return; }
    const title = { game: 'Deine Urkunde', contest: 'Urkunde: Muschel-Show', football: 'Urkunde: Fußball-Modus', expedition: 'Urkunde: Expeditionen' }[kind];
    const back = { game: ['worlds', '🗺 Weltkarte'], contest: ['contestpick', '🎤 Zur Show'], football: ['league', '🏟 Zur Liga'], expedition: ['expmap', '🧭 Expeditionen'] }[kind];
    ui.innerHTML = header(title) + `<div class="certwrap"><canvas id="certcv" width="1600" height="1131"></canvas>
      <div class="certside"><label class="lbl small">Dein Name (freiwillig):<input id="cn2" maxlength="30" value="${esc(d.childName)}" placeholder="Name des Kindes"></label>
      ${/claude/.test(location.hostname) && window.top !== window.self ? '<p class="note">Drucken und PDF-Export funktionieren in der veröffentlichten Version (z. B. GitHub Pages).</p>' : '<button class="btn gold" data-act="print">🖨 Drucken</button><button class="btn gold" data-act="pdf">📄 Als PDF speichern</button>'}<button class="btn" data-act="goto" data-arg="${back[0]}">${back[1]}</button></div></div>`;
    const cv = $('#certcv'); drawCertificate(cv, kind); Sound.sfx('certificate');
    $('#cn2').addEventListener('input', e => { d.childName = e.target.value.slice(0, 30); Save.save(); drawCertificate(cv, kind); });
  }
  function printCert() {
    const cv = $('#certcv'); const pa = $('#print-area'); pa.innerHTML = ''; const img = new Image(); img.src = cv.toDataURL('image/png'); pa.appendChild(img);
    img.onload = () => setTimeout(() => window.print(), 50);
  }
  function pdfCert() {
    const cv = $('#certcv'); const data = atob(cv.toDataURL('image/jpeg', 0.92).split(',')[1]); const img = new Uint8Array(data.length); for (let i = 0; i < data.length; i++) img[i] = data.charCodeAt(i);
    const enc = s => new TextEncoder().encode(s); const parts = []; const offs = []; let len = 0;
    const push = p => { const b = typeof p === 'string' ? enc(p) : p; parts.push(b); len += b.length; };
    const obj = (n, body) => { offs[n] = len; push(`${n} 0 obj\n`); body(); push('\nendobj\n'); };
    push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n'.replace(/[\u0080-ÿ]/g, 'x'));
    const PW = 842, PH = 595; const content = `q ${PW} 0 0 ${PH} 0 0 cm /Im0 Do Q`;
    obj(1, () => push('<< /Type /Catalog /Pages 2 0 R >>'));
    obj(2, () => push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>'));
    obj(3, () => push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PW} ${PH}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`));
    obj(4, () => { push(`<< /Type /XObject /Subtype /Image /Width ${cv.width} /Height ${cv.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${img.length} >>\nstream\n`); push(img); push('\nendstream'); });
    obj(5, () => push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`));
    const xref = len; let x = 'xref\n0 6\n0000000000 65535 f \n'; for (let n = 1; n <= 5; n++) x += String(offs[n]).padStart(10, '0') + ' 00000 n \n';
    push(x + `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
    const blob = new Blob(parts, { type: 'application/pdf' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'OceanQuest-Urkunde.pdf'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    toast('PDF wird heruntergeladen …');
  }
  UI._drawCertificate = drawCertificate; UI._contest = () => C;

  /* ---------- Mathe-Contest: Die große Muschel-Show ---------- */
  const LADDER = [20, 40, 70, 100, 150, 200, 300, 400, 600, 800, 1000, 1500, 2000, 3000, 5000];
  const SAFE = [4, 9];
  const HOST = {
    hello: n => `Willkommen in der großen Muschel-Show! Ich bin Otto, euer Showmaster mit acht Armen. Heute bei mir: ${n}!`,
    ask: ['Hier kommt deine erste Frage – ganz entspannt!', 'Frage 2. Das schaffst du mit links … oder mit der Flosse!', 'Weiter geht’s mit Frage 3!', 'Frage 4 – gleich kommt die erste Sicherheitsstufe!', 'Frage 5! Wer die schafft, hat 150 Coins sicher!',
      'Willkommen in der zweiten Runde! Frage 6.', 'Frage 7 – jetzt wird’s kniffliger.', 'Frage 8. Meine Arme zittern schon!', 'Frage 9. Gleich kommt Sicherheitsstufe Nummer zwei!', 'Frage 10! 800 Coins sicher – wenn du richtig liegst!',
      'Jetzt beginnt die Profi-Runde! Frage 11.', 'Frage 12. Das Publikum hält die Luft an … und das unter Wasser!', 'Frage 13. Nur noch drei!', 'Frage 14. Die vorletzte!', 'Die letzte Frage! Für 5.000 Muschel-Coins!'],
    lock: ['Ist das dein letztes Wort? … Eingeloggt!', 'Mutig! Mal sehen …', 'Hmm … spannend!', 'Eingeloggt. Trommelwirbel, bitte!'],
    right: ['RICHTIG!', 'Absolut richtig!', 'Stark gerechnet!', 'Richtig – das Publikum tobt!'],
    wrong: 'Oh nein … das war leider falsch.'
  };
  let C = null;
  function startContest() {
    closeOverlay(); mode = 'menu'; screen = 'contest'; ui.className = 'menu scr-contest'; Sound.forWorld(10);
    C = { step: 0, jokers: { fifty: true, pub: true, call: true }, locked: false, task: null, hide: [], mood: 0, talkT: 3, hostText: HOST.hello(S().name) };
    ui.innerHTML = `<div class="showroom"><div class="show-left"><div class="stagebox" id="stagebox"></div><div class="hostline" id="hostline"></div>
      <div class="qbox"><div class="qmeta" id="qmeta"></div><div class="qtext" id="qtext"></div></div><div class="answers" id="answers"></div></div>
      <div class="show-right"><div class="jokers"><button class="joker" data-j="fifty" title="Zwei falsche Antworten verschwinden">50:50</button><button class="joker" data-j="pub" title="Das Publikum stimmt ab">👥<small>Publikum</small></button><button class="joker" data-j="call" title="Frag Professor Willy">📞<small>Willy</small></button></div>
      <ol class="ladder" id="ladder"></ol><button class="btn warn small walk" id="walk"></button><button class="btn small" data-act="contestquit">✕ Show verlassen</button></div></div>`;
    $('#stagebox').appendChild(miniCanvas(870, 230, drawShow, true));
    ui.querySelectorAll('.joker').forEach(b => b.onclick = () => useJoker(b.dataset.j, b));
    $('#walk').onclick = () => { if (C.locked) return; const prize = C.step ? LADDER[C.step - 1] : 0; overlay(`<div class="panel"><h2>Aussteigen?</h2><p>Du nimmst <b>${fmt(prize)} Muschel-Coins</b> mit nach Hause.</p><div class="row"><button class="btn" data-act="closeov">Weiterspielen</button><button class="btn gold" id="walkyes">Ja, aussteigen</button></div></div>`); $('#walkyes').onclick = () => { closeOverlay(); endContest(prize, 'walk'); }; };
    document.addEventListener('keydown', contestKeys);
    setTimeout(nextQuestion, 1800); renderLadder(); setHost(C.hostText);
  }
  function contestKeys(e) {
    if (screen !== 'contest') { document.removeEventListener('keydown', contestKeys); return; }
    if ($('#overlay') && $('#overlay').style.display === 'flex') return;
    const k = { KeyA: 0, KeyB: 1, KeyC: 2, KeyD: 3, Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3 }[e.code];
    if (k !== undefined) { const b = ui.querySelectorAll('.ans')[k]; if (b && !b.disabled) b.click(); }
  }
  function setHost(text, talk) { C.hostText = text; C.talkT = talk || 2.2; const h = $('#hostline'); if (h) h.innerHTML = '<b>Otto:</b> ' + esc(text); }
  function renderLadder() {
    const ol = $('#ladder'); if (!ol) return;
    ol.innerHTML = LADDER.map((v, i) => ({ v, i })).reverse().map(({ v, i }) => `<li class="${SAFE.includes(i) ? 'safe' : ''} ${i === C.step ? 'cur' : ''} ${i < C.step ? 'done' : ''}"><span>${i + 1}</span><b>${fmt(v)}</b></li>`).join('');
    const prize = C.step ? LADDER[C.step - 1] : 0; $('#walk').textContent = `Aussteigen · ${fmt(prize)} Coins`;
  }
  function nextQuestion() {
    if (screen !== 'contest') return;
    C.task = MathGen.generateQuiz(C.step); C.locked = false; C.hide = [];
    setHost(HOST.ask[C.step]); renderLadder();
    $('#qmeta').innerHTML = `Frage ${C.step + 1} von 15 · <span class="tag">${esc(C.task.label)}</span> · für <b>${fmt(LADDER[C.step])} Coins</b>${SAFE.includes(C.step) ? ' · <span class="safetag">Sicherheitsstufe</span>' : ''}`;
    $('#qtext').innerHTML = esc(C.task.prompt).replace(/\n/g, '<br>').replace(/___/g, '<span class="gap">?</span>');
    $('#answers').innerHTML = C.task.choices.map((c, i) => `<button class="ans" data-v="${esc(c.value)}"><span class="letter">${'ABCD'[i]}</span><span class="atext">${esc(c.label)}</span></button>`).join('');
    ui.querySelectorAll('.ans').forEach(b => b.onclick = () => answer(b));
    ui.querySelectorAll('.joker').forEach(b => b.disabled = !C.jokers[b.dataset.j]);
  }
  function answer(btn) {
    if (C.locked) return; C.locked = true; btn.classList.add('sel'); Sound.sfx('lock');
    ui.querySelectorAll('.joker').forEach(b => b.disabled = true);
    setHost(HOST.lock[Math.floor(Math.random() * HOST.lock.length)]);
    setTimeout(() => {
      if (screen !== 'contest') return;
      const ok = MathGen.check(C.task, btn.dataset.v);
      const right = [...ui.querySelectorAll('.ans')].find(b => MathGen.check(C.task, b.dataset.v));
      right.classList.add('ok');
      if (ok) {
        Sound.sfx('correct'); C.mood = 2; C.step++; renderLadder();
        if (C.step >= 15) { setHost('UNGLAUBLICH! Alle 15 Fragen richtig!', 4); Sound.sfx('certificate'); setTimeout(() => endContest(LADDER[14], 'win'), 1800); return; }
        setHost(HOST.right[Math.floor(Math.random() * HOST.right.length)] + (SAFE.includes(C.step - 1) ? ` ${fmt(LADDER[C.step - 1])} Coins sind dir sicher!` : ''));
        setTimeout(nextQuestion, 1900);
      } else {
        btn.classList.remove('sel'); btn.classList.add('bad'); Sound.sfx('wrong'); C.mood = -2;
        let safe = 0; SAFE.forEach(i => { if (C.step > i) safe = LADDER[i]; });
        setHost(HOST.wrong + ` Richtig war ${right.querySelector('.letter').textContent}.`, 3);
        setTimeout(() => endContest(safe, 'wrong'), 2600);
      }
    }, 1500);
  }
  function useJoker(j, btn) {
    if (!C.jokers[j] || C.locked || !C.task) return; C.jokers[j] = false; btn.disabled = true; btn.classList.add('used'); Sound.sfx('switch');
    const buttons = [...ui.querySelectorAll('.ans')]; const correctIdx = buttons.findIndex(b => MathGen.check(C.task, b.dataset.v));
    if (j === 'fifty') {
      const wrong = buttons.map((b, i) => i).filter(i => i !== correctIdx).sort(() => Math.random() - 0.5).slice(0, 2);
      wrong.forEach(i => { buttons[i].classList.add('gone'); buttons[i].disabled = true; }); C.hide = wrong;
      setHost('50:50! Zwei falsche Antworten sind verschwunden.');
    } else if (j === 'pub') {
      const open = buttons.map((b, i) => i).filter(i => !C.hide.includes(i));
      const sure = Math.max(0.3, 0.78 - C.step * 0.035); let fav = correctIdx;
      if (C.step >= 11 && Math.random() < 0.2) fav = open.filter(i => i !== correctIdx)[0];
      const raw = open.map(i => ({ i, v: i === fav ? sure * 100 : Math.random() * (100 - sure * 100) / open.length + 4 }));
      const sum = raw.reduce((a, r) => a + r.v, 0); const pct = raw.map(r => ({ i: r.i, p: Math.round(r.v / sum * 100) }));
      overlay(`<div class="panel pubpanel"><h2>👥 Das Publikum hat abgestimmt</h2><div class="bars">${[0, 1, 2, 3].map(i => { const r = pct.find(x => x.i === i); const p = r ? r.p : 0; return `<div class="bar"><div class="bfill" style="height:${p * 2}px"></div><b>${p}%</b><span>${'ABCD'[i]}</span></div>`; }).join('')}</div><p class="note">Krabben, Fische und Quallen haben abgestimmt – sie können sich aber auch irren!</p><div class="row"><button class="btn gold" data-act="closeov" data-default>Danke!</button></div></div>`);
      setHost('Das Publikum hat gesprochen!');
    } else {
      const sure = C.step < 6 ? 0.95 : C.step < 11 ? 0.8 : 0.65; const guess = Math.random() < sure ? correctIdx : buttons.map((b, i) => i).filter(i => i !== correctIdx && !C.hide.includes(i))[0];
      const L2 = 'ABCD'[guess]; const conf = sure > 0.9 ? `Ganz klar: <b>${L2}</b>! Da bin ich mir so sicher wie meine Brille auf meiner Nase sitzt.` : sure > 0.7 ? `Ich glaube, es ist <b>${L2}</b>. Ziemlich sicher … glaube ich.` : `Puh, schwierig! Vielleicht <b>${L2}</b>? Aber meine Brille ist beschlagen …`;
      overlay(`<div class="panel callpanel"><h2>📞 Anruf bei Professor Willy</h2><div class="callrow"><div id="willycv"></div><div><p>„Hallo ${esc(S().name)}! Lass mich nachdenken …“</p><p>„${conf}“</p><p class="note">${esc(C.task.hint)}</p></div></div><div class="row"><button class="btn gold" data-act="closeov" data-default>Danke, Willy!</button></div></div>`);
      $('#willycv').appendChild(bossCanvas('willy', 170, 150, 0.45)); setHost('Willy ist am Telefon!');
    }
  }
  function endContest(prize, how) {
    if (screen !== 'contest') return; const d = S();
    d.coins += prize; d.contest.played++; d.contest.best = Math.max(d.contest.best, C.step); d.contest.won += prize;
    d.contest.last = { step: C.step, prize, how, jokers: Object.values(C.jokers).filter(v => !v).length, date: new Date().toLocaleDateString('de-DE') }; Save.save();
    if (prize > 0) Sound.sfx(how === 'win' ? 'certificate' : 'buy');
    const title = how === 'win' ? '🏆 Muschel-Millionär!' : how === 'walk' ? '👏 Klug ausgestiegen!' : '😮 Schade!';
    const text = how === 'win' ? 'Du hast alle 15 Fragen richtig beantwortet. Das gelingt nur den Besten!' : how === 'walk' ? `Du hast ${C.step} von 15 Fragen geschafft und sicherst dir deinen Gewinn.` : `Du hast ${C.step} Frage${C.step === 1 ? '' : 'n'} richtig beantwortet.${prize ? ' Dank der Sicherheitsstufe gehst du trotzdem nicht leer aus.' : ' Beim nächsten Mal klappt’s bestimmt!'}`;
    overlay(`<div class="panel results"><h2>${title}</h2><p>${text}</p><div class="bignum"><span class="shell-ico big"></span>+${fmt(prize)}</div><p>Neuer Kontostand von <b>${esc(d.name)}</b>: <b>${fmt(d.coins)} Muschel-Coins</b></p>
      <div class="row"><button class="btn gold big" data-act="contestgo" data-arg="${Save.active}" data-default>🎤 Nochmal spielen</button><button class="btn" data-act="cert" data-arg="contest">📜 Urkunde</button><button class="btn" data-act="goto" data-arg="shop">🐚 Zum Shop</button><button class="btn" data-act="contestquit">🏠 Menü</button></div></div>`);
    if (how === 'win') confetti();
  }
  function drawShow(ctx, t) {
    const W = 870, H = 230; if (!C) return;
    C.talkT -= 1 / 60; C.mood *= 0.99;
    const g = ctx.createRadialGradient(W / 2, H * 1.1, 40, W / 2, H / 2, W * 0.7); g.addColorStop(0, '#2a4ab8'); g.addColorStop(0.6, '#141a5a'); g.addColorStop(1, '#070a26'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 5; i++) { const a = Math.sin(t * 0.7 + i * 1.3) * 0.5; ctx.save(); ctx.translate(120 + i * 160, -10); ctx.rotate(a); const gg = ctx.createLinearGradient(0, 0, 0, 260); gg.addColorStop(0, ['rgba(120,200,255,0.35)', 'rgba(255,200,90,0.3)', 'rgba(200,120,255,0.3)'][i % 3]); gg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gg; ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(8, 0); ctx.lineTo(60, 260); ctx.lineTo(-60, 260); ctx.fill(); ctx.restore(); }
    ctx.restore();
    ctx.font = 'bold 26px Fredoka, sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 6; ctx.strokeStyle = '#0a1040'; ctx.strokeText('DIE GROSSE MUSCHEL-SHOW', W / 2, 34); const tg = ctx.createLinearGradient(0, 12, 0, 40); tg.addColorStop(0, '#fff4b0'); tg.addColorStop(1, '#ffb020'); ctx.fillStyle = tg; ctx.fillText('DIE GROSSE MUSCHEL-SHOW', W / 2, 34);
    for (let i = 0; i < 26; i++) { const x = 15 + i * 34; ctx.fillStyle = `rgba(255,${200 + (i % 3) * 20},120,${0.5 + 0.5 * Math.sin(t * 6 + i)})`; ctx.beginPath(); ctx.arc(x, 50, 3, 0, 7); ctx.fill(); }
    Art.ell(ctx, W / 2, H - 10, W * 0.48, 34); ctx.fillStyle = 'rgba(120,180,255,0.18)'; ctx.fill();
    // Showmaster Otto
    Art.drawBoss(ctx, 'otto', 190, 120, 0.42, { t, talk: C.talkT > 0 });
    // Podium + Delfin
    const px = 650; Art.rr(ctx, px - 70, 150, 140, 80, 12); const pg = ctx.createLinearGradient(0, 150, 0, 230); pg.addColorStop(0, '#3a5ad8'); pg.addColorStop(1, '#1a2a7a'); Art.fillS(ctx, pg, 4, '#ffcc4a');
    ctx.font = 'bold 18px Fredoka, sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText(S().name, px, 196);
    const hop = C.mood > 0.3 ? Math.abs(Math.sin(t * 8)) * 16 * Math.min(1, C.mood) : 0;
    const cos = Save.cosmetics(); if (cos.companion) Art.drawCompanion(ctx, cos.companion, px + 110, 150, t, -1);
    Art.drawDolphin(ctx, { x: px, y: 110 - hop, facing: -1, color: S().color, t, cos, scale: 1.15, speed: 0.3, happy: C.mood > 0.3, hurt: C.mood < -0.5 && Math.floor(t * 3) % 2 === 0 });
    // Publikum
    const kinds = ['begleiter-ente', 'begleiter-krabbe', 'begleiter-kugelfisch', 'begleiter-seepferdchen', 'schildkroete', 'begleiter-krake'];
    ctx.globalAlpha = 0.85; for (let i = 0; i < 13; i++) { const x = 30 + i * 68, y = 224 - (C.mood > 0.3 ? Math.abs(Math.sin(t * 9 + i)) * 10 : 0); if (x > 300 && x < 560) continue; Art.drawCompanion(ctx, kinds[i % kinds.length], x, y, t + i, i % 2 ? 1 : -1); } ctx.globalAlpha = 1;
  }

  /* ---------- Fußball-Modus: Liga durch alle 8 Stadien ---------- */
  let footIdx = null;
  const STADIUMS = ['Willys Korallen-Arena', 'Timmys Wrack-Stadion', 'Günthers Eis-Arena', 'Bobs Dschungel-Kessel', 'Lamas Tempel-Stadion', 'Ottos Tintenfass-Arena', 'Herberts Leucht-Stadion', 'Mbappés Vulkan-Arena'];
  const REWARDS = { 1: 'goldbrille', 3: 'goldkette', 5: 'begleiter-fussballfisch', 7: 'trikot-winner' };
  const BOSS_SCALE = { willy: 0.3, timmy: 0.28, guenther: 0.26, bob: 0.42, lama: 0.26, otto: 0.28, herbert: 0.28, mbappe: 0.3 };
  const FOOT_TAUNTS = {
    willy: { ai: ['Tor! Ich hab’s genau gesehen – mit Brille!', 'Ein Professoren-Schuss, ganz klar!'], player: ['Moment … wo ist der Ball? Ach, im Tor.', 'Meine Brille war beschlagen!'], lose: 'Ein Professor gewinnt eben immer! Fast immer.', win: 'Gratuliere! Du spielst besser, als ich rechne.' },
    timmy: { ai: ['Arrr! Volltreffer!', 'Das war ein echter Piratenschuss!'], player: ['Ein Seestern hat mich abgelenkt!', 'Arrr … gut geschossen.'], lose: 'Der Pokal gehört mir, harr harr!', win: 'Ich ergebe mich! Aber nur im Fußball.' },
    guenther: { ai: ['Ein Tor mit dreifachem Salto!', 'Eleganz pur!'], player: ['Ich bin ausgerutscht!', 'Brrr, das war eiskalt!'], lose: 'Bestnote für meine Fußball-Kür!', win: 'Bravo! Das war eine Kür mit Bestnote.' },
    bob: { ai: ['Klein, aber TOR!', 'Mein riesiges Gehirn hat das berechnet!'], player: ['Grrr! Meine Zähne klappern!', 'Das war … beeindruckend.'], lose: 'Klein, aber unschlagbar!', win: 'Okay, okay! Du bist besser. Ein bisschen.' },
    lama: { ai: ['Als König befehle ich: Tor!', 'Ein königlicher Schuss!'], player: ['Moment, für wen spiele ich nochmal?', 'Meine Krone wackelt!'], lose: 'Der König gewinnt! … Oder? Ja!', win: 'Ich befehle dir … den Pokal zu nehmen!' },
    otto: { ai: ['Acht Arme, ein Tor!', 'Mit dem dritten Arm von links!'], player: ['Ich hab mich verknotet!', 'Arm fünf hat geschlafen!'], lose: 'Acht Arme sind eben besser als zwei Flossen!', win: 'Du hast mich entknotet – Glückwunsch!' },
    herbert: { ai: ['Tor! Hast du’s gesehen? Ich auch nicht!', 'Da ist mir ein Licht aufgegangen!'], player: ['Wer hat das Licht ausgemacht?', 'Uff, das hat meine Lampe getroffen!'], lose: 'Ich bin eben ein helles Köpfchen!', win: 'Du bist der hellste Stern der Tiefsee!' },
    mbappe: { ai: ['Tooor! Unbesiegbar!', 'Megalodon-Power!'], player: ['Mein T-Shirt ist schuld!', 'Glück gehabt! Nochmal schaffst du das nicht!'], lose: 'Der König der Tiefsee bleibt ungeschlagen!', win: 'Unglaublich – du bist der Fußball-Meister der acht Meere!' }
  };
  function footballOpen() { const d = S(); return d.created && d.exam.passed && d.contest.best >= 5; }
  function itemIcon(id, w, h) { return miniCanvas(w || 120, h || 70, (ctx, t) => Art.drawItemIcon(ctx, id, (w || 120) / 2, (h || 70) / 2 + 4, (w || 120) / 150, t), true); }
  function startWarmup(i) {
    if (!footballOpen()) { act('football'); return; }
    const f = S().football; if (i > 0 && !f.won[i - 1]) { toast('Gewinne zuerst im vorherigen Stadion!'); return; }
    closeOverlay(); Finale.stop(); mode = 'menu'; screen = 'warmup'; ui.className = 'menu scr-warmup'; footIdx = i;
    const W = WORLDS[i]; let k = 0, right = 0;
    const draw = () => {
      const t = MathGen.generate(W.id); let tries = 0;
      ui.innerHTML = header('Aufwärmen: ' + STADIUMS[i], `Löse 3 Aufgaben – dann geht’s aufs Feld gegen ${W.bossName}!`) + `<div class="panel warmpanel"><div class="mp-head"><span class="tag">${esc(t.label)}</span><span class="progress">Aufgabe ${k + 1} von 3 · richtig: <b>${right}</b> · je +50 Coins</span></div><div class="task"></div><div class="fb" aria-live="polite"></div></div>`;
      let sub; const api = renderTask(ui.querySelector('.task'), t, sub = (input, api) => {
        const fb = ui.querySelector('.fb');
        const go = () => { Sound.sfx('click'); k++; if (k < 3) draw(); else { const d = S(); d.football.tasks += 3; d.football.tasksRight += right; Save.save(); startLeagueMatch(i); } };
        const label = k < 2 ? 'Nächste Aufgabe ▶' : '⚽ Aufs Spielfeld!';
        if (MathGen.check(t, input)) {
          if (tries === 0) { right++; S().coins += 50; S().football.points += 100; Save.save(); }
          Sound.sfx('correct'); api.lock(true); fb.className = 'fb ok'; fb.innerHTML = `✔ Richtig!${tries === 0 ? ' <b>+50 Coins</b>' : ''} <button class="btn small gold" data-default id="nx">${label}</button>`; fb.querySelector('#nx').onclick = go;
        } else {
          tries++; Sound.sfx('wrong');
          if (tries < 2) { fb.className = 'fb bad'; fb.innerHTML = `✘ Noch nicht. <span class="hint">${esc(t.hint)}</span>`; api.reset(); }
          else { api.lock(true); fb.className = 'fb bad'; fb.innerHTML = `${esc(t.solution)} <button class="btn small" data-default id="nx">${label}</button>`; fb.querySelector('#nx').onclick = go; }
        }
      });
      UI._cur = { task: t, solve: () => sub(answerOf(t), api) };
    };
    Sound.forWorld(W.id); draw();
  }
  function startLeagueMatch(i) {
    const W = WORLDS[i]; footIdx = i; duelOn = false;
    closeOverlay(); mode = 'finale'; screen = 'finale'; ui.innerHTML = ''; ui.className = 'ingame';
    const kinds = W.enemies.filter(e => ['fish', 'jelly', 'puffer', 'crab', 'piranha', 'inkpus', 'lantern'].includes(e)).concat(['begleiter-ente', 'schildkroete', 'begleiter-krabbe', 'begleiter-seepferdchen']);
    Finale.start((won, score) => leagueEnd(i, won, score), { boss: W.boss, name: W.bossName, win: 3, ai: 250 + i * 15, scale: BOSS_SCALE[W.boss], theme: W.theme, stadium: STADIUMS[i].toUpperCase(), taunts: FOOT_TAUNTS[W.boss], vip: false, kinds, track: W.id });
    overlay(`<div class="panel"><h2>⚽ ${STADIUMS[i]}</h2><div id="vsrow" class="vsrow"></div><p>Heute gegen <b>${W.bossName}</b>! Wer zuerst <b>3 Tore</b> schießt, gewinnt.<br>Steuerung: Pfeiltasten / WASD oder mit dem Finger ziehen, Leertaste = Sprint.</p><div class="row"><button class="btn big gold" data-act="kickoff" data-default>Anpfiff! ▶</button></div></div>`);
    $('#vsrow').appendChild(miniCanvas(420, 120, (ctx, t) => { Art.drawDolphin(ctx, { x: 100, y: 64, facing: 1, color: S().color, t, cos: Save.cosmetics(), scale: 1, speed: 0.4 }); ctx.font = 'bold 34px Fredoka, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#7a4a10'; ctx.fillText('VS', 210, 74); ctx.save(); ctx.translate(320, 66); ctx.scale(-1, 1); Art.drawBoss(ctx, W.boss, 0, 0, BOSS_SCALE[W.boss] * 0.9, { t }); ctx.restore(); }, true));
  }
  function leagueEnd(i, won, score) {
    const d = S(), f = d.football, W = WORLDS[i]; const [g, a] = score.split(':').map(Number);
    f.goals += g; f.against += a; f.points += g * 50;
    let rewardHtml = '', rid = null;
    if (won) {
      const first = !f.won[i]; f.won[i] = true; f.scores[i] = score; f.points += 500; d.coins += 200;
      rid = REWARDS[i]; if (rid && !d.owned.includes(rid)) d.owned.push(rid); else rid = null;
      if (f.won.every(Boolean) && !f.date) f.date = new Date().toLocaleDateString('de-DE');
      if (rid) { const it = Save.ITEMS.find(x => x.id === rid); rewardHtml = `<div class="rewardbox"><div id="rwcv"></div><div><b>Neues Item gewonnen:</b><br>${esc(it.name)}<br><button class="btn small gold" data-act="equip" data-arg="${rid}">Jetzt anlegen</button></div></div>`; Sound.sfx('unlock'); }
    }
    Save.save();
    const all = f.won.every(Boolean);
    overlay(`<div class="panel results"><h2>${won ? '🏆 Sieg gegen ' + W.bossName + '!' : W.bossName + ' gewinnt …'}</h2><div class="bignum">${score}</div>
      <p>${won ? '+200 Muschel-Coins' + (all ? ' · <b>Alle 8 Stadien gewonnen!</b>' : '') : 'Knapp! Probier’s nochmal – mit 3 neuen Aufwärm-Aufgaben.'}</p>${rewardHtml}
      <div class="row">${won ? (all ? '<button class="btn big gold" data-act="cert" data-arg="football" data-default>📜 Fußball-Urkunde</button>' : i < 7 ? `<button class="btn big gold" data-act="leaguego" data-arg="${i + 1}" data-default>Nächstes Stadion ▶</button>` : '') : `<button class="btn big gold" data-act="leaguego" data-arg="${i}" data-default>⟲ Revanche</button>`}<button class="btn" data-act="leaguequit">🏟 Zur Liga</button></div></div>`);
    if (rid) $('#rwcv').appendChild(itemIcon(rid, 150, 90));
    if (won) confetti();
  }

  /* ---------- Fußball-Duell: 2 Spieler an einem Gerät ---------- */
  let duelOn = false; const DUEL = { p1: 0, p2: null, win: 5 };
  function duelOpen() { const d = S(); return d.created && d.football.won.every(Boolean); }
  function duelFigs() {
    const list = [];
    Save.slots.forEach(d => { if (d) list.push({ kind: 'dolphin', name: d.name, color: d.color, cos: Object.assign({}, d.equipped, { companion: null }) }); });
    WORLDS.forEach(W => list.push({ kind: 'boss', id: W.boss, name: W.bossName, scale: BOSS_SCALE[W.boss] }));
    return list;
  }
  function updateDuelBar() { const figs = duelFigs(), el = $('#duelvs'); if (el) el.innerHTML = `<b class="c1">${esc(figs[DUEL.p1].name)}</b> gegen <b class="c2">${esc(figs[DUEL.p2].name)}</b>`; }
  function startDuel() {
    if (!duelOpen()) { act('duel'); return; }
    const figs = duelFigs(); const p1 = figs[DUEL.p1], p2 = figs[DUEL.p2 === null ? figs.length - 1 : DUEL.p2];
    const n1 = p1.name, n2 = p2.name === p1.name ? p2.name + ' 2' : p2.name;
    closeOverlay(); footIdx = null; duelOn = true; mode = 'finale'; screen = 'finale'; ui.innerHTML = ''; ui.className = 'ingame';
    Finale.start((won, score) => {
      const winner = won ? n1 : n2; const [a, b] = score.split(':');
      overlay(`<div class="panel results"><h2>🏆 ${esc(winner)} gewinnt!</h2><div class="bignum">${a}:${b}</div><p><b>${esc(n1)}</b> gegen <b>${esc(n2)}</b></p>
        <div class="row"><button class="btn big gold" data-act="duelgo" data-default>⟲ Revanche</button><button class="btn" data-act="duelquit">🔄 Figuren wechseln</button><button class="btn" data-act="contestquit">🏠 Menü</button></div></div>`);
      confetti();
    }, { duel: { p1: Object.assign({}, p1, { name: n1 }), p2: Object.assign({}, p2, { name: n2 }) }, name: n2, win: DUEL.win, stadium: 'OCEANQUEST DUELL · VOYTSQUEST', vip: false, taunts: { ai: [n2 + ' trifft!'], player: [n1 + ' trifft!'], win: n1 + ' gewinnt das Duell!', lose: n2 + ' gewinnt das Duell!' }, track: 9 });
    overlay(`<div class="panel"><h2>🤝 Fußball-Duell</h2><p><b class="c1">${esc(n1)}</b> gegen <b class="c2">${esc(n2)}</b> · wer zuerst <b>${DUEL.win} Tore</b> schießt, gewinnt.</p>
      <table class="keys"><tr><td><b class="c1">Spieler 1 (links)</b></td><td><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> schwimmen · <kbd class="wide2">Leertaste</kbd> Sprint</td></tr><tr><td><b class="c2">Spieler 2 (rechts)</b></td><td><kbd>↑</kbd><kbd>←</kbd><kbd>↓</kbd><kbd>→</kbd> schwimmen · <kbd class="wide2">Enter</kbd> Sprint</td></tr><tr><td>👆 iPad</td><td>Jeder zieht mit dem Finger auf seiner Hälfte</td></tr></table>
      <div class="row"><button class="btn big gold" data-act="kickoff" data-default>Anpfiff! ▶</button></div></div>`);
  }

  /* ---------- Expeditionen ---------- */
  function startExpedition(id) {
    if (!duelOpen()) { act('expeditions'); return; }
    closeOverlay(); Game.stop(); Finale.stop(); mode = 'expedition'; screen = 'expedition'; ui.innerHTML = ''; ui.className = 'ingame';
    Expedition.start(id); Expedition.paused = true; Expedition.X.intro = true; const D = Expedition.X.def;
    const extra = { haijagd: 'Bruno schwimmt dir hinterher! Bleib in Bewegung und schwimm durch das Tor, dessen Zahl die Frage oben beantwortet. Vor jedem Tor wird es langsamer.', riff: 'Keine Eile: Erkunde alles in Ruhe. Rissige Korallenwände kannst du mit dem Flossenschlag aufbrechen. Unten rechts siehst du die Karte. Schwimm zum Boot, um die Expedition zu beenden.', tauchgang: 'Behalte die Sauerstoffanzeige im Blick! Luftblasen aus den Schloten geben Luft. An Luftstationen löst du eine Sachaufgabe – das Spiel pausiert dabei.', vulkan: 'Schwimm schnell nach oben! Felsbrocken schiebst du mit dem Flossenschlag weg. Bei der Klappe müssen beide Schalter gleichzeitig leuchten. Lava-Schlösser öffnest du mit einer Aufgabe – dabei pausiert die Lava.', rettung: 'Schwimm zu den Knoten der Netze und benutze den Flossenschlag – jeder Knoten ist eine Aufgabe. Danach holst du Tilda ab: Sie folgt dir, wenn du in ihrer Nähe bleibst. Beschütze sie vor Krabben und Piranhas!' }[id];
    overlay(`<div class="panel expintro"><h2>${D.icon} ${D.name}</h2><p>${extra}</p>
      <table class="keys"><tr><td><kbd>↑</kbd><kbd>←</kbd><kbd>↓</kbd><kbd>→</kbd></td><td>schwimmen</td></tr><tr><td><kbd class="wide2">Leertaste</kbd></td><td>Flossenschlag</td></tr><tr><td><kbd class="wide2">Umschalt</kbd> / <kbd>K</kbd></td><td><b>Dash</b> – kurzer Sprint, kurz unverwundbar</td></tr><tr><td>🌿 Seegras</td><td>Langsam hineinschwimmen = versteckt vor Jägern</td></tr></table>
      <p class="note">Medaillen: 🥉 ${esc(D.medals[0])} · 🥈 ${esc(D.medals[1])} · 🥇 ${esc(D.medals[2])}</p>
      <div class="row"><button class="btn big gold" data-act="expgo" data-default>Los geht’s! ▶</button></div></div>`);
  }
  function mathModal(task, done) {
    let tries = 0;
    const o = overlay(`<div class="panel mathmodal"><div class="mp-head"><span class="tag">${esc(task.label)}</span><span class="progress">Das Spiel ist pausiert – nimm dir Zeit!</span></div><div class="task"></div><div class="fb" aria-live="polite"></div></div>`);
    let sub; const api = renderTask(o.querySelector('.task'), task, sub = (input, api) => {
      const fb = o.querySelector('.fb'); const fin = first => { const b = fb.querySelector('#nx'); b.onclick = () => { Sound.sfx('click'); closeOverlay(); done(first); }; };
      if (MathGen.check(task, input)) { Sound.sfx('correct'); api.lock(true); fb.className = 'fb ok'; fb.innerHTML = `✔ Richtig! <button class="btn small gold" data-default id="nx">Weiter ▶</button>`; fin(tries === 0); }
      else { tries++; Sound.sfx('wrong'); if (tries < 2) { fb.className = 'fb bad'; fb.innerHTML = `✘ Noch nicht. <span class="hint">${esc(task.hint)}</span>`; api.reset(); } else { api.lock(true); fb.className = 'fb bad'; fb.innerHTML = `${esc(task.solution)} <button class="btn small" data-default id="nx">Weiter ▶</button>`; fin(false); } }
    });
    UI._cur = { task, solve: () => sub(answerOf(task), api) };
  }
  function grantReward(id) { const d = S(); if (id && !d.owned.includes(id)) { d.owned.push(id); return true; } return false; }
  function rewardBox(id) { const it = Save.ITEMS.find(x => x.id === id); return `<div class="rewardbox"><div id="rwcv"></div><div><b>Neues Item gewonnen:</b><br>${esc(it.name)}<br><button class="btn small gold" data-act="equip" data-arg="${id}">Jetzt anlegen</button></div></div>`; }
  function expFinish(res) {
    const d = S(), e = d.expeditions, i = Expedition.DEFS.findIndex(D => D.id === res.id), D = Expedition.DEFS[i];
    const before = e.medals[i]; e.medals[i] = Math.max(before, res.medal); d.coins += res.coins;
    if (res.lexicon) res.lexicon.forEach(id => { if (!e.lexicon.includes(id)) e.lexicon.push(id); });
    const newItem = grantReward(D.reward) ? D.reward : null;
    if (e.medals.every(m => m >= 1) && !e.date) e.date = new Date().toLocaleDateString('de-DE');
    Save.save();
    const MED = ['', '🥉 Bronze', '🥈 Silber', '🥇 Gold'];
    overlay(`<div class="panel results"><h2>${D.icon} ${D.name} geschafft!</h2><div class="bigmedal">${MED[res.medal]}</div>${res.medal > before && before ? '<p><b>Neue Bestleistung!</b></p>' : ''}
      <table class="rt">${res.lines.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join('')}<tr class="tot"><td>Muschel-Coins</td><td>+${fmt(res.coins)}</td></tr></table>
      ${res.medal < 3 ? `<p class="note">Für ${MED[res.medal + 1]}: ${esc(D.medals[res.medal])}</p>` : ''}${newItem ? rewardBox(newItem) : ''}
      <div class="row"><button class="btn big gold" data-act="expquit" data-default>🧭 Zur Expeditionskarte</button><button class="btn" data-act="expstart" data-arg="${D.id}">⟲ Nochmal</button>${e.medals.every(m => m >= 1) ? '<button class="btn" data-act="cert" data-arg="expedition">📜 Urkunde</button>' : ''}</div></div>`);
    if (newItem) $('#rwcv').appendChild(itemIcon(newItem, 150, 90));
    confetti();
  }
  function nightmareResult(st) {
    const d = S(), e = d.expeditions, w = st.world; const first = !e.nightmare[w - 1]; e.nightmare[w - 1] = true;
    const n = e.nightmare.filter(Boolean).length; const medal = n >= 8 ? 3 : n >= 5 ? 2 : n >= 2 ? 1 : 0; const i = 5; e.medals[i] = Math.max(e.medals[i], medal);
    d.coins += 300; const newItem = medal >= 1 ? (grantReward('trikot-expedition') ? 'trikot-expedition' : null) : null;
    if (e.medals.every(m => m >= 1) && !e.date) e.date = new Date().toLocaleDateString('de-DE'); Save.save();
    const nextW = WORLDS.find(W => !e.nightmare[W.id - 1]);
    overlay(`<div class="panel results"><h2>💀 Albtraum-${WORLDS[w - 1].short} geschafft!</h2><p>${first ? 'Unglaublich – mit nur einem Herz!' : 'Wieder geschafft!'} <b>+300 Coins</b></p><p>Albtraum-Welten: <b>${n} von 8</b> ${medal ? '· Medaille: ' + ['', '🥉', '🥈', '🥇'][medal] : '(🥉 ab 2 Welten)'}</p>${newItem ? rewardBox(newItem) : ''}
      <div class="row">${nextW ? `<button class="btn big gold" data-act="nightplay" data-arg="${nextW.id}" data-default>Nächster Albtraum ▶</button>` : ''}<button class="btn" data-act="quit">💀 Zur Albtraum-Auswahl</button></div></div>`);
    if (newItem) $('#rwcv').appendChild(itemIcon(newItem, 150, 90));
    confetti();
  }
  Expedition.hooks = {
    math: mathModal, toast,
    fact: (c, count, done) => { const o = overlay(`<div class="panel factpanel"><h2>📖 Neu im Lexikon: ${esc(c.name)}</h2><div id="factcv"></div><p class="fact">${esc(c.fact)}</p><p class="note">${count} von 12 Meerestieren entdeckt</p><div class="row"><button class="btn gold" id="factok" data-default>Weiter erkunden ▶</button></div></div>`); $('#factcv').appendChild(miniCanvas(260, 120, (ctx, t) => ExpeditionArt.drawCreature(ctx, c.id, 130, 64, t, 2.2), true)); $('#factok').onclick = () => { Sound.sfx('click'); closeOverlay(); done(); }; },
    confirm: (text, yesL, noL, done) => { overlay(`<div class="panel"><h2>⚓ Zurück am Boot</h2><p>${esc(text)}</p><div class="row"><button class="btn" id="cfno">${esc(noL)}</button><button class="btn gold" id="cfyes" data-default>${esc(yesL)}</button></div></div>`); $('#cfyes').onclick = () => { closeOverlay(); done(true); }; $('#cfno').onclick = () => { closeOverlay(); done(false); }; },
    finish: res => expFinish(res)
  };

  /* ---------- Menü-Hintergrund ---------- */
  let mt = 0;
  function renderMenuScene(ctx, dt) {
    mt += dt; tickAnims(mt);
    const th = WORLDS[0].theme; if (!menuBg) menuBg = Art.buildBackground(th, 1080);
    const g = ctx.createLinearGradient(0, 0, 0, 720); g.addColorStop(0, th.top); g.addColorStop(1, th.bottom); ctx.fillStyle = g; ctx.fillRect(0, 0, 1280, 720);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 6; i++) { const bx = i * 240 - 100 + Math.sin(mt * 0.3 + i) * 30; const gg = ctx.createLinearGradient(0, 0, 0, 650); gg.addColorStop(0, `rgba(255,255,230,${0.12 + 0.05 * Math.sin(mt + i)})`); gg.addColorStop(1, 'rgba(255,255,230,0)'); ctx.fillStyle = gg; ctx.beginPath(); ctx.moveTo(bx, 0); ctx.lineTo(bx + 80, 0); ctx.lineTo(bx + 260, 720); ctx.lineTo(bx + 110, 720); ctx.fill(); }
    ctx.restore();
    const off = -(mt * 20) % 2048; ctx.globalAlpha = 0.8; ctx.drawImage(menuBg.far, off, -300); ctx.drawImage(menuBg.far, off + 2048, -300); ctx.globalAlpha = 0.9;
    const off2 = -(mt * 45) % 2048; ctx.drawImage(menuBg.mid, off2, -340); ctx.drawImage(menuBg.mid, off2 + 2048, -340); ctx.globalAlpha = 1;
    // Säulen & Truhe
    for (const x of [70, 1180]) { Art.rr(ctx, x - 30, 360, 60, 360, 6); Art.fillS(ctx, '#9ab0b8', 4, '#3a5058'); for (let y = 380; y < 720; y += 36) { ctx.beginPath(); ctx.moveTo(x - 30, y); ctx.lineTo(x + 30, y); Art.stroke(ctx, 2, 'rgba(40,60,70,0.4)'); } Art.rr(ctx, x - 44, 344, 88, 26, 6); Art.fillS(ctx, '#aac0c8', 4, '#3a5058'); }
    ctx.fillStyle = '#e8cf9a'; ctx.beginPath(); ctx.moveTo(0, 720); for (let x = 0; x <= 1280; x += 40) ctx.lineTo(x, 690 + Math.sin(x * 0.02) * 8); ctx.lineTo(1280, 720); ctx.fill();
    for (let i = 0; i < 26; i++) { const x = i * 52 + 10; ctx.beginPath(); ctx.moveTo(x, 705); for (let k = 1; k <= 5; k++) ctx.lineTo(x + Math.sin(mt * 1.5 + i + k * 0.6) * k * 3, 705 - k * (16 + (i * 7) % 18)); ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.strokeStyle = i % 3 ? '#3aa84a' : '#e8608a'; ctx.stroke(); }
    Art.drawChest(ctx, 1040, 668, true, mt);
    const s = screen === 'main' ? 1 : 0.0;
    if (s) { const x = 640 + Math.sin(mt * 0.5) * 420, y = 520 + Math.sin(mt * 1.1) * 60; const f = Math.cos(mt * 0.5) > 0 ? 1 : -1; Art.drawDolphin(ctx, { x, y, facing: f, angle: Math.cos(mt * 1.1) * 0.25 * f, color: S().color, t: mt, cos: Save.cosmetics(), scale: 1.5, speed: 0.6 }); }
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1.5;
    for (let i = 0; i < 30; i++) { const px = (i * 173) % 1280 + Math.sin(mt + i) * 8, py = 720 - ((mt * (25 + i % 6 * 9) + i * 97) % 760); ctx.beginPath(); ctx.arc(px, py, 2 + i % 5, 0, 7); ctx.stroke(); }
    ctx.fillStyle = 'rgba(4,20,45,0.25)'; ctx.fillRect(0, 0, 1280, 720);
  }

  root.UI = UI;
})(window);
