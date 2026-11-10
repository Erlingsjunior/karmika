/* 10/11 ANIMAÇÕES KAYKIT NO LUGAR DAS NOSSAS (branch teste_libs) — Erling: "traga o esqueleto de animação e use no lugar do nosso:
   combate, movimento avançado, poses — temos dificuldade com movimentos!".
   O boneco procedural continua decidindo O QUE acontece e QUANDO (o golpe sai no tempo do jogo, o dano no mesmo quadro); por cima dele,
   o modelo do Herik passa a tocar a animação da KayKit equivalente (transferida para o esqueleto Mixamo por libs/retarget.ts),
   no mesmo progresso da ação. Andar, correr, parado e parado em guarda também viram animação de verdade.
   A arma e o escudo continuam presos às mãos do modelo — seguem a animação nova sozinhos.
   ?anim=proc (ou localStorage karmika.anim = proc) volta ao jeito antigo, para comparar. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { retargetKayKit } from './retarget';
import type { Hero3D, Action } from '../characters';

export const KK_ON = (() => { try { return !/[?&]anim=proc/.test(location.search) && localStorage.getItem('karmika.anim') !== 'proc'; } catch { return true; } })();

/** ação do jogo → animação da KayKit (rig médio). Duas mãos e desarmado têm versões próprias. */
const ACT: Partial<Record<Action, string>> = {
  combo1: '1H_Melee_Attack_Slice_Diagonal', combo2: '1H_Melee_Attack_Slice_Horizontal', combo3: '1H_Melee_Attack_Chop', combo4: '1H_Melee_Attack_Stab', attack: '1H_Melee_Attack_Slice_Diagonal',
  cleave1: '2H_Melee_Attack_Slice', cleave2: '2H_Melee_Attack_Chop', cleave3: '2H_Melee_Attack_Spin', cleave4: '2H_Melee_Attack_Stab', slam: '2H_Melee_Attack_Chop', quake: '2H_Melee_Attack_Chop',
  thrust1: '1H_Melee_Attack_Stab', thrust2: 'Dualwield_Melee_Attack_Stab', stab: 'Dualwield_Melee_Attack_Stab', lowcut: '1H_Melee_Attack_Slice_Horizontal', claw1: 'Dualwield_Melee_Attack_Slice', claw2: 'Dualwield_Melee_Attack_Chop',
  kick: 'Unarmed_Melee_Attack_Kick', bash: 'Block_Attack', parry: 'Block_Attack', block: 'Blocking', hit: 'Hit_A',
  cast: 'Spellcast_Shoot', skyraise: 'Spellcast_Raise', breath: 'Spellcast_Long', dodge: 'Dodge_Backward', dash: 'Dodge_Forward', rush: 'Dodge_Forward', charge: 'Dodge_Forward',
  throw: 'Throw', kthrow: 'Throw', drink: 'Use_Item', herb: 'PickUp', plant: 'PickUp', skin: 'Interact', dance: 'Cheer',
  shoot: '1H_Ranged_Shoot', aim1: '1H_Ranged_Aiming', draw: '2H_Ranged_Aiming',
};
const LOOP = { idle: 'Idle', combat: '2H_Melee_Idle', walk: 'Walking_A', run: 'Running_A', back: 'Walking_Backwards' };

let SRC: Promise<{ scene: THREE.Object3D; clips: Map<string, THREE.AnimationClip> } | null> | null = null;
function source() { return (SRC ??= new GLTFLoader().loadAsync('/anim/kk_rig_medium.glb').then((g) => ({ scene: g.scene, clips: new Map(g.animations.map((a) => [a.name, a])) })).catch((e) => { console.warn('animações KayKit não carregaram', e); return null; })); }

interface Pose { tracks: { bone: THREE.Bone | THREE.Object3D; quat: boolean; it: THREE.Interpolant }[]; dur: number }

