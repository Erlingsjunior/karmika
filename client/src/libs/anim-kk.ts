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

/* 10/11: os dois esqueletos da KayKit (Erling: "anão usa rig_medium; rig_large para guerreiros e lobisomens, e futuramente druida-urso e
   tecnocrata, de corpo mais forte; magos, bruxos e caçadores são mais fit"). O que o rig grande não tem (arco, ferramentas, sentar…)
   o personagem grande pega do médio. */
const LARGE_KITS = new Set(['nordic', 'lob', 'tecno']);
let kit = '', weapon = '', forced: { clip: string; until: number; t: number } | null = null;
/** habilidade que pede uma animação própria por um tempo (o Redemoinho gira de verdade, em laço) */
export function kkForce(clip: string, secs: number) { forced = { clip, until: performance.now() + secs * 1000, t: 0 }; } export function kkSetKit(k: string) { kit = k; }
/** 10/11: a arma na mão escolhe o jeito do golpe (arco, besta/fogo, duas mãos, adagas, porrete) */
export function kkSetWeapon(base: string) { weapon = base || ''; }
const W2H = /Martelo|Marreta|Machado Grande|Machado de Guerra|Alabarda|Montante|Espad[ãa]o|Clava|Malho|Lança|Grande/i, WBOW = /Arco/i, WGUN = /Besta|Pistola|Rev[óo]lver|Escopeta|Rifle|Gatling|Bacamarte|Mosquete|Lança-?chamas|Pulverizador/i, WDAG = /Adaga|Kunai|Punhal|Garras/i, WCLUB = /Porrete|Maça|Mangual/i;
const large = () => LARGE_KITS.has(kit);
type AM = Partial<Record<Action, string>>;
/** ação do jogo → animação (M = rig médio, L = rig grande). Duas mãos, duas armas e desarmado têm as próprias. */
const ACT_M: AM = {
  combo1: 'M:Melee_1H_Attack_Slice_Diagonal', combo2: 'M:Melee_1H_Attack_Slice_Horizontal', combo3: 'M:Melee_1H_Attack_Chop', combo4: 'M:Melee_1H_Attack_Stab', /* combo comum: sem pulo nem giro (Erling: "pulando e girando no meio do ataque padrão, estranho") */ attack: 'M:Melee_1H_Attack_Slice_Diagonal',
  cleave1: 'M:Melee_2H_Attack_Slice', cleave2: 'M:Melee_2H_Attack_Chop', cleave3: 'M:Melee_2H_Attack_Slice', cleave4: 'M:Melee_2H_Attack_Stab', slam: 'M:Melee_2H_Attack_Chop', quake: 'M:Melee_2H_Attack_Chop',
  thrust1: 'M:Melee_1H_Attack_Stab', thrust2: 'M:Melee_Dualwield_Attack_Stab', stab: 'M:Melee_Dualwield_Attack_Stab', lowcut: 'M:Melee_1H_Attack_Slice_Horizontal', claw1: 'M:Melee_Dualwield_Attack_Slice', claw2: 'M:Melee_Dualwield_Attack_Chop',
  kick: 'M:Melee_Unarmed_Attack_Kick', bite: 'M:Melee_Unarmed_Attack_Punch_A', bash: 'M:Melee_Block_Attack', parry: 'M:Melee_Block_Attack', block: 'M:Melee_Blocking', hit: 'M:Hit_A',
  cast: 'M:Ranged_Magic_Shoot', skyraise: 'M:Ranged_Magic_Raise', breath: 'M:Ranged_Magic_Spellcasting_Long', stance: 'M:Ranged_Magic_Summon',
  dodge: 'M:Dodge_Backward', dash: 'M:Dodge_Forward', rush: 'M:Dodge_Forward', charge: 'M:Dodge_Forward', jet: 'M:Jump_Full_Short',
  throw: 'M:Throw', kthrow: 'M:Throw', drink: 'M:Use_Item', herb: 'M:PickUp', plant: 'M:PickUp', skin: 'M:Interact', dance: 'M:Cheering',
  shoot: 'M:Ranged_1H_Shoot', aim1: 'M:Ranged_Bow_Draw', draw: 'M:Ranged_Bow_Draw', chop: 'M:Chop', mine: 'M:Pickaxe', fishcast: 'M:Fishing_Cast',
};
const ACT_L: AM = { combo1: 'L:Melee_1H_Slash', combo2: 'L:Melee_1H_Slash', combo3: 'L:Melee_2H_Attack', combo4: 'L:Melee_1H_Stab', attack: 'L:Melee_1H_Slash',
  cleave1: 'L:Melee_2H_Attack', /* o Melee_2H_Slam do rig grande deita o corpo de bruços: fica a pancada do médio */
  claw1: 'L:Melee_Dualwield_Slash', claw2: 'L:Melee_Dualwield_SlashCombo', bite: 'L:Melee_Unarmed_Smash', kick: 'L:Melee_Unarmed_Kick', clubsm: 'L:Melee_Unarmed_Smash',
  bash: 'L:Melee_Block_Attack', parry: 'L:Melee_Block_Attack', block: 'L:Melee_Blocking', hit: 'L:Hit_A', dodge: 'L:Dodge_Backwards', dash: 'L:Dodge_Forward', rush: 'L:Dodge_Forward', charge: 'L:Dodge_Forward', dance: 'L:Flexing' };
