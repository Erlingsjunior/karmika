import { WAGON_BLOCK } from '../caravanas';
/* COLISÃO DO HERÓI (regra de ouro: mobilidade acima da física): cantos do corpo, muralhas e caminho de ronda, degraus, muros baixos e cercas, guarda-peito das pontes, sólidos do cenário, pontos de trabalho, troncos e bichos. Saiu do main.ts (02/11). */
import { rampartAt, stairTopAt, stairDeck, heightAt, bridgeDeck, waterSD, groundH, WL } from '../world';
import { TILE_M as T, isWalkable } from '@karmika/shared';
import { stepAt } from '../world3d';
import { STATION_INFO, HALL_WALLS } from '../stations3d';
import * as THREE from 'three';
import { LIB_WALLS } from '../library3d';
import type { ColisaoCtx } from '../main';

export function createColisao(K: ColisaoCtx) {
const R = 0.16;
const TRUNK = 0.2; // raio do tronco em tiles (0,4 m): dá para passar entre as árvores da floresta densa
/* REGRA DE OURO (imutável): mobilidade acima da física. Paredes, água funda e montanha bloqueiam; bancos, cadeiras, tochas,
   lápides, troncos e móveis só bloqueiam o miolo, e quem fica preso neles se espreme e passa (squeeze). Ninguém trava em beco, banco ou floresta. */
/* caminho de ronda das muralhas: lá em cima só se anda pelo anel (e se desce pela casa mais alta da escada);
   do chão só se sobe pela escada (a casa de cima, já na altura do caminho) */
let onWall = false;
const CORN: [number, number][] = [[-R, -R], [R, -R], [R, R], [-R, R]];
const wallFree = (x: number, y: number) => CORN.every(([dx, dy]) => { const tx = Math.floor(x + dx), ty = Math.floor(y + dy); return !!rampartAt(tx, ty) || stairTopAt(tx, ty); });
const stepUp = (x: number, y: number) => { const tx0 = Math.floor(K.state.fx), ty0 = Math.floor(K.state.fy); if (!stairTopAt(tx0, ty0)) return false; const rp = rampartAt(Math.floor(x), Math.floor(y)) ?? CORN.map(([dx, dy]) => rampartAt(Math.floor(x + dx), Math.floor(y + dy))).find(Boolean); if (!rp || K.heroY < rp.top - 1.3) return false;
  return CORN.every(([dx, dy]) => { const tx = Math.floor(x + dx), ty = Math.floor(y + dy); return !!rampartAt(tx, ty) || stairDeck((tx + 0.5) * T, (ty + 0.5) * T) !== null; }); };
const free = (x: number, y: number, squeeze = false) => K.inside ? K.inside.int.free(x * T - K.IX, y * T - K.IZ, squeeze) : onWall ? wallFree(x, y) : stepUp(x, y) || freeGround(x, y, squeeze);
/** chão do herói: o terreno ou o degrau/patamar de prédio por cima dele (world3d.stepAt), se estiver ao alcance de um passo */
function heroGround(xm: number, zm: number) { const g = heightAt(xm, zm), s = stepAt(xm, zm); return s !== null && s > g && s - K.heroY < 0.8 ? s : g; }
/** degrau alto demais (a lateral do plinto, um muro baixo): barra em vez de atravessar */
const stepBlock = (x: number, y: number) => { if (K.inside || onWall) return false; const s = stepAt(x * T, y * T); if (!(s !== null && s - K.heroY > 0.8 && s > heightAt(x * T, y * T) + 0.06)) return false;
  /* preso dentro do degrau (teleporte, saída de prédio): se o lugar onde ele está também é alto demais, deixa andar (27/10) */ const h = stepAt(K.state.fx * T, K.state.fy * T); return !(h !== null && h - K.heroY > 0.8); };
/* muros baixos e cercas (25/10): colisão pelo segmento desenhado, não pelo tile — o vão que se vê é o vão que se passa */
const LOWW = new Map<number, { ax: number; ay: number; bx: number; by: number }[]>();
for (const p of K.city.props) if (p.kind === 'lowwall') { const cx = p.gx + (p.ox ?? T / 2) / T, cy = p.gy + (p.oz ?? T / 2) / T, hl = ((p.len ?? T) / T) / 2, ry = p.ry ?? 0, ux = Math.cos(ry), uy = -Math.sin(ry), sg = { ax: cx - ux * hl, ay: cy - uy * hl, bx: cx + ux * hl, by: cy + uy * hl };
  for (let ty = Math.floor(Math.min(sg.ay, sg.by) - 1); ty <= Math.floor(Math.max(sg.ay, sg.by) + 1); ty++) for (let tx = Math.floor(Math.min(sg.ax, sg.bx) - 1); tx <= Math.floor(Math.max(sg.ax, sg.bx) + 1); tx++) { const k = ty * 4096 + tx; const l = LOWW.get(k); if (l) l.push(sg); else LOWW.set(k, [sg]); } }
function lowWallHit(x: number, y: number) { const l = LOWW.get(Math.floor(y) * 4096 + Math.floor(x)); if (!l) return false; for (const s of l) { const dx = s.bx - s.ax, dy = s.by - s.ay, L2 = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((x - s.ax) * dx + (y - s.ay) * dy) / L2)); if (Math.hypot(x - (s.ax + dx * t), y - (s.ay + dy * t)) < 0.17 + R * 0.8) return true; } return false; }
/* REGRA (Erling, 27/10): ninguém cai de ponte — o guarda-peito tem física. Em cima do tabuleiro, só se sai por onde o chão continua na mesma altura */
const bridgeEdge = (x: number, y: number) => { const d0 = bridgeDeck(K.state.fx * T, K.state.fy * T); if (d0 === null) return false; const d1 = bridgeDeck(x * T, y * T); if (d1 !== null) return Math.abs(d1 - d0) > 0.6; /* de uma ponte para outra só no mesmo nível */ if (waterSD(x * T, y * T) < 0.4) return true; /* nunca para a água */ return Math.abs(d0 - groundH(x * T, y * T)) > 0.6; };
const freeGround = (x: number, y: number, squeeze = false) => !stepBlock(x, y) && !bridgeEdge(x, y) && !(lowWallHit(x, y) && !lowWallHit(K.state.fx, K.state.fy)) &&
  [[-R, -R], [R, -R], [R, R], [-R, R]].every(([dx, dy]) => {
    const tx = Math.floor(x + dx), ty = Math.floor(y + dy);
    return ty >= 0 && tx >= 0 && ty < K.city.map.length && tx < K.city.map[0].length && (isWalkable(K.city.map[ty][tx]) || K.city.map[ty][tx] === 'water' || K.city.map[ty][tx] === 'tree');
  }) && (squeeze ? !(solidHit(x, y, true) && !solidHit(K.state.fx, K.state.fy, true)) : (!trunkHit(x, y) && !(solidHit(x, y) && !solidHit(K.state.fx, K.state.fy)))) && !enemyBlock(x, y) && (() => { /* 27/10 (Erling: "nada pode me travar"): morro não barra; só o penhasco a pique (mais de 1,5 m por metro), o mar aberto e a lama funda. Estrada e praça passam sempre */ const g = groundH(x * T, y * T), tl = K.city.map[Math.floor(y)]?.[Math.floor(x)]; if (g <= WL - 2.6 || g >= 80) return false; if (tl === 'road' || tl === 'plaza') return true; const d = Math.hypot(x - K.state.fx, y - K.state.fy) * T; return d < 1e-4 || Math.abs(g - groundH(K.state.fx * T, K.state.fy * T)) / d <= 1.5; })(); /* estrada de montanha (o caracol do Conde) sobe até onde for */ // mar aberto, lama funda e alta montanha não se atravessam
