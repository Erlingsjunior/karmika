import * as THREE from 'three';
import { LAYER_WORLD, fine } from './dual3d';

/* ============================================================================================
   O LIMIAR — para onde a alma sobe quando o Fio da Vida se rompe (Erling, 23/10).
   - A alma chega ao CENTRO do labirinto cósmico: uma plataforma de luz suspensa sobre Karmika.
   - Lá embaixo, o labirinto vivo, até o horizonte: muros sobem e cedem, caminhos escurecem e clareiam, almas correm pelos corredores.
   - À esquerda, ORVALEN, o Leitor de Rastros: lê a vida passada e a devolve ou a apaga.
   - À direita, SAEL, a Que Voltou: a única que chegou ao centro e voltou; guia a volta.
   - Entre eles e o fundo, o OLHO KÁRMICO, olhando para você.
   - Bem ao fundo, num brilho, a silhueta calma de MARGHAR, debruçado sobre a piscina cósmica, vendo tudo.
   A câmera fica atrás da alma, olhando para o fundo. Você conversa com eles e escolhe.
   O cenário usa o mesmo caminho de pixel art do mundo (DualRenderPass: fundo em meia resolução, figuras em resolução cheia).
   ============================================================================================ */

export type LimiarInfo = { name: string; race: string; cls: string; clsLvl: number; lvl: number; karma: number; kills: number; quests: number; debt: number; tears: number; place: string; lives: { race: string; cls: string; clsLvl: number }[] };
export type Pick = 'corpo' | 'reencarne' | 'lagrima';
type Soul3D = { root: THREE.Object3D; update?(dt: number, t: number, mps: number, heading: number | null): void };
export type LimiarDeps = {
  use(scene: THREE.Scene, cam: THREE.Camera): void; restore(): void; compile(scene: THREE.Scene, cam: THREE.Camera): void;
  makeSoul(): Soul3D; audio: { celestial(on: boolean): void; bell(f?: number, v?: number): void; chime(): void; soulRise(d?: number, hum?: number): void };
};

const FOG = new THREE.Color(0x0b0620);
const LY = -70, LC = 12; // o labirinto fica 70 m abaixo da plataforma: visto de cima, em perspectiva, até o horizonte
const ease = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const esc = (t: string) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

/* ---------- GLSL comum ---------- */
const NOISE = `
  float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float h3(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
  float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
    return mix(mix(h2(i), h2(i + vec2(1, 0)), f.x), mix(h2(i + vec2(0, 1)), h2(i + vec2(1, 1)), f.x), f.y); }
  float n3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
    return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z); }
  float fbm3(vec3 p){ float a = .5, s = 0.; for (int i = 0; i < 5; i++) { s += a * n3(p); p *= 2.03; a *= .5; } return s; }
  /* o estado de cada região do labirinto: > 0 clareando (ouro), < 0 escurecendo (caminho negro) */
  float region(vec2 xz, float t){ vec2 c = xz / 12.; float k = n2(c * .07 + vec2(t * .03, -t * .02)) * .7 + n2(c * .19 - t * .05) * .3; return smoothstep(.6, .78, k) - smoothstep(.42, .26, k); }
`;
const FOGF = `uniform vec3 uFog; float fogK(vec3 w, float d){ float z = length(w - cameraPosition) * d; return 1. - exp(-z * z); }`;

/* ---------- Marghar como entidade cósmica (Erling, 23/10: "um serafim, algo mais etéreo, energia pura, poder e vontade —
   não uma peça gigante de xadrez"): seis asas de luz (duas velam o rosto, duas cobrem os pés, duas se abrem no céu), cheias
   de olhos amendoados como o Olho Kármico; o corpo é um véu de energia que sobe; no lugar do rosto, um sol de luz branca
   atrás de anéis de runas que giram. Tudo aditivo: ele é luz, não matéria. Unidades locais (o grupo é escalado no mundo). ---------- */
function seraph(U: { [k: string]: THREE.IUniform }[]) {
  const g = new THREE.Group(), mats: THREE.ShaderMaterial[] = [];
  const AD = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, side: THREE.DoubleSide } as const;
  const VS = 'varying vec2 vU; varying vec3 vN; varying vec3 vV; void main(){ vU = uv; vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position, 1.); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }';
  /** asa: leque de penas compridas; u = da raiz (0) à ponta (1), v = ao longo da envergadura; penas em raios, energia correndo para a ponta, olhos */
  const wingMat = (c0: number, c1: number, seed: number) => { const m = new THREE.ShaderMaterial({ ...AD, uniforms: { uT: { value: 0 }, uA: { value: 1 }, uC0: { value: new THREE.Color(c0) }, uC1: { value: new THREE.Color(c1) }, uS: { value: seed } }, vertexShader: VS,
    fragmentShader: `uniform float uT, uA, uS; uniform vec3 uC0, uC1; varying vec2 vU; ${NOISE}
      float almond(vec2 p, vec2 c, float w){ vec2 d = (p - c) / w; d.y *= 2.6; float r = length(d); return r; }
      void main(){ float u = vU.x, v = vU.y;
        float fe = abs(fract(v * 14. + u * 1.5 + n2(vec2(v * 30., uS)) * .3) - .5) * 2.; // as penas (raios)
        float feather = smoothstep(.9, .35, fe) * .75 + .25; float edge = smoothstep(.12, .0, fe) * .6; // a haste clara de cada pena
        float tip = 1. - smoothstep(.55, 1., u + (n2(vec2(v * 9., uS + 3.)) - .5) * .35); // a borda das penas se desfaz
        float flow = n2(vec2(v * 6. + uS, u * 4. - uT * .6)) * .6 + n2(vec2(v * 19., u * 9. - uT * 1.3)) * .4; // energia correndo para a ponta
        float a = tip * feather * (.35 + flow * .9) * smoothstep(0., .08, u) * smoothstep(0., .05, v) * smoothstep(1., .95, v);
        vec3 c = mix(uC0, uC1, smoothstep(.15, .95, u + flow * .25));
        // olhos ao longo da asa (como o Olho Kármico): amêndoa de ouro, íris clara
        for (int i = 0; i < 4; i++) { vec2 ec = vec2(.32 + float(i) * .16, .2 + fract(uS * 1.7 + float(i) * .37) * .6); float r = almond(vec2(u, v), ec, .055);
          float blink = step(.06, fract(uT * .07 + float(i) * .31 + uS));
          c += vec3(1., .82, .45) * smoothstep(1., .82, r) * smoothstep(.6, .85, r) * 2.2 * blink; c += vec3(.75, .9, 1.) * smoothstep(.35, .0, r) * 2. * blink; a = max(a, smoothstep(1., .8, r) * .9 * blink * tip); }
        c += vec3(1., .95, .8) * edge * tip; gl_FragColor = vec4(c * a * uA * 1.15, 1.); }` }); mats.push(m); U.push(m.uniforms); return m; };
  /** a geometria de uma asa: faixa curva em leque (raiz em 0,0), comprimento L, abertura `fan` (rad) */
  const wingGeo = (L: number, fan: number, curl: number) => { const nu = 18, nv = 22, pos: number[] = [], uv: number[] = [], idx: number[] = [];
    for (let i = 0; i <= nu; i++) for (let j = 0; j <= nv; j++) { const u = i / nu, v = j / nv, ang = (v - 0.5) * fan + curl * u * u, r = L * u * (0.75 + 0.35 * Math.sin(v * Math.PI));
      pos.push(Math.cos(ang) * r, Math.sin(ang) * r, Math.sin(u * Math.PI) * 0.12 * L * (v - 0.5)); uv.push(u, v); }
    for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) { const a = i * (nv + 1) + j, b = a + nv + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals(); return geo; };
  const wings: { piv: THREE.Group; base: THREE.Euler; amp: number; ph: number }[] = [];
  const addWing = (side: number, y: number, L: number, fan: number, curl: number, rz: number, ry: number, c0: number, c1: number, seed: number, amp: number, ph: number) => {
    const piv = new THREE.Group(); piv.position.set(side * 0.16, y, -0.05); const m = new THREE.Mesh(wingGeo(L, fan, curl), wingMat(c0, c1, seed)); m.scale.x = side; piv.add(m);
    piv.rotation.set(0, ry * side, rz * side); g.add(piv); wings.push({ piv, base: piv.rotation.clone(), amp, ph }); };
  // as duas asas de cima: sobem e se dobram para a frente, velando o rosto
  addWing(1, 2.45, 2.1, 0.75, -0.9, 1.25, -0.75, 0xfff0c0, 0xffa848, 1.3, 0.05, 0); addWing(-1, 2.45, 2.1, 0.75, -0.9, 1.25, -0.75, 0xfff0c0, 0xffa848, 2.1, 0.05, 0.4);
  // as do meio: abertas no céu, imensas
  addWing(1, 2.1, 3.6, 0.95, 0.35, 0.28, 0.25, 0xffe2a0, 0x8a5aff, 3.7, 0.09, 1.1); addWing(-1, 2.1, 3.6, 0.95, 0.35, 0.28, 0.25, 0xffe2a0, 0x8a5aff, 4.9, 0.09, 1.5);
  // as de baixo: descem e cobrem os pés
  addWing(1, 1.4, 1.9, 0.7, 0.8, -1.05, -0.5, 0xd8c8ff, 0x3a5aff, 6.2, 0.04, 2.3); addWing(-1, 1.4, 1.9, 0.7, 0.8, -1.05, -0.5, 0xd8c8ff, 0x3a5aff, 7.4, 0.04, 2.7);
  // o corpo: um véu de energia (torno) que sobe e se desfaz embaixo
  { const pts: THREE.Vector2[] = []; for (let i = 0; i <= 24; i++) { const t = i / 24, y = t * 2.5; pts.push(new THREE.Vector2(0.06 + 0.34 * Math.pow(Math.sin(Math.min(1, (1 - t) * 1.2) * Math.PI * 0.5), 1.2) * (1 - t * 0.35) + (t > 0.86 ? (t - 0.86) * 0.6 : 0), y)); }
    const m = new THREE.ShaderMaterial({ ...AD, uniforms: { uT: { value: 0 }, uA: { value: 1 } }, vertexShader: VS,
      fragmentShader: `uniform float uT, uA; varying vec2 vU; varying vec3 vN; varying vec3 vV; ${NOISE}
        void main(){ float f = pow(1. - abs(dot(vN, vV)), 1.6); float y = vU.y;
          float st = n2(vec2(vU.x * 26., y * 5. - uT * .9)) * .6 + n2(vec2(vU.x * 61., y * 14. - uT * 1.7)) * .4;
          float a = (f * .9 + st * .35) * smoothstep(0., .45, y) * (1. - smoothstep(.92, 1., y) * .5);
          vec3 c = mix(vec3(.35, .45, 1.), vec3(1., .85, .55), smoothstep(.2, .95, y + st * .2));
          gl_FragColor = vec4(c * a * uA * .9, 1.); }` }); mats.push(m); U.push(m.uniforms);
    g.add(new THREE.Mesh(new THREE.LatheGeometry(pts, 40), m)); }
  // o rosto que não se vê: um sol branco, e atrás dele anéis de runas girando em eixos diferentes
  const head = new THREE.Group(); head.position.set(0, 2.62, 0); g.add(head);
  { const core = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 14), new THREE.ShaderMaterial({ ...AD, uniforms: { uA: { value: 1 } }, vertexShader: VS, fragmentShader: 'uniform float uA; varying vec3 vN; varying vec3 vV; void main(){ float f = dot(vN, vV); gl_FragColor = vec4(vec3(1., .96, .86) * (.6 + f * 1.6) * uA, 1.); }' }));
    head.add(core); mats.push(core.material as THREE.ShaderMaterial); }
  const halos: THREE.Mesh[] = [];
  for (let k = 0; k < 3; k++) { const m = new THREE.ShaderMaterial({ ...AD, uniforms: { uT: { value: 0 }, uA: { value: 1 }, uK: { value: k } }, vertexShader: VS,
      fragmentShader: `uniform float uT, uA, uK; varying vec2 vU; ${NOISE} void main(){ vec2 p = vU * 2. - 1.; float r = length(p), a = atan(p.y, p.x);
        float ring = smoothstep(.035, 0., abs(r - .82)) + smoothstep(.02, 0., abs(r - .64)) * .6;
        float runes = step(.55, fract(a * (7. + uK * 3.) / 6.2832 + uT * (.02 + uK * .01))) * smoothstep(.06, .0, abs(r - .73)) * step(.5, h2(vec2(floor(a * 12. + uK * 9.), uK)));
        float a2 = (ring + runes * .9) * uA; gl_FragColor = vec4(mix(vec3(1., .8, .45), vec3(.7, .6, 1.), uK * .4) * a2 * 1.5, 1.); }` }); mats.push(m); U.push(m.uniforms);
    const h = new THREE.Mesh(new THREE.PlaneGeometry(1.3 + k * 0.55, 1.3 + k * 0.55), m); head.add(h); halos.push(h); }
  // faíscas subindo pelo corpo e pelas asas (pontos animados no shader)
  { const N = 900, pos = new Float32Array(N * 3), sd = new Float32Array(N); for (let i = 0; i < N; i++) { const a = Math.random() * Math.PI * 2, r = Math.pow(Math.random(), 0.6) * 3.4; pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 1] = Math.random() * 3.4; pos[i * 3 + 2] = Math.sin(a) * r * 0.35; sd[i] = Math.random(); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('aS', new THREE.BufferAttribute(sd, 1));
    const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, uniforms: { uT: { value: 0 }, uA: { value: 1 } },
      vertexShader: 'uniform float uT; attribute float aS; varying float vA; void main(){ vec3 p = position; float t = fract(aS + uT * (.03 + aS * .04)); p.y = mod(p.y + t * 3.4, 3.6) - .1; p.x += sin(uT * .5 + aS * 20.) * .08; vA = sin(t * 3.1416); vec4 mv = modelViewMatrix * vec4(p, 1.); gl_PointSize = (1. + aS * 2.) * (300. / -mv.z) * 1.4; gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'uniform float uA; varying float vA; void main(){ vec2 c = gl_PointCoord - .5; float d = length(c); if (d > .5) discard; gl_FragColor = vec4(vec3(1., .88, .6) * smoothstep(.5, 0., d) * vA * uA * 1.4, 1.); }' });
    mats.push(m); U.push(m.uniforms); g.add(new THREE.Points(geo, m)); }
  g.traverse((o) => { o.layers.set(LAYER_WORLD); (o as THREE.Mesh).frustumCulled = false; });
  return { g, head, wings, halos, mats };
}

