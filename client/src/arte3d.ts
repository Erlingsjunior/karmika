/* 03/11: modelos de cenário do Herik (public/models/cenario, preparados por scripts/cenario-herik.mjs).
   Cada modelo é uma malha só; a textura vem à parte e é compartilhada por todos os modelos da mesma folha (21 texturas para 146 modelos).
   - `artReady(ids)`: carrega (uma vez) e avisa quando estiver pronto.
   - `artGeo(id)`: a geometria já carregada (ou null), com a altura real em `userData.h`.
   - `artMat(id, o)`: material toon do jogo com a textura compartilhada (corte de visão; vento opcional para a vegetação).
   - `ArtBatch`: junta todas as cópias de um modelo num InstancedMesh por chunk — mil árvores iguais = 1 desenho. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ramp, cutoutify } from './toon3d';
import { windify } from './terrain3d';

export interface ArtEntry { id: string; pasta: string; glb: string; tex: string | null; tris: number; size: [number, number, number] }
const BASE = '/models/cenario/';
let manifest: Map<string, ArtEntry> | null = null, manP: Promise<Map<string, ArtEntry>> | null = null;
const geos = new Map<string, THREE.BufferGeometry>(), geoP = new Map<string, Promise<THREE.BufferGeometry | null>>();
const texs = new Map<string, THREE.Texture>(), mats = new Map<string, THREE.Material>();
const loader = new GLTFLoader(), tl = new THREE.TextureLoader();

export function artManifest(): Promise<Map<string, ArtEntry>> {
  return (manP ??= fetch(BASE + 'cenario.json').then((r) => (r.ok ? r.json() : [])).then((l: ArtEntry[]) => (manifest = new Map(l.map((e) => [e.id, e])))).catch(() => (manifest = new Map())));
}
export const artList = (pasta: string): ArtEntry[] => (manifest ? [...manifest.values()].filter((e) => e.pasta === pasta) : []);
export const artHas = (id: string) => geos.has(id);
export const artGeo = (id: string) => geos.get(id) ?? null;

function loadGeo(id: string): Promise<THREE.BufferGeometry | null> {
  let p = geoP.get(id); if (p) return p;
  p = artManifest().then((M) => { const e = M.get(id); if (!e) return null;
    return loader.loadAsync(BASE + e.glb).then((g) => { let geo: THREE.BufferGeometry | null = null; g.scene.updateMatrixWorld(true);
      g.scene.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh && !geo) { geo = m.geometry.clone(); geo.applyMatrix4(m.matrixWorld); } });
      if (!geo) return null; const G = geo as THREE.BufferGeometry; for (const n of Object.keys(G.attributes)) if (n !== 'position' && n !== 'normal' && n !== 'uv') G.deleteAttribute(n);
      if (!G.attributes.normal) G.computeVertexNormals(); G.computeBoundingBox(); G.computeBoundingSphere();
      G.userData.h = G.boundingBox!.max.y; G.userData.r = Math.max(G.boundingBox!.max.x, -G.boundingBox!.min.x, G.boundingBox!.max.z, -G.boundingBox!.min.z); G.userData.shared = true;
      geos.set(id, G); return G; }); }).catch(() => null);
  geoP.set(id, p); return p;
}
/** carrega vários modelos; resolve quando todos (os que existem) estiverem prontos */
export function artReady(ids: string[]): Promise<void> { return Promise.all(ids.map((i) => loadGeo(i).then(() => texReady(i)))).then(() => undefined); }
export function artReadyPasta(pasta: string): Promise<string[]> { return artManifest().then(() => { const ids = artList(pasta).map((e) => e.id); return artReady(ids).then(() => ids.filter((i) => geos.has(i))); }); }

