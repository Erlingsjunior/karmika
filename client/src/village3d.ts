/* Os marcos dos caminhos (cada vila de mestre tem o seu lugar de verdade) e as peças de cultura das vilas:
   paliçada nórdica/tribal, totem do Uivo, pedra-runa. Origem no canto do terreno; a frente olha para +z. */
import * as THREE from 'three';
import { std, texBox, stoneTex, shingleTex, woodTex, plankTex } from './toon3d';
import type { Built } from './city3d';
import { fine } from './dual3d';

const MC = new Map<string, THREE.Material>();
const mat = <M extends THREE.Material>(k: string, mk: () => M): M => { let m = MC.get(k) as M | undefined; if (!m) { m = mk(); MC.set(k, m); } return m; };
const stone = (c: number) => mat('s' + c, () => std(0xffffff, { map: stoneTex(c) }));
const slate = (c: number) => mat('r' + c, () => std(0xffffff, { map: shingleTex(c) }));
const wood = (c: number) => mat('w' + c, () => std(0xffffff, { map: woodTex(c) }));
const plank = (c: number) => mat('p' + c, () => std(0xffffff, { map: plankTex(c) }));
const flat = (c: number) => mat('f' + c, () => std(c));
const glow = (c: number) => mat('g' + c, () => new THREE.MeshBasicMaterial({ color: c, toneMapped: false }));
const dark = () => mat('dk', () => new THREE.MeshBasicMaterial({ color: 0x0c0a10 }));
const cloth = (c: number) => mat('c' + c, () => std(c, { side: THREE.DoubleSide }));

function kit() {
  const g = new THREE.Group(); const out: Built = { group: g, glows: [], smoke: [], torches: [] };
  const add = (geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, ry = 0, sh = true) => { const b = new THREE.Mesh(geo, m); b.position.set(x, y, z); b.rotation.y = ry; if (sh) { b.castShadow = true; b.receiveShadow = true; } g.add(b); return b; };
  const box = (w: number, h: number, d: number, x: number, y: number, z: number, m: THREE.Material, ry = 0) => add(texBox(w, h, d, 2), m, x, y + h / 2, z, ry);
  const cyl = (rt: number, rb: number, h: number, x: number, y: number, z: number, m: THREE.Material, seg = 12) => add(new THREE.CylinderGeometry(rt, rb, h, seg), m, x, y + h / 2, z);
  const cone = (r: number, h: number, x: number, y: number, z: number, m: THREE.Material, seg = 4, ry = Math.PI / 4) => add(new THREE.ConeGeometry(r, h, seg), m, x, y + h / 2, z, ry);
  const plane = (w: number, h: number, x: number, y: number, z: number, m: THREE.Material, ry = 0) => add(new THREE.PlaneGeometry(w, h), m, x, y, z, ry, false);
  const torch = (x: number, y: number, z: number) => { add(new THREE.CylinderGeometry(0.06, 0.08, 0.8, 5), wood(0x3a2a1c), x, y + 0.4, z); add(new THREE.CylinderGeometry(0.18, 0.1, 0.2, 6), flat(0x2a2a30), x, y + 0.85, z); const f = add(new THREE.ConeGeometry(0.15, 0.45, 6), new THREE.MeshBasicMaterial({ color: 0xffb040 }), x, y + 1.15, z, 0, false); f.userData.dyn = true; out.torches.push({ pos: new THREE.Vector3(x, y + 1.2, z), flame: f }); };
  const brazier = (x: number, y: number, z: number, col = 0xff8a30) => { add(new THREE.CylinderGeometry(0.5, 0.3, 0.6, 8), flat(0x2a2a30), x, y + 0.9, z); add(new THREE.CylinderGeometry(0.08, 0.12, 0.7, 5), flat(0x2a2a30), x, y + 0.35, z); const f = add(new THREE.ConeGeometry(0.4, 0.9, 7), new THREE.MeshBasicMaterial({ color: col }), x, y + 1.6, z, 0, false); f.userData.dyn = true; out.torches.push({ pos: new THREE.Vector3(x, y + 1.6, z), flame: f }); };
  const gable = (w: number, d: number, h: number, x: number, y: number, z: number, m: THREE.Material, wallM: THREE.Material, alongX = true, over = 0.6) => { // telhado de 2 águas com empenas; cumeeira ao longo de x
    const span = alongX ? d : w, len = alongX ? w : d, a = Math.atan2(h, span / 2), L = (span / 2 + over) / Math.cos(a);
    for (const s of [-1, 1]) { const piv = new THREE.Group(); piv.position.set(x, y + h, z); if (alongX) piv.rotation.x = s * a; else piv.rotation.z = -s * a; const sl = new THREE.Mesh(texBox(alongX ? len + over * 2 : L, 0.22, alongX ? L : len + over * 2, 2), m); if (alongX) sl.position.z = s * L / 2; else sl.position.x = s * L / 2; sl.castShadow = true; piv.add(sl); g.add(piv); }
    for (const s of [-1, 1]) { const tri = new THREE.Shape(); tri.moveTo(-span / 2, 0); tri.lineTo(span / 2, 0); tri.lineTo(0, h); const gm = new THREE.Mesh(new THREE.ShapeGeometry(tri), wallM); gm.position.set(x + (alongX ? s * len / 2 : 0), y, z + (alongX ? 0 : s * len / 2)); gm.rotation.y = alongX ? s * Math.PI / 2 : s > 0 ? 0 : Math.PI; g.add(gm); } };
  const arch = (W: number, H: number, d: number, w: number, spring: number, m: THREE.Material) => { const s = new THREE.Shape(); s.moveTo(-W / 2, 0); s.lineTo(W / 2, 0); s.lineTo(W / 2, H); s.lineTo(-W / 2, H); s.lineTo(-W / 2, 0); const hole = new THREE.Path(); hole.moveTo(-w / 2, 0); hole.lineTo(-w / 2, spring); hole.absarc(0, spring, w / 2, Math.PI, 0, true); hole.lineTo(w / 2, 0); hole.lineTo(-w / 2, 0); s.holes.push(hole); const geo = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false, curveSegments: 10 }); geo.translate(0, 0, -d / 2); const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 2, uv.getY(i) / 2); const mm = new THREE.Mesh(geo, m); mm.castShadow = mm.receiveShadow = true; g.add(mm); return mm; };
  const banner = (x: number, y: number, z: number, ry: number, c: number, w = 1.2, h = 3, emb = 0xd8b04a) => { plane(w, h, x, y - h / 2, z, cloth(c), ry); const e = plane(w * 0.4, w * 0.4, x + Math.sin(ry) * 0.01, y - h * 0.38, z + Math.cos(ry) * 0.01, flat(emb), ry); e.rotation.z = Math.PI / 4; };
  return { g, out, add, box, cyl, cone, plane, torch, brazier, gable, arch, banner };
}

