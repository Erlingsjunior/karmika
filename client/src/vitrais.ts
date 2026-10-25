/* Vitrais de Karmika: 12 janelas de vidro colorido (4 histórias × 3 tamanhos) para igrejas, capelas, templos e catedrais.
   Pequeno = lanceta estreita · médio = lanceta larga · grande = rosácea redonda.
   Histórias: 'karmika' (o Olho de Marghar), 'labirinto' (o Labirinto e o fio), 'brasoes' (as duas facções), 'ciclo' (morte e volta).
   Tudo desenhado em canvas: pedaços de vidro irregulares separados por chumbo, e o desenho da história por cima. */
import * as THREE from 'three';
import { drawCrest } from './faccoes';

export type Tema = 'karmika' | 'labirinto' | 'brasoes' | 'ciclo';
export type Tam = 'p' | 'm' | 'g';
export const TEMAS: Tema[] = ['karmika', 'labirinto', 'brasoes', 'ciclo'];
export const TEMA_NOME: Record<Tema, string> = { karmika: 'O Olho de Marghar', labirinto: 'O Labirinto e o Fio', brasoes: 'Os Dois Brasões', ciclo: 'A Morte e a Volta' };

const PAL: Record<Tema, string[]> = {
  karmika: ['#3a2a8a', '#5a3aa8', '#7a4ac0', '#2a3a8a', '#c9962a', '#8a2a5a', '#4a2a6a'],
  labirinto: ['#1d3e7a', '#2a5a9a', '#1a6a7a', '#2a7a8a', '#3a4a9a', '#c9962a', '#1a2a5a'],
  brasoes: ['#1d3566', '#2a4a8a', '#8a1a22', '#a3222c', '#5a1a2a', '#c9962a', '#2a2a4a'],
  ciclo: ['#2a6a3a', '#3a8a4a', '#b8862a', '#d0a040', '#8a2a1a', '#2a4a6a', '#5a3a2a'],
};
const LEAD = '#120c14', GOLD = '#f0c860', PALE = '#e8e0d0';
// tamanho do desenho (em metros) e do canvas
export const DIM: Record<Tam, { w: number; h: number; cw: number; ch: number }> = {
  p: { w: 0.62, h: 1.7, cw: 96, ch: 264 },
  m: { w: 1.0, h: 2.7, cw: 128, ch: 344 },
  g: { w: 2.2, h: 2.2, cw: 320, ch: 320 },
};

/** contorno da lanceta (arco ogival no alto), em metros, com a base em y=0 */
export function lancetPts(w: number, h: number, n = 10): THREE.Vector2[] {
  const ys = h - w * 0.9, pts: THREE.Vector2[] = [new THREE.Vector2(-w / 2, 0), new THREE.Vector2(w / 2, 0), new THREE.Vector2(w / 2, ys)];
  // arco ogival: dois arcos de raio w centrados nos lados opostos
  for (let i = 1; i <= n; i++) { const a = (i / n) * Math.acos(0.5), x = -w / 2 + Math.cos(a) * w, y = ys + Math.sin(a) * w; pts.push(new THREE.Vector2(x, Math.min(h, y))); }
  for (let i = n - 1; i >= 0; i--) { const a = (i / n) * Math.acos(0.5), x = w / 2 - Math.cos(a) * w, y = ys + Math.sin(a) * w; pts.push(new THREE.Vector2(x, Math.min(h, y))); }
  return pts;
}
let seedN = 1; const rnd = () => { seedN = (seedN * 16807) % 2147483647; return (seedN - 1) / 2147483646; };

