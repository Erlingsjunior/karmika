import * as THREE from 'three';

/* =====================================================================================================
   O LOBISOMEM DE PÉ (25/10/2026)
   Erling: "não vai me fazer um lobisomem gordo parecendo um barril".
   Nada de tronco cilíndrico: a forma é um V. Peito largo e fundo, cintura fina de cão, quadril estreito, braços compridos
   (as mãos passam do joelho), pernas digitígradas de lobo (coxa grossa, canela que volta, o pé comprido e a pata no chão),
   corcunda para a frente, cabeça de lobo com focinho comprido, juba nos ombros e pelo em tufos no antebraço e no lombo.
   Todo pedaço é um músculo de torno (perfil com barriga e pontas arredondadas), achatado em elipse; nada de cubo nem bola.
   Serve para a Forma da Besta do jogador lobisomem e para o Lobisomem inimigo.
   ===================================================================================================== */

const ramp = new THREE.DataTexture(new Uint8Array([58, 58, 58, 255, 128, 128, 128, 255, 205, 205, 205, 255, 255, 255, 255, 255]), 4, 1, THREE.RGBAFormat);
ramp.minFilter = ramp.magFilter = THREE.NearestFilter; ramp.needsUpdate = true;

/** pelo: fios curtos claros e escuros no sentido do comprimento do músculo */
let furT: THREE.CanvasTexture | null = null;
function furTex() {
  if (furT) return furT;
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d')!;
  g.fillStyle = '#b8b8b8'; g.fillRect(0, 0, 128, 128);
  let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 900; i++) {
    const x = r() * 128, y = r() * 128, l = 4 + r() * 9, v = r();
    g.strokeStyle = v < 0.5 ? `rgba(40,34,30,${0.25 + r() * 0.3})` : `rgba(255,250,240,${0.18 + r() * 0.25})`;
    g.lineWidth = 1 + (r() < 0.3 ? 1 : 0); g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 3, y + l); g.stroke();
  }
  furT = new THREE.CanvasTexture(c); furT.colorSpace = THREE.SRGBColorSpace; furT.wrapS = furT.wrapT = THREE.RepeatWrapping; furT.repeat.set(3, 1);
  return furT;
}

/** músculo de torno, descendo de y=0 até y=-len: raio r0 em cima, barriga rm em `at` (0..1), r1 embaixo, pontas fechadas */
function mus(len: number, r0: number, rm: number, r1: number, at = 0.45, seg = 12) {
  const pts: THREE.Vector2[] = [];
  const f = (t: number) => (t < at ? 0.5 * t / at : 0.5 + 0.5 * (t - at) / (1 - at));
  const R = (t: number) => r0 + (r1 - r0) * t + (rm - (r0 + (r1 - r0) * at)) * Math.sin(Math.PI * f(t));
  pts.push(new THREE.Vector2(0.0005, -len - r1 * 0.55), new THREE.Vector2(r1 * 0.55, -len - r1 * 0.42), new THREE.Vector2(r1 * 0.86, -len - r1 * 0.18));
  for (let i = 10; i >= 0; i--) { const t = i / 10; pts.push(new THREE.Vector2(R(t), -len * t)); }
  pts.push(new THREE.Vector2(r0 * 0.86, r0 * 0.18), new THREE.Vector2(r0 * 0.55, r0 * 0.42), new THREE.Vector2(0.0005, r0 * 0.55));
  return new THREE.LatheGeometry(pts, seg);
}
/** o mesmo músculo, subindo (y=0 → +len) */
const musUp = (len: number, r0: number, rm: number, r1: number, at = 0.5, seg = 12) => mus(len, r0, rm, r1, at, seg).rotateZ(Math.PI);
/** entorta uma geometria em arco (garras, tufos): desloca z por k·(y/len)² */
function bend(geo: THREE.BufferGeometry, k: number, len: number) {
  const p = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) { const y = p.getY(i) / len; p.setZ(i, p.getZ(i) + k * y * y); }
  geo.computeVertexNormals(); return geo;
}

export interface BeastPose {
  dt: number; mv: number; wind: number; strike: number; hurt: number;
  /** golpe: garra direita/esquerda, mordida, uivo, bote (salto) */
  mode: 'clawR' | 'clawL' | 'bite' | 'howl' | 'pounce' | null;
  /** em combate: postura baixa, garras abertas */
  combat?: boolean;
}
export interface Beast { root: THREE.Group; mats: THREE.MeshToonMaterial[]; pose(p: BeastPose): void; hand(side: 1 | -1, out: THREE.Vector3): THREE.Vector3; mouth(out: THREE.Vector3): THREE.Vector3 }

