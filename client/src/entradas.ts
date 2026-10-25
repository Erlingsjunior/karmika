import * as THREE from 'three';
import { std, stoneTex, woodTex, texBox } from './toon3d';

/* =====================================================================================================
   ENTRADAS DAS MASMORRAS (25/10/2026)
   Erling: "a placa parece um banner de programação, com o pixel todo deteriorado, e a entrada nem se vê.
   O mausoléu não tem estátuas, não tem portão, não tem luz na entrada, não tem escadaria descendo, não tem arte sacra."
   Toda entrada agora tem:
   - uma ESCADARIA que desce de verdade (degraus cada vez mais escuros entre muros de arrimo, até uma boca preta);
   - LUZ na entrada (braseiros ou tochas que tremulam) e um brilho lá no fundo;
   - uma PLACA de madeira entalhada, pregada em dois postes (não flutua, não atravessa telhado), com o nome queimado na tábua;
   - o que o tema pede: estátuas encapuzadas, portão de ferro de duas folhas, o Olho de Marghar em relevo dourado e runas (cripta);
     arco de pedras com ossos e estandartes (caverna); vigas e trilho (mina); gelo e cristais (gelo); raízes e lanternas do pântano (mata/poço).
   ===================================================================================================== */

export interface EntranceSpec { name: string; kind: 'grupo' | 'subsolo' | 'caverna'; theme: string; players: string; scaled: boolean }
export interface EntranceFx { flames: { m: THREE.Mesh; l?: THREE.PointLight; base: number; seed: number }[]; glow: THREE.Sprite[] }

const toon = (c: number, e = 0) => new THREE.MeshToonMaterial({ color: c, emissive: e });
let glowTex: THREE.Texture | null = null;
function glow(): THREE.Texture { if (glowTex) return glowTex; const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d')!; const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.4, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); glowTex = new THREE.CanvasTexture(c); return glowTex; }

/* 25/10 (Erling: "dá para melhorar e muito as artes de todas as dungeons; nem parece o mesmo nível de qualidade do jogo"):
   pedra e madeira com textura (iguais às das vilas), rocha natural com veios e musgo, boca de caverna em túnel que escurece para dentro */
const TX = new Map<string, THREE.Texture>();
function rockTex(c: number, mossy = 0): THREE.Texture { const key = `rk${c}:${mossy}`; let t = TX.get(key); if (t) return t;
  const S = 64, cv = document.createElement('canvas'); cv.width = cv.height = S; const g = cv.getContext('2d')!; const col = new THREE.Color(c);
  let seed = c % 9973 + 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const sh = (k: number) => `rgb(${Math.min(255, col.r * 255 * k) | 0},${Math.min(255, col.g * 255 * k) | 0},${Math.min(255, col.b * 255 * k) | 0})`;
  g.fillStyle = sh(1); g.fillRect(0, 0, S, S);
  for (let i = 0; i < 160; i++) { g.fillStyle = sh(0.78 + rnd() * 0.4); const r = 1 + rnd() * 4; g.fillRect(rnd() * S, rnd() * S, r, r * (0.6 + rnd())); } // grão
  for (let i = 0; i < 7; i++) { g.strokeStyle = `rgba(0,0,0,${0.25 + rnd() * 0.25})`; g.lineWidth = 1; g.beginPath(); let x = rnd() * S, y = rnd() * S; g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (rnd() - 0.5) * 18; y += rnd() * 12; g.lineTo(x, y); } g.stroke(); } // veios e rachas
  if (mossy) for (let i = 0; i < 60 * mossy; i++) { g.fillStyle = `rgba(${70 + rnd() * 30},${110 + rnd() * 40},${40 + rnd() * 20},${0.5 + rnd() * 0.4})`; const r = 1 + rnd() * 3.5; g.beginPath(); g.arc(rnd() * S, rnd() * S * 0.55, r, 0, 6.283); g.fill(); } // musgo (mais em cima)
  t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.NearestFilter; TX.set(key, t); return t; }
/** pedra natural: icosaedro com os vértices mexidos (sempre igual para a mesma semente), mapeado com a textura de rocha */
function boulder(r: number, seed: number, m: THREE.Material, flat = 1): THREE.Mesh {
  const geo = new THREE.IcosahedronGeometry(r, 1), p = geo.attributes.position as THREE.BufferAttribute; let s = seed * 9301 + 49297; const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const cache = new Map<string, number>(); for (let i = 0; i < p.count; i++) { const k = `${p.getX(i).toFixed(3)},${p.getY(i).toFixed(3)},${p.getZ(i).toFixed(3)}`; let f = cache.get(k); if (f === undefined) { f = 0.78 + rnd() * 0.42; cache.set(k, f); } p.setXYZ(i, p.getX(i) * f, p.getY(i) * f * flat, p.getZ(i) * f); }
  geo.computeVertexNormals(); const uv = geo.attributes.uv as THREE.BufferAttribute; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * r * 1.6, uv.getY(i) * r * 1.6);
  return new THREE.Mesh(geo, m); }