/** liga o animador num modelo do Herik já vestido no herói. `rest` = o modelo em pose de repouso (da carga). */
export function kkAnimator(model: THREE.Object3D, rest: THREE.Object3D) {
  if (!KK_ON) return null;
  let ready = false; const poses = new Map<string, Pose>(); let restClone: THREE.Object3D | null = null, srcClone: THREE.Object3D | null = null, data: Awaited<ReturnType<typeof source>> = null;
  void source().then((d) => { data = d; if (!d) return; restClone = cloneSkinned(rest); srcClone = cloneSkinned(d.scene); ready = true; });
  const bones = new Map<string, THREE.Object3D>(); model.traverse((o) => { if ((o as THREE.Bone).isBone) bones.set(o.name, o); });
  function pose(name: string): Pose | null { const c = poses.get(name); if (c) return c; if (!ready || !data || !restClone || !srcClone) return null; const clip = data.clips.get(name); if (!clip) return null;
    const rc = retargetKayKit(srcClone, restClone, clip); const tracks: Pose['tracks'] = [];
    for (const t of rc.tracks) { const [bn, prop] = t.name.split('.'); const b = bones.get(bn); if (b) tracks.push({ bone: b, quat: prop === 'quaternion', it: (t as THREE.KeyframeTrack & { createInterpolant(): THREE.Interpolant }).createInterpolant() }); }
    const p = { tracks, dur: rc.duration }; poses.set(name, p); return p; }
  const q = new THREE.Quaternion(), v = new THREE.Vector3();
  function put(p: Pose, t: number, w: number) { if (w <= 0.001) return; const tt = Math.max(0, Math.min(p.dur, t));
    for (const tr of p.tracks) { const r = tr.it.evaluate(tt) as Float32Array; if (tr.quat) { q.set(r[0], r[1], r[2], r[3]); tr.bone.quaternion.slerp(q, w); } else { v.set(r[0], r[1], r[2]); tr.bone.position.lerp(v, w); } } }
  /* estado que muda devagar: peso de cada camada, relógio da caminhada, velocidade medida */
  let last = performance.now(), loopT = 0, wAct = 0, lastAct: string | null = null, sp = 0; const prev = new THREE.Vector3(); let has = false;
  return {
    /** chamado pelo skin3d depois de copiar a pose procedural e ANTES de prender a arma nas mãos */
    apply(hero: Hero3D) {
      const now = performance.now(), dt = Math.min(0.1, (now - last) / 1000); last = now; if (!ready) return;
      const h = hero as Hero3D & { riding?: boolean; sit?: number; swim?: boolean; kneel?: boolean; dead?: boolean };
      if (h.riding || (h.sit ?? 0) > 0.05 || h.swim || h.kneel) { has = false; return; } // montado, sentado, nadando, ajoelhado: fica o procedural
      const p0 = hero.root.position; if (has && dt > 0) { const d = Math.hypot(p0.x - prev.x, p0.z - prev.z) / dt; sp += (Math.min(12, d) - sp) * Math.min(1, dt * 10); } prev.copy(p0); has = true;
      /* camada de movimento: parado / guarda / andando / correndo */
      const loopName = sp > 4.2 ? LOOP.run : sp > 0.6 ? LOOP.walk : hero.combat ? LOOP.combat : LOOP.idle; const lp = pose(loopName);
      if (lp) { loopT += dt * (loopName === LOOP.run ? Math.max(0.8, sp / 6.5) : loopName === LOOP.walk ? Math.max(0.7, sp / 2.2) : 1); put(lp, loopT % lp.dur, 1); }
      /* camada da ação (golpe, magia, esquiva…): no MESMO progresso da ação do jogo; entra e sai suave */
      const an = hero.acting && hero.actName ? ACT[hero.actName] : undefined;
      if (an) { const ap = pose(an); if (ap) { if (an !== lastAct) wAct = 0.35; lastAct = an; wAct = Math.min(1, wAct + dt * 9); const k = hero.actP; const fade = Math.min(1, (1 - k) * 6); put(ap, k * ap.dur, wAct * fade); } }
      else { lastAct = null; wAct = 0; }
      model.updateMatrixWorld(true);
    },
  };
}
