/** O Castelo do Conde Vladislav por dentro (27/10, Erling): seis andares — dois subterrâneos, o térreo com as salas
 *  (biblioteca, salão de baile, sala do piano, ala dos criados), a galeria, o andar só de quartos e, no alto, o salão
 *  particular do Conde: instrumentos de tortura, sangue, e o trono dentro da piscina de sangue onde a Corte transforma.
 *  Origem local (0,0) = canto noroeste; saída ao sul (z > D) só no térreo. A câmera olha de sudeste: paredes norte e
 *  oeste altas, sul e leste baixas. Cada andar devolve as escadas (subir/descer) e os pontos de spawn. */
import * as THREE from 'three';
import { std, ink, stoneTex, woodTex, plankTex, plasterTex, ramp } from './toon3d';
import { mergeStatic } from './merge3d';
import type { Interior } from './interiors3d';

export interface CastleFloor extends Interior {
  up?: { x: number; z: number }; down?: { x: number; z: number };
  spawnPts: { x: number; z: number }[];
  throne?: { x: number; z: number };
  /** o Poço da Visão do castelo (regra 27/10: toda maravilha tem o seu) */ well?: { x: number; z: number };
  name: string; bloodTick(t: number): void;
}
export const CASTLE_FLOORS = ['Catacumbas da Corte', 'Masmorras e Adega', 'Térreo — o Salão de Entrada', 'A Galeria dos Retratos', 'O Andar dos Quartos', 'O Salão Particular do Conde'];
const rr = (s: number) => () => { s = (s * 16807) % 2147483647; return s / 2147483647; };

