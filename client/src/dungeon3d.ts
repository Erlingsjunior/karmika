/** Masmorras, cavernas e subsolos (Erling, 23/10): o conteúdo cresce PARA BAIXO, sem esticar o mapa.
 *  Gerador procedural: salas ligadas por corredores, da entrada (sul, embaixo e no centro) até o salão do chefe (norte),
 *  com salas laterais (baús, elites). Cada tema tem chão, rocha, luzes e enfeites próprios.
 *  Câmera olha de sudeste: a rocha ao norte/oeste do chão é alta; ao sul/leste fica baixa para nunca esconder o herói.
 *  Origem local (0,0) = canto noroeste; a saída fica em (W/2, D), como nas outras construções por dentro. */
import * as THREE from 'three';
import { std, ramp } from './toon3d';
import { mergeStatic } from './merge3d';
import type { Interior } from './interiors3d';

export type DgTheme = 'toca' | 'mina' | 'gelo' | 'magma' | 'cripta' | 'mata';
export type RoomKind = 'start' | 'pack' | 'side' | 'elite' | 'boss';
export interface DgRoom { x: number; z: number; w: number; d: number; kind: RoomKind }
export interface DungeonFloor extends Interior {
  rooms: DgRoom[]; boss: { x: number; z: number }; chests: { x: number; z: number }[];
  gate: { x: number; z: number; opened: boolean; open(): void } | null;
  entry: { x: number; z: number }; theme: DgTheme;
}
const rr = (s: number) => () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
const C = 3; // metros por célula

/* ---------------- texturas ---------------- */
const TC = new Map<string, THREE.CanvasTexture>();
function ctex(key: string, draw: (g: CanvasRenderingContext2D, r: () => number) => void, s = 64) {
  let t = TC.get(key); if (t) return t; const c = document.createElement('canvas'); c.width = c.height = s; const r = rr(key.length * 977 + 13); draw(c.getContext('2d')!, r);
  t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = t.minFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace; TC.set(key, t); return t;
}
const hex = (c: number, k = 1) => `rgb(${Math.min(255, ((c >> 16) & 255) * k) | 0},${Math.min(255, ((c >> 8) & 255) * k) | 0},${Math.min(255, (c & 255) * k) | 0})`;
/** chão: terra, pedra, gelo, basalto rachado de lava, lajes de cripta, musgo */
const floorTex = (theme: DgTheme, base: number) => ctex('dgf' + theme, (g, r) => {
  g.fillStyle = hex(base); g.fillRect(0, 0, 64, 64);
  for (let i = 0; i < 260; i++) { g.fillStyle = hex(base, 0.7 + r() * 0.5); g.fillRect(r() * 64, r() * 64, 1 + r() * 3, 1 + r() * 2); }
  if (theme === 'cripta' || theme === 'mina') { g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = 1.5; for (let i = 0; i <= 2; i++) { g.beginPath(); g.moveTo(0, i * 32); g.lineTo(64, i * 32); g.stroke(); g.beginPath(); g.moveTo(i * 32 + (i % 2) * 8, 0); g.lineTo(i * 32 + (i % 2) * 8, 64); g.stroke(); } }
  if (theme === 'magma') { g.strokeStyle = '#ff5a10'; g.lineWidth = 1.2; for (let k = 0; k < 4; k++) { g.beginPath(); let x = r() * 64, y = r() * 64; g.moveTo(x, y); for (let s = 0; s < 5; s++) { x += (r() - 0.5) * 18; y += (r() - 0.5) * 18; g.lineTo(x, y); } g.stroke(); } }
  if (theme === 'gelo') { g.strokeStyle = 'rgba(255,255,255,.35)'; for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(r() * 64, r() * 64); g.lineTo(r() * 64, r() * 64); g.stroke(); } }
  if (theme === 'toca' || theme === 'mata') for (let i = 0; i < 18; i++) { g.fillStyle = theme === 'mata' ? 'rgba(80,140,60,.35)' : 'rgba(40,20,10,.35)'; g.beginPath(); g.ellipse(r() * 64, r() * 64, 2 + r() * 5, 1 + r() * 3, r() * 3, 0, 6.283); g.fill(); }
});
const rockTex = (base: number) => ctex('dgr' + base, (g, r) => {
  g.fillStyle = hex(base); g.fillRect(0, 0, 64, 64);
  for (let i = 0; i < 40; i++) { g.fillStyle = hex(base, 0.6 + r() * 0.6); g.beginPath(); g.ellipse(r() * 64, r() * 64, 3 + r() * 9, 2 + r() * 6, r() * 3, 0, 6.283); g.fill(); }
  g.strokeStyle = 'rgba(0,0,0,.4)'; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(r() * 64, r() * 64); g.lineTo(r() * 64, r() * 64); g.stroke(); }
});

interface ThemeDef { floor: number; rock: number; rock2: number; light: number; tall: [number, number]; low: [number, number]; void: number }
export const THEMES: Record<DgTheme, ThemeDef> = {
  toca: { floor: 0x4a3626, rock: 0x5a4434, rock2: 0x3a2c22, light: 0xff9a50, tall: [2.6, 3.8], low: [0.6, 1.1], void: 0x0a0604 },
  mina: { floor: 0x4a4440, rock: 0x5e5650, rock2: 0x3e3a36, light: 0xffc070, tall: [3.0, 4.2], low: [0.7, 1.2], void: 0x070606 },
  gelo: { floor: 0x9ab8d0, rock: 0x7a9ab8, rock2: 0xc8e0f0, light: 0x9ad7ff, tall: [3.0, 4.4], low: [0.7, 1.2], void: 0x060a10 },
  magma: { floor: 0x2a2224, rock: 0x3a2e2e, rock2: 0x1e1818, light: 0xff6a20, tall: [3.0, 4.6], low: [0.7, 1.2], void: 0x0a0402 },
  cripta: { floor: 0x5a5650, rock: 0x6a6660, rock2: 0x4a4640, light: 0xffb860, tall: [3.2, 4.2], low: [0.6, 1.0], void: 0x060508 },
  mata: { floor: 0x2e3a26, rock: 0x3e3a2e, rock2: 0x2a3424, light: 0x9aff9a, tall: [2.8, 4.0], low: [0.6, 1.1], void: 0x040806 },
};

