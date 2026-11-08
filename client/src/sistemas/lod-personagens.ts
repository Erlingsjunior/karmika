/* 07/11 FPS (Erling: "WebGPU 35-37, tem que ficar em 80-90 no mínimo"): cada personagem (NPC, guarda, caravana, companheiro, outro jogador)
   tem 25 a 65 peças, e cada peça é um desenho na placa de vídeo — 15 pessoas na tela davam ~800 desenhos. De longe ninguém vê fivela, botão,
   dedo ou cordão: a partir de 15 m as peças miúdas somem, e a partir de 28 m as pequenas também. Perto, tudo volta. O herói nunca perde nada. */
import * as THREE from 'three';
type Det = { tiny: THREE.Object3D[]; small: THREE.Object3D[]; lv: number };
const cache = new WeakMap<THREE.Object3D, Det>();
const V = new THREE.Vector3(), S = new THREE.Vector3();
function scan(root: THREE.Object3D): Det { root.updateMatrixWorld(true); const d: Det = { tiny: [], small: [], lv: 0 };
  root.traverse((o) => { const m = o as THREE.Mesh; if (!m.isMesh || !m.geometry || (m as THREE.SkinnedMesh).isSkinnedMesh) return; if (!m.geometry.boundingSphere) m.geometry.computeBoundingSphere(); m.getWorldScale(S);
    const r = m.geometry.boundingSphere!.radius * Math.max(S.x, S.y, S.z); if (r < 0.2) m.castShadow = false; /* a sombra de uma fivela não aparece, mas custa um desenho a mais */ if (r < 0.11) d.tiny.push(m); else if (r < 0.2) d.small.push(m); });
  return d; }
let acc = 0;
export function updateCharLod(scene: THREE.Scene, hero: THREE.Object3D, dt: number) { acc += dt; if (acc < 0.3) return; acc = 0; const hp = hero.position;
  for (const ch of scene.children) { const k = ch.userData?.kind as string | undefined; if (!k || !k.startsWith('char:') || !ch.visible) continue; if (ch === hero) { if (!cache.has(ch)) cache.set(ch, scan(ch)); continue; }
    ch.getWorldPosition(V); const dist = V.distanceTo(hp), want = dist > 28 ? 2 : dist > 15 ? 1 : 0; let d = cache.get(ch); if (!d) { d = scan(ch); cache.set(ch, d); }
    if (d.lv === want || (want < d.lv && ((d.lv === 1 && dist > 13) || (d.lv === 2 && dist > 26)))) continue; /* folga para não piscar na divisa */
    for (const m of d.tiny) m.visible = want < 1; for (const m of d.small) m.visible = want < 2; d.lv = want; } }
