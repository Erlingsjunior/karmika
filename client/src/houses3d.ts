import { artMesh, artReady } from './arte3d';
import * as THREE from 'three';
import { std, ink, texBox, plankTex, stoneTex, plasterTex, plasterTexV, woodTex, gableRoof, scaleUV, brickTex } from './toon3d';

/** onde fica a porta da frente de cada modelo de casa (coordenadas locais da casa, chão): a luz da porta usa isto */
export function houseDoor(variant: number, Wm: number, Dm: number): { x: number; z: number; y: number; w: number; h: number } {
  const bw = Wm - 0.5, bd = Dm - 0.5, cx = Wm / 2, cz = Dm / 2, front = cz + bd / 2;
  if (variant === 9) return { x: cx, z: Dm * 0.66 + 0.02, y: 0.75, w: 1.2, h: 2.2 }; /* o chalé do jogador (buildChalet) */
  if (variant === 0) return { x: cx - bw * 0.2, z: front + 0.02, y: 0, w: 1.25, h: 2.2 };
  if (variant === 1) return { x: cx - bw * 0.25, z: front + 0.04, y: 0, w: 1.25, h: 2.2 };
  if (variant === 2) return { x: cx + bw * 0.2, z: cz + bd * 0.18 + bd * 0.29 + 0.04, y: 0.35, w: 1.25, h: 2.2 };
  if (variant === 3) return { x: cx, z: cz + Math.min(bd, 4.2) / 2 + 0.02, y: 0, w: 1.2, h: 2.1 };
  if (variant === 40) return { x: cx, z: front + 0.06, y: 0, w: 2.1, h: 2.7 }; if (variant === 41) return { x: cx, z: front + 0.75, y: 0, w: 2.4, h: 3.1 };
  if (variant === 5) return { x: cx - bw * 0.1, z: front + 0.04, y: 0, w: 1.7, h: 2.4 };
  return { x: cx - bw * 0.15, z: front + 0.04, y: 0, w: 1.5, h: 2.3 };
}
export interface HouseOut { group: THREE.Group; chimneys: THREE.Vector3[]; lantern: THREE.Vector3 }
interface Ctx { windows: THREE.MeshBasicMaterial; rnd: () => number; /** 08/11: loja (casa com placa pendurada): chave do comércio */ shop?: string }

const dark = std(0x0c0a0e);
const timberM = () => std(0xffffff, { map: woodTex(0x4a3220) });

/** janela com moldura, venezianas, caixilho e (às vezes) vidro quebrado e tábuas */
function windowAt(parent: THREE.Object3D, x: number, y: number, z: number, face: 'z' | 'x', broken: boolean, c: Ctx, wmat: THREE.MeshBasicMaterial) {
  const g = new THREE.Group(); g.position.set(x, y, z); if (face === 'x') g.rotation.y = Math.PI / 2;
  const fw = 0.95, fh = 1.15;
  const fm = timberM();
  for (const [bx, by, bw, bh] of [[0, fh / 2, fw + 0.16, 0.1], [0, -fh / 2, fw + 0.2, 0.12], [-fw / 2, 0, 0.1, fh], [fw / 2, 0, 0.1, fh]]) { const b = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, 0.12), fm); b.position.set(bx, by, 0.03); g.add(b); }
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(fw, fh), broken ? dark : wmat); glass.position.z = 0.02; g.add(glass);
  const mu = new THREE.Mesh(new THREE.BoxGeometry(0.05, fh, 0.05), fm); mu.position.z = 0.07; g.add(mu);
  const mh = new THREE.Mesh(new THREE.BoxGeometry(fw, 0.05, 0.05), fm); mh.position.z = 0.07; g.add(mh);
  if (broken) {
    for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(fw * 1.15, 0.13, 0.05), fm); b.position.set((c.rnd() - 0.5) * 0.1, -0.35 + i * 0.32, 0.1); b.rotation.z = (c.rnd() - 0.5) * 0.7; g.add(b); }
    const sh = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.3, 3), wmat); sh.position.set(-0.3, 0.45, 0.04); sh.rotation.z = Math.PI; g.add(sh);
  } else {
    for (const s of [-1, 1]) { const v = new THREE.Mesh(new THREE.BoxGeometry(0.46, fh, 0.05), std(0xffffff, { map: plankTex(0x6a4a2c) })); v.position.set(s * (fw / 2 + 0.28), 0, 0.05); v.rotation.y = s * (c.rnd() < 0.5 ? 0.9 : 0.15); g.add(v); }
  }
  parent.add(g);
}

function door(parent: THREE.Object3D, x: number, y0: number, z: number, face: 'z' | 'x', c: Ctx, w = 1.25, h = 2.2) {
  const g = new THREE.Group(); g.userData.keepH = true; /* raiseWalls não estica nem sobe a porta */ g.position.set(x, y0, z); if (face === 'x') g.rotation.y = Math.PI / 2;
  const fm = timberM();
  for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.16, h + 0.1, 0.2), fm); p.position.set(s * (w / 2 + 0.08), h / 2, 0.04); g.add(p); }
  const lin = new THREE.Mesh(new THREE.BoxGeometry(w + 0.4, 0.16, 0.2), fm); lin.position.set(0, h + 0.08, 0.04); g.add(lin);
  const d = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.1), std(0xffffff, { map: plankTex(0x4a3020) })); ink(d, 0.03); d.position.set(0, h / 2, 0); g.add(d);
  for (const y of [0.45, h - 0.45]) { const st = new THREE.Mesh(new THREE.BoxGeometry(w, 0.1, 0.04), std(0x1c1c22)); st.position.set(0, y, 0.07); g.add(st); }
  const kn = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 5), std(0x9a8a50)); kn.position.set(w * 0.3, h * 0.48, 0.1); g.add(kn);
  parent.add(g);
  // lanterna ao lado
  const l = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.28, 0.2), new THREE.MeshBasicMaterial({ color: 0xffc060 })); l.position.set(w / 2 + 0.55, h * 0.8, 0.2); g.add(l);
  const br = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.3), fm); br.position.set(w / 2 + 0.55, h * 0.8 + 0.2, 0.1); g.add(br);
}

/** chaminé de pedra cônica com remate e boca escura */
function chimney(parent: THREE.Object3D, x: number, z: number, y0: number, h: number, out: THREE.Vector3[]) {
  const g = new THREE.Group(); g.position.set(x, y0, z);
  const st = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.46, h, 6), std(0xffffff, { map: scaleUV(new THREE.CylinderGeometry(1, 1, 1, 6), 1, 1) ? stoneTex(0x7a766e) : null })); ink(st, 0.04); st.position.y = h / 2; st.castShadow = true; g.add(st);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.14, 0.85), std(0x55524c)); cap.position.y = h + 0.05; cap.rotation.y = 0.4; g.add(cap);
  const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.05, 6), std(0x050505)); hole.position.y = h + 0.14; g.add(hole);
  for (const s of [-1, 1]) { const pc = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.16, 0.14), std(0x6a665e)); pc.position.set(s * 0.32, h + 0.18, s * 0.28); g.add(pc); }
  parent.add(g); out.push(new THREE.Vector3(x, y0 + h + 0.4, z));
}

/** escada externa de madeira com guarda-corpo, de (x,z) subindo na direção `dir` (+z ou +x) até altura `H` */
function stairs(parent: THREE.Object3D, x: number, z: number, H: number, dirX: boolean, width = 1.1) {
  const g = new THREE.Group(); g.position.set(x, 0, z); if (dirX) g.rotation.y = -Math.PI / 2;
  const n = Math.max(3, Math.round(H / 0.28)), sh = H / n, sd = 0.32;
  const sm = std(0xffffff, { map: plankTex(0x6a4a2c) });
  for (let i = 0; i < n; i++) {
    const s = new THREE.Mesh(new THREE.BoxGeometry(width, 0.1, sd + 0.04), sm); ink(s, 0.02); s.position.set(0, sh * (i + 1) - 0.05, -i * sd - sd / 2); s.castShadow = true; g.add(s);
  }
  const len = n * sd, ang = Math.atan2(H, len);
  for (const sx of [-1, 1]) {
    const str = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.22, Math.hypot(len, H)), timberM()); str.position.set(sx * (width / 2 + 0.04), H / 2 - 0.1, -len / 2); str.rotation.x = ang; g.add(str);
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, Math.hypot(len, H)), timberM()); rail.position.set(sx * (width / 2 + 0.04), H / 2 + 0.85, -len / 2); rail.rotation.x = ang; g.add(rail);
    for (let i = 0; i <= n; i += 3) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.9, 0.09), timberM()); p.position.set(sx * (width / 2 + 0.04), sh * i + 0.4, -i * sd); g.add(p); }
  }
  const land = new THREE.Mesh(new THREE.BoxGeometry(width + 0.4, 0.14, 1.1), sm); land.position.set(0, H - 0.07, -len - 0.45); g.add(land);
  parent.add(g);
}

function barrels(parent: THREE.Object3D, x: number, z: number, c: Ctx, n = 2) {
  for (let i = 0; i < n; i++) {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.3, 0.8, 9), std(0xffffff, { map: plankTex(0x6a4a2c) })); ink(b, 0.03);
    b.position.set(x + i * 0.7 + (c.rnd() - 0.5) * 0.1, 0.4, z + (c.rnd() - 0.5) * 0.3); b.castShadow = true; parent.add(b);
    for (const y of [0.18, 0.62]) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.025, 4, 12), std(0x2a2a30)); r.rotation.x = Math.PI / 2; r.position.set(b.position.x, y, b.position.z); parent.add(r); }
  }
  const cr = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.6, 0.7), std(0xffffff, { map: plankTex(0x7a5a38) })); ink(cr, 0.03); cr.position.set(x + n * 0.7 + 0.2, 0.3, z + 0.1); cr.rotation.y = 0.4; cr.castShadow = true; parent.add(cr);
}

