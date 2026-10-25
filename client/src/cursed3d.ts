/** Terras amaldiçoadas da Catedral: arte sacra em ruína (anjos, santos, obeliscos, mausoléus), a grade gigante,
 *  e a desgraça das vilas de karma negativo (árvores mortas com enforcados, corpos, trigo morto, poços secos, altares,
 *  névoa rasteira e a água negra e fétida). Tudo em coordenadas locais do tile: [0, Wm] × [0, Dm]. */
import * as THREE from 'three';
import { std, ink, stoneTex, plankTex, gableRoof } from './toon3d';
import type { Prop } from './world';

export const CURSED_KINDS = new Set(['angel', 'obelisk', 'saint', 'mausoleum', 'gfence', 'gpillar', 'ggate', 'deadtree', 'corpse', 'deadcrop', 'deadwell', 'altar', 'fogpatch', 'tar']);
/** sólidos (bloqueiam passagem): o resto é chão/decoração */
export const CURSED_SOLID = new Set(['angel', 'obelisk', 'saint', 'mausoleum', 'gfence', 'gpillar', 'deadtree', 'deadwell', 'altar']);

let stoneM: THREE.Material | null = null, stoneD: THREE.Material | null = null, mossM: THREE.Material | null = null;
const S = () => (stoneM ??= std(0xffffff, { map: stoneTex(0x8a8884) }));
const SD = () => (stoneD ??= std(0xffffff, { map: stoneTex(0x56544f) }));
const MOSS = () => (mossM ??= std(0x4a5a3a));
const iron = std(0x1e1e24), rust = std(0x3a2a22), bark = std(0x2a1f18), barkD = std(0x1a1410), rope = std(0x8a7a5a);
const cloth = std(0x6a645a), clothD = std(0x4a443c), skin = std(0x9a9488), bone = std(0xd8d0b8), blood = std(0x4a0a0a), wax = std(0xe8e0c8);
const flameM = new THREE.MeshBasicMaterial({ color: 0xffb040 });
let fogTex: THREE.Texture | null = null;
function fogT() {
  if (fogTex) return fogTex;
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d')!;
  const gr = g.createRadialGradient(32, 32, 2, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.6, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64); fogTex = new THREE.CanvasTexture(c); return fogTex;
}
/** névoa rasteira: leve e clara, aditiva (nunca escurece o chão — antes, à noite, virava uma película preta por cima de tudo) */
const fogMat = () => new THREE.MeshBasicMaterial({ map: fogT(), color: 0x3a4246, transparent: true, opacity: 0.5, depthWrite: false, fog: false, blending: THREE.AdditiveBlending });
const tarMat = new THREE.MeshBasicMaterial({ color: 0x3a3418, transparent: true, opacity: 0.0, depthWrite: false }); // a cor da água podre vem do shader da água; aqui só limo e bolhas
const tarSheen = new THREE.MeshBasicMaterial({ color: 0x3a4a1a, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending });

function box(g: THREE.Group, w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number, ry = 0, rz = 0, inkW = 0.03) {
  const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); if (inkW) ink(b, inkW); b.position.set(x, y, z); b.rotation.set(0, ry, rz); b.castShadow = b.receiveShadow = true; g.add(b); return b;
}
function cyl(g: THREE.Group, r0: number, r1: number, h: number, m: THREE.Material, x: number, y: number, z: number, seg = 7) {
  const c = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, seg), m); ink(c, 0.03); c.position.set(x, y, z); c.castShadow = true; g.add(c); return c;
}

