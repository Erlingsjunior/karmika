/* O QUE SÓ O INSTINTO MOSTRA: rastros das missões, espíritos, esconderijos (cachês), o Caderno de Ormund, os alvos sentidos e as falas do herói (instinto.ts). Saiu do main.ts (02/11). */
import { type Cache, CACHE_LORE, createSecrets, type SenseGoal } from '../segredos';
import { nearestFree } from '../nav';
import { regionAt, heightAt } from '../world';
import { makeGhost } from '../fx/fantasma3d';
import { createOrmund } from '../ormund';
import { TILE_M as T } from '@karmika/shared';
import { instinctHint } from '../gritos';
import { createInstinct, type Being, type Place, selfLine } from '../instinto';
import { NPC_SOUL } from '../dados/npcs-dados';
import type { SegredosInstintoCtx } from '../main';

export function createSegredosInstinto(K: SegredosInstintoCtx) {
/* o que só o instinto mostra: rastros das missões, espíritos, dispositivos perdidos e os esconderijos do mundo */
const CACHES: Cache[] = []; setTimeout(() => { const out = CACHES; /* depois do arquivo inteiro carregar (navProbe nasce mais abaixo) */ const src = [...K.city.pois.filter((p) => /ruins|forest|enchanted|blight/.test(p.biome as string)).map((p) => ({ x: p.x, y: p.y })), ...K.evSites.sitesForest.filter((_, i) => i % 9 === 0)];
  const h = (n: number) => { const x = Math.sin(n * 91.7 + 13.1) * 43758.5453; return x - Math.floor(x); };
  src.forEach((p, i) => { if (h(i) > 0.55 || out.length >= 36) return; const x = Math.round(p.x + (h(i * 3) - 0.5) * 14), y = Math.round(p.y + (h(i * 7) - 0.5) * 14); const fr = nearestFree(K.navProbe, x, y, 4); if (!fr) return; const [name, lore] = CACHE_LORE[out.length % CACHE_LORE.length]; out.push({ id: 'c' + i, x: Math.round(fr.x), y: Math.round(fr.y), name, lore, tier: regionAt(x, y).lo }); }); }, 0);
/* espírito de verdade (25/10, Erling: "um efeito de espírito com transparência, um personagem morto transparente — não um bloco feio"):
   o corpo inteiro de uma pessoa, quase invisível no miolo e acendendo nas bordas (fresnel), sumindo nos pés como névoa e tremeluzindo de leve */
const secrets = createSecrets({ ghost: () => makeGhost(), scene: K.scene, heightAt, hero: () => K.heroPos, color: () => K.myInstinct().color, inside: () => !!K.inside,
  bubble: (x, y, z, tx) => K.carBubble(x, y, z, tx), log: (tx, c) => K.game.logMsg(tx, c), squeak: (v) => K.audio.squeak(v),
  nest: (x, y, z) => { /* o que a ratazana guardou: moedas, uma coisa da despensa e, às vezes, uma peça de verdade */ const lv = Math.max(1, K.game.st.lvl), g = 8 + Math.round(lv * (1.5 + Math.random() * 2)); K.game.st.gold += g;
    const LOOT: [string, string][] = [['apple', 'uma maçã meio roída'], ['hide', 'um retalho de couro'], ['claw', 'uma garra arrancada'], ['dust', 'uma pitada de pó de fada'], ['potion', 'um frasco de poção ainda lacrado'], ['bread', 'um pão quase inteiro']];
    const [it, nm] = LOOT[Math.floor(Math.random() * LOOT.length)]; K.inv.add(it, 1); K.game.logMsg(`🐀 No ninho: ${g} moedas e ${nm}.`, '#ffc070');
    if (Math.random() < 0.3) { K.game.spawnGear(x, z, y, lv, { rare: 2 }, 1); K.game.logMsg('🐀 Entre a palha, alguma coisa brilha: uma peça de equipamento!', '#ffd890'); }
    for (let i = 0; i < 18; i++) K.particles.spawn(x + (Math.random() - 0.5) * 1.2, y + 0.3, z + (Math.random() - 0.5) * 1.2, { vx: (Math.random() - 0.5) * 2, vy: 1 + Math.random() * 2, vz: (Math.random() - 0.5) * 2, life: 0.9, s0: 0.18, s1: 0.04, c0: 0xffe0a0, c1: 0xc08040, a: 1, g: 4 }); },
  wisp: (x, y, z, kind) => kind === 0
    ? K.particles.spawn(x, y, z, { vx: (Math.random() - 0.5) * 0.25, vy: 0.55 + Math.random() * 0.35, vz: (Math.random() - 0.5) * 0.25, life: 2.6 + Math.random(), s0: 0.32, s1: 1.1, c0: 0xffe6a0, c1: 0x6a4a9a, a: 0.32, drag: 0.4, flit: 2.5, k: 0 })
    : K.particles.spawn(x, y, z, { vy: 0.15, life: 0.9 + Math.random() * 0.6, s0: 0.09, s1: 0.01, c0: 0xffffff, c1: 0xffd070, a: 0.9, flit: 1, k: 0 }),
  fx: (x, y, z, col) => K.particles.spawn(x, y, z, { vx: (Math.random() - 0.5) * 0.3, vy: 0.9, vz: (Math.random() - 0.5) * 0.3, life: 1.6, s0: 0.22, s1: 0.04, c0: col, c1: col, a: 0.8, drag: 0.6 }) }, CACHES);
secrets.setOnSense((id) => K.quests.onSense(id));
/* o Caderno de Ormund: as notas e páginas soltas da Bíblia, no mundo (ormund.ts) */
const ormund = createOrmund({ scene: K.scene, heightAt, free: (tx, ty) => K.free(tx, ty),
  resolve: (nm) => { if (nm === '@centro') { const H = K.city.settlements.filter((v) => ['Askavik', 'Skógar', 'Hrafnhöfn', 'Austrvik', 'Eikvik', 'Lundr'].includes(v.name)); if (!H.length) return null; return { x: H.reduce((a, v) => a + v.x, 0) / H.length, y: H.reduce((a, v) => a + v.y, 0) / H.length }; }
    const st = K.city.settlements.find((v) => v.name === nm); if (st) return { x: st.x, y: st.y }; const po = K.city.pois.find((v) => v.name === nm); if (po) return { x: po.x, y: po.y };
    const n = K.npcSys.npcs.find((q) => q.def.name.includes(nm)); if (n) return { x: n.def.x / T, y: n.def.z / T }; for (const v of K.city.settlements) { const m = v.npcs.find((q) => q.name.includes(nm)); if (m) return { x: m.x, y: m.y }; } return null; },
  onRead: (e, n, tot) => { K.game.logMsg(`📜 Caderno de Ormund ${n}/${tot}: ${e.book}`, '#e8d8b0'); K.audio.chime?.(); } });
(window as unknown as { __orm: unknown; __caches: unknown }).__orm = ormund; (window as unknown as { __caches: unknown }).__caches = CACHES;
const placeT = (name: string) => { const st = K.city.settlements.find((q) => q.name === name); if (st) return { x: st.x, y: st.y }; const p = K.city.pois.find((q) => q.name === name); return p ? { x: p.x, y: p.y } : null; };
/* 09/11 (Erling: "o espírito do cemitério ficou atrás de uma árvore; ele não aparece"): o alvo do Instinto procura chão livre e À VISTA —
   sem árvore na casa nem nas vizinhas, e principalmente nenhuma entre ele e a câmera (que olha do sudeste: +x, +y). */
let treeTiles: Set<number> | null = null;
function clearSpot(x0: number, y0: number): { x: number; y: number } | null {
  if (!treeTiles) { treeTiles = new Set(); for (const p of K.city.props) if (p.kind === 'tree' || p.kind === 'bigtree' as never) for (let y = p.gy - 1; y < p.gy + p.h + 1; y++) for (let x = p.gx - 1; x < p.gx + p.w + 1; x++) treeTiles.add(y * 4096 + x); }
  const M = K.city.map, ok = (x: number, y: number) => { for (let dy = -1; dy <= 3; dy++) for (let dx = -1; dx <= 3; dx++) { const t = M[y + dy]?.[x + dx]; if (t === 'tree' || treeTiles!.has((y + dy) * 4096 + x + dx)) return false; } return true; };
  for (let r = 0; r <= 7; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue; const x = Math.floor(x0) + dx, y = Math.floor(y0) + dy;
    if (!ok(x, y)) continue; const f = nearestFree(K.navProbe, x + 0.5, y + 0.5, 0); if (f) return f; }
  return null;
}
/** os rastros que as missões ativas pedem (o lugar do alvo vem do mapa; o rastro começa ~30 casas antes) */
function senseGoals(): SenseGoal[] { const out: SenseGoal[] = [];
  for (const id of Object.keys(K.quests.q.active)) { const d = K.quests.def(id); if (!d) continue; d.objs.forEach((o, i) => { if (o.kind !== 'sense' || K.quests.objProg(d, i) >= 1) return; const base = placeT(o.at); if (!base) return;
    const tx0 = base.x + (o.dx ?? 0), ty0 = base.y + (o.dy ?? 0), fr = clearSpot(tx0, ty0) ?? nearestFree(K.navProbe, tx0, ty0, 6) ?? { x: tx0, y: ty0 }; const src = o.from ? placeT(o.from) : null;
    let ax = fr.x - (o.dx ?? 10), ay = fr.y - (o.dy ?? 10); if (src) { const L = Math.hypot(src.x - fr.x, src.y - fr.y) || 1, k = Math.min(1, 30 / L); ax = fr.x + (src.x - fr.x) * k; ay = fr.y + (src.y - fr.y) * k; } else { const L = Math.hypot(ax - fr.x, ay - fr.y) || 1; ax = fr.x + (ax - fr.x) / L * 30; ay = fr.y + (ay - fr.y) / L * 30; }
    out.push({ id: `${id}:${i}`, kind: o.what, label: o.label, from: { x: ax, y: ay }, to: { x: fr.x, y: fr.y }, spirit: o.spirit }); }); }
  return out; }
let senseT = 0;
let instHintT = 3;
function updateSecrets(dt: number) { senseT -= dt; if (senseT <= 0) { senseT = 1; secrets.sync(senseGoals()); } secrets.update(dt, K.t, K.instinctOn);
  /* a dica de ligar o Instinto: perto de um segredo ainda não achado ou do rastro que a missão pede, o herói fala */
  instHintT -= dt; if (instHintT <= 0) { instHintT = 2; if (!K.instinctOn && !K.inside && !K.game.st.dead) { const hx = K.state.fx, hy = K.state.fy; let key = '';
      for (const c of CACHES) if (!secrets.isFound(c.id) && Math.hypot(c.x - hx, c.y - hy) < 14) { key = c.id; break; }
      if (!key) for (const g of senseGoals()) if (Math.hypot(g.from.x - hx, g.from.y - hy) < 14 || Math.hypot(g.to.x - hx, g.to.y - hy) < 14) { key = 'q:' + g.id; break; }
      if (key) { const race = K.profile?.origin === 'dwarf' ? 'anao' : K.profile?.origin === 'elf' ? 'elfo' : 'humano', ph = instinctHint(race, K.myPath(), key); if (ph) { K.bubble(ph); K.game.logMsg(`${K.profile?.name ?? 'Você'}: “${ph}” — aperte F para ligar o ${K.myInstinct().name}.`, K.myInstinct().css); } } } } }
function digCache(c: Cache) { const lv = Math.max(K.game.st.lvl, c.tier), g = 15 + Math.round(lv * (3 + Math.random() * 3)); K.game.st.gold += g; K.game.gainXp(Math.round(K.game.xpNeedAt(lv) * 0.05));
  K.game.logMsg(`✦ ${c.name}: ${c.lore} (+${g} ouro)`, '#ffd890'); if (Math.random() < 0.45) K.game.spawnGear(K.heroPos.x, K.heroPos.z, K.heroPos.y, lv, { rare: 3, legendary: 1.5 }, 1, 'rare');
  K.game.logMsg(`✧ Esconderijos achados: ${secrets.foundCount()}/${secrets.total()}`, K.myInstinct().css); }
let instinct: ReturnType<typeof createInstinct> | null = null;
const selfSeen = new Map<string, number>(); let selfLast = -999, wasNight = false, lastPlace = '';
function updateInstinct(dt: number) {
  if (!instinct) instinct = createInstinct({ scene: K.scene, canvas: K.canvas, bubble: K.bubble, log: (t, c) => K.game.logMsg(t, c), tint: (id, c, e) => K.net.nameTint(id, c, e) });
  if (K.cinemaSys.cine || K.game.st.dead) { instinct.clear(); return; }
  const beings: Being[] = [];
  if (K.net.state === 'on') for (const r of K.net.remotes()) beings.push({ key: 'r' + r.id, remoteId: r.id, name: r.name, pos: r.pos, path: r.path, lean: r.lean, lvl: r.lvl });
  for (const n of K.npcSys.npcs) { const so = NPC_SOUL[n.def.name]; if (so) beings.push({ key: 'n' + n.def.name, name: n.def.name, pos: n.pos, path: so.path ?? null, lean: so.lean ?? null }); }
  const mobs = K.game.enemies.list.filter((e) => e.alive && e.active).map((e) => ({ type: e.type as string, pos: e.pos, name: e.def.name }));
  instinct.update(dt, K.t, { pos: K.heroPos, path: K.myPath(), lean: K.soulLean(), inside: !!K.inside && !K.inside.dg, on: K.instinctOn, lvl: K.game.st.lvl }, beings, mobs);
  if (!K.instinctOn) return; // falar sozinho também é sensação: só com o instinto ligado
  // falas sozinho: lugares e a noite (uma por lugar a cada 10 min, nunca mais de uma a cada 40 s)
  const say = (key: string, place: Place) => { if (K.t - selfLast < 40 || K.t - (selfSeen.get(key) ?? -999) < 600) return; const l = selfLine(place, K.myPath(), K.soulLean()); if (!l) return; selfSeen.set(key, K.t); selfLast = K.t; K.bubble(l); };
  const isNight = K.state.night > 0.6; if (isNight && !wasNight) say('noite', 'noite'); wasNight = isNight;
  if (K.inside?.dg) { if (lastPlace !== 'dg') say('dg:' + (K.inside as { dg?: { d?: { id?: string } } }).dg?.d?.id, 'masmorra'); lastPlace = 'dg'; return; }
  if (K.inside) { lastPlace = 'in'; return; }
  const near = K.city.pois.find((p) => Math.hypot(p.x - K.state.fx, p.y - K.state.fy) < 9 && /Catedral|Igreja|Templo|Cemit|Cripta|Mausol|Abadia/.test(p.name));
  const place = near ? (/Cemit|Cripta|Mausol/.test(near.name) ? 'cemiterio' : 'igreja') : '';
  if (near && lastPlace !== near.name) say('poi:' + near.name, place as Place);
  const town = K.city.settlements.find((st2) => st2.name === 'Askavik' && Math.hypot(st2.x - K.state.fx, st2.y - K.state.fy) < st2.radius);
  if (town && lastPlace !== 'Askavik' && !near) say('cidade:Askavik', 'cidade');
  lastPlace = near ? near.name : town ? 'Askavik' : '';
}
  return { senseGoals, ormund, secrets, digCache, updateInstinct, updateSecrets };
}
