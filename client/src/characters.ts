import * as THREE from 'three';
import { mergeStatic } from './merge3d';
import { crestTexture, facOf } from './faccoes';
import { fine } from './dual3d';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { radialTexture } from './fx3d';

/* ============================================================
   Personagens articulados: nórdica, technocrata, anão.
   Esqueleto com quadril, coluna, ombros, cotovelos, joelhos e tornozelos.
   Passada casada com a velocidade (sem patinar), postura, corrida com
   inclinação e fase aérea, dash, ataque, magia, golpe recebido.
   ============================================================ */

export type Kind = 'nordic' | 'technocrat' | 'dwarf';
export type Action = 'attack' | 'combo1' | 'combo2' | 'combo3' | 'combo4' | 'slam' | 'bash' | 'cast' | 'dash' | 'hit' | 'shoot' | 'throw' | 'jet' | 'cleave1' | 'cleave2' | 'cleave3' | 'cleave4' | 'rush' | 'quake' | 'charge' | 'drink' | 'parry' | 'dodge' | 'block' | 'chop' | 'mine' | 'skin' | 'herb' | 'kick' | 'lowcut' | 'plant' | 'breath' | 'skyraise' | 'stance' | 'dance';

export interface Hero3D {
  root: THREE.Group;
  /** mps = velocidade real em metros/segundo */
  update(dt: number, t: number, mps: number, heading: number | null): void;
  act(a: Action, force?: boolean): boolean;
  /** para a ação na hora (a dança acaba quando o jogador anda) */
  stopAct?(): void;
  /** o que aparece na mão no 'drink': caneca (padrão), frasco de poção, ou nada (comer) */
  drinkProp?: 'mug' | 'vial' | 'none';
  /** a Bobina de Choque ligada: o bracelete azul pulsando no pulso esquerdo */
  cuffOn?: boolean;
  cuffPos?(out: THREE.Vector3): THREE.Vector3;
  setAura(on: boolean): void;
  /** equipamentos visíveis: arma (nome-base), escudo e elmo, com cor/brilho pela raridade */
  setGear(g: { weapon?: { base: string; rarity: string; tint?: number; glow?: number } | null; shield?: { base: string; rarity: string; seed?: number } | null; helm?: { base: string; rarity: string } | null; cape?: { base: string; rarity: string } | null; shoulders?: { base: string; rarity: string } | null }): void;
  setNight(n: number): void;
  setWind(w: number): void;
  weaponTip(out: THREE.Vector3): THREE.Vector3;
  weaponBase(out: THREE.Vector3): THREE.Vector3;
  handPos(out: THREE.Vector3): THREE.Vector3;
  onStep?: (foot: number) => void;
  readonly kind: 'nordic' | 'technocrat' | 'dwarf';
  readonly acting: boolean;
  readonly facing: number;
  readonly stepVel: number;
  readonly actName: Action | null;
  readonly actP: number;
  guard: boolean;
  /** true quando há inimigo perto ou lutou há pouco: entra em postura de combate */
  combat: boolean;
  /** postura de batalha (posturas.ts): muda o corpo de verdade — ataque inclina e ergue a arma, tanque agacha atrás do escudo, cura abre os braços… */ stance: string;
  /** montado: pernas abertas sobre a sela, braços à frente nas rédeas */
  riding: boolean;
  /** esfera do tecnocrata: alvo no mundo (null = orbita o herói), posição atual e brilho de disparo */
  droneTo: THREE.Vector3 | null;
  dronePos(out: THREE.Vector3): THREE.Vector3;
  droneFlash: number;
  /** flash no cano do rifle (tecnocrata) */
  muzzle(): void;
  /** corte rápido da espada durante a investida (nórdica) */
  slash(): void;
  blockHit(): void;
  readonly guarding: boolean;
  freeze: boolean;
  /** ferramenta na mão fora de combate (vara de pesca, machado do lenhador): não vai para a cintura */
  holdTool: boolean;
  /** ajoelhado (esfolar, colher ervas): uma perna à frente, o joelho de trás no chão */
  kneel: boolean;
  /** nadando: corpo deitado na água, braçadas de crawl (parado: boiando, só a cabeça e os ombros de fora) */
  swim: boolean;
  scrub(a: Action, p: number): void;
  /** velocidade do combo básico (vampiro 1,45: golpes de duelista; lobisomem 1,2) */
  actSpeed: number;
}

const ramp = new THREE.DataTexture(new Uint8Array([45, 45, 45, 255, 115, 115, 115, 255, 190, 190, 190, 255, 255, 255, 255, 255]), 4, 1, THREE.RGBAFormat);
ramp.minFilter = ramp.magFilter = THREE.NearestFilter; ramp.needsUpdate = true;
const toon = (c: number, o: THREE.MeshToonMaterialParameters = {}) => new THREE.MeshToonMaterial({ color: c, gradientMap: ramp, ...o });
const OUTLINES = false;
const INK = new THREE.MeshBasicMaterial({ color: 0x07060c, side: THREE.BackSide });
const V = THREE.Vector3;

function ink(m: THREE.Mesh, w: number) {
  if (!OUTLINES) return m; void w;
  m.geometry.computeBoundingBox();
  const bb = m.geometry.boundingBox!, s = bb.getSize(new V()), c = bb.getCenter(new V());
  if (s.x < 1e-3 || s.y < 1e-3 || s.z < 1e-3) return m;
  const o = new THREE.Mesh(m.geometry, INK);
  const sx = (s.x + 2 * w) / s.x, sy = (s.y + 2 * w) / s.y, sz = (s.z + 2 * w) / s.z;
  o.scale.set(sx, sy, sz); o.position.set(c.x * (1 - sx), c.y * (1 - sy), c.z * (1 - sz));
  m.add(o); return m;
}
function mk(geo: THREE.BufferGeometry, color: number, w = 0.012, mat?: THREE.Material) {
  const m = new THREE.Mesh(geo, mat ?? toon(color)); m.castShadow = true; ink(m, w); return m;
}
const lerp = THREE.MathUtils.lerp, clamp = THREE.MathUtils.clamp;
const ease = (x: number) => x * x * (3 - 2 * x);

/** segmento de membro cônico com bola na junta de baixo */
function limb(len: number, r0: number, r1: number, color: number, joint = true) {
  const g = new THREE.Group();
  const g1 = new THREE.CylinderGeometry(r0, r1, len, 9); g1.translate(0, -len / 2, 0);
  g.add(mk(g1, color, 0.011));
  if (joint) { const s = new THREE.SphereGeometry(r1 * 1.08, 8, 6); s.translate(0, -len, 0); g.add(mk(s, color, 0.011)); }
  return g;
}

interface Spec {
  H: number; thigh: number; shin: number; ankle: number; footLen: number; footW: number; pelvisW: number;
  torso: number; shoulderW: number; neck: number; headR: number; upper: number; fore: number;
  rThigh: [number, number]; rShin: [number, number]; rUpper: [number, number]; rFore: [number, number];
  waistR: number; chestR: number; torsoDepth: number;
  stride: number; walkSpeed: number; runSpeed: number;
  A: [number, number]; K: [number, number]; armA: [number, number]; eb: [number, number];
  lean: [number, number]; bob: [number, number]; twist: [number, number]; sway: number; stomp: number;
  skin: number; pants: number; boots: number; top: number;
}

const SPECS: Record<Kind, Spec> = {
  nordic: { H: 1.92, thigh: 0.49, shin: 0.49, ankle: 0.07, footLen: 0.27, footW: 0.09, pelvisW: 0.2, torso: 0.5, shoulderW: 0.34, neck: 0.1, headR: 0.1, upper: 0.32, fore: 0.31,
    rThigh: [0.07, 0.05], rShin: [0.05, 0.038], rUpper: [0.042, 0.033], rFore: [0.034, 0.028], waistR: 0.1, chestR: 0.14, torsoDepth: 0.7,
    stride: 0.8, walkSpeed: 1.5, runSpeed: 6.2, A: [0.46, 0.95], K: [0.8, 1.8], armA: [0.5, 0.85], eb: [0.22, 1.45], lean: [0.16, 0.5], bob: [0.026, 0.065], twist: [0.14, 0.28], sway: 0.016, stomp: 0,
    skin: 0xe8c8ae, pants: 0xe8c8ae, boots: 0x3a2a1c, top: 0x2a2220 }, // guerreira: braços e pernas à mostra, harness de couro escuro
  technocrat: { H: 1.85, thigh: 0.45, shin: 0.45, ankle: 0.08, footLen: 0.29, footW: 0.11, pelvisW: 0.26, torso: 0.52, shoulderW: 0.46, neck: 0.07, headR: 0.118, upper: 0.31, fore: 0.29,
    rThigh: [0.09, 0.066], rShin: [0.064, 0.05], rUpper: [0.056, 0.045], rFore: [0.045, 0.036], waistR: 0.14, chestR: 0.2, torsoDepth: 0.78,
    stride: 0.86, walkSpeed: 1.5, runSpeed: 6.4, A: [0.44, 0.88], K: [0.7, 1.7], armA: [0.38, 0.7], eb: [0.3, 1.3], lean: [0.14, 0.42], bob: [0.02, 0.05], twist: [0.08, 0.16], sway: 0.01, stomp: 0.2,
    skin: 0xd9b08a, pants: 0x3a3028, boots: 0x4a3222, top: 0x5a3a26 },
  dwarf: { H: 1.5, thigh: 0.28, shin: 0.26, ankle: 0.07, footLen: 0.27, footW: 0.14, pelvisW: 0.34, torso: 0.5, shoulderW: 0.64, neck: 0.02, headR: 0.165, upper: 0.28, fore: 0.26,
    rThigh: [0.12, 0.09], rShin: [0.09, 0.07], rUpper: [0.08, 0.062], rFore: [0.062, 0.05], waistR: 0.23, chestR: 0.28, torsoDepth: 0.82,
    stride: 0.52, walkSpeed: 1.3, runSpeed: 5.2, A: [0.6, 1.05], K: [0.7, 1.6], armA: [0.42, 0.75], eb: [0.3, 1.35], lean: [0.16, 0.52], bob: [0.04, 0.085], twist: [0.2, 0.34], sway: 0.034, stomp: 1,
    skin: 0xd49a76, pants: 0x3a2a20, boots: 0x2a1c12, top: 0x7a2e24 },
};

/* ---------- tecido (capa/casaco) com vértices animados ---------- */
function cloth(w: number, h: number, color: number, segX = 5, segY = 9) {
  const geo = new THREE.PlaneGeometry(w, h, segX, segY); geo.translate(0, -h / 2, 0);
  const base = Float32Array.from(geo.attributes.position.array as Float32Array);
  const m = new THREE.Mesh(geo, toon(color, { side: THREE.DoubleSide })); m.castShadow = true; m.userData.dyn = true;
  return {
    mesh: m,
    update(t: number, lag: number, wind: number, flap = 1) {
      const p = geo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < p.count; i++) {
        const bx = base[i * 3], by = base[i * 3 + 1], f = clamp(-by / h, 0, 1);
        const wave = Math.sin(t * 5 + f * 5 + bx * 4) * 0.045 * f * (0.25 + lag * 1.3 + wind * 0.6) * flap;
        p.setXYZ(i, bx * (1 + f * 0.18 * lag) + wave * 0.8, by * (1 - 0.07 * lag * f), -(f * f) * (0.05 + lag * 0.42 + wind * 0.12) + wave);
      }
      p.needsUpdate = true; geo.computeVertexNormals();
    },
  };
}

/* ---------- corrente de segmentos com inércia real (cabelo, barba trançada) ----------
   Cada elo é uma mola amortecida em torno do alvo: gravidade (cai para baixo no mundo, não para trás),
   o movimento da cabeça (velocidade local do ponto de fixação, inclui giros) e um sopro de vento. */
function chain(parent: THREE.Object3D, at: [number, number, number], n: number, segLen: number, r0: number, r1: number, color: number, rest = 0.2, tieC = 0x2a2018) {
  const segs: THREE.Group[] = []; let p: THREE.Object3D = parent;
  const dark = new THREE.Color(color).multiplyScalar(0.78).getHex();
  for (let i = 0; i < n; i++) {
    const g = new THREE.Group(); g.position.set(i === 0 ? at[0] : 0, i === 0 ? at[1] : -segLen, i === 0 ? at[2] : 0);
    const r = lerp(r0, r1, i / n), r2 = lerp(r0, r1, (i + 1) / n);
    const core = new THREE.CylinderGeometry(r * 0.78, r2 * 0.78, segLen * 1.05, 6); core.translate(0, -segLen / 2, 0); g.add(mk(core, dark, 0));
    for (const k of [-1, 1]) { // dois "gomos" cruzados dão o aspecto de trança
      const e = new THREE.SphereGeometry(1, 7, 5); e.scale(r * 0.72, segLen * 0.64, r * 0.72);
      const m = mk(e, k > 0 ? color : dark, 0); m.position.set(k * r * 0.3, -segLen * 0.5, 0.0); m.rotation.z = k * 0.42; g.add(m);
    }
    if (i === n - 1) {
      const ring = mk(new THREE.TorusGeometry(r2 * 1.05, r2 * 0.34, 5, 8), tieC, 0); ring.rotation.x = Math.PI / 2; ring.position.y = -segLen * 0.78; g.add(ring);
      const tuft = new THREE.ConeGeometry(r2 * 1.5, segLen * 1.1, 6); tuft.rotateX(Math.PI); tuft.translate(0, -segLen * 1.25, 0); g.add(mk(tuft, color, 0));
    }
    p.add(g); p = g; segs.push(g);
  }
  const ax = new Float32Array(n), az = new Float32Array(n), vx = new Float32Array(n), vz = new Float32Array(n);
  const qp = new THREE.Quaternion(), pw = new THREE.Vector3(), prev = new THREE.Vector3(), vl = new THREE.Vector3(), gl = new THREE.Vector3();
  let has = false, baked = false;
  return {
    segs,
    /** congela a trança na pose de repouso e funde todos os segmentos em uma malha do osso pai */
    bake() {
      if (baked) return; baked = true;
      for (let i = 0; i < n; i++) { segs[i].rotation.x = i === 0 ? rest * 0.6 : 0; segs[i].rotation.z = 0; }
      parent.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(parent.matrixWorld).invert(); const tm = new THREE.Matrix4();
      const geos: THREE.BufferGeometry[] = []; const col = new THREE.Color();
      segs[0].traverse((o) => { const m = o as THREE.Mesh; if (!m.isMesh) return; const mat = m.material as THREE.MeshToonMaterial; const gg = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
        for (const nm of Object.keys(gg.attributes)) if (nm !== 'position' && nm !== 'normal' && nm !== 'color') gg.deleteAttribute(nm);
        if (!gg.attributes.color) { const cnt = gg.attributes.position.count, cols = new Float32Array(cnt * 3); col.copy(mat.color); for (let k = 0; k < cnt; k++) { cols[k * 3] = col.r; cols[k * 3 + 1] = col.g; cols[k * 3 + 2] = col.b; } gg.setAttribute('color', new THREE.BufferAttribute(cols, 3)); }
        gg.applyMatrix4(tm.multiplyMatrices(inv, m.matrixWorld)); geos.push(gg); });
      parent.remove(segs[0]);
      const merged = mergeGeometries(geos, false); for (const gg of geos) gg.dispose(); if (!merged) return;
      const mesh = new THREE.Mesh(merged, new THREE.MeshToonMaterial({ color: 0xffffff, vertexColors: true, gradientMap: ramp })); mesh.castShadow = true; mesh.userData.keep = true; parent.add(mesh);
    },
    update(t: number, dt: number, _back: number, wind: number, seed: number) {
      if (baked || dt <= 1e-5) return;
      segs[0].getWorldPosition(pw);
      if (!has) { prev.copy(pw); has = true; }
      vl.copy(pw).sub(prev).divideScalar(dt); prev.copy(pw);
      if (vl.length() > 14) vl.set(0, 0, 0); // teleporte
      parent.getWorldQuaternion(qp).invert(); vl.applyQuaternion(qp);
      gl.set(0, -1, 0).applyQuaternion(qp); // "para baixo" do mundo visto do referencial da cabeça
      const gx = Math.atan2(-gl.z, -gl.y), gz = Math.atan2(gl.x, -gl.y);
      const steps = Math.min(4, Math.ceil(dt / 0.016)), h = dt / steps;
      let accX = 0, accZ = 0;
      for (let i = 0; i < n; i++) {
        const root = i === 0, gain = root ? 0.032 : 0.011;
        let tx = (root ? lerp(rest, gx, 0.4) : (gx - accX) * 0.3) + vl.z * gain + vl.y * gain * 0.25 + wind * (root ? 0.05 : 0.04) + Math.sin(t * 2.3 + i * 0.8 + seed) * 0.022 * (0.5 + wind);
        let tz = (root ? gz * 0.4 : (gz - accZ) * 0.3) - vl.x * gain + Math.sin(t * 1.7 + i * 0.7 + seed * 1.3) * 0.02 * (0.5 + wind);
        const cap = root ? 0.75 : 0.42; tx = clamp(tx, -cap, cap); tz = clamp(tz, -cap, cap);
        const ks = 95 - i * 6, kd = 9;
        for (let s = 0; s < steps; s++) { vx[i] += (ks * (tx - ax[i]) - kd * vx[i]) * h; ax[i] += vx[i] * h; vz[i] += (ks * (tz - az[i]) - kd * vz[i]) * h; az[i] += vz[i] * h; }
        ax[i] = clamp(ax[i], -0.95, 0.95); az[i] = clamp(az[i], -0.95, 0.95);
        segs[i].rotation.x = ax[i]; segs[i].rotation.z = az[i];
        accX += ax[i]; accZ += az[i];
      }
    },
  };
}

function shieldTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d')!;
  // tábuas de madeira escura
  for (let i = 0; i < 8; i++) { const x = i * 32; g.fillStyle = ['#5a3b24', '#4f321e', '#62432a', '#553821'][i % 4]; g.fillRect(x, 0, 32, 256); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x, 0, 2, 256); for (let k = 0; k < 14; k++) { g.fillStyle = 'rgba(30,18,10,.25)'; g.fillRect(x + 4 + Math.random() * 22, Math.random() * 256, 1 + Math.random() * 2, 8 + Math.random() * 26); } }
  g.save(); g.beginPath(); g.arc(128, 128, 128, 0, 7); g.clip();
  // campo pintado: vermelho fosco dividido em quatro com nó celta simples
  g.fillStyle = '#7d2a22'; g.beginPath(); g.arc(128, 128, 104, 0, 7); g.fill();
  g.globalAlpha = 0.55; g.fillStyle = '#3a1410'; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(128, 128); g.arc(128, 128, 104, i * Math.PI / 2 + Math.PI / 4 - 0.02, i * Math.PI / 2 + Math.PI / 4 + Math.PI / 2 - 0.02); g.closePath(); if (i % 2 === 0) g.fill(); } g.globalAlpha = 1;
  g.strokeStyle = '#d8c9a0'; g.lineWidth = 7; g.beginPath(); g.arc(128, 128, 78, 0, 7); g.stroke();
  g.lineWidth = 5; for (let i = 0; i < 3; i++) { g.beginPath(); g.ellipse(128, 128, 90, 36, i * Math.PI / 3, 0, 7); g.stroke(); }
  g.restore();
  // aro de ferro
  g.strokeStyle = '#23262c'; g.lineWidth = 16; g.beginPath(); g.arc(128, 128, 120, 0, 7); g.stroke();
  g.strokeStyle = '#6a707a'; g.lineWidth = 3; g.beginPath(); g.arc(128, 128, 126, 0, 7); g.stroke();
  for (let i = 0; i < 16; i++) { const a2 = i / 16 * 6.283; g.fillStyle = '#9aa0aa'; g.beginPath(); g.arc(128 + Math.cos(a2) * 120, 128 + Math.sin(a2) * 120, 3, 0, 7); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/* ---------- Materiais de elmo e ombreira (Erling, 23/10: "por que capacete e ombreira BRANCOS?").
   Cor lisa em toon estourava para branco sob a lanterna do herói e nas masmorras. Agora cada peça é de um material de verdade, com textura
   pintada: ferro martelado (riscos, marcas de martelo e uma faixa gravada com nó nórdico), aço (mais claro, faixa de runas), couro (grão,
   costura e desenho em losango), bronze (trim), pele de lobo, osso e penas de falcão. Lambert, como o corpo do modelo de arte, para a luz
   cair igual no herói e no equipamento. ---------- */
export type GearKind = 'iron' | 'steel' | 'dark' | 'leather' | 'leatherD' | 'bronze' | 'gold' | 'ornate' | 'fur' | 'bone' | 'feather' | 'wool';
const GEAR_BASE: Record<GearKind, [string, string, string]> = { // fundo, sombra, luz
  iron: ['#3e4247', '#25282c', '#5a5f65'], steel: ['#4e535a', '#30343a', '#6e747c'], dark: ['#33363c', '#1e2024', '#4a4e55'],
  leather: ['#5b3a22', '#3a2414', '#7a5232'], leatherD: ['#3e2818', '#24160c', '#5a3c24'], bronze: ['#7a5a2c', '#4a3416', '#a8823e'], gold: ['#8a6a26', '#523c10', '#d0aa50'], ornate: ['#4e535a', '#30343a', '#6e747c'],
  fur: ['#5a4e40', '#38302a', '#80745e'], bone: ['#8a7e64', '#5e5440', '#a89c7c'], feather: ['#6a5a46', '#3a3026', '#8e7c62'], wool: ['#2e2824', '#1a1614', '#443a32'] };
const gearTexCache = new Map<GearKind, THREE.CanvasTexture>();
function gearTexture(k: GearKind) {
  const hit = gearTexCache.get(k); if (hit) return hit;
  const S = 128, c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d')!, [bg, dk, lt] = GEAR_BASE[k];
  let seed = k.length * 977 + 13; const R = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  g.fillStyle = bg; g.fillRect(0, 0, S, S);
  const metalish = k === 'iron' || k === 'steel' || k === 'dark' || k === 'bronze' || k === 'gold' || k === 'ornate';
  if (metalish) {
    for (let i = 0; i < 90; i++) { const x = R() * S, y = R() * S, r = 2 + R() * 6; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, R() < 0.5 ? lt + '55' : dk + '66'); gr.addColorStop(1, '#0000'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); } // marcas de martelo
    g.strokeStyle = dk + 'aa'; g.lineWidth = 0.7; for (let i = 0; i < 26; i++) { const x = R() * S, y = R() * S, a = R() * 6.28, L = 4 + R() * 14; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke(); } // riscos
    if (k === 'ornate') { // filigrana dourada: volutas em relevo por toda a peça (referência: ombreiras entalhadas)
      g.strokeStyle = '#b8923e'; g.lineWidth = 2; for (let i = 0; i < 14; i++) { const x = (i % 7) * S / 7 + S / 14, y = Math.floor(i / 7) * S * 0.22 + S * 0.08; g.beginPath(); for (let a = 0; a < 9; a += 0.25) { const r = 1 + a * 1.25; g.lineTo(x + Math.cos(a + i) * r, y + Math.sin(a + i) * r * 0.8); } g.stroke(); }
      g.strokeStyle = '#d8b45a'; g.lineWidth = 3; g.strokeRect(1.5, 1.5, S - 3, S * 0.42); }
    if (k !== 'bronze' && k !== 'gold' && k !== 'ornate') { // faixa gravada perto da borda (as calotas usam a parte de cima da textura: a borda fica em ~40% da altura)
      const y0 = S * 0.36, h = S * 0.09; g.fillStyle = dk; g.fillRect(0, y0, S, h); g.fillStyle = k === 'steel' ? '#9a7a3e' : '#7a5c30'; g.fillRect(0, y0, S, 1.5); g.fillRect(0, y0 + h - 1.5, S, 1.5);
      g.strokeStyle = k === 'steel' ? '#b8954a' : '#8e6c38'; g.lineWidth = 1.6; const n = 8, w = S / n;
      for (let i = 0; i < n; i++) { const x = i * w; g.beginPath(); g.moveTo(x, y0 + h * 0.5); g.bezierCurveTo(x + w * 0.25, y0, x + w * 0.25, y0 + h, x + w * 0.5, y0 + h * 0.5); g.bezierCurveTo(x + w * 0.75, y0, x + w * 0.75, y0 + h, x + w, y0 + h * 0.5); g.stroke(); } // nó entrelaçado
      g.strokeStyle = dk + 'cc'; g.lineWidth = 2; g.beginPath(); g.moveTo(S * 0.25, 0); g.lineTo(S * 0.25, y0); g.moveTo(S * 0.75, 0); g.lineTo(S * 0.75, y0); g.stroke(); // nervuras da calota
      g.fillStyle = lt; for (let i = 0; i < 8; i++) { g.beginPath(); g.arc(i * w + w / 2, y0 + h + 4, 1.6, 0, 7); g.fill(); } } // rebites
  } else if (k === 'leather' || k === 'leatherD') {
    for (let i = 0; i < 400; i++) { g.fillStyle = (R() < 0.5 ? dk : lt) + '44'; g.fillRect(R() * S, R() * S, 1 + R() * 2, 1); } // grão
    const y0 = S * 0.34; g.strokeStyle = dk; g.lineWidth = 1.2; for (let x = 0; x < S + 16; x += 16) { g.beginPath(); g.moveTo(x - 8, y0 - 14); g.lineTo(x, y0 - 4); g.lineTo(x + 8, y0 - 14); g.lineTo(x, y0 - 24); g.closePath(); g.stroke(); } // losangos gravados
    g.strokeStyle = '#c8a878'; g.lineWidth = 1; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(0, y0); g.lineTo(S, y0); g.moveTo(0, y0 + 6); g.lineTo(S, y0 + 6); g.stroke(); g.setLineDash([]); // costura
    g.fillStyle = dk + '88'; g.fillRect(0, y0 + 8, S, 4);
  } else if (k === 'fur' || k === 'feather') {
    for (let i = 0; i < 520; i++) { const x = R() * S, y = R() * S, L = k === 'fur' ? 3 + R() * 6 : 6 + R() * 10; g.strokeStyle = (R() < 0.45 ? dk : lt) + 'aa'; g.lineWidth = k === 'fur' ? 1 : 1.4; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (R() - 0.5) * 3, y + L); g.stroke(); }
    if (k === 'feather') { g.fillStyle = '#20180f'; for (let y = 0; y < S; y += 18) g.fillRect(0, y, S, 3); g.fillStyle = '#d8cfba'; g.fillRect(0, S * 0.9, S, S * 0.1); } // listras de falcão e ponta clara
  } else { for (let i = 0; i < 300; i++) { g.fillStyle = (R() < 0.5 ? dk : lt) + '33'; g.fillRect(R() * S, R() * S, 2, 2); } }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.NearestFilter; gearTexCache.set(k, t); return t;
}
const gearMatCache = new Map<string, THREE.MeshLambertMaterial>();
/** material de equipamento de cabeça/ombro: textura do material + leve brilho da raridade (só a borda, nada de cor berrante) */
function gearMat(k: GearKind, glow?: number, side: THREE.Side = THREE.FrontSide) {
  const key = `${k}|${glow ?? 0}|${side}`; let m = gearMatCache.get(key);
  if (!m) { m = new THREE.MeshLambertMaterial({ map: gearTexture(k), color: 0xffffff, side, emissive: glow ? new THREE.Color(glow).multiplyScalar(0.035) : new THREE.Color(0x0a0806) }); gearMatCache.set(key, m); }
  return m;
}
const gm = (geo: THREE.BufferGeometry, k: GearKind, glow?: number) => { const m = new THREE.Mesh(geo, gearMat(k, glow)); m.castShadow = true; return m; };

/* ---------- Rosto dos escudos (referências do Erling, 23/10): tábuas de madeira com veio, nós e riscos de batalha; por cima,
   conforme o estilo: madeira crua, cruz de cintas de ferro, nórdico pintado (quartos e nó), heráldico em duas cores, ou laca negra com
   emblema dourado (sol, cruz, estrela, espada, asas) para as raridades altas. ---------- */
export type ShieldStyle = 'wood' | 'bands' | 'nordic' | 'heraldic' | 'blackgold' | 'metal';
const shieldFaceCache = new Map<string, THREE.CanvasTexture>();
function shieldFace(style: ShieldStyle, seed: number) {
  const key = style + seed; const hit = shieldFaceCache.get(key); if (hit) return hit;
  const S = 256, c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d')!;
  let sd = seed * 7919 + 17; const R = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
  const woods = [['#6a4228', '#5a361f', '#784c2e', '#61402a'], ['#5a2e22', '#4e281d', '#683626', '#542c20'], ['#7a5030', '#6a4428', '#86583a', '#704a2c']][seed % 3];
  if (style === 'metal') { g.fillStyle = '#4a4f56'; g.fillRect(0, 0, S, S); for (let i = 0; i < 160; i++) { const x = R() * S, y = R() * S, r = 3 + R() * 9, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, R() < 0.5 ? '#6a7078aa' : '#2a2d32aa'); gr.addColorStop(1, '#0000'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
    g.strokeStyle = '#2a2d32'; g.lineWidth = 3; for (const r of [40, 80, 112]) { g.beginPath(); g.arc(S / 2, S / 2, r, 0, 7); g.stroke(); } }
  else { const n = 7, w = S / n; // tábuas
    for (let i = 0; i < n; i++) { g.fillStyle = woods[i % 4]; g.fillRect(i * w, 0, w, S);
      for (let k = 0; k < 14; k++) { g.strokeStyle = R() < 0.5 ? '#00000030' : '#ffffff14'; g.lineWidth = 1 + R(); g.beginPath(); const x0 = i * w + R() * w; g.moveTo(x0, 0); for (let y = 0; y <= S; y += 16) g.lineTo(x0 + Math.sin(y * 0.03 + k) * 3, y); g.stroke(); } // veio
      if (R() < 0.6) { const kx = i * w + w * (0.3 + R() * 0.4), ky = R() * S; g.fillStyle = '#2a180c'; g.beginPath(); g.ellipse(kx, ky, 3, 6, 0, 0, 7); g.fill(); g.strokeStyle = '#00000044'; g.beginPath(); g.ellipse(kx, ky, 7, 13, 0, 0, 7); g.stroke(); } // nó
      g.fillStyle = '#140a04'; g.fillRect(i * w, 0, 2.5, S); }
    g.strokeStyle = '#d8b89040'; g.lineWidth = 1.4; for (let i = 0; i < 9; i++) { const x = R() * S, y = R() * S, a = R() * 6.28, L = 12 + R() * 30; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke(); } // cortes de batalha
    if (style === 'bands') { g.fillStyle = '#2e3136'; g.fillRect(S * 0.44, 0, S * 0.12, S); g.fillRect(0, S * 0.44, S, S * 0.12); g.fillStyle = '#8a7a5a'; for (let k = 0; k < 10; k++) { g.beginPath(); g.arc(S * 0.5, k * S / 10 + 12, 3, 0, 7); g.arc(k * S / 10 + 12, S * 0.5, 3, 0, 7); g.fill(); } }
    if (style === 'nordic') { const cols = [['#7d2a22', '#1e1a18'], ['#1f3a5a', '#d8c9a0'], ['#2e4a26', '#c8a050']][seed % 3]; g.globalAlpha = 0.85;
      for (let q = 0; q < 4; q++) { g.fillStyle = cols[q % 2]; g.beginPath(); g.moveTo(S / 2, S / 2); g.arc(S / 2, S / 2, S * 0.48, q * Math.PI / 2, (q + 1) * Math.PI / 2); g.closePath(); g.fill(); }
      g.globalAlpha = 1; g.strokeStyle = '#d8c9a0'; g.lineWidth = 6; g.beginPath(); g.arc(S / 2, S / 2, S * 0.3, 0, 7); g.stroke(); g.lineWidth = 4; for (let i = 0; i < 3; i++) { g.beginPath(); g.ellipse(S / 2, S / 2, S * 0.34, S * 0.13, i * Math.PI / 3, 0, 7); g.stroke(); } }
    if (style === 'heraldic') { const cols = [['#8a1f1f', '#d8cfc4'], ['#1a2f5a', '#c8a050'], ['#2a4a2a', '#d8cfc4'], ['#4a1a4a', '#d8b45a']][seed % 4]; g.globalAlpha = 0.9;
      g.fillStyle = cols[0]; if (seed % 2) g.fillRect(0, 0, S / 2, S); else { g.beginPath(); g.moveTo(0, 0); g.lineTo(S, 0); g.lineTo(0, S); g.closePath(); g.fill(); }
      g.globalAlpha = 1; g.fillStyle = cols[1]; const cx = S / 2, cy = S * 0.42; // leão rampante estilizado não; uma flor-de-lis simples
      g.beginPath(); g.moveTo(cx, cy - 40); g.quadraticCurveTo(cx + 18, cy - 10, cx, cy + 10); g.quadraticCurveTo(cx - 18, cy - 10, cx, cy - 40); g.fill(); for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(cx, cy + 4); g.quadraticCurveTo(cx + sx * 44, cy - 24, cx + sx * 30, cy + 22); g.quadraticCurveTo(cx + sx * 16, cy + 4, cx, cy + 14); g.fill(); } g.fillRect(cx - 24, cy + 14, 48, 8); }
  }
  if (style === 'blackgold') { g.fillStyle = '#0e0d10'; g.fillRect(0, 0, S, S); for (let i = 0; i < 60; i++) { g.fillStyle = R() < 0.5 ? '#ffffff08' : '#00000040'; g.fillRect(R() * S, R() * S, 2 + R() * 30, 1); } // laca negra com arranhões
    const gold = g.createLinearGradient(0, 0, S, S); gold.addColorStop(0, '#f0d27a'); gold.addColorStop(0.5, '#b8862e'); gold.addColorStop(1, '#e8c060'); g.fillStyle = gold; g.strokeStyle = gold; const cx = S / 2, cy = S * 0.45, E = seed % 5;
    g.lineWidth = 6; g.strokeRect(10, 10, S - 20, S - 20);
    if (E === 0) { g.beginPath(); g.arc(cx, cy, 22, 0, 7); g.fill(); for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283, L = i % 2 ? 50 : 80; g.beginPath(); g.moveTo(cx + Math.cos(a - 0.08) * 26, cy + Math.sin(a - 0.08) * 26); g.lineTo(cx + Math.cos(a) * L, cy + Math.sin(a) * L); g.lineTo(cx + Math.cos(a + 0.08) * 26, cy + Math.sin(a + 0.08) * 26); g.fill(); } } // sol
    else if (E === 1) { g.fillRect(cx - 9, cy - 90, 18, 190); g.fillRect(cx - 60, cy - 40, 120, 18); for (const [x, y] of [[cx, cy - 92], [cx, cy + 100], [cx - 62, cy - 31], [cx + 62, cy - 31]]) { g.beginPath(); g.arc(x, y, 12, 0, 7); g.fill(); } } // cruz
    else if (E === 2) { for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283, L = i % 2 ? 46 : 96; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a - 0.14) * 20, cy + Math.sin(a - 0.14) * 20); g.lineTo(cx + Math.cos(a) * L, cy + Math.sin(a) * L); g.lineTo(cx + Math.cos(a + 0.14) * 20, cy + Math.sin(a + 0.14) * 20); g.fill(); } } // estrela-dos-ventos
    else if (E === 3) { g.beginPath(); g.moveTo(cx, cy - 100); g.lineTo(cx + 10, cy + 40); g.lineTo(cx - 10, cy + 40); g.closePath(); g.fill(); g.fillRect(cx - 40, cy + 40, 80, 10); g.fillRect(cx - 6, cy + 50, 12, 40); g.beginPath(); g.arc(cx, cy + 96, 10, 0, 7); g.fill(); } // espada
    else { for (const sx of [-1, 1]) for (let f = 0; f < 6; f++) { g.beginPath(); g.ellipse(cx + sx * (24 + f * 13), cy - 10 + f * 9, 9, 40 - f * 4, sx * (0.5 + f * 0.12), 0, 7); g.fill(); } g.beginPath(); g.arc(cx, cy, 16, 0, 7); g.fill(); } // asas
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; shieldFaceCache.set(key, t); return t;
}

