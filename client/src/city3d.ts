/* Arquitetura das cidades médias (Askavik): muralha com caminho de ronda, torres de vigia com mirante aberto (o caminho
   passa por dentro), portões com pórtico em arco e torres de flanco, escadarias de pedra por dentro da muralha,
   o castelo e as quatro academias. Origem de cada peça no canto (0,0) do terreno dela; a frente olha para +z (sul). */
import * as THREE from 'three';
import { std, texBox, stoneTex, shingleTex, woodTex, plankTex } from './toon3d';
import { vitral, TEMAS, type Tam } from './vitrais';
import { TILE_M as T } from '@karmika/shared';

export const RAMPART_H = 6; // altura do caminho de ronda (m)

const MC = new Map<string, THREE.Material>();
const mat = <M extends THREE.Material>(key: string, mk: () => M): M => { let m = MC.get(key) as M | undefined; if (!m) { m = mk(); MC.set(key, m); } return m; };
const stone = (c: number) => mat('s' + c, () => std(0xffffff, { map: stoneTex(c) }));
const slate = (c: number) => mat('r' + c, () => std(0xffffff, { map: shingleTex(c) }));
const flat = (c: number) => mat('f' + c, () => std(c));
const wood = (c: number) => mat('w' + c, () => std(0xffffff, { map: woodTex(c) }));
const planks = (c: number) => mat('p' + c, () => std(0xffffff, { map: plankTex(c) }));
const glowM = (c: number) => mat('g' + c, () => new THREE.MeshBasicMaterial({ color: c, toneMapped: false }));
const darkM = () => mat('dark', () => new THREE.MeshBasicMaterial({ color: 0x0c0a10 }));
const ironM = () => mat('iron', () => std(0x2a2a30));
const goldM = () => mat('gold', () => std(0xd8b04a));
const clothM = (c: number) => mat('c' + c, () => std(c, { side: THREE.DoubleSide }));

export interface Built { group: THREE.Group; glows: { pos: THREE.Vector3; color: number; base: number }[]; smoke: THREE.Vector3[]; torches: { pos: THREE.Vector3; flame: THREE.Mesh }[] }
function kit() {
  const g = new THREE.Group(); const out: Built = { group: g, glows: [], smoke: [], torches: [] };
  const add = <G extends THREE.BufferGeometry>(geo: G, m: THREE.Material, x: number, y: number, z: number, ry = 0, shadow = true) => { const b = new THREE.Mesh(geo, m); b.position.set(x, y, z); b.rotation.y = ry; if (shadow) { b.castShadow = true; b.receiveShadow = true; } g.add(b); return b; };
  /** caixa com textura em escala de mundo; (x,y,z) = centro da BASE */
  const box = (w: number, h: number, d: number, x: number, y: number, z: number, m: THREE.Material, ry = 0) => add(texBox(w, h, d, 2), m, x, y + h / 2, z, ry);
  const cyl = (rt: number, rb: number, h: number, x: number, y: number, z: number, m: THREE.Material, seg = 12) => add(new THREE.CylinderGeometry(rt, rb, h, seg), m, x, y + h / 2, z);
  const cone = (r: number, h: number, x: number, y: number, z: number, m: THREE.Material, seg = 4, ry = Math.PI / 4) => add(new THREE.ConeGeometry(r, h, seg), m, x, y + h / 2, z, ry);
  /** ameias ao longo de um segmento (de a até b, no plano xz), na altura y */
  const merlons = (ax: number, az: number, bx: number, bz: number, y: number, m: THREE.Material, step = 1.0, mh = 0.85, md = 0.45) => {
    const L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(L / step)), ry = Math.atan2(bx - ax, bz - az);
    for (let i = 0; i < n; i++) { if (i % 2) continue; const t = (i + 0.5) / n; add(new THREE.BoxGeometry(md, mh, L / n), m, ax + (bx - ax) * t, y + mh / 2, az + (bz - az) * t, ry); }
  };
  const window_ = (w: number, h: number, x: number, y: number, z: number, ry: number, c = 0xffc070) => { const m = add(new THREE.PlaneGeometry(w, h), glowM(c), x, y, z, ry, false); return m; };
  const slit = (x: number, y: number, z: number, ry: number) => add(new THREE.PlaneGeometry(0.22, 0.9), darkM(), x, y, z, ry, false);
  const torch = (x: number, y: number, z: number) => { add(new THREE.CylinderGeometry(0.06, 0.08, 0.7, 5), wood(0x3a2a1c), x, y, z); add(new THREE.CylinderGeometry(0.16, 0.1, 0.18, 6), ironM(), x, y + 0.42, z); const f = add(new THREE.ConeGeometry(0.14, 0.42, 6), new THREE.MeshBasicMaterial({ color: 0xffb040 }), x, y + 0.72, z, 0, false); f.userData.dyn = true; out.torches.push({ pos: new THREE.Vector3(x, y + 0.8, z), flame: f }); };
  /** estandarte pendurado na face (ry = direção para fora) com o losango do Olho */
  const banner = (x: number, y: number, z: number, ry: number, c = 0x8a2a2a, w = 1.1, h = 2.6) => {
    const b = add(new THREE.PlaneGeometry(w, h), clothM(c), x, y - h / 2, z, ry, false);
    const e = add(new THREE.PlaneGeometry(w * 0.42, w * 0.42), goldM(), x + Math.sin(ry) * 0.01, y - h * 0.38, z + Math.cos(ry) * 0.01, ry, false); e.rotation.z = Math.PI / 4; void b;
    add(new THREE.CylinderGeometry(0.04, 0.04, w + 0.3, 5).rotateZ(Math.PI / 2), wood(0x3a2a1c), x, y, z, ry, false);
  };
  /** parede com abertura em arco (portão), extrudada na espessura d; plano da parede = xy local, centro da base em (0,0) */
  const archWall = (W: number, H: number, d: number, w: number, spring: number, m: THREE.Material) => {
    const s = new THREE.Shape(); s.moveTo(-W / 2, 0); s.lineTo(W / 2, 0); s.lineTo(W / 2, H); s.lineTo(-W / 2, H); s.lineTo(-W / 2, 0);
    const hole = new THREE.Path(); hole.moveTo(-w / 2, 0); hole.lineTo(-w / 2, spring); hole.absarc(0, spring, w / 2, Math.PI, 0, true); hole.lineTo(w / 2, 0); hole.lineTo(-w / 2, 0); s.holes.push(hole);
    const geo = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false, curveSegments: 10 }); geo.translate(0, 0, -d / 2);
    const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 2, uv.getY(i) / 2);
    const mesh = new THREE.Mesh(geo, m); mesh.castShadow = mesh.receiveShadow = true; return mesh;
  };
  /** aduelas: o arco do portão marcado em pedra mais clara */
  const archRing = (w: number, spring: number, d: number, m: THREE.Material) => { const tg = new THREE.TorusGeometry(w / 2 + 0.18, 0.22, 6, 14, Math.PI); const r = new THREE.Mesh(tg, m); r.position.y = spring; r.scale.z = d / 0.44; return r; };
  const vit = (tema: number, sz: Tam, x: number, y: number, z: number, ry: number, sc: number, st: THREE.Material) => { const v = vitral(TEMAS[tema % TEMAS.length], sz, st, 'out', sc); v.position.set(x, y, z); v.rotation.y = ry; g.add(v); return v; };
  return { g, out, add, box, cyl, cone, merlons, window_, slit, torch, banner, archWall, archRing, vit };
}

/* ---------------------------------------------------------------- muralha ---------------------------------------------------------------- */
/** direção para FORA da cidade por lado: 0 norte, 1 sul, 2 oeste, 3 leste */
export const SIDE_OUT: [number, number][] = [[0, -1], [0, 1], [-1, 0], [1, 0]];

