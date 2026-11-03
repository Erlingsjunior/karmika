/* O RENDERIZADOR WEBGPU (03/11). Carregado só quando o jogo abre em WebGPU (import dinâmico: quem joga em WebGL não baixa nada disto).
   - cria o WebGPURenderer (e desiste se o navegador só oferecer o WebGL por baixo: aí o WebGL clássico do jogo é melhor);
   - ensina o WebGPU os efeitos que o jogo fazia em GLSL (gpu/tags.ts anota nos materiais): corte de visão, vento, chão com texturas,
     pele do vampiro, contorno das árvores, água, chafariz, Égide e as partículas;
   - o pós-processamento (brilho/bloom, cor do dia e da noite, vinheta, os 16 bits com pontilhado do modo Pixel) em nós TSL.
   O que ainda não foi traduzido não quebra o jogo: some (e fica na lista de gpuPending(), para a próxima rodada). */
import * as THREE from 'three';
import * as W from 'three/webgpu';
import * as TSL from 'three/tsl';
import { bloom as bloomNode } from 'three/examples/jsm/tsl/display/BloomNode.js';
import { gpuState, gpuTagsOf, gpuHooks } from './tags';

/* eslint-disable @typescript-eslint/no-explicit-any */
const L: any = TSL;
const { Fn, uniform, vec2, vec3, vec4, float, attribute, positionWorld, positionLocal, normalLocal, screenCoordinate, screenSize, texture, sin, cos, fract, floor, dot, mix, smoothstep, clamp, distance, max, min, exp, length, abs, pow, uv, vertexIndex, diffuseColor, Discard, select, cameraProjectionMatrix, modelViewMatrix, modelWorldMatrix, cameraViewMatrix, normalView, positionView, instancedBufferAttribute, pass, renderOutput, mod, step } = L;
type Ref = { value: any };
/** uniforme ligado a um {value} do jogo: número lido a cada desenho; objeto (vetor, cor, textura) vivo pela referência */
const U = (o: Ref) => (typeof o.value === 'number' ? uniform(o.value).onRenderUpdate(() => o.value) : uniform(o.value));
const pending = new Set<string>();
export const gpuPending = () => [...pending];

/* ---------- os efeitos anotados nos materiais do jogo ---------- */
const gHash = Fn(([p]: any[]) => fract(sin(dot(p, vec2(127.1, 311.7))).mul(43758.5453)));
const gNoise = Fn(([p]: any[]) => { const i = floor(p), f0 = fract(p), f = f0.mul(f0).mul(float(3).sub(f0.mul(2)));
  return mix(mix(gHash(i), gHash(i.add(vec2(1, 0))), f.x), mix(gHash(i.add(vec2(0, 1))), gHash(i.add(vec2(1, 1))), f.x), f.y); });

