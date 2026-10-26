import { RUNAS } from './runas';
import * as THREE from 'three';
import { buildBeast, buildWolf, buildBoar, buildDeer } from './werewolf3d';
import { buildUndead } from './undead3d';
import { charShadow, createCharacter, type Hero3D } from './characters';
import type { SpawnDef, EnemyType } from './world';
import { loadModel, Puppet } from './models3d';
import { mergeStatic } from './merge3d';
import { fine } from './dual3d';
import { rng } from './world';

export interface EnemyCtx { outMul?: () => number;
  scene: THREE.Scene;
  /** explosão visual da magia inimiga no chão */
  spellFx?(x: number, z: number, col: number, r: number): void;
  /** aviso de que um inimigo começou a conjurar */
  onSpell?(e: Enemy, name: string): void;
  /** nível do jogador: controla quantos bichos de cada grupo existem (poucos no começo; muitos depois do 60/80) */
  level?(): number;
  /** 0 dia → 1 noite: criaturas noturnas só existem com night ≥ 0.5 */
  night?(): number;
  heightAt(x: number, z: number): number;
  walkable(x: number, z: number): boolean;
  heroPos(): THREE.Vector3;
  heroAlive(): boolean;
  heroInvuln(): boolean;
  /** herói atravessa os bichos (investida, esquiva) */
  heroGhost?(): boolean;
  damageHero(n: number, from: THREE.Vector3): void;
  spawns: SpawnDef[];
  onTelegraph?(e: Enemy): void;
  /** rastro de fogo/brilho do projétil inimigo (partículas do jogo) */
  trail?(x: number, y: number, z: number, col: number): void;
  /** jogar junto: o que este cliente avisa aos outros (bicho do mundo apanhou, morreu, conjurou) */
  sync?: { myId(): number; hit(key: string, n: number): void; die(key: string): void; cast(key: string, x: number, z: number, i: number): void };
}

interface Def {
  name: string; lvl: number; hp: number; dmg: number; speed: number; aggro: number; range: number; windup: number; cd: number; xp: number; gold: [number, number];
  model?: string; scale: number; quad?: 'wolf' | 'boar' | 'deer' | 'rat' | 'coyote'; rig?: 'fairy' | 'treant' | 'prince' | 'zombie' | 'bishop' | 'human' | 'beast'; /** gente: o mesmo boneco dos NPCs, armado */ human?: HumanLook; fly?: number; passive?: boolean; radius: number; tint?: number;
}
/** o adversário de um bicho num evento (outro bicho, ou gente do evento) */
export interface Foe { pos: THREE.Vector3; alive(): boolean; hit(n: number): void }
export interface HumanLook { kind: 'nordic' | 'technocrat' | 'dwarf'; civil?: 'human' | 'elf'; tint: number; weapon?: string; shield?: string; helm?: string }
/** gente que luta: o boneco dos NPCs (characters.ts) com arma e escudo; anima o golpe quando o inimigo dá o bote */
function buildHuman(h: HumanLook): Rig {
  const hero: Hero3D = createCharacter(h.kind, { static: true, civil: h.civil, cloth: h.civil ? h.tint : undefined });
  const tint = new THREE.Color(h.tint);
  hero.root.traverse((o) => { const m = o as THREE.Mesh; if (!m.isMesh) return; m.castShadow = false; const mats = Array.isArray(m.material) ? m.material : [m.material];
    const out = mats.map((mt) => { const t = mt as THREE.MeshToonMaterial; if (!t.color || t.side === THREE.BackSide || (t as unknown as THREE.MeshBasicMaterial).isMeshBasicMaterial) return mt; const c = t.clone(); c.color.lerp(tint, 0.42); return c; });
    m.material = out.length === 1 ? out[0] : out; });
  try { hero.setGear({ weapon: h.weapon ? { base: h.weapon, rarity: 'common' } : null, shield: h.shield ? { base: h.shield, rarity: 'common', seed: 7 } : null, helm: h.helm ? { base: h.helm, rarity: 'common' } : null }); } catch { /* */ }
  let swung = false, t0 = 0;
  return { root: hero.root, mats: [], update(e, dt, windK, strikeK, hurtK, mv) {
    t0 += dt; hero.combat = e.state === 'chase' || e.state === 'windup' || e.state === 'recover';
    if (windK > 0.35 && !swung) { swung = true; hero.act(Math.random() < 0.5 ? 'combo1' : 'combo2', true); }
    if (windK === 0 && strikeK === 0) swung = false;
    void hurtK; hero.update(dt, t0, mv, null); hero.root.rotation.set(0, 0, 0); } };
}
export const HPK = 5.2; // vida alta: ninguém derruba um javali com dois golpes — brigas longas, menos bichos
export const DEFS: Record<EnemyType, Def> = {
  puglin: { name: 'Puglin', lvl: 1, hp: 42, dmg: 7, speed: 2.7, aggro: 12, range: 1.7, windup: 0.6, cd: 1.5, xp: 12, gold: [1, 4], model: 'Puglin', scale: 1.3, radius: 0.6 },
  imp: { name: 'Diabrete', lvl: 4, hp: 105, dmg: 14, speed: 3.2, aggro: 15, range: 2.1, windup: 0.55, cd: 1.3, xp: 38, gold: [4, 11], model: 'Imp', scale: 1.0, radius: 0.7 },
  wolf: { name: 'Lobo', lvl: 2, hp: 58, dmg: 9, speed: 4.9, aggro: 17, range: 1.7, windup: 0.4, cd: 1.1, xp: 20, gold: [1, 5], quad: 'wolf', scale: 1, radius: 0.7 },
  frostwolf: { name: 'Lobo Gélido', lvl: 3, hp: 80, dmg: 11, speed: 5.1, aggro: 17, range: 1.7, windup: 0.4, cd: 1.05, xp: 28, gold: [2, 7], quad: 'wolf', scale: 1.1, radius: 0.75, tint: 0xcfe0f2 },
  boar: { name: 'Javali', lvl: 2, hp: 75, dmg: 10, speed: 3.4, aggro: 11, range: 1.6, windup: 0.5, cd: 1.5, xp: 22, gold: [1, 6], quad: 'boar', scale: 1, radius: 0.7 },
  coyote: { name: 'Coiote', lvl: 1, hp: 34, dmg: 6, speed: 5.0, aggro: 14, range: 1.5, windup: 0.35, cd: 0.9, xp: 10, gold: [0, 3], quad: 'coyote', scale: 0.8, radius: 0.55, tint: 0xc9a266 },
  rat: { name: 'Ratazana Rubra', lvl: 1, hp: 16, dmg: 4, speed: 4.2, aggro: 10, range: 1.1, windup: 0.3, cd: 0.8, xp: 6, gold: [0, 2], quad: 'rat', scale: 1.0, radius: 0.4 },
  fairy: { name: 'Fada Maliciosa', lvl: 2, hp: 20, dmg: 5, speed: 4.8, aggro: 11, range: 1.4, windup: 0.3, cd: 0.9, xp: 15, gold: [1, 6], rig: 'fairy', fly: 1.5, scale: 1.0, radius: 0.5 },
  treant: { name: 'Guardião da Mata', lvl: 5, hp: 190, dmg: 18, speed: 2.1, aggro: 11, range: 2.6, windup: 0.85, cd: 1.8, xp: 70, gold: [8, 20], rig: 'treant', scale: 1.0, radius: 1.0 },
  zombie: { name: 'Zumbi da Catedral', lvl: 10, hp: 190, dmg: 16, speed: 1.9, aggro: 16, range: 1.9, windup: 0.9, cd: 1.9, xp: 70, gold: [3, 10], rig: 'zombie', scale: 1.0, radius: 0.6 },
  ghoul: { name: 'Carniçal', lvl: 14, hp: 260, dmg: 22, speed: 3.6, aggro: 18, range: 1.8, windup: 0.5, cd: 1.2, xp: 110, gold: [6, 14], rig: 'zombie', scale: 0.9, radius: 0.6, tint: 0x6a8a5a },
  bishop: { name: 'Bispo Caído', lvl: 28, hp: 2600, dmg: 44, speed: 2.4, aggro: 34, range: 3.6, windup: 1.1, cd: 2.4, xp: 4200, gold: [400, 800], rig: 'bishop', fly: 0.12, scale: 1.55, radius: 1.5 },
  tormentor: { name: 'Torturador de Bestas', lvl: 7, hp: 680, dmg: 24, speed: 3.0, aggro: 18, range: 3.2, windup: 0.95, cd: 2.0, xp: 520, gold: [80, 160], rig: 'prince', fly: 0.25, scale: 1.15, radius: 1.2, tint: 0xff3a1a },
  prince: { name: 'Príncipe das Cinzas', lvl: 8, hp: 520, dmg: 30, speed: 2.7, aggro: 20, range: 3.6, windup: 1.05, cd: 2.2, xp: 450, gold: [60, 120], rig: 'prince', fly: 0.35, scale: 1.0, radius: 1.2 },
  skeleton: { name: 'Esqueleto do Campo Santo', lvl: 12, hp: 150, dmg: 18, speed: 2.6, aggro: 15, range: 1.9, windup: 0.7, cd: 1.6, xp: 80, gold: [3, 9], rig: 'zombie', scale: 0.95, radius: 0.55, tint: 0xe8e0c8 },
  bat: { name: 'Morcego da Noite', lvl: 9, hp: 45, dmg: 10, speed: 5.4, aggro: 14, range: 1.4, windup: 0.35, cd: 1.0, xp: 30, gold: [0, 3], rig: 'fairy', fly: 1.9, scale: 0.7, radius: 0.45, tint: 0x1a1418 },
  werewolf: { name: 'Lobisomem', lvl: 16, hp: 420, dmg: 30, speed: 5.0, aggro: 19, range: 2.1, windup: 0.6, cd: 1.4, xp: 180, gold: [10, 26], rig: 'beast', scale: 1.12, radius: 1.0 },
  /* gente dos eventos vivos: boneco articulado dos NPCs, com arma, escudo e cor da facção */
  soldier: { name: 'Soldado da Patrulha', lvl: 20, hp: 300, dmg: 22, speed: 3.3, aggro: 16, range: 2.0, windup: 0.55, cd: 1.3, xp: 120, gold: [6, 16], rig: 'human', scale: 1, radius: 0.55, human: { kind: 'nordic', tint: 0x5a6a8a, weapon: 'Espada Longa', shield: 'Escudo Nórdico', helm: 'Elmo Nórdico' } },
  cultist: { name: 'Bruxo do Círculo', lvl: 20, hp: 240, dmg: 24, speed: 3.0, aggro: 16, range: 2.0, windup: 0.6, cd: 1.4, xp: 120, gold: [8, 18], rig: 'human', scale: 1, radius: 0.5, human: { kind: 'nordic', civil: 'human', tint: 0x3a1450, weapon: 'Cajado Retorcido' } },
  darkpal: { name: 'Paladino Negro', lvl: 24, hp: 420, dmg: 28, speed: 3.0, aggro: 17, range: 2.1, windup: 0.65, cd: 1.5, xp: 190, gold: [12, 26], rig: 'human', scale: 1.05, radius: 0.6, human: { kind: 'nordic', tint: 0x16121a, weapon: 'Martelo', shield: 'Escudo de Pipa', helm: 'Elmo Alado' } },
  templar: { name: 'Templário de Auréon', lvl: 22, hp: 380, dmg: 24, speed: 3.1, aggro: 16, range: 2.0, windup: 0.6, cd: 1.4, xp: 160, gold: [10, 22], rig: 'human', scale: 1.02, radius: 0.58, human: { kind: 'nordic', tint: 0xe8dcb0, weapon: 'Espada Longa', shield: 'Escudo de Pipa', helm: 'Elmo Alado' } },
  hunter: { name: 'Caçador Maldito', lvl: 16, hp: 230, dmg: 20, speed: 3.6, aggro: 17, range: 1.9, windup: 0.5, cd: 1.2, xp: 95, gold: [6, 14], rig: 'human', scale: 1, radius: 0.5, human: { kind: 'nordic', civil: 'human', tint: 0x4a3a24, weapon: 'Machado de Mão' } },
  vampire: { name: 'Cria do Conde', lvl: 22, hp: 300, dmg: 26, speed: 4.2, aggro: 18, range: 1.8, windup: 0.42, cd: 1.0, xp: 150, gold: [10, 22], rig: 'human', scale: 1, radius: 0.5, human: { kind: 'nordic', civil: 'human', tint: 0x5a0e1e, weapon: 'Adaga' } },
  pilgrim: { name: 'Peregrina Élfica', lvl: 18, hp: 220, dmg: 18, speed: 3.4, aggro: 16, range: 1.9, windup: 0.5, cd: 1.2, xp: 100, gold: [6, 14], rig: 'human', scale: 0.98, radius: 0.5, human: { kind: 'nordic', civil: 'elf', tint: 0x4a7a5a, weapon: 'Espada Curta' } },
  deer: { name: 'Cervo', lvl: 1, hp: 22, dmg: 0, speed: 5.2, aggro: 9, range: 0, windup: 0, cd: 0, xp: 6, gold: [0, 2], quad: 'deer', scale: 1, passive: true, radius: 0.6 },
};
/* os bichos que são monstros ficam maiores (Erling, 26/10: "como monstros deveriam ser maiores… apenas aumentar em proporção"):
   o mesmo modelo, só em escala — e o corpo (raio de colisão e de acerto) acompanha */
