import * as THREE from 'three';
import { gpuTag } from './gpu/tags';

export const OUTLINES = false; // sem contorno: os pixels definem as formas (estilo Eitr)
/* 03/11 (Erling: "quero a sensação de 16 bit cor"): a luz em 8 faixas em vez de 4 — mesma curva de antes (60 → 255), sem o salto seco que
   manchava pedra e lona; continua em faixas (sem degradê liso), como a sombra pintada dos jogos de 16 bits */
export const ramp = new THREE.DataTexture(new Uint8Array([60, 78, 112, 148, 182, 214, 241, 255].flatMap((v) => [v, v, v, 255])), 8, 1, THREE.RGBAFormat);
ramp.minFilter = ramp.magFilter = THREE.NearestFilter; ramp.needsUpdate = true;
/* Corte de visão (Erling, 27/10: "toda vez que tivermos elementos que impedem a visão eles são cortados em um círculo que permite ver o que está atrás"):
   todo material toon do cenário descarta os pixels dentro de um círculo na tela em volta do herói, só para o que está ENTRE a câmera e ele
   (mais perto da câmera do que o herói, com folga). A borda do círculo é pontilhada. setCutout() é chamado a cada quadro pelo main. */
export const CUT = { uCut: { value: new THREE.Vector4(-9999, -9999, 0, 0) }, uCutF: { value: new THREE.Vector3(0, 1, 0) } };
export function setCutout(px: number, py: number, radiusPx: number, heroDist: number) { CUT.uCut.value.set(px, py, radiusPx, heroDist); }
/** 27/10 (Erling: "o trono atrás do herói sumia junto com o pilar"): o corte só vale para o que está ENTRE a câmera e o herói no chão —
 *  profundidade horizontal (xz) na direção da câmera, não a distância em 3D (um objeto alto atrás do herói fica mais perto da câmera). */
