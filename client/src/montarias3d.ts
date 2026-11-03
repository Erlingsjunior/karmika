/* 03/11: cavalos do Herik (public/models/montarias/cavalos). Vêm sem animação: o andar é o mesmo do cavalo desenhado (werewolf3d.buildHorse),
   aplicado nos ossos do esqueleto Mixamo de 31 ossos (Arm/ForeArm/Hand/HandMiddle1 = pata da frente; UpLeg/Leg/Foot/ToeBase = pata de trás).
   Cada osso gira em volta do eixo lateral do cavalo (o X do modelo), passando pela junta — assim o mesmo ângulo do desenho serve. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { ramp } from './toon3d';

export const HORSE_ART = ['cavalo_orm', 'cavalo_jarlsheim', 'cavalo_porto_caldeira', 'corcel_askavik', 'pesadelo_conde',
  /* 03/11: as montarias de casco (cervo, carneiro, javali) e de garras (lobo da lua, tigre-dentes-de-sabre) do Herik — mesmos nomes de ossos */
  'cervo_lithendel', 'carneiro_brasaforja', 'javali_ulfheim', 'lobo_lua', 'tigre_sabre'] as const;
/** a pasta de cada modelo (public/models/montarias/…) */
const FOLDER: Record<string, string> = { cervo_lithendel: 'casco', carneiro_brasaforja: 'casco', javali_ulfheim: 'casco', lobo_lua: 'garras', tigre_sabre: 'garras' };
/** cavalo (a sela na altura de 1,55 m) ou bicho de tamanho natural (1 unidade = 1 m, sela no lombo) */
export const isHorseArt = (id: string) => !FOLDER[id];
export type HorseArt = (typeof HORSE_ART)[number];
const tpl = new Map<string, THREE.Group>();
let preP: Promise<void> | null = null;
export function horsesPreload(): Promise<void> {
  return (preP ??= Promise.all(HORSE_ART.map((id) => new GLTFLoader().loadAsync(`/models/montarias/${FOLDER[id] ?? 'cavalos'}/${id}.glb`).then((g) => {
    g.scene.traverse((o) => { const m = o as THREE.SkinnedMesh; if (!m.isMesh) return; const old = m.material as THREE.MeshStandardMaterial; if (old.map) old.map.colorSpace = THREE.SRGBColorSpace;
      m.material = new THREE.MeshToonMaterial({ map: old.map ?? null, gradientMap: ramp }); m.castShadow = true; m.frustumCulled = false; });
    tpl.set(id, g.scene); }).catch(() => undefined))).then(() => undefined));
}
export const horseReady = (id: string) => tpl.has(id);

