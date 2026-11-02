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
addEventListener('pointermove', (e) => {
  const r = K.canvas.getBoundingClientRect();
  ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), K.camera);
  const p = new THREE.Vector3(); if (ray.ray.intersectPlane(plane, p)) { K.mouse.x = p.x; K.mouse.z = p.z; K.mouseMovedT = performance.now(); }
});
let rmb = false;
addEventListener('pointerup', (e) => { if (e.button === 2) rmb = false; if (e.button === 0) K.cliqueSys.lmbHold = 0; });
addEventListener('blur', () => { rmb = false; });
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
  if (e.button === 2 && !K.game.menuOpen) { if (K.aimSlot) { K.fireAim(); return; } K.setCombat(true); rmb = true; K.game.attack(K.aimYaw(), K.heroPosNow()); return; }
  if (e.button === 0 && K.aimSlot) { K.cancelAim(); return; }
  if (e.button !== 0 || K.game.menuOpen) return;
  const r = K.canvas.getBoundingClientRect();
  ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), K.camera);
  const p = new THREE.Vector3();
  if (!ray.ray.intersectPlane(plane, p)) return;
  const tx = Math.floor(p.x / T), ty = Math.floor(p.z / T);
  K.planTo(p.x / T, p.z / T); K.cliqueSys.lmbHold = performance.now(); // segurar o botão: o herói segue o mouse (Diablo)
  marker.visible = false; // sem losango no chão: a marca de clique já mostra o destino
  marker.position.set((tx + 0.5) * T, 0.1, (ty + 0.5) * T);
});
  return { marker, plane, updateClickMarks, get rmb() { return rmb; } };
}
