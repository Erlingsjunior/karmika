/* Os cascos: madeira velha, costelas à mostra, mastro partido, vela em farrapos. Cada casco vira poucas malhas (uma por material). */
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { Casco } from './dados';

const escura = new THREE.MeshLambertMaterial({ color: 0x3a2a1e }), clara = new THREE.MeshLambertMaterial({ color: 0x6a5238 }), vela = new THREE.MeshLambertMaterial({ color: 0xb8a888, side: THREE.DoubleSide }), ferro = new THREE.MeshLambertMaterial({ color: 0x4a3a30 }), musgo = new THREE.MeshLambertMaterial({ color: 0x3f5a3a, side: THREE.DoubleSide });
const caixa = new THREE.BoxGeometry(1, 1, 1), cil = new THREE.CylinderGeometry(1, 1, 1, 7), M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), V = new THREE.Vector3(), S = new THREE.Vector3();
type Saco = Map<THREE.Material, THREE.BufferGeometry[]>;
const poe = (B: Saco, m: THREE.Material, g: THREE.BufferGeometry, sx: number, sy: number, sz: number, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0) => { const c = (g.index ? g.toNonIndexed() : g.clone()); c.applyMatrix4(M4.compose(V.set(x, y, z), Q.setFromEuler(E.set(rx, ry, rz)), S.set(sx, sy, sz))); let l = B.get(m); if (!l) B.set(m, l = []); l.push(c); };
const rnd = (s: number) => { let a = s >>> 0; return () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; }; };
/** meio aro (a costela do navio): raio r, do bombordo ao estibordo por baixo */
const costela = (r: number, grossura: number) => { const g = new THREE.TorusGeometry(r, grossura, 4, 9, Math.PI); g.rotateZ(Math.PI); return g; };

