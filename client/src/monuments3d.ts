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
  } else if (id === 7) { // ÁRVORE-MÃE DO UIVO (27/10, Erling): a árvore-toca IMENSA, CAÍDA no meio da selva; o tronco é a moradia da Mãe-Alfa. Raízes reviradas numa ponta, a copa partida na outra, musgo, cogumelos, ossos; a boca da toca aberta no flanco virado para a vila; a estátua da Mãe Loba amamentando as crianças humanas no caminho
    const bark = mat('bark2', () => std(0xffffff, { map: stoneTex(0x4a3628) })), barkD = mat('bark3', () => std(0xffffff, { map: stoneTex(0x3a2a1e) })), moss = flat(0x3a6a2e), leaf = flat(0x2a4a2e), leaf2 = flat(0x4a7a3a), bone = flat(0xe8dcc0), st = stone(0x8a8a90);
    const R = 5.6, L = Wm - 4, tz = cz - 2, ty = R - 0.6; // o tronco afundado 60 cm na terra
    const trunk = K.add(new THREE.CylinderGeometry(R, R * 1.15, L, 16), bark, cx, ty, tz); trunk.rotation.z = Math.PI / 2;
    for (let k = 0; k < 7; k++) { const x = 3 + k * (L / 6); const ring = K.add(new THREE.TorusGeometry(R * (1.02 + (k % 2) * 0.03), 0.25, 5, 16), barkD, x, ty, tz, 0, false); ring.rotation.y = Math.PI / 2; } // as cascas em anéis
    for (let k = 0; k < 18; k++) { const x = 2 + (k * 1.73) % L, a = (k * 0.9) % Math.PI; K.add(new THREE.SphereGeometry(0.9 + (k % 3) * 0.5, 6, 5), moss, x, ty + Math.sin(a) * R * 0.9, tz - Math.cos(a) * R * 0.9); } // musgo por cima e pelo lado da sombra
    for (let k = 0; k < 9; k++) { const x = 4 + k * 3.1; K.add(new THREE.CylinderGeometry(0.5 + (k % 3) * 0.3, 0.1, 0.35, 7), flat(k % 2 ? 0xd9b45a : 0xc08a4a), x, ty + 0.4 + (k % 2) * 0.6, tz + R - 0.1).rotation.x = Math.PI / 2; } // orelhas-de-pau
    // a ponta das raízes (oeste): o disco de terra erguido e as raízes retorcidas no ar
    { const rx = 2; K.add(new THREE.CylinderGeometry(R * 1.7, R * 1.5, 1.6, 14), barkD, rx, ty, tz, 0).rotation.z = Math.PI / 2;
      for (let k = 0; k < 14; k++) { const a = k / 14 * Math.PI * 2, rr0 = R * 1.2 + (k % 3) * 1.2, root = K.add(new THREE.ConeGeometry(0.55, 4 + (k % 4) * 2, 6), bark, rx - 1.2, ty + Math.sin(a) * rr0, tz + Math.cos(a) * rr0); root.rotation.z = Math.PI / 2 + Math.cos(a) * 0.4; root.rotation.x = -Math.sin(a) * 0.6; } }
    // a ponta da copa (leste): o tronco partido em lascas, galhos mortos e três galhos vivos subindo com folhas
    { const ex = L + 1; for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; K.add(new THREE.ConeGeometry(1.2, 4.5, 5), barkD, ex + 1.5, ty + Math.sin(a) * R * 0.7, tz + Math.cos(a) * R * 0.7).rotation.z = -Math.PI / 2; }
      for (let k = 0; k < 4; k++) { const a = -0.3 + k * 0.5; const br = K.add(new THREE.CylinderGeometry(0.35, 0.7, 9, 7), bark, ex - 2 - k * 1.5, ty + 4, tz + (k % 2 ? 2.5 : -2.5)); br.rotation.z = a + 0.3; br.rotation.x = (k % 2 ? -0.5 : 0.5); }
      for (let k = 0; k < 3; k++) { const x = 8 + k * 9; const b2 = K.add(new THREE.CylinderGeometry(0.3, 0.5, 7, 7), bark, x, ty + R + 2.6, tz - 1); b2.rotation.x = -0.25; K.add(new THREE.IcosahedronGeometry(3.2 + (k % 2), 1), k % 2 ? leaf : leaf2, x + 0.6, ty + R + 6.6, tz - 2.4); K.add(new THREE.IcosahedronGeometry(2.2, 1), leaf2, x - 1.6, ty + R + 5.2, tz - 1.4); } }
    // a boca da toca: um rasgo em arco no flanco virado para a vila, escuro, com um crânio de lobo e tochas; a Mãe-Alfa mora aqui dentro
    { const mx = cx + 2, mz = tz + R * 0.75; const a = K.arch(6.2, 7, 2.6, 4, 3.6, barkD); a.position.set(mx, 0, mz + 0.4); K.plane(3.8, 5.4, mx, 2.7, mz + 0.3, dark());
      K.add(new THREE.SphereGeometry(1.1, 10, 8), bone, mx, 7.4, mz + 0.6); for (const s2 of [-1, 1]) K.add(new THREE.ConeGeometry(0.28, 1.0, 4), bone, mx + s2 * 0.7, 8.2, mz + 1.0).rotation.z = s2 * 0.35; K.add(new THREE.ConeGeometry(0.16, 1.2, 5), bone, mx, 6.5, mz + 1.5).rotation.x = 0.9;
      K.torch(mx - 4.4, 0, mz + 2.2, 0xffa050); K.torch(mx + 4.4, 0, mz + 2.2, 0xffa050); K.out.glows.push({ pos: new THREE.Vector3(mx, 2.5, mz + 2.5), color: 0xff8a3a, base: 30 });
      for (let k = 0; k < 7; k++) K.add(new THREE.CylinderGeometry(0.08, 0.14, 0.7 + (k % 3) * 0.4, 5), bone, mx - 5 + k * 1.6, 0.35, mz + 3.4 + (k % 2) * 0.8, 0, false).rotation.z = (k % 2 ? 0.5 : -0.4); }
    // a estátua da Mãe Loba: a loba gigante deitada, de pedra, amamentando três crianças humanas; no caminho, entre a vila e a toca
    { const sx = cx + 9.5, sz = Dm - 4.5; K.cyl(3.6, 3.9, 0.5, sx, 0, sz, stone(0x6a6a72), 14);
      K.box(5.2, 1.9, 2.2, sx, 0.5, sz, st); K.add(new THREE.SphereGeometry(1.2, 10, 8), st, sx + 2.9, 1.9, sz - 0.3); K.box(1.0, 0.7, 0.9, sx + 3.9, 1.5, sz - 0.3, st); for (const s2 of [-1, 1]) K.add(new THREE.ConeGeometry(0.3, 0.9, 4), st, sx + 2.6, 3.0, sz - 0.3 + s2 * 0.6);
      K.box(1.6, 0.6, 0.6, sx - 3.2, 0.8, sz + 0.4, st).rotation.y = 0.4; K.box(0.8, 0.5, 0.5, sx - 2.6, 0.5, sz - 0.8, st); K.box(0.8, 0.5, 0.5, sx + 1.8, 0.5, sz + 1.2, st); // cauda e patas
      for (let k = 0; k < 3; k++) { const x = sx - 1.6 + k * 1.3, z = sz + 1.45; K.box(0.5, 0.9, 0.4, x, 0.5, z, st); K.add(new THREE.SphereGeometry(0.3, 7, 6), st, x, 1.6, z); K.box(0.9, 0.18, 0.18, x, 1.1, z + 0.1, st); } // as crianças, ajoelhadas junto ao ventre
      K.plane(3.2, 0.5, sx, 0.75, sz + 2.2, flat(0xd9b45a)); K.out.glows.push({ pos: new THREE.Vector3(sx, 2.4, sz + 2.5), color: 0xffd27a, base: 18 }); }
    K.out.smoke.push(new THREE.Vector3(cx + 2, R * 2 - 1, tz));
  } else if (id === 8) { // A GRANDE CALDEIRA (Porto Caldeira, 27/10): a caldeira-mãe da cidade, de cobre rebitado, sobre um embasamento de tijolo, com duas chaminés, manômetros acesos, tubos que somem no chão e válvulas soltando vapor
    const brick = stone(0x7a4a3a), iron = flat(0x3a3d44), copper = flat(0xa8603a), brass = flat(0xc8963a), dial = glow(0xffe6a0), steam = glowA(0xe8f0ff, 0.35);
    K.box(Wm - 1, 1.4, Dm - 1, cx, 0, cz, brick); K.box(Wm - 2.4, 0.5, Dm - 2.4, cx, 1.4, cz, stone(0x5a4a40));
    for (let k = 0; k < 4; k++) { const x = cx - Wm / 2 + 1.2 + k * ((Wm - 2.4) / 3); K.box(0.8, 1.6, 0.8, x, 1.9, cz - 2.4, iron); K.box(0.8, 1.6, 0.8, x, 1.9, cz + 2.4, iron); } // berços de ferro
    const R = Math.min(Dm, Wm) * 0.26, L = Wm - 3.4; const body = K.add(new THREE.CylinderGeometry(R, R, L, 18), copper, cx, 3.5 + R, cz, 0); body.rotation.z = Math.PI / 2;
    for (const s of [-1, 1]) { const cap = K.add(new THREE.SphereGeometry(R, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), copper, cx + s * L / 2, 3.5 + R, cz, 0); cap.rotation.z = s * Math.PI / 2; }
    for (let k = 0; k < 5; k++) { const x = cx - L / 2 + (k + 0.5) * (L / 5); const band = K.add(new THREE.TorusGeometry(R + 0.06, 0.12, 6, 24), brass, x, 3.5 + R, cz, 0, false); band.rotation.y = Math.PI / 2;
      for (let j = 0; j < 14; j++) { const a = j / 14 * Math.PI * 2; K.add(new THREE.SphereGeometry(0.09, 5, 4), brass, x + 0.3, 3.5 + R + Math.cos(a) * (R + 0.08), cz + Math.sin(a) * (R + 0.08), 0, false); } }
    // chaminés gêmeas, com fumaça; manômetros grandes na frente; a escotilha do fogo
    for (const s of [-1, 1]) { const x = cx + s * L * 0.28; K.cyl(0.55, 0.7, 9, x, 3.5 + R * 1.6, cz, stone(0x5a4a40), 10); K.cyl(0.78, 0.6, 0.6, x, 3.5 + R * 1.6 + 9, cz, iron, 10); K.out.smoke.push(new THREE.Vector3(x, 3.5 + R * 1.6 + 9.8, cz)); }
    for (let k = -1; k <= 1; k++) { const x = cx + k * 2.6, y = 3.5 + R, z = cz + R + 0.02; K.cyl(0.62, 0.62, 0.25, x, y - 0.12, z, brass, 16).rotation.x = Math.PI / 2; const d = K.add(new THREE.CircleGeometry(0.5, 16), dial, x, y, z + 0.15, 0, false); void d;
      K.add(new THREE.BoxGeometry(0.05, 0.42, 0.03), flat(0x3a1a10), x, y + 0.14, z + 0.17, 0, false).rotation.z = -0.5 + k * 0.6; K.out.glows.push({ pos: new THREE.Vector3(x, y, z + 0.6), color: 0xffd27a, base: 10 }); }
    { const a = K.arch(2.4, 2.6, 0.6, 1.4, 1.2, iron); a.position.set(cx, 1.9, cz + Dm / 2 - 0.9); K.plane(1.3, 1.7, cx, 2.75, cz + Dm / 2 - 0.9 + 0.02, glow(0xff7a2a)); K.out.glows.push({ pos: new THREE.Vector3(cx, 2.6, cz + Dm / 2 + 0.8), color: 0xff8a3a, base: 26 }); }
    // tubulação: canos de cobre que descem da caldeira e somem no chão, com válvulas de roda e vapor
    for (let k = 0; k < 6; k++) { const s = k % 2 ? 1 : -1, x = cx - L / 2 + 1 + k * (L - 2) / 5, z = cz + s * (R + 1.6); K.cyl(0.18, 0.18, R + 1.6, x, 3.5 + R, z, copper, 8).rotation.x = Math.PI / 2; K.cyl(0.18, 0.18, 3.5 + R, x, 0, z, copper, 8);
      if (k % 3 === 1) { const w = K.add(new THREE.TorusGeometry(0.36, 0.06, 6, 12), brass, x, 2.4, z + s * 0.3, 0, false); w.rotation.x = Math.PI / 2; K.add(new THREE.ConeGeometry(0.5, 1.6, 8), steam, x, 2.2 + 1.1, z + s * 0.9, 0, false); } }
    // lampiões a gás nos quatro cantos e a placa de latão
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const x = cx + sx * (Wm / 2 - 0.9), z = cz + sz * (Dm / 2 - 0.9); K.cyl(0.08, 0.11, 3.4, x, 1.9, z, iron, 6); K.add(new THREE.BoxGeometry(0.36, 0.44, 0.36), glow(0xffd27a), x, 5.5, z, 0, false); K.out.glows.push({ pos: new THREE.Vector3(x, 5.6, z), color: 0xffc070, base: 12 }); }
    K.plane(2.2, 0.6, cx, 1.1, cz + Dm / 2 - 0.48, brass);
  } else if (id === 9) { // OS PORTÕES DE BRASAFORJA (27/10): a face da Montanha Negra escavada, o portão colossal com as portas de ferro abertas, dois Ancestrais de pedra de 14 m com machado e martelo, runas acesas, braseiros e a escadaria
    const rock = stone(0x4a443e), rock2 = stone(0x5e5850), gd = flat(0xd9b45a), iron = flat(0x3a3d44), rune = glow(0xff9a3a), fire = glow(0xff6a2a);
    // a montanha: um maciço que sobe atrás do portão e se funde com a encosta (blocos e dodecaedros irregulares)
    K.box(Wm, 30, Dm * 0.62, cx, -6, Dm * 0.31, rock); K.box(Wm + 6, 22, Dm * 0.5, cx, -6, Dm * 0.2, rock); for (let k = 0; k < 14; k++) { const a = k / 14 * Math.PI, rr0 = Wm * 0.5 - 1 + (k % 3); K.add(new THREE.DodecahedronGeometry(3.4 + (k % 3) * 1.6, 0), k % 2 ? rock : rock2, cx + Math.cos(a) * rr0 * 0.95, 22 + (k % 4) * 2.6, Dm * 0.2 + Math.sin(a) * 2); }
    for (let k = 0; k < 8; k++) K.add(new THREE.DodecahedronGeometry(2.8 + (k % 3), 0), rock2, cx - Wm / 2 + 2 + k * (Wm - 4) / 7, 26 + (k % 2) * 3, Dm * 0.3 + (k % 3) - 2);
    // a escadaria larga e o patamar
    for (let s = 0; s < 4; s++) K.box(Wm * 0.6 - s * 2, 0.4, 1.4, cx, s * 0.4, Dm - 0.7 - s * 1.2, s % 2 ? rock2 : rock); K.box(Wm * 0.6, 0.4, Dm * 0.2, cx, 1.6, Dm * 0.62 + 1.6, rock2);
    // o portão: arco de pedra fundo, moldura de ouro, as portas de ferro abertas para dentro, a escuridão do salão
    { const gz = Dm * 0.62; const a = K.arch(11, 15, 2.8, 6.6, 8.2, rock2); a.position.set(cx, 2, gz); K.box(12.4, 0.6, 3.0, cx, 2 + 15, gz, gd);
      /* a porta de ferro fundido, fechada: duas folhas com cintas de ouro, rebites, as argolas e o emblema do martelo */
      for (const sx of [-1, 1]) { const leaf = K.add(texBox(3.2, 11.2, 0.5, 2), iron, cx + sx * 1.62, 2 + 5.6, gz + 0.2, 0); for (let k = 0; k < 4; k++) { const b = K.add(new THREE.BoxGeometry(3.3, 0.34, 0.56), gd, 0, -4.6 + k * 3.0, 0); leaf.add(b); } for (let k = 0; k < 10; k++) { const rv = K.add(new THREE.SphereGeometry(0.1, 5, 4), gd, -1.35 + (k % 2) * 2.7, -4.8 + Math.floor(k / 2) * 2.3, 0.3, 0, false); leaf.add(rv); }
        K.add(new THREE.TorusGeometry(0.42, 0.08, 6, 12), gd, cx + sx * 0.75, 2 + 4.6, gz + 0.55, 0, false); }
      K.add(new THREE.BoxGeometry(0.5, 1.6, 0.2), gd, cx, 2 + 8.6, gz + 0.5, 0, false); K.add(new THREE.BoxGeometry(1.4, 0.6, 0.2), gd, cx, 2 + 9.5, gz + 0.5, 0, false); dark();
      for (let k = 0; k < 7; k++) { const t = k / 6, x = cx - 5.4 + t * 10.8, y = 2 + 8.2 + Math.sin(t * Math.PI) * 4.2; K.add(new THREE.BoxGeometry(0.7, 0.7, 0.12), rune, x, y, gz + 1.45, 0, false); }
      K.out.glows.push({ pos: new THREE.Vector3(cx, 8, gz + 2), color: 0xff8a3a, base: 48 }); }
    // os dois Ancestrais: botas, túnica, barba trançada, elmo com chifres, um com o machado e outro com o martelo
    for (const sx of [-1, 1]) { const x = cx + sx * (Wm * 0.5 - 4.2), z = Dm * 0.62 + 1.2, m = rock2; K.box(5, 2.4, 5, x, 2, z, rock); K.box(1.3, 2.2, 1.6, x - 1, 4.4, z, m); K.box(1.3, 2.2, 1.6, x + 1, 4.4, z, m); K.box(3.8, 5.2, 2.6, x, 6.6, z, m); K.box(4.6, 1.2, 3.0, x, 11.6, z, m); K.add(new THREE.SphereGeometry(1.5, 9, 7), m, x, 14.2, z); K.box(3.0, 1.6, 2.6, x, 14.9, z, iron); for (const hx of [-1, 1]) K.add(new THREE.ConeGeometry(0.45, 2.4, 6), gd, x + hx * 1.9, 16.2, z, 0).rotation.z = -hx * 0.7;
      K.box(2.2, 3.4, 0.9, x, 9.4, z + 1.5, rock); for (let k = 0; k < 3; k++) K.box(0.5, 0.5, 0.3, x - 0.6 + k * 0.6, 8.4 - k * 0.3, z + 1.95, gd); // barba trançada com anéis
      K.box(0.5, 10, 0.5, x + sx * 2.9, 2.4, z + 0.8, flat(0x4a3220)); if (sx < 0) { K.box(2.8, 2.2, 0.5, x + sx * 2.9, 11.8, z + 0.8, iron); } else { K.box(2.4, 1.6, 1.6, x + sx * 2.9, 12.0, z + 0.8, iron); }
      K.add(new THREE.BoxGeometry(0.6, 0.3, 0.12), rune, x - 0.7, 14.3, z + 1.45, 0, false); K.add(new THREE.BoxGeometry(0.6, 0.3, 0.12), rune, x + 0.7, 14.3, z + 1.45, 0, false); }
    // braseiros de ferro na escadaria e tochas na face da rocha; fumaça das chaminés da forja lá no alto
    for (const sx of [-1, 1]) { const x = cx + sx * 8.6, z = Dm - 1.2; K.cyl(0.8, 0.5, 1.6, x, 0, z, iron, 8); K.cyl(1.1, 0.8, 0.4, x, 1.6, z, iron, 8); K.add(new THREE.ConeGeometry(0.7, 1.8, 7), fire, x, 2.9, z, 0, false); K.out.glows.push({ pos: new THREE.Vector3(x, 2.8, z), color: 0xff7a2a, base: 42 }); }
    for (let k = 0; k < 4; k++) { const x = cx - Wm * 0.36 + k * (Wm * 0.72 / 3); K.torch(x, 2 + 9, Dm * 0.62 + 1.6, 0xff8a3a); }
    for (const sx of [-1, 1]) { K.cyl(0.6, 0.8, 4, cx + sx * Wm * 0.22, 22, Dm * 0.25, stone(0x4a3a30), 8); K.out.smoke.push(new THREE.Vector3(cx + sx * Wm * 0.22, 26.4, Dm * 0.25)); }
  } else if (id === 2) { // PINÁCULO DE MARFIM
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
  else if (id === 10) { // O FAROL TECNOCRÁTICO (27/10, regra 19): numa ilha de pedras diante de Porto Caldeira; torre cônica de ferro rebitado sobre base de tijolo,
    // escada em caracol por fora, cinta de engrenagens, lanterna de latão com o feixe girando, tubo de vapor e sirene, casa do faroleiro ao pé
    const br = stone(0x6a4036), ir = flat(0x3a3d44), brass = flat(0xc8963a), rust = flat(0x8a4a2a), ir2 = flat(0x2a2c32), H = 22;
    for (let k = 0; k < 18; k++) { const a = k / 18 * Math.PI * 2, sea = Math.sin(a) > -0.2 /* sul, leste e oeste caem para o mar; o norte liga à areia */, r = Math.min(Wm, Dm) * 0.5 + (sea ? 1.6 + (k % 3) * 0.9 : 0.8), h = sea ? 2.2 + (k % 4) * 1.0 : 1.2 + (k % 3) * 0.5; const b = K.add(new THREE.DodecahedronGeometry((sea ? 2.0 : 1.4) + (k % 3) * 0.5, 0), stone(sea ? 0x3e3c3a : 0x4a4a48), cx + Math.cos(a) * r, -h * 0.45, cz + Math.sin(a) * r); b.scale.set(1.25, h / 2.2, 1.25); b.rotation.y = k * 0.7;
      if (sea && k % 2 === 0) { const f = K.plane(2.6, 1.2, cx + Math.cos(a) * (r + 1.6), 0.08, cz + Math.sin(a) * (r + 1.6), glowA(0xffffff, 0.45)); f.rotation.x = -Math.PI / 2; f.rotation.z = a; f.userData.dyn = true; f.userData.foam = k; } } // espuma das ondas quebrando nas pedras
    K.cyl(3.4, 4.2, 3.0, cx, 0, cz, br, 12); K.cyl(3.6, 3.6, 0.4, cx, 3.0, cz, ir, 12); // base de tijolo e a cinta
    const tw = stone(0xb8a890); K.cyl(1.7, 3.0, H - 6, cx, 3.4, cz, tw, 12); // a torre cônica de pedra clara (como os faróis de verdade), cintada de ferro
    for (let f = 0; f < 5; f++) { const y = 5 + f * 3.2, r = 3.0 - (3.0 - 1.7) * ((y - 3.4) / (H - 6)); K.cyl(r + 0.12, r + 0.12, 0.25, cx, y, cz, rust, 12); for (let q = 0; q < 16; q++) { const a = q / 16 * Math.PI * 2; K.add(new THREE.SphereGeometry(0.08, 5, 4), brass, cx + Math.cos(a) * (r + 0.13), y + 0.12, cz + Math.sin(a) * (r + 0.13), 0, false); } }
    for (let k = 0; k < 40; k++) { const t = k / 40, a = t * Math.PI * 4.5, y = 3.4 + t * (H - 7), r = 3.0 - (3.0 - 1.7) * t + 0.55; K.box(0.9, 0.08, 0.5, cx + Math.cos(a) * r, y, cz + Math.sin(a) * r, ir2, -a); K.cyl(0.03, 0.03, 0.9, cx + Math.cos(a) * (r + 0.4), y, cz + Math.sin(a) * (r + 0.4), ir2, 4); } // escada em caracol
    { const y = H - 3.2; for (let q = 0; q < 3; q++) { const a = q / 3 * Math.PI * 2; const gear = K.add(new THREE.TorusGeometry(0.9, 0.18, 6, 10), brass, cx + Math.cos(a) * 2.2, y, cz + Math.sin(a) * 2.2, a); gear.rotation.x = Math.PI / 2; for (let t = 0; t < 8; t++) { const b = t / 8 * Math.PI * 2; K.add(new THREE.BoxGeometry(0.25, 0.25, 0.3), brass, cx + Math.cos(a) * 2.2 + Math.cos(b) * 1.05, y, cz + Math.sin(a) * 2.2 + Math.sin(b) * 1.05, b, false); } } }
    K.cyl(2.3, 2.3, 0.5, cx, H - 2.6, cz, ir, 12); for (let q = 0; q < 12; q++) { const a = q / 12 * Math.PI * 2; K.cyl(0.04, 0.04, 1.0, cx + Math.cos(a) * 2.3, H - 2.1, cz + Math.sin(a) * 2.3, ir2, 4); } K.add(new THREE.TorusGeometry(2.3, 0.04, 4, 24), ir2, cx, H - 1.1, cz, 0, false).rotation.x = Math.PI / 2; // galeria
    for (let q = 0; q < 8; q++) { const a = q / 8 * Math.PI * 2; K.box(0.14, 3.2, 0.14, cx + Math.cos(a) * 1.5, H - 2.1, cz + Math.sin(a) * 1.5, brass, -a); } // montantes da lanterna
    K.add(new THREE.CylinderGeometry(1.5, 1.5, 3.0, 8, 1, true), glow(0xfff0b0), cx, H - 0.6, cz, 0, false); // o vidro iluminado
    K.add(new THREE.SphereGeometry(0.7, 10, 8), glow(0xffffff), cx, H - 0.6, cz, 0, false);
    { const bg = new THREE.CylinderGeometry(0.3, 4.5, 40, 10, 1, true); bg.translate(0, -20, 0); bg.rotateZ(Math.PI / 2); /* o feixe sai da lanterna e corre ao longo de +x; gira em volta de si mesmo (world3d) */ const beam = K.add(bg, new THREE.MeshBasicMaterial({ color: 0xfff0b0, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }), cx, H - 0.6, cz, 0, false); beam.userData.beam = true; beam.userData.dyn = true; }
    K.cyl(1.7, 1.7, 0.5, cx, H + 0.9, cz, ir, 8); K.cone(1.8, 1.8, cx, H + 1.4, cz, flat(0x8a2a22), 8); K.add(new THREE.ConeGeometry(0.08, 1.4, 4), brass, cx, H + 3.9, cz, 0, false); // cúpula e para-raios
    K.cyl(0.25, 0.25, 6, cx + 2.6, H - 6, cz - 1.2, flat(0xb87333), 8); K.add(new THREE.ConeGeometry(0.5, 0.9, 8), brass, cx + 2.6, H + 0.3, cz - 1.2, 0, false); K.out.smoke.push(new THREE.Vector3(cx + 2.6, H + 0.9, cz - 1.2)); // o tubo de vapor da sirene
    K.box(4.2, 2.8, 3.2, cx - 4.4, 0, cz + 2.2, br); K.box(4.6, 0.2, 3.6, cx - 4.4, 2.8, cz + 2.2, ir); K.cone(3.0, 1.6, cx - 4.4, 3.0, cz + 2.2, flat(0x4a4e56), 4, Math.PI / 4); K.plane(0.6, 0.8, cx - 4.4, 1.5, cz + 3.81, glow(0xffc070)); // a casa do faroleiro
    K.out.glows.push({ pos: new THREE.Vector3(cx, H - 0.6, cz), color: 0xfff0b0, base: 160 }); K.out.glows.push({ pos: new THREE.Vector3(cx - 4.4, 2.0, cz + 4.0), color: 0xffc070, base: 14 });
  }
  return K.out;
}
