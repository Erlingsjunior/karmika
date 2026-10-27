/* A NOVA SAFRA DE BESTAS (26/10, Erling: "mais monstros: caveiras mágicas, arqueiros, mais demônios… afogadores nas margens dos rios,
   escorpiões na areia árida, cobras gigantes, a Aracnídea-Mãe com uma bunda enorme").
   Corpos procedurais para o que não é gente nem quadrúpede: aranhas (de filhote à Mãe), escorpiões, serpentes, caveiras flutuantes,
   harpia, fungo que anda, autômatos e torretas de latão, urso e o Cavaleiro Sem Cabeça.
   Cada corpo segue o mesmo contrato dos outros rigs (enemies.ts): root, mats e update(e, dt, preparo, golpe, tranco, velocidade). */
import * as THREE from 'three';
import { ramp } from './toon3d';
import { buildHorse } from './werewolf3d';

export interface BRig { root: THREE.Group; mats: THREE.MeshToonMaterial[]; update(e: { state: string; t: number; id: number }, dt: number, windK: number, strikeK: number, hurtK: number, mv: number): void }

function kit() {
  const mats: THREE.MeshToonMaterial[] = [];
  const M = (c: number, em = 0) => { const m = new THREE.MeshToonMaterial({ color: c, gradientMap: ramp }); if (em) { m.emissive = new THREE.Color(c); m.emissiveIntensity = em; } mats.push(m); return m; };
  const G = (c: number, op = 1) => new THREE.MeshBasicMaterial({ color: c, transparent: op < 1, opacity: op, depthWrite: op >= 1, blending: op < 1 ? THREE.AdditiveBlending : THREE.NormalBlending, fog: false });
  const mesh = (g: THREE.BufferGeometry, m: THREE.Material, sx = 1, sy = 1, sz = 1) => { const o = new THREE.Mesh(g, m); o.scale.set(sx, sy, sz); o.castShadow = true; return o; };
  return { mats, M, G, mesh };
}
const S = (r: number, w = 12, h = 9) => new THREE.SphereGeometry(r, w, h);
const C = (r0: number, r1: number, h: number, s = 8) => new THREE.CylinderGeometry(r0, r1, h, s);
const down = (g: THREE.BufferGeometry, h: number) => g.translate(0, -h / 2, 0);

/* ======================= ARANHAS ======================= */
export interface SpiderOpt { col: number; col2?: number; abd?: number; leg?: number; mark?: number; eye?: number; hairy?: boolean; sacs?: number }
/** aranha: cefalotórax, abdômen (a Mãe tem um abdômen enorme, com a ampulheta rubra e bolsas de ovos), 8 olhos, quelíceras e 8 pernas de 3 juntas.
 *  Anda em dois tetrápodes alternados; no preparo ergue as patas da frente; no golpe dá o bote com as presas. */
export function buildSpider(o: SpiderOpt): BRig {
  const { mats, M, G, mesh } = kit(); const root = new THREE.Group();
  const A = o.abd ?? 1, L = o.leg ?? 1, body = new THREE.Group(); body.position.y = 0.42 * L; root.add(body);
  const c1 = M(o.col), c2 = M(o.col2 ?? new THREE.Color(o.col).multiplyScalar(0.6).getHex());
  const ceph = mesh(S(0.22), c1, 1, 0.72, 1.15); ceph.position.z = 0.16; body.add(ceph);
  const abdG = new THREE.Group(); abdG.position.set(0, 0.08 * A, -0.2 - 0.28 * A); body.add(abdG);
  const abd = mesh(S(0.34 * A, 16, 12), c2, 1, 0.82, 1.12); abdG.add(abd);
  for (let i = 0; i < 5; i++) { const band = mesh(new THREE.TorusGeometry(0.3 * A * (1 - Math.abs(i - 2) * 0.18), 0.018 * A, 5, 18), c1); band.rotation.y = Math.PI / 2; band.position.z = (i - 2) * 0.1 * A; band.scale.set(1, 0.82, 1); abdG.add(band); }
  if (o.mark) { const hg = new THREE.Group(); hg.position.set(0, 0.26 * A, 0.02); abdG.add(hg); for (const s of [-1, 1]) { const t = mesh(new THREE.ConeGeometry(0.07 * A, 0.12 * A, 3), M(o.mark, 0.6)); t.rotation.x = s > 0 ? -Math.PI / 2 : Math.PI / 2; t.position.z = s * 0.06 * A; hg.add(t); } }
  if (o.sacs) for (let i = 0; i < o.sacs; i++) { const a = (i / o.sacs) * 6.283; const sc = mesh(S(0.07 * A, 8, 6), M(0xe8e0c8, 0.15)); sc.position.set(Math.cos(a) * 0.3 * A, -0.12 * A, Math.sin(a) * 0.32 * A); abdG.add(sc); }
  if (o.hairy) for (let i = 0; i < 26; i++) { const h = mesh(new THREE.ConeGeometry(0.012 * A, 0.09 * A, 3), c1); const u = Math.random() * 6.283, v = Math.random() * 1.2; h.position.set(Math.cos(u) * Math.sin(v) * 0.33 * A, Math.cos(v) * 0.27 * A, Math.sin(u) * Math.sin(v) * 0.37 * A); h.lookAt(h.position.clone().multiplyScalar(3)); h.rotateX(Math.PI / 2); abdG.add(h); }
  const eyeM = G(o.eye ?? 0xff2a1a); for (let i = 0; i < 8; i++) { const r = i < 2 ? 0.035 : 0.022, x = (i < 2 ? (i - 0.5) * 0.08 : ((i - 2) % 3 - 1) * 0.07 * (i < 5 ? 1.4 : 1)), y = i < 2 ? 0.08 : i < 5 ? 0.12 : 0.05; const ey = new THREE.Mesh(S(r, 6, 5), eyeM); ey.position.set(x, y, 0.38); body.add(ey); }
  const fangs: THREE.Group[] = []; for (const s of [-1, 1]) { const f = new THREE.Group(); f.position.set(s * 0.06, -0.02, 0.36); body.add(f); const fg = mesh(new THREE.ConeGeometry(0.03, 0.14, 5), M(0x1a1010)); fg.rotation.x = Math.PI * 0.85; fg.position.y = -0.06; f.add(fg); fangs.push(f); }
  type Lg = { hip: THREE.Group; knee: THREE.Group; ang: number; side: number; grp: number; front: boolean };
  const legs: Lg[] = [];
  for (let i = 0; i < 4; i++) for (const s of [-1, 1]) {
    const ang = (-0.55 + i * 0.38) * (s > 0 ? 1 : -1), hip = new THREE.Group(); hip.position.set(s * 0.14, 0, 0.22 - i * 0.12); hip.rotation.y = s > 0 ? Math.PI / 2 - (i - 1.5) * 0.45 : -Math.PI / 2 + (i - 1.5) * 0.45; body.add(hip);
    const lift = new THREE.Group(); hip.add(lift);
    const FL = 0.5 * L, FA = -1.85; /* fêmur sobe e abre bem para fora: a aranha fica larga, de joelhos altos */
    const fem = mesh(down(C(0.04, 0.032, FL, 6), FL), c1); fem.rotation.x = FA; lift.add(fem);
    const knee = new THREE.Group(); knee.position.set(0, -Math.cos(FA) * FL, -Math.sin(FA) * FL); lift.add(knee);
    const kj = mesh(S(0.04, 6, 5), c2); knee.add(kj);
    const tib = mesh(down(C(0.032, 0.012, 0.74 * L, 6), 0.74 * L), c2); tib.rotation.x = -0.55; knee.add(tib);
    legs.push({ hip: lift, knee, ang, side: s, grp: (i + (s > 0 ? 0 : 1)) % 2, front: i === 0 });
  }
  let ph = Math.random() * 6;
  return { root, mats, update(e, dt, windK, strikeK, hurtK, mv) {
    const spd = Math.min(1, mv / 2.5); ph += dt * (5 + mv * 2.4) * (mv > 0.05 ? 1 : 0.15);
    for (const l of legs) { const sw = Math.sin(ph + l.grp * Math.PI), up = Math.max(0, Math.cos(ph + l.grp * Math.PI));
      l.hip.rotation.y = sw * 0.32 * spd; l.hip.rotation.x = -up * 0.35 * spd; l.knee.rotation.x = up * 0.4 * spd;
      if (l.front) { l.hip.rotation.x -= windK * 1.1; l.knee.rotation.x -= windK * 0.6; } }
    body.position.y = 0.42 * L + Math.abs(Math.sin(ph * 2)) * 0.02 * spd + windK * 0.12 - hurtK * 0.08; body.rotation.x = -windK * 0.35 + strikeK * 0.3;
    body.position.z = strikeK * 0.35; abdG.rotation.x = Math.sin(e.t * 1.7 + e.id) * 0.04 + windK * 0.2; abdG.scale.setScalar(1 + Math.sin(e.t * 2.4) * 0.015);
    for (const f of fangs) f.rotation.x = -0.4 * Math.max(windK, strikeK) + Math.sin(e.t * 9) * 0.05 * windK;
  } };
}

