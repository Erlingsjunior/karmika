/* 09/11 A COPA DA ÁRVORE-MÃE — o salão dos elfos sobre os galhos (Erling: "sobe a escada, a tela muda e vamos para a parte de cima da árvore,
   um salão grande sobre os galhos onde temos a Rainha dos elfos com outros líderes que passam missões e falam do estado do mundo;
   um NPC que troca alinhamento por itens bons; coisas importantes").
   Céu aberto: um tablado orgânico de tábuas claras pousado em galhos imensos, guarda-corpo de galho trançado, lanternas azuis-claras,
   a nascente (o olho d'água que desce e alimenta a vila) no meio, o trono de madeira viva ao norte com o Véu de Runas atrás,
   as cadeiras do Conselho em arco, feixes de sol entre as folhas. Origem local (0,0) = canto noroeste; a entrada (a Passagem da Raiz) ao sul. */
import * as THREE from 'three';
import { makeFire } from './sistemas/fogo';
import { std, ink, plankTex, woodTex, ramp } from './toon3d';
import { leafTexture } from './trees3d';
import { mergeStatic } from './merge3d';
import type { Interior } from './interiors3d';

const rr = (s: number) => () => { s = (s * 16807) % 2147483647; return s / 2147483647; };

export function buildCanopyHall(seed = 11): Interior & { tick(t: number): void } {
  const W = 44, D = 36, g = new THREE.Group(), cols: [number, number, number][] = [], r = rr(seed * 31 + 7);
  const plankD = std(0xffffff, { map: plankTex(0xb09a70) }), bark = std(0xffffff, { map: woodTex(0x5a4432) }), barkL = std(0xffffff, { map: woodTex(0x7a6048) }), gold = std(0xd8c070), ivory = std(0xf0e8d8), moss = std(0x5a8a4a);
  const glow = (c: number) => new THREE.MeshBasicMaterial({ color: c, toneMapped: false });
  const add = (geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, inked = true, ry = 0) => { const b = new THREE.Mesh(geo, m); if (inked) ink(b, 0.025); b.position.set(x, y, z); b.rotation.y = ry; b.castShadow = true; b.receiveShadow = true; g.add(b); return b; };
  const solid = (x: number, z: number, rad: number) => cols.push([x, z, rad]);
  const fixtures: { x: number; y: number; z: number; c: number; i: number }[] = [];
  const light = (x: number, y: number, z: number, c: number, i: number) => fixtures.push({ x, y, z, c, i });
  const cx = W / 2, cz = D / 2;

  /* o céu em volta: um disco imenso de folhas por baixo (a copa) e o azul lá embaixo */
  { const sky = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.MeshBasicMaterial({ color: 0x6fa0c8, fog: false })); sky.rotation.x = -Math.PI / 2; sky.position.set(cx, -7, cz); g.add(sky);
    const amb = new THREE.HemisphereLight(0xdff0ff, 0x4a7a3a, 0.9); g.add(amb); const sun = new THREE.DirectionalLight(0xfff0d0, 0.9); sun.castShadow = false; sun.position.set(cx - 20, 30, cz + 10); sun.target.position.set(cx, 0, cz); g.add(sun); g.add(sun.target);
    const leafM = new THREE.MeshToonMaterial({ map: leafTexture(['#6fa66a', '#a8c870', '#4f8a5c', '#d6c46a']), alphaTest: 0.5, side: THREE.DoubleSide, gradientMap: ramp });
    for (let k = 0; k < 160; k++) { const a = r() * 6.283, rad = 20 + r() * 26, q = new THREE.Mesh(new THREE.PlaneGeometry(3 + r() * 3, 2.2 + r() * 2), leafM); q.position.set(cx + Math.cos(a) * rad, -3.5 + r() * 3 - (rad - 20) * 0.12, cz + Math.sin(a) * rad); q.rotation.set((r() - 0.5) * 1.4, r() * 3.14, (r() - 0.5) * 0.8); q.userData.dyn = true; g.add(q); }
    for (let k = 0; k < 40; k++) { const a = r() * 6.283, rad = 8 + r() * 14, q = new THREE.Mesh(new THREE.PlaneGeometry(2.5 + r() * 2.5, 1.8 + r() * 1.5), leafM); q.position.set(cx + Math.cos(a) * rad, 9 + r() * 5, cz + Math.sin(a) * rad); q.rotation.set((r() - 0.5) * 1.6, r() * 3.14, (r() - 0.5) * 0.8); q.userData.dyn = true; g.add(q); } }
  /* o tablado: disco de tábuas com lóbulos, pousado em quatro galhos-mestres que saem do tronco (ao norte) */
  const deckT = plankTex(0xd8c8a0).clone(); deckT.repeat.set(6, 6); deckT.wrapS = deckT.wrapT = THREE.RepeatWrapping; deckT.needsUpdate = true; const deck = std(0xffffff, { map: deckT });
  /* 09/11 (Erling: "o chão tem muitos elementos sobrepostos tremendo"): cada lóbulo numa altura (milímetros), o tablado não briga mais consigo mesmo */
  let lobeN = 0; const lobe = (x: number, z: number, rad: number) => { const d = new THREE.Mesh(new THREE.CircleGeometry(rad, 40), deck); d.rotation.x = -Math.PI / 2; d.position.set(x, 0.006 + (lobeN++) * 0.006, z); d.receiveShadow = true; g.add(d); const u = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad * 0.92, 0.5, 28), plankD); u.position.set(x, -0.25, z); g.add(u); };
  lobe(cx, cz, 15.5); lobe(cx - 11, cz + 7, 7); lobe(cx + 12, cz + 5, 6.5); lobe(cx, cz - 11, 8); lobe(cx, cz + 15, 5.5); /* o lóbulo da entrada, ao sul */
  const inside = (x: number, z: number) => Math.hypot(x - cx, z - cz) < 15.2 || Math.hypot(x - cx + 11, z - cz - 7) < 6.7 || Math.hypot(x - cx - 12, z - cz - 5) < 6.2 || Math.hypot(x - cx, z - cz + 11) < 7.7 || Math.hypot(x - cx, z - cz - 15) < 5.2;
  /* o tronco atrás do trono e os galhos que seguram tudo */
  add(new THREE.CylinderGeometry(4.2, 5.2, 30, 14), bark, cx, 4, -4); solid(cx, -4, 5.2);
  for (const [ax, az, len, ry, rz] of [[cx - 9, cz + 2, 26, 0.9, 0.25], [cx + 10, cz + 1, 26, -1.0, 0.25], [cx - 4, cz + 12, 22, 0.35, 0.2], [cx + 5, cz + 13, 22, -0.3, 0.2]] as number[][]) { const b = add(new THREE.CylinderGeometry(0.7, 1.4, len, 8), bark, ax, -2.6, az, true); b.rotation.set(Math.PI / 2, ry, 0); void rz; b.castShadow = false; }
  for (let k = 0; k < 6; k++) { const a = -0.5 + k * 0.6, br = add(new THREE.CylinderGeometry(0.35, 0.9, 20, 7), barkL, cx + Math.cos(a) * 5, 13 + k * 0.7, -4 + Math.sin(a) * 5, true); br.rotation.set(Math.PI / 2 - 0.35 - k * 0.05, a, 0); br.castShadow = false; }
  /* guarda-corpo de galho trançado em toda a borda (deixa a entrada ao sul aberta) */
  { const pts: THREE.Vector3[] = []; for (let i = 0; i <= 120; i++) { const a = i / 120 * 6.283; let rad = 15.0; const px = cx + Math.cos(a) * rad, pz = cz + Math.sin(a) * rad; for (const [lx, lz, lr] of [[cx - 11, cz + 7, 6.6], [cx + 12, cz + 5, 6.1], [cx, cz - 11, 7.6]]) { const d = Math.hypot(px - lx, pz - lz); if (d < lr) rad = Math.max(rad, Math.hypot(lx + (px - lx) / d * lr - cx, lz + (pz - lz) / d * lr - cz)); } pts.push(new THREE.Vector3(cx + Math.cos(a) * rad, 0, cz + Math.sin(a) * rad)); }
    for (let i = 0; i < pts.length - 1; i++) { const p = pts[i]; if (Math.abs(p.x - cx) < 2.6 && p.z > cz + 8) continue; /* a abertura da entrada */ if (i % 2 === 0) { const post = add(new THREE.CylinderGeometry(0.07, 0.1, 1.1, 5), barkL, p.x, 0.55, p.z, false); post.rotation.z = (r() - 0.5) * 0.2; } const q = pts[i + 1], mid = p.clone().lerp(q, 0.5), L = p.distanceTo(q); const rail = add(new THREE.CylinderGeometry(0.06, 0.06, L + 0.05, 5), barkL, mid.x, 1.05, mid.z, false); rail.rotation.set(0, Math.atan2(q.x - p.x, q.z - p.z), Math.PI / 2); rail.rotation.order = 'YXZ'; rail.rotation.set(0, Math.atan2(q.x - p.x, q.z - p.z), 0); rail.rotateX(Math.PI / 2);
      if (i % 6 === 0) { const lamp = add(new THREE.SphereGeometry(0.2, 8, 6), glow(0xbfe8ff), p.x, 1.5, p.z, false); void lamp; add(new THREE.TorusGeometry(0.26, 0.03, 4, 12).rotateX(Math.PI / 2), gold, p.x, 1.5, p.z, false); light(p.x, 1.7, p.z, 0x9ad8ff, 10); } } }
  /* a nascente: o olho d'água no meio, pedras musgosas, a água que verte pela borda sul e desce para a vila */
  { add(new THREE.CylinderGeometry(3.6, 3.9, 0.5, 40), std(0x8a9a80), cx, 0.25, cz + 1); const wat = new THREE.Mesh(new THREE.CircleGeometry(3.25, 40), new THREE.MeshBasicMaterial({ color: 0x3aa0c8, transparent: true, opacity: 0.85 })); wat.rotation.x = -Math.PI / 2; wat.position.set(cx, 0.46, cz + 1); g.add(wat); wat.userData.dyn = true; g.userData.water = wat; solid(cx, cz + 1, 3.9);
    for (let k = 0; k < 12; k++) { const a = k / 12 * 6.283; add(new THREE.IcosahedronGeometry(0.42 + (k % 3) * 0.12, 1), k % 2 ? moss : std(0x7a8a70), cx + Math.cos(a) * 3.75, 0.42, cz + 1 + Math.sin(a) * 3.75).scale.set(1.35, 0.55, 1.1); }
    const fall = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 6.5), new THREE.MeshBasicMaterial({ color: 0x9ad8ee, transparent: true, opacity: 0.7, side: THREE.DoubleSide })); fall.position.set(cx, -2.8, cz + 4.95); fall.userData.dyn = true; g.add(fall); g.userData.fall = fall;
    add(new THREE.CylinderGeometry(0.5, 0.6, 1.2, 8), ivory, cx, 1.0, cz + 1, true); const spout = add(new THREE.SphereGeometry(0.5, 10, 8), glow(0xd8f4ff), cx, 1.9, cz + 1, false); spout.userData.dyn = true; g.userData.spout = spout; light(cx, 2.4, cz + 1, 0xbfe8ff, 14); }
  /* o estrado e o trono de madeira viva, o Véu de Runas atrás */
  /* 09/11 (Erling: "escadaria engolindo personagem"): o estrado é meia-lua voltada para o salão, ao pé do trono, três degraus de 25 cm; ninguém anda nele (sólido), a Rainha fica de pé no alto */
  { for (let k = 0; k < 3; k++) { const rad = 5.2 - k * 1.2; add(new THREE.CylinderGeometry(rad, rad + 0.12, 0.25, 32, 1, false, -Math.PI / 2, Math.PI), plankD, cx, 0.125 + k * 0.25, cz - 12); } solid(cx, cz - 12, 4.2);
    const th = add(new THREE.CylinderGeometry(0.9, 1.1, 1.0, 10), bark, cx, 1.4, cz - 12); void th; add(new THREE.BoxGeometry(1.6, 0.25, 1.4), plankD, cx, 1.9, cz - 12);
    for (const s of [-1, 1]) { const arm = add(new THREE.CylinderGeometry(0.12, 0.2, 2.6, 6), barkL, cx + s * 1.0, 2.6, cz - 12.4, true); arm.rotation.z = s * 0.35; arm.rotation.x = -0.4; }
    for (let k = 0; k < 5; k++) { const a = -0.9 + k * 0.45, bk = add(new THREE.CylinderGeometry(0.08, 0.16, 3.4 + (2 - Math.abs(k - 2)) * 0.6, 6), barkL, cx + Math.sin(a) * 1.1, 3.4, cz - 12.9, true); bk.rotation.z = Math.sin(a) * 0.45; bk.rotation.x = -0.25; const lf = add(new THREE.SphereGeometry(0.28, 6, 5), gold, cx + Math.sin(a) * 1.8, 5.2 + (2 - Math.abs(k - 2)) * 0.3, cz - 13.6, false); lf.scale.set(1, 1.6, 0.3); }
    solid(cx, cz - 12, 1.4);
    /* o Véu: um grande arco de galhos com runas de luz, atrás do trono, contra o tronco */
    const veil = add(new THREE.TorusGeometry(4.2, 0.25, 6, 24, Math.PI), bark, cx, 2.0, cz - 14.2, true); veil.rotation.z = 0;
    for (let k = 0; k < 9; k++) { const a = Math.PI * (0.08 + 0.84 * k / 8), rune = add(new THREE.PlaneGeometry(0.45, 0.45), glow(0x9ad8ff), cx + Math.cos(a) * 4.2, 2.0 + Math.sin(a) * 4.2, cz - 13.9, false); rune.rotation.z = Math.PI / 4 + k * 0.3; }
    light(cx, 4, cz - 12, 0xbfe8ff, 18);
    /* as cadeiras do Conselho em arco diante do trono */
    for (let k = 0; k < 6; k++) { const a = Math.PI * (0.18 + 0.64 * k / 5), x = cx + Math.cos(a) * 7.2, z = cz - 9 + Math.sin(a) * 4.6; add(new THREE.CylinderGeometry(0.42, 0.5, 0.5, 8), bark, x, 0.25, z); add(new THREE.CylinderGeometry(0.46, 0.46, 0.08, 8), plankD, x, 0.54, z, false); const back = add(new THREE.BoxGeometry(0.7, 0.8, 0.1), barkL, x, 0.95, z - 0.4); back.rotation.y = -a + Math.PI / 2; solid(x, z, 0.5); } }
  /* mesas do Conselho: a Mesa do Mundo (um mapa esculpido) e a mesa da Sacerdotisa do Equilíbrio com a balança */
  { add(new THREE.CylinderGeometry(2.2, 2.4, 0.9, 12), bark, cx - 9, 0.45, cz + 2); const mapT = new THREE.Mesh(new THREE.CircleGeometry(2.1, 24), std(0x9ab070)); mapT.rotation.x = -Math.PI / 2; mapT.position.set(cx - 9, 0.92, cz + 2); g.add(mapT); for (let k = 0; k < 7; k++) add(new THREE.SphereGeometry(0.12, 6, 5), [gold, ivory, glow(0x9ad8ff)][k % 3], cx - 9 + (r() - 0.5) * 3.2, 1.0, cz + 2 + (r() - 0.5) * 3.2, false); solid(cx - 9, cz + 2, 2.4);
    add(new THREE.BoxGeometry(3.0, 0.9, 1.2), plankD, cx + 10, 0.45, cz - 1); add(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 5), gold, cx + 10, 1.5, cz - 1, false); add(new THREE.BoxGeometry(1.4, 0.04, 0.04), gold, cx + 10, 2.05, cz - 1, false); for (const s of [-1, 1]) add(new THREE.CylinderGeometry(0.28, 0.2, 0.1, 10), s < 0 ? ivory : std(0x2a2430), cx + 10 + s * 0.7, 1.7, cz - 1, false); solid(cx + 10, cz - 1, 1.5); light(cx + 10, 2.4, cz - 1, 0xffe0a0, 8); }
  /* lanternas de vela azul penduradas dos galhos e feixes de sol */
  for (const [x, z] of [[cx - 6, cz - 4], [cx + 6, cz - 4], [cx - 12, cz + 6], [cx + 12, cz + 4], [cx, cz + 9], [cx - 4, cz - 10], [cx + 4, cz - 10]]) { add(new THREE.CylinderGeometry(0.02, 0.02, 2.5, 4), std(0x3a3a30), x, 5.5, z, false); add(new THREE.CylinderGeometry(0.22, 0.26, 0.4, 6), gold, x, 4.1, z, false); const f = makeFire(0.3, 'blue', 'candle', x * 7 + z); f.position.set(x, 3.95, z); g.add(f); light(x, 4.2, z, 0x9ad8ff, 9); }
  for (let k = 0; k < 7; k++) { const beam = new THREE.Mesh(new THREE.PlaneGeometry(1.6 + r() * 1.5, 16), new THREE.MeshBasicMaterial({ color: 0xfff2c0, transparent: true, opacity: 0.08, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })); beam.position.set(cx + (r() - 0.5) * 24, 7, cz + (r() - 0.5) * 20); beam.rotation.set(0.25, r() * 3.14, 0.12); beam.userData.dyn = true; g.add(beam); }
  /* flores e musgo pelo tablado */
  for (let k = 0; k < 26; k++) { const a = r() * 6.283, rad = 4 + r() * 10, x = cx + Math.cos(a) * rad, z = cz + Math.sin(a) * rad; if (!inside(x, z)) continue; add(new THREE.SphereGeometry(0.16 + r() * 0.12, 5, 4), k % 3 ? moss : std([0xff9ab8, 0xfff0a0, 0xc0a0ff][k % 3]), x, 0.12, z, false).scale.set(1, 0.5, 1); }

  const pool: THREE.PointLight[] = []; for (let k = 0; k < 10; k++) { const l = new THREE.PointLight(0x9ad8ff, 0, 14, 1.6); g.add(l); pool.push(l); }
  const lights: { l: THREE.PointLight; base: number; ph: number }[] = []; let lastHx = -1e9, lastHz = -1e9;
  const flicker = (t: number, hx = cx, hz = cz) => {
    if (Math.hypot(hx - lastHx, hz - lastHz) > 3) { lastHx = hx; lastHz = hz; const near = [...fixtures].sort((a, b) => Math.hypot(a.x - hx, a.z - hz) - Math.hypot(b.x - hx, b.z - hz)).slice(0, pool.length); lights.length = 0; pool.forEach((l, k) => { const f = near[k]; if (!f) { l.intensity = 0; return; } l.position.set(f.x, f.y, f.z); l.color.setHex(f.c); lights.push({ l, base: f.i, ph: f.x * 3 + f.z }); }); }
    for (const l of lights) l.l.intensity = l.base * (0.92 + 0.06 * Math.sin(t * 5 + l.ph));
    const w = g.userData.water as THREE.Mesh | undefined; if (w) (w.material as THREE.MeshBasicMaterial).color.setHex(0x3aa0c8).offsetHSL(0, 0, 0.05 * Math.sin(t * 1.7));
    const f = g.userData.fall as THREE.Mesh | undefined; if (f) (f.material as THREE.MeshBasicMaterial).opacity = 0.55 + 0.15 * Math.sin(t * 9);
    const s = g.userData.spout as THREE.Mesh | undefined; if (s) s.scale.setScalar(1 + 0.12 * Math.sin(t * 3));
  };
  const free = (x: number, z: number) => {
    if (z > cz + 19.5) return Math.abs(x - cx) < 2.4; /* a Passagem da Raiz, ao sul */
    if (!inside(x, z)) return false;
    for (const [qx, qz, rad] of cols) if (Math.hypot(x - qx, z - qz) < rad) return false;
    return true;
  };
  mergeStatic(g, ramp);
  return { group: g, W, D, colliders: cols, free, flicker, exitZ: cz + 20.3, tick: (t) => flicker(t) };
}
