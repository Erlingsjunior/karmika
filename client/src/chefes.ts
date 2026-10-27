/* CHEFES E ELITES COM HISTÓRIA (Erling, 26/10: "a ratazana, a mãe-loba e os outros parecem sempre todos iguais. A aparência tem que ter
   a ver com a história, no tamanho, na movimentação e principalmente nas magias. Tudo precisa melhorar MUITO").

   Cada chefe e cada elite tem um KIT, achado pelo nome:
   - roupa: o corpo base (príncipe, bispo, morto-vivo, fera, rato…) ganha as peças da história dele (coroa de gelo do Jarl, véu da noiva
     Hemara, pena gigante do Copista, lanterna apagada do Capataz, bolsas de peste da Mãe-Ninhada), cor, olhos que brilham, aura no chão;
     o que é do corpo base e não combina (a foice e o círculo de runas do príncipe) some.
   - tamanho e jeito de andar: pisada que treme o chão (stomp), flutuar (hover), correria em arrancos (skitter), espreitar (prowl),
     cambalear (lurch).
   - magias próprias, cada uma com aviso no chão antes de bater (dá para ler e sair): cone, investida, salto, rosca (perto é seguro),
     chuva, linhas, rajada de projéteis, puxão, sumir e aparecer atrás, rugido que deixa lento, dreno (laço de sangue que se rompe
     com distância) e chamado de crias.
   As mecânicas antigas da masmorra (círculo, golpe pesado, poças, crias por vida, fúria) continuam: o kit soma em cima. */
import * as THREE from 'three';
import type { EnemyType } from './world';

type Gait = 'stomp' | 'hover' | 'skitter' | 'prowl' | 'lurch';
export type Spell =
  | { kind: 'cone'; name: string; col: number; every: number; k: number; r: number; deg: number }
  | { kind: 'charge'; name: string; col: number; every: number; k: number; len: number; w: number; trail?: number }
  | { kind: 'leap'; name: string; col: number; every: number; k: number; r: number }
  | { kind: 'donut'; name: string; col: number; every: number; k: number; r0: number; r1: number }
  | { kind: 'nova'; name: string; col: number; every: number; k: number; r: number }
  | { kind: 'meteor'; name: string; col: number; every: number; k: number; n: number; r: number }
  | { kind: 'lines'; name: string; col: number; every: number; k: number; n: number; len: number; w: number }
  | { kind: 'volley'; name: string; col: number; every: number; k: number; n: number; spread: number; sp: number }
  | { kind: 'pull'; name: string; col: number; every: number; k: number; r: number }
  | { kind: 'blink'; name: string; col: number; every: number; k: number }
  | { kind: 'roar'; name: string; col: number; every: number; k: number; r: number; slow: number }
  | { kind: 'drain'; name: string; col: number; every: number; k: number; r: number }
  | { kind: 'summon'; name: string; col: number; every: number; k: number; type: EnemyType; n: number; line: string }
  /** encanto (súcubo): dentro do círculo, os comandos se invertem por alguns segundos */
  | { kind: 'charm'; name: string; col: number; every: number; k: number; r: number; sec: number };
export interface Kit {
  body: 'biped' | 'quad';
  /** corpo próprio (gigante, espectro, nobre, corcunda): substitui o boneco base, que era igual para todos */ form?: Form;
  tint?: number; tintK?: number; eye?: number; aura?: number; gait?: Gait; speed?: number;
  /** partes do corpo base que não combinam com a história */ hide?: string[];
  look?(D: Dress): void;
  spells: Spell[];
  /** partículas que saem do corpo o tempo todo (peste, brasa, neve, tinta) */ fx?: { col: number; col2: number; up: number; rate: number; size?: number };
}
/* ---------------- peças (tudo em proporção ao corpo: H altura, F frente) ---------------- */
export interface Dress { g: THREE.Group; H: number; W: number; F: number; head: THREE.Vector3; add(o: THREE.Object3D, x: number, y: number, z: number): THREE.Object3D; arm(side: 'R' | 'L'): THREE.Object3D | null; orb(o: THREE.Object3D, r: number, y: number, sp: number): void; spin(o: THREE.Object3D, sp: number): void; flick(o: THREE.Object3D): void }
const toon = (c: number, em = 0) => new THREE.MeshToonMaterial({ color: c, emissive: em ? c : 0x000000, emissiveIntensity: em });
const glowM = (c: number, op = 0.9) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
const mesh = (geo: THREE.BufferGeometry, m: THREE.Material) => { const o = new THREE.Mesh(geo, m); o.castShadow = true; return o; };
const P = {
  crown(D: Dress, col: number, gem: number, s = 1) { const g = new THREE.Group(); const band = mesh(new THREE.CylinderGeometry(0.2 * s, 0.22 * s, 0.1 * s, 10, 1, true), toon(col, 0.25)); (band.material as THREE.Material).side = THREE.DoubleSide; g.add(band);
    for (let i = 0; i < 7; i++) { const a = (i / 7) * 6.283, sp = mesh(new THREE.ConeGeometry(0.035 * s, 0.17 * s, 4), toon(col, 0.25)); sp.position.set(Math.cos(a) * 0.2 * s, 0.11 * s, Math.sin(a) * 0.2 * s); g.add(sp); }
    const gm = mesh(new THREE.OctahedronGeometry(0.05 * s), glowM(gem)); gm.position.set(0, 0.03, 0.21 * s); g.add(gm); D.add(g, D.head.x, D.head.y + 0.18 * s, D.head.z); return g; },
  eyes(D: Dress, col: number, s = 1, dz = 0.12) { for (const x of [-1, 1]) { const e = mesh(new THREE.SphereGeometry(0.045 * s, 6, 5), glowM(col, 1)); D.add(e, D.head.x + x * 0.085 * s, D.head.y, D.head.z + dz * s); } },
  horns(D: Dress, col: number, len = 0.6, spread = 0.25, curl = 0.6) { for (const x of [-1, 1]) { const h = mesh(new THREE.ConeGeometry(0.07, len, 6), toon(col)); h.rotation.z = -x * curl; h.rotation.x = -0.35; D.add(h, D.head.x + x * spread, D.head.y + 0.15 + len * 0.3, D.head.z - 0.05); } },
  cape(D: Dress, col: number, len: number, w = 0.9, y = 0) { const g = new THREE.PlaneGeometry(w, len, 1, 6); g.translate(0, -len / 2, 0); const c = mesh(g, new THREE.MeshToonMaterial({ color: col, side: THREE.DoubleSide })); c.rotation.x = 0.12; D.add(c, 0, (y || D.H * 0.78), -D.W * 0.32); c.userData.cape = 1; return c; },
  lantern(parent: THREE.Object3D, col: number, lit: boolean, x = 0, y = 0, z = 0, s = 1) { const g = new THREE.Group(); const cage = mesh(new THREE.CylinderGeometry(0.11 * s, 0.13 * s, 0.26 * s, 6, 1, true), new THREE.MeshToonMaterial({ color: 0x2a2018, side: THREE.DoubleSide, wireframe: false }));
    const core = mesh(new THREE.SphereGeometry(0.08 * s, 8, 6), lit ? glowM(col, 1) : toon(0x302a22)); const top = mesh(new THREE.ConeGeometry(0.14 * s, 0.1 * s, 6), toon(0x2a2018)); top.position.y = 0.18 * s; g.add(cage, core, top); g.position.set(x, y, z); parent.add(g);
    if (lit) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ color: col, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); sp.scale.setScalar(0.9 * s); g.add(sp); sp.userData.flick = 1; } return g; },
  spikes(D: Dress, col: number, n: number, len: number, em = 0, quad = false) { for (let i = 0; i < n; i++) { const k = i / Math.max(1, n - 1), sp = mesh(new THREE.ConeGeometry(0.08 + len * 0.12, len * (0.7 + 0.5 * Math.sin(k * 3.14)), 5), em ? toon(col, em) : toon(col));
      if (quad) { sp.rotation.x = -0.5; D.add(sp, (i % 2 ? 0.07 : -0.07), D.H * 0.92, D.F * (0.6 - k * 1.3)); } else { sp.rotation.x = -1.1; D.add(sp, (k - 0.5) * D.W * 0.7, D.H * (0.55 + 0.25 * Math.sin(k * 3.14)), -D.W * 0.3); } } },
  sacs(D: Dress, col: number, n: number) { for (let i = 0; i < n; i++) { const s = mesh(new THREE.SphereGeometry(0.07 + Math.random() * 0.05, 8, 6), toon(col, 0.2)); D.add(s, (Math.random() - 0.5) * D.W * 0.9, D.H * (0.35 + Math.random() * 0.25), (Math.random() - 0.4) * D.F * 0.9); s.userData.pulse = Math.random() * 6; } },
  halo(D: Dress, col: number, r: number, y?: number) { const h = mesh(new THREE.TorusGeometry(r, r * 0.06, 6, 40), glowM(col, 0.85)); D.add(h, 0, y ?? D.H * 0.95, -D.W * 0.45); const disk = mesh(new THREE.CircleGeometry(r * 0.92, 32), glowM(col, 0.18)); h.add(disk); return h; },
  veil(D: Dress, col: number) { const g = new THREE.ConeGeometry(0.55, 1.7, 18, 1, true); g.translate(0, -0.85, 0); const v = mesh(g, new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.32, side: THREE.DoubleSide, depthWrite: false })); D.add(v, D.head.x, D.head.y + 0.3, D.head.z - 0.05); v.userData.sway = 1; return v; },
  blindfold(D: Dress, col: number) { const b = mesh(new THREE.TorusGeometry(0.21, 0.045, 6, 18), glowM(col, 0.95)); b.rotation.x = Math.PI / 2; D.add(b, D.head.x, D.head.y + 0.02, D.head.z); },
  pole(D: Dress, side: 'R' | 'L', len: number, col: number, head: (g: THREE.Group) => void, fallback: [number, number, number] = [0.55, 0.4, 0.2]) { const g = new THREE.Group(); const p = mesh(new THREE.CylinderGeometry(0.04, 0.045, len, 6), toon(col)); g.add(p); const h = new THREE.Group(); h.position.y = len / 2; g.add(h); head(h);
    const a = D.arm(side); if (a) { const hd = (a.userData.hand as THREE.Object3D | undefined); if (hd) { g.rotation.x = Math.PI / 2; g.position.z = 0.05; hd.add(g); } else { g.position.set(0, -0.9, 0.1); g.rotation.x = -1.0; a.add(g); } } else { g.rotation.z = side === 'R' ? -0.25 : 0.25; D.add(g, (side === 'R' ? 1 : -1) * D.W * fallback[0], D.H * fallback[1], D.F * fallback[2]); } return g; },
  orbit(D: Dress, make: () => THREE.Object3D, n: number, r: number, y: number, sp: number) { for (let i = 0; i < n; i++) { const o = make(); o.userData.ph = (i / n) * 6.283; D.orb(o, r, y, sp); } },
  page: () => { const m = mesh(new THREE.PlaneGeometry(0.28, 0.36), new THREE.MeshBasicMaterial({ color: 0xf2e8c8, side: THREE.DoubleSide })); return m; },
  book: (c: number) => () => { const g = new THREE.Group(); const b = mesh(new THREE.BoxGeometry(0.32, 0.44, 0.1), toon(c)); const pg = mesh(new THREE.BoxGeometry(0.28, 0.4, 0.11), toon(0xeee0c0)); pg.position.x = 0.03; g.add(b, pg); return g; },
  candle: () => { const g = new THREE.Group(); const c = mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.25, 6), toon(0xf0e6cc)); const f = mesh(new THREE.ConeGeometry(0.04, 0.12, 5), glowM(0xffc060, 1)); f.position.y = 0.18; f.userData.flick = 1; g.add(c, f); return g; },
  shard: (c: number) => () => { const m = mesh(new THREE.OctahedronGeometry(0.16), new THREE.MeshToonMaterial({ color: c, emissive: c, emissiveIntensity: 0.4, transparent: true, opacity: 0.9 })); m.scale.set(0.6, 1.6, 0.6); return m; },
  ember: (c: number) => () => mesh(new THREE.IcosahedronGeometry(0.12, 0), glowM(c, 1)),
  /** arco na mão esquerda (arqueiros mortos) */
  bow(D: Dress, col: number) { const g = new THREE.Group(); const cv = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, -0.5, 0), new THREE.Vector3(0, 0, 0.28), new THREE.Vector3(0, 0.5, 0)); g.add(mesh(new THREE.TubeGeometry(cv, 10, 0.02, 5), toon(col))); const str = mesh(new THREE.CylinderGeometry(0.004, 0.004, 1.0, 3), toon(0xe8e0c8)); g.add(str); const a = D.arm('L'); if (a) { g.position.set(0, -0.95, 0.12); a.add(g); } else D.add(g, -D.W * 0.45, D.H * 0.55, D.F * 0.3); return g; },
  /** asas de morcego (súcubo) */
  wings(D: Dress, col: number, s = 1) { for (const sd of [-1, 1]) { const w = mesh(new THREE.ConeGeometry(0.6 * s, 1.4 * s, 3), new THREE.MeshToonMaterial({ color: col, side: THREE.DoubleSide })); w.scale.z = 0.08; w.rotation.z = sd * 1.1; D.add(w, sd * D.W * 0.55, D.H * 0.72, -D.W * 0.3); w.userData.wing = sd; } },
  /** correntes que pendem (suplício, negociante) */
  chains(D: Dress, col: number, n: number) { for (let i = 0; i < n; i++) { const g = new THREE.Group(); for (let k = 0; k < 5; k++) { const l = mesh(new THREE.TorusGeometry(0.05, 0.015, 4, 8), toon(col)); l.position.y = -k * 0.08; l.rotation.y = k % 2 ? Math.PI / 2 : 0; g.add(l); } D.add(g, (i / Math.max(1, n - 1) - 0.5) * D.W * 0.8, D.H * (0.45 + (i % 2) * 0.15), D.F * 0.25); g.userData.sway = 1; } },
  ring(D: Dress, col: number, r: number) { const m = mesh(new THREE.RingGeometry(r * 0.82, r, 48), glowM(col, 0.5)); m.rotation.x = -Math.PI / 2; D.add(m, 0, 0.05, 0); m.userData.spin = 0.6; return m; },
  dots(D: Dress, col: number, n: number, ymin = 0.2, ymax = 0.9) { for (let i = 0; i < n; i++) { const d = mesh(new THREE.SphereGeometry(0.05 + Math.random() * 0.04, 5, 4), glowM(col, 1)); const a = Math.random() * 6.283; D.add(d, Math.cos(a) * D.W * 0.34, D.H * (ymin + Math.random() * (ymax - ymin)), Math.sin(a) * D.W * 0.3 + D.F * 0.05); d.userData.flick = 1; } },
  bones(D: Dress, n: number, y: number, r: number) { for (let i = 0; i < n; i++) { const a = (i / n) * 6.283, b = mesh(new THREE.CapsuleGeometry(0.035, 0.18, 3, 5), toon(0xe8dcc0)); b.rotation.z = Math.PI / 2; b.rotation.y = a; D.add(b, Math.cos(a) * r, y, Math.sin(a) * r); } },
  moss(D: Dress, col: number, n: number) { for (let i = 0; i < n; i++) { const m = mesh(new THREE.SphereGeometry(0.14 + Math.random() * 0.12, 6, 4), toon(col)); m.scale.y = 0.45; D.add(m, (Math.random() - 0.5) * D.W * 0.8, D.H * (0.3 + Math.random() * 0.6), (Math.random() - 0.5) * D.W * 0.6); } },
  shrooms(D: Dress, col: number, n: number) { for (let i = 0; i < n; i++) { const g = new THREE.Group(); const st = mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.14, 5), toon(0xe8dcc0)); const cap = mesh(new THREE.SphereGeometry(0.09, 7, 4, 0, 6.283, 0, 1.6), toon(col, 0.3)); cap.position.y = 0.08; g.add(st, cap); D.add(g, (Math.random() - 0.5) * D.W * 0.8, D.H * (0.35 + Math.random() * 0.55), (Math.random() - 0.5) * D.W * 0.5); } },
};
/* ---------------- CORPOS DE CHEFE (26/10: "precisa ser um monstro elite grande, não um agente de capa") ----------------
   Quatro corpos montados aqui, cada um com o seu jeito de mexer, e a cor e a cabeça de cada história:
   gigante (ombros enormes, pança, pernas curtas e grossas, cabeça baixa para a frente), espectro (sem pernas, farrapos que balançam,
   braços longos com garras), nobre (alto e magro, casaca, gola alta) e corcunda (torto, corcova, braços que arrastam). */