/* ---------- IK de dois ossos (ombro→cotovelo→mão) no espaço do peito ---------- */
const IKT = { d: new THREE.Vector3(), n: new THREE.Vector3(), e: new THREE.Vector3(), x: new THREE.Vector3(), y: new THREE.Vector3(), z: new THREE.Vector3(), m: new THREE.Matrix4(), q: new THREE.Quaternion(), t: new THREE.Vector3() };
function armIK(sh: THREE.Group, el: THREE.Group, target: THREE.Vector3, a: number, b: number, pole: THREE.Vector3, k: number) {
  const S = sh.position, T = IKT.t.copy(target);
  const d = Math.min(a + b - 0.002, Math.max(0.01, S.distanceTo(T)));
  const A = Math.acos(clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1)), flex = Math.PI - Math.acos(clamp((a * a + b * b - d * d) / (2 * a * b), -1, 1));
  const dir = IKT.d.copy(T).sub(S).normalize();
  const n = IKT.n.copy(pole).addScaledVector(dir, -pole.dot(dir)); if (n.lengthSq() < 1e-6) n.set(0, -1, 0); n.normalize();
  const eDir = IKT.e.copy(dir).multiplyScalar(Math.cos(A)).addScaledVector(n, Math.sin(A)); // direção ombro→cotovelo
  const Y = IKT.y.copy(eDir).multiplyScalar(-1);
  // antebraço: do cotovelo (S + eDir*a) até T, no plano; Z do ombro = componente perpendicular a Y
  const E = IKT.z.copy(S).addScaledVector(eDir, a); const fore = E.sub(T).multiplyScalar(-1); // T - E
  const Z = fore.addScaledVector(Y, -fore.dot(Y)); if (Z.lengthSq() < 1e-6) Z.copy(n); Z.normalize();
  const X = IKT.x.copy(Y).cross(Z);
  IKT.m.makeBasis(X, Y, Z); IKT.q.setFromRotationMatrix(IKT.m);
  sh.quaternion.slerp(IKT.q, k); el.rotation.x = lerp(el.rotation.x, -flex, k); el.rotation.y = lerp(el.rotation.y, 0, k); el.rotation.z = lerp(el.rotation.z, 0, k);
}

