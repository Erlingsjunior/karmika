/* MOUSE NO CHÃO: o raio da câmera até o terreno, o marcador, os botões do mouse e a marca de clique (losango kármico que abre e some). Saiu do main.ts (02/11). */
import * as THREE from 'three';
import { fine } from '../dual3d';
import { heightAt } from '../world';
import { TILE_M as T } from '@karmika/shared';
import type { MouseCliqueCtx } from '../main';

export function createMouseClique(K: MouseCliqueCtx) {
const ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const marker = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.7, 4), new THREE.MeshBasicMaterial({ color: 0xf2b04a, side: THREE.DoubleSide }));
marker.rotation.x = -Math.PI / 2; marker.rotation.z = Math.PI / 4; marker.visible = false;
K.scene.add(fine(marker));
/* 17/11 (Erling: "foco pelo mouse igual Diablo 3"): o raio do mouse é refeito TODO QUADRO a partir do lugar do cursor na tela. Antes ele só
   era refeito quando o mouse se mexia: com o herói andando e a câmera indo junto, o cursor parado na tela apontava para um lugar velho do mundo. */
let cx = -1, cy = -1; const ndc = new THREE.Vector2(), pChao = new THREE.Vector3();
function refazRaio() { if (cx < 0) return; const r = K.canvas.getBoundingClientRect(); ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, K.camera); if (ray.ray.intersectPlane(plane, pChao)) { K.mouse.x = pChao.x; K.mouse.z = pChao.z; } }
addEventListener('pointermove', (e) => { cx = e.clientX; cy = e.clientY; sobreTela = e.target === K.canvas; refazRaio(); K.mouseMovedT = performance.now(); });
let sobreTela = true;
let rmb = false;
/* ---------- 16/11: o bicho debaixo do mouse, o Clique 1 (esquerdo) e o Clique 2 (direito) ----------
   O raio do mouse passa pelo corpo do bicho, não só pelo chão: com a câmera de cima, quem mira no peito do bicho toca o chão atrás dele. */