/** pela arma: o que muda em cima da classe */
const byWeapon = (a: Action): string | undefined => {
  if (WBOW.test(weapon)) return ({ shoot: 'M:Ranged_Bow_Release', aim1: 'M:Ranged_Bow_Draw', draw: 'M:Ranged_Bow_Draw', attack: 'M:Ranged_Bow_Release', combo1: 'M:Ranged_Bow_Release', combo2: 'M:Ranged_Bow_Release', combo3: 'M:Ranged_Bow_Release_Up', combo4: 'M:Ranged_Bow_Release' } as AM)[a];
  if (WGUN.test(weapon)) { const two = /Besta de Repeti|Escopeta|Rifle|Gatling|Mosquete|Bacamarte|Lança-?chamas|Pulverizador/i.test(weapon); return ({ shoot: two ? 'M:Ranged_2H_Shoot' : 'M:Ranged_1H_Shoot', aim1: two ? 'M:Ranged_2H_Aiming' : 'M:Ranged_1H_Aiming', draw: two ? 'M:Ranged_2H_Reload' : 'M:Ranged_1H_Reload' } as AM)[a]; }
  if (W2H.test(weapon)) return ({ combo1: 'M:Melee_2H_Attack_Slice', combo2: 'M:Melee_2H_Attack_Chop', combo3: 'M:Melee_2H_Attack_Chop', combo4: 'M:Melee_2H_Attack_Stab', attack: 'M:Melee_2H_Attack_Slice' } as AM)[a];
  if (WDAG.test(weapon)) return ({ combo1: 'M:Melee_Dualwield_Attack_Slice', combo2: 'M:Melee_Dualwield_Attack_Stab', combo3: 'M:Melee_Dualwield_Attack_Chop', combo4: 'M:Melee_1H_Attack_Stab', attack: 'M:Melee_Dualwield_Attack_Stab' } as AM)[a];
  if (WCLUB.test(weapon)) return ({ combo1: 'M:Melee_1H_Attack_Chop', combo2: 'M:Melee_1H_Attack_Slice_Horizontal', combo3: 'M:Melee_1H_Attack_Chop', combo4: 'M:Melee_1H_Attack_Slice_Diagonal' } as AM)[a];
  return undefined; };
const actOf = (a: Action) => byWeapon(a) ?? (large() ? ACT_L[a] : undefined) ?? (kit === 'tecno' && a === 'shoot' ? 'M:Ranged_2H_Shoot' : undefined) ?? ACT_M[a];
/** 10/11 (Erling: "a girada com espada pode ser 40% mais rápida, tem que ser mais mortal"): giros tocam mais depressa (e emendam) */
const SPEED: Record<string, number> = { 'M:Melee_2H_Attack_Spin': 1.4, 'L:Melee_2H_Attack': 1.15, 'M:Melee_2H_Attack_Spinning': 1.4 };
const loops = () => large()
  ? { idle: 'L:Idle_A', combat: kit === 'lob' ? 'L:Melee_Unarmed_Idle' : 'L:Melee_2H_Idle', walk: 'L:Walking_A', run: kit === 'tecno' ? 'M:Running_HoldingRifle' : 'L:Running_A' }
  : { idle: 'M:Idle_A', combat: WBOW.test(weapon) ? 'M:Ranged_Bow_Idle' : WGUN.test(weapon) ? 'M:Ranged_2H_Aiming' : kit === 'mag' || kit === 'bru' ? 'M:Melee_Unarmed_Idle' : 'M:Melee_2H_Idle', walk: 'M:Walking_A', run: WBOW.test(weapon) ? 'M:Running_HoldingBow' : WGUN.test(weapon) ? 'M:Running_HoldingRifle' : 'M:Running_A' };
