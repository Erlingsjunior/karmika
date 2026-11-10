/* CLIQUE PARA ANDAR: o caminho até o ponto clicado (nav.ts), com a mesma sonda de corpo do movimento. Saiu do main.ts (02/11). */
import { groundH, WL, heightAt } from '../world';
import { TILE_M as T, isWalkable, type Vec } from '@karmika/shared';
import { stepAt } from '../world3d';
import { navPath, lineFree } from '../nav';
import * as THREE from 'three';
import { createXray } from '../xray';
import { setCutout, setCutoutPlane } from '../toon3d';
import type { CliqueAndarCtx } from '../main';

export function createCliqueAndar(K: CliqueAndarCtx) {
/* ---------- clique para andar (nav.ts): a sonda é o mesmo corpo do movimento, sem os bichos (eles se mexem; quem trava, recalcula) ---------- */
const hOk = new Int8Array(K.city.map.length * K.city.map[0].length); // 0 = não visto, 1 = pisável, 2 = alto/fundo demais
function tileHeightOk(tx: number, ty: number) { const i = ty * K.city.map[0].length + tx; if (hOk[i]) return hOk[i] === 1;
  const g = groundH((tx + 0.5) * T, (ty + 0.5) * T), ok = g > WL - 2.6 && g < 80; hOk[i] = ok ? 1 : 2; return ok; }
function groundProbe(x: number, y: number) {
  for (const [dx, dy] of K.CORN) { const tx = Math.floor(x + dx), ty = Math.floor(y + dy); if (ty < 0 || tx < 0 || ty >= K.city.map.length || tx >= K.city.map[0].length) return false; const tl = K.city.map[ty][tx];
    if (!(isWalkable(tl) || tl === 'water' || tl === 'tree') || !tileHeightOk(tx, ty)) return false; }
  return !K.trunkHit(x, y) && !K.solidHit(x, y) && !K.lowWallHit(x, y);
}
/* dev: por que o herói não passa aqui? (27/10) */
(window as unknown as { __why: unknown }).__why = (x: number, y: number) => ({ step: K.stepBlock(x, y), stepH: stepAt(x * T, y * T), heroY: K.heroY, ground: heightAt(x * T, y * T), low: K.lowWallHit(x, y), solid: K.solidHit(x, y), trunk: K.trunkHit(x, y), enemy: K.enemyBlock(x, y), tiles: K.CORN.map(([dx, dy]) => K.city.map[Math.floor(y + dy)]?.[Math.floor(x + dx)]), gH: groundH(x * T, y * T), free: K.free(x, y), onWall: K.onWall, inside: !!K.inside });
const navProbe = (x: number, y: number) => K.inside ? K.inside.int.free(x * T - K.IX, y * T - K.IZ, false) : K.onWall ? K.wallFree(x, y) : groundProbe(x, y);
const navCost = (x: number, y: number) => { if (K.inside || K.onWall) return 1; const tl = K.city.map[Math.floor(y)]?.[Math.floor(x)]; return tl === 'water' ? 3 : tl === 'tree' ? 1.3 : tl === 'road' || tl === 'plaza' ? 0.85 : 1; };
let lmbHold = 0, holdT = 0;
let navGoal: { x: number; y: number } | null = null, navReplans = 0, navChk = 0, navProg = { x: 0, y: 0, t: 0 };
function planTo(gx: number, gy: number, replan = false, maxNodes = 40000) {
  if (!replan) navReplans = 0; navGoal = { x: gx, y: gy };
  K.state.path = navPath(navProbe, K.state.fx, K.state.fy, gx, gy, { cost: navCost, maxNodes }) as Vec[];
  navProg = { x: K.state.fx, y: K.state.fy, t: 0 };
}
/** seguir o caminho: corta a curva que ficou livre, percebe quando trava e recalcula (duas vezes); depois desiste em vez de correr parado */
function followPath(dt: number): [number, number] {
  if (!K.state.path.length) return [0, 0];
  navChk -= dt; if (navChk <= 0 && K.state.path.length >= 2) { navChk = 0.2; if (lineFree(navProbe, K.state.fx, K.state.fy, K.state.path[1].x, K.state.path[1].y)) K.state.path.shift(); }
  const n = K.state.path[0], last = K.state.path.length === 1, dx = n.x - K.state.fx, dy = n.y - K.state.fy, d = Math.hypot(dx, dy);
  if (d < (last ? 0.08 : 0.3)) { K.state.path.shift(); if (!K.state.path.length) { K.marker.visible = false; navGoal = null; return [0, 0]; } return followPath(0); }
  navProg.t += dt;
  if (navProg.t > 0.5) { const moved = Math.hypot(K.state.fx - navProg.x, K.state.fy - navProg.y);
    if (moved < 0.12 && navGoal) { if (navReplans++ < 2) planTo(navGoal.x, navGoal.y, true); else { K.state.path = []; navGoal = null; return [0, 0]; } }
    navProg = { x: K.state.fx, y: K.state.fy, t: 0 }; }
  return [dx / d, dy / d];
}

/* envelope dourado brilhando em cima das caixas de correio quando há carta não lida */
const envTex = (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 64; const g = c.getContext('2d')!; const gr = g.createRadialGradient(32, 32, 4, 32, 32, 31); gr.addColorStop(0, 'rgba(255,220,120,.85)'); gr.addColorStop(1, 'rgba(255,200,80,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  g.fillStyle = '#f6e2a0'; g.strokeStyle = '#5a3a10'; g.lineWidth = 2.5; g.beginPath(); g.rect(14, 20, 36, 25); g.fill(); g.stroke(); g.beginPath(); g.moveTo(14, 20); g.lineTo(32, 35); g.lineTo(50, 20); g.stroke(); g.fillStyle = '#b3202f'; g.beginPath(); g.arc(32, 35, 4, 0, 7); g.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const envSprites = K.city.props.filter((p) => p.kind === 'mailbox').map((p) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: envTex, transparent: true, depthWrite: false, toneMapped: false })); const x = (p.gx + 0.5) * T, z = (p.gy + 0.5) * T; sp.position.set(x, heightAt(x, z) + 2.5, z); sp.scale.setScalar(0.85); sp.visible = false; sp.renderOrder = 5; K.scene.add(sp); return { sp, y: sp.position.y }; });
function updateEnvelopes(t: number) { const on = K.mail.unread > 0 && !K.inside; for (const e of envSprites) { e.sp.visible = on; if (on) { e.sp.position.y = e.y + Math.sin(t * 2.2) * 0.08; (e.sp.material as THREE.SpriteMaterial).opacity = 0.75 + Math.sin(t * 4) * 0.25; } } }
/* silhueta atrás dos prédios (herói sempre; NPC só quando o herói está perto) */
const xray = createXray();
{ const HT: Record<string, number> = { house: 7.5, temple: 12, church: 10, shopfront: 4.6, tent: 3.2, stall: 3, mausoleum: 6, tower: 14 };
  xray.setBuildings(K.city.props.filter((p) => HT[p.kind]).map((p) => { const y0 = groundH((p.gx + p.w / 2) * T, (p.gy + p.h / 2) * T), big = p.kind === 'church' && p.variant === 2; return { x0: p.gx * T + 0.2, z0: p.gy * T + 0.2, x1: (p.gx + p.w) * T - 0.2, z1: (p.gy + p.h) * T - 0.2, y0, y1: y0 + (big ? 40 : HT[p.kind]) }; }));
  /* árvores: só a copa (do terço da altura para cima); raio ~30% da altura, entre 1,1 e 3,2 m */
  xray.setTrees(K.city.props.filter((p) => p.kind === 'tree').map((p) => { const x = (p.gx + 0.5) * T, z = (p.gy + 0.5) * T, h = p.height ?? 6; return { x, z, y0: groundH(x, z), h, r: Math.max(1.1, Math.min(3.2, h * 0.3)), alive: () => !(p as { gone?: boolean }).gone }; })); }
function updateXray(dt: number) {
  const hp = K.hero.root.position, who: { root: THREE.Object3D; at: THREE.Vector3; want: boolean; trees?: boolean }[] = [{ root: K.hero.root, at: hp, want: false, trees: true }]; /* 28/10 (Erling): o herói não ganha silhueta — quem mostra o herói escondido é a aura de corte; a silhueta fica para os NPCs */
  /* NPC: só os 2 mais perto e que não estão de passagem (patrulha/caravana) — cada silhueta custa ~60 desenhos (26/10 noite) */
  const nn = K.npcSys.npcs.filter((n) => !n.def.route && n.hero.root.visible).map((n) => ({ n, d: Math.hypot(n.pos.x - hp.x, n.pos.z - hp.z) })).filter((q) => q.d < 7).sort((a, b) => a.d - b.d).slice(0, 2);
  for (const { n } of nn) who.push({ root: n.hero.root, at: n.pos, want: !K.inside && !K.cinemaSys.cine });
  xray.update(dt, K.camera.position, who);
  /* o corte circular de visão: o herói projetado na tela (pixels do canvas), o raio de ~2,6 m à distância dele, e a distância da câmera até ele */
  { const v = K.cutP.copy(hp).setY(hp.y + 0.9), W = K.renderer.domElement.width, H = K.renderer.domElement.height; const dist = v.distanceTo(K.camera.position); v.project(K.camera); const sx = (v.x * 0.5 + 0.5) * W, sy = (v.y * 0.5 + 0.5) * H;
    K.cutP.set(hp.x, hp.y + 0.9, hp.z); const right = K.cutV2.set(1, 0, 0).applyQuaternion(K.camera.quaternion); K.cutP.add(right.multiplyScalar(2.6)).project(K.camera); const rx = (K.cutP.x * 0.5 + 0.5) * W; const k = 1 / (K.dual.enabled ? K.dual.ratio : 1); /* o cenário é desenhado em meia resolução (dual3d): o círculo vai nos pixels desse alvo */ if (!(window as unknown as { __cutHold?: boolean }).__cutHold) { cutOccT -= 1 / 60; if (cutOccT <= 0) { cutOccT = 0.12; { /* 10/11 (Erling: "tremor nas colunas da ponte"): com folga — liga com 9 de 10 raios escondidos, só desliga quando 6 ou menos, e a troca precisa de duas leituras seguidas iguais (antes piscava a cada 0,12 s com o herói meio atrás da coluna) */ const want = heroHidden(hp, cutOn ? 6 : 9); if (want !== cutOn) { cutFlip++; if (cutFlip >= 2) { cutOn = want; cutFlip = 0; } } else cutFlip = 0; } } setCutout(sx * k, sy * k, Math.abs(rx - sx) * k, K.cinemaSys.cine || !cutOn ? 0 : dist); const f = K.cutV2.set(0, 0, -1).applyQuaternion(K.camera.quaternion); const fl = Math.hypot(f.x, f.z) || 1; const fx = f.x / fl, fz = f.z / fl; setCutoutPlane(fx, fz, hp.x * fx + hp.z * fz - 1.4); } }
}
/* REGRA DA AURA (Erling, 28/10): o corte só liga quando o herói está pelo menos 90% escondido. Dez raios da câmera até pontos do
   corpo (5 alturas × 2 lados); se 9 ou mais batem em cenário antes de chegar nele, corta. Peças que nunca somem (correio, fonte,
   baú, pedra de teletransporte…) nem contam como obstáculo nem são cortadas (world3d: NOCUT_KINDS). */
let cutOccT = 0, cutOn = false, cutFlip = 0; const occRay = new THREE.Raycaster(), occP = new THREE.Vector3(), occR = new THREE.Vector3(), occD = new THREE.Vector3();
function heroHidden(hp: THREE.Vector3, need = 9): boolean {
  const root = K.inside ? K.inside.int.group : K.objs.group; if (!root.visible) return false; occR.set(1, 0, 0).applyQuaternion(K.camera.quaternion);
  let hid = 0, n = 0;
  for (const hy of [0.25, 0.6, 0.95, 1.3, 1.65]) for (const sd of [-0.22, 0.22]) { n++; occP.set(hp.x + occR.x * sd, hp.y + hy, hp.z + occR.z * sd);
    occD.copy(occP).sub(K.camera.position); const L = occD.length(); occRay.set(K.camera.position, occD.normalize()); occRay.far = L - 0.35;
    const hits = occRay.intersectObject(root, true); if (hits.some((h) => { const m = h.object as THREE.Mesh, mt = m.material as THREE.Material; let o: THREE.Object3D | null = m; while (o && o !== root) { if (!o.visible) return false; o = o.parent; } return !Array.isArray(mt) && !mt.transparent && mt.side !== THREE.BackSide && !(mt as THREE.Material & { isMeshBasicMaterial?: boolean }).isMeshBasicMaterial && !mt.userData.noCut; })) hid++;
    if (n - hid > 10 - need) return false; } // pontos demais à vista: não precisa cortar
  return hid >= need; }
/** anda deslizando: direto; senão por um eixo; senão contornando o canto (±35°, ±70°); se ficar preso, espreme-se entre os objetos */
let stuckT = 0;
function moveSlide(dx: number, dy: number, dt: number, trying: boolean) {
  if (trying && K.dgSys.heroSlowUntil > performance.now()) { dx *= K.dgSys.heroSlowK; dy *= K.dgSys.heroSlowK; }
  if (trying && K.dgSys.heroCharmUntil > performance.now()) { dx = -dx; dy = -dy; } /* encanto: os passos saem trocados */ /* rugido do chefe: lento por uns segundos */
  const x0 = K.state.fx, y0 = K.state.fy, L = Math.hypot(dx, dy); if (L < 1e-6) return;
  if (K.free(x0 + dx, y0 + dy)) { K.state.fx += dx; K.state.fy += dy; }
  else {
    if (K.free(x0 + dx, y0)) K.state.fx = x0 + dx; if (K.free(K.state.fx, y0 + dy)) K.state.fy = y0 + dy;
    if (K.state.fx === x0 && K.state.fy === y0) { const a0 = Math.atan2(dy, dx);
      for (const da of [0.6, -0.6, 1.2, -1.2]) { const a = a0 + da, ex = Math.cos(a) * L * 0.85, ey = Math.sin(a) * L * 0.85; if (K.free(x0 + ex, y0 + ey)) { K.state.fx = x0 + ex; K.state.fy = y0 + ey; break; } } }
  }
  const moved = Math.hypot(K.state.fx - x0, K.state.fy - y0);
  if (trying && moved < L * 0.25) { stuckT += dt; if (stuckT > 0.22 && K.free(x0 + dx, y0 + dy, true)) { K.state.fx = x0 + dx; K.state.fy = y0 + dy; } } else stuckT = Math.max(0, stuckT - dt * 2);
}
  return { get cutOn() { return cutOn; }, navProbe, get lmbHold() { return lmbHold; }, set lmbHold(v: typeof lmbHold) { lmbHold = v; }, planTo, moveSlide, get holdT() { return holdT; }, set holdT(v: typeof holdT) { holdT = v; }, followPath, updateXray, updateEnvelopes };
}
