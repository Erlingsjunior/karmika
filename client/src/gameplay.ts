import { FEASTS, feastEff, FEAST_MIN, tierOf, baseOf, MK, TURNS } from './festim';
import { G } from './genero';
import { classLevelUp } from './celebrate';
import * as THREE from 'three';
import { buildHealDrone, buildShieldBot, buildDome, type HealDrone, type ShieldBot, type Dome } from './drones3d';
import { fine } from './dual3d';
import type { Hero3D } from './characters';
import { radialTexture, type Particles } from './fx3d';
import type { AudioEngine } from './audio';
import { genGear, rollRarity, RARITY, type Gear, type Rarity } from './loot';
import type { SpawnDef } from './world';
import { ITEMS } from './inventory';
import type { SkillId } from './kits';
import { createEnemies, ELITE_TYPES, type Enemy } from './enemies';
import { buildBeast, buildWolf, type Beast } from './werewolf3d';

/** Combate básico, vida/magia, boneco de treino, projéteis, números de dano e menu. */
export interface GameplayDeps { /** multiplicador do dano recebido de fora (Instinto ligado: +10%) */ takenK?: () => number;
  scene: THREE.Scene; particles: Particles; camera: THREE.Camera; audio: AudioEngine;
  getHero: () => Hero3D; getRaceColor: () => number; canvas: HTMLCanvasElement;
  dummyPos: THREE.Vector3;
  world: { spawns: SpawnDef[]; heightAt(x: number, z: number): number; walkable(x: number, z: number): boolean; townAt?(x: number, z: number): boolean; guardNear?(x: number, z: number): boolean };
}

const $ = (id: string) => document.getElementById(id) as HTMLElement;
const rnd = (a: number, b: number) => a + Math.random() * (b - a);

function dummyTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d')!;
  g.fillStyle = '#c9a766'; g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 160; i++) { g.strokeStyle = Math.random() < 0.5 ? '#a8864a' : '#e0c488'; g.lineWidth = 1; g.beginPath(); const x = Math.random() * 128, y = Math.random() * 128; g.moveTo(x, y); g.lineTo(x + (Math.random() - 0.5) * 10, y + 10 + Math.random() * 12); g.stroke(); }
  [[64, 64, 52, '#8a2a22'], [64, 64, 36, '#e8dcc0'], [64, 64, 22, '#8a2a22'], [64, 64, 9, '#e8dcc0']].forEach(([x, y, r, col]) => { g.fillStyle = col as string; g.beginPath(); g.arc(x as number, y as number, r as number, 0, 7); g.fill(); });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function createGameplay(d: GameplayDeps) {
  const fxAdd = (...os: THREE.Object3D[]) => { for (const o of os) fine(o); d.scene.add(...os); };
  const st = { hp: 100, hpMax: 100, mp: 100, mpMax: 100, stam: 100, stamMax: 100, hits: 0, hpLag: 100, mpLag: 100, lastCast: -9, menuOpen: false, shake: 0, dead: false, xp: 0, lvl: 1, gold: 0, kills: 0, god: false, atk: 1, def: 0, fury: 0, counterT: 0, ambushT: 0, serene: 0, dmgFlat: 0, crit: 0.12, leech: 0, regen: 0.35, move: 1, xpMul: 1, goldMul: 1, outMul: 1, takenMul: 1, points: 0, gen: 0, auras: [] as number[], res: { name: 'Mana', label: 'MANA', style: 'mana', mode: 'regen' } as { name: string; label: string; style: string; mode: 'regen' | 'fight' }, attrs: { str: 0, dex: 0, vit: 0, int: 0 }, sp: new Set<string>(), recalc: null as (() => void) | null };
  let heroMoving = false; // informado pelo main (anda/corre)
  let inStrike = false, skill: string | null = null, slamFury = 0, counterBash = false, guardAt = -9, overcharge = false;
  /* árvore kármica: multiplicadores por magia (dano, alcance, área, duração, custo, tier visual) */
  type SScale = { dmg: number; range: number; area: number; dur: number; cost: number; tier: number; rank: number };
  let skillScale: (id: string) => SScale = () => ({ dmg: 1, range: 1, area: 1, dur: 1, cost: 1, tier: 0, rank: 0 }), lastExtra: string | null = null;
  const ssOf = (id: string | null) => skillScale(id ?? lastExtra ?? 'combo');
  /* REGRA IMUTÁVEL — evoluir leva tempo e premia bem: a curva cresce com o quadrado do nível
     (nv 1→2: 111 · nv 10→11: 1.110 · nv 19→20: 3.100; ≈ 24.500 XP do 1 ao 20) */
  const xpNeedAt = (l: number) => Math.round(60 + 45 * l + 6 * l * l);
  const xpNeed = () => xpNeedAt(st.lvl);
  const pending: { at: number; fn: () => void }[] = [];
  const TEMPO = 1.65 * 1.1; /* 28/10: a luta 10% mais lenta */ // mesmo andamento das animações (characters.ts): golpes e magias 40% mais lentos e pesados
  let now = 0;
  const cd = { attack: 0, cast: 0, heal: 0, bash: 0, slam: 0 };
  const CD = { attack: 0.3, cast: 0.75, heal: 1.6, bash: 2.4, slam: 3.2 };
  let comboIdx = -1, lastCombo = -9, lastHurt = -9;
  const fires: { x: number; z: number; t: number }[] = [];
  /* estalactites de gelo (nórdica) e lava vulcânica (anão) ao bater no chão */
  const spikes: { m: THREE.Mesh; t: number; h: number }[] = [];
  const lavas: { m: THREE.Mesh; gl: THREE.Mesh; x: number; z: number; r: number; t: number }[] = [];
  let iceMatC: THREE.MeshToonMaterial | null = null; const iceMatF = () => iceMatC ?? (iceMatC = new THREE.MeshToonMaterial({ color: 0xcfeeff, gradientMap: ramp, emissive: 0x2a5a8a, transparent: true, opacity: 0.9 }));
  const lavaMat = new THREE.MeshBasicMaterial({ color: 0xff6a18, transparent: true, opacity: 0.85, depthWrite: false, fog: false });
  const lavaGlowMat = new THREE.MeshBasicMaterial({ color: 0xffb040, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
  const frosts: { m: THREE.Mesh; x: number; z: number; r: number; t: number }[] = [];
  const frostMat = new THREE.MeshBasicMaterial({ color: 0xbfe8ff, transparent: true, opacity: 0.32, depthWrite: false, fog: false });
  function iceBurst(cx: number, cz: number, gy: number, r: number) {
    // estalactites sobem como setas cortantes (rápidas, altas), do centro para fora
    for (let i = 0; i < 30; i++) { const a = rnd(0, 6.283), rr = rnd(0.3, r), h = rnd(1.2, 3.0) * (1 - rr / (r * 2.6)); const m = new THREE.Mesh(new THREE.ConeGeometry(rnd(0.12, 0.28), h, 5), iceMatF()); m.castShadow = true; m.position.set(cx + Math.cos(a) * rr, gy - h * 0.5, cz + Math.sin(a) * rr); m.rotation.set(rnd(-0.25, 0.25), rnd(0, 3), rnd(-0.25, 0.25)); fxAdd(m); spikes.push({ m, t: -rr * 0.05, h }); }
    // chão congelado (fica uns segundos retardando)
    const fm = new THREE.Mesh(new THREE.CircleGeometry(r, 40).rotateX(-Math.PI / 2), frostMat.clone()); fm.position.set(cx, gy + 0.05, cz); fm.renderOrder = 2; fxAdd(fm); frosts.push({ m: fm, x: cx, z: cz, r, t: 0 });
    // estilhaços de gelo explodindo e cristais caindo do céu sobre a área
    for (let i = 0; i < 90; i++) { const a = rnd(0, 6.283), sp = rnd(2, 9); d.particles.spawn(cx, gy + 0.3, cz, { vx: Math.cos(a) * sp, vy: rnd(1, 7), vz: Math.sin(a) * sp, life: rnd(0.5, 1.3), s0: 0.45, s1: 0.06, c0: 0xffffff, c1: 0x9ad7ff, a: 1, drag: 1.5, g: 7 }); }
    for (let i = 0; i < 70; i++) { const a = rnd(0, 6.283), rr = rnd(0, r * 1.3); d.particles.spawn(cx + Math.cos(a) * rr, gy + rnd(5, 9), cz + Math.sin(a) * rr, { vx: rnd(-0.4, 0.4), vy: rnd(-1, 0), vz: rnd(-0.4, 0.4), life: rnd(1.2, 2.2), s0: 0.22, s1: 0.1, c0: 0xffffff, c1: 0xbfe8ff, a: 1, g: 4 }); }
    for (let i = 0; i < 40; i++) { const a = rnd(0, 6.283), rr = rnd(0, r); d.particles.spawn(cx + Math.cos(a) * rr, gy + 0.1, cz + Math.sin(a) * rr, { vy: rnd(0.3, 1), life: 2, s0: 0.9, s1: 1.8, c0: 0xdff4ff, c1: 0x9ad7ff, a: 0.35, drag: 1 }); }
    impactLight.position.set(cx, gy + 1.5, cz); impactLight.color.setHex(0x9ad7ff); impactK = 1;
  }
  function lavaBurst(cx: number, cz: number, gy: number, r: number) {
    const m = new THREE.Mesh(new THREE.CircleGeometry(r, 36).rotateX(-Math.PI / 2), lavaMat.clone()); m.position.set(cx, gy + 0.06, cz); m.renderOrder = 2; fxAdd(m);
    const gl = new THREE.Mesh(new THREE.CircleGeometry(r * 1.5, 36).rotateX(-Math.PI / 2), lavaGlowMat.clone()); gl.position.set(cx, gy + 0.07, cz); gl.renderOrder = 2; fxAdd(gl);
    lavas.push({ m, gl, x: cx, z: cz, r, t: 0 }); fires.push({ x: cx, z: cz, t: 0 }); fireK = 1;
    for (let i = 0; i < 70; i++) { const a = rnd(0, 6.283), sp = rnd(1, 6); d.particles.spawn(cx, gy + 0.2, cz, { vx: Math.cos(a) * sp, vy: rnd(3, 9), vz: Math.sin(a) * sp, life: rnd(0.6, 1.4), s0: 0.5, s1: 0.1, c0: 0xffe080, c1: 0xff3a00, a: 1, drag: 1, g: 9 }); }
    for (let i = 0; i < 10; i++) { const a = rnd(0, 6.283), rr = rnd(0.5, r); const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(rnd(0.15, 0.3), 0), new THREE.MeshToonMaterial({ color: 0x3a2a24, gradientMap: ramp, emissive: 0x7a2000 })); rock.position.set(cx + Math.cos(a) * rr, gy - 0.3, cz + Math.sin(a) * rr); rock.castShadow = true; fxAdd(rock); rocks.push({ m: rock, t: 0, y0: gy - 0.3 }); }
    impactLight.position.set(cx, gy + 1.5, cz); impactLight.color.setHex(0xff6a18); impactK = 1;
  }
  const fireLight = new THREE.PointLight(0xff6a1a, 0, 14, 2); fxAdd(fireLight);
  let fireK = 0;
  /* ---- rastro da lâmina (vai e volta), flashes e anéis de impacto ---- */
  const TR_N = 20, TR_LIFE = 0.24;
  const trPos = new Float32Array(TR_N * 2 * 3), trCol = new Float32Array(TR_N * 2 * 3);
  const trGeo = new THREE.BufferGeometry();
  trGeo.setAttribute('position', new THREE.BufferAttribute(trPos, 3)); trGeo.setAttribute('color', new THREE.BufferAttribute(trCol, 3));
  const trIdx: number[] = []; for (let i = 0; i < TR_N - 1; i++) { const a = i * 2; trIdx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } trGeo.setIndex(trIdx);
  const trail = new THREE.Mesh(trGeo, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, fog: false }));
  trail.frustumCulled = false; trail.renderOrder = 6; fxAdd(trail);
  const samples: { a: THREE.Vector3; b: THREE.Vector3; t: number }[] = [];
  const lastTip = new THREE.Vector3(), tipNow = new THREE.Vector3(), baseNow = new THREE.Vector3();
  let hitstop = 0;
  const flashes: { s: THREE.Sprite; t: number; dur: number; sc: number }[] = [];
  const rings: { m: THREE.Mesh; t: number }[] = [];
  const flashTex = radialTexture(64, [[0, 'rgba(255,248,220,1)'], [0.25, 'rgba(255,200,120,.7)'], [1, 'rgba(255,140,40,0)']]);
  const impactLight = new THREE.PointLight(0xffb060, 0, 10, 2); fxAdd(impactLight);
  let impactK = 0;
  const ringGeo = new THREE.RingGeometry(0.82, 1, 24); ringGeo.rotateX(-Math.PI / 2);
  function impactFx(p: THREE.Vector3, dir: THREE.Vector3, power = 1, stop = false) {
    // faíscas em leque na direção do golpe
    for (let i = 0; i < Math.round(16 * power); i++) {
      const sp = rnd(3, 9) * power, a = rnd(-0.8, 0.8);
      const vx = dir.x * Math.cos(a) - dir.z * Math.sin(a), vz = dir.x * Math.sin(a) + dir.z * Math.cos(a);
      d.particles.spawn(p.x, p.y, p.z, { vx: vx * sp, vy: rnd(-1, 3.5), vz: vz * sp, life: rnd(0.18, 0.42), s0: 0.16, s1: 0.03, c0: 0xfff2c0, c1: 0xff7a24, a: 1, drag: 2.6 });
    }
    // poeira baixa
    for (let i = 0; i < 4; i++) d.particles.spawn(p.x, 0.15, p.z, { vx: rnd(-1.2, 1.2), vy: rnd(0.2, 0.7), vz: rnd(-1.2, 1.2), life: 0.6, s0: 0.5, s1: 1.4, c0: 0xa89a82, c1: 0x4a4034, a: 0.3, drag: 2 });
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: flashTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    sp.position.copy(p); sp.scale.setScalar(0.1); fxAdd(sp); flashes.push({ s: sp, t: 0, dur: 0.16, sc: 2.6 * power });
    const rm = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xffe2b0, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    rm.position.set(p.x, 0.12, p.z); fxAdd(rm); rings.push({ m: rm, t: 0 });
    impactLight.position.set(p.x, p.y + 0.3, p.z); impactK = 1;
    if (stop) hitstop = Math.max(hitstop, performance.now() + 70 * Math.min(1.4, power)); st.shake = Math.max(st.shake, 0.28 * power);
  }
  const crackTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d')!;
    const grd = g.createRadialGradient(128, 128, 4, 128, 128, 126); grd.addColorStop(0, 'rgba(20,8,4,.95)'); grd.addColorStop(0.7, 'rgba(24,12,8,.7)'); grd.addColorStop(1, 'rgba(24,12,8,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 11; i++) {
      let a = (i / 11) * 6.283 + Math.random() * 0.4, x = 128, y = 128; const len = 70 + Math.random() * 50;
      g.beginPath(); g.moveTo(x, y);
      for (let s = 0; s < 9; s++) { a += (Math.random() - 0.5) * 0.7; x += Math.cos(a) * len / 9; y += Math.sin(a) * len / 9; g.lineTo(x, y); }
      g.strokeStyle = '#ff7a20'; g.lineWidth = 4; g.stroke(); g.strokeStyle = '#ffd890'; g.lineWidth = 1.3; g.stroke();
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const crack = new THREE.Mesh(new THREE.PlaneGeometry(7.5, 7.5), new THREE.MeshBasicMaterial({ map: crackTex, transparent: true, depthWrite: false, opacity: 0, fog: false }));
  crack.rotation.x = -Math.PI / 2; crack.position.y = 0.07; crack.renderOrder = 2; fxAdd(crack);
  let crackT = 9;
  /* marcador no chão da magia (aparece antes de soltar) */
  const teleG = new THREE.Group(); teleG.visible = false; fxAdd(teleG);
  const teleDisc = new THREE.Mesh(new THREE.CircleGeometry(3.4, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xff5a14, transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  const teleRing = new THREE.Mesh(new THREE.RingGeometry(3.2, 3.5, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffb060, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  const teleIn = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.0, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xfff0c0, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  teleG.add(teleDisc, teleRing, teleIn); teleG.position.y = 0.09; teleG.renderOrder = 3;
  let teleT = -1, slamAt: { x: number; z: number } | null = null, rainAt: { x: number; z: number } | null = null;
  const rocks: { m: THREE.Mesh; t: number; y0: number }[] = [];

  /* ---- boneco de treino ---- */
  const dummy = new THREE.Group(); dummy.position.copy(d.dummyPos);
  const ramp = new THREE.DataTexture(new Uint8Array([90, 90, 90, 255, 170, 170, 170, 255, 255, 255, 255, 255]), 3, 1, THREE.RGBAFormat); ramp.minFilter = ramp.magFilter = THREE.NearestFilter; ramp.needsUpdate = true;
  const wood = new THREE.MeshToonMaterial({ color: 0x6a4a2a, gradientMap: ramp }), straw = new THREE.MeshToonMaterial({ map: dummyTexture(), gradientMap: ramp });
  const pivot = new THREE.Group(); dummy.add(pivot);
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 1.7, 7), wood); post.position.y = 0.85; post.castShadow = true; pivot.add(post);
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.0, 6), wood); arm.rotation.z = Math.PI / 2; arm.position.y = 1.35; pivot.add(arm);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.36, 0.8, 12), straw); body.position.y = 1.15; body.castShadow = true; pivot.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), new THREE.MeshToonMaterial({ color: 0xc9a766, gradientMap: ramp })); head.position.y = 1.75; head.castShadow = true; pivot.add(head);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 0.18, 8), new THREE.MeshToonMaterial({ color: 0x6a6a72, gradientMap: ramp })); base.position.y = 0.09; dummy.add(base);
  fxAdd(dummy);
  let wob = 0, wobDir = new THREE.Vector3(1, 0, 0);

  /* ---- inimigos, XP e loot ---- */
  /* jogar junto: main.ts liga estes ganchos à rede (sozinho, não fazem nada) */
  const netHooks = { myId: () => 0, hit: (_id: string, _n: number) => {}, die: (_id: string) => {}, cast: (_id: string, _x: number, _z: number, _i: number) => {} };
  let partyN = () => 1;
  /** PvP: main.ts confere quem (jogador de verdade) está no golpe e manda o dano pela rede */
  let pvpHit: (cx: number, cz: number, yaw: number, reach: number, arc: number, dmg: number, crit: boolean) => void = () => {};
  const pvpDmg = (mul: number) => { const crit = Math.random() < st.crit; return { n: Math.max(1, Math.round((5 + st.lvl * 2.2 + st.attrs.str * 1.2) * st.atk * mul * (crit ? 1.5 : 1) * 0.6)), crit }; }; // entre jogadores o golpe pesa menos que num bicho: a luta dura // quantos do meu grupo estão perto (eu incluso): bônus de XP e de equipamento
  const enemies = createEnemies({ level: () => st.lvl, outMul: () => 1 /* o bônus do evento entra no balde da situação (regra 01) */, sync: { myId: () => netHooks.myId(), hit: (i, n) => netHooks.hit(i, n), die: (i) => netHooks.die(i), cast: (i, x, z, k) => netHooks.cast(i, x, z, k) },
    trail: (x, y, z, col) => { for (let q = 0; q < 2; q++) d.particles.spawn(x + rnd(-0.1, 0.1), y + rnd(-0.1, 0.1), z + rnd(-0.1, 0.1), { vx: rnd(-0.4, 0.4), vy: rnd(0.2, 0.9), vz: rnd(-0.4, 0.4), life: 0.45, s0: 0.32, s1: 0.04, c0: 0xffe0a0, c1: col, a: 0.95, drag: 1.5 }); }, night: () => (window as unknown as { __night?: number }).__night ?? 0,
    scene: d.scene, heightAt: d.world.heightAt, walkable: d.world.walkable, townAt: d.world.townAt, guardNear: d.world.guardNear, spawns: d.world.spawns,
    heroPos: () => d.getHero().root.position, heroAlive: () => !st.dead, heroInvuln: () => { const n = d.getHero().actName; return n === 'dash' || n === 'jet' || (n === 'rush' && d.getHero().actP < 0.7); }, heroGhost: () => { const n = d.getHero().actName; return n === 'dash' || n === 'jet' || n === 'rush' || n === 'charge'; },
    damageHero: (n, from) => api.damage(n, d.getHero().root.position, from),
    spellFx: (x, z, col, r) => { const y = d.world.heightAt(x, z); for (let i = 0; i < 26; i++) { const a = rnd(0, 6.283), rr = rnd(0, r); d.particles.spawn(x + Math.cos(a) * rr, y + 0.2, z + Math.sin(a) * rr, { vx: Math.cos(a) * rnd(0.5, 2), vy: rnd(1.5, 4.5), vz: Math.sin(a) * rnd(0.5, 2), life: 0.7, s0: 0.5, s1: 0.06, c0: 0xffffff, c1: col, a: 1, drag: 1.5 }); } d.audio.boom(); st.shake = Math.max(st.shake, 0.12); },
    onSpell: (e, name) => { dmgText(e.pos.clone().setY(e.pos.y + 2.8), name, false, '#ffb0e0'); d.audio.cast(); },
  });
  const drops: { m: THREE.Object3D; x: number; z: number; y: number; kind: 'gold' | 'potion' | 'item' | 'gear'; n: number; t: number; id?: string; gear?: Gear; label?: HTMLElement; vy?: number }[] = [];
  let onItem: (id: string, n: number) => boolean | void = () => {};
  let onDeath: ((revive: () => void) => void) | null = null;
  let onGear: (g: Gear) => boolean | void = () => {};
  let fullMsgT = 0;
  let onKill: (type: Enemy['type'], e: Enemy) => void = () => {};
  const coinGeo = new THREE.CylinderGeometry(0.17, 0.17, 0.05, 10).rotateX(Math.PI / 2), coinMat = new THREE.MeshBasicMaterial({ color: 0xffd24a });
  const potGeo = new THREE.SphereGeometry(0.16, 8, 6), potMat = new THREE.MeshBasicMaterial({ color: 0xff4a5a });
  function dropAt(x: number, z: number, y: number, kind: 'gold' | 'potion', n: number) {
    const m = new THREE.Mesh(kind === 'gold' ? coinGeo : potGeo, kind === 'gold' ? coinMat : potMat);
    const a = rnd(0, 6.283), r = rnd(0.3, 1.1); const dx = x + Math.cos(a) * r, dz = z + Math.sin(a) * r;
    m.position.set(dx, y + 0.5, dz); fxAdd(m); drops.push({ m, x: dx, z: dz, y, kind, n, t: 0 });
    for (let i = 0; i < 6; i++) d.particles.spawn(dx, y + 0.4, dz, { vx: rnd(-0.6, 0.6), vy: rnd(0.5, 1.6), vz: rnd(-0.6, 0.6), life: 0.6, s0: 0.2, s1: 0.04, c0: kind === 'gold' ? 0xffe27a : 0xff8a9a, c1: 0xff9a20, a: 0.9, drag: 1.5 });
  }
  const logEl = document.getElementById('log') as HTMLElement | null;
  function logMsg(txt: string, col = '#e8dcc0') { txt = G(txt);
    if (!logEl) return; const li = document.createElement('div'); li.textContent = txt; li.style.color = col; logEl.appendChild(li);
    while (logEl.children.length > 7) logEl.removeChild(logEl.firstChild!);
    setTimeout(() => { li.style.opacity = '0'; setTimeout(() => li.remove(), 600); }, 6000);
  }
  function levelBanner(n: number, lines: string[]) {
    const b = document.createElement('div'); b.className = 'lvlup'; b.innerHTML = `<small>NÍVEL ALCANÇADO</small><b>NÍVEL ${n}</b><ul>${lines.map((l) => `<li>${l}</li>`).join('')}</ul>`; document.body.appendChild(b);
    const f = document.createElement('div'); f.className = 'lvflash'; document.body.appendChild(f);
    const f2 = document.createElement('div'); f2.className = 'lvflash w'; document.body.appendChild(f2);
    setTimeout(() => { b.remove(); f.remove(); f2.remove(); }, 3600);
  }
  /* ---- celebração de nível: pilar de luz, onda de choque, luz e uma sequência de fogos de artifício ---- */
  const lvFx: { t: number; dur: number; f: (k: number) => void; end: () => void }[] = [];
  const FWC = [0xffd24a, 0xff6a4a, 0x6ad0ff, 0xc07aff, 0x7aff9a, 0xffffff, 0xff8ad8];
  function fwBurst(cx: number, cy: number, cz: number, col: number, n = 120, sp0 = 6, sp1 = 10) {
    for (let i = 0; i < n; i++) {
      const u = rnd(-1, 1), a = rnd(0, 6.283), r = Math.sqrt(1 - u * u), sp = rnd(sp0, sp1);
      d.particles.spawn(cx, cy, cz, { vx: r * Math.cos(a) * sp, vy: u * sp + 1.2, vz: r * Math.sin(a) * sp, life: rnd(1.4, 2.1), s0: 1.7, s1: 0.1, c0: i % 4 === 0 ? 0xffffff : col, c1: col, a: 1, drag: 1.8, g: 4.5 });
    }
    for (let i = 0; i < 36; i++) { const a = rnd(0, 6.283), sp = rnd(1, 4); d.particles.spawn(cx, cy, cz, { vx: Math.cos(a) * sp, vy: rnd(-1, 2), vz: Math.sin(a) * sp, life: 2.6, s0: 0.7, s1: 0.05, c0: 0xfff2c0, c1: col, a: 0.9, drag: 0.8, g: 2.2, flit: 3 }); }
    d.audio.boom();
  }
  function levelFx(hp: THREE.Vector3) {
    const mat = (c: number) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
    const pil = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.6, 28, 20, 1, true), mat(0xffe9a0)); pil.position.set(hp.x, hp.y + 14, hp.z);
    const pil2 = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.55, 32, 12, 1, true), mat(0xffffff)); pil2.position.set(hp.x, hp.y + 16, hp.z);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.4, 48).rotateX(-Math.PI / 2), mat(0xffd070)); ring.position.set(hp.x, hp.y + 0.14, hp.z);
    const ring2 = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.2, 48).rotateX(-Math.PI / 2), mat(0xffffff)); ring2.position.set(hp.x, hp.y + 0.16, hp.z);
    const lt = new THREE.PointLight(0xffd890, 0, 46, 1.3); lt.position.set(hp.x, hp.y + 3.5, hp.z);
    const objs = [pil, pil2, ring, ring2, lt]; for (const o of objs) fxAdd(o);
    lvFx.push({ t: 0, dur: 3.2, f: (k) => {
      const a = k < 0.08 ? k / 0.08 : Math.max(0, 1 - (k - 0.08) / 0.92), rk = Math.min(1, k * 2.6);
      (pil.material as THREE.MeshBasicMaterial).opacity = 0.55 * a; pil.scale.set(1 + k * 0.7, 1, 1 + k * 0.7);
      (pil2.material as THREE.MeshBasicMaterial).opacity = 0.85 * a;
      ring.scale.setScalar(1 + rk * 11); (ring.material as THREE.MeshBasicMaterial).opacity = 0.95 * (1 - rk);
      ring2.scale.setScalar(1 + rk * 19); (ring2.material as THREE.MeshBasicMaterial).opacity = 0.7 * (1 - rk);
      lt.intensity = 160 * a;
    }, end: () => { for (const o of objs) { d.scene.remove(o); if ((o as THREE.Mesh).geometry) { (o as THREE.Mesh).geometry.dispose(); ((o as THREE.Mesh).material as THREE.Material).dispose(); } } } });
    st.shake = Math.max(st.shake, 0.55); d.audio.chime(); setTimeout(() => d.audio.chime(), 260); setTimeout(() => d.audio.heal(), 520);
    // onda de partículas no chão + chuva de brilho dourado
    for (let i = 0; i < 90; i++) { const a = (i / 90) * 6.283; d.particles.spawn(hp.x, hp.y + 0.2, hp.z, { vx: Math.cos(a) * 11, vy: 0.6, vz: Math.sin(a) * 11, life: 0.9, s0: 1.3, s1: 0.1, c0: 0xffffff, c1: 0xffb040, a: 1, drag: 3 }); }
    for (let i = 0; i < 160; i++) d.particles.spawn(hp.x + rnd(-7, 7), hp.y + rnd(9, 14), hp.z + rnd(-7, 7), { vx: rnd(-0.5, 0.5), vy: rnd(-1, 0), vz: rnd(-0.5, 0.5), life: rnd(1.6, 2.8), s0: 0.8, s1: 0.1, c0: 0xfff0b0, c1: 0xffa020, a: 1, g: 2.5, flit: 2 });
    for (let j = 0; j < 9; j++) pending.push({ at: now + TEMPO * 0.2 + j * 0.27 + rnd(0, 0.12), fn: () => fwBurst(hp.x + rnd(-7, 7), hp.y + rnd(7, 12), hp.z + rnd(-7, 7), FWC[j % FWC.length]) });
    pending.push({ at: now + TEMPO * 2.9, fn: () => { fwBurst(hp.x, hp.y + 10, hp.z, 0xffd24a, 260, 8, 13); fwBurst(hp.x, hp.y + 10, hp.z, 0xffffff, 120, 4, 7); st.shake = Math.max(st.shake, 0.5); } });
  }
  const LOOT: Record<string, [string, number, number, number][]> = {
    /* a safra nova (26/10): cada bicho deixa o que tem — ossos e pó dos mortos, quitina e veneno, couro de urso, engrenagem */
    skull_fire: [['dust', 1, 2, 0.6]], skull_frost: [['dust', 1, 2, 0.6]], skel_arch: [['claw', 1, 1, 0.3]], necro: [['dust', 2, 4, 1], ['tome', 1, 1, 0.3]], lich: [['dust', 4, 8, 1], ['tome', 1, 2, 1]], headless: [['dust', 2, 4, 1], ['potion', 1, 2, 1]],
    spider: [['claw', 1, 2, 0.5]], broodmother: [['claw', 4, 8, 1], ['potion', 2, 3, 1]], scorpion: [['claw', 1, 2, 0.55]], scorpion_king: [['claw', 4, 6, 1]], swampsnake: [['hide', 1, 1, 0.4]], giantsnake: [['hide', 2, 4, 1]],
    bear: [['claw', 1, 2, 0.5]], cavebear: [['claw', 2, 4, 1]], fungus: [['sap', 1, 2, 0.6]], ent: [['wood', 6, 10, 1], ['sap', 2, 4, 1]], fairyqueen: [['dust', 3, 6, 1]], troll: [['claw', 2, 3, 0.8]], harpy: [['claw', 1, 1, 0.4]],
    hellhound: [['claw', 1, 2, 0.5]], imp_bomb: [['claw', 1, 1, 0.4]], glutton: [['claw', 3, 5, 1]], suplicio: [['dust', 4, 6, 1], ['claw', 3, 5, 1]], jotun: [['claw', 3, 5, 1]], drowner: [['claw', 1, 1, 0.35]], drowner_old: [['claw', 2, 4, 1]], mudzombie: [['hide', 1, 1, 0.3]],
    // feras (cervo, javali, lobos, coiote, lobisomem) não soltam couro nem carne: o corpo fica no chão para ser esfolado com a faca de caça
    wolf: [['claw', 1, 1, 0.3]], frostwolf: [['claw', 1, 1, 0.3]],
    zombie: [['hide', 1, 1, 0.3], ['claw', 1, 1, 0.3]], ghoul: [['claw', 1, 2, 0.6]], bishop: [['dust', 4, 8, 1], ['tome', 2, 2, 1]],
    rat: [['claw', 1, 1, 0.2]], fairy: [['dust', 1, 2, 0.85]], treant: [['wood', 3, 5, 1], ['sap', 1, 1, 0.7], ['stick', 2, 4, 1]], puglin: [['claw', 1, 1, 0.35]], imp: [['claw', 1, 2, 0.5]], prince: [['dust', 3, 5, 1], ['sap', 1, 2, 1], ['claw', 2, 3, 1], ['potion', 2, 2, 1]],
  };
  function dropItem(e: Enemy, id: string, n: number) {
    const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.2, 0), new THREE.MeshBasicMaterial({ color: ITEMS[id]?.col ?? 0xffffff }));
    const a = rnd(0, 6.283), r = rnd(0.3, 1.1), dx = e.pos.x + Math.cos(a) * r, dz = e.pos.z + Math.sin(a) * r;
    m.position.set(dx, e.pos.y + 0.5, dz); fxAdd(m); drops.push({ m, x: dx, z: dz, y: e.pos.y, kind: 'item', n, t: 0, id });
  }
  /* ---- nível de classe (caminho): segunda barra abaixo do XP ---- */
  const clsNeed = (l: number) => 90 + 70 * l + 9 * l * l;
  let cls: { name: string; lvl: number; xp: number; past?: { name: string; lvl: number }[] } = { name: 'Humano', lvl: 1, xp: 0, past: [] };
  try { const s0 = JSON.parse(localStorage.getItem('karmika.class.v1') || 'null'); if (s0?.name && typeof s0.lvl === 'number') cls = s0; } catch { /* */ } // antes era s0?.lvl: quem mudava de classe e recarregava antes do 1º nível de classe voltava a Humano
  /** a alma filtra o XP: Dívida Kármica (come uma parte) e o eco da vida passada (multiplica o XP de classe) */
  let xpFilter: ((n: number, c: { name: string; lvl: number }) => { n: number; paid: number; cmul: number }) | null = null;
  function gainXp(n0: number, p: THREE.Vector3) {
    const gross = Math.round(n0 * st.xpMul), f = xpFilter ? xpFilter(gross, cls) : { n: gross, paid: 0, cmul: 1 }, n = f.n;
    st.xp += n; dmgText(p.clone().setY(2.6), `+${n} XP`, false, '#9ad7ff'); logMsg(`+${n} XP${f.paid ? ` · ${f.paid} pagam a Dívida Kármica` : ''}${f.cmul > 1 ? ` · eco da vida passada: classe ×${f.cmul}` : ''}`, '#9ad7ff');
    { // XP de classe: a segunda contagem — o seu caminho (Caminhante, depois a classe da academia) evolui junto, mais devagar
      const c = cls; c.xp += Math.round(gross * 0.45 * f.cmul);
      while (c.xp >= clsNeed(c.lvl)) { c.xp -= clsNeed(c.lvl); c.lvl++; dmgText(p.clone().setY(3.4), `${c.name.toUpperCase()} ${c.lvl}`, true, '#c9a0ff'); logMsg(`✦ Nível de classe ${c.lvl} — ${c.name}`, '#c9a0ff'); d.audio.chime(); classLevelUp(c.name, c.lvl); dispatchEvent(new CustomEvent('karmika:burst', { detail: { c0: 0xe8d0ff, c1: 0x8a4aff, n: 70 } })); }
      try { localStorage.setItem('karmika.class.v1', JSON.stringify(cls)); } catch { /* */ }
    }
    while (st.xp >= xpNeed()) {
      st.xp -= xpNeed(); const hp0 = st.hpMax, mp0 = st.mpMax, [lo0, hi0] = [9 * (1 + 0.08 * (st.lvl - 1)) * st.atk, 15 * (1 + 0.08 * (st.lvl - 1)) * st.atk];
      st.lvl++; st.points += 3; st.recalc?.(); st.hp = st.hpMax; if (st.res.mode !== 'fight') st.mp = st.mpMax; d.audio.levelup();
      const hp = d.getHero().root.position; dmgText(hp.clone().setY(3.0), `NÍVEL ${st.lvl}!`, true, '#ffe08a');
      const dHp = st.hpMax - hp0, dMp = st.mpMax - mp0, dDmg = Math.round((15 + st.dmgFlat) * 0.05);
      void lo0; void hi0;
      levelBanner(st.lvl, [`❤ Vida máxima +${dHp}${st.res.mode === 'regen' ? ` · ✦ ${st.res.name} máxima +${dMp}` : ''}`, `⚔ Dano +${dDmg} por golpe (+5%)`, `★ +3 pontos de atributo — aperte I para distribuir`]);
      logMsg(`★ Nível ${st.lvl}: Vida +${dHp}${st.res.mode === 'regen' ? `, ${st.res.name} +${dMp}` : ''}, Dano +5%, +3 pontos de atributo (I), +1 ponto de magia (K)`, '#ffe08a');
      levelFx(hp);
    }
  }
  /* ---- equipamentos no chão ---- */
  const gearLabels: HTMLElement[] = [];
  function spawnGear(x: number, z: number, y: number, ilvl: number, boost: Partial<Record<Rarity, number>> = {}, n = 1, rarityMin?: Rarity, preset?: Gear[]) {
    if (preset) n = preset.length;
    for (let k = 0; k < n; k++) {
      let g = preset ? preset[k] : genGear(ilvl, rollRarity(boost)); const order: Rarity[] = ['normal', 'magic', 'rare', 'legendary', 'epic', 'unique', 'relic'];
      if (rarityMin && order.indexOf(g.rarity) < order.indexOf(rarityMin)) g = genGear(ilvl, rarityMin, g.slot);
      const R = RARITY[g.rarity], col = parseInt(R.col.slice(1), 16), rich = g.rarity !== 'normal' && g.rarity !== 'magic';
      const grp = new THREE.Group();
      const gem = new THREE.Mesh(new THREE.OctahedronGeometry(g.rarity === 'relic' ? 0.42 : g.rarity === 'unique' ? 0.36 : rich ? 0.28 : 0.2, 0), new THREE.MeshBasicMaterial({ color: col })); gem.scale.y = 1.3; grp.add(gem);
      const halo = new THREE.Mesh(new THREE.RingGeometry(0.35, 0.5, 20).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); halo.position.y = -0.4; grp.add(halo);
      if (g.rarity !== 'normal') { const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.22, g.rarity === 'magic' ? 3 : 7, 8, 1, true), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: g.rarity === 'magic' ? 0.25 : 0.4, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); beam.position.y = g.rarity === 'magic' ? 1.1 : 3; grp.add(beam); }
      const a = rnd(0, 6.283), r = rnd(0.5, 1.4), dx = x + Math.cos(a) * r, dz = z + Math.sin(a) * r;
      grp.position.set(dx, y + 0.6, dz); fxAdd(grp);
      const label = document.createElement('div'); label.className = 'gl'; label.textContent = g.name; label.style.color = R.col; label.style.borderColor = R.col; document.body.appendChild(label); gearLabels.push(label);
      drops.push({ m: grp, x: dx, z: dz, y, kind: 'gear', n: 1, t: 0, gear: g, label });
      for (let i = 0; i < (rich ? 40 : 14); i++) d.particles.spawn(dx, y + 0.5, dz, { vx: rnd(-2.5, 2.5), vy: rnd(1, 5), vz: rnd(-2.5, 2.5), life: 0.8, s0: 0.5, s1: 0.05, c0: 0xffffff, c1: col, a: 1, drag: 1.4, g: 5 });
      if (rich) { d.audio.chime(); st.shake = Math.max(st.shake, 0.2); logMsg(`✦ ${R.name}: ${g.name}!`, R.col); }
    }
  }
  /* elites e chefes não morrem de imediato: caem de joelhos e o jogador decide — poupar ou matar (karma forte) */
  const YIELDERS = new Set(['prince', 'tormentor', 'treant', 'werewolf']); // o Bispo (chefe final da Catedral) não se rende
  let onYield: ((e: Enemy, decide: (kill: boolean) => void) => void) | null = null;
  function killEnemy(e: Enemy, shared = false) {
    const ey = e as Enemy & { yielded?: boolean };
    if (!shared && onYield && YIELDERS.has(e.type) && !ey.yielded) {
      ey.yielded = true; (e as Enemy & { kneel?: boolean }).kneel = true; e.alive = true; e.hp = Math.max(1, Math.round(e.hpMax * 0.02)); e.state = 'hurt'; e.t = -9999; e.vel.set(0, 0);
      dmgText(e.pos.clone().setY(e.pos.y + 3), 'RENDIDO', true, '#ffe08a');
      onYield(e, (kill) => { (e as Enemy & { kneel?: boolean }).kneel = false; if (!e.alive) return; if (kill) { e.alive = false; e.hp = 0; e.state = 'dead'; e.t = 0; killEnemy(e); } else { e.alive = false; e.hp = 0; e.state = 'dead'; e.t = 2.5; e.respawn = 1800; /* poupado: vai embora de verdade (não volta em 4 min como se nada tivesse acontecido) */ for (let i = 0; i < 30; i++) d.particles.spawn(e.pos.x + rnd(-0.6, 0.6), e.pos.y + rnd(0.2, 2), e.pos.z + rnd(-0.6, 0.6), { vx: rnd(-1, 1), vy: rnd(1, 3), vz: rnd(-1, 1), life: 1.2, s0: 0.3, s1: 0.04, c0: 0xffffff, c1: 0xffe08a, a: 0.9, drag: 1 }); } });
      return;
    }
    const pn = Math.max(1, Math.min(6, partyN())), pk = 1 + 0.15 * (pn - 1); // grupo perto: +15% de XP, de ouro e de chance de equipamento por companheiro (o saque de cada um é só dele: cai na máquina de quem o ganhou, e ninguém mais o vê)
    if (shared) { logMsg(`☠ ${e.def.name} derrotado pelo grupo`, '#ff9a8a'); } else {
    if ((e.burn ?? 0) > 0 && st.sp.has('r_surtr')) explode(e.pos.x, e.pos.z, e.pos.y, 2.6, 1.2, 0xff6a1a, 0, e.pos.clone()); // Brasa de Surtr
    if ((e.burn ?? 0) > 0) { st.mp = Math.min(st.mpMax, st.mp + 10); logMsg(`🔥 Brasas: +10 de ${st.res.name}`, '#ffb060'); }
    logMsg(`☠ ${e.def.name} derrotado`, '#ff9a8a'); }
    st.kills++; { // caça dá pouco XP (o que ela dá é equipamento); bicho 5+ níveis abaixo não ensina nada (cinza)
      const dl = (e.def.lvl ?? 1) - st.lvl, f = dl >= 0 ? 1 + 0.12 * Math.min(dl, 5) : Math.max(0, 1 + dl * 0.2);
      const kx = Math.round(e.def.xp * 0.3 * f * pk); if (kx > 0) gainXp(kx, e.pos); } addFury(e.def.passive ? 0.0002 : 0.0006); { const k3 = n3Key(); if (k3 === 'cac') need3.cac = Math.min(1, need3.cac + (e.def.rig === 'zombie' || e.def.rig === 'prince' || e.def.rig === 'bishop' || ['imp', 'skeleton', 'ghoul', 'zombie', 'bat', 'vampire', 'werewolf', 'cultist'].includes(e.type) ? 0.0012 : 0.0003) * (n3Calm > 0 ? 0.4 : 1)); } if (kitKey === 'pal') doubt = Math.min(1, doubt + (e.def.passive ? 0.0002 : e.def.rig === 'human' ? 0.003 : 0.0006) * (graceT > 0 ? 0.4 : 1)); onKill(e.type, e);
    const g = Math.round(rnd(e.def.gold[0], e.def.gold[1]) * 0.45 * pk); for (let i = 0; i < Math.min(4, Math.max(0, Math.ceil(g / 3))); i++) dropAt(e.pos.x, e.pos.z, e.pos.y, 'gold', Math.ceil(g / Math.min(4, Math.ceil(g / 3))));
    if (Math.random() < 0.12) dropAt(e.pos.x, e.pos.z, e.pos.y, 'potion', 30);
    for (const [id, a, b, pr] of LOOT[e.type] ?? []) if (Math.random() < pr) dropItem(e, id, a + Math.floor(Math.random() * (b - a + 1)));
    { // equipamentos: chance cresce com o nível do inimigo; elites sempre soltam e com raridade melhor
      const tier = e.def.lvl ?? 1, elite = e.type === 'prince', ilvl = Math.max(1, Math.round(tier * 1.1 + st.lvl * 0.6));
      const big = elite || isElite(e), an = st.sp.has('u_andvari') ? 1.5 : 1; // únicos e relíquias: quase só de elites e chefes, e só em nível alto (cada um tem nível mínimo)
      const boost: Partial<Record<Rarity, number>> = { magic: 1 + tier * 0.06, rare: (1 + tier * 0.14) * (elite ? 3 : 1) * an, legendary: (1 + tier * 0.3) * (elite ? 5 : 1) * an, epic: (1 + tier * 0.25) * (big ? 6 : 1), unique: (1 + tier * 0.1) * (big ? 10 : 0.6), relic: (1 + tier * 0.1) * (big ? 12 : 0.2) };
      const n = elite ? 2 + (Math.random() < 0.5 ? 1 : 0) : Math.random() < Math.min(0.6, (0.13 + 0.03 * tier) * pk) ? 1 : 0; // o grind é onde caem os equipamentos
      if (pn > 1) for (const k of Object.keys(boost) as Rarity[]) boost[k] = (boost[k] ?? 1) * (1 + 0.1 * (pn - 1)); /* grupo: raridade melhor */
      if (n) spawnGear(e.pos.x, e.pos.z, e.pos.y, ilvl, boost, n, elite ? 'rare' : undefined);
      if (elite && Math.random() < 0.35) dropItem(e, 'tome', 1);
    }
    if (shared) return;
    if (st.sp.has('frenzy')) { st.fury = Math.min(5, st.fury + 2); logMsg('✦ Frenesi: +2 de Fúria', '#ffb060'); }
    hitstop = Math.max(hitstop, performance.now() + 90);
  }
  let echoing = false;
  /* ===== SISTEMA DE DANO (21/10/2026) =====
     1) Os bônus percentuais SOMAM num balde só (nível, Força, buffs, marca, emboscada); só o ranque da magia e o crítico multiplicam.
     2) Casca dura: ARMADURA (% que cresce quando o bicho é mais forte que você) e ABSORÇÃO (pontos tirados de cada golpe).
     3) Tipos de dano: corte, impacto, perfuração, fogo, gelo, sagrado — cada criatura resiste ou sofre com alguns.
     4) Postura: elites e chefes têm uma barra de guarda; enquanto ela está cheia, o dano entra pela metade.
        Golpes pesados, aparos e bloqueios perfeitos a quebram — aí o elite cambaleia e toma dano cheio. */
  type DmgType = 'corte' | 'impacto' | 'perfuracao' | 'fogo' | 'gelo' | 'sagrado';
  const CARAPACE: Partial<Record<string, { arm: number; abs: number; res?: Partial<Record<DmgType, number>> }>> = {
    rat: { arm: 0, abs: 0.3 }, deer: { arm: 0, abs: 0 }, coyote: { arm: 0.02, abs: 0.5 }, fairy: { arm: 0, abs: 0, res: { fogo: 1.3 } },
    puglin: { arm: 0.06, abs: 1, res: { impacto: 1.15 } }, wolf: { arm: 0.04, abs: 1 }, frostwolf: { arm: 0.06, abs: 1.4, res: { gelo: 0.4, fogo: 1.4 } },
    boar: { arm: 0.1, abs: 2, res: { perfuracao: 1.25 } }, imp: { arm: 0.06, abs: 1, res: { fogo: 0.4, sagrado: 1.5 } },
    zombie: { arm: 0.08, abs: 1.5, res: { corte: 0.85, fogo: 1.4, sagrado: 1.5 } }, ghoul: { arm: 0.1, abs: 2, res: { fogo: 1.3, sagrado: 1.5 } },
    skeleton: { arm: 0.14, abs: 3, res: { corte: 0.6, perfuracao: 0.5, impacto: 1.4, sagrado: 1.5 } }, bat: { arm: 0, abs: 0.5, res: { perfuracao: 1.3 } },
    treant: { arm: 0.16, abs: 4, res: { corte: 1.25, fogo: 1.7, perfuracao: 0.6 } }, werewolf: { arm: 0.2, abs: 4, res: { corte: 0.75, impacto: 0.75, perfuracao: 0.75, sagrado: 1.4 } },
    prince: { arm: 0.18, abs: 4, res: { fogo: 0.4, sagrado: 1.6 } }, tormentor: { arm: 0.16, abs: 3.5, res: { sagrado: 1.4 } }, bishop: { arm: 0.22, abs: 5, res: { fogo: 0.6, sagrado: 1.3 } },
  };
  const ELITE_T = new Set(['prince', 'tormentor', 'treant', 'werewolf', 'bishop']);
  const isElite = (e: Enemy) => ELITE_T.has(e.type) || ELITE_TYPES.has(e.type) || !!(e as Enemy & { tag?: string }).tag && (e.hpMax > 1500);
  /** tipo do dano de cada magia (a arma muda o golpe básico: martelo = impacto, lança = perfuração) */
  const dmgTypeOf = (sk: string | null): DmgType => { const k = d.getHero().kind; if (st.sp.has('u_excal') && (sk === 'combo' || sk === null)) return 'sagrado'; if (sk === 'slam') return k === 'dwarf' ? 'fogo' : k === 'technocrat' ? 'fogo' : 'gelo'; if (sk === 'spear' || sk === 'railgun') return 'perfuracao'; if (sk === 'bash' || sk === 'hammerthrow' || sk === 'mountain' || sk === 'kick' || sk === 'shieldwall') return 'impacto'; if (sk === 'winter') return 'gelo'; if (sk === 'mark' || sk === 'smite' || sk === 'consecrate') return 'sagrado'; if (kitKey === 'pal' && (sk === 'combo' || sk === null || sk === 'bash' || sk === 'kick')) return 'sagrado'; if (sk === 'flame' || sk === 'forge') return 'fogo'; if (sk === 'shocktrap') return 'impacto'; return k === 'dwarf' ? 'impacto' : k === 'technocrat' ? 'perfuracao' : 'corte'; };
  /** postura dos elites: enche de novo 8 s depois de quebrada */
  function poiseHit(e: Enemy, amount: number) {
    if (!isElite(e)) return; const ep = e as Enemy & { poise?: number; poiseMax?: number; poiseT?: number };
    if (ep.poiseMax === undefined) { ep.poiseMax = Math.round(e.hpMax * 0.22); ep.poise = ep.poiseMax; }
    if ((ep.poiseT ?? 0) > now) return; ep.poise = Math.max(0, (ep.poise ?? 0) - amount);
    if (ep.poise <= 0) { ep.poiseT = now + 8; e.state = 'hurt'; e.t = -3.2; dmgText(e.pos.clone().setY(e.pos.y + 3), 'GUARDA QUEBRADA!', true, '#ffd24a'); d.audio.parry(); st.shake = Math.max(st.shake, 0.35); for (let i = 0; i < 24; i++) d.particles.spawn(e.pos.x, e.pos.y + 1.6, e.pos.z, { vx: rnd(-4, 4), vy: rnd(1, 4), vz: rnd(-4, 4), life: 0.5, s0: 0.25, s1: 0.03, c0: 0xffffff, c1: 0xffd24a, a: 1, drag: 2 }); setTimeout(() => { ep.poise = ep.poiseMax; }, 8000); }
  }
  const poiseUp = (e: Enemy) => { const ep = e as Enemy & { poise?: number; poiseT?: number }; return isElite(e) && (ep.poiseT ?? 0) <= now && (ep.poise === undefined || ep.poise > 0); };
  /* ---- efeitos dos itens Únicos e das Relíquias ---- */
  let fenrirT = -99, caliceT = -99, draupT = 0, huntN = 0, huntT = -99;
  const DARK_T = new Set(['zombie', 'ghoul', 'skeleton', 'imp', 'bishop', 'prince', 'tormentor', 'bat', 'werewolf']);
  function namedOnHit(e: Enemy, dmg: number, crit: boolean, killed: boolean) {
    if (st.sp.has('u_mjolnir') && Math.random() < 0.25) { let from = e.pos.clone().setY(e.pos.y + 1.2); const hitL = new Set<Enemy>([e]); bolt3d(from.clone().setY(from.y + 12), from, 0xcfe6ff);
      for (let k = 0; k < 3; k++) { const o = enemies.list.find((x) => !hitL.has(x) && x.alive && x.active && Math.hypot(x.pos.x - from.x, x.pos.z - from.z) < 6); if (!o) break; hitL.add(o); const to = o.pos.clone().setY(o.pos.y + 1.1); bolt3d(from, to, 0x9ad0ff); from = to; const dm = Math.round(dmg * 0.5); if (enemies.hurt(o, dm, e.pos, 2)) killEnemy(o); dmgText(to.clone().setY(to.y + 1.2), dm, false, '#9ad0ff'); }
      d.audio.spell('shock'); }
    if (crit && st.sp.has('u_excal')) { st.hp = Math.min(st.hpMax, st.hp + st.hpMax * 0.03); for (let q = 0; q < 8; q++) d.particles.spawn(e.pos.x, e.pos.y + 1.2, e.pos.z, { vx: rnd(-2, 2), vy: rnd(1, 3), vz: rnd(-2, 2), life: 0.5, s0: 0.3, s1: 0.04, c0: 0xffffff, c1: 0xffe9a0, a: 1 }); }
    if (!killed && e.alive && st.sp.has('r_ymir') && dmgTypeOf(skill) === 'gelo') { e.root2 = 1.5; e.state = 'hurt'; e.t = -1.5; }
    if (st.sp.has('r_drac')) st.hp = Math.min(st.hpMax, st.hp + dmg * 0.08); if (st.sp.has('m_void') && skill && skill !== 'combo') st.hp = Math.min(st.hpMax, st.hp + dmg * 0.06);
    if (killed && st.sp.has('r_hunt') && DARK_T.has(e.type)) { huntN = huntT > now ? Math.min(5, huntN + 1) : 1; huntT = now + 12; logMsg(`✝ Relicário: +${huntN * 6}% de dano`, '#ffffff'); }
  }
  /** recursos de luta (Ímpeto etc.): enchem ao dar e receber golpes; itens de Geração aumentam */
  let lastFight = -99;
  function gainRes(n: number) { lastFight = now; if (st.res.mode !== 'fight') return; st.mp = Math.min(st.mpMax, st.mp + n * (1 + st.gen) * (st.sp.has('t_core') || st.sp.has('r_lantern') ? 2 : 1)); }
  function hitEnemy(e: Enemy, mul: number, stop: boolean, from: THREE.Vector3) {
    if (kitKey === 'cac' && DARK_T.has(e.type)) mul *= 1.25; /* caçador: prata em demônio, morto-vivo e fera da noite */
    const spell = !!skill && skill !== 'combo', DARK = DARK_T.has(e.type);
    let crit = Math.random() < st.crit - (n3Key() === 'cac' && need3.cac > 0.5 ? 0.05 : 0) + stance.crit + (spell && st.sp.has('r_lantern') ? 0.15 : 0); if (st.serene > 0 && skill) { crit = true; st.serene--; }
    let bonus = 1;
    if (skill === 'combo') {
      if (st.ambushT > 0) { bonus *= 1.5; st.fury = Math.min(5, st.fury + 1); st.ambushT = 0; dmgText(e.pos.clone().setY(e.pos.y + 2.6), 'EMBOSCADA!', true, '#9ad7ff'); }
      st.fury = Math.min(5, st.fury + 1);
    } else if (skill === 'slam') { bonus *= 1 + 0.3 * slamFury; e.burn = 5; e.burnTick = 0; }
    else if (skill === 'bash' && counterBash) { bonus *= 2.2; st.fury = Math.min(5, st.fury + 2); e.state = 'hurt'; e.t = -1.4; dmgText(e.pos.clone().setY(e.pos.y + 2.6), 'CONTRA-GOLPE!', true, '#ffd24a'); }
    if (st.sp.has('r_livro') && spell) bonus += 0.35; // Livro Sem Passos
    if (st.sp.has('m_staff') && spell) bonus += 0.25; if (st.sp.has('dh_silver') && DARK) bonus += 0.6; if (st.sp.has('w_moon') && st.hp < st.hpMax * 0.5) bonus += 0.3; if (huntT > now) bonus += 0.06 * huntN;
    const marked = (e.mark ?? 0) > now;
    // balde único de bônus: nível (+5%/nível), Força (st.atk já vem com retorno decrescente), buffs, marca e emboscada SOMAM
    // o nível dá +5% por nível ao golpe base e só metade disso ao dano da arma (senão nível × arma × Força explodem no fim do jogo)
    /* REGRA 01 — EQUILÍBRIO (Erling, 25/10): o que vem da situação (postura, dia/noite do caminho, Lua de Sangue/Aurora)
       SOMA num balde só e o balde tem teto: no máximo +30% e no mínimo −30%. Nada disso multiplica com nada; assim,
       no nível 100, ninguém vira indestrutível por estar na noite certa, no evento certo e na postura certa. */
    const sit = Math.max(-0.3, Math.min(0.3, stance.dmg + cmod.dmg + (st.outMul - 1)));
    const lp = 0.05 * (st.lvl - 1), pct = (st.atk - 1) + (buff.dmg - 1) + sit + (marked ? 0.5 : 0) + (bonus - 1);
    let dmg = (rnd(9, 15) * (1 + lp) + st.dmgFlat * (1 + 0.5 * lp)) * mul * (1 + pct) * ssOf(skill).dmg * (crit ? (st.sp.has('r_mimir') ? 2.3 : 1.7) : 1) * (st.god ? 9 : 1);
    { // casca dura: armadura cresce com a diferença de nível; absorção tira pontos de cada golpe; tipo de dano pesa
      const cp = CARAPACE[e.type] ?? { arm: 0.06, abs: 1 }, dlv = (e.def.lvl ?? 1) - st.lvl, el = e.def.lvl ?? 1;
      const arm = Math.max(0, Math.min(0.6, 0.06 + cp.arm + 0.025 * dlv)), absb = cp.abs * (1 + 0.12 * el), ty = dmgTypeOf(skill), rs = cp.res?.[ty] ?? 1;
      dmg = dmg * rs * (1 - arm) - absb;
      if (poiseUp(e)) dmg *= 0.5; // guarda do elite em pé: metade
      poiseHit(e, dmg * (mul > 1.5 || skill === 'slam' || skill === 'bash' ? 2.2 : 1) * (crit ? 1.5 : 1));
      if (rs >= 1.25 && Math.random() < 0.3) dmgText(e.pos.clone().setY(e.pos.y + 2.9), 'FRAQUEZA', false, '#ffb060'); else if (rs <= 0.6 && Math.random() < 0.3) dmgText(e.pos.clone().setY(e.pos.y + 2.9), 'RESISTE', false, '#a8b0c0');
    }
    { const dl = (e.def.lvl ?? 1) - st.lvl; if (dl > 2) { /* acima de você: golpes escorregam e erram */ dmg *= Math.max(0.65, 1 - 0.035 * dl);
        if (Math.random() < Math.min(0.3, 0.03 * (dl - 2))) { dmgText(e.pos.clone().setY(e.pos.y + 2.4), 'ERROU', false, '#a8b0c0'); dmg = 0; } } }
    { const pn = Math.max(1, Math.min(6, partyN())); if (pn > 1 && !e.def.passive) dmg /= 1 + 0.5 * (pn - 1); } /* GRUPO (26/10): bicho que enfrenta um grupo aguenta mais — cada companheiro perto vale +50% de vida (o golpe de cada um entra dividido, e assim fica igual nas duas máquinas) */
    dmg = dmg <= 0 ? 0 : Math.max(1, Math.round(dmg));
    if (marked) st.hp = Math.min(st.hpMax, st.hp + dmg * 0.25);
    if (inStrike && thunderN > 0 && thunderT > 0 && e.alive) thunderProc(e);
    if (buff.burnT > 0 && e.alive) { e.burn = Math.max(e.burn ?? 0, 4); e.burnTick = e.burnTick ?? 0; }
    if (skill === 'combo' && comboIdx === 3 && (e.burn ?? 0) > 0) { // detonação das brasas
      e.burn = 0; st.mp = Math.min(st.mpMax, st.mp + 12); logMsg(`💥 Detonação! +12 de ${st.res.name}`, '#ffb060');
      for (const o of enemies.list) if (o !== e && o.alive && o.active && Math.hypot(o.pos.x - e.pos.x, o.pos.z - e.pos.z) < 3.8) { o.burn = 5; o.burnTick = 0; }
      for (let i = 0; i < 30; i++) { const a = rnd(0, 6.283); d.particles.spawn(e.pos.x, e.pos.y + 1, e.pos.z, { vx: Math.cos(a) * rnd(2, 6), vy: rnd(1, 4), vz: Math.sin(a) * rnd(2, 6), life: 0.6, s0: 0.45, s1: 0.05, c0: 0xffe9a0, c1: 0xff4a10, a: 1, drag: 2, g: 6 }); }
      setTimeout(() => { const k = enemies.hurt(e, 14 + 8 * st.lvl, e.pos, 0); dmgText(e.pos.clone().setY(e.pos.y + 2.2), 14 + 8 * st.lvl, true, '#ffb060'); if (k) killEnemy(e); }, 60);
    }
    /* o inimigo também se defende: bicho ágil esquiva, armado apara, grande/encouraçado bloqueia.
       Quanto mais acima do seu nível, mais ele evita; destreza fura a esquiva, força fura bloqueio e aparo */
    { const AG = new Set(['wolf', 'frostwolf', 'coyote', 'fairy', 'rat', 'deer', 'imp']), AR = new Set(['prince', 'tormentor', 'bishop', 'puglin']), BIG = new Set(['boar', 'treant', 'zombie', 'ghoul']);
      const dl = (e.def.lvl ?? 1) - st.lvl, dex = st.attrs?.dex ?? 0, str = st.attrs?.str ?? 0, ep = e.pos.clone().setY(e.pos.y + 2.4);
      const evade = Math.max(0.02, Math.min(0.3, (AG.has(e.type) ? 0.14 : 0.05) + 0.02 * dl - 0.004 * dex));
      const guardCh = Math.max(0, Math.min(0.28, (AR.has(e.type) ? 0.16 : BIG.has(e.type) ? 0.12 : 0.02) + 0.02 * dl - 0.004 * str));
      if (e.state !== 'hurt' && !crit) {
        const r = Math.random();
        if (r < evade) { dmgText(ep, 'ESQUIVOU', false, '#c8d8f0'); d.audio.swing(); e.vel.set(rnd(-4, 4), rnd(-4, 4)); return; }
        if (r < evade + guardCh) { if (AR.has(e.type)) { dmgText(ep, 'APAROU', false, '#ffe6a0'); d.audio.parry(); st.shake = Math.max(st.shake, 0.12); return; } dmg = Math.round(dmg * 0.4); dmgText(ep, 'DEFENDEU', false, '#d9c08a'); d.audio.block(); } }
    }
    const dir = new THREE.Vector3(e.pos.x - from.x, 0, e.pos.z - from.z).normalize();
    const killed = enemies.hurt(e, dmg, from, (crit ? 7 : 4) * (mul > 1.5 ? 1.5 : 1)); gainRes(skill === 'combo' || skill === null ? 7 : 3); namedOnHit(e, dmg, crit, killed);
    st.hits++; d.audio.slash(crit); onoma(e.pos.clone().setY(e.pos.y + 1.6), crit ? 'crit' : 'hit');
    { const lch = st.leech + buff.leech + stance.leech + (kitKey === 'vam' ? 0.05 : 0); if (lch > 0) st.hp = Math.min(st.hpMax, st.hp + dmg * lch * (1 + stance.heal)); }
    if (st.sp.has('burn') && Math.random() < 0.2 && !killed) { e.burn = 4; e.burnTick = 0; }
    if (st.sp.has('echo') && !echoing && !killed && Math.random() < 0.15) { echoing = true; setTimeout(() => { if (e.alive) { const k2 = enemies.hurt(e, Math.round(dmg * 0.7), from, 2); dmgText(e.pos.clone().setY(e.pos.y + 2.4), Math.round(dmg * 0.7), false, '#c9a0ff'); if (k2) killEnemy(e); } echoing = false; }, 140); }
    if (crit && st.sp.has('storm')) for (const o of enemies.list) if (o !== e && o.alive && o.active && Math.hypot(o.pos.x - e.pos.x, o.pos.z - e.pos.z) < 5) { const dm = Math.round(dmg * 0.5); for (let q = 0; q < 8; q++) d.particles.spawn(o.pos.x + rnd(-0.2, 0.2), o.pos.y + 0.4 + q * 0.3, o.pos.z + rnd(-0.2, 0.2), { life: 0.25, s0: 0.8, s1: 0.2, c0: 0xffffff, c1: 0x6ab0ff, a: 1 }); if (enemies.hurt(o, dm, e.pos, 2)) killEnemy(o); dmgText(o.pos.clone().setY(o.pos.y + 2.2), dm, false, '#9ad0ff'); }
    dmgText(e.pos.clone().setY(e.pos.y + 2.0), dmg, crit);
    impactFx(new THREE.Vector3(e.pos.x, e.pos.y + 1.0, e.pos.z), dir, crit ? 1.5 : 1, stop || crit);
    if (killed) killEnemy(e);
  }
  const ebars: HTMLElement[] = [];
  function updateBars() {
    let n = 0; const r = d.canvas.getBoundingClientRect();
    for (const e of enemies.list) {
      const danger = (e.def.lvl ?? 1) >= st.lvl + 5; // forte demais: caveira sobre a cabeça, mesmo parado — melhor correr
      if (!e.alive || !e.active || (e.root && !e.root.visible) || (e.hp >= e.hpMax && e.state === 'idle' && !(danger && e.pos.distanceTo(d.getHero().root.position) < 28))) continue;
      const v = tmp.set(e.pos.x, e.pos.y + 2.1 * e.def.scale, e.pos.z).project(d.camera as THREE.Camera);
      if (v.z > 1 || Math.abs(v.x) > 1.1 || Math.abs(v.y) > 1.1) continue;
      let el = ebars[n]; if (!el) { el = document.createElement('div'); el.className = 'ebar'; el.innerHTML = '<span></span><i></i><u></u>'; document.body.appendChild(el); ebars[n] = el; }
      el.style.display = 'block'; el.style.left = r.left + (v.x * 0.5 + 0.5) * r.width + 'px'; el.style.top = r.top + (-v.y * 0.5 + 0.5) * r.height + 'px';
      (el.children[1] as HTMLElement).style.width = Math.max(0, e.hp / e.hpMax) * 100 + '%'; { const ep = e as Enemy & { poise?: number; poiseMax?: number; poiseT?: number }, u = el.children[2] as HTMLElement; if (isElite(e)) { const broken = (ep.poiseT ?? 0) > now, k = broken ? 0 : ep.poiseMax ? (ep.poise ?? 0) / ep.poiseMax : 1; u.style.display = 'block'; u.style.width = Math.max(0, k) * 100 + '%'; u.classList.toggle('broken', broken); } else u.style.display = 'none'; } { const dl2 = (e.def.lvl ?? 1) - st.lvl, lc = dl2 >= 5 ? 'r' : dl2 >= 2 ? 'o' : dl2 >= -2 ? 'y' : dl2 >= -5 ? 'g' : 'z'; const key = `${e.def.name}|${e.def.lvl}|${lc}`; if (el.dataset.k !== key) { el.dataset.k = key; (el.children[0] as HTMLElement).innerHTML = `<b class="lv ${lc}">${danger ? '💀 ' : ''}${e.def.lvl}</b> ${e.def.name}`; } } el.classList.toggle('danger', danger);
      n++;
    }
    for (let i = n; i < ebars.length; i++) ebars[i].style.display = 'none';
  }

  /* ---- projéteis de magia ---- */
  const bolts: { p: THREE.Vector3; v: THREE.Vector3; life: number; mul?: number; pulse?: boolean; pierce?: boolean; hit?: Set<Enemy>; rootLast?: number; boomer?: number; col?: number; big?: boolean; m?: THREE.Object3D; sk?: string; ricochet?: number; onHit?: (e: Enemy) => void; /** flecha/virote: voa reto, sem girar */ straight?: boolean; /** some sem explosão (bala, flecha) */ quiet?: boolean; /** explode em área ao acabar */ boom?: { r: number; mul: number; stun?: number; fn?: (x: number, z: number) => void } }[] = [];
  /* magias 6–10 (genéricas): cooldowns, buffs temporários e transformações */
  const cdX: Record<string, number> = {};
  const CDX: Record<string, number> = { kick: 6, hamstring: 7, hatchet: 5, shieldwall: 14, winter: 8, thunder: 12, valkyrie: 10, flame: 6, poison: 9, warcry: 14, spear: 7, whirl: 9, mark: 10, fenrir: 45, hammerthrow: 6, stonerune: 12, forge: 16, mountain: 12, avatar: 45, overcharge: 10, shocktrap: 8, medic: 18, railgun: 9, mech: 50, smite: 7, consecrate: 14, avenging: 50, drain: 8, batswarm: 12, bloodnova: 10, nightform: 50, howl: 16, rend: 6, aegis: 16, shieldthrow: 7, conversion: 16, clot: 11, venomclaw: 7, bite: 6, pounce: 9, packhowl: 40, gunturret: 18, teslatower: 20, mortar: 24, bubble: 16, blink: 6, fireball: 6, chainlight: 8, blizzard: 14, meteor: 20, archon: 50, frostnova: 14, curse: 9, hellhound: 40, demonform: 50, holyflask: 10, volley: 12, huntform: 50 };
  const buff = { dmg: 1, dmgT: 0, def: 0, defT: 0, burnT: 0, move: 1, moveT: 0, leech: 0 };
  /** postura de batalha (posturas.ts): somas fixas enquanto a postura estiver ativa */
  let stance = { dmg: 0, def: 0, heal: 0, regen: 0, move: 0, crit: 0, leech: 0 };
  /** efeitos que duram (solo consagrado, enxame, dreno, asas): roda fn a cada quadro até t acabar */
  let kitKey = '';
  const ticks: { t: number; fn: (dt: number, left: number) => void; end?: () => void }[] = [];
  let form: { id: string; t: number; scale: number } | null = null, overT = 0, medicT = 0, flameT = 0, flameYaw = 0, flameKind: 'fire' | 'poison' = 'fire', flameMul = 0.55, flameReach = 9.5;
  /** arma equipada que muda o ataque básico: arco, besta de repetição, metralhadora, lança-chamas, lança-veneno (23/10) */
  type WMode = 'bow' | 'longbow' | 'xbow' | 'smg' | 'flame' | 'venom';
  let wmode = null as WMode | null;
  const WMODE: [RegExp, WMode][] = [[/Arco Longo/, 'longbow'], [/Arco/, 'bow'], [/Besta de Repetição/, 'xbow'], [/Metralhadora/, 'smg'], [/Lança-Chamas/, 'flame'], [/Lança-Veneno/, 'venom']];
  function mkArrow(col: number) { const g = new THREE.Group(), tm = (c: number) => new THREE.MeshToonMaterial({ color: c, gradientMap: ramp });
    const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.7, 5), tm(0x8a6a40)); sh.rotation.x = Math.PI / 2; g.add(sh);
    const hd = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.09, 4), tm(0xb8c0c8)); hd.rotation.x = Math.PI / 2; hd.position.z = 0.38; g.add(hd);
    for (const a of [0, 2.1, 4.2]) { const f = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.12), new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide })); f.position.set(Math.cos(a) * 0.025, Math.sin(a) * 0.025, -0.3); f.rotation.set(Math.PI / 2, 0, a); g.add(f); }
    g.scale.setScalar(1.4); fxAdd(g); return g; }
  const puddles: { x: number; z: number; r: number; t: number; m: THREE.Mesh }[] = [];
  const zones: { x: number; z: number; r: number; t: number; m: THREE.Mesh }[] = [];
  const pillars: { m: THREE.Mesh; t: number; y0: number }[] = [];
  /* granadas de plasma (tecnocrata) */
  const grenades: { m: THREE.Group; p: THREE.Vector3; v: THREE.Vector3; t: number; dur: number; tx: number; tz: number; r: number; mul: number }[] = [];
  const gMat = new THREE.MeshBasicMaterial({ color: 0x9ff4ff, fog: false }); void gMat;
  function explode(cx: number, cz: number, cy: number, r: number, mul: number, col: number, stun: number, from: THREE.Vector3) {
    d.audio.boom(); st.shake = Math.max(st.shake, 0.45); impactK = 1; impactLight.position.set(cx, cy + 1, cz); impactLight.color.setHex(col);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.8, 1.0, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); ring.position.set(cx, cy + 0.12, cz); fxAdd(ring); rings.push({ m: ring, t: 0 });
    for (let k = 0; k < 46; k++) { const a = rnd(0, 6.283), sp = rnd(2, 7); d.particles.spawn(cx, cy + 0.6, cz, { vx: Math.cos(a) * sp, vy: rnd(0.5, 5), vz: Math.sin(a) * sp, life: rnd(0.4, 0.9), s0: 0.6, s1: 0.06, c0: 0xffffff, c1: col, a: 1, drag: 2.2, g: 5 }); }
    for (let k = 0; k < 14; k++) d.particles.spawn(cx + rnd(-0.3, 0.3), cy + 0.3, cz + rnd(-0.3, 0.3), { vy: rnd(3, 7), life: 0.5, s0: 1.4, s1: 0.2, c0: 0xffffff, c1: col, a: 0.9 });
    for (const e of enemies.list) if (e.alive && e.active && Math.hypot(e.pos.x - cx, e.pos.z - cz) < r + e.def.radius) { skill = 'slam'; hitEnemy(e, mul, true, from); skill = null; if (stun > 0 && e.alive) { e.state = 'hurt'; e.t = -stun; } }
    { const p = pvpDmg(mul); pvpHit(cx, cz, 0, r, Math.PI, p.n, p.crit); }
    const dd = Math.hypot(dummy.position.x - cx, dummy.position.z - cz); if (dd < r) { const crit = Math.random() < 0.15; hitDummy(Math.round(rnd(20, 34) * mul * (crit ? 1.7 : 1)), crit, from, col, true); }
  }
  /* cura ao longo do tempo (nanitos) e golpes de trajeto (jato / investida de ombro) */
  let turretAt: { x: number; z: number } | null = null;
  /** escudada final da Investida de Lâmina (no fim da corrida, ou na hora em que a corrida bate no primeiro inimigo) */
  let rushDone = false, rushHalt = false;
  function rushFinish(h: Hero3D) {
    rushDone = true; const p = h.root.position, yaw = h.root.rotation.y;
          skStrike('bash', h, yaw, 2.0, 3.2, 0.9, true); d.audio.boom(); st.shake = Math.max(st.shake, 0.4); h.blockHit();
          for (let i = 0; i < 18; i++) d.particles.spawn(p.x + Math.sin(yaw) * 1.1, 1.2, p.z + Math.cos(yaw) * 1.1, { vx: Math.sin(yaw) * rnd(2, 6) + rnd(-2, 2), vy: rnd(0, 2.5), vz: Math.cos(yaw) * rnd(2, 6) + rnd(-2, 2), life: 0.4, s0: 0.5, s1: 0.05, c0: 0xffffff, c1: 0xffd24a, a: 1, drag: 2 });
          for (const e of enemies.list) if (e.alive && e.active && Math.hypot(e.pos.x - p.x, e.pos.z - p.z) < 3.2 + e.def.radius) { let ea = Math.atan2(e.pos.x - p.x, e.pos.z - p.z) - yaw; while (ea > Math.PI) ea -= Math.PI * 2; while (ea < -Math.PI) ea += Math.PI * 2; if (Math.abs(ea) < 1.0) { e.state = 'hurt'; e.t = -0.9; e.vel.set(Math.sin(yaw) * 9, Math.cos(yaw) * 9); } }
  }
  let hot = { t: 0, per: 0 }; const pathHit = new Set<Enemy>(); let pathAct: string | null = null;
  /* ---- engenharia do tecnocrata: esfera (laser, busca itens, carrega bombas), minas, chuva de mísseis, torre ---- */
  let droneTask: { kind: 'bomb' | 'rain'; x: number; z: number; t: number; fired: number; sx?: number; sz?: number; ex?: number; ez?: number } | null = null, droneLaserT = 0;
  /* napalm: chão queimando por alguns segundos depois do razante */
  const napalms: { x: number; z: number; r: number; t: number; dur: number; m: THREE.Mesh }[] = [];
  const napalmMat = new THREE.MeshBasicMaterial({ color: 0xff6a20, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
  const mines: { m: THREE.Group; x: number; z: number; t: number; r: number; mul: number }[] = [];
  const missiles: { p: THREE.Vector3; v: THREE.Vector3; tx: number; tz: number; t: number; dur: number; napalm?: boolean }[] = [];
  const turrets: { m: THREE.Group; head: THREE.Object3D; x: number; z: number; t: number; shotT: number; healT: number }[] = [];
  /* engenhocas da Companhia de Latão (festim.ts, 27/10): duram turnos (1 turno = 30 min reais) */
  /* os drones de verdade (27/10): modelos que voam/andam com o herói enquanto a engenhoca dura */
  const gv: { heal: HealDrone | null; bot: ShieldBot | null; dome: Dome | null } = { heal: null, bot: null, dome: null };
  const gvDrop = (k: 'heal' | 'bot' | 'dome') => { const o = gv[k]; if (!o) return; d.scene.remove(o.g); o.g.traverse((q) => { const m = q as THREE.Mesh; if (m.isMesh) m.geometry.dispose(); }); gv[k] = null; };
  /* Sentinela desmontável (27/10, Erling): desmontar guarda a torre na mochila e PARA o tempo; montar de novo continua de onde parou.
     O tempo que sobrou fica guardado por Mk (uma pilha por id), e a torre montada de novo usa o primeiro que achar. */
  const SKEY = 'karmika.sentryLeft.v1';
  const sentryLeftAll = (): Record<string, number[]> => { try { return JSON.parse(localStorage.getItem(SKEY) || '{}'); } catch { return {}; } };
  const sentryLeftPop = (id: string): number | null => { const all = sentryLeftAll(), l = all[id]; if (!l || !l.length) return null; const v = l.shift()!; try { localStorage.setItem(SKEY, JSON.stringify(all)); } catch { /* */ } return v; };
  const sentryLeftPush = (id: string, ms: number) => { const all = sentryLeftAll(); (all[id] ??= []).push(ms); try { localStorage.setItem(SKEY, JSON.stringify(all)); } catch { /* */ } };
  const fmtLeft = (ms: number) => { const m = Math.max(1, Math.round(ms / 60000)); return m >= 60 ? `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min` : `${m} min`; };
  /* as Sentinelas ficam no mundo mesmo fechando o jogo (28/10: protegem a obra enquanto você não está) */
  const SENT_KEY = 'karmika.sentries.v1';
  const saveSentries = () => { try { localStorage.setItem(SENT_KEY, JSON.stringify(gad.sentries.map((q) => ({ id: q.id, x: q.x, z: q.z, until: q.until })))); } catch { /* */ } };
  const loadSentries = () => { try { const L = JSON.parse(localStorage.getItem(SENT_KEY) || '[]') as { id: string; x: number; z: number; until: number }[]; for (const q of L) { if (q.until < Date.now()) continue; const t = tierOf(q.id), tr = mkTurret(q.x, q.z); tr.m.scale.setScalar(1 + t * 0.12); gad.sentries.push({ id: q.id, m: tr.m, head: tr.head, x: q.x, z: q.z, until: q.until, shotT: 1, iv: [1.2, 1, 0.8][t], r: [12, 14, 16][t], k: [0.3, 0.42, 0.55][t] }); } } catch { /* */ } };
  const gad = { heal: 0, healT: 6, healK: 0.02, shock: 0, shockT: 4, shockI: 4, shockR: 7, shockK: 0.35, shield: 0, shieldReady: true, shieldT: 0, shieldCd: 25, sentries: [] as { id: string; m: THREE.Group; head: THREE.Object3D; x: number; z: number; until: number; shotT: number; iv: number; r: number; k: number }[] };
  setTimeout(loadSentries, 0);
  function zap(ax: number, ay: number, az: number, bx: number, by: number, bz: number, col: number) { const n = 9; for (let k = 0; k <= n; k++) { const t = k / n; d.particles.spawn(ax + (bx - ax) * t + rnd(-0.18, 0.18), ay + (by - ay) * t + rnd(-0.18, 0.18), az + (bz - az) * t + rnd(-0.18, 0.18), { life: 0.22, s0: 0.35, s1: 0.05, c0: 0xffffff, c1: col, a: 1 }); } }
  const beams: { m: THREE.Mesh; t: number; life: number }[] = [];
  const beamMat = new THREE.MeshBasicMaterial({ color: 0x8af0ff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  function beam(a: THREE.Vector3, b: THREE.Vector3, col = 0x8af0ff, w = 0.05, life = 0.14) {
    const len = a.distanceTo(b); if (len < 0.05) return;
    const m = new THREE.Mesh(new THREE.CylinderGeometry(w, w * 0.6, len, 5, 1, true), beamMat.clone()); (m.material as THREE.MeshBasicMaterial).color.setHex(col);
    m.position.copy(a).add(b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tmp2.copy(b).sub(a).normalize()); fxAdd(m); beams.push({ m, t: 0, life });
    const core = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.35, w * 0.25, len, 4, 1, true), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); m.add(core);
  }
  function mkTurret(x: number, z: number) {
    const g = new THREE.Group(); const gy = d.world.heightAt(x, z); g.position.set(x, gy, z);
    const tmat = (c: number) => new THREE.MeshToonMaterial({ color: c, gradientMap: ramp });
    for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2 + 0.5; const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.6, 5), tmat(0x3a4552)); leg.position.set(Math.cos(a) * 0.28, 0.28, Math.sin(a) * 0.28); leg.rotation.z = Math.cos(a) * 0.6; leg.rotation.x = -Math.sin(a) * 0.6; leg.castShadow = true; g.add(leg); }
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.5, 8), tmat(0x5c6876)); col.position.y = 0.7; g.add(col);
    for (let i = 0; i < 3; i++) { const bd = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.012, 5, 12), tmat(0xb8903c)); bd.rotation.x = Math.PI / 2; bd.position.y = 0.52 + i * 0.16; g.add(bd); }
    const head = new THREE.Group(); head.position.y = 1.02; g.add(head);
    const hb = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.3), tmat(0x4a5866)); hb.castShadow = true; head.add(hb);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.36, 6), tmat(0x1b2128)); barrel.rotation.x = Math.PI / 2; barrel.position.set(0.08, 0.02, 0.25); head.add(barrel);
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.26, 10), tmat(0xb87333)); tank.rotation.x = Math.PI / 2; tank.position.set(-0.1, 0.06, 0.0); head.add(tank);
    const nozzle = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.1, 8), tmat(0xb8903c)); nozzle.rotation.x = Math.PI / 2; nozzle.position.set(0.08, 0.02, 0.46); head.add(nozzle);
    const pilot = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 5), new THREE.MeshBasicMaterial({ color: 0xffb040 })); pilot.position.set(0.08, 0.02, 0.5); head.add(pilot);
    const gauge = new THREE.Mesh(new THREE.CircleGeometry(0.035, 10), new THREE.MeshBasicMaterial({ color: 0xf0e8d0 })); gauge.position.set(-0.1, 0.2, 0.0); gauge.rotation.x = -Math.PI / 2; head.add(gauge);
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.0, 1.25, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xff7a30, transparent: true, opacity: 0.18, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); ring.position.y = 0.1; g.add(ring);
    fxAdd(g); return { m: g, head };
  }
  function mkMine(x: number, z: number) {
    const g = new THREE.Group(); const gy = d.world.heightAt(x, z); g.position.set(x, gy + 0.06, z);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.1, 10), new THREE.MeshToonMaterial({ color: 0x3a4552, gradientMap: ramp })); body.castShadow = true; g.add(body);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.02, 5, 14), new THREE.MeshToonMaterial({ color: 0xb8903c, gradientMap: ramp })); rim.rotation.x = Math.PI / 2; rim.position.y = 0.05; g.add(rim);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshBasicMaterial({ color: 0x4de3ff })); lamp.position.y = 0.09; g.add(lamp); g.userData.lamp = lamp;
    fxAdd(g); return g;
  }
  const spellLight = new THREE.PointLight(0xffffff, 0, 9, 2); fxAdd(spellLight);
  const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();

  /* onomatopeias de quadrinho (Erling, 25/10): só às vezes, nunca em todo golpe */
  let onoT = 0; const ONO = { hit: ['TÁ!', 'PÁ!', 'TUM!', 'ZÁS!', 'TCHAC!'], crit: ['CRAC!', 'POW!', 'BLAM!', 'KRAAK!'], block: ['TUNC!', 'TOC!', 'BUM!'], parry: ['CLANG!', 'TINC!', 'KLANG!'] } as const;
  function onoma(pos: THREE.Vector3, kind: keyof typeof ONO) { if (now < onoT || Math.random() > (kind === 'crit' ? 0.4 : kind === 'parry' ? 0.45 : 0.16)) return; onoT = now + 2.4; const w = ONO[kind][Math.floor(Math.random() * ONO[kind].length)];
    dmgText(pos.clone().add(new THREE.Vector3(rnd(-0.6, 0.6), 0.9, rnd(-0.6, 0.6))), w, true, kind === 'parry' ? '#cfe6ff' : kind === 'block' ? '#e8d0a0' : kind === 'crit' ? '#ff9a5a' : '#fff0c0'); }
  function dmgText(pos: THREE.Vector3, n: number | string, crit: boolean, color = '#ffe08a') {
    const v = pos.clone().project(d.camera as THREE.Camera); const r = d.canvas.getBoundingClientRect();
    const el = document.createElement('div'); el.className = 'dmg'; el.textContent = String(n) + (crit ? '!' : '');
    el.style.left = r.left + (v.x * 0.5 + 0.5) * r.width + 'px'; el.style.top = r.top + (-v.y * 0.5 + 0.5) * r.height + 'px';
    el.style.color = color; if (crit) el.style.fontSize = '28px';
    document.body.appendChild(el); setTimeout(() => el.remove(), 1000);
  }
  function hitDummy(dmg: number, crit: boolean, from: THREE.Vector3, col = 0xffd27a, stop = false) {
    st.hits++; wob = 1; wobDir.copy(dummy.position).sub(from).setY(0).normalize();
    const p = tmp2.copy(dummy.position).setY(1.4);
    dmgText(p.clone().setY(2.1), dmg, crit);
    for (let i = 0; i < 10; i++) d.particles.spawn(p.x + rnd(-0.2, 0.2), p.y + rnd(-0.3, 0.3), p.z + rnd(-0.2, 0.2), { vx: rnd(-2.5, 2.5), vy: rnd(0.5, 3), vz: rnd(-2.5, 2.5), life: 0.5 + Math.random() * 0.3, s0: 0.22, s1: 0.04, c0: col, c1: 0xff5a10, a: 1, drag: 1.4 });
    for (let i = 0; i < 4; i++) d.particles.spawn(p.x, p.y, p.z, { vx: rnd(-0.8, 0.8), vy: rnd(0.3, 1), vz: rnd(-0.8, 0.8), life: 0.9, s0: 0.5, s1: 1.4, c0: 0xc9a766, c1: 0x6a5a40, a: 0.22, drag: 1.2 });
    d.audio.hit(); st.shake = Math.max(st.shake, crit ? 0.35 : 0.2);
    const dir = tmp.copy(dummy.position).sub(from).setY(0).normalize(); impactFx(p.clone(), dir.clone(), crit ? 1.5 : 1, stop || crit);
  }

  function skStrike(sk: string, h: Hero3D, yaw: number, mul: number, reach: number, arc: number, stop = false) { skill = sk; strike(h, yaw, mul, reach, arc, stop); skill = null; }
  function strike(h: Hero3D, yaw: number, mul: number, reach: number, arc: number, stop = false) {
    inStrike = true; try { strikeIn(h, yaw, mul, reach, arc, stop); } finally { inStrike = false; }
  }
  function strikeIn(h: Hero3D, yaw: number, mul: number, reach: number, arc: number, stop = false) {
    const hp = h.root.position;
    const to = tmp.copy(dummy.position).sub(hp).setY(0); const dist = to.length();
    const ang = Math.atan2(to.x, to.z); let da = ang - yaw; while (da > Math.PI) da -= Math.PI * 2; while (da < -Math.PI) da += Math.PI * 2;
    if (dist < reach && Math.abs(da) < arc) { const crit = Math.random() < 0.12; hitDummy(Math.round(rnd(9, 15) * mul * (crit ? 1.8 : 1)), crit, hp.clone(), 0xffd27a, stop); }
    for (const e of enemies.list) {
      if (!e.alive || !e.active) continue;
      const tx = e.pos.x - hp.x, tz = e.pos.z - hp.z, dd = Math.hypot(tx, tz);
      if (dd > reach + e.def.radius) continue;
      let ea = Math.atan2(tx, tz) - yaw; while (ea > Math.PI) ea -= Math.PI * 2; while (ea < -Math.PI) ea += Math.PI * 2;
      if (dd > 1.3 && Math.abs(ea) > arc + 0.3) continue;
      hitEnemy(e, mul, stop, hp.clone());
    }
    { const p = pvpDmg(mul); pvpHit(hp.x, hp.z, yaw, reach, arc, p.n, p.crit); }
    const tip = h.weaponTip(tmp2.set(0, 0, 0));
    for (let i = 0; i < 4; i++) d.particles.spawn(tip.x, tip.y, tip.z, { vx: rnd(-0.4, 0.4), vy: rnd(-0.2, 0.4), vz: rnd(-0.4, 0.4), life: 0.22, s0: 0.2, s1: 0.04, c0: 0xdfe6f2, c1: 0x8a94a8, a: 0.55, drag: 3 });
  }

  /** evolução visual: a cada tier a magia solta um anel de faíscas maior ao ser lançada */
  function tierBurst(x: number, z: number, tier: number) {
    if (tier <= 0) return; const col = [0, 0xb08a40, 0xd9a24f, 0xffd24a, 0xfff0bd][tier], y = d.world.heightAt(x, z);
    for (let i = 0; i < 10 * tier; i++) { const a = rnd(0, 6.283), r = 0.6 + tier * 0.3; d.particles.spawn(x + Math.cos(a) * r, y + 0.2, z + Math.sin(a) * r, { vx: Math.cos(a) * tier, vy: rnd(1, 2 + tier), vz: Math.sin(a) * tier, life: 0.6 + tier * 0.15, s0: 0.25 + tier * 0.08, s1: 0.03, c0: 0xffffff, c1: col, a: 1 }); }
  }
  function napalmAt(x: number, z: number, gy: number) {
    const r = 2.3 * skillScale('bash').area, m = new THREE.Mesh(new THREE.CircleGeometry(r, 24).rotateX(-Math.PI / 2), napalmMat.clone()); m.position.set(x, gy + 0.06, z); m.renderOrder = 2; fxAdd(m);
    napalms.push({ x, z, r, t: 0, dur: 6 * skillScale('bash').dur, m }); fires.push({ x, z, t: 0 }); fireK = 1;
  }
  function slotFlash(k: string) { const s = document.querySelector(`.slot[data-id="${k}"]`); if (!s) return; s.classList.add('on'); setTimeout(() => s.classList.remove('on'), 160); }


  /* ---- Guerreira Nórdica, faixa 1–20: Chute de Escudo, Corte nos Tendões, Machadinha, Parede de Escudos, Sopro do Inverno, Lâmina Trovejante, Contra-golpe da Valquíria ---- */
  let thunderN = 0, thunderT = 0, thunderTier = 0, valkT = 0, valkTier = 0;
  const walls: { g: THREE.Group; x: number; z: number; yaw: number; w: number; t: number; dur: number; tier: number }[] = [];
  const breaths: { x: number; z: number; yaw: number; r: number; t: number; dur: number; tier: number; hit: Set<Enemy>; mul: number }[] = [];
  const glowM = (c: number, o = 0.8) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, side: THREE.DoubleSide });
  /** acerta todos num arco à frente de (cx,cz); fx roda só em quem levou dano de verdade (esquiva e aparo não contam) */
  /* =====================================================================================================
     25/10 (noite) — Erling: "Paladino precisa de escudo mágico de defesa, lançamento de escudo, martelo da conversão; vampiro
     coagulação tardia, garras envenenadas, golpes rápidos de duelo; lobisomem sem arma: garras, mordidas, uivos de buff e saltos;
     tecnocrata: torre metralhadora, torre tesla, morteiro e a esfera que voa ao lado, ilumina o escuro, pega itens e ajuda no trabalho."
     ===================================================================================================== */
  const convertedL: { e: Enemy; until: number }[] = [];
  let skyNight = 0, skyShade = false, sunK = 0, sunVeilT = 0, sunMsgT = -99, nightOn: boolean | null = null, baseScale = 1; const cmod = { dmg: 0, move: 1 };
  let techLook: { gauntlet(out: THREE.Vector3): THREE.Vector3; setMech(on: boolean): void; charge(k: number): void } | null = null, medicDrone: THREE.Group | null = null, medicBeamT = 0;
  /* a esfera do tecnocrata formado: OU ataca OU defende (Erling, 25/10). Na guarda ela voa para a frente e projeta o
     escudo de favos; na Bolha de Escudos ela sobe acima da cabeça e mantém seis escudos transparentes girando em volta */
  let bubbleT = 0, droneShield: THREE.Mesh | null = null;
  /* a esfera segue a POSTURA do tecnocrata (Erling, 25/10):
     - Artilharia (ataque): ela ataca, busca itens e ajuda no combate;
     - Engenharia de Campo (auxílio de grupo): não ataca; joga gás curativo em quem estiver perto, leva as torres até a marca e pega itens;
     - Blindagem (defesa): não ataca; fica colada em você, joga gás curativo em você e, sempre que está à toa, refaz uma casca de escudo em volta */
  let droneMode: 'atk' | 'grp' | 'def' = 'atk', gasT = 2, shellCd = 0;
  const droneDefends = () => kitKey === 'tecno' && (d.getHero().guard || bubbleT > 0 || droneMode !== 'atk');
  /* O REATOR PESSOAL do tecnocrata (Erling, 25/10): a Energia vem do reator nas costas, e o reator gasta. Quem é tecnocrata precisa
     ganhar dinheiro para manter o seu núcleo: um Núcleo custa caro e dura bem (Mk I 8 turnos de jogo; Mk II, da segunda classe, 20 turnos).
     Vazio: a Energia não volta, a esfera apaga e as magias da Academia não saem. Abaixo de 15%: a Energia volta pela metade. */
  const REACT_KEY = 'karmika.reactor.v1'; let reactor: { charge: number; tier: number } = { charge: 1, tier: 1 }; try { const r0 = JSON.parse(localStorage.getItem(REACT_KEY) || 'null'); if (r0 && typeof r0.charge === 'number') reactor = r0; } catch { /* */ }
  let reactSaveT = 0, reactWarn = 0; const REACT_MIN: Record<number, number> = { 1: 8 * 30, 2: 20 * 30 }; /* Mk I: 8 turnos (4 h); Mk II: 20 turnos (10 h) */
  /* A FOME DA FERA (Erling, 25/10): o lobisomem sente falta de carne de gente (humano, anão de carne dura, elfo de carne magra), o vampiro de sangue de gente.
     A fome sobe com o tempo de jogo. Carne de bicho e Sangue Diluído enganam por um tempo, mas cada vez menos: o "piso" sobe
     desde a última refeição de verdade, e o que é de bicho não desce a fome abaixo dele. Com fome alta a fera fica lenta e fraca.
     Comer gente (NPC humano/anão/elfo ou jogador) zera tudo, mas pesa muito no karma. O caminho do bem existe e custa caro e humilha:
     o lobisomem compra a Charcutaria Secular dos vampiros; o vampiro compra a Injeção Automática dos tecnocratas, feita com a Sangria dos anões.
     EQUILÍBRIO (regra 01): o castigo entra no mesmo balde capado (cmod); sem fome nenhuma não há bônus extra além dos que já existiam. */
  const CRAVE_KEY = 'karmika.crave.v1'; let crave = { v: 0.2, real: 0 }; try { const c0 = JSON.parse(localStorage.getItem(CRAVE_KEY) || 'null'); if (c0 && typeof c0.v === 'number') crave = c0; } catch { /* */ }
  let craveSaveT = 0, craveMsgT = 0, craveStage = 0, feastT = 0; const TURN_S = 30 * 60; /* 1 turno de Karmika = 30 min reais de jogo */ const CRAVE_FULL = 20 * TURN_S; /* 20 turnos de jogo (10 h) até a fome total; o castigo começa nos 60% (12 turnos) */
  const craveFloor = () => Math.min(0.78, crave.real / (16 * TURN_S) * 0.78); /* 16 turnos sem comer gente: bicho já não sacia */
  const saveCrave = () => { try { localStorage.setItem(CRAVE_KEY, JSON.stringify(crave)); } catch { /* */ } };
  function feed(kind: 'animal' | 'human' | 'preserved'): void {
    const isV = kitKey === 'vam'; if (kitKey !== 'vam' && kitKey !== 'lob') return;
    if (kind === 'animal') { const fl = craveFloor(), before = crave.v; crave.v = Math.max(fl, crave.v - 0.14); if (before - crave.v < 0.02) logMsg(isV ? '🩸 O sangue de bicho já não desce: o corpo pede sangue de gente.' : '🥩 Carne de bicho já não enche: a fera quer carne de gente.', '#ff8a7a'); else logMsg(isV ? `🩸 Sangue de bicho: a sede cede um pouco (${Math.round(crave.v * 100)}%).` : `🥩 A fome cede um pouco (${Math.round(crave.v * 100)}%).`, '#e0b0a0'); }
    else { crave.v = 0; crave.real = 0; feastT = kind === 'preserved' ? 600 : 300; logMsg(kind === 'preserved' ? (isV ? '💉 A Injeção corre na veia: sangue de verdade, sem vítima. A sede some.' : '🍖 Carne humana curada por séculos: a fera se acalma e fica forte. Sem vítima, mas comprada de vampiro.') : (isV ? '🩸 Você bebeu de gente. A sede some... e a alma escurece.' : '🍖 A fera comeu carne de gente. A fome some... e a alma escurece.'), kind === 'preserved' ? '#b0e0ff' : '#ff5a5a'); d.audio.heal(); }
    craveStage = 0; saveCrave();
  }
  /* A FÚRIA DO GUERREIRO (Erling, 25/10): o guerreiro do Norte tende à loucura e ao frenesi. Cada abate e cada hora de luta enchem a Fúria.
     Acima de 50% é frenesi (+5% de dano, mas apanha 6% mais: o escudo baixa). Acima de 80% é a beira da loucura: as escolhas boas das
     missões de karma escapam dele e a alma escurece devagar. Só os rituais de calmaria, com o Kit de Incensos de Mortificação dos magos
     e dos bruxos, devolvem a paz: condolências a Odin e o corpo mortificado. */
  const FURY_KEY = 'karmika.fury.v1'; let fury = 0.1; try { const f0 = +(localStorage.getItem(FURY_KEY) ?? '0.1'); if (isFinite(f0)) fury = f0; } catch { /* */ }
  let warrior = false, furySaveT = 0, furyStage = 0, furyMsgT = 0, calmT = 0;
  const addFury = (x: number) => { if (!warrior) return; fury = Math.max(0, Math.min(1, fury + x * (calmT > 0 ? 0.4 : 1))); };
  /* A DÚVIDA DO PALADINO (Erling, 25/10): tanto sangue derramado em nome da Luz, contra entidades, demônios e gente, e o paladino começa a
     sentir que a sua guerra pela paz derrama mais sangue que os próprios malditos. A Dúvida é a fraqueza dele: acima de 50% a Luz responde
     menos (−6% de dano e de cura); acima de 80% a fé vacila, as escolhas boas não pesam e o karma escorre. De tempos em tempos ele precisa do
     JEJUM E ORAÇÃO: o Pão Ázimo dos cozinheiros humanos (com o Trigo sem Fermento dos tecnocratas) e o Vinho Santo dos anões (com a Gota de
     Lágrima Santa dos elfos). */
  const DOUBT_KEY = 'karmika.doubt.v1'; let doubt = 0.1; try { const d0 = +(localStorage.getItem(DOUBT_KEY) ?? '0.1'); if (isFinite(d0)) doubt = d0; } catch { /* */ }
  let doubtSaveT = 0, doubtStage = 0, doubtMsgT = 0, graceT = 0;
  /* AS TRÊS ÚLTIMAS FRAQUEZAS (Erling pediu que eu decidisse, 25/10). Mesmo ritmo das outras: 30 turnos só de tempo, ~20 para quem usa muito.
     MAGO — Ressonância Arcana: cada magia deixa um eco na cabeça. >50%: a magia volta 30% mais devagar e o dano cai 4%. >80%: SOBERBA, o mago
       olha de cima para os simples (as boas escolhas não pesam) e a magia às vezes racha na mão dele (4% da vida). Remédio: o Ritual do Aterramento,
       com o Unguento da Terra dos lobisomens (o chão e o instinto que o mago esqueceu) e a Água Benta dos paladinos.
     BRUXO — Dívida do Pacto: cada magia é emprestada de Malgrath, e ele cobra juros. >50%: o patrono segura 10% da vida. >80%: as boas escolhas não
       pesam e, de tempos em tempos, um Cobrador do Pacto aparece para levar o que é dele. Remédio: a Oferenda do Pacto, com o Coração de Demônio que
       só os caçadores sabem arrancar e o Chifre de Sangue que só os guerreiros do Norte enchem.
     CAÇADOR — Vigília: o olho de Aravel nunca fecha, e o caçador não dorme. Cada demônio e cada morto caçado somam. >50%: visão turva (−5% de crítico,
       −4% de dano). >80%: PARANOIA, ele vê demônio em todo rosto (confiar não pesa no karma). Remédio: o Sono Guardado, com o Pó do Sono Sem Sonhos dos
       bruxos (a quem ele caça) e o Sino de Guarda dos tecnocratas, que toca se algo chegar enquanto ele dorme. */
  const NEED3_KEY = 'karmika.need3.v1'; let need3: Record<string, number> = { mag: 0.1, bru: 0.1, cac: 0.1 }; try { const n0 = JSON.parse(localStorage.getItem(NEED3_KEY) || 'null'); if (n0) need3 = { ...need3, ...n0 }; } catch { /* */ }
  let n3SaveT = 0, n3Stage = 0, n3MsgT = 0, n3Calm = 0, n3Cast = -9, cobradorT = 0;
  const n3Key = (): 'mag' | 'bru' | 'cac' | null => cls.name === 'Mago' ? 'mag' : cls.name === 'Bruxo' ? 'bru' : cls.name === 'Caçador de Demônios' ? 'cac' : null;
  const N3_TXT = { mag: ['🔮 A Ressonância Arcana ecoa: a magia volta mais devagar.', '🔮 Soberba: o eco das magias sobe à cabeça e você olha de cima para os simples. As boas escolhas não pesam e a magia pode rachar na sua mão. Faça o Ritual do Aterramento (Unguento da Terra + Água Benta).'],
    bru: ['🜏 A Dívida do Pacto cresce: Malgrath segura uma parte da sua vida.', '🜏 Malgrath cobra: as boas escolhas não pesam e o Cobrador do Pacto vem buscar o que é dele. Faça a Oferenda do Pacto (Coração de Demônio + Chifre de Sangue).'],
    cac: ['👁 A Vigília pesa: a vista turva de tanto não dormir.', '👁 Paranoia: você vê demônio em todo rosto, e confiar já não pesa na alma. Faça o Sono Guardado (Pó do Sono Sem Sonhos + Sino de Guarda).'] } as const;
  let blinkCol = 0x9ad0ff;
  let droneGoT = 0; const droneGo = new THREE.Vector3(); let lobHid = false;
  let heroDark = 0, workAt: { x: number; z: number } | null = null, lastHeroP = new THREE.Vector3(), heroMps = 0;
  /** tira de luz curva (rasgo de garra, corte de duelo): some em ~0,25 s */
  const streakTex = (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 8; const g = c.getContext('2d')!; const gr = g.createLinearGradient(0, 0, 64, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.25, 'rgba(255,255,255,.9)'); gr.addColorStop(0.75, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 8); const t = new THREE.CanvasTexture(c); return t; })();
  function streak(cx: number, cy: number, cz: number, yaw: number, side: number, col: number, opt: { r?: number; n?: number; tilt?: number; life?: number; w?: number; span?: number } = {}) {
    const n = opt.n ?? 3, R = opt.r ?? 1.25, tilt = opt.tilt ?? 0.55, life = opt.life ?? 0.26, W = opt.w ?? 0.07, span = opt.span ?? 1.5;
    for (let k = 0; k < n; k++) {
      const pos: number[] = [], uv: number[] = [], idx: number[] = [], S = 14, off = (k - (n - 1) / 2) * 0.13;
      for (let i = 0; i <= S; i++) { const u = i / S, a = yaw + side * (span / 2 - u * span), r = R + off * 0.6, y = cy + off + side * tilt * (0.5 - u) * 1.4, w = W * Math.sin(Math.PI * u) + 0.004;
        const x = cx + Math.sin(a) * r, z = cz + Math.cos(a) * r; pos.push(x, y + w, z, x, y - w, z); uv.push(u, 1, u, 0); if (i < S) { const b = i * 2; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); } }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
      const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: col, map: streakTex, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false })); fxAdd(m);
      const core = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0xffffff, map: streakTex, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false })); core.scale.setScalar(1); m.add(core);
      ticks.push({ t: life, fn: (_dt, left) => { const k2 = left / life; (m.material as THREE.MeshBasicMaterial).opacity = k2; (core.material as THREE.MeshBasicMaterial).opacity = k2 * k2 * 0.8; }, end: () => { d.scene.remove(m); g.dispose(); } });
    }
  }
  /** rasgo de garra (ou de lâmina fina) à frente do herói */
  function clawFx(side: number, col: number, n = 3, low = false) { const h = d.getHero(), p = h.root.position, y = h.root.rotation.y; streak(p.x, p.y + (low ? 0.7 : 1.15), p.z, y, side, col, { n, r: 1.3 }); }
  const bleed = (e: Enemy, ticksN: number, per: number, col = '#ff6a6a') => { for (let q = 1; q <= ticksN; q++) pending.push({ at: now + q * 1.0, fn: () => { if (!e.alive) return; const dm = Math.round(per); if (enemies.hurt(e, dm, e.pos, 0)) killEnemy(e); dmgText(e.pos.clone().setY(e.pos.y + 2.0), dm, false, col); for (let k = 0; k < 6; k++) d.particles.spawn(e.pos.x + rnd(-0.2, 0.2), e.pos.y + 1, e.pos.z + rnd(-0.2, 0.2), { vx: rnd(-1, 1), vy: rnd(-0.5, 1.5), vz: rnd(-1, 1), life: 0.55, s0: 0.13, s1: 0.04, c0: 0xc0101a, c1: 0x4a0006, a: 1, g: 9 }); } }); };

  /* ---- Égide de Auréon: cúpula de luz com favos que bebe os golpes ---- */
  let aegis: { hp: number; max: number; m: THREE.Object3D; u: { t: { value: number }; hit: { value: number }; op: { value: number } }; tier: number } | null = null;
  const hexMap = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d')!; g.fillStyle = '#000'; g.fillRect(0, 0, 128, 128); g.strokeStyle = '#fff'; g.lineWidth = 2.2; const r = 12;
    for (let y = -1; y < 8; y++) for (let x = -1; x < 7; x++) { const cx = x * r * 1.732 + (y % 2 ? r * 0.866 : 0), cy = y * r * 1.5; g.beginPath(); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + Math.PI / 6; g[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * r, cy + Math.sin(a) * r); } g.closePath(); g.stroke(); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; })();
  function mkAegis() {
    const u = { t: { value: 0 }, hit: { value: 0 }, op: { value: 0 }, map: { value: hexMap }, col: { value: new THREE.Color(0xffd86a) } };
    const mat = new THREE.ShaderMaterial({ uniforms: u, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      vertexShader: 'varying vec3 vN; varying vec3 vV; varying vec2 vU; varying float vY; void main(){ vU = uv; vY = position.y; vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'uniform float t; uniform float hit; uniform float op; uniform sampler2D map; uniform vec3 col; varying vec3 vN; varying vec3 vV; varying vec2 vU; varying float vY; void main(){ float f = pow(1.0 - abs(dot(vN, vV)), 2.4); float hx = texture2D(map, vU * vec2(7.0, 3.5) + vec2(0.0, -t * 0.06)).r; float band = smoothstep(0.0, 0.08, fract(vU.y * 2.0 - t * 0.35)) * (1.0 - smoothstep(0.08, 0.3, fract(vU.y * 2.0 - t * 0.35))); float base = smoothstep(-0.05, 0.25, vY); float a = (0.015 + f * 0.65 + hx * (0.035 + f * 0.45) + band * f * 0.25 + hit * (0.2 + hx * 0.5)) * op * (0.35 + 0.65 * base); gl_FragColor = vec4(col * (0.7 + f * 0.6 + hit * 0.9) + vec3(hit * 0.3), a); }' });
    const m = new THREE.Mesh(new THREE.SphereGeometry(1.45, 40, 24, 0, Math.PI * 2, 0, Math.PI * 0.62), mat); m.scale.set(1, 1.25, 1); m.renderOrder = 5; fxAdd(m);
    return { m, u };
  }
  function aegisBreak() { if (!aegis) return; const a = aegis; aegis = null; const p = d.getHero().root.position; d.audio.boom(); st.shake = Math.max(st.shake, 0.35);
    for (let i = 0; i < 70; i++) { const th = rnd(0, 6.283), ph = rnd(0.1, 1.5); d.particles.spawn(p.x + Math.cos(th) * Math.sin(ph) * 1.4, p.y + 0.3 + Math.cos(ph) * 1.6, p.z + Math.sin(th) * Math.sin(ph) * 1.4, { vx: Math.cos(th) * rnd(2, 6), vy: rnd(0, 3), vz: Math.sin(th) * rnd(2, 6), life: 0.6, s0: 0.25, s1: 0.03, c0: 0xffffff, c1: 0xffc84a, a: 1, drag: 2 }); }
    hitArc('aegis', p.x, p.z, 0, 3, Math.PI, 0.9, true, (e) => { e.state = 'hurt'; e.t = -1.2; dmgText(e.pos.clone().setY(e.pos.y + 2.6), 'ATORDOADO', false, '#ffe08a'); });
    ticks.push({ t: 0.35, fn: (_dt, left) => { a.u.op.value = left / 0.35; a.m.scale.setScalar(1 + (0.35 - left) * 1.6); a.u.hit.value = 1; }, end: () => d.scene.remove(a.m) }); }

  /* ---- Lobisomem: a fera de pé (werewolf3d) na Forma da Besta ---- */
  let beast: Beast | null = null, beastOn = false; const beastHid = new Map<THREE.Object3D, boolean>(); let beastSide = 1, beastLastAct: string | null = null;
  function beastShow(on: boolean) { const h = d.getHero(); if (on === beastOn) return; beastOn = on;
    if (on) { if (!beast) beast = buildBeast({ fur: 0x4a3c32 }); if (beast.root.parent !== h.root) h.root.add(beast.root); beastHid.clear(); for (const c of h.root.children) if (c !== beast.root) { beastHid.set(c, c.visible); c.visible = false; } beast.root.visible = true;
      const p = h.root.position; for (let i = 0; i < 50; i++) d.particles.spawn(p.x + rnd(-0.6, 0.6), p.y + rnd(0.2, 2.2), p.z + rnd(-0.6, 0.6), { vx: rnd(-2, 2), vy: rnd(0, 2), vz: rnd(-2, 2), life: 0.8, s0: 0.5, s1: 0.1, c0: 0x6a5a4a, c1: 0x1a1410, a: 0.8, drag: 2 }); }
    else { if (beast) beast.root.visible = false; for (const [c, v] of beastHid) c.visible = v; beastHid.clear(); } }

  /* ---- Lobos espirituais do Uivo da Matilha ---- */
  function spiritWolf(i: number, dur: number, dmgK: number, hell = false) {
    const sm = new THREE.MeshToonMaterial({ color: hell ? 0x140a12 : 0x5a8ae8, emissive: hell ? 0x3a0c06 : 0x1a48c0, emissiveIntensity: 0.9, gradientMap: ramp }); const q = buildWolf({ mat: sm, eye: hell ? 0xff6a1a : undefined });
    const g = new THREE.Group(); g.add(q.root); g.scale.setScalar(0.01); const h = d.getHero(), hp0 = h.root.position, a0 = h.root.rotation.y + (i ? 2.2 : -2.2);
    const pos = new THREE.Vector3(hp0.x + Math.sin(a0) * 2.2, 0, hp0.z + Math.cos(a0) * 2.2); g.position.copy(pos); fxAdd(g); let yaw = h.root.rotation.y, biteT = 0, t = 0;
    for (let k = 0; k < 30; k++) d.particles.spawn(pos.x + rnd(-0.6, 0.6), rnd(0.1, 1.2), pos.z + rnd(-0.6, 0.6), { vy: rnd(0.3, 1.2), life: 1, s0: 0.6, s1: 1.4, c0: hell ? 0x3a1020 : 0xdde8ff, c1: hell ? 0xff5a1a : 0x4a6aa0, a: 0.4, drag: 1 });
    ticks.push({ t: dur, fn: (dt2, left) => { t += dt2; biteT -= dt2; g.scale.setScalar(1.2 * Math.max(0.01, Math.min(1, t * 2.5, left * 2))); sm.emissiveIntensity = 0.8 + 0.3 * Math.sin(t * 6);
      const hh = d.getHero().root.position; const e = enemies.nearest(hh, 14); let tx: number, tz: number, sp = 0;
      if (e) { tx = e.pos.x; tz = e.pos.z; } else { const side = i ? 1 : -1, hy = d.getHero().root.rotation.y; tx = hh.x + Math.sin(hy + side * 2.4) * 1.8; tz = hh.z + Math.cos(hy + side * 2.4) * 1.8; }
      const dx = tx - pos.x, dz = tz - pos.z, dd = Math.hypot(dx, dz), reach = e ? 1.3 + e.def.radius : 0.4;
      if (dd > reach) { sp = Math.min(dd * 3, e ? 8 : 7); pos.x += dx / dd * sp * dt2; pos.z += dz / dd * sp * dt2; }
      const want = Math.atan2(dx, dz); let dy = want - yaw; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2; yaw += dy * Math.min(1, dt2 * 9);
      pos.y = d.world.heightAt(pos.x, pos.z); g.position.copy(pos); g.rotation.y = yaw; q.pose({ dt: dt2, mv: sp, wind: 0, strike: Math.max(0, biteT - 0.55) / 0.3, hurt: 0, alert: !!e, idle: !e && sp < 0.3 });
      if (e && dd <= reach + 0.2 && biteT <= 0) { biteT = 0.85; const dm = Math.round((6 + st.lvl * 2.2) * dmgK); if (enemies.hurt(e, dm, pos, 1)) killEnemy(e); dmgText(e.pos.clone().setY(e.pos.y + 2.2), dm, false, hell ? '#ff9a5a' : '#9ac8ff'); d.audio.hit();
        for (let k = 0; k < 8; k++) d.particles.spawn(e.pos.x, e.pos.y + 0.8, e.pos.z, { vx: rnd(-2, 2), vy: rnd(0, 2), vz: rnd(-2, 2), life: 0.35, s0: 0.25, s1: 0.03, c0: 0xffffff, c1: 0x6a9aff, a: 1, drag: 2 }); }
      if (Math.random() < dt2 * 14) d.particles.spawn(pos.x + rnd(-0.4, 0.4), pos.y + rnd(0.3, 1.0), pos.z + rnd(-0.4, 0.4), { vy: rnd(0.2, 0.8), life: 0.7, s0: 0.25, s1: 0.5, c0: hell ? 0xff8a3a : 0xcfe0ff, c1: hell ? 0x2a0a10 : 0x2a4a8a, a: hell ? 0.6 : 0.35 }); },
      end: () => { for (let k = 0; k < 24; k++) d.particles.spawn(pos.x + rnd(-0.5, 0.5), pos.y + rnd(0.2, 1.1), pos.z + rnd(-0.5, 0.5), { vy: rnd(0.5, 1.5), life: 0.9, s0: 0.5, s1: 1.2, c0: 0xdde8ff, c1: 0x2a4a8a, a: 0.4 }); d.scene.remove(g); } });
  }

  /* ---- Tecnocrata formado: a esfera que voa ao lado (a mesma lógica da esfera do tecnocrata nato: pega itens, dispara laser, ajuda no trabalho) ---- */
  let sideDrone: { g: THREE.Group; droneTo: THREE.Vector3 | null; droneFlash: number; dronePos(out: THREE.Vector3): THREE.Vector3; ring: THREE.Object3D; ring2: THREE.Object3D; eye: THREE.Mesh; glow: THREE.Sprite; vel: THREE.Vector3 } | null = null;
  function mkSideDrone() {
    const g = new THREE.Group(), tm = (c: number, e = 0) => new THREE.MeshToonMaterial({ color: c, gradientMap: ramp, emissive: e });
    const shell = new THREE.Mesh(new THREE.SphereGeometry(0.15, 18, 12), tm(0x4a5866)); shell.castShadow = true; g.add(shell);
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.152, 0.022, 8, 28), tm(0xc9a050)); band.rotation.x = Math.PI / 2; g.add(band);
    for (let i = 0; i < 8; i++) { const rv = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 4), tm(0xe8d090)); const a = i / 8 * Math.PI * 2; rv.position.set(Math.cos(a) * 0.172, 0, Math.sin(a) * 0.172); g.add(rv); }
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.08, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), tm(0xb87333)); cap.position.y = 0.11; g.add(cap);
    const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.008, 0.14, 5), tm(0x2a2e36)); ant.position.set(0.03, 0.24, 0); g.add(ant); const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.016, 6, 5), new THREE.MeshBasicMaterial({ color: 0xffb060 })); bulb.position.set(0.03, 0.31, 0); g.add(bulb);
    const lensR = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.014, 6, 18), tm(0xc9a050)); lensR.position.z = 0.14; g.add(lensR);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8), new THREE.MeshBasicMaterial({ color: 0x8af0ff })); eye.position.z = 0.135; eye.scale.z = 0.6; g.add(eye);
    const ring = new THREE.Group(); g.add(ring); const rm = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.012, 6, 40), new THREE.MeshBasicMaterial({ color: 0x6ae0ff, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false })); rm.rotation.x = Math.PI / 2; ring.add(rm);
    const ring2 = new THREE.Group(); g.add(ring2); for (let i = 0; i < 3; i++) { const fin = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), tm(0x5c6876)); fin.scale.set(1.6, 0.35, 0.8); const a = i / 3 * Math.PI * 2; fin.position.set(Math.cos(a) * 0.22, -0.02, Math.sin(a) * 0.22); fin.rotation.y = -a; ring2.add(fin); }
    for (const s of [-1, 1]) { const jet = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.08, 8), new THREE.MeshBasicMaterial({ color: 0x8af0ff, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false })); jet.rotation.x = Math.PI; jet.position.set(s * 0.07, -0.17, -0.02); g.add(jet); }
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTexture(64, [[0, 'rgba(140,235,255,.8)'], [1, 'rgba(60,200,255,0)']]), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.5, fog: false })); glow.scale.set(0.9, 0.9, 1); g.add(glow);
    fxAdd(g); g.userData.dyn = true;
    return { g, droneTo: null as THREE.Vector3 | null, droneFlash: 0, dronePos(out: THREE.Vector3) { return out.copy(g.position); }, ring, ring2, eye, glow, vel: new THREE.Vector3() };
  }
  /** gás curativo da esfera: nuvem verde-clara que cura quem estiver dentro */
  function healGas(x: number, z: number, from: THREE.Vector3, per: number) { const gy = d.world.heightAt(x, z); beam(from, new THREE.Vector3(x, gy + 0.6, z), 0x9affd0, 0.03, 0.25);
    for (let i = 0; i < 26; i++) { const a = rnd(0, 6.283), r = rnd(0, 1.3); d.particles.spawn(x + Math.cos(a) * r, gy + rnd(0.2, 1.4), z + Math.sin(a) * r, { vx: Math.cos(a) * 0.4, vy: rnd(0.1, 0.5), vz: Math.sin(a) * 0.4, life: rnd(1.0, 1.6), s0: 0.5, s1: 1.3, c0: 0xd8ffe8, c1: 0x4ad08a, a: 0.35, drag: 1.2 }); }
    const hh = d.getHero().root.position; if (Math.hypot(hh.x - x, hh.z - z) < 1.8) { const v = Math.round(st.hpMax * per * (1 + stance.heal)); st.hp = Math.min(st.hpMax, st.hp + v); dmgText(hh.clone().setY(hh.y + 2.5), `+${v}`, false, '#7affd0'); } }
  /** a luz da esfera: acende no escuro (noite, masmorra, cripta) */
  const droneLight = new THREE.PointLight(0xbfefff, 0, 6, 1.6); d.scene.add(droneLight);
  /* à noite a esfera olha junto com você: um facho de luz para onde o herói está olhando */
  const droneSpot = new THREE.SpotLight(0xd8f4ff, 0, 16, 0.55, 0.45, 1.3); d.scene.add(droneSpot); d.scene.add(droneSpot.target);

  /* ---- Torres do tecnocrata formado: metralhadora, tesla e morteiro (uma de cada no chão) ---- */
  const towers: Record<string, { end: () => void } | undefined> = {};
  const shells: { p: THREE.Vector3; v: THREE.Vector3; t: number; dur: number; tx: number; tz: number; m: THREE.Object3D; mul: number }[] = [];
  function mkTower(kind: 'gun' | 'tesla' | 'mortar', x: number, z: number) {
    const g = new THREE.Group(), gy = d.world.heightAt(x, z); g.position.set(x, gy, z); const tm = (c: number, e = 0) => new THREE.MeshToonMaterial({ color: c, gradientMap: ramp, emissive: e });
    const M = (geo: THREE.BufferGeometry, c: number, e = 0) => { const m = new THREE.Mesh(geo, tm(c, e)); m.castShadow = true; return m; };
    const head = new THREE.Group(); let muzzle = new THREE.Object3D(), coil: THREE.Object3D | null = null, orb: THREE.Mesh | null = null, tube: THREE.Object3D | null = null;
    if (kind !== 'tesla') { // tripé de latão com pés de garra
      for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2 + 0.4; const leg = M(new THREE.CylinderGeometry(0.028, 0.036, 0.78, 7), 0x3a4552); leg.position.set(Math.cos(a) * 0.3, 0.33, Math.sin(a) * 0.3); leg.rotation.set(-Math.sin(a) * 0.62, 0, Math.cos(a) * 0.62); g.add(leg); const ft = M(new THREE.SphereGeometry(0.05, 8, 6), 0xb8903c); ft.scale.y = 0.5; ft.position.set(Math.cos(a) * 0.52, 0.02, Math.sin(a) * 0.52); g.add(ft); }
      const hub = M(new THREE.CylinderGeometry(0.1, 0.12, 0.16, 12), 0xb8903c); hub.position.y = 0.66; g.add(hub);
    }
    if (kind === 'gun') {
      head.position.y = 0.82; g.add(head);
      const body = M(new THREE.CylinderGeometry(0.13, 0.13, 0.36, 14), 0x4a5866); body.rotation.x = Math.PI / 2; head.add(body);
      for (const zz of [-0.12, 0.12]) { const bd = M(new THREE.TorusGeometry(0.135, 0.014, 6, 18), 0xc9a050); bd.position.z = zz; head.add(bd); }
      const drum = M(new THREE.CylinderGeometry(0.11, 0.11, 0.09, 16), 0x2a3038); drum.rotation.z = Math.PI / 2; drum.position.set(-0.17, 0.04, -0.02); head.add(drum);
      const dcap = M(new THREE.CylinderGeometry(0.06, 0.06, 0.1, 12), 0xc9a050); dcap.rotation.z = Math.PI / 2; dcap.position.copy(drum.position); head.add(dcap);
      const bar = new THREE.Group(); bar.position.set(0, 0, 0.18); head.add(bar);
      for (const sx of [-0.045, 0.045]) { const b = M(new THREE.CylinderGeometry(0.024, 0.028, 0.5, 8), 0x1b2128); b.rotation.x = Math.PI / 2; b.position.set(sx, 0, 0.25); bar.add(b); for (let k = 0; k < 4; k++) { const fn = M(new THREE.TorusGeometry(0.032, 0.008, 5, 12), 0x5c6876); fn.position.set(sx, 0, 0.08 + k * 0.07); bar.add(fn); } }
      muzzle.position.set(0, 0, 0.72); head.add(muzzle);
      const scope = M(new THREE.CylinderGeometry(0.025, 0.025, 0.2, 8), 0xb87333); scope.rotation.x = Math.PI / 2; scope.position.set(0, 0.15, 0.02); head.add(scope); const lens = new THREE.Mesh(new THREE.CircleGeometry(0.022, 10), new THREE.MeshBasicMaterial({ color: 0xff5a4a })); lens.position.set(0, 0.15, 0.121); head.add(lens);
      const shieldP = M(new THREE.SphereGeometry(0.26, 16, 8, -0.9, 1.8, 0.9, 1.2), 0x5c6876); shieldP.position.set(0, 0.0, 0.1); shieldP.scale.set(1, 1, 0.35); head.add(shieldP);
    } else if (kind === 'tesla') {
      const base = M(new THREE.CylinderGeometry(0.42, 0.5, 0.18, 8), 0x3a4552); base.position.y = 0.09; g.add(base);
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; const bolt = M(new THREE.SphereGeometry(0.03, 6, 4), 0xc9a050); bolt.position.set(Math.cos(a) * 0.44, 0.18, Math.sin(a) * 0.44); g.add(bolt); }
      const col = M(new THREE.CylinderGeometry(0.09, 0.14, 1.1, 10), 0x4a5866); col.position.y = 0.72; g.add(col);
      coil = new THREE.Group(); g.add(coil); for (let i = 0; i < 9; i++) { const ring = M(new THREE.TorusGeometry(0.17 - i * 0.006, 0.026, 7, 20), 0xc06a30, 0x2a0e04); ring.rotation.x = Math.PI / 2; ring.position.y = 0.4 + i * 0.09; coil.add(ring); }
      for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2; const fin = M(new THREE.BoxGeometry(0.03, 0.9, 0.16), 0x2a3038); fin.position.set(Math.cos(a) * 0.2, 0.7, Math.sin(a) * 0.2); fin.rotation.y = -a; g.add(fin); }
      const crown = M(new THREE.TorusGeometry(0.22, 0.03, 8, 24), 0xc9a050); crown.rotation.x = Math.PI / 2; crown.position.y = 1.32; g.add(crown);
      orb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 18, 12), new THREE.MeshBasicMaterial({ color: 0x9af4ff })); orb.position.y = 1.5; g.add(orb);
      const og = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTexture(64, [[0, 'rgba(180,245,255,.9)'], [1, 'rgba(60,180,255,0)']]), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); og.scale.set(1.6, 1.6, 1); orb.add(og);
      muzzle.position.y = 1.5; g.add(muzzle);
    } else {
      head.position.y = 0.7; g.add(head);
      const plate = M(new THREE.CylinderGeometry(0.4, 0.46, 0.07, 14), 0x3a4552); plate.position.y = -0.66; head.add(plate);
      tube = new THREE.Group(); head.add(tube);
      const t1 = M(new THREE.CylinderGeometry(0.11, 0.13, 0.95, 14), 0x2a3038); t1.position.y = 0.4; tube.add(t1);
      for (const yy of [0.1, 0.5, 0.82]) { const bd = M(new THREE.TorusGeometry(0.125, 0.018, 6, 18), 0xc9a050); bd.rotation.x = Math.PI / 2; bd.position.y = yy; tube.add(bd); }
      const lip = M(new THREE.TorusGeometry(0.115, 0.03, 8, 18), 0x1b2128); lip.rotation.x = Math.PI / 2; lip.position.y = 0.88; tube.add(lip);
      muzzle.position.y = 0.9; tube.add(muzzle);
      for (const s of [-1, 1]) { const bp = M(new THREE.CylinderGeometry(0.02, 0.025, 0.62, 6), 0x5c6876); bp.position.set(s * 0.16, -0.32, 0.22); bp.rotation.set(0.35, 0, s * 0.25); head.add(bp); }
      const wheel = M(new THREE.TorusGeometry(0.07, 0.014, 6, 14), 0xb87333); wheel.position.set(0.16, -0.05, 0.0); wheel.rotation.y = Math.PI / 2; head.add(wheel);
      for (let i = 0; i < 4; i++) { const sh = M(new THREE.CylinderGeometry(0.045, 0.045, 0.16, 10), 0x6a5a40); sh.position.set(-0.3 + i * 0.07, -0.58, -0.26); g.add(sh); }
    }
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.62, 0.7, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x6ae0ff, transparent: true, opacity: 0.3, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); ring.position.y = 0.04; g.add(ring);
    g.scale.set(1, 0.01, 1); fxAdd(g); g.userData.dyn = true; return { g, head, muzzle, coil, orb, tube };
  }
  function placeTower(kind: 'gun' | 'tesla' | 'mortar', x: number, z: number, sc: { dmg: number; dur: number; tier: number }) {
    towers[kind]?.end(); const T0 = mkTower(kind, x, z), dur = (kind === 'gun' ? 16 : kind === 'tesla' ? 14 : 15) * sc.dur; let fireT = 0.6, t = 0, alive = true, burst = 0, burstT = 0, target: Enemy | null = null;
    const gy = d.world.heightAt(x, z); d.audio.block(); for (let i = 0; i < 26; i++) { const a = rnd(0, 6.283); d.particles.spawn(x + Math.cos(a) * 0.5, gy + 0.1, z + Math.sin(a) * 0.5, { vx: Math.cos(a) * rnd(1, 3), vy: rnd(0.5, 2), vz: Math.sin(a) * rnd(1, 3), life: 0.7, s0: 0.35, s1: 0.8, c0: 0xc9b088, c1: 0x6a5a40, a: 0.35, drag: 2 }); }
    const tk = { t: dur, fn: (dt2: number, left: number) => { if (!alive) return; t += dt2; fireT -= dt2; const g = T0.g; g.scale.y = Math.min(1, 0.01 + t * 2.6) * (left < 0.4 ? left / 0.4 : 1);
        const tp = new THREE.Vector3(x, 0, z), range = kind === 'gun' ? 14 : kind === 'tesla' ? 9 : 26; if (!target || !target.alive || Math.hypot(target.pos.x - x, target.pos.z - z) > range + 1) target = enemies.nearest(tp, range);
        if (kind === 'mortar' && target && Math.hypot(target.pos.x - x, target.pos.z - z) < 6) { target = enemies.list.find((e) => e.alive && e.active && !e.def.passive && Math.hypot(e.pos.x - x, e.pos.z - z) >= 6 && Math.hypot(e.pos.x - x, e.pos.z - z) <= 26) ?? null; }
        if (kind !== 'tesla' && T0.head) { const want = target ? Math.atan2(target.pos.x - x, target.pos.z - z) : T0.head.rotation.y + dt2 * 0.6; let dy = want - T0.head.rotation.y; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2; T0.head.rotation.y += dy * Math.min(1, dt2 * 7); }
        if (kind === 'tesla') { if (T0.coil) T0.coil.rotation.y += dt2 * 2; if (T0.orb) T0.orb.scale.setScalar(1 + Math.sin(t * 13) * 0.06 + (fireT > 1.0 ? 0.25 : 0)); if (Math.random() < dt2 * 9) { const o = T0.muzzle.getWorldPosition(new THREE.Vector3()); const a2 = rnd(0, 6.283); bolt3d(o, o.clone().add(new THREE.Vector3(Math.cos(a2) * rnd(0.4, 0.9), rnd(-0.6, 0.2), Math.sin(a2) * rnd(0.4, 0.9))), 0xbff4ff); } }
        if (kind === 'mortar' && T0.tube) T0.tube.rotation.x = THREE.MathUtils.lerp(T0.tube.rotation.x, target ? 0.55 - Math.min(0.35, Math.hypot(target.pos.x - x, target.pos.z - z) / 70) : 0.3, Math.min(1, dt2 * 4)) - (fireT > 1.5 ? 0.0 : 0);
        if (kind === 'gun') { // rajadas de 5 balas, cano gira, cápsulas saltam
          if (target && fireT <= 0 && burst === 0) { burst = 5; burstT = 0; fireT = 1.15; }
          if (burst > 0) { burstT -= dt2; if (burstT <= 0 && target) { burst--; burstT = 0.075; const from = T0.muzzle.getWorldPosition(new THREE.Vector3()), to = target.pos.clone().setY(target.pos.y + 1.0), dir = to.sub(from).normalize(); dir.x += rnd(-0.03, 0.03); dir.z += rnd(-0.03, 0.03); dir.normalize();
              bolts.push({ p: from.clone(), v: dir.clone().multiplyScalar(50), life: 0.34, mul: 0.32 * sc.dmg, pulse: true, quiet: true, col: 0xffd080, sk: 'gunturret' }); beam(from, from.clone().addScaledVector(dir, 1.3), 0xffe0a0, 0.025, 0.05); d.audio.hit();
              for (let k = 0; k < 4; k++) d.particles.spawn(from.x, from.y, from.z, { vx: dir.x * rnd(2, 7) + rnd(-1, 1), vy: rnd(-0.3, 1), vz: dir.z * rnd(2, 7) + rnd(-1, 1), life: 0.16, s0: 0.45, s1: 0.04, c0: 0xfff0c0, c1: 0xff8a20, a: 1, drag: 3 });
              const hp2 = T0.head.getWorldPosition(new THREE.Vector3()); d.particles.spawn(hp2.x, hp2.y, hp2.z, { vx: rnd(-1.5, 1.5), vy: 2.4, vz: rnd(-1.5, 1.5), life: 0.5, s0: 0.08, s1: 0.07, c0: 0xd8b060, c1: 0xb8903c, a: 1, g: 12 }); } else if (!target) burst = 0; } }
        if (kind === 'tesla' && target && fireT <= 0) { fireT = 1.2; const o = T0.muzzle.getWorldPosition(new THREE.Vector3()); let from = o; const hit = new Set<Enemy>(); let cur: Enemy | null = target; d.audio.spell('shock'); spellLight.position.copy(o); spellLight.color.setHex(0xbff4ff); spellLight.intensity = 40;
          for (let j = 0; j < 4 + (sc.tier >= 2 ? 1 : 0) && cur; j++) { hit.add(cur); const tp2 = cur.pos.clone().setY(cur.pos.y + 1.1); bolt3d(from, tp2, 0xcff6ff); bolt3d(from, tp2, 0x6ad0ff); const dm = Math.round((7 + st.lvl * 2.4) * sc.dmg * (1 - j * 0.12)); const ee = cur; if (enemies.hurt(ee, dm, o, 0)) killEnemy(ee); ee.slow = Math.max(ee.slow ?? 0, 1.5); dmgText(tp2.clone().setY(tp2.y + 1.2), dm, false, '#9ad0ff');
            for (let k = 0; k < 10; k++) d.particles.spawn(tp2.x, tp2.y, tp2.z, { vx: rnd(-3, 3), vy: rnd(0, 3), vz: rnd(-3, 3), life: 0.3, s0: 0.25, s1: 0.03, c0: 0xffffff, c1: 0x6ab0ff, a: 1, drag: 2 });
            from = tp2; let best: Enemy | null = null, bd = 6; for (const o2 of enemies.list) if (o2.alive && o2.active && !hit.has(o2)) { const dd = Math.hypot(o2.pos.x - ee.pos.x, o2.pos.z - ee.pos.z); if (dd < bd) { bd = dd; best = o2; } } cur = best; } }
        if (kind === 'mortar' && target && fireT <= 0) { fireT = 1.8; const from = T0.muzzle.getWorldPosition(new THREE.Vector3()), tx2 = target.pos.x + target.vel.x * 0.6 + rnd(-0.6, 0.6), tz2 = target.pos.z + target.vel.y * 0.6 + rnd(-0.6, 0.6), gy2 = d.world.heightAt(tx2, tz2), dur2 = 1.25, G = 18;
          const v = new THREE.Vector3((tx2 - from.x) / dur2, (gy2 - from.y) / dur2 + 0.5 * G * dur2, (tz2 - from.z) / dur2);
          const sm = new THREE.Group(); const ball = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), new THREE.MeshToonMaterial({ color: 0x2a2e36, gradientMap: ramp })); ball.scale.y = 1.4; sm.add(ball); const fin = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.14, 4), new THREE.MeshToonMaterial({ color: 0xc9a050, gradientMap: ramp })); fin.position.y = -0.18; fin.rotation.x = Math.PI; sm.add(fin); sm.position.copy(from); fxAdd(sm);
          shells.push({ p: from.clone(), v, t: 0, dur: dur2, tx: tx2, tz: tz2, m: sm, mul: 1.5 * sc.dmg }); d.audio.boom(); st.shake = Math.max(st.shake, 0.12);
          if (T0.tube) T0.tube.position.y = -0.08; for (let k = 0; k < 16; k++) d.particles.spawn(from.x, from.y, from.z, { vx: v.x * 0.05 + rnd(-1, 1), vy: rnd(1, 3), vz: v.z * 0.05 + rnd(-1, 1), life: rnd(0.6, 1.2), s0: 0.4, s1: 1.4, c0: 0xdddddd, c1: 0x555555, a: 0.45, drag: 1.2 });
          for (let k = 0; k < 8; k++) d.particles.spawn(from.x, from.y, from.z, { vx: rnd(-1, 1), vy: rnd(2, 4), vz: rnd(-1, 1), life: 0.18, s0: 0.6, s1: 0.1, c0: 0xffffff, c1: 0xffa040, a: 1 }); }
        if (kind === 'mortar' && T0.tube) T0.tube.position.y += (0 - T0.tube.position.y) * Math.min(1, dt2 * 6);
      }, end: () => { alive = false; const p = T0.g.position; for (let k = 0; k < 16; k++) d.particles.spawn(p.x + rnd(-0.4, 0.4), p.y + 0.5, p.z + rnd(-0.4, 0.4), { vx: rnd(-1, 1), vy: rnd(0.5, 2), vz: rnd(-1, 1), life: 0.6, s0: 0.3, s1: 0.05, c0: 0xaaaaaa, c1: 0x444444, a: 0.7 }); d.scene.remove(T0.g); if (towers[kind] === handle) towers[kind] = undefined; } };
    const handle = { end: () => { tk.t = 0; } }; towers[kind] = handle; ticks.push(tk);
  }
  function hitArc(sk: string, cx: number, cz: number, yaw: number, reach: number, arc: number, mul: number, stop: boolean, fx?: (e: Enemy) => void) {
    const from = new THREE.Vector3(cx, 0, cz); let n = 0; skill = sk;
    for (const e of enemies.list) {
      if (!e.alive || !e.active) continue; const tx = e.pos.x - cx, tz = e.pos.z - cz, dd = Math.hypot(tx, tz); if (dd > reach + e.def.radius) continue;
      let ea = Math.atan2(tx, tz) - yaw; while (ea > Math.PI) ea -= Math.PI * 2; while (ea < -Math.PI) ea += Math.PI * 2; if (dd > 1.2 && Math.abs(ea) > arc) continue;
      const hp0 = e.hp; hitEnemy(e, mul, stop, from); if (e.hp < hp0 || !e.alive) { n++; if (e.alive && fx) fx(e); }
    }
    const dd = Math.hypot(dummy.position.x - cx, dummy.position.z - cz); if (dd < reach) { const crit = Math.random() < 0.12; hitDummy(Math.round(rnd(9, 15) * mul * (crit ? 1.8 : 1)), crit, from, 0xffd27a, stop); n++; }
    { const p = pvpDmg(mul); pvpHit(cx, cz, yaw, reach, arc, p.n, p.crit); }
    skill = null; return n;
  }
  /** raio que salta da lâmina carregada */
  function bolt3d(a: THREE.Vector3, b: THREE.Vector3, col = 0x9ad0ff) {
    const pts: THREE.Vector3[] = []; const n = 7; for (let i = 0; i <= n; i++) { const k = i / n; const p = a.clone().lerp(b, k); if (i > 0 && i < n) p.add(new THREE.Vector3(rnd(-0.35, 0.35), rnd(-0.3, 0.3), rnd(-0.35, 0.35))); pts.push(p); }
    for (let i = 0; i < n; i++) beam(pts[i], pts[i + 1], col, 0.06, 0.16);
  }
  function thunderProc(e: Enemy) {
    thunderN--; const dm = Math.round((8 + st.lvl * 3) * skillScale('thunder').dmg); const top = e.pos.clone().setY(e.pos.y + 1.2);
    bolt3d(kitKey === 'tecno' && techLook ? techLook.gauntlet(new THREE.Vector3()) : d.getHero().weaponTip(new THREE.Vector3()), top); techLook?.charge(0.7); d.audio.spell('shock');
    setTimeout(() => { if (!e.alive) return; if (enemies.hurt(e, dm, e.pos, 1)) killEnemy(e); dmgText(e.pos.clone().setY(e.pos.y + 2.5), dm, false, '#9ad0ff'); for (let q = 0; q < 12; q++) d.particles.spawn(top.x, top.y, top.z, { vx: rnd(-3, 3), vy: rnd(0, 3), vz: rnd(-3, 3), life: 0.3, s0: 0.3, s1: 0.04, c0: 0xffffff, c1: 0x6ab0ff, a: 1, drag: 2 }); }, 30);
    if (thunderTier >= 2) { const o = enemies.list.find((x) => x !== e && x.alive && x.active && Math.hypot(x.pos.x - e.pos.x, x.pos.z - e.pos.z) < 5); if (o) { bolt3d(top, o.pos.clone().setY(o.pos.y + 1.1)); const d2 = Math.round(dm * 0.6); setTimeout(() => { if (!o.alive) return; if (enemies.hurt(o, d2, e.pos, 1)) killEnemy(o); dmgText(o.pos.clone().setY(o.pos.y + 2.3), d2, false, '#9ad0ff'); }, 60); } }
    if (thunderN <= 0) d.getHero().setAura(false);
  }
  function mkHatchet() {
    const g = new THREE.Group(), tm = (c: number) => new THREE.MeshToonMaterial({ color: c, gradientMap: ramp });
    const hdl = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.5, 6), tm(0x6a4a2a)); g.add(hdl);
    const bl = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.16, 0.2), tm(0xc8d0dc)); bl.position.set(0, 0.19, 0.1); g.add(bl);
    const ed = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.2, 0.03), new THREE.MeshBasicMaterial({ color: 0xf4f8ff })); ed.position.set(0, 0.19, 0.2); g.add(ed);
    g.scale.setScalar(1.6); fxAdd(g); return g;
  }
  function mkWall(x: number, z: number, yaw: number, w: number, tier: number) {
    const g = new THREE.Group(); g.position.set(x, d.world.heightAt(x, z), z); g.rotation.y = yaw;
    const n = Math.max(3, Math.round(w / 1.05)), col = tier >= 3 ? 0xffe08a : tier >= 2 ? 0xd8ecff : 0x9ad7ff;
    for (let i = 0; i < n; i++) { // escudos espectrais lado a lado, levemente curvados como uma parede de batalha
      const u = (i / (n - 1) - 0.5) * w, sh = new THREE.Mesh(new THREE.CircleGeometry(0.62, 18), glowM(col, 0.42)); sh.position.set(u, 0.95, -Math.abs(u) * 0.12); sh.rotation.y = -u * 0.12; g.add(sh);
      const rim = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.64, 18), glowM(0xffffff, 0.75)); rim.position.copy(sh.position); rim.rotation.copy(sh.rotation); g.add(rim);
      const boss = new THREE.Mesh(new THREE.CircleGeometry(0.13, 10), glowM(0xffffff, 0.9)); boss.position.copy(sh.position).add(new THREE.Vector3(0, 0, 0.01)); boss.rotation.copy(sh.rotation); g.add(boss);
    }
    const base = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.6, 0.9).rotateX(-Math.PI / 2), glowM(col, 0.25)); base.position.y = 0.06; g.add(base);
    g.scale.y = 0.01; fxAdd(g); return g;
  }
  function valkyrieCounter(n: number, from?: THREE.Vector3) {
    const h = d.getHero(), p0 = h.root.position; if (from) h.root.rotation.y = Math.atan2(from.x - p0.x, from.z - p0.z);
    h.act('combo4', true); d.audio.parry(); hitstop = Math.max(hitstop, performance.now() + 140); st.shake = Math.max(st.shake, 0.3); st.fury = Math.min(5, st.fury + 2);
    dmgText(p0.clone().setY(2.7), 'VALQUÍRIA!', true, '#ffe08a');
    const wing = (side: number) => { for (let i = 0; i < 26; i++) { const k = i / 25, yw = h.root.rotation.y + Math.PI + side * (0.4 + k * 1.1); d.particles.spawn(p0.x + Math.sin(yw) * (0.4 + k * 1.6), 1.2 + Math.sin(k * Math.PI) * 1.1 + k * 0.6, p0.z + Math.cos(yw) * (0.4 + k * 1.6), { vy: rnd(-0.2, 0.4), life: 0.7 + k * 0.3, s0: 0.32, s1: 0.05, c0: 0xffffff, c1: valkTier >= 1 ? 0xffe08a : 0xcfe0ff, a: 0.95, drag: 1 }); } };
    wing(1); wing(-1);
    for (const t of [0.5, 0.7]) pending.push({ at: now + TEMPO * 1.1 * t, fn: () => { d.audio.swing(); const q = h.root.position; hitArc('valkyrie', q.x, q.z, h.root.rotation.y, 3.3, Math.PI, 1.6, t > 0.6, (e) => { if (valkTier >= 2) { e.state = 'hurt'; e.t = -1.2; } }); } });
    if (valkTier >= 3 && from) { const src = enemies.nearest(from, 3); if (src) { const rf = Math.round(n * 0.5); setTimeout(() => { if (!src.alive) return; if (enemies.hurt(src, rf, p0, 3)) killEnemy(src); dmgText(src.pos.clone().setY(src.pos.y + 2.5), `↩ ${rf}`, true, '#ffe08a'); }, 200); } }
  }
  /** a parede barra o golpe? (o agressor está do outro lado da parede e o herói atrás dela) */
  function wallBlocks(from: THREE.Vector3 | undefined, hp: THREE.Vector3) {
    if (!from) return null;
    for (const w of walls) { const fx = Math.sin(w.yaw), fz = Math.cos(w.yaw), sx = Math.cos(w.yaw), sz = -Math.sin(w.yaw);
      const hf = (hp.x - w.x) * fx + (hp.z - w.z) * fz, hs = (hp.x - w.x) * sx + (hp.z - w.z) * sz, af = (from.x - w.x) * fx + (from.z - w.z) * fz;
      if (hf < 0.3 && hf > -6 && Math.abs(hs) < w.w * 0.5 + 0.6 && af > -0.2) return w; }
    return null;
  }
  const api = {
    st, logMsg, dmgText, enemies, dropLoot(x: number, z: number, y: number, id: string, n: number) { dropItem({ pos: new THREE.Vector3(x, y, z) } as unknown as Enemy, id, n); }, dropGearSet(x: number, z: number, y: number, gs: Gear[]) { spawnGear(x, z, y, 1, {}, gs.length, undefined, gs); }, setClassName(n: string) { if (!(cls.past ?? []).length && cls.name !== n) { cls.name = n; try { localStorage.setItem('karmika.class.v1', JSON.stringify(cls)); } catch { /* */ } } }, get classInfo() { return { ...cls, need: clsNeed(cls.lvl) }; },
    /** buffs e debuffs ativos agora (para a barra de efeitos no alto da tela) */
    buffs() { const L: { id: string; name: string; ic: string; t?: number; good: boolean; tip: string }[] = [];
      if (buff.dmgT > 0) L.push({ id: 'dmg', name: 'Fúria de Batalha', ic: '⚔', t: buff.dmgT, good: true, tip: `+${Math.round((buff.dmg - 1) * 100)}% de dano` });
      if (buff.defT > 0) L.push({ id: 'def', name: 'Muralha', ic: '🛡', t: buff.defT, good: true, tip: `+${Math.round(buff.def * 100)}% de defesa` });
      if (buff.moveT > 0) L.push({ id: 'move', name: 'Pés Ligeiros', ic: '➶', t: buff.moveT, good: buff.move >= 1, tip: `${buff.move >= 1 ? '+' : ''}${Math.round((buff.move - 1) * 100)}% de velocidade` });
      { const fe = (st as typeof st & { feast?: Record<string, { id: string; until: number } | undefined> }).feast; if (fe) for (const sl of ['meal', 'brew']) { const e = fe[sl]; if (!e) continue; const left = (e.until - Date.now()) / 1000; const f = FEASTS[e.id]; if (left > 0 && f) L.push({ id: 'feast_' + sl, name: f.name, ic: f.icon, t: left, good: true, tip: feastEff(f) }); } }
      { const nw = Date.now(); if (gad.heal > nw) L.push({ id: 'g_heal', name: 'Drone de Cura', ic: '🛸', t: (gad.heal - nw) / 1000, good: true, tip: `+${Math.round(gad.healK * 100)}% de vida a cada 6 s` }); if (gad.shock > nw) L.push({ id: 'g_shock', name: 'Bobina de Choque', ic: '⚡', t: (gad.shock - nw) / 1000, good: true, tip: `raio no inimigo mais perto a cada ${gad.shockI} s` }); if (gad.shield > nw) L.push({ id: 'g_shield', name: 'Escudo Automatizado', ic: '🛡', t: (gad.shield - nw) / 1000, good: true, tip: gad.shieldReady ? 'barreira pronta' : 'recarregando' }); if (gad.sentries.length) L.push({ id: 'g_sentry', name: `Robô Sentinela${gad.sentries.length > 1 ? ` ×${gad.sentries.length}` : ''}`, ic: '🤖', t: (Math.min(...gad.sentries.map((q) => q.until)) - nw) / 1000, good: true, tip: `guarda${gad.sentries.length > 1 ? 'm' : ''} o lugar onde ${gad.sentries.length > 1 ? 'foram plantadas' : 'foi plantada'} (até 5 de pé)` }); }
      if (hot.t > 0) L.push({ id: 'hot', name: 'Cura contínua', ic: '✚', t: hot.t, good: true, tip: `+${Math.round(hot.per)} de vida por segundo` });
      if (form) L.push({ id: 'form', name: 'Transformação', ic: '✷', t: form.t, good: true, tip: 'forma de batalha ativa' });
      if (st.ambushT > 0) L.push({ id: 'amb', name: 'Emboscada', ic: '◆', t: st.ambushT, good: true, tip: 'próximo golpe +50%' });
      if (st.counterT > 0) L.push({ id: 'ctr', name: 'Contra-golpe pronto', ic: '↺', t: st.counterT, good: true, tip: 'a investida sai de graça e dobrada' });
      return L; },
    resetClass(n: string) { cls = { name: n, lvl: 1, xp: 0, past: [] }; try { localStorage.setItem('karmika.class.v1', JSON.stringify(cls)); } catch { /* */ } },
    /** mudar de classe (a partir do nível 30, opcional e sem volta): a barra de classe recomeça do zero; magias e golpes da classe antiga continuam */
    changeClass(n: string) { if (st.lvl < 30) { logMsg('A mudança de classe só se abre no nível 30.', '#ff9a8a'); return false; } cls.past = [...(cls.past ?? []), { name: cls.name, lvl: cls.lvl }]; cls = { name: n, lvl: 0, xp: 0, past: cls.past }; try { localStorage.setItem('karmika.class.v1', JSON.stringify(cls)); } catch { /* */ } logMsg(`✦ Você agora segue o caminho de ${n}. O que aprendeu antes fica com você.`, '#c9a0ff'); return true; }, setResource(r: { name: string; label: string; style: string; mode: 'regen' | 'fight' }) { const was = st.res.mode; st.res = r; st.recalc?.(); if (r.mode === 'fight' && was !== 'fight') st.mp = 0; st.mp = Math.min(st.mp, st.mpMax); }, ambush() { st.ambushT = 0.9; }, xpNeed, xpNeedAt, setOnItem(f: (id: string, n: number) => boolean | void) { onItem = f; }, setOnDeath(f: (revive: () => void) => void) { onDeath = f; }, snd(k: 'coins' | 'error' | 'pickup' | 'click' | 'swap') { d.audio[k](); }, setMoving(m: boolean) { heroMoving = m; }, setSkillScale(f: (id: string) => SScale) { skillScale = f; }, setOnGear(f: (g: Gear) => boolean | void) { onGear = f; }, setOnKill(f: (t: Enemy['type'], e: Enemy) => void) { onKill = f; },
    /** jogar junto: liga os avisos da rede e o tamanho do grupo por perto */
    setNet(h: Partial<typeof netHooks>, party: () => number) { Object.assign(netHooks, h); partyN = party; },
    /** um companheiro de grupo matou um bicho perto de mim: XP, missão e o meu próprio saque */
    sharedKill(e: Enemy) { killEnemy(e, true); },
    setPvp(f: typeof pvpHit) { pvpHit = f; }, /** a arma equipada (nome base) decide se o ataque básico é corpo a corpo ou tiro */ setWeapon(base: string | null) { wmode = base ? WMODE.find(([re]) => re.test(base))?.[1] ?? null : null; }, get weaponMode() { return wmode; }, setOnYield(f: (e: Enemy, decide: (kill: boolean) => void) => void) { onYield = f; }, setXpFilter(f: typeof xpFilter) { xpFilter = f; }, spawnGear, gainXp(n: number) { gainXp(n, d.getHero().root.position); },
    get menuOpen() { return st.menuOpen; },
    /** alvo mais próximo ao alcance (trava automática dos golpes) */
    timeScale() { return performance.now() < hitstop ? 0.1 : 1; },
    /** alvo na direção do mouse (cone de ±40°): o mais próximo primeiro; empate (até 1,5 m) → o mais forte */
    /** a magia pode sair agora? 'cd' = recarregando, 'res' = sem mana/determinação/fôlego; null = pode */
    ready(id: string, cost: number): 'cd' | 'res' | null {
      const kind = d.getHero().kind, counter = st.counterT > 0;
      let c = 0, need = 0;
      if (id === 'slam') { const slammer = kind === 'nordic' || kind === 'dwarf' || kind === 'technocrat'; c = slammer ? cd.slam : cd.cast; need = slammer ? Math.max(8, 30 - 5 * st.fury) : 25; }
      else if (id === 'bash') { c = counter ? 0 : cd.bash; need = counter ? 0 : kind === 'technocrat' ? 35 : kind === 'nordic' && st.res.name === 'Determinação' ? 15 : 0; }
      else if (id === 'heal') { c = cd.heal; need = 40; }
      else if (id === 'combo' || id === 'guard') return null;
      else { c = cdX[id] ?? 0; need = Math.round(cost * skillScale(id as SkillId).cost * (st.sp.has('m_staff') ? 0.8 : 1)); if (st.sp.has('u_draupnir') && now >= draupT) need = 0; }
      if (c > 0.05) return 'cd';
      if (!st.god && st.mp < need) return 'res';
      return null;
    },
    target(p: THREE.Vector3, yaw?: number): THREE.Vector3 | null {
      let best: Enemy | null = null, bd = 11;
      for (const e of enemies.list) { if (!e.alive || !e.active) continue; const dx = e.pos.x - p.x, dz = e.pos.z - p.z, dd = Math.hypot(dx, dz); if (dd > 11) continue;
        if (yaw !== undefined) { let da = Math.atan2(dx, dz) - yaw; while (da > Math.PI) da -= Math.PI * 2; while (da < -Math.PI) da += Math.PI * 2; if (Math.abs(da) > 0.7) continue; }
        if (!best || dd < bd - 1.5 || (Math.abs(dd - bd) <= 1.5 && e.hpMax > best.hpMax)) { best = e; bd = Math.min(bd, dd); } }
      if (best) return best.pos; return Math.hypot(dummy.position.x - p.x, dummy.position.z - p.z) < 11 ? dummy.position : null;
    },
    attack(yaw: number, heroPos: THREE.Vector3) {
      if (st.menuOpen) return false;
      const h = d.getHero();
      if ((kitKey === 'mag' || kitKey === 'bru') && !wmode) { // mago e bruxo: o golpe básico é magia que voa
        if (cd.attack > 0) return false; if (!h.act('cast')) return false; const B = kitKey === 'bru', col = B ? 0xa060ff : 0x7ab8ff; cd.attack = (B ? 0.7 : 0.62) * TEMPO; lastCombo = now; slotFlash('combo');
        const n = B ? 1 : form?.id === 'archon' ? 3 : 2;
        for (let i = 0; i < n; i++) pending.push({ at: now + TEMPO * 0.2 + i * 0.11, fn: () => { const from = h.weaponTip(new THREE.Vector3()); from.y = Math.max(from.y, 1.1); const off = n > 1 ? (i - (n - 1) / 2) * 0.09 : 0, dir = new THREE.Vector3(Math.sin(yaw + off), 0, Math.cos(yaw + off));
          bolts.push({ p: from, v: dir.multiplyScalar(B ? 19 : 25), life: 0.6, mul: B ? 1.15 : 0.66, col, pulse: true, onHit: B ? () => { st.hp = Math.min(st.hpMax, st.hp + (2 + st.lvl * 0.35) * (1 + stance.heal)); } : undefined });
          for (let k = 0; k < 8; k++) d.particles.spawn(from.x, from.y, from.z, { vx: dir.x * rnd(1, 4) + rnd(-1, 1), vy: rnd(-0.5, 1), vz: dir.z * rnd(1, 4) + rnd(-1, 1), life: 0.3, s0: 0.35, s1: 0.04, c0: 0xffffff, c1: col, a: 1, drag: 3 }); d.audio.spell('arcane'); } });
        return true; }
      if (wmode && h.kind !== 'technocrat') { // armas de distância e de jato: o ataque básico vira tiro
        if (cd.attack > 0) return false;
        if (!h.act('shoot')) return false; lastCombo = now; slotFlash('combo');
        const dir0 = (sp: number) => new THREE.Vector3(Math.sin(yaw + rnd(-sp, sp)), 0, Math.cos(yaw + rnd(-sp, sp)));
        const from0 = () => { const f = h.weaponTip(new THREE.Vector3()); f.y = Math.max(f.y, 1.0); return f; };
        if (wmode === 'bow' || wmode === 'longbow') { const L = wmode === 'longbow'; cd.attack = (L ? 1.05 : 0.8) * TEMPO; d.audio.swing();
          pending.push({ at: now + TEMPO * 0.22, fn: () => { const from = from0(), dir = dir0(0.01); bolts.push({ p: from, v: dir.multiplyScalar(L ? 40 : 34), life: L ? 0.6 : 0.5, mul: L ? 1.55 : 1.25, pulse: true, straight: true, quiet: true, m: mkArrow(0xe8d8b0), col: 0xe8d8b0 }); d.audio.parry(); } }); return true; }
        if (wmode === 'xbow') { cd.attack = 0.6 * TEMPO; // besta de repetição: três virotes em sequência
          for (let i = 0; i < 3; i++) pending.push({ at: now + TEMPO * 0.1 + i * 0.12, fn: () => { const from = from0(), dir = dir0(0.03); bolts.push({ p: from, v: dir.multiplyScalar(46), life: 0.42, mul: 0.62, pulse: true, straight: true, quiet: true, m: mkArrow(0x9a2a2a), col: 0xc8d8ff }); d.audio.parry(); st.shake = Math.max(st.shake, 0.04); } }); return true; }
        if (wmode === 'smg') { cd.attack = 0.55 * TEMPO; // metralhadora de mão: seis balas rápidas e espalhadas
          for (let i = 0; i < 6; i++) pending.push({ at: now + TEMPO * 0.08 + i * 0.065, fn: () => { const from = from0(), dir = dir0(0.06); h.muzzle(); d.audio.hit(); st.shake = Math.max(st.shake, 0.05);
            bolts.push({ p: from, v: dir.clone().multiplyScalar(52), life: 0.3, mul: 0.34, pulse: true, quiet: true, col: 0xffd080 }); beam(from, from.clone().addScaledVector(dir, 1.2), 0xffe0a0, 0.02, 0.05);
            const hand = h.handPos(new THREE.Vector3()); d.particles.spawn(hand.x, hand.y, hand.z, { vx: -Math.cos(yaw) * 2 + rnd(-0.5, 0.5), vy: 2.5, vz: Math.sin(yaw) * 2, life: 0.5, s0: 0.1, s1: 0.08, c0: 0xd8b060, c1: 0xb8903c, a: 1, g: 12 }); } }); return true; }
        // lança-chamas / lança-veneno de mão: jato curto de 5 m enquanto o botão fica apertado (cada clique, 0,8 s)
        cd.attack = 0.7 * TEMPO; flameT = 0.8; flameYaw = yaw; flameKind = wmode === 'venom' ? 'poison' : 'fire'; flameMul = 0.22; flameReach = 5.5; d.audio.cast(); return true;
      }
      if (h.kind === 'technocrat') { // Rajada: 3 tiros de rifle com coice, clarão no cano e cápsulas
        if (cd.attack > 0) return false;
        if (!h.act('shoot')) return false;
        cd.attack = 0.5 * TEMPO; lastCombo = now; slotFlash('combo');
        const over = overcharge; overcharge = false; if (over) logMsg('⚡ Sobrecarga: Rajada ×2,5', '#8af0ff');
        const shots = form?.id === 'mech' ? 5 : 3;
        for (let i = 0; i < shots; i++) pending.push({ at: now + TEMPO * 0.1 + i * 0.09, fn: () => {
          const from = h.weaponTip(new THREE.Vector3()); from.y = Math.max(from.y, 0.9); h.muzzle(); d.audio.hit(); d.audio.swing(); st.shake = Math.max(st.shake, 0.08);
          const sp = 0.025, dir = new THREE.Vector3(Math.sin(yaw + rnd(-sp, sp)), 0, Math.cos(yaw + rnd(-sp, sp)));
          bolts.push({ p: from.clone(), v: dir.clone().multiplyScalar(48), life: 0.38, mul: over ? 1.6 : 0.62, pulse: true, col: 0xffd080 });
          beam(from, from.clone().addScaledVector(dir, 1.6), 0xffe0a0, 0.03, 0.08);
          for (let k = 0; k < 6; k++) d.particles.spawn(from.x, from.y, from.z, { vx: dir.x * rnd(3, 9) + rnd(-2, 2), vy: rnd(-0.5, 1.5), vz: dir.z * rnd(3, 9) + rnd(-2, 2), life: 0.2, s0: 0.6, s1: 0.05, c0: 0xfff0c0, c1: 0xff8a20, a: 1, drag: 3 });
          for (let k = 0; k < 3; k++) d.particles.spawn(from.x, from.y + 0.05, from.z, { vx: rnd(-0.5, 0.5), vy: rnd(0.5, 1.2), vz: rnd(-0.5, 0.5), life: 0.6, s0: 0.35, s1: 0.3, c0: 0x8a8a8a, c1: 0x444444, a: 0.4, drag: 1 });
          const hand = h.handPos(new THREE.Vector3()); d.particles.spawn(hand.x, hand.y, hand.z, { vx: -Math.cos(yaw) * 2 + rnd(-0.5, 0.5), vy: 2.5, vz: Math.sin(yaw) * 2, life: 0.6, s0: 0.12, s1: 0.1, c0: 0xd8b060, c1: 0xb8903c, a: 1, g: 12 });
        } });
        return true;
      }
      if (h.kind === 'dwarf') { // Martelada: varre de um lado, volta do outro, gira e termina esmagando o chão
        const seq = now - lastCombo > 1.3 * TEMPO ? 0 : (comboIdx + 1) % 4;
        const name = (['cleave1', 'cleave4', 'cleave3', 'cleave2'] as const)[seq];
        if (!h.act(name)) return false;
        comboIdx = seq; lastCombo = now; slotFlash('combo'); d.audio.swing();
        if (seq === 0) pending.push({ at: now + TEMPO * 0.25, fn: () => skStrike('combo', h, yaw, 1.2, 3.2, 1.3) });
        if (seq === 1) pending.push({ at: now + TEMPO * 0.25, fn: () => skStrike('combo', h, yaw, 1.3, 3.2, 1.3) });
        if (seq === 2) { pending.push({ at: now + TEMPO * 0.42, fn: () => skStrike('combo', h, yaw, 1.3, 3.4, Math.PI) }); pending.push({ at: now + TEMPO * 0.66, fn: () => { skStrike('combo', h, yaw, 1.4, 3.4, Math.PI, true); d.audio.swing(); } }); }
        if (seq === 3) pending.push({ at: now + TEMPO * 0.3, fn: () => { skStrike('combo', h, yaw, 2.2, 3.2, 0.9, true); d.audio.boom(); st.shake = Math.max(st.shake, 0.45); const p = h.root.position, cx = p.x + Math.sin(yaw) * 1.3, cz = p.z + Math.cos(yaw) * 1.3, gy = d.world.heightAt(cx, cz); crack.position.set(cx, gy + 0.07, cz); crack.rotation.z = Math.random() * 6; crackT = 0; (crack.material as THREE.MeshBasicMaterial).color.setHex(0xd8c8a8); for (let i = 0; i < 26; i++) d.particles.spawn(cx, gy + 0.1, cz, { vx: rnd(-3, 3), vy: rnd(1, 4), vz: rnd(-3, 3), life: 0.6, s0: 0.5, s1: 0.1, c0: 0xb09060, c1: 0x5a4a30, a: 1, g: 10 }); for (const e of enemies.list) if (e.alive && e.active && Math.hypot(e.pos.x - cx, e.pos.z - cz) < 2.6 + e.def.radius) { e.state = 'hurt'; e.t = -0.7; } } });
        return true;
      }
      if (h.kind !== 'nordic') {
        if (cd.attack > 0) return false;
        if (!h.act('attack')) return false;
        cd.attack = 0.55 * TEMPO; slotFlash('combo'); d.audio.swing();
        pending.push({ at: now + TEMPO * 0.27, fn: () => skStrike('combo', h, yaw, 1, 2.9, 1.2) });
        return true;
      }
      const seq = now - lastCombo > 1.3 * TEMPO ? 0 : (comboIdx + 1) % 4;
      const name = (['combo1', 'combo2', 'combo3', 'combo4'] as const)[seq];
      if (!h.act(name)) return false;
      comboIdx = seq; lastCombo = now; slotFlash('combo'); d.audio.swing();
      /* vampiro: golpes de duelista 45% mais rápidos (dano por golpe um pouco menor); lobisomem: garras, 20% mais rápidas, sem arma */
      const Q = kitKey === 'vam' ? 1 / 1.45 : kitKey === 'lob' && beastOn ? 1 / 1.2 : 1, MK = kitKey === 'vam' ? 0.82 : 1, RK = kitKey === 'lob' && beastOn ? 0.8 : 1;
      const fxc = (sd: number) => { if (kitKey === 'tecno' && techLook) { const gp = techLook.gauntlet(new THREE.Vector3()); techLook.charge(0.5); const y2 = h.root.rotation.y; bolt3d(gp, gp.clone().add(new THREE.Vector3(Math.sin(y2) * 1.4, 0, Math.cos(y2) * 1.4)), 0xbff4ff); streak(h.root.position.x, h.root.position.y + 1.1, h.root.position.z, y2, sd, 0x8af0ff, { n: 1, r: 1.2, w: 0.04, life: 0.2 }); } if (kitKey === 'lob' && beastOn) clawFx(sd, 0xffd0b0, 3); else if (kitKey === 'vam') { const p0 = h.root.position; streak(p0.x, p0.y + 1.15, p0.z, h.root.rotation.y, sd, 0xff3a4a, { n: 1, r: 1.5, w: 0.05, life: 0.22, span: 1.7 }); } };
      if (seq === 0) pending.push({ at: now + TEMPO * 0.19 * Q, fn: () => { fxc(1); skStrike('combo', h, yaw, 1.0 * MK, 3.6 * RK, 0.7); } });
      if (seq === 1) pending.push({ at: now + TEMPO * 0.19 * Q, fn: () => { fxc(-1); skStrike('combo', h, yaw, 1.1 * MK, 3.0 * RK, 1.3); } });
      if (seq === 2) pending.push({ at: now + TEMPO * 0.22 * Q, fn: () => { fxc(1); skStrike('combo', h, yaw, 1.3 * MK, 2.8 * RK, 1.0); d.audio.boom(); st.shake = Math.max(st.shake, 0.22); } });
      if (seq === 3) {
        pending.push({ at: now + TEMPO * 0.3 * Q, fn: () => { fxc(-1); skStrike('combo', h, yaw, 1.2 * MK, 3.1 * RK, 1.2); } });
        pending.push({ at: now + TEMPO * 0.72 * Q, fn: () => { fxc(1); if (kitKey === 'lob' && beastOn) clawFx(-1, 0xffd0b0, 3); skStrike('combo', h, yaw, 1.7 * MK, 3.3 * RK, Math.PI, true); } });
        pending.push({ at: now + TEMPO * 0.62 * Q, fn: () => d.audio.swing() });
      }
      return true;
    },
    guard(on: boolean) { const h = d.getHero(); if (on && form?.id === 'fenrir') return; if (on && !h.guard) guardAt = now; h.guard = on && !st.menuOpen; document.querySelector('.slot[data-id="guard"]')?.classList.toggle('on', h.guard); },
    bash(_yaw?: number, target?: { x: number; z: number }) {
      if (target) rainAt = target;
      const h = d.getHero(); if ((cd.bash > 0 && st.counterT <= 0) || st.menuOpen) return false;
      if (h.kind === 'technocrat') { // Chuva de Mísseis: a esfera voa até a marca e despeja mini-mísseis
        const cost4 = st.counterT > 0 ? 0 : 35; if (st.mp < cost4) return false; if (!h.act('shoot')) return false;
        counterBash = st.counterT > 0; cd.bash = counterBash ? 1 : 8; if (counterBash) st.counterT = 0; st.mp -= cost4; st.lastCast = now; slotFlash('bash'); d.audio.cast();
        const yaw = _yaw ?? h.root.rotation.y; const mx = h.root.position.x + Math.sin(yaw) * 7, mz = h.root.position.z + Math.cos(yaw) * 7;
        { let cx = rainAt ? rainAt.x : mx, cz = rainAt ? rainAt.z : mz;
          // vai onde tem inimigos: centro do grupo perto da marca
          const near = enemies.list.filter((e) => e.alive && e.active && Math.hypot(e.pos.x - cx, e.pos.z - cz) < 7); if (near.length) { cx = near.reduce((a, e) => a + e.pos.x, 0) / near.length; cz = near.reduce((a, e) => a + e.pos.z, 0) / near.length; }
          const sc4 = skillScale('bash'); const len = 9 * sc4.range; const dxn = Math.sin(yaw), dzn = Math.cos(yaw);
          droneTask = { kind: 'rain', x: cx, z: cz, t: 0, fired: 0, sx: cx - dxn * len, sz: cz - dzn * len, ex: cx + dxn * len, ez: cz + dzn * len }; rainAt = null;
          logMsg('🚀 Razante de napalm!', '#ffb060'); }
        return true;
      }
      if (h.kind === 'dwarf') { // Investida de Ombro: corre, trombada, e termina com uma esmagada do martelo
        if (!h.act('charge')) return false;
        counterBash = st.counterT > 0; cd.bash = counterBash ? 0.4 : 2.6; if (counterBash) st.counterT = 0; slotFlash('bash'); d.audio.dash(); pathHit.clear(); pathAct = 'charge'; rushHalt = false;
        pending.push({ at: now + TEMPO * 0.5, fn: () => { if (h.actName === 'charge') h.act('cleave2'); } });
        pending.push({ at: now + TEMPO * 0.76, fn: () => { const yaw = h.root.rotation.y, p = h.root.position; skStrike('bash', h, yaw, 2.2, 3.4, 1.1, true); d.audio.boom(); st.shake = Math.max(st.shake, 0.45); const cx = p.x + Math.sin(yaw) * 1.2, cz = p.z + Math.cos(yaw) * 1.2, gy = d.world.heightAt(cx, cz); crack.position.set(cx, gy + 0.07, cz); crack.rotation.z = Math.random() * 6; crackT = 0; (crack.material as THREE.MeshBasicMaterial).color.setHex(0xd8c8a8); for (let i = 0; i < 24; i++) d.particles.spawn(cx, gy + 0.1, cz, { vx: rnd(-3, 3), vy: rnd(1, 4), vz: rnd(-3, 3), life: 0.6, s0: 0.5, s1: 0.1, c0: 0xb09060, c1: 0x5a4a30, a: 1, g: 10 }); } });
        return true;
      }
      if (h.kind === 'nordic') { // Investida de Lâmina: atravessa a linha cortando todos com a espada estendida
        // o humano paga a investida com Determinação (a "mana" dele, que enche lutando); no contragolpe sai de graça
        const det = st.res.name === 'Determinação' && st.counterT <= 0 ? 15 : 0;
        if (det && st.mp < det) { $('mp').animate([{ filter: 'brightness(2)' }, { filter: 'none' }], 250); logMsg(`Falta Determinação (${det}). Ela enche a cada golpe dado ou recebido.`, '#ff9a8a'); return false; }
        if (!h.act('rush')) return false; st.mp -= det; counterBash = st.counterT > 0; cd.bash = counterBash ? 0.4 : CD.bash + 0.6; if (counterBash) st.counterT = 0; slotFlash('bash'); d.audio.dash(); pathHit.clear(); pathAct = 'rush'; rushDone = false; rushHalt = false;
        pending.push({ at: now + TEMPO * 0.78, fn: () => { if (h.actName !== 'rush' || rushDone) return; rushFinish(h); } });
        return true;
      }
      if (!h.act('bash')) return false; counterBash = st.counterT > 0; cd.bash = counterBash ? 0.4 : CD.bash; if (counterBash) st.counterT = 0; slotFlash('bash'); d.audio.dash();
      pending.push({ at: now + TEMPO * 0.45, fn: () => {
        const p = h.root.position; const yaw = h.root.rotation.y;
        skStrike('bash', h, yaw, 1.4, 3.4, 1.0);
        d.audio.boom(); st.shake = Math.max(st.shake, 0.3);
        for (let i = 0; i < 14; i++) d.particles.spawn(p.x + Math.sin(yaw) * 1.1, 0.15, p.z + Math.cos(yaw) * 1.1, { vx: Math.sin(yaw) * rnd(1, 4) + rnd(-1.5, 1.5), vy: rnd(0.3, 1.6), vz: Math.cos(yaw) * rnd(1, 4) + rnd(-1.5, 1.5), life: 0.5, s0: 0.5, s1: 0.1, c0: 0xb8a888, c1: 0x6a5a40, a: 0.35, drag: 2 });
      } });
      return true;
    },
    slam(target?: { x: number; z: number }) {
      const h = d.getHero(); const cost = Math.max(8, 30 - 5 * st.fury); if (cd.slam > 0 || st.menuOpen || st.mp < cost) return false;
      if (h.kind === 'technocrat') { // Granada Explosiva: arremesso em arco até a marca; explode ao cair (pólvora)
        if (!h.act('throw')) return false; cd.slam = 2.6; st.mp -= cost; const charge = st.fury; st.fury = 0; st.lastCast = now; slotFlash('slam'); d.audio.swing();
        const tx = target ? target.x : h.root.position.x + Math.sin(h.root.rotation.y) * 6, tz = target ? target.z : h.root.position.z + Math.cos(h.root.rotation.y) * 6;
        pending.push({ at: now + TEMPO * 0.44, fn: () => {
          const from = h.handPos(new THREE.Vector3()); const dur = 0.55, gy = d.world.heightAt(tx, tz);
          const v = new THREE.Vector3((tx - from.x) / dur, (gy + 0.3 - from.y) / dur + 0.5 * 14 * dur, (tz - from.z) / dur);
          const m = new THREE.Group(); m.add(new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), new THREE.MeshToonMaterial({ color: 0x3a4552, gradientMap: ramp }))); const fuse = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 5), new THREE.MeshBasicMaterial({ color: 0xffb040 })); fuse.position.y = 0.16; m.add(fuse); m.position.copy(from); fxAdd(m);
          grenades.push({ m, p: from.clone(), v, t: 0, dur, tx, tz, r: 3.0 + 0.4 * charge, mul: 2.4 + 0.3 * charge });
        } });
        return true;
      }
      if (h.kind === 'dwarf') { // Terremoto
        if (!h.act('quake')) return false; teleT = 0; slamAt = target ?? null; cd.slam = 3.5; st.mp -= cost; slamFury = st.fury; st.fury = 0; st.lastCast = now; slotFlash('slam'); d.audio.swing();
        pending.push({ at: now + TEMPO * 0.74, fn: () => {
          const p = h.root.position; const yaw = h.root.rotation.y; teleT = -1; teleG.visible = false; slamAt = null;
          const cx = p.x + Math.sin(yaw) * 0.8, cz = p.z + Math.cos(yaw) * 0.8, gy = d.world.heightAt(cx, cz);
          crack.position.set(cx, gy + 0.07, cz); crack.rotation.z = Math.random() * 6; crackT = 0; (crack.material as THREE.MeshBasicMaterial).color.setHex(0xff8a30);
          { const rL = 5 * skillScale('slam').area; skStrike('slam', h, yaw, 2.4 * (1 + 0.3 * slamFury), rL + 1, Math.PI, true); lavaBurst(cx, cz, gy, rL); }
          for (const e of enemies.list) if (e.alive && e.active && Math.hypot(e.pos.x - p.x, e.pos.z - p.z) < 6) { e.state = 'hurt'; e.t = -1.2; }
          d.audio.boom(); d.audio.spell('fire'); st.shake = Math.max(st.shake, 0.7);
          for (let i = 0; i < 40; i++) { const a = rnd(0, 6.283), r = rnd(0.3, 3.6); d.particles.spawn(cx + Math.cos(a) * r, gy + 0.1, cz + Math.sin(a) * r, { vx: Math.cos(a) * rnd(0.5, 2), vy: rnd(3, 8), vz: Math.sin(a) * rnd(0.5, 2), life: rnd(0.6, 1.2), s0: 0.5, s1: 0.15, c0: 0xb09060, c1: 0x5a4a30, a: 1, g: 14 }); }
          for (let i = 0; i < 50; i++) { const a = (i / 50) * 6.283; d.particles.spawn(cx, gy + 0.2, cz, { vx: Math.cos(a) * 7, vy: 0.4, vz: Math.sin(a) * 7, life: 0.8, s0: 1.2, s1: 0.2, c0: 0xd8c8a8, c1: 0x6a5a40, a: 0.6, drag: 2.5 }); }
          for (let i = 0; i < 8; i++) { const a = rnd(0, 6.283), r = rnd(1, 3.2); const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(rnd(0.18, 0.4), 0), new THREE.MeshToonMaterial({ color: 0x6e6252, gradientMap: ramp })); rock.position.set(cx + Math.cos(a) * r, gy - 0.3, cz + Math.sin(a) * r); rock.rotation.set(rnd(0, 3), rnd(0, 3), 0); rock.castShadow = true; fxAdd(rock); rocks.push({ m: rock, t: 0, y0: gy - 0.3 }); }
        } });
        return true;
      }
      if (!h.act('slam')) return false; teleT = 0; slamAt = target ?? null; cd.slam = CD.slam; st.mp -= Math.round(cost * skillScale('slam').cost); { const hq = d.getHero().root.position; tierBurst(hq.x, hq.z, skillScale("slam").tier); } slamFury = st.fury; if (slamFury) logMsg(`🔥 Salto com ${slamFury} de Fúria: +${slamFury * 30}% de dano`, '#ffb060'); st.fury = 0; st.lastCast = now; slotFlash('slam'); d.audio.cast();
      pending.push({ at: now + TEMPO * 0.76, fn: () => {
        const p = h.root.position; const yaw = h.root.rotation.y;
        teleT = -1; teleG.visible = false;
        const cx = slamAt ? slamAt.x : p.x + Math.sin(yaw) * 0.9, cz = slamAt ? slamAt.z : p.z + Math.cos(yaw) * 0.9; slamAt = null;
        crack.position.set(cx, d.world.heightAt(cx, cz) + 0.07, cz); crack.rotation.z = Math.random() * 6; crackT = 0; (crack.material as THREE.MeshBasicMaterial).color.setHex(0x9ad7ff);
        { const rI = 5.2 * skillScale('slam').area; skStrike('quake', h, yaw, 2.4, rI + 1, Math.PI, true); iceBurst(cx, cz, d.world.heightAt(cx, cz), rI);
        for (const e of enemies.list) if (e.alive && e.active && Math.hypot(e.pos.x - cx, e.pos.z - cz) < rI + e.def.radius) { e.slow = 4 * skillScale('slam').dur; if (e.alive) { e.state = 'hurt'; e.t = -0.6; } } }
        d.audio.boom(); d.audio.spell('ice'); st.shake = Math.max(st.shake, 0.55);
      } });
      return true;
    },
    cast(yaw: number, target?: { x: number; z: number }) {
      { const k = d.getHero().kind; if (k === 'nordic' || k === 'technocrat' || k === 'dwarf') return api.slam(target); }
      if (cd.cast > 0 || st.menuOpen || st.mp < 25) { if (st.mp < 25) { $('mp').animate([{ filter: 'brightness(2)' }, { filter: 'none' }], 250); } return false; }
      const h = d.getHero(); if (!h.act('cast')) return false;
      st.mp -= 25; st.lastCast = now; cd.cast = CD.cast; slotFlash('slam'); d.audio.cast();
      pending.push({ at: now + TEMPO * 0.28, fn: () => {
        const from = h.handPos(new THREE.Vector3());
        bolts.push({ p: from, v: new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)).multiplyScalar(15), life: 1.0 });
      } });
      return true;
    },
    heal(heroPos: THREE.Vector3, target?: { x: number; z: number }) {
      if (target) turretAt = target;
      const hk = d.getHero();
      if (cd.heal > 0 || st.menuOpen || st.mp < 40 || (hk.kind !== 'technocrat' && st.hp >= st.hpMax && st.fury === 0)) return false;
      if (hk.kind === 'technocrat') { // Torre de Engenharia: laser contra inimigos + pulso de cura; até 2 torres por 15 s
        if (!hk.act('throw')) return false; st.mp -= 40; st.lastCast = now; cd.heal = 6; slotFlash('heal'); d.audio.swing();
        const yaw = hk.root.rotation.y; const tx = turretAt ? turretAt.x : heroPos.x + Math.sin(yaw) * 1.6, tz = turretAt ? turretAt.z : heroPos.z + Math.cos(yaw) * 1.6; turretAt = null;
        pending.push({ at: now + TEMPO * 0.4, fn: () => { if (turrets.length >= 2) { const o = turrets.shift()!; d.scene.remove(o.m); } const tr = mkTurret(tx, tz); turrets.push({ ...tr, x: tx, z: tz, t: 0, shotT: 0.4, healT: 0.6 }); for (let i = 0; i < 18; i++) d.particles.spawn(tx, 0.3, tz, { vx: rnd(-2, 2), vy: rnd(1, 3), vz: rnd(-2, 2), life: 0.6, s0: 0.4, s1: 0.05, c0: 0xffffff, c1: 0x7affd0, a: 1, drag: 2 }); logMsg('🔥 Torre lança-chamas instalada (15 s)', '#ff7a30'); } });
        return true;
      }
      if (hk.kind === 'dwarf') { // Hidromel
        if (!hk.act('drink')) return false; st.mp -= 40; st.lastCast = now; cd.heal = CD.heal + 1; slotFlash('heal');
        pending.push({ at: now + TEMPO * 0.55, fn: () => { st.hp = Math.min(st.hpMax, st.hp + (st.hpMax * 0.28 + 8 * st.fury) * (st.sp.has('r_calice') ? 2 : 1) * (1 + stance.heal)); d.audio.heal(); if (st.fury) { st.serene = 3; st.fury = 0; logMsg('🍺 Hidromel: próximos 3 golpes críticos', '#ffc860'); } st.fury = Math.min(5, st.fury + 2); for (let i = 0; i < 20; i++) d.particles.spawn(heroPos.x + rnd(-0.4, 0.4), 1.4, heroPos.z + rnd(-0.4, 0.4), { vx: rnd(-0.5, 0.5), vy: rnd(1, 2.5), vz: rnd(-0.5, 0.5), life: 0.8, s0: 0.3, s1: 0.05, c0: 0xfff2c8, c1: 0xffb040, a: 0.9 }); } });
        return true;
      }
      st.mp -= 40; st.lastCast = now; cd.heal = CD.heal; st.hp = Math.min(st.hpMax, st.hp + (35 + 10 * st.fury) * (st.sp.has('r_calice') ? 2 : 1) * (1 + stance.heal)); if (st.fury) { st.serene = 3; logMsg(`✚ Cura +${10 * st.fury} (Fúria). Próximos 3 golpes: críticos`, '#7aff9a'); st.fury = 0; } slotFlash('heal'); d.audio.heal();
      for (let i = 0; i < 26; i++) { const a = (i / 26) * 6.283; d.particles.spawn(heroPos.x + Math.cos(a) * 0.8, 0.1, heroPos.z + Math.sin(a) * 0.8, { vx: 0, vy: rnd(1.1, 1.9), vz: 0, life: 1.1, s0: 0.3, s1: 0.06, c0: 0xfff0bd, c1: 0x7aff9a, a: 0.9, drag: 0.4 }); }
      return true;
    },
    damage(n: number, heroPos: THREE.Vector3, from?: THREE.Vector3) {
      const h = d.getHero();
      if (st.dead || st.god) return;
      if (warrior && fury > 0.5) n *= 1.06; /* frenesi: o guerreiro esquece a guarda */
      { /* diferença de nível (Erling, 25/10: "nível 9 brigando bem com monstro 15 de caveira? eu deveria morrer"): quem está acima bate MUITO mais forte.
           +5 níveis (caveira) ≈ ×1,7; +8 ≈ ×2,4; teto ×3. Monstro abaixo de você machuca menos (até −40%). Não é bônus de situação: fica fora do balde da Regra 01. */
        let eL = 0; if (from) { let bd = 2.6; for (const o of enemies.list) { if (!o.alive || !o.active) continue; const dd = Math.hypot(o.pos.x - from.x, o.pos.z - from.z); if (dd < bd) { bd = dd; eL = o.def.lvl ?? 0; } } }
        if (eL) { const dl = eL - st.lvl; n *= dl > 0 ? Math.min(3, 1 + 0.09 * dl + 0.01 * dl * dl) : Math.max(0.6, 1 + 0.04 * dl); } }
      { const pn = Math.max(1, Math.min(6, partyN())); if (pn > 1) n *= 1 + 0.12 * (pn - 1); } /* GRUPO: e bate mais forte (+12% por companheiro perto) */
      n = Math.max(1, Math.round(n * st.takenMul * (d.takenK?.() ?? 1))); /* Instinto ligado: a defesa cai (a atenção está em outro lugar) */ /* Lua de Sangue / Aurora: o karma pesa no quanto o golpe dói */
      if (gad.shield > Date.now() && gad.shieldReady) { gad.shieldReady = false; gad.shieldT = gad.shieldCd; if (gv.dome) gv.dome.flash = 0.5; logMsg('🛡 Clanc! O Escudo Automatizado segurou o golpe inteiro.', '#9ad7ff'); for (let q = 0; q < 14; q++) { const hp2 = d.getHero().root.position; d.particles.spawn(hp2.x + rnd(-0.6, 0.6), hp2.y + rnd(0.4, 1.8), hp2.z + rnd(-0.6, 0.6), { vy: rnd(0.2, 1), life: 0.5, s0: 0.4, s1: 0.05, c0: 0xffffff, c1: 0x9ad7ff, a: 0.9 }); } return; }
      if (valkT > 0) { valkT = 0; valkyrieCounter(n, from); return; }
      if (aegis && aegis.hp > 0) { const ab = Math.min(n, aegis.hp); aegis.hp -= ab; n -= ab; aegis.u.hit.value = 1; d.audio.block(); dmgText(heroPos.clone().setY(heroPos.y + 2.6), `✦ ${ab}`, false, '#ffe08a');
        if (from) { const a2 = Math.atan2(from.x - heroPos.x, from.z - heroPos.z); for (let i = 0; i < 12; i++) d.particles.spawn(heroPos.x + Math.sin(a2) * 1.4, heroPos.y + rnd(0.6, 1.8), heroPos.z + Math.cos(a2) * 1.4, { vx: rnd(-2, 2), vy: rnd(0, 2), vz: rnd(-2, 2), life: 0.35, s0: 0.22, s1: 0.03, c0: 0xffffff, c1: 0xffd24a, a: 1, drag: 2 }); }
        if (aegis.hp <= 0) aegisBreak(); if (n <= 0) return; } // Contra-golpe da Valquíria: o golpe some e ela gira por baixo dele
      { const w = wallBlocks(from, heroPos); if (w) { // Parede de Escudos: o golpe bate nos escudos espectrais
        const bx = heroPos.x + Math.sin(w.yaw) * 1.5, bz = heroPos.z + Math.cos(w.yaw) * 1.5; dmgText(new THREE.Vector3(bx, 2.4, bz), 'PAREDE', false, '#cfe6ff'); d.audio.block(); st.shake = Math.max(st.shake, 0.12);
        for (let i = 0; i < 14; i++) d.particles.spawn(bx + rnd(-0.6, 0.6), rnd(0.5, 1.6), bz + rnd(-0.6, 0.6), { vx: rnd(-2, 2), vy: rnd(0, 2.5), vz: rnd(-2, 2), life: 0.35, s0: 0.25, s1: 0.03, c0: 0xffffff, c1: 0x9ad7ff, a: 1, drag: 2 });
        if (w.tier >= 2 && from) { const src = enemies.nearest(from, 2.5); if (src) { const rf = Math.round(n * 0.5); if (enemies.hurt(src, rf, heroPos, 2)) killEnemy(src); dmgText(src.pos.clone().setY(src.pos.y + 2.4), `↩ ${rf}`, false, '#cfe6ff'); } }
        return; } }
      lastHurt = now; gainRes(5); n = Math.max(1, Math.round(n * (1 - Math.max(-0.3, Math.min(0.75, st.def + Math.min(0.3, buff.def + stance.def)))))); /* regra 01: defesa de buff/postura com teto de 30%, total com teto de 75% */
      // esquiva pela destreza (até 35%) e bloqueio pela defesa/escudo (até 30%, metade do dano) — a dança da luta
      if (st.sp.has('t_exo')) n = Math.max(1, Math.round(n * 0.8));
      const dodge = Math.min(0.35, 0.04 + (st.attrs?.dex ?? 0) * 0.012) + (st.sp.has('dh_cloak') ? 0.12 : 0);
      if (!h.guarding && Math.random() < dodge) { dmgText(heroPos.clone().setY(2.5), 'ESQUIVA!', true, '#9ad7ff'); d.audio.dash(); if (!h.actName) h.act('dodge'); return; }
      // aparo: só quem luta com lâmina, de frente; desvia o golpe, faísca e deixa o inimigo vulnerável (contra-ataque)
      const parryCh = h.kind === 'nordic' && !h.guarding ? Math.min(0.2, 0.05 + (st.attrs?.str ?? 0) * 0.006) : 0;
      if (parryCh > 0 && !h.actName && Math.random() < parryCh) {
        h.act('parry'); dmgText(heroPos.clone().setY(2.5), 'APARADO!', true, '#ffe6a0'); d.audio.parry(); onoma(heroPos.clone().setY(1.8), 'parry'); st.fury = Math.min(5, st.fury + 1); st.counterT = Math.max(st.counterT, 2); hitstop = Math.max(hitstop, performance.now() + 110); st.shake = Math.max(st.shake, 0.18);
        const yw = h.root.rotation.y; for (let i = 0; i < 14; i++) d.particles.spawn(heroPos.x + Math.sin(yw) * 0.8 + Math.cos(yw) * 0.3, 1.5, heroPos.z + Math.cos(yw) * 0.8 - Math.sin(yw) * 0.3, { vx: rnd(-3.5, 3.5), vy: rnd(0.5, 3.5), vz: rnd(-3.5, 3.5), life: 0.3, s0: 0.16, s1: 0.02, c0: 0xffffff, c1: 0xffc040, a: 1, drag: 2.5 });
        for (const e of enemies.list) if (e.alive && Math.hypot(e.pos.x - heroPos.x, e.pos.z - heroPos.z) < 3.2 + e.def.radius) { e.state = 'hurt'; e.slow = Math.max(e.slow ?? 0, 0.8); poiseHit(e, e.hpMax * 0.07); }
        return;
      }
      const blockCh = Math.min(0.3, 0.03 + st.def * 0.5 + (h.guarding ? 0.3 : 0));
      if (!(h.guarding && now - guardAt < 0.5) && Math.random() < blockCh) { n = Math.max(1, Math.round(n * 0.45)); dmgText(heroPos.clone().setY(2.5), 'BLOQUEIO', false, '#d9c08a'); d.audio.block(); onoma(heroPos.clone().setY(1.8), 'block'); h.blockHit(); if (!h.actName) h.act('block'); st.fury = Math.min(5, st.fury + 1); }
      if (h.guarding && now - guardAt < 0.5) { // bloqueio perfeito
        d.audio.hit(); h.blockHit(); st.counterT = 3.5; st.mp = Math.min(st.mpMax, st.mp + 15); if (st.sp.has('aegis')) { st.hp = Math.min(st.hpMax, st.hp + st.hpMax * 0.1); logMsg('✦ Égide: +10% de vida', '#7aff9a'); } if (st.sp.has('u_egide')) { for (const e of enemies.list) if (e.alive && e.active && Math.hypot(e.pos.x - heroPos.x, e.pos.z - heroPos.z) < 3.5 + e.def.radius) { if (enemies.hurt(e, n, heroPos, 4)) killEnemy(e); else { e.state = 'hurt'; e.t = -2; } dmgText(e.pos.clone().setY(e.pos.y + 2.4), `↩ ${n}`, true, '#ffe08a'); } } if (h.kind === 'technocrat') overcharge = true; st.fury = Math.min(5, st.fury + 1); st.shake = Math.max(st.shake, 0.2); hitstop = Math.max(hitstop, performance.now() + 60);
        dmgText(heroPos.clone().setY(2.5), 'PERFEITO!', true, '#ffe08a'); logMsg('🛡 Bloqueio perfeito: Investida liberada', '#ffe08a'); for (const e of enemies.list) if (e.alive && Math.hypot(e.pos.x - heroPos.x, e.pos.z - heroPos.z) < 4 + e.def.radius) poiseHit(e, e.hpMax * 0.09);
        const yw = h.root.rotation.y; for (let i = 0; i < 16; i++) d.particles.spawn(heroPos.x + Math.sin(yw) * 0.7, 1.3, heroPos.z + Math.cos(yw) * 0.7, { vx: rnd(-3, 3), vy: rnd(0, 3), vz: rnd(-3, 3), life: 0.4, s0: 0.25, s1: 0.03, c0: 0xffffff, c1: 0xffd24a, a: 1, drag: 2 });
        return;
      }
      if (h.guarding) {
        n = Math.max(1, Math.round(n * (h.kind === 'technocrat' && st.lvl >= 5 ? 0.06 : 0.12))); st.hp = Math.max(0, st.hp - n); d.audio.hit(); st.shake = Math.max(st.shake, 0.15);
        dmgText(heroPos.clone().setY(2.4), 'BLOQUEOU', false, '#cfd8e8'); h.blockHit();
        const yw = h.root.rotation.y; for (let i = 0; i < 8; i++) d.particles.spawn(heroPos.x + Math.sin(yw) * 0.7, 1.3, heroPos.z + Math.cos(yw) * 0.7, { vx: rnd(-2, 2), vy: rnd(0, 2), vz: rnd(-2, 2), life: 0.3, s0: 0.18, s1: 0.03, c0: 0xffffff, c1: 0xffb060, a: 0.8, drag: 2 });
      } else {
        st.hp = Math.max(0, st.hp - n); if (!h.actName || h.actName === 'hit') h.act('hit'); /* golpes e magias em andamento não são interrompidos */ d.audio.hurt(); st.shake = Math.max(st.shake, 0.3);
        dmgText(heroPos.clone().setY(2.2), n, false, '#ff7a6a');
      }
      if (st.hp > 0 && st.hp < st.hpMax * 0.3 && st.sp.has('u_fenrir') && now >= fenrirT) { fenrirT = now + 60; buff.dmg = Math.max(buff.dmg, 1.4); buff.dmgT = Math.max(buff.dmgT, 8); buff.leech = Math.max(buff.leech, 0.1); setTimeout(() => { if (!form) buff.leech = 0; }, 8000); logMsg('🐺 Elmo de Fenrir: a fúria do lobo desperta!', '#ff8a5a'); dmgText(heroPos.clone().setY(2.8), 'FÚRIA DO LOBO', true, '#ff8a5a'); }
      if (st.hp <= 0 && st.sp.has('r_calice') && now >= caliceT) { caliceT = now + 600; st.hp = Math.round(st.hpMax * 0.5); logMsg('🏆 O Cálice de Marghar recusa a sua morte.', '#ffd24a'); dmgText(heroPos.clone().setY(2.8), 'O CÁLICE TE SALVA', true, '#ffd24a'); for (let i = 0; i < 60; i++) { const a2 = rnd(0, 6.283); d.particles.spawn(heroPos.x, rnd(0.2, 2), heroPos.z, { vx: Math.cos(a2) * rnd(1, 4), vy: rnd(1, 4), vz: Math.sin(a2) * rnd(1, 4), life: 1, s0: 0.4, s1: 0.05, c0: 0xffffff, c1: 0xffd24a, a: 1 }); } }
      if (st.hp <= 0) {
        st.dead = true; st.hpLag = 0; document.body.classList.add('dead'); $('sigil').classList.add('dead');
        const revive = () => { st.hp = st.hpMax; st.mp = st.res.mode === 'fight' ? 0 : st.mpMax; st.dead = false; document.body.classList.remove('dead'); $('sigil').classList.remove('dead'); };
        if (onDeath) onDeath(revive); else setTimeout(revive, 3600);
      }
    },
    toggleMenu(force?: boolean) {
      st.menuOpen = force ?? !st.menuOpen; $('menu').classList.toggle('open', st.menuOpen);
      /* página Conta do menu: preenchida pelo main */
    },
    /** magias 6–10; target = ponto marcado (se a magia tiver mira) */
    useExtra(id: SkillId, yaw: number, cost: number, target?: { x: number; z: number }) {
      const h = d.getHero(), hp = h.root.position; if (st.menuOpen || st.dead) return false;
      if (n3Key() === 'mag' && need3.mag > 0.8 && Math.random() < 0.08) { st.hp = Math.max(1, st.hp - st.hpMax * 0.04); logMsg('🔮 A magia rachou na sua mão (−4% de vida).', '#ff9a8a'); }
      if (kitKey === 'tecno' && reactor.charge <= 0 && id !== 'kick') { logMsg('⚛ O reator está vazio: as magias da Academia não saem. Troque o Núcleo de Reator.', '#ffb060'); return false; }
      if ((cdX[id] ?? 0) > 0) return false; if (st.mp < cost && !(st.sp.has('u_draupnir') && now >= draupT)) { $('mp').animate([{ filter: 'brightness(2)' }, { filter: 'none' }], 250); return false; }
      const dir = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)); const tx = target ? target.x : hp.x + dir.x * 6, tz = target ? target.z : hp.z + dir.z * 6;
      const sc = skillScale(id); cost = Math.round(cost * sc.cost * (st.sp.has('m_staff') ? 0.8 : 1));
      const SND: Record<string, 'fire' | 'ice' | 'arcane' | 'shock' | 'earth' | 'holy'> = { smite: 'holy', consecrate: 'holy', avenging: 'holy', drain: 'arcane', batswarm: 'arcane', bloodnova: 'fire', nightform: 'arcane', howl: 'earth', rend: 'earth', kick: 'earth', hamstring: 'arcane', hatchet: 'arcane', shieldwall: 'holy', winter: 'ice', thunder: 'shock', valkyrie: 'holy', flame: 'fire', forge: 'fire', poison: 'earth', warcry: 'holy', spear: 'arcane', whirl: 'arcane', mark: 'holy', fenrir: 'earth', hammerthrow: 'earth', stonerune: 'earth', mountain: 'earth', avatar: 'earth', overcharge: 'shock', shocktrap: 'shock', medic: 'holy', railgun: 'shock', mech: 'shock', fireball: 'fire', meteor: 'fire', chainlight: 'shock', blizzard: 'ice', frostnova: 'ice', archon: 'arcane', blink: 'arcane', curse: 'arcane', hellhound: 'fire', demonform: 'fire', holyflask: 'holy', volley: 'arcane', huntform: 'holy' };
      const ok = (anim: Parameters<Hero3D['act']>[0] | null, cdm = 1) => { if (anim && !h.act(anim)) return false; cdX[id] = (CDX[id] ?? 10) * cdm; const free = st.sp.has('u_draupnir') && now >= draupT; if (free) { draupT = now + 9; logMsg('💍 Draupnir: magia de graça', '#ffe08a'); } st.mp -= free ? 0 : cost; if (st.sp.has('r_livro')) st.hp = Math.max(1, st.hp - st.hpMax * 0.02); st.lastCast = now; slotFlash(id); lastExtra = id; tierBurst(hp.x, hp.z, sc.tier); d.audio.spell(SND[id] ?? 'arcane'); return true; };
      const ringFx = (x: number, z: number, c: number, r = 1) => { r *= 1 + 0.25 * sc.tier; const ring = new THREE.Mesh(new THREE.RingGeometry(0.8 * r, 1.0 * r, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); ring.position.set(x, d.world.heightAt(x, z) + 0.12, z); fxAdd(ring); rings.push({ m: ring, t: 0 }); };
      switch (id) {
        /* ---- Guerreira Nórdica 1–20 ---- */
        case 'kick': if (!ok('kick')) return false; pending.push({ at: now + TEMPO * 0.62 * 0.42, fn: () => { const y = h.root.rotation.y, p0 = h.root.position, r = (sc.tier >= 3 ? 2.8 : 2.15) * sc.range;
          d.audio.block(); st.shake = Math.max(st.shake, 0.22); const fx0 = p0.x + Math.sin(y) * 1.1, fz0 = p0.z + Math.cos(y) * 1.1;
          for (let i = 0; i < 8 + sc.tier * 8; i++) d.particles.spawn(fx0 + rnd(-0.4, 0.4), 0.15, fz0 + rnd(-0.4, 0.4), { vx: Math.sin(y) * rnd(1, 4) + rnd(-1, 1), vy: rnd(0.3, 1.5), vz: Math.cos(y) * rnd(1, 4) + rnd(-1, 1), life: 0.7, s0: 0.3, s1: 0.9, c0: 0xc9b088, c1: 0x6a5a40, a: 0.35, drag: 2 });
          hitArc('kick', p0.x, p0.z, y, r, sc.tier >= 3 ? Math.PI * 0.75 : 0.75, 0.75, true, (e) => { const cut = enemies.interrupt(e); e.t = -(sc.tier >= 2 ? 1.5 : 0.8); e.vel.set(Math.sin(y) * 7, Math.cos(y) * 7); poiseHit(e, e.hpMax * 0.06);
            dmgText(e.pos.clone().setY(e.pos.y + 2.7), cut ? 'INTERROMPIDO!' : sc.tier >= 2 ? 'DERRUBADO' : 'ATORDOADO', cut, cut ? '#ffd24a' : '#e8d8b0'); }); } }); return true;
        case 'hamstring': if (!ok('lowcut')) return false; d.audio.swing(); pending.push({ at: now + TEMPO * 0.8 * 0.42, fn: () => { const y = h.root.rotation.y, p0 = h.root.position, r = 2.7 * sc.range, gy = d.world.heightAt(p0.x, p0.z);
          for (let i = 0; i < 26; i++) { const a = y + Math.PI * 0.55 - (i / 25) * Math.PI * 1.1; d.particles.spawn(p0.x + Math.sin(a) * r * 0.8, gy + 0.3, p0.z + Math.cos(a) * r * 0.8, { vx: Math.cos(a) * 1.5, vy: rnd(0, 0.6), vz: -Math.sin(a) * 1.5, life: 0.3 + i * 0.008, s0: 0.35, s1: 0.04, c0: 0xffffff, c1: sc.tier >= 1 ? 0xff5a4a : 0xcfd8e8, a: 0.9, drag: 3 }); }
          hitArc('hamstring', p0.x, p0.z, y, r, Math.PI * 0.7, 1.15, false, (e) => { const wasSlow = (e.slow ?? 0) > 0; e.slow = Math.max(e.slow ?? 0, 4 * sc.dur * (sc.tier >= 2 ? 1.5 : 1)); dmgText(e.pos.clone().setY(e.pos.y + 2.7), 'LENTO', false, '#9ad7ff');
            if (sc.tier >= 1) for (let k = 1; k <= 3; k++) pending.push({ at: now + k * 1.0, fn: () => { if (!e.alive) return; const dm = Math.round(3 + st.lvl * 1.2); if (enemies.hurt(e, dm, e.pos, 0)) killEnemy(e); dmgText(e.pos.clone().setY(e.pos.y + 2.0), dm, false, '#ff6a5a'); for (let q = 0; q < 5; q++) d.particles.spawn(e.pos.x, e.pos.y + 0.4, e.pos.z, { vx: rnd(-1, 1), vy: rnd(0.5, 2), vz: rnd(-1, 1), life: 0.5, s0: 0.15, s1: 0.04, c0: 0xff4a3a, c1: 0x7a0a0a, a: 1, g: 6 }); } });
            if (sc.tier >= 3 && wasSlow) { e.state = 'hurt'; e.t = -1.5; dmgText(e.pos.clone().setY(e.pos.y + 3.0), 'DERRUBADO', true, '#ffd24a'); } }); } }); return true;
        case 'hatchet': if (!ok('throw')) return false; d.audio.swing(); pending.push({ at: now + TEMPO * 0.78 * 0.46, fn: () => { const n = sc.tier >= 2 ? 2 : 1;
          for (let k = 0; k < n; k++) { const a = yaw + (n > 1 ? (k ? 0.09 : -0.09) : 0), v = new THREE.Vector3(Math.sin(a), 0, Math.cos(a)).multiplyScalar(19); const from = h.handPos(new THREE.Vector3()); from.y = Math.max(from.y, 1.2);
            bolts.push({ p: from, v, life: 0.58 * sc.range, mul: 1.35, sk: 'hatchet', m: mkHatchet(), hit: new Set(), ricochet: sc.tier >= 1 && sc.tier < 3 ? 1 : 0, pierce: sc.tier >= 3, boomer: sc.tier >= 3 ? 0.42 * sc.range : undefined, col: 0xcfd8e8, onHit: (e) => poiseHit(e, e.hpMax * 0.03) }); } } }); return true;
        case 'shieldwall': if (!ok('plant')) return false; pending.push({ at: now + TEMPO * 0.82 * 0.52, fn: () => { const y = h.root.rotation.y, p0 = h.root.position, x = p0.x + Math.sin(y) * 1.6, z = p0.z + Math.cos(y) * 1.6, w = (4 + (sc.tier >= 2 ? 1.5 : 0)) * sc.area;
          walls.push({ g: mkWall(x, z, y, w, sc.tier), x, z, yaw: y, w, t: 0, dur: 4 * sc.dur, tier: sc.tier }); d.audio.boom(); st.shake = Math.max(st.shake, 0.35);
          for (let i = 0; i < 30; i++) { const u = rnd(-w / 2, w / 2); d.particles.spawn(x + Math.cos(y) * u, 0.2, z - Math.sin(y) * u, { vx: Math.sin(y) * rnd(0.5, 2.5), vy: rnd(0.5, 2), vz: Math.cos(y) * rnd(0.5, 2.5), life: 0.8, s0: 0.35, s1: 0.9, c0: 0xc9b088, c1: 0x6a5a40, a: 0.35, drag: 2 }); }
          hitArc('shieldwall', p0.x, p0.z, y, 2.4, 0.9, 0.6, true, (e) => { e.vel.set(Math.sin(y) * 6, Math.cos(y) * 6); }); } }); return true;
        case 'winter': if (!ok('breath')) return false; pending.push({ at: now + TEMPO * 0.9 * 0.56, fn: () => { const p0 = h.root.position; breaths.push({ x: p0.x, z: p0.z, yaw, r: 5.5 * sc.range, t: 0, dur: 0.75, tier: sc.tier, hit: new Set(), mul: 0.95 }); d.audio.spell('ice');
          if (sc.tier >= 1) for (const k of [0.45, 0.85]) { const cx = p0.x + Math.sin(yaw) * 5.5 * sc.range * k, cz = p0.z + Math.cos(yaw) * 5.5 * sc.range * k, rr = 1.2 + k * 1.1, gy = d.world.heightAt(cx, cz); const fm = new THREE.Mesh(new THREE.CircleGeometry(rr, 30).rotateX(-Math.PI / 2), frostMat.clone()); fm.position.set(cx, gy + 0.05, cz); fm.renderOrder = 2; fxAdd(fm); frosts.push({ m: fm, x: cx, z: cz, r: rr, t: 0 }); } } }); return true;
        case 'thunder': if (kitKey === 'tecno' && techLook) { if (!ok('cast')) return false; pending.push({ at: now + TEMPO * 0.3, fn: () => { const gp = techLook!.gauntlet(new THREE.Vector3()); techLook!.charge(1); d.audio.spell('shock'); spellLight.position.copy(gp); spellLight.color.setHex(0xbff4ff); spellLight.intensity = 45;
            for (let k = 0; k < 7; k++) { const a2 = rnd(0, 6.283), b2 = rnd(-0.6, 0.9); bolt3d(gp, gp.clone().add(new THREE.Vector3(Math.cos(a2) * rnd(0.4, 1.1), b2, Math.sin(a2) * rnd(0.4, 1.1))), k % 2 ? 0xcff6ff : 0x6ad0ff); }
            for (let i = 0; i < 36; i++) d.particles.spawn(gp.x, gp.y, gp.z, { vx: rnd(-4, 4), vy: rnd(-2, 4), vz: rnd(-4, 4), life: 0.4, s0: 0.25, s1: 0.03, c0: 0xffffff, c1: 0x6ab0ff, a: 1, drag: 2 });
            thunderN = 3 + (sc.tier >= 1 ? 1 : 0); thunderT = 10 * sc.dur; thunderTier = sc.tier; h.setAura(true); logMsg(`⚡ Manopla de Tesla: os próximos ${thunderN} golpes descarregam choque`, '#9ad0ff');
            if (sc.tier >= 3) { const p0 = h.root.position; for (const e of enemies.list) if (e.alive && e.active && Math.hypot(e.pos.x - p0.x, e.pos.z - p0.z) < 3.8 + e.def.radius) { const ep = e.pos.clone().setY(e.pos.y + 1); bolt3d(gp, ep, 0xcfe6ff); const dm = Math.round((14 + st.lvl * 4) * sc.dmg); if (enemies.hurt(e, dm, p0, 2)) killEnemy(e); dmgText(ep.clone().setY(ep.y + 1.5), dm, true, '#9ad0ff'); } } } }); return true; }
        case 'thunder': if (!ok('skyraise')) return false; pending.push({ at: now + TEMPO * 0.95 * 0.32, fn: () => { const tip = h.weaponTip(new THREE.Vector3()), top = tip.clone().add(new THREE.Vector3(rnd(-1, 1), 16, rnd(-1, 1)));
          bolt3d(top, tip, 0xcfe6ff); bolt3d(top.clone().add(new THREE.Vector3(0.6, 0, -0.4)), tip, 0x8ab8ff); spellLight.position.copy(tip); spellLight.color.setHex(0xbfe0ff); spellLight.intensity = 60; d.audio.boom(); st.shake = Math.max(st.shake, 0.35);
          for (let i = 0; i < 40; i++) d.particles.spawn(tip.x, tip.y, tip.z, { vx: rnd(-4, 4), vy: rnd(-2, 4), vz: rnd(-4, 4), life: 0.45, s0: 0.3, s1: 0.03, c0: 0xffffff, c1: 0x6ab0ff, a: 1, drag: 2 });
          thunderN = 3 + (sc.tier >= 1 ? 1 : 0); thunderT = 10 * sc.dur; thunderTier = sc.tier; h.setAura(true); logMsg(`⚡ Lâmina Trovejante: os próximos ${thunderN} golpes eletrificam`, '#9ad0ff');
          if (sc.tier >= 3) { const p0 = h.root.position; for (const e of enemies.list) if (e.alive && e.active && Math.hypot(e.pos.x - p0.x, e.pos.z - p0.z) < 3.8 + e.def.radius) { const ep = e.pos.clone().setY(e.pos.y + 1); bolt3d(ep.clone().setY(ep.y + 14), ep, 0xcfe6ff); const dm = Math.round((14 + st.lvl * 4) * sc.dmg); if (enemies.hurt(e, dm, p0, 2)) killEnemy(e); dmgText(ep.clone().setY(ep.y + 1.5), dm, true, '#9ad0ff'); } } } }); return true;
        case 'valkyrie': if (!ok('stance')) return false; valkT = 1.5; valkTier = st.sp.has('r_pena') ? 3 : sc.tier; ringFx(hp.x, hp.z, 0xffe08a, 1.2); d.audio.chime(); dmgText(hp.clone().setY(2.6), 'EM GUARDA', false, '#ffe08a'); return true;
        case 'warcry': if (!ok('cast')) return false; buff.dmg = 1.25; buff.dmgT = 8; d.audio.boom(); st.shake = Math.max(st.shake, 0.3); ringFx(hp.x, hp.z, 0xffb070, 1.5); logMsg('📣 Grito de Guerra: +25% de dano por 8 s', '#ffb070');
          for (const e of enemies.list) if (e.alive && e.active && Math.hypot(e.pos.x - hp.x, e.pos.z - hp.z) < 8 && !e.def.passive) { e.state = 'chase'; e.t = 0; } for (let i = 0; i < 40; i++) { const a = rnd(0, 6.283); d.particles.spawn(hp.x, 1.5, hp.z, { vx: Math.cos(a) * rnd(3, 8), vy: rnd(0, 2), vz: Math.sin(a) * rnd(3, 8), life: 0.6, s0: 0.6, s1: 0.05, c0: 0xffffff, c1: 0xffb070, a: 1, drag: 2.5 }); } return true;
        case 'spear': if (!ok('throw')) return false; d.audio.swing(); pending.push({ at: now + TEMPO * 0.44, fn: () => { const from = h.handPos(new THREE.Vector3()); from.y = Math.max(from.y, 1.2); const gn = st.sp.has('u_gungnir'); bolts.push({ p: from, v: dir.clone().multiplyScalar(28), life: gn ? 0.9 : 0.5, mul: gn ? 4.4 : 2.2, pierce: true, hit: new Set(), rootLast: 3, col: gn ? 0xffe9a0 : 0xcfe0ff, big: true, boomer: gn ? 0.45 : undefined }); } }); return true;
        case 'whirl': if (!ok('combo4')) return false; d.audio.swing(); pending.push({ at: now + TEMPO * 0.95, fn: () => { h.act('combo4'); } }); for (const t of [0.3, 0.72, 1.2, 1.62]) pending.push({ at: now + TEMPO * t, fn: () => { skStrike('combo', h, h.root.rotation.y, 1.3, 3.4, Math.PI, t > 1.5); d.audio.swing(); } }); return true;
        case 'mark': { const e = enemies.nearest(hp, 10); if (!e) { logMsg('Nenhum inimigo perto para marcar.', '#ff9a8a'); return false; } if (!ok('cast', 1)) return false; e.mark = now + 6; d.audio.chime(); dmgText(e.pos.clone().setY(e.pos.y + 2.4), 'MARCADO', true, '#ffe08a'); ringFx(e.pos.x, e.pos.z, 0xffe08a); return true; }
        case 'fenrir': if (kitKey === 'lob' && skyNight <= 0.5) { logMsg('🌕 A besta só desperta à noite. De dia você é o licantropo: homem, maior e mais forte.', '#c8a070'); return false; } if (!ok('cast')) return false; form = { id: 'fenrir', t: 10, scale: kitKey === 'lob' ? 1.0 : 1.08 }; buff.dmg = 2; buff.dmgT = 10; buff.move = 1.3; buff.moveT = 10; buff.leech = 0.15; h.setAura(true); d.audio.boom(); st.shake = Math.max(st.shake, 0.5); ringFx(hp.x, hp.z, 0xff6a4a, 2); logMsg(kitKey === 'lob' ? '🐺 Forma da Besta: dano ×2, velocidade +30%, 15% de roubo de vida' : '🐺 Fúria de Fenrir: dano ×2, velocidade +30%', '#ff6a4a'); for (let i = 0; i < 60; i++) d.particles.spawn(hp.x + rnd(-0.5, 0.5), rnd(0, 2), hp.z + rnd(-0.5, 0.5), { vx: rnd(-1, 1), vy: rnd(1, 4), vz: rnd(-1, 1), life: 1, s0: 0.6, s1: 0.05, c0: 0xffffff, c1: 0xff4a2a, a: 1 }); return true;
        case 'hammerthrow': if (!ok('throw')) return false; d.audio.swing(); pending.push({ at: now + TEMPO * 0.44, fn: () => { const from = h.handPos(new THREE.Vector3()); from.y = Math.max(from.y, 1.1); bolts.push({ p: from, v: dir.clone().multiplyScalar(16), life: 1.15, mul: 1.6, pierce: true, hit: new Set(), boomer: 0.55, col: 0xd0d4dc, big: true }); } }); return true;
        case 'stonerune': { if (!ok('cast')) return false; const zm = new THREE.Mesh(new THREE.CircleGeometry(3.5 * sc.area, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xc8a050, transparent: true, opacity: 0.25, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); zm.position.set(tx, d.world.heightAt(tx, tz) + 0.1, tz); fxAdd(zm); zones.push({ x: tx, z: tz, r: 3.5 * sc.area, t: 6 * sc.dur, m: zm }); ringFx(tx, tz, 0xc8a050, 3); d.audio.boom(); return true; }
        case 'forge': if (!ok('drink')) return false; buff.burnT = 8; buff.dmg = Math.max(buff.dmg, 1.2); buff.dmgT = Math.max(buff.dmgT, 8); h.setAura(true); d.audio.cast(); logMsg('🔥 Forja Viva: golpes incendeiam por 8 s', '#ff8a30'); return true;
        case 'mountain': { if (!ok('quake')) return false; pending.push({ at: now + TEMPO * 0.7, fn: () => { d.audio.boom(); st.shake = Math.max(st.shake, 0.6); for (let i = 1; i <= 4; i++) { const px = hp.x + dir.x * i * 1.5, pz = hp.z + dir.z * i * 1.5, gy = d.world.heightAt(px, pz); const m = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.55, 2.2, 7), new THREE.MeshToonMaterial({ color: 0x6e6252, gradientMap: ramp })); m.castShadow = true; m.position.set(px, gy - 1.3, pz); m.rotation.set(rnd(-0.1, 0.1), rnd(0, 3), rnd(-0.1, 0.1)); fxAdd(m); pillars.push({ m, t: -i * 0.08, y0: gy - 1.3 }); for (const e of enemies.list) if (e.alive && e.active && Math.hypot(e.pos.x - px, e.pos.z - pz) < 1.4 + e.def.radius) { skill = 'slam'; hitEnemy(e, 1.6, true, new THREE.Vector3(px, 0, pz)); skill = null; if (e.alive) { e.state = 'hurt'; e.t = -1; } } for (let k = 0; k < 14; k++) d.particles.spawn(px, gy + 0.2, pz, { vx: rnd(-2, 2), vy: rnd(2, 5), vz: rnd(-2, 2), life: 0.7, s0: 0.4, s1: 0.1, c0: 0xb09060, c1: 0x5a4a30, a: 1, g: 10 }); } } }); return true; }
        case 'avatar': if (!ok('drink')) return false; form = { id: 'avatar', t: 10, scale: 1.3 }; buff.dmg = 2; buff.dmgT = 10; buff.def = 0.2; buff.defT = 10; d.audio.boom(); st.shake = Math.max(st.shake, 0.6); ringFx(hp.x, hp.z, 0xa8a090, 2); logMsg('⛰ Avatar da Montanha: dano ×2, +30% tamanho', '#d8c8a8'); return true;
        case 'flame': if (!ok('shoot')) return false; flameT = 4.5; flameKind = 'fire'; flameMul = 0.55; flameReach = 9.5; flameYaw = yaw; h.freeze = true; h.scrub('shoot', 0.3); d.audio.cast(); logMsg('🔥 Lança-chamas: ande e mire com o mouse por 4,5 s', '#ff7a30'); return true;
        case 'poison': { if (!ok('throw')) return false; d.audio.swing(); pending.push({ at: now + TEMPO * 0.44, fn: () => { const pm = new THREE.Mesh(new THREE.CircleGeometry(2.8 * sc.area, 36).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x5ad04a, transparent: true, opacity: 0.35, depthWrite: false, fog: false })); pm.position.set(tx, d.world.heightAt(tx, tz) + 0.08, tz); fxAdd(pm); puddles.push({ x: tx, z: tz, r: 2.8 * sc.area, t: 7 * sc.dur, m: pm }); for (let k = 0; k < 24; k++) d.particles.spawn(tx + rnd(-1.5, 1.5), 0.3, tz + rnd(-1.5, 1.5), { vy: rnd(0.5, 2), life: 0.8, s0: 0.5, s1: 0.1, c0: 0xbaffa0, c1: 0x2a8a2a, a: 0.9 }); d.audio.boom(); } }); return true; }
        case 'overcharge': if (!ok('cast')) return false; overT = 3; d.audio.cast(); return true;
        case 'shocktrap': { if (mines.length >= 4) { logMsg('Máximo de 4 armadilhas/minas.', '#ff9a8a'); return false; } if (!ok('throw')) return false; const m = mkMine(tx, tz); (m.userData.lamp as THREE.Mesh).material = new THREE.MeshBasicMaterial({ color: 0xc8e8ff }); mines.push({ m, x: tx, z: tz, t: 0, r: 2.0, mul: 0.4 }); m.userData.shock = true; d.audio.swing(); return true; }
        case 'medic': if (!ok('cast')) return false; medicT = 10; hot = { t: 10, per: st.hpMax * 0.4 / 10 }; for (const e of enemies.list) if (e.burn) e.burn = 0; d.audio.heal(); logMsg('🩺 Drone Médico: cura por 10 s', '#7affd0'); return true;
        case 'railgun': if (!ok('shoot')) return false; h.freeze = true; setTimeout(() => { h.freeze = false; }, 900); for (let i = 0; i < 6; i++) pending.push({ at: now + TEMPO * i * 0.15, fn: () => { const from = h.weaponTip(new THREE.Vector3()); d.particles.spawn(from.x, from.y, from.z, { life: 0.3, s0: 0.6 + i * 0.25, s1: 0.1, c0: 0xffffff, c1: 0xffd070, a: 1 }); } });
          pending.push({ at: now + TEMPO * 1.0, fn: () => { const from = h.weaponTip(new THREE.Vector3()); from.y = Math.max(from.y, 1.0); const to = from.clone().addScaledVector(dir, 18); beam(from, to, 0xffd070, 0.12, 0.35); bolts.push({ p: from.clone(), v: dir.clone().multiplyScalar(60), life: 0.32, mul: 5, pierce: true, hit: new Set(), col: 0xffd070, big: true }); d.audio.boom(); st.shake = Math.max(st.shake, 0.5); } }); return true;
        case 'mech': if (!ok('cast')) return false; form = { id: 'mech', t: 12, scale: 1.25 }; buff.dmg = 2; buff.dmgT = 12; buff.def = 0.4; buff.defT = 12; h.setAura(true); d.audio.boom(); st.shake = Math.max(st.shake, 0.5); ringFx(hp.x, hp.z, 0x9ad7ff, 2); logMsg('🤖 Mecha de Combate: dano ×2, +40% de defesa', '#9ad7ff'); return true;
        /* ---- 25/10: golpes próprios do Paladino, do Vampiro e do Lobisomem ---- */
        case 'smite': { if (!ok('cast')) return false; const x = tx, z = tz, rad = 2.6 * sc.area; pending.push({ at: now + TEMPO * 0.45, fn: () => { const gy = d.world.heightAt(x, z), top = new THREE.Vector3(x, gy + 16, z), bot = new THREE.Vector3(x, gy + 0.1, z);
            beam(top, bot, 0xfff0b0, 0.55, 0.32); beam(top, bot, 0xffd24a, 1.1, 0.22); spellLight.position.set(x, gy + 2, z); spellLight.color.setHex(0xffe08a); spellLight.intensity = 70; d.audio.boom(); st.shake = Math.max(st.shake, 0.45); ringFx(x, z, 0xffe08a, rad / 1.6);
            for (let i = 0; i < 46; i++) { const a = rnd(0, 6.283), rr2 = rnd(0, rad); d.particles.spawn(x + Math.cos(a) * rr2, gy + 0.2, z + Math.sin(a) * rr2, { vx: Math.cos(a) * 1.5, vy: rnd(2, 6), vz: Math.sin(a) * 1.5, life: 0.8, s0: 0.35, s1: 0.04, c0: 0xffffff, c1: 0xffc84a, a: 1, drag: 1.5 }); }
            hitArc('smite', x, z, 0, rad, Math.PI, 2.2, true, (e) => { if (DARK_T.has(e.type)) { e.state = 'hurt'; e.t = -1.4 * sc.dur; dmgText(e.pos.clone().setY(e.pos.y + 2.8), 'PURIFICADO', true, '#ffe08a'); } }); } }); return true; }
        case 'consecrate': { if (!ok('cast')) return false; const x = hp.x, z = hp.z, rad = 3.6 * sc.area, gy = d.world.heightAt(x, z);
          const m = new THREE.Mesh(new THREE.CircleGeometry(rad, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffd86a, transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); m.position.set(x, gy + 0.06, z); fxAdd(m);
          const rim = new THREE.Mesh(new THREE.RingGeometry(rad - 0.12, rad, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xfff0b0, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); rim.position.set(x, gy + 0.07, z); fxAdd(rim);
          d.audio.chime(); let tk = 0; ticks.push({ t: 6 * sc.dur, fn: (dt2, left) => { tk -= dt2; (m.material as THREE.MeshBasicMaterial).opacity = 0.16 + 0.08 * Math.sin(now * 4); (rim.material as THREE.MeshBasicMaterial).opacity = Math.min(0.6, left);
            if (Math.random() < dt2 * 22) { const a = rnd(0, 6.283), rr2 = rnd(0, rad); d.particles.spawn(x + Math.cos(a) * rr2, gy + 0.1, z + Math.sin(a) * rr2, { vy: rnd(0.8, 1.8), life: 1.1, s0: 0.18, s1: 0.03, c0: 0xffffff, c1: 0xffd24a, a: 0.9 }); }
            if (tk <= 0) { tk = 0.5; hitArc('consecrate', x, z, 0, rad, Math.PI, 0.42, false); const hh = d.getHero().root.position; if (Math.hypot(hh.x - x, hh.z - z) < rad) st.hp = Math.min(st.hpMax, st.hp + st.hpMax * 0.015 * (1 + stance.heal)); } },
            end: () => { d.scene.remove(m); d.scene.remove(rim); } }); return true; }
        case 'avenging': { if (!ok('cast')) return false; form = { id: 'avenging', t: 12, scale: 1.08 }; buff.dmg = 1.8; buff.dmgT = 12; buff.def = 0.25; buff.defT = 12; buff.leech = 0.08; h.setAura(true); d.audio.boom(); st.shake = Math.max(st.shake, 0.4); ringFx(hp.x, hp.z, 0xffe08a, 2); logMsg('✦ Asas da Vingança: dano ×1,8, +25% de defesa, cada golpe cura', '#ffe08a');
          ticks.push({ t: 12, fn: () => { const hh = d.getHero().root, yy = hh.rotation.y, bx = -Math.sin(yy) * 0.35, bz = -Math.cos(yy) * 0.35; for (const s of [-1, 1]) for (let k = 0; k < 2; k++) { const f = rnd(0.2, 1), wx = Math.cos(yy) * s * (0.3 + f * 1.3), wz = -Math.sin(yy) * s * (0.3 + f * 1.3); d.particles.spawn(hh.position.x + bx + wx, hh.position.y + 1.5 + f * 0.9 - f * f * 0.6, hh.position.z + bz + wz, { vy: 0.3, life: 0.35, s0: 0.2, s1: 0.04, c0: 0xffffff, c1: 0xffd24a, a: 0.85 }); } } }); return true; }
        case 'drain': { const e = enemies.nearest(hp, 7 * sc.range); if (!e) { logMsg('Nenhuma presa perto o bastante.', '#ff9a8a'); return false; } if (!ok('cast')) return false; d.audio.spell('arcane'); let tk = 0;
          ticks.push({ t: 2 * sc.dur, fn: (dt2) => { if (!e.alive) return; const hh = d.getHero().root.position; if (Math.hypot(e.pos.x - hh.x, e.pos.z - hh.z) > 9) return; const a = e.pos.clone().setY(e.pos.y + 1.1), b = hh.clone().setY(hh.y + 1.2); beam(a, b, kitKey === 'bru' ? 0x6a2ac0 : 0xb0101a, 0.07, 0.06);
            if (Math.random() < dt2 * 40) { const k = Math.random(); d.particles.spawn(a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k + rnd(-0.2, 0.2), a.z + (b.z - a.z) * k, { vx: (b.x - a.x) * 1.2, vy: 0, vz: (b.z - a.z) * 1.2, life: 0.4, s0: 0.16, s1: 0.04, c0: 0xff3a3a, c1: 0x6a0008, a: 1 }); }
            tk -= dt2; if (tk <= 0) { tk = 0.25; const dm = Math.round((4 + st.lvl * 1.4) * sc.dmg); if (enemies.hurt(e, dm, e.pos, 0)) killEnemy(e); dmgText(e.pos.clone().setY(e.pos.y + 2.2), dm, false, '#ff4a5a'); st.hp = Math.min(st.hpMax, st.hp + dm * (1 + stance.heal)); gainRes(2); } } }); return true; }
        case 'batswarm': { if (!ok('cast')) return false; const x = tx, z = tz, rad = 3 * sc.area, gy = d.world.heightAt(x, z); d.audio.swing(); let tk = 0;
          ticks.push({ t: 5 * sc.dur, fn: (dt2) => { for (let k = 0; k < 3; k++) if (Math.random() < dt2 * 30) { const a = rnd(0, 6.283), rr2 = rnd(0.3, rad); d.particles.spawn(x + Math.cos(a) * rr2, gy + rnd(0.6, 2.6), z + Math.sin(a) * rr2, { vx: -Math.sin(a) * 4, vy: rnd(-0.5, 0.5), vz: Math.cos(a) * 4, life: 0.45, s0: 0.22, s1: 0.12, c0: 0x1a0a10, c1: 0x0a0408, a: 1, flit: 1 }); }
            tk -= dt2; if (tk <= 0) { tk = 0.4; for (const e of enemies.list) if (e.alive && e.active && Math.hypot(e.pos.x - x, e.pos.z - z) < rad + e.def.radius) { e.slow = Math.max(e.slow ?? 0, 0.6); const dm = Math.round((3 + st.lvl * 1.1) * sc.dmg); if (enemies.hurt(e, dm, e.pos, 0)) killEnemy(e); dmgText(e.pos.clone().setY(e.pos.y + 2.0), dm, false, '#c86a8a'); st.hp = Math.min(st.hpMax, st.hp + dm * 0.5 * (1 + stance.heal)); } } } }); return true; }
        case 'bloodnova': { if (!ok('cast')) return false; pending.push({ at: now + TEMPO * 0.35, fn: () => { const hh = d.getHero().root.position, rad = 4.5 * sc.area; let before = 0; const near = enemies.list.filter((e) => e.alive && e.active && Math.hypot(e.pos.x - hh.x, e.pos.z - hh.z) < rad + e.def.radius); for (const e of near) before += e.hp;
            for (let i = 0; i < 70; i++) { const a = rnd(0, 6.283); d.particles.spawn(hh.x, hh.y + 1.1, hh.z, { vx: Math.cos(a) * rnd(4, 9), vy: rnd(-0.5, 2.5), vz: Math.sin(a) * rnd(4, 9), life: 0.6, s0: 0.32, s1: 0.06, c0: 0xff3a3a, c1: 0x4a0006, a: 1, drag: 2.2 }); }
            ringFx(hh.x, hh.z, 0xc0101a, rad / 1.4); d.audio.boom(); st.shake = Math.max(st.shake, 0.5); hitArc('bloodnova', hh.x, hh.z, 0, rad, Math.PI, 1.8, true);
            let after = 0; for (const e of near) after += Math.max(0, e.hp); const healed = Math.round((before - after) * 0.3 * (1 + stance.heal)); if (healed > 0) { st.hp = Math.min(st.hpMax, st.hp + healed); dmgText(hh.clone().setY(hh.y + 2.6), `+${healed}`, false, '#ff7a8a'); } } }); return true; }
        case 'nightform': { if (!ok('cast')) return false; form = { id: 'nightform', t: 12, scale: 1.0 }; buff.dmg = 1.8; buff.dmgT = 12; buff.move = 1.4; buff.moveT = 12; buff.leech = 0.25; h.setAura(true); d.audio.boom(); ringFx(hp.x, hp.z, 0x8a0a1a, 2); logMsg('🦇 Forma do Conde: dano ×1,8, +40% de velocidade, 25% de roubo de vida', '#ff6a7a');
          ticks.push({ t: 12, fn: (dt2) => { const hh = d.getHero().root.position; if (Math.random() < dt2 * 18) { const a = rnd(0, 6.283); d.particles.spawn(hh.x + Math.cos(a) * 0.8, hh.y + rnd(0.6, 2.2), hh.z + Math.sin(a) * 0.8, { vx: -Math.sin(a) * 3, vy: rnd(0, 1), vz: Math.cos(a) * 3, life: 0.6, s0: 0.2, s1: 0.1, c0: 0x2a0a14, c1: 0x0a0408, a: 1, flit: 1 }); } } }); return true; }
        case 'howl': { if (!ok('cast')) return false; d.audio.boom(); st.shake = Math.max(st.shake, 0.35); const rad = 9 * sc.area; const BR = kitKey === 'bru'; ringFx(hp.x, hp.z, BR ? 0xa060ff : 0xc8d8ff, rad / 2.2); buff.dmg = Math.max(buff.dmg, 1.2); buff.dmgT = Math.max(buff.dmgT, 8); logMsg(BR ? '🜏 Grito do Abismo: quem estava perto ficou paralisado de pavor; +20% de dano por 8 s' : '🐺 Uivo da Lua: os inimigos perto ficam paralisados de medo; +20% de dano por 8 s', BR ? '#c8a0ff' : '#c8d8ff');
          for (let i = 0; i < 30; i++) d.particles.spawn(hp.x, hp.y + 1.8, hp.z, { vx: rnd(-1, 1), vy: rnd(2, 4), vz: rnd(-1, 1), life: 1, s0: 0.3, s1: 0.8, c0: 0xdde8ff, c1: 0x6a7aa0, a: 0.5, drag: 1.5 });
          for (const e of enemies.list) if (e.alive && e.active && !e.def.passive && Math.hypot(e.pos.x - hp.x, e.pos.z - hp.z) < rad) { e.state = 'hurt'; e.t = -2 * sc.dur; dmgText(e.pos.clone().setY(e.pos.y + 2.7), 'MEDO', false, '#c8d8ff'); } return true; }
        case 'rend': { if (!ok('combo1')) return false; const yy = h.root.rotation.y;
          for (const [k, an] of [[0, 'combo1'], [1, 'combo2'], [2, 'combo3']] as [number, Parameters<Hero3D['act']>[0]][]) pending.push({ at: now + TEMPO * (0.18 + k * 0.24), fn: () => { if (k) h.act(an, true); d.audio.swing(); const p0 = h.root.position;
            for (let i = 0; i < 14; i++) { const a = yy + (k % 2 ? -0.6 : 0.6) - (i / 13) * (k % 2 ? -1.2 : 1.2); d.particles.spawn(p0.x + Math.sin(a) * 1.6, p0.y + 1.1 + (i / 13 - 0.5) * 0.6, p0.z + Math.cos(a) * 1.6, { life: 0.22, s0: 0.14, s1: 0.03, c0: 0xffd0d0, c1: 0xb3202f, a: 1 }); }
            hitArc('rend', p0.x, p0.z, yy, 2.6 * sc.range, 0.9, 0.8, k === 2, k === 2 ? (e) => { for (let q = 1; q <= 4; q++) pending.push({ at: now + q * 1.0, fn: () => { if (!e.alive) return; const dm = Math.round((3 + st.lvl * 1.2) * sc.dmg); if (enemies.hurt(e, dm, e.pos, 0)) killEnemy(e); dmgText(e.pos.clone().setY(e.pos.y + 2.0), dm, false, '#ff6a6a'); d.particles.spawn(e.pos.x, e.pos.y + 1, e.pos.z, { vy: -1, life: 0.5, s0: 0.12, s1: 0.04, c0: 0xc0101a, c1: 0x4a0006, a: 1, g: 6 }); } }); dmgText(e.pos.clone().setY(e.pos.y + 2.8), 'SANGRANDO', false, '#ff6a6a'); } : undefined); } }); return true; }
        /* ---- 25/10 (noite): Égide, Escudo Arremessado, Martelo da Conversão ---- */
        case 'aegis': { if (!ok('cast')) return false; aegis?.m && d.scene.remove(aegis.m); const A = mkAegis(), max = Math.round(st.hpMax * (0.3 + 0.05 * sc.tier)); aegis = { hp: max, max, m: A.m, u: A.u, tier: sc.tier }; const me = aegis; d.audio.chime(); ringFx(hp.x, hp.z, 0xffe08a, 1.4);
          for (let i = 0; i < 40; i++) { const a = rnd(0, 6.283); d.particles.spawn(hp.x + Math.cos(a) * 1.4, hp.y + 0.1, hp.z + Math.sin(a) * 1.4, { vy: rnd(1.5, 3.5), life: 0.8, s0: 0.22, s1: 0.03, c0: 0xffffff, c1: 0xffd24a, a: 1 }); }
          let tt = 0; ticks.push({ t: 8 * sc.dur, fn: (dt2, left) => { if (aegis !== me) return; tt += dt2; const hh = d.getHero().root.position; me.m.position.set(hh.x, hh.y + 0.02, hh.z); me.u.t.value = tt; me.u.hit.value = Math.max(0, me.u.hit.value - dt2 * 4); me.u.op.value = Math.min(1, tt * 4, left * 2) * (0.55 + 0.45 * me.hp / me.max); me.m.scale.set(1 + Math.sin(tt * 3) * 0.015, 1.25, 1 + Math.sin(tt * 3) * 0.015);
            if (Math.random() < dt2 * 10) { const a = rnd(0, 6.283), ph = rnd(0.2, 1.4); d.particles.spawn(hh.x + Math.cos(a) * Math.sin(ph) * 1.45, hh.y + Math.cos(ph) * 1.8, hh.z + Math.sin(a) * Math.sin(ph) * 1.45, { vy: 0.4, life: 0.6, s0: 0.12, s1: 0.02, c0: 0xffffff, c1: 0xffd24a, a: 0.9 }); } },
            end: () => { if (aegis === me) { aegis = null; d.scene.remove(me.m); } } }); logMsg(`✦ Égide de Auréon: a cúpula bebe até ${max} de dano por ${Math.round(8 * sc.dur)} s`, '#ffe08a'); return true; }
        case 'shieldthrow': { if (!ok('throw')) return false; d.audio.swing(); pending.push({ at: now + TEMPO * 0.42, fn: () => {
          const rg = (h as unknown as { rig?: { shield?: () => THREE.Object3D | null } }).rig, sh = rg?.shield?.() ?? null, real = !!(sh && sh.visible && sh.children.length);
          const disc = new THREE.Group(); let spinner: THREE.Object3D;
          if (real) { const c = sh!.clone(true); c.position.set(0, 0, 0); c.rotation.set(0, 0, 0); c.scale.setScalar(1.15); c.traverse((o) => { o.visible = true; }); spinner = new THREE.Group(); spinner.add(c); c.rotation.x = -Math.PI / 2; sh!.visible = false; }
          else { spinner = new THREE.Group(); const lm = new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }); const face = new THREE.Mesh(new THREE.CircleGeometry(0.38, 28), lm); face.rotation.x = -Math.PI / 2; spinner.add(face); const rim = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.04, 6, 28), new THREE.MeshBasicMaterial({ color: 0xfff6d0 })); rim.rotation.x = Math.PI / 2; spinner.add(rim); }
          disc.add(spinner); const pos = h.handPos(new THREE.Vector3()); pos.y = Math.max(pos.y, 1.15); disc.position.copy(pos); fxAdd(disc);
          const hit = new Set<Enemy>(); let left = 3 + (sc.tier >= 2 ? 1 : 0), back = false, life = 4, cur: Enemy | null = null; const range = 10 * sc.range;
          { let best: Enemy | null = null, bs = 1e9; for (const e of enemies.list) { if (!e.alive || !e.active || e.def.passive) continue; const dx = e.pos.x - pos.x, dz = e.pos.z - pos.z, along = dx * dir.x + dz * dir.z, lat = Math.abs(dx * dir.z - dz * dir.x); if (along < 0 || along > range || lat > 2.4 + e.def.radius) continue; const sco = along + lat * 2; if (sco < bs) { bs = sco; best = e; } } cur = best; }
          const free = new THREE.Vector3(pos.x + dir.x * range, pos.y, pos.z + dir.z * range);
          ticks.push({ t: 5, fn: (dt2) => { life -= dt2; spinner.rotation.y += dt2 * 22; const hh = d.getHero(); let goal: THREE.Vector3;
            if (back || life < 0.6) { back = true; goal = hh.handPos(new THREE.Vector3()); goal.y = Math.max(goal.y, 1.1); } else if (cur && cur.alive) goal = cur.pos.clone().setY(cur.pos.y + 1.1); else goal = free;
            const dv = goal.clone().sub(disc.position), dd = dv.length(), stp = 21 * dt2;
            if (Math.random() < dt2 * 50) d.particles.spawn(disc.position.x, disc.position.y, disc.position.z, { vx: rnd(-0.3, 0.3), vy: rnd(-0.1, 0.3), vz: rnd(-0.3, 0.3), life: 0.35, s0: 0.22, s1: 0.03, c0: 0xffffff, c1: 0xffd24a, a: 0.9 });
            if (dd > stp) { disc.position.addScaledVector(dv.normalize(), stp); return; }
            disc.position.copy(goal);
            if (back) { life = -1; return; }
            if (cur && cur.alive) { const e = cur; hit.add(e); skill = 'shieldthrow'; hitEnemy(e, 1.3 * sc.dmg, true, disc.position.clone()); skill = null; d.audio.block(); st.shake = Math.max(st.shake, 0.15);
              if (e.alive) { enemies.interrupt(e); e.state = 'hurt'; e.t = -0.8; dmgText(e.pos.clone().setY(e.pos.y + 2.7), 'ATORDOADO', false, '#ffe08a'); }
              for (let k = 0; k < 14; k++) d.particles.spawn(goal.x, goal.y, goal.z, { vx: rnd(-3, 3), vy: rnd(0, 3), vz: rnd(-3, 3), life: 0.35, s0: 0.3, s1: 0.03, c0: 0xffffff, c1: 0xffd24a, a: 1, drag: 2 });
              left--; let nx: Enemy | null = null, bd = 7; if (left > 0) for (const o of enemies.list) if (o.alive && o.active && !hit.has(o) && !o.def.passive) { const q2 = Math.hypot(o.pos.x - e.pos.x, o.pos.z - e.pos.z); if (q2 < bd) { bd = q2; nx = o; } } cur = nx; if (!nx) back = true; }
            else back = true; },
            end: () => { d.scene.remove(disc); if (real && sh) sh.visible = true; d.audio.parry(); } }); } }); return true; }
        case 'conversion': { if (!ok('skyraise')) return false; const x = tx, z = tz, rad = 2.8 * sc.area, gy = d.world.heightAt(x, z), yy = yaw;
          const pivot = new THREE.Group(); pivot.position.set(x - Math.sin(yy) * 3.0, gy, z - Math.cos(yy) * 3.0); pivot.rotation.y = yy; const arm = new THREE.Group(); pivot.add(arm);
          const lm = (c: number, o: number) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
          const mats = [lm(0xffe08a, 0.55), lm(0xfff6d0, 0.85), lm(0xffc84a, 0.4)];
          const haft = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 3.0, 10), mats[0]); haft.position.y = 1.5; arm.add(haft);
          for (const yb of [0.5, 1.4, 2.3]) { const w = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.035, 6, 16), mats[1]); w.rotation.x = Math.PI / 2; w.position.y = yb; arm.add(w); }
          const headG = new THREE.Group(); headG.position.y = 3.2; arm.add(headG);
          const hm = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 1.5, 8), mats[0]); hm.rotation.z = Math.PI / 2; headG.add(hm);
          const core = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 1.56, 8), mats[1]); core.rotation.z = Math.PI / 2; headG.add(core);
          for (const s of [-1, 1]) { const face = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.12, 8), mats[1]); face.rotation.z = Math.PI / 2; face.position.x = s * 0.78; headG.add(face); const sun = new THREE.Mesh(new THREE.RingGeometry(0.18, 0.3, 12), mats[1]); sun.rotation.y = s * Math.PI / 2; sun.position.x = s * 0.85; headG.add(sun); }
          const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTexture(64, [[0, 'rgba(255,240,180,.9)'], [1, 'rgba(255,200,80,0)']]), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); halo.scale.set(4.5, 4.5, 1); headG.add(halo);
          fxAdd(pivot); arm.rotation.x = -0.25; let tt = 0, struck = false; const DUR = 1.5;
          ticks.push({ t: DUR + 0.6, fn: (dt2) => { tt += dt2; const k = tt / DUR; const fadeIn = Math.min(1, tt * 3), fadeOut = struck ? Math.max(0, 1 - (tt - DUR * 0.62) * 1.6) : 1; for (const m of mats) m.opacity = (m === mats[1] ? 0.85 : m === mats[0] ? 0.55 : 0.4) * fadeIn * fadeOut; (halo.material as THREE.SpriteMaterial).opacity = 0.8 * fadeIn * fadeOut;
            arm.rotation.x = k < 0.42 ? -0.25 - 0.4 * Math.sin(k / 0.42 * Math.PI / 2) : Math.min(1.42, -0.65 + Math.pow((k - 0.42) / 0.2, 2) * 2.07);
            if (Math.random() < dt2 * 30) { const hw = headG.getWorldPosition(new THREE.Vector3()); d.particles.spawn(hw.x + rnd(-0.6, 0.6), hw.y + rnd(-0.4, 0.4), hw.z + rnd(-0.6, 0.6), { vy: -0.5, life: 0.5, s0: 0.25, s1: 0.03, c0: 0xffffff, c1: 0xffd24a, a: 1 }); }
            if (!struck && k >= 0.62) { struck = true; d.audio.boom(); d.audio.chime(); st.shake = Math.max(st.shake, 0.7); spellLight.position.set(x, gy + 2, z); spellLight.color.setHex(0xffe08a); spellLight.intensity = 90; ringFx(x, z, 0xffe08a, rad / 1.3); ringFx(x, z, 0xfff6d0, rad / 2.2);
              for (let i = 0; i < 80; i++) { const a = rnd(0, 6.283), sp = rnd(2, 8); d.particles.spawn(x, gy + 0.3, z, { vx: Math.cos(a) * sp, vy: rnd(1, 5), vz: Math.sin(a) * sp, life: rnd(0.5, 1), s0: 0.4, s1: 0.04, c0: 0xffffff, c1: 0xffc84a, a: 1, drag: 2, g: 4 }); }
              for (let i = 0; i < 30; i++) { const a = rnd(0, 6.283), r2 = rnd(0, rad); d.particles.spawn(x + Math.cos(a) * r2, gy + 0.1, z + Math.sin(a) * r2, { vx: Math.cos(a) * 1.5, vy: rnd(0.3, 1.5), vz: Math.sin(a) * 1.5, life: 1.1, s0: 0.8, s1: 1.8, c0: 0xc9b088, c1: 0x5a4a30, a: 0.35, drag: 1.5 }); }
              const near = enemies.list.filter((e) => e.alive && e.active && Math.hypot(e.pos.x - x, e.pos.z - z) < rad + e.def.radius);
              hitArc('conversion', x, z, 0, rad, Math.PI, 2.6, true);
              for (const e of near) { if (!e.alive) continue; const frac = e.hp / e.hpMax, ep = e.pos.clone().setY(e.pos.y + 1);
                if (DARK_T.has(e.type) && frac < 0.35) { beam(ep.clone().setY(ep.y + 14), ep.clone().setY(ep.y - 1), 0xfff6d0, 0.5, 0.5); if (enemies.hurt(e, e.hp + 1, ep, 0)) killEnemy(e); dmgText(ep.clone().setY(ep.y + 2), 'PURIFICADO', true, '#fff0b0'); for (let q = 0; q < 30; q++) d.particles.spawn(ep.x, ep.y, ep.z, { vx: rnd(-1, 1), vy: rnd(2, 6), vz: rnd(-1, 1), life: 1, s0: 0.3, s1: 0.04, c0: 0xffffff, c1: 0xffe08a, a: 1 }); }
                else if (e.def.rig === 'human' && frac < 0.4) { e.state = 'flee'; e.t = 0; convertedL.push({ e, until: now + 12 }); dmgText(ep.clone().setY(ep.y + 2), 'CONVERTIDO', true, '#fff0b0'); ringFx(e.pos.x, e.pos.z, 0xfff0b0, 0.7); }
                else if (e.alive) { e.state = 'hurt'; e.t = -1.0; } } } },
            end: () => d.scene.remove(pivot) }); return true; }
        /* ---- Vampiro: Coagulação Tardia e Garras Envenenadas ---- */
        case 'clot': { const e = enemies.nearest(hp, 8 * sc.range); if (!e) { logMsg('Nenhuma presa perto o bastante.', '#ff9a8a'); return false; } if (!ok('cast')) return false; const hp0 = e.hp; d.audio.spell('arcane'); dmgText(e.pos.clone().setY(e.pos.y + 2.6), 'SANGUE PRESO', false, '#ff4a5a');
          const vein = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTexture(64, [[0, 'rgba(120,0,10,.0)'], [0.55, 'rgba(160,10,24,.55)'], [0.8, 'rgba(90,0,10,.35)'], [1, 'rgba(60,0,8,0)']]), transparent: true, depthWrite: false, fog: false })); vein.scale.set(1.4, 2.0, 1); fxAdd(vein); let tt = 0; const DU = 3;
          ticks.push({ t: DU, fn: (dt2) => { tt += dt2; if (!e.alive) return; const r = (e.def.scale ?? 1); vein.position.set(e.pos.x, e.pos.y + 1.1 * r, e.pos.z); const pul = 1 + Math.sin(tt * (6 + tt * 5)) * 0.08 + tt / DU * 0.25; vein.scale.set(1.4 * r * pul, 2.0 * r * pul, 1); (vein.material as THREE.SpriteMaterial).opacity = Math.min(1, tt * 3);
            if (Math.random() < dt2 * (10 + tt * 12)) d.particles.spawn(e.pos.x + rnd(-0.35, 0.35), e.pos.y + rnd(0.4, 1.8) * r, e.pos.z + rnd(-0.35, 0.35), { vx: 0, vy: -0.6, vz: 0, life: 0.6, s0: 0.12, s1: 0.06, c0: 0x8a0010, c1: 0x2a0004, a: 1, g: 4 }); },
            end: () => { d.scene.remove(vein); if (!e.alive) return; const dealt = Math.max(0, hp0 - e.hp), dm = Math.round((10 + st.lvl * 3) * sc.dmg + dealt * 0.6), ep = e.pos.clone().setY(e.pos.y + 1.1);
              for (let i = 0; i < 60; i++) { const a = rnd(0, 6.283), up = rnd(-0.2, 1); d.particles.spawn(ep.x, ep.y, ep.z, { vx: Math.cos(a) * rnd(2, 6), vy: up * 5, vz: Math.sin(a) * rnd(2, 6), life: rnd(0.5, 0.9), s0: rnd(0.15, 0.35), s1: 0.05, c0: 0xff2a3a, c1: 0x4a0006, a: 1, drag: 1.2, g: 12 }); }
              d.audio.boom(); st.shake = Math.max(st.shake, 0.3); if (enemies.hurt(e, dm, ep, 1)) killEnemy(e); dmgText(ep.clone().setY(ep.y + 1.7), dm, true, '#ff3a4a'); const heal = Math.round(dm * 0.35 * (1 + stance.heal)); st.hp = Math.min(st.hpMax, st.hp + heal); dmgText(d.getHero().root.position.clone().setY(2.6), `+${heal}`, false, '#ff7a8a'); gainRes(8);
              if (e.alive) bleed(e, 4, (3 + st.lvl * 1.2) * sc.dmg); } }); return true; }
        case 'venomclaw': { if (!ok('combo1')) return false; const yy = h.root.rotation.y;
          for (let k = 0; k < 4; k++) pending.push({ at: now + TEMPO * (0.1 + k * 0.15), fn: () => { if (k) h.act((['combo1', 'combo2', 'combo3', 'combo2'] as const)[k], true); d.audio.swing(); const p0 = h.root.position, sd = k % 2 ? -1 : 1;
            clawFx(sd, 0xb47aff, 3); streak(p0.x, p0.y + 1.1, p0.z, h.root.rotation.y, sd, 0x7aff5a, { n: 1, r: 1.45, w: 0.035, life: 0.32 });
            hitArc('venomclaw', p0.x, p0.z, yy, 2.6 * sc.range, 0.95, 0.6 * sc.dmg, k === 3, (e) => { e.burn = Math.max(e.burn ?? 0, 4); e.burnTick = e.burnTick ?? 0; e.psn = true; for (let q = 0; q < 6; q++) d.particles.spawn(e.pos.x, e.pos.y + 1, e.pos.z, { vx: rnd(-1, 1), vy: rnd(0, 1.5), vz: rnd(-1, 1), life: 0.5, s0: 0.18, s1: 0.04, c0: 0xc8ff6a, c1: 0x5a1a8a, a: 1, g: 4 }); }); } }); return true; }
        /* ---- Lobisomem: Mordida, Salto da Fera, Uivo da Matilha ---- */
        case 'bite': { if (!ok('kick')) return false; pending.push({ at: now + TEMPO * 0.62 * 0.4, fn: () => { const p0 = h.root.position, y = h.root.rotation.y, mx = p0.x + Math.sin(y) * 1.3, mz = p0.z + Math.cos(y) * 1.3, my = p0.y + 1.25;
            for (const s of [-1, 1]) for (let i = 0; i < 7; i++) { const a = (i / 6 - 0.5) * 1.6; d.particles.spawn(mx + Math.cos(y) * a * 0.4, my + s * 0.35, mz - Math.sin(y) * a * 0.4, { vx: 0, vy: -s * 3.5, vz: 0, life: 0.14, s0: 0.12, s1: 0.06, c0: 0xffffff, c1: 0xe8e0d0, a: 1 }); }
            d.audio.hit(); st.shake = Math.max(st.shake, 0.2);
            hitArc('bite', p0.x, p0.z, y, 2.4 * sc.range, 0.7, 1.7 * sc.dmg, true, (e) => { bleed(e, 4, (3 + st.lvl * 1.2) * sc.dmg); dmgText(e.pos.clone().setY(e.pos.y + 2.8), 'MORDIDO', false, '#ff6a6a'); for (let q = 0; q < 16; q++) d.particles.spawn(e.pos.x, e.pos.y + 1.1, e.pos.z, { vx: rnd(-2.5, 2.5), vy: rnd(0, 3), vz: rnd(-2.5, 2.5), life: 0.6, s0: 0.2, s1: 0.05, c0: 0xff2a3a, c1: 0x4a0006, a: 1, g: 10 }); const heal = Math.round((10 + st.lvl * 3) * 0.5 * sc.dmg * (1 + stance.heal)); st.hp = Math.min(st.hpMax, st.hp + heal); }); } }); return true; }
        case 'pounce': { if (!ok('slam')) return false; d.audio.swing(); const x = tx, z = tz; pending.push({ at: now + TEMPO * 1.15 * 0.66, fn: () => { const p0 = h.root.position, gy = d.world.heightAt(p0.x, p0.z), rad = 2.6 * sc.area; d.audio.boom(); st.shake = Math.max(st.shake, 0.55); ringFx(p0.x, p0.z, 0xc8a070, rad / 1.5);
            for (let i = 0; i < 40; i++) { const a = rnd(0, 6.283); d.particles.spawn(p0.x + Math.cos(a) * 0.6, gy + 0.15, p0.z + Math.sin(a) * 0.6, { vx: Math.cos(a) * rnd(2, 6), vy: rnd(0.5, 2.5), vz: Math.sin(a) * rnd(2, 6), life: 0.9, s0: 0.5, s1: 1.3, c0: 0xc9b088, c1: 0x5a4a30, a: 0.4, drag: 2 }); }
            for (const sd of [-1, 1]) streak(p0.x, p0.y + 0.9, p0.z, h.root.rotation.y, sd, 0xffd0b0, { n: 3, r: 1.2, tilt: 0.9, span: 1.1, life: 0.3 });
            const main = enemies.nearest(new THREE.Vector3(x, 0, z), rad + 1.5);
            hitArc('pounce', p0.x, p0.z, 0, rad, Math.PI, 1.9 * sc.dmg, true, (e) => { e.state = 'hurt'; e.t = -1.2; dmgText(e.pos.clone().setY(e.pos.y + 2.7), 'DERRUBADO', false, '#e8d8b0'); });
            if (main && main.alive) { skill = 'pounce'; hitEnemy(main, 1.9 * sc.dmg, true, p0.clone()); skill = null; } } }); return true; }
        case 'packhowl': { if (!ok('cast')) return false; d.audio.boom(); st.shake = Math.max(st.shake, 0.3); const D = 12 * sc.dur; buff.dmg = Math.max(buff.dmg, 1.3); buff.dmgT = Math.max(buff.dmgT, D); buff.move = Math.max(buff.move, 1.2); buff.moveT = Math.max(buff.moveT, D); buff.def = Math.max(buff.def, 0.15); buff.defT = Math.max(buff.defT, D); ringFx(hp.x, hp.z, 0x9ac8ff, 2.4);
          for (let i = 0; i < 40; i++) d.particles.spawn(hp.x, hp.y + 1.9, hp.z, { vx: rnd(-1.2, 1.2), vy: rnd(2, 4.5), vz: rnd(-1.2, 1.2), life: 1.2, s0: 0.35, s1: 1.0, c0: 0xdde8ff, c1: 0x4a6aa0, a: 0.5, drag: 1.5 });
          for (let i = 0; i < 2; i++) pending.push({ at: now + 0.35 + i * 0.3, fn: () => spiritWolf(i, D, sc.dmg) }); logMsg('🐺 Uivo da Matilha: dois lobos espirituais lutam ao seu lado; +30% dano, +20% velocidade, +15% defesa', '#9ac8ff'); return true; }
        /* ---- Mago, Bruxo e Caçador (25/10 noite) ---- */
        case 'blink': { if (!ok(null)) return false; const col = kitKey === 'bru' ? 0x7a3aff : 0x9ad0ff, p0 = hp.clone();
          for (let k = 0; k < 34; k++) d.particles.spawn(p0.x + rnd(-0.4, 0.4), p0.y + rnd(0.1, 1.9), p0.z + rnd(-0.4, 0.4), { vx: rnd(-1.2, 1.2), vy: rnd(0, 2), vz: rnd(-1.2, 1.2), life: 0.6, s0: 0.32, s1: 0.04, c0: kitKey === 'bru' ? 0x1a0a20 : 0xffffff, c1: col, a: 1, drag: 2 });
          beam(p0.clone().setY(p0.y + 1), new THREE.Vector3(tx, d.world.heightAt(tx, tz) + 1, tz), col, 0.05, 0.25); ringFx(p0.x, p0.z, col, 0.8); blinkCol = col; return true; }
        case 'fireball': { if (!ok('cast')) return false; pending.push({ at: now + TEMPO * 0.3, fn: () => { const from = h.weaponTip(new THREE.Vector3()); from.y = Math.max(from.y, 1.2); const dx = tx - from.x, dz = tz - from.z, L = Math.max(1, Math.hypot(dx, dz)), sp = 17;
            const fb = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffd070 })); fxAdd(fb);
            bolts.push({ p: from, v: new THREE.Vector3(dx / L * sp, 0, dz / L * sp), life: L / sp, mul: 1.0, col: 0xff6a1a, big: true, m: fb, straight: true, boom: { r: 2.6 * sc.area, mul: 1.7 * sc.dmg, fn: (x, z) => { for (const e of enemies.list) if (e.alive && e.active && Math.hypot(e.pos.x - x, e.pos.z - z) < 2.6 * sc.area + e.def.radius) e.burn = Math.max(e.burn ?? 0, 3); } } }); } }); return true; }
        case 'chainlight': { const first = enemies.nearest(hp, 10 * sc.range); if (!first) { logMsg('Nenhum inimigo perto para o raio.', '#ff9a8a'); return false; } if (!ok('cast')) return false;
          const hops = 4 + (sc.tier >= 1 ? 1 : 0), hit = new Set<Enemy>(); let cur: Enemy | null = first, from = h.weaponTip(new THREE.Vector3()); from.y = Math.max(from.y, 1.2);
          for (let k = 0; k < hops && cur; k++) { const e: Enemy = cur; const a0 = from.clone(); pending.push({ at: now + TEMPO * 0.25 + k * 0.09, fn: () => { if (!e.alive) return; const b0 = e.pos.clone().setY(e.pos.y + 1.1); beam(a0, b0, 0xdff4ff, 0.06, 0.22); beam(a0, b0, 0x6ab0ff, 0.14, 0.16); skill = 'chainlight'; hitEnemy(e, 1.1 * Math.pow(0.88, k), false, a0); skill = null; if (e.alive) { e.slow = Math.max(e.slow ?? 0, 0.4); } d.audio.spell('shock'); for (let q = 0; q < 10; q++) d.particles.spawn(b0.x, b0.y, b0.z, { vx: rnd(-3, 3), vy: rnd(-1, 3), vz: rnd(-3, 3), life: 0.3, s0: 0.25, s1: 0.03, c0: 0xffffff, c1: 0x6ab0ff, a: 1, drag: 3 }); } });
            hit.add(e); from = e.pos.clone().setY(e.pos.y + 1.1); cur = enemies.list.filter((o) => o.alive && o.active && !o.def.passive && !hit.has(o) && Math.hypot(o.pos.x - e.pos.x, o.pos.z - e.pos.z) < 7).sort((p1, p2) => Math.hypot(p1.pos.x - e.pos.x, p1.pos.z - e.pos.z) - Math.hypot(p2.pos.x - e.pos.x, p2.pos.z - e.pos.z))[0] ?? null; }
          return true; }
        case 'blizzard': { if (!ok('skyraise')) return false; const x = tx, z = tz, rad = 3.4 * sc.area, gy = d.world.heightAt(x, z);
          const m = new THREE.Mesh(new THREE.CircleGeometry(rad, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x9ad0ff, transparent: true, opacity: 0.0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); m.position.set(x, gy + 0.05, z); fxAdd(m); let tk = 0;
          ticks.push({ t: 6 * sc.dur, fn: (dt2, left) => { (m.material as THREE.MeshBasicMaterial).opacity = Math.min(0.12, (6 - left) * 0.3, left * 0.3);
            for (let k = 0; k < 4; k++) if (Math.random() < dt2 * 40) { const a = rnd(0, 6.283), rr2 = Math.sqrt(Math.random()) * rad; d.particles.spawn(x + Math.cos(a) * rr2 - 1.2, gy + rnd(4, 7), z + Math.sin(a) * rr2, { vx: 2.4, vy: -6, vz: rnd(-0.4, 0.4), life: 1.0, s0: 0.14, s1: 0.1, c0: 0xffffff, c1: 0xbfe8ff, a: 0.95 }); }
            tk -= dt2; if (tk <= 0) { tk = 0.5; hitArc('blizzard', x, z, 0, rad, Math.PI, 0.35, false, (e) => { e.slow = Math.max(e.slow ?? 0, 0.55); }); } }, end: () => { d.scene.remove(m); } }); return true; }
        case 'frostnova': { if (!ok('cast')) return false; const rad = 5 * sc.area; d.audio.boom(); st.shake = Math.max(st.shake, 0.35); ringFx(hp.x, hp.z, 0xbfe8ff, rad / 1.2); ringFx(hp.x, hp.z, 0xffffff, rad / 2);
          for (let i = 0; i < 70; i++) { const a = rnd(0, 6.283); d.particles.spawn(hp.x, hp.y + 0.4, hp.z, { vx: Math.cos(a) * rnd(5, 10), vy: rnd(0, 2), vz: Math.sin(a) * rnd(5, 10), life: 0.55, s0: 0.3, s1: 0.05, c0: 0xffffff, c1: 0x7ac8ff, a: 1, drag: 3 }); }
          hitArc('frostnova', hp.x, hp.z, 0, rad, Math.PI, 0.8, false, (e) => { if (e.def.passive) return; e.state = 'hurt'; e.t = -2 * sc.dur; e.slow = Math.max(e.slow ?? 0, 0.6); dmgText(e.pos.clone().setY(e.pos.y + 2.6), 'CONGELADO', false, '#bfe8ff'); for (let q = 0; q < 6; q++) d.particles.spawn(e.pos.x + rnd(-0.4, 0.4), e.pos.y + rnd(0.2, 1.8), e.pos.z + rnd(-0.4, 0.4), { vy: 0.2, life: 2 * sc.dur, s0: 0.35, s1: 0.3, c0: 0xeaf6ff, c1: 0x9ad0ff, a: 0.7 }); }); return true; }
        case 'meteor': { if (!ok('skyraise')) return false; const x = tx, z = tz, rad = 3.2 * sc.area, gy = d.world.heightAt(x, z); ringFx(x, z, 0xff5a1a, rad / 1.2); d.audio.spell('fire');
          const mk = new THREE.Mesh(new THREE.IcosahedronGeometry(0.75, 1), new THREE.MeshBasicMaterial({ color: 0x5a2a10 })), glow = new THREE.Mesh(new THREE.SphereGeometry(1.0, 14, 10), new THREE.MeshBasicMaterial({ color: 0xff7a2a, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false })); mk.add(glow); mk.visible = false; fxAdd(mk);
          const p0 = new THREE.Vector3(x - 7, gy + 22, z - 4); let t = 0;
          ticks.push({ t: 1.6, fn: (dt2) => { t += dt2; if (t < 0.9) { if (Math.random() < dt2 * 20) { const a = rnd(0, 6.283); d.particles.spawn(x + Math.cos(a) * rad, gy + 0.2, z + Math.sin(a) * rad, { vy: 1, life: 0.4, s0: 0.25, s1: 0.04, c0: 0xffd070, c1: 0xff4a1a, a: 1 }); } return; }
            const k = Math.min(1, (t - 0.9) / 0.6); mk.visible = k < 1; mk.position.lerpVectors(p0, new THREE.Vector3(x, gy + 0.5, z), k * k); mk.rotation.x += dt2 * 8;
            for (let q = 0; q < 4; q++) d.particles.spawn(mk.position.x + rnd(-0.4, 0.4), mk.position.y + rnd(-0.4, 0.4), mk.position.z + rnd(-0.4, 0.4), { vx: rnd(-1, 1), vy: rnd(0, 2), vz: rnd(-1, 1), life: 0.6, s0: 1.0, s1: 0.2, c0: 0xffe0a0, c1: 0xff3a0a, a: 0.9 });
            if (k >= 1 && mk.parent) { d.scene.remove(mk); explode(x, z, gy, rad, 3.2 * sc.dmg, 0xff5a1a, 1.2, new THREE.Vector3(x - 1, gy, z - 1)); st.shake = Math.max(st.shake, 0.9); for (const e of enemies.list) if (e.alive && e.active && Math.hypot(e.pos.x - x, e.pos.z - z) < rad + e.def.radius) e.burn = Math.max(e.burn ?? 0, 4);
              for (let q = 0; q < 50; q++) { const a = rnd(0, 6.283), rr2 = rnd(0, rad); d.particles.spawn(x + Math.cos(a) * rr2, gy + 0.2, z + Math.sin(a) * rr2, { vy: rnd(0.5, 2), life: rnd(1.5, 3), s0: 0.4, s1: 0.9, c0: 0x6a6a6a, c1: 0x2a2a2a, a: 0.5, drag: 1 }); } } }, end: () => { if (mk.parent) d.scene.remove(mk); } }); return true; }
        case 'archon': { if (!ok('cast')) return false; form = { id: 'archon', t: 12, scale: 1.06 }; buff.dmg = 1.8; buff.dmgT = 12; buff.def = 0.2; buff.defT = 12; h.setAura(true); d.audio.boom(); ringFx(hp.x, hp.z, 0x7ab8ff, 2); logMsg('🔮 Avatar Arcano: dano ×1,8, +20% de defesa, mísseis triplos', '#9ad0ff');
          ticks.push({ t: 12, fn: (dt2) => { const hh = d.getHero().root.position; for (let k = 0; k < 3; k++) { const a = now * 2.4 + k * 2.094; if (Math.random() < dt2 * 30) d.particles.spawn(hh.x + Math.cos(a) * 1.1, hh.y + 1.2 + Math.sin(now * 3 + k) * 0.3, hh.z + Math.sin(a) * 1.1, { life: 0.4, s0: 0.22, s1: 0.04, c0: 0xffffff, c1: 0x6ab0ff, a: 1 }); } } }); return true; }
        case 'curse': { const e0 = enemies.nearest(hp, 10 * sc.range); if (!e0) { logMsg('Ninguém perto para amaldiçoar.', '#ff9a8a'); return false; } if (!ok('cast')) return false; let e: Enemy = e0; let tk = 0, jumps = 3;
          beam(h.weaponTip(new THREE.Vector3()), e.pos.clone().setY(e.pos.y + 1.2), 0xa060ff, 0.08, 0.3); dmgText(e.pos.clone().setY(e.pos.y + 2.6), 'AMALDIÇOADO', false, '#c8a0ff');
          ticks.push({ t: 6 * sc.dur, fn: (dt2) => { if (!e.alive) { const nx: Enemy | undefined = jumps > 0 ? enemies.list.filter((o) => o.alive && o.active && !o.def.passive && Math.hypot(o.pos.x - e.pos.x, o.pos.z - e.pos.z) < 7).sort((p1, p2) => Math.hypot(p1.pos.x - e.pos.x, p1.pos.z - e.pos.z) - Math.hypot(p2.pos.x - e.pos.x, p2.pos.z - e.pos.z))[0] : undefined; if (!nx) return; jumps--; beam(e.pos.clone().setY(e.pos.y + 1), nx.pos.clone().setY(nx.pos.y + 1), 0xa060ff, 0.08, 0.3); e = nx; dmgText(e.pos.clone().setY(e.pos.y + 2.6), 'A MALDIÇÃO PULOU', false, '#c8a0ff'); }
            if (Math.random() < dt2 * 16) d.particles.spawn(e.pos.x + rnd(-0.4, 0.4), e.pos.y + rnd(0.3, 1.8), e.pos.z + rnd(-0.4, 0.4), { vy: rnd(0.3, 1), life: 0.8, s0: 0.25, s1: 0.4, c0: 0x8a4ad0, c1: 0x1a3a0a, a: 0.7 });
            tk -= dt2; if (tk <= 0) { tk = 0.5; const dm = Math.round((3 + st.lvl * 1.0) * sc.dmg); if (enemies.hurt(e, dm, e.pos, 0)) killEnemy(e); dmgText(e.pos.clone().setY(e.pos.y + 2.1), dm, false, '#b07aff'); } } }); return true; }
        case 'hellhound': { if (!ok('cast')) return false; d.audio.boom(); st.shake = Math.max(st.shake, 0.3); const D = 12 * sc.dur; ringFx(hp.x, hp.z, 0xa060ff, 2.2);
          for (let i = 0; i < 40; i++) d.particles.spawn(hp.x + rnd(-1.5, 1.5), hp.y + 0.1, hp.z + rnd(-1.5, 1.5), { vy: rnd(1, 3), life: 1, s0: 0.4, s1: 0.8, c0: 0xff6a1a, c1: 0x1a0a14, a: 0.6 });
          for (let i = 0; i < 2; i++) pending.push({ at: now + 0.35 + i * 0.3, fn: () => spiritWolf(i, D, sc.dmg, true) }); logMsg('🜏 Cães do Abismo: dois cães de sombra e brasa lutam ao seu lado', '#c8a0ff'); return true; }
        case 'demonform': { if (!ok('cast')) return false; form = { id: 'demonform', t: 12, scale: 1.1 }; buff.dmg = 1.8; buff.dmgT = 12; buff.def = 0.25; buff.defT = 12; buff.leech = 0.1; h.setAura(true); d.audio.boom(); st.shake = Math.max(st.shake, 0.5); ringFx(hp.x, hp.z, 0xa060ff, 2); logMsg('🜏 Forma Demoníaca: dano ×1,8, +25% de defesa, 10% de roubo de vida', '#c8a0ff');
          ticks.push({ t: 12, fn: (dt2) => { const hh = d.getHero().root.position; if (Math.random() < dt2 * 26) d.particles.spawn(hh.x + rnd(-0.5, 0.5), hh.y + rnd(0.1, 2), hh.z + rnd(-0.5, 0.5), { vy: rnd(0.8, 2), life: 0.7, s0: 0.3, s1: 0.05, c0: Math.random() < 0.5 ? 0xff6a1a : 0x8a3ad0, c1: 0x1a0a14, a: 0.9 }); } }); return true; }
        case 'holyflask': { if (!ok('throw')) return false; d.audio.swing(); const x = tx, z = tz, gy = d.world.heightAt(x, z), rad = 2.8 * sc.area;
          const fl = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), new THREE.MeshBasicMaterial({ color: 0xdff4ff })); fl.visible = false; fxAdd(fl); let t = 0; const from = h.handPos(new THREE.Vector3());
          ticks.push({ t: 0.95, fn: (dt2) => { t += dt2; const k = Math.min(1, Math.max(0, (t - 0.25) / 0.6)); if (t < 0.25) return; fl.visible = true; fl.position.set(from.x + (x - from.x) * k, from.y + (gy + 0.2 - from.y) * k + Math.sin(k * Math.PI) * 2.6, from.z + (z - from.z) * k); d.particles.spawn(fl.position.x, fl.position.y, fl.position.z, { life: 0.25, s0: 0.2, s1: 0.04, c0: 0xffffff, c1: 0x9ad0ff, a: 1 });
            if (k >= 1 && fl.parent) { d.scene.remove(fl); explode(x, z, gy, rad, 1.4 * sc.dmg, 0xbfe8ff, 0, new THREE.Vector3(x, gy, z)); for (const e of enemies.list) if (e.alive && e.active && DARK_T.has(e.type) && Math.hypot(e.pos.x - x, e.pos.z - z) < rad + e.def.radius) { skill = 'holyflask'; hitEnemy(e, 1.4 * sc.dmg, false, new THREE.Vector3(x, gy, z)); skill = null; if (e.alive) e.burn = Math.max(e.burn ?? 0, 3); }
              const m = new THREE.Mesh(new THREE.CircleGeometry(rad, 36).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xbfe8ff, transparent: true, opacity: 0.2, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); m.position.set(x, gy + 0.06, z); fxAdd(m); let tk2 = 0;
              ticks.push({ t: 4 * sc.dur, fn: (d3, left) => { (m.material as THREE.MeshBasicMaterial).opacity = Math.min(0.2, left * 0.2); if (Math.random() < d3 * 14) { const a = rnd(0, 6.283), rr2 = rnd(0, rad); d.particles.spawn(x + Math.cos(a) * rr2, gy + 0.1, z + Math.sin(a) * rr2, { vy: rnd(0.6, 1.4), life: 0.9, s0: 0.15, s1: 0.03, c0: 0xffffff, c1: 0x9ad0ff, a: 0.9 }); }
                tk2 -= d3; if (tk2 <= 0) { tk2 = 0.5; for (const e of enemies.list) if (e.alive && e.active && DARK_T.has(e.type) && Math.hypot(e.pos.x - x, e.pos.z - z) < rad + e.def.radius) { const dm = Math.round((4 + st.lvl * 1.2) * sc.dmg); if (enemies.hurt(e, dm, e.pos, 0)) killEnemy(e); dmgText(e.pos.clone().setY(e.pos.y + 2.1), dm, false, '#bfe8ff'); } } }, end: () => { d.scene.remove(m); } }); } }, end: () => { if (fl.parent) d.scene.remove(fl); } }); return true; }
        case 'volley': { if (!ok('shoot')) return false; const x = tx, z = tz, rad = 3.2 * sc.area; ringFx(x, z, 0xd8dce8, rad / 1.2); const from = h.weaponTip(new THREE.Vector3());
          for (let k = 0; k < 3; k++) beam(from, from.clone().add(new THREE.Vector3(rnd(-0.5, 0.5), 8, rnd(-0.5, 0.5))), 0xe8ecf4, 0.03, 0.2); d.audio.swing();
          for (let i = 0; i < 14; i++) pending.push({ at: now + 0.45 + i * 0.07, fn: () => { const a = rnd(0, 6.283), rr2 = Math.sqrt(Math.random()) * rad, px = x + Math.cos(a) * rr2, pz = z + Math.sin(a) * rr2, py = d.world.heightAt(px, pz);
            beam(new THREE.Vector3(px - 1, py + 9, pz - 0.6), new THREE.Vector3(px, py + 0.1, pz), 0xf0f4ff, 0.035, 0.12); d.audio.hit(); for (let q = 0; q < 5; q++) d.particles.spawn(px, py + 0.1, pz, { vx: rnd(-1.5, 1.5), vy: rnd(1, 3), vz: rnd(-1.5, 1.5), life: 0.35, s0: 0.15, s1: 0.03, c0: 0xffffff, c1: 0xb8bcc8, a: 1, g: 6 });
            hitArc('volley', px, pz, 0, 1.0, Math.PI, 0.55, false); } }); return true; }
        case 'huntform': { if (!ok('cast')) return false; form = { id: 'huntform', t: 12, scale: 1.0 }; buff.dmg = 1.8; buff.dmgT = 12; buff.move = Math.max(buff.move, 1.2); buff.moveT = 12; h.setAura(true); d.audio.boom(); ringFx(hp.x, hp.z, 0xd8dce8, 2.2); let n = 0;
          for (const e of enemies.list) if (e.alive && e.active && DARK_T.has(e.type) && Math.hypot(e.pos.x - hp.x, e.pos.z - hp.z) < 15) { e.mark = now + 12; n++; dmgText(e.pos.clone().setY(e.pos.y + 2.6), 'VISTO', false, '#e8ecf4'); }
          logMsg(`👁 Vigília de Aravel: dano ×1,8, +20% de velocidade${n ? `; ${n} criatura(s) da escuridão marcada(s)` : ''}`, '#e8ecf4');
          ticks.push({ t: 12, fn: (dt2) => { const hh = d.getHero().root.position; if (Math.random() < dt2 * 18) { const a = rnd(0, 6.283); d.particles.spawn(hh.x + Math.cos(a) * 0.9, hh.y + rnd(0.4, 2), hh.z + Math.sin(a) * 0.9, { vy: 0.4, life: 0.6, s0: 0.18, s1: 0.03, c0: 0xffffff, c1: 0xc8ccd8, a: 1 }); } } }); return true; }
        case 'bubble': { if (!ok('cast')) return false; if (aegis) { d.scene.remove(aegis.m); aegis = null; } const g = new THREE.Group(); const A = mkAegis(); const u = A.u; (u as unknown as { col: { value: THREE.Color } }).col.value.setHex(0x8af0ff); d.scene.remove(A.m);
          for (let i = 0; i < 6; i++) { const pnl = new THREE.Mesh(new THREE.SphereGeometry(1.35, 12, 10, i / 6 * Math.PI * 2, 0.6, Math.PI * 0.24, Math.PI * 0.42), A.m.material as THREE.Material); g.add(pnl); } fxAdd(g); g.userData.dyn = true;
          const max = Math.round(st.hpMax * (0.35 + 0.05 * sc.tier)); aegis = { hp: max, max, m: g, u, tier: sc.tier }; const me = aegis; bubbleT = 8 * sc.dur; d.audio.spell('shock'); ringFx(hp.x, hp.z, 0x8af0ff, 1.3); let tt = 0;
          ticks.push({ t: 8 * sc.dur, fn: (dt2, left) => { if (aegis !== me) { bubbleT = 0; return; } tt += dt2; const hh = d.getHero().root.position; g.position.set(hh.x, hh.y + 0.05, hh.z); g.rotation.y += dt2 * 1.6; me.u.t.value = tt; me.u.hit.value = Math.max(0, me.u.hit.value - dt2 * 4); me.u.op.value = Math.min(1, tt * 4, left * 2) * (0.45 + 0.55 * me.hp / me.max);
            if (sideDrone && Math.random() < dt2 * 8) { const a2 = rnd(0, 6.283); beam(sideDrone.g.position.clone(), new THREE.Vector3(hh.x + Math.cos(a2) * 1.3, hh.y + rnd(0.6, 1.5), hh.z + Math.sin(a2) * 1.3), 0x8af0ff, 0.012, 0.12); } },
            end: () => { if (aegis === me) { aegis = null; d.scene.remove(g); } bubbleT = 0; } }); logMsg(`🛡 Bolha de Escudos: a esfera para de atacar e segura seis escudos em volta de você (até ${max} de dano)`, '#8af0ff'); return true; }
        /* ---- Tecnocrata formado: torres ---- */
        case 'gunturret': case 'teslatower': case 'mortar': { if (!ok('throw')) return false; const kind = id === 'gunturret' ? 'gun' : id === 'teslatower' ? 'tesla' : 'mortar'; const x = tx, z = tz; d.audio.swing();
          droneGo.set(x, d.world.heightAt(x, z) + 1.4, z); droneGoT = TEMPO * 0.55; if (sideDrone) sideDrone.droneFlash = 1;
          pending.push({ at: now + TEMPO * 0.5, fn: () => { placeTower(kind, x, z, sc); } }); logMsg(kind === 'gun' ? '🔫 Torre Metralhadora armada' : kind === 'tesla' ? '⚡ Torre Tesla armada' : '💣 Morteiro armado', '#6ae0ff'); return true; }
        default: return false;
      }
    },
    get buffMove() { return buff.move * (1 + stance.move) * cmod.move; },
    /** postura de batalha: troca as somas fixas (posturas.ts) */
    /** kit em uso (pal, vam, lob, tecno…): muda o tipo de dano do golpe e passivas do caminho */
    setKit(k: string) { kitKey = k; },
    kit() { return kitKey; },
    /** chegada do Piscar: o clarão no ponto novo */
    blinkArrive() { const hh = d.getHero().root.position; for (let k = 0; k < 34; k++) d.particles.spawn(hh.x + rnd(-0.4, 0.4), hh.y + rnd(0.1, 1.9), hh.z + rnd(-0.4, 0.4), { vx: rnd(-1.5, 1.5), vy: rnd(-0.5, 1.5), vz: rnd(-1.5, 1.5), life: 0.5, s0: 0.35, s1: 0.04, c0: 0xffffff, c1: blinkCol, a: 1, drag: 3 }); },
    /** a Fúria do guerreiro do Norte (0..1) */
    fury() { return { v: fury, warrior, calm: calmT }; },
    /** a Dúvida do paladino (0..1) */
    doubt() { return { v: doubt, grace: graceT }; },
    setDoubt(v: number) { doubt = v; },
    /** necessidade do mago, do bruxo ou do caçador: { k, v } */
    need3() { const k = n3Key(); return k ? { k, v: need3[k], calm: n3Calm } : null; },
    setNeed3(v: number) { const k = n3Key(); if (k) need3[k] = v; },
    ritual3(): boolean { const k = n3Key(); if (!k) return false; const before = need3[k]; need3[k] = Math.max(0, need3[k] - (k === 'bru' ? 0.8 : 0.75)); n3Calm = 1200; n3Stage = 0; cobradorT = 600; try { localStorage.setItem(NEED3_KEY, JSON.stringify(need3)); } catch { /* */ }
      const hp = d.getHero().root.position, col = k === 'mag' ? 0x9ab4ff : k === 'bru' ? 0xa070e0 : 0xd8dce8; for (let q = 0; q < 28; q++) d.particles.spawn(hp.x + rnd(-0.7, 0.7), hp.y + rnd(0.2, 1.8), hp.z + rnd(-0.7, 0.7), { vx: rnd(-0.2, 0.2), vy: rnd(0.3, 1), vz: rnd(-0.2, 0.2), life: rnd(1.4, 2.4), s0: 0.12, s1: 0.3, c0: col, c1: 0x403050, a: 0.7, g: -0.1 });
      if (k === 'cac') st.hp = st.hpMax; d.audio.chime();
      logMsg(k === 'mag' ? `🔮 Ritual do Aterramento: a terra do lobo nos pés, a água benta na testa, e o eco se cala. Ressonância ${Math.round(before * 100)}% → ${Math.round(need3[k] * 100)}%.` : k === 'bru' ? `🜏 Oferenda do Pacto: o coração do demônio e o sangue da batalha pagam os juros. Dívida ${Math.round(before * 100)}% → ${Math.round(need3[k] * 100)}%.` : `👁 Sono Guardado: o pó do bruxo fecha o olho de Aravel e o sino vigia por você. Vigília ${Math.round(before * 100)}% → ${Math.round(need3[k] * 100)}%.`, '#d8c8ff'); return true; },
    fastPrayer() { const before = doubt; doubt = Math.max(0, doubt - 0.75); graceT = 1200; try { localStorage.setItem(DOUBT_KEY, String(doubt)); } catch { /* */ } st.hp = st.hpMax; st.mp = st.mpMax; const hp = d.getHero().root.position;
      for (let q = 0; q < 30; q++) d.particles.spawn(hp.x + rnd(-0.7, 0.7), hp.y + rnd(0.2, 2), hp.z + rnd(-0.7, 0.7), { vx: rnd(-0.2, 0.2), vy: rnd(0.4, 1.1), vz: rnd(-0.2, 0.2), life: rnd(1.4, 2.4), s0: 0.12, s1: 0.3, c0: 0xfff0b0, c1: 0xffc860, a: 0.8, g: -0.1 });
      d.audio.chime(); logMsg(`✝ Jejum e Oração: o pão sem fermento, o vinho santo e o silêncio. A Dúvida cai de ${Math.round(before * 100)}% para ${Math.round(doubt * 100)}%, e por 20 min ela volta mais devagar.`, '#fff0b0'); doubtStage = 0; },
    setWarrior(on: boolean) { warrior = on; },
    setFury(v: number) { fury = v; },
    /** reator pessoal do tecnocrata: carga 0..1 e geração do núcleo */
    reactor() { return { ...reactor }; },
    /** a fome da fera (lob/vam): 0..1 e o piso que bicho não desce */
    crave() { return { v: crave.v, floor: craveFloor(), feast: feastT }; },
    feed,
    setCrave(v: number, real?: number) { crave.v = v; if (real != null) crave.real = real; saveCrave(); },
    installReactor(tier: number, maxTier: number) { if (tier > maxTier) { logMsg('⚛ Este núcleo é da segunda classe: o seu reator ainda não aguenta.', '#ff9a8a'); return false; } reactor = { charge: 1, tier }; try { localStorage.setItem(REACT_KEY, JSON.stringify(reactor)); } catch { /* */ } d.audio.chime(); logMsg(`⚛ Núcleo de Reator Mk ${tier === 2 ? 'II' : 'I'} instalado: ${REACT_MIN[tier] / 30} turnos de energia.`, '#8af0ff'); return true; },
    /** postura → modo da esfera do tecnocrata */
    setDroneMode(stanceId: string | null | undefined) { droneMode = stanceId === 'engenharia' ? 'grp' : stanceId === 'blindagem' ? 'def' : 'atk'; },
    /** aparelhos do tecnocrata formado (manopla, reator, exoesqueleto) presos ao modelo */
    setTechLook(t: { gauntlet(out: THREE.Vector3): THREE.Vector3; setMech(on: boolean): void; charge(k: number): void } | null) { techLook = t; },
    /** céu: noite 0..1 e se o herói está na sombra (dentro de casa, masmorra, mata fechada, cidade de sombra) */
    setSky(night: number, shade: boolean) { skyNight = night; skyShade = shade; },
    /** queimadura de sol do vampiro (0..1) e quanto falta do Sangue Diluído (s) */
    sun() { return { k: sunK, veil: sunVeilT }; },
    /** 0 = dia claro, 1 = breu (noite, masmorra, cripta): a esfera acende a luz */
    setDark(k: number) { heroDark = k; },
    /** ponto do trabalho em curso (corte, mina, esfola, colheita): a esfera do tecnocrata vai ajudar */
    setWork(p: { x: number; z: number } | null) { workAt = p; },
    setStance(e: Partial<typeof stance>) { stance = { dmg: 0, def: 0, heal: 0, regen: 0, move: 0, crit: 0, leech: 0, ...e }; },
    /** efeitos de comidas e bebidas (cerveja, hidromel, tônico, antídoto) */
    /** a Sentinela de pé (para o "E — Desmontar") */
    /** a Sentinela de pé mais perto do ponto (para o "E — Desmontar") */
    sentryAt(x?: number, z?: number) { const hp0 = d.getHero().root.position, px = x ?? hp0.x, pz = z ?? hp0.z; let S = null as (typeof gad.sentries)[number] | null, bd = 1e9; for (const q of gad.sentries) { const dd = Math.hypot(q.x - px, q.z - pz); if (dd < bd) { bd = dd; S = q; } } return S ? { x: S.x, z: S.z, id: S.id, left: Math.max(0, S.until - Date.now()), n: gad.sentries.length } : null; },
    /** todas as Sentinelas de pé (a obra pergunta se está protegida) */
    sentries() { return gad.sentries.map((q) => ({ x: q.x, z: q.z, r: q.r, until: q.until })); },
    /** desmonta a Sentinela: some do chão, o tempo para e o id volta (o main.ts devolve o item à mochila) */
    packSentry(): string | null { const hp0 = d.getHero().root.position; let S = null as (typeof gad.sentries)[number] | null, bd = 3.2; for (const q of gad.sentries) { const dd = Math.hypot(q.x - hp0.x, q.z - hp0.z); if (dd < bd) { bd = dd; S = q; } } if (!S) return null; const left = Math.max(0, S.until - Date.now()); d.scene.remove(S.m); gad.sentries.splice(gad.sentries.indexOf(S), 1); saveSentries(); if (left > 5000) sentryLeftPush(S.id, left); for (let i = 0; i < 14; i++) d.particles.spawn(S.x, d.world.heightAt(S.x, S.z) + 0.6, S.z, { vx: rnd(-1.5, 1.5), vy: rnd(0.5, 2), vz: rnd(-1.5, 1.5), life: 0.5, s0: 0.3, s1: 0.04, c0: 0xffffff, c1: 0xffc060, a: 0.9 }); logMsg(`🤖 Bartolomeu dobra as pernas e entra na mochila. O relógio dele parou com ${fmtLeft(left)} de corda.`, '#e0b048'); return left > 5000 ? S.id : null; },
    /** usar uma engenhoca da Companhia (true = consumiu) */
    gadget(id: string): boolean { const hp = d.getHero().root.position, yaw = d.getHero().root.rotation.y, now2 = Date.now(), gy = d.world.heightAt(hp.x, hp.z);
      const t = tierOf(id), b = baseOf(id), dur = TURNS[t] * TURN_S * 1000, tl = ['1 turno (30 min)', '2 turnos (1 hora)', '4 turnos (2 horas)'][t], mk = 'Mk ' + MK[t];
      if (b === 'drone_cura') { gvDrop('heal'); gv.heal = buildHealDrone(t); gv.heal.g.position.set(hp.x, gy + 2.6, hp.z); d.scene.add(gv.heal.g); for (let i = 0; i < 14; i++) d.particles.spawn(hp.x, gy + 2.4, hp.z, { vx: rnd(-1.5, 1.5), vy: rnd(-0.5, 1.5), vz: rnd(-1.5, 1.5), life: 0.6, s0: 0.3, s1: 0.04, c0: 0xffffff, c1: 0x7affd0, a: 0.9 }); gad.heal = now2 + dur; gad.healK = [0.02, 0.03, 0.04][t]; logMsg(`🛸 Drone de Cura ${mk} no ombro por ${tl}: +${Math.round(gad.healK * 100)}% de vida a cada 6 s.`, '#7affd0'); return true; }
      if (b === 'drone_choque') { gad.shock = now2 + dur; gad.shockI = [4, 3.5, 3][t]; gad.shockR = [7, 8, 9][t]; gad.shockK = [0.35, 0.5, 0.65][t]; logMsg(`⚡ Bobina de Choque ${mk} no cinto por ${tl}: raio a cada ${gad.shockI} s (${gad.shockR} m).`, '#6ad0ff'); return true; }
      if (b === 'escudo_auto') { gvDrop('bot'); gvDrop('dome'); gv.bot = buildShieldBot(t); gv.bot.g.position.set(hp.x + Math.cos(yaw) * 1.3, gy, hp.z - Math.sin(yaw) * 1.3); d.scene.add(gv.bot.g); gv.dome = buildDome(t); gv.dome.g.position.set(hp.x, gy, hp.z); d.scene.add(gv.dome.g); gad.shield = now2 + dur; gad.shieldReady = true; gad.shieldCd = [25, 20, 15][t]; logMsg(`🛡 Escudo Automatizado ${mk} girando por ${tl}: segura um golpe inteiro a cada ${gad.shieldCd} s.`, '#9ad7ff'); return true; }
      if (b === 'sentinela') { if (gad.sentries.length >= 5) { logMsg('🤖 Já há 5 Sentinelas de pé. Desmonte uma (E perto dela) para plantar outra.', '#e0b048'); return false; } /* até 5 de pé (28/10: proteger a obra) */ const left = sentryLeftPop(id), dur2 = left ?? dur; const x = hp.x + Math.sin(yaw) * 1.8, z = hp.z + Math.cos(yaw) * 1.8, tr = mkTurret(x, z); tr.m.scale.setScalar(1 + t * 0.12); gad.sentries.push({ id, m: tr.m, head: tr.head, x, z, until: now2 + dur2, shotT: 1, iv: [1.2, 1, 0.8][t], r: [12, 14, 16][t], k: [0.3, 0.42, 0.55][t] }); saveSentries(); for (let i = 0; i < 18; i++) d.particles.spawn(x, gy + 0.3, z, { vx: rnd(-2, 2), vy: rnd(1, 3), vz: rnd(-2, 2), life: 0.6, s0: 0.4, s1: 0.05, c0: 0xffffff, c1: 0xffc060, a: 0.9 }); logMsg(left ? `🤖 Bartolomeu ${mk} volta ao posto: ainda tem ${fmtLeft(left)} de corda (${[12, 14, 16][t]} m).` : `🤖 Bartolomeu ${mk} toma posição: guarda este lugar por ${tl} (${[12, 14, 16][t]} m).`, '#e0b048'); return true; }
      if (/^reacao_/.test(id)) { const x = hp.x + Math.sin(yaw) * 3, z = hp.z + Math.cos(yaw) * 3, y = d.world.heightAt(x, z), from = new THREE.Vector3(x, y, z); skill = 'combo';
        if (id === 'reacao_azul') explode(x, z, y, 2.5, 0.9, 0x4a8aff, 0, from);
        else if (id === 'reacao_amarela') explode(x, z, y, 4, 1.8, 0xffd040, 1.2, from);
        else { explode(x, z, y, 6, 2.6, 0xff3a1a, 1, from); napalmAt(x, z, y); napalmAt(x + 2, z + 1, y); napalmAt(x - 2, z - 1, y); st.shake = Math.max(st.shake, 1.1); for (let k = 0; k < 90; k++) d.particles.spawn(x + rnd(-0.6, 0.6), y + 0.5, z + rnd(-0.6, 0.6), { vx: rnd(-3, 3), vy: rnd(6, 14), vz: rnd(-3, 3), life: rnd(1, 2.2), s0: rnd(0.4, 0.9), s1: 0.1, c0: k % 3 ? 0xffd060 : 0xffffff, c1: 0xff2a0a, a: 1, g: 9 }); logMsg('🌋 Você criou um vulcão. A Companhia não se responsabiliza.', '#ff8a5a'); }
        skill = null; return true; }
      return false; },
    drinkBuff(id: string) {
      if (id.startsWith('feast:')) { const k = id.slice(6), f = FEASTS[k]; if (!f) return;
        if (k === 'picanha' && kitKey === 'vam') { st.hp = Math.max(1, st.hp - st.hpMax * 0.1); logMsg('🧄 Alho! A garganta fecha, o estômago revira. Vampiro e picanha no alho não combinam — nenhum efeito, só a ânsia.', '#ff8a7a'); return; }
        const s2 = st as typeof st & { feast?: { meal?: { id: string; until: number }; brew?: { id: string; until: number } } }; s2.feast ??= {}; const had = s2.feast[f.slot]; s2.feast[f.slot] = { id: k, until: Date.now() + FEAST_MIN * 60000 }; (st as { recalc?: (() => void) | null }).recalc?.();
        logMsg(`${f.icon} ${f.name}${had && had.id !== k ? ` (no lugar de ${FEASTS[had.id]?.name ?? 'outra'})` : ''}: ${feastEff(f)} por ${FEAST_MIN} min.`, '#ffd27a'); return; }
      if (id === 'regen') { hot = { t: Math.max(hot.t, 30), per: Math.max(hot.per, st.hpMax * 0.02) }; logMsg('🫙 Vigor: regenerando vida', '#7aff9a'); }
      else if (id === 'courage') { buff.dmg = Math.max(buff.dmg, 1.1); buff.dmgT = Math.max(buff.dmgT, 60); logMsg('🍺 Coragem: +10% de dano por 60 s', '#ffd24a'); }
      else if (id === 'mead') { buff.dmg = Math.max(buff.dmg, 1.15); buff.dmgT = Math.max(buff.dmgT, 60); buff.move = Math.max(buff.move, 1.1); buff.moveT = Math.max(buff.moveT, 60); logMsg('🍯 Hidromel: +15% de dano e +10% de velocidade', '#ffd24a'); }
      else if (id === 'sunveil') { if (kitKey === 'vam') feed('animal'); sunVeilT = 300; sunK = Math.max(0, sunK - 0.6); logMsg(kitKey === 'vam' ? '🩸 Sangue Diluído: o sol arde bem menos por 5 min e a pele começa a fechar.' : '🩸 Sangue Diluído: gosto de ferro. Nada acontece com quem não é vampiro.', '#ff7a8a'); }
      else if (id === 'carne_h') { if (kitKey === 'lob') feed('preserved'); else logMsg('🍖 Carne velha, salgada demais e com um gosto que você prefere não entender.', '#c8a890'); }
      else if (id === 'inj_s') { if (kitKey === 'vam') feed('preserved'); else logMsg('💉 A agulha arde e nada acontece: isso é para vampiros.', '#c8a890'); }
      else if (id === 'ritual') { if (!warrior) logMsg('🕯 O incenso queima e o cheiro é forte, mas ele não foi feito para você.', '#c8a890'); else { const before = fury; fury = Math.max(0, fury - 0.7); calmT = 900; st.hp = Math.max(1, st.hp - st.hpMax * 0.12); try { localStorage.setItem(FURY_KEY, String(fury)); } catch { /* */ }
          const hp = d.getHero().root.position; for (let q = 0; q < 26; q++) d.particles.spawn(hp.x + rnd(-0.6, 0.6), hp.y + 0.3, hp.z + rnd(-0.6, 0.6), { vx: rnd(-0.3, 0.3), vy: rnd(0.6, 1.4), vz: rnd(-0.3, 0.3), life: rnd(1.6, 2.8), s0: 0.2, s1: 0.5, c0: q % 3 ? 0xb8b0c8 : 0xffc070, c1: 0x6a6080, a: 0.6, g: -0.2 });
          logMsg(`🕯 Ritual de calmaria: você presta condolências a Odin pelos que caíram e mortifica o corpo (−12% de vida). A Fúria cai de ${Math.round(before * 100)}% para ${Math.round(fury * 100)}%, e por 15 min ela sobe mais devagar.`, '#d8c8ff'); furyStage = 0; } }
      else if (id === 'cleanse') { logMsg('🌿 Antídoto: veneno e queimaduras curados', '#7aff9a'); }
      d.audio.heal();
    },
    /** pet: posição do item mais próximo para buscar (até 14 m do herói); ao chegar, o item é levado ao herói */
    petFetch(petPos: THREE.Vector3, heroPos: THREE.Vector3, range = 14): THREE.Vector3 | null {
      let best: (typeof drops)[number] | null = null, bd = range;
      for (const dr of drops) { if (dr.t < 0.6) continue; const dd = Math.hypot(dr.x - heroPos.x, dr.z - heroPos.z); if (dd < bd && dd > 2.2) { bd = dd; best = dr; } }
      if (!best) return null;
      if (Math.hypot(best.x - petPos.x, best.z - petPos.z) < 1.1) { best.x = heroPos.x; best.z = heroPos.z; best.m.position.x = best.x; best.m.position.z = best.z; d.particles.spawn(petPos.x, petPos.y + 0.5, petPos.z, { vy: 1.5, life: 0.5, s0: 0.5, s1: 0.1, c0: 0xffe08a, c1: 0xffa040, a: 1 }); return null; }
      return new THREE.Vector3(best.x, best.y, best.z);
    },
    /** pet (Estábulo, 25/10): morde quem te ataca */
    petBite(e: Enemy, dmg: number, from: THREE.Vector3) { if (!e.alive || !e.active) return; const n = Math.max(1, Math.round(dmg)); dmgText(e.pos.clone().setY(e.pos.y + 2.0), n, false, '#ffd890');
      for (let q = 0; q < 6; q++) d.particles.spawn(e.pos.x + rnd(-0.3, 0.3), e.pos.y + 0.6, e.pos.z + rnd(-0.3, 0.3), { vx: rnd(-1, 1), vy: rnd(0.5, 2), vz: rnd(-1, 1), life: 0.4, s0: 0.25, s1: 0.05, c0: 0xffffff, c1: 0xb3202f, a: 1 });
      if (enemies.hurt(e, n, from, 0.6)) killEnemy(e); },
    /** pet: o alarido — quem vinha para cima de você para e procura de onde veio o barulho */
    petDistract(e: Enemy, secs: number) { if (!e.alive || !e.active || isElite(e)) return false; e.state = 'hurt'; e.t = -secs; dmgText(e.pos.clone().setY(e.pos.y + 2.6), '?!', false, '#ffe08a'); return true; },
    get flaming() { return flameT > 0; },
    dbg() { return { turrets: turrets.map((t) => [t.x, t.z, t.t]), en: enemies.list.filter((e) => e.active).map((e) => [e.type, e.alive, Math.round(e.pos.x), Math.round(e.pos.z)]) }; },
    hurtNow() { return now - lastHurt < 0.1; },
    get formId() { return form?.id ?? null; },
    update(dt: number, heroPos: THREE.Vector3, karma: number, raceLabel: string, muted: boolean) {
      now += dt;
      for (const k of Object.keys(cdX)) cdX[k] = Math.max(0, cdX[k] - dt * (st.sp.has('r_gear') ? 1.3 : 1));
      for (let i = ticks.length - 1; i >= 0; i--) { const tk = ticks[i]; tk.t -= dt; try { tk.fn(dt, tk.t); } catch (er) { if (!(tk as { warned?: boolean }).warned) { (tk as { warned?: boolean }).warned = true; console.warn('[tick]', er); } } if (tk.t <= 0) { tk.end?.(); ticks.splice(i, 1); } }
      /* 25/10 noite: a esfera do tecnocrata formado, a luz da esfera no escuro, a fera do lobisomem, as mãos nuas do lobisomem e as granadas do morteiro */
      { const h = d.getHero(); heroMps += (Math.hypot(heroPos.x - lastHeroP.x, heroPos.z - lastHeroP.z) / Math.max(1e-3, dt) - heroMps) * Math.min(1, dt * 10); lastHeroP.copy(heroPos); if (heroMps > 30) heroMps = 0;
        /* dia e noite (Erling, 25/10): o lobisomem de dia é o licantropo (homem maior e mais forte; a Besta só à noite);
           o vampiro queima ao sol fora da sombra (casas, masmorras, mata fechada, Corvoscuro) e à noite fica mais feroz e mais rápido */
        { const isV = kitKey === 'vam', isL = kitKey === 'lob', nightNow = skyNight > 0.5; cmod.dmg = 0; cmod.move = 1; baseScale = isL ? 1.1 : 1; if (isL) cmod.dmg += 0.1;
          { const k3 = n3Key(); if (k3 && !st.dead) { if (st.lastCast !== n3Cast) { if (st.lastCast > n3Cast && k3 !== 'cac') need3[k3] = Math.min(1, need3[k3] + (k3 === 'bru' ? 0.0012 : 0.0009) * (n3Calm > 0 ? 0.4 : 1)); n3Cast = st.lastCast; }
            need3[k3] = Math.min(1, need3[k3] + dt / (30 * TURN_S)); n3Calm = Math.max(0, n3Calm - dt); const v3 = need3[k3]; n3SaveT -= dt; if (n3SaveT <= 0) { n3SaveT = 6; try { localStorage.setItem(NEED3_KEY, JSON.stringify(need3)); } catch { /* */ } }
            if (v3 > 0.5) { if (k3 === 'mag' || k3 === 'cac') cmod.dmg -= 0.04; if (k3 === 'bru' && st.hp > st.hpMax * 0.9) st.hp = st.hpMax * 0.9; }
            if (k3 === 'bru' && v3 > 0.8) { cobradorT -= dt; if (cobradorT <= 0) { cobradorT = 600; const hp = d.getHero().root.position; const e = enemies.debugSpawn?.('imp', hp.x + 4, hp.z + 3, 0, 'chase'); if (e) logMsg('🜏 O Cobrador do Pacto veio buscar o que é de Malgrath.', '#c08aff'); } }
            const s3 = v3 > 0.8 ? 2 : v3 > 0.5 ? 1 : 0; if (s3 > n3Stage || (s3 === 2 && now > n3MsgT)) { n3MsgT = now + 300; logMsg(N3_TXT[k3][s3 - 1], s3 === 2 ? '#ff8a6a' : '#c8b0ff'); } n3Stage = s3; } }
          if (kitKey === 'pal' && !st.dead) { doubt = Math.min(1, doubt + dt / (30 * TURN_S)); graceT = Math.max(0, graceT - dt); if (doubt > 0.5) cmod.dmg -= 0.06; doubtSaveT -= dt; if (doubtSaveT <= 0) { doubtSaveT = 6; try { localStorage.setItem(DOUBT_KEY, String(doubt)); } catch { /* */ } }
            const ds = doubt > 0.8 ? 2 : doubt > 0.5 ? 1 : 0; if (ds > doubtStage || (ds === 2 && now > doubtMsgT)) { doubtMsgT = now + 300; logMsg(ds === 2 ? '✝ A fé vacila: tanto sangue em nome da Luz... As escolhas boas não pesam e o karma escorre. Faça o Jejum e Oração (Pão Ázimo e Vinho Santo).' : '✝ A Dúvida chega: a Luz responde menos às suas mãos.', ds === 2 ? '#ff8a6a' : '#e8d080'); } doubtStage = ds; }
          if (warrior && !st.dead) { fury = Math.min(1, fury + dt / (30 * TURN_S)); /* sozinho, 30 turnos; quem luta muito chega lá em ~20 */ calmT = Math.max(0, calmT - dt); if (fury > 0.5) cmod.dmg += 0.05; furySaveT -= dt; if (furySaveT <= 0) { furySaveT = 6; try { localStorage.setItem(FURY_KEY, String(fury)); } catch { /* */ } }
            const fs = fury > 0.8 ? 2 : fury > 0.5 ? 1 : 0; if (fs > furyStage || (fs === 2 && now > furyMsgT)) { furyMsgT = now + 300; logMsg(fs === 2 ? '🪓 A loucura da batalha sobe à cabeça: as escolhas boas escapam de você e a alma escurece. Faça o ritual de calmaria (Kit de Incensos de Mortificação).' : '🪓 Frenesi: o sangue ferve. Mais dano, guarda mais baixa.', fs === 2 ? '#ff6a5a' : '#ffb060'); } furyStage = fs; }
          if ((isV || isL) && !st.dead) { crave.v = Math.min(1, crave.v + dt / CRAVE_FULL); crave.real += dt; feastT = Math.max(0, feastT - dt); craveSaveT -= dt; if (craveSaveT <= 0) { craveSaveT = 6; saveCrave(); }
            const cv = crave.v; if (feastT > 0) cmod.dmg += 0.05; /* bem alimentado: +5%, ainda dentro do balde capado */
            if (cv > 0.6) { const k = cv > 0.9 ? 1 : (cv - 0.6) / 0.3; cmod.dmg -= 0.08 + 0.1 * k; cmod.move *= 1 - 0.06 - 0.1 * k; }
            const stg = cv > 0.9 ? 2 : cv > 0.6 ? 1 : 0; if (stg > craveStage || (stg && now > craveMsgT)) { craveMsgT = now + 240; logMsg(stg === 2 ? (isV ? '🩸 A sede é insuportável: você está lento e fraco. Precisa de sangue de gente — ou de uma Injeção dos tecnocratas.' : '🍖 A fome da fera é insuportável: lento e fraco. Precisa de carne de gente — ou da Charcutaria dos vampiros.') : (isV ? '🩸 A sede aperta. Sangue de bicho só engana.' : '🍖 A fera sente fome de carne. Bicho só engana.'), stg === 2 ? '#ff5a5a' : '#ffb080'); } craveStage = stg; }
          if (isV) { sunVeilT = Math.max(0, sunVeilT - dt); const exposed = !nightNow && !skyShade && !st.dead; sunK = Math.max(0, Math.min(1, sunK + (exposed ? dt / (sunVeilT > 0 ? 120 : 14) : -dt / 5)));
            if (sunK > 0) { if (st.hp > st.hpMax * 0.08) st.hp = Math.max(st.hpMax * 0.08, st.hp - st.hpMax * 0.012 * sunK * dt); cmod.dmg -= 0.2 * sunK; cmod.move *= 1 - 0.15 * sunK;
              /* Erling: não fica queimando o tempo todo — a fumaça só aparece abaixo de 45% da vida, as chamas no corpo abaixo de 20% */
              const hpk = st.hp / st.hpMax;
              if (hpk < 0.45 && Math.random() < dt * 26 * sunK) d.particles.spawn(heroPos.x + rnd(-0.3, 0.3), heroPos.y + rnd(0.4, 1.8), heroPos.z + rnd(-0.3, 0.3), { vx: rnd(-0.2, 0.2), vy: rnd(0.6, 1.4), vz: rnd(-0.2, 0.2), life: 0.9, s0: 0.2, s1: 0.55, c0: 0x8a7a6a, c1: 0x2a2420, a: 0.45 });
              if (hpk < 0.2) for (let q = 0; q < 2; q++) if (Math.random() < dt * 22 * sunK) d.particles.spawn(heroPos.x + rnd(-0.28, 0.28), heroPos.y + rnd(0.3, 1.8), heroPos.z + rnd(-0.28, 0.28), { vx: rnd(-0.2, 0.2), vy: rnd(1, 2.2), vz: rnd(-0.2, 0.2), life: 0.55, s0: 0.3, s1: 0.05, c0: 0xffe08a, c1: 0xff4a10, a: 1 }); }
            if (exposed && sunK > 0.05 && now > sunMsgT) { sunMsgT = now + 30; logMsg(sunVeilT > 0 ? '☀ O sangue diluído segura o sol, mas não para sempre.' : '☀ O sol queima a sua pele. Procure sombra (casas, masmorras, mata fechada, Corvoscuro) ou beba Sangue Diluído.', '#ffb070'); }
            if (nightNow) { cmod.dmg += 0.15; cmod.move *= 1.12; } }
          if (nightOn !== nightNow) { const first = nightOn === null; nightOn = nightNow;
            if (!first && isV) logMsg(nightNow ? '🌙 A noite acorda o sangue: +15% de dano, +12% de velocidade, golpes mais rápidos.' : '☀ O dia nasce. Sombra, ou sangue diluído.', nightNow ? '#ff6a7a' : '#ffb070');
            if (!first && isL) logMsg(nightNow ? '🌕 A noite chegou: a Forma da Besta pode despertar (0).' : '☀ O dia nasce: o lobo recua para dentro do homem.', '#c8a070');
            if (isL && !nightNow && form?.id === 'fenrir') form.t = 0.01; } }
        h.actSpeed = kitKey === 'vam' ? (skyNight > 0.5 ? 1.55 : 1.45) : kitKey === 'lob' && beastOn ? 1.2 : 1;
        techLook?.setMech(form?.id === 'mech');
        if (techLook && thunderN > 0 && Math.random() < dt * 8) { const gp = techLook.gauntlet(new THREE.Vector3()); const a2 = rnd(0, 6.283); bolt3d(gp, gp.clone().add(new THREE.Vector3(Math.cos(a2) * 0.35, rnd(-0.3, 0.3), Math.sin(a2) * 0.35)), 0xbff4ff); techLook.charge(0.6); }
        // Drone Médico: um drone de verdade (casco branco, cruz verde, quatro rotores) que orbita e manda o feixe de cura
        if (medicT > 0) { if (!medicDrone) { const g = new THREE.Group(), w = new THREE.MeshToonMaterial({ color: 0xe8ecf0, gradientMap: ramp }), dk = new THREE.MeshToonMaterial({ color: 0x3a4250, gradientMap: ramp }), gm2 = new THREE.MeshBasicMaterial({ color: 0x7affd0 });
            const hull = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 10), w); hull.scale.set(1.2, 0.6, 1.2); g.add(hull); const cx = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.012, 0.035), gm2); cx.position.y = 0.075; g.add(cx); const cz = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.012, 0.11), gm2); cz.position.y = 0.075; g.add(cz);
            for (let i = 0; i < 4; i++) { const a2 = i / 4 * Math.PI * 2 + Math.PI / 4; const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.22, 5), dk); arm.rotation.z = Math.PI / 2; arm.rotation.y = -a2; arm.position.set(Math.cos(a2) * 0.11, 0.02, Math.sin(a2) * 0.11); g.add(arm); const rot = new THREE.Mesh(new THREE.CircleGeometry(0.07, 14), new THREE.MeshBasicMaterial({ color: 0xcfd8e0, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false })); rot.rotation.x = -Math.PI / 2; rot.position.set(Math.cos(a2) * 0.21, 0.05, Math.sin(a2) * 0.21); g.add(rot); }
            const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), gm2); lamp.position.y = -0.07; g.add(lamp); fxAdd(g); g.userData.dyn = true; medicDrone = g; }
          const a2 = now * 2.2, md = medicDrone; md.visible = true; md.position.set(heroPos.x + Math.cos(a2) * 1.1, heroPos.y + 2.1 + Math.sin(now * 3) * 0.1, heroPos.z + Math.sin(a2) * 1.1); md.rotation.y = -a2; md.rotation.z = Math.sin(now * 2) * 0.1;
          medicBeamT -= dt; if (medicBeamT <= 0) { medicBeamT = 0.5; const from = md.position.clone().setY(md.position.y - 0.08), to = heroPos.clone().setY(heroPos.y + 1.2); beam(from, to, 0x7affd0, 0.03, 0.3); for (let q = 0; q < 8; q++) d.particles.spawn(to.x + rnd(-0.3, 0.3), to.y + rnd(-0.4, 0.4), to.z + rnd(-0.3, 0.3), { vy: rnd(0.4, 1.2), life: 0.7, s0: 0.12, s1: 0.03, c0: 0xffffff, c1: 0x7affd0, a: 1 }); } }
        else if (medicDrone) medicDrone.visible = false;
        if (kitKey === 'tecno' && h.kind !== 'technocrat') { if (!sideDrone) sideDrone = mkSideDrone(); const D = sideDrone; D.g.visible = true; (D.glow.material as THREE.SpriteMaterial).color.setScalar(reactor.charge <= 0 ? 0.15 : 1); const y = h.root.rotation.y; droneGoT -= dt;
          const guarding = h.guard && !st.dead; bubbleT = Math.max(0, bubbleT - dt);
          if (!droneShield) { const sm = new THREE.MeshBasicMaterial({ color: 0x8af0ff, map: hexMap, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }); droneShield = new THREE.Mesh(new THREE.SphereGeometry(1.4, 20, 10, -0.75, 1.5, Math.PI * 0.22, Math.PI * 0.5), sm); fxAdd(droneShield); droneShield.userData.dyn = true; }
          { const m = droneShield.material as THREE.MeshBasicMaterial; m.opacity += ((guarding ? 0.36 : 0) - m.opacity) * Math.min(1, dt * 10); droneShield.visible = m.opacity > 0.02; droneShield.position.set(heroPos.x, heroPos.y + 0.15, heroPos.z); droneShield.rotation.y = y; hexMap.offset.y = -now * 0.2;
            if (guarding && Math.random() < dt * 6) { const sp2 = D.g.position.clone(), tp2 = new THREE.Vector3(heroPos.x + Math.sin(y + rnd(-0.6, 0.6)) * 1.35, heroPos.y + rnd(0.5, 1.6), heroPos.z + Math.cos(y + rnd(-0.6, 0.6)) * 1.35); beam(sp2, tp2, 0x8af0ff, 0.012, 0.1); } }
          { // o que a esfera faz em cada postura (fora o que já faz: buscar itens nos modos de ataque e de grupo)
            gasT -= dt; shellCd = Math.max(0, shellCd - dt);
            if (droneMode !== 'atk' && gasT <= 0 && h.combat) { gasT = droneMode === 'def' ? 6 : 4.5; const tx2 = droneMode === 'def' ? heroPos.x : heroPos.x + rnd(-1.5, 1.5), tz2 = droneMode === 'def' ? heroPos.z : heroPos.z + rnd(-1.5, 1.5); healGas(tx2, tz2, D.g.position.clone(), droneMode === 'def' ? 0.04 : 0.03); D.droneFlash = 1; }
            if (droneMode === 'def' && !aegis && shellCd <= 0 && !guarding) { shellCd = 12; const g2 = new THREE.Group(); const A = mkAegis(); const u = A.u; (u as unknown as { col: { value: THREE.Color } }).col.value.setHex(0x8af0ff); d.scene.remove(A.m);
              for (let i = 0; i < 6; i++) g2.add(new THREE.Mesh(new THREE.SphereGeometry(1.3, 10, 8, i / 6 * Math.PI * 2, 0.5, Math.PI * 0.26, Math.PI * 0.4), A.m.material as THREE.Material)); fxAdd(g2); g2.userData.dyn = true;
              const max = Math.round(st.hpMax * 0.08); aegis = { hp: max, max, m: g2, u, tier: 0 }; const me = aegis; let tt = 0;
              ticks.push({ t: 30, fn: (dt2) => { if (aegis !== me) return; tt += dt2; const hh = d.getHero().root.position; g2.position.set(hh.x, hh.y + 0.05, hh.z); g2.rotation.y += dt2 * 1.2; me.u.t.value = tt; me.u.hit.value = Math.max(0, me.u.hit.value - dt2 * 4); me.u.op.value = Math.min(0.55, tt * 2) * (0.4 + 0.6 * me.hp / me.max); }, end: () => { if (aegis === me) { aegis = null; d.scene.remove(g2); } } }); }
          }
          const goal = guarding ? new THREE.Vector3(heroPos.x + Math.sin(y) * 0.85, heroPos.y + 1.45, heroPos.z + Math.cos(y) * 0.85) : droneMode === 'def' && !D.droneTo && droneGoT <= 0 ? new THREE.Vector3(heroPos.x + Math.sin(now * 1.3) * 0.7, heroPos.y + 1.9, heroPos.z + Math.cos(now * 1.3) * 0.7) : bubbleT > 0 ? new THREE.Vector3(heroPos.x, heroPos.y + 2.5 + Math.sin(now * 2) * 0.06, heroPos.z) : droneGoT > 0 ? droneGo.clone() : D.droneTo ? D.droneTo.clone() : workAt ? new THREE.Vector3(workAt.x - Math.sin(y) * 0.2, d.world.heightAt(workAt.x, workAt.z) + 1.25, workAt.z - Math.cos(y) * 0.2)
            : new THREE.Vector3(heroPos.x - Math.cos(y) * 0.7 - Math.sin(y) * 0.35, heroPos.y + 2.05 + Math.sin(now * 1.7) * 0.08, heroPos.z + Math.sin(y) * 0.7 - Math.cos(y) * 0.35);
          const k = Math.min(1, dt * (droneGoT > 0 || D.droneTo ? 6 : 3.2)); D.vel.copy(goal).sub(D.g.position).multiplyScalar(k); D.g.position.add(D.vel);
          let dy = y - D.g.rotation.y; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2; D.g.rotation.y += dy * Math.min(1, dt * 4); D.g.rotation.z = THREE.MathUtils.clamp(-D.vel.x * 5, -0.5, 0.5); D.g.rotation.x = THREE.MathUtils.clamp(D.vel.z * 5, -0.5, 0.5);
          D.ring.rotation.y += dt * 2.2; D.ring2.rotation.y -= dt * 1.4; D.droneFlash = Math.max(0, D.droneFlash - dt * 5); D.eye.scale.setScalar(1 + D.droneFlash * 0.7); (D.glow.material as THREE.SpriteMaterial).opacity = 0.3 + heroDark * 0.4 + D.droneFlash * 0.6;
          if (workAt && !D.droneTo && droneGoT <= 0 && Math.random() < dt * 5) { const a = D.g.position.clone(), b = new THREE.Vector3(workAt.x + rnd(-0.3, 0.3), d.world.heightAt(workAt.x, workAt.z) + rnd(0.3, 1.0), workAt.z + rnd(-0.3, 0.3)); beam(a, b, 0x8af0ff, 0.02, 0.12); D.droneFlash = 0.6; for (let q = 0; q < 6; q++) d.particles.spawn(b.x, b.y, b.z, { vx: rnd(-2, 2), vy: rnd(0.5, 3), vz: rnd(-2, 2), life: 0.4, s0: 0.1, s1: 0.03, c0: 0xffffff, c1: 0xffc060, a: 1, g: 9 }); }
        } else if (sideDrone) sideDrone.g.visible = false;
        { const DR = h.kind === 'technocrat' ? h : kitKey === 'tecno' && sideDrone ? sideDrone : null; const want = DR ? heroDark * 7 : 0; droneLight.intensity += (want - droneLight.intensity) * Math.min(1, dt * 3); if (DR) DR.dronePos(droneLight.position); droneLight.visible = droneLight.intensity > 0.05;
          const ws = DR && !(kitKey === 'tecno' && reactor.charge <= 0) ? heroDark * 60 : 0; droneSpot.intensity += (ws - droneSpot.intensity) * Math.min(1, dt * 3); droneSpot.visible = droneSpot.intensity > 0.1;
          if (DR) { DR.dronePos(droneSpot.position); const yy = h.root.rotation.y; droneSpot.target.position.set(heroPos.x + Math.sin(yy) * 6, heroPos.y, heroPos.z + Math.cos(yy) * 6); droneSpot.target.updateMatrixWorld(); } }
        // lobisomem: luta sem arma (garras); a espada e o escudo somem enquanto não estiver com ferramenta de ofício na mão
        { const rg = (h as unknown as { rig?: { sword?: () => THREE.Object3D | null; shield?: () => THREE.Object3D | null } }).rig; const sw = rg?.sword?.() ?? null, shd = rg?.shield?.() ?? null;
          if (kitKey === 'lob' && beastOn) { if (sw) sw.visible = false; if (shd) shd.visible = false; lobHid = true; } /* de dia o licantropo luta com porrete, maça e alabarda; garras só na Besta */ else if (kitKey === 'mag' || kitKey === 'bru') { if (shd) shd.visible = false; if (sw) sw.visible = true; lobHid = true; } /* mago e bruxo: sem escudo, a mão livre conjura */ else if (kitKey === 'tecno') { if (shd) shd.visible = false; if (sw) sw.visible = !!wmode || h.holdTool; lobHid = true; } /* tecnocrata: nada de espada, adaga ou arco — só as armas da Academia; sem elas, a manopla */ else if (lobHid) { if (sw) sw.visible = true; if (shd) shd.visible = true; lobHid = false; } } // tecnocrata não usa escudo: quem defende é a esfera
        if (form?.id === 'fenrir' && kitKey === 'lob') { beastShow(true); const B = beast!; for (const c of h.root.children) if (c !== B.root) c.visible = false;
          const an = h.actName, p = h.actP; if (an && an !== beastLastAct) beastSide = -beastSide; beastLastAct = an;
          const mode = !an || an === 'dash' || an === 'dodge' ? null : an === 'cast' ? (lastExtra === 'bite' ? 'bite' : 'howl') : an === 'slam' || an === 'bash' || an === 'rush' ? 'pounce' : an === 'kick' ? (lastExtra === 'bite' ? 'bite' : 'clawR') : an === 'combo2' || an === 'combo4' || an === 'lowcut' ? 'clawL' : an === 'hit' ? null : beastSide > 0 ? 'clawR' : 'clawL';
          const hold = mode === 'howl' ? 0.9 : 0.8, fade = 1 - THREE.MathUtils.smoothstep(p, hold, 1); const W = mode ? Math.min(1, p / 0.32) * fade : 0, S2 = mode && mode !== 'howl' ? THREE.MathUtils.smoothstep(p, 0.32, 0.5) * fade : 0;
          B.pose({ dt, mv: heroMps, wind: W, strike: S2, hurt: an === 'hit' ? Math.sin(p * Math.PI) : 0, mode, combat: h.combat });
          if (S2 > 0.3 && S2 < 0.6 && mode && mode !== 'bite' && mode !== 'howl' && Math.random() < dt * 30) { const hp2 = B.hand(mode === 'clawL' ? -1 : 1, new THREE.Vector3()); d.particles.spawn(hp2.x, hp2.y, hp2.z, { life: 0.16, s0: 0.16, s1: 0.03, c0: 0xffffff, c1: 0xffc0a0, a: 1 }); }
        } else if (beastOn) beastShow(false);
        for (let i = convertedL.length - 1; i >= 0; i--) { const c = convertedL[i]; if (!c.e.alive || now > c.until) { convertedL.splice(i, 1); continue; } if (c.e.state === 'chase' || c.e.state === 'windup' || c.e.state === 'recover') { c.e.state = 'flee'; c.e.t = 0; } if (Math.random() < dt * 4) d.particles.spawn(c.e.pos.x, c.e.pos.y + 2.3, c.e.pos.z, { vy: 0.6, life: 0.8, s0: 0.15, s1: 0.03, c0: 0xffffff, c1: 0xffe08a, a: 0.9 }); }
        for (let i = shells.length - 1; i >= 0; i--) { const s2 = shells[i]; s2.t += dt; s2.v.y -= 18 * dt; s2.p.addScaledVector(s2.v, dt); s2.m.position.copy(s2.p); s2.m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), s2.v.clone().normalize());
          if (Math.random() < dt * 40) d.particles.spawn(s2.p.x, s2.p.y, s2.p.z, { vx: rnd(-0.2, 0.2), vy: rnd(0, 0.3), vz: rnd(-0.2, 0.2), life: 0.6, s0: 0.25, s1: 0.6, c0: 0xcccccc, c1: 0x555555, a: 0.4 });
          const gy = d.world.heightAt(s2.p.x, s2.p.z); if (s2.t >= s2.dur || (s2.v.y < 0 && s2.p.y <= gy + 0.1)) { shells.splice(i, 1); d.scene.remove(s2.m); explode(s2.tx, s2.tz, d.world.heightAt(s2.tx, s2.tz), 2.2, s2.mul, 0xffa040, 1.0, s2.p.clone());
            for (let q = 0; q < 24; q++) { const a = rnd(0, 6.283); d.particles.spawn(s2.tx, gy + 0.2, s2.tz, { vx: Math.cos(a) * rnd(1, 4), vy: rnd(2, 6), vz: Math.sin(a) * rnd(1, 4), life: 1, s0: 0.18, s1: 0.1, c0: 0x6a5a40, c1: 0x3a3026, a: 1, g: 14 }); } } }
      }
      // fôlego: volta devagar (mais rápido parado)
      if (st.stam < st.stamMax) st.stam = Math.min(st.stamMax, st.stam + dt * (heroMoving ? 9 : 16) * (st.god ? 10 : 1));
      if (buff.dmgT > 0) { buff.dmgT -= dt; if (buff.dmgT <= 0) buff.dmg = 1; } if (buff.defT > 0) { buff.defT -= dt; if (buff.defT <= 0) buff.def = 0; } if (buff.moveT > 0) { buff.moveT -= dt; if (buff.moveT <= 0) buff.move = 1; } if (buff.burnT > 0) buff.burnT -= dt;
      { const h = d.getHero(); if (form) { form.t -= dt; const sc = 1 + (form.scale - 1) * Math.min(1, (10 - Math.max(0, form.t - 0.5) * 0) * 0.3); h.root.scale.setScalar(sc * baseScale); if (Math.random() < dt * 25) d.particles.spawn(heroPos.x + rnd(-0.5, 0.5), rnd(0.1, 2.2), heroPos.z + rnd(-0.5, 0.5), { vy: rnd(0.5, 2), life: 0.6, s0: 0.4, s1: 0.05, c0: form.id === 'fenrir' ? 0xff6a4a : form.id === 'mech' ? 0x9ad7ff : form.id === 'avenging' ? 0xffe08a : form.id === 'nightform' ? 0x8a0a1a : 0xd8c8a8, c1: 0x000000, a: 0.9 }); if (form.t <= 0) { form = null; h.root.scale.setScalar(baseScale); buff.leech = 0; h.setAura(false); logMsg('A transformação acabou.', '#c8d8f0'); } } else if (buff.burnT <= 0 && h.root.scale.x !== baseScale) h.root.scale.setScalar(baseScale); if (buff.burnT > 0 && Math.random() < dt * 20) { const tp = h.weaponTip(new THREE.Vector3()); d.particles.spawn(tp.x, tp.y, tp.z, { vy: rnd(0.5, 1.5), life: 0.4, s0: 0.4, s1: 0.05, c0: 0xffd070, c1: 0xff3a10, a: 0.9 }); } if (!form && buff.burnT <= 0 && h.actName !== 'cast') { /* aura só durante formas/forja */ } }
      for (let i = zones.length - 1; i >= 0; i--) { const z = zones[i]; z.t -= dt; (z.m.material as THREE.MeshBasicMaterial).opacity = 0.2 + 0.1 * Math.sin(now * 6); if (Math.random() < dt * 12) { const a = rnd(0, 6.283), r = rnd(0, z.r); d.particles.spawn(z.x + Math.cos(a) * r, 0.2, z.z + Math.sin(a) * r, { vy: rnd(0.5, 1.5), life: 0.8, s0: 0.3, s1: 0.05, c0: 0xffd070, c1: 0xc8a050, a: 0.8 }); } for (const e of enemies.list) if (e.alive && e.active && Math.hypot(e.pos.x - z.x, e.pos.z - z.z) < z.r) e.slow = 0.3; if (Math.hypot(heroPos.x - z.x, heroPos.z - z.z) < z.r) { buff.def = Math.max(buff.def, 0.3); buff.defT = Math.max(buff.defT, 0.2); } if (z.t <= 0) { d.scene.remove(z.m); zones.splice(i, 1); } }
      for (let i = pillars.length - 1; i >= 0; i--) { const p = pillars[i]; p.t += dt; const k = p.t < 0 ? 0 : Math.min(1, p.t / 0.25); p.m.position.y = p.y0 + 2.0 * k - (p.t > 5 ? (p.t - 5) * 2 : 0); if (p.t > 6.2) { d.scene.remove(p.m); p.m.geometry.dispose(); pillars.splice(i, 1); } }
      if (flameT > 0) { // lança-chamas: jato denso de 9 m que acompanha o mouse; dá para andar enquanto queima
        flameT -= dt; const h = d.getHero(); flameYaw = h.root.rotation.y; const from = kitKey === 'tecno' && techLook && !wmode ? techLook.gauntlet(new THREE.Vector3()) : h.weaponTip(new THREE.Vector3()); /* tecnocrata sem arma da Academia: o bocal da manopla */ const dir = new THREE.Vector3(Math.sin(flameYaw), 0, Math.cos(flameYaw)); h.muzzle();
        const side = new THREE.Vector3(dir.z, 0, -dir.x);
        const PZ = flameKind === 'poison', FR = flameReach / 9.5; for (let k = 0; k < (FR < 1 ? 9 : 14); k++) { const sp = rnd(11, 19) * FR, lat = rnd(-1.4, 1.4) * FR; d.particles.spawn(from.x, from.y + rnd(-0.05, 0.05), from.z, { vx: dir.x * sp + side.x * lat, vy: rnd(0.2, 2.2), vz: dir.z * sp + side.z * lat, life: rnd(0.45, 0.8), s0: 0.45, s1: rnd(1.8, 2.8), c0: PZ ? (k % 3 ? 0xc8ff6a : 0xeaffc0) : k % 3 ? 0xffd060 : 0xffffff, c1: PZ ? (k % 2 ? 0x2a8a1a : 0x6ad02a) : k % 2 ? 0xff3a10 : 0xff7a10, a: 0.95, drag: 1.5, g: PZ ? 1.5 : -2.5 }); }
        for (let k = 0; k < 3; k++) { const sp = rnd(8, 14) * FR; d.particles.spawn(from.x, from.y, from.z, { vx: dir.x * sp + rnd(-2, 2), vy: rnd(1, 4), vz: dir.z * sp + rnd(-2, 2), life: rnd(0.8, 1.4), s0: 0.25, s1: 0.05, c0: PZ ? 0xd8ff8a : 0xffe8a0, c1: PZ ? 0x3a9a2a : 0xff5a10, a: 1, drag: 1.2, g: 4 }); } // brasas (ou gotas de veneno)
        if (Math.random() < dt * 14) { const sp = rnd(5, 9); d.particles.spawn(from.x + dir.x * 2, from.y + 0.4, from.z + dir.z * 2, { vx: dir.x * sp, vy: rnd(1.5, 3), vz: dir.z * sp, life: 1.6, s0: 1.2, s1: 2.6, c0: 0x5a5a5a, c1: 0x1a1a1a, a: 0.35, drag: 1 }); } // fumaça
        if (Math.random() < dt * 20) { const r = rnd(2, 9); d.particles.spawn(from.x + dir.x * r + rnd(-0.8, 0.8), 0.15, from.z + dir.z * r + rnd(-0.8, 0.8), { vy: rnd(0.8, 2.2), life: rnd(0.5, 1.1), s0: 0.6, s1: 1.4, c0: 0xffb040, c1: 0xff3a10, a: 0.8, g: -1 }); } // chão pegando fogo
        spellLight.position.copy(from).addScaledVector(dir, 3).setY(1.2); spellLight.color.setHex(PZ ? 0x8aff4a : 0xff8a30); spellLight.intensity = 50 + 20 * Math.sin(now * 40);
        if (Math.random() < dt * 8) for (const e of enemies.list) { if (!e.alive || !e.active) continue; const tx2 = e.pos.x - from.x, tz2 = e.pos.z - from.z, dd = Math.hypot(tx2, tz2); if (dd > flameReach + e.def.radius) continue; let ea = Math.atan2(tx2, tz2) - flameYaw; while (ea > Math.PI) ea -= Math.PI * 2; while (ea < -Math.PI) ea += Math.PI * 2; if (Math.abs(ea) < 0.42 + 0.6 / Math.max(1, dd)) { skill = 'combo'; hitEnemy(e, flameMul, false, from); skill = null; if (e.alive) { e.burn = 5; e.burnTick = e.burnTick ?? 0; e.psn = PZ; if (PZ) e.slow = 0.55; } } }
        if (flameT <= 0) { h.freeze = false; flameMul = 0.55; flameReach = 9.5; flameKind = 'fire'; } }
      for (let i = puddles.length - 1; i >= 0; i--) { const pd = puddles[i]; pd.t -= dt; (pd.m.material as THREE.MeshBasicMaterial).opacity = 0.25 + 0.1 * Math.sin(now * 5); if (Math.random() < dt * 10) { const a = rnd(0, 6.283), r = rnd(0, pd.r); d.particles.spawn(pd.x + Math.cos(a) * r, 0.2, pd.z + Math.sin(a) * r, { vy: rnd(0.3, 0.9), life: 1, s0: 0.3, s1: 0.5, c0: 0x9aff8a, c1: 0x1a5a1a, a: 0.5 }); } for (const e of enemies.list) if (e.alive && e.active && Math.hypot(e.pos.x - pd.x, e.pos.z - pd.z) < pd.r + e.def.radius) { e.slow = 0.3; if (Math.random() < dt * 1.6) { const dm = 5 + st.lvl * 2; if (enemies.hurt(e, dm, e.pos, 0)) killEnemy(e); dmgText(e.pos.clone().setY(e.pos.y + 2.0), dm, false, '#8aff6a'); } } if (pd.t <= 0) { d.scene.remove(pd.m); puddles.splice(i, 1); } }
      if (overT > 0) { overT -= dt; const h = d.getHero(); const e = enemies.nearest(heroPos, 11); if (e && Math.random() < dt * 12) { const dp = h.dronePos(new THREE.Vector3()); h.droneFlash = 1; beam(dp, e.pos.clone().setY(e.pos.y + 1), 0x8af0ff, 0.07, 0.12); skill = 'combo'; hitEnemy(e, 0.3, false, dp); skill = null; } }
      if (medicT > 0) { medicT -= dt; if (Math.random() < dt * 30) d.particles.spawn(heroPos.x + Math.cos(now * 3) * 1.2, 1.6 + Math.sin(now * 5) * 0.2, heroPos.z + Math.sin(now * 3) * 1.2, { life: 0.5, s0: 0.5, s1: 0.1, c0: 0xffffff, c1: 0x7affd0, a: 0.9 }); }
      st.counterT = Math.max(0, st.counterT - dt); st.ambushT = Math.max(0, st.ambushT - dt);
      for (const e of enemies.list) if ((e.burn ?? 0) > 0 && e.alive) {
        e.burn! -= dt; e.burnTick = (e.burnTick ?? 0) + dt;
        if (Math.random() < dt * 14) d.particles.spawn(e.pos.x + rnd(-0.3, 0.3), e.pos.y + rnd(0.3, 1.5), e.pos.z + rnd(-0.3, 0.3), { vx: rnd(-0.2, 0.2), vy: rnd(0.8, 1.8), vz: rnd(-0.2, 0.2), life: 0.5, s0: 0.35, s1: 0.05, c0: e.psn ? 0xc8ff6a : 0xffd070, c1: e.psn ? 0x2a7a1a : 0xff3a10, a: 0.9 });
        if (e.burnTick >= 0.7) { e.burnTick = 0; const dm = 4 + st.lvl * 2; const k = enemies.hurt(e, dm, e.pos, 0); dmgText(e.pos.clone().setY(e.pos.y + 2.0), dm, false, e.psn ? '#9aff6a' : '#ff9a40'); if (k) killEnemy(e); }
        if ((e.burn ?? 0) <= 0) e.psn = false;
      }
      for (const k of Object.keys(cd) as (keyof typeof cd)[]) cd[k] = Math.max(0, cd[k] - dt);
      for (let i = pending.length - 1; i >= 0; i--) if (now >= pending[i].at) { pending.splice(i, 1)[0].fn(); }
      // regeneração
      if (kitKey === 'tecno') { reactor.charge = Math.max(0, reactor.charge - dt / (60 * (REACT_MIN[reactor.tier] ?? 150))); reactSaveT -= dt; if (reactSaveT <= 0) { reactSaveT = 5; try { localStorage.setItem(REACT_KEY, JSON.stringify(reactor)); } catch { /* */ } }
        if (reactor.charge < 0.15 && now > reactWarn) { reactWarn = now + 120; logMsg(reactor.charge <= 0 ? '⚛ O reator está vazio: a Energia não volta e a esfera apagou. Troque o Núcleo de Reator (Companhia de Latão ou um ferreiro).' : `⚛ Reator em ${Math.round(reactor.charge * 100)}%: providencie um Núcleo novo.`, '#ffb060'); } }
      if (st.res.mode === 'regen') { const rk = (kitKey === 'tecno' ? (reactor.charge <= 0 ? 0 : reactor.charge < 0.15 ? 0.5 : 1) : 1) * (n3Key() === 'mag' && need3.mag > 0.5 ? 0.7 : 1); if (now - st.lastCast > 1.4) st.mp = Math.min(st.mpMax, st.mp + 7 * rk * dt * (st.sp.has('t_core') || st.sp.has('r_lantern') ? 2 : 1)); }
      if (st.sp.has('t_core') && now - lastFight < 4) st.hp = Math.min(st.hpMax, st.hp + st.hpMax * 0.01 * dt);
      else if (now - lastFight > 4) st.mp = Math.max(0, st.mp - 7 * dt); // Ímpeto/Fúria/Sangue/Ódio: fora da luta esfria e esvazia
      st.hp = Math.min(st.hpMax, st.hp + st.regen * (1 + stance.regen) * dt);
      /* auras dos Únicos e Relíquias: partículas da cor do item em volta do herói */
      if (st.sp.has('r_surtr')) buff.burnT = Math.max(buff.burnT, 0.3);
      for (const [i, c] of (st.auras ?? []).entries()) if (Math.random() < dt * (i === 0 ? 16 : 9)) { const a2 = rnd(0, 6.283), r2 = rnd(0.5, 1.0); d.particles.spawn(heroPos.x + Math.cos(a2) * r2, rnd(0.1, 1.9), heroPos.z + Math.sin(a2) * r2, { vx: -Math.sin(a2) * 0.6, vy: rnd(0.4, 1.1), vz: Math.cos(a2) * 0.6, life: rnd(0.7, 1.3), s0: 0.2, s1: 0.03, c0: 0xffffff, c1: c, a: 0.85 }); }
      /* magias nórdicas 1–20 em andamento */
      if (thunderT > 0) { thunderT -= dt; if (thunderN > 0 && Math.random() < dt * 30) { const tp = d.getHero().weaponTip(tmp); d.particles.spawn(tp.x + rnd(-0.1, 0.1), tp.y + rnd(0, 0.6), tp.z + rnd(-0.1, 0.1), { vx: rnd(-1, 1), vy: rnd(-1, 1), vz: rnd(-1, 1), life: 0.15, s0: 0.22, s1: 0.03, c0: 0xffffff, c1: 0x6ab0ff, a: 1 }); } if (thunderT <= 0 && thunderN > 0) { thunderN = 0; d.getHero().setAura(false); } }
      if (valkT > 0) { valkT -= dt; if (Math.random() < dt * 30) { const a = rnd(0, 6.283); d.particles.spawn(heroPos.x + Math.cos(a) * 0.9, rnd(0.3, 1.8), heroPos.z + Math.sin(a) * 0.9, { vy: rnd(0.2, 0.8), life: 0.4, s0: 0.14, s1: 0.03, c0: 0xffffff, c1: 0xffe08a, a: 0.9 }); } }
      for (let i = walls.length - 1; i >= 0; i--) { const w = walls[i]; w.t += dt; const k = w.t < 0.18 ? w.t / 0.18 : w.t > w.dur - 0.4 ? Math.max(0, (w.dur - w.t) / 0.4) : 1; w.g.scale.y = Math.max(0.01, k); w.g.children.forEach((c, j) => { const m = (c as THREE.Mesh).material as THREE.MeshBasicMaterial; if (m) m.opacity = (j % 3 === 1 ? 0.75 : 0.4) * k * (0.85 + 0.15 * Math.sin(now * 7 + j)); });
        const fx = Math.sin(w.yaw), fz = Math.cos(w.yaw), sx = Math.cos(w.yaw), sz = -Math.sin(w.yaw);
        for (const e of enemies.list) if (e.alive && e.active) { const af = (e.pos.x - w.x) * fx + (e.pos.z - w.z) * fz, as = (e.pos.x - w.x) * sx + (e.pos.z - w.z) * sz; if (af > -1.2 && af < 0.6 + e.def.radius && Math.abs(as) < w.w * 0.5 + 0.3) { const push = 0.6 + e.def.radius - af; e.pos.x += fx * push; e.pos.z += fz * push; } }
        if (w.tier >= 3) { const hf = (heroPos.x - w.x) * fx + (heroPos.z - w.z) * fz; if (hf < 0 && hf > -6) st.hp = Math.min(st.hpMax, st.hp + st.hpMax * 0.02 * dt); }
        if (Math.random() < dt * 10) { const u = rnd(-w.w / 2, w.w / 2); d.particles.spawn(w.x + sx * u, rnd(0.2, 1.6), w.z + sz * u, { vy: rnd(0.3, 0.9), life: 0.6, s0: 0.15, s1: 0.03, c0: 0xffffff, c1: 0x9ad7ff, a: 0.8 }); }
        if (w.t >= w.dur) { d.scene.remove(w.g); walls.splice(i, 1); } }
      for (let i = breaths.length - 1; i >= 0; i--) { const b = breaths[i]; b.t += dt; const k = Math.min(1, b.t / b.dur), front = b.r * k, fx = Math.sin(b.yaw), fz = Math.cos(b.yaw);
        for (let q = 0; q < 6; q++) { const a = b.yaw + rnd(-0.42, 0.42), sp = rnd(6, 10); d.particles.spawn(b.x + fx * 0.6, rnd(1.2, 1.6), b.z + fz * 0.6, { vx: Math.sin(a) * sp, vy: rnd(-0.6, 0.2), vz: Math.cos(a) * sp, life: rnd(0.45, 0.7), s0: rnd(0.2, 0.5), s1: rnd(0.8, 1.5), c0: 0xffffff, c1: 0x9ad7ff, a: 0.55, drag: 2.2 }); }
        if (b.tier >= 1 && Math.random() < 0.5) d.particles.spawn(b.x + fx * front, 0.15, b.z + fz * front, { vy: 0.3, life: 1.2, s0: 0.12, s1: 0.04, c0: 0xffffff, c1: 0xcfe8ff, a: 0.9 });
        for (const e of enemies.list) { if (!e.alive || !e.active || b.hit.has(e)) continue; const tx = e.pos.x - b.x, tz = e.pos.z - b.z, dd = Math.hypot(tx, tz); if (dd > front + e.def.radius) continue; let ea = Math.atan2(tx, tz) - b.yaw; while (ea > Math.PI) ea -= Math.PI * 2; while (ea < -Math.PI) ea += Math.PI * 2; if (dd > 1.2 && Math.abs(ea) > 0.55) continue;
          b.hit.add(e); const hp0 = e.hp; skill = 'winter'; hitEnemy(e, b.mul, false, new THREE.Vector3(b.x, 0, b.z)); skill = null; if (!e.alive || e.hp >= hp0) continue;
          e.slow = Math.max(e.slow ?? 0, 3 * skillScale('winter').dur);
          if (b.tier >= 2) { const fr = b.tier >= 3 ? 2 : 1; e.root2 = fr; e.state = 'hurt'; e.t = -fr; dmgText(e.pos.clone().setY(e.pos.y + 2.7), 'CONGELADO', false, '#cfe8ff'); for (let q = 0; q < 14; q++) d.particles.spawn(e.pos.x + rnd(-0.4, 0.4), e.pos.y + rnd(0.2, 1.6), e.pos.z + rnd(-0.4, 0.4), { life: fr, s0: 0.3, s1: 0.2, c0: 0xffffff, c1: 0xbfe8ff, a: 0.8 });
            if (b.tier >= 3) pending.push({ at: now + fr, fn: () => { if (!e.alive) return; const dm = Math.round((10 + st.lvl * 3) * skillScale('winter').dmg); if (enemies.hurt(e, dm, e.pos, 2)) killEnemy(e); dmgText(e.pos.clone().setY(e.pos.y + 2.3), dm, true, '#cfe8ff'); d.audio.spell('ice'); for (let q = 0; q < 30; q++) { const a = rnd(0, 6.283); d.particles.spawn(e.pos.x, e.pos.y + 1, e.pos.z, { vx: Math.cos(a) * rnd(2, 6), vy: rnd(1, 5), vz: Math.sin(a) * rnd(2, 6), life: 0.7, s0: 0.3, s1: 0.05, c0: 0xffffff, c1: 0x9ad7ff, a: 1, g: 8, drag: 1.5 }); } } }); } }
        if (b.t >= b.dur) breaths.splice(i, 1); }
      // projéteis
      const col = d.getRaceColor();
      let first = true;
      for (const b of bolts) if (b.big && Math.random() < 0.9) d.particles.spawn(b.p.x + rnd(-0.3, 0.3), b.p.y + rnd(-0.3, 0.3), b.p.z + rnd(-0.3, 0.3), { life: 0.35, s0: 1.2, s1: 0.2, c0: 0xffffff, c1: b.col ?? col, a: 1 });
      for (let i = bolts.length - 1; i >= 0; i--) {
        const b = bolts[i]; b.life -= dt; b.p.addScaledVector(b.v, dt);
        if (b.m && b.straight) { b.m.position.copy(b.p); b.m.rotation.set(0, Math.atan2(b.v.x, b.v.z), 0); }
        else if (b.m) { b.m.position.copy(b.p); b.m.rotation.set(-now * 22, Math.atan2(b.v.x, b.v.z), 0, 'YXZ'); if (Math.random() < 0.5) d.particles.spawn(b.p.x, b.p.y, b.p.z, { life: 0.18, s0: 0.25, s1: 0.04, c0: 0xffffff, c1: 0x9aa8c0, a: 0.6 }); }
        else if (!b.quiet) d.particles.spawn(b.p.x, b.p.y, b.p.z, { vx: rnd(-0.3, 0.3), vy: rnd(-0.2, 0.3), vz: rnd(-0.3, 0.3), life: 0.4, s0: 0.5, s1: 0.08, c0: b.col ?? col, c1: 0x203050, a: 0.9, drag: 2 });
        if (!b.quiet) d.particles.spawn(b.p.x, b.p.y, b.p.z, { life: 0.12, s0: 0.7, s1: 0.5, c0: 0xffffff, c1: b.col ?? col, a: 1 }); else if (!b.m) d.particles.spawn(b.p.x, b.p.y, b.p.z, { life: 0.08, s0: 0.35, s1: 0.1, c0: 0xffffff, c1: b.col ?? col, a: 1 });
        if (first) { spellLight.position.copy(b.p); spellLight.color.setHex(b.col ?? col); spellLight.intensity = 24; first = false; }
        const dd = Math.hypot(b.p.x - dummy.position.x, b.p.z - dummy.position.z);
        if (b.boomer !== undefined) { b.boomer -= dt; if (b.boomer <= 0) { b.boomer = 99; b.v.multiplyScalar(-1); b.hit?.clear(); } }
        if (b.pierce) {
          for (const e of enemies.list) if (e.alive && e.active && !b.hit!.has(e) && Math.hypot(e.pos.x - b.p.x, e.pos.z - b.p.z) < 1.1 + e.def.radius) { b.hit!.add(e); skill = b.sk ?? 'combo'; hitEnemy(e, b.mul ?? 1.8, true, b.p.clone().sub(b.v)); skill = null; if (e.alive) b.onHit?.(e); if (b.rootLast && e.alive) { e.root2 = b.rootLast; e.state = 'hurt'; e.t = -b.rootLast; } }
        } else { const be = enemies.nearest(b.p, 1.1); if (be && be.pos.y + 2.2 > b.p.y && !b.hit?.has(be)) { if (b.pulse) skill = 'combo'; if (b.sk) skill = b.sk; hitEnemy(be, b.mul ?? 1.8, !b.pulse, b.p.clone().sub(b.v)); skill = null; if (be.alive) b.onHit?.(be); b.hit?.add(be);
          // ricochete (Machadinha): salta para o inimigo mais próximo ainda não atingido
          const nx = b.ricochet ? enemies.list.filter((o) => o.alive && o.active && !b.hit?.has(o) && Math.hypot(o.pos.x - be.pos.x, o.pos.z - be.pos.z) < 7).sort((p1, p2) => Math.hypot(p1.pos.x - be.pos.x, p1.pos.z - be.pos.z) - Math.hypot(p2.pos.x - be.pos.x, p2.pos.z - be.pos.z))[0] : undefined;
          if (nx) { b.ricochet!--; const sp = b.v.length(); b.v.set(nx.pos.x - b.p.x, 0, nx.pos.z - b.p.z).normalize().multiplyScalar(sp); b.life = 0.5; d.audio.parry(); } else b.life = 0; } }
        if (dd < 0.75 && b.p.y < 2.1 || b.life <= 0) {
          if (dd < 0.75) { const crit = Math.random() < 0.15; hitDummy(Math.round(rnd(24, 38) * (crit ? 1.7 : 1)), crit, b.p.clone().sub(b.v), col); }
          if (!b.quiet) { d.audio.boom(); st.shake = Math.max(st.shake, 0.25); }
          if (!b.quiet) for (let k = 0; k < 18; k++) d.particles.spawn(b.p.x, b.p.y, b.p.z, { vx: rnd(-3, 3), vy: rnd(-1, 3), vz: rnd(-3, 3), life: 0.6, s0: 0.5, s1: 0.05, c0: 0xffffff, c1: b.col ?? col, a: 1, drag: 2.5 });
          if (b.boom) { const bb = b.boom; b.boom = undefined; explode(b.p.x, b.p.z, d.world.heightAt(b.p.x, b.p.z), bb.r, bb.mul, b.col ?? col, bb.stun ?? 0, b.p.clone().sub(b.v)); bb.fn?.(b.p.x, b.p.z); }
          if (b.m) d.scene.remove(b.m);
          bolts.splice(i, 1);
        }
      }
      if (first) spellLight.intensity = 0;
      for (let i = grenades.length - 1; i >= 0; i--) {
        const g = grenades[i]; g.t += dt; g.v.y -= 14 * dt; g.p.addScaledVector(g.v, dt); g.m.position.copy(g.p); g.m.rotation.x += dt * 9;
        d.particles.spawn(g.p.x, g.p.y + 0.15, g.p.z, { life: 0.3, s0: 0.3, s1: 0.05, c0: 0xffd070, c1: 0xff6a20, a: 0.9 });
        const gy = d.world.heightAt(g.p.x, g.p.z);
        if (g.t >= g.dur || g.p.y <= gy + 0.15) { d.scene.remove(g.m); grenades.splice(i, 1); explode(g.tx, g.tz, gy, g.r, g.mul, 0xff9a30, 1.0, g.p.clone()); for (let k = 0; k < 20; k++) d.particles.spawn(g.tx + rnd(-1, 1), gy + 0.3, g.tz + rnd(-1, 1), { vx: rnd(-1, 1), vy: rnd(1, 3), vz: rnd(-1, 1), life: 1.4, s0: 0.8, s1: 1.4, c0: 0x6a6a6a, c1: 0x222222, a: 0.5, drag: 1 }); }
      }
      for (let i = rocks.length - 1; i >= 0; i--) { const r = rocks[i]; r.t += dt; r.m.position.y = r.y0 + (r.t < 0.25 ? 0.45 * (r.t / 0.25) : r.t > 2.2 ? Math.max(0, 0.45 - (r.t - 2.2) * 0.6) : 0.45); if (r.t > 3.2) { d.scene.remove(r.m); r.m.geometry.dispose(); rocks.splice(i, 1); } }
      { const nw = Date.now(), hpp = d.getHero().root.position;
        if (gad.heal > nw) { gad.healT -= dt; if (gad.healT <= 0) { gad.healT = 6; if (st.hp < st.hpMax) { st.hp = Math.min(st.hpMax, st.hp + st.hpMax * gad.healK); if (gv.heal) gv.heal.beamT = 0.9; for (let q = 0; q < 6; q++) d.particles.spawn(hpp.x + rnd(-0.4, 0.4), hpp.y + 2, hpp.z + rnd(-0.4, 0.4), { vy: -0.8, life: 0.8, s0: 0.3, s1: 0.05, c0: 0xffffff, c1: 0x7affd0, a: 0.8 }); } } }
        if (gad.shock > nw) { gad.shockT -= dt; if (gad.shockT <= 0) { gad.shockT = gad.shockI; const e = enemies.nearest(hpp, gad.shockR); if (e && e.alive) { zap(hpp.x, hpp.y + 1.3, hpp.z, e.pos.x, e.pos.y + 1, e.pos.z, 0x6ad0ff); skill = 'combo'; hitEnemy(e, gad.shockK, false, hpp); skill = null; } } }
        if (gad.shield > nw && !gad.shieldReady) { gad.shieldT -= dt; if (gad.shieldT <= 0) gad.shieldReady = true; }
        { const hy = d.getHero().root.rotation.y, tt = performance.now() / 1000, gyh = hpp.y; /* altura do herói (degrau, varanda, ponte), não do terreno */
          /* drone de cura: paira acima do ombro, gira devagar em volta, hélices zunindo; na cura desce um feixe verde */
          if (gv.heal) { if (gad.heal <= nw) { for (let q = 0; q < 12; q++) d.particles.spawn(gv.heal.g.position.x, gv.heal.g.position.y, gv.heal.g.position.z, { vx: rnd(-1, 1), vy: rnd(0, 2), vz: rnd(-1, 1), life: 0.6, s0: 0.25, s1: 0.04, c0: 0xffffff, c1: 0x7affd0, a: 0.8 }); gvDrop('heal'); logMsg('🛸 O Drone de Cura apita duas vezes e volta para a Companhia.', '#c8b890'); }
            else { const H = gv.heal, a = tt * 0.6, tx = hpp.x + Math.sin(a) * 0.9, tz = hpp.z + Math.cos(a) * 0.9, ty = gyh + 2.55 + 0.12 * Math.sin(tt * 2.3); const k = Math.min(1, dt * 3.5); H.g.position.x += (tx - H.g.position.x) * k; H.g.position.z += (tz - H.g.position.z) * k; H.g.position.y += (ty - H.g.position.y) * k; H.g.rotation.y = a + Math.PI; H.g.rotation.z = Math.sin(tt * 1.7) * 0.08;
              for (const r of H.rotors) r.rotation.y += dt * 40; (H.lens.material as THREE.MeshBasicMaterial).color.setHex(0x7affd0).multiplyScalar(0.75 + 0.25 * Math.sin(tt * 5));
              if (H.beamT > 0) { H.beamT -= dt; H.g.updateMatrixWorld(); const loc = H.g.worldToLocal(new THREE.Vector3(hpp.x, gyh + 1.05, hpp.z)).sub(new THREE.Vector3(0, -0.12, 0)); const L = Math.max(0.5, loc.length()); H.beam.visible = true; H.beam.scale.set(1, L, 1); H.beam.position.set(0, -0.12, 0); H.beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), loc.normalize()); (H.beam.material as THREE.MeshBasicMaterial).opacity = Math.min(0.55, H.beamT); } else H.beam.visible = false; } }
          /* escudo: o robô anda do lado direito do herói; a cúpula acompanha o herói — forte pronta, apagada recarregando, pisca ao segurar */
          if (gv.bot && gad.shield <= nw) { for (let q = 0; q < 14; q++) d.particles.spawn(hpp.x, gyh + 1, hpp.z, { vx: rnd(-2, 2), vy: rnd(0, 2), vz: rnd(-2, 2), life: 0.6, s0: 0.25, s1: 0.04, c0: 0xffffff, c1: 0x6ad0ff, a: 0.8 }); gvDrop('bot'); gvDrop('dome'); logMsg('🛡 O Escudo Automatizado desliga a cúpula e volta para a Companhia.', '#c8b890'); }
          if (gv.bot) { const B = gv.bot, side = 1.3, tx = hpp.x + Math.cos(hy) * side - Math.sin(hy) * 0.3, tz = hpp.z - Math.sin(hy) * side - Math.cos(hy) * 0.3; const dx = tx - B.g.position.x, dz = tz - B.g.position.z, L = Math.hypot(dx, dz);
            const sp = Math.min(L, dt * Math.max(2.2, L * 3)); if (L > 0.05) { B.g.position.x += dx / L * sp; B.g.position.z += dz / L * sp; B.g.rotation.y = Math.atan2(dx, dz); B.phase += sp * 7; } else B.g.rotation.y += (hy - B.g.rotation.y) * Math.min(1, dt * 4);
            if (L > 8) { B.g.position.x = tx; B.g.position.z = tz; } B.g.position.y = d.world.heightAt(B.g.position.x, B.g.position.z) + Math.abs(Math.sin(B.phase)) * 0.04;
            B.legs[0].rotation.x = Math.sin(B.phase) * 0.6; B.legs[1].rotation.x = -Math.sin(B.phase) * 0.6; B.dish.rotation.y += dt * 3; }
          if (gv.dome) { const D = gv.dome; D.g.position.set(hpp.x, gyh, hpp.z); D.g.rotation.y += dt * 0.4; if (D.flash > 0) D.flash -= dt;
            const ready = gad.shieldReady, prog = ready ? 1 : 1 - Math.max(0, gad.shieldT) / gad.shieldCd, fl = Math.max(0, D.flash) * 2;
            D.shell.opacity = (ready ? 0.1 + 0.04 * Math.sin(tt * 3) : 0.02 + 0.05 * prog) + fl * 0.5; D.wire.opacity = (ready ? 0.3 + 0.08 * Math.sin(tt * 3) : 0.05 + 0.15 * prog) + fl * 0.6; D.g.scale.setScalar(1 + fl * 0.08); } }
        for (const S of [...gad.sentries]) { if (S.until < nw) { d.scene.remove(S.m); gad.sentries.splice(gad.sentries.indexOf(S), 1); saveSentries(); logMsg('🤖 Um Bartolomeu desliga e a Companhia vem buscar.', '#c8b890'); } else { S.shotT -= dt; const sp = new THREE.Vector3(S.x, 0, S.z), e = enemies.nearest(sp, S.r); if (e) S.head.rotation.y = Math.atan2(e.pos.x - S.x, e.pos.z - S.z); if (S.shotT <= 0 && e && e.alive) { S.shotT = S.iv; const sy = d.world.heightAt(S.x, S.z) + 1.05; zap(S.x, sy, S.z, e.pos.x, e.pos.y + 1, e.pos.z, 0xffc060); skill = 'combo'; hitEnemy(e, S.k, false, sp); skill = null; } } } }
      { const fe = (st as typeof st & { feast?: Record<string, { id: string; until: number } | undefined> }).feast; if (fe) for (const sl of ['meal', 'brew']) { const e = fe[sl]; if (e && e.until < Date.now()) { fe[sl] = undefined; (st as { recalc?: (() => void) | null }).recalc?.(); logMsg(`${FEASTS[e.id]?.icon ?? '🍽'} O efeito de ${FEASTS[e.id]?.name ?? 'refeição'} passou.`, '#c8b890'); } } }
      if (hot.t > 0) { hot.t -= dt; st.hp = Math.min(st.hpMax, st.hp + hot.per * (1 + stance.heal) * dt); if (Math.random() < dt * 20) d.particles.spawn(heroPos.x + rnd(-0.5, 0.5), rnd(0.2, 1.9), heroPos.z + rnd(-0.5, 0.5), { vx: rnd(-0.3, 0.3), vy: rnd(0.3, 1), vz: rnd(-0.3, 0.3), life: 0.6, s0: 0.25, s1: 0.04, c0: 0xd8fff2, c1: 0x2ad0a0, a: 0.9, flit: 2 }); }
      { const h = d.getHero();
        if (pathAct && h.actName === pathAct) {
          const p = h.actP, win = pathAct === 'jet' ? [0.08, 0.78] : pathAct === 'rush' ? [0.05, 0.64] : [0.08, 0.64];
          if (p > win[0] && p < win[1]) {
            const yw = h.root.rotation.y;
            if (pathAct === 'jet' && Math.random() < dt * 60) d.particles.spawn(heroPos.x - Math.sin(yw) * 0.4 + rnd(-0.3, 0.3), rnd(0.3, 1.4), heroPos.z - Math.cos(yw) * 0.4 + rnd(-0.3, 0.3), { vx: -Math.sin(yw) * 3 + rnd(-2, 2), vy: rnd(0, 2), vz: -Math.cos(yw) * 3 + rnd(-2, 2), life: 0.35, s0: 0.7, s1: 0.1, c0: 0xffffff, c1: pathAct === 'jet' ? 0x4de3ff : 0xb09060, a: 1, drag: 2 });
            if (pathAct === 'charge' && Math.random() < dt * 30) d.particles.spawn(heroPos.x + rnd(-0.4, 0.4), 0.2, heroPos.z + rnd(-0.4, 0.4), { vx: -Math.sin(yw) * 2, vy: rnd(0.5, 1.5), vz: -Math.cos(yw) * 2, life: 0.5, s0: 0.6, s1: 0.1, c0: 0xb8a888, c1: 0x6a5a40, a: 0.5, drag: 2 });
            for (const e of enemies.list) if (e.alive && e.active && !pathHit.has(e) && Math.hypot(e.pos.x - heroPos.x, e.pos.z - heroPos.z) < (pathAct === 'rush' ? 2.1 : 1.5) + e.def.radius) {
              pathHit.add(e); skill = 'bash'; const from = heroPos.clone().sub(new THREE.Vector3(Math.sin(yw), 0, Math.cos(yw)).multiplyScalar(1.5)); hitEnemy(e, pathAct === 'jet' ? 1.4 : pathAct === 'rush' ? 1.7 : 1.6, true, from); skill = null;
              if (pathAct === 'rush') { h.slash(); const tp = h.weaponTip(new THREE.Vector3()); for (let q = 0; q < 10; q++) d.particles.spawn(tp.x, tp.y, tp.z, { vx: rnd(-3, 3), vy: rnd(0, 3), vz: rnd(-3, 3), life: 0.3, s0: 0.45, s1: 0.05, c0: 0xffffff, c1: 0xcfe0ff, a: 1, drag: 2 }); d.audio.swing(); }
              if (pathAct === 'charge' && e.alive) { e.state = 'hurt'; e.t = -0.8; } d.audio.boom(); st.shake = Math.max(st.shake, 0.25);
              /* a corrida para no primeiro inimigo que encontra (não passa correndo por ele): a investida vira a escudada/martelada ali mesmo */
              if (!rushHalt && (pathAct === 'rush' || pathAct === 'charge')) { rushHalt = true; if (pathAct === 'rush') { h.act('bash', true); pending.push({ at: now + 0.14, fn: () => { if (!rushDone) rushFinish(h); } }); } else { h.act('cleave2', true); } }
            }
          }
        } else if (pathAct) pathAct = null;
      }
      /* esfera, minas, mísseis, torres, feixes */
      { const h = d.getHero();
        const DR = h.kind === 'technocrat' ? h : kitKey === 'tecno' && sideDrone ? sideDrone : null;
        if (DR) {
          const dp = DR.dronePos(new THREE.Vector3());
          if (droneTask) {
            droneTask.t += dt; const ty = d.world.heightAt(droneTask.x, droneTask.z) + (droneTask.kind === 'rain' ? 4.5 : 1.2);
            DR.droneTo = new THREE.Vector3(droneTask.x, ty, droneTask.z);
            const near = Math.hypot(dp.x - droneTask.x, dp.z - droneTask.z) < 0.9 || droneTask.t > 2.2;
            if (droneTask.kind === 'bomb' && near) {
              const m = mkMine(droneTask.x, droneTask.z); mines.push({ m, x: droneTask.x, z: droneTask.z, t: 0, r: 2.8 + 0.3 * droneTask.fired, mul: 2.2 + 0.25 * droneTask.fired }); DR.droneFlash = 1; d.audio.swing(); droneTask = null;
            } else if (droneTask.kind === 'rain') {
              // razante: a esfera cruza a área como um caça, em linha, soltando canistros de napalm
              const RUN = 1.4, N = 12 + 2 * skillScale('bash').tier, k = Math.min(1, droneTask.t / RUN), sx = droneTask.sx!, sz = droneTask.sz!, ex = droneTask.ex!, ez = droneTask.ez!;
              const rx = sx + (ex - sx) * k, rz = sz + (ez - sz) * k; DR.droneTo = new THREE.Vector3(rx, d.world.heightAt(rx, rz) + 5.5, rz);
              if (Math.random() < dt * 40) d.particles.spawn(dp.x, dp.y, dp.z, { vx: rnd(-0.5, 0.5), vy: rnd(-0.3, 0.3), vz: rnd(-0.5, 0.5), life: 0.5, s0: 0.5, s1: 1.2, c0: 0xdddddd, c1: 0x555555, a: 0.4 }); // rastro
              const want = Math.floor(k * N);
              while (droneTask.fired < want) {
                droneTask.fired++; DR.droneFlash = 1; const kk = (droneTask.fired - 0.5) / N, lat = rnd(-2.2, 2.2), px = Math.cos(Math.atan2(ex - sx, ez - sz)), pz = -Math.sin(Math.atan2(ex - sx, ez - sz));
                const tx = sx + (ex - sx) * kk + px * lat, tz = sz + (ez - sz) * kk + pz * lat, dur = 0.42, gy = d.world.heightAt(tx, tz);
                const v = new THREE.Vector3((tx - dp.x) / dur, (gy - dp.y) / dur + 0.5 * 22 * dur, (tz - dp.z) / dur);
                missiles.push({ p: dp.clone(), v, tx, tz, t: 0, dur, napalm: true }); if (droneTask.fired % 3 === 1) d.audio.swing();
              }
              if (droneTask.t > RUN + 0.5) droneTask = null;
            }
          } else {
            // sem tarefa: busca o item mais próximo (até 12 m) e o traz; senão laser automático contra inimigos
            let best: (typeof drops)[number] | null = null, bd = 12;
            for (const dr of drops) { const dd = Math.hypot(dr.x - heroPos.x, dr.z - heroPos.z); if (dd < bd && dr.t > 0.4) { bd = dd; best = dr; } }
            if (best && bd > 2.2) { DR.droneTo = new THREE.Vector3(best.x, best.y + 1.0, best.z); const k = Math.min(1, dt * 4); best.x += (heroPos.x - best.x) * k; best.z += (heroPos.z - best.z) * k; best.m.position.x = best.x; best.m.position.z = best.z; }
            else DR.droneTo = null;
            droneLaserT -= dt;
            if (h.combat && droneLaserT <= 0 && !droneDefends()) { const e = enemies.nearest(heroPos, 10); if (e) { droneLaserT = 1.5; DR.droneFlash = 1; const tp = e.pos.clone().setY(e.pos.y + 1.0); beam(dp, tp, 0x8af0ff, 0.045); skill = 'combo'; hitEnemy(e, 0.45, false, dp); skill = null; if (e.alive && Math.random() < 0.2) { e.state = 'hurt'; e.t = -0.4; for (let i = 0; i < 8; i++) d.particles.spawn(tp.x + rnd(-0.3, 0.3), tp.y + rnd(-0.5, 0.5), tp.z + rnd(-0.3, 0.3), { life: 0.2, s0: 0.5, s1: 0.1, c0: 0xffffff, c1: 0x8af0ff, a: 1 }); } } }
          }
        } else if (droneTask) droneTask = null;
        for (let i = mines.length - 1; i >= 0; i--) {
          const mn = mines[i]; mn.t += dt; (mn.m.userData.lamp as THREE.Mesh).scale.setScalar(1 + 0.5 * Math.max(0, Math.sin(mn.t * 8)));
          let trig = mn.t > 10; if (mn.t > 0.5) for (const e of enemies.list) if (e.alive && e.active && Math.hypot(e.pos.x - mn.x, e.pos.z - mn.z) < 1.3 + e.def.radius) { trig = true; break; }
          if (trig) { d.scene.remove(mn.m); mines.splice(i, 1); if (mn.m.userData.shock) { for (const e of enemies.list) if (e.alive && e.active && Math.hypot(e.pos.x - mn.x, e.pos.z - mn.z) < mn.r + e.def.radius) { e.root2 = 2; e.state = 'hurt'; e.t = -2; skill = 'combo'; hitEnemy(e, mn.mul, false, new THREE.Vector3(mn.x, 0, mn.z)); skill = null; for (let k = 0; k < 20; k++) d.particles.spawn(e.pos.x + rnd(-0.4, 0.4), e.pos.y + rnd(0.2, 1.8), e.pos.z + rnd(-0.4, 0.4), { life: 0.3, s0: 0.5, s1: 0.1, c0: 0xffffff, c1: 0xc8e8ff, a: 1 }); } d.audio.boom(); } else explode(mn.x, mn.z, d.world.heightAt(mn.x, mn.z), mn.r, mn.mul, 0x4de3ff, 0.9, new THREE.Vector3(mn.x, 0, mn.z)); }
        }
        for (let i = missiles.length - 1; i >= 0; i--) {
          const ms = missiles[i]; ms.t += dt; ms.v.y -= 22 * dt; ms.p.addScaledVector(ms.v, dt);
          d.particles.spawn(ms.p.x, ms.p.y, ms.p.z, { life: 0.3, s0: 0.45, s1: 0.08, c0: 0xffffff, c1: 0xffa040, a: 0.9 });
          const gy = d.world.heightAt(ms.p.x, ms.p.z);
          if (ms.t >= ms.dur || ms.p.y <= gy + 0.1) { missiles.splice(i, 1); explode(ms.tx, ms.tz, gy, ms.napalm ? 2.0 : 1.5, ms.napalm ? 0.9 : 0.75, ms.napalm ? 0xff7a20 : 0xffb060, 0, ms.p.clone()); if (ms.napalm) napalmAt(ms.tx, ms.tz, gy); }
        }
        for (let i = turrets.length - 1; i >= 0; i--) { // torre lança-chamas: jato denso de 16 m que varre atrás do inimigo e incendeia o cone
          const tr = turrets[i]; tr.t += dt; tr.shotT -= dt;
          const tp = new THREE.Vector3(tr.x, 0, tr.z); const e = enemies.nearest(tp, 16);
          const yawT = e ? Math.atan2(e.pos.x - tr.x, e.pos.z - tr.z) : tr.head.rotation.y + dt * 0.8;
          let dy = yawT - tr.head.rotation.y; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2; tr.head.rotation.y += dy * Math.min(1, dt * 5);
          if (e) {
            const yw = tr.head.rotation.y, gy = d.world.heightAt(tr.x, tr.z), fx = tr.x + Math.sin(yw) * 0.5, fz = tr.z + Math.cos(yw) * 0.5, fy = gy + 1.05;
            const sx = Math.cos(yw), sz = -Math.sin(yw);
            for (let k = 0; k < 12; k++) { const sp = rnd(18, 27), lat = rnd(-1.6, 1.6); d.particles.spawn(fx, fy + rnd(-0.05, 0.05), fz, { vx: Math.sin(yw) * sp + sx * lat, vy: rnd(0.2, 2.4), vz: Math.cos(yw) * sp + sz * lat, life: rnd(0.55, 0.9), s0: 0.5, s1: rnd(2.0, 3.2), c0: k % 3 ? 0xffd060 : 0xffffff, c1: k % 2 ? 0xff3a10 : 0xff7a10, a: 0.95, drag: 1.3, g: -2.5 }); }
            for (let k = 0; k < 3; k++) { const sp = rnd(10, 20); d.particles.spawn(fx, fy, fz, { vx: Math.sin(yw) * sp + rnd(-2, 2), vy: rnd(1, 4), vz: Math.cos(yw) * sp + rnd(-2, 2), life: rnd(0.9, 1.6), s0: 0.25, s1: 0.05, c0: 0xffe8a0, c1: 0xff5a10, a: 1, drag: 1, g: 4 }); }
            if (Math.random() < dt * 12) { const sp = rnd(6, 10); d.particles.spawn(fx + Math.sin(yw) * 3, fy + 0.5, fz + Math.cos(yw) * 3, { vx: Math.sin(yw) * sp, vy: rnd(1.5, 3), vz: Math.cos(yw) * sp, life: 1.8, s0: 1.4, s1: 3, c0: 0x5a5a5a, c1: 0x1a1a1a, a: 0.35, drag: 0.8 }); }
            if (Math.random() < dt * 24) { const r = rnd(2, 15); d.particles.spawn(fx + Math.sin(yw) * r + rnd(-1, 1), gy + 0.15, fz + Math.cos(yw) * r + rnd(-1, 1), { vy: rnd(0.8, 2.4), life: rnd(0.6, 1.2), s0: 0.6, s1: 1.6, c0: 0xffb040, c1: 0xff3a10, a: 0.8, g: -1 }); }
            if (tr.shotT <= 0) { tr.shotT = 0.14; for (const o of enemies.list) { if (!o.alive || !o.active) continue; const tx2 = o.pos.x - tr.x, tz2 = o.pos.z - tr.z, dd = Math.hypot(tx2, tz2); if (dd > 16 + o.def.radius) continue; let ea = Math.atan2(tx2, tz2) - yw; while (ea > Math.PI) ea -= Math.PI * 2; while (ea < -Math.PI) ea += Math.PI * 2; if (Math.abs(ea) < 0.26 + 0.6 / Math.max(1, dd)) { skill = 'combo'; hitEnemy(o, 0.32, false, tp); skill = null; if (o.alive) { o.burn = 5; o.burnTick = o.burnTick ?? 0; } } } }
            fireLight.position.set(fx + Math.sin(yw) * 4, 1.3, fz + Math.cos(yw) * 4); fireLight.color.setHex(0xff8a30); fireK = Math.max(fireK, 0.9);
          }
          { const ring = tr.m.children[tr.m.children.length - 1] as THREE.Mesh; const rm = ring.material as THREE.MeshBasicMaterial; rm.opacity = 0.1 + (e ? 0.12 : 0); rm.color.setHex(0xff7a30); }
          if (tr.t > 15) { d.scene.remove(tr.m); turrets.splice(i, 1); for (let k = 0; k < 12; k++) d.particles.spawn(tr.x, 0.6, tr.z, { vx: rnd(-1, 1), vy: rnd(0.5, 2), vz: rnd(-1, 1), life: 0.6, s0: 0.3, s1: 0.05, c0: 0xaaaaaa, c1: 0x444444, a: 0.7 }); }
        }
        for (let i = beams.length - 1; i >= 0; i--) { const b = beams[i]; b.t += dt; const k = 1 - b.t / b.life; (b.m.material as THREE.MeshBasicMaterial).opacity = Math.max(0, k); b.m.scale.x = b.m.scale.z = Math.max(0.1, k); if (b.t >= b.life) { d.scene.remove(b.m); b.m.geometry.dispose(); beams.splice(i, 1); } }
      }
      enemies.update(dt, now);
      for (let i = drops.length - 1; i >= 0; i--) {
        const dr = drops[i]; dr.t += dt; dr.m.position.y = dr.y + 0.5 + Math.sin(dr.t * 4) * 0.08; dr.m.rotation.y += dt * 3;
        if (dr.t > 0.4 && Math.hypot(dr.x - heroPos.x, dr.z - heroPos.z) < 1.9) {
          if (dr.kind === 'item' || dr.kind === 'gear') { const ok = dr.kind === 'item' ? onItem(dr.id!, dr.n) : onGear(dr.gear!); if (ok === false) { if (now > fullMsgT) { fullMsgT = now + 2; logMsg('🎒 Mochila cheia!', '#ff9a8a'); dmgText(heroPos.clone().setY(2.6), 'Mochila cheia', true, '#ff8a7a'); } continue; } }
          if (dr.kind === 'item') { /* já guardado */ } else if (dr.kind === 'gear') { dmgText(heroPos.clone().setY(2.6), dr.gear!.name, dr.gear!.rarity !== 'normal', RARITY[dr.gear!.rarity].col); } else if (dr.kind === 'gold') { const gn = Math.round(dr.n * st.goldMul); st.gold += gn; logMsg(`+${gn} 🪙 ouro`, '#ffd24a'); dmgText(heroPos.clone().setY(2.4), `+${gn} 🪙`, false, '#ffd24a'); } else { logMsg(`+${dr.n} vida`, '#7aff9a'); st.hp = Math.min(st.hpMax, st.hp + dr.n); dmgText(heroPos.clone().setY(2.4), `+${dr.n} vida`, false, '#7aff9a'); }
          if (dr.kind === 'gold') d.audio.coins(2); else d.audio.pickup(); d.scene.remove(dr.m); dr.label?.remove(); drops.splice(i, 1);
        } else if (dr.t > 120) { d.scene.remove(dr.m); dr.label?.remove(); drops.splice(i, 1); }
        else if (dr.label) { const v = tmp.set(dr.x, dr.y + 1.5, dr.z).project(d.camera as THREE.Camera), rc = d.canvas.getBoundingClientRect(), near = Math.hypot(dr.x - heroPos.x, dr.z - heroPos.z) < 22 && v.z < 1; dr.label.style.display = near ? 'block' : 'none'; if (near) { dr.label.style.left = rc.left + (v.x * 0.5 + 0.5) * rc.width + 'px'; dr.label.style.top = rc.top + (-v.y * 0.5 + 0.5) * rc.height + 'px'; } if (dr.gear!.rarity !== 'normal' && Math.random() < dt * 8) d.particles.spawn(dr.x + rnd(-0.3, 0.3), dr.y + 0.3, dr.z + rnd(-0.3, 0.3), { vy: rnd(1, 2.5), life: 0.9, s0: 0.5, s1: 0.05, c0: 0xffffff, c1: parseInt(RARITY[dr.gear!.rarity].col.slice(1), 16), a: 0.9 }); }
      }
      updateBars();
      for (let i = lvFx.length - 1; i >= 0; i--) { const f = lvFx[i]; f.t += dt; f.f(Math.min(1, f.t / f.dur)); if (f.t >= f.dur) { f.end(); lvFx.splice(i, 1); } }
      document.querySelector('#btns button[data-b="inv"]')?.classList.toggle('pulse', st.points > 0);
      { const cl = document.getElementById('clv'); if (cl) { cl.textContent = `${cls.name} ${cls.lvl}`; ($('cxb').children[0] as HTMLElement).style.width = (cls.xp / clsNeed(cls.lvl)) * 100 + '%'; } }
      $('lv').textContent = `Nv ${st.lvl}`; $('gold').textContent = `🪙 ${st.gold}`; ($('xpb').children[0] as HTMLElement).style.width = (st.xp / xpNeed()) * 100 + '%';
      // boneco balança e assenta
      wob *= Math.exp(-dt * 3.2);
      pivot.rotation.set(wobDir.z * wob * Math.sin(now * 22) * 0.35, 0, -wobDir.x * wob * Math.sin(now * 22) * 0.35);
      // rastro: só registra quando a ponta da lâmina está rápida
      {
        const h = d.getHero(); h.weaponTip(tipNow); h.weaponBase(baseNow);
        const spd = dt > 0 ? tipNow.distanceTo(lastTip) / dt : 0; lastTip.copy(tipNow);
        if (spd > 6.5 && dt > 0 && h.acting && h.actName !== 'dash') samples.unshift({ a: baseNow.clone(), b: tipNow.clone(), t: 0 });
        for (const s of samples) s.t += dt;
        while (samples.length && (samples[samples.length - 1].t > TR_LIFE || samples.length > TR_N)) samples.pop();
        for (let i = 0; i < TR_N; i++) {
          const s = samples[Math.min(i, samples.length - 1)];
          const k = s ? Math.pow(Math.max(0, 1 - s.t / TR_LIFE), 1.6) * (i < samples.length ? 1 : 0) : 0;
          if (s) { trPos.set([s.a.x, s.a.y, s.a.z, s.b.x, s.b.y, s.b.z], i * 6); }
          trCol.set([0.35 * k, 0.4 * k, 0.5 * k, 0.9 * k, 0.95 * k, 1.0 * k], i * 6);
        }
        trGeo.attributes.position.needsUpdate = true; trGeo.attributes.color.needsUpdate = true;
        for (let i = flashes.length - 1; i >= 0; i--) { const f = flashes[i]; f.t += dt; const u = f.t / f.dur; f.s.scale.setScalar(f.sc * (0.3 + u * 0.9)); (f.s.material as THREE.SpriteMaterial).opacity = Math.max(0, 1 - u); if (u >= 1) { d.scene.remove(f.s); (f.s.material as THREE.Material).dispose(); flashes.splice(i, 1); } }
        for (let i = rings.length - 1; i >= 0; i--) { const r = rings[i]; r.t += dt; const u = r.t / 0.32; r.m.scale.setScalar(0.4 + u * 2.4); (r.m.material as THREE.MeshBasicMaterial).opacity = 0.7 * Math.max(0, 1 - u); if (u >= 1) { d.scene.remove(r.m); (r.m.material as THREE.Material).dispose(); rings.splice(i, 1); } }
        impactK *= Math.exp(-dt * 18); impactLight.intensity = 70 * impactK;
        
      }
      // fenda de fogo no chão
      if (teleT >= 0) {
        teleT += dt; const hh = d.getHero(), yw = hh.root.rotation.y;
        teleG.visible = true; if (slamAt) teleG.position.set(slamAt.x, 0.09, slamAt.z); else teleG.position.set(hh.root.position.x + Math.sin(yw) * 0.9, 0.09, hh.root.position.z + Math.cos(yw) * 0.9);
        const k = Math.min(1, teleT / 0.76), pul = 0.5 + 0.5 * Math.sin(teleT * 22);
        teleRing.scale.setScalar(1.25 - 0.25 * k); teleIn.scale.setScalar(0.4 + 3.2 * k);
        (teleDisc.material as THREE.MeshBasicMaterial).opacity = 0.1 + 0.25 * k + 0.1 * pul;
        (teleIn.material as THREE.MeshBasicMaterial).opacity = 0.9 * (1 - k * 0.5);
        if (teleT > 1.2) { teleT = -1; teleG.visible = false; }
      }
      crackT += dt; const cm = crack.material as THREE.MeshBasicMaterial;
      cm.opacity = crackT < 0.08 ? crackT / 0.08 : Math.max(0, 1 - (crackT - 1.6) / 2.2);
      const sc = Math.min(1, 0.3 + crackT * 5); crack.scale.set(sc, sc, 1);
      fireK *= Math.exp(-dt * 1.6); fireLight.intensity = 38 * fireK; if (fires[0] && !turrets.length) fireLight.position.set(fires[0].x, 1.2, fires[0].z);
      for (let i = spikes.length - 1; i >= 0; i--) { const sp = spikes[i]; sp.t += dt; const k = sp.t < 0 ? 0 : sp.t < 0.1 ? sp.t / 0.1 * 1.15 : sp.t < 0.25 ? 1.15 - (sp.t - 0.1) : 1; const sink = sp.t > 4.5 ? Math.min(1, (sp.t - 4.5) / 0.8) : 0; sp.m.position.y = (sp.m.userData.gy ?? (sp.m.userData.gy = sp.m.position.y + sp.h * 0.5)) - sp.h * 0.5 + sp.h * (k - sink) * 0.98; if (sp.t > 5.3) { d.scene.remove(sp.m); sp.m.geometry.dispose(); spikes.splice(i, 1); } }
      for (let i = lavas.length - 1; i >= 0; i--) { const lv = lavas[i]; lv.t += dt; const LD = 8 * skillScale('slam').dur; const k = lv.t > LD ? Math.max(0, 1 - (lv.t - LD) / 1.5) : 1; (lv.m.material as THREE.MeshBasicMaterial).opacity = 0.85 * k; (lv.gl.material as THREE.MeshBasicMaterial).opacity = (0.3 + 0.12 * Math.sin(now * 7)) * k;
        if (Math.random() < dt * 14 * k) { const a = rnd(0, 6.283), rr = rnd(0, lv.r); d.particles.spawn(lv.x + Math.cos(a) * rr, lv.m.position.y + 0.05, lv.z + Math.sin(a) * rr, { vy: rnd(1, 3), life: rnd(0.4, 0.9), s0: 0.35, s1: 0.05, c0: 0xffe080, c1: 0xff3a00, a: 1, g: 5 }); }
        if (k > 0) for (const e of enemies.list) if (e.alive && e.active && Math.hypot(e.pos.x - lv.x, e.pos.z - lv.z) < lv.r + e.def.radius * 0.5) { e.burn = Math.max(e.burn ?? 0, 2); e.burnTick = e.burnTick ?? 0; }
        // lava borbulhando: bolhas que estouram, respingos que caem queimando, fumaça de enxofre e calor
        if (Math.random() < dt * 18 * k) { const a = rnd(0, 6.283), rr = rnd(0, lv.r); const bx = lv.x + Math.cos(a) * rr, bz = lv.z + Math.sin(a) * rr; d.particles.spawn(bx, lv.m.position.y + 0.1, bz, { vy: 0.2, life: 0.35, s0: 0.3, s1: 0.9, c0: 0xffe080, c1: 0xff5a10, a: 0.9 }); for (let q = 0; q < 4; q++) d.particles.spawn(bx, lv.m.position.y + 0.15, bz, { vx: rnd(-2, 2), vy: rnd(3, 7), vz: rnd(-2, 2), life: rnd(0.5, 1), s0: 0.2, s1: 0.05, c0: 0xffe080, c1: 0xc02000, a: 1, g: 9 }); }
        if (Math.random() < dt * 7 * k) d.particles.spawn(lv.x + rnd(-lv.r, lv.r) * 0.7, lv.m.position.y + 0.3, lv.z + rnd(-lv.r, lv.r) * 0.7, { vx: rnd(-0.3, 0.3), vy: rnd(0.8, 1.6), vz: rnd(-0.3, 0.3), life: rnd(2, 3.2), s0: 0.9, s1: 2.8, c0: 0xc8c070, c1: 0x5a5a30, a: 0.3, drag: 0.5 });
        if (Math.random() < dt * 10 * k) d.particles.spawn(lv.x + rnd(-lv.r, lv.r) * 0.8, lv.m.position.y + 0.2, lv.z + rnd(-lv.r, lv.r) * 0.8, { vy: rnd(1.5, 3), life: rnd(0.4, 0.8), s0: 0.5, s1: 1.4, c0: 0xffb040, c1: 0xff3a10, a: 0.7, g: -1 });
        if (lv.t > LD + 1.5) { d.scene.remove(lv.m); d.scene.remove(lv.gl); lavas.splice(i, 1); } }
      for (let i = frosts.length - 1; i >= 0; i--) { const f = frosts[i]; f.t += dt; const k = f.t > 4 ? Math.max(0, 1 - (f.t - 4) / 1.2) : 1; (f.m.material as THREE.MeshBasicMaterial).opacity = 0.32 * k; if (Math.random() < dt * 8 * k) d.particles.spawn(f.x + rnd(-f.r, f.r), 0.2, f.z + rnd(-f.r, f.r), { vy: rnd(0.2, 0.6), life: 1.2, s0: 0.15, s1: 0.05, c0: 0xffffff, c1: 0xbfe8ff, a: 0.8 }); if (k > 0) for (const e of enemies.list) if (e.alive && e.active && Math.hypot(e.pos.x - f.x, e.pos.z - f.z) < f.r) e.slow = Math.max(e.slow ?? 0, 0.5); if (f.t > 5.3) { d.scene.remove(f.m); f.m.geometry.dispose(); frosts.splice(i, 1); } }
      for (let i = napalms.length - 1; i >= 0; i--) {
        const n = napalms[i]; n.t += dt; const k = n.t > n.dur - 1.5 ? Math.max(0, (n.dur - n.t) / 1.5) : 1; (n.m.material as THREE.MeshBasicMaterial).opacity = (0.22 + 0.1 * Math.sin(now * 9 + n.x)) * k;
        if (n.t > n.dur) { d.scene.remove(n.m); n.m.geometry.dispose(); napalms.splice(i, 1); continue; }
        // labaredas e crepitar: línguas de fogo subindo, fagulhas e fumaça preta
        for (let q = 0; q < 2; q++) if (Math.random() < 0.8 * k) { const a = rnd(0, 6.283), r = rnd(0, n.r); d.particles.spawn(n.x + Math.cos(a) * r, 0.1, n.z + Math.sin(a) * r, { vx: rnd(-0.3, 0.3), vy: rnd(1.5, 3.5), vz: rnd(-0.3, 0.3), life: rnd(0.5, 1), s0: 0.6, s1: rnd(0.1, 1.4), c0: q ? 0xffd060 : 0xffffff, c1: 0xc02000, a: 0.85, drag: 0.6 }); }
        if (Math.random() < dt * 10 * k) { const a = rnd(0, 6.283), r = rnd(0, n.r); d.particles.spawn(n.x + Math.cos(a) * r, 0.3, n.z + Math.sin(a) * r, { vx: rnd(-1, 1), vy: rnd(3, 6), vz: rnd(-1, 1), life: rnd(0.8, 1.6), s0: 0.16, s1: 0.03, c0: 0xffe9a0, c1: 0xff3a00, a: 1, g: 3, drag: 0.2 }); }
        if (Math.random() < dt * 6 * k) d.particles.spawn(n.x + rnd(-n.r, n.r), 1.2, n.z + rnd(-n.r, n.r), { vy: rnd(1, 2), life: 2, s0: 1, s1: 2.6, c0: 0x3a3a3a, c1: 0x101010, a: 0.35, drag: 0.6 });
        for (const e of enemies.list) if (e.alive && e.active && Math.hypot(e.pos.x - n.x, e.pos.z - n.z) < n.r + e.def.radius * 0.5) { e.burn = Math.max(e.burn ?? 0, 3); e.burnTick = e.burnTick ?? 0; }
      }
      for (let i = fires.length - 1; i >= 0; i--) {
        const f = fires[i]; f.t += dt; if (f.t > 2.4) { fires.splice(i, 1); continue; }
        const k = 1 - f.t / 2.4;
        for (let n = 0; n < 2; n++) { if (Math.random() > k + 0.15) continue; const a = rnd(0, 6.283), r = rnd(0.3, 2.6) * Math.min(1, 0.4 + f.t * 3); d.particles.spawn(f.x + Math.cos(a) * r, 0.08, f.z + Math.sin(a) * r, { vx: rnd(-0.2, 0.2), vy: rnd(1.2, 2.8), vz: rnd(-0.2, 0.2), life: rnd(0.5, 0.9), s0: 0.45, s1: 0.06, c0: 0xffc060, c1: 0xa01800, a: 0.75 * k + 0.1, drag: 0.8 }); }
      }
      // tremor de tela
      st.shake *= Math.exp(-dt * 9);
      // HUD
      st.hpLag += (st.hp - st.hpLag) * Math.min(1, dt * 1.5); st.mpLag += (st.mp - st.mpLag) * Math.min(1, dt * 1.5);
      const hp = $('hp'), mp = $('mp');
      hp.style.setProperty('--f', String(st.hp / st.hpMax)); hp.style.setProperty('--l', String(st.hpLag / st.hpMax)); mp.style.setProperty('--f', String(st.mp / st.mpMax)); mp.style.setProperty('--l', String(st.mpLag / st.mpMax));
      { const a = `${Math.round(st.hp)}`, b = `${Math.round(st.mp)}`, ha = hp.querySelector('b')!, hb = mp.querySelector('b')!; if (ha.textContent !== a) ha.textContent = a; if (hb.textContent !== b) hb.textContent = b; } /* mexer no DOM só quando o número muda (perfil: layout a cada quadro) */ // o número de verdade (o canvas do globo é o 1º filho)
      const setCd = (k: string, v: number, tot: number) => { const e = document.querySelector(`.slot[data-id="${k}"] .cd`) as HTMLElement | null; if (e) e.style.transform = `scaleY(${v / tot})`; };
      setCd('combo', cd.attack, CD.attack); setCd('slam', Math.max(cd.cast, cd.slam), CD.slam); setCd('bash', st.counterT > 0 ? 0 : cd.bash, CD.bash); setCd('heal', cd.heal, CD.heal); for (const id of Object.keys(cdX)) setCd(id, cdX[id], CDX[id] ?? 10);
      const slot = (k: string) => document.querySelector(`.slot[data-id="${k}"]`) as HTMLElement | null;
      const setT = (k: string, v: number) => { const t = slot(k)?.querySelector('.cdt') as HTMLElement | null; if (t) t.textContent = v > 0.05 ? (v >= 10 ? String(Math.ceil(v)) : v.toFixed(1)) : ''; };
      setT('slam', Math.max(cd.cast, cd.slam)); setT('bash', st.counterT > 0 ? 0 : cd.bash); setT('heal', cd.heal); for (const id of Object.keys(cdX)) setT(id, cdX[id]);
      { const rd = (k: string, on: boolean) => { const el = slot(k); el?.classList.toggle('ready', on && !el.classList.contains('locked')); }; rd('slam', st.fury >= 3); rd('bash', st.counterT > 0); rd('heal', st.fury > 0 && cd.heal <= 0); rd('combo', st.ambushT > 0); }
      const fp = document.querySelectorAll('#fury i'); fp.forEach((p, i) => p.classList.toggle('on', i < st.fury));
      const ct = document.getElementById('ctr'); if (ct) { ct.style.opacity = st.counterT > 0 ? '1' : '0'; ct.style.width = (st.counterT / 3.5) * 100 + '%'; }
      void raceLabel; void karma; /* a página Conta do menu é preenchida pelo main */ { const ms = document.getElementById('m-snd'); if (ms) ms.textContent = muted ? 'mudo' : 'ligado'; }
      void heroPos;
    },
  };

  /* ---- menu ---- */
  document.querySelectorAll<HTMLButtonElement>('#menu nav button[data-p]').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('#menu nav button').forEach((x) => x.classList.toggle('on', x === b));
    document.querySelectorAll('#menu .page').forEach((p) => p.classList.toggle('on', p.id === b.dataset.p));
  }));
  $('menu').addEventListener('pointerdown', (e) => { if (e.target === $('menu')) api.toggleMenu(false); });
  return api;
}