/** o casco inteiro, no chão, com a proa em +z; quem chama gira, tomba e afunda */
export function fazCasco(c: Casco): THREE.Group { const B: Saco = new Map(), R = rnd(c.semente), G = new THREE.Group();
  if (c.tipo === 'galeao') { const comp = 15, larg = 2.4;
    poe(B, escura, caixa, 0.34, 0.4, comp, 0, 0.2, 0); /* quilha */
    for (let i = 0; i < 11; i++) { const k = i / 10, z = (k - 0.5) * (comp - 1.4), r = larg * (0.45 + 0.55 * Math.sin(Math.PI * (0.12 + k * 0.78))), quebrada = R() < 0.22; poe(B, i % 2 ? escura : clara, costela(r, 0.11), 1, quebrada ? 0.55 : 1, 1, 0, r + 0.25, z); }
    /* tábuas que sobraram: só de um lado, com buracos */
    for (let f = 0; f < 4; f++) for (let i = 0; i < 6; i++) { if (R() < 0.34) continue; const z = (i / 5 - 0.5) * (comp - 3), ang = 0.35 + f * 0.33, r = larg * 0.98; poe(B, f % 2 ? clara : escura, caixa, 0.07, 0.5, 2.3, -Math.cos(ang) * r, r + 0.25 - Math.sin(ang) * r, z, 0, 0, ang - Math.PI / 2 + 0.2); }
    poe(B, clara, caixa, larg * 1.5, 0.12, 4.2, 0, larg + 0.3, -comp * 0.3); /* um resto de convés na popa */
    poe(B, escura, caixa, larg * 1.7, 1.5, 0.2, 0, larg + 0.3, -comp / 2 + 0.3); /* o espelho de popa */
    poe(B, clara, cil, 0.2, 5.4, 0.2, 0.2, larg + 2.4, 0.8, 0.5, 0, 0.32); /* mastro partido, caído para a frente */
    poe(B, escura, cil, 0.11, 4.2, 0.11, 0.9, larg + 3.6, 1.9, 0.5, 0, 1.45); /* a verga */
    for (let i = 0; i < 3; i++) poe(B, vela, caixa, 1.1 + R(), 1.5 + R() * 1.4, 0.03, 0.2 + i * 0.9 - 0.9, larg + 2.6 - R() * 0.6, 1.9 + i * 0.12, 0.5, 0, 0.1 + (R() - 0.5) * 0.3); /* farrapos de vela */
    poe(B, escura, cil, 0.14, 2.6, 0.14, 0, larg + 0.9, comp / 2 + 0.6, 1.05, 0, 0); /* gurupés */
    for (let i = 0; i < 6; i++) poe(B, musgo, caixa, 0.5 + R(), 0.02, 0.8 + R() * 1.6, (R() - 0.5) * 2.4, 0.5 + R() * 1.4, (R() - 0.5) * comp * 0.8, R(), R() * 3, R()); /* algas presas */
  } else if (c.tipo === 'proa') { const larg = 1.9;
    for (let i = 0; i < 6; i++) { const k = i / 5, r = larg * (0.35 + 0.65 * Math.sin(Math.PI * (0.5 - k * 0.42))); poe(B, i % 2 ? escura : clara, costela(r, 0.1), 1, 1, 1, 0, r + 0.2, k * 6 - 1); }
    poe(B, escura, caixa, 0.3, 0.4, 7.6, 0, 0.2, 2.3);
    for (let f = 0; f < 5; f++) for (const lado of [-1, 1]) { if (R() < 0.3) continue; const ang = 0.3 + f * 0.26, r = larg * 0.95; poe(B, f % 2 ? clara : escura, caixa, 0.07, 0.45, 5 - f * 0.5, lado * Math.cos(ang) * r, r + 0.2 - Math.sin(ang) * r, 2.2, 0, lado * 0.12, lado * (Math.PI / 2 - ang - 0.2)); }
    poe(B, clara, cil, 0.13, 3, 0.13, 0, larg + 1.2, 6.2, 0.95, 0, 0); poe(B, ferro, new THREE.TorusGeometry(0.34, 0.07, 5, 10), 1, 1, 1, 0.9, 0.5, 4.6, 1.2, 0.3, 0); /* gurupés e uma argola de âncora */
  } else { poe(B, escura, (() => { const g = new THREE.SphereGeometry(1, 9, 6, 0, Math.PI * 2, 0, Math.PI / 2); return g; })(), 0.85, 0.7, 2.3, 0, 0, 0); /* bote emborcado */
    poe(B, clara, caixa, 0.12, 0.1, 4.4, 0, 0.72, 0); for (let i = 0; i < 2; i++) poe(B, clara, cil, 0.04, 3.2, 0.04, 1.3 + i * 0.3, 0.08, (R() - 0.5) * 2, Math.PI / 2, R() * 0.8, 0); }
  /* destroços em volta: barris, caixotes e tábuas soltas */
  const n = c.tipo === 'bote' ? 2 : 5; for (let i = 0; i < n; i++) { const a = R() * 6.283, d = 2.4 + R() * 3.4, x = Math.cos(a) * d, z = Math.sin(a) * d, q = R();
    if (q < 0.4) poe(B, clara, cil, 0.34, 0.8, 0.34, x, 0.3, z, Math.PI / 2 * (R() < 0.5 ? 1 : 0), R() * 3, R() * 0.4); else if (q < 0.7) poe(B, escura, caixa, 0.7, 0.6, 0.7, x, 0.22, z, R() * 0.3, R() * 3, R() * 0.3); else poe(B, clara, caixa, 0.26, 0.07, 2 + R() * 1.6, x, 0.05, z, 0, R() * 3, 0); }
  for (const [m, l] of B) { const g = mergeGeometries(l); if (!g) continue; g.computeVertexNormals(); const me = new THREE.Mesh(g, m); me.castShadow = m !== vela && m !== musgo; me.receiveShadow = true; G.add(me); }
  return G; }