function shapePath(g: CanvasRenderingContext2D, sz: Tam, W: number, H: number, inset = 0) {
  g.beginPath();
  if (sz === 'g') { g.arc(W / 2, H / 2, W / 2 - 2 - inset, 0, Math.PI * 2); return; }
  const d = DIM[sz], pts = lancetPts(d.w, d.h), sx = (W - 4 - inset * 2) / d.w, sy = (H - 4 - inset * 2) / d.h;
  pts.forEach((p, i) => { const x = W / 2 + p.x * sx, y = H - 2 - inset - p.y * sy; if (i) g.lineTo(x, y); else g.moveTo(x, y); }); g.closePath();
}
/** campo de vidro: grade torta de pedaços coloridos com um brilho em cada um */
function glassField(g: CanvasRenderingContext2D, W: number, H: number, pal: string[], cell: number) {
  const cols = Math.max(2, Math.round(W / cell)), rows = Math.max(3, Math.round(H / cell)), P: [number, number][][] = [];
  for (let j = 0; j <= rows; j++) { P.push([]); for (let i = 0; i <= cols; i++) { const ej = j === 0 || j === rows, ei = i === 0 || i === cols; P[j].push([i / cols * W + (ei ? 0 : (rnd() - 0.5) * W / cols * 0.6), j / rows * H + (ej ? 0 : (rnd() - 0.5) * H / rows * 0.6)]); } }
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const q = [P[j][i], P[j][i + 1], P[j + 1][i + 1], P[j + 1][i]], col = pal[Math.floor(rnd() * pal.length)];
    // às vezes o quadrado vira dois triângulos de cores diferentes
    const tri = rnd() < 0.35, paint = (pts: [number, number][], c: string) => { g.beginPath(); pts.forEach(([x, y], k) => k ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length, cy = pts.reduce((a, p) => a + p[1], 0) / pts.length; const gr = g.createRadialGradient(cx - 4, cy - 6, 1, cx, cy, cell); gr.addColorStop(0, shade(c, 1.45)); gr.addColorStop(1, c); g.fillStyle = gr; g.fill(); };
    if (tri) { paint([q[0], q[1], q[2]], col); paint([q[0], q[2], q[3]], pal[Math.floor(rnd() * pal.length)]); } else paint(q, col);
  }
  g.strokeStyle = LEAD; g.lineWidth = Math.max(2, W / 70); g.lineJoin = 'round';
  for (let j = 0; j <= rows; j++) { g.beginPath(); P[j].forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); }
  for (let i = 0; i <= cols; i++) { g.beginPath(); for (let j = 0; j <= rows; j++) { const [x, y] = P[j][i]; if (j) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke(); }
}
function shade(hex: string, k: number) { const n = parseInt(hex.slice(1), 16), r = Math.min(255, ((n >> 16) & 255) * k), gg = Math.min(255, ((n >> 8) & 255) * k), b = Math.min(255, (n & 255) * k); return `rgb(${r | 0},${gg | 0},${b | 0})`; }
/** chumbo em volta de um desenho já preenchido */
const leadStroke = (g: CanvasRenderingContext2D, w: number) => { g.strokeStyle = LEAD; g.lineWidth = w; g.stroke(); };
function eye(g: CanvasRenderingContext2D, cx: number, cy: number, s: number, rays = 0) {
  if (rays) { for (let i = 0; i < rays; i++) { const a = i / rays * Math.PI * 2; g.beginPath(); g.moveTo(cx + Math.cos(a - 0.08) * s * 1.1, cy + Math.sin(a - 0.08) * s * 1.1); g.lineTo(cx + Math.cos(a) * s * 2.1, cy + Math.sin(a) * s * 2.1); g.lineTo(cx + Math.cos(a + 0.08) * s * 1.1, cy + Math.sin(a + 0.08) * s * 1.1); g.closePath(); g.fillStyle = i % 2 ? '#f6dc8a' : GOLD; g.fill(); leadStroke(g, Math.max(1.5, s * 0.06)); } }
  g.beginPath(); g.moveTo(cx - s, cy); g.quadraticCurveTo(cx, cy - s * 0.8, cx + s, cy); g.quadraticCurveTo(cx, cy + s * 0.8, cx - s, cy); g.closePath(); g.fillStyle = '#f6eed8'; g.fill(); leadStroke(g, Math.max(2, s * 0.09));
  g.beginPath(); g.arc(cx, cy, s * 0.36, 0, 7); g.fillStyle = '#9a6ae0'; g.fill(); leadStroke(g, Math.max(1.5, s * 0.07));
  g.beginPath(); g.arc(cx, cy, s * 0.14, 0, 7); g.fillStyle = '#140a1e'; g.fill();
}
function labyrinth(g: CanvasRenderingContext2D, cx: number, cy: number, R: number) {
  for (let i = 0; i < 4; i++) { const r = R * (1 - i * 0.22), gap = 0.5, door = i % 2 ? Math.PI * 1.5 : Math.PI * 0.5;
    g.beginPath(); g.arc(cx, cy, r, door + gap / 2, door + Math.PI * 2 - gap / 2); g.strokeStyle = LEAD; g.lineWidth = R * 0.16; g.stroke(); g.strokeStyle = PALE; g.lineWidth = R * 0.08; g.stroke(); }
  // o fio de ouro, da porta de baixo até o centro
  g.beginPath(); g.moveTo(cx, cy + R * 1.25); g.lineTo(cx, cy + R * 0.89); g.arc(cx, cy, R * 0.89, Math.PI * 0.5, Math.PI * 1.25); g.arc(cx, cy, R * 0.67, Math.PI * 1.25, Math.PI * 1.5); g.arc(cx, cy, R * 0.45, Math.PI * 1.5, Math.PI * 2.3); g.lineTo(cx, cy);
  g.strokeStyle = LEAD; g.lineWidth = R * 0.13; g.lineCap = 'round'; g.stroke(); g.strokeStyle = GOLD; g.lineWidth = R * 0.065; g.stroke();
  g.beginPath(); g.arc(cx, cy, R * 0.13, 0, 7); g.fillStyle = GOLD; g.fill(); leadStroke(g, R * 0.04);
}
function soul(g: CanvasRenderingContext2D, cx: number, cy: number, s: number) { // a alma: chama clara em gota
  g.beginPath(); g.moveTo(cx, cy - s); g.bezierCurveTo(cx + s * 0.7, cy - s * 0.2, cx + s * 0.55, cy + s * 0.6, cx, cy + s * 0.6); g.bezierCurveTo(cx - s * 0.55, cy + s * 0.6, cx - s * 0.7, cy - s * 0.2, cx, cy - s); g.closePath();
  const gr = g.createRadialGradient(cx, cy + s * 0.2, 1, cx, cy, s); gr.addColorStop(0, '#fffbe8'); gr.addColorStop(1, '#f0c860'); g.fillStyle = gr; g.fill(); leadStroke(g, Math.max(2, s * 0.1));
}
function figure(g: CanvasRenderingContext2D, cx: number, cy: number, s: number, lying = false) { // caminhante em silhueta (de pé ou deitado)
  g.save(); g.translate(cx, cy); if (lying) g.rotate(-Math.PI / 2);
  g.beginPath(); g.arc(0, -s * 0.78, s * 0.16, 0, 7); g.fillStyle = '#e8d8b8'; g.fill(); leadStroke(g, Math.max(1.5, s * 0.05));
  g.beginPath(); g.moveTo(-s * 0.24, -s * 0.58); g.lineTo(s * 0.24, -s * 0.58); g.lineTo(s * 0.34, s * 0.5); g.lineTo(-s * 0.34, s * 0.5); g.closePath(); g.fillStyle = lying ? '#5a4a6a' : '#7a2a2a'; g.fill(); leadStroke(g, Math.max(1.5, s * 0.05));
  g.restore();
}
function wheel(g: CanvasRenderingContext2D, cx: number, cy: number, R: number) { // a roda das vidas: 8 caminhos em 8 cores
  const C = ['#c9962a', '#2a4a8a', '#8a1a22', '#3a8a4a', '#7a4ac0', '#1a6a7a', '#a3222c', '#d0a040'];
  for (let i = 0; i < 8; i++) { g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, R, i * Math.PI / 4 - Math.PI / 2, (i + 1) * Math.PI / 4 - Math.PI / 2); g.closePath(); g.fillStyle = C[i]; g.fill(); leadStroke(g, R * 0.04); }
  g.beginPath(); g.arc(cx, cy, R * 0.42, 0, 7); g.fillStyle = '#1a1220'; g.fill(); leadStroke(g, R * 0.05);
  soul(g, cx, cy + R * 0.02, R * 0.3);
}

