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

/* =====================================================================================================
   CAVALO E JAVALI (25/10/2026) — Erling: "precisa deixar o cavalo mais decente também, e lobos, coiotes e javalis".
   Cavalo: pernas compridas e finas (canela fina, jarrete alto, casco), peito fundo, barriga que sobe para o flanco,
   garupa redonda e forte, pescoço comprido arqueado, cabeça longa que afina no focinho, crina e cauda de crina solta.
   Javali: o peso todo na frente (ombro alto e cerdoso), traseiro que afina, pernas curtas e secas, cabeça em cunha
   com o disco do focinho e as presas curvas para cima.
   ===================================================================================================== */
type Leg3 = { a: THREE.Group; b: THREE.Group; c: THREE.Group; d: THREE.Group; front: boolean; side: number };
const fwdG = (g: THREE.BufferGeometry) => g.rotateX(-Math.PI / 2), backG = (g: THREE.BufferGeometry) => g.rotateX(Math.PI / 2);
function makeKit(mats: THREE.MeshToonMaterial[], shadow = true) {
  const ft = furTex();
  const M = (c: number, map = true) => { const m = new THREE.MeshToonMaterial({ color: c, gradientMap: ramp, map: map ? ft : null }); mats.push(m); return m; };
  const mesh = (g: THREE.BufferGeometry, m: THREE.Material, sx = 1, sy = 1, sz = 1) => { const o = new THREE.Mesh(g, m); o.scale.set(sx, sy, sz); o.castShadow = shadow; return o; };
  const tuft = (len: number, r: number, k: number, m: THREE.Material) => { const g = new THREE.ConeGeometry(r, len, 5, 4); g.translate(0, len / 2, 0); bend(g, k, len); return mesh(g, m, 1, 1, 0.55); };
  return { M, mesh, tuft };
}

