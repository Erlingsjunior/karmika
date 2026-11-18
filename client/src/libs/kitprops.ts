/* 10/11 (teste_libs) — peças KayKit (CC0) prontas para montar cenário: barris, kegs, mesas postas, caixotes de comida, estantes, estandartes…
   `kitPut` devolve na hora um grupo vazio já posicionado e enche quando o modelo carrega (o interior abre sem esperar).
   Cada modelo carrega uma vez só; os materiais viram o toon do jogo (mesma luz e contorno de cor do resto). */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { std } from '../toon3d';

const BASE = '/models/kaykit/';
const L = new GLTFLoader();
const cache = new Map<string, Promise<THREE.Object3D | null>>();
const matCache = new Map<THREE.Material, THREE.Material>();
const ready = new Map<string, THREE.Object3D>();
/** a peça já carregou? (miniaturas e vitrines só desenham depois) */
export const kitReady = (path: string) => ready.has(path);

/** `path` sem extensão, a partir de models/kaykit (ex.: 'masmorra/keg', 'taverna/crate_ham'). A masmorra é .glb, o resto .gltf */
export function kitLoad(path: string): Promise<THREE.Object3D | null> {
  let p = cache.get(path);
  if (!p) {
    const url = BASE + path + (path.startsWith('masmorra/') ? '.glb' : '.gltf');
    p = L.loadAsync(url).then((g) => {
      g.scene.traverse((o) => { const m = o as THREE.Mesh; if (!m.isMesh) return; m.castShadow = true; m.receiveShadow = true;
        const src = m.material as THREE.MeshStandardMaterial; let mm = matCache.get(src);
        if (!mm) { mm = src.map ? std(0xffffff, { map: src.map }) : std(src.color?.getHex?.() ?? 0xffffff); mm.userData.shared = true; matCache.set(src, mm); }
        m.material = mm; m.geometry.userData.shared = true; });
      ready.set(path, g.scene); return g.scene; }).catch(() => null);
    cache.set(path, p);
  }
  return p;
}

/** põe a peça em (x, y, z) com giro `ry` e escala `s` dentro de `parent`. A KayKit mede ~1,3× o nosso metro: 0,75 deixa mesa e cadeira na altura certa */
export function kitPut(parent: THREE.Object3D, path: string, x: number, y: number, z: number, ry = 0, s = 0.75): THREE.Group {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; g.scale.setScalar(s); parent.add(g);
  const r0 = ready.get(path); if (r0) g.add(r0.clone()); else void kitLoad(path).then((m) => { if (m) g.add(m.clone()); });
  return g;
}
