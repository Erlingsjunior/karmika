/* CONSTRUÇÃO: o modo B (peças, muro, robôs que sobraram) e as obras em turnos (obras.ts) com a casa do herói. Saiu do main.ts (02/11). */
import { createBuild, wholeOf } from '../build';
import { confirmBox } from '../windows';
import { heightAt } from '../world';
import { createObras, moveHome } from '../obras';
import * as THREE from 'three';
import { buildStyledHouse, buildHouse } from '../houses3d';
import { TILE_M as T } from '@karmika/shared';
import { badge } from '../celebrate';
import type { ConstrucaoCtx } from '../main';

export function createConstrucao(K: ConstrucaoCtx) {
/* ---------- construção ---------- */
/* o tempo que sobrou de cada Ajudante desmontado (por item; o próximo a sair da mochila usa o que sobrou) */
const RLK = 'karmika.robotLeft.v1'; const robotLeft: Record<string, number[]> = (() => { try { return JSON.parse(localStorage.getItem(RLK) || '{}'); } catch { return {}; } })();
function robotLeftPush(id: string, ms: number) { (robotLeft[id] ??= []).push(ms); try { localStorage.setItem(RLK, JSON.stringify(robotLeft)); } catch { /* */ } }
function robotLeftPop(id: string): number | null { const v = robotLeft[id]?.pop() ?? null; try { localStorage.setItem(RLK, JSON.stringify(robotLeft)); } catch { /* */ } return v; }
/** há muralha (rwall/rtower/gatehouse) a menos de `d` casas? */
const wallTiles = new Set<number>(); for (const p of K.city.props) if (p.kind === 'rwall' || p.kind === 'rtower' || p.kind === 'gatehouse') wallTiles.add(p.gy * 4096 + p.gx);
function nearWall(gx: number, gy: number, d: number) { for (let y = gy - d; y <= gy + d; y++) for (let x = gx - d; x <= gx + d; x++) if (wallTiles.has(y * 4096 + x)) return true; return false; }
const build = createBuild({ count: (id) => K.inv.bag[id] ?? 0, placeDecor: (id) => K.placeDecor(id), taken: (gx, gy, w, h) => { const o = K.otherHouses.find((c) => gx < c.gx + c.w + 1 && gx + w + 1 > c.gx && gy < c.gy + c.h + 1 && gy + h + 1 > c.gy); return o ? o.char : null; }, snd: (k) => K.game.snd(k), gold: () => K.game.st.gold, payGold: (n) => { K.game.st.gold = Math.max(0, K.game.st.gold - n); }, quitWhole: () => { const h = obras.home; if (h) confirmBox(`<b>Desistir de ${h.name}?</b><br>O canteiro se desfaz e <b>todo o material se perde</b> (${h.done.toFixed(1)} de ${h.work} turnos feitos).`, '✖ Desistir da obra', () => obras.quit()); }, onWhole: (w, gx, gy) => obras.start(w, gx, gy), wholeBusy: () => obras.busy(), siteId: () => obras.home && obras.home.done < obras.home.work ? obras.home.id : null, guildZone: (gx, gy) => K.guildZoneAt(gx, gy), onGuildBuild: (b, del) => { K.hub.send({ t: 'g:build', b, del }); }, world: K.city, scene: K.scene, objs: K.objs, has: (id, n) => K.inv.has(id, n), take: (id, n) => K.inv.take(id, n), add: (id, n) => K.inv.add(id, n), log: (t, c) => K.game.logMsg(t, c), heightAt,
  canBuildAt: (gx, gy) => !K.city.settlements.some((st) => Math.hypot(gx - st.x, gy - st.y) < st.radius + 2) && !K.city.pois.some((q) => Math.hypot(gx - q.x, gy - q.y) < 6) && K.city.map[gy]?.[gx] !== 'water' && !nearWall(gx, gy, 5) }); /* 01/11: nada se constrói a menos de 10 m (5 casas) de um muro de cidade */
/* a obra inteira e a casa do jogador (obras.ts, 28/10) */
let homeProp: (typeof K.city.props)[number] | null = null;
const obras = createObras({ siteModel: (h) => { const lk = wholeOf(h.id, h.name); let sd = h.gx * 977 + h.gy * 131 + 7; const rnd = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; }; const c = { windows: new THREE.MeshBasicMaterial({ color: 0xffc266 }), rnd }; return (lk.style ? buildStyledHouse(lk.style, lk.variant, h.w * T, h.h * T, 0xb09068, 0x8a3a28, c) : buildHouse(lk.variant, h.w * T, h.h * T, 0xb09068, 0x8a3a28, c)).group; }, variantOf: (h) => wholeOf(h.id, h.name).variant, onDone: (h) => setTimeout(() => {
    badge('🏡', 'Casa pronta', h.name);
    K.game.logMsg(`🏡 ${h.name} está de pé! O Cartório de Karmika mandou a escritura pelo correio.`, '#ffe08a');
    K.mail.send('Cartório de Karmika', `A sua casa está de pé: ${h.name}`, `${h.owner},\n\nTábua por tábua, prego por prego, turno após turno: a ${h.name} está de pé, e o chão em que ela está é seu.\n\nPoucos em Karmika podem dizer que têm um teto que ergueram. Os vizinhos vão comentar, os corvos vão pousar no seu telhado e, nas noites frias, a sua lareira vai ser a mais quente da estrada.\n\nSegue em anexo a ESCRITURA DA CASA, com o selo do Cartório. Guarde com carinho e cuidado: quem tem a escritura é o dono.\n\nQue o Olho veja a sua porta sempre aberta para os amigos.\n\n— O Escrivão do Cartório de Karmika`, [{ item: { id: K.deedItemOf(h), n: 1 } }], 2500); }, 1200),
  hasContract: () => K.inv.has('obra_auto', 1), takeContract: () => K.inv.take('obra_auto', 1), scene: K.scene, T, heightAt, log: (t, c) => K.game.logMsg(t, c), particles: K.particles as never, sentries: () => (K.game as unknown as { sentries(): { x: number; z: number; r: number; until: number }[] }).sentries(), enemyNear: (x, z, r) => { const e = K.game.enemies.nearest(new THREE.Vector3(x, 0, z), r); return !!e && e.alive; }, heroNear: (x, z, r) => Math.hypot(K.state.fx * T - x, K.state.fy * T - z) < r, heroName: () => K.profile?.name || 'Caminhante',
  block: (gx, gy, w, h, on) => { for (let y = gy; y < gy + h; y++) for (let x = gx; x < gx + w; x++) if (K.city.map[y]?.[x] !== undefined) K.city.map[y][x] = on ? 'wall' : 'grass'; },
  removeHouse: (h) => { if (homeProp) K.objs.removeProp(homeProp); homeProp = null; setTimeout(K.decoRender, 0); for (let y = h.gy; y < h.gy + h.h; y++) for (let x = h.gx; x < h.gx + h.w; x++) if (K.city.map[y]?.[x] !== undefined) K.city.map[y][x] = 'grass'; },
  addHouse: (h) => { setTimeout(K.decoRender, 0); const lk = wholeOf(h.id, h.name);
    { /* 02/11 (Erling: "casa que eu construí está sendo atravessada no muro"): a muralha de Karmika mudou de lugar depois da casa pronta e o anel
         passava pelo terreno dela. Se o muro encosta na casa, ela é reassentada no lugar livre mais perto (≥ 3 casas do muro) e o jogador é avisado. */
      const bad = (gx: number, gy: number) => { for (let y = gy - 1; y <= gy + h.h; y++) for (let x = gx - 1; x <= gx + h.w; x++) { if (!K.city.map[y]?.[x]) return true; const t = K.city.map[y][x]; const own = x >= gx && x < gx + h.w && y >= gy && y < gy + h.h; if (own ? (t !== 'grass' && t !== 'wall') : (t === 'water')) return true; if (nearWall(x, y, own ? 3 : 2)) return true; } return false; };
      if (nearWall(h.gx, h.gy, 1) || nearWall(h.gx + h.w - 1, h.gy + h.h - 1, 1) || nearWall(h.gx + h.w - 1, h.gy, 1) || nearWall(h.gx, h.gy + h.h - 1, 1)) {
        for (let y = h.gy; y < h.gy + h.h; y++) for (let x = h.gx; x < h.gx + h.w; x++) if (K.city.map[y]?.[x] === 'wall' && !wallTiles.has(y * 4096 + x)) K.city.map[y][x] = 'grass';
        let found: [number, number] | null = null; for (let rr = 2; rr <= 14 && !found; rr++) for (let dy = -rr; dy <= rr && !found; dy++) for (let dx = -rr; dx <= rr && !found; dx++) { if (Math.max(Math.abs(dx), Math.abs(dy)) !== rr) continue; if (!bad(h.gx + dx, h.gy + dy)) found = [h.gx + dx, h.gy + dy]; }
        if (found) { moveHome(h, found[0], found[1]); setTimeout(() => K.game.logMsg('🏠 A muralha passava pelo seu terreno: sua casa foi reassentada a poucos passos dali (mesma casa, mesma mobília).', '#ffe08a'), 1500); } } } const p = { kind: 'house', gx: h.gx, gy: h.gy, w: h.w, h: h.h, height: 3.4, wall: 0xb09068, roof: 0x8a3a28, variant: lk.variant, style: lk.style, rot: 0, label: `Casa de ${h.owner}` } as (typeof K.city.props)[number]; homeProp = p; K.objs.addProp(p); for (let y = h.gy; y < h.gy + h.h; y++) for (let x = h.gx; x < h.gx + h.w; x++) K.city.map[y][x] = 'wall'; } });
build.load();
  return { obras, build, get homeProp() { return homeProp; }, robotLeftPop, robotLeftPush };
}
