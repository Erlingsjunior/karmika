import * as THREE from 'three';
import { mergeStatic } from './merge3d';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { SCALE, TILE_M as T } from '@karmika/shared';
import { type World, type Prop, MAP_W, MAP_H, groundH, rng, edgeK, WL, veinOf, rotLocal, canalX, CANAL_HW } from './world';
import { buildTree } from './trees3d';

import { buildKitWall, buildKitSpan, buildKitTower, buildKitGate, buildRampart, buildRampartSeg, buildRoundTower, buildWallTower, buildGatehouse, buildWallStair, buildCastle, buildAcademy, buildStoneBridge, buildQuay, type Built } from './city3d';
import { buildTemple } from './temple3d';
import { buildHouse, buildStyledHouse } from './houses3d';
import { buildSpecies } from './flora3d';
import { buildPlant } from './plantas3d';
import { buildPortal, PORTAL_OF, PORTAL_GLOW } from './portais3d';
import { buildLandmark, buildPalisade, buildTotem, buildVillageGate, buildLowWall } from './village3d';
import { buildMonument } from './monuments3d';
import { buildVapor } from './vapor3d';
import { cutoutify } from './toon3d';
import { std, ink, ramp, plankTex, shingleTex, stoneTex, gableRoof } from './toon3d';
/** tampa de cada baú de tesouro do mundo (por prop), para a tampa abrir quando o jogador saqueia */
export const chestLids = new Map<object, THREE.Object3D>();
import { buildStation, buildWorkshop } from './stations3d';
import { buildLibrary } from './library3d';
import { buildGothic } from './gothic3d';
import { buildCursed, CURSED_KINDS } from './cursed3d';
import { windU } from './terrain3d';
import { ArtBatch, artGeo, artMesh, artMarker, collectMarkers, realizeMarkers, TREE_ART, PLANT_ART, ROCK_ART, VPROP_ART } from './arte3d';
import { buildChunkTerrain, CS, CSM, type ChunkTerrain } from './chunks3d';

export interface Torch { pos: THREE.Vector3; light: THREE.PointLight; base: number; seed: number; flame: THREE.Mesh; dist: number }
export interface WorldObjs {
  group: THREE.Group;
  torches: Torch[];
  glowLights: { light: THREE.PointLight; base: number; seed: number; warm: boolean }[];
  windows: THREE.MeshBasicMaterial;
  trees: { obj: THREE.Object3D; ph: number }[];
  smokers: THREE.Vector3[];
  /** relíquias dos caminhantes visíveis: runas e anel animados por fora */
  relics: { gx: number; gy: number; runes: THREE.Mesh; ring: THREE.Mesh; pos: THREE.Vector3; seed: number }[];
  /** rodas d'água, eixos e serras dos moinhos carregados */
  spinners: [THREE.Object3D, 'x' | 'y' | 'z', number][];
  update(hx: number, hz: number, sync?: boolean): void;
  fountainPos(): THREE.Vector3 | null;
  /** raio de chunks carregados (cinemáticas afastam a câmera) */
  setRad(n: number): void;
  removeProp(p: Prop): void;
  addProp(p: Prop): void;
  bridgeMeshes: THREE.Group;
}

function noiseTex(): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = c.height = 16;
  const g = c.getContext('2d')!;
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const v = 200 + Math.floor(Math.random() * 55);
    g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(x, y, 1, 1);
  }
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const rockMat = (c: number) => std(c, {});
const nullLight = new THREE.PointLight(0xffffff, 0, 1, 2);

export const FOUNTAIN = { rim: 0.9, bowl: 2.1, top: 2.12, rad: 2.2 }; /* 01/11: top = o espelho d'água da taça (a estátua não jorra) */
const fountainWater = new THREE.ShaderMaterial({ transparent: true, uniforms: { uT: windU, uL: { value: 1 } },
  vertexShader: 'varying vec3 vP; void main(){ vP = (modelMatrix*vec4(position,1.)).xyz; gl_Position = projectionMatrix*viewMatrix*vec4(vP,1.); }',
  fragmentShader: 'uniform float uT; varying vec3 vP; void main(){ vec2 c = vP.xz - floor(vP.xz*0.0); float r = length(vP.xz - vec2(0.0)); float w = sin(vP.x*3.1+uT*1.7)*sin(vP.z*2.7-uT*1.3)*0.5+0.5; float rg = smoothstep(0.9,1.0,sin(length(fract(vP.xz*0.25)-0.5)*40.0 - uT*5.0)); vec3 col = mix(vec3(0.08,0.35,0.5), vec3(0.3,0.7,0.85), w*0.6) + rg*0.18; gl_FragColor = vec4(col, 0.92); }' });
interface Loaded { artB?: ArtBatch; artPG?: [Prop, THREE.Object3D][]; terrain: ChunkTerrain; group: THREE.Group; torches: Torch[]; glows: WorldObjs['glowLights'][number][]; trees: { obj: THREE.Object3D; ph: number }[]; smokers: THREE.Vector3[]; relics?: WorldObjs['relics']; own: THREE.BufferGeometry[]; fountain?: THREE.Vector3; treeG?: THREE.Group[]; treeMerged?: THREE.Mesh[]; staticG?: THREE.Group[]; staticMerged?: THREE.Mesh[]; spin?: [THREE.Object3D, 'x' | 'y' | 'z', number][] }

/* ---------- degraus pisáveis (Erling, 23/10: "não consigo subir a escada, fico atravessando ela" — em todos os prédios grandes).
   As escadarias, plintos e patamares dos prédios eram só desenho: o chão do herói continuava o terreno. Agora, quando um prédio
   carrega, as faces de cima (viradas para o céu) dos seus degraus e plataformas baixas (até 2,2 m acima do chão) viram um mapa de
   alturas de 25 cm. O herói sobe o que estiver a até ~0,55 m do pé (um degrau) e é barrado pelo que for mais alto (a lateral do plinto). */
const STEP_RES = 0.25, stepMap = new Map<number, number>(), stepDone = new WeakSet<object>();
/** muralha orgânica (27/10): gira um prédio construído "para o norte" (fora = −z local) em volta do seu centro local (cxL, czL) e o põe no centro da casa */
function spinB(b: Built, ry: number, cxL: number, czL: number): Built {
  const piv = new THREE.Group(); b.group.position.set(-cxL, 0, -czL); piv.add(b.group); piv.rotation.y = ry; piv.position.set(T / 2, 0, T / 2);
  const rot = (v: THREE.Vector3) => { const x = v.x - cxL, z = v.z - czL; v.x = T / 2 + x * Math.cos(ry) + z * Math.sin(ry); v.z = T / 2 - x * Math.sin(ry) + z * Math.cos(ry); };
  for (const q of b.glows) rot(q.pos); for (const q of b.smoke) rot(q); for (const q of b.torches) rot(q.pos); return { ...b, group: piv };
}
const STEP_KINDS = new Set(['temple', 'church', 'castle', 'academy', 'monument', 'gothic', 'gatehouse', 'landmark', 'house', 'shopfront', 'mausoleum', 'tower', 'altar', 'station']);
const sKey = (ix: number, iz: number) => (iz + 32768) * 65536 + (ix + 32768);
/** altura do degrau/plataforma de prédio neste ponto (m), ou null */
export function stepAt(xm: number, zm: number): number | null { const v = stepMap.get(sKey(Math.floor(xm / STEP_RES), Math.floor(zm / STEP_RES))); return v === undefined ? null : v; }
function registerSteps(g: THREE.Object3D, p: Prop) {
  if (stepDone.has(p) || !STEP_KINDS.has(p.kind)) return; stepDone.add(p);
  g.updateMatrixWorld(true);
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), n = new THREE.Vector3(), gC = new Map<number, number>();
  const gAt = (ix: number, iz: number) => { const k = sKey(ix, iz); let v = gC.get(k); if (v === undefined) { v = groundH((ix + 0.5) * STEP_RES, (iz + 0.5) * STEP_RES); gC.set(k, v); } return v; };
  g.traverse((o) => { const m = o as THREE.Mesh; if (!m.isMesh || !m.visible) return; const mat = m.material as THREE.Material; if (!mat || (mat as THREE.Material).transparent || (mat as THREE.MeshBasicMaterial).isMeshBasicMaterial) return;
    const pos = m.geometry.getAttribute('position'); if (!pos) return; const idx = m.geometry.index, nT = idx ? idx.count / 3 : pos.count / 3, mw = m.matrixWorld;
    for (let t = 0; t < nT; t++) { const i0 = idx ? idx.getX(t * 3) : t * 3, i1 = idx ? idx.getX(t * 3 + 1) : t * 3 + 1, i2 = idx ? idx.getX(t * 3 + 2) : t * 3 + 2;
      a.fromBufferAttribute(pos, i0).applyMatrix4(mw); b.fromBufferAttribute(pos, i1).applyMatrix4(mw); c.fromBufferAttribute(pos, i2).applyMatrix4(mw);
      n.crossVectors(e1.subVectors(b, a), e2.subVectors(c, a)); const L = n.length(); if (L < 1e-8) continue; if (n.y / L < 0.85) continue; // só faces quase horizontais viradas para cima
      const x0 = Math.floor(Math.min(a.x, b.x, c.x) / STEP_RES), x1 = Math.floor(Math.max(a.x, b.x, c.x) / STEP_RES), z0 = Math.floor(Math.min(a.z, b.z, c.z) / STEP_RES), z1 = Math.floor(Math.max(a.z, b.z, c.z) / STEP_RES);
      if ((x1 - x0) * (z1 - z0) > 40000) continue;
      const d = (b.z - c.z) * (a.x - c.x) + (c.x - b.x) * (a.z - c.z); if (Math.abs(d) < 1e-9) continue;
      for (let iz = z0; iz <= z1; iz++) for (let ix = x0; ix <= x1; ix++) { const px = (ix + 0.5) * STEP_RES, pz = (iz + 0.5) * STEP_RES;
        const l1 = ((b.z - c.z) * (px - c.x) + (c.x - b.x) * (pz - c.z)) / d, l2 = ((c.z - a.z) * (px - c.x) + (a.x - c.x) * (pz - c.z)) / d, l3 = 1 - l1 - l2;
        if (l1 < -0.01 || l2 < -0.01 || l3 < -0.01) continue;
        const y = l1 * a.y + l2 * b.y + l3 * c.y, gr = gAt(ix, iz); if (y - gr < 0.06 || y - gr > 2.2) continue;
        const k = sKey(ix, iz), old = stepMap.get(k); if (old === undefined || y > old) stepMap.set(k, y); } } });
}

