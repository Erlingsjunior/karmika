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
const { Fn, uniform, vec2, vec3, vec4, float, attribute, positionWorld, positionLocal, normalLocal, screenCoordinate, screenSize, texture, sin, cos, fract, floor, dot, mix, smoothstep, clamp, distance, max, min, exp, length, abs, pow, uv, vertexIndex, diffuseColor, Discard, select, cameraProjectionMatrix, modelViewMatrix, modelWorldMatrix, cameraViewMatrix, normalView, positionView, instancedBufferAttribute, renderOutput, mod, step } = L;
type Ref = { value: any };
/** uniforme ligado a um {value} do jogo: número lido a cada desenho; objeto (vetor, cor, textura) vivo pela referência */
/** textura usada só pelos nós (não está em material.map): a varredura de memória do main.ts não pode soltá-la */
const keep = <T extends THREE.Texture>(t: T): T => { t.userData.keep = true; return t; };
const U = (o: Ref) => (typeof o.value === 'number' ? uniform(o.value).onRenderUpdate(() => o.value) : uniform(o.value));
/** uniforme lido DO MATERIAL QUE ESTÁ SENDO DESENHADO (o three reaproveita a montagem entre materiais iguais: um valor capturado na
 *  montagem ficaria preso ao primeiro material — duas Égides, dois vampiros, dois fantasmas leriam o mesmo brilho) */
const PU = (key: string, name: string | null, init: unknown) => { const v0 = init as any; const n = uniform(typeof v0 === 'number' ? v0 : v0?.clone ? v0.clone() : v0);
  return n.onObjectUpdate(({ material }: { material: THREE.Material }) => { const t = gpuTagsOf(material)?.[key] as any; const r = name === null ? t : t?.[name]; return r?.value; }); };
