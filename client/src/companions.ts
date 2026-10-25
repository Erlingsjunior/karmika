/** Companheiros: pet que coleta itens e montaria. Modelos quadrúpedes reaproveitados dos inimigos. */
import * as THREE from 'three';
import { buildQuad, animQuadWalk } from './enemies';
import { mergeStatic } from './merge3d';
import { fine } from './dual3d';
import { ramp } from './toon3d';

export interface PetKind { id: string; name: string; quad: 'fox' | 'wolf' | 'rat' | 'horse' | 'boar'; tint?: number; scale: number; speed: number; silent?: boolean }
export const PETS: Record<string, PetKind> = {
  pet_fox: { id: 'pet_fox', name: 'Raposa Ruiva', quad: 'fox', scale: 0.9, speed: 6.5 },
  pet_pup: { id: 'pet_pup', name: 'Filhote de Lobo', quad: 'wolf', tint: 0x8a8a8a, scale: 0.55, speed: 6.0 },
};
export interface MountKind { id: string; name: string; tint?: number; scale: number; speed: number }
export const MOUNTS: Record<string, MountKind> = {
  mount_horse: { id: 'mount_horse', name: 'Cavalo Baio', scale: 1.0, speed: 1.75 },
  mount_black: { id: 'mount_black', name: 'Corcel Negro', tint: 0x1a1612, scale: 1.05, speed: 1.9 },
};

export function createPet(scene: THREE.Scene, kind: PetKind, heightAt: (x: number, z: number) => number) {
  const q = buildQuad(kind.quad, kind.tint); const root = new THREE.Group(); root.scale.setScalar(kind.scale); root.add(q.root); mergeStatic(q.root, ramp); fine(root); scene.add(root);
  const pos = new THREE.Vector3(), tgt = new THREE.Vector3(); let yaw = 0, ph = 0, placed = false, idleT = 0;
  const el = document.createElement('div'); el.className = 'npc pet'; el.innerHTML = `<b>${kind.name}</b>`; document.body.appendChild(el); if (kind.silent) el.style.display = 'none';
  let carrying = false;
  /** goal: ponto para onde o pet vai (item para pegar) ou null → segue o herói */
  function update(dt: number, t: number, hero: THREE.Vector3, heroYaw: number, goal: THREE.Vector3 | null, camera: THREE.Camera, canvas: HTMLCanvasElement) {
    if (!placed) { pos.set(hero.x - Math.sin(heroYaw) * 1.4, 0, hero.z - Math.cos(heroYaw) * 1.4); placed = true; }
    if (goal) tgt.copy(goal); else { const back = 1.5 + Math.sin(t * 0.5) * 0.3; tgt.set(hero.x - Math.sin(heroYaw) * back + Math.cos(heroYaw) * 0.9, 0, hero.z - Math.cos(heroYaw) * back - Math.sin(heroYaw) * 0.9); }
    const dx = tgt.x - pos.x, dz = tgt.z - pos.z, dd = Math.hypot(dx, dz);
    const far = Math.hypot(hero.x - pos.x, hero.z - pos.z);
    if (far > 26) { pos.set(hero.x - Math.sin(heroYaw) * 1.4, 0, hero.z - Math.cos(heroYaw) * 1.4); }
    let mv = 0;
    if (dd > (goal ? 0.5 : 0.9)) { const sp = Math.min(kind.speed, dd * 3) * dt; pos.x += dx / dd * Math.min(sp, dd); pos.z += dz / dd * Math.min(sp, dd); mv = Math.min(kind.speed, dd * 3); const w = Math.atan2(dx, dz); let df = w - yaw; while (df > Math.PI) df -= 6.283; while (df < -Math.PI) df += 6.283; yaw += df * Math.min(1, dt * 8); idleT = 0; }
    else { idleT += dt; if (!goal && idleT > 1.5) { const w = heroYaw; let df = w - yaw; while (df > Math.PI) df -= 6.283; while (df < -Math.PI) df += 6.283; yaw += df * Math.min(1, dt * 2); } }
    ph += dt * (6 + mv * 2.2) * (mv > 0.1 ? 1 : 0);
    pos.y = heightAt(pos.x, pos.z);
    root.position.copy(pos); root.rotation.y = yaw;
    animQuadWalk(q, ph, mv, t, 7);
    carrying = !!goal;
    const v = new THREE.Vector3(pos.x, pos.y + 0.9 * kind.scale, pos.z).project(camera); const r = canvas.getBoundingClientRect(); const show = v.z < 1 && far < 16;
    if (!kind.silent) el.style.display = show ? 'block' : 'none'; if (show && !kind.silent) { el.style.left = r.left + (v.x * 0.5 + 0.5) * r.width + 'px'; el.style.top = r.top + (-v.y * 0.5 + 0.5) * r.height + 'px'; }
  }
  function dispose() { scene.remove(root); el.remove(); }
  return { kind, pos, update, dispose, get carrying() { return carrying; }, root };
}

export function createMount(scene: THREE.Scene, kind: MountKind) {
  const q = buildQuad('horse', kind.tint); const root = new THREE.Group(); root.scale.setScalar(kind.scale);
  // sela e rédeas
  const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.12, 0.6), new THREE.MeshToonMaterial({ color: 0x4a2a16, gradientMap: ramp })); saddle.position.set(0, q.P.h * 0.62 + 0.04, 0.05); q.body.add(saddle);
  const blanket = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.05, 0.8), new THREE.MeshToonMaterial({ color: 0x8a2a2a, gradientMap: ramp })); blanket.position.set(0, q.P.h * 0.6, 0.05); q.body.add(blanket);
  for (const sx of [-1, 1]) { const st = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.015, 5, 10), new THREE.MeshToonMaterial({ color: 0xc9a24a, gradientMap: ramp })); st.position.set(sx * 0.34, q.P.h * 0.15, 0.05); q.body.add(st); }
  // crina
  for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.16, 0.14), new THREE.MeshToonMaterial({ color: kind.tint ?? 0x2e2018, gradientMap: ramp })); m.position.set(0, 0.2 + i * 0.1, 0.02 + i * 0.1); q.neck.add(m); }
  root.add(q.root); mergeStatic(q.root, ramp); fine(root); root.visible = false; scene.add(root);
  let ph = 0;
  const seatY = () => (q.P.leg + q.P.h * 0.4 + q.P.h * 0.66) * kind.scale; // altura do assento em relação ao chão
  function update(dt: number, t: number, pos: THREE.Vector3, yaw: number, moveSp: number) {
    root.visible = true; root.position.copy(pos); root.rotation.y = yaw; ph += dt * (5 + moveSp * 1.6) * (moveSp > 0.1 ? 1 : 0);
    animQuadWalk(q, ph, moveSp, t, 3);
  }
  function hide() { root.visible = false; }
  return { kind, update, hide, seatY, root };
}
