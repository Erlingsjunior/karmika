/* A PREFEITURA DE LUMENHAL (06/11, Erling: "o prédio novo do Prefeito, com salão de atendimento").
   Um palácio cívico de pedra clara: escadaria, pórtico de quatro colunas com o brasão de Lumenhal no frontão, telhado de telha vermelha
   e a torre do relógio com o sino. Dentro, o SALÃO DE ATENDIMENTO: o tapete vermelho da porta até o estrado, a mesa do Prefeito Corvin
   Aldmar, o Livro de Guildas aberto no atril (brilha dourado), a parede dos estandartes, os balcões dos escrivães e os bancos de espera.
   Frente para +z. O que está em `cut` (paredes altas, telhado, torre, lustres) some quando o herói entra (main.ts usa userData.cutBox).
   Entra no mundo como a "biblioteca" variante 2 (world.ts), para usar a mesma colisão, o mesmo recuo e o mesmo corte. */
import * as THREE from 'three';
import { std, ink, stoneTex, plankTex, woodTex, shingleTex } from './toon3d';
import { CUTAWAYS } from './stations3d';

import { PREF_SIZE, PREF_WALLS, PREF_MAYOR } from './predios-dados';
export { PREF_SIZE, PREF_WALLS, PREF_MAYOR };

const canvasTex = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d')!); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
const plate = (label: string) => canvasTex(1024, 128, (g) => { g.fillStyle = '#2a1410'; g.fillRect(0, 0, 1024, 128); g.strokeStyle = '#d9b05a'; g.lineWidth = 6; g.strokeRect(8, 8, 1008, 112); let fs = 64; g.font = `bold ${fs}px Georgia, serif`; while (g.measureText(label).width > 960 && fs > 28) { fs -= 2; g.font = `bold ${fs}px Georgia, serif`; } g.fillStyle = '#f4dca0'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(label, 512, 68); });
/** o brasão de Lumenhal: escudo azul com a torre e o sol dourado */
const CREST = canvasTex(128, 160, (g) => { g.fillStyle = '#d9b05a'; g.beginPath(); g.moveTo(8, 8); g.lineTo(120, 8); g.lineTo(120, 92); g.quadraticCurveTo(64, 170, 8, 92); g.closePath(); g.fill(); g.fillStyle = '#1e3a6a'; g.beginPath(); g.moveTo(16, 16); g.lineTo(112, 16); g.lineTo(112, 90); g.quadraticCurveTo(64, 156, 16, 90); g.closePath(); g.fill();
  g.fillStyle = '#f4dca0'; g.fillRect(52, 60, 24, 56); g.fillRect(48, 52, 32, 10); for (let i = 0; i < 4; i++) g.fillRect(48 + i * 9, 44, 5, 8); g.beginPath(); g.arc(64, 34, 12, 0, 6.283); g.fill(); for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; g.fillRect(64 + Math.cos(a) * 17 - 1.5, 34 + Math.sin(a) * 17 - 1.5, 3, 3); } });
const CLOCK = canvasTex(128, 128, (g) => { g.fillStyle = '#f2ead8'; g.beginPath(); g.arc(64, 64, 60, 0, 6.283); g.fill(); g.strokeStyle = '#2a1a10'; g.lineWidth = 5; g.stroke(); for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; g.fillStyle = '#2a1a10'; g.fillRect(64 + Math.cos(a) * 48 - 3, 64 + Math.sin(a) * 48 - 3, 6, 6); }
  g.lineCap = 'round'; g.lineWidth = 6; g.beginPath(); g.moveTo(64, 64); g.lineTo(64, 28); g.stroke(); g.lineWidth = 4; g.beginPath(); g.moveTo(64, 64); g.lineTo(92, 74); g.stroke(); });
