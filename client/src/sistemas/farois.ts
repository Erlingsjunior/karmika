/* OS FARÓIS DOS PORTOS (07/11, Erling: "todo lugar com porto ganha um farol diferente, com Fonte da Visão contando a viagem; faróis lindos na
   beirada iluminando o horizonte"). Cada farol tem a cara do povo do porto e um facho que gira varrendo o mar (forte à noite, fraco de dia):
   - Skjoldvik (nórdico): torre de pedra redonda com faixas de runas, galeria de madeira e braseiro aberto — luz de fogo.
   - Corvoscuro (gótico): torre negra de oito faces, contrafortes e pináculos, lanterna de vitral — luz vermelha.
   - Gorvath (pacto): torre torta de pedra escura amarrada por correntes, com um olho de cristal — luz verde-violeta.
   - Ferrugem (vapor): torre de ferro rebitado e latão, engrenagens e lente de Fresnel — luz elétrica branca.
   - O Farol Tecnocrático de Porto Caldeira já existe: ganha só o facho. */
import * as THREE from 'three';
import { TILE_M as T } from '@karmika/shared';
import { heightAt, type World } from '../world';

type Sty = 'nordico' | 'gotico' | 'pacto' | 'vapor';
const M = (c: number, r = 0.85, m = 0.05, e = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, emissive: e ? new THREE.Color(e) : undefined, emissiveIntensity: e ? 1.4 : 0 });
const LIGHT: Record<Sty, number> = { nordico: 0xffa040, gotico: 0xff3a3a, pacto: 0x8aff9a, vapor: 0xeaf6ff };

function tower(sty: Sty): { g: THREE.Group; top: number } {
  const g = new THREE.Group(); const add = (geo: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; g.add(o); return o; };
  const rock = M(0x5a5650, 0.95); /* o rochedo da base: o farol fica em cima de pedra (regra 19) */
  for (let i = 0; i < 7; i++) { const a = i * 0.9, r = 2.6 + (i % 3) * 0.7; const b = add(new THREE.DodecahedronGeometry(1.4 + (i % 2) * 0.6, 0), rock, Math.cos(a) * r, 0.2, Math.sin(a) * r); b.rotation.set(i, i * 2, 0); }
  add(new THREE.CylinderGeometry(3.6, 4.4, 1.6, 9), rock, 0, 0.6);
  if (sty === 'nordico') { const st = M(0x8a8478, 0.9), wd = M(0x5a3a22), rune = M(0x6ac0ff, 0.5, 0, 0x2a80ff);
    add(new THREE.CylinderGeometry(2.0, 2.9, 15, 12), st, 0, 9); for (const y of [5, 10, 14]) add(new THREE.CylinderGeometry(2.25 - y * 0.03, 2.3 - y * 0.03, 0.5, 12), rune, 0, y);
    add(new THREE.CylinderGeometry(3.0, 2.2, 0.7, 12), wd, 0, 16.8); for (let i = 0; i < 12; i++) { const a = (i / 12) * 6.283; add(new THREE.BoxGeometry(0.2, 1.2, 0.2), wd, Math.cos(a) * 2.8, 17.7, Math.sin(a) * 2.8); }
    add(new THREE.CylinderGeometry(1.3, 0.9, 1.2, 10), M(0x2a2420, 0.6, 0.6), 0, 17.8); add(new THREE.ConeGeometry(2.6, 3.4, 12), wd, 0, 21.2); return { g, top: 18.8 }; }
  if (sty === 'gotico') { const bk = M(0x1e1a22, 0.8), red = M(0xff3040, 0.4, 0, 0xc01020);
    add(new THREE.CylinderGeometry(1.7, 2.6, 17, 8), bk, 0, 9.5); for (let i = 0; i < 4; i++) { const a = i * 1.571 + 0.39; const f = add(new THREE.BoxGeometry(0.8, 9, 1.4), bk, Math.cos(a) * 2.4, 5.2, Math.sin(a) * 2.4); f.rotation.y = -a; f.rotation.z = 0.1; }
    add(new THREE.CylinderGeometry(2.2, 1.8, 0.6, 8), bk, 0, 18.3); add(new THREE.CylinderGeometry(1.3, 1.3, 2.4, 8, 1, true), red, 0, 19.8);
    add(new THREE.ConeGeometry(1.9, 5.5, 8), bk, 0, 23.8); for (let i = 0; i < 8; i++) { const a = (i / 8) * 6.283; add(new THREE.ConeGeometry(0.25, 2.2, 4), bk, Math.cos(a) * 2.0, 19.6, Math.sin(a) * 2.0); } return { g, top: 19.8 }; }
  if (sty === 'pacto') { const st = M(0x3a3440, 0.9), ch = M(0x8a8a8a, 0.4, 0.8), eye = M(0xb0ffb8, 0.2, 0, 0x40ff70);
    for (let i = 0; i < 6; i++) { const s = add(new THREE.CylinderGeometry(2.1 - i * 0.18, 2.4 - i * 0.18, 3, 7), st, Math.sin(i * 0.9) * 0.5, 2.6 + i * 3, Math.cos(i * 0.7) * 0.4); s.rotation.z = Math.sin(i) * 0.08; s.rotation.y = i * 0.4; }
    for (let i = 0; i < 4; i++) { const c = add(new THREE.TorusGeometry(2.0 - i * 0.12, 0.12, 6, 16), ch, 0, 4 + i * 3.6, 0); c.rotation.x = Math.PI / 2 + Math.sin(i) * 0.2; }
    add(new THREE.OctahedronGeometry(1.2, 0), eye, 0, 21.4); add(new THREE.ConeGeometry(1.6, 2.4, 7), st, 0, 24); return { g, top: 21.4 }; }
  /* vapor */ const ir = M(0x3a3632, 0.6, 0.6), br = M(0xc8963a, 0.35, 0.8), gl = M(0xeaf6ff, 0.1, 0, 0xbfe0ff);
  for (let i = 0; i < 4; i++) { const a = i * 1.571; const l = add(new THREE.CylinderGeometry(0.35, 0.45, 17, 6), ir, Math.cos(a) * 1.9, 9.5, Math.sin(a) * 1.9); l.rotation.z = Math.cos(a) * 0.08; l.rotation.x = -Math.sin(a) * 0.08; }
  add(new THREE.CylinderGeometry(1.2, 1.5, 17, 10), ir, 0, 9.5); for (const y of [4, 8, 12, 16]) add(new THREE.TorusGeometry(1.9 - y * 0.02, 0.15, 6, 18), br, 0, y, 0).rotation.x = Math.PI / 2;
  for (let i = 0; i < 2; i++) { const gr = add(new THREE.CylinderGeometry(1.1, 1.1, 0.25, 14), br, 1.6, 6 + i * 5, 0); gr.rotation.z = Math.PI / 2; gr.name = 'gear'; }
  add(new THREE.CylinderGeometry(2.4, 1.9, 0.5, 14), br, 0, 18.3); add(new THREE.CylinderGeometry(1.3, 1.3, 2.3, 12, 1, true), gl, 0, 19.7); add(new THREE.SphereGeometry(1.5, 14, 8, 0, 6.283, 0, Math.PI / 2), br, 0, 20.9);
  add(new THREE.CylinderGeometry(0.08, 0.08, 3, 5), br, 0, 23); return { g, top: 19.7 };
}
/** o facho: dois cones longos e transparentes, girando em sentidos opostos (como lente de farol), somados à luz da noite */
function beam(col: number): THREE.Group { const g = new THREE.Group(); const mat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  for (const s of [1, -1]) { const c = new THREE.Mesh(new THREE.ConeGeometry(7, 90, 18, 1, true).translate(0, -45, 0).rotateZ(Math.PI / 2 * s), mat); g.add(c); }
  const glow = new THREE.Mesh(new THREE.SphereGeometry(1.8, 12, 8), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false })); g.add(glow); return g; }