export function buildWorld(world: World): WorldObjs {
  artWorld = world; palSet = null;
  const fountainRef = (() => { const f = world.props.find((q) => q.kind === 'fountain'); return f ? { x: (f.gx + f.w / 2) * T, z: (f.gy + f.h / 2) * T } : null; })();
  const group = new THREE.Group();
  const tex = noiseTex();
  const windows = new THREE.MeshBasicMaterial({ color: 0xffc266 });
  // brilhos compartilhados (entram no mesmo lote de desenho em todo o chunk): cogumelo-lamparina, flor-de-marghar, prata no veio
  const glowShroom = new THREE.MeshBasicMaterial({ color: 0xffc85a }), glowMarghar = new THREE.MeshBasicMaterial({ color: 0x8ac8ff }), glowSilver = new THREE.MeshBasicMaterial({ color: 0xeef4ff });
  const torchesA: Torch[] = [], glowA: WorldObjs['glowLights'] = [], treesA: WorldObjs['trees'] = [], smokersA: THREE.Vector3[] = [], relicsA: WorldObjs['relics'] = [], spinA: WorldObjs['spinners'] = [];
  const bridgeMeshes = new THREE.Group(); group.add(bridgeMeshes);

  /* iluminação em pool: só as fontes mais próximas ganham PointLight de verdade (número fixo = sem recompilar shaders) */
  const TP = 6, GP = 3;
  const tPool: THREE.PointLight[] = [], gPool: THREE.PointLight[] = [];
  for (let i = 0; i < TP; i++) { const l = new THREE.PointLight(0xff9a3a, 0, 20, 2); l.userData.pool = true; group.add(l); tPool.push(l); }
  for (let i = 0; i < GP; i++) { const l = new THREE.PointLight(0xffbb66, 0, 14, 2); group.add(l); gPool.push(l); }

  /* props por chunk */
  const nCx = Math.ceil(MAP_W / CS), nCy = Math.ceil(MAP_H / CS);
  /* margem de chunks além do mapa: o terreno continua (cordilheira, oceano, pântano, floresta) para a borda nunca parecer um fim de tela */
  const MARGIN = 3, KX = nCx + MARGIN * 2;
  const keyOf = (x: number, y: number) => (y + MARGIN) * KX + (x + MARGIN);
  const byChunk = new Map<number, Prop[]>();
  for (const p of world.props) {
    const k = keyOf(Math.min(nCx - 1, Math.floor((p.gx + p.w / 2) / CS)), Math.min(nCy - 1, Math.floor((p.gy + p.h / 2) / CS)));
    (byChunk.get(k) ?? byChunk.set(k, []).get(k)!).push(p);
  }

  const blossomC = new Map<number, THREE.Material>(); const blossomMat = (c: number) => { let m = blossomC.get(c); if (!m) { m = std(c); blossomC.set(c, m); } return m; };
  function buildProp(p: Prop, L: Loaded): THREE.Group {
    if (p.rot && p.rot & 3) { /* peça girada: monta no próprio eixo e gira em volta do centro; luzes, tochas e fumaça vão junto */
      const k = p.rot & 3, Wm0 = p.w * T, Dm0 = p.h * T, pl: Prop = { ...p, w: k % 2 ? p.h : p.w, h: k % 2 ? p.w : p.h, rot: 0 };
      const n0 = [L.glows.length, L.torches.length, L.smokers.length];
      const inner = buildProp(pl, L), Wl = pl.w * T, Dl = pl.h * T;
      const outer = new THREE.Group(); outer.position.set(p.gx * T + Wm0 / 2, inner.position.y, p.gy * T + Dm0 / 2); outer.rotation.y = k * Math.PI / 2;
      inner.position.set(-Wl / 2, 0, -Dl / 2); outer.add(inner); outer.userData.kind = inner.userData.kind;
      const fix = (v: THREE.Vector3) => { const w = rotLocal(p, v.x - p.gx * T, v.z - p.gy * T); v.x = w.x; v.z = w.z; };
      for (let i = n0[0]; i < L.glows.length; i++) { const q = L.glows[i] as unknown as { pos?: THREE.Vector3 }; if (q.pos) fix(q.pos); } for (let i = n0[1]; i < L.torches.length; i++) fix(L.torches[i].pos); for (let i = n0[2]; i < L.smokers.length; i++) fix(L.smokers[i]);
      return outer;
    }
    const g = new THREE.Group();
    const Wm = p.w * T, Dm = p.h * T;
    const gy0 = groundH(p.gx * T + Wm / 2, p.gy * T + Dm / 2);
    g.position.set(p.gx * T, p.kind === 'boat' || (p.kind === 'dock' && p.variant === 2) ? WL + 0.08 : p.kind === 'fountain' || p.kind === 'house' || p.kind === 'temple' ? Math.max(0, gy0) : gy0, p.gy * T); /* barcos e píeres flutuam no nível da água */
    if (p.kind === 'tar') g.position.y = Math.max(gy0, WL) + 0.01; // água negra: na linha d'água
    const r = rng(p.gx * 977 + p.gy * 131);
    const wx = p.gx * T + Wm / 2, wz = p.gy * T + Dm / 2, wy = g.position.y;
    if (p.kind === 'house') {
      const hs = p.style ? buildStyledHouse(p.style, p.variant ?? 0, Wm, Dm, p.wall, p.roof, { windows, rnd: r }) : buildHouse(p.variant ?? 0, Wm, Dm, p.wall, p.roof, { windows, rnd: r });
      g.add(hs.group);
      for (const ch of hs.chimneys) L.smokers.push(new THREE.Vector3(p.gx * T + ch.x, wy + ch.y, p.gy * T + ch.z));
      L.glows.push({ light: nullLight, base: 14, seed: r() * 50, warm: true, pos: new THREE.Vector3(p.gx * T + hs.lantern.x, wy + hs.lantern.y, p.gy * T + hs.lantern.z), color: 0xffbb66 } as WorldObjs['glowLights'][number]);
    } else if (p.kind === 'monument' || p.kind === 'quay' || p.kind === 'landmark' || p.kind === 'palisade' || p.kind === 'totem' || p.kind === 'rwall' || p.kind === 'rtower' || p.kind === 'gatehouse' || p.kind === 'wstair' || p.kind === 'castle' || p.kind === 'vgate' || p.kind === 'lowwall' || p.kind === 'dock' || p.kind === 'boat' || p.kind === 'chimney' || p.kind === 'crane' || p.kind === 'portico' || (p.kind === 'temple' && (p.variant ?? 0) >= 10)) {
      /* cidade média: muralha com caminho de ronda, torres, portões, escadarias, castelo, academias e a catedral (city3d.ts) */
      const v = p.variant ?? 0; let b: Built | null = null;
      if (p.kind === 'quay') { const sd = v === 1 ? -1 : 1, pts: { x: number; z: number }[] = []; for (let k = 0; k <= 4; k++) { const ty = p.gy + k * 0.5, ex = canalX(ty) - sd * CANAL_HW; pts.push({ x: ex * T - p.gx * T, z: k * 0.5 * T }); } b = buildQuay(pts, sd); } else
      if (p.kind === 'monument') { b = buildMonument(v, Wm, Dm); if (v === 10) { const beams: THREE.Object3D[] = []; b.group.traverse((o) => { if (o.userData.beam) beams.push(o); }); for (const o of beams) (L.spin ??= []).push([o, 'y', 0.35]); { const foams: THREE.Object3D[] = []; b.group.traverse((o) => { if (o.userData.foam !== undefined) foams.push(o); }); for (const o of foams) { const piv = new THREE.Group(); piv.position.copy(o.position); o.position.set(0, 0, 0); o.parent?.add(piv); piv.add(o); piv.userData.dyn = true; L.trees.push({ obj: piv, ph: o.userData.foam * 1.3 }); } } /* a espuma balança como as copas */ } } /* o feixe do farol gira */ else if (p.kind === 'dock' || p.kind === 'boat' || p.kind === 'chimney' || p.kind === 'crane' || p.kind === 'portico') b = buildVapor(p.kind, v, Wm, Dm, p.gx * 31 + p.gy * 17); else
      if (p.kind === 'vgate') b = buildVillageGate(p.label ?? '', v, p.ry ?? 0, p.len ?? 6, p.ox ?? 1, p.oz ?? 1); else if (p.kind === 'lowwall') b = buildLowWall(v, p.ry ?? 0, p.gx * 31 + p.gy * 17, p.len, p.broken ?? 0, p.ox ?? 1, p.oz ?? 1); else
      if (p.kind === 'landmark') b = buildLandmark(v, Wm, Dm); else if (p.kind === 'palisade') b = buildPalisade(v === 1, p.gx * 3 + p.gy); else if (p.kind === 'totem') b = buildTotem(v); else
      if (p.kind === 'rwall') b = p.ry !== undefined ? spinB(v === 24 ? buildKitSpan(p.height, p.len ?? T, p.gx * 7 + p.gy * 13) : v >= 20 ? buildKitWall(p.height, p.len ?? T, p.gx * 7 + p.gy * 13, v === 23) : buildRampartSeg(p.height, p.len ?? T, p.gx * 7 + p.gy * 13, v), p.ry, T / 2, T / 2) : buildRampart(v & 3, p.height, p.gx * 7 + p.gy * 13);
      else if (p.kind === 'rtower') b = p.ry !== undefined ? spinB(v === 20 ? buildKitTower(p.height, p.gx + p.gy) : v >= 8 && v < 12 ? buildRoundTower(p.height, p.len ?? 3, p.roof, v === 10, p.gx * 7 + p.gy * 13) : buildWallTower(0, p.height, v === 12, p.roof), p.ry, T / 2, T / 2) : buildWallTower(v & 3, p.height, v >= 4, p.roof);
      else if (p.kind === 'gatehouse') b = p.ry !== undefined ? spinB(v === 20 ? buildKitGate(p.len ?? 5, p.height) : buildGatehouse(0, p.len ?? 5, p.height, p.roof), p.ry, (p.len ?? 5) * T / 2, T / 2) : buildGatehouse(v, Math.max(p.w, p.h), p.height, p.roof);
      else if (p.kind === 'wstair') b = buildWallStair(v >> 1, Math.max(p.w, p.h), v & 1 ? 1 : -1, p.height);
      else if (p.kind === 'castle') b = buildCastle(Wm, Dm, p.wall, p.roof);
      else if (v === 20) { g.add(buildGothic(Wm, Dm, p.wall, p.roof, true)); L.glows.push({ light: nullLight, base: 44, seed: r() * 50, warm: true, pos: new THREE.Vector3(wx, wy + 6, p.gy * T + Dm + 3), color: 0xffb060 } as WorldObjs['glowLights'][number]); }
      else b = buildAcademy(v, Wm, Dm, p.wall);
      if (b) { g.add(b.group);
        /* GRAVIDADE (28/10, Erling: "esse muro flutuando"): o muro baixo acompanha o chão pedra por pedra — cada peça desce ou sobe
           até o terreno embaixo dela (e afunda um dedo), em vez de o muro inteiro ficar na altura do centro */
        if (p.kind === 'lowwall') { g.updateMatrixWorld(true); const v3 = new THREE.Vector3(), bx = new THREE.Box3(); const ms: THREE.Mesh[] = []; b.group.traverse((o) => { if ((o as THREE.Mesh).isMesh) ms.push(o as THREE.Mesh); });
          for (const m of ms) { bx.setFromObject(m); if (bx.isEmpty()) continue; bx.getCenter(v3); const gy1 = Math.min(groundH(bx.min.x, bx.min.z), groundH(bx.max.x, bx.max.z), groundH(bx.min.x, bx.max.z), groundH(bx.max.x, bx.min.z), groundH(v3.x, v3.z)); m.position.y += gy1 - wy - 0.05; } }
        for (const q of b.glows) L.glows.push({ light: nullLight, base: q.base, seed: r() * 50, warm: true, pos: new THREE.Vector3(p.gx * T + q.pos.x, wy + q.pos.y, p.gy * T + q.pos.z), color: q.color } as WorldObjs['glowLights'][number]);
        for (const q of b.smoke) L.smokers.push(new THREE.Vector3(p.gx * T + q.x, wy + q.y, p.gy * T + q.z));
        for (const q of b.torches) L.torches.push({ pos: new THREE.Vector3(p.gx * T + q.pos.x, wy + q.pos.y, p.gy * T + q.pos.z), light: nullLight, base: 46, seed: r() * 50, flame: q.flame, dist: 0 }); }
    } else if (p.kind === 'church' && p.variant === 2) { // a Catedral Abandonada: gótica, altíssima
      g.add(buildGothic(Wm, Dm, p.wall, p.roof));
    } else if (p.kind === 'church' || p.kind === 'temple') {
      const ruinedC = p.kind === 'church';
      const tp = buildTemple(Wm, Dm, p.wall, p.roof === 0x8f7bff ? 0x4a4468 : p.roof, ruinedC, windows, p.gx * 7 + p.gy * 3);
      g.add(tp.group);
      if (!ruinedC) L.glows.push({ light: nullLight, base: 40, seed: r() * 50, warm: false, pos: new THREE.Vector3(p.gx * T + tp.glow.x, wy + tp.glow.y, p.gy * T + tp.glow.z), color: 0x8f7bff } as WorldObjs['glowLights'][number]);
    } else if (p.kind === 'fountain' && artGeo('fonte_praca')) { /* 03/11: a Fonte da Praça do Herik (tanque, taça e a estátua encapuzada) */
      const fm = artMesh('fonte_praca')!; const k = (SCALE.fountain.radius + 0.1) / artGeo('fonte_praca')!.userData.r; fm.scale.setScalar(k); fm.position.set(Wm / 2, 0, Dm / 2); fm.rotation.y = Math.PI / 4; g.add(fm);
      L.glows.push({ light: nullLight, base: 8, seed: r() * 50, warm: false, pos: new THREE.Vector3(wx, wy + 3.2 * k, wz + 1.2), color: 0x6fc7ff } as WorldObjs['glowLights'][number]);
      L.fountain = new THREE.Vector3(wx, wy, wz);
    } else if (p.kind === 'fountain') {
      /* 01/11 (Erling): a fonte da praça refeita pela prancha de referência (imagem 62): tanque redondo de pedra com musgo, calçada em volta,
         taça canelada no meio com três bicas, e em cima a estátua encapuzada segurando o losango com o Olho. */
      const rad = SCALE.fountain.radius, hh = SCALE.fountain.height;
      const stoneM = std(0xffffff, { map: stoneTex(0x9a9690) }), stoneD = std(0xffffff, { map: stoneTex(0x7a7672) }), statueM = std(0x787a74, {}), mossM = std(0x4e6a26, {}), fernM = std(0x4e8a34, { side: THREE.DoubleSide });
      const C = (m: THREE.Mesh, y = 0, w = 0.04) => { ink(m, w); m.position.x += Wm / 2; m.position.y += y; m.position.z += Dm / 2; m.castShadow = m.receiveShadow = true; g.add(m); return m; };
      const lathe = (pts: [number, number][], m: THREE.Material, y = 0, seg = 24, rep = 0) => { const geo = new THREE.LatheGeometry(pts.map(([x, yy]) => new THREE.Vector2(x, yy)), seg); if (rep) { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * rep, uv.getY(i) * 2); } return C(new THREE.Mesh(geo, m), y); };
      // calçada de pedras em volta e o tanque de tijolos de pedra
      lathe([[0, 0], [rad + 1.0, 0], [rad + 1.0, 0.1], [0, 0.1]], stoneD, 0, 28, 10);
      lathe([[rad - 0.4, 0.1], [rad + 0.08, 0.1], [rad + 0.08, hh - 0.08], [rad - 0.4, hh - 0.08]], stoneM, 0, 28, 12);
      for (let i = 0; i < 20; i++) { const a2 = (i / 20) * 6.283; const cap = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.12, 0.5), i % 3 ? stoneM : stoneD); cap.position.set(Math.cos(a2) * (rad - 0.16), hh - 0.02, Math.sin(a2) * (rad - 0.16)); cap.rotation.y = -a2; C(cap, 0, 0.03); } // pedras da borda
      for (let i = 0; i < 9; i++) { const a2 = i * 0.7 + 0.2, ms = new THREE.Mesh(new THREE.SphereGeometry(0.16 + (i % 3) * 0.05, 7, 5), mossM); ms.scale.set(1.4, 0.5, 1); ms.position.set(Math.cos(a2) * (rad + 0.06), 0.2 + (i % 4) * 0.16, Math.sin(a2) * (rad + 0.06)); C(ms, 0, 0); } // musgo na parede
      for (let i = 0; i < 6; i++) { const a2 = i * 1.05 + 0.4, r0 = rad + 0.35; for (let k = 0; k < 5; k++) { const f = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.42), fernM); f.position.set(Math.cos(a2) * r0 + (k - 2) * 0.05, 0.3, Math.sin(a2) * r0 + ((k * 7) % 5 - 2) * 0.04); f.rotation.set(-0.5 + (k % 3) * 0.35, k * 1.3 + i, 0); C(f, 0, 0); } } // samambaias ao pé
      const wat = new THREE.Mesh(new THREE.CircleGeometry(rad - 0.4, 28).rotateX(-Math.PI / 2), fountainWater); wat.position.set(Wm / 2, hh - 0.22, Dm / 2); g.add(wat);
      // pedestal, coluna e a taça canelada com três bicas
      lathe([[0, 0.1], [0.62, 0.1], [0.62, 0.4], [0.5, 0.42], [0.5, 0.5], [0.28, 0.56], [0.24, 1.55], [0.34, 1.62], [0.34, 1.7], [0, 1.7]], stoneM, 0, 20);
      const basinY = FOUNTAIN.bowl - 0.45;
      lathe([[0, 0], [0.36, 0], [0.9, 0.28], [1.02, 0.46], [0.96, 0.5], [0.0, 0.42]], stoneM, basinY, 24);
      for (let i = 0; i < 16; i++) { const a2 = (i / 16) * 6.283, k = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 5), stoneM); k.scale.set(1, 1.5, 0.7); k.position.set(Math.cos(a2) * 0.98, basinY + 0.4, Math.sin(a2) * 0.98); k.rotation.y = -a2; C(k, 0, 0.02); } // canelado da taça
      const wat2 = new THREE.Mesh(new THREE.CircleGeometry(0.9, 20).rotateX(-Math.PI / 2), fountainWater); wat2.position.set(Wm / 2, basinY + 0.44, Dm / 2); g.add(wat2);
      for (let i = 0; i < 3; i++) { const a2 = (i / 3) * 6.283 + 0.5, sp = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.32), stoneD); sp.position.set(Math.cos(a2) * 1.0, basinY + 0.36, Math.sin(a2) * 1.0); sp.rotation.y = -a2 + Math.PI / 2; C(sp, 0, 0.02); } // bicas
      lathe([[0, 0.4], [0.46, 0.4], [0.5, 0.5], [0.5, 0.7], [0.42, 0.72], [0, 0.72]], stoneD, basinY, 16); // plinto da estátua
      // a estátua: manto encapuzado, braços à frente segurando o losango com o Olho
      const SY = basinY + 0.72, ST = new THREE.Group(); ST.position.set(Wm / 2, SY, Dm / 2); ST.rotation.y = Math.PI / 4; g.add(ST); // a estátua olha para a câmera (sudeste)
      const robe = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [0.46, 0], [0.42, 0.3], [0.34, 0.9], [0.3, 1.35], [0.26, 1.5], [0.14, 1.58], [0, 1.6]].map(([x, y]) => new THREE.Vector2(x, y)), 18), statueM); ink(robe, 0.04); robe.castShadow = true; ST.add(robe);
      for (let i = 0; i < 10; i++) { const a2 = (i / 10) * 6.283, fold = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.3, 0.04), statueM); fold.position.set(Math.cos(a2) * 0.39, 0.66, Math.sin(a2) * 0.39); fold.rotation.y = -a2; fold.rotation.z = 0.05; ST.add(fold); } // pregas
      const hood = new THREE.Mesh(new THREE.SphereGeometry(0.21, 12, 9, 0, Math.PI * 2, 0, Math.PI * 0.62), statueM); hood.position.set(0, 1.72, -0.02); hood.scale.set(1, 1.15, 1.1); ink(hood, 0.03); ST.add(hood);
      const hoodTip = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.3, 8), statueM); hoodTip.position.set(0, 1.98, -0.08); hoodTip.rotation.x = -0.5; ST.add(hoodTip);
      const face = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), std(0x5a5c56, {})); face.position.set(0, 1.7, 0.1); ST.add(face);
      for (const sx of [-1, 1]) { const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.5, 8), statueM); arm.position.set(sx * 0.22, 1.2, 0.2); arm.rotation.set(1.2, 0, sx * -0.5); ink(arm, 0.02); ST.add(arm); const sleeve = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.28, 8), statueM); sleeve.position.set(sx * 0.3, 1.32, 0.08); sleeve.rotation.set(1.0, 0, sx * -0.6); ST.add(sleeve); }
      const PL = new THREE.Group(); PL.position.set(0, 1.12, 0.36); PL.rotation.x = -0.55; ST.add(PL); // o losango inclinado para cima: visto de cima, lê-se o Olho
      const plaque = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.06), stoneD); plaque.rotation.z = Math.PI / 4; ink(plaque, 0.03); PL.add(plaque);
      const plaqueIn = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.36, 0.07), statueM); plaqueIn.rotation.z = Math.PI / 4; PL.add(plaqueIn);
      const eyeR = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.025, 6, 16), std(0x4e5048, {})); eyeR.scale.set(1.4, 0.85, 1); eyeR.position.z = 0.04; PL.add(eyeR);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshBasicMaterial({ color: 0x8fd8ff })); pupil.position.z = 0.05; PL.add(pupil);
      for (let i = 0; i < 5; i++) { const ms = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 5), mossM); ms.scale.set(1.2, 0.5, 0.8); ms.position.set(Math.cos(i * 1.9) * 0.36, 0.25 + i * 0.28, Math.sin(i * 1.9) * 0.36); ST.add(ms); } // musgo na estátua
      L.glows.push({ light: nullLight, base: 8, seed: r() * 50, warm: false, pos: new THREE.Vector3(wx, wy + SY + 1.3, wz + 1.2), color: 0x6fc7ff } as WorldObjs['glowLights'][number]);
      L.fountain = new THREE.Vector3(wx, wy, wz);
    } else if (p.kind === 'chest') {
      /* Baú de tesouro (cai item): tábuas DEITADAS, tampa abaulada de verdade, cintas de ferro que abraçam corpo e tampa,
       *  cantoneiras e fechadura de latão. Tudo num subgrupo centrado no tile, para o giro não tirar o baú do lugar. */
      const cg = new THREE.Group(); cg.position.set(Wm / 2, 0, Dm / 2); g.add(cg);
      const W0 = 0.86, H0 = 0.44, D0 = 0.54, R0 = D0 / 2;
      const woodA = std(0x6e4526), woodB = std(0x5c391f), woodL = std(0x7c5130), iron = std(0x2c2a2e), brassM = std(0xd9b153, { emissive: 0x3a2a08 });
      const put = (m: THREE.Mesh, x: number, y: number, z: number, w = 0) => { m.position.set(x, y, z); if (w) ink(m, w); m.castShadow = true; cg.add(m); return m; };
      // corpo: três tábuas deitadas, de tons diferentes, com um fio escuro entre elas
      const bodyIn = put(new THREE.Mesh(new THREE.BoxGeometry(W0 - 0.02, H0 - 0.02, D0 - 0.02), std(0x1a0f08)), 0, H0 / 2, 0);
      bodyIn.castShadow = true;
      for (let i = 0; i < 3; i++) put(new THREE.Mesh(new THREE.BoxGeometry(W0, H0 / 3 - 0.014, D0), i === 1 ? woodB : woodA), 0, H0 / 6 + i * H0 / 3, 0, i === 0 ? 0.025 : 0);
      // tampa abaulada (meio cilindro deitado ao longo do X), presa na dobradiça de trás para poder abrir
      const lid = new THREE.Group(); lid.position.set(0, H0, -R0); cg.add(lid);
      const lidG = new THREE.CylinderGeometry(R0, R0, W0, 12, 1, false, 0, Math.PI).rotateZ(Math.PI / 2);
      const lm = new THREE.Mesh(lidG, woodL); lm.position.set(0, 0, R0); ink(lm, 0.025); lm.castShadow = true; lid.add(lm);
      // cintas de ferro: duas, abraçando o corpo (frente, trás, fundo) e a tampa (meio anel)
      for (const sx of [-0.27, 0.27]) {
        put(new THREE.Mesh(new THREE.BoxGeometry(0.07, H0 + 0.01, D0 + 0.03), iron), sx, H0 / 2, 0);
        const band = new THREE.Mesh(new THREE.TorusGeometry(R0 + 0.012, 0.018, 4, 12, Math.PI).rotateY(Math.PI / 2), iron); band.scale.set(2.2, 1, 1); band.position.set(sx, 0, R0); lid.add(band);
      }
      // cantoneiras de latão nas quinas da frente e fechadura com buraco da chave
      for (const sx of [-1, 1]) for (const yy of [0.04, H0 - 0.04]) put(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.02), brassM), sx * (W0 / 2 - 0.035), yy, D0 / 2 + 0.008);
      const plate = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.16, 0.03), brassM); plate.position.set(0, -0.02, D0 + 0.012); lid.add(plate);
      const hole = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.06, 0.012), std(0x120a04)); hole.position.set(0, -0.04, D0 + 0.03); lid.add(hole);
      // alças de ferro nas laterais
      for (const sx of [-1, 1]) { const h = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.014, 4, 10, Math.PI).rotateY(Math.PI / 2), iron); h.position.set(sx * (W0 / 2 + 0.012), H0 * 0.62, 0); h.rotation.x = Math.PI; cg.add(h); }
      // pés baixos para não flutuar nem afundar no capim
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) put(new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.05, 0.09), woodB), sx * (W0 / 2 - 0.06), -0.015, sz * (D0 / 2 - 0.06));
      cg.position.y = 0.035; cg.scale.setScalar(0.8); /* do tamanho de um baú de verdade: até o joelho do herói */
      cg.rotation.y = ((p.variant ?? 0) % 4) * (Math.PI / 2) + ((p.variant ?? 0) % 2 ? 0.25 : -0.2);
      lid.userData.dyn = true; chestLids.set(p, lid); /* dyn: a tampa fica fora da fusão estática e pode abrir */
    } else if (p.kind === 'bones') {
      const bm = std(0xd8d0b8); const v = p.variant ?? 0;
      const sk = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), bm); ink(sk, 0.02); sk.position.set(Wm / 2 - 0.5, 0.17, Dm / 2); sk.scale.set(1, 0.85, 1.1); g.add(sk);
      for (const s of [-1, 1]) { const ey = new THREE.Mesh(new THREE.SphereGeometry(0.05, 5, 4), std(0x060606)); ey.position.set(Wm / 2 - 0.5 + s * 0.08, 0.2, Dm / 2 + 0.17); g.add(ey); }
      const jw = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 0.14), bm); jw.position.set(Wm / 2 - 0.5, 0.06, Dm / 2 + 0.12); g.add(jw);
      for (let i = 0; i < 5; i++) { const rb = new THREE.Mesh(new THREE.TorusGeometry(0.2 - i * 0.015, 0.025, 4, 8, Math.PI), bm); rb.position.set(Wm / 2 + 0.1 + i * 0.1, 0.06, Dm / 2); rb.rotation.set(0, Math.PI / 2, 0.3); g.add(rb); }
      for (let i = 0; i < 3 + v; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.45 + r() * 0.3, 5), bm); b.rotation.set(Math.PI / 2, 0, r() * 3); b.position.set(Wm / 2 + (r() - 0.5) * 1.6, 0.04, Dm / 2 + (r() - 0.5) * 1.2); g.add(b); }
      if (v === 2) { const sw = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.9), std(0x7a6a58)); sw.position.set(Wm / 2 + 0.6, 0.05, Dm / 2 + 0.5); sw.rotation.y = 0.6; g.add(sw); }
    } else if (p.kind === 'bench') {
      const sm = std(0xffffff, { map: plankTex(0x6a4528) });
      const bg = new THREE.Group(); bg.position.set(Wm / 2, 0, Dm / 2); g.add(bg);
      const sit = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.1, 0.5), sm); ink(sit, 0.02); sit.position.set(0, 0.5, 0); bg.add(sit);
      const bk = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.4, 0.08), sm); bk.position.set(0, 0.85, -0.23); bk.rotation.x = -0.15; bg.add(bk);
      for (const s2 of [-1, 1]) { const lg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.45), std(0x2a2a32)); lg.position.set(s2 * 0.72, 0.25, 0); bg.add(lg); }
      const fp = (typeof fountainRef !== 'undefined' && fountainRef) ? fountainRef : null;
      bg.rotation.y = fp ? Math.atan2(fp.x - wx, fp.z - wz) : (p.variant ?? 0) * Math.PI / 2;
    } else if (p.kind === 'mailbox') {
      // caixa de correio: poste de madeira, caixa de ferro escuro com cintas de bronze, telhadinho, fenda e um corvo de ferro no topo
      const iron = std(0x3a3f46), bronze = std(0x8a6a3a), wood = std(0xffffff, { map: plankTex(0x4a3020) });
      const bg = new THREE.Group(); bg.position.set(Wm / 2, 0, Dm / 2); g.add(bg);
      const po = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.1, 0.16), wood); ink(po, 0.02); po.position.y = 0.55; po.castShadow = true; bg.add(po);
      const bx = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.5, 0.46), iron); ink(bx, 0.02); bx.position.y = 1.32; bx.castShadow = true; bg.add(bx);
      for (const y of [1.14, 1.5]) { const band = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.05, 0.5), bronze); band.position.y = y; bg.add(band); }
      const rf = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.66, 10, 1, false, 0, Math.PI), iron); rf.rotation.z = Math.PI / 2; rf.position.y = 1.57; ink(rf, 0.02); bg.add(rf);
      const slot = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.04, 0.02), std(0x0a0a0c)); slot.position.set(0, 1.42, 0.235); bg.add(slot);
      const plate = new THREE.Mesh(new THREE.CircleGeometry(0.07, 10), bronze); plate.position.set(0, 1.24, 0.235); bg.add(plate);
      { const rv = new THREE.Group(); rv.position.set(0.08, 1.86, 0); bg.add(rv); const rm = std(0x15151a);
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), rm); body.scale.set(1, 0.9, 1.5); rv.add(body);
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), rm); head.position.set(0, 0.08, 0.11); rv.add(head);
        const beak = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.08, 5), std(0x2a2a2a)); beak.rotation.x = Math.PI / 2; beak.position.set(0, 0.075, 0.18); rv.add(beak);
        const tail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 0.14), rm); tail.position.set(0, 0.02, -0.17); tail.rotation.x = 0.4; rv.add(tail); }
      const fp = (typeof fountainRef !== 'undefined' && fountainRef) ? fountainRef : null;
      bg.rotation.y = fp ? Math.atan2(fp.x - wx, fp.z - wz) : (p.variant ?? 0);
    } else if (p.kind === 'library') { // as bibliotecas (library3d)
      const lb = buildLibrary(p.variant ?? 0, p.label ?? 'Biblioteca'); lb.group.position.set(Wm / 2, 0, Dm / 2); lb.group.rotation.y = p.ry ?? 0; g.add(lb.group);
      for (const gl of lb.glows) L.glows.push({ light: nullLight, base: gl.base, seed: r() * 50, warm: true, pos: new THREE.Vector3(gl.x, gl.y, gl.z).applyAxisAngle(new THREE.Vector3(0, 1, 0), p.ry ?? 0).add(new THREE.Vector3(wx, wy, wz)), color: gl.color } as WorldObjs['glowLights'][number]);
    } else if (p.kind === 'station') { // pontos de trabalho dos ofícios
      const st = p.w >= 3 ? buildWorkshop(p.variant ?? 0, r, p.label ?? '', p.wdir !== undefined ? p.wdir - (p.ry ?? 0) : undefined, p.ry ?? 0) : buildStation(p.variant ?? 0, r, false, p.wdir !== undefined ? p.wdir - (p.ry ?? 0) : undefined, p.ry ?? 0); st.group.position.set(Wm / 2, 0, Dm / 2); st.group.rotation.y = p.ry ?? 0; g.add(st.group);
      if (st.spin) (L.spin ??= []).push(...st.spin);
      const loc = (v: { x: number; y: number; z: number }) => new THREE.Vector3(v.x, v.y, v.z).applyAxisAngle(new THREE.Vector3(0, 1, 0), p.ry ?? 0).add(new THREE.Vector3(wx, wy, wz));
      if (st.glow) L.glows.push({ light: nullLight, base: st.glow.base, seed: r() * 50, warm: true, pos: loc(st.glow), color: st.glow.color } as WorldObjs['glowLights'][number]);
      if (st.smoke) { const v = loc(st.smoke); if ((st.smoke as { strong?: boolean }).strong) (v as THREE.Vector3 & { strong?: boolean }).strong = true; L.smokers.push(v); }
    } else if (p.kind === 'vault') {
      // Baú do Caminhante: arca grande de carvalho com cintas de ferro, cantoneiras de bronze, o Olho de Marghar na tampa, sobre um tablado de pedra
      const wood = std(0xffffff, { map: plankTex(0x5a3a20) }), iron = std(0x2e3238), bronze = std(0xb08a40), stone = std(0x7a766e);
      const bg = new THREE.Group(); bg.position.set(Wm / 2, 0, Dm / 2); g.add(bg);
      const base = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.14, 0.95), stone); ink(base, 0.02); base.position.y = 0.07; bg.add(base);
      const box = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.55, 0.72), wood); ink(box, 0.02); box.position.y = 0.42; box.castShadow = true; bg.add(box);
      const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 1.1, 12, 1, false, 0, Math.PI), wood); lid.rotation.z = Math.PI / 2; lid.position.y = 0.7; ink(lid, 0.02); lid.castShadow = true; bg.add(lid);
      for (const x of [-0.38, 0, 0.38]) { const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.56, 0.74), iron); b2.position.set(x, 0.42, 0); bg.add(b2); const b3 = new THREE.Mesh(new THREE.CylinderGeometry(0.375, 0.375, 0.07, 12, 1, false, 0, Math.PI), iron); b3.rotation.z = Math.PI / 2; b3.position.set(x, 0.7, 0); bg.add(b3); }
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const cn = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), bronze); cn.position.set(sx * 0.52, 0.2, sz * 0.33); bg.add(cn); }
      const lock = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.2, 0.05), bronze); lock.position.set(0, 0.62, 0.37); bg.add(lock);
      const eye = new THREE.Mesh(new THREE.CircleGeometry(0.11, 14), std(0xd9b45a)); eye.scale.y = 0.5; eye.position.set(0, 0.92, 0.17); eye.rotation.x = -0.9; bg.add(eye);
      const iris = new THREE.Mesh(new THREE.CircleGeometry(0.04, 10), new THREE.MeshBasicMaterial({ color: 0x9b6ad0 })); iris.position.set(0, 0.921, 0.172); iris.rotation.x = -0.9; bg.add(iris);
      const fp = (typeof fountainRef !== 'undefined' && fountainRef) ? fountainRef : null;
      bg.rotation.y = fp ? Math.atan2(fp.x - wx, fp.z - wz) : 0;
    } else if (p.kind === 'shopfront') {
      // o Shop: pavilhão de lona violeta-noite listrada de ouro, balcão de madeira escura, vitrines com os brasões, placa pendurada "SHOP" e o Olho de Marghar no topo
      const dark = std(0xffffff, { map: plankTex(0x3a2414) }), gold = std(0xd9b45a), cloth = std(0x3a2050, { side: THREE.DoubleSide }), cloth2 = std(0x24123a, { side: THREE.DoubleSide });
      const bg = new THREE.Group(); bg.position.set(Wm / 2, 0, Dm / 2); g.add(bg);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const po = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 2.7, 8), dark); po.position.set(sx * 1.25, 1.35, sz * 1.0); po.castShadow = true; bg.add(po); const cap = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), gold); cap.position.set(sx * 1.25, 2.72, sz * 1.0); bg.add(cap); }
      // telhado em tenda: 8 gomos alternando violeta e violeta-escuro
      for (let i = 0; i < 8; i++) { const a0 = i / 8 * Math.PI * 2; const seg = new THREE.Mesh(new THREE.ConeGeometry(1.9, 1.1, 8, 1, true, a0, Math.PI / 4), i % 2 ? cloth : cloth2); seg.position.y = 3.2; seg.castShadow = true; bg.add(seg); }
      for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; const fl = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.24, 3), i % 2 ? gold : cloth); fl.rotation.x = Math.PI; fl.position.set(Math.cos(a) * 1.82, 2.55, Math.sin(a) * 1.82); fl.rotation.y = -a; bg.add(fl); } // franja
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.86, 0.04, 6, 32), gold); ring.rotation.x = Math.PI / 2; ring.position.y = 2.66; bg.add(ring);
      const top = new THREE.Group(); top.position.y = 3.95; bg.add(top);
      const lens = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8), gold); lens.scale.set(1.5, 0.75, 0.5); top.add(lens);
      const ir = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), new THREE.MeshBasicMaterial({ color: 0xc9a0ff })); ir.position.z = 0.08; top.add(ir);
      const ir2 = ir.clone(); ir2.position.z = -0.08; top.add(ir2);
      // balcão e vitrines
      const ct = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.95, 0.6), dark); ink(ct, 0.02); ct.position.set(0, 0.48, 0.55); ct.castShadow = true; bg.add(ct);
      const tp = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.06, 0.7), std(0x6a4a2a)); tp.position.set(0, 0.98, 0.55); bg.add(tp);
      const trim = new THREE.Mesh(new THREE.BoxGeometry(2.22, 0.05, 0.62), gold); trim.position.set(0, 0.3, 0.55); bg.add(trim);
      // dois estandartes atrás do balcão: o azul do Fio e o negro dos Desfiados, lado a lado (a loja é neutra)
      for (const [sx, col, rim] of [[-0.7, 0x1f3a6e, 0xd9b45a], [0.7, 0x16121a, 0xa3151f]] as [number, number, number][]) {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.1, 6), dark); pole.position.set(sx, 1.05, -0.35); bg.add(pole);
        const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.62, 6), gold); bar.rotation.z = Math.PI / 2; bar.position.set(sx, 2.05, -0.33); bg.add(bar);
        const ban = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.9), std(col, { side: THREE.DoubleSide })); ban.position.set(sx, 1.58, -0.32); bg.add(ban);
        const tip = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.24, 3), std(col)); tip.rotation.z = Math.PI; tip.scale.z = 0.05; tip.position.set(sx, 1.02, -0.32); bg.add(tip);
        const em = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.025, 6, 18), std(rim)); em.position.set(sx, 1.62, -0.31); bg.add(em); }
      // mercadorias no balcão: um baú pequeno, um carretel de ouro, frascos violeta
      { const ch = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.22, 0.24), std(0x5a3a20)); ch.position.set(-0.75, 1.12, 0.55); bg.add(ch); const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.2, 10), gold); sp.position.set(0.05, 1.11, 0.55); bg.add(sp);
        for (let i = 0; i < 3; i++) { const vf = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.18, 8), new THREE.MeshBasicMaterial({ color: 0x9b6ad0 })); vf.position.set(0.5 + i * 0.16, 1.1, 0.55); bg.add(vf); } }
      // placa pendurada na frente: SHOP
      { const cv = document.createElement('canvas'); cv.width = 256; cv.height = 96; const c2 = cv.getContext('2d')!; c2.fillStyle = '#2a1a10'; c2.fillRect(0, 0, 256, 96); c2.strokeStyle = '#d9b45a'; c2.lineWidth = 6; c2.strokeRect(6, 6, 244, 84); c2.fillStyle = '#f0d890'; c2.font = 'bold 58px Cinzel, Georgia, serif'; c2.textAlign = 'center'; c2.textBaseline = 'middle'; c2.fillText('SHOP', 128, 52);
        const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; const sg = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.42), new THREE.MeshBasicMaterial({ map: tx, side: THREE.DoubleSide })); sg.position.set(0, 2.25, 1.08); bg.add(sg);
        for (const sx of [-0.4, 0.4]) { const ch2 = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.36, 4), std(0x3a3a40)); ch2.position.set(sx, 2.6, 1.08); bg.add(ch2); } }
      const fp = (typeof fountainRef !== 'undefined' && fountainRef) ? fountainRef : null;
      bg.rotation.y = fp ? Math.atan2(fp.x - wx, fp.z - wz) : 0;
    } else if (p.kind === 'noticeboard') {
      // tábua de avisos: dois postes, telhadinho, papéis pregados (contratos, recompensas, um cartaz de procurado)
      const wood = std(0xffffff, { map: plankTex(0x5a3a20) }), dark = std(0x3a2414), iron = std(0x3a3a40);
      const bg = new THREE.Group(); bg.position.set(Wm / 2, 0, Dm / 2); g.add(bg);
      for (const sx of [-1, 1]) { const po = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.55, 0.14), dark); ink(po, 0.02); po.position.set(sx * 0.95, 1.27, 0); po.castShadow = true; bg.add(po); }
      const bd = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.15, 0.08), wood); ink(bd, 0.02); bd.position.set(0, 1.55, 0); bd.castShadow = true; bg.add(bd);
      for (const y of [0.97, 2.13]) { const tr = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.08, 0.12), dark); tr.position.set(0, y, 0.01); bg.add(tr); }
      for (const sx of [-1, 1]) { const rf = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.05, 0.5), std(0xffffff, { map: shingleTex(0x4a3020) })); ink(rf, 0.02); rf.position.set(sx * 0.5, 2.62 - 0.12, 0); rf.rotation.z = -sx * 0.32; rf.castShadow = true; bg.add(rf); }
      const PAPER = [0xe8dcb8, 0xd8c79c, 0xf0e6c8, 0xcdb88e, 0xe2d2a8], rr = (a: number) => (Math.sin(a * 91.7 + wx * 3.1) * 0.5 + 0.5);
      const spots: [number, number, number, number][] = [[-0.6, 1.78, 0.42, 0.5], [-0.12, 1.84, 0.36, 0.44], [0.34, 1.74, 0.44, 0.56], [0.7, 1.86, 0.28, 0.36], [-0.66, 1.26, 0.36, 0.42], [-0.2, 1.3, 0.44, 0.36], [0.24, 1.26, 0.3, 0.4], [0.64, 1.3, 0.4, 0.46]];
      spots.forEach(([x, y, w2, h2], i) => {
        const pm = new THREE.Mesh(new THREE.PlaneGeometry(w2, h2), std(PAPER[i % PAPER.length], { side: THREE.DoubleSide })); pm.position.set(x, y, 0.05 + i * 0.002); pm.rotation.z = (rr(i) - 0.5) * 0.3; bg.add(pm);
        for (let l = 0; l < 3; l++) { const ln = new THREE.Mesh(new THREE.PlaneGeometry(w2 * (0.55 + rr(i + l) * 0.25), 0.018), std(0x4a3a28)); ln.position.set(0, h2 * 0.18 - l * h2 * 0.17, 0.002); pm.add(ln); }
        if (i === 2) { const face = new THREE.Mesh(new THREE.PlaneGeometry(w2 * 0.5, h2 * 0.32), std(0x5a4632)); face.position.set(0, h2 * 0.1, 0.003); pm.add(face); }
        const pin = new THREE.Mesh(new THREE.SphereGeometry(0.028, 6, 4), i % 3 === 0 ? std(0x8a1a14) : iron); pin.position.set(0, h2 / 2 - 0.05, 0.02); pm.add(pin);
      });
      const fp = (typeof fountainRef !== 'undefined' && fountainRef) ? fountainRef : null;
      bg.rotation.y = fp ? Math.atan2(fp.x - wx, fp.z - wz) : 0;
    } else if (p.kind === 'stall') {
      const cm = std(p.wall, { map: plankTex(p.wall) });
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const po = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 2.3, 6), std(0x4a3220)); po.position.set(Wm / 2 + sx * 1.3, 1.15, Dm / 2 + sz * 0.8); po.castShadow = true; g.add(po); }
      const tb = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.9, 0.9), cm); ink(tb, 0.03); tb.position.set(Wm / 2, 0.45, Dm / 2 + 0.1); g.add(tb);
      const cv = new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.1, 2.2), std(p.roof, { map: shingleTex(p.roof) })); cv.position.set(Wm / 2, 2.4, Dm / 2); cv.rotation.x = 0.2; ink(cv, 0.03); cv.castShadow = true; g.add(cv);
      for (let i = 0; i < 6; i++) { const it = new THREE.Mesh(i % 2 ? new THREE.SphereGeometry(0.14, 6, 5) : new THREE.BoxGeometry(0.22, 0.2, 0.22), std([0xc23a2a, 0xe0b040, 0x5a9a40, 0xa06ad0, 0xd87030, 0x4a8ad0][i])); it.position.set(Wm / 2 - 1.0 + i * 0.4, 1.02, Dm / 2 + 0.1); g.add(it); }
    } else if (p.kind === 'tree') {
      const hsh = Math.abs(Math.sin(p.gx * 12.9898 + p.gy * 78.233) * 43758.5453) % 1;
      g.position.set(wx, gy0 - 0.08, wz); g.rotation.y = hsh * 40;
      /* 03/11: árvore do Herik (uma por espécie), desenhada em lote por chunk; o desenho procedural fica de reserva */
      { const aid = p.style === 2 ? null : TREE_ART[p.sp ?? (p.variant === 2 ? 'fir' : p.variant === 1 ? 'pineRed' : 'oak')]; const G0 = aid ? artGeo(aid) : null; const mk = G0 && aid ? artMarker(aid, { wind: 0.035 }) : null;
        if (mk && G0) { /* um pouco menores que a altura do prop e com a copa limitada: a mata não vira parede (regra de 27/10) */ const ks = Math.min(p.height * 0.85 / G0.userData.h, p.height * 0.42 / G0.userData.r); mk.scale.setScalar(Math.max(0.35, ks) * (0.92 + hsh * 0.16)); g.add(mk); return g; } }
      const obj = p.sp ? buildSpecies(p.sp, p.height, hsh) : buildTree(p.height, p.variant === 2 ? 0.9 : p.variant === 1 ? 0.5 : hsh * 0.3).obj;
      if (p.style === 2) obj.traverse((o) => { const mm = o as THREE.Mesh; if (mm.isMesh && o !== obj.children[0]) mm.material = blossomMat(p.roof); }); // árvores de flor (ilhas do Pináculo)
      L.trees.push({ obj, ph: r() * 6 }); obj.userData.sway = true; g.add(obj);
    } else if (p.kind === 'torch') {
      const h = SCALE.torch.height;
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, h - 0.3, 6), std(0x3a2a1c));
      ink(pole, 0.06); pole.position.set(Wm / 2, (h - 0.3) / 2, Dm / 2); pole.castShadow = true; g.add(pole);
      const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.12, 0.3, 8), std(0x2a1c12));
      ink(bowl, 0.06); bowl.position.set(Wm / 2, h - 0.15, Dm / 2); g.add(bowl);
      const fc = p.roof && p.roof !== 0xff8a2a && p.roof !== 0xffb050 ? p.roof : 0xffb040; // lanterna vermelha (Conde) ou azul (Pináculo)
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.46, 7), new THREE.MeshBasicMaterial({ color: fc }));
      flame.position.set(Wm / 2, h + 0.12, Dm / 2); flame.userData.dyn = true; g.add(flame);
      const core = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.26, 6), new THREE.MeshBasicMaterial({ color: 0xfff6c0 })); core.position.y = -0.06; flame.add(core);
      L.torches.push({ pos: new THREE.Vector3(wx, wy + h + 0.25, wz), light: nullLight, base: 75, seed: r() * 50, flame, dist: 0 });
    } else if (p.kind === 'campfire') {
      for (let i = 0; i < 7; i++) { const a = (i / 7) * 6.283; const s = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 0), rockMat(0x6a6864)); s.scale.y = 0.7; s.position.set(Wm / 2 + Math.cos(a) * 0.55, 0.1, Dm / 2 + Math.sin(a) * 0.55); g.add(s); }
      for (let i = 0; i < 4; i++) { const lg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.9, 6), std(0x4a3220)); lg.rotation.set(Math.PI / 2 - 0.5, i * 1.57, 0); lg.position.set(Wm / 2, 0.18, Dm / 2); g.add(lg); }
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.75, 7), new THREE.MeshBasicMaterial({ color: 0xffb040 }));
      flame.position.set(Wm / 2, 0.55, Dm / 2); flame.userData.dyn = true; g.add(flame);
      const core = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.4, 6), new THREE.MeshBasicMaterial({ color: 0xfff6c0 })); core.position.y = -0.1; flame.add(core);
      L.torches.push({ pos: new THREE.Vector3(wx, wy + 0.7, wz), light: nullLight, base: 62, seed: r() * 50, flame, dist: 0 });
    } else if (p.kind === 'rock') {
      const x4 = (i: number, pa: THREE.BufferAttribute | THREE.InterleavedBufferAttribute) => pa.getX(i) + pa.getZ(i) * 0.7;
      // rocha: esfera subdividida deformada por ruído (facetas irregulares, base achatada), com musgo nos topos e pedras menores ao redor
      /* estilo da prancha 58 pelo bioma (01/11): cor, quanto musgo, quão pontuda/lisa/chata; sem `rs` fica a rocha cinza de antes */
      const RS = p.rs, ST = { base: [0x6b6a68, 0x5e5d5b, 0x7a746a, 0x625f66][(p.variant ?? 0) % 4], moss: RS === 'mossball' ? 2.2 : RS === 'mossy' || RS === 'menhir' ? 1 : 0, jag: 0, smooth: 0, bands: 0 };
      if (RS === 'peak') { ST.base = 0x8a8884; ST.jag = 1; } else if (RS === 'obsidian') { ST.base = 0x1c2a58; ST.jag = 1.2; ST.smooth = 0.5; } else if (RS === 'sandstone') { ST.base = 0xd09050; ST.bands = 1; }
      else if (RS === 'copper') { ST.base = 0x4a4642; } else if (RS === 'ice') { ST.base = 0xa8dcf0; ST.smooth = 0.6; } else if (RS === 'darkSmooth') { ST.base = 0x2e3238; ST.smooth = 1; } else if (RS === 'volcanic') { ST.base = 0x262220; ST.jag = 0.5; }
      else if (RS === 'slab') { ST.base = 0xa8a49c; } else if (RS === 'pebbles') { ST.base = 0x8a8a8e; ST.smooth = 1; } else if (RS === 'menhir') { ST.base = 0x7a766e; }
      const mkRock = (seed: number, flat = 0.62) => {
        const geo = new THREE.IcosahedronGeometry(1, 2), pa = geo.attributes.position; const n1 = seed * 7.3, n2 = seed * 3.1;
        for (let i = 0; i < pa.count; i++) {
          const x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i);
          const amp = 0.26 * (1 - ST.smooth * 0.7) + ST.jag * 0.2;
          let k = 0.82 + amp * (Math.sin(x * 3.1 + n1) * Math.cos(z * 2.7 + n2) * 0.5 + Math.sin(y * 4.3 + x * 1.7 + n2) * 0.3 + Math.sin((x + z) * 5.7 + n1) * 0.2);
          if (ST.jag) k *= 1 - ST.jag * 0.35 * Math.max(0, y) * (1 - Math.abs(Math.sin(x * 4 + z * 3 + n1))); // pico: afina para cima em cristas
          if (ST.bands) k *= 1 + 0.08 * Math.sin(y * 9 + n2); // arenito: camadas
          pa.setXYZ(i, x * k, (y * k) * (y < 0 ? 0.35 : flat) + (y < 0 ? -0.1 : 0), z * k);
        }
        geo.computeVertexNormals();
        // cor por vértice: base com variação + musgo verde nos topos voltados para cima (conforme o estilo)
        const cols = new Float32Array(pa.count * 3), base = new THREE.Color(ST.base), moss = new THREE.Color(RS === 'mossball' ? 0x5a8a2a : 0x4a6a34), nrm = geo.attributes.normal;
        for (let i = 0; i < pa.count; i++) { const up = Math.max(0, nrm.getY(i)), y = pa.getY(i); const v = 0.86 + 0.28 * Math.sin(i * 12.9 + seed); const c = base.clone().multiplyScalar(v);
          if (ST.bands) c.lerp(new THREE.Color(0xa86838), Math.sin(y * 9 + n2) > 0.3 ? 0.5 : 0); if (RS === 'copper' && Math.abs(Math.sin(x4(i, pa) * 6 + y * 5 + n1)) > 0.93) c.set(0xd0702a); if (RS === 'volcanic' && Math.abs(Math.sin(x4(i, pa) * 7 + y * 4 + n2)) > 0.95) c.set(0xff6a20);
          const mossK = RS ? ST.moss : (p.wall !== 0x5a5048 ? 1 : 0); if (up > (mossK > 1 ? 0.2 : 0.72) && mossK) c.lerp(moss, Math.min(1, (up - (mossK > 1 ? 0.2 : 0.72)) * 1.6 * mossK * (0.5 + 0.5 * Math.sin(i * 3.3 + seed)))); cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b; }
        geo.setAttribute('color', new THREE.BufferAttribute(cols, 3)); L.own.push(geo); return geo;
      };
      const rm = cutoutify(new THREE.MeshToonMaterial({ color: 0xffffff, vertexColors: true, gradientMap: ramp }));
      const sx = Wm * 0.52 * (0.85 + r() * 0.3) * (RS === 'menhir' ? 0.45 : RS === 'pebbles' ? 0.6 : 1), sy = p.height * 0.55, sz = Dm * 0.52 * (0.85 + r() * 0.3) * (RS === 'menhir' ? 0.6 : RS === 'pebbles' ? 0.6 : 1);
      /* 03/11: pedra do Herik (uma por estilo da prancha 58); sem estilo, a cinza com musgo (01) ou a lascada (09) */
      const rid = ROCK_ART[RS ?? ((p.variant ?? 0) % 2 ? 'copper' : 'mossy')], RG = rid ? artGeo(rid) : null, rmk = RG && rid ? artMarker(rid) : null;
      if (rmk && RG) { const bb = RG.boundingBox!, dxz = Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z), kxz = (Math.max(sx, sz) * 2.05) / dxz, ky = THREE.MathUtils.clamp((RS === 'menhir' || RS === 'peak' ? p.height : p.height * 0.62) / RG.userData.h, kxz * 0.6, kxz * 1.7);
        rmk.scale.set(kxz, ky, kxz); rmk.position.set(Wm / 2, -0.05, Dm / 2); rmk.rotation.y = r() * 6.283; g.add(rmk); }
      else { const m = new THREE.Mesh(mkRock(p.gx * 13 + p.gy, RS === 'slab' ? 0.3 : RS === 'peak' || RS === 'menhir' ? 1.2 : 0.62), rm); m.scale.set(sx, sy, sz); m.position.set(Wm / 2, sy * 0.45, Dm / 2); m.rotation.y = r() * 6; m.castShadow = m.receiveShadow = true; g.add(m); }
      if (RS === 'ice' && !rmk) for (let k = 0; k < 5; k++) { const a = r() * 6.283; const ic = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.25 + r() * 0.3, 5), std(0xd8f0ff)); ic.rotation.x = Math.PI; ic.position.set(Wm / 2 + Math.cos(a) * sx * 0.8, sy * 0.4, Dm / 2 + Math.sin(a) * sz * 0.8); g.add(ic); } // pingentes de gelo
      if (RS === 'mossball' && !rmk) for (let k = 0; k < 3; k++) { const a = r() * 6.283; const f = buildPlant('fern', p.gx + k); f.scale.setScalar(0.7); f.position.set(Wm / 2 + Math.cos(a) * sx * 1.05, 0, Dm / 2 + Math.sin(a) * sz * 1.05); g.add(f); } // samambaias ao pé
      const nSmall = rmk ? 0 : RS === 'pebbles' ? 6 : p.w === 1 ? 2 : 4; /* o modelo do Herik já traz as pedrinhas em volta */
      for (let k = 0; k < nSmall; k++) { const a = r() * 6.283, d = Math.max(sx, sz) * (0.95 + r() * 0.5); const m2 = new THREE.Mesh(mkRock(p.gx * 31 + p.gy * 7 + k, 0.7), rm); const s2 = 0.18 + r() * 0.3; m2.scale.set(s2 * 1.3, s2 * 0.8, s2); m2.position.set(Wm / 2 + Math.cos(a) * d, s2 * 0.3, Dm / 2 + Math.sin(a) * d); m2.rotation.y = r() * 6; m2.castShadow = true; g.add(m2); }
      { const vein = veinOf(p); if (vein) { const nN = p.w > 1 ? 9 : 5; // veio de minério: pepitas cravadas na rocha (ferrugem = ferro, brilho = prata)
        for (let k = 0; k < nN; k++) { const a = r() * 6.283, hh = 0.25 + r() * 0.5; const nug = new THREE.Mesh(new THREE.OctahedronGeometry(0.09 + r() * 0.08, 0), vein === 2 ? glowSilver : std(0xa0582e)); nug.position.set(Wm / 2 + Math.cos(a) * sx * 0.86 * (1 - hh * 0.4), sy * 0.45 + sy * hh * 0.5, Dm / 2 + Math.sin(a) * sz * 0.86 * (1 - hh * 0.4)); nug.rotation.set(r() * 3, r() * 3, 0); g.add(nug); } } }
    } else if (p.kind === 'herb') { // ervas: pequenas, mas cada uma com silhueta e cor próprias para o olho achar no mato
      const cx = Wm / 2 + (r() - 0.5) * 0.8, cz = Dm / 2 + (r() - 0.5) * 0.8, v = p.variant ?? 0;
      if (v === 0) { for (let k = 0; k < 7; k++) { const lf = new THREE.ConeGeometry(0.07, 0.55, 4); lf.scale(1, 1, 0.3); const m = new THREE.Mesh(lf, std(k % 2 ? 0x9ad0a8 : 0xc8e8d0)); const a = (k / 7) * 6.283; m.position.set(cx + Math.cos(a) * 0.1, 0.24, cz + Math.sin(a) * 0.1); m.rotation.set(Math.sin(a) * 0.5, -a, -Math.cos(a) * 0.5); g.add(m); }
        for (let k = 0; k < 3; k++) { const f = new THREE.Mesh(new THREE.IcosahedronGeometry(0.055, 0), std(0xffffff)); f.position.set(cx + (r() - 0.5) * 0.25, 0.5 + r() * 0.08, cz + (r() - 0.5) * 0.25); g.add(f); } }
      else if (v === 1) { for (let k = 0; k < 3; k++) { const a = r() * 6.283, d = k ? 0.18 : 0, s2 = k ? 0.7 : 1; const st2 = new THREE.Mesh(new THREE.CylinderGeometry(0.035 * s2, 0.045 * s2, 0.26 * s2, 6), std(0xe8dcc0)); st2.position.set(cx + Math.cos(a) * d, 0.13 * s2, cz + Math.sin(a) * d); g.add(st2);
          const cap = new THREE.Mesh(new THREE.SphereGeometry(0.13 * s2, 8, 5, 0, 6.283, 0, Math.PI / 2), glowShroom); cap.position.set(cx + Math.cos(a) * d, 0.25 * s2, cz + Math.sin(a) * d); g.add(cap); } }
      else if (v === 2) { for (let k = 0; k < 5; k++) { const a = (k / 5) * 6.283 + r(), h = 0.3 + r() * 0.2; const stl = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.02, h, 4), std(0x5a1a24)); stl.position.set(cx + Math.cos(a) * 0.08, h / 2, cz + Math.sin(a) * 0.08); stl.rotation.set(Math.sin(a) * 0.25, 0, -Math.cos(a) * 0.25); g.add(stl);
          const bulb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.065, 0), std(0xc0283a)); bulb.position.set(cx + Math.cos(a) * 0.14, h, cz + Math.sin(a) * 0.14); g.add(bulb); }
        for (let k = 0; k < 4; k++) { const lf = new THREE.ConeGeometry(0.06, 0.3, 4); lf.scale(1, 1, 0.3); const m = new THREE.Mesh(lf, std(0x2f4a24)); const a = (k / 4) * 6.283; m.position.set(cx + Math.cos(a) * 0.12, 0.1, cz + Math.sin(a) * 0.12); m.rotation.set(Math.sin(a) * 0.9, -a, -Math.cos(a) * 0.9); g.add(m); } }
      else if (v === 4) { // Junco-do-Rio: hastes altas na beira da água, com a espiga marrom
        const stemM = std(0x8aa04a), leafM = std(0x6a8a3a), headM = std(0x5a3a1c);
        for (let k = 0; k < 9; k++) { const a = r() * 6.283, d2 = r() * 0.32, h = 0.9 + r() * 0.55; const st = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.018, h, 4), stemM); st.position.set(cx + Math.cos(a) * d2, h / 2, cz + Math.sin(a) * d2); st.rotation.set((r() - 0.5) * 0.25, 0, (r() - 0.5) * 0.25); g.add(st);
          if (k % 2 === 0) { const hd = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.2, 6), headM); hd.position.set(st.position.x, h - 0.12, st.position.z); hd.rotation.copy(st.rotation); g.add(hd); } }
        for (let k = 0; k < 6; k++) { const lf = new THREE.ConeGeometry(0.04, 0.8, 3); lf.scale(1, 1, 0.25); const m = new THREE.Mesh(lf, leafM); const a = r() * 6.283; m.position.set(cx + Math.cos(a) * 0.15, 0.36, cz + Math.sin(a) * 0.15); m.rotation.set(Math.sin(a) * 0.5, -a, -Math.cos(a) * 0.5); g.add(m); } }
      else if (v === 5) { // Flor-de-Campo: moita de flores de uma cor só (amarela, branca, lilás ou vermelha)
        const pc = [0xf2c040, 0xf4f0e0, 0xb88ae8, 0xe0504a][(p.ry ?? Math.floor(r() * 4)) % 4], petal = std(new THREE.Color(pc).multiplyScalar(0.88 + r() * 0.2).getHex()), core = std(0xf8d040), stemM = std(0x4a8a3a);
        const nF = 4 + Math.floor(r() * 6); for (let k = 0; k < nF; k++) { const a = r() * 6.283, d2 = r() * 0.42, h = 0.26 + r() * 0.3; const st = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.014, h, 4), stemM); st.position.set(cx + Math.cos(a) * d2, h / 2, cz + Math.sin(a) * d2); g.add(st);
          for (let q = 0; q < 5; q++) { const pa2 = q / 5 * 6.283; const pt = new THREE.Mesh(new THREE.SphereGeometry(0.045, 5, 3), petal); pt.scale.set(1, 0.35, 0.6); pt.position.set(st.position.x + Math.cos(pa2) * 0.045, h + 0.01, st.position.z + Math.sin(pa2) * 0.045); pt.rotation.y = -pa2; g.add(pt); }
          const cc = new THREE.Mesh(new THREE.IcosahedronGeometry(0.025, 0), core); cc.position.set(st.position.x, h + 0.025, st.position.z); g.add(cc); }
        for (let k = 0; k < 6; k++) { const lf = new THREE.ConeGeometry(0.05, 0.28, 4); lf.scale(1, 1, 0.3); const m = new THREE.Mesh(lf, stemM); const a = (k / 6) * 6.283; m.position.set(cx + Math.cos(a) * 0.12, 0.1, cz + Math.sin(a) * 0.12); m.rotation.set(Math.sin(a) * 0.9, -a, -Math.cos(a) * 0.9); g.add(m); } }
      else { const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.024, 0.5, 5), std(0x3a6a4a)); stem.position.set(cx, 0.25, cz); g.add(stem);
        for (let k = 0; k < 6; k++) { const a = (k / 6) * 6.283; const pt = new THREE.SphereGeometry(0.11, 6, 4); pt.scale(1, 0.35, 0.55); const m = new THREE.Mesh(pt, glowMarghar); m.position.set(cx + Math.cos(a) * 0.11, 0.52, cz + Math.sin(a) * 0.11); m.rotation.y = -a; g.add(m); }
        const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.06, 0), std(0xfff0a0)); core.position.set(cx, 0.55, cz); g.add(core);
        for (let k = 0; k < 3; k++) { const lf = new THREE.ConeGeometry(0.06, 0.32, 4); lf.scale(1, 1, 0.3); const m = new THREE.Mesh(lf, std(0x4a8a5a)); const a = (k / 3) * 6.283; m.position.set(cx + Math.cos(a) * 0.08, 0.14, cz + Math.sin(a) * 0.08); m.rotation.set(Math.sin(a) * 0.8, -a, -Math.cos(a) * 0.8); g.add(m); } }
      g.scale.set(1.4, 1.4, 1.4); // maiores que antes: o olho acha no mato sem esforço
    } else if (p.kind === 'bfloor' || p.kind === 'bwall' || p.kind === 'bfence' || p.kind === 'broof' || p.kind === 'bdoor') {
      // peças de construção do jogador (1 tile cada): piso de tábuas, parede de toras, cerca, telhado e porta
      const plankM = std(0xffffff, { map: plankTex(0x8a6a40) }), logM = std(0xffffff, { map: plankTex(0x6a4a2c) }), dark = std(0x3a2616);
      const v = p.variant ?? 0; // 0..3 = rotação (paredes/cercas/portas acompanham a borda)
      if (p.kind === 'bfloor') { const f = new THREE.Mesh(new THREE.BoxGeometry(Wm, 0.14, Dm), plankM); f.position.set(Wm / 2, 0.07, Dm / 2); f.receiveShadow = true; g.add(f); for (const [x, z] of [[0.2, 0.2], [Wm - 0.2, 0.2], [0.2, Dm - 0.2], [Wm - 0.2, Dm - 0.2]]) { const pg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.22, 6), dark); pg.position.set(x, 0.02, z); g.add(pg); } }
      else if (p.kind === 'bwall' || p.kind === 'bdoor') {
        const wallG = new THREE.Group(); wallG.position.set(Wm / 2, 0, Dm / 2); wallG.rotation.y = v * Math.PI / 2; g.add(wallG);
        if (p.kind === 'bwall') { for (let k = 0; k < 7; k++) { const log = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, Wm, 8), logM); log.rotation.z = Math.PI / 2; log.position.set(0, 0.16 + k * 0.3, -Dm / 2 + 0.16); log.castShadow = true; wallG.add(log); } }
        else { for (const sx of [-1, 1]) { const post = new THREE.Mesh(new THREE.BoxGeometry(0.22, 2.2, 0.3), dark); post.position.set(sx * (Wm / 2 - 0.11), 1.1, -Dm / 2 + 0.16); wallG.add(post); } const lintel = new THREE.Mesh(new THREE.BoxGeometry(Wm, 0.24, 0.3), dark); lintel.position.set(0, 2.08, -Dm / 2 + 0.16); wallG.add(lintel); const door = new THREE.Mesh(new THREE.BoxGeometry(Wm - 0.5, 1.9, 0.08), plankM); door.position.set(-0.2, 0.95, -Dm / 2 + 0.16); door.rotation.y = 0.9; wallG.add(door); }
      }
      else if (p.kind === 'bfence') { const fg = new THREE.Group(); fg.position.set(Wm / 2, 0, Dm / 2); fg.rotation.y = v * Math.PI / 2; g.add(fg); for (const sx of [-1, 1]) { const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.0, 0.14), dark); post.position.set(sx * (Wm / 2 - 0.1), 0.5, -Dm / 2 + 0.1); post.castShadow = true; fg.add(post); } for (const y of [0.4, 0.8]) { const rail = new THREE.Mesh(new THREE.BoxGeometry(Wm, 0.08, 0.06), logM); rail.position.set(0, y, -Dm / 2 + 0.1); fg.add(rail); } }
      else { const roof = gableRoof(Wm + 0.3, Dm + 0.3, 0.9, 0.15, 0x6d3a28, 0x4a3220, v % 2 === 0); roof.position.set(Wm / 2, 2.1, Dm / 2); g.add(roof); }
    } else if (p.kind === 'plant' && p.plant) { /* planta de cenário (pranchas 56/57): parada, mesclada no estático; nenúfar fica na linha da água */
      const seed = p.gx * 7 + p.gy * 13 + (p.variant ?? 0), PA = PLANT_ART[p.plant], aid = PA ? PA[seed % PA.length] : null, mk = aid ? artMarker(aid, { wind: p.plant === 'lilypad' || p.plant === 'mossRock' || p.plant === 'cactus' ? 0 : 0.12, shadow: false }) : null;
      const pl = mk ?? buildPlant(p.plant, seed); pl.position.set(Wm / 2, p.plant === 'lilypad' ? WL - gy0 + 0.03 : 0, Dm / 2); pl.rotation.y = r() * 6.283; const sc = (0.85 + r() * 0.3) * (mk ? 1.25 : 1); pl.scale.set(sc, sc, sc); g.add(pl);
    } else if (p.kind === 'vprop') { /* props de vila da prancha 59 (01/11): 0 barril · 1 caixotes · 2 poço com telhado · 3 banco de toras · 4 poste com lanterna · 5 placa de direções · 6 feno com forcado · 7 carroça de mão · 8 cocho · 9 bigorna no toco */
      const v = p.variant ?? 0, wd = std(0xffffff, { map: plankTex(0x8a6a40) }), wdD = std(0xffffff, { map: plankTex(0x5a3a20) }), iron = std(0x3a3f46), stoneT = std(0xffffff, { map: stoneTex(0x8a857e) }), hay = std(0xd8b048), water = std(0x4a7a9a);
      const G = new THREE.Group(); G.position.set(Wm / 2, 0, Dm / 2); G.rotation.y = (p.ry ?? 0) + (r() - 0.5) * 0.3; g.add(G); const A = (geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; G.add(o); return o; };
      const vmk = VPROP_ART[v] ? artMarker(VPROP_ART[v]) : null; /* 03/11: modelo do Herik quando existe; o desenho fica de reserva */
      if (vmk) { G.add(vmk); if (v === 4) L.glows.push({ light: nullLight, base: 10, seed: r() * 50, warm: true, pos: new THREE.Vector3(wx, wy + 2.9, wz), color: 0xffbb66 } as WorldObjs['glowLights'][number]); }
      else if (v === 0) { A(new THREE.CylinderGeometry(0.3, 0.3, 0.8, 10), wd, 0, 0.4, 0); A(new THREE.CylinderGeometry(0.34, 0.34, 0.9, 10, 1, true), wd, 0, 0.45, 0).scale.set(1, 1, 1); for (const y of [0.12, 0.42, 0.72]) A(new THREE.TorusGeometry(0.33, 0.02, 4, 12), iron, 0, y, 0).rotation.x = Math.PI / 2; if (r() < 0.5) { A(new THREE.CylinderGeometry(0.22, 0.22, 0.6, 9), wd, 0.55, 0.3, 0.2); for (const y of [0.1, 0.5]) A(new THREE.TorusGeometry(0.24, 0.016, 4, 12), iron, 0.55, y, 0.2).rotation.x = Math.PI / 2; } }
      else if (v === 1) { const bx = (x: number, y: number, z: number, s2: number, ry: number) => { const b = A(new THREE.BoxGeometry(s2, s2, s2), wd, x, y, z); b.rotation.y = ry; ink(b, 0.02); for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const c = A(new THREE.BoxGeometry(0.06, s2 * 0.96, 0.06), std(0x7a2a2a), x + sx * s2 * 0.47, y, z + sz * s2 * 0.47); c.rotation.y = ry; } };
        bx(0, 0.3, 0, 0.6, 0); bx(0.1, 0.8, -0.05, 0.42, 0.3); bx(0.62, 0.22, 0.25, 0.44, -0.4); }
      else if (v === 2) { const ring = new THREE.Shape(); ring.absarc(0, 0, 0.62, 0, Math.PI * 2, false); const hole = new THREE.Path(); hole.absarc(0, 0, 0.44, 0, Math.PI * 2, true); ring.holes.push(hole); const wallG = new THREE.ExtrudeGeometry(ring, { depth: 0.9, bevelEnabled: false, curveSegments: 12 }); wallG.rotateX(-Math.PI / 2); A(wallG, stoneT, 0, 0, 0); /* parede em anel: o poço tem buraco (Erling, 01/11) */
        A(new THREE.CylinderGeometry(0.44, 0.44, 0.04, 12), water, 0, 0.3, 0); A(new THREE.CylinderGeometry(0.44, 0.44, 0.3, 12, 1, true), std(0x2a2a2e, { side: THREE.BackSide }), 0, 0.6, 0); for (const sx of [-1, 1]) A(new THREE.BoxGeometry(0.1, 1.5, 0.1), wdD, sx * 0.55, 1.4, 0); A(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 6), wdD, 0, 1.7, 0).rotation.z = Math.PI / 2;
        const roof = gableRoof(1.9, 1.3, 0.55, 0.1, 0x6d3a28, 0x4a3220, true); roof.position.set(0, 2.2, 0); G.add(roof); A(new THREE.CylinderGeometry(0.1, 0.09, 0.14, 8), iron, 0, 1.2, 0); A(new THREE.CylinderGeometry(0.01, 0.01, 0.5, 4), iron, 0, 1.45, 0); }
      else if (v === 3) { const lg = A(new THREE.CylinderGeometry(0.12, 0.12, 1.9, 8), wdD, 0, 0.45, 0); lg.rotation.z = Math.PI / 2; lg.position.y = 0.42; const top = A(new THREE.BoxGeometry(1.9, 0.08, 0.36), wd, 0, 0.5, 0); ink(top, 0.02); for (const sx of [-1, 1]) A(new THREE.CylinderGeometry(0.16, 0.16, 0.4, 8), wdD, sx * 0.7, 0.16, 0).rotation.x = Math.PI / 2; }
      else if (v === 4) { A(new THREE.BoxGeometry(0.16, 3.2, 0.16), wdD, 0, 1.6, 0); A(new THREE.BoxGeometry(0.1, 0.1, 0.8), wdD, 0, 3.0, 0.35); const br = A(new THREE.BoxGeometry(0.06, 0.6, 0.06), wdD, 0, 2.7, 0.35); br.rotation.x = 0.8;
        A(new THREE.BoxGeometry(0.24, 0.3, 0.24), iron, 0, 2.55, 0.7); A(new THREE.BoxGeometry(0.18, 0.22, 0.18), new THREE.MeshBasicMaterial({ color: 0xffd080 }), 0, 2.55, 0.7); A(new THREE.ConeGeometry(0.18, 0.12, 4), iron, 0, 2.76, 0.7);
        L.glows.push({ light: nullLight, base: 10, seed: r() * 50, warm: true, pos: new THREE.Vector3(wx + Wm / 2, wy + 2.55, wz + Dm / 2 + 0.7), color: 0xffbb66 } as WorldObjs['glowLights'][number]); }
      else if (v === 5) { A(new THREE.CylinderGeometry(0.07, 0.08, 2.4, 7), wdD, 0, 1.2, 0); A(new THREE.SphereGeometry(0.08, 6, 5), iron, 0, 2.42, 0); for (const [y, ry, sx] of [[2.0, 0.3, 1], [1.6, -1.2, -1]] as [number, number, number][]) { const b = A(new THREE.BoxGeometry(0.9, 0.2, 0.05), wd, sx * 0.3, y, 0); b.rotation.y = ry; ink(b, 0.015); const tip = A(new THREE.ConeGeometry(0.1, 0.16, 4), wd, sx * 0.3 + Math.cos(ry) * sx * 0.5, y, -Math.sin(ry) * sx * 0.5); tip.rotation.set(0, ry + Math.PI / 4, sx * -Math.PI / 2); } }
      else if (v === 6) { const h1 = A(new THREE.CylinderGeometry(0.55, 0.55, 0.9, 12), hay, 0, 0.55, 0); h1.rotation.z = Math.PI / 2; for (const x of [-0.25, 0.25]) A(new THREE.TorusGeometry(0.56, 0.015, 4, 14), std(0x8a6a30), x, 0.55, 0).rotation.y = Math.PI / 2;
        const fk = A(new THREE.CylinderGeometry(0.02, 0.02, 1.4, 5), wdD, 0.7, 0.75, 0.3); fk.rotation.z = 0.5; for (let k = 0; k < 4; k++) A(new THREE.CylinderGeometry(0.01, 0.005, 0.3, 4), iron, 0.98 + k * 0.03 - 0.05, 1.35, 0.3 - 0.06 + k * 0.04).rotation.z = 0.5; }
      else if (v === 7) { const bed = A(new THREE.BoxGeometry(1.4, 0.1, 0.8), wd, 0, 0.5, 0); ink(bed, 0.02); for (const sz of [-1, 1]) A(new THREE.BoxGeometry(1.4, 0.3, 0.06), wd, 0, 0.68, sz * 0.38); A(new THREE.BoxGeometry(0.06, 0.3, 0.8), wd, -0.68, 0.68, 0);
        for (const sz of [-1, 1]) { const wh = A(new THREE.TorusGeometry(0.3, 0.05, 6, 12), wdD, 0.2, 0.33, sz * 0.46); wh.rotation.y = 0; for (let k = 0; k < 4; k++) A(new THREE.BoxGeometry(0.04, 0.56, 0.04), wdD, 0.2, 0.33, sz * 0.46).rotation.z = k * Math.PI / 4; } A(new THREE.CylinderGeometry(0.04, 0.04, 1.0, 6), wdD, 0.2, 0.33, 0).rotation.x = Math.PI / 2;
        for (const sz of [-1, 1]) { const hd = A(new THREE.BoxGeometry(1.0, 0.06, 0.06), wdD, 1.1, 0.42, sz * 0.3); hd.rotation.z = 0.25; } for (const sx of [-1, 1]) A(new THREE.BoxGeometry(0.06, 0.4, 0.06), wdD, -0.5 + sx * 0.0, 0.2, sx * 0.3); }
      else if (v === 8) { const lg = A(new THREE.CylinderGeometry(0.3, 0.3, 1.8, 10), wdD, 0, 0.42, 0); lg.rotation.z = Math.PI / 2; A(new THREE.BoxGeometry(1.5, 0.04, 0.4), water, 0, 0.62, 0); for (const sx of [-1, 1]) A(new THREE.BoxGeometry(0.3, 0.2, 0.5), wdD, sx * 0.6, 0.1, 0); }
      else { A(new THREE.CylinderGeometry(0.3, 0.36, 0.6, 9), wdD, 0, 0.3, 0); A(new THREE.BoxGeometry(0.5, 0.14, 0.22), iron, 0, 0.72, 0); A(new THREE.BoxGeometry(0.2, 0.14, 0.2), iron, 0, 0.6, 0); A(new THREE.ConeGeometry(0.1, 0.3, 6), iron, 0.38, 0.72, 0).rotation.z = -Math.PI / 2; A(new THREE.BoxGeometry(0.12, 0.05, 0.22), iron, -0.3, 0.74, 0); }
    } else if (p.kind === 'rack') { /* estante de armas do quartel (01/11): dois mourões com travessa, lanças e espadas de treino encostadas, um escudo redondo pendurado */
      const wd = std(0xffffff, { map: plankTex(0x5a3a20) }), iron = std(0x3a3f46), steel = std(0x9aa0a8), leather = std(0x6a3a22), v = p.variant ?? 0;
      const rg = new THREE.Group(); rg.position.set(Wm / 2, 0, 0.45); g.add(rg);
      for (const sx of [-0.7, 0.7]) { const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.5, 0.12), wd); post.position.set(sx, 0.75, 0); post.castShadow = true; rg.add(post); }
      for (const y of [0.35, 1.35]) { const rail = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.09, 0.12), wd); rail.position.set(0, y, 0); rg.add(rail); }
      if (v === 0) { for (let k = 0; k < 4; k++) { const x = -0.5 + k * 0.33; const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 2.0, 5), wd); sh.position.set(x, 1.0, 0.16); sh.rotation.x = -0.12; rg.add(sh);
          const tip = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.28, 4), steel); tip.position.set(x, 2.1, 0.03); tip.rotation.x = -0.12; rg.add(tip); } }
      else { for (let k = 0; k < 3; k++) { const x = -0.45 + k * 0.45; const bl = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.95, 0.02), steel); bl.position.set(x, 0.95, 0.16); bl.rotation.x = -0.12; rg.add(bl);
          const gd = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 0.05), iron); gd.position.set(x, 1.43, 0.1); rg.add(gd); const gr = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.22, 6), leather); gr.position.set(x, 1.57, 0.09); gr.rotation.x = -0.12; rg.add(gr); }
        const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.05, 14), leather); sh.rotation.x = Math.PI / 2 - 0.12; sh.position.set(0.55, 1.0, 0.2); rg.add(sh); const boss = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), iron); boss.position.set(0.55, 1.0, 0.24); rg.add(boss); }
    } else if (p.kind === 'ifence') { // grade de ferro retorcida do cemitério: barras finas com pontas de lança, algumas tortas
      const im = std(0x2a2a30), ns = p.variant === 1;
      for (let k = 0; k < 3; k++) { const off = -0.6 + k * 0.6, bent = r() < 0.3; const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 2.0, 5), im); bar.position.set(ns ? Wm / 2 : Wm / 2 + off, 1.0, ns ? Dm / 2 + off : Dm / 2); if (bent) bar.rotation.z = (r() - 0.5) * 0.5; g.add(bar); const tip = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.3, 4), im); tip.position.set(bar.position.x + (bent ? Math.sin(bar.rotation.z) * -1 : 0), 2.1, bar.position.z); g.add(tip); }
      for (const y of [0.4, 1.7]) { const rail = new THREE.Mesh(new THREE.BoxGeometry(ns ? 0.06 : T, 0.06, ns ? T : 0.06), im); rail.position.set(Wm / 2, y, Dm / 2); g.add(rail); }
    } else if (p.kind === 'coffin') { // caixão de madeira, alguns abertos com a tampa de lado
      const wm2 = std(0xffffff, { map: plankTex(0x3a2a1c) }), open = p.variant === 2;
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 1.9), wm2); ink(box, 0.04); box.position.set(Wm / 2, 0.25, Dm / 2); box.rotation.y = (p.variant ?? 0) * 0.5; g.add(box);
      const lid = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.1, 1.95), wm2); if (open) { lid.position.set(Wm / 2 + 0.7, 0.05, Dm / 2 + 0.3); lid.rotation.set(0, (p.variant ?? 0) * 0.5 + 0.3, 0.2); const sk = new THREE.Mesh(new THREE.SphereGeometry(0.16, 7, 6), std(0xd8d0b8)); sk.position.set(Wm / 2, 0.55, Dm / 2 - 0.5); g.add(sk); } else { lid.position.set(Wm / 2, 0.55, Dm / 2); lid.rotation.y = (p.variant ?? 0) * 0.5; } g.add(lid);
    } else if (p.kind === 'cwall') { // muralha de pedra de cidade média: segmento com ameias, orientado por variant (0 = leste-oeste, 1 = norte-sul)
      const sm = std(0xffffff, { map: stoneTex(0x7a7672) }), H = p.height, ns = p.variant === 1;
      const body = new THREE.Mesh(new THREE.BoxGeometry(ns ? 1.3 : T, H, ns ? T : 1.3), sm); ink(body, 0.05); body.position.set(Wm / 2, H / 2, Dm / 2); body.castShadow = body.receiveShadow = true; g.add(body);
      for (let k = 0; k < 2; k++) { const m = new THREE.Mesh(new THREE.BoxGeometry(ns ? 1.3 : 0.7, 0.55, ns ? 0.7 : 1.3), sm); m.position.set(ns ? Wm / 2 : 0.5 + k * 1.0, H + 0.27, ns ? 0.5 + k * 1.0 : Dm / 2); g.add(m); }
      const walk = new THREE.Mesh(new THREE.BoxGeometry(ns ? 0.9 : T, 0.12, ns ? T : 0.9), std(0x5a5652)); walk.position.set(Wm / 2, H + 0.06, Dm / 2); g.add(walk);
    } else if (p.kind === 'tower') { // torre de vigia: cilindro de pedra, ameias, telhado cônico e tocha no alto
      const sm = std(0xffffff, { map: stoneTex(0x6e6a66) }), H = p.height;
      const body = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.45, H, 10), sm); ink(body, 0.05); body.position.set(Wm / 2, H / 2, Dm / 2); body.castShadow = body.receiveShadow = true; g.add(body);
      const top = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.35, 0.9, 10), sm); top.position.set(Wm / 2, H + 0.3, Dm / 2); g.add(top);
      for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; const m = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.3), sm); m.position.set(Wm / 2 + Math.cos(a) * 1.4, H + 1.0, Dm / 2 + Math.sin(a) * 1.4); m.rotation.y = -a; g.add(m); }
      const roof = new THREE.Mesh(new THREE.ConeGeometry(1.1, 2.0, 10), std(p.roof)); roof.position.set(Wm / 2, H + 1.75, Dm / 2); g.add(roof);
      for (let k = 0; k < 3; k++) { const w = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.6, 0.1), std(0x1a1410)); const a = k * 2.1; w.position.set(Wm / 2 + Math.cos(a) * 1.3, H * (0.4 + k * 0.2), Dm / 2 + Math.sin(a) * 1.3); w.rotation.y = -a + Math.PI / 2; g.add(w); }
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.46, 7), new THREE.MeshBasicMaterial({ color: 0xffb040 })); flame.position.set(Wm / 2 + 1.0, H + 1.2, Dm / 2 + 0.8); flame.userData.dyn = true; g.add(flame);
      L.torches.push({ pos: new THREE.Vector3(wx + 1.0, wy + H + 1.3, wz + 0.8), light: nullLight, base: 70, seed: r() * 50, flame, dist: 0 });
    } else if (p.kind === 'relic' && p.label && PORTAL_OF[p.label]) { /* portal da vila (prancha 33, 01/11): o anel/arco do povo no lugar do monólito */
      const ps = PORTAL_OF[p.label], { g: pg, veil, height } = buildPortal(ps, p.gx * 7 + p.gy * 13); pg.position.set(Wm / 2, 0, Dm / 2); g.add(pg); const G = PORTAL_GLOW[ps];
      const ring = new THREE.Mesh(new THREE.RingGeometry(1.3, 1.9, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: G, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false })); ring.userData.dyn = true; ring.userData.col = G; ring.position.set(Wm / 2, 0.08, Dm / 2); g.add(ring);
      (L.relics ??= []).push({ gx: p.gx, gy: p.gy, runes: veil, ring, pos: new THREE.Vector3(p.gx * T + Wm / 2, wy + 1.6, p.gy * T + Dm / 2), seed: r() * 50 });
      L.glows.push({ light: nullLight, base: 30, seed: r() * 50, warm: false, pos: new THREE.Vector3(p.gx * T + Wm / 2, wy + height * 0.45, p.gy * T + Dm / 2), color: G } as WorldObjs['glowLights'][number]);
    } else if (p.kind === 'relic') {
      /* pedra rúnica (prancha 47, 01/11, Erling: "pedra rúnica para substituir as atuais"): menir azul facetado com os seis símbolos em vermelho na face
         da frente (gota, labirinto, KK com o olho, círculo, ampulheta, cruz-seta), base de pedra parda com musgo e lascas azuis em volta;
         símbolos apagados até o caminhante tocar, acesos depois */
      /* cor por vértice: azul-violeta no corpo, azul claro nas quinas e faces viradas para a luz, roxo escuro nas reentrâncias, pardo na base (sem textura de alvenaria: as linhas eram juntas de tijolo) */
      const geo = new THREE.IcosahedronGeometry(1, 4), pa = geo.attributes.position; for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i); const k = 0.86 + 0.2 * (Math.sin(x * 4.1 + y * 2.3) * Math.cos(z * 3.7 + 1.2) * 0.6 + Math.sin((x + z) * 6.1 + y) * 0.4) + 0.03 * Math.sin(x * 17 + z * 13) * Math.cos(y * 15); pa.setXYZ(i, x * k * (0.6 + 0.2 * (1 - y)), y * k * 1.6 + 0.15 * Math.max(0, y), z * k * (0.5 + 0.2 * (1 - y))); }
      geo.computeVertexNormals(); { const nrm = geo.attributes.normal, cols = new Float32Array(pa.count * 3), cBody = new THREE.Color(0x4a52a8), cLight = new THREE.Color(0x9aa8e8), cDark = new THREE.Color(0x2a2460), cBase = new THREE.Color(0x6a5a44);
        for (let i = 0; i < pa.count; i++) { const y = pa.getY(i), lit = Math.max(0, nrm.getX(i) * 0.5 + nrm.getY(i) * 0.6 + nrm.getZ(i) * 0.6); const c = cBody.clone().lerp(cLight, Math.pow(lit, 2.2) * 0.9).lerp(cDark, Math.max(0, 0.45 - lit) * 1.1); const n = Math.sin(pa.getX(i) * 9 + y * 7) * 0.08; c.offsetHSL(0, 0, n); if (y < -0.9) c.lerp(cBase, Math.min(1, (-0.9 - y) * 2.2)); cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b; }
        geo.setAttribute('color', new THREE.BufferAttribute(cols, 3)); } L.own.push(geo);
      /* rampa de 16 degraus só nesta pedra (Erling: "parece pedra de 256 cores"): sombreado contínuo, sem o chapado de 4 tons */
      const ramp16 = (() => { const d = new Uint8Array(16 * 4); for (let i = 0; i < 16; i++) { const v = Math.round(40 + (215 * i) / 15); d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v; d[i * 4 + 3] = 255; } const t = new THREE.DataTexture(d, 16, 1, THREE.RGBAFormat); t.minFilter = t.magFilter = THREE.LinearFilter; t.needsUpdate = true; return t; })();
      const stoneM = cutoutify(new THREE.MeshToonMaterial({ color: 0xffffff, vertexColors: true, gradientMap: ramp16, emissive: new THREE.Color(0x0a0c28) }));
      const mono = new THREE.Mesh(geo, stoneM); mono.position.set(Wm / 2, 1.55, Dm / 2); mono.rotation.y = Math.PI / 4 + 0.15; mono.castShadow = mono.receiveShadow = true; g.add(mono);
      const base = new THREE.Mesh(new THREE.IcosahedronGeometry(0.9, 1), std(0x6a5a44)); base.scale.set(1.2, 0.4, 1.0); base.position.set(Wm / 2, 0.15, Dm / 2); g.add(base);
      const runeC = document.createElement('canvas'); runeC.width = 128; runeC.height = 192; const rg = runeC.getContext('2d')!; rg.lineJoin = rg.lineCap = 'round'; const rgRef = { c: rg }; const RG = () => rgRef.c;
      const SYM: ((x: number, y: number) => void)[] = [
        (x, y) => { RG().beginPath(); RG().moveTo(x, y - 18); RG().quadraticCurveTo(x + 16, y + 6, x, y + 16); RG().quadraticCurveTo(x - 16, y + 6, x, y - 18); RG().stroke(); }, // gota
        (x, y) => { RG().beginPath(); for (let k = 0; k < 4; k++) { const d = 18 - k * 5; RG().moveTo(x - d, y - d); RG().lineTo(x + d, y - d); RG().lineTo(x + d, y + d); RG().lineTo(x - d + 3, y + d); } RG().stroke(); }, // labirinto
        (x, y) => { RG().beginPath(); RG().moveTo(x - 20, y - 14); RG().lineTo(x - 10, y); RG().lineTo(x - 20, y + 14); RG().moveTo(x + 20, y - 14); RG().lineTo(x + 10, y); RG().lineTo(x + 20, y + 14); RG().moveTo(x - 10, y); RG().quadraticCurveTo(x, y - 9, x + 10, y); RG().quadraticCurveTo(x, y + 9, x - 10, y); RG().stroke(); RG().beginPath(); RG().arc(x, y, 2.5, 0, 7); RG().stroke(); }, // KK com o olho
        (x, y) => { RG().beginPath(); RG().arc(x, y, 15, 0.4, 6.0); RG().stroke(); }, // círculo aberto
        (x, y) => { RG().beginPath(); RG().moveTo(x - 14, y - 16); RG().lineTo(x + 14, y - 16); RG().lineTo(x - 14, y + 16); RG().lineTo(x + 14, y + 16); RG().closePath(); RG().stroke(); }, // ampulheta
        (x, y) => { RG().beginPath(); RG().moveTo(x, y - 18); RG().lineTo(x, y + 18); RG().moveTo(x - 10, y - 6); RG().lineTo(x + 10, y - 2); RG().moveTo(x - 10, y + 6); RG().lineTo(x + 10, y + 2); RG().stroke(); }, // cruz-seta
      ];
      /* escavadas: primeiro o sulco escuro e largo, depois o vermelho mais fino por dentro (brilha quando a pedra é conhecida) */
      const symAll = (ctx: CanvasRenderingContext2D) => { const save = rgRef.c; rgRef.c = ctx; SYM.forEach((f, i) => f(32 + (i % 2) * 64, 36 + Math.floor(i / 2) * 60)); rgRef.c = save; };
      // o sulco escavado (sempre visível): traço escuro largo e um vermelho apagado por dentro
      rg.strokeStyle = '#140a28'; rg.lineWidth = 7; rg.shadowBlur = 0; symAll(rg); rg.strokeStyle = '#6a2426'; rg.lineWidth = 3; symAll(rg);
      const grooveT = new THREE.CanvasTexture(runeC); grooveT.magFilter = THREE.LinearFilter; grooveT.minFilter = THREE.LinearMipmapLinearFilter; const groove = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.2), new THREE.MeshBasicMaterial({ map: grooveT, transparent: true, side: THREE.DoubleSide, depthWrite: false })); groove.position.set(Wm / 2 + 0.515, 1.5, Dm / 2 + 0.515); groove.rotation.y = Math.PI / 4; g.add(groove);
      // o brilho (anima com o conhecido), numa segunda tela
      const runeC2 = document.createElement('canvas'); runeC2.width = 128; runeC2.height = 192; const rg2 = runeC2.getContext('2d')!; rg2.lineJoin = rg2.lineCap = 'round'; rg2.strokeStyle = '#ff5a30'; rg2.lineWidth = 3; rg2.shadowColor = '#ff2a10'; rg2.shadowBlur = 7; symAll(rg2);
      const runeT = new THREE.CanvasTexture(runeC2); runeT.magFilter = THREE.LinearFilter; runeT.minFilter = THREE.LinearMipmapLinearFilter;
      const runes = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.2), new THREE.MeshBasicMaterial({ map: runeT, transparent: true, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending })); runes.userData.dyn = true; runes.position.set(Wm / 2 + 0.52, 1.5, Dm / 2 + 0.52); runes.rotation.y = Math.PI / 4; g.add(runes);
      const ring = new THREE.Mesh(new THREE.RingGeometry(1.0, 1.45, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x8a7aff, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false })); ring.userData.dyn = true; ring.userData.col = 0xff6a40; ring.position.set(Wm / 2, 0.08, Dm / 2); g.add(ring);
      const mossG = new THREE.CylinderGeometry(1.1, 1.3, 0.12, 10); const moss = new THREE.Mesh(mossG, std(0x4e6a26)); moss.position.set(Wm / 2, 0.06, Dm / 2); g.add(moss);
      for (let k = 0; k < 6; k++) { const a = k * 1.05 + 0.3; const st = new THREE.Mesh(new THREE.DodecahedronGeometry(0.12 + (k % 2) * 0.08, 0), std(0x5a68b8)); st.position.set(Wm / 2 + Math.cos(a) * (0.9 + (k % 3) * 0.15), 0.14, Dm / 2 + Math.sin(a) * (0.9 + (k % 3) * 0.15)); st.rotation.y = a; g.add(st); }
      { const tm = artMesh('pedra_teleporte'); /* 03/11: a Pedra de Teleporte do Herik no lugar do menir; os símbolos já vêm pintados nela, o anel no chão continua */
        if (tm) { for (const o of [mono, base, groove, moss]) g.remove(o); runes.position.set(Wm / 2 + 0.46, 1.25, Dm / 2 + 0.46); runes.scale.setScalar(0.9); /* as runas acendem por cima dos símbolos pintados na pedra */ tm.scale.setScalar(2.5 / artGeo('pedra_teleporte')!.userData.h); tm.position.set(Wm / 2, 0, Dm / 2); tm.rotation.y = Math.PI / 4; g.add(tm); } }
      g.scale.setScalar(1.3); g.position.x -= Wm * 0.15; g.position.z -= Dm * 0.15;
      (L.relics ??= []).push({ gx: p.gx, gy: p.gy, runes, ring, pos: new THREE.Vector3(p.gx * T + Wm / 2, wy + 1.6, p.gy * T + Dm / 2), seed: r() * 50 });
      L.glows.push({ light: nullLight, base: 14, seed: r() * 50, warm: false, pos: new THREE.Vector3(p.gx * T + Wm / 2 + 0.9, wy + 1.2, p.gy * T + Dm / 2 + 0.9), color: 0x6a6aff } as WorldObjs['glowLights'][number]);
    } else if (p.kind === 'grave') {
      const v = p.variant ?? 0;
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.9), std(0x5a5448)); base.position.set(Wm / 2, 0.05, Dm / 2 + 0.3); g.add(base);
      if (v === 0) { const sl = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.9, 0.14), std(0x7a7a78)); ink(sl, 0.03); sl.position.set(Wm / 2, 0.5, Dm / 2 - 0.2); sl.rotation.z = (r() - 0.5) * 0.25; sl.castShadow = true; g.add(sl); }
      else if (v === 1) { const cb = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.1, 0.12), std(0x6a6458)); const ch = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.12, 0.12), std(0x6a6458)); cb.position.set(Wm / 2, 0.6, Dm / 2 - 0.2); ch.position.set(Wm / 2, 0.85, Dm / 2 - 0.2); cb.rotation.z = ch.rotation.z = (r() - 0.5) * 0.35; cb.castShadow = true; g.add(cb, ch); }
      else { const sl = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.14, 8, 1, false, 0, Math.PI), std(0x7a7a78)); sl.rotation.set(Math.PI / 2, 0, Math.PI / 2); sl.position.set(Wm / 2, 0.35, Dm / 2 - 0.2); sl.castShadow = true; g.add(sl); }
    } else if (p.kind === 'ruin') {
      const n = Math.max(2, Math.round(p.w * 2.2));
      for (let i = 0; i < n; i++) {
        const hh = p.height * (0.35 + r() * 0.65), ww = Wm / n * 0.95;
        const b = new THREE.Mesh(new THREE.BoxGeometry(ww, hh, 0.7), std([0x6a6860, 0x5c5a54, 0x75726a][i % 3], { map: tex })); ink(b, 0.04);
        b.position.set((i + 0.5) * Wm / n, hh / 2, Dm / 2 + (r() - 0.5) * 0.3); b.rotation.y = (r() - 0.5) * 0.12; b.castShadow = b.receiveShadow = true; g.add(b);
        if (r() < 0.5) { const top = new THREE.Mesh(new THREE.BoxGeometry(ww * 0.6, 0.35, 0.6), std(0x6a6860)); top.position.set((i + 0.5) * Wm / n + 0.3, hh + 0.12, Dm / 2); top.rotation.z = (r() - 0.5) * 0.5; g.add(top); }
      }
      for (let i = 0; i < 5; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.25, 0.35), std(0x625f58)); s.position.set(r() * Wm, 0.12, Dm / 2 + (r() - 0.5) * 2); s.rotation.y = r() * 3; g.add(s); }
    } else if (CURSED_KINDS.has(p.kind)) {
      buildCursed(p, g, Wm, Dm, r);
    } else if (p.kind === 'tent') { // barraca de lona de verdade: duas águas sobre a cumeeira, mastros, portas de pano abertas, cordas esticadas até estacas no chão
      const t = new THREE.Group(); t.position.set(Wm / 2, 0, Dm / 2); t.rotation.y = (r() - 0.5) * 1.2 + (r() < 0.5 ? 0 : Math.PI / 2); g.add(t);
      const L2 = 2.9 + r() * 0.5, W2 = 1.3 + r() * 0.15, H2 = 1.75 + r() * 0.25, side = Math.hypot(W2, H2), ang = Math.atan2(W2, H2);
      const canvas = std(p.wall, { map: tex, side: THREE.DoubleSide }), hem = std(0x3a2a1a), wood = std(0x5a3e22), rope = std(0xc8b48a), dark = std(0x120c08, { side: THREE.DoubleSide });
      for (const sx of [-1, 1]) { // as duas águas da lona
        const pg = new THREE.PlaneGeometry(side, L2, 1, 1); L.own.push(pg); const pl = new THREE.Mesh(pg, canvas); pl.rotation.set(-Math.PI / 2, 0, 0); const hold = new THREE.Group(); hold.add(pl); pl.position.x = sx * side / 2;
        hold.position.y = H2; hold.rotation.z = -sx * (Math.PI / 2 - ang); pl.castShadow = pl.receiveShadow = true; t.add(hold);
        const h = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, L2 + 0.02), hem); h.position.set(sx * W2, 0.04, 0); t.add(h); // barra da lona no chão
      }
      const tri = (w: number, hh: number) => { const sh = new THREE.Shape(); sh.moveTo(-w, 0); sh.lineTo(w, 0); sh.lineTo(0, hh); sh.closePath(); const gg = new THREE.ShapeGeometry(sh); L.own.push(gg); return gg; };
      const back = new THREE.Mesh(tri(W2, H2), canvas); back.position.z = -L2 / 2; t.add(back);
      for (const sx of [-1, 1]) { const half = new THREE.Shape(); half.moveTo(0, 0); half.lineTo(sx * W2, 0); half.lineTo(0, H2); half.closePath(); const fg = new THREE.ShapeGeometry(half); L.own.push(fg);
        const flap = new THREE.Mesh(fg, canvas); const hinge = new THREE.Group(); hinge.position.set(sx * W2 * 0.02, 0, L2 / 2); hinge.rotation.y = sx * (0.9 + r() * 0.5); hinge.add(flap); t.add(hinge); } // portas presas para fora
      const inside = new THREE.Mesh(tri(W2 * 0.92, H2 * 0.92), dark); inside.position.z = L2 / 2 - 0.05; t.add(inside);
      const ridge = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, L2 + 0.5, 6), wood); ridge.rotation.x = Math.PI / 2; ridge.position.y = H2 + 0.02; t.add(ridge);
      for (const sz of [-1, 1]) { const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, H2 + 0.25, 6), wood); pole.position.set(0, (H2 + 0.25) / 2, sz * (L2 / 2 + 0.05)); pole.castShadow = true; t.add(pole); }
      const line = (a3: THREE.Vector3, b3: THREE.Vector3) => { const len = a3.distanceTo(b3); const c = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, len, 4), rope); c.position.copy(a3).add(b3).multiplyScalar(0.5); c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b3.clone().sub(a3).normalize()); t.add(c);
        const stake = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.015, 0.32, 5), wood); stake.position.set(b3.x, 0.12, b3.z); stake.rotation.set((r() - 0.5) * 0.4, 0, (r() - 0.5) * 0.4); t.add(stake); };
      for (const sz of [-1, 1]) { const top = new THREE.Vector3(0, H2 + 0.2, sz * (L2 / 2 + 0.05)); line(top, new THREE.Vector3(-0.7, 0.02, sz * (L2 / 2 + 1.25))); line(top, new THREE.Vector3(0.7, 0.02, sz * (L2 / 2 + 1.25))); }
      for (const sx of [-1, 1]) for (const sz of [-0.32, 0.32]) line(new THREE.Vector3(sx * W2 * 0.55, H2 * 0.45, sz * L2), new THREE.Vector3(sx * (W2 + 0.75), 0.02, sz * L2 * 1.1)); // cordas laterais
      const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.8, 8), std(0x7a5a3a)); roll.rotation.z = Math.PI / 2; roll.position.set(0.3, 0.16, L2 / 2 + 0.55); t.add(roll); // saco de dormir enrolado
      if (r() < 0.6) { const sack = new THREE.Mesh(new THREE.SphereGeometry(0.22, 7, 5), std(0x8a7250)); sack.scale.set(1, 0.8, 1); sack.position.set(-W2 - 0.2, 0.17, L2 / 2 - 0.2); t.add(sack); }
    }
    /* 03/11 (Erling: "bancos, barracas, baús, torres, muralhas, iluminação — tudo que é decoração vira o modelo novo"): troca o desenho do prop pelo modelo
       do Herik depois de montado (o que mexe — chama, tampa — e o que o jogo usa continuam) */
    artOverride(p, g, L, Wm, Dm, wx, wy, wz);
    g.userData.kind = 'prop:' + p.kind;
    /* casas, templos, bancos, baús…: um draw call por material. Os kinds de STATIC_KINDS são fundidos por chunk logo depois (mergeChunkProps),
       então não passam por esta fusão (eram fundidos duas vezes: clone + re-clone de toda a geometria por chunk) */
    if (p.kind !== 'torch' && p.kind !== 'campfire' && p.kind !== 'tree' && !STATIC_KINDS.has(p.kind)) mergeStatic(g);
    return g;
  }

  /* REGRA DA AURA (Erling, 28/10): o corte de visão NUNCA come o que o jogador usa — correio, fonte (e a Fonte da Visão), baú, cofre,
   pedra de teletransporte (relíquia), quadro de avisos, estação da carroça. Essas peças ficam fora da fusão e com material sem o corte. */
