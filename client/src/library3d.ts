/* AS BIBLIOTECAS (Erling, 25/10): "suntuosa, magnífica, imensa, na cidade grande; na cidade média, uma mais simples, linda também,
   mas não como a do cronista".
   0 · Grande Biblioteca de Askavik — escadaria, pórtico de oito colunas com o frontão do Olho, rotunda com cúpula de cobre e lanterna
       dourada, alas de janelas altas em vitral, salão de estantes de dois andares, mesas de leitura, o orrery no centro, o mosaico do Olho
       no chão e as três escadas que descem aos subsolos (I, II, III).
   1 · Biblioteca de Lumenhal — um salão de marfim com telhado de ardósia azul, torrinha com o cristal, janelas em arco que brilham azul,
       estantes, mesas e o pequeno orbe dos magos.
   Frente para +z. O que está em `cut` (telhados, cúpula, paredes altas) some quando o herói entra (main.ts usa userData.cutBox). */
import * as THREE from 'three';
import { std, ink, stoneTex, plankTex, woodTex, shingleTex, ramp } from './toon3d';
import { CUTAWAYS } from './stations3d';

/** pegada em tiles (2 m) e paredes sólidas em metros locais [x0, z0, x1, z1] (com a porta aberta no meio da frente) */
export const LIB_SIZE: Record<number, { w: number; h: number }> = { 0: { w: 18, h: 14 }, 1: { w: 11, h: 9 } };
export const LIB_WALLS: Record<number, [number, number, number, number][]> = {
  0: [[-17, -12, 17, -12], [-17, -12, -17, 8.5], [17, -12, 17, 8.5], [-17, 8.5, -3.2, 8.5], [3.2, 8.5, 17, 8.5]],
  1: [[-10, -8, 10, -8], [-10, -8, -10, 6.5], [10, -8, 10, 6.5], [-10, 6.5, -1.8, 6.5], [1.8, 6.5, 10, 6.5]],
};
/** onde ficam as três escadas dos subsolos da Grande Biblioteca (metros locais) */
export const LIB_STAIRS: [number, number][] = [[-12.5, -9.5], [0, -10.4], [12.5, -9.5]];

const tex = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, rep?: [number, number]) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d')!); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter; if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); } return t; };
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
/** lombadas de livros: filas coloridas com filetes dourados */
const BOOKS = tex(128, 128, (g) => { g.fillStyle = '#2a1a10'; g.fillRect(0, 0, 128, 128); const C = ['#6a1a1a', '#1a3a5a', '#2a4a2a', '#5a3a1a', '#3a2a4a', '#8a6a2a', '#4a1a2a', '#1a2a3a'];
  for (let row = 0; row < 4; row++) { let x = 2; const y0 = row * 32 + 4; while (x < 124) { const w = 3 + Math.floor(rnd() * 5), h = 20 + Math.floor(rnd() * 7); g.fillStyle = C[Math.floor(rnd() * C.length)]; g.fillRect(x, y0 + 26 - h, w, h); g.fillStyle = 'rgba(230,190,90,.7)'; g.fillRect(x, y0 + 26 - h + 3, w, 1); g.fillRect(x, y0 + 22, w, 1); x += w + (rnd() < 0.1 ? 3 : 0.5); }
    g.fillStyle = '#4a2e18'; g.fillRect(0, y0 + 26, 128, 6); } });