/** material de figura etérea: cor de base com gradiente vertical, borda acesa (fresnel), luz de baixo, e o manto que se desfaz em luz no chão */
function spiritMat(base: number, rim: number, o: { under?: number; fadeY?: number; alpha?: number; rimK?: number; fogD?: number } = {}) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: true,
    uniforms: { uBase: { value: new THREE.Color(base) }, uRim: { value: new THREE.Color(rim) }, uUnder: { value: new THREE.Color(o.under ?? 0x000000) }, uA: { value: o.alpha ?? 1 }, uFadeY: { value: o.fadeY ?? 0.35 }, uRimK: { value: o.rimK ?? 1.6 }, uT: { value: 0 }, uFog: { value: FOG }, uFogD: { value: o.fogD ?? 0.0016 } },
    vertexShader: `varying vec3 vN; varying vec3 vW; varying float vY;
      void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vY = position.y; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform vec3 uBase; uniform vec3 uRim; uniform vec3 uUnder; uniform float uA; uniform float uFadeY; uniform float uRimK; uniform float uT; varying vec3 vN; varying vec3 vW; varying float vY; uniform float uFogD;
      ${FOGF}
      void main(){
        vec3 v = normalize(cameraPosition - vW); vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
        float fr = pow(1. - clamp(dot(n, v), 0., 1.), 2.4);
        vec3 c = uBase * (.55 + .45 * clamp(n.y * .5 + .5, 0., 1.)) + uRim * fr * uRimK + uUnder * clamp(-n.y, 0., 1.) * .7;
        c *= .92 + .08 * sin(uT * 1.7 + vW.y * 3.);
        float a = uA * (uFadeY < 0. ? 1. : smoothstep(0., uFadeY, vY));
        c = mix(c, uFog, fogK(vW, uFogD));
        gl_FragColor = vec4(c, a);
      }`,
  });
}
/** textura radial suave (halos, luz, lágrima) */
function radialTex(stops: [number, string][]) {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d')!, gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  for (const [k, col] of stops) gr.addColorStop(k, col); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function footTex() {
  const c = document.createElement('canvas'); c.width = 32; c.height = 64; const g = c.getContext('2d')!; g.fillStyle = '#fff';
  g.beginPath(); g.ellipse(16, 40, 8, 14, 0, 0, Math.PI * 2); g.fill(); for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(9 + i * 4.6, 20 - Math.abs(i - 1.5) * 2, 2.4, 3, 0, 0, Math.PI * 2); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const sprite = (map: THREE.Texture, col: number, s: number, op = 1) => { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map, color: col, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false })); m.scale.setScalar(s); return m; };