export function createFarois(scene: THREE.Scene, city: World) {
  const L: { g: THREE.Group; b: THREE.Group; x: number; z: number; pl: THREE.PointLight; sp: number }[] = [];
  for (const [i, l] of (city.lights ?? []).entries()) { const x = (l.x + 0.5) * T, z = (l.y + 0.5) * T, y = heightAt(x, z);
    const tw = l.old ? { g: new THREE.Group(), top: 21 } : tower(l.style); tw.g.position.set(x, y, z); tw.g.rotation.y = i * 1.3; scene.add(tw.g);
    const b = beam(LIGHT[l.style]); b.position.set(x, y + tw.top, z); scene.add(b);
    const pl = new THREE.PointLight(LIGHT[l.style], 0, 60, 1.6); pl.position.set(x, y + tw.top, z); scene.add(pl);
    L.push({ g: tw.g, b, x, z, pl, sp: 0.55 + (i % 3) * 0.12 }); }
  let t = 0;
  function update(dt: number, camX: number, camZ: number, night: number) { t += dt;
    for (const f of L) { const near = Math.abs(f.x - camX) < 320 && Math.abs(f.z - camZ) < 320; f.g.visible = f.b.visible = near; f.pl.visible = near && night > 0.1; if (!near) continue;
      f.b.rotation.y = t * f.sp; const k = 0.25 + night * 0.75; (f.b.children[0] as THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>).material.opacity = 0.05 + 0.2 * k; f.pl.intensity = night * 45;
      f.g.traverse((o) => { if (o.name === 'gear') o.rotation.x += dt * 0.6; }); f.g.updateMatrixWorld(true); f.b.updateMatrixWorld(true); } }
  return { update };
}
