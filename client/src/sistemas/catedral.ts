/* CATEDRAL ABANDONADA: a nave, as 3 criptas, a Porta do Bispo (3 selos) e o salão do Bispo; entrar e descer nas criptas, o sermão e o espírito. Saiu do main.ts (02/11). */
import { type EnemyType } from '../world';
import * as THREE from 'three';
import { type CathedralFloor, buildCathedralFloor } from '../cathedral3d';
import { TILE_M as T } from '@karmika/shared';
import type { CatedralCtx } from '../main';

export function createCatedral(K: CatedralCtx) {
/* ---------- Catedral Abandonada: nave, 3 criptas enormes, a Porta do Bispo (3 selos) e o salão do Bispo Caído ---------- */
const CRYPT_FLOORS: { name: string; types: [EnemyType, number][]; elite?: { type: EnemyType; name: string; hpMul: number; dmgMul: number; scale: number; seal?: string } }[] = [
  { name: 'Nave da Catedral', types: [['zombie', 18], ['imp', 8], ['ghoul', 2]] },
  { name: 'Cripta dos Esquecidos', types: [['zombie', 26], ['imp', 10], ['ghoul', 6]], elite: { type: 'tormentor', name: 'Carrasco das Criptas', hpMul: 2.2, dmgMul: 1.3, scale: 1.2, seal: 'seal_1' } },
  { name: 'Mausoléu dos Príncipes', types: [['zombie', 28], ['ghoul', 14], ['imp', 8]], elite: { type: 'prince', name: 'Príncipe Ósseo', hpMul: 2.6, dmgMul: 1.4, scale: 1.25, seal: 'seal_2' } },
  { name: 'Câmara dos Selos', types: [['zombie', 30], ['ghoul', 18], ['imp', 8]], elite: { type: 'tormentor', name: 'Guardião do Mausoléu', hpMul: 3.0, dmgMul: 1.5, scale: 1.4, seal: 'seal_3' } },
  { name: 'Salão do Bispo Caído', types: [['zombie', 8], ['ghoul', 2]] },
];
/* Vasilhame do Sacrifício: o sangue de cada morto da Catedral escorre para a taça do andar. 666 litros no total abrem o caminho até o Bispo.
   Os mortos se reerguem enquanto a taça não enche, então o portão nunca depende de "matar todos". */
const BLOOD_NEED = [111, 166, 222, 167]; // 666
const BLOOD_OF: Partial<Record<EnemyType, number>> = { zombie: 3, imp: 2, ghoul: 6, tormentor: 30, prince: 30 };
let blood: number[] = (() => { try { const a = JSON.parse(localStorage.getItem('karmika.crypt.blood') || '[]'); return [0, 1, 2, 3].map((i) => Math.min(BLOOD_NEED[i], +a[i] || 0)); } catch { return [0, 0, 0, 0]; } })();
const bloodFull = (f: number) => f >= 1 && f <= 4 && blood[f - 1] >= BLOOD_NEED[f - 1];
const bloodTotal = () => blood.reduce((a, b) => a + b, 0);
let raiseT = 0, raiseWait = 0;
const bloodHud = document.createElement('div'); bloodHud.id = 'bloodhud'; document.body.appendChild(bloodHud);
function drawBloodHud() {
  const f = K.inside?.crypt; if (!f || f > 4 || localStorage.getItem('karmika.crypt.done') === '1') { bloodHud.style.display = 'none'; return; }
  const have = Math.floor(blood[f - 1]), need = BLOOD_NEED[f - 1], k = Math.min(1, have / need), full = have >= need;
  bloodHud.style.display = 'block'; bloodHud.classList.toggle('full', full);
  bloodHud.innerHTML = `<div class="bh-t">🩸 Vasilhame do Sacrifício</div><div class="bh-bar"><i style="width:${(k * 100).toFixed(1)}%"></i><span>${have} / ${need} L</span></div><div class="bh-s">${full ? (f < 4 ? 'A taça transbordou — a escada em espiral está aberta' : 'A taça transbordou — a Porta do Bispo aceita os selos') : 'cada morto deste andar derrama seu sangue na taça'} · total ${Math.floor(bloodTotal())} / 666</div>`;
}
function pourBlood(e: { type: EnemyType; pos: THREE.Vector3; def: { name: string } }) {
  const f = K.inside?.crypt; if (!f || f > 4 || !cryptInt?.vessel) return;
  const L = (BLOOD_OF[e.type] ?? 3);
  const was = bloodFull(f); blood[f - 1] = Math.min(BLOOD_NEED[f - 1], blood[f - 1] + L); try { localStorage.setItem('karmika.crypt.blood', JSON.stringify(blood)); } catch { /* */ }
  // o sangue voa do corpo até a taça
  const vx = K.IX + cryptInt.vessel.x, vz = K.IZ + cryptInt.vessel.z;
  for (let i = 0; i < 26; i++) { const life = 0.9 + Math.random() * 0.5, x0 = e.pos.x + (Math.random() - 0.5) * 0.8, z0 = e.pos.z + (Math.random() - 0.5) * 0.8, y0 = 0.6 + Math.random();
    setTimeout(() => K.particles.spawn(x0, y0, z0, { vx: (vx - x0) / life, vy: (2.4 - y0) / life, vz: (vz - z0) / life, life, s0: 0.18, s1: 0.07, c0: 0xff2030, c1: 0x6a0008, a: 1 }), i * 18); }
  drawBloodHud();
  if (!was && bloodFull(f)) { K.audio.boom(); K.game.logMsg(f < 4 ? `🩸 O Vasilhame do Sacrifício transbordou: ${BLOOD_NEED[f - 1]} litros. A escada em espiral se abre para o andar ${f + 1}.` : '🩸 666 litros. O sangue escorre por baixo da Porta do Bispo — ela agora aceita os três selos.', '#ff6a6a'); }
}
/** enquanto a taça não enche, os mortos voltam a se erguer longe de você */
function updateBlood(dt: number, t: number) {
  const f = K.inside?.crypt; if (!cryptInt?.vessel || !f || f > 4) { if (bloodHud.style.display !== 'none') bloodHud.style.display = 'none'; return; }
  const done = localStorage.getItem('karmika.crypt.done') === '1';
  cryptInt.vessel.fill(done ? 1 : blood[f - 1] / BLOOD_NEED[f - 1], t);
  if (done || bloodFull(f)) return;
  raiseWait -= dt; raiseT -= dt; if (raiseT > 0 || raiseWait > 0) return; raiseT = 4.5;
  const alive = K.game.enemies.list.filter((e) => (e as typeof e & { tag?: string }).tag === 'crypt' && e.alive).length;
  const base = CRYPT_FLOORS[f - 1].types.reduce((a, [, n]) => a + n, 0);
  if (alive >= base * 0.45) return;
  const hp = K.heroPosNow(), pts = cryptInt.spawnPts.filter((q) => Math.hypot(K.IX + q.x - hp.x, K.IZ + q.z - hp.z) > 16); if (!pts.length) return;
  const lvl = 8 + f * 4, k = 1 + (f - 1) * 0.45;
  for (let i = 0; i < 2; i++) { const q = pts[Math.floor(Math.random() * pts.length)], x = K.IX + q.x + (Math.random() - 0.5) * 3, z = K.IZ + q.z + (Math.random() - 0.5) * 3; const ty = CRYPT_FLOORS[f - 1].types[Math.floor(Math.random() * CRYPT_FLOORS[f - 1].types.length)][0];
    K.game.enemies.spawn(ty, x, z, { tag: 'crypt', hpMul: k, dmgMul: k, lvl, aggro: 26, leash: 999, net: `c${f}r` });
    for (let j = 0; j < 20; j++) K.particles.spawn(x + (Math.random() - 0.5), 0.1, z + (Math.random() - 0.5), { vy: 1.5 + Math.random() * 2, life: 1, s0: 0.2, s1: 0.03, c0: 0x6a5a7a, c1: 0x1a1020, a: 0.8 }); }
}
let cryptInt: CathedralFloor | null = null, bishop: ReturnType<typeof K.game.enemies.spawn> | null = null, bishopPhase = 0, sermonT = 0;
function enterCrypt(floor: number, p: (typeof K.city.props)[number]) {
  K.feats.max('crypt', floor);
  K.withFade(() => {
    if (K.inside) K.scene.remove(K.inside.int.group);
    K.game.enemies.clearTag('crypt'); bishop = null; bishopPhase = 0; sermonT = 6;
    const int = buildCathedralFloor(floor, p.gx * 31 + p.gy); cryptInt = int;
    int.group.position.set(K.IX, 0, K.IZ); K.scene.add(int.group);
    K.inside = { int, ret: { x: p.gx + p.w / 2 + 0.8, y: p.gy + p.h + 0.8 }, prop: p, crypt: floor };
    K.objs.group.visible = false; K.casteloSys.sitting = null; for (const n of K.npcSys.npcs) n.hero.root.visible = false;
    K.state.fx = (K.IX + int.W / 2) / T; K.state.fy = (K.IZ + int.D - 1.2) / T; K.state.path = [];
    K.heroY = 0; K.camX = K.IX + int.W / 2; K.camZ = K.IZ + int.D / 2; K.camY = 0;
    const fl = CRYPT_FLOORS[floor - 1]; const lvl = 8 + floor * 4, k = 1 + (floor - 1) * 0.45;
    const pts = [...int.spawnPts]; let pi = 0; const at = () => { const q = pts.length ? pts[pi++ % pts.length] : { x: int.W / 2, z: int.D / 2 }; return { x: K.IX + q.x + (Math.random() - 0.5) * 3, z: K.IZ + q.z + (Math.random() - 0.5) * 3 }; };
    for (const [type, n] of fl.types) for (let i = 0; i < n; i++) { const q = at(); K.game.enemies.spawn(type, q.x, q.z, { tag: 'crypt', hpMul: k, dmgMul: k, lvl, aggro: 26, leash: 999, net: `c${floor}` }); } // dentro da Catedral os mortos caçam quem entra
    if (fl.elite) K.game.enemies.spawn(fl.elite.type, K.IX + int.elitePt.x, K.IZ + int.elitePt.z, { tag: 'crypt', name: fl.elite.name, hpMul: fl.elite.hpMul, dmgMul: fl.elite.dmgMul, scale: fl.elite.scale, lvl: lvl + 4, net: `c${floor}e` });
    raiseWait = 8; raiseT = 0; drawBloodHud();
    if (floor === 5) { bishop = K.game.enemies.spawn('bishop', K.IX + int.elitePt.x, K.IZ + int.elitePt.z, { tag: 'crypt', hpMul: 1, dmgMul: 1, lvl: 28, net: 'c5b' }); K.chat.sys('O Bispo Caído ergue o báculo: "Ajoelhe-se. Gorvak tem fome, e eu sou a boca."'); }
    K.game.logMsg(`⚰ ${fl.name}${floor < 4 ? ` — encha o Vasilhame do Sacrifício (${BLOOD_NEED[floor - 1]} L) para abrir a escada em espiral` : floor === 4 ? ' — encha a taça e traga os três selos para a Porta do Bispo' : ' — não há volta sem o fim'}`, '#c8b8ff');
  });
}
  return { enterCrypt, pourBlood, CRYPT_FLOORS, get bishopPhase() { return bishopPhase; }, set bishopPhase(v: typeof bishopPhase) { bishopPhase = v; }, get sermonT() { return sermonT; }, set sermonT(v: typeof sermonT) { sermonT = v; }, get cryptInt() { return cryptInt; }, set cryptInt(v: typeof cryptInt) { cryptInt = v; }, get bishop() { return bishop; }, set bishop(v: typeof bishop) { bishop = v; }, bloodFull, get blood() { return blood; }, BLOOD_NEED, drawBloodHud, updateBlood };
}
