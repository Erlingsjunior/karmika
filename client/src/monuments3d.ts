/* Os monumentos dos caminhos, em tamanho de lenda (Erling, 23/10: "MONUMENTAIS, entenda MONUMENTAIS").
   1 Castelo da Colina Vampírica — no topo da montanha negra: muralha de pedra escura sobre o rochedo, seis torres finas
     com flechas altíssimas, o salão gótico com rosácea vermelha, a grande torre do Conde com o farol de sangue, passarelas
     no ar entre as torres, gárgulas, estandartes carmesim, morcegos.
   2 Pináculo de Marfim — na ilha do meio da lagoa: escadaria e colunata de marfim, a torre de 70 m afinando, varandas
     douradas, nervuras, arcos voadores, e no alto uma coroa de chifres de marfim segurando o cristal aceso com anéis de runas.
   Origem no canto do terreno; frente para +z. */
import * as THREE from 'three';
import { std, texBox, stoneTex, shingleTex } from './toon3d';
import type { Built } from './city3d';

const MC = new Map<string, THREE.Material>();
const mat = <M extends THREE.Material>(k: string, mk: () => M): M => { let m = MC.get(k) as M | undefined; if (!m) { m = mk(); MC.set(k, m); } return m; };
const stone = (c: number) => mat('s' + c, () => std(0xffffff, { map: stoneTex(c) }));
const slate = (c: number) => mat('r' + c, () => std(0xffffff, { map: shingleTex(c) }));
const flat = (c: number) => mat('f' + c, () => std(c));
const glow = (c: number) => mat('g' + c, () => new THREE.MeshBasicMaterial({ color: c, toneMapped: false }));
const glowA = (c: number, o: number) => mat('ga' + c + o, () => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, side: THREE.DoubleSide }));
const cloth = (c: number) => mat('c' + c, () => std(c, { side: THREE.DoubleSide }));
const dark = () => mat('dk', () => new THREE.MeshBasicMaterial({ color: 0x08060a }));

function kit() {
  const g = new THREE.Group(); const out: Built = { group: g, glows: [], smoke: [], torches: [] };
  const add = (geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, ry = 0, sh = true) => { const b = new THREE.Mesh(geo, m); b.position.set(x, y, z); b.rotation.y = ry; if (sh) { b.castShadow = true; b.receiveShadow = true; } g.add(b); return b; };
  const box = (w: number, h: number, d: number, x: number, y: number, z: number, m: THREE.Material, ry = 0) => add(texBox(w, h, d, 2), m, x, y + h / 2, z, ry);
  const cyl = (rt: number, rb: number, h: number, x: number, y: number, z: number, m: THREE.Material, seg = 12) => add(new THREE.CylinderGeometry(rt, rb, h, seg), m, x, y + h / 2, z);
  const cone = (r: number, h: number, x: number, y: number, z: number, m: THREE.Material, seg = 8, ry = 0) => add(new THREE.ConeGeometry(r, h, seg), m, x, y + h / 2, z, ry);
  const plane = (w: number, h: number, x: number, y: number, z: number, m: THREE.Material, ry = 0) => add(new THREE.PlaneGeometry(w, h), m, x, y, z, ry, false);
  const torch = (x: number, y: number, z: number, col = 0xff3a2a) => { add(new THREE.CylinderGeometry(0.4, 0.25, 0.5, 8), flat(0x1a1a20), x, y + 0.25, z); const f = add(new THREE.ConeGeometry(0.34, 0.9, 7), new THREE.MeshBasicMaterial({ color: col }), x, y + 0.9, z, 0, false); f.userData.dyn = true; out.torches.push({ pos: new THREE.Vector3(x, y + 1, z), flame: f }); };
  const arch = (W: number, H: number, d: number, w: number, spring: number, m: THREE.Material, pointed = false) => { const s = new THREE.Shape(); s.moveTo(-W / 2, 0); s.lineTo(W / 2, 0); s.lineTo(W / 2, H); s.lineTo(-W / 2, H); s.lineTo(-W / 2, 0); const hole = new THREE.Path(); hole.moveTo(-w / 2, 0); hole.lineTo(-w / 2, spring);
    if (pointed) { hole.quadraticCurveTo(-w / 2, spring + w * 0.55, 0, spring + w * 0.9); hole.quadraticCurveTo(w / 2, spring + w * 0.55, w / 2, spring); } else hole.absarc(0, spring, w / 2, Math.PI, 0, true);
    hole.lineTo(w / 2, 0); hole.lineTo(-w / 2, 0); s.holes.push(hole); const geo = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false, curveSegments: 10 }); geo.translate(0, 0, -d / 2); const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 2, uv.getY(i) / 2); const mm = new THREE.Mesh(geo, m); mm.castShadow = mm.receiveShadow = true; g.add(mm); return mm; };
  const banner = (x: number, y: number, z: number, ry: number, c: number, w: number, h: number, emb: number) => { plane(w, h, x, y - h / 2, z, cloth(c), ry); const e = plane(w * 0.4, w * 0.4, x + Math.sin(ry) * 0.02, y - h * 0.35, z + Math.cos(ry) * 0.02, flat(emb), ry); e.rotation.z = Math.PI / 4; };
  /** torre gótica fina: corpo redondo, cinta, janelas em seteira vermelhas, ameias pontudas e flecha altíssima */
  const spireTower = (x: number, z: number, r: number, h: number, sp: number, m: THREE.Material, roof: THREE.Material, win: THREE.Material) => {
    cyl(r, r * 1.12, h, x, 0, z, m, 12); cyl(r * 1.28, r * 1.05, 0.9, x, h, z, stone(0x241e24), 12);
    for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; add(new THREE.ConeGeometry(0.22, 1.1, 4), stone(0x241e24), x + Math.cos(a) * r * 1.2, h + 1.4, z + Math.sin(a) * r * 1.2); }
    cone(r * 1.05, sp, x, h + 0.9, z, roof, 12); add(new THREE.ConeGeometry(0.06, 2.6, 4), flat(0x7a1a22), x, h + 0.9 + sp + 1.2, z, 0, false);
    for (let f = 1; f < h / 4.2; f++) for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2 + f * 0.7 + 1.2; plane(0.36, 1.2, x + Math.cos(a) * (r + 0.02), f * 4.2, z + Math.sin(a) * (r + 0.02), win, Math.PI / 2 - a); }
  };
  return { g, out, add, box, cyl, cone, plane, torch, arch, banner, spireTower };
}

