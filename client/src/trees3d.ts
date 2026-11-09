import * as THREE from 'three';
import { gpuTag } from './gpu/tags';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { windify } from './terrain3d';

/** Árvores sombrias e retorcidas (estilo Eitr): troncos nodosos, galhos recortados, folhagem esparsa, pinheiros de saias irregulares. */

function mulberry(a: number) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

const ramp = new THREE.DataTexture(new Uint8Array([40, 40, 40, 255, 105, 105, 105, 255, 175, 175, 175, 255, 255, 255, 255, 255]), 4, 1, THREE.RGBAFormat);
ramp.minFilter = ramp.magFilter = THREE.NearestFilter; ramp.needsUpdate = true;

function barkTexture() {
  const c = document.createElement('canvas'); c.width = 64; c.height = 128;
  const g = c.getContext('2d')!;
  g.fillStyle = '#4a3a2e'; g.fillRect(0, 0, 64, 128);
  for (let i = 0; i < 120; i++) {
    const x = Math.random() * 64, y = Math.random() * 128, l = 10 + Math.random() * 40;
    g.strokeStyle = Math.random() < 0.55 ? 'rgba(15,10,8,.55)' : 'rgba(150,125,95,.28)'; g.lineWidth = 1 + Math.random() * 2;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + (Math.random() - 0.5) * 6, y + l / 2, x + (Math.random() - 0.5) * 4, y + l); g.stroke();
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function leafTexture(hues: string[]) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d')!;
  for (let i = 0; i < 70; i++) {
    const a = Math.random() * 6.28, d = Math.random() * 52;
    const x = 64 + Math.cos(a) * d, y = 64 + Math.sin(a) * d * 0.75;
    g.save(); g.translate(x, y); g.rotate(Math.random() * 6.28);
    g.fillStyle = hues[(Math.random() * hues.length) | 0];
    g.beginPath(); g.ellipse(0, 0, 4 + Math.random() * 5, 2 + Math.random() * 3, 0, 0, 7); g.fill();
    g.restore();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** tubo cônico suave ao longo de uma curva */
function taperedTube(pts: THREE.Vector3[], radiusAt: (t: number) => number, radial = 6, segs = 10): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5);
  const P = curve.getPoints(segs); const fr = curve.computeFrenetFrames(segs, false);
  const pos: number[] = [], nor: number[] = [], uv: number[] = [], idx: number[] = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs, r = radiusAt(t);
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2, nx = Math.cos(a), ny = Math.sin(a);
      const n = new THREE.Vector3().addScaledVector(fr.normals[i], nx).addScaledVector(fr.binormals[i], ny);
      pos.push(P[i].x + n.x * r, P[i].y + n.y * r, P[i].z + n.z * r); nor.push(n.x, n.y, n.z); uv.push(j / radial, t * 2);
    }
  }
  for (let i = 0; i < segs; i++) for (let j = 0; j < radial; j++) { const a = i * (radial + 1) + j, b = a + radial + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); return g;
}

interface Made { bark: THREE.BufferGeometry; leaves: THREE.BufferGeometry | null; }

