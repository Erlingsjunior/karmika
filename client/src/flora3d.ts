/** Árvores por espécie, feitas em cima das pranchas do Herik (imagens 54 e 55 do catálogo, 01/11):
 *  cada bioma do mundo recebe a flora que combina com ele (Erling: "a vegetação tem que coincidir com a flora do local").
 *  Formas chapadas e volumosas como nos renders: tronco em tubo cônico, copas em blocos facetados (icosaedros amassados),
 *  saias de cone no abeto, cordões pendentes no salgueiro e na bétula branca, frondes na palmeira.
 *  Tudo é gerado uma vez por variante (cache) e vem em duas malhas: casca e folhagem (uma por material). */
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { windify } from './terrain3d';

export type Species = 'oak' | 'pineRed' | 'birchWhite' | 'willowIce' | 'ancient' | 'birchYellow' | 'burnt' | 'fir'
  | 'twisted' | 'cypress' | 'acacia' | 'larch' | 'baobab' | 'blackRed' | 'palm' | 'whiteSnow';

/** espécies por bioma, com peso (a escolha é determinística pelo hash da posição) */
export const FLORA: Record<string, [Species, number][]> = {
  meadow: [['oak', 6], ['birchYellow', 2], ['pineRed', 2]],
  forest: [['oak', 3], ['pineRed', 4], ['twisted', 2], ['ancient', 1]],
  enchanted: [['ancient', 4], ['birchWhite', 4], ['oak', 2]],
  snow: [['fir', 6], ['willowIce', 2], ['whiteSnow', 3]],
  swamp: [['cypress', 6], ['twisted', 2], ['burnt', 2]],
  ruins: [['burnt', 5], ['twisted', 3], ['oak', 2]],
  rock: [['larch', 5], ['fir', 3], ['twisted', 2]],
  volcanic: [['burnt', 7], ['larch', 3]],
  blight: [['blackRed', 6], ['burnt', 4]],
  jungle: [['palm', 5], ['baobab', 2], ['ancient', 2], ['oak', 1]],
  coast: [['palm', 5], ['acacia', 3], ['baobab', 2]],
};
export function pickSpecies(biome: string, h: number): Species {
  const L = FLORA[biome] ?? FLORA.meadow; const tot = L.reduce((s, e) => s + e[1], 0); let k = h * tot;
  for (const [sp, w] of L) { if (k < w) return sp; k -= w; } return L[0][0];
}

function mulberry(a: number) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const ramp = new THREE.DataTexture(new Uint8Array([40, 40, 40, 255, 105, 105, 105, 255, 175, 175, 175, 255, 255, 255, 255, 255]), 4, 1, THREE.RGBAFormat);
ramp.minFilter = ramp.magFilter = THREE.NearestFilter; ramp.needsUpdate = true;