/** um trecho (1 casa) de muralha: corpo de 2 m de espessura (o caminho de ronda), ameias só do lado de fora, mureta baixa por dentro */
export function buildRampart(side: number, H: number, seed: number): Built {
  const K = kit(), [ox, oz] = SIDE_OUT[side], c = T / 2, sm = stone(0x7e7a74), dk = stone(0x5e5a56);
  K.box(T, H, T, c, 0, c, sm);
  K.box(ox ? 0.5 : T, 1.4, oz ? 0.5 : T, c + ox * (T / 2 + 0.2), 0, c + oz * (T / 2 + 0.2), dk); // sapata (talude) por fora
  K.box(ox ? 0.25 : T, 0.18, oz ? 0.25 : T, c + ox * (T / 2 + 0.08), H - 0.9, c + oz * (T / 2 + 0.08), dk); // cordão de pedra
  K.box(T - 0.02, 0.1, T - 0.02, c, H, c, stone(0x5a5650)); // lajes do caminho
  // ameias por fora (duas por casa) e mureta por dentro
  const ex = c + ox * (T / 2 - 0.22), ez = c + oz * (T / 2 - 0.22);
  K.box(ox ? 0.44 : T, 0.5, oz ? 0.44 : T, ex, H, ez, sm);
  for (let k = 0; k < 2; k++) { const a = -T / 2 + 0.5 + k * 1.0; K.box(ox ? 0.44 : 0.62, 0.8, oz ? 0.44 : 0.62, ex + (oz ? a : 0), H + 0.5, ez + (ox ? a : 0), sm); }
  K.box(ox ? 0.24 : T, 0.36, oz ? 0.24 : T, c - ox * (T / 2 - 0.12), H, c - oz * (T / 2 - 0.12), dk);
  if (seed % 3 === 0) K.slit(c + ox * (T / 2 + 0.01), H * 0.55, c + oz * (T / 2 + 0.01), Math.atan2(ox, oz));
  return K.out;
}

/** MURALHA ORGÂNICA (27/10, regra 19): um trecho de muro centrado na casa, correndo ao longo do eixo x local (comprimento len,
 *  até o centro da casa seguinte, com sobra para não abrir fresta nas curvas); o lado de fora é −z local. O chamador gira o grupo.
 *  Corpo de 2 m, sapata por fora, cordão de pedra, lajes do caminho de ronda, ameias por fora e mureta por dentro. */
export function buildRampartSeg(H: number, len: number, seed: number, tone = 0): Built {
  const K = kit(), c = T / 2, sm = stone(tone === 1 ? 0x8a7a6a : tone === 2 ? 0x6e6a66 : 0x7e7a74), dk = stone(tone === 1 ? 0x6a5a4a : 0x5e5a56), L = len + 0.7;
  K.box(L, H, T, c, 0, c, sm);
  K.box(L, 1.4, 0.5, c, 0, c - (T / 2 + 0.2), dk); // sapata (talude) por fora
  K.box(L, 0.18, 0.25, c, H - 0.9, c - (T / 2 + 0.08), dk); // cordão
  K.box(L - 0.02, 0.1, T - 0.02, c, H, c, stone(0x5a5650)); // lajes do caminho
  const ez = c - (T / 2 - 0.22); K.box(L, 0.5, 0.44, c, H, ez, sm);
  const n = Math.max(1, Math.round(L / 1.0)); for (let k = 0; k < n; k++) { if (k % 2) continue; K.box(0.62, 0.8, 0.44, c - L / 2 + (k + 0.5) * (L / n), H + 0.5, ez, sm); }
  K.box(L, 0.36, 0.24, c, H, c + (T / 2 - 0.12), dk); // mureta por dentro
  if (seed % 3 === 0) K.slit(c, H * 0.55, c - (T / 2 + 0.01), 0);
  return K.out;
}
/** torre redonda da muralha orgânica: tambor de pedra, cordão, mirante com ameias (o caminho de ronda atravessa), telhado cônico
 *  ou plataforma aberta com braseiro; `extra` = quanto sobe acima do caminho. Lado de fora = −z local. */
export function buildRoundTower(H: number, extra: number, roofC: number, open: boolean, seed: number): Built {
  const K = kit(), c = T / 2, R = 2.1 + (seed % 3) * 0.25, sm = stone(0x76726c), dk = stone(0x56524e);
  K.cyl(R, R + 0.35, H, c, 0, c - 0.5, sm, 14); K.cyl(R + 0.5, R + 0.7, 1.2, c, 0, c - 0.5, dk, 14);
  K.cyl(R + 0.15, R + 0.15, 0.22, c, H - 0.25, c - 0.5, dk, 14); K.cyl(R, R, 0.1, c, H, c - 0.5, stone(0x5a5650), 14);
  const y2 = H + extra; K.cyl(R, R, extra, c, H, c - 0.5, sm, 14); K.cyl(R + 0.3, R + 0.3, 0.4, c, y2, c - 0.5, dk, 14);
  for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; K.box(0.5, 0.8, 0.5, c + Math.cos(a) * (R + 0.05), y2 + 0.4, c - 0.5 + Math.sin(a) * (R + 0.05), sm, -a); }
  if (open) { K.torch(c, y2 + 0.5, c - 0.5); K.add(new THREE.CylinderGeometry(0.5, 0.35, 0.6, 8), ironM(), c, y2 + 0.7, c - 0.5); }
  else { K.cone(R + 0.2, 3.6 + (seed % 2) * 0.8, c, y2 + 0.4, c - 0.5, slate(roofC), 12, 0); K.add(new THREE.ConeGeometry(0.08, 0.9, 4), goldM(), c, y2 + 4.6 + (seed % 2) * 0.8, c - 0.5, 0, false); }
  for (let k = 0; k < 2; k++) K.slit(c, H * (0.35 + k * 0.3), c - 0.5 - R - 0.01, 0);
  K.window_(0.4, 0.7, c, H + extra * 0.5, c - 0.5 - R - 0.01, 0);
  return K.out;
}
/** torre de vigia da muralha: base maciça até o caminho; no alto, um mirante aberto (quatro pilares) por onde o caminho de ronda passa;
 *  laje, ameias e telhado de ardósia em pirâmide; um braseiro aceso dentro */
export function buildWallTower(side: number, H: number, corner: boolean, roofC: number): Built {
  const K = kit(), [ox, oz] = SIDE_OUT[side], c = T / 2, S = corner ? 4.0 : 3.4, P = 0.6, LH = 2.7, sm = stone(0x76726c), dk = stone(0x56524e);
  const cx = c + ox * 0.6, cz = c + oz * 0.6; // salta um pouco para fora da linha da muralha
  K.box(S, H, S, cx, 0, cz, sm);
  K.box(S + 0.5, 1.2, S + 0.5, cx, 0, cz, dk);
  K.box(S + 0.24, 0.22, S + 0.24, cx, H - 0.25, cz, dk);
  K.box(S, 0.1, S, cx, H, cz, stone(0x5a5650));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) K.box(P, LH, P, cx + sx * (S / 2 - P / 2), H, cz + sz * (S / 2 - P / 2), sm);
  K.box(S + 0.4, 0.45, S + 0.4, cx, H + LH, cz, dk);
  const y2 = H + LH + 0.45; K.merlons(cx - S / 2, cz - S / 2, cx + S / 2, cz - S / 2, y2, sm, 0.62); K.merlons(cx - S / 2, cz + S / 2, cx + S / 2, cz + S / 2, y2, sm, 0.62); K.merlons(cx - S / 2, cz - S / 2, cx - S / 2, cz + S / 2, y2, sm, 0.62); K.merlons(cx + S / 2, cz - S / 2, cx + S / 2, cz + S / 2, y2, sm, 0.62);
  K.cone(S * 0.74, corner ? 4.4 : 3.4, cx, y2 + 0.2, cz, slate(roofC));
  K.add(new THREE.ConeGeometry(0.08, 0.9, 4), goldM(), cx, y2 + (corner ? 4.6 : 3.6) + 0.45, cz, 0, false);
  for (let k = 0; k < 2; k++) K.slit(cx + ox * (S / 2 + 0.01), H * (0.35 + k * 0.3), cz + oz * (S / 2 + 0.01), Math.atan2(ox, oz));
  // braseiro no mirante (canto de dentro, fora do caminho)
  K.torch(cx - ox * 0.2 + (oz ? S / 2 - 0.55 : 0), H + 0.1, cz - oz * 0.2 + (ox ? S / 2 - 0.55 : 0));
  return K.out;
}