export interface Horse4 { root: THREE.Group; body: THREE.Group; neck: THREE.Group; mats: THREE.MeshToonMaterial[]; seat: number; pose(p: { dt: number; mv: number; idle?: boolean }): void }
export function buildHorse(opt: { coat?: number; mane?: number; socks?: boolean } = {}): Horse4 {
  const mats: THREE.MeshToonMaterial[] = []; const { M, mesh, tuft } = makeKit(mats);
  const COAT = opt.coat ?? 0x6a4630, MANE = opt.mane ?? 0x241812;
  const coat = M(COAT, false), coatD = M(new THREE.Color(COAT).multiplyScalar(0.72).getHex(), false), mane = M(MANE), hoof = M(0x2a2420, false), muzzle = M(new THREE.Color(COAT).multiplyScalar(0.45).getHex()), sock = M(opt.socks ? 0xe8e0d0 : new THREE.Color(COAT).multiplyScalar(0.55).getHex());
  const root = new THREE.Group(); const H = 1.22;
  const body = new THREE.Group(); body.position.y = H; root.add(body);
  body.add(mesh(backG(mus(1.2, 0.27, 0.32, 0.25, 0.32, 16)), coat, 0.74, 1.02, 1).translateZ(0.6));
  body.add(mesh(backG(mus(0.55, 0.15, 0.2, 0.08, 0.4, 12)), coatD, 0.78, 1, 1).translateY(-0.17).translateZ(0.52)); // peito fundo
  const rump = mesh(backG(mus(0.55, 0.24, 0.3, 0.2, 0.5, 14)), coat, 0.95, 0.95, 1); rump.position.set(0, 0.04, -0.3); body.add(rump);
  const withers = mesh(new THREE.SphereGeometry(0.16, 12, 8), coat, 0.7, 0.7, 1.5); withers.position.set(0, 0.22, 0.38); body.add(withers);
  const neck = new THREE.Group(); neck.position.set(0, 0.12, 0.6); neck.rotation.x = -0.78; body.add(neck);
  neck.add(mesh(fwdG(mus(0.78, 0.21, 0.19, 0.12, 0.3, 14)), coat, 0.58, 1.3, 1));
  for (let i = 0; i < 16; i++) { const t = tuft(0.22 + (i % 3) * 0.04, 0.06, -0.1, mane); t.position.set((i % 2 ? 0.035 : -0.035), 0.21 - i * 0.003, 0.03 + i * 0.045); t.rotation.set(-2.3, 0, (i % 2 ? 1 : -1) * 0.9); neck.add(t); }
  const head = new THREE.Group(); head.position.set(0, 0.04, 0.72); head.rotation.x = 1.45; neck.add(head);
  head.add(mesh(fwdG(mus(0.6, 0.13, 0.12, 0.075, 0.25, 12)), coat, 0.72, 1.15, 1));
  const nose = mesh(new THREE.SphereGeometry(0.085, 12, 9), muzzle, 0.85, 0.95, 1); nose.position.set(0, -0.02, 0.6); head.add(nose);
  const jaw = mesh(fwdG(mus(0.32, 0.1, 0.09, 0.06, 0.4, 10)), coatD, 0.75, 0.8, 1); jaw.position.set(0, -0.08, 0.06); head.add(jaw);
  for (const s of [-1, 1]) {
    const ear = new THREE.Group(); ear.position.set(s * 0.055, 0.12, 0.0); ear.rotation.set(-0.2, 0, -s * 0.15); head.add(ear); const eg = new THREE.ConeGeometry(0.035, 0.14, 6, 3); eg.translate(0, 0.07, 0); bend(eg, 0.02, 0.14); ear.add(mesh(eg, coat, 1, 1, 0.5));
    const ey = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), new THREE.MeshBasicMaterial({ color: 0x0e0a08 })); ey.position.set(s * 0.085, 0.05, 0.12); head.add(ey);
    const nos = new THREE.Mesh(new THREE.SphereGeometry(0.016, 6, 5), new THREE.MeshBasicMaterial({ color: 0x0a0806 })); nos.position.set(s * 0.04, 0.0, 0.67); head.add(nos);
  }
  const fore = tuft(0.18, 0.06, 0.06, mane); fore.position.set(0, 0.14, 0.06); fore.rotation.x = 1.2; head.add(fore);
  const legs: Leg3[] = [];
  for (const front of [true, false]) for (const s of [-1, 1]) {
    const a = new THREE.Group(); a.position.set(s * 0.17, front ? -0.12 : -0.05, front ? 0.48 : -0.5); body.add(a);
    if (front) a.add(mesh(mus(0.46, 0.1, 0.105, 0.055, 0.25), coat, 0.85, 1, 1.2)); else a.add(mesh(mus(0.46, 0.16, 0.17, 0.065, 0.25), coat, 0.8, 1, 1.35));
    const b = new THREE.Group(); b.position.y = -0.46; a.add(b); b.add(mesh(mus(0.34, 0.045, 0.042, 0.04, 0.5), coatD, 1, 1, 1.15));
    const c = new THREE.Group(); c.position.y = -0.34; b.add(c); c.add(mesh(mus(0.12, 0.042, 0.045, 0.045, 0.5), sock));
    const d = new THREE.Group(); d.position.y = -0.12; c.add(d); const hv = new THREE.CylinderGeometry(0.052, 0.064, 0.08, 12); hv.translate(0, -0.04, 0.01); d.add(mesh(hv, hoof));
    if (!front) { const hk = mesh(new THREE.SphereGeometry(0.05, 8, 6), coatD, 0.8, 1, 1.1); b.add(hk); }
    for (let i = 0; i < 3; i++) { const f = tuft(0.07, 0.035, 0.0, mane); f.position.set(0, -0.06, -0.03); f.rotation.x = 2.6 + i * 0.15; f.rotation.z = (i - 1) * 0.5; c.add(f); }
    legs.push({ a, b, c, d, front, side: s });
  }
  const tail: THREE.Group[] = []; { let par: THREE.Object3D = body; for (let i = 0; i < 4; i++) { const g = new THREE.Group(); if (i === 0) g.position.set(0, 0.2, -0.82); else g.position.y = -0.22; g.add(mesh(mus(0.24, 0.035 + i * 0.008, 0.045 + i * 0.01, 0.035 + i * 0.012, 0.5, 9), mane, 0.7, 1, 1)); for (let k = 0; k < 3; k++) { const t = tuft(0.22 + i * 0.03, 0.025, 0.02, mane); t.position.set((k - 1) * 0.025, -0.12, 0); t.rotation.set(Math.PI + (k - 1) * 0.12, 0, (k - 1) * 0.1); g.add(t); } par.add(g); par = g; tail.push(g); } }
  const st = { ph: 0, t: 0, mv: 0 };
  function pose(p: { dt: number; mv: number; idle?: boolean }) {
    const dt = Math.min(0.05, p.dt); st.t += dt; st.mv += (p.mv - st.mv) * Math.min(1, dt * 6); const mv = st.mv;
    const spd = Math.min(1, mv / 2.4), gal = Math.max(0, Math.min(1, (mv - 4) / 3)); st.ph += dt * (2.4 + mv * 1.25);
    const off = [[0, Math.PI, Math.PI, 0], [0, 0.4, Math.PI + 0.3, Math.PI + 0.7]];
    for (let i = 0; i < 4; i++) { const L = legs[i], k = i, o = off[0][k] * (1 - gal) + off[1][k] * gal, sw = Math.sin(st.ph + o) * spd, lift = Math.max(0, Math.cos(st.ph + o)) * spd, A = 0.42 + 0.3 * gal;
      if (L.front) { L.a.rotation.x = -sw * A + 0.02; L.b.rotation.x = lift * 1.3; L.c.rotation.x = -0.2 - lift * 0.5; L.d.rotation.x = 0.2 + lift * 0.7; }
      else { L.a.rotation.x = -sw * A * 0.85 + 0.22; L.b.rotation.x = -0.32 - lift * 0.55; L.c.rotation.x = 0.1 + lift * 0.4; L.d.rotation.x = 0.0 + lift * 0.5; } }
    body.position.y = H + Math.abs(Math.sin(st.ph)) * 0.04 * spd * (1 + gal * 1.5); body.rotation.x = Math.sin(st.ph * 2) * 0.03 * gal;
    neck.rotation.x = -0.78 + 0.12 * gal + Math.sin(st.ph * 2) * 0.05 * spd + (p.idle ? Math.sin(st.t * 0.4) * 0.12 + 0.05 : 0);
    head.rotation.x = 1.45 - 0.15 * gal + (p.idle ? Math.sin(st.t * 0.9) * 0.05 : 0); head.rotation.y = p.idle ? Math.sin(st.t * 0.3) * 0.2 : 0;
    for (let i = 0; i < tail.length; i++) { tail[i].rotation.x = i === 0 ? 0.5 + 0.5 * gal + 0.2 * spd : 0.1 - 0.05 * gal; tail[i].rotation.z = Math.sin(st.t * 1.6 - i * 0.6) * (0.06 + i * 0.05); }
  }
  return { root, body, neck, mats, seat: H + 0.33, pose };
}

