import * as THREE from 'three';

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

/** Partículas aditivas (chamas, brasas, aura, poeira) em um único draw call. */
export class Particles {
  readonly points: THREE.Points;
  private n: number;
  private pos: Float32Array; private col: Float32Array; private size: Float32Array; private alpha: Float32Array;
  private vel: Float32Array; private life: Float32Array; private max: Float32Array;
  private s0: Float32Array; private s1: Float32Array; private c0: Float32Array; private c1: Float32Array; private a0: Float32Array; private drag: Float32Array; private grav: Float32Array; private flit: Float32Array;
  private cursor = 0;
  readonly uniforms = { uPx: { value: 20 }, uDist: { value: 60 }, uMap: { value: radialTexture(64, [[0, 'rgba(255,255,255,1)'], [0.4, 'rgba(255,255,255,.5)'], [1, 'rgba(255,255,255,0)']]) } };

  readonly wind = { x: 0, z: 0 };
  private wfac: Float32Array;
  constructor(n = 4200) {
    this.n = n;
    const f = (k: number) => new Float32Array(n * k);
    this.pos = f(3); this.col = f(3); this.size = f(1); this.alpha = f(1); this.vel = f(3); this.life = f(1); this.max = f(1);
    this.wfac = f(1); this.s0 = f(1); this.s1 = f(1); this.c0 = f(3); this.c1 = f(3); this.a0 = f(1); this.drag = f(1); this.grav = f(1); this.flit = f(1);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    g.setAttribute('aColor', new THREE.BufferAttribute(this.col, 3));
    g.setAttribute('aSize', new THREE.BufferAttribute(this.size, 1));
    g.setAttribute('aAlpha', new THREE.BufferAttribute(this.alpha, 1));
    const m = new THREE.ShaderMaterial({
      uniforms: this.uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: 'attribute vec3 aColor; attribute float aSize; attribute float aAlpha; varying vec3 vC; varying float vA; uniform float uPx; uniform float uDist; void main(){ vC=aColor; vA=aAlpha; vec4 mv = modelViewMatrix*vec4(position,1.0); gl_PointSize = aSize*uPx*uDist/max(1.0,-mv.z); gl_Position = projectionMatrix*mv; }',
      fragmentShader: 'uniform sampler2D uMap; varying vec3 vC; varying float vA; void main(){ float a = texture2D(uMap, gl_PointCoord).a * vA; if(a<0.01) discard; gl_FragColor = vec4(vC*a, a); }',
    });
    this.points = new THREE.Points(g, m);
    this.points.frustumCulled = false;
    for (let i = 0; i < n; i++) this.life[i] = 0;
  }

  spawn(x: number, y: number, z: number, o: { vx?: number; vy?: number; vz?: number; life: number; s0: number; s1: number; c0: number; c1: number; a?: number; drag?: number; w?: number; g?: number; flit?: number }) {
    const i = this.cursor; this.cursor = (this.cursor + 1) % this.n;
    this.pos[i * 3] = x; this.pos[i * 3 + 1] = y; this.pos[i * 3 + 2] = z;
    this.vel[i * 3] = o.vx ?? 0; this.vel[i * 3 + 1] = o.vy ?? 0; this.vel[i * 3 + 2] = o.vz ?? 0;
    this.life[i] = this.max[i] = o.life; this.s0[i] = o.s0; this.s1[i] = o.s1; this.a0[i] = o.a ?? 1; this.drag[i] = o.drag ?? 0; this.wfac[i] = o.w ?? 0; this.grav[i] = o.g ?? 0; this.flit[i] = o.flit ?? 0;
    const a = new THREE.Color(o.c0), b = new THREE.Color(o.c1);
    this.c0.set([a.r, a.g, a.b], i * 3); this.c1.set([b.r, b.g, b.b], i * 3);
  }

  update(dt: number) {
    for (let i = 0; i < this.n; i++) {
      if (this.life[i] <= 0) { this.alpha[i] = 0; continue; }
      this.life[i] -= dt;
      const k = 1 - Math.max(0, this.life[i]) / this.max[i];
      const wf = this.wfac[i];
      if (wf > 0) { const k2 = Math.min(1, dt * 1.4); this.vel[i * 3] += (this.wind.x * wf - this.vel[i * 3]) * k2; this.vel[i * 3 + 2] += (this.wind.z * wf - this.vel[i * 3 + 2]) * k2; }
      if (this.grav[i]) this.vel[i * 3 + 1] -= this.grav[i] * dt;
      if (this.flit[i]) { const f = this.flit[i], ph = i * 1.7; this.vel[i * 3] += Math.sin(this.max[i] * 9 - this.life[i] * (5 + (i % 5)) + ph) * f * dt; this.vel[i * 3 + 2] += Math.cos(this.life[i] * (4 + (i % 3)) + ph) * f * dt; this.vel[i * 3 + 1] += Math.sin(this.life[i] * (7 + (i % 4)) + ph) * f * 0.6 * dt; }
      const d = 1 - this.drag[i] * dt;
      for (let a = 0; a < 3; a++) { this.vel[i * 3 + a] *= d; this.pos[i * 3 + a] += this.vel[i * 3 + a] * dt; }
      this.size[i] = this.s0[i] + (this.s1[i] - this.s0[i]) * k;
      for (let a = 0; a < 3; a++) this.col[i * 3 + a] = this.c0[i * 3 + a] + (this.c1[i * 3 + a] - this.c0[i * 3 + a]) * k;
      this.alpha[i] = this.a0[i] * (k < 0.15 ? k / 0.15 : 1 - (k - 0.15) / 0.85);
    }
    const g = this.points.geometry;
    (g.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (g.attributes.aColor as THREE.BufferAttribute).needsUpdate = true;
    (g.attributes.aSize as THREE.BufferAttribute).needsUpdate = true;
    (g.attributes.aAlpha as THREE.BufferAttribute).needsUpdate = true;
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
