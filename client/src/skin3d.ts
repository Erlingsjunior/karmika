/** Modelo do artista (FBX com esqueleto Mixamo) dirigido pela animação procedural do jogo.
 *  O personagem procedural continua existindo, invisível: ele anda, corre, golpeia, defende e monta;
 *  a cada quadro copiamos a pose dele para os ossos do modelo (retarget por rotação em espaço do personagem).
 *  Espada, escudo, elmo e sombra continuam do procedural, presos às mesmas juntas — por isso ajustamos
 *  os comprimentos dos ossos invisíveis aos do modelo: a mão do modelo fica exatamente onde está a espada. */
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import type { Hero3D } from './characters';
import { fine } from './dual3d';

type Limb = { sh?: THREE.Object3D; el?: THREE.Object3D; wr?: THREE.Object3D; hip?: THREE.Object3D; knee?: THREE.Object3D; ankle?: THREE.Object3D };
interface Rig { gun?(): THREE.Object3D | null; helmHolder?(): THREE.Object3D; bodyHolder?(): THREE.Object3D; procHeadR?: number; procShoulderW?: number; swordHolder(): THREE.Object3D | null; sword(): THREE.Object3D | null; shield(): THREE.Object3D | null; hips: THREE.Object3D; spine: THREE.Object3D; chest: THREE.Object3D; neck: THREE.Object3D; head: THREE.Object3D; armL: Limb; armR: Limb; legL: Limb; legR: Limb; keepRoots(): THREE.Object3D[] }

export interface SkinDef { fbx: string; tex: string; /** cor multiplicada no toon (ajuste fino de tom) */ tint?: number }
const cache = new Map<string, Promise<THREE.Group>>();
function load(def: SkinDef): Promise<THREE.Group> {
  let p = cache.get(def.fbx);
  if (!p) {
    p = new Promise((res, rej) => {
      new FBXLoader().load(def.fbx, (obj) => {
        const tex = new THREE.TextureLoader().load(def.tex); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
        /* armadura com escala (exportação em centímetros): passa a escala para as posições dos ossos e recalcula o bind,
           assim o retarget (que mexe na posição do quadril) trabalha em unidades de verdade */
        obj.updateMatrixWorld(true); { const hips = obj.getObjectByName('mixamorigHips');
          for (let a = hips?.parent; a && a !== obj; a = a.parent) { const sc = a.scale.x; if (Math.abs(sc - 1) < 1e-3) continue;
            a.traverse((b) => { if ((b as THREE.Bone).isBone) b.position.multiplyScalar(sc); }); a.scale.set(1, 1, 1); }
          obj.updateMatrixWorld(true); obj.traverse((o) => { const m = o as THREE.SkinnedMesh; if (m.isSkinnedMesh) m.skeleton.calculateInverses(); }); }
        /* modelos exportados em Z para cima (centímetros, sem aplicar transformações): deita de pé e vira para a frente (+Z) */
        obj.updateMatrixWorld(true); { const P = (n: string) => obj.getObjectByName('mixamorig' + n)?.getWorldPosition(new THREE.Vector3());
          const hp = P('Hips'), hd = P('Head'); if (hp && hd && Math.abs(hd.z - hp.z) > Math.abs(hd.y - hp.y)) { obj.rotation.x += hd.z > hp.z ? -Math.PI / 2 : Math.PI / 2; obj.updateMatrixWorld(true); }
          const ft = P('LeftFoot'), to = P('LeftToeBase'); if (ft && to && to.z < ft.z) { obj.rotation.y += Math.PI; obj.updateMatrixWorld(true); } }
        obj.traverse((o) => { const m = o as THREE.SkinnedMesh; if (!m.isMesh) return;
          if (/humanos/.test(def.fbx)) m.geometry.computeVertexNormals(); /* alguns exports vêm com normais invertidas em pedaços (manchas pretas) */
          m.material = new THREE.MeshLambertMaterial({ map: tex, color: new THREE.Color(def.tint ?? 0xffffff).multiplyScalar(1.18), emissive: 0x140e0c });
          m.castShadow = false; m.receiveShadow = true; m.frustumCulled = false; });
        res(obj);
      }, undefined, rej);
    });
    cache.set(def.fbx, p);
  }
  return p;
}

const rootQ = (o: THREE.Object3D, invRoot: THREE.Quaternion, out = new THREE.Quaternion()) => out.copy(invRoot).multiply(o.getWorldQuaternion(new THREE.Quaternion()));
const rootP = (o: THREE.Object3D, root: THREE.Object3D, out = new THREE.Vector3()) => root.worldToLocal(o.getWorldPosition(out));