const MARBLE = (c: string) => tex(64, 64, (g) => { g.fillStyle = c; g.fillRect(0, 0, 64, 64); g.strokeStyle = 'rgba(0,0,0,.08)'; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(rnd() * 64, 0); g.bezierCurveTo(rnd() * 64, 20, rnd() * 64, 44, rnd() * 64, 64); g.stroke(); } g.strokeStyle = 'rgba(0,0,0,.18)'; g.strokeRect(0.5, 0.5, 63, 63); });
const CHECK = tex(64, 64, (g) => { for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) { g.fillStyle = (x + y) % 2 ? '#d2c6ae' : '#8e7c64'; g.fillRect(x * 32, y * 32, 32, 32); } g.strokeStyle = 'rgba(0,0,0,.2)'; g.strokeRect(0, 0, 64, 64); }, [22, 16]);
/** o mosaico do Olho de Marghar, no centro da rotunda */
const EYE = tex(256, 256, (g) => { const cx = 128; g.fillStyle = '#3a2a1a'; g.beginPath(); g.arc(cx, cx, 126, 0, 6.283); g.fill(); for (let r = 120; r > 20; r -= 14) { g.strokeStyle = r % 28 ? '#c9a24a' : '#7a5a2a'; g.lineWidth = 4; g.beginPath(); g.arc(cx, cx, r, 0, 6.283); g.stroke(); }
  for (let i = 0; i < 24; i++) { const a = i / 24 * 6.283; g.strokeStyle = '#c9a24a'; g.lineWidth = 2; g.beginPath(); g.moveTo(cx + Math.cos(a) * 60, cx + Math.sin(a) * 60); g.lineTo(cx + Math.cos(a) * 118, cx + Math.sin(a) * 118); g.stroke(); }
  g.fillStyle = '#e8dcc0'; g.beginPath(); g.moveTo(cx - 52, cx); g.quadraticCurveTo(cx, cx - 46, cx + 52, cx); g.quadraticCurveTo(cx, cx + 46, cx - 52, cx); g.fill(); g.fillStyle = '#d9a24f'; g.beginPath(); g.arc(cx, cx, 20, 0, 6.283); g.fill(); g.fillStyle = '#1a1208'; g.beginPath(); g.arc(cx, cx, 9, 0, 6.283); g.fill(); });
const GLASS = (cols: string[]) => tex(32, 64, (g) => { for (let y = 0; y < 8; y++) for (let x = 0; x < 4; x++) { g.fillStyle = cols[(x + y * 3) % cols.length]; g.fillRect(x * 8, y * 8, 8, 8); } g.strokeStyle = '#1a1208'; g.lineWidth = 1.5; for (let x = 0; x <= 4; x++) { g.beginPath(); g.moveTo(x * 8, 0); g.lineTo(x * 8, 64); g.stroke(); } for (let y = 0; y <= 8; y++) { g.beginPath(); g.moveTo(0, y * 8); g.lineTo(32, y * 8); g.stroke(); } });
const nameTex = (label: string, bg: string, fg: string) => tex(1024, 128, (g) => { g.fillStyle = bg; g.fillRect(0, 0, 1024, 128); g.strokeStyle = '#c9a24a'; g.lineWidth = 6; g.strokeRect(8, 8, 1008, 112); let fs = 64; g.font = `bold ${fs}px Georgia, serif`; while (g.measureText(label).width > 960 && fs > 28) { fs -= 2; g.font = `bold ${fs}px Georgia, serif`; } g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(label, 512, 68); });

