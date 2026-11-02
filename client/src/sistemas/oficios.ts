/* OFÍCIOS: machado, picareta, faca e alicate — cortar, minerar, esfolar, colher ervas; galhos e pedrinhas; ervas colhidas e o brilho delas. Saiu do main.ts (02/11). */
import { type ToolSlot } from '../tools';
import { type EnemyType, heightAt, veinOf } from '../world';
import { ITEMS as ITEMS_TBL } from '../inventory';
import { TILE_M as T } from '@karmika/shared';
import type { OficiosCtx } from '../main';

/* ---------- OFÍCIOS: machado, picareta, faca e alicate ----------
   Um E começa o trabalho; o herói repete o golpe sozinho (cada golpe é uma animação inteira, lenta) até acabar,
   até você andar, entrar em combate ou apertar E de novo. A ferramenta aparece na mão com o metal do seu nível;
   quanto melhor ela, mais cada golpe avança, mais rende e mais achados raros. */
export type WorkKind = 'chop' | 'mine' | 'skin' | 'herb';
export function createOficios(K: OficiosCtx) {
const WORK: Record<WorkKind, { slot: ToolSlot; anim: 'chop' | 'mine' | 'skin' | 'herb'; hit: number; verb: string; icon: string; kneel?: boolean }> = {
  chop: { slot: 'axe', anim: 'chop', hit: 0.55, verb: 'Cortando árvore', icon: '🪓' },
  mine: { slot: 'pick', anim: 'mine', hit: 0.58, verb: 'Minerando', icon: '⛏' },
  skin: { slot: 'knife', anim: 'skin', hit: 0.6, verb: 'Esfolando', icon: '🔪', kneel: true },
  herb: { slot: 'shears', anim: 'herb', hit: 0.5, verb: 'Colhendo', icon: '✂', kneel: true },
};
/** feras que deixam o corpo: couro e carne só saem com a faca (need = trabalho total; tier = faca mínima) */
const SKIN: Partial<Record<EnemyType, { hide: [number, number]; meat: [number, number]; need: number; tier?: number; special?: string }>> = {
  deer: { hide: [1, 2], meat: [2, 3], need: 4 }, boar: { hide: [1, 2], meat: [2, 4], need: 5 }, wolf: { hide: [1, 1], meat: [1, 2], need: 4 }, frostwolf: { hide: [1, 2], meat: [1, 2], need: 4 },
  coyote: { hide: [1, 1], meat: [1, 1], need: 3 }, werewolf: { hide: [0, 0], meat: [0, 0], need: 9, tier: 4, special: 'hide_w' },
};
const HERBS = [{ id: 'herb_g', name: 'Folha-de-Prata', tier: 1, need: 3 }, { id: 'herb_s', name: 'Cogumelo-Lamparina', tier: 1, need: 3 }, { id: 'herb_r', name: 'Raiz-Sangue', tier: 2, need: 4 }, { id: 'herb_m', name: 'Flor-de-Marghar', tier: 3, need: 5 }, { id: 'herb_j', name: 'Junco-do-Rio', tier: 0, need: 3 }, { id: 'herb_f', name: 'Flor-de-Campo', tier: 0, need: 2 }]; // flor e junco saem com a mão; o resto pede alicate
let work: { kind: WorkKind; target: object; x: number; z: number; prog: number; need: number; hitDone: boolean; strokes: number } | null = null;
const workBar = document.createElement('div'); workBar.id = 'workbar'; workBar.innerHTML = '<span class="wl"></span><div class="wb"><i></i></div>'; document.body.appendChild(workBar);
const pebbles = new Map<object, number>();
function gatherTwigs(p: object) { const c = K.twigs.get(p) ?? 0; if (c >= 2) { K.game.logMsg('Precisa de um machado para cortar. Crie um (I) ou compre com Tomás.', '#ff9a8a'); return; } K.twigs.set(p, c + 1); K.hero.act('herb'); K.inv.add('stick', 1 + (Math.random() < 0.5 ? 1 : 0)); if (Math.random() < 0.15) K.inv.add('apple', 1); }
function gatherPebbles(p: object) { const c = pebbles.get(p) ?? 0; if (c >= 3) { K.game.logMsg('Sem picareta, só dá para juntar o que já está solto. Crie uma (I).', '#ff9a8a'); return; } pebbles.set(p, c + 1); K.hero.act('herb'); K.inv.add('stone', 1); }
function startWork(kind: WorkKind, target: object, x: number, z: number) {
  if (work) { endWork('Você para o trabalho.'); return; }
  const W = WORK[kind], tool = K.inv.tool(W.slot); if (!tool) return;
  if (K.combatMode) K.setCombat(false); if (K.riding) K.setRiding(false, true);
  const need = kind === 'chop' ? K.CHOPS : kind === 'mine' ? K.rockState(target as (typeof K.city.props)[number]).max : kind === 'skin' ? SKIN[(target as { type: EnemyType }).type]!.need : HERBS[(target as { variant?: number }).variant ?? 0].need;
  const prog = kind === 'chop' ? K.chop.get(target) ?? 0 : kind === 'mine' ? need - K.rockState(target as (typeof K.city.props)[number]).left : 0;
  work = { kind, target, x, z, prog, need, hitDone: true, strokes: 0 };
  K.state.path = []; K.hero.holdTool = true; K.hero.kneel = !!W.kneel; K.hero.setGear({ weapon: { base: tool.base, rarity: 'normal', tint: tool.tint, glow: tool.glow } });
  workBar.classList.add('on'); drawWork();
}
function endWork(msg?: string, col = '#c8d8f0') { if (!work) return; work = null; K.hero.kneel = false; K.hero.holdTool = !!K.fishing; K.syncGear(); workBar.classList.remove('on'); if (msg) K.game.logMsg(msg, col); }
function drawWork() { if (!work) return; const W = WORK[work.kind], tool = K.inv.tool(W.slot); const k = Math.min(1, work.prog / work.need);
  (workBar.querySelector('.wl') as HTMLElement).innerHTML = `${W.icon} ${W.verb} — <b>${tool?.name ?? ''}</b> <i>${'★'.repeat(tool?.tier ?? 0)}</i> · ${Math.round(k * 100)}% <small>(E: parar)</small>`;
  (workBar.querySelector('.wb i') as HTMLElement).style.width = `${k * 100}%`; }
function updateWork() {
  K.game.setWork(work ? { x: work.x, z: work.z } : null);
  if (!work) return;
  if (K.keys.has('w') || K.keys.has('a') || K.keys.has('s') || K.keys.has('d') || K.state.path.length || K.game.menuOpen || K.combatMode || K.game.st.dead || K.inside) { endWork('Você interrompe o trabalho.'); return; }
  const W = WORK[work.kind], tool = K.inv.tool(W.slot); if (!tool) { endWork(); return; }
  if (work.kind === 'skin') { const e = work.target as { state: string; active: boolean }; if (e.state !== 'dead' || !e.active) { endWork('A carcaça se foi.'); return; } }
  if (!K.hero.acting) { if (K.hero.act(W.anim)) { work.hitDone = false; work.strokes++; } return; }
  if (!work.hitDone && K.hero.actName === W.anim && K.hero.actP >= W.hit) { work.hitDone = true; workHit(work, K.kitRace() === 'tecno' || K.state.race === 'technocrat' ? { ...tool, power: tool.power * 1.25 } : tool); drawWork(); } // a esfera do tecnocrata ajuda: +25% por golpe
}
function workHit(w: NonNullable<typeof work>, tool: NonNullable<ReturnType<typeof K.inv.tool>>) {
  K.profs.gain(w.kind === 'chop' ? 'lenhador' : w.kind === 'mine' ? 'minerador' : w.kind === 'skin' ? 'esfolador' : 'herbalista', 2);
  const gy0 = heightAt(w.x, w.z), px = w.x, pz = w.z, rnd = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));
  if (w.kind === 'chop') {
    const p = w.target as (typeof K.city.props)[number]; w.prog += tool.power; K.chop.set(p, w.prog); K.audio.slash?.();
    for (let i = 0; i < 10; i++) K.particles.spawn(px, gy0 + 1.1, pz, { vx: (Math.random() - 0.5) * 3, vy: 1 + Math.random() * 2.5, vz: (Math.random() - 0.5) * 3, life: 0.6, s0: 0.14, s1: 0.04, c0: 0xd9b27a, c1: 0x7a5532, a: 0.9, g: 9 });
    const got = Math.max(1, Math.round(rnd(1, 2) * tool.yield * (0.8 + Math.random() * 0.4))); K.inv.add('wood', got, true); if (Math.random() < 0.3) K.inv.add('stick', 1, true); K.game.logMsg(`🪓 +${got} madeira`, '#d9b27a');
    if (w.prog >= K.CHOPS) {
      K.objs.removeProp(p); K.city.map[p.gy][p.gx] = 'grass'; K.chop.delete(p);
      for (let i = 0; i < 40; i++) K.particles.spawn(px + (Math.random() - 0.5) * 2, gy0 + 2 + Math.random() * 3, pz + (Math.random() - 0.5) * 2, { vx: (Math.random() - 0.5) * 2, vy: -0.5, vz: (Math.random() - 0.5) * 2, life: 1.4, s0: 0.3, s1: 0.1, c0: 0x6ab04a, c1: 0x3f7a3a, a: 0.9, g: 2, flit: 2 });
      const bonus = Math.round((8 + Math.floor(Math.random() * 6)) * tool.yield); K.inv.add('wood', bonus); if (Math.random() < 0.3) K.inv.add('apple', 1 + Math.floor(Math.random() * 2)); if (Math.random() < tool.luck) { K.inv.add('sap', 1); K.game.logMsg('🍯 O cerne da árvore guardava seiva viva.', '#d0a030'); }
      K.regrow.push({ gx: p.gx, gy: p.gy, height: p.height, variant: p.variant, at: Date.now(), stage: 0 }); K.saveRegrow(); K.audio.boom(); K.feats.bump('trees');
      endWork('🌳 A árvore cai. O toco rebrota com os turnos.', '#8fd08a');
    }
  } else if (w.kind === 'mine') {
    const p = w.target as (typeof K.city.props)[number], R = K.rockState(p), size = Math.max(1, p.w * p.h), vein = veinOf(p);
    R.left = Math.max(0, R.left - tool.power); w.prog = R.max - R.left; K.audio.block?.();
    for (let i = 0; i < 10; i++) K.particles.spawn(px, gy0 + 0.5, pz, { vx: (Math.random() - 0.5) * 2.4, vy: 1 + Math.random() * 2, vz: (Math.random() - 0.5) * 2.4, life: 0.5, s0: 0.16, s1: 0.04, c0: vein === 2 ? 0xffffff : 0xcfcfcf, c1: vein === 1 ? 0xa0582e : 0x888888, a: 0.9, g: 8 });
    const got = Math.max(1, Math.round((1 + Math.floor(Math.random() * (1 + Math.min(2, size)))) * tool.yield)); K.inv.add('stone', got, true); let note = `⛏ +${got} pedra`;
    if (vein === 1) { if (tool.tier >= 2) { if (Math.random() < 0.28 + tool.luck) { K.inv.add('ore_i', 1, true); K.feats.bump('ore_i'); note += ' · +1 minério de ferro'; } } else if (!(w as { warned?: boolean }).warned) { (w as { warned?: boolean }).warned = true; K.game.logMsg('🟤 Há ferro nesse veio, mas a picareta de pedra só arranha. Precisa de uma de ferro (★★).', '#ffb080'); } }
    if (vein === 2) { if (tool.tier >= 3) { if (Math.random() < 0.2 + tool.luck) { K.inv.add('ore_ag', 1, true); K.feats.bump('ore_ag'); note += ' · +1 minério de prata'; } } else if (tool.tier >= 2 && Math.random() < 0.2) { K.inv.add('ore_i', 1, true); note += ' · +1 minério de ferro'; } else if (!(w as { warned?: boolean }).warned) { (w as { warned?: boolean }).warned = true; K.game.logMsg('⚪ Um veio de prata. Só aço (★★★) o arranca da rocha.', '#dde3ec'); } }
    if (tool.tier >= 3 && Math.random() < tool.luck * 0.12) { K.inv.add('gem', 1); K.feats.bump('gem'); K.game.logMsg('💎 Uma gema bruta brilha entre as lascas!', '#7ad0ff'); }
    K.game.logMsg(note, '#cfcfcf');
    if (R.left <= 0) { const bonus = Math.round((5 + size * 3) * tool.yield); K.inv.add('stone', bonus); K.feats.bump('rocks'); R.at = Date.now(); K.audio.boom(); endWork(`🪨 A rocha racha: +${bonus} pedra. Ela se refaz com os turnos.`, '#cfcfcf'); }
  } else if (w.kind === 'skin') {
    const e = w.target as { type: EnemyType; def: { name: string }; skinned?: boolean; corpse?: number; t: number }; const S = SKIN[e.type]!;
    w.prog += tool.power; K.audio.slash?.();
    for (let i = 0; i < 6; i++) K.particles.spawn(px, gy0 + 0.25, pz, { vx: (Math.random() - 0.5) * 1.2, vy: 0.4 + Math.random(), vz: (Math.random() - 0.5) * 1.2, life: 0.5, s0: 0.1, s1: 0.03, c0: 0x9a1a1a, c1: 0x5a0a0a, a: 0.9, g: 6 });
    if (w.prog >= S.need) {
      e.skinned = true; e.corpse = e.t + 1.6; K.feats.bump('skins'); // o que sobra afunda na terra
      const got: string[] = [];
      if (S.special) { K.inv.add(S.special, 1); got.push(`1 ${ITEMS_TBL[S.special].name}`); }
      const h = Math.round(rnd(S.hide[0], S.hide[1]) * tool.yield), m = Math.round(rnd(S.meat[0], S.meat[1]) * tool.yield);
      // couro fino: só sai inteiro com faca boa; faca rústica às vezes rasga a pele
      let hide = h; if (tool.tier <= 1 && hide > 0 && Math.random() < 0.35) { hide--; K.game.logMsg('🔪 A faca de sílex rasgou parte da pele.', '#d0907a'); }
      if (hide > 0 && tool.tier >= 2 && Math.random() < tool.luck + (tool.tier >= 3 ? 0.2 : 0)) { K.inv.add('hide_f', 1); K.feats.bump('hide_f'); got.push('1 Couro fino'); hide--; }
      if (hide > 0) { K.inv.add('hide', hide, true); got.push(`${hide} Couro`); } if (m > 0) { K.inv.add('meat', m, true); got.push(`${m} Carne crua`); }
      if (Math.random() < 0.25) { K.inv.add('claw', 1, true); got.push('1 Garra'); }
      endWork(`🔪 Você esfolou ${e.def.name}: ${got.join(', ') || 'nada aproveitável'}.`, '#e0b080');
    }
  } else {
    const p = w.target as (typeof K.city.props)[number], H = HERBS[p.variant ?? 0]; w.prog += tool.power;
    for (let i = 0; i < 5; i++) K.particles.spawn(px, gy0 + 0.35, pz, { vx: (Math.random() - 0.5) * 1, vy: 0.5 + Math.random(), vz: (Math.random() - 0.5) * 1, life: 0.7, s0: 0.08, s1: 0.02, c0: 0xc8f0c0, c1: 0x5a9a4a, a: 0.9, g: 3 });
    if (w.prog >= H.need) {
      const n = Math.max(1, Math.round(rnd(1, 2) * tool.yield)); K.inv.add(H.id, n, true); K.feats.bump('herbs', n); if (H.id === 'herb_m') K.feats.bump('herb_m'); let msg = `✂ +${n} ${H.name}`;
      if (H.tier < 3 && tool.tier >= 3 && Math.random() < tool.luck * 0.25) { K.inv.add('herb_m', 1, true); K.feats.bump('herb_m'); msg += ' · e uma Flor-de-Marghar escondida entre as folhas!'; }
      K.objs.removeProp(p); (p as { gone?: boolean }).gone = true; picked.push({ gx: p.gx, gy: p.gy, at: Date.now() }); savePicked();
      endWork(msg, '#9ad0a0');
    }
  }
}
(window as unknown as { __work: unknown }).__work = { start: (k: WorkKind, tg: object, x: number, z: number) => startWork(k, tg, x, z), get w() { return work; } };
/* ervas colhidas voltam com os turnos (a raiz fica) */
const picked: { gx: number; gy: number; at: number }[] = (() => { try { return JSON.parse(localStorage.getItem('karmika.picked.v1') || '[]'); } catch { return []; } })();
const savePicked = () => { try { localStorage.setItem('karmika.picked.v1', JSON.stringify(picked)); } catch { /* */ } };
const herbAt = (gx: number, gy: number) => (K.tileIdx.get(gy * 1000 + gx) ?? []).find((q) => q.kind === 'herb');
for (const pk of picked) { const p = herbAt(pk.gx, pk.gy); if (p) { (p as { gone?: boolean }).gone = true; K.objs.removeProp(p); } }
function updatePicked() { const now = Date.now(); for (let i = picked.length - 1; i >= 0; i--) if (now - picked[i].at > K.TURN_MS * 2) { const p = herbAt(picked[i].gx, picked[i].gy); picked.splice(i, 1); if (p) { (p as { gone?: boolean }).gone = false; K.objs.removeProp(p); (p as { gone?: boolean }).gone = false; const i2 = K.city.props.indexOf(p); if (i2 >= 0) K.city.props.splice(i2, 1); K.objs.addProp(p); } } savePicked(); }
/* brilho discreto sobre as ervas próximas: o olho acha a planta no mato sem poluir a tela */
let herbGlowT = 0;
function herbSparkle(dt: number) { herbGlowT -= dt; if (herbGlowT > 0 || K.inside) return; herbGlowT = 0.45; const gx = Math.floor(K.state.fx), gy = Math.floor(K.state.fy);
  for (const p of K.nearProps(gx, gy, ['herb'], 9)) { if (Math.random() > 0.5) continue; const x = (p.gx + 0.5) * T + (Math.random() - 0.5) * 0.6, z = (p.gy + 0.5) * T + (Math.random() - 0.5) * 0.6; const c = [0xdfffe0, 0xffd27a, 0xff6a7a, 0x9ad7ff][p.variant ?? 0];
    K.particles.spawn(x, heightAt(x, z) + 0.5, z, { vy: 0.35, life: 1.1, s0: 0.12, s1: 0.02, c0: 0xffffff, c1: c, a: 0.85, flit: 1 }); } }
function interact() { if (work) { endWork('Você para o trabalho.'); return; } const i = K.findInter(); if (i) i.act(); }
  return { get work() { return work; }, WORK, SKIN, interact, startWork, gatherTwigs, pebbles, gatherPebbles, HERBS, picked, savePicked, updateWork, herbSparkle, updatePicked };
}