export interface Form { kind: 'giant' | 'wraith' | 'noble' | 'hunch'; skin: number; cloth: number; metal?: number; glow?: number; head: 'helm' | 'skull' | 'hood' | 'beast' | 'pale' | 'bare' | 'mask'; bulk?: number; claws?: boolean }
interface BodyRig { root: THREE.Group; mats: THREE.MeshToonMaterial[]; update(e: { state: string }, dt: number, windK: number, strikeK: number, hurtK: number, mv: number): void }
export function buildForm(f: Form): BodyRig {
  const root = new THREE.Group(), mats: THREE.MeshToonMaterial[] = [];
  const M = (c: number, em = 0) => { const m = toon(c, em); mats.push(m); return m; };
  const skin = M(f.skin), cloth = M(f.cloth), metal = M(f.metal ?? 0x6a6a72), dark = M(0x0c0a0e), bone = M(0xe0d4b8);
  const glow = f.glow !== undefined ? glowM(f.glow, 1) : null;
  const cap = (r: number, len: number, m: THREE.Material) => mesh(new THREE.CapsuleGeometry(r, len, 4, 10), m);
  const sph = (r: number, m: THREE.Material, sx = 1, sy = 1, sz = 1) => { const o = mesh(new THREE.SphereGeometry(r, 14, 10), m); o.scale.set(sx, sy, sz); return o; };
  const B = f.bulk ?? 1, giant = f.kind === 'giant', wraith = f.kind === 'wraith', noble = f.kind === 'noble', hunch = f.kind === 'hunch';
  const hipY = giant ? 1.05 : noble ? 1.35 : hunch ? 0.95 : 1.6;
  const pelvis = new THREE.Group(); pelvis.position.y = hipY; root.add(pelvis);
  const torso = new THREE.Group(); pelvis.add(torso);
  /* pernas */
  const legs: { hip: THREE.Group; knee: THREE.Group }[] = [];
  if (!wraith) for (const sd of [-1, 1]) { const hip = new THREE.Group(); hip.position.set(sd * (giant ? 0.38 : 0.2) * B, 0, 0); pelvis.add(hip);
    const tl = giant ? 0.42 : noble ? 0.55 : 0.4, th = cap((giant ? 0.24 : 0.13) * B, tl, noble ? cloth : giant ? cloth : skin); th.position.y = -tl / 2 - 0.08; hip.add(th);
    const knee = new THREE.Group(); knee.position.y = -tl - 0.16; hip.add(knee); const sl = giant ? 0.4 : noble ? 0.55 : 0.4, sh = cap((giant ? 0.21 : 0.11) * B, sl, giant ? skin : noble ? dark : skin); sh.position.y = -sl / 2 - 0.05; knee.add(sh);
    const ft = mesh(new THREE.BoxGeometry((giant ? 0.38 : 0.2) * B, 0.16, (giant ? 0.6 : 0.36) * B), giant ? metal : dark); ft.position.set(0, -sl - 0.15, 0.1); knee.add(ft); legs.push({ hip, knee }); }
  /* farrapos do espectro */
  const strips: THREE.Mesh[] = [];
  if (wraith) for (let i = 0; i < 9; i++) { const a = (i / 9) * 6.283, len = 1.3 + Math.random() * 0.5, g = new THREE.PlaneGeometry(0.42, len, 1, 4); g.translate(0, -len / 2, 0); const st = mesh(g, new THREE.MeshToonMaterial({ color: f.cloth, side: THREE.DoubleSide })); mats.push(st.material as THREE.MeshToonMaterial);
    st.position.set(Math.sin(a) * 0.42, 0.15, Math.cos(a) * 0.36); st.rotation.y = a; st.rotation.x = 0.12; st.userData.ph = Math.random() * 6; pelvis.add(st); strips.push(st); }
  /* tronco */
  if (giant) { { const bl = sph(0.62 * B, skin, 1.0, 0.85, 0.9); bl.position.set(0, 0.25, 0.12); torso.add(bl); } const ch = sph(0.68 * B, cloth, 1.25, 0.9, 0.85); ch.position.y = 0.9; torso.add(ch); const nk = cap(0.2 * B, 0.25, skin); nk.position.set(0, 1.5, 0.2); nk.rotation.x = 0.5; torso.add(nk);
    if (f.metal !== undefined) { const pl = sph(0.7 * B, metal, 1.15, 0.8, 0.55); pl.position.set(0, 1.0, 0.22); torso.add(pl); } const belt = mesh(new THREE.TorusGeometry(0.62 * B, 0.08, 6, 20), M(0x3a2618)); belt.rotation.x = Math.PI / 2; belt.position.y = 0.25; torso.add(belt); }
  else if (wraith) { const ch = sph(0.42, cloth, 1.1, 1.3, 0.8); ch.position.y = 0.6; torso.add(ch); const rib = mesh(new THREE.CylinderGeometry(0.3, 0.22, 0.6, 8, 1, true), bone); (rib.material as THREE.Material).side = THREE.DoubleSide; rib.position.y = 0.55; rib.scale.z = 0.7; torso.add(rib); }
  else if (noble) { const ch = cap(0.3, 0.7, cloth); ch.position.y = 0.6; ch.scale.z = 0.75; torso.add(ch); const coat = mesh(new THREE.CylinderGeometry(0.32, 0.55, 1.0, 12, 1, true), new THREE.MeshToonMaterial({ color: f.cloth, side: THREE.DoubleSide })); mats.push(coat.material as THREE.MeshToonMaterial); coat.position.y = -0.2; torso.add(coat);
    const vest = mesh(new THREE.BoxGeometry(0.28, 0.6, 0.05), M(0xc8b890)); vest.position.set(0, 0.55, 0.24); torso.add(vest); }
  else { const ch = sph(0.55 * B, cloth, 1.1, 0.95, 0.95); ch.position.set(0, 0.6, 0.15); torso.add(ch); const hump = sph(0.45 * B, skin, 1.1, 0.9, 1); hump.position.set(0.1, 1.0, -0.3); torso.add(hump); const bel = sph(0.45 * B, skin); bel.position.set(0, 0.2, 0.2); torso.add(bel); torso.rotation.x = 0.45; }
  /* ombros e braços */
  const shY = giant ? 1.35 : wraith ? 0.95 : noble ? 1.0 : 1.0, shX = giant ? 0.98 * B : wraith ? 0.48 : noble ? 0.38 : 0.62 * B;
  const arms: THREE.Group[] = [], elbows: THREE.Group[] = [];
  for (const sd of [-1, 1]) { const a = new THREE.Group(); a.position.set(sd * shX, shY, 0); a.name = sd > 0 ? 'armR' : 'armL'; torso.add(a);
    if (giant) { const pa = sph(0.36 * B, f.metal !== undefined ? metal : skin, 1.1, 0.8, 1); pa.position.y = 0.05; a.add(pa); if (f.metal !== undefined) for (let i = 0; i < 3; i++) { const sp = mesh(new THREE.ConeGeometry(0.07, 0.3, 5), metal); sp.position.set(sd * 0.1 + (i - 1) * 0.12, 0.3, 0); a.add(sp); } }
    if (noble) { const ep = mesh(new THREE.BoxGeometry(0.3, 0.06, 0.3), M(0xc8a040)); ep.position.y = 0.06; a.add(ep); }
    const ul = giant ? 0.5 : wraith ? 0.75 : noble ? 0.5 : 0.6, ur = (giant ? 0.22 : wraith ? 0.08 : noble ? 0.09 : 0.15) * B;
    const up = cap(ur, ul, giant || hunch ? skin : wraith ? cloth : cloth); up.position.y = -ul / 2 - 0.05; a.add(up);
    const el = new THREE.Group(); el.position.y = -ul - 0.12; a.add(el); elbows.push(el); const fl = giant ? 0.5 : wraith ? 0.85 : noble ? 0.5 : 0.75, fr = (giant ? 0.26 : wraith ? 0.07 : noble ? 0.08 : 0.17) * B;
    const fo = cap(fr, fl, giant ? (f.metal !== undefined ? metal : skin) : wraith ? bone : noble ? cloth : skin); fo.position.y = -fl / 2 - 0.04; el.add(fo);
    const hand = new THREE.Group(); hand.position.y = -fl - 0.16; el.add(hand); a.userData.hand = hand;
    hand.add(sph((giant ? 0.24 : wraith ? 0.08 : noble ? 0.08 : 0.16) * B, wraith ? bone : skin));
    if (f.claws || wraith) for (let i = 0; i < 4; i++) { const c = mesh(new THREE.ConeGeometry(0.03 * B * (giant ? 2 : 1), (wraith ? 0.4 : 0.28) * B, 4), bone); c.position.set((i - 1.5) * 0.05 * B * (giant ? 2 : 1), -0.16, 0.04); c.rotation.x = Math.PI + 0.3; hand.add(c); }
    arms.push(a); }
  /* pescoço e cabeça */
  const head = new THREE.Group(); head.name = 'head'; head.position.set(0, giant ? 1.82 : wraith ? 1.32 : noble ? 1.32 : 1.25, giant ? 0.35 : hunch ? 0.45 : 0.08); torso.add(head);
  const hr = giant ? 0.34 : 0.24;
  switch (f.head) {
    case 'helm': { head.add(sph(hr, skin)); const hl = mesh(new THREE.SphereGeometry(hr * 1.12, 14, 8, 0, 6.283, 0, 1.6), metal); hl.position.y = 0.04; head.add(hl); const ng = mesh(new THREE.BoxGeometry(0.06, 0.26, 0.06), metal); ng.position.set(0, -0.02, hr * 1.05); head.add(ng);
      const beard = mesh(new THREE.ConeGeometry(hr * 0.8, 0.55, 8), M(0x9a8a7a)); beard.rotation.x = Math.PI; beard.position.set(0, -0.35, hr * 0.6); head.add(beard); break; }
    case 'skull': { head.add(sph(hr, bone, 1, 1.05, 1.1)); const jaw = mesh(new THREE.BoxGeometry(hr * 1.1, hr * 0.5, hr * 0.9), bone); jaw.position.set(0, -hr * 0.85, hr * 0.25); head.add(jaw); for (const sd of [-1, 1]) { const so = sph(hr * 0.28, dark); so.position.set(sd * hr * 0.38, 0.02, hr * 0.88); head.add(so); } break; }
    case 'hood': { const hd = mesh(new THREE.ConeGeometry(hr * 1.5, hr * 3.2, 10), cloth); hd.position.y = hr * 0.6; head.add(hd); const fc = sph(hr * 0.85, dark, 1, 1.1, 0.6); fc.position.set(0, -0.02, hr * 0.62); head.add(fc); break; }
    case 'beast': { head.add(sph(hr, skin, 1.1, 0.95, 1.1)); const sn = mesh(new THREE.BoxGeometry(hr * 1.0, hr * 0.7, hr * 1.4), skin); sn.position.set(0, -0.08, hr * 1.0); head.add(sn); for (let i = 0; i < 4; i++) { const t = mesh(new THREE.ConeGeometry(0.03, 0.12, 4), bone); t.rotation.x = Math.PI; t.position.set((i - 1.5) * 0.08, -0.32, hr * 1.5); head.add(t); } break; }
    case 'pale': { head.add(sph(hr, skin, 0.92, 1.12, 1)); const hair = mesh(new THREE.SphereGeometry(hr * 1.05, 14, 8, 0, 6.283, 0, 1.4), M(0x0a0808)); hair.position.set(0, 0.05, -0.04); head.add(hair); for (const sd of [-1, 1]) { const ear = mesh(new THREE.ConeGeometry(0.05, 0.22, 4), skin); ear.rotation.z = -sd * 1.1; ear.position.set(sd * hr * 0.95, 0.04, 0); head.add(ear); } break; }
    case 'mask': { head.add(sph(hr, dark)); const mk = mesh(new THREE.CircleGeometry(hr * 0.95, 16), bone); mk.position.z = hr * 0.98; head.add(mk); break; }
    default: { head.add(sph(hr, skin, 1, 1.05, 1.05)); break; }
  }
  if (glow) { const core = mesh(new THREE.OctahedronGeometry(0.16), glow); core.position.set(0, giant ? 1.0 : 0.6, giant ? 0.85 : 0.4); torso.add(core); core.userData.flick = 1; }
  const st = { t: Math.random() * 10, ph: 0 };
  return { root, mats, update(e, dt, windK, strikeK, hurtK, mv) {
    st.t += dt; const walk = Math.min(1, mv / 2.2); st.ph += dt * (giant ? 4.2 : noble ? 6 : 5) * (0.35 + walk);
    const sw = Math.sin(st.ph) * walk;
    legs.forEach((L, i) => { const s2 = i ? -sw : sw; L.hip.rotation.x = s2 * (giant ? 0.5 : 0.6); L.knee.rotation.x = Math.max(0, -Math.sin(st.ph + (i ? Math.PI : 0)) * walk * 0.9); });
    pelvis.position.y = hipY + (wraith ? 0.25 + Math.sin(st.t * 1.8) * 0.15 : Math.abs(Math.sin(st.ph)) * walk * 0.07 - (giant ? walk * 0.04 : 0));
    torso.rotation.y = sw * (giant ? 0.12 : 0.08); const base = hunch ? 0.45 : giant ? 0.12 : 0.04; torso.rotation.x = base + walk * 0.08 - 0.35 * windK * windK + 0.45 * strikeK - 0.3 * hurtK; torso.rotation.z = hunch ? Math.sin(st.t * 1.4) * 0.06 : 0;
    const breathe = 1 + Math.sin(st.t * 2) * 0.02; torso.scale.set(breathe, 1, breathe);
    arms[0].rotation.x = -sw * 0.5 + (hunch ? 0.3 : 0); arms[1].rotation.x = sw * 0.5 + (hunch ? 0.3 : 0); arms[0].rotation.z = -(giant ? 0.25 : 0.12); arms[1].rotation.z = giant ? 0.25 : 0.12;
    elbows[0].rotation.x = -0.25 - (wraith ? 0.3 : 0); elbows[1].rotation.x = -0.25 - (wraith ? 0.3 : 0);
    if (windK > 0) { const k = windK * windK; arms[1].rotation.x = -2.8 * k; arms[0].rotation.x = -1.3 * k; elbows[1].rotation.x = -0.6 * k; if (giant || hunch) { arms[0].rotation.x = -2.6 * k; elbows[0].rotation.x = -0.6 * k; } }
    if (strikeK > 0) { const k = Math.min(1, strikeK * 1.4); arms[1].rotation.x = -2.8 + 3.5 * k; elbows[1].rotation.x = -0.1; if (giant || hunch) arms[0].rotation.x = -2.6 + 3.3 * k; }
    head.rotation.x = -0.1 * windK + 0.15 * hurtK + Math.sin(st.t * 0.9) * 0.04; head.rotation.y = Math.sin(st.t * 0.6) * 0.15;
    for (const s2 of strips) { s2.rotation.x = 0.15 + Math.sin(st.t * 2.4 + s2.userData.ph) * 0.18 + walk * 0.35; }
  } };
}