export function buildBeast(opt: { fur?: number; belly?: number; eye?: number } = {}): Beast {
  const FUR = opt.fur ?? 0x4a3c32, BELLY = opt.belly ?? 0x76644f, EYE = opt.eye ?? 0xffc23a;
  const ft = furTex();
  const mats: THREE.MeshToonMaterial[] = [];
  const M = (c: number, map = true) => { const m = new THREE.MeshToonMaterial({ color: c, gradientMap: ramp, map: map ? ft : null }); mats.push(m); return m; };
  const fur = M(FUR), furD = M(new THREE.Color(FUR).multiplyScalar(0.62).getHex()), belly = M(BELLY), furM = M(new THREE.Color(FUR).lerp(new THREE.Color(BELLY), 0.4).getHex()), skin = M(0x1e1816, false), claw = M(0xe6dac2, false), mouthM = M(0x5a1418, false), tooth = M(0xf6eee0, false);
  const eyeM = new THREE.MeshBasicMaterial({ color: EYE });
  const mesh = (g: THREE.BufferGeometry, m: THREE.Material, sx = 1, sy = 1, sz = 1) => { const o = new THREE.Mesh(g, m); o.scale.set(sx, sy, sz); o.castShadow = true; return o; };
  const tuft = (len: number, r: number, k: number, m: THREE.Material) => { const g = new THREE.ConeGeometry(r, len, 5, 4); g.translate(0, len / 2, 0); bend(g, k, len); return mesh(g, m, 1, 1, 0.55); };

  const root = new THREE.Group();
  const HIP = 1.02;
  const hips = new THREE.Group(); hips.position.y = HIP; root.add(hips);
  hips.add(mesh(new THREE.SphereGeometry(0.15, 12, 9), fur, 1.15, 0.75, 0.9).translateZ(-0.035));

  /* ---- pernas digitígradas ---- */
  type Leg = { th: THREE.Group; kn: THREE.Group; an: THREE.Group; paw: THREE.Group };
  const legs: Leg[] = [];
  for (const s of [-1, 1]) {
    const th = new THREE.Group(); th.position.set(s * 0.13, -0.02, 0); hips.add(th);
    const thM = mesh(mus(0.44, 0.115, 0.14, 0.07, 0.32), fur, 0.92, 1, 1.12); th.add(thM);
    const thT = tuft(0.13, 0.04, -0.05, furD); thT.position.set(s * 0.08, -0.12, -0.08); thT.rotation.set(-2.3, 0, s * 0.5); th.add(thT);
    const kn = new THREE.Group(); kn.position.y = -0.44; th.add(kn);
    kn.add(mesh(mus(0.42, 0.075, 0.08, 0.045, 0.25), fur, 0.85, 1, 1.05));
    const an = new THREE.Group(); an.position.y = -0.42; kn.add(an);
    an.add(mesh(mus(0.3, 0.048, 0.05, 0.04, 0.5), fur, 0.85, 1, 1));
    const paw = new THREE.Group(); paw.position.y = -0.3; an.add(paw);
    paw.add(mesh(new THREE.SphereGeometry(0.075, 10, 7), fur, 0.95, 0.5, 1.45).translateZ(0.045));
    for (let i = 0; i < 4; i++) { const cg = new THREE.ConeGeometry(0.014, 0.07, 5); cg.rotateX(Math.PI / 2); cg.translate(0, 0, 0.035); bend(cg, -0.01, 0.07); const c = mesh(cg, claw); c.position.set((i - 1.5) * 0.034, -0.02, 0.135 - Math.abs(i - 1.5) * 0.015); c.rotation.x = 0.35; paw.add(c); }
    legs.push({ th, kn, an, paw });
  }

  /* ---- cauda ---- */
  const tail: THREE.Group[] = [];
  { let par: THREE.Object3D = hips; const R = [[0.05, 0.075, 0.07], [0.07, 0.095, 0.08], [0.08, 0.09, 0.06], [0.06, 0.05, 0.012]];
    for (let i = 0; i < 4; i++) { const g = new THREE.Group(); if (i === 0) g.position.set(0, 0.04, -0.15); else g.position.y = -0.17; g.add(mesh(mus(0.19, R[i][0], R[i][1], R[i][2], 0.5, 9), i === 3 ? furD : fur, 1, 1, 0.9)); par.add(g); par = g; tail.push(g); } }

  /* ---- tronco em V ---- */
  const spine = new THREE.Group(); spine.position.set(0, 0.06, 0); hips.add(spine);
  spine.add(mesh(musUp(0.3, 0.14, 0.13, 0.17, 0.4), fur, 1.12, 1, 0.82));
  const abs = mesh(musUp(0.26, 0.09, 0.1, 0.08), furM, 1, 1, 0.45); abs.position.set(0, 0.02, 0.07); spine.add(abs);
  const chest = new THREE.Group(); chest.position.y = 0.28; spine.add(chest);
  chest.add(mesh(musUp(0.46, 0.165, 0.3, 0.15, 0.58, 14), fur, 1.32, 1, 0.84));
  for (const s of [-1, 1]) { const pec = mesh(new THREE.SphereGeometry(0.14, 12, 9), furM, 1, 0.78, 0.5); pec.position.set(s * 0.12, 0.26, 0.16); pec.rotation.z = s * 0.25; chest.add(pec); }
  const ruff = mesh(musUp(0.3, 0.06, 0.12, 0.04, 0.5, 10), belly, 1.1, 1, 0.5); ruff.position.set(0, 0.12, 0.2); chest.add(ruff); // pelo claro do peito descendo em ponta
  // juba: tufos em leque saindo da nuca, dos ombros e descendo o lombo
  for (let l = 0; l < 2; l++) for (let i = 0; i < 13; i++) { const a = (i / 12 - 0.5) * (2.4 - l * 0.6); const t = tuft((0.19 + (1 - Math.abs(a) / 1.2) * 0.08) * (1 - l * 0.2), 0.085 - l * 0.015, -0.12, (i + l) % 2 ? fur : furD); t.position.set(Math.sin(a) * (0.22 - l * 0.05), 0.36 + l * 0.06, -0.02 - Math.cos(a) * 0.08 - l * 0.03); t.rotation.set(-1.2 - l * 0.35 + Math.abs(a) * 0.2, 0, -a * 0.75); chest.add(t); }
  for (let i = 0; i < 6; i++) { const t = tuft(0.14 - i * 0.012, 0.045, -0.05, furD); t.position.set(0, 0.34 - i * 0.12, -0.12 + i * 0.008); t.rotation.x = -2.1; chest.add(t); }
  for (let i = 0; i < 3; i++) { const t = tuft(0.1, 0.035, -0.04, furD); t.position.set(0, 0.25 - i * 0.1, -0.1); t.rotation.x = -2.2; spine.add(t); }

  /* ---- pescoço e cabeça de lobo ---- */
  const neck = new THREE.Group(); neck.position.set(0, 0.43, 0.05); chest.add(neck);
  neck.add(mesh(musUp(0.18, 0.13, 0.12, 0.09), fur, 1, 1, 1.05));
  const head = new THREE.Group(); head.position.set(0, 0.17, 0.02); head.scale.setScalar(1.28); neck.add(head);
  head.add(mesh(new THREE.SphereGeometry(0.135, 14, 10), fur, 1, 0.9, 1.12));
  const brow = mesh(new THREE.SphereGeometry(0.1, 12, 8), furD, 1.15, 0.45, 0.8); brow.position.set(0, 0.05, 0.07); head.add(brow);
  const snout = mesh(mus(0.26, 0.085, 0.07, 0.04, 0.3, 12).rotateX(-Math.PI / 2), fur, 1, 0.78, 1); snout.position.set(0, -0.02, 0.08); head.add(snout);
  const bridge = mesh(mus(0.2, 0.05, 0.045, 0.03, 0.5, 9).rotateX(-Math.PI / 2), furD, 1, 0.6, 1); bridge.position.set(0, 0.03, 0.1); head.add(bridge);
  const nose = mesh(new THREE.SphereGeometry(0.03, 9, 7), skin, 1.2, 0.85, 1); nose.position.set(0, 0.0, 0.345); head.add(nose);
  for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { const tg = new THREE.ConeGeometry(0.008 + (i === 0 ? 0.005 : 0), 0.04 + (i === 0 ? 0.025 : 0), 4); tg.rotateX(Math.PI); const tt = mesh(tg, tooth); tt.position.set(s * (0.04 - i * 0.002), -0.065, 0.3 - i * 0.045); head.add(tt); }
  const jaw = new THREE.Group(); jaw.position.set(0, -0.07, 0.06); head.add(jaw);
  jaw.add(mesh(mus(0.24, 0.06, 0.055, 0.03, 0.3, 10).rotateX(-Math.PI / 2), fur, 1, 0.55, 1));
  const tongue = mesh(new THREE.SphereGeometry(0.04, 8, 6), mouthM, 0.9, 0.3, 2.4); tongue.position.set(0, 0.018, 0.12); jaw.add(tongue);
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const tt = mesh(new THREE.ConeGeometry(0.008 + (i === 0 ? 0.004 : 0), 0.035 + (i === 0 ? 0.02 : 0), 4), tooth); tt.position.set(s * (0.032 - i * 0.002), 0.028, 0.23 - i * 0.05); jaw.add(tt); }
  const mouthIn = mesh(new THREE.SphereGeometry(0.06, 8, 6), mouthM, 0.75, 0.5, 2.2); mouthIn.position.set(0, -0.05, 0.17); head.add(mouthIn);
  for (const s of [-1, 1]) {
    const ear = new THREE.Group(); ear.position.set(s * 0.075, 0.1, -0.03); ear.rotation.set(-0.35, 0, -s * 0.28); head.add(ear);
    const eg = new THREE.ConeGeometry(0.055, 0.19, 6, 3); eg.translate(0, 0.095, 0); bend(eg, -0.03, 0.19); ear.add(mesh(eg, fur, 1, 1, 0.42));
    const inner = mesh(eg.clone(), skin, 0.6, 0.8, 0.25); inner.position.z = 0.012; ear.add(inner);
    const ey = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), eyeM); ey.scale.set(1.3, 0.7, 0.8); ey.position.set(s * 0.062, 0.035, 0.115); ey.rotation.z = s * 0.35; head.add(ey);
    const ck = tuft(0.13, 0.045, -0.06, fur); ck.position.set(s * 0.11, -0.05, 0.0); ck.rotation.set(-1.7, 0, s * 0.9); head.add(ck);
  }
  const glowT = (() => { const c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d')!; const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,220,120,.9)'); gr.addColorStop(1, 'rgba(255,160,40,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); return new THREE.CanvasTexture(c); })();
  for (const s of [-1, 1]) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowT, color: EYE, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.55 })); sp.scale.setScalar(0.09); sp.position.set(s * 0.062, 0.035, 0.13); head.add(sp); }

  /* ---- braços compridos com garras ---- */
  type Arm = { sh: THREE.Group; el: THREE.Group; wr: THREE.Group; fingers: THREE.Group[]; tip: THREE.Object3D };
  const arms: Arm[] = [];
  for (const s of [-1, 1]) {
    const delt = mesh(new THREE.SphereGeometry(0.115, 12, 9), fur, 1, 0.9, 1); delt.position.set(s * 0.29, 0.36, -0.01); chest.add(delt);
    const sh = new THREE.Group(); sh.position.set(s * 0.31, 0.34, 0); chest.add(sh);
    sh.add(mesh(mus(0.42, 0.095, 0.105, 0.068, 0.35), fur, 1, 1, 1.05));
    const el = new THREE.Group(); el.position.y = -0.42; sh.add(el);
    el.add(mesh(mus(0.4, 0.078, 0.088, 0.048, 0.3), fur, 1, 1, 1));
    for (let i = 0; i < 3; i++) { const t = tuft(0.12, 0.035, -0.04, furD); t.position.set(s * 0.05, -0.07 - i * 0.09, -0.05); t.rotation.set(-2.6, 0, s * 0.5); el.add(t); }
    const wr = new THREE.Group(); wr.position.y = -0.4; el.add(wr);
    wr.add(mesh(new THREE.SphereGeometry(0.065, 10, 8), fur, 0.95, 1.2, 0.7).translateY(-0.04));
    const fingers: THREE.Group[] = [];
    for (let i = 0; i < 5; i++) {
      const thumb = i === 4; const fg = new THREE.Group();
      fg.position.set(thumb ? -s * 0.0 : (i - 1.5) * 0.026 * s, thumb ? -0.04 : -0.095, thumb ? 0.055 : 0.01 + (1.5 - Math.abs(i - 1.5)) * 0.006); if (thumb) fg.rotation.set(0.6, 0, -s * 0.6); wr.add(fg);
      fg.add(mesh(mus(0.06, 0.016, 0.016, 0.013, 0.5, 7), fur));
      const cg = new THREE.ConeGeometry(0.014, 0.12, 6, 3); cg.rotateX(Math.PI); cg.translate(0, -0.06, 0); bend(cg, 0.035, 0.12);
      const c = mesh(cg, claw); c.position.y = -0.06; fg.add(c); fingers.push(fg);
    }
    const tip = new THREE.Object3D(); tip.position.set(0, -0.22, 0.05); wr.add(tip);
    arms.push({ sh, el, wr, fingers, tip });
  }

  const st = { ph: 0, t: 0, br: 0, mvS: 0 };
  const L = THREE.MathUtils.lerp;
  function pose(p: BeastPose) {
    const dt = Math.min(0.05, p.dt); st.t += dt;
    st.mvS += (p.mv - st.mvS) * Math.min(1, dt * 8); const mv = st.mvS;
    const run = Math.min(1, mv / 2.2), sprint = Math.max(0, Math.min(1, (mv - 3.5) / 2.5));
    st.ph += dt * (2.2 + mv * 1.35);
    const s1 = Math.sin(st.ph), c1 = Math.cos(st.ph), br = Math.sin(st.t * 2.1);
    const W = p.wind, S = p.strike, H = p.hurt, cmb = p.combat ? 1 : 0;
    const crouch = (p.mode === 'pounce' ? W : 0) + cmb * 0.25;
    // pernas: passada de lobo (a coxa vai à frente, o joelho dobra no recuo), quadril baixa em combate
    for (let i = 0; i < 2; i++) {
      const lg = legs[i], ph = i ? s1 : -s1, lift = Math.max(0, i ? c1 : -c1);
      lg.th.rotation.x = -0.55 - crouch * 0.45 + ph * 0.75 * run - (p.mode === 'pounce' ? S * 0.6 : 0);
      lg.kn.rotation.x = 1.25 + crouch * 0.55 + lift * 0.7 * run + (p.mode === 'pounce' ? -S * 0.6 : 0);
      lg.an.rotation.x = -1.0 - crouch * 0.2 - lift * 0.35 * run + (p.mode === 'pounce' ? S * 0.5 : 0);
      lg.paw.rotation.x = 0.3 - ph * 0.3 * run + lift * 0.4 * run;
      lg.th.rotation.z = (i ? 1 : -1) * (0.06 + cmb * 0.08);
    }
    hips.position.y = HIP - crouch * 0.2 + Math.abs(c1) * 0.05 * run - 0.03 * run + (p.mode === 'pounce' ? S * 0.25 : 0);
    hips.rotation.y = s1 * 0.12 * run; hips.rotation.z = c1 * 0.05 * run;
    // tronco: corcunda, mais deitado na corrida, torce nos golpes
    const side = p.mode === 'clawL' ? -1 : 1, claw2 = p.mode === 'clawR' || p.mode === 'clawL';
    spine.rotation.x = 0.62 + 0.25 * sprint + cmb * 0.12 + (p.mode === 'bite' ? 0.28 * W - 0.1 * S : 0) + (p.mode === 'howl' ? -0.55 * W : 0) + (p.mode === 'pounce' ? 0.5 * S + 0.15 * W : 0) + (claw2 ? 0.08 * W + 0.22 * S : 0) - 0.35 * H;
    spine.rotation.y = -hips.rotation.y * 1.4 + (claw2 ? side * (0.45 * W - 0.75 * S) : 0);
    chest.rotation.x = 0.1 + br * 0.02; chest.scale.set(1 + br * 0.015 + (p.mode === 'howl' ? W * 0.05 : 0), 1, 1 + br * 0.02);
    neck.rotation.x = -0.2 - 0.1 * sprint + (p.mode === 'howl' ? -0.6 * W : 0) + (p.mode === 'bite' ? 0.35 * S - 0.15 * W : 0) + 0.25 * H;
    head.rotation.x = -0.42 - (spine.rotation.x - 0.62) * 0.8 + (p.mode === 'howl' ? -0.5 * W : 0) + (p.mode === 'bite' ? 0.2 * S : 0) + Math.sin(st.t * 0.7) * 0.04;
    head.rotation.y = Math.sin(st.t * 0.45) * 0.18 * (1 - run) - spine.rotation.y * 0.5;
    head.position.z = 0.02 + (p.mode === 'bite' ? 0.06 * S : 0);
    jaw.rotation.x = 0.06 + br * 0.03 + cmb * 0.12 + (p.mode === 'bite' ? 0.75 * W * (1 - S) : 0) + (p.mode === 'howl' ? 0.6 * W : 0) + 0.15 * sprint;
    // braços: balançam soltos na corrida; nos golpes um sobe por cima do ombro e rasga em diagonal
    for (let i = 0; i < 2; i++) {
      const a = arms[i], s = i ? 1 : -1, ph = i ? -s1 : s1; const act = claw2 && s === side;
      let rx = -0.55 + ph * 0.6 * run - cmb * 0.35 - 0.2 * sprint, rz = s * (0.12 + cmb * 0.12), ry = 0, ex = -0.45 - cmb * 0.35 - run * 0.3;
      if (act) { rx = L(L(rx, -2.5, W), -0.25, S); rz = L(L(rz, s * 0.65, W), -s * 0.35, S); ry = s * 0.3 * W; ex = L(L(ex, -1.5, W), -0.15, S); }
      else if (claw2) { rx = L(rx, -0.9, Math.max(W, S)); ex = L(ex, -1.0, Math.max(W, S)); }
      if (p.mode === 'howl') { rx = L(rx, 0.35, W); rz = L(rz, s * 0.75, W); ex = L(ex, -0.6, W); }
      if (p.mode === 'pounce') { rx = L(L(rx, 0.4, W), -2.3, S); rz = L(rz, s * 0.3, S); ex = L(L(ex, -0.9, W), -0.3, S); }
      if (p.mode === 'bite') { rx = L(rx, -0.9, W); rz = L(rz, s * 0.5, W); }
      rx += 0.4 * H;
      a.sh.rotation.set(rx, ry, rz); a.el.rotation.x = ex; a.wr.rotation.x = -0.25 - (act ? 0.4 * S : 0);
      const curl = act ? L(0.2, -0.35, W) + S * 0.9 : 0.55 - cmb * 0.35;
      for (let f = 0; f < 4; f++) a.fingers[f].rotation.x = curl;
    }
    // cauda: balança atrás, levanta na corrida e no uivo
    for (let i = 0; i < tail.length; i++) { tail[i].rotation.x = i === 0 ? 1.15 + 0.5 * sprint + (p.mode === 'howl' ? 0.5 * W : 0) : -0.18 + 0.05 * i; tail[i].rotation.z = Math.sin(st.t * 2.4 - i * 0.7) * (0.1 + 0.08 * i) * (1 + run); }
  }
  const tmpV = new THREE.Vector3();
  return {
    root, mats, pose,
    hand(side, out) { return arms[side > 0 ? 1 : 0].tip.getWorldPosition(out); },
    mouth(out) { return nose.getWorldPosition(out).add(tmpV.set(0, -0.04, 0)); },
  };
}