/** estica a faixa de cima das paredes (2,3 m → 2,4 m) em `dy` e sobe tudo o que está acima; porta, janelas e base não mudam */
function raiseWalls(g: THREE.Group, chim: THREE.Vector3[], lantern: THREE.Vector3, dy: number) {
  const A = 2.3, B = 2.4 /* a parede mais baixa das casas tem 2,4 m (a casa em L): com 2,5 aqui ela quase não subia */, v = new THREE.Vector3(), inv = new THREE.Matrix4(), M = new THREE.Matrix4(); g.updateMatrixWorld(true); const gi = new THREE.Matrix4().copy(g.matrixWorld).invert();
  const up = (y: number) => y <= A ? y : y >= B ? y + dy : A + (y - A) * ((B - A + dy) / (B - A));
  g.traverse((o) => { const m = o as THREE.Mesh; if (!m.isMesh || !m.geometry?.getAttribute('position')) return; for (let q: THREE.Object3D | null = m; q && q !== g; q = q.parent) if (q.userData.keepH) return; M.multiplyMatrices(gi, m.matrixWorld); inv.copy(M).invert();
    const pos0 = m.geometry.getAttribute('position') as THREE.BufferAttribute; let touch = false, lo = 1e9; for (let i = 0; i < pos0.count; i++) { const y = v.fromBufferAttribute(pos0, i).applyMatrix4(M).y; if (y > A) touch = true; if (y < lo) lo = y; } if (!touch) return;
    /* 13/11 (Erling: "a caixa da casa está vazando pelo telhado"): o telhado tem o beiral ABAIXO do topo da parede. Subindo só os vértices de cima, o beiral ficava no lugar,
       a água do telhado deitava e a parede levantada furava as telhas. Peça que não toca o chão (telhado, empena, cumeeira) agora sobe INTEIRA, sem deformar. */
    const inteira = lo >= 1.45;
    m.geometry = m.geometry.clone(); const pos = m.geometry.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i).applyMatrix4(M); v.y = inteira ? v.y + dy : up(v.y); v.applyMatrix4(inv); pos.setXYZ(i, v.x, v.y, v.z); }
    pos.needsUpdate = true; m.geometry.computeBoundingBox(); m.geometry.computeBoundingSphere(); });
  for (const c of chim) c.y = up(c.y); lantern.y = up(lantern.y);
}

/** um volume: base de pedra + parede + telhado de duas águas */
function volume(parent: THREE.Object3D, cx: number, cz: number, w: number, d: number, y0: number, wallH: number, roofH: number, wallC: number, roofC: number, kind: 'plank' | 'plaster' | 'stone', alongX: boolean, over = 0.5) {
  const g = new THREE.Group(); g.position.set(cx, y0, cz);
  const wallMat = kind === 'stone' ? std(0xffffff, { map: stoneTex(wallC) }) : kind === 'plaster' ? std(0xffffff, { map: plasterTexV(wallC) }) : std(0xffffff, { map: plankTex(wallC) });
  const walls = new THREE.Mesh(texBox(w, wallH, d, kind === 'plaster' ? 2.4 : 1.6), wallMat); ink(walls, 0.05); walls.position.y = wallH / 2; walls.castShadow = walls.receiveShadow = true; g.add(walls);
  if (kind !== 'stone') { const base = new THREE.Mesh(texBox(w + 0.12, 0.55, d + 0.12, 1.6), std(0xffffff, { map: stoneTex(0x6a665e) })); base.position.y = 0.27; g.add(base); }
  const roof = gableRoof(w, d, roofH, over, roofC, wallC, alongX); roof.position.y = wallH; g.add(roof);
  parent.add(g); return g;
}

/**
 * 5 tipos de casa. `Wm`,`Dm` = pegada em metros; origem no canto (x,z) da pegada, +z para a câmera.
 */
