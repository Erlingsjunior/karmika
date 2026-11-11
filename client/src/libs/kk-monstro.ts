/* MONSTROS COM MODELO E ANIMAÇÃO KAYKIT (11/11, Erling: "não temos monstros para substituir esses elites e bosses?" — e pôs o pacote
   KayKit Skeletons 1.1 na pasta). Os esqueletos são do mesmo esqueleto de animação (Rig_Medium) das animações que o jogo já carrega
   em /anim, então tocam direto, sem transferência: parado, andando, correndo, golpe, magia, tiro, apanhando e morrendo.
   O jogo continua mandando no QUE acontece e QUANDO (o golpe bate no fim do aviso); a animação só acompanha.
   Modelos em /models/bestiary/Skeleton_*.glb; armas em /models/kaykit/armas/esqueletos/. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';

export interface KkMonsterDef { model: string; /** arma na mão direita / objeto na esquerda (arquivos de armas/esqueletos, sem extensão) */ right?: string; left?: string; /** jeito do golpe */ atk?: 'melee' | 'magic' | 'shoot'; /** altura do modelo em metros de jogo (o da KayKit tem ~1,25) */ height?: number }
type St = { state: string; alive: boolean };
const FILES = ['rig_medium_general', 'rig_medium_movementbasic', 'rig_medium_combatmelee', 'rig_medium_combatranged'];
let CLIPS: Promise<Map<string, THREE.AnimationClip>> | null = null;
const clips = () => (CLIPS ??= Promise.all(FILES.map((f) => new GLTFLoader().loadAsync(`/anim/${f}.glb`))).then((all) => { const m = new Map<string, THREE.AnimationClip>(); for (const g of all) for (const a of g.animations) m.set(a.name, a); return m; }));
const MODELS = new Map<string, Promise<THREE.Object3D>>();
const model = (url: string) => { let p = MODELS.get(url); if (!p) { p = new GLTFLoader().loadAsync(url).then((g) => g.scene); MODELS.set(url, p); } return p; };
const ATK = { melee: ['Melee_1H_Attack_Chop', 'Melee_1H_Attack_Slice_Diagonal', 'Melee_1H_Attack_Slice_Horizontal'], magic: ['Ranged_Magic_Shoot', 'Ranged_Magic_Spellcasting'], shoot: ['Ranged_1H_Shoot', 'Ranged_2H_Shoot'] };

export function kkMonsterRig(def: KkMonsterDef, ramp: THREE.Texture) {
  const root = new THREE.Group(), mats: THREE.MeshToonMaterial[] = []; let mixer: THREE.AnimationMixer | null = null; const acts = new Map<string, THREE.AnimationAction>(); let cur = '', atkN = 0, wasWind = false, deadOn = false;
  void Promise.all([model(`/models/bestiary/${def.model}.glb`), clips(), def.right ? model(`/models/kaykit/armas/esqueletos/${def.right}.gltf`) : null, def.left ? model(`/models/kaykit/armas/esqueletos/${def.left}.gltf`) : null]).then(([src, cl, wr, wl]) => {
    const m = cloneSkinned(src); m.scale.setScalar((def.height ?? 1.7) / 1.25); root.add(m);
    const toon = (o: THREE.Object3D) => o.traverse((x) => { const mm = x as THREE.Mesh; if (!mm.isMesh) return; const sm = mm.material as THREE.MeshStandardMaterial; const t = new THREE.MeshToonMaterial({ map: sm.map ?? null, color: sm.map ? 0xffffff : sm.color, gradientMap: ramp }); mm.material = t; mm.castShadow = true; mm.frustumCulled = false; mm.userData.dyn = true; mats.push(t); });
    toon(m);
    const hold = (w: THREE.Object3D | null, slot: string) => { if (!w) return; const b = m.getObjectByName(slot) ?? m.getObjectByName(slot.replace('.', '')); if (!b) return; const c = w.clone(true); toon(c); b.add(c); };
    hold(wr, 'handslot.r'); hold(wl, 'handslot.l');
    mixer = new THREE.AnimationMixer(m);
    for (const n of ['Idle_A', 'Walking_A', 'Running_A', 'Hit_A', 'Death_A', ...ATK[def.atk ?? 'melee']]) { const c = cl.get(n); if (!c) continue; const a = mixer.clipAction(c); if (n === 'Death_A' || n === 'Hit_A' || !/Idle|Walking|Running/.test(n)) { a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; } acts.set(n, a); }
    acts.get('Idle_A')?.play(); cur = 'Idle_A';
  }).catch((e) => console.warn('monstro KayKit não carregou', def.model, e));
  function go(n: string, fade = 0.18, scale = 1) { const a = acts.get(n); if (!a) return; if (cur === n && a.isRunning()) { a.timeScale = scale; return; } const p = acts.get(cur); a.reset(); a.timeScale = scale; a.play(); if (p && p !== a) p.crossFadeTo(a, fade, false); cur = n; }
  return { root, mats, /** a queda do corpo é a da animação (o jogo não deita o boneco por cima) */ ownDeath: true,
    update(e: St, dt: number, windK: number, _strikeK: number, hurtK: number, mv: number) {
      if (!mixer) return; const wind = e.state === 'windup';
      if (!e.alive || e.state === 'dead') { if (!deadOn) { deadOn = true; go('Death_A', 0.1); } }
      else { deadOn = false;
        if (wind && !wasWind) { const L = ATK[def.atk ?? 'melee'].filter((n) => acts.has(n)), n = L[atkN++ % Math.max(1, L.length)]; if (n) { const a = acts.get(n)!, hitAt = a.getClip().duration * 0.45; go(n, 0.08, 1); (a as THREE.AnimationAction & { _hitAt?: number })._hitAt = hitAt; } }
        if (wind || e.state === 'recover') { /* o golpe da animação bate junto com o do jogo: a posição do clipe segue o aviso (windK 0→1 = começo → impacto) */ const a = acts.get(cur); if (a && wind && !/Idle|Walking|Running/.test(cur)) { a.paused = false; a.time = Math.min(a.getClip().duration, windK * a.getClip().duration * 0.45); a.timeScale = 0; } else if (a && !/Idle|Walking|Running|Hit|Death/.test(cur)) a.timeScale = 1; }
        else if (hurtK > 0.6 && cur !== 'Hit_A') go('Hit_A', 0.05, 1.4);
        else if (cur === 'Hit_A' && acts.get('Hit_A')!.isRunning()) { /* deixa terminar */ }
        else go(mv > 4 ? 'Running_A' : mv > 0.25 ? 'Walking_A' : 'Idle_A', 0.2, mv > 4 ? Math.max(0.8, mv / 6) : mv > 0.25 ? Math.max(0.7, mv / 2.2) : 1); }
      wasWind = wind; mixer.update(dt); } };
}
