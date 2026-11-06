/* O NÍVEL DA GUILDA, AS MISSÕES, AS HABILIDADES, O COFRE E O IMPOSTO.
   06/11 (Erling): "página da guilda: boas-vindas, missões, níveis I a V"; "a guilda paga imposto ao jogo, e paga mais quanto maior ela for";
   "precisam ser criadas MUITAS missões da guilda, e skills da guilda que vão abrindo conforme ela avança";
   "quando você entra na guilda 4% de todo o seu XP ganho vai para a guilda — tira de você";
   "precisa de MUITOS pontos de glória para subir, e a cada nível o que se pede se multiplica mais e mais".
   Tudo aqui é regra pura (sem rede): o server.cjs chama e manda o resultado para os membros.

   - Glória: o XP da guilda. Vem do DÍZIMO (4% do XP de cada membro), das missões do dia e da semana e das doações ao cofre.
   - Níveis I a V: II 60 mil · III 360 mil (×6) · IV 2,9 milhões (×8) · V 29 milhões (×10).
   - Vagas: I 20 · II 35 · III 50 · IV e V 50 (+10 por grau de "Lenda Viva").
   - Missões: 3 a 6 por dia (sobe com o nível) e 1 Grande Feito por semana, tiradas de um catálogo grande; o esforço é de todos.
   - Habilidades: pontos por nível (I 2 · II 5 · III 8 · IV 11 · V 14); o líder escolhe; cada uma abre num nível.
   - Imposto: cobrado do cofre uma vez por dia; o que faltar vira dívida. Com dívida, a guilda não sobe de nível. */

const NEED = [0, 0, 60000, 360000, 2880000, 28800000]; // glória total para chegar ao nível (índice = nível)
const CAP = [0, 20, 35, 50, 50, 50];
const MAX_LVL = 5;
const TITHE = 0.04; // o dízimo: 4% do XP do membro
const POINTS = [0, 2, 5, 8, 11, 14]; // pontos de habilidade da guilda por nível

/** as habilidades da guilda: o que vale no servidor (imposto, glória, missões, vagas) mora aqui; o resto o cliente aplica (guilda-skills.ts) */
const SKILLS = {
  estandarte: { lvl: 1, max: 3 }, fogueira: { lvl: 1, max: 3 }, dizimo: { lvl: 1, max: 3 },
  laminas: { lvl: 2, max: 3 }, prefeito: { lvl: 2, max: 3 }, estrada: { lvl: 2, max: 2 },
  muralha: { lvl: 3, max: 3 }, olho: { lvl: 3, max: 3 }, mutirao: { lvl: 3, max: 3 },
  quartel: { lvl: 4, max: 3 }, juramento: { lvl: 4, max: 2 }, sabedoria: { lvl: 4, max: 3 },
  coracao: { lvl: 5, max: 3 }, lenda: { lvl: 5, max: 2 },
};
const rank = (g, id) => (g.skills && g.skills[id]) || 0;
const capOf = (g) => CAP[g.lvl || 1] + 10 * rank(g, 'lenda');
const spent = (g) => Object.values(g.skills || {}).reduce((a, b) => a + b, 0);
const pointsLeft = (g) => POINTS[g.lvl || 1] - spent(g);

const dayKey = (t = Date.now()) => new Date(t - 3 * 3600e3).toISOString().slice(0, 10); /* o dia vira à meia-noite de Brasília */
const weekKey = (t = Date.now()) => { const d = new Date(t - 3 * 3600e3); const day = (d.getUTCDay() + 6) % 7; d.setUTCDate(d.getUTCDate() - day); return 'S' + d.toISOString().slice(0, 10); }; /* a semana começa na segunda */

/** o imposto do dia: 40 de ouro por membro, vezes o nível (a vila do nível V dobra), menos o desconto de "Amigos do Prefeito" */
const taxOf = (g) => Math.round(40 * Object.keys(g.members).length * (g.lvl || 1) * ((g.lvl || 1) >= 5 ? 2 : 1) * (1 - 0.1 * rank(g, 'prefeito')));