/* ======================= ESCORPIÕES ======================= */
/** escorpião: corpo de placas, 6 pernas, duas pinças que abrem e fecham, cauda de 5 gomos curvada sobre o dorso com o ferrão;
 *  no golpe a cauda desce como um martelo */
export function buildScorpion(col: number, col2: number, glow = 0xffb040): BRig {
  const { mats, M, G, mesh } = kit(); const root = new THREE.Group(), body = new THREE.Group(); body.position.y = 0.32; root.add(body);
  const c1 = M(col), c2 = M(col2);
  for (let i = 0; i < 5; i++) { const pl = mesh(S(0.3 - i * 0.025, 12, 8), i % 2 ? c2 : c1, 1, 0.55, 0.62); pl.position.set(0, 0.04, 0.3 - i * 0.17); body.add(pl); }
  const head = mesh(S(0.2, 10, 8), c1, 1, 0.5, 0.9); head.position.set(0, 0.03, 0.5); body.add(head);
  for (const s of [-1, 1]) { const ey = new THREE.Mesh(S(0.025, 6, 5), G(glow)); ey.position.set(s * 0.05, 0.11, 0.55); body.add(ey); }
  const claws: { arm: THREE.Group; jaw: THREE.Group }[] = [];
  for (const s of [-1, 1]) {
    const arm = new THREE.Group(); arm.position.set(s * 0.18, 0, 0.55); arm.rotation.y = s * 0.5; body.add(arm);
    const u = mesh(down(C(0.05, 0.045, 0.36, 7), 0.36), c1); u.rotation.x = -Math.PI / 2 + 0.25; arm.add(u);
    const fore = new THREE.Group(); fore.position.set(0, 0.09, 0.35); fore.rotation.y = -s * 0.9; arm.add(fore);
    const f = mesh(down(C(0.045, 0.06, 0.3, 7), 0.3), c2); f.rotation.x = -Math.PI / 2; fore.add(f);
    const pincer = new THREE.Group(); pincer.position.z = 0.3; fore.add(pincer);
    const palm = mesh(S(0.14, 10, 8), c1, 0.9, 0.75, 1.4); pincer.add(palm);
    const fix = mesh(new THREE.ConeGeometry(0.045, 0.24, 5), c1); fix.rotation.x = Math.PI / 2; fix.position.set(s * 0.04, 0, 0.2); pincer.add(fix);
    const jaw = new THREE.Group(); jaw.position.set(-s * 0.04, 0, 0.08); pincer.add(jaw); const jw = mesh(new THREE.ConeGeometry(0.04, 0.22, 5), c2); jw.rotation.x = Math.PI / 2; jw.position.z = 0.11; jaw.add(jw);
    claws.push({ arm, jaw });
  }
  const legs: THREE.Group[] = [];
  for (let i = 0; i < 4; i++) for (const s of [-1, 1]) { const lg = new THREE.Group(); lg.position.set(s * 0.2, 0, 0.26 - i * 0.16); lg.rotation.y = s * (Math.PI / 2 - (i - 1.5) * 0.35); body.add(lg);
    const FA = -1.7, FL = 0.26; const a = mesh(down(C(0.03, 0.025, FL, 5), FL), c1); a.rotation.x = FA; lg.add(a); /* coxa sobe e abre; a canela desce até o chão */
    const kn = new THREE.Group(); kn.position.set(0, -Math.cos(FA) * FL, -Math.sin(FA) * FL); lg.add(kn); const b = mesh(down(C(0.024, 0.01, 0.42, 5), 0.42), c2); b.rotation.x = -0.45; kn.add(b); legs.push(lg); }
  const tail: THREE.Group[] = []; let par: THREE.Object3D = body;
  for (let i = 0; i < 6; i++) { const g = new THREE.Group(); g.position.set(0, i === 0 ? 0.05 : 0.17, i === 0 ? -0.42 : 0); par.add(g); g.rotation.x = i === 0 ? -0.9 : -0.42;
    if (i < 5) { const sg = mesh(S(0.085 - i * 0.006, 8, 6), i % 2 ? c1 : c2, 1, 1.25, 1); sg.position.y = 0.085; g.add(sg); }
    else { const bulb = mesh(S(0.08, 8, 6), M(col2, 0.25)); bulb.position.y = 0.05; g.add(bulb); const st = mesh(new THREE.ConeGeometry(0.03, 0.2, 5), M(0x1a1010)); st.position.set(0, 0.08, 0.12); st.rotation.x = 1.9; g.add(st); const gl = new THREE.Mesh(S(0.035, 6, 4), G(glow)); gl.position.set(0, 0.04, 0.2); g.add(gl); }
    tail.push(g); par = g; }
  let ph = Math.random() * 6;
  return { root, mats, update(e, dt, windK, strikeK, hurtK, mv) {
    const spd = Math.min(1, mv / 2.5); ph += dt * (6 + mv * 2.6) * (mv > 0.05 ? 1 : 0);
    legs.forEach((l, i) => { const g = (i + Math.floor(i / 2)) % 2; l.rotation.x = Math.max(0, Math.sin(ph + g * Math.PI)) * -0.3 * spd; l.rotation.z = Math.sin(ph + g * Math.PI) * 0.25 * spd; });
    body.position.y = 0.32 + Math.abs(Math.sin(ph * 2)) * 0.015 * spd - hurtK * 0.06;
    const snap = Math.sin(e.t * (e.state === 'chase' ? 7 : 2.5));
    claws.forEach((c, i) => { c.jaw.rotation.y = (i ? -1 : 1) * (0.25 + 0.25 * snap); c.arm.rotation.x = -windK * 0.5 + strikeK * 0.2; });
    tail.forEach((g, i) => { g.rotation.x = (i === 0 ? -0.9 : -0.42) - windK * 0.22 * (i > 0 ? 1 : 0) + strikeK * (i === 0 ? 1.4 : 0.35) + Math.sin(e.t * 2 + i) * 0.04; });
  } };
}