/** 1 Fortaleza de Odin · 2 Abadia da Aurora · 3 Bastião de Prata · 4 Pináculo de Marfim · 5 Castelo da Colina Vampírica · 6 Vale da Desgraça · 7 Grande Toca do Uivo */
export const LANDMARKS: Record<number, { name: string; w: number; h: number }> = {
  1: { name: 'Fortaleza de Odin', w: 14, h: 10 }, 2: { name: 'Abadia da Aurora', w: 12, h: 11 }, 3: { name: 'Bastião de Prata', w: 12, h: 12 },
  4: { name: 'Pináculo de Marfim', w: 9, h: 9 }, 5: { name: 'Castelo da Colina Vampírica', w: 13, h: 12 }, 6: { name: 'Vale da Desgraça', w: 12, h: 12 }, 7: { name: 'Grande Toca do Uivo', w: 11, h: 11 },
};

export function buildLandmark(id: number, Wm: number, Dm: number): Built {
  const K = kit(), cx = Wm / 2, cz = Dm / 2, front = Dm;
  if (id === 1) { // FORTALEZA DE ODIN: grande salão viking num embasamento de pedra, telhado de turfa, cabeças de dragão, torres de madeira e a pedra de Odin
    const st = stone(0x6a6460), lg = wood(0x4a3220), turf = slate(0x5a6a34), hz = cz - 1, hw = Wm - 6, hd = Dm - 7;
    K.box(Wm - 1, 1.2, Dm - 1.5, cx, 0, cz - 0.4, st);
    for (let k = 0; k < 4; k++) K.box(6 - k * 0.6, 0.3, 0.8, cx, 1.2 - (k + 1) * 0.3, Dm - 1.6 + k * 0.8, st);
    K.box(hw, 3.6, hd, cx, 1.2, hz, lg);
    for (let i = 0; i < 8; i++) K.add(new THREE.CylinderGeometry(0.2, 0.2, hw + 0.4, 6).rotateZ(Math.PI / 2), lg, cx, 1.4 + i * 0.45, hz + hd / 2 + 0.05);
    K.gable(hw + 0.6, hd, 6.4, cx, 4.8, hz, turf, lg, true, 1.4);
    for (const s of [-1, 1]) { const x = cx + s * (hw / 2 + 1.0); for (const t of [-1, 1]) { const b = K.add(new THREE.BoxGeometry(0.28, 3.0, 0.28), lg, x, 4.8 + 6.4 + 0.6, hz + t * 0.45); b.rotation.x = t * 0.55; }
      const head = K.add(new THREE.ConeGeometry(0.4, 1.4, 4), wood(0x6a4a2a), x + s * 0.5, 4.8 + 6.4 + 2.0, hz); head.rotation.z = -s * 1.2;
      for (const t of [-1, 1]) K.add(new THREE.ConeGeometry(0.12, 0.6, 4), flat(0xe8dcc0), x + s * 0.7, 4.8 + 6.4 + 2.4, hz + t * 0.18).rotation.z = -s * 0.4; }
    // portal: postes entalhados, escudos, porta dupla
    for (const s of [-1, 1]) { K.cyl(0.32, 0.36, 5.2, cx + s * 1.8, 1.2, hz + hd / 2 + 0.6, lg, 8); K.cone(0.42, 1.1, cx + s * 1.8, 6.4, hz + hd / 2 + 0.6, wood(0x8a6a3a), 6, 0); }
    K.box(3.0, 0.4, 1.6, cx, 5.6, hz + hd / 2 + 0.4, lg); K.plane(2.6, 3.4, cx, 1.2 + 1.7, hz + hd / 2 + 0.07, plank(0x4a2e1a));
    for (let k = 0; k < 6; k++) { const x = cx - hw / 2 + 1.2 + k * ((hw - 2.4) / 5); if (Math.abs(x - cx) < 2.6) continue; const sh = K.add(new THREE.CylinderGeometry(0.62, 0.62, 0.1, 12).rotateX(Math.PI / 2), flat([0x8a2a22, 0x2a4a7a, 0xd8b04a][k % 3]), x, 3.6, hz + hd / 2 + 0.12, 0, false); void sh; K.add(new THREE.CylinderGeometry(0.16, 0.16, 0.12, 8).rotateX(Math.PI / 2), flat(0x8a8a90), x, 3.6, hz + hd / 2 + 0.2, 0, false); }
    K.out.glows.push({ pos: new THREE.Vector3(cx, 3, hz + hd / 2 + 1.2), color: 0xffa050, base: 34 }); K.out.smoke.push(new THREE.Vector3(cx - 3, 4.8 + 6.6, hz), new THREE.Vector3(cx + 3, 4.8 + 6.6, hz));
    // torres de vigia de madeira
    for (const s of [-1, 1]) { const tx = cx + s * (Wm / 2 - 1.6), tz = front - 2.6; for (const ox of [-1, 1]) for (const oz of [-1, 1]) K.cyl(0.18, 0.2, 7, tx + ox * 0.9, 0, tz + oz * 0.9, lg, 6); K.box(2.6, 0.25, 2.6, tx, 7, tz, plank(0x5a3a22)); for (const [ax, az] of [[0, 1.2], [0, -1.2], [1.2, 0], [-1.2, 0]]) K.box(ax ? 0.12 : 2.6, 0.9, az ? 0.12 : 2.6, tx + ax, 7.2, tz + az, plank(0x5a3a22)); K.cone(1.9, 2.4, tx, 8.1, tz, slate(0x4a3a2a)); K.banner(tx, 7, tz + 1.32, 0, 0x2a2a2a, 0.9, 2.2, 0xe8e8e8); K.brazier(tx, 7.25, tz - 0.6); }
    // pedra de Odin (com os corvos)
    { const rx = cx - 4.5, rz = front - 1.2; const ms = K.add(new THREE.BoxGeometry(1.0, 3.4, 0.5), stone(0x8a8a90), rx, 1.7, rz); ms.rotation.y = 0.3; K.plane(0.6, 2.4, rx + 0.08, 1.9, rz + 0.27, glow(0x6ab4ff), 0.3);
      for (const [x, y, z] of [[rx - 0.2, 3.55, rz], [rx + 0.3, 3.5, rz + 0.1]]) { const b = K.add(new THREE.ConeGeometry(0.16, 0.5, 4), flat(0x111114), x, y, z); b.rotation.z = Math.PI / 2; } }
    K.brazier(cx - 3.4, 1.2, hz + hd / 2 + 1.6); K.brazier(cx + 3.4, 1.2, hz + hd / 2 + 1.6);
  } else if (id === 2) { // ABADIA DA AURORA: pedra clara, telhados de cobre-dourado, campanário com o sol, claustro de arcos
    const st = stone(0xd8d0bc), gd = slate(0xb08a3a), hz = cz - 1.2, hw = Wm - 8, hd = Dm - 5;
    K.box(Wm - 1, 0.6, Dm - 1, cx, 0, cz, stone(0xa8a090));
    K.box(hw, 8, hd, cx - 1.5, 0.6, hz, st); K.gable(hw, hd, 4.2, cx - 1.5, 8.6, hz, gd, st, false, 0.5);
    for (let k = 0; k < 4; k++) { K.plane(0.9, 3.0, cx - 1.5 - hw / 2 - 0.02, 4.4, hz - hd / 2 + 2 + k * ((hd - 4) / 3), glow(0xffd070), -Math.PI / 2); K.plane(0.9, 3.0, cx - 1.5 + hw / 2 + 0.02, 4.4, hz - hd / 2 + 2 + k * ((hd - 4) / 3), glow(0xffd070), Math.PI / 2); }
    { const rw = K.add(new THREE.CircleGeometry(1.3, 20), glow(0xffd070), cx - 1.5, 6.6, hz + hd / 2 + 0.03, 0, false); void rw; K.add(new THREE.TorusGeometry(1.35, 0.14, 6, 20), flat(0xd8b04a), cx - 1.5, 6.6, hz + hd / 2 + 0.06, 0, false);
      const a = K.arch(3.4, 4.2, 0.6, 2.2, 2.6, st); a.position.set(cx - 1.5, 0.6, hz + hd / 2 + 0.3); K.plane(2.2, 3.6, cx - 1.5, 0.6 + 1.8, hz + hd / 2 + 0.02, plank(0x6a4a2a)); }
    { const tx = cx + hw / 2 + 0.6, tz = hz + hd / 2 - 2, S = 4.4; K.box(S, 16, S, tx, 0.6, tz, st); K.box(S + 0.4, 0.4, S + 0.4, tx, 16.6, tz, stone(0xa8a090));
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) K.box(0.5, 2.6, 0.5, tx + sx * (S / 2 - 0.25), 17, tz + sz * (S / 2 - 0.25), st);
      K.add(new THREE.SphereGeometry(0.6, 10, 8), flat(0xc8a040), tx, 18.2, tz); K.cone(S * 0.72, 5.5, tx, 19.6, tz, gd);
      const sun = K.add(new THREE.CircleGeometry(1.0, 16), glow(0xffe08a), tx, 13.2, tz + S / 2 + 0.03, 0, false); void sun; for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2, ray = K.add(new THREE.PlaneGeometry(0.16, 0.7), glow(0xffe08a), tx + Math.cos(a) * 1.4, 13.2 + Math.sin(a) * 1.4, tz + S / 2 + 0.03, 0, false); ray.rotation.z = a - Math.PI / 2; }
      K.out.glows.push({ pos: new THREE.Vector3(tx, 13, tz + S / 2 + 1), color: 0xffd070, base: 34 }); }
    // claustro: fileira de arcos à frente, à esquerda
    for (let k = 0; k < 4; k++) { const a = K.arch(2.2, 3.2, 0.5, 1.5, 1.8, st); a.position.set(1.6 + k * 2.2, 0.6, front - 1.0); } K.box(8.8, 0.3, 0.6, 1.6 + 3.3, 3.8, front - 1.0, stone(0xa8a090));
    K.torch(cx - 4, 0.6, hz + hd / 2 + 1); K.torch(cx + 1, 0.6, hz + hd / 2 + 1);
    K.out.glows.push({ pos: new THREE.Vector3(cx - 1.5, 4, hz + hd / 2 + 1.5), color: 0xffd070, base: 40 });
  } else if (id === 3) { // BASTIÃO DE PRATA: forte estrelado, muralha baixa grossa, torre central com a estaca de prata, besta-balista nas pontas
    const st = stone(0x8a8e94), dk = stone(0x5a5e64), sv = flat(0xd8dce4);
    const R = Math.min(Wm, Dm) / 2 - 0.6;
    for (let k = 0; k < 8; k++) { const a0 = k / 8 * Math.PI * 2, a1 = (k + 1) / 8 * Math.PI * 2, r0 = k % 2 ? R * 0.78 : R, r1 = (k + 1) % 2 ? R * 0.78 : R;
      const x0 = cx + Math.cos(a0) * r0, z0 = cz + Math.sin(a0) * r0, x1 = cx + Math.cos(a1) * r1, z1 = cz + Math.sin(a1) * r1, L = Math.hypot(x1 - x0, z1 - z0);
      if (k === 1) continue; // portão ao sul (+z)
      const w = K.add(texBox(L, 4.2, 1.6, 2), st, (x0 + x1) / 2, 2.1, (z0 + z1) / 2, -Math.atan2(z1 - z0, x1 - x0)); void w;
      for (let i = 0; i < Math.floor(L / 0.9); i += 2) { const t = (i + 0.5) / Math.floor(L / 0.9); K.add(new THREE.BoxGeometry(0.5, 0.7, 0.5), st, x0 + (x1 - x0) * t, 4.55, z0 + (z1 - z0) * t); }
      if (!(k % 2)) { K.cyl(1.0, 1.2, 5.2, x0, 0, z0, dk, 8); K.cone(1.1, 1.6, x0, 5.2, z0, slate(0x4a4e58), 8, 0); } }
    { const gx = cx + Math.cos(Math.PI * 0.375) * R * 0.9, gz = cz + Math.sin(Math.PI * 0.375) * R * 0.9; K.brazier(gx - 1.5, 0, gz); K.brazier(gx + 1.5, 0, gz); }
    K.cyl(2.4, 2.8, 14, cx, 0, cz, st, 10); K.cyl(2.9, 2.5, 0.8, cx, 14, cz, dk, 10);
    for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; K.add(new THREE.BoxGeometry(0.6, 0.8, 0.4), st, cx + Math.cos(a) * 2.7, 15.2, cz + Math.sin(a) * 2.7, -a); }
    K.cyl(0.18, 0.04, 6, cx, 15, cz, sv, 6); K.add(new THREE.BoxGeometry(2.2, 0.2, 0.2), sv, cx, 19.2, cz);
    for (let f = 0; f < 3; f++) K.plane(0.5, 1.3, cx, 3.5 + f * 3.6, cz + 2.62, glow(0xd8e8ff));
    K.banner(cx, 13.6, cz + 2.65, 0, 0x2a2a34, 1.4, 4, 0xd8dce4);
    K.out.glows.push({ pos: new THREE.Vector3(cx, 19, cz), color: 0xc8d8ff, base: 30 });
  } else if (id === 4) { // PINÁCULO DE MARFIM: torre esguia de marfim com anéis dourados, varandas, cristal aceso flutuando no topo
    const iv = stone(0xe8e0cc), gd = flat(0xd8c070), H = 30;
    K.cyl(4.0, 4.4, 1.2, cx, 0, cz, stone(0xb8b0a0), 16);
    for (let k = 0; k < 4; k++) K.box(4 - k * 0.5, 0.3, 0.9, cx, 1.2 - (k + 1) * 0.3, cz + 4.2 + k * 0.8, stone(0xb8b0a0));
    K.cyl(2.2, 3.2, H, cx, 1.2, cz, iv, 16);
    for (let k = 1; k <= 5; k++) { const y = 1.2 + k * H / 6, r = 3.2 - (k / 6) * 1.0; const rg = K.add(new THREE.TorusGeometry(r + 0.12, 0.16, 6, 24), gd, cx, y, cz, 0, false); rg.rotation.x = Math.PI / 2; for (let w = 0; w < 4; w++) { const a = w / 4 * Math.PI * 2 + k * 0.4; K.plane(0.45, 1.3, cx + Math.cos(a) * (r + 0.02), y - 1.6, cz + Math.sin(a) * (r + 0.02), glow(0x9ad8ff), Math.PI / 2 - a); } }
    for (const y of [12, 22]) { const b = K.add(new THREE.CylinderGeometry(3.6 - y * 0.03, 3.6 - y * 0.03, 0.25, 16), iv, cx, y, cz); void b; const rl = K.add(new THREE.TorusGeometry(3.5 - y * 0.03, 0.05, 4, 24), gd, cx, y + 0.6, cz, 0, false); rl.rotation.x = Math.PI / 2; }
    K.cyl(2.6, 2.2, 1.2, cx, H + 1.2, cz, iv, 16); K.cone(2.4, 6, cx, H + 2.4, cz, mat('ivr', () => std(0xd8d0bc)), 16, 0); K.cyl(0.08, 0.08, 3, cx, H + 8, cz, gd, 6);
    const cr = K.add(new THREE.OctahedronGeometry(1.1), glow(0x9ae0ff), cx, H + 12, cz, 0, false); cr.scale.y = 1.6; cr.userData.dyn = true;
    for (let k = 0; k < 3; k++) { const rg = K.add(new THREE.TorusGeometry(1.8 + k * 0.5, 0.05, 4, 32), glow(0x8ac8ff), cx, H + 12, cz, 0, false); rg.rotation.set(k * 0.7, 0, k * 0.5); }
    const a = K.arch(3.2, 4.0, 0.6, 1.8, 2.6, iv); a.position.set(cx, 1.2, cz + 3.0); K.plane(1.8, 3.4, cx, 1.2 + 1.7, cz + 2.75, glow(0x6aa8e0));
    K.out.glows.push({ pos: new THREE.Vector3(cx, H + 12, cz), color: 0x9ae0ff, base: 60 }, { pos: new THREE.Vector3(cx, 3, cz + 4), color: 0x9ad8ff, base: 30 });
    K.torch(cx - 2.6, 1.2, cz + 4.6); K.torch(cx + 2.6, 1.2, cz + 4.6);
  } else if (id === 5) { // CASTELO DA COLINA VAMPÍRICA: rocha escura, torres finas com flechas agudas, janelas vermelhas, portal com morcegos
    const st = stone(0x3a3438), dk = stone(0x24202a), rf = slate(0x2a1e24), red = glow(0xc8202a);
    K.box(Wm - 0.6, 2.0, Dm - 0.6, cx, 0, cz, stone(0x4a4448)); for (let k = 0; k < 6; k++) K.box(4.6 - k * 0.3, 0.33, 0.7, cx, 2.0 - (k + 1) * 0.33, Dm - 0.4 + k * 0.6, dk);
    const kw = Wm - 7, kd = Dm - 6, kz = cz - 0.8; K.box(kw, 11, kd, cx, 2.0, kz, st); K.gable(kw, kd, 6, cx, 13, kz, rf, st, true, 0.4);
    for (let f = 0; f < 2; f++) for (let k = 0; k < 4; k++) { const x = cx - kw / 2 + 1.2 + k * ((kw - 2.4) / 3); if (f === 0 && Math.abs(x - cx) < 1.5) continue; K.plane(0.6, 1.8, x, 5 + f * 4.4, kz + kd / 2 + 0.02, red); K.add(new THREE.ConeGeometry(0.36, 0.6, 4), dk, x, 6.2 + f * 4.4, kz + kd / 2 + 0.05).scale.z = 0.25; }
    for (const [sx, sz, h] of [[-1, 1, 20], [1, 1, 22], [-1, -1, 17], [1, -1, 18]] as [number, number, number][]) { const tx = cx + sx * (kw / 2 + 0.6), tz = kz + sz * (kd / 2 + 0.2); K.cyl(1.3, 1.5, h, tx, 2.0, tz, st, 10); K.cone(1.6, 6.5, tx, 2 + h, tz, rf, 10, 0); K.plane(0.4, 1.2, tx, 2 + h - 3, tz + 1.42, red); K.add(new THREE.ConeGeometry(0.05, 1.2, 4), flat(0x8a1a22), tx, 2 + h + 7.1, tz, 0, false); }
    { const a = K.arch(3.6, 6, 0.7, 2.4, 3.6, dk); a.position.set(cx, 2.0, kz + kd / 2 + 0.3); K.plane(2.4, 4.8, cx, 2 + 2.4, kz + kd / 2 + 0.03, dark());
      for (const s of [-1, 1]) { K.banner(cx + s * 2.6, 2 + 9.8, kz + kd / 2 + 0.06, 0, 0x6a0a14, 1.2, 4.2, 0x1a1a1a); K.brazier(cx + s * 2.4, 2.0, kz + kd / 2 + 1.6, 0xff3a2a); } }
    for (let k = 0; k < 6; k++) { const b = K.add(new THREE.ConeGeometry(0.22, 0.12, 3), flat(0x0e0c10), cx - 6 + k * 2.4, 14 + (k % 3) * 2.5, kz + kd / 2 + 2 + (k % 2) * 2, 0, false); b.rotation.x = Math.PI / 2; b.scale.x = 3; }
    K.out.glows.push({ pos: new THREE.Vector3(cx, 6, kz + kd / 2 + 1), color: 0xc82030, base: 36 });
  } else if (id === 6) { // VALE DA DESGRAÇA: círculo de obeliscos negros com runas violetas, altar do pacto com chama flutuante, arcos quebrados
    const bk = stone(0x241e2a), vi = glow(0xb06aff), R = Math.min(Wm, Dm) / 2 - 1.0;
    K.cyl(R + 0.6, R + 0.9, 0.3, cx, 0, cz, stone(0x3a3440), 20);
    const ring = K.add(new THREE.TorusGeometry(R - 0.6, 0.08, 4, 40), vi, cx, 0.34, cz, 0, false); ring.rotation.x = Math.PI / 2;
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2 + 0.2, x = cx + Math.cos(a) * R, z = cz + Math.sin(a) * R, h = 5 + (k % 3) * 1.4; const o = K.add(new THREE.CylinderGeometry(0.35, 0.6, h, 4), bk, x, 0.3 + h / 2, z, a); void o; K.add(new THREE.ConeGeometry(0.36, 0.9, 4), bk, x, 0.3 + h + 0.45, z, a); K.plane(0.25, h * 0.6, x - Math.cos(a) * 0.36, 0.3 + h * 0.5, z - Math.sin(a) * 0.36, vi, -a - Math.PI / 2); }
    K.box(3.0, 1.1, 1.8, cx, 0.3, cz, bk); K.box(3.4, 0.2, 2.2, cx, 1.4, cz, stone(0x3a3440));
    const fl = K.add(new THREE.OctahedronGeometry(0.6), vi, cx, 3.0, cz, 0, false); fl.scale.y = 1.8; fl.userData.dyn = true;
    for (const s of [-1, 1]) { const a = K.arch(3.4, 4.6, 0.6, 2.2, 2.4, bk); a.position.set(cx + s * 3.6, 0.3, Dm - 1.0); a.rotation.z = s * 0.06; }
    K.out.glows.push({ pos: new THREE.Vector3(cx, 3, cz), color: 0xa05aff, base: 50 });
  } else { // 7 GRANDE TOCA DO UIVO: grande cabana cônica de toras, crânio de lobo na entrada, totens em roda e fogueira
    const lg = wood(0x5a4030), th = slate(0x8a7440), R = Math.min(Wm, Dm) / 2 - 2.2;
    K.cyl(R, R * 1.05, 3.2, cx, 0, cz - 0.6, lg, 16); K.cone(R * 1.35, 8.5, cx, 3.2, cz - 0.6, th, 16, 0);
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2, s2 = K.add(new THREE.CylinderGeometry(0.1, 0.14, 3, 4), lg, cx + Math.cos(a) * 0.7, 12.6, cz - 0.6 + Math.sin(a) * 0.7); s2.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5); }
    { const ez = cz - 0.6 + R; K.box(2.4, 2.4, 1.4, cx, 0, ez, lg); K.plane(1.6, 2.0, cx, 1.0, ez + 0.71, dark()); K.add(new THREE.SphereGeometry(0.6, 8, 6), flat(0xe8dcc0), cx, 3.0, ez + 0.6).scale.set(1, 0.8, 1.3);
      K.add(new THREE.ConeGeometry(0.22, 0.6, 4), flat(0xe8dcc0), cx - 0.4, 3.5, ez + 0.5).rotation.z = 0.3; K.add(new THREE.ConeGeometry(0.22, 0.6, 4), flat(0xe8dcc0), cx + 0.4, 3.5, ez + 0.5).rotation.z = -0.3;
      for (const s of [-1, 1]) { K.add(new THREE.ConeGeometry(0.1, 1.4, 5), flat(0xe8dcc0), cx + s * 1.5, 2.8, ez + 0.6).rotation.z = s * 0.7; } }
    for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2 + 0.5, x = cx + Math.cos(a) * (R + 2.4), z = cz + Math.sin(a) * (R + 2.4); K.cyl(0.32, 0.38, 4.2, x, 0, z, lg, 8); for (let f = 0; f < 3; f++) K.add(new THREE.BoxGeometry(0.7, 0.5, 0.2), flat([0x8a2a22, 0xd8c890, 0x2a4a3a][f]), x + Math.cos(a) * 0.3, 1.2 + f * 1.1, z + Math.sin(a) * 0.3, -a + Math.PI / 2); K.add(new THREE.SphereGeometry(0.35, 7, 6), flat(0xe8dcc0), x, 4.5, z); }
    K.brazier(cx, 0, Dm - 1.0, 0xff7a2a);
    K.out.glows.push({ pos: new THREE.Vector3(cx, 2, Dm - 1), color: 0xff8a3a, base: 40 }); K.out.smoke.push(new THREE.Vector3(cx, 13, cz - 0.6));
  }
  return K.out;
}