export interface Boar4 { root: THREE.Group; mats: THREE.MeshToonMaterial[]; pose(p: WolfPose): void }
export function buildBoar(opt: { fur?: number } = {}): Boar4 {
  const mats: THREE.MeshToonMaterial[] = []; const { M, mesh, tuft } = makeKit(mats);
  const FUR = opt.fur ?? 0x5a4636; const fur = M(FUR), furD = M(new THREE.Color(FUR).multiplyScalar(0.55).getHex()), snoutM = M(0x8a6a5a, false), tusk = M(0xf0e6cc, false), hoof = M(0x241c16, false);
  const root = new THREE.Group(); const H = 0.5;
  const body = new THREE.Group(); body.position.y = H; root.add(body);
  body.add(mesh(backG(mus(0.85, 0.23, 0.26, 0.1, 0.18, 14)), fur, 0.7, 1.12, 1).translateZ(0.4).translateY(0.03)); // peso na frente, traseiro fino
  const hump = mesh(new THREE.SphereGeometry(0.2, 12, 9), furD, 0.75, 0.8, 1.4); hump.position.set(0, 0.17, 0.26); body.add(hump);
  for (let i = 0; i < 14; i++) { const t = tuft(0.12 - Math.abs(i - 3) * 0.006, 0.035, -0.04, furD); t.position.set(0, 0.26 - i * 0.012 - Math.max(0, i - 4) * 0.01, 0.42 - i * 0.06); t.rotation.x = -1.95; body.add(t); }
  const head = new THREE.Group(); head.position.set(0, 0.0, 0.42); head.rotation.x = 0.35; body.add(head);
  head.add(mesh(fwdG(mus(0.42, 0.17, 0.14, 0.07, 0.25, 12)), fur, 0.85, 1.05, 1));
  const disc = mesh(new THREE.CylinderGeometry(0.06, 0.065, 0.05, 14), snoutM); disc.rotation.x = Math.PI / 2; disc.position.set(0, -0.02, 0.45); head.add(disc);
  for (const s of [-1, 1]) {
    const nos = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 4), new THREE.MeshBasicMaterial({ color: 0x1a0e0a })); nos.position.set(s * 0.022, -0.02, 0.476); head.add(nos);
    const tg = new THREE.ConeGeometry(0.018, 0.13, 6, 3); tg.translate(0, 0.065, 0); bend(tg, -0.04, 0.13); const tk = mesh(tg, tusk); tk.position.set(s * 0.07, -0.07, 0.34); tk.rotation.set(-0.4, 0, -s * 0.35); head.add(tk);
    const ey = new THREE.Mesh(new THREE.SphereGeometry(0.016, 6, 5), new THREE.MeshBasicMaterial({ color: 0x1a0a06 })); ey.position.set(s * 0.1, 0.07, 0.16); head.add(ey);
    const ear = new THREE.Group(); ear.position.set(s * 0.09, 0.12, 0.02); ear.rotation.set(-0.6, 0, -s * 0.7); head.add(ear); const eg = new THREE.ConeGeometry(0.045, 0.11, 6, 3); eg.translate(0, 0.055, 0); bend(eg, 0.03, 0.11); ear.add(mesh(eg, furD, 1, 1, 0.45));
    const ck = tuft(0.1, 0.045, -0.04, furD); ck.position.set(s * 0.12, -0.05, 0.05); ck.rotation.set(-1.8, 0, s * 0.8); head.add(ck);
  }
  const legs: Leg3[] = [];
  for (const front of [true, false]) for (const s of [-1, 1]) {
    const a = new THREE.Group(); a.position.set(s * (front ? 0.12 : 0.085), front ? -0.1 : -0.05, front ? 0.3 : -0.3); body.add(a);
    a.add(mesh(mus(0.2, front ? 0.075 : 0.07, front ? 0.075 : 0.075, 0.035, 0.3), fur, 0.8, 1, 1.15));
    const b = new THREE.Group(); b.position.y = -0.2; a.add(b); b.add(mesh(mus(0.15, 0.035, 0.033, 0.03, 0.5), furD));
    const c = new THREE.Group(); c.position.y = -0.15; b.add(c); const hv = new THREE.CylinderGeometry(0.03, 0.04, 0.05, 8); hv.translate(0, -0.025, 0.01); c.add(mesh(hv, hoof));
    const d = new THREE.Group(); c.add(d); legs.push({ a, b, c, d, front, side: s });
  }
  const tail = new THREE.Group(); tail.position.set(0, 0.08, -0.5); body.add(tail); tail.add(mesh(mus(0.16, 0.018, 0.016, 0.01, 0.5, 6), fur)); const tt = tuft(0.06, 0.025, 0, furD); tt.position.y = -0.17; tt.rotation.x = Math.PI; tail.add(tt);
  const st = { ph: 0, t: 0, mv: 0 };
  function pose(p: WolfPose) {
    const dt = Math.min(0.05, p.dt); st.t += dt; st.mv += (p.mv - st.mv) * Math.min(1, dt * 8); const mv = st.mv, spd = Math.min(1, mv / 2.2); st.ph += dt * (4 + mv * 3.2);
    const W = p.wind, S = p.strike, crouch = W * W;
    for (let i = 0; i < 4; i++) { const L = legs[i], o = [0, Math.PI, Math.PI, 0][i], sw = Math.sin(st.ph + o) * spd, lift = Math.max(0, Math.cos(st.ph + o)) * spd;
      L.a.rotation.x = -sw * 0.6 + (L.front ? -0.4 * crouch : 0.3 * crouch); L.b.rotation.x = (L.front ? 1 : -1) * lift * 0.8 + (L.front ? 0.6 : -0.4) * crouch; L.c.rotation.x = lift * 0.4; }
    body.position.y = H + Math.abs(Math.sin(st.ph)) * 0.025 * spd - crouch * 0.08 - p.hurt * 0.04; body.rotation.x = crouch * 0.18 - (S > 0 ? 0.15 * Math.sin(Math.min(1, S) * Math.PI) : 0); body.position.z = S * 0.25 - crouch * 0.08;
    head.rotation.x = 0.35 + 0.25 * crouch - (S > 0 ? 0.6 * Math.sin(Math.min(1, S) * Math.PI) : 0) + (p.idle ? Math.sin(st.t * 1.7) * 0.15 + 0.15 : 0) + 0.3 * p.hurt; head.rotation.y = p.idle ? Math.sin(st.t * 0.8) * 0.2 : 0;
    tail.rotation.x = 0.3 + Math.sin(st.t * 9) * 0.15 * (p.alert ? 1 : 0.4); tail.rotation.z = Math.sin(st.t * 7) * 0.4;
  }
  return { root, mats, pose };
}