/* O CATÁLOGO DE MISSÕES. kind = o contador que o cliente manda (os mesmos dos feitos do jogo). min = nível da guilda em que entra no sorteio.
   per = quanto cada membro "rende" no dia (a meta cresce com o tamanho da guilda); w = peso (1 = comum, menos = mais raro). */
const POOL = [
  { kind: 'kills', min: 1, per: 18, base: 40, name: 'Caçada da guilda', text: 'Derrotem monstros em qualquer lugar do mundo.' },
  { kind: 'k_rat', min: 1, per: 4, base: 12, name: 'Ratos no celeiro', text: 'Derrotem ratazanas (Rubras e de esgoto).' },
  { kind: 'k_wolves', min: 1, per: 4, base: 12, name: 'Uivos na estrada', text: 'Derrotem lobos de qualquer tipo.' },
  { kind: 'k_undead', min: 1, per: 4, base: 10, name: 'Os que não descansam', text: 'Derrotem esqueletos, zumbis e carniçais.' },
  { kind: 'k_imp', min: 2, per: 3, base: 8, name: 'Diabretes das ruínas', text: 'Derrotem diabretes.' },
  { kind: 'k_werewolf', min: 3, per: 0.6, base: 2, name: 'Noite de lua cheia', text: 'Derrotem lobisomens.', w: 0.6 },
  { kind: 'elites', min: 1, per: 0.5, base: 2, name: 'Cabeças de elite', text: 'Derrotem elites e chefes (os de nome dourado).' },
  { kind: 'k_boss_cat', min: 3, per: 0.15, base: 1, name: 'A Catedral profanada', text: 'Derrotem o Bispo Caído ou o Sacerdote Maldito.', w: 0.5 },
  { kind: 'k_up5', min: 2, per: 1.5, base: 4, name: 'Mais forte que nós', text: 'Derrotem monstros 5 níveis acima de quem luta.' },
  { kind: 'dungeons', min: 2, per: 0.3, base: 1, name: 'Fundo da masmorra', text: 'Terminem masmorras (o chefe do fim).', w: 0.8 },
  { kind: 'quest', min: 1, per: 0.6, base: 3, name: 'Palavra cumprida', text: 'Terminem missões (de qualquer quadro ou campanha).' },
  { kind: 'hunts', min: 2, per: 0.4, base: 2, name: 'Contratos de caça', text: 'Cumpram caçadas do Quadro.', w: 0.8 },
  { kind: 'trees', min: 1, per: 6, base: 15, name: 'Madeira para o salão', text: 'Derrubem árvores (machado).' },
  { kind: 'rocks', min: 1, per: 6, base: 15, name: 'Pedra para os muros', text: 'Quebrem pedras (picareta).' },
  { kind: 'herbs', min: 1, per: 5, base: 12, name: 'O herbário da guilda', text: 'Colham ervas e flores.' },
  { kind: 'fish', min: 1, per: 4, base: 10, name: 'Mesa farta', text: 'Pesquem peixes.' },
  { kind: 'ore', min: 2, per: 3, base: 8, name: 'Veios de minério', text: 'Minerem ferro, prata ou gemas.' },
  { kind: 'skins', min: 2, per: 2, base: 6, name: 'Couro para as armaduras', text: 'Esfolem caça (couros e peles).' },
  { kind: 'crafts', min: 1, per: 1.5, base: 4, name: 'Mãos no ofício', text: 'Criem itens nas bancadas e oficinas.' },
  { kind: 'cofre', min: 1, per: 60, base: 400, name: 'Cofre cheio', text: 'Doem ouro ao cofre da guilda.', gold: 1 },
  { kind: 'spared', min: 2, per: 0.3, base: 1, name: 'Misericórdia', text: 'Poupem um inimigo rendido.', w: 0.5 },
  { kind: 'heroic', min: 3, per: 0.2, base: 1, name: 'Um ato heroico', text: 'Façam um ato que o Olho vê (títulos e feitos).', w: 0.4 },
  { kind: 'pvp_rival', min: 3, per: 0.3, base: 1, name: 'Guerra de facções', text: 'Derrubem jogadores da facção rival.', w: 0.5 },
  { kind: 'duels', min: 2, per: 0.3, base: 1, name: 'Honra no círculo', text: 'Vençam duelos.', w: 0.5 },
  { kind: 'rides', min: 2, per: 0.5, base: 2, name: 'Cavalgada', text: 'Montem e viajem nas montarias.', w: 0.5 },
];
const DAILY = [0, 3, 4, 5, 5, 6]; // missões por dia em cada nível
const missXp = (L, kind) => Math.round((kind === 'cofre' ? 1200 : 1800) * Math.pow(2.1, L - 1)); // a glória de uma missão do dia (dobra a cada nível)

