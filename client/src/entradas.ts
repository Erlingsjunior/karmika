import * as THREE from 'three';

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
  /* no mundo a resolução é de pixel art: letra miúda vira borrão. A tábua leva um PICTOGRAMA grande, pintado em ouro velho
     (escada descendo; com crânio e espadas se for masmorra de grupo), e o nome aparece em letra nítida quando você chega perto */
  g.lineJoin = 'round'; const paint = (draw: () => void) => { g.save(); g.lineWidth = 22; g.strokeStyle = 'rgba(16,8,2,.95)'; g.fillStyle = 'rgba(16,8,2,.95)'; draw(); g.restore(); g.save(); g.lineWidth = 12; g.strokeStyle = group ? '#ff9a7a' : '#f0c878'; g.fillStyle = group ? '#ff9a7a' : '#f0c878'; draw(); g.restore(); };
  paint(() => { g.beginPath(); g.moveTo(W / 2 - 150, 60); for (let i = 0; i < 4; i++) { g.lineTo(W / 2 - 150 + i * 70, 60 + i * 30); g.lineTo(W / 2 - 150 + (i + 1) * 70, 60 + i * 30); } g.stroke(); /* a escada descendo */
    g.beginPath(); g.moveTo(W / 2 + 150, 52); g.lineTo(W / 2 + 150, 182); g.stroke(); g.beginPath(); g.moveTo(W / 2 + 120, 150); g.lineTo(W / 2 + 150, 184); g.lineTo(W / 2 + 180, 150); g.stroke(); });
  if (group) paint(() => { g.beginPath(); g.arc(W / 2 - 250, 105, 32, 0, 6.283); g.fill(); g.fillRect(W / 2 - 272, 120, 44, 30); });
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
  const box = (w: number, h: number, dd: number, m: THREE.Material) => new THREE.Mesh(new THREE.BoxGeometry(w, h, dd), m);
  const big = d.kind === 'grupo' ? 1.3 : 1;
  const T = d.theme;
  const stone = toon(T === 'gelo' ? 0x9ab4cc : T === 'magma' ? 0x4a3a36 : T === 'mata' || T === 'toca' ? 0x6a6656 : T === 'mina' ? 0x6e6458 : 0x8e8a96, 0x060508);
  const stoneD = toon(T === 'gelo' ? 0x6a86a0 : T === 'magma' ? 0x2e2422 : T === 'mata' || T === 'toca' ? 0x4a4a3c : T === 'mina' ? 0x4e463c : 0x625e6e, 0x040306);
  const dark = new THREE.MeshBasicMaterial({ color: 0x020103 });
  const inner = T === 'cripta' ? 0xff5a3a : T === 'gelo' ? 0x7ad0ff : T === 'magma' ? 0xff7a20 : T === 'mata' || T === 'toca' ? 0x9aff6a : 0xffb060;

  /* ---------- a escadaria: sobe-se três degraus até o patamar e dali ela DESCE, entre muros, até a boca escura ----------
     (o terreno não tem buraco: por isso a descida fica dentro de um corpo de pedra elevado, e os degraus são maciços até o chão) */
  const sw = 2.1 * big, yTop = 1.25, nDown = 7, stepD = 0.42;
  for (let i = 0; i < 3; i++) { const h = 0.32 * (i + 1); add(box(sw + 0.6, h, 0.42, i === 2 ? stone : stoneD), 0, h / 2, 3.35 * big - i * 0.42); } /* subida */
  add(box(sw + 1.4, yTop, 0.8, stone), 0, yTop / 2, 3.35 * big - 1.5); /* patamar */
  const z0 = 3.35 * big - 1.9;
  for (let i = 0; i < nDown; i++) { const k = i / (nDown - 1), top = yTop - (i + 1) * 0.16; const m = toon(new THREE.Color(stone.color).lerp(new THREE.Color(0x060505), 0.1 + k * 0.85).getHex());
    add(box(sw, Math.max(0.05, top), stepD, m), 0, Math.max(0.05, top) / 2, z0 - i * stepD); }
  const zEnd = z0 - nDown * stepD, wallL = z0 - zEnd + 1.2;
  for (const sx of [-1, 1]) { add(box(0.5, yTop + 0.45, wallL, stoneD), sx * (sw / 2 + 0.25), (yTop + 0.45) / 2, (z0 + zEnd) / 2 + 0.3); add(box(0.62, 0.14, wallL + 0.05, stone), sx * (sw / 2 + 0.25), yTop + 0.5, (z0 + zEnd) / 2 + 0.3); }
  const doorZ = zEnd + 0.1;
  /* a boca: o escuro no fim da escada, e uma luz fraca lá dentro */
  add(box(sw + 0.1, 2.4 * big, 0.12, dark), 0, 1.2 * big, doorZ);
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
  } else if (T === 'mata' || T === 'toca') {
    /* caverna de mata / o Poço do Atoleiro: arco de pedras musgosas, raízes que descem, ossos na entrada, lanternas do pântano */
    const moss = toon(0x4a6a2a), root = toon(0x4a3420);
    for (let i = 0; i < 9; i++) { const a = Math.PI * (i / 8), r = 1.9 * big; const s = 0.7 + (i % 3) * 0.22; const k = add(new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), i % 3 === 0 ? moss : stone), Math.cos(a) * r, Math.sin(a) * r * 1.05, doorZ - 0.1); k.rotation.set(i, i * 2, i); }
    for (let i = 0; i < 5; i++) { const rt = add(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.1, 1.6 + (i % 2) * 0.6, 5), root), -1.2 + i * 0.6, 1.4 + (i % 2) * 0.2, doorZ + 0.1); rt.rotation.z = (i - 2) * 0.18; }
    if (d.name.includes('Poço')) { /* o poço velho que dá nome ao lugar: anel de pedra, sarilho e corda, ao lado da escada */
      const wx = 3.4 * big, wz = doorZ + 2.9;
      for (let i = 0; i < 12; i++) { const a = (i / 12) * 6.283; add(box(0.5, 0.75, 0.32, i % 2 ? stone : stoneD), wx + Math.cos(a) * 0.95, 0.37, wz + Math.sin(a) * 0.95).rotation.y = -a; }
      add(new THREE.Mesh(new THREE.CircleGeometry(0.8, 12).rotateX(-Math.PI / 2), dark), wx, 0.7, wz);
      for (const sx of [-1, 1]) add(box(0.14, 1.9, 0.14, toon(0x5a3a20)), wx + sx * 1.0, 0.95, wz); add(new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 2.2, 8).rotateZ(Math.PI / 2), toon(0x5a3a20)), wx, 1.8, wz);
      add(new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.0, 5), toon(0xb8a070)), wx + 0.2, 1.3, wz); }
    bones(doorZ + 1.2); lantern(-2.4 * big, doorZ + 2.2, 0xa8ff7a); lantern(2.4 * big, doorZ + 2.0, 0xa8ff7a); banner(-2.9 * big, doorZ + 0.6, d.kind === 'grupo' ? '#6a1a14' : '#2a4a2a', d.kind === 'grupo');
  } else if (T === 'mina') {
    const wood = toon(0x5a3a22), rail = toon(0x3a3a40);
    for (let i = 0; i < 8; i++) { const a = Math.PI * (i / 7), r = 2.0 * big; const k = add(new THREE.Mesh(new THREE.DodecahedronGeometry(0.8 + (i % 3) * 0.2, 0), stone), Math.cos(a) * r, Math.sin(a) * r, doorZ - 0.2); k.rotation.set(i, i, i); }
    for (const sx of [-1, 1]) add(box(0.3, 2.8, 0.3, wood), sx * 1.4, 1.4, doorZ + 0.3); add(box(3.4, 0.32, 0.36, wood), 0, 2.8, doorZ + 0.3); add(box(0.25, 0.25, 0.9, wood), 0, 2.8, doorZ + 0.3).rotation.z = 0.785;
    for (const sx of [-0.45, 0.45]) add(box(0.08, 0.08, 4.5, rail), sx, 0.18, doorZ + 2.2);
    for (let i = 0; i < 6; i++) add(box(1.3, 0.08, 0.2, wood), 0, 0.12, doorZ + 0.6 + i * 0.7);
    { const cart = new THREE.Group(); const cb = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.6, 0.8), wood); cb.position.y = 0.55; cart.add(cb); for (const [x, z] of [[-0.4, -0.3], [0.4, -0.3], [-0.4, 0.3], [0.4, 0.3]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.08, 10).rotateZ(Math.PI / 2), rail); w.position.set(x, 0.2, z); cart.add(w); } add(cart, 2.4, 0, doorZ + 2.6).rotation.y = 0.4; }
    lantern(-1.4, doorZ + 0.75, 0xffc060, 2.4); lantern(1.4, doorZ + 0.75, 0xffc060, 2.4); banner(2.9 * big, doorZ + 0.6, d.kind === 'grupo' ? '#6a1a14' : '#4a3a20', d.kind === 'grupo');
  } else if (T === 'gelo') {
    const ice = new THREE.MeshToonMaterial({ color: 0xbfe6ff, emissive: 0x10304a, transparent: true, opacity: 0.92 });
    for (let i = 0; i < 9; i++) { const a = Math.PI * (i / 8), r = 2.0 * big; const k = add(new THREE.Mesh(new THREE.DodecahedronGeometry(0.75 + (i % 3) * 0.25, 0), i % 2 ? ice : stone), Math.cos(a) * r, Math.sin(a) * r * 1.1, doorZ - 0.1); k.rotation.set(i, i * 2, i); }
    for (let i = 0; i < 7; i++) { const c = add(new THREE.Mesh(new THREE.ConeGeometry(0.12 + (i % 3) * 0.05, 0.9 + (i % 3) * 0.4, 5), ice), -1.3 + i * 0.43, 2.0 + (i % 2) * 0.15, doorZ + 0.25); c.rotation.x = Math.PI; } /* pingentes */
    for (let i = 0; i < 6; i++) { const cr = add(new THREE.Mesh(new THREE.OctahedronGeometry(0.3 + (i % 3) * 0.15, 0), ice), (i % 2 ? 1 : -1) * (2.6 + (i % 3) * 0.4), 0.3 + (i % 3) * 0.15, doorZ + 0.8 + i * 0.3); cr.rotation.set(i, i, 0); }
    brazier(-2.3 * big, doorZ + 2.2, 0x9ad7ff); brazier(2.3 * big, doorZ + 2.2, 0x9ad7ff); bones(doorZ + 1.3);
  } else { /* magma e o resto: arco de rocha negra com veios de lava */
    const lava = new THREE.MeshBasicMaterial({ color: 0xff6a1a });
    for (let i = 0; i < 9; i++) { const a = Math.PI * (i / 8), r = 2.1 * big; const k = add(new THREE.Mesh(new THREE.DodecahedronGeometry(0.85 + (i % 3) * 0.25, 0), stone), Math.cos(a) * r, Math.sin(a) * r * 1.05, doorZ - 0.1); k.rotation.set(i, i * 2, i); }
    for (let i = 0; i < 5; i++) add(box(0.08, 0.9 + (i % 2) * 0.5, 0.06, lava), -1.6 + i * 0.8, 1.2 + (i % 2) * 0.6, doorZ + 0.32).rotation.z = (i - 2) * 0.3;
    brazier(-2.4 * big, doorZ + 2.2, 0xff7a20); brazier(2.4 * big, doorZ + 2.2, 0xff7a20); banner(2.9 * big, doorZ + 0.8, '#6a1a14', true);
  }

  /* ---------- a placa entalhada, em dois postes, do lado da escada ---------- */
  { const P = new THREE.Group(), wood = toon(0x4a2e18);
    for (const sx of [-1, 1]) { const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 2.5, 7), wood); post.position.set(sx * 1.6, 1.25, -0.04); P.add(post); const cap = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.22, 7), wood); cap.position.set(sx * 1.6, 2.58, -0.04); P.add(cap); }
    const sub = `${d.kind === 'grupo' ? '⚔ Masmorra' : d.kind === 'subsolo' ? 'Subsolo' : 'Caverna'} · ${d.players}${d.scaled ? ' · acompanha o seu nível' : ''}`;
    const tex = boardTexture(d.name, sub, d.kind === 'grupo');
    const face = new THREE.MeshToonMaterial({ map: tex, emissive: 0x3a2a1a, emissiveMap: tex }); /* a tábua se lê até de noite */
    const board = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.0, 0.1), [wood, wood, wood, wood, face, wood]); board.position.set(0, 1.75, 0.02); board.rotation.x = -0.28; /* inclinada para quem olha de cima */ P.add(board);
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
    const l = new THREE.PointLight(col, 4, 7, 1.7); l.position.set(0.45, h - 0.3, 0); L.add(l);
    const gw = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow(), color: col, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending })); gw.scale.set(1.4, 1.4, 1); gw.position.copy(cage.position); L.add(gw); fx.glow.push(gw);
    fx.flames.push({ m: cage, l, base: 4, seed: x + z * 2.3 }); add(L, x, 0, z); }
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
