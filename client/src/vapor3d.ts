/* Porto Caldeira, a Cidade da Graxa (27/10): as peças do porto a vapor.
   dock   0/1 beira de cais (lado oeste olha para +x; lado leste olha para −x): borda de pedra, defensas de madeira, cabeços de ferro, lampião a gás
          2   píer de tábuas sobre estacas de ferro, entrando na água (w tiles de comprimento, 1 de largura)
   boat   0 lancha a vapor · 1 vapor de rodas · 2 rebocador atarracado — casco, cabine, chaminé (fumaça), latão
   chimney 0 chaminé de tijolo de fábrica, com cintas de ferro (fumaça no topo) · 1 chaminé baixa de oficina
   crane  0 guindaste de cais: base de ferro, mastro, lança com corrente e gancho, caldeira pequena (fumaça)
   Origem no canto do terreno (gx, gy); frente para +z. */
import * as THREE from 'three';
import { std, texBox, stoneTex, plankTex, woodTex } from './toon3d';
import type { Built } from './city3d';

const MC = new Map<string, THREE.Material>();
const mat = <M extends THREE.Material>(k: string, mk: () => M): M => { let m = MC.get(k) as M | undefined; if (!m) { m = mk(); MC.set(k, m); } return m; };
const stone = (c: number) => mat('s' + c, () => std(0xffffff, { map: stoneTex(c) }));
const plank = (c: number) => mat('p' + c, () => std(0xffffff, { map: plankTex(c) }));
const wood = (c: number) => mat('w' + c, () => std(0xffffff, { map: woodTex(c) }));
const flat = (c: number) => mat('f' + c, () => std(c));
const glow = (c: number) => mat('g' + c, () => new THREE.MeshBasicMaterial({ color: c, toneMapped: false }));
const IRON = 0x3a3d44, BRASS = 0xc8963a, COPPER = 0xa8603a, BRICK = 0x7a4a3a, RUST = 0x6a3a28;

function kit() {
  const g = new THREE.Group(); const out: Built = { group: g, glows: [], smoke: [], torches: [] };
  const add = (geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, ry = 0, rz = 0, sh = true) => { const b = new THREE.Mesh(geo, m); b.position.set(x, y, z); b.rotation.y = ry; b.rotation.z = rz; if (sh) { b.castShadow = true; b.receiveShadow = true; } g.add(b); return b; };
  const box = (w: number, h: number, d: number, x: number, y: number, z: number, m: THREE.Material, ry = 0) => add(texBox(w, h, d, 2), m, x, y + h / 2, z, ry);
  const cyl = (rt: number, rb: number, h: number, x: number, y: number, z: number, m: THREE.Material, seg = 10) => add(new THREE.CylinderGeometry(rt, rb, h, seg), m, x, y + h / 2, z);
  const lamp = (x: number, z: number, h = 3.2) => { cyl(0.07, 0.1, h, x, 0, z, flat(IRON), 6); add(new THREE.BoxGeometry(0.42, 0.5, 0.42), flat(IRON), x, h + 0.25, z); const l = add(new THREE.BoxGeometry(0.3, 0.34, 0.3), glow(0xffd27a), x, h + 0.25, z, 0, 0, false); void l; out.glows.push({ pos: new THREE.Vector3(x, h + 0.3, z), color: 0xffc070, base: 10 }); };
  const bollard = (x: number, z: number) => { cyl(0.16, 0.2, 0.55, x, 0, z, flat(IRON), 8); cyl(0.22, 0.16, 0.14, x, 0.55, z, flat(IRON), 8); };
  const funnel = (x: number, y: number, z: number, r: number, h: number, c: number) => { cyl(r * 0.92, r, h, x, y, z, flat(c), 10); cyl(r * 1.08, r * 1.08, 0.22, x, y + h - 0.3, z, flat(BRASS), 10); out.smoke.push(new THREE.Vector3(x, y + h + 0.1, z)); };
  const rivets = (x: number, y: number, z: number, n: number, dx: number, dz: number) => { for (let k = 0; k < n; k++) add(new THREE.SphereGeometry(0.06, 5, 4), flat(BRASS), x + dx * k, y, z + dz * k, 0, 0, false); };
  return { g, out, add, box, cyl, lamp, bollard, funnel, rivets };
}