/* ======================= SERPENTES ======================= */
/** cobra: corpo em gomos que ondula (a onda corre da cabeça para a cauda), cabeça triangular, língua bífida;
 *  no preparo se ergue como naja (meia altura do corpo no ar) e no golpe dá o bote */
export function buildSnake(col: number, belly: number, n = 16, r = 0.13, hood = false, eye = 0xffd040): BRig {
  const { mats, M, G, mesh } = kit(); const root = new THREE.Group();
  const c1 = M(col), c2 = M(belly), dark = M(new THREE.Color(col).multiplyScalar(0.55).getHex());
  const segs: THREE.Group[] = [], len = r * 1.55;
  for (let i = 0; i < n; i++) { const g = new THREE.Group(); root.add(g); const k = 1 - Math.pow(i / n, 1.6) * 0.8; const sg = mesh(S(r * k, 10, 8), i % 3 === 1 ? dark : c1, 1, 0.85, 1.3); sg.position.y = r * k * 0.8; g.add(sg); const bl = mesh(S(r * k * 0.8, 8, 6), c2, 1, 0.5, 1.2); bl.position.y = r * k * 0.45; g.add(bl); segs.push(g); }
  const head = new THREE.Group(); segs[0].add(head); head.position.y = r * 0.9;
  const sk = mesh(S(r * 1.25, 12, 9), c1, 1.05, 0.62, 1.5); sk.position.z = r * 0.7; head.add(sk);
  if (hood) { const hd = mesh(S(r * 1.8, 12, 8), dark, 1.3, 1.1, 0.22); hd.position.set(0, r * 0.6, -r * 0.3); head.add(hd); }
  for (const s of [-1, 1]) { const ey = new THREE.Mesh(S(r * 0.22, 6, 5), G(eye)); ey.position.set(s * r * 0.55, r * 0.35, r * 1.3); head.add(ey); }
  const tongue = mesh(new THREE.ConeGeometry(r * 0.08, r * 1.6, 4), M(0xc4202a)); tongue.rotation.x = Math.PI / 2; tongue.position.set(0, 0, r * 2.6); head.add(tongue);
  let ph = Math.random() * 6; const P: THREE.Vector3[] = Array.from({ length: n }, (_, i) => new THREE.Vector3(0, 0, -i * len));
  const coilP: { x: number; z: number }[] = []; { let a = 0; for (let i = 0; i < n; i++) { const rr = r * 1.2 + a * r * 0.42; coilP.push({ x: Math.cos(a) * rr, z: Math.sin(a) * rr }); a += len / Math.max(r, rr); } }
  return { root, mats, update(e, dt, windK, strikeK, hurtK, mv) {
    ph += dt * (2.2 + mv * 1.8); const amp = r * (2.2 + Math.min(1, mv / 2) * 1.5);
    const rear = Math.max(windK, strikeK * 0.6) * (e.state === 'idle' ? 0 : 1), coil = e.state === 'idle' ? 1 : 0;
    for (let i = 0; i < n; i++) { const k = i / n; let x = Math.sin(ph - i * 0.55) * amp * Math.min(1, k * 3 + 0.15), z = -i * len, y = 0;
      if (coil) { /* enrolada: espiral contínua (o mesmo passo entre gomos), a cabeça no meio, erguida, olhando em volta */ x = coilP[i].x; z = coilP[i].z; y = i < 4 ? r * (4 - i) * 0.85 : 0; if (i === 0) { x += Math.sin(e.t * 0.6) * r; } }
      if (rear > 0 && i < n * 0.4) { const kk = 1 - i / (n * 0.4); y += kk * kk * n * len * 0.38 * rear; z += kk * len * 2 * rear; }
      P[i].set(x, y, z + strikeK * len * 4 * (1 - k)); }
    for (let i = 0; i < n; i++) { const g = segs[i]; g.position.copy(P[i]); const nx = i ? P[i - 1] : P[0].clone().add(new THREE.Vector3(0, 0, len)); g.lookAt(nx.x, nx.y + (i ? 0 : 0), nx.z); }
    head.rotation.x = rear * 0.6 - strikeK * 0.3; tongue.scale.z = 0.5 + Math.max(0, Math.sin(e.t * 11)) * 0.9; tongue.visible = Math.sin(e.t * 3 + e.id) > 0.2;
    root.position.y = -hurtK * 0.05;
  } };
}