/** um trecho (1 casa) de paliçada de estacas pontudas; ns = corre de norte a sul */
export function buildPalisade(ns: boolean, seed: number): Built {
  const K = kit(), lg = wood(0x5a4030), T2 = 2;
  for (let i = 0; i < 4; i++) { const h = 2.6 + ((seed * 7 + i * 3) % 5) * 0.12, a = -T2 / 2 + 0.25 + i * 0.5; const x = ns ? 1 : 1 + a, z = ns ? 1 + a : 1;
    K.cyl(0.22, 0.24, h, x, 0, z, lg, 6); K.cone(0.23, 0.5, x, h, z, lg, 6, 0); }
  K.add(new THREE.BoxGeometry(ns ? 0.12 : 2, 0.16, ns ? 2 : 0.12), wood(0x4a3220), 1, 1.6, 1);
  return K.out;
}

/** totem do Uivo / pedra-runa nórdica: v 0 totem de lobo, 1 pedra-runa azul, 2 obelisco do pacto */
export function buildTotem(v: number): Built {
  const K = kit(), c = 1;
  if (v === 0) { const lg = wood(0x5a4030); K.cyl(0.32, 0.38, 3.8, c, 0, c, lg, 8); for (let f = 0; f < 3; f++) K.add(new THREE.BoxGeometry(0.72, 0.5, 0.2), flat([0x8a2a22, 0xd8c890, 0x2a4a3a][f]), c, 0.9 + f * 1.0, c + 0.32); K.add(new THREE.SphereGeometry(0.34, 7, 6), flat(0xe8dcc0), c, 4.1, c); for (const s of [-1, 1]) K.add(new THREE.ConeGeometry(0.08, 0.5, 4), flat(0xe8dcc0), c + s * 0.25, 4.45, c).rotation.z = s * 0.5; }
  else if (v === 1) { const m = K.add(new THREE.BoxGeometry(0.8, 2.6, 0.4), stone(0x8a8a90), c, 1.3, c); m.rotation.y = 0.25; K.plane(0.45, 1.9, c + 0.05, 1.4, c + 0.22, glow(0x6ab4ff), 0.25); K.out.glows.push({ pos: new THREE.Vector3(c, 1.5, c + 0.6), color: 0x6ab4ff, base: 10 }); }
  else if (v === 3) { for (let k = 0; k < 5; k++) { const a = k * 1.3, h = 1.2 + (k % 3) * 0.7, cr = K.add(new THREE.OctahedronGeometry(0.32, 0), glow(k % 2 ? 0x9ae0ff : 0xd8f0ff), c + Math.cos(a) * 0.35 * (k ? 1 : 0), h * 0.55, c + Math.sin(a) * 0.35 * (k ? 1 : 0)); cr.scale.set(0.8, h * 1.3, 0.8); cr.rotation.z = k ? Math.cos(a) * 0.3 : 0; } K.out.glows.push({ pos: new THREE.Vector3(c, 1.4, c), color: 0x9ae0ff, base: 14 }); }
  else { K.add(new THREE.CylinderGeometry(0.3, 0.5, 3.6, 4), stone(0x241e2a), c, 1.8, c); K.add(new THREE.ConeGeometry(0.3, 0.7, 4), stone(0x241e2a), c, 3.95, c); K.plane(0.2, 2.2, c, 1.8, c + 0.36, glow(0xb06aff)); K.out.glows.push({ pos: new THREE.Vector3(c, 2, c + 0.6), color: 0xa05aff, base: 12 }); }
  return K.out;
}