export function buildHouse(variant: number, Wm: number, Dm: number, wallC: number, roofC: number, c: Ctx): HouseOut {
  if (variant === 9) return buildChalet(Wm, Dm, c);
  const g = new THREE.Group(), chim: THREE.Vector3[] = [];
  const bw = Wm - 0.5, bd = Dm - 0.5, cx = Wm / 2, cz = Dm / 2;
  const front = cz + bd / 2;
  const R = c.rnd;
  let lantern = new THREE.Vector3(cx, 2.2, front + 0.6);
  if (variant === 0) { // cabana nórdica: tábuas escuras, telhado de turfa/sapê alto, alpendre
    volume(g, cx, cz, bw, bd, 0, 2.5, 2.1, 0x4a3426, 0x6a5a30, 'plank', true, 0.6);
    door(g, cx - bw * 0.2, 0.0, front + 0.02, 'z', c);
    windowAt(g, cx + bw * 0.22, 1.5, front + 0.04, 'z', R() < 0.4, c, c.windows);
    windowAt(g, cx + bw / 2 + 0.03, 1.5, cz, 'x', R() < 0.4, c, c.windows);
    chimney(g, cx + bw / 2 - 0.7, cz - bd * 0.2, 2.5 + 1.0, 1.7, chim);
    for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 2.2, 6), timberM()); p.position.set(cx - bw * 0.2 + s * 1.0, 1.1, front + 1.0); p.castShadow = true; g.add(p); }
    const sh = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.14, 1.4), std(0xffffff, { map: shingleTex0(roofC) })); sh.position.set(cx - bw * 0.2, 2.35, front + 0.7); sh.rotation.x = 0.22; ink(sh, 0.03); g.add(sh);
    barrels(g, cx + bw * 0.1, front + 0.7, c);
    for (const s of [-1, 1]) { const dr = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.5, 4), std(0xd8c8a0)); dr.position.set(cx + s * (bw / 2 - 0.05), 3.9, cz + bd / 2 + 0.2 - 0.35); dr.rotation.x = Math.PI / 2; void dr; }
    lantern = new THREE.Vector3(cx - bw * 0.2 + 0.9, 2.0, front + 0.8);
  } else if (variant === 1) { // casa de dois andares: pedra embaixo, enxaimel em cima, escada externa
    volume(g, cx, cz, bw, bd, 0, 2.5, 0.01, 0x7a766e, 0x000000, 'stone', true, 0.05).children.pop();
    const up = volume(g, cx - 0.1, cz, bw + 0.6, bd + 0.5, 2.5, 2.3, 2.3, wallC, roofC, 'plaster', true, 0.6);
    void up;
    door(g, cx - bw * 0.25, 0, front + 0.04, 'z', c);
    windowAt(g, cx + bw * 0.22, 1.5, front + 0.04, 'z', R() < 0.5, c, c.windows);
    windowAt(g, cx - bw * 0.2, 3.9, front + 0.34, 'z', false, c, c.windows); windowAt(g, cx + bw * 0.22, 3.9, front + 0.34, 'z', R() < 0.5, c, c.windows);
    /* 11/11 (Erling: "a escada não casa com a porta, a pessoa abre a porta e cai"): a porta de cima fica na parede, bem no patamar
       da escada. Antes a porta tinha lugar fixo (e solta, a meio metro da parede) e o patamar outro; só coincidiam numa casa de 5,9 m de fundo. */
    { const n = Math.max(3, Math.round(2.5 / 0.28)), len = n * 0.32, dz = Math.max(cz - bd / 2 + 0.85, Math.min(cz - 0.8, cz + bd / 2 - 0.4 - len - 0.45));
      stairs(g, cx + bw / 2 + 0.75, dz + 0.45 + len, 2.5, false, 1.0); /* o patamar da escada fica em dz; a escada encosta na parede de cima */
      door(g, cx + bw / 2 + 0.24, 2.5, dz, 'x', c, 1.0, 1.9); }
    // balcão sobre a escada
    chimney(g, cx - bw / 2 + 0.7, cz - 0.3, 4.8, 2.0, chim);
    lantern = new THREE.Vector3(cx - bw * 0.25 + 0.9, 2.0, front + 0.6);
  } else if (variant === 2) { // casa em L: ala frontal + ala lateral com cumeeira cruzada, varanda com degraus
    volume(g, cx, cz + bd * 0.18, bw, bd * 0.58, 0, 2.4, 1.9, wallC, roofC, 'plaster', true, 0.55);
    volume(g, cx - bw * 0.22, cz - bd * 0.2, bw * 0.5, bd * 0.7, 0, 2.4, 2.1, wallC, roofC, 'plaster', false, 0.55);
    const fz = cz + bd * 0.18 + bd * 0.29;
    door(g, cx + bw * 0.2, 0.35, fz + 0.04, 'z', c);
    for (let i = 0; i < 2; i++) { const st = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.17, 0.5), std(0xffffff, { map: stoneTex(0x7a766e) })); st.position.set(cx + bw * 0.2, 0.09 + i * 0.17, fz + 0.5 - i * 0.2 + 0.35); g.add(st); }
    windowAt(g, cx - bw * 0.2, 1.5, fz + 0.04, 'z', R() < 0.4, c, c.windows);
    windowAt(g, cx - bw * 0.22 - bw * 0.25 - 0.03, 1.5, cz - bd * 0.2, 'x', true, c, c.windows);
    chimney(g, cx + bw * 0.3, cz + bd * 0.1, 2.4 + 0.9, 1.8, chim);
    barrels(g, cx - bw * 0.1, fz + 0.9, c, 1);
    lantern = new THREE.Vector3(cx + bw * 0.2 + 0.9, 2.0, fz + 0.8);
  } else if (variant === 40) { /* 12/11 A ESTALAGEM DE KARMIKA (Erling: "a porta não aparece direito, precisa aumentar a parede, o pé-direito, para ver mais fachada"):
       dois andares de verdade. Térreo de pedra com 3,6 m, andar de cima em enxaimel com 3,1 m, beiral curto: a fachada inteira fica à vista, com porta larga no meio */
    volume(g, cx, cz, bw, bd, 0, 3.6, 0.01, 0x7a766e, 0x000000, 'stone', true, 0.05).children.pop();
    volume(g, cx, cz, bw + 0.5, bd + 0.5, 3.6, 3.1, 2.7, wallC, roofC, 'plaster', true, 0.28);
    const jet = new THREE.Mesh(new THREE.BoxGeometry(bw + 0.7, 0.22, bd + 0.7), timberM()); jet.position.set(cx, 3.6, cz); ink(jet, 0.03); g.add(jet);
    const f2 = front + 0.29;
    door(g, cx, 0, front + 0.04, 'z', c, 2.1, 2.7);
    for (const s of [-1, 1]) { windowAt(g, cx + s * bw * 0.2, 1.75, front + 0.04, 'z', false, c, c.windows); windowAt(g, cx + s * bw * 0.38, 1.75, front + 0.04, 'z', false, c, c.windows); }
    for (let k = 0; k < 6; k++) windowAt(g, cx - bw * 0.42 + k * bw * 0.168, 5.2, f2, 'z', false, c, c.windows);
    for (const sz of [-0.25, 0.25]) { windowAt(g, cx + bw / 2 + 0.03, 1.75, cz + bd * sz, 'x', false, c, c.windows); windowAt(g, cx + bw / 2 + 0.28, 5.2, cz + bd * sz, 'x', false, c, c.windows); }
    /* alpendre da porta: dois esteios e um telhadinho, sem cobrir as janelas */
    for (const s of [-1, 1]) { const pz = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 3.1, 6), timberM()); pz.position.set(cx + s * 1.7, 1.55, front + 1.5); pz.castShadow = true; g.add(pz); }
    const aw = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.14, 1.9), std(0xffffff, { map: shingleTex0(roofC) })); aw.position.set(cx, 3.25, front + 0.85); aw.rotation.x = 0.2; ink(aw, 0.03); g.add(aw);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 1.5), timberM()); arm.position.set(cx + bw * 0.3, 3.3, front + 0.75); g.add(arm);
    const sg = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.95, 0.08), std(0xffffff, { map: signTex('ESTALAGEM', '🛏') })); ink(sg, 0.02); sg.position.set(cx + bw * 0.3, 2.65, front + 1.35); g.add(sg);
    chimney(g, cx - bw * 0.36, cz - bd * 0.15, 6.7 + 1.6, 2.2, chim); chimney(g, cx + bw * 0.36, cz - bd * 0.15, 6.7 + 1.6, 2.2, chim);
    barrels(g, cx - bw * 0.3, front + 0.8, c, 3);
    lantern = new THREE.Vector3(cx + 1.7, 2.6, front + 1.6);
  } else if (variant === 41) { /* 12/11 O SALÃO DAS GUILDAS DE KARMIKA (Erling: "uma construção dessa, comum, com um salão tão grande dentro? aumenta essa construção"):
       salão comprido de pedra com 5,4 m de parede e telhado de ardósia, torre de entrada no meio da fachada, torreões nos cantos e estandartes */
    volume(g, cx, cz, bw, bd, 0, 5.4, 3.0, wallC, roofC, 'stone', true, 0.3);
    volume(g, cx, front - 0.9, 5.0, 3.2, 0, 8.2, 2.6, 0x77736b, roofC, 'stone', false, 0.3);
    door(g, cx, 0, front + 0.72, 'z', c, 2.4, 3.1);
    windowAt(g, cx, 5.6, front + 0.72, 'z', false, c, c.windows);
    for (const s of [-1, 1]) for (const k of [0.2, 0.34]) { windowAt(g, cx + s * bw * k, 1.9, front + 0.04, 'z', false, c, c.windows); windowAt(g, cx + s * bw * k, 3.9, front + 0.04, 'z', false, c, c.windows); }
    for (const sz of [-0.25, 0.25]) { windowAt(g, cx + bw / 2 + 0.03, 1.9, cz + bd * sz, 'x', false, c, c.windows); windowAt(g, cx + bw / 2 + 0.03, 3.9, cz + bd * sz, 'x', false, c, c.windows); }
    for (const s of [-1, 1]) { const tr = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.15, 7.0, 10), std(0xffffff, { map: stoneTex(0x77736b) })); tr.position.set(cx + s * (bw / 2 - 0.2), 3.5, front - 0.2); ink(tr, 0.04); tr.castShadow = true; g.add(tr);
      const cn = new THREE.Mesh(new THREE.ConeGeometry(1.35, 2.4, 10), std(0xffffff, { map: shingleTex0(roofC) })); cn.position.set(cx + s * (bw / 2 - 0.2), 8.2, front - 0.2); ink(cn, 0.03); g.add(cn);
      /* estandartes ao lado da porta */
      const bn = new THREE.Mesh(new THREE.BoxGeometry(0.9, 3.2, 0.05), std(s < 0 ? 0x2a4a8a : 0x8a2a2a)); bn.position.set(cx + s * 2.0, 5.0, front + 0.76); ink(bn, 0.02); g.add(bn);
      const bg = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.06), std(0xe2c36a)); bg.position.set(cx + s * 2.0, 5.4, front + 0.79); bg.rotation.z = Math.PI / 4; g.add(bg); }
    const sg = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.9, 0.08), std(0xffffff, { map: signTex('GUILDAS', '⚜') })); ink(sg, 0.02); sg.position.set(cx, 3.75, front + 0.78); g.add(sg);
    chimney(g, cx - bw * 0.3, cz - bd * 0.2, 5.4 + 1.8, 2.2, chim); chimney(g, cx + bw * 0.3, cz - bd * 0.2, 5.4 + 1.8, 2.2, chim);
    lantern = new THREE.Vector3(cx + 1.8, 2.8, front + 1.2);
  } else if (variant === 3) { // torre / atalaia: pedra alta, sacada de madeira, telhado alto e escada lateral
    const tw = Math.min(bw, 4.2), td = Math.min(bd, 4.2);
    volume(g, cx, cz, tw, td, 0, 5.2, 3.0, 0x6a665e, 0x4a4a58, 'stone', true, 0.5);
    door(g, cx, 0, cz + td / 2 + 0.02, 'z', c, 1.2, 2.1);
    /* 05/11 (Erling: "a janela está errada, precisa subir"): a sacada fica a 3,2 m — a janela do lado tinha o centro a 3,4 m e o tabuleiro
       cortava a metade de baixo. As de cima ficam a ~1,1 m acima do piso da sacada, como uma janela de verdade */
    for (const y of [2.0, 4.3]) windowAt(g, cx - tw * 0.25, y, cz + td / 2 + 0.04, 'z', y > 3 && R() < 0.6, c, c.windows);
    windowAt(g, cx + tw / 2 + 0.03, 4.3, cz, 'x', false, c, c.windows);
    const bal = new THREE.Mesh(new THREE.BoxGeometry(tw + 1.2, 0.14, td + 1.2), std(0xffffff, { map: plankTex(0x5a3a22) })); bal.position.set(cx, 3.2, cz); ink(bal, 0.03); g.add(bal);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * 6.283; const rx = Math.cos(a) * (tw / 2 + 0.55), rz = Math.sin(a) * (td / 2 + 0.55); const p = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.9, 0.08), timberM()); p.position.set(cx + Math.max(-tw / 2 - 0.55, Math.min(tw / 2 + 0.55, rx * 1.4)), 3.7, cz + Math.max(-td / 2 - 0.55, Math.min(td / 2 + 0.55, rz * 1.4))); g.add(p); }
    stairs(g, cx + tw / 2 + 0.75, cz + td / 2 + 0.5, 3.2, false, 0.9);
    chimney(g, cx - tw * 0.3, cz - td * 0.25, 5.2 + 1.1, 1.3, chim);
    lantern = new THREE.Vector3(cx + 1.2, 2.0, cz + td / 2 + 0.6);
  } else if (variant === 5) { // armeiro: armas e armaduras expostas, grande toldo, forja, placa
    volume(g, cx, cz, bw, bd, 0, 2.9, 2.5, wallC, roofC, 'stone', true, 0.8);
    const up = volume(g, cx, cz - bd * 0.1, bw * 0.55, bd * 0.7, 2.9, 2.2, 2.0, 0x8a6a48, roofC, 'plaster', false, 0.5); void up;
    door(g, cx - bw * 0.1, 0, front + 0.04, 'z', c, 1.7, 2.4);
    windowAt(g, cx + bw * 0.3, 1.7, front + 0.04, 'z', false, c, c.windows); windowAt(g, cx - bw * 0.36, 1.7, front + 0.04, 'z', R() < 0.5, c, c.windows);
    windowAt(g, cx, 4.2, cz - bd * 0.1 + bd * 0.35 + 0.04, 'z', false, c, c.windows);
    const aw = new THREE.Mesh(new THREE.BoxGeometry(bw * 0.8, 0.12, 2.0), std(0xffffff, { map: shingleTex0(0x5a2a2a) })); aw.position.set(cx, 2.65, front + 1.0); aw.rotation.x = 0.26; ink(aw, 0.03); g.add(aw);
    for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.11, 2.5, 6), timberM()); p.position.set(cx + s * bw * 0.38, 1.25, front + 1.85); p.castShadow = true; g.add(p); }
    // placa com espada
    const arm = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.09, 0.09), timberM()); arm.position.set(cx + bw * 0.38 + 0.7, 3.1, front + 0.8); g.add(arm);
    const sg = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.7, 0.07), std(0xffffff, { map: signTex('ARMEIRO', '⚔') })); ink(sg, 0.02); sg.position.set(cx + bw * 0.38 + 0.85, 2.6, front + 0.8); g.add(sg);
    // mostruário: bancada, escudos na parede, mastro de armas, boneco de armadura
    const tb = new THREE.Mesh(new THREE.BoxGeometry(bw * 0.5, 0.95, 0.8), std(0xffffff, { map: plankTex(0x6a4528) })); ink(tb, 0.03); tb.position.set(cx + bw * 0.12, 0.48, front + 1.2); g.add(tb);
    for (let i = 0; i < 5; i++) { const sw = new THREE.Group(); const bl = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.8, 0.02), std(0xdde3ec)); bl.position.y = 0.45; const gd = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 0.05), std(0xc9a84a)); const hn = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.22, 5), std(0x4a3220)); hn.position.y = -0.14; sw.add(bl, gd, hn); sw.position.set(cx + bw * 0.12 - bw * 0.2 + i * bw * 0.1, 1.0, front + 1.2); sw.rotation.set(-1.45, 0, (i - 2) * 0.12); g.add(sw); }
    for (let i = 0; i < 3; i++) { const shd = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.07, 14), std([0x8a2a22, 0x2a4a8a, 0x8a6a22][i])); shd.rotation.x = Math.PI / 2; shd.position.set(cx - bw * 0.35 + i * 0.95, 2.1, front + 0.1); ink(shd, 0.02); g.add(shd); const bs = new THREE.Mesh(new THREE.SphereGeometry(0.11, 6, 5), std(0xaaaab0)); bs.position.set(shd.position.x, 2.1, front + 0.17); g.add(bs); }
    const stand = new THREE.Group(); stand.position.set(cx - bw * 0.42, 0, front + 1.2);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 1.6, 6), timberM()); post.position.y = 0.8; stand.add(post);
    const tor = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.24, 0.65, 8), std(0x9a9ca6)); ink(tor, 0.025); tor.position.y = 1.25; stand.add(tor);
    const hel = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6, 0, 6.283, 0, 2.2), std(0x9a9ca6)); ink(hel, 0.02); hel.position.y = 1.72; stand.add(hel);
    const hr = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.3, 4), std(0xbb3322)); hr.position.y = 2.0; stand.add(hr);
    for (const s of [-1, 1]) { const pl = new THREE.Mesh(new THREE.SphereGeometry(0.17, 7, 5), std(0x8a8c96)); pl.position.set(s * 0.33, 1.5, 0); stand.add(pl); }
    g.add(stand);
    chimney(g, cx + bw * 0.3, cz - bd * 0.25, 2.9 + 1.0, 2.5, chim);
    barrels(g, cx + bw * 0.42, front + 0.5, c, 2);
    lantern = new THREE.Vector3(cx - bw * 0.1 + 1.2, 2.1, front + 0.9);
  } else { // taverna/ferraria: grande, telhado alto, toldo, placa pendurada, anexo, chaminé grossa
    volume(g, cx, cz, bw, bd, 0, 2.7, 2.4, wallC, roofC, 'plaster', true, 0.7);
    door(g, cx - bw * 0.15, 0, front + 0.04, 'z', c, 1.5, 2.3);
    windowAt(g, cx + bw * 0.2, 1.6, front + 0.04, 'z', R() < 0.5, c, c.windows); windowAt(g, cx + bw * 0.38, 1.6, front + 0.04, 'z', false, c, c.windows);
    windowAt(g, cx + bw / 2 + 0.03, 1.6, cz, 'x', true, c, c.windows);
    const aw = new THREE.Mesh(new THREE.BoxGeometry(bw * 0.7, 0.12, 1.6), std(0xffffff, { map: shingleTex0(0x8a3b2e) })); aw.position.set(cx - bw * 0.1, 2.5, front + 0.8); aw.rotation.x = 0.28; ink(aw, 0.03); g.add(aw);
    for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 2.4, 6), timberM()); p.position.set(cx - bw * 0.1 + s * bw * 0.33, 1.2, front + 1.45); g.add(p); }
    // placa
    const arm = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.08), timberM()); arm.position.set(cx + bw * 0.28, 2.9, front + 0.7); g.add(arm);
    const sg = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.55, 0.06), std(0xffffff, { map: signTex() })); ink(sg, 0.02); sg.position.set(cx + bw * 0.28 + 0.3, 2.45, front + 0.7); g.add(sg);
    // anexo
    const sd = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.8, bd * 0.55), std(0xffffff, { map: plankTex(0x4a3426) })); ink(sd, 0.04); sd.position.set(cx - bw / 2 - 0.9, 0.9, cz); sd.castShadow = true; g.add(sd);
    const sr = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.14, bd * 0.55 + 0.5), std(0xffffff, { map: shingleTex0(roofC) })); sr.position.set(cx - bw / 2 - 0.9, 2.05, cz); sr.rotation.z = -0.28; ink(sr, 0.03); g.add(sr);
    chimney(g, cx + bw * 0.1, cz - bd * 0.15, 2.7 + 1.0, 2.4, chim);
    barrels(g, cx + bw * 0.28, front + 1.1, c, 2);
    lantern = new THREE.Vector3(cx - bw * 0.15 + 1.1, 2.1, front + 0.8);
  }
  g.scale.y = 1.15;
  for (const ch of chim) ch.y *= 1.15;
  lantern.y *= 1.0;
  /* 11/11 (Erling: "batente da porta passando do telhado, precisa aumentar a parede da casa para caber a porta"; "a escala construção x humano parece pequena"):
     a casa térrea tinha 2,5 m de parede com porta de 2,2 m: o beiral descia em cima do batente. A parede ganhou 45 cm (2,95 m) e tudo o que fica acima dela subiu junto. O sobrado (escada de fora) fica como é. */
  /* a casa em L tem a porta 35 cm acima do piso (varanda com degraus): o batente chega a 2,71 m e a parede tinha 2,4 m. Ela sobe mais (75 cm) */
  if (variant !== 1 && variant !== 3 && variant !== 40 && variant !== 41) raiseWalls(g, chim, lantern, variant === 2 ? 1.25 : 0.8); /* 11/11, 15h30: 45 e 75 cm não bastaram — o beiral desce meio metro abaixo do topo da parede. Agora sobra folga entre a verga da porta e o beiral */
  return { group: g, chimneys: chim, lantern };
}

