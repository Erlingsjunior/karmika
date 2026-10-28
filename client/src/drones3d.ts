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
  /* 28/10 (Erling: "muito Jetsons, precisa ser mais steampunk"): uma caldeira de latão que anda. Corpo de caldeira com cintas e
     rebites, manômetro na frente, chaminé que solta vapor, cabeça de escafandro com uma lente azul, braços de mangueira de cobre,
     engrenagem girando no flanco, pernas de pistão e, nas costas, a bobina que projeta o escudo. */
  const g = new THREE.Group(), s = 1 + tier * 0.12;
  const brass = std(tier === 2 ? 0xb08a3a : 0x9a7430), copper = std(0x8a5228), iron = std(IRON), dark = std(0x2a2620), glass = glow(0x8ad0ff, 0.9), bone = std(0xe8dcc0);
  const add = (geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, p: THREE.Object3D = g) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); p.add(o); return o; };
  const legs: THREE.Object3D[] = [];
  for (const sx of [-1, 1]) { const hip = new THREE.Group(); hip.position.set(sx * 0.14 * s, 0.4 * s, 0); g.add(hip); legs.push(hip);
    add(new THREE.CylinderGeometry(0.05 * s, 0.05 * s, 0.2 * s, 8), copper, 0, -0.1 * s, 0, hip); // pistão de cima
    add(new THREE.CylinderGeometry(0.032 * s, 0.032 * s, 0.22 * s, 6), std(0xc8c8c0), 0, -0.24 * s, 0, hip); // haste polida
    add(new THREE.SphereGeometry(0.05 * s, 8, 6), brass, 0, -0.02 * s, 0, hip); // junta
    add(new THREE.BoxGeometry(0.13 * s, 0.07 * s, 0.22 * s), iron, 0, -0.37 * s, 0.03 * s, hip); add(new THREE.BoxGeometry(0.14 * s, 0.025 * s, 0.24 * s), brass, 0, -0.33 * s, 0.03 * s, hip); }
  /* a caldeira */
  add(new THREE.CylinderGeometry(0.22 * s, 0.24 * s, 0.4 * s, 14), copper, 0, 0.62 * s, 0);
  for (const y of [0.45, 0.62, 0.79]) add(new THREE.TorusGeometry(0.235 * s, 0.018 * s, 5, 18), brass, 0, y * s, 0).rotation.x = Math.PI / 2;
  for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; add(new THREE.SphereGeometry(0.014 * s, 4, 3), brass, Math.cos(a) * 0.245 * s, 0.53 * s, Math.sin(a) * 0.245 * s); add(new THREE.SphereGeometry(0.014 * s, 4, 3), brass, Math.cos(a + 0.3) * 0.24 * s, 0.71 * s, Math.sin(a + 0.3) * 0.24 * s); }
  add(new THREE.CylinderGeometry(0.2 * s, 0.22 * s, 0.05 * s, 14), brass, 0, 0.84 * s, 0);
  /* o manômetro na frente */
  const gz = 0.245 * s; add(new THREE.CylinderGeometry(0.075 * s, 0.075 * s, 0.03 * s, 14), brass, 0, 0.6 * s, gz).rotation.x = Math.PI / 2;
  add(new THREE.CircleGeometry(0.06 * s, 14), bone, 0, 0.6 * s, gz + 0.017 * s);
  const needle = add(new THREE.BoxGeometry(0.008 * s, 0.05 * s, 0.004), std(0x8a1a1a), 0, 0.6 * s, gz + 0.02 * s); needle.rotation.z = -0.6; needle.name = 'needle';
  /* a chaminé */
  add(new THREE.CylinderGeometry(0.035 * s, 0.03 * s, 0.24 * s, 8), iron, -0.12 * s, 0.98 * s, -0.08 * s); add(new THREE.CylinderGeometry(0.055 * s, 0.035 * s, 0.05 * s, 8), iron, -0.12 * s, 1.11 * s, -0.08 * s);
  /* a cabeça de escafandro: elmo de latão com a lente azul e as grades */
  const head = new THREE.Group(); head.position.set(0, 0.98 * s, 0.02 * s); g.add(head);
  add(new THREE.SphereGeometry(0.13 * s, 14, 10), brass, 0, 0, 0, head);
  add(new THREE.CylinderGeometry(0.075 * s, 0.075 * s, 0.04 * s, 14), dark, 0, 0, 0.11 * s, head).rotation.x = Math.PI / 2;
  add(new THREE.CircleGeometry(0.06 * s, 14), glass, 0, 0, 0.132 * s, head);
  for (const dx of [-0.03, 0, 0.03]) add(new THREE.BoxGeometry(0.006 * s, 0.12 * s, 0.006 * s), brass, dx * s, 0, 0.136 * s, head);
  for (const sx of [-1, 1]) add(new THREE.CylinderGeometry(0.035 * s, 0.035 * s, 0.03 * s, 8), copper, sx * 0.125 * s, 0, 0, head).rotation.z = Math.PI / 2;
  /* braços: mangueiras de cobre com garras */
  for (const sx of [-1, 1]) { const arm = new THREE.Group(); arm.position.set(sx * 0.26 * s, 0.74 * s, 0); arm.rotation.z = sx * 0.25; g.add(arm);
    for (let k = 0; k < 4; k++) add(new THREE.TorusGeometry(0.032 * s, 0.014 * s, 5, 8), copper, 0, -k * 0.055 * s, 0, arm).rotation.x = Math.PI / 2;
    add(new THREE.BoxGeometry(0.07 * s, 0.06 * s, 0.07 * s), iron, 0, -0.25 * s, 0, arm); }
  /* a engrenagem do flanco, que gira */
  const gear = new THREE.Group(); gear.position.set(0.25 * s, 0.6 * s, -0.04 * s); gear.rotation.y = Math.PI / 2; g.add(gear); gear.name = 'gear';
  add(new THREE.CylinderGeometry(0.07 * s, 0.07 * s, 0.025 * s, 12), brass, 0, 0, 0, gear).rotation.x = Math.PI / 2;
  for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2, t = add(new THREE.BoxGeometry(0.03 * s, 0.03 * s, 0.025 * s), brass, Math.cos(a) * 0.08 * s, Math.sin(a) * 0.08 * s, 0, gear); t.rotation.z = a; }
  /* nas costas, a bobina que projeta o escudo (a "dish" que o jogo anima) */
  const dish = new THREE.Group(); dish.position.set(0.1 * s, 0.92 * s, -0.2 * s); g.add(dish);
  add(new THREE.CylinderGeometry(0.02 * s, 0.03 * s, 0.24 * s, 6), iron, 0, 0, 0, dish);
  for (let k = 0; k < 4; k++) add(new THREE.TorusGeometry((0.05 - k * 0.008) * s, 0.008 * s, 4, 12), copper, 0, (0.04 + k * 0.035) * s, 0, dish).rotation.x = Math.PI / 2;
  add(new THREE.SphereGeometry(0.04 * s, 8, 6), glow(0x8ad0ff), 0, 0.2 * s, 0, dish);
  g.traverse((o) => { (o as THREE.Mesh).castShadow = false; });
  return { g, legs, dish, phase: 0, tier };
}

