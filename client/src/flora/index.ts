/* A flora miúda em volta de quem joga: um desenho por espécie (InstancedMesh), refeito quando o herói anda 6 casas. Regras em dados.ts. */
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { TILE_M as T } from '@karmika/shared';
import { FLORA_DE, NENUFAR_EM, CORES, MAXIMO, RAIO, type Especie } from './dados';
import type { Biome } from '../world';

export interface FloraCtx { scene: THREE.Scene; heroi(): { x: number; z: number }; chao(x: number, z: number): number; agua(): number; piso(tx: number, ty: number): string | undefined; bioma(tx: number, ty: number): Biome; noite(): number }

/** número de 0 a 1 que depende só da casa (e de um sal): a mesma casa dá sempre a mesma planta */
const conta = (x: number, y: number, sal: number) => { let h = (x * 374761393 + y * 668265263 + sal * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
/* as normais apontam todas para cima: a planta recebe a luz do chão em volta e nunca fica preta de um lado (o mesmo truque do capim) */
const junta = (L: THREE.BufferGeometry[]) => { const g = mergeGeometries(L.map((q) => q.index ? q.toNonIndexed() : q)) ?? L[0], n = g.getAttribute('normal'); for (let i = 0; i < n.count; i++) n.setXYZ(i, 0, 1, 0); n.needsUpdate = true; return g; };
const peca = (g: THREE.BufferGeometry, sx: number, sy: number, sz: number, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => { const c = g.clone(); c.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy, sz))); return c; };

function formas(): Record<Especie, THREE.BufferGeometry> { const cone = new THREE.ConeGeometry(1, 1, 5), esf = new THREE.SphereGeometry(1, 6, 4), cil = new THREE.CylinderGeometry(1, 1, 1, 5), disco = new THREE.CylinderGeometry(1, 1, 0.02, 9);
  const leque = (n: number, comp: number, larg: number, inc: number) => junta(Array.from({ length: n }, (_, i) => peca(cone, larg, comp, 0.02, Math.sin(i / n * 6.283) * comp * 0.36, comp * 0.42, Math.cos(i / n * 6.283) * comp * 0.36, inc * Math.cos(i / n * 6.283), 0, -inc * Math.sin(i / n * 6.283))));
  return {
    samambaia: leque(6, 0.55, 0.09, 0.85), folha_larga: leque(5, 0.9, 0.26, 0.7),
    cogumelo: junta([peca(cil, 0.035, 0.16, 0.035, 0, 0.08, 0), peca(esf, 0.11, 0.07, 0.11, 0, 0.18, 0), peca(cil, 0.025, 0.1, 0.025, 0.16, 0.05, 0.05), peca(esf, 0.07, 0.045, 0.07, 0.16, 0.11, 0.05)]),
    nenufar: junta([peca(disco, 0.34, 1, 0.34, 0, 0.02, 0), peca(disco, 0.2, 1, 0.2, 0.42, 0.02, 0.2)]),
    arbusto_gelo: junta([peca(cone, 0.2, 0.42, 0.2, 0, 0.21, 0), peca(cone, 0.14, 0.3, 0.14, 0.2, 0.15, 0.08), peca(cone, 0.12, 0.26, 0.12, -0.14, 0.13, -0.14)]),
    galho_seco: junta([peca(cil, 0.018, 0.5, 0.018, 0, 0.24, 0, 0, 0, 0.25), peca(cil, 0.014, 0.36, 0.014, 0.1, 0.3, 0, 0, 0, -0.7), peca(cil, 0.014, 0.3, 0.014, -0.1, 0.24, 0.04, 0.6, 0, 0.6), peca(cil, 0.012, 0.22, 0.012, 0.02, 0.44, -0.05, -0.7, 0, 0.1)]),
    flor_luz: junta([peca(cil, 0.012, 0.3, 0.012, 0, 0.15, 0), peca(esf, 0.07, 0.07, 0.07, 0, 0.32, 0), peca(cil, 0.01, 0.2, 0.01, 0.12, 0.1, 0.06), peca(esf, 0.05, 0.05, 0.05, 0.12, 0.22, 0.06)]),
    flor_miuda: junta([peca(cil, 0.01, 0.16, 0.01, 0, 0.08, 0), peca(esf, 0.05, 0.03, 0.05, 0, 0.17, 0), peca(cil, 0.01, 0.12, 0.01, 0.1, 0.06, -0.06), peca(esf, 0.04, 0.025, 0.04, 0.1, 0.13, -0.06), peca(cil, 0.01, 0.1, 0.01, -0.08, 0.05, 0.08), peca(esf, 0.04, 0.025, 0.04, -0.08, 0.11, 0.08)]),
    concha: junta([peca(esf, 0.08, 0.035, 0.07, 0, 0.03, 0), peca(esf, 0.05, 0.025, 0.045, 0.2, 0.02, 0.1)]),
  }; }

