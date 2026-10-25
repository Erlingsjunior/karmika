import * as THREE from 'three';
import { createCharacter, type Hero3D } from './characters';

/* =====================================================================================================
   A CASA DOS OFÍCIOS DE ASKAVIK (25/10/2026)
   Erling: "uma construção na cidade, a casa dos ofícios: lá dentro um espaço legal para forja, várias máquinas de cortar
   madeira, uma área alquímica de laboratório, tudo que todas as profissões precisam, e NPC tomando conta, varrendo,
   sendo ajudantes para tornar o lugar mais real."
   O salão é aberto dos lados (colunas e telhado de duas águas, vigas aparentes), piso de pedra, e tem:
   - as cinco bancadas de verdade (world.ts põe; funcionam para criar): corte, forja, curtidor, laboratório e cozinha;
   - a serraria: duas serras circulares girando movidas por correia, toras na fila, pilha de tábuas, serragem no ar;
   - o fole e a bigorna da forja grande, com brasa que respira; o alambique do laboratório borbulhando, prateleiras de frascos;
   - um tear e o varal de couros; a lareira da cozinha com caldeirão;
   - gente trabalhando: o zelador varre, o aprendiz leva tábuas de uma bancada a outra, a ferreira martela, a alquimista mexe o
     caldeirão, o serrador empurra toras. Cada um tem a sua rotina e fala de vez em quando.
   ===================================================================================================== */

export interface Hall { x: number; y: number; w: number; h: number }
interface Helper { h: Hero3D; name: string; role: 'varre' | 'leva' | 'martela' | 'mexe' | 'serra'; path: { x: number; z: number }[]; i: number; wait: number; prop?: THREE.Object3D; lineT: number }

const toon = (c: number, e = 0) => new THREE.MeshToonMaterial({ color: c, emissive: e });