/** o chão (chunks3d): as 18 texturas sem repetir sobre a cor do bioma */
function groundFrag(G: { tGround: Ref; uMean: Ref; uTexOn: Ref }) {
  const sp1 = attribute('aSp1', 'vec4'), sp2 = attribute('aSp2', 'vec4'), pl = attribute('aPl', 'float'), wp = positionWorld.xz;
  const base0 = diffuseColor.rgb;
  if (!G.tGround.value) { /* antes de as texturas chegarem: o chão de sempre (cor do bioma com granulado e o calçamento desenhado) */
    const gq = floor(wp.mul(5)), gh = fract(sin(dot(gq, vec2(12.9898, 78.233))).mul(43758.5453));
    let c = base0.mul(gh.mul(0.2).add(0.9));
    const q0 = wp.mul(2.4), q = vec2(q0.x.add(mod(floor(q0.y), 2).mul(0.5)), q0.y), id = floor(q), f = fract(q);
    const h = fract(sin(dot(id, vec2(12.9, 78.2))).mul(43758.5)), e = min(min(f.x, float(1).sub(f.x)), min(f.y, float(1).sub(f.y))), j = smoothstep(0.05, 0.14, e);
    c = mix(c, c.mul(h.mul(0.4).add(0.78)).mul(mix(0.45, 1.0, j)), pl);
    diffuseColor.rgb.assign(c); return;
  }
  const tex = G.tGround.value as THREE.DataArrayTexture, mean = (G.uMean.value as THREE.Vector3[]).map((v) => uniform(v));
  const gTex = (Ly: number, sc: number) => { const p = wp.div(sc), q = vec2(wp.x.mul(0.809).add(wp.y.mul(0.588)), wp.x.mul(-0.588).add(wp.y.mul(0.809))).div(sc * 1.37).add(vec2(0.37, 0.71));
    const n = smoothstep(0.32, 0.68, gNoise(wp.mul(0.045).add(Ly * 7.3)));
    return mix(texture(tex, p).depth(Ly).rgb, texture(tex, q).depth(Ly).rgb, n); };
  const gPair = (A: number, B: number, sc: number, seed: number) => { const n = smoothstep(0.38, 0.62, gNoise(wp.mul(0.028).add(seed))); return mix(gTex(A, sc).div(mean[A]), gTex(B, sc).div(mean[B]), n); };
  const nz = (k: number, s: number) => smoothstep(0.4, 0.6, gNoise(wp.mul(k).add(s)));
  let det = mix(gPair(0, 1, 3.2, 1.7), gPair(7, 11, 3.6, 4.1), clamp(sp1.w, 0, 1));
  det = mix(vec3(1), clamp(det, 0.35, 1.9), sp2.w.mul(0.85));
  const bare = smoothstep(0.7, 0.82, gNoise(wp.mul(0.035).add(17))).mul(float(1).sub(clamp(sp1.w, 0, 1))).mul(sp2.w).mul(0.55);
  let base = base0.mul(det); base = mix(base, gTex(13, 3.4).mul(0.9), bare);
  base = mix(base, mix(gTex(9, 4.0), gTex(16, 4.4), nz(0.04, 5)).mul(mix(vec3(1), base0.div(max(mean[9], vec3(0.02))), 0.35)), clamp(sp2.y, 0, 1).mul(0.85));
  base = mix(base, mix(gTex(10, 3.0), gTex(17, 3.3), nz(0.05, 8)), clamp(sp2.z, 0, 1).mul(0.8));
  base = mix(base, mix(gTex(6, 2.6), gTex(14, 2.9), nz(0.06, 2)), clamp(sp1.z, 0, 1).mul(0.85));
  base = mix(base, mix(gTex(8, 1.8), gTex(15, 2.0), nz(0.07, 6)), clamp(sp2.x, 0, 1).mul(0.9));
  const road = mix(gTex(2, 3.0), gTex(3, 3.0), nz(0.06, 9));
  base = mix(base, road.mul(0.92), clamp(sp1.x, 0, 1));
  let cob = mix(gTex(4, 2.4), gTex(5, 2.4), nz(0.05, 3));
  cob = mix(cob, gTex(12, 3.2), pl.mul(smoothstep(0.3, 0.7, gNoise(wp.mul(0.02).add(11)))));
  base = mix(base, cob.mul(0.95), clamp(sp1.y, 0, 1));
  diffuseColor.rgb.assign(base);
}
/** corte de visão (toon3d): um círculo na tela em volta do herói, só no que está entre a câmera e ele. O WebGPU conta a tela de cima
 *  para baixo (o WebGL, de baixo para cima): o y é virado */
