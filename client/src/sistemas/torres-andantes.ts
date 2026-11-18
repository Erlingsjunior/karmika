/* TORRES E ROBÔS QUE ANDAM (12/11, Erling: "torre de escudo anda até o tanque e o protege; a torre de metralhadora segue e defende os danos").
   As quatro magias de grupo do Tecnocrata com alvo "torre" ganham corpo: a engenhoca nasce ao lado de quem lançou, ANDA até o companheiro (ou até você,
   se estiver sozinho), fica ao lado dele enquanto a magia dura, seguindo os passos, e depois se dobra.
   Só o desenho e o andar moram aqui; o efeito (defesa, cura, dano) continua em grupo-magias.ts. Tudo é feito de poucas peças, sem textura, e some sozinho. */
import * as THREE from 'three';
import { std, ink, inkMat } from '../toon3d';
import { fine } from '../dual3d';

export type TorreKind = 'escudo' | 'robo' | 'cura' | 'drone';
export interface TorresCtx { scene: THREE.Scene; heightAt(x: number, z: number): number; /** fagulha/vapor */ puff(x: number, y: number, z: number, c0: number, c1: number): void }
type P = { x: number; z: number };
const BRASS = 0xc9973a, DARK = 0x3a2c1e, STEEL = 0x8f98a6;
const box = (w: number, h: number, d: number, c: number) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), std(c)); ink(m, 0.03); return m; };
const cyl = (r0: number, r1: number, h: number, c: number, n = 10) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, n), std(c)); ink(m, 0.03); return m; };
const glowMat = (c: number, o: number) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });

function build(kind: TorreKind) { const g = new THREE.Group(), legs: THREE.Object3D[] = []; let top: THREE.Object3D | null = null, aura: THREE.Mesh | null = null, col = 0x6ae0ff;
  const leg = (x: number, z: number, len: number, y: number) => { const piv = new THREE.Group(); piv.position.set(x, y, z); const up = box(0.07, len, 0.07, DARK); up.position.y = -len / 2; const foot = box(0.13, 0.05, 0.18, BRASS); foot.position.set(0, -len, 0.03); piv.add(up, foot); g.add(piv); legs.push(piv); };
  if (kind === 'escudo' || kind === 'cura') { /* torre sobre quatro pernas de latão */
    for (const [x, z] of [[-0.24, -0.2], [0.24, -0.2], [-0.24, 0.2], [0.24, 0.2]]) leg(x, z, 0.5, 0.52);
    const base = cyl(0.3, 0.36, 0.3, BRASS, 8); base.position.y = 0.66; const neck = cyl(0.16, 0.22, 0.42, DARK, 8); neck.position.y = 1.0; g.add(base, neck);
    if (kind === 'escudo') { col = 0x8ac8ff; const emit = cyl(0.26, 0.18, 0.16, STEEL, 6); emit.position.y = 1.3; const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.13), glowMat(col, 0.95)); gem.position.y = 1.52; g.add(emit, gem); top = gem;
      aura = new THREE.Mesh(new THREE.IcosahedronGeometry(1.5, 1), new THREE.MeshBasicMaterial({ color: col, wireframe: true, transparent: true, opacity: 0.32, depthWrite: false, toneMapped: false })); aura.position.y = 1.0; }
    else { col = 0x7af0a0; const tank = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 8), glowMat(col, 0.55)); tank.position.y = 1.36; const cap = cyl(0.1, 0.14, 0.12, BRASS, 8); cap.position.y = 1.62; g.add(tank, cap); top = tank;
      aura = new THREE.Mesh(new THREE.RingGeometry(2.3, 2.5, 40), glowMat(col, 0.5)); aura.rotation.x = -Math.PI / 2; aura.position.y = 0.12; } }
  else if (kind === 'robo') { /* robô de proteção: duas pernas, tronco largo, escudo de braço */ col = 0xffd24a;
    leg(-0.17, 0, 0.55, 0.6); leg(0.17, 0, 0.55, 0.6);
    const torso = box(0.56, 0.6, 0.36, BRASS); torso.position.y = 0.95; const head = box(0.26, 0.22, 0.26, DARK); head.position.y = 1.38; const eye = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 0.02), glowMat(col, 1)); eye.position.set(0, 1.4, 0.14);
    const sh = box(0.08, 0.8, 0.6, STEEL); sh.position.set(0.4, 0.95, 0.12); const arm = box(0.12, 0.5, 0.12, DARK); arm.position.set(-0.36, 0.9, 0); g.add(torso, head, eye, sh, arm); top = head; }
  else { /* drone armado: paira, com hélice e cano */ col = 0xff9a5a;
    const body = new THREE.Group(); body.position.y = 1.9; const hull = cyl(0.2, 0.26, 0.2, BRASS, 8); const gun = cyl(0.035, 0.035, 0.42, DARK, 6); gun.rotation.x = Math.PI / 2; gun.position.set(0, -0.1, 0.24);
    const rot = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.015, 0.07), std(STEEL)); rot.position.y = 0.16; const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), glowMat(col, 1)); lamp.position.set(0, -0.02, 0.27); body.add(hull, gun, rot, lamp); g.add(body); top = rot; }
  if (aura) g.add(aura);
  return { g, legs, top, aura, col }; }