/* ---------------- planta ---------------- */
function plan(r: () => number, nMain: number, nSide: number, bossW: number) {
  const ri = (a: number, b: number) => a + Math.floor(r() * (b - a + 1));
  const rooms: DgRoom[] = [{ x: 0, z: 0, w: 5, d: 4, kind: 'start' }];
  const links: [DgRoom, DgRoom][] = [];
  let cur = rooms[0];
  for (let i = 0; i < nMain; i++) {
    const w = ri(4, 7), d = ri(4, 6), x = Math.max(-14, Math.min(14, cur.x + ri(-6, 6))), z = cur.z - Math.ceil(cur.d / 2) - Math.ceil(d / 2) - ri(3, 5);
    const rm: DgRoom = { x, z, w, d, kind: i === Math.floor(nMain * 0.6) ? 'elite' : 'pack' }; rooms.push(rm); links.push([cur, rm]); cur = rm;
  }
  const boss: DgRoom = { x: Math.max(-10, Math.min(10, cur.x + ri(-3, 3))), z: cur.z - Math.ceil(cur.d / 2) - Math.ceil(bossW / 2) - 4, w: bossW, d: bossW - 1, kind: 'boss' };
  rooms.push(boss); links.push([cur, boss]);
  const mains = rooms.slice(1, -1);
  for (let i = 0; i < nSide && mains.length; i++) {
    const host = mains[Math.floor(r() * mains.length)], dir = r() < 0.5 ? -1 : 1, w = ri(4, 5), d = ri(3, 5);
    const rm: DgRoom = { x: host.x + dir * (Math.ceil(host.w / 2) + Math.ceil(w / 2) + ri(3, 5)), z: host.z + ri(-2, 2), w, d, kind: 'side' };
    rooms.push(rm); links.push([host, rm]);
  }
  return { rooms, links, boss };
}

