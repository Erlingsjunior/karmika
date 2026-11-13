/* 13/11 O GRANDE SALÃO DO TEAR (Erling: "um grande salão com uma mesa redonda estilo a távola redonda… e na parede atrás da cadeira do Mestre do Tear a Vapor
   uma parede imensa onde vários carretéis de fios saem e seus fios entram na parede e sobem até o teto, depois descem e vão para a régua do tear, a máquina a vapor
   que funciona o tempo todo tecendo a história e o destino de Karmika; do outro lado sai a obra pronta… rolos e mais rolos de tecido são empilhados e abaixo deles
   temos o saguão das obras"; "uma mesa gigante de pedra com 144 lugares fora o lugar principal do Mestre… um símbolo bonito no meio que se expande para as pontas
   em direção às cadeiras e cada cadeira traz a bandeira do seu próprio servidor").
   Primeira tentativa, para ver a máquina funcionando ao lado da sala da Távola. Planta (m; origem no canto noroeste; a porta fica ao sul, no meio):
     oeste    = a Távola Kármika: mesa de pedra de 40 m, 144 cadeiras com bandeira e o trono do Mestre (ao norte, de costas para a Parede dos Carretéis)
     norte    = a Parede dos Carretéis (144 carretéis; os fios sobem a parede, correm pela viga do teto e descem para a régua)
     leste    = o Tear a Vapor (caldeiras, volantes, pistões, a régua batendo, a lançadeira indo e vindo) e o tecido saindo para o grande rolo
     sudeste  = os rolos empilhados e o Saguão das Obras */
import * as THREE from 'three';
import { std, ink, stoneTex, woodTex } from './toon3d';
import type { Interior } from './interiors3d';

const hash = (i: number) => { let v = Math.imul(i * 374761393 + 668265263, 1274126177) >>> 0; v ^= v >>> 13; v = Math.imul(v, 1103515245) >>> 0; return (v >>> 8) / 16777216; };
const N = 144;

function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d')!, w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }

/** o símbolo da mesa: o Olho no centro, o labirinto em anéis e um raio de ouro para cada cadeira */
function mesaTex() { return canvasTex(1024, 1024, (g, s) => { const c = s / 2;
  g.fillStyle = '#6f6a62'; g.fillRect(0, 0, s, s); for (let i = 0; i < 2600; i++) { const v = 90 + Math.floor(hash(i) * 50); g.fillStyle = `rgba(${v},${v - 4},${v - 10},.35)`; g.fillRect(hash(i + 7) * s, hash(i + 13) * s, 2 + hash(i + 3) * 5, 2 + hash(i + 5) * 4); }
  g.strokeStyle = '#e0b048'; g.lineCap = 'round';
  for (let i = 0; i <= N; i++) { const a = (i / (N + 1)) * Math.PI * 2; g.lineWidth = i === 0 ? 5 : 1.6; g.globalAlpha = i === 0 ? 1 : 0.75; g.beginPath(); g.moveTo(c + Math.cos(a) * s * 0.3, c + Math.sin(a) * s * 0.3); g.lineTo(c + Math.cos(a) * s * 0.492, c + Math.sin(a) * s * 0.492); g.stroke(); }
  g.globalAlpha = 1;
  for (let k = 0; k < 6; k++) { const r = s * (0.08 + k * 0.04), gap = hash(k + 40) * 6.283; g.lineWidth = 6; g.beginPath(); g.arc(c, c, r, gap + 0.35, gap + Math.PI * 2 - 0.1); g.stroke(); const a2 = gap + 2.2 + k; g.beginPath(); g.moveTo(c + Math.cos(a2) * r, c + Math.sin(a2) * r); g.lineTo(c + Math.cos(a2) * (r + s * 0.04), c + Math.sin(a2) * (r + s * 0.04)); g.stroke(); }
  g.lineWidth = 8; g.beginPath(); g.arc(c, c, s * 0.3, 0, 6.283); g.stroke(); g.lineWidth = 3; g.beginPath(); g.arc(c, c, s * 0.496, 0, 6.283); g.stroke();
  g.fillStyle = '#1a1420'; g.beginPath(); g.ellipse(c, c, s * 0.062, s * 0.036, 0, 0, 6.283); g.fill(); g.lineWidth = 5; g.stroke(); g.fillStyle = '#ffd24a'; g.beginPath(); g.arc(c, c, s * 0.02, 0, 6.283); g.fill(); g.fillStyle = '#1a1420'; g.beginPath(); g.arc(c, c, s * 0.008, 0, 6.283); g.fill(); }); }