function cutFrag(C: { uCut: Ref; uCutF: Ref }) {
  const uc = uniform(C.uCut.value as THREE.Vector4), uf = uniform(C.uCutF.value as THREE.Vector3);
  const fc = vec2(screenCoordinate.x, screenSize.y.sub(screenCoordinate.y)), d = distance(fc, uc.xy);
  const inside = uc.w.greaterThan(0).and(d.lessThan(uc.z)).and(dot(positionWorld.xz, uf.xy).lessThan(uf.z));
  const dots = d.lessThan(uc.z.mul(0.86)).or(mod(floor(fc.x.mul(0.5)).add(floor(fc.y.mul(0.5))), 2).lessThan(1));
  Discard(inside.and(dots));
}
/** pele do vampiro (looks3d) */
function paleFrag(P: Ref) {
  const k = U(P), c = diffuseColor.rgb, mx = max(c.r, max(c.g, c.b)), mn = min(c.r, min(c.g, c.b)), sat = mx.sub(mn).div(max(mx, 1e-3));
  const warm = step(c.g, c.r).mul(smoothstep(0.02, 0.07, c.r.sub(c.b))).mul(smoothstep(0.55, 0.75, c.r.sub(c.g).div(max(c.r.sub(c.b), 1e-3))));
  const skin = warm.mul(smoothstep(0.1, 0.2, mx)).mul(float(1).sub(smoothstep(0.7, 0.88, sat))), l = dot(c, vec3(0.32, 0.5, 0.18));
  diffuseColor.rgb.assign(mix(c, vec3(0.86, 0.84, 0.93).mul(clamp(l.mul(1.7).add(0.06), 0, 1)), skin.mul(k)));
}
/** vento (terrain3d.windify): base presa no chão, topo se mexe; com o herói passando, o capim se abre */
function windPos(nm: any, b: any, w: { amp: number; freq: number; hero: boolean; windU: Ref; gustU: Ref; heroU: Ref }) {
  const t = U(w.windU), gu = U(w.gustU), obj = b.object as THREE.InstancedMesh;
  let ip: any = vec3(0);
  if (obj.isInstancedMesh) { const ib = new THREE.InstancedInterleavedBuffer(obj.instanceMatrix.array as Float32Array, 16, 1); const c3 = instancedBufferAttribute(ib, 'vec4', 16, 12); ip = vec3(c3.x, 0, c3.z); }
  const p = positionLocal, hy = max(p.y, 0);
  const sw = sin(t.mul(w.freq).add(ip.x.mul(0.6)).add(ip.z.mul(0.45))).add(sin(t.mul(w.freq * 2.3).add(ip.x.mul(1.3))).mul(0.5)).add(sin(t.mul(1.1).sub(ip.x.add(ip.z).mul(0.18))).mul(0.6));
  const gm = gu.mul(1.4).add(0.5), hb = hy.mul(min(hy, 1));
  let x = p.x.add(sw.mul(gm).mul(w.amp).mul(hb)), z = p.z.add(sw.mul(gm).mul(w.amp * 0.6).mul(hb)), y = p.y;
  if (w.hero) { const hu = uniform(w.heroU.value as THREE.Vector3), dh = ip.xz.sub(hu.xz), dd = length(dh), k = smoothstep(1.35, 0.15, dd);
    const dir = select(dd.greaterThan(0.001), dh.div(max(dd, 0.001)), vec2(1, 0)), push = dir.mul(k).mul(0.55).mul(hy);
    x = x.add(push.x); z = z.add(push.y); y = y.sub(k.mul(0.45).mul(hy)); }
  nm.positionNode = vec3(x, y, z);
}
function wrapClass(Base: any) {
  return class extends Base {
    setupPosition(b: any) { const t = gpuTagsOf(b.material) as any; if (t) { if (t.wind) windPos(this, b, t.wind); if (t.hull) this.positionNode = positionLocal.add(normalLocal.mul(t.hull)); } return super.setupPosition(b); }
    setupDiffuseColor(b: any) { super.setupDiffuseColor(b); const t = gpuTagsOf(b.material) as any; if (!t) return;
      if (t.ground) groundFrag(t.ground); if (t.pale) paleFrag(t.pale); if (t.cut && !b.material.userData?.noCut) cutFrag(t.cut); }
  };
}