/** sombras projetadas pelos personagens (caro: dobra os draw calls de cada um); desligado por padrão, a sombra-mancha no pé fica */
export const charShadow = { on: false };
export interface CharOpts { hair?: number; skin?: number; /** NPC: cabelo/barba sem física, fundidos no osso (menos draw calls) */ static?: boolean; /** aldeão comum (sem armas/armadura) ou elfo (orelhas pontudas, túnica verde) */ civil?: 'human' | 'elf'; /** cor da túnica/capa do civil */ cloth?: number; /** penteado (nórdica/humano/elfo) */ hairStyle?: 'braid' | 'long' | 'short' | 'bald'; /** barba: 0 nenhuma, 1 curta, 2 longa */ beard?: number; /** orelhas pontudas (elfo jogável) */ ears?: boolean }
export function createCharacter(kind: Kind, opts: CharOpts = {}): Hero3D {
  const S = { ...SPECS[kind], skin: opts.skin ?? SPECS[kind].skin };
  const root = new THREE.Group(); root.userData.kind = 'char:' + kind;
  const body = new THREE.Group(); root.add(body);
  const pelvisY = S.thigh + S.shin + S.ankle;
  const hips = new THREE.Group(); hips.position.y = pelvisY; body.add(hips);

  /* quadril / pelve */
  const pelvisGeo = new THREE.SphereGeometry(S.pelvisW * 0.62, 10, 8); pelvisGeo.scale(1.15, 0.7, 0.8);
  hips.add(mk(pelvisGeo, S.pants, 0.012));

  /* pernas */
  const mkLeg = (sx: number) => {
    const hip = new THREE.Group(); hip.position.set(sx * S.pelvisW * 0.5, 0, 0);
    hip.add(limb(S.thigh, S.rThigh[0], S.rThigh[1], S.pants));
    const knee = new THREE.Group(); knee.position.y = -S.thigh; hip.add(knee);
    knee.add(limb(S.shin, S.rShin[0], S.rShin[1], S.pants, false));
    const ankle = new THREE.Group(); ankle.position.y = -S.shin; knee.add(ankle);
    const bootG = new THREE.BoxGeometry(S.footW * 0.82, S.ankle + 0.06, S.footLen * 0.78); bootG.translate(0, -S.ankle * 0.25, S.footLen * 0.24);
    ankle.add(mk(bootG, S.boots, 0.011));
    const cuff = new THREE.CylinderGeometry(S.rShin[1] * 1.22, S.rShin[1] * 1.12, 0.1, 8); cuff.translate(0, 0.05, 0);
    ankle.add(mk(cuff, S.boots, 0.01));
    hips.add(hip);
    return { hip, knee, ankle };
  };
  const legL = mkLeg(-1), legR = mkLeg(1);

  /* coluna e tronco */
  const spine = new THREE.Group(); spine.position.y = 0.02; hips.add(spine);
  const torsoGeo = new THREE.CylinderGeometry(S.chestR, S.waistR, S.torso, 10); torsoGeo.translate(0, S.torso / 2, 0); torsoGeo.scale(1, 1, S.torsoDepth);
  const torso = mk(torsoGeo, S.top, 0.013); spine.add(torso);
  const chest = new THREE.Group(); chest.position.y = S.torso * 0.55; spine.add(chest);
  const neckG = new THREE.Group(); neckG.position.y = S.torso * 0.5 + S.neck * 0.5; chest.add(neckG);
  neckG.add(mk(new THREE.CylinderGeometry(S.headR * 0.45, S.headR * 0.55, S.neck + 0.04, 8), S.skin, 0.008));
  const head = new THREE.Group(); head.position.y = S.neck * 0.5 + S.headR * 0.8; neckG.add(head); const headRef: THREE.Group = head;
  /* suportes do equipamento do corpo: o elmo no centro da cabeça; capa e ombreiras na linha dos ombros (no modelo de arte, o skin3d os encaixa nos ossos certos) */
  const helmHolder = new THREE.Group(); head.add(helmHolder); const bodyHolder = new THREE.Group(); bodyHolder.position.y = S.torso * 0.4; chest.add(bodyHolder); let capeObj: THREE.Object3D | null = null;
  const hg = new THREE.SphereGeometry(S.headR, 12, 10); hg.scale(0.92, 1.08, 0.98);
  head.add(mk(hg, S.skin, 0.01));
  // rosto: olhos com branco e íris, pálpebra/cílio, sobrancelhas, boca, orelhas
  const eyeM = new THREE.MeshBasicMaterial({ color: 0x120c10 }), whiteM = new THREE.MeshBasicMaterial({ color: 0xf4efe6 });
  const irisC = kind === 'nordic' ? 0x3a7a5a : kind === 'technocrat' ? 0x6a8ab0 : 0x4a6a9a;
  const irisM = new THREE.MeshBasicMaterial({ color: irisC });
  for (const sx of [-1, 1]) {
    const w = new THREE.Mesh(new THREE.SphereGeometry(S.headR * 0.14, 8, 6), whiteM); w.scale.set(1.15, 1, 0.6); w.position.set(sx * S.headR * 0.38, S.headR * 0.1, S.headR * 0.9); head.add(w);
    const ir = new THREE.Mesh(new THREE.SphereGeometry(S.headR * 0.085, 7, 6), irisM); ir.position.set(sx * S.headR * 0.38, S.headR * 0.09, S.headR * 0.97); head.add(ir);
    const pu = new THREE.Mesh(new THREE.SphereGeometry(S.headR * 0.045, 6, 5), eyeM); pu.position.set(sx * S.headR * 0.38, S.headR * 0.09, S.headR * 1.02); head.add(pu);
    const lid = mk(new THREE.BoxGeometry(S.headR * 0.36, S.headR * 0.06, S.headR * 0.12), kind === 'nordic' ? 0x3a1a14 : 0x2a1a14, 0); lid.position.set(sx * S.headR * 0.38, S.headR * 0.23, S.headR * 0.93); lid.rotation.z = -sx * 0.1; head.add(lid);
    const brow = mk(new THREE.BoxGeometry(S.headR * 0.42, S.headR * 0.08, S.headR * 0.1), kind === 'nordic' ? 0x8e2a18 : 0x2a1a14, 0.004); brow.position.set(sx * S.headR * 0.38, S.headR * 0.36, S.headR * 0.9); brow.rotation.z = -sx * 0.22; head.add(brow);
    const ear = mk(new THREE.SphereGeometry(S.headR * 0.16, 6, 5), S.skin, 0); ear.scale.set(0.5, 1, 0.8); ear.position.set(sx * S.headR * 0.95, 0, -S.headR * 0.05); head.add(ear);
  }
  const nose = mk(new THREE.ConeGeometry(S.headR * 0.12, S.headR * 0.32, 5), S.skin, 0.005); nose.rotation.x = Math.PI / 2; nose.position.set(0, -S.headR * 0.1, S.headR * 1.0); if (kind !== 'dwarf') head.add(nose);
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(S.headR * 0.26, S.headR * 0.045, S.headR * 0.05), new THREE.MeshBasicMaterial({ color: 0x5a2a28 })); mouth.position.set(0, -S.headR * 0.42, S.headR * 0.93); if (kind !== 'dwarf') head.add(mouth);
  if (kind === 'nordic') { const lip = mk(new THREE.BoxGeometry(S.headR * 0.2, S.headR * 0.05, S.headR * 0.05), 0xc46a60, 0); lip.position.set(0, -S.headR * 0.48, S.headR * 0.92); head.add(lip); for (const sx of [-1, 1]) { const ch = mk(new THREE.SphereGeometry(S.headR * 0.14, 6, 5), 0xe2a898, 0); ch.scale.set(1, 0.6, 0.5); ch.position.set(sx * S.headR * 0.5, -S.headR * 0.18, S.headR * 0.8); head.add(ch); } }

  /* braços */
  const mkArm = (sx: number, sleeve: number, hand: number, metal = false) => {
    const sh = new THREE.Group(); sh.position.set(sx * S.shoulderW * 0.5, S.torso * 0.4, 0); chest.add(sh);
    const cap = new THREE.SphereGeometry(S.rUpper[0] * 1.35, 8, 6); sh.add(mk(cap, sleeve, 0.01));
    sh.add(limb(S.upper, S.rUpper[0], S.rUpper[1], sleeve));
    const el = new THREE.Group(); el.position.y = -S.upper; sh.add(el);
    el.add(limb(S.fore, S.rFore[0], S.rFore[1], metal ? sleeve : hand, false));
    const wr = new THREE.Group(); wr.position.y = -S.fore; el.add(wr);
    const hd = new THREE.SphereGeometry(S.rFore[1] * 1.5, 7, 6); wr.add(mk(hd, hand, 0.008));
    return { sh, el, wr };
  };

  /* extras por personagem */
  let armL: ReturnType<typeof mkArm>, armR: ReturnType<typeof mkArm>;
  let weaponTipObj = new THREE.Object3D(), weaponBaseObj: THREE.Object3D | null = null;
  const cloths: { u: (t: number, lag: number, wind: number) => void }[] = [];
  const chains: { update: (t: number, dt: number, back: number, wind: number, seed: number) => void; seed: number; bake?: () => void }[] = [];
  let lanternUpdate: ((t: number, speed: number, wind: number, night: number) => void) | null = null;
  let extraUpdate: ((t: number, dt: number, speed: number, night: number) => void) | null = null;
  let guardVis: ((k: number, t: number, recoil: number) => void) | null = null;
  let droneObj: THREE.Object3D | null = null, backAnchor: THREE.Group | null = null, stowed = false, rifleHolder: THREE.Group | null = null, muzzleGlow: THREE.Sprite | null = null;
  let gripR: THREE.Object3D | null = null, gripL: THREE.Object3D | null = null, rifleBack: THREE.Group | null = null, rifleStowed = false, aimRK = 0;
  let styleAtk: 'thrust' | 'chop' | 'punch' = 'thrust';
  let swordHolder: THREE.Group | null = null, shieldHolder: THREE.Group | null = null, mug: THREE.Group | null = null, vial: THREE.Group | null = null, cuff: THREE.Group | null = null, cuffMat: THREE.MeshToonMaterial | null = null;
  /* arma de fogo / besta: segura com as DUAS mãos, como o rifle do tecnocrata (23/10). A arma vive num suporte próprio na raiz;
     a mão direita vai à empunhadura e a esquerda ao guarda-mão por IK, e a arma é colocada entre as duas mãos, mirando para a frente */
  const gunHolder = new THREE.Group(); let gunK = 0, gunTip0: THREE.Object3D | null = null, gunBase0: THREE.Object3D | null = null, gunOn = false;
  let dwarfAxe: THREE.Group | null = null, dwarfDefault: THREE.Object3D[] | null = null;
  let gearSword: THREE.Group | null = null, gearShield: THREE.Group | null = null; const helmParts: THREE.Object3D[] = [];
  let weaponInner: THREE.Group | null = null, weaponRig: THREE.Group | null = null, weaponRigged = false, rigK = 0, innerRotX = 0;
  const rigPos = new THREE.Vector3(), rigDir = new THREE.Vector3(0, 0, 1), rigQ = new THREE.Quaternion(), rigTmp = new THREE.Vector3();
  let restL = { x: -0.15, z: 0.12, e: 0.3 }, restR = { x: -0.15, z: -0.12, e: 0.3 };
  let swingL = 1, swingR = 1;
  let glowMats: THREE.MeshBasicMaterial[] = [];

  const gold = 0xc8a050, steel = 0xa4abb6;
  const addLantern = (parent: THREE.Object3D, at: [number, number, number]) => {
    const g = new THREE.Group(); g.position.set(...at); parent.add(g);
    const body2 = new THREE.Group(); g.add(body2);
    const cord = mk(new THREE.CylinderGeometry(0.006, 0.006, 0.14, 4), 0x2a2018, 0.003); cord.position.y = -0.07; body2.add(cord);
    const cage = mk(new THREE.BoxGeometry(0.1, 0.16, 0.1), 0x2a2018, 0.006); cage.position.y = -0.22; body2.add(cage);
    const fm = new THREE.MeshBasicMaterial({ color: 0xffc060 });
    const flame = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.1, 0.055), fm); flame.position.y = -0.22; body2.add(flame);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTexture(64, [[0, 'rgba(255,210,130,1)'], [0.3, 'rgba(255,150,60,.4)'], [1, 'rgba(255,100,20,0)']]), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0, fog: false }));
    glow.scale.set(1.5, 1.5, 1); glow.position.y = -0.22; body2.add(glow);
    lanternUpdate = (t, speed, wind, night) => {
      body2.rotation.x = Math.sin(t * 2.1) * 0.05 + speed * 0.45 * Math.sin(t * 7) * 0.4 + speed * 0.2;
      body2.rotation.z = Math.sin(t * 1.7 + 1) * 0.07 + wind * 0.2 + speed * 0.18 * Math.sin(t * 6.3);
      const fl = 0.95 + Math.sin(t * 2.2) * 0.03;
      glow.material.opacity = night * 0.3 * fl; flame.scale.y = fl;
    };
  };

  if (kind === 'nordic') {
    const cloak = 0x232a30, fur = 0xd6c4a0, leather = 0x4a3626, hairC = opts.hair ?? 0xb33a22;
    const valk = !opts.civil; // guerreira do Norte (conceito): harness de couro cruzado com KK, barriga à mostra, braçadeiras com pele e latão, grevas de aço, saia de couro com pele
    armL = mkArm(-1, valk ? S.skin : S.top, S.skin); armR = mkArm(1, valk ? S.skin : S.top, S.skin);
    for (const a of [armL, armR]) {
      if (valk) { const br = mk(new THREE.CylinderGeometry(S.rFore[0] * 1.3, S.rFore[1] * 1.35, 0.17, 8), 0x6a4426, 0.008); br.position.y = -S.fore * 0.6; a.el.add(br); const knot = mk(new THREE.TorusGeometry(S.rFore[0] * 1.32, 0.008, 4, 10), gold, 0); knot.rotation.x = Math.PI / 2; knot.position.y = -S.fore * 0.6; a.el.add(knot); const furW = mk(new THREE.CylinderGeometry(S.rFore[1] * 1.5, S.rFore[1] * 1.4, 0.05, 8), fur, 0.004); furW.position.y = -S.fore * 0.6 - 0.1; a.el.add(furW); const furU = mk(new THREE.CylinderGeometry(S.rFore[0] * 1.45, S.rFore[0] * 1.5, 0.04, 8), fur, 0.004); furU.position.y = -S.fore * 0.6 + 0.1; a.el.add(furU); }
      else { const br = mk(new THREE.CylinderGeometry(S.rFore[0] * 1.25, S.rFore[1] * 1.2, 0.15, 8), leather, 0.008); br.position.y = -S.fore * 0.55; a.el.add(br); }
    }
    if (valk) {
      torso.material = toon(S.skin); // tronco de pele; o harness cobre só o peito
      const harn = new THREE.CylinderGeometry(S.chestR * 1.08, S.chestR * 0.98, S.torso * 0.36, 10); harn.translate(0, S.torso * 0.76, 0); harn.scale(1, 1, S.torsoDepth * 1.05); spine.add(mk(harn, 0x2a2220, 0.012));
      for (const sx of [-1, 1]) { const strap = mk(new THREE.BoxGeometry(0.045, S.torso * 0.62, 0.02), 0x5a3a26, 0.005); strap.rotation.z = sx * 0.62; strap.position.set(0, S.torso * 0.58, S.chestR * S.torsoDepth * 1.06); spine.add(strap); const back = strap.clone(); back.position.z = -S.chestR * S.torsoDepth * 1.02; spine.add(back); }
      const ring = mk(new THREE.TorusGeometry(0.03, 0.007, 4, 10), gold, 0); ring.position.set(0, S.torso * 0.6, S.chestR * S.torsoDepth * 1.1); spine.add(ring);
      for (const sx of [-1, 1]) { const k1 = mk(new THREE.BoxGeometry(0.008, 0.04, 0.006), gold, 0); k1.position.set(sx * 0.022 - 0.006, S.torso * 0.82, S.chestR * S.torsoDepth * 1.12); spine.add(k1); const k2 = mk(new THREE.BoxGeometry(0.008, 0.024, 0.006), gold, 0); k2.rotation.z = -0.8; k2.position.set(sx * 0.022 + 0.004, S.torso * 0.83, S.chestR * S.torsoDepth * 1.12); spine.add(k2); const k3 = mk(new THREE.BoxGeometry(0.008, 0.024, 0.006), gold, 0); k3.rotation.z = 0.8; k3.position.set(sx * 0.022 + 0.004, S.torso * 0.81, S.chestR * S.torsoDepth * 1.12); spine.add(k3); } // KK
      for (const lg of [legL, legR]) { const grev = mk(new THREE.CylinderGeometry(S.rShin[0] * 1.3, S.rShin[1] * 1.35, S.shin * 0.62, 8, 1, false, -1.3, 2.6), 0xb8bec6, 0.006); grev.position.y = -S.shin * 0.42; grev.rotation.y = Math.PI; lg.knee.add(grev); const gf = mk(new THREE.CylinderGeometry(S.rShin[0] * 1.5, S.rShin[0] * 1.45, 0.05, 8), fur, 0.004); gf.position.y = -S.shin * 0.1; lg.knee.add(gf); }
    } else {
      // túnica: saia curta + cinto
      const cuir = new THREE.CylinderGeometry(S.chestR * 1.07, S.waistR * 1.14, S.torso * 0.82, 10); cuir.translate(0, S.torso * 0.5, 0); cuir.scale(1, 1, S.torsoDepth * 1.04);
      spine.add(mk(cuir, leather, 0.012));
    }
    for (let i = 0; i < 6; i++) { const st = mk(new THREE.SphereGeometry(0.016, 5, 4), 0x9aa0aa, 0.0); st.position.set(-0.12 + i * 0.048, S.torso * 0.16, S.waistR * 1.14 * 0.72 + 0.012); spine.add(st); }
    // pteruges: tiras de couro individuais que acompanham o balanço das pernas, com franja de pele e tiras centrais vermelhas
    const civil = opts.civil ?? null, clothC = opts.cloth ?? (civil === 'elf' ? 0x4a7a3a : 0x6a5a48);
    const straps: { p: THREE.Group; c: number; sx: number }[] = [];
    for (const row of civil ? [] : [0, 1]) {
      const N = row ? 12 : 14;
      for (let i = 0; i < N; i++) {
        const a2 = (i / N) * Math.PI * 2 + (row ? Math.PI / N : 0), c = Math.cos(a2), sn = Math.sin(a2), center = row === 0 && (i === 0 || i === N / 2);
        const len = (row ? 0.25 : 0.34) * (center ? 1.25 : 1) * (0.92 + ((i * 7) % 5) * 0.03), wd = center ? 0.12 : 0.088;
        const R = lerp(S.waistR * 1.18, S.waistR * 1.55, Math.abs(sn));
        const g = new THREE.Group(); g.position.set(sn * R * (row ? 1.0 : 1.12), -0.01 - row * 0.015, c * R * 0.84 * (row ? 1.0 : 1.12)); g.rotation.y = a2;
        const pg = new THREE.Group(); g.add(pg);
        const col = center ? S.top : (i + row) % 2 ? 0x4a3626 : 0x5b4030;
        const bg = new THREE.BoxGeometry(wd, len, 0.014); bg.translate(0, -len / 2, 0); pg.add(mk(bg, col, 0));
        const trim = mk(new THREE.BoxGeometry(wd * 1.04, 0.022, 0.018), gold, 0); trim.position.y = -len + 0.05; pg.add(trim);
        const stud = mk(new THREE.SphereGeometry(0.012, 5, 4), steel, 0); stud.position.set(0, -len * 0.3, 0.01); pg.add(stud);
        const tuft = new THREE.SphereGeometry(1, 6, 4); tuft.scale(wd * 0.62, 0.035, 0.03); const tf = mk(tuft, fur, 0); tf.position.set(0, -len - 0.004, 0.004); pg.add(tf);
        hips.add(g); straps.push({ p: pg, c, sx: sn < 0 ? -1 : 1 });
      }
    }
    extraUpdate = (_t, dt, lag) => {
      const th = [legL.hip.rotation.x, legR.hip.rotation.x];
      for (const s of straps) {
        const leg = th[s.sx < 0 ? 0 : 1], want = Math.min(0, leg * s.c) * 1.05 - lag * 0.1 * Math.abs(s.c);
        s.p.rotation.x += (want - s.p.rotation.x) * Math.min(1, dt * 16);
      }
    };
    for (const lg of [legL, legR]) { // botas de pele: cano largo felpudo + faixas de couro
      const cuffG = new THREE.CylinderGeometry(S.rShin[1] * 1.55, S.rShin[1] * 1.3, 0.13, 9); cuffG.translate(0, 0.12, 0); lg.ankle.add(mk(cuffG, fur, 0.006));
      for (let k = 0; k < 7; k++) { const a3 = k / 7 * Math.PI * 2, tfG = new THREE.SphereGeometry(1, 5, 4); tfG.scale(0.03, 0.04, 0.03); const tf = mk(tfG, fur, 0); tf.position.set(Math.sin(a3) * S.rShin[1] * 1.55, 0.185, Math.cos(a3) * S.rShin[1] * 1.55); lg.ankle.add(tf); }
      for (let k = 0; k < 2; k++) { const w2 = mk(new THREE.CylinderGeometry(S.rShin[1] * 1.15, S.rShin[1] * 1.15, 0.02, 8), leather, 0.004); w2.position.y = 0.26 + k * 0.07; lg.ankle.add(w2); }
    }
    const skirt = new THREE.CylinderGeometry(S.waistR * 1.22, S.waistR * 1.46, 0.22, 10, 1, true); skirt.translate(0, -0.13, 0); skirt.scale(1, 1, 0.8);
    const hem = mk(new THREE.CylinderGeometry(S.waistR * 1.46, S.waistR * 1.46, 0.03, 10, 1, true), 0x8a6a30, 0.0, toon(gold, { side: THREE.DoubleSide })); hem.position.y = -0.24; hem.scale.z = 0.8; hips.add(hem);
    for (const lg of [legL, legR]) for (let i = 0; i < 4; i++) { const w = mk(new THREE.CylinderGeometry(S.rShin[0] * 1.1, S.rShin[0] * 1.1, 0.025, 8), leather, 0.004); w.position.y = -S.shin * (0.22 + i * 0.17); lg.knee.add(w); }
    if (!civil) { // ombro esquerdo (lado do escudo): manto de pele em camadas; direito: ombreira de couro com rebites
      const pl = new THREE.Group(); pl.position.set(-S.shoulderW * 0.5, S.torso * 0.5, 0); chest.add(pl);
      for (let k = 0; k < 3; k++) { const fg = new THREE.SphereGeometry(1, 7, 5); fg.scale(S.rUpper[0] * (2.9 - k * 0.5), S.rUpper[0] * 1.15, S.rUpper[0] * (2.9 - k * 0.5)); const f2 = mk(fg, k % 2 ? 0xbfae88 : fur, 0.008); f2.position.set(-0.025 * k, -0.045 * k, 0); f2.rotation.z = 0.25 + k * 0.1; pl.add(f2); }
      for (let k = 0; k < 6; k++) { const a3 = k / 6 * Math.PI * 2, tg = new THREE.ConeGeometry(0.03, 0.09, 4); tg.rotateX(Math.PI); const tc = mk(tg, fur, 0); tc.position.set(Math.cos(a3) * 0.08 - 0.05, -0.14, Math.sin(a3) * 0.07); pl.add(tc); }
      const pr = new THREE.Group(); pr.position.set(S.shoulderW * 0.5, S.torso * 0.5, 0); chest.add(pr);
      for (let k = 0; k < 3; k++) { const pg2 = new THREE.CylinderGeometry(S.rUpper[0] * (2.2 - k * 0.22), S.rUpper[0] * (2.0 - k * 0.22), 0.05, 9, 1, false, 0, Math.PI); pg2.rotateZ(Math.PI / 2); const pp = mk(pg2, k % 2 ? 0x4a3626 : 0x5b4030, 0.006); pp.position.set(0.02 * k, -0.05 * k, 0); pr.add(pp); const rv = mk(new THREE.SphereGeometry(0.011, 5, 4), steel, 0); rv.position.set(0.02 * k + S.rUpper[0] * 2.0, -0.05 * k + 0.025, 0); pr.add(rv); }
    }
    const strap = mk(new THREE.BoxGeometry(0.05, S.torso * 1.05, 0.02), leather, 0.005); strap.rotation.z = 0.62; strap.position.set(0, S.torso * 0.3, S.chestR * 0.74); chest.add(strap);
    const pouch = mk(new THREE.BoxGeometry(0.09, 0.1, 0.06), leather, 0.006); pouch.position.set(-S.pelvisW * 0.62, 0.0, 0.08); hips.add(pouch);
    hips.add(mk(skirt, valk ? 0x5b4030 : S.top, 0.01, toon(valk ? 0x5b4030 : S.top, { side: THREE.DoubleSide })));
    if (valk) { const hemF = mk(new THREE.CylinderGeometry(S.waistR * 1.5, S.waistR * 1.52, 0.05, 10, 1, true), fur, 0.004, toon(fur, { side: THREE.DoubleSide })); hemF.position.y = -0.25; hemF.scale.z = 0.8; hips.add(hemF); }
    const belt = mk(new THREE.CylinderGeometry(S.waistR * 1.12, S.waistR * 1.12, 0.07, 10), leather, 0.008); belt.scale.z = 0.8; belt.position.y = 0.04; spine.add(belt);
    const buckle = mk(new THREE.BoxGeometry(0.07, 0.06, 0.02), gold, 0.005); buckle.position.set(0, 0.04, S.waistR * 0.95); spine.add(buckle);
    // gola de pele + capa
    const furC = new THREE.TorusGeometry(S.chestR * 0.95, 0.07, 6, 12); furC.rotateX(Math.PI / 2); furC.scale(1, 1, 0.8);
    const furM = mk(furC, fur, 0.01); furM.position.y = S.torso * 0.5; void furM; // (sem gola de pele: o conceito mostra os ombros)
    // meia-capa curta (até o meio das costas), leve, presa no ombro do escudo — não desce até as pernas para não atravessar itens
    const cl = cloth(S.shoulderW * 0.9, civil ? 0.9 : 0.58, civil ? clothC : cloak, 4, 6); cl.mesh.position.set(-0.03, S.torso * 0.52, -S.chestR * 0.72); cl.mesh.rotation.y = 0.12; chest.add(cl.mesh);
    if (civil) cloths.push({ u: (t, lag, w) => cl.update(t, lag * 0.7, w * 0.6, 0.8) }); else cl.mesh.visible = false;
    // cabelo ruivo: volume no couro cabeludo, franja repartida, faixa de couro, trança alta com amarra e tranças curtas nas têmporas
    const hr = S.headR, hairD = new THREE.Color(hairC).multiplyScalar(0.72).getHex();
    const hs = opts.hairStyle ?? 'braid', bd = opts.beard ?? 0;
    const cap = new THREE.SphereGeometry(hr * 1.07, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.58); cap.scale(0.97, 1.08, 1.06); cap.translate(0, 0.014, -hr * 0.1);
    if (hs !== 'bald') head.add(mk(cap, hairC, 0.009));
    const nape = new THREE.SphereGeometry(1, 9, 7); nape.scale(hr * 0.86, hr * 0.78, hr * 0.5); const napeM = mk(nape, hairD, 0); napeM.position.set(0, hr * 0.12, -hr * 0.62); if (hs !== 'bald' && hs !== 'short') head.add(napeM); if (hs === 'long') { const mane = new THREE.SphereGeometry(1, 9, 7); mane.scale(hr * 0.95, hr * 1.5, hr * 0.5); const mm = mk(mane, hairD, 0); mm.position.set(0, -hr * 0.6, -hr * 0.7); head.add(mm); }
    for (const sx of hs === 'bald' ? [] : [-1, 1]) { // franja varrida para os lados
      const lock = new THREE.SphereGeometry(1, 8, 6); lock.scale(hr * 0.42, hr * 0.2, hr * 0.62); const lm = mk(lock, hairC, 0); lm.position.set(sx * hr * 0.42, hr * 0.56, hr * 0.62); lm.rotation.set(-0.35, sx * 0.35, sx * -0.5); head.add(lm);
      const side = new THREE.SphereGeometry(1, 7, 5); side.scale(hr * 0.2, hr * 0.5, hr * 0.42); const sm2 = mk(side, hairD, 0); sm2.position.set(sx * hr * 0.9, hr * 0.12, -hr * 0.05); head.add(sm2);
    }
    if (civil === 'elf') for (const sx of [-1, 1]) { const ear = mk(new THREE.ConeGeometry(hr * 0.16, hr * 0.7, 5), S.skin, 0.004); ear.rotation.z = sx * 1.35; ear.rotation.x = -0.2; ear.position.set(sx * hr * 1.12, hr * 0.12, 0); head.add(ear); }
    if (!civil) { const band = mk(new THREE.TorusGeometry(hr * 1.0, hr * 0.07, 5, 16), leather, 0); band.rotation.x = Math.PI / 2 - 0.12; band.position.set(0, hr * 0.5, -hr * 0.02); band.scale.set(0.98, 1.06, 1); head.add(band);
    const gem = mk(new THREE.OctahedronGeometry(hr * 0.1), gold, 0); gem.position.set(0, hr * 0.5, hr * 0.98); head.add(gem);
    const knot = mk(new THREE.TorusGeometry(hr * 0.2, hr * 0.07, 5, 8), 0x2a2018, 0); knot.position.set(0, hr * 0.62, -hr * 0.98); head.add(knot); }
    if (hs === 'braid') { const braid = chain(head, [0, hr * 0.55, -hr * 1.0], 7, 0.12, 0.048, 0.02, hairC, 0.32); chains.push({ update: braid.update, seed: 1, bake: braid.bake }); } else if (hs === 'long') { for (const sx of [-0.5, 0.5]) { const lk = chain(head, [sx * hr * 0.6, hr * 0.1, -hr * 0.95], 8, 0.1, 0.07, 0.035, hairC, 0.05); chains.push({ update: lk.update, seed: 5 + sx, bake: lk.bake }); } }
    for (const sx of hs === 'braid' || hs === 'long' ? [-1, 1] : []) { const tb = chain(head, [sx * hr * 0.95, hr * 0.15, hr * 0.12], 4, 0.085, 0.024, 0.012, hairC, 0.05); chains.push({ update: tb.update, seed: 3 + sx, bake: tb.bake }); }
    if (bd > 0) { const bb = new THREE.SphereGeometry(1, 9, 7); bb.scale(hr * 0.62, hr * (bd === 2 ? 0.5 : 0.32), hr * 0.5); const bm = mk(bb, hairD, 0.004); bm.position.set(0, -hr * 0.62, hr * 0.5); head.add(bm); if (bd === 2) { const bl = chain(head, [0, -hr * 0.75, hr * 0.55], 5, 0.09, 0.07, 0.03, hairD, 0.1); chains.push({ update: bl.update, seed: 9, bake: bl.bake }); } }
    if (opts.ears) for (const sx of [-1, 1]) { const ear = mk(new THREE.ConeGeometry(hr * 0.16, hr * 0.7, 5), S.skin, 0.004); ear.rotation.z = sx * 1.35; ear.rotation.x = -0.2; ear.position.set(sx * hr * 1.12, hr * 0.12, 0); head.add(ear); }
    if (!civil) {
    // espada na mão direita (lâmina cresce ao longo de -Y, na direção do antebraço)
    const sw = new THREE.Group();
    const grip = mk(new THREE.CylinderGeometry(0.016, 0.016, 0.17, 6), 0x3a2a1c, 0.004); grip.position.y = 0.0; sw.add(grip);
    const pom = mk(new THREE.SphereGeometry(0.034, 6, 5), gold, 0.004); pom.position.y = 0.105; sw.add(pom);
    const guardM = mk(new THREE.BoxGeometry(0.2, 0.024, 0.036), gold, 0.005); guardM.position.y = -0.1; sw.add(guardM);
    const bladeG = new THREE.BoxGeometry(0.07, 0.84, 0.016); const blade = mk(bladeG, 0xdde3ec, 0.006); blade.position.y = -0.52; sw.add(blade);
    const fuller = mk(new THREE.BoxGeometry(0.016, 0.7, 0.019), 0x8a929e, 0.0); fuller.position.y = -0.5; sw.add(fuller);
    const pt = new THREE.ConeGeometry(0.05, 0.22, 4); pt.scale(1, 1, 0.3); pt.rotateZ(Math.PI); pt.rotateY(Math.PI / 4); const ptM = mk(pt, 0xc9d0da, 0.004); ptM.position.y = -1.04; sw.add(ptM);
    const tip = new THREE.Object3D(); tip.position.y = -1.08; sw.add(tip); weaponTipObj = tip;
    const wb = new THREE.Object3D(); wb.position.y = -0.38; sw.add(wb); weaponBaseObj = wb;
    swordHolder = new THREE.Group(); swordHolder.add(sw); armR.wr.add(swordHolder); swordHolder.rotation.set(-1.9, 0, 0);
    weaponInner = sw; innerRotX = -Math.PI / 2; weaponRig = new THREE.Group(); chest.add(weaponRig); gearSword = sw;
    // escudo redondo no braço esquerdo
    const shGeo = new THREE.CylinderGeometry(0.37, 0.37, 0.055, 28); shGeo.rotateZ(Math.PI / 2);
    const shMat = [toon(0x3a2a1c), toon(0xffffff, { map: shieldTexture() }), toon(0x3a2a1c)];
    const shield = new THREE.Mesh(shGeo, shMat as unknown as THREE.Material); shield.castShadow = true; ink(shield, 0.012);
    const boss = mk(new THREE.SphereGeometry(0.09, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), 0x8b929c, 0.006); boss.rotation.z = Math.PI / 2; boss.position.x = -0.026; shield.add(boss);
    const spike = mk(new THREE.ConeGeometry(0.02, 0.07, 6), 0x9aa0aa, 0.004); spike.rotation.z = Math.PI / 2; spike.position.x = -0.12; shield.add(spike);
    const rimT = mk(new THREE.TorusGeometry(0.37, 0.016, 6, 28), 0x2a2d34, 0.006); rimT.rotation.y = Math.PI / 2; shield.add(rimT);
    const handle = mk(new THREE.BoxGeometry(0.03, 0.05, 0.22), 0x2a1c12, 0.004); handle.position.x = 0.05; shield.add(handle);
    shieldHolder = new THREE.Group(); shieldHolder.position.set(-0.08, -S.fore * 0.5, 0.06); shieldHolder.add(shield); armL.el.add(shieldHolder); gearShield = shieldHolder;
    backAnchor = new THREE.Group(); backAnchor.position.set(0.02, S.torso * 0.3, -S.chestR * 0.78 - 0.05); backAnchor.rotation.set(0.08, Math.PI / 2, 0); chest.add(backAnchor);
    shield.rotation.y = 0.0;
    } else { // túnica longa do aldeão/elfo
      const tun = new THREE.CylinderGeometry(S.waistR * 1.25, S.waistR * 1.6, 0.52, 10, 1, true); tun.translate(0, -0.28, 0); tun.scale(1, 1, 0.85); hips.add(mk(tun, clothC, 0.01, toon(clothC, { side: THREE.DoubleSide })));
      if (civil === 'elf') { const leaf = mk(new THREE.TorusGeometry(hr * 1.0, hr * 0.05, 5, 16), 0x8fd08a, 0); leaf.rotation.x = Math.PI / 2 - 0.1; leaf.position.set(0, hr * 0.5, 0); head.add(leaf); }
    }
    addLantern(hips, [S.pelvisW * 0.62, 0.0, -0.06]);
    restL = { x: -0.06, z: -0.4, e: 0.38 }; restR = { x: -0.06, z: 0.4, e: 0.42 }; // braços dobrados e um pouco afastados do corpo (ninguém anda com o braço colado)
    swingL = 0.25; swingR = 0.3; styleAtk = 'thrust';
  } else if (kind === 'technocrat') {
    /* TECNOCRATA — casaco longo de abas, arreios de couro, braço mecânico de latão com anéis de arco, reator nas costas, drone */
    const coat = 0x5a3a26, coatD = 0x7a1f2b, brassC = 0xc9973c, metalC = 0x8a5a3a, dark = 0x2a2420, glow = 0x4de3ff, leatherT = 0x3a2618, cream = 0xd8cdb0, copper = 0xb87333;
    const gm = new THREE.MeshBasicMaterial({ color: glow }); glowMats.push(gm);
    armL = mkArm(-1, coat, cream); armR = mkArm(1, metalC, metalC, true);
    // braço mecânico: carcaça de latão, pistões, anéis de energia e manopla emissora
    { const sh = mk(new THREE.SphereGeometry(S.rUpper[0] * 1.6, 9, 7), brassC, 0.008); sh.scale.set(1.1, 0.8, 1.1); sh.position.y = 0.01; armR.sh.add(sh);
      for (let i = 0; i < 3; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(S.rUpper[1] * 1.4, 0.011, 5, 12), gm); r.rotation.x = Math.PI / 2; r.position.y = -S.upper * (0.3 + i * 0.25); armR.sh.add(r); }
      for (const k of [-1, 1]) { const pis = mk(new THREE.CylinderGeometry(0.012, 0.012, S.upper * 0.7, 5), brassC, 0.003); pis.position.set(k * S.rUpper[0] * 1.1, -S.upper * 0.5, 0.02); armR.sh.add(pis); }
      const elb = mk(new THREE.SphereGeometry(S.rFore[0] * 1.5, 8, 6), brassC, 0.006); armR.el.add(elb);
      for (let i = 0; i < 2; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(S.rFore[1] * 1.5, 0.011, 5, 12), gm); r.rotation.x = Math.PI / 2; r.position.y = -S.fore * (0.3 + i * 0.35); armR.el.add(r); }
      const cuffG = new THREE.CylinderGeometry(S.rFore[1] * 1.9, S.rFore[1] * 1.6, 0.14, 8); cuffG.translate(0, -S.fore * 0.82, 0); armR.el.add(mk(cuffG, brassC, 0.006));
      const gaunt = mk(new THREE.BoxGeometry(0.11, 0.13, 0.12), dark, 0.006); gaunt.position.set(0, -0.02, 0.02); armR.wr.add(gaunt);
      for (let i = 0; i < 3; i++) { const fg = mk(new THREE.BoxGeometry(0.025, 0.09, 0.025), metalC, 0.003); fg.position.set(-0.035 + i * 0.035, -0.1, 0.05); fg.rotation.x = -0.5; armR.wr.add(fg); }
      const em = new THREE.Mesh(new THREE.OctahedronGeometry(0.035), gm); em.position.set(0, 0.02, 0.09); em.scale.set(1, 1, 1.6); armR.wr.add(em);
      const emGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTexture(64, [[0, 'rgba(140,235,255,.9)'], [1, 'rgba(60,200,255,0)']]), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.6, fog: false })); emGlow.scale.set(0.45, 0.45, 1); emGlow.position.set(0, 0.02, 0.1); armR.wr.add(emGlow);
      // RIFLE de pólvora: coronha de madeira, caixa de latão, cano longo com bandas, luneta, baioneta curta — segurado pela mão direita no punho
      const rifle = new THREE.Group();
      const stock = mk(new THREE.BoxGeometry(0.07, 0.11, 0.3), 0x5a3a22, 0.006); stock.position.set(0, -0.02, -0.26); stock.rotation.x = 0.25; rifle.add(stock);
      const recv = mk(new THREE.BoxGeometry(0.075, 0.1, 0.3), brassC, 0.006); recv.position.set(0, 0.03, 0.0); rifle.add(recv);
      const forend = mk(new THREE.BoxGeometry(0.065, 0.075, 0.42), 0x5a3a22, 0.005); forend.position.set(0, 0.0, 0.34); rifle.add(forend);
      const barrel = mk(new THREE.CylinderGeometry(0.02, 0.022, 0.95, 8), dark, 0.004); barrel.rotation.x = Math.PI / 2; barrel.position.set(0, 0.06, 0.5); rifle.add(barrel);
      for (let i = 0; i < 4; i++) { const band = mk(new THREE.TorusGeometry(0.03, 0.008, 5, 10), brassC, 0); band.position.set(0, 0.06, 0.2 + i * 0.22); rifle.add(band); }
      const muzzle = mk(new THREE.CylinderGeometry(0.034, 0.03, 0.08, 8), brassC, 0.003); muzzle.rotation.x = Math.PI / 2; muzzle.position.set(0, 0.06, 0.98); rifle.add(muzzle);
      const scope = mk(new THREE.CylinderGeometry(0.022, 0.022, 0.22, 8), dark, 0.003); scope.rotation.x = Math.PI / 2; scope.position.set(0, 0.12, 0.1); rifle.add(scope);
      const lensS = new THREE.Mesh(new THREE.CircleGeometry(0.02, 8), gm); lensS.position.set(0, 0.12, -0.012); lensS.rotation.y = Math.PI; rifle.add(lensS);
      const grip = mk(new THREE.BoxGeometry(0.05, 0.1, 0.05), 0x3a2416, 0.004); grip.position.set(0, -0.08, -0.08); grip.rotation.x = -0.3; rifle.add(grip);
      const bay = mk(new THREE.BoxGeometry(0.012, 0.03, 0.22), 0xd9dee6, 0); bay.position.set(0, 0.02, 1.08); rifle.add(bay);
      const cyl = mk(new THREE.CylinderGeometry(0.045, 0.045, 0.06, 8), brassC, 0.003); cyl.rotation.z = Math.PI / 2; cyl.position.set(0, 0.03, -0.06); rifle.add(cyl);
      const mzGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTexture(64, [[0, 'rgba(255,240,200,1)'], [0.4, 'rgba(255,170,60,.7)'], [1, 'rgba(255,120,20,0)']]), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0, fog: false })); mzGlow.scale.set(0.5, 0.5, 1); mzGlow.position.set(0, 0.06, 1.05); rifle.add(mzGlow); muzzleGlow = mzGlow;
      const tip = new THREE.Object3D(); tip.position.set(0, 0.06, 1.02); rifle.add(tip); weaponTipObj = tip;
      const wb = new THREE.Object3D(); wb.position.set(0, 0.06, 0.2); rifle.add(wb); weaponBaseObj = wb;
      // o rifle fica preso ao peito (empunhadura a duas mãos: as mãos vão até ele por IK); fora de combate vai às costas
      rifleHolder = new THREE.Group(); rifleHolder.add(rifle); rifleHolder.position.set(0.14, S.torso * 0.36, 0.22); chest.add(rifleHolder);
      gripR = new THREE.Object3D(); gripR.position.set(0.0, -0.09, -0.08); rifle.add(gripR);
      gripL = new THREE.Object3D(); gripL.position.set(-0.02, -0.03, 0.3); rifle.add(gripL);
      rifleBack = new THREE.Group(); rifleBack.position.set(0.1, S.torso * 0.25, -S.chestR * 0.95 - 0.06); rifleBack.rotation.set(0.0, 0.0, -0.95); rifleBack.rotateX(-Math.PI / 2 + 0.25); chest.add(rifleBack); }
    // luva de couro na esquerda + bastão de arco curto (ferramenta/sidearm)
    { const glove = mk(new THREE.CylinderGeometry(S.rFore[1] * 1.3, S.rFore[1] * 1.15, 0.12, 8), leatherT, 0.005); glove.position.y = -S.fore * 0.85; armL.el.add(glove);
      void 0; }
    // corpo: colete acolchoado, arreios cruzados, cinto de ferramentas, casaco com gola alta e abas
    const vest = new THREE.CylinderGeometry(S.chestR * 1.08, S.waistR * 1.12, S.torso * 0.8, 10); vest.translate(0, S.torso * 0.5, 0); vest.scale(1, 1, S.torsoDepth * 1.03); spine.add(mk(vest, coatD, 0.012));
    for (const k of [-1, 1]) { const strap = mk(new THREE.BoxGeometry(0.045, S.torso * 1.0, 0.018), leatherT, 0.004); strap.rotation.z = k * 0.5; strap.position.set(0, S.torso * 0.36, S.chestR * 0.8); chest.add(strap); }
    for (let i = 0; i < 5; i++) { const bt = mk(new THREE.SphereGeometry(0.012, 5, 4), brassC, 0); bt.position.set(0.02, S.torso * (0.12 + i * 0.15), S.waistR * 1.12 * 0.74 + 0.012); spine.add(bt); }
    const collar = new THREE.CylinderGeometry(S.chestR * 0.85, S.chestR * 1.0, 0.11, 10, 1, true, Math.PI * 0.6, Math.PI * 1.8); const colM = mk(collar, coat, 0.006, toon(coat, { side: THREE.DoubleSide })); colM.position.y = S.torso * 0.52; colM.scale.z = 0.85; chest.add(colM);
    for (const k of [-1, 1]) { // ombreiras (dragonas) de latão
      const ep = mk(new THREE.BoxGeometry(0.1, 0.03, 0.09), brassC, 0.005); ep.position.set(k * S.shoulderW * 0.5, S.torso * 0.52, 0); chest.add(ep);
      const fr = mk(new THREE.CylinderGeometry(0.05, 0.05, 0.04, 8), coatD, 0.004); fr.position.set(k * S.shoulderW * 0.55, S.torso * 0.47, 0); chest.add(fr); }
    const belt = mk(new THREE.CylinderGeometry(S.waistR * 1.14, S.waistR * 1.14, 0.08, 10), leatherT, 0.008); belt.scale.z = 0.8; belt.position.y = 0.05; spine.add(belt);
    const bk = mk(new THREE.TorusGeometry(0.035, 0.012, 5, 8), brassC, 0.004); bk.position.set(0, 0.05, S.waistR * 0.93); spine.add(bk); // fivela-engrenagem
    for (let i = 0; i < 8; i++) { const tooth = mk(new THREE.BoxGeometry(0.012, 0.012, 0.012), brassC, 0); const a3 = i / 8 * Math.PI * 2; tooth.position.set(Math.cos(a3) * 0.047, Math.sin(a3) * 0.047, 0); bk.add(tooth); }
    for (let i = 0; i < 6; i++) { const ch = mk(new THREE.SphereGeometry(0.008, 4, 3), brassC, 0); const u = i / 5; ch.position.set(-0.02 - u * 0.11, S.torso * 0.22 - Math.sin(u * Math.PI) * 0.05, S.waistR * 1.12 * 0.75 + 0.01); spine.add(ch); } // corrente do relógio
    const watch = mk(new THREE.CylinderGeometry(0.022, 0.022, 0.012, 10), brassC, 0); watch.rotation.x = Math.PI / 2; watch.position.set(-0.13, S.torso * 0.2, S.waistR * 1.12 * 0.75 + 0.012); spine.add(watch);
    for (let i = 0; i < 3; i++) { const tl = mk(new THREE.BoxGeometry(0.045, 0.11, 0.045), i === 1 ? brassC : metalC, 0.004); tl.position.set(-0.12 + i * 0.06, -0.03, S.waistR * 0.95); spine.add(tl); }
    const pouch = mk(new THREE.BoxGeometry(0.1, 0.11, 0.06), leatherT, 0.005); pouch.position.set(S.pelvisW * 0.7, -0.01, 0.04); hips.add(pouch);
    // casaco: abas traseiras divididas + abas frontais curtas
    for (const k of [-1, 1]) { const tail = cloth(S.shoulderW * 0.5, 0.82, coat, 3, 8); tail.mesh.position.set(k * S.shoulderW * 0.26, 0.02, -S.waistR * 0.78); tail.mesh.rotation.y = k * 0.22; hips.add(tail.mesh); cloths.push({ u: (t, lag, w) => tail.update(t + k, lag, w, 0.8) }); }
    for (const k of [-1, 1]) { const fl = cloth(S.shoulderW * 0.36, 0.42, coat, 2, 5); fl.mesh.position.set(k * S.waistR * 0.72, 0.0, S.waistR * 0.74); fl.mesh.rotation.y = k * 0.45 + Math.PI; hips.add(fl.mesh); cloths.push({ u: (t, lag, w) => fl.update(t + 2 * k, lag * 0.5, w * 0.3, 0.5) }); }
    // pernas: joelheiras de latão, botas altas com fivelas
    for (const lg of [legL, legR]) { const kp = mk(new THREE.SphereGeometry(S.rShin[0] * 1.3, 7, 5), brassC, 0.005); kp.scale.set(1, 0.8, 0.8); kp.position.set(0, 0.0, S.rShin[0] * 0.5); lg.knee.add(kp);
      const bt = new THREE.CylinderGeometry(S.rShin[1] * 1.12, S.rShin[1] * 1.22, S.shin * 0.5, 8); bt.translate(0, S.shin * 0.27, 0); lg.ankle.add(mk(bt, 0x4a3222, 0.008));
      for (let i = 0; i < 3; i++) { const strap = mk(new THREE.CylinderGeometry(S.rShin[1] * 1.26, S.rShin[1] * 1.26, 0.018, 8), leatherT, 0); strap.position.y = 0.08 + i * 0.1; lg.ankle.add(strap); const bu = mk(new THREE.BoxGeometry(0.028, 0.022, 0.012), brassC, 0); bu.position.set(S.rShin[1] * 1.22, 0.08 + i * 0.1, 0); lg.ankle.add(bu); } }
    // reator nas costas: cilindro com janela de energia, dois escapes e antena
    const pack = new THREE.Group(); pack.position.set(0, S.torso * 0.4, -S.chestR * 0.95); chest.add(pack);
    const pc = mk(new THREE.CylinderGeometry(0.11, 0.12, 0.36, 10), copper, 0.01); pack.add(pc);
    for (let i = 0; i < 3; i++) { const bd = mk(new THREE.TorusGeometry(0.115, 0.012, 5, 12), brassC, 0.003); bd.rotation.x = Math.PI / 2; bd.position.y = -0.14 + i * 0.14; pack.add(bd); }
    const win = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.125, 0.06, 10), gm); win.position.y = 0.0; pack.add(win);
    for (const k of [-1, 1]) { const gauge = mk(new THREE.CylinderGeometry(0.03, 0.03, 0.015, 10), brassC, 0); gauge.rotation.x = Math.PI / 2; gauge.position.set(k * 0.07, 0.12, -0.12); pack.add(gauge); const face = new THREE.Mesh(new THREE.CircleGeometry(0.022, 10), new THREE.MeshBasicMaterial({ color: 0xf0e8d0 })); face.position.set(k * 0.07, 0.12, -0.13); face.rotation.y = Math.PI; pack.add(face); }
    const pipe = mk(new THREE.TorusGeometry(0.09, 0.012, 5, 12, Math.PI), copper, 0); pipe.position.set(0, -0.1, -0.1); pipe.rotation.y = Math.PI / 2; pack.add(pipe);
    for (const k of [-1, 1]) { const ex = mk(new THREE.CylinderGeometry(0.025, 0.03, 0.2, 6), dark, 0.004); ex.position.set(k * 0.13, 0.05, -0.02); pack.add(ex); }
    const ant1 = mk(new THREE.CylinderGeometry(0.006, 0.006, 0.42, 4), steel, 0.002); ant1.position.set(0.06, 0.38, -0.04); pack.add(ant1);
    const antTip = new THREE.Mesh(new THREE.SphereGeometry(0.014, 6, 5), gm); antTip.position.y = 0.21; ant1.add(antTip);
    const ringBack = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.01, 5, 20), gm); ringBack.position.set(0, 0.0, -0.09); pack.add(ringBack);
    // cabeça: cabelo escuro penteado para trás com laterais raspadas, óculos de latão na testa, cachecol
    const cap = new THREE.SphereGeometry(S.headR * 1.05, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5); cap.scale(0.82, 1.1, 1.08); cap.translate(0, 0.012, -0.03); head.add(mk(cap, 0x171a22, 0.008));
    const crest = new THREE.SphereGeometry(1, 8, 6); crest.scale(S.headR * 0.42, S.headR * 0.32, S.headR * 0.9); const crM = mk(crest, 0x171a22, 0); crM.position.set(0, S.headR * 0.78, -S.headR * 0.1); crM.rotation.x = 0.35; head.add(crM);
    const gog = mk(new THREE.BoxGeometry(S.headR * 1.75, S.headR * 0.36, S.headR * 0.3), leatherT, 0.005); gog.position.set(0, S.headR * 0.42, S.headR * 0.72); gog.rotation.x = -0.3; head.add(gog);
    for (const sx of [-1, 1]) { const rim2 = mk(new THREE.TorusGeometry(S.headR * 0.2, S.headR * 0.05, 5, 12), brassC, 0); rim2.position.set(sx * S.headR * 0.4, S.headR * 0.44, S.headR * 0.9); rim2.rotation.x = -0.3; head.add(rim2); const lens = new THREE.Mesh(new THREE.CircleGeometry(S.headR * 0.16, 10), gm); lens.position.set(sx * S.headR * 0.4, S.headR * 0.44, S.headR * 0.92); lens.rotation.x = -0.3; head.add(lens); }
    const scarf = mk(new THREE.TorusGeometry(S.headR * 0.55, S.headR * 0.22, 6, 12), cream, 0.005); scarf.rotation.x = Math.PI / 2; scarf.position.y = S.torso * 0.5 + S.neck * 0.5; scarf.scale.set(1, 1, 0.8); chest.add(scarf);
    // campo de força: placa hexagonal de energia à frente, visível só na guarda
    { const hexTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d')!; g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 2; const r = 11; for (let y = -1; y < 8; y++) for (let x = -1; x < 8; x++) { const cx = x * r * 1.74 + (y % 2 ? r * 0.87 : 0), cy = y * r * 1.5; g.beginPath(); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + Math.PI / 6; g[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * r, cy + Math.sin(a) * r); } g.closePath(); g.stroke(); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 3); return t; })();
      const bm = new THREE.MeshBasicMaterial({ color: 0x8af0ff, map: hexTex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
      const barrier = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 2.1, 1, 1), bm); barrier.position.set(0.05, 1.05, 0.85); root.add(barrier);
      const bFill = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 2.1), new THREE.MeshBasicMaterial({ color: 0x2a9ad0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false })); bFill.position.z = -0.01; barrier.add(bFill);
      guardVis = (k, t, rc) => { bm.opacity = k * (0.55 + 0.25 * Math.sin(t * 9) + rc * 0.6); (bFill.material as THREE.MeshBasicMaterial).opacity = k * (0.18 + rc * 0.5); barrier.scale.setScalar(0.6 + 0.4 * k + rc * 0.1); hexTex.offset.y = -t * 0.3; barrier.visible = k > 0.02; }; }
    // ESFERA de engenharia: casco de latão com placas, anel giratório, olho-lente, pequenos propulsores; voa até alvos do gameplay
    const drone = new THREE.Group(); droneObj = drone;
    const shell = mk(new THREE.IcosahedronGeometry(0.13, 1), 0x4a5866, 0.01); drone.add(shell);
    for (let i = 0; i < 6; i++) { const pl = mk(new THREE.BoxGeometry(0.07, 0.05, 0.02), brassC, 0); const a3 = i / 6 * Math.PI * 2; pl.position.set(Math.cos(a3) * 0.12, Math.sin(a3) * 0.12, 0.0); pl.rotation.z = a3; drone.add(pl); }
    const eyeRing = mk(new THREE.TorusGeometry(0.055, 0.012, 5, 12), brassC, 0); eyeRing.position.z = 0.12; drone.add(eyeRing);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), gm); eye.position.z = 0.125; drone.add(eye);
    const dring = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.01, 5, 20), gm); dring.rotation.x = Math.PI / 2; drone.add(dring);
    const dring2 = mk(new THREE.TorusGeometry(0.2, 0.018, 5, 20), metalC, 0); dring2.rotation.x = Math.PI / 2; drone.add(dring2);
    for (const k of [-1, 1]) { const th = mk(new THREE.CylinderGeometry(0.02, 0.03, 0.06, 6), dark, 0); th.position.set(k * 0.1, -0.11, -0.03); drone.add(th); const fl = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.07, 6), gm); fl.rotation.x = Math.PI; fl.position.set(k * 0.1, -0.17, -0.03); drone.add(fl); }
    const dGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTexture(64, [[0, 'rgba(120,230,255,.7)'], [1, 'rgba(60,200,255,0)']]), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.6, fog: false })); dGlow.scale.set(1.3, 1.3, 1); drone.add(dGlow);
    root.add(drone);
    const dLocal = new THREE.Vector3(), dVel = new THREE.Vector3();
    extraUpdate = (t, dt, speed, night) => {
      // alvo local: ponto do mundo levado ao referencial do herói (só há rotação em Y)
      if (hero.droneTo) { dLocal.copy(hero.droneTo).sub(root.position); const c = Math.cos(-root.rotation.y), sn = Math.sin(-root.rotation.y); const x = dLocal.x * c - dLocal.z * sn, z = dLocal.x * sn + dLocal.z * c; dLocal.set(x, Math.max(1.4, dLocal.y), z); }
      else dLocal.set(0.55 + Math.sin(t * 0.9) * 0.12, S.H * 0.9 + Math.sin(t * 1.7) * 0.08, -0.3 + Math.cos(t * 0.7) * 0.12);
      const k = Math.min(1, dt * (hero.droneTo ? 7 : 3.5)); dVel.copy(dLocal).sub(drone.position).multiplyScalar(k); drone.position.add(dVel);
      drone.rotation.z = THREE.MathUtils.clamp(-dVel.x * 6, -0.6, 0.6); drone.rotation.x = THREE.MathUtils.clamp(dVel.z * 6, -0.6, 0.6) + 0.1;
      shell.rotation.y = t * 1.2; dring.rotation.z = t * 2; dring2.rotation.z = -t * 1.3; ringBack.rotation.z = t * 1.4;
      hero.droneFlash = Math.max(0, hero.droneFlash - dt * 6);
      dGlow.material.opacity = 0.35 + night * 0.35 + hero.droneFlash * 0.8; dGlow.scale.setScalar(1.3 + hero.droneFlash * 1.2); eye.scale.setScalar(1 + hero.droneFlash * 0.8);
      void speed;
    };
    restL = { x: -0.2, z: 0.12, e: 0.5 }; restR = { x: -0.35, z: -0.1, e: 0.6 };
    swingL = 0.9; swingR = 0.5; styleAtk = 'punch';
  } else {
    /* ANÃO (estilo WoW) — atarracado, barba enorme trançada com anéis, elmo com chifres, ombreiras colossais, martelo de guerra de duas mãos */
    const armorC = 0x6a6e78, armorD = 0x4b4f58, brass = 0xc8a050, leather = 0x4a3020, beardC = 0xc45a1c, beardD = 0x9a3f12, mail = 0x3f434c, iron = 0x2c2f36, hornC = 0xe6dcc4;
    armL = mkArm(-1, mail, S.skin); armR = mkArm(1, mail, S.skin);
    const gmR = new THREE.MeshBasicMaterial({ color: 0xffa030 }); glowMats.push(gmR);
    // ombreiras colossais em três camadas com espigões e rebites; braçadeiras; manoplas
    for (const a of [armL, armR]) {
      for (let k = 0; k < 3; k++) { const pd = new THREE.SphereGeometry(S.rUpper[0] * (2.3 - k * 0.35), 10, 7, 0, Math.PI * 2, 0, Math.PI * 0.55); pd.translate(0, 0.03 - k * 0.055, 0); a.sh.add(mk(pd, k % 2 ? armorD : armorC, 0.012)); }
      const trimP = mk(new THREE.TorusGeometry(S.rUpper[0] * 2.25, 0.02, 5, 16), brass, 0); trimP.rotation.x = Math.PI / 2; trimP.position.y = 0.0; a.sh.add(trimP);
      for (let k = 0; k < 2; k++) { const sp = mk(new THREE.ConeGeometry(0.035, 0.14, 6), iron, 0.003); sp.position.set((k ? 1 : -1) * 0.07, 0.14, 0); sp.rotation.z = (k ? -1 : 1) * 0.35; a.sh.add(sp); }
      for (let k = 0; k < 5; k++) { const a3 = k / 5 * Math.PI * 2; const rv = mk(new THREE.SphereGeometry(0.014, 5, 4), brass, 0); rv.position.set(Math.cos(a3) * S.rUpper[0] * 2.0, 0.0, Math.sin(a3) * S.rUpper[0] * 2.0); a.sh.add(rv); }
      const br = mk(new THREE.CylinderGeometry(S.rFore[0] * 1.35, S.rFore[1] * 1.35, 0.16, 8), brass, 0.008); br.position.y = -S.fore * 0.55; a.el.add(br);
      const gl = mk(new THREE.SphereGeometry(S.rFore[1] * 1.7, 7, 6), leather, 0.006); gl.scale.set(1, 0.9, 1.1); a.wr.add(gl);
      for (let k = 0; k < 3; k++) { const kn = mk(new THREE.SphereGeometry(0.014, 5, 4), iron, 0); kn.position.set((k - 1) * 0.03, 0.02, S.rFore[1] * 1.6); a.wr.add(kn); }
    }
    // peitoral bombado com trim de latão e rebites, cota de malha, cinto largo com fivela de caveira, chifre de hidromel, bolsas
    const plate = mk(new THREE.CylinderGeometry(S.chestR * 1.12, S.waistR * 1.2, S.torso * 0.72, 12), armorC, 0.012); plate.scale.z = S.torsoDepth; plate.position.y = S.torso * 0.52; spine.add(plate);
    const belly = mk(new THREE.SphereGeometry(S.waistR * 1.12, 10, 8), armorD, 0.01); belly.scale.set(1.05, 0.7, S.torsoDepth * 1.1); belly.position.y = S.torso * 0.2; spine.add(belly);
    const trim = mk(new THREE.TorusGeometry(S.chestR * 1.12, 0.022, 5, 16), brass, 0.004); trim.rotation.x = Math.PI / 2; trim.position.y = S.torso * 0.88; trim.scale.z = S.torsoDepth; spine.add(trim);
    const gorget = mk(new THREE.CylinderGeometry(S.chestR * 0.9, S.chestR * 1.14, 0.1, 12), brass, 0.005); gorget.scale.z = S.torsoDepth; gorget.position.y = S.torso * 0.92; spine.add(gorget);
    for (let i = 0; i < 8; i++) { const rv = mk(new THREE.SphereGeometry(0.016, 5, 4), brass, 0); rv.position.set(-0.17 + i * 0.05, S.torso * 0.6, S.chestR * 1.1 * S.torsoDepth * 0.8 + 0.01); spine.add(rv); }
    const belt = mk(new THREE.CylinderGeometry(S.waistR * 1.28, S.waistR * 1.28, 0.13, 12), leather, 0.009); belt.scale.z = 0.82; belt.position.y = 0.05; spine.add(belt);
    const bk = mk(new THREE.SphereGeometry(0.075, 8, 6), brass, 0.006); bk.scale.set(1, 1.1, 0.5); bk.position.set(0, 0.05, S.waistR * 1.05); spine.add(bk);
    for (const sx of [-1, 1]) { const es = new THREE.Mesh(new THREE.SphereGeometry(0.018, 5, 4), new THREE.MeshBasicMaterial({ color: 0x1a1006 })); es.position.set(sx * 0.025, 0.065, S.waistR * 1.05 + 0.035); spine.add(es); }
    const horn = mk(new THREE.ConeGeometry(0.04, 0.26, 7), hornC, 0.005); horn.rotation.set(0.5, 0, 0.9); horn.position.set(-S.pelvisW * 0.72, -0.02, 0.06); hips.add(horn);
    const hornRim = mk(new THREE.TorusGeometry(0.04, 0.012, 5, 10), brass, 0); hornRim.position.y = 0.12; horn.add(hornRim);
    for (const sx of [1, -1]) { const pouch = mk(new THREE.BoxGeometry(0.11, 0.11, 0.07), leather, 0.005); pouch.position.set(sx * S.pelvisW * 0.72, -0.02, sx > 0 ? 0.06 : -0.1); hips.add(pouch); }
    // saia de malha com placas de coxa, joelheiras, botas com biqueira de ferro
    const skirtG = new THREE.CylinderGeometry(S.waistR * 1.22, S.waistR * 1.62, 0.26, 12, 1, true); skirtG.translate(0, -0.11, 0);
    hips.add(mk(skirtG, mail, 0.01, toon(mail, { side: THREE.DoubleSide })));
    for (let i = 0; i < 6; i++) { const a2 = i / 6 * Math.PI * 2; const tp = mk(new THREE.BoxGeometry(0.12, 0.2, 0.02), armorD, 0.004); tp.position.set(Math.sin(a2) * S.waistR * 1.45, -0.15, Math.cos(a2) * S.waistR * 1.22); tp.rotation.y = a2; tp.rotation.x = -0.15; hips.add(tp); const tr = mk(new THREE.BoxGeometry(0.12, 0.02, 0.024), brass, 0); tr.position.set(0, -0.1, 0); tp.add(tr); }
    for (const lg of [legL, legR]) { const kp = mk(new THREE.SphereGeometry(S.rShin[0] * 1.4, 7, 5), armorD, 0.005); kp.scale.set(1, 0.9, 0.8); kp.position.set(0, 0, S.rShin[0] * 0.45); lg.knee.add(kp);
      const cap = mk(new THREE.BoxGeometry(S.footW * 0.95, 0.07, 0.11), iron, 0.004); cap.position.set(0, -S.ankle * 0.1, S.footLen * 0.55); lg.ankle.add(cap);
      const cuff = mk(new THREE.CylinderGeometry(S.rShin[1] * 1.5, S.rShin[1] * 1.35, 0.1, 8), iron, 0.005); cuff.position.y = 0.14; lg.ankle.add(cuff); }
    // ELMO com chifres curvos: calota de ferro, aro de latão, nasal, protetores de face
    const helm = new THREE.SphereGeometry(S.headR * 1.16, 14, 9, 0, Math.PI * 2, 0, Math.PI * 0.58); helm.translate(0, 0.01, -0.01);
    head.add(mk(helm, armorC, 0.012));
    const rim = mk(new THREE.TorusGeometry(S.headR * 1.1, 0.024, 6, 18), brass, 0.006); rim.rotation.x = Math.PI / 2; rim.position.y = S.headR * 0.18; head.add(rim);
    const ridge = mk(new THREE.BoxGeometry(0.035, 0.05, S.headR * 1.9), brass, 0.004); ridge.position.set(0, S.headR * 1.0, -S.headR * 0.05); head.add(ridge);
    const nasal = mk(new THREE.BoxGeometry(0.04, S.headR * 0.9, 0.025), armorC, 0.005); nasal.position.set(0, S.headR * 0.0, S.headR * 1.1); head.add(nasal);
    for (const sx of [-1, 1]) { const ch = mk(new THREE.BoxGeometry(0.035, S.headR * 0.7, S.headR * 0.55), armorD, 0.005); ch.position.set(sx * S.headR * 1.08, -S.headR * 0.1, S.headR * 0.3); head.add(ch);
      // chifre: 5 segmentos cônicos que curvam para cima e para fora
      let par: THREE.Object3D = head; let px = sx * S.headR * 0.95, py = S.headR * 0.45, pz = S.headR * 0.1;
      const base = new THREE.Group(); base.position.set(px, py, pz); base.rotation.z = sx * -1.25; base.rotation.x = -0.2; head.add(base); par = base;
      for (let k = 0; k < 5; k++) { const len = 0.085 - k * 0.006, r0 = 0.045 - k * 0.008, r1 = 0.038 - k * 0.008; const seg = mk(new THREE.CylinderGeometry(Math.max(0.008, r1), r0, len, 7), hornC, 0.004); seg.position.y = len / 2; const g2 = new THREE.Group(); g2.add(seg); par.add(g2); const nx = new THREE.Group(); nx.position.y = len; nx.rotation.z = sx * 0.42; nx.rotation.x = -0.12; g2.add(nx); par = nx; }
      const tipH = mk(new THREE.ConeGeometry(0.012, 0.06, 6), hornC, 0); tipH.position.y = 0.03; par.add(tipH);
      const ring = mk(new THREE.TorusGeometry(0.05, 0.012, 5, 10), brass, 0); ring.position.y = 0.04; base.add(ring); void px; void py; void pz; }
    // ROSTO: nariz grande, sobrancelhas grossas, bochechas; BARBA enorme até o cinto, em camadas, com duas tranças de anéis e trança atrás
    const noseD = mk(new THREE.SphereGeometry(S.headR * 0.28, 8, 6), S.skin, 0.004); noseD.scale.set(1, 0.9, 1.2); noseD.position.set(0, -S.headR * 0.12, S.headR * 1.05); head.add(noseD);
    for (const sx of [-1, 1]) { const bw = mk(new THREE.BoxGeometry(S.headR * 0.5, S.headR * 0.14, S.headR * 0.18), beardD, 0.003); bw.position.set(sx * S.headR * 0.4, S.headR * 0.3, S.headR * 0.92); bw.rotation.z = -sx * 0.3; head.add(bw); }
    const bg = new THREE.SphereGeometry(S.headR * 1.0, 12, 9); bg.scale(1.12, 2.3, 0.85); bg.translate(0, -S.headR * 1.75, S.headR * 0.42); head.add(mk(bg, beardC, 0.012));
    const bg2 = new THREE.SphereGeometry(S.headR * 0.85, 10, 8); bg2.scale(1.0, 1.4, 0.75); bg2.translate(0, -S.headR * 0.95, S.headR * 0.6); head.add(mk(bg2, beardC, 0.01));
    for (let i = 0; i < 5; i++) { const lk = new THREE.SphereGeometry(1, 7, 5); lk.scale(S.headR * 0.22, S.headR * 0.55, S.headR * 0.2); const lm = mk(lk, i % 2 ? beardD : beardC, 0); lm.position.set((i - 2) * S.headR * 0.42, -S.headR * (2.6 + (i % 2) * 0.3), S.headR * (0.5 - Math.abs(i - 2) * 0.12)); head.add(lm); }
    const mus = mk(new THREE.TorusGeometry(S.headR * 0.5, 0.05, 6, 10, Math.PI), beardD, 0.007); mus.position.set(0, -S.headR * 0.3, S.headR * 0.98); mus.rotation.z = Math.PI; head.add(mus);
    for (const sx of [-1, 1]) { const mt = new THREE.SphereGeometry(1, 6, 5); mt.scale(S.headR * 0.14, S.headR * 0.3, S.headR * 0.14); const mm = mk(mt, beardD, 0); mm.position.set(sx * S.headR * 0.62, -S.headR * 0.55, S.headR * 0.88); mm.rotation.z = -sx * 0.4; head.add(mm); }
    const b1 = chain(head, [-S.headR * 0.45, -S.headR * 3.2, S.headR * 0.5], 5, 0.1, 0.05, 0.022, beardC, 0.08, brass); chains.push({ update: b1.update, seed: 0.5, bake: b1.bake });
    const b2 = chain(head, [S.headR * 0.45, -S.headR * 3.2, S.headR * 0.5], 5, 0.1, 0.05, 0.022, beardC, 0.08, brass); chains.push({ update: b2.update, seed: 2.2, bake: b2.bake });
    const b3 = chain(head, [0, S.headR * 0.1, -S.headR * 1.05], 4, 0.1, 0.045, 0.02, beardC, 0.25, iron); chains.push({ update: b3.update, seed: 4.1, bake: b3.bake });
    // MARTELO DE GUERRA de duas mãos: cabo longo com couro, cabeça maciça com faces de latão, runas, espigão
    const axe = new THREE.Group();
    const haft = mk(new THREE.CylinderGeometry(0.03, 0.034, 1.0, 8), 0x5a3e24, 0.007); haft.position.y = 0.22; axe.add(haft); // cabo mais curto: a cabeça não entra no chão em repouso
    for (let i = 0; i < 6; i++) { const wr2 = mk(new THREE.CylinderGeometry(0.036, 0.036, 0.035, 8), leather, 0.003); wr2.position.y = -0.2 + i * 0.1; axe.add(wr2); }
    const hh = mk(new THREE.BoxGeometry(0.42, 0.22, 0.24), armorD, 0.01); hh.position.y = 0.62; axe.add(hh);
    for (const sx of [-1, 1]) { const face = mk(new THREE.BoxGeometry(0.06, 0.26, 0.28), brass, 0.005); face.position.set(sx * 0.21, 0.62, 0); axe.add(face); for (let k = 0; k < 4; k++) { const st = mk(new THREE.SphereGeometry(0.018, 5, 4), iron, 0); st.position.set(sx * 0.24, 0.62 + (k < 2 ? 0.08 : -0.08), (k % 2 ? 0.09 : -0.09)); axe.add(st); } }
    for (let k = 0; k < 3; k++) { const rn = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.014, 0.25), gmR); rn.position.set(-0.1 + k * 0.1, 0.735, 0); axe.add(rn); const rn2 = rn.clone(); rn2.position.y = 0.505; axe.add(rn2); }
    const spike = mk(new THREE.ConeGeometry(0.05, 0.2, 6), iron, 0.004); spike.position.y = 0.83; axe.add(spike);
    const pommel = mk(new THREE.SphereGeometry(0.045, 6, 5), brass, 0.003); pommel.position.y = -0.3; axe.add(pommel);
    const tip = new THREE.Object3D(); tip.position.set(0.22, 0.62, 0); axe.add(tip); weaponTipObj = tip;
    const wb = new THREE.Object3D(); wb.position.set(0, 0.2, 0); axe.add(wb); weaponBaseObj = wb;
    const ah = new THREE.Group(); ah.add(axe); ah.rotation.set(0.3 + Math.PI, 0, 0.05); armR.wr.add(ah); swordHolder = ah; // em repouso a cabeça fica para baixo, ao lado da perna
    weaponInner = axe; innerRotX = Math.PI / 2; weaponRig = new THREE.Group(); chest.add(weaponRig); dwarfAxe = axe;
    gripL = new THREE.Object3D(); gripL.position.set(0, 0.16, 0); axe.add(gripL);
    // escudo redondo às costas
    const bs = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.04, 20), toon(0x5a3b24)); bs.rotation.x = Math.PI / 2; bs.position.set(0, S.torso * 0.35, -S.chestR * 1.05); chest.add(bs);
    const bsRim = mk(new THREE.TorusGeometry(0.32, 0.02, 5, 20), iron, 0.004); bsRim.position.copy(bs.position); chest.add(bsRim);
    const bsBoss = mk(new THREE.SphereGeometry(0.08, 8, 6), iron, 0.004); bsBoss.position.set(0, S.torso * 0.35, -S.chestR * 1.12); chest.add(bsBoss);
    addLantern(hips, [-S.pelvisW * 0.72, 0.0, -0.1]);
    extraUpdate = (t) => { gmR.color.setHSL(0.07, 1, 0.5 + 0.12 * Math.sin(t * 3)); };
    restL = { x: -0.2, z: 0.42, e: 0.5 }; restR = { x: -0.15, z: -0.42, e: 0.35 };
    swingL = 0.75; swingR = 0.35; styleAtk = 'chop';
  }

  /* funde as peças estáticas de cada osso: ~25 draw calls por personagem em vez de ~200 */
  if (opts.static) for (const c of chains) c.bake?.();
  if (!(window as unknown as {__nomerge?:boolean}).__nomerge) mergeStatic(root, ramp);
  fine(root);
  if (!charShadow.on) root.traverse((o) => { if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).castShadow = false; });

  /* sombra e silhueta atrás de obstáculos */
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.5, 14), new THREE.MeshBasicMaterial({ color: 0, transparent: true, opacity: 0.4, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.03; root.add(shadow);
  /* luz de aura só no herói: cada PointLight a mais entra no shader de TODO o mundo (NPCs não ganham luz própria) */
  const aura = opts.static ? null : new THREE.PointLight(0xffe9ad, 0, 9, 2); if (aura) { aura.position.set(0, 1.2, 0); root.add(aura); }
  const sil = new THREE.MeshBasicMaterial({ color: 0xb7a6ff, transparent: true, opacity: 0.28, depthFunc: THREE.GreaterDepth, depthWrite: false });
  const meshes: THREE.Mesh[] = [];
  root.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh && m !== shadow && !(m.material as THREE.Material).transparent && (m.material as THREE.Material).side !== THREE.BackSide) meshes.push(m); });
  void sil; void meshes; // sem silhueta/brilho sobre o personagem

  /* ---------------- animação ---------------- */
  let phase = 0, yaw = 0, breath = 0, night = 0, wind = 0, lastStep = 0, auraOn = false;
  let walkK = 0, runK = 0;
  /* capa e ombreiras de verdade (não só números): pano que cai das costas e balança ao andar; ombreiras em lâminas com rebites */
  function setCapeShoulders(g: { cape?: { base: string; rarity: string } | null; shoulders?: { base: string; rarity: string } | null }) {
    const RC2: Record<string, number> = { magic: 0x6ab0ff, rare: 0xffd24a, legendary: 0xff8a1c, epic: 0x9b5de5, unique: 0xf2cf6a, relic: 0xe2452b };
    if (g.cape !== undefined) {
      for (const c of [...bodyHolder.children]) if (c.userData.cape) bodyHolder.remove(c); capeObj = null;
      if (g.cape) { const base = g.cape.base, trimC = RC2[g.cape.rarity] ?? 0x8a6a3a;
        /* modelos de capa: lã longa, curta de viagem, peles (lobo, urso, lobisomem), com correntes, ornamentada, corvo */
        const FC = facOf(base), V = FC ? FC : /Curta/.test(base) ? 'short' : /Urso/.test(base) ? 'bear' : /Lobisomem/.test(base) ? 'were' : /Lobo/.test(base) ? 'wolf' : /Corrente/.test(base) ? 'chain' : /Ornament|Sacro|Juramento/.test(base) ? 'ornate' : /Corvo/.test(base) ? 'raven' : /Peles/.test(base) ? 'fur' : 'cloth';
        const FUR = V === 'bear' || V === 'were' || V === 'wolf' || V === 'fur' || V === 'chain';
        const col = V === 'fio' ? 0x1f3a6e : V === 'desf' ? 0x16121a : V === 'bear' ? 0x4a3524 : V === 'were' ? 0x2a2622 : V === 'wolf' ? 0x7a7670 : V === 'fur' || V === 'chain' ? 0x5e4a34 : V === 'raven' ? 0x1c1c26 : V === 'ornate' ? (/Sacro|Juramento/.test(base) ? 0xe8dcc0 : 0x3a1a22) : /Último Caçador/.test(base) ? 0x3a2418 : V === 'short' ? 0x4a3a2a : 0x7a2a22;
        const lenK = V === 'short' ? 0.52 : V === 'bear' ? 0.95 : V === 'wolf' ? 0.85 : 1, widK = V === 'bear' ? 1.5 : V === 'were' ? 1.38 : 1.3;
        const w = S.shoulderW * widK, h = (S.torso + S.thigh * 0.62) * lenK, geo = new THREE.PlaneGeometry(w, h, 12, 12); geo.translate(0, -h / 2, 0);
        const pos = geo.attributes.position, ragged = FUR || V === 'raven' || V === 'desf', thick = V === 'bear' ? 1.6 : FUR ? 1.25 : 1;
        for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), y = pos.getY(i), k = -y / h, ex = Math.abs(x) / (w / 2);
          let yy = y + ex * ex * 0.09 * Math.pow(k, 3); if (k > 0.94 && ragged) yy += Math.sin(x * 47) * 0.04 * thick + Math.sin(x * 19) * 0.025; // pele, penas: barra irregular
          if (V === 'wolf' || V === 'were') yy -= Math.max(0, 1 - ex * 3) * 0.06 * Math.pow(k, 4); // pele de bicho: a cauda pende no meio
          pos.setXYZ(i, x * (1 + k * (V === 'short' ? 0.18 : 0.34)), yy, (-0.03 - k * 0.07 - Math.cos(ex * Math.PI * 0.5) * 0.035 * (1 - k * 0.5)) * thick + Math.sin((x / w) * Math.PI * (FUR ? 3 : 5) + k * 1.5) * 0.02 * (0.25 + k)); }
        geo.computeVertexNormals();
        const grp = new THREE.Group(); grp.userData.cape = true; grp.userData.keep = true; grp.position.set(0, 0.03, -S.torsoDepth * S.chestR * 0.6); grp.rotation.x = 0.05; bodyHolder.add(grp);
        const outer = mk(geo, col, 0.006, toon(col, { side: THREE.FrontSide })); outer.castShadow = true; grp.add(outer);
        const inner = new THREE.Mesh(geo, toon(new THREE.Color(FUR ? 0x3a2a1c : col).multiplyScalar(0.55).getHex(), { side: THREE.BackSide })); grp.add(inner); // forro mais escuro (couro cru nas peles)
        const collarC = V === 'fio' ? 0xc9a24a : V === 'desf' ? 0x5a0e14 : V === 'raven' ? 0x14141c : V === 'bear' ? 0x5a4230 : V === 'were' ? 0x1e1a18 : V === 'wolf' ? 0x9a968e : FUR ? 0x9a8462 : 0x3a2a1c;
        const tuftR = V === 'bear' ? 0.085 : FUR ? 0.06 : V === 'raven' ? 0.055 : 0.035, nT = V === 'bear' ? 17 : 13;
        for (let i = 0; i < nT; i++) { const a2 = (i / (nT - 1) - 0.5) * 2.9; const tuft = mk(new THREE.SphereGeometry(tuftR * (0.85 + ((i * 7) % 5) * 0.06), 6, 5), collarC, 0); tuft.scale.set(1, 0.75, 1.25); tuft.position.set(Math.sin(a2) * S.shoulderW * (V === 'bear' ? 0.62 : 0.56), 0.035, Math.cos(a2) * 0.07 + 0.03); grp.add(tuft); } // gola
        if (FUR) { // tufos de pelo pela barra
          const tufC = new THREE.Color(col).multiplyScalar(1.15).getHex(); for (let i = 0; i < 15; i++) { const x = (i / 14 - 0.5) * w * 1.28, tf = mk(new THREE.ConeGeometry(0.018 * thick, (0.05 + (i % 3) * 0.015) * thick, 4), tufC, 0); tf.rotation.x = Math.PI; tf.position.set(x, -h * 0.98 - (V === 'wolf' || V === 'were' ? Math.max(0, 1 - Math.abs(x) / w * 3) * 0.06 : 0), -0.1 * thick - 0.07); grp.add(tf); } }
        if (V === 'wolf' || V === 'were') { // a cabeça do bicho sobre o ombro esquerdo, como capuz caído
          const hc = V === 'were' ? 0x1e1a18 : 0x8a867e, hd = new THREE.Group(); hd.position.set(-S.shoulderW * 0.42, 0.06, -0.02); hd.rotation.set(-0.3, 0.5, 0.2); grp.add(hd);
          const sk = mk(new THREE.SphereGeometry(0.075, 8, 6), hc, 0.006); sk.scale.set(1, 0.8, 1.2); hd.add(sk);
          const sn = mk(new THREE.ConeGeometry(0.045, 0.12, 6), hc, 0.006); sn.rotation.x = Math.PI / 2; sn.position.set(0, -0.02, 0.1); hd.add(sn);
          for (const ex2 of [-1, 1]) { const ear = mk(new THREE.ConeGeometry(0.025, 0.07, 4), hc, 0.004); ear.position.set(ex2 * 0.045, 0.07, -0.01); hd.add(ear); const eye = new THREE.Mesh(new THREE.SphereGeometry(0.009, 4, 3), new THREE.MeshBasicMaterial({ color: V === 'were' ? 0xff3a1a : 0x1a1a1a })); eye.position.set(ex2 * 0.03, 0.02, 0.07); hd.add(eye); }
          if (V === 'were') for (const sx of [-1, 1]) for (let c = 0; c < 3; c++) { const cl = mk(new THREE.ConeGeometry(0.012, 0.07, 4), 0xd8d0c0, 0); cl.rotation.x = Math.PI; cl.position.set(sx * (w * 0.62 - c * 0.025), -h * 0.97 - 0.04, -0.15); grp.add(cl); } } // garras penduradas nas pontas
        if (V === 'chain') { // correntes de ferro atravessando a pele e pendendo
          const link = new THREE.TorusGeometry(0.016, 0.005, 4, 8), ironM = toon(0x6a6e76);
          for (let c = 0; c < 2; c++) for (let i = 0; i < 16; i++) { const u = i / 15, x = (u - 0.5) * w * (1.1 + c * 0.1), y = -h * (0.18 + c * 0.32) - Math.sin(u * Math.PI) * 0.08, lk = new THREE.Mesh(link, ironM); lk.position.set(x, y, -0.12 - c * 0.03 - u * 0.0); lk.rotation.set(0, i % 2 ? Math.PI / 2 : 0, 0); grp.add(lk); }
          for (const sx of [-0.3, 0.1, 0.42]) for (let i = 0; i < 6; i++) { const lk = new THREE.Mesh(link, ironM); lk.position.set(sx * w, -h * 0.5 - i * 0.03, -0.16); lk.rotation.y = i % 2 ? Math.PI / 2 : 0; grp.add(lk); } }
        if (V === 'ornate') { // barra bordada em ouro e o Olho Kármico no meio das costas
          const gold = toon(0xc9a24a, { emissive: new THREE.Color(trimC).multiplyScalar(0.08) });
          const hem = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(Array.from({ length: 9 }, (_, i) => { const u = i / 8 - 0.5; return new THREE.Vector3(u * w * 1.33, -h * 0.98 + Math.pow(Math.abs(u) * 2, 2) * 0.08, -0.115); })), 24, 0.012, 4), gold); grp.add(hem);
          for (const sx of [-1, 1]) { const side = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(Array.from({ length: 7 }, (_, i) => { const k = i / 6; return new THREE.Vector3(sx * w * 0.5 * (1 + k * 0.33), -h * k * 0.97, -0.03 - k * 0.08); })), 20, 0.01, 4), gold); grp.add(side); }
          const eye = new THREE.Group(); eye.position.set(0, -h * 0.42, -0.125); eye.rotation.y = Math.PI; grp.add(eye);
          const lens = mk(new THREE.CircleGeometry(0.075, 20), 0xc9a24a, 0); lens.scale.set(1.5, 0.75, 1); eye.add(lens);
          const iris = new THREE.Mesh(new THREE.CircleGeometry(0.03, 14), toon(0x1a1210)); iris.position.z = 0.002; eye.add(iris); }
        if (FC) { // capa de facção: o brasão bordado nas costas; o Fio corre em ouro pela barra, nos Desfiados os fios pendem soltos
          const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.425), new THREE.MeshToonMaterial({ map: crestTexture(FC), gradientMap: ramp, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide }));
          plate.userData.keep = true; plate.position.set(0, -h * 0.56, -0.135); plate.rotation.set(0.06, Math.PI, 0); grp.add(plate);
          if (FC === 'fio') { const gold = toon(0xd9b45a, { emissive: new THREE.Color(0xffd88a).multiplyScalar(0.12) });
            const hem = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(Array.from({ length: 9 }, (_, i) => { const u = i / 8 - 0.5; return new THREE.Vector3(u * w * 1.33, -h * 0.98 + Math.pow(Math.abs(u) * 2, 2) * 0.08, -0.115); })), 24, 0.011, 4), gold); grp.add(hem);
            // o fio desce da gola até o brasão, sem nó
            const th = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(Array.from({ length: 6 }, (_, i) => { const k = i / 5; return new THREE.Vector3(Math.sin(k * 5) * 0.03, -h * 0.22 * k - 0.02, -0.06 - k * 0.045); })), 16, 0.006, 4), gold); grp.add(th); }
          else { const red = toon(0xb8202a), redD = toon(0x6a0e14);
            for (let i = 0; i < 11; i++) { const u = i / 10 - 0.5, L = 0.08 + ((i * 37) % 7) * 0.02, fr = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.0025, L, 3), i % 3 ? redD : red); fr.position.set(u * w * 1.28, -h * 0.98 - L / 2 + Math.pow(Math.abs(u) * 2, 2) * 0.06, -0.12 - (0.5 - Math.abs(u)) * 0.02); fr.rotation.z = ((i * 13) % 5 - 2) * 0.08; grp.add(fr); }
            for (const sx of [-1, 1]) { const side = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(Array.from({ length: 7 }, (_, i) => { const k = i / 6; return new THREE.Vector3(sx * w * 0.5 * (1 + k * 0.33), -h * k * 0.9, -0.03 - k * 0.08); })), 20, 0.007, 4), red); grp.add(side); } } }
        for (const sx of [-1, 1]) { const clasp = mk(new THREE.CylinderGeometry(V === 'bear' ? 0.042 : 0.032, V === 'bear' ? 0.042 : 0.032, 0.016, 12), V === 'were' || V === 'desf' ? 0x5a5e66 : 0xb08a40, 0, toon(V === 'were' || V === 'desf' ? 0x3a3a42 : 0xb08a40, { emissive: new THREE.Color(trimC).multiplyScalar(0.1) })); clasp.rotation.x = Math.PI / 2; clasp.position.set(sx * S.shoulderW * 0.36, -0.03, S.torsoDepth * S.chestR * 1.9 + 0.03); grp.add(clasp); } // broches
        capeObj = grp; }
    }
    if (g.shoulders !== undefined) {
      for (const c of [...bodyHolder.children]) if (c.userData.pauldron) bodyHolder.remove(c);
      if (g.shoulders) { const base = g.shoulders.base, rar = g.shoulders.rarity, glow = RC2[rar];
        /* modelos (WoW / Guild Wars 2): couro, ferro, placas, escamas, pele de lobo, crânio, cravejadas, chifres, guardião */
        const V = /Escam/.test(base) ? 'scale' : /Pele|Lobo/.test(base) ? 'fur' : /Crânio/.test(base) ? 'skull' : /Cravej/.test(base) ? 'spike' : /Chifre/.test(base) ? 'horn' : /Guardião|Brokk/.test(base) ? 'guard' : /Couro/.test(base) ? 'leather' : /Placas/.test(base) ? 'plate' : 'iron';
        const leather = V === 'leather', metalC = V === 'plate' || V === 'guard' || V === 'spike' ? 0x9aa0a8 : V === 'horn' ? 0x5a5e66 : 0x6e747c;
        const col = leather ? 0x5a3a22 : V === 'scale' ? 0x7a8088 : V === 'fur' ? 0x6a5a48 : metalC, lames = leather ? 2 : V === 'scale' ? 4 : V === 'plate' || V === 'guard' ? 3 : 2, trim = leather ? 0x2e1c10 : V === 'guard' ? 0xb08a40 : 0x3a3d44;
        const KM: GearKind = leather ? 'leather' : V === 'plate' || V === 'guard' || V === 'spike' ? 'steel' : V === 'horn' ? 'dark' : 'iron', TK: GearKind = V === 'guard' || V === 'plate' ? 'bronze' : 'leatherD'; void col; void trim; void lames; void TK;
        const R0 = S.rUpper[0], big = V === 'guard' ? 1.25 : V === 'spike' || V === 'horn' || V === 'skull' ? 1.1 : 1;
        for (const sx of [-1, 1]) { const p2 = new THREE.Group(); p2.userData.pauldron = true; p2.userData.keep = true; p2.position.set(sx * S.shoulderW * 0.52, 0.015, 0); p2.rotation.z = sx * -0.38; /* grandes e robustas, assentadas no alto do ombro */ bodyHolder.add(p2);
          if (V === 'fur') { // manto de pele de lobo sobre o ombro, preso por uma correia
            const fur = gm(new THREE.SphereGeometry(R0 * 2.5, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), 'fur'); fur.scale.set(1.15, 0.7, 1.25); fur.castShadow = true; p2.add(fur);
            for (let k = 0; k < 10; k++) { const a2 = (k / 10) * Math.PI * 2, tf = gm(new THREE.ConeGeometry(0.022, 0.07, 5), 'fur'); tf.position.set(Math.cos(a2) * R0 * 2.3, -0.02, Math.sin(a2) * R0 * 2.5); tf.rotation.set(Math.sin(a2) * 2.2, 0, -Math.cos(a2) * 2.2); p2.add(tf); }
            const strap = new THREE.Mesh(new THREE.TorusGeometry(R0 * 1.6, 0.012, 4, 16), gearMat('leatherD')); strap.rotation.x = Math.PI / 2; strap.position.y = -0.04; p2.add(strap); continue; }
          { /* ombreira articulada (referências: placas de aço sobrepostas, couro rebitado, filigrana): a calota no alto do ombro e as lâminas
               descendo pelo braço, cada uma um pouco mais larga, com a borda de baixo em outra cor e rebites nas pontas e no meio */
            const orn = !leather && (V === 'guard' || rar === 'epic' || rar === 'legendary' || rar === 'unique' || rar === 'relic');
            const copK: GearKind = orn ? 'ornate' : KM, edgeK: GearKind = orn ? 'gold' : leather ? 'leatherD' : V === 'plate' ? 'bronze' : 'dark', rivK: GearKind = leather ? 'steel' : orn ? 'gold' : 'bronze';
            const cop = gm(new THREE.SphereGeometry(R0 * 2.35 * big, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.42), copK, glow); cop.scale.set(1.05, 0.78, 1.15); p2.add(cop);
            const copEdge = new THREE.Mesh(new THREE.TorusGeometry(R0 * 2.35 * big * 0.97 * 1.08, orn ? 0.014 : 0.01, 4, 22), gearMat(edgeK)); copEdge.rotation.x = Math.PI / 2; copEdge.position.y = R0 * 2.35 * big * 0.78 * Math.cos(Math.PI * 0.42); copEdge.scale.set(1.0, 1.08, 1); p2.add(copEdge);
            const lg = new THREE.Group(); lg.rotation.y = sx > 0 ? 0 : Math.PI; p2.add(lg); // local +x = para fora do corpo
            const nL = V === 'scale' ? 4 : leather ? 3 : V === 'plate' || V === 'guard' ? 3 : 2, TL = Math.PI * 1.25, T0 = Math.PI / 2 - TL / 2;
            for (let l = 0; l < nL; l++) { const rt = R0 * (2.0 + l * 0.12) * big, rb = rt * 1.1, hh = 0.052, y = -0.012 - l * 0.042;
              const lam = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, hh, 18, 1, true, T0, TL), gearMat(KM, undefined, THREE.DoubleSide)); lam.position.y = y; lam.castShadow = true; lg.add(lam);
              const ed = new THREE.Mesh(new THREE.CylinderGeometry(rb * 1.012, rb * 1.02, 0.011, 18, 1, true, T0, TL), gearMat(edgeK, undefined, THREE.DoubleSide)); ed.position.y = y - hh / 2 + 0.004; lg.add(ed);
              for (const th of [T0 + 0.12, Math.PI / 2, T0 + TL - 0.12]) { const rv = gm(new THREE.SphereGeometry(0.0105, 5, 4), rivK); const rr = (rt + rb) / 2 * 1.02; rv.position.set(Math.sin(th) * rr, y + 0.006, Math.cos(th) * rr); lg.add(rv); } }
            if (orn) { // a aba que sobe para o pescoço, curva como uma chama
              const cv = new THREE.CatmullRomCurve3([new THREE.Vector3(-sx * R0 * 0.6, R0 * 1.5, 0), new THREE.Vector3(-sx * R0 * 0.9, R0 * 2.4, 0), new THREE.Vector3(-sx * R0 * 1.0, R0 * 3.2, -0.01), new THREE.Vector3(-sx * R0 * 0.8, R0 * 4.0, -0.03)]);
              const fin = gm(new THREE.TubeGeometry(cv, 12, 0.016, 5), 'gold'); p2.add(fin); const tip = gm(new THREE.ConeGeometry(0.016, 0.05, 5), 'gold'); tip.position.copy(cv.getPoint(1)); tip.lookAt(cv.getPoint(1).add(cv.getTangent(1))); tip.rotateX(Math.PI / 2); p2.add(tip); }
          }
          if (V === 'scale') for (let k = 0; k < 14; k++) { const a2 = (k / 13 - 0.5) * 2.6, row = k % 2, sc2 = gm(new THREE.CircleGeometry(0.03, 6), 'iron'); sc2.position.set(Math.sin(a2) * R0 * 2.1, R0 * (0.35 + row * 0.35), Math.cos(a2) * R0 * 2.25); sc2.lookAt(sc2.position.clone().multiplyScalar(3)); p2.add(sc2); } // escamas sobrepostas
          if (!leather && V !== 'scale') for (let k = 0; k < 5; k++) { const a2 = (k / 4 - 0.5) * 2.2, rv = gm(new THREE.SphereGeometry(0.011, 5, 4), 'bronze'); rv.position.set(Math.sin(a2) * R0 * 1.75 * big, R0 * 0.55 * big, Math.cos(a2) * R0 * 1.9 * big); p2.add(rv); }
          if (V === 'plate') { const sp = gm(new THREE.ConeGeometry(0.025, 0.09, 6), 'steel'); sp.position.y = R0 * 1.6; p2.add(sp); }
          if (V === 'spike') for (let k = 0; k < 3; k++) { const sp = gm(new THREE.ConeGeometry(0.03, 0.16 - k * 0.025, 6), 'steel'); sp.position.set(0, R0 * 1.5, (k - 1) * R0 * 0.9); sp.rotation.set((k - 1) * 0.35, 0, sx * 0.3); p2.add(sp); }
          if (V === 'horn') { const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(sx * R0 * 0.6, R0 * 1.1, 0), new THREE.Vector3(sx * 0.07, 0.12, -0.01), new THREE.Vector3(sx * 0.11, 0.19, -0.05), new THREE.Vector3(sx * 0.09, 0.24, -0.11)]);
            const hn = gm(new THREE.TubeGeometry(curve, 12, 0.026, 6), 'bone'); hn.castShadow = true; p2.add(hn); const tip = gm(new THREE.ConeGeometry(0.026, 0.06, 6), 'bone'); tip.position.copy(curve.getPoint(1)); tip.lookAt(curve.getPoint(1).add(curve.getTangent(1))); tip.rotateX(Math.PI / 2); p2.add(tip); }
          if (V === 'skull') { const sk = new THREE.Group(); sk.position.set(sx * R0 * 1.55, R0 * 0.75, R0 * 0.35); sk.rotation.set(0, sx * 1.25, sx * 0.3); sk.scale.setScalar(0.85); p2.add(sk); /* o crânio olha para fora, preso na lateral da ombreira */
            const cran = gm(new THREE.SphereGeometry(0.055, 10, 8), 'bone'); cran.scale.set(0.95, 0.85, 1.1); sk.add(cran);
            const jaw = gm(new THREE.BoxGeometry(0.05, 0.025, 0.045), 'bone'); jaw.position.set(0, -0.045, 0.03); sk.add(jaw); const nose = new THREE.Mesh(new THREE.ConeGeometry(0.008, 0.016, 3), new THREE.MeshBasicMaterial({ color: 0x0a0806 })); nose.rotation.x = Math.PI; nose.position.set(0, -0.015, 0.058); sk.add(nose);
            for (const ex2 of [-1, 1]) { const so = new THREE.Mesh(new THREE.SphereGeometry(0.017, 6, 5), new THREE.MeshBasicMaterial({ color: 0x0a0806 })); so.scale.set(1, 0.8, 0.5); so.position.set(ex2 * 0.021, 0.006, 0.05); sk.add(so); } }
          if (V === 'guard') { const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.03, 0), toon(glow ?? 0x6ab0ff, { emissive: new THREE.Color(glow ?? 0x6ab0ff).multiplyScalar(0.6) })); gem.position.set(0, R0 * 1.25 * big, R0 * 1.4); gem.scale.set(1, 1.3, 0.6); p2.add(gem);
            const crest = gm(new THREE.BoxGeometry(0.012, 0.05, R0 * 3), 'bronze'); crest.position.y = R0 * 1.75 * big; p2.add(crest); }
        }
      }
    }
    fine(bodyHolder);
  }
  /** põe a arma com a empunhadura na mão direita e o cano passando pela esquerda (também usado pela pele de arte, com as mãos do modelo) */
  function placeGun(hR: THREE.Vector3, hL: THREE.Vector3, rq: THREE.Quaternion, rsc: number) {
    const z = hL.clone().sub(hR); if (z.lengthSq() < 1e-6) return; z.normalize(); const up = new V(0, 1, 0).applyQuaternion(rq), x = new V().crossVectors(up, z).normalize(), y = new V().crossVectors(z, x);
    const m = new THREE.Matrix4().makeBasis(x.multiplyScalar(rsc), y.multiplyScalar(rsc), z.clone().multiplyScalar(rsc)).setPosition(hR.clone().addScaledVector(y, -0.02 * rsc));
    gunHolder.parent!.updateWorldMatrix(true, false); gunHolder.matrixAutoUpdate = false; gunHolder.matrix.copy(gunHolder.parent!.matrixWorld).invert().multiply(m); gunHolder.updateMatrixWorld(true);
  }
  let act: { a: Action; t: number; dur: number } | null = null;
  // combate ~12% mais lento e dramático (golpes, defesas); saltos, dash e quedas seguem a física
  const DUR: Record<Action, number> = { attack: 0.62, combo1: 0.56, combo2: 0.56, combo3: 0.62, combo4: 1.1, slam: 1.15, bash: 0.8, cast: 0.78, dash: 0.22, hit: 0.32, shoot: 0.46, throw: 0.78, jet: 0.6, cleave1: 0.62, cleave2: 0.78, cleave3: 1.05, cleave4: 0.62, rush: 1.05, quake: 1.15, charge: 0.78, drink: 0.9, parry: 0.5, dodge: 0.44, block: 0.42, chop: 0.95, mine: 1.0, skin: 0.8, herb: 0.75, kick: 0.62, lowcut: 0.8, plant: 0.82, breath: 0.9, skyraise: 0.95, stance: 0.92, dance: 3.2 };
  /* REGRA DO COMBATE — Karmika é lento e pesado (um pouco mais rápido que o WoW, bem mais lento que um arcade):
     todo golpe e magia dura 40% a mais; reações (esquiva, aparo, bloqueio, tranco) mantêm o tempo curto */
  const TEMPO = 1.65 * 1.1; /* 28/10: a luta 10% mais lenta */ for (const k of Object.keys(DUR) as Action[]) if (!['dash', 'hit', 'parry', 'dodge', 'block'].includes(k)) DUR[k] *= TEMPO;
  let dodgeSide = 1;
  const COMBO = new Set<Action>(['combo1', 'combo2', 'combo3', 'combo4', 'cleave1', 'cleave2', 'cleave3', 'cleave4', 'shoot', 'charge']);
  type Ch = 'shX' | 'shZ' | 'el' | 'swX' | 'swZ' | 'twist' | 'lean' | 'lunge' | 'crouch' | 'jump' | 'spin' | 'shLX' | 'shLZ' | 'elL' | 'face' | 'vel' | 'tilt' | 'head' | 'lgLH' | 'lgLK' | 'lgRH' | 'lgRK' | 'kn';
  type KF = Partial<Record<Ch, [number, number][]>>;
  const PI2 = Math.PI * 2;
  const POSES: Partial<Record<Action, KF>> = {
    chop: { // machadada de lenhador: o machado vai ao ombro direito e corta na horizontal, o quadril gira junto
      twist: [[0, 0], [.35, 0.6], [.55, -0.45], [.75, -0.38], [1, 0]], lean: [[0, 0], [.35, -0.1], [.55, 0.24], [.8, 0.18], [1, 0]], crouch: [[0, 0], [.35, 0.02], [.55, 0.07], [1, 0]], head: [[0, 0], [.35, -0.1], [.55, 0.1], [1, 0]],
    },
    mine: { // picaretada: ergue acima da cabeça e desce com o peso do corpo
      lean: [[0, 0], [.4, -0.22], [.58, 0.46], [.78, 0.38], [1, 0]], crouch: [[0, 0], [.4, -0.01], [.58, 0.1], [.8, 0.08], [1, 0]], head: [[0, 0], [.4, -0.25], [.58, 0.2], [1, 0]], twist: [[0, 0], [.4, 0.15], [.58, -0.1], [1, 0]],
    },
    skin: { // ajoelhado: a faca serra a pele em vaivém, o tronco acompanha
      twist: [[0, 0], [.3, 0.12], [.6, -0.12], [1, 0]], lean: [[0, 0], [.3, 0.06], [.6, 0.1], [1, 0]],
    },
    herb: { // ajoelhado: estende a mão até a planta e corta rente ao talo
      lean: [[0, 0], [.4, 0.14], [.65, 0.1], [1, 0]], twist: [[0, 0], [.4, 0.1], [1, 0]],
    },
    combo1: { // estocada: recolhe a espada ao quadril e projeta o corpo inteiro
      shX: [[0, 0], [.22, 0.4], [.4, -1.55], [.7, -1.4], [1, 0]], shZ: [[0, 0], [.22, 0.2], [.4, 0], [1, 0]], el: [[0, 0], [.22, -0.9], [.4, 0.6], [1, 0]],
      swX: [[0, 0], [.22, 0.9], [.4, 1.7], [.7, 1.6], [1, 0]], twist: [[0, 0], [.22, 0.5], [.4, -0.35], [1, 0]], lean: [[0, 0], [.22, -0.12], [.4, 0.4], [.75, 0.2], [1, 0]],
      lunge: [[0, 0], [.2, 0], [.4, 1], [.8, 0.7], [1, 0]], vel: [[0, 0], [.2, 0], [.3, 6], [.45, 0]], crouch: [[0, 0], [.22, 0.03], [.4, 0.07], [1, 0]],
    },
    combo2: { // corte largo da direita para a esquerda, avançando
      shX: [[0, 0], [.22, -2.3], [.45, -1.45], [1, 0]], shZ: [[0, 0], [.22, 1.1], [.45, -0.7], [1, 0]], el: [[0, 0], [.22, -0.6], [.45, 0.45], [1, 0]],
      swX: [[0, 0], [.22, -0.3], [.45, 0.25], [1, 0]], twist: [[0, 0], [.22, 0.55], [.45, -0.5], [1, 0]], lean: [[0, -0.05], [.22, -0.1], [.45, 0.3], [1, 0]],
      lunge: [[0, 0], [.22, 0], [.42, 1], [.75, 0.8], [1, 0]], vel: [[0, 0], [.22, 0], [.34, 4.4], [.52, 0]],
    },
    combo3: { // batida: o escudo vai à frente com o peso do corpo
      shLX: [[0, 0], [.2, -0.3], [.4, -1.7], [.7, -1.2], [1, 0]], elL: [[0, 0], [.2, -0.8], [.4, 0.4], [1, 0]], face: [[0, 0], [.15, 1], [.8, 1], [1, 0]],
      shX: [[0, 0], [.3, 0.5], [.8, 0.3], [1, 0]], lean: [[0, 0], [.2, -0.1], [.4, 0.45], [.8, 0.2], [1, 0]], twist: [[0, 0], [.2, -0.3], [.4, 0.3], [1, 0]],
      lunge: [[0, 0], [.2, 0], [.4, 1], [1, 0.4]], vel: [[0, 0], [.2, 0], [.3, 5], [.45, 0]], crouch: [[0, 0], [.2, 0.02], [.4, 0.08], [1, 0]],
    },
    combo4: { // corte diagonal de cima, gira e golpeia de novo
      // giro: braço da espada totalmente esticado na horizontal e lâmina alinhada ao braço, varrendo o círculo
      shX: [[0, 0], [.12, -2.7], [.3, -0.95], [.4, -0.6], [.46, -0.3], [.82, -0.3], [.92, -1.0], [1, 0]],
      shZ: [[0, 0], [.12, 0.3], [.3, -0.6], [.4, 1.0], [.46, 1.5], [.82, 1.5], [.92, 0.4], [1, 0]],
      el: [[0, 0], [.12, -0.5], [.3, 0.5], [.4, 0.5], [.82, 0.5], [.92, 0], [1, 0]],
      swX: [[0, 0], [.3, 0], [.42, 1.85], [.82, 1.85], [.93, 0], [1, 0]],
      shLX: [[0, 0], [.4, -0.3], [.5, -1.0], [.82, -1.0], [1, 0]], shLZ: [[0, 0], [.5, 0.9], [.82, 0.9], [1, 0]],
      twist: [[0, 0], [.12, 0.5], [.3, -0.55], [.45, 0.2], [.8, 0], [1, 0]], lean: [[0, 0], [.12, -0.15], [.3, 0.35], [.5, 0.18], [.8, 0.2], [1, 0]],
      lunge: [[0, 0], [.3, 1], [.5, 0.3], [1, 0]], vel: [[0, 0], [.2, 0], [.3, 3.6], [.42, 0]],
      spin: [[0, 0], [.46, 0], [.82, PI2], [1, PI2]], crouch: [[0, 0], [.5, 0.03], [.82, 0.06], [1, 0]],
    },
    slam: {
      crouch: [[0, 0], [.18, 0.16], [.28, 0], [.62, 0], [.7, 0.14], [.86, 0.12], [1, 0]], jump: [[0, 0], [.2, 0], [.38, 2.6], [.48, 3.1], [.58, 2.2], [.66, 0], [1, 0]],
      shX: [[0, 0], [.18, -1.0], [.4, -3.1], [.5, -3.0], [.66, -0.9], [.86, -0.8], [1, 0]], shZ: [[0, 0], [.4, 0.2], [1, 0]], el: [[0, 0], [.4, -0.2], [.66, 0.6], [1, 0]],
      swX: [[0, 0], [.4, 0], [.66, 1.9], [.9, 1.9], [1, 0]], lean: [[0, 0.15], [.4, -0.25], [.66, 0.4], [.86, 0.3], [1, 0]],
      shLX: [[0, 0], [.4, -0.8], [.66, -0.3], [1, 0]], vel: [[0, 0], [.22, 0], [.4, 3.4], [.64, 2.5], [.7, 0]],
    },
    bash: {
      shLX: [[0, -1.0], [.15, -1.2], [.55, -1.2], [.62, -1.9], [.8, -0.6], [1, 0]], elL: [[0, -0.7], [.55, -0.7], [.62, 0.5], [1, 0]], shLZ: [[0, 0.3], [1, 0.1]],
      face: [[0, 1], [.85, 1], [1, 0]], lean: [[0, 0.35], [.55, 0.4], [.62, 0.55], [1, 0]], shX: [[0, 0.55], [.9, 0.55], [1, 0]], el: [[0, -0.4], [1, 0]],
      vel: [[0, 0], [.1, 8.8], [.55, 8.8], [.64, 1], [.76, 0]], crouch: [[0, 0.04], [.6, 0.05], [1, 0]],
    },
    rush: { // investida de lâmina: corre baixa ~7 m com a espada estendida ao lado cortando quem atravessa; no fim, escudada violenta
      shX: [[0, 0], [.08, -0.35], [.6, -0.3], [.72, 0.6], [.84, 0.5], [1, 0]], shZ: [[0, 0], [.08, 1.55], [.6, 1.5], [.72, 0.2], [1, 0]], el: [[0, 0], [.08, 0.35], [.6, 0.35], [.72, -0.4], [1, 0]],
      swX: [[0, 0], [.08, 1.85], [.6, 1.85], [.72, 0.2], [1, 0]],
      shLX: [[0, 0], [.08, -0.7], [.6, -0.7], [.66, -0.4], [.74, -1.75], [.88, -1.3], [1, 0]], elL: [[0, 0], [.08, -1.2], [.6, -1.2], [.66, -1.4], [.74, 0.3], [.88, 0.1], [1, 0]], shLZ: [[0, 0], [.08, 0.1], [.74, 0.25], [1, 0]], face: [[0, 0], [.08, 1], [.9, 1], [1, 0]],
      lean: [[0, 0], [.08, 0.45], [.6, 0.45], [.66, 0.25], [.74, 0.55], [.88, 0.35], [1, 0]], tilt: [[0, 0], [.08, 0.25], [.6, 0.25], [.7, 0], [1, 0]], crouch: [[0, 0], [.08, 0.1], [.6, 0.1], [.74, 0.12], [1, 0]], twist: [[0, 0], [.08, 0.35], [.6, 0.35], [.66, -0.2], [.74, -0.5], [1, 0]],
      lunge: [[0, 0], [.66, 0], [.74, 1], [.9, 0.6], [1, 0]], vel: [[0, 0], [.05, 12], [.62, 12], [.7, 6], [.76, 0]], head: [[0, 0], [.08, -0.15], [.6, -0.15], [.74, 0.1], [1, 0]],
    },
    /* ---- magias nórdicas novas (faixa 1–20) ---- */
    kick: { // chute de escudo: gira o quadril, sobe o joelho da frente e estica a perna contra a borda do escudo
      lgLH: [[0, 0], [.28, -1.25], [.42, -1.55], [.62, -1.45], [.82, -0.3], [1, 0]], lgLK: [[0, 0], [.28, 1.7], [.42, 0.12], [.62, 0.2], [.82, 0.7], [1, 0]], lgRK: [[0, 0], [.3, 0.22], [.7, 0.2], [1, 0]],
      lean: [[0, 0], [.28, -0.18], [.42, -0.32], [.7, -0.22], [1, 0]], twist: [[0, 0], [.28, 0.35], [.42, -0.15], [1, 0]], shLX: [[0, 0], [.28, -1.2], [.42, -1.5], [.75, -1.2], [1, 0]], elL: [[0, 0], [.28, -0.8], [.42, -0.2], [1, 0]], face: [[0, 0], [.15, 1], [.85, 1], [1, 0]],
      shX: [[0, 0], [.3, 0.7], [.8, 0.6], [1, 0]], el: [[0, 0], [.3, -1.0], [.8, -0.9], [1, 0]], vel: [[0, 0], [.36, 0], [.42, 3], [.55, 0]], jump: [[0, 0], [.4, 0.04], [.6, 0.02], [1, 0]],
    },
    lowcut: { // corte nos tendões: cai num joelho e varre a lâmina rente ao chão, da direita para a esquerda
      kn: [[0, 0], [.22, 0.9], [.72, 0.9], [1, 0]], shX: [[0, 0], [.22, -1.0], [.48, -0.85], [.72, -0.8], [1, 0]], shZ: [[0, 0], [.22, 0.85], [.48, -0.85], [.72, -0.95], [1, 0]], el: [[0, 0], [.22, -0.35], [.48, 0.2], [1, 0]],
      swX: [[0, 0], [.22, 0.2], [.72, 0.2], [1, 0]], twist: [[0, 0], [.22, 0.75], [.48, -0.65], [.72, -0.6], [1, 0]], lean: [[0, 0], [.22, 0.35], [.48, 0.55], [.75, 0.45], [1, 0]],
      shLX: [[0, 0], [.22, -0.5], [.48, 0.3], [1, 0]], shLZ: [[0, 0], [.48, -0.3], [1, 0]], vel: [[0, 0], [.12, 3.2], [.3, 0]], head: [[0, 0], [.22, 0.15], [.72, 0.1], [1, 0]],
    },
    plant: { // parede de escudos: ergue o escudo alto e finca a borda no chão à frente, firmando no joelho
      shLX: [[0, 0], [.3, -2.5], [.52, -1.05], [.85, -1.05], [1, 0]], elL: [[0, 0], [.3, -0.5], [.52, 0.15], [.85, 0.15], [1, 0]], shLZ: [[0, 0], [.3, 0.25], [.52, 0.1], [1, 0]], face: [[0, 1], [.9, 1], [1, 0]],
      crouch: [[0, 0], [.3, -0.02], [.52, 0.17], [.85, 0.15], [1, 0]], lean: [[0, 0], [.3, -0.18], [.52, 0.42], [.85, 0.36], [1, 0]], lunge: [[0, 0], [.45, 0.2], [.55, 1], [.85, 1], [1, 0]],
      twist: [[0, 0], [.3, -0.2], [.52, -0.35], [.85, -0.3], [1, 0]], shX: [[0, 0], [.52, 0.7], [.85, 0.6], [1, 0]], el: [[0, 0], [.52, -1.1], [1, 0]], head: [[0, 0], [.3, -0.2], [.52, 0.1], [1, 0]],
    },
    breath: { // sopro do inverno: leva a mão à boca, inspira e empurra a palma aberta; o vento gelado sai à frente
      shLX: [[0, 0], [.28, -2.15], [.45, -2.15], [.58, -1.55], [.86, -1.5], [1, 0]], elL: [[0, 0], [.28, -1.95], [.45, -1.95], [.58, -0.05], [.86, -0.1], [1, 0]], shLZ: [[0, 0], [.28, -0.4], [.58, 0.05], [1, 0]],
      head: [[0, 0], [.28, -0.12], [.45, 0.06], [.58, -0.06], [1, 0]], lean: [[0, 0], [.28, -0.1], [.45, -0.14], [.58, 0.24], [.86, 0.2], [1, 0]], twist: [[0, 0], [.28, -0.15], [.58, -0.5], [.86, -0.45], [1, 0]],
      lunge: [[0, 0], [.5, 0], [.6, 0.65], [.86, 0.6], [1, 0]], shX: [[0, 0], [.4, 0.6], [.86, 0.55], [1, 0]], el: [[0, 0], [.4, -1.0], [1, 0]], crouch: [[0, 0], [.58, 0.06], [.86, 0.05], [1, 0]],
    },
    skyraise: { // lâmina trovejante: ergue a espada ao céu, o raio desce, e ela abaixa a lâmina carregada em guarda
      shX: [[0, 0], [.28, -3.05], [.66, -3.1], [.82, -1.1], [1, 0]], shZ: [[0, 0], [.28, 0.12], [.66, 0.1], [1, 0]], el: [[0, 0], [.28, -0.08], [.66, -0.08], [.82, -0.6], [1, 0]],
      lean: [[0, 0], [.28, -0.22], [.66, -0.2], [.82, 0.22], [1, 0]], head: [[0, 0], [.28, -0.4], [.66, -0.35], [.82, 0.05], [1, 0]], crouch: [[0, 0], [.28, -0.03], [.66, -0.03], [.76, 0.1], [1, 0]],
      shLX: [[0, 0], [.28, -0.7], [.66, -0.6], [1, 0]], shLZ: [[0, 0], [.28, 0.45], [.66, 0.4], [1, 0]], twist: [[0, 0], [.28, 0.12], [.82, 0.3], [1, 0]],
    },
    stance: { // contra-golpe da valquíria: postura de espera, baixa, escudo à frente e espada recolhida atrás
      shX: [[0, 0], [.1, 0.95], [.9, 0.95], [1, 0]], el: [[0, 0], [.1, -1.25], [.9, -1.25], [1, 0]], shZ: [[0, 0], [.1, -0.2], [.9, -0.2], [1, 0]], swX: [[0, 0], [.1, 0.6], [.9, 0.6], [1, 0]],
      shLX: [[0, 0], [.1, -1.15], [.9, -1.15], [1, 0]], elL: [[0, 0], [.1, -1.05], [.9, -1.05], [1, 0]], face: [[0, 0], [.08, 1], [.92, 1], [1, 0]],
      crouch: [[0, 0], [.1, 0.17], [.9, 0.17], [1, 0]], lean: [[0, 0], [.1, 0.28], [.9, 0.28], [1, 0]], twist: [[0, 0], [.1, 0.55], [.9, 0.55], [1, 0]], head: [[0, 0], [.1, -0.15], [.9, -0.15], [1, 0]],
      lunge: [[0, 0], [.1, 0.45], [.9, 0.45], [1, 0]],
    },
    /* ---- tecnocrata ---- */
    shoot: { // rifle ao ombro: as duas mãos à frente, coice para trás no disparo, tronco de lado
      shX: [[0, 0], [.1, -1.35], [.2, -1.15], [.3, -1.35], [.75, -1.3], [1, 0]], shZ: [[0, 0], [.1, 0.25], [.75, 0.25], [1, 0]], el: [[0, 0], [.1, -0.35], [.2, -0.6], [.3, -0.35], [1, 0]],
      shLX: [[0, 0], [.1, -1.4], [.2, -1.25], [.3, -1.4], [.75, -1.35], [1, 0]], shLZ: [[0, 0], [.1, 0.35], [.75, 0.35], [1, 0]], elL: [[0, 0], [.1, -0.6], [1, 0]],
      twist: [[0, 0], [.1, -0.55], [.75, -0.5], [1, 0]], lean: [[0, 0], [.1, 0.1], [.18, -0.08], [.3, 0.08], [.75, 0.08], [1, 0]], crouch: [[0, 0], [.1, 0.05], [.75, 0.05], [1, 0]], head: [[0, 0], [.1, 0.12], [.75, 0.12], [1, 0]],
    },
    throw: { // granada: recua o braço, arremesso por cima
      shX: [[0, 0], [.26, 1.5], [.46, -2.3], [.7, -1.5], [1, 0]], el: [[0, 0], [.26, -1.4], [.46, -0.15], [1, 0]], shZ: [[0, 0], [.26, 0.3], [.46, 0.1], [1, 0]],
      twist: [[0, 0], [.26, 0.7], [.46, -0.55], [1, 0]], lean: [[0, 0], [.26, -0.22], [.46, 0.32], [.7, 0.15], [1, 0]], lunge: [[0, 0], [.3, 0], [.5, 1], [.8, 0.5], [1, 0]], crouch: [[0, 0], [.46, 0.06], [1, 0]],
      shLX: [[0, 0], [.26, -0.9], [.46, -0.3], [1, 0]], elL: [[0, 0], [.26, -0.6], [1, 0]],
    },
    jet: { // impulso a jato: corpo deitado para a frente, braços para trás
      tilt: [[0, 0], [.12, 0.7], [.8, 0.65], [1, 0]], lean: [[0, 0], [.12, 0.3], [.8, 0.3], [1, 0]], crouch: [[0, 0], [.12, 0.05], [1, 0]], jump: [[0, 0], [.12, 0.18], [.8, 0.16], [1, 0]],
      shX: [[0, 0], [.12, 1.7], [.8, 1.6], [1, 0]], shLX: [[0, 0], [.12, 1.5], [.8, 1.5], [1, 0]], el: [[0, 0], [.12, 0.3], [1, 0]], elL: [[0, 0], [.12, 0.3], [1, 0]], shZ: [[0, 0], [.12, 0.4], [.8, 0.4], [1, 0]], shLZ: [[0, 0], [.12, -0.4], [.8, -0.4], [1, 0]],
      vel: [[0, 0], [.08, 14], [.72, 14], [.84, 0]], head: [[0, 0], [.12, -0.35], [.8, -0.3], [1, 0]],
    },
    /* ---- anão ---- */
    cleave1: { // varredura com as duas mãos: martelo recua à direita e abaixo, cruza na horizontal, corpo gira junto
      shX: [[0, 0], [.22, 0.9], [.46, -1.35], [.72, -1.1], [1, 0]], shZ: [[0, 0], [.22, -1.35], [.46, 1.15], [.72, 0.85], [1, 0]], el: [[0, 0], [.22, -0.7], [.46, 0.1], [1, 0]],
      shLX: [[0, 0], [.22, -0.1], [.46, -1.3], [.72, -1.1], [1, 0]], shLZ: [[0, 0], [.22, 0.7], [.46, 0.35], [1, 0]], elL: [[0, 0], [.22, -1.5], [.46, -0.5], [1, 0]],
      swX: [[0, 0], [.22, 1.0], [.46, -1.45], [.72, -1.25], [1, 0]], twist: [[0, 0], [.22, -0.95], [.46, 0.75], [.72, 0.5], [1, 0]], lean: [[0, 0], [.22, -0.15], [.46, 0.35], [.72, 0.25], [1, 0]],
      lunge: [[0, 0], [.22, 0], [.46, 1], [.8, 0.6], [1, 0]], vel: [[0, 0], [.22, 0], [.34, 4.5], [.52, 0]], crouch: [[0, 0], [.22, 0.03], [.46, 0.09], [1, 0]], head: [[0, 0], [.22, -0.1], [.46, 0.15], [1, 0]],
    },
    cleave4: { // varredura de volta, da esquerda para a direita (espelho da primeira)
      shX: [[0, -1.1], [.2, -0.6], [.46, 0.3], [.72, 0.1], [1, 0]], shZ: [[0, 0.85], [.2, 1.3], [.46, -1.0], [.72, -0.8], [1, 0]], el: [[0, 0], [.2, -0.4], [.46, -0.9], [.72, -0.5], [1, 0]],
      shLX: [[0, -1.1], [.2, -1.3], [.46, -0.2], [.72, 0], [1, 0]], shLZ: [[0, 0.35], [.2, 0.2], [.46, 0.9], [1, 0]], elL: [[0, -0.5], [.2, -0.4], [.46, -1.2], [1, 0]],
      swX: [[0, -1.25], [.2, -1.4], [.46, 0.3], [.72, 0.2], [1, 0]], twist: [[0, 0.5], [.2, 0.8], [.46, -0.85], [.72, -0.5], [1, 0]], lean: [[0, 0.25], [.2, -0.1], [.46, 0.35], [.72, 0.2], [1, 0]],
      lunge: [[0, 0.3], [.2, 0], [.46, 1], [.8, 0.6], [1, 0]], vel: [[0, 0], [.2, 0], [.34, 4.5], [.52, 0]], crouch: [[0, 0.05], [.2, 0.03], [.46, 0.09], [1, 0]], head: [[0, 0], [.2, -0.1], [.46, 0.15], [1, 0]],
    },
    cleave2: { // racha de cima para baixo, com as duas mãos
      shX: [[0, 0], [.26, -2.9], [.42, -0.25], [.66, -0.15], [1, 0]], el: [[0, 0], [.26, -1.0], [.42, 0.15], [1, 0]], shZ: [[0, 0], [.26, 0.3], [.42, 0.1], [1, 0]],
      swX: [[0, 0], [.26, -0.6], [.42, -1.75], [.66, -1.75], [1, 0]], lean: [[0, 0], [.26, -0.38], [.42, 0.6], [.66, 0.5], [1, 0]], crouch: [[0, 0], [.26, 0], [.42, 0.18], [.7, 0.14], [1, 0]], head: [[0, 0], [.26, -0.25], [.42, 0.3], [1, 0]],
      lunge: [[0, 0], [.26, 0.2], [.42, 1], [.8, 0.7], [1, 0]], vel: [[0, 0], [.26, 0], [.36, 4.8], [.5, 0]], shLX: [[0, 0], [.26, -2.6], [.42, -0.5], [1, 0]], elL: [[0, 0], [.26, -1.2], [.42, 0], [1, 0]], shLZ: [[0, 0], [.26, 0.25], [1, 0]],
    },
    cleave3: { // giro completo com o machado na horizontal, braços abertos
      spin: [[0, 0], [.28, 0], [.76, PI2], [1, PI2]], shX: [[0, 0], [.28, -0.35], [.76, -0.35], [.9, -0.8], [1, 0]], shZ: [[0, 0], [.28, 1.45], [.76, 1.45], [.9, 0.3], [1, 0]], el: [[0, 0], [.28, 0.25], [.9, 0], [1, 0]],
      swX: [[0, 0], [.28, -1.3], [.76, -1.3], [.9, 0], [1, 0]], shLX: [[0, 0], [.28, -0.35], [.76, -0.35], [1, 0]], shLZ: [[0, 0], [.28, -1.2], [.76, -1.2], [1, 0]],
      lean: [[0, 0], [.28, 0.22], [.8, 0.22], [1, 0]], crouch: [[0, 0], [.28, 0.09], [.8, 0.09], [1, 0]], vel: [[0, 0], [.28, 2.8], [.76, 2.8], [.86, 0]], twist: [[0, 0], [.15, -0.5], [.28, 0], [1, 0]],
    },
    quake: { // terremoto: ergue o machado com as duas mãos, salta e crava no chão
      crouch: [[0, 0], [.18, 0.18], [.28, 0], [.62, 0], [.7, 0.16], [.86, 0.13], [1, 0]], jump: [[0, 0], [.2, 0], [.38, 2.5], [.48, 3.0], [.58, 2.1], [.66, 0], [1, 0]],
      shX: [[0, 0], [.18, -1.2], [.4, -3.1], [.5, -3.0], [.66, -0.5], [.86, -0.4], [1, 0]], shLX: [[0, 0], [.18, -1.2], [.4, -3.0], [.5, -2.9], [.66, -0.6], [.86, -0.5], [1, 0]], el: [[0, 0], [.4, -0.2], [.66, 0.2], [1, 0]], elL: [[0, 0], [.4, -0.3], [.66, 0.2], [1, 0]],
      swX: [[0, 0], [.4, -0.3], [.66, -1.75], [.9, -1.75], [1, 0]], shLZ: [[0, 0], [.4, 0.35], [1, 0]], shZ: [[0, 0], [.4, -0.35], [1, 0]], lean: [[0, 0.15], [.4, -0.3], [.66, 0.45], [.86, 0.35], [1, 0]],
      vel: [[0, 0], [.22, 0], [.4, 3.4], [.64, 2.5], [.7, 0]],
    },
    charge: { // investida de ombro: pauldron à frente, corpo baixo
      twist: [[0, 0.5], [.6, 0.6], [.75, 0.2], [1, 0]], lean: [[0, 0.3], [.6, 0.35], [.72, 0.45], [1, 0]], tilt: [[0, 0.1], [.6, 0.12], [1, 0]], crouch: [[0, 0.08], [.65, 0.1], [1, 0]],
      shLX: [[0, -0.5], [.6, -0.6], [.72, -1.3], [1, 0]], elL: [[0, -1.6], [.6, -1.6], [.72, -0.6], [1, 0]], shLZ: [[0, 0.5], [.75, 0.4], [1, 0]], shX: [[0, 0.9], [.6, 0.9], [1, 0]], el: [[0, -0.3], [1, 0]],
      vel: [[0, 0], [.1, 9], [.6, 9], [.7, 0.5], [.82, 0]],
    },
    dance: { // /dance (28/10, Erling): oito tempos — bate o pé, ginga o quadril, um braço sobe de cada vez, e no fim uma volta inteira
      crouch: [[0, 0], [.0625, 0.09], [.125, 0], [.1875, 0.09], [.25, 0], [.3125, 0.09], [.375, 0], [.4375, 0.09], [.5, 0], [.5625, 0.09], [.625, 0], [.6875, 0.09], [.75, 0], [.8125, 0.07], [.875, 0.02], [1, 0]],
      twist: [[0, 0], [.125, 0.45], [.25, -0.45], [.375, 0.45], [.5, -0.45], [.625, 0.45], [.75, -0.45], [.85, 0], [1, 0]], tilt: [[0, 0], [.125, 0.14], [.375, -0.14], [.625, 0.14], [.85, -0.1], [1, 0]],
      shX: [[0, 0], [.125, -2.7], [.25, -0.5], [.375, -2.7], [.5, -0.5], [.625, -1.2], [.75, -2.9], [.9, -2.9], [1, 0]], shZ: [[0, 0], [.125, 0.5], [.25, 1.1], [.5, 1.1], [.75, 0.4], [1, 0]], el: [[0, 0], [.125, -0.7], [.25, -1.5], [.375, -0.7], [.5, -1.5], [.75, -0.3], [1, 0]],
      shLX: [[0, 0], [.125, -0.5], [.25, -2.7], [.375, -0.5], [.5, -2.7], [.625, -1.2], [.75, -2.9], [.9, -2.9], [1, 0]], shLZ: [[0, 0], [.25, 1.1], [.5, 1.1], [.75, 0.4], [1, 0]], elL: [[0, 0], [.125, -1.5], [.25, -0.7], [.375, -1.5], [.5, -0.7], [.75, -0.3], [1, 0]],
      lgLH: [[0, 0], [.0625, -0.5], [.125, 0], [.3125, -0.5], [.375, 0], [.5625, -0.5], [.625, 0], [1, 0]], lgLK: [[0, 0], [.0625, 0.8], [.125, 0], [.3125, 0.8], [.375, 0], [.5625, 0.8], [.625, 0], [1, 0]],
      lgRH: [[0, 0], [.1875, -0.5], [.25, 0], [.4375, -0.5], [.5, 0], [.6875, -0.5], [.75, 0], [1, 0]], lgRK: [[0, 0], [.1875, 0.8], [.25, 0], [.4375, 0.8], [.5, 0], [.6875, 0.8], [.75, 0], [1, 0]],
      head: [[0, 0], [.125, 0.15], [.25, -0.1], [.375, 0.15], [.5, -0.1], [.75, -0.25], [1, 0]], spin: [[0, 0], [.8, 0], [.96, PI2], [1, PI2]], jump: [[0, 0], [.8, 0], [.86, 0.18], [.92, 0], [1, 0]],
    },
    drink: { // chifre de hidromel: leva à boca, cabeça para trás, bate no peito
      shX: [[0, 0], [.25, -1.9], [.65, -2.0], [.8, -0.9], [1, 0]], el: [[0, 0], [.25, -2.3], [.65, -2.4], [.8, -1.2], [1, 0]], shZ: [[0, 0], [.25, -0.35], [.65, -0.35], [1, 0]],
      head: [[0, 0], [.3, -0.2], [.6, -0.5], [.78, 0], [1, 0]], lean: [[0, 0], [.3, -0.1], [.6, -0.2], [.8, 0.1], [1, 0]], shLX: [[0, 0], [.8, 0], [.88, -0.9], [1, 0]], elL: [[0, 0], [.8, 0], [.88, -1.6], [1, 0]],
    },
  };
  const kf = (p: number, k?: [number, number][]) => {
    if (!k) return 0;
    if (p <= k[0][0]) return k[0][1];
    for (let i = 1; i < k.length; i++) if (p <= k[i][0]) return lerp(k[i - 1][1], k[i][1], ease((p - k[i - 1][0]) / (k[i][0] - k[i - 1][0])));
    return k[k.length - 1][1];
  };
  const sm: Record<string, number> = {};
  const smooth1 = (key: string, v: number, dt: number, rate = 26) => (sm[key] = (sm[key] ?? v) + (v - (sm[key] ?? v)) * Math.min(1, dt * rate));
  let stK = 0, guardK = 0, stepVel = 0, recoil = 0, shieldF = 0, dashLeadL = true, combatK = 0, muzzleK = 0, slashK = 0, kneelK = 0, swimK = 0, swimMv = 0;
  const qRoot = new THREE.Quaternion(), qPar = new THREE.Quaternion(), qDes = new THREE.Quaternion(), qLoc = new THREE.Quaternion(), eDes = new THREE.Euler();
  const tmp = new V();
  const smooth = { lean: 0, hipRoll: 0, tilt: 0 };

  const hero: Hero3D = {
    root,
    kind,
    get facing() { return yaw; },
    get acting() { return act !== null && act.a !== 'dash'; },
    stopAct() { act = null; },
    cuffPos(out: THREE.Vector3) { return (cuff && cuff.visible ? cuff : armL.wr).getWorldPosition(out); },
    get actName() { return act ? act.a : null; },
    get actP() { return act ? clamp(act.t / act.dur, 0, 1) : 0; },
    get stepVel() { return stepVel; },
    guard: false,
    combat: false, stance: 'bal',
    riding: false,
    droneTo: null, droneFlash: 0, actSpeed: 1,
    muzzle() { muzzleK = 1; },
    slash() { slashK = 1; },
    dronePos(out) { return droneObj ? droneObj.getWorldPosition(out) : out.copy(root.position).add(tmp.set(0, 1.6, 0)); },
    blockHit() { recoil = 1; },
    get guarding() { return guardK > 0.6; },
    freeze: false,
    holdTool: false,
    kneel: false, swim: false,
    scrub(a, p) { act = { a, t: p * DUR[a], dur: DUR[a] }; },
    act(a, force) {
      if (!force && act && act.a !== 'dash' && act.a !== 'hit' && a !== 'hit' && a !== 'dash') {
        /* magias e golpes especiais têm prioridade: cortam o ataque básico na hora (a resposta tem que ser imediata) */
        const canCancel = (COMBO.has(act.a) && COMBO.has(a) && act.t / act.dur > 0.62) || (COMBO.has(act.a) && !COMBO.has(a));
        if (!canCancel) return false;
      }
      if (a === 'dash') dashLeadL = Math.sin(phase) >= 0;
      if (a === 'dodge') dodgeSide = Math.random() < 0.5 ? -1 : 1;
      act = { a, t: 0, dur: DUR[a] / (COMBO.has(a) ? hero.actSpeed || 1 : 1) }; return true;
    },
    setAura(on) { auraOn = on; },
    setGear(g) {
      const RC: Record<string, number> = { magic: 0x3a6aff, rare: 0xffd24a, legendary: 0xff7a20, relic: 0xb060ff };
      const glowOf = (rar: string) => RC[rar] ?? 0;
      const metal = (rar: string, base = 0xdde3ec, k = 0.35) => toon(base, glowOf(rar) ? { emissive: new THREE.Color(glowOf(rar)).multiplyScalar(k) } : {});
      /* arma (só a nórdica tem a espada trocável; anão e tecnocrata mantêm martelo e rifle) */
      if (gearSword && g.weapon !== undefined) {
        const sw = gearSword; for (const c of [...sw.children]) if ((c as THREE.Mesh).isMesh || (c as THREE.Group).isGroup) sw.remove(c); let RG: THREE.Group | null = null; // RG: armas de duas mãos (fogo e besta), no suporte da raiz
        for (const c of [...gunHolder.children]) gunHolder.remove(c); if (gunOn) { gunOn = false; if (gunTip0) weaponTipObj = gunTip0; if (gunBase0) weaponBaseObj = gunBase0; }
        const base = g.weapon?.base ?? 'Espada Longa', rar = g.weapon?.rarity ?? 'normal', tint = g.weapon?.tint, tglow = g.weapon?.glow ?? 0;
        const tMat = (def: number) => toon(tint ?? def, tglow ? { emissive: new THREE.Color(tglow).multiplyScalar(0.45) } : {}); // ferramentas: o metal diz o nível (pedra, ferro, aço, anão)
        const grip = mk(new THREE.CylinderGeometry(0.016, 0.016, 0.17, 6), 0x3a2a1c, 0.004); sw.add(grip);
        const pom = mk(new THREE.SphereGeometry(0.034, 6, 5), glowOf(rar) || gold, 0.004); pom.position.y = 0.105; sw.add(pom);
        let len = 0.84, wid = 0.07;
        if (base === 'Adaga') { len = 0.42; wid = 0.05; } else if (base === 'Espada Curta') { len = 0.62; wid = 0.065; } else if (base === 'Montante') { len = 1.12; wid = 0.085; } else if (base === 'Lança') { len = 1.3; wid = 0.04; }
        if (base === 'Machado de Guerra') {
          const haft = mk(new THREE.CylinderGeometry(0.02, 0.022, 0.9, 7), 0x4a3220, 0.004); haft.position.y = -0.45; sw.add(haft);
          const headA = mk(new THREE.BoxGeometry(0.3, 0.26, 0.03), 0x8a929e, 0.006, metal(rar, 0x8a929e)); headA.position.set(0.14, -0.78, 0); sw.add(headA);
          const edge = mk(new THREE.BoxGeometry(0.04, 0.32, 0.034), 0xdde3ec, 0.004, metal(rar)); edge.position.set(0.3, -0.78, 0); sw.add(edge);
          len = 0.9;
        } else if (base === 'Machado de Lenhador') { // cabo longo e curvo, cunha grossa de um lado só
          const haft = mk(new THREE.CylinderGeometry(0.019, 0.024, 0.95, 7), 0x6a4a2a, 0.004); haft.position.y = -0.47; sw.add(haft);
          const wedge = new THREE.CylinderGeometry(0.11, 0.11, 0.05, 3, 1); wedge.rotateX(Math.PI / 2); wedge.scale(1.6, 1.25, 1); const headA = mk(wedge, tint ?? 0x8a929e, 0.006, tMat(0x8a929e)); headA.position.set(0.12, -0.84, 0); sw.add(headA);
          const poll = mk(new THREE.BoxGeometry(0.07, 0.09, 0.06), tint ?? 0x8a929e, 0.004, tMat(0x8a929e)); poll.position.set(-0.03, -0.84, 0); sw.add(poll);
          const edge = mk(new THREE.BoxGeometry(0.025, 0.2, 0.03), 0xe8edf2, 0.003, tMat(0xe8edf2)); edge.position.set(0.28, -0.84, 0); sw.add(edge);
          len = 0.95;
        } else if (base === 'Picareta') { // cabeça curva: bico comprido para a frente, enxó curta atrás
          const haft = mk(new THREE.CylinderGeometry(0.02, 0.024, 0.92, 7), 0x5a3a20, 0.004); haft.position.y = -0.46; sw.add(haft);
          const eye = mk(new THREE.BoxGeometry(0.08, 0.1, 0.07), tint ?? 0x6a6e78, 0.004, tMat(0x6a6e78)); eye.position.y = -0.88; sw.add(eye);
          const spike = new THREE.ConeGeometry(0.035, 0.36, 5); spike.rotateZ(-Math.PI / 2 - 0.25); const sp = mk(spike, tint ?? 0x8a929e, 0.005, tMat(0x8a929e)); sp.position.set(0.2, -0.84, 0); sw.add(sp);
          const adze = mk(new THREE.BoxGeometry(0.16, 0.035, 0.07), tint ?? 0x8a929e, 0.004, tMat(0x8a929e)); adze.position.set(-0.1, -0.86, 0); adze.rotation.z = 0.3; sw.add(adze);
          len = 0.92;
        } else if (base === 'Faca de Caça') { // lâmina curta de esfolar, ponta curva, cabo de chifre
          const hilt = mk(new THREE.CylinderGeometry(0.018, 0.02, 0.13, 6), 0xc8b89a, 0.004); hilt.position.y = -0.0; sw.add(hilt);
          const bolster = mk(new THREE.BoxGeometry(0.06, 0.02, 0.03), 0x8a6a3a, 0.003); bolster.position.y = -0.075; sw.add(bolster);
          const bl = new THREE.Shape(); bl.moveTo(-0.03, 0); bl.lineTo(0.03, 0); bl.quadraticCurveTo(0.04, -0.24, -0.006, -0.34); bl.quadraticCurveTo(-0.028, -0.17, -0.03, 0);
          const bg = new THREE.ExtrudeGeometry(bl, { depth: 0.008, bevelEnabled: false }); bg.translate(0, 0, -0.004); const bm = mk(bg, tint ?? 0xdde3ec, 0.003, tMat(0xdde3ec)); bm.position.y = -0.085; sw.add(bm);
          len = 0.32;
        } else if (base === 'Alicate de Ervas') { // alicate de herborista: dois cabos e mordentes curvos que cortam rente ao talo
          for (const sx of [-1, 1]) { const hnd = mk(new THREE.CylinderGeometry(0.011, 0.014, 0.16, 5), 0x6a4a2a, 0.003); hnd.position.set(sx * 0.018, 0.0, 0); hnd.rotation.z = sx * 0.12; sw.add(hnd);
            const jaw = mk(new THREE.BoxGeometry(0.02, 0.17, 0.014), tint ?? 0xb8bec6, 0.003, tMat(0xb8bec6)); jaw.position.set(-sx * 0.016, -0.17, 0); jaw.rotation.z = -sx * 0.18; sw.add(jaw); }
          const pin = mk(new THREE.CylinderGeometry(0.014, 0.014, 0.03, 8), tint ?? 0xb8bec6, 0.002, tMat(0xb8bec6)); pin.rotation.x = Math.PI / 2; pin.position.y = -0.08; sw.add(pin);
          len = 0.22;
        } else if (base === 'Vara de Pesca') { // vara longa e fina, carretel de madeira
          const pole = mk(new THREE.CylinderGeometry(0.008, 0.02, 2.1, 5), tint ?? 0x7a5a30, 0.003, tMat(0x7a5a30)); pole.position.y = -1.05; sw.add(pole);
          const reel = mk(new THREE.CylinderGeometry(0.045, 0.045, 0.04, 8), 0x4a3220, 0.003); reel.rotation.z = Math.PI / 2; reel.position.set(0.04, -0.2, 0); sw.add(reel);
          len = 2.0;
        } else if (base === 'Machado de Mão' || base === 'Machado Barbado') { // machado nórdico: cabo de freixo, lâmina barbada (o "queixo" desce pelo cabo)
          sw.remove(pom); grip.visible = false; const B = base === 'Machado Barbado', L = B ? 0.78 : 0.56; const haft = mk(new THREE.CylinderGeometry(0.018, 0.022, L, 7), 0x6a4a2a, 0.004); haft.position.y = -L / 2; sw.add(haft);
          for (let k = 0; k < 4; k++) { const wr2 = gm(new THREE.CylinderGeometry(0.024, 0.024, 0.03, 7), 'leatherD'); wr2.position.y = -0.03 - k * 0.04; sw.add(wr2); }
          const q = new THREE.Shape(), a = B ? 1.25 : 1; q.moveTo(0, 0.05 * a); q.lineTo(0.1 * a, 0.07 * a); q.quadraticCurveTo(0.2 * a, 0.1 * a, 0.24 * a, 0.12 * a); q.quadraticCurveTo(0.27 * a, -0.04 * a, 0.22 * a, -0.2 * a); q.quadraticCurveTo(0.12 * a, -0.16 * a, 0.08 * a, -0.06 * a); q.lineTo(0, -0.05 * a); q.closePath();
          const hg = new THREE.ExtrudeGeometry(q, { depth: 0.022, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 1 }); hg.translate(0, 0, -0.011); const hd = gm(hg, 'steel', glowOf(rar) || undefined); hd.position.y = -L + 0.06; sw.add(hd);
          const sock = gm(new THREE.CylinderGeometry(0.03, 0.03, 0.12, 8), 'dark'); sock.position.y = -L + 0.06; sw.add(sock);
          const ed = gm(new THREE.TorusGeometry(0.2 * a, 0.006, 3, 10, 1.6), 'steel'); ed.position.set(0.04 * a, -L + 0.02, 0); ed.rotation.z = -0.75; sw.add(ed);
          len = L;
        } else if (base === 'Arco Curto' || base === 'Arco Longo') { // arco recurvo: braços de madeira com pontas viradas, empunhadura de couro, corda
          sw.remove(pom); const H = base === 'Arco Longo' ? 0.78 : 0.55, bw = new THREE.Group(); bw.position.y = -0.06; bw.rotation.y = Math.PI / 2; sw.add(bw); // braços na vertical, barriga para a frente, corda do lado do arqueiro
          for (const sy of [-1, 1]) { const cv = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.05, sy * H * 0.45, 0), new THREE.Vector3(0.03, sy * H * 0.85, 0), new THREE.Vector3(-0.03, sy * H, 0)]);
            const limb = gm(new THREE.TubeGeometry(cv, 10, 0.016, 5), base === 'Arco Longo' ? 'leather' : 'leatherD'); bw.add(limb); const nock = gm(new THREE.SphereGeometry(0.014, 5, 4), 'bone'); nock.position.set(-0.03, sy * H, 0); bw.add(nock); }
          const grp2 = gm(new THREE.CylinderGeometry(0.024, 0.024, 0.12, 7), 'leatherD'); bw.add(grp2);
          const str = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, H * 2, 3), new THREE.MeshBasicMaterial({ color: 0xd8cfb8 })); str.position.x = -0.03; bw.add(str);
          len = 0.1;
        } else if (base === 'Besta de Repetição') { // dos caçadores de demônios: coronha escura, arco de aço, carregador de virotes em cima e alavanca
          sw.remove(pom); sw.remove(grip); RG = new THREE.Group(); RG.rotation.x = -Math.PI / 2; gunHolder.add(RG); const st2 = gm(new THREE.BoxGeometry(0.05, 0.62, 0.06), 'leatherD'); st2.position.y = -0.24; RG.add(st2);
          const rail = gm(new THREE.BoxGeometry(0.035, 0.5, 0.02), 'dark'); rail.position.set(0, -0.3, 0.04); RG.add(rail);
          const mag = gm(new THREE.BoxGeometry(0.06, 0.24, 0.07), 'iron'); mag.position.set(0, -0.3, 0.09); RG.add(mag);
          for (let k = 0; k < 4; k++) { const bt = gm(new THREE.CylinderGeometry(0.006, 0.006, 0.2, 4), 'bone'); bt.position.set(-0.015 + k * 0.01, -0.3, 0.13); RG.add(bt); }
          const lev = gm(new THREE.TorusGeometry(0.06, 0.008, 4, 10, Math.PI), 'steel'); lev.position.set(0, -0.2, 0.1); lev.rotation.y = Math.PI / 2; RG.add(lev);
          for (const sx of [-1, 1]) { const cv = new THREE.CatmullRomCurve3([new THREE.Vector3(0, -0.5, 0.04), new THREE.Vector3(sx * 0.14, -0.47, 0.04), new THREE.Vector3(sx * 0.24, -0.41, 0.02)]); RG.add(gm(new THREE.TubeGeometry(cv, 6, 0.012, 4), 'steel')); }
          const str = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.004, 0.004), new THREE.MeshBasicMaterial({ color: 0xc8c0a8 })); str.position.set(0, -0.4, 0.03); RG.add(str);
          const sk = gm(new THREE.SphereGeometry(0.03, 8, 6), 'bone'); sk.position.set(0, -0.04, 0.05); RG.add(sk); // caveirinha na coronha
          const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.018), new THREE.MeshBasicMaterial({ color: 0xc0202a })); gem.position.set(0, -0.5, 0.075); RG.add(gem);
          len = 0.4;
        } else if (base === 'Pistola de Latão') { // pistola dos tecnocratas: um cano de latão, tambor de cobre e cabo de nogueira
          sw.remove(pom); sw.remove(grip); RG = new THREE.Group(); RG.rotation.x = -Math.PI / 2; gunHolder.add(RG);
          const body = gm(new THREE.BoxGeometry(0.05, 0.12, 0.07), 'bronze'); body.position.set(0, -0.08, 0.03); RG.add(body);
          const grip2 = gm(new THREE.BoxGeometry(0.04, 0.05, 0.11), 'leatherD'); grip2.position.set(0, 0.0, -0.03); grip2.rotation.x = 0.35; RG.add(grip2);
          const br = gm(new THREE.CylinderGeometry(0.016, 0.014, 0.24, 8), 'dark'); br.position.set(0, -0.24, 0.05); RG.add(br);
          const drum = gm(new THREE.CylinderGeometry(0.035, 0.035, 0.05, 8), 'iron'); drum.position.set(0, -0.11, 0.05); RG.add(drum);
          const ring = gm(new THREE.CylinderGeometry(0.024, 0.024, 0.02, 10), 'bronze'); ring.position.set(0, -0.35, 0.05); RG.add(ring);
          const valve = gm(new THREE.TorusGeometry(0.018, 0.005, 4, 10), 'gold'); valve.position.set(0.035, -0.06, 0.03); valve.rotation.y = Math.PI / 2; RG.add(valve);
          len = 0.36;
        } else if (base === 'Metralhadora de Mão' || base === 'Lança-Chamas de Mão' || base === 'Lança-Veneno de Mão') { // armas dos tecnocratas: latão, cobre, válvulas
          sw.remove(pom); sw.remove(grip); RG = new THREE.Group(); RG.rotation.x = -Math.PI / 2; gunHolder.add(RG); const K = base[0] === 'M' ? 'smg' : base.includes('Chamas') ? 'flame' : 'venom';
          const body = gm(new THREE.BoxGeometry(0.07, 0.26, 0.09), 'bronze'); body.position.set(0, -0.14, 0.03); RG.add(body);
          const grip2 = gm(new THREE.BoxGeometry(0.045, 0.08, 0.1), 'leatherD'); grip2.position.set(0, 0.0, -0.01); RG.add(grip2);
          if (K === 'smg') { for (let k = 0; k < 3; k++) { const a2 = k / 3 * 6.283, br = gm(new THREE.CylinderGeometry(0.012, 0.012, 0.36, 6), 'dark'); br.position.set(Math.cos(a2) * 0.022, -0.42, 0.045 + Math.sin(a2) * 0.022); RG.add(br); }
            const ring = gm(new THREE.CylinderGeometry(0.04, 0.04, 0.03, 10), 'bronze'); ring.position.set(0, -0.55, 0.045); RG.add(ring); const ring2 = ring.clone(); ring2.position.y = -0.33; RG.add(ring2);
            const drum = gm(new THREE.CylinderGeometry(0.075, 0.075, 0.05, 14), 'iron'); drum.rotation.z = Math.PI / 2; drum.position.set(0, -0.16, -0.06); RG.add(drum);
            len = 0.5; }
          else { const pz = K === 'venom';
            const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.24, 10), pz ? new THREE.MeshBasicMaterial({ color: 0x5aff3a, transparent: true, opacity: 0.75 }) : gearMat('bronze')); tank.position.set(0, -0.15, -0.07); RG.add(tank);
            for (const y of [-0.04, -0.26]) { const cap = gm(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 10), 'iron'); cap.position.set(0, y, -0.07); RG.add(cap); }
            const hose = new THREE.CatmullRomCurve3([new THREE.Vector3(0, -0.27, -0.07), new THREE.Vector3(0, -0.33, -0.02), new THREE.Vector3(0, -0.3, 0.03)]); RG.add(gm(new THREE.TubeGeometry(hose, 6, 0.01, 4), 'dark'));
            const noz = gm(new THREE.CylinderGeometry(0.02, 0.016, 0.3, 8), pz ? 'bronze' : 'dark'); noz.position.set(0, -0.42, 0.045); RG.add(noz);
            const flare = gm(new THREE.CylinderGeometry(0.04, 0.022, 0.06, 10, 1, true), 'bronze'); flare.position.set(0, -0.6, 0.045); RG.add(flare);
            const pilot = new THREE.Mesh(new THREE.SphereGeometry(0.016, 6, 5), new THREE.MeshBasicMaterial({ color: pz ? 0x9aff5a : 0xff8a2a })); pilot.position.set(0, -0.64, 0.045); RG.add(pilot); // chama-piloto
            const valve = gm(new THREE.TorusGeometry(0.025, 0.006, 4, 10), 'gold'); valve.position.set(0.05, -0.1, -0.07); valve.rotation.y = Math.PI / 2; RG.add(valve);
            len = 0.52; }
        } else if (base === 'Porrete de Carvalho') { // licantropo de dia: tronco de carvalho que engrossa na ponta, nós e cravos de ferro
          const pts: THREE.Vector2[] = []; for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push(new THREE.Vector2(0.022 + 0.05 * t * t + 0.008 * Math.sin(t * 19), -t * 0.86)); } pts.push(new THREE.Vector2(0.0005, -0.9));
          const club = mk(new THREE.LatheGeometry(pts.reverse(), 9), 0x5a3a20, 0.004); club.position.y = -0.04; sw.add(club);
          for (let i = 0; i < 7; i++) { const a2 = i * 2.3, y2 = -0.55 - (i % 3) * 0.1; const sp = mk(new THREE.ConeGeometry(0.012, 0.06, 4), 0x6a6e78, 0.002, metal(rar, 0x6a6e78)); sp.position.set(Math.cos(a2) * 0.065, y2, Math.sin(a2) * 0.065); sp.rotation.set(Math.sin(a2) * 1.57, 0, -Math.cos(a2) * 1.57); sw.add(sp); }
          len = 0.9;
        } else if (base === 'Maça de Osso') { // cabo de freixo com tiras de couro e um crânio de touro amarrado na ponta, presas para fora
          const haft = mk(new THREE.CylinderGeometry(0.018, 0.022, 0.78, 7), 0x6a4a2a, 0.004); haft.position.y = -0.39; sw.add(haft);
          const skull = mk(new THREE.SphereGeometry(0.085, 10, 8), 0xe8dcc0, 0.004); skull.scale.set(0.9, 1.15, 1.2); skull.position.y = -0.8; sw.add(skull);
          for (const sx of [-1, 1]) { const horn = new THREE.ConeGeometry(0.022, 0.16, 6); horn.translate(0, 0.08, 0); const hm = mk(horn, 0xd8ccb0, 0.003); hm.position.set(sx * 0.07, -0.76, 0); hm.rotation.z = -sx * 1.1; sw.add(hm); }
          for (let i = 0; i < 3; i++) { const wr = mk(new THREE.TorusGeometry(0.024, 0.006, 4, 10), 0x3a2414, 0.002); wr.rotation.x = Math.PI / 2; wr.position.y = -0.62 - i * 0.03; sw.add(wr); }
          len = 0.88;
        } else if (base === 'Alabarda Tosca') { // haste longa, lâmina de machado batida a martelo, gancho atrás e ponta de lança
          const haft = mk(new THREE.CylinderGeometry(0.018, 0.022, 1.5, 7), 0x5a3a20, 0.004); haft.position.y = -0.62; sw.add(haft);
          const bladeS = new THREE.Shape(); bladeS.moveTo(0, 0); bladeS.quadraticCurveTo(0.22, 0.02, 0.26, -0.14); bladeS.quadraticCurveTo(0.2, -0.24, 0, -0.26); bladeS.lineTo(0, 0);
          const bg = new THREE.ExtrudeGeometry(bladeS, { depth: 0.014, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.006, bevelSegments: 1 }); bg.translate(0.015, 0, -0.007); const bl = mk(bg, 0x8a8e96, 0.003, metal(rar, 0x8a8e96)); bl.position.y = -1.08; sw.add(bl);
          const hook = mk(new THREE.ConeGeometry(0.02, 0.14, 4), 0x6a6e78, 0.002, metal(rar, 0x6a6e78)); hook.position.set(-0.07, -1.16, 0); hook.rotation.z = -1.2; sw.add(hook);
          const tipS = mk(new THREE.ConeGeometry(0.025, 0.22, 4), 0x9aa2ae, 0.002, metal(rar, 0x9aa2ae)); tipS.position.y = -1.45; tipS.rotation.z = Math.PI; sw.add(tipS);
          len = 1.45;
        } else if (base === 'Espada de Duelo') { // rapieira de vampiro: lâmina comprida e fina de seção losango, guarda em cesto com arco de mão e anel
          len = 0.98; const bl = new THREE.CylinderGeometry(0.003, 0.013, len, 4); bl.scale(1, 1, 0.45); const blade = mk(bl, 0xdde3ec, 0.004, metal(rar)); blade.position.y = -0.1 - len / 2; blade.rotation.y = Math.PI / 4; sw.add(blade);
          const ric = mk(new THREE.CylinderGeometry(0.012, 0.014, 0.1, 6), 0x9aa2ae, 0.003, metal(rar, 0x9aa2ae)); ric.position.y = -0.14; sw.add(ric);
          const q1 = mk(new THREE.CylinderGeometry(0.007, 0.007, 0.22, 6), 0x2a2a32, 0.003, metal(rar, 0x3a3440)); q1.rotation.z = Math.PI / 2; q1.position.y = -0.095; sw.add(q1);
          for (const sx of [-1, 1]) { const tip = mk(new THREE.SphereGeometry(0.012, 6, 5), glowOf(rar) || 0xb01a2a, 0.002); tip.position.set(sx * 0.11, -0.095, 0); sw.add(tip); }
          const ringG = mk(new THREE.TorusGeometry(0.035, 0.006, 5, 14), 0x2a2a32, 0.002, metal(rar, 0x3a3440)); ringG.position.set(0, -0.13, 0.0); ringG.rotation.y = Math.PI / 2; sw.add(ringG);
          const bow = mk(new THREE.TorusGeometry(0.075, 0.006, 5, 16, Math.PI), 0x2a2a32, 0.002, metal(rar, 0x3a3440)); bow.position.set(0, 0.0, 0.0); bow.rotation.set(0, Math.PI / 2, Math.PI / 2); bow.position.z = 0.0; bow.position.y = -0.02; sw.add(bow);
          const cup = mk(new THREE.SphereGeometry(0.05, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2.4), 0x3a3440, 0.002, metal(rar, 0x3a3440)); cup.position.y = -0.11; cup.rotation.x = Math.PI; sw.add(cup);
        } else if (base === 'Adaga Fina') { // estilete: lâmina curta de losango, quillons curvos para aparar, anel de dedo
          len = 0.4; const bl = new THREE.CylinderGeometry(0.002, 0.018, len, 4); bl.scale(1, 1, 0.5); const blade = mk(bl, 0xdde3ec, 0.004, metal(rar)); blade.position.y = -0.1 - len / 2; blade.rotation.y = Math.PI / 4; sw.add(blade);
          for (const sx of [-1, 1]) { const qg = new THREE.TorusGeometry(0.06, 0.007, 5, 10, Math.PI / 2); const q = mk(qg, 0x2a2a32, 0.002, metal(rar, 0x3a3440)); q.position.set(sx * 0.0, -0.1, 0); q.rotation.z = sx > 0 ? -Math.PI / 2 : Math.PI; sw.add(q); }
          const ringG = mk(new THREE.TorusGeometry(0.028, 0.006, 5, 12), 0x2a2a32, 0.002, metal(rar, 0x3a3440)); ringG.position.set(0, -0.135, 0.0); ringG.rotation.y = Math.PI / 2; sw.add(ringG);
          const gem = mk(new THREE.OctahedronGeometry(0.018, 0), glowOf(rar) || 0xb01a2a, 0.002); gem.position.y = -0.1; sw.add(gem);
        } else if (base === 'Martelo') {
          const haft = mk(new THREE.CylinderGeometry(0.022, 0.024, 0.86, 7), 0x4a3220, 0.004); haft.position.y = -0.43; sw.add(haft);
          const headH = mk(new THREE.BoxGeometry(0.16, 0.2, 0.3), 0x6a6e78, 0.006, metal(rar, 0x6a6e78)); headH.position.set(0, -0.8, 0); sw.add(headH);
          len = 0.88;
        } else {
          const guardM = mk(new THREE.BoxGeometry(0.2, 0.024, 0.036), glowOf(rar) || gold, 0.005); guardM.position.y = -0.1; sw.add(guardM);
          const blade = mk(new THREE.BoxGeometry(wid, len, 0.016), 0xdde3ec, 0.006, metal(rar)); blade.position.y = -0.1 - len / 2; sw.add(blade);
          const fuller = mk(new THREE.BoxGeometry(wid * 0.23, len * 0.84, 0.019), 0x8a929e, 0.0); fuller.position.y = -0.1 - len / 2; sw.add(fuller);
          const pt = new THREE.ConeGeometry(wid * 0.72, 0.22, 4); pt.scale(1, 1, 0.3); pt.rotateZ(Math.PI); pt.rotateY(Math.PI / 4); const ptM = mk(pt, 0xc9d0da, 0.004, metal(rar, 0xc9d0da)); ptM.position.y = -0.1 - len - 0.1; sw.add(ptM);
        }
        if (weaponTipObj) weaponTipObj.position.set(0, -0.14 - len, 0); if (weaponBaseObj) weaponBaseObj.position.set(0, -0.1 - len * 0.35, 0);
        if (RG) { // a boca do cano no suporte (o tiro sai dali)
          if (!gunTip0) { gunTip0 = weaponTipObj; gunBase0 = weaponBaseObj; }
          const mt = new THREE.Object3D(); mt.position.set(0, 0.045, 0.14 + len); gunHolder.add(mt); const mb = new THREE.Object3D(); mb.position.set(0, 0.03, 0.15); gunHolder.add(mb);
          weaponTipObj = mt; weaponBaseObj = mb; gunOn = true; gunHolder.visible = true; } else gunHolder.visible = false;
        mergeStatic(sw, ramp); fine(sw);
      }
      /* anão: as armas de duas mãos da raça trocam a cabeça do martelo (o cabo, as mãos e o golpe continuam os mesmos) */
      if (dwarfAxe && g.weapon !== undefined) {
        const ax = dwarfAxe, base = g.weapon?.base ?? '', rar = g.weapon?.rarity ?? 'normal', GL = glowOf(rar) || undefined;
        if (!dwarfDefault) dwarfDefault = ax.children.filter((c) => (c as THREE.Mesh).isMesh);
        for (const c of [...ax.children]) if ((c as THREE.Mesh).isMesh) ax.remove(c);
        const rune = new THREE.MeshBasicMaterial({ color: GL ?? 0x6ad8ff });
        if (base === 'Martelo de Guerra Anão' || base === 'Machado Duplo Anão') {
          const haft = gm(new THREE.CylinderGeometry(0.032, 0.036, 1.08, 8), 'leatherD'); haft.position.y = 0.2; ax.add(haft);
          for (let i = 0; i < 4; i++) { const bd = gm(new THREE.CylinderGeometry(0.04, 0.04, 0.03, 8), 'bronze'); bd.position.y = -0.22 + i * 0.16; ax.add(bd); }
          const pm = gm(new THREE.OctahedronGeometry(0.06, 0), 'bronze', GL); pm.position.y = -0.36; ax.add(pm);
          if (base === 'Martelo de Guerra Anão') { // cabeça octogonal maciça, faces de latão com runa acesa, espigão em cima e bico atrás
            const hd = gm(new THREE.CylinderGeometry(0.15, 0.15, 0.5, 8), 'dark', GL); hd.rotation.z = Math.PI / 2; hd.position.y = 0.66; ax.add(hd);
            for (const sx of [-1, 1]) { const fc = gm(new THREE.CylinderGeometry(0.165, 0.15, 0.05, 8), 'bronze'); fc.rotation.z = Math.PI / 2; fc.position.set(sx * 0.27, 0.66, 0); ax.add(fc);
              const rn = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.012, 4, 8), rune); rn.rotation.y = Math.PI / 2; rn.position.set(sx * 0.3, 0.66, 0); ax.add(rn); }
            for (const y of [0.52, 0.8]) { const bd = gm(new THREE.TorusGeometry(0.152, 0.014, 4, 8), 'gold'); bd.rotation.y = Math.PI / 2; bd.rotation.x = Math.PI / 2; bd.position.y = y; ax.add(bd); }
            const sp = gm(new THREE.ConeGeometry(0.05, 0.22, 6), 'steel'); sp.position.y = 0.92; ax.add(sp);
          } else { // dois crescentes de aço, miolo de bronze com runa
            const q = new THREE.Shape(); q.moveTo(0.04, 0.12); q.quadraticCurveTo(0.22, 0.18, 0.34, 0.26); q.quadraticCurveTo(0.26, 0, 0.34, -0.26); q.quadraticCurveTo(0.22, -0.18, 0.04, -0.12); q.closePath();
            for (const sx of [-1, 1]) { const g2 = new THREE.ExtrudeGeometry(q, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 1 }); g2.translate(0, 0, -0.015); const bl = gm(g2, 'steel', GL); bl.scale.x = sx; bl.position.y = 0.66; ax.add(bl);
              const ed = gm(new THREE.TorusGeometry(0.27, 0.007, 3, 12, 1.1), 'iron'); ed.position.set(sx * 0.07, 0.66, 0); ed.rotation.z = sx > 0 ? -0.55 : Math.PI - 0.55; ax.add(ed); }
            const core = gm(new THREE.BoxGeometry(0.11, 0.26, 0.09), 'bronze'); core.position.y = 0.66; ax.add(core);
            const rn = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.14, 0.095), rune); rn.position.y = 0.66; ax.add(rn);
            const sp = gm(new THREE.ConeGeometry(0.035, 0.18, 6), 'steel'); sp.position.y = 0.88; ax.add(sp);
          }
        } else for (const c of dwarfDefault) ax.add(c); // o martelo de sempre
      }
      /* escudo */
      if (gearShield && g.shield !== undefined) {
        const sh = gearShield; for (const c of [...sh.children]) sh.remove(c);
        const base = g.shield?.base ?? 'Escudo Nórdico', rar = g.shield?.rarity ?? 'normal';
        let shield: THREE.Mesh;
        const SHAPED: Record<string, (w: number, h: number) => THREE.Shape> = { // escudos de verdade: torre ogival, heráldico (ponta embaixo) e de pipa
          'Escudo Torre': (w, h) => { const q = new THREE.Shape(); q.moveTo(-w / 2, -h * 0.3); q.lineTo(-w / 2, h * 0.26); q.quadraticCurveTo(-w / 2, h * 0.46, 0, h * 0.5); q.quadraticCurveTo(w / 2, h * 0.46, w / 2, h * 0.26); q.lineTo(w / 2, -h * 0.3); q.quadraticCurveTo(w / 2, -h * 0.45, 0, -h * 0.5); q.quadraticCurveTo(-w / 2, -h * 0.45, -w / 2, -h * 0.3); return q; },
          'Escudo Ogival': (w, h) => { const q = new THREE.Shape(); q.moveTo(-w / 2, h * 0.44); q.quadraticCurveTo(0, h * 0.52, w / 2, h * 0.44); q.lineTo(w / 2, h * 0.06); q.quadraticCurveTo(w * 0.48, -h * 0.3, 0, -h * 0.5); q.quadraticCurveTo(-w * 0.48, -h * 0.3, -w / 2, h * 0.06); q.lineTo(-w / 2, h * 0.44); return q; },
          'Escudo de Pipa': (w, h) => { const q = new THREE.Shape(); q.moveTo(-w / 2, h * 0.24); q.quadraticCurveTo(-w / 2, h * 0.5, 0, h * 0.5); q.quadraticCurveTo(w / 2, h * 0.5, w / 2, h * 0.24); q.quadraticCurveTo(w * 0.42, -h * 0.12, 0, -h * 0.5); q.quadraticCurveTo(-w * 0.42, -h * 0.12, -w / 2, h * 0.24); return q; },
        };
        SHAPED['Escudo da Ordem do Fio'] = SHAPED['Escudo Ogival']; SHAPED['Escudo dos Desfiados'] = SHAPED['Escudo Ogival'];
        const SZ: Record<string, [number, number, number, number]> = { 'Escudo da Ordem do Fio': [0.6, 0.78, 0x1a2f5a, 0xd9b45a], 'Escudo dos Desfiados': [0.6, 0.78, 0x120d10, 0xa3151f], 'Escudo Torre': [0.58, 1.0, 0x7a808c, 0x8a2a20], 'Escudo Ogival': [0.6, 0.74, 0xd8cfc4, 0x8a1f1f], 'Escudo de Pipa': [0.54, 0.96, 0x2a4a7a, 0xe8dcc0] };
        { const ROUND = (w: number) => { const q = new THREE.Shape(); q.absarc(0, 0, w / 2, 0, Math.PI * 2, false); return q; };
          for (const b of ['Broquel', 'Escudo Redondo', 'Escudo Nórdico']) SHAPED[b] = (w) => ROUND(w);
          SZ['Broquel'] = [0.4, 0.4, 0, 0]; SZ['Escudo Redondo'] = [0.6, 0.6, 0, 0]; SZ['Escudo Nórdico'] = [0.74, 0.74, 0, 0]; }
        if (!SHAPED[base]) { SHAPED[base] = SHAPED['Escudo Nórdico']; SZ[base] = SZ['Escudo Nórdico']; } // base desconhecida: redondo nórdico
        {
          const [w, h, fc, ec] = SZ[base], shp = SHAPED[base](w, h), dep = 0.035, round = /Broquel|Redondo|Nórdico/.test(base) || SHAPED[base] === SHAPED['Escudo Nórdico'];
          const ext = (q: THREE.Shape, d: number, bev: number) => { const g2 = new THREE.ExtrudeGeometry(q, { depth: d, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 2, curveSegments: 20 }); g2.translate(0, 0, -d / 2); g2.rotateY(Math.PI / 2); return g2; };
          const out = -(dep / 2 + 0.014), deco = (geo: THREE.BufferGeometry, col: number, m?: THREE.Material) => { const o = mk(geo, col, 0, m); o.position.x = out; shield.add(o); return o; };
          const FS = facOf(base);
          if (FS) {
            shield = new THREE.Mesh(ext(shp, dep, 0.012), toon(fc)); // face pintada
            const rimG = ext(SHAPED[base](w * 1.08, h * 1.06), dep * 0.6, 0.01), rim = mk(rimG, 0x2a2420, 0, metal(rar, 0x3a3a40, 0.25)); rim.position.x = 0.012; shield.add(rim);
            void deco; void ec;
 // escudo de facção: o brasão pintado no rosto inteiro, aro na cor do lado
            const W2 = w * 0.97, H2 = h * 0.97, sg = new THREE.ShapeGeometry(SHAPED[base](W2, H2), 16), uv = sg.attributes.uv, ps = sg.attributes.position;
            for (let i = 0; i < uv.count; i++) uv.setXY(i, 0.5 - ps.getX(i) / W2, ps.getY(i) / H2 + 0.5); // visto de fora: espelha para o desenho não sair invertido
            sg.rotateY(Math.PI / 2); const face = new THREE.Mesh(sg, new THREE.MeshToonMaterial({ map: crestTexture(FS, 'shield'), gradientMap: ramp, alphaTest: 0.3, side: THREE.DoubleSide })); face.position.x = -(dep / 2 + 0.013); shield.add(face);
            const trim = ext(SHAPED[base](w * 1.02, h * 1.02), dep * 0.4, 0.008), tm = mk(trim, ec, 0, metal(rar, ec, 0.25)); tm.position.x = 0.004; shield.add(tm);
            const bs = deco(new THREE.SphereGeometry(0.03, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), FS === 'fio' ? 0xd9b45a : 0x3a3a42, metal(rar, FS === 'fio' ? 0xd9b45a : 0x3a3a42, 0.2)); bs.rotation.z = Math.PI / 2; bs.position.set(out - 0.004, h * 0.4, 0);
          } else { /* madeira + aro de metal + rebites + umbo/losango (referências do Erling) */
            const hi = rar === 'epic' || rar === 'legendary' || rar === 'unique' || rar === 'relic';
            const sd = (g.shield as { seed?: number } | null)?.seed ?? [...(base + rar)].reduce((a2, ch) => (a2 * 31 + ch.charCodeAt(0)) % 9973, 7);
            const style: ShieldStyle = base === 'Broquel' ? 'metal' : hi ? 'blackgold' : rar === 'rare' ? 'heraldic' : base === 'Escudo Nórdico' ? 'nordic' : base === 'Escudo Torre' ? 'bands' : sd % 2 ? 'bands' : 'wood';
            const rimK: GearKind = hi ? 'gold' : rar === 'rare' ? 'bronze' : /Pipa|Ogival|Torre/.test(base) ? 'steel' : 'iron', rivK: GearKind = hi ? 'gold' : style === 'metal' ? 'dark' : 'steel', GL = glowOf(rar) || undefined;
            shield = new THREE.Mesh(ext(shp, dep, 0.01), gearMat('leatherD')); // o corpo de tábuas (a borda de madeira aparece de lado)
            const W2 = w * 0.96, H2 = h * 0.96, sg = new THREE.ShapeGeometry(SHAPED[base](W2, H2), 24), uv = sg.attributes.uv, ps = sg.attributes.position;
            for (let k = 0; k < uv.count; k++) uv.setXY(k, 0.5 - ps.getX(k) / W2, ps.getY(k) / H2 + 0.5);
            sg.rotateY(Math.PI / 2); const face = new THREE.Mesh(sg, new THREE.MeshLambertMaterial({ map: shieldFace(style, sd), emissive: 0x0a0806, side: THREE.DoubleSide })); face.position.x = -(dep / 2 + 0.016); shield.add(face);
            const ring = SHAPED[base](w * 1.05, h * 1.04); ring.holes.push(new THREE.Path(SHAPED[base](w * (round ? 0.88 : 0.9), h * (round ? 0.88 : 0.92)).getPoints(32)));
            const rg = new THREE.ExtrudeGeometry(ring, { depth: 0.014, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 1, curveSegments: 24 }); rg.translate(0, 0, -0.007); rg.rotateY(Math.PI / 2);
            const rim = new THREE.Mesh(rg, gearMat(rimK, GL)); rim.position.x = -(dep / 2 + 0.006); rim.castShadow = true; shield.add(rim); // o aro de metal na frente
            const back = new THREE.Mesh(ext(SHAPED[base](w * 1.05, h * 1.04), dep * 0.5, 0.006), gearMat(rimK)); back.position.x = 0.006; shield.add(back);
            const pts = SHAPED[base](w * 0.965, h * 0.97).getSpacedPoints(round ? 14 : 18); pts.pop();
            for (const pt of pts) { const rv = gm(new THREE.SphereGeometry(0.012, 6, 4), rivK); rv.position.set(-(dep / 2 + 0.02), pt.y, -pt.x); shield.add(rv); }
            if (round) { const boss = gm(new THREE.SphereGeometry(w * 0.11, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), hi ? 'gold' : 'steel', GL); boss.rotation.z = Math.PI / 2; boss.position.x = -(dep / 2 + 0.012); shield.add(boss);
              const bring = gm(new THREE.TorusGeometry(w * 0.115, 0.01, 4, 20), rimK); bring.rotation.y = Math.PI / 2; bring.position.x = -(dep / 2 + 0.014); shield.add(bring); }
            else if (style !== 'blackgold') { const dia = gm(new THREE.OctahedronGeometry(0.05, 0), hi ? 'gold' : 'steel', GL); dia.scale.set(0.35, 1.25, 0.85); dia.position.set(-(dep / 2 + 0.018), h * (base === 'Escudo de Pipa' ? 0.18 : 0.1), 0); shield.add(dia); }
          }
        }
        shield.castShadow = true; sh.add(shield); if (!(g.shield)) { /* sem escudo equipado: mantém o nórdico padrão */ }
        mergeStatic(sh, ramp); fine(sh);
      }
      /* elmo */
      if (headRef && g.helm !== undefined) {
        for (const o2 of helmParts) helmHolder.remove(o2); helmParts.length = 0;
        const base = g.helm?.base, rar = g.helm?.rarity ?? 'normal'; const hr = S.headR; const HG = glowOf(rar) || undefined;
        if (base) {
          const grp = new THREE.Group(); grp.userData.keep = true; helmHolder.add(grp); helmParts.push(grp);
          if (base === 'Capuz') { const hood = gm(new THREE.SphereGeometry(hr * 1.2, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.62), 'wool'); hood.position.y = 0.03; grp.add(hood); const back = gm(new THREE.ConeGeometry(hr * 1.1, hr * 1.6, 10), 'wool'); back.rotation.x = Math.PI; back.position.set(0, -hr * 0.4, -hr * 0.5); grp.add(back); }
          else if (base === 'Elmo de Couro') { const cap = gm(new THREE.SphereGeometry(hr * 1.14, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), 'leather', HG); cap.position.y = 0.03; grp.add(cap); const band = gm(new THREE.TorusGeometry(hr * 1.1, 0.02, 6, 20), 'leatherD'); band.rotation.x = Math.PI / 2; band.position.y = hr * 0.25; grp.add(band); }
          else { const dome = gm(new THREE.SphereGeometry(hr * 1.16, 16, 9, 0, Math.PI * 2, 0, Math.PI * 0.53), base === 'Elmo Alado' ? 'steel' : 'iron', HG); dome.position.y = 0.02; grp.add(dome); const nasal = gm(new THREE.BoxGeometry(0.022, hr * 0.62, 0.026), 'dark'); nasal.position.set(0, hr * 0.02, hr * 1.12); grp.add(nasal); const rim = gm(new THREE.TorusGeometry(hr * 1.15, 0.014, 6, 24), 'bronze', HG); rim.rotation.x = Math.PI / 2; rim.position.y = hr * 0.3; grp.add(rim); const crest = gm(new THREE.TorusGeometry(hr * 1.12, 0.012, 5, 16, Math.PI), 'bronze'); crest.rotation.y = Math.PI / 2; crest.position.y = 0.02; grp.add(crest); for (const sx2 of [-1, 1]) { const cheek = gm(new THREE.BoxGeometry(0.02, hr * 0.62, hr * 0.5), 'iron'); cheek.position.set(sx2 * hr * 1.02, -hr * 0.12, hr * 0.42); cheek.rotation.set(0.1, sx2 * 0.35, sx2 * 0.12); grp.add(cheek); } /* elmo nórdico: cumeeira, faixa de bronze, guardas de bochecha (sem cor de raridade berrante) */
            if (base === 'Elmo Alado') for (const sx of [-1, 1]) { const wing = new THREE.Group(); wing.position.set(sx * hr * 1.05, hr * 0.45, -hr * 0.15); wing.rotation.set(-0.25, sx * -0.35, sx * -0.5); grp.add(wing); for (let f = 0; f < 6; f++) { const L2 = hr * (2.0 - f * 0.2), fe = gm(new THREE.ConeGeometry(hr * 0.16, L2, 5), 'feather'); fe.scale.z = 0.35; const a2 = -0.15 + f * 0.24; fe.position.set(sx * Math.sin(a2) * L2 * 0.45, Math.cos(a2) * L2 * 0.45, -f * hr * 0.06); fe.rotation.z = sx * -a2; wing.add(fe); } } } // asas de penas de verdade (6 penas em leque)
          mergeStatic(grp, ramp); fine(grp);
        }
      }
      setCapeShoulders(g);
    },
    setNight(n) { night = n; },
    setWind(w) { wind = w; },
    weaponTip(out) { return weaponTipObj.getWorldPosition(out); },
    weaponBase(out) { return (weaponBaseObj ?? armR.wr).getWorldPosition(out); },
    handPos(out) { return armR.wr.getWorldPosition(out); },
    update(dt, t, mps, heading) {
      if (capeObj) capeObj.rotation.x = 0.05 + Math.min(1, mps / 6) * 0.38 + Math.sin(t * 2.1) * 0.025 * (0.4 + Math.min(1, mps / 3)); // a capa balança e voa para trás ao correr
      if (heading !== null) {
        let d = heading - yaw; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
        yaw += d * Math.min(1, dt * (act?.a === 'attack' ? 4 : 13));
      }
      breath += dt * 2.3;
      const moving = mps > 0.15;
      walkK += ((moving ? clamp(mps / S.walkSpeed, 0, 1) : 0) - walkK) * Math.min(1, dt * 10);
      runK += ((clamp((mps - S.walkSpeed) / (S.runSpeed - S.walkSpeed), 0, 1)) - runK) * Math.min(1, dt * 7);
      // passada casada com a velocidade: um passo = π de fase
      const strideLen = S.stride * (1 + 1.2 * runK);
      if (moving) phase += (Math.PI * mps / strideLen) * dt;
      const A = lerp(S.A[0], S.A[1], runK) * walkK, K = lerp(S.K[0], S.K[1], runK) * walkK;
      const armA = lerp(S.armA[0], S.armA[1], runK) * walkK;
      const eb = lerp(S.eb[0], S.eb[1], runK);
      const leanT = lerp(S.lean[0], S.lean[1], runK) * walkK;
      const bobA = lerp(S.bob[0], S.bob[1] * 0.3, runK) * walkK * 0.55;
      const tw = lerp(S.twist[0], S.twist[1], runK) * walkK;

      // ações
      let aSide = 0, aRoll = 0, aBack = 0, aLean = 0, aTwist = 0, aShR = 0, aElR = 0, aShL = 0, aElL = 0, aShRz = 0, aShLz = 0, aHeadX = 0, aCrouch = 0, aLungeLeg = 0, aSwX = 0, aSwZ = 0, aJump = 0, aSpin = 0, aFace = 0, aTilt = 0;
      let dashing = false, tgtVel = 0, dashP = 0, lgLH = 0, lgLK = 0, lgRH = 0, lgRK = 0, aKn = 0;
      if (act) {
        if (!hero.freeze) act.t += dt;
        const p = clamp(act.t / act.dur, 0, 1);
        const K = POSES[act.a];
        if (K) {
          aShR = kf(p, K.shX); aShRz = kf(p, K.shZ); aElR = kf(p, K.el); aSwX = kf(p, K.swX); aSwZ = kf(p, K.swZ);
          aTwist = kf(p, K.twist); aLean = kf(p, K.lean); aLungeLeg = kf(p, K.lunge); aCrouch = kf(p, K.crouch); aJump = kf(p, K.jump);
          aShL = kf(p, K.shLX); aShLz = kf(p, K.shLZ); aElL = kf(p, K.elL); aFace = kf(p, K.face); tgtVel = kf(p, K.vel);
          aSpin = K.spin ? kf(p, K.spin) : 0; aTilt = kf(p, K.tilt); aHeadX = kf(p, K.head);
          lgLH = kf(p, K.lgLH); lgLK = kf(p, K.lgLK); lgRH = kf(p, K.lgRH); lgRK = kf(p, K.lgRK); aKn = kf(p, K.kn);
          // suaviza (exceto giro) para encadear golpes sem tranco
          aShR = smooth1('shR', aShR, dt); aShRz = smooth1('shRz', aShRz, dt); aElR = smooth1('elR', aElR, dt); aSwX = smooth1('swX', aSwX, dt); aTwist = smooth1('tw', aTwist, dt); aLean = smooth1('ln', aLean, dt);
        } else if (act.a === 'attack') {
          const w = p < 0.3 ? ease(p / 0.3) : p < 0.5 ? 1 - ease((p - 0.3) / 0.2) * 2 : -1 + ease((p - 0.5) / 0.5);
          if (styleAtk === 'thrust') { aShR = (w > 0 ? 0.9 * w : -1.6 * -w); aElR = w > 0 ? 0.5 * w : -0.35 * -w; aTwist = 0.45 * w; aLean = w > 0 ? -0.05 * w : 0.28 * -w; aLungeLeg = w < 0 ? -w : 0; aShL = -0.2 * -w; }
          else if (styleAtk === 'chop') { aShR = w > 0 ? 2.6 * w : -1.0 * -w; aElR = w > 0 ? 0.9 * w : 0.1; aTwist = 0.5 * w; aLean = w > 0 ? -0.2 * w : 0.45 * -w; aCrouch = w < 0 ? 0.05 * -w : 0; aShL = w > 0 ? 0.6 * w : -0.4 * -w; }
          else { aShR = w > 0 ? 0.6 * w : -1.55 * -w; aElR = w > 0 ? 1.0 * w : 0.2; aTwist = 0.5 * w; aLean = w < 0 ? 0.22 * -w : -0.06 * w; aLungeLeg = w < 0 ? -w : 0; }
        } else if (act.a === 'cast') {
          const w = Math.sin(p * Math.PI);
          aShR = -2.0 * w; aShL = -2.0 * w; aElR = 0.2 * w; aElL = 0.2 * w; aShRz = 0.15 * w; aShLz = -0.15 * w; aLean = -0.12 * w; aHeadX = -0.2 * w;
        } else if (act.a === 'dash') {
          dashing = true; dashP = p; const w = Math.sin(p * Math.PI);
          // projeta o corpo para a frente: pelve inclinada, pernas para trás, braços recolhidos atrás
          aTilt = (kind === 'dwarf' ? 0.45 : 0.62) * w; aLean = 0.32 * w; aCrouch = 0.1 * w; aJump = 0.08 * w; aShR = 0.75 * w; aShL = 0.6 * w; aElR = 0.4 * w; aElL = 0.45 * w; aHeadX = -0.1 * w; aTwist = 0.15 * w;
        } else if (act.a === 'dodge') { // esquiva: passo lateral, tronco tomba para longe do golpe, braços abrem para equilibrar
          const w = Math.sin(Math.min(1, p * 1.25) * Math.PI * 0.5) * (1 - ease(clamp((p - 0.55) / 0.45, 0, 1)));
          aSide = dodgeSide * 0.34 * w; aRoll = dodgeSide * 0.2 * w; aLean = -0.12 * w; aCrouch = 0.12 * w; aShRz = -0.25 * w; aShLz = 0.25 * w; aHeadX = 0.08 * w; aTwist = -dodgeSide * 0.2 * w;
        } else if (act.a === 'block') { // bloqueio: escudo empurra para a frente contra o golpe, corpo firma nos joelhos e recua meio passo
          const w = p < 0.25 ? ease(p / 0.25) : 1 - ease((p - 0.25) / 0.75);
          aShL = -0.9 * w; aElL = -0.25 * w; aCrouch = 0.16 * w; aLean = 0.12 * w; aTwist = -0.25 * w; aFace = Math.max(aFace, w); aBack = -0.12 * w; aShR = 0.2 * w;
        } else if (act.a === 'parry') { // aparo: a lâmina varre de dentro para fora e desvia a arma inimiga; torso gira junto
          const u = ease(clamp(p / 0.45, 0, 1)), w = p < 0.45 ? Math.sin(u * Math.PI * 0.5) : 1 - ease((p - 0.45) / 0.55);
          aShR = -1.35 * w; aElR = 0.55 * w; aShRz = (0.55 - 1.1 * u) * w; aTwist = (0.4 - 0.7 * u) * w; aLean = -0.05 * w; aCrouch = 0.08 * w; aBack = -0.06 * w;
        } else if (act.a === 'hit') {
          const w = Math.sin(p * Math.PI); aLean = -0.38 * w; aHeadX = 0.35 * w; aShR = 0.6 * w; aShL = 0.6 * w; aCrouch = 0.04 * w;
        }
        if (p >= 1 && !hero.freeze) act = null;
      }
      stepVel += (tgtVel - stepVel) * Math.min(1, dt * 30);
      kneelK += ((hero.kneel && !hero.riding ? 1 : 0) - kneelK) * Math.min(1, dt * 5);
      const kneelE = Math.max(kneelK, smooth1('kn', aKn, dt, 16)); /* ajoelhar: trabalho (kneelK) ou golpe baixo (aKn) */
      swimK += ((hero.swim && !hero.riding ? 1 : 0) - swimK) * Math.min(1, dt * 4); swimMv += ((hero.swim && walkK > 0.2 ? 1 : 0) - swimMv) * Math.min(1, dt * 3);
      if (swimK > 0.01) { // braçada: um braço vai à frente por cima da água enquanto o outro puxa por baixo; parado, as mãos remam devagar
        const ph = t * (swimMv > 0.5 ? 4.4 : 1.8), mv = swimMv, k = swimK;
        aTilt += (0.25 + 0.95 * mv) * k; aHeadX += -0.75 * mv * k; aLean *= 1 - k * 0.8;
        aShR += (-1.0 - mv * 1.7 * (0.6 + Math.sin(ph))) * k; aShL += (-1.0 - mv * 1.7 * (0.6 + Math.sin(ph + Math.PI))) * k;
        aElR += (-0.35 - 0.3 * Math.max(0, Math.cos(ph))) * k; aElL += (-0.35 - 0.3 * Math.max(0, Math.cos(ph + Math.PI))) * k;
        aShRz += (-0.35 + (1 - mv) * Math.sin(ph) * 0.25) * k; aShLz += (0.35 - (1 - mv) * Math.sin(ph) * 0.25) * k; }
      if (kneelK > 0.01) { aLean += 0.95 * kneelK; aShL += -0.7 * kneelK; aElL += -0.55 * kneelK; aShLz += 0.12 * kneelK; aCrouch *= 1 - kneelK; aHeadX += 0.15 * kneelK; } // ajoelhado: tronco sobre o trabalho, mão esquerda segura a peça
      const idleK = smooth1('idle', (1 - walkK) * (act ? 0 : 1), dt, 7);
      const restK = idleK * (1 - combatK);
      aShR -= 0.08 * restK; aElR -= 0.12 * restK; aShL -= 0.06 * restK; aElL -= 0.15 * restK; aShRz += -0.08 * restK; aShLz += 0.08 * restK; aLean += 0.04 * restK; aTwist += 0.06 * restK; aCrouch += 0.015 * restK;
      /* POSTURA ESCOLHIDA (25/10, Erling: "a mudança de postura não muda a postura do personagem"): o corpo assume a postura, parado ou andando */
      { const want = act ? 0 : 1 - 0.5 * walkK; stK += (want - stK) * Math.min(1, dt * 6); const k = stK, sr = hero.stance;
        if (k > 0.01) {
          if (sr === 'atk') { aLean += 0.16 * k; aCrouch += 0.06 * k; aShR += -0.4 * k; aElR += -0.55 * k; aTwist += 0.18 * k; aHeadX += -0.1 * k; }
          else if (sr === 'tank') { aCrouch += 0.12 * k; aLean += 0.06 * k; aShL += -0.85 * k; aElL += -1.25 * k; aShLz += 0.12 * k; aFace = Math.max(aFace, 0.7 * k); aShR += 0.3 * k; aTwist += 0.12 * k; }
          else if (sr === 'heal') { aLean += -0.05 * k; aShL += -0.32 * k; aShR += -0.32 * k; aShLz += 0.42 * k; aShRz += -0.42 * k; aElL += -0.3 * k; aElR += -0.3 * k; aHeadX += -0.1 * k; }
          else if (sr === 'speed') { aCrouch += 0.07 * k; aLean += 0.12 * k; aJump += Math.max(0, Math.sin(t * 7)) * 0.025 * k * (1 - walkK); aShR += 0.2 * k; aShL += 0.2 * k; aElR += -0.6 * k; aElL += -0.6 * k; }
          else if (sr === 'leech') { aLean += 0.26 * k; aCrouch += 0.1 * k; aShR += 0.25 * k; aShL += 0.25 * k; aShRz += -0.2 * k; aShLz += 0.2 * k; aElR += -0.7 * k; aElL += -0.7 * k; aHeadX += -0.22 * k; }
        } }
      /* postura de combate (Eitr): baixa, tronco à frente, lado do escudo apresentado, escudo no peito, arma atrás da cintura pronta */
      combatK += ((act ? 0 : hero.combat ? 1 : 0) - combatK) * Math.min(1, dt * 5);
      const cK = combatK * (1 - 0.65 * runK * walkK);
      if (cK > 0.01) {
        aCrouch += 0.085 * cK; aLean += 0.2 * cK; aHeadX += -0.12 * cK;
        if (kind === 'nordic') { aTwist += 0.4 * cK; aShL += -0.95 * cK; aElL += -1.35 * cK; aShLz += 0.12 * cK; aFace = Math.max(aFace, 0.85 * cK); aShR += 0.55 * cK; aElR += -0.95 * cK; aShRz += -0.1 * cK; }
        else if (kind === 'dwarf') { aTwist += 0.35 * cK; aShR += -0.8 * cK; aElR += -0.45 * cK; aShRz += -0.12 * cK; aSwX += 2.35 * cK; aLean += 0.05 * cK; } // martelo na horizontal à frente, cabeça apontando o inimigo; a mão esquerda vai ao cabo por IK
        else { aTwist += 0.55 * cK; aCrouch += 0.05 * cK; aLean += 0.08 * cK; aHeadX += 0.22 * cK; }
      }
      // guarda: escudo erguido à frente
      guardK += (((hero.guard && !act) ? 1 : 0) - guardK) * Math.min(1, dt * 12);
      recoil *= Math.exp(-dt * 7);
      guardVis?.(guardK, t, recoil);
      if (guardK > 0.01 && kind === 'technocrat') { // campo de força: mão esquerda estendida, palma aberta
        aShL += -1.55 * guardK; aShLz += 0.12 * guardK; aElL += 0.1 * guardK; aFace = Math.max(aFace, guardK); aCrouch += 0.08 * guardK; aShR += 0.5 * guardK; aElR += -0.4 * guardK; aTwist += -0.3 * guardK; aLean += 0.05 * guardK; aShL += 0.3 * recoil * guardK;
      } else if (guardK > 0.01 && kind === 'dwarf') { // muralha: machado na horizontal com as duas mãos, corpo baixo
         aShL += -1.0 * guardK; aElL += -1.45 * guardK; aShLz += 0.25 * guardK; aCrouch += (0.13 + 0.03 * recoil) * guardK; aLean += 0.08 * guardK; aShR += 0.3 * recoil * guardK;
      } else if (guardK > 0.01) { aShL += -1.25 * guardK; aShLz += 0.18 * guardK; aElL += -1.7 * guardK; aFace = Math.max(aFace, guardK); aLean += -0.04 * guardK; aCrouch += (0.15 + 0.03 * recoil) * guardK; aShR += 0.35 * guardK; aTwist += 0.25 * guardK; aLean += (-0.08 * recoil) * guardK; aShL += 0.35 * recoil * guardK; aElL += 0.3 * recoil * guardK; }
      slashK = Math.max(0, slashK - dt * 7); if (slashK > 0) { const w = Math.sin(Math.min(1, 1 - slashK) * Math.PI); aShR += -1.1 * w; aShRz += -0.9 * w; aElR += 0.3 * w; aSwX += -1.2 * w; aTwist += 0.5 * w; }
      const rK = runK * walkK * (1 - (act ? 1 : 0));
      if (kind === 'nordic' && rK > 0.01) { aShR += 0.95 * rK; aElR += 0.3 * rK; aShRz += -0.18 * rK; aShL += -0.45 * rK; aElL += -0.85 * rK; aShLz += 0.18 * rK; aFace = Math.max(aFace, 0.6 * rK); aLean += 0.1 * rK; }
      root.rotation.y = yaw + aSpin;
      // sem ação a espada descansa apontando para o chão, ligeiramente para trás e afastada da perna
      const hang = kind === 'nordic' ? smooth1('hang', act || guardK > 0.5 ? 0 : 1, dt, 9) * (1 - 0.62 * combatK) : 0;
      if (rifleHolder && rifleBack) { // rifle: em combate fica ao peito (mãos por IK); fora, às costas
        const want = combatK > 0.35 || !!(act && (act.a === 'shoot' || act.a === 'throw' || act.a === 'cast'));
        aimRK += ((want ? 1 : 0) - aimRK) * Math.min(1, dt * 10);
        const stowNow = aimRK < 0.05;
        if (stowNow !== rifleStowed) { rifleStowed = stowNow; if (stowNow) { rifleBack.add(rifleHolder); rifleHolder.position.set(0, 0, 0); rifleHolder.rotation.set(0, 0, 0); } else { chest.add(rifleHolder); rifleHolder.position.set(0.14, S.torso * 0.36, 0.22); rifleHolder.rotation.set(0, 0, 0); } }
        if (!rifleStowed) { // o cano fica SEMPRE alinhado com a frente do herói (para onde o tiro sai), compensando a torção do tronco
          const rc = act && act.a === 'shoot' ? Math.max(0, 1 - Math.abs(clamp(act.t / act.dur, 0, 1) - 0.14) / 0.14) : 0;
          root.updateWorldMatrix(true, false); chest.updateWorldMatrix(true, false); chest.getWorldQuaternion(qPar); root.getWorldQuaternion(qRoot);
          rifleHolder.quaternion.copy(qPar).invert().multiply(qRoot); rifleHolder.rotateY(0.1); rifleHolder.rotateX(-0.12 * rc);
          rifleHolder.position.set(0.14, S.torso * 0.36, 0.22 - 0.07 * rc);
        }
        muzzleK = Math.max(0, muzzleK - dt * 14); if (muzzleGlow) { muzzleGlow.material.opacity = muzzleK; muzzleGlow.scale.setScalar(0.4 + muzzleK * 0.5); }
      }
      { /* a caneca na mão (28/10, Erling: "precisa aparecer a caneca na mão deles"): no /beber, no brinde da festa e no povo da taverna; a arma some enquanto isso (e na dança) */
        const dp = (hero as { drinkProp?: string }).drinkProp ?? 'mug', drinking = !!act && act.a === 'drink', mugOn = drinking && dp === 'mug', vialOn = drinking && dp === 'vial', freeH = drinking || (!!act && act.a === 'dance');
        if (vialOn && !vial) { vial = new THREE.Group(); const gl = toon(0xd83a4a, { emissive: new THREE.Color(0x6a0a14) }); const b = new THREE.Mesh(new THREE.SphereGeometry(0.05, 9, 7), gl); vial.add(b); const nk = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.07, 7), toon(0xcfe8f0)); nk.position.y = 0.07; vial.add(nk); const ck = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.03, 6), toon(0x8a5a2a)); ck.position.y = 0.115; vial.add(ck); vial.position.set(0, -0.09, 0.07); armR.wr.add(vial); }
        if (vial) vial.visible = vialOn;
        if (mugOn && !mug) { mug = new THREE.Group(); const wd = toon(0x8a5a2a), band = toon(0x3a3a40), foam = toon(0xfff4dc);
          const body = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.056, 0.15, 10), wd); mug.add(body); for (const y of [-0.05, 0.05]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.066, 0.066, 0.018, 10), band); b.position.y = y; mug.add(b); }
          const fm = new THREE.Mesh(new THREE.CylinderGeometry(0.064, 0.062, 0.035, 10), foam); fm.position.y = 0.085; mug.add(fm); const fb = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 5), foam); fb.position.set(0.03, 0.1, 0.02); mug.add(fb);
          const hd = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.012, 5, 10, Math.PI), wd); hd.rotation.z = -Math.PI / 2; hd.position.x = -0.062; mug.add(hd);
          mug.position.set(0.02, -0.1, 0.075); armR.wr.add(mug); }
        if (mug) mug.visible = mugOn; if (swordHolder) swordHolder.visible = !freeH; if (weaponInner) weaponInner.visible = !freeH; if (freeH && gunHolder.visible) gunHolder.visible = false; else if (!freeH && !gunHolder.visible) gunHolder.visible = true; }
      { /* 28/10 (Erling: "devia ficar uma bobina azul como um relógio ou um bracelete no meu pulso, pulsando azul") */
        const on = !!(hero as { cuffOn?: boolean }).cuffOn; if (on && !cuff) { cuff = new THREE.Group(); cuffMat = toon(0x3a9aff, { emissive: new THREE.Color(0x2a8aff) }); const band = new THREE.Mesh(new THREE.TorusGeometry(0.058, 0.02, 6, 16), toon(0x8a6a3a)); band.rotation.x = Math.PI / 2; cuff.add(band);
          const ring = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.009, 4, 16), cuffMat); ring.rotation.x = Math.PI / 2; ring.position.y = 0.012; cuff.add(ring); const ring2 = ring.clone(); ring2.position.y = -0.012; cuff.add(ring2);
          const coil = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.05, 8), cuffMat); coil.rotation.z = Math.PI / 2; coil.position.set(0, 0, 0.07); cuff.add(coil); const cap = new THREE.Mesh(new THREE.SphereGeometry(0.016, 6, 5), new THREE.MeshBasicMaterial({ color: 0xbfe8ff })); cap.position.set(0, 0.02, 0.07); cuff.add(cap);
          cuff.position.set(0, 0.03, 0); armL.wr.add(cuff); }
        if (cuff) { cuff.visible = on; if (on && cuffMat) { const k = 0.5 + 0.5 * Math.sin(t * 6); cuffMat.emissiveIntensity = 0.6 + 1.6 * k; cuff.scale.setScalar(1 + 0.06 * k); } } }
      if (swordHolder) swordHolder.rotation.set((kind === 'nordic' ? -1.9 : 0.3 + Math.PI) + aSwX + 3.3 * hang + 0.55 * rK * (kind === 'nordic' ? 1 : 0), 0, (kind === 'nordic' ? 0 : 0.05) + aSwZ + 0.22 * hang);
      shieldF += (aFace - shieldF) * Math.min(1, dt * 16);

      /* quadril: salto/oscilação + balanço lateral + giro */
      const c2 = Math.cos(2 * phase);
      const bobY = lerp(c2 * bobA, -c2 * bobA * 0.6, runK) - 0.045 * runK - (S.stomp * 0.012) * Math.abs(Math.sin(phase)) * walkK;
      const idleY = Math.sin(breath) * 0.01 * (1 - walkK);
      body.position.y = bobY + idleY - aCrouch + aJump - S.thigh * 0.93 * kneelE;
      hips.position.x = Math.cos(phase) * S.sway * walkK * (1 - runK * 0.5) + Math.sin(t * 0.6) * 0.006 * (1 - walkK) + smooth1('side', aSide, dt, 18);
      hips.rotation.y = -Math.sin(phase) * tw * 0.6 - aTwist * 0.4 + 0.3 * idleK;
      hips.rotation.z = Math.cos(phase) * 0.03 * walkK + smooth1('roll', aRoll, dt, 18);
      hips.position.z = smooth1('back', aBack, dt, 18);
      smooth.tilt += (aTilt - smooth.tilt) * Math.min(1, dt * 22); hips.rotation.x = smooth.tilt;
      spine.rotation.y = Math.sin(phase) * tw + aTwist;
      smooth.lean += ((leanT + aLean + (dashing ? 0.0 : 0)) - smooth.lean) * Math.min(1, dt * 14);
      spine.rotation.x = smooth.lean + Math.sin(breath) * 0.006;
      spine.rotation.z = -Math.cos(phase) * 0.018 * walkK;
      head.rotation.x = -smooth.lean * 0.85 - smooth.tilt * 0.9 + aHeadX + Math.sin(breath + 0.7) * 0.01;
      head.rotation.y = Math.sin(t * 0.4) * 0.08 * (1 - walkK) - spine.rotation.y * 0.6 - (kind === 'technocrat' ? 0.35 * combatK : 0);
      head.rotation.z = kind === 'technocrat' ? 0.12 * combatK : 0;
      const br = Math.sin(breath);
      chest.scale.set(1 + br * 0.018, 1 + br * 0.03, 1 + br * 0.02);
      const shY = S.torso * 0.4 + br * 0.012 * (1 - walkK * 0.6); armL.sh.position.y = shY; armR.sh.position.y = shY;
      head.position.y = S.neck * 0.5 + S.headR * 0.8 + br * 0.004;

      /* pernas */
      const setLeg = (leg: typeof legL, ph: number, lunge: number) => {
        const sA = Math.sin(ph), cA = Math.cos(ph);
        let hip = -A * sA + smooth.lean * 0.15;
        let knee = K * Math.max(0, Math.cos(ph - 0.3)) + (0.14 + 0.38 * runK) * walkK + 0.12 * (1 - walkK) * 0 + aCrouch * 5;
        if (dashing) { const w = Math.sin(dashP * Math.PI), lead = (leg === legL) === dashLeadL; hip = lead ? -0.85 * w : 0.5 * w; knee = lead ? 1.15 * w : 0.35 * w; }
        hip += lunge * -0.7; knee += lunge * 0.3;
        const front = leg === legL; hip += (front ? -0.06 : 0.04) * restK + (front ? -0.22 : 0.18) * guardK + (front ? -0.26 : 0.14) * cK * (1 - walkK); knee += (front ? 0.1 : 0.08) * restK + (front ? 0.25 : 0.3) * guardK + (front ? 0.3 : 0.24) * cK * (1 - walkK) + 0.25 * cK * walkK;
        leg.hip.rotation.x = hip; leg.knee.rotation.x = knee;
        // pé: plantado no chão (compensa quadril+joelho+inclinação da pelve); na passada solta um pouco para o impulso dos dedos
        // pé: plantado quando a perna está esticada no chão; quanto mais o joelho dobra (passada, salto, agachar), mais o pé acompanha a canela
        const plant = clamp(-(hip + knee + smooth.tilt) * (1 - 0.25 * walkK) + (cA < -0.2 ? -0.2 * walkK : 0), -0.9, 0.5);
        const bend = Math.max(0, knee - 0.3), kPlant = clamp(1 - bend / 0.7, 0, 1) * (1 - clamp(aJump, 0, 1)) * (hero.riding ? 0 : 1);
        leg.ankle.rotation.x = plant * kPlant + (-0.12 - 0.35 * bend) * (1 - kPlant);
        leg.hip.rotation.z = (0.02 * (1 - walkK) + 0.07 * cK * (1 - walkK) + 0.1 * restK) * (leg === legL ? -1 : 1); // afasta os pés (sinal: -z gira a perna esquerda para -x)
      };
      setLeg(legL, phase, aLungeLeg);
      setLeg(legR, phase + Math.PI, -aLungeLeg * 0.4);
      if (lgLH || lgLK || lgRH || lgRK) { legL.hip.rotation.x += lgLH; legL.knee.rotation.x += lgLK; legR.hip.rotation.x += lgRH; legR.knee.rotation.x += lgRK; if (lgLH < -0.6) legL.ankle.rotation.x = 0.35; } // chutes e passos das magias
      if (kneelE > 0.01) { // joelho direito no chão, pé esquerdo plantado à frente
        const k = kneelE, L = (o: THREE.Object3D, v: number) => { o.rotation.x += (v - o.rotation.x) * k; };
        L(legL.hip, -1.42); L(legL.knee, 1.46); L(legL.ankle, -0.04); L(legR.hip, 0.08); L(legR.knee, 1.62); L(legR.ankle, 0.45);
        legL.hip.rotation.z *= 1 - k * 0.5; legR.hip.rotation.z *= 1 - k * 0.5;
      }
      if (hero.riding) { for (const leg of [legL, legR]) { const sx = leg === legL ? -1 : 1; leg.hip.rotation.x = -1.15; leg.hip.rotation.z = -sx * 0.55; leg.knee.rotation.x = 1.35; leg.ankle.rotation.x = -0.2; } }

      /* braços (contra-balanço das pernas) */
      const sL = Math.sin(phase), sR = Math.sin(phase + Math.PI);
      armL.sh.rotation.x = restL.x + armA * sL * swingL * (1 - 0.8 * cK) + aShL; armL.sh.rotation.z = restL.z + aShLz;
      armL.el.rotation.x = -(restL.e + (0.18 + 0.22 * (1 - sL) * 0.5) * walkK) + aElL;
      armR.sh.rotation.x = restR.x + armA * sR * swingR * (1 - 0.7 * rK) + aShR; armR.sh.rotation.z = restR.z + aShRz;
      armR.el.rotation.x = -(restR.e + (0.18 + 0.22 * (1 - sR) * 0.5) * walkK) + aElR;
      if (hero.riding && !act) { armL.sh.rotation.x = -0.55; armL.sh.rotation.z = 0.18; armL.el.rotation.x = -0.9; armR.sh.rotation.x = -0.55; armR.sh.rotation.z = -0.18; armR.el.rotation.x = -0.9; }
      if (runK > 0.05) { // na corrida os cotovelos fecham em ~90°
        armL.el.rotation.x -= (eb - restL.e) * runK * swingL * 0.9;
        armR.el.rotation.x -= (eb - restR.e) * runK * swingR * 0.9;
      }
      if (kind === 'nordic' && !hero.riding) { // escudo sacado: antebraço atravessado à frente do corpo, face do escudo para a frente, cotovelo afastado
        const k = combatK * (act ? 0.6 : 1) * (1 - guardK);
        armL.sh.rotation.x += (-0.5 - armL.sh.rotation.x) * k; armL.sh.rotation.z += (-0.55 - armL.sh.rotation.z) * k;
        armL.sh.rotation.y = (window as unknown as { __twY?: number }).__twY !== undefined ? (window as unknown as { __twY: number }).__twY * k : 0.75 * k;
        armL.el.rotation.x += (-1.5 - armL.el.rotation.x) * k;
        armR.sh.rotation.z += (0.42 - armR.sh.rotation.z) * combatK * (act ? 0.3 : 1); // braço da espada também afastado
        if (!act) { // corrida: punho na altura do peito (não no queixo) e cotovelos um pouco para fora
          armL.el.rotation.x = Math.max(armL.el.rotation.x, -1.6); armR.el.rotation.x = Math.max(armR.el.rotation.x, -1.6);
          armL.sh.rotation.z -= 0.1 * runK; armR.sh.rotation.z += 0.1 * runK;
          armL.sh.rotation.x = Math.max(armL.sh.rotation.x, -0.75); armR.sh.rotation.x = Math.max(armR.sh.rotation.x, -0.75);
        }
      }
      /* ---- arma guiada por trajetória (espaço do peito): a lâmina/cabeça faz o arco NA FRENTE do personagem; as mãos seguem por IK ---- */
      if (weaponRig && weaponInner && swordHolder) {
        type WK = { p: number; g: [number, number, number]; d: [number, number, number] }[];
        const WKF: Partial<Record<Action, WK>> = kind === 'nordic' ? {
          combo1: [{ p: 0, g: [0.4, 0.15, -0.05], d: [0.6, 0.3, -0.2] }, { p: .22, g: [0.3, 0.05, -0.2], d: [0.1, 0.25, 1] }, { p: .4, g: [0.12, 0.2, 0.55], d: [0, 0, 1] }, { p: .7, g: [0.15, 0.18, 0.5], d: [0, 0, 1] }, { p: 1, g: [0.4, 0.15, -0.05], d: [0.6, 0.3, -0.2] }],
          combo2: [{ p: 0, g: [0.4, 0.15, -0.05], d: [0.6, 0.3, -0.2] }, { p: .2, g: [0.5, 0.4, -0.2], d: [0.8, 0.2, -0.6] }, { p: .45, g: [-0.25, 0.3, 0.45], d: [-0.8, -0.1, 0.6] }, { p: .7, g: [-0.4, 0.25, 0.3], d: [-0.95, 0, 0.3] }, { p: 1, g: [0.4, 0.15, -0.05], d: [0.6, 0.3, -0.2] }],
          combo4: [{ p: 0, g: [0.4, 0.15, -0.05], d: [0.6, 0.3, -0.2] }, { p: .12, g: [0.2, 0.6, -0.15], d: [0, 1, -0.35] }, { p: .3, g: [0.1, 0.05, 0.5], d: [0, -0.55, 0.85] }, { p: .46, g: [0.52, 0.3, 0.05], d: [1, 0, 0.1] }, { p: .82, g: [0.52, 0.3, 0.05], d: [1, 0, 0.1] }, { p: 1, g: [0.4, 0.15, -0.05], d: [0.6, 0.3, -0.2] }],
          slam: [{ p: 0, g: [0.4, 0.15, -0.05], d: [0.6, 0.3, -0.2] }, { p: .3, g: [0.2, 0.55, -0.1], d: [0.1, 1, -0.3] }, { p: .5, g: [0.2, 0.62, 0.0], d: [0, 1, -0.2] }, { p: .68, g: [0.1, -0.05, 0.5], d: [0, -1, 0.35] }, { p: .88, g: [0.1, -0.05, 0.5], d: [0, -1, 0.35] }, { p: 1, g: [0.4, 0.15, -0.05], d: [0.6, 0.3, -0.2] }],
          chop: [{ p: 0, g: [0.22, -0.12, 0.32], d: [0.15, -0.35, 0.92] }, { p: .38, g: [0.36, 0.2, -0.02], d: [0.7, 0.3, -0.65] }, { p: .56, g: [0.04, 0.0, 0.46], d: [-0.45, -0.08, 0.89] }, { p: .74, g: [0.02, -0.02, 0.46], d: [-0.5, -0.1, 0.86] }, { p: 1, g: [0.22, -0.12, 0.32], d: [0.15, -0.35, 0.92] }], /* lenhador de verdade: duas mãos no cabo, recua sobre o ombro direito e corta na horizontal na altura da cintura */
          mine: [{ p: 0, g: [0.22, -0.08, 0.3], d: [0.05, -0.5, 0.86] }, { p: .4, g: [0.14, 0.62, -0.06], d: [0.05, 0.92, -0.38] }, { p: .58, g: [0.1, -0.12, 0.46], d: [0.02, -0.78, 0.62] }, { p: .76, g: [0.1, -0.14, 0.45], d: [0.02, -0.8, 0.6] }, { p: 1, g: [0.22, -0.08, 0.3], d: [0.05, -0.5, 0.86] }],
          skin: [{ p: 0, g: [0.06, 0.2, 0.6], d: [-0.2, 0.3, 0.93] }, { p: .3, g: [0.2, 0.22, 0.62], d: [-0.55, 0.3, 0.78] }, { p: .6, g: [-0.1, 0.18, 0.64], d: [0.1, 0.25, 0.96] }, { p: 1, g: [0.06, 0.2, 0.6], d: [-0.2, 0.3, 0.93] }],
          herb: [{ p: 0, g: [0.06, 0.25, 0.55], d: [0, 0.3, 0.95] }, { p: .4, g: [0.04, 0.18, 0.68], d: [0, 0.1, 1] }, { p: .55, g: [0.04, 0.17, 0.68], d: [0, 0.08, 1] }, { p: 1, g: [0.06, 0.25, 0.55], d: [0, 0.3, 0.95] }],
          rush: [{ p: 0, g: [0.4, 0.15, -0.05], d: [0.6, 0.3, -0.2] }, { p: .08, g: [0.5, 0.2, 0.05], d: [1, 0, 0.25] }, { p: .62, g: [0.5, 0.2, 0.05], d: [1, 0, 0.25] }, { p: .74, g: [0.3, 0.0, -0.2], d: [0.4, 0.2, -0.9] }, { p: 1, g: [0.4, 0.15, -0.05], d: [0.6, 0.3, -0.2] }],
        } : kind === 'dwarf' ? {
          cleave1: [{ p: 0, g: [0.25, 0.05, 0.25], d: [0.9, 0.1, 0.4] }, { p: .22, g: [0.45, -0.05, -0.3], d: [0.7, 0.25, -0.7] }, { p: .46, g: [-0.25, 0.3, 0.45], d: [-0.75, 0.1, 0.65] }, { p: .72, g: [-0.42, 0.35, 0.25], d: [-0.95, 0.15, 0.3] }, { p: 1, g: [0.25, 0.05, 0.25], d: [0.9, 0.1, 0.4] }],
          cleave4: [{ p: 0, g: [-0.42, 0.35, 0.25], d: [-0.95, 0.15, 0.3] }, { p: .2, g: [-0.45, 0.1, -0.25], d: [-0.7, 0.25, -0.7] }, { p: .46, g: [0.3, 0.3, 0.45], d: [0.75, 0.1, 0.65] }, { p: .72, g: [0.45, 0.3, 0.2], d: [0.95, 0.15, 0.3] }, { p: 1, g: [0.25, 0.05, 0.25], d: [0.9, 0.1, 0.4] }],
          cleave3: [{ p: 0, g: [0.45, 0.3, 0.2], d: [0.95, 0.15, 0.3] }, { p: .28, g: [0.5, 0.3, 0.0], d: [1, 0, 0.15] }, { p: .76, g: [0.5, 0.3, 0.0], d: [1, 0, 0.15] }, { p: 1, g: [0.25, 0.05, 0.25], d: [0.9, 0.1, 0.4] }],
          cleave2: [{ p: 0, g: [0.25, 0.05, 0.25], d: [0.9, 0.1, 0.4] }, { p: .26, g: [0.12, 0.62, -0.2], d: [0, 1, -0.4] }, { p: .42, g: [0.15, 0.02, 0.55], d: [0, -0.8, 0.6] }, { p: .66, g: [0.15, 0.0, 0.55], d: [0, -0.85, 0.55] }, { p: 1, g: [0.25, 0.05, 0.25], d: [0.9, 0.1, 0.4] }],
          quake: [{ p: 0, g: [0.25, 0.05, 0.25], d: [0.9, 0.1, 0.4] }, { p: .3, g: [0.12, 0.62, -0.2], d: [0, 1, -0.4] }, { p: .5, g: [0.12, 0.66, -0.1], d: [0, 1, -0.3] }, { p: .68, g: [0.15, -0.02, 0.55], d: [0, -0.85, 0.55] }, { p: .9, g: [0.15, -0.02, 0.55], d: [0, -0.85, 0.55] }, { p: 1, g: [0.25, 0.05, 0.25], d: [0.9, 0.1, 0.4] }],
          charge: [{ p: 0, g: [0.25, 0.05, 0.25], d: [0.9, 0.1, 0.4] }, { p: .1, g: [0.42, 0.0, -0.3], d: [0.35, 0.35, -0.85] }, { p: .62, g: [0.42, 0.0, -0.3], d: [0.35, 0.35, -0.85] }, { p: .8, g: [0.12, 0.6, -0.2], d: [0, 1, -0.4] }, { p: 1, g: [0.25, 0.05, 0.25], d: [0.9, 0.1, 0.4] }],
        } : {};
        const guardHold = kind === 'dwarf' && guardK > 0.3;
        const HOLD: [number, number, number][] | null = guardHold ? [[0.05, 0.28, 0.4], [1, 0.05, 0]] : kind === 'nordic' ? [[0.34, -0.2, 0.3], [0.2, 0.78, 0.6]] : kind === 'dwarf' ? [[0.25, 0.05, 0.25], [0.9, 0.1, 0.4]] : null;
        const kfW = act ? WKF[act.a] : undefined;
        const want = kfW ? 1 : guardHold ? 1 : (!act && hero.combat && guardK < 0.3 && HOLD) ? combatK : 0;
        rigK += (want - rigK) * Math.min(1, dt * 12);
        const useRig = rigK > 0.03;
        if (useRig !== weaponRigged) { weaponRigged = useRig; if (useRig) { weaponRig.add(weaponInner); weaponInner.position.set(0, 0, 0); weaponInner.rotation.set(innerRotX, 0, 0); } else { swordHolder.add(weaponInner); weaponInner.position.set(0, 0, 0); weaponInner.rotation.set(0, 0, 0); } }
        if (useRig) {
          let g: [number, number, number] = HOLD ? HOLD[0] : [0.4, 0.15, 0], dd: [number, number, number] = HOLD ? HOLD[1] : [1, 0, 0];
          if (kfW && act) {
            const p = clamp(act.t / act.dur, 0, 1); let i = 1; while (i < kfW.length - 1 && p > kfW[i].p) i++;
            const a = kfW[i - 1], b = kfW[i], u = ease(clamp((p - a.p) / Math.max(1e-4, b.p - a.p), 0, 1));
            g = [lerp(a.g[0], b.g[0], u), lerp(a.g[1], b.g[1], u), lerp(a.g[2], b.g[2], u)]; dd = [lerp(a.d[0], b.d[0], u), lerp(a.d[1], b.d[1], u), lerp(a.d[2], b.d[2], u)];
          }
          if (slashK > 0 && kind === 'nordic') { const w = Math.sin(Math.min(1, 1 - slashK) * Math.PI); g = [g[0] - 0.5 * w, g[1], g[2] + 0.5 * w]; dd = [dd[0] - 1.6 * w, dd[1], dd[2] + 0.9 * w]; }
          const sm2 = Math.min(1, dt * 30);
          rigPos.lerp(rigTmp.set(g[0], g[1], g[2]), sm2); rigDir.lerp(rigTmp.set(dd[0], dd[1], dd[2]).normalize(), sm2).normalize();
          weaponRig.position.copy(rigPos); rigQ.setFromUnitVectors(rigTmp.set(0, 0, 1), rigDir); weaponRig.quaternion.copy(rigQ);
          chest.updateWorldMatrix(true, true);
          const tR = weaponRig.getWorldPosition(new V()); chest.worldToLocal(tR);
          armIK(armR.sh, armR.el, tR, S.upper, S.fore, tmp.set(0.7, -0.8, 0.1), rigK);
          if (act && (act.a === 'chop' || act.a === 'mine')) { // ferramenta de duas mãos: a esquerda corre pelo cabo
            const tL = rigPos.clone().addScaledVector(rigDir, -0.2); armIK(armL.sh, armL.el, tL, S.upper, S.fore, tmp.set(-0.6, -0.9, 0.1), rigK); /* a mão esquerda segura o fim do cabo, abaixo da direita */
          }
        }
      }
      if (kind === 'dwarf' && gripL) { // mão esquerda segura o cabo do martelo nos golpes e na postura de combate
        const two = act && (act.a === 'cleave1' || act.a === 'cleave2' || act.a === 'quake' || act.a === 'charge') ? 1 : 0;
        const k2 = smooth1('twoH', Math.max(two, guardK, combatK * (1 - walkK * 0.5)), dt, 12);
        if (k2 > 0.01) { chest.updateWorldMatrix(true, true); const tL = gripL.getWorldPosition(new V()); chest.worldToLocal(tL); armIK(armL.sh, armL.el, tL, S.upper, S.fore, tmp.set(-0.8, -0.8, 0.2), k2); }
      }
      if (gripR && gripL && !rifleStowed && aimRK > 0.01) { // mãos no rifle
        chest.updateWorldMatrix(true, true);
        const tR = gripR.getWorldPosition(new V()); chest.worldToLocal(tR); const tL = gripL.getWorldPosition(new V()); chest.worldToLocal(tL);
        armIK(armR.sh, armR.el, tR, S.upper, S.fore, tmp.set(0.9, -0.6, 0.0), aimRK); armIK(armL.sh, armL.el, tL, S.upper, S.fore, tmp.set(-0.9, -0.7, 0.1), aimRK);
      }
      if (gunOn) { // arma de fogo / besta: duas mãos, cano para a frente do herói (compensa a torção do tronco, como o rifle)
        const want = combatK > 0.35 || !!(act && act.a === 'shoot');
        gunK += ((want ? 1 : 0) - gunK) * Math.min(1, dt * 10);
        root.updateWorldMatrix(true, false); chest.updateWorldMatrix(true, true);
        const rq = root.getWorldQuaternion(new THREE.Quaternion()), rsc = root.getWorldScale(new V()).x, cw = chest.getWorldPosition(new V());
        const rc = act && act.a === 'shoot' ? Math.max(0, 1 - Math.abs(clamp(act.t / act.dur, 0, 1) - 0.14) / 0.14) : 0; // coice
        const up0 = S.torso * 0.42, aR = new V(0.12, up0, 0.27 - 0.05 * rc), aL = new V(0.02, up0 + 0.03, 0.55 - 0.05 * rc); // mira: coronha junto ao ombro direito, mão esquerda à frente
        const lR = new V(0.2, -0.05, 0.16), lL = new V(-0.02, 0.05, 0.36); // baixa: arma atravessada à frente do quadril
        const tR = aR.lerp(lR, 1 - gunK).multiplyScalar(rsc).applyQuaternion(rq).add(cw), tL = aL.lerp(lL, 1 - gunK).multiplyScalar(rsc).applyQuaternion(rq).add(cw);
        chest.worldToLocal(tR); chest.worldToLocal(tL);
        armIK(armR.sh, armR.el, tR, S.upper, S.fore, tmp.set(0.9, -0.6, 0.0), 1); armIK(armL.sh, armL.el, tL, S.upper, S.fore, tmp.set(-0.9, -0.7, 0.1), 1);
        chest.updateWorldMatrix(true, true); placeGun(armR.wr.getWorldPosition(new V()), armL.wr.getWorldPosition(new V()), rq, rsc);
      }

      if (shieldHolder && backAnchor) { // fora de combate o escudo vai para as costas
        const wantStow = gunOn || (combatK < 0.35 && !hero.guard && (!act || act.a === 'chop' || act.a === 'mine' || act.a === 'skin' || act.a === 'herb')); // arma de duas mãos: escudo sempre nas costas // nos ofícios o escudo fica nas costas
        if (wantStow !== stowed) { stowed = wantStow; if (stowed) { backAnchor.add(shieldHolder); shieldHolder.position.set(0, 0, 0); shieldHolder.quaternion.identity(); shieldF = 0; } else { armL.el.add(shieldHolder); shieldHolder.position.set(-0.08, -S.fore * 0.5, 0.06); shieldHolder.quaternion.identity(); } }
      }
      if (shieldHolder && !stowed) {
        // com a face (boss) apontando sempre para a frente do herói, qualquer que seja a pose do braço
        root.updateWorldMatrix(true, false); armL.el.updateWorldMatrix(true, false);
        root.getWorldQuaternion(qRoot); armL.el.getWorldQuaternion(qPar);
        qDes.setFromEuler(eDes.set(-0.12 * shieldF, Math.PI / 2, 0)).premultiply(qRoot);
        qLoc.copy(qPar).invert().multiply(qDes);
        shieldHolder.quaternion.identity().slerp(qLoc, shieldF);
      }
      /* passos sincronizados */
      const si = Math.floor(phase / Math.PI);
      if (si !== lastStep) { lastStep = si; if (mps > 0.8) hero.onStep?.(si & 1); }

      /* tecidos, cabelo, lanterna, extras */
      const lag = clamp(walkK * (0.4 + 0.6 * runK), 0, 1);
      for (const c of cloths) c.u(t, lag, wind);
      for (const c of chains) c.update(t, dt, lag * 0.9 + 0.12, wind, c.seed);
      lanternUpdate?.(t, lag, wind, night);
      extraUpdate?.(t, dt, lag, night);
      if (kind === 'technocrat') for (const g of glowMats) g.color.setHex(0x4de3ff);
      if (aura) aura.intensity += ((auraOn ? 8 : 0) - aura.intensity) * Math.min(1, dt * 4);
      tmp.set(0, 0, 0);
    },
  };
  /* esqueleto exposto para o modelo do artista (skin3d.ts): juntas, peças que continuam visíveis e a pose de repouso */
  root.updateMatrixWorld(true);
  const rigJ = { hips, spine, chest, neck: neckG, head, armL, armR, legL, legR };
  root.add(gunHolder); gunHolder.visible = false;
  (hero as unknown as { rig: unknown }).rig = { ...rigJ, gun: () => (gunOn ? gunHolder : null), gunK: () => gunK, placeGun, sword: () => gearSword, shield: () => shieldHolder, swordHolder: () => swordHolder, holdTool: () => hero.holdTool, cups: () => [mug, vial], cuff: () => cuff, keepRoots: () => [swordHolder, shieldHolder, backAnchor, shadow, droneObj, helmHolder, bodyHolder, gunHolder].filter(Boolean) as THREE.Object3D[], helmHolder: () => helmHolder, bodyHolder: () => bodyHolder, procHeadR: S.headR, procShoulderW: S.shoulderW, meshes };
  return hero;
}