export function buildMonument(id: number, Wm: number, Dm: number): Built {
  const K = kit(), cx = Wm / 2, cz = Dm / 2;
  if (id === 1) { // CASTELO DA COLINA VAMPÍRICA
    const st = stone(0x3a3438), dk = stone(0x24202a), rf = slate(0x241a20), red = glow(0xd0202a), redS = glow(0xff3a2a);
    // o rochedo onde o castelo se crava (cai pelas bordas do platô)
    for (let k = 0; k < 22; k++) { const a = k / 22 * Math.PI * 2, r = Math.min(Wm, Dm) * 0.5 + 1.5 + (k % 3), h = 6 + (k % 4) * 3; const b = K.add(new THREE.DodecahedronGeometry(2.6 + (k % 3), 0), dk, cx + Math.cos(a) * r, -h * 0.45, cz + Math.sin(a) * r); b.scale.set(1.3, h / 3.5, 1.3); }
    K.box(Wm - 2, 2.0, Dm - 2, cx, 0, cz, stone(0x2e282e));
    // muralha externa (ameias em dente), com o portão ao sul
    const ring: [number, number][] = [[2, 3], [Wm - 2, 3], [Wm - 1.5, Dm - 4], [cx + 5, Dm - 1.5], [cx - 5, Dm - 1.5], [1.5, Dm - 4]];
    for (let i = 0; i < ring.length; i++) { const [ax, az] = ring[i], [bx, bz] = ring[(i + 1) % ring.length]; if (i === 3) continue; const L = Math.hypot(bx - ax, bz - az), ry = Math.atan2(bx - ax, bz - az);
      K.add(texBox(1.8, 9, L + 1.6, 2), st, (ax + bx) / 2, 2 + 4.5, (az + bz) / 2, ry);
      for (let k = 0; k < Math.floor(L / 1.2); k++) { const t = (k + 0.5) / Math.floor(L / 1.2); K.add(new THREE.ConeGeometry(0.4, 1.3, 4), dk, ax + (bx - ax) * t, 2 + 9 + 0.6, az + (bz - az) * t, ry); }
      for (let k = 1; k < Math.floor(L / 4); k++) { const t = k / Math.floor(L / 4), nx = Math.cos(ry), nz = -Math.sin(ry); K.plane(0.3, 1.1, ax + (bx - ax) * t + nx * 0.92, 6.4, az + (bz - az) * t + nz * 0.92, red, ry + Math.PI / 2); } }
    // seis torres finas com flechas
    for (const [i, [x, z]] of ring.entries()) K.spireTower(x, z, 1.7 + (i % 2) * 0.5, 22 + (i % 3) * 6, 12 + (i % 2) * 6, st, rf, red);
    // o portão: arco ogival fundo, grade, gárgulas e escadaria
    { const gz = Dm - 1.5; const a = K.arch(10, 14, 2.4, 4.2, 6.2, st, true); a.position.set(cx, 2, gz); K.plane(4.2, 9, cx, 2 + 4.5, gz - 1.1, dark());
      for (let k = -3; k <= 3; k++) K.add(new THREE.BoxGeometry(0.1, 3.6, 0.1), flat(0x1a1a20), cx + k * 0.55, 2 + 8.4, gz + 0.2, 0, false);
      for (const s of [-1, 1]) { K.spireTower(cx + s * 5.2, gz + 0.4, 1.4, 18, 9, st, rf, red); const gg = K.add(new THREE.ConeGeometry(0.6, 1.6, 4), dk, cx + s * 2.8, 2 + 14.4, gz + 1.0); gg.rotation.x = Math.PI / 2.4; K.banner(cx + s * 2.6, 2 + 13.5, gz + 1.25, 0, 0x6a0a14, 1.5, 6, 0x0e0a0e); K.torch(cx + s * 3.2, 2, gz + 2.6); }
      for (let k = 0; k < 7; k++) K.box(6.6 - k * 0.2, 0.3, 1.2, cx, 2 - (k + 1) * 0.3, gz + 1.8 + k * 1.1, dk); }
    // o salão gótico, alto, com rosácea vermelha e telhado agudo
    { const hw = 16, hd = 12, hz = cz + 0.5, hh = 18;
      K.box(hw, hh, hd, cx, 2, hz, st); { const tri = new THREE.Shape(); tri.moveTo(-hd / 2 - 0.4, 0); tri.lineTo(hd / 2 + 0.4, 0); tri.lineTo(0, 11); const ge = new THREE.ExtrudeGeometry(tri, { depth: hw + 0.6, bevelEnabled: false }); const r = new THREE.Mesh(ge, rf); r.rotation.y = Math.PI / 2; r.position.set(cx - hw / 2 - 0.3, 2 + hh, hz); r.castShadow = true; K.g.add(r); }
      for (let k = 0; k < 5; k++) for (const s of [-1, 1]) K.plane(0.9, 6, cx + s * (hw / 2 + 0.02), 2 + 9, hz - hd / 2 + 1.5 + k * ((hd - 3) / 4), red, s * Math.PI / 2);
      const rose = K.add(new THREE.CircleGeometry(2.4, 24), redS, cx, 2 + 12, hz + hd / 2 + 0.03, 0, false); void rose; K.add(new THREE.TorusGeometry(2.5, 0.25, 6, 24), dk, cx, 2 + 12, hz + hd / 2 + 0.08, 0, false);
      for (let k = 0; k < 8; k++) { const sp = K.add(new THREE.BoxGeometry(0.14, 4.8, 0.06), dk, cx, 2 + 12, hz + hd / 2 + 0.1, 0, false); sp.rotation.z = k / 8 * Math.PI; }
      for (const s of [-1, 1]) for (let k = 0; k < 3; k++) K.add(new THREE.ConeGeometry(0.35, 3.2, 4), dk, cx + s * (hw / 2), 2 + hh + 1.6, hz - hd / 2 + k * hd / 2, 0, false);
      K.out.glows.push({ pos: new THREE.Vector3(cx, 14, hz + hd / 2 + 2), color: 0xd02030, base: 50 }); }
    // a grande torre do Conde, atrás do salão, com o farol de sangue
    { const tx = cx, tz = 6.5; K.cyl(3.2, 3.8, 46, tx, 2, tz, st, 14); K.cyl(4.1, 3.4, 1.4, tx, 48, tz, dk, 14);
      for (let k = 0; k < 14; k++) { const a = k / 14 * Math.PI * 2; K.add(new THREE.ConeGeometry(0.4, 1.8, 4), dk, tx + Math.cos(a) * 3.9, 50.2, tz + Math.sin(a) * 3.9); }
      K.cone(3.4, 22, tx, 49.4, tz, rf, 14); K.add(new THREE.ConeGeometry(0.1, 4, 4), flat(0x8a1a22), tx, 49.4 + 22 + 2, tz, 0, false);
      for (let f = 1; f < 11; f++) for (let k = 0; k < 4; k++) { const a = k / 4 * Math.PI * 2 + f * 0.6; K.plane(0.5, 1.6, tx + Math.cos(a) * 3.25, 2 + f * 4.2, tz + Math.sin(a) * 3.25, red, Math.PI / 2 - a); }
      const bc = K.add(new THREE.SphereGeometry(1.1, 12, 10), glow(0xff2030), tx, 44.5, tz, 0, false); void bc; K.add(new THREE.SphereGeometry(3.4, 14, 10), glowA(0xff2030, 0.18), tx, 44.5, tz, 0, false);
      K.out.glows.push({ pos: new THREE.Vector3(tx, 44.5, tz), color: 0xff2030, base: 70 });
      // passarelas no ar até duas torres
      for (const [x2, z2] of [[ring[0][0], ring[0][1]], [ring[1][0], ring[1][1]]]) { const L = Math.hypot(x2 - tx, z2 - tz), ry = Math.atan2(x2 - tx, z2 - tz); K.add(texBox(1.4, 0.6, L, 2), dk, (tx + x2) / 2, 20, (tz + z2) / 2, ry); K.add(new THREE.BoxGeometry(0.12, 0.9, L), dk, (tx + x2) / 2 + Math.cos(ry) * 0.65, 20.7, (tz + z2) / 2 - Math.sin(ry) * 0.65, ry); } }
    // morcegos em volta da torre
    for (let k = 0; k < 14; k++) { const a = k * 0.9, r = 7 + (k % 4) * 3, b = K.add(new THREE.ConeGeometry(0.4, 0.2, 3), flat(0x0a080c), cx + Math.cos(a) * r, 26 + (k % 5) * 4, 6.5 + Math.sin(a) * r, 0, false); b.rotation.x = Math.PI / 2; b.scale.x = 3.2; }
  } else if (id === 3) { // FORTALEZA DE ODIN: o grande salão do Clã do Corvo e a estátua colossal do Pai de Todos com os dois corvos
    const dk = stone(0x4a4644), lg = mat('lg', () => std(0xffffff, { map: stoneTex(0x4a3220) })), turf = slate(0x5a6a34), snow = flat(0xe8eef4);
    K.box(Wm - 1, 1.2, Dm - 1, cx, 0, cz, dk);
    // o grande salão (comprido, telhado de turfa até quase o chão, cabeças de dragão nas duas pontas)
    { const hw = Wm - 4, hd = 10, hz = 5.5; K.box(hw, 5, hd, cx, 1.2, hz, lg);
      const a = Math.atan2(9, hd / 2), L = (hd / 2 + 1.6) / Math.cos(a); for (const sd of [-1, 1]) { const piv = new THREE.Group(); piv.position.set(cx, 1.2 + 5 + 9, hz); piv.rotation.x = sd * a; const m = new THREE.Mesh(texBox(hw + 2, 0.4, L, 2), turf); m.position.z = sd * L / 2; m.castShadow = true; piv.add(m); K.g.add(piv); const sn = new THREE.Mesh(texBox(hw + 2, 0.12, L * 0.45, 2), snow); sn.position.set(0, 0.26, sd * L * 0.25); piv.add(sn); }
      for (const sd of [-1, 1]) { const x = cx + sd * (hw / 2 + 1.4); for (const t of [-1, 1]) { const b = K.add(new THREE.BoxGeometry(0.5, 5, 0.5), lg, x, 1.2 + 5 + 9 + 1, hz + t * 0.8); b.rotation.x = t * 0.5; } const head = K.add(new THREE.ConeGeometry(0.8, 2.6, 4), lg, x + sd * 0.9, 1.2 + 5 + 9 + 3.6, hz); head.rotation.z = -sd * 1.2; }
      for (let k = 0; k < 8; k++) { const x = cx - hw / 2 + 1.5 + k * ((hw - 3) / 7); K.add(new THREE.CylinderGeometry(0.85, 0.85, 0.14, 14).rotateX(Math.PI / 2), flat([0x8a2a22, 0x2a4a7a, 0xd8b04a, 0x3a3a3a][k % 4]), x, 4.2, hz + hd / 2 + 0.1, 0, false); }
      const pa = K.arch(5, 5.5, 1.2, 3, 3.2, lg); pa.position.set(cx, 1.2, hz + hd / 2 + 0.4); K.plane(3, 4.4, cx, 1.2 + 2.2, hz + hd / 2 + 0.2, mat('door', () => std(0x3a2416)));
      K.out.glows.push({ pos: new THREE.Vector3(cx, 3.5, hz + hd / 2 + 1.5), color: 0xffa050, base: 44 }); K.out.smoke.push(new THREE.Vector3(cx - 6, 16, hz), new THREE.Vector3(cx + 6, 16, hz)); }
    // a estátua de Odin (26 m): manto, lança, o olho só, os dois corvos — na frente do salão, olhando o vale
    { const sx = cx, sz = Dm - 4.5, S = stone(0x8a8a90), b = 1.2;
      K.box(6, 3, 6, sx, b, sz, dk); for (let k = 0; k < 4; k++) K.box(7.4 - k * 0.4, 0.4, 0.8, sx, b + 3 - (k + 1) * 0.75, sz + 3.2 + k * 0.7, dk);
      K.cyl(2.6, 3.6, 12, sx, b + 3, sz, S, 10); // o manto até os pés
      K.cyl(2.2, 2.6, 6, sx, b + 15, sz, S, 10); // o tronco
      for (const sd of [-1, 1]) { const sh = K.add(new THREE.SphereGeometry(1.6, 10, 8), S, sx + sd * 2.6, b + 20.5, sz); void sh; }
      K.add(new THREE.SphereGeometry(1.5, 12, 10), S, sx, b + 22.8, sz); // cabeça
      K.cone(2.2, 2.2, sx, b + 23.6, sz, S, 10); K.cyl(2.4, 2.4, 0.3, sx, b + 23.5, sz, S, 12); // o chapéu largo do andarilho
      for (let k = 0; k < 6; k++) K.add(new THREE.ConeGeometry(0.35, 2.4, 4), snow, sx + (k - 2.5) * 0.4, b + 20.6, sz + 1.3, 0, false).rotation.x = Math.PI; // barba
      K.add(new THREE.PlaneGeometry(0.5, 0.2), dark(), sx + 0.5, b + 23.0, sz + 1.48, 0, false); K.add(new THREE.PlaneGeometry(0.35, 0.25), glow(0x9ad8ff), sx - 0.5, b + 23.0, sz + 1.48, 0, false); // o olho que sobrou
      const sp = K.add(new THREE.CylinderGeometry(0.2, 0.2, 26, 6), dk, sx + 3.6, b + 13, sz + 0.4); sp.rotation.z = -0.06; K.add(new THREE.ConeGeometry(0.6, 2.6, 4), mat('steel', () => std(0xc8ccd4)), sx + 3.6 - 0.8, b + 27.2, sz + 0.4, 0, false); // Gungnir
      const arm = K.add(new THREE.CylinderGeometry(0.6, 0.7, 6, 8), S, sx + 3.0, b + 17, sz + 0.3); arm.rotation.z = 0.25;
      for (const sd of [-1, 1]) { const rv = K.add(new THREE.ConeGeometry(0.5, 1.6, 5), flat(0x14141a), sx + sd * 2.6, b + 22.4, sz + 0.2); rv.rotation.z = sd * Math.PI / 2; K.add(new THREE.ConeGeometry(0.16, 0.5, 4), flat(0x2a2a2a), sx + sd * 3.4, b + 22.6, sz + 0.2, 0, false).rotation.z = sd * Math.PI / 2; }
      for (const sd of [-1, 1]) { K.torch(sx + sd * 3.6, b + 3, sz + 3.2, 0xff9a3a); } K.out.glows.push({ pos: new THREE.Vector3(sx, 8, sz + 5), color: 0xffb060, base: 40 }); }
    // torres de vigia de toras nos quatro cantos
    for (const [x, z] of [[2.5, 2.5], [Wm - 2.5, 2.5], [2.5, Dm - 2.5], [Wm - 2.5, Dm - 2.5]] as [number, number][]) { for (const ox of [-1, 1]) for (const oz of [-1, 1]) K.cyl(0.25, 0.3, 10, x + ox * 1.1, 1.2, z + oz * 1.1, lg, 6); K.box(3.4, 0.3, 3.4, x, 11.2, z, lg); K.cone(2.6, 3.4, x, 11.5, z, turf, 4, Math.PI / 4); K.torch(x, 11.5, z, 0xff9a3a); }
  } else if (id === 4) { // ABADIA DA AURORA: pedra branca, cúpula de ouro, campanário com o sol, claustro com jardim, estátuas
    const st = stone(0xe4dccc), sd2 = stone(0xb8b0a0), gd = mat('gold2', () => std(0xd8b04a)), gdR = slate(0xc89a3a), green = flat(0x4a7a3a);
    K.box(Wm - 0.6, 0.8, Dm - 0.6, cx, 0, cz, sd2);
    // nave e cúpula
    const nw = 10, nd = 14, nz = cz - 1; K.box(nw, 10, nd, cx, 0.8, nz, st);
    { const a = Math.atan2(4.5, nw / 2), L = (nw / 2 + 0.5) / Math.cos(a); for (const s of [-1, 1]) { const piv = new THREE.Group(); piv.position.set(cx, 0.8 + 10 + 4.5, nz); piv.rotation.z = s * a; const m = new THREE.Mesh(texBox(L, 0.25, nd + 1, 2), gdR); m.position.x = -s * L / 2; m.castShadow = true; piv.add(m); K.g.add(piv); } }
    K.cyl(4.6, 4.6, 3, cx, 0.8 + 10, nz - 2, st, 20); K.add(new THREE.SphereGeometry(4.6, 22, 12, 0, Math.PI * 2, 0, Math.PI / 2), gd, cx, 0.8 + 13, nz - 2); K.cyl(0.6, 0.8, 2, cx, 0.8 + 17.4, nz - 2, gd, 10); K.add(new THREE.SphereGeometry(0.7, 10, 8), glow(0xffe08a), cx, 0.8 + 20, nz - 2, 0, false);
    for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; K.plane(0.7, 1.8, cx + Math.cos(a) * 4.62, 0.8 + 11.5, nz - 2 + Math.sin(a) * 4.62, glow(0xffd070), Math.PI / 2 - a); }
    for (let k = 0; k < 4; k++) for (const s of [-1, 1]) K.plane(1.0, 4, cx + s * (nw / 2 + 0.02), 0.8 + 5, nz - nd / 2 + 2 + k * ((nd - 4) / 3), glow(0xffd070), s * Math.PI / 2);
    { const a = K.arch(5, 7, 1, 3, 4, st); a.position.set(cx, 0.8, nz + nd / 2 + 0.5); K.plane(3, 5.5, cx, 0.8 + 2.75, nz + nd / 2 + 0.1, mat('dooraur', () => std(0x8a6a3a))); K.add(new THREE.CircleGeometry(1.6, 20), glow(0xffd070), cx, 0.8 + 8.2, nz + nd / 2 + 0.03, 0, false); }
    // campanário com o sol de ouro
    { const tx = cx + nw / 2 + 3.2, tz = nz + nd / 2 - 2.5, S = 4.4; K.box(S, 24, S, tx, 0.8, tz, st); for (const a of [-1, 1]) for (const b of [-1, 1]) K.box(0.5, 3.4, 0.5, tx + a * (S / 2 - 0.25), 24.8, tz + b * (S / 2 - 0.25), st); K.add(new THREE.SphereGeometry(0.8, 10, 8), gd, tx, 26.4, tz); K.cone(S * 0.72, 7, tx, 28.2, tz, gdR, 4, Math.PI / 4);
      const sun = K.add(new THREE.CircleGeometry(1.5, 20), glow(0xffe08a), tx, 19, tz + S / 2 + 0.03, 0, false); void sun; for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2, ray = K.add(new THREE.PlaneGeometry(0.22, 1.2), glow(0xffe08a), tx + Math.cos(a) * 2.1, 19 + Math.sin(a) * 2.1, tz + S / 2 + 0.03, 0, false); ray.rotation.z = a - Math.PI / 2; }
      K.out.glows.push({ pos: new THREE.Vector3(tx, 19, tz + S / 2 + 1), color: 0xffd070, base: 50 }); }
    // claustro com jardim (à esquerda): arcos em volta de um pátio verde com fonte
    { const qx = 4.5, qz = cz + 1, Q = 7; K.box(Q, 0.1, Q, qx, 0.8, qz, green); for (let k = 0; k < 4; k++) { const a = K.arch(Q, 3.6, 0.6, 1.4, 1.8, st); const side = k; a.position.set(qx + (side === 1 ? Q / 2 : side === 3 ? -Q / 2 : 0), 0.8, qz + (side === 0 ? Q / 2 : side === 2 ? -Q / 2 : 0)); a.rotation.y = side % 2 ? Math.PI / 2 : 0; }
      K.cyl(0.9, 1.1, 0.6, qx, 0.8, qz, st, 12); K.add(new THREE.CircleGeometry(0.8, 12).rotateX(-Math.PI / 2), glow(0x9ad8ff), qx, 1.45, qz, 0, false);
      for (const [hx, hz] of [[-2.2, -2.2], [2.2, -2.2], [-2.2, 2.2], [2.2, 2.2]]) K.box(1.2, 0.8, 1.2, qx + hx, 0.8, qz + hz, green); }
    for (const s of [-1, 1]) K.torch(cx + s * 3.4, 0.8, nz + nd / 2 + 1.6, 0xffd070);
    K.out.glows.push({ pos: new THREE.Vector3(cx, 4, nz + nd / 2 + 2), color: 0xffd070, base: 40 });
  } else if (id === 5) { // BASTIÃO DE PRATA: forte estrelado de seis pontas, muralha grossa, torre central com a estaca de prata, balestras
    const st = stone(0x8a8e94), dk = stone(0x5a5e64), sv = mat('silver', () => std(0xe0e4ec)), R = Math.min(Wm, Dm) / 2 - 0.5;
    K.cyl(R * 0.72, R * 0.74, 0.6, cx, 0, cz, dk, 24);
    for (let k = 0; k < 12; k++) { const a0 = k / 12 * Math.PI * 2, a1 = (k + 1) / 12 * Math.PI * 2, r0 = k % 2 ? R * 0.62 : R, r1 = (k + 1) % 2 ? R * 0.62 : R;
      const x0 = cx + Math.cos(a0) * r0, z0 = cz + Math.sin(a0) * r0, x1 = cx + Math.cos(a1) * r1, z1 = cz + Math.sin(a1) * r1, L = Math.hypot(x1 - x0, z1 - z0), ry = Math.atan2(x1 - x0, z1 - z0);
      const gate = k === 2 || k === 3; if (gate) continue;
      K.add(texBox(2.2, 7, L + 1.4, 2), st, (x0 + x1) / 2, 3.5, (z0 + z1) / 2, ry);
      for (let i = 0; i < Math.floor(L / 1.1); i += 2) { const t = (i + 0.5) / Math.floor(L / 1.1); K.add(new THREE.BoxGeometry(0.7, 0.9, 0.7), st, x0 + (x1 - x0) * t, 7.45, z0 + (z1 - z0) * t, ry); }
      if (!(k % 2)) { K.cyl(1.6, 1.9, 8.5, x0, 0, z0, dk, 10); K.cone(1.9, 2.6, x0, 8.5, z0, slate(0x4a4e58), 10, 0); K.add(new THREE.ConeGeometry(0.08, 1.4, 4), sv, x0, 11.8, z0, 0, false); const bal = K.add(new THREE.BoxGeometry(2.2, 0.2, 0.3), flat(0x5a3a22), x0, 9.2, z0); bal.rotation.y = -a0; } }
    // portão (sul) com duas torres e a ponte levadiça baixada (a ponte de pedra cruza o fosso)
    { const gz = cz + R * 0.86; for (const s of [-1, 1]) { K.cyl(1.7, 2.0, 10, cx + s * 3.2, 0, gz, dk, 10); K.cone(2, 3, cx + s * 3.2, 10, gz, slate(0x4a4e58), 10, 0); K.torch(cx + s * 2.2, 0, gz + 1.6, 0xd8e8ff); }
      const a = K.arch(5, 7.5, 2.2, 3.2, 3.6, st); a.position.set(cx, 0, gz); K.plane(3.2, 5.2, cx, 2.6, gz - 0.9, dark()); }
    // a torre central e a estaca de prata no alto
    K.cyl(3.0, 3.6, 22, cx, 0, cz, st, 12); K.cyl(3.8, 3.2, 1, cx, 22, cz, dk, 12);
    for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; K.add(new THREE.BoxGeometry(0.7, 1, 0.5), st, cx + Math.cos(a) * 3.5, 23.5, cz + Math.sin(a) * 3.5, -a); }
    K.add(new THREE.CylinderGeometry(0.3, 0.02, 10, 6), sv, cx, 28, cz, 0, false); K.add(new THREE.BoxGeometry(3.4, 0.3, 0.3), sv, cx, 30.5, cz, 0, false);
    for (let f = 0; f < 4; f++) K.plane(0.6, 1.5, cx, 4 + f * 4.6, cz + 3.32, glow(0xd8e8ff));
    K.out.glows.push({ pos: new THREE.Vector3(cx, 30, cz), color: 0xc8d8ff, base: 46 }, { pos: new THREE.Vector3(cx, 3, cz + R), color: 0xd8e8ff, base: 30 });
  } else if (id === 6) { // VALE DA DESGRAÇA: nove obeliscos negros com runas violetas, correntes até a rocha que flutua sobre o altar do pacto, a cabeça de uma estátua partida
    const bk = stone(0x221c28), vi = glow(0xb06aff), viA = glowA(0xa050ff, 0.22), R = Math.min(Wm, Dm) / 2 - 1.2;
    K.cyl(R + 0.8, R + 1.0, 0.4, cx, 0, cz, stone(0x2e2834), 28); const ring = K.add(new THREE.TorusGeometry(R - 1.0, 0.12, 4, 60), vi, cx, 0.45, cz, 0, false); ring.rotation.x = Math.PI / 2;
    const top = new THREE.Vector3(cx, 22, cz);
    for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2, x = cx + Math.cos(a) * R, z = cz + Math.sin(a) * R, h = 11 + (k % 3) * 2.5; K.add(new THREE.CylinderGeometry(0.55, 1.0, h, 4), bk, x, 0.4 + h / 2, z, a); K.add(new THREE.ConeGeometry(0.56, 1.6, 4), bk, x, 0.4 + h + 0.8, z, a); K.plane(0.35, h * 0.7, x - Math.cos(a) * 0.62, 0.4 + h * 0.5, z - Math.sin(a) * 0.62, vi, -a - Math.PI / 2);
      const p0 = new THREE.Vector3(x, 0.4 + h, z), L = p0.distanceTo(top); const ch = K.add(new THREE.CylinderGeometry(0.07, 0.07, L, 4), flat(0x3a3a40), (x + top.x) / 2, (p0.y + top.y) / 2, (z + top.z) / 2, 0, false); ch.lookAt(top); ch.rotateX(Math.PI / 2); }
    // altar do pacto e a rocha que flutua presa pelas correntes
    K.box(4.6, 1.6, 3, cx, 0.4, cz, bk); K.box(5.2, 0.3, 3.6, cx, 2.0, cz, stone(0x3a3440)); K.add(new THREE.OctahedronGeometry(0.7), vi, cx, 3.4, cz, 0, false).userData.dyn = true;
    const rock = K.add(new THREE.DodecahedronGeometry(3.4, 0), bk, cx, 22, cz); rock.scale.set(1.2, 0.8, 1.1); K.add(new THREE.SphereGeometry(4.4, 14, 10), viA, cx, 22, cz, 0, false); K.plane(1.0, 5.4, cx, 22, cz + 3.8, vi);
    K.add(new THREE.CylinderGeometry(0.5, 2.4, 18, 10, 1, true), viA, cx, 12, cz, 0, false); // o fio de energia do altar até a rocha
    // a cabeça partida de um rei antigo, meio enterrada
    { const hx = cx - R * 0.55, hz = cz + R * 0.55; const hd = K.add(new THREE.SphereGeometry(2.6, 10, 8), stone(0x5a5460), hx, 1.4, hz); hd.scale.set(1, 1.2, 1); hd.rotation.z = 0.5; K.add(new THREE.ConeGeometry(0.9, 2.2, 5), stone(0x5a5460), hx + 0.6, 4.2, hz - 0.4).rotation.z = 0.7; K.plane(0.8, 0.4, hx + 1.2, 2.2, hz + 2.3, vi, 0.4); }
    K.out.glows.push({ pos: new THREE.Vector3(cx, 3, cz), color: 0xa05aff, base: 60 }, { pos: new THREE.Vector3(cx, 22, cz), color: 0xa05aff, base: 50 });
  } else if (id === 7) { // ÁRVORE-MÃE DO UIVO: tronco colossal com raízes em arco, a toca da matilha dentro, copa enorme, a pedra da lua e o lago de luar
    const bark = mat('bark2', () => std(0xffffff, { map: stoneTex(0x4a3628) })), leaf = flat(0x2a4a2e), leaf2 = flat(0x3a5a34), moon = glow(0xdce8ff);
    K.cyl(4.2, 6.4, 24, cx, 0, cz - 1, bark, 14);
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2 + 0.2; const rt = K.add(new THREE.TorusGeometry(3.6, 0.9, 6, 10, Math.PI * 0.6), bark, cx + Math.cos(a) * 5.5, 0.6, cz - 1 + Math.sin(a) * 5.5); rt.rotation.set(Math.PI / 2, 0, -a + Math.PI / 2); rt.rotateX(-Math.PI / 2.4); }
    for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2, br = K.add(new THREE.CylinderGeometry(0.8, 1.6, 12, 8), bark, cx + Math.cos(a) * 4.5, 26, cz - 1 + Math.sin(a) * 4.5); br.rotation.set(Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9); }
    for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2, r = k ? 8.5 : 0, s0 = k ? 7.2 : 9.5; const c2 = K.add(new THREE.IcosahedronGeometry(s0, 1), k % 2 ? leaf : leaf2, cx + Math.cos(a) * r, 33 + (k % 3) * 2.2, cz - 1 + Math.sin(a) * r); c2.scale.y = 0.62; }
    // a toca da matilha: entrada em arco no tronco, crânio de lobo gigante em cima
    { const ez = cz - 1 + 6.2; K.plane(3, 4.2, cx, 2.1, ez + 0.05, dark()); const a = K.arch(5.2, 6, 1.2, 3, 3, bark); a.position.set(cx, 0, ez); K.add(new THREE.SphereGeometry(1.6, 10, 8), flat(0xe8dcc0), cx, 7.2, ez + 0.6).scale.set(1, 0.8, 1.4);
      for (const s of [-1, 1]) { K.add(new THREE.ConeGeometry(0.4, 1.4, 4), flat(0xe8dcc0), cx + s * 1.0, 8.4, ez + 0.4).rotation.z = s * 0.4; K.add(new THREE.ConeGeometry(0.22, 1.8, 5), flat(0xe8dcc0), cx + s * 2.8, 6.6, ez + 0.8).rotation.z = s * 0.9; K.torch(cx + s * 2.4, 0, ez + 1.6, 0xff8a3a); } }
    // a pedra da lua: um disco aceso sobre um lago redondo de luar
    { const px = cx + 5.5, pz = Dm - 3; K.cyl(2.4, 2.6, 0.3, px, 0, pz, stone(0x6a6a72), 18); K.add(new THREE.CircleGeometry(2.1, 18).rotateX(-Math.PI / 2), glowA(0xb8d0ff, 0.65), px, 0.34, pz, 0, false);
      K.box(0.7, 4.2, 0.4, px, 0.3, pz - 2.6, stone(0x8a8a90)); K.add(new THREE.CircleGeometry(1.4, 24), moon, px, 6.2, pz - 2.6, 0, false); K.out.glows.push({ pos: new THREE.Vector3(px, 3, pz), color: 0xb8d0ff, base: 40 }); }
    K.out.glows.push({ pos: new THREE.Vector3(cx, 3, cz + 7), color: 0xff8a3a, base: 36 }); K.out.smoke.push(new THREE.Vector3(cx, 30, cz));
  } else { // 2 PINÁCULO DE MARFIM
    const iv = stone(0xece4d0), ivD = stone(0xc8c0a8), gd = flat(0xd8b860), H = 70, blue = glow(0x9ad8ff);
    // embasamento em degraus redondos e colunata
    for (let k = 0; k < 4; k++) K.cyl(Wm / 2 - k * 0.7, Wm / 2 - k * 0.7 + 0.2, 0.5, cx, k * 0.5, cz, k % 2 ? ivD : iv, 32);
    for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2, r = Wm / 2 - 3.2; K.cyl(0.38, 0.45, 7, cx + Math.cos(a) * r, 2, cz + Math.sin(a) * r, iv, 10); K.cyl(0.6, 0.6, 0.4, cx + Math.cos(a) * r, 9, cz + Math.sin(a) * r, gd, 10); }
    K.cyl(Wm / 2 - 2.6, Wm / 2 - 2.6, 0.7, cx, 9.4, cz, iv, 32); const rl = K.add(new THREE.TorusGeometry(Wm / 2 - 2.6, 0.12, 4, 40), gd, cx, 10.1, cz, 0, false); rl.rotation.x = Math.PI / 2;
    // o fuste da torre, afinando, com nervuras douradas e janelas azuis em espiral
    const pts: THREE.Vector2[] = []; for (let i = 0; i <= 30; i++) { const t = i / 30; pts.push(new THREE.Vector2(4.4 * (1 - t) + 1.7 * t + 0.6 * Math.sin(t * Math.PI) * (1 - t), 2 + t * H)); }
    K.add(new THREE.LatheGeometry(pts, 28), iv, cx, 0, cz);
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; for (let i = 0; i < 30; i++) { const t = (i + 0.5) / 30, r = 4.4 * (1 - t) + 1.7 * t + 0.6 * Math.sin(t * Math.PI) * (1 - t) + 0.05; K.add(new THREE.BoxGeometry(0.16, H / 30 + 0.05, 0.16), gd, cx + Math.cos(a) * r, 2 + t * H, cz + Math.sin(a) * r, 0, false); } }
    for (let i = 0; i < 40; i++) { const t = (i + 2) / 44, a = t * Math.PI * 14, r = 4.4 * (1 - t) + 1.7 * t + 0.6 * Math.sin(t * Math.PI) * (1 - t) + 0.04; K.plane(0.5, 1.4, cx + Math.cos(a) * r, 2 + t * H, cz + Math.sin(a) * r, blue, Math.PI / 2 - a); }
    // varandas douradas em três alturas e arcos voadores da colunata até a primeira
    for (const t of [0.28, 0.55, 0.8]) { const r = 4.4 * (1 - t) + 1.7 * t + 0.6 * Math.sin(t * Math.PI) * (1 - t); K.cyl(r + 1.6, r + 1.2, 0.4, cx, 2 + t * H, cz, iv, 24); const rr = K.add(new THREE.TorusGeometry(r + 1.55, 0.08, 4, 32), gd, cx, 2 + t * H + 0.9, cz, 0, false); rr.rotation.x = Math.PI / 2; }
    for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2 + 0.26; const ar = K.add(new THREE.TorusGeometry(5.2, 0.28, 6, 14, Math.PI / 2), iv, cx + Math.cos(a) * 5.0, 10.0, cz + Math.sin(a) * 5.0, 0); ar.rotation.set(0, -a + Math.PI, 0); ar.rotateX(-Math.PI / 2); ar.rotateZ(0); }
    // a coroa: seis chifres de marfim curvados para dentro, o cristal flutuando e os anéis de runas
    { const y = 2 + H; K.cyl(2.2, 1.8, 1.2, cx, y, cz, iv, 20);
      for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; const horn = K.add(new THREE.TorusGeometry(4.2, 0.35, 6, 12, Math.PI * 0.55), iv, cx + Math.cos(a) * 4.2, y + 1.2, cz + Math.sin(a) * 4.2); horn.rotation.set(0, -a, Math.PI * 0.95); horn.rotateY(Math.PI / 2); }
      const cr = K.add(new THREE.OctahedronGeometry(1.8), glow(0xbaf0ff), cx, y + 9, cz, 0, false); cr.scale.y = 1.7; cr.userData.dyn = true;
      K.add(new THREE.SphereGeometry(5.5, 16, 12), glowA(0x8ad8ff, 0.12), cx, y + 9, cz, 0, false);
      for (let k = 0; k < 3; k++) { const rg = K.add(new THREE.TorusGeometry(3.4 + k * 1.1, 0.07, 4, 48), glow(0x9ad8ff), cx, y + 9, cz, 0, false); rg.rotation.set(0.5 + k * 0.6, k * 0.8, k * 0.4); }
      K.add(new THREE.CylinderGeometry(0.6, 1.6, 120, 12, 1, true), glowA(0x9ad8ff, 0.06), cx, y + 9 + 60, cz, 0, false); // o feixe que sobe ao céu
      K.out.glows.push({ pos: new THREE.Vector3(cx, y + 9, cz), color: 0x9ae0ff, base: 90 }); }
    // portal de entrada
    { const a = K.arch(5, 7, 1.2, 2.6, 3.6, iv, true); a.position.set(cx, 2, cz + 4.2); K.plane(2.6, 5, cx, 2 + 2.5, cz + 3.6, glow(0x7ab8e8)); for (const s of [-1, 1]) K.torch(cx + s * 3.2, 2, cz + 5.4, 0x9ad8ff); }
    K.out.glows.push({ pos: new THREE.Vector3(cx, 4, cz + 6), color: 0x9ad8ff, base: 40 });
  }
  return K.out;
}
