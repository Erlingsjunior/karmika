import * as THREE from 'three';
import { mergeStatic } from './merge3d';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { SCALE, TILE_M as T } from '@karmika/shared';
import { type World, type Prop, MAP_W, MAP_H, groundH, rng, edgeK, WL, veinOf, rotLocal, canalX, CANAL_HW } from './world';
import { buildTree } from './trees3d';
import { RUNAS } from './runas';
import { buildRampart, buildWallTower, buildGatehouse, buildWallStair, buildCastle, buildAcademy, buildStoneBridge, buildQuay, type Built } from './city3d';
import { buildTemple } from './temple3d';
import { buildHouse, buildStyledHouse } from './houses3d';
import { buildLandmark, buildPalisade, buildTotem } from './village3d';
import { buildMonument } from './monuments3d';
import { std, ink, ramp, plankTex, shingleTex, stoneTex, gableRoof } from './toon3d';
import { buildStation } from './stations3d';
import { buildGothic } from './gothic3d';
import { buildCursed, CURSED_KINDS } from './cursed3d';
import { windU } from './terrain3d';
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

export const FOUNTAIN = { rim: 0.9, bowl: 2.1, top: 3.35, rad: 2.2 };
const fountainWater = new THREE.ShaderMaterial({ transparent: true, uniforms: { uT: windU, uL: { value: 1 } },
  vertexShader: 'varying vec3 vP; void main(){ vP = (modelMatrix*vec4(position,1.)).xyz; gl_Position = projectionMatrix*viewMatrix*vec4(vP,1.); }',
  fragmentShader: 'uniform float uT; varying vec3 vP; void main(){ vec2 c = vP.xz - floor(vP.xz*0.0); float r = length(vP.xz - vec2(0.0)); float w = sin(vP.x*3.1+uT*1.7)*sin(vP.z*2.7-uT*1.3)*0.5+0.5; float rg = smoothstep(0.9,1.0,sin(length(fract(vP.xz*0.25)-0.5)*40.0 - uT*5.0)); vec3 col = mix(vec3(0.08,0.35,0.5), vec3(0.3,0.7,0.85), w*0.6) + rg*0.18; gl_FragColor = vec4(col, 0.92); }' });
interface Loaded { terrain: ChunkTerrain; group: THREE.Group; torches: Torch[]; glows: WorldObjs['glowLights'][number][]; trees: { obj: THREE.Object3D; ph: number }[]; smokers: THREE.Vector3[]; relics?: WorldObjs['relics']; own: THREE.BufferGeometry[]; fountain?: THREE.Vector3; treeG?: THREE.Group[]; treeMerged?: THREE.Mesh[]; staticG?: THREE.Group[]; staticMerged?: THREE.Mesh[] }

/* ---------- degraus pisáveis (Erling, 23/10: "não consigo subir a escada, fico atravessando ela" — em todos os prédios grandes).
   As escadarias, plintos e patamares dos prédios eram só desenho: o chão do herói continuava o terreno. Agora, quando um prédio
   carrega, as faces de cima (viradas para o céu) dos seus degraus e plataformas baixas (até 2,2 m acima do chão) viram um mapa de
   alturas de 25 cm. O herói sobe o que estiver a até ~0,55 m do pé (um degrau) e é barrado pelo que for mais alto (a lateral do plinto). */
