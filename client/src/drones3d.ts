/** Os drones da Companhia de Latão (27/10, Erling: "não tenho dois drones voando sobre mim me ajudando"):
 *  - Drone de Cura: voa por cima do ombro do herói, quatro hélices, lente verde; a cada cura um feixe desce no herói.
 *  - Escudo Automatizado: um robozinho que ANDA ao lado do herói e projeta uma cúpula holográfica em volta dele.
 *  O Mk (0, 1, 2) muda tamanho, acabamento e o raio da cúpula. Tudo leve: poucas malhas, nenhuma PointLight. */
import * as THREE from 'three';
import { std } from './toon3d';

const BRASS = 0xc8963a, IRON = 0x3a3d44, COPPER = 0xb87333;
const glow = (c: number, o = 1) => new THREE.MeshBasicMaterial({ color: c, transparent: o < 1, opacity: o, depthWrite: o >= 1, toneMapped: false });

export interface HealDrone { g: THREE.Group; rotors: THREE.Object3D[]; lens: THREE.Mesh; beam: THREE.Mesh; beamT: number; tier: number }
export function buildHealDrone(tier: number): HealDrone {
  const g = new THREE.Group(), s = 1 + tier * 0.18, trim = std(tier === 2 ? 0xe0c060 : tier === 1 ? COPPER : BRASS), body = std(tier === 2 ? 0xe8efe8 : 0x6a8a7a), dark = std(IRON);
  const add = (geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); g.add(o); return o; };
  const core = add(new THREE.SphereGeometry(0.22 * s, 12, 8), body, 0, 0, 0); core.scale.y = 0.62;
  add(new THREE.TorusGeometry(0.22 * s, 0.035 * s, 6, 16), trim, 0, 0, 0).rotation.x = Math.PI / 2;
  add(new THREE.CylinderGeometry(0.07 * s, 0.09 * s, 0.08 * s, 10), dark, 0, 0.13 * s, 0); // tampa
  const lens = add(new THREE.SphereGeometry(0.075 * s, 10, 8), glow(0x7affd0), 0, -0.12 * s, 0); // a lente que cura (embaixo)
  add(new THREE.CircleGeometry(0.13 * s, 14), glow(0x7affd0, 0.35), 0, -0.135 * s, 0).rotation.x = Math.PI / 2;
  const rotors: THREE.Object3D[] = [];
  for (let k = 0; k < 4; k++) { const a = k / 4 * Math.PI * 2 + Math.PI / 4, x = Math.cos(a) * 0.36 * s, z = Math.sin(a) * 0.36 * s;
    const arm = add(new THREE.BoxGeometry(0.3 * s, 0.03 * s, 0.04 * s), dark, Math.cos(a) * 0.2 * s, 0.02, Math.sin(a) * 0.2 * s); arm.rotation.y = -a;
    add(new THREE.CylinderGeometry(0.035 * s, 0.035 * s, 0.07 * s, 8), trim, x, 0.04 * s, z);
    const r = new THREE.Group(); r.position.set(x, 0.09 * s, z); g.add(r); rotors.push(r);
    for (let b = 0; b < 2; b++) { const bl = new THREE.Mesh(new THREE.BoxGeometry(0.26 * s, 0.008, 0.035 * s), std(0xd8d8d0)); bl.rotation.y = b * Math.PI / 2; r.add(bl); }
    r.add(new THREE.Mesh(new THREE.CircleGeometry(0.14 * s, 12).rotateX(-Math.PI / 2), glow(0xffffff, 0.12))); }
  if (tier >= 1) for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2; add(new THREE.SphereGeometry(0.025 * s, 6, 4), glow(0x7affd0), Math.cos(a) * 0.17 * s, 0.03, Math.sin(a) * 0.17 * s); } // luzes de status
  if (tier >= 2) add(new THREE.ConeGeometry(0.025 * s, 0.2 * s, 5), trim, 0, 0.26 * s, 0); // antena do Mk III
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.12, 1, 8, 1, true).translate(0, -0.5, 0), glow(0x7affd0, 0.0)); beam.visible = false; g.add(beam);
  g.traverse((o) => { (o as THREE.Mesh).castShadow = false; });
  return { g, rotors, lens, beam, beamT: 0, tier };
}

