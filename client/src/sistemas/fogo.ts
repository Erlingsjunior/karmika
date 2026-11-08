/* 08/11 O SISTEMA DE FOGO (Erling: "tochas de fogo e fogueiras decorativas… um sistema de fogo legal, como as folhas que criamos para as árvores,
   em vários formatos e cores de fogo, tremulando, com faíscas e luz").
   Antes: um cone sólido amarelo. Agora: cartões de chama desenhados em pixel (como as folhas das copas), virados para a câmera,
   com 8 quadros de animação e 3 formatos (língua, bifurcada, cheia). Cada cor de fogo é UM material só — o quadro anda pelo
   deslocamento da textura, uma vez por quadro de jogo, então mil tochas custam o mesmo que uma para animar.
   Faíscas e luz: as tochas do mundo já soltam brasas e acendem a luz (main.ts); fogueira, braseiro e forja ganham ainda um halo. */
import * as THREE from 'three';

export type FirePal = 'warm' | 'red' | 'blue' | 'green' | 'violet' | 'candle' | 'forge';
export type FireKind = 'torch' | 'candle' | 'brazier' | 'camp' | 'forge';

const FR = 8, ROWS = 3, FW = 48, FH = 96; // quadros, formatos, tamanho de um quadro
/** do miolo para a borda: branco-quente → borda escura */
const RAMP: Record<FirePal, number[]> = {
  warm: [0xfff6c8, 0xffdc5a, 0xffa22a, 0xff5c12, 0xb0260a],
  forge: [0xfffbe8, 0xffe880, 0xffb43a, 0xff6a14, 0xc42a06],
  candle: [0xfffff0, 0xfff2a8, 0xffc85a, 0xff8a24, 0xa8381a],
  red: [0xffe2c0, 0xff9a5a, 0xff4a22, 0xd0180a, 0x6e0606],
  blue: [0xf0fbff, 0xa6e4ff, 0x46a8ff, 0x2458e0, 0x101c8a],
  green: [0xf0ffe0, 0xb6ff84, 0x52e050, 0x1ea044, 0x0a5022],
  violet: [0xfff0ff, 0xe4a6ff, 0xb456ff, 0x7022d0, 0x320a80],
};

/* ---------- a textura: 8 quadros × 3 formatos, ciclo fechado (o quadro 8 emenda no 1) ---------- */
function drawAtlas(pal: FirePal) {
  const W = FW * FR, H = FH * ROWS, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const cx = cv.getContext('2d')!, img = cx.createImageData(W, H), px = img.data, R = RAMP[pal].map((c) => [(c >> 16) & 255, (c >> 8) & 255, c & 255]);
  for (let row = 0; row < ROWS; row++) for (let f = 0; f < FR; f++) {
    const ph = (f / FR) * Math.PI * 2;
    for (let j = 1; j < FH - 1; j++) for (let i = 1; i < FW - 1; i++) {
      const u = (i + 0.5) / FW - 0.5, v = 1 - (j + 0.5) / FH; // v = 0 na base, 1 no topo
      const vv = (v - 0.04) / 0.94; if (vv <= 0) continue;
      /* o corpo balança: uma onda longa que sobe e uma curta por cima */
      const sway = 0.1 * vv ** 1.4 * Math.sin(5.5 * vv - ph + row) + 0.045 * vv * Math.sin(12 * vv - 2 * ph + row * 2.3);
      const x = u - sway;
      const body = Math.min(1, 0.5 + vv * 3.2);
      let dd: number;
      if (row === 0) { const w = 0.3 * (1 - vv) ** 0.78 * body; dd = 1 - Math.abs(x) / w; } // língua
      else if (row === 1) { // bifurcada: duas pontas que se abrem para cima, juntas na base
        const sp = 0.13 * Math.max(0, vv - 0.25) / 0.75, w1 = 0.2 * (1 - vv) ** 0.8 * body, wb = 0.32 * (1 - vv) ** 0.9 * body;
        const a = 1 - Math.abs(x - sp) / w1, b = 1 - Math.abs(x + sp * 0.8 - 0.01 * Math.sin(ph)) / (w1 * 0.86), base = vv < 0.4 ? 1 - Math.abs(x) / wb - (vv / 0.4) * 0.6 : -1;
        dd = Math.max(a, b * (1 - 0.15 * vv), base);
      } else { const w = 0.4 * (1 - vv) ** 0.95 * body; dd = 1 - Math.abs(x) / w; } // cheia
      /* lambidas: ruído fechado no ciclo, mais forte em cima (é onde a chama se rasga) */
      const n = Math.sin(u * 19 + vv * 7 - 2 * ph + row) * Math.sin(vv * 21 - 3 * ph + u * 6) + 0.5 * Math.sin(u * 37 - vv * 15 + ph * 4 + row * 1.7);
      dd += n * (row === 2 ? 0.3 : 0.22) * vv;
      if (dd <= 0) continue;
      const heat = dd * (1 - 0.42 * vv) + (vv < 0.25 ? (0.25 - vv) * 0.6 : 0);
      /* em degraus, como pixel art: 5 faixas de cor, sem degradê */
      const band = heat > 0.66 ? 0 : heat > 0.46 ? 1 : heat > 0.28 ? 2 : heat > 0.13 ? 3 : 4, c = R[band];
      const o = ((row * FH + j) * W + f * FW + i) * 4;
      px[o] = c[0]; px[o + 1] = c[1]; px[o + 2] = c[2]; px[o + 3] = band === 4 ? 150 : 255;
    }
  }
  cx.putImageData(img, 0, 0);
  const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; tx.wrapS = THREE.RepeatWrapping; tx.magFilter = THREE.NearestFilter; tx.minFilter = THREE.LinearFilter; tx.generateMipmaps = false;
  return tx;
}