/** portão da cidade: parede com arco (o caminho de ronda passa por cima), grade levadiça meio erguida, duas torres de flanco salientes
 *  com mirante na altura do caminho, estandartes e tochas. Terreno = as casas da estrada (n ao longo do lado). */
export function buildGatehouse(side: number, n: number, H: number, roofC: number): Built {
  const K = kit(), [ox, oz] = SIDE_OUT[side], sm = stone(0x8a857e), dk = stone(0x5e5a56), lt = stone(0xa8a298);
  const Lm = n * T, along = oz ? 'x' : 'z', ry = oz ? 0 : Math.PI / 2;
  const cx = oz ? Lm / 2 : T / 2, cz = oz ? T / 2 : Lm / 2; // centro do terreno
  const W = Lm + 0.6, w = Lm - 0.5, spring = H - 1.3 - w / 2;
  const wall = K.archWall(W, H, T + 0.3, w, Math.max(1.6, spring), sm); wall.position.set(cx, 0, cz); wall.rotation.y = ry; K.g.add(wall);
  const ring = K.archRing(w, Math.max(1.6, spring), T + 0.36, lt); ring.position.x = cx; ring.position.z = cz; ring.rotation.y = ry; K.g.add(ring);
  K.box(oz ? W : T + 0.3, 0.1, oz ? T + 0.3 : W, cx, H, cz, stone(0x5a5650));
  // ameias por fora sobre o portão, mureta por dentro
  const ex = cx + ox * (T / 2 - 0.1), ez = cz + oz * (T / 2 - 0.1);
  K.merlons(ex - (oz ? W / 2 : 0), ez - (ox ? W / 2 : 0), ex + (oz ? W / 2 : 0), ez + (ox ? W / 2 : 0), H, sm, 0.9);
  K.box(oz ? W : 0.24, 0.36, oz ? 0.24 : W, cx - ox * (T / 2 - 0.1), H, cz - oz * (T / 2 - 0.1), dk);
  // grade levadiça (metade erguida) no meio do arco
  const top = Math.max(1.6, spring) + w / 2, gy = top - 1.5;
  for (let k = -3; k <= 3; k++) { const bar = K.add(new THREE.BoxGeometry(0.07, 1.6, 0.07), ironM(), cx + (oz ? k * w / 8 : 0), gy, cz + (ox ? k * w / 8 : 0), 0, false); void bar; K.add(new THREE.ConeGeometry(0.06, 0.22, 4), ironM(), cx + (oz ? k * w / 8 : 0), gy - 0.9, cz + (ox ? k * w / 8 : 0), 0, false).rotation.x = Math.PI; }
  for (let k = 0; k < 3; k++) K.add(new THREE.BoxGeometry(oz ? w * 0.9 : 0.07, 0.07, oz ? 0.07 : w * 0.9), ironM(), cx, gy - 0.5 + k * 0.5, cz, 0, false);
  // torres de flanco: salientes para fora, mirante aberto na altura do caminho, andar fechado em cima, telhado alto
  const S = 3.8, TH = H + 6.5;
  for (const s of [-1, 1]) {
    const tx = cx + (oz ? s * (Lm / 2 + 1.5) : 0) + ox * 1.0, tz = cz + (ox ? s * (Lm / 2 + 1.5) : 0) + oz * 1.0;
    K.box(S, H, S, tx, 0, tz, sm); K.box(S + 0.6, 1.4, S + 0.6, tx, 0, tz, dk);
    K.box(S, 0.1, S, tx, H, tz, stone(0x5a5650));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) K.box(0.6, 2.7, 0.6, tx + sx * (S / 2 - 0.3), H, tz + sz * (S / 2 - 0.3), sm);
    K.box(S + 0.3, 0.3, S + 0.3, tx, H + 2.7, tz, dk);
    K.box(S, TH - H - 3.0, S, tx, H + 3.0, tz, sm);
    K.box(S + 0.5, 0.4, S + 0.5, tx, TH, tz, dk);
    K.cone(S * 0.78, 5.2, tx, TH + 0.4, tz, slate(roofC));
    K.add(new THREE.ConeGeometry(0.1, 1.2, 4), goldM(), tx, TH + 6.2, tz, 0, false);
    for (let k = 0; k < 2; k++) K.slit(tx + ox * (S / 2 + 0.01), 2.2 + k * 2.2, tz + oz * (S / 2 + 0.01), Math.atan2(ox, oz));
    K.window_(0.5, 0.8, tx + ox * (S / 2 + 0.01), H + 4.4, tz + oz * (S / 2 + 0.01), Math.atan2(ox, oz));
    K.banner(tx + ox * (S / 2 + 0.03), TH - 0.6, tz + oz * (S / 2 + 0.03), Math.atan2(ox, oz), 0x7a1f24, 1.3, 3.6);
    // tocha ao lado do arco, por fora
    K.torch(cx + (oz ? s * (w / 2 + 0.6) : 0) + ox * (T / 2 + 0.45), 1.6, cz + (ox ? s * (w / 2 + 0.6) : 0) + oz * (T / 2 + 0.45));
  }
  void along;
  return K.out;
}

/** escadaria de pedra por dentro da muralha: lance de L casas ao longo do muro, subindo até o caminho de ronda.
 *  side = lado da muralha (o muro fica para fora); rise = +1 sobe no sentido +eixo, −1 no sentido −eixo */
export function buildWallStair(side: number, L: number, rise: number, H: number): Built {
  const K = kit(), [ox, oz] = SIDE_OUT[side], sm = stone(0x8a857e), dk = stone(0x66625c), Lm = L * T, N = Math.round(H / 0.32);
  for (let i = 0; i < N; i++) {
    const t0 = i / N, len = Lm / N, h = H * (i + 1) / N;
    const a = rise > 0 ? t0 * Lm + len / 2 : Lm - t0 * Lm - len / 2; // posição ao longo
    const x = oz ? a : T / 2, z = oz ? T / 2 : a;
    K.box(oz ? len + 0.02 : T - 0.1, h, oz ? T - 0.1 : len + 0.02, x, 0, z, i % 2 ? sm : stone(0x928d86));
  }
  // mureta do lado de dentro (cidade), inclinada com a escada: blocos em degrau
  for (let i = 0; i < L * 2; i++) { const t = (i + 0.5) / (L * 2), a = rise > 0 ? t * Lm : Lm - t * Lm, h = H * t; const x = oz ? a : T / 2 - ox * (T / 2 - 0.15), z = oz ? T / 2 - oz * (T / 2 - 0.15) : a; K.box(oz ? Lm / (L * 2) : 0.3, 0.55, oz ? 0.3 : Lm / (L * 2), x, h, z, dk); }
  return K.out;
}

/* ---------------------------------------------------------------- castelo ---------------------------------------------------------------- */
/** castelo médio do Jarl: muralha própria com ameias, quatro torres redondas de canto, torre de menagem alta com torreões,
 *  salão nobre no pátio e portão com duas meias-torres. Frente (+z) para a praça. */