const BOOK = canvasTex(128, 96, (g) => { g.fillStyle = '#f2e6c8'; g.fillRect(0, 0, 128, 96); g.fillStyle = '#c9a24a'; g.fillRect(62, 0, 4, 96); g.fillStyle = 'rgba(60,40,20,.55)'; for (let s = 0; s < 2; s++) for (let y = 12; y < 88; y += 7) g.fillRect(8 + s * 64, y, 40 + ((y * 7) % 13), 2); g.fillStyle = '#8a1a1a'; g.fillRect(10, 8, 30, 4); g.fillRect(74, 8, 30, 4); });
const CARPET = canvasTex(32, 128, (g) => { g.fillStyle = '#7a1a1e'; g.fillRect(0, 0, 32, 128); g.fillStyle = '#c9a24a'; g.fillRect(2, 0, 2, 128); g.fillRect(28, 0, 2, 128); for (let y = 8; y < 128; y += 16) { g.beginPath(); g.moveTo(16, y - 5); g.lineTo(22, y); g.lineTo(16, y + 5); g.lineTo(10, y); g.closePath(); g.fill(); } });
const FLOOR = canvasTex(64, 64, (g) => { for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) { g.fillStyle = (x + y) % 2 ? '#d8ccb4' : '#6a5a48'; g.fillRect(x * 32, y * 32, 32, 32); } g.strokeStyle = 'rgba(0,0,0,.18)'; g.strokeRect(0, 0, 64, 64); });
FLOOR.wrapS = FLOOR.wrapT = THREE.RepeatWrapping; FLOOR.repeat.set(12, 9); CARPET.wrapT = THREE.RepeatWrapping; CARPET.repeat.set(1, 6);

