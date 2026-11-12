import * as THREE from 'three';
import { makeFire } from './sistemas/fogo';
import { vitral, floorGlow, TEMAS, type Tam } from './vitrais';
import { std, ink, plankTex, stoneTex, woodTex, plasterTex } from './toon3d';
import { kitPut } from './libs/kitprops';

export interface Interior { group: THREE.Group; W: number; D: number; colliders: [number, number, number][]; free(x: number, z: number, squeeze?: boolean): boolean; flicker(t: number, hx?: number, hz?: number): void; shop?: boolean; exitZ: number; /** 09/11: altura do piso em (x, z) locais — estrados e degraus (o herói pisa em cima, não some dentro) */ floorY?(x: number, z: number): number; /** 10/11: assentos (o herói senta com E; os fregueses usam os mesmos) */ seats?: { x: number; z: number; yaw: number; h: number }[]; /** 10/11: a mesa que se reserva para o grupo, e a placa dela */ reserveAt?: { x: number; z: number } | null; reserveSign?: THREE.Mesh | null; reserveLabel?: ((a: string, b: string) => void) | null }

const rr = (s: number) => () => { s = (s * 16807) % 2147483647; return s / 2147483647; };

/** Interior decorado de casa. Origem local (0,0) = canto noroeste; paredes norte e oeste altas, sul e leste baixas (câmera isométrica). Porta ao sul. */
/** `culture`: estilo do povo da casa (1 nórdico/humano · 2 anão · 3 élfico). 10/11 (Erling: "o interior tem que refletir o exterior:
    a casa élfica é redonda e aberta de um lado — por dentro sala redonda, um lado sem parede com bambus e cipós olhando a vila, móveis
    diferentes e um fogão de pedra, não lareira; a mesma ideia para anões e humanos") */