export function buildCastle(Wm: number, Dm: number, wallC: number, roofC: number): Built {
  const K = kit(), sm = stone(wallC), dk = stone(0x5a5650), lt = stone(0xa29c92), rf = slate(roofC), cx = Wm / 2;
  const CW = 2.2, CH = 10, inset = 1.6; // muralha do castelo
  const x0 = inset, x1 = Wm - inset, z0 = inset, z1 = Dm - inset;
  K.box(Wm - 0.4, 0.8, Dm - 0.4, cx, 0, Dm / 2, dk); // plataforma
  K.box(x1 - x0 - 2, 0.05, z1 - z0 - 2, cx, 0.8, (z0 + z1) / 2, stone(0x6a665e)); // pátio
  const curtain = (ax: number, az: number, bx: number, bz: number, gate = false) => {
    const L = Math.hypot(bx - ax, bz - az), mx = (ax + bx) / 2, mz = (az + bz) / 2, alongX = Math.abs(bx - ax) > 0.1;
    if (!gate) K.box(alongX ? L : CW, CH, alongX ? CW : L, mx, 0.8, mz, sm);
    else { const gw = 4.2, side = (L - gw) / 2; for (const s of [-1, 1]) K.box(side, CH, CW, mx + s * (gw / 2 + side / 2), 0.8, mz, sm); K.box(gw, CH - 6.4, CW, mx, 0.8 + 6.4, mz, sm); }
    K.box(alongX ? L + 0.3 : CW + 0.3, 0.3, alongX ? CW + 0.3 : L + 0.3, mx, 0.8 + CH - 0.3, mz, dk);
    const oxs = alongX ? 0 : (mx < cx ? -1 : 1), ozs = alongX ? (mz < Dm / 2 ? -1 : 1) : 0;
    K.merlons(ax + oxs * (CW / 2 - 0.2), az + ozs * (CW / 2 - 0.2), bx + oxs * (CW / 2 - 0.2), bz + ozs * (CW / 2 - 0.2), 0.8 + CH, sm, 0.9);
    for (let k = 1; k < Math.floor(L / 3.2); k++) { const t = k / Math.floor(L / 3.2); K.slit(ax + (bx - ax) * t + oxs * (CW / 2 + 0.01), 4.2, az + (bz - az) * t + ozs * (CW / 2 + 0.01), Math.atan2(oxs, ozs)); }
  };
  curtain(x0, z0, x1, z0); curtain(x0, z0, x0, z1); curtain(x1, z0, x1, z1); curtain(x0, z1, x1, z1, true);
  // torres de canto (redondas), telhado cônico de ardósia
  for (const [tx, tz] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]] as [number, number][]) {
    K.cyl(3.0, 3.4, CH + 5, tx, 0.8, tz, sm, 14); K.cyl(3.4, 3.0, 0.6, tx, 0.8 + CH + 5, tz, dk, 14);
    for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; K.add(new THREE.BoxGeometry(0.6, 0.8, 0.4), sm, tx + Math.cos(a) * 3.2, 0.8 + CH + 5.6 + 0.4, tz + Math.sin(a) * 3.2, -a + Math.PI / 2); }
    K.cone(3.0, 6.5, tx, 0.8 + CH + 5.6, tz, rf, 14, 0);
    K.add(new THREE.ConeGeometry(0.09, 1.1, 4), goldM(), tx, 0.8 + CH + 12.6, tz, 0, false);
    for (let k = 0; k < 3; k++) { const a = Math.atan2(tz - Dm / 2, tx - cx) + (k - 1) * 0.6; K.slit(tx + Math.cos(a) * 3.12, 4 + k * 3.4, tz + Math.sin(a) * 3.12, Math.PI / 2 - a); }
  }
  // portão do castelo: duas meias-torres, arco mais claro, grade, estandartes
  { const gz = z1 + CW / 2;
    for (const s of [-1, 1]) { K.cyl(2.0, 2.2, CH + 3, cx + s * 3.4, 0.8, gz, sm, 12); K.cone(2.1, 4.2, cx + s * 3.4, 0.8 + CH + 3, gz, rf, 12, 0); K.banner(cx + s * 3.4, 0.8 + CH + 1.5, gz + 2.12, 0, 0x2a3a6a, 1.2, 3.8); }
    const ring = K.archRing(4.2, 0.8 + 4.3, CW + 0.4, lt); ring.position.set(cx, 0, gz); K.g.add(ring);
    K.add(new THREE.PlaneGeometry(4.0, 5.6), darkM(), cx, 0.8 + 2.8, gz - 0.6, 0, false);
    for (let k = -3; k <= 3; k++) K.add(new THREE.BoxGeometry(0.08, 2.4, 0.08), ironM(), cx + k * 0.55, 0.8 + 5.0, gz + 0.3, 0, false);
    K.torch(cx - 2.6, 1.7, gz + 2.4); K.torch(cx + 2.6, 1.7, gz + 2.4);
    for (let k = 0; k < 4; k++) K.box(5.6 - k * 0.4, 0.2, 0.9, cx, 0.8 - (k + 1) * 0.2, gz + 1.6 + k * 0.9, dk); // degraus até a praça
  }
  // salão nobre (no pátio, à frente da menagem)
  { const hw = 12, hd = 7, hz = Dm * 0.64, hh = 7.5; // o salão fica entre a menagem e o portão (não atravessa a torre)
    K.box(hw, hh, hd, cx, 0.8, hz, sm);
    const rf2 = new THREE.Group(); { const a = Math.atan2(4.2, hd / 2), L = (hd / 2 + 0.6) / Math.cos(a); for (const s of [-1, 1]) { const piv = new THREE.Group(); piv.position.set(cx, 0.8 + hh + 4.2, hz); piv.rotation.x = s * a; const m = new THREE.Mesh(texBox(hw + 1, 0.2, L, 2), rf); m.position.z = s * L / 2; m.castShadow = true; piv.add(m); rf2.add(piv); } } K.g.add(rf2);
    for (const s of [-1, 1]) { const tri = new THREE.Shape(); tri.moveTo(-hd / 2, 0); tri.lineTo(hd / 2, 0); tri.lineTo(0, 4.2); const tg = new THREE.ShapeGeometry(tri); const gm = new THREE.Mesh(tg, sm); gm.position.set(cx + s * hw / 2, 0.8 + hh, hz); gm.rotation.y = Math.PI / 2 * s; K.g.add(gm); }
    for (let k = 0; k < 5; k++) { K.window_(0.7, 1.8, cx - hw / 2 + 1.6 + k * ((hw - 3.2) / 4), 0.8 + 4.4, hz + hd / 2 + 0.01, 0); }
    K.out.glows.push({ pos: new THREE.Vector3(cx, 0.8 + 4.4, hz + hd / 2 + 0.6), color: 0xffb060, base: 26 });
    K.out.smoke.push(new THREE.Vector3(cx + hw / 2 - 1.5, 0.8 + hh + 5.4, hz)); K.box(0.9, 3.2, 0.9, cx + hw / 2 - 1.5, 0.8 + hh + 1.5, hz, dk);
  }
  // torre de menagem (fundo), com torreões nos cantos e telhado em pirâmide
  { const kw = 11, kd = 9, kz = z0 + CW + kd / 2 + 0.4, kh = 22;
    K.box(kw, kh, kd, cx, 0.8, kz, sm); K.box(kw + 0.6, 1.4, kd + 0.6, cx, 0.8, kz, dk);
    for (let f = 1; f <= 3; f++) K.box(kw + 0.24, 0.24, kd + 0.24, cx, 0.8 + f * 6.2, kz, dk);
    for (let f = 0; f < 3; f++) for (let k = 0; k < 3; k++) { K.window_(0.7, 1.4, cx - 3.2 + k * 3.2, 0.8 + 4.2 + f * 6.2, kz + kd / 2 + 0.01, 0, f === 2 ? 0xffd080 : 0xffb060); K.window_(0.7, 1.4, cx + kw / 2 + 0.01, 0.8 + 4.2 + f * 6.2, kz - 2.5 + k * 2.5, Math.PI / 2); }
    K.out.glows.push({ pos: new THREE.Vector3(cx, 0.8 + 16, kz + kd / 2 + 1), color: 0xffc070, base: 30 });
    K.box(kw + 0.8, 0.5, kd + 0.8, cx, 0.8 + kh, kz, dk);
    K.cone(Math.hypot(kw, kd) / 2 * 0.95, 9, cx, 0.8 + kh + 0.5, kz, rf, 4, Math.PI / 4).scale.z = kd / kw;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const tx = cx + sx * kw / 2, tz = kz + sz * kd / 2; K.cyl(1.2, 1.0, 5, tx, 0.8 + kh - 3, tz, sm, 10); K.cone(1.35, 3.4, tx, 0.8 + kh + 2, tz, rf, 10, 0); }
    // mastro e bandeira azul do Jarl
    K.add(new THREE.CylinderGeometry(0.07, 0.07, 5, 5), wood(0x3a2a1c), cx, 0.8 + kh + 9 + 2.5, kz, 0, false);
    const fl = K.add(new THREE.PlaneGeometry(2.4, 1.4), clothM(0x2a3a7a), cx + 1.2, 0.8 + kh + 9 + 4.2, kz, 0, false); fl.userData.sway = true;
    K.banner(cx, 0.8 + 15, kz + kd / 2 + 0.03, 0, 0x2a3a7a, 1.6, 5);
  }
  return K.out;
}