/* objetos sólidos do cenário (fonte, bancos, barracas, tendas, baús, tochas, lápides, estátuas, relíquias…): não se atravessa mais.
   O que continua passável de propósito: grama, ervas, ossos e o meio das árvores da floresta (só o tronco bloqueia) */
/** pontos de trabalho do mapa (centro em metros) */
const STATIONS = K.city.props.filter((p) => p.kind === 'station').map((p) => ({ x: (p.gx + p.w / 2) * T, z: (p.gy + p.h / 2) * T, v: p.variant ?? 0, label: p.label || STATION_INFO[p.variant ?? 0].name }));
const PROF_NAME: Record<string, string> = { marceneiro: 'Marceneiro', ferreiro: 'Ferreiro', costureiro: 'Costureiro', alquimista: 'Alquimista', cozinheiro: 'Cozinheiro' };
function stationNear(prof: string, reach = 6) { if (K.inside) return null; const hx = K.state.fx * T, hz = K.state.fy * T; return STATIONS.find((s2) => (STATION_INFO[s2.v].prof === prof || (s2.v === 5 && (prof === 'ferreiro' || prof === 'marceneiro'))) && Math.hypot(s2.x - hx, s2.z - hz) < reach) ?? null; }
const cutV = new THREE.Vector3();
const SOLID_R: Record<string, number> = { rock: 0.32, chimney: 0.5, crane: 0.7, boat: -1, station: 0.72, noticeboard: 0.3, mailbox: 0.2, vault: 0.36, shopfront: 1.2, fountain: -1, deadwell: -1, bench: 0.24, stall: -1, chest: 0.24, torch: 0.1, relic: 0.4, tent: 0.85, grave: 0.18, angel: 0.38, obelisk: 0.34, saint: 0.38, altar: 0.55, campfire: 0.26, gpillar: 0.24, mausoleum: -1, vprop: 0.3, rack: 0.3, coffin: 0.3, deadtree: 0.22, totem: 0.3 };
const solids = new Map<number, { x: number; y: number; r: number }[]>();
const solidAdd = (c: { x: number; y: number; r: number }) => { for (let ty = Math.floor(c.y - c.r - 0.3); ty <= Math.floor(c.y + c.r + 0.3); ty++) for (let tx = Math.floor(c.x - c.r - 0.3); tx <= Math.floor(c.x + c.r + 0.3); tx++) { const k = ty * 4096 + tx; const l = solids.get(k); if (l) l.push(c); else solids.set(k, [c]); } };
/* a Árvore-Mãe caída (27/10): só o tronco barra, em círculos ao longo dele; o terreno em volta é chão */
for (const p of K.city.props) if (p.kind === 'monument' && p.variant === 7) for (let k = 0; k < 6; k++) solidAdd({ x: p.gx + 1.5 + k * 3.1, y: p.gy + p.h / 2 - 1, r: 2.8 });
for (const p of K.city.props) { const r0 = p.kind === 'vprop' && (p.variant === 2 || p.variant === 6) ? 0.7 : SOLID_R[p.kind]; if (r0 === undefined) continue; /* poço e feno: sólidos inteiros */ const r = r0 < 0 ? Math.min(p.w, p.h) * 0.47 : r0, c = { x: p.gx + p.w / 2, y: p.gy + p.h / 2, r };
  for (let ty = Math.floor(c.y - r - 0.3); ty <= Math.floor(c.y + r + 0.3); ty++) for (let tx = Math.floor(c.x - r - 0.3); tx <= Math.floor(c.x + r + 0.3); tx++) { const k = ty * 4096 + tx; const l = solids.get(k); if (l) l.push(c); else solids.set(k, [c]); } }
