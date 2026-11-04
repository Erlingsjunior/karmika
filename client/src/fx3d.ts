import * as THREE from 'three';
import { gpuHooks } from './gpu/tags';

export function radialTexture(size: number, stops: [number, string][]): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  const r = size / 2, gr = g.createRadialGradient(r, r, 0, r, r, r);
  stops.forEach(([o, col]) => gr.addColorStop(o, col));
  g.fillStyle = gr; g.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const TC0 = new THREE.Color(), TC1 = new THREE.Color();

/** Partículas aditivas (chamas, brasas, aura, poeira) em um único draw call.
 *  03/11 (Erling: "jogar coisas do processador para a GPU"): o movimento é calculado na placa de vídeo. O processador só escreve
 *  a partícula quando ela nasce (posição, velocidade, cores, tempos); a cada quadro sobe só um número (o relógio). Antes eram
 *  7.000 partículas atualizadas uma a uma no processador e ~4 buffers inteiros reenviados por quadro. */
export class Particles {
  /** densidade global (opções): abaixo de 1 descarta parte das partículas sorteadas */
  density = 1;
  readonly points: THREE.Points;
  private n: number;
  private p0: Float32Array; private v0: Float32Array; private tl: Float32Array; private sz: Float32Array; private c0: Float32Array; private c1: Float32Array; private ph: Float32Array;
  private cursor = 0; private t = 0; private lo = -1; private hi = -1; private wrapped = false;
  readonly uniforms = { uPx: { value: 20 }, uDist: { value: 60 }, uMap: { value: radialTexture(64, [[0, 'rgba(255,255,255,1)'], [0.4, 'rgba(255,255,255,.5)'], [1, 'rgba(255,255,255,0)']]) }, uT: { value: 0 }, uWind: { value: new THREE.Vector2() } };
  readonly wind = { x: 0, z: 0 };
  constructor(n = 4200) {
    this.n = n;
    const f = (k: number) => new Float32Array(n * k);
    this.p0 = f(3); this.v0 = f(3); this.tl = f(3); this.sz = f(2); this.c0 = f(3); this.c1 = f(3); this.ph = f(4);
    for (let i = 0; i < n; i++) this.tl[i * 3 + 1] = -1; /* vida < 0 = apagada */
    const g = new THREE.BufferGeometry();
    const A = (a: Float32Array, k: number) => { const b = new THREE.BufferAttribute(a, k); b.setUsage(THREE.DynamicDrawUsage); return b; };
    g.setAttribute('position', A(this.p0, 3)); g.setAttribute('aV0', A(this.v0, 3)); g.setAttribute('aTL', A(this.tl, 3)); g.setAttribute('aSz', A(this.sz, 2));
    g.setAttribute('aC0', A(this.c0, 3)); g.setAttribute('aC1', A(this.c1, 3)); g.setAttribute('aPh', A(this.ph, 4));
    const m = new THREE.ShaderMaterial({
      uniforms: this.uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `attribute vec3 aV0; attribute vec3 aTL; attribute vec2 aSz; attribute vec3 aC0; attribute vec3 aC1; attribute vec4 aPh;
        uniform float uPx; uniform float uDist; uniform float uT; uniform vec2 uWind; varying vec3 vC; varying float vA;
        /* dv/dt = A - r·v  →  x(t) = x0 + (A/r)·t + (v0 - A/r)·(1 - e^(-r·t))/r  (r = arrasto, +1,4 do vento no plano) */
        float mv1(float x0, float v0, float A, float r, float t) { if (r < 1e-4) return x0 + v0 * t + 0.5 * A * t * t; float vi = A / r; return x0 + vi * t + (v0 - vi) * (1.0 - exp(-r * t)) / r; }
        void main(){
          float age = uT - aTL.x, life = aTL.y; float k = age / max(life, 1e-4);
          if (life <= 0.0 || age < 0.0 || k >= 1.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; vA = 0.0; vC = vec3(0.0); return; }
          float drag = aPh.x, grav = aPh.y, wf = aPh.z, flit = aPh.w, kw = wf > 0.0 ? 1.4 : 0.0;
          vec3 p; p.x = mv1(position.x, aV0.x, kw * uWind.x * wf, drag + kw, age); p.z = mv1(position.z, aV0.z, kw * uWind.y * wf, drag + kw, age); p.y = mv1(position.y, aV0.y, -grav, drag, age);
          if (flit > 0.0) { float ph = aTL.z; p += flit * 0.12 * vec3(sin(age * 5.0 + ph), 0.6 * sin(age * 7.0 + ph * 1.3), cos(age * 4.0 + ph)); }
          vC = mix(aC0, aC1, k); vA = k < 0.15 ? k / 0.15 : 1.0 - (k - 0.15) / 0.85;
          float size = mix(aSz.x, aSz.y, k);
          vec4 mvp = modelViewMatrix * vec4(p, 1.0); gl_PointSize = size * uPx * uDist / max(1.0, -mvp.z); gl_Position = projectionMatrix * mvp; }`,
      fragmentShader: 'uniform sampler2D uMap; varying vec3 vC; varying float vA; void main(){ float a = texture2D(uMap, gl_PointCoord).a * vA; if(a<0.01) discard; gl_FragColor = vec4(vC*a, a); }',
    });
    this.points = new THREE.Points(g, m);
    if (gpuHooks.particles) this.points = gpuHooks.particles(g, this.uniforms, n) as unknown as THREE.Points; /* WebGPU: quadradinhos por instância (o ponto do WebGPU tem 1 pixel) */
    this.points.frustumCulled = false;
  }

