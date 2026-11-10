/* 10/11 (teste_libs) — Erling: "aproveitando que é Halloween, podemos adicionar essas abóboras em lugares do mundo: vilas, cemitérios…".
   Na temporada (1º de outubro a 15 de novembro, ou ?halloween), abóboras KayKit (CC0) em volta das praças de toda vila e cidade, e
   abóboras, velas e caveiras com vela nos cemitérios, igrejas, capelas e mausoléus. As lanternas de abóbora brilham sozinhas à noite.
   Tudo em lote (uma InstancedMesh por modelo): centenas de abóboras custam poucas chamadas de desenho. Só enfeite: não bloqueia ninguém. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { TILE_M as T, isWalkable } from '@karmika/shared';
import type { World } from '../world';

export const HALLOWEEN = (() => { try { if (/[?&]halloween/.test(location.search)) return true; } catch { /* */ } const d = new Date(), m = d.getMonth() + 1, day = d.getDate(); return m === 10 || (m === 11 && day <= 15); })();

const DIR = '/models/kaykit/halloween/';
/** modelo → altura no mundo (m) e se brilha (lanterna de abóbora / vela) */
const KINDS: Record<string, { h: number; glow?: number }> = {
  pumpkin_orange: { h: 0.55 }, pumpkin_orange_small: { h: 0.32 }, pumpkin_yellow: { h: 0.5 }, pumpkin_yellow_small: { h: 0.3 },
  pumpkin_orange_jackolantern: { h: 0.6, glow: 0xff8a20 }, pumpkin_yellow_jackolantern: { h: 0.55, glow: 0xffb030 },
  candle_triple: { h: 0.4, glow: 0xffc860 }, skull_candle: { h: 0.35, glow: 0xffb040 },
};
const rnd = (s: number) => { const x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

export async function createHalloween(scene: THREE.Scene, world: World, heightAt: (x: number, z: number) => number) {
  if (!HALLOWEEN) return null;
  const L = new GLTFLoader();
  const models = new Map<string, { geo: THREE.BufferGeometry; mat: THREE.Material; k: number }>();
  await Promise.all(Object.entries(KINDS).map(async ([n, def]) => { try { const g = await L.loadAsync(DIR + n + '.gltf'); g.scene.updateMatrixWorld(true); const geos: THREE.BufferGeometry[] = []; let mat: THREE.Material | null = null;
    g.scene.traverse((o) => { const m = o as THREE.Mesh; if (!m.isMesh) return; const gg = m.geometry.clone(); gg.applyMatrix4(m.matrixWorld); for (const a of Object.keys(gg.attributes)) if (!['position', 'normal', 'uv'].includes(a)) gg.deleteAttribute(a); geos.push(gg); mat ??= m.material as THREE.Material; });
    if (!geos.length || !mat) return; const geo = geos.length > 1 ? mergeGeometries(geos) ?? geos[0] : geos[0]; geo.computeBoundingBox(); const bb = geo.boundingBox!; geo.translate(0, -bb.min.y, 0); const k = def.h / Math.max(0.01, bb.max.y - bb.min.y);
    const src = mat as THREE.MeshStandardMaterial; const nm = new THREE.MeshLambertMaterial({ map: src.map ?? null, color: 0xffffff }); if (def.glow) { nm.emissive = new THREE.Color(def.glow); nm.emissiveIntensity = 0.0; }
    models.set(n, { geo, mat: nm, k }); } catch { /* modelo faltando: segue sem ele */ } }));
  if (!models.size) return null;
  const place = new Map<string, THREE.Matrix4[]>(); const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
  const put = (n: string, tx: number, ty: number, seed: number) => { const mdl = models.get(n); if (!mdl) return; const gx = Math.floor(tx), gy = Math.floor(ty); const tile = world.map[gy]?.[gx]; if (!tile || !isWalkable(tile) || tile === 'water') return;
    const x = tx * T, z = ty * T, y = heightAt(x, z); const s = mdl.k * (0.85 + rnd(seed) * 0.3); q.setFromAxisAngle(up, rnd(seed + 9) * 6.283); m4.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(s, s, s)); (place.get(n) ?? place.set(n, []).get(n)!).push(m4.clone()); };
  const BIG = ['pumpkin_orange', 'pumpkin_yellow', 'pumpkin_orange_jackolantern', 'pumpkin_yellow_jackolantern'], SMALL = ['pumpkin_orange_small', 'pumpkin_yellow_small'];
  /* vilas e cidades: um anel solto em volta da praça, em trios (uma grande, duas pequenas), como quem enfeitou a porta */
  for (const st of world.settlements) { const n = Math.round(4 + st.radius / 5); for (let i = 0; i < n; i++) { const sd = st.x * 7.3 + st.y * 3.1 + i * 11, a = rnd(sd) * 6.283, r = st.radius * (0.3 + rnd(sd + 1) * 0.45), x = st.x + Math.cos(a) * r, y = st.y + Math.sin(a) * r;
    put(BIG[Math.floor(rnd(sd + 2) * BIG.length)], x, y, sd); for (let k = 0; k < 2; k++) put(SMALL[k], x + (rnd(sd + 3 + k) - 0.5) * 1.4, y + (rnd(sd + 5 + k) - 0.5) * 1.4, sd + 7 + k); } }
  /* cemitérios, igrejas, capelas e mausoléus: mais lanternas, velas e caveiras com vela */
  for (const p of world.pois) { if (!/Cemit|Igreja|Capela|Mausol|Cripta|Catedral|Ossu/i.test(p.name)) continue; for (let i = 0; i < 10; i++) { const sd = p.x * 5.7 + p.y * 2.3 + i * 13, a = rnd(sd) * 6.283, r = 2.5 + rnd(sd + 1) * 5, x = p.x + Math.cos(a) * r, y = p.y + Math.sin(a) * r;
    put(i % 3 === 0 ? 'skull_candle' : i % 3 === 1 ? 'candle_triple' : BIG[2 + (i & 1)], x, y, sd); } }
  const group = new THREE.Group(); group.name = 'halloween';
  const glowMats: THREE.MeshLambertMaterial[] = [];
  for (const [n, list] of place) { const mdl = models.get(n)!; const im = new THREE.InstancedMesh(mdl.geo, mdl.mat, list.length); list.forEach((m, i) => im.setMatrixAt(i, m)); im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere(); im.castShadow = false; im.receiveShadow = true; group.add(im); if (KINDS[n].glow) glowMats.push(mdl.mat as THREE.MeshLambertMaterial); }
  scene.add(group); group.updateMatrixWorld(true);
  console.log(`[halloween] ${[...place.values()].reduce((a, l) => a + l.length, 0)} enfeites em ${place.size} modelos`);
  return { group, /** escuridão 0..1: as lanternas de abóbora e as velas acendem à noite */ setNight(n: number) { for (const m of glowMats) m.emissiveIntensity = 0.15 + n * 1.6; } };
}