/** o tecido que sai do tear: corredores de labirinto tecidos em fios de muitas cores (repete na direção em que rola) */
function tecidoTex() { const t = canvasTex(512, 512, (g, s) => { g.fillStyle = '#2a2236'; g.fillRect(0, 0, s, s);
  const cols = ['#e0b048', '#c0392b', '#4a9aff', '#8fd08a', '#c9a8ff', '#f2ead6', '#ff8a3a', '#6ad0c0'];
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { const h = hash(x * 57 + y * 131); if (h < 0.42) continue; g.fillStyle = cols[Math.floor(hash(x * 7 + y * 3 + Math.floor(x / 4)) * cols.length)]; g.globalAlpha = 0.55 + h * 0.45; if (h < 0.72) g.fillRect(x * 16, y * 16 + 5, 16, 6); else g.fillRect(x * 16 + 5, y * 16, 6, 16); }
  g.globalAlpha = 0.18; g.strokeStyle = '#000'; g.lineWidth = 1; for (let i = 0; i < s; i += 4) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, s); g.stroke(); } g.globalAlpha = 1; });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; }

/** uma obra do Saguão: às vezes labirinto, às vezes uma pessoa, um nome, uma mensagem; e a runa que ninguém conhece */
function obraTex(k: number) { return canvasTex(256, 320, (g, w, h) => { const bg = ['#2a2236', '#1e2a3a', '#3a1e22', '#22301e', '#33281a'][k % 5], ouro = '#e0b048'; g.fillStyle = bg; g.fillRect(0, 0, w, h); g.strokeStyle = ouro; g.lineWidth = 6; g.strokeRect(8, 8, w - 16, h - 16); g.lineWidth = 4; g.lineCap = 'round'; const cx = w / 2, cy = h / 2;
  if (k % 6 === 0) { for (let i = 0; i < 7; i++) { const r = 18 + i * 14, a = hash(i + k) * 6.283; g.beginPath(); g.arc(cx, cy, r, a + 0.5, a + 6.0); g.stroke(); } g.fillStyle = ouro; g.beginPath(); g.arc(cx, cy, 7, 0, 6.283); g.fill(); }
  else if (k % 6 === 1) { g.fillStyle = '#d8c0a0'; g.beginPath(); g.ellipse(cx, cy - 20, 42, 54, 0, 0, 6.283); g.fill(); g.fillStyle = '#3a2a1c'; g.beginPath(); g.ellipse(cx, cy - 58, 48, 30, 0, Math.PI, 0); g.fill(); g.fillStyle = bg; g.fillRect(cx - 22, cy - 28, 12, 5); g.fillRect(cx + 10, cy - 28, 12, 5); g.fillStyle = '#6a3a5a'; g.fillRect(cx - 60, cy + 40, 120, 90); }
  else if (k % 6 === 2) { g.fillStyle = ouro; g.font = '700 34px Cinzel, Georgia, serif'; g.textAlign = 'center'; g.fillText('KARMIKA', cx, cy - 6); g.font = '400 15px Georgia, serif'; g.fillStyle = '#f2ead6'; g.fillText('o nome que o fio teceu', cx, cy + 24); }
  else if (k % 6 === 3) { g.fillStyle = '#f2ead6'; g.font = '600 20px Cinzel, Georgia, serif'; g.textAlign = 'center'; ['NINGUÉM', 'ATRAVESSA', 'SÓ'].forEach((t, i) => g.fillText(t, cx, cy - 26 + i * 30)); }
  else if (k % 6 === 4) { /* a runa que ninguém conhece: dizem que saiu do Tear pela primeira vez */ g.strokeStyle = '#c9a8ff'; g.lineWidth = 9; g.beginPath(); g.moveTo(cx - 34, cy + 70); g.lineTo(cx, cy - 74); g.lineTo(cx + 34, cy + 70); g.moveTo(cx - 46, cy - 6); g.lineTo(cx + 12, cy + 30); g.moveTo(cx + 46, cy - 30); g.lineTo(cx + 4, cy - 8); g.stroke(); g.fillStyle = '#c9a8ff'; g.beginPath(); g.arc(cx, cy - 92, 7, 0, 6.283); g.fill(); }
  else { g.fillStyle = '#1a1420'; g.beginPath(); g.ellipse(cx, cy, 78, 44, 0, 0, 6.283); g.fill(); g.stroke(); g.fillStyle = '#ffd24a'; g.beginPath(); g.arc(cx, cy, 24, 0, 6.283); g.fill(); g.fillStyle = '#1a1420'; g.beginPath(); g.arc(cx, cy, 10, 0, 6.283); g.fill(); } }); }