/* ======================= CAVEIRAS FLUTUANTES ======================= */
/** caveira mágica: crânio com mandíbula que bate, órbitas acesas e uma coroa de chamas (fogo ou gelo) que tremula; voa balançando */
export function buildSkull(fire: number, core: number): BRig {
  const { mats, M, G, mesh } = kit(); const root = new THREE.Group(), bob = new THREE.Group(); root.add(bob);
  const bone = M(0xe8dcc0), boneD = M(0xb8a888);
  const cr = mesh(S(0.28, 14, 12), bone, 1, 0.92, 1.05); cr.position.y = 0.05; bob.add(cr);
  const cheek = mesh(S(0.2, 10, 8), boneD, 1.15, 0.6, 0.9); cheek.position.set(0, -0.12, 0.08); bob.add(cheek);
  for (const s of [-1, 1]) { const so = new THREE.Mesh(S(0.075, 8, 6), new THREE.MeshBasicMaterial({ color: 0x0a0606 })); so.position.set(s * 0.1, 0.0, 0.22); bob.add(so); const gl = new THREE.Mesh(S(0.04, 6, 5), G(core)); gl.position.set(s * 0.1, 0.0, 0.26); bob.add(gl); }
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.07, 3), new THREE.MeshBasicMaterial({ color: 0x0a0606 })); nose.position.set(0, -0.09, 0.27); nose.rotation.x = Math.PI; bob.add(nose);
  const jaw = new THREE.Group(); jaw.position.set(0, -0.17, 0.02); bob.add(jaw); const jw = mesh(new THREE.BoxGeometry(0.28, 0.07, 0.26), boneD); jw.position.z = 0.09; jaw.add(jw);
  for (let i = 0; i < 6; i++) { const t = mesh(new THREE.BoxGeometry(0.03, 0.04, 0.02), bone); t.position.set((i - 2.5) * 0.04, 0.045, 0.21); jaw.add(t); const t2 = mesh(new THREE.BoxGeometry(0.03, 0.04, 0.02), bone); t2.position.set((i - 2.5) * 0.04, -0.21, 0.23); bob.add(t2); }
  const flames: THREE.Mesh[] = []; for (let i = 0; i < 9; i++) { const f = new THREE.Mesh(new THREE.ConeGeometry(0.09 + Math.random() * 0.05, 0.4 + Math.random() * 0.3, 6), G(i % 3 ? fire : core, 0.75)); const a = i / 9 * 6.283; f.position.set(Math.cos(a) * 0.18, 0.28, Math.sin(a) * 0.18 - 0.05); f.rotation.set(Math.sin(a) * -0.4, 0, Math.cos(a) * 0.4); f.userData.h = f.scale.y; bob.add(f); flames.push(f); }
  const halo = new THREE.Mesh(S(0.55, 12, 8), G(fire, 0.12)); bob.add(halo);
  return { root, mats, update(e, dt, windK, strikeK, hurtK) { void dt;
    bob.position.y = Math.sin(e.t * 2.4 + e.id) * 0.12; bob.rotation.z = Math.sin(e.t * 1.3 + e.id) * 0.12; bob.rotation.x = -windK * 0.4 + strikeK * 0.5 - hurtK * 0.4;
    jaw.rotation.x = 0.15 + Math.max(windK * 0.6, Math.abs(Math.sin(e.t * (e.state === 'chase' ? 9 : 3))) * 0.35);
    flames.forEach((f, i) => { f.scale.y = 0.75 + Math.abs(Math.sin(e.t * 9 + i * 1.7)) * 0.6 + windK * 0.6; });
    halo.scale.setScalar(1 + windK * 0.6 + Math.sin(e.t * 5) * 0.05);
  } };
}

/* ======================= HARPIA ======================= */
/** mulher-pássaro: tronco e rosto, cabelo de penas, asas grandes de penas em leque que batem, pernas de ave com garras;
 *  no preparo recolhe as asas, no golpe mergulha com as garras à frente */
export function buildHarpy(col: number, feather: number): BRig {
  const { mats, M, mesh } = kit(); const root = new THREE.Group(), body = new THREE.Group(); body.position.y = 0.2; root.add(body);
  const skin = M(col), fea = M(feather), feaD = M(new THREE.Color(feather).multiplyScalar(0.6).getHex()), claw = M(0x2a2018);
  const torso = mesh(new THREE.CapsuleGeometry(0.16, 0.36, 4, 10), skin, 1, 1, 0.8); torso.position.y = 0.4; body.add(torso);
  const chest = mesh(S(0.2, 10, 8), fea, 1.05, 0.9, 0.8); chest.position.set(0, 0.28, 0.02); body.add(chest);
  const head = mesh(S(0.13, 12, 10), skin, 0.95, 1.1, 1); head.position.set(0, 0.8, 0.04); body.add(head);
  const hair = mesh(new THREE.ConeGeometry(0.17, 0.5, 8, 1, true), fea); hair.position.set(0, 0.7, -0.08); hair.rotation.x = 0.4; body.add(hair);
  for (const s of [-1, 1]) { const ey = new THREE.Mesh(S(0.022, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffd040 })); ey.position.set(s * 0.045, 0.83, 0.15); body.add(ey); }
  const beak = mesh(new THREE.ConeGeometry(0.03, 0.08, 4), claw); beak.rotation.x = Math.PI / 2 + 0.4; beak.position.set(0, 0.77, 0.17); body.add(beak);
  const wings: THREE.Group[] = [];
  for (const s of [-1, 1]) { const w = new THREE.Group(); w.position.set(s * 0.17, 0.58, -0.04); body.add(w); wings.push(w);
    const arm = mesh(down(C(0.04, 0.03, 0.6, 6), 0.6), fea); arm.rotation.z = s * Math.PI / 2; arm.position.x = 0; w.add(arm);
    for (let i = 0; i < 9; i++) { const f = mesh(new THREE.BoxGeometry(0.11, 0.62 - i * 0.03, 0.015), i % 2 ? fea : feaD); f.geometry.translate(0, -(0.62 - i * 0.03) / 2, 0); f.position.set(s * (0.1 + i * 0.075), 0, -0.01 * i); f.rotation.z = s * (0.1 + i * 0.08); w.add(f); } }
  const legs: THREE.Group[] = [];
  for (const s of [-1, 1]) { const l = new THREE.Group(); l.position.set(s * 0.08, 0.16, 0); body.add(l); legs.push(l);
    const th = mesh(down(C(0.06, 0.04, 0.22, 6), 0.22), fea); l.add(th); const sh = mesh(down(C(0.025, 0.02, 0.24, 5), 0.24), claw); sh.position.y = -0.22; sh.rotation.x = 0.3; l.add(sh);
    for (let k = 0; k < 3; k++) { const t = mesh(new THREE.ConeGeometry(0.018, 0.12, 4), claw); t.position.set((k - 1) * 0.035, -0.45, 0.06); t.rotation.x = 1.6; l.add(t); } }
  return { root, mats, update(e, dt, windK, strikeK, hurtK) { void dt;
    const fl = Math.sin(e.t * (e.state === 'chase' ? 10 : 6) + e.id); wings.forEach((w, i) => { const s = i ? 1 : -1; w.rotation.z = s * (fl * 0.65 * (1 - windK) + windK * 1.1); w.rotation.y = s * windK * 0.5; });
    body.position.y = 0.2 + fl * 0.06; body.rotation.x = -windK * 0.3 + strikeK * 0.7 - hurtK * 0.4;
    legs.forEach((l) => { l.rotation.x = -0.3 - strikeK * 1.3 + windK * 0.4; });
  } };
}