const mats = new Map<FirePal, THREE.MeshBasicMaterial>();
function matOf(pal: FirePal) {
  let m = mats.get(pal); if (m) return m;
  m = new THREE.MeshBasicMaterial({ map: drawAtlas(pal), transparent: true, alphaTest: 0.05, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, fog: false });
  m.userData.fireMat = true; mats.set(pal, m); return m;
}
let haloT: THREE.Texture | null = null;
function haloTex() {
  if (haloT) return haloT; const cv = document.createElement('canvas'); cv.width = cv.height = 64; const c = cv.getContext('2d')!, g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(0.35, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 64);
  haloT = new THREE.CanvasTexture(cv); return haloT;
}

/** a cor antiga (número) vira uma paleta de fogo */
export function palOf(col?: number): FirePal {
  if (col === undefined) return 'warm';
  const h = { h: 0, s: 0, l: 0 }; new THREE.Color(col).getHSL(h);
  if (h.s < 0.25) return 'candle';
  if (h.h < 0.035 || h.h > 0.95) return 'red';
  if (h.h < 0.17) return h.l > 0.7 ? 'candle' : 'warm';
  if (h.h < 0.47) return 'green';
  if (h.h < 0.72) return 'blue';
  return 'violet';
}

/** um quadrado de chama: largura w, altura h, centro x, profundidade z, formato e quadro inicial */
function quad(pos: number[], uv: number[], idx: number[], x: number, z: number, w: number, h: number, row: number, col: number) {
  const b = pos.length / 3, u0 = col / FR + 0.5 / (FW * FR), u1 = (col + 1) / FR - 0.5 / (FW * FR), v0 = 1 - (row + 1) / ROWS, v1 = 1 - row / ROWS;
  pos.push(x - w / 2, 0, z, x + w / 2, 0, z, x + w / 2, h, z, x - w / 2, h, z);
  uv.push(u0, v0, u1, v0, u1, v1, u0, v1);
  idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
}

const registry = new Set<WeakRef<THREE.Object3D>>();
const noRay = () => {};

