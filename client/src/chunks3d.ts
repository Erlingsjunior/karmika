import * as THREE from 'three';
import { TILE_M as T } from '@karmika/shared';
import { type World, type Biome, MAP_W, MAP_H, groundH, waterSD, zoneW, WL, fbm, vnoise, smoothstep, rng } from './world';
import { windU, windify } from './terrain3d';
/* fator de calçamento num ponto (em casas): 1 perto das cidades, cai até 0 no ermo; perto das vilas, meio a meio (25/10) */
function paveAt(w: World, x: number, y: number) { let p = 0; for (const st of w.settlements) { const d = Math.hypot(x - st.x, y - st.y); if (st.kind === 'city') p = Math.max(p, 1 - smoothstep(80, 170, d)); else p = Math.max(p, 0.55 * (1 - smoothstep(st.radius + 4, st.radius + 26, d))); } return p; }

export const CS = 20;               // tiles por chunk
export const CSM = CS * T;          // metros
const SEG = 60;                     // quadrados por lado do chunk (0,67 m)
export const waterU = { uLight: { value: 0.35 }, uFoul: { value: new THREE.Vector3(0, 0, 0) } }; // (x, z, raio m) da água podre da Catedral

const C = (h: number) => new THREE.Color(h);
const PAL: Record<Biome, [THREE.Color, THREE.Color]> = {
  meadow: [C(0x2f5a35), C(0x4c7a3e)], forest: [C(0x22472b), C(0x3a6a36)], swamp: [C(0x2e3d2a), C(0x4a5a30)],
  snow: [C(0xc9d6e4), C(0xf0f6fb)], ruins: [C(0x4e4c3a), C(0x6c6a4c)], rock: [C(0x5a544c), C(0x7a7268)],
  volcanic: [C(0x1e1a1c), C(0x3a3032)], enchanted: [C(0x3a3a6a), C(0x5a4a8a)], blight: [C(0x2e2630), C(0x4a3c44)], jungle: [C(0x163a1c), C(0x2a5426)], coast: [C(0xb8a478), C(0xd6c49a)],
};
const MOSS = C(0x4c6c2a), DIRT = C(0x6e5438), MUD = C(0x3a3226), BED = C(0x2a3a3a), PEBBLE = C(0x817e76), ROAD = C(0x8a6d49), ROAD2 = C(0x6f5638), PLAZA = C(0x8d8f9c), CLIFF = C(0x5d5a56), CLIFF2 = C(0x7b7468);
const tmpC = new THREE.Color(), tmpD = new THREE.Color();