/** figura humana simples (corpo amortalhado / enforcado) */
function figure(g: THREE.Group, x: number, y: number, z: number, lying: boolean, ry: number, r: () => number) {
  const f = new THREE.Group(); f.position.set(x, y, z); f.rotation.y = ry; g.add(f);
  const shroud = r() < 0.5 ? cloth : clothD;
  if (lying) {
    box(f, 0.42, 0.22, 1.5, shroud, 0, 0.12, 0); const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 7, 6), skin); head.position.set(0, 0.16, 0.86); f.add(head);
    if (r() < 0.6) { const st = new THREE.Mesh(new THREE.CircleGeometry(0.5, 10).rotateX(-Math.PI / 2), blood); st.position.set(0.15, 0.02, 0.2); f.add(st); }
  } else { // pendurado: cabeça tombada, braços caídos, pés no ar
    box(f, 0.36, 0.9, 0.26, shroud, 0, -0.45, 0, 0, 0.04); box(f, 0.12, 0.6, 0.12, shroud, -0.13, -1.15, 0, 0, 0.05); box(f, 0.12, 0.6, 0.12, shroud, 0.13, -1.15, 0.02, 0, -0.05);
    box(f, 0.1, 0.55, 0.1, shroud, -0.24, -0.4, 0, 0, 0.08); box(f, 0.1, 0.55, 0.1, shroud, 0.24, -0.42, 0, 0, -0.06);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 7, 6), skin); head.position.set(0.05, 0.14, 0.05); head.rotation.z = 0.5; f.add(head);
  }
}

/** árvore retorcida morta (galhos negros sem folhas); variant 1 = com enforcado */
function deadTree(g: THREE.Group, cx: number, cz: number, h: number, hanged: boolean, r: () => number) {
  const t = new THREE.Group(); t.position.set(cx, 0, cz); t.rotation.y = r() * 6.28; g.add(t);
  const seg = 4; let px = 0, pz = 0, py = 0, rad = 0.28;
  for (let i = 0; i < seg; i++) { const len = h / seg, tx = px + (r() - 0.5) * 0.5, tz = pz + (r() - 0.5) * 0.5;
    const c = new THREE.Mesh(new THREE.CylinderGeometry(rad * 0.72, rad, len * 1.05, 6), i % 2 ? bark : barkD); ink(c, 0.04);
    c.position.set((px + tx) / 2, py + len / 2, (pz + tz) / 2); c.lookAt(tx, py + len, tz); c.rotateX(Math.PI / 2); c.castShadow = true; t.add(c);
    px = tx; pz = tz; py += len; rad *= 0.72; }
  const branches = 5 + Math.floor(r() * 3); let hangAt: THREE.Vector3 | null = null;
  for (let i = 0; i < branches; i++) {
    const y = h * (0.45 + r() * 0.5), a = r() * 6.28, len = 0.9 + r() * 1.4, up = 0.2 + r() * 0.7;
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.08, len, 5), barkD); ink(b, 0.03);
    const ex = Math.cos(a) * len, ez = Math.sin(a) * len; b.position.set(ex / 2, y + up * len / 2, ez / 2); b.lookAt(ex, y + up * len, ez); b.rotateX(Math.PI / 2); t.add(b);
    for (let k = 0; k < 2; k++) { const tw = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.03, 0.5, 4), barkD); const kx = ex * 0.8, kz = ez * 0.8; tw.position.set(kx, y + up * len * 0.8 + 0.15, kz); tw.rotation.set(r() - 0.5, 0, r() - 0.5); t.add(tw); }
    if (!hangAt && up < 0.45 && y > h * 0.55) hangAt = new THREE.Vector3(ex * 0.75, y + up * len * 0.75, ez * 0.75);
  }
  if (hanged) { const hp = hangAt ?? new THREE.Vector3(1.0, h * 0.7, 0);
    const rp = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.7, 4), rope); rp.position.set(hp.x, hp.y - 0.35, hp.z); t.add(rp);
    figure(t, hp.x, hp.y - 0.75, hp.z, false, r() * 6.28, r); }
}