/* ======================= FUNGO CAMINHANTE ======================= */
export function buildFungus(cap: number, spot: number, glow = 0x9aff6a): BRig {
  const { mats, M, G, mesh } = kit(); const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const stemM = M(0xe8dcc0), capM = M(cap, 0.08), spotM = M(spot);
  const stem = mesh(C(0.2, 0.26, 0.6, 12), stemM); stem.position.y = 0.55; body.add(stem);
  const gill = mesh(C(0.55, 0.22, 0.12, 16), M(0xb8a888)); gill.position.y = 0.88; body.add(gill);
  const capG = new THREE.Group(); capG.position.y = 0.9; body.add(capG); const cp = mesh(new THREE.SphereGeometry(0.6, 18, 10, 0, 6.283, 0, Math.PI / 2), capM, 1, 0.75, 1); capG.add(cp);
  for (let i = 0; i < 9; i++) { const u = Math.random() * 6.283, v = 0.25 + Math.random() * 0.9; const sp = mesh(S(0.06 + Math.random() * 0.05, 6, 4), spotM, 1, 0.4, 1); sp.position.set(Math.cos(u) * Math.sin(v) * 0.58, Math.cos(v) * 0.44, Math.sin(u) * Math.sin(v) * 0.58); sp.lookAt(sp.position.clone().multiplyScalar(2)); capG.add(sp); }
  for (const s of [-1, 1]) { const ey = new THREE.Mesh(S(0.04, 6, 4), G(glow)); ey.position.set(s * 0.08, 0.68, 0.2); body.add(ey); }
  const legs: THREE.Mesh[] = []; for (const s of [-1, 1]) { const l = mesh(down(C(0.08, 0.1, 0.3, 7), 0.3), stemM); l.position.set(s * 0.12, 0.3, 0); body.add(l); legs.push(l); }
  const arms: THREE.Mesh[] = []; for (const s of [-1, 1]) { const a = mesh(down(C(0.04, 0.05, 0.32, 6), 0.32), stemM); a.position.set(s * 0.22, 0.72, 0); a.rotation.z = s * 0.4; body.add(a); arms.push(a); }
  const puff = new THREE.Mesh(S(0.7, 10, 8), G(glow, 0.0)); puff.position.y = 0.9; body.add(puff);
  let ph = 0;
  return { root, mats, update(e, dt, windK, strikeK, hurtK, mv) {
    ph += dt * (4 + mv * 3); const spd = Math.min(1, mv / 1.5);
    legs.forEach((l, i) => { l.rotation.x = Math.sin(ph + i * Math.PI) * 0.5 * spd; }); body.rotation.z = Math.sin(ph) * 0.08 * spd; body.position.y = Math.abs(Math.sin(ph)) * 0.04 * spd;
    capG.scale.set(1 + windK * 0.15, 1 - windK * 0.25 + strikeK * 0.3, 1 + windK * 0.15); arms.forEach((a, i) => { a.rotation.z = (i ? 1 : -1) * (0.4 + windK * 1.2); });
    (puff.material as THREE.MeshBasicMaterial).opacity = strikeK * 0.35; puff.scale.setScalar(1 + strikeK * 1.5); body.rotation.x = -hurtK * 0.3;
  } };
}

/* ======================= AUTÔMATOS E TORRETAS ======================= */
/** autômato de latão: tronco de caldeira com engrenagem no peito que gira, cabeça de elmo com a fenda do olho acesa, braços de pistão,
 *  pernas de cilindro e vapor saindo dos ombros. O mesmo corpo, enorme, é o Colosso de Ferro. */