  spawn(x: number, y: number, z: number, o: { vx?: number; vy?: number; vz?: number; life: number; s0: number; s1: number; c0: number; c1: number; a?: number; drag?: number; w?: number; g?: number; flit?: number; /** formato: 0 brilho, 1 faísca, 2 chama (sem isso, escolhe pela velocidade e cor) */ k?: 0 | 1 | 2 }) {
    if (this.density < 1 && Math.random() > this.density) return;
    const i = this.cursor; this.cursor = (this.cursor + 1) % this.n; if (this.cursor === 0) this.wrapped = true;
    if (this.lo < 0) this.lo = i; this.hi = i;
    this.p0[i * 3] = x; this.p0[i * 3 + 1] = y; this.p0[i * 3 + 2] = z;
    this.v0[i * 3] = o.vx ?? 0; this.v0[i * 3 + 1] = o.vy ?? 0; this.v0[i * 3 + 2] = o.vz ?? 0;
    /* o FORMATO da partícula (04/11): 0 = brilho redondo, 1 = faísca (esticada pela velocidade), 2 = chama (língua de fogo que ondula).
       Vai junto da fase em aTL.z (formato × 10000 + fase) para não subir mais um buffer; no WebGL o formato não muda nada (só a fase). */
    const vx = o.vx ?? 0, vy = o.vy ?? 0, vz = o.vz ?? 0, sp2 = vx * vx + vy * vy + vz * vz, h1 = o.c1, r1 = (h1 >> 16) & 255, g1 = (h1 >> 8) & 255, b1 = h1 & 255;
    const kind = o.k ?? (sp2 > 12 && o.s0 <= 0.35 ? 1 : (r1 > 0xb0 && g1 < r1 * 0.8 && b1 < g1 && vy >= 0 && (o.g ?? 0) <= 0 && o.s0 >= 0.15 && sp2 < 12) ? 2 : 0);
    this.tl[i * 3] = this.t; this.tl[i * 3 + 1] = o.life; this.tl[i * 3 + 2] = kind * 10000 + ((i * 1.7) % 6283) / 10;
    this.sz[i * 2] = o.s0; this.sz[i * 2 + 1] = o.s1;
    const a = TC0.setHex(o.c0), b = TC1.setHex(o.c1), al = (o.a ?? 1) * (o.a ?? 1); /* a transparência inicial entra na cor ao quadrado: na mistura aditiva dá o mesmo brilho de antes (cor × a²) */
    this.c0[i * 3] = a.r * al; this.c0[i * 3 + 1] = a.g * al; this.c0[i * 3 + 2] = a.b * al; this.c1[i * 3] = b.r * al; this.c1[i * 3 + 1] = b.g * al; this.c1[i * 3 + 2] = b.b * al;
    this.ph[i * 4] = o.drag ?? 0; this.ph[i * 4 + 1] = o.g ?? 0; this.ph[i * 4 + 2] = o.w ?? 0; this.ph[i * 4 + 3] = o.flit ?? 0;
  }