function shingleTex0(c: number) { return shingleTexLazy(c); }
import { shingleTex as shingleTexLazy } from './toon3d';
const signCache = new Map<string, THREE.CanvasTexture>();
function signTex(txt = 'TAVERNA', ico = '🍺') {
  const key = txt + ico; const hit = signCache.get(key); if (hit) return hit;
  const cv = document.createElement('canvas'); cv.width = 128; cv.height = 76; const g = cv.getContext('2d')!;
  g.fillStyle = '#5a3a22'; g.fillRect(0, 0, 128, 76); g.strokeStyle = '#2a1b12'; g.lineWidth = 6; g.strokeRect(3, 3, 122, 70);
  g.fillStyle = '#e8c870'; g.font = 'bold 26px serif'; g.textAlign = 'center'; g.fillText(txt, 64, 36); g.font = '20px serif'; g.fillText(ico, 64, 62);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter; signCache.set(key, t); return t;
}

/* ---------- culturas das vilas (Erling, 23/10: "todas as vilas são extremamente parecidas"): a mesma planta (porta no lugar de
   houseDoor, interior igual), mas cada povo constrói do seu jeito ----------
   1 nórdico (salão comprido de toras, telhado de turfa até quase o chão, cabeças de dragão nas empenas)
   2 anão (pedra maciça, laje de pedra em degraus, porta em arco baixo, faixa de runas de cobre, chaminé de brasa)
   3 élfico (marfim, paredes curvas, telhados em camadas com beiral virado, pináculo fino e lanternas azuis)
   4 sombrio (Corvoscuro: casa estreita e alta de pedra escura, telhado agudo, janelas vermelhas, grade de ferro)
   5 tribal (Uivo Antigo: cabana redonda de toras com teto cônico de palha, peles e chifres)
   6 pacto (Gorvath: casebre torto, telhado retorcido, runas violetas que brilham)
   7 vapor (Vaporeira, Porto Caldeira, Ferrugem: tijolo, telhado de chapa, canos e chaminé alta de fábrica) */
