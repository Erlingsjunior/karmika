import * as THREE from 'three';
import type { Particles } from './fx3d';

/** Atmosfera dos eventos globais.
 *  - Dia da Aurora: brisa suave, folhas que passam voando girando no ar e brilhos que caem do céu devagar, piscando.
 *  - Lua de Sangue: cinzas e brasas vermelhas subindo do chão e uma névoa rubra rente à terra.
 *  O tingimento do mundo (luz, céu, névoa, grade de cor) fica em main.ts; aqui só o que se move. */
export function createAtmos(scene: THREE.Scene, particles: Particles, wrap: (o: THREE.Object3D) => THREE.Object3D) {
  const N = 70;
  const shape = new THREE.Shape(); shape.moveTo(0, -0.13); shape.quadraticCurveTo(0.1, -0.02, 0, 0.13); shape.quadraticCurveTo(-0.1, -0.02, 0, -0.13);
  const geo = new THREE.ShapeGeometry(shape, 3);
  const mat = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, transparent: true, opacity: 0.95, fog: true });
  const leaves = new THREE.InstancedMesh(geo, mat, N); wrap(leaves); leaves.frustumCulled = false; leaves.count = 0;
  const COLS = [0xd8a03a, 0xe07a2a, 0xb8c048, 0x9ab838, 0xf0c060, 0xc8582a].map((c) => new THREE.Color(c));
  for (let i = 0; i < N; i++) leaves.setColorAt(i, COLS[i % COLS.length]);
  scene.add(leaves);
  const L = Array.from({ length: N }, (_, i) => ({ on: false, p: new THREE.Vector3(), v: new THREE.Vector3(), r: new THREE.Euler(), w: new THREE.Vector3(1 + (i % 3), 2 + (i % 4), 1.5 + (i % 2)), life: 0, ph: i * 1.37 }));
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), one = new THREE.Vector3(1.7, 1.7, 1.7);
  let acc = 0, sparkAcc = 0, ashAcc = 0;

  function update(dt: number, t: number, hero: THREE.Vector3, aur: number, lua: number, gust: number, ground: (x: number, z: number) => number, inside: boolean) {
    /* folhas: nascem a barlavento, fora da tela, e atravessam o quadro com a brisa */
    acc += dt * aur * 7; let live = 0;
    const wx = 2.6 + gust * 2.2, wz = 0.9;
    while (acc > 1 && !inside) { acc -= 1; const l = L.find((k) => !k.on); if (!l) break;
      l.on = true; l.life = 9 + Math.random() * 5; l.p.set(hero.x - (Math.random() < 0.5 ? 26 + Math.random() * 8 : Math.random() * 30 - 8), hero.y + 3 + Math.random() * 7, hero.z + (Math.random() - 0.5) * 40 - 8);
      l.v.set(wx * (0.7 + Math.random() * 0.6), -0.25 - Math.random() * 0.25, wz * (0.4 + Math.random())); l.r.set(Math.random() * 6, Math.random() * 6, Math.random() * 6); }
    for (let i = 0; i < N; i++) {
      const l = L[i]; if (!l.on) continue;
      l.life -= dt; const gy = ground(l.p.x, l.p.z);
      if (l.life <= 0 || (inside && aur < 0.5) || l.p.distanceTo(hero) > 60) { l.on = false; continue; }
      l.v.x += (wx - l.v.x) * dt * 0.4; l.v.y = Math.max(-0.6, l.v.y - dt * 0.05);
      const fl = Math.sin(t * l.w.y + l.ph); /* o vaivém da folha caindo: desliza de lado e quase para */
      l.p.x += (l.v.x + fl * 0.8) * dt; l.p.y += (l.v.y + Math.cos(t * l.w.x + l.ph) * 0.45) * dt; l.p.z += (l.v.z + Math.sin(t * 0.7 + l.ph) * 0.5) * dt;
      if (l.p.y < gy + 0.08) { l.p.y = gy + 0.08; l.v.y = 0; l.v.x *= 0.96; if (gust > 0.6) l.v.y = 1.2 + gust; }
      l.r.x += dt * l.w.x * 1.6; l.r.y += dt * l.w.z; l.r.z += dt * (1.2 + fl);
      q.setFromEuler(l.r); m4.compose(l.p, q, one); leaves.setMatrixAt(live, m4); leaves.setColorAt(live, COLS[i % COLS.length]); live++;
    }
    leaves.count = live; leaves.instanceMatrix.needsUpdate = true; if (leaves.instanceColor) leaves.instanceColor.needsUpdate = true;

    if (inside) return;
    /* brilhos que caem do céu: dourados e brancos, devagar, piscando, alguns em espiral */
    sparkAcc += dt * aur * 34;
    while (sparkAcc > 1) { sparkAcc -= 1; const x = hero.x + (Math.random() - 0.5) * 46, z = hero.z + (Math.random() - 0.5) * 36, gold = Math.random() < 0.6;
      particles.spawn(x, hero.y + 9 + Math.random() * 8, z, { vx: 0.3 + Math.random() * 0.4, vy: -0.9 - Math.random() * 0.8, vz: (Math.random() - 0.5) * 0.3, life: 6 + Math.random() * 4, s0: 0.24, s1: 0.08, c0: gold ? 0xfff2b0 : 0xffffff, c1: gold ? 0xffc24a : 0xbfe0ff, a: 0.95, flit: 1.4 }); }
    if (aur > 0.3 && Math.random() < dt * aur * 0.6) { /* de vez em quando um brilho maior, como uma estrela cadente pequena */
      const x = hero.x + (Math.random() - 0.5) * 30, z = hero.z + (Math.random() - 0.5) * 24, y = hero.y + 12;
      for (let k = 0; k < 10; k++) particles.spawn(x - k * 0.25, y + k * 0.2, z, { vx: 2.2, vy: -2.4, life: 1.4 + k * 0.05, s0: 0.34 - k * 0.025, s1: 0.03, c0: 0xffffff, c1: 0xffd66a, a: 1 - k * 0.07 }); }
    /* Lua de Sangue: cinzas rubras subindo do chão e brasas soltas no ar */
    ashAcc += dt * lua * 22;
    while (ashAcc > 1) { ashAcc -= 1; const x = hero.x + (Math.random() - 0.5) * 44, z = hero.z + (Math.random() - 0.5) * 34, y = ground(x, z) + 0.2, ember = Math.random() < 0.3;
      particles.spawn(x, y, z, ember ? { vx: (Math.random() - 0.5) * 0.4, vy: 0.6 + Math.random() * 0.8, life: 4 + Math.random() * 3, s0: 0.12, s1: 0.03, c0: 0xffb070, c1: 0xc01808, a: 0.9, flit: 0.8, w: 0.4 }
        : { vx: (Math.random() - 0.5) * 0.3, vy: 0.25 + Math.random() * 0.35, life: 5 + Math.random() * 3, s0: 0.5, s1: 1.1, c0: 0x6a0a06, c1: 0x200202, a: 0.35, w: 0.3 }); }
  }
  return { update };
}