for (const [k, m] of [['wolf', 1.35], ['frostwolf', 1.35], ['coyote', 1.35], ['boar', 1.35], ['rat', 1.3]] as const) { DEFS[k].scale *= m; DEFS[k].radius *= m; }
/* REGRA DO COMBATE — inimigos telegrafam: preparo do golpe 50% mais longo e intervalo 40% maior (dá tempo de ler,
   bloquear, aparar e esquivar); andam 10% mais devagar. Mesmo andamento lento do herói (TEMPO em characters/gameplay). */
for (const d of Object.values(DEFS)) { d.windup *= 1.75; d.cd *= 1.6; d.speed *= 0.85; d.dmg = Math.round(d.dmg * 1.7); }

export type EState = 'idle' | 'chase' | 'windup' | 'recover' | 'hurt' | 'return' | 'flee' | 'dead';
export interface Rig { root: THREE.Group; update(e: Enemy, dt: number, windK: number, strikeK: number, hurtK: number, mv: number): void; mats: THREE.MeshToonMaterial[] }
export interface Enemy {
  id: number; type: EnemyType; def: Def; home: THREE.Vector2; pos: THREE.Vector3; yaw: number;
  hp: number; hpMax: number; state: EState; t: number; alive: boolean; active: boolean; vel: THREE.Vector2;
  root: THREE.Group | null; pup: Puppet | null; quad: Quad | null; rig: Rig | null; wanderTo: THREE.Vector2 | null; wanderT: number; slot?: number; groupN?: number; sprint?: number; burn?: number; burnTick?: number; /** a queima é veneno (verde) */ psn?: boolean; slow?: number; mark?: number; root2?: number; phase: number; respawn: number; hurtT: number; spellCd?: number; tele: THREE.Mesh | null; flash: number; mats: THREE.MeshToonMaterial[];
}

/** bicho do mundo compartilhado em rede: `own` = quem está lutando com ele (o cliente dele manda a posição), `np` = último estado recebido */
type NetE = Enemy & { net?: string; own?: number; ownT?: number; np?: { x: number; z: number; f: number; s: EState; t: number } };
const NET_ST: EState[] = ['idle', 'chase', 'windup', 'recover', 'hurt', 'flee', 'return', 'dead'];
const ramp = new THREE.DataTexture(new Uint8Array([70, 70, 70, 255, 140, 140, 140, 255, 210, 210, 210, 255, 255, 255, 255, 255]), 4, 1, THREE.RGBAFormat);
ramp.minFilter = ramp.magFilter = THREE.NearestFilter; ramp.needsUpdate = true;
const inkMat = new THREE.MeshBasicMaterial({ color: 0x07060c, side: THREE.BackSide });
function tm(c: number) { return new THREE.MeshToonMaterial({ color: c, gradientMap: ramp }); }
function inked(geo: THREE.BufferGeometry, mat: THREE.Material, w = 0.03) {
  const m = new THREE.Mesh(geo, mat); m.castShadow = true;
  geo.computeBoundingSphere(); const r = geo.boundingSphere!.radius || 1;
  void inkMat; void r; void w; return m;
}

/* ---- quadrúpedes procedurais (lobo, javali, cervo, rato) — pernas articuladas, pescoço, mandíbula, trote/galope e bote ---- */
interface Quad { root: THREE.Group; legs: THREE.Group[]; knees: THREE.Group[]; head: THREE.Group; neck: THREE.Group; jaw: THREE.Group; body: THREE.Group; tail: THREE.Group[]; ears: THREE.Group[]; mats: THREE.MeshToonMaterial[]; P: { leg: number; h: number; len: number } }
export function buildQuad(kind0: 'wolf' | 'boar' | 'deer' | 'rat' | 'coyote' | 'horse' | 'fox', tint?: number): Quad {
  const kind = kind0 === 'coyote' || kind0 === 'fox' ? 'wolf' : kind0 === 'horse' ? 'horse' : kind0;
  const PT: Record<string, { len: number; h: number; w: number; leg: number; col: number; belly: number; dark: number; head: number; snout: number; neck: number; tail: number; ear: number }> = {
    rat: { len: 0.6, h: 0.2, w: 0.19, leg: 0.11, col: 0x4a3a34, belly: 0x7a6258, dark: 0x2e2420, head: 0.1, snout: 0.16, neck: 0.05, tail: 0.7, ear: 0.6 },
    wolf: { len: 1.2, h: 0.42, w: 0.34, leg: 0.56, col: 0x5a5856, belly: 0x9a958c, dark: 0x3a3836, head: 0.19, snout: 0.27, neck: 0.32, tail: 0.55, ear: 1 },
    boar: { len: 1.15, h: 0.62, w: 0.52, leg: 0.36, col: 0x4a3a2c, belly: 0x6a5642, dark: 0x2e2218, head: 0.26, snout: 0.3, neck: 0.12, tail: 0.2, ear: 0.6 },
    deer: { len: 1.15, h: 0.46, w: 0.32, leg: 0.84, col: 0x9a6a3c, belly: 0xd8c8a8, dark: 0x6a4a2a, head: 0.16, snout: 0.25, neck: 0.6, tail: 0.16, ear: 1.1 },
    horse: { len: 1.75, h: 0.66, w: 0.5, leg: 1.05, col: 0x6a4a2e, belly: 0x8a6a4a, dark: 0x2e2018, head: 0.21, snout: 0.36, neck: 0.78, tail: 0.6, ear: 0.9 },
    fox: { len: 0.72, h: 0.26, w: 0.2, leg: 0.3, col: 0xd0702a, belly: 0xf0e0c8, dark: 0x3a2a24, head: 0.12, snout: 0.2, neck: 0.16, tail: 0.5, ear: 1.2 },
  };
  const P = PT[kind0 === 'rat' ? 'rat' : kind0 === 'fox' ? 'fox' : kind];
  const mats: THREE.MeshToonMaterial[] = [];
  const mat = (c: number) => { const m = tm(tint ? new THREE.Color(c).lerp(new THREE.Color(tint), 0.7).getHex() : c); mats.push(m); return m; };
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  body.position.y = P.leg + P.h * 0.4;
  // tronco: caixa torácica maior à frente, garupa menor atrás (silhueta de animal)
  const chest = inked(new THREE.SphereGeometry(1, 12, 9), mat(P.col)); chest.scale.set(P.w, P.h * 1.05, P.len * 0.3); chest.position.z = P.len * 0.18; body.add(chest);
  const rump = inked(new THREE.SphereGeometry(1, 12, 9), mat(P.col)); rump.scale.set(P.w * 0.9, P.h * 0.92, P.len * 0.3); rump.position.z = -P.len * 0.2; body.add(rump);
  const mid = inked(new THREE.CylinderGeometry(1, 1, P.len * 0.42, 12), mat(P.col)); mid.rotation.x = Math.PI / 2; mid.scale.set(P.w * 0.92, 1, P.h * 0.9); body.add(mid);
  const belly = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 7), mat(P.belly)); belly.scale.set(P.w * 0.8, P.h * 0.55, P.len * 0.4); belly.position.y = -P.h * 0.4; body.add(belly);
  if (kind === 'boar') { const hump = inked(new THREE.SphereGeometry(1, 10, 7), mat(P.dark)); hump.scale.set(P.w * 0.7, P.h * 0.55, P.len * 0.25); hump.position.set(0, P.h * 0.75, P.len * 0.12); body.add(hump); for (let i = 0; i < 6; i++) { const br = inked(new THREE.ConeGeometry(0.03, 0.14, 4), mat(P.dark)); br.position.set((i % 2 ? 0.05 : -0.05), P.h * 1.05, P.len * 0.3 - i * 0.09); br.rotation.x = -0.4; body.add(br); } }
  if (kind === 'wolf') { const ruff = inked(new THREE.SphereGeometry(1, 10, 7), mat(P.dark)); ruff.scale.set(P.w * 1.15, P.h * 0.95, P.len * 0.2); ruff.position.set(0, P.h * 0.15, P.len * 0.36); body.add(ruff); const stripe = inked(new THREE.SphereGeometry(1, 8, 6), mat(P.dark)); stripe.scale.set(P.w * 0.45, P.h * 0.35, P.len * 0.5); stripe.position.y = P.h * 0.78; body.add(stripe); }
  if (kind === 'deer') for (let i = 0; i < 8; i++) { const sp = new THREE.Mesh(new THREE.SphereGeometry(0.03, 5, 4), mat(P.belly)); sp.position.set((i % 2 ? 0.14 : -0.14) * (1 + (i % 3) * 0.3), P.h * 0.55 - (i % 3) * 0.1, -P.len * 0.3 + i * 0.07); body.add(sp); }
  // pescoço + cabeça + mandíbula
  const neck = new THREE.Group(); neck.position.set(0, P.h * 0.45, P.len * 0.42); body.add(neck);
  const nk = inked(new THREE.CylinderGeometry(P.head * 0.75, P.head * 1.1, Math.max(0.12, P.neck), 8), mat(P.col)); nk.position.set(0, P.neck * 0.3, P.neck * 0.25); nk.rotation.x = kind === 'deer' || kind === 'horse' ? 0.5 : 1.1; neck.add(nk);
  const head = new THREE.Group(); head.position.set(0, P.neck * (kind === 'deer' || kind === 'horse' ? 0.75 : 0.35), P.neck * (kind === 'deer' || kind === 'horse' ? 0.35 : 0.65) + P.head * 0.4); neck.add(head);
  const sk = inked(new THREE.SphereGeometry(P.head, 10, 8), mat(P.col)); sk.scale.set(1, 0.95, 1.1); head.add(sk);
  const brow = inked(new THREE.SphereGeometry(P.head * 0.7, 8, 6), mat(P.dark)); brow.scale.set(1.1, 0.5, 0.8); brow.position.set(0, P.head * 0.55, P.head * 0.35); head.add(brow);
  const sn = inked(new THREE.BoxGeometry(P.head * 0.85, P.head * 0.62, P.snout), mat(P.col)); sn.position.set(0, -P.head * 0.02, P.head * 0.7 + P.snout * 0.4); head.add(sn);
  const jaw = new THREE.Group(); jaw.position.set(0, -P.head * 0.3, P.head * 0.55); head.add(jaw);
  const jw = inked(new THREE.BoxGeometry(P.head * 0.75, P.head * 0.28, P.snout * 0.9), mat(P.belly)); jw.position.set(0, -P.head * 0.1, P.snout * 0.42); jaw.add(jw);
  if (kind !== 'deer') for (const sx of [-1, 1]) for (let i = 0; i < 2; i++) { const th = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.06, 4), tm(0xf0ead8)); th.rotation.x = Math.PI; th.position.set(sx * P.head * 0.3, -P.head * 0.3, P.head * 0.7 + P.snout * (0.25 + i * 0.35)); head.add(th); }
  const nose = new THREE.Mesh(new THREE.BoxGeometry(P.head * 0.4, P.head * 0.3, 0.05), tm(0x111111)); nose.position.set(0, P.head * 0.15, P.head * 0.7 + P.snout * 0.88); head.add(nose);
  const ears: THREE.Group[] = [];
  for (const sx of [-1, 1]) {
    const eg = new THREE.Group(); eg.position.set(sx * P.head * 0.62, P.head * 0.8, -P.head * 0.1); head.add(eg); ears.push(eg);
    const ear = inked(new THREE.ConeGeometry(P.head * 0.36, P.head * 0.85 * P.ear, 4), mat(P.col)); ear.position.y = P.head * 0.35 * P.ear; ear.rotation.z = -sx * 0.25; eg.add(ear);
    const inner = new THREE.Mesh(new THREE.ConeGeometry(P.head * 0.2, P.head * 0.55 * P.ear, 4), mat(P.belly)); inner.position.set(0, P.head * 0.3 * P.ear, P.head * 0.1); inner.rotation.z = -sx * 0.25; eg.add(inner);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(P.head * 0.17, 7, 6), new THREE.MeshBasicMaterial({ color: kind === 'deer' || kind === 'horse' ? 0x111111 : kind0 === 'rat' ? 0xff2010 : kind === 'boar' ? 0xff6a30 : 0xffc040 })); eye.position.set(sx * P.head * 0.6, P.head * 0.28, P.head * 0.72); head.add(eye);
    if (kind === 'boar') { const tk = inked(new THREE.ConeGeometry(0.035, 0.22, 5), tm(0xe8dcc0)); tk.position.set(sx * P.head * 0.45, -P.head * 0.3, P.head * 0.95); tk.rotation.x = -1.1; tk.rotation.z = sx * 0.5; head.add(tk); }
    if (kind === 'deer') { const an = new THREE.Group(); an.position.set(sx * P.head * 0.4, P.head * 0.9, -0.02); an.rotation.z = -sx * 0.5; head.add(an); const a1 = inked(new THREE.CylinderGeometry(0.014, 0.028, 0.5, 5), tm(0x5a4228)); a1.position.y = 0.25; an.add(a1); for (let i = 0; i < 3; i++) { const t2 = inked(new THREE.CylinderGeometry(0.008, 0.02, 0.2, 5), tm(0x5a4228)); t2.position.set(sx * 0.06, 0.18 + i * 0.12, 0.02); t2.rotation.z = sx * 0.9; an.add(t2); } }
  }
  // pernas em dois segmentos: coxa + canela, com casco/pata
  const legs: THREE.Group[] = [], knees: THREE.Group[] = [];
  for (const [lx, lz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
    const g = new THREE.Group(); g.position.set(lx * P.w * 0.6, -P.h * 0.25, lz * P.len * 0.3); body.add(g);
    const up = P.leg * 0.5, lo = P.leg * 0.5 + P.h * 0.25;
    const th = inked(new THREE.CylinderGeometry(P.w * 0.22, P.w * 0.16, up, 7), mat(lz > 0 ? P.col : P.col)); th.position.y = -up / 2; g.add(th);
    const thigh = inked(new THREE.SphereGeometry(P.w * 0.3, 7, 6), mat(P.col)); thigh.scale.set(0.8, 1.2, 1.1); thigh.position.y = -up * 0.25; g.add(thigh);
    const kn = new THREE.Group(); kn.position.y = -up; g.add(kn); knees.push(kn);
    const sh = inked(new THREE.CylinderGeometry(P.w * 0.15, P.w * 0.11, lo, 6), mat(P.dark)); sh.position.y = -lo / 2; kn.add(sh);
    const f = new THREE.Mesh(new THREE.BoxGeometry(P.w * 0.3, 0.05, P.w * 0.38), tm(0x1a1410)); f.position.set(0, -lo + 0.02, P.w * 0.08); kn.add(f);
    legs.push(g);
  }
  // cauda em segmentos
  const tail: THREE.Group[] = []; { let par: THREE.Object3D = body; const n = kind0 === 'rat' ? 5 : 3, segL = P.tail / n;
    for (let i = 0; i < n; i++) { const tg = new THREE.Group(); tg.position.set(0, i === 0 ? P.h * 0.35 : 0, i === 0 ? -P.len * 0.42 : -segL); par.add(tg); const r0 = kind0 === 'rat' ? 0.02 : 0.06 * (1 - i / n) + 0.02; const tm2 = inked(new THREE.CylinderGeometry(r0 * 0.8, r0, segL, 6), mat(kind === 'deer' ? P.belly : kind0 === 'rat' ? 0x9a7a70 : P.col)); tm2.rotation.x = Math.PI / 2; tm2.position.z = -segL / 2; tg.add(tm2); tail.push(tg); par = tg; } }
  return { root, legs, knees, head, neck, jaw, body, tail, ears, mats, P: { leg: P.leg, h: P.h, len: P.len } };
}