export function buildAutomaton(metal: number, trim: number, eye = 0x6ad0ff): BRig {
  const { mats, M, G, mesh } = kit(); const root = new THREE.Group(), body = new THREE.Group(); body.position.y = 0.95; root.add(body);
  const mt = M(metal), tr = M(trim), dk = M(0x2a2420);
  const tor = mesh(C(0.34, 0.28, 0.7, 10), mt); tor.position.y = 0.35; body.add(tor);
  for (const y of [0.08, 0.62]) { const band = mesh(new THREE.TorusGeometry(0.33, 0.035, 5, 18), tr); band.rotation.x = Math.PI / 2; band.position.y = y; body.add(band); }
  const gear = new THREE.Group(); gear.position.set(0, 0.38, 0.31); body.add(gear); const gd = mesh(C(0.16, 0.16, 0.05, 12), tr); gd.rotation.x = Math.PI / 2; gear.add(gd);
  for (let i = 0; i < 8; i++) { const t = mesh(new THREE.BoxGeometry(0.05, 0.06, 0.05), tr); const a = i / 8 * 6.283; t.position.set(Math.cos(a) * 0.18, Math.sin(a) * 0.18, 0); gear.add(t); }
  const hub = new THREE.Mesh(S(0.05, 8, 6), G(eye)); hub.position.z = 0.04; gear.add(hub);
  const head = new THREE.Group(); head.position.y = 0.86; body.add(head); head.add(mesh(new THREE.BoxGeometry(0.34, 0.3, 0.32), mt)); const visor = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.04, 0.02), G(eye)); visor.position.set(0, 0.02, 0.17); head.add(visor);
  const crest = mesh(new THREE.BoxGeometry(0.05, 0.12, 0.3), tr); crest.position.y = 0.2; head.add(crest);
  for (const s of [-1, 1]) { const pipe = mesh(C(0.04, 0.04, 0.3, 6), dk); pipe.position.set(s * 0.26, 0.82, -0.12); body.add(pipe); }
  const arms: THREE.Group[] = [], legs: THREE.Group[] = [];
  for (const s of [-1, 1]) { const a = new THREE.Group(); a.position.set(s * 0.42, 0.6, 0); body.add(a); arms.push(a); a.add(mesh(S(0.12, 8, 6), tr)); const u = mesh(down(C(0.07, 0.06, 0.38, 8), 0.38), dk); a.add(u); const f = mesh(down(C(0.09, 0.1, 0.34, 8), 0.34), mt); f.position.y = -0.38; a.add(f); const fist = mesh(new THREE.BoxGeometry(0.18, 0.16, 0.18), tr); fist.position.y = -0.76; a.add(fist); }
  for (const s of [-1, 1]) { const l = new THREE.Group(); l.position.set(s * 0.16, 0, 0); body.add(l); legs.push(l); const th = mesh(down(C(0.09, 0.08, 0.45, 8), 0.45), dk); l.add(th); const sh = mesh(down(C(0.1, 0.12, 0.45, 8), 0.45), mt); sh.position.y = -0.45; l.add(sh); const ft = mesh(new THREE.BoxGeometry(0.2, 0.08, 0.3), tr); ft.position.set(0, -0.92, 0.05); l.add(ft); }
  let ph = 0;
  return { root, mats, update(e, dt, windK, strikeK, hurtK, mv) {
    ph += dt * (3 + mv * 1.8); const spd = Math.min(1, mv / 2);
    legs.forEach((l, i) => { l.rotation.x = Math.sin(ph + i * Math.PI) * 0.42 * spd; });
    arms.forEach((a, i) => { a.rotation.x = -Math.sin(ph + i * Math.PI) * 0.3 * spd - (i ? windK * 2.2 : windK * 0.4) + (i ? strikeK * 1.8 : 0); });
    body.position.y = 0.95 + Math.abs(Math.sin(ph)) * 0.04 * spd - hurtK * 0.05; body.rotation.y = -windK * 0.4 + strikeK * 0.5; gear.rotation.z += dt * (2 + mv);
    (visor.material as THREE.MeshBasicMaterial).color.setHex(windK > 0.3 ? 0xff4a2a : eye); head.rotation.y = e.state === 'idle' ? Math.sin(e.t * 0.7) * 0.6 : 0;
  } };
}
/** torreta a vapor: base de rebites fixa no chão, cabeça que gira com o cano e uma caldeira atrás soltando vapor */
export function buildTurret(metal: number, trim: number): BRig {
  const { mats, M, G, mesh } = kit(); const root = new THREE.Group();
  const mt = M(metal), tr = M(trim), dk = M(0x2a2420);
  const base = mesh(C(0.55, 0.7, 0.4, 12), dk); base.position.y = 0.2; root.add(base); for (let i = 0; i < 4; i++) { const leg = mesh(new THREE.BoxGeometry(0.12, 0.2, 0.7), mt); leg.position.y = 0.1; leg.rotation.y = i * Math.PI / 4; root.add(leg); }
  const head = new THREE.Group(); head.position.y = 0.75; root.add(head); head.add(mesh(S(0.36, 14, 10), mt, 1, 0.8, 1));
  const barrel = mesh(C(0.08, 0.1, 0.9, 10), dk); barrel.rotation.x = Math.PI / 2; barrel.position.set(0, 0.04, 0.55); head.add(barrel);
  const muzzle = new THREE.Mesh(S(0.08, 8, 6), G(0xffa040, 0.0)); muzzle.position.set(0, 0.04, 1.02); head.add(muzzle);
  const boiler = mesh(C(0.18, 0.18, 0.4, 10), tr); boiler.rotation.x = Math.PI / 2; boiler.position.set(0, 0.12, -0.38); head.add(boiler);
  const lens = new THREE.Mesh(S(0.06, 8, 6), G(0xff4a2a)); lens.position.set(0.18, 0.15, 0.25); head.add(lens);
  return { root, mats, update(e, dt, windK, strikeK) { void dt; head.rotation.x = -windK * 0.12; barrel.position.z = 0.55 - strikeK * 0.15; (muzzle.material as THREE.MeshBasicMaterial).opacity = strikeK * 0.9 + windK * 0.3; muzzle.scale.setScalar(1 + strikeK * 3); if (e.state === 'idle') head.rotation.y = Math.sin(e.t * 0.5) * 0.9; else head.rotation.y *= 0.9; } };
}

/* ======================= URSO ======================= */
/** urso: corpanzil com a corcova dos ombros, cabeça larga de focinho curto, orelhas redondas, patas grossas;
 *  passo pesado de plantígrado e, no preparo, ergue-se nas patas de trás para descer as duas garras */
export function buildBear(fur: number, snout = 0x8a6a4a): BRig {
  const { mats, M, mesh } = kit(); const root = new THREE.Group(), body = new THREE.Group(); body.position.y = 0.78; root.add(body);
  const f = M(fur), fd = M(new THREE.Color(fur).multiplyScalar(0.7).getHex()), sn = M(snout), nose = M(0x141010);
  const torso = mesh(S(0.55, 14, 10), f, 0.95, 0.85, 1.45); body.add(torso);
  const hump = mesh(S(0.4, 12, 8), fd, 1, 0.75, 1); hump.position.set(0, 0.38, 0.28); body.add(hump);
  const neck = new THREE.Group(); neck.position.set(0, 0.2, 0.7); body.add(neck);
  const head = mesh(S(0.3, 12, 10), f, 1.05, 0.95, 1); head.position.z = 0.2; neck.add(head);
  const mz = mesh(S(0.15, 10, 8), sn, 0.95, 0.75, 1.3); mz.position.set(0, -0.06, 0.45); neck.add(mz);
  const nz = mesh(S(0.06, 8, 6), nose); nz.position.set(0, -0.02, 0.62); neck.add(nz);
  for (const s of [-1, 1]) { const ear = mesh(S(0.09, 8, 6), fd, 1, 1, 0.5); ear.position.set(s * 0.2, 0.24, 0.12); neck.add(ear); const ey = new THREE.Mesh(S(0.03, 6, 4), new THREE.MeshBasicMaterial({ color: 0x100806 })); ey.position.set(s * 0.12, 0.08, 0.42); neck.add(ey); }
  const legs: THREE.Group[] = [];
  for (const [x, z] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) { const l = new THREE.Group(); l.position.set(x * 0.32, -0.1, z * 0.5); body.add(l); legs.push(l); const u = mesh(down(C(0.17, 0.14, 0.42, 9), 0.42), f); l.add(u); const lo = mesh(down(C(0.13, 0.12, 0.3, 9), 0.3), fd); lo.position.y = -0.42; l.add(lo); const paw = mesh(S(0.15, 8, 6), fd, 1, 0.45, 1.3); paw.position.set(0, -0.7, 0.06); l.add(paw);
    if (z > 0) for (let k = 0; k < 3; k++) { const c = mesh(new THREE.ConeGeometry(0.025, 0.09, 4), M(0xe8dcc0)); c.position.set((k - 1) * 0.06, -0.72, 0.2); c.rotation.x = 1.4; l.add(c); } }
  let ph = 0;
  return { root, mats, update(e, dt, windK, strikeK, hurtK, mv) {
    ph += dt * (2.4 + mv * 1.4); const spd = Math.min(1, mv / 2.5), rear = windK;
    legs.forEach((l, i) => { const front = i < 2; l.rotation.x = Math.sin(ph + [0, Math.PI, Math.PI, 0][i]) * 0.45 * spd * (1 - rear) - (front ? rear * 1.4 - strikeK * 1.1 : -rear * 0.2); });
    body.rotation.x = -rear * 0.95 + strikeK * 0.6 - hurtK * 0.15; body.position.y = 0.78 + rear * 0.55 - strikeK * 0.2 + Math.abs(Math.sin(ph)) * 0.03 * spd; body.position.z = -rear * 0.3 + strikeK * 0.3;
    neck.rotation.x = rear * 0.6 + (e.state === 'idle' ? Math.sin(e.t * 0.6 + e.id) * 0.15 + 0.15 : 0); neck.rotation.y = e.state === 'idle' ? Math.sin(e.t * 0.4) * 0.3 : 0;
  } };
}