export function setCutoutPlane(fwdX: number, fwdZ: number, heroDepth: number) { CUT.uCutF.value.set(fwdX, fwdZ, heroDepth); }
export function cutoutify<M extends THREE.Material>(m: M): M {
  if ((m as THREE.Material & { userData: { noCut?: boolean } }).userData.noCut) return m;
  const prev = m.onBeforeCompile; gpuTag(m, 'cut', CUT); /* WebGPU: gpu/impl.ts */
  m.onBeforeCompile = (sh, r) => { prev?.call(m, sh, r); sh.uniforms.uCut = CUT.uCut; sh.uniforms.uCutF = CUT.uCutF;
    sh.vertexShader = sh.vertexShader.replace('#include <clipping_planes_pars_vertex>', '#include <clipping_planes_pars_vertex>\nvarying vec2 vCutW;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\n{ vec4 cp = vec4( transformed, 1.0 );\n#ifdef USE_INSTANCING\ncp = instanceMatrix * cp;\n#endif\nvec4 cw = modelMatrix * cp; vCutW = cw.xz; }' /* 03/11: com instancing, a posição de cada cópia entra no corte */);
    sh.fragmentShader = sh.fragmentShader.replace('#include <clipping_planes_pars_fragment>', '#include <clipping_planes_pars_fragment>\nuniform vec4 uCut; uniform vec3 uCutF; varying vec2 vCutW;')
      .replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\n{ float dCut = distance(gl_FragCoord.xy, uCut.xy); if (uCut.w > 0.0 && dCut < uCut.z && dot(vCutW, uCutF.xy) < uCutF.z) { if (dCut < uCut.z * 0.86 || mod(floor(gl_FragCoord.x * 0.5) + floor(gl_FragCoord.y * 0.5), 2.0) < 1.0) discard; } }'); };
  m.customProgramCacheKey = () => 'cut' + ((m as unknown as { map?: unknown }).map ? 't' : '') + m.type;
  return m;
}
/* material toon padrão. Com textura (`map`), o material é cacheado por (cor, textura, lado, emissivo): a fusão por chunk
   agrupa malhas texturizadas pelo material, então 300 telhados com 300 materiais iguais viravam 300 draw calls. Quem
   precisa mexer num material texturizado depois (opacidade, cor) deve clonar. Sem textura não cacheia (a fusão usa cor por vértice). */
const STD_CACHE = new Map<string, THREE.MeshToonMaterial>();
export const std = (color: number, extra: THREE.MeshToonMaterialParameters = {}) => {
  const ks = Object.keys(extra); const cacheable = extra.map && ks.every((k) => k === 'map' || k === 'side' || k === 'emissive' || k === 'emissiveIntensity');
  if (!cacheable) return cutoutify(new THREE.MeshToonMaterial({ color, gradientMap: ramp, ...extra }));
  const em = extra.emissive === undefined ? '' : typeof extra.emissive === 'number' ? extra.emissive.toString(16) : (extra.emissive as THREE.Color).getHexString?.() ?? String(extra.emissive);
  const key = `${color}|${(extra.map as THREE.Texture).uuid}|${extra.side ?? 0}|${em}|${extra.emissiveIntensity ?? 1}`;
  let m = STD_CACHE.get(key); if (!m) { m = cutoutify(new THREE.MeshToonMaterial({ color, gradientMap: ramp, ...extra })); STD_CACHE.set(key, m); } return m;
};
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
const texRaw = (key: string, size: number, draw: (g: CanvasRenderingContext2D, s: number) => void) => { const had = texCache.has(key); const t = tex(key, size, draw); (t.userData as { fresh?: boolean }).fresh = !had; return t; };
const rr = (a: number, b: number) => a + Math.random() * (b - a);
const sh = (c: number, k: number) => `rgb(${Math.min(255, ((c >> 16) & 255) * k) | 0},${Math.min(255, ((c >> 8) & 255) * k) | 0},${Math.min(255, (c & 255) * k) | 0})`;
/** tábuas verticais */
/* 03/11 (Erling: "são muitas texturas e boas para serem utilizadas"): as texturas fotográficas do Herik (models/cenario/chao) entram POR CIMA
   das desenhadas — o desenho (tábuas, fiadas de pedra, cor) fica, e a foto em "overlay" põe veio de madeira, poro de pedra e sujeira.
   Tábua → assoalho de madeira; pedra aparelhada → laje de pedra; chão de masmorra → laje / rocha com musgo. Duas versões, pela cor. */
const imgCache = new Map<string, Promise<HTMLImageElement | null>>();
const loadImg = (n: string) => { let p = imgCache.get(n); if (!p) { p = new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = `/models/cenario/chao/${n}.jpg`; }); imgCache.set(n, p); } return p; };
export function photoDetail(t: THREE.Texture, imgs: string[], k: number, alpha = 0.62, rep = 1) {
  if ((t.userData as { photo?: boolean }).photo) return t; (t.userData as { photo?: boolean }).photo = true;
  const src = t.image as HTMLCanvasElement; if (typeof document === 'undefined' || !src) return t; const pick = imgs[Math.abs(k) % imgs.length];
  loadImg(pick).then((im) => { if (!im) return; const S = 256, c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d')!; g.imageSmoothingEnabled = false; g.drawImage(src, 0, 0, S, S);
    g.globalCompositeOperation = 'overlay'; g.globalAlpha = alpha; for (let y = 0; y < rep; y++) for (let x = 0; x < rep; x++) g.drawImage(im, x * S / rep, y * S / rep, S / rep, S / rep);
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; t.image = c; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.generateMipmaps = true; t.needsUpdate = true; });
  return t;
}
export const plankTex = (c: number) => photoDetail(texRaw('pl' + c, 64, (g, s) => { for (let i = 0; i < 8; i++) { g.fillStyle = sh(c, rr(0.75, 1.1)); g.fillRect(i * s / 8, 0, s / 8, s); g.fillStyle = 'rgba(10,6,4,.55)'; g.fillRect(i * s / 8, 0, 1.5, s); } for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(20,12,6,.25)'; g.fillRect(rr(0, s), rr(0, s), 1, rr(3, 9)); } }), ['assoalho_madeira_01', 'assoalho_madeira_02'], c, 0.6);
/** pedra aparelhada */
export const stoneTex = (c: number) => photoDetail(texRaw('st' + c, 64, (g, s) => { g.fillStyle = sh(c, 0.7); g.fillRect(0, 0, s, s); for (let y = 0; y < 4; y++) { let x = -rr(0, 10); while (x < s) { const w = rr(12, 22); g.fillStyle = sh(c, rr(0.8, 1.2)); g.fillRect(x + 1, y * 16 + 1, w - 2, 14); x += w; } } }), ['laje_pedra_01', 'laje_pedra_02'], c, 0.55);
/** 08/11 tijolo assentado (casas dos anões, Erling: "temos assets de tijolo e madeira para as casas do povo anão"): fiadas desencontradas, junta clara, tijolo com variação de cor; o detalhe de foto da laje por cima */
export const brickTex = (c: number) => photoDetail(texRaw('bk' + c, 64, (g, s) => { g.fillStyle = sh(c, 0.55); g.fillRect(0, 0, s, s); const bh = 8, bw = 16; for (let y = 0; y < s / bh; y++) { const off = (y % 2) * (bw / 2); for (let x = -1; x < s / bw + 1; x++) { g.fillStyle = sh(c, rr(0.82, 1.18)); g.fillRect(x * bw + off + 1, y * bh + 1, bw - 2, bh - 2); if (Math.random() < 0.2) { g.fillStyle = 'rgba(30,14,8,.35)'; g.fillRect(x * bw + off + rr(2, 10), y * bh + rr(1, 5), rr(2, 5), 1.5); } } } }), ['laje_pedra_02', 'laje_pedra_01'], c, 0.4, 2);
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
