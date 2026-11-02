/* O CASTELO DO CONDE VLADISLAV: seis andares, entrar pelo portão do térreo, subir e descer; também sair de qualquer interior (exitHouse), o banco onde o herói senta e a dica de interação (E). Saiu do main.ts (02/11). */
import { TILE_M as T } from '@karmika/shared';
import { type CastleFloor, buildCastleFloor, CASTLE_FLOORS } from '../castelo3d';
import { type EnemyType, heightAt } from '../world';
import { stepAt } from '../world3d';
import type { CasteloCtx } from '../main';

export type Inter = { d: number; label: string; act: () => void };
export function createCastelo(K: CasteloCtx) {
/* ---------- o Castelo do Conde Vladislav (27/10): seis andares; entra-se pelo portão do térreo, sobe-se e desce-se pelas escadas ---------- */
const CASTLE = K.city.props.find((p) => p.kind === 'monument' && p.variant === 1) ?? null;
const CASTLE_DOOR = CASTLE ? { x: (CASTLE.gx + CASTLE.w / 2 + 1.6) * T, z: (CASTLE.gy + CASTLE.h + 1.4) * T } : null;
let castleInt: CastleFloor | null = null;
const CASTLE_MOBS: Record<number, [EnemyType, number][]> = { 0: [['ghoul', 4], ['skeleton', 4], ['vampire', 2], ['bat', 4]], 1: [['thrall', 5], ['bat', 4], ['ghoul', 2]] };
function enterCastle(F: number, from?: 'up' | 'down') {
  if (!CASTLE) return; const p = CASTLE; K.feats.max('castle', F);
  K.withFade(() => {
    if (K.inside) K.scene.remove(K.inside.int.group);
    K.game.enemies.clearTag('castle');
    const int = buildCastleFloor(F, p.gx * 31 + p.gy); castleInt = int;
    int.group.position.set(K.IX, 0, K.IZ); K.scene.add(int.group);
    K.inside = { int, ret: { x: p.gx + p.w / 2 + 0.8, y: p.gy + p.h + 1.4 }, prop: p, castle: F };
    K.objs.group.visible = false; sitting = null; for (const n of K.npcSys.npcs) n.hero.root.visible = false;
    const at = from === 'up' ? int.down : from === 'down' ? int.up : null; // chegou pela escada: aparece ao pé da escada oposta
    K.state.fx = (K.IX + (at ? at.x : int.W / 2)) / T; K.state.fy = (K.IZ + (at ? at.z : int.D - 1.2)) / T; K.state.path = [];
    K.heroY = 0; K.camX = K.IX + int.W / 2; K.camZ = K.IZ + int.D / 2; K.camY = 0;
    const mobs = CASTLE_MOBS[F]; if (mobs) { const pts = [...int.spawnPts]; let pi = 0; const lvl = F === 0 ? 40 : 34, k = F === 0 ? 1.6 : 1.2;
      for (const [type, n] of mobs) for (let i = 0; i < n; i++) { const q = pts[pi++ % pts.length]; K.game.enemies.spawn(type, K.IX + q.x + (Math.random() - 0.5) * 4, K.IZ + q.z + (Math.random() - 0.5) * 4, { tag: 'castle', hpMul: k, dmgMul: k, lvl, aggro: 22, leash: 999, net: `k${F}` }); } }
    K.game.logMsg(`🦇 ${CASTLE_FLOORS[F]}${F === 5 ? ' — o Conde espera no trono' : F === 0 ? ' — aqui dorme a Corte antiga' : ''}`, '#e0a0b0');
  });
}
function exitHouse() {
  if (!K.inside || K.exiting) return; const ins = K.inside;
  if (ins.castle !== undefined) { K.game.enemies.clearTag('castle'); castleInt = null; }
  if (ins.crypt && ins.crypt > 1) { K.enterCrypt(ins.crypt - 1, ins.prop); return; }
  if (ins.crypt) { K.game.enemies.clearTag('crypt'); K.cryptInt = null; K.bishop = null; if (K.spirit) { K.scene.remove(K.spirit.root); K.spirit = null; } }
  if (ins.dg) K.dgs.stop();
  K.exiting = true;
  K.withFade(() => { K.scene.remove(ins.int.group); K.inside = null; K.objs.group.visible = true; K.decoOut.visible = true; K.decoOthers.visible = true; K.decoCancel(); for (const n of K.npcSys.npcs) n.hero.root.visible = true; K.state.fx = ins.ret.x; K.state.fy = ins.ret.y; K.state.path = []; K.objs.update(K.state.fx * T, K.state.fy * T, true); { const g0 = heightAt(K.state.fx * T, K.state.fy * T), s0 = stepAt(K.state.fx * T, K.state.fy * T); K.heroY = s0 !== null && s0 > g0 ? s0 : g0; } /* 27/10: a porta da catedral fica na escadaria: sair com a altura do degrau, não da terra embaixo */ K.camX = K.state.fx * T; K.camZ = K.state.fy * T; K.camY = K.heroY; K.exiting = false; });
}
let sitting: { x: number; y: number; yaw: number } | null = null;
const hintEl = document.getElementById('act') as HTMLElement;
  return { get castleInt() { return castleInt; }, exitHouse, get sitting() { return sitting; }, set sitting(v: typeof sitting) { sitting = v; }, enterCastle, CASTLE_DOOR, hintEl };
}
