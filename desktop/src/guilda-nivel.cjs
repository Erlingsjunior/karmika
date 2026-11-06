/* O NÍVEL DA GUILDA, AS MISSÕES DO DIA, O COFRE E O IMPOSTO (06/11, Erling: "página da guilda: boas-vindas, missões, níveis I a V";
   "a guilda paga imposto ao jogo, e paga mais quanto maior ela for").
   Tudo aqui é regra pura (sem rede): o server.cjs chama e manda o resultado para os membros.

   - Glória: o XP da guilda. Vem das missões do dia e das doações ao cofre (1 de glória a cada 10 de ouro).
   - Níveis I a V: cada um pede glória e libera coisas (a tabela de textos fica no cliente, em guilda-niveis.ts).
   - Vagas: I 20 · II 35 · III 50 · IV e V 50 (o documento de 05/11 não aumenta vagas no IV e no V).
   - Missões: 3 por dia (dia de Brasília), iguais para todos os membros, somando o esforço de todos.
   - Imposto: cobrado do cofre uma vez por dia; o que faltar vira dívida. Com dívida, a guilda não sobe de nível. */

const NEED = [0, 0, 3000, 9000, 22000, 50000]; // glória total para chegar ao nível (índice = nível)
const CAP = [0, 20, 35, 50, 50, 50];
const MAX_LVL = 5;

const dayKey = (t = Date.now()) => new Date(t - 3 * 3600e3).toISOString().slice(0, 10); /* o dia vira à meia-noite de Brasília */

/** o imposto do dia: 40 de ouro por membro, vezes o nível (a vila do nível V dobra) */
const taxOf = (g) => Math.round(40 * Object.keys(g.members).length * (g.lvl || 1) * ((g.lvl || 1) >= 5 ? 2 : 1));

/** as 3 missões do dia: sorteio fixo pelo dia e pela guilda (todos os membros veem as mesmas) */
function missionsFor(g, day) {
  let s = 0; for (const ch of day + ':' + g.id) s = (s * 31 + ch.charCodeAt(0)) >>> 0;
  const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const n = Math.max(3, Object.keys(g.members).length), L = g.lvl || 1;
  const pool = [
    { kind: 'kill', name: 'Caçada da guilda', text: 'Os membros derrotam monstros em qualquer lugar do mundo.', need: Math.round((60 + n * 12) * (0.8 + L * 0.2)), xp: 400 + 120 * L },
    { kind: 'elite', name: 'Cabeças de elite', text: 'Derrotem elites e chefes (os de nome dourado).', need: Math.max(2, Math.round(n * 0.4 + L)), xp: 600 + 160 * L },
    { kind: 'quest', name: 'Palavra cumprida', text: 'Os membros terminam missões (de qualquer quadro ou campanha).', need: Math.max(3, Math.round(n * 0.6 + L)), xp: 450 + 130 * L },
    { kind: 'cofre', name: 'Cofre cheio', text: 'Os membros doam ouro ao cofre da guilda.', need: 400 * L + 60 * n, xp: 350 + 100 * L },
    { kind: 'gather', name: 'Mãos no ofício', text: 'Os membros colhem e coletam (madeira, pedra, ervas, peixe, minério).', need: Math.round((40 + n * 8) * (0.8 + L * 0.2)), xp: 380 + 110 * L },
  ];
  const out = []; while (out.length < 3) { const p = pool[Math.floor(rnd() * pool.length)]; if (!out.some((q) => q.kind === p.kind)) out.push({ ...p, n: 0, done: 0 }); }
  return out;
}

/** vira o dia: cobra o imposto do dia que passou e sorteia missões novas. Devolve as linhas para o registro da guilda */
function rollDay(g, now = Date.now()) {
  const d = dayKey(now), lines = [];
  g.lvl ||= 1; g.xp ||= 0; g.cofre ||= 0; g.debt ||= 0;
  if (g.miss && g.miss.day === d) return lines;
  if (g.miss) { /* o imposto é do dia que acabou */
    const tax = taxOf(g), paid = Math.min(g.cofre, tax); g.cofre -= paid; g.debt += tax - paid;
    lines.push(tax - paid > 0 ? `O imposto do dia (${tax} de ouro) não coube no cofre: a guilda deve ${g.debt}. Com dívida, ela não sobe de nível.` : `O Prefeito recolheu o imposto do dia: ${tax} de ouro do cofre.`);
  }
  g.miss = { day: d, list: missionsFor(g, d) };
  return lines;
}

/** soma glória e sobe de nível se der (e se não houver dívida) */
function addGlory(g, xp, lines) {
  g.xp = (g.xp || 0) + Math.max(0, Math.round(xp));
  while ((g.lvl || 1) < MAX_LVL && g.xp >= NEED[(g.lvl || 1) + 1]) {
    if (g.debt > 0) { if (!g.debtWarned) { lines.push(`A guilda tem glória para o nível ${roman((g.lvl || 1) + 1)}, mas deve ${g.debt} de imposto. Paguem a dívida no cofre para subir.`); g.debtWarned = 1; } break; }
    g.lvl = (g.lvl || 1) + 1; g.debtWarned = 0; lines.push(`⚑ A guilda subiu para o nível ${roman(g.lvl)}! Vagas agora: ${CAP[g.lvl]}.`);
  }
}

/** o esforço de um membro numa missão do dia. n já vem limitado pelo server (anti-trapaça) */
function progress(g, kind, n, lines) {
  const M = g.miss; if (!M) return false; let changed = false;
  for (const q of M.list) { if (q.kind !== kind || q.done) continue; q.n = Math.min(q.need, q.n + n); changed = true;
    if (q.n >= q.need) { q.done = 1; lines.push(`Missão do dia cumprida: ${q.name} (+${q.xp} de glória).`); addGlory(g, q.xp, lines); } }
  return changed;
}

/** doação ao cofre: primeiro paga a dívida; 10 de ouro = 1 de glória */
function donate(g, gold, who, lines) {
  gold = Math.max(0, Math.floor(gold)); if (!gold) return;
  const toDebt = Math.min(g.debt || 0, gold); g.debt = (g.debt || 0) - toDebt; g.cofre = (g.cofre || 0) + gold - toDebt;
  lines.push(`${who} doou ${gold} de ouro ao cofre${toDebt ? ` (${toDebt} pagaram a dívida${g.debt ? `; ainda faltam ${g.debt}` : ': a guilda está em dia'})` : ''}.`);
  progress(g, 'cofre', gold, lines); addGlory(g, gold / 10, lines);
}

const roman = (n) => ['', 'I', 'II', 'III', 'IV', 'V'][n] || String(n);
/** o que vai para o cliente */
const view = (g) => ({ lvl: g.lvl || 1, xp: Math.floor(g.xp || 0), need: NEED[Math.min(MAX_LVL, (g.lvl || 1) + 1)] || 0, prevNeed: NEED[g.lvl || 1] || 0, max: (g.lvl || 1) >= MAX_LVL, cap: CAP[g.lvl || 1], cofre: g.cofre || 0, debt: g.debt || 0, tax: taxOf(g), miss: g.miss || null });

module.exports = { NEED, CAP, MAX_LVL, dayKey, taxOf, rollDay, addGlory, progress, donate, view, roman };