export interface Deer4 { root: THREE.Group; mats: THREE.MeshToonMaterial[]; pose(p: { dt: number; mv: number; idle?: boolean; alert?: boolean; hurt?: number }): void }
/** cervo (Erling, 25/10: "mude o cervo"): esguio, pernas finas e longas, peito estreito, pescoço erguido, galhada ramificada e o rabo branco que levanta quando foge */
export function buildDeer(opt: { coat?: number; stag?: boolean } = {}): Deer4 {
  const mats: THREE.MeshToonMaterial[] = []; const { M, mesh, tuft } = makeKit(mats);
  const COAT = opt.coat ?? 0x9a6a3e, stag = opt.stag ?? true;
  const coat = M(COAT), coatD = M(new THREE.Color(COAT).multiplyScalar(0.7).getHex()), belly = M(0xe8dcc4), muzzle = M(0x2a2018, false), hoof = M(0x231a14, false), antler = M(0xd8c8a4, false);
  const root = new THREE.Group(); const H = 0.92;
  const body = new THREE.Group(); body.position.y = H; root.add(body);
  body.add(mesh(backG(mus(0.95, 0.17, 0.2, 0.15, 0.35, 14)), coat, 0.68, 1.05, 1).translateZ(0.46)); // tronco fino
  body.add(mesh(backG(mus(0.6, 0.08, 0.12, 0.06, 0.5, 12)), belly, 0.7, 0.7, 1).translateY(-0.12).translateZ(0.34)); // barriga clara
  const rump = mesh(backG(mus(0.42, 0.15, 0.19, 0.13, 0.5, 12)), coat, 0.9, 0.95, 1); rump.position.set(0, 0.03, -0.25); body.add(rump);
  const patch = mesh(new THREE.SphereGeometry(0.12, 10, 8), belly, 0.95, 0.85, 0.35); patch.position.set(0, 0.04, -0.5); body.add(patch); // espelho branco do traseiro
  const neck = new THREE.Group(); neck.position.set(0, 0.08, 0.44); neck.rotation.x = -1.05; body.add(neck);
  neck.add(mesh(fwdG(mus(0.55, 0.12, 0.1, 0.075, 0.3, 12)), coat, 0.7, 1.25, 1));
  const throat = mesh(fwdG(mus(0.3, 0.06, 0.06, 0.04, 0.5, 8)), belly, 0.7, 0.8, 1); throat.position.set(0, -0.05, 0.2); neck.add(throat);
  const head = new THREE.Group(); head.position.set(0, 0.02, 0.52); head.rotation.x = 1.55; neck.add(head);
  head.add(mesh(fwdG(mus(0.34, 0.085, 0.075, 0.04, 0.3, 12)), coat, 0.8, 1.05, 1));
  const nose = mesh(new THREE.SphereGeometry(0.04, 10, 8), muzzle, 0.9, 0.8, 1); nose.position.set(0, -0.005, 0.34); head.add(nose);
  const chin = mesh(new THREE.SphereGeometry(0.035, 8, 6), belly, 1, 0.6, 1.4); chin.position.set(0, -0.04, 0.24); head.add(chin);
  for (const s of [-1, 1]) {
    const ear = new THREE.Group(); ear.position.set(s * 0.06, 0.07, 0.02); ear.rotation.set(-0.3, 0, -s * 1.05); head.add(ear);
    const eg = new THREE.SphereGeometry(0.06, 8, 6); eg.scale(0.5, 1.15, 0.18); eg.translate(0, 0.06, 0); ear.add(mesh(eg, coat)); const ei = new THREE.SphereGeometry(0.045, 8, 6); ei.scale(0.35, 0.8, 0.1); ei.translate(0, 0.055, 0.01); ear.add(mesh(ei, belly));
    const ey = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 6), new THREE.MeshBasicMaterial({ color: 0x0c0806 })); ey.position.set(s * 0.06, 0.035, 0.1); head.add(ey);
    if (stag) { // galhada: haste curva com 3 pontas
      const an = new THREE.Group(); an.position.set(s * 0.04, 0.08, 0.06); an.rotation.set(-0.35, 0, -s * 0.45); head.add(an);
      const beam = new THREE.CylinderGeometry(0.008, 0.016, 0.34, 6, 6); beam.translate(0, 0.17, 0); bend(beam, 0.08, 0.34); an.add(mesh(beam, antler));
      for (const [y, rz, rx, l] of [[0.08, -0.2, 0.9, 0.1], [0.17, 0.1, 0.8, 0.13], [0.26, -0.1, 0.7, 0.11]] as const) { const tg = new THREE.ConeGeometry(0.008, l, 5, 2); tg.translate(0, l / 2, 0); const t = mesh(tg, antler); t.position.set(0, y, 0.02 + y * 0.18); t.rotation.set(rx, 0, rz * s); an.add(t); }
    }
  }
  const legs: Leg3[] = [];
  for (const front of [true, false]) for (const s of [-1, 1]) {
    const a = new THREE.Group(); a.position.set(s * 0.1, front ? -0.08 : -0.02, front ? 0.36 : -0.36); body.add(a);
    if (front) a.add(mesh(mus(0.34, 0.06, 0.06, 0.03, 0.25), coat, 0.85, 1, 1.15)); else a.add(mesh(mus(0.36, 0.1, 0.11, 0.035, 0.25), coat, 0.75, 1, 1.4));
    const b = new THREE.Group(); b.position.y = -0.34; a.add(b); b.add(mesh(mus(0.3, 0.024, 0.022, 0.02, 0.5), coatD, 1, 1, 1.1));
    const c = new THREE.Group(); c.position.y = -0.3; b.add(c); c.add(mesh(mus(0.12, 0.02, 0.021, 0.022, 0.5), coatD));
    const d = new THREE.Group(); d.position.y = -0.12; c.add(d); const hv = new THREE.ConeGeometry(0.03, 0.06, 8); hv.rotateX(Math.PI); hv.translate(0, -0.02, 0.01); d.add(mesh(hv, hoof));
    legs.push({ a, b, c, d, front, side: s });
  }
  const tail = new THREE.Group(); tail.position.set(0, 0.12, -0.56); body.add(tail); { const t = tuft(0.14, 0.04, 0.02, coat); t.rotation.x = Math.PI * 0.85; tail.add(t); const w = tuft(0.12, 0.035, 0.02, belly); w.position.z = -0.012; w.rotation.x = Math.PI * 0.85; tail.add(w); }
  const st = { ph: 0, t: 0, mv: 0, seed: Math.random() * 6.28 };
  function pose(p: { dt: number; mv: number; idle?: boolean; alert?: boolean; hurt?: number }) {
    const dt = Math.min(0.05, p.dt); st.t += dt; st.mv += (p.mv - st.mv) * Math.min(1, dt * 7); const mv = st.mv, spd = Math.min(1, mv / 2), bound = Math.max(0, Math.min(1, (mv - 3) / 2.5)); st.ph += dt * (3 + mv * 1.6);
    for (let i = 0; i < 4; i++) { const L = legs[i], walkO = [0, Math.PI, Math.PI, 0][i], boundO = L.front ? 0 : Math.PI * 0.85, o = walkO * (1 - bound) + boundO * bound, sw = Math.sin(st.ph + o) * spd, lift = Math.max(0, Math.cos(st.ph + o)) * spd, A = 0.4 + 0.45 * bound;
      if (L.front) { L.a.rotation.x = -sw * A; L.b.rotation.x = lift * 1.4; L.c.rotation.x = -0.15 - lift * 0.4; L.d.rotation.x = 0.15 + lift * 0.5; }
      else { L.a.rotation.x = -sw * A * 0.9 + 0.25; L.b.rotation.x = -0.38 - lift * 0.6; L.c.rotation.x = 0.12 + lift * 0.4; L.d.rotation.x = lift * 0.4; } }
    body.position.y = H + Math.max(0, Math.sin(st.ph)) * (0.03 + 0.22 * bound) * spd; body.rotation.x = Math.sin(st.ph) * 0.12 * bound;
    const gz = Math.sin(st.t * 0.3 + st.seed), graze = p.idle ? Math.max(0, Math.min(1, (gz - 0.45) / 0.3)) : 0; // pasta de vez em quando, a cabeça vai ao chão
    neck.rotation.x = -1.05 + graze * 1.9 + (p.alert ? -0.15 : 0) + 0.25 * bound;
    head.rotation.x = 1.55 - graze * 0.5 + (p.hurt ?? 0) * 0.3; head.rotation.y = p.idle && graze < 0.2 ? Math.sin(st.t * 0.7) * 0.35 : 0;
    tail.rotation.x = (p.alert || bound > 0.2 ? -1.2 : 0) + Math.sin(st.t * 6) * 0.1; // a bandeira branca sobe quando foge
  }
  return { root, mats, pose };
}