/* ---------- partículas: pontos quadrados (pixel), aditivos ---------- */
class Motes {
  pts: THREE.Points; n: number; pos: Float32Array; col: Float32Array; size: Float32Array;
  vel: Float32Array; life: Float32Array; max: Float32Array; c0: Float32Array; c1: Float32Array; s0: Float32Array; s1: Float32Array; drag: Float32Array; i = 0;
  mat: THREE.ShaderMaterial;
  constructor(n: number, add = true) {
    this.n = n; const A = (k: number) => new Float32Array(n * k);
    this.pos = A(3); this.col = A(4); this.size = A(1); this.vel = A(3); this.life = A(1); this.max = A(1); this.c0 = A(3); this.c1 = A(3); this.s0 = A(1); this.s1 = A(1); this.drag = A(1);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3)); g.setAttribute('aCol', new THREE.BufferAttribute(this.col, 4)); g.setAttribute('aSize', new THREE.BufferAttribute(this.size, 1));
    this.mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: add ? THREE.AdditiveBlending : THREE.NormalBlending, uniforms: { uScale: { value: 400 } },
      vertexShader: `attribute float aSize; attribute vec4 aCol; varying vec4 vCol; uniform float uScale;
        void main(){ vCol = aCol; vec4 mv = modelViewMatrix * vec4(position, 1.); gl_PointSize = max(1., aSize * uScale / -mv.z); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: add ? `varying vec4 vCol; void main(){ vec2 d = gl_PointCoord - .5; float r = max(abs(d.x), abs(d.y)) * 2.; if (r > 1.) discard; gl_FragColor = vec4(vCol.rgb * (1. + (1. - r) * .8), vCol.a * (1. - r * .55)); }`
        : `varying vec4 vCol; void main(){ vec2 d = gl_PointCoord - .5; float r = length(d) * 2.; if (r > 1.) discard; gl_FragColor = vec4(vCol.rgb, vCol.a * (1. - r) * .55); }` });
    this.pts = new THREE.Points(g, this.mat); this.pts.frustumCulled = false;
  }
  spawn(x: number, y: number, z: number, o: { vx?: number; vy?: number; vz?: number; life?: number; c0?: number; c1?: number; s0?: number; s1?: number; drag?: number }) {
    const i = this.i; this.i = (this.i + 1) % this.n; const c0 = new THREE.Color(o.c0 ?? 0xffffff), c1 = new THREE.Color(o.c1 ?? o.c0 ?? 0xffffff);
    this.pos.set([x, y, z], i * 3); this.vel.set([o.vx ?? 0, o.vy ?? 0, o.vz ?? 0], i * 3); this.life[i] = 0; this.max[i] = o.life ?? 1;
    this.c0.set([c0.r, c0.g, c0.b], i * 3); this.c1.set([c1.r, c1.g, c1.b], i * 3); this.s0[i] = o.s0 ?? 0.12; this.s1[i] = o.s1 ?? 0.02; this.drag[i] = o.drag ?? 0;
  }
  update(dt: number) {
    for (let i = 0; i < this.n; i++) {
      if (this.max[i] <= 0) continue; this.life[i] += dt; const k = this.life[i] / this.max[i];
      if (k >= 1) { this.max[i] = 0; this.col[i * 4 + 3] = 0; this.size[i] = 0; continue; }
      const dr = Math.exp(-this.drag[i] * dt); for (let a = 0; a < 3; a++) { this.vel[i * 3 + a] *= dr; this.pos[i * 3 + a] += this.vel[i * 3 + a] * dt; }
      for (let a = 0; a < 3; a++) this.col[i * 4 + a] = lerp(this.c0[i * 3 + a], this.c1[i * 3 + a], k);
      this.col[i * 4 + 3] = Math.sin(Math.PI * Math.min(1, k * 1.4 + 0.05)) * 0.95; this.size[i] = lerp(this.s0[i], this.s1[i], k);
    }
    const g = this.pts.geometry; (g.attributes.position as THREE.BufferAttribute).needsUpdate = true; (g.attributes.aCol as THREE.BufferAttribute).needsUpdate = true; (g.attributes.aSize as THREE.BufferAttribute).needsUpdate = true;
  }
}

/* ---------- as Essências (23/10: "parecem peças de xadrez"): Orvalen e Sael são luz, não estátuas — véu que se desfaz em fiapos, borda acesa, energia subindo, fitas flutuando; Orvalen tem só escuro e dois brilhos no capuz, Sael o rosto de luz. ---------- */
function etherMat(core: number, rim: number, o: { alpha?: number; hem?: number; dark?: boolean } = {}) {
  return new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, blending: o.dark ? THREE.NormalBlending : THREE.NormalBlending,
    uniforms: { uT: { value: 0 }, uA: { value: 1 }, uCore: { value: new THREE.Color(core) }, uRim: { value: new THREE.Color(rim) }, uAl: { value: o.alpha ?? 0.6 }, uHem: { value: o.hem ?? 0.35 } },
    vertexShader: 'uniform float uT; varying vec3 vN; varying vec3 vV; varying vec3 vO; void main(){ vO = position; vec3 p = position; float sw = smoothstep(.9, 0., p.y); p.x += sin(uT * 1.3 + p.y * 3. + p.z * 2.) * .05 * sw; p.z += cos(uT * 1.1 + p.y * 2.6) * .05 * sw; vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(p, 1.); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
    fragmentShader: `uniform float uT, uA, uAl, uHem; uniform vec3 uCore, uRim; varying vec3 vN; varying vec3 vV; varying vec3 vO; ${NOISE}
      void main(){ float f = pow(1. - abs(dot(normalize(vN), normalize(vV))), 1.7);
        float a = atan(vO.z, vO.x);
        float st = n2(vec2(a * 5. + vO.y * .5, vO.y * 6. - uT * 1.1)) * .6 + n2(vec2(a * 13., vO.y * 17. - uT * 2.)) * .4; // a energia subindo
        float wisp = n2(vec2(a * 7., vO.y * 3. - uT * .5)); if (vO.y < uHem * (.4 + wisp * 1.2)) discard; // a barra se desfaz em fiapos
        vec3 c = mix(uCore, uRim, clamp(f * 1.2 + st * .3, 0., 1.)) + uRim * pow(f, 3.) * .9;
        float fd = uHem < 0. ? 1. : smoothstep(uHem * .4, uHem * 1.6 + .25, vO.y); float core = exp(-pow(length(vO.xz) * 2.2, 2.)) * .0; float al = (uAl * (.35 + st * .65) + f * .9) * uA * fd;
        gl_FragColor = vec4(c * (1. + f), clamp(al, 0., 1.)); }` });
}
function essence(o: { core: number; rim: number; hood?: boolean; hair?: number; tail: number }) {
  const g = new THREE.Group(), mats: THREE.ShaderMaterial[] = [];
  const M = (core: number, rim: number, x: { alpha?: number; hem?: number } = {}) => { const m = etherMat(core, rim, x); mats.push(m); return m; };
  const robeM = M(o.core, o.rim, { alpha: 0.16, hem: 0.55 }), hoodM = M(o.core, o.rim, { alpha: 0.55, hem: -1 });
  // o véu: largo embaixo, cintura fina, ombros, gola alta
  const prof = [[0.02, 0], [0.62, 0.02], [0.56, 0.3], [0.44, 0.75], [0.31, 1.15], [0.28, 1.36], [0.42, 1.56], [0.45, 1.64], [0.27, 1.78], [0.12, 1.86], [0.02, 1.88]].map(([r, y]) => new THREE.Vector2(r, y));
  g.add(new THREE.Mesh(new THREE.LatheGeometry(prof, 36), robeM));
  // fitas de luz atrás (o manto que flutua)
  const tails: THREE.Mesh[] = [];
  for (let k = 0; k < 5; k++) { const geo = new THREE.PlaneGeometry(0.22, 1.7, 1, 12); geo.translate(0, -0.85, 0); const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, blending: THREE.AdditiveBlending, uniforms: { uT: { value: 0 }, uA: { value: 1 }, uC: { value: new THREE.Color(o.tail) }, uS: { value: k * 1.7 } },
      vertexShader: 'uniform float uT, uS; varying vec2 vU; void main(){ vU = uv; vec3 p = position; float t = -p.y; p.z -= t * t * .35 + sin(uT * 1.6 + uS + t * 3.) * .12 * t; p.x += sin(uT * 1.2 + uS * 2. + t * 2.) * .1 * t; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.); }',
      fragmentShader: 'uniform float uA; uniform vec3 uC; varying vec2 vU; void main(){ float e = 1. - abs(vU.x - .5) * 2.; gl_FragColor = vec4(uC * e * vU.y * .9 * uA, 1.); }' });
    mats.push(m); const t = new THREE.Mesh(geo, m); t.position.set((k - 2) * 0.14, 1.62, -0.24); t.rotation.x = 0.25; g.add(t); tails.push(t); }
  { // a alma por dentro do véu: uma chama vertical que pulsa (é ela que se vê através do tecido de luz)
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 2.1), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending, uniforms: { uT: { value: 0 }, uA: { value: 1 }, uC: { value: new THREE.Color(o.rim) } },
      vertexShader: 'varying vec2 vU; void main(){ vU = uv; vec4 mv = modelViewMatrix * vec4(0., 0., 0., 1.); mv.xy += position.xy; gl_Position = projectionMatrix * mv; }',
      fragmentShader: `uniform float uT, uA; uniform vec3 uC; varying vec2 vU; ${NOISE} void main(){ vec2 q = vU - vec2(.5, .55); float w = .18 + vU.y * .08; float n = n2(vec2(vU.x * 6., vU.y * 5. - uT * 1.4));
        float k = exp(-pow(q.x / (w * (.7 + n * .6)), 2.)) * smoothstep(0., .35, vU.y) * smoothstep(1., .7, vU.y); float hrt = exp(-dot(q - vec2(0., .1), q - vec2(0., .1)) * 60.) * (.8 + .2 * sin(uT * 2.4));
        gl_FragColor = vec4(uC * (k * .55 + hrt * 1.2) * uA, 1.); }` }));
    mats.push(fl.material as THREE.ShaderMaterial); fl.position.y = 1.0; g.add(fl); }
  const head = new THREE.Group(); head.position.set(0, 1.98, 0.02); g.add(head);
  if (o.hood) { // capuz fundo: por fora a luz, por dentro o escuro e dois brilhos
    head.add(new THREE.Mesh(new THREE.SphereGeometry(0.29, 24, 16, Math.PI * 0.62, Math.PI * 1.76, 0, Math.PI * 0.7), hoodM).rotateY(Math.PI));
    const voidM = new THREE.Mesh(new THREE.CircleGeometry(0.19, 20), new THREE.MeshBasicMaterial({ color: 0x010208, transparent: true, opacity: 0.95, depthWrite: false })); voidM.position.z = 0.1; voidM.scale.y = 1.25; head.add(voidM);
    for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 5), new THREE.MeshBasicMaterial({ color: new THREE.Color(o.rim).multiplyScalar(1.8), toneMapped: false })); e.position.set(s * 0.065, 0.0, 0.12); head.add(e); }
    const cowl = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.4, 0.32, 24, 1, true), robeM); cowl.position.y = -0.21; cowl.material = hoodM; head.add(cowl);
  } else { // o rosto de luz e os cabelos em fitas
    const face = new THREE.Mesh(new THREE.SphereGeometry(0.19, 20, 14), M(0xfff4e0, 0xffffff, { alpha: 0.85, hem: -9 })); head.add(face);
    for (let k = 0; k < 7; k++) { const geo = new THREE.PlaneGeometry(0.09, 1.1, 1, 10); geo.translate(0, -0.55, 0); const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, blending: THREE.AdditiveBlending, uniforms: { uT: { value: 0 }, uA: { value: 1 }, uC: { value: new THREE.Color(o.hair ?? o.rim) }, uS: { value: k * 0.9 } },
        vertexShader: 'uniform float uT, uS; varying vec2 vU; void main(){ vU = uv; vec3 p = position; float t = -p.y; p.z -= t * .5 + sin(uT * 1.4 + uS + t * 4.) * .08 * t; p.x += sin(uT + uS * 3.) * .06 * t; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.); }',
        fragmentShader: 'uniform float uA; uniform vec3 uC; varying vec2 vU; void main(){ float e = 1. - abs(vU.x - .5) * 2.; gl_FragColor = vec4(uC * e * (.3 + vU.y) * uA, 1.); }' });
      mats.push(m); const h = new THREE.Mesh(geo, m); const a = (k / 6 - 0.5) * 2.2; h.position.set(Math.sin(a) * 0.17, 0.08, -Math.cos(a) * 0.14); h.rotation.y = a; head.add(h); }
  }
  const arm = (side: number) => { const a = new THREE.Group(); a.position.set(0.44 * side, 1.6, 0.02); a.rotation.z = 0.12 * side;
    const sl = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.26, 0.8, 18, 1, true), M(o.core, o.rim, { alpha: 0.45, hem: -9 })); sl.position.y = -0.4; a.add(sl);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(o.rim).multiplyScalar(1.3), toneMapped: false })); hand.position.y = -0.8; a.add(hand); g.add(a); return { a, hand }; };
  return { g, head, L: arm(1), R: arm(-1), mats, tails };
}

export function createLimiar(deps: LimiarDeps) {
  const scene = new THREE.Scene(); const cam = new THREE.PerspectiveCamera(42, 16 / 9, 0.1, 2400);
  let built = false, active = false, T = 0;
  const U: { [k: string]: THREE.IUniform }[] = []; // tudo que precisa do tempo
  const motes = new Motes(3200), mist = new Motes(900, false); // brilho (aditivo) e névoa (escura, por cima)
  const halo = radialTex([[0, 'rgba(255,255,255,1)'], [0.25, 'rgba(255,255,255,.55)'], [1, 'rgba(255,255,255,0)']]);
  const soft = radialTex([[0, 'rgba(255,255,255,.9)'], [0.5, 'rgba(255,255,255,.18)'], [1, 'rgba(255,255,255,0)']]);
  const foot = footTex();
  // peças
  let sky: THREE.Mesh, floor: THREE.Mesh, walls: THREE.InstancedMesh, plat: THREE.Mesh, platMat: THREE.ShaderMaterial, pool: THREE.Mesh;
  let wallData: { x: number; z: number; rot: number; len: number; maxH: number; h: number; tgt: number; next: number }[] = [];
  let runners: { x: number; z: number; dx: number; dz: number; sp: number; dark: boolean; turn: number }[] = [];
  let marghar: ReturnType<typeof seraph>, margharG: THREE.Group;
  let eye: THREE.Group, eyeLid: THREE.Group, iris: THREE.Group, eyeGlow: THREE.Sprite, veilUp: THREE.Sprite, veilDn: THREE.Sprite;
  let orv: ReturnType<typeof essence>, orvMats: THREE.ShaderMaterial[] = [], lantern: THREE.Sprite, lanternCore: THREE.Mesh;
  let sael: ReturnType<typeof essence>, saelMats: THREE.ShaderMaterial[] = [], saelRing: THREE.Mesh;
  const prints: THREE.Mesh[] = [];
  let reforming = false, soul: Soul3D | null = null, soulMats: THREE.MeshBasicMaterial[] = [], orb: THREE.Sprite, needle: THREE.Mesh;
  const P = { ghost: new THREE.Vector3(0, 0, 1.4), orv: new THREE.Vector3(-4.7, 0, -0.6), sael: new THREE.Vector3(4.7, 0, -0.6), eye: new THREE.Vector3(0, 2.0, -12.5), marg: new THREE.Vector3(0, LY - 55, -1500) };

  function build() {
    built = true; scene.background = new THREE.Color(0x05030c);
    /* céu: nebulosa violeta, estrelas e o brilho dourado atrás de Marghar */
    { const m = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, uniforms: { uT: { value: 0 } },
        vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
        fragmentShader: `uniform float uT; varying vec3 vD; ${NOISE}
          void main(){ vec3 d = normalize(vD);
            vec3 c = mix(vec3(.012, .008, .03), vec3(.05, .024, .1), smoothstep(-.35, .55, d.y));
            float a = fbm3(d * 3.1 + vec3(0., uT * .004, uT * .002)), b = fbm3(d * 7.3 - vec3(uT * .006));
            c += vec3(.26, .08, .44) * pow(a, 3.) * 1.7 + vec3(.05, .13, .32) * pow(b, 4.) * 1.5;
            vec3 g = normalize(vec3(0., .07, -1.)); float gg = max(dot(d, g), 0.);
            c += vec3(1., .7, .36) * pow(gg, 60.) * .4 + vec3(.55, .3, .85) * pow(gg, 10.) * .12;
            vec3 sp = floor(d * 380.); float s = h3(sp); float tw = .55 + .45 * sin(uT * 2.3 + s * 90.);
            c += vec3(1., .94, .84) * step(.9968, s) * tw * 1.5 * smoothstep(-.25, .15, d.y + .2);
            gl_FragColor = vec4(c, 1.); }` });
      sky = new THREE.Mesh(new THREE.SphereGeometry(1800, 48, 24), m); U.push(m.uniforms); sky.layers.set(LAYER_WORLD); scene.add(sky); }
    /* o chão do labirinto lá embaixo: corredores, regiões que clareiam (ouro) e escurecem (negro com veios carmim) */
    { const m = new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 }, uFog: { value: FOG } },
        vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
        fragmentShader: `uniform float uT; varying vec3 vW; ${NOISE} ${FOGF}
          void main(){ vec2 p = vW.xz / 12.; vec2 f = fract(p); float e = min(min(f.x, 1. - f.x), min(f.y, 1. - f.y)); float line = smoothstep(.07, .0, e);
            float r = region(vW.xz, uT); float lt = max(r, 0.), dk = max(-r, 0.);
            vec3 c = vec3(.008, .006, .02) + line * vec3(.1, .06, .2);
            c = mix(c, vec3(1., .74, .34) * (.16 + line * 1.0), lt * .85);
            c = mix(c, vec3(.0) + line * vec3(.26, .015, .045), dk * .85);
            float d = length(vW.xz - vec2(0., -40.)); c += vec3(.35, .3, .85) * line * smoothstep(.75, 1., sin(d * .045 - uT * .7)) * .5;
            c = mix(c, uFog, fogK(vW, .00105)); gl_FragColor = vec4(c, 1.); }` });
      floor = new THREE.Mesh(new THREE.PlaneGeometry(3200, 3200), m); floor.rotation.x = -Math.PI / 2; floor.position.y = LY; U.push(m.uniforms); scene.add(floor); }
    /* os muros: sobem e cedem o tempo todo; o topo acende com a cor da região */
    { const N = 70, C = LC, wg = new THREE.BoxGeometry(1, 1, 1); wg.translate(0, 0.5, 0);
      const m = new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 }, uFog: { value: FOG } },
        vertexShader: `varying vec3 vW; varying float vY; void main(){ vec4 p = vec4(position, 1.);
          #ifdef USE_INSTANCING
            p = instanceMatrix * p;
          #endif
          vec4 w = modelMatrix * p; vW = w.xyz; vY = position.y; gl_Position = projectionMatrix * viewMatrix * w; }`,
        fragmentShader: `uniform float uT; varying vec3 vW; varying float vY; ${NOISE} ${FOGF}
          void main(){ float r = region(vW.xz, uT); float lt = max(r, 0.), dk = max(-r, 0.);
            vec3 side = mix(vec3(.012, .008, .03), vec3(.035, .022, .07), vY);
            vec3 top = mix(vec3(.42, .3, .8), vec3(1., .75, .35), lt); top = mix(top, vec3(.75, .05, .1), dk);
            vec3 c = mix(side, top * .8, smoothstep(.9, 1., vY)) + top * .03 * vY; c = mix(c, c * .3, dk * .6);
            c = mix(c, uFog, fogK(vW, .00105)); gl_FragColor = vec4(c, 1.); }` });
      const list: typeof wallData = []; let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
        const x = (i - N / 2) * C, z = 60 - j * C; // o labirinto inteiro, lá embaixo, até onde a vista alcança
        const r = rnd(); if (r < 0.45) list.push({ x: x + C / 2, z, rot: 0, len: C, maxH: 4 + rnd() * 3, h: 0, tgt: 1, next: rnd() * 6 });
        else if (r < 0.9) list.push({ x, z: z - C / 2, rot: Math.PI / 2, len: C, maxH: 4 + rnd() * 3, h: 0, tgt: 1, next: rnd() * 6 });
      }
      for (const w of list) { w.h = rnd() < 0.7 ? w.maxH : 0; w.tgt = w.h > 0 ? 1 : 0; }
      wallData = list; walls = new THREE.InstancedMesh(wg, m, list.length); walls.frustumCulled = false; U.push(m.uniforms); scene.add(walls);
      for (let k = 0; k < 700; k++) { const ax = rnd() < 0.5; runners.push({ x: Math.round((rnd() - 0.5) * N) * C, z: 60 - Math.round(rnd() * N) * C, dx: ax ? (rnd() < 0.5 ? 1 : -1) : 0, dz: ax ? 0 : (rnd() < 0.5 ? 1 : -1), sp: 6 + rnd() * 12, dark: rnd() < 0.3, turn: 0 }); } }
    /* a plataforma: o centro do labirinto, gravado no chão de luz (o labirinto circular do Fio) */
    { platMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { uT: { value: 0 }, uWake: { value: 0 } },
        vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
        fragmentShader: `uniform float uT; uniform float uWake; varying vec2 vP; ${NOISE}
          void main(){ float r = length(vP) / 7.6; float a = atan(vP.y, vP.x) / 6.2831853 + .5; if (r > 1.) discard;
            float ring = floor(r * 7.); float fr = fract(r * 7.); float line = smoothstep(.1, .02, min(fr, 1. - fr));
            float gapA = fract(a * (2. + mod(ring, 3.)) + uT * .01 * (mod(ring, 2.) * 2. - 1.) + ring * .37); float gap = step(.86, gapA);
            float spoke = smoothstep(.012, .0, abs(fract(a * (4. + ring)) - .5) - .47) * step(.5, mod(ring, 2.));
            float g = max(line * (1. - gap), spoke * (1. - line) * .6) * step(.12, r);
            vec3 c = vec3(.05, .035, .1) * (1. - r * .5) + vec3(1., .72, .38) * g * (.2 + uWake * .6);
            c += vec3(.4, .28, .75) * pow(1. - r, 3.) * .35 * (.4 + uWake);
            c += vec3(1., .8, .5) * smoothstep(.985, .965, r) * smoothstep(.94, .96, r) * (.25 + uWake * .5);
            float al = smoothstep(1., .9, r) * (.86 + .14 * sin(uT * .8 + r * 9.));
            gl_FragColor = vec4(c, al); }` });
      plat = new THREE.Mesh(new THREE.CircleGeometry(7.6, 96), platMat); plat.rotation.x = -Math.PI / 2; plat.position.y = 0.01; U.push(platMat.uniforms); scene.add(fine(plat));
      const under = sprite(soft, 0x6a40d0, 24, 0.16); under.position.set(0, -3, 0); scene.add(fine(under));
      /* a plataforma flutua: por baixo, uma ilha de rocha que afina numa ponta, com cristais pendurados */
      const isl = new THREE.Mesh(new THREE.ConeGeometry(7.9, 22, 14, 3), spiritMat(0x120c1c, 0x8a6aff, { fadeY: -99, rimK: 1.2 })); isl.rotation.x = Math.PI; isl.position.y = -11.1; U.push((isl.material as THREE.ShaderMaterial).uniforms); scene.add(isl);
      const lip = new THREE.Mesh(new THREE.CylinderGeometry(7.7, 7.9, 0.9, 48, 1, true), spiritMat(0x2a2036, 0xffd890, { fadeY: -99, rimK: 1.4 })); lip.position.y = -0.46; U.push((lip.material as THREE.ShaderMaterial).uniforms); scene.add(lip);
      for (let i = 0; i < 14; i++) { const a = (i / 14) * 6.283 + Math.random(), rr0 = 3 + Math.random() * 4; const c = new THREE.Mesh(new THREE.OctahedronGeometry(0.4 + Math.random() * 0.6, 0), new THREE.MeshBasicMaterial({ color: Math.random() < 0.5 ? 0x9a7aff : 0xffd27a })); c.scale.y = 2.5; c.position.set(Math.cos(a) * rr0, -2 - Math.random() * 6, Math.sin(a) * rr0); scene.add(c); } }
    /* Marghar: só a silhueta, imensa, calma, debruçada sobre a piscina cósmica; a luz da piscina sobe no rosto */
    { marghar = seraph(U); margharG = new THREE.Group(); margharG.add(marghar.g);
      marghar.g.rotation.x = 0.16; // inclinado sobre a piscina cósmica, olhando para baixo
      margharG.scale.setScalar(108); /* bem ao fundo e imenso: as asas abertas enchem o céu sobre o horizonte */ margharG.position.copy(P.marg); margharG.rotation.y = -0.2; margharG.traverse((o) => o.layers.set(LAYER_WORLD)); scene.add(margharG);
      const pm = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uT: { value: 0 } },
        vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
        fragmentShader: `uniform float uT; varying vec2 vP; ${NOISE}
          void main(){ float r = length(vP); if (r > 1.) discard; float a = atan(vP.y, vP.x);
            float sw = n2(vec2(a * 3. + r * 6. - uT * .25, r * 4. - uT * .15)) * .6 + n2(vec2(a * 7. - uT * .4, r * 11.)) * .4;
            vec3 c = mix(vec3(.1, .28, .8), vec3(1., .75, .4), smoothstep(.45, .85, sw)) * (1. - r * .6);
            c += vec3(1., .9, .75) * smoothstep(.97, .9, r) * smoothstep(.8, .95, r) * .5;
            gl_FragColor = vec4(c * (.5 + .5 * sw), smoothstep(1., .85, r)); }` });
      pool = new THREE.Mesh(new THREE.CircleGeometry(1, 64), pm); pool.rotation.x = -Math.PI / 2; pool.scale.set(330, 190, 1); pool.position.set(0, LY + 0.6, P.marg.z + 300); U.push(pm.uniforms); pool.layers.set(LAYER_WORLD); scene.add(pool);
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(30, 40, 90, 32, 1, true), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
        vertexShader: 'varying float vY; varying vec3 vN; varying vec3 vW; void main(){ vY = position.y / 90. + .5; vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
        fragmentShader: 'varying float vY; varying vec3 vN; varying vec3 vW; void main(){ float f = abs(dot(normalize(vN), normalize(cameraPosition - vW))); gl_FragColor = vec4(vec3(.5, .65, 1.) * .05 * f * pow(1. - vY, 4.), 1.); }' }));
      shaft.scale.set(7, 6, 7); shaft.position.set(0, LY + 270, P.marg.z + 300); shaft.layers.set(LAYER_WORLD); scene.add(shaft);
    }
    /* o Olho Kármico: amêndoa dourada, íris de ouro, pupila em fenda; olha para você */
    { eye = new THREE.Group(); eye.position.copy(P.eye); eye.scale.setScalar(0.62); scene.add(eye);
      const almond = (w: number, h: number) => { const s = new THREE.Shape(); s.moveTo(-w, 0); s.quadraticCurveTo(0, h * 2, w, 0); s.quadraticCurveTo(0, -h * 2, -w, 0); return new THREE.ShapeGeometry(s, 32); };
      const add = (col: number, op = 1) => new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: op, depthWrite: false });
      eyeGlow = sprite(soft, 0xffa040, 9, 0.3); eye.add(eyeGlow);
      /* o Olho que vê também esconde: por cima sobe uma energia dourada (o karma que clareia) que vela o rosto de Marghar;
         por baixo desce uma névoa escura e densa, do azul da Ampulheta (o karma que pesa) */
      veilUp = sprite(soft, 0xffa838, 1, 0.5); veilUp.scale.set(12, 70, 1); veilUp.position.set(0, 33, -0.5); eye.add(veilUp);
      veilDn = new THREE.Sprite(new THREE.SpriteMaterial({ map: soft, color: 0x26306a, transparent: true, opacity: 0.75, depthWrite: false })); veilDn.scale.set(12, 24, 1); veilDn.position.set(0, -12.5, -0.4); eye.add(veilDn);
      const rim = new THREE.Mesh(almond(3.4, 1.42), add(0xffd27a)); (rim.material as THREE.MeshBasicMaterial).color.multiplyScalar(1.15); rim.position.z = -0.02; eye.add(rim);
      eyeLid = new THREE.Group(); eye.add(eyeLid);
      const white = new THREE.Mesh(almond(3.1, 1.22), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { uT: { value: 0 } },
        vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
        fragmentShader: 'uniform float uT; varying vec2 vP; void main(){ float r = length(vP * vec2(.33, .85)); vec3 c = mix(vec3(.32, .16, .05), vec3(.06, .02, .02), r); gl_FragColor = vec4(c, 1.); }' }));
      white.renderOrder = 5; eyeLid.add(white); iris = new THREE.Group(); iris.position.z = 0.02; eyeLid.add(iris); // a íris desenha DEPOIS do branco (antes, os dois transparentes trocavam de ordem e a íris sumia)
      const im = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { uT: { value: 0 } },
        vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
        fragmentShader: `uniform float uT; varying vec2 vP; ${NOISE} void main(){ float r = length(vP); if (r > 1.) discard; float a = atan(vP.y, vP.x);
          float st = n2(vec2(a * 9., r * 3. - uT * .2)); vec3 c = mix(vec3(1.6, 1.05, .35), vec3(.9, .4, .06), r) * (.7 + st * .6);
          c *= smoothstep(1., .9, r); float pu = length(vP * vec2(3.6, 1.15)); c = mix(vec3(.01, .005, .01), c, smoothstep(.5, .62, pu)); gl_FragColor = vec4(c, 1.); }` });
      { const im2 = new THREE.Mesh(new THREE.CircleGeometry(1, 40), im); im2.renderOrder = 6; iris.add(im2); } iris.scale.setScalar(0.98); U.push(im.uniforms);
      const shine = sprite(halo, 0xffffff, 0.45, 0.8); shine.position.set(0.32, 0.36, 0.05); shine.renderOrder = 7; iris.add(shine);
      for (let i = 0; i < 10; i++) { const ray = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 2.4), add(0xffc870, 0.25)); ray.position.y = 0; ray.rotation.z = (i / 10) * Math.PI * 2; ray.geometry.translate(0, 3.0, 0); eye.add(ray); }
      fine(eye); }
    /* Orvalen, o Leitor de Rastros: capuz, cajado, lanterna fria; rastros de luz giram nos pés dele */
    { const es = essence({ core: 0x0e2a3e, rim: 0x8fe8ff, hood: true, tail: 0x5ac8ff });
      orvMats = es.mats; orv = es; orv.g.position.copy(P.orv); orv.g.rotation.y = 0.45; orv.g.scale.setScalar(1.32); scene.add(orv.g);
      orv.R.a.rotation.set(-0.35, 0, -0.18); const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 2.7, 8), etherMat(0x1a3a4a, 0x9fefff, { alpha: 0.85, hem: -9 })); orvMats.push(staff.material as THREE.ShaderMaterial);
      staff.position.set(0, 0.5, 0); orv.R.hand.add(staff);
      lanternCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 0), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xbff4ff).multiplyScalar(1.4) })); lanternCore.position.y = 1.9; staff.add(lanternCore);
      lantern = sprite(halo, 0x9fe8ff, 1.1, 0.6); lanternCore.add(lantern);
      for (let i = 0; i < 12; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.56), new THREE.MeshBasicMaterial({ map: foot, color: 0x9fe8ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.y = 0.03; prints.push(m); scene.add(m); }
      for (const m of orvMats) U.push(m.uniforms); fine(orv.g); for (const p of prints) fine(p); }
    /* Sael, a Que Voltou: clara, sem capuz, cabelo de luz, o anel do centro atrás da cabeça; segura o Fio */
    { const es = essence({ core: 0x5a4a30, rim: 0xffe2a0, hair: 0xffe8b0, tail: 0xffd080 });
      saelMats = es.mats; sael = es; sael.g.position.copy(P.sael); sael.g.rotation.y = -0.45; sael.g.scale.setScalar(1.22); scene.add(sael.g);
      sael.L.a.rotation.set(-0.95, 0, 0.35); // a mão estendida para você
      saelRing = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.018, 8, 64), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffd890).multiplyScalar(1.2), transparent: true, opacity: 0.85 })); saelRing.position.set(0, 0.05, -0.22); sael.head.add(saelRing);
      const sh = sprite(soft, 0xffe0a0, 2.2, 0.22); sh.position.set(0, 0.05, -0.3); sael.head.add(sh);
      for (const m of saelMats) U.push(m.uniforms); fine(sael.g); }
    /* a agulha de luz que cai do céu (a alma chegando) e a brasa da alma sem corpo */
    { needle = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.0, 1, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xfff2d0).multiplyScalar(1.6), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); needle.visible = false; scene.add(fine(needle));
      orb = sprite(halo, 0xbfe8ff, 1.2, 0); orb.position.copy(P.ghost).setY(1.3); scene.add(fine(orb)); }
    scene.add(fine(motes.pts)); scene.add(fine(mist.pts));
    scene.add(new THREE.AmbientLight(0xffffff, 1));
  }

  /* ---------- a alma (o seu corpo de luz) ---------- */
  function setSoul(alpha: number) { for (const m of soulMats) m.opacity = m.userData.base * alpha; }
  function makeSoul() {
    if (soul) scene.remove(soul.root); soulMats = [];
    soul = deps.makeSoul(); const r = soul.root; r.position.copy(P.ghost); r.rotation.y = Math.PI; r.scale.setScalar(1.05);
    r.traverse((o) => { const m = o as THREE.Mesh; if (!m.isMesh) return; const old = m.material as THREE.Material & { side?: number }; const ink = old.side === THREE.BackSide;
      const mat = new THREE.MeshBasicMaterial({ color: ink ? 0x3a6aff : 0x8fd0ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: ink ? THREE.BackSide : THREE.FrontSide });
      mat.userData.base = ink ? 0.2 : 0.22; m.material = mat; soulMats.push(mat); m.castShadow = false; });
    scene.add(fine(r));
  }

  /* ---------- interface: nomes, diálogo, escolhas ---------- */
  const el = document.createElement('div'); el.id = 'limiar';
  el.innerHTML = `<div class="lm-title"><small>entre uma vida e outra</small><b>O Limiar</b><i>o centro do labirinto</i></div>
    <div class="lm-tag" data-t="orv"><b>Orvalen</b><small>o Leitor de Rastros</small></div>
    <div class="lm-tag" data-t="sael"><b>Sael</b><small>a Que Voltou</small></div>
    <div class="lm-tag far" data-t="marg"><b>Marghar</b><small>o Deus dos Caminhos</small></div>
    <div class="lm-dlg"><div class="lm-who"></div><div class="lm-txt"></div><div class="lm-ops"></div><div class="lm-next">clique para continuar ▾</div></div>
    <div class="lm-flash"></div>`;
  const $ = (s: string) => el.querySelector(s) as HTMLElement;
  let typing: { full: string; shown: number } | null = null, onNext: (() => void) | null = null;
  type Who = 'orv' | 'sael' | 'narr';
  const WHO: Record<Who, [string, string]> = { orv: ['Orvalen', '#9fe8ff'], sael: ['Sael', '#ffd890'], narr: ['', '#cbbfa6'] };
  let speaker: Who = 'narr';
  function say(who: Who, text: string, then: () => void) {
    speaker = who; deps.audio.bell(who === 'orv' ? 147 : who === 'sael' ? 220 : 110, who === 'narr' ? 0.03 : 0.045);
    const w = $('.lm-who'); w.textContent = WHO[who][0]; w.style.color = WHO[who][1]; $('.lm-dlg').classList.toggle('narr', who === 'narr');
    $('.lm-ops').innerHTML = ''; $('.lm-next').style.visibility = 'hidden'; $('.lm-dlg').classList.add('on');
    typing = { full: text, shown: 0 }; onNext = then;
  }
  function choose(ops: { label: string; sub?: string; dis?: boolean; go: () => void }[], prompt?: { who: Who; text: string }) {
    const show = () => { $('.lm-next').style.visibility = 'hidden'; const box = $('.lm-ops');
      box.innerHTML = ops.map((o, i) => `<button data-i="${i}" ${o.dis ? 'disabled' : ''}><b>${esc(o.label)}</b>${o.sub ? `<small>${esc(o.sub)}</small>` : ''}</button>`).join('');
      box.onclick = (e) => { const b = (e.target as HTMLElement).closest('button') as HTMLButtonElement | null; if (!b || b.disabled) return; box.onclick = null; box.innerHTML = ''; deps.audio.chime(); ops[+b.dataset.i!].go(); }; };
    if (prompt) say(prompt.who, prompt.text, () => { /* espera a escolha */ }); else { $('.lm-txt').textContent = ''; }
    if (prompt) { const t = typing!; const wait = () => { if (typing === t && t.shown < t.full.length) { setTimeout(wait, 60); return; } show(); onNext = null; }; wait(); } else show();
  }
  function advance() {
    if (!active) return;
    if (typing && typing.shown < typing.full.length) { typing.shown = typing.full.length; $('.lm-txt').textContent = typing.full; if (onNext) $('.lm-next').style.visibility = 'visible'; return; }
    if (onNext && $('.lm-ops').childElementCount === 0) { const f = onNext; onNext = null; f(); }
  }
  el.addEventListener('click', (e) => { if ((e.target as HTMLElement).closest('.lm-ops')) return; advance(); });
  const keyH = (e: KeyboardEvent) => { if (!active) return; const tg = e.target as HTMLElement; if (tg && (tg.tagName === 'INPUT' || tg.tagName === 'TEXTAREA')) return;
    if (document.getElementById('create')?.style.display === 'grid') return; e.stopPropagation(); e.preventDefault(); if (e.code === 'Space' || e.code === 'Enter') advance(); };
  addEventListener('keydown', keyH, true); el.addEventListener('wheel', (e) => e.stopPropagation());

  /* ---------- roteiro ---------- */
  let info: LimiarInfo, pickCb: (k: Pick) => void = () => { /* */ };
  let stage: 'intro' | 'talk' | 'out' | 'wait' = 'intro', stT = 0, fx = { read: 0, reading: false, erase: 0, give: 0, tear: -1, dissolve: 0, form: 1, wake: 0, ess: 0, title: 0, eyeOpen: 0 };
  let camFrom = new THREE.Vector3(), camTo = new THREE.Vector3(), lookFrom = new THREE.Vector3(), lookTo = new THREE.Vector3(), camK = 1, camDur = 1, outCb: (() => void) | null = null;
  const camPos = new THREE.Vector3(), camLook = new THREE.Vector3();
  const REST = new THREE.Vector3(0, 4.4, 11.5), REST_L = new THREE.Vector3(0, -0.3, -24); // olhando um pouco para baixo: o labirinto lá embaixo, até o horizonte
  function moveCam(to: THREE.Vector3, look: THREE.Vector3, dur: number) { camFrom.copy(camPos); lookFrom.copy(camLook); camTo.copy(to); lookTo.copy(look); camK = 0; camDur = dur; }
  const alignOf = (k: number) => k >= 60 ? 'a luz é tanta que quase não vejo o chão' : k >= 20 ? 'rastros claros, de quem ajudou mais do que feriu' : k > -20 ? 'claro e escuro na mesma medida; você ainda está decidindo quem é' : k > -60 ? 'rastros escuros, de quem passou por cima de muita coisa' : 'tão negro que a pedra queima onde você pisou';

  function script() {
    const i = info, k = Math.round(i.karma);
    const lines: [Who, string, (() => void)?][] = [
      ['sael', `Calma. Pode respirar, mesmo que já não precise. Você caiu, ${i.name}. O Fio da Vida se rompeu, e a sua alma subiu até o Limiar.`],
      ['sael', 'Eu sou Sael. Um dia estive exatamente onde você está agora, e voltei. Estou aqui para guiar a sua volta.'],
      ['orv', 'E eu sou Orvalen. Eu leio rastros. Os seus ainda estão quentes… deixe-me ver.', () => { fx.reading = true; }],
      ['orv', `${i.race}. ${i.cls}, nível ${i.clsLvl} do caminho, nível ${i.lvl} na estrada. ${i.kills} vidas tiradas, ${i.quests} promessas cumpridas. Karma ${k > 0 ? '+' : ''}${k}: ${alignOf(k)}.`],
    ];
    if (i.lives.length) { const l = i.lives[i.lives.length - 1]; lines.push(['orv', `E não é a primeira vez. Por baixo destes há ${i.lives.length > 1 ? `${i.lives.length} rastros mais antigos` : 'um rastro mais antigo'}. O último era de ${l.race.toLowerCase()}, ${l.cls}, nível ${l.clsLvl}. Você mudou de corpo, mas anda do mesmo jeito.`]); }
    lines.push(['sael', 'Olhe para baixo. Aquilo é Karmika. Os muros sobem e cedem, os caminhos escurecem e clareiam: é gente escolhendo, agora mesmo, enquanto conversamos.']);
    lines.push(['sael', 'E lá no fundo, não tenha medo. É Marghar. Ele não fala e não julga: ele vê. O Olho entre nós é a parte dele que olha para você.']);
    lines.push(['orv', 'Os seus rastros estão nas minhas mãos. Eu posso devolvê-los ou apagá-los. Escolha com calma: aqui o tempo não corre.']);
    const run = (n: number) => { if (n >= lines.length) { hub(); return; } const [w, t, f] = lines[n]; f?.(); say(w, t, () => run(n + 1)); };
    run(0);
  }
  function hub() {
    const i = info;
    choose([
      { label: 'Orvalen, devolva os meus rastros.', sub: `Voltar ao mesmo corpo · Dívida Kármica de ${i.debt.toLocaleString('pt-BR')} XP`, go: () => say('orv', `Devolvo como estão: o mesmo rosto, o mesmo caminho, tudo o que você carregava. Mas a estrada que você deixou de andar fica devendo. A dívida é de ${i.debt.toLocaleString('pt-BR')} XP: metade de tudo o que aprender daqui em diante vai pagá-la, até a conta fechar.`, () => confirm('Aceito a dívida. Quero voltar como sou.', () => finish('corpo'))) },
      { label: 'Apague os rastros do corpo. Quero nascer de novo.', sub: 'Reencarnar · outra raça, o mesmo nível, sem classe', go: () => say('orv', 'Apago o corpo e o caminho. A alma fica: o seu nome, o quanto já andou, o que carrega, o ouro, as promessas e o karma. As magias e a força voltam soltas, para você arrumar o que errou.', () => say('sael', `E eu levo você até o corpo novo. Se escolher de novo o caminho de ${i.cls}, a sua alma vai lembrar: aprenderá quatro vezes mais rápido até o nível ${i.clsLvl}. Depois disso, o passo de sempre.`, () => confirm('Quero um corpo novo.', () => finish('reencarne')))) },
      { label: i.tears > 0 ? 'Oferecer uma Lágrima ao Olho.' : 'Oferecer uma Lágrima ao Olho (você não tem nenhuma)', sub: i.tears > 0 ? `Voltar sem penalidade · ${i.place} · Lágrimas: ${i.tears}` : 'Elas caem quando o Olho transborda num ato heroico', dis: i.tears <= 0, go: () => say('sael', `Uma Lágrima é a emoção de Marghar. Ele quase nunca se emociona, e por isso ela vale mais que tudo. Com ela a volta não custa nada: a sua alma reencontra o corpo ${i.place}.`, () => confirm('Ofereço a Lágrima.', () => finish('lagrima'))) },
      { label: 'Quem é Marghar?', go: aboutMarghar },
      { label: 'Por que eu estou aqui?', go: () => say('orv', 'Toda alma anda presa ao corpo por um fio de três fôlegos. Cada queda gasta um, e eles voltam devagar, um por dia. Você caiu sem nenhum. Quando isso acontece, a alma sobe até o centro do labirinto, e alguém precisa ler o que ela foi antes de ela descer de novo.', hub) },
    ], { who: 'orv', text: 'O que você quer que eu faça com os seus rastros?' });
  }
  /** a conversa funda: quem é Marghar, por que ele não age, se seria Ahzur, e o que somos nós */
  function chain(lines: [Who, string][], then: () => void) { const run = (n: number) => { if (n >= lines.length) { then(); return; } say(lines[n][0], lines[n][1], () => run(n + 1)); }; run(0); }
  function aboutMarghar() {
    chain([
      ['sael', 'Antes dos reinos, antes dos deuses que vocês nomeiam nas tavernas, havia o Antes: sem passo, sem movimento, sem parar. Marghar foi o primeiro a pensar em caminhar. Pensou, e o caminhar se abriu para tudo o que pudesse andar.'],
      ['sael', 'Mas o que estava preso no Antes também se soltou, e no meio do que se soltou havia uma fome. Marghar não a combateu. Ergueu este labirinto, corredor por corredor, para que a Fome demorasse a achar quem ainda não está pronto para ela.'],
      ['orv', 'Olhe o Olho. Da parte de cima sai, sem parar, uma luz dourada que sobe e cobre o rosto dele. Da parte de baixo escorre uma névoa azul, escura como a areia da Ampulheta, que desce até o labirinto.'],
      ['sael', 'O Olho que vê você é o mesmo véu que o esconde de ser visto. É o karma, vivo, saindo dele o tempo todo: para cima e para baixo, cada metade com a sua verdade.'],
    ], deeper);
  }
  function deeper() {
    choose([
      { label: 'Por que ele não impede o mal?', go: () => chain([
        ['sael', 'Porque ele não age. Não impede, não mata, não julga. Nunca o vi erguer a mão, nem para salvar, nem para punir.'],
        ['sael', 'Marghar é o querer, e o desejo de querer. É o parar, e o desejo de parar. É o caminho e é o passo, e antes dos dois é a vontade de caminhar. Quem age é quem anda. Ele só vê, e guarda, e um dia devolve.'],
      ], deeper) },
      { label: 'Ele seria Ahzur também?', go: () => chain([
        ['orv', 'Você pergunta o que eu me pergunto há mais tempo do que existem nomes.'],
        ['orv', 'Às vezes os rastros parecem dizer que ele é um sistema sem fim, que se alimenta de si e se devora, como a serpente que morde a própria cauda e desenha o infinito. O caminho e a destruição do caminho, contemplando a si mesmo o tempo todo.'],
        ['sael', 'Não diga isso alto, Leitor. Nem aqui. Ele ouve tudo, e nunca responde.'],
      ], deeper) },
      { label: 'E nós, o que somos?', go: () => chain([
        ['orv', 'Se tudo é Marghar, nós também somos parte dele. Somos caminhantes, e somos caminho.'],
        ['sael', 'Somos fome, e somos alimento. É por isso que o labirinto importa: ele nos dá tempo de escolher qual dos dois ser, antes de a Fome chegar.'],
      ], deeper) },
      { label: 'Voltar à minha escolha.', go: hub },
    ], { who: 'sael', text: 'Pergunte. Aqui ninguém tem pressa, nem ele.' });
  }
  function confirm(yes: string, go: () => void) { choose([{ label: yes, go }, { label: 'Espere. Quero pensar de novo.', go: hub }]); }
  function finish(k: Pick) {
    $('.lm-dlg').classList.remove('on'); stage = 'wait';
    if (k === 'corpo') { fx.give = 0.001; deps.audio.bell(147, 0.07); setTimeout(() => descend(() => pickCb('corpo')), 2600); }
    else if (k === 'lagrima') { fx.tear = 0; deps.audio.bell(330, 0.06); setTimeout(() => descend(() => pickCb('lagrima')), 3200); }
    else { fx.erase = 0.001; deps.audio.bell(110, 0.08); setTimeout(() => { fx.dissolve = 0.001; }, 900);
      setTimeout(() => { say('sael', 'Agora escolha o seu corpo novo. Eu espero com você.', () => { /* */ }); setTimeout(() => { $('.lm-dlg').classList.remove('on'); pickCb('reencarne'); }, 2600); }, 2800); }
  }
  /** desce de volta ao mundo: a câmera mergulha no labirinto, a luz cresce até o branco */
  function descend(cb: () => void, reform = false) {
    if (reform) { makeSoul(); fx.dissolve = 0; fx.form = 0; reforming = true; deps.audio.bell(220, 0.06); }
    setTimeout(() => { stage = 'out'; stT = 0; outCb = cb; deps.audio.soulRise(0, 0); moveCam(new THREE.Vector3(0, -6, -18), new THREE.Vector3(0, -60, -120), 2.6); }, reform ? 1800 : 0);
  }

  /* ---------- quadro a quadro ---------- */
  const v3 = new THREE.Vector3();
  let speed = 1; // testes: acelera o tempo do Limiar
  function frame(dt0: number, w: number, h: number) {
    const dt = dt0 * speed; T += dt; stT += dt; for (const u of U) u.uT.value = T;
    cam.aspect = w / h; cam.updateProjectionMatrix(); motes.mat.uniforms.uScale.value = mist.mat.uniforms.uScale.value = h / (2 * Math.tan((cam.fov * Math.PI) / 360));
    /* câmera */
    if (stage === 'intro') {
      const P0 = new THREE.Vector3(0, 200, 60), P1 = new THREE.Vector3(0, 13, 17), L0 = new THREE.Vector3(0, -70, -20), L1 = new THREE.Vector3(0, 1.5, 0);
      if (stT < 3.8) { const k = ease(stT / 3.8); camPos.lerpVectors(P0, P1, k); camLook.lerpVectors(L0, L1, k); }
      else { const k = ease((stT - 3.8) / 2.8); camPos.lerpVectors(P1, REST, k); camLook.lerpVectors(L1, REST_L, k); }
      /* a agulha cai do céu e pousa no centro */
      if (stT < 3.6) { const k = stT / 3.6, y = lerp(220, 1.2, k * k); needle.visible = true; needle.position.set(P.ghost.x, y + 6, P.ghost.z); needle.scale.set(1, 12 * (1 - k) + 1, 1);
        for (let i = 0; i < 3; i++) motes.spawn(P.ghost.x + (Math.random() - 0.5) * 0.3, y + Math.random() * 8, P.ghost.z + (Math.random() - 0.5) * 0.3, { vy: 6, life: 0.8, c0: 0xfff0c0, c1: 0x8a6aff, s0: 0.25, s1: 0.03 }); }
      else if (needle.visible) { needle.visible = false; deps.audio.bell(98, 0.09); flash(0.85, 0.9);
        for (let i = 0; i < 160; i++) { const a = Math.random() * 6.283, sp = 3 + Math.random() * 9; motes.spawn(P.ghost.x, 0.3, P.ghost.z, { vx: Math.cos(a) * sp, vy: Math.random() * 3, vz: Math.sin(a) * sp, life: 1.4, drag: 2.2, c0: 0xffffff, c1: 0xffb060, s0: 0.3, s1: 0.04 }); } }
      fx.wake = clamp01((stT - 3.5) / 1.2); fx.form = clamp01((stT - 3.6) / 1.6); fx.ess = clamp01((stT - 4.6) / 1.8); fx.eyeOpen = clamp01((stT - 5.6) / 0.6);
      fx.title = stT > 6.2 ? clamp01((stT - 6.2) / 0.6) * (1 - clamp01((stT - 9.4) / 0.8)) : 0;
      if (stT > 7.6) { stage = 'talk'; script(); }
    } else if (stage === 'out') { fx.title = 0;
      camK = Math.min(1, camK + dt / camDur); const k = camK * camK; camPos.lerpVectors(camFrom, camTo, k); camLook.lerpVectors(lookFrom, lookTo, k);
      if (soul) soul.root.position.y = P.ghost.y - k * 14;
      setFlash(clamp01((stT - 1.4) / 1.1));
      if (stT > 2.6 && outCb) { const f = outCb; outCb = null; f(); close(); }
    } else { fx.title = Math.max(0, fx.title - dt * 0.7);
      if (camK < 1) { camK = Math.min(1, camK + dt / camDur); const k = ease(camK); camPos.lerpVectors(camFrom, camTo, k); camLook.lerpVectors(lookFrom, lookTo, k); }
      else { /* respiração da câmera e um leve olhar para quem fala */
        const sx = speaker === 'orv' ? -0.9 : speaker === 'sael' ? 0.9 : 0; camLook.x += (sx - camLook.x) * Math.min(1, dt * 1.2); camLook.y = REST_L.y; camLook.z = REST_L.z;
        camPos.set(REST.x + Math.sin(T * 0.13) * 0.25 + camLook.x * 0.25, REST.y + Math.sin(T * 0.21) * 0.08, REST.z); }
    }
    cam.position.copy(camPos); cam.lookAt(camLook);
    /* labirinto: muros sobem e cedem, almas correm pelos corredores */
    if (walls) {
      const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), pos = new THREE.Vector3(), ax = new THREE.Vector3(0, 1, 0);
      for (let n = 0; n < wallData.length; n++) { const wd = wallData[n];
        wd.next -= dt; if (wd.next <= 0) { wd.next = 4 + Math.random() * 14; wd.tgt = Math.random() < 0.62 ? 1 : 0; }
        wd.h += ((wd.tgt ? wd.maxH : 0) - wd.h) * Math.min(1, dt * 0.9);
        q.setFromAxisAngle(ax, wd.rot); sc.set(wd.len + 0.8, Math.max(0.001, wd.h), 0.9); pos.set(wd.x, LY, wd.z); mtx.compose(pos, q, sc); walls.setMatrixAt(n, mtx); }
      walls.instanceMatrix.needsUpdate = true;
      for (const r of runners) { r.x += r.dx * r.sp * dt; r.z += r.dz * r.sp * dt; r.turn += r.sp * dt;
        if (r.turn >= LC) { r.turn -= LC; r.x = Math.round(r.x / LC) * LC; r.z = Math.round(r.z / LC) * LC; const t = Math.random(); if (t < 0.35) { const s = r.dx; r.dx = -r.dz; r.dz = s; } else if (t < 0.6) { const s = r.dx; r.dx = r.dz; r.dz = -s; } }
        if (Math.abs(r.x) > 410 || r.z > 66 || r.z < -770) { r.x = Math.round((Math.random() - 0.5) * 66) * LC; r.z = 60 - Math.round(Math.random() * 68) * LC; }
        if (Math.random() < dt * 4) motes.spawn(r.x, LY + 0.6, r.z, { life: 0.6, c0: r.dark ? 0xd02a3a : 0xffe0a0, c1: r.dark ? 0x300010 : 0x804010, s0: 1.1, s1: 0.3 }); }
    }
    /* poeira de luz em volta da plataforma */
    if (Math.random() < dt * 30) { const a = Math.random() * 6.283, r = 3 + Math.random() * 12; motes.spawn(Math.cos(a) * r, -3 + Math.random() * 3, Math.sin(a) * r - 2, { vy: 0.6 + Math.random() * 0.8, life: 4 + Math.random() * 3, c0: Math.random() < 0.5 ? 0xffd890 : 0xa080ff, c1: 0x2a1a50, s0: 0.07, s1: 0.02 }); }
    platMat.uniforms.uWake.value = fx.wake + Math.max(0, fx.give > 0 ? 0.6 : 0);
    /* Marghar respira devagar e quase não se mexe */
    /* Marghar respira (as asas sobem e descem devagar), olha para um lado e para o outro, e os anéis de runas giram */
    for (const w of marghar.wings) { const k = Math.sin(T * 0.32 + w.ph); w.piv.rotation.set(w.base.x, w.base.y + k * w.amp * 0.6, w.base.z + k * w.amp * Math.sign(w.base.z || 1)); }
    marghar.head.position.x = Math.sin(T * 0.21) * 0.1 + Math.sin(T * 0.067) * 0.05; marghar.g.rotation.y = Math.sin(T * 0.21) * 0.28 + Math.sin(T * 0.067) * 0.12; marghar.g.rotation.z = Math.sin(T * 0.13) * 0.03; margharG.rotation.y = -0.2 + Math.sin(T * 0.045) * 0.1;
    marghar.halos.forEach((h, k) => { h.rotation.z = T * (0.05 + k * 0.03) * (k % 2 ? -1 : 1); h.rotation.x = Math.sin(T * 0.1 + k) * 0.4; h.rotation.y = Math.cos(T * 0.08 + k * 2) * 0.5; });
    /* Essências aparecem e flutuam */
    const ea = fx.ess; for (const m of [...orvMats, ...saelMats]) m.uniforms.uA.value = ea;
    orv.g.visible = sael.g.visible = ea > 0; (saelRing.material as THREE.MeshBasicMaterial).opacity = 0.85 * ea; lantern.material.opacity = 0.6 * ea; (lanternCore.material as THREE.MeshBasicMaterial).visible = ea > 0.05;
    orv.g.position.y = P.orv.y + Math.sin(T * 0.9) * 0.05; sael.g.position.y = P.sael.y + Math.sin(T * 0.8 + 1) * 0.06; saelRing.rotation.z = T * 0.4;
    orv.R.a.rotation.x = -0.35 - (fx.reading || fx.give > 0 || fx.erase > 0 ? 0.55 : 0) * ea; orv.L.a.rotation.x = fx.give > 0 || fx.erase > 0 ? -1.1 : -0.2;
    lantern.scale.setScalar((1.3 + Math.sin(T * 7) * 0.08 + (fx.reading ? 0.5 : 0)) * ea);
    if (ea > 0.3 && Math.random() < dt * 6) { lanternCore.getWorldPosition(v3); motes.spawn(v3.x, v3.y, v3.z, { vx: (Math.random() - 0.5) * 0.3, vy: 0.4, vz: (Math.random() - 0.5) * 0.3, life: 1.6, c0: 0xbff4ff, c1: 0x2a6aff, s0: 0.06, s1: 0.01 }); }
    /* rastros: giram nos pés de Orvalen; ao ler, saem dos seus pés e sobem até a lanterna */
    for (let i = 0; i < prints.length; i++) { const m = prints[i], mm = m.material as THREE.MeshBasicMaterial;
      if (fx.reading || fx.give > 0 || fx.erase > 0) { fx.read = Math.min(1, fx.read + dt * 0.12); const k = (i / prints.length + T * 0.06) % 1, x = lerp(P.ghost.x, P.orv.x, k) + Math.sin(k * 9 + i) * 0.9, z = lerp(P.ghost.z, P.orv.z, k) + Math.cos(k * 7) * 0.8;
        m.position.set(x, 0.03, z); m.rotation.z = Math.atan2(P.orv.x - P.ghost.x, P.orv.z - P.ghost.z) + (i % 2 ? 0.2 : -0.2); mm.opacity = Math.sin(k * Math.PI) * 0.8 * ea * (fx.erase > 0 ? 1 - clamp01(fx.erase) : 1);
        mm.color.set(fx.erase > 0 ? 0x5a2a8a : 0x9fe8ff);
        if (Math.random() < dt * 1.5) { lanternCore.getWorldPosition(v3); motes.spawn(x, 0.1, z, { vx: (v3.x - x) * 0.6, vy: (v3.y - 0.1) * 0.6, vz: (v3.z - z) * 0.6, life: 1.6, c0: fx.erase > 0 ? 0x8a5aff : 0x9fe8ff, c1: 0xffffff, s0: 0.08, s1: 0.03 }); } }
      else { const a = (i / prints.length) * 6.283 + T * 0.35; m.position.set(P.orv.x + Math.cos(a) * 1.1, 0.03, P.orv.z + Math.sin(a) * 1.1); m.rotation.z = -a; mm.opacity = 0.4 * ea; } }
    if (fx.erase > 0) fx.erase += dt * 0.5;
    /* o Fio de Sael até a sua alma: um fio de grãos de ouro */
    if (ea > 0.4 && soul && (fx.dissolve < 1 || fx.form < 1)) { sael.L.hand.getWorldPosition(v3); const gx = P.ghost.x, gy = 1.3 + (soul.root.position.y - P.ghost.y), gz = P.ghost.z;
      for (let i = 0; i < 2; i++) { const k = Math.random(), x = lerp(v3.x, gx, k), y = lerp(v3.y, gy, k) + Math.sin(k * Math.PI) * 0.7 + Math.sin(T * 2 + k * 9) * 0.06, z = lerp(v3.z, gz, k);
        motes.spawn(x, y, z, { life: 0.5, c0: 0xffe8a0, c1: 0xffb040, s0: 0.05, s1: 0.03 }); } }
    /* a sua alma */
    if (soul) { soul.update?.(dt, T, 0, null); const giveK = fx.give > 0 ? Math.min(1, (fx.give += dt * 0.6)) : 0;
      soul.root.position.y = stage === 'out' ? soul.root.position.y : P.ghost.y + Math.sin(T * 1.1) * 0.05 + 0.08;
      const formK = fx.form < 1 ? fx.form : 1; if (stage !== 'intro' && fx.form < 1) fx.form = Math.min(1, fx.form + dt * 0.7);
      const dis = fx.dissolve > 0 ? Math.min(1, (fx.dissolve += dt * 0.55)) : 0;
      setSoul(formK * (1 - dis) * (1 + giveK * 1.4) * (0.85 + 0.15 * Math.sin(T * 2.2)));
      soul.root.scale.setScalar(1.05 * (0.4 + 0.6 * ease(formK)));
      if (dis > 0 && dis < 1) for (let i = 0; i < 4; i++) motes.spawn(P.ghost.x + (Math.random() - 0.5) * 0.9, Math.random() * 2.2, P.ghost.z + (Math.random() - 0.5) * 0.6, { vy: 0.8, vx: (Math.random() - 0.5) * 0.5, life: 1.4, c0: 0x9fd8ff, c1: 0x3a2a8a, s0: 0.08, s1: 0.02 });
      if (formK < 1 && formK > 0) for (let i = 0; i < 3; i++) { const a = Math.random() * 6.283, r = 1.6; motes.spawn(P.ghost.x + Math.cos(a) * r, Math.random() * 2.2, P.ghost.z + Math.sin(a) * r, { vx: -Math.cos(a) * 1.8, vz: -Math.sin(a) * 1.8, life: 0.9, c0: 0xbfe8ff, c1: 0xffffff, s0: 0.06, s1: 0.02 }); }
      orb.material.opacity = 0.9 * (fx.dissolve > 0 ? dis : reforming ? 1 - fx.form : 0); orb.scale.setScalar(1.1 + Math.sin(T * 3) * 0.1); orb.position.y = 1.3 + Math.sin(T * 1.4) * 0.12;
      if (giveK > 0 && giveK < 1) for (let i = 0; i < 3; i++) motes.spawn(P.ghost.x + (Math.random() - 0.5), Math.random() * 2.2, P.ghost.z + (Math.random() - 0.5), { vy: 1.5, life: 0.8, c0: 0xffffff, c1: 0x9fe8ff, s0: 0.08, s1: 0.02 }); }
    /* o karma sai do Olho o tempo todo: ouro para cima, névoa azul-escura para baixo */
    if (fx.eyeOpen > 0) { const ex = eye.position.x, ey = eye.position.y, ez = eye.position.z, k = fx.eyeOpen, S = eye.scale.x;
      /* sai da pálpebra INTEIRA: o ouro de toda a de cima (sobe), a névoa de toda a de baixo (desce) */
      const lid = (up: boolean) => { const t = Math.random(), x = (-3.4 + 6.8 * t) * S, y = 2 * (1 - t) * t * 2.84 * S * (up ? 1 : -1); return [ex + x, ey + y, ez + 0.05, x] as const; };
      for (let i = 0; i < 9; i++) if (Math.random() < k) { const [x, y, z, lx] = lid(true); motes.spawn(x, y, z, { vx: lx * 0.25 + (Math.random() - 0.5) * 0.6, vy: 4 + Math.random() * 7, vz: (Math.random() - 0.5) * 0.4, life: 2.4 + Math.random() * 2, c0: 0xfff6d0, c1: 0xffa030, s0: 0.09 + Math.random() * 0.08, s1: 0.2, drag: 0.08 }); }
      for (let i = 0; i < 4; i++) if (Math.random() < k) { const [x, y, z, lx] = lid(false); mist.spawn(x, y, z, { vx: lx * 0.3 + (Math.random() - 0.5) * 0.8, vy: -1.4 - Math.random() * 2.6, vz: (Math.random() - 0.5) * 0.6, life: 3.5 + Math.random() * 2.5, c0: 0x3a4aa0, c1: 0x0a0e2a, s0: 0.5, s1: 2.4, drag: 0.25 }); }
      veilUp.material.opacity = (0.85 + Math.sin(T * 1.3) * 0.12) * k; veilDn.material.opacity = (0.7 + Math.sin(T * 0.9) * 0.08) * k; }
    /* o Olho: abre, pisca, olha para você ou para quem fala, e chora a Lágrima */
    { const open = fx.eyeOpen; const blink = (T % 7.3) < 0.14 ? 0.08 : 1; eyeLid.scale.y = Math.max(0.03, open * blink); eye.visible = open > 0;
      (eyeGlow.material as THREE.SpriteMaterial).opacity = 0.3 * open + (fx.tear >= 0 ? 0.3 : 0);
      const tx = speaker === 'orv' ? -0.55 : speaker === 'sael' ? 0.55 : 0, ty = speaker === 'narr' ? -0.35 : -0.2;
      iris.position.x += (tx - iris.position.x) * Math.min(1, dt * 2); iris.position.y += (ty - iris.position.y) * Math.min(1, dt * 2); eye.position.y = P.eye.y + Math.sin(T * 0.5) * 0.15;
      if (fx.tear >= 0) { fx.tear += dt; const k = clamp01(fx.tear / 1.8), x = lerp(P.eye.x, P.ghost.x, k), y = lerp(P.eye.y - 1.4, 1.4, k * k), z = lerp(P.eye.z, P.ghost.z, k);
        motes.spawn(x, y, z, { life: 0.6, c0: 0xffffff, c1: 0x9ad7ff, s0: 0.22, s1: 0.05 }); if (k >= 1 && fx.give === 0) { fx.give = 0.001; flash(0.6, 0.8); for (let i = 0; i < 90; i++) { const a = Math.random() * 6.283; motes.spawn(P.ghost.x, 1.2, P.ghost.z, { vx: Math.cos(a) * 4, vy: Math.random() * 4, vz: Math.sin(a) * 4, drag: 2, life: 1.2, c0: 0xffffff, c1: 0xffd890, s0: 0.15, s1: 0.03 }); } } } }
    motes.update(dt); mist.update(dt);
    /* nomes sobre as figuras */
    const tag = (k: string, p: THREE.Vector3, vis: number) => { const t = el.querySelector(`[data-t="${k}"]`) as HTMLElement; v3.copy(p).project(cam); const on = vis > 0.3 && v3.z < 1 && stage === 'talk';
      t.style.opacity = on ? String(Math.min(1, vis)) : '0'; t.style.left = `${(v3.x * 0.5 + 0.5) * 100}%`; t.style.top = `${(-v3.y * 0.5 + 0.5) * 100}%`; };
    tag('orv', v3.set(P.orv.x, 3.55, P.orv.z).clone(), ea); tag('sael', v3.set(P.sael.x, 3.35, P.sael.z).clone(), ea); marghar.head.getWorldPosition(v3); tag('marg', v3.clone().setY(v3.y + 70), ea * 0.8);
    $('.lm-title').style.opacity = String(fx.title);
    if (typing && typing.shown < typing.full.length) { typing.shown = Math.min(typing.full.length, typing.shown + dt * 44); $('.lm-txt').textContent = typing.full.slice(0, Math.floor(typing.shown)); if (typing.shown >= typing.full.length && onNext && $('.lm-ops').childElementCount === 0) $('.lm-next').style.visibility = 'visible'; }
  }
  let flashT = 0;
  function setFlash(a: number) { $('.lm-flash').style.opacity = String(a); }
  function flash(a: number, dur: number) { const f = $('.lm-flash'); f.style.transition = 'none'; f.style.opacity = String(a); clearTimeout(flashT); flashT = window.setTimeout(() => { f.style.transition = `opacity ${dur}s ease-out`; f.style.opacity = '0'; }, 30); }

  function open(i: LimiarInfo, pick: (k: Pick) => void, o: { stage?: 'reborn' } = {}) {
    if (!built) build(); info = i; pickCb = pick; active = true; T = 0; stT = 0; speaker = 'narr'; reforming = false;
    fx = { read: 0, reading: false, erase: 0, give: 0, tear: -1, dissolve: 0, form: 0, wake: 0, ess: 0, title: 0, eyeOpen: 0 };
    makeSoul(); document.body.appendChild(el); document.body.classList.add('in-limiar'); el.classList.add('on'); $('.lm-dlg').classList.remove('on'); $('.lm-ops').innerHTML = ''; $('.lm-flash').style.opacity = '0';
    deps.use(scene, cam); deps.audio.celestial(true);
    if (o.stage === 'reborn') { stage = 'wait'; fx.wake = 1; fx.ess = 1; fx.eyeOpen = 1; fx.form = 1; fx.dissolve = 1; camPos.copy(REST); camLook.copy(REST_L); camK = 1;
      setTimeout(() => say('sael', 'Você voltou ao Limiar no meio da escolha. O corpo novo ainda espera por você.', () => { /* */ }), 600); setTimeout(() => { $('.lm-dlg').classList.remove('on'); pickCb('reencarne'); }, 3600); }
    else { stage = 'intro'; camPos.set(0, 200, 60); camLook.set(0, -70, -20); }
  }
  function close() {
    active = false; deps.restore(); deps.audio.celestial(false); document.body.classList.remove('in-limiar');
    el.classList.remove('on'); const f = $('.lm-flash'); f.style.transition = 'none'; f.style.opacity = '1';
    setTimeout(() => { f.style.transition = 'opacity 1.4s ease-out'; f.style.opacity = '0'; }, 60); setTimeout(() => { if (!active) el.remove(); }, 1600);
  }
  /** compila os shaders antes (enquanto a faísca sobe), para a chegada não engasgar */
  function prepare() { if (!built) build(); if (!soul) makeSoul(); try { deps.compile(scene, cam); } catch { /* */ } }
  return { get active() { return active; }, open, descend, frame, prepare, set speed(v: number) { speed = v; } };
}
export type Limiar = ReturnType<typeof createLimiar>;

/* ============================================================================================
   A faísca: morrer sem fôlego. Uma faísca sai do corpo caído, cresce um pouco, começa a vibrar e,
   de repente, sobe rápida, afinando como uma agulha, até o céu. A tela esmaece.
   ============================================================================================ */
export function soulSpark(scene: THREE.Scene, from: THREE.Vector3, o: { burst(x: number, y: number, z: number, c0: number, c1: number): void; rise(): void; fade(a: number): void; done(): void }) {
  const tex = radialTex([[0, 'rgba(255,255,255,1)'], [0.2, 'rgba(255,250,230,.8)'], [1, 'rgba(255,255,255,0)']]);
  const core = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: 0xfff4d8, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false }));
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: 0x9a7aff, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false }));
  const needle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.0, 1, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xfff2d0).multiplyScalar(3), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false }));
  needle.geometry.translate(0, -0.5, 0); needle.visible = false;
  const g = new THREE.Group(); g.add(glow, core, needle); g.position.copy(from).setY(from.y + 0.6); scene.add(fine(g));
  let t = 0, y = 0, v = 0, raf = 0, risen = false, last = performance.now();
  const step = () => {
    const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
    if (t < 1.3) { const k = t / 1.3; g.position.y = from.y + 0.6 + k * 0.9; core.scale.setScalar(0.25 + k * 0.45); glow.scale.setScalar(0.8 + k * 1.4); if (Math.random() < 0.5) o.burst(g.position.x, g.position.y, g.position.z, 0xfff0c0, 0x8a6aff); }
    else if (t < 2.5) { const k = (t - 1.3) / 1.2, a = 0.03 + k * 0.1; g.position.x = from.x + (Math.random() - 0.5) * a; g.position.z = from.z + (Math.random() - 0.5) * a; core.scale.setScalar(0.7 + Math.sin(t * 70) * 0.08 * (1 + k * 2)); glow.scale.setScalar(2.2 + Math.sin(t * 45) * 0.3 + k * 0.6);
      core.material.color.setHSL(0.11, 0.6, 0.85 + Math.sin(t * 60) * 0.1); }
    else { if (!risen) { risen = true; o.rise(); needle.visible = true; g.position.x = from.x; g.position.z = from.z; }
      v += dt * 140; y += v * dt; g.position.y = from.y + 1.5 + y; const k = Math.min(1, (t - 2.5) / 0.5);
      core.scale.set(0.7 * (1 - k * 0.8), 0.7 + k * 2.2, 1); glow.scale.setScalar(2.4 * (1 - k * 0.6)); needle.scale.set(1, Math.min(40, 1 + y * 1.2), 1);
      o.burst(g.position.x, g.position.y - 0.4, g.position.z, 0xfff6e0, 0x7a5aff); o.fade(Math.min(1, (t - 2.7) / 0.9)); }
    if (t > 3.7) { scene.remove(g); tex.dispose(); o.done(); return; }
    raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step); void raf;
}
