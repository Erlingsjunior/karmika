/** Catedral gótica abandonada (estilo Sé): nave altíssima com telhado agudo, clerestório de janelas ogivais, arcobotantes,
 *  duas torres de fachada com flechas, pináculos ao longo das bordas, rosácea, portal em arco com escadaria e abside. */
import * as THREE from 'three';
import { std, ink, stoneTex, gableRoof } from './toon3d';
import { vitral, TEMAS, type Tam } from './vitrais';

export function buildGothic(Wm: number, Dm: number, wallC: number, roofC: number, lit = false): THREE.Group {
  const g = new THREE.Group();
  const sm = std(0xffffff, { map: stoneTex(wallC) }), smD = std(0xffffff, { map: stoneTex(0x3a3634) }), dark = new THREE.MeshBasicMaterial({ color: 0x14101e }), glass = new THREE.MeshBasicMaterial({ color: lit ? 0xffc070 : 0x2a2440, toneMapped: !lit });
  const add = (geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, ry = 0, inked = true) => { const b = new THREE.Mesh(geo, m); if (inked) ink(b, 0.06); b.position.set(x, y, z); b.rotation.y = ry; b.castShadow = b.receiveShadow = true; g.add(b); return b; };
  const B = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
  /* vitrais apagados (a catedral está abandonada): os 12 desenhos, só que escuros; a rosácea ainda brilha de noite */
  let vk = 0; const V = (sz: Tam, x: number, y: number, z: number, ry: number, sc: number, mode: 'ruin' | 'out' = lit ? 'out' : 'ruin') => { const v = vitral(TEMAS[(vk++) % 4], sz, smD, mode, sc); v.position.set(x, y, z); v.rotation.y = ry; g.add(v); return v; };
  const H = 26, naveW = Wm * 0.62, aisleH = 12, towerW = Wm * 0.19, towerH = 40;
  const cx = Wm / 2, front = Dm; // fachada ao sul
  // base: plataforma e escadaria
  add(B(Wm + 6, 1.2, Dm + 4), smD, cx, 0.6, Dm / 2, 0, false);
  // a escadaria desce do adro até o chão (antes subia POR CIMA da plataforma e o herói atravessava os degraus): 5 degraus de 24 cm, pisada de 60 cm
  for (let k = 0; k < 5; k++) { const top = 0.24 * (k + 1), hh = top + 1.5; add(B(naveW + 4 - (4 - k) * 0.4 + 2, hh, 0.6), smD, cx, top - hh / 2, front + 2 + (4 - k) * 0.6 + 0.3, 0, false); }
  // corpo da nave (alto) e naves laterais (baixas) com telhados
  add(B(naveW, H, Dm - towerW), sm, cx, 1.2 + H / 2, (Dm - towerW) / 2);
  for (const sx of [-1, 1]) add(B((Wm - naveW) / 2, aisleH, Dm - towerW), sm, cx + sx * (naveW / 2 + (Wm - naveW) / 4), 1.2 + aisleH / 2, (Dm - towerW) / 2);
  const roof = gableRoof(naveW + 0.8, Dm - towerW + 0.8, 11, 0.6, roofC, wallC, false); roof.position.set(cx, 1.2 + H, (Dm - towerW) / 2); g.add(roof);
  for (const sx of [-1, 1]) { const ar = gableRoof((Wm - naveW) / 2 + 0.6, Dm - towerW + 0.6, 4, 0.4, roofC, wallC, false); ar.position.set(cx + sx * (naveW / 2 + (Wm - naveW) / 4), 1.2 + aisleH, (Dm - towerW) / 2); g.add(ar); }
  // clerestório: janelas ogivais altas (vidro escuro) nas duas faces da nave, e arcobotantes entre elas
  const nWin = Math.floor((Dm - towerW) / 4.2);
  for (let k = 0; k < nWin; k++) { const z = 3 + k * 4.2 + 1.5;
    for (const sx of [-1, 1]) {
      const x = cx + sx * (naveW / 2 + 0.05);
      V('m', x + sx * 0.02, 1.2 + aisleH + 4.6, z, sx * Math.PI / 2, 2.4);

      if (k % 2 === 1) { // arcobotante: pilar no beiral da nave lateral + arco inclinado até o alto da nave
        const px = cx + sx * (Wm / 2 - 0.9); add(B(1.4, aisleH + 6, 1.4), smD, px, 1.2 + (aisleH + 6) / 2, z);
        const fb = add(B(1.0, 1.0, 0.9), smD, (px + x) / 2, 1.2 + aisleH + 10, z); fb.scale.set((Math.hypot(px - x, 7) / 1.0), 1, 1); fb.rotation.z = sx * Math.atan2(7, Math.abs(px - x)) * -1;
        add(new THREE.ConeGeometry(0.5, 2.6, 5), smD, px, 1.2 + aisleH + 6 + 1.3, z, 0, false); // pináculo sobre o pilar
      }
      // janelas das naves laterais
      V('p', cx + sx * (Wm / 2 + 0.07), 1.2 + 3.6, z, sx * Math.PI / 2, 2.5);
    }
  }
  // pináculos ao longo das cumeeiras laterais da nave alta
  for (let k = 0; k <= nWin; k++) for (const sx of [-1, 1]) add(new THREE.ConeGeometry(0.45, 3, 5), smD, cx + sx * (naveW / 2 - 0.3), 1.2 + H + 1.5, 3 + k * 4.2, 0, false);
  // abside ao norte: semicírculo de pilares e paredes com janelas
  const apR = naveW / 2;
  for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + i * Math.PI / 8, x = cx + Math.sin(a) * apR, z = -Math.cos(a) * apR * 0.6; add(B(2.2, H - 2, 2.2), sm, x, 1.2 + (H - 2) / 2, z, -a); if (i % 2) { const w = new THREE.Mesh(B(0.12, 9, 1.2), glass); w.position.set(x + Math.sin(a) * 1.15, 1.2 + aisleH + 6, z - Math.cos(a) * 1.15); w.rotation.y = -a; g.add(w); } add(new THREE.ConeGeometry(0.5, 2.8, 5), smD, x, 1.2 + H - 0.6, z, 0, false); }
  const apRoof = new THREE.Mesh(new THREE.ConeGeometry(apR * 0.95, 9, 9, 1, false, -Math.PI / 2, Math.PI), std(roofC)); apRoof.position.set(cx, 1.2 + H - 2 + 4.5, 0); apRoof.scale.z = 0.6; g.add(apRoof);
  // fachada: duas torres com flechas, portal ogival profundo, rosácea, galeria de pináculos
  for (const sx of [-1, 1]) {
    const tx = cx + sx * (Wm / 2 - towerW / 2), tz = front - towerW / 2;
    add(B(towerW, towerH, towerW), sm, tx, 1.2 + towerH / 2, tz);
    for (let k = 0; k < 3; k++) V('p', tx, 1.2 + 6.6 + k * 10, tz + towerW / 2 + 0.06, 0, 2.8);
    add(B(towerW + 1.2, 1.2, towerW + 1.2), smD, tx, 1.2 + towerH + 0.6, tz, 0, false);
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4; add(new THREE.ConeGeometry(0.7, 4.5, 5), smD, tx + Math.cos(a) * (towerW / 2 - 0.3) * 1.2, 1.2 + towerH + 3.2, tz + Math.sin(a) * (towerW / 2 - 0.3) * 1.2, 0, false); }
    add(new THREE.ConeGeometry(towerW * 0.5, 16, 8), std(roofC), tx, 1.2 + towerH + 1.2 + 8, tz, 0, false); // flecha
    add(new THREE.ConeGeometry(0.18, 2.4, 4), std(0xc9a24a), tx, 1.2 + towerH + 1.2 + 16 + 1.2, tz, 0, false);
  }
  const fz = front - 0.2;
  add(B(naveW, H + 4, 1.6), sm, cx, 1.2 + (H + 4) / 2, fz); // frontão entre as torres
  const gable = new THREE.Mesh(new THREE.ConeGeometry(naveW * 0.72, 7, 4), std(roofC)); gable.rotation.y = Math.PI / 4; gable.scale.set(1, 1, 0.15); gable.position.set(cx, 1.2 + H + 4 + 3.5, fz); g.add(gable);
  add(new THREE.ConeGeometry(0.3, 4, 4), std(0xc9a24a), cx, 1.2 + H + 4 + 7 + 2, fz, 0, false);
  for (let k = -2; k <= 2; k++) if (k) add(new THREE.ConeGeometry(0.4, 3, 5), smD, cx + k * naveW * 0.22, 1.2 + H + 4 + 1.5, fz, 0, false);
  // rosácea
  { const sc = naveW * 0.4 / 2.2; V('g', cx, 1.2 + H * 0.68 - naveW * 0.2, fz + 0.82, 0, sc, 'out'); }
  // portal ogival profundo com arquivoltas e porta escura
  for (let k = 0; k < 3; k++) { const w = 5.6 - k * 1.1, h = 9 - k * 1.3; add(B(w + 1.4, h + 0.7, 0.5), smD, cx, 1.2 + (h + 0.7) / 2, fz + 0.85 + k * 0.45); const top = new THREE.Mesh(new THREE.ConeGeometry((w + 1.4) / 2, 2.2, 4), smD); top.rotation.y = Math.PI / 4; top.scale.set(1, 1, 0.22); top.position.set(cx, 1.2 + h + 0.7 + 1.1, fz + 0.85 + k * 0.45); g.add(top); }
  const door = new THREE.Mesh(B(3.4, 6.5, 0.3), dark); door.position.set(cx, 1.2 + 3.25, fz + 2.3); g.add(door);
  for (const sx of [-1, 1]) { const st2 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 3.4, 6), smD); st2.position.set(cx + sx * 2.9, 1.2 + 1.7, fz + 2.3); g.add(st2); const sh = new THREE.Mesh(new THREE.SphereGeometry(0.34, 7, 6), smD); sh.position.set(cx + sx * 2.9, 1.2 + 3.7, fz + 2.3); g.add(sh); }
  // gárgulas (blocos inclinados) nos cantos das torres e da nave
  for (const [x, z] of [[cx - naveW / 2, 2], [cx + naveW / 2, 2], [cx - naveW / 2, Dm - towerW - 2], [cx + naveW / 2, Dm - towerW - 2]] as [number, number][]) { const gg = new THREE.Mesh(B(0.6, 0.6, 1.6), smD); gg.position.set(x + (x < cx ? -0.6 : 0.6), 1.2 + H - 0.4, z); gg.rotation.x = -0.3; g.add(gg); }
  return g;
}
