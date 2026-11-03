/* OceanQuest – Mathematikgenerator (UI-unabhängig, in Node testbar)
 * Jede Aufgabe: { topic, label, format, prompt, answer, choices?, items?, pyramid?, hint, solution, expr? }
 * Formate: 'choice' | 'input' | 'order' | 'brackets' | 'pyramid'
 */
(function (root) {
  'use strict';
  const M = '−', T = '·';
  let rnd = Math.random;
  const R = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const pick = a => a[Math.floor(rnd() * a.length)];
  const shuffle = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const fmt = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const tens = n => n - (n % 10);

  const LABELS = {
    add: 'Addition', sub: 'Subtraktion', times: 'Kleines Einmaleins', missing: 'Fehlende Zahl',
    clever: 'Geschicktes Rechnen', laws: 'Rechengesetze', brackets: 'Klammerregeln', order: 'Rechenreihenfolge',
    place: 'Klammern setzen', word: 'Sachaufgabe', riddle: 'Zahlenrätsel', term: 'Rechenausdrücke',
    pyramid: 'Zahlenpyramide', sequence: 'Zahlenfolge', estimate: 'Überschlagen', sort: 'Ordnen'
  };

  function numChoices(ans, extra) {
    const seen = new Set([ans]); const out = [];
    const add = v => { if (Number.isInteger(v) && v >= 0 && !seen.has(v)) { seen.add(v); out.push(v); } };
    shuffle(extra || []).forEach(add);
    shuffle([1, -1, 2, -2, 10, -10, 9, -9, 11, -11, 20, -20, 100, -100, 5, -5, 3, -3]).forEach(d => add(ans + d));
    return shuffle([ans, ...out.slice(0, 3)]).map(v => ({ label: fmt(v), value: String(v) }));
  }

  function numTask(topic, prompt, ans, o) {
    o = o || {};
    const format = o.format || (rnd() < 0.5 ? 'choice' : 'input');
    const t = { topic, label: LABELS[topic], format, prompt, answer: ans, hint: o.hint || '', solution: o.solution || ('Lösung: ' + fmt(ans)), expr: o.expr };
    if (format === 'choice') t.choices = numChoices(ans, o.extra);
    return t;
  }
  function textTask(topic, prompt, correct, wrong, o) {
    o = o || {};
    const labels = shuffle([correct, ...wrong.filter((w, i, a) => w !== correct && a.indexOf(w) === i)]);
    return { topic, label: LABELS[topic], format: o.format || 'choice', prompt, answer: correct, choices: labels.map(l => ({ label: l, value: l })), hint: o.hint || '', solution: o.solution || ('Richtig ist: ' + correct) };
  }

  /* ---------- Generatoren ---------- */
  function add(max) {
    let a, b;
    if (max <= 100) { a = R(12, 78); b = R(8, 98 - a); } else { a = R(120, 780); b = R(60, 980 - a); }
    const s = a + b;
    const hint = max <= 100 ? `Tipp: ${a} + ${tens(b)} = ${a + tens(b)}, dann noch + ${b % 10}.`
      : `Tipp: Rechne zuerst ${fmt(a)} + ${b - (b % 100)} = ${fmt(a + b - (b % 100))}, dann + ${b % 100}.`;
    return numTask('add', `${fmt(a)} + ${fmt(b)} = ?`, s, { expr: `${a}+${b}`, extra: [s + 10, s - 10, s - 100], hint });
  }
  function sub(max) {
    let a, b;
    if (max <= 100) { a = R(40, 99); b = R(11, a - 8); } else { a = R(300, 999); b = R(110, a - 50); }
    const d = a - b;
    const hint = max <= 100 ? `Tipp: ${a} ${M} ${tens(b)} = ${a - tens(b)}, dann noch ${M} ${b % 10}.`
      : `Tipp: ${fmt(a)} ${M} ${b - (b % 100)} = ${fmt(a - b + (b % 100))}, dann ${M} ${b % 100}.`;
    return numTask('sub', `${fmt(a)} ${M} ${fmt(b)} = ?`, d, { expr: `${a}-${b}`, extra: [d + 10, d - 10, d + 100], hint });
  }
  function times() {
    const a = R(2, 10), b = R(2, 10), p = a * b;
    return numTask('times', `${a} ${T} ${b} = ?`, p, { expr: `${a}*${b}`, extra: [a * (b + 1), a * (b - 1), (a + 1) * b, (a - 1) * b], hint: `Tipp: ${a} ${T} ${b - 1} = ${a * (b - 1)}, dann noch ${a} dazu.` });
  }
  function missing(max) {
    const big = max > 100; const v = R(0, 3);
    let a, b, c, ans, prompt;
    if (v === 0) { a = big ? R(120, 700) : R(12, 70); c = big ? R(a + 50, 990) : R(a + 8, 99); ans = c - a; prompt = `${fmt(a)} + ___ = ${fmt(c)}`; }
    else if (v === 1) { b = big ? R(60, 400) : R(6, 40); c = big ? R(b + 80, 990) : R(b + 10, 99); ans = c - b; prompt = `___ + ${fmt(b)} = ${fmt(c)}`; }
    else if (v === 2) { a = big ? R(3, 9) * 100 : R(50, 99); c = big ? R(60, a - 40) : R(10, a - 6); ans = a - c; prompt = `${fmt(a)} ${M} ___ = ${fmt(c)}`; }
    else { b = big ? R(60, 400) : R(6, 40); c = big ? R(80, 500) : R(10, 55); ans = c + b; prompt = `___ ${M} ${fmt(b)} = ${fmt(c)}`; }
    const hint = v === 3 ? 'Tipp: Rechne rückwärts mit der Umkehraufgabe (Addition).' : 'Tipp: Rechne rückwärts mit der Umkehraufgabe (Subtraktion).';
    return numTask('missing', 'Welche Zahl fehlt?\n' + prompt, ans, { format: rnd() < 0.75 ? 'input' : 'choice', hint, extra: [ans + 10, ans - 10] });
  }
  function nonRound(lo, hi) { let x; do { x = R(lo, hi); } while (x % 10 === 0); return x; }
  function cleverAdd() {
    const a = nonRound(11, 89), c = 100 - a; let b;
    do { b = nonRound(11, 89); } while ((a + b) % 10 === 0 || (b + c) % 10 === 0 || b === a || b === c);
    const s = a + b + c;
    if (rnd() < 0.5) return numTask('clever', `Rechne geschickt: ${a} + ${b} + ${c} = ?`, s, { expr: `${a}+${b}+${c}`, hint: `Tipp: ${a} + ${c} ergibt eine glatte Zahl.`, extra: [s - 10, s + 10] });
    return textTask('clever', `Welche Rechnung ist für ${a} + ${b} + ${c} besonders geschickt?`,
      `(${a} + ${c}) + ${b}`, [`(${a} + ${b}) + ${c}`, `(${b} + ${c}) + ${a}`], { hint: 'Tipp: Suche zwei Zahlen, die zusammen 100 ergeben.' });
  }
  function cleverSub() {
    if (rnd() < 0.5) {
      const b = nonRound(11, 89), c = 100 - b, t = R(150, 900), ans = t - 100;
      return numTask('clever', `Rechne geschickt: ${fmt(t)} ${M} ${b} ${M} ${c} = ?`, ans, { expr: `${t}-${b}-${c}`, hint: `Tipp: ${b} + ${c} = 100. Ziehe beides auf einmal ab.`, extra: [ans + 10, ans - 10] });
    }
    const a = R(20, 80), b = R(25, 90), c = b - R(1, 9), ans = a + b - c;
    return numTask('clever', `Rechne geschickt: ${a} + ${b} ${M} ${c} = ?`, ans, { expr: `${a}+${b}-${c}`, hint: `Tipp: Rechne zuerst ${b} ${M} ${c}.`, extra: [ans + 10, ans + 2] });
  }
  function laws() {
    const a = R(11, 60), b = R(11, 60), c = R(11, 60);
    const opts = ['Vertauschungsgesetz', 'Verbindungsgesetz', 'Gilt nicht – die Ergebnisse sind verschieden'];
    const v = R(0, 2);
    if (v === 0) return textTask('laws', `Welches Rechengesetz zeigt diese Gleichung?\n${a} + ${b} = ${b} + ${a}`, opts[0], opts.slice(1), { hint: 'Tipp: Werden Zahlen vertauscht oder Klammern verschoben?' });
    if (v === 1) return textTask('laws', `Welches Rechengesetz zeigt diese Gleichung?\n(${a} + ${b}) + ${c} = ${a} + (${b} + ${c})`, opts[1], [opts[0], opts[2]], { hint: 'Tipp: Die Reihenfolge bleibt gleich – nur die Klammern wandern.' });
    const x = R(40, 90), y = R(5, 30);
    return textTask('laws', `Gilt hier ein Rechengesetz?\n${x} ${M} ${y} = ${y} ${M} ${x}`, opts[2], opts.slice(0, 2), { hint: `Tipp: Bei der Subtraktion darf man nicht vertauschen. Rechne beide Seiten aus.` });
  }
  function assoc() {
    const v = R(0, 2);
    if (v === 0) { const a = R(12, 90), b = R(12, 90); return numTask('laws', `Vertauschungsgesetz – welche Zahl fehlt?\n${a} + ${b} = ${b} + ___`, a, { format: 'input', hint: 'Tipp: Beim Vertauschen bleiben dieselben Zahlen.' }); }
    if (v === 1) { const a = R(12, 60), b = R(12, 60), c = R(12, 60); return numTask('laws', `Verbindungsgesetz – welche Zahl fehlt?\n(${a} + ${b}) + ${c} = ${a} + (___ + ${c})`, b, { format: 'input', hint: 'Tipp: Nur die Klammern werden verschoben.' }); }
    const b = nonRound(11, 89), c = 100 - b, a = R(12, 99), s = a + b + c;
    return numTask('laws', `Nutze das Verbindungsgesetz: ${a} + ${b} + ${c} = ?`, s, { expr: `${a}+${b}+${c}`, hint: `Tipp: ${a} + (${b} + ${c}).` });
  }
  function bracketsEval(level) {
    const big = level >= 7; let s, val, plain;
    const v = big ? R(0, 4) : R(0, 3);
    if (v === 0) { const b = big ? R(40, 250) : R(5, 30), c = big ? R(40, 250) : R(5, 30), a = big ? R(b + c + 20, 990) : R(b + c + 5, 99); s = `${a} ${M} (${b} + ${c})`; val = a - (b + c); plain = a - b + c; }
    else if (v === 1) { const a = big ? R(300, 900) : R(40, 99), b = big ? R(50, a - 100) : R(5, a - 10), c = big ? R(30, 300) : R(5, 40); s = `(${a} ${M} ${b}) + ${c}`; val = a - b + c; plain = a - b - c; }
    else if (v === 2) { const b = big ? R(150, 500) : R(20, 60), c = big ? R(30, b - 40) : R(5, b - 5), a = big ? R(b - c + 30, 990) : R(b - c + 5, 99); s = `${a} ${M} (${b} ${M} ${c})`; val = a - (b - c); plain = a - b - c; }
    else if (v === 3) { const c = big ? R(40, 200) : R(5, 25), d = big ? R(40, 200) : R(5, 25), a = big ? R(c + d, 600) : R(c + d, 60), b = big ? R(20, 300) : R(5, 39); s = `(${a} + ${b}) ${M} (${c} + ${d})`; val = a + b - (c + d); plain = a + b - c + d; }
    else { const b = R(60, 200), c = R(40, 150), d = R(20, 200), a = R(b + c + 50, 900); s = `(${a} ${M} (${b} + ${c})) + ${d}`; val = a - (b + c) + d; plain = a - b + c + d; }
    return numTask('brackets', `Rechne – die Klammer zuerst!\n${fmtExpr(s)} = ?`, val, { expr: s.replace(/−/g, '-'), extra: [plain, val + 10, val - 10], hint: 'Tipp: Was in der Klammer steht, wird zuerst gerechnet.' });
  }
  function fmtExpr(s) { return s.replace(/\d+/g, m => fmt(+m)); }
  function orderOps() {
    const a = R(60, 99), b = R(5, 25), c = R(5, a - b - 10), d = R(3, 20);
    const val = a - b - c + d, wrong = a - (b - c) + d, wrong2 = a - b - (c + d);
    return numTask('order', `Rechne von links nach rechts:\n${a} ${M} ${b} ${M} ${c} + ${d} = ?`, val, { expr: `${a}-${b}-${c}+${d}`, extra: [wrong, wrong2].filter(x => x >= 0), hint: `Tipp: Ohne Klammern rechnest du der Reihe nach: zuerst ${a} ${M} ${b}.` });
  }
  // Wertet Zahlen/Operatoren von links nach rechts aus; null bei negativem Zwischenergebnis
  function evalLR(nums, ops) { let v = nums[0]; for (let i = 0; i < ops.length; i++) { v = ops[i] === '+' ? v + nums[i + 1] : v - nums[i + 1]; if (v < 0) return null; } return v; }
  function evalSpan(nums, ops, i, j) {
    const inner = evalLR(nums.slice(i, j + 1), ops.slice(i, j)); if (inner === null) return null;
    return evalLR([...nums.slice(0, i), inner, ...nums.slice(j + 1)], [...ops.slice(0, i), ...ops.slice(j)]);
  }
  function spanLabel(nums, ops, i, j) {
    let s = ''; nums.forEach((n, k) => { if (k > 0) s += ` ${ops[k - 1] === '+' ? '+' : M} `; if (k === i) s += '('; s += n; if (k === j) s += ')'; }); return s;
  }
  function bracketPlace() {
    for (let tries = 0; tries < 200; tries++) {
      const n = rnd() < 0.5 ? 3 : 4; const nums = [R(50, 99)]; const ops = [];
      for (let k = 1; k < n; k++) { nums.push(R(4, 30)); ops.push(rnd() < 0.6 ? '-' : '+'); }
      if (!ops.includes('-')) continue;
      const base = evalLR(nums, ops); if (base === null) continue;
      const byVal = new Map();
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
        if (i === 0 && j === n - 1) continue;
        const v = evalSpan(nums, ops, i, j); if (v === null || v === base) continue;
        if (!byVal.has(v)) byVal.set(v, []); byVal.get(v).push(spanLabel(nums, ops, i, j));
      }
      const unique = [...byVal.entries()].filter(([, l]) => l.length === 1);
      if (!unique.length || byVal.size < 1) continue;
      const [target, [label]] = pick(unique);
      const wrong = [...byVal.entries()].filter(([v]) => v !== target).map(([, l]) => l[0]);
      wrong.push(spanLabel(nums, ops, -1, -1)); // ohne Klammern (Ergebnis = base ≠ target)
      const t = textTask('place', `Wo müssen die Klammern stehen, damit ${target} herauskommt?`, label, wrong.slice(0, 3), { format: 'brackets', hint: 'Tipp: Probiere jede Möglichkeit aus und rechne die Klammer zuerst.' });
      t.target = target; t.nums = nums; t.ops = ops;
      return t;
    }
    return bracketsEval(4);
  }
  function word(level) {
    const hard = level >= 7;
    const tpl = hard ? R(0, 3) : R(0, 4);
    let p, ans, sol;
    if (!hard) {
      if (tpl === 0) { const a = R(60, 200), b = R(20, 120), c = R(10, a + b - 20); p = `Ein Taucher sammelt ${a} Muscheln und findet weitere ${b}. Anschließend verschenkt er ${c}. Wie viele Muscheln bleiben übrig?`; ans = a + b - c; sol = `${a} + ${b} ${M} ${c} = ${ans}`; }
      else if (tpl === 1) { const a = R(80, 300), b = R(10, a - 30), c = R(10, 120); p = `Im Riff leben ${a} Fische. ${b} schwimmen weg, dann kommen ${c} neue dazu. Wie viele Fische sind jetzt im Riff?`; ans = a - b + c; sol = `${a} ${M} ${b} + ${c} = ${ans}`; }
      else if (tpl === 2) { const a = R(9, 30), b = R(10, 40), c = pick([50, 100]); if (a + b > c) return word(level); p = `Anton kauft ein T-Shirt für ${a} € und eine Hose für ${b} €. Er bezahlt mit einem ${c}-€-Schein. Wie viel Euro bekommt er zurück?`; ans = c - (a + b); sol = `${c} ${M} (${a} + ${b}) = ${ans}`; }
      else if (tpl === 3) { const a = R(40, 200), b = R(10, 80); p = `Ein Delfin schwimmt am Montag ${a} m. Am Dienstag schwimmt er ${b} m mehr als am Montag. Wie viele Meter schwimmt er an beiden Tagen zusammen?`; ans = a + (a + b); sol = `${a} + (${a} + ${b}) = ${ans}`; }
      else { const a = R(100, 500), b = R(20, Math.min(150, a - 20)), c = R(20, 150); p = `In einer Schatzkiste liegen ${a} Goldmünzen. Kapitän Timmy nimmt ${b} heraus und legt später ${c} wieder hinein. Wie viele Münzen sind jetzt in der Kiste?`; ans = a - b + c; sol = `${a} ${M} ${b} + ${c} = ${ans}`; }
    } else {
      if (tpl === 0) { const m = [R(80, 320), R(60, 160), R(60, 160)], e = [R(60, 140), R(20, 80), R(20, 80)]; p = `Ein Unterwassermarkt verkauft morgens ${m[0]} kg Algen, ${m[1]} kg Seegras und ${m[2]} kg Muscheln. Abends verkauft er noch ${e[0]} kg Algen, ${e[1]} kg Seegras und ${e[2]} kg Muscheln. Wie viele Kilogramm sind das insgesamt?`; ans = m[0] + m[1] + m[2] + e[0] + e[1] + e[2]; sol = `${m.join(' + ')} + ${e.join(' + ')} = ${ans}`; }
      else if (tpl === 1) { const a = R(400, 900), b = R(80, 200), c = R(80, 200), d = R(50, 150); if (b + c > a) return word(level); p = `Ein Forschungs-U-Boot hat ${a} Liter Sauerstoff. Am ersten Tag verbraucht es ${b} Liter, am zweiten Tag ${c} Liter. Dann wird es mit ${d} Litern aufgefüllt. Wie viele Liter hat es jetzt?`; ans = a - b - c + d; sol = `${a} ${M} ${b} ${M} ${c} + ${d} = ${ans}`; }
      else if (tpl === 2) { const a = R(150, 400), b = R(30, 120), c = R(200, 600); p = `Herbert sammelt ${a} Leuchtperlen. Sein Freund sammelt ${b} Perlen weniger als Herbert. Zusammen wollen sie ${c + a + (a - b)} Perlen haben. Wie viele Perlen fehlen ihnen noch?`; ans = c; sol = `${a} + (${a} ${M} ${b}) = ${2 * a - b}; ${c + 2 * a - b} ${M} ${2 * a - b} = ${c}`; }
      else { const a = R(300, 800), b = R(40, 150), c = R(40, 150); p = `Auf einem Schiff sind ${a} Kisten. Im ersten Hafen werden ${b} Kisten abgeladen und ${c} neue aufgeladen. Im zweiten Hafen werden doppelt so viele abgeladen wie im ersten Hafen. Wie viele Kisten sind jetzt an Bord?`; ans = a - b + c - 2 * b; if (ans < 0) return word(level); sol = `${a} ${M} ${b} + ${c} ${M} ${2 * b} = ${ans}`; }
    }
    return numTask('word', p, ans, { format: rnd() < 0.7 ? 'input' : 'choice', hint: 'Tipp: Schreibe zuerst einen Rechenausdruck auf. Was kommt dazu (+), was geht weg (−)?', solution: 'Rechnung: ' + sol, extra: [ans + 10, ans - 10, ans + 100] });
  }
  function riddle() {
    const v = R(0, 3); let p, ans;
    if (v === 0) { const x = R(15, 300), b = R(15, 200); ans = x; p = `Ich denke mir eine Zahl. Wenn ich ${b} addiere, erhalte ich ${x + b}. Welche Zahl ist es?`; }
    else if (v === 1) { const x = R(80, 400), b = R(15, x - 10); ans = x; p = `Ich denke mir eine Zahl. Wenn ich ${b} subtrahiere, erhalte ich ${x - b}. Welche Zahl ist es?`; }
    else if (v === 2) { const s = R(100, 900), a = R(20, s - 20); ans = s - a; p = `Die Summe zweier Zahlen ist ${s}. Eine der Zahlen ist ${a}. Wie heißt die andere Zahl?`; }
    else { const d = R(50, 500), b = R(20, 400); ans = d + b; p = `Die Differenz zweier Zahlen ist ${d}. Die kleinere Zahl (Subtrahend) ist ${b}. Wie groß ist die größere Zahl (Minuend)?`; }
    return numTask('riddle', p, ans, { format: rnd() < 0.7 ? 'input' : 'choice', hint: 'Tipp: Benutze die Umkehraufgabe.' });
  }
  function termChoice() {
    const a = R(60, 99), b = R(10, 30), c = R(5, 25), d = R(5, 20); const v = R(0, 3);
    const m = ` ${M} `;
    if (v === 0) return textTask('term', `Welcher Rechenausdruck passt?\n„Subtrahiere von ${a} die Summe aus ${b} und ${c}.“`, `${a}${m}(${b} + ${c})`, [`${a}${m}${b} + ${c}`, `(${b} + ${c})${m}${a}`, `${a} + (${b} + ${c})`], { hint: 'Tipp: „Die Summe aus …“ gehört in eine Klammer.' });
    if (v === 1) return textTask('term', `Welcher Rechenausdruck passt?\n„Addiere zur Differenz von ${a} und ${b} die Zahl ${c}.“`, `(${a}${m}${b}) + ${c}`, [`${a}${m}(${b} + ${c})`, `${c}${m}(${a}${m}${b})`, `(${a} + ${b}) + ${c}`], { hint: 'Tipp: Die Differenz von … und … ist die Klammer, die zuerst kommt.' });
    if (v === 2) return textTask('term', `Welcher Rechenausdruck passt?\n„Subtrahiere die Differenz von ${b + 20} und ${c} von ${a + 40}.“`, `${a + 40}${m}(${b + 20}${m}${c})`, [`(${b + 20}${m}${c})${m}${a + 40}`, `${a + 40}${m}${b + 20}${m}${c}`, `${a + 40} + (${b + 20}${m}${c})`], { hint: 'Tipp: „von …“ am Ende sagt dir, wovon abgezogen wird.' });
    return textTask('term', `Welcher Rechenausdruck passt?\n„Addiere die Summe von ${b} und ${c} zur Differenz von ${a} und ${d}.“`, `(${a}${m}${d}) + (${b} + ${c})`, [`(${a} + ${d})${m}(${b} + ${c})`, `${a}${m}(${d} + ${b} + ${c})`, `(${b} + ${c})${m}(${a}${m}${d})`], { hint: 'Tipp: Hier brauchst du zwei Klammern.' });
  }
  function pyramid(level) {
    const n = level >= 7 ? pick([3, 4, 4]) : pick([3, 4]);
    const lo = n === 3 ? 5 : 3, hi = n === 3 ? (level >= 7 ? 120 : 45) : (level >= 7 ? 60 : 25);
    const rows = [[]]; for (let i = 0; i < n; i++) rows[0].push(R(lo, hi));
    for (let r = 1; r < n; r++) { rows.push([]); for (let c = 0; c < n - r; c++) rows[r].push(rows[r - 1][c] + rows[r - 1][c + 1]); }
    const cells = []; rows.forEach((row, r) => row.forEach((_, c) => cells.push([r, c])));
    for (let tries = 0; tries < 500; tries++) {
      const k = n === 3 ? R(2, 3) : R(3, 5);
      const blanks = shuffle(cells).slice(0, k);
      if (solvable(rows, blanks)) {
        const answer = {}; blanks.forEach(([r, c]) => answer[r + ',' + c] = rows[r][c]);
        return { topic: 'pyramid', label: LABELS.pyramid, format: 'pyramid', prompt: 'Fülle die Zahlenpyramide aus! Jeder Stein ist die Summe der beiden Steine darunter.', pyramid: { rows, blanks }, answer, hint: 'Tipp: Oben = links unten + rechts unten. Fehlt unten etwas, rechne mit Minus zurück.', solution: 'Die Pyramide: ' + rows.slice().reverse().map(r => r.join(' | ')).join('  /  ') };
      }
    }
    return pyramid(level);
  }
  function solvable(rows, blanks) {
    const n = rows[0].length; const known = new Set(); rows.forEach((row, r) => row.forEach((_, c) => known.add(r + ',' + c)));
    blanks.forEach(([r, c]) => known.delete(r + ',' + c));
    const K = (r, c) => known.has(r + ',' + c);
    let changed = true;
    while (changed) {
      changed = false;
      for (let r = 1; r < n; r++) for (let c = 0; c < n - r; c++) {
        const p = K(r, c), a = K(r - 1, c), b = K(r - 1, c + 1);
        if (!p && a && b) { known.add(r + ',' + c); changed = true; }
        if (p && a && !b) { known.add((r - 1) + ',' + (c + 1)); changed = true; }
        if (p && !a && b) { known.add((r - 1) + ',' + c); changed = true; }
      }
    }
    return blanks.every(([r, c]) => K(r, c));
  }
  function sequence(level) {
    const v = R(0, 2); let terms = [], next, hint;
    if (v === 0) { const d = R(3, level >= 7 ? 40 : 19); let x = R(3, 60); for (let i = 0; i < 5; i++) { terms.push(x); x += d; } next = x; hint = 'Tipp: Wie groß ist der Abstand zwischen zwei Zahlen?'; }
    else if (v === 1) { const a = R(6, 15), b = R(1, a - 1); let x = R(10, 40); for (let i = 0; i < 6; i++) { terms.push(x); x += i % 2 === 0 ? a : -b; } next = x; hint = 'Tipp: Es wechseln sich zwei verschiedene Schritte ab.'; }
    else { let d = R(1, 5), x = R(2, 30); for (let i = 0; i < 5; i++) { terms.push(x); x += d; d += 1; } next = x; hint = 'Tipp: Der Abstand wird jedes Mal um 1 größer.'; }
    return numTask('sequence', `Setze die Zahlenfolge fort:\n${terms.join(', ')}, ?`, next, { hint, extra: [next + 1, next - 1, next + 2] });
  }
  const round100 = x => Math.round(x / 100) * 100;
  function okRound(x) { const r = x % 100; return r < 40 || r > 60; }
  function estimate() {
    let a, b; const isAdd = rnd() < 0.6;
    do { a = R(isAdd ? 120 : 450, 880); b = R(120, isAdd ? 880 : a - 150); } while (!okRound(a) || !okRound(b) || (!isAdd && b >= a - 100));
    const ans = isAdd ? round100(a) + round100(b) : round100(a) - round100(b);
    const t = numTask('estimate', `Überschlage (runde auf Hunderter):\n${a} ${isAdd ? '+' : M} ${b} ≈ ?`, ans, { format: 'choice', hint: `Tipp: ${a} ≈ ${round100(a)} und ${b} ≈ ${round100(b)}.` });
    t.choices = shuffle([ans, ans + 100, ans - 100, ans + 200].filter(v => v >= 0).slice(0, 4)).map(v => ({ label: fmt(v), value: String(v) }));
    return t;
  }
  function orderResults(level) {
    for (let tries = 0; tries < 100; tries++) {
      const items = []; const vals = new Set();
      for (let i = 0; i < 4; i++) {
        let a, b, s, v;
        if (level <= 2) { a = R(120, 700); b = R(20, 280); } else { a = R(30, 99); b = R(5, 29); }
        if (rnd() < 0.5) { v = a + b; s = `${fmt(a)} + ${fmt(b)}`; } else { v = a - b; s = `${fmt(a)} ${M} ${fmt(b)}`; }
        if (vals.has(v)) break; vals.add(v); items.push({ label: s, value: v });
      }
      if (items.length < 4) continue;
      const answer = items.map((it, i) => i).sort((i, j) => items[i].value - items[j].value);
      return { topic: 'sort', label: LABELS.sort, format: 'order', prompt: 'Tippe die Rechnungen nach ihrem Ergebnis an – vom kleinsten zum größten!', items: items.map(i => i.label), values: items.map(i => i.value), answer, hint: 'Tipp: Rechne jede Aufgabe zuerst aus und schreibe dir das Ergebnis auf.', solution: 'Reihenfolge: ' + answer.map(i => `${items[i].label} = ${fmt(items[i].value)}`).join('  <  ') };
    }
    return orderResults(level);
  }

  /* ---------- Welten ---------- */
  const W = {
    1: [() => add(100), () => sub(100), times],
    2: [() => add(1000), () => sub(1000), () => missing(1000), times, () => orderResults(2)],
    3: [cleverAdd, cleverSub, laws, assoc],
    4: [() => bracketsEval(4), orderOps, bracketPlace, times],
    5: [() => word(5), riddle, termChoice, () => missing(1000)],
    6: [() => pyramid(6), () => sequence(6), () => orderResults(6), cleverAdd, bracketPlace],
    7: [estimate, () => bracketsEval(7), () => word(7), () => pyramid(7), () => sequence(7)],
  };
  W[8] = [].concat(W[1].slice(0, 2), W[2].slice(2), W[3], W[4], W[5], W[6].slice(0, 3), W[7]);
  const ALL = W[8];

  const bags = {};
  function generate(world) {
    const list = W[world] || ALL;
    if (!bags[world] || !bags[world].length) bags[world] = shuffle(list.map((_, i) => i));
    const t = list[bags[world].pop()]();
    t.world = world; return t;
  }
  function generateExam(count) {
    count = count || 15; const out = []; const used = new Set(); let bag = [];
    while (out.length < count) {
      if (!bag.length) bag = shuffle(ALL.map((_, i) => i));
      const t = ALL[bag.pop()]();
      if (used.has(t.prompt)) continue; used.add(t.prompt); t.world = 9; out.push(t);
    }
    return out;
  }
  // Quiz-Show: Frage 1–15, immer genau 4 Antwortmöglichkeiten, Schwierigkeit steigt
  const QUIZ_LEVEL = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 7];
  function generateQuiz(step) {
    const lvl = QUIZ_LEVEL[Math.max(0, Math.min(14, step))];
    for (let tries = 0; tries < 80; tries++) {
      const list = W[lvl]; let t = list[Math.floor(rnd() * list.length)]();
      if (t.format === 'order' || t.format === 'pyramid') continue;
      if (typeof t.answer === 'number' && t.format === 'input') { t.format = 'choice'; t.choices = numChoices(t.answer, [t.answer + 10, t.answer - 10, t.answer + 1]); }
      if (!t.choices || t.choices.length !== 4) continue;
      t.format = 'choice'; t.step = step; t.level = lvl; return t;
    }
    const t = add(lvl >= 2 ? 1000 : 100); t.format = 'choice'; t.choices = numChoices(t.answer, [t.answer + 10]); t.step = step; t.level = lvl; return t;
  }
  function check(task, input) {
    if (input === null || input === undefined) return false;
    switch (task.format) {
      case 'choice': case 'brackets': return String(input) === String(task.answer);
      case 'input': { const s = String(input).replace(/\./g, '').trim(); return s !== '' && /^\d+$/.test(s) && Number(s) === task.answer; }
      case 'order': return Array.isArray(input) && input.length === task.answer.length && input.every((v, i) => v === task.answer[i]);
      case 'pyramid': return Object.keys(task.answer).every(k => Number(input[k]) === task.answer[k]);
    }
    return false;
  }

  const api = { generate, generateExam, generateQuiz, QUIZ_LEVEL, check, fmt, LABELS, _gens: { add, sub, times, missing, cleverAdd, cleverSub, laws, assoc, bracketsEval, orderOps, bracketPlace, word, riddle, termChoice, pyramid, sequence, estimate, orderResults }, _evalSpan: evalSpan, _evalLR: evalLR, setRandom(f) { rnd = f; } };
  root.MathGen = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
