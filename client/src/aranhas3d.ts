/** FLORESTA DAS ARANHAS (12/11, Erling: "muitas árvores com teias grandes e médias e de diversos tipos, pessoas enroladas em teia, teias grandes com pessoas
 *  presas pedindo socorro, e no centro a toca da aranha-mãe, onde lutamos em cima de uma teia enorme").
 *  Aqui mora só o desenho: a árvore morta coberta de teia (três tamanhos), a teia grande esticada entre dois troncos, os casulos (ovos, gente enrolada),
 *  o tapete de teia no chão e a teia enorme do salão da Mãe. Tudo em coordenadas locais do tile: [0, Wm] × [0, Dm].
 *  Poucas peças e DOIS materiais de teia para o mundo inteiro (uma só montagem de efeito na placa de vídeo). */
import * as THREE from 'three';
import { std, ink } from './toon3d';
import type { Prop } from './world';

export const ARANHA_KINDS = new Set(['webtree', 'webnet', 'cocoon', 'webmat']);

const bark = std(0x2c221c), barkD = std(0x1b1512), silk = std(0xd9d6cc), silkD = std(0xa9a69c), bone = std(0xd8d0b8), skinM = std(0xb89a84), hairM = std(0x3a2a1c), sac = std(0xe6e2d0), sacD = std(0x8a9a5a);
let webT: THREE.Texture | null = null, matT: THREE.Texture | null = null, webM: THREE.Material | null = null, matM: THREE.Material | null = null;
/** teia de roda: raios e voltas tortas, com furos; branco sobre transparente */
function drawWeb(sz: number, spokes: number, rings: number, seed: number, torn: boolean) {
  const c = document.createElement('canvas'); c.width = c.height = sz; const g = c.getContext('2d')!; let s = seed; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const cx = sz / 2 + (r() - 0.5) * sz * 0.12, cy = sz / 2 + (r() - 0.5) * sz * 0.12, R = sz * 0.5; g.lineCap = 'round';
  const ang: number[] = []; for (let i = 0; i < spokes; i++) ang.push((i / spokes) * 6.283 + (r() - 0.5) * 0.25);
  const cut = torn ? Math.floor(r() * spokes) : -1;
  g.strokeStyle = 'rgba(255,255,255,.95)'; g.lineWidth = sz / 150;
  for (let i = 0; i < spokes; i++) { g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(ang[i]) * R * 1.3, cy + Math.sin(ang[i]) * R * 1.3); g.stroke(); }
  g.lineWidth = sz / 260;
  for (let k = 1; k <= rings; k++) { const rr = (k / rings) * R * (0.96 + r() * 0.06); for (let i = 0; i < spokes; i++) { if (i === cut || (torn && i === (cut + 1) % spokes && k > rings / 2)) continue; const a0 = ang[i], a1 = ang[(i + 1) % spokes] + (i === spokes - 1 ? 6.283 : 0), am = (a0 + a1) / 2, sag = rr * (0.86 + r() * 0.05);
      g.globalAlpha = 0.55 + r() * 0.45; g.beginPath(); g.moveTo(cx + Math.cos(a0) * rr, cy + Math.sin(a0) * rr); g.quadraticCurveTo(cx + Math.cos(am) * sag, cy + Math.sin(am) * sag, cx + Math.cos(a1) * rr, cy + Math.sin(a1) * rr); g.stroke(); } }
  g.globalAlpha = 1; g.fillStyle = 'rgba(255,255,255,.9)'; for (let i = 0; i < 26; i++) { const a = r() * 6.283, d = r() * R; g.beginPath(); g.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, sz / 300 + r() * sz / 260, 0, 6.283); g.fill(); } /* gotas de orvalho */
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 2; return t; }
const WEB = () => (webM ??= new THREE.MeshBasicMaterial({ map: (webT ??= drawWeb(256, 13, 9, 77, true)), color: 0xb9c2c8, transparent: true, opacity: 0.82, depthWrite: false, side: THREE.DoubleSide, alphaTest: 0.04 }));
const MAT = () => (matM ??= new THREE.MeshBasicMaterial({ map: (matT ??= drawWeb(256, 17, 12, 1234, false)), color: 0x9aa4aa, transparent: true, opacity: 0.6, depthWrite: false, alphaTest: 0.04, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));

const cyl = (g: THREE.Object3D, r0: number, r1: number, h: number, m: THREE.Material, x: number, y: number, z: number, rx = 0, rz = 0, n = 6) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, n), m); o.geometry.translate(0, h / 2, 0); o.position.set(x, y, z); o.rotation.set(rx, 0, rz); ink(o, 0.03); o.castShadow = true; g.add(o); return o; };
const ball = (g: THREE.Object3D, r: number, m: THREE.Material, x: number, y: number, z: number, sx = 1, sy = 1, sz = 1) => { const o = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), m); o.position.set(x, y, z); o.scale.set(sx, sy, sz); ink(o, 0.03); g.add(o); return o; };
/** um pano de teia de pé; a câmera olha de sudeste, então ele nasce virado para ela (o `ry` gira a partir daí) */
const sheet = (g: THREE.Object3D, w: number, h: number, x: number, y: number, z: number, ry = 0, rx = 0) => { const o = new THREE.Mesh(new THREE.PlaneGeometry(w, h), WEB()); o.position.set(x, y, z); o.rotation.set(rx, Math.PI / 4 + ry, 0); g.add(o); return o; };
/** casulo de gente: enrolado em seda, do tamanho de uma pessoa; `head` deixa o rosto de fora */
export function cocoon(head: boolean, s = 1) { const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.3 * s, 0.9 * s, 4, 8), silk); b.position.y = 0.78 * s; ink(b, 0.03); b.castShadow = true; g.add(b);
  for (let i = 0; i < 4; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.31 * s, 0.028 * s, 4, 10), silkD); t.rotation.set(Math.PI / 2 + (i % 2 ? 0.25 : -0.2), 0, 0); t.position.y = (0.38 + i * 0.26) * s; g.add(t); }
  if (head) { ball(g, 0.17 * s, skinM, 0, 1.52 * s, 0.03 * s); ball(g, 0.185 * s, hairM, 0, 1.58 * s, -0.04 * s, 1, 0.8, 1); }
  return g; }

