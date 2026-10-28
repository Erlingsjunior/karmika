import * as THREE from 'three';
import { vitral, floorGlow, TEMAS, type Tam } from './vitrais';
import { std, ink, plankTex, stoneTex, woodTex, plasterTex } from './toon3d';

export interface Interior { group: THREE.Group; W: number; D: number; colliders: [number, number, number][]; free(x: number, z: number, squeeze?: boolean): boolean; flicker(t: number, hx?: number, hz?: number): void; shop?: boolean; exitZ: number }

const rr = (s: number) => () => { s = (s * 16807) % 2147483647; return s / 2147483647; };

/** Interior decorado de casa. Origem local (0,0) = canto noroeste; paredes norte e oeste altas, sul e leste baixas (câmera isométrica). Porta ao sul. */
export function buildInterior(variant: number, W: number, D: number, seed = 7): Interior {
  const g = new THREE.Group(), cols: [number, number, number][] = [], r = rr(seed * 97 + variant * 13 + 5);
  const lights: { l: THREE.PointLight; base: number; ph: number }[] = [];
  const wood = (c = 0x6a4528) => std(0xffffff, { map: woodTex(c) }), plank = (c = 0x7a5532) => std(0xffffff, { map: plankTex(c) });
  const add = (geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, inked = true, ry = 0, parent: THREE.Object3D = g) => { const b = new THREE.Mesh(geo, m); if (inked) ink(b, 0.025); b.position.set(x, y, z); b.rotation.y = ry; b.castShadow = b.receiveShadow = true; parent.add(b); return b; };
  const B = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
  const solid = (x: number, z: number, rad: number) => cols.push([x, z, rad]);
  // chão e base escura
  const dark = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshBasicMaterial({ color: 0x07060a })); dark.rotation.x = -Math.PI / 2; dark.position.set(W / 2, -0.06, D / 2); g.add(dark);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(W, D), std(0xffffff, { map: (() => { const t = plankTex(variant === 3 ? 0x4a4a52 : variant === 5 ? 0x5a4a3c : variant >= 6 ? 0x4a4640 : 0x7a5532); const c = t.clone(); c.repeat.set(W / 2, D / 2); c.wrapS = c.wrapT = THREE.RepeatWrapping; c.needsUpdate = true; return c; })() })); fl.rotation.x = -Math.PI / 2; fl.position.set(W / 2, 0.005, D / 2); fl.receiveShadow = true; g.add(fl);
  // paredes
  const H = 3.4, wallC = [0xcdb48a, 0xc2a57a, 0xb8aa94, 0x8a8aa0, 0xb08a60, 0x8a7a68][variant % 6];
  const wm = std(0xffffff, { map: plasterTex(wallC) });
  add(B(W, H, 0.3), wm, W / 2, H / 2, -0.15); add(B(0.3, H, D), wm, -0.15, H / 2, D / 2);
  add(B(0.3, H, 0.3), wood(0x3a2616), -0.15, H / 2, -0.15);
  // paredes baixas (sul com porta, leste)
  const lowH = 0.55, lm = std(0xffffff, { map: stoneTex(0x6a665e) });
  const dw = 2.0, dx0 = W / 2;
  add(B(dx0 - dw / 2, lowH, 0.3), lm, (dx0 - dw / 2) / 2, lowH / 2, D + 0.15); add(B(W - dx0 - dw / 2, lowH, 0.3), lm, W - (W - dx0 - dw / 2) / 2, lowH / 2, D + 0.15);
  add(B(0.3, lowH, D), lm, W + 0.15, lowH / 2, D / 2);
  // porta (batente)
  add(B(0.18, 2.4, 0.3), wood(0x3a2616), dx0 - dw / 2, 1.2, D + 0.15); add(B(0.18, 2.4, 0.3), wood(0x3a2616), dx0 + dw / 2, 1.2, D + 0.15);
  // rodapé
  add(B(W, 0.2, 0.08), wood(0x3a2616), W / 2, 0.1, 0.04); add(B(0.08, 0.2, D), wood(0x3a2616), 0.04, 0.1, D / 2);

  /* ---- peças ---- */
  const light = (x: number, y: number, z: number, c: number, i: number, dist = 14) => { const l = new THREE.PointLight(c, i, dist, 1.6); l.position.set(x, y, z); g.add(l); lights.push({ l, base: i, ph: r() * 9 }); return l; };
  const flame = (x: number, y: number, z: number, s = 1) => { const f = new THREE.Mesh(new THREE.ConeGeometry(0.12 * s, 0.4 * s, 6), new THREE.MeshBasicMaterial({ color: 0xffb040 })); f.position.set(x, y, z); g.add(f); return f; };
  const rug = (x: number, z: number, w: number, d: number, c: number) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshToonMaterial({ color: c })); m.rotation.x = -Math.PI / 2; m.position.set(x, 0.02, z); g.add(m); const m2 = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.8, d * 0.78), new THREE.MeshToonMaterial({ color: new THREE.Color(c).multiplyScalar(0.6) })); m2.rotation.x = -Math.PI / 2; m2.position.set(x, 0.025, z); g.add(m2); };
  /* nada divide o mesmo pedaço de parede: janelas, vitrais, lareiras, estantes e bandeiras reservam o seu trecho; quem chega depois procura outro lugar (ou fica de fora) */
  const wallUse: Record<'n' | 'w', [number, number][]> = { n: [], w: [] };
  const spot = (wall: 'n' | 'w', x: number, half: number): number | null => { const len = wall === 'n' ? W : D, freeAt = (c: number) => c - half >= 0.35 && c + half <= len - 0.35 && wallUse[wall].every(([a, b]) => c + half + 0.12 <= a || c - half - 0.12 >= b);
    for (let k = 0; k <= 40; k++) { for (const sg of [1, -1]) { const c = x + sg * k * 0.15; if (freeAt(c)) { wallUse[wall].push([c - half, c + half]); return c; } } } return null; };
  const fireplace = (x0: number) => { const x = spot('n', x0, 1.35); if (x === null) return; // na parede norte
    const sm = std(0xffffff, { map: stoneTex(0x6a665e) });
    add(B(2.6, 2.4, 0.7), sm, x, 1.2, 0.35); add(B(1.5, 1.2, 0.2), std(0x0a0605), x, 0.7, 0.72, false);
    add(B(2.9, 0.2, 0.9), wood(0x4a3220), x, 2.5, 0.42);
    add(B(0.14, 0.14, 0.9), wood(0x3a2616), x - 0.3, 0.2, 0.9); add(B(0.14, 0.14, 0.9), wood(0x3a2616), x + 0.3, 0.22, 0.9).rotation.y = 0.5;
    flame(x - 0.1, 0.45, 0.85, 1.4); flame(x + 0.25, 0.4, 0.85, 1.0); light(x, 1.1, 1.4, 0xff8a3a, 55, 16); solid(x, 1.0, 1.1);
  };
  const table = (x: number, z: number, w = 1.8, d = 1.0, ry = 0) => { const t = new THREE.Group(); t.position.set(x, 0, z); t.rotation.y = ry; g.add(t); add(B(w, 0.1, d), plank(0x7a5532), 0, 0.82, 0, true, 0, t); for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(B(0.1, 0.8, 0.1), wood(0x3a2616), sx * (w / 2 - 0.1), 0.4, sz * (d / 2 - 0.1), true, 0, t); solid(x, z, Math.max(w, d) * 0.5); return t; };
  const mug = (x: number, y: number, z: number) => add(new THREE.CylinderGeometry(0.07, 0.06, 0.14, 8), std(0xc9a24a), x, y + 0.07, z, false);
  const plate = (x: number, y: number, z: number) => add(new THREE.CylinderGeometry(0.14, 0.12, 0.03, 8), std(0xe8dcc0), x, y + 0.02, z, false);
  const chair = (x: number, z: number, ry = 0) => { const c = new THREE.Group(); c.position.set(x, 0, z); c.rotation.y = ry; g.add(c); add(B(0.5, 0.08, 0.5), plank(0x6a4528), 0, 0.5, 0, true, 0, c); add(B(0.5, 0.55, 0.07), plank(0x6a4528), 0, 0.8, -0.24, true, 0, c); for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(B(0.07, 0.5, 0.07), wood(0x3a2616), sx * 0.21, 0.25, sz * 0.21, false, 0, c); solid(x, z, 0.28); };
  const bed = (x: number, z: number, ry = 0, c = 0x8a3b2e) => { const b = new THREE.Group(); b.position.set(x, 0, z); b.rotation.y = ry; g.add(b); add(B(1.5, 0.35, 2.2), plank(0x5a3a22), 0, 0.3, 0, true, 0, b); add(B(1.4, 0.2, 2.0), std(0xe6dcc6), 0, 0.55, 0, true, 0, b); add(B(1.45, 0.12, 1.2), new THREE.MeshToonMaterial({ color: c }), 0, 0.68, 0.45, false, 0, b); add(B(0.9, 0.16, 0.45), std(0xf4eedc), 0, 0.7, -0.78, false, 0, b); add(B(1.6, 0.9, 0.1), plank(0x4a2e1a), 0, 0.7, -1.1, true, 0, b); solid(x, z, 1.15); };
  const shelf = (x0: number, z: number, ry = 0, w = 2.0, h = 2.4, books = true) => { let x = x0; if (z < 0.9 && Math.abs(ry) < 0.1) { const c = spot('n', x0, w / 2); if (c === null) return; x = c; } const s = new THREE.Group(); s.position.set(x, 0, z); s.rotation.y = ry; g.add(s); add(B(w, h, 0.5), wood(0x4a3220), 0, h / 2, 0, true, 0, s); for (let i = 0; i < 4; i++) { const y = 0.45 + i * (h - 0.6) / 3.2; add(B(w - 0.1, 0.05, 0.46), wood(0x6a4528), 0, y, 0.02, false, 0, s); for (let k = 0; k < 7; k++) { const bk = new THREE.Mesh(B(0.12, 0.3 + (k % 3) * 0.06, 0.28), new THREE.MeshToonMaterial({ color: books ? [0x8a2a2a, 0x2a4a8a, 0x2a6a3a, 0x8a6a2a, 0x5a2a6a][(k + i) % 5] : [0xc9a24a, 0x8a8a92, 0x6a4a2a][k % 3] })); bk.position.set(-w / 2 + 0.2 + k * (w - 0.4) / 7, y + 0.18, 0.06); s.add(bk); } } solid(x, z, Math.max(0.6, w * 0.35)); };
  const barrel = (x: number, z: number, s = 1) => { add(new THREE.CylinderGeometry(0.36 * s, 0.32 * s, 0.9 * s, 10), wood(0x6a4a2c), x, 0.45 * s, z); for (const y of [0.18, 0.7]) add(new THREE.CylinderGeometry(0.375 * s, 0.375 * s, 0.05, 10), std(0x2a2a30), x, y * s, z, false); solid(x, z, 0.42 * s); };
  const crate = (x: number, z: number, s = 0.7) => { add(B(s, s, s), plank(0x6a4a2c), x, s / 2, z, true, r() * 3); solid(x, z, s * 0.7); };
  const chestI = (x: number, z: number, ry = 0) => { add(B(0.95, 0.55, 0.6), plank(0x6a4528), x, 0.28, z, true, ry); add(new THREE.CylinderGeometry(0.3, 0.3, 0.95, 8, 1, false, 0, Math.PI), plank(0x7a5532), x, 0.56, z, false, ry).rotation.set(0, ry, Math.PI / 2); add(B(0.12, 0.18, 0.05), std(0xe2c36a), x, 0.5, z + 0.3, false, ry); solid(x, z, 0.6); };
  const window_ = (x0: number, wall: 'n' | 'w') => { const x = spot(wall, x0, 0.65); if (x === null) return; const gl = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.3), new THREE.MeshBasicMaterial({ color: 0x9ac4f0 })); const f = std(0xffffff, { map: woodTex(0x3a2616) }); if (wall === 'n') { gl.position.set(x, 1.9, 0.02); g.add(gl); add(B(1.3, 0.1, 0.1), f, x, 2.58, 0.04, false); add(B(1.3, 0.1, 0.1), f, x, 1.22, 0.04, false); add(B(0.1, 1.4, 0.1), f, x - 0.6, 1.9, 0.04, false); add(B(0.1, 1.4, 0.1), f, x + 0.6, 1.9, 0.04, false); add(B(0.06, 1.3, 0.06), f, x, 1.9, 0.05, false); } else { gl.position.set(0.02, 1.9, x); gl.rotation.y = Math.PI / 2; g.add(gl); add(B(0.1, 0.1, 1.3), f, 0.04, 2.58, x, false); add(B(0.1, 0.1, 1.3), f, 0.04, 1.22, x, false); add(B(0.1, 1.4, 0.1), f, 0.04, 1.9, x - 0.6, false); add(B(0.1, 1.4, 0.1), f, 0.04, 1.9, x + 0.6, false); } };
  const hang = (x: number, z: number, c = 0xffc070, i = 38) => { add(new THREE.CylinderGeometry(0.02, 0.02, 0.8, 4), std(0x2a2a30), x, H - 0.45, z, false).visible = false; const ring = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.04, 5, 12), std(0x2a2a30)); ring.rotation.x = Math.PI / 2; ring.position.set(x, H - 0.85, z); g.add(ring); for (let k = 0; k < 4; k++) { const a = k * 1.57; add(new THREE.CylinderGeometry(0.04, 0.04, 0.2, 5), std(0xf0e6cc), x + Math.cos(a) * 0.4, H - 0.75, z + Math.sin(a) * 0.4, false); flame(x + Math.cos(a) * 0.4, H - 0.58, z + Math.sin(a) * 0.4, 0.5); } light(x, H - 1.0, z, c, i, 15); };
  const plant = (x: number, z: number) => { add(new THREE.CylinderGeometry(0.2, 0.15, 0.3, 8), std(0x8a4a2a), x, 0.15, z, false); for (let i = 0; i < 5; i++) { const l = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.7, 4), new THREE.MeshToonMaterial({ color: 0x3f7a3a })); l.position.set(x + Math.cos(i) * 0.12, 0.6, z + Math.sin(i) * 0.12); l.rotation.set(Math.sin(i) * 0.4, 0, Math.cos(i) * 0.4); g.add(l); } solid(x, z, 0.3); };
  const banner = (x0: number, c: number) => { const x = spot('n', x0, 0.5); if (x === null) return; const b = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.6), new THREE.MeshToonMaterial({ color: c, side: THREE.DoubleSide })); b.position.set(x, 2.0, 0.06); g.add(b); add(B(1.0, 0.07, 0.08), wood(0x3a2616), x, 2.82, 0.07, false); };

  const cx = W / 2;
  if (variant === 0) { // cabana
    fireplace(W * 0.7); window_(W * 0.28, 'n'); window_(D * 0.5, 'w');
    bed(1.3, 1.5, 0, 0x8a3b2e); shelf(W * 0.45, 0.35, 0, 1.6); rug(cx, D * 0.55, W * 0.5, D * 0.4, 0x7a3a2a);
    table(cx, D * 0.55, 1.6, 0.9); chair(cx - 0.6, D * 0.55 + 0.8, Math.PI); chair(cx + 0.6, D * 0.55 + 0.8, Math.PI); plate(cx - 0.4, 0.87, D * 0.55); mug(cx + 0.4, 0.87, D * 0.55);
    barrel(W - 1.0, D - 1.2); barrel(W - 1.0, D - 2.0, 0.8); chestI(1.0, D - 1.2); plant(W - 0.9, 3.4); hang(cx, D * 0.5, 0xffc070, 30);
  } else if (variant === 1) { // sobrado: sala comum
    fireplace(cx); window_(W * 0.2, 'n'); window_(W * 0.8, 'n'); window_(D * 0.35, 'w'); window_(D * 0.7, 'w');
    rug(cx, D * 0.55, W * 0.55, D * 0.45, 0x2f4a6a);
    table(cx, D * 0.55, 3.2, 1.1); for (const s of [-1, 1]) for (const k of [-1, 0, 1]) chair(cx + k * 1.0, D * 0.55 + s * 1.05, s > 0 ? Math.PI : 0);
    for (const k of [-1, 0, 1]) { plate(cx + k * 1.0, 0.87, D * 0.55 - 0.2); mug(cx + k * 1.0, 0.87, D * 0.55 + 0.25); }
    shelf(1.0, 3.2, Math.PI / 2, 2.2); shelf(1.0, D - 3.0, Math.PI / 2, 2.2, 2.4, false);
    // escada para o andar de cima
    for (let i = 0; i < 8; i++) add(B(1.2, 0.2, 0.38), plank(0x5a3a22), W - 1.3, 0.12 + i * 0.3, 0.6 + i * 0.4, true); solid(W - 1.3, 1.8, 1.4);
    barrel(W - 0.9, D - 1.0); crate(W - 1.9, D - 0.9); chestI(1.2, D - 1.2); plant(W - 0.8, D * 0.5); hang(cx - 2, D * 0.55, 0xffc070, 34); hang(cx + 2, D * 0.55, 0xffc070, 34); banner(W * 0.35, 0x2a4a8a); banner(W * 0.65, 0x8a2a2a);
  } else if (variant === 2) { // casa em L: quarto + cozinha
    fireplace(W * 0.78); window_(W * 0.3, 'n'); window_(D * 0.3, 'w');
    bed(1.4, 1.6, 0, 0x2f5a8a); bed(3.3, 1.6, 0, 0x8a6a2a); chestI(1.2, 3.8, Math.PI / 2); shelf(W * 0.52, 0.35, 0, 1.8); rug(2.6, 3.6, 3.0, 2.0, 0x5a2a6a);
    table(W * 0.62, D * 0.62, 2.0, 1.0); chair(W * 0.62 - 0.7, D * 0.62 + 0.85, Math.PI); chair(W * 0.62 + 0.7, D * 0.62 + 0.85, Math.PI); chair(W * 0.62 + 1.55, D * 0.62, -Math.PI / 2);
    plate(W * 0.62 - 0.5, 0.87, D * 0.62); mug(W * 0.62 + 0.5, 0.87, D * 0.62);
    // bancada de cozinha
    add(B(0.7, 0.95, 3.0), plank(0x5a3a22), 0.6, 0.48, D * 0.62 + 0.2); solid(0.7, D * 0.62 + 0.2, 1.4); add(new THREE.CylinderGeometry(0.25, 0.22, 0.3, 8), std(0x2a2a30), 0.6, 1.1, D * 0.62);
    barrel(W - 0.9, D - 1.1); crate(W - 1.8, D - 0.9, 0.6); plant(W - 0.8, 3.0); hang(W * 0.5, D * 0.5, 0xffc070, 30);
  } else if (variant === 3) { // torre do mago
    window_(W * 0.5, 'n'); window_(D * 0.5, 'w');
    rug(cx, D * 0.55, Math.min(W, D) * 0.7, Math.min(W, D) * 0.7, 0x3a2a6a);
    shelf(W * 0.25, 0.35, 0, 2.2, 3.0); shelf(W * 0.75, 0.35, 0, 2.2, 3.0); shelf(0.35, D * 0.35, Math.PI / 2, 2.4, 3.0); shelf(0.35, D * 0.72, Math.PI / 2, 2.4, 3.0);
    table(cx, D * 0.5, 2.2, 1.1); // mesa com livro e cristal
    add(B(0.5, 0.06, 0.38), std(0x8a2a2a), cx - 0.5, 0.9, D * 0.5, false, 0.3);
    const cry = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), new THREE.MeshBasicMaterial({ color: 0xa88bff })); cry.position.set(cx + 0.5, 1.3, D * 0.5); g.add(cry); add(new THREE.CylinderGeometry(0.2, 0.25, 0.14, 8), std(0x3a3a44), cx + 0.5, 0.92, D * 0.5, false); light(cx + 0.5, 1.5, D * 0.5, 0x9a7bff, 40, 14);
    chair(cx, D * 0.5 + 1.0, Math.PI);
    // caldeirão
    add(new THREE.SphereGeometry(0.55, 10, 8, 0, 6.283, 0, 2.2), std(0x1c1c22), W - 1.6, 0.6, D - 1.8); const bub = new THREE.Mesh(new THREE.CircleGeometry(0.42, 10), new THREE.MeshBasicMaterial({ color: 0x66ff9a })); bub.rotation.x = -Math.PI / 2; bub.position.set(W - 1.6, 0.8, D - 1.8); g.add(bub); light(W - 1.6, 1.2, D - 1.8, 0x66ff9a, 22, 8); solid(W - 1.6, D - 1.8, 0.7);
    // globo
    add(new THREE.SphereGeometry(0.4, 10, 8), std(0x3a6aa0), 1.6, 1.3, D - 1.6); add(B(0.1, 0.9, 0.1), wood(0x3a2616), 1.6, 0.45, D - 1.6, false); solid(1.6, D - 1.6, 0.55);
    barrel(W - 0.9, 1.4, 0.8); hang(cx, D * 0.45, 0xb89bff, 32);
  } else if (variant === 4) { // taverna
    fireplace(W * 0.2); window_(W * 0.55, 'n'); window_(W * 0.82, 'n'); window_(D * 0.55, 'w');
    // balcão
    add(B(W * 0.5, 1.05, 0.9), plank(0x5a3a22), W * 0.62, 0.52, D * 0.3, true); add(B(W * 0.5 + 0.2, 0.1, 1.05), plank(0x7a5532), W * 0.62, 1.08, D * 0.3, true); solid(W * 0.5, D * 0.3, 1.0); solid(W * 0.72, D * 0.3, 1.0); solid(W * 0.85, D * 0.3, 0.8);
    for (let k = 0; k < 4; k++) mug(W * 0.5 + k * 0.7, 1.13, D * 0.3 + (k % 2) * 0.1);
    for (let k = 0; k < 4; k++) barrel(W * 0.42 + k * 1.1, 1.0, 0.9);
    shelf(W * 0.65, 0.35, 0, 3.6, 2.6, false);
    rug(W * 0.3, D * 0.62, 5, 3.4, 0x6a2a2a);
    for (const [tx, tz] of [[W * 0.22, D * 0.5], [W * 0.46, D * 0.62], [W * 0.22, D * 0.78], [W * 0.7, D * 0.68]] as [number, number][]) { table(tx, tz, 1.5, 1.5); for (let k = 0; k < 4; k++) chair(tx + Math.cos(k * 1.57) * 1.1, tz + Math.sin(k * 1.57) * 1.1, -k * 1.57 + 1.57 + Math.PI); mug(tx, 0.87, tz); plate(tx + 0.3, 0.87, tz + 0.2); }
    hang(W * 0.3, D * 0.6, 0xffb060, 40); hang(W * 0.68, D * 0.6, 0xffb060, 40); banner(W * 0.1, 0x8a2a2a); barrel(W - 0.9, D - 1.0); barrel(W - 0.9, D - 1.9, 0.8);
  } else if (variant === 6 || variant === 7) { // templo / igreja abandonada: nave com bancos, altar e vitrais
    const ruined = variant === 7;
    const sm = std(0xffffff, { map: stoneTex(ruined ? 0x5a564e : 0x7a766e) });
    // piso de pedra por cima do assoalho
    const st = new THREE.Mesh(new THREE.PlaneGeometry(W, D), sm.clone()); (st.material as THREE.MeshToonMaterial).map = (st.material as THREE.MeshToonMaterial).map!.clone(); (st.material as THREE.MeshToonMaterial).map!.repeat.set(W / 2, D / 2); (st.material as THREE.MeshToonMaterial).map!.needsUpdate = true; st.rotation.x = -Math.PI / 2; st.position.set(W / 2, 0.012, D / 2); g.add(st);
    // colunas
    for (const sx of [0.22, 0.78]) for (let k = 1; k <= 3; k++) { const z = D * (0.18 + k * 0.2); add(new THREE.CylinderGeometry(0.28, 0.32, H, 8), sm, W * sx, H / 2, z, false); solid(W * sx, z, 0.45); }
    // altar
    add(B(2.6, 1.0, 1.0), sm, cx, 0.5, 1.4); add(B(2.9, 0.12, 1.2), plank(ruined ? 0x3a2e24 : 0x5a3a22), cx, 1.06, 1.4); solid(cx, 1.4, 1.5);
    add(new THREE.CylinderGeometry(0.45, 0.5, 0.08, 12), std(ruined ? 0x6a6660 : 0xc9a24a), cx, 1.16, 1.4, false); // o Olho Kármico
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), new THREE.MeshBasicMaterial({ color: ruined ? 0x3a3450 : 0x9a86ff })); eye.position.set(cx, 1.5, 1.4); g.add(eye);
    if (!ruined) light(cx, 1.9, 1.6, 0x9a86ff, 46, 12);
    for (const sx of [-1, 1]) { add(new THREE.CylinderGeometry(0.06, 0.08, 1.3, 6), std(0x2a2a30), cx + sx * 1.9, 0.65, 1.6, false); if (!ruined || sx < 0) { flame(cx + sx * 1.9, 1.42, 1.6, 0.7); light(cx + sx * 1.9, 1.6, 1.6, 0xffb060, 28, 9); } }
    // bancos (bancos quebrados na igreja abandonada)
    for (let row = 0; row < 4; row++) { const z = D * 0.42 + row * 1.3; for (const sx of [-1, 1]) { const x = cx + sx * (W * 0.19); const broken = ruined && (row * 3 + sx) % 4 === 0; const pw = W * 0.28;
      add(B(pw, 0.08, 0.5), plank(ruined ? 0x3a2e24 : 0x6a4528), x, 0.5, z, true, broken ? 0.3 : 0); if (!broken) { add(B(pw, 0.5, 0.08), plank(ruined ? 0x3a2e24 : 0x6a4528), x, 0.78, z + 0.25); add(B(0.08, 0.5, 0.5), wood(0x3a2616), x - pw / 2, 0.25, z, false); add(B(0.08, 0.5, 0.5), wood(0x3a2616), x + pw / 2, 0.25, z, false); }
      solid(x - pw * 0.3, z, 0.55); solid(x + pw * 0.3, z, 0.55); } }
    // vitrais: três na parede norte (médio, rosácea, médio) e dois na oeste; a luz colorida desenha o chão
    { const fm = std(0xffffff, { map: stoneTex(0x4a4640) }), md = ruined ? 'ruin' : 'in', k0 = Math.abs(seed) % 4;
      const N: [Tam, number][] = [['m', 0.2], ['g', 0.5], ['m', 0.8]];
      N.forEach(([sz, sx], i) => { const t = TEMAS[(k0 + i) % 4], sc = sz === 'g' ? Math.min(0.95, (H - 0.8) / 2.2) : 0.92, hw = (sz === 'g' ? 2.2 : 1.0) * sc / 2 + 0.2; wallUse.n.push([W * sx - hw, W * sx + hw]); const v = vitral(t, sz, fm, md, sc); v.position.set(W * sx, sz === 'g' ? 0.55 : 0.4, 0.02); g.add(v);
        const fg = floorGlow(t, sz, (sz === 'g' ? 2.0 : 1.0) * 1.25, sz === 'g' ? 2.6 : 2.9, ruined ? 0.14 : 0.62); fg.position.set(W * sx, 0.03, 1.0 + (sz === 'g' ? 1.4 : 1.5)); g.add(fg); });
      for (let i = 0; i < 2; i++) { const t = TEMAS[(k0 + 3 + i) % 4], z = D * (0.42 + i * 0.3); wallUse.w.push([z - 0.66, z + 0.66]); const v = vitral(t, 'm', fm, md, 0.92); v.rotation.y = Math.PI / 2; v.position.set(0.02, 0.4, z); g.add(v);
        const fg = floorGlow(t, 'm', 1.15, 2.8, ruined ? 0.12 : 0.55); fg.rotation.z = Math.PI / 2; fg.position.set(1.6, 0.031, z); g.add(fg); } }
    rug(cx, D * 0.6, 1.8, D * 0.62, ruined ? 0x3a2a2a : 0x6a2a3a);
    if (ruined) { for (let k = 0; k < 7; k++) { const x = 0.8 + r() * (W - 1.6), z = 1 + r() * (D - 2); add(new THREE.DodecahedronGeometry(0.2 + r() * 0.2, 0), sm, x, 0.15, z, false, r() * 3); } for (let k = 0; k < 4; k++) banner(W * (0.15 + k * 0.23), 0x3a3448); }
    else { hang(W * 0.3, D * 0.55, 0xffc070, 36); hang(W * 0.7, D * 0.55, 0xffc070, 36); banner(W * 0.15, 0x6a3a8a); banner(W * 0.85, 0x6a3a8a); }
  } else if (variant === 8 || variant === 9) { // criptas da Catedral (8) e o santuário do Sacerdote Maldito (9)
    const boss = variant === 9;
    const sm = std(0xffffff, { map: stoneTex(boss ? 0x3a3038 : 0x4a4640) });
    const st = new THREE.Mesh(new THREE.PlaneGeometry(W, D), sm.clone()); (st.material as THREE.MeshToonMaterial).map = (st.material as THREE.MeshToonMaterial).map!.clone(); (st.material as THREE.MeshToonMaterial).map!.repeat.set(W / 2, D / 2); st.rotation.x = -Math.PI / 2; st.position.set(W / 2, 0.012, D / 2); g.add(st);
    // pilares em duas fileiras
    for (const sx of [0.2, 0.8]) for (let k = 0; k <= 3; k++) { const z = D * (0.14 + k * 0.24); add(new THREE.CylinderGeometry(0.3, 0.36, H, 8), sm, W * sx, H / 2, z, false); solid(W * sx, z, 0.5); }
    // escada que desce (boca escura no fundo, ao norte) — ou, no santuário, o altar negro
    if (!boss) {
      const pit = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.2), new THREE.MeshBasicMaterial({ color: 0x030205 })); pit.rotation.x = -Math.PI / 2; pit.position.set(cx, 0.03, 1.5); g.add(pit);
      for (let k = 0; k < 4; k++) add(B(2.4, 0.12, 0.4), sm, cx, 0.06 - k * 0.14, 2.6 - k * 0.45, false);
      add(B(0.3, 1.2, 2.4), sm, cx - 1.35, 0.6, 1.5, false); add(B(0.3, 1.2, 2.4), sm, cx + 1.35, 0.6, 1.5, false);
      flame(cx - 1.35, 1.35, 1.0, 0.8); flame(cx + 1.35, 1.35, 1.0, 0.8); light(cx, 1.3, 1.6, 0xff8a3a, 30, 10);
    } else {
      add(B(3.2, 1.1, 1.2), std(0x1a1218), cx, 0.55, 1.6); add(B(3.5, 0.12, 1.4), std(0x2a1a2a), cx, 1.16, 1.6); solid(cx, 1.6, 1.8);
      const eye = new THREE.Mesh(new THREE.OctahedronGeometry(0.34, 0), new THREE.MeshBasicMaterial({ color: 0xb3202f })); eye.position.set(cx, 1.7, 1.6); g.add(eye); light(cx, 2.0, 1.9, 0xb3202f, 60, 14);
      for (const sx of [-1, 1]) for (const z of [1.2, D * 0.5, D * 0.8]) { add(new THREE.CylinderGeometry(0.22, 0.28, 0.9, 8), std(0x2a2a30), cx + sx * (W * 0.36), 0.45, z, false); flame(cx + sx * (W * 0.36), 1.0, z, 1.2); light(cx + sx * (W * 0.36), 1.3, z, 0x8f3aff, 28, 9); solid(cx + sx * (W * 0.36), z, 0.4); }
      rug(cx, D * 0.5, 4.2, 4.2, 0x3a1020);
    }
    // sarcófagos e ossadas
    const nS = boss ? 4 : 6;
    for (let k = 0; k < nS; k++) { const x = W * (k % 2 ? 0.34 : 0.66) + (r() - 0.5) * 1.2, z = D * 0.3 + Math.floor(k / 2) * (D * 0.2) + (r() - 0.5); add(B(1.0, 0.7, 2.1), sm, x, 0.35, z, true, (r() - 0.5) * 0.3); add(B(1.1, 0.12, 2.2), std(0x5a564e), x, 0.76, z, true, (r() - 0.5) * 0.3); solid(x, z - 0.6, 0.7); solid(x, z + 0.6, 0.7); }
    for (let k = 0; k < 10; k++) { const x = 0.6 + r() * (W - 1.2), z = 0.8 + r() * (D - 1.6); add(new THREE.DodecahedronGeometry(0.12 + r() * 0.12, 0), std(0xd8d0b8), x, 0.1, z, false, r() * 3); }
    for (let k = 0; k < 5; k++) { const x = 0.8 + r() * (W - 1.6), z = 1 + r() * (D - 2); add(new THREE.DodecahedronGeometry(0.2 + r() * 0.2, 0), sm, x, 0.15, z, false, r() * 3); }
    // velas pelas paredes
    for (let k = 0; k < 6; k++) { const x = W * (0.1 + 0.16 * k); flame(x, 1.6, 0.25, 0.6); if (k % 2) light(x, 1.7, 0.4, 0xffb060, 14, 7); }
  } else if (variant === 20) { // 28/10: a casa do jogador, vazia — a mobília é ele quem põe (decor.ts)
    window_(W * 0.3, 'n'); window_(W * 0.72, 'n'); window_(D * 0.5, 'w'); hang(cx, D / 2);
  } else { // armeiro (loja)
    fireplace(W * 0.18);
    // forja brilhante
    add(B(1.4, 1.0, 1.1), std(0xffffff, { map: stoneTex(0x5a5650) }), W * 0.18 + 2.4, 0.5, 0.7); const co = new THREE.Mesh(B(1.0, 0.1, 0.7), new THREE.MeshBasicMaterial({ color: 0xff6a20 })); co.position.set(W * 0.18 + 2.4, 1.03, 0.7); g.add(co); light(W * 0.18 + 2.4, 1.6, 1.3, 0xff7a30, 45, 12); solid(W * 0.18 + 2.4, 0.7, 1.1);
    // balcão
    add(B(W * 0.6, 1.0, 0.8), plank(0x5a3a22), cx, 0.5, D * 0.5, true); add(B(W * 0.6 + 0.2, 0.1, 1.0), plank(0x7a5532), cx, 1.05, D * 0.5, true); solid(cx - 2, D * 0.5, 1.0); solid(cx, D * 0.5, 1.0); solid(cx + 2, D * 0.5, 1.0);
    // armas no balcão
    for (let k = 0; k < 4; k++) { const sw = new THREE.Mesh(B(0.07, 0.03, 0.9), std(0xc8ccd4)); sw.position.set(cx - 1.4 + k * 0.9, 1.13, D * 0.5); sw.rotation.y = 0.3 * (k - 1.5); g.add(sw); }
    // racks de armas e escudos nas paredes
    for (let k = 0; k < 3; k++) { const x = W * 0.45 + k * 1.9; add(B(1.5, 0.12, 0.12), wood(0x3a2616), x, 1.0, 0.1, false); add(B(1.5, 0.12, 0.12), wood(0x3a2616), x, 1.9, 0.1, false); for (let j = 0; j < 4; j++) { const sw = new THREE.Mesh(B(0.07, 1.2, 0.03), std(j % 2 ? 0xc8ccd4 : 0x9aa0aa)); sw.position.set(x - 0.5 + j * 0.33, 1.5, 0.15); g.add(sw); const hl = new THREE.Mesh(B(0.2, 0.06, 0.05), std(0x4a3220)); hl.position.set(x - 0.5 + j * 0.33, 0.95, 0.16); g.add(hl); } }
    for (let k = 0; k < 4; k++) { const s = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.06, 12), new THREE.MeshToonMaterial({ color: [0x8a2a2a, 0x2a4a8a, 0x6a6a72, 0xc9a24a][k] })); s.rotation.x = Math.PI / 2; s.position.set(0.1 + (k % 2) * 0.0 + 0.05, 1.7, D * 0.25 + k * 1.2); s.rotation.set(0, Math.PI / 2, Math.PI / 2); s.rotation.y = Math.PI / 2; g.add(s); const bs = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 5), std(0xe2c36a)); bs.position.set(0.18, 1.7, D * 0.25 + k * 1.2); g.add(bs); }
    // manequins com armadura
    for (const [mx, mz] of [[W - 1.2, 2.4], [W - 1.2, 4.0], [1.4, D - 1.4]] as [number, number][]) { add(new THREE.CylinderGeometry(0.06, 0.09, 1.0, 6), wood(0x3a2616), mx, 0.5, mz, false); add(B(0.55, 0.75, 0.32), std(0x7a8090), mx, 1.35, mz, true); add(new THREE.SphereGeometry(0.2, 8, 6), std(0x9aa0aa), mx, 1.95, mz, true); for (const s of [-1, 1]) add(new THREE.SphereGeometry(0.18, 6, 5), std(0x8a909c), mx + s * 0.38, 1.65, mz, false); solid(mx, mz, 0.5); }
    // bigorna
    add(B(0.5, 0.35, 0.9), std(0x2a2a32), W * 0.18 + 0.2, 0.55, 3.0); add(B(0.3, 0.45, 0.4), std(0x2a2a32), W * 0.18 + 0.2, 0.25, 3.0, false); solid(W * 0.18 + 0.2, 3.0, 0.7);
    rug(cx, D * 0.78, W * 0.4, 2.0, 0x6a2a2a); barrel(W - 0.9, D - 1.0); crate(W - 1.8, D - 0.9); chestI(1.2, D - 3.2, Math.PI / 2); hang(cx, D * 0.62, 0xffc070, 42);
  }
  /* móveis bloqueiam só o miolo (regra de ouro: mobilidade acima da física); squeeze = espremer-se entre eles quando travou */
  const free = (x: number, z: number, squeeze = false) => {
    if (x < 0.45 || x > W - 0.45 || z < 0.45) return false;
    if (z > D - 0.1) return Math.abs(x - dx0) < dw / 2 - 0.25 || z <= D + 0.9 && false;
    if (!squeeze) for (const [cx2, cz2, rad] of cols) if (Math.hypot(x - cx2, z - cz2) < rad * 0.7) return false;
    return true;
  };
  const flicker = (t: number) => { for (const l of lights) l.l.intensity = l.base * (0.9 + 0.1 * Math.sin(t * 9 + l.ph) + 0.05 * Math.sin(t * 23 + l.ph * 2)); };
  return { group: g, W, D, colliders: cols, free, flicker, shop: variant === 5, exitZ: D + 0.9 };
}