type Out = { group: THREE.Group; glows: { x: number; y: number; z: number; color: number; base: number }[] };
export function buildLibrary(v: number, label: string): Out {
  seed = 7 + v * 13;
  const g = new THREE.Group(), cut = new THREE.Group(); g.add(cut); CUTAWAYS.push(cut);
  let into: THREE.Object3D = g;
  const M = (geo: THREE.BufferGeometry, m: THREE.Material | THREE.Material[], x: number, y: number, z: number, rx = 0, ry = 0, rz = 0, sh = true) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); ink(o, 0.02); o.castShadow = sh; o.receiveShadow = true; into.add(o); return o; };
  const B = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d), C = (r0: number, r1: number, h: number, s = 12) => new THREE.CylinderGeometry(r0, r1, h, s);
  const glowM = (c: number) => new THREE.MeshBasicMaterial({ color: c });
  const books = std(0xffffff, { map: BOOKS }), beam = std(0xffffff, { map: woodTex(0x4a2e18) }), wood = std(0xffffff, { map: plankTex(0x6a4a2a) }), brass = std(0xc8a050), green = std(0x2a5a3a);
  const out: Out = { group: g, glows: [] };
  /** estante de livros (frente para +z local, depois gira) */
  const shelf = (x: number, z: number, w: number, h: number, ry: number) => { const s = new THREE.Group(); s.position.set(x, 0, z); s.rotation.y = ry; into.add(s); const prev = into; into = s;
    M(B(w, h, 0.5), beam, 0, h / 2, 0); const face = M(new THREE.PlaneGeometry(w - 0.2, h - 0.3), books, 0, h / 2, 0.26, 0, 0, 0, false); (face.material as THREE.MeshToonMaterial).map!.repeat?.set(1, 1); M(B(w + 0.1, 0.12, 0.6), beam, 0, h + 0.06, 0.02); into = prev; return s; };
  const table = (x: number, z: number, ry = 0) => { const t = new THREE.Group(); t.position.set(x, 0, z); t.rotation.y = ry; into.add(t); const prev = into; into = t;
    M(B(2.4, 0.1, 1.0), wood, 0, 0.82, 0); for (const sx of [-1, 1]) M(B(0.12, 0.8, 0.9), beam, sx * 1.0, 0.4, 0);
    for (const sx of [-0.7, 0.7]) { M(C(0.05, 0.08, 0.06, 8), brass, sx, 0.9, -0.2); M(C(0.015, 0.015, 0.32, 5), brass, sx, 1.06, -0.2); M(new THREE.SphereGeometry(0.13, 10, 6, 0, 6.283, 0, Math.PI / 2), green, sx, 1.2, -0.2); M(new THREE.SphereGeometry(0.05, 8, 6), glowM(0xffe0a0), sx, 1.17, -0.2, 0, 0, 0, false); }
    M(B(0.5, 0.06, 0.36), std(0xe8dcc0), -0.2, 0.9, 0.15, 0, 0.2, 0, false); M(B(0.42, 0.1, 0.3), std(0x6a1a1a), 0.5, 0.92, 0.1, 0, -0.3, 0, false);
    for (const sz of [-1, 1]) for (const sx of [-0.6, 0.6]) { M(B(0.45, 0.06, 0.45), wood, sx, 0.5, sz * 0.85); M(B(0.45, 0.6, 0.06), wood, sx, 0.8, sz * 1.08); for (const qx of [-0.18, 0.18]) M(B(0.05, 0.5, 0.05), beam, sx + qx, 0.25, sz * 0.85); }
    into = prev; };
  const window_ = (x: number, y: number, z: number, w: number, h: number, ry: number, cols: string[], glowC: number) => { const gm = std(0xffffff, { map: GLASS(cols), emissive: new THREE.Color(glowC), emissiveIntensity: 0.55 });
    const pane = M(new THREE.PlaneGeometry(w, h), gm, x, y, z, 0, ry, 0, false); const arch = M(new THREE.CircleGeometry(w / 2, 14, 0, Math.PI), gm, x, y + h / 2, z, 0, ry, 0, false); void pane; void arch; };

  if (v === 0) {
    const marble = std(0xffffff, { map: MARBLE('#d8d0c0') }), marbleD = std(0xffffff, { map: MARBLE('#a89a88') }), stone = std(0xffffff, { map: stoneTex(0x9a9286) }), copper = std(0x5a9a86), gold = std(0xe6c46a, { emissive: new THREE.Color(0x3a2a08) });
    const W = 34, D = 20.5, H = 9, Z0 = -1.75; // corpo: z de −12 a 8,5
    /* embasamento, piso e escadaria */
    M(B(W + 1, 0.8, D + 1), stone, 0, 0.4, Z0); const fl = M(B(W - 0.4, 0.06, D - 0.4), std(0xffffff, { map: CHECK }), 0, 0.83, Z0, 0, 0, 0, false); void fl;
    for (let i = 0; i < 5; i++) M(B(16 - i * 0.4, 0.16, 0.7), marble, 0, 0.08 + i * 0.16, 12.2 - i * 0.7 + 0.35);
    M(B(16, 0.8, 3.2), marble, 0, 0.4, 10.1); // patamar do pórtico
    const F = 0.86; // altura do piso de dentro
    /* paredes: embaixo inteiras (corpo), em cima no corte */
    const wall = (x0: number, z0: number, x1: number, z1: number, gap = 0) => { const len = Math.hypot(x1 - x0, z1 - z0), ux = (x1 - x0) / len, uz = (z1 - z0) / len, ang = -Math.atan2(uz, ux);
      const seg = (a: number, b: number) => { const L2 = b - a, px = x0 + ux * (a + b) / 2, pz = z0 + uz * (a + b) / 2; into = g; M(B(L2, 3.0, 0.6), marble, px, F + 1.5, pz, 0, ang, 0); into = cut; M(B(L2, H - 3, 0.6), marble, px, F + 3 + (H - 3) / 2, pz, 0, ang, 0); into = g; };
      if (gap) { seg(0, len / 2 - gap / 2); seg(len / 2 + gap / 2, len); } else seg(0, len); };
    wall(-W / 2, -12, W / 2, -12); wall(-W / 2, -12, -W / 2, 8.5); wall(W / 2, -12, W / 2, 8.5); wall(-W / 2, 8.5, W / 2, 8.5, 6.4);
    /* pilastras e janelas altas em vitral nas alas e no fundo */
    into = cut; for (const sx of [-1, 1]) for (let z = -10; z <= 6; z += 4) { M(B(0.8, H, 0.9), marbleD, sx * (W / 2 + 0.15), F + H / 2, z); window_(sx * (W / 2 + 0.32), F + 4.8, z + 2, 1.6, 4.2, sx * Math.PI / 2, ['#c9a24a', '#8a2a2a', '#2a4a8a', '#e8d090'], 0xffb050); }
    for (let x = -14; x <= 14; x += 4) { M(B(0.9, H, 0.8), marbleD, x, F + H / 2, -12.15); if (Math.abs(x) > 3) window_(x + 2, F + 4.8, -12.46, 1.6, 4.2, Math.PI, ['#2a4a8a', '#c9a24a', '#6a2a6a', '#e8d090'], 0xffa040); }
    for (let x = -15; x <= 15; x += 5) if (Math.abs(x) > 4) window_(x, F + 4.8, 8.82, 1.6, 4.2, 0, ['#c9a24a', '#8a2a2a', '#e8d090', '#2a6a4a'], 0xffb050);
    /* cornija e balaustrada do telhado plano das alas */
    M(B(W + 1.2, 0.5, D + 1.2), marbleD, 0, F + H + 0.25, Z0); M(B(W, 0.2, D), stone, 0, F + H + 0.55, Z0);
    for (const sx of [-1, 1]) for (let z = -11.5; z <= 8; z += 0.9) M(C(0.09, 0.12, 0.7, 6), marble, sx * (W / 2 + 0.2), F + H + 0.85, z, 0, 0, 0, false);
    for (let x = -16.5; x <= 16.5; x += 0.9) { M(C(0.09, 0.12, 0.7, 6), marble, x, F + H + 0.85, -12.3, 0, 0, 0, false); if (Math.abs(x) > 7.5) M(C(0.09, 0.12, 0.7, 6), marble, x, F + H + 0.85, 8.8, 0, 0, 0, false); }
    into = g;
    /* PÓRTICO: oito colunas caneladas, entablamento com o nome, frontão com o Olho */
    for (let i = 0; i < 8; i++) { const x = -7 + i * 2; const col = new THREE.Group(); col.position.set(x, 0.8, 10.6); cut.add(col); into = col;
      M(B(1.1, 0.3, 1.1), marble, 0, 0.15, 0); M(C(0.46, 0.5, 7.4, 16), marble, 0, 0.3 + 3.7, 0); for (let k = 0; k < 8; k++) { const a = k / 8 * 6.283; M(B(0.06, 7.2, 0.06), marbleD, Math.cos(a) * 0.47, 4.0, Math.sin(a) * 0.47, 0, 0, 0, false); } M(B(1.2, 0.35, 1.2), marble, 0, 7.85, 0); M(C(0.62, 0.46, 0.4, 16), marble, 0, 7.55, 0); into = g; } /* (as colunas também somem quando você entra: elas tapam a vista do salão) */
    into = cut; M(B(16.4, 1.0, 2.6), marble, 0, 0.8 + 8.5, 10.6);
    { const nm = std(0xffffff, { map: nameTex(label.toUpperCase(), '#2a1a10', '#f2cf8a'), emissive: new THREE.Color(0x2a1a08), emissiveMap: nameTex(label.toUpperCase(), '#2a1a10', '#f2cf8a') }); M(new THREE.PlaneGeometry(14.5, 0.9), nm, 0, 0.8 + 8.5, 11.92, 0, 0, 0, false); }
    { const tri = new THREE.Shape(); tri.moveTo(-8.4, 0); tri.lineTo(8.4, 0); tri.lineTo(0, 3.0); tri.closePath(); M(new THREE.ExtrudeGeometry(tri, { depth: 2.6, bevelEnabled: false }), marble, 0, 0.8 + 9.0, 9.3);
      const eye = M(new THREE.CircleGeometry(1.0, 24), std(0xffffff, { map: EYE, emissive: new THREE.Color(0x4a3010), emissiveMap: EYE }), 0, 0.8 + 10.1, 11.92, 0, 0, 0, false); void eye;
      for (const sx of [-1, 1]) { const r = M(B(9.6, 0.25, 3.0), copper, sx * 4.15, 0.8 + 10.5, 10.6, 0, 0, -sx * Math.atan2(3, 8.4)); void r; } }
    into = g;
    /* ROTUNDA: tambor com janelas em volta, cúpula de cobre com nervuras douradas, lanterna e o pináculo */
    into = cut; const RZ = -2; M(C(7.4, 7.6, 4.2, 32), marble, 0, F + H + 2.1, RZ); for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283; M(B(0.5, 4.2, 0.5), marbleD, Math.sin(a) * 7.65, F + H + 2.1, RZ + Math.cos(a) * 7.65, 0, a, 0); if (i % 2) window_(Math.sin(a) * 7.72, F + H + 2.0, RZ + Math.cos(a) * 7.72, 1.1, 2.4, a, ['#e8d090', '#c9a24a', '#2a4a8a'], 0xffc060); }
    M(new THREE.SphereGeometry(7.4, 32, 14, 0, 6.283, 0, Math.PI / 2), copper, 0, F + H + 4.2, RZ); for (let i = 0; i < 16; i++) { const rib = M(new THREE.TorusGeometry(7.42, 0.08, 4, 24, Math.PI / 2), gold, 0, F + H + 4.2, RZ, 0, i / 16 * 6.283, Math.PI / 2, false); void rib; }
    M(C(1.1, 1.3, 1.6, 12), marble, 0, F + H + 4.2 + 7.4 + 0.6, RZ); for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283; M(new THREE.PlaneGeometry(0.4, 0.9), glowM(0xffd890), Math.sin(a) * 1.12, F + H + 4.2 + 7.4 + 0.6, RZ + Math.cos(a) * 1.12, 0, a, 0, false); }
    M(new THREE.SphereGeometry(1.2, 16, 8, 0, 6.283, 0, Math.PI / 2), copper, 0, F + H + 4.2 + 7.4 + 1.4, RZ); M(new THREE.ConeGeometry(0.15, 2.0, 8), gold, 0, F + H + 4.2 + 7.4 + 3.2, RZ); M(new THREE.SphereGeometry(0.3, 12, 8), gold, 0, F + H + 4.2 + 7.4 + 2.4, RZ);
    into = g;
    /* DENTRO: o mosaico do Olho, o orrery, estantes de dois andares nas alas e em volta da rotunda, mesas, escadas de mão */
    M(new THREE.CircleGeometry(5.0, 40), std(0xffffff, { map: EYE }), 0, F + 0.04, RZ, -Math.PI / 2, 0, 0, false);
    M(C(0.6, 0.8, 1.2, 12), marbleD, 0, F + 0.6, RZ); M(new THREE.SphereGeometry(0.5, 16, 12), std(0x2a4a6a, { emissive: new THREE.Color(0x0a1a3a) }), 0, F + 1.9, RZ);
    for (let i = 0; i < 3; i++) M(new THREE.TorusGeometry(0.85 + i * 0.3, 0.03, 4, 32), brass, 0, F + 1.9, RZ, Math.PI / 2 + i * 0.4, i * 0.7, 0, false);
    for (let i = 0; i < 4; i++) { const a = i / 4 * 6.283 + 0.4; M(new THREE.SphereGeometry(0.1, 8, 6), glowM([0xffd070, 0x9ad7ff, 0xff8a6a, 0xc8ffb0][i]), Math.cos(a) * (0.85 + i * 0.3), F + 1.9, RZ + Math.sin(a) * (0.85 + i * 0.3), 0, 0, 0, false); }
    out.glows.push({ x: 0, y: F + 2.2, z: RZ, color: 0xffd8a0, base: 26 });
    for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; if (Math.abs(Math.sin(a)) < 0.3 && Math.cos(a) > 0) continue; /* a abertura que dá para a porta */ const r = 6.6; const s = shelf(Math.sin(a) * r, RZ + Math.cos(a) * r, 3.0, 3.2, a + Math.PI); void s; }
    into = g; for (const sx of [-1, 1]) for (let k = 0; k < 4; k++) { const z = -10 + k * 4.6; shelf(sx * (W / 2 - 0.6), z, 3.6, 4.6, -sx * Math.PI / 2); }
    for (let k = -3; k <= 3; k++) if (Math.abs(k) > 0) shelf(k * 4.4 + (k > 0 ? 0.8 : -0.8), -11.4, 3.6, 4.6, 0);
    /* a galeria de cima: um passadiço de madeira com corrimão ao longo das alas (no corte) */
    into = cut; for (const sx of [-1, 1]) { M(B(2.2, 0.2, D - 2), wood, sx * (W / 2 - 1.6), F + 4.8, Z0); for (let z = -11; z <= 7.5; z += 1.1) M(C(0.04, 0.04, 1.0, 5), beam, sx * (W / 2 - 2.7), F + 5.4, z, 0, 0, 0, false); M(B(0.1, 0.1, D - 2), beam, sx * (W / 2 - 2.7), F + 5.9, Z0); for (let k = 0; k < 4; k++) shelf(sx * (W / 2 - 0.6), -10 + k * 4.6, 3.6, 3.2, -sx * Math.PI / 2).position.y = F + 4.9; } into = g;
    for (const [x, z] of [[-9, -5], [-9, 1], [9, -5], [9, 1], [-9, 6], [9, 6]] as const) table(x, z, 0);
    for (const sx of [-1, 1]) { const lad = new THREE.Group(); lad.position.set(sx * (W / 2 - 1.3), F, -3); lad.rotation.set(0, sx * Math.PI / 2, sx * 0.2); g.add(lad); into = lad; for (const qx of [-0.25, 0.25]) M(B(0.06, 4.4, 0.06), beam, qx, 2.2, 0); for (let k = 0; k < 9; k++) M(B(0.5, 0.05, 0.05), beam, 0, 0.3 + k * 0.48, 0); into = g; }
    /* lustres: aros de ferro com velas acesas pendurados do teto (no corte) */
    into = cut; for (const [x, z] of [[-9, -2], [9, -2], [0, 5.5]] as const) { M(new THREE.TorusGeometry(1.0, 0.05, 4, 20), std(0x2e3238), x, F + 6.2, z, Math.PI / 2, 0, 0, false); M(C(0.02, 0.02, 2.4, 4), std(0x2e3238), x, F + 7.4, z, 0, 0, 0, false); for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283; M(C(0.04, 0.04, 0.2, 5), std(0xf0e8d0), x + Math.cos(a), F + 6.35, z + Math.sin(a), 0, 0, 0, false); M(new THREE.SphereGeometry(0.05, 6, 4), glowM(0xffd070), x + Math.cos(a), F + 6.5, z + Math.sin(a), 0, 0, 0, false); } out.glows.push({ x, y: F + 6.2, z, color: 0xffc070, base: 18 }); } into = g;
    /* as três escadas que descem: arco de pedra escura, degraus que somem no escuro, a placa com o número do subsolo */
    LIB_STAIRS.forEach(([x, z], i) => { const st = new THREE.Group(); st.position.set(x, F, z); g.add(st); into = st; const dark = std(0xffffff, { map: stoneTex(0x4a4640) });
      M(B(3.2, 0.1, 2.6), std(0x0a0806), 0, -0.02, 0.2, 0, 0, 0, false); for (let k = 0; k < 6; k++) M(B(2.6, 0.12, 0.38), dark, 0, -0.08 - k * 0.14, 1.2 - k * 0.38, 0, 0, 0, false);
      for (const sx of [-1, 1]) { M(B(0.4, 3.0, 0.5), dark, sx * 1.6, 1.5, -0.9); M(B(0.25, 0.8, 2.8), dark, sx * 1.55, 0.4, 0.3); } M(new THREE.TorusGeometry(1.6, 0.24, 6, 16, Math.PI), dark, 0, 3.0, -0.9);
      const roman = ['I', 'II', 'III'][i]; const sg = std(0xffffff, { map: nameTex(`${roman} · ${['Arquivo dos Mapas', 'Galerias Proibidas', 'A Escada Sem Fim'][i]}`, '#1a1208', '#e8c890') }); M(new THREE.PlaneGeometry(3.0, 0.38), sg, 0, 3.7, -0.86, 0, 0, 0, false);
      M(B(0.16, 0.22, 0.16), std(0x2e3238), 1.6, 2.6, -0.5, 0, 0, 0, false); M(B(0.1, 0.14, 0.1), glowM(i === 2 ? 0x9a6aff : 0xffb050), 1.6, 2.6, -0.5, 0, 0, 0, false); into = g;
      out.glows.push({ x: x + 1.6, y: F + 2.6, z: z - 0.5, color: i === 2 ? 0x9a6aff : 0xffb050, base: 10 }); });
    /* estátuas dos cronistas na escadaria e estandartes */
    for (const sx of [-1, 1]) { const s = new THREE.Group(); s.position.set(sx * 9.2, 0.8, 11.4); g.add(s); into = s; M(B(1.2, 1.4, 1.2), marbleD, 0, 0.7, 0); M(C(0.35, 0.55, 2.0, 10), marble, 0, 2.4, 0); M(new THREE.SphereGeometry(0.3, 10, 8), marble, 0, 3.7, 0); M(B(0.5, 0.36, 0.08), marble, sx * -0.3, 2.9, 0.35, 0.3, 0, 0, false); into = g; }
    for (const sx of [-1, 1]) { M(C(0.06, 0.06, 4.0, 6), brass, sx * 15, F + H + 2.8, 8.6, 0, 0, 0, false); M(B(1.3, 2.4, 0.04), std(0x6a1a2a), sx * 15.7, F + H + 3.4, 8.6, 0, 0, 0, false); M(new THREE.CircleGeometry(0.35, 12), std(0xffffff, { map: EYE }), sx * 15.7, F + H + 3.6, 8.63, 0, 0, 0, false); }
    cut.userData.cutBox = { hw: 17, z0: -12, z1: 8.6 };
  } else {
    /* Biblioteca de Lumenhal: salão de marfim, ardósia azul, torrinha com o cristal */
    const ivory = std(0xffffff, { map: MARBLE('#e8e0d0') }), ivoryD = std(0xffffff, { map: MARBLE('#b8aea0') }), slate = std(0xffffff, { map: shingleTex(0x3a4a6a) }), stone = std(0xffffff, { map: stoneTex(0x8a857c) });
    const W = 20, D = 14.5, H = 6.5, Z0 = -0.75, F = 0.5;
    M(B(W + 0.8, 0.5, D + 0.8), stone, 0, 0.25, Z0); M(B(W - 0.4, 0.05, D - 0.4), std(0xffffff, { map: CHECK }), 0, 0.53, Z0, 0, 0, 0, false);
    for (let i = 0; i < 3; i++) M(B(5 - i * 0.4, 0.17, 0.6), ivory, 0, 0.085 + i * 0.17, 8.2 - i * 0.6);
    const wall = (x0: number, z0: number, x1: number, z1: number, gap = 0) => { const len = Math.hypot(x1 - x0, z1 - z0), ux = (x1 - x0) / len, uz = (z1 - z0) / len, ang = -Math.atan2(uz, ux);
      const seg = (a: number, b: number) => { const px = x0 + ux * (a + b) / 2, pz = z0 + uz * (a + b) / 2; into = g; M(B(b - a, 2.6, 0.5), ivory, px, F + 1.3, pz, 0, ang, 0); into = cut; M(B(b - a, H - 2.6, 0.5), ivory, px, F + 2.6 + (H - 2.6) / 2, pz, 0, ang, 0); into = g; };
      if (gap) { seg(0, len / 2 - gap / 2); seg(len / 2 + gap / 2, len); } else seg(0, len); };
    wall(-W / 2, -8, W / 2, -8); wall(-W / 2, -8, -W / 2, 6.5); wall(W / 2, -8, W / 2, 6.5); wall(-W / 2, 6.5, W / 2, 6.5, 3.6);
    into = cut; for (const sx of [-1, 1]) for (let z = -6; z <= 4; z += 3.4) { M(B(0.6, H, 0.7), ivoryD, sx * (W / 2 + 0.1), F + H / 2, z); window_(sx * (W / 2 + 0.27), F + 3.6, z + 1.7, 1.2, 2.8, sx * Math.PI / 2, ['#9ad7ff', '#e8f0ff', '#5a7ac8', '#c8b8ff'], 0x6ab0ff); }
    for (const x of [-6, 6]) window_(x, F + 3.6, 6.77, 1.2, 2.8, 0, ['#9ad7ff', '#e8f0ff', '#5a7ac8'], 0x6ab0ff);
    { const hw = W / 2 + 0.6, pitch = 0.5, L = hw / Math.cos(pitch); for (const sx of [-1, 1]) M(B(L, 0.16, D + 1.4), slate, sx * hw / 2, F + H + Math.tan(pitch) * hw / 2, Z0, 0, 0, -sx * pitch);
      const top = F + H + Math.tan(pitch) * hw; M(B(0.25, 0.25, D + 1.5), ivoryD, 0, top + 0.1, Z0);
      for (const fz of [6.5, -8]) { const tri = new THREE.Shape(); tri.moveTo(-W / 2, 0); tri.lineTo(W / 2, 0); tri.lineTo(0, Math.tan(pitch) * W / 2); tri.closePath(); M(new THREE.ExtrudeGeometry(tri, { depth: 0.4, bevelEnabled: false }), ivory, 0, F + H, fz - 0.2); }
      window_(0, F + H + 1.6, 6.75, 1.4, 1.2, 0, ['#9ad7ff', '#c8b8ff', '#e8f0ff'], 0x6ab0ff);
      /* a torrinha com o cristal dos magos */
      M(C(1.0, 1.1, 2.6, 8), ivory, 0, top + 1.2, -4); M(new THREE.ConeGeometry(1.3, 2.6, 8), slate, 0, top + 3.8, -4); M(new THREE.OctahedronGeometry(0.45, 0), new THREE.MeshBasicMaterial({ color: 0x8ad0ff }), 0, top + 5.6, -4, 0, 0, 0, false);
      out.glows.push({ x: 0, y: top + 5.6, z: -4, color: 0x8ad0ff, base: 16 }); }
    into = g;
    /* fachada: arco de entrada com o nome */
    M(new THREE.TorusGeometry(2.0, 0.3, 6, 16, Math.PI), ivoryD, 0, F + 2.6, 6.75); for (const sx of [-1, 1]) M(B(0.6, 2.6, 0.7), ivoryD, sx * 2.0, F + 1.3, 6.75);
    { const nt = nameTex(label, '#1a2238', '#bfe0ff'); M(new THREE.PlaneGeometry(6.4, 0.75), std(0xffffff, { map: nt, emissive: new THREE.Color(0x0a1a3a), emissiveMap: nt }), 0, F + 5.2, 7.05, 0, 0, 0, false); }
    /* dentro: estantes nas paredes, mesas, o orbe */
    for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) shelf(sx * (W / 2 - 0.5), -6 + k * 4, 3.4, 3.6, -sx * Math.PI / 2);
    for (let k = -2; k <= 2; k++) shelf(k * 3.8, -7.4, 3.4, 3.6, 0);
    for (const [x, z] of [[-4.5, -2], [4.5, -2], [-4.5, 2.6], [4.5, 2.6]] as const) table(x, z);
    M(C(0.4, 0.55, 1.0, 10), ivoryD, 0, F + 0.5, -3); M(new THREE.SphereGeometry(0.42, 16, 12), new THREE.MeshBasicMaterial({ color: 0x9ad7ff, transparent: true, opacity: 0.8 }), 0, F + 1.45, -3, 0, 0, 0, false);
    out.glows.push({ x: 0, y: F + 1.5, z: -3, color: 0x9ad7ff, base: 18 });
    cut.userData.cutBox = { hw: 10, z0: -8, z1: 6.8 };
  }
  cut.traverse((o) => { o.userData.keep = true; });
  return out;
}
void ramp;