/* ---------- 25/10: proteção das vilas (Erling: "uma entrada com pórtico de madeira bruta e o nome da cidade escrito; mesmo vilas pequenas têm
   muros menores, de meia altura, improvisados") — modelos montados em volta da origem e girados para o lado de fora da vila ---------- */
function spin(K: ReturnType<typeof kit>, ry: number): Built {
  const outer = new THREE.Group(); outer.position.set(1, 0, 1); outer.rotation.y = ry; outer.add(K.g);
  const c = Math.cos(ry), s = Math.sin(ry), rot = (v: THREE.Vector3) => { const x = v.x * c + v.z * s, z = -v.x * s + v.z * c; v.set(x + 1, v.y, z + 1); };
  for (const t of K.out.torches) rot(t.pos); for (const gl of K.out.glows) rot(gl.pos); for (const sm of K.out.smoke) rot(sm);
  return { group: outer, glows: K.out.glows, smoke: K.out.smoke, torches: K.out.torches };
}
const signTexCache = new Map<string, THREE.CanvasTexture>();
function nameBoard(name: string, cult: number) {
  let t = signTexCache.get(name + cult); if (t) return t;
  const c = document.createElement('canvas'); c.width = 512; c.height = 128; const g = c.getContext('2d')!;
  const base = cult === 3 ? '#cbbf9e' : cult === 2 ? '#6a5a4a' : cult === 4 ? '#3a3036' : '#7a5632';
  g.fillStyle = base; g.fillRect(0, 0, 512, 128);
  for (let i = 0; i < 4; i++) { g.fillStyle = `rgba(0,0,0,${0.12 + (i % 2) * 0.08})`; g.fillRect(0, i * 32, 512, 2); } // tábuas
  for (let i = 0; i < 70; i++) { g.strokeStyle = `rgba(30,18,8,${0.08 + Math.random() * 0.12})`; g.lineWidth = 1; g.beginPath(); const y = Math.random() * 128; g.moveTo(Math.random() * 512, y); g.lineTo(Math.random() * 512, y + (Math.random() - 0.5) * 4); g.stroke(); } // veio da madeira
  g.strokeStyle = 'rgba(20,12,6,.75)'; g.lineWidth = 6; g.strokeRect(3, 3, 506, 122);
  for (const [x, y] of [[16, 16], [496, 16], [16, 112], [496, 112]]) { g.fillStyle = '#2a2a30'; g.beginPath(); g.arc(x, y, 5, 0, 6.283); g.fill(); } // pregos
  const txt = name.toUpperCase(); let fs = 64; g.font = `bold ${fs}px Georgia, serif`; while (g.measureText(txt).width > 440 && fs > 26) { fs -= 2; g.font = `bold ${fs}px Georgia, serif`; }
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 7; g.strokeStyle = 'rgba(20,10,4,.9)'; g.strokeText(txt, 256, 68);
  g.fillStyle = cult === 3 ? '#2a4a3a' : '#f2d690'; g.fillText(txt, 256, 68); // letra pintada
  t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; signTexCache.set(name + cult, t); return t;
}
/** pórtico da vila: dois troncos, a viga, um telhadinho, a tábua com o nome pendurada em correntes, tochas e escoras. span = vão (m) */
export function buildVillageGate(name: string, cult: number, ry: number, span = 6): Built {
  const K = kit(), lw = cult === 3 ? 0xd8ccb0 : cult === 4 ? 0x3a3036 : 0x5a4030, logM = wood(lw), dk = wood(cult === 4 ? 0x2a2228 : 0x3a2a1c), stM = stone(cult === 2 ? 0x6a5e52 : 0x7a746a);
  const half = span / 2, H = 4.2;
  for (const sx of [-1, 1]) { const x = sx * half;
    K.box(0.95, 0.5, 0.95, x, 0, 0, stM); // base de pedra
    if (cult === 2) K.box(0.7, H, 0.7, x, 0.4, 0, stM); else K.cyl(0.26, 0.31, H, x, 0.4, 0, logM, 8); // tronco (anões: pilar de pedra)
    K.add(new THREE.CylinderGeometry(0.29, 0.29, 0.14, 8), dk, x, 1.6, 0); K.add(new THREE.CylinderGeometry(0.29, 0.29, 0.14, 8), dk, x, 3.1, 0); // amarras
    const br = K.add(new THREE.CylinderGeometry(0.1, 0.12, 1.7, 6), logM, x - sx * 0.55, H - 0.2, 0); br.rotation.z = sx * 0.78; // escora
    K.torch(x + sx * 0.05, 2.1, 0.42); }
  const beam = K.add(new THREE.CylinderGeometry(0.24, 0.24, span + 1.4, 8), logM, 0, H + 0.45, 0); beam.rotation.z = Math.PI / 2;
  const beam2 = K.add(new THREE.CylinderGeometry(0.15, 0.15, span - 0.2, 7), logM, 0, H - 0.35, 0); beam2.rotation.z = Math.PI / 2;
  for (const sx of [-1, 1]) { const cap = K.add(new THREE.CylinderGeometry(0.27, 0.24, 0.12, 8), dk, sx * (half + 0.7), H + 0.45, 0); cap.rotation.z = Math.PI / 2; }
  K.gable(span + 1.9, 1.3, 0.7, 0, H + 0.68, 0, slate(cult === 3 ? 0x3a7a5a : cult === 2 ? 0x4a423a : cult === 4 ? 0x2a2228 : 0x5a3a28), plank(lw), true, 0.25);
  /* a tábua com o nome, pendurada da viga de baixo, dos dois lados */
  const bw = Math.min(span - 0.6, 3.6), bh = bw * 0.25, by = H - 0.95, sign = std(0xffffff, { map: nameBoard(name, cult) });
  K.box(bw + 0.12, bh + 0.12, 0.12, 0, by - bh / 2 - 0.06, 0, dk);
  /* o nome tem que ser legível: as duas faces da tábua vão na camada fina (resolução cheia) e ficam fora da fusão estática */
  for (const [zz, ra] of [[0.07, 0], [-0.07, Math.PI]] as [number, number][]) { const sm = K.add(new THREE.PlaneGeometry(bw, bh), sign, 0, by, zz, ra, false); sm.userData.dyn = true; fine(sm); }
  for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) K.add(new THREE.TorusGeometry(0.05, 0.015, 4, 8), flat(0x2a2a30), sx * bw * 0.4, by + bh / 2 + 0.08 + k * 0.1, 0, k % 2 ? Math.PI / 2 : 0, false); // correntes
  /* um feixe de lanças e um escudo da guarda encostados num dos troncos */
  for (let k = 0; k < 3; k++) { const sp = K.add(new THREE.CylinderGeometry(0.03, 0.03, 2.4, 5), dk, -half - 0.55 + k * 0.08, 1.2, 0.5 + k * 0.05); sp.rotation.z = 0.12 - k * 0.06; K.add(new THREE.ConeGeometry(0.06, 0.25, 4), flat(0x9aa0aa), -half - 0.55 + k * 0.08 - 0.14 + k * 0.007, 2.45, 0.5 + k * 0.05); }
  const sh = K.add(new THREE.CylinderGeometry(0.45, 0.45, 0.08, 12), wood(0x7a3a2a), half + 0.55, 0.62, 0.45); sh.rotation.x = Math.PI / 2 - 0.25;
  return spin(K, ry);
}
/** muro baixo de 1 casa (2 m): pedra seca (anões, elfos, vapor e vale) ou cerca trançada de galhos (sombrios e pacto) */
export function buildLowWall(cult: number, ry: number, seed: number): Built {
  const K = kit(), r = (k: number) => ((Math.sin(seed * 12.9898 + k * 78.233) * 43758.5453) % 1 + 1) % 1;
  if (cult === 11 || cult === 12) { /* cercas de estrada: 11 = cerca de varas com mourões (perto das vilas grandes), 12 = cerca torta do ermo */
    const post = wood(cult === 11 ? 0x5a4030 : 0x4a3a28), rail = wood(cult === 11 ? 0x7a5a38 : 0x6a5030), jit = (k: number) => (r(k) - 0.5) * (cult === 12 ? 0.18 : 0.04);
    for (const x of [-1.4, 0, 1.4]) { const pp = K.add(new THREE.CylinderGeometry(0.08, 0.1, 1.15, 6), post, x, 0.55, 0); pp.rotation.z = jit(x * 5); pp.rotation.x = jit(x * 3 + 1); }
    for (const y of cult === 11 ? [0.45, 0.85] : [0.62]) { const rl = K.add(new THREE.CylinderGeometry(0.05, 0.055, 2.95, 5), rail, 0, y + jit(y * 9), 0); rl.rotation.z = Math.PI / 2 + jit(y * 11); }
    return spin(K, ry); }
  if (cult === 10) { /* muro médio de pedra lavrada da estrada real (perto da cidade grande) */
    const sm = stone(0x8a857e), cap = stone(0xa8a298);
    for (let row = 0; row < 4; row++) { let x = -1.46 + (row % 2) * 0.3; while (x < 1.44) { const w = Math.min(0.55 + r(x * 5 + row) * 0.15, 1.46 - x); if (w > 0.1) K.box(w - 0.03, 0.27, 0.6, x + w / 2, row * 0.28, 0, sm); x += w; } }
    K.box(2.98, 0.14, 0.72, 0, 1.12, 0, cap); return spin(K, ry); }
  if (cult === 4 || cult === 6) { const post = wood(0x3a2a1c), twig = wood(0x5a4a30);
    for (const x of [-1.4, -0.47, 0.47, 1.4]) K.cyl(0.07, 0.08, 1.05, x, 0, 0, post, 5);
    for (let k = 0; k < 5; k++) { const b = K.add(new THREE.CylinderGeometry(0.035, 0.035, 2.95, 4), twig, 0, 0.22 + k * 0.16, (k % 2 ? 0.05 : -0.05)); b.rotation.z = Math.PI / 2; }
  } else { const sc = cult === 3 ? 0xa8a090 : cult === 2 ? 0x6a5e52 : 0x8a8276, sm = stone(sc), cap = stone(cult === 3 ? 0xc0b8a8 : 0x9a9488);
    let x = -1.46; let row = 0; for (let y = 0; y < 0.7; y += 0.24, row++) { x = -1.46 + (row % 2) * 0.18; while (x < 1.44) { const w = 0.32 + r(x * 7 + y * 3) * 0.3, h = 0.2 + r(x + y) * 0.06; const ww = Math.min(w, 1.46 - x); if (ww > 0.08) { const b = K.box(ww, h, 0.5 + r(x * y + 1) * 0.08, x + ww / 2, y, (r(x * 3) - 0.5) * 0.06, sm); b.rotation.y = (r(x + 9) - 0.5) * 0.12; } x += w + 0.02; } }
    K.box(2.94, 0.12, 0.62, 0, 0.72, 0, cap); }
  return spin(K, ry);
}