export function buildCursed(p: Prop, g: THREE.Group, Wm: number, Dm: number, r: () => number) {
  const v = p.variant ?? 0, cx = Wm / 2, cz = Dm / 2;
  switch (p.kind as string) {
    case 'angel': { // anjo de pedra sobre pedestal: túnica, asas abertas ou recolhidas, mãos em prece; alguns sem cabeça ou sem asa
      const sc = 1 + (v === 2 ? 0.6 : 0); const a = new THREE.Group(); a.position.set(cx, 0, cz); a.scale.setScalar(sc); a.rotation.y = (p.height % 1) * 6.28; g.add(a);
      box(a, 1.1, 0.5, 1.1, SD(), 0, 0.25, 0); box(a, 0.85, 0.9, 0.85, S(), 0, 0.95, 0); box(a, 1.0, 0.14, 1.0, SD(), 0, 1.46, 0);
      cyl(a, 0.22, 0.42, 1.5, S(), 0, 2.28, 0, 8); cyl(a, 0.16, 0.2, 0.42, S(), 0, 3.2, 0, 7);
      const broken = r() < 0.22; if (!broken) { const hd = new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 7), S()); ink(hd, 0.02); hd.position.set(0, 3.55, 0.04); a.add(hd); hd.rotation.x = 0.35; }
      box(a, 0.1, 0.42, 0.12, S(), -0.07, 3.0, 0.22, 0, 0.3); box(a, 0.1, 0.42, 0.12, S(), 0.07, 3.0, 0.22, 0, -0.3); // mãos em prece
      const open = v !== 1, lost = r() < 0.18 ? (r() < 0.5 ? -1 : 1) : 0;
      for (const s of [-1, 1]) { if (s === lost) continue; const w = new THREE.Group(); w.position.set(s * 0.18, 3.05, -0.12); w.rotation.set(0.15, s * (open ? 0.5 : 0.15), s * (open ? -0.55 : -0.12)); a.add(w);
        box(w, 0.14, 1.3, 0.5, S(), s * 0.08, 0.15, -0.05); box(w, 0.12, 0.9, 0.38, S(), s * 0.14, -0.6, -0.08); box(w, 0.1, 0.5, 0.3, S(), s * 0.18, 0.8, -0.1, 0, s * -0.3); }
      if (r() < 0.6) box(a, 0.86, 0.04, 0.86, MOSS(), 0, 1.53, 0, 0, 0, 0);
      break;
    }
    case 'saint': { // santo encapuzado segurando espada de ponta para baixo — arte sacra das ordens antigas
      const a = new THREE.Group(); a.position.set(cx, 0, cz); a.rotation.y = (p.height % 1) * 6.28; g.add(a);
      box(a, 1.0, 0.6, 1.0, SD(), 0, 0.3, 0); cyl(a, 0.3, 0.5, 1.9, S(), 0, 1.55, 0, 8); const hood = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.7, 8), S()); ink(hood, 0.03); hood.position.set(0, 2.75, 0); a.add(hood);
      const face = new THREE.Mesh(new THREE.SphereGeometry(0.14, 7, 6), SD()); face.position.set(0, 2.6, 0.14); a.add(face);
      box(a, 0.08, 1.6, 0.04, std(0x6a6a70), 0, 1.4, 0.48); box(a, 0.5, 0.06, 0.08, std(0x6a6a70), 0, 2.1, 0.48); // espada
      box(a, 0.1, 0.4, 0.12, S(), -0.13, 2.12, 0.4, 0, 0.2); box(a, 0.1, 0.4, 0.12, S(), 0.13, 2.12, 0.4, 0, -0.2);
      break;
    }
    case 'obelisk': { // obelisco funerário com cruz em relevo e urna
      const H = 3.2 + v * 1.2; box(g, 1.0, 0.4, 1.0, SD(), cx, 0.2, cz); const ob = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.4, H, 4), S()); ink(ob, 0.03); ob.rotation.y = Math.PI / 4; ob.position.set(cx, 0.4 + H / 2, cz); ob.castShadow = true; g.add(ob);
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.5, 4), S()); tip.rotation.y = Math.PI / 4; tip.position.set(cx, 0.4 + H + 0.25, cz); g.add(tip);
      box(g, 0.08, 0.7, 0.05, SD(), cx, 0.4 + H * 0.55, cz + 0.31, 0, 0, 0); box(g, 0.4, 0.08, 0.05, SD(), cx, 0.4 + H * 0.62, cz + 0.31, 0, 0, 0);
      break;
    }
    case 'mausoleum': { // mausoléu gótico de pedra: colunas, frontão agudo, porta de ferro, cruz; variant 1 = cova aberta para as profundezas
      const w = Wm - 0.6, d = Dm - 0.6, H = Math.max(3.2, p.height);
      box(g, w + 0.4, 0.4, d + 0.4, SD(), cx, 0.2, cz); box(g, w, H, d, S(), cx, 0.4 + H / 2, cz, 0, 0, 0.05);
      const roof = gableRoof(w + 0.5, d + 0.5, H * 0.55, 0.3, 0x3a3640, 0x5a5650, false); roof.position.set(cx, 0.4 + H, cz); g.add(roof);
      for (const s of [-1, 1]) { cyl(g, 0.22, 0.26, H, S(), cx + s * (w / 2 - 0.25), 0.4 + H / 2, cz + d / 2 + 0.25, 8); const pin = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.9, 5), SD()); pin.position.set(cx + s * (w / 2 - 0.25), 0.4 + H + 0.45, cz + d / 2 + 0.25); g.add(pin); }
      const gab = new THREE.Mesh(new THREE.ConeGeometry(w * 0.45, H * 0.5, 4), SD()); gab.rotation.y = Math.PI / 4; gab.scale.set(1, 1, 0.12); gab.position.set(cx, 0.4 + H + H * 0.18, cz + d / 2 + 0.05); g.add(gab);
      box(g, 0.1, 0.9, 0.1, SD(), cx, 0.4 + H + H * 0.55 + 0.4, cz + d / 2, 0, 0, 0); box(g, 0.5, 0.1, 0.1, SD(), cx, 0.4 + H + H * 0.55 + 0.6, cz + d / 2, 0, 0, 0);
      const doorH = Math.min(2.6, H * 0.75); box(g, 1.3, doorH, 0.12, v === 1 ? std(0x050404) : rust, cx, 0.4 + doorH / 2, cz + d / 2 + 0.04, 0, 0, 0.02);
      for (let k = -2; k <= 2; k++) box(g, 0.05, doorH * 0.95, 0.05, iron, cx + k * 0.25, 0.4 + doorH / 2, cz + d / 2 + 0.12, 0, 0, 0);
      if (v === 1) { // escada descendo para a cova
        for (let k = 0; k < 4; k++) box(g, 1.2, 0.12, 0.45, SD(), cx, 0.35 - k * 0.12, cz + d / 2 + 0.7 + k * 0.42, 0, 0, 0);
        const glow = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.4), new THREE.MeshBasicMaterial({ color: 0x8a2a1a, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false })); glow.position.set(cx, 0.3 + doorH / 2, cz + d / 2 + 0.11); glow.userData.dyn = true; g.add(glow); }
      for (let k = 0; k < 3; k++) box(g, 0.5 + r() * 0.4, 0.04, 0.4 + r() * 0.3, MOSS(), cx + (r() - 0.5) * w, 0.4 + H + 0.05, cz + (r() - 0.5) * d, r(), 0, 0);
      break;
    }
    case 'gfence': { // grade gigante: barras de 4,5 m com pontas de lança e florões, três travessas, espinhos retorcidos no alto
      const ns = v === 1, H = 4.6;
      for (let k = 0; k < 5; k++) { const off = -0.8 + k * 0.4, tilt = r() < 0.12 ? (r() - 0.5) * 0.3 : 0; const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, H, 5), iron);
        bar.position.set(ns ? cx : cx + off, H / 2, ns ? cz + off : cz); bar.rotation.z = tilt; g.add(bar);
        const tip = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.42, 4), iron); tip.position.set(bar.position.x - Math.sin(tilt) * H / 2, H + 0.18, bar.position.z); g.add(tip);
        if (k % 2 === 0) { const fl = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.025, 4, 8), iron); fl.position.set(bar.position.x, H - 0.5, bar.position.z); fl.rotation.y = ns ? 0 : Math.PI / 2; g.add(fl); } }
      for (const y of [0.35, 2.2, H - 0.25]) box(g, ns ? 0.07 : Wm, 0.08, ns ? Dm : 0.07, iron, cx, y, cz, 0, 0, 0);
      break;
    }
    case 'gpillar': { // pilar de pedra da grade com urna e caveira com chama fria
      box(g, 1.1, 5.4, 1.1, S(), cx, 2.7, cz); box(g, 1.35, 0.3, 1.35, SD(), cx, 5.5, cz); box(g, 1.3, 0.4, 1.3, SD(), cx, 0.2, cz);
      cyl(g, 0.22, 0.32, 0.55, SD(), cx, 5.95, cz, 8); const sk = new THREE.Mesh(new THREE.SphereGeometry(0.2, 7, 6), bone); sk.position.set(cx, 6.4, cz); g.add(sk);
      const fl = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.45, 6), new THREE.MeshBasicMaterial({ color: 0x7ad0ff })); fl.position.set(cx, 6.8, cz); fl.userData.dyn = true; g.add(fl);
      break;
    }
    case 'ggate': { // portão monumental: arco ogival de pedra de 9 m, folhas de ferro entreabertas, anjos guardiões no topo
      const w = Wm, H = 8.5; for (const s of [-1, 1]) { box(g, 1.4, H, 1.4, S(), cx + s * (w / 2 - 0.7), H / 2, cz); const pin = new THREE.Mesh(new THREE.ConeGeometry(0.6, 2.2, 5), SD()); pin.position.set(cx + s * (w / 2 - 0.7), H + 1.1, cz); g.add(pin); }
      const arch = new THREE.Mesh(new THREE.TorusGeometry(w / 2 - 1.2, 0.45, 6, 18, Math.PI), S()); ink(arch, 0.04); arch.position.set(cx, H - (w / 2 - 1.2) - 0.4, cz); g.add(arch);
      box(g, w - 1.6, 0.6, 1.2, SD(), cx, H - 0.3, cz); const cr = box(g, 0.25, 1.6, 0.25, SD(), cx, H + 0.9, cz); void cr; box(g, 1.0, 0.25, 0.25, SD(), cx, H + 1.2, cz);
      for (const s of [-1, 1]) { const leaf = new THREE.Group(); leaf.position.set(cx + s * (w / 2 - 1.4), 0, cz); leaf.rotation.y = s * -0.9; g.add(leaf);
        for (let k = 0; k < 6; k++) { const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 5.2, 5), iron); bar.position.set(-s * (0.25 + k * 0.4), 2.6, 0); leaf.add(bar); }
        for (const y of [0.5, 2.6, 4.9]) { const rl = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 0.06), iron); rl.position.set(-s * 1.2, y, 0); leaf.add(rl); } }
      break;
    }
    case 'deadtree': deadTree(g, cx, cz, p.height, v === 1, r); break;
    case 'corpse': { figure(g, cx + (r() - 0.5) * 0.6, 0, cz + (r() - 0.5) * 0.6, true, r() * 6.28, r);
      if (r() < 0.5) for (let k = 0; k < 2; k++) { const crow = new THREE.Group(); crow.position.set(cx + (r() - 0.5) * 1.4, 0.1, cz + (r() - 0.5) * 1.4); crow.rotation.y = r() * 6; g.add(crow); box(crow, 0.14, 0.16, 0.3, std(0x0c0c10), 0, 0.12, 0, 0, 0, 0); box(crow, 0.1, 0.1, 0.12, std(0x0c0c10), 0, 0.22, 0.16, 0, 0, 0); box(crow, 0.03, 0.03, 0.1, std(0x6a5a2a), 0, 0.22, 0.26, 0, 0, 0); }
      break; }
    case 'deadcrop': { // trigo morto: talos cinzentos tombados, espigas pretas, terra rachada
      const soil = new THREE.Mesh(new THREE.PlaneGeometry(Wm * 0.96, Dm * 0.96).rotateX(-Math.PI / 2), std(0x3a3024)); soil.position.set(cx, 0.03, cz); soil.receiveShadow = true; g.add(soil);
      const stalk = std(0x6a6450), ear = std(0x2a2418);
      for (let k = 0; k < 18; k++) { const x = r() * Wm, z = r() * Dm, h = 0.4 + r() * 0.5, tilt = (r() - 0.3) * 1.3;
        const s2 = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.018, h, 3), stalk); s2.position.set(x, h / 2 * Math.cos(tilt), z); s2.rotation.set(0, r() * 6, tilt); g.add(s2);
        const e2 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.04), ear); e2.position.set(x + Math.sin(-tilt) * h * 0.95, h * Math.cos(tilt), z); g.add(e2); }
      break; }
    case 'deadwell': { // poço seco: pedra rachada, telhadinho quebrado, balde caído, ossos dentro
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, 0.9, 12, 1, true), S()); ink(ring, 0.04); ring.position.set(cx, 0.45, cz); ring.castShadow = true; g.add(ring);
      const hole = new THREE.Mesh(new THREE.CircleGeometry(0.75, 12).rotateX(-Math.PI / 2), std(0x050404)); hole.position.set(cx, 0.6, cz); g.add(hole);
      for (const s of [-1, 1]) box(g, 0.14, 1.9, 0.14, bark, cx + s * 0.8, 0.95, cz, 0, s * 0.08);
      const rf = box(g, 2.0, 0.08, 1.2, std(0xffffff, { map: plankTex(0x3a2a1c) }), cx + 0.2, 1.95, cz, 0, 0.35); void rf;
      box(g, 0.25, 0.25, 0.25, std(0x4a3220), cx + 1.2, 0.12, cz + 0.6, 0.6, 1.2); const sk = new THREE.Mesh(new THREE.SphereGeometry(0.13, 6, 5), bone); sk.position.set(cx - 0.9, 0.1, cz + 0.8); g.add(sk);
      break; }
    case 'altar': { // altar de sacrifício: laje de pedra com sangue, velas, ossos e um círculo riscado no chão
      box(g, 2.0, 0.9, 1.0, SD(), cx, 0.45, cz); box(g, 2.2, 0.14, 1.2, S(), cx, 0.95, cz);
      const st = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.6).rotateX(-Math.PI / 2), blood); st.position.set(cx, 1.03, cz); g.add(st);
      const circ = new THREE.Mesh(new THREE.RingGeometry(1.9, 2.05, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x5a0a0a })); circ.position.set(cx, 0.04, cz); g.add(circ);
      for (let k = 0; k < 6; k++) { const a = k / 6 * 6.28; const c = cyl(g, 0.05, 0.06, 0.25 + r() * 0.2, wax, cx + Math.cos(a) * 1.7, 0.15, cz + Math.sin(a) * 1.7, 5); const f = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.12, 5), flameM); f.position.set(c.position.x, 0.38, c.position.z); f.userData.dyn = true; g.add(f); }
      figure(g, cx, 1.02, cz, true, Math.PI / 2, r);
      break; }
    case 'fogpatch': { // névoa rasteira: lençóis translúcidos sobrepostos, baixos
      const fm = fogMat(); for (let k = 0; k < 3; k++) { const s2 = (Wm * (1.4 + r() * 1.0)); const pl = new THREE.Mesh(new THREE.PlaneGeometry(s2, s2).rotateX(-Math.PI / 2), fm); pl.position.set(cx + (r() - 0.5) * Wm * 0.4, 0.25 + k * 0.35, cz + (r() - 0.5) * Dm * 0.4); pl.rotation.y = r() * 6; pl.renderOrder = 3; pl.userData.dyn = true; g.add(pl); }
      break; }
    case 'tar': { // água negra e fétida: superfície escura com brilho oleoso esverdeado e bolhas
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(Wm + 0.05, Dm + 0.05).rotateX(-Math.PI / 2), tarMat); pl.position.set(cx, 0.02, cz); g.add(pl);
      if (r() < 0.5) { const sh = new THREE.Mesh(new THREE.CircleGeometry(0.4 + r() * 0.5, 8).rotateX(-Math.PI / 2), tarSheen); sh.position.set(cx + (r() - 0.5) * Wm * 0.6, 0.03, cz + (r() - 0.5) * Dm * 0.6); sh.userData.dyn = true; g.add(sh); }
      if (r() < 0.25) { const bb = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 4, 0, Math.PI * 2, 0, Math.PI / 2), std(0x1a2010)); bb.position.set(cx + (r() - 0.5) * Wm * 0.6, 0.02, cz + (r() - 0.5) * Dm * 0.6); g.add(bb); }
      break; }
  }
}