/* ---------------------------------------------------------------- academias ---------------------------------------------------------------- */
/** 10 Escola de Guerra · 11 Forja de Askavik · 12 Academia Tecnológica · 13 Igreja Kármica. Porta no meio da frente (+z), ~0,8 casa à direita. */
export function buildAcademy(v: number, Wm: number, Dm: number, wallC: number): Built {
  const K = kit(), cx = Wm / 2, front = Dm, door = cx + 0.8 * T;
  const dk = stone(0x5a5650);
  const doorArch = (w: number, h: number, x: number, z: number, m: THREE.Material, ring: THREE.Material) => {
    const a = K.archWall(w + 1.6, h + 1.2, 0.6, w, h - w / 2, m); a.position.set(x, 0.6, z); K.g.add(a);
    const r = K.archRing(w, 0.6 + h - w / 2, 0.7, ring); r.position.set(x, 0, z); K.g.add(r);
    K.add(new THREE.PlaneGeometry(w, h), darkM(), x, 0.6 + h / 2, z - 0.32, 0, false);
    const d = K.add(new THREE.BoxGeometry(w - 0.3, h - 0.4, 0.12), planks(0x5a3a22), x, 0.6 + (h - 0.4) / 2, z - 0.2, 0, false); void d;
  };
  const steps = (w: number, x: number, z: number, n = 3) => { for (let k = 0; k < n; k++) K.box(w - k * 0.5, 0.2, 0.8, x, 0.6 - (k + 1) * 0.2, z + 0.4 + k * 0.8, dk); };
  K.box(Wm - 0.6, 0.6, Dm - 0.6, cx, 0, Dm / 2, dk); // embasamento

  if (v === 10) { // ESCOLA DE GUERRA: salão-fortaleza, parapeito com ameias, duas torres quadradas na frente com telhado vermelho, escudos e espadas
    const sm = stone(wallC), rf = slate(0x7a2a22), hw = Wm - 7, hd = Dm - 4, hz = Dm - 0.4 - (Dm - 4) / 2, hh = 10;
    K.box(hw, hh, hd, cx, 0.6, hz, sm);
    K.box(hw + 0.4, 0.4, hd + 0.4, cx, 0.6 + hh, hz, dk);
    K.merlons(cx - hw / 2, hz + hd / 2, cx + hw / 2, hz + hd / 2, 0.6 + hh + 0.4, sm, 1.0); K.merlons(cx - hw / 2, hz - hd / 2, cx + hw / 2, hz - hd / 2, 0.6 + hh + 0.4, sm, 1.0);
    K.merlons(cx - hw / 2, hz - hd / 2, cx - hw / 2, hz + hd / 2, 0.6 + hh + 0.4, sm, 1.0); K.merlons(cx + hw / 2, hz - hd / 2, cx + hw / 2, hz + hd / 2, 0.6 + hh + 0.4, sm, 1.0);
    // telhado do grande salão por cima do parapeito
    { const a = Math.atan2(5, (hd - 3) / 2), L = ((hd - 3) / 2 + 0.3) / Math.cos(a); for (const s of [-1, 1]) { const piv = new THREE.Group(); piv.position.set(cx, 0.6 + hh + 5.2, hz); piv.rotation.x = s * a; const m = new THREE.Mesh(texBox(hw - 3, 0.2, L, 2), rf); m.position.z = s * L / 2; m.castShadow = true; piv.add(m); K.g.add(piv); }
      for (const s of [-1, 1]) { const tri = new THREE.Shape(); tri.moveTo(-(hd - 3) / 2, 0); tri.lineTo((hd - 3) / 2, 0); tri.lineTo(0, 5); const gm = new THREE.Mesh(new THREE.ShapeGeometry(tri), sm); gm.position.set(cx + s * (hw - 3) / 2, 0.6 + hh + 0.2, hz); gm.rotation.y = Math.PI / 2 * s; K.g.add(gm); } }
    for (const s of [-1, 1]) { const tx = cx + s * (hw / 2 + 0.6), tz = front - 3.0, S = 5.2, th = 18;
      K.box(S, th, S, tx, 0.6, tz, sm); K.box(S + 0.5, 0.5, S + 0.5, tx, 0.6 + th, tz, dk);
      K.merlons(tx - S / 2, tz + S / 2, tx + S / 2, tz + S / 2, 0.6 + th + 0.5, sm, 0.8);
      K.cone(S * 0.72, 6, tx, 0.6 + th + 0.5, tz, rf); K.add(new THREE.ConeGeometry(0.1, 1.2, 4), goldM(), tx, 0.6 + th + 7.1, tz, 0, false);
      for (let f = 0; f < 3; f++) K.window_(0.6, 1.3, tx, 0.6 + 4 + f * 4.6, tz + S / 2 + 0.01, 0);
      K.banner(tx, 0.6 + th - 1, tz + S / 2 + 0.03, 0, 0x8a2020, 1.6, 5.5); }
    for (let k = 0; k < 4; k++) { const x = cx - hw / 2 + 2.2 + k * ((hw - 4.4) / 3); if (Math.abs(x - door) < 2.2) continue; const sh = K.add(new THREE.CylinderGeometry(0.75, 0.75, 0.14, 12).rotateX(Math.PI / 2), wood(0x6a3a22), x, 0.6 + 6.6, hz + hd / 2 + 0.08, 0, false); void sh; K.add(new THREE.CylinderGeometry(0.22, 0.22, 0.2, 8).rotateX(Math.PI / 2), ironM(), x, 0.6 + 6.6, hz + hd / 2 + 0.17, 0, false); K.window_(0.6, 1.6, x, 0.6 + 3.2, hz + hd / 2 + 0.01, 0); }
    for (const s of [-1, 1]) { const sw = K.add(new THREE.BoxGeometry(0.16, 3.2, 0.06), stone(0xc8c8d0), door + s * 0.7, 0.6 + 8.2, hz + hd / 2 + 0.06, 0, false); sw.rotation.z = s * 0.6; }
    doorArch(2.6, 4.2, door, hz + hd / 2 + 0.3, sm, stone(0xa29c92)); steps(3.6, door, hz + hd / 2 + 0.3);
    K.torch(door - 2.4, 0.6, hz + hd / 2 + 1.2); K.torch(door + 2.4, 0.6, hz + hd / 2 + 1.2);
    K.out.glows.push({ pos: new THREE.Vector3(door, 3, hz + hd / 2 + 1.2), color: 0xffa050, base: 24 });
  } else if (v === 11) { // FORJA DE ASKAVIK — salão anão escavado: fachada de pedra maciça com contrafortes rúnicos, o grande portal da forja
    // (arco duplo com o rosto do Pai-Forjador), telhado de lajes de pedra em duas águas, duas alas com telhados próprios e duas chaminés colossais
    const sm = stone(0x6e5e4e), dk = stone(0x4a3e34), lt = stone(0x8a7a66), cu = flat(0xb86a3a), gold = flat(0xd8a84a), rfS = slate(0x5a4a3e), hz = Dm - 0.6;
    // alas laterais (mais baixas), com telhado de duas águas próprio
    for (const s of [-1, 1]) { const ax = cx + s * (Wm / 2 - 3.6), aw = 6.4, ad = Dm - 4, az = Dm - 0.6 - ad / 2; K.box(aw, 6.5, ad, ax, 0.6, az, sm); K.box(aw + 0.4, 0.5, ad + 0.4, ax, 0.6, az, dk);
      const rg = new THREE.Group(); { const ang = Math.atan2(3, aw / 2), L = (aw / 2 + 0.5) / Math.cos(ang); for (const t of [-1, 1]) { const piv = new THREE.Group(); piv.position.set(ax, 0.6 + 6.5 + 3, az); piv.rotation.z = -t * ang; const m = new THREE.Mesh(texBox(L, 0.35, ad + 0.8, 2), rfS); m.position.x = t * L / 2; m.castShadow = true; piv.add(m); rg.add(piv); } } K.g.add(rg);
      const tri = new THREE.Shape(); tri.moveTo(-aw / 2, 0); tri.lineTo(aw / 2, 0); tri.lineTo(0, 3); const gm = new THREE.Mesh(new THREE.ShapeGeometry(tri), sm); gm.position.set(ax, 0.6 + 6.5, az + ad / 2 + 0.01); K.g.add(gm);
      K.window_(0.6, 2.2, ax - 1.4, 0.6 + 3, az + ad / 2 + 0.02, 0, 0xff8a3a); K.window_(0.6, 2.2, ax + 1.4, 0.6 + 3, az + ad / 2 + 0.02, 0, 0xff8a3a);
      K.add(new THREE.PlaneGeometry(0.5, 0.5), gold, ax, 0.6 + 7.6, az + ad / 2 + 0.03, 0, false).rotation.z = Math.PI / 4; }
    // o salão central: alto, telhado de lajes, frontão com o martelo
    { const hw = Wm - 13, hd = Dm - 2.5, hzc = Dm - 0.6 - hd / 2, hh = 10; K.box(hw, hh, hd, cx, 0.6, hzc, sm);
      { const ang = Math.atan2(5.5, hw / 2), L = (hw / 2 + 0.7) / Math.cos(ang); for (const t of [-1, 1]) { const piv = new THREE.Group(); piv.position.set(cx, 0.6 + hh + 5.5, hzc); piv.rotation.z = -t * ang; const m = new THREE.Mesh(texBox(L, 0.45, hd + 1, 2), rfS); m.position.x = t * L / 2; m.castShadow = true; piv.add(m); K.g.add(piv); } }
      const tri = new THREE.Shape(); tri.moveTo(-hw / 2, 0); tri.lineTo(hw / 2, 0); tri.lineTo(0, 5.5); const gm = new THREE.Mesh(new THREE.ShapeGeometry(tri), lt); gm.position.set(cx, 0.6 + hh, hz + 0.02); K.g.add(gm);
      K.add(new THREE.BoxGeometry(0.4, 3.2, 0.2), gold, cx, 0.6 + hh + 2.0, hz + 0.1, 0, false); K.add(new THREE.BoxGeometry(2.2, 1.1, 0.3), gold, cx, 0.6 + hh + 3.4, hz + 0.12, 0, false);
      // contrafortes rúnicos na fachada (largos, de pedra mais escura, com a faixa de cobre)
      for (const s of [-1, 1]) for (const k of [0, 1]) { const x = cx + s * (hw / 2 - 0.6 - k * 3.4); K.box(1.4, hh + 0.6, 1.2, x, 0.6, hz + 0.3, dk); K.box(1.5, 0.35, 1.3, x, 0.6 + hh * 0.62, hz + 0.32, cu); K.add(new THREE.ConeGeometry(0.75, 1.6, 4), dk, x, 0.6 + hh + 1.4, hz + 0.3, Math.PI / 4); }
      // o portal: arco duplo (pedra clara por fora, cobre por dentro), a boca da forja acesa e o rosto do Pai-Forjador por cima
      const a = K.archWall(7.2, 8, 1.2, 4.8, 3.2, lt); a.position.set(cx, 0.6, hz + 0.5); K.g.add(a); const r2 = K.archRing(4.8, 0.6 + 3.2, 1.3, cu); r2.position.set(cx, 0, hz + 0.5); K.g.add(r2);
      K.add(new THREE.PlaneGeometry(4.8, 5.6), glowM(0xff6a20), cx, 0.6 + 2.8, hz - 0.1, 0, false); K.add(new THREE.PlaneGeometry(3.2, 2.6), glowM(0xffc060), cx, 0.6 + 1.3, hz - 0.08, 0, false);
      { const fz = hz + 1.2; K.add(new THREE.BoxGeometry(2.4, 2.0, 0.6), lt, cx, 0.6 + 8.8, fz); K.add(new THREE.BoxGeometry(2.8, 0.5, 0.7), dk, cx, 0.6 + 9.9, fz); for (const s of [-1, 1]) K.add(new THREE.PlaneGeometry(0.4, 0.25), glowM(0xff8a3a), cx + s * 0.55, 0.6 + 9.1, fz + 0.31, 0, false); for (let k = 0; k < 5; k++) K.add(new THREE.ConeGeometry(0.22, 1.4, 4), lt, cx - 0.8 + k * 0.4, 0.6 + 7.3, fz + 0.1, 0, false).rotation.x = Math.PI; } // o rosto e a barba de pedra
      K.out.glows.push({ pos: new THREE.Vector3(cx, 2.6, hz + 1.6), color: 0xff7a30, base: 50 });
      for (let k = 0; k < 4; k++) K.box(8.4 - k * 0.5, 0.2, 0.8, cx, 0.6 - (k + 1) * 0.15, hz + 1.4 + k * 0.7, dk); }
    // as chaminés colossais (atrás das alas), com bocas acesas e fumaça
    for (const s of [-1, 1]) { const tx = cx + s * (Wm / 2 - 3.6), tz = 3.2; K.cyl(1.4, 1.9, 22, tx, 0.6, tz, dk, 10); K.cyl(2.0, 1.6, 1.2, tx, 22.6, tz, cu, 10); K.add(new THREE.CircleGeometry(1.2, 10).rotateX(-Math.PI / 2), glowM(0xff6a20), tx, 23.85, tz, 0, false); K.out.smoke.push(new THREE.Vector3(tx, 24.6, tz)); }
    // bigornas e lingotes na frente
    for (const s of [-1, 1]) { K.box(1.2, 0.7, 0.6, cx + s * 6.4, 0.6, hz + 2.2, flat(0x2a2a30)); K.box(1.6, 0.25, 0.7, cx + s * 6.4, 1.3, hz + 2.2, flat(0x2a2a30)); K.torch(cx + s * 4.6, 0.6, hz + 2.0); }
  } else if (v === 12) { // UNIVERSIDADE DOS MIL MECANISMOS — palácio do saber: escadaria, pórtico de colunas com frontão e a grande engrenagem,
    // duas alas com telhado de cobre e janelões em arco, a cúpula alta sobre um tambor de colunas, cúpulas menores e a torre do relógio
    const sm = stone(0xa8aeb4), dk = stone(0x7a8086), cuR = slate(0x3a8a7a), cu = flat(0x4a9a8a), br = flat(0xc8a050), hh = 9.5;
    // as duas alas
    for (const s of [-1, 1]) { const ax = cx + s * (Wm / 2 - 5.2), aw = 9.6, ad = Dm - 5, az = Dm - 1.2 - ad / 2; K.box(aw, hh, ad, ax, 0.6, az, sm); K.box(aw + 0.4, 0.5, ad + 0.4, ax, 0.6 + hh, az, dk);
      { const ang = Math.atan2(3.4, ad / 2), L = (ad / 2 + 0.6) / Math.cos(ang); for (const t of [-1, 1]) { const piv = new THREE.Group(); piv.position.set(ax, 0.6 + hh + 0.5 + 3.4, az); piv.rotation.x = t * ang; const m = new THREE.Mesh(texBox(aw + 0.8, 0.25, L, 2), cuR); m.position.z = t * L / 2; m.castShadow = true; piv.add(m); K.g.add(piv); } }
      for (let k = 0; k < 3; k++) { const x = ax - aw / 2 + 1.7 + k * ((aw - 3.4) / 2); K.window_(1.3, 3.0, x, 0.6 + 4.2, az + ad / 2 + 0.02, 0, 0x8ad0ff); K.add(new THREE.CircleGeometry(0.65, 12, 0, Math.PI), glowM(0x8ad0ff), x, 0.6 + 5.7, az + ad / 2 + 0.02, 0, false); K.box(1.7, 0.2, 0.3, x, 0.6 + 2.5, az + ad / 2 + 0.1, dk); }
      for (let k = 0; k < 3; k++) K.window_(1.0, 2.6, ax + s * (aw / 2 + 0.02), 0.6 + 4.2, az - ad / 2 + 2 + k * ((ad - 4) / 2), s * Math.PI / 2, 0x8ad0ff);
      K.cyl(1.6, 1.6, 1.4, ax, 0.6 + hh + 0.5 + 3.4, az, sm, 12); K.add(new THREE.SphereGeometry(1.6, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), cu, ax, 0.6 + hh + 0.5 + 4.8, az); }
    // o corpo central com a cúpula grande
    { const bw = Wm - 19.2 + 1, bd = Dm - 3, bz = Dm - 1.2 - bd / 2; K.box(bw, hh + 2, bd, cx, 0.6, bz, sm);
      const y = 0.6 + hh + 2; K.cyl(4.8, 5.0, 3.2, cx, y, bz - 1, sm, 20);
      for (let k = 0; k < 14; k++) { const a = k / 14 * Math.PI * 2; K.cyl(0.22, 0.22, 3.2, cx + Math.cos(a) * 5.15, y, bz - 1 + Math.sin(a) * 5.15, br, 6); }
      K.add(new THREE.SphereGeometry(4.9, 22, 12, 0, Math.PI * 2, 0, Math.PI / 2), cu, cx, y + 3.2, bz - 1);
      for (let k = 0; k < 8; k++) { const rib = K.add(new THREE.TorusGeometry(4.92, 0.09, 4, 16, Math.PI / 2), br, cx, y + 3.2, bz - 1, 0, false); rib.rotation.set(0, -k / 8 * Math.PI * 2, Math.PI / 2); }
      K.cyl(0.8, 0.9, 2, cx, y + 8, bz - 1, br, 8); K.add(new THREE.SphereGeometry(0.4, 8, 6), glowM(0x8ad0ff), cx, y + 10.4, bz - 1, 0, false);
      K.out.glows.push({ pos: new THREE.Vector3(cx, y + 10.4, bz - 1), color: 0x7ac0ff, base: 30 }); }
    // o pórtico: escadaria, seis colunas, frontão com a engrenagem de bronze
    { const pz = Dm - 0.4, pw = Wm - 19.2 + 2;
      for (let k = 0; k < 4; k++) K.box(pw + 1.5 - k * 0.3, 0.22, 0.9, cx, 0.6 - (k + 1) * 0.15, pz + k * 0.6, dk);
      for (let k = 0; k < 6; k++) { const x = cx - pw / 2 + 0.6 + k * ((pw - 1.2) / 5); K.cyl(0.38, 0.44, 7.8, x, 0.6, pz - 1.2, sm, 10); K.box(0.95, 0.3, 0.95, x, 0.6 + 7.8, pz - 1.2, dk); }
      K.box(pw + 0.4, 0.9, 3.2, cx, 0.6 + 8.1, pz - 2.2, sm);
      const tri = new THREE.Shape(); tri.moveTo(-pw / 2 - 0.2, 0); tri.lineTo(pw / 2 + 0.2, 0); tri.lineTo(0, 3.2); const ped = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: 3.2, bevelEnabled: false }), sm); ped.position.set(cx, 0.6 + 9.0, pz - 3.8); ped.castShadow = true; K.g.add(ped);
      { const gy = 0.6 + 10.2, gz = pz - 0.55; K.add(new THREE.TorusGeometry(1.0, 0.16, 6, 18), br, cx, gy, gz, 0, false); for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; const t = K.add(new THREE.BoxGeometry(0.28, 0.32, 0.12), br, cx + Math.cos(a) * 1.22, gy + Math.sin(a) * 1.22, gz, 0, false); t.rotation.z = a; } K.add(new THREE.CircleGeometry(0.35, 10), br, cx, gy, gz + 0.02, 0, false); }
      doorArch(2.8, 4.6, door, pz - 2.6, sm, br); K.torch(cx - pw / 2 - 0.4, 0.6, pz + 0.3); K.torch(cx + pw / 2 + 0.4, 0.6, pz + 0.3);
      K.out.glows.push({ pos: new THREE.Vector3(cx, 4, pz + 1), color: 0x7ac0ff, base: 30 }); }
    // a torre do relógio (atrás da ala esquerda), com o mostrador-engrenagem virado para a câmera
    { const tx = 3.2, tz = 4.0, S = 4.4, th = 24; K.box(S, th, S, tx, 0.6, tz, sm); K.box(S + 0.5, 0.5, S + 0.5, tx, 0.6 + th, tz, dk); K.cone(S * 0.74, 6, tx, 0.6 + th + 0.5, tz, cuR, 4, Math.PI / 4);
      const gy = 0.6 + th - 3.4, gz = tz + S / 2 + 0.12; K.add(new THREE.CircleGeometry(1.6, 20), flat(0xe8e0c8), tx, gy, gz, 0, false); K.add(new THREE.TorusGeometry(1.7, 0.16, 6, 20), br, tx, gy, gz + 0.02, 0, false);
      for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; const tooth = K.add(new THREE.BoxGeometry(0.34, 0.4, 0.14), br, tx + Math.cos(a) * 1.98, gy + Math.sin(a) * 1.98, gz + 0.02, 0, false); tooth.rotation.z = a; }
      K.add(new THREE.BoxGeometry(0.1, 1.2, 0.04), flat(0x2a2a30), tx, gy + 0.5, gz + 0.06, 0, false); }
    // canos de latão e chaminés de vapor atrás
    for (let k = 0; k < 3; k++) { K.cyl(0.24, 0.24, hh + 6 + k * 1.4, Wm - 3 - k * 0.8, 0.6, 3.0, br, 8); K.out.smoke.push(new THREE.Vector3(Wm - 3 - k * 0.8, 0.6 + hh + 6.4 + k * 1.4, 3.0)); }
  } else { // 13 IGREJA KÁRMICA: templo do Olho — escadaria, pórtico de seis colunas e frontão, nave com vitrais acesos, flecha central com o losango violeta
    const sm = stone(0xb8b0c0), dkv = stone(0x6a6278), rf = slate(0x4a3a6a), hw = Wm - 6, hd = Dm - 8, hz = Dm / 2 - 2.3, hh = 11;
    K.box(hw + 3, 1.0, hd + 4, cx, 0.6, hz + 1, dkv);
    K.box(hw, hh, hd, cx, 1.6, hz, sm);
    { const a = Math.atan2(5.5, hw / 2), L = (hw / 2 + 0.6) / Math.cos(a); for (const s of [-1, 1]) { const piv = new THREE.Group(); piv.position.set(cx, 1.6 + hh + 0.05, hz); piv.rotation.z = s * -a; const m = new THREE.Mesh(texBox(L, 0.22, hd + 1, 2), rf); m.position.x = s * L / 2; m.castShadow = true; piv.add(m); K.g.add(piv); } }
    for (let k = 0; k < 4; k++) for (const s of [-1, 1]) K.vit(k, 'm', cx + s * (hw / 2 + 0.04), 1.6 + 5.6, hz - hd / 2 + 2.6 + k * ((hd - 5.2) / 3), s * Math.PI / 2, 2.1, sm);
    K.out.glows.push({ pos: new THREE.Vector3(cx, 6, hz), color: 0xb08aff, base: 34 });
    // pórtico: seis colunas, arquitrave e frontão triangular com o Olho
    { const pz = hz + hd / 2 + 2.2, pw = hw + 0.6;
      K.box(pw + 1, 0.4, 4.6, cx, 1.6, pz - 0.2, dkv);
      for (let k = 0; k < 6; k++) { const x = cx - pw / 2 + 0.7 + k * ((pw - 1.4) / 5); K.cyl(0.42, 0.48, 8.4, x, 2.0, pz + 1.4, sm, 10); K.box(1.1, 0.4, 1.1, x, 2.0, pz + 1.4, dkv); K.box(1.1, 0.4, 1.1, x, 10.0, pz + 1.4, dkv); }
      K.box(pw + 0.4, 1.0, 4.4, cx, 10.4, pz - 0.2, sm);
      const tri = new THREE.Shape(); tri.moveTo(-pw / 2 - 0.2, 0); tri.lineTo(pw / 2 + 0.2, 0); tri.lineTo(0, 3.6); const tg = new THREE.ExtrudeGeometry(tri, { depth: 4.4, bevelEnabled: false }); const ped = new THREE.Mesh(tg, sm); ped.position.set(cx, 11.4, pz - 2.4); ped.castShadow = true; K.g.add(ped);
      const pr = new THREE.Group(); { const a = Math.atan2(3.6, pw / 2), L = (pw / 2 + 0.5) / Math.cos(a); for (const s of [-1, 1]) { const piv = new THREE.Group(); piv.position.set(cx, 11.4 + 3.62, pz - 0.2); piv.rotation.z = s * -a; const m = new THREE.Mesh(texBox(L, 0.2, 4.8, 2), rf); m.position.x = s * L / 2; piv.add(m); pr.add(piv); } } pr.position.y = 0; K.g.add(pr);
      const eye = K.add(new THREE.PlaneGeometry(1.5, 1.5), glowM(0xc08aff), cx, 12.6, pz + 2.02, 0, false); eye.rotation.z = Math.PI / 4;
      K.add(new THREE.PlaneGeometry(0.6, 0.6), goldM(), cx, 12.6, pz + 2.04, 0, false).rotation.z = Math.PI / 4;
      for (let k = 0; k < 4; k++) K.box(pw + 1 - k * 0.4, 0.4, 0.9, cx, 1.6 - (k + 1) * 0.4 + 0.4, pz + 2.4 + k * 0.9, dkv);
      doorArch(2.6, 5, door, hz + hd / 2 + 0.3, sm, goldM());
      K.torch(cx - pw / 2 - 0.4, 0.6, pz + 3.2); K.torch(cx + pw / 2 + 0.4, 0.6, pz + 3.2); }
    // flecha central: torre sobre o cruzeiro, campanário aberto, flecha alta e o losango violeta no topo
    { const tz = hz - 1.5, S = 4.6, y = 1.6 + hh;
      K.box(S, 6, S, cx, y, tz, sm); for (const s of [-1, 1]) { K.vit(4 + (s > 0 ? 1 : 0), 'p', cx, y + 3.4, tz + s * (S / 2 + 0.04), s > 0 ? 0 : Math.PI, 2.0, sm); K.vit(6 + (s > 0 ? 1 : 0), 'p', cx + s * (S / 2 + 0.04), y + 3.4, tz, s * Math.PI / 2, 2.0, sm); }
      K.box(S + 0.5, 0.5, S + 0.5, cx, y + 6, tz, dkv);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) K.add(new THREE.ConeGeometry(0.36, 2.4, 5), dkv, cx + sx * S / 2, y + 6.5 + 1.2, tz + sz * S / 2, 0, false);
      K.cone(S * 0.68, 13, cx, y + 6.5, tz, rf, 8, 0);
      const gem = K.add(new THREE.OctahedronGeometry(0.8), glowM(0xc08aff), cx, y + 6.5 + 13.9, tz, 0, false); gem.scale.y = 1.4;
      K.out.glows.push({ pos: new THREE.Vector3(cx, y + 20.6, tz), color: 0xb08aff, base: 30 }); }
    // rosácea do Olho na fachada da nave (acima do pórtico)
    K.vit(8, 'g', cx, 1.6 + hh - 2.6, hz + hd / 2 + 0.05, 0, 1.3, sm);
  }
  void wallC; void front;
  return K.out;
}

