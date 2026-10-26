/** Companheiros: pet que coleta itens e montaria. Modelos quadrúpedes reaproveitados dos inimigos. */
import * as THREE from 'three';
import { buildQuad, animQuadWalk } from './enemies';
import { buildWolf, buildHorse, buildBoar, buildCat } from './werewolf3d';
import { mergeStatic } from './merge3d';
import { fine } from './dual3d';
import { ramp } from './toon3d';

export type PetSkill = 'alarido' | 'mordida' | 'faro' | 'fucar';
export interface PetKind { id: string; name: string; quad: 'fox' | 'wolf' | 'rat' | 'horse' | 'boar' | 'cat'; tint?: number; scale: number; speed: number; silent?: boolean;
  /** o que ele faz sozinho (além de buscar o que cai), o que come e onde se arruma um */ skill?: PetSkill; eats?: 'carne' | 'graos' | 'tudo'; where?: string; blurb?: string }
export const PETS: Record<string, PetKind> = {
  pet_fox: { id: 'pet_fox', name: 'Raposa Ruiva', quad: 'fox', scale: 0.9, speed: 6.5, skill: 'alarido', eats: 'carne', where: 'Corwin, o Domador', blurb: 'Esperta e barulhenta. No combate, grita e distrai quem vem para cima de você.' },
  pet_pup: { id: 'pet_pup', name: 'Filhote de Lobo', quad: 'wolf', tint: 0x8a8a8a, scale: 0.55, speed: 6.0, skill: 'mordida', eats: 'carne', where: 'Corwin, o Domador', blurb: 'Fiel. Quando você briga, ele morde as canelas de quem te ataca.' },
  pet_cat: { id: 'pet_cat', name: 'Gatinho Malhado', quad: 'cat', scale: 1.0, speed: 6.2, skill: 'alarido', eats: 'carne', where: 'Corwin, o Domador', blurb: 'Macio, curioso e dono da casa. No combate, chia e arranha a cara de quem vem: o inimigo para por 1,5 s.' },
  pet_cat_b: { id: 'pet_cat_b', name: 'Gata Preta', quad: 'cat', tint: 0x26222a, scale: 1.0, speed: 6.4, skill: 'faro', eats: 'carne', where: 'Corwin, o Domador', blurb: 'Olhos verdes no escuro. Acha o que caiu longe (22 m) e, na briga, um chiado distrai por 1 s.' },
  pet_rat: { id: 'pet_rat', name: 'Ratinho de Porão', quad: 'rat', scale: 0.55, speed: 5.5, skill: 'faro', eats: 'graos', where: 'Corwin, o Domador', blurb: 'Faro fino: acha o que caiu bem mais longe que os outros.' },
  pet_piglet: { id: 'pet_piglet', name: 'Leitão Malhado', quad: 'boar', tint: 0xd8a890, scale: 0.42, speed: 5.0, skill: 'fucar', eats: 'tudo', where: 'Corwin, o Domador', blurb: 'Fuça a terra quando você descansa e de vez em quando traz uma coisinha.' },
};
export interface MountKind { id: string; name: string; tint?: number; scale: number; speed: number; where?: string; blurb?: string }
export const MOUNTS: Record<string, MountKind> = {
  mount_horse: { id: 'mount_horse', name: 'Cavalo Baio', scale: 1.0, speed: 1.75, where: 'Orm, o Estalajadeiro', blurb: 'Manso e firme na estrada.' },
  mount_grey: { id: 'mount_grey', name: 'Cavalo Ruço', tint: 0x9a968e, scale: 1.0, speed: 1.8, where: 'Orm, o Estalajadeiro', blurb: 'Pelagem cinza das montanhas; não estranha frio.' },
  mount_black: { id: 'mount_black', name: 'Corcel Negro', tint: 0x1a1612, scale: 1.05, speed: 1.9, where: 'Orm, o Estalajadeiro', blurb: 'Rápido e nervoso. Quem monta precisa merecer.' },
};
/** o bicho em si (sem nome flutuando): o mesmo modelo no mundo e na página do Estábulo */
export function petModel(kind: PetKind) {
  // 25/10: a raposa e o filhote são o canídeo esguio (werewolf3d); o rato segue o quadrúpede de antes (Erling gostou), o leitão é o javali pequeno
  const W = kind.quad === 'cat' ? buildCat(kind.tint ? { coat: kind.tint, belly: 0x3a3440, eye: 0x7aff6a, stripes: false } : {}) : kind.quad === 'wolf' ? buildWolf({ fur: kind.tint ?? 0x8a847c }) : kind.quad === 'fox' ? buildWolf({ fur: 0xc8641e, belly: 0xf4ece0, eye: 0xffb030 }) : kind.quad === 'horse' ? buildHorse({ coat: kind.tint ?? 0x6a5a4a }) : kind.quad === 'boar' ? buildBoar({ fur: kind.tint }) : null; const q = W ? null : buildQuad(kind.quad as 'rat', kind.tint);
  const root = new THREE.Group(); root.scale.setScalar(kind.scale * (kind.quad === 'wolf' ? 1.15 : kind.quad === 'fox' ? 0.62 : kind.quad === 'cat' ? 1.3 : kind.quad === 'horse' ? 0.85 : 1)); root.add(W ? W.root : q!.root); mergeStatic(W ? W.root : q!.root, ramp);
  let ph = 0;
  const pose = (dt: number, mv: number, t: number) => { ph += dt * (6 + mv * 2.2) * (mv > 0.1 ? 1 : 0); if (W) (W.pose as (p: { dt: number; mv: number; wind: number; strike: number; hurt: number; idle: boolean }) => void)({ dt, mv, wind: 0, strike: 0, hurt: 0, idle: mv < 0.1 }); else animQuadWalk(q!, ph, mv, t, 7); };
  return { root, pose };
}
/** a montaria com sela, manta, estribos e rédea */
export function mountModel(kind: MountKind) {
  const hz = buildHorse({ coat: kind.tint ?? 0x6a4630 }); const root = new THREE.Group(); root.scale.setScalar(kind.scale * 0.92);
  const tm = (c: number) => new THREE.MeshToonMaterial({ color: c, gradientMap: ramp });
  const seatG = new THREE.SphereGeometry(0.22, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2); const saddle = new THREE.Mesh(seatG, tm(0x4a2a16)); saddle.scale.set(1.05, 0.35, 1.45); saddle.position.set(0, 0.3, 0.12); hz.body.add(saddle);
  const pommel = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.035, 6, 12, Math.PI), tm(0x3a2010)); pommel.position.set(0, 0.36, 0.4); hz.body.add(pommel);
  const cantle = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.04, 6, 14, Math.PI), tm(0x3a2010)); cantle.position.set(0, 0.36, -0.16); hz.body.add(cantle);
  const blanket = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2.2), tm(0x8a2a2a)); blanket.scale.set(1.0, 0.25, 1.35); blanket.position.set(0, 0.27, 0.1); hz.body.add(blanket);
  for (const sx of [-1, 1]) { const strap = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.42, 4), tm(0x2a1a0e)); strap.position.set(sx * 0.27, 0.08, 0.14); hz.body.add(strap); const st = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.012, 5, 10), tm(0xc9a24a)); st.position.set(sx * 0.27, -0.15, 0.14); hz.body.add(st); }
  const rein = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.008, 4, 20, Math.PI), tm(0x2a1a0e)); rein.rotation.set(Math.PI / 2, 0, 0); rein.position.set(0, 0.25, 0.42); hz.neck.add(rein);
  root.add(hz.root); mergeStatic(hz.root, ramp);
  return { root, hz };
}