const STEP_RES = 0.25, stepMap = new Map<number, number>(), stepDone = new WeakSet<object>();
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
  const fountainRef = (() => { const f = world.props.find((q) => q.kind === 'fountain'); return f ? { x: (f.gx + f.w / 2) * T, z: (f.gy + f.h / 2) * T } : null; })();
  const group = new THREE.Group();
  const tex = noiseTex();
  const windows = new THREE.MeshBasicMaterial({ color: 0xffc266 });
  // brilhos compartilhados (entram no mesmo lote de desenho em todo o chunk): cogumelo-lamparina, flor-de-marghar, prata no veio
  const glowShroom = new THREE.MeshBasicMaterial({ color: 0xffc85a }), glowMarghar = new THREE.MeshBasicMaterial({ color: 0x8ac8ff }), glowSilver = new THREE.MeshBasicMaterial({ color: 0xeef4ff });
  const torchesA: Torch[] = [], glowA: WorldObjs['glowLights'] = [], treesA: WorldObjs['trees'] = [], smokersA: THREE.Vector3[] = [], relicsA: WorldObjs['relics'] = [];
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
    g.position.set(p.gx * T, p.kind === 'fountain' || p.kind === 'house' || p.kind === 'temple' ? Math.max(0, gy0) : gy0, p.gy * T);
    if (p.kind === 'tar') g.position.y = Math.max(gy0, WL) + 0.01; // água negra: na linha d'água
    const r = rng(p.gx * 977 + p.gy * 131);
    const wx = p.gx * T + Wm / 2, wz = p.gy * T + Dm / 2, wy = g.position.y;
    if (p.kind === 'house') {
      const hs = p.style ? buildStyledHouse(p.style, p.variant ?? 0, Wm, Dm, p.wall, p.roof, { windows, rnd: r }) : buildHouse(p.variant ?? 0, Wm, Dm, p.wall, p.roof, { windows, rnd: r });
      g.add(hs.group);
      for (const ch of hs.chimneys) L.smokers.push(new THREE.Vector3(p.gx * T + ch.x, wy + ch.y, p.gy * T + ch.z));
      L.glows.push({ light: nullLight, base: 14, seed: r() * 50, warm: true, pos: new THREE.Vector3(p.gx * T + hs.lantern.x, wy + hs.lantern.y, p.gy * T + hs.lantern.z), color: 0xffbb66 } as WorldObjs['glowLights'][number]);
    } else if (p.kind === 'monument' || p.kind === 'quay' || p.kind === 'landmark' || p.kind === 'palisade' || p.kind === 'totem' || p.kind === 'rwall' || p.kind === 'rtower' || p.kind === 'gatehouse' || p.kind === 'wstair' || p.kind === 'castle' || (p.kind === 'temple' && (p.variant ?? 0) >= 10)) {
      /* cidade média: muralha com caminho de ronda, torres, portões, escadarias, castelo, academias e a catedral (city3d.ts) */
      const v = p.variant ?? 0; let b: Built | null = null;
      if (p.kind === 'quay') { const sd = v === 1 ? -1 : 1, pts: { x: number; z: number }[] = []; for (let k = 0; k <= 4; k++) { const ty = p.gy + k * 0.5, ex = canalX(ty) - sd * CANAL_HW; pts.push({ x: ex * T - p.gx * T, z: k * 0.5 * T }); } b = buildQuay(pts, sd); } else
      if (p.kind === 'monument') b = buildMonument(v, Wm, Dm); else
      if (p.kind === 'landmark') b = buildLandmark(v, Wm, Dm); else if (p.kind === 'palisade') b = buildPalisade(v === 1, p.gx * 3 + p.gy); else if (p.kind === 'totem') b = buildTotem(v); else
      if (p.kind === 'rwall') b = buildRampart(v & 3, p.height, p.gx * 7 + p.gy * 13);
      else if (p.kind === 'rtower') b = buildWallTower(v & 3, p.height, v >= 4, p.roof);
      else if (p.kind === 'gatehouse') b = buildGatehouse(v, Math.max(p.w, p.h), p.height, p.roof);
      else if (p.kind === 'wstair') b = buildWallStair(v >> 1, Math.max(p.w, p.h), v & 1 ? 1 : -1, p.height);
      else if (p.kind === 'castle') b = buildCastle(Wm, Dm, p.wall, p.roof);
      else if (v === 20) { g.add(buildGothic(Wm, Dm, p.wall, p.roof, true)); L.glows.push({ light: nullLight, base: 44, seed: r() * 50, warm: true, pos: new THREE.Vector3(wx, wy + 6, p.gy * T + Dm + 3), color: 0xffb060 } as WorldObjs['glowLights'][number]); }
      else b = buildAcademy(v, Wm, Dm, p.wall);
      if (b) { g.add(b.group);
        for (const q of b.glows) L.glows.push({ light: nullLight, base: q.base, seed: r() * 50, warm: true, pos: new THREE.Vector3(p.gx * T + q.pos.x, wy + q.pos.y, p.gy * T + q.pos.z), color: q.color } as WorldObjs['glowLights'][number]);
        for (const q of b.smoke) L.smokers.push(new THREE.Vector3(p.gx * T + q.x, wy + q.y, p.gy * T + q.z));
        for (const q of b.torches) L.torches.push({ pos: new THREE.Vector3(p.gx * T + q.pos.x, wy + q.pos.y, p.gy * T + q.pos.z), light: nullLight, base: 46, seed: r() * 50, flame: q.flame, dist: 0 }); }
    } else if (p.kind === 'church' && p.variant === 2) { // a Catedral Abandonada: gótica, altíssima
      g.add(buildGothic(Wm, Dm, p.wall, p.roof));
    } else if (p.kind === 'church' || (p.kind === 'temple' && true)) {
      const ruinedC = p.kind === 'church';
      const tp = buildTemple(Wm, Dm, p.wall, p.roof === 0x8f7bff ? 0x4a4468 : p.roof, ruinedC, windows, p.gx * 7 + p.gy * 3);
      g.add(tp.group);
      if (!ruinedC) L.glows.push({ light: nullLight, base: 40, seed: r() * 50, warm: false, pos: new THREE.Vector3(p.gx * T + tp.glow.x, wy + tp.glow.y, p.gy * T + tp.glow.z), color: 0x8f7bff } as WorldObjs['glowLights'][number]);
    } else if ((p.kind as string) === 'templeOLD') {
      const wallH = p.height, temple = (p.kind as string) === 'temple';
      const bw = Wm - 0.4, bd = Dm - 0.4;
      const walls = new THREE.Mesh(new THREE.BoxGeometry(bw, wallH, bd), std(p.wall, { map: tex }));
      ink(walls, 0.06); walls.position.set(Wm / 2, wallH / 2, Dm / 2); walls.castShadow = walls.receiveShadow = true; g.add(walls);
      const rh = temple ? SCALE.temple.roof : SCALE.roof.height;
      const roofG = gableRoof(bw, bd, rh, 0.9, p.roof === 0x8f7bff ? 0x4a4468 : p.roof, p.wall, true); roofG.position.set(Wm / 2, wallH, Dm / 2); g.add(roofG);
      const dw = temple ? 2.4 : SCALE.door.width, dh = temple ? 4.2 : SCALE.door.height;
      const door = new THREE.Mesh(new THREE.BoxGeometry(dw, dh, 0.12), std(0x1c120c));
      ink(door, 0.06); door.position.set(Wm / 2, dh / 2, Dm - 0.2 + 0.05); g.add(door);
      const ww = SCALE.window.width, wh = SCALE.window.height;
      const nz = Math.max(1, Math.floor(bw / 2.6)), nx = Math.max(1, Math.floor(bd / 2.6));
      const winY = temple ? 3.6 : SCALE.window.sill + wh / 2;
      for (let k = 0; k < nz; k++) {
        const cx = (Wm - bw) / 2 + bw * (k + 0.5) / nz;
        if (Math.abs(cx - Wm / 2) < dw / 2 + ww / 2 + 0.1) continue;
        const w = new THREE.Mesh(new THREE.PlaneGeometry(ww, wh), windows); w.position.set(cx, winY, Dm - 0.2 + 0.02); g.add(w);
      }
      for (let k = 0; k < nx; k++) {
        const w = new THREE.Mesh(new THREE.PlaneGeometry(ww, wh), windows); w.rotation.y = Math.PI / 2;
        w.position.set(Wm - 0.2 + 0.02, winY, (Dm - bd) / 2 + bd * (k + 0.5) / nx); g.add(w);
      }
      if (!temple) {
        const ch = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.6, 0.6), std(0x5a4a42));
        ink(ch, 0.05); ch.position.set(Wm / 2 + bw * 0.28, wallH + rh * 0.7, Dm / 2 - bd * 0.2); ch.castShadow = true; g.add(ch);
        L.smokers.push(new THREE.Vector3(wx + bw * 0.28, wy + wallH + rh * 0.7 + 0.9, wz - bd * 0.2));
        const beamM = std(0x2a1b12);
        for (const sx of [-1, 1]) { const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.16, wallH, 0.16), beamM); b1.position.set(Wm / 2 + sx * (bw / 2 + 0.02), wallH / 2, Dm - 0.2 + 0.03); g.add(b1); }
        const b2 = new THREE.Mesh(new THREE.BoxGeometry(bw + 0.1, 0.14, 0.14), beamM); b2.position.set(Wm / 2, wallH - 0.15, Dm - 0.2 + 0.03); g.add(b2);
      }
      const lp = new THREE.Vector3(wx, wy + 2.2, p.gy * T + Dm + 0.8);
      L.glows.push({ light: nullLight, base: temple ? 40 : 14, seed: r() * 50, warm: !temple, pos: lp, color: temple ? 0x8f7bff : 0xffbb66 } as WorldObjs['glowLights'][number]);
      if (temple) {
        const rune = new THREE.Mesh(new THREE.OctahedronGeometry(0.7), new THREE.MeshBasicMaterial({ color: 0xb9a8ff }));
        rune.scale.set(1, 1.6, 0.25); rune.position.set(Wm / 2, 6.2, Dm - 0.1); g.add(rune);
      }
    } else if (p.kind === 'fountain') {
      const rad = SCALE.fountain.radius, hh = SCALE.fountain.height;
      const stoneM = std(0xffffff, { map: stoneTex(0x8a8f9c) }), stoneD = std(0xffffff, { map: stoneTex(0x6a6f7c) });
      const lathe = (pts: [number, number][], m: THREE.Material, y = 0) => { const geo = new THREE.LatheGeometry(pts.map(([x, yy]) => new THREE.Vector2(x, yy)), 20); const mm = new THREE.Mesh(geo, m); ink(mm, 0.04); mm.position.set(Wm / 2, y, Dm / 2); mm.castShadow = mm.receiveShadow = true; g.add(mm); return mm; };
      // degrau + bacia grande com borda grossa e interior escavado
      lathe([[0, 0], [rad + 0.55, 0], [rad + 0.55, 0.18], [rad + 0.3, 0.18], [rad + 0.3, 0.32]], stoneD);
      lathe([[rad - 0.05, 0.3], [rad + 0.12, 0.3], [rad + 0.12, hh], [rad - 0.32, hh], [rad - 0.32, hh - 0.14], [rad - 0.4, hh - 0.14], [rad - 0.4, 0.3]], stoneM);
      for (let i = 0; i < 14; i++) { const a2 = (i / 14) * 6.283; const rk = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.36), stoneD); rk.position.set(Wm / 2 + Math.cos(a2) * (rad - 0.1), hh + 0.04, Dm / 2 + Math.sin(a2) * (rad - 0.1)); rk.rotation.y = -a2; g.add(rk); }
      // água animada na bacia
      const wat = new THREE.Mesh(new THREE.CircleGeometry(rad - 0.38, 28).rotateX(-Math.PI / 2), fountainWater); wat.position.set(Wm / 2, hh - 0.2, Dm / 2); g.add(wat);
      // coluna central, bacia superior e remate
      lathe([[0, 0], [0.55, 0], [0.5, 0.3], [0.3, 0.5], [0.22, 1.1], [0.3, 1.25], [0.2, 1.3]], stoneM, hh - 0.2);
      lathe([[0, 1.2], [0.2, 1.2], [0.9, 1.5], [1.05, 1.78], [0.9, 1.74], [0.0, 1.5]], stoneM, hh - 0.2);
      const wat2 = new THREE.Mesh(new THREE.CircleGeometry(0.88, 20).rotateX(-Math.PI / 2), fountainWater); wat2.position.set(Wm / 2, hh + 1.52, Dm / 2); g.add(wat2);
      lathe([[0, 1.5], [0.14, 1.5], [0.2, 2.0], [0.1, 2.35], [0.0, 2.45]], stoneM, hh - 0.2);
      const orb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), new THREE.MeshBasicMaterial({ color: 0xbfe6ff })); orb.position.set(Wm / 2, hh + 2.55, Dm / 2); g.add(orb);
      // bicas (cabeças de leão) na borda da bacia superior
      for (let i = 0; i < 4; i++) { const a2 = (i / 4) * 6.283 + 0.78; const sp = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.3), stoneD); sp.position.set(Wm / 2 + Math.cos(a2) * 0.98, hh + 1.45, Dm / 2 + Math.sin(a2) * 0.98); sp.rotation.y = -a2 + Math.PI / 2; g.add(sp); }
      L.glows.push({ light: nullLight, base: 40, seed: r() * 50, warm: false, pos: new THREE.Vector3(wx, wy + hh + 2.6, wz), color: 0x6fc7ff } as WorldObjs['glowLights'][number]);
      L.fountain = new THREE.Vector3(wx, wy, wz);
    } else if (p.kind === 'chest') {
      const bx = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.55, 0.65), std(0xffffff, { map: plankTex(0x6a4528) })); ink(bx, 0.03); bx.position.set(Wm / 2, 0.28, Dm / 2); bx.castShadow = true; g.add(bx);
      const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 1.0, 8, 1, false, 0, Math.PI), std(0xffffff, { map: plankTex(0x7a5530) })); lid.rotation.set(0, 0, Math.PI / 2); lid.rotation.order = 'ZYX'; lid.rotateX(Math.PI / 2); lid.position.set(Wm / 2, 0.55, Dm / 2); g.add(lid);
      for (const s of [-1, 1]) { const st = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.62, 0.7), std(0x2a2a32)); st.position.set(Wm / 2 + s * 0.32, 0.3, Dm / 2); g.add(st); }
      const lk = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.16, 0.05), std(0xc9a84a)); lk.position.set(Wm / 2, 0.5, Dm / 2 + 0.34); g.add(lk);
      g.rotation.y = (p.variant ?? 0) * 0.7;
      g.position.x += 0; 
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
    } else if (p.kind === 'station') { // pontos de trabalho dos ofícios
      const st = buildStation(p.variant ?? 0, r); st.group.position.set(Wm / 2, 0, Dm / 2); st.group.rotation.y = p.ry ?? 0; g.add(st.group);
      const loc = (v: { x: number; y: number; z: number }) => new THREE.Vector3(v.x, v.y, v.z).applyAxisAngle(new THREE.Vector3(0, 1, 0), p.ry ?? 0).add(new THREE.Vector3(wx, wy, wz));
      if (st.glow) L.glows.push({ light: nullLight, base: st.glow.base, seed: r() * 50, warm: true, pos: loc(st.glow), color: st.glow.color } as WorldObjs['glowLights'][number]);
      if (st.smoke) L.smokers.push(loc(st.smoke));
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
      const { obj } = buildTree(p.height, p.variant === 2 ? 0.9 : p.variant === 1 ? 0.5 : hsh * 0.3);
      g.position.set(wx, gy0 - 0.08, wz); g.rotation.y = hsh * 40;
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
      // rocha: esfera subdividida deformada por ruído (facetas irregulares, base achatada), com musgo nos topos e pedras menores ao redor
      const mkRock = (seed: number, flat = 0.62) => {
        const geo = new THREE.IcosahedronGeometry(1, 2), pa = geo.attributes.position; const n1 = seed * 7.3, n2 = seed * 3.1;
        for (let i = 0; i < pa.count; i++) {
          const x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i);
          const k = 0.82 + 0.26 * (Math.sin(x * 3.1 + n1) * Math.cos(z * 2.7 + n2) * 0.5 + Math.sin(y * 4.3 + x * 1.7 + n2) * 0.3 + Math.sin((x + z) * 5.7 + n1) * 0.2);
          pa.setXYZ(i, x * k, (y * k) * (y < 0 ? 0.35 : flat) + (y < 0 ? -0.1 : 0), z * k);
        }
        geo.computeVertexNormals();
        // cor por vértice: cinza com variação + musgo verde nos topos voltados para cima
        const cols = new Float32Array(pa.count * 3), base = new THREE.Color([0x6b6a68, 0x5e5d5b, 0x7a746a, 0x625f66][(p.variant ?? 0) % 4]), moss = new THREE.Color(0x4a6a34), nrm = geo.attributes.normal;
        for (let i = 0; i < pa.count; i++) { const up = Math.max(0, nrm.getY(i)); const v = 0.86 + 0.28 * Math.sin(i * 12.9 + seed); const c = base.clone().multiplyScalar(v); if (up > 0.72 && p.wall !== 0x5a5048) c.lerp(moss, (up - 0.72) * 1.6 * (0.5 + 0.5 * Math.sin(i * 3.3 + seed))); cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b; }
        geo.setAttribute('color', new THREE.BufferAttribute(cols, 3)); L.own.push(geo); return geo;
      };
      const rm = new THREE.MeshToonMaterial({ color: 0xffffff, vertexColors: true, gradientMap: ramp });
      const m = new THREE.Mesh(mkRock(p.gx * 13 + p.gy), rm);
      const sx = Wm * 0.52 * (0.85 + r() * 0.3), sy = p.height * 0.55, sz = Dm * 0.52 * (0.85 + r() * 0.3);
      m.scale.set(sx, sy, sz); m.position.set(Wm / 2, sy * 0.45, Dm / 2); m.rotation.y = r() * 6; m.castShadow = m.receiveShadow = true; g.add(m);
      const nSmall = p.w === 1 ? 2 : 4;
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
    } else if (p.kind === 'relic') {
      // pedra rúnica dos caminhantes: monólito alto, runas azuis brilhantes, pedras ao redor, luz fria
      const stoneM = std(0x9a9aa8, { map: stoneTex(0x8a8a98) });
      const mono = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.62, 2.6, 7), stoneM); mono.position.set(Wm / 2, 1.3, Dm / 2); mono.rotation.y = 0.4; mono.castShadow = mono.receiveShadow = true; g.add(mono);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.44, 0.5, 7), stoneM); cap.position.set(Wm / 2, 2.85, Dm / 2); cap.rotation.y = 0.4; g.add(cap);
      /* runas de Karmika em volta da pedra inteira (antes ficavam só de um lado, virado para longe da câmera) */
      const runeC = document.createElement('canvas'); runeC.width = 256; runeC.height = 128; const rg = runeC.getContext('2d')!; rg.strokeStyle = '#bfe6ff'; rg.fillStyle = '#bfe6ff'; rg.lineWidth = 2.2; rg.lineJoin = rg.lineCap = 'round'; rg.shadowColor = '#4a9aff'; rg.shadowBlur = 5;
      for (let col = 0; col < 7; col++) for (let row = 0; row < 3; row++) { const ru = RUNAS[(col * 3 + row + Math.floor(r() * 16)) % RUNAS.length]; rg.save(); rg.translate(col * (256 / 7) + 4, 8 + row * 40); rg.scale(1.0, 1.15); rg.stroke(new Path2D(ru.d)); if (ru.fill) rg.fill(new Path2D(ru.fill)); rg.restore(); }
      const runeT = new THREE.CanvasTexture(runeC); runeT.magFilter = runeT.minFilter = THREE.NearestFilter;
      const runes = new THREE.Mesh(new THREE.CylinderGeometry(0.47, 0.66, 2.4, 7, 1, true), new THREE.MeshBasicMaterial({ map: runeT, transparent: true, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending })); runes.userData.dyn = true; runes.position.set(Wm / 2, 1.3, Dm / 2); runes.rotation.y = 0.4; runes.userData.dyn = true; g.add(runes);
      const ring = new THREE.Mesh(new THREE.RingGeometry(1.0, 1.45, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x6ab4ff, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false })); ring.userData.dyn = true; ring.position.set(Wm / 2, 0.08, Dm / 2); ring.userData.dyn = true; g.add(ring);
      for (let k = 0; k < 5; k++) { const a = k * 1.26 + 0.3; const st = new THREE.Mesh(new THREE.DodecahedronGeometry(0.16 + (k % 2) * 0.08, 0), std(0x5e5d5b)); st.position.set(Wm / 2 + Math.cos(a) * 1.1, 0.12, Dm / 2 + Math.sin(a) * 1.1); st.rotation.y = a; g.add(st); }
      g.scale.setScalar(1.45); g.position.x -= Wm * 0.225; g.position.z -= Dm * 0.225; // maior, para não passar despercebida
      (L.relics ??= []).push({ gx: p.gx, gy: p.gy, runes, ring, pos: new THREE.Vector3(p.gx * T + Wm / 2, wy + 1.6, p.gy * T + Dm / 2), seed: r() * 50 });
      L.glows.push({ light: nullLight, base: 34, seed: r() * 50, warm: false, pos: new THREE.Vector3(p.gx * T + Wm / 2, wy + 1.6, p.gy * T + Dm / 2), color: 0x4a9aff } as WorldObjs['glowLights'][number]);
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
    g.userData.kind = 'prop:' + p.kind;
    if (p.kind !== 'torch' && p.kind !== 'campfire' && p.kind !== 'tree') mergeStatic(g); // casas, templos, bancos, baús…: um draw call por material
    return g;
  }

  const STATIC_KINDS = new Set(['monument', 'quay', 'landmark', 'palisade', 'totem', 'rwall', 'rtower', 'gatehouse', 'wstair', 'castle', 'station', 'vault', 'shopfront', 'herb', 'angel', 'obelisk', 'saint', 'mausoleum', 'gfence', 'gpillar', 'ggate', 'deadtree', 'corpse', 'deadcrop', 'deadwell', 'altar', 'tar', 'cwall', 'tower', 'ifence', 'coffin', 'house', 'temple', 'church', 'ruin', 'rock', 'grave', 'bones', 'bench', 'noticeboard', 'mailbox', 'tent', 'stall', 'torch', 'campfire', 'relic', 'bfloor', 'bwall', 'bfence', 'broof', 'bdoor']);
  const loaded = new Map<number, Loaded>();
  const propG = new Map<Prop, { g: THREE.Group; L: Loaded }>();
  const dynL: Loaded = { terrain: null as unknown as ChunkTerrain, group: new THREE.Group(), torches: [], glows: [], trees: [], smokers: [], own: [] }; group.add(dynL.group);
  function rebuildLists() {
    torchesA.length = 0; glowA.length = 0; treesA.length = 0; smokersA.length = 0;
    relicsA.length = 0;
    for (const L of [...loaded.values(), dynL]) { torchesA.push(...L.torches); glowA.push(...L.glows); treesA.push(...L.trees); smokersA.push(...L.smokers); if (L.relics) relicsA.push(...L.relics); }
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
    for (const p of [...(byChunk.get(k) ?? []), ...extra]) { if ((p as Prop & { gone?: boolean }).gone) continue; try { const pg = buildProp(p, L); try { registerSteps(pg, p); } catch { /* */ } if (p.kind === 'tree') L.treeG.push(pg); else if (STATIC_KINDS.has(p.kind)) L.staticG.push(pg); else L.group.add(pg); propG.set(p, { g: pg, L }); } catch (e) { console.error('prop', p.kind, e); } }
    L.trees.length = 0; mergeTrees(L); mergeChunkProps(L);
    /* congela as matrizes do que não se mexe: com ~30 mil objetos no mundo, recalcular todas a cada quadro custava ~20 ms */
    L.group.updateMatrixWorld(true);
    L.group.traverse((o) => { if (o.userData.dyn || o.userData.sway) return; o.matrixAutoUpdate = false; });
    for (const tc of L.torches) tc.flame.traverse((o) => { o.matrixAutoUpdate = true; });
    for (const rl of L.relics ?? []) { rl.ring.matrixAutoUpdate = true; rl.runes.matrixAutoUpdate = true; }
    L.group.traverse((o) => { if (o.userData.dyn || o.userData.sway) o.traverse((c) => { c.matrixAutoUpdate = true; }); });
    group.add(L.group); loaded.set(k, L); rebuildLists();
  }
  function unloadChunk(k: number) {
    const L = loaded.get(k)!; group.remove(L.group); L.terrain.dispose(); for (const g of L.own) g.dispose(); loaded.delete(k); rebuildLists();
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
  const signTex = (text: string) => { const c = document.createElement('canvas'); c.width = 256; c.height = 64; const g = c.getContext('2d')!; g.fillStyle = '#8a6a3c'; g.fillRect(0, 0, 256, 64); for (let i = 0; i < 6; i++) { g.fillStyle = `rgba(60,40,20,${0.25 + (i % 2) * 0.2})`; g.fillRect(0, i * 11, 256, 2); } g.fillStyle = '#1a100a'; g.font = 'bold 30px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text.length > 16 ? text.slice(0, 15) + '…' : text, 128, 34); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = t.minFilter = THREE.NearestFilter; return t; };
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
        const m = o as THREE.Mesh; if (!m.isMesh || skip.has(m) || Array.isArray(m.material) || !m.geometry.attributes.position || !m.visible) return;
        const mat = m.material as THREE.MeshToonMaterial; if (mat.transparent || (mat as THREE.Material & { isSprite?: boolean }).isSprite) return;
        const toon = (mat as THREE.Material & { isMeshToonMaterial?: boolean }).isMeshToonMaterial === true;
        const key = toon ? `t|${mat.map ? mat.map.uuid : ''}|${mat.side}|${mat.emissive ? mat.emissive.getHex() : 0}|${m.castShadow ? 1 : 0}` : `i|${mat.uuid}|${m.castShadow ? 1 : 0}`;
        let b = buckets!.get(key);
        if (!b) { b = { mat: toon ? new THREE.MeshToonMaterial({ color: 0xffffff, vertexColors: true, map: mat.map ?? null, gradientMap: ramp, side: mat.side, emissive: mat.emissive ? mat.emissive.clone() : undefined }) : mat, geos: [], shadow: m.castShadow, vc: toon }; buckets!.set(key, b); }
        const gg = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
        for (const n of Object.keys(gg.attributes)) if (n !== 'position' && n !== 'normal' && n !== 'uv' && n !== 'color') gg.deleteAttribute(n);
        if (!gg.attributes.normal) gg.computeVertexNormals();
        if (!gg.attributes.uv) { gg.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(gg.attributes.position.count * 2), 2)); }
        if (toon) { if (!(mat.vertexColors && gg.attributes.color)) { const n = gg.attributes.position.count, cols = new Float32Array(n * 3); col.copy(mat.color); for (let i = 0; i < n; i++) { cols[i * 3] = col.r; cols[i * 3 + 1] = col.g; cols[i * 3 + 2] = col.b; } gg.setAttribute('color', new THREE.BufferAttribute(cols, 3)); } else if (!mat.color.equals(new THREE.Color(0xffffff))) { const c = gg.attributes.color; for (let i = 0; i < c.count; i++) c.setXYZ(i, c.getX(i) * mat.color.r, c.getY(i) * mat.color.g, c.getZ(i) * mat.color.b); } }
        else if (gg.attributes.color) gg.deleteAttribute('color');
        gg.applyMatrix4(tmpM.multiplyMatrices(inv, m.matrixWorld)); b.geos.push(gg); taken.push(m);
      });
      for (const m of taken) m.parent?.remove(m);
      let left = false; pg.traverse((o) => { if ((o as THREE.Mesh).isMesh) left = true; }); if (!left) L.group.remove(pg);
    }
    for (const buckets of cells.values()) for (const b of buckets.values()) {
      const merged = mergeGeometries(b.geos, false); for (const gg of b.geos) gg.dispose(); if (!merged) continue;
      merged.computeBoundingSphere(); const mesh = new THREE.Mesh(merged, b.mat); mesh.castShadow = b.shadow; mesh.receiveShadow = true; L.group.add(mesh); L.staticMerged!.push(mesh);
    }
  }
  function removeProp(p: Prop) {
    (p as Prop & { gone?: boolean }).gone = true; const e = propG.get(p); if (!e) return;
    if (p.kind === 'tree' && e.L.treeG) { e.L.treeG = e.L.treeG.filter((g) => g !== e.g); propG.delete(p); mergeTrees(e.L); rebuildLists(); return; }
    if (e.L.staticG && e.L.staticG.includes(e.g)) { e.L.staticG = e.L.staticG.filter((g) => g !== e.g); e.L.trees = e.L.trees.filter((t) => { let o: THREE.Object3D | null = t.obj; while (o) { if (o === e.g) return false; o = o.parent; } return true; }); propG.delete(p); mergeChunkProps(e.L); rebuildLists(); return; }
    e.L.group.remove(e.g); e.L.trees = e.L.trees.filter((t) => { let o: THREE.Object3D | null = t.obj; while (o) { if (o === e.g) return false; o = o.parent; } return true; }); propG.delete(p); rebuildLists();
  }
  function addProp(p: Prop) { world.props.push(p); const pg = buildProp(p, dynL); dynL.group.add(pg); propG.set(p, { g: pg, L: dynL }); rebuildLists(); }
  const fountainPos = () => { for (const L of loaded.values()) if (L.fountain) return L.fountain; return null; };
  return { setRad(n: number) { if (n !== RAD) { RAD = n; lastCx = -9999; } }, fountainPos, removeProp, addProp, group, torches: torchesA, glowLights: glowA, windows, trees: treesA, smokers: smokersA, relics: relicsA, update, bridgeMeshes };
}