/* ---------------- os kits ---------------- */
const q = (o: Omit<Kit, 'body'>): Kit => ({ body: 'quad', ...o }), b = (o: Omit<Kit, 'body'>): Kit => ({ body: 'biped', ...o });
export const KITS: Record<string, Kit> = {
  /* ======== os três subsolos da Grande Biblioteca ======== */
  'O Copista Que Não Parou': b({ form: { kind: 'hunch', skin: 0x9a9ab0, cloth: 0x1a1a3a, head: 'bare', claws: true },  tint: 0x2a2c4a, tintK: 0.5, eye: 0x8ab8ff, gait: 'lurch', fx: { col: 0x1a1440, col2: 0x05040a, up: -0.6, rate: 10 },
    look(D) { P.pole(D, 'R', 1.6, 0xf2ead0, (h) => { const f = mesh(new THREE.ConeGeometry(0.16, 0.9, 4), toon(0xf6f0e0)); f.scale.z = 0.15; f.position.y = 0.4; h.add(f); });
      P.orbit(D, P.page, 7, D.W * 0.9, D.H * 0.6, 0.9); P.candle && D.add(P.candle(), D.head.x, D.head.y + 0.22, D.head.z); P.eyes(D, 0x8ab8ff); },
    spells: [{ kind: 'volley', name: 'Borrões de Tinta', col: 0x3a2aaa, every: 7, k: 0.8, n: 5, spread: 0.9, sp: 9 }, { kind: 'lines', name: 'Pautas que Cortam', col: 0x6a5aff, every: 12, k: 1.1, n: 4, len: 13, w: 1.5 }] }),
  'O Bibliotecário Cego': b({ form: { kind: 'wraith', skin: 0xd8d0c0, cloth: 0x3a3048, head: 'skull' },  tint: 0x3a3048, tintK: 0.35, gait: 'hover', hide: ['weapon'],
    look(D) { P.blindfold(D, 0xe8d8ff); P.lantern(D.arm('L') ?? D.g, 0xd8c8ff, true, 0, -1.0, 0.15, 1.3); P.orbit(D, P.book(0x5a2a2a), 6, D.W * 1.1, D.H * 0.55, 0.6); P.ring(D, 0x9a7aff, 3.2); },
    spells: [{ kind: 'pull', name: 'Shhh…', col: 0xb08aff, every: 13, k: 1.2, r: 14 }, { kind: 'meteor', name: 'Estantes que Caem', col: 0xc8a070, every: 10, k: 1.2, n: 4, r: 2.2 }, { kind: 'roar', name: 'Silêncio Absoluto', col: 0x8a6aff, every: 16, k: 0.4, r: 9, slow: 0.45 }] }),
  'A Sombra do Décimo': b({ form: { kind: 'wraith', skin: 0x1a1020, cloth: 0x0a0812, head: 'hood', glow: 0x9a6aff },  tint: 0x08060e, tintK: 0.8, eye: 0xc8a0ff, gait: 'hover', hide: ['weapon', 'horn'], fx: { col: 0x3a1a6a, col2: 0x000000, up: 0.9, rate: 18, size: 0.5 },
    look(D) { const h = P.halo(D, 0x9a6aff, D.H * 0.38); const lid = mesh(new THREE.TorusGeometry(D.H * 0.16, 0.06, 6, 24, Math.PI), glowM(0xffffff, 0.9)); lid.rotation.z = Math.PI; h.add(lid); P.orbit(D, P.shard(0x2a1a4a), 5, D.W * 1.1, D.H * 0.5, 1.4); },
    spells: [{ kind: 'blink', name: 'Entre as Páginas', col: 0x9a6aff, every: 9, k: 1.4 }, { kind: 'lines', name: 'O Olhar', col: 0xd8c0ff, every: 11, k: 1.3, n: 6, len: 15, w: 1.4 }, { kind: 'drain', name: 'Pálpebra Pesada', col: 0x8a3aff, every: 17, k: 0.35, r: 11 }] }),
  'Roedor de Pergaminho': q({ tint: 0xb89a6a, tintK: 0.4, eye: 0xffe08a, gait: 'skitter', look(D) { P.orbit(D, P.page, 4, D.W * 0.8, D.H * 0.8, 1.6); }, spells: [{ kind: 'charge', name: 'Rasgão', col: 0xffd070, every: 9, k: 1.1, len: 9, w: 1.4 }] }),
  'Guardião das Chaves': b({ tint: 0xb0a080, eye: 0x9ad7ff, gait: 'stomp', look(D) { P.lantern(D.g, 0xffd27a, true, D.W * 0.4, D.H * 0.45, D.F * 0.3, 1); P.bones(D, 6, D.H * 0.5, D.W * 0.32); }, spells: [{ kind: 'nova', name: 'Molho de Chaves', col: 0xffd27a, every: 10, k: 1.0, r: 4 }] }),
  'O Que Sussurra nas Lombadas': b({ tint: 0x3a2a5a, tintK: 0.5, eye: 0xc8a0ff, gait: 'skitter', look(D) { P.orbit(D, P.book(0x2a1a3a), 3, D.W * 0.9, D.H * 0.7, 1.2); }, spells: [{ kind: 'blink', name: 'Sussurro', col: 0xb08aff, every: 10, k: 1.1 }] }),

  /* ======== Toca das Ratazanas Rubras ======== */
  'Mãe-Ninhada': q({ tint: 0x6a2418, tintK: 0.55, eye: 0xff3a1a, gait: 'stomp', speed: 0.9, fx: { col: 0x7aff4a, col2: 0x1a3a10, up: -0.4, rate: 14 },
    look(D) { P.sacs(D, 0x7a9a3a, 9); P.spikes(D, 0x3a1a10, 7, 0.22, 0, true); P.bones(D, 6, D.H * 0.5, D.W * 0.4); P.ring(D, 0x6aff4a, 0.9); },
    spells: [{ kind: 'charge', name: 'Investida da Ninhada', col: 0xff4a3a, every: 11, k: 1.6, len: 14, w: 2.4, trail: 0x6aff4a }, { kind: 'cone', name: 'Hálito de Peste', col: 0x7aff4a, every: 9, k: 1.1, r: 9, deg: 70 }, { kind: 'summon', name: 'Filhotes', col: 0xff6a4a, every: 22, k: 0, type: 'rat', n: 4, line: 'A Mãe-Ninhada chia: mais filhotes saem das paredes!' }] }),
  'Ratazana Alfa': q({ tint: 0x8a2a1a, tintK: 0.5, eye: 0xff2a1a, gait: 'skitter', look(D) { P.spikes(D, 0x2a1008, 5, 0.18, 0, true); }, spells: [{ kind: 'charge', name: 'Bote da Alfa', col: 0xff4a3a, every: 8, k: 1.3, len: 9, w: 1.6 }] }),

  /* ======== Minas Afogadas ======== */
  'Capataz Sem Lanterna': b({ form: { kind: 'giant', skin: 0xa08870, cloth: 0x5a4a38, metal: 0x7a6a58, head: 'bare', bulk: 1.1 },  tint: 0x2a2620, tintK: 0.6, eye: 0xffb040, gait: 'stomp', hide: ['weapon', 'circle', 'glow'], fx: { col: 0x6a6050, col2: 0x1a1814, up: -0.5, rate: 8 },
    look(D) { const hel = mesh(new THREE.SphereGeometry(0.3, 10, 6, 0, 6.283, 0, 1.5), toon(0x8a6a2a)); D.add(hel, D.head.x, D.head.y + 0.1, D.head.z); P.lantern(hel, 0x302a22, false, 0, 0.12, 0.26, 0.8);
      P.pole(D, 'R', 2.0, 0x4a3020, (h) => { const pk = mesh(new THREE.TorusGeometry(0.42, 0.07, 5, 10, Math.PI * 0.9), toon(0x8a8a90)); pk.rotation.z = Math.PI * 0.55; h.add(pk); });
      const chain = mesh(new THREE.TorusGeometry(D.W * 0.4, 0.05, 4, 20), toon(0x5a5a60)); chain.rotation.x = 1.3; D.add(chain, 0, D.H * 0.55, 0); },
    spells: [{ kind: 'charge', name: 'Carrinho de Mina', col: 0xffb040, every: 12, k: 1.6, len: 15, w: 2.2 }, { kind: 'meteor', name: 'Desabamento', col: 0xa08a6a, every: 10, k: 1.3, n: 5, r: 2.4 }, { kind: 'roar', name: 'O Sino do Turno', col: 0xffd27a, every: 18, k: 0.5, r: 10, slow: 0.5 }] }),
  'Mineiro Afogado': b({ tint: 0x3a5a5a, tintK: 0.5, eye: 0x9ad7ff, gait: 'lurch', fx: { col: 0x9ad7ff, col2: 0x2a4a5a, up: -1, rate: 6 }, look(D) { P.lantern(D.g, 0x6ad0ff, true, D.W * 0.4, D.H * 0.5, D.F * 0.3, 0.9); }, spells: [{ kind: 'pull', name: 'Água nos Pulmões', col: 0x6ad0ff, every: 12, k: 0.8, r: 9 }] }),

  /* ======== Gruta do Fiorde ======== */
  'Jarl Afogado': b({ form: { kind: 'giant', skin: 0x6a9a9a, cloth: 0x1a3a3a, metal: 0x8aa8b8, head: 'helm', bulk: 1.05 },  tint: 0x2a5a6a, tintK: 0.55, eye: 0x9af0ff, gait: 'stomp', hide: ['weapon', 'circle', 'glow', 'hood'], fx: { col: 0xbfefff, col2: 0x3a7aaa, up: -0.8, rate: 12 },
    look(D) { P.crown(D, 0xbfe8ff, 0x6ad0ff, 1.6); P.horns(D, 0xd8d0c0, 0.7, 0.3, 0.9);
      P.pole(D, 'R', 2.2, 0x3a2a1a, (h) => { const ax = mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.06, 12, 1, false, 0, Math.PI), toon(0xa8c8d8, 0.15)); ax.rotation.z = Math.PI / 2; ax.position.y = -0.1; h.add(ax); });
      P.cape(D, 0x1a3a3a, D.H * 0.6, 1.6, D.head.y - 0.3); P.orbit(D, P.shard(0xbfefff), 6, D.W * 1.0, D.H * 0.35, 0.7); P.ring(D, 0x9ad7ff, 3.6); },
    spells: [{ kind: 'cone', name: 'Machado em Arco', col: 0x9ad7ff, every: 8, k: 1.5, r: 8, deg: 120 }, { kind: 'lines', name: 'Lanças de Gelo', col: 0xbfefff, every: 11, k: 1.3, n: 5, len: 14, w: 1.6 }, { kind: 'pull', name: 'A Maré que Puxa', col: 0x3a9aff, every: 16, k: 1.0, r: 15 }] }),
  'Lobo do Gelo Eterno': q({ tint: 0xdff4ff, tintK: 0.5, eye: 0x9af0ff, gait: 'prowl', fx: { col: 0xffffff, col2: 0x9ad7ff, up: 0.3, rate: 8 }, look(D) { P.spikes(D, 0xbfefff, 6, 0.22, 0.4, true); }, spells: [{ kind: 'cone', name: 'Bafo Gelado', col: 0x9ad7ff, every: 9, k: 1.0, r: 7, deg: 50 }] }),

  /* ======== Coração da Montanha ======== */
  'Senhor do Magma': b({ form: { kind: 'giant', skin: 0x4a2a1a, cloth: 0x2a1a14, metal: 0x5a3a2a, glow: 0xff6a10, head: 'beast', bulk: 1.25, claws: true },  tint: 0x1a1210, tintK: 0.75, eye: 0xffd040, gait: 'stomp', speed: 0.85, hide: ['weapon', 'circle', 'hood'], fx: { col: 0xffa030, col2: 0xff2a00, up: 2.2, rate: 26, size: 0.35 },
    look(D) { P.dots(D, 0xff6a10, 22, 0.15, 0.95); P.crown(D, 0x2a1a14, 0xff8a20, 1.8); P.spikes(D, 0x2a1a14, 7, 0.7, 0); P.orbit(D, P.ember(0xff7a20), 6, D.W * 1.2, D.H * 0.7, 1.1); P.ring(D, 0xff5a10, 4.2); },
    spells: [{ kind: 'meteor', name: 'Chuva de Brasa', col: 0xff6a20, every: 9, k: 1.3, n: 6, r: 2.4 }, { kind: 'leap', name: 'Queda da Montanha', col: 0xff8a30, every: 14, k: 1.8, r: 5 }, { kind: 'volley', name: 'Cuspe de Lava', col: 0xff5a10, every: 7, k: 0.9, n: 3, spread: 0.5, sp: 8 }] }),
  'Arauto da Brasa': b({ form: { kind: 'wraith', skin: 0x3a1a0a, cloth: 0x3a1a0a, head: 'mask', glow: 0xff8a30 },  tint: 0x3a1a0a, tintK: 0.5, eye: 0xffa040, gait: 'hover', fx: { col: 0xffa030, col2: 0xff3a00, up: 1.6, rate: 12 }, look(D) { P.halo(D, 0xff8a30, D.H * 0.25); }, spells: [{ kind: 'volley', name: 'Fagulhas do Arauto', col: 0xff7a20, every: 8, k: 0.9, n: 3, spread: 0.6, sp: 9 }] }),

  /* ======== Cripta do Conde ======== */
  'O Primogênito': b({ form: { kind: 'noble', skin: 0xeadcd8, cloth: 0x2a0a14, head: 'pale', claws: true },  tint: 0x1a0810, tintK: 0.6, eye: 0xff1a2a, gait: 'hover', hide: ['weapon', 'horn', 'circle'], fx: { col: 0xc41a2a, col2: 0x2a0008, up: -0.3, rate: 10 },
    look(D) { P.cape(D, 0x8a0a1a, D.H * 0.7, 1.1, D.head.y - 0.2); const collar = mesh(new THREE.ConeGeometry(0.42, 0.5, 10, 1, true), new THREE.MeshToonMaterial({ color: 0x5a0812, side: THREE.DoubleSide })); collar.rotation.x = Math.PI; D.add(collar, 0, D.head.y - 0.12, D.head.z - 0.12);
      for (const s of [-1, 1]) { const w = mesh(new THREE.ConeGeometry(0.7, 1.6, 3), new THREE.MeshToonMaterial({ color: 0x1a0a10, side: THREE.DoubleSide })); w.scale.z = 0.08; w.rotation.z = s * 1.1; D.add(w, s * D.W * 0.65, D.H * 0.75, -D.W * 0.3); w.userData.wing = s; }
      P.pole(D, 'R', 0.3, 0xc8a040, (h) => { const cup = mesh(new THREE.CylinderGeometry(0.12, 0.05, 0.2, 8), toon(0xd8b040, 0.3)); h.add(cup); const wine = mesh(new THREE.CircleGeometry(0.11, 10), glowM(0xc4101a, 1)); wine.rotation.x = -Math.PI / 2; wine.position.y = 0.09; h.add(wine); }); },
    spells: [{ kind: 'blink', name: 'Névoa Rubra', col: 0xc41a2a, every: 8, k: 1.5 }, { kind: 'drain', name: 'O Beijo do Primogênito', col: 0xff1a2a, every: 14, k: 0.45, r: 12 }, { kind: 'volley', name: 'Morcegos de Sangue', col: 0xc4101a, every: 9, k: 0.8, n: 6, spread: 1.4, sp: 10 }] }),
  'Mordomo do Conde': b({ tint: 0x2a2028, tintK: 0.5, eye: 0xff4a4a, gait: 'lurch', look(D) { P.pole(D, 'L', 0.2, 0xd8d0c0, (h) => { const tr = mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.03, 14), toon(0xd8d0c0)); h.add(tr); }); }, spells: [{ kind: 'volley', name: 'Talheres de Prata', col: 0xe8e8ff, every: 8, k: 0.8, n: 4, spread: 0.8, sp: 11 }] }),

  /* ======== Covil do Uivo Antigo ======== */
  'Lobo da Lua Velha': b({ tint: 0x9a9aa8, tintK: 0.55, eye: 0xf0f6ff, gait: 'prowl', speed: 1.1, fx: { col: 0xd8e4ff, col2: 0x6a7aaa, up: 0.5, rate: 6 },
    look(D) { P.halo(D, 0xe8eeff, D.H * 0.42, D.H * 1.0); P.bones(D, 9, D.H * 0.62, D.W * 0.36); P.spikes(D, 0x5a5a66, 6, 0.5, 0); P.ring(D, 0xd8d8ff, 3.8); },
    spells: [{ kind: 'leap', name: 'Salto da Lua', col: 0xd8e4ff, every: 9, k: 1.7, r: 4 }, { kind: 'roar', name: 'Uivo da Lua Velha', col: 0xb8c8ff, every: 15, k: 0.5, r: 12, slow: 0.5 }, { kind: 'charge', name: 'Corrida da Matilha', col: 0xffffff, every: 11, k: 1.4, len: 15, w: 2 }] }),
  'Beta da Lua': b({ tint: 0x6a6a78, tintK: 0.4, eye: 0xd8e4ff, gait: 'prowl', look(D) { P.bones(D, 5, D.H * 0.62, D.W * 0.34); }, spells: [{ kind: 'leap', name: 'Bote do Beta', col: 0xd8e4ff, every: 10, k: 1.3, r: 3 }] }),

  /* ======== criptas e mausoléus ======== */
  'Sacristão Sem Rosto': b({ form: { kind: 'wraith', skin: 0x1a1a1e, cloth: 0x1a1a1e, head: 'mask' },  tint: 0x1a1a1e, tintK: 0.6, gait: 'hover', hide: ['weapon', 'horn'],
    look(D) { const bell = mesh(new THREE.CylinderGeometry(0.15, 0.4, 0.55, 10, 1, true), new THREE.MeshToonMaterial({ color: 0xd8c8a0, side: THREE.DoubleSide })); const a = D.arm('R'); if (a) { bell.position.set(0, -1.05, 0.1); a.add(bell); } else D.add(bell, D.W * 0.5, D.H * 0.4, 0);
      P.orbit(D, P.candle, 5, D.W * 0.9, D.H * 0.4, 0.5); P.bones(D, 8, D.H * 0.45, D.W * 0.4); },
    spells: [{ kind: 'roar', name: 'Sino de Ossos', col: 0xd8c8a0, every: 12, k: 0.6, r: 9, slow: 0.5 }, { kind: 'donut', name: 'Badalada', col: 0xe8dcc0, every: 10, k: 1.2, r0: 3, r1: 8 }] }),
  'Guardião do Ossuário': b({ tint: 0xd8ccb0, eye: 0x9ad7ff, gait: 'stomp', look(D) { P.bones(D, 8, D.H * 0.55, D.W * 0.4); }, spells: [{ kind: 'nova', name: 'Pancada de Fêmur', col: 0xe8dcc0, every: 10, k: 1.0, r: 3.5 }] }),
  'Hemara, a Que Não Descansa': b({ form: { kind: 'wraith', skin: 0xe0d8ec, cloth: 0xeee8f6, head: 'pale' },  tint: 0xd8d0e8, tintK: 0.6, eye: 0xb07aff, gait: 'hover', hide: ['weapon', 'horn', 'circle', 'hood'], fx: { col: 0xd8c8ff, col2: 0x5a3a8a, up: 0.6, rate: 10 },
    look(D) { P.veil(D, 0xf4f0ff); P.crown(D, 0xd8d0e8, 0xb07aff, 1.1); P.pole(D, 'L', 0.35, 0x3a4a2a, (h) => { for (let i = 0; i < 6; i++) { const f = mesh(new THREE.SphereGeometry(0.07, 6, 4), toon(i % 2 ? 0x5a3a4a : 0x3a2a3a)); f.position.set((Math.random() - 0.5) * 0.2, 0.05 + Math.random() * 0.12, (Math.random() - 0.5) * 0.2); h.add(f); } });
      P.orbit(D, P.candle, 6, D.W * 1.1, D.H * 0.45, 0.4); P.ring(D, 0xb07aff, 3.4); },
    spells: [{ kind: 'pull', name: 'Venha Dançar', col: 0xd8c8ff, every: 12, k: 0.9, r: 14 }, { kind: 'donut', name: 'A Valsa', col: 0xb07aff, every: 10, k: 1.3, r0: 3, r1: 9 }, { kind: 'drain', name: 'Abraço da Noiva', col: 0x9a6aff, every: 17, k: 0.35, r: 10 }] }),
  'Noivo de Hemara': b({ tint: 0x2a2a3a, tintK: 0.4, eye: 0xb07aff, gait: 'lurch', look(D) { const f = mesh(new THREE.SphereGeometry(0.09, 6, 4), toon(0x8a1a2a)); D.add(f, -D.W * 0.2, D.H * 0.72, D.F * 0.35); }, spells: [{ kind: 'pull', name: 'Não Me Deixe', col: 0xb07aff, every: 11, k: 0.8, r: 9 }] }),
  'O Coveiro Real': b({ form: { kind: 'giant', skin: 0xb8a088, cloth: 0x6a5238, head: 'bare', bulk: 1.1, claws: true },  tint: 0x4a3a2a, tintK: 0.5, eye: 0xffd27a, gait: 'stomp', hide: ['weapon', 'circle', 'glow'], fx: { col: 0x8a6a3a, col2: 0x2a1a0a, up: -0.5, rate: 8 },
    look(D) { P.crown(D, 0xc8a040, 0xffd27a, 1.3).rotation.z = 0.25; P.pole(D, 'R', 2.6, 0x4a3020, (h) => { const bl = mesh(new THREE.BoxGeometry(0.5, 0.6, 0.05), toon(0x8a8a8a)); bl.position.y = 0.2; h.add(bl); }); P.lantern(D.arm('L') ?? D.g, 0xffd27a, true, 0, -1.0, 0.15, 1.1); P.moss(D, 0x5a4a2a, 6); },
    spells: [{ kind: 'lines', name: 'Covas Abertas', col: 0xd8c890, every: 10, k: 1.4, n: 3, len: 14, w: 2 }, { kind: 'leap', name: 'Pá no Chão', col: 0xc8a060, every: 13, k: 1.6, r: 4.5 }, { kind: 'meteor', name: 'Terra Jogada', col: 0x8a6a3a, every: 9, k: 1.1, n: 4, r: 2.2 }] }),
  'Comedor de Mortos': b({ tint: 0x5a6a3a, tintK: 0.4, eye: 0xd8ff6a, gait: 'skitter', look(D) { P.bones(D, 4, D.H * 0.4, D.W * 0.3); }, spells: [{ kind: 'drain', name: 'Mordida Faminta', col: 0x9aff4a, every: 12, k: 0.4, r: 7 }] }),
  'O Barão Maldito': b({ form: { kind: 'noble', skin: 0xc8b8c0, cloth: 0x2a0a1a, head: 'pale' },  tint: 0x2a0a1a, tintK: 0.6, eye: 0xff4a6a, gait: 'hover', hide: ['weapon', 'horn', 'hood'],
    look(D) { const hat = mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.55, 12), toon(0x0a0a0e)); const brim = mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.04, 16), toon(0x0a0a0e)); brim.position.y = -0.27; hat.add(brim); D.add(hat, D.head.x, D.head.y + 0.4, D.head.z);
      const mono = mesh(new THREE.TorusGeometry(0.06, 0.015, 4, 12), glowM(0xffd27a, 1)); D.add(mono, D.head.x + 0.09, D.head.y, D.head.z + 0.2); P.cape(D, 0x5a0a2a, D.H * 0.6, 1.0, D.head.y - 0.2); P.orbit(D, P.ember(0xffd27a), 5, D.W * 0.9, D.H * 0.55, 1.3); },
    spells: [{ kind: 'volley', name: 'Moedas Malditas', col: 0xffd27a, every: 7, k: 0.8, n: 5, spread: 1.0, sp: 10 }, { kind: 'blink', name: 'Saída de Cena', col: 0xc43a6a, every: 11, k: 1.2 }, { kind: 'cone', name: 'Maldição da Linhagem', col: 0xc43a3a, every: 12, k: 1.3, r: 8, deg: 80 }] }),
  'Herdeiro Podre': b({ tint: 0x4a3a4a, tintK: 0.4, eye: 0xff6a8a, gait: 'lurch', look(D) { P.crown(D, 0x8a7a3a, 0xff4a6a, 0.9); }, spells: [{ kind: 'cone', name: 'Herança', col: 0xc43a6a, every: 10, k: 1.0, r: 6, deg: 60 }] }),
  'O Eco da Garganta': b({ form: { kind: 'wraith', skin: 0x8a8aa0, cloth: 0x6a6a80, head: 'mask', glow: 0xc8b8ff },  tint: 0x8a8aa0, tintK: 0.6, eye: 0xd8d0ff, gait: 'hover', hide: ['weapon', 'horn'], fx: { col: 0xc8c0ff, col2: 0x3a3a5a, up: 0.4, rate: 8 },
    look(D) { for (let i = 0; i < 3; i++) { const r = P.halo(D, 0xc8b8ff, D.H * (0.2 + i * 0.12), D.H * 0.7); r.userData.pulse = i * 2; } P.orbit(D, P.shard(0x8a8aa0), 6, D.W * 1.0, D.H * 0.4, 0.8); },
    spells: [{ kind: 'nova', name: 'Grito', col: 0xc8b8ff, every: 9, k: 1.1, r: 4 }, { kind: 'donut', name: 'O Eco Volta', col: 0xa898ff, every: 9, k: 1.2, r0: 4, r1: 9 }, { kind: 'lines', name: 'Rachaduras', col: 0x9a8aff, every: 13, k: 1.1, n: 4, len: 12, w: 1.3 }] }),
  'Sentinela de Ossos': b({ tint: 0xd8ccb0, eye: 0xff8a4a, gait: 'stomp', look(D) { P.spikes(D, 0xe8dcc0, 5, 0.45); }, spells: [{ kind: 'charge', name: 'Lança de Osso', col: 0xffd27a, every: 10, k: 1.2, len: 10, w: 1.2 }] }),

  /* ======== cavernas ======== */
  'Lobo Cinzento': b({ tint: 0x6a6a70, tintK: 0.5, eye: 0xffd24a, gait: 'prowl', speed: 1.1, look(D) { P.spikes(D, 0x4a4a50, 5, 0.4); }, spells: [{ kind: 'leap', name: 'Bote do Lobo Cinzento', col: 0xffd24a, every: 9, k: 1.4, r: 3 }, { kind: 'roar', name: 'Rosnado', col: 0xd8c8a0, every: 15, k: 0.3, r: 8, slow: 0.4 }] }),
  'Lobo de Guarda': q({ tint: 0x5a4a3a, tintK: 0.4, eye: 0xffd24a, gait: 'prowl', look(D) { const col = mesh(new THREE.TorusGeometry(0.28, 0.06, 5, 14), toon(0x6a4a2a)); col.rotation.x = 1.2; D.add(col, 0, D.H * 0.75, D.F * 0.55); }, spells: [{ kind: 'charge', name: 'Investida', col: 0xffd24a, every: 9, k: 1.1, len: 8, w: 1.4 }] }),
  'Mãe do Gelo': q({ tint: 0xeaf8ff, tintK: 0.6, eye: 0x6ad0ff, gait: 'prowl', fx: { col: 0xffffff, col2: 0xbfe4ff, up: 0.5, rate: 18, size: 0.4 },
    look(D) { P.spikes(D, 0xbfefff, 9, 0.3, 0.5, true); P.orbit(D, P.shard(0xdff4ff), 5, D.W * 0.8, D.H * 0.9, 0.9); P.ring(D, 0x9ad7ff, 1.0); },
    spells: [{ kind: 'cone', name: 'Sopro da Mãe do Gelo', col: 0x9ad7ff, every: 8, k: 1.3, r: 10, deg: 60 }, { kind: 'lines', name: 'Garras de Gelo', col: 0xbfefff, every: 11, k: 1.2, n: 3, len: 12, w: 1.6 }, { kind: 'roar', name: 'Nevasca', col: 0xdff4ff, every: 16, k: 0.3, r: 11, slow: 0.5 }, { kind: 'summon', name: 'Filhotes do Gelo', col: 0x9ad7ff, every: 24, k: 0, type: 'frostwolf', n: 2, line: 'A Mãe do Gelo uiva: dois filhotes saem da neve!' }] }),
  'Lobo Branco': q({ tint: 0xf4fbff, tintK: 0.5, eye: 0x6ad0ff, gait: 'prowl', look(D) { P.spikes(D, 0xdff4ff, 4, 0.18, 0.3, true); }, spells: [{ kind: 'cone', name: 'Bafo Branco', col: 0x9ad7ff, every: 9, k: 0.9, r: 6, deg: 45 }] }),
  'O Que Bebe o Brejo': b({ form: { kind: 'hunch', skin: 0x4a6a3a, cloth: 0x2a3a1a, head: 'beast', bulk: 1.25, claws: true },  tint: 0x3a5a2a, tintK: 0.6, eye: 0xd8ff4a, gait: 'lurch', speed: 0.85, fx: { col: 0x7aff6a, col2: 0x1a3a10, up: -0.6, rate: 14 },
    look(D) { P.moss(D, 0x4a6a2a, 10); P.shrooms(D, 0x9aff6a, 5); P.sacs(D, 0x6a8a3a, 4); },
    spells: [{ kind: 'pull', name: 'Sucção do Brejo', col: 0x7aff6a, every: 11, k: 1.0, r: 14 }, { kind: 'volley', name: 'Cuspe de Lodo', col: 0x6aaa3a, every: 7, k: 0.8, n: 4, spread: 0.8, sp: 8 }] }),
  'Afogado do Brejo': b({ tint: 0x3a5a3a, tintK: 0.5, eye: 0xd8ff4a, gait: 'lurch', look(D) { P.moss(D, 0x4a6a2a, 5); }, spells: [{ kind: 'pull', name: 'Mão do Lodo', col: 0x7aff6a, every: 11, k: 0.7, r: 8 }] }),
  'Rei do Túmulo': b({ form: { kind: 'giant', skin: 0xd8ccb0, cloth: 0x3a3a50, metal: 0x7a7a86, head: 'skull', claws: true },  tint: 0x3a3a44, tintK: 0.5, eye: 0x6ad0ff, gait: 'stomp', hide: ['weapon', 'circle', 'glow', 'hood'], fx: { col: 0x6ad0ff, col2: 0x1a2a4a, up: 0.4, rate: 6 },
    look(D) { P.crown(D, 0xe8dcc0, 0x6ad0ff, 1.5); P.cape(D, 0x2a2a3a, D.H * 0.6, 1.6, D.head.y - 0.3); P.pole(D, 'R', 1.8, 0x5a5048, (h) => { const bl = mesh(new THREE.BoxGeometry(0.12, 1.2, 0.03), toon(0x9a9a8a)); bl.position.y = 0.5; h.add(bl); }); P.bones(D, 8, D.H * 0.6, D.W * 0.38); },
    spells: [{ kind: 'charge', name: 'Carga do Rei', col: 0x6ad0ff, every: 11, k: 1.5, len: 14, w: 2 }, { kind: 'roar', name: 'De Joelhos!', col: 0x9ad7ff, every: 15, k: 0.5, r: 10, slow: 0.5 }, { kind: 'lines', name: 'Espadas da Guarda', col: 0xbfd8ff, every: 12, k: 1.2, n: 4, len: 12, w: 1.3 }] }),
  'Draugr Antigo': b({ tint: 0x5a6a6a, tintK: 0.4, eye: 0x6ad0ff, gait: 'stomp', look(D) { P.horns(D, 0xd8d0c0, 0.4, 0.2, 0.7); }, spells: [{ kind: 'nova', name: 'Frio da Cova', col: 0x6ad0ff, every: 10, k: 1.0, r: 3.5 }] }),
  'Diabrete da Fornalha Velha': b({ tint: 0x2a1a14, tintK: 0.5, eye: 0xffb040, gait: 'skitter', fx: { col: 0xffa040, col2: 0xff3a00, up: 1.8, rate: 14 },
    look(D) { const ch = mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.45, 8), toon(0x3a2a22)); D.add(ch, D.head.x, D.head.y + 0.35, D.head.z); P.dots(D, 0xff7a20, 10); },
    spells: [{ kind: 'volley', name: 'Fagulhas', col: 0xffa040, every: 6, k: 0.8, n: 4, spread: 0.9, sp: 10 }, { kind: 'blink', name: 'Pela Chaminé', col: 0xff7a20, every: 10, k: 1.0 }] }),
  'Rato das Galerias': q({ tint: 0x5a4a3a, tintK: 0.4, eye: 0xffb040, gait: 'skitter', look(D) { P.dots(D, 0xff8a30, 4, 0.5, 0.9); }, spells: [{ kind: 'charge', name: 'Corrida no Escuro', col: 0xffb040, every: 9, k: 1.0, len: 8, w: 1.2 }] }),
  'Raiz Doente': b({ tint: 0x4a2a3a, tintK: 0.55, eye: 0xd8ff4a, gait: 'lurch', fx: { col: 0x9aff6a, col2: 0x3a1a2a, up: -0.6, rate: 10 },
    look(D) { P.shrooms(D, 0xb06aff, 7); P.moss(D, 0x3a2a3a, 5); P.ring(D, 0x9aff6a, 3); },
    spells: [{ kind: 'lines', name: 'Raízes que Rompem', col: 0x9aff6a, every: 9, k: 1.1, n: 4, len: 11, w: 1.4 }, { kind: 'pull', name: 'Raiz que Agarra', col: 0x6aaa3a, every: 13, k: 0.8, r: 11 }] }),
  /* ======== A NOVA SAFRA (26/10): o corpo, o jeito e as magias de cada um ======== */
  'Chefe dos Salteadores': b({ tint: 0x6a2a1a, tintK: 0.35, eye: 0xffb040, gait: 'stomp', look(D) { P.cape(D, 0x5a1a10, D.H * 0.55, 0.9, D.head.y - 0.25); P.crown(D, 0x8a6a2a, 0xffb040, 0.8).rotation.z = 0.3; },
    spells: [{ kind: 'charge', name: 'Investida do Chefe', col: 0xffb040, every: 10, k: 1.3, len: 9, w: 1.6 }, { kind: 'roar', name: 'Grito de Guerra', col: 0xffd070, every: 16, k: 0.3, r: 8, slow: 0.6 }, { kind: 'summon', name: 'A Quadrilha', col: 0xffb040, every: 26, k: 0, type: 'bandit', n: 2, line: 'O Chefe assobia: dois salteadores pulam do mato!' }] }),
  'Caveira Flamejante': b({ gait: 'hover', fx: { col: 0xffa040, col2: 0xff3a00, up: 1.4, rate: 10 }, spells: [] }),
  'Caveira Gélida': b({ gait: 'hover', fx: { col: 0xe8f8ff, col2: 0x6ad0ff, up: 0.8, rate: 10 }, spells: [{ kind: 'roar', name: 'Sopro Gélido', col: 0x9ad7ff, every: 12, k: 0.4, r: 5, slow: 0.5 }] }),
  'Arqueiro Esquelético': b({ tint: 0xe8e0c8, look(D) { P.bow(D, 0x4a3420); }, spells: [{ kind: 'volley', name: 'Rajada de Flechas', col: 0xe8dcc0, every: 9, k: 0.6, n: 3, spread: 0.5, sp: 14 }] }),
  'Draugr Arqueiro': b({ tint: 0x6a7a7a, tintK: 0.4, look(D) { P.bow(D, 0x3a3028); }, spells: [{ kind: 'volley', name: 'Flechas do Fiorde', col: 0x9ad7ff, every: 9, k: 0.65, n: 3, spread: 0.5, sp: 14 }] }),
  'Draugr Berserker': b({ tint: 0x4a5a5a, tintK: 0.45, gait: 'skitter', fx: { col: 0x9ad7ff, col2: 0x2a3a4a, up: 0.5, rate: 5 }, look(D) { P.bones(D, 4, D.H * 0.5, D.W * 0.32); }, spells: [{ kind: 'leap', name: 'Fúria do Fiorde', col: 0x9ad7ff, every: 9, k: 1.3, r: 3 }] }),
  'Cavaleiro Sem Cabeça': q({ gait: 'prowl', fx: { col: 0x6ab8ff, col2: 0x1a2a6a, up: 1.2, rate: 6 }, spells: [{ kind: 'charge', name: 'Carga da Meia-Noite', col: 0x6ab8ff, every: 8, k: 1.6, len: 16, w: 2.2, trail: 0x2a6aff }, { kind: 'roar', name: 'O Riso Sem Boca', col: 0x9ad7ff, every: 16, k: 0.3, r: 9, slow: 0.5 }] }),
  'Necromante do Campo Santo': b({ form: { kind: 'wraith', skin: 0xd8d0c0, cloth: 0x1a1428, head: 'hood', glow: 0x9a6aff }, tint: 0x1a1428, tintK: 0.5, eye: 0xb08aff, gait: 'hover', hide: ['weapon', 'horn'], fx: { col: 0x9a6aff, col2: 0x1a0a3a, up: 0.5, rate: 8 },
    look(D) { P.pole(D, 'R', 1.8, 0x3a2a2a, (h) => { const sk = mesh(new THREE.SphereGeometry(0.13, 8, 6), toon(0xe8dcc0)); h.add(sk); const gl = mesh(new THREE.SphereGeometry(0.05, 6, 4), glowM(0x9a6aff, 1)); gl.position.z = 0.1; h.add(gl); }); P.orbit(D, P.ember(0x9a6aff), 4, D.W * 0.8, D.H * 0.6, 1.2); P.ring(D, 0x9a6aff, 2.6); },
    spells: [{ kind: 'summon', name: 'Levanta-te', col: 0x9a6aff, every: 14, k: 0, type: 'skeleton', n: 3, line: 'O Necromante ergue o cajado: a terra do Campo Santo se abre!' }, { kind: 'drain', name: 'Colheita de Vida', col: 0x9a6aff, every: 15, k: 0.35, r: 10 }, { kind: 'blink', name: 'Passo de Cova', col: 0x6a3aff, every: 12, k: 1.0 }] }),
  'Lich dos Esquecidos': b({ form: { kind: 'wraith', skin: 0xd8ccb0, cloth: 0x14101e, head: 'skull', glow: 0x6ad0ff }, tint: 0x14101e, tintK: 0.6, eye: 0x6ad0ff, gait: 'hover', hide: ['weapon', 'horn', 'hood'], fx: { col: 0x6ad0ff, col2: 0x0a1a3a, up: 0.6, rate: 12 },
    look(D) { P.crown(D, 0x8a8aa0, 0x6ad0ff, 1.3); P.cape(D, 0x14101e, D.H * 0.7, 1.2, D.head.y - 0.2); P.orbit(D, P.book(0x1a1430), 3, D.W * 1.0, D.H * 0.7, 0.8); P.ring(D, 0x6ad0ff, 3.4); },
    spells: [{ kind: 'meteor', name: 'Chuva de Almas', col: 0x6ad0ff, every: 9, k: 1.2, n: 5, r: 2.2 }, { kind: 'summon', name: 'Os Esquecidos', col: 0x6ad0ff, every: 18, k: 0, type: 'skull_frost', n: 3, line: 'O Lich abre o livro: as caveiras dos esquecidos acordam em chamas frias!' }, { kind: 'lines', name: 'Correntes da Cripta', col: 0x9ad7ff, every: 12, k: 1.2, n: 4, len: 13, w: 1.4 }, { kind: 'drain', name: 'Filactério', col: 0x6ad0ff, every: 20, k: 0.4, r: 12 }] }),
  'Súcubo das Cinzas': b({ form: { kind: 'noble', skin: 0xd88a8a, cloth: 0x3a0a1a, head: 'pale', claws: true }, tint: 0x3a0a1a, tintK: 0.4, eye: 0xff6ad8, gait: 'hover', hide: ['weapon', 'hood'], fx: { col: 0xff6ad8, col2: 0x3a0a2a, up: 0.4, rate: 6 },
    look(D) { P.horns(D, 0x1a0a10, 0.4, 0.16, 0.9); P.wings(D, 0x2a0a14, 0.9); P.orbit(D, P.ember(0xff6ad8), 3, D.W * 0.7, D.H * 0.55, 1.6); },
    spells: [{ kind: 'charm', name: 'Beijo das Cinzas', col: 0xff6ad8, every: 13, k: 0.4, r: 6, sec: 3 }, { kind: 'blink', name: 'Passo de Seda', col: 0xff6ad8, every: 10, k: 1.0 }, { kind: 'drain', name: 'Fome Doce', col: 0xff4a9a, every: 16, k: 0.35, r: 9 }] }),
  'Cão Infernal': q({ eye: 0xffb040, gait: 'prowl', fx: { col: 0xff8a20, col2: 0x3a0a00, up: 1.0, rate: 10 }, look(D) { P.spikes(D, 0x1a0a08, 5, 0.25, 0.4, true); }, spells: [{ kind: 'charge', name: 'Rastro de Fogo', col: 0xff6a20, every: 9, k: 1.1, len: 10, w: 1.4, trail: 0xff4a10 }] }),
  'Demônio da Gula': b({ form: { kind: 'giant', skin: 0x8a3a2a, cloth: 0x3a1a10, head: 'beast', bulk: 1.5, claws: true }, tint: 0x5a1a10, tintK: 0.4, eye: 0xffd040, gait: 'stomp', speed: 0.9, hide: ['weapon', 'circle'], fx: { col: 0x9aff4a, col2: 0x2a3a10, up: -0.4, rate: 8 },
    look(D) { P.sacs(D, 0x9a5a3a, 6); P.horns(D, 0x2a1a10, 0.5, 0.25, 0.4); },
    spells: [{ kind: 'pull', name: 'Bocarra', col: 0x9aff4a, every: 11, k: 1.4, r: 14 }, { kind: 'nova', name: 'Arroto Pestilento', col: 0x8aff3a, every: 9, k: 1.1, r: 5 }, { kind: 'drain', name: 'Banquete', col: 0xffa040, every: 18, k: 0.4, r: 10 }] }),
  'Pactário Quebrado': b({ form: { kind: 'wraith', skin: 0x3a2a4a, cloth: 0x1a0a20, head: 'mask', glow: 0x6a2aff }, tint: 0x1a0a20, tintK: 0.55, eye: 0x9a6aff, gait: 'hover', hide: ['weapon', 'horn'], fx: { col: 0x6a2aff, col2: 0x000000, up: 0.3, rate: 10 },
    look(D) { P.orbit(D, P.shard(0x3a1a5a), 5, D.W * 0.9, D.H * 0.5, 1.0); P.ring(D, 0x6a2aff, 2.4); },
    spells: [{ kind: 'drain', name: 'A Dívida', col: 0x6a2aff, every: 12, k: 0.45, r: 11 }, { kind: 'lines', name: 'Cláusulas', col: 0x9a6aff, every: 11, k: 1.1, n: 3, len: 11, w: 1.3 }] }),
  'Senhor do Suplício': b({ form: { kind: 'giant', skin: 0x5a1a14, cloth: 0x1a0a08, metal: 0x3a3a40, head: 'beast', bulk: 1.3, claws: true, glow: 0xff3a1a }, tint: 0x2a0a08, tintK: 0.6, eye: 0xff2a1a, gait: 'stomp', speed: 0.9, hide: ['weapon', 'circle'], fx: { col: 0xff3a1a, col2: 0x1a0000, up: 0.6, rate: 10 },
    look(D) { P.horns(D, 0x1a0a08, 0.8, 0.3, 0.5); P.chains(D, 0x5a5a62, 6); P.ring(D, 0xff2a1a, 4.4); },
    spells: [{ kind: 'roar', name: 'Correntes do Suplício', col: 0xff3a1a, every: 12, k: 0.6, r: 10, slow: 0.08 }, { kind: 'lines', name: 'Ganchos', col: 0xc41a1a, every: 10, k: 1.4, n: 5, len: 14, w: 1.4 }, { kind: 'leap', name: 'O Peso da Culpa', col: 0xff4a2a, every: 14, k: 1.8, r: 4.5 }, { kind: 'pull', name: 'Vem Pagar', col: 0xff2a1a, every: 16, k: 1.2, r: 15 }] }),
  'Aranha Tecelã': q({ gait: 'skitter', spells: [{ kind: 'roar', name: 'Teia', col: 0xe8e8f0, every: 11, k: 0.2, r: 4.5, slow: 0.15 }] }),
  'Aranha Filhote': q({ gait: 'skitter', spells: [] }),
  'Aracnídea-Mãe': q({ eye: 0xff2a1a, gait: 'stomp', speed: 0.9, fx: { col: 0x9aff6a, col2: 0x1a2a10, up: -0.5, rate: 8 },
    look(D) { P.ring(D, 0xff2a1a, 3.2); },
    spells: [{ kind: 'summon', name: 'A Ninhada Sem Fim', col: 0xff3a1a, every: 9, k: 0, type: 'spiderling', n: 10, line: 'A Aracnídea-Mãe treme o abdômen: cem filhotes escorrem das bolsas!' }, { kind: 'roar', name: 'Teia da Mãe', col: 0xf0f0f8, every: 14, k: 0.4, r: 11, slow: 0.12 }, { kind: 'volley', name: 'Cuspe Ácido', col: 0x9aff4a, every: 8, k: 0.8, n: 5, spread: 1.0, sp: 9 }, { kind: 'leap', name: 'O Peso da Mãe', col: 0xff3a1a, every: 15, k: 1.8, r: 5 }] }),
  'Urso das Cavernas': q({ eye: 0xffb040, gait: 'stomp', look(D) { P.bones(D, 5, D.H * 0.4, D.W * 0.5); }, spells: [{ kind: 'roar', name: 'Rugido da Caverna', col: 0xd8c8a0, every: 15, k: 0.4, r: 9, slow: 0.5 }, { kind: 'leap', name: 'Patada', col: 0xffb040, every: 10, k: 1.5, r: 3.5 }] }),
  'Cobra Gigante': q({ eye: 0xffd040, gait: 'prowl', spells: [{ kind: 'charge', name: 'Bote da Gigante', col: 0xffd040, every: 9, k: 1.5, len: 11, w: 1.8 }, { kind: 'cone', name: 'Peçonha', col: 0x9aff4a, every: 12, k: 1.0, r: 7, deg: 50 }] }),
  'Serpente do Brejo': q({ gait: 'prowl', spells: [{ kind: 'cone', name: 'Cuspe de Peçonha', col: 0x9aff4a, every: 11, k: 0.7, r: 5, deg: 40 }] }),
  'Fungo Caminhante': b({ gait: 'lurch', fx: { col: 0x9aff6a, col2: 0x3a1a3a, up: 0.4, rate: 6 }, spells: [{ kind: 'nova', name: 'Esporos', col: 0x9aff6a, every: 12, k: 0.8, r: 3.5 }] }),
  'Fada Rainha': b({ eye: 0xffe0ff, gait: 'hover', fx: { col: 0xffd8ff, col2: 0xb07aff, up: -0.3, rate: 14 }, look(D) { P.orbit(D, P.ember(0xffb8ff), 6, D.W * 1.2, D.H * 0.6, 1.4); P.ring(D, 0xff9ad8, 2.2); },
    spells: [{ kind: 'summon', name: 'Corte das Fadas', col: 0xff9ad8, every: 14, k: 0, type: 'fairy', n: 4, line: 'A Fada Rainha bate as asas: a corte inteira desce do céu!' }, { kind: 'volley', name: 'Pó de Estrelas', col: 0xffd8ff, every: 7, k: 0.8, n: 5, spread: 1.2, sp: 10 }, { kind: 'blink', name: 'Num Piscar', col: 0xff9ad8, every: 10, k: 1.1 }, { kind: 'charm', name: 'Encanto da Rainha', col: 0xffb8ff, every: 16, k: 0.2, r: 6, sec: 3 }] }),
  'Ent, Mestre da Mata': b({ tint: 0x3a2a1a, tintK: 0.3, eye: 0xd8ff6a, gait: 'stomp', speed: 0.85, fx: { col: 0x9aff6a, col2: 0x2a3a10, up: -0.4, rate: 8 }, look(D) { P.moss(D, 0x4a6a2a, 14); P.shrooms(D, 0xffd070, 6); P.ring(D, 0x9aff6a, 5); },
    spells: [{ kind: 'lines', name: 'Raízes do Mundo', col: 0x9aff6a, every: 10, k: 1.4, n: 5, len: 16, w: 1.6 }, { kind: 'leap', name: 'O Passo da Floresta', col: 0x6ad04a, every: 13, k: 1.9, r: 5 }, { kind: 'pull', name: 'Abraço do Carvalho', col: 0x6aaa3a, every: 15, k: 1.2, r: 15 }, { kind: 'summon', name: 'A Mata Acorda', col: 0x9aff6a, every: 22, k: 0, type: 'treant', n: 2, line: 'O Ent bate o tronco no chão: duas árvores arrancam as raízes e vêm!' }] }),
  'Troll das Pedras': b({ form: { kind: 'giant', skin: 0x6a7a6a, cloth: 0x3a3a30, head: 'beast', bulk: 1.3, claws: true }, tint: 0x4a5a4a, tintK: 0.4, eye: 0xffd040, gait: 'stomp', hide: ['weapon', 'circle'], look(D) { P.moss(D, 0x5a6a4a, 8); }, spells: [{ kind: 'leap', name: 'Pedrada', col: 0xb8a888, every: 11, k: 1.5, r: 3.5 }, { kind: 'meteor', name: 'Chuva de Pedras', col: 0x9a8a7a, every: 13, k: 1.0, n: 3, r: 2 }] }),
  'Harpia': b({ eye: 0xffd040, gait: 'hover', spells: [{ kind: 'charge', name: 'Rasante', col: 0xffd8a0, every: 9, k: 1.2, len: 12, w: 1.6 }] }),
  'Jotun Menor': b({ form: { kind: 'giant', skin: 0x8ab0c8, cloth: 0x2a3a4a, metal: 0xc8d8e8, head: 'helm', bulk: 1.2, glow: 0x9ad7ff }, tint: 0x6a8aa0, tintK: 0.5, eye: 0x9af0ff, gait: 'stomp', speed: 0.9, hide: ['weapon', 'circle', 'hood'], fx: { col: 0xffffff, col2: 0x9ad7ff, up: 0.4, rate: 14 },
    look(D) { P.spikes(D, 0xdff4ff, 7, 0.5, 0.4); P.pole(D, 'R', 2.4, 0x6a5a4a, (h) => { const hd = mesh(new THREE.BoxGeometry(0.6, 0.4, 0.4), toon(0xc8d8e8)); hd.position.y = 0.2; h.add(hd); }); P.ring(D, 0x9ad7ff, 4.6); },
    spells: [{ kind: 'leap', name: 'Pisada do Gigante', col: 0x9ad7ff, every: 11, k: 1.9, r: 5 }, { kind: 'cone', name: 'Sopro do Inverno', col: 0xdff4ff, every: 10, k: 1.3, r: 11, deg: 60 }, { kind: 'roar', name: 'Nevasca', col: 0xffffff, every: 16, k: 0.4, r: 12, slow: 0.45 }, { kind: 'lines', name: 'Gelo que Racha', col: 0xbfefff, every: 13, k: 1.3, n: 4, len: 14, w: 1.6 }] }),
  'Lobo-Rei Alfa': q({ tint: 0x4a4a52, tintK: 0.4, eye: 0xffd24a, gait: 'prowl', look(D) { P.spikes(D, 0x2a2a30, 6, 0.3, 0, true); P.crown(D, 0x8a7a5a, 0xffd24a, 0.6); },
    spells: [{ kind: 'roar', name: 'Uivo do Rei', col: 0xffd24a, every: 15, k: 0.3, r: 10, slow: 0.5 }, { kind: 'summon', name: 'A Alcateia', col: 0xffd24a, every: 20, k: 0, type: 'wolf', n: 3, line: 'O Lobo-Rei uiva: a alcateia responde do mato!' }, { kind: 'leap', name: 'Bote do Rei', col: 0xffd24a, every: 9, k: 1.4, r: 3 }] }),
  'Autômato de Latão': b({ gait: 'stomp', fx: { col: 0xd8d8d8, col2: 0x6a6a6a, up: 1.4, rate: 4 }, spells: [{ kind: 'nova', name: 'Descarga de Vapor', col: 0xd8e8f0, every: 11, k: 1.0, r: 3.5 }] }),
  'Torreta a Vapor': b({ fx: { col: 0xd8d8d8, col2: 0x6a6a6a, up: 1.6, rate: 3 }, spells: [{ kind: 'volley', name: 'Metralha', col: 0xffd070, every: 8, k: 0.55, n: 5, spread: 0.6, sp: 16 }] }),
  'Engenhoqueiro Enlouquecido': b({ eye: 0xffb040, gait: 'skitter', look(D) { P.orbit(D, P.ember(0xffb040), 3, D.W * 0.6, D.H * 0.7, 2.4); }, spells: [{ kind: 'meteor', name: 'Bombas de Relógio', col: 0xffb040, every: 10, k: 1.2, n: 3, r: 2.2 }] }),
  'Colosso de Ferro': b({ gait: 'stomp', speed: 0.85, fx: { col: 0xd8d8d8, col2: 0x5a5a5a, up: 2.2, rate: 10 }, look(D) { P.ring(D, 0xff6a2a, 4.8); },
    spells: [{ kind: 'leap', name: 'Martelo-Pilão', col: 0xff6a2a, every: 11, k: 2.0, r: 5 }, { kind: 'lines', name: 'Linhas de Vapor', col: 0xd8e8f0, every: 10, k: 1.3, n: 4, len: 15, w: 1.6 }, { kind: 'volley', name: 'Rebites', col: 0xffd070, every: 8, k: 0.7, n: 7, spread: 1.6, sp: 14 }, { kind: 'summon', name: 'Linha de Montagem', col: 0xff6a2a, every: 24, k: 0, type: 'automaton', n: 2, line: 'O Colosso abre o peito: dois autômatos saem da fornalha!' }] }),
  'Batedor Élfico Corrompido': b({ tint: 0x1a3a24, tintK: 0.3, eye: 0x9aff6a, spells: [{ kind: 'volley', name: 'Chuva de Folhas', col: 0x9aff6a, every: 10, k: 0.6, n: 4, spread: 0.6, sp: 14 }, { kind: 'blink', name: 'Some na Mata', col: 0x4a8a3a, every: 14, k: 1.0 }] }),
  'Inquisidor Kármico': b({ tint: 0xe8e0d0, tintK: 0.3, eye: 0xffe08a, gait: 'stomp', look(D) { P.halo(D, 0xffe08a, 0.4); P.cape(D, 0xc8a040, D.H * 0.55, 0.9, D.head.y - 0.25); }, spells: [{ kind: 'roar', name: 'Sentença', col: 0xffe08a, every: 14, k: 0.5, r: 8, slow: 0.4 }, { kind: 'lines', name: 'Fogo Kármico', col: 0xffd070, every: 11, k: 1.3, n: 3, len: 12, w: 1.4 }] }),
  'Negociante de Gente': b({ tint: 0x3a2a1a, tintK: 0.3, eye: 0xffb040, look(D) { P.chains(D, 0x6a6a72, 3); }, spells: [{ kind: 'pull', name: 'Laço', col: 0xd8c8a0, every: 12, k: 0.8, r: 12 }] }),
  'Capanga do Conde': b({ tint: 0x4a0e18, tintK: 0.3, eye: 0xff4a4a, spells: [{ kind: 'charge', name: 'Arrancada', col: 0xff4a4a, every: 10, k: 1.2, len: 9, w: 1.4 }] }),
  'Afogador': b({ form: { kind: 'hunch', skin: 0x4a7a6a, cloth: 0x1a3a30, head: 'beast', claws: true }, tint: 0x2a4a3a, tintK: 0.5, eye: 0xd8ff6a, gait: 'lurch', fx: { col: 0x9ad7ff, col2: 0x2a4a5a, up: -1, rate: 6 }, look(D) { P.moss(D, 0x3a5a3a, 5); }, spells: [{ kind: 'pull', name: 'Para o Fundo', col: 0x6ab8d0, every: 13, k: 0.8, r: 9 }] }),
  'Afogador Antigo': b({ form: { kind: 'hunch', skin: 0x3a6a5a, cloth: 0x0a2a24, head: 'beast', bulk: 1.3, claws: true }, tint: 0x1a3a30, tintK: 0.55, eye: 0xd8ff6a, gait: 'lurch', fx: { col: 0x9ad7ff, col2: 0x1a3a4a, up: -1, rate: 10 }, look(D) { P.moss(D, 0x2a4a3a, 9); P.shrooms(D, 0x6ad0ff, 4); },
    spells: [{ kind: 'pull', name: 'O Rio Puxa', col: 0x6ab8d0, every: 11, k: 1.1, r: 14 }, { kind: 'nova', name: 'Onda', col: 0x9ad7ff, every: 10, k: 1.2, r: 4.5 }, { kind: 'summon', name: 'Os Afogados', col: 0x6ab8d0, every: 22, k: 0, type: 'drowner', n: 2, line: 'O Afogador Antigo bate na água: dois afogados sobem do lodo!' }] }),
  'Escorpião das Dunas': q({ eye: 0xffb040, gait: 'skitter', spells: [{ kind: 'cone', name: 'Ferroada', col: 0xffb040, every: 10, k: 0.9, r: 4, deg: 30 }] }),
  'Escorpião-Rei': q({ eye: 0xff3a1a, gait: 'stomp', fx: { col: 0xd8b070, col2: 0x6a4a2a, up: 0.4, rate: 8 }, look(D) { P.crown(D, 0xd8a040, 0xff3a1a, 0.9); P.ring(D, 0xff3a1a, 3.4); },
    spells: [{ kind: 'charge', name: 'Investida das Dunas', col: 0xd8b070, every: 9, k: 1.5, len: 12, w: 2.0 }, { kind: 'lines', name: 'Ferrões da Areia', col: 0xff3a1a, every: 11, k: 1.3, n: 4, len: 12, w: 1.4 }, { kind: 'roar', name: 'Tempestade de Areia', col: 0xd8b070, every: 16, k: 0.4, r: 11, slow: 0.45 }, { kind: 'summon', name: 'A Prole', col: 0xff3a1a, every: 24, k: 0, type: 'scorpion', n: 2, line: 'O Escorpião-Rei bate as pinças: dois escorpiões brotam da areia!' }] }),
  'Fada das Raízes': b({ tint: 0x6aaa5a, tintK: 0.4, eye: 0xd8ff8a, gait: 'hover', look(D) { P.orbit(D, P.ember(0xd8ff8a), 4, D.W * 0.7, D.H * 0.5, 2); }, spells: [{ kind: 'volley', name: 'Pólen', col: 0xd8ff8a, every: 8, k: 0.7, n: 3, spread: 0.7, sp: 8 }] }),
};
export const kitOf = (name: string) => KITS[name] ?? null;
/** corpo próprio do chefe (enemies.enemyHooks.body) */
export function bossBody(e: { def: { name: string; fly?: number } }) { const k = kitOf(e.def.name); if (!k?.form) return null; e.def.fly = 0; return buildForm(k.form); }