const texP = new Map<string, Promise<void>>();
function texFor(name: string | null): THREE.Texture | null {
  if (!name) return null; let t = texs.get(name);
  if (!t) { const tt = new THREE.Texture(); tt.colorSpace = THREE.SRGBColorSpace; tt.flipY = false; tt.anisotropy = 4; texs.set(name, tt); t = tt;
    texP.set(name, new Promise((res) => { tl.load(BASE + 'tex/' + name, (img) => { tt.image = img.image; tt.needsUpdate = true; res(); }, undefined, () => res()); })); }
  return t;
}
/** espera a textura do modelo (senão a 1ª imagem sai preta) */
const texReady = (id: string) => { const e = manifest?.get(id); if (!e?.tex) return Promise.resolve(); texFor(e.tex); return texP.get(e.tex) ?? Promise.resolve(); };
/** material do modelo: toon do jogo + textura compartilhada + corte de visão; `wind` = balanço (amp) para árvores e plantas */
export function artMat(id: string, o: { wind?: number; tint?: number; side?: THREE.Side } = {}): THREE.Material {
  const e = manifest?.get(id); const key = `${e?.tex ?? id}|${o.wind ?? 0}|${o.tint ?? 0xffffff}|${o.side ?? 0}`; let m = mats.get(key); if (m) return m;
  const mt = new THREE.MeshToonMaterial({ color: o.tint ?? 0xffffff, map: texFor(e?.tex ?? null), gradientMap: ramp, side: o.side ?? THREE.FrontSide });
  m = o.wind ? cutoutify(windify(mt, o.wind, 1.4)) : cutoutify(mt); m.userData.shared = true; mats.set(key, m); return m;
}
/** uma malha solta (para peças únicas: fonte, pedra de teleporte, carroça) */
export function artMesh(id: string, o: { wind?: number; tint?: number } = {}): THREE.Mesh | null {
  const g = geos.get(id); if (!g) return null; const m = new THREE.Mesh(g, artMat(id, o)); m.castShadow = true; m.receiveShadow = true; m.userData.shared = true; return m;
}

/** cópias de modelos num chunk: add() várias vezes, build() cria um InstancedMesh por modelo */
export class ArtBatch {
  private items = new Map<string, { m: THREE.Matrix4[]; o: { wind?: number; tint?: number; shadow?: boolean } }>();
  readonly meshes: THREE.InstancedMesh[] = [];
  add(id: string, pos: THREE.Vector3, rotY: number, scale: number | THREE.Vector3, o: { wind?: number; tint?: number; shadow?: boolean } = {}) {
    const k = `${id}|${o.wind ?? 0}|${o.tint ?? 0xffffff}`; let it = this.items.get(k); if (!it) { it = { m: [], o }; this.items.set(k, it); }
    const s = typeof scale === 'number' ? new THREE.Vector3(scale, scale, scale) : scale;
    it.m.push(new THREE.Matrix4().compose(pos, new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotY), s));
  }
  addMatrix(id: string, m: THREE.Matrix4, o: { wind?: number; tint?: number; shadow?: boolean } = {}) {
    const k = `${id}|${o.wind ?? 0}|${o.tint ?? 0xffffff}`; let it = this.items.get(k); if (!it) { it = { m: [], o }; this.items.set(k, it); } it.m.push(m.clone());
  }
  get size() { let n = 0; for (const it of this.items.values()) n += it.m.length; return n; }
  build(parent: THREE.Object3D) {
    this.dispose(parent);
    for (const [k, it] of this.items) { const id = k.split('|')[0], g = geos.get(id); if (!g || !it.m.length) continue;
      const im = new THREE.InstancedMesh(g, artMat(id, it.o), it.m.length); it.m.forEach((m, i) => im.setMatrixAt(i, m)); im.instanceMatrix.needsUpdate = true;
      im.computeBoundingSphere(); im.castShadow = it.o.shadow ?? true; im.receiveShadow = true; im.userData.shared = true; im.userData.art = id; im.matrixAutoUpdate = false; im.updateMatrix(); parent.add(im); this.meshes.push(im); }
  }
  clear() { this.items.clear(); }
  dispose(parent: THREE.Object3D) { for (const m of this.meshes) { parent.remove(m); m.dispose(); } this.meshes.length = 0; }
}