export function buildCastleFloor(F: number, seed = 5): CastleFloor {
  const W = 48, D = 36, H = F === 5 ? 12 : F === 2 ? 10 : 7, g = new THREE.Group(), cols: [number, number, number][] = [], rects: [number, number, number, number][] = [], r = rr(seed * 31 + 7 + F * 101);
  const under = F < 2, top = F === 5;
  const stone = std(0xffffff, { map: stoneTex(under ? 0x2e2a30 : 0x4a4048) }), stoneD = std(0xffffff, { map: stoneTex(0x221e26) }), plaster = std(0xffffff, { map: plasterTex(top ? 0x4a2a30 : 0x6a5a58) });
  const wood = std(0xffffff, { map: woodTex(0x3a2418) }), plank = std(0xffffff, { map: plankTex(0x4e3220) }), velvet = std(0x6a1020), gold = std(0xc9a24a), iron = std(0x2a2c32), bone = std(0xd8d0b8), cloth = std(0x3a2a44);
  const glow = (c: number) => new THREE.MeshBasicMaterial({ color: c, toneMapped: false });
  const blood = new THREE.MeshBasicMaterial({ color: 0x8a0a14, toneMapped: false }); const bloods: THREE.Mesh[] = [];
  const add = (geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, inked = true, ry = 0) => { const b = new THREE.Mesh(geo, m); if (inked) ink(b, 0.03); b.position.set(x, y, z); b.rotation.y = ry; b.castShadow = true; b.receiveShadow = true; g.add(b); return b; };
  const B = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
  const box = (w: number, h: number, d: number, x: number, y: number, z: number, m: THREE.Material, ry = 0) => add(B(w, h, d), m, x, y + h / 2, z, true, ry);
  const cyl = (rt: number, rb: number, h: number, x: number, y: number, z: number, m: THREE.Material, seg = 10) => add(new THREE.CylinderGeometry(rt, rb, h, seg), m, x, y + h / 2, z);
  const solid = (x: number, z: number, rad: number) => cols.push([x, z, rad]);
  const rect = (x0: number, z0: number, x1: number, z1: number) => rects.push([x0, z0, x1, z1]);
  const fixtures: { x: number; y: number; z: number; c: number; i: number; dist: number }[] = [];
  const light = (x: number, y: number, z: number, c: number, i: number, dist = 14) => fixtures.push({ x, y, z, c, i, dist });
  const flame = (x: number, y: number, z: number, s = 1, c = 0xffb040) => { const f = new THREE.Mesh(new THREE.ConeGeometry(0.13 * s, 0.46 * s, 6), glow(c)); f.position.set(x, y, z); f.userData.dyn = true; g.add(f); return f; };
  const candle = (x: number, y: number, z: number, s = 1) => { add(new THREE.CylinderGeometry(0.05 * s, 0.05 * s, 0.3 * s, 5), std(0xe8dcc0), x, y + 0.15 * s, z, false); flame(x, y + 0.42 * s, z, 0.45 * s, 0xffd080); };
  const torch = (x: number, z: number, dx: number, dz: number) => { cyl(0.08, 0.1, 0.55, x, 2.6, z, iron, 6); flame(x, 3.25, z, 1.1); light(x + dx, 3.2, z + dz, 0xffa050, 22, 11); };
  const sconce = (x: number, z: number, dx: number, dz: number, c = 0xff9a60) => { add(B(0.3, 0.5, 0.2), iron, x, 2.5, z, false); for (let k = -1; k <= 1; k++) candle(x + dx * 0.25 + (dz ? k * 0.18 : 0), 2.7, z + dz * 0.25 + (dx ? k * 0.18 : 0), 0.9); light(x + dx, 3.0, z + dz, c, 14, 9); };

  /* ---- chão, paredes externas, teto escuro em volta ---- */
  { const dark = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.MeshBasicMaterial({ color: 0x06050a })); dark.rotation.x = -Math.PI / 2; dark.position.set(W / 2, -0.08, D / 2); g.add(dark);
    const t = (F === 2 || F === 3 ? stoneTex(0x5a5250) : F === 4 ? plankTex(0x4e3220) : top ? stoneTex(0x3a2a30) : stoneTex(0x2a262c)).clone(); t.repeat.set(W / 2.5, D / 2.5); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.needsUpdate = true;
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(W, D), std(0xffffff, { map: t })); fl.rotation.x = -Math.PI / 2; fl.position.set(W / 2, 0, D / 2); fl.receiveShadow = true; g.add(fl); }
  const wallM = under ? stoneD : top ? stone : plaster;
  box(W + 1, H, 1.2, W / 2, 0, -0.6, wallM); box(1.2, H, D + 1, -0.6, 0, D / 2, wallM);
  for (let k = 0; k <= W / 6; k++) box(1.2, H, 0.7, k * 6, 0, 0.15, stone); for (let k = 1; k <= D / 6; k++) box(0.7, H, 1.2, 0.15, 0, k * 6, stone);
  if (!under) { box(W + 1, 0.35, 1.0, W / 2, H - 1.4, 0.1, wood); box(1.0, 0.35, D + 1, 0.1, H - 1.4, D / 2, wood); }
  const lowH = 0.8, dw = 6, doorS = F === 2; // porta ao sul só no térreo
  if (doorS) { box((W - dw) / 2, lowH, 0.6, (W - dw) / 4, 0, D + 0.3, stone); box((W - dw) / 2, lowH, 0.6, W - (W - dw) / 4, 0, D + 0.3, stone); for (const sx of [-1, 1]) { box(1.2, 5.5, 1.2, W / 2 + sx * (dw / 2 + 0.7), 0, D + 0.3, stone); torch(W / 2 + sx * (dw / 2 + 0.7), D - 0.6, 0, -1); } }
  else box(W + 1, lowH, 0.6, W / 2, 0, D + 0.3, stone);
  box(0.6, lowH, D, W + 0.3, 0, D / 2, stone);
  // janelas ogivais (nas paredes altas): luz da lua vermelha entrando nos andares de cima
  if (!under) for (let k = 0; k < 5; k++) { const x = 6 + k * 9; add(new THREE.PlaneGeometry(1.4, 3.2), glow(top ? 0x6a1a2a : 0x3a4a7a), x, 4.2, 0.62, false); add(new THREE.CylinderGeometry(0.7, 0.7, 0.05, 10, 1, false, 0, Math.PI), glow(top ? 0x6a1a2a : 0x3a4a7a), x, 5.8, 0.62, false).rotation.set(Math.PI / 2, 0, 0); light(x, 4.0, 2.2, top ? 0x8a2a3a : 0x6a7ab0, 6, 10); }

  /* ---- paredes internas (com vãos) ---- */
  const PH = 3.4; /* paredes internas baixas: a câmera isométrica precisa ver dentro das salas */
  const wallX = (x0: number, x1: number, z: number, gaps: [number, number][] = [], h = PH) => { const segs: [number, number][] = []; let a = x0; for (const [g0, g1] of gaps.sort((p, q) => p[0] - q[0])) { if (g0 > a) segs.push([a, g0]); a = g1; } if (a < x1) segs.push([a, x1]);
    for (const [s0, s1] of segs) { box(s1 - s0, h, 0.5, (s0 + s1) / 2, 0, z, wallM); rect(s0, z - 0.4, s1, z + 0.4); } for (const [g0, g1] of gaps) { box(g1 - g0 + 0.5, 0.4, 0.6, (g0 + g1) / 2, h - 0.4, z, wood); } };
  const wallZ = (x: number, z0: number, z1: number, gaps: [number, number][] = [], h = PH) => { const segs: [number, number][] = []; let a = z0; for (const [g0, g1] of gaps.sort((p, q) => p[0] - q[0])) { if (g0 > a) segs.push([a, g0]); a = g1; } if (a < z1) segs.push([a, z1]);
    for (const [s0, s1] of segs) { box(0.5, h, s1 - s0, x, 0, (s0 + s1) / 2, wallM); rect(x - 0.4, s0, x + 0.4, s1); } for (const [g0, g1] of gaps) { box(0.6, 0.4, g1 - g0 + 0.5, x, h - 0.4, (g0 + g1) / 2, wood); } };
  /* ---- escadas: um lance largo de pedra com corrimão; o ponto de interação fica ao pé ---- */
  const stair = (x: number, z: number, upward: boolean, ry = 0): { x: number; z: number } => { const L = 5, w = 3.2; for (let k = 0; k < 7; k++) { const t = k / 7; const sx = x + Math.sin(ry) * (upward ? -1 : 1) * (t * L - L / 2), sz = z + Math.cos(ry) * (upward ? -1 : 1) * (t * L - L / 2); box(ry ? 0.72 : w, 0.3 + k * 0.42, ry ? w : 0.72, sx, upward ? 0 : -(0.3 + k * 0.42), sz, stone); }
    for (const sx of [-1, 1]) { const ox = ry ? 0 : sx * (w / 2 + 0.1), oz = ry ? sx * (w / 2 + 0.1) : 0; box(ry ? L : 0.14, 1.0, ry ? 0.14 : L, x + ox, upward ? 1.6 : -1.4, z + oz, iron); }
    rect(x - (ry ? L / 2 : w / 2) - 0.2, z - (ry ? w / 2 : L / 2) - 0.2, x + (ry ? L / 2 : w / 2) + 0.2, z + (ry ? w / 2 : L / 2) + 0.2);
    const px = x - Math.sin(ry) * (upward ? -1 : 1) * (L / 2 + 1.0), pz = z - Math.cos(ry) * (upward ? -1 : 1) * (L / 2 + 1.0); add(new THREE.CircleGeometry(0.9, 12), glow(upward ? 0x3a2a4a : 0x2a1a2a), px, 0.02, pz, false).rotation.x = -Math.PI / 2; return { x: px, z: pz }; };
  const spawnPts: { x: number; z: number }[] = []; let up: { x: number; z: number } | undefined, down: { x: number; z: number } | undefined, throne: { x: number; z: number } | undefined, well: { x: number; z: number } | undefined;
  /* ---- mobília reutilizável ---- */
  const bookcase = (x: number, z: number, ry: number, w = 3) => { box(w, 4.2, 0.6, x, 0, z, wood, ry); for (let s = 0; s < 4; s++) for (let q = 0; q < w * 3; q++) { const bx = -w / 2 + 0.25 + q * (w / (w * 3)), c = [0x7a2a2a, 0x2a4a6a, 0x5a6a2a, 0x8a7a4a, 0x4a2a5a][Math.floor(r() * 5)]; const m = add(B(0.22, 0.3 + r() * 0.18, 0.4), std(c), x + Math.cos(ry) * bx, 0.5 + s * 0.95, z - Math.sin(ry) * bx, false, ry); m.position.x += Math.sin(ry) * 0.12; m.position.z += Math.cos(ry) * 0.12; } rect(x - (ry ? 0.4 : w / 2), z - (ry ? w / 2 : 0.4), x + (ry ? 0.4 : w / 2), z + (ry ? w / 2 : 0.4)); };
  const table = (x: number, z: number, w: number, d: number, cl = true) => { box(w, 0.12, d, x, 0.95, z, wood); for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(0.14, 0.95, 0.14, x + sx * (w / 2 - 0.2), 0, z + sz * (d / 2 - 0.2), wood); if (cl) box(w + 0.3, 0.03, d + 0.3, x, 1.07, z, velvet); rect(x - w / 2, z - d / 2, x + w / 2, z + d / 2); };
  const chair = (x: number, z: number, ry = 0) => { box(0.5, 0.08, 0.5, x, 0.55, z, wood, ry); box(0.5, 1.0, 0.08, x - Math.sin(ry) * 0.22, 0.55, z - Math.cos(ry) * 0.22, wood, ry); for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(0.06, 0.55, 0.06, x + sx * 0.2, 0, z + sz * 0.2, wood); solid(x, z, 0.35); };
  const bed = (x: number, z: number, ry: number, canopy = false) => { const w = 1.9, d = 2.6; box(w, 0.5, d, x, 0, z, wood, ry); box(w - 0.2, 0.25, d - 0.2, x, 0.5, z, std(0xd8ccc0), ry); box(w - 0.2, 0.08, d * 0.6, x + Math.sin(ry) * 0.4, 0.75, z + Math.cos(ry) * 0.4, velvet, ry); box(w - 0.5, 0.18, 0.5, x - Math.sin(ry) * (d / 2 - 0.4), 0.75, z - Math.cos(ry) * (d / 2 - 0.4), std(0xf0e8e0), ry);
    box(w, 1.6, 0.12, x - Math.sin(ry) * (d / 2 - 0.05), 0, z - Math.cos(ry) * (d / 2 - 0.05), wood, ry);
    if (canopy) { for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(0.06, 0.06, 2.6, x + sx * (w / 2 - 0.1) * Math.cos(ry) + sz * (d / 2 - 0.1) * Math.sin(ry), 0, z - sx * (w / 2 - 0.1) * Math.sin(ry) + sz * (d / 2 - 0.1) * Math.cos(ry), wood, 5); box(w + 0.2, 0.12, d + 0.2, x, 2.6, z, velvet, ry); }
    rect(x - (ry % Math.PI ? d / 2 : w / 2), z - (ry % Math.PI ? w / 2 : d / 2), x + (ry % Math.PI ? d / 2 : w / 2), z + (ry % Math.PI ? w / 2 : d / 2)); };
  const wardrobe = (x: number, z: number, ry = 0) => { box(1.6, 2.6, 0.7, x, 0, z, wood, ry); box(0.04, 2.2, 0.04, x + Math.cos(ry) * 0.0, 0.2, z + Math.sin(ry) * 0.3 + 0.36, gold, ry); rect(x - 0.9, z - 0.5, x + 0.9, z + 0.5); };
  const coffin = (x: number, z: number, ry = 0, open = false) => { box(0.9, 0.6, 2.2, x, 0, z, wood, ry); box(0.95, 0.12, 2.25, x, open ? 0.3 : 0.6, z + (open ? -0.9 : 0), std(0x2a1a14), ry).rotation.x = open ? -0.6 : 0; if (open) box(0.6, 0.2, 1.6, x, 0.55, z, velvet, ry); rect(x - 0.6, z - 1.2, x + 0.6, z + 1.2); };
  const pillar = (x: number, z: number, rad = 0.6, h = H) => { cyl(rad, rad * 1.15, h, x, 0, z, stone, 10); cyl(rad * 1.5, rad * 1.5, 0.5, x, 0, z, stoneD, 10); cyl(rad * 1.3, rad * 1.1, 0.5, x, h - 0.8, z, stone, 10); solid(x, z, rad * 1.4); };
  const chandelier = (x: number, z: number, y = H - 2.2, rad = 1.6, n = 8) => { add(new THREE.CylinderGeometry(0.03, 0.03, H - y, 4), iron, x, (H + y) / 2, z, false); const ring = add(new THREE.TorusGeometry(rad, 0.08, 6, 18), iron, x, y, z, false); ring.rotation.x = Math.PI / 2; for (let q = 0; q < n; q++) { const a = q / n * Math.PI * 2; candle(x + Math.cos(a) * rad, y + 0.1, z + Math.sin(a) * rad, 0.9); } light(x, y - 0.8, z, 0xffc070, 36, 15); };
  const pool = (x: number, z: number, w: number, d: number, deep = 0.35) => { box(w + 1.2, deep, d + 1.2, x, 0, z, stoneD); const p = new THREE.Mesh(new THREE.PlaneGeometry(w, d), blood); p.rotation.x = -Math.PI / 2; p.position.set(x, deep + 0.02, z); g.add(p); bloods.push(p); light(x, deep + 1.2, z, 0xff2a2a, 18, 10); };
  const stain = (x: number, z: number, s = 1) => { const p = new THREE.Mesh(new THREE.CircleGeometry(0.5 * s, 8), std(0x4a0a10)); p.rotation.x = -Math.PI / 2; p.position.set(x, 0.015, z); p.scale.set(1 + r(), 1, 1 + r()); g.add(p); };
  const rug = (x: number, z: number, w: number, d: number, c = 0x6a1a24) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, d), std(c)); p.rotation.x = -Math.PI / 2; p.position.set(x, 0.012, z); g.add(p); const q = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.5, d - 0.5), std(0xc9a24a)); q.rotation.x = -Math.PI / 2; q.position.set(x, 0.013, z); q.scale.set(0.98, 1, 0.98); g.add(q); const s = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.8, d - 0.8), std(c)); s.rotation.x = -Math.PI / 2; s.position.set(x, 0.014, z); g.add(s); };
  const portrait = (x: number, z: number, ry: number, c: number) => { box(1.3, 1.7, 0.1, x, 2.4, z, gold, ry); box(1.1, 1.5, 0.12, x, 2.5, z, std(c), ry); box(0.4, 0.6, 0.14, x, 2.9, z, std(0xd8c0b0), ry); };
  const statue = (x: number, z: number, ry = 0, s = 1) => { cyl(0.7 * s, 0.8 * s, 0.6 * s, x, 0, z, stoneD, 8); box(0.6 * s, 1.5 * s, 0.4 * s, x, 0.6 * s, z, stone, ry); add(new THREE.SphereGeometry(0.26 * s, 8, 6), stone, x, 2.45 * s, z); for (const sx of [-1, 1]) box(0.18 * s, 1.1 * s, 0.18 * s, x + Math.cos(ry) * sx * 0.42 * s, 0.9 * s, z - Math.sin(ry) * sx * 0.42 * s, stone, ry); box(1.3 * s, 0.9 * s, 0.9 * s, x, 0.6 * s, z, cloth, ry); solid(x, z, 0.9 * s); };
  const conde = (x: number, z: number) => { /* o Conde sentado: capa de veludo, pele lívida, coroa de ferro */ box(0.9, 1.1, 0.7, x, 1.5, z, velvet); box(0.5, 0.9, 0.5, x, 1.55, z, std(0x1a0a10)); add(new THREE.SphereGeometry(0.28, 8, 6), std(0xd8d0d4), x, 2.95, z); add(new THREE.TorusGeometry(0.24, 0.05, 5, 8), iron, x, 3.15, z).rotation.x = Math.PI / 2; for (const sx of [-1, 1]) { box(0.2, 0.2, 0.9, x + sx * 0.5, 2.1, z + 0.4, velvet); add(new THREE.SphereGeometry(0.1, 5, 4), std(0xd8d0d4), x + sx * 0.5, 2.25, z + 0.85); } for (const sx of [-1, 1]) add(B(0.1, 0.06, 0.02), glow(0xff3a3a), x + sx * 0.1, 3.0, z + 0.27, false); for (const sx of [-1, 1]) box(0.22, 0.9, 0.22, x + sx * 0.22, 0.6, z + 0.5, std(0x1a0a10)); };

  if (F === 2) { /* ===== TÉRREO: hall de entrada com a escadaria, biblioteca a oeste, salão de baile ao norte, sala do piano a leste, ala dos criados a sudeste ===== */
    const hx = W / 2; rug(hx, D - 7, 5, 12); // tapete do portão ao pé da escadaria
    // paredes das salas: biblioteca (x<15, z 2..24), salão de baile (x 15..33, z<16), piano (x>33, z 2..18), criados (x>33, z>20)
    wallZ(15, 0, 24, [[11, 14], [18.5, 21.5]]); wallX(0, 15, 24, [[6, 9]]); // biblioteca abre para o hall e para o baile
    wallX(15, 33, 16, [[20, 24], [26, 30]]); // salão de baile abre com dois arcos para o hall
    wallZ(33, 0, 18, [[8, 11]]); wallX(33, W, 18, [[36, 39]]); wallZ(33, 20, D, [[27, 30], [32, 35]]); // piano e criados
    // a escadaria dupla ao fundo do hall, subindo para a galeria
    up = stair(hx, 21.5, true); box(9, 0.3, 4, hx, 0, 18.5, stone); rect(hx - 4.5, 16.5, hx + 4.5, 20.5); for (const sx of [-1, 1]) { pillar(hx + sx * 6, 20, 0.5, H); statue(hx + sx * 9, D - 3, sx > 0 ? -Math.PI / 2 : Math.PI / 2, 1.1); }
    chandelier(hx, D - 8, H - 2.5, 2.0, 10); for (let k = 0; k < 3; k++) { sconce(0.7, 26 + k * 3.5, 1, 0); }
    // biblioteca: estantes nas paredes, mesas de leitura, globo, candelabros
    for (let k = 0; k < 4; k++) bookcase(2.2 + k * 3.2, 1.0, 0, 3); for (let k = 0; k < 6; k++) bookcase(0.6, 4.5 + k * 3.2, Math.PI / 2, 3); for (let k = 0; k < 3; k++) bookcase(14.3, 3.5 + k * 3.4, Math.PI / 2, 3);
    table(7, 10, 3.2, 1.4); chair(5.8, 8.8); chair(8.2, 8.8); chair(5.8, 11.2, Math.PI); chair(8.2, 11.2, Math.PI); table(7, 18, 3.2, 1.4); chair(5.8, 16.8); chair(8.2, 16.8); for (const [x, z] of [[7, 10], [7, 18]]) { candle(x - 0.8, 1.08, z, 1.3); candle(x + 0.8, 1.08, z, 1.3); light(x, 1.9, z, 0xffc070, 16, 8); }
    add(new THREE.SphereGeometry(0.5, 10, 8), std(0x3a5a8a), 11.5, 1.6, 21.5); cyl(0.3, 0.4, 1.1, 11.5, 0, 21.5, wood, 8); solid(11.5, 21.5, 0.6); rug(7, 14, 7, 6, 0x2a3a5a);
    // salão de baile: piso de losangos, dois lustres, espelhos, mesa do banquete ao norte, músicos no canto
    { const t = new THREE.Mesh(new THREE.PlaneGeometry(17, 15), std(0xffffff, { map: stoneTex(0x8a8070) })); t.rotation.x = -Math.PI / 2; t.position.set(24, 0.01, 8); g.add(t); }
    chandelier(20, 8, H - 2.2, 1.7); chandelier(28, 8, H - 2.2, 1.7); for (let k = 0; k < 3; k++) { box(1.2, 2.2, 0.08, 17 + k * 5, 1.4, 0.65, gold); box(1.0, 2.0, 0.09, 17 + k * 5, 1.5, 0.66, std(0xb0c0c8)); }
    table(24, 2.4, 10, 1.4); for (let k = 0; k < 6; k++) { add(new THREE.CylinderGeometry(0.15, 0.12, 0.5, 6), std(0x8a1020), 19.8 + k * 1.7, 1.3, 2.4, false); } for (let k = 0; k < 7; k++) chair(19.5 + k * 1.5, 3.9, Math.PI);
    for (let k = 0; k < 3; k++) { cyl(0.25, 0.3, 0.8, 16.5 + k * 1.2, 0, 14.5, wood, 6); } box(0.1, 1.4, 0.8, 16.0, 0.9, 14.5, wood); // estantes de partitura
    // sala do piano: o piano de cauda, poltronas, lareira acesa, tapete
    rug(40.5, 9, 10, 10); { const px = 40.5, pz = 7; box(2.6, 0.25, 1.6, px, 0.85, pz, std(0x0e0a0c)); box(1.4, 0.25, 1.2, px + 1.3, 0.85, pz - 0.6, std(0x0e0a0c)); box(2.2, 0.08, 0.5, px - 0.2, 1.1, pz + 1.0, std(0xf0e8e0)); box(2.6, 0.06, 2.4, px, 1.9, pz - 0.2, std(0x0e0a0c)).rotation.x = -0.45; for (const [dx, dz] of [[-1.2, 0.7], [1.2, 0.7], [0, -0.7]]) box(0.1, 0.85, 0.1, px + dx, 0, pz + dz, std(0x0e0a0c)); rect(px - 1.5, pz - 1.2, px + 2.2, pz + 1.3); chair(px - 0.3, pz + 1.9); candle(px - 1.0, 1.1, pz - 0.3, 1.2); candle(px + 0.8, 1.1, pz - 0.3, 1.2); light(px, 1.9, pz, 0xffc070, 14, 7); }
    { const fx = W - 1.2, fz = 12; box(2.8, 3.0, 0.9, fx, 0, fz, stone); box(2.0, 1.4, 0.95, fx - 0.3, 0.2, fz, std(0x0a0806)); box(3.2, 0.3, 1.1, fx, 3.0, fz, stone); flame(fx - 0.4, 0.7, fz - 0.2, 1.6, 0xff8a3a); flame(fx - 0.2, 0.6, fz + 0.3, 1.2, 0xffb040); light(fx - 1.2, 1.2, fz, 0xff8a3a, 30, 11); rect(fx - 1.5, fz - 0.6, fx + 1.5, fz + 0.6); }
    for (const [x, z, ry] of [[37, 13, 0.5], [44, 14.5, -0.5], [36.5, 4, 0]]) { box(1.1, 0.5, 1.1, x, 0, z, velvet, ry); box(1.1, 0.9, 0.3, x - Math.sin(ry) * 0.4, 0.5, z - Math.cos(ry) * 0.4, velvet, ry); solid(x, z, 0.75); }
    // ala dos criados: cozinha com forno, mesa comprida, panelas, baús; a escada de pedra para as adegas
    down = stair(41, 25, false, Math.PI / 2); table(40, 31, 6, 1.3, false); for (let k = 0; k < 4; k++) { chair(38 + k * 1.4, 29.8); chair(38 + k * 1.4, 32.2, Math.PI); }
    { const ox = W - 1.4, oz = 22.5; box(2.4, 2.4, 1.6, ox, 0, oz, stoneD); box(1.2, 1.0, 1.65, ox - 0.1, 0.3, oz, std(0x0a0806)); flame(ox - 0.2, 0.6, oz + 0.3, 1.2, 0xff8a3a); light(ox - 1.3, 1.0, oz, 0xff8a3a, 22, 9); rect(ox - 1.3, oz - 0.9, ox + 1.3, oz + 0.9); }
    for (let k = 0; k < 4; k++) { add(new THREE.CylinderGeometry(0.22, 0.2, 0.3, 8), iron, 44.5 + (k % 2) * 0.6, 2.2, 21.2 + Math.floor(k / 2) * 0.6, false); } for (let k = 0; k < 3; k++) { box(0.8, 0.6, 0.6, 35.5, 0, 33.5 + 0, plank); cyl(0.35, 0.3, 0.9, 35.5 + 1.2 * k, 0, 26 + k * 0.4, wood, 8); solid(35.5 + 1.2 * k, 26 + k * 0.4, 0.45); }
    torch(34.5, 27, 1, 0); torch(34.5, 33, 1, 0); torch(16, 20, 1, 0); torch(32, 20, -1, 0);
    // o Poço da Visão da Corte (27/10, Erling: todos os salões magníficos têm o seu) — no hall, sob a escadaria
    { const wx = hx - 9.5, wz = 24.5; cyl(1.4, 1.5, 0.9, wx, 0, wz, stoneD, 12); const wv = add(new THREE.CircleGeometry(1.15, 14), glow(0x6a3aff), wx, 0.92, wz, false); wv.rotation.x = -Math.PI / 2; wv.userData.dyn = true; light(wx, 1.8, wz, 0x8a5aff, 26, 10); solid(wx, wz, 1.7); well = { x: wx, z: wz }; }
    spawnPts.push({ x: 24, z: 8 }, { x: 40, z: 9 });
  } else if (F === 3) { /* ===== A GALERIA: corredor de retratos dos Vladislav, o estúdio, a capela profanada, a sala de música de câmara ===== */
    wallX(0, W, 12, [[9, 12], [22, 26], [36, 39]]); wallZ(18, 12, D, [[22, 25]]); wallZ(32, 12, D, [[16, 19], [28, 31]]);
    up = stair(W / 2, 6, true); down = stair(W / 2, 28, false); rug(W / 2, 6, 6, 8); rug(W / 2, 20, 6, 14);
    for (let k = 0; k < 9; k++) { portrait(3 + k * 5.2, 0.7, 0, [0x4a2a3a, 0x2a3a4a, 0x3a4a2a, 0x5a3a2a][k % 4]); if (k % 2 === 0) sconce(3 + k * 5.2 + 2.6, 0.7, 0, 1); }
    for (let k = 0; k < 4; k++) portrait(0.7, 15 + k * 5, Math.PI / 2, [0x3a2a4a, 0x2a4a3a][k % 2]); for (let k = 0; k < 4; k++) { statue(2.6 + k * 11, 4.2, 0, 0.9); }
    // estúdio do Conde (oeste): escrivaninha, mapas, globo, estantes
    table(9, 20, 3.4, 1.6); chair(9, 21.6, Math.PI); bookcase(2.5, 13.2, 0, 3); bookcase(6, 13.2, 0, 3); bookcase(12.5, 13.2, 0, 3); candle(8, 1.08, 19.6, 1.3); candle(10, 1.08, 19.6, 1.3); light(9, 2, 20, 0xffc070, 16, 8); box(2.2, 1.6, 0.08, 15, 1.4, 17.7, std(0xc8b890)); box(2.2, 1.6, 0.08, 15, 1.4, 20.7, std(0xb8a880)); add(new THREE.SphereGeometry(0.45, 10, 8), std(0x3a5a8a), 4, 1.5, 28); cyl(0.3, 0.4, 1.0, 4, 0, 28, wood, 8); solid(4, 28, 0.6);
    // a capela profanada (centro): bancos virados, o altar com a estátua decapitada, sangue no chão, velas negras
    for (let k = 0; k < 4; k++) { box(3.4, 0.5, 0.5, 25, 0, 24 + k * 2.2, wood, k === 2 ? 0.25 : 0); box(3.4, 0.9, 0.12, 25, 0.5, 24.2 + k * 2.2, wood, k === 2 ? 0.25 : 0); rect(23.3, 23.5 + k * 2.2, 26.7, 24.6 + k * 2.2); }
    box(3.2, 1.3, 1.2, 25, 0, 14.5, stoneD); box(0.6, 1.6, 0.4, 25, 1.3, 14.0, stone); rect(23.3, 13.8, 26.7, 15.2); stain(25, 16.5, 2.2); stain(24, 21, 1.4); for (let k = 0; k < 5; k++) candle(23.6 + k * 0.7, 1.32, 14.9, 1.2); light(25, 2.4, 15.5, 0xff6a4a, 20, 9);
    add(new THREE.PlaneGeometry(1.4, 3.0), glow(0x6a1a2a), 25, 4.0, 12.65, false); light(25, 3.5, 14.5, 0x8a2a3a, 8, 10);
    // sala de música de câmara (leste): harpa, violoncelo, cadeiras em arco, bar de cristais
    rug(40, 24, 12, 16, 0x2a2a4a); { const hx2 = 38, hz = 18; box(0.25, 2.6, 0.25, hx2, 0, hz, gold).rotation.z = 0.25; box(1.4, 0.3, 0.3, hx2 + 0.6, 0, hz, wood); for (let k = 0; k < 8; k++) add(B(0.02, 2.2 - k * 0.22, 0.02), std(0xe8e0d0), hx2 + 0.25 + k * 0.14, 1.2 - k * 0.1, hz, false); solid(hx2 + 0.5, hz, 0.8); }
    for (let k = 0; k < 5; k++) chair(36 + k * 2, 28, Math.PI); box(4, 1.1, 0.8, 44, 0, 33.5, wood); for (let k = 0; k < 6; k++) add(new THREE.CylinderGeometry(0.1, 0.07, 0.4, 6), std(0xc0e0ff, { transparent: true, opacity: 0.8 }), 42.4 + k * 0.6, 1.3, 33.5, false); rect(42, 33, 46, 34);
    chandelier(40, 24, H - 2, 1.5); chandelier(W / 2, 6, H - 2, 1.4); chandelier(9, 22, H - 2, 1.2);
    spawnPts.push({ x: 25, z: 20 }, { x: 40, z: 24 });
  } else if (F === 4) { /* ===== O ANDAR DOS QUARTOS: dois corredores e dezenas de quartos; alguns com hóspedes que dormem de dia (caixões) ===== */
    // filas de quartos: [z0, z1, z da parede com porta, lado da porta (+1 = porta ao sul do quarto)]; corredores em z 8–12 e 24–28
    const ROWS: [number, number, number, number][] = [[0.6, 8, 8, 1], [12, 18, 12, -1], [18, 24, 24, 1], [28, 35.4, 28, -1]];
    const skip = (row: number, k: number) => (row === 0 && k === 3) || (row === 3 && (k === 3 || k === 4)); // alcovas das escadas
    for (let row = 0; row < 4; row++) { const [z0, z1, dz, side] = ROWS[row]; const gaps: [number, number][] = []; for (let k = 0; k < 8; k++) gaps.push(skip(row, k) ? [k * 6 + 0.3, k * 6 + 5.7] : [k * 6 + 2.2, k * 6 + 3.8]);
      wallX(0.3, W - 0.3, dz, gaps); if (row === 1) wallX(0.3, W - 0.3, 18, []); for (let k = 1; k < 8; k++) { if ((row === 3 && k === 4)) continue; wallZ(k * 6, Math.max(z0, 0.3), Math.min(z1, D - 0.3), []); } void side; }
    // os quartos: cama, guarda-roupa, mesa de cabeceira com vela; nos de hóspede, um caixão no lugar da cama
    for (let row = 0; row < 4; row++) { const [z0, z1, , side] = ROWS[row]; const zc = (z0 + z1) / 2; for (let k = 0; k < 8; k++) { if (skip(row, k)) continue; const xc = k * 6 + 3; const guest = r() < 0.3;
        if (guest) { coffin(xc, zc, 0, r() < 0.5); stain(xc + 1.5, zc + 1, 0.8); candle(xc - 1.9, 0.0, zc - 1.8, 1.4); light(xc, 1.2, zc, 0xff5a3a, 8, 6); }
        else { const ry = side > 0 ? 0 : Math.PI; bed(xc + (k % 2 ? 1.0 : -1.0), zc - side * 0.4, ry, r() < 0.4); wardrobe(xc + (k % 2 ? -1.8 : 1.8), zc - side * 2.2, 0); box(0.6, 0.7, 0.6, xc + (k % 2 ? -0.6 : 0.6), 0, zc - side * 1.9, wood); candle(xc + (k % 2 ? -0.6 : 0.6), 0.72, zc - side * 1.9, 1.1); light(xc, 1.6, zc, 0xffb070, 9, 6); rug(xc, zc + side * 1.6, 2.6, 1.4, [0x6a1a24, 0x2a3a5a, 0x3a4a2a][k % 3]); } } }
    for (const cz of [10, 26]) { rug(W / 2, cz, W - 2, 2.6, 0x4a1a24); for (let k = 0; k < 8; k++) sconce(k * 6 + 3, cz - 1.5, 0, 1); }
    // as escadas: a que desce para a galeria, na alcova sul; a que sobe para o salão do Conde, na alcova norte
    down = stair(W / 2, 31.5, false, Math.PI / 2); up = stair(21, 4.5, true);
    chandelier(W / 2, 10, H - 1.8, 1.2, 6); chandelier(W / 2, 26, H - 1.8, 1.2, 6); chandelier(10, 26, H - 1.8, 1.0, 6); chandelier(38, 10, H - 1.8, 1.0, 6);
    spawnPts.push({ x: 8, z: 10 }, { x: 40, z: 26 }, { x: 24, z: 18 });
  } else if (F === 5) { /* ===== O SALÃO PARTICULAR DO CONDE: tortura, sangue, correntes, e o trono dentro da piscina de sangue ===== */
    const cx = W / 2; down = stair(cx, 31, false, Math.PI / 2);
    for (let k = 0; k < 3; k++) for (const sx of [-1, 1]) pillar(cx + sx * 9, 8 + k * 8, 0.75, H);
    // a piscina de sangue, com a passarela de pedra até o trono no meio
    pool(cx, 8, 16, 9, 0.4); box(2.4, 0.5, 9, cx, 0.0, 12, stoneD); rect(cx - 8.6, 3.5, cx - 1.2, 12.5); rect(cx + 1.2, 3.5, cx + 8.6, 12.5); // o sangue não se pisa: a passarela sim
    { const tz = 6.5; box(4.4, 0.6, 3.6, cx, 0.4, tz, stoneD); box(3.2, 0.5, 2.6, cx, 1.0, tz, stone); box(2.2, 1.0, 1.4, cx, 1.5, tz, velvet); box(2.6, 4.8, 0.6, cx, 1.5, tz - 1.0, std(0x1a0a10)); add(new THREE.CylinderGeometry(0, 1.6, 1.8, 4), gold, cx, 7.2, tz - 1.0, true, Math.PI / 4); for (const sx of [-1, 1]) box(0.45, 1.3, 1.6, cx + sx * 1.3, 1.5, tz, gold); conde(cx, tz + 0.2); for (let q2 = 0; q2 < 7; q2++) add(B(0.22, 0.22, 0.08), glow(0xff3a4a), cx - 1.0 + q2 * 0.33, 4.0 + Math.abs(3 - q2) * 0.35, tz - 0.68, false); light(cx, 4.0, tz + 2.5, 0xff4a5a, 40, 16); throne = { x: cx, z: tz + 3.2 }; rect(cx - 2.3, tz - 1.9, cx + 2.3, tz + 1.9); }
    for (const sx of [-1, 1]) { cyl(0.5, 0.6, 1.0, cx + sx * 6, 0.4, 3.5, iron, 8); flame(cx + sx * 6, 1.8, 3.5, 2.0, 0xff5a2a); light(cx + sx * 6, 2.4, 3.5, 0xff6a3a, 36, 13); solid(cx + sx * 6, 3.5, 0.8); }
    // instrumentos: a roda, o cavalete, a dama de ferro, a mesa de estiramento, jaulas penduradas, correntes, manchas
    { const x = 6, z = 20; add(new THREE.TorusGeometry(1.5, 0.12, 6, 14), wood, x, 1.7, z).rotation.y = 0.3; for (let k = 0; k < 6; k++) add(B(0.1, 2.8, 0.1), wood, x, 1.7, z, false).rotation.set(0, 0.3, k * Math.PI / 6); cyl(0.2, 0.3, 1.5, x, 0, z, iron, 6); stain(x, z + 1.2, 1.6); solid(x, z, 1.7); }
    { const x = 8, z = 28; box(0.3, 1.6, 3.2, x, 0, z, wood); box(0.6, 0.3, 3.6, x, 1.6, z, wood); for (const sz of [-1, 1]) box(0.12, 1.2, 0.12, x, 0, z + sz * 1.9, wood); stain(x + 0.8, z, 1.2); rect(x - 0.5, z - 1.9, x + 0.5, z + 1.9); }
    { const x = 40, z = 28; box(1.2, 2.6, 0.9, x, 0, z, iron); add(new THREE.ConeGeometry(0.5, 0.6, 5), iron, x, 2.9, z); for (let k = 0; k < 8; k++) add(B(0.05, 0.05, 0.3), bone, x - 0.4 + (k % 4) * 0.27, 0.8 + Math.floor(k / 4) * 0.8, z - 0.5, false); stain(x, z + 1.0, 1.0); rect(x - 0.7, z - 0.6, x + 0.7, z + 0.6); }
    { const x = 40, z = 19; box(1.2, 0.12, 3.6, x, 0.9, z, wood); for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(0.14, 0.9, 0.14, x + sx * 0.5, 0, z + sz * 1.6, wood); for (const sz of [-1, 1]) add(new THREE.TorusGeometry(0.2, 0.05, 5, 8), iron, x + 0.6, 1.0, z + sz * 1.5); stain(x, z, 1.5); rect(x - 0.7, z - 1.9, x + 0.7, z + 1.9); }
    for (let k = 0; k < 3; k++) { const x = 14 + k * 10, z = 30; add(new THREE.CylinderGeometry(0.02, 0.02, H - 4, 3), iron, x, H - 2, z, false); add(new THREE.CylinderGeometry(0.6, 0.6, 1.6, 8, 1, true), std(0x2a2c32, { side: THREE.DoubleSide, transparent: true, opacity: 0.85 }), x, 3.2, z, false); if (k !== 1) add(new THREE.SphereGeometry(0.2, 6, 5), bone, x, 2.9, z, false); }
    for (let k = 0; k < 8; k++) { const x = 2 + k * 6; add(new THREE.CylinderGeometry(0.03, 0.03, 2.8, 3), iron, x, H - 1.4, 0.9, false); add(new THREE.TorusGeometry(0.15, 0.04, 4, 6), iron, x, H - 2.9, 0.9, false); }
    for (let k = 0; k < 9; k++) stain(6 + r() * (W - 12), 14 + r() * 14, 0.8 + r() * 1.6);
    for (let k = 0; k < 3; k++) { torch(0.7, 16 + k * 6, 1, 0); torch(W - 0.7, 16 + k * 6, -1, 0); } sconce(cx - 12, 0.7, 0, 1, 0xff6a5a); sconce(cx + 12, 0.7, 0, 1, 0xff6a5a);
    // a adega do Conde: taças e garrafas de "vinho" numa cristaleira, ao canto
    box(3, 2.2, 0.6, 4, 0, 31.5, wood); for (let k = 0; k < 5; k++) add(new THREE.CylinderGeometry(0.08, 0.1, 0.5, 6), std(0x4a0a14), 2.9 + k * 0.55, 2.45, 31.5, false); rect(2.4, 31, 5.6, 32);
    spawnPts.push({ x: 10, z: 18 }, { x: 38, z: 18 }, { x: cx, z: 22 });
  } else if (F === 1) { /* ===== MASMORRAS E ADEGA: o corredor das celas com grades, a adega de barris e a sala do carrasco ===== */
    wallX(0, W, 12, [[22, 26]]); wallX(0, W, 24, [[22, 26]]); wallZ(24, 0, 12, [[4, 8]]);
    up = stair(41, 30, true, Math.PI / 2); down = stair(6, 30, false, Math.PI / 2);
    // celas ao norte (x<24) e a leste do corredor do meio: grades de ferro, palha, ossos, correntes
    for (let k = 0; k < 4; k++) { const x0 = k * 6, cx2 = x0 + 3; wallZ(x0 + 6, 0, 12, [] ); for (let b = 0; b < 7; b++) cyl(0.05, 0.05, H - 1, x0 + 0.6 + b * 0.8, 0, 11.8, iron, 4); rect(x0 + 0.2, 11.5, x0 + 5.8, 12.2);
      box(2.2, 0.25, 1.6, cx2, 0, 3, std(0x8a7a3a)); if (r() < 0.6) { add(new THREE.SphereGeometry(0.2, 6, 5), bone, cx2 + 0.8, 0.2, 5, false); box(0.6, 0.12, 0.2, cx2 + 0.3, 0.06, 5.4, bone); } add(new THREE.TorusGeometry(0.15, 0.04, 4, 6), iron, x0 + 0.6, 2.2, 1.0); }
    for (let k = 0; k < 4; k++) { const x0 = 24 + k * 6, cx2 = x0 + 3; wallZ(x0 + 6, 0, 12, [] ); for (let b = 0; b < 7; b++) cyl(0.05, 0.05, H - 1, x0 + 0.6 + b * 0.8, 0, 11.8, iron, 4); rect(x0 + 0.2, 11.5, x0 + 5.8, 12.2); if (k % 2) coffin(cx2, 5, 0, true); else { box(2.2, 0.25, 1.6, cx2, 0, 3, std(0x8a7a3a)); stain(cx2, 6, 1.6); } }
    for (let k = 0; k < 8; k++) torch(k * 6 + 3, 13.2, 0, 1);
    // adega (sudoeste): barris em fileiras, estantes de garrafas, a prensa
    for (let k = 0; k < 4; k++) for (let j = 0; j < 3; j++) { const x = 3 + k * 2.4, z = 27 + j * 2.6; const bb = cyl(0.7, 0.7, 1.6, x, 0.7, z, wood, 10); bb.rotation.z = Math.PI / 2; add(new THREE.TorusGeometry(0.7, 0.05, 4, 12), iron, x - 0.5, 0.7, z).rotation.y = Math.PI / 2; add(new THREE.TorusGeometry(0.7, 0.05, 4, 12), iron, x + 0.5, 0.7, z).rotation.y = Math.PI / 2; solid(x, z, 0.9); }
    for (let k = 0; k < 3; k++) { box(0.5, 2.4, 3.6, 14.5, 0, 27 + k * 0, wood); } rect(14.2, 25, 14.8, 29); for (let k = 0; k < 18; k++) add(new THREE.CylinderGeometry(0.06, 0.08, 0.4, 5), std(0x1a2a14), 14.5, 0.4 + Math.floor(k / 6) * 0.75, 25.4 + (k % 6) * 0.6, false).rotation.z = Math.PI / 2;
    // a sala do carrasco (sudeste): mesa de ferramentas, o cepo, o braseiro, ganchos
    table(34, 30, 3.2, 1.2, false); for (let k = 0; k < 5; k++) box(0.1, 0.05, 0.5, 32.8 + k * 0.6, 1.08, 30, iron); cyl(0.5, 0.6, 0.9, 30, 0, 27, wood, 8); box(0.1, 0.5, 0.05, 30, 0.9, 27, iron).rotation.z = 0.3; stain(30, 28.2, 1.4); solid(30, 27, 0.7);
    cyl(0.5, 0.35, 0.8, 38, 0, 26, iron, 8); flame(38, 1.1, 26, 1.6, 0xff6a2a); light(38, 1.8, 26, 0xff7a3a, 28, 11); solid(38, 26, 0.7); for (let k = 0; k < 4; k++) add(new THREE.TorusGeometry(0.12, 0.03, 4, 6), iron, 27 + k * 1.2, H - 1.6, 25.2);
    sconce(0.7, 18, 1, 0); sconce(0.7, 30, 1, 0); sconce(24.7, 18, 1, 0);
    spawnPts.push({ x: 12, z: 18 }, { x: 36, z: 18 }, { x: 24, z: 30 }, { x: 8, z: 7 }, { x: 40, z: 7 });
  } else { /* ===== CATACUMBAS DA CORTE: o salão abobadado dos antigos, ossários, o canal de sangue e o altar — a casa da futura raide ===== */
    for (let k = 0; k < 3; k++) for (const sx of [-1, 1]) pillar(W / 2 + sx * 8, 7 + k * 9, 0.9, H);
    up = stair(W / 2, 31.5, true, Math.PI / 2);
    // nichos de ossos nas paredes norte e oeste
    for (let k = 0; k < 11; k++) for (let s = 0; s < 3; s++) { const x = 2 + k * 4.2, y = 0.5 + s * 2.0; box(2.6, 1.4, 0.9, x, y, 1.0, stoneD); for (let q2 = 0; q2 < 4; q2++) add(new THREE.SphereGeometry(0.18, 6, 5), bone, x - 0.9 + q2 * 0.6, y + 0.3, 1.2, false); }
    for (let k = 0; k < 8; k++) for (let s = 0; s < 3; s++) { const z = 4 + k * 4.0, y = 0.5 + s * 2.0; box(0.9, 1.4, 2.6, 1.0, y, z, stoneD); for (let q2 = 0; q2 < 4; q2++) add(new THREE.SphereGeometry(0.18, 6, 5), bone, 1.2, y + 0.3, z - 0.9 + q2 * 0.6, false); }
    rect(0, 0, W, 1.6); rect(0, 0, 1.6, D);
    // o canal de sangue: vem do norte, contorna o altar e some pelo leste
    { const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(1.2, 0); sh.lineTo(1.2, 14); sh.lineTo(W - 2, 14); sh.lineTo(W - 2, 15.2); sh.lineTo(0, 15.2); sh.closePath(); const m = new THREE.Mesh(new THREE.ShapeGeometry(sh), blood); m.rotation.x = -Math.PI / 2; m.position.set(W / 2 - 0.6, 0.03, 2); m.rotation.z = 0; g.add(m); bloods.push(m); }
    box(1.6, 0.25, 2.0, W / 2, 0, 9, stone); box(2.0, 0.25, 1.6, 14, 0, 16.6, stone); box(2.0, 0.25, 1.6, 34, 0, 16.6, stone); // pontes de pedra sobre o canal
    light(W / 2, 1.0, 10, 0xff2a2a, 12, 9); light(W / 2 + 10, 1.0, 16.6, 0xff2a2a, 12, 9);
    // o altar dos antigos e os sarcófagos da Corte
    box(5, 1.2, 2.4, W / 2, 0, 5.2, stoneD); box(3.4, 0.3, 1.6, W / 2, 1.2, 5.2, stone); for (let q2 = 0; q2 < 6; q2++) candle(W / 2 - 1.5 + q2 * 0.6, 1.5, 4.6, 1.3); light(W / 2, 2.6, 6, 0xff8a6a, 28, 12); rect(W / 2 - 2.6, 4, W / 2 + 2.6, 6.4);
    for (let k = 0; k < 4; k++) for (const sx of [-1, 1]) { const x = W / 2 + sx * (13 + (k % 2) * 4), z = 20 + k * 3.4; box(1.2, 1.0, 2.6, x, 0, z, stoneD); box(1.3, 0.2, 2.7, x, 1.0, z, stone); add(new THREE.SphereGeometry(0.22, 6, 5), stone, x, 1.4, z - 0.8, false); box(0.8, 0.35, 1.5, x, 1.2, z + 0.2, stone); rect(x - 0.7, z - 1.4, x + 0.7, z + 1.4); if (k % 2) { flame(x + sx * 0.9, 0.5, z, 0.9, 0x8a3aff); light(x + sx * 0.9, 0.9, z, 0x8a3aff, 10, 7); } }
    for (let k = 0; k < 5; k++) { torch(0.7, 8 + k * 5.5, 1, 0); } for (let k = 0; k < 7; k++) torch(6 + k * 6, 0.9, 0, 1);
    spawnPts.push({ x: 12, z: 24 }, { x: 36, z: 24 }, { x: W / 2, z: 12 }, { x: W / 2, z: 24 }, { x: 8, z: 8 }, { x: 40, z: 8 });
  }

  /* ---- luzes: um pool que acompanha quem anda; o sangue pulsa devagar; as velas tremem ---- */
  { const amb = new THREE.HemisphereLight(top ? 0x8a3a4a : under ? 0x4a3a5a : 0x9a8a7a, 0x100a12, under ? 0.4 : 0.5); g.add(amb); }
  for (const f of fixtures) f.i *= 1.5;
  const pool2: THREE.PointLight[] = []; for (let k = 0; k < 10; k++) { const l = new THREE.PointLight(0xffb060, 0, 14, 1.6); g.add(l); pool2.push(l); }
  const lights: { l: THREE.PointLight; base: number; ph: number }[] = []; let lastHx = -1e9, lastHz = -1e9;
  const flicker = (t: number, hx = W / 2, hz = D / 2) => {
    if (Math.hypot(hx - lastHx, hz - lastHz) > 3) { lastHx = hx; lastHz = hz; const near = [...fixtures].sort((a, b) => Math.hypot(a.x - hx, a.z - hz) - Math.hypot(b.x - hx, b.z - hz)).slice(0, pool2.length); lights.length = 0; pool2.forEach((l, k) => { const f = near[k]; if (!f) { l.intensity = 0; return; } l.position.set(f.x, f.y, f.z); l.color.setHex(f.c); l.distance = f.dist; lights.push({ l, base: f.i, ph: k * 1.7 }); }); }
    for (const l of lights) l.l.intensity = l.base * (0.9 + 0.1 * Math.sin(t * 9 + l.ph) + 0.05 * Math.sin(t * 23 + l.ph * 2));
    blood.color.setHex(0x8a0a14).offsetHSL(0, 0, 0.05 * Math.sin(t * 0.8));
  };
  const free = (x: number, z: number) => {
    if (x < 0.6 || x > W - 0.6 || z < 0.6) return false;
    if (z > D - 0.1) return doorS && Math.abs(x - W / 2) < dw / 2 - 0.3;
    for (const [cx, cz, rad] of cols) if (Math.abs(x - cx) < rad && Math.abs(z - cz) < rad && Math.hypot(x - cx, z - cz) < rad) return false;
    for (const [x0, z0, x1, z1] of rects) if (x > x0 && x < x1 && z > z0 && z < z1) return false;
    return true;
  };
  mergeStatic(g, ramp);
  return { group: g, W, D, colliders: cols, free, flicker, exitZ: D + 0.9, up, down, spawnPts, throne, well, name: CASTLE_FLOORS[F], bloodTick: (t) => flicker(t) };
}