const texCache = new Map<string, THREE.CanvasTexture>();
export function vitralTex(tema: Tema, sz: Tam): THREE.CanvasTexture {
  const key = tema + sz; const hit = texCache.get(key); if (hit) return hit;
  const d = DIM[sz], W = d.cw, H = d.ch, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d')!;
  seedN = 1 + TEMAS.indexOf(tema) * 7919 + (sz === 'p' ? 11 : sz === 'm' ? 23 : 37);
  g.save(); shapePath(g, sz, W, H); g.clip();
  g.fillStyle = LEAD; g.fillRect(0, 0, W, H);
  glassField(g, W, H, PAL[tema], sz === 'g' ? 34 : sz === 'm' ? 30 : 26);
  const cx = W / 2;
  if (sz === 'g') { // rosácea: aros e raios de pedra por cima do vidro, desenho no centro
    const R = W / 2 - 2;
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; g.beginPath(); g.arc(cx + Math.cos(a) * R * 0.72, H / 2 + Math.sin(a) * R * 0.72, R * 0.2, 0, 7); g.fillStyle = PAL[tema][i % PAL[tema].length]; g.globalAlpha = 0.55; g.fill(); g.globalAlpha = 1; leadStroke(g, 3); }
    g.beginPath(); g.arc(cx, H / 2, R * 0.52, 0, 7); g.fillStyle = '#140e1c'; g.globalAlpha = 0.35; g.fill(); g.globalAlpha = 1; leadStroke(g, 5);
    if (tema === 'karmika') eye(g, cx, H / 2, R * 0.3, 12);
    else if (tema === 'labirinto') labyrinth(g, cx, H / 2, R * 0.42);
    else if (tema === 'brasoes') { drawCrest(g, 'fio', cx - R * 0.27, H / 2 - R * 0.33, R * 0.42, R * 0.55, 'shield'); drawCrest(g, 'desf', cx + R * 0.27, H / 2 - R * 0.33, R * 0.42, R * 0.55, 'shield'); eye(g, cx, H / 2 + R * 0.36, R * 0.11); }
    else wheel(g, cx, H / 2, R * 0.48);
  } else { // lanceta: a história de baixo para cima
    const s = W * 0.3;
    if (tema === 'karmika') { eye(g, cx, H * 0.3, s * 1.1, sz === 'm' ? 10 : 8); if (sz === 'm') { figure(g, cx, H * 0.72, s * 1.2); } else soul(g, cx, H * 0.7, s * 0.8); }
    else if (tema === 'labirinto') { labyrinth(g, cx, H * 0.36, s * 1.35); if (sz === 'm') figure(g, cx, H * 0.8, s); }
    else if (tema === 'brasoes') { if (sz === 'm') { drawCrest(g, 'fio', cx, H * 0.16, W * 0.62, W * 0.78, 'shield'); drawCrest(g, 'desf', cx, H * 0.56, W * 0.62, W * 0.78, 'shield'); } else { drawCrest(g, 'fio', cx, H * 0.2, W * 0.66, W * 0.84, 'shield'); drawCrest(g, 'desf', cx, H * 0.56, W * 0.66, W * 0.84, 'shield'); } }
    else { if (sz === 'm') { soul(g, cx, H * 0.3, s * 1.1); g.setLineDash([4, 6]); g.beginPath(); g.moveTo(cx, H * 0.45); g.lineTo(cx, H * 0.66); g.strokeStyle = GOLD; g.lineWidth = 3; g.stroke(); g.setLineDash([]); figure(g, cx, H * 0.8, s, true); } else { soul(g, cx, H * 0.35, s * 1.1); figure(g, cx, H * 0.75, s * 0.8, true); } }
  }
  g.restore();
  // moldura de chumbo grosso em volta
  shapePath(g, sz, W, H, 1); g.strokeStyle = LEAD; g.lineWidth = Math.max(4, W / 22); g.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; texCache.set(key, t); return t;
}

