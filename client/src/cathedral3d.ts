/** A Catedral Abandonada por dentro — arquitetura gótica de verdade, majestosa e em ruína.
 *  Andar 1 (nave): planta em cruz — narthex com pia batismal, nave central com pilares feixe e arcadas ogivais, naves laterais
 *  com vitrais lanceolados e fachos de luz, transepto com órgão e capelas, cruzeiro com o lustre caído, coro e abside com
 *  retábulo dourado e rosácea. Andares 2–4 (criptas): salões abobadados (nervuras cruzadas), ossários, nichos de sepultura,
 *  sarcófagos com efígies. Andar 5: o santuário profano do Bispo. Origem local (0,0) = canto noroeste; saída ao sul (z > D).
 *  Câmera olha de sudeste: paredes norte/oeste altas, sul/leste baixas. */
import * as THREE from 'three';
import { std, ink, stoneTex, plankTex, woodTex, ramp } from './toon3d';
import { mergeStatic } from './merge3d';
import type { Interior } from './interiors3d';

export interface CathedralFloor extends Interior {
  stairs?: { x: number; z: number };
  door?: { x: number; z: number; open(): void };
  spawnPts: { x: number; z: number }[]; elitePt: { x: number; z: number };
  throne?: { x: number; z: number };
  /** Vasilhame do Sacrifício: o sangue dos mortos deste andar enche a taça; fill(0..1) */
  vessel?: { x: number; z: number; fill(k: number, t: number): void };
}
const rr = (s: number) => () => { s = (s * 16807) % 2147483647; return s / 2147483647; };

/* ---------------- texturas pintadas (cache) ---------------- */
const TC = new Map<string, THREE.CanvasTexture>();
function ctex(key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, rep = true) {
  let t = TC.get(key); if (t) return t; const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d')!);
  t = new THREE.CanvasTexture(c); if (rep) t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace; TC.set(key, t); return t;
}
const R0 = rr(77);
/** lajes grandes de pedra (4×4 por textura), algumas rachadas e afundadas */
const slabTex = (a: string, b: string) => ctex('slab' + a + b, 256, 256, (g) => {
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { const k = R0(); g.fillStyle = (x + y) % 2 ? a : b; g.fillRect(x * 64, y * 64, 64, 64); g.fillStyle = `rgba(0,0,0,${0.05 + k * 0.18})`; g.fillRect(x * 64, y * 64, 64, 64);
    for (let i = 0; i < 26; i++) { g.fillStyle = `rgba(255,255,255,${R0() * 0.05})`; g.fillRect(x * 64 + R0() * 60, y * 64 + R0() * 60, 2 + R0() * 5, 1 + R0() * 3); }
    if (k > 0.72) { g.strokeStyle = 'rgba(10,8,6,.7)'; g.lineWidth = 1.5; g.beginPath(); let px = x * 64 + R0() * 64, py = y * 64; g.moveTo(px, py); for (let s = 0; s < 6; s++) { px += (R0() - 0.5) * 22; py += 11; g.lineTo(px, py); } g.stroke(); } }
  g.strokeStyle = 'rgba(14,10,8,.85)'; g.lineWidth = 3; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, 256); g.stroke(); g.beginPath(); g.moveTo(0, i * 64); g.lineTo(256, i * 64); g.stroke(); } });
/** mármore em losangos (preto e marfim) com filetes dourados — o chão da nave central */
const marbleTex = () => ctex('marble', 128, 128, (g) => {
  g.fillStyle = '#a8a092'; g.fillRect(0, 0, 128, 128); g.fillStyle = '#4a4650'; g.beginPath(); g.moveTo(64, 0); g.lineTo(128, 64); g.lineTo(64, 128); g.lineTo(0, 64); g.closePath(); g.fill();
  g.fillStyle = '#5e2a2e'; g.beginPath(); g.moveTo(64, 50); g.lineTo(78, 64); g.lineTo(64, 78); g.lineTo(50, 64); g.closePath(); g.fill();
  g.strokeStyle = '#8a7046'; g.lineWidth = 2; g.beginPath(); g.moveTo(64, 0); g.lineTo(128, 64); g.lineTo(64, 128); g.lineTo(0, 64); g.closePath(); g.stroke();
  for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(0,0,0,${R0() * 0.12})`; g.fillRect(R0() * 128, R0() * 128, 2 + R0() * 6, 1 + R0() * 2); } });
/** tapete vermelho comprido, roído e com bordas douradas (com furos transparentes) */
const carpetTex = () => ctex('carpet', 64, 256, (g) => {
  g.fillStyle = '#5a0e16'; g.fillRect(0, 0, 64, 256); g.fillStyle = '#b8924a'; g.fillRect(4, 0, 4, 256); g.fillRect(56, 0, 4, 256);
  for (let y = 10; y < 256; y += 32) { g.strokeStyle = '#8a6a2a'; g.lineWidth = 2; g.beginPath(); g.moveTo(32, y); g.lineTo(44, y + 12); g.lineTo(32, y + 24); g.lineTo(20, y + 12); g.closePath(); g.stroke(); }
  for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(0,0,0,${R0() * 0.25})`; g.fillRect(R0() * 64, R0() * 256, 2, 2); }
  g.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 9; i++) { g.beginPath(); g.ellipse(R0() * 64, R0() * 256, 3 + R0() * 9, 4 + R0() * 14, R0() * 3, 0, 6.283); g.fill(); } }, true);
/** vitral lanceolado: ogiva com chumbo e vidros coloridos (santos e o Olho) */
const glassTex = (pal: string[], key: string) => ctex('glass' + key, 64, 192, (g) => {
  g.fillStyle = '#0a0810'; g.fillRect(0, 0, 64, 192); g.save(); g.beginPath(); g.moveTo(4, 192); g.lineTo(4, 60); g.quadraticCurveTo(4, 8, 32, 2); g.quadraticCurveTo(60, 8, 60, 60); g.lineTo(60, 192); g.closePath(); g.clip();
  for (let y = 0; y < 192; y += 12) for (let x = 0; x < 64; x += 10) { g.fillStyle = pal[Math.floor(R0() * pal.length)]; g.fillRect(x + (y / 12 % 2) * 5, y, 10, 12); }
  g.fillStyle = '#f0e0a0'; g.beginPath(); g.ellipse(32, 52, 10, 6, 0, 0, 6.283); g.fill(); g.fillStyle = '#1a1030'; g.beginPath(); g.arc(32, 52, 3.5, 0, 6.283); g.fill(); // o Olho
  g.fillStyle = 'rgba(255,240,200,.35)'; g.fillRect(24, 80, 16, 70); g.fillStyle = 'rgba(255,240,200,.5)'; g.beginPath(); g.arc(32, 78, 7, 0, 6.283); g.fill(); // figura de santo
  g.strokeStyle = '#0a0810'; g.lineWidth = 2; for (let y = 24; y < 192; y += 24) { g.beginPath(); g.moveTo(0, y); g.lineTo(64, y); g.stroke(); } g.beginPath(); g.moveTo(32, 0); g.lineTo(32, 192); g.stroke(); g.restore();
  g.strokeStyle = '#3a3240'; g.lineWidth = 4; g.beginPath(); g.moveTo(4, 192); g.lineTo(4, 60); g.quadraticCurveTo(4, 8, 32, 2); g.quadraticCurveTo(60, 8, 60, 60); g.lineTo(60, 192); g.stroke(); }, false);
/** rosácea */
const roseTex = (pal: string[], key: string) => ctex('rose' + key, 256, 256, (g) => {
  g.clearRect(0, 0, 256, 256); const c = 128; for (let ring = 3; ring >= 0; ring--) { const r1 = 30 + ring * 24; const n = 8 + ring * 8; for (let i = 0; i < n; i++) { g.fillStyle = pal[(i + ring) % pal.length]; g.beginPath(); g.moveTo(c, c); g.arc(c, c, r1, i / n * 6.283, (i + 1) / n * 6.283); g.closePath(); g.fill(); } }
  g.strokeStyle = '#120c14'; g.lineWidth = 3; for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283; g.beginPath(); g.moveTo(c, c); g.lineTo(c + Math.cos(a) * 124, c + Math.sin(a) * 124); g.stroke(); } for (let ring = 0; ring < 5; ring++) { g.beginPath(); g.arc(c, c, 30 + ring * 24, 0, 6.283); g.stroke(); }
  g.fillStyle = '#f0e0a0'; g.beginPath(); g.ellipse(c, c, 20, 12, 0, 0, 6.283); g.fill(); g.fillStyle = '#200a14'; g.beginPath(); g.arc(c, c, 7, 0, 6.283); g.fill();
  g.globalCompositeOperation = 'destination-in'; g.beginPath(); g.arc(c, c, 124, 0, 6.283); g.fill(); }, false);
/** parede de ossário: crânios empilhados em nichos */
const ossuaryTex = () => ctex('ossu', 128, 128, (g) => {
  g.fillStyle = '#2a2620'; g.fillRect(0, 0, 128, 128);
  for (let y = 0; y < 128; y += 16) for (let x = -(y / 16 % 2) * 8; x < 128; x += 16) { g.fillStyle = '#c8bea4'; g.beginPath(); g.ellipse(x + 8, y + 7, 6.5, 6, 0, 0, 6.283); g.fill(); g.fillStyle = '#1a1610'; g.fillRect(x + 4, y + 6, 3, 3); g.fillRect(x + 9, y + 6, 3, 3); g.fillRect(x + 7, y + 10, 2, 3); g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(x + 2, y + 12, 12, 3); } });