export function createPet(scene: THREE.Scene, kind: PetKind, heightAt: (x: number, z: number) => number) {
  const pm = petModel(kind), root = pm.root; fine(root); scene.add(root);
  const pos = new THREE.Vector3(), tgt = new THREE.Vector3(); let yaw = 0, placed = false, idleT = 0;
  const el = document.createElement('div'); el.className = 'npc pet'; el.innerHTML = `<b>${kind.name}</b>`; document.body.appendChild(el); if (kind.silent) el.style.display = 'none';
  let carrying = false;
  /** goal: ponto para onde o pet vai (item para pegar) ou null → segue o herói */
  function update(dt: number, t: number, hero: THREE.Vector3, heroYaw: number, goal: THREE.Vector3 | null, camera: THREE.Camera, canvas: HTMLCanvasElement) {
    if (!placed) { pos.set(hero.x - Math.sin(heroYaw) * 1.4, 0, hero.z - Math.cos(heroYaw) * 1.4); placed = true; }
    if (goal) tgt.copy(goal); else { const back = 1.5 + Math.sin(t * 0.5) * 0.3; tgt.set(hero.x - Math.sin(heroYaw) * back + Math.cos(heroYaw) * 0.9, 0, hero.z - Math.cos(heroYaw) * back - Math.sin(heroYaw) * 0.9); }
    const dx = tgt.x - pos.x, dz = tgt.z - pos.z, dd = Math.hypot(dx, dz);
    const far = Math.hypot(hero.x - pos.x, hero.z - pos.z);
    if (far > 26) { pos.set(hero.x - Math.sin(heroYaw) * 1.4, 0, hero.z - Math.cos(heroYaw) * 1.4); }
    let mv = 0;
    if (dd > (goal ? 0.5 : 0.9)) { const sp = Math.min(kind.speed, dd * 3) * dt; pos.x += dx / dd * Math.min(sp, dd); pos.z += dz / dd * Math.min(sp, dd); mv = Math.min(kind.speed, dd * 3); const w = Math.atan2(dx, dz); let df = w - yaw; while (df > Math.PI) df -= 6.283; while (df < -Math.PI) df += 6.283; yaw += df * Math.min(1, dt * 8); idleT = 0; }
    else { idleT += dt; if (!goal && idleT > 1.5) { const w = heroYaw; let df = w - yaw; while (df > Math.PI) df -= 6.283; while (df < -Math.PI) df += 6.283; yaw += df * Math.min(1, dt * 2); } }
    pos.y = heightAt(pos.x, pos.z);
    root.position.copy(pos); root.rotation.y = yaw;
    pm.pose(dt, mv, t);
    carrying = !!goal;
    const v = new THREE.Vector3(pos.x, pos.y + 0.9 * kind.scale, pos.z).project(camera); const r = canvas.getBoundingClientRect(); const show = v.z < 1 && far < 16 && root.visible;
    if (!kind.silent) el.style.display = show ? 'block' : 'none'; if (show && !kind.silent) { el.style.left = r.left + (v.x * 0.5 + 0.5) * r.width + 'px'; el.style.top = r.top + (-v.y * 0.5 + 0.5) * r.height + 'px'; }
  }
  function dispose() { scene.remove(root); el.remove(); }
  return { kind, pos, update, dispose, get carrying() { return carrying; }, root };
}

export function createMount(scene: THREE.Scene, kind: MountKind) {
  const mm = mountModel(kind), root = mm.root, hz = mm.hz; fine(root); root.visible = false; scene.add(root);
  const seatY = () => (hz.seat + 0.04) * kind.scale * 0.92; // altura do assento em relação ao chão
  function update(dt: number, t: number, pos: THREE.Vector3, yaw: number, moveSp: number) {
    root.visible = true; root.position.copy(pos); root.rotation.y = yaw; void t;
    hz.pose({ dt, mv: moveSp / Math.max(0.5, kind.scale), idle: moveSp < 0.1 });
  }
  function hide() { root.visible = false; }
  return { kind, update, hide, seatY, root };
}
