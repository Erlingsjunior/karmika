/* 10/11 TRANSFERIDOR DE ANIMAÇÃO (Erling: "traga o esqueleto de animação e use no lugar do nosso; combate, movimento avançado, poses —
   temos dificuldade com movimentos!"). As animações da KayKit (CC0, ~95 por pacote) vêm num esqueleto simples (hips, spine, chest,
   upperarm.l…); os personagens do Herik usam o esqueleto Mixamo (mixamorigHips, mixamorigSpine…). Aqui cada animação é REFEITA para o
   esqueleto do Herik: para cada osso, quanto ele girou em relação à própria pose de repouso (no espaço do mundo), corrigido pela
   diferença entre as duas poses de repouso (braço em "A" × em "T"); o quadril leva também o deslocamento, na escala da altura. */
import * as THREE from 'three';

/** osso do Herik (Mixamo, nome já limpo pelo carregador) → osso da KayKit. A MÃO fica de fora de propósito: o punho fechado do boneco chibi
    dobra a mão realista para dentro ("punho de biruta"); ela segue reta o antebraço, e no jogo mantém a pegada da arma. */
export const KK_TO_MIXAMO: Record<string, string> = {
  mixamorigHips: 'hips', mixamorigSpine: 'spine', mixamorigSpine2: 'chest', mixamorigHead: 'head',
  mixamorigLeftArm: 'upperarm.l', mixamorigLeftForeArm: 'lowerarm.l', mixamorigRightArm: 'upperarm.r', mixamorigRightForeArm: 'lowerarm.r',
  mixamorigLeftUpLeg: 'upperleg.l', mixamorigLeftLeg: 'lowerleg.l', mixamorigLeftFoot: 'foot.l', mixamorigLeftToeBase: 'toes.l', mixamorigRightUpLeg: 'upperleg.r', mixamorigRightLeg: 'lowerleg.r', mixamorigRightFoot: 'foot.r', mixamorigRightToeBase: 'toes.r',
};
const CHILD: Record<string, string> = { hips: 'spine', spine: 'chest', chest: 'head', 'upperarm.l': 'lowerarm.l', 'lowerarm.l': 'hand.l', 'hand.l': 'handslot.l', 'upperarm.r': 'lowerarm.r', 'lowerarm.r': 'hand.r', 'hand.r': 'handslot.r', 'upperleg.l': 'lowerleg.l', 'lowerleg.l': 'foot.l', 'foot.l': 'toes.l', 'upperleg.r': 'lowerleg.r', 'lowerleg.r': 'foot.r', 'foot.r': 'toes.r' };

/* o carregador tira '.', ':', '/' dos nomes ('upperleg.l' vira 'upperlegl'): compara já limpo */
const clean = (n: string) => THREE.PropertyBinding.sanitizeNodeName(n);
/** base ortonormal: x = direção do osso, z = `hint` sem a parte paralela, y = z × x */
function frame(dir: THREE.Vector3, hint: THREE.Vector3) { const x = dir.clone().normalize(); let z = hint.clone().sub(x.clone().multiplyScalar(hint.dot(x))); if (z.lengthSq() < 1e-6) z = new THREE.Vector3(0, 1, 0).sub(x.clone().multiplyScalar(x.y)); z.normalize(); const y = new THREE.Vector3().crossVectors(z, x);
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z)); }
/** a frente do personagem no mundo (+Z do objeto raiz) */
const fwdOf = (o: THREE.Object3D) => new THREE.Vector3(0, 0, 1).applyQuaternion(o.getWorldQuaternion(new THREE.Quaternion()));
/** IK de dois ossos no espaço do mundo: gira ombro e cotovelo para a ponta (`c`) chegar ao alvo, cotovelo para o lado de `pole` */
function ik2(a: THREE.Bone, b: THREE.Bone, c: THREE.Bone, target: THREE.Vector3, pole: THREE.Vector3) {
  const P = (o: THREE.Object3D) => o.getWorldPosition(new THREE.Vector3()); const pa = P(a), pb = P(b), pc = P(c); const L1 = pa.distanceTo(pb), L2 = pb.distanceTo(pc);
  const ac = target.clone().sub(pa); const dd = Math.max(1e-4, Math.min(L1 + L2 - 1e-4, ac.length())); ac.normalize();
  const cosA = Math.max(-1, Math.min(1, (L1 * L1 + dd * dd - L2 * L2) / (2 * L1 * dd))), sinA = Math.sqrt(1 - cosA * cosA);
  const pn = pole.clone().sub(ac.clone().multiplyScalar(pole.dot(ac))); if (pn.lengthSq() < 1e-8) pn.set(0, -1, 0).sub(ac.clone().multiplyScalar(-ac.y)); pn.normalize();
  const elbow = pa.clone().add(ac.clone().multiplyScalar(L1 * cosA)).add(pn.multiplyScalar(L1 * sinA));
  const turn = (bone: THREE.Bone, from: THREE.Vector3, to: THREE.Vector3) => { const r = new THREE.Quaternion().setFromUnitVectors(from.normalize(), to.normalize()); const wq = bone.getWorldQuaternion(new THREE.Quaternion()); const nw = r.multiply(wq); const pq = bone.parent!.getWorldQuaternion(new THREE.Quaternion()).invert(); bone.quaternion.copy(pq.multiply(nw)); bone.updateMatrixWorld(true); };
  turn(a, pb.clone().sub(pa), elbow.clone().sub(pa)); const pb2 = P(b), pc2 = P(c); turn(b, pc2.clone().sub(pb2), pa.clone().add(ac.clone().multiplyScalar(dd)).sub(pb2));
}
const findBone = (root: THREE.Object3D, n: string) => { const c = clean(n); let b: THREE.Bone | null = null; root.traverse((o) => { if (!b && (o as THREE.Bone).isBone && (o.name === n || o.name === c)) b = o as THREE.Bone; }); return b as THREE.Bone | null; };