export function buildAranha(p: Prop, g: THREE.Group, Wm: number, Dm: number, r: () => number) {
  const v = p.variant ?? 0, cx = Wm / 2, cz = Dm / 2;
  switch (p.kind as string) {
    case 'webtree': { /* árvore morta e torta, com panos de teia entre os galhos; variante 0 pequena · 1 média · 2 grande; algumas com casulo pendurado */
      const S = [0.75, 1.05, 1.5][v % 3], H = 4.2 * S, a = new THREE.Group(); a.position.set(cx, 0, cz); a.rotation.y = r() * 6.283; g.add(a);
      cyl(a, 0.16 * S, 0.3 * S, H * 0.55, bark, 0, 0, 0, (r() - 0.5) * 0.14, (r() - 0.5) * 0.14, 7); cyl(a, 0.09 * S, 0.16 * S, H * 0.5, barkD, 0, H * 0.52, 0, (r() - 0.5) * 0.3, (r() - 0.5) * 0.3, 6);
      const nb = 3 + Math.floor(r() * 3), tips: THREE.Vector3[] = [];
      for (let i = 0; i < nb; i++) { const ang = (i / nb) * 6.283 + r() * 0.6, tilt = 0.7 + r() * 0.5, len = (1.1 + r() * 1.1) * S, y0 = H * (0.42 + r() * 0.4); const br = new THREE.Group(); br.position.set(0, y0, 0); br.rotation.y = ang; a.add(br);
        cyl(br, 0.035 * S, 0.085 * S, len, i % 2 ? bark : barkD, 0, 0, 0, tilt, 0, 5); tips.push(new THREE.Vector3(Math.sin(ang) * Math.sin(tilt) * len, y0 + Math.cos(tilt) * len, Math.cos(ang) * Math.sin(tilt) * len));
        if (r() < 0.6) cyl(br, 0.02 * S, 0.04 * S, len * 0.5, barkD, 0, Math.cos(tilt) * len * 0.6, Math.sin(tilt) * len * 0.6, tilt + 0.7, 0.4, 4); }
      /* os panos ficam fora do giro da árvore, para olharem sempre para a câmera */
      const w = new THREE.Group(); w.position.set(cx, 0, cz); g.add(w);
      sheet(w, 2.2 * S, 2.2 * S, (r() - 0.5) * 0.5 * S, H * 0.62, (r() - 0.5) * 0.5 * S, (r() - 0.5) * 0.9);
      if (v % 3 >= 1) sheet(w, 1.5 * S, 1.5 * S, (r() - 0.5) * 1.2 * S, H * 0.36, (r() - 0.5) * 1.2 * S, (r() - 0.5) * 1.4, (r() - 0.5) * 0.4);
      if (v % 3 === 2) { sheet(w, 2.8 * S, 1.8 * S, 0, H * 0.86, 0, (r() - 0.5) * 0.5, 0.5); const m = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6).rotateX(-Math.PI / 2), MAT()); m.position.set(cx, 0.05, cz); m.rotation.y = r() * 6; g.add(m); }
      if (v >= 3 && tips.length) { const t = tips[Math.floor(r() * tips.length)], hang = 0.5 + r() * 0.5; cyl(a, 0.012, 0.012, hang, silkD, t.x, t.y - hang, t.z, 0, 0, 4); const c = cocoon(false, 0.72 + r() * 0.2); c.position.set(t.x, t.y - hang - 1.25, t.z); a.add(c); }
      break; }
    case 'webnet': { /* teia grande esticada entre dois troncos; variante 1: um corpo antigo preso nela (só ossos e seda) */
      const W = Math.max(Wm, Dm) * 0.92, H = 3.6 + (p.height % 1) * 1.4, a = new THREE.Group(); a.position.set(cx, 0, cz); a.rotation.y = Math.PI / 4 + (Wm >= Dm ? 0 : Math.PI / 2) * 0 + ((p.height * 7) % 1 - 0.5) * 0.5; g.add(a);
      for (const sd of [-1, 1]) { cyl(a, 0.11, 0.2, H + 0.5, bark, sd * W / 2, 0, 0, 0, sd * -0.07, 6); cyl(a, 0.03, 0.07, 1.2, barkD, sd * W / 2, H * 0.7, 0, 0, sd * 0.9, 4); }
      const m = new THREE.Mesh(new THREE.PlaneGeometry(W, H), WEB()); m.position.set(0, H / 2 + 0.25, 0); a.add(m);
      const m2 = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.55, H * 0.55), WEB()); m2.position.set(-W * 0.2, H * 0.3, 0.02); m2.rotation.z = 0.5; a.add(m2);
      if (v === 1) { const c = cocoon(false, 0.9); c.position.set(W * 0.12, H * 0.28, 0.12); c.rotation.z = 0.35; a.add(c); ball(a, 0.14, bone, W * 0.12 - 0.47, H * 0.28 + 1.38, 0.14); }
      break; }
    case 'cocoon': { /* 0: ninhada de ovos · 1: gente enrolada, de pé · 2: gente enrolada, caída · 9: lugar de um preso vivo (quem desenha é sistemas/floresta-aranhas.ts) */
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.9).rotateX(-Math.PI / 2), MAT()); m.position.set(cx, 0.05, cz); m.rotation.y = r() * 6; g.add(m);
      if (v === 9) break;
      if (v === 0) { const n = 3 + Math.floor(r() * 4); for (let i = 0; i < n; i++) { const a = r() * 6.283, d = r() * 0.5, s = 0.16 + r() * 0.16; ball(g, s, i % 3 ? sac : sacD, cx + Math.cos(a) * d, s * 0.8, cz + Math.sin(a) * d, 1, 1.15, 1); } }
      else { const c = cocoon(false, 0.85 + r() * 0.25); c.position.set(cx, 0, cz); c.rotation.y = r() * 6; if (v === 2) { c.rotation.z = Math.PI / 2 - 0.1; c.position.y = 0.3; } g.add(c); if (r() < 0.5) ball(g, 0.11, bone, cx + 0.45, 0.1, cz + 0.2); }
      break; }
    case 'webmat': { const m = new THREE.Mesh(new THREE.PlaneGeometry(Wm * 1.15, Dm * 1.15).rotateX(-Math.PI / 2), MAT()); m.position.set(cx, 0.05, cz); m.rotation.y = r() * 6; g.add(m); break; }
  }
}