/* ---- fada e guardião da mata (rigs procedurais) ---- */
function buildFairy(): Rig {
  const root = new THREE.Group(), mats: THREE.MeshToonMaterial[] = [];
  const hue = [0xff9ad8, 0x9ae8ff, 0xc8ff9a, 0xffe49a][(Math.random() * 4) | 0];
  const body = inked(new THREE.CapsuleGeometry(0.08, 0.2, 4, 8), tm(0xf0e0d0), 0.02); body.position.y = 0; root.add(body);
  const head = inked(new THREE.SphereGeometry(0.1, 8, 6), tm(0xf5e6d8), 0.02); head.position.y = 0.26; root.add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6, 0, 6.283, 0, 1.6), tm(hue)); hair.position.y = 0.29; root.add(hair);
  for (const s of [-1, 1]) { const eye = new THREE.Mesh(new THREE.SphereGeometry(0.018, 5, 4), new THREE.MeshBasicMaterial({ color: 0xff2040 })); eye.position.set(s * 0.04, 0.27, 0.09); root.add(eye); }
  const wm = new THREE.MeshBasicMaterial({ color: hue, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
  const wings: THREE.Mesh[] = [];
  for (const s of [-1, 1]) for (const k of [0, 1]) { const w = new THREE.Mesh(new THREE.CircleGeometry(k ? 0.17 : 0.24, 8), wm); w.scale.set(1, 1.6, 1); w.position.set(s * 0.12, 0.08 - k * 0.1, -0.05); w.rotation.y = s * 1.1; root.add(w); wings.push(w); }
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ color: hue, map: radialTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); glow.scale.setScalar(1.6); glow.position.y = 0.1; root.add(glow);
  const lt = { t: Math.random() * 6 };
  return { root, mats, update(e, dt, windK, strikeK, hurtK, mv) {
    lt.t += dt; const f = Math.sin(lt.t * 40);
    wings.forEach((w, i) => { w.rotation.z = (i % 2 ? 1 : -1) * 0.15 + f * 0.5 * (i < 2 ? 1 : -1) * (i % 2 ? -1 : 1); });
    root.position.y = Math.sin(lt.t * 3) * 0.15 + strikeK * -0.2; root.rotation.x = 0.35 * Math.min(1, mv / 3) + windK * -0.4;
    (glow.material as THREE.SpriteMaterial).opacity = 0.7 + Math.sin(lt.t * 7) * 0.25 + hurtK * 0.3;
  } };
}
let rtex: THREE.Texture | null = null;
function radialTex() { if (rtex) return rtex; const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d')!; const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); rtex = new THREE.CanvasTexture(c); return rtex; }

function buildTreant(): Rig {
  const root = new THREE.Group(), mats: THREE.MeshToonMaterial[] = [];
  const bark = tm(0x4a3426), bark2 = tm(0x5e4430), leaf = tm(0x3f7a3a); mats.push(bark, bark2, leaf);
  const legs: THREE.Group[] = [];
  for (const s of [-1, 1]) { const l = new THREE.Group(); l.position.set(s * 0.38, 1.1, 0); const lg = inked(new THREE.CylinderGeometry(0.22, 0.3, 1.1, 7), bark, 0.04); lg.position.y = -0.5; l.add(lg); const ft = inked(new THREE.BoxGeometry(0.5, 0.2, 0.7), bark2, 0.03); ft.position.set(0, -1.05, 0.12); l.add(ft); root.add(l); legs.push(l); }
  const torso = new THREE.Group(); torso.position.y = 1.1; root.add(torso);
  const tr = inked(new THREE.CylinderGeometry(0.62, 0.5, 1.7, 8), bark, 0.05); tr.position.y = 0.85; torso.add(tr);
  for (let i = 0; i < 5; i++) { const k = inked(new THREE.SphereGeometry(0.2, 6, 5), bark2, 0.03); const a = i * 1.3; k.position.set(Math.cos(a) * 0.55, 0.4 + i * 0.3, Math.sin(a) * 0.55); torso.add(k); }
  const face = new THREE.Group(); face.position.set(0, 1.5, 0.52); torso.add(face);
  for (const s of [-1, 1]) { const ey = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 5), new THREE.MeshBasicMaterial({ color: 0xffaa30 })); ey.position.set(s * 0.18, 0.1, 0); face.add(ey); }
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 0.05), tm(0x0a0604)); mouth.position.y = -0.12; face.add(mouth);
  const crown: THREE.Mesh[] = [];
  for (let i = 0; i < 6; i++) { const lf = inked(new THREE.IcosahedronGeometry(0.5, 0), leaf, 0.04); lf.userData.keep = true; const a = i * 1.05; lf.position.set(Math.cos(a) * 0.5, 1.95 + (i % 2) * 0.2, Math.sin(a) * 0.5); lf.scale.set(1, 0.8, 1); torso.add(lf); crown.push(lf); }
  const arms: THREE.Group[] = [];
  for (const s of [-1, 1]) { const a = new THREE.Group(); a.position.set(s * 0.7, 1.5, 0); const up = inked(new THREE.CylinderGeometry(0.16, 0.2, 1.1, 6), bark, 0.04); up.position.y = -0.5; a.add(up); const fist = inked(new THREE.DodecahedronGeometry(0.28, 0), bark2, 0.03); fist.position.y = -1.15; a.add(fist); for (let k = 0; k < 3; k++) { const tw = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.4, 4), leaf); tw.position.set(s * 0.15, -0.3 - k * 0.25, 0.1); tw.rotation.z = -s * 1.2; a.add(tw); } torso.add(a); arms.push(a); }
  root.scale.setScalar(1.15);
  const st = { t: 0 };
  return { root, mats, update(e, dt, windK, strikeK, hurtK, mv) {
    st.t += dt; const sw = Math.sin(st.t * 3.2) * Math.min(1, mv / 2);
    legs[0].rotation.x = sw * 0.5; legs[1].rotation.x = -sw * 0.5; torso.rotation.z = Math.sin(st.t * 1.1) * 0.03; torso.position.y = 1.1 + Math.abs(sw) * 0.05;
    arms[0].rotation.x = -sw * 0.4; arms[1].rotation.x = sw * 0.4; arms[0].rotation.z = -0.15; arms[1].rotation.z = 0.15;
    if (windK > 0) { const k = windK * windK; arms[0].rotation.x = -3.0 * k; arms[1].rotation.x = -3.0 * k; torso.rotation.x = -0.2 * k; }
    if (strikeK > 0) { arms[0].rotation.x = -0.5 - 2.4 * strikeK; arms[1].rotation.x = -0.5 - 2.4 * strikeK; torso.rotation.x = 0.35 * (1 - strikeK * 0.3); }
    if (hurtK > 0) torso.rotation.x = -0.25 * hurtK;
    crown.forEach((c, i) => { c.rotation.y = st.t * 0.4 + i; });
  } };
}

let runeTex: THREE.Texture | null = null;
function runes() {
  if (runeTex) return runeTex;
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d')!; g.translate(128, 128);
  g.strokeStyle = '#d8b8ff'; g.fillStyle = '#d8b8ff'; g.lineWidth = 3; g.shadowColor = '#9a5cff'; g.shadowBlur = 8;
  for (const r of [122, 112, 78, 70]) { g.beginPath(); g.arc(0, 0, r, 0, 6.283); g.stroke(); }
  g.lineWidth = 1.6; for (let i = 0; i < 16; i++) { const r = RUNAS[i % RUNAS.length]; g.save(); g.rotate(i / 16 * 6.283); g.translate(-9, -105); g.scale(0.65, 0.65); g.stroke(new Path2D(r.d)); if (r.fill) g.fill(new Path2D(r.fill)); g.restore(); } g.lineWidth = 3; // runas de Karmika (não nórdicas)
  g.lineWidth = 2; g.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283 - 1.57; g.lineTo(Math.cos(a) * 66, Math.sin(a) * 66); } g.closePath(); g.stroke();
  g.beginPath(); for (let i = 0; i < 6; i++) { const a = (i + 0.5) / 6 * 6.283 - 1.57; g.lineTo(Math.cos(a) * 66, Math.sin(a) * 66); } g.closePath(); g.stroke();
  g.shadowBlur = 14; g.beginPath(); g.moveTo(0, -30); g.lineTo(-26, 22); g.lineTo(26, 22); g.closePath(); g.stroke();
  runeTex = new THREE.CanvasTexture(c); return runeTex;
}