/* ---------------- vestir: chamado quando o corpo do bicho é montado (enemies.enemyHooks.dress) ---------------- */
interface Anim { o: THREE.Object3D; kind: 'orb' | 'spin' | 'flick' | 'pulse' | 'sway' | 'wing' | 'cape'; r?: number; y?: number; sp?: number; ph: number; base?: THREE.Vector3 }
type EnemyLike = { def: { name: string; scale: number; speed: number; dmg: number; radius: number }; mats?: THREE.MeshToonMaterial[]; rig?: { root: THREE.Object3D } | null; quad?: { root: THREE.Object3D } | null; pos: THREE.Vector3; alive: boolean; root: THREE.Group | null; state: string; vel?: THREE.Vector2; hp: number; hpMax: number; yaw: number };
const dressed = new Set<THREE.Group>();
export function dressEnemy(e: EnemyLike, g: THREE.Group) {
  const kit = kitOf(e.def.name); if (!kit) return;
  if (kit.tint !== undefined && !kit.form) { const tc = new THREE.Color(kit.tint); for (const m of e.mats ?? []) m.color.lerp(tc, kit.tintK ?? 0.45); }
  if (kit.hide) g.traverse((o) => { if (kit.hide!.includes(o.name)) o.visible = false; });
  /* o tamanho do corpo, sem a escala do bicho */
  const s0 = g.scale.x || 1; g.updateMatrixWorld(true); const box = new THREE.Box3(); g.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh && m.visible && !(m.material as THREE.MeshBasicMaterial).blending) box.expandByObject(m); });
  if (box.isEmpty()) box.setFromObject(g); const H = Math.max(0.5, (box.max.y - g.position.y) / s0), W = Math.max(0.4, (box.max.x - box.min.x) / s0), F = Math.max(0.3, (box.max.z - g.position.z) / s0);
  let head = kit.body === 'quad' ? new THREE.Vector3(0, H * 0.82, F * 0.88) : new THREE.Vector3(0, H * 0.9, Math.min(0.25, F * 0.4));
  { let hd: THREE.Object3D | null = null; g.traverse((o) => { if (o.name === 'head') hd = o; }); if (hd) { const w = new THREE.Vector3(); (hd as THREE.Object3D).getWorldPosition(w); head = g.worldToLocal(w); } }
  const anims: Anim[] = [];
  const findArm = (side: 'R' | 'L') => { let a: THREE.Object3D | null = null; g.traverse((o) => { if (o.name === 'arm' + side) a = o; }); return a; };
  const D: Dress = { g, H, W, F, head, add(o, x, y, z) { o.position.set(x, y, z); g.add(o); return o; }, arm: findArm,
    orb(o, r, y, sp) { g.add(o); anims.push({ o, kind: 'orb', r, y, sp, ph: o.userData.ph ?? 0 }); }, spin(o, sp) { anims.push({ o, kind: 'spin', sp, ph: 0 }); }, flick(o) { anims.push({ o, kind: 'flick', ph: Math.random() * 6 }); } };
  kit.look?.(D);
  if (kit.eye !== undefined) P.eyes(D, kit.eye, kit.body === 'quad' ? 0.8 : 1, kit.body === 'quad' ? 0.18 : 0.12);
  if (kit.aura !== undefined) P.ring(D, kit.aura, W * 1.2);
  g.traverse((o) => { const u = o.userData; if (u.flick) anims.push({ o, kind: 'flick', ph: Math.random() * 6 }); if (u.spin) anims.push({ o, kind: 'spin', sp: u.spin, ph: 0 }); if (u.pulse !== undefined) anims.push({ o, kind: 'pulse', ph: u.pulse, base: o.scale.clone() }); if (u.sway) anims.push({ o, kind: 'sway', ph: 0 }); if (u.wing) anims.push({ o, kind: 'wing', ph: u.wing, base: new THREE.Vector3(0, 0, o.rotation.z) }); if (u.cape) anims.push({ o, kind: 'cape', ph: Math.random() * 6 }); });
  if (kit.speed) e.def.speed *= kit.speed;
  g.userData.kit = { kit, anims, e, t: Math.random() * 10, step: 0, fxT: 0, H, burst: 0, spd: e.def.speed }; dressed.add(g);
}