/* ---------- os ShaderMaterial do jogo, um a um ---------- */
const PORTS: Record<string, (nm: any, d: any, b: any) => void> = {
  /** a água dos rios e lagos (chunks3d) */
  water(nm, u) { const t = U(u.uT), li = U(u.uLight), fo0 = uniform(u.uFoul.value as THREE.Vector3), vD = attribute('aDepth', 'float'), P = positionWorld;
    const n2 = (p: any) => fract(sin(dot(floor(p), vec2(12.9898, 78.233))).mul(43758.5453));
    const w = sin(P.x.mul(1.7).add(t.mul(1.1)).add(sin(P.z.mul(0.9).add(t.mul(0.7))).mul(2))).mul(0.5).add(0.5);
    const w2 = sin(P.z.mul(2.3).sub(t.mul(1.4)).add(sin(P.x.mul(1.1)).mul(2))).mul(0.5).add(0.5);
    const spark = smoothstep(0.94, 1.0, w.mul(w2).add(sin(t.mul(3).add(P.x.mul(5)).add(P.z.mul(4))).mul(0.2)));
    const dp = clamp(vD.div(1.2), 0, 1);
    let c = mix(vec3(0.10, 0.32, 0.34), vec3(0.03, 0.13, 0.22), dp); c = mix(c, vec3(0.12, 0.30, 0.45), w.mul(0.6).add(w2.mul(0.4)).mul(0.35));
    const fo = smoothstep(0.3, 0.0, vD).mul(step(0.45, n2(P.xz.mul(3.2).add(floor(t.mul(0.35))))).mul(0.3).add(0.7));
    const ring = smoothstep(0.02, 0.0, abs(fract(vD.mul(3).sub(t.mul(0.3))).sub(0.5)).sub(0.45)).mul(smoothstep(0.7, 0.2, vD)).mul(0.25);
    c = c.add(vec3(0.5, 0.7, 0.85).mul(spark).mul(li.add(0.4))); c = mix(c, vec3(0.82, 0.9, 0.92), fo.mul(0.85).add(ring));
    const fk = select(fo0.z.greaterThan(0), smoothstep(fo0.z, fo0.z.mul(0.75), distance(P.xz, fo0.xy)), float(0));
    let mud = mix(vec3(0.26, 0.24, 0.13), vec3(0.15, 0.15, 0.08), dp); const scum = smoothstep(0.55, 0.85, n2(P.xz.mul(0.9)).mul(0.6).add(w.mul(0.5)));
    mud = mix(mud, vec3(0.30, 0.38, 0.12), scum.mul(0.6)); mud = mud.add(vec3(0.18, 0.10, 0.28).mul(smoothstep(0.7, 1.0, sin(P.x.mul(0.8).add(P.z.mul(0.6)).add(t.mul(0.4))).mul(0.5).add(0.5)).mul(0.35)));
    mud = mix(mud, vec3(0.55, 0.54, 0.44), fo.mul(0.6)); c = mix(c, mud, fk).mul(li);
    nm.colorNode = c; nm.opacityNode = mix(0.55, 0.95, smoothstep(0.0, 0.5, vD)); },
  /** a água antiga do mapa (terrain3d) */
  water0(nm, u) { const t = U(u.uT), P = positionWorld;
    const w = sin(P.x.mul(1.7).add(t.mul(1.1)).add(sin(P.z.mul(0.9).add(t.mul(0.7))).mul(2))).mul(0.5).add(0.5), w2 = sin(P.z.mul(2.3).sub(t.mul(1.4)).add(sin(P.x.mul(1.1)).mul(2))).mul(0.5).add(0.5);
    const spark = smoothstep(0.93, 1.0, w.mul(w2).add(sin(t.mul(3).add(P.x.mul(5)).add(P.z.mul(4))).mul(0.25)));
    nm.colorNode = mix(vec3(0.04, 0.18, 0.30), vec3(0.10, 0.36, 0.50), w.mul(0.6).add(w2.mul(0.4))).add(vec3(0.55, 0.75, 0.9).mul(spark)); nm.opacityNode = float(0.93); },
  /** o chafariz da praça (world3d) */
  fountain(nm, u) { const t = U(u.uT), P = positionWorld;
    const w = sin(P.x.mul(3.1).add(t.mul(1.7))).mul(sin(P.z.mul(2.7).sub(t.mul(1.3)))).mul(0.5).add(0.5);
    const rg = smoothstep(0.9, 1.0, sin(length(fract(P.xz.mul(0.25)).sub(0.5)).mul(40).sub(t.mul(5))));
    nm.colorNode = mix(vec3(0.08, 0.35, 0.5), vec3(0.3, 0.7, 0.85), w.mul(0.6)).add(rg.mul(0.18)); nm.opacityNode = float(0.92); },
  /** a Égide de Auréon (gameplay): cúpula de favos */
  aegis(nm, u) { const t = U(u.t), hit = U(u.hit), op = U(u.op), col = uniform(u.col.value as THREE.Color), vU = uv();
    const f = pow(float(1).sub(abs(dot(normalView, positionView.normalize().negate()))), 2.4);
    const hx = texture(u.map.value as THREE.Texture, vU.mul(vec2(7, 3.5)).add(vec2(0, t.mul(-0.06)))).r, fb = fract(vU.y.mul(2).sub(t.mul(0.35)));
    const band = smoothstep(0.0, 0.08, fb).mul(float(1).sub(smoothstep(0.08, 0.3, fb))), base = smoothstep(-0.05, 0.25, positionLocal.y);
    const a = float(0.015).add(f.mul(0.65)).add(hx.mul(f.mul(0.45).add(0.035))).add(band.mul(f).mul(0.25)).add(hit.mul(hx.mul(0.5).add(0.2))).mul(op).mul(base.mul(0.65).add(0.35));
    nm.colorNode = col.mul(f.mul(0.6).add(0.7).add(hit.mul(0.9))).add(vec3(hit.mul(0.3))); nm.opacityNode = a; },
  /** a alma/fantasma (fx/fantasma3d): brilho na borda, some nos pés */
  ghost(nm, u) { const C = uniform(u.uC.value as THREE.Color), A = U(u.uA), t = U(u.uT), base = U(u.uBase), y = positionWorld.y;
    const rim = pow(float(1).sub(abs(dot(normalView, positionView.normalize().negate()))), 2.2), feet = smoothstep(base.sub(0.05), base.add(0.85), y), fl = sin(t.mul(6).add(y.mul(7))).mul(0.14).add(0.86);
    nm.colorNode = C.mul(rim.mul(1.3).add(0.55)); nm.opacityNode = rim.mul(0.8).add(0.07).mul(feet).mul(fl).mul(A); },
  /** os fachos de luz (volume3d) */
  shaft(nm, u) { const t = U(u.uT), C = uniform(u.uC.value as THREE.Color), I = U(u.uI), S = U(u.uS), q = uv();
    let a = smoothstep(0.0, 0.12, q.y).mul(float(1).sub(smoothstep(0.45, 1.0, q.y))).mul(pow(max(float(1).sub(abs(q.x.sub(0.5)).mul(2)), 0), 1.6));
    a = a.mul(sin(q.y.mul(7).add(t.mul(0.08)).add(S)).mul(sin(q.x.mul(9).sub(t.mul(0.05)).add(S.mul(1.7)))).mul(0.4).add(0.6)).mul(sin(t.mul(0.25).add(S)).mul(0.04).add(0.96)).mul(I);
    nm.colorNode = C.mul(a); nm.opacityNode = a; },
  /** o facho dourado do ponto da cena (cinema-vistas) */
  beam(nm, u) { const t = U(u.uT), q = uv(), a = pow(float(1).sub(q.y), 2.2).mul(sin(q.x.mul(37.7).add(t.mul(2))).mul(0.25).add(0.55));
    nm.colorNode = vec3(1.0, 0.78, 0.38).mul(a); nm.opacityNode = a; },
};
class ShaderPort extends (W as any).MeshBasicNodeMaterial {
  setup(b: any) { const t = gpuTagsOf(b.material) as any, key = t && Object.keys(t).find((k) => PORTS[k]);
    if (key) PORTS[key](this, t[key], b);
    else { const nm = String(b.material.name || b.material.userData?.fx || b.object?.name || b.material.uuid.slice(0, 6)); pending.add(nm); this.colorNode = vec4(0); this.opacityNode = float(0); this.alphaTestNode = float(0.5); }
    return super.setup(b); }
}

