/** O Grande Salão de Brasaforja (27/10, refeito em 08/11): a maravilha dos anões, por dentro da Montanha Negra.
 *  08/11 (Erling: "forjas viradas para nós com chamas e pessoas trabalhando; ferro derretido passando em maquinários no teto e caindo em
 *  caldeiras; um tapete detalhado cheio de runas e símbolos como os mosaicos das igrejas contando as batalhas dos anões; trocar as
 *  decorações blocadas por coisas de verdade; trono; lojinhas; o rei"):
 *  - a GRANDE PASSADEIRA de runas e mosaicos (textura desenhada em pixel) do portão ao estrado, com o medalhão do clã diante do trono;
 *  - duas CALHAS DE FERRO FUNDIDO no teto, sobre as naves laterais, com o metal incandescente correndo e despejando em dois CALDEIRÕES;
 *  - duas FORNALHAS GRANDES na parede norte, de boca para a câmera, com bigornas, foles, tinas e racks de ferramentas;
 *  - a FORJA-MÃE e o TRONO no fundo (o Rei Thrain fica no estrado: NPC de interior, main.ts);
 *  - o MERCADO DAS GALERIAS (sudeste) com três bancas de verdade; a mesa do Escriba; o Tesouro com montes de ouro e baús;
 *  - oito colunas colossais com cintas de ouro, relevo e tochas; estandartes do clã; estátuas dos ancestrais em nichos.
 *  Origem local (0,0) = canto noroeste; saída ao sul (z > D). A câmera olha de sudeste: paredes norte e oeste altas, sul e leste baixas. */
import * as THREE from 'three';
import { makeFire } from './sistemas/fogo';
import { std, ink, stoneTex, woodTex, plankTex, ramp } from './toon3d';
import { mergeStatic } from './merge3d';
import type { Interior } from './interiors3d';

const rr = (s: number) => () => { s = (s * 16807) % 2147483647; return s / 2147483647; };

/* ---------- a passadeira: desenhada em pixel, como um mosaico de igreja — bordas de nó, runas, e as faixas que contam a história ---------- */
let carpetT: THREE.Texture | null = null, medalT: THREE.Texture | null = null;
function carpetTex() {
  if (carpetT) return carpetT; const W = 256, H = 1024, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d')!;
  const R = (x: number, y: number, w: number, h: number, c: string) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  const RED = '#5a1416', RED2 = '#6e1a1c', GOLD = '#c9a24a', GOLD2 = '#8a6a2a', BLK = '#1a1416', GREY = '#8a8680', ORG = '#e0702a', BLUE = '#4a90d8';
  R(0, 0, W, H, RED); for (let i = 0; i < 1400; i++) { R(Math.random() * W, Math.random() * H, 2, 2, Math.random() < 0.5 ? RED2 : '#4e1012'); } /* trama */
  /* bordas: faixa de ouro com nó entrelaçado */
  for (const x of [0, W - 22]) { R(x, 0, 22, H, GOLD2); R(x + 3, 0, 16, H, GOLD); for (let y = 0; y < H; y += 16) { R(x + 6, y + 2, 10, 2, GOLD2); R(x + 6, y + 10, 10, 2, GOLD2); R(x + 6, y + 2, 2, 10, GOLD2); R(x + 14, y + 2, 2, 10, GOLD2); R(x + 10, y + 6, 2, 2, BLK); } }
  /* a coluna central de runas (de cima a baixo), em ouro */
  const RUNES = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᚾ', 'ᛁ', 'ᛃ', 'ᛇ', 'ᛈ', 'ᛉ', 'ᛊ', 'ᛏ', 'ᛒ', 'ᛖ', 'ᛗ', 'ᛚ', 'ᛜ', 'ᛞ', 'ᛟ'];
  g.fillStyle = GOLD; g.font = 'bold 18px serif'; g.textAlign = 'center'; for (let y = 24; y < H; y += 26) g.fillText(RUNES[Math.floor(y / 26) % RUNES.length], W / 2, y);
  /* faixas de história a cada 128 px, alternando os lados: a montanha, os martelos cruzados, a parede de escudos, o rio de lava, a bigorna, o Olho fechado */
  const band = (y: number, kind: number) => { const xs = [40, W - 40 - 56]; for (const x0 of xs) { R(x0 - 4, y - 4, 64, 64, GOLD2); R(x0 - 2, y - 2, 60, 60, BLK);
    if (kind === 0) { for (let k = 0; k < 28; k++) R(x0 + k, y + 56 - k, 56 - k * 2, 1, GREY); R(x0 + 26, y + 26, 4, 4, '#ffffff'); R(x0 + 10, y + 50, 36, 6, ORG); } /* a Montanha Negra com a neve e a lava no pé */
    else if (kind === 1) { for (let k = 0; k < 40; k++) { R(x0 + 8 + k, y + 8 + k, 3, 3, GOLD); R(x0 + 48 - k, y + 8 + k, 3, 3, GOLD); } R(x0 + 4, y + 4, 12, 8, GREY); R(x0 + 40, y + 4, 12, 8, GREY); } /* martelos cruzados */
    else if (kind === 2) { for (let k = 0; k < 5; k++) { R(x0 + 4 + k * 10, y + 30, 8, 12, k % 2 ? GOLD : ORG); R(x0 + 7 + k * 10, y + 34, 2, 4, BLK); R(x0 + 6 + k * 10, y + 20, 4, 10, GREY); } R(x0 + 2, y + 44, 54, 2, GREY); } /* a parede de escudos */
    else if (kind === 3) { for (let k = 0; k < 56; k += 4) R(x0 + k, y + 28 + Math.sin(k * 0.4) * 10, 4, 8, ORG); for (let k = 0; k < 10; k++) R(x0 + 4 + k * 5, y + 10, 2, 2, '#ffd27a'); } /* o rio de lava sob as estrelas */
    else if (kind === 4) { R(x0 + 10, y + 36, 36, 8, GREY); R(x0 + 20, y + 44, 16, 10, GREY); R(x0 + 14, y + 54, 28, 3, GREY); R(x0 + 6, y + 30, 44, 6, GREY); R(x0 + 44, y + 32, 10, 4, GREY); R(x0 + 24, y + 16, 8, 14, GOLD); R(x0 + 18, y + 10, 20, 6, GOLD); } /* a bigorna e o martelo erguido */
    else { R(x0 + 8, y + 24, 40, 12, GOLD); R(x0 + 14, y + 28, 28, 4, BLK); R(x0 + 26, y + 20, 4, 20, BLUE); } /* o Olho fechado, da porta de baixo */ } };
  for (let i = 0; i < 7; i++) band(40 + i * 136, i % 6);
  carpetT = new THREE.CanvasTexture(cv); carpetT.colorSpace = THREE.SRGBColorSpace; carpetT.magFilter = THREE.NearestFilter; carpetT.anisotropy = 4; return carpetT;
}
function medalTex() {
  if (medalT) return medalT; const S = 256, cv = document.createElement('canvas'); cv.width = cv.height = S; const g = cv.getContext('2d')!, c = S / 2;
  const ring = (r0: number, r1: number, col: string) => { g.fillStyle = col; g.beginPath(); g.arc(c, c, r1, 0, 6.2832); g.arc(c, c, r0, 0, 6.2832, true); g.fill(); };
  g.clearRect(0, 0, S, S); ring(0, 126, '#8a6a2a'); ring(0, 118, '#5a1416'); ring(96, 104, '#c9a24a'); ring(60, 66, '#c9a24a');
  g.fillStyle = '#c9a24a'; g.font = 'bold 20px serif'; g.textAlign = 'center'; const RU = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊ'; for (let i = 0; i < 16; i++) { const a = i / 16 * 6.2832; g.save(); g.translate(c + Math.cos(a) * 111, c + Math.sin(a) * 111); g.rotate(a + Math.PI / 2); g.fillText(RU[i], 0, 7); g.restore(); }
  for (let i = 0; i < 8; i++) { const a = i / 8 * 6.2832; g.save(); g.translate(c, c); g.rotate(a); g.fillStyle = '#c9a24a'; g.fillRect(-3, -92, 6, 26); g.fillRect(-10, -96, 20, 8); g.restore(); } /* oito martelos */
  g.fillStyle = '#1a1416'; g.beginPath(); g.arc(c, c, 56, 0, 6.2832); g.fill(); /* a bigorna do clã no centro */
  g.fillStyle = '#8a8680'; g.fillRect(c - 36, c - 6, 72, 12); g.fillRect(c - 16, c + 6, 32, 14); g.fillRect(c - 26, c + 20, 52, 5); g.fillRect(c - 44, c - 10, 88, 6); g.fillStyle = '#e0702a'; g.fillRect(c - 6, c - 30, 12, 20);
  medalT = new THREE.CanvasTexture(cv); medalT.colorSpace = THREE.SRGBColorSpace; medalT.magFilter = THREE.NearestFilter; return medalT;
}

