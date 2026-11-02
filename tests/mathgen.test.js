// Automatischer Test des Mathematikgenerators:  node tests/mathgen.test.js
const MG = require('../js/mathgen.js');
let fails = 0, n = 0;
const assert = (c, msg, t) => { if (!c) { fails++; if (fails < 15) console.error('FEHLER:', msg, JSON.stringify(t)); } };
const evalExpr = s => Function('"use strict";return (' + s + ')')();
const toJs = s => s.replace(/−/g, '-').replace(/·/g, '*').replace(/(\d)\.(\d{3})/g, '$1$2');

for (let w = 1; w <= 8; w++) {
  for (let i = 0; i < 3000; i++) {
    const t = MG.generate(w); n++;
    assert(t.prompt && t.format && t.hint, 'Pflichtfelder', t);
    if (t.format === 'input' || t.format === 'choice') {
      if (typeof t.answer === 'number') {
        assert(Number.isInteger(t.answer) && t.answer >= 0, 'nicht-negative Ganzzahl', t);
        if (t.expr) assert(evalExpr(t.expr) === t.answer, 'Ausdruck stimmt', t);
        assert(MG.check(t, String(t.answer)), 'Richtige Antwort wird erkannt', t);
        assert(!MG.check(t, String(t.answer + 1)), 'Falsche Antwort wird erkannt', t);
      }
    }
    if (t.choices) {
      const vals = t.choices.map(c => c.value);
      assert(new Set(vals).size === vals.length, 'Antwortoptionen eindeutig', t);
      assert(vals.filter(v => v === String(t.answer)).length === 1, 'Genau eine richtige Option', t);
      assert(vals.length >= 2, 'mind. 2 Optionen', t);
      if (t.format === 'brackets') {
        const results = t.choices.map(c => evalExpr(toJs(c.label)));
        assert(results.filter(r => r === t.target).length === 1, 'Klammern: genau eine Option ergibt Ziel', { t, results });
        assert(MG.check(t, t.answer), 'Klammern richtig', t);
      }
      if (t.topic === 'term') assert(t.choices.every(c => evalExpr(toJs(c.label)) >= -1e9), 'Terme auswertbar', t);
      if (t.topic === 'estimate') assert(t.choices.every(c => +c.value % 100 === 0), 'Überschlag auf Hunderter', t);
    }
    if (t.format === 'order') {
      const sorted = t.answer.map(i => t.values[i]);
      assert(sorted.every((v, i) => i === 0 || v > sorted[i - 1]), 'Ordnen aufsteigend & eindeutig', t);
      t.items.forEach((s, i) => assert(evalExpr(toJs(s)) === t.values[i], 'Ordnen: Werte stimmen', t));
      assert(MG.check(t, t.answer.slice()), 'Ordnen richtig erkannt', t);
      assert(!MG.check(t, t.answer.slice().reverse()), 'Ordnen falsch erkannt', t);
    }
    if (t.format === 'pyramid') {
      const { rows } = t.pyramid;
      for (let r = 1; r < rows.length; r++) rows[r].forEach((v, c) => assert(v === rows[r - 1][c] + rows[r - 1][c + 1], 'Pyramide korrekt', t));
      assert(MG.check(t, Object.assign({}, t.answer)), 'Pyramide richtig erkannt', t);
      const wrong = Object.assign({}, t.answer); const k = Object.keys(wrong)[0]; wrong[k]++;
      assert(!MG.check(t, wrong), 'Pyramide falsch erkannt', t);
    }
  }
}
const ex = MG.generateExam(15);
assert(ex.length === 15 && new Set(ex.map(t => t.prompt)).size === 15, 'Prüfung: 15 verschiedene Aufgaben', ex.length);
assert(new Set(ex.map(t => t.topic)).size >= 8, 'Prüfung: Themenvielfalt', ex.map(t => t.topic));
console.log(`${n} Aufgaben geprüft, ${fails} Fehler.`);
process.exit(fails ? 1 : 0);