export function buildStyledHouse(style: number, variant: number, Wm: number, Dm: number, wallC: number, roofC: number, c: Ctx): HouseOut {
  /* 11/11 (Erling: "as casas prontas entram na lista de construção B"): estilo 90 = casa pronta do Herik (cenario/construcoes/casas), inteira num modelo só.
     variante 0 = o sobrado com chaminé (casa_01), 1 = a casa térrea comprida (casa_02). A frente do modelo já olha para a câmera. */
  if (style === 90) { const g0 = new THREE.Group(), id = variant === 1 ? 'casa_02' : 'casa_01', fit = () => { const m = artMesh(id); if (!m) return false; m.geometry.computeBoundingBox(); const bb = m.geometry.boundingBox!, k = Math.min((Wm - 0.6) / (bb.max.x - bb.min.x), (Dm - 0.6) / (bb.max.z - bb.min.z), 1.15);
      m.scale.setScalar(k); m.position.set(Wm / 2 - (bb.max.x + bb.min.x) / 2 * k, -bb.min.y * k, Dm / 2 - (bb.max.z + bb.min.z) / 2 * k); g0.add(m); return true; };
    if (!fit()) void artReady([id]).then(fit);
    return { group: g0, chimneys: [new THREE.Vector3(variant === 1 ? Wm * 0.72 : Wm * 0.2, variant === 1 ? 4.6 : 7.4, Dm / 2)], lantern: new THREE.Vector3(Wm / 2, 2.2, Dm + 0.3) }; }
  const g = new THREE.Group(), chim: THREE.Vector3[] = [];
  const bw = Wm - 0.5, bd = Dm - 0.5, cx = Wm / 2, cz = Dm / 2, front = cz + bd / 2, R = c.rnd;
  const dr = houseDoor(variant, Wm, Dm), dz = dr.z - 0.02;
  const M = (col: number, kind?: 'plank' | 'stone' | 'plaster' | 'wood' | 'shingle') => std(0xffffff, { map: kind === 'stone' ? stoneTex(col) : kind === 'plaster' ? plasterTex(col) : kind === 'wood' ? woodTex(col) : kind === 'shingle' ? shingleTex0(col) : plankTex(col) });
  const mesh = (geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number) => { const k = new THREE.Mesh(geo, m); k.position.set(x, y, z); k.castShadow = k.receiveShadow = true; g.add(k); return k; };
  const glowW = (w: number, h: number, x: number, y: number, z: number, col: number, ry = 0) => { const k = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: col, toneMapped: false })); k.position.set(x, y, z); k.rotation.y = ry; g.add(k); return k; };
  let lantern = new THREE.Vector3(dr.x + 0.9, 2.0, front + 0.6);
  if (style === 1) { // NÓRDICO
    const wallH = 2.0, roofH = 3.4, log = M(0x4a3220, 'wood');
    mesh(texBox(bw, wallH, bd, 1.6), log, cx, wallH / 2, cz);
    for (let i = 0; i < 6; i++) mesh(new THREE.CylinderGeometry(0.14, 0.14, bw + 0.3, 6).rotateZ(Math.PI / 2), log, cx, 0.2 + i * 0.36, front + 0.05);
    const roof = gableRoof(bw + 0.4, bd, roofH, 1.0, 0x5a6a34, 0x4a3220, true); roof.position.set(cx, wallH, cz); g.add(roof); // turfa verde
    for (const s of [-1, 1]) { // cabeças de dragão cruzadas na cumeeira
      const x = cx + s * (bw / 2 + 0.6); for (const t of [-1, 1]) { const h = mesh(new THREE.BoxGeometry(0.16, 1.5, 0.16), log, x, wallH + roofH + 0.4, cz + t * 0.25); h.rotation.x = t * 0.55; h.rotation.z = s * 0.15; }
      const head = mesh(new THREE.ConeGeometry(0.22, 0.7, 4), M(0x6a4a2a, 'wood'), x + s * 0.25, wallH + roofH + 1.1, cz); head.rotation.z = -s * 1.3; }
    door(g, dr.x, 0, dz, 'z', c, 1.3, 1.95);
    for (const s of [-1, 1]) { const p = mesh(new THREE.CylinderGeometry(0.13, 0.15, 2.4, 6), log, dr.x + s * 0.95, 1.2, dz + 0.3); void p; const kn = mesh(new THREE.ConeGeometry(0.16, 0.4, 5), M(0x8a6a3a, 'wood'), dr.x + s * 0.95, 2.6, dz + 0.3); void kn; }
    for (const [x, col] of [[cx + bw * 0.25, 0x8a2a22], [cx + bw * 0.4, 0x2a4a7a]] as [number, number][]) { const sh = mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.08, 10).rotateX(Math.PI / 2), std(col), x, 1.25, front + 0.12); void sh; mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.1, 8).rotateX(Math.PI / 2), std(0x8a8a90), x, 1.25, front + 0.18); }
    windowAt(g, cx + bw / 2 + 0.03, 1.2, cz, 'x', false, c, c.windows);
    chim.push(new THREE.Vector3(cx - bw * 0.15, wallH + roofH + 0.2, cz)); // fumaça pelo buraco do teto (sem chaminé)
    barrels(g, cx - bw * 0.42, front + 0.7, c, 1);
  } else if (style === 2) { // ANÃO
    /* 08/11 (Erling: "casas do povo anão com os assets de tijolo e madeira; porta não vai até o chão — degrau; chaminé sem fumaça; primeira cidade dos anões
       tem que ser bonita"): embasamento de pedra escura com DEGRAUS até a porta, paredes de TIJOLO assentado com vigas de carvalho nos cantos e no meio,
       faixa de runas de cobre, telhado de laje em degraus com beiral de madeira, chaminé de tijolo (com fumaça), janelas acesas com grade de ferro,
       porta em arco com bandas de ferro, e placa pendurada quando é loja */
    const wallH = 2.7, pl = 0.45, bk = M(0x8a5a44, 'stone'), bk2 = std(0xffffff, { map: brickTex((variant % 2) ? 0x8c5a42 : 0x7a5240) }), dk = M(0x4a423a, 'stone'), oak = M(0x4a3220, 'wood'), oakL = M(0x6a4a2c), cu = std(0xb06a3a), iron = std(0x2c2a2a);
    void bk;
    mesh(texBox(bw + 0.3, pl, bd + 0.3, 1.6), dk, cx, pl / 2, cz); /* embasamento */
    mesh(texBox(bw, wallH, bd, 1.4), bk2, cx, pl + wallH / 2, cz); /* paredes de tijolo */
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(new THREE.BoxGeometry(0.22, wallH + 0.1, 0.22), oak, cx + sx * (bw / 2 - 0.02), pl + wallH / 2, cz + sz * (bd / 2 - 0.02)); /* vigas de canto */
    mesh(new THREE.BoxGeometry(bw + 0.1, 0.18, 0.2), oak, cx, pl + wallH * 0.55, front + 0.02); mesh(new THREE.BoxGeometry(bw + 0.1, 0.16, 0.16), oak, cx, pl + wallH - 0.08, front + 0.02); /* vigas da fachada */
    mesh(new THREE.BoxGeometry(bw + 0.02, 0.2, 0.05), cu, cx, pl + wallH * 0.55 + 0.19, front + 0.08); /* faixa de cobre com runas */
    for (let i = 0; i < 5; i++) { const r = mesh(new THREE.PlaneGeometry(0.18, 0.18), std(0xffd27a), cx - bw / 2 + 0.6 + i * (bw - 1.2) / 4, pl + wallH * 0.55 + 0.19, front + 0.115); r.rotation.z = Math.PI / 4; }
    /* telhado: lajes em degraus com beiral de carvalho */
    mesh(texBox(bw + 0.6, 0.22, bd + 0.6, 1.6), oakL, cx, pl + wallH + 0.11, cz);
    mesh(texBox(bw + 0.4, 0.35, bd + 0.4, 1.6), dk, cx, pl + wallH + 0.4, cz);
    mesh(texBox(bw - 0.9, 0.85, bd - 0.9, 1.6), bk2, cx, pl + wallH + 1.0, cz);
    mesh(texBox(bw - 0.6, 0.25, bd - 0.6, 1.6), dk, cx, pl + wallH + 1.55, cz);
    mesh(texBox(bw - 1.8, 0.3, bd - 1.8, 1.6), dk, cx, pl + wallH + 1.82, cz);
    /* degraus até a porta (o embasamento é alto) */
    for (let k = 0; k < 3; k++) { const sy = pl * (k + 1) / 3; mesh(new THREE.BoxGeometry(2.0 - k * 0.25, sy, 0.42), dk, dr.x, sy / 2, front + 0.15 + (2 - k) * 0.4 + 0.21); }
    const a = new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.17, 6, 12, Math.PI), dk); a.position.set(dr.x, pl + 1.9, dz + 0.08); g.add(a); /* arco da porta */
    door(g, dr.x, pl, dz, 'z', c, 1.4, 1.9);
    for (const y of [pl + 0.6, pl + 1.4]) mesh(new THREE.BoxGeometry(1.42, 0.08, 0.04), iron, dr.x, y, dz + 0.1); /* bandas de ferro */
    /* janelas acesas com grade */
    for (const wx of [cx + bw * 0.3, cx - bw * 0.32]) { if (Math.abs(wx - dr.x) < 1.2) continue; glowW(0.6, 0.7, wx, pl + 1.6, front + 0.03, 0xff9a3a); mesh(new THREE.BoxGeometry(0.72, 0.82, 0.06), oak, wx, pl + 1.6, front + 0.01); glowW(0.6, 0.7, wx, pl + 1.6, front + 0.05, 0xff9a3a); mesh(new THREE.BoxGeometry(0.04, 0.7, 0.03), iron, wx, pl + 1.6, front + 0.09); mesh(new THREE.BoxGeometry(0.6, 0.04, 0.03), iron, wx, pl + 1.6, front + 0.09); }
    glowW(0.5, 0.6, cx + bw / 2 + 0.03, pl + 1.6, cz - bd * 0.2, 0xff9a3a, Math.PI / 2);
    /* chaminé de tijolo com coroa de pedra — a fumaça sai de cima */
    const chx = cx - bw * 0.3, chz = cz - bd * 0.2; mesh(texBox(0.7, 2.6, 0.7, 1.4), bk2, chx, pl + wallH + 1.9, chz); mesh(new THREE.BoxGeometry(0.9, 0.18, 0.9), dk, chx, pl + wallH + 3.25, chz); chim.push(new THREE.Vector3(chx, pl + wallH + 3.4, chz));
    /* loja: placa pendurada no braço de ferro */
    if (c.shop) { const SG: Record<string, [string, string]> = { armeiro: ['ARMEIRO', '⚔'], armaduras: ['ARMADURAS', '🛡'], mercador: ['MERCADOR', '🧺'], taverna: ['TAVERNA', '🍺'], cervejaria: ['A BIGORNA MOLHADA', '🍺'], pocoes: ['POÇÕES', '⚗'], honra_anao: ['HONRA', '🏅'], construtor: ['CONSTRUTOR', '🧱'], lenhador: ['LENHADOR', '🪓'], cozinha: ['COZINHA', '🍲'], domador: ['DOMADOR', '🐾'] };
      const [tx, ic] = SG[c.shop] ?? [c.shop.toUpperCase().slice(0, 10), '✦']; const sx = dr.x + 1.5 < cx + bw / 2 ? dr.x + 1.5 : dr.x - 1.5;
      mesh(new THREE.BoxGeometry(0.06, 0.06, 0.9), iron, sx, pl + 2.55, front + 0.45); mesh(new THREE.BoxGeometry(0.06, 0.5, 0.06), iron, sx, pl + 2.3, front + 0.1);
      const big = c.shop === 'cervejaria'; const sg = mesh(new THREE.BoxGeometry(big ? 1.7 : 1.0, big ? 0.8 : 0.6, 0.07), std(0xffffff, { map: signTex(tx, ic) }), sx, pl + 2.15, front + (big ? 1.1 : 0.75)); ink(sg, 0.02); sg.rotation.y = Math.PI / 2;
      if (big) { /* a taverna tem também o letreiro sobre a porta, barris e canecas na frente e dois lampiões */ const top = mesh(new THREE.BoxGeometry(3.2, 0.7, 0.1), std(0xffffff, { map: signTex(tx, ic) }), dr.x, pl + wallH - 0.35, front + 0.12); ink(top, 0.02);
        for (const s2 of [-1, 1]) { mesh(new THREE.CylinderGeometry(0.34, 0.3, 0.8, 10), M(0x6a4a2c, 'wood'), dr.x + s2 * 2.2, 0.4, front + 0.9); for (const y of [0.18, 0.62]) mesh(new THREE.TorusGeometry(0.34, 0.025, 6, 14).rotateX(Math.PI / 2), iron, dr.x + s2 * 2.2, y, front + 0.9); }
        glowW(0.22, 0.3, dr.x - 1.1, pl + 2.3, front + 0.15, 0xffc070); glowW(0.22, 0.3, dr.x + 1.1, pl + 2.3, front + 0.15, 0xffc070); } }
    lantern = new THREE.Vector3(dr.x + 1.0, pl + 1.9, front + 0.5);
  } else if (style === 3) { // ÉLFICO
    /* 08/11 (Lithendel refeita): casa redonda de madeira clara com nervuras de galho, soleira de pedra musgosa, telhado em CAMADAS DE FOLHAS
       (cartões de folha em 3 andares, verde-prata e dourado, como a copa da Árvore-Mãe), coruchéu de galho com lanterna azul-clara, janelas em arco
       acesas, trepadeiras com flores, canteiro na frente, porta em arco com arabescos de ouro */
    const iv = M(0xd8cfb0, 'plaster'), wd = M(0x9a7a52, 'wood'), gold = std(0xd8c070), r0 = Math.min(bw, bd) / 2, stoneM = M(0x8a9a80, 'stone');
    mesh(new THREE.CylinderGeometry(r0 + 0.35, r0 + 0.5, 0.35, 18), stoneM, cx, 0.17, cz); /* soleira de pedra */
    for (let k = 0; k < 8; k++) { const a = k / 8 * 6.283; mesh(new THREE.SphereGeometry(0.22, 6, 5), std(0x5a8a4a), cx + Math.cos(a) * (r0 + 0.45), 0.3, cz + Math.sin(a) * (r0 + 0.45)).scale.set(1.3, 0.5, 1); } /* musgo */
    /* 10/11 (Erling: "a casa élfica parece um bangalô sem parede de um lado — se não tem parede, faça a parte aberta com bambus e cipós"):
       a parede dá a volta menos no LESTE, que fica aberto (o mesmo trecho que se vê de dentro, em interiors3d): bambus com nós, corrimão e cipós */
    const ivD = iv.clone(); ivD.side = THREE.DoubleSide; const OPEN_A = (a: number) => Math.cos(a) > 0.55 && Math.sin(a) < 0.75;
    mesh(new THREE.CylinderGeometry(r0, r0 * 1.06, 3.0, 18, 1, true, 2.56, Math.PI * 2 - 1.84), ivD, cx, 1.85, cz); /* a parede (aberta a leste) */
    { const floorIn = new THREE.Mesh(new THREE.CircleGeometry(r0 - 0.05, 18), std(0x8a7050)); floorIn.rotation.x = -Math.PI / 2; floorIn.position.set(cx, 0.36, cz); g.add(floorIn);
      const bam = std(0xc8b870), node = std(0x8a7a40), vine = std(0x4a8a4a);
      for (let a = -0.95; a <= 0.85; a += 0.2) { const x = cx + Math.cos(a) * r0, z = cz + Math.sin(a) * r0; mesh(new THREE.CylinderGeometry(0.07, 0.08, 3.0, 6), bam, x, 1.85, z); for (const y of [1.1, 1.9, 2.7]) mesh(new THREE.TorusGeometry(0.08, 0.02, 4, 8), node, x, y, z).rotation.x = Math.PI / 2;
        const len = 0.6 + Math.abs(Math.sin(a * 7)) * 1.3; mesh(new THREE.CylinderGeometry(0.02, 0.02, len, 4), vine, x + Math.cos(a) * 0.08, 3.35 - len / 2, z + Math.sin(a) * 0.08); }
      for (let a = -0.95; a < 0.85; a += 0.1) { const xa = cx + Math.cos(a) * r0, za = cz + Math.sin(a) * r0, xb = cx + Math.cos(a + 0.1) * r0, zb = cz + Math.sin(a + 0.1) * r0; const rl = mesh(new THREE.CylinderGeometry(0.04, 0.04, Math.hypot(xb - xa, zb - za) + 0.02, 5), bam, (xa + xb) / 2, 1.35, (za + zb) / 2); rl.rotation.z = Math.PI / 2; rl.rotation.y = -Math.atan2(zb - za, xb - xa); }
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffd890, toneMapped: false })); lamp.position.set(cx, 2.6, cz); g.add(lamp); }
    for (let k = 0; k < 10; k++) { const a = k / 10 * 6.283; if (OPEN_A(a)) continue; const rib = mesh(new THREE.CylinderGeometry(0.06, 0.09, 3.2, 5), wd, cx + Math.cos(a) * (r0 + 0.03), 1.9, cz + Math.sin(a) * (r0 + 0.03)); rib.rotation.z = Math.cos(a) * 0.06; rib.rotation.x = -Math.sin(a) * 0.06; } /* nervuras de galho */
    mesh(new THREE.TorusGeometry(r0 + 0.04, 0.07, 5, 24), wd, cx, 1.0, cz).rotation.x = Math.PI / 2; mesh(new THREE.TorusGeometry(r0 + 0.04, 0.07, 5, 24), wd, cx, 3.3, cz).rotation.x = Math.PI / 2;
    /* telhado em camadas de folhas */
    const leafM = std(0xffffff, { map: shingleTex0(0x6fa66a), side: THREE.DoubleSide }), leafM2 = std(0xffffff, { map: shingleTex0(0xa8c060), side: THREE.DoubleSide });
    for (let k = 0; k < 3; k++) { const rr = r0 * (1.45 - k * 0.36), y = 3.3 + k * 1.05; const t = mesh(new THREE.ConeGeometry(rr, 1.35, 18, 1, true), k % 2 ? leafM2 : leafM, cx, y + 0.67, cz);
      void t; for (let q = 0; q < 12; q++) { const a = q / 12 * 6.283 + k * 0.26; const lf = mesh(new THREE.SphereGeometry(0.32, 5, 4), k % 2 ? std(0x9ab860) : std(0x6fa66a), cx + Math.cos(a) * rr * 0.98, y + 0.08, cz + Math.sin(a) * rr * 0.98); lf.scale.set(1.2, 0.35, 0.7); lf.rotation.y = -a; } /* pontas de folha na beira */
      mesh(new THREE.TorusGeometry(rr * 0.97, 0.05, 4, 24), gold, cx, y + 0.02, cz).rotation.x = Math.PI / 2; }
    const fin = mesh(new THREE.CylinderGeometry(0.05, 0.1, 1.8, 5), wd, cx, 7.2, cz); fin.rotation.z = 0.12; /* coruchéu de galho */
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), new THREE.MeshBasicMaterial({ color: 0x9ae0ff, toneMapped: false })); orb.position.set(cx + 0.2, 8.0, cz); g.add(orb);
    mesh(new THREE.TorusGeometry(0.26, 0.03, 4, 12), gold, cx + 0.2, 8.0, cz).rotation.x = Math.PI / 2;
    /* porta em arco com arabescos */
    door(g, dr.x, 0.35, cz + r0 + 0.02, 'z', c, 1.2, 2.2);
    const ar = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.09, 4, 14, Math.PI), gold); ar.position.set(dr.x, 2.55, cz + r0 + 0.08); g.add(ar);
    for (const s2 of [-1, 1]) { const vine = mesh(new THREE.TorusGeometry(0.3, 0.03, 4, 10, Math.PI), gold, dr.x + s2 * 1.0, 2.2, cz + r0 + 0.09); vine.rotation.z = s2 * 0.5; }
    /* janelas em arco acesas */
    for (const a of [0.95, 2.2, -2.4]) { const x = cx + Math.cos(a) * (r0 + 0.02), z = cz + Math.sin(a) * (r0 + 0.02), ry = Math.PI / 2 - a; glowW(0.5, 0.9, x, 2.0, z, 0xffd090, ry); const fr = mesh(new THREE.TorusGeometry(0.28, 0.04, 4, 10, Math.PI), wd, x, 2.45, z); fr.rotation.y = ry; }
    /* trepadeiras com flores e canteiro na frente */
    for (let k = 0; k < 9; k++) { const a = k * 0.75 + 0.4, v = mesh(new THREE.SphereGeometry(0.2, 6, 5), std(0x4a8a4a), cx + Math.cos(a) * (r0 + 0.06), 0.6 + (k % 3) * 0.8, cz + Math.sin(a) * (r0 + 0.06)); v.scale.set(1, 1.6, 0.5); if (k % 2) mesh(new THREE.SphereGeometry(0.07, 5, 4), std([0xff9ab8, 0xfff0a0, 0xc0a0ff][k % 3]), cx + Math.cos(a) * (r0 + 0.14), 0.7 + (k % 3) * 0.8, cz + Math.sin(a) * (r0 + 0.14)); }
    for (const s2 of [-1, 1]) { const bx = dr.x + s2 * 1.5, bz = cz + r0 + 0.6; mesh(new THREE.CylinderGeometry(0.45, 0.4, 0.3, 10), stoneM, bx, 0.15, bz); mesh(new THREE.SphereGeometry(0.4, 7, 5), std(0x4a8a4a), bx, 0.45, bz).scale.set(1, 0.6, 1); for (let q = 0; q < 4; q++) mesh(new THREE.SphereGeometry(0.07, 5, 4), std([0xff9ab8, 0xfff0a0, 0xc0a0ff, 0xffffff][q]), bx + Math.cos(q * 1.6) * 0.25, 0.68, bz + Math.sin(q * 1.6) * 0.25); }
    lantern = new THREE.Vector3(dr.x + 0.9, 2.0, cz + r0 + 0.6);
  } else if (style === 4) { // SOMBRIO
    const wallH = 4.4, st = M(0x3e3a40, 'stone'), rf = M(0x2a2228, 'shingle');
    mesh(texBox(bw, wallH, bd, 1.6), st, cx, wallH / 2, cz);
    mesh(texBox(bw + 0.2, 0.25, bd + 0.2, 1.6), M(0x2a2628, 'stone'), cx, 2.3, cz);
    const roof = gableRoof(bw, bd, 3.6, 0.35, 0x2a2228, 0x3e3a40, false); roof.position.set(cx, wallH, cz); g.add(roof); void rf;
    const dm = mesh(new THREE.ConeGeometry(0.7, 1.6, 4), std(0x2a2228), cx + bw * 0.2, wallH + 1.3, front - 0.2); dm.rotation.y = Math.PI / 4;
    door(g, dr.x, 0, dz, 'z', c, 1.15, 2.3);
    for (const [x, y] of [[cx + bw * 0.25, 1.4], [cx - bw * 0.15, 3.3], [cx + bw * 0.25, 3.3]] as [number, number][]) { glowW(0.55, 1.2, x, y, front + 0.03, 0xc8202a); const ar = mesh(new THREE.ConeGeometry(0.34, 0.4, 4), std(0x2a2628), x, y + 0.78, front + 0.06); ar.scale.z = 0.2; ar.rotation.y = Math.PI / 4; }
    for (let i = 0; i < 9; i++) { const p = mesh(new THREE.BoxGeometry(0.05, 1.0, 0.05), std(0x1a1a20), cx - bw / 2 + i * bw / 8, 0.5, front + 0.9); void p; const tip = mesh(new THREE.ConeGeometry(0.05, 0.18, 4), std(0x1a1a20), cx - bw / 2 + i * bw / 8, 1.08, front + 0.9); void tip; }
    mesh(new THREE.BoxGeometry(bw, 0.05, 0.05), std(0x1a1a20), cx, 0.85, front + 0.9);
    chimney(g, cx - bw * 0.3, cz - bd * 0.25, wallH + 1.2, 2.2, chim);
  } else if (style === 5) { // TRIBAL
    const r0 = Math.min(bw, bd) / 2, log = M(0x5a4030, 'wood'), th = std(0xffffff, { map: shingleTex0(0x8a7440) });
    mesh(new THREE.CylinderGeometry(r0, r0 * 1.05, 1.9, 12), log, cx, 0.95, cz);
    const roof = mesh(new THREE.ConeGeometry(r0 * 1.4, 3.4, 12), th, cx, 1.9 + 1.7, cz); void roof;
    for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2, st = mesh(new THREE.CylinderGeometry(0.05, 0.07, 1.4, 4), log, cx + Math.cos(a) * 0.35, 5.6, cz + Math.sin(a) * 0.35); st.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5); }
    door(g, dr.x, 0, cz + r0 + 0.02, 'z', c, 1.1, 1.7);
    const hide = mesh(new THREE.PlaneGeometry(1.3, 1.0), std(0x9a7a5a, { side: THREE.DoubleSide }), cx - r0 * 0.6, 1.2, cz + r0 * 0.82); hide.rotation.y = -0.6;
    for (const s of [-1, 1]) { const h = mesh(new THREE.ConeGeometry(0.08, 0.9, 5), std(0xe8dcc0), dr.x + s * 0.5, 2.2, cz + r0 + 0.15); h.rotation.z = s * 0.9; }
    mesh(new THREE.SphereGeometry(0.22, 7, 6), std(0xe8dcc0), dr.x, 2.15, cz + r0 + 0.18);
    chim.push(new THREE.Vector3(cx, 6.2, cz));
    lantern = new THREE.Vector3(dr.x + 0.9, 1.6, cz + r0 + 0.5);
  } else if (style === 6) { // PACTO
    const wd = M(0x3a2e3a, 'plank'), rf = 0x2a1a30;
    const body = mesh(texBox(bw, 2.6, bd, 1.6), wd, cx, 1.3, cz); body.rotation.z = 0.05; body.rotation.y = 0.04;
    const roof = gableRoof(bw, bd, 2.6, 0.5, rf, 0x3a2e3a, true); roof.position.set(cx + 0.12, 2.6, cz); roof.rotation.z = -0.08; roof.rotation.y = 0.06; g.add(roof);
    const tw = mesh(new THREE.ConeGeometry(0.5, 2.6, 5), std(0x2a1a30), cx - bw * 0.3, 5.4, cz - 0.3); tw.rotation.z = 0.35;
    door(g, dr.x, 0, dz, 'z', c, 1.15, 2.0);
    for (let i = 0; i < 4; i++) { const r = glowW(0.3, 0.3, cx + bw * 0.08 + i * 0.5, 1.6 + Math.sin(i) * 0.4, front + 0.04, 0xb06aff); r.rotation.z = Math.PI / 4 + i * 0.3; }
    glowW(0.7, 0.6, cx + bw * 0.3, 1.5, front + 0.03, 0x8a3ad0);
    mesh(new THREE.SphereGeometry(0.2, 7, 6), std(0xe8dcc0), dr.x, 2.4, dz + 0.12);
    for (let k = 0; k < 3; k++) { const b = mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.8, 4), std(0x2a2a2a), cx + bw / 2 + 0.3, 0.9, cz - 0.8 + k * 0.8); b.rotation.z = (k - 1) * 0.3; }
    chimney(g, cx + bw * 0.3, cz - bd * 0.2, 2.6 + 0.8, 1.4, chim);
  } else { // 7 VAPOR
    const br = M(0x8a4a3a, 'stone'), mt = std(0x4a4e56), brass = std(0xc8a050), wallH = 3.0;
    mesh(texBox(bw, wallH, bd, 1.6), br, cx, wallH / 2, cz);
    for (const y of [1.0, 2.2]) mesh(new THREE.BoxGeometry(bw + 0.04, 0.1, bd + 0.04), std(0x6a3a2e), cx, y, cz);
    const roofG = new THREE.Group(); { const a = Math.atan2(1.2, bd / 2), L = (bd / 2 + 0.4) / Math.cos(a); for (const s of [-1, 1]) { const piv = new THREE.Group(); piv.position.set(cx, wallH + 1.2, cz); piv.rotation.x = s * a; const m = new THREE.Mesh(new THREE.BoxGeometry(bw + 0.6, 0.1, L), mt); m.position.z = s * L / 2; m.castShadow = true; piv.add(m); roofG.add(piv); }
      for (let i = 0; i < 6; i++) for (const s of [-1, 1]) { const rib = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, L), std(0x5a5e66)); const piv = new THREE.Group(); piv.position.set(cx - bw / 2 + i * bw / 5, wallH + 1.2, cz); piv.rotation.x = s * a; rib.position.set(0, 0.08, s * L / 2); piv.add(rib); roofG.add(piv); } } g.add(roofG);
    for (const s of [-1, 1]) { const tri = new THREE.Shape(); tri.moveTo(-bd / 2, 0); tri.lineTo(bd / 2, 0); tri.lineTo(0, 1.2); const gm = new THREE.Mesh(new THREE.ShapeGeometry(tri), br); gm.position.set(cx + s * bw / 2, wallH, cz); gm.rotation.y = s * Math.PI / 2; g.add(gm); }
    door(g, dr.x, 0, dz, 'z', c, 1.3, 2.2);
    const rw = glowW(0.9, 0.9, cx + bw * 0.25, 1.8, front + 0.03, 0xffc070); void rw; const rim = mesh(new THREE.TorusGeometry(0.5, 0.07, 6, 16), brass, cx + bw * 0.25, 1.8, front + 0.06); void rim;
    const stack = mesh(new THREE.CylinderGeometry(0.32, 0.4, 4.2, 10), br, cx - bw * 0.3, wallH + 1.6, cz - bd * 0.2); void stack; mesh(new THREE.CylinderGeometry(0.42, 0.36, 0.3, 10), mt, cx - bw * 0.3, wallH + 3.8, cz - bd * 0.2); chim.push(new THREE.Vector3(cx - bw * 0.3, wallH + 4.1, cz - bd * 0.2));
    for (let k = 0; k < 2; k++) { const p = mesh(new THREE.CylinderGeometry(0.09, 0.09, wallH + 0.6, 6), brass, cx + bw / 2 + 0.12, (wallH + 0.6) / 2, cz - 0.6 + k * 0.5); void p; }
    const pp = mesh(new THREE.CylinderGeometry(0.09, 0.09, bw * 0.6, 6).rotateZ(Math.PI / 2), brass, cx + bw * 0.15, wallH - 0.3, front + 0.12); void pp;
    const gr = mesh(new THREE.TorusGeometry(0.35, 0.08, 4, 8), brass, cx - bw * 0.3, 1.5, front + 0.06); void gr;
  }
  void wallC; void roofC; void R; void ink; void scaleUV; void stairs; void volume;
  return { group: g, chimneys: chim, lantern };
}

