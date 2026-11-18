/* Os modelos da fauna: poucas faces, peças simples, tudo feito aqui (sem arquivo de arte). As geometrias são compartilhadas. */
import * as THREE from 'three';

const esfera = new THREE.SphereGeometry(1, 8, 6), caixa = new THREE.BoxGeometry(1, 1, 1), cone = new THREE.ConeGeometry(1, 1, 6);
const asaGeo = (() => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.16, 0.62, 0, 0.05, 0, 0, -0.2, 0, 0, 0.16, 0, 0, -0.2, 0.62, 0, 0.05], 3)); g.computeVertexNormals(); return g; })();
const mats = new Map<number, THREE.MeshLambertMaterial>();
const mat = (c: number) => { let m = mats.get(c); if (!m) { m = new THREE.MeshLambertMaterial({ color: c, side: THREE.DoubleSide }); mats.set(c, m); } return m; };
const peca = (g: THREE.BufferGeometry, c: number, sx: number, sy: number, sz: number, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(g, mat(c)); m.scale.set(sx, sy, sz); m.position.set(x, y, z); return m; };

export interface Bicho { g: THREE.Group; /** peças que se mexem */ p: Record<string, THREE.Object3D> }

/** ave: corpo, cabeça, bico, cauda e duas asas que batem (a frente é +z) */
export function ave(corpo: number, asa: number, tam: number): Bicho { const g = new THREE.Group();
  g.add(peca(esfera, corpo, 0.1, 0.09, 0.2), peca(esfera, corpo, 0.07, 0.07, 0.07, 0, 0.05, 0.17), peca(cone, 0xe0a030, 0.02, 0.07, 0.02, 0, 0.05, 0.25), peca(caixa, asa, 0.1, 0.01, 0.16, 0, 0.01, -0.24));
  (g.children[2] as THREE.Mesh).rotation.x = Math.PI / 2;
  const e = new THREE.Mesh(asaGeo, mat(asa)), d = new THREE.Mesh(asaGeo, mat(asa)); d.scale.x = -1; e.position.set(0.05, 0.03, 0); d.position.set(-0.05, 0.03, 0); g.add(e, d); g.scale.setScalar(tam); return { g, p: { e, d } }; }

/** coelho: corpo, cabeça, duas orelhas e o rabo branco */
export function coelho(cor: number): Bicho { const g = new THREE.Group(), corpo = new THREE.Group();
  corpo.add(peca(esfera, cor, 0.16, 0.14, 0.22, 0, 0.16, 0), peca(esfera, cor, 0.1, 0.1, 0.11, 0, 0.3, 0.19), peca(esfera, 0xffffff, 0.06, 0.06, 0.06, 0, 0.18, -0.22));
  const o1 = peca(caixa, cor, 0.035, 0.2, 0.05, 0.045, 0.46, 0.16), o2 = peca(caixa, cor, 0.035, 0.2, 0.05, -0.045, 0.46, 0.16); corpo.add(o1, o2); g.add(corpo); return { g, p: { corpo, o1, o2 } }; }

/** cachorro de vila: corpo, cabeça com focinho e orelhas, quatro patas e o rabo que abana */
export function cao(cor: number): Bicho { const g = new THREE.Group(), escuro = new THREE.Color(cor).multiplyScalar(0.7).getHex();
  g.add(peca(caixa, cor, 0.26, 0.24, 0.6, 0, 0.42, 0));
  const cab = new THREE.Group(); cab.position.set(0, 0.58, 0.34); cab.add(peca(caixa, cor, 0.22, 0.2, 0.22), peca(caixa, escuro, 0.12, 0.1, 0.16, 0, -0.04, 0.17), peca(caixa, escuro, 0.06, 0.12, 0.04, 0.09, 0.12, -0.04), peca(caixa, escuro, 0.06, 0.12, 0.04, -0.09, 0.12, -0.04), peca(esfera, 0x101010, 0.03, 0.03, 0.03, 0, -0.02, 0.26)); g.add(cab);
  const p: Record<string, THREE.Object3D> = { cab }; [[0.09, 0.2], [-0.09, 0.2], [0.09, -0.22], [-0.09, -0.22]].forEach(([x, z], i) => { const perna = new THREE.Group(); perna.position.set(x, 0.32, z); perna.add(peca(caixa, escuro, 0.07, 0.32, 0.07, 0, -0.16, 0)); g.add(perna); p['p' + i] = perna; });
  const rabo = new THREE.Group(); rabo.position.set(0, 0.5, -0.3); rabo.add(peca(caixa, cor, 0.05, 0.05, 0.26, 0, 0.06, -0.12)); rabo.rotation.x = -0.6; g.add(rabo); p.rabo = rabo; return { g, p }; }

/** coruja: corpo redondo, dois tufos e os olhos que acendem no escuro */
export function coruja(): Bicho { const g = new THREE.Group(), cab = new THREE.Group(), olho = new THREE.MeshBasicMaterial({ color: 0xffd24a, fog: false });
  g.add(peca(esfera, 0x6a5238, 0.17, 0.24, 0.16, 0, 0.24, 0), peca(esfera, 0xcab890, 0.12, 0.16, 0.08, 0, 0.2, 0.1));
  cab.position.set(0, 0.5, 0); cab.add(peca(esfera, 0x7a6042, 0.15, 0.13, 0.14), peca(cone, 0x5a4430, 0.04, 0.1, 0.04, 0.09, 0.13, 0), peca(cone, 0x5a4430, 0.04, 0.1, 0.04, -0.09, 0.13, 0), peca(cone, 0xe0a030, 0.025, 0.06, 0.025, 0, -0.02, 0.14));
  (cab.children[3] as THREE.Mesh).rotation.x = Math.PI / 2;
  for (const x of [0.06, -0.06]) { const o = new THREE.Mesh(esfera, olho); o.scale.setScalar(0.04); o.position.set(x, 0.02, 0.12); cab.add(o); const pu = peca(esfera, 0x101010, 0.018, 0.018, 0.018, x, 0.02, 0.155); cab.add(pu); }
  g.add(cab); return { g, p: { cab } }; }

/** peixe: corpo achatado e a cauda */
export function peixe(cor: number): Bicho { const g = new THREE.Group(); g.add(peca(esfera, cor, 0.07, 0.13, 0.26), peca(cone, cor, 0.02, 0.2, 0.14, 0, 0, -0.32)); (g.children[1] as THREE.Mesh).rotation.x = -Math.PI / 2; return { g, p: {} }; }