export function createFlora(K: FloraCtx) {
  const F = formas(), especies = Object.keys(F) as Especie[], o = new THREE.Object3D(), cor = new THREE.Color();
  const M = {} as Record<Especie, THREE.InstancedMesh>;
  for (const e of especies) { const mat = e === 'flor_luz' ? new THREE.MeshBasicMaterial({ fog: true }) : new THREE.MeshLambertMaterial({ side: e === 'samambaia' || e === 'folha_larga' ? THREE.DoubleSide : THREE.FrontSide });
    const im = new THREE.InstancedMesh(F[e], mat, MAXIMO); im.setColorAt(0, cor.setHex(0xffffff)); im.count = 0; im.frustumCulled = false; im.castShadow = false; im.receiveShadow = e !== 'flor_luz'; im.userData.deco = true; K.scene.add(im); M[e] = im; }
  let cx = 1e9, cy = 1e9;
  const firme = (x: number, y: number) => K.piso(x, y) === 'grass';
  function refaz(tx: number, ty: number) { cx = tx; cy = ty; const n = {} as Record<Especie, number>; for (const e of especies) n[e] = 0;
    const poe = (e: Especie, x: number, y: number, alt: number) => { const i = n[e]; if (i >= MAXIMO) return; const jx = (x + 0.15 + conta(x, y, 3) * 0.7) * T, jz = (y + 0.15 + conta(x, y, 4) * 0.7) * T, s = 0.75 + conta(x, y, 5) * 0.7;
      o.position.set(jx, alt ?? K.chao(jx, jz), jz); o.rotation.set(0, conta(x, y, 6) * 6.283, 0); o.scale.setScalar(s); o.updateMatrix(); M[e].setMatrixAt(i, o.matrix); const C = CORES[e]; M[e].setColorAt(i, cor.setHex(C[(conta(x, y, 7) * C.length) | 0])); n[e] = i + 1; };
    for (let y = ty - RAIO; y <= ty + RAIO; y++) for (let x = tx - RAIO; x <= tx + RAIO; x++) { if ((x - tx) ** 2 + (y - ty) ** 2 > RAIO * RAIO) continue; const p = K.piso(x, y); if (!p) continue;
      if (p === 'water') { const cada = NENUFAR_EM[K.bioma(x, y)]; if (!cada || conta(x, y, 1) > 1 / cada) continue; /* só na beira: água com chão firme a até 2 casas */ let beira = false; for (let d = 1; d <= 2 && !beira; d++) if (firme(x + d, y) || firme(x - d, y) || firme(x, y + d) || firme(x, y - d)) beira = true; if (beira) poe('nenufar', x, y, K.agua() + 0.01); continue; }
      if (p !== 'grass') continue; const u = conta(x, y, 1); let soma = 0; for (const [e, cada] of FLORA_DE[K.bioma(x, y)] ?? []) { soma += 1 / cada; if (u < soma) { if (K.chao((x + 0.5) * T, (y + 0.5) * T) > K.agua() + 0.1) poe(e, x, y, undefined as unknown as number); break; } } }
    for (const e of especies) { M[e].count = n[e]; M[e].instanceMatrix.needsUpdate = true; if (M[e].instanceColor) M[e].instanceColor!.needsUpdate = true; } }
  return {
    tick() { const h = K.heroi(), tx = Math.floor(h.x / T), ty = Math.floor(h.z / T); if (Math.abs(tx - cx) + Math.abs(ty - cy) >= 6) refaz(tx, ty); M.nenufar.position.y = Math.sin(performance.now() / 900) * 0.012; },
    liga(v: boolean) { for (const e of especies) M[e].visible = v; },
    get quantas() { const q = {} as Record<string, number>; for (const e of especies) q[e] = M[e].count; return q; },
  };
}
