import * as THREE from 'three';

export const OUTLINES = false; // sem contorno: os pixels definem as formas (estilo Eitr)
export const ramp = new THREE.DataTexture(new Uint8Array([60, 60, 60, 255, 130, 130, 130, 255, 200, 200, 200, 255, 255, 255, 255, 255]), 4, 1, THREE.RGBAFormat);
ramp.minFilter = ramp.magFilter = THREE.NearestFilter; ramp.needsUpdate = true;
export const std = (color: number, extra: THREE.MeshToonMaterialParameters = {}) => new THREE.MeshToonMaterial({ color, gradientMap: ramp, ...extra });
export const inkMat = new THREE.MeshBasicMaterial({ color: 0x07060c, side: THREE.BackSide });
export function ink(m: THREE.Mesh, w = 0.07) {
  if (!OUTLINES) return m; void w;
  m.geometry.computeBoundingSphere();
  const r = m.geometry.boundingSphere!.radius || 1;
  const o = new THREE.Mesh(m.geometry, inkMat); o.scale.setScalar(1 + w / r); m.add(o); return m;
}

const texCache = new Map<string, THREE.CanvasTexture>();
function tex(key: string, size: number, draw: (g: CanvasRenderingContext2D, s: number) => void) {
  let t = texCache.get(key); if (t) return t;
  const c = document.createElement('canvas'); c.width = c.height = size; draw(c.getContext('2d')!, size);
  t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = t.minFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace;
  texCache.set(key, t); return t;
}
const rr = (a: number, b: number) => a + Math.random() * (b - a);
const sh = (c: number, k: number) => `rgb(${Math.min(255, ((c >> 16) & 255) * k) | 0},${Math.min(255, ((c >> 8) & 255) * k) | 0},${Math.min(255, (c & 255) * k) | 0})`;
/** tábuas verticais */
export const plankTex = (c: number) => tex('pl' + c, 64, (g, s) => { for (let i = 0; i < 8; i++) { g.fillStyle = sh(c, rr(0.75, 1.1)); g.fillRect(i * s / 8, 0, s / 8, s); g.fillStyle = 'rgba(10,6,4,.55)'; g.fillRect(i * s / 8, 0, 1.5, s); } for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(20,12,6,.25)'; g.fillRect(rr(0, s), rr(0, s), 1, rr(3, 9)); } });
/** pedra aparelhada */
export const stoneTex = (c: number) => tex('st' + c, 64, (g, s) => { g.fillStyle = sh(c, 0.7); g.fillRect(0, 0, s, s); for (let y = 0; y < 4; y++) { let x = -rr(0, 10); while (x < s) { const w = rr(12, 22); g.fillStyle = sh(c, rr(0.8, 1.2)); g.fillRect(x + 1, y * 16 + 1, w - 2, 14); x += w; } } });
/** reboco com enxaimel */
export const plasterTex = (c: number) => tex('pa' + c, 64, (g, s) => { g.fillStyle = sh(c, 1); g.fillRect(0, 0, s, s); for (let i = 0; i < 60; i++) { g.fillStyle = sh(c, rr(0.85, 1.05)); g.fillRect(rr(0, s), rr(0, s), rr(2, 6), rr(2, 5)); } g.fillStyle = '#3a2a1c'; g.fillRect(0, 0, s, 5); g.fillRect(0, s - 5, s, 5); g.fillRect(0, 0, 5, s); g.fillRect(s - 5, 0, 5, s); g.fillRect(s / 2 - 2, 0, 4, s); });
/** telhas / sapê */
export const shingleTex = (c: number) => tex('sh' + c, 64, (g, s) => { for (let y = 0; y < 8; y++) for (let x = -1; x < 6; x++) { g.fillStyle = sh(c, rr(0.75, 1.15)); g.fillRect(x * s / 5 + (y % 2) * s / 10, y * s / 8, s / 5 - 1, s / 8 - 1); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x * s / 5 + (y % 2) * s / 10, y * s / 8 + s / 8 - 2, s / 5, 2); } });
export const woodTex = (c: number) => tex('wd' + c, 32, (g, s) => { g.fillStyle = sh(c, 1); g.fillRect(0, 0, s, s); for (let i = 0; i < 14; i++) { g.fillStyle = sh(c, rr(0.7, 1.2)); g.fillRect(0, rr(0, s), s, 1); } });

export function scaleUV(geo: THREE.BufferGeometry, su: number, sv: number) {
  const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv);
  return geo;
}
/** caixa com textura repetindo em escala de mundo (1 repetição a cada `m` metros) */
export function texBox(w: number, h: number, d: number, m = 2) {
  const g = new THREE.BoxGeometry(w, h, d); const uv = g.attributes.uv;
  const dims: [number, number][] = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) { const k = f * 4 + i; uv.setXY(k, uv.getX(k) * dims[f][0] / m, uv.getY(k) * dims[f][1] / m); }
  return g;
}

/**
 * Telhado de duas águas de verdade: duas lajes inclinadas com beiral + empena triangular nas pontas + cumeeira.
 * Cumeeira ao longo de x (se alongX) ou de z. Origem no centro da base do telhado (altura da parede).
 */
export function gableRoof(w: number, d: number, h: number, over: number, roofC: number, wallC: number, alongX = true): THREE.Group {
  const g = new THREE.Group();
  const span = alongX ? d : w, len = alongX ? w : d; // span = largura que o telhado cobre; len = comprimento da cumeeira
  const a = Math.atan2(h, span / 2), L = (span / 2 + over) / Math.cos(a), T = 0.16;
  const rm = std(0xffffff, { map: shingleTex(roofC) }), tmat = rm;
  const slabG = () => { const sg = new THREE.BoxGeometry(L, T, len + over * 2); return scaleUV(sg, L / 1.6, (len + over * 2) / 1.6); };
  const roof = new THREE.Group();
  for (const s of [-1, 1]) {
    const piv = new THREE.Group(); piv.position.set(0, h + 0.04, 0); piv.rotation.z = s * -a;
    const m = new THREE.Mesh(slabG(), tmat); ink(m, 0.04); m.position.x = s * L / 2; m.castShadow = true; piv.add(m);
    // beiral: tábua de fachada mais escura
    const fas = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.22, len + over * 2 + 0.04), std(0x2a1b12)); fas.position.set(s * L, -0.04, 0); piv.add(fas);
    roof.add(piv);
  }
  const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.2, len + over * 2 + 0.1), std(0x2a1b12)); ridge.position.set(0, h + 0.14, 0); roof.add(ridge);
  // empenas
  const tri = new THREE.Shape(); tri.moveTo(-span / 2, 0); tri.lineTo(span / 2, 0); tri.lineTo(0, h); tri.closePath();
  const tg = new THREE.ExtrudeGeometry(tri, { depth: 0.22, bevelEnabled: false });
  for (const s of [-1, 1]) { const m = new THREE.Mesh(tg, std(wallC, { map: plankTex(wallC) })); ink(m, 0.03); m.position.z = s * (len / 2 - 0.12) - 0.11 * (s > 0 ? 0 : -0); m.position.z = s * (len / 2) - (s > 0 ? 0.2 : 0.02); roof.add(m); }
  if (alongX) { roof.rotation.y = Math.PI / 2; roof.rotation.y = 0; }
  // por padrão cumeeira ao longo de z; se alongX giramos 90°
  const wrap = new THREE.Group(); wrap.add(roof); wrap.rotation.y = alongX ? Math.PI / 2 : 0; g.add(wrap);
  return g;
}