const FILES = ['rig_large_combatmelee', 'rig_large_general', 'rig_large_movementadvanced', 'rig_large_movementbasic', 'rig_large_simulation', 'rig_medium_combatmelee', 'rig_medium_combatranged', 'rig_medium_general', 'rig_medium_movementadvanced', 'rig_medium_movementbasic', 'rig_medium_simulation', 'rig_medium_tools'];

let SRC: Promise<{ scenes: Record<'M' | 'L', THREE.Object3D>; clips: Map<string, { clip: THREE.AnimationClip; rig: 'M' | 'L' }> } | null> | null = null;
function source() { return (SRC ??= Promise.all(FILES.map((f) => new GLTFLoader().loadAsync(`/anim/${f}.glb`).then((g) => ({ f, g })))).then((all) => {
  const clips = new Map<string, { clip: THREE.AnimationClip; rig: 'M' | 'L' }>(), scenes = {} as Record<'M' | 'L', THREE.Object3D>;
  for (const { f, g } of all) { const rig = /large/.test(f) ? 'L' : 'M'; scenes[rig] ??= g.scene; for (const a of g.animations) clips.set(`${rig}:${a.name}`, { clip: a, rig }); }
  return { scenes, clips }; }).catch((e) => { console.warn('animações KayKit não carregaram', e); return null; })); }

interface Pose { tracks: { bone: THREE.Bone | THREE.Object3D; quat: boolean; it: THREE.Interpolant }[]; dur: number }