/** círculo ritual profano do Bispo (runas vermelhas) */
const ritualTex = () => ctex('ritual', 256, 256, (g) => {
  g.clearRect(0, 0, 256, 256); g.strokeStyle = '#ff3a2a'; g.lineWidth = 4; g.shadowColor = '#ff2010'; g.shadowBlur = 8; const c = 128;
  for (const r of [120, 100, 54]) { g.beginPath(); g.arc(c, c, r, 0, 6.283); g.stroke(); }
  g.beginPath(); for (let i = 0; i <= 5; i++) { const a = -Math.PI / 2 + i * 4 * Math.PI / 5; const x = c + Math.cos(a) * 100, y = c + Math.sin(a) * 100; if (i) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke();
  g.lineWidth = 2; for (let i = 0; i < 24; i++) { const a = i / 24 * 6.283, x = c + Math.cos(a) * 110, y = c + Math.sin(a) * 110; g.save(); g.translate(x, y); g.rotate(a); g.beginPath(); g.moveTo(-4, -5); g.lineTo(4, 0); g.lineTo(-4, 5); if (i % 2) { g.moveTo(0, -5); g.lineTo(0, 5); } g.stroke(); g.restore(); } }, false);

/* ---------------- peças de arquitetura ---------------- */
/** curva de arco ogival (lanceta abaixada): springers em ±s/2, ápice em x=0 */
function ogive(span: number, k = 0.62, n = 9) {
  const r = span * k, cxL = -span / 2 + r, h = Math.sqrt(r * r - cxL * cxL); const pts: THREE.Vector3[] = [];
  const aEnd = Math.atan2(h, -cxL); // ângulo no ápice (centro à esquerda)
  for (let i = 0; i <= n; i++) { const a = Math.PI - (Math.PI - aEnd) * i / n; pts.push(new THREE.Vector3(cxL + Math.cos(a) * r, Math.sin(a) * r, 0)); }
  for (let i = n - 1; i >= 0; i--) { const p = pts[i]; pts.push(new THREE.Vector3(-p.x, p.y, 0)); }
  return { pts, h };
}

export function buildCathedralFloor(floor: number, seed = 11): CathedralFloor {
  const g = new THREE.Group(), cols: [number, number, number][] = [], r = rr(seed * 131 + floor * 17 + 3);
  const fixtures: { x: number; y: number; z: number; c: number; i: number; dist: number; ph: number }[] = [];
  const pool: THREE.PointLight[] = []; for (let k = 0; k < 10; k++) { const l = new THREE.PointLight(0xffb040, 0, 16, 1.4); g.add(l); pool.push(l); }
  const boss = floor === 5, nave = floor === 1;
  const stoneC = boss ? 0x4a3a40 : nave ? 0x8a8478 : 0x5e584e;
  const sm = std(0xffffff, { map: stoneTex(stoneC) }), smD = std(0xffffff, { map: stoneTex(boss ? 0x2a2026 : nave ? 0x5e5a52 : 0x3e3a34) });
  const dark = std(0x16121a), gold = std(0xc9a24a), goldD = std(0x8a6a2a), ironM = std(0x24242a), bone = std(0xd8d0b8), moss = std(0x3a4a2e), cloth = std(0x6a1018), clothP = std(0x3a1a4a);
  const woodM = std(0xffffff, { map: woodTex(0x3a2416) }), pewM = std(0xffffff, { map: plankTex(0x4a3020) });
  const add = (geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, inked = true, ry = 0, parent: THREE.Object3D = g) => { const b = new THREE.Mesh(geo, m); if (inked) ink(b, 0.05); b.position.set(x, y, z); b.rotation.y = ry; b.castShadow = b.receiveShadow = true; parent.add(b); return b; };
  const B = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
  const solid = (x: number, z: number, rad: number) => cols.push([x, z, rad]);
  const light = (x: number, y: number, z: number, c: number, i: number, dist = 16) => { fixtures.push({ x, y, z, c, i, dist, ph: r() * 9 }); };
  const flame = (x: number, y: number, z: number, s = 1, c = 0xffb040) => { const f = new THREE.Mesh(new THREE.ConeGeometry(0.12 * s, 0.4 * s, 6), new THREE.MeshBasicMaterial({ color: c })); f.position.set(x, y, z); g.add(f); const core = new THREE.Mesh(new THREE.ConeGeometry(0.05 * s, 0.22 * s, 6), new THREE.MeshBasicMaterial({ color: 0xfff6c0 })); core.position.y = -0.05 * s; f.add(core); return f; };
  const glow = (x: number, y: number, z: number, w: number, h: number, c: number, op = 0.35, ry = 0, flat = false) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })); m.position.set(x, y, z); if (flat) m.rotation.x = -Math.PI / 2; m.rotation.y = ry; m.renderOrder = 3; g.add(m); return m; };
  const wall = (x0: number, z0: number, x1: number, z1: number, h: number, th = 0.8, m: THREE.Material = sm) => { const len = Math.hypot(x1 - x0, z1 - z0), a = Math.atan2(x1 - x0, z1 - z0); add(B(th, h, len), m, (x0 + x1) / 2, h / 2, (z0 + z1) / 2, true, a); for (let d = 0; d <= len; d += 0.8) solid(x0 + Math.sin(a) * d, z0 + Math.cos(a) * d, th * 0.55 + 0.3); };
  const arcWall = (cx: number, cz: number, rad: number, a0: number, a1: number, h: number) => { const n = Math.max(8, Math.round((a1 - a0) * rad / 2)); for (let i = 0; i < n; i++) { const t0 = a0 + (a1 - a0) * i / n, t1 = a0 + (a1 - a0) * (i + 1) / n; wall(cx + Math.sin(t0) * rad, cz - Math.cos(t0) * rad, cx + Math.sin(t1) * rad, cz - Math.cos(t1) * rad, h, 1.0); } };
  /** pilar feixe gótico: fuste octogonal + 4 colunelos, plinto, capitel com folhagem; às vezes musgo e rachado */
  const pier = (x: number, z: number, h: number, rad = 0.7, broken = false) => {
    const hh = broken ? h * (0.35 + r() * 0.3) : h;
    add(new THREE.CylinderGeometry(rad * 1.45, rad * 1.6, 0.7, 8), smD, x, 0.35, z, true); add(new THREE.CylinderGeometry(rad * 1.25, rad * 1.45, 0.35, 8), sm, x, 0.85, z, false);
    add(new THREE.CylinderGeometry(rad, rad, hh, 8), sm, x, hh / 2 + 0.9, z, true);
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4; add(new THREE.CylinderGeometry(rad * 0.32, rad * 0.32, hh, 6), sm, x + Math.cos(a) * rad * 0.95, hh / 2 + 0.9, z + Math.sin(a) * rad * 0.95, false); }
    if (!broken) { for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4; const pts = [0, 1, 2, 3].map((i) => new THREE.Vector3(Math.cos(a) * i * 0.45, h + 1.9 + Math.sin(i / 3 * 1.2) * 1.0, Math.sin(a) * i * 0.45)); const rib = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 6, rad * 0.22, 4, false), sm); rib.position.set(x, 0, z); g.add(rib); }
      add(new THREE.CylinderGeometry(rad * 1.6, rad * 1.05, 0.7, 8), sm, x, h + 1.25, z, true); add(new THREE.TorusGeometry(rad * 1.2, rad * 0.22, 5, 10), moss, x, h + 0.95, z, false).rotation.x = Math.PI / 2; add(B(rad * 3.3, 0.35, rad * 3.3), smD, x, h + 1.75, z, false); }
    else { for (let k = 0; k < 3; k++) add(new THREE.CylinderGeometry(rad, rad, 1.2, 8), sm, x + (r() - 0.5) * 6, rad, z + 2 + r() * 4, true).rotation.set(Math.PI / 2, r() * 3, 0); }
    if (r() < 0.4) add(new THREE.CylinderGeometry(rad * 1.62, rad * 1.62, 0.12, 8), moss, x, 0.72, z, false);
    solid(x, z, rad * 1.5 + 0.35); return h + 1.6;
  };
  /** arco ogival entre dois pontos (nervura em tubo + aduelas), na altura do capitel */
  const arch = (x0: number, z0: number, x1: number, z1: number, y: number, rad = 0.28, m: THREE.Material = sm) => {
    const span = Math.hypot(x1 - x0, z1 - z0), { pts } = ogive(span); const curve = new THREE.CatmullRomCurve3(pts);
    const a = new THREE.Mesh(new THREE.TubeGeometry(curve, 20, rad, 5, false), m); ink(a, 0.04); a.position.set((x0 + x1) / 2, y, (z0 + z1) / 2); a.rotation.y = Math.atan2(z0 - z1, x1 - x0); a.castShadow = true; g.add(a);
    const a2 = new THREE.Mesh(new THREE.TubeGeometry(curve, 20, rad * 0.55, 4, false), smD); a2.position.copy(a.position); a2.position.y -= rad * 0.7; a2.scale.set(0.92, 0.92, 1); a2.rotation.y = a.rotation.y; g.add(a2);
  };
  /** vitral lanceolado numa parede (normal para +x ou +z), com facho de luz colorida descendo ao chão */
  const lancet = (x: number, z: number, y: number, w: number, h: number, faceX: boolean, pal: string[], shaft = true) => {
    const tx = glassTex(pal, pal.join('') + Math.floor(r() * 3)); const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tx, transparent: true }));
    m.position.set(x + (faceX ? 0.46 : 0), y, z + (faceX ? 0 : 0.46)); m.rotation.y = faceX ? Math.PI / 2 : 0; g.add(m);
    add(B(faceX ? 0.3 : w + 0.6, 0.35, faceX ? w + 0.6 : 0.3), smD, x + (faceX ? 0.45 : 0), y - h / 2 - 0.1, z + (faceX ? 0 : 0.45), false);
    if (shaft) { const c = new THREE.Color(pal[1] ?? '#c8b8ff').lerp(new THREE.Color(0xfff0d0), 0.4).getHex(); const len = y + 3; const sh = glow(x + (faceX ? len * 0.45 : 0), y * 0.5, z + (faceX ? 0 : len * 0.45), w * 1.1, Math.hypot(len * 0.9, y), c, 0.11, faceX ? Math.PI / 2 : 0); sh.rotation.order = 'YXZ'; if (faceX) sh.rotation.z = -0.75; else sh.rotation.x = -0.75;
      glow(x + (faceX ? y * 0.9 : 0), 0.04, z + (faceX ? 0 : y * 0.9), w * 1.6, h * 0.55, c, 0.22, faceX ? Math.PI / 2 : 0, true); light(x + (faceX ? 3 : 0), y * 0.4, z + (faceX ? 0 : 3), c, 14, 14); }
  };
  /** estátua: santo encapuzado, cavaleiro com espada, ou anjo com asas — sobre pedestal; algumas tombadas */
  const statue = (x: number, z: number, ry = 0, kind = Math.floor(r() * 3), s = 1) => { const st = std(0x9a96a0); const fallen = r() < 0.12;
    add(B(1.5 * s, 0.8 * s, 1.5 * s), smD, x, 0.4 * s, z, true, ry); const gq = new THREE.Group(); gq.position.set(x, 0.8 * s, z); gq.rotation.y = ry; gq.scale.setScalar(s); if (fallen) { gq.rotation.z = 1.45; gq.position.x += 1.5; gq.position.y = 0.5; } g.add(gq);
    add(new THREE.CylinderGeometry(0.34, 0.6, 2.1, 8), st, 0, 1.05, 0, true, 0, gq); add(new THREE.SphereGeometry(0.28, 8, 6), st, 0, 2.4, 0.02, true, 0, gq);
    if (kind === 0) { add(new THREE.ConeGeometry(0.38, 0.7, 8), st, 0, 2.6, -0.03, true, 0, gq); add(new THREE.SphereGeometry(0.2, 6, 5), st, 0, 1.55, 0.38, false, 0, gq); add(new THREE.BoxGeometry(0.06, 0.5, 0.04), gold, 0, 1.9, 0.42, false, 0, gq); }
    else if (kind === 1) { add(B(0.09, 1.9, 0.05), st, 0, 1.1, 0.5, false, 0, gq); add(B(0.55, 0.07, 0.08), st, 0, 1.85, 0.5, false, 0, gq); add(new THREE.CylinderGeometry(0.45, 0.45, 0.07, 12), st, -0.48, 1.3, 0.25, true, 0, gq).rotation.x = Math.PI / 2; }
    else { for (const sx of [-1, 1]) { const w = add(B(0.12, 1.6, 0.55), st, sx * 0.45, 2.0, -0.25, true, 0, gq); w.rotation.z = sx * -0.45; w.rotation.y = sx * 0.3; } add(new THREE.TorusGeometry(0.22, 0.03, 4, 12), gold, 0, 2.85, 0, false, 0, gq).rotation.x = Math.PI / 2; }
    solid(x, z, 1.0 * s); };
  const candles = (x: number, z: number, n = 7, y = 0) => { for (let k = 0; k < n; k++) { const cx = x + (r() - 0.5) * 1.1, cz = z + (r() - 0.5) * 1.1, h = 0.2 + r() * 0.5; add(new THREE.CylinderGeometry(0.05, 0.06, h, 5), std(0xe8e0c8), cx, y + h / 2, cz, false); if (r() < 0.8) flame(cx, y + h + 0.09, cz, 0.45); add(new THREE.CylinderGeometry(0.1, 0.12, 0.03, 6), std(0xe8e0c8), cx, y + 0.015, cz, false); } light(x, y + 1, z, 0xffb050, 10, 8); };
  const candelabra = (x: number, z: number, h = 2.6) => { add(new THREE.CylinderGeometry(0.06, 0.09, h, 6), ironM, x, h / 2, z, false); add(new THREE.CylinderGeometry(0.4, 0.5, 0.15, 6), ironM, x, 0.08, z, false); add(B(1.3, 0.06, 0.06), ironM, x, h - 0.1, z, false); for (const dx of [-0.6, -0.3, 0, 0.3, 0.6]) { add(new THREE.CylinderGeometry(0.045, 0.05, 0.35, 5), std(0xe8e0c8), x + dx, h + 0.1 + (dx === 0 ? 0.15 : 0), z, false); flame(x + dx, h + 0.36 + (dx === 0 ? 0.15 : 0), z, 0.5); } light(x, h + 0.6, z, 0xffc060, 22, 12); solid(x, z, 0.5); };
  const brazier = (x: number, z: number, c = 0xffb040, li = 40) => { add(new THREE.CylinderGeometry(0.15, 0.25, 0.9, 6), ironM, x, 0.45, z, false); for (let k = 0; k < 3; k++) { const a = k * 2.09; add(B(0.08, 1.0, 0.08), ironM, x + Math.cos(a) * 0.35, 0.5, z + Math.sin(a) * 0.35, false).rotation.z = 0.3; } add(new THREE.CylinderGeometry(0.62, 0.38, 0.4, 8), ironM, x, 1.1, z, false); flame(x, 1.45, z, 1.7, c); light(x, 2.1, z, c, li, 16); solid(x, z, 0.7); };
  const sarco = (x: number, z: number, ry = 0, open = r() < 0.25) => { add(B(1.2, 0.9, 2.5), sm, x, 0.45, z, true, ry); for (const sx of [-1, 1]) add(B(0.08, 0.6, 2.2), gold, x + Math.cos(ry) * sx * 0.62, 0.45, z - Math.sin(ry) * sx * 0.62, false, ry);
    if (open) { const lid = add(B(1.3, 0.16, 2.6), smD, x + 0.9, 0.3, z + 0.4, true, ry + 0.4); lid.rotation.z = 0.25; bones(x, z, 3); } else { add(B(1.3, 0.16, 2.6), smD, x, 0.98, z, true, ry); const ef = new THREE.Group(); ef.position.set(x, 1.12, z); ef.rotation.y = ry; g.add(ef); add(B(0.5, 0.2, 1.5), std(0x9a96a0), 0, 0.1, 0, false, 0, ef); add(new THREE.SphereGeometry(0.17, 7, 5), std(0x9a96a0), 0, 0.15, -0.85, false, 0, ef); add(B(0.08, 0.06, 1.1), std(0x9a96a0), 0, 0.24, 0.1, false, 0, ef); }
    solid(x + Math.sin(ry) * 0.7, z + Math.cos(ry) * 0.7, 0.8); solid(x - Math.sin(ry) * 0.7, z - Math.cos(ry) * 0.7, 0.8); };
  const bones = (x: number, z: number, n = 6) => { for (let k = 0; k < n; k++) add(new THREE.CylinderGeometry(0.03, 0.04, 0.4 + r() * 0.3, 5), bone, x + (r() - 0.5) * 1.6, 0.05, z + (r() - 0.5) * 1.6, false, r() * 3).rotation.z = Math.PI / 2; add(new THREE.SphereGeometry(0.18, 7, 6), bone, x, 0.16, z, false); };
  const rubble = (x: number, z: number, n = 8, sz = 1) => { for (let k = 0; k < n; k++) { const s = (0.25 + r() * 0.55) * sz; add(new THREE.DodecahedronGeometry(s, 0), r() < 0.5 ? sm : smD, x + (r() - 0.5) * 3 * sz, s * 0.5, z + (r() - 0.5) * 3 * sz, false, r() * 6); } if (sz > 0.8) solid(x, z, 1.1 * sz); };
  const bloodPool = (x: number, z: number, rad: number) => { const m = new THREE.Mesh(new THREE.CircleGeometry(rad, 16), new THREE.MeshToonMaterial({ color: 0x3a060c })); m.rotation.x = -Math.PI / 2; m.position.set(x, 0.03, z); m.scale.y = 0.7 + r() * 0.5; g.add(m); };
  const chains = (x: number, z: number, top: number, n = 10) => { for (let k = 0; k < n; k++) { const link = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.03, 4, 8), ironM); link.position.set(x, top - k * 0.22, z); link.rotation.set(k % 2 ? Math.PI / 2 : 0, 0, 0); g.add(link); } };
  const cage = (x: number, z: number, hang = 0) => { const y0 = hang; for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2; add(new THREE.CylinderGeometry(0.025, 0.025, 2.2, 4), ironM, x + Math.cos(a) * 0.6, y0 + 1.1, z + Math.sin(a) * 0.6, false); } for (const y of [0.05, 1.1, 2.15]) add(new THREE.TorusGeometry(0.6, 0.03, 4, 14), ironM, x, y0 + y, z, false).rotation.x = Math.PI / 2; add(new THREE.ConeGeometry(0.65, 0.5, 9), ironM, x, y0 + 2.4, z, false); if (hang) chains(x, z, hang + 9, 30); else { bones(x, z, 3); solid(x, z, 0.85); } };
  const banner = (x: number, z: number, y: number, c: THREE.Material, faceX: boolean) => { const w = 1.6, h = 3.4; const bm = new THREE.Mesh(new THREE.PlaneGeometry(w, h, 1, 4), c); const pa = bm.geometry.attributes.position as THREE.BufferAttribute; for (let i = 0; i < pa.count; i++) { if (pa.getY(i) < -h / 2 + 0.1) pa.setX(i, pa.getX(i) * (0.5 + r() * 0.6)); } bm.position.set(x, y, z); bm.rotation.y = faceX ? Math.PI / 2 : 0; (bm.material as THREE.Material).side = THREE.DoubleSide; g.add(bm); add(B(faceX ? 0.08 : 2, 0.1, faceX ? 2 : 0.08), goldD, x, y + h / 2, z, false); const eye = new THREE.Mesh(new THREE.CircleGeometry(0.3, 10), gold); eye.position.set(x + (faceX ? 0.02 : 0), y + 0.4, z + (faceX ? 0 : 0.02)); eye.rotation.y = bm.rotation.y; eye.scale.y = 0.55; g.add(eye); };
  const web = (x: number, y: number, z: number, s: number, ry: number) => { const m = new THREE.Mesh(new THREE.CircleGeometry(s, 3, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xd8d8e0, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false })); m.position.set(x, y, z); m.rotation.y = ry; g.add(m); };
  const pit = (x: number, z: number, rad: number, c = 0x8a1a10) => { const p = new THREE.Mesh(new THREE.CircleGeometry(rad, 18), new THREE.MeshBasicMaterial({ color: 0x030204 })); p.rotation.x = -Math.PI / 2; p.position.set(x, 0.035, z); g.add(p); for (let k = 0; k < 10; k++) { const a = k / 10 * 6.283; add(B(0.8 + r() * 0.6, 0.25, 0.5), smD, x + Math.cos(a) * rad, 0.1, z + Math.sin(a) * rad, false, -a + r() * 0.4); } glow(x, 0.06, z, rad * 1.6, rad * 1.6, c, 0.35, 0, true); light(x, 0.4, z, c, 18, 10); for (let k = 0; k < 14; k++) solid(x + Math.cos(k / 14 * 6.283) * rad * 0.7, z + Math.sin(k / 14 * 6.283) * rad * 0.7, rad * 0.45); };
  const pew = (x: number, z: number, len: number, broken: boolean) => { const ry = broken ? (r() - 0.5) * 0.6 : 0; add(B(len, 0.12, 0.65), pewM, x, 0.5, z, true, ry); add(B(len, 0.75, 0.1), pewM, x, 0.9, z + 0.3, false, ry); for (const sx of [-1, 1]) { add(B(0.12, 1.15, 0.75), woodM, x + sx * len / 2, 0.58, z + 0.02, false, ry); add(new THREE.ConeGeometry(0.1, 0.3, 4), woodM, x + sx * len / 2, 1.3, z + 0.1, false, ry); } for (let q = -len / 2 + 0.5; q <= len / 2; q += 1.4) solid(x + q, z + 0.1, 0.6); if (broken && r() < 0.5) rubble(x + (r() - 0.5) * len, z + 1, 3, 0.5); };
  const chandelier = (x: number, z: number, y: number, fallen: boolean) => { const R = 2.4; if (fallen) { const ring = add(new THREE.TorusGeometry(R, 0.12, 6, 24), ironM, x, 0.25, z, true); ring.rotation.set(Math.PI / 2 - 0.25, 0, 0.1); for (let k = 0; k < 16; k++) { const a = k / 16 * 6.283; if (r() < 0.6) add(new THREE.CylinderGeometry(0.05, 0.06, 0.3, 5), std(0xe8e0c8), x + Math.cos(a) * R, 0.35 + Math.sin(a) * 0.4, z + Math.sin(a) * R, false).rotation.z = r() * 2; } chains(x + 0.5, z - 0.5, 0.2, 1); for (let k = 0; k < 24; k++) add(new THREE.TorusGeometry(0.1, 0.03, 4, 8), ironM, x + 0.6 + k * 0.25, 0.06, z - 0.6 - k * 0.15, false).rotation.x = Math.PI / 2; rubble(x - 1.5, z + 1.5, 10, 0.8); solid(x, z, R); }
    else { add(new THREE.TorusGeometry(R, 0.1, 6, 24), ironM, x, y, z, false).rotation.x = Math.PI / 2; add(new THREE.TorusGeometry(R * 0.55, 0.08, 6, 18), ironM, x, y + 0.6, z, false).rotation.x = Math.PI / 2; for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; const c = add(new THREE.CylinderGeometry(0.03, 0.03, 4, 4), ironM, x + Math.cos(a) * R * 0.5, y + 2, z + Math.sin(a) * R * 0.5, false); c.rotation.z = Math.cos(a) * 0.5; c.rotation.x = Math.sin(a) * 0.5; }
      for (let k = 0; k < 14; k++) { const a = k / 14 * 6.283; add(new THREE.CylinderGeometry(0.05, 0.06, 0.3, 5), std(0xe8e0c8), x + Math.cos(a) * R, y + 0.2, z + Math.sin(a) * R, false); if (r() < 0.7) flame(x + Math.cos(a) * R, y + 0.44, z + Math.sin(a) * R, 0.5); } light(x, y - 1, z, 0xffc070, 34, 18); } };
  const organ = (x: number, z: number, w: number) => { add(B(1.6, 3, w), woodM, x + 0.8, 1.5, z, true); add(B(1.8, 0.4, w + 0.4), goldD, x + 0.9, 3.2, z, false); for (let k = 0; k < Math.floor(w / 0.45); k++) { const zz = z - w / 2 + 0.25 + k * 0.45, h = 4 + Math.sin(k / (w / 0.45) * Math.PI) * 6 + (k % 2) * 0.8; add(new THREE.CylinderGeometry(0.19, 0.19, h, 7), std(0xa8a090), x + 0.4, 3.4 + h / 2, zz, false); add(new THREE.ConeGeometry(0.19, 0.3, 7), dark, x + 0.4, 3.4 + 0.2, zz, false); } for (let k = 0; k < 5; k++) add(B(0.4, 0.5, w * 0.6), std(0x2a2a2a), x + 1.8, 1.2 + k * 0.12, z, false); solid(x + 1, z - w / 4, w / 4 + 0.6); solid(x + 1, z + w / 4, w / 4 + 0.6); };
  /** arcada cega em relevo numa parede (série de ogivas rasas) — dá vida às paredes altas */
  const blindArcade = (x0: number, z0: number, x1: number, z1: number, y: number, h: number, faceX: boolean) => { const len = Math.hypot(x1 - x0, z1 - z0), n = Math.max(2, Math.floor(len / 2.6)); for (let i = 0; i < n; i++) { const t0 = i / n, t1 = (i + 1) / n; const ax = x0 + (x1 - x0) * t0 + (faceX ? 0.5 : 0), az = z0 + (z1 - z0) * t0 + (faceX ? 0 : 0.5), bx = x0 + (x1 - x0) * t1 + (faceX ? 0.5 : 0), bz = z0 + (z1 - z0) * t1 + (faceX ? 0 : 0.5); arch(ax, az, bx, bz, y + h, 0.1, smD); add(new THREE.CylinderGeometry(0.1, 0.1, h, 5), smD, ax, y + h / 2, az, false); } };

  const spawnPts: { x: number; z: number }[] = []; let elitePt = { x: 0, z: 0 }, vessel: CathedralFloor['vessel'], stairs: CathedralFloor['stairs'], door: CathedralFloor['door'], throne: CathedralFloor['throne'];
  let W: number, D: number;
  const GL1 = ['#3a2a7a', '#6a1a2a', '#1a4a6a', '#c8902a', '#2a5a3a', '#5a2a6a'], GL2 = ['#7a1a1a', '#c84a1a', '#2a1a4a', '#c8a02a', '#4a0a1a'];
  const floorPlane = (x: number, z: number, w: number, d: number, tex: THREE.Texture, rep: number, y = 0, m?: THREE.Material) => { const t = tex.clone(); t.needsUpdate = true; t.repeat.set(w / rep, d / rep); const mat = m ?? new THREE.MeshToonMaterial({ map: t, gradientMap: ramp }); if (m) (m as THREE.MeshToonMaterial).map = t; const pl = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat); pl.rotation.x = -Math.PI / 2; pl.position.set(x + w / 2, y, z + d / 2); pl.receiveShadow = true; g.add(pl); return pl; };
  const dk = new THREE.Mesh(new THREE.PlaneGeometry(800, 800), new THREE.MeshBasicMaterial({ color: 0x050408 })); dk.rotation.x = -Math.PI / 2; dk.position.set(60, -0.08, 60); g.add(dk);

  if (nave) {
    /* ================= NAVE (planta em cruz) ================= */
    W = 76; D = 168; const cx = W / 2, nHalf = 11, aisleX0 = cx - 24, aisleX1 = cx + 24, H = 15;
    const crossZ0 = 38, crossZ1 = 62, apseR = 22, apseZ = crossZ0; // abside ao norte do transepto
    g.add(new THREE.HemisphereLight(0x9a90b8, 0x2a2420, 1.35));
    // pisos: lajes nas naves laterais e transepto, mármore em losangos na nave central e no cruzeiro, tapete roído pelo meio
    floorPlane(0, crossZ0 - apseR, W, D - (crossZ0 - apseR), slabTex('#6e685c', '#625c52'), 8);
    floorPlane(cx - nHalf, crossZ0, nHalf * 2, D - crossZ0, marbleTex(), 4.5, 0.01);
    floorPlane(cx - 1.6, crossZ1, 3.2, D - crossZ1 - 2, carpetTex(), 4, 0.025, new THREE.MeshToonMaterial({ gradientMap: ramp, transparent: true, alphaTest: 0.5 }));
    // muros: oeste alto (naves laterais) e oeste do transepto; norte do transepto; abside; leste e sul baixos com rasgos
    wall(aisleX0, crossZ1, aisleX0, D, H); wall(0, crossZ0, 0, crossZ1, H + 3); wall(0, crossZ0, cx - apseR, crossZ0, H + 3); wall(cx + apseR, crossZ0, W, crossZ0, H + 3);
    wall(0, crossZ1, aisleX0, crossZ1, H); arcWall(cx, apseZ, apseR, -Math.PI / 2, Math.PI / 2, H + 5);
    wall(W, crossZ0, W, crossZ1, 1.1, 0.8, smD); wall(aisleX1, crossZ1, W, crossZ1, 1.1, 0.8, smD); wall(aisleX1, crossZ1, aisleX1, D, 1.1, 0.8, smD);
    wall(aisleX0, D, cx - 3, D, 1.1, 0.8, smD); wall(cx + 3, D, aisleX1, D, 1.1, 0.8, smD);
    for (let z = crossZ1 + 4; z < D; z += 9) add(B(1.4, H + 1, 1.8), smD, aisleX0 + 0.6, (H + 1) / 2, z, true); // contrafortes internos
    blindArcade(aisleX0, crossZ1 + 2, aisleX0, D - 2, 0.6, 3.2, true);
    // vitrais lanceolados da nave lateral oeste (com fachos de luz) e do transepto
    for (let z = crossZ1 + 8.5; z < D - 4; z += 9) lancet(aisleX0, z, 8.5, 2.4, 7.5, true, z % 18 < 9 ? GL1 : GL2);
    for (const z of [crossZ0 + 6, crossZ1 - 6]) lancet(0, z, 10, 2.8, 9, true, GL1);
    for (const x of [6, W - 10]) lancet(x, crossZ0, 10, 2.8, 9, false, GL2);
    // ROSÁCEA sobre o coro, na parede da abside, com o Olho no centro; luz rubra no chão
    { const rose = new THREE.Mesh(new THREE.CircleGeometry(6.5, 40), new THREE.MeshBasicMaterial({ map: roseTex(GL1, 'n'), transparent: true })); rose.position.set(cx, H + 1, apseZ - apseR + 1.2); g.add(rose); add(new THREE.TorusGeometry(6.6, 0.45, 6, 40), smD, cx, H + 1, apseZ - apseR + 1.1, false); glow(cx, 0.05, apseZ - 6, 14, 10, 0xb06aff, 0.18, 0, true); }
    // PILARES feixe + ARCADAS ogivais longitudinais e transversais (vistas de cima formam a abóbada)
    const piers: [number, number][] = [];
    for (let z = crossZ1 + 2; z < D - 6; z += 9) for (const sx of [-1, 1]) piers.push([cx + sx * nHalf, z]);
    for (const [x, z] of piers) { const brk = r() < 0.1 && z > crossZ1 + 20; pier(x, z, 7, 0.75, brk); }
    // cruzeiro: 4 pilares grossos, arcos diagonais e o lustre caído no centro
    const C: [number, number][] = [[cx - nHalf - 1, crossZ0 + 1], [cx + nHalf + 1, crossZ0 + 1], [cx - nHalf - 1, crossZ1], [cx + nHalf + 1, crossZ1]];
    for (const [x, z] of C) pier(x, z, 8, 1.1);
    chandelier(cx + 1, (crossZ0 + crossZ1) / 2 + 1, 0, true); for (let z = crossZ1 + 12; z < D - 10; z += 18) for (const sx of [-1, 1]) candelabra(cx + sx * 9.6, z);
    // BANCOS em fileiras dos dois lados do tapete; muitos tombados e quebrados
    for (let z = crossZ1 + 6; z < D - 14; z += 2.6) for (const sx of [-1, 1]) { if (r() < 0.12) { rubble(cx + sx * 6, z, 4, 0.6); continue; } pew(cx + sx * 6.2, z, 7.2, r() < 0.3); }
    // naves laterais: túmulos com efígies, estátuas, capelas com velas, estandartes rasgados, teias
    for (let z = crossZ1 + 7; z < D - 6; z += 9) { const ax = cx - nHalf - 6.5, bx = cx + nHalf + 6.5;
      if (r() < 0.55) sarco(ax, z, Math.PI / 2); else { statue(aisleX0 + 2.2, z, Math.PI / 2); candles(aisleX0 + 3.6, z + 1.5, 9); }
      if (r() < 0.5) sarco(bx, z, Math.PI / 2); else statue(bx + 3, z, -Math.PI / 2);
      banner(cx - nHalf + 0.9, z + 4.5, 5.2, r() < 0.5 ? cloth : clothP, true); web(cx - nHalf + 0.6, 7.2, z + 0.8, 1.6, Math.PI / 2);
      if (r() < 0.35) rubble(ax + (r() - 0.5) * 6, z + 3, 7, 0.9); if (r() < 0.3) bloodPool(bx + (r() - 0.5) * 5, z + 3, 1.2 + r()); spawnPts.push({ x: ax, z: z + 3 }, { x: bx, z: z + 3 }); }
    // TRANSEPTO: órgão de tubos na parede oeste, capela de Auréon a leste, túmulos de bispos
    organ(0.6, (crossZ0 + crossZ1) / 2, 14);
    for (const z of [crossZ0 + 4, crossZ1 - 4]) { statue(W - 3, z, -Math.PI / 2, 2, 1.2); candelabra(W - 6, z); }
    sarco(cx - nHalf - 9, crossZ0 + 6, 0); sarco(cx + nHalf + 9, crossZ0 + 6, 0, true); bloodPool(cx - nHalf - 6, crossZ1 - 5, 2); pit(cx + nHalf + 10, crossZ1 - 8, 2.4);
    for (let k = 0; k < 6; k++) spawnPts.push({ x: 6 + r() * (W - 12), z: crossZ0 + 3 + r() * 18 });
    // CORO e ABSIDE: degraus, cadeiral, altar-mor com retábulo dourado de pináculos, o Olho apagado
    for (let k = 0; k < 4; k++) add(B(nHalf * 2 + 8 - k * 2, 0.3, 3 - k * 0.3), smD, cx, 0.15 + k * 0.3, crossZ0 + 1 - k * 0.7, false);
    add(B(30, 1.2, 18), smD, cx, 0.6, apseZ - 9); floorPlane(cx - 14, apseZ - 18, 28, 16, marbleTex(), 2.5, 1.21);
    for (const sx of [-1, 1]) for (let k = 0; k < 5; k++) { add(B(1.2, 1.6, 1.6), woodM, cx + sx * 9, 1.2 + 0.8, apseZ - 3 - k * 2, false); add(new THREE.ConeGeometry(0.2, 0.9, 4), goldD, cx + sx * 9, 1.2 + 2.0, apseZ - 3 - k * 2, false); solid(cx + sx * 9, apseZ - 3 - k * 2, 0.9); }
    add(B(5, 1.3, 2), sm, cx, 1.85, apseZ - 15); add(B(5.4, 0.15, 2.3), cloth, cx, 2.55, apseZ - 15); add(B(0.1, 1.2, 2.3), gold, cx - 2.6, 2.0, apseZ - 15, false); solid(cx, apseZ - 15, 2.5);
    { const ry = apseZ - 18.4; add(B(10, 7, 0.6), goldD, cx, 1.2 + 3.5, ry); for (let k = -2; k <= 2; k++) { add(B(1.6, 5.2, 0.2), dark, cx + k * 1.9, 1.2 + 3.2, ry + 0.35); add(new THREE.ConeGeometry(0.4, 2.2 + (k === 0 ? 1.6 : 0), 4), gold, cx + k * 1.9, 1.2 + 7.6 + (k === 0 ? 0.8 : 0), ry, false); } const eye = new THREE.Mesh(new THREE.SphereGeometry(0.9, 12, 8), new THREE.MeshBasicMaterial({ color: 0x2a2440 })); eye.scale.set(1.6, 0.8, 0.4); eye.position.set(cx, 1.2 + 4.4, ry + 0.5); g.add(eye); const crack = new THREE.Mesh(B(0.08, 1.6, 0.05), new THREE.MeshBasicMaterial({ color: 0xb3202f })); crack.position.set(cx + 0.2, 1.2 + 4.4, ry + 0.85); crack.rotation.z = 0.4; g.add(crack); }
    for (const sx of [-1, 1]) { candelabra(cx + sx * 4, apseZ - 13); candelabra(cx + sx * 7, apseZ - 9); statue(cx + sx * 13, apseZ - 10, sx * -0.9, 2, 1.35); brazier(cx + sx * 6, apseZ - 1, 0xffa040, 42); }
    for (let a = 0; a < 7; a++) { const t = -1.2 + a * 0.4; const x = cx + Math.sin(t) * (apseR - 4), z = apseZ - Math.cos(t) * (apseR - 4); pier(x, z, 9, 0.6); }
    // NARTHEX: pia batismal seca e anjos guardiões junto à porta
    { const fx = cx, fz = D - 9; add(new THREE.CylinderGeometry(1.6, 1.1, 0.9, 10), sm, fx, 0.45, fz, true); add(new THREE.CylinderGeometry(1.7, 1.6, 0.25, 10), smD, fx, 0.95, fz, false); add(new THREE.CircleGeometry(1.4, 12), std(0x1a1410), fx, 1.08, fz, false).rotation.x = -Math.PI / 2; solid(fx, fz, 1.9); for (const sx of [-1, 1]) statue(cx + sx * 6, D - 4, sx > 0 ? -2.6 : 2.6, 2, 1.25); }
    for (let k = 0; k < 12; k++) bones(cx + (r() - 0.5) * 40, crossZ1 + 4 + r() * (D - crossZ1 - 10), 4);
    for (let k = 0; k < 8; k++) spawnPts.push({ x: cx + (r() - 0.5) * 14, z: crossZ1 + 10 + r() * (D - crossZ1 - 30) });
    elitePt = { x: cx, z: (crossZ0 + crossZ1) / 2 + 5 };
    // escada em espiral para as criptas: na capela leste do transepto
    stairsAt(W - 9, crossZ1 - 9, H); vesselAt(W - 19, crossZ1 - 8);
  } else if (!boss) {
    /* ================= CRIPTAS (salões abobadados) ================= */
    const NX = 4, NY = 5, cw = 34, cd = 32, H = 7; W = NX * cw; D = NY * cd;
    g.add(new THREE.HemisphereLight(0x9a94b8, 0x3a3440, 2.1));
    floorPlane(0, 0, W, D, slabTex(floor === 3 ? '#4e4840' : '#545048', floor === 3 ? '#44403a' : '#4a463e'), 7);
    const ossM = std(0xffffff, { map: ossuaryTex() });
    wall(0, -0.4, W, -0.4, H + 2, 1.0); wall(-0.4, 0, -0.4, D, H + 2, 1.0); wall(W + 0.4, 0, W + 0.4, D, 1.0, 0.8, smD); wall(0, D + 0.4, W / 2 - 2.5, D + 0.4, 1.0, 0.8, smD); wall(W / 2 + 2.5, D + 0.4, W, D + 0.4, 1.0, 0.8, smD);
    // paredes norte/oeste: ossário (crânios empilhados) em painéis entre contrafortes, nichos de sepultura (lóculos)
    for (let x = 4; x < W - 2; x += 8) { add(B(1.4, H + 2, 1.4), sm, x, (H + 2) / 2, 0.3); const p = new THREE.Mesh(new THREE.PlaneGeometry(6, H - 1), ossM); p.position.set(x + 4, (H - 1) / 2 + 0.3, 0.12); g.add(p); }
    for (let z = 4; z < D - 2; z += 8) { add(B(1.4, H + 2, 1.4), sm, 0.3, (H + 2) / 2, z); for (let row = 0; row < 3; row++) for (let k = 0; k < 3; k++) { add(B(0.3, 0.9, 1.6), dark, 0.25, 1 + row * 1.6, z + 1.2 + k * 2.1, false); if (r() < 0.4) add(new THREE.SphereGeometry(0.22, 7, 5), bone, 0.5, 0.8 + row * 1.6, z + 1.2 + k * 2.1, false); } }
    // divisórias entre salões com portais em arco
    for (let i = 1; i < NX; i++) { const x = i * cw; for (let j = 0; j < NY; j++) { const z0 = j * cd, z1 = (j + 1) * cd, gz = z0 + cd * (0.3 + r() * 0.4); wall(x, z0, x, gz - 2.6, 2.6, 1.0); wall(x, gz + 2.6, x, z1, 2.6, 1.0); for (let z = z0 + 4; z < z1 - 2; z += 8) if (Math.abs(z - gz) > 4) add(B(1.4, 3.4, 1.4), sm, x, 1.7, z); pier(x, gz - 2.9, 1.2, 0.5); pier(x, gz + 2.9, 1.2, 0.5); arch(x, gz - 2.9, x, gz + 2.9, 2.8, 0.3); } }
    for (let j = 1; j < NY; j++) { const z = j * cd; for (let i = 0; i < NX; i++) { const x0 = i * cw, x1 = (i + 1) * cw, gx = x0 + cw * (0.3 + r() * 0.4); wall(x0, z, gx - 2.6, z, 2.6, 1.0); wall(gx + 2.6, z, x1, z, 2.6, 1.0); for (let x = x0 + 4; x < x1 - 2; x += 8) if (Math.abs(x - gx) > 4) add(B(1.4, 3.4, 1.4), sm, x, 1.7, z); pier(gx - 2.9, z, 1.2, 0.5); pier(gx + 2.9, z, 1.2, 0.5); arch(gx - 2.9, z, gx + 2.9, z, 2.8, 0.3); } }
    const themes = ['tumbas', 'ossario', 'jaulas', 'capela', 'tumbas', 'pocos', 'sangue', 'tumbas', 'biblioteca'];
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
      const cx = (i + 0.5) * cw, cz = (j + 0.5) * cd, th = floor === 3 && i === 1 && j === 0 ? 'trono' : themes[(j * NX + i + floor * 3) % themes.length];
      // abóbada de nervuras: 4 pilares e arcos cruzados (de cima: o X das nervuras)
      const ox = cw * 0.27, oz = cd * 0.27, P: [number, number][] = [[cx - ox, cz - oz], [cx + ox, cz - oz], [cx + ox, cz + oz], [cx - ox, cz + oz]];
      for (const [x, z] of P) pier(x, z, 3.6, 0.55);
      if (r() < 0.3) chandelier(cx, cz, 0, true); light(cx, 3.5, cz, 0x8a8aff, 14, 14);
      if (th === 'tumbas') { for (let k = 0; k < 6; k++) sarco(cx - 9 + (k % 3) * 9, cz - 9 + Math.floor(k / 3) * 18, (k % 2) * 0.05); candles(cx, cz, 10); statue(cx, cz - oz - 3.5, 0, 0); }
      else if (th === 'ossario') { for (const sx of [-1, 1]) { add(B(9, 4, 1.2), ossM, cx + sx * 7, 2, cz, true); solid(cx + sx * 4, cz, 1.1); solid(cx + sx * 7, cz, 1.1); solid(cx + sx * 10, cz, 1.1); } for (let k = 0; k < 10; k++) bones(cx + (r() - 0.5) * cw * 0.7, cz + (r() - 0.5) * cd * 0.7, 6); brazier(cx, cz - 9, 0x8aff6a, 26); brazier(cx, cz + 9, 0x8aff6a, 26); }
      else if (th === 'jaulas') { for (let k = 0; k < 5; k++) cage(cx - 9 + k * 4.5, cz + (k % 2 ? 6 : -6), k % 2 ? 2.2 : 0); bloodPool(cx, cz, 2.6); brazier(cx, cz, 0xff8a3a, 34); }
      else if (th === 'capela') { for (const sx of [-1, 1]) { statue(cx + sx * 6, cz - 10, sx * 0.6, 2, 1.1); candelabra(cx + sx * 3, cz - 9); } add(B(4, 1.1, 1.6), sm, cx, 0.55, cz - 10); add(B(4.2, 0.12, 1.8), clothP, cx, 1.15, cz - 10); solid(cx, cz - 10, 2.2); for (let k = 0; k < 4; k++) pew(cx, cz - 5 + k * 2.6, 6, r() < 0.35); lancet(cx - 2, (j) * cd + 0.4, 4, 1.6, 4.5, false, GL2, false); }
      else if (th === 'pocos') { pit(cx, cz, 3.2, 0x4a1aff); for (const sx of [-1, 1]) statue(cx + sx * 7, cz + 7, sx * 1.4, 1); }
      else if (th === 'sangue') { const alt = add(B(3, 1, 2), smD, cx, 0.5, cz); void alt; solid(cx, cz, 1.8); bloodPool(cx, cz, 4); for (let k = 0; k < 8; k++) { const a = k / 8 * 6.283; candles(cx + Math.cos(a) * 5, cz + Math.sin(a) * 5, 3); } chains(cx - 2, cz + 1, H, 26); chains(cx + 2, cz - 1, H, 24); }
      else if (th === 'biblioteca') { for (let k = 0; k < 4; k++) { add(B(8, 3.6, 1.0), woodM, cx - 6 + (k % 2) * 12, 1.8, cz - 8 + Math.floor(k / 2) * 14, true); for (let s = 0; s < 3; s++) for (let b = 0; b < 12; b++) add(B(0.5, 0.75, 0.3), std([0x5a1a1a, 0x1a2a4a, 0x3a2a1a, 0x2a3a1a][(b + s) % 4]), cx - 9 + (k % 2) * 12 + b * 0.55 + 0.4, 0.75 + s * 1.1, cz - 8 + Math.floor(k / 2) * 14 + 0.55, false); for (let q = -3; q <= 3; q += 1.5) solid(cx - 6 + (k % 2) * 12 + q, cz - 8 + Math.floor(k / 2) * 14, 0.9); } add(B(3, 1, 1.6), woodM, cx, 0.5, cz); candles(cx, cz, 4, 1.0); for (let k = 0; k < 14; k++) add(B(0.5, 0.08, 0.35), std(0xc8bca0), cx + (r() - 0.5) * 14, 0.04, cz + (r() - 0.5) * 14, false, r() * 3); }
      else if (th === 'trono') { add(B(10, 0.6, 7), smD, cx, 0.3, cz - 8); add(B(7, 0.5, 5), sm, cx, 0.85, cz - 8); const tr = new THREE.Group(); tr.position.set(cx, 1.1, cz - 9); g.add(tr); add(B(1.8, 0.7, 1.4), dark, 0, 0.35, 0, true, 0, tr); add(B(2, 3.6, 0.4), dark, 0, 2.1, -0.55, true, 0, tr); for (const sx of [-1, 1]) add(new THREE.ConeGeometry(0.14, 1.4, 5), gold, sx * 0.85, 4.4, -0.55, false, 0, tr); add(new THREE.SphereGeometry(0.32, 8, 6), bone, 0, 4.0, -0.3, false, 0, tr); solid(cx, cz - 9, 1.6); for (const sx of [-1, 1]) { brazier(cx + sx * 4.5, cz - 5, 0xff3a2a, 46); statue(cx + sx * 8, cz - 4, sx * 1.3, 1, 1.2); } bloodPool(cx, cz - 2, 3.2); throne = { x: cx, z: cz - 5 }; }
      for (let k = 0; k < 4; k++) web(cx + (k % 2 ? ox : -ox), 5.6, cz + (k < 2 ? -oz : oz), 1.3, k * 1.57);
      if (r() < 0.5) rubble(cx + (r() - 0.5) * cw * 0.6, cz + (r() - 0.5) * cd * 0.6, 8, 1);
      const n = 2 + Math.floor(r() * 2); for (let k = 0; k < n; k++) spawnPts.push({ x: cx + (r() - 0.5) * cw * 0.55, z: cz + (r() - 0.5) * cd * 0.55 });
    }
    elitePt = throne ? { x: throne.x, z: throne.z + 3 } : { x: W / 2, z: cd * 0.5 + 4 };
    if (floor <= 3) { stairsAt(W - 9, 9, H); vesselAt(W - 19, 9); }
    if (floor === 4) { bishopDoor(W / 2, 0.9, H); vesselAt(W / 2 + 15, 8); }
  } else {
    /* ================= SANTUÁRIO PROFANO DO BISPO ================= */
    W = 96; D = 120; const cx = W / 2, az = 36, ar = 34, H = 16;
    g.add(new THREE.HemisphereLight(0xb87a8a, 0x3a2028, 1.9));
    floorPlane(0, 0, W, D, slabTex('#3e2e34', '#34262c'), 7);
    floorPlane(cx - 9, 46, 18, D - 50, marbleTex(), 4.5, 0.01);
    wall(0, 0, 0, D, H, 1.0); wall(0, 0, cx - ar, 0, H, 1.0); wall(cx + ar, 0, W, 0, H, 1.0); arcWall(cx, az, ar, -Math.PI / 2, Math.PI / 2, H + 4); wall(W, 0, W, D, 1.1, 0.8, smD); wall(0, D, cx - 3, D, 1.1, 0.8, smD); wall(cx + 3, D, W, D, 1.1, 0.8, smD);
    for (let z = 8; z < D - 4; z += 10) { add(B(1.6, H + 1, 2), smD, 0.8, (H + 1) / 2, z); if (z > 40) lancet(0, z + 5, 9, 2.4, 8, true, ['#6a0a14', '#2a0a1a', '#a01a1a', '#1a0a10']); }
    { const rose = new THREE.Mesh(new THREE.CircleGeometry(7.5, 40), new THREE.MeshBasicMaterial({ map: roseTex(['#7a0a14', '#2a0a14', '#c01a1a', '#3a0a2a'], 'b'), transparent: true })); rose.position.set(cx, H + 2, az - ar + 1.2); g.add(rose); }
    // círculo ritual gravado no chão com luz rubra, canais de sangue até o trono
    { const rc = new THREE.Mesh(new THREE.PlaneGeometry(26, 26), new THREE.MeshBasicMaterial({ map: ritualTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); rc.rotation.x = -Math.PI / 2; rc.position.set(cx, 0.04, az + 22); rc.userData.dyn = true; g.add(rc); light(cx, 1, az + 22, 0xff2a1a, 40, 18);
      for (const sx of [-1, 1]) { const ch = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 22), new THREE.MeshToonMaterial({ color: 0x5a060c })); ch.rotation.x = -Math.PI / 2; ch.position.set(cx + sx * 3, 0.035, az + 9); ch.rotation.z = sx * 0.15; g.add(ch); } }
    for (let k = 0; k < 4; k++) add(B(30 - k * 4, 0.45, 4), smD, cx, 0.22 + k * 0.45, az + 6 - k * 2.5, false);
    add(B(22, 1.8, 14), sm, cx, 0.9, az - 6);
    const tr = new THREE.Group(); tr.position.set(cx, 1.8, az - 9); g.add(tr); add(B(2.6, 1, 2), dark, 0, 0.5, 0, true, 0, tr); add(B(3, 6, 0.6), dark, 0, 3.4, -0.9, true, 0, tr); for (const sx of [-1, 1]) { const horn = add(new THREE.ConeGeometry(0.22, 2.4, 5), gold, sx * 1.3, 7, -0.9, false, 0, tr); horn.rotation.z = -sx * 0.4; add(B(0.5, 2, 1.8), dark, sx * 1.4, 1.2, 0, true, 0, tr); } solid(cx, az - 9, 2.2);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), new THREE.MeshBasicMaterial({ color: 0xb3202f })); eye.scale.set(1.8, 0.85, 0.5); eye.position.set(cx, 9.2, az - 9.8); g.add(eye); light(cx, 8, az - 5, 0xb3202f, 70, 26);
    for (let a = 0; a < 11; a++) { const t = -1.4 + a * 0.28, x = cx + Math.sin(t) * (ar - 5), z = az - Math.cos(t) * (ar - 5); pier(x, z, 10, 0.9); if (a % 2 === 0) brazier(x + Math.sin(t) * 3, z - Math.cos(t) * -3, 0x9a3aff, 46); }
    const piers: [number, number][] = []; for (let z = az + 12; z < D - 8; z += 10) for (const sx of [-1, 1]) piers.push([cx + sx * 16, z]);
    for (const [x, z] of piers) pier(x, z, 9, 0.9);
    for (let z = az + 12; z < D - 8; z += 10) { cage(cx + (z % 20 ? -8 : 8), z + 5, 3.5); statue(cx - 26, z + 5, Math.PI / 2, 1, 1.2); statue(cx + 26, z + 5, -Math.PI / 2, 0, 1.2); banner(cx - 15.1, z + 5, 6, clothP, true); }
    for (let k = 0; k < 20; k++) bones(cx + (r() - 0.5) * 60, az + 30 + r() * 60, 5); bloodPool(cx - 20, 80, 3); bloodPool(cx + 18, 96, 2.6); for (let k = 0; k < 8; k++) candles(cx + (r() - 0.5) * 50, az + 20 + r() * 60, 6);
    throne = { x: cx, z: az - 6 }; elitePt = { x: cx, z: az + 14 };
    for (let k = 0; k < 10; k++) spawnPts.push({ x: cx + (r() - 0.5) * 60, z: az + 36 + r() * 60 });
  }

  function stairsAt(sx: number, sz: number, H: number) {
    // poço da escada: mureta de pedra em volta, degraus em espiral que descem visíveis do parapeito até sumir no escuro
    const R = 3.6;
    const p = new THREE.Mesh(new THREE.CircleGeometry(R, 28), new THREE.MeshBasicMaterial({ color: 0x050308 })); p.rotation.x = -Math.PI / 2; p.position.set(sx, 0.03, sz); g.add(p);
    add(new THREE.CylinderGeometry(0.55, 0.65, H, 10), sm, sx, H / 2, sz, false); // coluna central (o eixo da espiral)
    const a0 = Math.PI / 2 + 0.15; // a entrada fica virada para +z (de onde o jogador chega)
    { const shaft = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 1.1, 28, 1, true), (() => { const m = std(0xffffff, { map: stoneTex(0x2c2832) }); m.side = THREE.BackSide; return m; })()); shaft.position.set(sx, 0.52, sz); g.add(shaft); } // parede interna do poço: dá profundidade
    for (let k = 0; k < 15; k++) { const a = a0 - 0.2 - k * 0.43, y = 0.92 - k * 0.062, c = new THREE.Color(0x9a948a).lerp(new THREE.Color(0x120f16), Math.min(1, k / 11));
      const st = add(B(1.75, 0.13, 0.7), std(c.getHex()), sx + Math.cos(a) * 1.75, y, sz + Math.sin(a) * 1.75, k < 8, -a); void st; }
    // mureta (parapeito) com abertura para a entrada
    for (let a = 0; a < 20; a++) { const t = a / 20 * 6.283; if (Math.abs(((t - a0 + 9.42) % 6.283) - 3.14) < 0.62) continue; const blk = add(B(1.25, 1.05, 0.5), smD, sx + Math.cos(t) * (R + 0.25), 0.52, sz + Math.sin(t) * (R + 0.25), false, -t + Math.PI / 2); void blk; solid(sx + Math.cos(t) * (R + 0.25), sz + Math.sin(t) * (R + 0.25), 0.6); }
    // dois pilaretes com lanternas marcando a boca da escada
    for (const s2 of [-1, 1]) { const t = a0 + s2 * 0.72, x = sx + Math.cos(t) * (R + 0.3), z = sz + Math.sin(t) * (R + 0.3); add(B(0.6, 1.6, 0.6), sm, x, 0.8, z); flame(x, 1.75, z, 0.8); light(x, 1.9, z, 0xffb050, 14, 9); }
    stairs = { x: sx + Math.cos(a0) * (R + 1.4), z: sz + Math.sin(a0) * (R + 1.4) };
  }
  /** Vasilhame do Sacrifício: grande taça de pedra num pedestal; o sangue sobe conforme os mortos do andar caem */
  function vesselAt(vx: number, vz: number) {
    add(new THREE.CylinderGeometry(2.1, 2.4, 0.35, 8), smD, vx, 0.17, vz); // degrau octogonal
    add(new THREE.CylinderGeometry(0.55, 0.85, 1.2, 8), sm, vx, 0.95, vz); // haste
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 0.75, 0.95, 16, 1, true), std(0xffffff, { map: stoneTex(0x6a6258) })); bowl.position.set(vx, 2.0, vz); (bowl.material as THREE.Material).side = THREE.DoubleSide; ink(bowl, 0.05); g.add(bowl);
    add(new THREE.TorusGeometry(1.7, 0.1, 6, 24), goldD, vx, 2.48, vz, false).rotation.x = Math.PI / 2;
    add(new THREE.CircleGeometry(0.76, 16), smD, vx, 1.54, vz, false).rotation.x = -Math.PI / 2;
    for (let k = 0; k < 4; k++) { const a = k / 4 * 6.283 + 0.4; candles(vx + Math.cos(a) * 2.9, vz + Math.sin(a) * 2.9, 3); }
    for (let k = 0; k < 6; k++) { const a = k / 6 * 6.283; const ch = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 2.4), new THREE.MeshToonMaterial({ color: 0x4a060c })); ch.rotation.x = -Math.PI / 2; ch.rotation.z = -a + Math.PI / 2; ch.position.set(vx + Math.cos(a) * 3.6, 0.036, vz + Math.sin(a) * 3.6); g.add(ch); } // canais de sangue chegando à taça
    solid(vx, vz, 2.0);
    const bm = new THREE.MeshBasicMaterial({ color: 0x8a0a14 }); const blood = new THREE.Mesh(new THREE.CircleGeometry(1, 20), bm); blood.rotation.x = -Math.PI / 2; blood.userData.dyn = true; g.add(blood);
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(5, 5), new THREE.MeshBasicMaterial({ color: 0xff1a2a, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); halo.rotation.x = -Math.PI / 2; halo.position.set(vx, 2.6, vz); halo.userData.dyn = true; g.add(halo);
    const lamp = new THREE.PointLight(0xff2a1a, 0, 12); lamp.position.set(vx, 3.2, vz); g.add(lamp);
    vessel = { x: vx, z: vz, fill(k: number, t: number) { const q = Math.max(0, Math.min(1, k)); blood.visible = q > 0.01; const y = 1.56 + q * 0.86, rad = 0.76 + (1.68 - 0.76) * ((y - 1.53) / 0.95); blood.position.set(vx, y, vz); blood.scale.setScalar(rad); const pulse = 0.5 + 0.5 * Math.sin(t * (q >= 1 ? 4 : 1.6)); bm.color.setHex(q >= 1 ? 0xd0101c : 0x8a0a14); (halo.material as THREE.MeshBasicMaterial).opacity = q >= 1 ? 0.35 + 0.25 * pulse : q * 0.18 * (0.7 + 0.3 * pulse); lamp.intensity = q >= 1 ? 8 + 6 * pulse : q * 4; } };
    vessel.fill(0, 0);
  }
  function bishopDoor(px: number, pz: number, H: number) {
    const doorG = new THREE.Group(); doorG.position.set(px, 0, pz); g.add(doorG);
    add(B(14, H + 3, 2.4), sm, px, (H + 3) / 2, pz - 0.2); arch(px - 4, pz + 1.2, px + 4, pz + 1.2, H - 1, 0.5); for (const sx of [-1, 1]) pier(px + sx * 4.6, pz + 1.6, H - 2.5, 0.6);
    const leaves: THREE.Mesh[] = [];
    for (const sx of [-1, 1]) { const leaf = new THREE.Mesh(B(3.6, H - 0.8, 0.8), std(0xffffff, { map: woodTex(0x1a1008) })); leaf.position.set(sx * 1.85, (H - 0.8) / 2, 1.2); ink(leaf, 0.05); leaf.userData.dyn = true; doorG.add(leaf); leaves.push(leaf); for (let k = 0; k < 4; k++) { const band = new THREE.Mesh(B(3.7, 0.25, 0.9), ironM); band.position.set(0, -2.2 + k * 1.5, 0); leaf.add(band); } }
    const seals: THREE.Mesh[] = []; for (let k = 0; k < 3; k++) { const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), new THREE.MeshBasicMaterial({ color: 0x3a2a3a })); s.position.set(-1.6 + k * 1.6, H * 0.55, 1.7); doorG.add(s); seals.push(s); }
    for (const sx of [-1, 1]) solid(px + sx * 1.8, pz + 1.2, 1.9); for (const sx of [-1, 1]) { brazier(px + sx * 6, pz + 3.5, 0xff3a2a, 46); statue(px + sx * 9, pz + 3, sx * 1.3, 1, 1.3); }
    let opened = false;
    door = { x: px, z: pz + 3.4, open() { if (opened) return; opened = true; for (const s of seals) (s.material as THREE.MeshBasicMaterial).color.setHex(0xffd24a); cols.splice(0, cols.length, ...cols.filter(([x, z]) => !(Math.abs(x - px) < 4 && Math.abs(z - (pz + 1.2)) < 2.2))); let t = 0; const tick = () => { t += 0.03; for (let i = 0; i < 2; i++) leaves[i].rotation.y = (i ? 1 : -1) * Math.min(1.5, t * 1.5); if (t < 1) requestAnimationFrame(tick); }; tick(); } };
  }

  const dx0 = W / 2, dw = 5.5;
  const free = (x: number, z: number) => {
    if (x < 0.45 || x > W - 0.45 || z < 0.45) return false;
    if (z > D - 0.1) return Math.abs(x - dx0) < dw / 2 - 0.25;
    for (const [cx, cz, rad] of cols) if (Math.abs(x - cx) < rad && Math.abs(z - cz) < rad && Math.hypot(x - cx, z - cz) < rad) return false;
    return true;
  };
  const lights: { l: THREE.PointLight; base: number; ph: number }[] = []; let lastHx = -1e9, lastHz = -1e9;
  const flicker = (t: number, hx = W / 2, hz = D / 2) => {
    if (Math.hypot(hx - lastHx, hz - lastHz) > 3) { lastHx = hx; lastHz = hz; const near = [...fixtures].sort((a, b) => Math.hypot(a.x - hx, a.z - hz) - Math.hypot(b.x - hx, b.z - hz)).slice(0, pool.length); lights.length = 0; pool.forEach((l, k) => { const f = near[k]; if (!f) { l.intensity = 0; return; } l.position.set(f.x, f.y, f.z); l.color.setHex(f.c); l.distance = f.dist; lights.push({ l, base: f.i, ph: f.ph }); }); }
    for (const l of lights) l.l.intensity = l.base * (0.9 + 0.1 * Math.sin(t * 9 + l.ph) + 0.05 * Math.sin(t * 23 + l.ph * 2));
  };
  mergeStatic(g, ramp);
  return { group: g, W, D, colliders: cols, free, flicker, exitZ: D + 0.9, stairs, vessel, door, spawnPts, elitePt, throne };
}