export interface ShieldBot { g: THREE.Group; legs: THREE.Object3D[]; dish: THREE.Object3D; phase: number; tier: number }
export function buildShieldBot(tier: number): ShieldBot {
  const g = new THREE.Group(), s = 1 + tier * 0.15, shell = std(tier === 2 ? 0xd8dce4 : tier === 1 ? 0x8a9ab0 : 0x9aa4b4), trim = std(tier === 2 ? 0xe0c060 : BRASS), dark = std(IRON);
  const add = (geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, p: THREE.Object3D = g) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); p.add(o); return o; };
  const legs: THREE.Object3D[] = [];
  for (const sx of [-1, 1]) { const hip = new THREE.Group(); hip.position.set(sx * 0.13 * s, 0.42 * s, 0); g.add(hip); legs.push(hip);
    add(new THREE.CylinderGeometry(0.045 * s, 0.04 * s, 0.36 * s, 8), dark, 0, -0.18 * s, 0, hip); add(new THREE.BoxGeometry(0.12 * s, 0.05 * s, 0.18 * s), trim, 0, -0.38 * s, 0.03 * s, hip); }
  add(new THREE.BoxGeometry(0.38 * s, 0.32 * s, 0.3 * s), shell, 0, 0.6 * s, 0); // o corpo
  add(new THREE.BoxGeometry(0.4 * s, 0.05 * s, 0.32 * s), trim, 0, 0.44 * s, 0);
  const head = add(new THREE.SphereGeometry(0.15 * s, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), shell, 0, 0.76 * s, 0);
  add(new THREE.BoxGeometry(0.2 * s, 0.05 * s, 0.02), glow(0x9ad7ff), 0, 0.82 * s, 0.14 * s); void head; // o visor
  for (const sx of [-1, 1]) add(new THREE.CylinderGeometry(0.035 * s, 0.035 * s, 0.24 * s, 6), dark, sx * 0.23 * s, 0.6 * s, 0).rotation.z = sx * 0.3;
  const dish = new THREE.Group(); dish.position.set(0, 0.95 * s, 0); g.add(dish); // a emissora da cúpula
  add(new THREE.CylinderGeometry(0.02 * s, 0.02 * s, 0.2 * s, 5), dark, 0, 0, 0, dish);
  add(new THREE.SphereGeometry(0.06 * s, 8, 6), glow(0x6ad0ff), 0, 0.12 * s, 0, dish);
  add(new THREE.TorusGeometry(0.09 * s, 0.015 * s, 5, 12), trim, 0, 0.12 * s, 0, dish).rotation.x = Math.PI / 2;
  g.traverse((o) => { (o as THREE.Mesh).castShadow = false; });
  return { g, legs, dish, phase: 0, tier };
}

/** a cúpula holográfica: casca translúcida + malha de hexágonos (icosaedro em arame); raio pelo Mk */
export interface Dome { g: THREE.Group; shell: THREE.MeshBasicMaterial; wire: THREE.MeshBasicMaterial; flash: number; r: number }
export function buildDome(tier: number): Dome {
  const r = [1.15, 1.35, 1.6][tier] ?? 1.15, g = new THREE.Group();
  const shell = new THREE.MeshBasicMaterial({ color: 0x6ad0ff, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, toneMapped: false });
  const wire = new THREE.MeshBasicMaterial({ color: 0x9ae8ff, transparent: true, opacity: 0.35, wireframe: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
  const geoS = new THREE.SphereGeometry(r, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), geoW = new THREE.SphereGeometry(r * 1.01, 14, 6, 0, Math.PI * 2, 0, Math.PI / 2);
  g.add(new THREE.Mesh(geoS, shell)); const w = new THREE.Mesh(geoW, wire); w.scale.y = 1; g.add(w);
  const ring = new THREE.Mesh(new THREE.RingGeometry(r * 0.96, r * 1.04, 32).rotateX(-Math.PI / 2), shell); ring.position.y = 0.03; g.add(ring);
  g.traverse((o) => { (o as THREE.Mesh).castShadow = false; o.renderOrder = 5; });
  return { g, shell, wire, flash: 0, r };
}