/* ---------- O CHALÉ (28/10, Erling: "redesenha a única casa que temos para algo assim — aquela casa tá muito feia") ----------
   A casa do jogador, no espírito da foto que o Erling mandou: chalé de madeira cor de mel sobre pilares de pedra, empena alta virada
   para a frente com as duas janelas do sótão, telhado de telha de barro, varanda na largura toda com o seu próprio telhadinho,
   guarda-corpo de ripas, escada no meio, janelões dos dois lados da porta, chaminé de pedra, varal de luzinhas, vasos e cadeiras.
   Origem no canto da pegada (x,z), +z para a câmera (frente), igual às outras casas. A porta fica no meio da frente (obras.door()). */
const CH: Record<string, THREE.Texture> = {};
function chTex(key: string, draw: (g: CanvasRenderingContext2D, s: number) => void, s = 128) { if (CH[key]) return CH[key]; const c = document.createElement('canvas'); c.width = c.height = s; draw(c.getContext('2d')!, s);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter; t.anisotropy = 4; return (CH[key] = t); }
/** tábua horizontal sobreposta (lambri de fora): cada régua com a sombra da de cima */
const sidingTex = () => chTex('siding', (g, s) => { const n = 8, h = s / n; for (let i = 0; i < n; i++) { const k = 0.88 + Math.random() * 0.22; g.fillStyle = `rgb(${200 * k | 0},${122 * k | 0},${62 * k | 0})`; g.fillRect(0, i * h, s, h);
  for (let j = 0; j < 5; j++) { g.fillStyle = `rgba(90,45,15,${0.12 + Math.random() * 0.12})`; g.fillRect(0, i * h + Math.random() * h, s, 1); } g.fillStyle = 'rgba(255,220,160,.35)'; g.fillRect(0, i * h + 1, s, 1); g.fillStyle = 'rgba(40,18,6,.7)'; g.fillRect(0, i * h + h - 2, s, 2);
  if (i % 3 === 1) { g.fillStyle = 'rgba(40,18,6,.5)'; g.fillRect((i * 37) % s, i * h, 1.5, h); } } });
