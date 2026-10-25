import * as THREE from 'three';
import { mus, musUp, bend, beastRamp as ramp } from './werewolf3d';

/* =====================================================================================================
   OS MORTOS (25/10/2026) — Erling: "vamos dar um trato nos monstros" (zumbi e esqueleto eram caixas e cilindros).
   Zumbi da Catedral: corpo magro e curvado, um ombro caído, pele cinza-esverdeada com manchas, a camisa em
     farrapos que balançam, costelas aparecendo pelo rasgo, mandíbula solta, olhos de brasa verde fraca; arrasta
     uma perna e estica os braços para a frente.
   Carniçal: o mesmo morto, nu e de quatro quase, garras compridas, mais rápido e faminto.
   Esqueleto do Campo Santo: ossos de verdade (cada osso com as duas pontas em nó), caixa torácica de costelas em arco,
     coluna de vértebras, bacia, crânio com órbitas fundas e brasa azul dentro; espada enferrujada e escudo rachado.
   ===================================================================================================== */

export interface UndeadPose { dt: number; mv: number; wind: number; strike: number; hurt: number; idle?: boolean }
export interface Undead { root: THREE.Group; mats: THREE.MeshToonMaterial[]; pose(p: UndeadPose): void }

let rotT: THREE.CanvasTexture | null = null;
function rotTex() { // pele morta: manchas e veias
  if (rotT) return rotT; const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d')!; g.fillStyle = '#c8c8c8'; g.fillRect(0, 0, 128, 128);
  let s = 11; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 60; i++) { const x = r() * 128, y = r() * 128, rr = 3 + r() * 10; const gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, `rgba(${60 + r() * 40},${50 + r() * 30},${40},${0.25 + r() * 0.3})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
  g.strokeStyle = 'rgba(70,40,60,.35)'; g.lineWidth = 1; for (let i = 0; i < 25; i++) { let x = r() * 128, y = r() * 128; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (r() - 0.5) * 14; y += r() * 10; g.lineTo(x, y); } g.stroke(); }
  rotT = new THREE.CanvasTexture(c); rotT.colorSpace = THREE.SRGBColorSpace; rotT.wrapS = rotT.wrapT = THREE.RepeatWrapping; rotT.repeat.set(2, 1); return rotT;
}
/** osso: haste fina com as duas pontas em nó */
function bone(len: number, r: number, knob = 1.9) {
  const pts: THREE.Vector2[] = []; const n = 14;
  for (let i = n; i >= 0; i--) { const t = i / n; const end = Math.max(Math.pow(Math.max(0, 1 - t / 0.14), 2), Math.pow(Math.max(0, (t - 0.86) / 0.14), 2)); pts.push(new THREE.Vector2(r * (1 + (knob - 1) * end) * (t < 0.02 || t > 0.98 ? 0.6 : 1), -len * t)); }
  pts.unshift(new THREE.Vector2(0.0005, -len - r * 0.8)); pts.push(new THREE.Vector2(0.0005, r * 0.8));
  return new THREE.LatheGeometry(pts, 8);
}

export function buildUndead(kind: 'zombie' | 'ghoul' | 'skeleton', tint?: number): Undead {
  const mats: THREE.MeshToonMaterial[] = [];
  const M = (c: number, map: THREE.Texture | null = null) => { const m = new THREE.MeshToonMaterial({ color: c, gradientMap: ramp, map }); mats.push(m); return m; };
  const mesh = (g: THREE.BufferGeometry, m: THREE.Material, sx = 1, sy = 1, sz = 1) => { const o = new THREE.Mesh(g, m); o.scale.set(sx, sy, sz); o.castShadow = true; return o; };
  const SK = kind === 'skeleton';
  const skin = SK ? M(tint ?? 0xe4dcc4) : M(tint ?? (kind === 'ghoul' ? 0x7a8a66 : 0x8a9478), rotTex()), skinD = M(new THREE.Color(SK ? 0xb8ac90 : (tint ?? 0x8a9478)).multiplyScalar(SK ? 1 : 0.62).getHex(), SK ? null : rotTex());
  const rag = M(0x4a4436), rag2 = M(0x3a2e26), mouthM = M(0x2a0e10), tooth = M(0xd8cfb0), rust = M(0x7a4a2a), iron = M(0x5a5a5e), wood = M(0x4a3420);
  const eyeC = SK ? 0x7ab8ff : kind === 'ghoul' ? 0xd8ff60 : 0xb8ff80;
  const eyeM = new THREE.MeshBasicMaterial({ color: eyeC });
  const root = new THREE.Group();
  const HIP = SK ? 1.0 : kind === 'ghoul' ? 0.82 : 0.98;
  const hips = new THREE.Group(); hips.position.y = HIP; root.add(hips);
  const spine = new THREE.Group(); spine.position.y = 0.04; hips.add(spine);
  const chest = new THREE.Group(); chest.position.y = SK ? 0.3 : 0.28; spine.add(chest);
  const neck = new THREE.Group(); neck.position.set(0, 0.42, 0.02); chest.add(neck);
  const head = new THREE.Group(); head.position.y = 0.14; neck.add(head);
  const jaw = new THREE.Group(); jaw.position.set(0, -0.05, 0.04); head.add(jaw);
  type Limb = { a: THREE.Group; b: THREE.Group; c: THREE.Group };
  const arms: Limb[] = [], legs: Limb[] = [];
  const tatters: THREE.Object3D[] = [];
  if (SK) {
    // bacia, coluna, costelas, crânio
    const pel = mesh(new THREE.TorusGeometry(0.11, 0.035, 6, 14, Math.PI * 1.4), skin, 1.2, 1, 0.8); pel.rotation.set(Math.PI / 2 + 0.3, 0, Math.PI * 0.8); hips.add(pel);
    for (let i = 0; i < 7; i++) { const v = mesh(new THREE.CylinderGeometry(0.03, 0.034, 0.035, 8), skin); v.position.set(0, 0.03 + i * 0.045, -0.04); spine.add(v); const pr = mesh(new THREE.ConeGeometry(0.012, 0.05, 4), skinD); pr.rotation.x = -1.7; pr.position.set(0, 0.03 + i * 0.045, -0.07); spine.add(pr); }
    for (let i = 0; i < 7; i++) { const v = mesh(new THREE.CylinderGeometry(0.028, 0.03, 0.035, 8), skin); v.position.set(0, 0.0 + i * 0.05, -0.06); chest.add(v); }
    for (let i = 0; i < 6; i++) { const w = 0.15 - Math.abs(i - 2) * 0.012; const rib = mesh(new THREE.TorusGeometry(w, 0.012, 5, 18, Math.PI * 1.55), skin, 1.25, 1, 1); rib.rotation.set(Math.PI / 2 + 0.25, 0, -Math.PI * 0.27 + Math.PI); rib.position.set(0, 0.08 + i * 0.048, 0.03); chest.add(rib); }
    const stern = mesh(new THREE.CylinderGeometry(0.018, 0.012, 0.22, 6), skin, 1.4, 1, 0.6); stern.position.set(0, 0.2, 0.17); stern.rotation.x = -0.15; chest.add(stern);
    for (const s of [-1, 1]) { const clav = mesh(bone(0.17, 0.012), skin); clav.rotation.z = s * Math.PI / 2; clav.position.set(0, 0.36, 0.06); chest.add(clav); }
    for (let i = 0; i < 3; i++) { const v = mesh(new THREE.CylinderGeometry(0.024, 0.026, 0.04, 8), skin); v.position.y = i * 0.045; neck.add(v); }
    const sk = mesh(new THREE.SphereGeometry(0.1, 16, 12), skin, 0.92, 1.0, 1.08); sk.position.y = 0.04; head.add(sk);
    const face = mesh(new THREE.SphereGeometry(0.075, 12, 8), skin, 1.0, 0.8, 0.8); face.position.set(0, -0.015, 0.05); head.add(face);
    for (const s of [-1, 1]) { const orb = new THREE.Mesh(new THREE.SphereGeometry(0.026, 10, 8), mouthM); orb.position.set(s * 0.036, 0.015, 0.1); orb.scale.set(1, 0.9, 0.6); head.add(orb); const ey = new THREE.Mesh(new THREE.SphereGeometry(0.011, 6, 5), eyeM); ey.position.set(s * 0.036, 0.015, 0.112); head.add(ey); }
    const nosec = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.03, 3), mouthM); nosec.rotation.x = Math.PI; nosec.position.set(0, -0.02, 0.118); head.add(nosec);
    for (let i = 0; i < 6; i++) { const tt = mesh(new THREE.BoxGeometry(0.01, 0.014, 0.008), tooth); const a = (i / 5 - 0.5) * 1.6; tt.position.set(Math.sin(a) * 0.045, -0.05, 0.075 + Math.cos(a) * 0.025); head.add(tt); }
    jaw.add(mesh(new THREE.TorusGeometry(0.05, 0.014, 6, 12, Math.PI), skin, 1, 1, 1.1).rotateX(Math.PI / 2).translateY(0.0));
    for (const s of [-1, 1]) {
      const a = new THREE.Group(); a.position.set(s * 0.18, 0.36, 0.02); chest.add(a); a.add(mesh(bone(0.3, 0.018), skin));
      const b = new THREE.Group(); b.position.y = -0.3; a.add(b); b.add(mesh(bone(0.27, 0.013), skin).translateX(0.012)); b.add(mesh(bone(0.27, 0.011), skinD).translateX(-0.012));
      const c = new THREE.Group(); c.position.y = -0.27; b.add(c); for (let f = 0; f < 4; f++) { const fg = mesh(bone(0.08, 0.006, 1.6), skin); fg.position.set((f - 1.5) * 0.014, -0.02, 0.01); fg.rotation.x = 0.3; c.add(fg); }
      arms.push({ a, b, c });
      const la = new THREE.Group(); la.position.set(s * 0.09, -0.04, 0); hips.add(la); la.add(mesh(bone(0.44, 0.022), skin));
      const lb = new THREE.Group(); lb.position.y = -0.44; la.add(lb); lb.add(mesh(bone(0.42, 0.016), skin)); const pat = mesh(new THREE.SphereGeometry(0.022, 6, 5), skinD); pat.position.z = 0.025; lb.add(pat);
      const lc = new THREE.Group(); lc.position.y = -0.42; lb.add(lc); const foot = mesh(new THREE.SphereGeometry(0.04, 8, 6), skin, 0.8, 0.4, 1.9); foot.position.set(0, -0.03, 0.05); lc.add(foot);
      legs.push({ a: la, b: lb, c: lc });
    }
    // espada enferrujada (mão direita) e escudo rachado (mão esquerda)
    const sw = new THREE.Group(); arms[1].c.add(sw); sw.position.set(0, -0.05, 0.02); sw.rotation.x = Math.PI / 2;
    const grip = mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.12, 6), wood); sw.add(grip); const gd = mesh(new THREE.TorusGeometry(0.05, 0.012, 5, 10, Math.PI), iron); gd.position.y = 0.07; gd.rotation.z = Math.PI; sw.add(gd);
    const bl = new THREE.CylinderGeometry(0.004, 0.032, 0.7, 4); bl.scale(1, 1, 0.3); const bld = mesh(bl, rust); bld.position.y = 0.42; sw.add(bld);
    const shd = mesh(new THREE.SphereGeometry(0.36, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.3), wood, 1, 0.35, 1); shd.rotation.x = Math.PI / 2; shd.position.set(0.05, -0.08, 0.08); shd.rotation.z = 0.2; arms[0].c.add(shd);
    const boss = mesh(new THREE.SphereGeometry(0.06, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), iron); boss.rotation.x = Math.PI / 2; boss.position.set(0.05, -0.08, 0.13); arms[0].c.add(boss);
  } else {
    const G = kind === 'ghoul';
    hips.add(mesh(new THREE.SphereGeometry(0.14, 12, 9), G ? skin : rag2, 1.15, 0.75, 0.85));
    spine.add(mesh(musUp(0.3, 0.12, 0.1, 0.13, 0.5), skin, 1.1, 1, 0.75));
    chest.add(mesh(musUp(0.42, 0.13, 0.2, 0.13, 0.55, 14), skin, 1.25, 1, 0.75));
    for (let i = 0; i < 4; i++) { const rib = mesh(new THREE.TorusGeometry(0.13, 0.012, 4, 12, Math.PI * 0.6), skinD, 1.2, 1, 0.7); rib.rotation.set(Math.PI / 2, 0, Math.PI * 0.2); rib.position.set(0.02, 0.12 + i * 0.05, 0.07); chest.add(rib); }
    if (!G) { // camisa em farrapos: tiras penduradas que balançam
      chest.add(mesh(musUp(0.38, 0.14, 0.205, 0.135, 0.55, 14), rag, 1.26, 0.95, 0.76).translateY(0.02));
      for (let i = 0; i < 11; i++) { const a = (i / 11) * Math.PI * 2; if (a > 0.2 && a < 1.2) continue; const g2 = new THREE.PlaneGeometry(0.06 + (i % 3) * 0.02, 0.2 + (i % 4) * 0.05, 1, 4); g2.translate(0, -0.1 - (i % 4) * 0.025, 0); bend(g2, 0.03, 0.2); const t = new THREE.Mesh(g2, rag); (t.material as THREE.Material).side = THREE.DoubleSide; t.position.set(Math.sin(a) * 0.17, 0.05, Math.cos(a) * 0.12); t.rotation.y = a; chest.add(t); tatters.push(t); }
      for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2; const g2 = new THREE.PlaneGeometry(0.08, 0.26 + (i % 3) * 0.06, 1, 4); g2.translate(0, -0.13, 0); const t = new THREE.Mesh(g2, rag2); t.position.set(Math.sin(a) * 0.15, -0.02, Math.cos(a) * 0.11); t.rotation.y = a; hips.add(t); tatters.push(t); }
    }
    neck.add(mesh(musUp(0.16, 0.06, 0.055, 0.05), skin, 1, 1, 1));
    const sk = mesh(new THREE.SphereGeometry(0.11, 14, 10), skin, 0.92, 1.05, 1.05); sk.position.y = 0.05; head.add(sk);
    const brow = mesh(new THREE.SphereGeometry(0.085, 12, 8), skinD, 1.1, 0.4, 0.8); brow.position.set(0, 0.07, 0.05); head.add(brow);
    const cheek = mesh(new THREE.SphereGeometry(0.07, 10, 8), skinD, 1.15, 0.7, 0.7); cheek.position.set(0, -0.03, 0.05); head.add(cheek);
    for (const s of [-1, 1]) { const orb = new THREE.Mesh(new THREE.SphereGeometry(0.024, 10, 8), mouthM); orb.position.set(s * 0.038, 0.03, 0.095); orb.scale.set(1, 0.8, 0.5); head.add(orb); const ey = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 5), eyeM); ey.position.set(s * 0.038, 0.03, 0.103); head.add(ey); }
    if (!G) for (let i = 0; i < 6; i++) { const hg = new THREE.ConeGeometry(0.012, 0.16 + (i % 3) * 0.05, 4); hg.translate(0, -0.08, 0); const h2 = mesh(hg, rag2); h2.position.set((i - 2.5) * 0.03, 0.12, -0.04 - Math.abs(i - 2.5) * 0.01); h2.rotation.x = 0.4; head.add(h2); } // cabelo ralo
    const mouth = mesh(new THREE.SphereGeometry(0.04, 10, 6), mouthM, 1.1, 0.6, 0.6); mouth.position.set(0, -0.05, 0.08); head.add(mouth);
    jaw.add(mesh(new THREE.SphereGeometry(0.055, 10, 8), skin, 0.95, 0.45, 1.1).translateZ(0.03));
    for (let i = 0; i < 5; i++) { const tt = mesh(new THREE.ConeGeometry(0.006, 0.02, 4), tooth); tt.position.set((i - 2) * 0.014, 0.012, 0.075); jaw.add(tt); }
    for (const s of [-1, 1]) {
      const a = new THREE.Group(); a.position.set(s * 0.2, 0.36, 0); chest.add(a); a.add(mesh(mus(0.32, 0.055, 0.058, 0.04, 0.3), skin, 1, 1, 1));
      if (!G && s < 0) { const sl = mesh(mus(0.18, 0.07, 0.075, 0.06, 0.5), rag, 1, 1, 1); a.add(sl); }
      const b = new THREE.Group(); b.position.y = -0.32; a.add(b); b.add(mesh(mus(0.3, 0.042, 0.045, 0.03, 0.3), skin, 1, 1, 1));
      const c = new THREE.Group(); c.position.y = -0.3; b.add(c); c.add(mesh(new THREE.SphereGeometry(0.04, 8, 6), skin, 0.9, 1.1, 0.6).translateY(-0.03));
      for (let f = 0; f < 4; f++) { const cl = G ? 0.1 : 0.05; const fg = new THREE.ConeGeometry(0.008, cl, 4, 2); fg.rotateX(Math.PI); fg.translate(0, -cl / 2, 0); bend(fg, G ? 0.03 : 0.01, cl); const f2 = mesh(fg, G ? tooth : skinD); f2.position.set((f - 1.5) * 0.016, -0.07, 0.01); c.add(f2); }
      arms.push({ a, b, c });
      const la = new THREE.Group(); la.position.set(s * 0.1, -0.04, 0); hips.add(la); la.add(mesh(mus(0.44, 0.075, 0.075, 0.045, 0.3), G ? skin : rag2, 1, 1, 1.05));
      const lb = new THREE.Group(); lb.position.y = -0.44; la.add(lb); lb.add(mesh(mus(0.42, 0.048, 0.05, 0.032, 0.3), skin, 1, 1, 1.05));
      if (!G) { const rg = new THREE.PlaneGeometry(0.1, 0.2, 1, 3); rg.translate(0, -0.1, 0); const t = new THREE.Mesh(rg, rag2); t.position.set(0, 0.02, 0.05); lb.add(t); tatters.push(t); }
      const lc = new THREE.Group(); lc.position.y = -0.42; lb.add(lc); lc.add(mesh(new THREE.SphereGeometry(0.05, 8, 6), skinD, 0.8, 0.4, 1.9).translateZ(0.05).translateY(-0.03));
      legs.push({ a: la, b: lb, c: lc });
    }
  }
  const st = { t: 0, ph: Math.random() * 6, mv: 0 };
  const L = THREE.MathUtils.lerp;
  function pose(p: UndeadPose) {
    const dt = Math.min(0.05, p.dt); st.t += dt; st.mv += (p.mv - st.mv) * Math.min(1, dt * 6); const mv = st.mv, run = Math.min(1, mv / 2);
    st.ph += dt * (2.2 + mv * (SK ? 2.6 : 2.0)); const s1 = Math.sin(st.ph), W = p.wind, S = p.strike, Hh = p.hurt, G = kind === 'ghoul';
    // passada: o zumbi arrasta a perna esquerda (menos amplitude, pé raspando); o esqueleto marcha seco
    for (let i = 0; i < 2; i++) { const lg = legs[i], ph = i ? s1 : -s1, drag = !SK && !G && i === 0 ? 0.45 : 1, lift = Math.max(0, i ? Math.cos(st.ph) : -Math.cos(st.ph));
      lg.a.rotation.x = ph * 0.55 * run * drag - (G ? 0.6 : 0) - 0.25 * W; lg.b.rotation.x = lift * 0.8 * run * drag + (G ? 1.0 : 0.08) + 0.35 * W; lg.c.rotation.x = -0.1 - (G ? 0.4 : 0); lg.a.rotation.z = (i ? 1 : -1) * 0.06; }
    hips.position.y = HIP + Math.abs(Math.cos(st.ph)) * 0.03 * run - 0.06 * W - (G ? 0.05 : 0);
    hips.rotation.z = !SK && !G ? Math.sin(st.ph) * 0.08 * run + 0.06 : 0; hips.rotation.y = s1 * 0.1 * run;
    spine.rotation.x = (SK ? 0.08 : G ? 0.75 : 0.32) + 0.1 * run - 0.35 * W + 0.55 * S - 0.4 * Hh; spine.rotation.z = !SK && !G ? -0.12 : 0; // ombro caído
    chest.rotation.x = SK ? 0.05 : 0.12; chest.rotation.y = -0.4 * W + 0.5 * S;
    neck.rotation.x = SK ? -0.08 : G ? -0.6 : -0.15; neck.rotation.z = !SK && !G ? 0.25 + Math.sin(st.t * 0.8) * 0.06 : 0;
    head.rotation.x = -spine.rotation.x * (SK ? 0.5 : 0.3) + (p.idle ? Math.sin(st.t * 0.6) * 0.1 : 0) + 0.3 * Hh; head.rotation.y = p.idle ? Math.sin(st.t * 0.37) * 0.35 : 0;
    jaw.rotation.x = SK ? 0.08 + Math.max(0, Math.sin(st.t * 3)) * 0.1 + 0.4 * W : 0.25 + Math.sin(st.t * 2.2) * 0.1 + 0.3 * W;
    for (let i = 0; i < 2; i++) { const a = arms[i], sd = i ? 1 : -1, ph = i ? -s1 : s1; let rx: number, rz: number, ex: number;
      if (SK) { rx = ph * 0.45 * run - 0.15 - (i ? 0.35 : 0.6); rz = sd * 0.12; ex = -0.5 - (i ? 0.2 : 0.6); if (i === 1) { rx = L(L(rx, -2.6, W), -0.35, S); ex = L(L(ex, -1.2, W), -0.1, S); } }
      else if (G) { rx = -1.0 + ph * 0.3 * run; rz = sd * 0.3; ex = -0.6; rx = L(L(rx, -2.3, W), -0.5, S); ex = L(L(ex, -1.3, W), -0.2, S); }
      else { rx = -1.25 + Math.sin(st.t * 1.3 + i) * 0.1 + (i === 0 ? 0.35 : 0); rz = sd * 0.1; ex = -0.2 - (i === 0 ? 0.4 : 0); rx = L(L(rx, -2.5, W), -0.6, S); ex = L(L(ex, -0.8, W), -0.1, S); }
      a.a.rotation.set(rx + 0.4 * Hh, 0, rz); a.b.rotation.x = ex; a.c.rotation.x = -0.2; }
    for (let i = 0; i < tatters.length; i++) tatters[i].rotation.x = Math.sin(st.t * 2.5 + i * 1.7) * 0.15 + 0.12 * run;
  }
  return { root, mats, pose };
}