/** Troca a malha da heroína pelo modelo do artista. Devolve um `tick()` que precisa rodar depois de hero.update(). */
export async function attachSkin(hero: Hero3D, def: SkinDef): Promise<{ tick(): void; model: THREE.Object3D } | null> {
  const rig = (hero as unknown as { rig?: Rig }).rig; if (!rig) return null;
  let src: THREE.Group; try { src = await load(def); } catch (e) { console.warn('modelo não carregou', e); return null; }
  const model = cloneSkinned(src) as THREE.Group;
  const root = hero.root;
  root.updateMatrixWorld(true);
  const invRootQ = root.getWorldQuaternion(new THREE.Quaternion()).invert();
  const B = (n: string) => model.getObjectByName('mixamorig' + n) as THREE.Bone | undefined;
  // escala: quadril do modelo na mesma altura do quadril procedural
  root.add(model); model.updateMatrixWorld(true);
  const hipsM = B('Hips'); if (!hipsM) { root.remove(model); return null; }
  const ourHipY = rootP(rig.hips, root).y, mixHipY = rootP(hipsM, root).y;
  model.scale.multiplyScalar(ourHipY / Math.max(0.01, mixHipY)); model.updateMatrixWorld(true);
  // lado: Left do Mixamo é o lado +X ou -X? casa pela posição do ombro
  const lArmX = rootP(B('LeftArm')!, root).x, ourLX = rootP(rig.armL.sh!, root).x;
  // O procedural segura a espada no braço armR. Queremos a espada na mão DIREITA do modelo: se o armR do procedural
  // fica do lado do Left do Mixamo, espelhamos a animação inteira (reflexão no plano YZ do personagem).
  const ourRX = rootP(rig.armR.sh!, root).x, mixRX = rootP(B('RightArm')!, root).x;
  const MIRROR = Math.sign(ourRX) !== Math.sign(mixRX);
  const swapK = (window as unknown as { __swap?: number }).__swap ?? 0; // espelhado: o braço armR refletido cai no lado Right do modelo
  const [AL, AR, LL, LR] = MIRROR && swapK ? [rig.armR, rig.armL, rig.legR, rig.legL] : [rig.armL, rig.armR, rig.legL, rig.legR];
  void lArmX; void ourLX;
  const swordSide = 'Right', shieldSide = 'Left';
  const pairs: [string, THREE.Object3D, string | null, THREE.Object3D | null][] = [ // osso, junta nossa, osso filho, junta filha (para alinhar a direção)
    ['Hips', rig.hips, null, null], ['Spine', rig.spine, null, null], ['Spine2', rig.chest, null, null], ['Neck', rig.neck, null, null], ['Head', rig.head, null, null],
    ['LeftArm', AL.sh!, 'LeftForeArm', AL.el!], ['LeftForeArm', AL.el!, 'LeftHand', AL.wr!], ['LeftHand', AL.wr!, 'LeftHandMiddle1', null],
    ['RightArm', AR.sh!, 'RightForeArm', AR.el!], ['RightForeArm', AR.el!, 'RightHand', AR.wr!], ['RightHand', AR.wr!, 'RightHandMiddle1', null],
    ['LeftUpLeg', LL.hip!, 'LeftLeg', LL.knee!], ['LeftLeg', LL.knee!, 'LeftFoot', LL.ankle!], ['LeftFoot', LL.ankle!, null, null],
    ['RightUpLeg', LR.hip!, 'RightLeg', LR.knee!], ['RightLeg', LR.knee!, 'RightFoot', LR.ankle!], ['RightFoot', LR.ankle!, null, null],
  ];
  // comprimentos: a junta filha nossa passa a ficar à mesma distância que o osso filho do modelo (mantém a direção do nosso osso)
  for (const [, j, cn, cj] of pairs) { if (!cn || !cj) continue; const b = B(pairs.find((p) => p[1] === j)![0])!, c = B(cn)!; const dM = rootP(c, root).distanceTo(rootP(b, root)); const dO = rootP(cj, root).distanceTo(rootP(j, root)); if (dO > 1e-4 && cj.position.lengthSq() > 1e-8) cj.position.multiplyScalar(dM / dO); }
  root.updateMatrixWorld(true);
  // pose de repouso de cada par (o procedural ainda pode estar animado: zera rotações das nossas juntas só para a medição)
  const saved = pairs.map(([, j]) => j.quaternion.clone()); const bodySaved = rig.hips.parent!.quaternion.clone();
  for (const [, j] of pairs) j.quaternion.identity(); rig.hips.parent!.quaternion.identity(); root.updateMatrixWorld(true);
  const rest = pairs.map(([bn, j, cn, cj]) => {
    const b = B(bn)!; const qO = rootQ(j, invRootQ), qM = rootQ(b, invRootQ);
    let align = new THREE.Quaternion();
    if (cn) { const c = B(cn); if (c) { const dM = rootP(c, root).sub(rootP(b, root)).normalize(); const dO = cj ? rootP(cj, root).sub(rootP(j, root)).normalize() : new THREE.Vector3(0, -1, 0).applyQuaternion(qO); if (MIRROR) dO.x = -dO.x; align = new THREE.Quaternion().setFromUnitVectors(dM, dO); } }
    return { b, j, qOinv: qO.clone().invert(), base: align.multiply(qM), p0O: rootP(j, root), p0M: rootP(b, root) };
  });
  pairs.forEach(([, j], i) => j.quaternion.copy(saved[i])); rig.hips.parent!.quaternion.copy(bodySaved);
  // esconde a malha procedural, menos o que continua dela (arma, escudo, elmo, sombra, drone)
  const keep = new Set(rig.keepRoots());
  const kept = (o: THREE.Object3D) => { for (let p: THREE.Object3D | null = o; p; p = p.parent) { if (keep.has(p)) return true; if (p === root) return false; } return false; };
  root.traverse((o) => { const m = o as THREE.Mesh; if (!m.isMesh || o === model || model.getObjectById(o.id)) return; if (!kept(m)) m.visible = false; });
  fine(model);
  // dedos fechados: punho na mão da arma e pegada na alça do escudo (curvatura constante sobre o repouso)
  /* dedos fechados PARA DENTRO da palma: a normal da palma é medida na própria malha (perpendicular ao plano
     dedos×largura da mão, do lado de baixo na pose de bind em T/A) e cada falange gira em direção a ela */
  model.updateMatrixWorld(true);
  const curls: [THREE.Bone, THREE.Quaternion][] = [];
  for (const side of ['Left', 'Right']) {
    const hand = B(`${side}Hand`), i1 = B(`${side}HandIndex1`), p1 = B(`${side}HandPinky1`), m1 = B(`${side}HandMiddle1`); if (!hand || !i1 || !p1 || !m1) continue;
    const wp = (o: THREE.Object3D) => o.getWorldPosition(new THREE.Vector3());
    const fd = wp(m1).sub(wp(hand)).normalize(), ac = wp(i1).sub(wp(p1)).normalize();
    const palm = new THREE.Vector3().crossVectors(fd, ac).normalize(); if (palm.y > 0) palm.negate(); // palma para baixo na pose de bind
    const curlBone = (b: THREE.Bone, ang: number, toward: THREE.Vector3) => {
      const ch = b.children.find((c) => (c as THREE.Bone).isBone); const d = ch ? wp(ch).sub(wp(b)) : wp(b).sub(wp(b.parent!)); d.normalize();
      const ax = new THREE.Vector3().crossVectors(d, toward); if (ax.lengthSq() < 1e-6) return; ax.normalize();
      ax.applyQuaternion(b.getWorldQuaternion(new THREE.Quaternion()).invert());
      curls.push([b, new THREE.Quaternion().setFromAxisAngle(ax, ang)]);
    };
    for (const f of ['Index', 'Middle', 'Ring', 'Pinky']) for (let k = 1; k <= 3; k++) { const b = B(`${side}Hand${f}${k}`); if (b) curlBone(b, k === 1 ? 1.25 : k === 2 ? 1.45 : 1.0, palm); }
    // polegar dobra por cima dos dedos (para a palma e em direção ao mindinho)
    const thTo = palm.clone().add(ac.clone().multiplyScalar(-0.8)).normalize();
    for (let k = 1; k <= 3; k++) { const b = B(`${side}HandThumb${k}`); if (b) curlBone(b, k === 1 ? 0.35 : 0.6, thTo); }
  }
  const fingers = curls.map(([b, q]) => ({ b, side: b.name.includes('Left') ? 'Left' : 'Right', q0: b.quaternion.clone(), q1: b.quaternion.clone().multiply(q) }));
  const gripK: Record<string, number> = { Left: 1, Right: 1 };
  const setFingers = () => { for (const f of fingers) f.b.quaternion.slerpQuaternions(f.q0, f.q1, gripK[f.side]); };
  setFingers();
  /* encaixes de transporte medidos na própria malha (pose de bind): escudo nas costas e espada na lateral do quadril,
     sempre com uma folga mínima para nunca encostar no corpo */
  const sockets = (() => {
    const sk = model.getObjectByProperty('isSkinnedMesh', true) as THREE.SkinnedMesh | undefined; if (!sk) return null;
    root.updateMatrixWorld(true); const pos = sk.geometry.attributes.position as THREE.BufferAttribute, v = new THREE.Vector3(), pts: THREE.Vector3[] = [];
    for (let i = 0; i < pos.count; i += 2) { v.fromBufferAttribute(pos, i); sk.applyBoneTransform(i, v); pts.push(root.worldToLocal(sk.localToWorld(v.clone()))); }
    const bb = new THREE.Box3().setFromPoints(pts), Hm = bb.max.y - bb.min.y, gap = Hm * 0.012;
    const lp = (n: string) => { const b = B(n); return b ? rootP(b, root) : new THREE.Vector3(); };
    // extensão local (nativa) de um objeto de equipamento
    const extent = (o: THREE.Object3D | null) => { if (!o || !o.parent) return null; const m = o.matrix.clone(), au = o.matrixAutoUpdate; o.parent.updateWorldMatrix(true, false);
      o.matrixAutoUpdate = false; o.matrix.copy(o.parent.matrixWorld).invert(); o.updateMatrixWorld(true); const e = new THREE.Box3().setFromObject(o, true); o.matrix.copy(m); o.matrixAutoUpdate = au; o.updateMatrixWorld(true); return e; };
    const toBone = (bn: string, x: THREE.Vector3, y: THREE.Vector3, p: THREE.Vector3) => { const b = B(bn)!; const z = new THREE.Vector3().crossVectors(x, y).normalize(); x = new THREE.Vector3().crossVectors(y, z).normalize();
      const mw = new THREE.Matrix4().makeBasis(x, y, z).setPosition(p).premultiply(root.matrixWorld); return { b, rel: b.matrixWorld.clone().invert().multiply(mw) }; };
    // costas: ponto mais recuado do tronco na altura do peito
    const sp = lp('Spine2');
    const se = extent(rig.shield()); const inward = se ? se.max.x : 0.05; // lado da alça (+X local) fica voltado para o corpo
    const fwd = Math.sign(lp('LeftToeBase').z - lp('LeftFoot').z) || 1; // frente do personagem no espaço da raiz
    let backZ = fwd > 0 ? Infinity : -Infinity; for (const q of pts) if (Math.abs(q.y - sp.y) < Hm * 0.09 && Math.abs(q.x - sp.x) < Hm * 0.08) backZ = fwd > 0 ? Math.min(backZ, q.z) : Math.max(backZ, q.z);
    const back = toBone('Spine2', new THREE.Vector3(0, 0, fwd), new THREE.Vector3(0, 1, 0.12 * fwd).normalize(), new THREE.Vector3(sp.x, sp.y + Hm * 0.01, backZ - fwd * (gap + inward)));
    // quadril do lado oposto à mão da espada: lado de fora do quadril/saia
    const hipSide = shieldSide, hp = lp(hipSide + 'UpLeg'), sx = Math.sign(hp.x - lp('Hips').x) || 1; let outX = 0;
    { // superfície de fora do quadril: sobe a partir do osso até o primeiro vão (o vão separa o quadril da mão pendurada na pose A)
      const xs: number[] = []; for (const q of pts) if (Math.abs(q.y - hp.y) < Hm * 0.05 && Math.abs(q.z - hp.z) < Hm * 0.07) { const d = (q.x - hp.x) * sx; if (d > 0) xs.push(d); }
      xs.sort((a, b) => a - b); for (let i = 0; i < xs.length; i++) { if (i && xs[i] - xs[i - 1] > Hm * 0.03) break; outX = xs[i]; } }
    const ext = extent(rig.sword()); const flat = ext ? Math.max(Math.abs(ext.min.z), Math.abs(ext.max.z)) : 0.02;
    const blade = new THREE.Vector3(0, -0.8, -0.6 * fwd).normalize(); // lâmina para baixo e para trás
    const edge = new THREE.Vector3(0, 0.6, -0.8 * fwd).normalize();
    const hipP = new THREE.Vector3(hp.x + sx * (outX + gap * 1.6 + flat), hp.y + Hm * 0.07, hp.z + fwd * Hm * 0.03);
    const hip = toBone('Hips', edge, blade.clone().negate(), hipP);
    return { back, hip };
  })();
  const sockM = new THREE.Matrix4();
  function placeSock(obj: THREE.Object3D | null, s: { b: THREE.Bone; rel: THREE.Matrix4 }) {
    if (!obj || !obj.parent) return; sockM.multiplyMatrices(s.b.matrixWorld, s.rel);
    // mantém a escala do mundo do personagem (o encaixe foi medido no espaço da raiz)
    obj.parent.updateWorldMatrix(true, false); obj.matrixAutoUpdate = false; obj.matrix.copy(obj.parent.matrixWorld).invert().multiply(sockM); obj.updateMatrixWorld(true);
  }
  const tq = new THREE.Quaternion(), pq = new THREE.Quaternion(), tp = new THREE.Vector3();
  /* espada e escudo presos pela anatomia da mão do modelo: o cabo atravessa o punho (do mindinho ao indicador),
     o fio segue a linha dos nós dos dedos; o escudo fica no lado de fora do antebraço, segurado pela alça */
  const R = rig; const W = (o: THREE.Object3D, v = new THREE.Vector3()) => o.getWorldPosition(v);
  const sH = B(swordSide + 'Hand')!, sI = B(swordSide + 'HandIndex1')!, sP = B(swordSide + 'HandPinky1')!, sM = B(swordSide + 'HandMiddle1')!;
  const hH = B(shieldSide + 'Hand')!, hF = B(shieldSide + 'ForeArm')!, hI = B(shieldSide + 'HandIndex1')!, hP = B(shieldSide + 'HandPinky1')!, hM = B(shieldSide + 'HandMiddle1')!;
  const DBG = window as unknown as { __bladeSg?: number; __palmSg?: number; __shSg?: number };
  const vH = new THREE.Vector3(), vI = new THREE.Vector3(), vP = new THREE.Vector3(), vM = new THREE.Vector3(), vF = new THREE.Vector3();
  const ay = new THREE.Vector3(), az = new THREE.Vector3(), mw = new THREE.Matrix4(), mi = new THREE.Matrix4(), sc = new THREE.Vector3();
  function place(obj: THREE.Object3D | null, x: THREE.Vector3, y: THREE.Vector3, pos: THREE.Vector3) {
    if (!obj || !obj.parent) return; root.matrixWorld.decompose(vF, tq, sc);
    az.crossVectors(x, y).normalize(); x.crossVectors(y, az).normalize();
    mw.makeBasis(x.multiplyScalar(sc.x), y.clone().multiplyScalar(sc.y), az.multiplyScalar(sc.z)); mw.setPosition(pos);
    obj.parent.updateWorldMatrix(true, false); mi.copy(obj.parent.matrixWorld).invert();
    obj.matrixAutoUpdate = false; obj.matrix.multiplyMatrices(mi, mw); obj.updateMatrixWorld(true);
  }
  // repouso da espada no procedural: suporte em (-1.9, 0, 0) e lâmina sem giro interno
  let R0inv: THREE.Quaternion | null = null, leanK = 1, headKey = '', headDir: THREE.Vector3 | null = null;
  // onde fica a cabeça da arma (fora do eixo do cabo, em Y local): só existe em machado/martelo; espada dá nulo
  function measureHead(o: THREE.Object3D): THREE.Vector3 | null {
    if (!o.parent) return null; const m = o.matrix.clone(), au = o.matrixAutoUpdate; o.parent.updateWorldMatrix(true, false); o.matrixAutoUpdate = false; o.matrix.copy(o.parent.matrixWorld).invert(); o.updateMatrixWorld(true);
    const e = new THREE.Box3().setFromObject(o, true); o.matrix.copy(m); o.matrixAutoUpdate = au; o.updateMatrixWorld(true);
    const len = e.max.y - e.min.y, cx = (e.max.x + e.min.x) / 2, cz = (e.max.z + e.min.z) / 2, wx = e.max.x - e.min.x, wz = e.max.z - e.min.z;
    if (Math.max(wx, wz) < len * 0.28 || Math.hypot(cx, cz) < len * 0.04) return null; // simétrica em volta do cabo: espada/lança
    return new THREE.Vector3(Math.abs(cx) > Math.abs(cz) ? Math.sign(cx) : 0, 0, Math.abs(cx) > Math.abs(cz) ? 0 : Math.sign(cz));
  }
  // de que lado do eixo Y local fica a lâmina (a parte mais comprida do modelo da espada)
  const bladeSign = (() => { const o = rig.sword(); if (!o || !o.parent) return 0; const m = o.matrix.clone(), au = o.matrixAutoUpdate; o.parent.updateWorldMatrix(true, false); o.matrixAutoUpdate = false; o.matrix.copy(o.parent.matrixWorld).invert(); o.updateMatrixWorld(true);
    const e = new THREE.Box3().setFromObject(o, true); o.matrix.copy(m); o.matrixAutoUpdate = au; o.updateMatrixWorld(true); return e.max.y > -e.min.y ? 1 : -1; })();
  { const sh = R.swordHolder(), sw = R.sword(); if (sh && sw) { const a = sh.rotation.clone(), q = sw.quaternion.clone(); sh.rotation.set(-1.9, 0, 0); sw.quaternion.identity(); root.updateMatrixWorld(true);
      const rel = R.armR.wr!.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(sw.getWorldQuaternion(new THREE.Quaternion())); R0inv = rel.invert(); sh.rotation.copy(a); sw.quaternion.copy(q); } }
  const isUnder = (o: THREE.Object3D, p: THREE.Object3D) => { for (let q: THREE.Object3D | null = o; q; q = q.parent) if (q === p) return true; return false; };
  /* a caneca (e o frasco) na mão do modelo de arte (28/10): a alça atravessa o punho, do mindinho ao indicador, e a caneca fica de pé à frente dos dedos */
  function placeCups() { { const cf = (R as unknown as { cuff?: () => THREE.Object3D | null }).cuff?.(); if (cf && cf.visible) { model.updateMatrixWorld(true); W(hI, vI); W(hP, vP); W(hM, vM); W(hH, vH); W(hF, vF);
        const fd = vH.clone().sub(vF).normalize(), ac = vI.clone().sub(vP).normalize(), pos = vH.clone().addScaledVector(fd, -0.04 * sc.x); root.matrixWorld.decompose(new THREE.Vector3(), tq, sc); place(cf, ac.clone(), fd.clone(), pos); } } /* o bracelete da Bobina no pulso do braço do escudo */
    const cups = (R as unknown as { cups?: () => (THREE.Object3D | null)[] }).cups?.(); if (!cups) return;
    for (const c of cups) { if (!c || !c.visible) continue; model.updateMatrixWorld(true); W(sI, vI); W(sP, vP); W(sM, vM); W(sH, vH);
      const up = vI.clone().sub(vP).normalize(), fd = vM.clone().sub(vH).normalize(), g = vI.clone().add(vP).add(vM).multiplyScalar(1 / 3);
      root.matrixWorld.decompose(vF, tq, sc); const pos = g.addScaledVector(fd, 0.07 * sc.x); place(c, fd.clone(), up.clone(), pos); } }
  function holdGear() {
    model.updateMatrixWorld(true);
    { const RG2 = R as unknown as { gun?: () => THREE.Object3D | null; placeGun?: (a: THREE.Vector3, b: THREE.Vector3, q: THREE.Quaternion, s: number) => void };
      if (RG2.gun?.() && RG2.placeGun) { // arma de duas mãos: entre as mãos do modelo de arte (a direita na empunhadura, a esquerda no guarda-mão)
        W(sI, vI); W(sP, vP); W(sM, vM); const gR = vI.clone().add(vP).add(vM).multiplyScalar(1 / 3); W(hI, vI); W(hP, vP); W(hM, vM); const gL = vI.clone().add(vP).add(vM).multiplyScalar(1 / 3);
        root.matrixWorld.decompose(vF, tq, sc); RG2.placeGun(gR, gL, tq, sc.x); } }
    const shp = R.shield()?.parent; const stowed = !!shp && !isUnder(shp, R.armL.el!);
    const tool = !!(R as unknown as { holdTool?: () => boolean }).holdTool?.();
    gripK[swordSide] = stowed && !tool ? 0.42 : 1; gripK[shieldSide] = stowed ? 0.42 : 1; setFingers(); model.updateMatrixWorld(true);
    if (stowed && sockets) { placeSock(R.shield(), sockets.back); if (!tool) { placeSock(R.sword(), sockets.hip); return; } }
    // espada
    W(sH, vH); W(sI, vI); W(sP, vP); W(sM, vM);
    const a = ay.subVectors(vI, vP).normalize().multiplyScalar(DBG.__bladeSg ?? -1); // sai pelo lado do indicador/polegar
    const f = new THREE.Vector3().subVectors(vM, vH).normalize();
    const k = f.clone().sub(a.clone().multiplyScalar(f.dot(a))).normalize(); // linha dos nós dos dedos = direção do fio
    const palm = new THREE.Vector3().crossVectors(a, f).normalize().multiplyScalar(DBG.__palmSg ?? 1);
    const grip = vI.clone().add(vP).add(vM).add(vM).multiplyScalar(0.25).addScaledVector(palm, 0.012 * sc.x).addScaledVector(f, -0.01 * sc.x);
    place(R.sword(), k.clone(), a.clone().negate(), grip);
    // ofícios (machado, picareta, faca, alicate): a ferramenta segue exatamente a orientação do esqueleto procedural (espelhada como o resto), presa na mão do modelo
    const TA = hero.actName; if (tool && (TA === 'chop' || TA === 'mine' || TA === 'skin' || TA === 'herb')) { const swT = R.sword(); if (swT && swT.parent) {
      const pw = swT.parent.getWorldQuaternion(new THREE.Quaternion()).multiply(swT.quaternion), rq = root.getWorldQuaternion(new THREE.Quaternion());
      const qw = pw; void rq; /* o esqueleto procedural e o modelo dividem o mesmo mundo: a orientação vale como está */
      root.matrixWorld.decompose(vF, tq, sc); mw.compose(grip, qw, sc); swT.parent.updateWorldMatrix(true, false); mi.copy(swT.parent.matrixWorld).invert(); swT.matrixAutoUpdate = false; swT.matrix.multiplyMatrices(mi, mw); swT.updateMatrixWorld(true); }
      return; }
    // inclinação da espada vinda do procedural (pulso/“hang”/golpes): rotação relativa ao pulso, calibrada no repouso
    const sw = R.sword(), wr = R.armR.wr!;
    if (sw && sw.parent && R0inv && !(window as unknown as { __norel?: number }).__norel) {
      const proc = sw.parent.getWorldQuaternion(new THREE.Quaternion()).multiply(sw.quaternion);
      const rel = wr.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(proc).premultiply(R0inv); // desvio desde o repouso, no referencial do pulso
      if (MIRROR && ((window as unknown as { __mrel?: number }).__mrel ?? 1)) rel.set(rel.x, -rel.y, -rel.z, rel.w);
      sw.matrix.decompose(vF, tq, sc); sw.matrix.compose(vF, tq.multiply(rel), sc); sw.updateMatrixWorld(true);
    }
    // em guarda (sem golpe): a lâmina nunca fica tombada para trás; sobe e aponta para a frente do herói
    if (sw && bladeSign) { const want = hero.acting ? 0 : 1; leanK += (want - leanK) * 0.2;
      if (leanK > 0.01) { const e = sw.matrixWorld.elements; const bd = new THREE.Vector3(e[4], e[5], e[6]).normalize().multiplyScalar(bladeSign);
        const fw = new THREE.Vector3(0, 0, 1).applyQuaternion(root.getWorldQuaternion(tq)), up = new THREE.Vector3(0, 1, 0);
        const target = fw.clone().multiplyScalar(0.55).addScaledVector(up, 0.83).normalize();
        const q = new THREE.Quaternion().setFromUnitVectors(bd, target); q.slerp(new THREE.Quaternion(), 1 - leanK * 0.85);
        sw.matrix.decompose(vF, tq, sc); const pw = sw.parent!.getWorldQuaternion(new THREE.Quaternion()); const wq = pw.clone().multiply(tq); wq.premultiply(q); tq.copy(pw.invert().multiply(wq));
        sw.matrix.compose(vF, tq, sc); sw.updateMatrixWorld(true); } }
    /* armas com cabeça (machado, martelo, maça): o fio da cabeça sempre olha para a frente do herói, girando no eixo do cabo */
    if (sw) { const key = sw.children.map((c) => c.uuid).join(); if (key !== headKey) { headKey = key; headDir = measureHead(sw); }
      if (headDir) { const e = sw.matrixWorld.elements; const ax = new THREE.Vector3(e[4], e[5], e[6]).normalize();
        const hw = headDir.clone().transformDirection(sw.matrixWorld); hw.addScaledVector(ax, -hw.dot(ax)).normalize();
        const an = hero.actName, rq = root.getWorldQuaternion(tq); // ofícios: a picareta bate para baixo, o machado corta no sentido do golpe (da direita para a esquerda)
        const fw = an === 'mine' ? new THREE.Vector3(0, 0, 0.35).applyQuaternion(rq).add(new THREE.Vector3(0, -1, 0)) : an === 'chop' ? new THREE.Vector3((window as unknown as { __chopX?: number }).__chopX ?? -1, 0, 0.4).applyQuaternion(rq) : new THREE.Vector3(0, 0, 1).applyQuaternion(rq); fw.addScaledVector(ax, -fw.dot(ax));
        if (fw.lengthSq() > 1e-4) { fw.normalize(); const ang = Math.atan2(new THREE.Vector3().crossVectors(hw, fw).dot(ax), hw.dot(fw));
          const q = new THREE.Quaternion().setFromAxisAngle(ax, ang); sw.matrix.decompose(vF, tq, sc); const pw = sw.parent!.getWorldQuaternion(new THREE.Quaternion());
          const wq = pw.clone().multiply(tq).premultiply(q); tq.copy(pw.invert().multiply(wq)); sw.matrix.compose(vF, tq, sc); sw.updateMatrixWorld(true); } } }
    // escudo
    if (stowed) return; // nas costas (já posto acima)
    W(hH, vH); W(hF, vF); W(hI, vI); W(hP, vP); W(hM, vM);
    const u = new THREE.Vector3().subVectors(vH, vF).normalize();
    const a2 = new THREE.Vector3().subVectors(vI, vP).normalize(), f2 = new THREE.Vector3().subVectors(vM, vH).normalize();
    const back = new THREE.Vector3().crossVectors(f2, a2).normalize().multiplyScalar(DBG.__shSg ?? -1); // dorso da mão/antebraço = para fora
    // escudo sempre de pé (vertical): face para fora do antebraço puxada para a frente do herói, borda de cima para o céu;
    // o centro acompanha o antebraço, então ele balança junto com o braço
    const fwS = new THREE.Vector3(0, 0, 1).applyQuaternion(root.getWorldQuaternion(tq));
    const nS = back.clone().setY(0); if (nS.lengthSq() < 1e-4) nS.copy(fwS); nS.normalize().lerp(fwS, 0.45).setY(back.y * 0.25).normalize();
    const upS = new THREE.Vector3(0, 1, 0).addScaledVector(u, 0.15); upS.addScaledVector(nS, -upS.dot(nS)).normalize();
    const ctrS = vF.clone().lerp(vH, 0.62).addScaledVector(nS, (0.17 + (rig?.bodyHolder?.()?.children.some((c) => c.userData.pauldron) ? 0.08 : 0)) * root.getWorldScale(new THREE.Vector3()).x); // com ombreiras, o escudo vai mais à frente e não atravessa // a face fica à frente do antebraço (alça + braço por trás)
    place(R.shield(), nS.clone().negate(), upS, ctrS);
  }
  const RW = window as unknown as { __rollL?: number; __rollR?: number };
  const roll: [THREE.Bone, THREE.Quaternion][] = (['Left', 'Right'] as const).map((side) => { const b = B(side + 'ForeArm')!; const ch = B(side + 'Hand')!;
    const ax = ch.position.clone().normalize(); const ang = side === 'Left' ? (RW.__rollL ?? 0.8) : (RW.__rollR ?? -0.8);
    return [b, new THREE.Quaternion().setFromAxisAngle(ax, ang)] as [THREE.Bone, THREE.Quaternion]; });
  /* elmo, capa e ombreiras: os suportes do procedural são encaixados nos ossos do modelo (cabeça e peito), na escala da cabeça e dos ombros dele */
  const fitted: { o: THREE.Object3D; b: THREE.Bone; C: THREE.Matrix4 }[] = [];
  { model.updateMatrixWorld(true); root.updateMatrixWorld(true);
    const rq0 = root.getWorldQuaternion(new THREE.Quaternion()), rs0 = root.getWorldScale(new THREE.Vector3()).x, wp = (o: THREE.Object3D) => o.getWorldPosition(new THREE.Vector3());
    const fit = (o: THREE.Object3D | undefined, b: THREE.Bone | undefined, at: THREE.Vector3, k: number) => { if (!o || !b) return; const A = new THREE.Matrix4().compose(at, rq0, new THREE.Vector3(rs0 * k, rs0 * k, rs0 * k)); fitted.push({ o, b, C: b.matrixWorld.clone().invert().multiply(A) }); };
    const H = B('Head'), HT = B('HeadTop_End'), DB = window as unknown as { __hk?: number; __hc?: number };
    if (H && HT && rig.procHeadR) { const a = wp(H), t = wp(HT), d0 = a.distanceTo(t), hipY = wp(B('Hips')!).y - root.getWorldPosition(new THREE.Vector3()).y, DW = window as unknown as { __hs?: number; __hu?: number };
      let size = d0, at = a.clone().lerp(t, DB.__hc ?? 1.08);
      if (d0 > hipY * 0.16) { /* HeadTop_End muito acima da cabeça (modelos humanos): tamanho pela altura do quadril, posição proporcional à altura do quadril */
        size = hipY * 0.118 * (DW.__hs ?? 1.0); const dir = t.clone().sub(a).normalize();
        at = a.clone().addScaledVector(dir, hipY * (DW.__hu ?? 0.13));
        /* melhor ainda: mede o crânio na própria malha (vértices presos ao osso da cabeça), sem o cabelo solto e a trança:
           topo = o ponto mais alto; largura = faixa central (percentis) dos vértices da metade de cima; o elmo é uma esfera
           do tamanho do crânio com o centro um raio abaixo do topo */
        const xs: number[] = [], ys: number[] = [], zs: number[] = [], v = new THREE.Vector3();
        model.traverse((o) => { const m = o as THREE.SkinnedMesh; if (!m.isSkinnedMesh) return; const hi = m.skeleton.bones.indexOf(H); if (hi < 0) return;
          const si = m.geometry.getAttribute('skinIndex'), sw = m.geometry.getAttribute('skinWeight'); if (!si || !sw) return;
          for (let i = 0; i < si.count; i++) { let w = 0; for (let c = 0; c < 4; c++) if (si.getComponent(i, c) === hi) w += sw.getComponent(i, c); if (w < 0.6) continue;
            m.getVertexPosition(i, v); m.applyBoneTransform(i, v); v.applyMatrix4(m.matrixWorld); xs.push(v.x); ys.push(v.y); zs.push(v.z); } });
        if (xs.length > 30) {
          const pc = (a: number[], q: number) => { const b = [...a].sort((x, y) => x - y); return b[Math.min(b.length - 1, Math.max(0, Math.round(q * (b.length - 1))))]; };
          const top = pc(ys, 0.995), bot = pc(ys, 0.02), hh = top - bot;
          const ux: number[] = [], uz: number[] = []; for (let i = 0; i < ys.length; i++) if (ys[i] > top - hh * 0.5) { ux.push(xs[i]); uz.push(zs[i]); }
          const x0 = pc(ux, 0.04), x1 = pc(ux, 0.96), z0 = pc(uz, 0.06), z1 = pc(uz, 0.94), R = Math.max((x1 - x0) / 2, hh * 0.3) * (DW.__hs ?? 1.04);
          size = R * 2 / (0.5 * (DB.__hk ?? 2.15)) * 0.5; // (k = R / procHeadR abaixo)
          at = new THREE.Vector3((x0 + x1) / 2, top - R * (DW.__hu ?? 1.12), (z0 + z1) / 2 + R * ((window as unknown as { __hz?: number }).__hz ?? 0.06)); } }
      fit(rig.helmHolder?.(), H, at, (size * 0.5 * (DB.__hk ?? 2.15)) / (rig.procHeadR * rs0)); }
    const LA = B('LeftArm'), RA = B('RightArm'), S2 = B('Spine2');
    if (LA && RA && S2 && rig.procShoulderW) { const l = wp(LA), r = wp(RA); fit(rig.bodyHolder?.(), S2, l.clone().add(r).multiplyScalar(0.5), l.distanceTo(r) / (rig.procShoulderW * rs0)); }
  }
  const fm = new THREE.Matrix4(), fi = new THREE.Matrix4();
  function placeFitted() { for (const f of fitted) { if (!f.o.parent) continue; f.o.parent.updateWorldMatrix(true, false); fm.multiplyMatrices(f.b.matrixWorld, f.C); fi.copy(f.o.parent.matrixWorld).invert(); f.o.matrixAutoUpdate = false; f.o.matrix.multiplyMatrices(fi, fm); f.o.updateMatrixWorld(true); } }
  function tick() {
    root.updateMatrixWorld(true);
    const inv = root.getWorldQuaternion(tq).invert().clone();
    for (const r of rest) {
      const delta = rootQ(r.j, inv).multiply(r.qOinv); // quanto a junta procedural girou desde o repouso
      if (MIRROR) delta.set(delta.x, -delta.y, -delta.z, delta.w);
      const target = delta.multiply(r.base); // aplicado ao repouso alinhado do modelo
      rootQ(r.b.parent!, inv, pq);
      r.b.quaternion.copy(pq.invert().multiply(target));
      if (r.b.name === 'mixamorigHips') { rootP(r.j, root, tp).sub(r.p0O); if (MIRROR) tp.x = -tp.x; tp.add(r.p0M); r.b.parent!.worldToLocal(root.localToWorld(tp)); r.b.position.copy(tp); }
      r.b.updateMatrixWorld(true);
    }
    // giro do antebraço (pronação/supinação): o procedural não tem esse grau; sem ele as palmas ficam viradas para cima/fora
    for (const [b, q] of roll) { b.quaternion.multiply(q); b.updateMatrixWorld(true); }
    holdGear(); placeCups(); placeFitted();
  }
  return { tick, model };
}