  update(dt: number) {
    this.t += dt; this.uniforms.uT.value = this.t; this.uniforms.uWind.value.set(this.wind.x, this.wind.z);
    if (this.lo < 0) return;
    const g = this.points.geometry, names = ['position', 'aV0', 'aTL', 'aSz', 'aC0', 'aC1', 'aPh'];
    for (const nm of names) { const at = g.attributes[nm] as THREE.BufferAttribute; at.clearUpdateRanges();
      if (this.wrapped || this.hi < this.lo) at.addUpdateRange(0, this.n * at.itemSize); else at.addUpdateRange(this.lo * at.itemSize, (this.hi - this.lo + 1) * at.itemSize); at.needsUpdate = true; }
    this.lo = this.hi = -1; this.wrapped = false;
  }
}

/** Névoa baixa: manchas grandes que somem perto do jogador e se acendem perto das chamas. */
export class Mist {
  readonly group = new THREE.Group();
  private items: { s: THREE.Sprite; bx: number; bz: number; sp: number; ph: number; base: number }[] = [];
  constructor(cx: number, cz: number, spread: number, n: number) {
    const map = radialTexture(256, [[0, 'rgba(255,255,255,.6)'], [0.55, 'rgba(255,255,255,.2)'], [1, 'rgba(255,255,255,0)']]);
    for (let i = 0; i < n; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map, transparent: true, depthWrite: false, opacity: 0 }));
      const a = i * 2.4, d = spread * (0.15 + ((i * 37) % 10) / 11);
      const bx = cx + Math.cos(a) * d, bz = cz + Math.sin(a) * d;
      const sc = 12 + ((i * 13) % 7) * 2.2;
      s.scale.set(sc * 1.5, sc * 0.6, 1);
      s.position.set(bx, 0.9 + ((i * 7) % 4) * 0.35, bz);
      this.items.push({ s, bx, bz, sp: 0.05 + (i % 5) * 0.015, ph: i * 1.3, base: 0.16 + ((i * 7) % 5) * 0.015 });
      this.group.add(s);
    }
  }
  update(t: number, hero: THREE.Vector3, lights: { pos: THREE.Vector3; r: number }[], day: number, wind: number) {
    const dayCol = new THREE.Color(0xc4d2e4), nightCol = new THREE.Color(0x4a5f86), warm = new THREE.Color(0xffa860);
    const baseCol = nightCol.clone().lerp(dayCol, day);
    for (const it of this.items) {
      it.s.position.x = it.bx + Math.sin(t * it.sp * (1 + wind) + it.ph) * (5 + wind * 4);
      it.s.position.z = it.bz + Math.cos(t * it.sp * 0.8 + it.ph) * 2;
      const dh = Math.hypot(it.s.position.x - hero.x, it.s.position.z - hero.z);
      const far = THREE.MathUtils.smoothstep(dh, 11, 20); // some perto do jogador
      let glow = 0;
      for (const l of lights) { const d = Math.hypot(it.s.position.x - l.pos.x, it.s.position.z - l.pos.z); glow += Math.exp(-(d * d) / (l.r * l.r)); }
      glow = Math.min(1, glow);
      const m = it.s.material as THREE.SpriteMaterial;
      m.color.copy(baseCol).lerp(warm, glow * 0.8);
      m.opacity = it.base * far * (0.5 + 0.5 * (1 - day * 0.6)) * (1 + glow * 0.8);
    }
  }
}