export { mus, musUp, bend, furTex, ramp as beastRamp };

export interface Cat4 { root: THREE.Group; mats: THREE.MeshToonMaterial[]; pose(p: { dt: number; mv: number; idle?: boolean }): void }
/** gatinho (Erling, 25/10: "gatinho né, de pet, poxa"): corpo comprido e macio, cabeça redonda, focinho curto, orelhas em pé,
 *  bigodes, rabo longo que sobe em ponto de interrogação; anda macio, senta e lambe a pata quando você para */
export function buildCat(opt: { coat?: number; belly?: number; eye?: number; stripes?: boolean } = {}): Cat4 {
  const mats: THREE.MeshToonMaterial[] = []; const { M, mesh, tuft } = makeKit(mats);
  const COAT = opt.coat ?? 0xd8883a, coat = M(COAT), coatD = M(new THREE.Color(COAT).multiplyScalar(0.62).getHex()), belly = M(opt.belly ?? 0xf6efe4), nose = M(0xe87a8a, false), pad = M(0x3a2a2a, false);
  const eyeM = new THREE.MeshBasicMaterial({ color: opt.eye ?? 0x9ad84a }), pupil = new THREE.MeshBasicMaterial({ color: 0x0a0806 });
  const root = new THREE.Group(); const H = 0.25; const body = new THREE.Group(); body.position.y = H; root.add(body);
  body.add(mesh(backG(mus(0.36, 0.085, 0.1, 0.09, 0.5, 14)), coat, 0.9, 1.0, 1).translateZ(0.17)); // tronco comprido
  body.add(mesh(backG(mus(0.26, 0.05, 0.07, 0.05, 0.5, 12)), belly, 0.8, 0.7, 1).translateY(-0.04).translateZ(0.13));
  if (opt.stripes ?? true) for (let i = 0; i < 4; i++) { const st = mesh(new THREE.TorusGeometry(0.092, 0.012, 4, 14, Math.PI), coatD); st.rotation.set(0, Math.PI / 2, 0); st.position.set(0, 0.005, 0.1 - i * 0.075); st.scale.set(1, 1.05, 0.95); body.add(st); }
  const neck = new THREE.Group(); neck.position.set(0, 0.05, 0.18); neck.rotation.x = -0.5; body.add(neck);
  neck.add(mesh(fwdG(mus(0.08, 0.06, 0.06, 0.055, 0.5, 10)), coat));
  const head = new THREE.Group(); head.position.set(0, 0.03, 0.1); head.rotation.x = 0.5; neck.add(head);
  head.add(mesh(new THREE.SphereGeometry(0.075, 14, 12), coat, 1.05, 0.9, 0.95)); // cabeça redonda
  const snout = mesh(new THREE.SphereGeometry(0.035, 10, 8), belly, 1.25, 0.8, 0.9); snout.position.set(0, -0.022, 0.06); head.add(snout);
  const nz = mesh(new THREE.SphereGeometry(0.011, 6, 5), nose); nz.position.set(0, -0.008, 0.088); head.add(nz);
  for (const s of [-1, 1]) {
    const ear = new THREE.ConeGeometry(0.03, 0.06, 4); ear.translate(0, 0.03, 0); const e = mesh(ear, coat, 1, 1, 0.5); e.position.set(s * 0.042, 0.055, -0.005); e.rotation.set(-0.15, s * 0.3, -s * 0.28); head.add(e);
    const ei = new THREE.ConeGeometry(0.018, 0.04, 4); ei.translate(0, 0.02, 0); const e2 = mesh(ei, nose, 1, 1, 0.3); e2.position.set(s * 0.042, 0.058, 0.002); e2.rotation.copy(e.rotation); head.add(e2);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 6), eyeM); eye.scale.set(1, 0.85, 0.6); eye.position.set(s * 0.032, 0.008, 0.062); head.add(eye);
    const pu = new THREE.Mesh(new THREE.SphereGeometry(0.006, 6, 4), pupil); pu.scale.set(0.45, 1.3, 0.5); pu.position.set(s * 0.033, 0.008, 0.071); head.add(pu);
    for (let k = 0; k < 3; k++) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.0012, 0.0012, 0.09, 3), new THREE.MeshBasicMaterial({ color: 0xf8f4ec })); w.rotation.set(0, 0, Math.PI / 2 + s * (k - 1) * 0.18); w.position.set(s * 0.065, -0.02 + (k - 1) * 0.006, 0.07); head.add(w); }
  }
  const legs: Leg3[] = [];
  for (const front of [true, false]) for (const s of [-1, 1]) {
    const a = new THREE.Group(); a.position.set(s * 0.05, -0.03, front ? 0.14 : -0.14); body.add(a);
    a.add(mesh(mus(0.11, front ? 0.03 : 0.045, front ? 0.032 : 0.05, 0.022, 0.4), coat, 0.85, 1, 1.1));
    const b2 = new THREE.Group(); b2.position.y = -0.11; a.add(b2); b2.add(mesh(mus(0.09, 0.02, 0.019, 0.016, 0.5), front ? coat : coatD));
    const c = new THREE.Group(); c.position.y = -0.09; b2.add(c); c.add(mesh(mus(0.03, 0.016, 0.016, 0.015, 0.5), belly));
    const d = new THREE.Group(); d.position.y = -0.03; c.add(d); const pw = mesh(new THREE.SphereGeometry(0.02, 8, 6), belly, 1, 0.6, 1.3); pw.position.set(0, -0.004, 0.008); d.add(pw); const pd = mesh(new THREE.SphereGeometry(0.01, 6, 4), pad, 1.4, 0.4, 1); pd.position.set(0, -0.014, 0.01); d.add(pd);
    legs.push({ a, b: b2, c, d, front, side: s });
  }
  const tail: THREE.Group[] = []; { let par: THREE.Object3D = body; for (let i = 0; i < 6; i++) { const g = new THREE.Group(); if (i === 0) g.position.set(0, 0.04, -0.2); else g.position.y = -0.06; g.add(mesh(mus(0.065, 0.022 - i * 0.002, 0.021 - i * 0.002, 0.019 - i * 0.002, 0.5, 8), i === 5 ? coatD : coat)); par.add(g); par = g; tail.push(g); } }
  void tuft;
  const st = { ph: 0, t: 0, mv: 0, sit: 0 };
  function pose(p: { dt: number; mv: number; idle?: boolean }) {
    const dt = Math.min(0.05, p.dt); st.t += dt; st.mv += (p.mv - st.mv) * Math.min(1, dt * 8); const mv = st.mv, spd = Math.min(1, mv / 1.8), run = Math.max(0, Math.min(1, (mv - 2.5) / 2));
    st.sit += ((p.idle && mv < 0.1 ? 1 : 0) - st.sit) * Math.min(1, dt * (p.idle ? 1.2 : 6)); const S = st.sit; st.ph += dt * (4 + mv * 2.4);
    for (let i = 0; i < 4; i++) { const L = legs[i], o = [0, Math.PI, Math.PI * 0.5, Math.PI * 1.5][i] * (1 - run) + (L.front ? 0 : Math.PI * 0.8) * run, sw = Math.sin(st.ph + o) * spd, lift = Math.max(0, Math.cos(st.ph + o)) * spd, A = 0.45 + 0.4 * run;
      if (L.front) { L.a.rotation.x = -sw * A + S * 0.05; L.b.rotation.x = lift * 1.2; L.c.rotation.x = -0.1 - lift * 0.5; L.d.rotation.x = 0.1 + lift * 0.4; }
      else { L.a.rotation.x = -sw * A * 0.9 + 0.3 - S * 1.25; L.b.rotation.x = -0.55 - lift * 0.5 + S * 1.6; L.c.rotation.x = 0.3 + lift * 0.4 - S * 0.4; L.d.rotation.x = lift * 0.3; } }
    body.position.y = H + Math.max(0, Math.sin(st.ph * 2)) * 0.012 * spd + run * Math.max(0, Math.sin(st.ph)) * 0.05 - S * 0.07; body.rotation.x = -S * 0.5 + Math.sin(st.ph) * 0.06 * run;
    const lick = S > 0.8 ? Math.max(0, Math.sin(st.t * 0.6)) : 0; // senta e, de vez em quando, olha em volta
    neck.rotation.x = -0.5 + S * 0.35 - lick * 0.2; head.rotation.x = 0.5 - S * 0.2 + lick * 0.4; head.rotation.y = S > 0.5 ? Math.sin(st.t * 0.45) * 0.6 : Math.sin(st.t * 0.9) * 0.1;
    for (let i = 0; i < tail.length; i++) { const k = i / tail.length; tail[i].rotation.x = i === 0 ? 1.9 - 0.4 * run - S * 1.0 : (-0.12 - 0.12 * k) * (1 - S) + S * 0.25; tail[i].rotation.z = Math.sin(st.t * (S > 0.5 ? 1.3 : 2.2) - i * 0.6) * (0.05 + k * 0.18) * (S > 0.5 ? 1.6 : 1); }
  }
  return { root, mats, pose };
}