function barkTex(base: string, dark: string, light: string, rings = false) {
  const c = document.createElement('canvas'); c.width = 64; c.height = 128; const g = c.getContext('2d')!;
  g.fillStyle = base; g.fillRect(0, 0, 64, 128);
  for (let i = 0; i < 110; i++) { const x = Math.random() * 64, y = Math.random() * 128, l = rings ? 2 + Math.random() * 6 : 10 + Math.random() * 40;
    g.strokeStyle = Math.random() < 0.55 ? dark : light; g.lineWidth = 1 + Math.random() * 2; g.beginPath();
    if (rings) { g.moveTo(x - 8 - Math.random() * 10, y); g.lineTo(x + 8 + Math.random() * 10, y + (Math.random() - 0.5) * 2); } else { g.moveTo(x, y); g.quadraticCurveTo(x + (Math.random() - 0.5) * 6, y + l / 2, x + (Math.random() - 0.5) * 4, y + l); } g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t;
}
const BARK = {
  brown: barkTex('#4a3a2e', 'rgba(15,10,8,.55)', 'rgba(150,125,95,.28)'),
  red: barkTex('#7a3a1e', 'rgba(40,12,6,.6)', 'rgba(200,110,60,.3)'),
  white: barkTex('#d8d4cc', 'rgba(30,30,34,.7)', 'rgba(255,255,255,.35)', true),
  moss: barkTex('#3e4a30', 'rgba(10,15,8,.6)', 'rgba(120,150,80,.35)'),
  burnt: barkTex('#1c1816', 'rgba(0,0,0,.7)', 'rgba(90,70,60,.3)'),
  grey: barkTex('#8a8278', 'rgba(30,25,20,.5)', 'rgba(200,190,170,.3)'),
  black: barkTex('#1e1a24', 'rgba(0,0,0,.7)', 'rgba(90,60,110,.3)'),
  ice: barkTex('#6a7a84', 'rgba(20,30,40,.6)', 'rgba(190,220,230,.3)'),
  palm: barkTex('#6a4a28', 'rgba(20,10,5,.6)', 'rgba(170,130,80,.3)', true),
  baobab: barkTex('#a89478', 'rgba(60,45,30,.5)', 'rgba(220,205,180,.3)', true),
};
const toon = (map: THREE.Texture, color = 0xffffff) => new THREE.MeshToonMaterial({ map, color, gradientMap: ramp });
const leaf = (color: number, amp = 0.06, freq = 1.2) => windify(new THREE.MeshToonMaterial({ color, gradientMap: ramp, side: THREE.DoubleSide }), amp, freq);
const BM: Record<string, THREE.Material> = { brown: toon(BARK.brown), red: toon(BARK.red), white: toon(BARK.white), moss: toon(BARK.moss), burnt: toon(BARK.burnt), grey: toon(BARK.grey), black: toon(BARK.black), ice: toon(BARK.ice), palm: toon(BARK.palm), baobab: toon(BARK.baobab) };
const LM: Record<string, THREE.Material> = {
  oak: leaf(0x4c7a34), oakDark: leaf(0x35602a), yellow: leaf(0xd6c62a), blueGreen: leaf(0x3f7a74), birch: leaf(0x9cb88c), ice: leaf(0x9ae0e8, 0.1, 1.0),
  moss: leaf(0x5a7a34), fir: leaf(0x2c5a44), snow: leaf(0xf0f6ff, 0.02, 0.8), jungle: leaf(0x3a8a3a), cypress: leaf(0x7a9a60), hang: leaf(0xa8b890, 0.12, 0.9),
  acacia: leaf(0xa8b848), gold: leaf(0xe0a020, 0.1), red: leaf(0x8a1224, 0.1), palm: leaf(0x4a9a3a, 0.09, 1.1), baobab: leaf(0x6aa040),
};

/** tubo cônico ao longo de uma curva */
function tube(pts: THREE.Vector3[], radiusAt: (t: number) => number, radial = 6, segs = 10): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5); const P = curve.getPoints(segs); const fr = curve.computeFrenetFrames(segs, false);
  const pos: number[] = [], nor: number[] = [], uv: number[] = [], idx: number[] = [];
  for (let i = 0; i <= segs; i++) { const t = i / segs, r = radiusAt(t); for (let j = 0; j <= radial; j++) { const a = (j / radial) * Math.PI * 2, nx = Math.cos(a), ny = Math.sin(a);
    const n = new THREE.Vector3().addScaledVector(fr.normals[i], nx).addScaledVector(fr.binormals[i], ny); pos.push(P[i].x + n.x * r, P[i].y + n.y * r, P[i].z + n.z * r); nor.push(n.x, n.y, n.z); uv.push(j / radial, t * 2); } }
  for (let i = 0; i < segs; i++) for (let j = 0; j < radial; j++) { const a = i * (radial + 1) + j, b = a + radial + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); return g;
}
/** bloco de folhagem facetado (icosaedro amassado) */
function blob(rnd: () => number, x: number, y: number, z: number, r: number, sy = 0.8): THREE.BufferGeometry {
  const g = new THREE.IcosahedronGeometry(r, 1); const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) { const k = 0.82 + rnd() * 0.36; p.setXYZ(i, p.getX(i) * k, p.getY(i) * k * sy, p.getZ(i) * k); }
  g.computeVertexNormals(); g.translate(x, y, z); return g;
}
/** galho que cresce com ramificação (tronco retorcido) */
function grow(rnd: () => number, out: THREE.BufferGeometry[], tips: { p: THREE.Vector3; d: THREE.Vector3 }[], start: THREE.Vector3, dir: THREE.Vector3, len: number, r0: number, depth: number, gnarl: number, up = 0.18) {
  const n = 5; const pts = [start.clone()]; const d = dir.clone().normalize(); const side = new THREE.Vector3(rnd() - 0.5, 0, rnd() - 0.5).normalize();
  for (let i = 1; i <= n; i++) { const last = pts[pts.length - 1]; d.addScaledVector(side, (rnd() - 0.5) * gnarl * 1.4).addScaledVector(new THREE.Vector3(rnd() - 0.5, (rnd() - 0.45) * 0.4, rnd() - 0.5), gnarl * 0.5).normalize(); pts.push(last.clone().addScaledVector(d, len / n)); }
  out.push(tube(pts, (t) => Math.max(0.012, r0 * (1 - t * 0.88) * (depth === 3 ? 1 + 1.1 * Math.exp(-t * 9) : 1)), depth >= 2 ? 7 : 5, 10)); tips.push({ p: pts[n].clone(), d: d.clone() });
  if (depth <= 0) return; const kids = depth === 3 ? 4 + ((rnd() * 2) | 0) : 2 + ((rnd() * 2) | 0);
  for (let k = 0; k < kids; k++) { const at = depth === 3 ? 2 + ((k * 3 / kids) | 0) : 1 + ((rnd() * 4) | 0); const base = pts[Math.min(n, at)]; const ang = rnd() * Math.PI * 2, spread = 0.7 + rnd() * 0.6;
    const nd = d.clone().multiplyScalar(0.55).add(new THREE.Vector3(Math.cos(ang) * spread, up + rnd() * 0.35, Math.sin(ang) * spread)).normalize(); grow(rnd, out, tips, base, nd, len * (0.62 + rnd() * 0.15), r0 * (0.5 - depth * 0.04), depth - 1, gnarl, up); }
}
/** tronco reto com leve curva */
function trunk(rnd: () => number, h: number, r0: number, lean = 0.25, radial = 7): THREE.BufferGeometry {
  return tube([new THREE.Vector3(0, -0.2, 0), new THREE.Vector3((rnd() - 0.5) * lean, h * 0.33, (rnd() - 0.5) * lean), new THREE.Vector3((rnd() - 0.5) * lean * 1.3, h * 0.66, (rnd() - 0.5) * lean * 1.3), new THREE.Vector3((rnd() - 0.5) * lean, h, (rnd() - 0.5) * lean)], (t) => r0 * (1 - t * 0.82) + 0.03, radial, 10);
}
/** cordão pendente (salgueiro, bétula, musgo): fita estreita que cai da ponta do galho */
function strand(rnd: () => number, x: number, y: number, z: number, len: number, w = 0.14): THREE.BufferGeometry {
  const g = new THREE.PlaneGeometry(w, len, 1, 4); const p = g.attributes.position as THREE.BufferAttribute; const sw = (rnd() - 0.5) * 0.5;
  for (let i = 0; i < p.count; i++) { const t = (p.getY(i) + len / 2) / len; p.setX(i, p.getX(i) + sw * (1 - t) * (1 - t)); } g.translate(0, -len / 2, 0); g.rotateY(rnd() * 6.283); g.translate(x, y, z); return g;
}
/** raízes/contrafortes na base */
function roots(rnd: () => number, out: THREE.BufferGeometry[], r0: number, n = 5, len = 1.0) {
  for (let k = 0; k < n; k++) { const a = (k / n) * 6.283 + rnd() * 0.6; const d = new THREE.Vector3(Math.cos(a), -0.35, Math.sin(a)).normalize();
    out.push(tube([new THREE.Vector3(0, 0.2, 0), new THREE.Vector3(d.x * r0 * 1.2, -0.05, d.z * r0 * 1.2), new THREE.Vector3(d.x * (r0 + len), -0.3, d.z * (r0 + len))], (t) => r0 * 0.42 * (1 - t * 0.8) + 0.02, 5, 6)); }
}