/** ponte de pedra em arco (canal de Askavik): tabuleiro curvo, parapeitos com balaústres, arco aparente por baixo, pilares nas pontas e lampiões.
 *  Origem no meio da ponte, comprimento ao longo de z, altura 0 = ponta. */
export function buildStoneBridge(len: number, half: number, hump: number): Built {
  const K = kit(), sm = stone(0x9a948a), dk = stone(0x6a645c), lt = stone(0xb0a898), N = Math.max(8, Math.round(len / 0.6));
  const yAt = (t: number) => hump * Math.sin(Math.PI * t);
  for (let i = 0; i < N; i++) { const t0 = i / N, t1 = (i + 1) / N, z0 = -len / 2 + t0 * len, z1 = -len / 2 + t1 * len, y0 = yAt(t0), y1 = yAt(t1), L = Math.hypot(z1 - z0, y1 - y0), a = Math.atan2(y1 - y0, z1 - z0);
    const seg = K.add(new THREE.BoxGeometry(half * 2, 0.45, L + 0.04), sm, 0, (y0 + y1) / 2 - 0.12, (z0 + z1) / 2); seg.rotation.x = -a;
    for (const s of [-1, 1]) { const p = K.add(new THREE.BoxGeometry(0.32, 0.22, L + 0.04), lt, s * (half - 0.16), (y0 + y1) / 2 + 0.9, (z0 + z1) / 2); p.rotation.x = -a; // corrimão
      if (i % 2 === 0) K.add(new THREE.CylinderGeometry(0.09, 0.12, 0.8, 6), lt, s * (half - 0.16), (y0 + y1) / 2 + 0.45, (z0 + z1) / 2); } // balaústres
  }
  // o arco por baixo (aparece sobre a água) e a testa de pedra dos dois lados
  for (const s of [-1, 1]) { const sh = new THREE.Shape(); sh.moveTo(-len / 2, -0.35); sh.lineTo(len / 2, -0.35); sh.lineTo(len / 2, -2.6); sh.lineTo(-len / 2, -2.6); sh.lineTo(-len / 2, -0.35);
    const nA = Math.max(1, Math.round(len / 11)), span = len / nA; // pontes longas: vários arcos em fila
    for (let k = 0; k < nA; k++) { const mx = -len / 2 + span * (k + 0.5), r = span * 0.42; const hole = new THREE.Path(); hole.moveTo(mx - r, -2.6); hole.absarc(mx, -2.6, r, Math.PI, 0, true); hole.lineTo(mx - r, -2.6); sh.holes.push(hole); }
    const geo = new THREE.ShapeGeometry(sh, 12); const m = new THREE.Mesh(geo, dk); m.rotation.y = Math.PI / 2; m.position.x = s * half; m.castShadow = true; K.g.add(m); }
  { const nA = Math.max(1, Math.round(len / 11)), span = len / nA; for (let k = 1; k < nA; k++) { const z = -len / 2 + span * k; K.box(half * 2 + 0.4, 3.0, 1.4, 0, -3.2, z, dk); K.box(half * 2 + 0.7, 0.3, 1.7, 0, -0.4 + yAt(k / nA) - 0.2, z, lt); } } // pilares no meio da água
  for (const e of [-1, 1]) { K.box(half * 2 + 0.6, 1.2, 0.8, 0, -0.5, e * (len / 2 - 0.2), dk); for (const s of [-1, 1]) { K.box(0.6, 1.3, 0.6, s * (half - 0.1), 0.4, e * (len / 2 - 0.3), lt); K.torch(s * (half - 0.1), 1.7, e * (len / 2 - 0.3)); } }
  return K.out;
}

