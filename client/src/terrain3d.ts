import * as THREE from 'three';
import { TILE_M as T, type Tile } from '@karmika/shared';
import type { Prop } from './world';

/** tempo compartilhado do vento (atualizado no main) */
export const windU = { value: 0 };
export const gustU = { value: 0.5 };
/** onde o herói está (x, z) e quanto se mexe: o capim se abre quando ele passa (atualizado no main) */
export const heroU = { value: new THREE.Vector3(0, 0, 0) };

/** faz o material balançar com o vento (base presa no chão, topo se move) */
export function windify(m: THREE.Material, amp = 0.12, freq = 1.6, o: { hero?: boolean } = {}) {
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uWind = windU; sh.uniforms.uGust = gustU; sh.uniforms.uHero = heroU;
    sh.vertexShader = 'uniform float uWind; uniform float uGust; uniform vec3 uHero;\n' + sh.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
       #ifdef USE_INSTANCING
         vec3 ip = vec3(instanceMatrix[3].x, 0.0, instanceMatrix[3].z);
       #else
         vec3 ip = vec3(0.0);
       #endif
       float hy = max(position.y, 0.0);
       /* onda que viaja no campo (rajada passando) + balanço miúdo por touceira */
       float sw = sin(uWind * ${freq.toFixed(2)} + ip.x * 0.6 + ip.z * 0.45) + 0.5 * sin(uWind * ${(freq * 2.3).toFixed(2)} + ip.x * 1.3) + 0.6 * sin(uWind * 1.1 - (ip.x + ip.z) * 0.18);
       float gm = 0.5 + uGust * 1.4;
       transformed.x += sw * gm * ${amp.toFixed(3)} * hy * hy;
       transformed.z += sw * gm * ${(amp * 0.6).toFixed(3)} * hy * hy;
       ${o.hero ? `/* o herói passando: o capim se abre para os lados e deita um pouco (Erling, 26/10) */
       { vec2 dh = ip.xz - uHero.xz; float dd = length(dh); float k = smoothstep(1.35, 0.15, dd); if (k > 0.001) { vec2 push = (dd > 0.001 ? dh / dd : vec2(1.0, 0.0)) * k * 0.55 * hy; transformed.x += push.x; transformed.z += push.y; transformed.y -= k * 0.45 * hy; } }` : ''}`);
  };
  return m;
}

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const hex = (n: number) => '#' + n.toString(16).padStart(6, '0');
const shade = (n: number, k: number) => {
  const r = Math.min(255, ((n >> 16) & 255) * k), g = Math.min(255, ((n >> 8) & 255) * k), b = Math.min(255, (n & 255) * k);
  return `rgb(${r | 0},${g | 0},${b | 0})`;
};

const COL = { grass: 0x2f5a35, road: 0x8a6d49, plaza: 0x8d8f9c, water: 0x14405f, mud: 0x3a3226 };

/** chão pintado à mão (canvas) em um único plano: bordas orgânicas, sem quadrados */
export function buildGround(map: Tile[][], props: Prop[]) {
  const H = map.length, W = map[0].length;
  const PPM = 28; // pixels por metro
  const cw = W * T * PPM, ch = H * T * PPM;
  const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
  const g = cv.getContext('2d')!;
  const TP = T * PPM;
  const at = (x: number, y: number): Tile => (map[y] && map[y][x]) || 'grass';

  g.fillStyle = hex(COL.grass); g.fillRect(0, 0, cw, ch);
  const blob = (cx: number, cy: number, r: number, c: number, a: number) => {
    const gr = g.createRadialGradient(cx, cy, r * 0.2, cx, cy, r);
    gr.addColorStop(0, shade(c, 1).replace('rgb', 'rgba').replace(')', `,${a})`));
    gr.addColorStop(1, shade(c, 1).replace('rgb', 'rgba').replace(')', ',0)'));
    g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill();
  };
  // grama: manchas de tons variados
  for (let i = 0; i < W * H * 5; i++) blob(rnd(0, cw), rnd(0, ch), rnd(TP * 0.3, TP * 1.0), [0x264d2e, 0x3a6a3c, 0x2b5030, 0x4a6e3a, 0x1f4128][i % 5], 0.35);
  // terra batida / praça / lama da margem: blobs que vazam além do tile
  const paint = (t: Tile, c: number, spread: number, n: number) => {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (at(x, y) !== t) continue;
      for (let k = 0; k < n; k++) blob((x + rnd(-0.1, 1.1)) * TP, (y + rnd(-0.1, 1.1)) * TP, TP * rnd(0.5, spread), c, 0.9);
    }
  };
  paint('water', COL.mud, 1.5, 3);
  paint('road', COL.road, 0.95, 4);
  paint('plaza', COL.plaza, 0.8, 3);
  // variação de cor na terra
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (at(x, y) === 'road')
    for (let k = 0; k < 6; k++) blob((x + rnd(0, 1)) * TP, (y + rnd(0, 1)) * TP, TP * rnd(0.2, 0.5), [0x6f5638, 0x9c7e56, 0x7a5f3f][k % 3], 0.5);
  // pedras da praça: paralelepípedos irregulares com junta escura
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (at(x, y) === 'plaza') {
    const n = 5;
    for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) {
      const px = (x + (a + rnd(0.05, 0.2)) / n) * TP, py = (y + (b + rnd(0.05, 0.2)) / n) * TP, s = TP / n * rnd(0.7, 0.95);
      g.fillStyle = shade(COL.plaza, rnd(0.78, 1.15)); g.strokeStyle = 'rgba(30,28,40,0.55)'; g.lineWidth = 1.5;
      g.beginPath(); if (g.roundRect) g.roundRect(px, py, s, s, 4); else g.rect(px, py, s, s); g.fill(); g.stroke();
    }
  }
  // água (fundo) com borda suave
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (at(x, y) === 'water')
    for (let k = 0; k < 3; k++) blob((x + 0.5) * TP, (y + 0.5) * TP, TP * 0.85, COL.water, 0.95);
  // pontes/estrada sobre a água: refaz a terra por cima
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (at(x, y) === 'road' && (at(x, y - 1) === 'water' || at(x, y + 1) === 'water'))
    for (let k = 0; k < 4; k++) blob((x + rnd(0.2, 0.8)) * TP, (y + rnd(0.2, 0.8)) * TP, TP * 0.7, COL.road, 1);
  // traços de grama e pontinhos
  g.lineCap = 'round';
  for (let i = 0; i < W * H * 40; i++) {
    const x = rnd(0, cw), y = rnd(0, ch);
    const tx = Math.floor(x / TP), ty = Math.floor(y / TP);
    const t = at(tx, ty);
    if (t === 'grass') {
      g.strokeStyle = Math.random() < 0.5 ? shade(0x3f7a44, rnd(0.8, 1.3)) : shade(0x1c3f26, rnd(0.8, 1.2));
      g.lineWidth = rnd(1, 2.2); g.beginPath(); g.moveTo(x, y); g.lineTo(x + rnd(-3, 3), y - rnd(4, 10)); g.stroke();
    } else if (t === 'road') {
      g.fillStyle = shade(0x6a5338, rnd(0.8, 1.3)); g.beginPath(); g.arc(x, y, rnd(0.8, 2.2), 0, 7); g.fill();
    }
  }
  // sombra de contato sob as construções
  for (const p of props) {
    if (p.kind === 'house' || p.kind === 'temple' || p.kind === 'fountain') {
      const cx = (p.gx + p.w / 2) * TP, cy = (p.gy + p.h / 2) * TP;
      const gr = g.createRadialGradient(cx, cy, TP * p.w * 0.3, cx, cy, TP * (Math.max(p.w, p.h) * 0.85));
      gr.addColorStop(0, 'rgba(8,10,8,0.55)'); gr.addColorStop(1, 'rgba(8,10,8,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, TP * Math.max(p.w, p.h) * 0.85, 0, 7); g.fill();
    }
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(W * T, H * T), new THREE.MeshLambertMaterial({ map: tex }));
  plane.rotation.x = -Math.PI / 2; plane.position.set(W * T / 2, 0, H * T / 2);
  plane.receiveShadow = true;
  return plane;
}

/** água com brilho e ondas animadas */
export function buildWater(map: Tile[][]) {
  const H = map.length, W = map[0].length;
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    uniforms: { uT: windU },
    vertexShader: 'varying vec3 vP; void main(){ vP = (modelMatrix*vec4(position,1.)).xyz; gl_Position = projectionMatrix*viewMatrix*vec4(vP,1.); }',
    fragmentShader: `uniform float uT; varying vec3 vP;
      void main(){
        float w = sin(vP.x*1.7 + uT*1.1 + sin(vP.z*0.9 + uT*0.7)*2.0) * 0.5 + 0.5;
        float w2 = sin(vP.z*2.3 - uT*1.4 + sin(vP.x*1.1)*2.0) * 0.5 + 0.5;
        float spark = smoothstep(0.93, 1.0, w * w2 + 0.25*sin(uT*3.0 + vP.x*5.0 + vP.z*4.0));
        vec3 c = mix(vec3(0.04,0.18,0.30), vec3(0.10,0.36,0.50), w*0.6 + w2*0.4);
        c += spark * vec3(0.55,0.75,0.9);
        gl_FragColor = vec4(c, 0.93);
      }`,
  });
  const geo: THREE.PlaneGeometry[] = [];
  const grp = new THREE.Group();
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (map[y][x] === 'water') {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(T * 1.08, T * 1.08), mat);
    m.rotation.x = -Math.PI / 2; m.position.set((x + 0.5) * T, 0.03, (y + 0.5) * T);
    grp.add(m); geo.push(m.geometry);
  }
  return grp;
}

/** capim, flores e pedras espalhados (balançam com o vento) */
export function buildFoliage(map: Tile[][], props: Prop[]) {
  const H = map.length, W = map[0].length;
  const grp = new THREE.Group();
  // textura da touceira
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d')!;
  for (let i = 0; i < 9; i++) {
    const x = 14 + i * 12 + rnd(-4, 4), h = rnd(60, 120), lean = rnd(-22, 22);
    const gr = g.createLinearGradient(0, 128, 0, 128 - h);
    gr.addColorStop(0, '#1d4a2a'); gr.addColorStop(1, ['#6fb35a', '#8fcf6a', '#5aa04e'][i % 3]);
    g.fillStyle = gr; g.beginPath(); g.moveTo(x - 5, 128); g.quadraticCurveTo(x + lean * 0.3, 128 - h * 0.6, x + lean, 128 - h); g.quadraticCurveTo(x + lean * 0.3 + 3, 128 - h * 0.6, x + 5, 128); g.fill();
  }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const blocked = (tx: number, ty: number) => props.some((p) => p.kind !== 'tree' && p.kind !== 'torch' && tx >= p.gx - 0.3 && tx <= p.gx + p.w + 0.3 && ty >= p.gy - 0.3 && ty <= p.gy + p.h + 0.3);
  const quad = new THREE.PlaneGeometry(0.9, 0.75); quad.translate(0, 0.375, 0);
  const q2 = quad.clone(); q2.rotateY(Math.PI / 2);
  const merged = mergeGeos([quad, q2]);
  const spots: { x: number; z: number }[] = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (map[y][x] !== 'grass' || blocked(x, y)) continue;
    const n = 9;
    for (let k = 0; k < n; k++) spots.push({ x: (x + Math.random()) * T, z: (y + Math.random()) * T });
  }
  const mat = windify(new THREE.MeshLambertMaterial({ map: tex, alphaTest: 0.45, side: THREE.DoubleSide }), 0.22, 1.9);
  const mesh = new THREE.InstancedMesh(merged, mat, spots.length);
  const o = new THREE.Object3D(), col = new THREE.Color();
  spots.forEach((s, i) => {
    o.position.set(s.x, 0, s.z); o.rotation.y = Math.random() * 3; const sc = rnd(0.7, 1.6); o.scale.set(sc, sc * rnd(0.8, 1.3), sc); o.updateMatrix();
    mesh.setMatrixAt(i, o.matrix); mesh.setColorAt(i, col.setHSL(rnd(0.22, 0.34), rnd(0.35, 0.6), rnd(0.42, 0.62)));
  });
  mesh.receiveShadow = false;
  grp.add(mesh);
  // flores
  const fc = document.createElement('canvas'); fc.width = fc.height = 32;
  const fg = fc.getContext('2d')!;
  fg.fillStyle = '#2d6a35'; fg.fillRect(15, 14, 2, 18);
  fg.fillStyle = '#fff'; for (let a = 0; a < 5; a++) { fg.beginPath(); fg.arc(16 + Math.cos(a * 1.26) * 5, 10 + Math.sin(a * 1.26) * 5, 4, 0, 7); fg.fill(); }
  fg.fillStyle = '#f2c14e'; fg.beginPath(); fg.arc(16, 10, 3, 0, 7); fg.fill();
  const ftex = new THREE.CanvasTexture(fc); ftex.colorSpace = THREE.SRGBColorSpace;
  const fq = new THREE.PlaneGeometry(0.4, 0.4); fq.translate(0, 0.2, 0);
  const flowers = spots.filter(() => Math.random() < 0.06);
  const fm = new THREE.InstancedMesh(fq, windify(new THREE.MeshBasicMaterial({ map: ftex, alphaTest: 0.5, side: THREE.DoubleSide }), 0.18, 2.1), flowers.length);
  flowers.forEach((s, i) => { o.position.set(s.x, 0, s.z); o.rotation.y = Math.random() * 3; o.scale.setScalar(rnd(0.8, 1.4)); o.updateMatrix(); fm.setMatrixAt(i, o.matrix); fm.setColorAt(i, col.setHSL(Math.random(), 0.7, 0.7)); });
  grp.add(fm);
  return grp;
}

function mergeGeos(gs: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const pos: number[] = [], uv: number[] = [], nor: number[] = [], idx: number[] = [];
  let off = 0;
  for (const g of gs) {
    const p = g.attributes.position, u = g.attributes.uv, n = g.attributes.normal;
    for (let i = 0; i < p.count; i++) { pos.push(p.getX(i), p.getY(i), p.getZ(i)); uv.push(u.getX(i), u.getY(i)); nor.push(n.getX(i), n.getY(i), n.getZ(i)); }
    g.index!.array.forEach((v) => idx.push(v + off)); off += p.count;
  }
  const m = new THREE.BufferGeometry();
  m.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); m.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); m.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  m.setIndex(idx);
  return m;
}