/** a parte da chave de reaproveitamento que vem das anotações (materiais com efeitos diferentes não podem dividir a montagem) */
export function tagKey(m: object) { const t = gpuTagsOf(m) as any; if (!t) return ''; return Object.keys(t).sort().map((k) => k === 'wind' ? `wind${t.wind.amp},${t.wind.freq},${t.wind.hero ? 1 : 0}` : k === 'hull' ? `hull${t.hull}` : k).join('|'); }
const pending = new Set<string>();
/** erros do WebGPU contados: se o WebGPU não se acerta neste PC, o jogo volta sozinho para o WebGL (main.ts lê gpuState.errs) */
export function gpuErr(e: unknown) { gpuState.errs = (gpuState.errs ?? 0) + 1; const m = String((e as { message?: string })?.message ?? e).slice(0, 400); if (!gpuState.log.includes(m) && gpuState.log.length < 60) gpuState.log.push(m); if (gpuState.errs < 4) console.warn('[WebGPU]', m); }
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
  const tex = keep(G.tGround.value as THREE.DataArrayTexture), mean = (G.uMean.value as THREE.Vector3[]).map((v) => uniform(v));
  const gTex = (Ly: number, sc0: any) => { const sc = typeof sc0 === 'number' ? float(sc0) : sc0, p = wp.div(sc), q = vec2(wp.x.mul(0.809).add(wp.y.mul(0.588)), wp.x.mul(-0.588).add(wp.y.mul(0.809))).div(sc.mul(1.37)).add(vec2(0.37, 0.71));
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
  /* três tamanhos de pedra, do centro da cidade para fora (o mesmo do WebGL em chunks3d) */
  const cu = clamp(attribute('aCs', 'float'), 0, 1).mul(2), big = cu.greaterThanEqual(2), cf = select(big, float(0), smoothstep(0.3, 0.7, fract(cu)));
  const cn = nz(0.05, 3), cobAt = (sc: any) => mix(gTex(4, sc), gTex(5, sc), cn);
  const sA = select(big, float(3.4), select(cu.lessThan(1), float(1.6), float(2.4))), sB = select(cu.lessThan(1), float(2.4), float(3.4));
  let cob = mix(cobAt(sA), cobAt(sB), cf);
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
  const k = PU('pale', null, P.value), c = diffuseColor.rgb, mx = max(c.r, max(c.g, c.b)), mn = min(c.r, min(c.g, c.b)), sat = mx.sub(mn).div(max(mx, 1e-3));
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
const PORTS: Record<string, (nm: any, u: any, b: any, Q: (name: string) => any) => void> = {
  /** a água dos rios e lagos (chunks3d) */
  water(nm, u, _b, Q) { const t = Q('uT'), li = Q('uLight'), fo0 = Q('uFoul'), vD = attribute('aDepth', 'float'), P = positionWorld;
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
  water0(nm, u, _b, Q) { const t = Q('uT'), P = positionWorld;
    const w = sin(P.x.mul(1.7).add(t.mul(1.1)).add(sin(P.z.mul(0.9).add(t.mul(0.7))).mul(2))).mul(0.5).add(0.5), w2 = sin(P.z.mul(2.3).sub(t.mul(1.4)).add(sin(P.x.mul(1.1)).mul(2))).mul(0.5).add(0.5);
    const spark = smoothstep(0.93, 1.0, w.mul(w2).add(sin(t.mul(3).add(P.x.mul(5)).add(P.z.mul(4))).mul(0.25)));
    nm.colorNode = mix(vec3(0.04, 0.18, 0.30), vec3(0.10, 0.36, 0.50), w.mul(0.6).add(w2.mul(0.4))).add(vec3(0.55, 0.75, 0.9).mul(spark)); nm.opacityNode = float(0.93); },
  /** o chafariz da praça (world3d) */
  fountain(nm, u, _b, Q) { const t = Q('uT'), P = positionWorld;
    const w = sin(P.x.mul(3.1).add(t.mul(1.7))).mul(sin(P.z.mul(2.7).sub(t.mul(1.3)))).mul(0.5).add(0.5);
    const rg = smoothstep(0.9, 1.0, sin(length(fract(P.xz.mul(0.25)).sub(0.5)).mul(40).sub(t.mul(5))));
    nm.colorNode = mix(vec3(0.08, 0.35, 0.5), vec3(0.3, 0.7, 0.85), w.mul(0.6)).add(rg.mul(0.18)); nm.opacityNode = float(0.92); },
  /** a Égide de Auréon (gameplay): cúpula de favos */
  aegis(nm, u, _b, Q) { const t = Q('t'), hit = Q('hit'), op = Q('op'), col = Q('col'), vU = uv();
    const f = pow(float(1).sub(abs(dot(normalView, positionView.normalize().negate()))), 2.4);
    const hx = texture(keep(u.map.value as THREE.Texture), vU.mul(vec2(7, 3.5)).add(vec2(0, t.mul(-0.06)))).r, fb = fract(vU.y.mul(2).sub(t.mul(0.35)));
    const band = smoothstep(0.0, 0.08, fb).mul(float(1).sub(smoothstep(0.08, 0.3, fb))), base = smoothstep(-0.05, 0.25, positionLocal.y);
    const a = float(0.015).add(f.mul(0.65)).add(hx.mul(f.mul(0.45).add(0.035))).add(band.mul(f).mul(0.25)).add(hit.mul(hx.mul(0.5).add(0.2))).mul(op).mul(base.mul(0.65).add(0.35));
    nm.colorNode = col.mul(f.mul(0.6).add(0.7).add(hit.mul(0.9))).add(vec3(hit.mul(0.3))); nm.opacityNode = a; },
  /** a alma/fantasma (fx/fantasma3d): brilho na borda, some nos pés */
  ghost(nm, u, _b, Q) { const C = Q('uC'), A = Q('uA'), t = Q('uT'), base = Q('uBase'), y = positionWorld.y;
    const rim = pow(float(1).sub(abs(dot(normalView, positionView.normalize().negate()))), 2.2), feet = smoothstep(base.sub(0.05), base.add(0.85), y), fl = sin(t.mul(6).add(y.mul(7))).mul(0.14).add(0.86);
    nm.colorNode = C.mul(rim.mul(1.3).add(0.55)); nm.opacityNode = rim.mul(0.8).add(0.07).mul(feet).mul(fl).mul(A); },
  /** os fachos de luz (volume3d) */
  shaft(nm, u, _b, Q) { const t = Q('uT'), C = Q('uC'), I = Q('uI'), S = Q('uS'), q = uv();
    let a = smoothstep(0.0, 0.12, q.y).mul(float(1).sub(smoothstep(0.45, 1.0, q.y))).mul(pow(max(float(1).sub(abs(q.x.sub(0.5)).mul(2)), 0), 1.6));
    a = a.mul(sin(q.y.mul(7).add(t.mul(0.08)).add(S)).mul(sin(q.x.mul(9).sub(t.mul(0.05)).add(S.mul(1.7)))).mul(0.4).add(0.6)).mul(sin(t.mul(0.25).add(S)).mul(0.04).add(0.96)).mul(I);
    nm.colorNode = C.mul(a); nm.opacityNode = a; },
  /** o facho dourado do ponto da cena (cinema-vistas) */
  beam(nm, u, _b, Q) { const t = Q('uT'), q = uv(), a = pow(float(1).sub(q.y), 2.2).mul(sin(q.x.mul(37.7).add(t.mul(2))).mul(0.25).add(0.55));
    nm.colorNode = vec3(1.0, 0.78, 0.38).mul(a); nm.opacityNode = a; },
};
class ShaderPort extends (W as any).MeshBasicNodeMaterial {
  setup(b: any) { const t = gpuTagsOf(b.material) as any, key = t && Object.keys(t).find((k) => PORTS[k]);
    if (key) PORTS[key](this, t[key], b, (name: string) => PU(key, name, t[key][name]?.value));
    else { const nm = String(b.material.name || b.material.userData?.fx || b.object?.name || String(b.material.fragmentShader ?? '').replace(/\s+/g, ' ').slice(0, 70)); pending.add(nm); this.colorNode = vec4(0); this.opacityNode = float(0); this.alphaTestNode = float(0.5); }
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
  /* a velocidade AGORA (derivada de mv1): a faísca estica na direção em que voa */
  const vel1 = (vv: any, A: any, r: any, t: any) => select(r.lessThan(1e-4), vv.add(A.mul(t)), A.div(max(r, 1e-4)).add(vv.sub(A.div(max(r, 1e-4))).mul(exp(r.negate().mul(t)))));
  const age = uT.sub(tl.x), life = tl.y, k = age.div(max(life, 1e-4)), alive = life.greaterThan(0).and(age.greaterThanEqual(0)).and(k.lessThan(1));
  /* formato (04/11, Erling: "partículas, magias, projéteis, fogo na placa de vídeo"): 0 brilho, 1 faísca, 2 chama — vem em aTL.z junto da fase */
  const kind = floor(tl.z.div(10000)), phs = tl.z.sub(kind.mul(10000)), isSpark = kind.equal(1), isFlame = kind.equal(2);
  const drag = ph.x, grav = ph.y, wf = ph.z, flit = ph.w, kw = select(wf.greaterThan(0), float(1.4), float(0));
  let p = vec3(mv1(p0.x, v0.x, kw.mul(uWind.x).mul(wf), drag.add(kw), age), mv1(p0.y, v0.y, grav.negate(), drag, age), mv1(p0.z, v0.z, kw.mul(uWind.y).mul(wf), drag.add(kw), age));
  p = p.add(vec3(sin(age.mul(5).add(phs)), sin(age.mul(7).add(phs.mul(1.3))).mul(0.6), cos(age.mul(4).add(phs))).mul(flit.mul(0.12)));
  /* a chama sobe se enroscando: turbulência que cresce com a idade (o fogo de verdade não sobe reto) */
  const turb = vec3(sin(p.y.mul(2.3).add(uT.mul(3.1)).add(phs)), float(0), cos(p.y.mul(2.7).add(uT.mul(2.6)).add(phs.mul(1.7)))).mul(age.mul(0.22));
  p = select(isFlame, p.add(turb), p);
  const vel = vec3(vel1(v0.x, kw.mul(uWind.x).mul(wf), drag.add(kw), age), vel1(v0.y, grav.negate(), drag, age), vel1(v0.z, kw.mul(uWind.y).mul(wf), drag.add(kw), age));
  const size = mix(sz.x, sz.y, k), mvp = modelViewMatrix.mul(vec4(p, 1));
  /* o tamanho em pixels igual ao do gl_PointSize do WebGL: px na tela → metade do lado em espaço de recorte */
  const px = min(size.mul(uPx).mul(uDist).div(max(1, mvp.z.negate())), 200), clip = cameraProjectionMatrix.mul(mvp);
  const vi = vertexIndex, cx = select(vi.equal(1).or(vi.equal(2)).or(vi.equal(4)), float(1), float(-1)), cy = select(vi.equal(2).or(vi.equal(4)).or(vi.equal(5)), float(1), float(-1));
  /* faísca: o quadrado vira um risco ao longo da velocidade na tela (o rastro de 1/20 s) */
  const clip2 = cameraProjectionMatrix.mul(modelViewMatrix.mul(vec4(p.add(vel.mul(0.05)), 1)));
  const dpx = clip2.xy.div(max(clip2.w, 1e-3)).sub(clip.xy.div(max(clip.w, 1e-3))).mul(screenSize).mul(0.5), dl = length(dpx);
  const ax = select(dl.greaterThan(1e-3), dpx.div(max(dl, 1e-3)), vec2(1, 0)), pr = vec2(ax.y.negate(), ax.x);
  const sparkHalf = ax.mul(cx).mul(px.mul(0.5).add(min(dl, px.mul(6)))).add(pr.mul(cy).mul(px.mul(0.32)));
  /* chama: mais alta que larga, a base perto do ponto */
  const flameHalf = vec2(cx.mul(px.mul(0.45)), cy.mul(px.mul(0.8)).add(px.mul(0.3)));
  const half = select(isSpark, sparkHalf, select(isFlame, flameHalf, vec2(cx, cy).mul(px.mul(0.5))));
  const off = half.mul(2).div(screenSize).mul(clip.w);
  /* colada na câmera (zoom bem perto): o WebGL limita o tamanho do ponto; aqui some, senão vira um retângulo na tela inteira */
  m.vertexNode = select(alive.and(mvp.z.lessThan(-0.6)), vec4(clip.xy.add(off), clip.z, clip.w), vec4(2, 2, 2, 1));
  const vA = select(k.lessThan(0.15), k.div(0.15), float(1).sub(k.sub(0.15).div(0.85))), vUv = vec2(cx, cy).mul(0.5).add(0.5).toVarying('vPc');
  const vKind = kind.toVarying('vPk'), vPh = phs.toVarying('vPh'), vK = k.toVarying('vPkk');
  const base = texture(keep(u.uMap.value as THREE.Texture), vUv).a;
  /* língua de fogo: gota que afina para cima e ondula; o miolo é mais quente (mais claro) no começo da vida */
  const q = vUv.mul(2).sub(1), fy = q.y.mul(0.5).add(0.5);
  const qx = q.x.add(sin(q.y.mul(3.2).add(uT.mul(9)).add(vPh)).mul(0.22).mul(fy));
  const fw = mix(float(0.95), float(0.22), fy), fd = length(vec2(qx.div(fw), q.y.mul(select(q.y.lessThan(0), float(1.25), float(0.9)))));
  const flame = smoothstep(1.0, 0.15, fd).mul(float(0.85).add(sin(uT.mul(17).add(vPh.mul(3))).mul(0.15)));
  const shape = select(vKind.equal(2), flame, base), a = shape.mul(vA.toVarying('vPa'));
  const col = mix(c0, c1, k).toVarying('vPcol');
  /* miolo quente: o centro de toda partícula brilha um pouco mais (o bloom pega), e a chama clareia para o branco-amarelado */
  const hot = pow(shape, 3).mul(select(vKind.equal(2), float(1).sub(vK).mul(0.9), float(0.35)));
  const hotCol = select(vKind.equal(2), vec3(1, 0.85, 0.55).mul(max(col.x, max(col.y, col.z))), col);
  m.colorNode = col.mul(a).add(hotCol.mul(hot).mul(a)); m.opacityNode = a; m.alphaTestNode = float(0.01);
  const mesh = new THREE.Mesh(ig, m); mesh.frustumCulled = false; return mesh;
}

/* ---------- cópias (InstancedMesh) dividindo o mesmo programa ---------- */
const sharable = (obj: any) => !!(obj && obj.isInstancedMesh && obj.instanceMatrix?.isInstancedBufferAttribute && !obj.instanceMatrix.isStorageInstancedBufferAttribute && !obj.isSkinnedMesh && !obj.morphTargetInfluences && !obj.isBatchedMesh);
const MINE = new WeakMap<object, { arr: unknown; ib: Map<object, any>; at: Map<string, any> }>();
/** as matrizes DESTE objeto no mesmo formato que o programa compartilhado espera (vec4 lado a lado, uma por cópia); a versão segue a do jogo.
 *  Um buffer próprio para CADA buffer do programa original (o vento lê a 4ª coluna de um buffer à parte): o desenho liga os buffers por posição */
function mineAttr(src: any, orig: any, stride: number, offset: number, size: number) {
  let e = MINE.get(src); if (!e || e.arr !== src.array) { e = { arr: src.array, ib: new Map(), at: new Map() }; MINE.set(src, e); }
  let ib = e.ib.get(orig); if (!ib) { ib = new THREE.InstancedInterleavedBuffer(src.array, stride, 1); ib.setUsage(src.usage); Object.defineProperty(ib, 'version', { get: () => src.version, set: () => {} }); e.ib.set(orig, ib); }
  const k = (orig.uuid as string) + ':' + offset + ':' + size; let a = e.at.get(k); if (!a) e.at.set(k, (a = new THREE.InterleavedBufferAttribute(ib, size, offset))); return a;
}
const MINEC = new WeakMap<object, { arr: unknown; a: any }>();
function mineColor(src: any) {
  let e = MINEC.get(src); if (!e || e.arr !== src.array) { const a: any = new THREE.InstancedBufferAttribute(src.array, 3); a.setUsage(src.usage); Object.defineProperty(a, 'version', { get: () => src.version, set: () => {} }); e = { arr: src.array, a }; MINEC.set(src, e); }
  return e.a;
}

const lateQ: { o: any; f: number; real: () => void }[] = []; let lateFrame = 0;
/** fim do quadro: destrói de verdade o que foi pedido há 3 quadros ou mais (ver createGPURenderer) */
export function gpuFlushDestroy() { lateFrame++; let n = 0; while (n < lateQ.length && lateFrame - lateQ[n].f >= 3) { try { lateQ[n].real.call(lateQ[n].o); } catch { /* */ } n++; } if (n) lateQ.splice(0, n); }
/* ---------- o renderizador ---------- */
export async function createGPURenderer(): Promise<THREE.WebGLRenderer | null> {
  /* compatibilidade: o three 0.186 manda 'swizzle' em toda vista de textura; o Chrome 141/142 (e o Electron 45 do Karmika) ainda conhece
     esse campo com outro tipo e recusa a vista inteira. Sem o recurso 'texture-component-swizzle' ligado, o campo não tem efeito: sai. */
  const GT = (globalThis as any).GPUTexture?.prototype;
  if (GT && !GT.__kSw) { const cv = GT.createView; GT.createView = function (this: any, d?: any) { if (d && 'swizzle' in d && !this.__kSwOk) { const { swizzle: _s, ...rest } = d; void _s; return cv.call(this, rest); } return cv.call(this, d); }; GT.__kSw = true; }
  /* 04/11 (erro do PC do Erling: "[Buffer] used in submit while destroyed"): o three destrói buffers e texturas da placa NA HORA em que um
     objeto/material/geometria muda ou some — às vezes no meio do quadro, com o comando que ainda usa aquele buffer (a sombra, a 1ª etapa)
     esperando para ser enviado. No WebGL isso não importa; no WebGPU o envio inteiro é recusado e, depois de alguns, o jogo caía para o
     WebGL. (1ª tentativa: adiar 3 quadros — não bastou; ver abaixo) */
  { const GB = (globalThis as any).GPUBuffer?.prototype, GT2 = (globalThis as any).GPUTexture?.prototype;
    /* 2ª tentativa (04/11, mesmo erro no PC do Erling com o adiamento de 3 quadros): o three continua usando o buffer DEPOIS de pedir para
       destruí-lo (referência velha guardada). Então destruir vira só uma marca: o buffer some sozinho quando ninguém mais aponta para ele
       (o navegador libera a memória da placa no coletor de lixo). Se alguém ainda usar um buffer "destruído", conta e guarda de onde veio. */
    for (const P of [GB, GT2]) if (P && !P.__kLate) { P.__kLate = true; P.destroy = function (this: any) { if (this.__kGone) return; this.__kGone = true; if (gpuState.staleLog.length < 4) this.__kWhy = (new Error().stack || '').split('\n').slice(2, 7).map((x) => x.trim()).join(' < '); }; }
    const RP = (globalThis as any).GPURenderPassEncoder?.prototype; if (RP && !RP.__kChk) { RP.__kChk = true; for (const fn of ['setVertexBuffer', 'setIndexBuffer']) { const o = RP[fn]; RP[fn] = function (this: any, ...a: any[]) { const b = fn === 'setVertexBuffer' ? a[1] : a[0]; if (b?.__kGone) { gpuState.stale++; if (gpuState.staleLog.length < 4) { const m = `buffer velho em ${fn}: ${b.__kWhy ?? '?'}`; gpuState.staleLog.push(m); gpuState.log.unshift(m.slice(0, 400)); } } return o.apply(this, a); }; } } }
  const R = new (W as any).WebGPURenderer({ antialias: false, powerPreference: 'high-performance' });
  await R.init();
  if (!R.backend?.isWebGPUBackend) { R.dispose?.(); gpuState.why = 'o navegador não liberou o WebGPU'; return null; }
  const lib = R.library, mats: Map<string, any> = lib.materialNodes;
  for (const [type, cls] of [...mats.entries()]) mats.set(type, wrapClass(cls));
  mats.set('ShaderMaterial', ShaderPort);
  gpuHooks.particles = particles;

  /* a chave de reaproveitamento da montagem inclui as anotações (gpu/tags): um material toon com corte de visão e outro sem não podem
     dividir o mesmo programa. O RenderObject não é exportado: o remendo entra no primeiro objeto criado */
  { const RO = R._objects, oGet = RO.get.bind(RO); let done = false;
    RO.get = (...a: unknown[]) => { const ro = oGet(...a); if (!done) { done = true; const P = Object.getPrototypeOf(ro); if (!P.__kTag) { const o = P.getMaterialCacheKey; P.getMaterialCacheKey = function (this: any) { const obj = this.object; if (!sharable(obj)) return o.call(this) + '#' + tagKey(this.material);
          /* cópias (InstancedMesh): o three põe o uuid de cada uma na chave — cada grupo de capim/árvores/pedras de cada bloco montava o seu
             programa do zero. A chave passa a ser a do tipo (sem uuid) e cada objeto liga as SUAS matrizes no lugar (getAttributes abaixo) */
          const st = Object.create(obj); st.isInstancedMesh = false; st.count = 1; this.object = st; let k; try { k = o.call(this); } finally { this.object = obj; }
          return k + '#I' + (obj.instanceColor ? 'c' + obj.instanceColor.usage : '') + ':' + obj.instanceMatrix.usage + '#' + tagKey(this.material); };
        const oA = P.getAttributes; P.getAttributes = function (this: any) { if (this.attributes !== null) return this.attributes; const list = oA.call(this), obj = this.object; if (!sharable(obj)) return list;
          const own = new Set(Object.values(this.geometry.attributes)); let ch = false;
          for (let i = 0; i < list.length; i++) { const a = list[i]; if (own.has(a)) continue;
            if (a.isInterleavedBufferAttribute && a.data.isInstancedInterleavedBuffer && a.data.stride === 16 && a.data.array !== obj.instanceMatrix.array) { list[i] = mineAttr(obj.instanceMatrix, a.data, 16, a.offset, a.itemSize); ch = true; }
            else if (!a.isInterleavedBufferAttribute && a.isInstancedBufferAttribute && a.itemSize === 3 && obj.instanceColor && a.array !== obj.instanceColor.array) { list[i] = mineColor(obj.instanceColor); ch = true; } }
          if (ch) this.vertexBuffers = [...new Set(list.map((a: any) => (a.isInterleavedBufferAttribute ? a.data : a)))];
          return list; };
        P.__kTag = true; } } return ro; }; }
  /* só as luzes fixas entram na iluminação: luz pontual nova (de golpe, NPC, bloco do mundo) é ignorada na hora em que entra — antes ela
     contava até a varredura seguinte e, nesse meio-tempo, remontava todos os materiais (createGPUPost → lightsFrame copia as reais) */
  /* (o RenderList não é exportado: o remendo entra no primeiro quadro, em lightsFrame) */
  /* UM PROGRAMA POR TIPO, NÃO POR OBJETO (03/11): o three escrevia no programa o número exato de cópias de cada InstancedMesh (capim,
     árvores, pedras de cada bloco do mundo) e de ossos de cada esqueleto — array<mat4, N> —, então cada bloco com uma contagem diferente
     virava um programa novo: 149 programas de vértice com o jogador parado, e o quadro travava a cada bloco que entrava. Com o limite do
     buffer uniforme em zero, o three usa o caminho que não depende da contagem (matrizes como atributo por instância, ossos numa textura):
     os blocos iguais passam a dividir o mesmo programa. */
  R.backend.capabilities.getUniformBufferLimit = () => 0;
  /* SEM ENGASGO (03/11, Erling: "a cada 5 segundos os frames travam"): cada material novo que entra na tela (bloco de chão, casa, NPC, golpe)
     pede um programa novo à placa, e montar programa de forma síncrona para o quadro por dezenas de ms. O three já sabe montar em segundo
     plano (createRenderPipelineAsync) e pular o objeto até ficar pronto — só não fazia isso fora do compileAsync. Agora faz sempre:
     o objeto novo aparece um ou dois quadros depois, e o jogo não para. */
  { const P = R._pipelines, sink: unknown[] = []; P.updateForRender = function (this: any, ro: any) { this.getForRender(ro, sink); if (sink.length > 256) sink.length = 0; }; }
  /* medidor: quantos programas (pipelines) o WebGPU montou e de quê — montar programa no meio do jogo é o que engasga o quadro */
  { const B = R.backend, o = B.createRenderPipeline.bind(B); B.createRenderPipeline = (ro: any, p: any) => { gpuState.pipes++; const m = ro?.material; if (gpuState.pipeLog.length < 400) gpuState.pipeLog.push(`${Math.round(performance.now())} ${m?.type}:${m?.name || ''}:${ro?.object?.name || ro?.object?.type}`); return o(ro, p); }; }
  /* GEOMETRIA DIVIDIDA COM O WEBGL: o three 0.186 trocava, no próprio atributo do jogo, os índices de osso de 16 bits (skinIndex) por 32 bits
     ao subir para o WebGPU. Os WebGL à parte (retratos, Limiar, boneco da ficha, vitrine) desenham a MESMA geometria e passavam a ver
     inteiros de 32 bits onde o shader espera vec4 — GL_INVALID_OPERATION. O WebGPU aceita 16 bits (uint16x2/x4, com o passo alinhado em 4),
     então o array do jogo fica como está; só o índice de 8 bits (que o WebGPU não tem) continua sendo convertido. */
  { const AU = R.backend.attributeUtils, oCA = AU.createAttribute.bind(AU), IDX = (globalThis as any).GPUBufferUsage?.INDEX ?? 16;
    AU.createAttribute = (a: any, usage: number) => { const arr = a.isInterleavedBufferAttribute ? null : a.array, C = arr?.constructor;
      const keep16 = a.normalized === false && (C === Uint16Array || C === Int16Array || ((C === Uint8Array || C === Int8Array) && !(usage & IDX) && (a.itemSize === 2 || a.itemSize === 4)));
      if (!keep16) return oCA(a, usage); a.normalized = null; try { return oCA(a, usage); } finally { a.normalized = false; } }; }
  gpuState.on = true; gpuState.backend = 'webgpu';
  /* qualquer erro do WebGPU (validação, memória) é contado em silêncio; se a placa "se perder" (driver reiniciou, placa saiu), o jogo
     volta para o WebGL na hora (main.ts: gpuState.lost) */
  const dev = R.backend.device; if (dev) dev.onuncapturederror = (ev: { error: unknown }) => gpuErr(ev.error);
  dev?.lost?.then((i: { message: string; reason?: string }) => { if (i.reason === 'destroyed') return; gpuState.why = 'perdido: ' + i.message; gpuState.lost = true; console.warn('[WebGPU] dispositivo perdido:', i.message); });
  return R as THREE.WebGLRenderer;
}

/** o pós-processamento do WebGPU com a mesma cara do composer do WebGL: brilho, grade de cor, vinheta, 16 bits com pontilhado (Pixel) */
export function createGPUPost(R: any, getSC: () => [THREE.Scene, THREE.Camera], bl: { strength: number; radius: number; threshold: number }, fin: Record<string, Ref>) {
  /* o quadro em DUAS etapas, como o DualRenderPass do WebGL: primeiro o cenário (camada 0: chão, casas, anéis e marcas no chão), depois os
     personagens, bichos e efeitos (camada 1) por cima, com a profundidade do cenário. Assim o que é do chão e desenha sem profundidade
     (o anel de vida/estamina do herói) fica ATRÁS do herói, e não por cima (Erling, 03/11: "a barra está passando por cima do personagem") */
  const sceneRT = new THREE.RenderTarget(2, 2, { type: THREE.HalfFloatType, depthBuffer: true }); const col = texture(sceneRT.texture);
  const shadowLights: THREE.Light[] = []; let tick = 0;
  /* LUZES FIXAS (03/11, Erling: "travando a cada 5 segundos"): no WebGPU, cada vez que o CONJUNTO de luzes da cena muda (uma tocha que
     entra com o bloco do mundo, a lanterna de um NPC, a luz de um golpe), todos os materiais na tela são remontados — 1 a 2 s parado.
     Agora o WebGPU vê sempre as mesmas 14 luzes pontuais (as mesmas 14 que o WebGL acende): a cada quadro elas copiam posição, cor, força e alcance das luzes reais mais perto
     do centro da tela. As luzes reais ficam numa camada que a câmera não desenha (31). Muda só valor de uniforme: nada é remontado. */
  const POOL_N = 14, pool: THREE.PointLight[] = []; let poolScene: THREE.Scene | null = null, reals: THREE.PointLight[] = [], rlPatched = false;
  const tgt = new THREE.Vector3(), dir = new THREE.Vector3(), cand: { d: number; l: THREE.PointLight; p: THREE.Vector3 }[] = [], wps: THREE.Vector3[] = [];
  const onStage = (o: THREE.Object3D, sc: THREE.Scene) => { let q: THREE.Object3D | null = o; while (q) { if (!q.visible) return false; if (q === sc) return true; q = q.parent; } return false; };
  function lightsFrame(s: THREE.Scene, cam: THREE.Camera) {
    if (!rlPatched) { const inst = R._renderLists?.get?.(s, cam, R.lighting), RL = inst && Object.getPrototypeOf(inst); if (RL && !RL.__kPool) { const o = RL.pushLight; RL.pushLight = function (this: any, l: any) { if (l.isPointLight && !l.userData.gpuPool) return; return o.call(this, l); }; RL.__kPool = true; } rlPatched = true; }
    if (poolScene !== s) { if (!pool.length) for (let i = 0; i < POOL_N; i++) { const p = new THREE.PointLight(0xffffff, 0, 1, 2); p.userData.gpuPool = true; p.castShadow = false; pool.push(p); }
      for (const p of pool) { p.removeFromParent(); s.add(p); p.layers.enableAll(); } poolScene = s; tick = 0; }
    if ((tick % 10) === 0) { reals = []; shadowLights.length = 0;
      s.traverse((o) => { const l = o as THREE.PointLight; if (!l.isLight || l.userData.gpuPool) return; if (l.isPointLight) { reals.push(l); return; }
        l.layers.enableAll(); const sl = l as unknown as THREE.DirectionalLight; if (sl.shadow) { sl.shadow.camera?.layers.enableAll(); if (sl.castShadow) shadowLights.push(sl); } }); }
    (cam as THREE.PerspectiveCamera).getWorldDirection(dir); tgt.copy(cam.position).addScaledVector(dir, 60); cand.length = 0;
    for (let i = 0; i < reals.length; i++) { const l = reals[i]; if (l.intensity <= 0 || !onStage(l, s)) continue; const w = wps[i] ?? (wps[i] = new THREE.Vector3()); l.getWorldPosition(w); cand.push({ d: w.distanceTo(tgt) - (l.distance || 30) * 0.5, l, p: w }); }
    cand.sort((a, b) => a.d - b.d);
    for (let i = 0; i < POOL_N; i++) { const p = pool[i], c = cand[i]; if (c) { p.position.copy(c.p); p.color.copy(c.l.color); p.intensity = c.l.intensity; p.distance = c.l.distance; p.decay = c.l.decay; } else p.intensity = 0; p.updateMatrixWorld(true); }
  }
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
  /* 04/11 (Erling: "a luminosidade está estourando no personagem e em superfícies como papel… a lâmpada tão brilhante que não vemos a
     armação"): ombro suave nas altas luzes — acima de 0,78 a cor cresce cada vez menos (nunca chega no branco chapado), então o vidro do
     lampião, o papel e a pele perto da luz guardam forma e textura. Abaixo de 0,78 nada muda: o resto da imagem fica igual. */
  const knee = (x: any) => { const k = max(x.sub(0.78), 0); return x.sub(k).add(k.div(k.mul(2.6).add(1))); };
  const cmS = vec3(knee(cm.x), knee(cm.y), knee(cm.z));
  const out = select(uQ.greaterThan(0.5), cq, cmS);
  /* teste sem tela (Playwright): ?gpuoff=1 desenha num alvo fora da tela — no navegador sem monitor, apresentar no canvas derruba o WebGPU */
  const OFF = /[?&]gpuoff=1/.test(location.search); let offRT: any = null;
  const post = new (W as any).RenderPipeline(R); post.outputColorTransform = false; const DBG = Number(new URLSearchParams(location.search).get('gpudbg') || 0); const cg = c; post.outputNode = DBG === 5 ? vec4(cg, 1) : DBG === 6 ? vec4(cm, 1) : DBG === 7 ? vec4(cq, 1) : DBG === 3 ? vec4(renderOutput(lin).rgb, 1) : DBG === 4 ? vec4(bn.rgb, 1) : DBG === 1 ? vec4(renderOutput(col).rgb, 1) : DBG === 2 ? vec4(col.rgb, 1) : vec4(out, 1);
  return {
    passes: [] as unknown[], addPass(p: unknown) { this.passes.push(p); }, setSize() { /* o PassNode acompanha o tamanho do renderizador */ },
    render() { const [s, cam] = getSC(); const cw = R.domElement.width, ch = R.domElement.height; if (sceneRT.width !== cw || sceneRT.height !== ch) sceneRT.setSize(cw, ch);
      lightsFrame(s, cam); tick++; gpuState.frame++;
      const prev = R.getRenderTarget(), ac = R.autoClear;
      R.setRenderTarget(sceneRT); R.autoClear = true; R.clear(true, true, true); /* 04/11 (Erling: "um arrasto cabuloso quando ando"): limpa cor e profundidade do quadro na mão — em algumas placas o quadro anterior ficava e o chão novo não passava no teste de profundidade onde o personagem esteve, deixando um rastro */ cam.layers.set(0); R.render(s, cam);
      const bg = s.background; s.background = null; R.autoClear = false; for (const l of shadowLights) (l as THREE.DirectionalLight).shadow.autoUpdate = false; /* a sombra já saiu na 1ª etapa */
      cam.layers.set(1); R.render(s, cam); { const d = gpuState.dc; d.push(R.info.render.drawCalls); if (d.length > 900) d.splice(0, 300); }
      for (const l of shadowLights) (l as THREE.DirectionalLight).shadow.autoUpdate = true; s.background = bg; cam.layers.enableAll(); R.autoClear = ac; R.setRenderTarget(prev);
      if (OFF && R.getRenderTarget() === null) { const cw = R.domElement.width, ch = R.domElement.height; if (!offRT || offRT.width !== cw || offRT.height !== ch) { offRT?.dispose(); offRT = new THREE.RenderTarget(cw, ch); } R.setRenderTarget(offRT); }
      bn.strength.value = bl.strength; bn.radius.value = bl.radius; bn.threshold.value = bl.threshold; post.render(); gpuFlushDestroy(); if (OFF && R.getRenderTarget() === offRT) R.setRenderTarget(null); },
    /** teste: o quadro final lido de volta (o WebGPU não deixa ler o canvas depois de apresentado) → dataURL */
    async shot(w = 640) { const cw = R.domElement.width, ch = R.domElement.height, h = Math.round(w * ch / cw); if (!OFF) throw new Error('shot: só no modo de teste (?gpuoff=1)'); this.render(); const rt = offRT; /* lê o próprio quadro fora da tela (sem trocar de alvo) */
      const px: Uint8Array = await R.readRenderTargetPixelsAsync(rt, 0, 0, cw, ch);
      const c = document.createElement('canvas'); c.width = cw; c.height = ch; const g = c.getContext('2d')!, im = g.createImageData(cw, ch); im.data.set(px); g.putImageData(im, 0, 0);
      const o = document.createElement('canvas'); o.width = w; o.height = h; o.getContext('2d')!.drawImage(c, 0, 0, w, h); return o.toDataURL('image/png'); },
  };
}
void [cos, cameraViewMatrix, modelWorldMatrix];