function grow(rnd: () => number, out: THREE.BufferGeometry[], tips: { p: THREE.Vector3; d: THREE.Vector3 }[],
  start: THREE.Vector3, dir: THREE.Vector3, len: number, r0: number, depth: number, gnarl: number) {
  const n = 5; const pts = [start.clone()]; const d = dir.clone().normalize();
  const side = new THREE.Vector3(rnd() - 0.5, 0, rnd() - 0.5).normalize();
  for (let i = 1; i <= n; i++) {
    const last = pts[pts.length - 1];
    d.addScaledVector(side, (rnd() - 0.5) * gnarl * 1.4).addScaledVector(new THREE.Vector3(rnd() - 0.5, (rnd() - 0.45) * 0.4, rnd() - 0.5), gnarl * 0.5).normalize();
    pts.push(last.clone().addScaledVector(d, len / n));
  }
  out.push(taperedTube(pts, (t) => Math.max(0.012, r0 * (1 - t * 0.88) * (depth === 3 ? 1 + 1.1 * Math.exp(-t * 9) : 1)), depth >= 2 ? 7 : 5, 10));
  tips.push({ p: pts[n].clone(), d: d.clone() });
  if (depth <= 0) return;
  const kids = depth === 3 ? 4 + ((rnd() * 2) | 0) : 2 + ((rnd() * 2) | 0);
  for (let k = 0; k < kids; k++) {
    const at = depth === 3 ? 2 + ((k * 3 / kids) | 0) : 1 + ((rnd() * 4) | 0);
    const base = pts[Math.min(n, at)];
    const ang = rnd() * Math.PI * 2, spread = 0.7 + rnd() * 0.6;
    const nd = d.clone().multiplyScalar(0.55).add(new THREE.Vector3(Math.cos(ang) * spread, 0.18 + rnd() * 0.35, Math.sin(ang) * spread)).normalize();
    grow(rnd, out, tips, base, nd, len * (0.62 + rnd() * 0.15), r0 * (0.5 - depth * 0.04), depth - 1, gnarl);
  }
}

function makeTwisted(seed: number, dead: boolean): Made {
  const rnd = mulberry(seed);
  const out: THREE.BufferGeometry[] = []; const tips: { p: THREE.Vector3; d: THREE.Vector3 }[] = [];
  const lean = new THREE.Vector3((rnd() - 0.5) * 0.5, 1, (rnd() - 0.5) * 0.5);
  grow(rnd, out, tips, new THREE.Vector3(0, -0.2, 0), lean, dead ? 3.4 : 3.0, dead ? 0.34 : 0.4, 3, dead ? 0.55 : 0.45);
  const bark = mergeGeometries(out, false)!;
  let leaves: THREE.BufferGeometry | null = null;
  if (!dead) {
    const cards: THREE.BufferGeometry[] = [];
    for (const t of tips) {
      if (t.p.y < 3) continue;
      for (let k = 0; k < 2; k++) {
        const q = new THREE.PlaneGeometry(1.5 + rnd() * 0.8, 1.2 + rnd() * 0.6);
        q.rotateY(rnd() * 3.14); q.rotateX((rnd() - 0.5) * 1.1); q.rotateZ((rnd() - 0.5) * 0.8);
        q.translate(t.p.x + (rnd() - 0.5) * 0.5, t.p.y + (rnd() - 0.3) * 0.5, t.p.z + (rnd() - 0.5) * 0.5);
        cards.push(q);
      }
    }
    if (cards.length) leaves = mergeGeometries(cards, false);
  }
  return { bark, leaves };
}

function makePine(seed: number): Made {
  const rnd = mulberry(seed);
  const trunk = taperedTube([new THREE.Vector3(0, -0.2, 0), new THREE.Vector3((rnd() - 0.5) * 0.3, 2, (rnd() - 0.5) * 0.3), new THREE.Vector3((rnd() - 0.5) * 0.4, 4.2, (rnd() - 0.5) * 0.4), new THREE.Vector3((rnd() - 0.5) * 0.3, 7.2, (rnd() - 0.5) * 0.3)], (t) => 0.3 * (1 - t * 0.85) + 0.03, 7, 10);
  const cards: THREE.BufferGeometry[] = [];
  const layers = 8;
  for (let i = 0; i < layers; i++) {
    const y = 2.1 + i * 0.62, r = 1.9 * (1 - i / (layers + 1.5)) + 0.25;
    const n = 7; // saia irregular: lâminas caídas
    for (let k = 0; k < n; k++) {
      const a = (k / n) * 6.283 + rnd() * 0.7 + i;
      const len = r * (0.85 + rnd() * 0.5);
      const q = new THREE.PlaneGeometry(len, 0.55 + rnd() * 0.3, 1, 1);
      q.translate(len / 2, 0, 0); q.rotateZ(-0.55 - rnd() * 0.3); // cai para fora
      q.rotateY(-a); q.translate(0, y, 0);
      cards.push(q);
      const q2 = q.clone(); q2.rotateY(0.08); cards.push(q2);
    }
  }
  return { bark: trunk, leaves: mergeGeometries(cards, false) };
}

