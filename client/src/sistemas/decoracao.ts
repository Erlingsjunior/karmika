/* MOBÍLIA E DECORAÇÃO NA CASA (decor.ts tem as 50 peças): escolher, encaixar no terreno ou no interior, guardar, ver a dos outros, a peça rara que cai. Saiu do main.ts (02/11). */
import * as THREE from 'three';
import { DECOR, whereTxt, type DecorPool, rollDecor } from '../decor';
import { TILE_M as T } from '@karmika/shared';
import { heightAt, type EnemyType } from '../world';
import { DEFS } from '../enemies';
import { badge } from '../celebrate';
import type { DecoracaoCtx } from '../main';

export function createDecoracao(K: DecoracaoCtx) {
/* ---------- MOBÍLIA E DECORAÇÃO NA CASA (28/10, Erling) — decor.ts tem as 50 peças ----------
   Usar o item (mochila ou B → Mobília/Decoração) entra no modo de colocar: a peça segue o mouse, o anel embaixo fica verde
   onde cabe (dentro da sua casa, ou no seu terreno: a casa + 3 tiles em volta), R gira, clique coloca, botão direito/Esc cancela.
   De perto, E guarda a peça de volta na mochila. Tudo salvo na casa (e no servidor). */
const PLOT = 3; /* o terreno: 3 tiles em volta da casa */
let decoPick: { id: string; g: THREE.Group; ring: THREE.Mesh; r: number; inMine: boolean; ok: boolean; x: number; z: number } | null = null;
const decoOut = new THREE.Group(); K.scene.add(decoOut); let decoInObjs: { o: THREE.Object3D; k: number }[] = [];
const decoRingM = [new THREE.MeshBasicMaterial({ color: 0x7aff9a, transparent: true, opacity: 0.55, depthWrite: false }), new THREE.MeshBasicMaterial({ color: 0xff6a5a, transparent: true, opacity: 0.55, depthWrite: false })];
const homeDone = () => { const h = K.obras.home; return h && h.done >= h.work ? h : null; };
function decoInHome() { return !!K.inside && !!K.homeProp && K.inside.prop === K.homeProp; }
function placeDecor(id: string) { const d = DECOR[id]; if (!d) return; const h = homeDone(); if (!h || !K.homeProp) { K.game.logMsg('🏡 Mobília e decoração vão na sua casa: primeiro, erga uma casa (B → Casas).', '#ff9a8a'); return; }
  const inMine = decoInHome(); if (K.inside && !inMine) { K.game.logMsg('🏡 Só dá para decorar a sua própria casa.', '#ff9a8a'); return; }
  if (inMine && d.where === 'out') { K.game.logMsg(`${d.icon} ${d.name} fica ${whereTxt(d.where)}: saia e coloque no seu terreno.`, '#ff9a8a'); return; }
  if (!inMine) { if (d.where === 'in') { K.game.logMsg(`${d.icon} ${d.name} fica ${whereTxt(d.where)}: entre na sua casa para colocar.`, '#ff9a8a'); return; }
    const hp = K.heroPosNow(), cx = (h.gx + h.w / 2) * T, cz = (h.gy + h.h / 2) * T; if (Math.abs(hp.x - cx) > (h.w / 2 + PLOT + 4) * T || Math.abs(hp.z - cz) > (h.h / 2 + PLOT + 4) * T) { K.game.logMsg('🏡 Vá até o seu terreno para colocar (a casa e 3 passos em volta).', '#ff9a8a'); return; } }
  decoCancel(); if (K.build.on) K.build.toggle(false);
  const g = d.build(); const ring = new THREE.Mesh(new THREE.RingGeometry(Math.max(0.35, d.r) * 0.9, Math.max(0.35, d.r) * 0.9 + 0.08, 24).rotateX(-Math.PI / 2), decoRingM[0]); ring.position.y = 0.03; g.add(ring);
  (inMine ? K.inside!.int.group : K.scene).add(g); decoPick = { id, g, ring, r: 0, inMine, ok: false, x: 0, z: 0 };
  K.game.logMsg(`${d.icon} Escolha o lugar de ${d.name}: clique para colocar · R gira · botão direito ou Esc cancela.`, '#ffe08a'); }
function decoCancel() { if (!decoPick) return; decoPick.g.parent?.remove(decoPick.g); decoPick = null; }
/** onde a peça pode ficar: dentro (no chão do interior, longe da porta) ou fora (no terreno, sem pisar na casa) */
function decoFit(id: string, x: number, z: number, inMine: boolean): { ok: boolean; x: number; z: number; ry?: number } { const d = DECOR[id], h = homeDone()!;
  if (inMine) { const W = K.inside!.int.W, D = K.inside!.int.D; if (d.wall) { const dn = z, dw = x; if (Math.min(dn, dw) > 1.4) return { ok: false, x, z }; return dn <= dw ? { ok: x > 0.6 && x < W - 0.6, x, z: 0.02, ry: 0 } : { ok: z > 0.6 && z < D - 0.9, x: 0.02, z, ry: Math.PI / 2 }; }
    const m = Math.max(0.3, d.r); const ok = x > m && x < W - m && z > m && z < D - 1.0 - m * 0.5 && (d.r === 0 || K.inside!.int.free(x, z)); return { ok, x, z }; }
  const lx = x - h.gx * T, lz = z - h.gy * T, m = Math.max(0.3, d.r), inPlot = lx > -PLOT * T + m && lx < (h.w + PLOT) * T - m && lz > -PLOT * T + m && lz < (h.h + PLOT) * T - m, onHouse = lx > -m && lx < h.w * T + m && lz > -m && lz < h.h * T + m;
  return { ok: inPlot && !onHouse, x, z }; }
function decoTick() { if (!decoPick) return; const P = decoPick; if (P.inMine !== decoInHome()) { decoCancel(); return; }
  const sx = Math.round(K.mouse.x * 4) / 4, sz = Math.round(K.mouse.z * 4) / 4, lx = P.inMine ? sx - K.IX : sx, lz = P.inMine ? sz - K.IZ : sz; const f = decoFit(P.id, lx, lz, P.inMine);
  P.ok = f.ok; P.x = f.x; P.z = f.z; P.g.position.set(f.x, P.inMine ? 0 : heightAt(f.x, f.z), f.z); P.g.rotation.y = f.ry ?? P.r * Math.PI / 4; P.ring.material = decoRingM[f.ok ? 0 : 1]; }
function decoCommit() { const P = decoPick; if (!P) return; if (!P.ok) { K.game.logMsg('Aí não cabe: o anel tem que ficar verde.', '#ff9a8a'); return; } const h = homeDone(); if (!h || !K.inv.take(P.id, 1)) { decoCancel(); return; }
  const list = [...(K.obras.decor ?? [])], ry = P.g.rotation.y; list.push({ id: P.id, x: +(P.inMine ? P.x : P.x - h.gx * T).toFixed(2), z: +(P.inMine ? P.z : P.z - h.gy * T).toFixed(2), r: Math.round(ry / (Math.PI / 4)) & 7, i: P.inMine ? 1 : 0 });
  K.obras.setDecor(list); const d = DECOR[P.id]; decoCancel(); K.audio.equip?.('wood' as never); K.game.logMsg(`${d.icon} ${d.name}: no lugar.${K.inv.bag[P.id] ? ` (ainda tem ${K.inv.bag[P.id]} na mochila)` : ''}`, '#ffe08a'); decoRender(); if (K.inside && decoInHome()) decoInterior(); }
function decoPickup(k: number) { const list = [...(K.obras.decor ?? [])], it = list[k]; if (!it) return; if (!K.inv.add(it.id, 1)) { K.game.logMsg('🎒 Mochila cheia.', '#ff9a8a'); return; } list.splice(k, 1); K.obras.setDecor(list); K.game.logMsg(`${DECOR[it.id]?.icon ?? ''} ${DECOR[it.id]?.name ?? it.id} voltou para a mochila.`, '#e8dcc0'); decoRender(); if (decoInHome()) decoInterior(); }
/** do lado de fora: as peças do terreno (refeitas quando a lista muda) */
function decoRender() { for (const c of [...decoOut.children]) decoOut.remove(c); const h = homeDone(); if (!h) return;
  for (const it of K.obras.decor ?? []) { if (it.i) continue; const d = DECOR[it.id]; if (!d) continue; const g = d.build(), x = h.gx * T + it.x, z = h.gy * T + it.z; g.position.set(x, heightAt(x, z), z); g.rotation.y = it.r * Math.PI / 4; decoOut.add(g); } }
/** as casas dos outros jogadores: a decoração do terreno deles aparece para todos */
const decoOthers = new THREE.Group(); K.scene.add(decoOthers);
function decoRenderOthers() { for (const c of [...decoOthers.children]) decoOthers.remove(c); for (const [p, L] of K.otherDecor) for (const it of L) { if (it.i) continue; const d = DECOR[it.id]; if (!d) continue; const g = d.build(), x = p.gx * T + it.x, z = p.gy * T + it.z; g.position.set(x, heightAt(x, z), z); g.rotation.y = (it.r & 7) * Math.PI / 4; decoOthers.add(g); } }
/** dentro de casa: as peças do interior, com colisão e as luzes de lareira/velas/cristal (no máximo 4) */
function decoInterior(list?: { id: string; x: number; z: number; r: number; i: number }[]) { if (!K.inside || (!list && !decoInHome())) return; const int = K.inside.int; for (const q of decoInObjs) q.o.parent?.remove(q.o); decoInObjs = []; int.colliders.splice(0, int.colliders.length, ...int.colliders.filter((c) => !(c as unknown as { deco?: boolean }).deco));
  let lights = 0; (list ?? K.obras.decor ?? []).forEach((it, k) => { if (!it.i) return; const d = DECOR[it.id]; if (!d) return; const g = d.build(); g.position.set(it.x, 0, it.z); g.rotation.y = it.r * Math.PI / 4; int.group.add(g); decoInObjs.push({ o: g, k });
    if (d.r > 0 && !d.wall) { const c = [it.x, it.z, d.r * 0.8] as [number, number, number]; (c as unknown as { deco: boolean }).deco = true; int.colliders.push(c); }
    const L = g.userData.light as [number, number, number, number] | undefined; if (L && lights < 4) { lights++; const pl = new THREE.PointLight(L[3], 14, 7, 1.6); pl.position.set(L[0], L[1], L[2]); g.add(pl); } }); }
/** E perto de uma peça colocada: guardar */
function decoNear(hx: number, hz: number): { d: number; k: number } | null { const h = homeDone(); if (!h) return null; const inMine = decoInHome(); let best: { d: number; k: number } | null = null;
  (K.obras.decor ?? []).forEach((it, k) => { if (!!it.i !== inMine) return; const x = inMine ? K.IX + it.x : h.gx * T + it.x, z = inMine ? K.IZ + it.z : h.gy * T + it.z, dd = Math.hypot(hx - x, hz - z); if (dd < 1.5 && (!best || dd < best.d)) best = { d: dd, k }; }); return best; }
addEventListener('keydown', (e) => { if (!decoPick) return; const k = e.key.toLowerCase(); if (k === 'r') { decoPick.r = (decoPick.r + 1) & 7; e.preventDefault(); e.stopImmediatePropagation(); } else if (k === 'escape') { decoCancel(); e.preventDefault(); e.stopImmediatePropagation(); } }, true);
K.canvas.addEventListener('pointerdown', (e) => { if (!decoPick) return; e.preventDefault(); e.stopImmediatePropagation(); if (e.button === 2) decoCancel(); else if (e.button === 0) decoCommit(); }, true);
setTimeout(decoRender, 0);
/** a decoração rara que cai (Erling: "raríssimas, como relíquias e itens únicos") */
function decoDrop(e: { def: { name: string; scale?: number }; tag?: string; hpMax?: number; pos: THREE.Vector3 }, t: string) {
  const base = DEFS[t as EnemyType]; const boss = !!e.tag && (e.hpMax ?? 0) > 1500, elite = boss || (e.def.scale ?? 1) > (base?.scale ?? 1) * 1.2 || (!!base && e.def.name !== base.name);
  const pool: DecorPool = boss ? 'chefe' : elite ? 'elite' : 'mundo'; const id = rollDecor(pool); if (!id) return; const d = DECOR[id]; if (!K.inv.add(id, 1)) { K.game.logMsg(`✨ ${d.name} caiu, mas a mochila está cheia e ela se desfez em pó.`, '#ff9a8a'); return; }
  K.audio.chime(); badge(d.icon, 'Decoração rara', d.name); for (let i = 0; i < 40; i++) K.particles.spawn(e.pos.x, e.pos.y + 1, e.pos.z, { vx: (Math.random() - 0.5) * 4, vy: 2 + Math.random() * 3, vz: (Math.random() - 0.5) * 4, life: 1.4, s0: 0.3, s1: 0.04, c0: 0xf0d0ff, c1: 0x9a6aff, a: 1, g: 3 });
  K.game.logMsg(`✨ ${e.def.name} deixou uma decoração rara: ${d.icon} ${d.name}! (${whereTxt(d.where)} da sua casa)`, '#d8b0ff'); }
  return { placeDecor, decoRender, decoRenderOthers, decoDrop, decoOut, decoOthers, decoInterior, decoCancel, decoNear, decoPickup, decoTick };
}