/* ---------- partículas: no WebGPU o ponto tem 1 pixel, então cada partícula vira um quadradinho virado para a câmera (instâncias) ---------- */
function particles(geo: THREE.BufferGeometry, u: Record<string, Ref>, n: number) {
  const ig = new THREE.InstancedBufferGeometry(); ig.instanceCount = n;
  for (const [k, a] of Object.entries(geo.attributes)) { const ba = a as THREE.BufferAttribute; const ia = new THREE.InstancedBufferAttribute(ba.array as Float32Array, ba.itemSize); ia.setUsage(THREE.DynamicDrawUsage); ig.setAttribute(k, ia); geo.attributes[k] = ia; }
  ig.setDrawRange(0, 6);
  const m = new (W as any).MeshBasicNodeMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const uPx = U(u.uPx), uDist = U(u.uDist), uT = U(u.uT), uWind = uniform(u.uWind.value as THREE.Vector2);
  const p0 = attribute('position', 'vec3'), v0 = attribute('aV0', 'vec3'), tl = attribute('aTL', 'vec3'), sz = attribute('aSz', 'vec2'), c0 = attribute('aC0', 'vec3'), c1 = attribute('aC1', 'vec3'), ph = attribute('aPh', 'vec4');
  const mv1 = (x0: any, vv: any, A: any, r: any, t: any) => select(r.lessThan(1e-4), x0.add(vv.mul(t)).add(A.mul(t).mul(t).mul(0.5)), x0.add(A.div(max(r, 1e-4)).mul(t)).add(vv.sub(A.div(max(r, 1e-4))).mul(float(1).sub(exp(r.negate().mul(t)))).div(max(r, 1e-4))));
  const age = uT.sub(tl.x), life = tl.y, k = age.div(max(life, 1e-4)), alive = life.greaterThan(0).and(age.greaterThanEqual(0)).and(k.lessThan(1));
  const drag = ph.x, grav = ph.y, wf = ph.z, flit = ph.w, kw = select(wf.greaterThan(0), float(1.4), float(0));
  let p = vec3(mv1(p0.x, v0.x, kw.mul(uWind.x).mul(wf), drag.add(kw), age), mv1(p0.y, v0.y, grav.negate(), drag, age), mv1(p0.z, v0.z, kw.mul(uWind.y).mul(wf), drag.add(kw), age));
  p = p.add(vec3(sin(age.mul(5).add(tl.z)), sin(age.mul(7).add(tl.z.mul(1.3))).mul(0.6), cos(age.mul(4).add(tl.z))).mul(flit.mul(0.12)));
  const size = mix(sz.x, sz.y, k), mvp = modelViewMatrix.mul(vec4(p, 1));
  /* o tamanho em pixels igual ao do gl_PointSize do WebGL: px na tela → metade do lado em espaço de recorte */
  const px = size.mul(uPx).mul(uDist).div(max(1, mvp.z.negate())), clip = cameraProjectionMatrix.mul(mvp);
  const vi = vertexIndex, cx = select(vi.equal(1).or(vi.equal(2)).or(vi.equal(4)), float(1), float(-1)), cy = select(vi.equal(2).or(vi.equal(4)).or(vi.equal(5)), float(1), float(-1));
  const off = vec2(cx, cy).mul(px).div(screenSize).mul(clip.w);
  m.vertexNode = select(alive, vec4(clip.xy.add(off), clip.z, clip.w), vec4(2, 2, 2, 1));
  const vA = select(k.lessThan(0.15), k.div(0.15), float(1).sub(k.sub(0.15).div(0.85))), vUv = vec2(cx, cy).mul(0.5).add(0.5).varying('vPc');
  const a = texture(u.uMap.value as THREE.Texture, vUv).a.mul(vA.varying('vPa'));
  m.colorNode = mix(c0, c1, k).varying('vPcol').mul(a); m.opacityNode = a; m.alphaTestNode = float(0.01);
  const mesh = new THREE.Mesh(ig, m); mesh.frustumCulled = false; return mesh;
}