type Out = { group: THREE.Group; glows: { x: number; y: number; z: number; color: number; base: number }[] };
export function buildPrefeitura(label: string): Out {
  const g = new THREE.Group(), cut = new THREE.Group(); g.add(cut); CUTAWAYS.push(cut);
  let into: THREE.Object3D = g;
  const M = (geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0, sh = true) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); ink(o, 0.02); o.castShadow = sh; o.receiveShadow = true; into.add(o); return o; };
  const B = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d), C = (r0: number, r1: number, h: number, s = 12) => new THREE.CylinderGeometry(r0, r1, h, s);
  const glowM = (c: number) => new THREE.MeshBasicMaterial({ color: c });
  const out: Out = { group: g, glows: [] };
  const limestone = std(0xffffff, { map: stoneTex(0xd2c8b4) }), stoneD = std(0xffffff, { map: stoneTex(0x9a9080) }), tiles = std(0xffffff, { map: (() => { const t = shingleTex(0x9a3a26).clone(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(10, 5); t.needsUpdate = true; return t; })() }); /* telha miúda: a textura repete (senão as frestas viram manchas) */
  const wood = std(0xffffff, { map: plankTex(0x6a4226) }), beam = std(0xffffff, { map: woodTex(0x3e2616) }), gold = std(0xe6c46a, { emissive: new THREE.Color(0x3a2a08) }), iron = std(0x2e3036);
  const W = 24, D = 17, H = 8, Z0 = -1, F = 0.6; // corpo: x ±12, z de −9,5 a 7,5

  /* embasamento, piso xadrez e escadaria */
  M(B(W + 1.2, F, D + 1.2), stoneD, 0, F / 2, Z0); M(B(W - 0.4, 0.04, D - 0.4), std(0xffffff, { map: FLOOR }), 0, F + 0.02, Z0, 0, 0, 0, false);
  for (let i = 0; i < 4; i++) M(B(11 - i * 0.5, 0.15, 0.6), limestone, 0, 0.075 + i * 0.15, 10.9 - i * 0.6);
  M(B(11, F, 2.6), limestone, 0, F / 2, 8.9); // o patamar do pórtico

  /* paredes: embaixo inteiras, em cima no corte (some quando o herói entra) */
  const wall = (x0: number, z0: number, x1: number, z1: number, gap = 0) => { const len = Math.hypot(x1 - x0, z1 - z0), ux = (x1 - x0) / len, uz = (z1 - z0) / len, ang = -Math.atan2(uz, ux);
    const seg = (a: number, b: number) => { const px = x0 + ux * (a + b) / 2, pz = z0 + uz * (a + b) / 2; into = g; M(B(b - a, 3.2, 0.6), limestone, px, F + 1.6, pz, 0, ang, 0); into = cut; M(B(b - a, H - 3.2, 0.6), limestone, px, F + 3.2 + (H - 3.2) / 2, pz, 0, ang, 0); into = g; };
    if (gap) { seg(0, len / 2 - gap / 2); seg(len / 2 + gap / 2, len); } else seg(0, len); };
  wall(-12, -9.5, 12, -9.5); wall(-12, -9.5, -12, 7.5); wall(12, -9.5, 12, 7.5); wall(-12, 7.5, 12, 7.5, 4);
  into = cut; M(B(4.6, H - 4.4, 0.6), limestone, 0, F + 4.4 + (H - 4.4) / 2, 7.5); into = g; // a verga em cima da porta (porta alta, de 4,4 m)
  /* cunhais e cornija: o palácio tem linhas firmes */
  into = cut; for (const [x, z] of [[-12, -9.5], [12, -9.5], [-12, 7.5], [12, 7.5]] as const) M(B(1.0, H, 1.0), stoneD, x, F + H / 2, z); M(B(W + 1.4, 0.4, D + 1.4), stoneD, 0, F + H + 0.2, Z0); into = g;

  /* janelas altas em arco, com luz quente (de dia vidro azul, de noite âmbar) */
  const glass = std(0xbfd8f0, { emissive: new THREE.Color(0xffb050), emissiveIntensity: 0.45 });
  const win = (x: number, z: number, ry: number) => { into = cut; M(new THREE.PlaneGeometry(1.4, 2.6), glass, x, F + 4.6, z, 0, ry, 0, false); M(new THREE.CircleGeometry(0.7, 12, 0, Math.PI), glass, x, F + 5.9, z, 0, ry, 0, false); M(B(1.8, 0.18, 0.4), stoneD, x, F + 3.25, z); into = g; };
  for (const sx of [-1, 1]) for (const z of [-6.5, -2, 2.5]) win(sx * 12.32, z, sx * Math.PI / 2);
  for (const x of [-8, -4.4, 4.4, 8]) win(x, 7.82, 0);
  for (const x of [-8, -3, 3, 8]) win(x, -9.82, Math.PI);

  /* pórtico: quatro colunas, entablamento e o frontão com o brasão */
  for (const x of [-4.5, -1.5, 1.5, 4.5]) { M(B(1.0, 0.4, 1.0), stoneD, x, F + 0.2, 9.4); M(C(0.42, 0.5, 6.0, 14), limestone, x, F + 3.4, 9.4); M(B(1.0, 0.35, 1.0), stoneD, x, F + 6.55, 9.4); }
  M(B(11, 0.7, 2.8), limestone, 0, F + 7.05, 8.9);
  { const tri = new THREE.Shape(); tri.moveTo(-5.6, 0); tri.lineTo(5.6, 0); tri.lineTo(0, 2.2); tri.closePath(); M(new THREE.ExtrudeGeometry(tri, { depth: 2.8, bevelEnabled: false }), limestone, 0, F + 7.4, 7.5);
    M(new THREE.PlaneGeometry(1.1, 1.4), std(0xffffff, { map: CREST, transparent: true, alphaTest: 0.5 }), 0, F + 8.25, 10.32, 0, 0, 0, false); }
  { const t = plate(label); M(new THREE.PlaneGeometry(7.4, 0.9), std(0xffffff, { map: t, emissive: new THREE.Color(0x1a0a04), emissiveMap: t }), 0, F + 6.98, 10.32, 0, 0, 0, false); }
  /* a porta de duas folhas, aberta para dentro */
  for (const sx of [-1, 1]) { const hinge = new THREE.Group(); hinge.position.set(sx * 2.0, F, 7.2); hinge.rotation.y = sx * 1.25; g.add(hinge); into = hinge; M(B(1.95, 4.3, 0.12), wood, -sx * 0.98, 2.15, 0); M(B(0.12, 0.12, 0.2), gold, -sx * 1.7, 1.9, 0.1); into = g; } /* as folhas giram nas dobradiças, abertas para dentro */
  /* estandartes de Lumenhal na fachada */
  for (const sx of [-1, 1]) { M(C(0.05, 0.05, 1.4, 6), gold, sx * 7.2, F + 6.4, 8.0, 0, 0, Math.PI / 2, false); M(B(1.2, 3.2, 0.04), std(0x1e3a6a), sx * 7.2, F + 4.7, 8.0, 0, 0, 0, false); M(new THREE.PlaneGeometry(0.8, 1.0), std(0xffffff, { map: CREST, transparent: true, alphaTest: 0.5 }), sx * 7.2, F + 5.1, 8.03, 0, 0, 0, false); }
  /* lanternas na escadaria */
  for (const sx of [-1, 1]) { M(C(0.12, 0.16, 2.6, 8), iron, sx * 6.0, 1.3, 10.4); M(B(0.4, 0.5, 0.4), glowM(0xffc060), sx * 6.0, 2.85, 10.4, 0, 0, 0, false); out.glows.push({ x: sx * 6.0, y: 2.9, z: 10.4, color: 0xffc060, base: 10 }); }

  /* telhado de quatro águas (telha vermelha) e a torre do relógio com o sino */
  into = cut;
  { const top = F + H + 0.4, hw = W / 2 + 0.7, hd = D / 2 + 0.7, rise = 3.4;
    const geo = new THREE.ConeGeometry(1, 1, 4, 1, true); geo.rotateY(Math.PI / 4); geo.scale(hw * Math.SQRT2, rise, hd * Math.SQRT2); M(geo, tiles, 0, top + rise / 2, Z0); /* a escala vai na malha (não no objeto): o contorno acompanha certo */
    const tz = Z0 - 1.5, tb = top + rise * 0.55; M(B(4.2, 6.4, 4.2), limestone, 0, tb + 3.2, tz); M(B(4.6, 0.35, 4.6), stoneD, 0, tb + 6.5, tz);
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; M(new THREE.CircleGeometry(1.25, 24), std(0xffffff, { map: CLOCK, emissive: new THREE.Color(0x2a2010), emissiveMap: CLOCK }), Math.sin(a) * 2.13, tb + 4.6, tz + Math.cos(a) * 2.13, 0, a, 0, false); M(new THREE.TorusGeometry(1.3, 0.1, 6, 24), gold, Math.sin(a) * 2.14, tb + 4.6, tz + Math.cos(a) * 2.14, 0, a, 0, false); }
    for (const [x, z] of [[-1.7, -1.7], [1.7, -1.7], [-1.7, 1.7], [1.7, 1.7]] as const) M(B(0.5, 2.6, 0.5), limestone, x, tb + 8.0, tz + z); // a sineira aberta
    const bell = M(new THREE.CylinderGeometry(0.45, 0.85, 1.2, 14, 1, true), std(0xc8a050, { side: THREE.DoubleSide }), 0, tb + 7.9, tz); void bell; M(new THREE.SphereGeometry(0.18, 8, 6), iron, 0, tb + 7.2, tz);
    M(B(4.6, 0.3, 4.6), stoneD, 0, tb + 9.45, tz); const cap = new THREE.ConeGeometry(3.4, 3.6, 4); cap.rotateY(Math.PI / 4); M(cap, tiles, 0, tb + 11.4, tz);
    M(C(0.05, 0.05, 2.0, 6), gold, 0, tb + 14.1, tz); M(B(1.1, 0.7, 0.03), std(0x1e3a6a), 0.58, tb + 14.6, tz, 0, 0, 0, false);
    out.glows.push({ x: 0, y: tb + 4.6, z: tz + 2.3, color: 0xffe0a0, base: 8 }); }
  /* lustres do salão */
  for (const z of [-3.5, 3]) { M(new THREE.TorusGeometry(1.2, 0.06, 4, 22), iron, 0, F + 6.0, z, Math.PI / 2, 0, 0, false); M(C(0.02, 0.02, 2.0, 4), iron, 0, F + 7.0, z, 0, 0, 0, false);
    for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283; M(new THREE.SphereGeometry(0.07, 6, 4), glowM(0xffd890), Math.cos(a) * 1.2, F + 6.15, z + Math.sin(a) * 1.2, 0, 0, 0, false); } out.glows.push({ x: 0, y: F + 6.0, z, color: 0xffd8a0, base: 20 }); }
  into = g;

  /* DENTRO — o salão de atendimento */
  /* o tapete vermelho da porta até o estrado */
  M(new THREE.PlaneGeometry(2.6, 11.6), std(0xffffff, { map: CARPET }), 0, F + 0.05, 1.2, -Math.PI / 2, 0, 0, false);
  /* o estrado com a mesa e a cadeira alta do Prefeito */
  M(B(11, 0.36, 3.6), stoneD, 0, F + 0.18, -7.6); M(B(11.2, 0.06, 3.8), std(0x6a1a1e), 0, F + 0.39, -7.6, 0, 0, 0, false);
  for (let i = 0; i < 2; i++) M(B(3.2, 0.12, 0.4), stoneD, 0, F + 0.06 + i * 0.12, -5.6 + i * -0.3); // degraus do estrado
  { const desk = new THREE.Group(); desk.position.set(0, F + 0.36, -6.9); g.add(desk); into = desk;
    M(B(4.4, 1.0, 1.4), wood, 0, 0.5, 0); M(B(4.6, 0.1, 1.6), beam, 0, 1.05, 0); M(B(4.0, 0.6, 0.06), std(0x6a1a1e), 0, 0.55, 0.72, 0, 0, 0, false);
    M(B(0.6, 0.05, 0.4), std(0xf2e6c8), -1.0, 1.12, 0.1, 0, 0.2, 0, false); M(B(0.5, 0.05, 0.4), std(0xf2e6c8), 0.9, 1.12, -0.1, 0, -0.3, 0, false); M(C(0.06, 0.08, 0.16, 8), iron, 1.5, 1.18, 0.2); M(C(0.01, 0.01, 0.32, 4), std(0xf4f0e8), 1.55, 1.34, 0.18, 0, 0, 0.4, false); // papéis, tinteiro e pena
    M(B(0.3, 0.12, 0.3), gold, -1.7, 1.16, 0.1); // o carimbo do Prefeito
    M(B(1.4, 0.12, 1.0), wood, 0, 0.6, -1.4); M(B(1.4, 2.8, 0.18), beam, 0, 1.9, -1.9); M(B(1.6, 0.3, 0.26), gold, 0, 3.35, -1.9); for (const sx of [-1, 1]) M(B(0.14, 0.7, 0.9), beam, sx * 0.65, 0.95, -1.4); // a cadeira alta
    into = g; }
  /* o Livro de Guildas no atril: brilha dourado */
  { const at = new THREE.Group(); at.position.set(3.4, F + 0.36, -6.0); at.rotation.y = -0.35; g.add(at); into = at;
    M(C(0.12, 0.22, 1.1, 8), beam, 0, 0.55, 0); M(B(0.9, 0.06, 0.7), beam, 0, 1.15, 0, 0.45, 0, 0); M(new THREE.PlaneGeometry(0.84, 0.6), std(0xffffff, { map: BOOK, emissive: new THREE.Color(0x4a3a10), emissiveMap: BOOK }), 0, 1.2, 0.04, -Math.PI / 2 + 0.45, 0, 0, false);
    M(new THREE.SphereGeometry(0.06, 6, 4), glowM(0xffe8a0), 0, 1.6, 0, 0, 0, 0, false); into = g; out.glows.push({ x: 3.2, y: F + 1.9, z: -5.9, color: 0xffd070, base: 12 }); }
  /* a parede dos estandartes atrás do estrado: o brasão grande e as bandeiras das guildas antigas */
  M(new THREE.PlaneGeometry(2.4, 3.0), std(0xffffff, { map: CREST, transparent: true, alphaTest: 0.5 }), 0, F + 4.6, -9.15, 0, 0, 0, false);
  [0x6a1a1e, 0x1e3a6a, 0x2a5a2a, 0x5a3a7a, 0x8a6a1a, 0x3a3a3a].forEach((c, i) => { const x = (i < 3 ? -1 : 1) * (2.6 + (i % 3) * 1.6); M(C(0.03, 0.03, 1.3, 5), gold, x, F + 5.6, -9.1, 0, 0, Math.PI / 2, false); const b = M(B(1.0, 2.6, 0.03), std(c), x, F + 4.25, -9.12, 0, 0, 0, false); void b; M(B(0.3, 0.3, 0.02), gold, x, F + 4.6, -9.09, 0, 0, Math.PI / 4, false); });
  /* os balcões dos escrivães, um de cada lado, com papéis e um sino de mesa */
  for (const sx of [-1, 1]) { const ct = new THREE.Group(); ct.position.set(sx * 8.6, F, -5.6); ct.rotation.y = sx * -Math.PI / 2; g.add(ct); into = ct;
    M(B(3.6, 1.1, 0.8), wood, 0, 0.55, 0); M(B(3.8, 0.08, 1.0), beam, 0, 1.12, 0); M(B(0.5, 0.04, 0.35), std(0xf2e6c8), -0.8, 1.18, 0, 0, 0.3, 0, false); M(new THREE.SphereGeometry(0.1, 8, 6, 0, 6.283, 0, Math.PI / 2), gold, 0.9, 1.16, 0.1, 0, 0, 0, false);
    M(B(3.6, 2.4, 0.3), beam, 0, 1.6, -1.6); for (let r = 0; r < 3; r++) M(B(3.4, 0.06, 0.4), wood, 0, 0.9 + r * 0.7, -1.4); // o arquivo de pastas atrás
    into = g; }
  /* bancos de espera nas laterais */
  for (const sx of [-1, 1]) for (const z of [-1.2, 2.2, 5.4]) { const bn = new THREE.Group(); bn.position.set(sx * 9.6, F, z); bn.rotation.y = sx * -Math.PI / 2; g.add(bn); into = bn; M(B(2.4, 0.1, 0.6), wood, 0, 0.5, 0); M(B(2.4, 0.6, 0.08), wood, 0, 0.85, -0.28); for (const qx of [-1.0, 1.0]) M(B(0.1, 0.5, 0.5), beam, qx, 0.25, 0); into = g; }
  /* candelabros de pé dos dois lados do estrado */
  for (const sx of [-1, 1]) { M(C(0.08, 0.2, 2.2, 8), gold, sx * 5.2, F + 1.1, -6.2); M(new THREE.SphereGeometry(0.12, 8, 6), glowM(0xffd070), sx * 5.2, F + 2.35, -6.2, 0, 0, 0, false); out.glows.push({ x: sx * 5.2, y: F + 2.4, z: -6.2, color: 0xffc860, base: 12 }); }
  cut.userData.cutBox = { hw: 12, z0: -9.5, z1: 7.8 };
  cut.traverse((o) => { o.userData.keep = true; });
  return out;
}