/* materiais: os de fora escurecem de dia (o vitral brilha de verdade à noite, com a luz de dentro); os de dentro brilham sempre */
const OUT: THREE.MeshBasicMaterial[] = [];
const matCache = new Map<string, THREE.MeshBasicMaterial>();
export function vitralMat(tema: Tema, sz: Tam, mode: 'out' | 'in' | 'ruin' = 'out') {
  const key = tema + sz + mode; let m = matCache.get(key);
  if (!m) { m = new THREE.MeshBasicMaterial({ map: vitralTex(tema, sz), transparent: false, alphaTest: 0.5, side: THREE.DoubleSide, color: mode === 'ruin' ? 0x3e3646 : 0xffffff, toneMapped: false }); matCache.set(key, m); if (mode === 'out') OUT.push(m); }
  return m;
}
/** chamado a cada quadro: de dia o vitral visto de fora é mais escuro; de noite acende */
export function setVitraisDay(day: number) { const k = 0.48 + (1 - day) * 0.52; for (const m of OUT) m.color.setScalar(k); }

/** geometria do vidro com o desenho no lugar certo (base em y=0, centrada em x) */
function glassGeo(sz: Tam, scale = 1) {
  const d = DIM[sz], w = d.w * scale, h = d.h * scale;
  const shp = new THREE.Shape(sz === 'g' ? undefined : lancetPts(w, h)); if (sz === 'g') shp.absarc(0, h / 2, w / 2, 0, Math.PI * 2, false);
  const geo = new THREE.ShapeGeometry(shp, 24), uv = geo.attributes.uv, ps = geo.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, ps.getX(i) / w + 0.5, ps.getY(i) / h);
  return geo;
}
/** janela pronta para pendurar numa parede: vidro + moldura fina de pedra rente à parede + peitoril. A frente olha para +z */
export function vitral(tema: Tema, sz: Tam, stone: THREE.Material, mode: 'out' | 'in' | 'ruin' = 'out', scale = 1): THREE.Group {
  const gr = new THREE.Group(), d = DIM[sz], w = d.w * scale, h = d.h * scale;
  const glass = new THREE.Mesh(glassGeo(sz, scale), vitralMat(tema, sz, mode)); glass.position.z = 0.04; glass.userData.keep = true; gr.add(glass);
  // moldura: o mesmo contorno, um pouco maior, em pedra, colado na parede (não é pilar: tem 6 cm de relevo)
  const rimShape = new THREE.Shape(sz === 'g' ? undefined : lancetPts(w + 0.2, h + 0.14)); if (sz === 'g') rimShape.absarc(0, h / 2, w / 2 + 0.16, 0, Math.PI * 2, false);
  const hole = new THREE.Path(sz === 'g' ? undefined : lancetPts(w, h).map((p) => new THREE.Vector2(p.x, p.y + 0.07))); if (sz === 'g') hole.absarc(0, h / 2, w / 2, 0, Math.PI * 2, true);
  rimShape.holes.push(hole);
  const rim = new THREE.Mesh(new THREE.ExtrudeGeometry(rimShape, { depth: 0.07, bevelEnabled: false, curveSegments: 16 }), stone); rim.position.set(0, sz === 'g' ? 0 : -0.07, 0); gr.add(rim);
  if (sz !== 'g') { const sill = new THREE.Mesh(new THREE.BoxGeometry(w + 0.36, 0.1, 0.18), stone); sill.position.set(0, -0.1, 0.06); gr.add(sill); }
  else for (let k = 0; k < 6; k++) { const sp = new THREE.Mesh(new THREE.BoxGeometry(0.06, w, 0.05), stone); sp.position.set(0, h / 2, 0.06); sp.rotation.z = k * Math.PI / 6; gr.add(sp); } // raios de pedra da rosácea
  return gr;
}
/** a luz colorida que o vitral joga no chão de dentro: o desenho esticado no piso, somado à luz */
export function floorGlow(tema: Tema, sz: Tam, w: number, len: number, k = 0.42): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, len), new THREE.MeshBasicMaterial({ map: vitralTex(tema, sz), transparent: true, opacity: k, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  m.rotation.x = -Math.PI / 2; m.renderOrder = 2; return m;
}