export function createTorres(K: TorresCtx) {
  const live: { stop(): void }[] = [];
  /** nasce em `from`, anda até quem `follow()` aponta e fica ao lado dele por `dur` segundos */
  function spawn(kind: TorreKind, from: P, follow: () => P | null, dur: number) { if (live.length >= 6) live.shift()!.stop();
    const B = build(kind), g = B.g; fine(g); g.userData.noCull = true; g.scale.setScalar(0.01); let x = from.x, z = from.z, ph = Math.random() * 6, dead = false, last = performance.now(), aimT = 0, goal: P = { x, z }; const t0 = last, side = Math.random() < 0.5 ? 1 : -1;
    g.position.set(x, K.heightAt(x, z), z); K.scene.add(g); for (let i = 0; i < 10; i++) K.puff(x, K.heightAt(x, z) + 0.4, z, 0xffffff, B.col);
    const gone = () => { if (dead) return; dead = true; K.scene.remove(g); g.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh && m.material !== inkMat) { m.geometry.dispose(); (m.material as THREE.Material).dispose(); } /* (o contorno usa um material do jogo inteiro: não se solta) */ }); const i = live.indexOf(H); if (i >= 0) live.splice(i, 1); };
    const H = { stop: gone }; live.push(H);
    const step = () => { if (dead) return; const now = performance.now(), dt = Math.min(0.1, (now - last) / 1000), age = (now - t0) / 1000; last = now;
      if (age > dur + 0.6) { for (let i = 0; i < 8; i++) K.puff(x, g.position.y + 0.5, z, 0xcccccc, 0x666666); gone(); return; }
      aimT -= dt; if (aimT <= 0) { aimT = 0.2; const f = follow(); if (f) { /* para ao lado do companheiro, nunca em cima dele */ const dx = x - f.x, dz = z - f.z, dd = Math.hypot(dx, dz) || 1, keep = kind === 'drone' ? 0.9 : 1.5; goal = dd > keep + 0.4 ? { x: f.x + (dx / dd) * keep + (-dz / dd) * 0.5 * side, z: f.z + (dz / dd) * keep + (dx / dd) * 0.5 * side } : { x, z }; } }
      const dx = goal.x - x, dz = goal.z - z, dist = Math.hypot(dx, dz), sp = kind === 'drone' ? 9 : 5.2, mv = Math.min(dist, sp * dt), walking = dist > 0.08;
      if (walking) { x += (dx / dist) * mv; z += (dz / dist) * mv; const yaw = Math.atan2(dx, dz); let d = yaw - g.rotation.y; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; g.rotation.y += d * Math.min(1, dt * 9); ph += dt * 13; }
      const k = Math.min(1, age / 0.35) * Math.max(0, Math.min(1, (dur + 0.6 - age) / 0.5)); g.scale.setScalar(Math.max(0.01, k));
      g.position.set(x, K.heightAt(x, z) + (kind === 'drone' ? Math.sin(now / 260) * 0.08 : walking ? Math.abs(Math.sin(ph)) * 0.035 : 0), z);
      B.legs.forEach((l, i) => { const tgt = walking ? Math.sin(ph + (i % 2 ? Math.PI : 0) + (i > 1 ? Math.PI : 0)) * 0.55 : 0; l.rotation.x += (tgt - l.rotation.x) * Math.min(1, dt * 16); });
      if (B.top) { if (kind === 'drone') B.top.rotation.y += dt * 40; else if (kind !== 'robo') B.top.rotation.y += dt * 1.6; }
      if (B.aura) { if (kind === 'escudo') { B.aura.rotation.y += dt * 0.5; (B.aura.material as THREE.MeshBasicMaterial).opacity = walking ? 0.1 : 0.26 + 0.08 * Math.sin(now / 300); } else { const s = 1 + 0.06 * Math.sin(now / 350); B.aura.scale.set(s, s, 1); } }
      if (kind === 'cura' && Math.random() < dt * 9) { const a = Math.random() * 6.283, r = Math.random() * 2.2; K.puff(x + Math.cos(a) * r, g.position.y + 0.3, z + Math.sin(a) * r, 0xffffff, B.col); }
      requestAnimationFrame(step); };
    requestAnimationFrame(step); return H; }
  return { spawn, count: () => live.length };
}
export const TORRE_DE: Record<string, TorreKind> = { g_torreescudo: 'escudo', g_roboguardiao: 'robo', g_torrecura: 'cura', g_droneartilheiro: 'drone' };