/* ---------- marcadores: o prop diz "aqui vai o modelo X" (um Object3D vazio) e o chunk junta todos num ArtBatch ---------- */
export function artMarker(id: string, o: { wind?: number; tint?: number; shadow?: boolean } = {}): THREE.Object3D | null {
  if (!geos.has(id)) return null; const m = new THREE.Object3D(); m.userData.art = { id, ...o }; return m;
}
/** junta os marcadores de um prop no batch (matriz relativa a `root`) e devolve quantos achou */
export function collectMarkers(pg: THREE.Object3D, root: THREE.Object3D, batch: ArtBatch): number {
  let n = 0; root.updateMatrixWorld(true); pg.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(root.matrixWorld).invert(), M = new THREE.Matrix4();
  pg.traverse((o) => { const a = o.userData.art as { id: string; wind?: number; tint?: number; shadow?: boolean } | undefined; if (!a) return; batch.addMatrix(a.id, M.multiplyMatrices(inv, o.matrixWorld), a); n++; });
  return n;
}
/** fora dos chunks (props postos depois): o marcador vira uma malha comum */
export function realizeMarkers(pg: THREE.Object3D) {
  const L: THREE.Object3D[] = []; pg.traverse((o) => { if (o.userData.art) L.push(o); });
  for (const o of L) { const a = o.userData.art as { id: string; wind?: number; tint?: number }; const m = artMesh(a.id, a); if (m) o.add(m); delete o.userData.art; }
}
/* ---------- o que cada prop do mundo usa (os desenhos procedurais foram feitos em cima das mesmas pranchas do Herik) ---------- */
export const TREE_ART: Record<string, string> = { oak: 'arvore_01', pineRed: 'arvore_02', birchWhite: 'arvore_03', willowIce: 'arvore_04', ancient: 'arvore_05', birchYellow: 'arvore_06', burnt: 'arvore_07', fir: 'arvore_08',
  twisted: 'arvore_09', cypress: 'arvore_10', acacia: 'arvore_11', larch: 'arvore_12', baobab: 'arvore_13', blackRed: 'arvore_14', palm: 'arvore_15', whiteSnow: 'arvore_16' };
export const PLANT_ART: Record<string, string[]> = { raspberry: ['planta_01', 'planta_06'], blueBush: ['planta_02'], fern: ['planta_03'], tallGrass: ['planta_04'], wildflowers: ['planta_07', 'planta_05'], mushroomsRed: ['planta_08'],
  cattail: ['planta_09'], agave: ['planta_10'], mossRock: ['planta_11'], blueberry: ['planta_12'], foxglove: ['planta_13'], thistle: ['planta_14'], rose: ['planta_15'], ivyStump: ['planta_16'], mushroomsBrown: ['planta_17'],
  rhubarb: ['planta_18'], lavender: ['planta_19'], lilypad: ['planta_20'], bamboo: ['planta_21'], cactus: ['planta_22'], pitcher: ['planta_23'], dryShrub: ['planta_24'] };
export const ROCK_ART: Record<string, string> = { mossy: 'rocha_01', slab: 'rocha_02', menhir: 'rocha_03', pebbles: 'rocha_04', mossball: 'rocha_05', peak: 'rocha_06', obsidian: 'rocha_07', sandstone: 'rocha_08',
  copper: 'rocha_09', ice: 'rocha_10', darkSmooth: 'rocha_11', volcanic: 'rocha_12' };
/** props de vila (prancha 59): variante → modelo (3 = banco de toras fica no desenho do jogo) */
export const VPROP_ART: Record<number, string> = { 0: 'vila_barril', 1: 'vila_caixas', 2: 'vila_poco', 4: 'vila_poste_lampiao', 5: 'vila_placa', 6: 'vila_feno', 7: 'vila_carrinho', 8: 'vila_tronco', 9: 'vila_bigorna' };
/** carrega o que o mapa usa antes do primeiro chunk (vegetação, pedras, vila, forja, porto, biblioteca, fonte, carroças, armas) */
export function artPreload(): Promise<void> {
  return artManifest().then((M) => artReady([...M.values()].filter((e) => !/^construcoes\/(casas|muralha|casa_modular)/.test(e.pasta)).map((e) => e.id))).catch(() => undefined);
}