/** Cria uma chama. A origem é a BASE da chama (onde está o pavio/a lenha). s ≈ altura em metros. */
export function makeFire(s = 0.5, col: number | FirePal = 'warm', kind: FireKind = 'torch', seed = Math.random() * 1000): THREE.Mesh {
  const pal = typeof col === 'number' ? palOf(col) : col;
  let k = (seed * 9301 + 49297) % 233280; const rnd = () => (k = (k * 9301 + 49297) % 233280) / 233280;
  const pos: number[] = [], uv: number[] = [], idx: number[] = [], H = s * 1.25, Wd = H * (FW / FH) * 1.05;
  if (kind === 'torch' || kind === 'candle') {
    quad(pos, uv, idx, 0, 0, Wd, H, Math.floor(rnd() * ROWS), Math.floor(rnd() * FR));
    if (kind === 'torch') quad(pos, uv, idx, 0.02 * s, 0.02, Wd * 0.62, H * 0.66, 0, Math.floor(rnd() * FR)); // a língua de dentro, defasada
  } else {
    const n = kind === 'forge' ? 6 : kind === 'brazier' ? 4 : 5, spread = kind === 'forge' ? 0.55 : 0.36;
    for (let i = 0; i < n; i++) { const a = (i / (n - 1) - 0.5) * 2, hh = H * (0.55 + 0.45 * (1 - Math.abs(a)) ) * (0.85 + rnd() * 0.3); quad(pos, uv, idx, a * spread * s + (rnd() - 0.5) * 0.08 * s, (rnd() - 0.5) * 0.06 - Math.abs(a) * 0.02, Wd * (0.75 + rnd() * 0.3), hh, Math.floor(rnd() * ROWS), Math.floor(rnd() * FR)); }
    quad(pos, uv, idx, 0, 0.04, Wd * 1.25, H * 1.05, 2, Math.floor(rnd() * FR)); // o corpo do meio, cheio
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx);
  const m = new THREE.Mesh(geo, matOf(pal)); m.userData.dyn = true; m.userData.fire = { seed: rnd() * 50, kind }; m.raycast = noRay; m.renderOrder = 3; m.frustumCulled = true;
  if (kind !== 'torch' && kind !== 'candle') {
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex(), color: RAMP[pal][2], transparent: true, opacity: 0.32, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    halo.scale.setScalar(H * 2.2); halo.position.y = H * 0.45; halo.raycast = noRay; halo.userData.dyn = true; m.add(halo);
  }
  registry.add(new WeakRef(m));
  return m;
}

/* ---------- a cada quadro: o atlas anda, as chamas viram para a câmera e tremulam ---------- */
const _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _e = new THREE.Euler(), _d = new THREE.Vector3();
function inScene(o: THREE.Object3D) { let q: THREE.Object3D | null = o; while (q.parent) q = q.parent; return (q as THREE.Scene).isScene === true; }
let lastFrame = -1;
export function tickFire(t: number, camera: THREE.Camera, near: THREE.Vector3) {
  const fr = Math.floor(t * 11) % FR; if (fr !== lastFrame) { lastFrame = fr; for (const m of mats.values()) m.map!.offset.x = fr / FR; }
  camera.getWorldDirection(_d); const camYaw = Math.atan2(-_d.x, -_d.z);
  for (const ref of registry) {
    const o = ref.deref(); if (!o) { registry.delete(ref); continue; }
    const ud = o.userData as { fire: { seed: number; kind: FireKind }; wp?: THREE.Vector3; py?: number };
    if (!ud.wp) { if (!inScene(o)) continue; o.updateWorldMatrix(true, false); o.getWorldPosition(_p); ud.wp = _p.clone(); o.parent!.getWorldQuaternion(_q); _e.setFromQuaternion(_q, 'YXZ'); ud.py = _e.y; }
    const dx = ud.wp.x - near.x, dz = ud.wp.z - near.z; if (dx * dx + dz * dz > 70 * 70) continue;
    const sd = ud.fire.seed, fk = 0.5 + 0.5 * Math.sin(t * 8.5 + sd) * Math.sin(t * 3.3 + sd * 2.1);
    o.rotation.y = camYaw - (ud.py ?? 0);
    const base = (o.userData.baseS as number | undefined) ?? 1;
    o.scale.set(base * (0.94 + fk * 0.1), base * (0.88 + fk * 0.22 + 0.04 * Math.sin(t * 17 + sd)), base);
    if (!o.matrixAutoUpdate) o.updateMatrix();
  }
}