export function buildTearHall(): Interior {
  /* a câmera olha de sudeste: só as paredes do NORTE e do OESTE são altas; ao sul e a leste há só uma mureta, para nada ficar escondido.
     Por isso o trono do Mestre fica ao NORTE da mesa, de costas para a Parede dos Carretéis (que é a parede norte), e o Tear ocupa o lado leste, de comprido,
     com as caldeiras no fundo (norte) e o tecido saindo para a frente (sul), até o rolo e o Saguão das Obras. */
  const W = 110, D = 70, H = 15, g = new THREE.Group(), cols: [number, number, number][] = [];
  const CX = 33, CZ = 39, RT = 20, RS = 21.5; /* a mesa e o anel das cadeiras */
  const PX0 = 10, PX1 = 56; /* a Parede dos Carretéis (trecho da parede norte) */
  const LX0 = 64, LX1 = 102, LZ0 = 12, LZ1 = 21; /* o corpo do tear: de comprido em x; o urdume entra pelo norte, o tecido sai pelo sul */
  const pedra = std(0xffffff, { map: stoneTex(0x8a857c) }), pedraE = std(0xffffff, { map: stoneTex(0x5a5660) }), pedraC = std(0xffffff, { map: stoneTex(0xb0aa9c) }), carv = std(0xffffff, { map: woodTex(0x5a3a20) });
  const latao = std(0xc8963a), cobre = std(0xb0703a), ferro = std(0x44464e), aco = std(0x9aa0a6);
  const brilho = (c: number, o = 1) => new THREE.MeshBasicMaterial({ color: c, transparent: o < 1, opacity: o, toneMapped: false, depthWrite: o >= 1 });
  const add = (geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, par: THREE.Object3D = g) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; par.add(o); return o; };
  const B = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d), Cy = (r0: number, r1: number, h: number, n = 16) => new THREE.CylinderGeometry(r0, r1, h, n);
  const luzes: { l: THREE.PointLight; base: number; ph: number }[] = [];
  const luz = (x: number, y: number, z: number, c: number, i: number, dist: number) => { const l = new THREE.PointLight(c, i, dist, 1.2); l.position.set(x, y, z); g.add(l); luzes.push({ l, base: i, ph: x * 0.7 + z }); };

  /* ---- casca ---- */
  { const piso = add(new THREE.PlaneGeometry(W, D).rotateX(-Math.PI / 2), std(0xffffff, { map: (() => { const t = stoneTex(0x6a6670); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(W / 4, D / 4); return t; })() }), W / 2, 0, D / 2); piso.castShadow = false;
    add(B(W + 1.6, H, 0.8), pedraE, W / 2, H / 2, -0.4); add(B(0.8, H, D), pedraE, -0.4, H / 2, D / 2); /* norte e oeste, altas */
    add(B(0.8, 1.2, D), pedraE, W + 0.4, 0.6, D / 2); for (const s of [-1, 1]) add(B(W / 2 - 4, 1.2, 0.8), pedraE, W / 2 + s * (W / 4 + 2), 0.6, D + 0.4); /* leste e sul: muretas */
    for (let i = 0; i < 6; i++) { const z = 6 + i * 11.5; const c = add(Cy(0.7, 0.85, H, 10), pedraC, 1.2, H / 2, z); ink(c, 0.03); add(Cy(1.0, 0.75, 0.6, 10), pedraC, 1.2, H - 0.3, z); cols.push([1.2, z, 1.1]); }
    for (const x of [2.5, PX0 - 1.6, PX1 + 1.6, 108]) { const c = add(Cy(0.8, 0.95, H, 10), pedraC, x, H / 2, 1.3); ink(c, 0.03); add(Cy(1.1, 0.85, 0.6, 10), pedraC, x, H - 0.3, 1.3); cols.push([x, 1.3, 1.2]); }
    for (const s of [-1, 1]) { add(Cy(0.6, 0.7, 5, 10), pedraC, W / 2 + s * 4.2, 2.5, D + 0.2); add(Cy(0.9, 0.6, 0.5, 10), latao, W / 2 + s * 4.2, 5.2, D + 0.2); } /* os dois pilares da porta */
    add(B(6, 0.04, 8), pedraC, W / 2, 0.02, D - 4).castShadow = false; }

  /* ---- a TÁVOLA KÁRMIKA ---- */
  { add(Cy(RT, RT, 0.35, 96), pedra, CX, 1.0, CZ); add(Cy(RT - 0.6, RT - 1.6, 0.85, 64), pedraE, CX, 0.42, CZ);
    const topo = new THREE.Mesh(new THREE.CircleGeometry(RT - 0.05, 96).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: mesaTex(), toneMapped: false })); topo.rotation.y = Math.PI / 2; /* o raio grosso aponta para o trono (norte) */ topo.position.set(CX, 1.181, CZ); g.add(topo);
    add(Cy(1.3, 1.3, 0.05, 32), brilho(0xffd24a, 0.55), CX, 1.2, CZ).castShadow = false; luz(CX, 9, CZ, 0xffe6c0, 9, 60); luz(CX - 16, 9, CZ + 14, 0xffe6c0, 6, 46); luz(CX + 16, 9, CZ + 16, 0xffe6c0, 6, 46);
    /* 144 cadeiras, cada uma com a bandeira do seu reino no espaldar; o lugar do Mestre fica ao norte (ângulo −90°) */
    const assento = new THREE.InstancedMesh(B(0.62, 0.5, 0.6), carv, N), espaldar = new THREE.InstancedMesh(B(0.62, 1.5, 0.12), carv, N), bandeira = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.5, 1.05), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, toneMapped: false }), N), emblema = new THREE.InstancedMesh(new THREE.CircleGeometry(0.14, 10), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, toneMapped: false }), N);
    const M = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), one = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3(), cor = new THREE.Color();
    for (let i = 0; i < N; i++) { const a = -Math.PI / 2 + ((i + 1) / (N + 1)) * Math.PI * 2, cs = Math.cos(a), sn = Math.sin(a); q.setFromAxisAngle(up, Math.PI / 2 - a);
      M.compose(p.set(CX + cs * RS, 0.25, CZ + sn * RS), q, one); assento.setMatrixAt(i, M); M.compose(p.set(CX + cs * (RS + 0.3), 1.0, CZ + sn * (RS + 0.3)), q, one); espaldar.setMatrixAt(i, M);
      /* a bandeira fica dos DOIS lados do espaldar: quem olha de qualquer canto vê */
      M.compose(p.set(CX + cs * (RS + 0.37), 1.2, CZ + sn * (RS + 0.37)), q, one); bandeira.setMatrixAt(i, M); bandeira.setColorAt(i, cor.setHSL(hash(i + 1), 0.6 + hash(i + 91) * 0.3, 0.36 + hash(i + 17) * 0.2));
      M.compose(p.set(CX + cs * (RS + 0.38), 1.38, CZ + sn * (RS + 0.38)), q, one); emblema.setMatrixAt(i, M); emblema.setColorAt(i, cor.setHSL((hash(i + 1) + 0.45) % 1, 0.7, 0.75)); }
    for (const im of [assento, espaldar, bandeira, emblema]) { im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; g.add(im); }
    /* o trono do Mestre do Tear a Vapor */
    const tz = CZ - RS - 0.9; add(B(1.7, 0.7, 1.6), pedraC, CX, 0.35, tz); add(B(2.0, 4.6, 0.45), pedraC, CX, 2.3, tz - 0.8); for (const s of [-1, 1]) add(B(0.3, 0.5, 1.3), pedraC, CX + s * 0.85, 0.95, tz);
    const roda = add(new THREE.TorusGeometry(0.8, 0.12, 8, 20), latao, CX, 4.9, tz - 0.8); roda.userData.giraZ = 0.4; for (let k = 0; k < 8; k++) { const d = add(B(0.1, 0.34, 0.2), latao, 0, 0, 0, roda); d.position.set(Math.cos(k * 0.785) * 0.95, Math.sin(k * 0.785) * 0.95, 0); d.rotation.z = k * 0.785 - Math.PI / 2; }
    add(new THREE.PlaneGeometry(1.5, 3.2), brilho(0x2a3a6a), CX, 2.5, tz - 0.56); add(new THREE.CircleGeometry(0.45, 20), brilho(0xffd24a), CX, 3.0, tz - 0.55); }

  /* ---- a PAREDE DOS CARRETÉIS (parede norte, atrás do trono) ---- */
  const fios: { x: number; cor: THREE.Color }[] = [];
  { add(B(PX1 - PX0, H - 1, 0.9), pedra, (PX0 + PX1) / 2, (H - 1) / 2, 0.45); add(B(PX1 - PX0 + 2, 0.6, 1.4), latao, (PX0 + PX1) / 2, H - 1.0, 0.7); add(B(PX1 - PX0 + 2, 0.5, 1.4), latao, (PX0 + PX1) / 2, 1.0, 0.7);
    const NC = 24, carretel = new THREE.InstancedMesh(Cy(0.36, 0.36, 0.8, 12).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ toneMapped: false }), N), flange = new THREE.InstancedMesh(Cy(0.5, 0.5, 0.07, 12).rotateX(Math.PI / 2), latao, N * 2);
    const M = new THREE.Matrix4(), cor = new THREE.Color(), pos: number[] = [], rgb: number[] = [];
    for (let i = 0; i < N; i++) { const c = i % NC, r = Math.floor(i / NC), x = PX0 + 1.6 + c * ((PX1 - PX0 - 3.6) / (NC - 1)) + (r % 2 ? 0.45 : 0), y = 2.4 + r * 1.85, z = 1.35;
      M.makeTranslation(x, y, z); carretel.setMatrixAt(i, M); cor.setHSL(hash(i + 1), 0.7 + hash(i + 91) * 0.25, 0.5 + hash(i + 17) * 0.15); carretel.setColorAt(i, cor); M.makeTranslation(x, y, z - 0.42); flange.setMatrixAt(i * 2, M); M.makeTranslation(x, y, z + 0.42); flange.setMatrixAt(i * 2 + 1, M);
      /* o fio sobe a parede, corre pela viga do teto até o tear e desce para a régua */
      const xr = LX0 + 1.5 + (i / (N - 1)) * (LX1 - LX0 - 3), yv = H - 1.6 - (i % 6) * 0.07, P = [[x, y + 0.36, 0.95], [x, yv, 0.95], [xr, yv, 0.95 + (i % 6) * 0.12], [xr, 3.4, LZ0 + 1.2]]; fios.push({ x: xr, cor: cor.clone() });
      for (let k = 0; k < 3; k++) { pos.push(...P[k], ...P[k + 1]); rgb.push(cor.r, cor.g, cor.b, cor.r, cor.g, cor.b); } }
    carretel.instanceMatrix.needsUpdate = true; carretel.instanceColor!.needsUpdate = true; flange.instanceMatrix.needsUpdate = true; g.add(carretel, flange);
    const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); lg.setAttribute('color', new THREE.Float32BufferAttribute(rgb, 3)); g.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ vertexColors: true, toneMapped: false })));
    luz((PX0 + PX1) / 2, 8, 8, 0xffe6c0, 7, 50); }

  /* ---- o TEAR A VAPOR ---- */
  const move: ((t: number) => void)[] = [], vapor: THREE.Sprite[] = [];
  const tecido = tecidoTex(); tecido.repeat.set(9, 2.4); const tm = new THREE.MeshBasicMaterial({ map: tecido, side: THREE.DoubleSide, toneMapped: false });
  { const xc = (LX0 + LX1) / 2, L = LX1 - LX0;
    add(B(L + 1, 0.6, LZ1 - LZ0), ferro, xc, 0.3, (LZ0 + LZ1) / 2);
    for (const x of [LX0, LX1]) { add(B(0.7, 6.4, LZ1 - LZ0), ferro, x, 3.5, (LZ0 + LZ1) / 2); add(B(1.0, 0.5, LZ1 - LZ0 + 0.6), latao, x, 6.9, (LZ0 + LZ1) / 2); } /* as duas cabeceiras */
    add(B(L, 0.5, 0.5), ferro, xc, 6.6, LZ0 + 0.3); add(B(L, 0.5, 0.5), ferro, xc, 6.6, LZ1 - 0.3); add(Cy(0.5, 0.5, L, 14).rotateZ(Math.PI / 2), carv, xc, 3.0, LZ0 + 0.8); /* o rolo do urdume */
    /* a régua: bate o fio a cada passada */
    const regua = new THREE.Group(); regua.position.set(xc, 0, LZ0 + 4.2); g.add(regua); add(B(L - 0.6, 1.5, 0.25), latao, 0, 3.6, 0, regua); add(B(L, 0.3, 0.4), ferro, 0, 4.45, 0, regua); for (let k = 0; k < 70; k++) add(B(0.05, 1.3, 0.05), aco, -L / 2 + 0.6 + k * ((L - 1.2) / 69), 3.55, 0.14, regua).castShadow = false; for (const s2 of [-1, 1]) add(B(0.2, 2.6, 0.2), ferro, s2 * (L / 2 - 0.2), 5.5, 0, regua);
    move.push((t) => { const k = (t * 1.1) % 1; regua.position.z = LZ0 + 4.2 + (k < 0.22 ? Math.sin(k / 0.22 * Math.PI) * 1.2 : 0); });
    for (let k = 0; k < 4; k++) { const q = add(B(L - 1, 2.0, 0.12), cobre, xc, 4.4, LZ0 + 2.2 + k * 0.34); move.push((t) => { q.position.y = 4.4 + Math.sin(t * 6.9 + (k % 2) * Math.PI) * 0.5; }); } /* os liços */
    const lanc = add(B(1.4, 0.2, 0.32), latao, xc, 3.5, LZ0 + 5.3); add(B(0.34, 0.24, 0.36), brilho(0xffe08a), 0, 0, 0, lanc); move.push((t) => { const k = (t * 0.5) % 2; lanc.position.x = LX0 + 1.2 + (k < 1 ? k : 2 - k) * (L - 2.4); }); /* a lançadeira */
    { const pos: number[] = [], rgb: number[] = []; for (const f of fios) { pos.push(f.x, 3.4, LZ0 + 1.2, f.x, 3.4, LZ0 + 6.0); rgb.push(f.cor.r, f.cor.g, f.cor.b, f.cor.r, f.cor.g, f.cor.b); } const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); lg.setAttribute('color', new THREE.Float32BufferAttribute(rgb, 3)); g.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ vertexColors: true, toneMapped: false }))); }
    /* o tecido pronto desce do tear até o grande rolo */
    { const z0 = LZ0 + 6.0, z1 = LZ1 + 9, dz = z1 - z0, dy = 3.4 - 1.7, len = Math.hypot(dz, dy), piv = new THREE.Group(); piv.position.set(xc, (3.4 + 1.7) / 2, (z0 + z1) / 2); piv.rotation.x = Math.atan2(dy, dz); g.add(piv);
      const geo = new THREE.PlaneGeometry(L - 2, len).rotateX(-Math.PI / 2); { const uv = geo.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getY(k), uv.getX(k)); } piv.add(new THREE.Mesh(geo, tm));
      const rolo = add(Cy(1.7, 1.7, L - 1.6, 22).rotateZ(Math.PI / 2), tm, xc, 1.7, z1 + 0.9); move.push((t) => { rolo.rotation.x = t * 0.25; }); for (const s2 of [-1, 1]) add(B(0.5, 2.6, 0.5), ferro, xc + s2 * (L / 2 - 0.5), 1.3, z1 + 0.9); }
    /* caldeiras no fundo (norte), volantes e pistões na frente */
    for (let k = 0; k < 5; k++) { const x = LX0 + 4 + k * ((L - 8) / 4), z = 5.5; const cal = add(Cy(1.5, 1.5, 4.2, 16), cobre, x, 3.3, z); ink(cal, 0.03); add(new THREE.SphereGeometry(1.5, 16, 8, 0, 6.283, 0, 1.57), cobre, x, 5.4, z); for (const y of [2.0, 3.3, 4.6]) add(new THREE.TorusGeometry(1.52, 0.08, 6, 20).rotateX(Math.PI / 2), latao, x, y, z); add(B(2.6, 1.2, 2.6), ferro, x, 0.6, z);
      add(Cy(0.34, 0.4, 5.6, 10), ferro, x, 8.6, z); add(Cy(0.52, 0.34, 0.35, 10), latao, x, 11.5, z); add(Cy(0.55, 0.55, 0.08, 16).rotateX(Math.PI / 2), brilho(0xffb040), x, 2.0, z + 1.52); add(Cy(0.3, 0.3, 0.06, 14).rotateX(Math.PI / 2), brilho(0xf2ead6), x + 0.9, 4.0, z + 1.3);
      add(Cy(0.2, 0.2, LZ0 - z, 8).rotateX(Math.PI / 2), cobre, x, 4.6, (z + LZ0) / 2); /* o cano de vapor até a máquina */
      for (let j = 0; j < 2; j++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ color: 0xf0ecf6, transparent: true, opacity: 0.4, depthWrite: false })); sp.userData = { x, z, ph: k * 0.37 + j * 0.5 }; g.add(sp); vapor.push(sp); }
      /* volante com biela, na frente (sul) do tear */
      const vg = new THREE.Group(); vg.position.set(x, 4.4, LZ1 + 0.5); g.add(vg); add(new THREE.TorusGeometry(1.8, 0.16, 8, 28), ferro, 0, 0, 0, vg); for (let r = 0; r < 6; r++) add(B(0.1, 3.5, 0.1), aco, 0, 0, 0, vg).rotation.z = r * Math.PI / 6; add(Cy(0.28, 0.28, 0.5, 10).rotateX(Math.PI / 2), latao, 0, 0, 0, vg); move.push((t) => { vg.rotation.z = t * (1.6 + k * 0.07); });
      const pist = add(Cy(0.2, 0.2, 2.4, 10), aco, x + 2.6, 7.6, LZ1 - 0.2); add(Cy(0.36, 0.36, 1.5, 12), latao, x + 2.6, 9.0, LZ1 - 0.2); move.push((t) => { pist.position.y = 7.5 + Math.sin(t * (1.6 + k * 0.07) * 2) * 0.55; }); }
    add(Cy(0.16, 0.16, L - 2, 10).rotateZ(Math.PI / 2), latao, xc, 4.4, LZ1 + 0.5); /* o eixo dos volantes */
    luz(xc - 10, 9, LZ1 + 6, 0xfff0d8, 8, 46); luz(xc + 10, 9, LZ1 + 6, 0xfff0d8, 8, 46); luz(xc, 5, 9, 0xffa050, 6, 30);

    /* ---- os ROLOS empilhados e o SAGUÃO DAS OBRAS (sudeste) ---- */
    for (let r = 0; r < 4; r++) for (let k = 0; k < 6 - r; k++) add(Cy(1.0, 1.0, 6.0, 16).rotateX(Math.PI / 2), tm, 93.5 + k * 2.05 + r * 1.02 - 2, 1.0 + r * 1.75, 41);
    let ob = 0; const obra = (x: number, y: number, z: number, ry: number, w = 3.2, h = 4.0) => { const og = new THREE.Group(); og.position.set(x, y, z); og.rotation.y = ry; g.add(og); add(B(w + 0.4, h + 0.4, 0.14), carv, 0, 0, -0.08, og); add(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: obraTex(ob++), toneMapped: false }), 0, 0, 0, og).castShadow = false; add(B(w + 0.8, 0.14, 0.2), latao, 0, h / 2 + 0.32, -0.04, og); };
    for (let k = 0; k < 4; k++) obra(0.5, 5.0, 12 + k * 13, Math.PI / 2, 4.4, 5.6); /* as maiores, na parede oeste */
    for (let c = 0; c < 6; c++) for (let r = 0; r < 2; r++) { const x = 64 + c * 7.2 + (r ? 3.6 : 0), z = 48 + r * 9; if (x > 104) continue; add(B(0.3, 3.6, 0.3), carv, x, 1.8, z - 0.25); add(B(1.8, 0.2, 1.2), carv, x, 0.1, z - 0.2); obra(x, 2.9, z, 0.5, 2.4, 3.1); cols.push([x, z - 0.2, 1.1]); }
    luz(84, 8, 54, 0xfff0d8, 8, 46); luz(W / 2, 7, D - 8, 0xfff0d8, 6, 40); }

  const dentro = (x: number, z: number) => x > 0.7 && x < W - 0.7 && z > 1.6 && z < D + 0.3 && (z < D - 0.5 || Math.abs(x - W / 2) < 3.4);
  const free = (x: number, z: number) => { if (!dentro(x, z)) return false;
    if (Math.hypot(x - CX, z - CZ) < RS + 1.0) return false; if (Math.abs(x - CX) < 1.4 && z > CZ - RS - 2.6 && z < CZ - RS) return false; /* a mesa, as cadeiras e o trono */
    if (x > PX0 - 1 && x < PX1 + 1 && z < 2.6) return false; /* os carretéis */
    if (x > LX0 - 1.2 && x < LX1 + 1.2 && z < LZ1 + 13) return false; /* caldeiras, tear, tecido e rolo */
    if (x > 90 && x < 104.5 && z > 37.5 && z < 44.5) return false; /* a pilha de rolos */
    for (const [qx, qz, rad] of cols) if (Math.hypot(x - qx, z - qz) < rad) return false; return true; };
  const rodas: THREE.Object3D[] = []; g.traverse((o) => { if (o.userData.giraZ) rodas.push(o); });
  const flicker = (t: number) => { for (const f of move) f(t); for (const r of rodas) r.rotation.z = t * r.userData.giraZ; tecido.offset.x = -t * 0.04;
    for (const sp of vapor) { const k = (t * 0.22 + sp.userData.ph) % 1; sp.position.set(sp.userData.x + Math.sin(k * 5 + sp.userData.ph * 9) * 0.5, 11.8 + k * 4.2, sp.userData.z); const sc = 1.2 + k * 3.6; sp.scale.set(sc, sc, 1); (sp.material as THREE.SpriteMaterial).opacity = 0.42 * (1 - k); }
    for (const l of luzes) l.l.intensity = l.base * (0.95 + 0.05 * Math.sin(t * 7 + l.ph)); };
  flicker(0);
  return { group: g, W, D, colliders: cols, free, flicker, exitZ: D + 0.9 };
}
