import * as THREE from 'three';
import { std, ink, texBox, plankTex, stoneTex, plasterTex, woodTex, gableRoof, scaleUV } from './toon3d';

/** onde fica a porta da frente de cada modelo de casa (coordenadas locais da casa, chão): a luz da porta usa isto */
export function houseDoor(variant: number, Wm: number, Dm: number): { x: number; z: number; y: number; w: number; h: number } {
  const bw = Wm - 0.5, bd = Dm - 0.5, cx = Wm / 2, cz = Dm / 2, front = cz + bd / 2;
  if (variant === 0) return { x: cx - bw * 0.2, z: front + 0.02, y: 0, w: 1.25, h: 2.2 };
  if (variant === 1) return { x: cx - bw * 0.25, z: front + 0.04, y: 0, w: 1.25, h: 2.2 };
  if (variant === 2) return { x: cx + bw * 0.2, z: cz + bd * 0.18 + bd * 0.29 + 0.04, y: 0.35, w: 1.25, h: 2.2 };
  if (variant === 3) return { x: cx, z: cz + Math.min(bd, 4.2) / 2 + 0.02, y: 0, w: 1.2, h: 2.1 };
  if (variant === 5) return { x: cx - bw * 0.1, z: front + 0.04, y: 0, w: 1.7, h: 2.4 };
  return { x: cx - bw * 0.15, z: front + 0.04, y: 0, w: 1.5, h: 2.3 };
}
export interface HouseOut { group: THREE.Group; chimneys: THREE.Vector3[]; lantern: THREE.Vector3 }
interface Ctx { windows: THREE.MeshBasicMaterial; rnd: () => number }

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
  const g = new THREE.Group(); g.position.set(x, y0, z); if (face === 'x') g.rotation.y = Math.PI / 2;
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
    const str = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.22, Math.hypot(len, H)), timberM()); str.position.set(sx * (width / 2 + 0.04), H / 2 - 0.1, -len / 2); str.rotation.x = -ang; g.add(str);
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, Math.hypot(len, H)), timberM()); rail.position.set(sx * (width / 2 + 0.04), H / 2 + 0.85, -len / 2); rail.rotation.x = -ang; g.add(rail);
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

/** um volume: base de pedra + parede + telhado de duas águas */
function volume(parent: THREE.Object3D, cx: number, cz: number, w: number, d: number, y0: number, wallH: number, roofH: number, wallC: number, roofC: number, kind: 'plank' | 'plaster' | 'stone', alongX: boolean, over = 0.5) {
  const g = new THREE.Group(); g.position.set(cx, y0, cz);
  const wallMat = kind === 'stone' ? std(0xffffff, { map: stoneTex(wallC) }) : kind === 'plaster' ? std(0xffffff, { map: plasterTex(wallC) }) : std(0xffffff, { map: plankTex(wallC) });
  const walls = new THREE.Mesh(texBox(w, wallH, d, kind === 'plaster' ? 2.4 : 1.6), wallMat); ink(walls, 0.05); walls.position.y = wallH / 2; walls.castShadow = walls.receiveShadow = true; g.add(walls);
  if (kind !== 'stone') { const base = new THREE.Mesh(texBox(w + 0.12, 0.55, d + 0.12, 1.6), std(0xffffff, { map: stoneTex(0x6a665e) })); base.position.y = 0.27; g.add(base); }
  const roof = gableRoof(w, d, roofH, over, roofC, wallC, alongX); roof.position.y = wallH; g.add(roof);
  parent.add(g); return g;
}

/**
 * 5 tipos de casa. `Wm`,`Dm` = pegada em metros; origem no canto (x,z) da pegada, +z para a câmera.
 */