/** telha de barro capa-e-canal: colunas arredondadas, fiadas com sombra */
const telhaTex = () => chTex('telha', (g, s) => { const cols = 8, rows = 6, w = s / cols, h = s / rows; g.fillStyle = '#7a3418'; g.fillRect(0, 0, s, s);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const k = 0.85 + Math.random() * 0.25, x = c * w, y = r * h, gr = g.createLinearGradient(x, 0, x + w, 0);
    gr.addColorStop(0, `rgb(${150 * k | 0},${62 * k | 0},${32 * k | 0})`); gr.addColorStop(0.45, `rgb(${222 * k | 0},${118 * k | 0},${70 * k | 0})`); gr.addColorStop(1, `rgb(${140 * k | 0},${55 * k | 0},${28 * k | 0})`);
    g.fillStyle = gr; g.fillRect(x + 1, y, w - 2, h - 3); g.fillStyle = 'rgba(40,12,4,.55)'; g.fillRect(x, y + h - 3, w, 3); } });
export function buildChalet(Wm: number, Dm: number, c: Ctx): HouseOut {
  const g = new THREE.Group(), chim: THREE.Vector3[] = [];
  const wood = std(0xffffff, { map: sidingTex() }), trim = std(0x8a4e22), trimD = std(0x5a3216), deck = std(0xffffff, { map: plankTex(0xa86a34) }), stone = std(0xffffff, { map: stoneTex(0x8a8478) });
  const tileM = (w: number, l: number) => { const t = telhaTex().clone(); t.needsUpdate = true; t.repeat.set(w / 0.9, l / 0.9); return std(0xffffff, { map: t }); };
  const mesh = (geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, inked = 0.03) => { const k = new THREE.Mesh(geo, m); k.position.set(x, y, z); k.castShadow = k.receiveShadow = true; if (inked) ink(k, inked); g.add(k); return k; };
  const B = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
  const x0 = 0.5, x1 = Wm - 0.5, bw = x1 - x0, cx = Wm / 2, zb = 0.4, zf = Dm * 0.66, bd = zf - zb, czb = (zb + zf) / 2, zp = Dm - 0.25; // corpo (zb..zf) e varanda (zf..zp)
  const Y = 0.75, WH = 4.0, RH = Math.min(3.0, bw * 0.36); // piso sobre pilares, parede (térreo + sótão), altura do telhado
  /* pilares de pedra e o rodapé de ripas entre eles */
  for (const x of [x0 + 0.2, cx, x1 - 0.2]) for (const z of [zb + 0.2, czb, zf, zp - 0.15]) mesh(B(0.42, Y, 0.42), stone, x, Y / 2, z, 0.02);
  for (const [x, z, w, d] of [[cx, zb + 0.1, bw - 0.3, 0.06], [x0 + 0.12, czb, 0.06, bd - 0.2], [x1 - 0.12, czb, 0.06, bd - 0.2]] as const) mesh(B(w, Y - 0.1, d), trimD, x, (Y - 0.1) / 2, z, 0);
  /* o corpo: lambri horizontal, cantoneiras escuras, frechal */
  const body = mesh(texBox(bw, WH, bd, 2.2), wood, cx, Y + WH / 2, czb, 0.05); void body;
  for (const x of [x0, x1]) for (const z of [zb, zf]) mesh(B(0.2, WH + 0.1, 0.2), trim, x, Y + WH / 2, z, 0.02);
  mesh(B(bw + 0.2, 0.18, 0.18), trimD, cx, Y + 2.85, zf + 0.04, 0); // viga onde apoia a varanda
  mesh(B(bw + 0.3, 0.16, bd + 0.3), trimD, cx, Y + 0.05, czb, 0); // soleira do piso
  /* o telhado principal: duas águas, cumeeira de trás para a frente (a empena alta olhando para a rua), telha de barro */
  { const over = 0.75, a = Math.atan2(RH, bw / 2), L = (bw / 2 + over) / Math.cos(a), len = bd + 1.1;
    for (const s of [-1, 1]) { const piv = new THREE.Group(); piv.position.set(cx, Y + WH + RH + 0.05, czb + 0.25); piv.rotation.z = s * -a; g.add(piv);
      const sl = new THREE.Mesh(B(L, 0.18, len), tileM(L, len)); sl.position.x = s * L / 2; sl.castShadow = true; ink(sl, 0.04); piv.add(sl);
      const fas = new THREE.Mesh(B(L, 0.12, 0.14), trimD); fas.position.set(s * L / 2, -0.05, len / 2); piv.add(fas); const fb = fas.clone(); fb.position.z = -len / 2; piv.add(fb);
      for (let i = 1; i < 5; i++) { const cb = new THREE.Mesh(B(0.16, 0.16, 0.5), trim); cb.position.set(s * L * i / 5, -0.14, len / 2 - 0.4); piv.add(cb); } } // cachorros (pontas dos caibros) sob o beiral
    mesh(B(0.26, 0.22, len + 0.05), std(0x9a4424), cx, Y + WH + RH + 0.2, czb + 0.25, 0.02); // cumeeira de telha
    const tri = new THREE.Shape(); tri.moveTo(-bw / 2, 0); tri.lineTo(bw / 2, 0); tri.lineTo(0, RH); tri.closePath(); const tg = new THREE.ExtrudeGeometry(tri, { depth: 0.2, bevelEnabled: false }); scaleUV(tg, 1 / 2.2, 1 / 2.2);
    for (const z of [zf - 0.2, zb]) mesh(tg, wood, cx, Y + WH, z, 0.03); }
  /* a varanda: deck, telhadinho de uma água, esteios, guarda-corpo de ripas, escada no meio */
  const pw = bw + 0.4, pd = zp - zf, sw = 1.7; mesh(B(pw, 0.16, pd), deck, cx, Y - 0.02, zf + pd / 2, 0.02);
  { const yTop = Y + 2.95, yLow = Y + 2.45, ang = Math.atan2(yTop - yLow, pd + 0.6), L = (pd + 0.6) / Math.cos(ang);
    const r = mesh(B(pw + 0.6, 0.14, L), tileM(pw + 0.6, L), cx, (yTop + yLow) / 2 + 0.1, zf + (pd + 0.6) / 2, 0.04); r.rotation.x = ang;
    mesh(B(pw + 0.6, 0.18, 0.16), trimD, cx, yLow + 0.02, zp + 0.3, 0); mesh(B(pw, 0.2, 0.18), trim, cx, yLow - 0.12, zp - 0.05, 0.02); // beiral e viga da frente
    for (const x of [x0 - 0.1, x0 + pw * 0.3, x1 - pw * 0.3, x1 + 0.1]) mesh(B(0.2, yLow - Y - 0.1, 0.2), trim, x, (yLow + Y) / 2 - 0.05, zp - 0.05, 0.02);
    for (const x of [x0 - 0.1, x1 + 0.1]) mesh(B(0.18, yTop - Y - 0.3, 0.18), trim, x, (yTop + Y) / 2 - 0.15, zf + 0.1, 0.02);
    /* varal de luzinhas entre os esteios (uma malha instanciada só) */
    const NL = 22, bulbs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.055, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffd27a, toneMapped: false }), NL), m4 = new THREE.Matrix4();
    for (let i = 0; i < NL; i++) { const t = i / (NL - 1), seg = t * 3, k = seg % 1, sx = x0 - 0.1 + t * (pw + 0.2); m4.makeTranslation(sx, yLow - 0.32 - Math.sin(k * Math.PI) * 0.22, zp + 0.06); bulbs.setMatrixAt(i, m4); } g.add(bulbs); }
  { const yR = Y + 0.95, rails: [number, number, number, number][] = [[x0 - 0.1, zp - 0.05, cx - sw / 2, zp - 0.05], [cx + sw / 2, zp - 0.05, x1 + 0.1, zp - 0.05], [x0 - 0.1, zf + 0.1, x0 - 0.1, zp - 0.05], [x1 + 0.1, zf + 0.1, x1 + 0.1, zp - 0.05]];
    for (const [ax, az, bx, bz] of rails) { const L = Math.hypot(bx - ax, bz - az), along = Math.abs(bx - ax) > 0.01, mx = (ax + bx) / 2, mz = (az + bz) / 2;
      for (const [y, t] of [[yR, 0.1], [Y + 0.62, 0.07], [Y + 0.32, 0.07]] as const) mesh(along ? B(L, t, 0.09) : B(0.09, t, L), y === yR ? trim : trimD, mx, y, mz, 0.015);
      const n = Math.max(1, Math.round(L / 1.1)); for (let i = 1; i < n; i++) { const t = i / n; mesh(B(0.12, 0.95, 0.12), trim, ax + (bx - ax) * t, Y + 0.47, az + (bz - az) * t, 0.015); } }
    for (const s of [-1, 1]) mesh(B(0.16, 1.1, 0.16), trim, cx + s * sw / 2, Y + 0.5, zp - 0.05, 0.02); }
  { const n = 3, sh = Y / n, sd = 0.34; for (let i = 0; i < n; i++) mesh(B(sw - 0.1, 0.1, sd + 0.05), deck, cx, sh * (n - i) - sh - 0.03 + 0.08, zp + sd * (i + 0.5), 0.02);
    for (const s of [-1, 1]) { const len = Math.hypot(n * sd, Y), ang = Math.atan2(Y, n * sd); const str = mesh(B(0.1, 0.22, len), trimD, cx + s * (sw / 2 - 0.02), Y / 2 - 0.05, zp + n * sd / 2, 0.02); str.rotation.x = ang;
      const hr = mesh(B(0.08, 0.08, len + 0.1), trim, cx + s * (sw / 2), Y / 2 + 0.92, zp + n * sd / 2, 0.015); hr.rotation.x = ang; mesh(B(0.12, 0.9, 0.12), trim, cx + s * sw / 2, 0.45, zp + n * sd, 0.015); } }
  /* porta no meio, janelões dos dois lados (com cortina), as duas janelas do sótão na empena, janelas dos lados */
  door(g, cx, Y, zf + 0.02, 'z', c, 1.2, 2.2);
  const win = (x: number, y: number, z: number, w: number, h: number, ry: number, panes = 2) => { const q = new THREE.Group(); q.position.set(x, y, z); q.rotation.y = ry; g.add(q);
    const gl = new THREE.Mesh(new THREE.PlaneGeometry(w, h), c.windows); gl.position.z = 0.02; q.add(gl);
    for (const s of [-1, 1]) { const cu = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.22, h * 0.95), std(0xe8e0d0)); cu.position.set(s * w * 0.38, 0, 0.03); q.add(cu); }
    for (const [bx, by, bwid, bh] of [[0, h / 2 + 0.06, w + 0.3, 0.14], [0, -h / 2 - 0.07, w + 0.36, 0.14], [-w / 2 - 0.07, 0, 0.14, h + 0.2], [w / 2 + 0.07, 0, 0.14, h + 0.2]]) { const f = new THREE.Mesh(B(bwid, bh, 0.12), trimD); f.position.set(bx, by, 0.05); q.add(f); }
    for (let i = 1; i < panes; i++) { const mu = new THREE.Mesh(B(0.06, h, 0.05), trimD); mu.position.set(-w / 2 + w * i / panes, 0, 0.07); q.add(mu); } const mh = new THREE.Mesh(B(w, 0.05, 0.05), trimD); mh.position.set(0, h * 0.1, 0.07); q.add(mh); };
  for (const s of [-1, 1]) win(cx + s * bw * 0.27, Y + 1.25, zf + 0.03, 1.7, 1.55, 0, 3);
  for (const s of [-1, 1]) win(cx + s * 0.75, Y + 3.45, zf + 0.03, 0.85, 0.95, 0, 2);
  for (const s of [-1, 1]) for (const z of [zb + bd * 0.3, zb + bd * 0.72]) win(cx + s * (bw / 2 + 0.03), Y + 1.3, z, 1.0, 1.15, s * Math.PI / 2, 2);
  win(cx, Y + WH + RH * 0.38, zf - 0.02 + 0.2, 0.55, 0.55, 0, 1); // o olho de boi no alto da empena
  for (const s of [-1, 1]) win(cx + s * bw * 0.26, Y + 1.3, zb - 0.03, 1.0, 1.15, Math.PI, 2); win(cx, Y + 3.3, zb - 0.03, 0.85, 0.95, Math.PI, 2); // janelas dos fundos (cozinha e quarto) e do sótão
  /* chaminé de pedra quadrada, atrás à direita, furando o telhado */
  { const hx = cx + bw * 0.28, hz = zb + bd * 0.3, top = Y + WH + RH * 0.75 + 1.1; mesh(texBox(0.85, top, 0.85, 1.4), stone, hx, top / 2, hz, 0.04); mesh(B(1.05, 0.14, 1.05), std(0x5a564e), hx, top + 0.07, hz, 0.02); mesh(B(0.5, 0.06, 0.5), std(0x080606), hx, top + 0.15, hz, 0); chim.push(new THREE.Vector3(hx, top + 0.4, hz)); }
  /* a vida na varanda: vasos com folhagem, duas cadeiras de vime e uma mesinha */
  const leaf = std(0x4a8a3a), pot = std(0xa8542c);
  for (const [x, z] of [[x0 + 0.5, zp - 0.45], [x1 - 0.5, zf + 0.5], [cx - sw / 2 - 0.35, zp - 0.35]] as const) { mesh(new THREE.CylinderGeometry(0.22, 0.16, 0.36, 8), pot, x, Y + 0.18, z, 0.02); const b = mesh(new THREE.IcosahedronGeometry(0.34, 0), leaf, x, Y + 0.55, z, 0.02); b.scale.set(1, 0.85, 1); }
  for (const s of [1]) { const bx = cx + s * bw * 0.27, cm = std(0xd8c8a8); for (const o of [-0.55, 0.55]) { mesh(B(0.55, 0.12, 0.55), cm, bx + o, Y + 0.45, zp - 0.75, 0.02); mesh(B(0.55, 0.55, 0.1), cm, bx + o, Y + 0.75, zp - 0.5, 0.02); for (const lx of [-0.22, 0.22]) mesh(B(0.06, 0.4, 0.06), trimD, bx + o + lx, Y + 0.2, zp - 0.75, 0); }
    mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.06, 10), trimD, bx, Y + 0.55, zp - 0.95, 0.02); mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.5, 5), trimD, bx, Y + 0.28, zp - 0.95, 0); mesh(new THREE.IcosahedronGeometry(0.14, 0), std(0xd84a5a), bx, Y + 0.68, zp - 0.95, 0); }
  /* uma rede de dormir na ponta esquerda da varanda */
  { const hx = cx - bw * 0.3, hm = mesh(new THREE.CylinderGeometry(0.32, 0.32, 1.9, 10, 1, true, Math.PI * 0.15, Math.PI * 0.7), std(0xe0c890, { side: THREE.DoubleSide }), hx, Y + 1.05, zp - 0.9, 0); hm.rotation.z = Math.PI / 2; hm.rotation.x = Math.PI; }
  return { group: g, chimneys: chim, lantern: new THREE.Vector3(cx + 0.9, Y + 2.0, zf + 0.25) };
}