export function createCraftHall(ctx: { scene: THREE.Scene; T: number; heightAt(x: number, z: number): number; fine(o: THREE.Object3D): THREE.Object3D;
  particles: { spawn(x: number, y: number, z: number, o: Record<string, number>): void }; bubble(x: number, y: number, z: number, t: string): void; audio?: { work?(k: 'hammer' | 'saw' | 'brew' | 'cook' | 'sew' | 'carve'): void } }, hall: Hall) {
  const T = ctx.T, X0 = hall.x * T, Z0 = hall.y * T, W = hall.w * T, D = hall.h * T, cx = X0 + W / 2, cz = Z0 + D / 2, y0 = ctx.heightAt(cx, cz);
  const g = new THREE.Group(); g.position.set(0, 0, 0); ctx.scene.add(g);
  const add = <O extends THREE.Object3D>(o: O, x: number, y: number, z: number) => { o.position.set(x, y, z); o.traverse((k) => { const m = k as THREE.Mesh; if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); g.add(o); return o; };
  const B = (w: number, h: number, d: number, m: THREE.Material) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  const wood = toon(0x6a4628), woodD = toon(0x3e2814), stone = toon(0x8a8478), roofM = toon(0x7a3a24), iron = toon(0x2c2e34), brass = toon(0xb08a3a, 0x1a1004);

  /* ---------- o salão: piso, colunas, vigas, telhado de duas águas, meia-parede de pedra nos fundos ---------- */
  add(B(W + 0.6, 0.18, D + 0.6, stone), cx, y0 + 0.09, cz);
  const H = 5.2;
  for (let i = 0; i <= 4; i++) for (const zz of [Z0 + 0.3, Z0 + D - 0.3]) { const x = X0 + 0.3 + (W - 0.6) * (i / 4);
    add(B(0.45, H, 0.45, woodD), x, y0 + H / 2, zz); add(B(0.7, 0.35, 0.7, stone), x, y0 + 0.35, zz); }
  const beamM = toon(0x3e2814); beamM.transparent = true;
  for (const zz of [Z0 + 0.3, Z0 + D - 0.3]) add(B(W, 0.35, 0.35, beamM), cx, y0 + H, zz);
  for (let i = 0; i <= 4; i++) add(B(0.3, 0.3, D, beamM), X0 + 0.3 + (W - 0.6) * (i / 4), y0 + H + 0.15, cz);
  roofM.transparent = true; const roofs: THREE.Mesh[] = [];
  for (const s of [-1, 1]) { const r = add(B(W + 1.4, 0.18, D / 2 + 1.2, roofM), cx, y0 + H + 1.25, cz + s * (D / 4 + 0.3)); r.rotation.x = s * 0.5; roofs.push(r); }
  add(B(W + 1.4, 0.3, 0.3, beamM), cx, y0 + H + 2.4, cz); /* cumeeira */
  add(B(W, 1.4, 0.3, stone), cx, y0 + 0.7, Z0 + 0.1); /* meia-parede dos fundos (lado de onde a câmera não olha) */
  /* a placa grande sobre a entrada da frente, entalhada com martelo, serra e frasco */
  { const c = document.createElement('canvas'); c.width = 512; c.height = 128; const q = c.getContext('2d')!; q.fillStyle = '#5a3a1e'; q.fillRect(0, 0, 512, 128); q.strokeStyle = '#d9a24f'; q.lineWidth = 8; q.strokeRect(6, 6, 500, 116);
    q.fillStyle = '#f0c878'; q.strokeStyle = '#1a0e04'; q.lineWidth = 10; q.font = 'bold 54px Georgia'; q.textAlign = 'center'; q.textBaseline = 'middle'; q.strokeText('⚒  🪚  ⚗  🧵  🍲', 256, 66); q.fillText('⚒  🪚  ⚗  🧵  🍲', 256, 66);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    add(new THREE.Mesh(new THREE.BoxGeometry(5, 1.25, 0.15), [woodD, woodD, woodD, woodD, new THREE.MeshToonMaterial({ map: t, emissive: 0x2a1a0a, emissiveMap: t }), woodD]), cx, y0 + H - 0.5, Z0 + D - 0.1).rotation.x = -0.15; }

  /* ---------- a serraria: duas serras circulares, correia, toras e tábuas ---------- */
  const saws: THREE.Mesh[] = [];
  for (let k = 0; k < 2; k++) { const sx = X0 + W - 3.2 - k * 3.4, sz = cz + 0.6;
    add(B(2.6, 0.9, 1.1, wood), sx, y0 + 0.45 + 0.18, sz); /* mesa */
    const blade = add(new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.04, 20), new THREE.MeshToonMaterial({ color: 0xd8dce4, emissive: 0x101418 })), sx, y0 + 1.15, sz); blade.rotation.x = Math.PI / 2; saws.push(blade);
    for (let t = 0; t < 12; t++) { const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.12, 3), blade.material as THREE.Material); const a = (t / 12) * 6.283; tooth.position.set(Math.cos(a) * 0.58, 0, Math.sin(a) * 0.58); tooth.rotation.set(0, -a, Math.PI / 2); blade.add(tooth); }
    add(B(0.12, 1.6, 0.12, iron), sx + 0.9, y0 + 1.6, sz - 0.4); add(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.7, 5), toon(0x3a2a1a)), sx + 0.45, y0 + 1.75, sz - 0.2).rotation.z = 0.6; /* correia */
    const log = add(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 1.8, 9), toon(0x8a5a2a)), sx - 0.6, y0 + 1.25, sz); log.rotation.z = Math.PI / 2; }
  for (let i = 0; i < 4; i++) { const lg = add(new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 2.4, 9), toon(0x7a4a22)), X0 + W - 2.0, y0 + 0.45 + i * 0.0 + (i > 1 ? 0.45 : 0), Z0 + D - 2.2 + (i % 2) * 0.5); lg.rotation.x = Math.PI / 2; }
  for (let i = 0; i < 6; i++) add(B(2.4, 0.08, 0.32, toon(0xc8a06a)), X0 + W - 4.6, y0 + 0.25 + i * 0.09, Z0 + D - 1.6); /* tábuas prontas */

  /* ---------- a forja grande: fornalha de pedra, fole, bigorna, ferramentas na parede ---------- */
  const fx0 = X0 + 2.2, fz0 = Z0 + 1.4;
  add(B(2.0, 1.4, 1.4, stone), fx0, y0 + 0.88, fz0); const coal = add(new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.12, 0.9), new THREE.MeshBasicMaterial({ color: 0xff5a10 })), fx0, y0 + 1.64, fz0);
  add(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.45, 2.6, 8), stone), fx0, y0 + 2.9, fz0 - 0.3); /* chaminé */
  const forgeL = new THREE.PointLight(0xff7a30, 8, 10, 1.6); add(forgeL, fx0, y0 + 2.0, fz0 + 0.5);
  const bellows = add(B(0.8, 0.35, 0.6, toon(0x5a3a22)), fx0 + 1.4, y0 + 1.0, fz0);
  const anvil = new THREE.Group(); anvil.add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.4), iron)); { const top = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.22, 0.38), iron); top.position.y = 0.36; anvil.add(top); const horn = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.45, 6), iron); horn.rotation.z = Math.PI / 2; horn.position.set(0.62, 0.36, 0); anvil.add(horn); }
  add(anvil, fx0 + 0.4, y0 + 0.43, fz0 + 2.0);
  for (let i = 0; i < 5; i++) add(B(0.05, 0.7, 0.05, iron), X0 + 0.7 + i * 0.35, y0 + 2.0, Z0 + 0.32); /* ferramentas na meia-parede */

  /* ---------- o laboratório: alambique de cobre, bancada com frascos coloridos, prateleiras ---------- */
  const lx = cx - 1.0, lz = Z0 + 1.2;
  const still = add(new THREE.Mesh(new THREE.SphereGeometry(0.55, 12, 9), brass), lx, y0 + 1.0, lz); void still;
  add(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.3, 6), brass), lx + 0.6, y0 + 1.6, lz).rotation.z = -0.9;
  add(new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 0.5, 10), toon(0x3a2a1a)), lx, y0 + 0.43, lz); const alchL = new THREE.PointLight(0x7aff9a, 3.5, 6, 1.6); add(alchL, lx, y0 + 1.6, lz + 0.6);
  for (let s = 0; s < 3; s++) { add(B(2.2, 0.06, 0.35, wood), lx + 2.2, y0 + 1.0 + s * 0.55, Z0 + 0.45); for (let k = 0; k < 6; k++) { const col = [0x7aff9a, 0xff6a7a, 0x7ab0ff, 0xffd060, 0xc080ff, 0x60e0e0][(k + s) % 6]; add(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.22, 7), new THREE.MeshToonMaterial({ color: col, emissive: col, emissiveIntensity: 0.35, transparent: true, opacity: 0.9 })), lx + 1.3 + k * 0.33, y0 + 1.15 + s * 0.55, Z0 + 0.45); } }

  /* ---------- tear e varal de couros (costureiro), caldeirão na lareira (cozinha) ---------- */
  { const tx = cx + 1.6, tz = Z0 + D - 2.0; for (const sx of [-0.7, 0.7]) add(B(0.1, 1.6, 0.1, wood), tx + sx, y0 + 0.9, tz); add(B(1.6, 0.1, 0.1, wood), tx, y0 + 1.7, tz); add(B(1.3, 1.1, 0.02, toon(0xa83a3a)), tx, y0 + 1.1, tz);
    for (let i = 0; i < 3; i++) add(B(0.7, 0.9, 0.03, toon([0x8a5a3a, 0x6a4a2a, 0x9a6a40][i])), X0 + 1.2 + i * 0.9, y0 + 1.9, Z0 + D - 0.7); add(new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 3.4, 5).rotateZ(Math.PI / 2), woodD), X0 + 2.1, y0 + 2.4, Z0 + D - 0.7); }
  const pot = add(new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8, 0, 6.283, 0, 2.0), iron), X0 + 1.4, y0 + 0.8, cz + 1.0); pot.rotation.x = Math.PI;
  const potFire = add(new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.55, 7), new THREE.MeshBasicMaterial({ color: 0xff9a30, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false })), X0 + 1.4, y0 + 0.45, cz + 1.0);

  /* ---------- quem trabalha aqui ---------- */
  const helpers: Helper[] = [];
  const P = (dx: number, dz: number) => ({ x: X0 + dx, z: Z0 + dz });
  const mk = (name: string, role: Helper['role'], tint: number, path: { x: number; z: number }[], kind: 'nordic' | 'dwarf' = 'nordic') => {
    const h = createCharacter(kind, { static: true, civil: 'human', cloth: tint }); h.root.position.set(path[0].x, ctx.heightAt(path[0].x, path[0].z) + 0.18, path[0].z); ctx.scene.add(h.root);
    const hp: Helper = { h, name, role, path, i: 0, wait: Math.random() * 2, lineT: 6 + Math.random() * 10 };
    if (role === 'varre') { const broom = new THREE.Group(); const st = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.5, 5), toon(0x8a6a3a)); st.position.y = -0.4; broom.add(st); const br = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.4, 8), toon(0xc8a85a)); br.position.y = -1.25; broom.add(br); broom.rotation.x = 0.5; hp.prop = broom; ctx.scene.add(broom); }
    if (role === 'leva') { const planks = new THREE.Group(); for (let i = 0; i < 3; i++) { const pk = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.07, 0.25), toon(0xc8a06a)); pk.position.y = i * 0.08; planks.add(pk); } hp.prop = planks; ctx.scene.add(planks); }
    helpers.push(hp); };
  mk('Velho Haldor, o Zelador', 'varre', 0x5a5a4a, [P(3, D / 2), P(W - 3, D / 2), P(W - 3, D / 2 + 1.5), P(3, D / 2 + 1.5)]);
  mk('Aprendiz Pia', 'leva', 0x8a6a4a, [P(W - 4.6, D - 1.9), P(5, 2.6), P(W / 2, D - 2.5)]);
  mk('Ferreira Ragnhild', 'martela', 0x4a3a32, [P(2.6, 3.4)], 'dwarf');
  mk('Alquimista Sefa', 'mexe', 0x4a6a5a, [P(W / 2 - 1.0, 2.0)]);
  mk('Serrador Bjorn', 'serra', 0x6a5a3a, [P(W - 3.9, D / 2 + 1.6)]);
  const LINES: Record<Helper['role'], string[]> = {
    varre: ['Serragem, cinza, pó de fada… quem varre aqui varre o reino inteiro.', 'Pisa no limpo, viajante. Acabei de passar a vassoura.', 'Trinta anos varrendo este chão. Ele ainda me surpreende.'],
    leva: ['Tábua nova para a bancada de corte!', 'Licença, licença! Madeira passando!', 'O mestre disse que um dia eu forjo. Hoje eu carrego.'],
    martela: ['Ferro quente não espera.', 'Bate no ritmo, menina. O ferro ouve.', 'Quer aprender? Comece pelos pregos.'],
    mexe: ['Três voltas para a direita, uma para a esquerda. Nunca o contrário.', 'Não cheire o frasco verde.', 'Folha-de-Prata, Cogumelo-Lamparina… quase lá.'],
    serra: ['Cuidado com os dedos. Eu já perdi um.', 'Essa tora é de carvalho velho. Vai virar escudo.', 'A serra canta. Quem trabalha aqui aprende a música.'],
  };
  let t = 0, sawT = 0;
  function update(dt: number, hero: THREE.Vector3) {
    const near = Math.hypot(hero.x - cx, hero.z - cz) < 70; for (const hp of helpers) { hp.h.root.visible = near; if (hp.prop) hp.prop.visible = near; } if (!near) return;
    t += dt;
    /* entrou no salão: o telhado some (como nas casas), para ver o trabalho lá dentro */
    { const inH = hero.x > X0 - 1 && hero.x < X0 + W + 1 && hero.z > Z0 - 1 && hero.z < Z0 + D + 1, want = inH ? 0.08 : 1; roofM.opacity += (want - roofM.opacity) * Math.min(1, dt * 5); roofM.depthWrite = roofM.opacity > 0.9; beamM.opacity = Math.max(0.18, roofM.opacity); beamM.depthWrite = beamM.opacity > 0.9; for (const r of roofs) r.castShadow = roofM.opacity > 0.5; }
    for (const s of saws) s.rotation.y += dt * 18;
    const k = 0.5 + 0.5 * Math.sin(t * 2.1); (coal.material as THREE.MeshBasicMaterial).color.setHSL(0.05, 1, 0.42 + k * 0.12); forgeL.intensity = 6 + k * 4; bellows.scale.y = 0.75 + 0.35 * Math.abs(Math.sin(t * 1.4));
    alchL.intensity = 3 + Math.sin(t * 5) * 0.6; potFire.scale.y = 0.9 + Math.sin(t * 11) * 0.12;
    if (Math.random() < dt * 6) ctx.particles.spawn(lx + (Math.random() - 0.5) * 0.3, y0 + 1.5, lz + (Math.random() - 0.5) * 0.3, { vy: 0.6, life: 1.4, s0: 0.08, s1: 0.3, c0: 0xc8ffd8, c1: 0x3a8a5a, a: 0.5, flit: 0.8 }); /* bolhas do alambique */
    if (Math.random() < dt * 5) ctx.particles.spawn(fx0, y0 + 4.3, fz0 - 0.3, { vy: 1.2, life: 2.5, s0: 0.3, s1: 1.1, c0: 0x8a8a8a, c1: 0x3a3a3a, a: 0.35, w: 0.6 }); /* fumaça da chaminé */
    sawT -= dt; if (sawT <= 0) { sawT = 0.08; for (const s of saws) ctx.particles.spawn(s.position.x - 0.3, s.position.y - 0.1, s.position.z + 0.3, { vx: -1 - Math.random(), vy: 0.6 + Math.random(), vz: (Math.random() - 0.5), life: 0.7, s0: 0.06, s1: 0.02, c0: 0xf0d8a0, c1: 0xb08a50, a: 0.9, g: 4 }); }
    for (const hp of helpers) {
      const r = hp.h.root, tg = hp.path[hp.i], dx = tg.x - r.position.x, dz = tg.z - r.position.z, l = Math.hypot(dx, dz); let mv = 0;
      if (hp.path.length > 1 && l > 0.2 && hp.wait <= 0) { const sp = hp.role === 'varre' ? 0.6 : 1.25, st = Math.min(l, sp * dt); r.position.x += dx / l * st; r.position.z += dz / l * st; r.rotation.y = Math.atan2(dx, dz); mv = sp; }
      else if (hp.path.length > 1 && l <= 0.2) { hp.wait = hp.role === 'leva' ? 2.2 : 0.6; hp.i = (hp.i + 1) % hp.path.length; }
      else { hp.wait -= dt; if (hp.path.length === 1) { const face = hp.role === 'martela' ? Math.atan2(fx0 + 0.4 - r.position.x, fz0 + 2.0 - r.position.z) : hp.role === 'mexe' ? Math.atan2(lx - r.position.x, lz - r.position.z) : -Math.PI / 2; r.rotation.y = face;
          if (hp.wait <= 0) { hp.wait = hp.role === 'martela' ? 0.75 : 1.4; hp.h.act(hp.role === 'martela' ? 'mine' : hp.role === 'serra' ? 'chop' : 'herb', true); if (hp.role === 'martela') { if (Math.hypot(hero.x - r.position.x, hero.z - r.position.z) < 16) ctx.audio?.work?.('hammer'); for (let i = 0; i < 8; i++) ctx.particles.spawn(fx0 + 0.4, y0 + 0.95, fz0 + 2.0, { vx: (Math.random() - 0.5) * 3, vy: 1 + Math.random() * 2, vz: (Math.random() - 0.5) * 3, life: 0.35, s0: 0.07, s1: 0.02, c0: 0xfff0a0, c1: 0xff6a10, a: 1, g: 8 }); } } } }
      r.position.y = ctx.heightAt(r.position.x, r.position.z) + 0.18;
      hp.h.update(dt, t, mv, null);
      if (hp.role === 'varre' && hp.prop) { const hand = hp.h.handPos(new THREE.Vector3()); hp.prop.position.copy(hand); hp.prop.rotation.set(0.6 + Math.sin(t * 5) * 0.35, r.rotation.y, 0); if (Math.random() < dt * 4) ctx.particles.spawn(hand.x + Math.sin(r.rotation.y) * 0.6, y0 + 0.25, hand.z + Math.cos(r.rotation.y) * 0.6, { vx: (Math.random() - 0.5) * 0.6, vy: 0.3, vz: (Math.random() - 0.5) * 0.6, life: 0.8, s0: 0.1, s1: 0.3, c0: 0xc8b898, c1: 0x8a7a60, a: 0.35 }); }
      if (hp.role === 'leva' && hp.prop) { hp.prop.position.set(r.position.x + Math.sin(r.rotation.y) * 0.25, r.position.y + 1.25, r.position.z + Math.cos(r.rotation.y) * 0.25); hp.prop.rotation.y = r.rotation.y + Math.PI / 2; hp.prop.visible = hp.i !== 1 || hp.wait > 0; }
      hp.lineT -= dt; if (hp.lineT <= 0) { hp.lineT = 14 + Math.random() * 14; if (Math.hypot(hero.x - r.position.x, hero.z - r.position.z) < 14) { const L = LINES[hp.role]; ctx.bubble(r.position.x, r.position.y + 2.5, r.position.z, `${hp.name.split(' ')[0] === 'Velho' ? 'Haldor' : hp.name.split(' ').pop()}: ${L[Math.floor(Math.random() * L.length)]}`); } }
    }
  }
  return { update, center: { x: cx, z: cz } };
}