export function buildHouse(variant: number, Wm: number, Dm: number, wallC: number, roofC: number, c: Ctx): HouseOut {
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
    stairs(g, cx + bw / 2 + 0.5, cz + bd / 2 - 0.4, 2.5, false, 1.0);
    door(g, cx + bw / 2 + 0.75, 2.5, cz - 0.8, 'x', c, 1.0, 1.9);
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
  } else if (variant === 3) { // torre / atalaia: pedra alta, sacada de madeira, telhado alto e escada lateral
    const tw = Math.min(bw, 4.2), td = Math.min(bd, 4.2);
    volume(g, cx, cz, tw, td, 0, 5.2, 3.0, 0x6a665e, 0x4a4a58, 'stone', true, 0.5);
    door(g, cx, 0, cz + td / 2 + 0.02, 'z', c, 1.2, 2.1);
    for (const y of [2.4, 4.1]) windowAt(g, cx - tw * 0.25, y, cz + td / 2 + 0.04, 'z', y > 3 && R() < 0.6, c, c.windows);
    windowAt(g, cx + tw / 2 + 0.03, 3.4, cz, 'x', false, c, c.windows);
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
    const wallH = 2.6, st = M(0x6a5e52, 'stone'), dk = M(0x4a423a, 'stone'), cu = std(0xb06a3a);
    mesh(texBox(bw + 0.3, 0.6, bd + 0.3, 1.6), dk, cx, 0.3, cz);
    mesh(texBox(bw, wallH, bd, 1.6), st, cx, wallH / 2 + 0.3, cz);
    mesh(texBox(bw + 0.4, 0.35, bd + 0.4, 1.6), dk, cx, wallH + 0.47, cz);
    mesh(texBox(bw - 1.0, 0.9, bd - 1.0, 1.6), st, cx, wallH + 1.1, cz);
    mesh(texBox(bw - 0.8, 0.25, bd - 0.8, 1.6), dk, cx, wallH + 1.67, cz);
    mesh(new THREE.BoxGeometry(bw + 0.02, 0.22, 0.05), cu, cx, wallH - 0.2, front + 0.01);
    for (let i = 0; i < 5; i++) { const r = mesh(new THREE.PlaneGeometry(0.22, 0.22), std(0xffd27a), cx - bw / 2 + 0.6 + i * (bw - 1.2) / 4, wallH - 0.2, front + 0.05); r.rotation.z = Math.PI / 4; }
    const a = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.16, 6, 12, Math.PI), dk); a.position.set(dr.x, 1.9, dz + 0.08); g.add(a);
    door(g, dr.x, 0.3, dz, 'z', c, 1.4, 1.9);
    glowW(0.6, 0.5, cx + bw * 0.28, 1.6, front + 0.03, 0xff8a3a);
    const ch = mesh(new THREE.CylinderGeometry(0.42, 0.55, 2.4, 8), dk, cx + bw * 0.3, wallH + 1.9, cz - bd * 0.2); void ch; glowW(0.4, 0.4, cx + bw * 0.3, wallH + 3.12, cz - bd * 0.2, 0xff6a20).rotation.x = -Math.PI / 2; chim.push(new THREE.Vector3(cx + bw * 0.3, wallH + 3.3, cz - bd * 0.2));
    lantern = new THREE.Vector3(dr.x + 1.0, 1.9, front + 0.5);
  } else if (style === 3) { // ÉLFICO
    const iv = M(0xe8e0cc, 'plaster'), lf = std(0x3a7a5a), wd = M(0x8a6a4a, 'wood'), r0 = Math.min(bw, bd) / 2;
    mesh(new THREE.CylinderGeometry(r0 + 0.3, r0 + 0.4, 0.4, 16), M(0xb8b0a0, 'stone'), cx, 0.2, cz);
    mesh(new THREE.CylinderGeometry(r0, r0 * 1.04, 3.0, 16), iv, cx, 1.9, cz);
    for (let k = 0; k < 3; k++) { const rr = r0 * (1.35 - k * 0.32), y = 3.4 + k * 1.15; const t = mesh(new THREE.ConeGeometry(rr, 1.5, 16, 1, true), lf, cx, y + 0.75, cz); (t.material as THREE.Material).side = THREE.DoubleSide;
      const rim = mesh(new THREE.TorusGeometry(rr * 0.98, 0.07, 4, 20), std(0xd8c070), cx, y + 0.02, cz); rim.rotation.x = Math.PI / 2; }
    mesh(new THREE.ConeGeometry(0.12, 2.0, 6), std(0xd8c070), cx, 7.9, cz);
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), new THREE.MeshBasicMaterial({ color: 0x9ae0ff, toneMapped: false })); orb.position.set(cx, 8.95, cz); g.add(orb);
    door(g, dr.x, 0.4, cz + r0 + 0.02, 'z', c, 1.2, 2.2);
    const ar = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.09, 4, 14, Math.PI), std(0xd8c070)); ar.position.set(dr.x, 2.6, cz + r0 + 0.08); g.add(ar);
    for (const a of [0.9, 2.2, -0.6]) glowW(0.5, 1.0, cx + Math.cos(a) * (r0 + 0.02), 2.2, cz + Math.sin(a) * (r0 + 0.02), 0x9ad8ff, Math.PI / 2 - a);
    for (let k = 0; k < 7; k++) { const a = k * 0.9, v = mesh(new THREE.SphereGeometry(0.22, 6, 5), std(0x4a8a4a), cx + Math.cos(a) * (r0 + 0.05), 0.6 + (k % 3) * 0.8, cz + Math.sin(a) * (r0 + 0.05)); v.scale.set(1, 1.6, 0.5); }
    void wd; lantern = new THREE.Vector3(dr.x + 0.9, 2.0, cz + r0 + 0.6);
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