/** a placa: tábua de madeira com veio, bordas queimadas, pregos de ferro e o nome entalhado (letra funda, sombra embaixo, luz em cima) */
function boardTexture(title: string, sub: string, group: boolean): THREE.Texture {
  const W = 768, H = 224, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d')!;
  /* madeira: três tábuas com veio */
  for (let b = 0; b < 3; b++) { const y0 = b * (H / 3); const base = [0x6a4526, 0x5e3d21, 0x734b2a][b];
    g.fillStyle = `#${base.toString(16).padStart(6, '0')}`; g.fillRect(0, y0, W, H / 3);
    for (let i = 0; i < 26; i++) { g.strokeStyle = `rgba(${30 + (i % 3) * 10},${18 + (i % 4) * 5},8,${0.18 + (i % 5) * 0.05})`; g.lineWidth = 1 + (i % 3); g.beginPath(); const yy = y0 + 4 + ((i * 37) % (H / 3 - 8)); g.moveTo(0, yy); for (let x = 0; x <= W; x += 48) g.lineTo(x, yy + Math.sin(x * 0.013 + i * 1.7 + b) * 3); g.stroke(); }
    g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(0, y0 + H / 3 - 3, W, 3); g.fillStyle = 'rgba(255,220,170,.08)'; g.fillRect(0, y0, W, 2); }
  /* nós da madeira */
  for (const [x, y, r] of [[90, 40, 9], [610, 150, 11], [380, 190, 7]] as [number, number, number][]) { const gr = g.createRadialGradient(x, y, 1, x, y, r * 2); gr.addColorStop(0, 'rgba(30,16,6,.8)'); gr.addColorStop(1, 'rgba(30,16,6,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, r * 2.2, r, 0, 0, 6.283); g.fill(); }
  /* bordas queimadas e moldura */
  const vg = g.createLinearGradient(0, 0, W, 0); vg.addColorStop(0, 'rgba(20,10,4,.75)'); vg.addColorStop(0.06, 'rgba(20,10,4,0)'); vg.addColorStop(0.94, 'rgba(20,10,4,0)'); vg.addColorStop(1, 'rgba(20,10,4,.75)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
  g.strokeStyle = group ? 'rgba(150,40,30,.9)' : 'rgba(40,24,10,.9)'; g.lineWidth = 8; g.strokeRect(10, 10, W - 20, H - 20);
  /* pregos */
  for (const [x, y] of [[26, 26], [W - 26, 26], [26, H - 26], [W - 26, H - 26]]) { g.fillStyle = '#2a2a2e'; g.beginPath(); g.arc(x, y, 8, 0, 6.283); g.fill(); g.fillStyle = 'rgba(200,200,210,.55)'; g.beginPath(); g.arc(x - 2, y - 2, 3, 0, 6.283); g.fill(); }
  /* letras entalhadas: sombra funda + preenchimento escuro + fio de luz na borda de cima */
  const _fit = (txt: string, max: number, px: number, font: string) => { let p = px; g.font = `${font} ${p}px Georgia, serif`; while (g.measureText(txt).width > max && p > 18) { p -= 2; g.font = `${font} ${p}px Georgia, serif`; } return p; };
  g.textAlign = 'center'; g.textBaseline = 'middle';
  /* 25/10: a tábua vai na camada fina (resolução cheia), então o NOME vai escrito de verdade, entalhado e pintado em ouro velho,
     com o tipo e quantos jogadores embaixo; à esquerda, o pictograma da escada descendo (e o crânio, se for de grupo) */
  g.lineJoin = 'round'; const gold = group ? '#ffb08a' : '#f0c878';
  const paint = (draw: () => void, lw: number) => { g.save(); g.lineWidth = lw + 8; g.strokeStyle = 'rgba(16,8,2,.95)'; g.fillStyle = 'rgba(16,8,2,.95)'; draw(); g.restore(); g.save(); g.lineWidth = lw; g.strokeStyle = gold; g.fillStyle = gold; draw(); g.restore(); };
  paint(() => { g.beginPath(); g.moveTo(40, 62); for (let i = 0; i < 4; i++) { g.lineTo(40 + i * 24, 62 + i * 26); g.lineTo(40 + (i + 1) * 24, 62 + i * 26); } g.stroke(); }, 7);
  if (group) paint(() => { g.beginPath(); g.arc(150, 150, 18, 0, 6.283); g.fill(); g.fillRect(138, 158, 24, 16); }, 4);
  const tp = _fit(title, W - 250, 78, 'bold'); g.textAlign = 'center';
  g.lineWidth = 10; g.strokeStyle = 'rgba(16,8,2,.95)'; g.font = `bold ${tp}px Georgia, serif`; g.strokeText(title, W / 2 + 70, 92); g.fillStyle = gold; g.fillText(title, W / 2 + 70, 92);
  g.fillStyle = 'rgba(255,240,200,.18)'; g.fillText(title, W / 2 + 70, 90);
  const sp = _fit(sub, W - 250, 30, '600'); g.font = `600 ${sp}px Georgia, serif`; g.lineWidth = 6; g.strokeText(sub, W / 2 + 70, 164); g.fillStyle = '#e8d6a8'; g.fillText(sub, W / 2 + 70, 164);
  void title; void sub; void _fit;
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.minFilter = THREE.LinearMipmapLinearFilter; return t;
}

/** pano pendurado (estandarte) com um símbolo: grupo = vermelho com crânio; o resto = cor do tema com o Olho */
function bannerTexture(col: string, skull: boolean): THREE.Texture {
  const c = document.createElement('canvas'); c.width = 128; c.height = 256; const g = c.getContext('2d')!;
  g.fillStyle = col; g.beginPath(); g.moveTo(0, 0); g.lineTo(128, 0); g.lineTo(128, 220); g.lineTo(64, 256); g.lineTo(0, 220); g.closePath(); g.fill();
  g.strokeStyle = '#d9a24f'; g.lineWidth = 6; g.stroke();
  for (let i = 0; i < 18; i++) { g.fillStyle = `rgba(0,0,0,${0.05 + (i % 3) * 0.03})`; g.fillRect(i * 7, 0, 3, 220); } /* trama do pano */
  g.fillStyle = '#e8c070'; g.strokeStyle = '#e8c070';
  if (skull) { g.beginPath(); g.arc(64, 100, 26, 0, 6.283); g.fill(); g.fillRect(48, 112, 32, 22); g.fillStyle = col; g.beginPath(); g.arc(54, 98, 7, 0, 6.283); g.arc(74, 98, 7, 0, 6.283); g.fill(); g.fillRect(56, 124, 4, 10); g.fillRect(68, 124, 4, 10); }
  else { g.lineWidth = 7; g.beginPath(); g.moveTo(24, 110); g.lineTo(64, 78); g.lineTo(104, 110); g.lineTo(64, 142); g.closePath(); g.stroke(); g.beginPath(); g.moveTo(64, 96); g.lineTo(76, 110); g.lineTo(64, 124); g.lineTo(52, 110); g.closePath(); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/** constrói a entrada inteira num grupo (origem no chão, de frente para +z, que é para onde a câmera olha) */
export function buildEntrance(d: EntranceSpec, fine: (o: THREE.Object3D) => THREE.Object3D): { g: THREE.Group; fx: EntranceFx } {
  const g = new THREE.Group(), fx: EntranceFx = { flames: [], glow: [] };
  const add = <T extends THREE.Object3D>(o: T, x: number, y: number, z: number) => { o.position.set(x, y, z); o.traverse((k) => { const m = k as THREE.Mesh; if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); g.add(o); return o; };
  const box = (w: number, h: number, dd: number, m: THREE.Material) => new THREE.Mesh(texBox(w, h, dd, 2), m);
  const big = d.kind === 'grupo' ? 1.3 : 1;
  const T = d.theme;
  const cave = T !== 'cripta' && T !== 'mina';
  const sC = T === 'gelo' ? 0x9ab4cc : T === 'magma' ? 0x5a4a44 : T === 'mata' || T === 'toca' ? 0x7a7664 : T === 'mina' ? 0x7e7468 : 0x9e9aa6;
  const sTex = cave ? rockTex(sC, T === 'mata' || T === 'toca' ? 1 : 0) : stoneTex(sC);
  const stone = std(0xffffff, { map: sTex }), stoneD = std(0xb0aaa4, { map: sTex });
  const dark = new THREE.MeshBasicMaterial({ color: 0x020103 });
  const inner = T === 'cripta' ? 0xff5a3a : T === 'gelo' ? 0x7ad0ff : T === 'magma' ? 0xff7a20 : T === 'toca' ? 0xc8603a : T === 'mata' ? 0x7ad05a : 0xffb060;

  /* ---------- a escadaria: sobe-se três degraus até o patamar e dali ela DESCE, entre muros, até a boca escura ----------
     (o terreno não tem buraco: por isso a descida fica dentro de um corpo de pedra elevado, e os degraus são maciços até o chão) */
  const sw = 2.1 * big, yTop = 1.25, nDown = 7, stepD = 0.42;
  for (let i = 0; i < 3; i++) { const h = 0.32 * (i + 1); add(box(sw + 0.6, h, 0.42, i === 2 ? stone : stoneD), 0, h / 2, 3.35 * big - i * 0.42); } /* subida */
  add(box(sw + 1.4, yTop, 0.8, stone), 0, yTop / 2, 3.35 * big - 1.5); /* patamar */
  const z0 = 3.35 * big - 1.9;
  for (let i = 0; i < nDown; i++) { const k = i / (nDown - 1), top = yTop - (i + 1) * 0.16; const m = std(new THREE.Color(0xffffff).lerp(new THREE.Color(0x060505), 0.1 + k * 0.85).getHex(), { map: sTex });
    add(box(sw, Math.max(0.05, top), stepD, m), 0, Math.max(0.05, top) / 2, z0 - i * stepD); }
  const zEnd = z0 - nDown * stepD, wallL = z0 - zEnd + 1.2;
  for (const sx of [-1, 1]) { add(box(0.5, yTop + 0.45, wallL, stoneD), sx * (sw / 2 + 0.25), (yTop + 0.45) / 2, (z0 + zEnd) / 2 + 0.3); add(box(0.62, 0.14, wallL + 0.05, stone), sx * (sw / 2 + 0.25), yTop + 0.5, (z0 + zEnd) / 2 + 0.3); }
  const doorZ = zEnd + 0.1;
  /* a boca: o escuro no fim da escada, e uma luz fraca lá dentro */
  if (!cave) add(box(sw + 0.1, 2.4 * big, 0.12, dark), 0, 1.2 * big, doorZ);
  { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow(), color: inner, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending })); s.scale.set(2.4, 2.0, 1); add(s, 0, 0.6, doorZ + 0.35); fx.glow.push(s); }
  { const l = new THREE.PointLight(inner, 5, 6, 1.8); add(l, 0, 0.8, doorZ + 0.9); }

  /* ---------- a moldura conforme o tema ---------- */
  if (T === 'cripta') {
    const st = toon(0xa8a4b0, 0x0c0a10), stD = toon(0x6e6a78, 0x08060c), iron = toon(0x24242a), gold = new THREE.MeshToonMaterial({ color: 0xd9a24f, emissive: 0x3a2408 });
    /* o mausoléu: corpo, frontão, cornija, colunas */
    add(box(5.6 * big, 0.4, 2.6 * big, stD), 0, 0.2, doorZ - 1.0);
    add(box(4.6 * big, 3.4 * big, 2.2 * big, st), 0, 0.4 + 1.7 * big, doorZ - 1.2);
    { const sh = new THREE.Shape(); sh.moveTo(-2.7 * big, 0); sh.lineTo(0, 1.5 * big); sh.lineTo(2.7 * big, 0); sh.closePath(); const rg = new THREE.ExtrudeGeometry(sh, { depth: 2.5 * big, bevelEnabled: false }); rg.translate(0, 0, -1.25 * big); add(new THREE.Mesh(rg, stD), 0, 0.4 + 3.4 * big, doorZ - 1.2); }
    add(box(5.2 * big, 0.28, 0.5, stD), 0, 0.4 + 3.42 * big, doorZ - 0.05);
    for (const sx of [-1, 1]) { add(new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.3, 3.2 * big, 10), st), sx * 1.75 * big, 0.4 + 1.6 * big, doorZ + 0.15); add(box(0.7, 0.28, 0.7, stD), sx * 1.75 * big, 0.4 + 3.25 * big, doorZ + 0.15); add(box(0.7, 0.3, 0.7, stD), sx * 1.75 * big, 0.55, doorZ + 0.15); }
    /* o arco da porta, por onde a escada entra */
    for (const sx of [-1, 1]) add(box(0.35, 2.5 * big, 0.4, stD), sx * (sw / 2 + 0.15), 0.4 + 1.0 * big, doorZ);
    add(box(sw + 0.7, 0.4, 0.42, stD), 0, 0.4 + 2.3 * big, doorZ);
    /* ARTE SACRA: o Olho de Marghar em relevo dourado no frontão + runas que brilham de leve */
    { const eye = new THREE.Group(); const lz = new THREE.Shape(); lz.moveTo(-0.7, 0); lz.lineTo(0, 0.42); lz.lineTo(0.7, 0); lz.lineTo(0, -0.42); lz.closePath(); eye.add(new THREE.Mesh(new THREE.ExtrudeGeometry(lz, { depth: 0.08, bevelEnabled: false }), gold));
      const pu = new THREE.Mesh(new THREE.CircleGeometry(0.16, 4), new THREE.MeshBasicMaterial({ color: 0x1a0e06 })); pu.position.z = 0.09; eye.add(pu); add(eye, 0, 0.4 + 3.95 * big, doorZ + 0.03); }
    { const rune = new THREE.MeshBasicMaterial({ color: 0xffc860, transparent: true, opacity: 0.75 }); for (let i = 0; i < 7; i++) { const r = box(0.08, 0.32, 0.03, rune); r.rotation.z = (i % 2 ? 0.4 : -0.4); add(r, -1.2 * big + i * 0.4 * big, 0.4 + 2.75 * big, doorZ + 0.05); } }
    /* PORTÃO de ferro de duas folhas: uma fechada, a outra aberta para dentro */
    const leaf = () => { const L = new THREE.Group(); for (let i = 0; i < 5; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.1 * big, 5), iron); b.position.set(0.1 + i * 0.2, 1.05 * big, 0); L.add(b); const sp = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.18, 4), iron); sp.position.set(0.1 + i * 0.2, 2.18 * big, 0); L.add(sp); }
      for (const y of [0.3, 1.0, 1.75]) { const h = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.06, 0.05), iron); h.position.set(0.5, y * big, 0); L.add(h); } return L; };
    { const a = leaf(); add(a, -sw / 2, 0.4, doorZ + 0.3); const b = leaf(); b.scale.x = -1; add(b, sw / 2, 0.4, doorZ + 0.3); b.rotation.y = -1.25; }
    /* ESTÁTUAS: dois enlutados encapuzados, de mãos juntas, sobre pedestais, olhando para quem chega */
    for (const sx of [-1, 1]) { const S = new THREE.Group(), sm = toon(0xe4e0e8, 0x16141c);
      const ped = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 0.9), stD); ped.position.y = 0.35; S.add(ped);
      const robe = new THREE.Mesh(new THREE.ConeGeometry(0.48, 1.9, 10, 1, true), sm); robe.position.y = 1.65; S.add(robe);
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.42, 1.6, 10), sm); body.position.y = 1.55; S.add(body);
      const hood = new THREE.Mesh(new THREE.SphereGeometry(0.27, 10, 8, 0, 6.283, 0, 2.2), sm); hood.position.y = 2.72; S.add(hood);
      const face = new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 6), new THREE.MeshBasicMaterial({ color: 0x0a080c })); face.position.set(0, 2.66, 0.12); face.scale.set(1, 1.1, 0.6); S.add(face);
      const hands = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), sm); hands.position.set(0, 2.05, 0.34); S.add(hands);
      for (const w of [-1, 1]) { const wing = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.3, 0.55), sm); wing.position.set(w * 0.32, 2.2, -0.2); wing.rotation.set(0.25, 0, w * 0.25); S.add(wing); }
      S.rotation.y = sx * -0.35; S.scale.setScalar(1.3); add(S, sx * 3.4 * big, 0, doorZ + 1.7); }
    /* braseiros de ferro na frente das estátuas */
    for (const sx of [-1, 1]) brazier(sx * 2.25 * big, doorZ + 2.6, 0xff8a30);
  } else if (T === 'mina') {
    const wood = std(0xffffff, { map: woodTex(0x5a3a22) }), rail = toon(0x3a3a40);
    { const rk = std(0xffffff, { map: rockTex(0x7a7064) }), rkD = std(0x9a948e, { map: rockTex(0x6a6058) }); for (let i = 0; i < 9; i++) { const a = Math.PI * (i / 8), r = 2.0 * big; const k = add(boulder(0.75 + (i % 3) * 0.2, 700 + i, i % 2 ? rk : rkD, 0.85), Math.cos(a) * r, Math.max(0.3, Math.sin(a) * r), doorZ - 0.2); k.rotation.set(i, i * 2, i); }
      for (let i = 0; i < 6; i++) { const b = add(boulder(1.0 + (i % 3) * 0.3, 760 + i, rk, 0.7), (i / 5 - 0.5) * 6.5 * big, 0.6 + (i % 2) * 1.2, doorZ - 1.6 - (i % 3) * 0.6); b.rotation.set(i, i, i); } }
    for (const sx of [-1, 1]) add(box(0.3, 2.8, 0.3, wood), sx * 1.4, 1.4, doorZ + 0.3); add(box(3.4, 0.32, 0.36, wood), 0, 2.8, doorZ + 0.3); add(box(0.25, 0.25, 0.9, wood), 0, 2.8, doorZ + 0.3).rotation.z = 0.785;
    for (const sx of [-0.45, 0.45]) add(box(0.08, 0.08, 4.5, rail), sx, 0.18, doorZ + 2.2);
    for (let i = 0; i < 6; i++) add(box(1.3, 0.08, 0.2, wood), 0, 0.12, doorZ + 0.6 + i * 0.7);
    { const cart = new THREE.Group(); const cb = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.6, 0.8), wood); cb.position.y = 0.55; cart.add(cb); for (const [x, z] of [[-0.4, -0.3], [0.4, -0.3], [-0.4, 0.3], [0.4, 0.3]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.08, 10).rotateZ(Math.PI / 2), rail); w.position.set(x, 0.2, z); cart.add(w); } add(cart, 2.4, 0, doorZ + 2.6).rotation.y = 0.4; }
    lantern(-1.4, doorZ + 0.75, 0xffc060, 2.4); lantern(1.4, doorZ + 0.75, 0xffc060, 2.4); banner(2.9 * big, doorZ + 0.6, d.kind === 'grupo' ? '#6a1a14' : '#4a3a20', d.kind === 'grupo');
  } else {
    /* ---------- boca de caverna: um morro de rocha natural com musgo (ou gelo, ou veios de lava), o arco de pedras em volta da
       abertura, um túnel que escurece para dentro, pingentes no teto da boca, raízes penduradas, pedras soltas e tufos de mato ---------- */
    const mata = T === 'mata' || T === 'toca', gelo = T === 'gelo';
    const rk = std(0xffffff, { map: rockTex(sC, mata ? 0.9 : 0) }), rkD = std(0x9a948e, { map: rockTex(sC, mata ? 0.4 : 0) }), rkIn = std(0x4a4640, { map: rockTex(sC), side: THREE.BackSide });
    const W = sw + 0.7, Ht = 2.55 * big, L = 3.6;
    { const tg = new THREE.CylinderGeometry(W / 2 + 0.05, W / 2 + 0.05, L, 18, 1, true, -Math.PI / 2, Math.PI); tg.rotateX(Math.PI / 2); tg.scale(1, Ht / (W / 2), 1); const tm = new THREE.Mesh(tg, rkIn); add(tm, 0, 0.05, doorZ - L / 2 + 0.2); tm.castShadow = false;
      add(box(W + 0.4, Ht + 0.3, 0.2, dark), 0, (Ht + 0.3) / 2, doorZ - L + 0.2);
      const fc = document.createElement('canvas'); fc.width = 64; fc.height = 64; const g2 = fc.getContext('2d')!; const gr = g2.createRadialGradient(32, 46, 2, 32, 46, 40); gr.addColorStop(0, 'rgba(0,0,0,.92)'); gr.addColorStop(0.7, 'rgba(0,0,0,.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g2.fillStyle = gr; g2.fillRect(0, 0, 64, 64);
      const fog = new THREE.Mesh(new THREE.PlaneGeometry(W + 0.2, Ht + 0.2), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(fc), transparent: true, depthWrite: false })); add(fog, 0, (Ht + 0.2) / 2, doorZ - 0.6); fog.castShadow = false; }
    let sd = 11; const nr = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
    for (let i = 0; i <= 10; i++) { const a = Math.PI * (i / 10), r0 = 0.62 + nr() * 0.35; const b = boulder(r0 * big, 100 + i, i % 3 ? rk : rkD, 0.85); add(b, Math.cos(a) * (W / 2 + 0.5), Math.max(0.3, Math.sin(a) * (Ht + 0.25)), doorZ + 0.05 + (nr() - 0.5) * 0.3); b.rotation.set(nr() * 3, nr() * 3, nr() * 3); }
    const layer = (n: number, y0: number, y1: number, xw: number, z0: number, z1: number, r0: number, r1: number, sd0: number) => { for (let i = 0; i < n; i++) { const t = n === 1 ? 0.5 : i / (n - 1), r = (r0 + nr() * (r1 - r0)) * big; const b = boulder(r, sd0 + i, nr() < 0.3 ? rkD : rk, 0.7 + nr() * 0.3); add(b, (t - 0.5) * 2 * xw + (nr() - 0.5) * 0.6, y0 + nr() * (y1 - y0), z0 + nr() * (z1 - z0)); b.rotation.set(nr() * 3, nr() * 3, nr() * 3); } };
    layer(8, 0.3, 0.9, 4.4 * big, doorZ - 3.4, doorZ - 1.2, 1.0, 1.6, 200);
    layer(6, 1.8, 2.6, 3.2 * big, doorZ - 3.0, doorZ - 1.0, 0.85, 1.3, 300);
    layer(3, 3.1, 3.6, 1.6 * big, doorZ - 2.6, doorZ - 1.3, 0.7, 1.0, 400);
    for (const sx of [-1, 1]) { const b0 = boulder(1.05 * big, 500 + sx, rk, 0.75); add(b0, sx * (W / 2 + 1.1), 0.5, doorZ + 0.5); const b = boulder(0.75 * big, 520 + sx, rk, 0.7); add(b, sx * (W / 2 + 2.3), 0.35, doorZ - 0.4); }
    for (let i = 0; i < 8; i++) { const sx = i % 2 ? 1 : -1, b = boulder(0.16 + nr() * 0.18, 600 + i, rkD, 0.6); add(b, sx * (sw / 2 + 0.75 + nr() * 0.9), 0.12, doorZ + 0.8 + nr() * 3.2); }
    for (let i = 0; i < 6; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.07 + nr() * 0.08, 0.35 + nr() * 0.55, 5), gelo ? new THREE.MeshToonMaterial({ color: 0xcfeeff, emissive: 0x10304a, transparent: true, opacity: 0.9 }) : rkD); c.rotation.x = Math.PI; add(c, (i / 5 - 0.5) * (W - 0.6), Ht - 0.25 - nr() * 0.25, doorZ + 0.1); c.castShadow = false; }
    if (mata) {
      const moss = std(0x5a7a32), mossD = std(0x3e5a24), root = std(0xffffff, { map: woodTex(0x5a4028) });
      for (let i = 0; i < 9; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.5 + nr() * 0.5, 8, 5), i % 2 ? moss : mossD); m.scale.set(1.4, 0.32, 1.1); add(m, (nr() - 0.5) * 6 * big, 2.7 + nr() * 1.4, doorZ - 1.2 - nr() * 2); m.castShadow = false; }
      for (let i = 0; i < 7; i++) { const x0 = (i / 6 - 0.5) * (W + 0.4), len = 0.9 + nr() * 1.4, pts = [new THREE.Vector3(x0, Ht + 0.35, doorZ + 0.15), new THREE.Vector3(x0 + (nr() - 0.5) * 0.3, Ht - len * 0.45, doorZ + 0.32), new THREE.Vector3(x0 + (nr() - 0.5) * 0.4, Ht - len, doorZ + 0.28)];
        const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 8, 0.03 + nr() * 0.03, 4), i % 3 ? root : moss); add(tube, 0, 0, 0); tube.castShadow = false; }
      for (let i = 0; i < 16; i++) { const sx = i % 2 ? 1 : -1, tuft = new THREE.Group(); for (let k = 0; k < 4; k++) { const bl = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.35 + nr() * 0.25, 3), k % 2 ? moss : mossD); bl.position.set((nr() - 0.5) * 0.2, 0.18, (nr() - 0.5) * 0.2); bl.rotation.z = (nr() - 0.5) * 0.6; tuft.add(bl); } add(tuft, sx * (W / 2 + 0.6 + nr() * 2.8), 0, doorZ + 0.2 + nr() * 3.6); }
      bones(doorZ + 1.4); { const lc = T === 'toca' ? 0xffb060 : 0xb8ff8a; lantern(-2.5 * big, doorZ + 2.3, lc); lantern(2.5 * big, doorZ + 2.1, lc); } banner(-3.2 * big, doorZ + 0.9, d.kind === 'grupo' ? '#6a1a14' : '#2a4a2a', d.kind === 'grupo');
      if (d.name.includes('Poço')) { const wx = 3.5 * big, wz = doorZ + 3.0, ring = std(0xffffff, { map: stoneTex(0x7a7468) });
        for (let i = 0; i < 12; i++) { const a = (i / 12) * 6.283; add(box(0.5, 0.75, 0.32, ring), wx + Math.cos(a) * 0.95, 0.37, wz + Math.sin(a) * 0.95).rotation.y = -a; }
        add(new THREE.Mesh(new THREE.CircleGeometry(0.8, 12).rotateX(-Math.PI / 2), dark), wx, 0.72, wz); const wd = std(0xffffff, { map: woodTex(0x5a3a20) });
        for (const sx of [-1, 1]) add(box(0.14, 1.9, 0.14, wd), wx + sx * 1.0, 0.95, wz); add(new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 2.2, 8).rotateZ(Math.PI / 2), wd), wx, 1.8, wz);
        add(new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.0, 5), toon(0xb8a070)), wx + 0.2, 1.3, wz); } }
    else if (gelo) { const ice = new THREE.MeshToonMaterial({ color: 0xcfeeff, emissive: 0x10304a, transparent: true, opacity: 0.92 }), snow = std(0xf2f6ff);
      for (let i = 0; i < 9; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.55 + nr() * 0.5, 8, 5), snow); m.scale.set(1.4, 0.35, 1.1); add(m, (nr() - 0.5) * 6 * big, 2.8 + nr() * 1.4, doorZ - 1.2 - nr() * 2); }
      for (let i = 0; i < 8; i++) { const cl = new THREE.Group(); for (let k = 0; k < 3; k++) { const cr = new THREE.Mesh(new THREE.OctahedronGeometry(0.18 + nr() * 0.2, 0), ice); cr.scale.y = 2.2; cr.position.set((nr() - 0.5) * 0.4, 0.3, (nr() - 0.5) * 0.4); cr.rotation.set((nr() - 0.5) * 0.6, nr() * 3, (nr() - 0.5) * 0.6); cl.add(cr); } add(cl, (i % 2 ? 1 : -1) * (W / 2 + 0.8 + nr() * 2.4), 0, doorZ + 0.4 + nr() * 3); }
      brazier(-2.4 * big, doorZ + 2.3, 0x9ad7ff); brazier(2.4 * big, doorZ + 2.3, 0x9ad7ff); bones(doorZ + 1.4); }
    else { const lava = new THREE.MeshBasicMaterial({ color: 0xff6a1a });
      for (let i = 0; i < 10; i++) { const vein = add(box(0.07, 0.6 + nr() * 0.9, 0.05, lava), (nr() - 0.5) * (W + 2.5), 0.6 + nr() * 2.2, doorZ + 0.45); vein.rotation.z = (nr() - 0.5) * 1.2; vein.castShadow = false; }
      { const s2 = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow(), color: 0xff6a1a, transparent: true, opacity: 0.4, depthWrite: false, blending: THREE.AdditiveBlending })); s2.scale.set(5, 3, 1); add(s2, 0, 1.2, doorZ + 0.6); fx.glow.push(s2); }
      brazier(-2.5 * big, doorZ + 2.3, 0xff7a20); brazier(2.5 * big, doorZ + 2.3, 0xff7a20); banner(3.2 * big, doorZ + 1.0, '#6a1a14', true); }
  }
  /* ---------- a placa entalhada, em dois postes, do lado da escada ---------- */
  { const P = new THREE.Group(), wood = toon(0x4a2e18);
    for (const sx of [-1, 1]) { const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 2.5, 7), wood); post.position.set(sx * 1.6, 1.25, -0.04); P.add(post); const cap = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.22, 7), wood); cap.position.set(sx * 1.6, 2.58, -0.04); P.add(cap); }
    const sub = `${d.kind === 'grupo' ? '⚔ Masmorra' : d.kind === 'subsolo' ? 'Subsolo' : 'Caverna'} · ${d.players}${d.scaled ? ' · acompanha o seu nível' : ''}`;
    const tex = boardTexture(d.name, sub, d.kind === 'grupo');
    const face = new THREE.MeshToonMaterial({ map: tex, emissive: 0x3a2a1a, emissiveMap: tex }); /* a tábua se lê até de noite */
    const board = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.0, 0.1), [wood, wood, wood, wood, face, wood]); board.position.set(0, 1.75, 0.02); board.rotation.x = -0.28; /* inclinada para quem olha de cima */ P.add(board); fine(board); board.userData.dyn = true;
    P.traverse((k) => { const m = k as THREE.Mesh; if (m.isMesh) m.castShadow = true; });
    P.position.set(-3.9 * big - 0.4, 0, 3.6 * big); P.rotation.y = 0.18; g.add(P); }

  function brazier(x: number, z: number, col: number) { const B = new THREE.Group(), iron = toon(0x2a2626);
    for (let i = 0; i < 3; i++) { const a = (i / 3) * 6.283; const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.1, 5), iron); leg.position.set(Math.cos(a) * 0.22, 0.55, Math.sin(a) * 0.22); leg.rotation.set(Math.sin(a) * 0.25, 0, -Math.cos(a) * 0.25); B.add(leg); }
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.24, 0.3, 10, 1, true), iron); bowl.position.y = 1.15; B.add(bowl);
    const coals = new THREE.Mesh(new THREE.CircleGeometry(0.38, 10).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xff5a10 })); coals.position.y = 1.24; B.add(coals);
    const fl = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.75, 7), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })); fl.position.y = 1.62; B.add(fl);
    const l = new THREE.PointLight(col, 7, 9, 1.6); l.position.y = 1.9; B.add(l);
    const gw = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow(), color: col, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending })); gw.scale.set(2.2, 2.2, 1); gw.position.y = 1.7; B.add(gw); fx.glow.push(gw);
    fx.flames.push({ m: fl, l, base: 7, seed: x * 3.1 + z }); add(B, x, 0, z); }
  function lantern(x: number, z: number, col: number, h = 1.9) { const L = new THREE.Group(), wood = toon(0x3a2414);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, h, 6), wood); post.position.y = h / 2; L.add(post);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.06), wood); arm.position.set(0.22, h - 0.05, 0); L.add(arm);
    const cage = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.3, 0.22), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.85 })); cage.position.set(0.45, h - 0.3, 0); L.add(cage);
    const l = new THREE.PointLight(col, 2.6, 6, 1.8); l.position.set(0.45, h - 0.3, 0); L.add(l);
    const gw = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow(), color: col, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending })); gw.scale.set(1.4, 1.4, 1); gw.position.copy(cage.position); L.add(gw); fx.glow.push(gw);
    fx.flames.push({ m: cage, l, base: 2.6, seed: x + z * 2.3 }); add(L, x, 0, z); }
  function bones(z: number) { const bone = toon(0xe0d8c0); for (let i = 0; i < 6; i++) { const b = add(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.45, 5), bone), (i - 2.5) * 0.45 + Math.sin(i) * 0.2, 0.05, z + Math.cos(i * 2) * 0.4); b.rotation.set(Math.PI / 2, 0, i); }
    const sk = add(new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), bone), 1.1, 0.12, z + 0.3); sk.scale.set(1, 0.9, 1.1); }
  function banner(x: number, z: number, col: string, skull: boolean) { const B = new THREE.Group(), wood = toon(0x3a2414);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 3.0, 6), wood); pole.position.y = 1.5; B.add(pole);
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.9, 5).rotateZ(Math.PI / 2), wood); bar.position.set(0, 2.85, 0.05); B.add(bar);
    const cloth = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.6, 1, 6), new THREE.MeshToonMaterial({ map: bannerTexture(col, skull), side: THREE.DoubleSide, transparent: true, alphaTest: 0.5 })); cloth.position.set(0, 2.05, 0.07); B.add(cloth);
    add(B, x, 0, z); }
  for (const s of fx.glow) fine(s);
  return { g, fx };
}

/** chamas e lanternas tremulando (uma chamada por quadro, só para as entradas perto) */
export function flickerEntrance(fx: EntranceFx, t: number) {
  for (const f of fx.flames) { const k = 1 + Math.sin(t * 9 + f.seed) * 0.08 + Math.sin(t * 23 + f.seed * 2) * 0.05; f.m.scale.set(1, k, 1); if (f.l) f.l.intensity = f.base * (0.85 + 0.15 * k); }
  for (const s of fx.glow) (s.material as THREE.SpriteMaterial).opacity = 0.45 + Math.sin(t * 2.3 + s.position.x) * 0.08;
}
