/* COMPANHEIROS: o pet coletor, a montaria (montar e desmontar), as mulas das caravanas e as habilidades do pet. Saiu do main.ts (02/11). */
import { createPet, createMount, MOUNTS, PETS } from '../companions';
import { heightAt } from '../world';
import { TILE_M as T, isWalkable } from '@karmika/shared';
import type { CompanheirosCtx } from '../main';

export function createCompanheiros(K: CompanheirosCtx) {
/* ---------- companheiros: pet coletor e montaria ---------- */
let pet: ReturnType<typeof createPet> | null = null, mount: ReturnType<typeof createMount> | null = null, riding = false;
function setRiding(on: boolean, quiet = false) {
  if (on && mount && (MOUNTS[mount.kind.id]?.lvl ?? 0) > K.game.st.lvl) { if (!quiet) K.game.logMsg(`🐴 ${mount.kind.name} não aceita você ainda: precisa do nível ${MOUNTS[mount.kind.id]!.lvl}.`, '#ff9a8a'); return; }
  if (on && !riding) setTimeout(() => K.feats.bump('rides'), 0);
  if (riding === on) return; if (on && !mount) return;
  riding = on; K.hero.riding = on; if (!on) mount?.hide(); if (!quiet) K.game.logMsg(on ? `🐴 Você monta ${mount!.kind.name}.` : '🐴 Você desmonta.', '#e0c080');
}
const mules = K.npcSys.npcs.filter((n) => n.def.route).map((n) => ({ n, pet: createPet(K.scene, { id: 'mule', name: 'Mula de carga', quad: 'horse', tint: 0x6a5a4a, scale: 0.8, speed: 3.2, silent: true }, (x, z) => heightAt(x, z)) }));
function updateMules(dt: number, t: number) { for (const m of mules) { const far = Math.hypot(m.n.pos.x - K.heroPos.x, m.n.pos.z - K.heroPos.z) > 70; m.pet.root.visible = !far && !K.inside; if (far || K.inside) continue; m.pet.update(dt, t, m.n.pos, m.n.yaw, null, K.camera, K.canvas); } }
function updateCompanions(dt: number, t: number, heroYaw: number, mps: number) {
  updateMules(dt, t);
  const ps = K.stable.petStats(), petId = ps ? K.stable.petId : null, petName = ps?.name ?? '';
  if (petId && (!pet || pet.kind.id !== petId || pet.kind.name !== petName)) { pet?.dispose(); pet = createPet(K.scene, { ...PETS[petId]!, name: petName }, (x, z) => K.inside ? 0 : heightAt(x, z), (x, z) => { if (K.inside) return K.inside.int.free(x - K.IX, z - K.IZ); const t = K.city.map[Math.floor(z / T)]?.[Math.floor(x / T)]; if (!t || !isWalkable(t)) return false; try { return !K.solidHit(x / T, z / T, true); } catch { return true; } }); }
  if (!petId && pet) { pet.dispose(); pet = null; }
  if (pet && ps) { pet.kind.speed = PETS[petId!]!.speed * ps.fetchMul; pet.root.visible = !K.inside || !!K.inside.dg; /* na masmorra o pet desce junto (25/10) */ const goal = (K.inside && !K.inside.dg) || K.combatMode ? null : K.game.petFetch(pet.pos, K.heroPos, ps.range); pet.update(dt, t, K.heroPos, heroYaw, goal, K.camera, K.canvas); petSkills(dt, ps); }
  const mountId = K.stable.mountId, ms = K.stable.mountStats();
  if (mountId && (!mount || mount.kind.id !== mountId || mount.kind.name !== ms?.name)) { if (riding) setRiding(false, true); if (mount) K.scene.remove(mount.root); mount = createMount(K.scene, { ...MOUNTS[mountId]!, name: ms?.name ?? MOUNTS[mountId]!.name, speed: MOUNTS[mountId]!.speed * (ms?.speedMul ?? 1) }); }
  if (mount && ms) mount.kind.speed = MOUNTS[mount.kind.id]!.speed * ms.speedMul;
  if (!mountId && mount) { setRiding(false, true); K.scene.remove(mount.root); mount = null; }
  if (riding && (K.inside || K.combatMode || K.swimmingNow || K.hero.acting)) setRiding(false, K.hero.acting);
  if (riding && mount) mount.update(dt, t, K.heroPos, heroYaw, mps);
}
/* habilidades do pet (Estábulo, 25/10): alarido, mordida, guincho do faro, fuçar */
let petCd = 2, fucarT = 60;
function petSkills(dt: number, ps: NonNullable<ReturnType<typeof K.stable.petStats>>) {
  if (!pet || K.inside) return; petCd -= dt; const sk = ps.skill; if (!sk) return;
  const foes = K.game.enemies.list.filter((e) => e.alive && e.active && (e.state === 'chase' || e.state === 'windup') && Math.hypot(e.pos.x - K.heroPos.x, e.pos.z - K.heroPos.z) < 10 * (1 + (ps.range / (sk === 'faro' ? 22 : 14) - 1)));
  if (sk === 'fucar') { if (K.combatMode || foes.length || Math.hypot(pet.pos.x - K.heroPos.x, pet.pos.z - K.heroPos.z) > 5) return; fucarT -= dt; if (fucarT > 0) return; fucarT = 90 * ps.cdMul;
    for (let i = 0; i < 10; i++) K.particles.spawn(pet.pos.x, pet.pos.y + 0.1, pet.pos.z, { vx: (Math.random() - 0.5) * 2, vy: Math.random() * 2, vz: (Math.random() - 0.5) * 2, life: 0.6, s0: 0.3, s1: 0.1, c0: 0x8a6a3a, c1: 0x4a3a20, a: 0.9 });
    const r = Math.random(); if (r < 0.35) { K.inv.add('apple', 1); K.game.logMsg(`🐖 ${ps.name} fuçou a terra e achou uma Maçã silvestre.`, '#d8c890'); } else if (r < 0.55) { K.inv.add('bread', 1); K.game.logMsg(`🐖 ${ps.name} desenterrou um Pão (ainda bom, quase).`, '#d8c890'); } else if (r < 0.7) { const g = 2 + Math.floor(Math.random() * 6); K.game.st.gold += g; K.audio.coins(2); K.game.logMsg(`🐖 ${ps.name} achou ${g} moedas enterradas.`, '#ffe08a'); } else K.game.logMsg(`🐖 ${ps.name} fuçou, fuçou... e não achou nada.`, '#a8987a');
    return; }
  if (!foes.length || petCd > 0) return;
  const e = foes.sort((a, b) => Math.hypot(a.pos.x - K.heroPos.x, a.pos.z - K.heroPos.z) - Math.hypot(b.pos.x - K.heroPos.x, b.pos.z - K.heroPos.z))[0];
  if (sk === 'mordida') { petCd = 4 * ps.cdMul; K.game.petBite(e, (6 + 2 * K.game.st.lvl) * ps.biteMul, pet.pos); K.audio.hit(); pet.pos.set(e.pos.x - 0.8, pet.pos.y, e.pos.z - 0.8); }
  else if (sk === 'alarido' || sk === 'faro') { petCd = (sk === 'faro' ? 25 : 18) * ps.cdMul; if (K.game.petDistract(e, sk === 'faro' ? 1 : 1.5)) { K.audio.squeak(1); K.game.logMsg(`${sk === 'faro' ? '🐀' : '🦊'} ${ps.name} ${sk === 'faro' ? 'guinchou' : 'deu um alarido'}: ${e.def.name} parou para procurar o barulho.`, '#ffe08a'); } }
}
  return { setRiding, get riding() { return riding; }, get pet() { return pet; }, set pet(v: typeof pet) { pet = v; }, get mount() { return mount; }, updateCompanions };
}