/* ---------- remendos do three r170 no WebGPU (o jogo faz coisas que o WebGL aceita e o WebGPU não) ---------- */
function patchRenderer(R: any) {
  /* 1) textura que muda de tamanho (canvas de placa, nome, mapa): o WebGPU não redimensiona — a textura é refeita */
  const TX = R._textures, oUp = TX.updateTexture.bind(TX), SZ = new WeakMap<object, string>();
  TX.updateTexture = (t: any, o: any) => { if (!(t.isRenderTargetTexture || t.isDepthTexture || t.isFramebufferTexture)) { const d = TX.get(t), z = TX.getSize(t), k = `${z.width}x${z.height}x${z.depth}`, was = SZ.get(t);
      if (d.initialized && was && was !== k) { R.backend.destroySampler(t); R.backend.destroyTexture(t); R.backend.createSampler(t); d.isDefaultTexture = true; } SZ.set(t, k); } return oUp(t, o); };
  /* 2) atributo que cresceu (array trocado por um maior): o buffer é refeito com o mesmo uso */
  const AU = R.backend.attributeUtils, oUA = AU.updateAttribute.bind(AU);
  AU.updateAttribute = (a: any) => { const ba = a.isInterleavedBufferAttribute ? a.data : a, bd = R.backend.get(ba), buf = bd.buffer;
    if (buf && ba.array.byteLength > buf.size) { const use = buf.usage; buf.destroy(); bd.buffer = undefined; AU.createAttribute(a, use); return; } return oUA(a); };
  /* 3) InstancedMesh com count menor que a capacidade: o three r170 criava o buffer das matrizes do tamanho do count de então */
  const IN = (W as any).InstanceNode.prototype, oIS = IN.setup;
  IN.setup = function (this: any, b: any) { const m = this.instanceMesh, c = m.count; if (this.instanceMatrixNode === null) m.count = m.instanceMatrix.count; try { return oIS.call(this, b); } finally { m.count = c; } };
}