/** 28/10 (Erling: "faça um símbolo de um escudo holográfico que aparece na minha frente bloqueando os ataques"): nada de cúpula
 *  em volta do herói. Um escudo de brasão holográfico, de pé na frente dele, que só acende no instante em que segura um golpe. */
export interface Dome { g: THREE.Group; shell: THREE.MeshBasicMaterial; wire: THREE.MeshBasicMaterial; flash: number; r: number }
export function buildDome(tier: number): Dome {
  const r = [0.55, 0.62, 0.7][tier] ?? 0.55, g = new THREE.Group();
  const sh = new THREE.Shape(); sh.moveTo(-r, r * 1.05); sh.lineTo(r, r * 1.05); sh.lineTo(r, r * 0.1); sh.quadraticCurveTo(r * 0.95, -r * 0.85, 0, -r * 1.35); sh.quadraticCurveTo(-r * 0.95, -r * 0.85, -r, r * 0.1); sh.lineTo(-r, r * 1.05);
  const shell = new THREE.MeshBasicMaterial({ color: 0x6ad0ff, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, toneMapped: false });
  const wire = new THREE.MeshBasicMaterial({ color: 0xc8f2ff, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, toneMapped: false });
  g.add(new THREE.Mesh(new THREE.ShapeGeometry(sh, 10), shell));
  /* a borda e o emblema (uma cruz de faixas), em linhas claras */
  const rim = new THREE.Mesh(new THREE.ShapeGeometry((() => { const o = new THREE.Shape(sh.getPoints(24)); const k = 0.82, inner = new THREE.Path(sh.getPoints(24).map((p) => new THREE.Vector2(p.x * k, p.y * k + r * 0.02)).reverse()); o.holes.push(inner); return o; })(), 1), wire); rim.position.z = 0.01; g.add(rim);
  const bar = (w: number, h: number, x: number, y: number) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), wire); m.position.set(x, y, 0.012); g.add(m); };
  bar(r * 0.14, r * 1.6, 0, -r * 0.05); bar(r * 1.2, r * 0.14, 0, r * 0.35);
  g.traverse((o) => { (o as THREE.Mesh).castShadow = false; o.renderOrder = 5; }); g.visible = false;
  return { g, shell, wire, flash: 0, r };
}