/** a teia enorme do salão da Aranha-Mãe: o chão da luta. Raio em metros. Devolve o grupo e o que soltar na saída. */
export function buildWebArena(R: number) { const g = new THREE.Group();
  const tex = drawWeb(512, 22, 16, 4242, false), mat = new THREE.MeshBasicMaterial({ map: tex, color: 0xc8d0d6, transparent: true, opacity: 0.75, depthWrite: false, alphaTest: 0.03 });
  const fl = new THREE.Mesh(new THREE.CircleGeometry(R, 40).rotateX(-Math.PI / 2), mat); fl.position.y = 0.06; g.add(fl);
  /* fios grossos que sobem do chão para o escuro do teto, e casulos pendurados em volta */
  for (let i = 0; i < 10; i++) { const a = (i / 10) * 6.283 + 0.3, d = R * (0.82 + (i % 3) * 0.06), th = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 16, 4), silkD); th.position.set(Math.cos(a) * d, 8, Math.sin(a) * d); th.rotation.set(Math.cos(a) * 0.18, 0, -Math.sin(a) * 0.18 + (i % 2 ? 0.1 : -0.1)); g.add(th);
    if (i % 2) { const c = cocoon(i % 4 === 1, 0.8); c.position.set(Math.cos(a) * d * 0.94, 2.2 + (i % 3) * 0.7, Math.sin(a) * d * 0.94); c.userData.sway = 1 + i * 0.37; g.add(c); } }
  return { g, dispose() { g.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) m.geometry.dispose(); }); mat.dispose(); tex.dispose(); } }; }