/* ---------------- o cérebro: andar, avisos no chão e as magias ---------------- */
export interface BrainCtx {
  scene: THREE.Scene; fine(o: THREE.Object3D): THREE.Object3D;
  particles: { spawn(x: number, y: number, z: number, o: Record<string, number>): void };
  heroPos(): THREE.Vector3; heroDead(): boolean; damage(n: number, from: THREE.Vector3): void; say(t: string): void; log(t: string, c?: string): void;
  shake(k: number): void; slowHero(k: number, secs: number): void; pushHero(dx: number, dz: number): void; walkable(x: number, z: number): boolean;
  spawnAdd(type: EnemyType, x: number, z: number): void; sound(k: 'shock' | 'fire' | 'ice' | 'arcane' | 'earth' | 'holy' | 'boom'): void;
  /** inverte os comandos do herói por `sec` segundos (encanto da súcubo) */ charm?(sec: number): void;
}
type Fx = (dt: number) => boolean; /* true = acabou */
const HOT = new Set(['chase', 'windup', 'recover', 'hurt']);
export function createBossBrain(ctx: BrainCtx) {
  const fxs: Fx[] = [];
  const cast = new Map<EnemyLike, { cds: number[]; busy: number; mine: boolean }>();
  const floorY = (e: EnemyLike) => e.pos.y + 0.07;
  /* --- formas no chão (o aviso enche até bater) --- */
  function shapeMesh(geo: THREE.BufferGeometry, col: number) { const edge = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false })); return edge; }
  function telegraph(geo: THREE.BufferGeometry, col: number, x: number, y: number, z: number, rotY: number, dur: number, then: () => void, grow: 'scale' | 'fade' = 'fade') {
    const m = shapeMesh(geo, col); m.position.set(x, y, z); m.rotation.y = rotY; ctx.scene.add(ctx.fine(m));
    const fill = shapeMesh(geo, col); fill.position.copy(m.position); fill.position.y += 0.01; fill.rotation.y = rotY; ctx.scene.add(ctx.fine(fill)); let t = 0;
    fxs.push((dt) => { t += dt; const k = Math.min(1, t / dur); (m.material as THREE.MeshBasicMaterial).opacity = 0.25 + 0.35 * Math.abs(Math.sin(t * 9)) * (k > 0.7 ? 1 : 0.4);
      if (grow === 'scale') fill.scale.setScalar(Math.max(0.03, k)); else (fill.material as THREE.MeshBasicMaterial).opacity = 0.05 + 0.4 * k;
      if (k >= 1) { ctx.scene.remove(m); ctx.scene.remove(fill); m.geometry.dispose(); (m.material as THREE.Material).dispose(); (fill.material as THREE.Material).dispose(); then(); return true; } return false; });
  }
  const sector = (r: number, deg: number) => new THREE.CircleGeometry(r, 28, -deg * Math.PI / 360, deg * Math.PI / 180).rotateX(-Math.PI / 2);
  const rect = (len: number, w: number) => new THREE.PlaneGeometry(len, w).rotateX(-Math.PI / 2).translate(len / 2, 0, 0);
  const disc = (r: number) => new THREE.CircleGeometry(r, 36).rotateX(-Math.PI / 2);
  const donutG = (r0: number, r1: number) => new THREE.RingGeometry(r0, r1, 40).rotateX(-Math.PI / 2);
  const burst = (x: number, y: number, z: number, col: number, n: number, sp = 3, up = 3, life = 0.8) => { for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, s = Math.random() * sp; ctx.particles.spawn(x, y, z, { vx: Math.cos(a) * s, vy: Math.random() * up, vz: Math.sin(a) * s, life, s0: 0.35, s1: 0.05, c0: 0xffffff, c1: col, a: 1, drag: 1.2 }); } };
  const hurt = (e: EnemyLike, k: number) => { if (!ctx.heroDead()) ctx.damage(Math.max(1, Math.round(e.def.dmg * k)), e.pos); };
  const dirTo = (e: EnemyLike) => { const h = ctx.heroPos(); return Math.atan2(h.z - e.pos.z, h.x - e.pos.x); };
  const shout = (e: EnemyLike, sp: Spell, hint: string) => ctx.say(`${e.def.name}: ${sp.name}! ${hint}`);
  const segDist = (px: number, pz: number, ax: number, az: number, ang: number, len: number) => { const ux = Math.cos(ang), uz = Math.sin(ang), dx = px - ax, dz = pz - az, t = Math.max(0, Math.min(len, dx * ux + dz * uz)); return { d: Math.hypot(dx - ux * t, dz - uz * t), t }; };
  /** levanta o corpo (salto) sem brigar com o andar do bicho: mexe só no filho */
  const bodyOf = (e: EnemyLike) => e.rig?.root ?? e.quad?.root ?? e.root?.children[0] ?? null;

  function doSpell(e: EnemyLike, sp: Spell, mine: boolean): number {
    const y = floorY(e), ang = dirTo(e), h = ctx.heroPos();
    switch (sp.kind) {
      case 'cone': { shout(e, sp, 'Saia da frente!'); telegraph(sector(sp.r, sp.deg), sp.col, e.pos.x, y, e.pos.z, -ang, 1.3, () => { const hh = ctx.heroPos(), d = Math.hypot(hh.x - e.pos.x, hh.z - e.pos.z), a2 = Math.atan2(hh.z - e.pos.z, hh.x - e.pos.x); let da = Math.abs(a2 - ang); if (da > Math.PI) da = 6.283 - da;
          if (e.alive && d < sp.r && da < sp.deg * Math.PI / 360) hurt(e, sp.k); ctx.sound('ice'); for (let i = 0; i < 50; i++) { const aa = ang + (Math.random() - 0.5) * sp.deg * Math.PI / 180, rr = Math.random() * sp.r; ctx.particles.spawn(e.pos.x + Math.cos(aa) * rr, y + 0.4, e.pos.z + Math.sin(aa) * rr, { vx: Math.cos(aa) * 3, vy: 1 + Math.random() * 2, vz: Math.sin(aa) * 3, life: 0.8, s0: 0.45, s1: 0.08, c0: 0xffffff, c1: sp.col, a: 0.9, drag: 1 }); } }, 'scale'); return 1.4; }
      case 'charge': { const len = Math.min(sp.len, Math.hypot(h.x - e.pos.x, h.z - e.pos.z) + 3), ax = e.pos.x, az = e.pos.z; shout(e, sp, 'Saia da linha!');
        telegraph(rect(len, sp.w), sp.col, ax, y, az, -ang, 1.1, () => { if (!e.alive) return; ctx.sound('boom'); let t = 0, hit = false, trailT = 0; const ux = Math.cos(ang), uz = Math.sin(ang);
          fxs.push((dt) => { t += dt; const k = Math.min(1, t / 0.38), px = ax + ux * len * k, pz = az + uz * len * k;
            if (mine && ctx.walkable(px, pz)) { e.pos.x = px; e.pos.z = pz; e.yaw = Math.atan2(ux, uz); }
            const hh = ctx.heroPos(); if (!hit && Math.hypot(hh.x - e.pos.x, hh.z - e.pos.z) < sp.w * 0.5 + e.def.radius) { hit = true; hurt(e, sp.k); ctx.pushHero(ux * 2.5, uz * 2.5); ctx.shake(0.4); }
            burst(e.pos.x, y + 0.2, e.pos.z, sp.col, 4, 2, 1.5, 0.6); trailT -= dt; if (sp.trail && trailT <= 0) { trailT = 0.08; pool(e.pos.x, y, e.pos.z, 1.4, sp.trail, e, 0.25, 6); }
            return k >= 1; }); }); return 1.6; }
      case 'leap': { const tx = h.x, tz = h.z; shout(e, sp, 'Saia do círculo, ele vai cair aí!'); const bd = bodyOf(e), y0 = bd?.position.y ?? 0, sx = e.pos.x, sz = e.pos.z; let t = 0;
        telegraph(disc(sp.r), sp.col, tx, y, tz, 0, 1.2, () => { if (!e.alive) return; const hh = ctx.heroPos(); if (Math.hypot(hh.x - tx, hh.z - tz) < sp.r) hurt(e, sp.k); ctx.shake(0.6); ctx.sound('earth'); burst(tx, y + 0.2, tz, sp.col, 60, 6, 3, 1); ring2(tx, y, tz, sp.r, sp.col); }, 'scale');
        fxs.push((dt) => { t += dt; const k = Math.min(1, t / 1.2); if (mine && ctx.walkable(tx, tz)) { e.pos.x = sx + (tx - sx) * k; e.pos.z = sz + (tz - sz) * k; } if (bd) bd.position.y = y0 + Math.sin(k * Math.PI) * 4.5; if (k >= 1 && bd) bd.position.y = y0; return k >= 1; }); return 1.5; }
      case 'nova': { shout(e, sp, 'Saia de perto!'); const cx = e.pos.x, cz = e.pos.z; telegraph(disc(sp.r), sp.col, cx, y, cz, 0, 1.3, () => { const hh = ctx.heroPos(); if (e.alive && Math.hypot(hh.x - cx, hh.z - cz) < sp.r) hurt(e, sp.k); burst(cx, y + 0.3, cz, sp.col, 40, sp.r, 3); ring2(cx, y, cz, sp.r, sp.col); ctx.sound('shock'); }, 'scale'); return 1.4; }
      case 'donut': { shout(e, sp, 'Corra para PERTO dele!'); const cx = e.pos.x, cz = e.pos.z; telegraph(donutG(sp.r0, sp.r1), sp.col, cx, y, cz, 0, 1.6, () => { const hh = ctx.heroPos(), d = Math.hypot(hh.x - cx, hh.z - cz); if (e.alive && d > sp.r0 && d < sp.r1) hurt(e, sp.k); ring2(cx, y, cz, sp.r1, sp.col); ctx.sound('arcane'); }); return 1.7; }
      case 'meteor': { shout(e, sp, 'Não fique parado!'); for (let i = 0; i < sp.n; i++) { const a = Math.random() * 6.283, rr = i === 0 ? 0 : 2 + Math.random() * 5, mx = h.x + Math.cos(a) * rr, mz = h.z + Math.sin(a) * rr;
          setTimeoutFx(i * 0.28, () => { telegraph(disc(sp.r), sp.col, mx, y, mz, 0, 1.3, () => { const hh = ctx.heroPos(); if (e.alive && Math.hypot(hh.x - mx, hh.z - mz) < sp.r) hurt(e, sp.k); burst(mx, y + 0.3, mz, sp.col, 26, 4, 4); ctx.shake(0.2); ctx.sound('fire'); }, 'scale'); fall(mx, y, mz, sp.col, 1.3); }); } return 1.2 + sp.n * 0.28; }
      case 'lines': { shout(e, sp, 'Fique entre as linhas!'); const cx = e.pos.x, cz = e.pos.z; for (let i = 0; i < sp.n; i++) { const a = ang + (i / sp.n) * 6.283; telegraph(rect(sp.len, sp.w), sp.col, cx, y, cz, -a, 1.4, () => { const hh = ctx.heroPos(), sd = segDist(hh.x, hh.z, cx, cz, a, sp.len); if (e.alive && sd.d < sp.w / 2 && i === hitLine(hh, cx, cz, ang, sp)) hurt(e, sp.k); for (let j = 0; j < 12; j++) { const t2 = (j / 12) * sp.len; ctx.particles.spawn(cx + Math.cos(a) * t2, y + 0.2, cz + Math.sin(a) * t2, { vy: 2 + Math.random() * 3, life: 0.7, s0: 0.4, s1: 0.06, c0: 0xffffff, c1: sp.col, a: 1 }); } if (i === 0) ctx.sound('earth'); }); } return 1.5; }
      case 'volley': { ctx.say(`${e.def.name}: ${sp.name}!`); for (let i = 0; i < sp.n; i++) { const a = ang + (sp.n === 1 ? 0 : (i / (sp.n - 1) - 0.5) * sp.spread); setTimeoutFx(0.35 + i * 0.07, () => bolt(e, a, sp)); } ctx.sound('fire'); return 1.0; }
      case 'pull': { shout(e, sp, 'Resista: corra para longe!'); const line = beam(e, sp.col); let t = 0;
        fxs.push((dt) => { t += dt; const hh = ctx.heroPos(), dx = e.pos.x - hh.x, dz = e.pos.z - hh.z, d = Math.hypot(dx, dz); line.update(); if (e.alive && d < sp.r && d > 2.2 && t < 1.0) ctx.pushHero(dx / d * 7 * dt, dz / d * 7 * dt);
          if (t >= 1.0) { line.done(); const cx = e.pos.x, cz = e.pos.z; telegraph(disc(3.2), sp.col, cx, y, cz, 0, 0.7, () => { const h2 = ctx.heroPos(); if (e.alive && Math.hypot(h2.x - cx, h2.z - cz) < 3.2) hurt(e, sp.k); burst(cx, y + 0.3, cz, sp.col, 30, 3, 3); ctx.sound('arcane'); }, 'scale'); return true; } return false; }); return 1.9; }
      case 'blink': { if (!mine) return 0.5; const d = Math.hypot(h.x - e.pos.x, h.z - e.pos.z) || 1, bx = h.x + (h.x - e.pos.x) / d * 2.6, bz = h.z + (h.z - e.pos.z) / d * 2.6; if (!ctx.walkable(bx, bz)) return 0.5;
        burst(e.pos.x, y + 1, e.pos.z, sp.col, 40, 2, 3, 0.9); e.pos.x = bx; e.pos.z = bz; e.yaw = Math.atan2(h.x - bx, h.z - bz); burst(bx, y + 1, bz, sp.col, 40, 2, 3, 0.9); ctx.sound('arcane'); ctx.say(`${e.def.name}: ${sp.name}! Atrás de você!`);
        telegraph(disc(2.6), sp.col, bx, y, bz, 0, 0.8, () => { const hh = ctx.heroPos(); if (e.alive && Math.hypot(hh.x - bx, hh.z - bz) < 2.6) hurt(e, sp.k); }, 'scale'); return 1.0; }
      case 'roar': { shout(e, sp, 'Afaste-se ou fica lento!'); const cx = e.pos.x, cz = e.pos.z; telegraph(disc(sp.r), sp.col, cx, y, cz, 0, 1.0, () => { const hh = ctx.heroPos(); if (e.alive && Math.hypot(hh.x - cx, hh.z - cz) < sp.r) { hurt(e, sp.k); ctx.slowHero(sp.slow, 3.5); ctx.log(`🐾 ${sp.name}: você está lento por alguns segundos.`, '#d8c8a0'); } ring2(cx, y, cz, sp.r, sp.col); ring2(cx, y, cz, sp.r * 0.6, sp.col); ctx.shake(0.35); ctx.sound('shock'); }); return 1.2; }
      case 'drain': { const hh0 = ctx.heroPos(); if (Math.hypot(hh0.x - e.pos.x, hh0.z - e.pos.z) > sp.r) return 0.3; shout(e, sp, `Afaste-se mais de ${Math.round(sp.r)} m para romper o laço!`); const line = beam(e, sp.col); let t = 0, tick = 0.5;
        fxs.push((dt) => { t += dt; tick -= dt; line.update(); const hh = ctx.heroPos(), d = Math.hypot(hh.x - e.pos.x, hh.z - e.pos.z); if (!e.alive || d > sp.r || t > 3.2) { line.done(); if (e.alive && d > sp.r) ctx.log(`✂ Você rompeu ${sp.name}.`, '#ffd27a'); return true; }
          if (tick <= 0) { tick = 0.5; const n = Math.max(1, Math.round(e.def.dmg * sp.k)); hurt(e, sp.k); e.hp = Math.min(e.hpMax, e.hp + n * 2.5); burst(hh.x, hh.y + 1, hh.z, sp.col, 8, 1, 2, 0.6); } return false; }); return 3.3; }
      case 'charm': { shout(e, sp, 'Não olhe nos olhos dela — saia do círculo!'); const cx = e.pos.x, cz = e.pos.z; telegraph(disc(sp.r), sp.col, cx, y, cz, 0, 1.2, () => { const hh = ctx.heroPos(); if (e.alive && Math.hypot(hh.x - cx, hh.z - cz) < sp.r) { hurt(e, sp.k); ctx.charm?.(sp.sec); ctx.log(`💋 ${sp.name}: seus passos estão trocados por ${sp.sec} s!`, '#ff8ad8'); } burst(cx, y + 1, cz, sp.col, 40, sp.r, 2); ctx.sound('arcane'); }, 'scale'); return 1.5; }
      case 'summon': { ctx.say(sp.line); ctx.sound('shock'); if (mine) for (let i = 0; i < sp.n; i++) { const a = (i / sp.n) * 6.283, x = e.pos.x + Math.cos(a) * 4, z = e.pos.z + Math.sin(a) * 4; if (ctx.walkable(x, z)) { ctx.spawnAdd(sp.type, x, z); burst(x, y + 0.3, z, sp.col, 16, 2, 3); } } return 1.0; }
    }
    return 1;
  }
  /** nas linhas, só a linha em que você está pisando conta (não dá dano duas vezes) */
  function hitLine(hh: THREE.Vector3, cx: number, cz: number, ang: number, sp: { n: number; len: number; w: number }) { let best = -1, bd = 1e9; for (let i = 0; i < sp.n; i++) { const a = ang + (i / sp.n) * 6.283, s = segDist(hh.x, hh.z, cx, cz, a, sp.len); if (s.d < bd) { bd = s.d; best = i; } } return best; }
  function setTimeoutFx(sec: number, fn: () => void) { let t = 0; fxs.push((dt) => { t += dt; if (t >= sec) { fn(); return true; } return false; }); }
  function ring2(x: number, y: number, z: number, r: number, col: number) { const m = new THREE.Mesh(new THREE.RingGeometry(r * 0.9, r, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); m.position.set(x, y + 0.05, z); ctx.scene.add(ctx.fine(m)); let t = 0;
    fxs.push((dt) => { t += dt; const k = t / 0.5; m.scale.setScalar(0.4 + 0.8 * k); (m.material as THREE.MeshBasicMaterial).opacity = 0.9 * (1 - k); if (k >= 1) { ctx.scene.remove(m); m.geometry.dispose(); (m.material as THREE.Material).dispose(); return true; } return false; }); }
  function fall(x: number, y: number, z: number, col: number, dur: number) { const m = new THREE.Mesh(new THREE.DodecahedronGeometry(0.45, 0), new THREE.MeshBasicMaterial({ color: col, fog: false })); ctx.scene.add(ctx.fine(m)); let t = 0;
    fxs.push((dt) => { t += dt; const k = Math.min(1, t / dur); m.position.set(x, y + 14 * (1 - k * k), z); m.rotation.x += dt * 6; if (Math.random() < 0.6) ctx.particles.spawn(m.position.x, m.position.y, m.position.z, { vy: 0.5, life: 0.4, s0: 0.35, s1: 0.05, c0: 0xffffff, c1: col, a: 0.8 }); if (k >= 1) { ctx.scene.remove(m); m.geometry.dispose(); return true; } return false; }); }
  type Pl = { x: number; z: number; r: number; t: number; life: number; m: THREE.Mesh; k: number; e: EnemyLike; tick: number };
  const pools: Pl[] = [];
  function pool(x: number, y: number, z: number, r: number, col: number, e: EnemyLike, k: number, life: number) { if (pools.length > 40) return; const m = new THREE.Mesh(disc(r), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.4, depthWrite: false, fog: false })); m.position.set(x, y + 0.02, z); ctx.scene.add(ctx.fine(m)); pools.push({ x, z, r, t: 0, life, m, k, e, tick: 0 }); }
  function bolt(e: EnemyLike, a: number, sp: { col: number; k: number; sp: number }) { if (!e.alive) return; const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.28, 0), glowM(sp.col, 1)); const y = e.pos.y + 1.2; m.position.set(e.pos.x, y, e.pos.z); ctx.scene.add(ctx.fine(m)); let t = 0; const vx = Math.cos(a) * sp.sp, vz = Math.sin(a) * sp.sp;
    fxs.push((dt) => { t += dt; m.position.x += vx * dt; m.position.z += vz * dt; m.rotation.y += dt * 8; ctx.particles.spawn(m.position.x, m.position.y, m.position.z, { vy: 0.2, life: 0.35, s0: 0.3, s1: 0.04, c0: 0xffffff, c1: sp.col, a: 0.9 });
      const hh = ctx.heroPos(); const done = t > 2.2 || !ctx.walkable(m.position.x, m.position.z); if (Math.hypot(hh.x - m.position.x, hh.z - m.position.z) < 0.9) { hurt(e, sp.k); burst(m.position.x, m.position.y, m.position.z, sp.col, 16, 2, 2); ctx.scene.remove(m); m.geometry.dispose(); return true; }
      if (done) { burst(m.position.x, m.position.y, m.position.z, sp.col, 8, 1.5, 1.5); ctx.scene.remove(m); m.geometry.dispose(); return true; } return false; }); }
  function beam(e: EnemyLike, col: number) { const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]); const ln = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, fog: false })); ctx.scene.add(ctx.fine(ln));
    return { update() { const hh = ctx.heroPos(), p = geo.attributes.position as THREE.BufferAttribute; p.setXYZ(0, e.pos.x, e.pos.y + 1.4, e.pos.z); p.setXYZ(1, hh.x, hh.y + 1.1, hh.z); p.needsUpdate = true; if (Math.random() < 0.5) { const k = Math.random(); ctx.particles.spawn(e.pos.x + (hh.x - e.pos.x) * k, e.pos.y + 1.3, e.pos.z + (hh.z - e.pos.z) * k, { vy: 0.4, life: 0.4, s0: 0.3, s1: 0.04, c0: 0xffffff, c1: col, a: 0.9 }); } },
      done() { ctx.scene.remove(ln); geo.dispose(); } }; }

  /** a masmorra registra quem luta com o kit (o chefe e o elite); `mine` = o meu cliente manda na posição dele */
  function track(e: EnemyLike) { const kit = kitOf(e.def.name); if (!kit || cast.has(e)) return; cast.set(e, { cds: kit.spells.map((s, i) => 3 + i * 2.2 + Math.random() * 1.5 + s.every * 0.15), busy: 0, mine: true }); }
  function untrackAll() { cast.clear(); for (const p of pools) ctx.scene.remove(p.m); pools.length = 0; }
  let tt = 0;
  function tick(dt: number, mineOf?: (e: EnemyLike) => boolean) {
    tt += dt; const hp = ctx.heroPos();
    /* magias de quem está lutando */
    for (const [e, st] of cast) { if (!e.alive) { cast.delete(e); continue; } const kit = kitOf(e.def.name)!; const d = Math.hypot(hp.x - e.pos.x, hp.z - e.pos.z);
      if (!HOT.has(e.state) || d > 26 || ctx.heroDead()) continue; st.busy -= dt; for (let i = 0; i < st.cds.length; i++) st.cds[i] -= dt; if (st.busy > 0 || e.state === 'windup') continue;
      const enr = e.hp / e.hpMax < 0.3 ? 0.7 : 1; for (let i = 0; i < kit.spells.length; i++) { if (st.cds[i] > 0) continue; const sp = kit.spells[i]; st.cds[i] = sp.every * enr * (0.9 + Math.random() * 0.2); st.busy = doSpell(e, sp, mineOf ? mineOf(e) : true); break; } }
    for (let i = fxs.length - 1; i >= 0; i--) if (fxs[i](dt)) fxs.splice(i, 1);
    for (let i = pools.length - 1; i >= 0; i--) { const p = pools[i]; p.t += dt; p.tick -= dt; (p.m.material as THREE.MeshBasicMaterial).opacity = 0.4 * Math.min(1, (p.life - p.t) / 1.5); if (p.tick <= 0 && Math.hypot(hp.x - p.x, hp.z - p.z) < p.r) { p.tick = 1; hurt(p.e, p.k); } if (p.t > p.life) { ctx.scene.remove(p.m); p.m.geometry.dispose(); pools.splice(i, 1); } }
    /* o corpo: peças que giram, chamas, o jeito de andar e o rastro */
    for (const g of dressed) { if (!g.parent) { dressed.delete(g); continue; } const U = g.userData.kit as { kit: Kit; anims: Anim[]; e: EnemyLike; t: number; step: number; fxT: number; H: number; burst: number; spd: number }; const e = U.e; U.t += dt;
      const near = Math.abs(g.position.x - hp.x) < 40 && Math.abs(g.position.z - hp.z) < 40; if (!near) continue;
      for (const a of U.anims) { switch (a.kind) {
        case 'orb': { const ph = a.ph + U.t * (a.sp ?? 1); a.o.position.set(Math.cos(ph) * a.r!, a.y! + Math.sin(U.t * 2 + a.ph) * 0.15, Math.sin(ph) * a.r!); a.o.rotation.y = -ph; break; }
        case 'spin': a.o.rotation.z += dt * (a.sp ?? 1); break;
        case 'flick': a.o.scale.setScalar(0.85 + Math.random() * 0.3); break;
        case 'pulse': { const k = 1 + Math.sin(U.t * 3 + a.ph) * 0.12; if (a.base) a.o.scale.copy(a.base).multiplyScalar(k); break; }
        case 'sway': a.o.rotation.z = Math.sin(U.t * 1.3) * 0.06; break;
        case 'wing': a.o.rotation.z = (a.base?.z ?? 0) + Math.sin(U.t * 5) * 0.25 * (a.ph > 0 ? 1 : -1); break;
        case 'cape': a.o.rotation.x = 0.12 + Math.sin(U.t * 2 + a.ph) * 0.06 + Math.min(0.5, (e.vel ? Math.hypot(e.vel.x, e.vel.y) : 0) * 0.05); break; } }
      if (!e.alive) continue;
      const moving = e.state === 'chase' || e.state === 'return', gait = U.kit.gait;
      if (gait === 'stomp' && moving) { U.step -= dt; if (U.step <= 0) { U.step = 0.62; const d = Math.hypot(hp.x - e.pos.x, hp.z - e.pos.z); if (d < 14) ctx.shake(0.08 + 0.12 * (1 - d / 14) * Math.min(2, e.def.scale)); for (let i = 0; i < 6; i++) { const a = Math.random() * 6.283; ctx.particles.spawn(e.pos.x + Math.cos(a) * e.def.radius, e.pos.y + 0.1, e.pos.z + Math.sin(a) * e.def.radius, { vx: Math.cos(a) * 1.5, vy: 0.4, vz: Math.sin(a) * 1.5, life: 0.6, s0: 0.35, s1: 0.1, c0: 0x8a7a6a, c1: 0x3a3028, a: 0.6, drag: 2 }); } } }
      if (gait === 'hover') { const bd = bodyOf(e); if (bd) bd.rotation.z = Math.sin(U.t * 1.1) * 0.04; g.position.y += 0.25 + Math.sin(U.t * 2) * 0.18; }
      if (gait === 'lurch' && moving) { g.rotation.z = Math.sin(U.t * 3.2) * 0.09; }
      if (gait === 'skitter') { U.burst -= dt; if (U.burst <= 0) { U.burst = 1.6 + Math.random() * 1.4; e.def.speed = U.spd * (moving ? 1.8 : 1); } else if (U.burst < 1.1) e.def.speed = U.spd * 0.8; }
      if (gait === 'prowl' && moving) { const d = Math.hypot(hp.x - e.pos.x, hp.z - e.pos.z); e.def.speed = U.spd * (d > 7 ? 1.25 : 0.75); g.position.y -= 0.08; }
      const F = U.kit.fx; if (F) { U.fxT += dt * F.rate; while (U.fxT > 1) { U.fxT -= 1; const a = Math.random() * 6.283, r = Math.random() * e.def.radius * 1.2; ctx.particles.spawn(g.position.x + Math.cos(a) * r, g.position.y + Math.random() * U.H * e.def.scale * 0.9, g.position.z + Math.sin(a) * r, { vx: (Math.random() - 0.5) * 0.4, vy: F.up, vz: (Math.random() - 0.5) * 0.4, life: 1.1, s0: F.size ?? 0.28, s1: 0.04, c0: F.col, c1: F.col2, a: 0.85 }); } }
    }
  }
  return { track, untrackAll, tick, get casting() { return cast.size; } };
}
