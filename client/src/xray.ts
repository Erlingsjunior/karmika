/* Silhueta atrás das casas: quando uma casa, templo ou barraca fica entre a câmera e o herói, o herói aparece como uma silhueta
   azulada por cima de tudo, para nunca perdermos ele de vista. NPCs só ganham silhueta quando o herói está perto (para dar para falar). */
import * as THREE from 'three';

interface Box { min: THREE.Vector3; max: THREE.Vector3 }
interface Ent { root: THREE.Object3D; clones: THREE.Mesh[]; mat: THREE.MeshBasicMaterial; n: number; k: number; t: number }

export function createXray(color = 0x8ab4ff) {
  const ents = new Map<THREE.Object3D, Ent>();
  const ray = new THREE.Ray(), hit = new THREE.Vector3(), tmp = new THREE.Vector3();
  let boxes: Box[] = [];
  /* 26/10 noite (Erling: "cadê o personagem?"): árvores também escondem. Cada árvore vira uma caixa na copa,
     guardada numa grade de 16 m para só olhar as que estão entre a câmera e o herói. */
  const TG = 16, trees = new Map<number, { b: Box; alive: () => boolean }[]>();
  const tkey = (cx: number, cz: number) => (cx + 4096) * 8192 + (cz + 4096);
  function treeBlocked(cam: THREE.Vector3, p: THREE.Vector3) {
    ray.origin.copy(cam); ray.direction.copy(tmp.copy(p).sub(cam)); const len = ray.direction.length(); ray.direction.multiplyScalar(1 / len);
    const x0 = Math.floor(Math.min(cam.x, p.x) / TG), x1 = Math.floor(Math.max(cam.x, p.x) / TG), z0 = Math.floor(Math.min(cam.z, p.z) / TG), z1 = Math.floor(Math.max(cam.z, p.z) / TG);
    for (let cx = x0; cx <= x1; cx++) for (let cz = z0; cz <= z1; cz++) { const L = trees.get(tkey(cx, cz)); if (!L) continue;
      for (const t of L) if (ray.intersectBox(t.b as unknown as THREE.Box3, hit) && hit.distanceTo(cam) < len - 0.6 && t.alive()) return true; }
    return false;
  }
  const meshesOf = (root: THREE.Object3D) => { const out: THREE.Mesh[] = []; root.traverse((o) => { const m = o as THREE.Mesh; if (!m.isMesh || m.userData.xray || !m.visible) return; const mt = m.material as THREE.Material; if (Array.isArray(mt) ? false : (mt.side === THREE.BackSide || mt.transparent)) return; out.push(m); }); return out; };
  function rebuild(e: Ent) {
    for (const c of e.clones) c.parent?.remove(c); e.clones = [];
    const ms = meshesOf(e.root);
    for (const m of ms) {
      let c: THREE.Mesh;
      if ((m as THREE.SkinnedMesh).isSkinnedMesh) { const sm = m as THREE.SkinnedMesh, sc = new THREE.SkinnedMesh(sm.geometry, e.mat); sc.bind(sm.skeleton, sm.bindMatrix); sc.bindMode = sm.bindMode; c = sc; }
      else c = new THREE.Mesh(m.geometry, e.mat);
      c.userData.xray = true; c.renderOrder = 999; c.frustumCulled = false; c.castShadow = false; c.receiveShadow = false; m.add(c); e.clones.push(c);
    }
    e.n = ms.length;
  }
  function blocked(cam: THREE.Vector3, p: THREE.Vector3) {
    ray.origin.copy(cam); ray.direction.copy(tmp.copy(p).sub(cam)); const len = ray.direction.length(); ray.direction.multiplyScalar(1 / len);
    for (const b of boxes) { if (ray.intersectBox(b as unknown as THREE.Box3, hit) && hit.distanceTo(cam) < len - 0.4) return true; }
    return false;
  }
  const box3 = new THREE.Box3();
  return {
    /** os prédios que podem esconder alguém: caixas em metros (chão até o telhado) */
    setBuildings(list: { x0: number; z0: number; x1: number; z1: number; y0: number; y1: number }[]) { boxes = list.map((b) => ({ min: new THREE.Vector3(b.x0, b.y0, b.z0), max: new THREE.Vector3(b.x1, b.y1, b.z1) })); },
    /** as árvores: copa em metros (centro, chão, altura, raio); alive() diz se ainda está de pé (cortada não esconde) */
    setTrees(list: { x: number; z: number; y0: number; h: number; r: number; alive: () => boolean }[]) {
      trees.clear();
      for (const t of list) { const b = { min: new THREE.Vector3(t.x - t.r, t.y0 + t.h * 0.3, t.z - t.r), max: new THREE.Vector3(t.x + t.r, t.y0 + t.h * 1.05, t.z + t.r) };
        const k = tkey(Math.floor(t.x / TG), Math.floor(t.z / TG)); let L = trees.get(k); if (!L) trees.set(k, L = []); L.push({ b, alive: t.alive }); } },
    /** a cada quadro: quem deve ter silhueta agora */
    update(dt: number, cam: THREE.Vector3, who: { root: THREE.Object3D; at: THREE.Vector3; h?: number; want: boolean; trees?: boolean }[]) {
      const seen = new Set<THREE.Object3D>();
      for (const w of who) {
        seen.add(w.root);
        let e = ents.get(w.root);
        if (!e) { e = { root: w.root, clones: [], mat: new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, depthTest: false, depthWrite: false, fog: false, toneMapped: false }), n: -1, k: 0, t: 0 }; ents.set(w.root, e); }
        e.t -= dt;
        if (e.t <= 0) { e.t = 0.12; // testa de vez em quando: peito e cabeça
          const near = boxes.filter((b) => Math.abs((b.min.x + b.max.x) / 2 - w.at.x) < 26 && Math.abs((b.min.z + b.max.z) / 2 - w.at.z) < 26);
          const keep = boxes; boxes = near; const h = w.h ?? 1.8;
          const chest = new THREE.Vector3(w.at.x, w.at.y + h * 0.55, w.at.z), head = new THREE.Vector3(w.at.x, w.at.y + h * 0.95, w.at.z);
          const occ = w.want && ((blocked(cam, chest) && blocked(cam, head)) || (w.trees === true && (treeBlocked(cam, chest) || treeBlocked(cam, head))));
          boxes = keep; (e as Ent & { occ?: boolean }).occ = occ;
          // o equipamento mudou? refaz a silhueta
          if (meshesOf(w.root).length !== e.n) rebuild(e);
        }
        const target = (e as Ent & { occ?: boolean }).occ ? 0.55 : 0;
        e.k += (target - e.k) * Math.min(1, dt * 10); e.mat.opacity = e.k; for (const c of e.clones) c.visible = e.k > 0.02;
      }
      for (const [r, e] of ents) if (!seen.has(r)) { for (const c of e.clones) c.parent?.remove(c); e.mat.dispose(); ents.delete(r); }
      void box3;
    },
  };
}