/* ---------- o renderizador ---------- */
export async function createGPURenderer(): Promise<THREE.WebGLRenderer | null> {
  const R = new (W as any).WebGPURenderer({ antialias: false, powerPreference: 'high-performance' });
  await R.init();
  if (!R.backend?.isWebGPUBackend) { R.dispose?.(); gpuState.why = 'o navegador não liberou o WebGPU'; return null; }
  const lib = R.library, mats: Map<string, any> = lib.materialNodes;
  for (const [type, cls] of [...mats.entries()]) mats.set(type, wrapClass(cls));
  mats.set('ShaderMaterial', ShaderPort);
  gpuHooks.particles = particles;
  patchRenderer(R);
  gpuState.on = true; gpuState.backend = 'webgpu';
  R.backend.device?.lost?.then((i: { message: string }) => { gpuState.why = 'perdido: ' + i.message + ' @' + Math.round(performance.now()); console.warn('[WebGPU] dispositivo perdido:', i.message); });
  return R as THREE.WebGLRenderer;
}

/** o pós-processamento do WebGPU com a mesma cara do composer do WebGL: brilho, grade de cor, vinheta, 16 bits com pontilhado (Pixel) */
export function createGPUPost(R: any, getSC: () => [THREE.Scene, THREE.Camera], bl: { strength: number; radius: number; threshold: number }, fin: Record<string, Ref>) {
  const [s0, c0] = getSC(); const sp = pass(s0, c0); const col = sp.getTextureNode('output');
  const bn = bloomNode(col, bl.strength, bl.radius, bl.threshold);
  const uQ = U(fin.uQuant), lv = uniform(fin.levels.value), mul = uniform(fin.uMul.value), lift = uniform(fin.uLift.value), sat = U(fin.uSat), vig = U(fin.uVig);
  const lin = col.add(bn); let c = renderOutput(lin).rgb; /* tom (ACES) e sRGB aqui, antes da grade — como o OutputPass do WebGL */
  const lum = dot(c, vec3(0.299, 0.587, 0.114));
  c = mix(vec3(lum), c, sat).mul(mul).add(lift.mul(float(1).sub(lum)));
  const vUv = uv(), v = smoothstep(0.38, 0.98, length(vUv.sub(0.5).mul(vec2(1.1, 1.0))));
  c = c.mul(float(1).sub(v.mul(vig)));
  const l2 = dot(c, vec3(0.299, 0.587, 0.114)), cm0 = mix(vec3(l2), c, 1.14), cm = cm0.mul(cm0).mul(float(3).sub(cm0.mul(2))).mul(0.35).add(cm0.mul(0.65));
  /* pontilhado ordenado 4×4 (Bayer) calculado: bit a bit, a mesma tabela do WebGL */
  const bx = mod(floor(screenCoordinate.x), 4), by = mod(floor(screenCoordinate.y), 4), b0 = (n: any) => mod(n, 2), b1 = (n: any) => mod(floor(n.div(2)), 2);
  const bay = abs(b0(bx).sub(b0(by))).mul(8).add(b0(by).mul(4)).add(abs(b1(bx).sub(b1(by))).mul(2)).add(b1(by));
  const cq = floor(clamp(c, 0, 1).mul(lv).add(bay.add(0.5).div(16))).div(lv);
  const out = select(uQ.greaterThan(0.5), cq, cm);
  /* teste sem tela (Playwright): ?gpuoff=1 desenha num alvo fora da tela — no navegador sem monitor, apresentar no canvas derruba o WebGPU */
  const OFF = /[?&]gpuoff=1/.test(location.search); let offRT: any = null;
  const post = new (W as any).PostProcessing(R); post.outputColorTransform = false; const DBG = Number(new URLSearchParams(location.search).get('gpudbg') || 0); const cg = c; post.outputNode = DBG === 5 ? vec4(cg, 1) : DBG === 6 ? vec4(cm, 1) : DBG === 7 ? vec4(cq, 1) : DBG === 3 ? vec4(renderOutput(lin).rgb, 1) : DBG === 4 ? vec4(bn.rgb, 1) : DBG === 1 ? vec4(renderOutput(col).rgb, 1) : DBG === 2 ? vec4(col.rgb, 1) : vec4(out, 1);
  return {
    passes: [] as unknown[], addPass(p: unknown) { this.passes.push(p); }, setSize() { /* o PassNode acompanha o tamanho do renderizador */ },
    render() { const [s, cam] = getSC(); if (sp.scene !== s) sp.scene = s; if (sp.camera !== cam) sp.camera = cam; cam.layers.enableAll();
      if (OFF && R.getRenderTarget() === null) { const cw = R.domElement.width, ch = R.domElement.height; if (!offRT || offRT.width !== cw || offRT.height !== ch) { offRT?.dispose(); offRT = new THREE.RenderTarget(cw, ch); } R.setRenderTarget(offRT); }
      bn.strength.value = bl.strength; bn.radius.value = bl.radius; bn.threshold.value = bl.threshold; post.render(); if (OFF && R.getRenderTarget() === offRT) R.setRenderTarget(null); },
    /** teste: o quadro final lido de volta (o WebGPU não deixa ler o canvas depois de apresentado) → dataURL */
    async shot(w = 640) { const cw = R.domElement.width, ch = R.domElement.height, h = Math.round(w * ch / cw); const rt = new THREE.RenderTarget(cw, ch);
      R.setRenderTarget(rt); this.render(); R.setRenderTarget(null); const px: Uint8Array = await R.readRenderTargetPixelsAsync(rt, 0, 0, cw, ch); rt.dispose();
      const c = document.createElement('canvas'); c.width = cw; c.height = ch; const g = c.getContext('2d')!, im = g.createImageData(cw, ch); im.data.set(px); g.putImageData(im, 0, 0);
      const o = document.createElement('canvas'); o.width = w; o.height = h; o.getContext('2d')!.drawImage(c, 0, 0, w, h); return o.toDataURL('image/png'); },
  };
}
void [cos, cameraViewMatrix, modelWorldMatrix];