/** refaz `clip` (tocado em `srcRoot`) para o esqueleto em `dstRoot`. Os dois em pose de repouso quando chamados. */
/** correção de estilo (o boneco chibi anda de braço aberto ~45° e punho virado para dentro; num corpo realista vira "gorila"):
    armIn = quanto fechar o braço inteiro no ombro (rad); wristOut = quanto desvirar o punho em torno do antebraço (rad) */
export interface RetargetStyle { armIn: number; wristOut: number; /** quanto da distância ombro→mão da fonte usar (1 = proporcional) */ reach: number; /** quanto manter da abertura lateral do braço (o boneco chibi abre demais) */ spread: number }
export const STYLE_REAL: RetargetStyle = { armIn: 0, wristOut: 0, reach: 1, spread: 0.35 };
export function retargetKayKit(srcRoot: THREE.Object3D, dstRoot: THREE.Object3D, clip: THREE.AnimationClip, fps = 30, map = KK_TO_MIXAMO, style: RetargetStyle = STYLE_REAL): THREE.AnimationClip {
  srcRoot.updateMatrixWorld(true); dstRoot.updateMatrixWorld(true);
  const pairs: { d: THREE.Bone; s: THREE.Bone; sBind: THREE.Quaternion; dBind: THREE.Quaternion; align: THREE.Quaternion }[] = [];
  const wq = (o: THREE.Object3D) => o.getWorldQuaternion(new THREE.Quaternion()), wp = (o: THREE.Object3D) => o.getWorldPosition(new THREE.Vector3());
  /* ordem da árvore do destino: pai antes do filho */
  const order: THREE.Bone[] = []; dstRoot.traverse((o) => { if ((o as THREE.Bone).isBone && map[o.name]) order.push(o as THREE.Bone); });
  for (const d of order) { const s = findBone(srcRoot, map[d.name]); if (!s) continue; const sName = map[d.name];
    /* correção de pose de repouso: gira a direção do osso do destino até a direção do osso da fonte */
    const align = new THREE.Quaternion(); const sc = CHILD[sName] ? findBone(srcRoot, CHILD[sName]) : null; const dcName = Object.keys(map).find((k) => map[k] === CHILD[sName]); const dc = dcName ? findBone(dstRoot, dcName) : null;
    if (sc && dc && sName !== 'hips') { const sd = wp(sc).sub(wp(s)).normalize(), dd = wp(dc).sub(wp(d)).normalize();
      /* base completa (direção do osso + frente do personagem): fixa também o giro em torno do osso — sem isso o cotovelo dobra para fora */
      if (sd.lengthSq() > 0 && dd.lengthSq() > 0) { const fs = frame(sd, fwdOf(srcRoot)), fd = frame(dd, fwdOf(dstRoot)); align.copy(fs).multiply(fd.invert()); } }
    pairs.push({ d, s, sBind: wq(s), dBind: wq(d), align }); }
  const hipS = findBone(srcRoot, 'hips'), hipD = findBone(dstRoot, 'mixamorigHips'); const hS0 = hipS ? wp(hipS) : new THREE.Vector3(), hD0 = hipD ? wp(hipD) : new THREE.Vector3();
  const k = hipS && hipD && hS0.y > 0.01 ? (hD0.y - dstRoot.getWorldPosition(new THREE.Vector3()).y) / (hS0.y - srcRoot.getWorldPosition(new THREE.Vector3()).y) : 1;
  const mixer = new THREE.AnimationMixer(srcRoot), act = mixer.clipAction(clip); act.play();
  const n = Math.max(2, Math.ceil(clip.duration * fps) + 1), times = new Float32Array(n), qv = pairs.map(() => new Float32Array(n * 4)), pv = new Float32Array(n * 3);
  const restLocal = pairs.map((p) => p.d.quaternion.clone()), hipLocal0 = hipD ? hipD.position.clone() : null;
  const armsIK: { side: number; sSh: THREE.Bone; sEl: THREE.Bone; sHa: THREE.Bone; dSh: THREE.Bone; dEl: THREE.Bone; dHa: THREE.Bone; sLen: number; dLen: number }[] = [];
  for (const [sx, dx] of [['l', 'Left'], ['r', 'Right']] as const) { const sSh = findBone(srcRoot, 'upperarm.' + sx), sEl = findBone(srcRoot, 'lowerarm.' + sx), sHa = findBone(srcRoot, 'hand.' + sx), dSh = findBone(dstRoot, `mixamorig${dx}Arm`), dEl = findBone(dstRoot, `mixamorig${dx}ForeArm`), dHa = findBone(dstRoot, `mixamorig${dx}Hand`);
    if (sSh && sEl && sHa && dSh && dEl && dHa) armsIK.push({ side: sx === 'l' ? 1 : -1, sSh, sEl, sHa, dSh, dEl, dHa, sLen: wp(sSh).distanceTo(wp(sEl)) + wp(sEl).distanceTo(wp(sHa)), dLen: wp(dSh).distanceTo(wp(dEl)) + wp(dEl).distanceTo(wp(dHa)) }); }
  const tq = new THREE.Quaternion(), pq = new THREE.Quaternion(); const fw = fwdOf(dstRoot); const armR = [new THREE.Quaternion().setFromAxisAngle(fw, -style.armIn), new THREE.Quaternion().setFromAxisAngle(fw, style.armIn)];
  for (let f = 0; f < n; f++) { const t = Math.min(clip.duration, f / fps); times[f] = t; mixer.setTime(t); srcRoot.updateMatrixWorld(true);
    pairs.forEach((p, i) => { /* mundo do destino = giro da fonte desde o repouso × correção × repouso do destino */
      tq.copy(wq(p.s)).multiply(pq.copy(p.sBind).invert()).multiply(p.align).multiply(p.dBind);
      const side = /Left/.test(p.d.name) ? 1 : /Right/.test(p.d.name) ? -1 : 0;
      if (side && /Arm|Hand/.test(p.d.name)) { /* o braço todo gira no ombro em direção ao corpo */ tq.premultiply(armR[side > 0 ? 0 : 1]);
        if (/Hand/.test(p.d.name) && style.wristOut) { /* o punho desvira em torno do próprio eixo */ const ax = new THREE.Vector3(1, 0, 0).applyQuaternion(tq).normalize(); tq.premultiply(new THREE.Quaternion().setFromAxisAngle(ax, style.wristOut * side)); } }
      const par = p.d.parent ? wq(p.d.parent) : new THREE.Quaternion(); p.d.quaternion.copy(par.invert().multiply(tq)); p.d.updateMatrixWorld(true); });
    /* braços por ALVO (IK): a mão do destino vai para onde está a mão da fonte em relação ao ombro, na proporção do braço de cada um,
       e o cotovelo dobra para o lado em que dobra o da fonte. Copiar só ângulos punha a mão do corpo realista no quadril. */
    for (const A of armsIK) { const sa = wp(A.sSh), se = wp(A.sEl), sh = wp(A.sHa), da = wp(A.dSh);
      const k2 = A.dLen / A.sLen, off = sh.clone().sub(sa).multiplyScalar(k2 * style.reach), side = A.side, rgt = new THREE.Vector3(1, 0, 0).applyQuaternion(dstRoot.getWorldQuaternion(new THREE.Quaternion())), lat = off.dot(rgt) * side; if (lat > 0) off.addScaledVector(rgt, -lat * side * (1 - style.spread)); const tgt = da.clone().add(off), pole = se.clone().sub(sa.clone().add(sh).multiplyScalar(0.5)); pole.add(fwdOf(dstRoot).multiplyScalar(-0.05));
      ik2(A.dSh, A.dEl, A.dHa, tgt, pole); }
    pairs.forEach((p, i) => p.d.quaternion.toArray(qv[i], f * 4));
    if (hipS && hipD && hipLocal0) { const dv = wp(hipS).sub(hS0).multiplyScalar(k); const par = hipD.parent!; const inv = new THREE.Matrix4().copy(par.matrixWorld).invert(); const w0 = hD0.clone().add(dv).applyMatrix4(inv); w0.toArray(pv, f * 3); } }
  mixer.stopAllAction(); mixer.uncacheRoot(srcRoot); pairs.forEach((p, i) => p.d.quaternion.copy(restLocal[i])); if (hipD && hipLocal0) hipD.position.copy(hipLocal0); dstRoot.updateMatrixWorld(true);
  const tracks: THREE.KeyframeTrack[] = pairs.map((p, i) => new THREE.QuaternionKeyframeTrack(`${p.d.name}.quaternion`, times, qv[i]));
  if (hipD) tracks.push(new THREE.VectorKeyframeTrack(`${hipD.name}.position`, times, pv));
  return new THREE.AnimationClip(clip.name, clip.duration, tracks);
}