/** cais de pedra: muro a prumo do chão até a água e parapeito baixo com balaústres, seguindo a curva do canal.
 *  pts = pontos da borda (m, locais), lado da água = `side` (+1 → +x) */
export function buildQuay(pts: { x: number; z: number }[], side: number): Built {
  const K = kit(), sm = stone(0x8a857e), lt = stone(0xa8a298);
  for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1], L = Math.hypot(b.x - a.x, b.z - a.z), ry = Math.atan2(b.x - a.x, b.z - a.z), mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2;
    const w = K.add(new THREE.BoxGeometry(0.6, 2.4, L + 0.05), sm, mx + side * 0.3, -1.1, mz, ry); void w;
    K.add(new THREE.BoxGeometry(0.4, 0.16, L + 0.05), lt, mx - side * 0.1, 0.62, mz, ry);
    K.add(new THREE.BoxGeometry(0.5, 0.18, L + 0.05), lt, mx - side * 0.1, 0.06, mz, ry);
    for (let k = 0; k < 2; k++) { const t = (k + 0.5) / 2; K.add(new THREE.CylinderGeometry(0.07, 0.1, 0.5, 6), lt, a.x + (b.x - a.x) * t - side * 0.1, 0.36, a.z + (b.z - a.z) * t); } }
  return K.out;
}
