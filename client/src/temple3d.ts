import * as THREE from 'three';
import { std, ink, stoneTex, shingleTex, woodTex, gableRoof, scaleUV } from './toon3d';
import { vitral, lancetPts, TEMAS, type Tam } from './vitrais';

/** Templo / igreja gótica simples: nave, contrafortes, janelas ogivais, torre sineira com pináculo.
 *  ruined=true → igreja abandonada (teto quebrado, torre truncada, vitrais apagados, hera). Porta na face +z. */
export function buildTemple(Wm: number, Dm: number, wallC: number, roofC: number, ruined: boolean, glass: THREE.MeshBasicMaterial, seed = 0): { group: THREE.Group; glow: THREE.Vector3 } {
  void glass;
  const g = new THREE.Group();
  const sm = (c = wallC) => { const m = std(0xffffff, { map: stoneTex(c) }); return m; };
  const box = (w: number, h: number, d: number, x: number, y: number, z: number, m: THREE.Material, inked = true) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); if (inked) ink(b, 0.05); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; g.add(b); return b; };
  const bw = Wm - 0.6, bd = Dm - 0.4, wallH = ruined ? 5.2 : 6.4, cx = Wm / 2, cz = Dm / 2;
  // base e degraus
  box(Wm - 0.1, 0.35, Dm - 0.1, cx, 0.17, cz, sm(0x58544c));
  // nave
  const nave = box(bw - 3.2, wallH, bd, cx + 1.6, wallH / 2 + 0.35, cz, sm());
  scaleUV(nave.geometry, 3, 3);
  // torre (canto frontal esquerdo)
  const tw = 3.0, tH = ruined ? 8.2 : 12.5, tx = 0.35 + tw / 2 + 0.2, tz = Dm - 0.2 - tw / 2;
  const tower = box(tw, tH, tw, tx, tH / 2 + 0.35, tz, sm(wallC)); scaleUV(tower.geometry, 2, 5);
  // contrafortes
  // sem contrafortes: as paredes ficam limpas e os vitrais respiram (o Erling achou os pilares ao lado das janelas grotescos)
  // telhado
  const nw = bw - 3.2;
  if (!ruined) {
    const roof = gableRoof(nw, bd, 3.2, 0.5, roofC, wallC, false); roof.position.set(cx + 1.6, wallH + 0.35, cz); g.add(roof);
    // pináculo da torre
    const sp = new THREE.Mesh(new THREE.ConeGeometry(tw * 0.78, 5.2, 4), std(0xffffff, { map: shingleTex(roofC) })); ink(sp, 0.05); sp.position.set(tx, tH + 0.35 + 2.6, tz); sp.rotation.y = Math.PI / 4; sp.castShadow = true; g.add(sp);
    // cruz/símbolo
    const cr = std(0xe2c36a); const v = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.1, 0.1), cr), h = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 0.1), cr);
    v.position.set(tx, tH + 0.35 + 5.7, tz); h.position.set(tx, tH + 0.35 + 6.0, tz); g.add(v, h);
    // sino
    const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.55, 0.8, 8), std(0xc9a24a)); bell.position.set(tx, tH - 0.9, tz); g.add(bell);
    for (const s of [-1, 1]) { const op = box(0.05, 1.8, 1.2, tx + s * (tw / 2 + 0.01), tH - 1.0, tz, std(0x07060a), false); void op; }
  } else {
    // vigas e telhas restantes, buraco no teto
    const roof = gableRoof(nw, bd, 3.2, 0.4, roofC, wallC, false); roof.position.set(cx + 1.6, wallH + 0.35, cz); roof.scale.set(1, 0.9, 0.5); roof.position.z = cz - bd * 0.25; g.add(roof);
    for (let i = 0; i < 5; i++) { const bm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.25, bd * 0.6), std(0xffffff, { map: woodTex(0x3a2a1c) })); bm.position.set(cx + 1.6 - nw / 2 + 0.6 + i * (nw - 1.2) / 4, wallH + 1.1 + (i % 2) * 0.5, cz + bd * 0.2); bm.rotation.set(0.1 * (i - 2), 0, (i % 3 - 1) * 0.25); g.add(bm); }
    // topo da torre quebrado
    for (let i = 0; i < 6; i++) { const a = i * 1.05, s = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5 + (i % 3) * 0.5, 0.7), sm()); s.position.set(tx + Math.cos(a) * 1.1, tH + 0.35 + 0.25 + (i % 3) * 0.25, tz + Math.sin(a) * 1.1); g.add(s); }
    // escombros
    for (let i = 0; i < 9; i++) { const s = new THREE.Mesh(new THREE.DodecahedronGeometry(0.25 + (i % 3) * 0.12, 0), sm(0x6a665e)); s.position.set(cx + 4.8 + (i % 3) * 0.6, 0.3, 1 + i * 0.7); s.rotation.set(i, i * 2, 0); s.castShadow = true; g.add(s); }
    // hera
    const iv = new THREE.MeshToonMaterial({ color: 0x3f6a34, gradientMap: undefined });
    for (let i = 0; i < 14; i++) { const l = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3 + (i % 3) * 0.1, 0), iv); l.position.set(0.5 + (i * 0.7) % (Wm - 1), 0.5 + (i * 0.53) % 3.6, i % 2 ? Dm - 0.1 : 0.5); l.scale.set(1, 1, 0.5); g.add(l); }
  }
  // portal ogival de verdade: arco de pedra em volta, duas folhas de madeira escura com cintas de ferro, nada de janela por cima da porta
  const dx = cx + 1.6, front = cz + bd / 2, dW = 2.1, dH = 3.7;
  { const outer = new THREE.Shape(lancetPts(dW + 0.8, dH + 0.6)), hole = new THREE.Path(lancetPts(dW, dH).map((p) => new THREE.Vector2(p.x, p.y)));
    outer.holes.push(hole);
    const portal = new THREE.Mesh(new THREE.ExtrudeGeometry(outer, { depth: 0.32, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 1, curveSegments: 12 }), sm(0x8a867e)); ink(portal, 0.04); portal.position.set(dx, 0.35, front - 0.02); portal.castShadow = true; g.add(portal);
    // fundo escuro do vão (a parede não aparece dentro da porta)
    const back = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(lancetPts(dW, dH)), 12), std(0x07060a)); back.position.set(dx, 0.35, front + 0.005); g.add(back);
    const wood = std(0xffffff, { map: woodTex(ruined ? 0x2a1c12 : 0x4a2c18) }), iron = std(0x2a2a30);
    if (!ruined || true) for (const sx of [-1, 1]) { // duas folhas
      const L = lancetPts(dW, dH), apex = L.reduce((m, p) => p.y > m.y ? p : m, L[0]), half = sx < 0 ? L.filter((p) => p.x < -0.001 && p.y > 0.001) : L.filter((p) => p.x > 0.001 && p.y > 0.001);
      half.sort((a2, b2) => sx < 0 ? b2.y - a2.y : a2.y - b2.y); // esquerda: do alto para baixo; direita: de baixo para o alto
      const leaf = new THREE.Shape(sx < 0 ? [new THREE.Vector2(0, 0), new THREE.Vector2(0, apex.y), ...half, new THREE.Vector2(-dW / 2, 0)] : [new THREE.Vector2(0, 0), new THREE.Vector2(dW / 2, 0), ...half, new THREE.Vector2(0, apex.y)]);
      const lg = new THREE.Mesh(new THREE.ExtrudeGeometry(leaf, { depth: 0.08, bevelEnabled: false, curveSegments: 10 }), wood); lg.position.set(dx, 0.35, front + 0.03);
      if (ruined && sx < 0) { lg.rotation.y = -1.0; lg.position.x = dx - dW / 2; lg.geometry.translate(dW / 2, 0, 0); } // folha arrombada na igreja abandonada
      g.add(lg);
      if (!(ruined && sx < 0)) { for (const y of [0.8, 2.4]) { const band = new THREE.Mesh(new THREE.BoxGeometry(dW / 2 - 0.12, 0.09, 0.03), iron); band.position.set(dx + sx * dW / 4, 0.35 + y, front + 0.13); g.add(band); }
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.025, 5, 12), iron); ring.position.set(dx + sx * 0.22, 0.35 + 1.6, front + 0.14); g.add(ring); }
    }
  }
  // degraus
  for (let i = 0; i < 3; i++) box(3.6 + i * 0.5, 0.18, 0.7, dx, 0.1 + 0.15 * (2 - i), Dm + 0.05 + (2 - i) * 0.35, sm(0x6a665e), false);
  // vitrais (12 desenhos: 4 histórias × 3 tamanhos), distribuídos pelas paredes conforme o tamanho do templo
  const mode = ruined ? 'ruin' : 'out', stone = sm(0x8a867e);
  let k = Math.abs(Math.round(seed)) % 4; const nextT = () => TEMAS[(k++) % 4];
  const put = (sz: Tam, x: number, y: number, z: number, ry: number, sc = 1) => { const v = vitral(nextT(), sz, stone, mode, sc); v.position.set(x, y, z); v.rotation.y = ry; g.add(v); };
  // rosácea no frontão, bem acima da porta
  put('g', dx, wallH + 0.35 + 0.15, front + 0.03, 0, Math.min(0.85, nw / 7));
  // lado leste (+x): uma janela entre cada par de contrafortes
  const sideX = cx + 1.6 + nw / 2 + 0.01;
  for (let i = 0; i < 2; i++) put('m', sideX, 1.5, 1.2 + (i + 0.5) * (bd - 2.4) / 2, Math.PI / 2, 0.95);
  // lado oeste (-x), na parte da nave que a torre não cobre
  const westX = cx + 1.6 - nw / 2 - 0.01, freeZ = tz - tw / 2 - 1.2;
  if (freeZ > 2.4) put('m', westX, 1.5, freeZ / 2 + 0.3, -Math.PI / 2, 0.95);
  // fundos (-z): um médio no meio e dois pequenos
  put('m', cx + 1.6, 1.6, 0.18, Math.PI, 1);
  if (nw > 5.2) for (const s2 of [-1, 1]) put('p', cx + 1.6 + s2 * nw * 0.3, 2.0, 0.18, Math.PI, 1);
  // torre: pequenos na frente e no lado
  put('p', tx, tH * 0.42, tz + tw / 2 + 0.01, 0, 0.9); put('p', tx - tw / 2 - 0.01, tH * 0.42, tz, -Math.PI / 2, 0.9);
  const lp = new THREE.Vector3(dx, 3.0, Dm + 1.2);
  if (!ruined) { for (const s of [-1, 1]) { // tochas de braseiro na entrada
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.8, 6), std(0x3a2a1c)); pole.position.set(dx + s * 2.3, 0.9, Dm + 0.9); g.add(pole);
    const fl = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.5, 6), new THREE.MeshBasicMaterial({ color: 0xffd07a })); fl.position.set(dx + s * 2.3, 2.05, Dm + 0.9); g.add(fl); } }
  return { group: g, glow: lp };
}