/* =====================================================================================================
   LOBO DE QUATRO PATAS, ESGUIO (25/10/2026)
   O lobo antigo era um tonel com pernas. Lobo de verdade é peito fundo e estreito, barriga recolhida ("cintura de galgo"),
   lombo comprido e reto, pernas compridas e finas com o jarrete alto, pescoço grosso de juba, cabeça baixa e focinho comprido.
   Usado pelos Lobos Espirituais do Uivo da Matilha e pelos lobos e coiotes do mundo.
   ===================================================================================================== */
export interface WolfPose { dt: number; mv: number; wind: number; strike: number; hurt: number; idle?: boolean; alert?: boolean }
export interface Wolf4 { root: THREE.Group; mats: THREE.MeshToonMaterial[]; jaw: THREE.Group; pose(p: WolfPose): void; head: THREE.Group }
export function buildWolf(opt: { fur?: number; belly?: number; eye?: number; mat?: THREE.Material } = {}): Wolf4 {
  const FUR = opt.fur ?? 0x8a847c, BELLY = opt.belly ?? 0xd0c6b4, EYE = opt.eye ?? 0xffd24a;
  const ft = furTex(); const mats: THREE.MeshToonMaterial[] = [];
  const M = (c: number, map = true) => { const m = new THREE.MeshToonMaterial({ color: c, gradientMap: ramp, map: map ? ft : null }); mats.push(m); return m; };
  const O = opt.mat;
  const fur = O ?? M(FUR), furD = O ?? M(new THREE.Color(FUR).multiplyScalar(0.6).getHex()), belly = O ?? M(new THREE.Color(FUR).lerp(new THREE.Color(BELLY), 0.55).getHex()), skin = O ?? M(0x1e1816, false), tooth = O ?? M(0xf2ead8, false), claw = O ?? M(0x2a2420, false);
  const eyeM = new THREE.MeshBasicMaterial({ color: EYE });
  const mesh = (g: THREE.BufferGeometry, m: THREE.Material, sx = 1, sy = 1, sz = 1) => { const o = new THREE.Mesh(g, m); o.scale.set(sx, sy, sz); o.castShadow = !O; return o; };
  const tuft = (len: number, r: number, k: number, m: THREE.Material) => { const g = new THREE.ConeGeometry(r, len, 5, 4); g.translate(0, len / 2, 0); bend(g, k, len); return mesh(g, m, 1, 1, 0.55); };
  const back = (g: THREE.BufferGeometry) => g.rotateX(Math.PI / 2); // -Y → -Z (para trás)
  const fwd = (g: THREE.BufferGeometry) => g.rotateX(-Math.PI / 2); // -Y → +Z (para a frente)

  const root = new THREE.Group();
  const H = 0.74;
  const body = new THREE.Group(); body.position.set(0, H, 0); root.add(body);
  // peito fundo (elipse alta e estreita) que afina na cintura; o quadril sobe de novo um pouco
  body.add(mesh(back(mus(0.62, 0.16, 0.2, 0.1, 0.3, 14)), fur, 0.78, 1.15, 1).translateZ(0.3));
  const keel = mesh(back(mus(0.36, 0.09, 0.12, 0.05, 0.35, 10)), belly, 0.7, 1, 1); keel.position.set(0, -0.11, 0.27); body.add(keel);
  const rump = mesh(back(mus(0.36, 0.1, 0.135, 0.09, 0.5, 12)), fur, 0.9, 1.0, 1); rump.position.set(0, 0.02, -0.2); body.add(rump);
  for (let i = 0; i < 7; i++) { const t = tuft(0.1, 0.04, -0.04, furD); t.position.set(0, 0.17 - i * 0.012, 0.28 - i * 0.09); t.rotation.x = -2.2; body.add(t); }
  // pescoço com juba
  const neck = new THREE.Group(); neck.position.set(0, 0.06, 0.34); body.add(neck);
  neck.add(mesh(fwd(mus(0.3, 0.12, 0.125, 0.085, 0.4, 12)), fur, 0.85, 1.1, 1));
  for (let i = 0; i < 10; i++) { const a = (i / 9 - 0.5) * 2.4; const t = tuft(0.16, 0.05, -0.06, i % 2 ? fur : furD); t.position.set(Math.sin(a) * 0.1, 0.03 + Math.cos(a) * 0.06, 0.08); t.rotation.set(-2.0 + Math.abs(a) * 0.3, 0, -a * 0.8); neck.add(t); }
  const ruff = mesh(fwd(mus(0.2, 0.06, 0.09, 0.04, 0.5, 9)), belly, 0.9, 1, 1); ruff.position.set(0, -0.07, 0.05); neck.add(ruff);
  const head = new THREE.Group(); head.position.set(0, 0.0, 0.28); head.scale.setScalar(1.15); neck.add(head);
  head.add(mesh(new THREE.SphereGeometry(0.095, 14, 10), fur, 0.95, 0.85, 1.05));
  head.add(mesh(new THREE.SphereGeometry(0.07, 10, 8), furD, 1.2, 0.5, 0.8).translateY(0.04).translateZ(0.03));
  const snout = mesh(fwd(mus(0.2, 0.06, 0.05, 0.028, 0.3, 10)), fur, 1, 0.8, 1); snout.position.set(0, -0.02, 0.06); head.add(snout);
  const bridge = mesh(fwd(mus(0.16, 0.035, 0.032, 0.022, 0.5, 8)), furD, 1, 0.6, 1); bridge.position.set(0, 0.015, 0.07); head.add(bridge);
  const nose = mesh(new THREE.SphereGeometry(0.022, 8, 6), skin, 1.2, 0.85, 1); nose.position.set(0, -0.005, 0.265); head.add(nose);
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const tg = new THREE.ConeGeometry(0.006 + (i === 0 ? 0.003 : 0), 0.028 + (i === 0 ? 0.015 : 0), 4); tg.rotateX(Math.PI); const tt = mesh(tg, tooth); tt.position.set(s * 0.027, -0.05, 0.22 - i * 0.04); head.add(tt); }
  const jaw = new THREE.Group(); jaw.position.set(0, -0.05, 0.04); head.add(jaw);
  jaw.add(mesh(fwd(mus(0.18, 0.045, 0.04, 0.022, 0.3, 9)), belly, 1, 0.55, 1));
  for (const s of [-1, 1]) {
    const ear = new THREE.Group(); ear.position.set(s * 0.055, 0.075, -0.02); ear.rotation.set(-0.2, 0, -s * 0.22); head.add(ear);
    const eg = new THREE.ConeGeometry(0.04, 0.12, 6, 3); eg.translate(0, 0.06, 0); bend(eg, -0.02, 0.12); ear.add(mesh(eg, fur, 1, 1, 0.42));
    const ey = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 6), eyeM); ey.scale.set(1.3, 0.75, 0.8); ey.position.set(s * 0.046, 0.025, 0.08); ey.rotation.z = s * 0.3; head.add(ey);
    const ck = tuft(0.09, 0.032, -0.04, fur); ck.position.set(s * 0.075, -0.035, -0.01); ck.rotation.set(-1.7, 0, s * 0.9); head.add(ck);
  }
  // pernas: dianteiras retas e finas; traseiras com coxa forte e jarrete alto
  type L4 = { a: THREE.Group; b: THREE.Group; c: THREE.Group; paw: THREE.Group; front: boolean; side: number };
  const legs: L4[] = [];
  for (const front of [true, false]) for (const s of [-1, 1]) {
    const a = new THREE.Group(); a.position.set(s * (front ? 0.1 : 0.095), front ? -0.04 : 0.0, front ? 0.36 : -0.36); body.add(a);
    let b: THREE.Group, c: THREE.Group, paw: THREE.Group;
    if (front) {
      a.add(mesh(mus(0.3, 0.075, 0.08, 0.045, 0.3), fur, 0.85, 1, 1.15));
      b = new THREE.Group(); b.position.y = -0.3; a.add(b); b.add(mesh(mus(0.28, 0.04, 0.042, 0.03, 0.3), fur, 1, 1, 1.05));
      c = new THREE.Group(); c.position.y = -0.28; b.add(c); c.add(mesh(mus(0.1, 0.03, 0.03, 0.028), furD));
    } else {
      a.add(mesh(mus(0.3, 0.1, 0.11, 0.055, 0.3), fur, 0.85, 1, 1.25));
      b = new THREE.Group(); b.position.y = -0.3; a.add(b); b.add(mesh(mus(0.28, 0.05, 0.05, 0.032, 0.3), fur, 0.9, 1, 1.1));
      c = new THREE.Group(); c.position.y = -0.28; b.add(c); c.add(mesh(mus(0.2, 0.032, 0.032, 0.028), furD));
    }
    paw = new THREE.Group(); paw.position.y = front ? -0.1 : -0.2; c.add(paw);
    paw.add(mesh(new THREE.SphereGeometry(0.045, 9, 6), furD, 0.95, 0.5, 1.4).translateZ(0.03));
    for (let i = 0; i < 4; i++) { const cg = new THREE.ConeGeometry(0.008, 0.04, 4); cg.rotateX(Math.PI / 2); const cc = mesh(cg, claw); cc.position.set((i - 1.5) * 0.02, -0.015, 0.085 - Math.abs(i - 1.5) * 0.01); paw.add(cc); }
    legs.push({ a, b, c, paw, front, side: s });
  }
  const tail: THREE.Group[] = [];
  { let par: THREE.Object3D = body; const R = [[0.045, 0.06, 0.06], [0.06, 0.08, 0.07], [0.07, 0.075, 0.05], [0.05, 0.04, 0.01]];
    for (let i = 0; i < 4; i++) { const g = new THREE.Group(); if (i === 0) g.position.set(0, 0.06, -0.52); else g.position.y = -0.15; g.add(mesh(mus(0.16, R[i][0], R[i][1], R[i][2], 0.5, 9), i === 3 ? belly : fur, 1, 1, 0.9)); par.add(g); par = g; tail.push(g); } }

  const st = { ph: 0, t: 0, mv: 0 };
  function pose(p: WolfPose) {
    const dt = Math.min(0.05, p.dt); st.t += dt; st.mv += (p.mv - st.mv) * Math.min(1, dt * 8); const mv = st.mv;
    const spd = Math.min(1, mv / 2.6), gal = Math.max(0, Math.min(1, (mv - 3) / 2.5)); st.ph += dt * (3 + mv * 2.1);
    const ph = st.ph, W = p.wind, S = p.strike, Hh = p.hurt, crouch = W * W;
    // trote (diagonais) → galope (pares)
    const off = [[0, Math.PI, Math.PI, 0], [0, 0.45, Math.PI + 0.35, Math.PI + 0.8]];
    for (let i = 0; i < 4; i++) { const L = legs[i], k = i === 0 ? 0 : i === 1 ? 1 : i === 2 ? 2 : 3, sw = Math.sin(ph + off[0][k] * (1 - gal) + off[1][k] * gal) * spd, lift = Math.max(0, Math.cos(ph + off[0][k] * (1 - gal) + off[1][k] * gal)) * spd;
      const A = 0.5 + 0.35 * gal;
      if (L.front) { L.a.rotation.x = -sw * A + 0.05 - crouch * 0.35 + (S > 0 ? -0.9 * Math.sin(Math.min(1, S) * Math.PI) : 0); L.b.rotation.x = lift * 0.9 + crouch * 0.8; L.c.rotation.x = -lift * 0.6 - 0.1 - crouch * 0.3; L.paw.rotation.x = 0.1 + lift * 0.6; }
      else { L.a.rotation.x = -sw * A * 0.9 - 0.45 - crouch * 0.5 + (S > 0 ? 0.6 * Math.sin(Math.min(1, S) * Math.PI) : 0); L.b.rotation.x = 1.0 + lift * 0.5 + crouch * 0.7; L.c.rotation.x = -0.75 - lift * 0.4 - crouch * 0.3; L.paw.rotation.x = 0.2 + lift * 0.4; }
      L.a.rotation.z = L.side * 0.03; }
    body.position.y = H + Math.abs(Math.sin(ph)) * 0.03 * spd * (1 + gal) - crouch * 0.16 + S * 0.25 * Math.sin(Math.min(1, S) * Math.PI) - Hh * 0.05;
    body.rotation.x = Math.sin(ph * 2) * 0.03 * gal + crouch * 0.12 - 0.22 * S + 0.1 * Hh; body.position.z = S * 0.3 - crouch * 0.12;
    const look = p.alert ? 0.25 : 0;
    neck.rotation.x = -0.55 + 0.2 * spd + 0.15 * gal + 0.35 * crouch - 0.2 * S - look * 0.4 + (p.idle ? Math.sin(st.t * 1.1) * 0.12 + 0.1 : 0) - 0.4 * Hh;
    head.rotation.x = 0.5 - 0.15 * spd - 0.2 * crouch + 0.25 * S + (p.idle ? Math.sin(st.t * 2.3) * 0.05 : 0) + 0.3 * Hh;
    head.rotation.z = p.idle ? Math.sin(st.t * 0.7) * 0.1 : 0;
    jaw.rotation.x = 0.04 + 0.85 * Math.max(S > 0 ? Math.sin(Math.min(1, S) * Math.PI) : 0, W * 0.35) + (p.alert ? 0.12 + 0.08 * Math.sin(st.t * 8) : 0) + 0.12 * gal;
    for (let i = 0; i < tail.length; i++) { tail[i].rotation.x = i === 0 ? 0.7 + 0.65 * spd - crouch * 0.3 + 0.4 * S + (p.alert ? 0.35 : 0) : -0.1 + 0.05 * i; tail[i].rotation.z = Math.sin(st.t * (p.alert ? 6 : 2.4) - i * 0.7) * (0.12 + i * 0.08); }
  }
  return { root, mats, jaw, head, pose };
}