interface Made { bark: THREE.BufferGeometry; barkM: THREE.Material; leaves: THREE.BufferGeometry | null; leafM: THREE.Material; extra?: { geo: THREE.BufferGeometry; m: THREE.Material } }
/* o merge exige todas indexadas ou todas não indexadas: tudo vira não indexado (icosaedros já são) */
const mergeAll = (L: THREE.BufferGeometry[]) => mergeGeometries(L.map((g) => (g.index ? g.toNonIndexed() : g)), false)!;
const M = (bark: THREE.BufferGeometry[], barkM: THREE.Material, leaves: THREE.BufferGeometry[], leafM: THREE.Material, extra?: { geo: THREE.BufferGeometry[]; m: THREE.Material }): Made =>
  ({ bark: mergeAll(bark), barkM, leaves: leaves.length ? mergeAll(leaves) : null, leafM, extra: extra && extra.geo.length ? { geo: mergeAll(extra.geo), m: extra.m } : undefined });

/* ---------- espécies (altura nominal 7 m; o chamador escala) ---------- */
function oak(rnd: () => number, dark: boolean): Made { // 54.1: carvalho frondoso, tronco grosso, copa em blocos verdes
  const B: THREE.BufferGeometry[] = [], tips: { p: THREE.Vector3; d: THREE.Vector3 }[] = [];
  grow(rnd, B, tips, new THREE.Vector3(0, -0.2, 0), new THREE.Vector3((rnd() - 0.5) * 0.3, 1, (rnd() - 0.5) * 0.3), 2.6, 0.46, 3, 0.35, 0.3); roots(rnd, B, 0.46, 5, 0.7);
  const L: THREE.BufferGeometry[] = []; for (const t of tips) if (t.p.y > 2.6) L.push(blob(rnd, t.p.x, t.p.y + 0.3, t.p.z, 0.9 + rnd() * 0.6));
  L.push(blob(rnd, 0, 5.0, 0, 1.3, 0.7)); return M(B, BM.brown, L, dark ? LM.oakDark : LM.oak);
}
function pineRed(rnd: () => number): Made { // 54.2: pinheiro de casca ruiva, tronco alto e nu, tufos azul-verde em galhos curtos
  const B = [trunk(rnd, 7.6, 0.26, 0.4)]; const L: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 9; i++) { const y = 3.4 + i * 0.5, a = i * 2.4 + rnd(), r = 0.9 * (1 - i / 12); const x = Math.cos(a) * r, z = Math.sin(a) * r;
    B.push(tube([new THREE.Vector3(0, y, 0), new THREE.Vector3(x, y + 0.15, z)], () => 0.05, 4, 3)); L.push(blob(rnd, x, y + 0.2, z, 0.42 + rnd() * 0.2, 0.45)); }
  L.push(blob(rnd, 0, 7.6, 0, 0.5, 0.5)); return M(B, BM.red, L, LM.blueGreen);
}
function birch(rnd: () => number, white: boolean): Made { // 54.3 bétula branca pendente / 54.6 bétula amarela de outono
  const B = [trunk(rnd, 6.4, 0.17, 0.35, 6)]; const L: THREE.BufferGeometry[] = []; roots(rnd, B, 0.17, 4, 0.4);
  for (let i = 0; i < 7; i++) { const y = 3.0 + i * 0.5, a = i * 2.1 + rnd(), r = 0.8 + rnd() * 0.5; const x = Math.cos(a) * r, z = Math.sin(a) * r;
    B.push(tube([new THREE.Vector3(0, y, 0), new THREE.Vector3(x * 0.6, y + 0.5, z * 0.6), new THREE.Vector3(x, y + 0.3, z)], (t) => 0.06 * (1 - t * 0.7), 4, 4));
    L.push(blob(rnd, x, y + 0.45, z, 0.5 + rnd() * 0.25, 0.6)); if (white) for (let k = 0; k < 3; k++) L.push(strand(rnd, x + (rnd() - 0.5) * 0.6, y + 0.3, z + (rnd() - 0.5) * 0.6, 0.8 + rnd() * 0.6, 0.12)); }
  L.push(blob(rnd, 0, 6.5, 0, 0.6, 0.7)); return M(B, BM.white, L, white ? LM.birch : LM.yellow);
}
function willowIce(rnd: () => number): Made { // 54.4: salgueiro azul-gelo, tronco torto, cortinas de cordões caídos
  const B: THREE.BufferGeometry[] = [], tips: { p: THREE.Vector3; d: THREE.Vector3 }[] = [];
  grow(rnd, B, tips, new THREE.Vector3(0, -0.2, 0), new THREE.Vector3(0.3, 1, 0.1), 2.4, 0.4, 2, 0.5, 0.4); roots(rnd, B, 0.4, 4, 0.8);
  const L: THREE.BufferGeometry[] = []; for (const t of tips) { if (t.p.y < 2.5) continue; L.push(blob(rnd, t.p.x, t.p.y + 0.2, t.p.z, 0.7, 0.45));
    for (let k = 0; k < 10; k++) { const a = rnd() * 6.283, r = 0.3 + rnd() * 0.7; L.push(strand(rnd, t.p.x + Math.cos(a) * r, t.p.y + 0.1, t.p.z + Math.sin(a) * r, 1.0 + rnd() * 1.2, 0.07)); } }
  return M(B, BM.ice, L, LM.ice);
}
function ancient(rnd: () => number): Made { // 54.5: anciã com oco e musgo, tronco largo, raízes, copa pesada
  const B: THREE.BufferGeometry[] = [], tips: { p: THREE.Vector3; d: THREE.Vector3 }[] = [];
  grow(rnd, B, tips, new THREE.Vector3(0, -0.2, 0), new THREE.Vector3(0, 1, 0), 2.4, 0.78, 3, 0.3, 0.25); roots(rnd, B, 0.78, 7, 1.3);
  const L: THREE.BufferGeometry[] = []; for (const t of tips) if (t.p.y > 2.4) L.push(blob(rnd, t.p.x, t.p.y + 0.3, t.p.z, 1.0 + rnd() * 0.6, 0.65)); L.push(blob(rnd, 0, 5.6, 0, 1.9, 0.6));
  const hollow = new THREE.SphereGeometry(0.34, 7, 6); hollow.scale(1, 1.4, 0.5); hollow.translate(0, 1.2, 1.8); // o oco: uma mancha escura na frente
  return M(B, BM.moss, L, LM.moss, { geo: [hollow], m: new THREE.MeshBasicMaterial({ color: 0x0a0c08 }) });
}
function burnt(rnd: () => number): Made { // 54.7: morta queimada, galhos nus e quebrados
  const B: THREE.BufferGeometry[] = [], tips: { p: THREE.Vector3; d: THREE.Vector3 }[] = [];
  grow(rnd, B, tips, new THREE.Vector3(0, -0.2, 0), new THREE.Vector3((rnd() - 0.5) * 0.5, 1, (rnd() - 0.5) * 0.5), 3.2, 0.32, 3, 0.6, 0.1); return M(B, BM.burnt, [], LM.oak);
}
function fir(rnd: () => number, snow: boolean): Made { // 54.8: abeto em saias de cone, com neve por cima
  const B = [trunk(rnd, 7.4, 0.24, 0.12)]; const L: THREE.BufferGeometry[] = [], S: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 7; i++) { const y = 1.4 + i * 0.95, r = 2.1 * (1 - i / 8.5) + 0.2; const c = new THREE.ConeGeometry(r, 1.5, 7, 1, true); c.translate(0, y + 0.75, 0); c.rotateY(rnd()); L.push(c);
    if (snow) { const s = new THREE.ConeGeometry(r * 0.72, 0.5, 7, 1, true); s.translate(0, y + 1.5, 0); s.rotateY(rnd()); S.push(s); } }
  return M(B, BM.brown, L, LM.fir, snow ? { geo: S, m: LM.snow } : undefined);
}
function twisted(rnd: () => number): Made { // 55.1: retorcida com tufos nas pontas
  const B: THREE.BufferGeometry[] = [], tips: { p: THREE.Vector3; d: THREE.Vector3 }[] = [];
  grow(rnd, B, tips, new THREE.Vector3(0, -0.2, 0), new THREE.Vector3(0.5, 1, 0.2), 2.6, 0.3, 3, 0.7, 0.2); roots(rnd, B, 0.3, 4, 0.6);
  const L: THREE.BufferGeometry[] = []; let k = 0; for (const t of tips) if (t.p.y > 2 && k++ % 2 === 0) L.push(blob(rnd, t.p.x, t.p.y + 0.1, t.p.z, 0.45 + rnd() * 0.3, 0.35)); return M(B, BM.grey, L, LM.oakDark);
}
function cypress(rnd: () => number): Made { // 55.2: cipreste do pântano, base em contrafortes, musgo pendente
  const B = [trunk(rnd, 7.6, 0.3, 0.2)]; for (let k = 0; k < 6; k++) { const a = k / 6 * 6.283 + rnd() * 0.5; const c = new THREE.ConeGeometry(0.16, 1.0 + rnd() * 0.6, 5); c.translate(Math.cos(a) * 0.7, 0.3, Math.sin(a) * 0.7); B.push(c); } roots(rnd, B, 0.3, 6, 0.9);
  const L: THREE.BufferGeometry[] = [], H: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 8; i++) { const y = 3.6 + i * 0.5, a = i * 2.3 + rnd(), r = 1.1 * (1 - i / 11); const x = Math.cos(a) * r, z = Math.sin(a) * r;
    B.push(tube([new THREE.Vector3(0, y, 0), new THREE.Vector3(x, y + 0.1, z)], () => 0.05, 4, 3)); L.push(blob(rnd, x, y + 0.2, z, 0.5 + rnd() * 0.2, 0.45));
    for (let k = 0; k < 3; k++) H.push(strand(rnd, x + (rnd() - 0.5) * 0.5, y + 0.1, z + (rnd() - 0.5) * 0.5, 1.0 + rnd() * 1.2, 0.1)); }
  L.push(blob(rnd, 0, 7.7, 0, 0.55, 0.5)); return M(B, BM.red, L, LM.cypress, { geo: H, m: LM.hang });
}
function acacia(rnd: () => number): Made { // 55.3: acácia de copa chata em guarda-chuva
  const B: THREE.BufferGeometry[] = [], tips: { p: THREE.Vector3; d: THREE.Vector3 }[] = [];
  grow(rnd, B, tips, new THREE.Vector3(0, -0.2, 0), new THREE.Vector3(0.2, 1, 0.1), 3.2, 0.26, 2, 0.4, 0.12);
  const L: THREE.BufferGeometry[] = []; let top = 0; for (const t of tips) top = Math.max(top, t.p.y); let n = 0; for (const t of tips) if (t.p.y > top - 1.2 && n++ < 4) L.push(blob(rnd, t.p.x * 0.7, t.p.y + 0.1, t.p.z * 0.7, 0.75 + rnd() * 0.3, 0.22));
  L.push(blob(rnd, 0, top - 0.15, 0, 1.35, 0.2)); return M(B, BM.brown, L, LM.acacia);
}
function larch(rnd: () => number): Made { // 55.4: lariço dourado, tronco cinza, andares de tufos amarelos
  const B = [trunk(rnd, 7.8, 0.22, 0.15)]; const L: THREE.BufferGeometry[] = []; roots(rnd, B, 0.22, 4, 0.5);
  for (let i = 0; i < 10; i++) { const y = 2.2 + i * 0.55, n = 3, r = 1.3 * (1 - i / 12); for (let k = 0; k < n; k++) { const a = (k / n) * 6.283 + i * 0.9; const q = new THREE.PlaneGeometry(r, 0.42 + rnd() * 0.2); q.translate(r / 2, 0, 0); q.rotateZ(-0.25 - rnd() * 0.3); q.rotateY(-a); q.translate(0, y, 0); L.push(q); } }
  return M(B, BM.grey, L, LM.gold);
}
function baobab(rnd: () => number): Made { // 55.5: baobá de tronco gordo, galhos curtos com tufos redondos
  const B = [tube([new THREE.Vector3(0, -0.2, 0), new THREE.Vector3(0, 1.5, 0), new THREE.Vector3(0, 3.2, 0), new THREE.Vector3(0, 4.3, 0)], (t) => 1.05 * (1 - t * 0.55) + 0.1, 9, 8)]; roots(rnd, B, 1.05, 6, 0.9);
  const L: THREE.BufferGeometry[] = []; for (let k = 0; k < 7; k++) { const a = k / 7 * 6.283 + rnd() * 0.5, r = 0.9 + rnd() * 0.6; const x = Math.cos(a) * r, z = Math.sin(a) * r, y = 4.6 + rnd() * 0.8;
    B.push(tube([new THREE.Vector3(0, 4.0, 0), new THREE.Vector3(x * 0.6, y - 0.2, z * 0.6), new THREE.Vector3(x, y, z)], (t) => 0.2 * (1 - t * 0.6), 5, 4)); L.push(blob(rnd, x, y + 0.25, z, 0.5 + rnd() * 0.2)); }
  return M(B, BM.baobab, L, LM.baobab);
}
function blackRed(rnd: () => number): Made { // 55.6: espinheiro de Corvoscuro — tronco fino e torcido, galhos em espiral, poucas folhas vermelhas pequenas
  const B: THREE.BufferGeometry[] = [], tips: { p: THREE.Vector3; d: THREE.Vector3 }[] = [];
  grow(rnd, B, tips, new THREE.Vector3(0, -0.2, 0), new THREE.Vector3(0.25, 1, 0.05), 2.6, 0.2, 3, 0.9, 0.3); roots(rnd, B, 0.2, 5, 0.7);
  const L: THREE.BufferGeometry[] = []; for (const t of tips) { if (t.p.y < 1.8 || rnd() < 0.45) continue; const n = 1 + (rnd() < 0.4 ? 1 : 0);
    for (let k = 0; k < n; k++) { const q = new THREE.PlaneGeometry(0.22 + rnd() * 0.12, 0.3 + rnd() * 0.14); q.rotateY(rnd() * 3.14); q.rotateX((rnd() - 0.5) * 1.4); q.rotateZ((rnd() - 0.5) * 0.8); q.translate(t.p.x + (rnd() - 0.5) * 0.3, t.p.y + 0.05 + rnd() * 0.2, t.p.z + (rnd() - 0.5) * 0.3); L.push(q); } }
  return M(B, BM.black, L, LM.red);
}
function palm(rnd: () => number): Made { // 55.7: palmeira baixa, tronco anelado, frondes arqueadas
  const B = [tube([new THREE.Vector3(0, -0.2, 0), new THREE.Vector3((rnd() - 0.5) * 0.4, 1.6, (rnd() - 0.5) * 0.4), new THREE.Vector3((rnd() - 0.5) * 0.6, 3.4, (rnd() - 0.5) * 0.6)], (t) => 0.22 * (1 - t * 0.4) + 0.03, 7, 8)];
  const L: THREE.BufferGeometry[] = []; const n = 9; for (let k = 0; k < n; k++) { const a = (k / n) * 6.283 + rnd() * 0.4, len = 2.2 + rnd() * 0.6; const q = new THREE.PlaneGeometry(len, 0.55, 6, 1); const p = q.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) { const t = (p.getX(i) + len / 2) / len; p.setY(i, p.getY(i) * (1 - t * 0.6) + 0.5 * Math.sin(t * 3.14) - t * t * 1.1); } q.translate(len / 2, 0, 0); q.rotateY(-a); q.translate(0, 3.4, 0); L.push(q); }
  for (let k = 0; k < 4; k++) { const q = new THREE.PlaneGeometry(1.2, 0.3); q.translate(0.6, 0, 0); q.rotateZ(0.35); q.rotateY(k * 1.57 + 0.3); q.translate(0, -0.05, 0); L.push(q); } // tufo de folhas no pé
  return M(B, BM.palm, L, LM.palm);
}
function whiteSnow(rnd: () => number): Made { // 55.8: árvore branca nua com neve nos galhos
  const B: THREE.BufferGeometry[] = [], tips: { p: THREE.Vector3; d: THREE.Vector3 }[] = [];
  grow(rnd, B, tips, new THREE.Vector3(0, -0.2, 0), new THREE.Vector3((rnd() - 0.5) * 0.3, 1, (rnd() - 0.5) * 0.3), 3.0, 0.24, 3, 0.4, 0.35);
  const L: THREE.BufferGeometry[] = []; for (const t of tips) if (t.p.y > 2.5 && rnd() < 0.6) L.push(blob(rnd, t.p.x, t.p.y + 0.08, t.p.z, 0.16 + rnd() * 0.1, 0.5)); return M(B, BM.white, L, LM.snow);
}