/** liga o animador num modelo do Herik já vestido no herói. `rest` = o modelo em pose de repouso (da carga). */
export function kkAnimator(model: THREE.Object3D, rest: THREE.Object3D) {
  if (!KK_ON) return null;
  let ready = false; const poses = new Map<string, Pose>(); let restClone: THREE.Object3D | null = null, data: Awaited<ReturnType<typeof source>> = null; const srcClone: Partial<Record<'M' | 'L', THREE.Object3D>> = {};
  void source().then((d) => { data = d; if (!d) return; restClone = cloneSkinned(rest); srcClone.M = cloneSkinned(d.scenes.M); srcClone.L = d.scenes.L ? cloneSkinned(d.scenes.L) : undefined; ready = true; });
  const bones = new Map<string, THREE.Object3D>(); model.traverse((o) => { if ((o as THREE.Bone).isBone) bones.set(o.name, o); });
  function pose(name: string): Pose | null { const got = poses.get(name); if (got) return got; if (!ready || !data || !restClone) return null; const c = data.clips.get(name); const sc = c ? srcClone[c.rig] : undefined; if (!c || !sc) return null;
    const rc = retargetKayKit(sc, restClone, c.clip); const tracks: Pose['tracks'] = [];
    for (const t of rc.tracks) { const [bn, prop] = t.name.split('.'); const b = bones.get(bn); if (b) tracks.push({ bone: b, quat: prop === 'quaternion', it: (t as THREE.KeyframeTrack & { createInterpolant(): THREE.Interpolant }).createInterpolant() }); }
    const p = { tracks, dur: rc.duration }; poses.set(name, p); return p; }
  const q = new THREE.Quaternion(), v = new THREE.Vector3(); const handL = bones.get('mixamorigLeftHand') ?? null, flipY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
  /** `bob=false`: sem o sobe-desce do quadril (Erling: "tira o pulinho do andar, tá andar de jogo de criança") — andar e correr ficam na altura do nosso movimento */
  function put(p: Pose, t: number, w: number, bob = true) { if (w <= 0.001) return; const tt = Math.max(0, Math.min(p.dur, t));
    for (const tr of p.tracks) { if (!tr.quat && !bob) continue; const r = tr.it.evaluate(tt) as Float32Array; if (tr.quat) { q.set(r[0], r[1], r[2], r[3]); tr.bone.quaternion.slerp(q, !bob && /Hips/.test(tr.bone.name) ? w * 0.4 : w); } else { v.set(r[0], r[1], r[2]); tr.bone.position.lerp(v, w); } } }
  /* estado que muda devagar: peso de cada camada, relógio da caminhada, velocidade medida */
  let last = performance.now(), loopT = 0, wAct = 0, lastAct: string | null = null, sp = 0; const prev = new THREE.Vector3(); let has = false;
  return {
    /** chamado pelo skin3d depois de copiar a pose procedural e ANTES de prender a arma nas mãos */
    apply(hero: Hero3D) {
      const now = performance.now(), dt = Math.min(0.1, (now - last) / 1000); last = now; if (!ready) return;
      const h = hero as Hero3D & { riding?: boolean; sit?: number; swim?: boolean; kneel?: boolean; dead?: boolean };
      if (h.riding || h.swim) { has = false; return; } // montado e nadando: fica o procedural
      /* sentado (fogueira, banco, taverna) e ajoelhado (colhendo, rezando): poses da KayKit */
      if ((h.sit ?? 0) > 0.05 || h.kneel) { const sp2 = pose(h.kneel ? 'M:PickUp' : 'M:Sit_Floor_Idle'); if (sp2) { loopT += dt; put(sp2, h.kneel ? sp2.dur * 0.45 : loopT % sp2.dur, h.kneel ? 1 : Math.min(1, h.sit ?? 1)); model.updateMatrixWorld(true); } return; }
      const p0 = hero.root.position; if (has && dt > 0) { const d = Math.hypot(p0.x - prev.x, p0.z - prev.z) / dt; sp += (Math.min(12, d) - sp) * Math.min(1, dt * 10); } prev.copy(p0); has = true;
      /* camada de movimento: parado / guarda / andando / correndo */
      const LOOP = loops(); const loopName = sp > 4.2 ? LOOP.run : sp > 0.6 ? LOOP.walk : hero.combat ? LOOP.combat : LOOP.idle; const lp = pose(loopName);
      if (lp) { loopT += dt * (loopName === LOOP.run ? Math.max(0.8, sp / 6.5) : loopName === LOOP.walk ? Math.max(0.7, sp / 2.2) : 1); put(lp, loopT % lp.dur, loopName === LOOP.walk || loopName === LOOP.run ? 0.7 : 1, kit === 'dwarf' && loopName === LOOP.walk); } /* o anão anda com um pulinho de anão (Erling) */ /* andar/correr: 70% KayKit + 30% o nosso (menos desenho animado) */
      /* camada da ação (golpe, magia, esquiva…): no MESMO progresso da ação do jogo; entra e sai suave */
      if (forced && performance.now() < forced.until) { const fp = pose(forced.clip); if (fp) { forced.t += dt * (SPEED[forced.clip] ?? 1); put(fp, forced.t % fp.dur, 1); model.updateMatrixWorld(true); return; } } else forced = null;
      const an = hero.acting && hero.actName ? actOf(hero.actName) : undefined;
      if (an) { const ap = pose(an); if (ap) { if (an !== lastAct) wAct = 0.35; lastAct = an; wAct = Math.min(1, wAct + dt * 9); const k = hero.actP, spd = SPEED[an] ?? 1; const fade = Math.min(1, (1 - k) * 6); put(ap, ((k * spd) % 1) * ap.dur, wAct * fade, ((hero as Hero3D & { lift?: number }).lift ?? 0) < 0.05); /* no ar (salto de recuo), o quadril é do salto */ } }
      else { lastAct = null; wAct = 0; }
      /* 10/11 (Erling: "o arco está invertido: madeira para frente, linha para trás"): com o antebraço da animação nova, a mão do arco
         chega virada; meia-volta no próprio eixo do osso (Y no esqueleto Mixamo) */
      if (WBOW.test(weapon) && handL) handL.quaternion.multiply(flipY);
      model.updateMatrixWorld(true);
    },
  };
}