export function buildDwarfHall(seed = 5): Interior & { lavaTick(t: number): void } {
  const W = 54, D = 42, H = 15, g = new THREE.Group(), cols: [number, number, number][] = [], rects: [number, number, number, number][] = [], r = rr(seed * 31 + 7);
  const basalt = std(0xffffff, { map: stoneTex(0x3a3634) }), basaltD = std(0xffffff, { map: stoneTex(0x2a2628) }), basaltL = std(0xffffff, { map: stoneTex(0x4e4846) }), gold = std(0xd9b45a), iron = std(0x3a3d44), ironD = std(0x26282c), copper = std(0xb06a3a), wood = std(0xffffff, { map: woodTex(0x4a3220) }), plank = std(0xffffff, { map: plankTex(0x6a4a2c) }), cloth = std(0x7a1a1e, { side: THREE.DoubleSide });
  const glow = (c: number) => new THREE.MeshBasicMaterial({ color: c, toneMapped: false });
  const add = (geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, inked = true, ry = 0) => { const b = new THREE.Mesh(geo, m); if (inked) ink(b, 0.03); b.position.set(x, y, z); b.rotation.y = ry; b.castShadow = true; b.receiveShadow = true; g.add(b); return b; };
  const B = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
  const box = (w: number, h: number, d: number, x: number, y: number, z: number, m: THREE.Material, ry = 0) => add(B(w, h, d), m, x, y + h / 2, z, true, ry);
  const cyl = (rt: number, rb: number, h: number, x: number, y: number, z: number, m: THREE.Material, seg = 12) => add(new THREE.CylinderGeometry(rt, rb, h, seg), m, x, y + h / 2, z);
  const solid = (x: number, z: number, rad: number) => cols.push([x, z, rad]);
  const fixtures: { x: number; y: number; z: number; c: number; i: number; dist: number }[] = [];
  const light = (x: number, y: number, z: number, c: number, i: number, dist = 16) => fixtures.push({ x, y, z, c, i, dist });
  const flame = (x: number, y: number, z: number, s = 1, c: number | 'forge' = 0xffb040) => { const f = makeFire(0.52 * s, c, s < 0.75 ? 'candle' : s >= 1.5 ? (s >= 2.5 ? 'forge' : 'brazier') : 'torch', x * 7 + z * 13 + y); f.position.set(x, y - 0.25 * s, z); g.add(f); return f; };
  const lavaM = new THREE.MeshBasicMaterial({ color: 0xff6a1a, toneMapped: false }); const lavas: THREE.Mesh[] = [];
  const lavaHot = new THREE.MeshBasicMaterial({ color: 0xffd27a, toneMapped: false });

  // chão: lajes de basalto, a grande passadeira do portão ao estrado e o medalhão do clã
  { const dark = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.MeshBasicMaterial({ color: 0x07060a })); dark.rotation.x = -Math.PI / 2; dark.position.set(W / 2, -0.08, D / 2); g.add(dark);
    const t = stoneTex(0x3a3634).clone(); t.repeat.set(W / 2.5, D / 2.5); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.needsUpdate = true; const fl = new THREE.Mesh(new THREE.PlaneGeometry(W, D), std(0xffffff, { map: t })); fl.rotation.x = -Math.PI / 2; fl.position.set(W / 2, 0, D / 2); fl.receiveShadow = true; g.add(fl);
    const run = new THREE.Mesh(new THREE.PlaneGeometry(8, D - 14), std(0xffffff, { map: carpetTex() })); run.rotation.x = -Math.PI / 2; run.position.set(W / 2, 0.02, D / 2 + 6); run.receiveShadow = true; g.add(run);
    const med = new THREE.Mesh(new THREE.CircleGeometry(4.2, 40), std(0xffffff, { map: medalTex(), transparent: true })); med.rotation.x = -Math.PI / 2; med.position.set(W / 2, 0.03, 15); g.add(med);
    for (const sx of [-1, 1]) for (let k = 0; k < 4; k++) { const ins = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), std(0xd9b45a)); ins.rotation.set(-Math.PI / 2, 0, Math.PI / 4); ins.position.set(W / 2 + sx * 6.2, 0.015, 12 + k * 7.5); g.add(ins); } } /* losangos de latão entre as colunas */
  // paredes: norte e oeste altas (rocha escavada, com pilastras e a cornija de ouro), sul e leste baixas; o portão ao sul
  box(W + 1, H, 1.2, W / 2, 0, -0.6, basaltD); box(1.2, H, D + 1, -0.6, 0, D / 2, basaltD);
  for (let k = 0; k <= W / 6; k++) box(1.4, H, 0.8, k * 6, 0, 0.2, basalt); for (let k = 1; k <= D / 6; k++) box(0.8, H, 1.4, 0.2, 0, k * 6, basalt);
  box(W + 1, 0.5, 1.2, W / 2, H - 2.2, 0.0, gold); box(1.2, 0.5, D + 1, 0.0, H - 2.2, D / 2, gold);
  const lowH = 0.7, dw = 6; box((W - dw) / 2, lowH, 0.6, (W - dw) / 4, 0, D + 0.3, basalt); box((W - dw) / 2, lowH, 0.6, W - (W - dw) / 4, 0, D + 0.3, basalt); box(0.6, lowH, D, W + 0.3, 0, D / 2, basalt);
  for (const sx of [-1, 1]) { box(1.6, 7, 1.6, W / 2 + sx * (dw / 2 + 0.8), 0, D + 0.3, basalt); cyl(0.5, 0.35, 0.5, W / 2 + sx * (dw / 2 + 0.8), 7, D + 0.3, iron, 8); flame(W / 2 + sx * (dw / 2 + 0.8), 7.75, D + 0.3, 1.6); light(W / 2 + sx * (dw / 2 + 0.8), 7.6, D - 0.5, 0xff9a3a, 30, 14); }
  // estandartes do clã entre as pilastras da parede oeste e tochas de parede
  for (let k = 0; k < 6; k++) { const z = 5 + k * 6.5; if (k % 2 === 0) { add(new THREE.PlaneGeometry(2.0, 5.5), cloth, 1.1, 8.5, z + 3, false, Math.PI / 2); const em = add(new THREE.PlaneGeometry(0.9, 0.9), gold, 1.14, 9.2, z + 3, false, Math.PI / 2); em.rotation.z = Math.PI / 4; box(2.4, 0.14, 0.14, 1.0, 11.3, z + 3, iron, Math.PI / 2); }
    cyl(0.1, 0.12, 0.6, 1.0, 3.2, z, iron, 6); box(0.5, 0.08, 0.08, 1.2, 3.75, z, iron); flame(1.35, 4.1, z, 1.2); light(1.6, 4.1, z, 0xffa050, 26, 12); }
  for (let k = 0; k < 7; k++) { const x = 5 + k * 7; cyl(0.1, 0.12, 0.6, x, 3.2, 1.0, iron, 6); flame(x, 4.1, 1.35, 1.2); light(x, 4.1, 1.6, 0xffa050, 26, 12); }
  // colunas colossais (duas fileiras de quatro), com base e capitel esculpidos, cintas de ouro, relevo em espiral e tochas nas faces internas
  for (let k = 0; k < 4; k++) for (const sx of [-1, 1]) { const x = W / 2 + sx * 9, z = 11 + k * 7.5; cyl(1.45, 1.7, H, x, 0, z, basalt, 16); cyl(2.2, 2.3, 0.7, x, 0, z, basaltD, 16); cyl(2.0, 2.2, 0.5, x, 0.7, z, basaltL, 16); cyl(2.1, 1.7, 1.0, x, H - 1.6, z, basaltL, 16); cyl(1.85, 1.85, 0.4, x, H - 2.8, z, gold, 16); cyl(1.85, 1.85, 0.4, x, 3.6, z, gold, 16);
    for (let q = 0; q < 6; q++) { const a = q / 6 * Math.PI * 2 + k; const rel = add(B(0.5, 2.6, 0.18), basaltL, x + Math.cos(a) * 1.55, 6.5 + (q % 2) * 2.2, z + Math.sin(a) * 1.55, true, -a + Math.PI / 2); void rel; const ru = add(B(0.22, 0.4, 0.04), copper, x + Math.cos(a) * 1.66, 6.5 + (q % 2) * 2.2, z + Math.sin(a) * 1.66, false, -a + Math.PI / 2); void ru; }
    const tx = x - sx * 1.75; cyl(0.1, 0.12, 0.5, tx, 4.4, z, iron, 6); flame(tx - sx * 0.1, 5.2, z, 1.1); light(tx - sx * 0.8, 5.2, z, 0xffa050, 24, 12);
    solid(x, z, 2.35); }
  // lustres de ferro com velas, pendurados nas vigas
  for (let k = 0; k < 3; k++) { const x = W / 2, z = 14 + k * 10; add(new THREE.CylinderGeometry(0.03, 0.03, H - 7, 4), iron, x, H - 3.5, z, false); const ring = add(new THREE.TorusGeometry(2.2, 0.1, 6, 18), iron, x, 7, z, false); ring.rotation.x = Math.PI / 2;
    for (let q = 0; q < 10; q++) { const a = q / 10 * Math.PI * 2; add(new THREE.CylinderGeometry(0.06, 0.06, 0.4, 5), std(0xe8dcc0), x + Math.cos(a) * 2.2, 7.25, z + Math.sin(a) * 2.2, false); flame(x + Math.cos(a) * 2.2, 7.55, z + Math.sin(a) * 2.2, 0.5); } light(x, 6.5, z, 0xffb060, 36, 20); }

  /* ---------- as CALHAS DE FERRO FUNDIDO no teto e os CALDEIRÕES (Erling: "ferro derretido passando em maquinários no teto e caindo em caldeiras") ---------- */
  const falls: THREE.Mesh[] = [];
  for (const sx of [-1, 1]) { const x = W / 2 + sx * 15, z0 = 3, z1 = D - 9, yT = 8.6;
    box(1.1, 0.5, z1 - z0, x, yT, (z0 + z1) / 2, ironD); for (const s2 of [-1, 1]) box(0.14, 0.7, z1 - z0, x + s2 * 0.5, yT + 0.4, (z0 + z1) / 2, iron); /* a calha */
    const lv = new THREE.Mesh(new THREE.PlaneGeometry(0.8, z1 - z0 - 0.4), lavaM); lv.rotation.x = -Math.PI / 2; lv.position.set(x, yT + 0.62, (z0 + z1) / 2); lv.userData.dyn = true; g.add(lv); lavas.push(lv);
    for (let k = 0; k <= 4; k++) { const z = z0 + k * (z1 - z0) / 4; box(0.4, yT, 0.4, x + sx * 1.4, 0, z, iron); box(2.0, 0.3, 0.5, x + sx * 0.5, yT - 0.3, z, iron); box(0.2, 1.8, 0.2, x + sx * 0.9, yT - 1.9, z, iron, 0).rotation.z = sx * 0.6; } /* postes e mãos-francesas */
    for (let k = 0; k < 5; k++) { const z = z0 + 2 + k * 7; const wheel = add(new THREE.TorusGeometry(0.5, 0.08, 6, 12), iron, x - sx * 0.9, yT + 0.9, z, false); wheel.rotation.y = Math.PI / 2; wheel.userData.dyn = true; wheel.userData.spin = 0.6 + k * 0.1; falls.push(wheel); } /* engrenagens de passo ao lado da calha */
    for (let k = 0; k < 3; k++) light(x, yT + 1.2, z0 + 4 + k * 12, 0xff6a1a, 26, 12);
    /* a bica e a queda incandescente dentro do caldeirão */
    const cz = 11.5; box(0.9, 0.6, 1.6, x, yT + 0.1, cz, ironD); const fall = new THREE.Mesh(new THREE.BoxGeometry(0.34, yT - 2.4, 0.34), lavaM); fall.position.set(x, 2.4 + (yT - 2.4) / 2, cz); fall.userData.dyn = true; g.add(fall); lavas.push(fall);
    const fall2 = new THREE.Mesh(new THREE.BoxGeometry(0.16, yT - 2.4, 0.16), lavaHot); fall2.position.copy(fall.position); fall2.userData.dyn = true; g.add(fall2); falls.push(fall2);
    cyl(1.7, 1.3, 2.2, x, 0, cz, ironD, 14); cyl(1.85, 1.85, 0.25, x, 2.2, cz, iron, 14); cyl(1.75, 1.75, 0.2, x, 0.0, cz, iron, 14); const top = new THREE.Mesh(new THREE.CircleGeometry(1.5, 14), lavaM); top.rotation.x = -Math.PI / 2; top.position.set(x, 2.35, cz); top.userData.dyn = true; g.add(top); lavas.push(top); solid(x, cz, 2.1); light(x, 3.2, cz, 0xff6a1a, 60, 16);
    for (const a of [0.7, 2.3, 3.9, 5.5]) box(0.25, 0.25, 0.6, x + Math.cos(a) * 1.75, 1.8, cz + Math.sin(a) * 1.75, iron, -a); /* argolas de içar */
    const trough = add(B(0.6, 0.4, 3.2), ironD, x, 1.4, cz + 2.9, true); void trough; const tl = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 2.9), lavaM); tl.rotation.x = -Math.PI / 2; tl.position.set(x, 1.62, cz + 2.9); tl.userData.dyn = true; g.add(tl); lavas.push(tl); /* a calha de sangria até os moldes */
    for (let k = 0; k < 4; k++) { box(0.9, 0.3, 0.5, x + sx * 1.6, 0, cz + 2.0 + k * 0.7, basaltD); const bar = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.12, 0.3), k < 2 ? lavaM : std(0x6a6a70)); bar.position.set(x + sx * 1.6, 0.36, cz + 2.0 + k * 0.7); if (k < 2) { bar.userData.dyn = true; lavas.push(bar); } g.add(bar); } /* os moldes com as barras (duas ainda vermelhas) */
    rects.push([x - 2.2, cz - 2.2, x + 2.2, cz + 5.0]);
    /* a estação de trabalho ao lado: bigorna, rack de ferramentas, caixas de minério, tina de têmpera */
    const ax = x + sx * 4.2; box(0.5, 0.6, 1.1, ax, 0, cz + 0.5, iron); box(1.4, 0.3, 0.5, ax, 0.6, cz + 0.5, iron); box(0.3, 0.2, 0.3, ax + 0.75, 0.9, cz + 0.5, iron); solid(ax, cz + 0.5, 0.75);
    cyl(0.5, 0.45, 0.9, ax, 0, cz - 1.6, wood, 10); add(new THREE.CircleGeometry(0.45, 10), std(0x3a6a8a), ax, 0.91, cz - 1.6, false).rotation.x = -Math.PI / 2; solid(ax, cz - 1.6, 0.55);
    for (let q = 0; q < 3; q++) { box(0.8, 0.5, 0.8, ax + sx * 1.2, 0, cz - 0.8 + q * 1.0, plank); add(new THREE.SphereGeometry(0.28, 6, 5), std([0x6a5a50, 0x8a4a3a, 0x4a6a8a][q]), ax + sx * 1.2, 0.6, cz - 0.8 + q * 1.0, false).scale.y = 0.5; } }

  /* ---------- as FORNALHAS GRANDES da parede norte, de boca para a câmera, com bigorna, fole e ferramentas (Erling: "forjas viradas para nós, com chamas") ---------- */
  for (const sx of [-1, 1]) { const x = W / 2 + sx * 19.5, z = 3.0;
    box(6.4, 5.2, 4.2, x, 0, z, basaltD); box(7.0, 0.7, 4.8, x, 5.2, z, basaltL); cyl(0.9, 1.1, H - 6.4, x, 5.9, z - 0.6, basaltD, 10); cyl(1.2, 0.9, 0.5, x, H - 0.6, z - 0.6, iron, 10);
    const arch = add(new THREE.CylinderGeometry(1.8, 1.8, 0.6, 14, 1, false, 0, Math.PI), basaltL, x, 2.6, z + 2.0, true); arch.rotation.set(Math.PI / 2, 0, 0);
    const mouth = add(B(3.4, 2.6, 0.3), glow(0xff5a1a), x, 1.3, z + 2.05, false); mouth.userData.dyn = true; lavas.push(mouth);
    flame(x - 0.7, 1.4, z + 2.3, 2.8, 'forge'); flame(x + 0.8, 1.2, z + 2.3, 2.2, 0xffb040); light(x, 2.4, z + 3.6, 0xff6a2a, 80, 20);
    for (let q = 0; q < 9; q++) add(new THREE.SphereGeometry(0.1, 5, 4), gold, x - 2.8 + q * 0.7, 4.6, z + 2.15, false); box(6.2, 0.25, 0.2, x, 4.3, z + 2.1, copper);
    const cx2 = x - sx * 4.2; /* fole de couro com alavanca */ box(1.6, 0.8, 1.0, cx2, 0.6, z + 1.2, std(0x6a3a2a)); box(0.3, 0.3, 1.4, cx2, 1.0, z + 1.2, wood); box(0.12, 1.6, 0.12, cx2 + sx * 0.9, 0.8, z + 1.0, wood, 0).rotation.z = -sx * 0.5; cyl(0.12, 0.12, 1.8, cx2 - sx * 0.9, 0.4, z + 1.6, iron, 6).rotation.z = sx * 1.2; solid(cx2, z + 1.2, 1.0);
    box(0.5, 0.6, 1.1, x, 0, z + 4.6, iron); box(1.4, 0.3, 0.5, x, 0.6, z + 4.6, iron); solid(x, z + 4.6, 0.75); /* a bigorna na frente */
    box(0.8, 0.9, 0.5, x + sx * 3.9, 0, z + 2.6, plank); for (let q = 0; q < 4; q++) box(0.08, 0.9, 0.08, x + sx * 3.9 - 0.3 + q * 0.2, 0.9, z + 2.5, iron); /* rack de martelos */
    rects.push([x - 3.3, -1, x + 3.3, z + 2.4]); }
  /* ---------- a bancada dos ferreiros do Salão (naves laterais): bigorna grande, tina, mesa de trabalho e moldes ---------- */
  for (const sx of [-1, 1]) { const x = W / 2 + sx * 18, z = 20;
    box(0.6, 0.7, 1.3, x, 0, z, iron); box(1.7, 0.35, 0.6, x, 0.7, z, iron); box(0.35, 0.25, 0.35, x + 0.9, 1.05, z, iron); solid(x, z, 0.9);
    box(2.0, 0.9, 1.0, x - sx * 2.4, 0, z + 1.2, plank); box(2.1, 0.1, 1.1, x - sx * 2.4, 0.9, z + 1.2, wood); for (let q = 0; q < 3; q++) box(0.35, 0.08, 0.6, x - sx * 2.4 - 0.6 + q * 0.6, 1.0, z + 1.2, std([0x8a8a90, 0x6a6a70, 0xb08a40][q])); solid(x - sx * 2.4, z + 1.2, 1.1);
    cyl(0.5, 0.45, 0.9, x + sx * 1.8, 0, z + 1.4, wood, 10); add(new THREE.CircleGeometry(0.45, 10), std(0x3a6a8a), x + sx * 1.8, 0.91, z + 1.4, false).rotation.x = -Math.PI / 2; solid(x + sx * 1.8, z + 1.4, 0.55);
    cyl(0.45, 0.35, 0.7, x, 0, z - 2.2, iron, 8); cyl(0.6, 0.45, 0.25, x, 0.7, z - 2.2, iron, 8); flame(x, 1.2, z - 2.2, 1.6); light(x, 1.6, z - 2.2, 0xff8a3a, 36, 12); solid(x, z - 2.2, 0.7); } /* o braseiro de aquecer */

  /* ---------- o fundo do salão: o trono do Rei aos pés da Forja-Mãe, que recebe a lava dos dutos vindos dos veios da montanha; acima, o Coração ---------- */
  const heart = new THREE.MeshBasicMaterial({ color: 0x4aa0ff, toneMapped: false }); let heartMesh: THREE.Mesh | null = null;
  { const cx = W / 2, z0 = 5.5;
    for (let s0 = 0; s0 < 3; s0++) box(24 - s0 * 2.6, 0.45, 8.6 - s0 * 1.4, cx, s0 * 0.45, z0 + 4.3 - s0 * 0.7, s0 % 2 ? basaltD : basaltL);
    for (const sx of [-1, 1]) for (let s0 = 0; s0 < 3; s0++) box(0.3, 0.3, 8.6 - s0 * 1.4, cx + sx * (12 - s0 * 1.3), s0 * 0.45 + 0.45, z0 + 4.3 - s0 * 0.7, gold); /* filetes de ouro nos degraus */
    rects.push([cx - 12, -1, cx + 12, z0 + 1.0]); // a Forja-Mãe e o fundo do estrado não se pisam
    // o trono: pedestal, assento alto de basalto com ouro, braços com cabeças de carneiro, encosto em ogiva com runas, dossel de ferro e dois braseiros
    box(4.6, 0.5, 3.4, cx, 1.35, z0 + 2.8, basaltD); box(2.6, 1.1, 1.7, cx, 1.85, z0 + 2.8, basaltD); box(2.6, 0.25, 1.7, cx, 2.95, z0 + 2.8, cloth); box(3.0, 5.0, 0.7, cx, 1.85, z0 + 1.8, basalt); add(new THREE.CylinderGeometry(0, 1.6, 1.7, 4), gold, cx, 1.85 + 5.0 + 0.85, z0 + 1.8, true, Math.PI / 4);
    for (const sx of [-1, 1]) { box(0.5, 1.7, 1.9, cx + sx * 1.55, 1.85, z0 + 2.8, gold); add(new THREE.SphereGeometry(0.3, 7, 6), gold, cx + sx * 1.55, 3.7, z0 + 3.7, true); cyl(0.15, 0.15, 5.6, cx + sx * 2.5, 1.85, z0 + 1.5, iron, 6); cyl(0.4, 0.3, 0.5, cx + sx * 3.4, 1.85, z0 + 3.6, iron, 8); flame(cx + sx * 3.4, 2.6, z0 + 3.6, 1.4); }
    box(5.6, 0.3, 2.4, cx, 7.4, z0 + 1.7, iron); add(new THREE.PlaneGeometry(2.2, 1.3), cloth, cx, 6.6, z0 + 2.4, false); add(new THREE.PlaneGeometry(0.8, 0.8), gold, cx, 6.6, z0 + 2.42, false).rotation.z = Math.PI / 4;
    for (let q = 0; q < 5; q++) add(B(0.3, 0.3, 0.1), glow(0xffd27a), cx - 0.9 + q * 0.45, 4.4 + Math.abs(2 - q) * 0.4, z0 + 2.17, false); light(cx, 4.5, z0 + 3.8, 0xffb060, 44, 16); solid(cx, z0 + 2.6, 2.6);
    // a Forja-Mãe: o maciço de basalto com a boca de fogo em arco, a bacia de fusão no alto, os três dutos de lava vindos da rocha e as quedas incandescentes
    const fz = 2.4; box(15, 8, 5.2, cx, 1.35, fz, basaltD); box(16, 0.8, 6.2, cx, 9.35, fz, basaltL); box(12.6, 6.2, 0.5, cx, 2.2, fz + 2.8, basalt);
    add(new THREE.CylinderGeometry(2.4, 2.4, 0.6, 14, 1, false, 0, Math.PI), basaltL, cx, 7.6, fz + 2.95, true).rotation.set(Math.PI / 2, 0, 0); // o arco da boca
    const mouth = add(B(4.6, 4.6, 0.3), glow(0xff5a1a), cx, 5.2, fz + 2.9, false); mouth.userData.dyn = true; lavas.push(mouth); flame(cx - 1.2, 5.2, fz + 3.2, 3.4, 'forge'); flame(cx + 0.8, 5.6, fz + 3.2, 2.8, 'forge'); flame(cx + 1.8, 4.6, fz + 3.2, 2.2, 0xffb040); light(cx, 6.5, fz + 4.5, 0xff6a2a, 90, 26);
    for (let q = 0; q < 2; q++) cyl(2.2, 2.6, 0.9 + q * 0.8, cx, 10.15 - q * 0.3, fz, basaltD, 14); const basin = new THREE.Mesh(new THREE.CircleGeometry(2.0, 14), lavaM); basin.rotation.x = -Math.PI / 2; basin.position.set(cx, 11.2, fz); basin.userData.dyn = true; g.add(basin); lavas.push(basin); light(cx, 12.2, fz + 1, 0xff6a1a, 60, 20);
    for (const [dx, h0] of [[-6, 12.2], [0, 13.4], [6, 12.2]] as [number, number][]) { const x0 = cx + dx, L = 7.5; const duct = add(B(1.1, 0.9, L), basalt, x0 * 0.4 + cx * 0.6, h0 + 1.2, fz - 3.6, true); duct.rotation.set(-0.32, Math.atan2(dx, -8) * 0.5, 0); duct.rotation.x = -0.32;
      const lv = new THREE.Mesh(new THREE.PlaneGeometry(0.6, L - 0.6), lavaM); lv.position.copy(duct.position); lv.position.y += 0.47; lv.rotation.copy(duct.rotation); lv.rotateX(-Math.PI / 2); lv.userData.dyn = true; g.add(lv); lavas.push(lv);
      const fall = new THREE.Mesh(new THREE.BoxGeometry(0.45, 2.6, 0.45), lavaM); fall.position.set(cx + dx * 0.35, 11.2 + 1.3, fz - 0.9); fall.userData.dyn = true; g.add(fall); lavas.push(fall); }
    for (let q = 0; q < 18; q++) { const a = q / 18 * Math.PI * 2; add(new THREE.SphereGeometry(0.12, 5, 4), gold, cx + Math.cos(a) * 7.6, 1.35 + 1.5 + Math.abs(Math.sin(a)) * 5.5, fz + 2.65, false); } // rebites de ouro na face
    rects.push([cx - 8.2, -1, cx + 8.2, fz + 3.2]);
    // os dois anões colossais (colunas esculpidas) com os machados erguidos, um para o outro; o Coração encravado entre as pontas
    for (const sx of [-1, 1]) { const x = cx + sx * 10.5, z = 2.2, m = basalt; cyl(1.9, 2.2, 1.0, x, 0, z, basaltD, 10); box(1.3, 2.0, 1.5, x - 0.9, 1.0, z, m); box(1.3, 2.0, 1.5, x + 0.9, 1.0, z, m); box(3.6, 4.2, 2.4, x, 3.0, z, m); box(4.2, 1.1, 2.7, x, 7.2, z, m); add(new THREE.SphereGeometry(1.3, 9, 7), m, x, 9.3, z, true); box(2.6, 1.2, 2.4, x, 9.8, z, iron); box(1.9, 2.4, 0.9, x, 5.0, z + 1.4, basaltD); for (let k = 0; k < 3; k++) box(0.5, 0.4, 0.3, x - 0.5 + k * 0.5, 4.4 - k * 0.3, z + 1.85, gold);
      const ax = x - sx * 2.5; cyl(0.22, 0.26, 7.6, ax, 2.4, z + 0.6, wood, 6); box(1.3, 0.5, 0.5, ax, 6.4, z + 0.6, basaltD); // o cabo, segurado pelas mãos
      const blade = add(new THREE.CylinderGeometry(0, 1.6, 2.4, 3), std(0xb8bcc4), ax - sx * 0.9, 10.4, z + 0.6, true); blade.rotation.z = sx * Math.PI / 4; // a lâmina de aço, de ponta virada para o centro (90°)
      solid(x, z, 2.4); light(x, 8, z + 3, 0xffb060, 22, 14); }
    heartMesh = new THREE.Mesh(new THREE.OctahedronGeometry(1.5, 0), heart); heartMesh.scale.set(1, 1.75, 0.8); heartMesh.position.set(cx, 11.6, 2.8); heartMesh.userData.dyn = true; g.add(heartMesh);
    const halo = new THREE.Mesh(new THREE.OctahedronGeometry(1.9, 0), new THREE.MeshBasicMaterial({ color: 0x4aa0ff, transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending })); halo.scale.copy(heartMesh.scale); halo.position.copy(heartMesh.position); halo.userData.dyn = true; g.add(halo); (heartMesh as THREE.Mesh & { halo: THREE.Mesh }).halo = halo;
    light(cx, 11.6, 4.2, 0x4aa0ff, 70, 30);
    for (const sx of [-1, 1]) { const x = cx + sx * 16; add(new THREE.PlaneGeometry(2.4, 7), cloth, x, H - 5.6, 0.75, false); add(new THREE.PlaneGeometry(1.2, 1.2), gold, x, H - 6.2, 0.78, false).rotation.z = Math.PI / 4; box(2.8, 0.14, 0.14, x, H - 2.1, 0.8, iron); } }
  // o canal de lava: ao pé da parede norte e descendo pelo leste, com pontes de laje; a lava pulsa (lavaTick)
  const trench = (x0: number, z0: number, x1: number, z1: number) => { const w = x1 - x0, d = z1 - z0; box(w, 0.5, 0.25, (x0 + x1) / 2, 0, z0, basaltD); box(w, 0.5, 0.25, (x0 + x1) / 2, 0, z1, basaltD); box(0.25, 0.5, d, x0, 0, (z0 + z1) / 2, basaltD); box(0.25, 0.5, d, x1, 0, (z0 + z1) / 2, basaltD);
    const l = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.3, d - 0.3), lavaM); l.rotation.x = -Math.PI / 2; l.position.set((x0 + x1) / 2, 0.12, (z0 + z1) / 2); l.userData.dyn = true; g.add(l); lavas.push(l); rects.push([x0 - 0.2, z0 - 0.2, x1 + 0.2, z1 + 0.2]);
    for (let k = 0; k < Math.max(w, d) / 6; k++) light(x0 + (w > d ? 3 + k * 6 : w / 2), 0.8, z0 + (d > w ? 3 + k * 6 : d / 2), 0xff6a1a, 30, 12); };
  { let z = 7.5; for (const bz of [16, 26, D - 6]) { if (bz - 1.3 > z + 0.5) trench(W - 3.2, z, W - 1.2, bz - 1.3); z = bz + 1.3; } }
  for (const z of [16, 26]) box(3.2, 0.3, 2.6, W - 2.2, 0.5, z, basalt); // as pontes de laje sobre a lava
  // o Tesouro do Clã (alcova nordeste): montes de moedas, baús cintados, a coroa velha numa almofada, grade de ferro
  { const x = W - 8, z = 6.5; box(10, 0.3, 6, x, 0, z, basaltD); for (let k = 0; k < 7; k++) { const px = x - 4 + r() * 8, pz = z - 2.2 + r() * 4; const heap = add(new THREE.SphereGeometry(0.6 + r() * 0.6, 9, 6), gold, px, 0.3, pz, true); heap.scale.y = 0.42; for (let q = 0; q < 4; q++) add(new THREE.CylinderGeometry(0.09, 0.09, 0.03, 8), gold, px + (r() - 0.5) * 1.4, 0.32 + r() * 0.2, pz + (r() - 0.5) * 1.2, false); }
    for (let k = 0; k < 3; k++) { const px = x - 3.5 + k * 3.2, pz = z + 2.2; box(1.1, 0.6, 0.7, px, 0.3, pz, plank); box(1.15, 0.2, 0.75, px, 0.9, pz, iron); for (const q of [-0.35, 0.35]) box(0.08, 0.6, 0.72, px + q, 0.3, pz, iron); solid(px, pz, 0.7); }
    box(1.0, 0.6, 1.0, x, 0.3, z - 1.2, basaltL); box(0.8, 0.2, 0.8, x, 0.9, z - 1.2, cloth); add(new THREE.TorusGeometry(0.3, 0.07, 6, 12), gold, x, 1.25, z - 1.2, false).rotation.x = Math.PI / 2; light(x, 1.6, z, 0xffd27a, 24, 10);
    for (const sx of [-1, 1]) box(0.3, 3.4, 0.3, x + sx * 5.2, 0.3, z + 3.4, iron); for (let k = 0; k < 6; k++) box(0.08, 3.0, 0.08, x - 5 + k * 0.5, 0.3, z + 3.4, iron); solid(x - 4, z + 3.4, 1.8); }
  // as estátuas dos ancestrais nos nichos da parede oeste
  for (let k = 0; k < 4; k++) { const z = 7 + k * 9.5 + 3, x = 1.6; box(2.4, 5.2, 0.4, x, 0.2, z, basaltD); box(2.2, 0.3, 0.9, x, 5.4, z + 0.2, basaltL); cyl(0.6, 0.7, 0.5, x, 0.2, z + 0.4, basaltD, 8); box(0.9, 1.5, 0.6, x, 0.7, z + 0.4, basalt); box(0.7, 0.5, 0.5, x, 2.2, z + 0.4, basalt); add(new THREE.SphereGeometry(0.33, 7, 5), basalt, x, 3.0, z + 0.4, true); box(0.6, 0.9, 0.3, x, 1.1, z + 0.8, std(0x8a8a90)); box(0.16, 1.9, 0.16, x + 0.6, 0.8, z + 0.6, wood); box(0.5, 0.3, 0.3, x + 0.6, 2.7, z + 0.6, iron); }
  /* ---------- o Mercado das Galerias (sudeste): três bancas de verdade — balcão de carvalho, prateleiras, toldo de pano, mercadoria à vista ---------- */
  const stall = (x: number, z: number, ry: number, c: number, what: 'armas' | 'comida' | 'gemas') => { const G = new THREE.Group(); G.position.set(x, 0, z); G.rotation.y = ry; g.add(G);
    const A = (geo: THREE.BufferGeometry, m: THREE.Material, lx: number, ly: number, lz: number, rz = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(lx, ly, lz); o.rotation.y = rz; o.castShadow = o.receiveShadow = true; ink(o, 0.02); G.add(o); return o; };
    A(B(3.2, 1.0, 1.0), plank, 0, 0.5, 0); A(B(3.4, 0.12, 1.2), wood, 0, 1.06, 0); for (const sx of [-1, 1]) A(B(0.14, 2.8, 0.14), wood, sx * 1.6, 1.4, -0.9); A(B(3.6, 0.1, 0.1), wood, 0, 2.8, -0.9);
    const awn = A(new THREE.PlaneGeometry(3.8, 1.8), std(c, { side: THREE.DoubleSide }), 0, 2.75, -0.1); awn.rotation.x = -0.45; A(B(3.2, 0.9, 0.3), plank, 0, 2.0, -1.4); A(B(3.2, 0.06, 0.4), wood, 0, 1.6, -1.4); A(B(3.2, 0.06, 0.4), wood, 0, 2.25, -1.4);
    if (what === 'armas') { for (let q = 0; q < 4; q++) { A(B(0.08, 1.2, 0.04), std(0xb8bcc4), -1.2 + q * 0.8, 2.1, -1.2); A(B(0.3, 0.08, 0.06), gold, -1.2 + q * 0.8, 1.7, -1.2); } A(new THREE.CylinderGeometry(0.42, 0.42, 0.06, 12), std(0x7a3a2a), 1.0, 1.15, 0.1).rotation.x = -0.2; A(B(0.9, 0.12, 0.12), wood, -0.8, 1.15, 0.1); A(B(0.4, 0.3, 0.14), iron, -0.3, 1.2, 0.1); }
    else if (what === 'comida') { for (let q = 0; q < 3; q++) A(new THREE.CylinderGeometry(0.34, 0.3, 0.8, 9), wood, -1.0 + q * 1.0, 0.4, 0.9); for (let q = 0; q < 5; q++) A(new THREE.SphereGeometry(0.16, 6, 5), std([0xc9a24a, 0x8a3a2a, 0xd8c070, 0x6a3a1a, 0xa0603a][q]), -1.2 + q * 0.6, 1.25, 0); A(new THREE.CylinderGeometry(0.12, 0.1, 0.4, 7), std(0x6a4a2a), -1.2, 1.95, -1.3); A(new THREE.CylinderGeometry(0.12, 0.1, 0.4, 7), std(0x6a4a2a), -0.7, 1.95, -1.3); A(B(0.6, 0.25, 0.3), std(0x8a4a3a), 0.6, 1.9, -1.3); }
    else { for (let q = 0; q < 4; q++) { const gem = A(new THREE.OctahedronGeometry(0.14, 0), glow([0x8ad0ff, 0xd0ff8a, 0xff8ad0, 0xffd27a][q]), -1.0 + q * 0.66, 1.25, 0); gem.userData.dyn = true; } for (let q = 0; q < 3; q++) A(new THREE.CylinderGeometry(0.08, 0.1, 0.3, 7), std([0xff6a3a, 0x4aa0ff, 0x6aff9a][q]), -0.9 + q * 0.9, 2.1, -1.3); A(B(1.2, 0.3, 0.3), plank, 0.8, 1.27, 0.1); }
    cols.push([x, z, 1.9]); };
  stall(44, 31, Math.PI, 0x7a1a1e, 'armas'); stall(47, 27, Math.PI / 2 + Math.PI, 0x3a5a8a, 'comida'); stall(41, 35.5, Math.PI, 0x4a6a3a, 'gemas');
  for (const [x, z] of [[46.5, 33.5], [43.5, 28.5]]) { cyl(0.36, 0.32, 0.9, x, 0, z, wood, 10); box(0.7, 0.7, 0.7, x + 0.9, 0, z + 0.4, plank); }
  /* a mesa do Escriba Real: o grande livro das barras, tinteiro, pena e velas */
  { const x = 7, z = 28; box(2.2, 0.9, 1.0, x, 0, z, plank); box(2.4, 0.1, 1.2, x, 0.9, z, wood); box(1.1, 0.14, 0.8, x - 0.3, 1.0, z, std(0x5a1a14)); box(1.0, 0.06, 0.7, x - 0.3, 1.14, z, std(0xe8dcc0)); cyl(0.05, 0.06, 0.1, x + 0.7, 1.0, z - 0.2, std(0x1a1a2a), 8); add(new THREE.ConeGeometry(0.02, 0.4, 4), std(0xf0ece0), x + 0.7, 1.3, z - 0.2, false).rotation.z = 0.5;
    for (const dx of [-0.95, 0.95]) { cyl(0.05, 0.06, 0.35, x + dx, 1.0, z + 0.3, std(0xe8dcc0), 6); flame(x + dx, 1.42, z + 0.3, 0.45); } light(x, 1.6, z, 0xffc070, 16, 7); solid(x, z, 1.4);
    for (let k = 0; k < 3; k++) { box(0.8, 1.9 + k * 0.3, 0.4, 1.4, 0.2, z - 2.6 + k * 1.0, plank); for (let q = 0; q < 5; q++) box(0.16, 0.5, 0.3, 1.4, 0.9 + q * 0.3 - (q % 2) * 0.15, z - 2.75 + k * 1.0 + (q - 2) * 0.07, std([0x6a1a1a, 0x1a3a5a, 0x3a5a2a, 0x5a3a1a, 0x4a4a6a][q])); } } /* as estantes dos registros */

  // luzes: um pool de 10 fontes que acompanha quem anda (como na Catedral); a lava pulsa; as engrenagens giram; o fio quente da queda treme
  { const amb = new THREE.HemisphereLight(0xffc088, 0x3a2418, 1.15); g.add(amb); const sun = new THREE.DirectionalLight(0xffd0a0, 0.35); sun.position.set(W / 2 + 20, 30, D + 30); sun.target.position.set(W / 2, 0, D / 2); g.add(sun); g.add(sun.target); } /* 08/11: mais claro — o salão era uma caverna escura */
  for (const f of fixtures) f.i *= 1.5;
  const pool: THREE.PointLight[] = []; for (let k = 0; k < 14; k++) { const l = new THREE.PointLight(0xffb060, 0, 14, 1.6); g.add(l); pool.push(l); }
  const lights: { l: THREE.PointLight; base: number; ph: number }[] = []; let lastHx = -1e9, lastHz = -1e9;
  const flicker = (t: number, hx = W / 2, hz = D / 2) => {
    if (Math.hypot(hx - lastHx, hz - lastHz) > 3) { lastHx = hx; lastHz = hz; const near = [...fixtures].sort((a, b) => Math.hypot(a.x - hx, a.z - hz) - Math.hypot(b.x - hx, b.z - hz)).slice(0, pool.length); lights.length = 0; pool.forEach((l, k) => { const f = near[k]; if (!f) { l.intensity = 0; return; } l.position.set(f.x, f.y, f.z); l.color.setHex(f.c); l.distance = f.dist; lights.push({ l, base: f.i, ph: k * 1.7 }); }); }
    for (const l of lights) l.l.intensity = l.base * (0.9 + 0.1 * Math.sin(t * 9 + l.ph) + 0.05 * Math.sin(t * 23 + l.ph * 2));
    lavaM.color.setHex(0xff6a1a).offsetHSL(0, 0, 0.06 * Math.sin(t * 1.3));
    for (const f of falls) { if (f.userData.spin) f.rotation.x = t * (f.userData.spin as number); else f.scale.x = f.scale.z = 0.8 + 0.4 * Math.abs(Math.sin(t * 7 + f.position.x)); }
    if (heartMesh) { const k = Math.max(0, Math.sin(t * 0.35)) ** 6; heart.color.setHex(0x4aa0ff).lerp(new THREE.Color(0xff4a3a), k); ((heartMesh as THREE.Mesh & { halo: THREE.Mesh }).halo.material as THREE.MeshBasicMaterial).color.copy(heart.color); heartMesh.rotation.y = t * 0.25; heartMesh.scale.set(1 + 0.03 * Math.sin(t * 2), 1.75 + 0.05 * Math.sin(t * 2), 0.8); }
    void lavas;
  };
  const free = (x: number, z: number) => {
    if (x < 0.5 || x > W - 0.5 || z < 0.5) return false;
    if (z > D - 0.1) return Math.abs(x - W / 2) < dw / 2 - 0.3;
    for (const [cx, cz, rad] of cols) if (Math.abs(x - cx) < rad && Math.abs(z - cz) < rad && Math.hypot(x - cx, z - cz) < rad) return false;
    for (const [x0, z0, x1, z1] of rects) if (x > x0 && x < x1 && z > z0 && z < z1) return false;
    return true;
  };
  mergeStatic(g, ramp);
  return { group: g, W, D, colliders: cols, free, flicker, exitZ: D + 0.9, lavaTick: (t) => flicker(t) };
}