const barkMat = new THREE.MeshToonMaterial({ map: barkTexture(), color: 0xffffff, gradientMap: ramp });
const inkHull = new THREE.MeshBasicMaterial({ color: 0x07060c, side: THREE.BackSide });
gpuTag(inkHull, 'hull', 0.045); inkHull.onBeforeCompile = (sh) => { sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n transformed += normal * 0.045;'); };
const leafMats = [
  windify(new THREE.MeshToonMaterial({ map: leafTexture(['#355a2e', '#2a4a28', '#4a6a30']), alphaTest: 0.5, side: THREE.DoubleSide, gradientMap: ramp }), 0.07, 1.2),
  windify(new THREE.MeshToonMaterial({ map: leafTexture(['#6a4a22', '#8a5a26', '#3a4a26']), alphaTest: 0.5, side: THREE.DoubleSide, gradientMap: ramp }), 0.07, 1.2),
];
const pineMat = windify(new THREE.MeshToonMaterial({ map: leafTexture(['#1d3a30', '#244a3a', '#15302a']), alphaTest: 0.5, side: THREE.DoubleSide, gradientMap: ramp }), 0.04, 1.0);

type Kind = 'oak' | 'dead' | 'pine';
const cache = new Map<string, Made>();
function variant(kind: Kind, i: number): Made {
  const key = kind + i;
  let m = cache.get(key);
  if (!m) { m = kind === 'pine' ? makePine(100 + i) : makeTwisted((kind === 'dead' ? 500 : 900) + i * 7, kind === 'dead'); cache.set(key, m); }
  return m;
}

/** cria uma árvore; `height` em metros (4,5–7,5); `h` decide o tipo/variante de forma determinística */
export function buildTree(height: number, h: number): { obj: THREE.Group; kind: Kind } {
  const kind: Kind = h < 0.34 ? 'oak' : h < 0.68 ? 'dead' : 'pine';
  const v = variant(kind, Math.floor((h * 977) % 4));
  const g = new THREE.Group();
  const bark = new THREE.Mesh(v.bark, barkMat); bark.castShadow = true;
  const hull = new THREE.Mesh(v.bark, inkHull);
  void hull;
  g.add(bark);
  if (v.leaves) {
    const lm = kind === 'pine' ? pineMat : leafMats[h > 0.17 ? 0 : 1];
    const l = new THREE.Mesh(v.leaves, lm); l.castShadow = true; g.add(l);
  }
  g.scale.setScalar(height / 7);
  return { obj: g, kind };
}


/* 08/11 A ÁRVORE-MÃE DE LITHENDEL: a árvore viva, imensa, no meio da vila dos elfos. Tronco retorcido (o mesmo gerador, 5× maior),
   copa de cartões de folha em dois tons (verde-prata e verde-dourado), plataformas de madeira em volta do tronco com guarda-corpo de
   galho, escada em espiral de degraus de madeira, lanternas penduradas. Devolve o grupo e os pontos das lanternas (para o fogo e a luz). */
const elfLeafMat = windify(new THREE.MeshToonMaterial({ map: leafTexture(['#6fa66a', '#a8c870', '#4f8a5c', '#d6c46a']), alphaTest: 0.5, side: THREE.DoubleSide, gradientMap: ramp }), 0.05, 1.0);
export function buildGreatTree(scale = 4.6): { obj: THREE.Group; lanterns: THREE.Vector3[]; platforms: { y: number; r: number }[] } {
  const g = new THREE.Group(), rnd = mulberry(4242); const lanterns: THREE.Vector3[] = [];
  const out: THREE.BufferGeometry[] = []; const tips: { p: THREE.Vector3; d: THREE.Vector3 }[] = [];
  grow(rnd, out, tips, new THREE.Vector3(0, -0.3, 0), new THREE.Vector3(0.05, 1, 0.02), 3.6, 0.5, 3, 0.4);
  const bark = new THREE.Mesh(mergeGeometries(out, false)!, barkMat); bark.castShadow = bark.receiveShadow = true; bark.scale.setScalar(scale); g.add(bark);
  /* raízes largas na base */
  for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2 + rnd() * 0.3, L = (2.2 + rnd() * 1.6) * scale * 0.5; const root = new THREE.Mesh(new THREE.ConeGeometry(0.45 * scale * 0.5, L, 6), barkMat); root.position.set(Math.cos(a) * L * 0.45, 0.25, Math.sin(a) * L * 0.45); root.rotation.z = Math.PI / 2 + 0.25; root.rotation.y = -a; root.castShadow = true; g.add(root); }
  /* copa: cartões maiores nos galhos, em dois tons */
  const cards: THREE.BufferGeometry[] = [];
  for (const t of tips) { if (t.p.y < 2.6) continue; for (let k = 0; k < 3; k++) { const q = new THREE.PlaneGeometry(2.0 + rnd() * 1.2, 1.5 + rnd() * 0.9); q.rotateY(rnd() * 3.14); q.rotateX((rnd() - 0.5) * 1.2); q.rotateZ((rnd() - 0.5) * 0.9); q.translate(t.p.x + (rnd() - 0.5) * 0.9, t.p.y + (rnd() - 0.2) * 0.8, t.p.z + (rnd() - 0.5) * 0.9); cards.push(q); } }
  const leaves = new THREE.Mesh(mergeGeometries(cards, false)!, elfLeafMat); leaves.scale.setScalar(scale); leaves.castShadow = true; g.add(leaves);
  /* plataformas e escada em espiral */
  const wood = new THREE.MeshToonMaterial({ color: 0xb8a070, gradientMap: ramp }), rail = new THREE.MeshToonMaterial({ color: 0x7a6a48, gradientMap: ramp });
  const platforms = [{ y: 2.1 * scale * 0.5, r: 0.5 * scale + 2.2 }, { y: 3.4 * scale * 0.5, r: 0.42 * scale + 1.8 }];
  for (const pf of platforms) { const ring = new THREE.Mesh(new THREE.RingGeometry(pf.r - 2.0, pf.r, 18, 1).rotateX(-Math.PI / 2), wood); ring.position.y = pf.y; ring.receiveShadow = true; g.add(ring);
    const under = new THREE.Mesh(new THREE.RingGeometry(pf.r - 2.0, pf.r, 18, 1).rotateX(Math.PI / 2), rail); under.position.y = pf.y - 0.12; g.add(under);
    for (let k = 0; k < 18; k++) { const a = k / 18 * Math.PI * 2; const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 1.0, 5), rail); post.position.set(Math.cos(a) * (pf.r - 0.15), pf.y + 0.5, Math.sin(a) * (pf.r - 0.15)); g.add(post);
      if (k % 3 === 0) lanterns.push(new THREE.Vector3(Math.cos(a) * (pf.r + 0.3), pf.y + 1.15, Math.sin(a) * (pf.r + 0.3))); }
    const hand = new THREE.Mesh(new THREE.TorusGeometry(pf.r - 0.15, 0.05, 5, 36), rail); hand.rotation.x = Math.PI / 2; hand.position.y = pf.y + 1.0; g.add(hand);
    for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2 + 0.3; const brace = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, pf.y * 0.55, 5), rail); brace.position.set(Math.cos(a) * (pf.r - 1.0), pf.y - pf.y * 0.27, Math.sin(a) * (pf.r - 1.0)); brace.rotation.z = Math.cos(a) * 0.5; brace.rotation.x = -Math.sin(a) * 0.5; g.add(brace); } }
  { const steps = 34, r = 0.5 * scale + 0.9, y1 = platforms[0].y; for (let k = 0; k < steps; k++) { const a = -0.4 + k / steps * Math.PI * 1.6, y = 0.3 + (y1 - 0.3) * k / steps; const st = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.12, 0.42), wood); st.position.set(Math.cos(a) * r, y, Math.sin(a) * r); st.rotation.y = -a; st.castShadow = true; g.add(st); } }
  return { obj: g, lanterns, platforms };
}
