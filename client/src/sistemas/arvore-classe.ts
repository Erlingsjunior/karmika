/* ÁRVORE KÁRMICA DE MAGIAS e o que a classe pede: o título da árvore, os kits por classe, a fúria do guerreiro, o medidor da necessidade (sangue, lua) e o banquete depois do abate. Saiu do main.ts (02/11). */
import { type Only, tipCtx } from '../loot';
import { type KitKey, setKitExtras, KITS, applyKit } from '../kits';
import { type Race, RACES } from '@karmika/shared';
import { createSkillTree } from '../skilltree';
import { createTalents } from '../talentos';
import { loadComp, onCompLoad, passMods, passSpent, classStats } from '../passivas';
import { createMail } from '../mail';
import { isTool as isToolId } from '../tools';
import { ITEMS as ITEMS_TBL } from '../inventory';
import { createProfessions } from '../professions';
import { heightAt } from '../world';
import { profLevelUp } from '../celebrate';
import type { ArvoreClasseCtx } from '../main';

export function createArvoreClasse(K: ArvoreClasseCtx) {
/* ---------- árvore kármica de magias ---------- */
/* o nome da árvore segue quem você é agora: Humano/Humana até escolher o caminho; depois a classe, no feminino ou no masculino */
const FEM: Record<string, string> = { 'Humano': 'Humana', 'Guerreiro do Norte': 'Guerreira do Norte', 'Paladino de Auréon': 'Paladina de Auréon', 'Caçador de Demônios': 'Caçadora de Demônios', 'Vampiro': 'Vampira', 'Lobisomem': 'Mulher-Loba', 'Mago': 'Maga', 'Bruxo': 'Bruxa', 'Anão': 'Anã', 'Elfo': 'Elfa' };
const treeTitle = () => { let n = 'Humano'; try { n = K.game.classInfo.name || n; } catch { /* */ } return K.profile?.sex === 'f' ? FEM[n] ?? n : n; };
/* quem ainda não escolheu caminho (humano de origem, classe "Humano") usa a árvore e a barra do Humano */
/** armas de caminho (loot.ts, Only): o Caçador de Demônios e o Tecnocrata depois da prova do mestre; os anões pela raça */
function walksPath(o: Only): boolean { if (o === 'dwarf') return K.profile?.origin === 'dwarf'; try { return K.profile?.path === o && K.quests.q.done.includes('v_' + o); } catch { return false; } }
tipCtx.can = walksPath;
const kitOfClass = (n: string): KitKey => { if (n === 'Tecnocrata' && K.state.race !== 'technocrat') return 'tecno'; if (n === 'Paladino de Auréon') return 'pal'; if (n === 'Vampiro') return 'vam'; if (n === 'Lobisomem') return 'lob'; if (n === 'Mago') return 'mag'; if (n === 'Bruxo') return 'bru'; if (n === 'Caçador de Demônios') return 'cac'; if (K.profile?.origin === 'elf' && (n === 'Humano' || n === 'Elfo' || n === 'Elfa')) return 'elf'; /* 04/11: o elfo tem o kit próprio */ return K.state.race === 'nordic' && (K.profile?.origin ?? 'human') === 'human' && n === 'Humano' ? 'human' : K.kindOf(K.state.race) as Race; };
const kitRace = (): KitKey => { let n = 'Humano'; try { n = K.game.classInfo.name || n; } catch { /* */ } return kitOfClass(n); };
/** as árvores que a alma já percorreu, em ordem (origem → classes passadas → a atual): as abas da Árvore Kármica */
const ownedKits = (): KitKey[] => { let ci: { name: string; past?: { name: string }[] } = { name: 'Humano' }; try { ci = K.game.classInfo; } catch { /* */ } const L = ['Humano', ...(ci.past ?? []).map((p) => p.name), ci.name || 'Humano'].map(kitOfClass); return [...new Set(L)]; };
const kitName = (k: KitKey): string => { let ci: { name: string; past?: { name: string }[] } = { name: 'Humano' }; try { ci = K.game.classInfo; } catch { /* */ } const n = ['Humano', ...(ci.past ?? []).map((p) => p.name), ci.name].find((x) => x && kitOfClass(x) === k) ?? 'Humano'; return K.profile?.sex === 'f' ? FEM[n] ?? n : n; };
/** a barra da classe atual + as magias aprendidas nas abas anteriores (nos espaços livres) */
function applyKitAll() { const cur = kitRace(); setKitExtras(cur, ownedKits().filter((k) => k !== cur).flatMap((k) => (KITS[k] ?? []).filter((d) => tree.rank(d.id, k) > 0))); applyKit(cur, K.game.st.lvl, (k) => tree.rank(k)); }
/** os níveis de classe da vida inteira: a classe atual + as que vieram antes (a árvore é uma só e continua subindo) */
const clsLvl = () => { try { const c = K.game.classInfo; return c.lvl + (c.past ?? []).reduce((a: number, q: { lvl: number }) => a + (q.lvl ?? 0), 0); } catch { return 1; } };
const tree = createSkillTree(kitRace, () => K.game.st.lvl, (t, c) => K.game.logMsg(t, c), treeTitle, ownedKits, kitName);
/* 03/11: as passivas do compêndio (passivas.ts) somam por cima do rank da magia */
const compKit = (): string => { const k = kitRace() as string; return k === 'human' && K.profile?.origin === 'elf' ? 'elf' : k === 'human' && K.profile?.origin === 'dwarf' ? 'dwarf' : k; };
const kitSkills = () => (KITS[kitRace()] ?? []).map((d) => ({ id: d.id as string, name: d.name, k: d.k }));
/* 04/11 (Erling: "as passivas não mudam com a classe, mudam de raça para raça: humanos têm Determinação, Não se Entrega, Firmeza do Povo…
   anões têm outras, elfos outras"): as PASSIVAS são da RAÇA de nascimento (humano, anão ou elfo), em qualquer classe e grau de classe.
   As MAGIAS continuam da classe (e do grau da classe); os TALENTOS são uma árvore só, igual para todos. */
const passKit = (): string => { const o = K.profile?.origin; return o === 'elf' || o === 'dwarf' ? o : 'human'; };
/* O MONTE ÚNICO (04/11): 3 pontos por nível de classe (somando as classes da vida) + 3 do começo (as três básicas); gastos em habilidades,
   passivas ou talentos — o que sobra aparece nas três abas */
tree.setTotal(() => 3 + 3 * clsLvl());
tree.setExtraSpent(() => passSpent([passKit()]) + talents.spent());
loadComp(compKit()); loadComp(passKit()); onCompLoad(() => K.game.st.recalc?.());
K.game.setSkillScale((id) => { const b = tree.scale(id), m = passMods(passKit(), id, kitSkills()); return { ...b, dmg: b.dmg * (1 + m.dmg), area: b.area * (1 + m.area), range: b.range * (1 + m.area * 0.6), dur: b.dur * (1 + m.dur), cost: b.cost * (1 - m.cost), crit: m.crit, cdr: m.cdr, heal: m.heal }; });
/* árvore de talentos (03/11): a constelação da classe; anão e elfa sem caminho usam a do próprio povo */
/* 04/11 (Erling: "a árvore de talentos dá velocidade, defesa, vitalidade, força, destreza… pode ser a mesma em todas as classes e níveis
   de classe, ela vai subindo e auxiliando o personagem"): UMA árvore para todos (raça e classe não mudam a árvore) */
const talentKit = (): string => 'geral';
const talents = createTalents(talentKit, clsLvl, () => { K.game.st.recalc?.(); }, () => tree.available());
let treeSel: string | null = null;
const SHADE_TOWNS = new Set(['Corvoscuro']);
/** guerreiro do Norte: classe ou caminho validado */
function isWarrior() { let n = ''; try { n = K.game.classInfo.name; } catch { /* */ } return n === 'Guerreiro do Norte' || K.myPath() === 'gue'; }
let furyDriftT = 0;
/* medidor da necessidade da classe (25/10): ⚛ Reator do tecnocrata, 🍖 Fome do lobisomem, 🩸 Sede do vampiro — sobre o orbe da magia */
const needEl = document.createElement('div'); needEl.id = 'need'; document.body.appendChild(needEl); let needT = 0, needKey = '';
function needGauge() { const t = performance.now(); if (t < needT) return; needT = t + 400; const k = kitRace();
  let html = '', tip = '';
  if (k === 'tecno' && false) { const r = K.game.reactor(), p = Math.round(r.charge * 100); html = `<b>⚛</b><i><s style="width:${p}%;background:${p < 15 ? '#ff7a4a' : '#5ae0ff'}"></s></i><em>${p}%</em>`; tip = `Reator pessoal Mk ${r.tier === 2 ? 'II' : 'I'}: ${p}%. Vazio = sem Energia e a esfera apaga. Troque o Núcleo (Companhia de Latão).`; }
  else if (k === 'lob' || k === 'vam') { const c = K.game.crave(), p = Math.round(c.v * 100), L = k === 'lob'; html = `<b>${L ? '🍖' : '🩸'}</b><i><s style="width:${p}%;background:${p > 90 ? '#ff3a3a' : p > 60 ? '#ff9a4a' : '#c23a4a'}"></s><s class="fl" style="left:${Math.round(c.floor * 100)}%"></s></i><em>${p}%</em>`; tip = `${L ? 'Fome de carne' : 'Sede de sangue'}: ${p}%. Acima de 60% você fica mais lento e fraco. A risca é o piso: ${L ? 'carne' : 'sangue'} de bicho não desce abaixo dela. ${L ? 'Charcutaria Secular (vampiros de Corvoscuro)' : 'Injeção Automática (tecnocratas)'} sacia sem vítima.`; }
  if (k === 'pal') { const dv = K.game.doubt(), p = Math.round(dv.v * 100); html = `<b>✝</b><i><s style="width:${p}%;background:${p > 80 ? '#ff6a4a' : p > 50 ? '#e8c050' : '#f0e0a0'}"></s></i><em>${p}%</em>`; tip = `Dúvida: ${p}%. Acima de 50%: a Luz responde menos (−6% de dano). Acima de 80%: a fé vacila, as escolhas boas não pesam e o karma escorre. Jejum e Oração: Pão Ázimo + Vinho Santo dos Anões.`;
    if (dv.v > 0.8) { furyDriftT += 0.4; if (furyDriftT >= 480) { furyDriftT = 0; K.addKarma(-(1)); K.game.logMsg('✝ A dúvida corrói a fé (−1 de karma).', '#ff8a6a'); } } }
  { const n3 = K.game.need3(); if (!html && n3) { const p = Math.round(n3.v * 100), I = { mag: '🔮', bru: '🜏', cac: '👁' }[n3.k], N = { mag: 'Ressonância Arcana', bru: 'Dívida do Pacto', cac: 'Vigília' }[n3.k]; html = `<b>${I}</b><i><s style="width:${p}%;background:${p > 80 ? '#ff5a4a' : p > 50 ? '#c08aff' : '#8a7ad0'}"></s></i><em>${p}%</em>`;
    tip = `${N}: ${p}%. ` + ({ mag: 'Acima de 50%: magia volta 30% mais devagar, −4% de dano. Acima de 80%: Soberba — boas escolhas não pesam e a magia pode rachar na mão. Ritual do Aterramento: Unguento da Terra (lobisomens) + Água Benta (paladinos).', bru: 'Acima de 50%: Malgrath segura 10% da vida. Acima de 80%: boas escolhas não pesam e o Cobrador do Pacto aparece. Oferenda: Coração de Demônio (caçadores) + Chifre de Sangue (guerreiros).', cac: 'Acima de 50%: −5% de crítico e −4% de dano. Acima de 80%: Paranoia — confiar não pesa. Sono Guardado: Pó do Sono (bruxos) + Sino de Guarda (tecnocratas).' } as Record<string, string>)[n3.k];
    if (n3.v > 0.8) { furyDriftT += 0.4; if (furyDriftT >= 480) { furyDriftT = 0; K.addKarma(-(1)); K.game.logMsg('A fraqueza come a alma por dentro (−1 de karma).', '#ff8a6a'); } } } }
  if (!html && isWarrior()) { const f = K.game.fury(), p = Math.round(f.v * 100); html = `<b>🪓</b><i><s style="width:${p}%;background:${p > 80 ? '#ff3a3a' : p > 50 ? '#ff9a3a' : '#c8a060'}"></s></i><em>${p}%</em>`; tip = `Fúria: ${p}%. Acima de 50%: frenesi (+5% de dano, apanha 6% mais). Acima de 80%: loucura — as escolhas boas não pesam e a alma escurece. Ritual de calmaria: Kit de Incensos de Mortificação (magos de Lumenhal ou bruxa de Gorvath).`;
    if (f.v > 0.8) { furyDriftT += 0.4; if (furyDriftT >= 480) { furyDriftT = 0; K.addKarma(-(1)); K.game.logMsg('🪓 A loucura come a alma por dentro (−1 de karma).', '#ff8a6a'); } } }
  const key = html; if (key !== needKey) { needKey = key; needEl.innerHTML = html; needEl.title = tip; needEl.style.display = html ? 'flex' : 'none'; } }
/* a fome da fera (25/10): gente morta pelo lobisomem ou pelo vampiro vira refeição — e pesa muito no karma */
const PEOPLE = new Set(['soldier', 'cultist', 'darkpal', 'templar', 'hunter', 'pilgrim']);
const BEASTS_FOOD = new Set(['deer', 'boar', 'wolf', 'coyote', 'frostwolf']);
function feastOnKill(t: string, e?: { def?: { rig?: string; human?: { kind?: string; civil?: string } } }) { const k = kitRace(); if (k !== 'lob' && k !== 'vam') return;
  /* carne RACIAL, não só humana (Erling): humano, anão (carne dura) ou elfo (carne magra) */
  const hu = e?.def?.human, ppl = (PEOPLE.has(t) || e?.def?.rig === 'human') && t !== 'vampire';
  if (ppl) { const race = hu?.kind === 'dwarf' ? 'dwarf' : hu?.civil === 'elf' || t === 'pilgrim' ? 'elf' : 'human'; K.game.feed('human');
    const L = k === 'lob', fl = race === 'dwarf' ? (L ? 'Carne de anão: dura de mastigar, mas sustenta.' : 'Sangue de anão: grosso, quente, com gosto de ferro e cerveja.') : race === 'elf' ? (L ? 'Carne de elfo: magra, quase sem gordura, e deixa um gosto de seiva.' : 'Sangue élfico: fino e frio, com um brilho que demora a sair da boca.') : (L ? 'Carne humana: é dela que a fera mais sente falta.' : 'Sangue humano: o mais doce de todos.');
    K.game.logMsg(`☠ ${fl} O Banquete cobra: 20 turnos de paz roubados e uma vida, −21 de karma.`, '#ff6a5a'); K.addKarma(-(21)); }
  else if (BEASTS_FOOD.has(t)) K.game.feed('animal'); }
const SHOP_BY_NAME = new Map<string, string>(); for (const st of K.city.settlements) for (const n of st.npcs) if (n.shop) SHOP_BY_NAME.set(n.name, n.shop); for (const n of K.npcSys.npcs) if (n.def.role === 'Mercador viajante') SHOP_BY_NAME.set(n.def.name, 'mercador');
/* correio: caixas em cada povoado */
const mail = createMail({ me: () => K.profile?.name || RACES[K.state.race].label, st: K.game.st,
  town: () => { const hx = K.state.fx, hy = K.state.fy; let b = K.city.settlements[0]; for (const t of K.city.settlements) if (Math.hypot(t.x - hx, t.y - hy) < Math.hypot(b.x - hx, b.y - hy)) b = t; return b?.name ?? 'Karmika'; },
  items: () => Object.keys(K.inv.bag).filter((k) => K.inv.bag[k] > 0 && !isToolId(k)).map((id) => ({ id, n: K.inv.bag[id], name: ITEMS_TBL[id]?.name ?? id, icon: ITEMS_TBL[id]?.icon ?? '•' })),
  gear: () => K.inv.gearBag, take: (id, n) => K.inv.take(id, n), add: (id, n) => K.inv.add(id, n),
  takeGear: (uid) => { const i = K.inv.gearBag.findIndex((g) => g.uid === uid); if (i < 0) return null; const g = K.inv.gearBag.splice(i, 1)[0]; K.inv.save(); K.inv.refresh(); return g; },
  addGear: (g) => K.inv.addGear(g), itemName: (id) => ITEMS_TBL[id]?.name ?? id, itemIcon: (id) => ITEMS_TBL[id]?.icon ?? '•',
  log: (t, c) => K.game.logMsg(t, c), save: () => K.inv.save(), post: (l) => !!K.netRef && K.netRef.sendMail(l) });
/* profissões: coleta → ofício (Y) */
const profs = createProfessions({ cls: () => { try { return K.game.classInfo.name || 'Humano'; } catch { return 'Humano'; } }, atStation: (prof) => !!K.stationNear(prof), craftFx: (prof) => { const st = K.stationNear(prof); if (!st) return; K.hero.act('cast');
    const [c0, c1, n, up] = prof === 'ferreiro' ? [0xfff0a0, 0xff5a1a, 26, 3] : prof === 'alquimista' ? [0xc8ffd8, 0x3aff8a, 22, 1.6] : prof === 'cozinheiro' ? [0xffffff, 0xb8b0a0, 16, 1.2] : prof === 'marceneiro' ? [0xf0d8a8, 0xb08a5a, 20, 1.4] : [0xe8d8b8, 0x8a6a4a, 14, 1];
    for (let i = 0; i < n; i++) K.particles.spawn(st.x + (Math.random() - 0.5) * 1.2, heightAt(st.x, st.z) + 1.0, st.z + (Math.random() - 0.5) * 1.2, { vx: (Math.random() - 0.5) * 2, vy: up + Math.random() * up, vz: (Math.random() - 0.5) * 2, life: 0.7, s0: 0.12, s1: 0.02, c0, c1, a: 1, drag: 1.4 });
    if (prof === 'ferreiro') K.audio.hit(); else if (prof === 'alquimista') K.audio.cast(); else K.audio.thud(); }, onLevel: (_id, name, icon, l) => { profLevelUp(icon, name, l); K.audio.chime(); dispatchEvent(new CustomEvent('karmika:burst', { detail: { c0: 0xfff0b0, c1: 0x7ac85a, n: 26, small: true } })); }, has: (id, n) => K.inv.has(id, n), count: (id) => K.inv.count(id), take: (id, n) => K.inv.take(id, n), add: (id, n) => K.inv.add(id, n, true), addGear: (g) => K.inv.addGear(g),
  craftJob: (j) => K.craftJob(j), invCraft: (id) => K.inv.craft(id), itemName: (id) => ITEMS_TBL[id]?.name ?? id, itemIcon: (id) => ITEMS_TBL[id]?.icon ?? '•', heroLvl: () => K.game.st.lvl, log: (t, c) => K.game.logMsg(t, c), onCraft: (n) => K.quests.onCraft(n) });
  const classPassStats = () => classStats(passKit());
  return { tree, talents, talentKit, compKit, passKit, kitSkills, classPassStats, applyKitAll, isWarrior, profs, mail, kitRace, walksPath, get treeSel() { return treeSel; }, set treeSel(v: typeof treeSel) { treeSel = v; }, SHOP_BY_NAME, feastOnKill, needGauge, SHADE_TOWNS };
}
