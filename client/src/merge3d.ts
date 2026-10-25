import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * Funde, dentro de cada Group, as malhas filhas estáticas com MeshToonMaterial (sem textura) em UMA malha
 * com cor por vértice. Um personagem passa de ~200 draw calls para ~25 (um por osso), sem perder animação,
 * porque os ossos continuam sendo Groups. Malhas marcadas com userData.keep, com textura, transparentes,
 * de material múltiplo ou com geometria animada (userData.dyn) ficam como estão.
 * Devolve os materiais criados (para quem precisa piscar emissivo, ex.: inimigos).
 */
export function mergeStatic(root: THREE.Object3D, gradientMap: THREE.Texture | null = null): THREE.MeshToonMaterial[] {
  const made: THREE.MeshToonMaterial[] = [];
  const groups: THREE.Object3D[] = [];
  root.traverse((o) => { if (!(o as THREE.Mesh).isMesh && !(o as THREE.Sprite).isSprite) groups.push(o); });
  const col = new THREE.Color();
  for (const g of groups) {
    const buckets = new Map<string, { mats: THREE.MeshToonMaterial; geos: THREE.BufferGeometry[]; meshes: THREE.Mesh[] }>();
    for (const c of [...g.children]) {
      const m = c as THREE.Mesh;
      if (!m.isMesh || m.children.length > 0 || m.userData.keep || m.userData.dyn) continue;
      const mat = m.material as THREE.MeshToonMaterial;
      const basic = !!(mat as THREE.Material & { isMeshBasicMaterial?: boolean }).isMeshBasicMaterial && !mat.map && !mat.transparent;
      if (Array.isArray(m.material) || !mat || (!(mat as THREE.Material & { isMeshToonMaterial?: boolean }).isMeshToonMaterial && !basic) || mat.transparent) continue;
      const geo = m.geometry; if (!geo.attributes.position || !geo.attributes.normal) continue;
      const textured = !!mat.map; if (textured && !geo.attributes.uv) continue;
      const key = textured ? `tex:${mat.uuid}|${m.castShadow ? 1 : 0}` : `${basic ? 'b' : 't'}${mat.side}|${mat.emissive ? mat.emissive.getHex() : 0}|${m.castShadow ? 1 : 0}`;
      let b = buckets.get(key);
      if (!b) { const nm = textured ? mat : basic ? (new THREE.MeshBasicMaterial({ color: 0xffffff, vertexColors: true, side: mat.side }) as unknown as THREE.MeshToonMaterial) : new THREE.MeshToonMaterial({ color: 0xffffff, vertexColors: true, gradientMap: mat.gradientMap ?? gradientMap, side: mat.side, emissive: mat.emissive ? mat.emissive.clone() : undefined }); b = { mats: nm, geos: [], meshes: [] }; buckets.set(key, b); }
      m.updateMatrix();
      const gg = geo.index ? geo.toNonIndexed() : geo.clone();
      const ownCol = !textured && mat.vertexColors && !!gg.attributes.color; // cores por vértice (rochas com musgo, etc.) são preservadas
      for (const name of Object.keys(gg.attributes)) if (name !== 'position' && name !== 'normal' && !(textured && name === 'uv') && !(ownCol && name === 'color')) gg.deleteAttribute(name);
      gg.applyMatrix4(m.matrix);
      if (ownCol) { const c = gg.attributes.color; if (c.itemSize !== 3) continue; for (let i = 0; i < c.count; i++) c.setXYZ(i, c.getX(i) * mat.color.r, c.getY(i) * mat.color.g, c.getZ(i) * mat.color.b); }
      else if (!textured) { const n = gg.attributes.position.count, cols = new Float32Array(n * 3); col.copy(mat.color); for (let i = 0; i < n; i++) { cols[i * 3] = col.r; cols[i * 3 + 1] = col.g; cols[i * 3 + 2] = col.b; } gg.setAttribute('color', new THREE.BufferAttribute(cols, 3)); }
      b.geos.push(gg); b.meshes.push(m);
    }
    for (const b of buckets.values()) {
      if (b.geos.length < 2) { for (const gg of b.geos) gg.dispose(); continue; }
      const merged = mergeGeometries(b.geos, false); for (const gg of b.geos) gg.dispose();
      if (!merged) continue;
      const mesh = new THREE.Mesh(merged, b.mats); mesh.castShadow = b.meshes[0].castShadow; mesh.receiveShadow = b.meshes[0].receiveShadow;
      for (const m of b.meshes) g.remove(m);
      g.add(mesh); if ((b.mats as THREE.MeshToonMaterial).vertexColors && (b.mats as THREE.Material & { isMeshToonMaterial?: boolean }).isMeshToonMaterial) made.push(b.mats);
    }
  }
  return made;
}