/** Zumbi: corpo cinza-esverdeado em farrapos, cabeça pendida, braços estendidos; cambaleia e se arrasta */
/** lobisomem de pé (werewolf3d): alterna a garra a cada golpe; morde quando o golpe é curto */
/** lobo e coiote: o lobo esguio de quatro patas */
function wolfRig(): Rig {
  const w = buildWolf();
  return { root: w.root, mats: w.mats, update(e, dt, windK, strikeK, hurtK, mv) { w.pose({ dt, mv, wind: windK, strike: strikeK, hurt: hurtK, idle: e.state === 'idle', alert: e.state === 'chase' || e.state === 'windup' }); } };
}
/** zumbi, carniçal e esqueleto (undead3d): corpos orgânicos no lugar das caixas */
function undeadRig(k: 'zombie' | 'ghoul' | 'skeleton'): Rig {
  const u = buildUndead(k);
  return { root: u.root, mats: u.mats, update(e, dt, windK, strikeK, hurtK, mv) { u.pose({ dt, mv, wind: windK, strike: strikeK, hurt: hurtK, idle: e.state === 'idle' }); } };
}
function beastRig(): Rig {
  const b = buildBeast(); let side = 1, lastS = 0;
  return { root: b.root, mats: b.mats, update(_e, dt, windK, strikeK, hurtK, mv) {
    if (strikeK > 0.5 && lastS <= 0.5) side = -side; lastS = strikeK;
    b.pose({ dt, mv, wind: windK, strike: strikeK, hurt: hurtK, mode: windK > 0.01 || strikeK > 0.01 ? (side > 0 ? 'clawR' : 'clawL') : null, combat: _e.state === 'chase' || _e.state === 'windup' || _e.state === 'recover' });
  } };
}
/** Bispo Caído: prelado demoníaco — mitra fendida, casula negra com bandas douradas, cruz invertida, báculo de ferro e auréola escura */
function buildBishop(): Rig {
  const root = new THREE.Group(), mats: THREE.MeshToonMaterial[] = [];
  const robe = tm(0x1a0a14), robe2 = tm(0x3a0a1a), gold = tm(0xc9a24a), skin = tm(0xb8a8a0), bone = tm(0xcfc8d8); mats.push(robe, robe2, gold, skin, bone);
  const circ = new THREE.Mesh(new THREE.CircleGeometry(4.2, 48), new THREE.MeshBasicMaterial({ map: runes(), transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xff6a6a })); circ.rotation.x = -Math.PI / 2; circ.position.y = 0.04; root.add(circ);
  const body = new THREE.Group(); root.add(body);
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 1.1, 2.4, 12, 1, true), robe); skirt.material.side = THREE.DoubleSide; skirt.position.y = 1.2; body.add(skirt);
  for (const y of [0.3, 1.0]) { const band = new THREE.Mesh(new THREE.CylinderGeometry(0.4 + (2.4 - y) * 0.29 * 0.98, 0.4 + (2.4 - y + 0.18) * 0.29 * 0.98, 0.18, 12, 1, true), gold); band.material.side = THREE.DoubleSide; band.position.y = y; body.add(band); }
  const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.42, 1.0, 8), robe2); chest.position.y = 2.6; body.add(chest);
  const stole = new THREE.Mesh(new THREE.BoxGeometry(0.26, 1.8, 0.06), gold); stole.position.set(0, 2.1, 0.46); body.add(stole);
  const cross = new THREE.Group(); cross.position.set(0, 2.55, 0.52); body.add(cross); const c1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.05), bone); cross.add(c1); const c2 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 0.05), bone); c2.position.y = -0.1; cross.add(c2); // invertida
  const sh = new THREE.Mesh(new THREE.SphereGeometry(0.7, 8, 6, 0, 6.283, 0, 1.4), robe); sh.position.y = 2.85; sh.scale.set(1.2, 0.6, 0.9); body.add(sh);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 6), skin); head.position.y = 3.35; head.scale.set(1, 1.2, 0.9); body.add(head);
  for (const s of [-1, 1]) { const ey = new THREE.Mesh(new THREE.SphereGeometry(0.045, 5, 4), new THREE.MeshBasicMaterial({ color: 0xff3a3a })); ey.position.set(s * 0.09, 3.4, 0.2); body.add(ey); }
  // mitra fendida (duas lâminas) com cruz invertida dourada
  for (const s of [-1, 1]) { const m = new THREE.Mesh(new THREE.ConeGeometry(0.3, 1.1, 4), robe2); m.scale.set(1, 1, 0.35); m.position.set(0, 4.05, s * 0.12); m.rotation.y = Math.PI / 4; body.add(m); }
  const mx = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.4, 0.04), gold); mx.position.set(0, 3.95, 0.24); body.add(mx); const mx2 = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.06, 0.04), gold); mx2.position.set(0, 3.82, 0.24); body.add(mx2);
  for (const s of [-1, 1]) { const hn = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.5, 5), bone); hn.position.set(s * 0.24, 3.6, 0); hn.rotation.z = -s * 0.7; body.add(hn); }
  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.05, 5, 24), new THREE.MeshBasicMaterial({ color: 0x5a1a2a })); halo.position.set(0, 3.5, -0.2); body.add(halo);
  const arms: THREE.Group[] = [];
  for (const s of [-1, 1]) { const a = new THREE.Group(); a.position.set(s * 0.7, 2.85, 0); const up = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 1.0, 6), robe); up.position.y = -0.45; a.add(up); const hand = new THREE.Mesh(new THREE.SphereGeometry(0.13, 6, 5), skin); hand.position.y = -1.0; a.add(hand); body.add(a); arms.push(a); }
  // báculo de ferro com crosta em espiral e cristal rubro
  const stf = new THREE.Group(); stf.position.set(0, -1.0, 0); arms[1].add(stf);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 3.4, 6), tm(0x2a2a30)); pole.position.y = 0.6; stf.add(pole);
  const crook = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.05, 5, 14, 4.4), gold); crook.position.set(0.3, 2.35, 0); crook.rotation.z = 1.2; stf.add(crook);
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), new THREE.MeshBasicMaterial({ color: 0xff3a4a })); gem.position.set(0.58, 2.5, 0); stf.add(gem);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ color: 0xff3a4a, map: radialTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, opacity: 0.5 })); glow.scale.set(3.2, 3.2, 1); glow.position.y = 2.4; body.add(glow);
  root.scale.setScalar(1.2);
  const st = { t: 0 };
  return { root, mats, update(e, dt, windK, strikeK, hurtK, mv) {
    st.t += dt; circ.rotation.z -= dt * 0.4; halo.rotation.z += dt * 1.2; const bob = Math.sin(st.t * 1.4) * 0.12;
    body.position.y = bob; body.rotation.x = 0.08 * Math.min(1, mv / 2.5) - 0.3 * windK * windK + 0.35 * strikeK - 0.2 * hurtK;
    arms[0].rotation.x = -0.4 + Math.sin(st.t * 1.2) * 0.1; arms[0].rotation.z = -0.5 - 0.6 * windK; // mão esquerda erguida em "bênção"
    arms[1].rotation.x = -0.3 - 2.6 * windK * windK + 2.4 * Math.min(1, strikeK * 1.4); arms[1].rotation.z = 0.2;
    gem.scale.setScalar(1 + Math.sin(st.t * 6) * 0.25 + windK * 0.8); (glow.material as THREE.SpriteMaterial).opacity = 0.4 + Math.sin(st.t * 2.2) * 0.1 + windK * 0.4 + hurtK * 0.3;
    skirt.scale.set(1 + Math.sin(st.t * 2) * 0.03, 1, 1 + Math.cos(st.t * 2) * 0.03);
  } };
}
function buildPrince(): Rig {
  const root = new THREE.Group(), mats: THREE.MeshToonMaterial[] = [];
  const robe = tm(0x14101e), robe2 = tm(0x241a3a), bone = tm(0xcfc8d8); mats.push(robe, robe2, bone);
  const circ = new THREE.Mesh(new THREE.CircleGeometry(3.4, 48), new THREE.MeshBasicMaterial({ map: runes(), transparent: true, opacity: 0.95, depthWrite: false, blending: THREE.AdditiveBlending })); circ.rotation.x = -Math.PI / 2; circ.position.y = 0.06; root.add(circ);
  const body = new THREE.Group(); root.add(body);
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.95, 2.2, 10, 1, true), robe); skirt.material.side = THREE.DoubleSide; skirt.position.y = 1.15; body.add(skirt);
  const tat = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.0, 6), robe2); tat.position.set(0, 0.35, 0.1); tat.rotation.x = 0.1; body.add(tat);
  const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.34, 0.9, 8), robe2); chest.position.y = 2.45; body.add(chest);
  const sh = new THREE.Mesh(new THREE.SphereGeometry(0.62, 8, 6, 0, 6.283, 0, 1.4), robe); sh.position.y = 2.65; sh.scale.set(1.15, 0.6, 0.9); body.add(sh);
  const hood = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.9, 8), robe); hood.position.y = 3.35; body.add(hood);
  const face = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), new THREE.MeshBasicMaterial({ color: 0x050308 })); face.position.set(0, 3.08, 0.14); face.scale.set(1, 1.15, 0.8); body.add(face);
  for (const s of [-1, 1]) { const ey = new THREE.Mesh(new THREE.SphereGeometry(0.045, 5, 4), new THREE.MeshBasicMaterial({ color: 0xc89aff })); ey.position.set(s * 0.08, 3.12, 0.3); body.add(ey); }
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.12), new THREE.MeshBasicMaterial({ color: 0xb98aff })); core.position.set(0, 2.5, 0.38); core.scale.set(1, 1.5, 0.6); body.add(core);
  const hornGeo = new THREE.ConeGeometry(0.05, 0.6, 5);
  for (const s of [-1, 1]) { const hn = new THREE.Mesh(hornGeo, bone); hn.position.set(s * 0.22, 3.62, 0); hn.rotation.z = -s * 0.5; body.add(hn); }
  const arms: THREE.Group[] = [];
  for (const s of [-1, 1]) { const a = new THREE.Group(); a.position.set(s * 0.62, 2.65, 0); const up = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 0.9, 6), robe); up.position.y = -0.4; a.add(up); const hd = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 5), bone); hd.position.y = -0.9; a.add(hd); body.add(a); arms.push(a); }
  // foice na mão direita
  const sc = new THREE.Group(); sc.position.set(0, -0.9, 0); arms[1].add(sc);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 3.2, 5), tm(0x3a2a22)); pole.position.y = 0.3; sc.add(pole);
  const blade = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.07, 4, 14, 1.9), new THREE.MeshBasicMaterial({ color: 0xcfc4ff })); blade.position.set(0, 1.85, 0.0); blade.rotation.set(0, 0, 1.9); blade.scale.set(1, 1, 0.3); sc.add(blade);
  sc.rotation.x = -0.9;
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ color: 0x9a5cff, map: radialTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, opacity: 0.55 })); glow.scale.setScalar(5); glow.position.y = 2.2; root.add(glow);
  root.scale.setScalar(1.25);
  const st = { t: 0 };
  return { root, mats, update(e, dt, windK, strikeK, hurtK, mv) {
    st.t += dt; circ.rotation.z += dt * 0.5; const bob = Math.sin(st.t * 1.6) * 0.1;
    body.position.y = bob; body.rotation.z = Math.sin(st.t * 0.9) * 0.03; body.rotation.x = 0.1 * Math.min(1, mv / 2.5) - 0.25 * windK * windK + 0.3 * strikeK - 0.2 * hurtK;
    arms[0].rotation.x = -0.3 + Math.sin(st.t * 1.3) * 0.08; arms[0].rotation.z = -0.2;
    arms[1].rotation.x = -0.2 + Math.sin(st.t * 1.3 + 1) * 0.08; arms[1].rotation.z = 0.15;
    if (windK > 0) { const k = windK * windK; arms[1].rotation.x = -2.9 * k; arms[0].rotation.x = -1.2 * k; sc.rotation.x = -0.9 + 0.6 * k; }
    else sc.rotation.x = -0.9;
    if (strikeK > 0) { arms[1].rotation.x = -2.9 + 3.4 * Math.min(1, strikeK * 1.4); arms[1].rotation.z = 0.15 - 0.5 * strikeK; sc.rotation.x = -0.3; }
    core.scale.setScalar(1 + Math.sin(st.t * 5) * 0.2 + hurtK * 0.6); (glow.material as THREE.SpriteMaterial).opacity = 0.45 + Math.sin(st.t * 2.4) * 0.12 + hurtK * 0.3;
    skirt.scale.set(1 + Math.sin(st.t * 2) * 0.03, 1, 1 + Math.cos(st.t * 2) * 0.03);
  } };
}

