/** O Grande Salão de Brasaforja (27/10): a maravilha dos anões, por dentro da Montanha Negra.
 *  Um salão escavado na rocha negra: duas fileiras de colunas colossais com cintas de ouro, o chão de lajes com a passadeira
 *  dourada até o estrado do Thane, a Forja Ancestral com três fornalhas acesas e bigornas, o canal de lava que corre ao pé
 *  da parede norte e desce pelo leste (com pontes de pedra), o Tesouro do Clã numa alcova, as estátuas dos ancestrais nos
 *  nichos, lustres de ferro com velas, estandartes e as bancas do Mercado das Galerias. Origem local (0,0) = canto noroeste;
 *  saída ao sul (z > D). A câmera olha de sudeste: paredes norte e oeste altas, sul e leste baixas. */
import * as THREE from 'three';
import { std, ink, stoneTex, woodTex, plankTex, ramp } from './toon3d';
import { mergeStatic } from './merge3d';
import type { Interior } from './interiors3d';

const rr = (s: number) => () => { s = (s * 16807) % 2147483647; return s / 2147483647; };

export function buildDwarfHall(seed = 5): Interior & { lavaTick(t: number): void } {
  const W = 54, D = 42, H = 15, g = new THREE.Group(), cols: [number, number, number][] = [], rects: [number, number, number, number][] = [], r = rr(seed * 31 + 7);
  const basalt = std(0xffffff, { map: stoneTex(0x3a3634) }), basaltD = std(0xffffff, { map: stoneTex(0x2a2628) }), gold = std(0xd9b45a), iron = std(0x3a3d44), wood = std(0xffffff, { map: woodTex(0x4a3220) }), plank = std(0xffffff, { map: plankTex(0x6a4a2c) });
  const glow = (c: number) => new THREE.MeshBasicMaterial({ color: c, toneMapped: false });
  const add = (geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, inked = true, ry = 0) => { const b = new THREE.Mesh(geo, m); if (inked) ink(b, 0.03); b.position.set(x, y, z); b.rotation.y = ry; b.castShadow = true; b.receiveShadow = true; g.add(b); return b; };
  const B = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
  const box = (w: number, h: number, d: number, x: number, y: number, z: number, m: THREE.Material, ry = 0) => add(B(w, h, d), m, x, y + h / 2, z, true, ry);
  const cyl = (rt: number, rb: number, h: number, x: number, y: number, z: number, m: THREE.Material, seg = 12) => add(new THREE.CylinderGeometry(rt, rb, h, seg), m, x, y + h / 2, z);
  const solid = (x: number, z: number, rad: number) => cols.push([x, z, rad]);
  const fixtures: { x: number; y: number; z: number; c: number; i: number; dist: number }[] = [];
  const light = (x: number, y: number, z: number, c: number, i: number, dist = 16) => fixtures.push({ x, y, z, c, i, dist });
  const flame = (x: number, y: number, z: number, s = 1, c = 0xffb040) => { const f = new THREE.Mesh(new THREE.ConeGeometry(0.14 * s, 0.5 * s, 6), glow(c)); f.position.set(x, y, z); f.userData.dyn = true; g.add(f); return f; };

  // chão: lajes de basalto e a passadeira dourada do portão ao estrado; base escura em volta
  { const dark = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.MeshBasicMaterial({ color: 0x07060a })); dark.rotation.x = -Math.PI / 2; dark.position.set(W / 2, -0.08, D / 2); g.add(dark);
    const t = stoneTex(0x3a3634).clone(); t.repeat.set(W / 2.5, D / 2.5); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.needsUpdate = true; const fl = new THREE.Mesh(new THREE.PlaneGeometry(W, D), std(0xffffff, { map: t })); fl.rotation.x = -Math.PI / 2; fl.position.set(W / 2, 0, D / 2); fl.receiveShadow = true; g.add(fl);
    const run = new THREE.Mesh(new THREE.PlaneGeometry(6, D - 9), std(0x5a4a2a)); run.rotation.x = -Math.PI / 2; run.position.set(W / 2, 0.015, D / 2 + 3.5); g.add(run);
    for (const sx of [-1, 1]) { const st = new THREE.Mesh(new THREE.PlaneGeometry(0.3, D - 9), std(0xd9b45a)); st.rotation.x = -Math.PI / 2; st.position.set(W / 2 + sx * 2.9, 0.02, D / 2 + 3.5); g.add(st); }
    for (let k = 0; k < 7; k++) { const d = new THREE.Mesh(new THREE.CircleGeometry(0.9, 4), std(0xd9b45a)); d.rotation.x = -Math.PI / 2; d.position.set(W / 2, 0.02, 10 + k * 4.4); g.add(d); } }
  // paredes: norte e oeste altas (rocha escavada, com pilastras e a cornija de ouro), sul e leste baixas; o portão ao sul
  box(W + 1, H, 1.2, W / 2, 0, -0.6, basaltD); box(1.2, H, D + 1, -0.6, 0, D / 2, basaltD);
  for (let k = 0; k <= W / 6; k++) box(1.4, H, 0.8, k * 6, 0, 0.2, basalt); for (let k = 1; k <= D / 6; k++) box(0.8, H, 1.4, 0.2, 0, k * 6, basalt);
  box(W + 1, 0.5, 1.2, W / 2, H - 2.2, 0.0, gold); box(1.2, 0.5, D + 1, 0.0, H - 2.2, D / 2, gold);
  const lowH = 0.7, dw = 6; box((W - dw) / 2, lowH, 0.6, (W - dw) / 4, 0, D + 0.3, basalt); box((W - dw) / 2, lowH, 0.6, W - (W - dw) / 4, 0, D + 0.3, basalt); box(0.6, lowH, D, W + 0.3, 0, D / 2, basalt);
  for (const sx of [-1, 1]) { box(1.6, 7, 1.6, W / 2 + sx * (dw / 2 + 0.8), 0, D + 0.3, basalt); add(new THREE.OctahedronGeometry(0.5, 0), glow(0xff9a3a), W / 2 + sx * (dw / 2 + 0.8), 7.6, D + 0.3, false); light(W / 2 + sx * (dw / 2 + 0.8), 7.4, D - 0.5, 0xff9a3a, 30, 14); }
  // colunas colossais (duas fileiras), com cintas de ouro e braseiros ao pé
  for (let k = 0; k < 5; k++) for (const sx of [-1, 1]) { const x = W / 2 + sx * 8, z = 9 + k * 7.2; cyl(1.25, 1.5, H, x, 0, z, basalt, 14); cyl(1.9, 1.9, 0.9, x, 0, z, basaltD, 14); cyl(1.6, 1.6, 0.35, x, H - 2.6, z, gold, 14); cyl(1.6, 1.6, 0.35, x, 4.2, z, gold, 14);
    for (let q = 0; q < 4; q++) { const a = q / 4 * Math.PI * 2 + 0.4; add(B(0.4, 0.4, 0.08), glow(0xff8a3a), x + Math.cos(a) * 1.46, 2.6, z + Math.sin(a) * 1.46, false, -a + Math.PI / 2); }
    solid(x, z, 1.95);
    if (k % 2 === 0) { const bx = x + sx * 2.6, bz = z; cyl(0.5, 0.35, 0.9, bx, 0, bz, iron, 8); cyl(0.7, 0.5, 0.3, bx, 0.9, bz, iron, 8); flame(bx, 1.45, bz, 1.8); flame(bx + 0.2, 1.35, bz - 0.15, 1.2, 0xff6a2a); light(bx, 1.8, bz, 0xff8a3a, 40, 14); solid(bx, bz, 0.8); } }
  // lustres de ferro com velas, pendurados nas vigas
  for (let k = 0; k < 3; k++) { const x = W / 2, z = 12 + k * 10; add(new THREE.CylinderGeometry(0.03, 0.03, H - 7, 4), iron, x, H - 3.5, z, false); const ring = add(new THREE.TorusGeometry(2.2, 0.1, 6, 18), iron, x, 7, z, false); ring.rotation.x = Math.PI / 2;
    for (let q = 0; q < 10; q++) { const a = q / 10 * Math.PI * 2; add(new THREE.CylinderGeometry(0.06, 0.06, 0.4, 5), std(0xe8dcc0), x + Math.cos(a) * 2.2, 7.25, z + Math.sin(a) * 2.2, false); flame(x + Math.cos(a) * 2.2, 7.55, z + Math.sin(a) * 2.2, 0.5); } light(x, 6.5, z, 0xffb060, 36, 20); }
  // o fundo do salão (Erling, 27/10): o trono suntuoso aos pés da Forja-Mãe, que recebe a lava incandescente caindo dos dutos vindos dos veios da montanha;
  // acima, o Coração da Montanha Negra, a pedra azul (que às vezes avermelha), em ogiva e losango, encravada entre as pontas dos machados de dois anões colossais
  const lavaM = new THREE.MeshBasicMaterial({ color: 0xff6a1a, toneMapped: false }); const lavas: THREE.Mesh[] = [];
  const heart = new THREE.MeshBasicMaterial({ color: 0x4aa0ff, toneMapped: false }); let heartMesh: THREE.Mesh | null = null;
  { const cx = W / 2, z0 = 5.5;
    for (let s0 = 0; s0 < 3; s0++) box(22 - s0 * 2.4, 0.45, 8 - s0 * 1.4, cx, s0 * 0.45, z0 + 4 - s0 * 0.7, s0 % 2 ? basaltD : basalt);
    rects.push([cx - 11, -1, cx + 11, z0 + 0.8]); // a Forja-Mãe e o fundo do estrado não se pisam
    // o trono: pedestal, assento alto de basalto com ouro, braços, encosto em ogiva com runas e dossel de ferro
    box(4.2, 0.5, 3.2, cx, 1.35, z0 + 2.6, basaltD); box(2.4, 1.0, 1.6, cx, 1.85, z0 + 2.6, basaltD); box(2.8, 4.6, 0.7, cx, 1.85, z0 + 1.7, basalt); add(new THREE.CylinderGeometry(0, 1.5, 1.6, 4), gold, cx, 1.85 + 4.6 + 0.8, z0 + 1.7, true, Math.PI / 4);
    for (const sx of [-1, 1]) { box(0.5, 1.6, 1.8, cx + sx * 1.45, 1.85, z0 + 2.6, gold); cyl(0.14, 0.14, 5.2, cx + sx * 2.3, 1.85, z0 + 1.4, iron, 6); } box(5.2, 0.3, 2.2, cx, 7.0, z0 + 1.6, iron); add(new THREE.PlaneGeometry(2.0, 1.2), std(0x7a1a1e, { side: THREE.DoubleSide }), cx, 6.3, z0 + 2.3, false);
    for (let q = 0; q < 5; q++) add(B(0.3, 0.3, 0.1), glow(0xffd27a), cx - 0.9 + q * 0.45, 4.2 + Math.abs(2 - q) * 0.4, z0 + 2.07, false); light(cx, 4.5, z0 + 3.5, 0xffb060, 44, 16); solid(cx, z0 + 2.4, 2.4);
    // a Forja-Mãe: o maciço de basalto com a boca de fogo em arco, a bacia de fusão no alto, os três dutos de lava vindos da rocha e as quedas incandescentes
    const fz = 2.4; box(15, 8, 5.2, cx, 1.35, fz, basaltD); box(16, 0.8, 6.2, cx, 9.35, fz, basalt); box(12.6, 6.2, 0.5, cx, 2.2, fz + 2.8, basalt);
    add(new THREE.CylinderGeometry(2.4, 2.4, 0.6, 14, 1, false, 0, Math.PI), basalt, cx, 7.6, fz + 2.95, true).rotation.set(Math.PI / 2, 0, 0); // o arco da boca
    const mouth = add(B(4.6, 4.6, 0.3), glow(0xff5a1a), cx, 5.2, fz + 2.9, false); mouth.userData.dyn = true; lavas.push(mouth); flame(cx - 1.2, 5.2, fz + 3.2, 3.2, 0xff8a2a); flame(cx + 0.8, 5.6, fz + 3.2, 2.6); flame(cx + 1.8, 4.6, fz + 3.2, 2.0, 0xffb040); light(cx, 6.5, fz + 4.5, 0xff6a2a, 90, 26);
    for (let q = 0; q < 2; q++) cyl(2.2, 2.6, 0.9 + q * 0.8, cx, 10.15 - q * 0.3, fz, basaltD, 14); const basin = new THREE.Mesh(new THREE.CircleGeometry(2.0, 14), lavaM); basin.rotation.x = -Math.PI / 2; basin.position.set(cx, 11.2, fz); basin.userData.dyn = true; g.add(basin); lavas.push(basin); light(cx, 12.2, fz + 1, 0xff6a1a, 60, 20);
    for (const [dx, h0] of [[-6, 12.2], [0, 13.4], [6, 12.2]] as [number, number][]) { const x0 = cx + dx, L = 7.5; const duct = add(B(1.1, 0.9, L), basalt, x0 * 0.4 + cx * 0.6, h0 + 1.2, fz - 3.6, true); duct.rotation.set(-0.32, Math.atan2(dx, -8) * 0.5, 0); duct.rotation.x = -0.32;
      const lv = new THREE.Mesh(new THREE.PlaneGeometry(0.6, L - 0.6), lavaM); lv.position.copy(duct.position); lv.position.y += 0.47; lv.rotation.copy(duct.rotation); lv.rotateX(-Math.PI / 2); lv.userData.dyn = true; g.add(lv); lavas.push(lv);
      const fall = new THREE.Mesh(new THREE.BoxGeometry(0.45, 2.6, 0.45), lavaM); fall.position.set(cx + dx * 0.35, 11.2 + 1.3, fz - 0.9); fall.userData.dyn = true; g.add(fall); lavas.push(fall); }
    for (let q = 0; q < 18; q++) { const a = q / 18 * Math.PI * 2; add(new THREE.SphereGeometry(0.12, 5, 4), gold, cx + Math.cos(a) * 7.6, 1.35 + 1.5 + Math.abs(Math.sin(a)) * 5.5, fz + 2.65, false); } // rebites de ouro na face
    rects.push([cx - 8.2, -1, cx + 8.2, fz + 3.2]);
    // os dois anões colossais (colunas esculpidas) com os machados erguidos, um para o outro; o Coração encravado entre as pontas
    for (const sx of [-1, 1]) { const x = cx + sx * 10.5, z = 2.2, m = basalt; cyl(1.9, 2.2, 1.0, x, 0, z, basaltD, 10); box(1.3, 2.0, 1.5, x - 0.9, 1.0, z, m); box(1.3, 2.0, 1.5, x + 0.9, 1.0, z, m); box(3.6, 4.2, 2.4, x, 3.0, z, m); box(4.2, 1.1, 2.7, x, 7.2, z, m); add(new THREE.SphereGeometry(1.3, 9, 7), m, x, 9.3, z, true); box(2.6, 1.2, 2.4, x, 9.8, z, iron); box(1.9, 2.4, 0.9, x, 5.0, z + 1.4, basaltD); for (let k = 0; k < 3; k++) box(0.5, 0.4, 0.3, x - 0.5 + k * 0.5, 4.4 - k * 0.3, z + 1.85, gold);
      const ax = x - sx * 2.5; cyl(0.22, 0.26, 7.6, ax, 2.4, z + 0.6, wood, 6); box(1.3, 0.5, 0.5, ax, 6.4, z + 0.6, basaltD); // o cabo, segurado pelas mãos
      const blade = add(new THREE.CylinderGeometry(0, 1.6, 2.4, 3), std(0xb8bcc4), ax - sx * 0.9, 10.4, z + 0.6, true); blade.rotation.z = sx * Math.PI / 4; // a lâmina de aço, de ponta virada para o centro (90°)
      solid(x, z, 2.4); light(x, 8, z + 3, 0xffb060, 22, 14); }
    heartMesh = new THREE.Mesh(new THREE.OctahedronGeometry(1.5, 0), heart); heartMesh.scale.set(1, 1.75, 0.8); heartMesh.position.set(cx, 11.6, 2.8); heartMesh.userData.dyn = true; g.add(heartMesh);
    const halo = new THREE.Mesh(new THREE.OctahedronGeometry(1.9, 0), new THREE.MeshBasicMaterial({ color: 0x4aa0ff, transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending })); halo.scale.copy(heartMesh.scale); halo.position.copy(heartMesh.position); halo.userData.dyn = true; g.add(halo); (heartMesh as THREE.Mesh & { halo: THREE.Mesh }).halo = halo;
    light(cx, 11.6, 4.2, 0x4aa0ff, 70, 30);
    for (const sx of [-1, 1]) { const x = cx + sx * 16; add(new THREE.PlaneGeometry(2.4, 7), std(0x7a1a1e, { side: THREE.DoubleSide }), x, H - 5.6, 0.75, false); add(new THREE.PlaneGeometry(1.2, 1.2), std(0xd9b45a, { side: THREE.DoubleSide }), x, H - 6.2, 0.78, false); box(2.8, 0.14, 0.14, x, H - 2.1, 0.8, iron); } }
  // diamantes e esmeraldas cintilando nas paredes de rocha (norte e oeste)
  { const gemC = [0x8ad0ff, 0x4aff9a, 0xc8f0ff, 0x6affc0]; for (let k = 0; k < 44; k++) { const onN = r() < 0.5, c = gemC[k % 4], y = 2 + r() * (H - 4); const m = add(new THREE.OctahedronGeometry(0.18 + r() * 0.2, 0), glow(c), onN ? 2 + r() * (W - 4) : 0.55, y, onN ? 0.55 : 2 + r() * (D - 4), false); m.userData.dyn = true; m.userData.gem = c;
      if (k % 6 === 0) light(onN ? m.position.x : 1.2, y, onN ? 1.2 : m.position.z, c, 10, 7); } }
  // a Forja Ancestral (oeste): três fornalhas abertas com brasas, coifas, bigornas, tonéis de têmpera e ferramentas
  for (let k = 0; k < 3; k++) { const z = 12 + k * 9, x = 3.2; box(4.2, 3.2, 3.0, x, 0, z, basaltD); box(2.4, 1.4, 0.4, x + 0.3, 0.6, z + 1.6, std(0x0a0605)); box(4.6, 2.2, 3.4, x, 3.2, z, basalt); cyl(0.7, 0.9, H - 5.4, x, 5.4, z, basaltD, 8);
    const coals = add(B(2.2, 0.3, 1.0), glow(0xff5a1a), x + 0.3, 0.9, z + 1.3, false); coals.userData.dyn = true; flame(x, 1.5, z + 1.4, 1.6, 0xff7a2a); flame(x + 0.6, 1.4, z + 1.3, 1.1); light(x + 1, 1.6, z + 2.2, 0xff6a2a, 55, 16); rects.push([0.6, z - 1.6, 5.4, z + 1.7]);
    box(0.5, 0.6, 1.1, x + 4.2, 0, z + 1.5, iron); box(1.4, 0.3, 0.5, x + 4.2, 0.6, z + 1.5, iron); solid(x + 4.2, z + 1.5, 0.7);
    cyl(0.5, 0.45, 0.9, x + 5.8, 0, z - 0.6, wood, 10); add(new THREE.CircleGeometry(0.45, 10), std(0x3a6a8a), x + 5.8, 0.91, z - 0.6, false).rotation.x = -Math.PI / 2; solid(x + 5.8, z - 0.6, 0.55);
    for (let q = 0; q < 4; q++) box(0.12, 1.1, 0.12, x - 1.6 + q * 0.5, 0, z + 2.2, iron); }
  // o canal de lava: ao pé da parede norte e descendo pelo leste, com pontes de laje; a lava pulsa (lavaTick)
  const trench = (x0: number, z0: number, x1: number, z1: number) => { const w = x1 - x0, d = z1 - z0; box(w, 0.5, 0.25, (x0 + x1) / 2, 0, z0, basaltD); box(w, 0.5, 0.25, (x0 + x1) / 2, 0, z1, basaltD); box(0.25, 0.5, d, x0, 0, (z0 + z1) / 2, basaltD); box(0.25, 0.5, d, x1, 0, (z0 + z1) / 2, basaltD);
    const l = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.3, d - 0.3), lavaM); l.rotation.x = -Math.PI / 2; l.position.set((x0 + x1) / 2, 0.12, (z0 + z1) / 2); l.userData.dyn = true; g.add(l); lavas.push(l); rects.push([x0 - 0.2, z0 - 0.2, x1 + 0.2, z1 + 0.2]);
    for (let k = 0; k < Math.max(w, d) / 6; k++) light(x0 + (w > d ? 3 + k * 6 : w / 2), 0.8, z0 + (d > w ? 3 + k * 6 : d / 2), 0xff6a1a, 30, 12); };
  trench(W / 2 + 10, 0.9, W - 1.2, 2.9); { let z = 2.9; for (const bz of [12, 24, 34, D - 6]) { if (bz - 1.3 > z + 0.5) trench(W - 3.2, z, W - 1.2, bz - 1.3); z = bz + 1.3; } }
  for (const z of [12, 24, 34]) box(3.2, 0.3, 2.6, W - 2.2, 0.5, z, basalt); // as pontes de laje sobre a lava
  // o Tesouro do Clã (alcova leste): pilhas de ouro, baús, cristais acesos, grade de ferro aberta
  { const x = W - 8, z = 9; box(10, 0.3, 7, x, 0, z, basaltD); for (let k = 0; k < 7; k++) { const px = x - 4 + r() * 8, pz = z - 2.6 + r() * 5; add(new THREE.ConeGeometry(0.5 + r() * 0.7, 0.5 + r() * 0.6, 7), gold, px, 0.55, pz); }
    for (let k = 0; k < 3; k++) { const px = x - 3.5 + k * 3.2, pz = z + 2.6; box(1.1, 0.6, 0.7, px, 0.3, pz, plank); box(1.15, 0.2, 0.75, px, 0.9, pz, iron); solid(px, pz, 0.7); }
    for (let k = 0; k < 4; k++) { const px = x - 4 + k * 2.7, pz = z - 3; add(new THREE.OctahedronGeometry(0.45 + (k % 2) * 0.2, 0), glow([0x8ad0ff, 0xd0ff8a, 0xff8ad0, 0xffd27a][k]), px, 1.1 + (k % 2) * 0.3, pz, false); light(px, 1.3, pz, [0x8ad0ff, 0xd0ff8a, 0xff8ad0, 0xffd27a][k], 18, 8); }
    for (const sx of [-1, 1]) box(0.3, 3.4, 0.3, x + sx * 5.2, 0.3, z + 3.8, iron); for (let k = 0; k < 6; k++) box(0.08, 3.0, 0.08, x - 5 + k * 0.5, 0.3, z + 3.8, iron); solid(x - 4, z + 3.8, 1.8); }
  // as estátuas dos ancestrais nos nichos da parede oeste e norte
  for (let k = 0; k < 4; k++) { const z = 7 + k * 9.5 + 3, x = 1.6; box(2.2, 4.8, 0.3, x, 0.2, z, basaltD); cyl(0.6, 0.7, 0.5, x, 0.2, z + 0.4, basaltD, 8); box(0.9, 1.5, 0.6, x, 0.7, z + 0.4, basalt); box(0.7, 0.5, 0.5, x, 2.2, z + 0.4, basalt); add(new THREE.SphereGeometry(0.33, 7, 5), basalt, x, 3.0, z + 0.4, true); box(0.6, 0.9, 0.3, x, 1.1, z + 0.8, std(0x8a8a90)); box(0.16, 1.9, 0.16, x + 0.6, 0.8, z + 0.6, wood); }
  // (os nichos do norte deram lugar à Forja-Mãe)
  // o Mercado das Galerias (sudeste): bancas com toldo, barris, caixas e sacos
  for (let k = 0; k < 3; k++) { const x = W - 10 + (k % 2) * 5, z = D - 9 - k * 4; box(2.6, 0.9, 1.2, x, 0, z, plank); box(2.8, 0.1, 1.4, x, 0.9, z, wood); for (const sx of [-1, 1]) box(0.1, 2.4, 0.1, x + sx * 1.3, 0, z - 0.6, wood); add(new THREE.PlaneGeometry(3.0, 1.6), std([0x8a3b2e, 0x3a5a8a, 0x5a7a3a][k], { side: THREE.DoubleSide }), x, 2.3, z - 0.3, false).rotation.x = -0.5; solid(x, z, 1.5);
    cyl(0.36, 0.32, 0.9, x + 2.1, 0, z + 0.8, wood, 10); box(0.7, 0.7, 0.7, x - 2.1, 0, z + 0.6, plank); for (let q = 0; q < 3; q++) add(new THREE.SphereGeometry(0.22, 6, 5), std([0xc9a24a, 0x8ad0ff, 0xd0ff8a][q]), x - 0.8 + q * 0.7, 1.15, z, false); }
  // tochas de parede ao longo do salão
  for (let k = 0; k < 6; k++) { const z = 5 + k * 6.5; cyl(0.1, 0.12, 0.6, 1.0, 3.2, z, iron, 6); flame(1.0, 4.0, z, 1.2); light(1.3, 4.0, z, 0xffa050, 26, 12); }
  for (let k = 0; k < 7; k++) { const x = 5 + k * 7; cyl(0.1, 0.12, 0.6, x, 3.2, 1.0, iron, 6); flame(x, 4.0, 1.0, 1.2); light(x, 4.0, 1.3, 0xffa050, 26, 12); }

  // luzes: um pool de 10 fontes que acompanha quem anda (como na Catedral); a lava pulsa; as brasas respiram
  { const amb = new THREE.HemisphereLight(0xffb070, 0x2a1810, 0.55); g.add(amb); } // o brilho das brasas e do ouro enche o salão (sem isso ficava uma caverna escura)
  for (const f of fixtures) f.i *= 1.5;
  const pool: THREE.PointLight[] = []; for (let k = 0; k < 10; k++) { const l = new THREE.PointLight(0xffb060, 0, 14, 1.6); g.add(l); pool.push(l); }
  const lights: { l: THREE.PointLight; base: number; ph: number }[] = []; let lastHx = -1e9, lastHz = -1e9;
  const flicker = (t: number, hx = W / 2, hz = D / 2) => {
    if (Math.hypot(hx - lastHx, hz - lastHz) > 3) { lastHx = hx; lastHz = hz; const near = [...fixtures].sort((a, b) => Math.hypot(a.x - hx, a.z - hz) - Math.hypot(b.x - hx, b.z - hz)).slice(0, pool.length); lights.length = 0; pool.forEach((l, k) => { const f = near[k]; if (!f) { l.intensity = 0; return; } l.position.set(f.x, f.y, f.z); l.color.setHex(f.c); l.distance = f.dist; lights.push({ l, base: f.i, ph: k * 1.7 }); }); }
    for (const l of lights) l.l.intensity = l.base * (0.9 + 0.1 * Math.sin(t * 9 + l.ph) + 0.05 * Math.sin(t * 23 + l.ph * 2));
    lavaM.color.setHex(0xff6a1a).offsetHSL(0, 0, 0.06 * Math.sin(t * 1.3));
    if (heartMesh) { const k = Math.max(0, Math.sin(t * 0.35)) ** 6; heart.color.setHex(0x4aa0ff).lerp(new THREE.Color(0xff4a3a), k); ((heartMesh as THREE.Mesh & { halo: THREE.Mesh }).halo.material as THREE.MeshBasicMaterial).color.copy(heart.color); heartMesh.rotation.y = t * 0.25; heartMesh.scale.set(1 + 0.03 * Math.sin(t * 2), 1.75 + 0.05 * Math.sin(t * 2), 0.8); }
    void lavas;
  };
  const free = (x: number, z: number) => {
    if (x < 0.5 || x > W - 0.5 || z < 0.5) return false;
    if (z > D - 0.1) return Math.abs(x - W / 2) < dw / 2 - 0.3;
    for (const [cx, cz, rad] of cols) if (Math.abs(x - cx) < rad && Math.abs(z - cz) < rad && Math.hypot(x - cx, z - cz) < rad) return false;
    for (const [x0, z0, x1, z1] of rects) if (x > x0 && x < x1 && z > z0 && z < z1) return false;
    return true;
  };
  mergeStatic(g, ramp);
  return { group: g, W, D, colliders: cols, free, flicker, exitZ: D + 0.9, lavaTick: (t) => flicker(t) };
}
