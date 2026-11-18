/* EFEITOS DE LUTA EM 3D (10/11, Erling: "os efeitos e magias são desenhados, não são partículas nem luzes; falamos que íamos usar
   elementos 3D e não cores pintadas — a luta podia ser muito mais bonita").
   O aviso de uma magia de área deixa de ser só uma mancha pintada no chão:
   - a borda da área vira uma PAREDE de energia de verdade, que sobe do chão enquanto o golpe carrega (quanto mais alta, mais perto de bater);
   - quando bate, a área ERUPCIONA: estacas de cristal saem do chão, ficam um instante e afundam.
   Serve para qualquer forma plana (cone, círculo, anel, faixa): a parede sai do contorno da própria geometria. */
import * as THREE from 'three';

/** parede vertical sobre o contorno de uma geometria plana (y = 0). Altura 1; quem usa estica em scale.y */
export function wallOf(geo: THREE.BufferGeometry, col: number): THREE.Mesh {
  const pos = geo.getAttribute('position'), idx = geo.index, n = idx ? idx.count : pos.count, at = (i: number) => (idx ? idx.getX(i) : i);
  const key = (i: number) => `${Math.round(pos.getX(i) * 200)},${Math.round(pos.getZ(i) * 200)}`, edges = new Map<string, [number, number, number]>();
  for (let t = 0; t < n; t += 3) for (let e = 0; e < 3; e++) { const a = at(t + e), b = at(t + (e + 1) % 3), ka = key(a), kb = key(b); if (ka === kb) continue; const k = ka < kb ? ka + '|' + kb : kb + '|' + ka; const cur = edges.get(k); if (cur) cur[2]++; else edges.set(k, [a, b, 1]); }
  const P: number[] = [], C: number[] = [], c = new THREE.Color(col);
  for (const [a, b, cnt] of edges.values()) { if (cnt !== 1) continue; const ax = pos.getX(a), az = pos.getZ(a), bx = pos.getX(b), bz = pos.getZ(b);
    P.push(ax, 0, az, bx, 0, bz, bx, 1, bz, ax, 0, az, bx, 1, bz, ax, 1, az); C.push(c.r, c.g, c.b, c.r, c.g, c.b, 0, 0, 0, c.r, c.g, c.b, 0, 0, 0, 0, 0, 0); /* some para cima (aditivo: preto = nada) */ }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  m.userData.dyn = true; m.frustumCulled = false; return m;
}

const CONE = new THREE.ConeGeometry(1, 1, 5).translate(0, 0.5, 0); CONE.userData.shared = true;
/** estacas de cristal que saem do chão dentro da área. Devolve o passo de animação: true quando acabou (e já se limpou) */
export function erupt(scene: THREE.Scene, fine: (o: THREE.Object3D) => THREE.Object3D, geo: THREE.BufferGeometry, col: number, x: number, y: number, z: number, rotY: number, max = 22): (dt: number) => boolean {
  const pos = geo.getAttribute('position'), idx = geo.index, n = (idx ? idx.count : pos.count) / 3, at = (i: number) => (idx ? idx.getX(i) : i);
  geo.computeBoundingBox(); const bb = geo.boundingBox!, area = Math.max(1, (bb.max.x - bb.min.x) * (bb.max.z - bb.min.z)), count = Math.max(5, Math.min(max, Math.round(area * 0.45)));
  const c = new THREE.Color(col), mat = new THREE.MeshLambertMaterial({ color: c.clone().lerp(new THREE.Color(0xffffff), 0.25), emissive: c.clone().multiplyScalar(0.55), flatShading: true });
  const grp = new THREE.Group(); grp.position.set(x, y, z); grp.rotation.y = rotY; const sp: { m: THREE.Mesh; h: number; r: number; d: number }[] = [];
  for (let i = 0; i < count && n > 0; i++) { const t = Math.floor(Math.random() * n) * 3, a = at(t), b = at(t + 1), d = at(t + 2); let u = Math.random(), v = Math.random(); if (u + v > 1) { u = 1 - u; v = 1 - v; }
    const px = pos.getX(a) + (pos.getX(b) - pos.getX(a)) * u + (pos.getX(d) - pos.getX(a)) * v, pz = pos.getZ(a) + (pos.getZ(b) - pos.getZ(a)) * u + (pos.getZ(d) - pos.getZ(a)) * v;
    const m = new THREE.Mesh(CONE, mat); m.position.set(px, 0, pz); m.rotation.set((Math.random() - 0.5) * 0.5, Math.random() * 6.28, (Math.random() - 0.5) * 0.5); m.castShadow = true; m.userData.dyn = true; m.userData.shared = true; m.scale.set(0.01, 0.01, 0.01); grp.add(m);
    sp.push({ m, h: 0.8 + Math.random() * 1.3, r: 0.13 + Math.random() * 0.16, d: Math.random() * 0.1 }); }
  scene.add(fine(grp)); let t = 0;
  return (dt) => { t += dt; for (const s of sp) { const u = t - s.d, k = u < 0 ? 0 : u < 0.09 ? (u / 0.09) * 1.15 : u < 0.2 ? 1.15 - (u - 0.09) * 1.36 : u < 0.55 ? 1 : Math.max(0, 1 - (u - 0.55) / 0.35); s.m.scale.set(s.r, Math.max(0.01, s.h * k), s.r); }
    if (t > 1.05) { scene.remove(grp); mat.dispose(); return true; } return false; };
}

/* 11/11 (Erling: "continue no 2", os efeitos das magias do herói em 3D): a onda de impacto deixa de ser um anel chapado pintado no chão.
   SHOCK é um aro com volume (toro); WAVE é a crista que sobe junto com ele, mais forte embaixo e sumindo para cima. */
export const SHOCK = new THREE.TorusGeometry(0.93, 0.055, 8, 44).rotateX(Math.PI / 2); SHOCK.userData.shared = true;
export const WAVE = (() => { const g = new THREE.CylinderGeometry(0.93, 0.93, 0.42, 44, 1, true).translate(0, 0.21, 0), p = g.getAttribute('position'), c = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) { const k = p.getY(i) < 0.1 ? 1 : 0; c[i * 3] = c[i * 3 + 1] = c[i * 3 + 2] = k; } g.setAttribute('color', new THREE.BufferAttribute(c, 3)); g.userData.shared = true; return g; })();
/** a crista da onda, para pendurar no aro (herda a escala dele) */
export function waveMesh(col: number, op = 0.7): THREE.Mesh { const m = new THREE.Mesh(WAVE, new THREE.MeshBasicMaterial({ color: col, vertexColors: true, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false })); m.userData.dyn = true; m.userData.shared = true; return m; }