/* ---------- 03/11: troca de props desenhados pelos modelos do Herik ---------- */
var palSet: Set<number> | null = null; // var: buildWorld zera antes desta linha rodar
function stripMeshes(g: THREE.Object3D, keep?: (o: THREE.Object3D) => boolean) {
  const out: THREE.Object3D[] = []; g.traverse((o) => { if (!(o as THREE.Mesh).isMesh || o.userData.dyn || keep?.(o)) return; let q: THREE.Object3D | null = o.parent; while (q && q !== g) { if (q.userData.dyn) return; q = q.parent; } out.push(o); });
  for (const o of out) o.parent?.remove(o);
}
function nearTown(world: World, gx: number, gy: number, pad = 6) { for (const st of world.settlements) if (Math.hypot(gx - st.x, gy - st.y) < st.radius + pad) return true; return false; }
var artWorld: World | null = null;
function artOverride(p: Prop, g: THREE.Group, L: Loaded, Wm: number, Dm: number, wx: number, wy: number, wz: number) {
  const W = artWorld; const put = (id: string, x: number, z: number, ry: number, k: number | THREE.Vector3 = 1) => { const m = artMarker(id); if (!m) return null; m.position.set(x, 0, z); m.rotation.y = ry; if (typeof k === 'number') m.scale.setScalar(k); else m.scale.copy(k); g.add(m); return m; };
  const firstRot = () => { for (const c of g.children) if ((c as THREE.Group).isGroup) return c.rotation.y; return 0; };
  if (p.kind === 'bench' && artGeo('vila_balanco')) { const ry = firstRot(); stripMeshes(g); put('vila_balanco', Wm / 2, Dm / 2, ry, 0.95); }
  else if (p.kind === 'stall' && artGeo('vila_barraca')) { stripMeshes(g); put('vila_barraca', Wm / 2, Dm / 2, p.ry ?? 0, 0.9); }
  else if (p.kind === 'chest' && artGeo('biblioteca_bau')) { const ry = firstRot(); stripMeshes(g); g.traverse((o) => { if (o.userData.dyn) o.traverse((c) => { if ((c as THREE.Mesh).isMesh) c.visible = false; }); }); put('biblioteca_bau', Wm / 2, Dm / 2, ry, 0.85); }
  else if (p.kind === 'tower' && artGeo('muralha_02')) { stripMeshes(g); const k = (p.height + 3) / artGeo('muralha_02')!.userData.h; put('muralha_02', Wm / 2, Dm / 2, 0, k);
    g.traverse((o) => { if (o.userData.dyn) o.visible = false; }); const tc = L.torches[L.torches.length - 1]; if (tc) tc.pos.set(wx, wy + (p.height + 3) * 0.62, wz); }
  else if (p.kind === 'torch' && W && nearTown(W, p.gx, p.gy) && artGeo('vila_poste_lampiao')) { /* nas cidades e vilas a tocha vira o poste com lampião; a chama fica dentro do lampião */
    stripMeshes(g); const ry = ((p.gx * 7 + p.gy * 13) % 8) * 0.785; put('vila_poste_lampiao', Wm / 2, Dm / 2, ry, 0.9);
    const tc = L.torches[L.torches.length - 1]; if (tc) { tc.flame.scale.setScalar(0.45); tc.flame.position.set(Wm / 2, 2.75, Dm / 2); tc.pos.set(wx, wy + 2.8, wz); } }
  else if (p.kind === 'palisade' && W && artGeo('muralha_01')) { /* paliçada: o muro do Herik cobre duas casas por peça (5 m comprimido para 4 m) */
    if (!palSet) { palSet = new Set(); for (const q of W.props) if (q.kind === 'palisade') palSet.add(q.gx * 4096 + q.gy); }
    const ns = (p.variant ?? 0) === 1, idx = ns ? p.gy : p.gx, nx = ns ? p.gx : p.gx + 1, ny = ns ? p.gy + 1 : p.gy, px = ns ? p.gx : p.gx - 1, py = ns ? p.gy - 1 : p.gy;
    const hasNext = palSet.has(nx * 4096 + ny), hasPrev = palSet.has(px * 4096 + py); stripMeshes(g);
    const G = artGeo('muralha_01')!, bb = G.boundingBox!, wid = bb.max.x - bb.min.x, ky = 2.9 / G.userData.h;
    if (idx % 2 === 0 && hasNext) put('muralha_01', ns ? Wm / 2 : Wm, ns ? Dm : Dm / 2, ns ? Math.PI / 2 : 0, new THREE.Vector3(4.05 / wid, ky, 0.75));
    else if (!(idx % 2 === 1 && hasPrev)) put('muralha_01', Wm / 2, Dm / 2, ns ? Math.PI / 2 : 0, new THREE.Vector3(2.05 / wid, ky, 0.75)); }
}