export function buildVapor(kind: 'dock' | 'boat' | 'chimney' | 'crane', v: number, Wm: number, Dm: number, seed: number): Built {
  const K = kit(); const cx = Wm / 2, cz = Dm / 2; const rr = (() => { let s = seed | 0; return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }; })();
  if (kind === 'dock') {
    if (v === 2) { // píer sobre a água: estacas, tábuas, corrimão de corrente, lampião na ponta
      const L = Wm; for (let k = 0; k <= L / 2; k++) for (const sz of [0.45, Dm - 0.45]) K.cyl(0.14, 0.18, 2.6, Math.min(L - 0.3, 0.3 + k * 2), -2.2, sz, flat(RUST), 6);
      K.box(L, 0.22, Dm - 0.2, cx, 0.3, cz, plank(0x6a4a2c));
      for (let k = 0; k < L / 1.6; k++) for (const sz of [0.2, Dm - 0.2]) K.cyl(0.05, 0.06, 0.8, 0.8 + k * 1.6, 0.52, sz, flat(IRON), 5);
      for (const sz of [0.2, Dm - 0.2]) K.box(L - 1.2, 0.05, 0.05, cx, 1.22, sz, flat(IRON));
      K.bollard(L - 0.6, cz); K.lamp(L - 1.4, 0.2, 2.6);
    } else { // beira de cais: a pedra da borda, defensas, cabeços, lampião; o lado da água é +x (v 0) ou −x (v 1)
      const wx = v === 1 ? 0.0 : Wm; K.box(0.5, 0.6, Dm, wx + (v === 1 ? 0.25 : -0.25), 0, cz, stone(0x6e6a64));
      for (let k = 0; k < Dm / 1.3; k++) { const z = 0.6 + k * 1.3; K.box(0.26, 1.3, 0.3, wx + (v === 1 ? -0.1 : 0.1), -0.9, z, wood(0x4a3a2a)); }
      K.bollard(wx + (v === 1 ? 0.6 : -0.6), Dm * 0.3); K.bollard(wx + (v === 1 ? 0.6 : -0.6), Dm * 0.78);
      if ((seed >> 1) % 3 === 0) K.lamp(wx + (v === 1 ? 1.4 : -1.4), Dm * 0.5);
      if ((seed >> 2) % 4 === 0) { K.box(0.9, 0.9, 0.9, wx + (v === 1 ? 1.6 : -1.6), 0, Dm * 0.2, wood(0x6a4a2c)); K.cyl(0.42, 0.42, 0.9, wx + (v === 1 ? 2.4 : -2.4), 0, Dm * 0.3, plank(0x5a3a22), 10); }
    }
  } else if (kind === 'boat') {
    const L = Math.min(Wm, 7.2) - 0.4, Bw = 2.4, hull = flat(v === 1 ? 0x8a2a22 : v === 2 ? 0x2a3a4a : 0x2a4a3a), deck = plank(0x8a6a3a);
    // casco: corpo + proa e popa afiladas, borda de latão, convés
    K.box(L * 0.62, 1.1, Bw, cx, -0.45, cz, hull); K.add(new THREE.CylinderGeometry(Bw / 2, Bw / 2 * 0.9, 1.1, 8, 1, false, 0, Math.PI), hull, cx + L * 0.31, 0.1, cz, Math.PI / 2 - Math.PI / 2, 0); K.add(new THREE.CylinderGeometry(Bw / 2, Bw / 2 * 0.9, 1.1, 8, 1, false, 0, Math.PI), hull, cx - L * 0.31, 0.1, cz, Math.PI / 2 + Math.PI / 2, 0);
    K.box(L * 0.62 + 0.3, 0.1, Bw + 0.16, cx, 0.62, cz, flat(BRASS)); K.box(L * 0.6, 0.08, Bw - 0.3, cx, 0.66, cz, deck);
    // cabine, chaminé, caldeira, vigia e lanterna
    const cw = v === 2 ? L * 0.34 : L * 0.3; K.box(cw, 1.25, Bw - 0.7, cx - L * 0.05, 0.72, cz, wood(v === 2 ? 0x3a3a3a : 0x6a4a2c)); K.box(cw + 0.3, 0.14, Bw - 0.4, cx - L * 0.05, 1.97, cz, flat(IRON));
    for (let k = -1; k <= 1; k++) K.add(new THREE.CircleGeometry(0.17, 8), glow(0xffd27a), cx - L * 0.05 + k * cw * 0.3, 1.4, cz + (Bw - 0.7) / 2 + 0.01, 0, 0, false);
    K.funnel(cx + L * 0.12, 0.7, cz, v === 2 ? 0.34 : 0.26, v === 2 ? 2.3 : 2.9, v === 2 ? IRON : COPPER);
    K.cyl(0.4, 0.4, 0.9, cx + L * 0.22, 0.7, cz, flat(COPPER), 10); K.rivets(cx + L * 0.22 - 0.3, 1.3, cz + 0.41, 4, 0.2, 0);
    if (v === 1) for (const sz of [cz - Bw / 2 - 0.25, cz + Bw / 2 + 0.25]) { const w = K.add(new THREE.CylinderGeometry(1.0, 1.0, 0.3, 10), flat(RUST), cx - L * 0.1, 0.5, sz, 0, Math.PI / 2); w.rotation.set(Math.PI / 2, 0, 0); for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; K.add(new THREE.BoxGeometry(0.18, 0.5, 0.42), wood(0x5a3a22), cx - L * 0.1 + Math.cos(a) * 0.8, 0.5 + Math.sin(a) * 0.8, sz, 0, a); } }
    K.out.glows.push({ pos: new THREE.Vector3(cx - L * 0.05, 1.5, cz), color: 0xffc070, base: 8 });
    K.cyl(0.05, 0.05, 2.2, cx - L * 0.36, 0.6, cz, flat(IRON), 5); K.add(new THREE.PlaneGeometry(0.9, 0.55), std(v === 1 ? 0xd9b45a : 0xc8963a, { side: THREE.DoubleSide }), cx - L * 0.36 + 0.45, 2.5, cz, 0, 0, false);
  } else if (kind === 'chimney') {
    const h = v === 1 ? 6 : 11 + (seed % 3) * 1.5, r = v === 1 ? 0.5 : 0.9;
    K.box(r * 2.6, 1.2, r * 2.6, cx, 0, cz, stone(0x5a4a40)); K.cyl(r * 0.78, r, h, cx, 1.2, cz, stone(BRICK), 10);
    for (let k = 1; k <= 3; k++) K.cyl(r * (1.02 - k * 0.06), r * (1.02 - k * 0.06), 0.3, cx, 1.2 + h * k / 3.6, cz, flat(IRON), 10);
    K.cyl(r * 0.95, r * 0.8, 0.5, cx, 1.2 + h, cz, flat(IRON), 10); K.out.smoke.push(new THREE.Vector3(cx, 1.2 + h + 0.6, cz));
    if (v === 0) { K.cyl(0.14, 0.14, h * 0.9, cx + r + 0.3, 1.2, cz, flat(IRON), 5); for (let k = 0; k < h * 0.9 / 0.5; k++) K.box(0.5, 0.05, 0.08, cx + r + 0.3, 1.5 + k * 0.5, cz, flat(IRON)); } // escada de ferro
  } else if (kind === 'crane') {
    const ry = rr() < 0.5 ? 0.5 : -0.6;
    K.box(2.2, 0.5, 2.2, cx, 0, cz, stone(0x6e6a64)); K.cyl(0.55, 0.7, 1.0, cx, 0.5, cz, flat(IRON), 10);
    K.cyl(0.26, 0.3, 7.5, cx, 1.5, cz, flat(IRON), 8);
    const jib = K.add(texBox(0.3, 0.3, 7.6, 2), flat(RUST), cx + Math.sin(ry) * 3.2, 7.4, cz + Math.cos(ry) * 3.2, ry, 0); jib.rotation.x = -0.35;
    const tipx = cx + Math.sin(ry) * 6.4, tipz = cz + Math.cos(ry) * 6.4, tipy = 7.4 + 6.4 * 0.36 * 0 + 2.2;
    K.add(new THREE.CylinderGeometry(0.03, 0.03, 4.6, 4), flat(IRON), tipx, tipy - 2.3, tipz, 0, 0, false); K.add(new THREE.TorusGeometry(0.28, 0.07, 6, 10), flat(IRON), tipx, tipy - 4.8, tipz);
    K.box(1.6, 0.06, 0.06, cx + Math.sin(ry) * 1.6, 8.9, cz + Math.cos(ry) * 1.6, flat(IRON), ry); // cabo de sustentação
    K.box(1.4, 1.1, 1.0, cx - Math.sin(ry) * 1.4, 1.0, cz - Math.cos(ry) * 1.4, flat(COPPER), ry); K.funnel(cx - Math.sin(ry) * 1.8, 2.1, cz - Math.cos(ry) * 1.8, 0.16, 1.6, IRON);
    K.cyl(0.9, 0.9, 0.4, cx, 1.5, cz, flat(BRASS), 12); K.rivets(cx - 0.6, 1.95, cz + 0.6, 4, 0.4, -0.4);
  }
  return K.out;
}
