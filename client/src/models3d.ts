import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as skClone } from 'three/examples/jsm/utils/SkeletonUtils.js';

const loader = new GLTFLoader();
const cache = new Map<string, Promise<THREE.Group>>();

/** carrega um .glb de /models (cache); devolve um clone novo com esqueleto próprio */
export async function loadModel(path: string): Promise<THREE.Group> {
  let p = cache.get(path);
  if (!p) { p = loader.loadAsync(path).then((g) => g.scene); cache.set(path, p); }
  const src = await p;
  const c = skClone(src) as THREE.Group;
  c.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) { m.castShadow = true; m.receiveShadow = false; m.frustumCulled = false; } });
  return c;
}

export type Pose = Partial<Record<string, THREE.Vector3 | [number, number, number]>>;

/**
 * Animação por código de um esqueleto humanoide (padrão pelvis/spine/upperarm_l...). Modelos em T-pose, sem clipes.
 * Rotações são dadas em espaço do modelo (x = lado, y = cima, z = frente), então não dependem dos eixos locais dos ossos.
 */
export class Puppet {
  readonly root: THREE.Object3D;
  private order: THREE.Bone[] = [];
  private restLocal = new Map<THREE.Bone, THREE.Quaternion>();
  private cur = new Map<THREE.Bone, THREE.Quaternion>();
  private delta = new Map<string, THREE.Quaternion>();
  readonly by = new Map<string, THREE.Bone>();
  private tq = new THREE.Quaternion(); private te = new THREE.Euler();
  hips?: THREE.Bone; hipsRest = new THREE.Vector3();
  constructor(root: THREE.Object3D) {
    this.root = root;
    root.updateWorldMatrix(true, true);
    root.traverse((o) => { if ((o as THREE.Bone).isBone) { const b = o as THREE.Bone; this.order.push(b); this.by.set(b.name, b); this.restLocal.set(b, b.quaternion.clone()); } });
    this.hips = this.by.get('pelvis'); if (this.hips) this.hipsRest.copy(this.hips.position);
  }
  /** define a rotação (euler XYZ em radianos, espaço do modelo) de um osso para o quadro atual */
  set(name: string, x: number, y = 0, z = 0) { this.delta.set(name, new THREE.Quaternion().setFromEuler(this.te.set(x, y, z, 'YXZ'))); }
  clear() { this.delta.clear(); }
  /** aplica as rotações acumuladas (pai → filho) */
  apply() {
    const id = new THREE.Quaternion();
    for (const b of this.order) {
      const parent = b.parent as THREE.Bone;
      const pq = (parent && (parent as THREE.Bone).isBone ? this.cur.get(parent) : undefined) ?? id;
      const rl = this.restLocal.get(b)!;
      const d = this.delta.get(b.name);
      const world = this.tq.copy(pq).multiply(rl); // espaço do modelo, sem delta próprio
      const curQ = d ? d.clone().multiply(world) : world.clone();
      this.cur.set(b, curQ);
      b.quaternion.copy(pq).invert().multiply(curQ);
    }
  }
}
