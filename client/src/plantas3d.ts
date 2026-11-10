/** Plantas decorativas das pranchas 56 e 57 do Herik (01/11), por bioma. Não se colhem (as ervas de herborismo continuam em `herb`);
 *  são cenário parado, mescladas na malha estática do pedaço. Poucas e em canteiros (Erling: "cuidado com as quantidades"). */
import * as THREE from 'three';
import { std } from './toon3d';

export type Plant = 'raspberry' | 'blueBush' | 'fern' | 'tallGrass' | 'wildflowers' | 'mushroomsRed' | 'cattail' | 'agave' | 'mossRock' | 'blueberry'
  | 'foxglove' | 'thistle' | 'rose' | 'ivyStump' | 'mushroomsBrown' | 'rhubarb' | 'lavender' | 'lilypad' | 'bamboo' | 'cactus' | 'pitcher' | 'dryShrub';

/** plantas por bioma, com peso */
export const PLANTS: Record<string, [Plant, number][]> = {
  meadow: [['wildflowers', 4], ['raspberry', 2], ['tallGrass', 1.2], ['lavender', 2], ['rose', 1]],
  forest: [['fern', 4], ['mushroomsRed', 2], ['blueberry', 2], ['foxglove', 2], ['tallGrass', 0.4]],
  enchanted: [['fern', 3], ['mossRock', 2], ['mushroomsBrown', 2], ['foxglove', 3], ['wildflowers', 1]],
  snow: [['thistle', 3], ['dryShrub', 3], ['blueBush', 1]],
  swamp: [['cattail', 4], ['fern', 2], ['pitcher', 2], ['mushroomsBrown', 1]],
  ruins: [['dryShrub', 4], ['thistle', 2], ['ivyStump', 2]],
  rock: [['agave', 3], ['thistle', 2], ['mossRock', 2], ['dryShrub', 1]],
  volcanic: [['dryShrub', 4], ['thistle', 1]],
  blight: [['dryShrub', 4], ['pitcher', 2], ['mushroomsBrown', 2]],
  jungle: [['fern', 3], ['bamboo', 3], ['rhubarb', 2], ['pitcher', 1]],
  coast: [['agave', 3], ['cactus', 3], ['tallGrass', 0.4], ['wildflowers', 1]],
};
/** plantas que só ficam na água rasa (beira) */
export const WATER_PLANTS: Partial<Record<string, Plant>> = { swamp: 'lilypad', meadow: 'lilypad', forest: 'lilypad', enchanted: 'lilypad' };
export function pickPlant(biome: string, h: number): Plant { const L = PLANTS[biome] ?? PLANTS.meadow; const tot = L.reduce((s, e) => s + e[1], 0); let k = h * tot; for (const [p, w] of L) { if (k < w) return p; k -= w; } return L[0][0]; }