type Bicho = { alive: boolean; active: boolean; pos: { x: number; z: number }; def: { passive?: boolean; size?: number; scale?: number }; root: THREE.Object3D; ally?: boolean; /** o mouse está em cima: o bicho acende e mostra nome e vida */ sob?: boolean };
const pt = new THREE.Vector3();
/** o bicho debaixo do mouse neste quadro (achado uma vez por quadro em `tickClique`; todo o resto do jogo lê daqui) */
let sob: Bicho | null = null;
const bichoNoMouse = (): Bicho | null => (sob && sob.alive && sob.active ? sob : null);
function achaBicho(): Bicho | null { if (!sobreTela) return null; let b: Bicho | null = null, bd = 1e9; for (const e of K.game.enemies.list as unknown as Bicho[]) { if (!e.alive || !e.active || e.def.passive || e.ally || !e.root.visible) continue; const tam = e.def.size ?? 1, r = 0.75 + tam * 0.45; let d = 1e9; for (const h of [0.3, 1.0, 1.7]) { pt.set(e.pos.x, e.root.position.y + h * tam, e.pos.z); d = Math.min(d, ray.ray.distanceSqToPoint(pt)); } if (d < r * r && d < bd) { bd = d; b = e; } } return b; }
/** o esquerdo está apertado em cima de um bicho (bate enquanto segurar); e o bicho que o herói de corpo a corpo está indo buscar */
let lmbBate = false, busca: Bicho | null = null, buscaT = 0;
const dHeroi = (e: Bicho) => { const h = K.heroPosNow(); return Math.hypot(e.pos.x - h.x, e.pos.z - h.z); };
const ALCANCE_CORPO = 2.6;
/** bicho grande é alcançado de mais longe (o golpe pega no corpo dele, não no centro) */
const alcance = (e: Bicho) => ALCANCE_CORPO + Math.max(0, (e.def.scale ?? 1) - 1) * 0.7;
/** o esquerdo está apertado (em cima de bicho ou no chão) */
let lmb = false, ultimo: Bicho | null = null;
/** o Clique 1 em cima de um bicho: quem bate de longe ataca dali; o corpo a corpo vai até ele e bate quando chega */
function cliqueNoBicho(e: Bicho) { ultimo = e; K.cliqueSys.lmbHold = 0; K.foca(e); K.setCombat(true); if (K.game.longe() || dHeroi(e) <= alcance(e)) { busca = null; K.paraCaminho(); K.usaClique(1); } else { busca = e; buscaT = 0; K.planTo(e.pos.x / T, e.pos.z / T); } }
/** todo quadro: segue o bicho buscado, e repete o golpe básico enquanto o botão estiver apertado */
function tickClique(dt: number) {
  refazRaio(); { const b = K.game.menuOpen || K.build.on || K.cinemaSys.cine ? null : achaBicho(); if (b !== sob) { if (sob) sob.sob = false; sob = b; if (b) b.sob = true; K.canvas.style.cursor = b ? 'crosshair' : ''; } }
  if (busca) { if (!busca.alive || !busca.active) busca = null; else if (dHeroi(busca) <= alcance(busca)) { const e = busca; busca = null; K.paraCaminho(); K.foca(e); K.usaClique(1); } else { buscaT -= dt; if (buscaT <= 0) { buscaT = 0.35; K.planTo(busca.pos.x / T, busca.pos.z / T); } } }
  if (K.game.menuOpen) return;
  /* botão esquerdo SEGURADO (Diablo): em cima de um bicho, bate nele sem parar; passou o mouse para outro bicho, troca; o bicho morreu ou o
     mouse saiu para o chão, o herói anda atrás do mouse; chegou em outro bicho, bate de novo. Tudo sem soltar o botão. */
  if (lmb && !K.aimSlot) { const b = bichoNoMouse();
    if (b) { if (b !== ultimo || (!busca && !K.game.longe() && dHeroi(b) > alcance(b))) cliqueNoBicho(b); else if (!busca && (K.cliqueId(1) === 'combo' || K.cliquePronto(1))) { K.foca(b); K.usaClique(1); } }
    else if (lmbBate && !K.cliqueSys.lmbHold) { busca = null; ultimo = null; K.cliqueSys.lmbHold = performance.now() - 300; } }
  /* botão direito segurado repete a magia do Clique 2 assim que ela fica pronta de novo */
  if (rmb && (K.cliqueId(2) === 'combo' || (K.cliqueId(2) !== 'guard' && K.cliquePronto(2)))) { const b = bichoNoMouse(); if (b) K.foca(b); K.usaClique(2); }
}
addEventListener('pointerup', (e) => { if (e.button === 2) { rmb = false; K.soltaGuarda(); } if (e.button === 0) { K.cliqueSys.lmbHold = 0; lmbBate = false; lmb = false; ultimo = null; } });
addEventListener('blur', () => { rmb = false; lmbBate = false; lmb = false; ultimo = null; busca = null; K.cliqueSys.lmbHold = 0; /* 12/11: perdeu o foco com o botão apertado: o herói não segue mais o mouse sozinho */ });
/* marca de clique no chão: losango kármico que abre e some */
const clickMarks: { m: THREE.Mesh; t: number }[] = [];
const clickGeo = (() => { const sh = new THREE.Shape(); sh.moveTo(0, 0.55); sh.lineTo(0.38, 0); sh.lineTo(0, -0.55); sh.lineTo(-0.38, 0); sh.closePath(); const hole = new THREE.Path(); hole.moveTo(0, 0.32); hole.lineTo(0.22, 0); hole.lineTo(0, -0.32); hole.lineTo(-0.22, 0); hole.closePath(); sh.holes.push(hole); return new THREE.ShapeGeometry(sh).rotateX(-Math.PI / 2); })();
function clickMark(x: number, z: number, col = 0xffd24a) {
  const m = new THREE.Mesh(clickGeo, new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, side: THREE.DoubleSide }));
  m.position.set(x, (K.inside ? 0 : heightAt(x, z)) + 0.06, z); K.scene.add(fine(m)); clickMarks.push({ m, t: 0 });
}
function updateClickMarks(dt: number) { for (let i = clickMarks.length - 1; i >= 0; i--) { const c = clickMarks[i]; c.t += dt; const k = c.t / 0.5; c.m.scale.setScalar(0.6 + k * 1.1); c.m.rotation.y = k * 0.8; (c.m.material as THREE.MeshBasicMaterial).opacity = 0.9 * (1 - k); if (k >= 1) { K.scene.remove(c.m); (c.m.material as THREE.Material).dispose(); clickMarks.splice(i, 1); } } }
K.canvas.addEventListener('pointerdown', (e) => {
  if (K.cinemaSys.cine) return;
  if (!K.game.menuOpen && !K.build.on && (e.button === 0 || e.button === 2)) clickMark(K.mouse.x, K.mouse.z, e.button === 2 ? 0xff7a5a : 0xffd24a);
  if (K.build.on && (e.button === 0 || e.button === 2)) { e.preventDefault(); const r0 = K.canvas.getBoundingClientRect(); ray.setFromCamera(new THREE.Vector2(((e.clientX - r0.left) / r0.width) * 2 - 1, -((e.clientY - r0.top) / r0.height) * 2 + 1), K.camera); const p0 = new THREE.Vector3(); if (ray.ray.intersectPlane(plane, p0)) K.build.click(p0.x, p0.z, e.button); return; }
  /* 16/11: o botão direito usa a magia do Clique 2 (a guarda fica de pé enquanto o botão estiver apertado) */
  if (e.button === 2 && !K.game.menuOpen) { if (K.aimSlot) { K.fireAim(); return; } cx = e.clientX; cy = e.clientY; sobreTela = true; refazRaio(); sob = achaBicho(); const b2 = bichoNoMouse(); if (b2) K.foca(b2); K.setCombat(true); rmb = true; busca = null; K.usaClique(2); return; }
  if (e.button === 0 && K.aimSlot) { K.cancelAim(); return; }
  if (e.button !== 0 || K.game.menuOpen) return;
  /* 16/11: botão esquerdo em cima de um inimigo bate (Clique 1); no chão, anda */
  cx = e.clientX; cy = e.clientY; sobreTela = true; refazRaio(); sob = achaBicho(); lmb = true;
  { const b1 = bichoNoMouse(); if (b1) { lmbBate = true; cliqueNoBicho(b1); return; } busca = null; ultimo = null; lmbBate = true; }
  const r = K.canvas.getBoundingClientRect();
  ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), K.camera);
  const p = new THREE.Vector3();
  if (!ray.ray.intersectPlane(plane, p)) return;
  const tx = Math.floor(p.x / T), ty = Math.floor(p.z / T);
  K.planTo(p.x / T, p.z / T); K.cliqueSys.lmbHold = performance.now(); // segurar o botão: o herói segue o mouse (Diablo)
  marker.visible = false; // sem losango no chão: a marca de clique já mostra o destino
  marker.position.set((tx + 0.5) * T, 0.1, (ty + 0.5) * T);
});
  return { marker, plane, updateClickMarks, bichoNoMouse, tickClique, get rmb() { return rmb; } };
}
