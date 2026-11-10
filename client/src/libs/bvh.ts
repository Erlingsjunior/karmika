/* 10/11 three-mesh-bvh (MIT) — Erling: "cliques mais rápidos, colisões: sensacional".
   Cada malha ganha, na PRIMEIRA vez que um raio a testa, uma árvore de caixas (BVH) sobre os seus triângulos; dali em diante o raio desce
   pela árvore em vez de testar triângulo por triângulo. Quem mais ganha: o teste "o herói está atrás de algo?" (10 raios da câmera até
   o herói contra o mundo inteiro), os cliques no chão e nos objetos, e as linhas de visão.
   Malhas que mudam de forma (rastros, água animada, personagens com esqueleto) ficam de fora — o raio nelas segue o caminho normal. */
import * as THREE from 'three';
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';

let on = false;
export function installBvh() {
  if (on || /[?&]nobvh/.test(location.search)) return; on = true; /* ?nobvh: desliga, para comparar */
  THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
  THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
  const base = THREE.Mesh.prototype.raycast;
  THREE.Mesh.prototype.raycast = function (this: THREE.Mesh, rc: THREE.Raycaster, out: THREE.Intersection[]) {
    const g = this.geometry as THREE.BufferGeometry | undefined, pos = g?.getAttribute('position') as THREE.BufferAttribute | undefined;
    if (!g || !pos || (this as THREE.Mesh & { isSkinnedMesh?: boolean }).isSkinnedMesh || g.morphAttributes.position || pos.usage === THREE.DynamicDrawUsage || g.userData.noBvh) return base.call(this, rc, out);
    if (!g.boundsTree) { if (pos.count < 120) return base.call(this, rc, out); try { g.computeBoundsTree(); } catch { g.userData.noBvh = true; return base.call(this, rc, out); } }
    return acceleratedRaycast.call(this, rc, out);
  };
  /* geometria descartada leva a árvore junto */
  const disp = THREE.BufferGeometry.prototype.dispose;
  THREE.BufferGeometry.prototype.dispose = function (this: THREE.BufferGeometry) { if (this.boundsTree) this.disposeBoundsTree(); return disp.call(this); };
}