const rng = (seed: number) => { let a = seed | 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const mats = new Map<number, THREE.Material>(); const M = (c: number) => { let m = mats.get(c); if (!m) { m = std(c, { side: THREE.DoubleSide }); mats.set(c, m); } return m; };
type Ctx = { g: THREE.Group; r: () => number; add: (geo: THREE.BufferGeometry, c: number, x: number, y: number, z: number) => THREE.Mesh };
/** folha achatada (cone esmagado) apontando para fora, inclinada */
function leaf(C: Ctx, c: number, a: number, len: number, w: number, tilt: number, y = 0.02, d = 0.04, wave = 0) {
  const geo = new THREE.ConeGeometry(w, len, 4); geo.scale(1, 1, 0.25); const m = C.add(geo, c, Math.cos(a) * d, y + Math.sin(tilt) * len * 0.5, Math.sin(a) * d);
  m.rotation.set(0, -a, 0); m.rotateX(Math.PI / 2 - tilt); m.rotateZ(wave); return m;
}
const B: Record<Plant, (C: Ctx) => void> = {
  raspberry: (C) => { for (let k = 0; k < 8; k++) leaf(C, k % 2 ? 0x4e8a34 : 0x5e9a3c, k * 0.8 + C.r(), 0.5, 0.16, 0.55 + C.r() * 0.4); for (let k = 0; k < 5; k++) { const a = C.r() * 6.283; C.add(new THREE.IcosahedronGeometry(0.045, 0), 0xe890a8, Math.cos(a) * 0.25, 0.25 + C.r() * 0.25, Math.sin(a) * 0.25); } },
  blueBush: (C) => { for (let k = 0; k < 14; k++) leaf(C, k % 3 ? 0x3a8a84 : 0x5ab0a8, k * 0.45 + C.r(), 0.45 + C.r() * 0.2, 0.06, 0.6 + C.r() * 0.7, 0.02, 0.1); for (let k = 0; k < 3; k++) { const a = C.r() * 6.283; C.add(new THREE.IcosahedronGeometry(0.035, 0), 0x6a4ad0, Math.cos(a) * 0.2, 0.3 + C.r() * 0.15, Math.sin(a) * 0.2); } },
  fern: (C) => { for (let k = 0; k < 8; k++) { const f = leaf(C, k % 2 ? 0x3e8a2c : 0x55a63a, k * 0.79 + C.r() * 0.3, 0.8 + C.r() * 0.3, 0.14, 0.35 + C.r() * 0.3); f.scale.set(1, 1, 1.6); } },
  tallGrass: (C) => { for (let k = 0; k < 12; k++) { const a = C.r() * 6.283, h = 0.6 + C.r() * 0.5; const b = C.add(new THREE.ConeGeometry(0.025, h, 3), k % 3 ? 0x8aa048 : 0xa8b860, Math.cos(a) * 0.2 * C.r(), h / 2, Math.sin(a) * 0.2 * C.r()); b.rotation.set((C.r() - 0.5) * 0.5, 0, (C.r() - 0.5) * 0.5); } },
  wildflowers: (C) => { for (let k = 0; k < 7; k++) { const a = C.r() * 6.283, d = C.r() * 0.3, h = 0.25 + C.r() * 0.25; C.add(new THREE.CylinderGeometry(0.008, 0.012, h, 3), 0x5a8a3a, Math.cos(a) * d, h / 2, Math.sin(a) * d);
      C.add(new THREE.IcosahedronGeometry(0.04, 0), [0xffd040, 0xffffff, 0x5a8aff][k % 3], Math.cos(a) * d, h + 0.02, Math.sin(a) * d); } for (let k = 0; k < 5; k++) leaf(C, 0x5a9a3a, C.r() * 6.283, 0.3, 0.05, 0.7); },
  mushroomsRed: (C) => { for (let k = 0; k < 4; k++) { const a = C.r() * 6.283, d = k ? 0.12 + C.r() * 0.12 : 0, s = k ? 0.55 + C.r() * 0.3 : 1; C.add(new THREE.CylinderGeometry(0.03 * s, 0.04 * s, 0.2 * s, 5), 0xe8dcc0, Math.cos(a) * d, 0.1 * s, Math.sin(a) * d);
      C.add(new THREE.SphereGeometry(0.11 * s, 7, 4, 0, 6.283, 0, 1.5), k % 2 ? 0xd04020 : 0xd08030, Math.cos(a) * d, 0.17 * s, Math.sin(a) * d); } },
  cattail: (C) => { for (let k = 0; k < 7; k++) { const a = C.r() * 6.283, d = C.r() * 0.25, h = 0.9 + C.r() * 0.5; const st = C.add(new THREE.CylinderGeometry(0.012, 0.018, h, 4), 0x8aa04a, Math.cos(a) * d, h / 2, Math.sin(a) * d); st.rotation.set((C.r() - 0.5) * 0.2, 0, (C.r() - 0.5) * 0.2);
      if (k % 2 === 0) C.add(new THREE.CylinderGeometry(0.035, 0.035, 0.2, 5), 0x5a3a1c, Math.cos(a) * d, h - 0.1, Math.sin(a) * d); } for (let k = 0; k < 6; k++) leaf(C, 0x6a8a3a, C.r() * 6.283, 0.8, 0.04, 1.1); },
  agave: (C) => { for (let k = 0; k < 12; k++) { const t = k < 6 ? 0.55 : 0.95; leaf(C, k % 2 ? 0x6ab0b0 : 0x8ac8c0, k * 1.05 + (k < 6 ? 0 : 0.5), k < 6 ? 0.7 : 0.5, 0.11, t); } },
  mossRock: (C) => { for (let k = 0; k < 4; k++) { const a = k * 1.6, d = k ? 0.3 : 0, s = k ? 0.5 + C.r() * 0.3 : 1; const geo = new THREE.IcosahedronGeometry(0.42 * s, 0); geo.scale(1, 0.7, 1); C.add(geo, 0x7a8a6a, Math.cos(a) * d, 0.22 * s, Math.sin(a) * d);
      const mg = new THREE.IcosahedronGeometry(0.4 * s, 0); mg.scale(1, 0.45, 1); C.add(mg, 0x5a8a2a, Math.cos(a) * d, 0.4 * s, Math.sin(a) * d); } for (let k = 0; k < 3; k++) leaf(C, 0x55a63a, C.r() * 6.283, 0.4, 0.08, 0.5, 0.1, 0.45); },
  blueberry: (C) => { for (let k = 0; k < 9; k++) { const a = C.r() * 6.283, h = 0.5 + C.r() * 0.35; const st = C.add(new THREE.CylinderGeometry(0.008, 0.014, h, 3), 0x1a2030, Math.cos(a) * 0.15, h / 2, Math.sin(a) * 0.15); st.rotation.set((C.r() - 0.5) * 0.6, 0, (C.r() - 0.5) * 0.6);
      C.add(new THREE.IcosahedronGeometry(0.04, 0), 0x3a4ab0, Math.cos(a) * 0.2, h * 0.8, Math.sin(a) * 0.2); } for (let k = 0; k < 5; k++) leaf(C, 0x2a4a3a, C.r() * 6.283, 0.3, 0.06, 0.6, 0.15, 0.12); },
  foxglove: (C) => { const h = 0.95; C.add(new THREE.CylinderGeometry(0.012, 0.02, h, 4), 0x5a8a3a, 0, h / 2, 0); for (let k = 0; k < 9; k++) { const a = k * 2.1, y = 0.4 + k * 0.06; const bell = new THREE.ConeGeometry(0.035, 0.08, 5); bell.rotateX(Math.PI); C.add(bell, k % 2 ? 0xd050b0 : 0xe878c8, Math.cos(a) * 0.05, y, Math.sin(a) * 0.05); }
    for (let k = 0; k < 6; k++) leaf(C, 0x4e8a34, k * 1.05, 0.4, 0.1, 0.5); },
  thistle: (C) => { for (let k = 0; k < 3; k++) { const a = k * 2.1, d = k ? 0.12 : 0, h = 0.45 + C.r() * 0.2; C.add(new THREE.CylinderGeometry(0.01, 0.015, h, 4), 0x5a8a6a, Math.cos(a) * d, h / 2, Math.sin(a) * d); C.add(new THREE.IcosahedronGeometry(0.05, 0), 0x4a7a5a, Math.cos(a) * d, h, Math.sin(a) * d); C.add(new THREE.ConeGeometry(0.05, 0.1, 6), 0xd060c0, Math.cos(a) * d, h + 0.08, Math.sin(a) * d); }
    for (let k = 0; k < 6; k++) leaf(C, 0x4a7a6a, k * 1.05 + 0.3, 0.3, 0.06, 0.5); },
  rose: (C) => { for (let k = 0; k < 7; k++) { const a = C.r() * 6.283, h = 0.4 + C.r() * 0.35; const st = C.add(new THREE.CylinderGeometry(0.01, 0.015, h, 4), 0x3a5a2a, Math.cos(a) * 0.12, h / 2, Math.sin(a) * 0.12); st.rotation.set((C.r() - 0.5) * 0.5, 0, (C.r() - 0.5) * 0.5);
      if (k < 4) C.add(new THREE.IcosahedronGeometry(0.06, 0), 0xf0a0c0, Math.cos(a) * 0.17, h * 0.85, Math.sin(a) * 0.17); } for (let k = 0; k < 7; k++) leaf(C, 0x3a6a2a, C.r() * 6.283, 0.3, 0.08, 0.5, 0.1 + C.r() * 0.25, 0.14); },
  ivyStump: (C) => { C.add(new THREE.CylinderGeometry(0.22, 0.28, 0.5, 7), 0x5a3a24, 0, 0.25, 0); for (let k = 0; k < 10; k++) { const a = C.r() * 6.283, d = 0.2 + C.r() * 0.2; const l = C.add(new THREE.ConeGeometry(0.07, 0.16, 4), k % 2 ? 0x3e7a2c : 0x55963a, Math.cos(a) * d, 0.15 + C.r() * 0.45, Math.sin(a) * d); l.scale.z = 0.3; l.rotation.set(0, -a, 0); l.rotateX(1.3); } },
  mushroomsBrown: (C) => { for (let k = 0; k < 3; k++) { const a = k * 2.0, d = k ? 0.16 : 0, s = k ? 0.6 : 1; C.add(new THREE.CylinderGeometry(0.04 * s, 0.05 * s, 0.26 * s, 5), 0xe8d8b8, Math.cos(a) * d, 0.13 * s, Math.sin(a) * d); C.add(new THREE.SphereGeometry(0.15 * s, 7, 4, 0, 6.283, 0, 1.4), 0x6a4020, Math.cos(a) * d, 0.22 * s, Math.sin(a) * d);
      for (let j = 0; j < 3; j++) { const b = C.r() * 6.283; C.add(new THREE.IcosahedronGeometry(0.014, 0), 0xf0e0c0, Math.cos(a) * d + Math.cos(b) * 0.08 * s, 0.3 * s, Math.sin(a) * d + Math.sin(b) * 0.08 * s); } } },
  rhubarb: (C) => { for (let k = 0; k < 6; k++) { const f = leaf(C, k % 2 ? 0x3a8a2c : 0x4a9a3a, k * 1.05 + C.r() * 0.3, 0.7, 0.3, 0.75, 0.1); f.scale.set(1.3, 1, 1.6); C.add(new THREE.CylinderGeometry(0.015, 0.02, 0.35, 4), 0xc03a3a, Math.cos(k * 1.05) * 0.08, 0.17, Math.sin(k * 1.05) * 0.08); } },
  lavender: (C) => { for (let k = 0; k < 9; k++) { const a = C.r() * 6.283, d = C.r() * 0.2, h = 0.35 + C.r() * 0.2; C.add(new THREE.CylinderGeometry(0.008, 0.01, h, 3), 0x7a9a7a, Math.cos(a) * d, h / 2, Math.sin(a) * d); C.add(new THREE.CylinderGeometry(0.02, 0.025, 0.12, 5), 0x7040c0, Math.cos(a) * d, h + 0.04, Math.sin(a) * d); } for (let k = 0; k < 8; k++) leaf(C, 0x8aa88a, C.r() * 6.283, 0.25, 0.03, 0.9); },
  lilypad: (C) => { for (let k = 0; k < 4; k++) { const a = k * 1.6 + C.r() * 0.5, d = k ? 0.3 + C.r() * 0.25 : 0; const pad = new THREE.CircleGeometry(0.2 + C.r() * 0.1, 7, 0.3, 5.7); pad.rotateX(-Math.PI / 2); C.add(pad, k % 2 ? 0x4a9a3a : 0x3a8a34, Math.cos(a) * d, 0.02, Math.sin(a) * d);
      if (k < 2) { C.add(new THREE.IcosahedronGeometry(0.05, 0), 0xffffff, Math.cos(a) * d, 0.06, Math.sin(a) * d); C.add(new THREE.IcosahedronGeometry(0.02, 0), 0xffd040, Math.cos(a) * d, 0.1, Math.sin(a) * d); } } },
  bamboo: (C) => { for (let k = 0; k < 5; k++) { const a = C.r() * 6.283, d = 0.1 + C.r() * 0.2, h = 1.6 + C.r() * 0.9; const st = C.add(new THREE.CylinderGeometry(0.03, 0.035, h, 5), 0x7aa040, Math.cos(a) * d, h / 2, Math.sin(a) * d); st.rotation.set((C.r() - 0.5) * 0.12, 0, (C.r() - 0.5) * 0.12);
      for (let j = 1; j < 4; j++) C.add(new THREE.CylinderGeometry(0.036, 0.036, 0.03, 5), 0x4a7020, Math.cos(a) * d, h * j / 4, Math.sin(a) * d); for (let j = 0; j < 3; j++) leaf(C, 0x5a9a3a, C.r() * 6.283, 0.3, 0.03, 0.2, h * 0.6 + j * 0.25, d); } },
  cactus: (C) => { const h = 1.2; C.add(new THREE.CylinderGeometry(0.13, 0.15, h, 8), 0x4a8a3a, 0, h / 2, 0); C.add(new THREE.SphereGeometry(0.13, 8, 5), 0x4a8a3a, 0, h, 0);
    for (const [sx, y] of [[1, 0.55], [-1, 0.4]] as [number, number][]) { C.add(new THREE.CylinderGeometry(0.07, 0.07, 0.3, 6), 0x4a8a3a, sx * 0.2, y, 0).rotation.z = Math.PI / 2; C.add(new THREE.CylinderGeometry(0.07, 0.08, 0.4, 6), 0x4a8a3a, sx * 0.33, y + 0.2, 0); C.add(new THREE.SphereGeometry(0.07, 6, 4), 0x4a8a3a, sx * 0.33, y + 0.4, 0); }
    C.add(new THREE.CylinderGeometry(0.06, 0.07, 0.4, 6), 0x5a9a4a, 0.45, 0.2, 0.2); },
  pitcher: (C) => { for (let k = 0; k < 5; k++) { const a = k * 1.25 + C.r() * 0.3, d = 0.08 + C.r() * 0.1, h = 0.35 + C.r() * 0.25; const tube = new THREE.CylinderGeometry(0.05, 0.025, h, 6); C.add(tube, k % 2 ? 0xd8a020 : 0xe06030, Math.cos(a) * d, h / 2, Math.sin(a) * d);
      const lid = new THREE.CircleGeometry(0.06, 6); lid.rotateX(-Math.PI / 2); C.add(lid, 0xc04020, Math.cos(a) * d + 0.02, h + 0.03, Math.sin(a) * d); } for (let k = 0; k < 6; k++) leaf(C, 0x6a8a2a, k * 1.05, 0.35, 0.08, 0.35); },
  dryShrub: (C) => { for (let k = 0; k < 10; k++) { const a = C.r() * 6.283, h = 0.4 + C.r() * 0.5; const st = C.add(new THREE.CylinderGeometry(0.006, 0.014, h, 3), k % 2 ? 0x6a5a6a : 0x8a7a8a, Math.cos(a) * 0.1, h / 2, Math.sin(a) * 0.1); st.rotation.set((C.r() - 0.5) * 0.9, 0, (C.r() - 0.5) * 0.9); } },
};
const cache = new Map<string, THREE.Group>();
/** uma planta (grupo com várias malhas pequenas); o chamador mescla no estático */
export function buildPlant(p: Plant, seed: number): THREE.Group {
  const key = p + (seed % 3); let src = cache.get(key);
  if (!src) { const g = new THREE.Group(), r = rng(seed * 7 + 11); const C: Ctx = { g, r, add: (geo, c, x, y, z) => { const m = new THREE.Mesh(geo, M(c)); m.position.set(x, y, z); g.add(m); return m; } }; B[p](C); src = g; cache.set(key, src); }
  return src.clone();
}