/* pórtico com nome da vila (vgate): os dois troncos barram (círculos nas pontas do vão); o vão fica livre — regra 12 */
for (const p of K.city.props) { if (p.kind !== 'vgate') continue; const cx = p.gx + (p.ox ?? T) / T, cy = p.gy + (p.oz ?? T) / T, hl = (p.len ?? 5) / 2 / T, ry = p.ry ?? 0, ux = Math.cos(ry), uy = -Math.sin(ry);
  for (const sgn of [-1, 1]) solidAdd({ x: cx + ux * hl * sgn, y: cy + uy * hl * sgn, r: 0.3 }); }
/* as casas de ofício da cidade (25/10) têm paredes de fundo e laterais: corpo de verdade, a frente fica aberta */
for (const p of K.city.props) { if (!(p.kind === 'library' || (p.kind === 'station' && p.w >= 3))) continue; const ry = p.ry ?? 0, cs = Math.cos(ry), sn = Math.sin(ry), cx = p.gx + p.w / 2, cy = p.gy + p.h / 2;
  const wall = (x0: number, z0: number, x1: number, z1: number) => { const n = Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 0.55); for (let i = 0; i <= n; i++) { const lx = x0 + (x1 - x0) * i / n, lz = z0 + (z1 - z0) * i / n, c = { x: cx + (lx * cs + lz * sn) / T, y: cy + (-lx * sn + lz * cs) / T, r: 0.26 };
    for (let ty = Math.floor(c.y - 0.6); ty <= Math.floor(c.y + 0.6); ty++) for (let tx = Math.floor(c.x - 0.6); tx <= Math.floor(c.x + 0.6); tx++) { const k = ty * 4096 + tx; const l = solids.get(k); if (l) l.push(c); else solids.set(k, [c]); } } };
  for (const [x0, z0, x1, z1] of (p.kind === 'library' ? LIB_WALLS : HALL_WALLS)[p.variant ?? 0] ?? []) wall(x0, z0, x1, z1); }