export function buildDungeon(o: { seed: number; theme: DgTheme; main: number; side: number; boss?: number }): DungeonFloor {
  const r = rr(o.seed * 131 + 7), th = THEMES[o.theme];
  const P = plan(r, o.main, o.side, o.boss ?? 11);
  const walk = new Set<string>(), K = (x: number, z: number) => x + ',' + z;
  const carveRoom = (rm: DgRoom) => { const x0 = rm.x - Math.floor(rm.w / 2), z0 = rm.z - Math.floor(rm.d / 2);
    for (let z = z0; z < z0 + rm.d; z++) for (let x = x0; x < x0 + rm.w; x++) { const corner = (x === x0 || x === x0 + rm.w - 1) && (z === z0 || z === z0 + rm.d - 1); if (corner && rm.kind !== 'start' && r() < 0.7) continue; walk.add(K(x, z)); } };
  const carveLine = (x0: number, z0: number, x1: number, z1: number) => { // corredor de 2 células: primeiro na horizontal, depois sobe
    for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) { walk.add(K(x, z0)); walk.add(K(x, z0 - 1)); }
    for (let z = Math.min(z0, z1); z <= Math.max(z0, z1); z++) { walk.add(K(x1, z)); walk.add(K(x1 - 1, z)); } };
  for (const rm of P.rooms) carveRoom(rm);
  for (const [a, b] of P.links) carveLine(a.x, a.z, b.x, b.z);
  // limites e deslocamento: a sala de entrada fica centrada embaixo (a saída em W/2, D)
  let minX = 0, maxX = 0, minZ = 0, maxZ = 0; for (const k of walk) { const [x, z] = k.split(',').map(Number); minX = Math.min(minX, x); maxX = Math.max(maxX, x); minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z); }
  const start = P.rooms[0], halfW = Math.max(-minX, maxX) + 3, ox = halfW, oz = -minZ + 3;
  const bottom = start.z - Math.floor(start.d / 2) + start.d - 1; // última fileira da sala de entrada
  const NX = 2 * halfW + 1, NZ = bottom + oz + 1, W = NX * C, D = NZ * C;
  const isW = (cx: number, cz: number) => walk.has(K(cx - ox, cz - oz)); // em células locais
  const g = new THREE.Group(), cols: [number, number, number][] = [];
  const fixtures: { x: number; y: number; z: number; c: number; i: number; dist: number; ph: number }[] = [];
  const pool: THREE.PointLight[] = []; for (let k = 0; k < 8; k++) { const l = new THREE.PointLight(th.light, 0, 14, 1.4); g.add(l); pool.push(l); }
  const loc = (rm: DgRoom) => ({ x: (rm.x + ox + (rm.w % 2 ? 0.5 : 0)) * C, z: (rm.z + oz + (rm.d % 2 ? 0.5 : 0)) * C });

  /* chão: um ladrilho por célula andável (fundido depois) e um fundo escuro por baixo de tudo */
  const fm = std(0xffffff, { map: floorTex(o.theme, th.floor) });
  for (let cz = 0; cz < NZ; cz++) for (let cx = 0; cx < NX; cx++) if (isW(cx, cz)) { const q = new THREE.Mesh(new THREE.PlaneGeometry(C, C), fm); q.rotation.x = -Math.PI / 2; q.position.set((cx + 0.5) * C, 0, (cz + 0.5) * C); q.receiveShadow = true; g.add(q); }
  { const v = new THREE.Mesh(new THREE.PlaneGeometry(W + 80, D + 80), new THREE.MeshBasicMaterial({ color: th.void })); v.rotation.x = -Math.PI / 2; v.position.set(W / 2, -0.05, D / 2); g.add(v); }

  /* rocha em volta (Erling, 23/10: "um monte de cubo de barro igual, que horror"; referência: as cavernas do Diablo 2).
     Uma malha só de rocha esculpida: o chão sobe em paredes irregulares, com saliências, fendas e estratos; musgo/gelo/fuligem
     conforme o tema nas partes de cima e no pé da parede; o topo escurece até sumir no breu. Alta ao norte/oeste, baixa ao sul/leste
     (a câmera vem de sudeste e nunca perde o herói). Depois: estalactites penduradas na beira, estalagmites, pedregulhos e morcegos. */
  const hsh = (x: number, z: number) => { const v = Math.sin(x * 127.1 + z * 311.7 + o.seed * 0.013) * 43758.5453; return v - Math.floor(v); };
  const vn = (x: number, z: number) => { const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi, u = xf * xf * (3 - 2 * xf), w = zf * zf * (3 - 2 * zf);
    return (hsh(xi, zi) * (1 - u) + hsh(xi + 1, zi) * u) * (1 - w) + (hsh(xi, zi + 1) * (1 - u) + hsh(xi + 1, zi + 1) * u) * w; };
  const fbm = (x: number, z: number) => vn(x, z) * 0.55 + vn(x * 2.1, z * 2.1) * 0.3 + vn(x * 4.3, z * 4.3) * 0.15;
  /** altura-alvo de cada célula de rocha (alta ou baixa) e distância de um ponto ao chão andável mais perto */
  const cellH = new Map<string, number>();
  const hOf = (cx: number, cz: number) => { const k = K(cx, cz); let v = cellH.get(k); if (v === undefined) { const low = isW(cx, cz - 1) || isW(cx - 1, cz) || isW(cx - 1, cz - 1) || cz >= NZ - 1 && (cz + 1) * C >= D; const [a, b] = low ? th.low : th.tall; v = isW(cx, cz) ? 0 : a + hsh(cx * 3.1, cz * 1.7) * (b - a); cellH.set(k, v); } return v; };
  const distFloor = (x: number, z: number) => { const cx = Math.floor(x / C), cz = Math.floor(z / C); let d = 9;
    for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { const qx = cx + dx, qz = cz + dz; if (!isW(qx, qz)) continue; const ex = Math.max(qx * C - x, 0, x - (qx + 1) * C), ez = Math.max(qz * C - z, 0, z - (qz + 1) * C); d = Math.min(d, Math.hypot(ex, ez)); }
    return d; };
  const STEP = 0.5, X0 = -2 * C, Z0 = -2 * C, NXv = Math.ceil((W + 4 * C) / STEP) + 1, NZv = Math.ceil((D + 2.5 * C) / STEP) + 1;
  const pos = new Float32Array(NXv * NZv * 3), colA = new Float32Array(NXv * NZv * 3), hArr = new Float32Array(NXv * NZv);
  const cR = new THREE.Color(th.rock), cR2 = new THREE.Color(th.rock2), cTop = new THREE.Color(th.void), tmpC = new THREE.Color();
  const MOSS: Partial<Record<DgTheme, number>> = { mata: 0x3e6a2a, toca: 0x4a5a2a, mina: 0x4a5236, cripta: 0x3e4a32, gelo: 0xdcefff, magma: 0x120c0a };
  const cMoss = new THREE.Color(MOSS[o.theme] ?? 0x3e5a2a);
  for (let iz = 0; iz < NZv; iz++) for (let ix = 0; ix < NXv; ix++) {
    const x = X0 + ix * STEP, z = Z0 + iz * STEP, i3 = (iz * NZv * 0 + iz * NXv + ix);
    const open = z > D - 0.2 && Math.abs(x - W / 2) < C * 0.9; // a boca da saída fica livre
    let d = distFloor(x, z); d += (fbm(x * 0.6, z * 0.6) - 0.5) * 0.9; // a beira da parede é irregular
    const cx = Math.floor(x / C), cz = Math.floor(z / C);
    let ht = 0, wsum = 0; for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const wgt = 1 / (1 + Math.hypot((cx + dx + 0.5) * C - x, (cz + dz + 0.5) * C - z)); ht += hOf(cx + dx, cz + dz) * wgt; wsum += wgt; } ht /= wsum; // altura suave entre células
    const lowish = ht < th.tall[0] * 0.6;
    let h = d <= 0 || open ? -0.06 : ht * Math.min(1, Math.pow(Math.min(1, d / (lowish ? 0.9 : 1.6)), 0.7)) * (0.82 + fbm(x * 1.3 + 7, z * 1.3) * 0.36);
    if (h > 0.1) h += (vn(x * 3.3, z * 3.3) - 0.5) * 0.35 + Math.max(0, fbm(x * 0.35 + 3, z * 0.35) - 0.62) * 3; // saliências e picos
    if (!isW(cx, cz) && d > 3.2 && !lowish) h = ht * 1.05 + fbm(x, z) * 0.8; // miolo da rocha
    hArr[i3] = h; pos[i3 * 3] = x; pos[i3 * 3 + 1] = Math.max(-0.06, h); pos[i3 * 3 + 2] = z;
  }
  const idx: number[] = [];
  for (let iz = 0; iz < NZv - 1; iz++) for (let ix = 0; ix < NXv - 1; ix++) { const a = iz * NXv + ix, b = a + 1, c2 = a + NXv, d2 = c2 + 1;
    if (hArr[a] <= 0 && hArr[b] <= 0 && hArr[c2] <= 0 && hArr[d2] <= 0) continue; // chão: já tem os ladrilhos
    idx.push(a, c2, b, b, c2, d2); }
  const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); rg.setIndex(idx); rg.computeVertexNormals();
  const nrm = rg.getAttribute('normal');
  for (let i = 0; i < NXv * NZv; i++) { const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2], ny = nrm.getY(i);
    const strata = Math.sin(y * 5.5 + fbm(x * 0.4, z * 0.4) * 4) * 0.5 + 0.5, n = fbm(x * 1.7, z * 1.7);
    tmpC.copy(cR).lerp(cR2, Math.min(1, strata * 0.55 + n * 0.5)); tmpC.multiplyScalar(1.05 + n * 0.55); if (strata > 0.85) tmpC.multiplyScalar(1.25); // veios claros dos estratos // estratos e manchas
    if (vn(x * 6, z * 6) > 0.8) tmpC.multiplyScalar(0.55); // fendas
    const mossK = (ny > 0.55 ? 0.75 : 0) * (y > 0.4 ? 1 : 0) + (y > 0 && y < 0.5 ? 0.45 : 0); // musgo/gelo em cima e no pé
    if (mossK > 0 && fbm(x * 0.9 + 11, z * 0.9) > 0.42) tmpC.lerp(cMoss, Math.min(0.85, mossK));
    const top = Math.max(0, (y - th.tall[0] * 0.9) / (th.tall[1] * 1.3)); tmpC.lerp(cTop, Math.min(0.5, top)); // o alto some no breu
    colA[i * 3] = tmpC.r; colA[i * 3 + 1] = tmpC.g; colA[i * 3 + 2] = tmpC.b; }
  rg.setAttribute('color', new THREE.BufferAttribute(colA, 3));
  const rockMesh = new THREE.Mesh(rg, new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: ramp, map: rockTex(0xb8b0a4) }));
  { const uv = new Float32Array(NXv * NZv * 2); for (let i = 0; i < NXv * NZv; i++) { uv[i * 2] = (pos[i * 3] + pos[i * 3 + 1] * 0.7) / 3.5; uv[i * 2 + 1] = (pos[i * 3 + 2] - pos[i * 3 + 1] * 0.7) / 3.5; } rg.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); }
  rockMesh.castShadow = true; rockMesh.receiveShadow = true; rockMesh.userData.keep = true; g.add(rockMesh);
  const rmA = std(0xffffff, { map: rockTex(th.rock) }), rm2 = std(0xffffff, { map: rockTex(th.rock2) });
  /** pedra irregular (icosaedro amassado) */
  const boulder = (x: number, z: number, s: number, m: THREE.Material) => { const geo = new THREE.IcosahedronGeometry(s, 1), pa = geo.getAttribute('position');
    for (let k = 0; k < pa.count; k++) { const f = 0.75 + hsh(pa.getX(k) * 9 + x, pa.getZ(k) * 9 + z) * 0.5; pa.setXYZ(k, pa.getX(k) * f, pa.getY(k) * f * 0.7, pa.getZ(k) * f); } geo.computeVertexNormals();
    const b = new THREE.Mesh(geo, m); b.position.set(x, s * 0.25, z); b.rotation.y = hsh(x, z) * 6; b.castShadow = true; g.add(b); return b; };
  /* estalactites (penduradas na beira das paredes altas, sobre o chão) e estalagmites (no pé da parede, nos cantos) */
  const tipM = std(o.theme === 'gelo' ? 0xc8e8ff : th.rock, o.theme === 'gelo' ? { transparent: true, opacity: 0.85 } : { map: rockTex(th.rock) });
  for (let cz = 0; cz < NZ; cz++) for (let cx = 0; cx < NX; cx++) {
    if (!isW(cx, cz)) continue;
    const wallN = !isW(cx, cz - 1), wallW = !isW(cx - 1, cz); if (!wallN && !wallW) continue;
    const rv = hsh(cx * 5.3, cz * 2.9);
    if (rv < 0.55) { // estalactite: nasce no alto da parede e pende para dentro do corredor
      const L = 0.9 + hsh(cx, cz * 7) * 1.6, top = (hOf(cx, cz - 1) || hOf(cx - 1, cz) || th.tall[0]) * 0.92;
      const x = (cx + (wallW ? 0.12 : 0.3 + hsh(cx * 2, cz) * 0.5)) * C, z = (cz + (wallN ? 0.12 : 0.3 + hsh(cx, cz * 2) * 0.5)) * C;
      for (let k = 0; k < 1 + Math.floor(rv * 4); k++) { const l2 = L * (0.55 + hsh(cx + k, cz - k) * 0.6), cone = new THREE.Mesh(new THREE.ConeGeometry(0.1 + l2 * 0.09, l2, 6), tipM); cone.rotation.x = Math.PI; cone.position.set(x + (k - 1) * 0.35, top - l2 / 2, z + (hsh(k, cx) - 0.5) * 0.4); g.add(cone); } }
    else if (rv > 0.82) { // estalagmite no pé da parede (bloqueia só o miolo)
      const L = 0.5 + hsh(cz, cx * 3) * 1.1, x = (cx + (wallW ? 0.2 : 0.5)) * C, z = (cz + (wallN ? 0.2 : 0.5)) * C, sg2 = new THREE.Mesh(new THREE.ConeGeometry(0.16 + L * 0.1, L, 6), tipM); sg2.position.set(x, L / 2, z); g.add(sg2); cols.push([x, z, 0.3]); }
    else if (rv > 0.7) { const x = (cx + (wallW ? 0.18 : 0.5)) * C, z = (cz + (wallN ? 0.18 : 0.5)) * C; boulder(x, z, 0.35 + hsh(cx, cz) * 0.45, hsh(cz, cx) < 0.5 ? rmA : rm2); cols.push([x, z, 0.45]); } // pedregulho
  }
  /* morcegos: bandos que circulam no alto das salas (o voo é animado em flicker) */
  const dust: { x: number; z: number }[] = []; let motes: THREE.Points | null = null;
  const bats: { m: THREE.Object3D; wl: THREE.Object3D; wr: THREE.Object3D; cx: number; cz: number; r: number; y: number; sp: number; ph: number }[] = [];
  { const bm = new THREE.MeshBasicMaterial({ color: 0x0a0808, side: THREE.DoubleSide }), wingG = new THREE.BufferGeometry(); wingG.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, 0.05, 0.34, 0.04, 0.12, 0.3, 0, -0.08, 0, 0, 0.05, 0.3, 0, -0.08, 0, 0, -0.08]), 3));
    for (const rm of P.rooms) { if (rm.kind === 'start' && o.theme !== 'toca') continue; const n = o.theme === 'gelo' || o.theme === 'magma' ? 1 : 2 + Math.floor(hsh(rm.x, rm.z) * 3);
      for (let k = 0; k < n; k++) { const b = new THREE.Group(), body = new THREE.Mesh(new THREE.SphereGeometry(0.07, 5, 4), bm); body.scale.set(1, 0.8, 1.6); b.add(body);
        const wl = new THREE.Mesh(wingG, bm), wr = new THREE.Mesh(wingG, bm); wr.scale.x = -1; b.add(wl, wr); b.scale.setScalar(1.4); b.userData.dyn = true; wl.userData.dyn = true; wr.userData.dyn = true; body.userData.dyn = true; g.add(b);
        const c = loc(rm); bats.push({ m: b, wl, wr, cx: c.x + (hsh(k, rm.x) - 0.5) * 3, cz: c.z + (hsh(rm.z, k) - 0.5) * 3, r: 2 + hsh(k * 3, rm.z) * 3, y: 2.6 + hsh(k, k) * 1.2, sp: (0.7 + hsh(rm.x, k) * 0.8) * (k % 2 ? 1 : -1), ph: hsh(k * 7, rm.x * 3) * 6 }); } } }
  /* enfeites e luzes por tema */
  const M = (c: number, e = 0) => std(c, e ? { emissive: new THREE.Color(c), emissiveIntensity: e } : {});
  const glowM = (c: number) => new THREE.MeshBasicMaterial({ color: c });
  const put = (geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, ry = 0) => { const k = new THREE.Mesh(geo, m); k.position.set(x, y, z); k.rotation.y = ry; g.add(k); return k; };
  const light = (x: number, y: number, z: number, c = th.light, i = 2.2, dist = 14) => fixtures.push({ x, y, z, c, i, dist, ph: r() * 9 });
  const torch = (x: number, z: number, c = th.light) => { put(new THREE.CylinderGeometry(0.06, 0.08, 1.6, 6), M(0x3a2414), x, 0.8, z); put(new THREE.ConeGeometry(0.16, 0.42, 6), glowM(c), x, 1.75, z); light(x, 2.1, z, c, 2.4, 13); cols.push([x, z, 0.35]); };
  const crystal = (x: number, z: number, c: number, s = 1) => { const k = put(new THREE.OctahedronGeometry(0.35 * s, 0), glowM(c), x, 0.45 * s, z); k.scale.y = 2.2; k.rotation.z = (r() - 0.5) * 0.5; cols.push([x, z, 0.4 * s]); if (r() < 0.5) light(x, 1.2, z, c, 1.5, 9); };
  const bones = (x: number, z: number) => { const bm = M(0xd8d0b8); for (let i = 0; i < 4; i++) { const k = put(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 5), bm, x + (r() - 0.5) * 0.8, 0.05, z + (r() - 0.5) * 0.8); k.rotation.set(Math.PI / 2, 0, r() * 3); } put(new THREE.SphereGeometry(0.13, 7, 6), bm, x, 0.12, z); };
  const nest = (x: number, z: number, s = 1) => { put(new THREE.CylinderGeometry(0.9 * s, 1.1 * s, 0.35 * s, 10), M(0x8a6a3a), x, 0.17 * s, z); put(new THREE.CylinderGeometry(0.6 * s, 0.8 * s, 0.2, 10), M(0x5a3a22), x, 0.36 * s, z); cols.push([x, z, 1.0 * s]); };
  const pool2 = (x: number, z: number, c: number, s: number, glow = false) => { const k = put(new THREE.CircleGeometry(s, 16), glow ? glowM(c) : M(c), x, 0.02, z); k.rotation.x = -Math.PI / 2; if (glow) { cols.push([x, z, s * 0.9]); light(x, 0.8, z, c, 2.6, 12); } };
  const beam = (x: number, z: number, alongX: boolean) => { const wm = M(0x5a3a22); for (const s of [-1, 1]) put(new THREE.BoxGeometry(0.25, 3, 0.25), wm, x + (alongX ? 0 : s * 2.6), 1.5, z + (alongX ? s * 2.6 : 0)); put(new THREE.BoxGeometry(alongX ? 0.3 : 5.6, 0.3, alongX ? 5.6 : 0.3), wm, x, 3, z); };
  const mush = (x: number, z: number, c: number) => { const s = 0.5 + r() * 0.9; put(new THREE.CylinderGeometry(0.08 * s, 0.12 * s, 0.9 * s, 6), M(0xd8d0c0), x, 0.45 * s, z); put(new THREE.SphereGeometry(0.4 * s, 10, 6, 0, 6.283, 0, 1.6), glowM(c), x, 0.9 * s, z); if (r() < 0.4) light(x, 1, z, c, 1.4, 8); cols.push([x, z, 0.35 * s]); };
  const sarc = (x: number, z: number) => { put(new THREE.BoxGeometry(1, 0.7, 2.2), M(0x6a6660), x, 0.35, z); put(new THREE.BoxGeometry(1.1, 0.15, 2.3), M(0x7a7670), x, 0.75, z); cols.push([x, z, 1.1]); };
  const candles = (x: number, z: number) => { for (let i = 0; i < 3; i++) { const cx2 = x + (r() - 0.5) * 0.6, cz2 = z + (r() - 0.5) * 0.6; put(new THREE.CylinderGeometry(0.05, 0.05, 0.3 + r() * 0.3, 6), M(0xe8e0c8), cx2, 0.2, cz2); put(new THREE.ConeGeometry(0.04, 0.1, 5), glowM(0xffc060), cx2, 0.45, cz2); } light(x, 0.8, z, 0xffb050, 1.4, 8); };
  const deco = (x: number, z: number) => { const k = r();
    if (o.theme === 'toca') { if (k < 0.35) nest(x, z, 0.7 + r() * 0.5); else if (k < 0.65) bones(x, z); else if (k < 0.8) candles(x, z); else pool2(x, z, 0x2a1810, 0.8 + r()); }
    else if (o.theme === 'mina') { if (k < 0.4) crystal(x, z, r() < 0.5 ? 0x7ac8ff : 0xffd27a, 0.8 + r() * 0.6); else if (k < 0.65) { put(new THREE.CylinderGeometry(0.4, 0.4, 0.9, 10), M(0x6a4a2a), x, 0.45, z); cols.push([x, z, 0.5]); } else pool2(x, z, 0x1a3040, 1 + r()); }
    else if (o.theme === 'gelo') { if (k < 0.6) crystal(x, z, 0x9ae8ff, 0.9 + r() * 1.2); else bones(x, z); }
    else if (o.theme === 'magma') { if (k < 0.45) pool2(x, z, 0xff5a10, 0.9 + r() * 0.8, true); else { const hh = 1 + r() * 2.5; put(new THREE.CylinderGeometry(0.5, 0.6, hh, 6), rm2, x, hh / 2, z); cols.push([x, z, 0.6]); } }
    else if (o.theme === 'cripta') { if (k < 0.45) sarc(x, z); else if (k < 0.75) candles(x, z); else bones(x, z); }
    else { if (k < 0.65) mush(x, z, r() < 0.5 ? 0x9aff9a : 0xc89aff); else bones(x, z); } };
  for (const rm of P.rooms) {
    const c = loc(rm), hw = (rm.w * C) / 2 - 1.2, hd = (rm.d * C) / 2 - 1.2;
    if (rm.kind !== 'boss') { const n = rm.kind === 'start' ? 1 : 2 + Math.floor(r() * 3); for (let i = 0; i < n; i++) { const side = r() < 0.5 ? -1 : 1; deco(c.x + side * hw * (0.6 + r() * 0.4), c.z + (r() - 0.5) * hd * 1.6); } }
    // tochas nas paredes do fundo (norte) de cada sala: a luz nunca fica no caminho
    if (o.theme === 'mina' || o.theme === 'toca' || o.theme === 'cripta') { torch(c.x - hw * 0.7, c.z - hd); torch(c.x + hw * 0.7, c.z - hd); }
    else light(c.x, 2.4, c.z, th.light, 1.6, 16);
  }
  if (o.theme === 'mina') for (const [a, b] of P.links) { const ax = (a.x + ox) * C, az = (a.z + oz) * C, bz = (b.z + oz) * C; for (let z = Math.min(az, bz) + 3; z < Math.max(az, bz) - 3; z += 6) beam((b.x + ox) * C, z, false); void ax; }
  /* a boca da caverna (Erling: "não tem luz de entrada nem de saída"): a luz do dia entra pela saída — um clarão lá fora, feixes de luz
     inclinados com poeira, a mancha clara no chão que vai escurecendo para dentro, e as pedras que emolduram a boca */
  const DAY = o.theme === 'magma' ? 0xffb070 : o.theme === 'gelo' ? 0xdff2ff : 0xfff0d0;
  const grad = (a0: number) => { const c = document.createElement('canvas'); c.width = 32; c.height = 128; const x = c.getContext('2d')!, gr = x.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, `rgba(255,248,225,${a0})`); gr.addColorStop(1, 'rgba(255,248,225,0)'); x.fillStyle = gr; x.fillRect(0, 0, 32, 128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
  const glowMat = (a0: number) => new THREE.MeshBasicMaterial({ map: grad(a0), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, color: DAY, fog: false });
  const radial = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d')!, gr = x.createRadialGradient(32, 32, 2, 32, 32, 31); gr.addColorStop(0, 'rgba(255,248,225,.55)'); gr.addColorStop(1, 'rgba(255,248,225,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  { const ex = W / 2, ez = D;
    const sun = new THREE.SpotLight(DAY, 60, 26, 0.75, 0.6, 1.3); sun.position.set(ex, 6, ez + 6); sun.target.position.set(ex, 0, ez - 9); g.add(sun, sun.target);
    const pool0 = new THREE.Mesh(new THREE.PlaneGeometry(2 * C + 1.5, 9), glowMat(0.28)); pool0.rotation.x = -Math.PI / 2; pool0.position.set(ex, 0.04, ez - 4.4); pool0.rotation.z = Math.PI; pool0.userData.keep = true; g.add(pool0); // a mancha de luz no chão
    const outside = new THREE.Mesh(new THREE.PlaneGeometry(2 * C + 1, 3.2), glowMat(0.3)); outside.rotation.x = -Math.PI / 2; outside.position.set(ex, 0.03, ez + 1.4); outside.userData.keep = true; g.add(outside); // lá fora: claro
    for (let k = 0; k < 4; k++) { const ray = new THREE.Mesh(new THREE.PlaneGeometry(0.5 + k * 0.2, 6), glowMat(0.1 - k * 0.015)); ray.position.set(ex - C * 0.5 + k * C * 0.33, 2.4, ez - 1.6); ray.rotation.set(-0.95, (k - 1.5) * 0.12, 0); ray.userData.keep = true; ray.renderOrder = 2; g.add(ray); } // feixes inclinados
    for (const sx of [-1, 1]) { boulder(ex + sx * (C + 0.6), ez - 0.6, 1.1, rm2); boulder(ex + sx * (C + 1.4), ez - 1.8, 0.8, rmA); } // as pedras da boca
    dust.push({ x: ex, z: ez - 3.5 });
    light(ex, 1.6, ez - 2.2, DAY, 3.2, 16); }
  /* feixes de luz que entram pelas fendas do teto em vários pontos (Erling, 23/10): coluna de luz inclinada com poeira, mancha
     clara no chão, musgo mais verde em volta — pontos de luz no caminho, como clareiras dentro da caverna (na lava não: lá o céu é de pedra) */
  if (o.theme !== 'magma') for (const rm of P.rooms) {
    if (rm.kind === 'start' || hsh(rm.x * 1.3, rm.z * 0.7) > (rm.kind === 'boss' ? 1 : 0.62)) continue;
    const c = loc(rm), n = rm.kind === 'boss' ? 1 : 1 + (hsh(rm.z, rm.x) > 0.7 ? 1 : 0);
    for (let k = 0; k < n; k++) {
      const x = rm.kind === 'boss' ? c.x : c.x + (hsh(k + rm.x, rm.z) - 0.5) * rm.w * C * 0.5, z = rm.kind === 'boss' ? c.z : c.z + (hsh(rm.z, k + rm.x) - 0.5) * rm.d * C * 0.5;
      const tilt = 0.18 + hsh(x, z) * 0.12, Hh = 10, wTop = rm.kind === 'boss' ? 2.4 : 1.3, wBot = wTop * 1.7;
      for (let q = 0; q < 3; q++) { const geo = new THREE.PlaneGeometry(1, Hh, 1, 1), pa = geo.getAttribute('position');
        for (let i2 = 0; i2 < pa.count; i2++) { const yy = pa.getY(i2); pa.setX(i2, pa.getX(i2) * (yy > 0 ? wTop : wBot)); }
        const ray = new THREE.Mesh(geo, glowMat(rm.kind === 'boss' ? 0.16 : 0.12));
        ray.position.set(x + Math.sin(tilt) * Hh * 0.5, Hh / 2, z - Math.sin(tilt) * Hh * 0.25); ray.rotation.set(-tilt * 0.5, q * Math.PI / 3, tilt); ray.userData.keep = true; ray.renderOrder = 2; g.add(ray); }
      const spot = new THREE.Mesh(new THREE.PlaneGeometry(wBot * 2.6, wBot * 2.6), new THREE.MeshBasicMaterial({ map: radial, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: DAY, fog: false }));
      spot.rotation.x = -Math.PI / 2; spot.position.set(x, 0.05, z); spot.userData.keep = true; g.add(spot);
      dust.push({ x, z }); light(x, 2.6, z, DAY, rm.kind === 'boss' ? 3.4 : 2.4, 12);
      if (o.theme === 'mata' || o.theme === 'toca') for (let f = 0; f < 6; f++) { const a = f / 6 * 6.283 + hsh(f, x), rr2 = 0.8 + hsh(x, f) * 1.4; const tuft = put(new THREE.ConeGeometry(0.06, 0.35, 4), M(0x6ab04a), x + Math.cos(a) * rr2, 0.17, z + Math.sin(a) * rr2); tuft.rotation.z = (hsh(f, z) - 0.5) * 0.6; } // capim que cresce na luz
    } }
  /* o salão do chefe: anel de luzes e um centro marcado */
  const B = loc(P.boss), bw = (P.boss.w * C) / 2 - 1.5, bd = (P.boss.d * C) / 2 - 1.5;
  for (let i = 0; i < 6; i++) { const a = (i / 6) * 6.283; const x = B.x + Math.cos(a) * bw, z = B.z + Math.sin(a) * bd; if (o.theme === 'gelo' || o.theme === 'mina') crystal(x, z, o.theme === 'gelo' ? 0x9ae8ff : 0xffd27a, 1.4); else if (o.theme === 'magma') pool2(x, z, 0xff5a10, 1.2, true); else if (o.theme === 'mata') mush(x, z, 0xc89aff); else torch(x, z); }
  if (o.theme === 'toca') nest(B.x, B.z - bd * 0.5, 2.2);
  { const ring = put(new THREE.RingGeometry(3.4, 3.8, 40), new THREE.MeshBasicMaterial({ color: th.light, transparent: true, opacity: 0.25, depthWrite: false }), B.x, 0.03, B.z); ring.rotation.x = -Math.PI / 2; ring.userData.keep = true; }
  /* portão antes do chefe: raízes, grades ou gelo, conforme o tema; abre quando o grupo cumpre a contagem */
  let gate: DungeonFloor['gate'] = null;
  { const gx = (P.boss.x + ox) * C, gz = (P.boss.z - Math.floor(P.boss.d / 2) + P.boss.d + oz) * C + 0.2; // logo abaixo do salão, no corredor que sobe
    const gm = o.theme === 'gelo' ? new THREE.MeshToonMaterial({ color: 0xbfe8ff, gradientMap: ramp, transparent: true, opacity: 0.75 }) : o.theme === 'mina' || o.theme === 'cripta' ? std(0x2a2a30) : o.theme === 'magma' ? std(0x1a1010) : std(0x4a3020);
    const gg = new THREE.Group(); gg.position.set(gx, 0, gz); g.add(gg);
    for (let i = 0; i < 7; i++) { const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 3.2, 6), gm); bar.position.set(-C + 0.4 + i * (2 * C - 0.8) / 6, 1.6, (r() - 0.5) * 0.3); bar.rotation.z = o.theme === 'toca' || o.theme === 'mata' ? (r() - 0.5) * 0.4 : 0; bar.userData.dyn = true; gg.add(bar); }
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(2 * C, 3), new THREE.MeshBasicMaterial({ color: 0xff3a2a, transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide })); glow.position.y = 1.5; glow.userData.dyn = true; gg.add(glow);
    const gcells = [K(P.boss.x, P.boss.z - Math.floor(P.boss.d / 2) + P.boss.d), K(P.boss.x - 1, P.boss.z - Math.floor(P.boss.d / 2) + P.boss.d)];
    const blocked = new Set(gcells);
    gate = { x: gx, z: gz + 1.2, opened: false, open() { if (this.opened) return; this.opened = true; blocked.clear(); let t = 0; const tick = () => { t += 0.025; gg.position.y = -3.4 * Math.min(1, t); (glow.material as THREE.MeshBasicMaterial).opacity = 0.18 * (1 - t); if (t < 1) requestAnimationFrame(tick); else gg.visible = false; }; tick(); } };
    (gate as unknown as { blocked: Set<string> }).blocked = blocked;
  }
  const gateBlocked = (gate as unknown as { blocked: Set<string> }).blocked;
  /* baús nas salas laterais */
  const chests: { x: number; z: number }[] = [];
  for (const rm of P.rooms) if (rm.kind === 'side') { const c = loc(rm); chests.push({ x: c.x, z: c.z - 0.5 }); }

  const ok = (x: number, z: number) => { const cx = Math.floor(x / C), cz = Math.floor(z / C); return isW(cx, cz) && !gateBlocked.has(K(cx - ox, cz - oz)); };
  const free = (x: number, z: number) => {
    if (z >= D - 0.1) return false;
    const m = 0.32; if (!ok(x - m, z - m) || !ok(x + m, z - m) || !ok(x - m, z + m) || !ok(x + m, z + m)) return false;
    for (const [cx, cz, rad] of cols) if (Math.abs(x - cx) < rad && Math.abs(z - cz) < rad && Math.hypot(x - cx, z - cz) < rad) return false;
    return true;
  };
  const lights: { l: THREE.PointLight; base: number; ph: number }[] = []; let lastHx = -1e9, lastHz = -1e9;
  const flicker = (t: number, hx = W / 2, hz = D / 2) => {
    if (Math.hypot(hx - lastHx, hz - lastHz) > 3) { lastHx = hx; lastHz = hz; const near = [...fixtures].sort((a, b) => Math.hypot(a.x - hx, a.z - hz) - Math.hypot(b.x - hx, b.z - hz)).slice(0, pool.length); lights.length = 0;
      pool.forEach((l, k) => { const f = near[k]; if (!f) { l.intensity = 0; return; } l.position.set(f.x, f.y, f.z); l.color.setHex(f.c); l.distance = f.dist; lights.push({ l, base: f.i, ph: f.ph }); }); }
    for (const l of lights) l.l.intensity = l.base * (0.88 + 0.12 * Math.sin(t * 8 + l.ph) + 0.05 * Math.sin(t * 21 + l.ph * 2));
    if (!motes && dust.length) { const n = 45 * dust.length, pa = new Float32Array(n * 3); for (let k = 0; k < n; k++) { const dc = dust[k % dust.length]; pa[k * 3] = dc.x + (Math.random() - 0.5) * 3.5; pa[k * 3 + 1] = Math.random() * 3.5; pa[k * 3 + 2] = dc.z + (Math.random() - 0.5) * 3.5; }
      const pg2 = new THREE.BufferGeometry(); pg2.setAttribute('position', new THREE.BufferAttribute(pa, 3)); motes = new THREE.Points(pg2, new THREE.PointsMaterial({ color: DAY, size: 0.06, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending })); motes.userData.keep = true; g.add(motes); }
    if (motes) { const pa = motes.geometry.getAttribute('position') as THREE.BufferAttribute; for (let k = 0; k < pa.count; k++) { let y = pa.getY(k) + 0.004 + Math.sin(t + k) * 0.002; if (y > 3.6) y = 0.1; pa.setY(k, y); pa.setX(k, pa.getX(k) + Math.sin(t * 0.7 + k * 1.3) * 0.003); } pa.needsUpdate = true; }
    for (const b of bats) { const a2 = t * b.sp * 0.6 + b.ph, wob = Math.sin(t * 1.7 + b.ph) * 0.6; b.m.position.set(b.cx + Math.cos(a2) * b.r, b.y + Math.sin(t * 2.3 + b.ph) * 0.25, b.cz + Math.sin(a2) * b.r * 0.8 + wob); b.m.rotation.y = a2 + (b.sp > 0 ? Math.PI : 0); const f = Math.sin(t * 22 + b.ph) * 0.9; b.wl.rotation.z = f; b.wr.rotation.z = -f; }
  };
  mergeStatic(g, ramp);
  const rooms = P.rooms.map((rm) => { const c = loc(rm); return { ...rm, x: c.x, z: c.z, w: rm.w * C, d: rm.d * C }; });
  return { group: g, W, D, colliders: cols, free, flicker, exitZ: D + 0.9, rooms, boss: B, chests, gate, entry: { x: W / 2, z: D - 1.6 }, theme: o.theme };
}