export interface ArtHorse { root: THREE.Group; body: THREE.Group; neck: THREE.Group; mats: THREE.MeshToonMaterial[]; seat: number; pose(p: { dt: number; mv: number; idle?: boolean }): void }
/** um cavalo pronto para montar (null se o modelo não carregou) */
export function buildArtHorse(id: string, tint?: number): ArtHorse | null {
  const T = tpl.get(id); if (!T) return null;
  const model = SkeletonUtils.clone(T) as THREE.Group; const root = new THREE.Group(); root.add(model);
  const mats: THREE.MeshToonMaterial[] = [];
  model.traverse((o) => { const m = o as THREE.SkinnedMesh; if (!m.isMesh) return; m.userData.keep = true; /* não funde (é malha com esqueleto) */ const mt = (m.material as THREE.MeshToonMaterial).clone(); if (tint !== undefined) mt.color.set(tint).lerp(new THREE.Color(0xffffff), 0.2); m.material = mt; mats.push(mt); });
  const B = (n: string) => model.getObjectByName('mixamorig' + n) as THREE.Bone | undefined;
  model.updateMatrixWorld(true);
  /* eixo lateral do cavalo no espaço de cada osso, guardado na pose de repouso */
  const X = new THREE.Vector3(1, 0, 0), qW = new THREE.Quaternion(), mq = model.getWorldQuaternion(new THREE.Quaternion()).invert();
  type J = { b: THREE.Bone; rest: THREE.Quaternion; ax: THREE.Vector3; ay: THREE.Vector3 };
  const joint = (n: string): J | null => { const b = B(n); if (!b) return null; b.getWorldQuaternion(qW); const inv = mq.clone().multiply(qW).invert(); const ax = X.clone().applyQuaternion(inv), ay = new THREE.Vector3(0, 1, 0).applyQuaternion(inv); return { b, rest: b.quaternion.clone(), ax, ay }; };
  const leg = (s: 'Left' | 'Right', front: boolean) => (front ? ['Arm', 'ForeArm', 'Hand', 'HandMiddle1'] : ['UpLeg', 'Leg', 'Foot', 'ToeBase']).map((n) => joint(s + n));
  /* a mesma ordem do cavalo desenhado: frente-esq., frente-dir., trás-esq., trás-dir. */
  const legs = [{ j: leg('Left', true), front: true }, { j: leg('Right', true), front: true }, { j: leg('Left', false), front: false }, { j: leg('Right', false), front: false }];
  const neckJ = [joint('Neck'), joint('Neck1'), joint('Neck2')], headJ = joint('Head'), tailJ = [joint('Tail'), joint('Tail1'), joint('Tail2')], hipsB = B('Hips'), hips0 = hipsB ? hipsB.position.clone() : null;
  const rot = (j: J | null, a: number) => { if (!j) return; j.b.quaternion.copy(j.rest).multiply(new THREE.Quaternion().setFromAxisAngle(j.ax, a)); };
  /* sela: altura do lombo medida no osso Spine1; o grupo `body` acompanha o sobe-e-desce do quadril */
  const sp = B('Spine1') ?? B('Spine'); const back = sp ? sp.getWorldPosition(new THREE.Vector3()) : new THREE.Vector3(0, 1.3, 0);
  const box = new THREE.Box3().setFromObject(model); let topY = back.y;
  { const pos = new THREE.Vector3(); model.traverse((o) => { const m = o as THREE.SkinnedMesh; if (!m.isMesh) return; const pa = m.geometry.attributes.position; for (let i = 0; i < pa.count; i += 7) { pos.fromBufferAttribute(pa, i); if (Math.abs(pos.z - back.z) < 0.18 && Math.abs(pos.x) < 0.2) topY = Math.max(topY, pos.y); } }); }
  topY = Math.min(topY, box.max.y);
  const body = new THREE.Group(); body.position.set(0, topY - 0.3, back.z - 0.12); root.add(body); const by0 = body.position.y;
  const neck = new THREE.Group(); const nb = B('Neck'); if (nb) { nb.getWorldPosition(neck.position); } root.add(neck);
  const st = { ph: 0, t: 0, mv: 0 };
  function pose(p: { dt: number; mv: number; idle?: boolean }) {
    const dt = Math.min(0.05, p.dt); st.t += dt; st.mv += (p.mv - st.mv) * Math.min(1, dt * 6); const mv = st.mv;
    const spd = Math.min(1, mv / 2.4), gal = Math.max(0, Math.min(1, (mv - 6) / 5)), hz = mv < 0.08 ? 0 : mv < 3 ? 0.75 + mv * 0.06 : mv < 7 ? 1.15 + (mv - 3) * 0.04 : Math.min(1.75, 1.42 + (mv - 7) * 0.035); st.ph += dt * 6.283 * hz;
    const off = [[0, Math.PI, Math.PI, 0], [0, 0.4, Math.PI + 0.3, Math.PI + 0.7]];
    for (let i = 0; i < 4; i++) { const L = legs[i], o = off[0][i] * (1 - gal) + off[1][i] * gal, sw = Math.sin(st.ph + o) * spd, lift = Math.max(0, Math.cos(st.ph + o)) * spd, A = 0.42 + 0.34 * gal + 0.1 * Math.min(1, mv / 6);
      if (L.front) { rot(L.j[0], -sw * A); rot(L.j[1], lift * 1.3); rot(L.j[2], -lift * 0.5); rot(L.j[3], lift * 0.7); }
      else { rot(L.j[0], -sw * A * 0.85); rot(L.j[1], -lift * 0.55); rot(L.j[2], lift * 0.4); rot(L.j[3], lift * 0.5); } }
    const bob = Math.abs(Math.sin(st.ph)) * 0.04 * spd * (1 + gal * 1.5);
    if (hipsB && hips0) { hipsB.position.copy(hips0); hipsB.position.y += bob / Math.max(0.001, model.scale.y * (hipsB.parent?.scale.y ?? 1)); }
    body.position.y = by0 + bob;
    const nk = 0.12 * gal + Math.sin(st.ph * 2) * 0.05 * spd + (p.idle ? Math.sin(st.t * 0.4) * 0.12 : 0);
    for (const j of neckJ) rot(j, nk / 3); rot(headJ, (p.idle ? Math.sin(st.t * 0.9) * 0.05 : 0) - 0.1 * gal);
    tailJ.forEach((j, i) => { if (!j) return; j.b.quaternion.copy(j.rest).multiply(new THREE.Quaternion().setFromAxisAngle(j.ax, i === 0 ? -(0.3 * gal + 0.15 * spd) : 0)).multiply(new THREE.Quaternion().setFromAxisAngle(j.ay, Math.sin(st.t * 1.6 - i * 0.6) * (0.05 + i * 0.04))); });
  }
  return { root, body, neck, mats, seat: topY + 0.03, pose };
}