/** bichos são corpos: o herói não entra neles (só atravessa na investida e na esquiva); afastar-se é sempre livre */
/** 03/11 (Erling: "não posso atravessar carroças"): dentro da caixa da carroça (com folga do corpo do herói)? */
function inWagon(x: number, y: number) { const xm = x * T, zm = y * T, rr = R * T * 0.8; for (const b of WAGON_BLOCK) { const dx = xm - b.x, dz = zm - b.z, s = Math.sin(b.yaw), c = Math.cos(b.yaw), lx = dx * c - dz * s, lz = dx * s + dz * c - b.zc; if (Math.abs(lx) < b.hw + rr && Math.abs(lz) < b.hl + rr) return true; } return false; }
function enemyBlock(x: number, y: number) { if (WAGON_BLOCK.length && inWagon(x, y) && !inWagon(K.state.fx, K.state.fy)) return true; const n = K.hero.actName; if (n === 'dash' || n === 'jet' || n === 'rush' || n === 'charge') return false;
  for (const e of K.game.enemies.list) { if (!e.active || !e.alive || e.state === 'dead') continue; const ex = e.pos.x / T, ey = e.pos.z / T, m = (e.def.radius * 0.8 + 0.45) / T, dn = Math.hypot(x - ex, y - ey); if (dn < m && dn < Math.hypot(K.state.fx - ex, K.state.fy - ey)) return true; } return false; }
/** big = só os sólidos grandes (fonte, poço, barraca, mausoléu, loja, ponto de trabalho): esses nunca se atravessam, nem se espremendo */
function solidHit(x: number, y: number, big = false) { const l = solids.get(Math.floor(y) * 4096 + Math.floor(x)); if (!l) return false; for (const c of l) if ((!big || c.r >= 0.7) && Math.hypot(x - c.x, y - c.y) < c.r + R) return true; return false; }
function trunkHit(x: number, y: number) {
  const gx = Math.floor(x), gy = Math.floor(y);
  for (let ty = gy - 1; ty <= gy + 1; ty++) for (let tx = gx - 1; tx <= gx + 1; tx++) if (K.city.map[ty]?.[tx] === 'tree') { if (Math.hypot(x - (tx + 0.5), y - (ty + 0.5)) < R + TRUNK) return true; }
  return false;
}
  return { solidHit, lowWallHit, stationNear, get onWall() { return onWall; }, set onWall(v: typeof onWall) { onWall = v; }, free, PROF_NAME, CORN, trunkHit, stepBlock, enemyBlock, wallFree, solids, STATIONS, heroGround, cutV };
}