/* ======================= O CAVALEIRO SEM CABEÇA ======================= */
/** cavalo negro de crina em brasa e o cavaleiro de armadura sem cabeça (uma chama azul no lugar do pescoço), capa rasgada e lança;
 *  no preparo abaixa a lança, no golpe a investida */
export function buildHeadless(): BRig {
  const hz = buildHorse({ coat: 0x141012, mane: 0x3a0a08 }); const { mats, M, G, mesh } = kit(); const root = new THREE.Group(); root.add(hz.root); root.scale.setScalar(1.15);
  mats.push(...hz.mats); for (const m of hz.mats) { m.emissive = new THREE.Color(0x000000); }
  const rider = new THREE.Group(); rider.position.set(0, 0.3, 0.05); hz.body.add(rider);
  const arm = M(0x3a3a44), cloth = M(0x1a0a10), steel = M(0x8a8a96);
  const torso = mesh(new THREE.CapsuleGeometry(0.2, 0.34, 4, 10), arm); torso.position.y = 0.42; rider.add(torso);
  for (const s of [-1, 1]) { const pa = mesh(S(0.14, 8, 6), steel, 1, 0.8, 1); pa.position.set(s * 0.24, 0.66, 0); rider.add(pa); const leg = mesh(down(C(0.08, 0.07, 0.5, 7), 0.5), arm); leg.position.set(s * 0.2, 0.15, 0.05); leg.rotation.set(-0.4, 0, s * 0.35); rider.add(leg); }
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.45, 7), G(0x4ab0ff, 0.8)); flame.position.y = 0.92; rider.add(flame); const fl2 = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.3, 6), G(0xd8f0ff, 0.9)); fl2.position.y = 0.88; rider.add(fl2);
  const cape = mesh(new THREE.PlaneGeometry(0.6, 1.0, 1, 4).translate(0, -0.5, 0), new THREE.MeshToonMaterial({ color: 0x1a0a10, side: THREE.DoubleSide, gradientMap: ramp })); cape.position.set(0, 0.7, -0.2); cape.rotation.x = 0.5; rider.add(cape); void cloth;
  const lance = new THREE.Group(); lance.position.set(0.28, 0.5, 0.1); rider.add(lance); const sh = mesh(down(C(0.025, 0.035, 2.6, 6), 2.6), M(0x2a1a10)); sh.rotation.x = -Math.PI / 2 + 0.6; lance.add(sh); const tip = mesh(new THREE.ConeGeometry(0.06, 0.4, 5), steel); tip.position.set(0, 1.55, 2.0); tip.rotation.x = Math.PI / 2 - 0.6 + Math.PI; lance.add(tip); lance.rotation.x = -0.6;
  const maneGlow = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.6, 6), G(0xff5a1a, 0.6)); maneGlow.position.set(0, 0.25, 0.85); maneGlow.rotation.x = -0.9; hz.body.add(maneGlow);
  return { root, mats, update(e, dt, windK, strikeK, hurtK, mv) {
    hz.pose({ dt, mv: Math.min(mv, 12) * 1.4, idle: e.state === 'idle' });
    lance.rotation.x = -0.6 + windK * 0.75 + strikeK * 0.2; flame.scale.y = 0.8 + Math.abs(Math.sin(e.t * 9)) * 0.5; maneGlow.scale.y = 0.8 + Math.abs(Math.sin(e.t * 7)) * 0.6; cape.rotation.x = 0.5 + Math.min(1, mv / 6) * 0.6; rider.rotation.x = -hurtK * 0.3;
  } };
}

/* ======================= CÃES (pets) ======================= */
export interface DogOpt { coat: number; patch?: number; patchEye?: 1 | -1; muzzle?: number; ear?: 'fold' | 'up'; bulk?: number; tail?: 'stub' | 'long' }
/** cachorro (Erling 26/10: "um boxer todo branco com uma manchinha no olho"): peito fundo e largo, cintura fina, focinho curto e quadrado
 *  com a boca de bochechas caídas, orelhas dobradas, rabinho curto que abana. Anda em trote, corre em galope, senta quando você para. */
