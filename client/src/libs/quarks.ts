/* 10/11 three.quarks (MIT) — Erling: "three.quarks essencial".
   Partículas de verdade para as magias: cada efeito é um pequeno sistema (forma de saída, vida, cor ao longo da vida, tamanho ao longo
   da vida, turbulência, gravidade), desenhado em LOTE por um único BatchedRenderer — centenas de partículas em poucas chamadas de desenho.
   Só no modo WebGL (o WebGPU do jogo segue com as partículas antigas). Cada chamada nasce, estoura e se apaga sozinha. */
import * as THREE from 'three';
import {
  BatchedRenderer, ParticleSystem, RenderMode, ConeEmitter, SphereEmitter, PointEmitter, IntervalValue, ConstantValue, ColorRange, ColorOverLife, Gradient,
  SizeOverLife, PiecewiseBezier, Bezier, Noise, ApplyForce, RotationOverLife, OrbitOverLife, Vector3 as QV3, Vector4 as QV4,
} from 'three.quarks';

export type QKind = 'fire' | 'frost' | 'holy' | 'poison' | 'shadow' | 'blood' | 'arcane' | 'spark' | 'nature' | 'earth';

let batch: BatchedRenderer | null = null, scene: THREE.Scene | null = null, live = 0;
const tex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d')!; const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.3, 'rgba(255,255,255,.7)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const bubbleTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d')!; g.strokeStyle = 'rgba(255,255,255,.95)'; g.lineWidth = 5; g.beginPath(); g.arc(32, 32, 24, 0, 7); g.stroke(); g.fillStyle = 'rgba(255,255,255,.25)'; g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(24, 22, 5, 0, 7); g.fill(); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const MAT = { add: new THREE.MeshBasicMaterial({ map: tex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }), norm: new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }), bub: new THREE.MeshBasicMaterial({ map: bubbleTex, transparent: true, depthWrite: false }) };

const c4 = (hex: number, a = 1) => { const c = new THREE.Color(hex); return new QV4(c.r, c.g, c.b, a); };
const c3 = (hex: number) => { const c = new THREE.Color(hex); return new QV3(c.r, c.g, c.b); };
const grad = (cols: [number, number][], alpha: [number, number][]) => new ColorOverLife(new Gradient(cols.map(([h, p]) => [c3(h), p] as [QV3, number]), alpha));
const shrink = () => new SizeOverLife(new PiecewiseBezier([[new Bezier(1, 0.9, 0.5, 0), 0]]));
const growFade = () => new SizeOverLife(new PiecewiseBezier([[new Bezier(0.4, 1, 1.2, 1.3), 0]]));

/** liga o sistema (main.ts, só em WebGL) */
export function quarksInit(sc: THREE.Scene) { if (batch) return; scene = sc; batch = new BatchedRenderer(); batch.renderOrder = 15; sc.add(batch); }
export function quarksUpdate(dt: number) { if (batch && live > 0) batch.update(Math.min(dt, 0.1)); }
export const quarksOn = () => !!batch;