const NOCUT_KINDS = new Set(['mailbox', 'fountain', 'chest', 'vault', 'relic', 'noticeboard', 'station', 'deadwell', 'shopfront', 'campfire']);
function noCut(g: THREE.Object3D) { g.traverse((o) => { const m = o as THREE.Mesh; if (!m.isMesh) return; o.userData.keep = true; const fix = (mt: THREE.Material) => { if (!mt.onBeforeCompile || (mt as THREE.Material & { isMeshBasicMaterial?: boolean }).isMeshBasicMaterial) return mt; const c = mt.clone(); c.userData.noCut = true; return c; }; m.material = Array.isArray(m.material) ? m.material.map(fix) : fix(m.material); }); }
  const STATIC_KINDS = new Set(['library', 'lowwall', 'dock', 'chimney', 'crane', 'portico', 'monument', 'quay', 'landmark', 'palisade', 'totem', 'rwall', 'rtower', 'gatehouse', 'wstair', 'castle', 'station', 'vault', 'shopfront', 'herb', 'angel', 'obelisk', 'saint', 'mausoleum', 'gfence', 'gpillar', 'ggate', 'deadtree', 'corpse', 'deadcrop', 'deadwell', 'altar', 'tar', 'cwall', 'tower', 'ifence', 'coffin', 'house', 'temple', 'church', 'ruin', 'rock', 'grave', 'bones', 'bench', 'noticeboard', 'mailbox', 'tent', 'stall', 'torch', 'campfire', 'relic', 'bfloor', 'bwall', 'bfence', 'broof', 'bdoor', 'rack', 'plant', 'vprop']);
  const loaded = new Map<number, Loaded>();
  const propG = new Map<Prop, { g: THREE.Group; L: Loaded }>();
  const dynL: Loaded = { terrain: null as unknown as ChunkTerrain, group: new THREE.Group(), torches: [], glows: [], trees: [], smokers: [], own: [] }; group.add(dynL.group);
  function rebuildLists() {
    torchesA.length = 0; glowA.length = 0; treesA.length = 0; smokersA.length = 0;
    relicsA.length = 0; spinA.length = 0;
    for (const L of [...loaded.values(), dynL]) { torchesA.push(...L.torches); glowA.push(...L.glows); treesA.push(...L.trees); smokersA.push(...L.smokers); if (L.relics) relicsA.push(...L.relics); if (L.spin) spinA.push(...L.spin); }
  }
  function loadChunk(cx: number, cy: number, k: number) {
    const L: Loaded = { terrain: buildChunkTerrain(cx, cy, world), group: new THREE.Group(), torches: [], glows: [], trees: [], smokers: [], own: [] };
    L.group.add(L.terrain.group);
    L.treeG = []; L.treeMerged = [];
    L.staticG = []; L.staticMerged = [];
    const outside = cx < 0 || cy < 0 || cx >= nCx || cy >= nCy;
    const extra: Prop[] = [];
    if (outside) { // além do mapa: floresta fechada, cordilheira e pântano continuam (só cenário, sem colisão)
      const R = rng((cx * 83492791) ^ (cy * 29741) ^ 0x51f); const cs = CS;
      for (let i = 0; i < 16; i++) {
        const gx = cx * cs + Math.floor(R() * cs), gy = cy * cs + Math.floor(R() * cs), ek = edgeK(gx, gy); const gh = groundH((gx + 0.5) * T, (gy + 0.5) * T); if (gh < WL + 0.2) continue;
        if (ek.east > 0.5 && R() < 0.8) extra.push({ kind: 'tree', gx, gy, w: 1, h: 1, height: 6 + R() * 5, wall: 0x4b2f1c, roof: R() < 0.5 ? 0x2f6a2e : 0x3f7a3a, variant: R() < 0.5 ? 2 : 0 });
        else if (ek.north > 0.5 && R() < 0.5) extra.push({ kind: 'rock', gx, gy, w: 1, h: 1, height: 1.5 + R() * 3, wall: 0x6b6a68, roof: 0, variant: Math.floor(R() * 4) });
        else if (ek.west > 0.5 && R() < 0.25) extra.push({ kind: 'tree', gx, gy, w: 1, h: 1, height: 4 + R() * 2, wall: 0x3a2a1c, roof: 0x2a3a22, variant: 1 });
      }
    }
    for (const p of [...(byChunk.get(k) ?? []), ...extra]) { if ((p as Prop & { gone?: boolean }).gone) continue; try { const pg = buildProp(p, L); pg.userData.kind = p.kind; if (NOCUT_KINDS.has(p.kind)) noCut(pg); try { registerSteps(pg, p); } catch { /* */ } if (p.kind === 'tree') L.treeG.push(pg); else if (STATIC_KINDS.has(p.kind)) L.staticG.push(pg); else L.group.add(pg); propG.set(p, { g: pg, L }); } catch (e) { console.error('prop', p.kind, e); } }
    /* 03/11: modelos do Herik marcados pelos props (árvores, plantas, pedras, vila) viram UM InstancedMesh por modelo no chunk */
    L.artPG = []; for (const [pp, e] of propG) if (e.L === L) { let has = false; e.g.traverse((o) => { if (o.userData.art) has = true; }); if (has) L.artPG.push([pp, e.g]); }
    rebuildArt(L);
    L.trees.length = 0; mergeTrees(L); mergeChunkProps(L);
    /* congela as matrizes do que não se mexe: com ~30 mil objetos no mundo, recalcular todas a cada quadro custava ~20 ms */
    L.group.updateMatrixWorld(true);
    L.group.traverse((o) => { if (o.userData.dyn || o.userData.sway) return; o.matrixAutoUpdate = false; });
    for (const tc of L.torches) tc.flame.traverse((o) => { o.matrixAutoUpdate = true; });
    for (const rl of L.relics ?? []) { rl.ring.matrixAutoUpdate = true; rl.runes.matrixAutoUpdate = true; }
    L.group.traverse((o) => { if (o.userData.dyn || o.userData.sway) o.traverse((c) => { c.matrixAutoUpdate = true; }); });
    /* galhos 100% congelados nem são visitados pelo updateMatrixWorld (main.ts corta em matrixWorldAutoUpdate=false) */
    const freeze = (o: THREE.Object3D): boolean => { let live = o.matrixAutoUpdate; for (const c of o.children) if (freeze(c)) live = true; o.matrixWorldAutoUpdate = live; return live; };
    for (const c of L.group.children) freeze(c);
    group.add(L.group); loaded.set(k, L); rebuildLists();
  }
  function rebuildArt(L: Loaded) {
    if (!L.artB) L.artB = new ArtBatch(); L.artB.dispose(L.group); L.artB.clear();
    for (const [, pg] of L.artPG ?? []) collectMarkers(pg, L.group, L.artB);
    L.artB.build(L.group);
  }
  function unloadChunk(k: number) {
    const L = loaded.get(k)!; L.artB?.dispose(L.group); L.artPG = []; group.remove(L.group); L.terrain.dispose(); for (const g of L.own) g.dispose(); loaded.delete(k);
    /* VAZAMENTO (26/10, "Array buffer allocation failed" depois de horas): o mapa prop→grupo guardava cada chunk já visitado inteiro.
       Ao descarregar, solta as entradas desse chunk e as geometrias fundidas (árvores e estáticos) */
    for (const [p, e] of propG) if (e.L === L) propG.delete(p);
    for (const m of L.treeMerged ?? []) { L.group.remove(m); m.geometry.dispose(); } L.treeMerged = []; for (const m of L.staticMerged ?? []) { L.group.remove(m); m.geometry.dispose(); } L.staticMerged = [];
    L.group.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh && m.geometry && !m.userData.shared) m.geometry.dispose(); if ((m as unknown as THREE.InstancedMesh).isInstancedMesh) (m as unknown as THREE.InstancedMesh).dispose(); });
    L.treeG = []; L.staticG = []; L.trees = []; L.torches = []; L.glows = []; L.smokers = []; L.relics = []; L.spin = []; rebuildLists();
  }
  let lastCx = -99, lastCy = -99, queue: [number, number, number][] = [];
  let RAD = 2;
  function update(hx: number, hz: number, sync = false) {
    const cx = Math.floor(hx / CSM), cy = Math.floor(hz / CSM);
    if (cx !== lastCx || cy !== lastCy) {
      lastCx = cx; lastCy = cy; queue = [];
      for (let dy = -RAD; dy <= RAD; dy++) for (let dx = -RAD; dx <= RAD; dx++) {
        const x = cx + dx, y = cy + dy; if (x < -MARGIN || y < -MARGIN || x >= nCx + MARGIN || y >= nCy + MARGIN) continue;
        const k = keyOf(x, y); if (!loaded.has(k)) queue.push([x, y, k]);
      }
      queue.sort((a, b) => Math.hypot(a[0] - cx, a[1] - cy) - Math.hypot(b[0] - cx, b[1] - cy));
      for (const k of [...loaded.keys()]) { const x = k % KX - MARGIN, y = Math.floor(k / KX) - MARGIN; if (Math.max(Math.abs(x - cx), Math.abs(y - cy)) > RAD + 1) unloadChunk(k); }
    }
    let n = sync ? 999 : 1;
    while (queue.length && n-- > 0) { const [x, y, k] = queue.shift()!; if (!loaded.has(k)) loadChunk(x, y, k); }
    /* distribui as luzes reais às fontes mais próximas — com histerese, para a luz não "pular" de uma fonte para outra */
    const hp = tmpV.set(hx, 0, hz);
    assign(torchesA as unknown as LS[], tPool, tSlot, hp, (tc, l) => { l.position.set(tc.pos.x, tc.pos.y + 0.3, tc.pos.z); });
    assign(glowA as unknown as LS[], gPool, gSlot, hp, (g, l) => { l.position.copy(g.pos); l.color.setHex(g.color); });
  }
  type LS = { pos: THREE.Vector3; light: THREE.PointLight; color: number; dist: number };
  const tSlot: (LS | null)[] = [], gSlot: (LS | null)[] = [];
  function assign(list: LS[], pool: THREE.PointLight[], slots: (LS | null)[], hp: THREE.Vector3, put: (s: LS, l: THREE.PointLight) => void) {
    for (const s of list) { s.dist = s.pos.distanceToSquared(hp); }
    const sorted = [...list].sort((a, b) => a.dist - b.dist), rank = new Map<LS, number>(); sorted.forEach((s, i) => rank.set(s, i));
    const used = new Set<LS>();
    for (let i = 0; i < pool.length; i++) { const c = slots[i]; if (c && rank.has(c) && (rank.get(c) as number) < pool.length + 4 && !used.has(c)) used.add(c); else slots[i] = null; }
    for (const s of list) s.light = nullLight;
    for (let i = 0; i < pool.length; i++) {
      if (!slots[i]) { const nx = sorted.find((s) => !used.has(s)); if (nx) { slots[i] = nx; used.add(nx); } }
      const c = slots[i]; if (c) { c.light = pool[i]; put(c, pool[i]); } else pool[i].intensity = 0;
    }
  }
  const tmpV = new THREE.Vector3();

  /* pontes: tabuleiro, guarda-corpo, base de colunas de madeira com travessas e (nas longas) cobertura */
  for (const [bi, b] of world.bridges.entries()) {
    if (b.stone) { const ax = b.ax * T, az = b.ay * T, bx = b.bx * T, bz = b.by * T, len = Math.hypot(bx - ax, bz - az); const sb = buildStoneBridge(len, b.half ?? 3, b.hump ?? 1);
      const br = new THREE.Group(); br.position.set((ax + bx) / 2, (b.hA + b.hB) / 2 + 0.12, (az + bz) / 2); br.rotation.y = Math.atan2(bx - ax, bz - az); br.add(sb.group); br.userData.kind = 'prop:bridge'; mergeStatic(br); bridgeMeshes.add(br); continue; }
    const ax = b.ax * T, az = b.ay * T, bx = b.bx * T, bz = b.by * T, len = Math.hypot(bx - ax, bz - az), yaw = Math.atan2(bx - ax, bz - az);
    const br = new THREE.Group(); br.position.set((ax + bx) / 2, (b.hA + b.hB) / 2 + 0.12, (az + bz) / 2); br.rotation.y = yaw;
    const pitch = Math.atan2(b.hB - b.hA, len);
    const deck = new THREE.Group(); deck.rotation.x = -pitch; br.add(deck);
    const wood = std(0x4a3220), woodL = std(0x6a4a2c);
    const planks = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.18, len), std(0x7a5a38, { map: tex })); ink(planks, 0.04); planks.castShadow = planks.receiveShadow = true; deck.add(planks);
    for (let z = -len / 2 + 0.4; z < len / 2; z += 0.6) { const pl = new THREE.Mesh(new THREE.BoxGeometry(3.62, 0.04, 0.08), std(0x3a2616)); pl.position.set(0, 0.1, z); deck.add(pl); } // juntas das tábuas
    const covered = len > 11 && bi % 2 === 0;
    for (const sx of [-1, 1]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, len), wood); rail.position.set(sx * 1.7, 0.98, 0); deck.add(rail);
      const rail2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, len), wood); rail2.position.set(sx * 1.7, 0.55, 0); deck.add(rail2);
      const step = Math.max(2, len / Math.ceil(len / 2.8));
      for (let z = -len / 2; z <= len / 2 + 0.01; z += step) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.18, covered ? 2.6 : 1.1, 0.18), wood); post.position.set(sx * 1.7, covered ? 1.3 : 0.55, z); post.castShadow = true; deck.add(post);
        // colunas de sustentação descendo até a água/terreno, com travessa diagonal
        const pier = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.2, 4.2, 7), woodL); pier.position.set(sx * 1.45, -2.1, z); pier.castShadow = true; deck.add(pier);
        if (z > -len / 2 + 0.5) { const diag = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, Math.hypot(step, 1.2)), wood); diag.position.set(sx * 1.45, -0.8, z - step / 2); diag.rotation.x = Math.atan2(1.2, step); deck.add(diag); }
      }
      for (let z = -len / 2 + 1; z < len / 2; z += 4) { const cross = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.14, 0.14), wood); cross.position.set(0, -1.1, z); deck.add(cross); }
    }
    for (let z = -len / 2; z <= len / 2 + 0.01; z += Math.max(2, len / Math.ceil(len / 2.8))) { const beam = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.16, 0.16), wood); beam.position.set(0, -0.2, z); deck.add(beam); }
    if (covered) { const roof = gableRoof(4.4, len + 0.6, 1.3, 0.3, 0x5a3a28, 0x4a3220, false); roof.position.set(0, 2.6, 0); deck.add(roof); for (let z = -len / 2 + 1.4; z < len / 2; z += 2.8) { const tie = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.14, 0.14), wood); tie.position.set(0, 2.55, z); deck.add(tie); } }
    br.userData.kind = 'prop:bridge'; mergeStatic(br);
    bridgeMeshes.add(br);
  }
  /* placas de estrada */
  const signTexCache = new Map<string, THREE.Texture>(); /* placas repetem o mesmo texto (nome da vila/estrada): uma textura por texto, não por placa */
  const signTex = (text: string): THREE.Texture => { const hit = signTexCache.get(text); if (hit) return hit; const t = signTex0(text); signTexCache.set(text, t); return t; };
  const signTex0 = (text: string) => { const c = document.createElement('canvas'); c.width = 256; c.height = 64; const g = c.getContext('2d')!; g.fillStyle = '#8a6a3c'; g.fillRect(0, 0, 256, 64); for (let i = 0; i < 6; i++) { g.fillStyle = `rgba(60,40,20,${0.25 + (i % 2) * 0.2})`; g.fillRect(0, i * 11, 256, 2); } g.fillStyle = '#1a100a'; g.font = 'bold 30px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text.length > 16 ? text.slice(0, 15) + '…' : text, 128, 34); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = t.minFilter = THREE.NearestFilter; return t; };
  for (const sg of world.signs) {
    const g = new THREE.Group(); const x = (sg.x + 0.5) * T, z = (sg.y + 0.5) * T; g.position.set(x, groundH(x, z), z);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 2.4, 6), std(0x4a3220)); post.position.y = 1.2; post.castShadow = true; g.add(post);
    sg.lines.forEach((ln, i) => { const board = new THREE.Group(); board.position.y = 2.1 - i * 0.42; board.rotation.y = ln.dir + Math.PI / 2; g.add(board);
      const bm = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.34, 0.06), std(0xffffff, { map: signTex(ln.text) })); bm.position.x = 0.55; bm.castShadow = true; board.add(bm);
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.3, 4), std(0x8a6a3c)); tip.rotation.z = -Math.PI / 2; tip.rotation.y = Math.PI / 4; tip.position.x = 1.45; board.add(tip);
      const back = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.34, 0.02), std(0x7a5a30)); back.position.set(0.55, 0, -0.04); board.add(back); });
    g.userData.kind = 'prop:sign'; mergeStatic(g); bridgeMeshes.add(g);
  }
  bridgeMeshes.updateMatrixWorld(true); bridgeMeshes.traverse((o) => { o.matrixAutoUpdate = false; }); bridgeMeshes.matrixWorldAutoUpdate = false; // pontes e placas nunca se mexem
  void MAP_H;
  /** todas as árvores do chunk viram UMA malha por material (tronco, folhas): dezenas de draw calls a menos */
  function mergeTrees(L: Loaded) {
    for (const m of L.treeMerged ?? []) { L.group.remove(m); m.geometry.dispose(); } L.treeMerged = [];
    // células de 20 m (quarto de chunk) para manter o frustum culling: fora da tela não é desenhado
    const cells = new Map<string, Map<THREE.Material, THREE.BufferGeometry[]>>();
    const inv = new THREE.Matrix4(); L.group.updateMatrixWorld(true); inv.copy(L.group.matrixWorld).invert();
    for (const tg of L.treeG ?? []) {
      tg.updateMatrixWorld(true); const ck = `${Math.floor(tg.position.x / 20)}:${Math.floor(tg.position.z / 20)}`;
      let buckets = cells.get(ck); if (!buckets) { buckets = new Map(); cells.set(ck, buckets); }
      tg.traverse((o) => { const m = o as THREE.Mesh; if (!m.isMesh || !m.geometry.attributes.position) return; const mat = m.material as THREE.Material; if (Array.isArray(m.material)) return;
        const gg = (m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone()); for (const n of Object.keys(gg.attributes)) if (n !== 'position' && n !== 'normal' && n !== 'uv') gg.deleteAttribute(n);
        gg.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld)); let b = buckets!.get(mat); if (!b) { b = []; buckets!.set(mat, b); } b.push(gg); });
    }
    for (const buckets of cells.values()) for (const [mat, geos] of buckets) { const merged = mergeGeometries(geos, false); for (const gg of geos) gg.dispose(); if (!merged) continue; merged.computeBoundingSphere(); const mesh = new THREE.Mesh(merged, mat); mesh.castShadow = true; mesh.receiveShadow = false; L.group.add(mesh); L.treeMerged!.push(mesh); }
  }
  /** props imóveis do chunk (casas, templos, rochas, bancos…) viram UMA malha por textura, em células de 20 m: um bairro inteiro em ~20 draw calls */
  function mergeChunkProps(L: Loaded) {
    for (const m of L.staticMerged ?? []) { L.group.remove(m); m.geometry.dispose(); } L.staticMerged = [];
    type B = { mat: THREE.Material; geos: THREE.BufferGeometry[]; shadow: boolean; vc: boolean };
    const cells = new Map<string, Map<string, B>>();
    const inv = new THREE.Matrix4(); L.group.updateMatrixWorld(true); inv.copy(L.group.matrixWorld).invert();
    const col = new THREE.Color(), tmpM = new THREE.Matrix4();
    for (const pg of L.staticG ?? []) {
      if (pg.parent !== L.group) L.group.add(pg); // garante matrixWorld coerente
      pg.updateMatrixWorld(true); const ck = `${Math.floor(pg.position.x / 20)}:${Math.floor(pg.position.z / 20)}`;
      let buckets = cells.get(ck); if (!buckets) { buckets = new Map(); cells.set(ck, buckets); }
      const skip = new Set<THREE.Object3D>(), taken: THREE.Mesh[] = [];
      pg.traverse((o) => {
        if (o.userData.sway || o.userData.dyn || o.userData.keep) { o.traverse((c) => skip.add(c)); return; }
        const m = o as THREE.Mesh; if (!m.isMesh || skip.has(m) || Array.isArray(m.material) || !m.geometry.attributes.position || (!m.visible && !m.userData.merged)) return;
        const mat = m.material as THREE.MeshToonMaterial; if (mat.transparent || (mat as THREE.Material & { isSprite?: boolean }).isSprite) return;
        const toon = (mat as THREE.Material & { isMeshToonMaterial?: boolean }).isMeshToonMaterial === true;
        const key = toon ? `t|${mat.map ? mat.map.uuid : ''}|${mat.side}|${mat.emissive ? mat.emissive.getHex() : 0}|${m.castShadow ? 1 : 0}` : `i|${mat.uuid}|${m.castShadow ? 1 : 0}`;
        let b = buckets!.get(key);
        if (!b) { b = { mat: toon ? cutoutify(new THREE.MeshToonMaterial({ color: 0xffffff, vertexColors: true, map: mat.map ?? null, gradientMap: ramp, side: mat.side, emissive: mat.emissive ? mat.emissive.clone() : undefined })) : mat, geos: [], shadow: m.castShadow, vc: toon }; buckets!.set(key, b); }
        const gg = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
        for (const n of Object.keys(gg.attributes)) if (n !== 'position' && n !== 'normal' && n !== 'uv' && n !== 'color') gg.deleteAttribute(n);
        if (!gg.attributes.normal) gg.computeVertexNormals();
        if (!gg.attributes.uv) { gg.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(gg.attributes.position.count * 2), 2)); }
        if (toon) { if (!(mat.vertexColors && gg.attributes.color)) { const n = gg.attributes.position.count, cols = new Float32Array(n * 3); col.copy(mat.color); for (let i = 0; i < n; i++) { cols[i * 3] = col.r; cols[i * 3 + 1] = col.g; cols[i * 3 + 2] = col.b; } gg.setAttribute('color', new THREE.BufferAttribute(cols, 3)); } else if (!mat.color.equals(new THREE.Color(0xffffff))) { const c = gg.attributes.color; for (let i = 0; i < c.count; i++) c.setXYZ(i, c.getX(i) * mat.color.r, c.getY(i) * mat.color.g, c.getZ(i) * mat.color.b); } }
        else if (gg.attributes.color) gg.deleteAttribute('color');
        gg.applyMatrix4(tmpM.multiplyMatrices(inv, m.matrixWorld)); b.geos.push(gg); taken.push(m);
      });
      /* 26/10 (relíquia invisível): as malhas fundidas NÃO saem do prop — só se escondem. Antes elas eram arrancadas, e quando
         algo do chunk sumia (erva colhida, pedra quebrada) a refusão achava os props vazios: a pedra da relíquia, túmulos e casas
         sumiam e só ficavam as partes que brilham. Agora a refusão sempre encontra tudo. */
      for (const m of taken) { m.userData.merged = true; m.visible = false; }
      let left = false; pg.traverse((o) => { if ((o as THREE.Mesh).isMesh && o.visible && !skip.has(o)) left = true; if ((o as THREE.Mesh).isMesh && skip.has(o)) left = true; }); if (!left) L.group.remove(pg);
    }
    for (const buckets of cells.values()) for (const b of buckets.values()) {
      const merged = mergeGeometries(b.geos, false); for (const gg of b.geos) gg.dispose(); if (!merged) continue;
      merged.computeBoundingSphere(); const mesh = new THREE.Mesh(merged, b.mat); mesh.castShadow = b.shadow; mesh.receiveShadow = true; L.group.add(mesh); L.staticMerged!.push(mesh);
    }
  }
  function removeProp(p: Prop) {
    (p as Prop & { gone?: boolean }).gone = true; const e = propG.get(p); if (!e) return;
    if (e.L.artPG?.some((q) => q[0] === p)) { e.L.artPG = e.L.artPG.filter((q) => q[0] !== p); rebuildArt(e.L); }
    if (p.kind === 'tree' && e.L.treeG) { e.L.treeG = e.L.treeG.filter((g) => g !== e.g); propG.delete(p); mergeTrees(e.L); rebuildLists(); return; }
    if (e.L.staticG && e.L.staticG.includes(e.g)) { e.L.staticG = e.L.staticG.filter((g) => g !== e.g); e.L.trees = e.L.trees.filter((t) => { let o: THREE.Object3D | null = t.obj; while (o) { if (o === e.g) return false; o = o.parent; } return true; }); propG.delete(p); mergeChunkProps(e.L); rebuildLists(); return; }
    e.L.group.remove(e.g); e.L.trees = e.L.trees.filter((t) => { let o: THREE.Object3D | null = t.obj; while (o) { if (o === e.g) return false; o = o.parent; } return true; }); propG.delete(p); rebuildLists();
  }
  function addProp(p: Prop) { world.props.push(p); const pg = buildProp(p, dynL); realizeMarkers(pg); if (STATIC_KINDS.has(p.kind)) mergeStatic(pg); /* fora dos chunks não há fusão por chunk */ dynL.group.add(pg); propG.set(p, { g: pg, L: dynL }); rebuildLists(); }
  const fountainPos = () => { for (const L of loaded.values()) if (L.fountain) return L.fountain; return null; };
  return { setRad(n: number) { if (n !== RAD) { RAD = n; lastCx = -9999; } }, fountainPos, removeProp, addProp, group, torches: torchesA, glowLights: glowA, windows, trees: treesA, smokers: smokersA, relics: relicsA, spinners: spinA, update, bridgeMeshes };
}