export function buildDog(o: DogOpt): { root: THREE.Group; mats: THREE.MeshToonMaterial[]; pose(p: { dt: number; mv: number; idle?: boolean }): void } {
  const { mats, M, mesh } = kit(); const root = new THREE.Group(), body = new THREE.Group(); const H = 0.42; body.position.y = H; root.add(body);
  const B = o.bulk ?? 1, coat = M(o.coat), coatD = M(new THREE.Color(o.coat).multiplyScalar(0.86).getHex()), mz = M(o.muzzle ?? 0xe8dcd0), nose = M(0x1a1414), pink = M(0xd88a8a), dark = M(o.patch ?? 0x1a1414);
  const chest = mesh(S(0.17 * B, 14, 10), coat, 1, 1.05, 1.15); chest.position.set(0, 0.02, 0.15); body.add(chest);
  const belly = mesh(S(0.13 * B, 12, 9), coat, 0.95, 0.85, 1.3); belly.position.set(0, 0.03, -0.05); body.add(belly);
  const hip = mesh(S(0.14 * B, 12, 9), coat, 1, 0.95, 1); hip.position.set(0, 0.04, -0.2); body.add(hip);
  const brisket = mesh(S(0.11 * B, 10, 8), coatD, 1, 0.9, 0.9); brisket.position.set(0, -0.08, 0.24); body.add(brisket);
  const neck = new THREE.Group(); neck.position.set(0, 0.1, 0.27); neck.rotation.x = -0.65; body.add(neck);
  const nk = mesh(new THREE.CapsuleGeometry(0.075 * B, 0.12, 4, 10), coat); nk.position.y = 0.07; neck.add(nk);
  const head = new THREE.Group(); head.position.set(0, 0.17, 0.02); head.rotation.x = 0.65; neck.add(head);
  const skull = mesh(S(0.105, 14, 12), coat, 1.05, 0.95, 1.05); head.add(skull);
  const brow = mesh(S(0.07, 10, 8), coatD, 1.4, 0.45, 0.8); brow.position.set(0, 0.06, 0.06); head.add(brow);
  const snout = mesh(new THREE.BoxGeometry(0.14, 0.09, 0.1), mz); snout.position.set(0, -0.025, 0.12); head.add(snout);
  for (const s of [-1, 1]) { const jowl = mesh(S(0.05, 8, 6), mz, 0.9, 1.1, 1); jowl.position.set(s * 0.05, -0.06, 0.13); head.add(jowl); }
  const nz = mesh(S(0.03, 8, 6), nose, 1.4, 0.9, 0.7); nz.position.set(0, 0.0, 0.175); head.add(nz);
  const jaw = new THREE.Group(); jaw.position.set(0, -0.06, 0.07); head.add(jaw); jaw.add(mesh(new THREE.BoxGeometry(0.12, 0.035, 0.09), mz).translateZ(0.04));
  const tongue = mesh(new THREE.BoxGeometry(0.05, 0.01, 0.07), pink); tongue.position.set(0, -0.025, 0.08); jaw.add(tongue);
  for (const s of [-1, 1]) {
    const ey = new THREE.Mesh(S(0.018, 8, 6), new THREE.MeshBasicMaterial({ color: 0x1a0e08 })); ey.position.set(s * 0.05, 0.035, 0.085); head.add(ey);
    const sh = new THREE.Mesh(S(0.006, 5, 4), new THREE.MeshBasicMaterial({ color: 0xffffff })); sh.position.set(s * 0.052, 0.042, 0.1); head.add(sh);
    if (o.patch !== undefined && s === (o.patchEye ?? 1)) { const p = mesh(S(0.045, 10, 8), dark, 1, 0.85, 0.45); p.position.set(s * 0.05, 0.035, 0.07); head.add(p); }
    const ear = new THREE.Group(); ear.position.set(s * 0.075, 0.08, -0.01); head.add(ear);
    if ((o.ear ?? 'fold') === 'fold') { const e = mesh(new THREE.ConeGeometry(0.035, 0.07, 4), coat, 1, 1, 0.4); e.position.set(s * 0.012, -0.02, 0.01); e.rotation.set(0.3, 0, s * 2.4); ear.add(e); }
    else { const e = mesh(new THREE.ConeGeometry(0.035, 0.09, 4), coat, 1, 1, 0.45); e.position.y = 0.04; e.rotation.z = -s * 0.2; ear.add(e); }
  }
  type L = { a: THREE.Group; b: THREE.Group; front: boolean };
  const legs: L[] = [];
  for (const front of [true, false]) for (const s of [-1, 1]) {
    const a = new THREE.Group(); a.position.set(s * 0.085 * B, -0.04, front ? 0.2 : -0.2); body.add(a);
    const up = mesh(down(C(0.045 * B, 0.035, 0.2, 8), 0.2), coat); a.add(up); if (!front) { const th = mesh(S(0.07 * B, 8, 6), coat, 0.8, 1.2, 1.1); th.position.y = -0.04; a.add(th); }
    const b = new THREE.Group(); b.position.y = -0.2; a.add(b); b.add(mesh(down(C(0.03, 0.028, 0.18, 7), 0.18), coat));
    const paw = mesh(S(0.035, 8, 6), coat, 1, 0.6, 1.3); paw.position.set(0, -0.19, 0.015); b.add(paw);
    legs.push({ a, b, front });
  }
  const tail = new THREE.Group(); tail.position.set(0, 0.1, -0.33); body.add(tail); const tl = mesh(down(C(0.025, 0.018, (o.tail ?? 'stub') === 'stub' ? 0.07 : 0.24, 6), (o.tail ?? 'stub') === 'stub' ? 0.07 : 0.24), coat); tl.rotation.x = Math.PI; tail.add(tl);
  const st = { ph: 0, t: 0, mv: 0, sit: 0, pant: 0 };
  return { root, mats, pose(p) {
    const dt = Math.min(0.05, p.dt); st.t += dt; st.mv += (p.mv - st.mv) * Math.min(1, dt * 7); const mv = st.mv, spd = Math.min(1, mv / 1.6), run = Math.max(0, Math.min(1, (mv - 2.8) / 2));
    st.sit += ((p.idle && mv < 0.1 ? 1 : 0) - st.sit) * Math.min(1, dt * (p.idle ? 1.5 : 7)); const S2 = st.sit;
    st.ph += dt * 6.283 * (mv < 0.05 ? 0 : 1.6 + 0.8 * run); /* passos de cachorro: trote ~1,6 Hz, galope ~2,4 Hz — a pata não vira hélice */
    legs.forEach((l, i) => { const o2 = run > 0.5 ? (l.front ? 0 : Math.PI * 0.85) + (i % 2) * 0.35 : [0, Math.PI, Math.PI, 0][i], sw = Math.sin(st.ph + o2) * spd, lift = Math.max(0, Math.cos(st.ph + o2)) * spd, A = 0.5 + 0.35 * run;
      if (l.front) { l.a.rotation.x = -sw * A + S2 * 0.1; l.b.rotation.x = lift * 0.9; } else { l.a.rotation.x = -sw * A * 0.9 + 0.15 - S2 * 1.35; l.b.rotation.x = -0.3 - lift * 0.5 + S2 * 1.7; } });
    body.position.y = H + Math.abs(Math.sin(st.ph * 2)) * 0.012 * spd + run * Math.max(0, Math.sin(st.ph)) * 0.03 - S2 * 0.12; body.rotation.x = -S2 * 0.55 + Math.sin(st.ph) * 0.05 * run;
    neck.rotation.x = -0.65 + S2 * 0.45; head.rotation.x = 0.65 - S2 * 0.35; head.rotation.y = S2 > 0.5 ? Math.sin(st.t * 0.5) * 0.4 : 0; head.rotation.z = S2 > 0.5 ? Math.sin(st.t * 0.31) * 0.12 : 0;
    st.pant = Math.abs(Math.sin(st.t * (mv > 1 ? 9 : 4))); jaw.rotation.x = 0.12 + st.pant * (mv > 1 ? 0.3 : 0.12); tongue.visible = mv > 0.6 || S2 > 0.5;
    tail.rotation.x = 0.6 - S2 * 0.4; tail.rotation.y = Math.sin(st.t * (S2 > 0.5 ? 6 : 10)) * (0.5 + 0.3 * spd); /* o rabinho abana o tempo todo */
  } };
}