function seeded(key) { let s = 0; for (const ch of key) s = (s * 31 + ch.charCodeAt(0)) >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
function pick(rnd, L, taken) { const can = POOL.filter((p) => p.min <= L && !taken.has(p.kind)); let tot = can.reduce((a, p) => a + (p.w ?? 1), 0), r = rnd() * tot; for (const p of can) { r -= p.w ?? 1; if (r <= 0) return p; } return can[0]; }
const needOf = (p, n, L, k = 1) => Math.max(1, Math.round((p.base + p.per * n) * (0.85 + 0.15 * L) * k * (p.gold ? L : 1)));

/** as missões do dia: sorteio fixo pelo dia e pela guilda (todos os membros veem as mesmas) */
function missionsFor(g, day) {
  const rnd = seeded(day + ':' + g.id), n = Math.max(3, Object.keys(g.members).length), L = g.lvl || 1, out = [], taken = new Set();
  while (out.length < DAILY[L]) { const p = pick(rnd, L, taken); if (!p) break; taken.add(p.kind); out.push({ kind: p.kind, name: p.name, text: p.text, need: needOf(p, n, L), n: 0, xp: missXp(L, p.kind), done: 0 }); }
  return out;
}
/** o Grande Feito da semana: uma missão gorda, 6× a meta do dia, com 5× a glória */
function weeklyFor(g, wk) { const rnd = seeded(wk + ':' + g.id + ':w'), n = Math.max(3, Object.keys(g.members).length), L = g.lvl || 1, p = pick(rnd, L, new Set());
  return [{ kind: p.kind, name: 'Grande Feito: ' + p.name, text: p.text + ' A semana inteira.', need: needOf(p, n, L, 6), n: 0, xp: missXp(L, p.kind) * 5, done: 0, week: 1 }]; }

/** vira o dia (e a semana): cobra o imposto do dia que passou e sorteia missões novas. Devolve as linhas para o registro da guilda */
function rollDay(g, now = Date.now()) {
  const d = dayKey(now), w = weekKey(now), lines = [];
  g.lvl ||= 1; g.xp ||= 0; g.cofre ||= 0; g.debt ||= 0; g.skills ||= {};
  if (!g.week || g.week.key !== w) g.week = { key: w, list: weeklyFor(g, w) };
  if (g.miss && g.miss.day === d && !g.miss.list.some((q) => q.kind === 'kill' || q.kind === 'elite' || q.kind === 'gather')) return lines; /* (as missões da versão de 06/11 cedo usavam outros nomes: sorteia de novo) */
  const fresh = g.miss && g.miss.day === d;
  if (g.miss && !fresh) { /* o imposto é do dia que acabou */
    const tax = taxOf(g), paid = Math.min(g.cofre, tax); g.cofre -= paid; g.debt += tax - paid;
    lines.push(tax - paid > 0 ? `O imposto do dia (${tax} de ouro) não coube no cofre: a guilda deve ${g.debt}. Com dívida, ela não sobe de nível.` : `O Prefeito recolheu o imposto do dia: ${tax} de ouro do cofre.`);
  }
  g.miss = { day: d, list: missionsFor(g, d) };
  return lines;
}

/** soma glória e sobe de nível se der (e se não houver dívida). who: quem deu (contagem por membro) */
function addGlory(g, xp, lines, who) {
  const v = Math.max(0, xp); g.xp = (g.xp || 0) + v;
  if (who && g.members[who]) g.members[who].glory = Math.round((g.members[who].glory || 0) + v);
  while ((g.lvl || 1) < MAX_LVL && g.xp >= NEED[(g.lvl || 1) + 1]) {
    if (g.debt > 0) { if (!g.debtWarned) { lines.push(`A guilda tem glória para o nível ${roman((g.lvl || 1) + 1)}, mas deve ${g.debt} de imposto. Paguem a dívida no cofre para subir.`); g.debtWarned = 1; } break; }
    g.lvl = (g.lvl || 1) + 1; g.debtWarned = 0; lines.push(`⚑ A guilda subiu para o nível ${roman(g.lvl)}! Vagas: ${capOf(g)} · ${POINTS[g.lvl] - POINTS[g.lvl - 1]} pontos de habilidade novos para o líder distribuir.`);
  }
}

/** o esforço de um membro numa missão (do dia ou da semana). n já vem limitado pelo server (anti-trapaça) */
function progress(g, kind, n, lines, who) {
  const k = 1 + 0.2 * rank(g, 'mutirao'); let changed = false;
  for (const q of [...(g.miss?.list || []), ...(g.week?.list || [])]) { if (q.kind !== kind || q.done) continue; q.n = Math.min(q.need, q.n + n * (kind === 'cofre' ? 1 : k)); changed = true;
    if (q.n >= q.need) { q.done = 1; lines.push(`${q.week ? 'Grande Feito da semana' : 'Missão do dia'} cumprida: ${q.name.replace('Grande Feito: ', '')} (+${fmt(q.xp)} de glória).`); addGlory(g, q.xp, lines, who); } }
  return changed;
}

/** o dízimo: 4% do XP do membro (já tirado dele no cliente) vira glória; "Dízimo Justo" faz render mais sem tirar mais */
function tithe(g, xp, who, lines) { addGlory(g, xp * (1 + 0.15 * rank(g, 'dizimo')), lines, who); }

/** doação ao cofre: primeiro paga a dívida; 10 de ouro = 1 de glória */
function donate(g, gold, who, lines) {
  gold = Math.max(0, Math.floor(gold)); if (!gold) return;
  const toDebt = Math.min(g.debt || 0, gold); g.debt = (g.debt || 0) - toDebt; g.cofre = (g.cofre || 0) + gold - toDebt;
  lines.push(`${g.members[who]?.name ?? who} doou ${fmt(gold)} de ouro ao cofre${toDebt ? ` (${fmt(toDebt)} pagaram a dívida${g.debt ? `; ainda faltam ${fmt(g.debt)}` : ': a guilda está em dia'})` : ''}.`);
  progress(g, 'cofre', gold, lines, who); addGlory(g, gold / 10, lines, who);
}

/** o líder põe um ponto numa habilidade. Devolve o texto do erro, ou null se deu certo */
function learn(g, id) {
  const S = SKILLS[id]; if (!S) return 'Essa habilidade não existe.'; if ((g.lvl || 1) < S.lvl) return `Abre no nível ${roman(S.lvl)} da guilda.`;
  if (rank(g, id) >= S.max) return 'Já está no grau máximo.'; if (pointsLeft(g) <= 0) return 'A guilda não tem pontos de habilidade livres. Subam de nível.';
  g.skills ||= {}; g.skills[id] = rank(g, id) + 1; return null;
}

const roman = (n) => ['', 'I', 'II', 'III', 'IV', 'V'][n] || String(n);
const fmt = (n) => Math.round(n).toLocaleString('pt-BR');
/** o que vai para o cliente */
const view = (g) => ({ lvl: g.lvl || 1, xp: Math.floor(g.xp || 0), need: NEED[Math.min(MAX_LVL, (g.lvl || 1) + 1)] || 0, prevNeed: NEED[g.lvl || 1] || 0, max: (g.lvl || 1) >= MAX_LVL, cap: capOf(g), cofre: g.cofre || 0, debt: g.debt || 0, tax: taxOf(g), miss: g.miss || null, week: g.week || null, skills: g.skills || {}, points: pointsLeft(g), tithe: TITHE });

module.exports = { NEED, CAP, MAX_LVL, TITHE, POINTS, SKILLS, dayKey, weekKey, taxOf, capOf, rollDay, addGlory, progress, tithe, donate, learn, view, roman };