const BUILD: Record<Species, (rnd: () => number) => Made> = {
  oak: (r) => oak(r, false), pineRed, birchWhite: (r) => birch(r, true), willowIce, ancient, birchYellow: (r) => birch(r, false), burnt, fir: (r) => fir(r, true),
  twisted, cypress, acacia, larch, baobab, blackRed, palm, whiteSnow,
};
/** altura nominal de cada espécie (m) antes da escala, para `height` do prop valer como altura real */
const NOMINAL: Record<Species, number> = { oak: 6.6, pineRed: 8.2, birchWhite: 7.2, willowIce: 5.2, ancient: 7.4, birchYellow: 7.2, burnt: 5.8, fir: 8.6, twisted: 5.0, cypress: 8.4, acacia: 5.0, larch: 8.4, baobab: 5.8, blackRed: 5.6, palm: 4.6, whiteSnow: 5.6 };
const cache = new Map<string, Made>();
function variant(sp: Species, i: number): Made { const key = sp + i; let m = cache.get(key); if (!m) { m = BUILD[sp](mulberry(1000 + i * 7919 + sp.length * 31)); cache.set(key, m); } return m; }

/** cria uma árvore da espécie; `height` em metros; `h` (0..1) escolhe a variante */
/** teto de altura por espécie (a selva e a floresta élfica multiplicam a altura do prop; palmeira e baobá não viram torres) */
const MAXH: Partial<Record<Species, number>> = { palm: 5.5, baobab: 7, acacia: 6.5, twisted: 6.5, willowIce: 6.5, blackRed: 7 };
export function buildSpecies(sp: Species, height: number, h: number): THREE.Group {
  height = Math.min(height, MAXH[sp] ?? 99); const v = variant(sp, Math.floor((h * 977) % 4)); const g = new THREE.Group();
  const bark = new THREE.Mesh(v.bark, v.barkM); bark.castShadow = true; g.add(bark);
  if (v.leaves) { const l = new THREE.Mesh(v.leaves, v.leafM); l.castShadow = true; g.add(l); }
  if (v.extra) g.add(new THREE.Mesh(v.extra.geo, v.extra.m));
  g.scale.setScalar(height / NOMINAL[sp]); return g;
}
