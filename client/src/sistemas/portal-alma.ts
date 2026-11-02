/* A ALMA DEPOIS DA MORTE: retomar o limiar, os fôlegos na tela e o portal de volta. Saiu do main.ts (02/11). */
import { FRAY_LVL, MAX_BREATHS } from '../soul';
import * as THREE from 'three';
import { TILE_M as T } from '@karmika/shared';
import { heightAt } from '../world';
import { fine } from '../dual3d';
import type { PortalAlmaCtx } from '../main';

export function createPortalAlma(K: PortalAlmaCtx) {
function resumeSoul() { if (!K.profile || K.limiar.active) return; if (K.soul.s.pending === 'choose') K.unbind(); else if (K.soul.s.pending === 'reborn') K.unbind(undefined, 'reborn'); }
/* os fôlegos ficam à vista, em cima do orbe da vida (só depois que o Olho abre: antes o Fio não se gasta) */
setInterval(() => { const el = document.getElementById('folegos'); if (!el) return; K.soul.regen(); const on = !!K.profile?.eye && K.game.st.lvl >= FRAY_LVL;
  const html = on ? Array.from({ length: MAX_BREATHS }, (_, i) => `<i class="${i < K.soul.s.breaths ? '' : 'off'}"></i>`).join('') : '';
  if (el.innerHTML !== html) el.innerHTML = html;
  el.title = on ? `Fio da Vida: ${K.soul.s.breaths}/${MAX_BREATHS} fôlegos${K.soul.s.breaths < MAX_BREATHS ? ` · o próximo volta em ${K.soul.nextBreathH()}h` : ''}. Sem fôlego, a alma desencarna e sobe ao Limiar.${K.inv.count('lagrima') ? ` · Lágrimas: ${K.inv.count('lagrima')}` : ''}` : ''; }, 1000);
K.game.setXpFilter((n, c) => { const r = K.soul.filter(n, c);
  if (r.paid && r.debtLeft === 0) K.game.logMsg('⚖ A Dívida Kármica está paga. O XP volta inteiro para você.', '#ffe08a');
  if (r.echoDone) K.game.logMsg(`✦ O eco da vida passada se cala: você é de novo ${c.name} nível ${c.lvl}. Daqui em diante, o caminho normal.`, '#c9a0ff');
  return r; });
/* portal da Deusa dos Caminhos: um arco de luz violeta surge à frente; entrar nele leva ao lar */
let portal: { m: THREE.Group; x: number; z: number; t: number } | null = null;
function openPortal() {
  if (portal) { K.scene.remove(portal.m); portal = null; }
  const yaw = K.hero.root.rotation.y, px = K.state.fx * T + Math.sin(yaw) * 2.2, pz = K.state.fy * T + Math.cos(yaw) * 2.2, py = heightAt(px, pz);
  const g = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.09, 8, 32), new THREE.MeshBasicMaterial({ color: 0xb8a8ff })); ring.position.y = 1.3; g.add(ring);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(1.02, 32), new THREE.MeshBasicMaterial({ color: 0x5a3aff, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending })); disc.position.y = 1.3; g.add(disc);
  const lamp = new THREE.PointLight(0x8f7bff, 2.5, 9); lamp.position.y = 1.4; g.add(lamp);
  g.position.set(px, py, pz); g.rotation.y = yaw; K.scene.add(fine(g)); portal = { m: g, x: px, z: pz, t: 25 };
  K.hero.act('cast'); K.game.logMsg('📜 Um caminho se abre à sua frente. Entre nele para voltar ao lar.', '#b8a8ff');
}
function updatePortal(dt: number, t: number) {
  if (!portal) return; portal.t -= dt; portal.m.rotation.y += dt * 0.6; (portal.m.children[1] as THREE.Mesh).scale.setScalar(1 + Math.sin(t * 5) * 0.06);
  if (Math.random() < dt * 30) K.particles.spawn(portal.x + (Math.random() - 0.5) * 2, 0.3 + Math.random() * 2.2, portal.z + (Math.random() - 0.5) * 2, { vy: 0.6, life: 0.9, s0: 0.14, s1: 0.02, c0: 0xffffff, c1: 0x8f7bff, a: 1 });
  const d = Math.hypot(K.state.fx * T - portal.x, K.state.fy * T - portal.z);
  if (d < 1.1 || portal.t <= 0) { K.scene.remove(portal.m); const go = d < 1.1; portal = null; if (go) K.goHome(`✦ A Deusa dos Caminhos encurta a estrada: você sai na fonte de ${K.home.name}.`); else K.game.logMsg('O caminho se fecha.', '#8a7a5a'); }
}
  return { openPortal, resumeSoul, updatePortal };
}