function tileAt(w: World, x: number, y: number) { return w.map[Math.min(MAP_H - 1, Math.max(0, y))][Math.min(MAP_W - 1, Math.max(0, x))]; }
/** peso bilinear de um tipo de tile em (tx,ty) contínuos */
function tileW(w: World, tx: number, ty: number, pred: (t: string) => boolean) {
  const fx = tx - 0.5, fy = ty - 0.5, x0 = Math.floor(fx), y0 = Math.floor(fy), u = fx - x0, v = fy - y0;
  const a = pred(tileAt(w, x0, y0)) ? 1 : 0, b = pred(tileAt(w, x0 + 1, y0)) ? 1 : 0, c = pred(tileAt(w, x0, y0 + 1)) ? 1 : 0, d = pred(tileAt(w, x0 + 1, y0 + 1)) ? 1 : 0;
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

let groundMat: THREE.MeshLambertMaterial | null = null;
function getGroundMat() {
  if (groundMat) return groundMat;
  groundMat = new THREE.MeshLambertMaterial({ vertexColors: true });
  groundMat.onBeforeCompile = (sh) => {
    sh.vertexShader = 'attribute float aPl; varying float vPl; varying vec3 vWp;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vPl = aPl; vWp = (modelMatrix * vec4(position,1.0)).xyz;');
    sh.fragmentShader = 'varying float vPl; varying vec3 vWp;\n' + sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      vec2 gq = floor(vWp.xz * 5.0);
      float gh = fract(sin(dot(gq, vec2(12.9898, 78.233))) * 43758.5453);
      diffuseColor.rgb *= 0.90 + 0.2 * gh;
      if (vPl > 0.02) {
        vec2 q = vWp.xz * 2.4; q.x += mod(floor(q.y), 2.0) * 0.5;
        vec2 id = floor(q); vec2 f = fract(q);
        float h = fract(sin(dot(id, vec2(12.9, 78.2))) * 43758.5);
        float e = min(min(f.x, 1.0 - f.x), min(f.y, 1.0 - f.y));
        float j = smoothstep(0.05, 0.14, e);
        diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * (0.78 + 0.4 * h) * mix(0.45, 1.0, j), vPl);
      }`);
  };
  return groundMat;
}

let waterMat: THREE.ShaderMaterial | null = null;
function getWaterMat() {
  if (waterMat) return waterMat;
  waterMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uT: windU, uLight: waterU.uLight, uFoul: waterU.uFoul },
    vertexShader: 'attribute float aDepth; varying float vD; varying vec3 vP; void main(){ vD = aDepth; vP = (modelMatrix*vec4(position,1.)).xyz; gl_Position = projectionMatrix*viewMatrix*vec4(vP,1.); }',
    fragmentShader: `uniform float uT; uniform float uLight; uniform vec3 uFoul; varying float vD; varying vec3 vP;
      float n2(vec2 p){ return fract(sin(dot(floor(p), vec2(12.9898,78.233)))*43758.5453); }
      void main(){
        float w = sin(vP.x*1.7 + uT*1.1 + sin(vP.z*0.9 + uT*0.7)*2.0) * 0.5 + 0.5;
        float w2 = sin(vP.z*2.3 - uT*1.4 + sin(vP.x*1.1)*2.0) * 0.5 + 0.5;
        float spark = smoothstep(0.94, 1.0, w * w2 + 0.2*sin(uT*3.0 + vP.x*5.0 + vP.z*4.0));
        float dp = clamp(vD / 1.2, 0.0, 1.0);
        vec3 c = mix(vec3(0.10,0.32,0.34), vec3(0.03,0.13,0.22), dp);
        c = mix(c, vec3(0.12,0.30,0.45), (w*0.6 + w2*0.4) * 0.35);
        float fo = smoothstep(0.3, 0.0, vD) * (0.7 + 0.3*step(0.45, n2(vP.xz*3.2 + floor(uT*0.35)))); /* espuma da margem: troca devagar (antes piscava 2×/s e a tela tremia) */
        float ring = smoothstep(0.02, 0.0, abs(fract(vD*3.0 - uT*0.3) - 0.5) - 0.45) * smoothstep(0.7, 0.2, vD) * 0.25;
        c += spark * vec3(0.5,0.7,0.85) * (0.4 + uLight);
        c = mix(c, vec3(0.82,0.9,0.92), fo*0.85 + ring);
        // água podre: lama oliva-acastanhada, manchas de limo, espuma cinzenta e brilho oleoso que escorre
        float fk = uFoul.z > 0.0 ? smoothstep(uFoul.z, uFoul.z * 0.75, distance(vP.xz, uFoul.xy)) : 0.0;
        if (fk > 0.0) {
          vec3 mud = mix(vec3(0.26,0.24,0.13), vec3(0.15,0.15,0.08), dp);
          float scum = smoothstep(0.55, 0.85, n2(vP.xz*0.9) * 0.6 + w*0.5);
          mud = mix(mud, vec3(0.30,0.38,0.12), scum*0.6);
          float oil = smoothstep(0.7, 1.0, sin(vP.x*0.8 + vP.z*0.6 + uT*0.4)*0.5 + 0.5) * 0.35;
          mud += oil * vec3(0.18, 0.10, 0.28);
          mud = mix(mud, vec3(0.55,0.54,0.44), fo*0.6);
          c = mix(c, mud, fk);
        }
        c *= uLight;
        gl_FragColor = vec4(c, mix(0.55, 0.95, smoothstep(0.0, 0.5, vD)) );
      }`,
  });
  return waterMat;
}

let grassTex: THREE.Texture | null = null, reedTex: THREE.Texture | null = null;
function getGrassTex() {
  if (grassTex) return grassTex;
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d')!;
  const r = rng(5);
  for (let i = 0; i < 9; i++) {
    const x = 14 + i * 12 + (r() - 0.5) * 8, h = 60 + r() * 60, lean = (r() - 0.5) * 44;
    const gr = g.createLinearGradient(0, 128, 0, 128 - h); gr.addColorStop(0, '#1d4a2a'); gr.addColorStop(1, ['#6fb35a', '#8fcf6a', '#5aa04e'][i % 3]);
    g.fillStyle = gr; g.beginPath(); g.moveTo(x - 5, 128); g.quadraticCurveTo(x + lean * 0.3, 128 - h * 0.6, x + lean, 128 - h); g.quadraticCurveTo(x + lean * 0.3 + 3, 128 - h * 0.6, x + 5, 128); g.fill();
  }
  grassTex = new THREE.CanvasTexture(c); grassTex.colorSpace = THREE.SRGBColorSpace; return grassTex;
}
function getReedTex() {
  if (reedTex) return reedTex;
  const c = document.createElement('canvas'); c.width = 96; c.height = 192; const g = c.getContext('2d')!;
  const r = rng(11);
  for (let i = 0; i < 7; i++) {
    const x = 10 + i * 12 + (r() - 0.5) * 6, h = 110 + r() * 70, lean = (r() - 0.5) * 30;
    g.strokeStyle = ['#5f7a34', '#7a8f3e', '#4a6a2c'][i % 3]; g.lineWidth = 3.2; g.beginPath(); g.moveTo(x, 192); g.quadraticCurveTo(x + lean * 0.3, 192 - h * 0.6, x + lean, 192 - h); g.stroke();
    if (i % 2 === 0) { g.strokeStyle = '#4a3220'; g.lineWidth = 7; g.beginPath(); g.moveTo(x + lean, 192 - h); g.lineTo(x + lean * 1.05, 192 - h + 22); g.stroke(); }
  }
  reedTex = new THREE.CanvasTexture(c); reedTex.colorSpace = THREE.SRGBColorSpace; return reedTex;
}
let blade: THREE.BufferGeometry | null = null, reedG: THREE.BufferGeometry | null = null, stoneG: THREE.BufferGeometry | null = null;
function crossQuad(w: number, h: number) {
  const a = new THREE.PlaneGeometry(w, h); a.translate(0, h / 2, 0);
  const b = a.clone(); b.rotateY(Math.PI / 2);
  const pos: number[] = [], uv: number[] = [], nor: number[] = [], idx: number[] = []; let off = 0;
  for (const g of [a, b]) { const p = g.attributes.position, u = g.attributes.uv, n = g.attributes.normal; for (let i = 0; i < p.count; i++) { pos.push(p.getX(i), p.getY(i), p.getZ(i)); uv.push(u.getX(i), u.getY(i)); nor.push(0, 1, 0); } g.index!.array.forEach((v) => idx.push(v + off)); off += p.count; void n; }
  const m = new THREE.BufferGeometry(); m.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); m.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); m.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); m.setIndex(idx); return m;
}

export interface ChunkTerrain { group: THREE.Group; dispose(): void }

/** terreno de um chunk: malha com relevo, água, vegetação rasteira, juncos e pedras da margem */
export function buildChunkTerrain(cx: number, cy: number, w: World): ChunkTerrain {
  const grp = new THREE.Group();
  const own: THREE.BufferGeometry[] = [];
  const ox = cx * CSM, oz = cy * CSM, d = CSM / SEG, N = SEG + 1;
  const R = rng((cx * 73856093) ^ (cy * 19349663) ^ 0x9e37);
  /* alturas com margem de 1 vértice (normais por diferença central) */
  const W2 = SEG + 3, hs = new Float32Array(W2 * W2);
  for (let j = 0; j < W2; j++) for (let i = 0; i < W2; i++) hs[j * W2 + i] = groundH(ox + (i - 1) * d, oz + (j - 1) * d);
  const pos = new Float32Array(N * N * 3), nor = new Float32Array(N * N * 3), col = new Float32Array(N * N * 3), pl = new Float32Array(N * N), dep = new Float32Array(N * N), sds = new Float32Array(N * N);
  let anyWater = false;
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const k = j * N + i, xm = ox + i * d, zm = oz + j * d, h = hs[(j + 1) * W2 + (i + 1)];
    const hx = hs[(j + 1) * W2 + (i + 2)] - hs[(j + 1) * W2 + i], hz = hs[(j + 2) * W2 + (i + 1)] - hs[j * W2 + (i + 1)];
    const nx = -hx / (2 * d), nz = -hz / (2 * d), nl = Math.hypot(nx, 1, nz);
    pos[k * 3] = i * d; pos[k * 3 + 1] = h; pos[k * 3 + 2] = j * d;
    nor[k * 3] = nx / nl; nor[k * 3 + 1] = 1 / nl; nor[k * 3 + 2] = nz / nl;
    const tx = xm / T, ty = zm / T, sd = waterSD(xm, zm); sds[k] = sd;
    if (sd < 0.9) anyWater = true;
    dep[k] = Math.max(0, Math.min(2, WL - h));
    const zw = zoneW(tx, ty);
    const tone = fbm(xm * 0.22, zm * 0.22, 4);
    tmpC.setRGB(0, 0, 0);
    for (const b of Object.keys(zw) as Biome[]) { const wt = zw[b]; if (wt < 0.001) continue; tmpD.copy(PAL[b][0]).lerp(PAL[b][1], tone); tmpC.r += tmpD.r * wt; tmpC.g += tmpD.g * wt; tmpC.b += tmpD.b * wt; }
    // encosta: pedra
    const slope = 1 - nor[k * 3 + 1];
    const sk = smoothstep(0.1, 0.32, slope + (vnoise(xm * 0.9, zm * 0.9, 8) - 0.5) * 0.08);
    if (sk > 0) tmpC.lerp(tmpD.copy(CLIFF).lerp(CLIFF2, vnoise(xm * 1.6, zm * 1.6, 3)), sk * (zw.snow > 0.5 ? 0.7 : 1));
    // margem: musgo, terra, lama, seixos
    if (sd < 5) {
      const nz2 = vnoise(xm * 1.1, zm * 1.1, 12), nz3 = vnoise(xm * 3.1, zm * 3.1, 17);
      const m1 = smoothstep(5, 1.2, sd) * (0.35 + 0.65 * nz2); tmpC.lerp(MOSS, Math.min(0.85, m1 * 0.8));
      const m2 = smoothstep(2.1 + (nz2 - 0.5) * 1.2, 0.5, sd); tmpC.lerp(DIRT, m2);
      const m3 = smoothstep(0.9, -0.2, sd); tmpC.lerp(MUD, m3 * 0.9);
      if (nz3 > 0.66 && sd > -1.6 && sd < 3.0) tmpC.lerp(PEBBLE, 0.8);
      if (sd < 0) tmpC.lerp(BED, smoothstep(0, 1.0, -sd) * 0.7);
      tmpC.multiplyScalar(1 - 0.22 * smoothstep(2.0, 0, sd));
    }
    // estradas e praça (peso vem do mapa de tiles, borda irregular)
    const edgeN = (vnoise(xm * 1.7, zm * 1.7, 21) - 0.5) * 0.34;
    const rw = smoothstep(0.42 + edgeN, 0.72 + edgeN, tileW(w, tx, ty, (t) => t === 'road' || t === 'plaza'));
    let pw = smoothstep(0.5, 0.8, tileW(w, tx, ty, (t) => t === 'plaza'));
    /* calçamento das estradas (25/10): perto da cidade grande, pedra inteira; no meio do caminho, trechos; no ermo, quase nada */
    if (rw > 0.05) { const pv = paveAt(w, tx, ty); if (pv > 0) { const n = vnoise(xm * 0.55, zm * 0.55, 33) * 0.8 + vnoise(xm * 2.2, zm * 2.2, 34) * 0.2; pw = Math.max(pw, rw * smoothstep(n - 0.05, n + 0.05, pv)); } }
    if (rw > 0) { tmpD.copy(ROAD).lerp(ROAD2, vnoise(xm * 1.3, zm * 1.3, 2)); tmpC.lerp(tmpD, rw * 0.95); }
    if (pw > 0) tmpC.lerp(PLAZA, pw);
    pl[k] = pw;
    col[k * 3] = tmpC.r; col[k * 3 + 1] = tmpC.g; col[k * 3 + 2] = tmpC.b;
  }
  const idx: number[] = [];
  for (let j = 0; j < SEG; j++) for (let i = 0; i < SEG; i++) { const a = j * N + i, b = a + 1, c = a + N, e = c + 1; idx.push(a, c, b, b, c, e); }
  const gg = new THREE.BufferGeometry();
  gg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); gg.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); gg.setAttribute('color', new THREE.BufferAttribute(col, 3)); gg.setAttribute('aPl', new THREE.BufferAttribute(pl, 1)); gg.setIndex(idx);
  gg.computeBoundingSphere(); own.push(gg);
  grp.userData.kind = 'chunk'; const ground = new THREE.Mesh(gg, getGroundMat()); ground.position.set(ox, 0, oz); ground.receiveShadow = true; grp.add(ground);

  /* água */
  if (anyWater) {
    const widx: number[] = [];
    for (let j = 0; j < SEG; j++) for (let i = 0; i < SEG; i++) {
      const a = j * N + i;
      if (Math.min(sds[a], sds[a + 1], sds[a + N], sds[a + N + 1]) > 0.7) continue;
      widx.push(a, a + N, a + 1, a + 1, a + N, a + N + 1);
    }
    if (widx.length) {
      const wp = new Float32Array(N * N * 3); for (let k = 0; k < N * N; k++) { wp[k * 3] = pos[k * 3]; wp[k * 3 + 1] = WL; wp[k * 3 + 2] = pos[k * 3 + 2]; }
      const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.BufferAttribute(wp, 3)); wg.setAttribute('aDepth', new THREE.BufferAttribute(dep, 1)); wg.setIndex(widx); wg.computeBoundingSphere(); own.push(wg);
      const wm = new THREE.Mesh(wg, getWaterMat()); wm.position.set(ox, 0, oz); wm.renderOrder = 1; grp.add(wm);
    }
  }

  /* capim, flores, juncos, pedras */
  const o = new THREE.Object3D(), cc = new THREE.Color();
  const grassSpots: { x: number; z: number; b: Biome }[] = [];
  // grama pela metade e só em manchas (ruído): campos e pântano têm; neve e rocha quase nada
  const DENS: Record<Biome, number> = { meadow: 3.5, forest: 2.5, swamp: 4, snow: 0.3, ruins: 1.2, rock: 0.3, volcanic: 0.1, enchanted: 3, blight: 1.2, jungle: 4.5, coast: 0.8 };
  for (let ty = cy * CS; ty < (cy + 1) * CS; ty++) for (let tx = cx * CS; tx < (cx + 1) * CS; tx++) {
    if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H || w.map[ty][tx] !== 'grass') continue;
    if (fbm(tx * 0.13, ty * 0.13, 61) < 0.47) continue; // manchas de grama, não tapete
    const bm = w.biome[ty][tx], n = DENS[bm] + (R() < (DENS[bm] % 1) ? 1 : 0);
    for (let k = 0; k < Math.floor(n); k++) {
      const x = (tx + R()) * T, z = (ty + R()) * T;
      const sd = waterSD(x, z); if (sd < 0.5) continue;
      if (tileW(w, x / T, z / T, (t) => t === 'road' || t === 'plaza') > 0.25) continue;
      grassSpots.push({ x, z, b: bm });
    }
  }
  if (grassSpots.length) {
    blade ??= crossQuad(0.9, 0.75);
    const mat = windify(new THREE.MeshLambertMaterial({ map: getGrassTex(), alphaTest: 0.45, side: THREE.DoubleSide }), 0.22, 1.9);
    const im = new THREE.InstancedMesh(blade, mat, grassSpots.length);
    grassSpots.forEach((s, i) => {
      o.position.set(s.x, groundH(s.x, s.z) - 0.02, s.z); o.rotation.set(0, R() * 3, 0); const sc = 0.7 + R() * 0.9; o.scale.set(sc, sc * (0.8 + R() * 0.5), sc); o.updateMatrix(); im.setMatrixAt(i, o.matrix);
      if (s.b === 'snow') cc.setHSL(0.1, 0.18, 0.55 + R() * 0.2); else if (s.b === 'swamp') cc.setHSL(0.2 + R() * 0.05, 0.4, 0.3 + R() * 0.15); else if (s.b === 'ruins' || s.b === 'rock') cc.setHSL(0.14 + R() * 0.04, 0.3, 0.35 + R() * 0.15); else cc.setHSL(0.22 + R() * 0.12, 0.35 + R() * 0.25, 0.42 + R() * 0.2);
      im.setColorAt(i, cc);
    });
    im.instanceMatrix.needsUpdate = true; grp.add(im);
    // flores nas campinas
    const fl = grassSpots.filter((s) => s.b === 'meadow' && R() < 0.035);
    if (fl.length) {
      const fq = new THREE.PlaneGeometry(0.2, 0.2); fq.translate(0, 0.1, 0); own.push(fq);
      const fc = document.createElement('canvas'); fc.width = fc.height = 32; const fg = fc.getContext('2d')!;
      fg.fillStyle = '#2d6a35'; fg.fillRect(15, 14, 2, 18); fg.fillStyle = '#fff'; for (let a = 0; a < 5; a++) { fg.beginPath(); fg.arc(16 + Math.cos(a * 1.26) * 5, 10 + Math.sin(a * 1.26) * 5, 4, 0, 7); fg.fill(); }
      fg.fillStyle = '#f2c14e'; fg.beginPath(); fg.arc(16, 10, 3, 0, 7); fg.fill();
      const ft = new THREE.CanvasTexture(fc); ft.colorSpace = THREE.SRGBColorSpace;
      const fm = new THREE.InstancedMesh(fq, windify(new THREE.MeshBasicMaterial({ map: ft, alphaTest: 0.5, side: THREE.DoubleSide }), 0.18, 2.1), fl.length);
      fl.forEach((s, i) => { o.position.set(s.x, groundH(s.x, s.z), s.z); o.rotation.set(0, R() * 3, 0); o.scale.setScalar(0.7 + R() * 0.5); o.updateMatrix(); fm.setMatrixAt(i, o.matrix); fm.setColorAt(i, cc.setHSL(R(), 0.7, 0.7)); });
      grp.add(fm);
    }
  }
  if (anyWater) {
    const reeds: { x: number; z: number }[] = [], stones: { x: number; z: number; s: number }[] = [];
    for (let k = 0; k < 1500 && (reeds.length < 260 || stones.length < 90); k++) {
      const x = ox + R() * CSM, z = oz + R() * CSM, sd = waterSD(x, z);
      if (sd > 0.25 && sd < 2.4 && reeds.length < 260 && tileW(w, x / T, z / T, (t) => t === 'road') < 0.2) reeds.push({ x, z });
      else if (sd > -0.8 && sd < 2.8 && stones.length < 90 && R() < 0.5) stones.push({ x, z, s: 0.12 + R() * 0.26 });
    }
    if (reeds.length) {
      reedG ??= crossQuad(0.75, 1.7);
      const im = new THREE.InstancedMesh(reedG, windify(new THREE.MeshLambertMaterial({ map: getReedTex(), alphaTest: 0.4, side: THREE.DoubleSide }), 0.16, 1.5), reeds.length);
      reeds.forEach((s, i) => { o.position.set(s.x, groundH(s.x, s.z) - 0.05, s.z); o.rotation.set(0, R() * 3, 0); const sc = 0.7 + R() * 0.8; o.scale.set(sc, sc * (0.8 + R() * 0.6), sc); o.updateMatrix(); im.setMatrixAt(i, o.matrix); im.setColorAt(i, cc.setHSL(0.17 + R() * 0.08, 0.35, 0.55 + R() * 0.2)); });
      grp.add(im);
    }
    if (stones.length) {
      stoneG ??= new THREE.IcosahedronGeometry(1, 0);
      const im = new THREE.InstancedMesh(stoneG, new THREE.MeshLambertMaterial({ flatShading: true }), stones.length);
      stones.forEach((s, i) => { o.position.set(s.x, groundH(s.x, s.z) + s.s * 0.15, s.z); o.rotation.set(R() * 3, R() * 3, R() * 3); o.scale.set(s.s * (0.9 + R() * 0.6), s.s * 0.6, s.s * (0.9 + R() * 0.6)); o.updateMatrix(); im.setMatrixAt(i, o.matrix); im.setColorAt(i, cc.setHSL(0.09 + R() * 0.05, 0.08 + R() * 0.1, 0.28 + R() * 0.22)); });
      im.castShadow = true; grp.add(im);
    }
  }
  return { group: grp, dispose() { for (const g of own) g.dispose(); grp.traverse((m) => { if ((m as THREE.InstancedMesh).isInstancedMesh) (m as THREE.InstancedMesh).dispose(); }); } };
}