export function buildInterior(variant: number, W: number, D: number, seed = 7, culture = 1): Interior {
  if (variant === 15) { W = Math.max(W, 30); D = Math.max(D, 20); } if (variant === 16) { W = Math.max(W, 26); D = Math.max(D, 16); } if (variant === 17) { W = Math.max(W, 24); D = Math.max(D, 16); } /* 12/11: a Estalagem e o Salão das Guildas de Karmika */ /* 10/11: a Bigorna Molhada por dentro é um salão de verdade (30 × 20 m) */
  const g = new THREE.Group(), cols: [number, number, number][] = [], r = rr(seed * 97 + variant * 13 + 5);
  const lights: { l: THREE.PointLight; base: number; ph: number }[] = []; const spin: THREE.Object3D[] = []; /* o que gira devagar (planetário) */
  const wood = (c = 0x6a4528) => std(0xffffff, { map: woodTex(c) }), plank = (c = 0x7a5532) => std(0xffffff, { map: plankTex(c) });
  const add = (geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, inked = true, ry = 0, parent: THREE.Object3D = g) => { const b = new THREE.Mesh(geo, m); if (inked) ink(b, 0.025); b.position.set(x, y, z); b.rotation.y = ry; b.castShadow = b.receiveShadow = true; parent.add(b); return b; };
  const B = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
  const solid = (x: number, z: number, rad: number) => cols.push([x, z, rad]);
  const seats: { x: number; z: number; yaw: number; h: number }[] = []; let reserveAt: { x: number; z: number } | null = null, reserveSign: THREE.Mesh | null = null, reserveLabel: ((a: string, b: string) => void) | null = null, stage: { x0: number; x1: number; z0: number; z1: number; y: number } | null = null;
  const HOME = variant <= 2; /* casas comuns (cabana, sobrado, casa em L): o resto (lojas, templos, academias) tem interior próprio */
  const ELF = culture === 3 && HOME, DWARF = culture === 2 && HOME;
  /* casa élfica: a sala é o círculo da casa, encostado na porta (sul) */
  const ER = Math.min(W, D) / 2 - 0.1, ECX = W / 2, ECZ = D - ER;
  // chão e base escura
  const dark = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshBasicMaterial({ color: 0x07060a })); dark.rotation.x = -Math.PI / 2; dark.position.set(W / 2, -0.06, D / 2); g.add(dark);
  if (!ELF) { const fl = new THREE.Mesh(new THREE.PlaneGeometry(W, D), std(0xffffff, { map: (() => { const t = variant === 3 || (variant >= 6 && variant !== 16) || DWARF ? stoneTex(variant === 3 ? 0x6a6a72 : 0x6a6458) : plankTex(variant === 5 ? 0x5a4a3c : 0x7a5532); /* 07/11: chão de laje (foto laje_pedra) nas construções de pedra, assoalho (foto assoalho_madeira) nas casas */ const c = t.clone(); c.repeat.set(W / 2, D / 2); c.wrapS = c.wrapT = THREE.RepeatWrapping; c.needsUpdate = true; return c; })() })); fl.rotation.x = -Math.PI / 2; fl.position.set(W / 2, 0.005, D / 2); fl.receiveShadow = true; g.add(fl); }
  // paredes
  const H = 3.4, wallC = DWARF ? 0x7a7268 : [0xcdb48a, 0xc2a57a, 0xb8aa94, 0x8a8aa0, 0xb08a60, 0x8a7a68][variant % 6];
  const wm = std(0xffffff, { map: DWARF || variant === 15 ? stoneTex(variant === 15 ? 0x7a7268 : wallC) : plasterTex(wallC) }); /* 10/11: a taverna dos anões é de pedra */
  const lowH = 0.55, lm = std(0xffffff, { map: stoneTex(0x6a665e) });
  const dw = 2.0, dx0 = W / 2;
  if (!ELF) {
  add(B(W, H, 0.3), wm, W / 2, H / 2, -0.15); add(B(0.3, H, D), wm, -0.15, H / 2, D / 2);
  add(B(0.3, H, 0.3), wood(0x3a2616), -0.15, H / 2, -0.15);
  // paredes baixas (sul com porta, leste)
  add(B(dx0 - dw / 2, lowH, 0.3), lm, (dx0 - dw / 2) / 2, lowH / 2, D + 0.15); add(B(W - dx0 - dw / 2, lowH, 0.3), lm, W - (W - dx0 - dw / 2) / 2, lowH / 2, D + 0.15);
  add(B(0.3, lowH, D), lm, W + 0.15, lowH / 2, D / 2);
  // porta (batente)
  add(B(0.18, 2.4, 0.3), wood(0x3a2616), dx0 - dw / 2, 1.2, D + 0.15); add(B(0.18, 2.4, 0.3), wood(0x3a2616), dx0 + dw / 2, 1.2, D + 0.15);
  // rodapé
  add(B(W, 0.2, 0.08), wood(0x3a2616), W / 2, 0.1, 0.04); add(B(0.08, 0.2, D), wood(0x3a2616), 0.04, 0.1, D / 2);
  }

  /* ---- peças ---- */
  /* no máximo 4 luzes pontuais por interior: cada quantidade diferente de luzes na cena recompila os shaders de tudo
     (travada de ~1 s ao entrar) — a 5ª em diante vira só o brilho emissivo do próprio objeto (a luz devolvida fica fora do grupo) */
  const MAX_LIGHTS = 4;
  const light = (x: number, y: number, z: number, c: number, i: number, dist = 14) => { const l = new THREE.PointLight(c, i, dist, 1.6); l.position.set(x, y, z); if (lights.length < MAX_LIGHTS) { g.add(l); lights.push({ l, base: i, ph: r() * 9 }); } return l; };
  const flame = (x: number, y: number, z: number, s = 1) => { const f = makeFire(0.42 * s, s < 0.75 ? 'candle' : 'warm', s < 0.75 ? 'candle' : 'torch', x * 7 + z * 13 + y); f.position.set(x, y - 0.2 * s, z); g.add(f); return f; }; /* 08/11: chama de cartão */
  const rug = (x: number, z: number, w: number, d: number, c: number) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshToonMaterial({ color: c })); m.rotation.x = -Math.PI / 2; m.position.set(x, 0.02, z); g.add(m); const m2 = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.8, d * 0.78), new THREE.MeshToonMaterial({ color: new THREE.Color(c).multiplyScalar(0.6) })); m2.rotation.x = -Math.PI / 2; m2.position.set(x, 0.025, z); g.add(m2); };
  /* nada divide o mesmo pedaço de parede: janelas, vitrais, lareiras, estantes e bandeiras reservam o seu trecho; quem chega depois procura outro lugar (ou fica de fora) */
  const wallUse: Record<'n' | 'w', [number, number][]> = { n: [], w: [] };
  const spot = (wall: 'n' | 'w', x: number, half: number): number | null => { const len = wall === 'n' ? W : D, freeAt = (c: number) => c - half >= 0.35 && c + half <= len - 0.35 && wallUse[wall].every(([a, b]) => c + half + 0.12 <= a || c - half - 0.12 >= b);
    for (let k = 0; k <= 40; k++) { for (const sg of [1, -1]) { const c = x + sg * k * 0.15; if (freeAt(c)) { wallUse[wall].push([c - half, c + half]); return c; } } } return null; };
  const fireplace = (x0: number) => { const x = spot('n', x0, 1.35); if (x === null) return; // na parede norte
    if (DWARF) { /* 10/11: anão não tem lareira de tijolo — forno de pedra abobadado, boca acesa, chaminé de pedra */
      const sm2 = std(0xffffff, { map: stoneTex(0x5a5650) }); add(new THREE.CylinderGeometry(1.15, 1.3, 1.3, 14), sm2, x, 0.65, 0.95); const dome = add(new THREE.SphereGeometry(1.15, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), sm2, x, 1.3, 0.95); void dome;
      add(B(0.9, 0.7, 0.3), std(0x0a0605), x, 0.6, 2.05, false); add(new THREE.CylinderGeometry(0.3, 0.38, 1.9, 8), sm2, x, 2.9, 0.7);
      flame(x - 0.15, 0.4, 1.95, 1.2); flame(x + 0.2, 0.38, 1.95, 0.9); light(x, 1.0, 2.4, 0xff7a30, 60, 16); solid(x, 1.0, 1.4);
      /* bigorna e barril de água ao lado do forno */ add(B(0.5, 0.35, 0.9), std(0x2a2a32), x + 2.0, 0.55, 1.6); add(B(0.3, 0.45, 0.4), std(0x2a2a32), x + 2.0, 0.25, 1.6, false); solid(x + 2.0, 1.6, 0.6); return; }
    const sm = std(0xffffff, { map: stoneTex(0x6a665e) });
    add(B(2.6, 2.4, 0.7), sm, x, 1.2, 0.35); add(B(1.5, 1.2, 0.2), std(0x0a0605), x, 0.7, 0.72, false);
    add(B(2.9, 0.2, 0.9), wood(0x4a3220), x, 2.5, 0.42);
    add(B(0.14, 0.14, 0.9), wood(0x3a2616), x - 0.3, 0.2, 0.9); add(B(0.14, 0.14, 0.9), wood(0x3a2616), x + 0.3, 0.22, 0.9).rotation.y = 0.5;
    flame(x - 0.1, 0.45, 0.85, 1.4); flame(x + 0.25, 0.4, 0.85, 1.0); light(x, 1.1, 1.4, 0xff8a3a, 55, 16); solid(x, 1.0, 1.1);
  };
  const table = (x: number, z: number, w = 1.8, d = 1.0, ry = 0) => { const t = new THREE.Group(); t.position.set(x, 0, z); t.rotation.y = ry; g.add(t); add(B(w, 0.1, d), plank(0x7a5532), 0, 0.82, 0, true, 0, t); for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(B(0.1, 0.8, 0.1), wood(0x3a2616), sx * (w / 2 - 0.1), 0.4, sz * (d / 2 - 0.1), true, 0, t); { /* mesa comprida: círculos ao longo do eixo maior (um só círculo do tamanho da mesa bloqueava as cadeiras) */ const L = Math.max(w, d), S = Math.min(w, d), n = Math.max(1, Math.round(L / S)), ax = w >= d ? Math.cos(ry) : Math.sin(ry), az = w >= d ? -Math.sin(ry) : Math.cos(ry); for (let k = 0; k < n; k++) { const t = n === 1 ? 0 : (k / (n - 1) - 0.5) * (L - S); solid(x + ax * t, z + az * t, S * 0.5); } } return t; };
  const mug = (x: number, y: number, z: number) => add(new THREE.CylinderGeometry(0.07, 0.06, 0.14, 8), std(0xc9a24a), x, y + 0.07, z, false);
  const plate = (x: number, y: number, z: number) => add(new THREE.CylinderGeometry(0.14, 0.12, 0.03, 8), std(0xe8dcc0), x, y + 0.02, z, false);
  const chair = (x: number, z: number, ry = 0) => { const c = new THREE.Group(); c.position.set(x, 0, z); c.rotation.y = ry; g.add(c); add(B(0.5, 0.08, 0.5), plank(0x6a4528), 0, 0.5, 0, true, 0, c); add(B(0.5, 0.55, 0.07), plank(0x6a4528), 0, 0.8, -0.24, true, 0, c); for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(B(0.07, 0.5, 0.07), wood(0x3a2616), sx * 0.21, 0.25, sz * 0.21, false, 0, c); solid(x, z, 0.28); };
  const bed = (x: number, z: number, ry = 0, c = 0x8a3b2e) => { const b = new THREE.Group(); b.position.set(x, 0, z); b.rotation.y = ry; g.add(b); add(B(1.5, 0.35, 2.2), plank(0x5a3a22), 0, 0.3, 0, true, 0, b); add(B(1.4, 0.2, 2.0), std(0xe6dcc6), 0, 0.55, 0, true, 0, b); add(B(1.45, 0.12, 1.2), new THREE.MeshToonMaterial({ color: c }), 0, 0.68, 0.45, false, 0, b); add(B(0.9, 0.16, 0.45), std(0xf4eedc), 0, 0.7, -0.78, false, 0, b); add(B(1.6, 0.9, 0.1), plank(0x4a2e1a), 0, 0.7, -1.1, true, 0, b); solid(x, z, 1.15); };
  const shelf = (x0: number, z: number, ry = 0, w = 2.0, h = 2.4, books = true) => { let x = x0; if (z < 0.9 && Math.abs(ry) < 0.1) { const c = spot('n', x0, w / 2); if (c === null) return; x = c; } const s = new THREE.Group(); s.position.set(x, 0, z); s.rotation.y = ry; g.add(s); add(B(w, h, 0.5), wood(0x4a3220), 0, h / 2, 0, true, 0, s); for (let i = 0; i < 4; i++) { const y = 0.45 + i * (h - 0.6) / 3.2; add(B(w - 0.1, 0.05, 0.46), wood(0x6a4528), 0, y, 0.02, false, 0, s); for (let k = 0; k < 7; k++) { const bk = new THREE.Mesh(B(0.12, 0.3 + (k % 3) * 0.06, 0.28), new THREE.MeshToonMaterial({ color: books ? [0x8a2a2a, 0x2a4a8a, 0x2a6a3a, 0x8a6a2a, 0x5a2a6a][(k + i) % 5] : [0xc9a24a, 0x8a8a92, 0x6a4a2a][k % 3] })); bk.position.set(-w / 2 + 0.2 + k * (w - 0.4) / 7, y + 0.18, 0.06); s.add(bk); } } solid(x, z, Math.max(0.6, w * 0.35)); };
  const barrel = (x: number, z: number, s = 1) => { add(new THREE.CylinderGeometry(0.36 * s, 0.32 * s, 0.9 * s, 10), wood(0x6a4a2c), x, 0.45 * s, z); for (const y of [0.18, 0.7]) add(new THREE.CylinderGeometry(0.375 * s, 0.375 * s, 0.05, 10), std(0x2a2a30), x, y * s, z, false); solid(x, z, 0.42 * s); };
  const crate = (x: number, z: number, s = 0.7) => { add(B(s, s, s), plank(0x6a4a2c), x, s / 2, z, true, r() * 3); solid(x, z, s * 0.7); };
  const chestI = (x: number, z: number, ry = 0) => { add(B(0.95, 0.55, 0.6), plank(0x6a4528), x, 0.28, z, true, ry); add(new THREE.CylinderGeometry(0.3, 0.3, 0.95, 8, 1, false, 0, Math.PI), plank(0x7a5532), x, 0.56, z, false, ry).rotation.set(0, ry, Math.PI / 2); add(B(0.12, 0.18, 0.05), std(0xe2c36a), x, 0.5, z + 0.3, false, ry); solid(x, z, 0.6); };
  const window_ = (x0: number, wall: 'n' | 'w') => { const x = spot(wall, x0, 0.65); if (x === null) return; const gl = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.3), new THREE.MeshBasicMaterial({ color: 0x9ac4f0 })); const f = std(0xffffff, { map: woodTex(0x3a2616) }); if (wall === 'n') { gl.position.set(x, 1.9, 0.02); g.add(gl); add(B(1.3, 0.1, 0.1), f, x, 2.58, 0.04, false); add(B(1.3, 0.1, 0.1), f, x, 1.22, 0.04, false); add(B(0.1, 1.4, 0.1), f, x - 0.6, 1.9, 0.04, false); add(B(0.1, 1.4, 0.1), f, x + 0.6, 1.9, 0.04, false); add(B(0.06, 1.3, 0.06), f, x, 1.9, 0.05, false); } else { gl.position.set(0.02, 1.9, x); gl.rotation.y = Math.PI / 2; g.add(gl); add(B(0.1, 0.1, 1.3), f, 0.04, 2.58, x, false); add(B(0.1, 0.1, 1.3), f, 0.04, 1.22, x, false); add(B(0.1, 1.4, 0.1), f, 0.04, 1.9, x - 0.6, false); add(B(0.1, 1.4, 0.1), f, 0.04, 1.9, x + 0.6, false); } };
  const hang = (x: number, z: number, c = 0xffc070, i = 38) => { add(new THREE.CylinderGeometry(0.02, 0.02, 0.8, 4), std(0x2a2a30), x, H - 0.45, z, false).visible = false; const ring = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.04, 5, 12), std(0x2a2a30)); ring.rotation.x = Math.PI / 2; ring.position.set(x, H - 0.85, z); g.add(ring); for (let k = 0; k < 4; k++) { const a = k * 1.57; add(new THREE.CylinderGeometry(0.04, 0.04, 0.2, 5), std(0xf0e6cc), x + Math.cos(a) * 0.4, H - 0.75, z + Math.sin(a) * 0.4, false); flame(x + Math.cos(a) * 0.4, H - 0.58, z + Math.sin(a) * 0.4, 0.5); } light(x, H - 1.0, z, c, i, 15); };
  const plant = (x: number, z: number) => { add(new THREE.CylinderGeometry(0.2, 0.15, 0.3, 8), std(0x8a4a2a), x, 0.15, z, false); for (let i = 0; i < 5; i++) { const l = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.7, 4), new THREE.MeshToonMaterial({ color: 0x3f7a3a })); l.position.set(x + Math.cos(i) * 0.12, 0.6, z + Math.sin(i) * 0.12); l.rotation.set(Math.sin(i) * 0.4, 0, Math.cos(i) * 0.4); g.add(l); } solid(x, z, 0.3); };
  const banner = (x0: number, c: number) => { const x = spot('n', x0, 0.5); if (x === null) return; const b = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.6), new THREE.MeshToonMaterial({ color: c, side: THREE.DoubleSide })); b.position.set(x, 2.0, 0.06); g.add(b); add(B(1.0, 0.07, 0.08), wood(0x3a2616), x, 2.82, 0.07, false); };

  const cx = W / 2;
  if (ELF) { /* ===== CASA ÉLFICA POR DENTRO: sala redonda; a metade de trás (norte/oeste) tem parede alta de madeira clara com nervuras;
       a frente (sul) é baixa, como em toda casa vista desta câmera; o LESTE é aberto — colunas de bambu, cipós e flores — e lá fora se vê a vila ===== */
    const fl2 = new THREE.Mesh(new THREE.CircleGeometry(ER, 40), std(0xffffff, { map: plankTex(0xb89a6a) })); fl2.rotation.x = -Math.PI / 2; fl2.position.set(ECX, 0, ECZ); fl2.receiveShadow = true; g.add(fl2);
    const ivM = std(0xffffff, { map: plasterTex(0xd8cfb0) }), ribM = wood(0x9a7a52), bamM = std(0xc8b870), nodeM = std(0x8a7a40), vineM = std(0x4a8a4a), leafM = std(0x6fa66a);
    const N = 36, seg = 2 * Math.PI * ER / N + 0.06, OPEN = (f: number) => Math.cos(f) > 0.55 && Math.sin(f) < 0.75, DOOR = (f: number) => Math.abs(f - Math.PI / 2) < 0.32;
    for (let k = 0; k < N; k++) { const f = -Math.PI + (k + 0.5) / N * Math.PI * 2; if (DOOR(f) || OPEN(f)) continue;
      const back = Math.sin(f) < 0.15 && Math.cos(f) < 0.35, h = back ? 3.2 : 0.6, x = ECX + Math.cos(f) * (ER + 0.12), z = ECZ + Math.sin(f) * (ER + 0.12), ry = Math.atan2(-Math.cos(f), -Math.sin(f));
      add(B(seg, h, 0.22), ivM, x, h / 2, z, true, ry); if (back && k % 3 === 0) add(new THREE.CylinderGeometry(0.07, 0.09, h + 0.1, 5), ribM, ECX + Math.cos(f) * (ER - 0.02), (h + 0.1) / 2, ECZ + Math.sin(f) * (ER - 0.02), false); }
    /* batente da porta em arco */ for (const s2 of [-1, 1]) { const f = Math.PI / 2 + s2 * 0.34; add(new THREE.CylinderGeometry(0.1, 0.12, 2.4, 6), ribM, ECX + Math.cos(f) * ER, 1.2, ECZ + Math.sin(f) * ER, false); }
    /* o lado aberto: bambus com nós, um corrimão de bambu e cipós caindo com folhas e flores */
    for (let f = -1.0; f <= 1.0; f += 0.22) { if (!OPEN(f)) continue; const x = ECX + Math.cos(f) * ER, z = ECZ + Math.sin(f) * ER; add(new THREE.CylinderGeometry(0.07, 0.08, 3.0, 6), bamM, x, 1.5, z, false);
      for (const y of [0.7, 1.5, 2.3]) add(new THREE.TorusGeometry(0.08, 0.02, 4, 8), nodeM, x, y, z, false).rotation.x = Math.PI / 2;
      const len = 0.6 + Math.abs(Math.sin(f * 7)) * 1.4; add(new THREE.CylinderGeometry(0.018, 0.018, len, 4), vineM, x + 0.08, 3.0 - len / 2, z + 0.05, false);
      for (let q = 0; q < 3; q++) { const lf = add(new THREE.SphereGeometry(0.1, 5, 4), q === 2 && Math.sin(f * 5) > 0 ? std(0xf0a0c8) : leafM, x + 0.1, 3.0 - len * (q + 1) / 3.5, z + 0.06, false); lf.scale.set(1.2, 0.5, 0.9); } }
    { const f0 = -1.0, f1 = 1.0; for (let f = f0; f < f1; f += 0.11) { if (!OPEN(f) || !OPEN(f + 0.11)) continue; const xa = ECX + Math.cos(f) * ER, za = ECZ + Math.sin(f) * ER, xb = ECX + Math.cos(f + 0.11) * ER, zb = ECZ + Math.sin(f + 0.11) * ER;
      const rail = add(new THREE.CylinderGeometry(0.04, 0.04, Math.hypot(xb - xa, zb - za) + 0.02, 5), bamM, (xa + xb) / 2, 1.0, (za + zb) / 2, false); rail.rotation.z = Math.PI / 2; rail.rotation.y = -Math.atan2(zb - za, xb - xa); } }
    /* lá fora, pelo lado aberto: a grama da vila, arbustos, lanternas élficas acesas, troncos e copas, e uma casa vizinha */
    const out = new THREE.Mesh(new THREE.RingGeometry(ER + 0.2, ER + 11, 48), new THREE.MeshToonMaterial({ color: 0x3f6a34 })); out.rotation.x = -Math.PI / 2; out.position.set(ECX, -0.02, ECZ); g.add(out);
    for (let k = 0; k < 7; k++) { const f = -0.9 + k * 0.3, d0 = ER + 1.5 + (k % 3) * 1.6, x = ECX + Math.cos(f) * d0, z = ECZ + Math.sin(f) * d0;
      if (k % 2 === 0) { add(new THREE.CylinderGeometry(0.05, 0.06, 1.6, 5), ribM, x, 0.8, z, false); const orb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), new THREE.MeshBasicMaterial({ color: 0x9ae0ff, toneMapped: false })); orb.position.set(x, 1.7, z); g.add(orb); }
      else { const b2 = add(new THREE.SphereGeometry(0.55, 7, 5), std(0x4a7a3a), x, 0.35, z, false); b2.scale.set(1.2, 0.7, 1); } }
    for (const [f, d0] of [[-0.55, ER + 6], [0.15, ER + 7.5], [0.6, ER + 5.5]] as [number, number][]) { const x = ECX + Math.cos(f) * d0, z = ECZ + Math.sin(f) * d0; add(new THREE.CylinderGeometry(0.3, 0.42, 4.5, 7), wood(0x5a4030), x, 2.25, z, false); const cp = add(new THREE.SphereGeometry(2.0, 8, 6), std(0x5a8a4a), x, 5.0, z, false); cp.scale.set(1, 0.7, 1); }
    { const f = 0.35, d0 = ER + 8.5, x = ECX + Math.cos(f) * d0, z = ECZ + Math.sin(f) * d0; add(new THREE.CylinderGeometry(1.6, 1.7, 2.6, 14), ivM, x, 1.3, z, false); add(new THREE.ConeGeometry(2.4, 1.6, 14), std(0x6fa66a), x, 3.3, z, false); }
    const at = (f: number, d0: number) => [ECX + Math.cos(f) * d0, ECZ + Math.sin(f) * d0] as [number, number];
    /* FOGÃO DE PEDRA (no lugar da lareira): base redonda de pedra musgosa, boca acesa, panela em cima e cano de pedra até o teto */
    { const [x, z] = at(-2.35, ER - 0.9), sm = std(0xffffff, { map: stoneTex(0x8a9a80) }); add(new THREE.CylinderGeometry(0.62, 0.72, 0.85, 12), sm, x, 0.43, z); add(B(0.5, 0.35, 0.3), std(0x0a0605), x + 0.35, 0.35, z + 0.45, false, -0.6);
      add(new THREE.CylinderGeometry(0.32, 0.26, 0.32, 10), std(0x3a3a40), x, 1.02, z); add(new THREE.CylinderGeometry(0.16, 0.2, 2.2, 8), sm, x - 0.2, 2.1, z - 0.2);
      flame(x + 0.32, 0.3, z + 0.48, 0.8); light(x, 1.0, z + 0.6, 0xffa050, 42, 12); solid(x, z, 0.9); }
    /* cama baixa de folhas, encostada na parede de trás */
    { const [x, z] = at(-1.2, ER - 1.2), bg = new THREE.Group(); bg.position.set(x, 0, z); bg.rotation.y = Math.atan2(ECX - x, ECZ - z); g.add(bg);
      add(B(1.5, 0.25, 2.1), wood(0x9a7a52), 0, 0.13, 0, true, 0, bg); add(B(1.4, 0.16, 1.9), std(0x7aa868), 0, 0.33, 0, true, 0, bg); add(B(1.0, 0.14, 0.5), std(0xe8f0d0), 0, 0.46, -0.65, true, 0, bg);
      for (let q = 0; q < 5; q++) { const lf = add(new THREE.SphereGeometry(0.22, 6, 4), leafM, (q - 2) * 0.32, 0.43, 0.6, false, 0, bg); lf.scale.set(1, 0.3, 1.4); } solid(x, z, 1.2); }
    /* mesa de toco com três almofadas */
    { const x = ECX - 0.2, z = ECZ - ER * 0.1; add(new THREE.CylinderGeometry(0.6, 0.7, 0.72, 12), wood(0x8a6a44), x, 0.36, z); add(new THREE.CylinderGeometry(0.64, 0.64, 0.06, 12), plank(0xb89a6a), x, 0.74, z);
      plate(x - 0.25, 0.78, z); mug(x + 0.25, 0.78, z + 0.1); for (let q = 0; q < 3; q++) { const f = q / 3 * Math.PI * 2 + 0.5, cu = add(new THREE.CylinderGeometry(0.32, 0.34, 0.18, 10), std([0x8a5aa8, 0x5a8aa8, 0xc8a050][q]), x + Math.cos(f) * 1.1, 0.09, z + Math.sin(f) * 1.1); void cu; } solid(x, z, 0.8); }
    /* estante baixa curva de jarros e livros, baú, plantas em vasos e lanternas suspensas */
    { const [x, z] = at(-1.9, ER - 0.55); const sh = new THREE.Group(); sh.position.set(x, 0, z); sh.rotation.y = Math.atan2(ECX - x, ECZ - z); g.add(sh); add(B(1.6, 1.6, 0.4), wood(0x9a7a52), 0, 0.8, 0, true, 0, sh);
      for (let q = 0; q < 6; q++) add(new THREE.CylinderGeometry(0.09, 0.08, 0.24, 8), std([0x6ab0c8, 0xc8a050, 0x8a5aa8][q % 3]), -0.6 + q * 0.24, 1.2 - (q % 2) * 0.55, 0.05, false, 0, sh); solid(x, z, 0.8); }
    { const [x, z] = at(-0.6, ER - 0.8); chestI(x, z, Math.atan2(ECX - x, ECZ - z)); }
    for (const f of [-1.15, 1.15, 2.6]) { const [x, z] = at(f, ER - 0.55); plant(x, z); }
    hang(ECX, ECZ, 0xb8e8ff, 30); hang(ECX - ER * 0.45, ECZ - ER * 0.3, 0xffd890, 24);
  } else if (variant === 0) { // cabana
    fireplace(W * 0.7); window_(W * 0.28, 'n'); window_(D * 0.5, 'w');
    bed(1.3, 1.5, 0, 0x8a3b2e); shelf(W * 0.45, 0.35, 0, 1.6); rug(cx, D * 0.55, W * 0.5, D * 0.4, 0x7a3a2a);
    table(cx, D * 0.55, 1.6, 0.9); chair(cx - 0.6, D * 0.55 + 0.8, Math.PI); chair(cx + 0.6, D * 0.55 + 0.8, Math.PI); plate(cx - 0.4, 0.87, D * 0.55); mug(cx + 0.4, 0.87, D * 0.55);
    barrel(W - 1.0, D - 1.2); barrel(W - 1.0, D - 2.0, 0.8); chestI(1.0, D - 1.2); plant(W - 0.9, 3.4); hang(cx, D * 0.5, 0xffc070, 30);
  } else if (variant === 1) { // sobrado: sala comum
    fireplace(cx); window_(W * 0.2, 'n'); window_(W * 0.8, 'n'); window_(D * 0.35, 'w'); window_(D * 0.7, 'w');
    rug(cx, D * 0.55, W * 0.55, D * 0.45, 0x2f4a6a);
    table(cx, D * 0.55, 3.2, 1.1); for (const s of [-1, 1]) for (const k of [-1, 0, 1]) chair(cx + k * 1.0, D * 0.55 + s * 1.05, s > 0 ? Math.PI : 0);
    for (const k of [-1, 0, 1]) { plate(cx + k * 1.0, 0.87, D * 0.55 - 0.2); mug(cx + k * 1.0, 0.87, D * 0.55 + 0.25); }
    shelf(1.0, 3.2, Math.PI / 2, 2.2); shelf(1.0, D - 3.0, Math.PI / 2, 2.2, 2.4, false);
    // escada para o andar de cima
    for (let i = 0; i < 8; i++) add(B(1.2, 0.2, 0.38), plank(0x5a3a22), W - 1.3, 0.12 + i * 0.3, 0.6 + i * 0.4, true); solid(W - 1.3, 1.8, 1.4);
    { /* a escada leva a um sótão de verdade: mezanino de tábuas com corrimão (antes subia para o nada) */ const ly = 2.52, lw = Math.min(3.2, W * 0.4), ld = 2.4;
      add(B(lw, 0.12, ld), plank(0x5a3a22), W - lw / 2, ly, 3.4 + ld / 2 - 0.2, false); add(B(0.06, 0.7, ld), wood(0x3a2616), W - lw + 0.03, ly + 0.4, 3.4 + ld / 2 - 0.2, false); add(B(0.06, 0.06, ld), wood(0x5a3a22), W - lw + 0.03, ly + 0.76, 3.4 + ld / 2 - 0.2, false);
      add(B(lw - 1.3, 0.06, 0.06), wood(0x5a3a22), W - (lw - 1.3) / 2, ly + 0.76, 3.4 - 0.2, false); add(B(lw - 1.3, 0.7, 0.06), wood(0x3a2616), W - (lw - 1.3) / 2, ly + 0.4, 3.4 - 0.2, false);
      add(B(0.9, 0.5, 0.9), plank(0x6a4528), W - 0.7, ly + 0.31, 3.4 + ld - 0.8, false); add(B(1.6, 0.25, 0.9), std(0x8a6a4a), W - lw + 1.0, ly + 0.18, 3.4 + ld - 0.8, false); }
    barrel(W - 0.9, D - 1.0); crate(W - 1.9, D - 0.9); chestI(1.2, D - 1.2); plant(W - 0.8, D * 0.5); hang(cx - 2, D * 0.55, 0xffc070, 34); hang(cx + 2, D * 0.55, 0xffc070, 34); banner(W * 0.35, 0x2a4a8a); banner(W * 0.65, 0x8a2a2a);
  } else if (variant === 2) { // casa em L: quarto + cozinha
    fireplace(W * 0.78); window_(W * 0.3, 'n'); window_(D * 0.3, 'w');
    bed(1.4, 1.6, 0, 0x2f5a8a); bed(3.3, 1.6, 0, 0x8a6a2a); chestI(1.2, 3.8, Math.PI / 2); shelf(W * 0.52, 0.35, 0, 1.8); rug(2.6, 3.6, 3.0, 2.0, 0x5a2a6a);
    table(W * 0.62, D * 0.62, 2.0, 1.0); chair(W * 0.62 - 0.7, D * 0.62 + 0.85, Math.PI); chair(W * 0.62 + 0.7, D * 0.62 + 0.85, Math.PI); chair(W * 0.62 + 1.55, D * 0.62, -Math.PI / 2);
    plate(W * 0.62 - 0.5, 0.87, D * 0.62); mug(W * 0.62 + 0.5, 0.87, D * 0.62);
    // bancada de cozinha
    add(B(0.7, 0.95, 3.0), plank(0x5a3a22), 0.6, 0.48, D * 0.62 + 0.2); solid(0.7, D * 0.62 + 0.2, 1.4); add(new THREE.CylinderGeometry(0.25, 0.22, 0.3, 8), std(0x2a2a30), 0.6, 1.1, D * 0.62);
    barrel(W - 0.9, D - 1.1); crate(W - 1.8, D - 0.9, 0.6); plant(W - 0.8, 3.0); hang(W * 0.5, D * 0.5, 0xffc070, 30);
  } else if (variant === 3) { // torre do mago
    window_(W * 0.5, 'n'); window_(D * 0.5, 'w');
    rug(cx, D * 0.55, Math.min(W, D) * 0.7, Math.min(W, D) * 0.7, 0x3a2a6a);
    shelf(W * 0.25, 0.35, 0, 2.2, 3.0); shelf(W * 0.75, 0.35, 0, 2.2, 3.0); shelf(0.35, D * 0.35, Math.PI / 2, 2.4, 3.0); shelf(0.35, D * 0.72, Math.PI / 2, 2.4, 3.0);
    table(cx, D * 0.5, 2.2, 1.1); // mesa com livro e cristal
    add(B(0.5, 0.06, 0.38), std(0x8a2a2a), cx - 0.5, 0.9, D * 0.5, false, 0.3);
    const cry = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), new THREE.MeshBasicMaterial({ color: 0xa88bff })); cry.position.set(cx + 0.5, 1.3, D * 0.5); g.add(cry); add(new THREE.CylinderGeometry(0.2, 0.25, 0.14, 8), std(0x3a3a44), cx + 0.5, 0.92, D * 0.5, false); light(cx + 0.5, 1.5, D * 0.5, 0x9a7bff, 40, 14);
    chair(cx, D * 0.5 + 1.0, Math.PI);
    // caldeirão
    add(new THREE.SphereGeometry(0.55, 10, 8, 0, 6.283, 0, 2.2), std(0x1c1c22), W - 1.6, 0.6, D - 1.8); const bub = new THREE.Mesh(new THREE.CircleGeometry(0.42, 10), new THREE.MeshBasicMaterial({ color: 0x66ff9a })); bub.rotation.x = -Math.PI / 2; bub.position.set(W - 1.6, 0.8, D - 1.8); g.add(bub); light(W - 1.6, 1.2, D - 1.8, 0x66ff9a, 22, 8); solid(W - 1.6, D - 1.8, 0.7);
    // globo
    add(new THREE.SphereGeometry(0.4, 10, 8), std(0x3a6aa0), 1.6, 1.3, D - 1.6); add(B(0.1, 0.9, 0.1), wood(0x3a2616), 1.6, 0.45, D - 1.6, false); solid(1.6, D - 1.6, 0.55);
    barrel(W - 0.9, 1.4, 0.8); hang(cx, D * 0.45, 0xb89bff, 32);
  } else if (variant === 4) { // taverna
    fireplace(W * 0.2); window_(W * 0.55, 'n'); window_(W * 0.82, 'n'); window_(D * 0.55, 'w');
    // balcão
    add(B(W * 0.5, 1.05, 0.9), plank(0x5a3a22), W * 0.62, 0.52, D * 0.3, true); add(B(W * 0.5 + 0.2, 0.1, 1.05), plank(0x7a5532), W * 0.62, 1.08, D * 0.3, true); solid(W * 0.5, D * 0.3, 1.0); solid(W * 0.72, D * 0.3, 1.0); solid(W * 0.85, D * 0.3, 0.8);
    for (let k = 0; k < 4; k++) mug(W * 0.5 + k * 0.7, 1.13, D * 0.3 + (k % 2) * 0.1);
    for (let k = 0; k < 4; k++) barrel(W * 0.42 + k * 1.1, 1.0, 0.9);
    shelf(W * 0.65, 0.35, 0, 3.6, 2.6, false);
    rug(W * 0.3, D * 0.62, 5, 3.4, 0x6a2a2a);
    for (const [tx, tz] of [[W * 0.22, D * 0.5], [W * 0.46, D * 0.62], [W * 0.22, D * 0.78], [W * 0.7, D * 0.68]] as [number, number][]) { table(tx, tz, 1.5, 1.5); for (let k = 0; k < 4; k++) chair(tx + Math.cos(k * 1.57) * 1.1, tz + Math.sin(k * 1.57) * 1.1, -k * 1.57 + 1.57 + Math.PI); mug(tx, 0.87, tz); plate(tx + 0.3, 0.87, tz + 0.2); }
    hang(W * 0.3, D * 0.6, 0xffb060, 40); hang(W * 0.68, D * 0.6, 0xffb060, 40); banner(W * 0.1, 0x8a2a2a); barrel(W - 0.9, D - 1.0); barrel(W - 0.9, D - 1.9, 0.8);
  } else if (variant === 6 || variant === 7) { // templo / igreja abandonada: nave com bancos, altar e vitrais
    const ruined = variant === 7;
    const sm = std(0xffffff, { map: stoneTex(ruined ? 0x5a564e : 0x7a766e) });
    // piso de pedra por cima do assoalho
    const st = new THREE.Mesh(new THREE.PlaneGeometry(W, D), sm.clone()); (st.material as THREE.MeshToonMaterial).map = (st.material as THREE.MeshToonMaterial).map!.clone(); (st.material as THREE.MeshToonMaterial).map!.repeat.set(W / 2, D / 2); (st.material as THREE.MeshToonMaterial).map!.needsUpdate = true; st.rotation.x = -Math.PI / 2; st.position.set(W / 2, 0.012, D / 2); g.add(st);
    // colunas
    for (const sx of [0.22, 0.78]) for (let k = 1; k <= 3; k++) { const z = D * (0.18 + k * 0.2); add(new THREE.CylinderGeometry(0.28, 0.32, H, 8), sm, W * sx, H / 2, z, false); solid(W * sx, z, 0.45); }
    // altar
    add(B(2.6, 1.0, 1.0), sm, cx, 0.5, 1.4); add(B(2.9, 0.12, 1.2), plank(ruined ? 0x3a2e24 : 0x5a3a22), cx, 1.06, 1.4); solid(cx, 1.4, 1.5);
    add(new THREE.CylinderGeometry(0.45, 0.5, 0.08, 12), std(ruined ? 0x6a6660 : 0xc9a24a), cx, 1.16, 1.4, false); // o Olho Kármico
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), new THREE.MeshBasicMaterial({ color: ruined ? 0x3a3450 : 0x9a86ff })); eye.position.set(cx, 1.5, 1.4); g.add(eye);
    if (!ruined) light(cx, 1.9, 1.6, 0x9a86ff, 46, 12);
    for (const sx of [-1, 1]) { add(new THREE.CylinderGeometry(0.06, 0.08, 1.3, 6), std(0x2a2a30), cx + sx * 1.9, 0.65, 1.6, false); if (!ruined || sx < 0) { flame(cx + sx * 1.9, 1.42, 1.6, 0.7); light(cx + sx * 1.9, 1.6, 1.6, 0xffb060, 28, 9); } }
    // bancos (bancos quebrados na igreja abandonada)
    for (let row = 0; row < 4; row++) { const z = D * 0.42 + row * 1.3; for (const sx of [-1, 1]) { const x = cx + sx * (W * 0.19); const broken = ruined && (row * 3 + sx) % 4 === 0; const pw = W * 0.28;
      add(B(pw, 0.08, 0.5), plank(ruined ? 0x3a2e24 : 0x6a4528), x, 0.5, z, true, broken ? 0.3 : 0); if (!broken) { add(B(pw, 0.5, 0.08), plank(ruined ? 0x3a2e24 : 0x6a4528), x, 0.78, z + 0.25); add(B(0.08, 0.5, 0.5), wood(0x3a2616), x - pw / 2, 0.25, z, false); add(B(0.08, 0.5, 0.5), wood(0x3a2616), x + pw / 2, 0.25, z, false); }
      for (const f of [-0.34, 0, 0.34]) solid(x + pw * f, z, Math.max(0.4, pw * 0.2)); } } /* banco inteiro barra (antes dava para atravessar pelo meio) */
    // vitrais: três na parede norte (médio, rosácea, médio) e dois na oeste; a luz colorida desenha o chão
    { const fm = std(0xffffff, { map: stoneTex(0x4a4640) }), md = ruined ? 'ruin' : 'in', k0 = Math.abs(seed) % 4;
      const N: [Tam, number][] = [['m', 0.2], ['g', 0.5], ['m', 0.8]];
      N.forEach(([sz, sx], i) => { const t = TEMAS[(k0 + i) % 4], sc = sz === 'g' ? Math.min(0.95, (H - 0.8) / 2.2) : 0.92, hw = (sz === 'g' ? 2.2 : 1.0) * sc / 2 + 0.2; wallUse.n.push([W * sx - hw, W * sx + hw]); const v = vitral(t, sz, fm, md, sc); v.position.set(W * sx, sz === 'g' ? 0.55 : 0.4, 0.02); g.add(v);
        const fg = floorGlow(t, sz, (sz === 'g' ? 2.0 : 1.0) * 1.25, sz === 'g' ? 2.6 : 2.9, ruined ? 0.14 : 0.62); fg.position.set(W * sx, 0.03, 1.0 + (sz === 'g' ? 1.4 : 1.5)); g.add(fg); });
      for (let i = 0; i < 2; i++) { const t = TEMAS[(k0 + 3 + i) % 4], z = D * (0.42 + i * 0.3); wallUse.w.push([z - 0.66, z + 0.66]); const v = vitral(t, 'm', fm, md, 0.92); v.rotation.y = Math.PI / 2; v.position.set(0.02, 0.4, z); g.add(v);
        const fg = floorGlow(t, 'm', 1.15, 2.8, ruined ? 0.12 : 0.55); fg.rotation.z = Math.PI / 2; fg.position.set(1.6, 0.031, z); g.add(fg); } }
    rug(cx, D * 0.6, 1.8, D * 0.62, ruined ? 0x3a2a2a : 0x6a2a3a);
    if (ruined) { for (let k = 0; k < 7; k++) { const x = 0.8 + r() * (W - 1.6), z = 1 + r() * (D - 2); add(new THREE.DodecahedronGeometry(0.2 + r() * 0.2, 0), sm, x, 0.15, z, false, r() * 3); } for (let k = 0; k < 4; k++) banner(W * (0.15 + k * 0.23), 0x3a3448); }
    else { hang(W * 0.3, D * 0.55, 0xffc070, 36); hang(W * 0.7, D * 0.55, 0xffc070, 36); banner(W * 0.15, 0x6a3a8a); banner(W * 0.85, 0x6a3a8a); }
  } else if (variant === 30) { // ESCOLA DE GUERRA (02/11): salão de treino — arena de areia no meio, bonecos, estantes de armas, estandartes e a mesa do mestre
    const sm = std(0xffffff, { map: stoneTex(0x7a766e) });
    { const st = new THREE.Mesh(new THREE.PlaneGeometry(W, D), sm.clone()); (st.material as THREE.MeshToonMaterial).map = (st.material as THREE.MeshToonMaterial).map!.clone(); (st.material as THREE.MeshToonMaterial).map!.repeat.set(W / 2, D / 2); (st.material as THREE.MeshToonMaterial).map!.wrapS = (st.material as THREE.MeshToonMaterial).map!.wrapT = THREE.RepeatWrapping; (st.material as THREE.MeshToonMaterial).map!.needsUpdate = true; st.rotation.x = -Math.PI / 2; st.position.set(W / 2, 0.02, D / 2); st.receiveShadow = true; g.add(st); }
    for (const sx of [0.15, 0.85]) for (let k = 1; k <= 3; k++) { const z = D * (0.15 + k * 0.2); add(new THREE.CylinderGeometry(0.26, 0.3, H, 8), sm, W * sx, H / 2, z, false); solid(W * sx, z, 0.42); }
    { /* arena de areia: círculo baixo com borda de madeira */ const ar = Math.min(W, D) * 0.22; const sand = new THREE.Mesh(new THREE.CircleGeometry(ar, 24), std(0xc8b088)); sand.rotation.x = -Math.PI / 2; sand.position.set(cx, 0.035, D * 0.55); g.add(sand); add(new THREE.TorusGeometry(ar, 0.06, 6, 28), wood(0x4a3220), cx, 0.06, D * 0.55, false).rotation.x = Math.PI / 2; }
    { /* bonecos de treino: dois na arena */ for (const sx of [-1, 1]) { const x = cx + sx * Math.min(W, D) * 0.12, z = D * 0.55 + sx * 0.3; add(new THREE.CylinderGeometry(0.07, 0.09, 1.2, 6), wood(0x5a3a22), x, 0.6, z, false); add(new THREE.CylinderGeometry(0.26, 0.3, 0.8, 8), std(0xc8b088), x, 1.5, z); add(new THREE.SphereGeometry(0.2, 8, 6), std(0xc8b088), x, 2.1, z, false); add(B(1.1, 0.14, 0.14), wood(0x5a3a22), x, 1.6, z, false); solid(x, z, 0.35); } }
    { /* estantes de armas na parede norte: lanças, espadas e escudos */ for (let k = 0; k < 3; k++) { const x = W * (0.2 + k * 0.3); add(B(1.8, 0.12, 0.12), wood(0x3a2616), x, 1.0, 0.12, false); add(B(1.8, 0.12, 0.12), wood(0x3a2616), x, 2.0, 0.12, false);
        for (let j = 0; j < 4; j++) { const wx = x - 0.7 + j * 0.46; if ((j + k) % 2) { add(B(0.05, 1.5, 0.05), wood(0x5a3a22), wx, 1.5, 0.2, false); add(new THREE.ConeGeometry(0.06, 0.3, 5), std(0xc8ccd4), wx, 2.35, 0.2, false); } else { add(B(0.06, 1.0, 0.03), std(0xc8ccd4), wx, 1.55, 0.2, false); add(B(0.26, 0.05, 0.05), std(0xd9a441), wx, 1.05, 0.2, false); } }
        add(new THREE.CylinderGeometry(0.3, 0.3, 0.05, 12), std([0x8a2a2a, 0x2a4a8a, 0x5a6a34][k]), x + 0.9, 1.5, 0.2, false).rotation.x = Math.PI / 2; } for (let k = 0; k < 3; k++) solid(W * (0.2 + k * 0.3), 0.25, 0.9); }
    { /* mesa do mestre de armas com mapas e um elmo */ table(W * 0.8, D * 0.85, 2.0, 1.0); add(B(0.6, 0.02, 0.4), std(0xe8dcc0), W * 0.8 - 0.3, 0.88, D * 0.85, false).rotation.y = 0.2; add(new THREE.SphereGeometry(0.16, 8, 6, 0, 6.283, 0, 1.9), std(0x9aa0a8), W * 0.8 + 0.5, 0.95, D * 0.85, false); chair(W * 0.8, D * 0.85 + 0.9, Math.PI); }
    barrel(1.0, D - 1.0); barrel(1.9, D - 0.9, 0.85); crate(1.1, D - 1.9); hang(cx - 2.2, D * 0.5, 0xffc070, 40); hang(cx + 2.2, D * 0.5, 0xffc070, 40); banner(W * 0.1, 0x8a2a2a); banner(W * 0.9, 0x8a2a2a); banner(W * 0.5, 0xd9a441); rug(W * 0.8, D * 0.85, 2.8, 2.2, 0x6a2a2a);
  } else if (variant === 31) { // FORJA DE ASKAVIK (02/11): fornalha grande, bigornas, tanque de têmpera, foles, barras de ferro e o balcão do mestre-ferreiro
    const sm = std(0xffffff, { map: stoneTex(0x5a564e) }), iron = std(0x4a4e56);
    { const st = new THREE.Mesh(new THREE.PlaneGeometry(W, D), sm.clone()); (st.material as THREE.MeshToonMaterial).map = (st.material as THREE.MeshToonMaterial).map!.clone(); (st.material as THREE.MeshToonMaterial).map!.repeat.set(W / 2, D / 2); (st.material as THREE.MeshToonMaterial).map!.wrapS = (st.material as THREE.MeshToonMaterial).map!.wrapT = THREE.RepeatWrapping; (st.material as THREE.MeshToonMaterial).map!.needsUpdate = true; st.rotation.x = -Math.PI / 2; st.position.set(W / 2, 0.02, D / 2); st.receiveShadow = true; g.add(st); }
    { /* fornalha: bloco de pedra com boca de fogo e chaminé */ const fx = W * 0.3, fz = 1.3; add(B(3.0, 2.2, 1.6), sm, fx, 1.1, fz); add(B(1.6, 1.6, 2.4), sm, fx, 3.0, fz - 0.2, false); const mouth = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.8), new THREE.MeshBasicMaterial({ color: 0xff6a20 })); mouth.position.set(fx, 0.8, fz + 0.81); g.add(mouth); flame(fx - 0.3, 0.5, fz + 0.7, 1.3); flame(fx + 0.25, 0.5, fz + 0.7, 1.1); light(fx, 1.4, fz + 1.4, 0xff8a3a, 60, 14); for (let k = -1; k <= 1; k++) solid(fx + k * 1.0, fz, 0.85);
      /* fole de couro ao lado */ add(B(0.9, 0.3, 0.5), std(0x6a3a22), fx + 2.0, 0.6, fz, false).rotation.z = 0.15; add(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 5), wood(0x3a2616), fx + 2.4, 0.9, fz, false).rotation.z = -0.5; add(new THREE.CylinderGeometry(0.08, 0.06, 0.5, 6), iron, fx + 1.5, 0.75, fz, false).rotation.z = Math.PI / 2; }
    { /* bigornas sobre toco: duas */ for (const [x, z] of [[W * 0.3, D * 0.42], [W * 0.55, D * 0.42]] as [number, number][]) { add(new THREE.CylinderGeometry(0.3, 0.34, 0.6, 8), wood(0x4a3220), x, 0.3, z); add(B(0.9, 0.26, 0.34), iron, x, 0.73, z); add(new THREE.ConeGeometry(0.17, 0.5, 6), iron, x + 0.62, 0.73, z, false).rotation.z = -Math.PI / 2; add(B(0.5, 0.14, 0.4), iron, x, 0.5, z, false); add(B(0.05, 0.05, 0.5), std(0x8a8e96), x - 0.2, 0.9, z, false).rotation.y = 0.6; solid(x, z, 0.55); } }
    { /* tanque de têmpera e barril de água */ const tx = W * 0.78, tz = D * 0.4; add(new THREE.CylinderGeometry(0.55, 0.5, 0.6, 12), wood(0x3a2616), tx, 0.3, tz); const wat = new THREE.Mesh(new THREE.CircleGeometry(0.5, 12), new THREE.MeshBasicMaterial({ color: 0x2a4a6a })); wat.rotation.x = -Math.PI / 2; wat.position.set(tx, 0.58, tz); g.add(wat); solid(tx, tz, 0.6); }
    { /* barras, espadas em bruto e ferraduras pela parede oeste; cestos de carvão */ for (let k = 0; k < 5; k++) add(B(0.08, 0.08, 1.3), iron, 0.5, 0.05 + (k % 3) * 0.09, D * 0.55 + k * 0.12, false); for (let k = 0; k < 4; k++) add(new THREE.TorusGeometry(0.12, 0.03, 6, 10, Math.PI * 1.5), std(0x6a6e76), 0.08, 1.2 + (k % 2) * 0.35, D * 0.25 + k * 0.4, false).rotation.y = Math.PI / 2; for (let k = 0; k < 3; k++) add(B(0.06, 1.0, 0.03), std(0xc8ccd4), 0.15, 1.6, D * 0.65 + k * 0.3, false).rotation.y = Math.PI / 2;
      for (const [x, z] of [[1.0, D - 1.0], [1.8, D - 1.2]] as [number, number][]) { add(new THREE.CylinderGeometry(0.4, 0.34, 0.5, 10), wood(0x4a3220), x, 0.25, z); add(new THREE.SphereGeometry(0.34, 8, 6), std(0x1a1a1e), x, 0.5, z, false).scale.set(1, 0.6, 1); solid(x, z, 0.45); } }
    /* balcão de venda do mestre-ferreiro: armas prontas por cima */
    add(B(W * 0.5, 1.0, 0.8), plank(0x5a3a22), cx + 1.0, 0.5, D * 0.7, true); add(B(W * 0.5 + 0.2, 0.1, 1.0), plank(0x7a5532), cx + 1.0, 1.05, D * 0.7, true); for (const f of [-0.3, 0, 0.3]) solid(cx + 1.0 + W * 0.5 * f, D * 0.7, 0.9);
    for (let k = 0; k < 3; k++) { const sw = new THREE.Mesh(B(0.07, 0.03, 0.9), std(0xc8ccd4)); sw.position.set(cx - 0.4 + k * 0.9, 1.13, D * 0.7); sw.rotation.y = 0.3 * (k - 1); g.add(sw); } add(new THREE.SphereGeometry(0.16, 8, 6, 0, 6.283, 0, 1.9), std(0x9aa0a8), cx + 2.4, 1.2, D * 0.7, false);
    hang(cx, D * 0.55, 0xffb060, 38); banner(W * 0.85, 0x7a4a2a);
  } else if (variant === 32) { // UNIVERSIDADE DOS MIL MECANISMOS (02/11): anfiteatro de bancos, lousa, planetário de latão girando, estantes e máquinas
    const brass = std(0xd9a441, { emissive: new THREE.Color(0x3a2408), emissiveIntensity: 0.25 }), iron = std(0x4a4e56);
    window_(W * 0.25, 'n'); window_(W * 0.75, 'n'); window_(D * 0.4, 'w'); window_(D * 0.7, 'w');
    { /* lousa com equações e a mesa do lente */ add(B(3.2, 1.8, 0.1), std(0x1e2a26), cx, 1.7, 0.2, false); add(B(3.3, 0.08, 0.14), wood(0x5a3a22), cx, 0.78, 0.2, false); for (let k = 0; k < 6; k++) add(B(0.5 + (k % 3) * 0.3, 0.02, 0.01), std(0xe8e4d8), cx - 1.0 + (k % 2) * 1.3, 2.3 - Math.floor(k / 2) * 0.35, 0.26, false); add(new THREE.TorusGeometry(0.22, 0.02, 5, 14), std(0xe8e4d8), cx + 1.0, 1.4, 0.26, false);
      table(cx, D * 0.22, 2.4, 0.9); add(B(0.34, 0.06, 0.26), std(0x5a2a3a), cx - 0.6, 0.9, D * 0.22, false); add(new THREE.SphereGeometry(0.14, 10, 8), brass, cx + 0.5, 1.0, D * 0.22, false); add(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 5), brass, cx + 0.5, 0.95, D * 0.22, false); }
    { /* planetário: eixo de latão com esferas em braços, no centro — gira (userData.dyn) */ const px = W * 0.5, pz = D * 0.52; add(new THREE.CylinderGeometry(0.5, 0.6, 0.3, 12), iron, px, 0.15, pz); add(new THREE.CylinderGeometry(0.05, 0.07, 1.6, 6), brass, px, 1.1, pz, false); const sol = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffd060 })); sol.position.set(px, 1.95, pz); g.add(sol);
      const orr = new THREE.Group(); orr.position.set(px, 1.95, pz); orr.userData.dyn = true; g.add(orr); spin.push(orr); for (let k = 0; k < 3; k++) { const rr = 0.45 + k * 0.32, ring = new THREE.Mesh(new THREE.TorusGeometry(rr, 0.015, 5, 32), brass); ring.rotation.x = Math.PI / 2 + (k - 1) * 0.12; orr.add(ring); const pl = new THREE.Mesh(new THREE.SphereGeometry(0.05 + k * 0.02, 8, 6), std([0x6ad0ff, 0xc86a3a, 0x9ad77a][k])); pl.position.set(Math.cos(k * 2.1) * rr, 0, Math.sin(k * 2.1) * rr); orr.add(pl); }
      light(px, 2.4, pz, 0xffd080, 30, 10); solid(px, pz, 0.7); }
    { /* bancos do anfiteatro em arco, de frente para a lousa */ const n = 3; for (let row = 0; row < n; row++) { const rad = D * 0.3 + row * 1.2; for (let k = -2; k <= 2; k++) { const a = k * 0.26, x = cx + Math.sin(a) * rad, z = D * 0.2 + Math.cos(a) * rad; if (z > D - 1.2) continue; const bw = 1.3; add(B(bw, 0.08, 0.4), plank(0x6a4528), x, 0.48, z, true, -a); add(B(bw, 0.42, 0.06), plank(0x6a4528), x + Math.sin(a) * 0.2, 0.74, z + Math.cos(a) * 0.2, false, -a); add(B(bw, 0.05, 0.3), plank(0x7a5532), x - Math.sin(a) * 0.4, 0.8, z - Math.cos(a) * 0.4, false, -a); for (const f of [-0.3, 0.3]) solid(x + Math.cos(a) * bw * f, z - Math.sin(a) * bw * f, 0.35); } } }
    shelf(W * 0.9, D * 0.5, Math.PI / 2, 2.4, 2.8, true); shelf(W * 0.9, D * 0.78, Math.PI / 2, 2.0, 2.8, true);
    { /* máquina de cálculo a vapor no canto: caixa com manivela, mostradores e tubos */ const mx = 1.2, mz = D - 1.4; add(B(1.4, 1.2, 0.9), iron, mx, 0.6, mz); add(B(1.5, 0.08, 1.0), brass, mx, 1.24, mz, false); for (let k = 0; k < 3; k++) add(new THREE.CylinderGeometry(0.12, 0.12, 0.04, 12), std(0xf0ecd8), mx - 0.4 + k * 0.4, 0.9, mz + 0.46, false).rotation.x = Math.PI / 2; add(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 6), brass, mx + 0.8, 0.9, mz, false).rotation.z = Math.PI / 2; add(new THREE.CylinderGeometry(0.03, 0.03, 0.3, 5), wood(0x3a2616), mx + 1.05, 1.05, mz, false); for (let k = 0; k < 2; k++) add(new THREE.CylinderGeometry(0.05, 0.05, 1.0, 6), std(0x8a6a3a), mx - 0.3 + k * 0.6, 1.75, mz - 0.2, false); solid(mx, mz, 0.9); }
    hang(cx - 2.4, D * 0.6, 0xffe0a0, 36); hang(cx + 2.4, D * 0.6, 0xffe0a0, 36); banner(W * 0.08, 0x2a4a8a); banner(W * 0.92, 0x2a4a8a); rug(cx, D * 0.22, 3.6, 1.6, 0x2a3a5a);
  } else if (variant === 8 || variant === 9) { // criptas da Catedral (8) e o santuário do Sacerdote Maldito (9)
    const boss = variant === 9;
    const sm = std(0xffffff, { map: stoneTex(boss ? 0x3a3038 : 0x4a4640) });
    const st = new THREE.Mesh(new THREE.PlaneGeometry(W, D), sm.clone()); (st.material as THREE.MeshToonMaterial).map = (st.material as THREE.MeshToonMaterial).map!.clone(); (st.material as THREE.MeshToonMaterial).map!.repeat.set(W / 2, D / 2); st.rotation.x = -Math.PI / 2; st.position.set(W / 2, 0.012, D / 2); g.add(st);
    // pilares em duas fileiras
    for (const sx of [0.2, 0.8]) for (let k = 0; k <= 3; k++) { const z = D * (0.14 + k * 0.24); add(new THREE.CylinderGeometry(0.3, 0.36, H, 8), sm, W * sx, H / 2, z, false); solid(W * sx, z, 0.5); }
    // escada que desce (boca escura no fundo, ao norte) — ou, no santuário, o altar negro
    if (!boss) {
      const pit = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.2), new THREE.MeshBasicMaterial({ color: 0x030205 })); pit.rotation.x = -Math.PI / 2; pit.position.set(cx, 0.03, 1.5); g.add(pit);
      for (let k = 0; k < 4; k++) add(B(2.4, 0.12, 0.4), sm, cx, 0.06 - k * 0.14, 2.6 - k * 0.45, false);
      add(B(0.3, 1.2, 2.4), sm, cx - 1.35, 0.6, 1.5, false); add(B(0.3, 1.2, 2.4), sm, cx + 1.35, 0.6, 1.5, false);
      flame(cx - 1.35, 1.35, 1.0, 0.8); flame(cx + 1.35, 1.35, 1.0, 0.8); light(cx, 1.3, 1.6, 0xff8a3a, 30, 10);
    } else {
      add(B(3.2, 1.1, 1.2), std(0x1a1218), cx, 0.55, 1.6); add(B(3.5, 0.12, 1.4), std(0x2a1a2a), cx, 1.16, 1.6); solid(cx, 1.6, 1.8);
      const eye = new THREE.Mesh(new THREE.OctahedronGeometry(0.34, 0), new THREE.MeshBasicMaterial({ color: 0xb3202f })); eye.position.set(cx, 1.7, 1.6); g.add(eye); light(cx, 2.0, 1.9, 0xb3202f, 60, 14);
      for (const sx of [-1, 1]) for (const z of [1.2, D * 0.5, D * 0.8]) { add(new THREE.CylinderGeometry(0.22, 0.28, 0.9, 8), std(0x2a2a30), cx + sx * (W * 0.36), 0.45, z, false); flame(cx + sx * (W * 0.36), 1.0, z, 1.2); light(cx + sx * (W * 0.36), 1.3, z, 0x8f3aff, 28, 9); solid(cx + sx * (W * 0.36), z, 0.4); }
      rug(cx, D * 0.5, 4.2, 4.2, 0x3a1020);
    }
    // sarcófagos e ossadas
    const nS = boss ? 4 : 6;
    for (let k = 0; k < nS; k++) { const x = W * (k % 2 ? 0.34 : 0.66) + (r() - 0.5) * 1.2, z = D * 0.3 + Math.floor(k / 2) * (D * 0.2) + (r() - 0.5); add(B(1.0, 0.7, 2.1), sm, x, 0.35, z, true, (r() - 0.5) * 0.3); add(B(1.1, 0.12, 2.2), std(0x5a564e), x, 0.76, z, true, (r() - 0.5) * 0.3); solid(x, z - 0.6, 0.7); solid(x, z + 0.6, 0.7); }
    for (let k = 0; k < 10; k++) { const x = 0.6 + r() * (W - 1.2), z = 0.8 + r() * (D - 1.6); add(new THREE.DodecahedronGeometry(0.12 + r() * 0.12, 0), std(0xd8d0b8), x, 0.1, z, false, r() * 3); }
    for (let k = 0; k < 5; k++) { const x = 0.8 + r() * (W - 1.6), z = 1 + r() * (D - 2); add(new THREE.DodecahedronGeometry(0.2 + r() * 0.2, 0), sm, x, 0.15, z, false, r() * 3); }
    // velas pelas paredes
    for (let k = 0; k < 6; k++) { const x = W * (0.1 + 0.16 * k); flame(x, 1.6, 0.25, 0.6); if (k % 2) light(x, 1.7, 0.4, 0xffb060, 14, 7); }
  } else if (variant === 10) { // ALQUIMISTA (02/11): caldeirão borbulhando, prateleiras de frascos coloridos, mesa de destilação e balcão
    window_(W * 0.7, 'n'); window_(D * 0.6, 'w');
    { const cx2 = W * 0.22, cz2 = 1.2; add(new THREE.CylinderGeometry(0.5, 0.42, 0.55, 12), std(0x2a2a30), cx2, 0.42, cz2); add(new THREE.TorusGeometry(0.5, 0.05, 6, 14), std(0x3a3a40), cx2, 0.7, cz2, false).rotation.x = Math.PI / 2;
      const brew = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.06, 12), new THREE.MeshBasicMaterial({ color: 0x5ad07a })); brew.position.set(cx2, 0.7, cz2); g.add(brew);
      for (let k = 0; k < 3; k++) add(new THREE.CylinderGeometry(0.06, 0.08, 0.42, 6), std(0x2a2a30), cx2 + Math.cos(k * 2.1) * 0.38, 0.21, cz2 + Math.sin(k * 2.1) * 0.38, false);
      flame(cx2 - 0.15, 0.08, cz2, 0.9); flame(cx2 + 0.12, 0.06, cz2 + 0.1, 0.7); light(cx2, 1.3, cz2, 0x6aff9a, 24, 8); solid(cx2, cz2, 0.62); }
    shelf(W * 0.5, 0.3, 0, 2.6, 2.6, false); shelf(W * 0.82, 0.3, 0, 1.6, 2.2, false);
    { /* frascos nas prateleiras */ const cols2 = [0xff5a6a, 0x5ad0ff, 0xb07aff, 0xffd24a, 0x6aff9a, 0xff9a40]; for (let sx = 0; sx < 2; sx++) for (let i = 0; i < 4; i++) for (let k = 0; k < 5; k++) { const x0 = sx === 0 ? W * 0.5 - 1.1 : W * 0.82 - 0.6, x = x0 + k * (sx === 0 ? 0.5 : 0.3), y = 0.5 + i * 0.6; const m = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.22, 7), new THREE.MeshBasicMaterial({ color: cols2[(i * 5 + k + sx) % 6] })); m.position.set(x, y, 0.3); g.add(m); add(new THREE.CylinderGeometry(0.03, 0.03, 0.08, 5), std(0x4a3220), x, y + 0.15, 0.3, false); } }
    table(W * 0.62, D * 0.42, 2.0, 0.9); /* mesa de destilação: retorta, serpentina e livro */
    { const tx = W * 0.62, tz = D * 0.42; add(new THREE.SphereGeometry(0.16, 8, 6), std(0xc8e8ff), tx - 0.5, 1.02, tz, false); add(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 5), std(0xc8e8ff), tx - 0.3, 1.2, tz, false).rotation.z = -1.0; add(new THREE.TorusGeometry(0.12, 0.025, 5, 10), std(0xd9a441), tx + 0.1, 1.1, tz, false); add(B(0.34, 0.06, 0.26), std(0x5a2a3a), tx + 0.6, 0.9, tz + 0.1, false); for (let k = 0; k < 3; k++) { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.18, 6), new THREE.MeshBasicMaterial({ color: [0xff5a6a, 0x5ad0ff, 0xffd24a][k] })); m.position.set(tx + 0.3 + k * 0.18, 0.96, tz - 0.25); g.add(m); } }
    /* balcão de venda com a balança */
    add(B(W * 0.5, 1.0, 0.8), plank(0x5a3a22), cx, 0.5, D * 0.66, true); add(B(W * 0.5 + 0.2, 0.1, 1.0), plank(0x7a5532), cx, 1.05, D * 0.66, true); for (const f of [-0.3, 0, 0.3]) solid(cx + W * 0.5 * f, D * 0.66, 0.9);
    add(new THREE.CylinderGeometry(0.03, 0.05, 0.5, 6), std(0xd9a441), cx + 0.8, 1.35, D * 0.66, false); add(B(0.5, 0.02, 0.04), std(0xd9a441), cx + 0.8, 1.58, D * 0.66, false); for (const sx of [-1, 1]) add(new THREE.CylinderGeometry(0.1, 0.1, 0.02, 8), std(0xd9a441), cx + 0.8 + sx * 0.24, 1.42, D * 0.66, false);
    for (let k = 0; k < 4; k++) { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.22, 7), new THREE.MeshBasicMaterial({ color: [0xff5a6a, 0x5ad0ff, 0xb07aff, 0x6aff9a][k] })); m.position.set(cx - 1.4 + k * 0.4, 1.2, D * 0.66); g.add(m); }
    rug(cx, D * 0.5, 3.2, 2.4, 0x3a2a5a); hang(cx, D * 0.45, 0xb07aff, 34); plant(W - 0.8, D - 1.0); plant(0.8, D - 1.2); barrel(W - 0.9, 1.0, 0.8);
  } else if (variant === 11) { // MERCADOR (02/11): armazém de secos e molhados — sacos, caixas, prateleiras de mantimentos e o balcão com a balança
    window_(W * 0.35, 'n'); window_(W * 0.75, 'n'); window_(D * 0.5, 'w');
    shelf(W * 0.22, 0.3, 0, 2.4, 2.6, false); shelf(W * 0.62, 0.3, 0, 2.4, 2.6, false);
    { /* mantimentos nas prateleiras: queijos, pães, potes e rolos de pano */ for (let sx = 0; sx < 2; sx++) for (let i = 0; i < 4; i++) for (let k = 0; k < 4; k++) { const x = (sx === 0 ? W * 0.22 : W * 0.62) - 0.9 + k * 0.6, y = 0.5 + i * 0.6, q = (i + k + sx) % 4; if (q === 0) add(new THREE.CylinderGeometry(0.16, 0.16, 0.12, 10), std(0xe8c860), x, y + 0.06, 0.3, false); else if (q === 1) add(new THREE.SphereGeometry(0.14, 8, 6), std(0xc89a5a), x, y + 0.12, 0.3, false).scale.set(1.3, 0.8, 1); else if (q === 2) add(new THREE.CylinderGeometry(0.11, 0.1, 0.24, 8), std(0x8a6a4a), x, y + 0.12, 0.3, false); else add(new THREE.CylinderGeometry(0.13, 0.13, 0.5, 8), std([0x8a2a2a, 0x2a4a8a, 0x6a8a3a][k % 3]), x, y + 0.13, 0.28, false).rotation.z = Math.PI / 2; } }
    const sack = (x: number, z: number, c = 0xc8b088) => { add(new THREE.SphereGeometry(0.42, 9, 7), std(c), x, 0.36, z).scale.set(1, 0.85, 1); add(new THREE.CylinderGeometry(0.1, 0.16, 0.2, 7), std(c), x, 0.78, z, false); solid(x, z, 0.4); };
    sack(1.0, D * 0.55); sack(1.7, D * 0.72, 0xb8a078); sack(1.0, D * 0.9, 0xa89068); crate(W - 1.0, D * 0.55); crate(W - 1.0, D * 0.75, 0.8); crate(W - 1.8, D * 0.62, 0.55); barrel(W - 0.9, 1.1); barrel(W - 1.8, 1.0, 0.85);
    add(B(W * 0.55, 1.0, 0.8), plank(0x5a3a22), cx, 0.5, D * 0.5, true); add(B(W * 0.55 + 0.2, 0.1, 1.0), plank(0x7a5532), cx, 1.05, D * 0.5, true); for (const f of [-0.3, 0, 0.3]) solid(cx + W * 0.55 * f, D * 0.5, 0.95);
    add(new THREE.CylinderGeometry(0.03, 0.05, 0.5, 6), std(0xd9a441), cx - 1.0, 1.35, D * 0.5, false); add(B(0.5, 0.02, 0.04), std(0xd9a441), cx - 1.0, 1.58, D * 0.5, false); for (const sx of [-1, 1]) add(new THREE.CylinderGeometry(0.1, 0.1, 0.02, 8), std(0xd9a441), cx - 1.0 + sx * 0.24, 1.42, D * 0.5, false);
    add(new THREE.CylinderGeometry(0.16, 0.16, 0.12, 10), std(0xe8c860), cx + 0.6, 1.16, D * 0.5, false); add(new THREE.SphereGeometry(0.14, 8, 6), std(0xc89a5a), cx + 1.1, 1.2, D * 0.5, false); plate(cx + 1.6, 1.11, D * 0.5);
    rug(cx, D * 0.78, 3.0, 2.0, 0x6a4a2a); hang(cx - 1.5, D * 0.62, 0xffc070, 36); hang(cx + 1.5, D * 0.62, 0xffc070, 36); banner(W * 0.5, 0x3a6a3a);
  } else if (variant === 12) { // DOMADOR (02/11): baias com feno, gaiolas, selas e arreios nas paredes e o balcão
    window_(W * 0.6, 'n'); window_(D * 0.5, 'w');
    const hay = (x: number, z: number, s = 1) => { add(new THREE.SphereGeometry(0.5 * s, 8, 6), std(0xd4b25a), x, 0.3 * s, z).scale.set(1.2, 0.6, 1); solid(x, z, 0.5 * s); };
    { /* baias ao fundo: cercas baixas de madeira com feno dentro */ for (const bx of [W * 0.18, W * 0.5]) { const bw = W * 0.26, bz = 1.6; add(B(bw, 0.9, 0.08), wood(0x5a3a22), bx, 0.5, bz + 1.2, false); for (const sx of [-1, 1]) add(B(0.08, 0.9, 2.4), wood(0x5a3a22), bx + sx * bw / 2, 0.5, bz, false); for (const sx of [-1, 1]) add(new THREE.CylinderGeometry(0.06, 0.07, 1.1, 6), wood(0x3a2616), bx + sx * bw / 2, 0.55, bz + 1.2, false); hay(bx - 0.4, bz - 0.2); hay(bx + 0.6, bz + 0.3, 0.8); for (let k = -1; k <= 1; k++) solid(bx + k * bw * 0.4, bz + 1.2, 0.3); } }
    { /* gaiolas empilhadas */ const gx = W - 1.2; for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { const x = gx - j * 0.9, y = 0.42 + i * 0.84, z = 1.0; add(B(0.8, 0.78, 0.8), wood(0x3a2616), x, y, z, true); for (let b = -0.3; b <= 0.3; b += 0.15) add(B(0.03, 0.74, 0.03), std(0x4a4a50), x + b, y, z + 0.4, false); } solid(gx - 0.45, 1.0, 0.95); }
    { /* selas e arreios na parede oeste */ for (let k = 0; k < 3; k++) { const z = D * 0.35 + k * 1.1; add(B(0.1, 0.1, 0.8), wood(0x3a2616), 0.2, 1.3, z, false); add(B(0.4, 0.22, 0.6), std(0x6a3a22), 0.35, 1.42, z, false).rotation.z = 0.2; add(new THREE.TorusGeometry(0.16, 0.025, 5, 12), std(0x5a4a3a), 0.2, 0.75, z, false).rotation.y = Math.PI / 2; } }
    add(B(W * 0.45, 1.0, 0.8), plank(0x5a3a22), cx + 0.6, 0.5, D * 0.66, true); add(B(W * 0.45 + 0.2, 0.1, 1.0), plank(0x7a5532), cx + 0.6, 1.05, D * 0.66, true); for (const f of [-0.3, 0, 0.3]) solid(cx + 0.6 + W * 0.45 * f, D * 0.66, 0.85);
    add(new THREE.SphereGeometry(0.1, 8, 6), std(0xe8c860), cx, 1.2, D * 0.66, false); add(new THREE.CylinderGeometry(0.13, 0.13, 0.5, 8), std(0x8a6a4a), cx + 1.2, 1.17, D * 0.66, false).rotation.z = Math.PI / 2; mug(cx + 1.8, 1.13, D * 0.66 + 0.1);
    hay(1.2, D - 1.3, 1.1); barrel(W - 0.9, D - 1.0, 0.9); hang(cx, D * 0.5, 0xffc070, 38); rug(cx + 0.6, D * 0.85, 2.6, 1.2, 0x5a4a2a);
  } else if (variant === 13) { // OFICINA DO TECNOCRATA (02/11): bancada com engrenagens, painel de válvulas, caldeira, cabos e o balcão de latão
    window_(W * 0.5, 'n'); window_(D * 0.6, 'w');
    const brass = std(0xd9a441, { emissive: new THREE.Color(0x3a2408), emissiveIntensity: 0.25 }), iron = std(0x4a4e56);
    { /* caldeira ao fundo com manômetro e chaminé */ const bx = W * 0.2, bz = 1.1; add(new THREE.CylinderGeometry(0.55, 0.6, 1.6, 12), iron, bx, 0.8, bz); add(new THREE.CylinderGeometry(0.12, 0.12, 1.4, 8), iron, bx + 0.2, 2.3, bz - 0.2, false); for (const y of [0.4, 1.0]) add(new THREE.TorusGeometry(0.58, 0.04, 6, 14), brass, bx, y, bz, false).rotation.x = Math.PI / 2;
      add(new THREE.CylinderGeometry(0.14, 0.14, 0.06, 12), std(0xf0ecd8), bx, 1.1, bz + 0.6, false).rotation.x = Math.PI / 2; add(B(0.02, 0.1, 0.01), std(0xb3202f), bx, 1.14, bz + 0.64, false); const glow = new THREE.Mesh(new THREE.CircleGeometry(0.2, 10), new THREE.MeshBasicMaterial({ color: 0xff8a30 })); glow.position.set(bx, 0.35, bz + 0.61); g.add(glow); light(bx, 0.6, bz + 1.0, 0xff9a40, 26, 8); solid(bx, bz, 0.7); }
    { /* bancada de trabalho: torno, engrenagens, chaves e uma lamparina */ const tx = W * 0.6, tz = D * 0.38; table(tx, tz, 2.6, 1.0); add(B(2.6, 0.08, 1.0), std(0x3a3a40), tx, 0.88, tz, false);
      for (let k = 0; k < 4; k++) { const rr = 0.12 + (k % 2) * 0.08; add(new THREE.CylinderGeometry(rr, rr, 0.05, 8), brass, tx - 1.0 + k * 0.55, 0.95, tz - 0.2, false); for (let t = 0; t < 8; t++) add(B(0.06, 0.05, 0.05), brass, tx - 1.0 + k * 0.55 + Math.cos(t * 0.785) * rr, 0.95, tz - 0.2 + Math.sin(t * 0.785) * rr, false); }
      add(B(0.5, 0.25, 0.3), iron, tx + 0.9, 1.04, tz + 0.15); add(new THREE.CylinderGeometry(0.06, 0.06, 0.6, 6), iron, tx + 0.9, 1.04, tz + 0.15, false).rotation.z = Math.PI / 2; for (let k = 0; k < 3; k++) add(B(0.04, 0.02, 0.36), std(0x8a8e96), tx - 0.4 + k * 0.14, 0.93, tz + 0.3, false).rotation.y = 0.2 * k;
      add(new THREE.CylinderGeometry(0.07, 0.09, 0.2, 6), brass, tx + 0.3, 1.0, tz - 0.35, false); flame(tx + 0.3, 1.1, tz - 0.35, 0.5); light(tx + 0.3, 1.5, tz - 0.35, 0xffd080, 22, 7); }
    { /* painel de válvulas e mostradores na parede oeste */ for (let k = 0; k < 3; k++) { const z = D * 0.3 + k * 0.9; add(B(0.08, 0.7, 0.7), iron, 0.3, 1.4, z, false); add(new THREE.CylinderGeometry(0.14, 0.14, 0.04, 12), std(0xf0ecd8), 0.36, 1.55, z, false).rotation.z = Math.PI / 2; add(new THREE.TorusGeometry(0.12, 0.03, 6, 10), brass, 0.36, 1.15, z, false).rotation.z = Math.PI / 2; } for (let k = 0; k < 2; k++) add(new THREE.CylinderGeometry(0.05, 0.05, 2.4, 6), std(0x8a6a3a), 0.2, 2.3, D * 0.3 + k * 1.8, false).rotation.x = Math.PI / 2; }
    shelf(W * 0.85, 0.3, 0, 1.6, 2.2, false); for (let i = 0; i < 4; i++) for (let k = 0; k < 3; k++) { const x = W * 0.85 - 0.5 + k * 0.5, y = 0.5 + i * 0.6; if ((i + k) % 2) add(new THREE.CylinderGeometry(0.11, 0.11, 0.05, 8), brass, x, y + 0.03, 0.3, false); else add(B(0.2, 0.18, 0.18), iron, x, y + 0.1, 0.3, false); }
    add(B(W * 0.5, 1.0, 0.8), plank(0x5a3a22), cx, 0.5, D * 0.66, true); add(B(W * 0.5 + 0.2, 0.08, 1.0), brass, cx, 1.05, D * 0.66, true); for (const f of [-0.3, 0, 0.3]) solid(cx + W * 0.5 * f, D * 0.66, 0.9);
    add(new THREE.CylinderGeometry(0.16, 0.16, 0.05, 8), brass, cx - 1.0, 1.12, D * 0.66, false); add(B(0.4, 0.14, 0.26), iron, cx + 0.2, 1.16, D * 0.66, false); add(new THREE.SphereGeometry(0.1, 8, 6), new THREE.MeshBasicMaterial({ color: 0x6ad0ff }), cx + 1.1, 1.2, D * 0.66, false);
    barrel(W - 0.9, D - 1.0, 0.9); crate(1.0, D - 1.0, 0.7); hang(cx, D * 0.5, 0x9ad7ff, 34);
  } else if (variant === 15) { /* A BIGORNA MOLHADA — 10/11, refeita (Erling: "taverna tem que ser muito maior, ter o balcão de atendimento, uma porta para
       a cozinha e para a despensa, cheia de anões bebendo, enfeites e decoração para todo lado, carnes e barris — uma taverna, amigo! comprar bebidas e
       beber, reservar uma mesa para amigos"). Salão de 30 × 20 m: balcão comprido ao fundo com os barris de chope atrás e a Gudrún servindo; a cozinha
       (fundo à direita) e a despensa (fundo à esquerda) são salas de verdade, com porta; no meio a cova de fogo com o javali no espeto; mesas compridas
       com bancos dos dois lados (os fregueses sentam e bebem), mesas redondas (uma se reserva para o grupo), palco do bardo perto da porta, presuntos
       pendurados, estandartes, escudos, tochas e barris por toda parte. Peças KayKit (libs/kitprops.ts) + o que é do jogo (fogo, bancos, paredes). */
    const sm = std(0xffffff, { map: stoneTex(0x5a544c) }), cu = std(0xb06a3a), iron = std(0x2c2a2a), meatM = std(0x9a4a2a), fatM = std(0xe8c8a0);
    const st = new THREE.Mesh(new THREE.PlaneGeometry(W, D), std(0xffffff, { map: (() => { const t = stoneTex(0x6a6458).clone(); t.repeat.set(W / 2, D / 2); t.needsUpdate = true; return t; })() })); st.rotation.x = -Math.PI / 2; st.position.set(W / 2, 0.01, D / 2); st.receiveShadow = true; g.add(st);
    const K = (path: string, x: number, y: number, z: number, ry = 0, sc = 0.75) => kitPut(g, path, x, y, z, ry, sc);
    /* parede interna: alta do lado de lá, baixa do lado da câmera; `gap` = o vão da porta [de, até] ao longo da parede */
    const wallLine = (x0: number, z0: number, x1: number, z1: number, h: number, gap?: [number, number]) => { const L = Math.hypot(x1 - x0, z1 - z0), ux = (x1 - x0) / L, uz = (z1 - z0) / L, ry = Math.atan2(-uz, ux);
      const segs: [number, number][] = gap ? [[0, gap[0]], [gap[1], L]] : [[0, L]];
      for (const [a0, a1] of segs) { if (a1 - a0 < 0.05) continue; const m = (a0 + a1) / 2; add(B(a1 - a0, h, 0.28), wm, x0 + ux * m, h / 2, z0 + uz * m, true, ry); add(B(a1 - a0, 0.12, 0.34), wood(0x3a2616), x0 + ux * m, h + 0.06, z0 + uz * m, false, ry);
        for (let t = a0 + 0.2; t <= a1 - 0.1; t += 0.45) solid(x0 + ux * t, z0 + uz * t, 0.42); }
      if (gap) for (const t of gap) { add(B(0.26, 2.5, 0.34), wood(0x3a2616), x0 + ux * t, 1.25, z0 + uz * t, true, ry); } if (gap) { const m = (gap[0] + gap[1]) / 2; add(B(gap[1] - gap[0] + 0.3, 0.24, 0.34), wood(0x3a2616), x0 + ux * m, 2.5, z0 + uz * m, true, ry); } };
    /* presunto / pernil pendurado num gancho */
    const ham = (x: number, z: number, y = H - 1.1) => { add(new THREE.CylinderGeometry(0.01, 0.01, H - y - 0.15, 4), iron, x, (H + y) / 2, z, false); const hm = add(new THREE.SphereGeometry(0.22, 8, 6), meatM, x, y - 0.2, z); hm.scale.set(1, 1.6, 1); add(new THREE.CylinderGeometry(0.05, 0.07, 0.2, 6), fatM, x, y + 0.08, z, false); };
    const bench = (x: number, z: number, L: number, ry = 0) => { const b = new THREE.Group(); b.position.set(x, 0, z); b.rotation.y = ry; g.add(b); add(B(L, 0.08, 0.36), plank(0x5a3a22), 0, 0.44, 0, true, 0, b); for (const sx of [-1, 0, 1]) add(B(0.1, 0.42, 0.3), wood(0x3a2616), sx * (L / 2 - 0.25), 0.21, 0, false, 0, b); };
    const signTex = (text: string, sub = '') => { const c = document.createElement('canvas'); c.width = 256; c.height = 128; const x = c.getContext('2d')!; x.fillStyle = '#5a3a22'; x.fillRect(0, 0, 256, 128); x.strokeStyle = '#2a1a0e'; x.lineWidth = 10; x.strokeRect(5, 5, 246, 118); x.fillStyle = '#f0d9a0'; x.textAlign = 'center'; x.font = 'bold 34px serif'; x.fillText(text, 128, sub ? 58 : 76); if (sub) { x.font = '24px serif'; x.fillText(sub, 128, 96); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.userData.own = true; return t; };
    const plaque = (x: number, y: number, z: number, text: string, sub = '', ry = 0, w = 1.1) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w / 2), new THREE.MeshBasicMaterial({ map: signTex(text, sub), side: THREE.DoubleSide })); m.position.set(x, y, z); m.rotation.y = ry; g.add(m); return m; };
    const torchW = (x: number, z: number, ry: number) => { K('masmorra/torch_mounted', x, 2.0, z, ry, 0.7); flame(x + Math.sin(ry) * 0.3, 2.62, z + Math.cos(ry) * 0.3, 0.7); };

    /* ===== salas do fundo: despensa (esquerda) e cozinha (direita) ===== */
    const RX0 = 7, RX1 = W - 8, RZ = 7.5;
    wallLine(RX0, 0, RX0, RZ, 1.3, [4.4, 6.0]); wallLine(0, RZ, RX0, RZ, 1.0);  /* despensa: porta para o salão na parede leste */
    wallLine(RX1, 0, RX1, RZ, 1.3, [4.4, 6.0]); wallLine(RX1, RZ, W, RZ, 1.0);  /* cozinha: porta logo atrás do balcão */
    plaque(RX0 + 0.2, 2.95, 5.2, 'Despensa', '', Math.PI / 2, 1.0); plaque(RX1 - 0.2, 2.95, 5.2, 'Cozinha', '', -Math.PI / 2, 1.0);
    /* despensa: barris grandes, caixotes de comida, caixas empilhadas, sacos, prateleiras com potes e garrafas, presuntos e linguiças no teto */
    for (let k = 0; k < 3; k++) { K('masmorra/barrel_large', 0.9, 0, 1.0 + k * 1.45, 0, 0.6); solid(0.9, 1.0 + k * 1.45, 0.6); }
    K('masmorra/barrel_small_stack', 2.6, 0, 0.75, 0, 0.6); solid(2.6, 0.8, 0.7); K('masmorra/crates_stacked', 4.6, 0, 1.0, 0.3, 0.6); solid(4.6, 1.0, 0.8);
    K('taverna/crate_ham', 5.9, 0, 2.6, 0, 0.5); K('taverna/crate_steak', 5.9, 0, 3.7, 0, 0.5); K('taverna/crate_potatoes', 3.6, 0, 6.3, 0, 0.5); K('taverna/crate_cheese', 4.7, 0, 6.3, 0, 0.5); K('taverna/crate_onions', 5.8, 0, 6.3, 0, 0.5);
    for (const [x, z] of [[5.9, 2.6], [5.9, 3.7], [3.6, 6.3], [4.7, 6.3], [5.8, 6.3]]) solid(x, z, 0.5);
    K('masmorra/shelves', 0.4, 0, 5.8, Math.PI / 2, 0.8); for (let k = 0; k < 4; k++) K(`taverna/jar_${'ABCD'[k]}_large`, 0.42, 1.25, 5.1 + k * 0.42, 0, 0.6); for (let k = 0; k < 4; k++) K(`masmorra/bottle_${'ABC'[k % 3]}_${k % 2 ? 'green' : 'brown'}`, 0.42, 0.7, 5.1 + k * 0.42, 0, 0.5); solid(0.6, 5.8, 0.6);
    for (const [x, z] of [[2.0, 3.0], [3.0, 3.6], [2.4, 4.6]]) { const sk = add(new THREE.SphereGeometry(0.36, 8, 6), std(0xc8b088), x, 0.32, z); sk.scale.set(1, 0.9, 0.8); add(new THREE.CylinderGeometry(0.1, 0.16, 0.18, 6), std(0xb09a70), x, 0.68, z, false); solid(x, z, 0.4); } /* sacos de farinha e cevada */
    for (let k = 0; k < 4; k++) ham(1.6 + k * 1.2, 2.2 + (k % 2) * 0.8); for (let k = 0; k < 5; k++) add(new THREE.CylinderGeometry(0.05, 0.05, 0.5, 6), std(0x7a2a1a), 3.5 + k * 0.25, H - 0.9 - (k % 2) * 0.1, 4.2, false); /* linguiças */
    /* cozinha: fogão de pedra com caldeirão, mesa de cortar com comida, caixotes, escorredor de pratos, potes, presuntos */
    { const hx = W - 3.6, hz = 0.95; add(B(3.0, 1.0, 1.4), sm, hx, 0.5, hz); add(B(3.2, 0.12, 1.5), sm, hx, 1.06, hz); add(B(1.4, 0.55, 0.2), std(0x0a0605), hx, 0.45, hz + 0.72, false); add(new THREE.CylinderGeometry(0.42, 0.55, 2.3, 8), sm, hx, 2.25, 0.5);
      flame(hx - 0.2, 0.32, hz + 0.68, 1.0); flame(hx + 0.3, 0.3, hz + 0.68, 0.8); light(hx, 1.4, hz + 1.6, 0xff8a3a, 40, 11); solid(hx - 1, hz, 0.8); solid(hx, hz, 0.8); solid(hx + 1, hz, 0.8);
      add(new THREE.SphereGeometry(0.42, 10, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), iron, hx - 0.6, 1.55, hz); add(new THREE.CylinderGeometry(0.4, 0.4, 0.05, 10), std(0x8a5a2a), hx - 0.6, 1.5, hz, false); /* caldeirão com ensopado */
      K('taverna/pot_A_stew', hx + 0.7, 1.12, hz, 0, 0.55); K('taverna/pan_A', hx + 1.1, 1.12, hz + 0.3, 0.6, 0.55); }
    K('taverna/kitchentable_A_large_decorated', W - 4.2, 0, 4.4, 0, 0.62); solid(W - 5.0, 4.4, 0.75); solid(W - 3.4, 4.4, 0.75); K('taverna/cuttingboard', W - 4.6, 0.62, 4.3, 0.3, 0.62);
    K('taverna/crate_carrots', W - 0.8, 0, 3.3, 0, 0.5); K('taverna/crate_tomatoes', W - 0.8, 0, 4.4, 0, 0.5); K('taverna/crate_lettuce', W - 0.8, 0, 5.5, 0, 0.5); for (const z of [3.3, 4.4, 5.5]) solid(W - 0.8, z, 0.5);
    K('taverna/dishrack_plates', RX1 + 0.8, 0, 1.0, Math.PI / 2, 0.7); solid(RX1 + 0.8, 1.0, 0.55); K('masmorra/barrel_small_stack', RX1 + 1.0, 0, 6.6, 0, 0.5); solid(RX1 + 1.0, 6.6, 0.6);
    for (let k = 0; k < 3; k++) ham(RX1 + 2.6 + k * 1.3, 2.9);

    /* ===== o balcão: comprido, de carvalho, com tampo de cobre; atrás, os barris de chope deitados nos cavaletes e a parede de garrafas ===== */
    const BZ = 4.4, BX0 = RX0 + 1.4, BX1 = RX1 - 1.4, BL = BX1 - BX0, BC = (BX0 + BX1) / 2;
    add(B(BL, 1.05, 0.8), plank(0x5a3a22), BC, 0.52, BZ); add(B(BL + 0.2, 0.08, 1.0), cu, BC, 1.09, BZ, false); add(B(BL, 0.12, 0.1), wood(0x3a2616), BC, 0.1, BZ + 0.42, false);
    for (let t = BX0 + 0.3; t <= BX1 - 0.2; t += 0.5) solid(t, BZ, 0.5);
    add(B(0.8, 1.05, 2.0), plank(0x5a3a22), BX1 + 0.4, 0.52, BZ - 1.4); add(B(1.0, 0.08, 2.2), cu, BX1 + 0.4, 1.09, BZ - 1.4, false); solid(BX1 + 0.4, BZ - 1.0, 0.5); solid(BX1 + 0.4, BZ - 1.9, 0.5); /* a ponta do balcão volta para a parede: o lado de dentro é dos funcionários */
    for (let k = 0; k < 5; k++) { const x = BX0 + 0.9 + k * (BL - 1.8) / 4; K('masmorra/keg_decorated', x, 0, 0.75, 0, 0.42); solid(x, 0.75, 0.6); add(new THREE.CylinderGeometry(0.03, 0.03, 0.3, 5), std(0xc9a24a), x, 1.3, BZ - 0.3, false); }  /* barris de chope e as torneiras no balcão */
    for (const sx of [-4.5, -3.0, 3.0, 4.5]) for (const y of [1.7, 2.4]) { K('masmorra/shelf_large', BC + sx, y, 0.3, 0, 0.75); for (let k = 0; k < 3; k++) K(`masmorra/bottle_${'ABC'[k]}_${(k + y * 10) % 2 ? 'green' : 'brown'}`, BC + sx - 0.45 + k * 0.45, y + 0.02, 0.32, 0, 0.42); } K('masmorra/shelf_small_candles', BC, 1.9, 0.2, 0, 0.75); /* parede de garrafas atrás do balcão */ wallUse.n.push([BC - 6, BC + 6]);
    for (let k = 0; k < 9; k++) { const x = BX0 + 0.5 + k * (BL - 1) / 8; mug(x, 1.13, BZ + (k % 2 ? 0.15 : -0.1)); if (k % 3 === 1) K(`masmorra/bottle_A_labeled_${k % 2 ? 'green' : 'brown'}`, x + 0.25, 1.13, BZ - 0.15, 0, 0.45); }
    K('masmorra/coin_stack_small', BC + 1.2, 1.13, BZ + 0.1, 0, 0.35); K('taverna/menu', BC - 1.5, 1.13, BZ + 0.2, 0, 0.7);
    for (let k = 0; k < 7; k++) { const x = BX0 + 0.8 + k * (BL - 1.6) / 6; K('masmorra/stool', x, 0, BZ + 1.05, 0, 1.15); }
    plaque(BC, 3.05, 0.2, 'A Bigorna Molhada', 'chope · carne · cama', 0, 2.6);
    for (let k = 0; k < 5; k++) ham(BX0 + 1.5 + k * (BL - 3) / 4, BZ - 0.5, H - 1.0);

    /* ===== o salão ===== */
    { const fx = W * 0.5, fz = D * 0.56; add(new THREE.CylinderGeometry(1.2, 1.25, 0.32, 12), sm, fx, 0.16, fz); add(new THREE.CylinderGeometry(0.95, 0.95, 0.06, 12), std(0x2a1a10), fx, 0.33, fz, false); solid(fx, fz, 1.3);
      flame(fx, 0.58, fz, 1.7); light(fx, 1.5, fz, 0xff9a40, 52, 15);
      for (const sx of [-1, 1]) add(B(0.08, 1.2, 0.08), iron, fx + sx * 1.05, 0.9, fz, false); add(new THREE.CylinderGeometry(0.03, 0.03, 2.3, 6).rotateZ(Math.PI / 2), iron, fx, 1.45, fz, false);
      const meat = add(new THREE.CylinderGeometry(0.26, 0.3, 1.0, 8).rotateZ(Math.PI / 2), meatM, fx, 1.45, fz); meat.scale.set(1, 1.1, 0.9); add(new THREE.SphereGeometry(0.22, 8, 6), meatM, fx + 0.58, 1.45, fz);
      rug(fx, fz, 4.2, 3.4, 0x5a2a22); }
    /* mesas compridas com bancos: os fregueses sentam e bebem (seats: onde o herói também pode sentar) */
    const LT = [[3.6, 11.0], [3.6, 15.2], [W - 3.6, 11.0], [W - 3.6, 15.2], [9.6, 11.6], [W - 9.6, 11.6]] as [number, number][];
    for (const [tx, tz] of LT) { K('masmorra/table_long_decorated_A', tx, 0, tz, 0, 0.78); for (const sz of [-1, 0, 1]) solid(tx, tz + sz * 1.0, 0.75);
      for (const sx of [-1, 1]) { bench(tx + sx * 1.15, tz, 3.0, Math.PI / 2); for (const sz of [-1, 0, 1]) seats.push({ x: tx + sx * 1.15, z: tz + sz * 0.95, yaw: sx < 0 ? Math.PI / 2 : -Math.PI / 2, h: 0.48 }); }
      for (let k = 0; k < 3; k++) mug(tx + (k - 1) * 0.3, 0.8, tz + (k - 1) * 0.9); K('masmorra/plate_food_A', tx, 0.8, tz + 0.5, 0, 0.32); K('masmorra/plate_food_B', tx - 0.2, 0.8, tz - 0.8, 1, 0.32); }
    /* mesas redondas: a do meio-direita é a que se reserva (placa em cima) */
    const RT = [[9.4, 16.4], [W - 9.4, 16.4]] as [number, number][];
    for (const [tx, tz] of RT) { K('masmorra/table_medium_tablecloth_decorated_B', tx, 0, tz, 0, 0.75); solid(tx, tz, 0.95); /* a redonda da KayKit vinha com hambúrguer: mesa de toalha com assado */ for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2 + 0.3, x = tx + Math.cos(a) * 1.35, z = tz + Math.sin(a) * 1.35, yaw = Math.atan2(tx - x, tz - z); K('masmorra/chair', x, 0, z, yaw, 0.72); seats.push({ x, z, yaw, h: 0.5 }); } }
    reserveAt = { x: RT[1][0], z: RT[1][1] }; reserveSign = plaque(RT[1][0], 1.25, RT[1][1], 'Mesa livre', 'E para reservar', -Math.PI / 4, 0.9); { const sg = reserveSign; reserveLabel = (a, b) => { const m = sg.material as THREE.MeshBasicMaterial; m.map?.dispose(); m.map = signTex(a, b); m.needsUpdate = true; }; }
    /* palco do bardo perto da porta, à esquerda */
    { const px = 3.2, pz = D - 2.4; add(B(4.2, 0.36, 2.8), plank(0x6a4528), px, 0.18, pz); add(B(4.3, 0.08, 2.9), wood(0x3a2616), px, 0.38, pz, false); stage = { x0: px - 2.1, x1: px + 2.1, z0: pz - 1.4, z1: pz + 1.4, y: 0.42 }; K('masmorra/banner_patternA_red', px, 0, pz - 1.55, 0, 0.55); K('masmorra/candle_triple', px - 1.6, 0.42, pz - 0.9, 0, 0.6); K('masmorra/candle_triple', px + 1.6, 0.42, pz - 0.9, 0, 0.6); }
    /* pilares de pedra com cinta de cobre, segurando as vigas */
    for (const [x, z] of [[RX0 + 0.4, 9.2], [RX1 - 0.4, 9.2], [RX0 + 0.4, 16.6], [RX1 - 0.4, 16.6]] as [number, number][]) { add(B(0.55, H, 0.55), sm, x, H / 2, z); add(B(0.68, 0.32, 0.68), sm, x, 0.16, z); add(B(0.6, 0.12, 0.6), cu, x, 1.8, z, false); solid(x, z, 0.45); }
    /* paredes: estandartes, escudos, tochas, janelas na oeste */
    K('masmorra/banner_shield_red', 1.6, 0, 0.12, 0, 0.6); K('masmorra/banner_patternB_red', RX0 + 0.8, 0, RZ + 0.2, 0, 0.5);
    K('masmorra/banner_triple_red', 0.12, 0, 9.8, Math.PI / 2, 0.55); K('masmorra/banner_shield_brown', 0.12, 0, 13.4, Math.PI / 2, 0.55); window_(17.0, 'w');
    torchW(0.15, 12.0, Math.PI / 2); torchW(0.15, 15.6, Math.PI / 2); torchW(RX0 + 0.2, 2.5, Math.PI / 2); torchW(RX1 - 0.2, 2.5, -Math.PI / 2);
    for (const [x, c] of [[BC - 2.2, 0x8a2a22], [BC + 2.2, 0x2a4a7a]] as [number, number][]) { add(new THREE.CylinderGeometry(0.42, 0.42, 0.08, 10).rotateX(Math.PI / 2), std(c), x, 2.75, 0.1); add(new THREE.CylinderGeometry(0.12, 0.12, 0.1, 8).rotateX(Math.PI / 2), std(0x8a8a90), x, 2.75, 0.16, false); for (const sg of [-1, 1]) { const ax = add(B(0.05, 1.1, 0.05), wood(0x3a2616), x + sg * 0.3, 2.75, 0.12, false); ax.rotation.z = sg * 0.6; add(B(0.32, 0.22, 0.04), iron, x + sg * 0.58, 3.2, 0.12, false).rotation.z = sg * 0.6; } }
    /* barris e caixas pelos cantos do salão */
    K('masmorra/barrel_large_decorated', 0.9, 0, 8.6, 0, 0.5); solid(0.9, 8.6, 0.6); K('masmorra/keg', W - 1.0, 0, 8.8, -Math.PI / 2, 0.5); solid(W - 1.0, 8.8, 0.7); K('masmorra/barrel_small_stack', W - 1.1, 0, D - 1.0, 0, 0.55); solid(W - 1.1, D - 1.0, 0.7);
    K('masmorra/barrel_large', W - 2.6, 0, D - 0.9, 0, 0.5); solid(W - 2.6, D - 0.9, 0.55); K('masmorra/trunk_large_A', 6.4, 0, D - 0.9, 0, 0.6); solid(6.4, D - 0.9, 0.6);
    /* lustres de roda com velas (as duas luzes que faltam) e presuntos sobre as mesas */
    hang(W * 0.27, 13.2, 0xffb060, 34); hang(W * 0.73, 13.2, 0xffb060, 34);
    for (const [x, z] of [[3.6, 13.1], [W - 3.6, 13.1], [9.6, 9.6], [W - 9.6, 9.6]] as [number, number][]) ham(x, z, H - 0.9);
  } else if (variant === 16 || variant === 17) { /* 12/11 — os dois prédios da casa do servidor em Karmika.
       16 = A ESTALAGEM (Erling: "salão interno bem bonito, dois andares, 20 quartos, cozinha, salão animado"): salão de 26 × 16 m com lareira, balcão comprido,
       mesas compridas e redondas, palco do bardo; a cozinha é uma sala de verdade no canto nordeste; a escada sobe para a galeria do segundo andar, que
       corre pelas paredes norte e oeste com as vinte portas dos quartos (numeradas). A galeria é cenário: o jogador fica no salão.
       17 = O SALÃO DAS GUILDAS ("taverna dentro, salões de guilda para profissões, bar animado"): salão de pedra de 24 × 16 m com a mesa do conselho no meio,
       os cantos dos ofícios ao longo da parede norte (forja, marcenaria, alquimia, cozinha, costura), o bar a oeste e os estandartes no alto. */
    const INN = variant === 16, dk = wood(0x3a2616), cu = std(0xb06a3a), iron = std(0x2c2a2a);
    const sTex = (text: string, sub = '') => { const c = document.createElement('canvas'); c.width = 256; c.height = 128; const x = c.getContext('2d')!; x.fillStyle = '#4a2f1a'; x.fillRect(0, 0, 256, 128); x.strokeStyle = '#d9a54a'; x.lineWidth = 6; x.strokeRect(6, 6, 244, 116); x.fillStyle = '#f3d38a'; x.textAlign = 'center'; x.font = `bold ${text.length > 14 ? 26 : text.length > 4 ? 34 : 64}px Georgia, serif`; x.fillText(text, 128, sub ? 62 : 84); if (sub) { x.font = '20px Georgia, serif'; x.fillStyle = '#e8dcc0'; x.fillText(sub, 128, 98); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
    const sign = (x: number, y: number, z: number, text: string, sub = '', ry = 0, w = 1.1) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w / 2), new THREE.MeshBasicMaterial({ map: sTex(text, sub), side: THREE.DoubleSide })); m.position.set(x, y, z); m.rotation.y = ry; g.add(m); };
    /* as paredes do fundo sobem mais um andar */
    const H2 = INN ? 3.2 : 1.6; add(B(W, H2, 0.3), wm, W / 2, H + H2 / 2, -0.15, false); add(B(0.3, H2, D), wm, -0.15, H + H2 / 2, D / 2, false);
    if (!INN) { const st = new THREE.Mesh(new THREE.PlaneGeometry(W, D), std(0xffffff, { map: (() => { const t = stoneTex(0x6a6458).clone(); t.repeat.set(W / 2, D / 2); t.needsUpdate = true; return t; })() })); st.rotation.x = -Math.PI / 2; st.position.set(W / 2, 0.012, D / 2); st.receiveShadow = true; g.add(st); }
    const longTable = (x: number, z: number, len: number) => { table(x, z, len, 1.1); for (let k = 0; k < Math.floor(len / 1.1); k++) for (const sz of [-1, 1]) { const bx = x - len / 2 + 0.6 + k * 1.1; add(B(0.9, 0.1, 0.4), plank(0x6a4528), bx, 0.48, z + sz * 0.95); add(B(0.08, 0.46, 0.34), dk, bx - 0.35, 0.23, z + sz * 0.95, false); add(B(0.08, 0.46, 0.34), dk, bx + 0.35, 0.23, z + sz * 0.95, false); seats.push({ x: bx, z: z + sz * 0.95, yaw: sz > 0 ? Math.PI : 0, h: 0.5 }); if (k % 2 === 0) mug(bx, 0.87, z + sz * 0.25); else plate(bx, 0.87, z + sz * 0.25); } solid(x - len / 4, z, 1.3); solid(x + len / 4, z, 1.3); };
    const round = (x: number, z: number) => { add(new THREE.CylinderGeometry(0.85, 0.85, 0.09, 14), plank(0x7a5532), x, 0.82, z); add(new THREE.CylinderGeometry(0.12, 0.2, 0.8, 8), dk, x, 0.4, z, false); solid(x, z, 0.95); for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + 0.4; chair(x + Math.cos(a) * 1.25, z + Math.sin(a) * 1.25, -a - Math.PI / 2); seats.push({ x: x + Math.cos(a) * 1.25, z: z + Math.sin(a) * 1.25, yaw: -a - Math.PI / 2, h: 0.5 }); } mug(x + 0.3, 0.87, z); mug(x - 0.25, 0.87, z + 0.2); add(new THREE.CylinderGeometry(0.05, 0.06, 0.22, 6), std(0xe8dcc0), x, 0.98, z - 0.15, false); };
    const bar = (x0: number, x1: number, z: number) => { const L = x1 - x0, xm = (x0 + x1) / 2; add(B(L, 1.05, 0.9), plank(0x5a3a22), xm, 0.52, z); add(B(L + 0.3, 0.1, 1.1), plank(0x7a5532), xm, 1.09, z); add(B(L + 0.3, 0.05, 0.12), cu, xm, 1.16, z + 0.5, false); for (let x = x0 + 0.6; x < x1; x += 1.4) { solid(x, z, 0.75); mug(x, 1.14, z + 0.15); add(new THREE.CylinderGeometry(0.2, 0.2, 0.06, 10), dk, x + 0.5, 0.62, z + 1.15); add(new THREE.CylinderGeometry(0.05, 0.07, 0.6, 6), iron, x + 0.5, 0.3, z + 1.15, false); seats.push({ x: x + 0.5, z: z + 1.15, yaw: Math.PI, h: 0.62 }); }
      for (let x = x0 + 0.5; x < x1; x += 1.05) barrel(x, z - 1.7, 1.05); shelf(xm, 0.35, 0, Math.min(5, L * 0.6), 2.6, false); };
    if (INN) {
      /* térreo: lareira grande, balcão, mesas, palco, cozinha */
      const KX = W - 7.5, KZ = 6.2; /* a cozinha: canto nordeste, 7,5 × 6,2 m, porta para o salão */
      add(B(0.25, H, KZ - 2.0), wm, KX, H / 2, (KZ - 2.0) / 2); add(B(7.5 - 2.6, H, 0.25), wm, KX + 2.6 + (7.5 - 2.6) / 2, H / 2, KZ); add(B(0.2, 2.4, 0.3), dk, KX, 1.2, KZ - 2.0, false); add(B(0.3, 2.4, 0.2), dk, KX + 2.6, 1.2, KZ, false);
      for (let z = 0.6; z < KZ - 2.2; z += 0.9) solid(KX, z, 0.55); for (let x = KX + 3.1; x < W; x += 0.9) solid(x, KZ, 0.55);
      sign(KX + 1.3, 2.75, KZ + 0.02, 'Cozinha', '', 0, 1.0);
      add(B(2.6, 1.0, 1.1), std(0xffffff, { map: stoneTex(0x5a544c) }), W - 2.0, 0.5, 0.8); add(B(2.2, 0.5, 0.2), std(0x0a0605), W - 2.0, 0.55, 1.37, false); flame(W - 2.0, 0.75, 1.2, 0.9); add(new THREE.CylinderGeometry(0.34, 0.26, 0.4, 10), iron, W - 2.0, 1.25, 0.8); solid(W - 2.0, 0.8, 1.4);
      table(KX + 3.4, 3.4, 2.4, 1.1); for (let k = 0; k < 4; k++) plate(KX + 2.6 + k * 0.5, 0.87, 3.4); add(new THREE.SphereGeometry(0.22, 8, 6), std(0xc8963a), KX + 3.9, 1.02, 3.2, false); solid(KX + 3.4, 3.4, 1.2);
      barrel(KX + 0.8, 0.8); barrel(KX + 1.7, 0.8, 0.85); crate(KX + 0.9, 2.0); for (let k = 0; k < 4; k++) { const hx = KX + 3.0 + k * 0.75; add(new THREE.CylinderGeometry(0.01, 0.01, 0.5, 4), iron, hx, H - 0.3, 2.0, false); add(new THREE.SphereGeometry(0.17, 7, 5), std(k % 2 ? 0x9a4a2a : 0xd8b070), hx, H - 0.68, 2.0, false).scale.set(1, 1.5, 0.8); }
      fireplace(4.2); bar(8.2, KX - 1.2, 3.6); sign((8.2 + KX - 1.2) / 2, 2.9, 0.08, 'Estalagem de Karmika', 'cama · mesa · estábulo', 0, 2.6);
      rug(W * 0.42, D * 0.6, 9, 5, 0x6a2a2a); longTable(W * 0.3, D * 0.5, 5.5); longTable(W * 0.3, D * 0.74, 5.5); longTable(W * 0.6, D * 0.62, 5.5);
      round(W * 0.82, D * 0.6); round(W * 0.84, D * 0.84); round(W * 0.1, D * 0.34);
      { const sx0 = W * 0.52, sz0 = D - 2.6; add(B(4.2, 0.3, 2.2), plank(0x5a3a22), sx0 + 2.1, 0.15, sz0 + 1.1); stage = { x0: sx0, x1: sx0 + 4.2, z0: sz0, z1: sz0 + 2.2, y: 0.3 }; add(B(0.5, 0.5, 0.5), plank(0x6a4528), sx0 + 0.7, 0.55, sz0 + 0.6); add(new THREE.CylinderGeometry(0.02, 0.02, 1.3, 5), iron, sx0 + 3.4, 0.95, sz0 + 0.6, false); }
      hang(W * 0.3, D * 0.55, 0xffb060, 44); hang(W * 0.62, D * 0.6, 0xffb060, 44); hang(W * 0.45, D * 0.22, 0xffc070, 36);
      barrel(1.0, D - 1.0); barrel(1.0, D - 1.9, 0.8); crate(2.0, D - 0.9); plant(W - 0.9, D - 0.9); plant(W * 0.4, D - 0.7);
      /* segundo andar: galeria de tábuas nas paredes norte e oeste, corrimão, as vinte portas e a escada */
      const GY = H + 0.05, GD = 2.3, rail = (x0: number, z0: number, x1: number, z1: number) => { const L = Math.hypot(x1 - x0, z1 - z0), ry = Math.atan2(-(z1 - z0), x1 - x0); add(B(L, 0.09, 0.09), dk, (x0 + x1) / 2, GY + 1.0, (z0 + z1) / 2, false, ry); for (let k = 0; k <= Math.floor(L / 0.9); k++) { const t = k / Math.max(1, Math.floor(L / 0.9)); add(B(0.07, 1.0, 0.07), dk, x0 + (x1 - x0) * t, GY + 0.5, z0 + (z1 - z0) * t, false); } };
      add(B(W, 0.14, GD), plank(0x6a4a2c), W / 2, GY, GD / 2); add(B(GD, 0.14, D - GD), plank(0x6a4a2c), GD / 2, GY, GD + (D - GD) / 2);
      add(B(W - GD, 0.3, 0.2), dk, GD + (W - GD) / 2, GY - 0.2, GD, false); add(B(0.2, 0.3, D - GD), dk, GD, GY - 0.2, GD + (D - GD) / 2, false);
      for (let x = GD + 3; x < W - 1; x += 4.2) { add(B(0.22, GY, 0.22), dk, x, GY / 2, GD, false); if (x < KX - 0.6 || x > KX + 0.6) solid(x, GD, 0.3); } for (let z = GD + 3.4; z < D - 0.5; z += 4.2) { add(B(0.22, GY, 0.22), dk, GD, GY / 2, z, false); solid(GD, z, 0.3); }
      rail(GD + 1.6, GD, W - 0.2, GD); rail(GD, GD + 1.6, GD, D - 0.2);
      const door = (x: number, z: number, ry: number, n: number) => { add(B(0.95, 1.95, 0.1), plank(0x5a3a22), x, GY + 1.05, z, true, ry); add(B(1.15, 0.12, 0.14), dk, x, GY + 2.08, z, false, ry); add(new THREE.SphereGeometry(0.05, 6, 5), std(0xe2c36a), x + (ry ? 0 : 0.32), GY + 1.0, z + (ry ? 0.32 : 0) + (ry ? 0 : 0.07), false); sign(x + (ry ? 0.08 : 0), GY + 2.45, z + (ry ? 0 : 0.08), String(n), '', ry, 0.5); };
      for (let k = 0; k < 12; k++) door(1.9 + k * ((W - 3.2) / 11), 0.07, 0, k + 1); for (let k = 0; k < 8; k++) door(0.07, 3.6 + k * ((D - 5.0) / 7), Math.PI / 2, 13 + k);
      { const n = 11, x0 = GD + 0.25, z0 = D * 0.62, rise = GY / n; for (let k = 0; k < n; k++) add(B(1.3, 0.12, 0.42), plank(0x6a4a2c), x0 + 0.65, rise * (k + 1) - 0.06, z0 - k * 0.42); add(B(0.1, 0.2, n * 0.42 + 0.4), dk, x0 + 1.32, GY / 2 + 0.6, z0 - (n - 1) * 0.21, false).rotation.x = Math.atan2(GY, n * 0.42); for (let k = 0; k < 4; k++) solid(x0 + 0.65, z0 - k * 1.3, 0.75); }
      flame(GD + 0.3, GY + 1.6, 0.4, 0.6); flame(W * 0.5, GY + 1.6, 0.4, 0.6); flame(W - 1.0, GY + 1.6, 0.4, 0.6); flame(0.4, GY + 1.6, D * 0.6, 0.6);
      light(W * 0.4, 2.6, D * 0.55, 0xffb060, 70, 26); light(W - 3.5, 2.4, 3.0, 0xff9a50, 40, 12);
    } else {
      const sm = std(0xffffff, { map: stoneTex(0x5a544c) });
      for (const sx of [0.3, 0.7]) for (const zf of [0.34, 0.7]) { add(new THREE.CylinderGeometry(0.34, 0.4, H + H2, 10), sm, W * sx, (H + H2) / 2, D * zf, false); solid(W * sx, D * zf, 0.5); }
      sign(W / 2, H + 0.7, 0.08, 'Salão das Guildas', 'Karmika', 0, 3.0);
      /* estandartes dos ofícios no alto e, embaixo de cada um, o canto do mestre */
      const OF: [string, number][] = [['Forja', 0x8a3a2a], ['Marcenaria', 0x7a5a2a], ['Alquimia', 0x4a6a8a], ['Cozinha', 0x8a6a2a], ['Costura', 0x6a4a7a]];
      OF.forEach(([nome, cor], k) => { const x = 3.4 + k * ((W - 11) / 4); const bn = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 2.2), new THREE.MeshToonMaterial({ color: cor, side: THREE.DoubleSide })); bn.position.set(x, H + 0.1, 0.07); g.add(bn); add(B(1.4, 0.08, 0.1), dk, x, H + 1.24, 0.08, false); sign(x, 2.05, 0.08, nome, '', 0, 1.2);
        if (k === 0) { add(B(0.9, 0.5, 0.5), iron, x, 0.75, 1.5); add(B(0.5, 0.5, 0.4), sm, x, 0.25, 1.5); add(B(1.3, 0.9, 0.9), sm, x + 1.4, 0.45, 0.8); flame(x + 1.4, 1.1, 0.8, 0.8); solid(x, 1.5, 0.7); solid(x + 1.4, 0.8, 0.8); }
        else if (k === 1) { table(x, 1.4, 2.2, 0.9); add(B(0.7, 0.05, 0.16), std(0xb8bec6), x - 0.4, 0.9, 1.4, false); add(B(0.5, 0.3, 0.3), plank(0x8a6a3a), x + 0.5, 1.0, 1.35); crate(x + 1.6, 1.0); solid(x, 1.4, 1.2); }
        else if (k === 2) { shelf(x, 0.35, 0, 2.2, 2.0, false); table(x, 1.9, 1.8, 0.8); for (let j = 0; j < 4; j++) add(new THREE.CylinderGeometry(0.07, 0.1, 0.24, 7), new THREE.MeshToonMaterial({ color: [0x6ad0ff, 0xff6a8a, 0x8aff8a, 0xffd06a][j], emissive: new THREE.Color([0x6ad0ff, 0xff6a8a, 0x8aff8a, 0xffd06a][j]).multiplyScalar(0.35) }), x - 0.6 + j * 0.4, 0.99, 1.9, false); solid(x, 1.9, 1.0); }
        else if (k === 3) { add(new THREE.CylinderGeometry(0.5, 0.36, 0.6, 12), iron, x, 0.75, 1.5); add(B(0.9, 0.4, 0.9), sm, x, 0.2, 1.5); flame(x, 0.5, 1.5, 0.6); table(x + 1.6, 1.3, 1.4, 0.8); plate(x + 1.4, 0.87, 1.3); plate(x + 1.8, 0.87, 1.3); solid(x, 1.5, 0.7); solid(x + 1.6, 1.3, 0.8); }
        else { table(x, 1.4, 2.0, 0.9); for (let j = 0; j < 3; j++) add(new THREE.CylinderGeometry(0.13, 0.13, 0.5, 8), new THREE.MeshToonMaterial({ color: [0x8a2a2a, 0x2a4a8a, 0xd8c8a0][j] }), x - 0.6 + j * 0.6, 1.0, 1.4, false).rotation.z = Math.PI / 2; solid(x, 1.4, 1.1); } });
      /* a mesa do conselho, no meio, sobre o tapete */
      rug(W / 2, D * 0.56, 9, 6, 0x2a3a6a); add(new THREE.CylinderGeometry(2.1, 2.1, 0.12, 20), plank(0x5a3a22), W / 2, 0.84, D * 0.56); add(new THREE.CylinderGeometry(0.4, 0.6, 0.8, 10), sm, W / 2, 0.4, D * 0.56); solid(W / 2, D * 0.56, 2.2);
      for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 + 0.2, x = W / 2 + Math.cos(a) * 2.75, z = D * 0.56 + Math.sin(a) * 2.75; chair(x, z, -a - Math.PI / 2); seats.push({ x, z, yaw: -a - Math.PI / 2, h: 0.5 }); mug(W / 2 + Math.cos(a) * 1.5, 0.9, D * 0.56 + Math.sin(a) * 1.5); }
      add(new THREE.CylinderGeometry(0.06, 0.08, 0.5, 6), std(0xe8dcc0), W / 2, 1.15, D * 0.56, false); flame(W / 2, 1.6, D * 0.56, 0.55);
      /* o bar, encostado na parede oeste; mesas redondas perto dele */
      { const z0 = D * 0.34, z1 = D * 0.8, zm = (z0 + z1) / 2, L = z1 - z0; add(B(0.9, 1.05, L), plank(0x5a3a22), 2.4, 0.52, zm); add(B(1.1, 0.1, L + 0.3), plank(0x7a5532), 2.4, 1.09, zm); for (let z = z0 + 0.6; z < z1; z += 1.4) { solid(2.4, z, 0.75); mug(2.55, 1.14, z); add(new THREE.CylinderGeometry(0.2, 0.2, 0.06, 10), dk, 3.55, 0.62, z + 0.5); add(new THREE.CylinderGeometry(0.05, 0.07, 0.6, 6), iron, 3.55, 0.3, z + 0.5, false); seats.push({ x: 3.55, z: z + 0.5, yaw: -Math.PI / 2, h: 0.62 }); barrel(0.8, z, 1.05); } sign(0.08, 2.5, zm, 'Bar das Guildas', 'aberto sempre', Math.PI / 2, 2.0); }
      round(W * 0.82, D * 0.5); round(W * 0.84, D * 0.8); round(W * 0.34, D * 0.86);
      for (const sx of [0.14, 0.9]) { add(B(0.9, 1.9, 0.5), wood(0x4a3220), W * sx, 0.95, D - 0.6); for (let j = 0; j < 3; j++) add(B(0.06, 1.3, 0.06), std(0xb8bec6), W * sx - 0.25 + j * 0.25, 1.1, D - 0.9, false).rotation.z = 0.12 * (j - 1); solid(W * sx, D - 0.6, 0.6); }
      hang(W * 0.5, D * 0.56, 0xffc070, 50); hang(W * 0.25, D * 0.5, 0xffb060, 40); hang(W * 0.75, D * 0.5, 0xffb060, 40); light(W / 2, 3.0, D * 0.5, 0xffc080, 70, 26);
    }
  } else if (variant === 14) { // ESTÁBULO (02/11): baias com feno e cocho, ferraduras na parede, selas, e o balcão do estalajadeiro
    window_(W * 0.5, 'n');
    const hay2 = (x: number, z: number, s = 1) => { add(new THREE.SphereGeometry(0.5 * s, 8, 6), std(0xd4b25a), x, 0.3 * s, z).scale.set(1.2, 0.6, 1); solid(x, z, 0.5 * s); };
    { const n = Math.max(2, Math.floor(W / 3.2)); for (let i = 0; i < n; i++) { const bw = (W - 0.6) / n, bx = 0.3 + bw * (i + 0.5), bz = 1.6; for (const sx of [-1, 1]) if (i === 0 && sx < 0 || i === n - 1 && sx > 0 || sx > 0) add(B(0.08, 1.1, 2.6), wood(0x5a3a22), bx + sx * bw / 2, 0.55, bz, false); add(B(bw - 0.1, 0.1, 0.08), wood(0x5a3a22), bx, 1.05, bz + 1.3, false); add(B(bw - 0.1, 0.1, 0.08), wood(0x5a3a22), bx, 0.55, bz + 1.3, false);
        add(B(bw * 0.7, 0.28, 0.4), wood(0x3a2616), bx, 0.2, bz - 0.9, false); add(B(bw * 0.7 - 0.08, 0.04, 0.32), std(0xd4b25a), bx, 0.33, bz - 0.9, false); hay2(bx, bz + 0.2, 0.9); for (let k = -1; k <= 1; k++) solid(bx + k * bw * 0.35, bz + 1.3, 0.3); } }
    { /* ferraduras e selas na parede oeste; baldes */ for (let k = 0; k < 4; k++) add(new THREE.TorusGeometry(0.12, 0.03, 6, 10, Math.PI * 1.5), std(0x6a6e76), 0.08, 1.2 + (k % 2) * 0.35, D * 0.3 + k * 0.5, false).rotation.y = Math.PI / 2; for (let k = 0; k < 2; k++) { const z = D * 0.62 + k * 1.0; add(B(0.1, 0.1, 0.8), wood(0x3a2616), 0.2, 1.3, z, false); add(B(0.4, 0.22, 0.6), std(0x6a3a22), 0.35, 1.42, z, false).rotation.z = 0.2; } add(new THREE.CylinderGeometry(0.2, 0.16, 0.3, 8), std(0x4a4e56), 0.8, 0.15, D - 1.2, false); add(new THREE.CylinderGeometry(0.2, 0.16, 0.3, 8), std(0x4a4e56), 1.3, 0.15, D - 1.0, false); }
    add(B(W * 0.4, 1.0, 0.8), plank(0x5a3a22), W * 0.68, 0.5, D * 0.7, true); add(B(W * 0.4 + 0.2, 0.1, 1.0), plank(0x7a5532), W * 0.68, 1.05, D * 0.7, true); for (const f of [-0.3, 0, 0.3]) solid(W * 0.68 + W * 0.4 * f, D * 0.7, 0.85);
    mug(W * 0.68 + 0.4, 1.13, D * 0.7); add(B(0.34, 0.05, 0.26), std(0x5a3a2a), W * 0.68 - 0.6, 1.12, D * 0.7, false); hay2(W - 1.0, D - 1.2, 1.1); barrel(W - 0.9, D * 0.42, 0.9); hang(cx, D * 0.5, 0xffc070, 38);
  } else if (variant === 20) { // 28/10: a casa do jogador, vazia — a mobília é ele quem põe (decor.ts)
    window_(W * 0.3, 'n'); window_(W * 0.72, 'n'); window_(D * 0.5, 'w'); hang(cx, D / 2);
  } else { // armeiro (loja)
    fireplace(W * 0.18);
    // forja brilhante
    add(B(1.4, 1.0, 1.1), std(0xffffff, { map: stoneTex(0x5a5650) }), W * 0.18 + 2.4, 0.5, 0.7); const co = new THREE.Mesh(B(1.0, 0.1, 0.7), new THREE.MeshBasicMaterial({ color: 0xff6a20 })); co.position.set(W * 0.18 + 2.4, 1.03, 0.7); g.add(co); light(W * 0.18 + 2.4, 1.6, 1.3, 0xff7a30, 45, 12); solid(W * 0.18 + 2.4, 0.7, 1.1);
    // balcão
    add(B(W * 0.6, 1.0, 0.8), plank(0x5a3a22), cx, 0.5, D * 0.5, true); add(B(W * 0.6 + 0.2, 0.1, 1.0), plank(0x7a5532), cx, 1.05, D * 0.5, true); solid(cx - 2, D * 0.5, 1.0); solid(cx, D * 0.5, 1.0); solid(cx + 2, D * 0.5, 1.0);
    // armas no balcão
    for (let k = 0; k < 4; k++) { const sw = new THREE.Mesh(B(0.07, 0.03, 0.9), std(0xc8ccd4)); sw.position.set(cx - 1.4 + k * 0.9, 1.13, D * 0.5); sw.rotation.y = 0.3 * (k - 1.5); g.add(sw); }
    // racks de armas e escudos nas paredes
    for (let k = 0; k < 3; k++) { const x = W * 0.45 + k * 1.9; add(B(1.5, 0.12, 0.12), wood(0x3a2616), x, 1.0, 0.1, false); add(B(1.5, 0.12, 0.12), wood(0x3a2616), x, 1.9, 0.1, false); for (let j = 0; j < 4; j++) { const sw = new THREE.Mesh(B(0.07, 1.2, 0.03), std(j % 2 ? 0xc8ccd4 : 0x9aa0aa)); sw.position.set(x - 0.5 + j * 0.33, 1.5, 0.15); g.add(sw); const hl = new THREE.Mesh(B(0.2, 0.06, 0.05), std(0x4a3220)); hl.position.set(x - 0.5 + j * 0.33, 0.95, 0.16); g.add(hl); } }
    for (let k = 0; k < 4; k++) { const s = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.06, 12), new THREE.MeshToonMaterial({ color: [0x8a2a2a, 0x2a4a8a, 0x6a6a72, 0xc9a24a][k] })); s.rotation.x = Math.PI / 2; s.position.set(0.1 + (k % 2) * 0.0 + 0.05, 1.7, D * 0.25 + k * 1.2); s.rotation.set(0, Math.PI / 2, Math.PI / 2); s.rotation.y = Math.PI / 2; g.add(s); const bs = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 5), std(0xe2c36a)); bs.position.set(0.18, 1.7, D * 0.25 + k * 1.2); g.add(bs); }
    // manequins com armadura
    for (const [mx, mz] of [[W - 1.2, 2.4], [W - 1.2, 4.0], [1.4, D - 1.4]] as [number, number][]) { add(new THREE.CylinderGeometry(0.06, 0.09, 1.0, 6), wood(0x3a2616), mx, 0.5, mz, false); add(B(0.55, 0.75, 0.32), std(0x7a8090), mx, 1.35, mz, true); add(new THREE.SphereGeometry(0.2, 8, 6), std(0x9aa0aa), mx, 1.95, mz, true); for (const s of [-1, 1]) add(new THREE.SphereGeometry(0.18, 6, 5), std(0x8a909c), mx + s * 0.38, 1.65, mz, false); solid(mx, mz, 0.5); }
    // bigorna
    add(B(0.5, 0.35, 0.9), std(0x2a2a32), W * 0.18 + 0.2, 0.55, 3.0); add(B(0.3, 0.45, 0.4), std(0x2a2a32), W * 0.18 + 0.2, 0.25, 3.0, false); solid(W * 0.18 + 0.2, 3.0, 0.7);
    rug(cx, D * 0.78, W * 0.4, 2.0, 0x6a2a2a); barrel(W - 0.9, D - 1.0); crate(W - 1.8, D - 0.9); chestI(1.2, D - 3.2, Math.PI / 2); hang(cx, D * 0.62, 0xffc070, 42);
  }
  /* móveis bloqueiam só o miolo (regra de ouro: mobilidade acima da física); squeeze = espremer-se entre eles quando travou */
  const free = (x: number, z: number, squeeze = false) => {
    if (ELF) { const dx = x - ECX, dz = z - ECZ, dd = Math.hypot(dx, dz); if (dd > ER - 0.45) { /* só a porta (sul) é passagem; o lado de bambu tem corrimão */ if (!(Math.abs(Math.atan2(dz, dx) - Math.PI / 2) < 0.3 && dd < ER + 0.3)) return false; }
      if (!squeeze) for (const [cx2, cz2, rad] of cols) if (Math.hypot(x - cx2, z - cz2) < rad * 0.7) return false; return true; }
    if (x < 0.45 || x > W - 0.45 || z < 0.45) return false;
    if (z > D - 0.1) return Math.abs(x - dx0) < dw / 2 - 0.25; /* na parede da porta só o vão da porta é passagem */
    if (!squeeze) for (const [cx2, cz2, rad] of cols) if (Math.hypot(x - cx2, z - cz2) < rad * 0.7) return false;
    return true;
  };
  const flicker = (t: number) => { for (const o of spin) o.rotation.y = t * 0.35; for (const l of lights) l.l.intensity = l.base * (0.9 + 0.1 * Math.sin(t * 9 + l.ph) + 0.05 * Math.sin(t * 23 + l.ph * 2)); };
  const floorY = stage ? (x: number, z: number) => (x > stage!.x0 && x < stage!.x1 && z > stage!.z0 && z < stage!.z1 ? stage!.y : 0) : undefined;
  return { group: g, W, D, colliders: cols, free, flicker, seats, reserveAt, reserveSign, reserveLabel, floorY, shop: variant === 5 || (variant >= 10 && variant <= 14) || variant === 31, exitZ: D + 0.9 };
}