export function createEnemies(ctx: EnemyCtx) {
  const list: Enemy[] = [];
  const R = rng(4242);
  let nid = 1;
  const teleGeo = new THREE.RingGeometry(0.75, 1, 28).rotateX(-Math.PI / 2);
  /* marcação do golpe no formato do ataque: mordida/garra = cone; arma = arco largo; investida = linha; pancada no chão = círculo */
  type TShape = 'cone' | 'arc' | 'line' | 'circle';
  const SHAPE: Partial<Record<EnemyType, TShape>> = { wolf: 'cone', frostwolf: 'cone', coyote: 'cone', rat: 'cone', werewolf: 'cone', ghoul: 'cone', bat: 'cone', fairy: 'cone', deer: 'cone', boar: 'line', treant: 'circle', puglin: 'arc', imp: 'arc', skeleton: 'arc', zombie: 'arc', prince: 'arc', tormentor: 'arc', bishop: 'arc' };
  const HALF: Record<TShape, number> = { cone: 0.62, arc: 1.25, line: 0, circle: Math.PI };
  const sector = (half: number, inner: number) => new THREE.RingGeometry(inner, 1, 28, 1, -Math.PI / 2 - half, half * 2).rotateX(-Math.PI / 2);
  const fillSector = (half: number) => new THREE.CircleGeometry(1, 28, -Math.PI / 2 - half, half * 2).rotateX(-Math.PI / 2);
  const GEO: Record<TShape, [THREE.BufferGeometry, THREE.BufferGeometry]> = {
    cone: [sector(HALF.cone, 0.9), fillSector(HALF.cone)], arc: [sector(HALF.arc, 0.9), fillSector(HALF.arc)],
    line: [new THREE.EdgesGeometry(new THREE.PlaneGeometry(1, 1)).rotateX(-Math.PI / 2).translate(0, 0, 0.5), new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2).translate(0, 0, 0.5)],
    circle: [teleGeo, new THREE.CircleGeometry(0.75, 28).rotateX(-Math.PI / 2)] };
  const shapeOf = (e: Enemy): TShape => SHAPE[e.type] ?? 'arc';
  /** alcance do golpe por formato */
  const reachOf = (e: Enemy) => { const r = e.def.range, sh = shapeOf(e); return sh === 'line' ? r * 2.6 : sh === 'circle' ? r * 0.95 : sh === 'cone' ? r * 1.3 : r * 1.2; };
  function inStrike(e: Enemy, hx: number, hz: number) { // o herói está dentro do formato do golpe?
    const sh = shapeOf(e), R0 = reachOf(e), fx = Math.sin(e.yaw), fz = Math.cos(e.yaw), dx = hx - e.pos.x, dz = hz - e.pos.z, HR = 0.35;
    if (sh === 'circle') { const cx = e.pos.x + fx * e.def.range * 0.6, cz = e.pos.z + fz * e.def.range * 0.6; return Math.hypot(hx - cx, hz - cz) < R0 + HR; }
    if (sh === 'line') { const along = dx * fx + dz * fz, side = Math.abs(dx * fz - dz * fx); return along > -0.5 && along < R0 + HR && side < e.def.radius + 0.55 + HR; }
    const dist = Math.hypot(dx, dz); if (dist > R0 + HR) return false; if (dist < e.def.radius + 0.4) return true;
    let a = Math.atan2(dx, dz) - e.yaw; while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return Math.abs(a) < HALF[sh] + Math.atan2(HR, dist); }
  const discGeo = new THREE.CircleGeometry(0.75, 28).rotateX(-Math.PI / 2);
  const qringGeo = new THREE.RingGeometry(0.95, 1.18, 32).rotateX(-Math.PI / 2);
  /* instâncias a partir dos pontos de spawn do mundo */
  for (const s of ctx.spawns) {
    const nn = s.n <= 1 ? s.n : Math.max(1, Math.round(s.n * 0.55)); // mundo menos povoado: menos bichos, cada um pesa mais
    for (let i = 0; i < nn; i++) {
      let x = s.x, y = s.y;
      for (let k = 0; k < 20; k++) {
        const a = R() * 6.283, r = Math.sqrt(R()) * s.r; const px = s.x + Math.cos(a) * r, py = s.y + Math.sin(a) * r;
        if (ctx.walkable(px * 2, py * 2)) { x = px; y = py; break; }
      }
      const elite = ['prince', 'tormentor', 'treant'].includes(s.type), B = DEFS[s.type];
      // nível pela região (faixa de 10): vida, dano e XP acompanham; elites ficam no topo da faixa (+2)
      const L = s.lvl ? Math.max(1, s.lvl + (elite ? 2 : Math.round((R() - 0.5) * 2.4))) : B.lvl, dL = L - B.lvl, hi = Math.max(0, L - 20), kH = Math.max(0.35, 1 + 0.12 * dL + 0.03 * hi * dL), kD = Math.max(0.4, 1 + 0.085 * dL + 0.02 * hi * dL); /* depois do 20 a vida e o golpe crescem mais rápido, para acompanhar equipamento, Força e magias (até o 20 nada muda) */
      const def = { ...B, lvl: L, hp: Math.round(B.hp * kH), dmg: Math.round(B.dmg * kD * (elite ? 1.4 : 1)), xp: Math.round(B.xp * Math.max(0.4, 1 + 0.1 * dL)), scale: B.scale * (elite ? 1.3 : 1), ...(s.fixLvl ? { aggro: Math.min(B.aggro, 8) } : {}) } as Def; /* guardião de lugar marcado: só ataca quem chega perto */ // elites: enormes e assustadores
      const e: Enemy = { id: nid++, type: s.type, def, home: new THREE.Vector2(x * 2, y * 2), pos: new THREE.Vector3(x * 2, 0, y * 2), yaw: R() * 6.28, hp: Math.round(def.hp * HPK * (['prince', 'tormentor', 'treant'].includes(s.type) ? 4.2 : 1)), hpMax: Math.round(def.hp * HPK * (['prince', 'tormentor', 'treant'].includes(s.type) ? 4.2 : 1)), state: 'idle', t: 0, alive: true, active: false, vel: new THREE.Vector2(), root: null, pup: null, quad: null, rig: null, wanderTo: null, wanderT: R() * 3, phase: R() * 6, respawn: 0, hurtT: 0, tele: null, flash: 0, mats: [] };
      e.slot = i; e.groupN = s.n; (e as Enemy & { night?: boolean }).night = !!s.night; (e as NetE).net = String(e.id); list.push(e); // mesmo mundo, mesma semente: o id é igual em todas as máquinas
    }
  }
  /* MAGIAS DOS INIMIGOS — marcam o chão sob o herói; o círculo cresce e explode: dá para ler e sair de baixo */
  type Spell = { col: number; r: number; delay: number; mul: number; cd: [number, number]; n?: number; name: string; proj?: number };
  const SPELLS: Partial<Record<EnemyType, Spell>> = {
    imp: { col: 0xff6a20, r: 1.7, delay: 1.5, mul: 1.2, cd: [7, 10], name: 'Bola de fogo', proj: 0.32 }, // proj: tamanho da bola que voa da mão até o círculo
    fairy: { col: 0xc070ff, r: 1.3, delay: 1.3, mul: 1.0, cd: [6, 9], name: 'Pó maldito' },
    treant: { col: 0x6ad04a, r: 2.4, delay: 1.7, mul: 1.3, cd: [8, 11], name: 'Raízes' },
    prince: { col: 0xff3a1a, r: 2.0, delay: 1.5, mul: 1.4, cd: [6, 8], n: 3, name: 'Chuva de cinzas' },
    tormentor: { col: 0xd02a50, r: 2.2, delay: 1.6, mul: 1.4, cd: [6, 9], n: 2, name: 'Grilhões de sangue' },
    bishop: { col: 0x8a40ff, r: 2.8, delay: 1.7, mul: 1.5, cd: [5, 7], n: 4, name: 'Juízo profano' },
    ghoul: { col: 0x8ad040, r: 1.8, delay: 1.4, mul: 1.1, cd: [8, 12], name: 'Vômito pútrido' },
    zombie: { col: 0x6aa040, r: 1.6, delay: 1.6, mul: 1.0, cd: [10, 14], name: 'Bile' },
  };
  const casts: { m: THREE.Mesh; x: number; z: number; t: number; s: Spell; dmg: number; from: THREE.Vector3; src?: Enemy; ball?: THREE.Object3D }[] = [];
  const ballGeo = new THREE.SphereGeometry(1, 12, 8);
  /** bola de fogo: miolo claro + halo da cor da magia; nasce na mão de quem conjura e voa em arco até o círculo */
  function makeBall(s: Spell) {
    const g = new THREE.Group();
    const core = new THREE.Mesh(ballGeo, new THREE.MeshBasicMaterial({ color: 0xfff0c0, fog: false })); core.scale.setScalar(s.proj! * 0.55);
    const halo = new THREE.Mesh(ballGeo, new THREE.MeshBasicMaterial({ color: s.col, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); halo.scale.setScalar(s.proj!);
    g.add(core, halo); g.scale.setScalar(0.3); ctx.scene.add(fine(g)); return g;
  }
  function castSpell(e: Enemy, s: Spell, hero: THREE.Vector3) {
    const n = s.n ?? 1;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.283, off = i === 0 ? Math.random() * 0.6 : 1.6 + Math.random() * 2.4;
      const x = hero.x + Math.cos(a) * off, z = hero.z + Math.sin(a) * off;
      addCast(e, s, x, z, i);
      if ((e as NetE).net) ctx.sync?.cast((e as NetE).net!, x, z, i);
    }
  }
  function addCast(e: Enemy, s: Spell, x: number, z: number, i: number) {
    {
      const m = new THREE.Mesh(teleGeo, new THREE.MeshBasicMaterial({ color: s.col, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
      const disc = new THREE.Mesh(discGeo, new THREE.MeshBasicMaterial({ color: s.col, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); m.add(disc);
      m.position.set(x, ctx.heightAt(x, z) + 0.09, z); m.scale.setScalar(s.r); ctx.scene.add(fine(m));
      casts.push({ m, x, z, t: -i * 0.25, s, dmg: Math.round(e.def.dmg * s.mul), from: e.pos.clone(), src: e, ball: s.proj ? makeBall(s) : undefined });
    }
  }
  function updateCasts(dt: number) {
    const hero = ctx.heroPos();
    for (let i = casts.length - 1; i >= 0; i--) {
      const c = casts[i]; c.t += dt; const k = Math.max(0, Math.min(1, c.t / c.s.delay));
      const ring = c.m.material as THREE.MeshBasicMaterial, disc = (c.m.children[0] as THREE.Mesh).material as THREE.MeshBasicMaterial;
      ring.opacity = c.t < 0 ? 0 : 0.35 + 0.65 * k; disc.opacity = c.t < 0 ? 0 : 0.08 + 0.4 * k * k; (c.m.children[0] as THREE.Mesh).scale.setScalar(Math.max(0.01, k));
      if (c.ball) { // 35% do tempo carregando na mão (cresce e pulsa), o resto voando em arco até o centro do círculo
        const src = c.src && c.src.alive ? c.src.pos : c.from, hx = src.x + Math.sin(c.src?.yaw ?? 0) * 0.5, hz = src.z + Math.cos(c.src?.yaw ?? 0) * 0.5, hy = src.y + 1.5 * (c.src?.def.scale ?? 1);
        const T0 = c.s.delay * 0.35, f = Math.max(0, Math.min(1, (c.t - T0) / (c.s.delay - T0))), gy = ctx.heightAt(c.x, c.z);
        if (c.t < T0) { c.ball.position.set(hx, hy, hz); c.ball.scale.setScalar(Math.max(0.05, c.t / T0) * (1 + 0.15 * Math.sin(c.t * 30))); if (c.src) c.from.copy(c.src.pos); }
        else { const fe = f * f * (3 - 2 * f) * 0.4 + f * 0.6; c.ball.position.set(hx + (c.x - hx) * fe, hy + (gy + 0.3 - hy) * fe + Math.sin(fe * Math.PI) * 2.2, hz + (c.z - hz) * fe); c.ball.scale.setScalar(1);
          ctx.trail?.(c.ball.position.x, c.ball.position.y, c.ball.position.z, c.s.col); }
        c.ball.rotation.y += dt * 9; c.ball.visible = c.t >= 0;
      }
      if (c.t >= c.s.delay) {
        if (c.ball) { ctx.scene.remove(c.ball); c.ball = undefined; }
        if (ctx.heroAlive() && Math.hypot(hero.x - c.x, hero.z - c.z) < c.s.r && !ctx.heroInvuln()) ctx.damageHero(c.dmg, c.from);
        ctx.spellFx?.(c.x, c.z, c.s.col, c.s.r);
        ctx.scene.remove(c.m); casts.splice(i, 1);
      }
    }
  }
  const byId = new Map<string, NetE>(), seq = new Map<string, number>(); // chave de rede → bicho
  const TYPES = Object.keys(DEFS) as EnemyType[];
  const ACT = 28, DEACT = 36;
  /** fração do grupo que existe conforme o nível: batalhas mais longas e menos numerosas no começo */
  const densityK = () => { const l = ctx.level?.() ?? 1; return l < 30 ? 0.25 : l < 60 ? 0.35 : l < 80 ? 0.5 : 0.7; }; // metade dos inimigos de antes
  const dormant = (e: Enemy) => ((e as Enemy & { night?: boolean }).night && (ctx.night?.() ?? 0) < 0.5) || !ELITE.has(e.type) && e.slot !== undefined && e.groupN !== undefined && e.slot >= Math.max(1, Math.ceil(e.groupN * densityK()));
  const ELITE = new Set<EnemyType>(['prince', 'tormentor', 'treant']); // raio de ativação: só os inimigos perto da tela ganham corpo (desempenho)

  function build(e: Enemy) {
    const g = new THREE.Group(); g.scale.setScalar(e.def.scale); e.root = g; g.userData.kind = 'enemy';
    if (e.def.quad === 'deer') { const dr = buildDeer({ stag: Math.random() < 0.55 }); e.rig = { root: dr.root, mats: dr.mats, update(e2, dt, _w, _s, hurtK, mv) { dr.pose({ dt, mv, idle: e2.state === 'idle', alert: e2.state === 'flee' || e2.state === 'hurt', hurt: hurtK }); } }; g.add(e.rig.root); e.mats = [...e.rig.mats, ...mergeStatic(e.rig.root, ramp)]; }
    else if (e.def.quad === 'boar') { const bw = buildBoar(); e.rig = { root: bw.root, mats: bw.mats, update(e2, dt, windK, strikeK, hurtK, mv) { bw.pose({ dt, mv, wind: windK, strike: strikeK, hurt: hurtK, idle: e2.state === 'idle', alert: e2.state === 'chase' }); } }; g.add(e.rig.root); e.mats = [...e.rig.mats, ...mergeStatic(e.rig.root, ramp)]; }
    else if (e.def.quad === 'wolf' || e.def.quad === 'coyote') { e.rig = wolfRig(); g.add(e.rig.root); e.mats = [...e.rig.mats, ...mergeStatic(e.rig.root, ramp)]; if (e.def.tint) { const tc = new THREE.Color(e.def.tint); for (const m of e.mats) m.color.lerp(tc, 0.55); } } // 25/10: o lobo esguio (werewolf3d) no lugar do tonel
    else if (e.def.rig) { e.rig = e.def.rig === 'fairy' ? buildFairy() : e.def.rig === 'prince' ? buildPrince() : e.def.rig === 'zombie' ? undeadRig(e.type === 'skeleton' ? 'skeleton' : e.type === 'ghoul' ? 'ghoul' : 'zombie') : e.def.rig === 'bishop' ? buildBishop() : e.def.rig === 'human' ? buildHuman(e.def.human!) : e.def.rig === 'beast' ? beastRig() : buildTreant(); g.add(e.rig.root); e.mats = e.def.rig === 'human' ? [] : [...e.rig.mats, ...mergeStatic(e.rig.root, ramp)]; if (e.def.tint) { const tc = new THREE.Color(e.def.tint); for (const m of e.mats) m.color.lerp(tc, 0.55); } }
    else if (e.def.quad) { e.quad = buildQuad(e.def.quad, e.def.tint); g.add(e.quad.root); e.mats = [...e.quad.mats, ...mergeStatic(e.quad.root, ramp)]; }
    else if (e.def.model) {
      loadModel(`/models/bestiary/${e.def.model}.glb`).then((m) => {
        if (e.root !== g) return;
        g.add(m); e.pup = new Puppet(m);
        m.traverse((o) => { const mm = o as THREE.Mesh; if (mm.isMesh && (mm.material as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
          const sm = mm.material as THREE.MeshStandardMaterial;
          const t = new THREE.MeshToonMaterial({ map: sm.map, gradientMap: ramp, emissive: sm.emissive, emissiveMap: sm.emissiveMap, emissiveIntensity: sm.emissiveIntensity });
          mm.material = t; e.mats.push(t);
        } });
      }).catch((err) => console.error('modelo falhou', e.def.model, err));
    }
    const [og, fg] = GEO[shapeOf(e)], lineSh = shapeOf(e) === 'line';
    const tele = (lineSh ? new THREE.LineSegments(og, new THREE.LineBasicMaterial({ color: 0xff4020, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })) : new THREE.Mesh(og, new THREE.MeshBasicMaterial({ color: 0xff4020, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, side: THREE.DoubleSide }))) as unknown as THREE.Mesh;
    const disc = new THREE.Mesh(fg, new THREE.MeshBasicMaterial({ color: 0xff3010, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, side: THREE.DoubleSide }));
    tele.add(disc); tele.visible = false; tele.position.set(0, 0.08, 0); e.tele = tele; ctx.scene.add(fine(tele));
    // anel de missão: dourado no chão, sob o bicho que a missão pede (liga/desliga pelo diário)
    const qr = new THREE.Mesh(qringGeo, new THREE.MeshBasicMaterial({ color: 0xffc83a, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, side: THREE.DoubleSide })); qr.position.y = 0.06; qr.visible = !!(e as Enemy & { quest?: boolean }).quest; qr.scale.setScalar(Math.max(0.8, e.def.radius ?? 0.7)); g.add(qr); (e as Enemy & { qring?: THREE.Mesh }).qring = qr;
    ctx.scene.add(fine(g));
  }
  function unbuild(e: Enemy) {
    if (e.root) ctx.scene.remove(e.root); if (e.tele) ctx.scene.remove(e.tele);
    e.root = null; e.pup = null; e.quad = null; e.rig = null; e.tele = null; e.mats = []; (e as Enemy & { qring?: THREE.Mesh }).qring = undefined;
  }
  const tmp = new THREE.Vector3();

  function step(e: Enemy, dx: number, dz: number) {
    const nx = e.pos.x + dx, nz = e.pos.z + dz;
    if (ctx.walkable(nx, e.pos.z)) e.pos.x = nx;
    if (ctx.walkable(e.pos.x, nz)) e.pos.z = nz;
  }
  function face(e: Enemy, tx: number, tz: number, dt: number, rate = 10) {
    const want = Math.atan2(tx - e.pos.x, tz - e.pos.z); let d = want - e.yaw; while (d > Math.PI) d -= 6.283; while (d < -Math.PI) d += 6.283;
    e.yaw += d * Math.min(1, dt * rate);
  }

  /** dano no inimigo; devolve true se morreu */
  /** quem luta do seu lado num evento (aliado) não apanha de você; só dos inimigos dele (hurtBy) */
  let byUnit = false;
  function hurtBy(e: Enemy, n: number, from: THREE.Vector3): boolean { byUnit = true; try { return hurt(e, n, from, 1.2); } finally { byUnit = false; } }
  function hurt(e: Enemy, n: number, from: THREE.Vector3, knock = 3): boolean {
    if (!e.alive) return false;
    if ((e as Enemy & { ally?: boolean }).ally && !byUnit) return false;
    if ((e as Enemy & { kneel?: boolean }).kneel) return false; /* de joelhos: nenhum golpe, brasa ou veneno mexe nele até a escolha */
    if (!byUnit && ctx.outMul) n = Math.max(1, Math.round(n * ctx.outMul()));
    e.hp -= n; e.flash = 1;
    const nk = (e as NetE).net; if (nk && ctx.sync) { ctx.sync.hit(nk, n); if (e.hp <= 0) ctx.sync.die(nk); }
    const dx = e.pos.x - from.x, dz = e.pos.z - from.z, l = Math.hypot(dx, dz) || 1;
    e.vel.set((dx / l) * knock, (dz / l) * knock);
    if (e.hp <= 0) { e.alive = false; e.state = 'dead'; e.t = 0; e.respawn = (e as Enemy & { tag?: string }).tag ? 1e9 : ELITE.has(e.type) ? 240 : 90; return true; }
    if (e.def.passive) { e.state = 'flee'; e.t = 0; }
    else { // tranco só com golpe pesado ou de vez em quando — bicho grande não para de atacar a cada corte
      const now = performance.now() / 1000, heavy = n > e.hpMax * 0.3;
      if (heavy || (e.state !== 'windup' && now - (e.hurtT || 0) > 1.6 && Math.random() < 0.35)) { e.state = 'hurt'; e.t = 0; e.hurtT = now; }
    }
    if (!e.def.passive && e.state !== 'hurt' && e.state !== 'windup') e.state = 'chase';
    return false;
  }

  function animate(e: Enemy, dt: number, moveSp: number) {
    const D = Math.PI / 180;
    e.phase += dt * (3 + moveSp * 2.6);
    const ph = e.phase, sw = Math.sin(ph) * Math.min(1, moveSp / 2);
    const windK = e.state === 'windup' ? Math.min(1, e.t / e.def.windup) : 0;
    const strike = e.state === 'recover' ? Math.max(0, 1 - e.t / 0.28) : 0;
    const hurtK = e.state === 'hurt' ? Math.min(1, Math.max(0, 1 - e.t / 0.35)) : 0;
    if (e.pup) {
      const p = e.pup; p.clear();
      const arm = 72 * D, br = Math.sin(e.t * 2 + e.id), run = Math.min(1, moveSp / 3.2), idle = e.state === 'idle' ? 1 : 0;
      // caminhada: braços em contra-fase, cotovelos fechando na corrida; pernas com joelho dobrando na passada
      p.set('upperarm_l', -sw * (0.5 + 0.4 * run), 0, -arm * (1 - 0.25 * run)); p.set('upperarm_r', sw * (0.5 + 0.4 * run), 0, arm * (1 - 0.25 * run));
      p.set('lowerarm_l', 0, 0, -0.25 - 0.7 * run); p.set('lowerarm_r', 0, 0, 0.25 + 0.7 * run);
      p.set('thigh_l', sw * (0.65 + 0.3 * run)); p.set('thigh_r', -sw * (0.65 + 0.3 * run));
      p.set('calf_l', Math.max(0, -sw) * (0.9 + 0.6 * run) + 0.1 * run); p.set('calf_r', Math.max(0, sw) * (0.9 + 0.6 * run) + 0.1 * run);
      let lean = 0.1 + 0.22 * run + br * 0.015 + idle * 0.05, twist = Math.sin(ph) * 0.12 * run, headX = 0, headY = idle * Math.sin(e.t * 0.6 + e.id) * 0.3;
      if (windK > 0) { // antecipação: agacha, braço da arma sobe bem alto, outro braço à frente, corpo recua e torce
        const k = windK * windK; p.set('upperarm_r', -2.9 * k, 0.2 * k, arm * (1 - k * 0.6)); p.set('lowerarm_r', -0.9 * k, 0, 0.25); p.set('upperarm_l', -0.9 * k, 0, -arm * (1 - k * 0.3)); p.set('lowerarm_l', 0, 0, -0.9 * k);
        p.set('thigh_l', 0.35 * k); p.set('thigh_r', -0.25 * k); p.set('calf_l', 0.6 * k); p.set('calf_r', 0.5 * k); lean = -0.22 * k; twist = -0.45 * k; headX = -0.2 * k;
      } else if (strike > 0) { // golpe: tudo para a frente, arma desce, corpo mergulha
        const k = strike; p.set('upperarm_r', 0.6 - 0.4 * k, -0.2, arm * 0.35); p.set('lowerarm_r', 0.1, 0, 0.3); p.set('upperarm_l', 0.4 * k, 0, -arm * 0.6); p.set('lowerarm_l', 0, 0, -0.8 * k);
        p.set('thigh_l', -0.7 * k); p.set('thigh_r', 0.4 * k); p.set('calf_l', 0.5 * k); p.set('calf_r', 0.2); lean = 0.55 * (1 - k * 0.25); twist = 0.55 * (1 - k); headX = 0.35 * k;
      }
      if (hurtK > 0) { lean = -0.45 * hurtK; p.set('spine_03', -0.3 * hurtK); p.set('upperarm_l', 0.8 * hurtK, 0, -arm); p.set('upperarm_r', 0.8 * hurtK, 0, arm); headX = -0.4 * hurtK; }
      p.set('spine_01', lean * 0.6, twist * 0.5); p.set('spine_02', lean * 0.5, twist * 0.5); p.set('neck_01', -lean * 0.4 + headX, headY);
      p.apply();
      if (p.hips) p.hips.position.y = p.hipsRest.y - Math.abs(Math.sin(ph)) * (0.02 + 0.03 * run) * Math.min(1, moveSp / 3) - 0.09 * windK * windK - 0.05 * strike + idle * Math.sin(e.t * 1.6 + e.id) * 0.006;
    } else if (e.quad) {
      const q = e.quad, spd = Math.min(1, moveSp / 3.2), gallop = Math.min(1, Math.max(0, (moveSp - 2.6) / 2.4));
      const A = 0.55 + 0.35 * gallop, ph2 = ph * 1.5;
      const trot = [Math.sin(ph2), Math.sin(ph2 + Math.PI), Math.sin(ph2 + Math.PI), Math.sin(ph2)]; // pares diagonais
      const gal = [Math.sin(ph2), Math.sin(ph2 + 0.5), Math.sin(ph2 + Math.PI + 0.4), Math.sin(ph2 + Math.PI + 0.9)]; // galope: dianteiras juntas, traseiras juntas
      const crouch = windK * windK * 0.75, pounce = strike;
      for (let i = 0; i < 4; i++) {
        const front = i < 2, sw2 = (trot[i] * (1 - gallop) + gal[i] * gallop) * spd;
        let hip = sw2 * A * (front ? 1 : 0.9), knee = Math.max(0, front ? -sw2 : sw2) * (0.9 + 0.5 * gallop) * spd + 0.12 * spd;
        if (e.state === 'idle' && spd < 0.05) { hip = 0; knee = 0.05; }
        if (crouch > 0) { hip += (front ? 0.5 : -0.3) * crouch; knee += (front ? 0.9 : 0.8) * crouch; }
        if (pounce > 0) { const k = Math.sin(Math.min(1, pounce) * Math.PI); hip += (front ? -1.0 : 0.9) * k; knee += (front ? 0.2 : -0.2) * k; }
        if (hurtK > 0) { knee += 0.4 * hurtK; }
        q.legs[i].rotation.x = hip; q.knees[i].rotation.x = front ? knee : -knee * 0.9;
      }
      const y0 = q.body.userData.y0 ?? (q.body.userData.y0 = q.body.position.y);
      q.body.position.y = y0 + Math.abs(Math.sin(ph2)) * 0.05 * spd * (1 + gallop) - crouch * q.P.leg * 0.45 + pounce * 0.35 * Math.sin(Math.min(1, pounce) * Math.PI) - hurtK * 0.05;
      q.body.rotation.x = -0.18 * crouch + 0.3 * pounce - 0.12 * hurtK + Math.sin(ph2 * 2) * 0.03 * gallop;
      q.body.position.z = pounce * 0.3 - crouch * 0.2;
      const look = e.state === 'chase' || e.state === 'windup' ? 0.35 : 0;
      q.neck.rotation.x = -0.25 * crouch - look * 0.5 + 0.25 * pounce + (e.state === 'idle' ? Math.sin(e.t * 1.1 + e.id) * 0.12 + 0.15 : 0) - hurtK * 0.4;
      q.head.rotation.x = 0.35 * crouch - 0.2 * pounce + (e.state === 'idle' ? Math.sin(e.t * 2.3 + e.id * 3) * 0.06 : 0) + hurtK * 0.3;
      q.head.rotation.z = (e.state === 'idle' ? Math.sin(e.t * 0.7 + e.id) * 0.1 : 0) + hurtK * 0.3 * (e.id % 2 ? 1 : -1);
      q.jaw.rotation.x = 0.9 * Math.max(pounce, windK * 0.35) + (e.state === 'chase' ? 0.15 + 0.1 * Math.sin(e.t * 8) : 0);
      for (let i = 0; i < 2; i++) { const sx = i ? 1 : -1; q.ears[i].rotation.x = -0.3 * crouch - 0.6 * pounce + 0.2 * hurtK + (e.state === 'idle' ? Math.sin(e.t * 3 + e.id + i * 2) * 0.1 : 0); q.ears[i].rotation.z = sx * (0.2 + 0.4 * (crouch + pounce)); }
      q.tail.forEach((tg, i) => { tg.rotation.y = Math.sin(e.t * (e.state === 'chase' ? 7 : 2.5) + i * 0.8) * (0.25 + i * 0.12) * (e.state === 'idle' ? 0.6 : 1); tg.rotation.x = (i === 0 ? 0.25 + spd * 0.35 - crouch * 0.6 + pounce * 0.5 : 0.08) + Math.sin(e.t * 4 + i) * 0.08; });
    }
    if (e.rig) e.rig.update(e, dt, windK, strike, hurtK, moveSp);
    if (e.flash > 0) { e.flash = Math.max(0, e.flash - dt * 7); for (const m of e.mats) { if (m.emissive) m.emissive.setRGB(e.flash * 0.9, e.flash * 0.7, e.flash * 0.5); } }
    else for (const m of e.mats) if (m.emissive && m.emissiveMap === null) m.emissive.setRGB(0, 0, 0);
  }

  function update(dt: number, t: number) {
    updateCasts(dt);
    const hero = ctx.heroPos(), alive = ctx.heroAlive();
    void t;
    for (const e of list) {
      const dHero = Math.hypot(hero.x - e.pos.x, hero.z - e.pos.z);
      const ne = e as NetE, puppet = !!ne.own && performance.now() - (ne.ownT ?? 0) < 1500 && e.alive;
      if (!puppet && ne.own) { ne.own = undefined; if (e.state !== 'dead') { e.state = 'return'; e.t = 0; } } // o dono parou de mandar: o bicho volta a ser simulado aqui
      if (!e.active) { if (dormant(e) && !puppet) continue; if (dHero < ACT && (e.alive || e.state === 'dead')) { e.active = true; build(e); } else { if (!e.alive) { e.respawn -= dt; if (e.respawn <= 0) { e.alive = true; e.hp = e.hpMax; e.state = 'idle'; e.pos.set(e.home.x, 0, e.home.y); } } continue; } }
      else if ((e as Enemy & { night?: boolean }).night && (ctx.night?.() ?? 0) < 0.4 && e.state !== 'chase' && e.state !== 'windup') { unbuild(e); e.active = false; continue; }
      else if (dHero > DEACT) { unbuild(e); e.active = false; if (e.state === 'dead') { e.respawn = Math.max(e.respawn, 1); } continue; }
      if ((e as Enemy & { kneel?: boolean }).kneel && e.alive) { e.state = 'hurt'; e.t = -9999; e.vel.set(0, 0); } /* rendido, esperando a sentença: não ataca, não anda, não levanta */
      e.t += dt;
      const D = e.def; let mv = 0;
      if (puppet && ne.np) { // outro jogador está lutando com ele: só segue o que chega pela rede (sem IA aqui)
        const p = ne.np, ox = e.pos.x, oz = e.pos.z, far = Math.hypot(p.x - ox, p.z - oz) > 8, kk = far ? 1 : Math.min(1, dt * 10);
        e.pos.x += (p.x - ox) * kk; e.pos.z += (p.z - oz) * kk; let dy = p.f - e.yaw; while (dy > Math.PI) dy -= 6.283; while (dy < -Math.PI) dy += 6.283; e.yaw += dy * Math.min(1, dt * 12);
        if (e.state !== p.s) { e.state = p.s; e.t = p.t; } mv = far ? 0 : Math.hypot(e.pos.x - ox, e.pos.z - oz) / Math.max(dt, 1e-3);
        if (e.tele) e.tele.visible = false;
      } else {
      if (e.state !== 'dead') { step(e, e.vel.x * dt, e.vel.y * dt); e.vel.multiplyScalar(Math.exp(-dt * 9)); }
      /* eventos vivos: quem tem um adversário (foe) briga com ele; só larga para vir em você se for hostil a você e você estiver em cima */
      const fo = (e as Enemy & { foe?: Foe }).foe, foeOn = !!fo && fo.alive() && (D.aggro < 0.5 || !alive || dHero > Math.min(D.aggro, 9));
      const tx = foeOn ? fo!.pos.x : hero.x, tz = foeOn ? fo!.pos.z : hero.z, dT = foeOn ? Math.hypot(tx - e.pos.x, tz - e.pos.z) : dHero, aliveT = foeOn || alive;
      switch (e.state) {
        case 'idle': {
          if (!D.passive && aliveT && dT < (foeOn ? 40 : D.aggro)) { e.state = 'chase'; e.t = 0; break; }
          if (D.passive && dHero < D.aggro) { e.state = 'flee'; e.t = 0; break; }
          e.wanderT -= dt;
          if (e.wanderT <= 0) { e.wanderT = 1.2 + Math.random() * 3; if (Math.random() < 0.8) { const a = Math.random() * 6.283, r = 2 + Math.random() * 8; e.sprint = Math.random() < 0.3 ? 1 : 0; e.wanderTo = new THREE.Vector2(e.home.x + Math.cos(a) * r, e.home.y + Math.sin(a) * r); } else e.wanderTo = null; }
          if (e.wanderTo) { const dx = e.wanderTo.x - e.pos.x, dz = e.wanderTo.y - e.pos.z, l = Math.hypot(dx, dz); if (l < 0.4) e.wanderTo = null; else { const sp = D.speed * (e.sprint ? 0.85 : 0.5); face(e, e.wanderTo.x, e.wanderTo.y, dt, 8); step(e, dx / l * sp * dt, dz / l * sp * dt); mv = sp; } }
          break;
        }
        case 'chase': {
          if (!aliveT || dT > (foeOn ? 60 : D.aggro * 1.7) || (!foeOn && Math.hypot(e.pos.x - e.home.x, e.pos.z - e.home.y) > ((e as Enemy & { leash?: number }).leash ?? 34))) { e.state = 'return'; break; }
          face(e, tx, tz, dt, 12);
          if (dT < D.range) { e.state = 'windup'; e.t = 0; break; }
          { const sp = SPELLS[e.type]; if (sp && alive && !foeOn) { e.spellCd = (e.spellCd ?? 2 + Math.random() * 3) - dt; if (e.spellCd <= 0 && dHero < 13) { e.spellCd = sp.cd[0] + Math.random() * (sp.cd[1] - sp.cd[0]); castSpell(e, sp, hero); ctx.onSpell?.(e, sp.name); e.state = 'recover'; e.t = 0; break; } } }
          const dx = tx - e.pos.x, dz = tz - e.pos.z, l = Math.hypot(dx, dz) || 1;
          const wob = l > D.range * 1.8 ? Math.sin(e.t * 4 + e.id * 2) * 0.6 : 0, burst = 1 + 0.35 * Math.max(0, Math.sin(e.t * 2.2 + e.id));
          const ux = dx / l, uz = dz / l, vx = ux - uz * wob, vz = uz + ux * wob, vl = Math.hypot(vx, vz) || 1;
          const slowK = (e.slow ?? 0) > 0 ? 0.5 : 1; if (e.slow) e.slow -= dt; if (e.root2) { e.root2 -= dt; mv = 0; break; }
          step(e, vx / vl * D.speed * burst * dt * slowK, vz / vl * D.speed * burst * dt * slowK); mv = D.speed * burst * slowK; break;
        }
        case 'windup': {
          const WU = D.windup * 1.15; // golpes 15% mais lentos: dá tempo de ler, desviar e bloquear
          const k = Math.min(1, e.t / WU);
          if (k < 0.6) face(e, tx, tz, dt, 6); // depois de 60% do preparo a mira trava: dá para sair do formato
          if (e.tele) { const sh = shapeOf(e), R0 = reachOf(e), fill = e.tele.children[0] as THREE.Mesh; e.tele.visible = true; e.tele.rotation.y = e.yaw;
            if (sh === 'circle') { e.tele.position.set(e.pos.x + Math.sin(e.yaw) * D.range * 0.6, e.pos.y + 0.08, e.pos.z + Math.cos(e.yaw) * D.range * 0.6); e.tele.scale.setScalar(R0); fill.scale.setScalar(Math.max(0.05, k)); }
            else if (sh === 'line') { e.tele.position.set(e.pos.x, e.pos.y + 0.08, e.pos.z); e.tele.scale.set((D.radius + 0.55) * 2, 1, R0); fill.scale.set(1, 1, Math.max(0.03, k)); }
            else { e.tele.position.set(e.pos.x, e.pos.y + 0.08, e.pos.z); e.tele.scale.setScalar(R0); fill.scale.setScalar(Math.max(0.05, k)); }
            (e.tele.material as THREE.MeshBasicMaterial).opacity = 0.45 + 0.55 * k; (fill.material as THREE.MeshBasicMaterial).opacity = 0.12 + 0.3 * k; }
          if (e.t >= WU) {
            if (e.tele) e.tele.visible = false;
            if (alive && D.aggro >= 0.5 && inStrike(e, hero.x, hero.z) && !ctx.heroInvuln()) ctx.damageHero(Math.round(D.dmg * (0.85 + Math.random() * 0.3)), e.pos);
            if (foeOn && inStrike(e, tx, tz)) fo!.hit(Math.round(D.dmg * (0.85 + Math.random() * 0.3)));
            e.vel.set(Math.sin(e.yaw) * 9, Math.cos(e.yaw) * 9);
            e.state = 'recover'; e.t = 0;
          }
          break;
        }
        case 'recover': if (e.t > D.cd * 0.55) { e.state = 'chase'; e.t = 0; } break;
        case 'hurt': if (e.tele) e.tele.visible = false; if (e.t > 0.35) { e.state = alive ? 'chase' : 'return'; e.t = 0; } break;
        case 'flee': {
          if (dHero > D.aggro * 1.8) { e.state = 'idle'; break; }
          const dx = e.pos.x - hero.x, dz = e.pos.z - hero.z, l = Math.hypot(dx, dz) || 1;
          face(e, e.pos.x + dx, e.pos.z + dz, dt, 12); step(e, dx / l * D.speed * dt, dz / l * D.speed * dt); mv = D.speed; break;
        }
        case 'return': {
          e.hp = Math.min(e.hpMax, e.hp + e.hpMax * 0.2 * dt);
          const dx = e.home.x - e.pos.x, dz = e.home.y - e.pos.z, l = Math.hypot(dx, dz);
          if (l < 1.2) { e.state = 'idle'; break; }
          if (alive && dHero < D.aggro * 0.6 && !D.passive) { e.state = 'chase'; break; }
          face(e, e.home.x, e.home.y, dt); step(e, dx / l * D.speed * dt, dz / l * D.speed * dt); mv = D.speed; break;
        }
        case 'dead': if (e.tele) e.tele.visible = false; if (e.t > ((e as Enemy & { corpse?: number }).corpse ?? 4)) { unbuild(e); e.active = false; (e as Enemy & { corpse?: number }).corpse = undefined; } break;
      }
      }
      e.pos.y = ctx.heightAt(e.pos.x, e.pos.z);
      if (e.root) {
        e.root.position.copy(e.pos); if (D.fly) e.root.position.y += D.fly; e.root.rotation.y = e.yaw;
        { const near = charShadow.on && dHero < 14; if (e.root.userData.sh !== near) { e.root.userData.sh = near; e.root.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh && !(m as unknown as { isSprite?: boolean }).isSprite) m.castShadow = near; }); } }
        if (e.state === 'dead') { const k = Math.min(1, e.t / 0.55); e.root.rotation.x = -k * 1.45; e.root.position.y = e.pos.y - 0.12 * k; const lim = ((e as Enemy & { corpse?: number }).corpse ?? 4) - 1; if (e.t > lim) e.root.scale.setScalar(e.def.scale * Math.max(0, 1 - (e.t - lim))); }
        else e.root.rotation.x = 0;
        animate(e, dt, mv);
        if ((e as Enemy & { yielded?: boolean }).yielded && e.alive) { e.root.rotation.x = 0.4; e.root.position.y -= 0.3 * e.def.scale; } // rendido, de joelhos
      }
    }
    separate(hero);
  }
  /* física: herói e bichos nunca ocupam o mesmo lugar, nem os bichos entre si (o herói só atravessa na investida/esquiva) */
  const HERO_R = 0.45;
  function separate(hero: THREE.Vector3) {
    const act: Enemy[] = []; for (const e of list) if (e.active && e.alive && e.state !== 'dead') act.push(e);
    const ghost = ctx.heroGhost?.() ?? false;
    for (const e of act) {
      if (!ghost) { const dx = e.pos.x - hero.x, dz = e.pos.z - hero.z, d = Math.hypot(dx, dz), m = e.def.radius * 0.8 + HERO_R;
        if (d < m) { const k = (m - d) / (d || 1); step(e, (d ? dx : Math.sin(e.yaw)) * k, (d ? dz : Math.cos(e.yaw)) * k); } }
    }
    for (let i = 0; i < act.length; i++) for (let j = i + 1; j < act.length; j++) { const a = act[i], b = act[j], dx = b.pos.x - a.pos.x, dz = b.pos.z - a.pos.z, d = Math.hypot(dx, dz), m = (a.def.radius + b.def.radius) * 0.75;
      if (d < m && d > 1e-4) { const k = (m - d) / d * 0.5; step(a, -dx * k, -dz * k); step(b, dx * k, dz * k); } }
  }

  /** inimigo vivo mais próximo de p dentro do raio */
  function nearest(p: THREE.Vector3, r: number): Enemy | null {
    let best: Enemy | null = null, bd = r;
    for (const e of list) { if (!e.alive || !e.active || (e as Enemy & { ally?: boolean }).ally) continue; const d = Math.hypot(e.pos.x - p.x, e.pos.z - p.z); if (d < bd) { bd = d; best = e; } }
    return best;
  }
  void tmp;
  /** (dev) cria um inimigo parado em (x,z) metros, sem agressividade, para inspeção */
  /** inimigo de masmorra: nasce já ativo, com nome/vida próprios, não renasce; `tag` permite limpar ao sair */
  function spawn(type: EnemyType, x: number, z: number, o: { name?: string; hpMul?: number; dmgMul?: number; scale?: number; tag?: string; lvl?: number; aggro?: number; leash?: number; net?: string } = {}) {
    const base = DEFS[type]; const def = { ...base, name: o.name ?? base.name, dmg: Math.round(base.dmg * (o.dmgMul ?? 1)), scale: base.scale * (o.scale ?? 1), lvl: o.lvl ?? base.lvl, aggro: o.aggro ?? base.aggro } as Def;
    const hp = Math.round(base.hp * HPK * (o.hpMul ?? 1));
    const e: Enemy = { id: nid++, type, def, home: new THREE.Vector2(x, z), pos: new THREE.Vector3(x, 0, z), yaw: R() * 6.28, hp, hpMax: hp, state: 'idle', t: 0, alive: true, active: false, vel: new THREE.Vector2(), root: null, pup: null, quad: null, rig: null, wanderTo: null, wanderT: 999, phase: 0, respawn: 1e9, hurtT: 0, tele: null, flash: 0, mats: [] };
    (e as Enemy & { tag?: string; leash?: number }).tag = o.tag; (e as Enemy & { leash?: number }).leash = o.leash; list.push(e);
    if (o.net) { const k = `${o.net}#${seq.get(o.net) ?? 0}`; seq.set(o.net, (seq.get(o.net) ?? 0) + 1); (e as NetE).net = k; byId.set(k, e as NetE); } // masmorra: mesma ordem de criação → mesma chave nas duas máquinas
    return e;
  }
  /** remove todos os inimigos com a etiqueta (ao sair da masmorra) */
  function clearTag(tag: string) { for (let i = list.length - 1; i >= 0; i--) { const e = list[i] as Enemy & { tag?: string }; if (e.tag === tag) { if (e.active) unbuild(e); list.splice(i, 1); const nk = (e as NetE).net; if (nk && !/^\d+$/.test(nk)) byId.delete(nk); } } seq.clear(); }
  function debugSpawn(type: EnemyType, x: number, z: number, yaw = 0, state: EState = 'idle') {
    const def = { ...DEFS[type], aggro: 0, passive: false, speed: 0 } as Def;
    const e: Enemy = { id: nid++, type, def, home: new THREE.Vector2(x, z), pos: new THREE.Vector3(x, 0, z), yaw, hp: 10, hpMax: 10, state, t: 0, alive: true, active: false, vel: new THREE.Vector2(), root: null, pup: null, quad: null, rig: null, wanderTo: null, wanderT: 999, phase: 0, respawn: 0, hurtT: 0, tele: null, flash: 0, mats: [] };
    list.push(e); return e;
  }
  /** interrompe: cancela o golpe em preparo e as magias que ele ainda está conjurando (true se havia algo para cortar) */
  function interrupt(e: Enemy) {
    let cut = e.state === 'windup';
    for (let i = casts.length - 1; i >= 0; i--) if (casts[i].src === e) { ctx.scene.remove(casts[i].m); if (casts[i].ball) ctx.scene.remove(casts[i].ball!); casts.splice(i, 1); cut = true; }
    if (e.alive) { e.state = 'hurt'; e.t = Math.min(e.t, -0.4); }
    return cut;
  }
  /* ===== jogar junto: monstros compartilhados =====
     Cada bicho do mundo tem o mesmo id em todas as máquinas. Quem está lutando com ele (o alvo dele) simula a IA
     e manda posição/estado/vida 10×/s; os outros só reproduzem. Golpes e mortes vão para todos. */
  for (const e of list) byId.set((e as NetE).net!, e as NetE);
  const DRIVE = new Set<EState>(['chase', 'windup', 'recover', 'hurt', 'flee', 'return']);
  /** os bichos que eu estou conduzindo agora (vão para a rede) */
  function netOut(): (number | string)[][] {
    const out: (number | string)[][] = [];
    for (const e of byId.values()) { if (!e.active || !e.alive || !DRIVE.has(e.state) || (e.own && performance.now() - (e.ownT ?? 0) < 1500)) continue;
      out.push([e.net!, Math.round(e.pos.x * 10) / 10, Math.round(e.pos.z * 10) / 10, Math.round(e.yaw * 100) / 100, NET_ST.indexOf(e.state), Math.max(1, Math.round(e.hp)), Math.round(e.t * 100) / 100, TYPES.indexOf(e.type)]); }
    return out;
  }
  /** chegou o estado de bichos que outro jogador conduz */
  function netIn(from: number, rows: (number | string)[][]) {
    const me = ctx.sync?.myId() ?? 0, now = performance.now();
    for (const r0 of rows) { const e = byId.get(String(r0[0])); const r = r0 as number[]; if (!e || (r[7] !== undefined && TYPES[r[7]] !== e.type)) continue; // chave igual mas bicho diferente (renascimento sorteado): ignora
      const mine = !(e.own && now - (e.ownT ?? 0) < 1500) && e.active && e.alive && DRIVE.has(e.state);
      if (mine && me && me < from) continue; // os dois brigam com o mesmo bicho: fica com quem tem o número menor (o outro cede)
      if (!e.alive) { if (e.state === 'dead' && e.t < 6) continue; e.alive = true; e.state = 'idle'; } // renasceu lá antes de renascer aqui
      e.own = from; e.ownT = now; e.np = { x: r[1], z: r[2], f: r[3], s: NET_ST[r[4]] ?? 'chase', t: r[6] }; e.hp = Math.min(e.hpMax, r[5]);
      if (!e.active) e.pos.set(r[1], e.pos.y, r[2]);
    }
  }
  /** outro jogador acertou o bicho */
  function netHit(id: string, n: number) { const e = byId.get(id); if (!e || !e.alive) return; e.hp = Math.max(1, e.hp - n); e.flash = 1; } // a morte só vem pela mensagem de quem matou
  /** outro jogador matou o bicho: devolve o bicho (para dar crédito ao grupo) ou null se aqui ele já estava morto */
  function netDie(id: string): Enemy | null { const e = byId.get(id); if (!e || !e.alive) return null; e.alive = false; e.hp = 0; e.state = 'dead'; e.t = 0; e.own = undefined; e.respawn = (e as Enemy & { tag?: string }).tag ? 1e9 : ELITE.has(e.type) ? 240 : 90; if (e.tele) e.tele.visible = false; return e; }
  /** o bicho que outro conduz soltou uma magia: o círculo aparece aqui também e machuca quem estiver dentro */
  function netCast(id: string, x: number, z: number, i: number) { const e = byId.get(id); const s = e && SPELLS[e.type]; if (!e || !s) return; addCast(e, s, x, z, i); if (i === 0) ctx.onSpell?.(e, s.name); }
  return { list, update, hurt, hurtBy, nearest, debugSpawn, spawn, clearTag, interrupt, netOut, netIn, netHit, netDie, netCast };
}
/** animação de trote/galope de um quadrúpede (usada por pets e montarias) */
export function animQuadWalk(q: Quad, ph: number, moveSp: number, t: number, seed = 0) {
  const spd = Math.min(1, moveSp / 3.2), gallop = Math.min(1, Math.max(0, (moveSp - 2.6) / 2.4));
  const A = 0.55 + 0.35 * gallop, ph2 = ph * 1.5;
  const trot = [Math.sin(ph2), Math.sin(ph2 + Math.PI), Math.sin(ph2 + Math.PI), Math.sin(ph2)];
  const gal = [Math.sin(ph2), Math.sin(ph2 + 0.5), Math.sin(ph2 + Math.PI + 0.4), Math.sin(ph2 + Math.PI + 0.9)];
  for (let i = 0; i < 4; i++) {
    const front = i < 2, sw2 = (trot[i] * (1 - gallop) + gal[i] * gallop) * spd;
    let hip = sw2 * A * (front ? 1 : 0.9), knee = Math.max(0, front ? -sw2 : sw2) * (0.9 + 0.5 * gallop) * spd + 0.12 * spd;
    if (spd < 0.05) { hip = 0; knee = 0.05; }
    q.legs[i].rotation.x = hip; q.knees[i].rotation.x = front ? knee : -knee * 0.9;
  }
  const y0 = q.body.userData.y0 ?? (q.body.userData.y0 = q.body.position.y);
  q.body.position.y = y0 + Math.abs(Math.sin(ph2)) * 0.05 * spd * (1 + gallop); q.body.rotation.x = Math.sin(ph2 * 2) * 0.03 * gallop;
  q.neck.rotation.x = spd < 0.05 ? Math.sin(t * 1.1 + seed) * 0.12 + 0.15 : -0.1; q.head.rotation.x = spd < 0.05 ? Math.sin(t * 2.3 + seed * 3) * 0.06 : 0.1; q.head.rotation.z = spd < 0.05 ? Math.sin(t * 0.7 + seed) * 0.1 : 0;
  q.jaw.rotation.x = 0.05;
  for (let i = 0; i < q.tail.length; i++) q.tail[i].rotation.x = Math.sin(t * 2.5 + i * 0.8 + seed) * 0.15 * (0.5 + spd) ; for (let i = 0; i < q.tail.length; i++) q.tail[i].rotation.z = Math.sin(t * 3.1 + i * 0.6 + seed) * 0.25;
  for (let i = 0; i < q.ears.length; i++) q.ears[i].rotation.x = Math.sin(t * 1.7 + i * 2 + seed) * 0.1;
}
/** multiplicadores de vida e golpe para um bicho no nível L (a mesma curva do mundo: mais forte por nível, e mais ainda depois do 20) */
export function lvlScale(type: EnemyType, L: number) { const dL = L - DEFS[type].lvl, hi = Math.max(0, L - 20); return { hp: Math.max(0.35, 1 + 0.12 * dL + 0.03 * hi * dL), dmg: Math.max(0.4, 1 + 0.085 * dL + 0.02 * hi * dL) }; }
