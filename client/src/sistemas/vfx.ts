/* 08/11 EFEITOS ESPECIAIS (Erling: "um trabalho MUITO BEM DETALHADO de efeitos especiais, magias, de uma forma que funcione bem e não quebre FPS,
   lembrando que precisa rodar em WebGL e WebGPU").
   Regras desta biblioteca:
   - só materiais comuns (MeshBasic, Sprite) com texturas desenhadas em canvas e soma de luz (additive): funcionam igual no WebGL e no WebGPU,
     sem shader para portar;
   - tudo vem de POOLS (os objetos já existem e só acendem): nada de criar e jogar fora geometria a cada magia;
   - um orçamento por quadro: no máximo N efeitos vivos; o mais velho sai primeiro;
   - texturas compartilhadas: um anel, uma rajada, um pilar, um círculo de runas, um raio — a cor vem do material. */
import * as THREE from 'three';
import { makeFire } from './fogo';

const ADD = THREE.AdditiveBlending;
function cv(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d')!); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
let T_FLASH: THREE.Texture, T_RING: THREE.Texture, T_PILLAR: THREE.Texture, T_RUNES: THREE.Texture, T_BOLT: THREE.Texture, T_SMOKE: THREE.Texture, T_SHARD: THREE.Texture;
function textures() {
  if (T_FLASH) return;
  T_FLASH = cv(128, 128, (g) => { const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.18, 'rgba(255,255,255,.85)'); r.addColorStop(0.45, 'rgba(255,255,255,.25)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128);
    /* quatro pontas de estrela */ g.globalCompositeOperation = 'lighter'; for (const a of [0, Math.PI / 2]) { g.save(); g.translate(64, 64); g.rotate(a); const l = g.createLinearGradient(-64, 0, 64, 0); l.addColorStop(0, 'rgba(255,255,255,0)'); l.addColorStop(0.5, 'rgba(255,255,255,.7)'); l.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = l; g.fillRect(-64, -2, 128, 4); g.restore(); } });
  T_RING = cv(256, 32, (g) => { const l = g.createLinearGradient(0, 0, 0, 32); l.addColorStop(0, 'rgba(255,255,255,0)'); l.addColorStop(0.35, 'rgba(255,255,255,1)'); l.addColorStop(0.5, 'rgba(255,255,255,.9)'); l.addColorStop(0.7, 'rgba(255,255,255,.35)'); l.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = l; g.fillRect(0, 0, 256, 32); });
  T_PILLAR = cv(64, 256, (g) => { const l = g.createLinearGradient(0, 0, 0, 256); l.addColorStop(0, 'rgba(255,255,255,0)'); l.addColorStop(0.3, 'rgba(255,255,255,.55)'); l.addColorStop(0.85, 'rgba(255,255,255,.9)'); l.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = l; g.fillRect(0, 0, 64, 256); const h = g.createLinearGradient(0, 0, 64, 0); h.addColorStop(0, 'rgba(0,0,0,1)'); h.addColorStop(0.3, 'rgba(0,0,0,0)'); h.addColorStop(0.7, 'rgba(0,0,0,0)'); h.addColorStop(1, 'rgba(0,0,0,1)'); g.globalCompositeOperation = 'destination-out'; g.fillStyle = h; g.fillRect(0, 0, 64, 256); });
  T_RUNES = cv(256, 256, (g) => { const c = 128; g.strokeStyle = '#fff'; g.lineWidth = 5; g.beginPath(); g.arc(c, c, 118, 0, 6.2832); g.stroke(); g.lineWidth = 3; g.beginPath(); g.arc(c, c, 86, 0, 6.2832); g.stroke(); g.beginPath(); g.arc(c, c, 40, 0, 6.2832); g.stroke();
    g.lineWidth = 2.5; g.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * 6.2832, b = (i + 2) / 6 * 6.2832; g.moveTo(c + Math.cos(a) * 86, c + Math.sin(a) * 86); g.lineTo(c + Math.cos(b) * 86, c + Math.sin(b) * 86); } g.stroke(); /* hexagrama */
    g.fillStyle = '#fff'; g.font = 'bold 22px serif'; g.textAlign = 'center'; const RU = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒ'; for (let i = 0; i < 18; i++) { const a = i / 18 * 6.2832; g.save(); g.translate(c + Math.cos(a) * 102, c + Math.sin(a) * 102); g.rotate(a + Math.PI / 2); g.fillText(RU[i], 0, 8); g.restore(); } });
  T_BOLT = cv(32, 256, (g) => { const l = g.createLinearGradient(0, 0, 32, 0); l.addColorStop(0, 'rgba(255,255,255,0)'); l.addColorStop(0.35, 'rgba(255,255,255,.6)'); l.addColorStop(0.5, 'rgba(255,255,255,1)'); l.addColorStop(0.65, 'rgba(255,255,255,.6)'); l.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = l; g.fillRect(0, 0, 32, 256); });
  T_SMOKE = cv(128, 128, (g) => { const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(255,255,255,.75)'); r.addColorStop(0.5, 'rgba(255,255,255,.3)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(255,255,255,${0.04 + Math.random() * 0.08})`; g.beginPath(); g.arc(20 + Math.random() * 88, 20 + Math.random() * 88, 6 + Math.random() * 16, 0, 6.2832); g.fill(); } });
  T_SHARD = cv(32, 96, (g) => { g.fillStyle = '#fff'; g.beginPath(); g.moveTo(16, 0); g.lineTo(30, 70); g.lineTo(16, 96); g.lineTo(2, 70); g.closePath(); g.fill(); g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.moveTo(16, 0); g.lineTo(30, 70); g.lineTo(16, 96); g.closePath(); g.fill(); });
}

type Kind = 'flash' | 'ring' | 'pillar' | 'runes' | 'bolt' | 'smoke' | 'shard';
interface Fx { o: THREE.Object3D; m: THREE.Material; kind: Kind; t: number; life: number; a0: number; s0: number; s1: number; y0: number; rise: number; spin: number; data?: unknown }
const MAX = 96; // efeitos vivos ao mesmo tempo (orçamento)
const live: Fx[] = [], pool: Record<Kind, Fx[]> = { flash: [], ring: [], pillar: [], runes: [], bolt: [], smoke: [], shard: [] };
let root: THREE.Group | null = null;
export function vfxAttach(scene: THREE.Scene) { if (root) return; textures(); root = new THREE.Group(); root.name = 'vfx'; scene.add(root); }
function make(kind: Kind): Fx {
  const p = pool[kind].pop(); if (p) return p;
  let o: THREE.Object3D, m: THREE.Material;
  if (kind === 'flash' || kind === 'smoke') { m = new THREE.SpriteMaterial({ map: kind === 'flash' ? T_FLASH : T_SMOKE, transparent: true, depthWrite: false, blending: kind === 'flash' ? ADD : THREE.NormalBlending, fog: false }); o = new THREE.Sprite(m as THREE.SpriteMaterial); }
  else if (kind === 'ring') { m = new THREE.MeshBasicMaterial({ map: T_RING, transparent: true, depthWrite: false, blending: ADD, fog: false, side: THREE.DoubleSide }); const g = new THREE.CylinderGeometry(1, 1, 0.22, 40, 1, true); o = new THREE.Mesh(g, m); }
  else if (kind === 'pillar') { m = new THREE.MeshBasicMaterial({ map: T_PILLAR, transparent: true, depthWrite: false, blending: ADD, fog: false, side: THREE.DoubleSide }); const g = new THREE.CylinderGeometry(0.6, 1.0, 1, 18, 1, true); g.translate(0, 0.5, 0); o = new THREE.Mesh(g, m); }
  else if (kind === 'runes') { m = new THREE.MeshBasicMaterial({ map: T_RUNES, transparent: true, depthWrite: false, blending: ADD, fog: false, side: THREE.DoubleSide }); const g = new THREE.PlaneGeometry(2, 2).rotateX(-Math.PI / 2); o = new THREE.Mesh(g, m); }
  else if (kind === 'bolt') { m = new THREE.MeshBasicMaterial({ map: T_BOLT, transparent: true, depthWrite: false, blending: ADD, fog: false, side: THREE.DoubleSide }); const g = new THREE.PlaneGeometry(1, 1, 1, 12); o = new THREE.Mesh(g, m); }
  else { m = new THREE.MeshBasicMaterial({ map: T_SHARD, transparent: true, depthWrite: false, blending: ADD, fog: false, side: THREE.DoubleSide, alphaTest: 0.1 }); const g = new THREE.PlaneGeometry(0.4, 1.2); g.translate(0, 0.6, 0); o = new THREE.Mesh(g, m); }
  o.frustumCulled = false; o.raycast = () => {}; o.userData.dyn = true;
  return { o, m, kind, t: 0, life: 1, a0: 1, s0: 1, s1: 1, y0: 0, rise: 0, spin: 0 };
}
function start(f: Fx, pos: THREE.Vector3 | { x: number; y: number; z: number }, color: number, life: number, a0: number, s0: number, s1: number, rise = 0, spin = 0) {
  if (!root) return; f.t = 0; f.life = life; f.a0 = a0; f.s0 = s0; f.s1 = s1; f.y0 = pos.y; f.rise = rise; f.spin = spin;
  f.o.position.set(pos.x, pos.y, pos.z); f.o.rotation.set(0, Math.random() * 6.283, 0); (f.m as THREE.MeshBasicMaterial).color.setHex(color); (f.m as THREE.MeshBasicMaterial).opacity = a0; f.o.scale.setScalar(s0); f.o.visible = true;
  if (!f.o.parent) root.add(f.o); live.push(f);
  while (live.length > MAX) kill(live.shift()!);
}
function kill(f: Fx) { f.o.visible = false; pool[f.kind].push(f); }

/* ---------- os efeitos ---------- */
/** clarão: estrela de luz que estoura e some (impacto, conjuração) */
export function vfxFlash(pos: THREE.Vector3, color: number, size = 2.2, life = 0.28) { if (!root) return; start(make('flash'), pos, color, life, 1, size * 0.4, size); }
/** onda de choque: anel que se abre no chão */
export function vfxRing(pos: THREE.Vector3, color: number, r1 = 4, life = 0.5, r0 = 0.4) { if (!root) return; const f = make('ring'); start(f, { x: pos.x, y: pos.y + 0.15, z: pos.z }, color, life, 0.95, r0, r1); f.o.scale.set(r0, 1, r0); }
/** pilar de luz (bênção, portal, invocação): sobe do chão e se desfaz */
export function vfxPillar(pos: THREE.Vector3, color: number, h = 6, life = 0.9, r = 1) { if (!root) return; const f = make('pillar'); start(f, pos, color, life, 0.85, r, r * 0.55); f.o.scale.set(r, h, r); f.data = h; }
/** círculo de runas no chão (conjuração): gira e some */
export function vfxRunes(pos: THREE.Vector3, color: number, r = 1.6, life = 0.8) { if (!root) return; start(make('runes'), { x: pos.x, y: pos.y + 0.08, z: pos.z }, color, life, 0.9, r * 0.6, r * 1.1, 0, 2.4); }
/** raio: uma fita quebrada em zigue-zague de a até b, com clarão nas pontas */
export function vfxBolt(a: THREE.Vector3, b: THREE.Vector3, color: number, width = 0.35, life = 0.18, jag = 0.5) { if (!root) return; const f = make('bolt'), g = (f.o as THREE.Mesh).geometry as THREE.PlaneGeometry, P = g.attributes.position as THREE.BufferAttribute;
  const d = b.clone().sub(a), L = d.length(); if (L < 0.01) return; const dir = d.clone().normalize(), side = new THREE.Vector3(0, 1, 0).cross(dir); if (side.lengthSq() < 1e-4) side.set(1, 0, 0); side.normalize(); const up = dir.clone().cross(side).normalize();
  for (let i = 0; i <= 12; i++) { const t = i / 12, k = Math.sin(t * Math.PI), jx = (Math.random() - 0.5) * jag * k, jy = (Math.random() - 0.5) * jag * k; const c = a.clone().addScaledVector(dir, L * t).addScaledVector(side, jx).addScaledVector(up, jy);
    for (let s = 0; s < 2; s++) { const v = c.clone().addScaledVector(up, (s ? 1 : -1) * width / 2); P.setXYZ(i * 2 + s, v.x, v.y, v.z); } }
  P.needsUpdate = true; g.computeBoundingSphere(); f.t = 0; f.life = life; f.a0 = 1; f.s0 = 1; f.s1 = 1; f.rise = 0; f.spin = 0; f.o.position.set(0, 0, 0); f.o.rotation.set(0, 0, 0); f.o.scale.setScalar(1); (f.m as THREE.MeshBasicMaterial).color.setHex(color); (f.m as THREE.MeshBasicMaterial).opacity = 1; f.o.visible = true; if (!f.o.parent) root.add(f.o); live.push(f);
  vfxFlash(b, color, 1.6, 0.2); }
/** fumaça / névoa que sobe (sombra, veneno, poeira): sprite que cresce e some */
export function vfxSmoke(pos: THREE.Vector3, color: number, size = 1.6, life = 1.2, rise = 0.8) { if (!root) return; start(make('smoke'), pos, color, life, 0.55, size * 0.5, size * 1.6, rise); }
/** estilhaços de gelo / cristal: lascas que brotam do chão inclinadas e somem */
export function vfxShards(pos: THREE.Vector3, color: number, n = 6, r = 1.2, h = 1.2, life = 0.7) { if (!root) return; for (let i = 0; i < n; i++) { const a = i / n * 6.283 + Math.random() * 0.6, f = make('shard'); start(f, { x: pos.x + Math.cos(a) * r * (0.5 + Math.random() * 0.5), y: pos.y, z: pos.z + Math.sin(a) * r * (0.5 + Math.random() * 0.5) }, color, life, 1, 0.2, h * (0.7 + Math.random() * 0.6)); f.o.rotation.set((Math.random() - 0.5) * 0.7, Math.random() * 6.283, (Math.random() - 0.5) * 0.7); } }

/** conjunto pronto por elemento (impacto de magia): fogo, gelo, raio, luz, sombra, arcano, veneno, terra */
export type Element = 'fire' | 'ice' | 'shock' | 'holy' | 'shadow' | 'arcane' | 'poison' | 'earth' | 'blood' | 'steam';
export const ELEMENT_COLOR: Record<Element, number> = { fire: 0xff7a1a, ice: 0x8ad8ff, shock: 0xb0e0ff, holy: 0xffe08a, shadow: 0x8a4aff, arcane: 0x9ab4ff, poison: 0x6ad83a, earth: 0xc89a5a, blood: 0xd82a3a, steam: 0xd0e8f0 };
export function vfxImpact(pos: THREE.Vector3, el: Element, k = 1) {
  const c = ELEMENT_COLOR[el];
  switch (el) {
    case 'fire': vfxFlash(pos, 0xffd27a, 2.4 * k, 0.25); vfxRing(pos, c, 3.2 * k, 0.45); vfxSmoke(new THREE.Vector3(pos.x, pos.y + 0.6, pos.z), 0x3a2a24, 1.6 * k, 1.4, 1.2); break;
    case 'ice': vfxFlash(pos, 0xe0f6ff, 1.8 * k, 0.25); vfxShards(pos, c, 7, 1.2 * k, 1.3 * k, 0.8); vfxSmoke(pos, 0xc8ecff, 1.4 * k, 0.9, 0.3); break;
    case 'shock': vfxFlash(pos, 0xffffff, 2.6 * k, 0.16); for (let i = 0; i < 3; i++) { const a = Math.random() * 6.283, r = 1.2 + Math.random() * 1.6 * k; vfxBolt(new THREE.Vector3(pos.x, pos.y + 2.5, pos.z), new THREE.Vector3(pos.x + Math.cos(a) * r, pos.y + 0.05, pos.z + Math.sin(a) * r), c, 0.22, 0.16, 0.5); } vfxRing(pos, c, 2.4 * k, 0.3); break;
    case 'holy': vfxPillar(pos, c, 5 * k, 0.9, 0.9 * k); vfxRing(pos, 0xfff0c0, 2.8 * k, 0.6); vfxFlash(new THREE.Vector3(pos.x, pos.y + 1.4, pos.z), 0xfff6d8, 2.0 * k, 0.35); break;
    case 'shadow': vfxSmoke(pos, 0x1a0a2a, 2.2 * k, 1.3, 0.5); vfxSmoke(new THREE.Vector3(pos.x, pos.y + 0.4, pos.z), c, 1.4 * k, 1.0, 0.9); vfxRing(pos, c, 2.4 * k, 0.5); break;
    case 'arcane': vfxRunes(pos, c, 1.6 * k, 0.8); vfxFlash(new THREE.Vector3(pos.x, pos.y + 1, pos.z), 0xe0ecff, 1.8 * k, 0.3); break;
    case 'poison': vfxSmoke(pos, c, 2.0 * k, 1.6, 0.4); vfxSmoke(new THREE.Vector3(pos.x + 0.5, pos.y, pos.z - 0.3), 0x2a5a1a, 1.5 * k, 1.4, 0.3); break;
    case 'earth': vfxRing(pos, c, 3.0 * k, 0.5); vfxSmoke(pos, 0x8a6a4a, 2.2 * k, 1.1, 0.5); vfxShards(pos, 0x8a7a66, 5, 1.0 * k, 0.8 * k, 0.6); break;
    case 'blood': vfxFlash(pos, 0xff4a5a, 1.6 * k, 0.2); vfxSmoke(pos, 0x6a0a14, 1.4 * k, 0.9, 0.6); break;
    case 'steam': vfxSmoke(pos, c, 2.0 * k, 1.2, 1.2); vfxSmoke(new THREE.Vector3(pos.x - 0.4, pos.y + 0.3, pos.z + 0.4), 0xffffff, 1.2 * k, 0.9, 1.6); vfxFlash(pos, 0xfff0d0, 1.2 * k, 0.15); break;
  }
}
/** círculo de conjuração aos pés de quem lança uma magia (cor da magia) */
export function vfxCast(pos: THREE.Vector3, color: number, k = 1) { vfxRunes(pos, color, 1.1 * k, 0.55); vfxFlash(new THREE.Vector3(pos.x, pos.y + 1.1, pos.z), color, 1.2 * k, 0.22); }

/* ---------- a cada quadro ---------- */
const ease = (x: number) => 1 - (1 - x) * (1 - x);
export function vfxTick(dt: number) {
  for (let i = live.length - 1; i >= 0; i--) { const f = live[i]; f.t += dt; const u = Math.min(1, f.t / f.life); if (u >= 1) { kill(f); live.splice(i, 1); continue; }
    const m = f.m as THREE.MeshBasicMaterial, e = ease(u);
    if (f.kind === 'flash') { m.opacity = f.a0 * (1 - u) * (1 - u); f.o.scale.setScalar(f.s0 + (f.s1 - f.s0) * e); }
    else if (f.kind === 'ring') { const r = f.s0 + (f.s1 - f.s0) * e; f.o.scale.set(r, 1 + u * 1.5, r); m.opacity = f.a0 * (1 - u); }
    else if (f.kind === 'pillar') { const h = f.data as number, r = f.s0 + (f.s1 - f.s0) * u; f.o.scale.set(r, h * (0.3 + 0.7 * ease(Math.min(1, u * 2.5))), r); m.opacity = f.a0 * (u < 0.25 ? u / 0.25 : 1 - (u - 0.25) / 0.75); f.o.rotation.y += dt * 0.8; }
    else if (f.kind === 'runes') { f.o.scale.setScalar(f.s0 + (f.s1 - f.s0) * e); f.o.rotation.y += dt * f.spin; m.opacity = f.a0 * (u < 0.2 ? u / 0.2 : 1 - (u - 0.2) / 0.8); }
    else if (f.kind === 'bolt') { m.opacity = u < 0.3 ? 1 : 1 - (u - 0.3) / 0.7; }
    else if (f.kind === 'smoke') { m.opacity = f.a0 * (u < 0.15 ? u / 0.15 : 1 - (u - 0.15) / 0.85); f.o.scale.setScalar(f.s0 + (f.s1 - f.s0) * e); f.o.position.y = f.y0 + f.rise * u; }
    else { m.opacity = u < 0.2 ? 1 : 1 - (u - 0.2) / 0.8; const s = f.s0 + (f.s1 - f.s0) * ease(Math.min(1, u * 3)); f.o.scale.set(0.5 + s * 0.4, s, 1); } }
}
export const vfxCount = () => live.length;

/* ---------- PROJÉTEIS POR ELEMENTO (08/11: "os projéteis antigos no sistema novo de efeitos") ----------
   Antes toda bola de magia era uma esfera clara com um halo. Agora cada elemento tem corpo próprio, feito das mesmas peças baratas:
   fogo = miolo + halo + duas chamas de cartão (as do sistema de fogo) que lambem para trás e tremulam;
   gelo = cristal (octaedro) com brilho e três estilhaços girando em volta;
   raio = miolo branco com faíscas que piscam;  sagrado = esfera dourada com anel em halo;
   sombra/arcano/veneno = miolo escuro com halo da cor e fumaça que fica para trás.
   O grupo gira sozinho (vfxProjTick); o rastro vem de vfxTrail a cada poucos quadros. */
const projGeo = { ball: new THREE.SphereGeometry(1, 10, 8), oct: new THREE.OctahedronGeometry(1, 0), ring: new THREE.TorusGeometry(1, 0.08, 6, 20) };
const projLive = new Set<THREE.Group>();
export function vfxProjectile(el: Element, r = 0.35): THREE.Group {
  const g = new THREE.Group(); const c = ELEMENT_COLOR[el]; g.userData.proj = { el, t: Math.random() * 9 }; g.userData.dyn = true;
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: T_FLASH, color: c, transparent: true, opacity: 0.55, depthWrite: false, blending: ADD, fog: false })); halo.scale.setScalar(r * 2.8); g.add(halo);
  const core = (col: number, geo: THREE.BufferGeometry, k: number, solid = false) => { const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: col, fog: false, toneMapped: false, transparent: !solid, opacity: solid ? 1 : 0.85, blending: solid ? THREE.NormalBlending : ADD, depthWrite: solid })); m.scale.setScalar(r * k); g.add(m); return m; };
  if (el === 'fire') { core(0xffd080, projGeo.ball, 0.4); for (let i = 0; i < 2; i++) { const f = makeFire(r * 2.4, i ? 'red' : 'warm', 'torch', i * 7 + 3); f.position.set(0, -r * 0.9, 0); f.userData.baseS = 1; g.add(f); } }
  else if (el === 'ice') { core(0xbfe8ff, projGeo.oct, 0.6).userData.spin = 2; for (let i = 0; i < 3; i++) { const sh = core(0xa8e0ff, projGeo.oct, 0.2); sh.userData.orbit = i / 3 * 6.283; sh.userData.orbR = r * 1.5; } }
  else if (el === 'shock') { core(0xe0f4ff, projGeo.ball, 0.3); for (let i = 0; i < 3; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: T_FLASH, color: 0xd8f0ff, transparent: true, depthWrite: false, blending: ADD, fog: false })); sp.scale.setScalar(r * 1.6); sp.userData.flick = i; g.add(sp); } }
  else if (el === 'holy') { core(0xfff0c0, projGeo.ball, 0.4); const rg = core(0xffe08a, projGeo.ring, 1.0); rg.userData.spin = 1.5; rg.rotation.x = 1.2; }
  else if (el === 'earth') { core(0x8a6a4a, projGeo.oct, 0.75, true).userData.spin = 3; const sh = core(0xc89a5a, projGeo.oct, 0.3, true); sh.userData.orbit = 1.5; sh.userData.orbR = r * 1.5; }
  else { core(el === 'blood' ? 0x5a0a12 : 0x160a24, projGeo.ball, 0.45, true); const rg = core(c, projGeo.ring, 0.8); rg.userData.spin = -2.2; rg.rotation.x = 0.8; }
  projLive.add(g); return g;
}
/** solta o grupo do projétil (devolve as chamas ao nada; o resto é lixo barato) */
export function vfxProjectileFree(g: THREE.Object3D) { projLive.delete(g as THREE.Group); g.parent?.remove(g); }
/** rastro atrás de um projétil (chame a cada ~50 ms) */
export function vfxTrail(pos: THREE.Vector3, el: Element, k = 1) {
  if (el === 'fire') vfxSmoke(pos, 0x3a2420, 0.7 * k, 0.7, 0.5); else if (el === 'ice') vfxSmoke(pos, 0xd8f0ff, 0.6 * k, 0.5, 0.2); else if (el === 'shock') vfxFlash(pos, 0xd8f0ff, 0.5 * k, 0.12);
  else if (el === 'holy') vfxFlash(pos, 0xfff0c0, 0.6 * k, 0.2); else vfxSmoke(pos, ELEMENT_COLOR[el], 0.7 * k, 0.8, 0.3);
}
export function vfxProjTick(dt: number) {
  for (const g of projLive) { if (!g.parent) { projLive.delete(g); continue; } const d = g.userData.proj as { t: number }; d.t += dt;
    for (const ch of g.children) { const u = ch.userData as { spin?: number; orbit?: number; flick?: number }; if (u.spin) { ch.rotation.y += dt * u.spin; ch.rotation.x += dt * u.spin * 0.6; }
      if (u.orbit !== undefined) { const a = u.orbit + d.t * 4, R = (u as { orbR?: number }).orbR ?? 0.5; ch.position.set(Math.cos(a) * R, Math.sin(a * 1.7) * R * 0.5, Math.sin(a) * R); ch.rotation.y += dt * 5; }
      if (u.flick !== undefined) { const on = Math.sin(d.t * 23 + u.flick * 2.1) > 0.3; ch.visible = on; ch.position.set((Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.6); } } }
}

/** o elemento mais parecido com uma cor (para magias antigas que só têm a cor do golpe) */
export function elementOf(col: number): Element { const c = new THREE.Color(col), h = { h: 0, s: 0, l: 0 }; c.getHSL(h);
  if (h.s < 0.18) return h.l > 0.6 ? 'steam' : 'shadow'; const H = h.h;
  if (H < 0.045 || H > 0.94) return h.l < 0.4 ? 'blood' : 'fire'; if (H < 0.11) return 'fire'; if (H < 0.19) return h.l > 0.6 ? 'holy' : 'earth'; if (H < 0.45) return 'poison'; if (H < 0.62) return h.l > 0.7 ? 'shock' : 'ice'; return h.l < 0.4 ? 'shadow' : 'arcane'; }