/** um estouro do elemento `k` em (x,y,z); `s` escala tamanho e quantidade */
export function quarksFx(k: QKind, x: number, y: number, z: number, s = 1) {
  if (!batch || !scene || live > 40) return; // teto: no máximo 40 efeitos vivos ao mesmo tempo
  const n = (v: number) => Math.round(v * Math.min(2, Math.max(0.5, s)));
  const P: Record<QKind, () => ParticleSystem> = {
    fire: () => new ParticleSystem({ duration: 0.5, looping: false, shape: new ConeEmitter({ radius: 0.4 * s, angle: 0.5 }), startLife: new IntervalValue(0.5, 0.9), startSpeed: new IntervalValue(1.5, 4 * s), startSize: new IntervalValue(0.5 * s, 1.1 * s), startColor: new ColorRange(c4(0xffe08a), c4(0xff7a20)), emissionOverTime: new ConstantValue(0), emissionBursts: [{ time: 0, count: new ConstantValue(n(50)), cycle: 1, interval: 0.01, probability: 1 }], material: MAT.add, renderMode: RenderMode.BillBoard,
      behaviors: [grad([[0xfff0b0, 0], [0xff8a20, 0.35], [0xc02008, 0.7], [0x200404, 1]], [[1, 0], [0.9, 0.5], [0, 1]]), shrink(), new Noise(new ConstantValue(2), new ConstantValue(1.2)), new ApplyForce(new QV3(0, 1, 0), new ConstantValue(3))] }),
    frost: () => new ParticleSystem({ duration: 0.4, looping: false, shape: new SphereEmitter({ radius: 0.5 * s }), startLife: new IntervalValue(0.6, 1.1), startSpeed: new IntervalValue(2, 5 * s), startSize: new IntervalValue(0.25 * s, 0.6 * s), startRotation: new IntervalValue(0, 6.28), startColor: new ColorRange(c4(0xffffff), c4(0x8ad8ff)), emissionOverTime: new ConstantValue(0), emissionBursts: [{ time: 0, count: new ConstantValue(n(45)), cycle: 1, interval: 0.01, probability: 1 }], material: MAT.add, renderMode: RenderMode.StretchedBillBoard, rendererEmitterSettings: { speedFactor: 0.12, lengthFactor: 0 },
      behaviors: [grad([[0xffffff, 0], [0x9ad8ff, 0.6], [0x2a6aa8, 1]], [[1, 0], [0, 1]]), shrink(), new ApplyForce(new QV3(0, -1, 0), new ConstantValue(4))] }),
    holy: () => new ParticleSystem({ duration: 0.6, looping: false, shape: new SphereEmitter({ radius: 1.2 * s, thickness: 1 }), startLife: new IntervalValue(0.8, 1.4), startSpeed: new IntervalValue(0.3, 1.2), startSize: new IntervalValue(0.2 * s, 0.5 * s), startColor: new ColorRange(c4(0xfff6c0), c4(0xffd27a)), emissionOverTime: new ConstantValue(0), emissionBursts: [{ time: 0, count: new ConstantValue(n(40)), cycle: 1, interval: 0.01, probability: 1 }], material: MAT.add, renderMode: RenderMode.BillBoard,
      behaviors: [grad([[0xffffff, 0], [0xffe08a, 0.5], [0xffb040, 1]], [[0, 0], [1, 0.15], [0, 1]]), new ApplyForce(new QV3(0, 1, 0), new ConstantValue(2.5)), new OrbitOverLife(new ConstantValue(2))] }),
    poison: () => new ParticleSystem({ duration: 0.8, looping: false, shape: new SphereEmitter({ radius: 0.7 * s }), startLife: new IntervalValue(0.8, 1.6), startSpeed: new IntervalValue(0.2, 0.8), startSize: new IntervalValue(0.15 * s, 0.4 * s), startColor: new ColorRange(c4(0x6a8a2a), c4(0x3a5a10)), emissionOverTime: new ConstantValue(0), emissionBursts: [{ time: 0, count: new ConstantValue(n(26)), cycle: 1, interval: 0.01, probability: 1 }, { time: 0.3, count: new ConstantValue(n(14)), cycle: 1, interval: 0.01, probability: 1 }], material: MAT.bub, renderMode: RenderMode.BillBoard,
      behaviors: [grad([[0x8aa83a, 0], [0x4a6a1a, 0.7], [0x2a3a08, 1]], [[0.9, 0], [0.9, 0.85], [0, 1]]), growFade(), new ApplyForce(new QV3(0, 1, 0), new ConstantValue(1.2)), new Noise(new ConstantValue(1.5), new ConstantValue(0.4))] }),
    shadow: () => new ParticleSystem({ duration: 0.6, looping: false, shape: new SphereEmitter({ radius: 0.8 * s }), startLife: new IntervalValue(0.8, 1.4), startSpeed: new IntervalValue(0.5, 2), startSize: new IntervalValue(0.8 * s, 1.6 * s), startRotation: new IntervalValue(0, 6.28), startColor: new ColorRange(c4(0x3a1a5a, 0.85), c4(0x100418, 0.85)), emissionOverTime: new ConstantValue(0), emissionBursts: [{ time: 0, count: new ConstantValue(n(30)), cycle: 1, interval: 0.01, probability: 1 }], material: MAT.norm, renderMode: RenderMode.BillBoard,
      behaviors: [grad([[0x6a3aa8, 0], [0x2a0a40, 0.5], [0x000000, 1]], [[0.8, 0], [0, 1]]), growFade(), new RotationOverLife(new IntervalValue(-1, 1)), new Noise(new ConstantValue(1), new ConstantValue(0.8))] }),
    blood: () => new ParticleSystem({ duration: 0.3, looping: false, shape: new ConeEmitter({ radius: 0.2, angle: 0.9 }), startLife: new IntervalValue(0.4, 0.8), startSpeed: new IntervalValue(2, 6 * s), startSize: new IntervalValue(0.12 * s, 0.3 * s), startColor: new ColorRange(c4(0xd81a2a), c4(0x6a0408)), emissionOverTime: new ConstantValue(0), emissionBursts: [{ time: 0, count: new ConstantValue(n(30)), cycle: 1, interval: 0.01, probability: 1 }], material: MAT.norm, renderMode: RenderMode.StretchedBillBoard, rendererEmitterSettings: { speedFactor: 0.1, lengthFactor: 0 },
      behaviors: [grad([[0xff3a3a, 0], [0x8a0a14, 0.5], [0x3a0204, 1]], [[1, 0], [0, 1]]), new ApplyForce(new QV3(0, -1, 0), new ConstantValue(12))] }),
    arcane: () => new ParticleSystem({ duration: 0.5, looping: false, shape: new SphereEmitter({ radius: 0.6 * s }), startLife: new IntervalValue(0.6, 1.0), startSpeed: new IntervalValue(1, 3 * s), startSize: new IntervalValue(0.2 * s, 0.45 * s), startColor: new ColorRange(c4(0xd8e8ff), c4(0x6ab0ff)), emissionOverTime: new ConstantValue(0), emissionBursts: [{ time: 0, count: new ConstantValue(n(40)), cycle: 1, interval: 0.01, probability: 1 }], material: MAT.add, renderMode: RenderMode.BillBoard,
      behaviors: [grad([[0xffffff, 0], [0x8ab8ff, 0.4], [0x6a3ad8, 1]], [[1, 0], [0, 1]]), new OrbitOverLife(new ConstantValue(4)), shrink()] }),
    spark: () => new ParticleSystem({ duration: 0.2, looping: false, shape: new PointEmitter(), startLife: new IntervalValue(0.2, 0.45), startSpeed: new IntervalValue(5, 12 * s), startSize: new IntervalValue(0.06, 0.14), startColor: new ColorRange(c4(0xffffff), c4(0xffd890)), emissionOverTime: new ConstantValue(0), emissionBursts: [{ time: 0, count: new ConstantValue(n(30)), cycle: 1, interval: 0.01, probability: 1 }], material: MAT.add, renderMode: RenderMode.StretchedBillBoard, rendererEmitterSettings: { speedFactor: 0.06, lengthFactor: 0 },
      behaviors: [grad([[0xffffff, 0], [0xffb040, 1]], [[1, 0], [0, 1]]), new ApplyForce(new QV3(0, -1, 0), new ConstantValue(9))] }),
    nature: () => new ParticleSystem({ duration: 0.5, looping: false, shape: new SphereEmitter({ radius: 0.8 * s }), startLife: new IntervalValue(0.8, 1.5), startSpeed: new IntervalValue(1, 3), startSize: new IntervalValue(0.15 * s, 0.35 * s), startRotation: new IntervalValue(0, 6.28), startColor: new ColorRange(c4(0xb8e870), c4(0x5a9a3a)), emissionOverTime: new ConstantValue(0), emissionBursts: [{ time: 0, count: new ConstantValue(n(30)), cycle: 1, interval: 0.01, probability: 1 }], material: MAT.norm, renderMode: RenderMode.BillBoard,
      behaviors: [grad([[0xc8f080, 0], [0x5a9a3a, 1]], [[1, 0], [0, 1]]), new RotationOverLife(new IntervalValue(-4, 4)), new ApplyForce(new QV3(0, -1, 0), new ConstantValue(1.5)), new Noise(new ConstantValue(1), new ConstantValue(1))] }),
    earth: () => new ParticleSystem({ duration: 0.3, looping: false, shape: new ConeEmitter({ radius: 0.6 * s, angle: 0.7 }), startLife: new IntervalValue(0.6, 1.1), startSpeed: new IntervalValue(2, 5 * s), startSize: new IntervalValue(0.5 * s, 1.2 * s), startColor: new ColorRange(c4(0xb8a888, 0.8), c4(0x6a5a40, 0.8)), emissionOverTime: new ConstantValue(0), emissionBursts: [{ time: 0, count: new ConstantValue(n(28)), cycle: 1, interval: 0.01, probability: 1 }], material: MAT.norm, renderMode: RenderMode.BillBoard,
      behaviors: [grad([[0xc8b898, 0], [0x5a4a38, 1]], [[0.8, 0], [0, 1]]), growFade(), new ApplyForce(new QV3(0, -1, 0), new ConstantValue(5))] }),
  };
  const sys = P[k](); sys.emitter.position.set(x, y, z); sys.emitter.name = 'quarks:' + k; scene.add(sys.emitter); batch.addSystem(sys); live++;
  /* fim do efeito: sai do lote e da cena */
  const life = 2.2; setTimeout(() => { try { batch?.deleteSystem(sys); sys.emitter.parent?.remove(sys.emitter); sys.dispose(); } catch { /* */ } live--; }, life * 1000);
}
