/* A CARTA NÁUTICA (07/11, Erling: "a tela inteira preenchida com o azul do mar, como os mapas antigos: monstros marinhos, rosa dos ventos,
   seres mitológicos soprando nas bordas, e desenhos tecnocráticos — quem faz a cartografia são os tecnocratas steampunk"; "a água toda lisa,
   sem camadas, redemoinhos, tempestades e mudança de cor fica sem graça").
   Tudo aqui é desenhado com tinta de nanquim clara e latão sobre o mar, nas coordenadas do MUNDO (casas): cresce e diminui com o zoom e some
   quando se aproxima demais (a carta é a visão de longe). O mar fora do quadrado do mundo continua com a mesma trama. */
import { MAP_W } from '../world';

const INK = 'rgba(232,218,180,', BRASS = '#c8963a', BRASS2 = '#8a6224';
/** a trama do mar: um ladrilho com ondinhas de gravura (para o mar fora do mundo e o fundo) */
export function oceanPattern(g: CanvasRenderingContext2D): CanvasPattern | null {
  const c = document.createElement('canvas'); c.width = c.height = 96; const x = c.getContext('2d')!;
  x.fillStyle = '#14305c'; x.fillRect(0, 0, 96, 96); /* o mesmo azul do mar fundo da carta */
  x.strokeStyle = 'rgba(160,200,230,.18)'; x.lineWidth = 1;
  for (let r = 0; r < 6; r++) { const y0 = 8 + r * 16, off = (r % 2) * 24; for (let k = -1; k < 3; k++) { x.beginPath(); const sx = off + k * 48; x.moveTo(sx, y0); x.quadraticCurveTo(sx + 6, y0 - 4, sx + 12, y0); x.quadraticCurveTo(sx + 18, y0 + 4, sx + 24, y0); x.stroke(); } }
  return g.createPattern(c, 'repeat');
}
type XY = (v: number) => number;
const SEA_PTS = { whirl: [[262, 640, 34], [1404, 770, 28], [770, 1438, 30], [1180, 120, 22]], storm: [[1330, 190, 70], [150, 1460, 80], [640, 120, 60], [1500, 1480, 54]] } as const;

/** tudo o que a carta desenha por cima do mar (antes dos nomes e ícones) */
export function drawSeaArt(g: CanvasRenderingContext2D, X: XY, Y: XY, k: number, z: number, W: number, H: number, t: number) {
  if (z > 3.2) return; const fade = Math.max(0, Math.min(1, (3.2 - z) / 1.2)); g.save(); g.globalAlpha = fade;
  const vis = (x: number, y: number, r: number) => { const sx = X(x), sy = Y(y), R = r * k; return sx + R > 0 && sy + R > 0 && sx - R < W && sy - R < H; };
  /* redemoinhos: espirais de tinta que giram devagar */
  for (const [x, y, r] of SEA_PTS.whirl) { if (!vis(x, y, r)) continue; const cx = X(x), cy = Y(y), R = r * k; g.strokeStyle = INK + '.55)'; g.lineWidth = Math.max(1, k * 0.9);
    for (let arm = 0; arm < 3; arm++) { g.beginPath(); for (let a = 0; a < 11; a += 0.12) { const rr = R * (1 - a / 11), ang = a + t * 0.35 + arm * 2.094; const px = cx + Math.cos(ang) * rr, py = cy + Math.sin(ang) * rr * 0.8; if (a === 0) g.moveTo(px, py); else g.lineTo(px, py); } g.stroke(); }
    g.fillStyle = 'rgba(8,20,40,.55)'; g.beginPath(); g.ellipse(cx, cy, R * 0.16, R * 0.13, 0, 0, 6.283); g.fill(); }
  /* tempestades: nuvem escura com chuva riscada e um raio */
  for (const [x, y, r] of SEA_PTS.storm) { if (!vis(x, y, r)) continue; const cx = X(x), cy = Y(y), R = r * k;
    const gr = g.createRadialGradient(cx, cy, R * 0.1, cx, cy, R); gr.addColorStop(0, 'rgba(14,22,36,.55)'); gr.addColorStop(1, 'rgba(14,22,36,0)'); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, R, 0, 6.283); g.fill();
    g.fillStyle = 'rgba(200,210,225,.5)'; for (const [dx, dy, s] of [[-0.3, -0.2, 0.32], [0, -0.32, 0.38], [0.3, -0.18, 0.3], [0.12, -0.08, 0.34], [-0.15, -0.05, 0.28]]) { g.beginPath(); g.arc(cx + dx * R, cy + dy * R, s * R * 0.6, 0, 6.283); g.fill(); }
    g.strokeStyle = 'rgba(190,210,235,.35)'; g.lineWidth = 1; for (let i = 0; i < 14; i++) { const px = cx + (i / 13 - 0.5) * R * 1.1; g.beginPath(); g.moveTo(px, cy + R * 0.05); g.lineTo(px - R * 0.12, cy + R * 0.5); g.stroke(); }
    if (Math.sin(t * 3.1 + x) > 0.6) { g.strokeStyle = 'rgba(255,240,170,.9)'; g.lineWidth = Math.max(1.2, k); g.beginPath(); g.moveTo(cx + R * 0.05, cy); g.lineTo(cx - R * 0.08, cy + R * 0.22); g.lineTo(cx + R * 0.04, cy + R * 0.24); g.lineTo(cx - R * 0.1, cy + R * 0.5); g.stroke(); }
    g.font = `italic ${Math.max(9, 7 * k)}px Georgia, serif`; g.fillStyle = INK + '.7)'; g.textAlign = 'center'; g.fillText('tempestade', cx, cy + R * 0.72); }
  /* monstros marinhos */
  serpent(g, X(985), Y(1395), k, t); kraken(g, X(1480), Y(1010), k, t); whale(g, X(118), Y(690), k); leviathan(g, X(520), Y(232), k, t);
  /* os ventos: rostos de nuvem soprando dos quatro cantos para dentro */
  wind(g, X(60), Y(60), k, Math.PI * 0.25); wind(g, X(MAP_W - 60), Y(60), k, Math.PI * 0.75); wind(g, X(60), Y(MAP_W - 60), k, -Math.PI * 0.25); wind(g, X(MAP_W - 60), Y(MAP_W - 60), k, -Math.PI * 0.75);
  rose(g, X(230), Y(1330), 70 * k, t); gearsCorner(g, X(MAP_W - 230), Y(MAP_W - 120), k, t);
  /* a cártula fica centrada sobre o continente principal, no mar do norte */
  cartouche(g, X(MAP_W / 2), Y(150), Math.max(0.45, Math.min(1.1, k)), t);
  g.restore();
}
function serpent(g: CanvasRenderingContext2D, x: number, y: number, k: number, t: number) { const s = k * 1.2; g.save(); g.translate(x, y); g.lineWidth = Math.max(1.2, s * 1.1); g.strokeStyle = INK + '.85)'; g.fillStyle = 'rgba(60,110,90,.75)';
  for (let i = 0; i < 4; i++) { const hx = i * 26 * s; g.beginPath(); g.moveTo(hx - 10 * s, 0); g.bezierCurveTo(hx - 8 * s, -16 * s - Math.sin(t + i) * 2 * s, hx + 8 * s, -16 * s - Math.sin(t + i) * 2 * s, hx + 10 * s, 0); g.closePath(); g.fill(); g.stroke(); for (let f = -1; f <= 1; f++) { g.beginPath(); g.moveTo(hx + f * 4 * s, -12 * s); g.lineTo(hx + f * 4 * s + 2 * s, -18 * s); g.stroke(); } }
  g.beginPath(); g.moveTo(-14 * s, 0); g.bezierCurveTo(-22 * s, -10 * s, -26 * s, -26 * s, -16 * s, -32 * s); g.bezierCurveTo(-6 * s, -36 * s, 0, -28 * s, -8 * s, -22 * s); g.stroke(); /* pescoço */
  g.beginPath(); g.ellipse(-12 * s, -32 * s, 8 * s, 5 * s, -0.3, 0, 6.283); g.fill(); g.stroke(); g.fillStyle = '#ffd24a'; g.beginPath(); g.arc(-9 * s, -33 * s, 1.2 * s, 0, 6.283); g.fill();
  g.strokeStyle = INK + '.5)'; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(-20 * s + i * 24 * s, 3 * s); g.quadraticCurveTo(-14 * s + i * 24 * s, 6 * s, -8 * s + i * 24 * s, 3 * s); g.stroke(); } g.restore(); }
function kraken(g: CanvasRenderingContext2D, x: number, y: number, k: number, t: number) { const s = k * 1.1; g.save(); g.translate(x, y); g.lineWidth = Math.max(1.2, s); g.strokeStyle = INK + '.85)'; g.fillStyle = 'rgba(120,50,70,.75)';
  for (let i = 0; i < 6; i++) { const bx = (i - 2.5) * 12 * s, w = Math.sin(t * 1.3 + i) * 4 * s; g.beginPath(); g.moveTo(bx - 3 * s, 0); g.bezierCurveTo(bx - 6 * s + w, -20 * s, bx + 10 * s + w, -30 * s, bx + 4 * s + w, -40 * s); g.bezierCurveTo(bx + 14 * s + w, -32 * s, bx + 6 * s, -18 * s, bx + 3 * s, 0); g.closePath(); g.fill(); g.stroke();
    for (let q = 1; q < 4; q++) { g.beginPath(); g.arc(bx + 2 * s + w * q / 4, -q * 9 * s, 1.1 * s, 0, 6.283); g.stroke(); } }
  g.strokeStyle = INK + '.5)'; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(-36 * s + i * 22 * s, 3 * s); g.quadraticCurveTo(-30 * s + i * 22 * s, 6 * s, -24 * s + i * 22 * s, 3 * s); g.stroke(); } g.restore(); }
function whale(g: CanvasRenderingContext2D, x: number, y: number, k: number) { const s = k * 1.15; g.save(); g.translate(x, y); g.lineWidth = Math.max(1.2, s); g.strokeStyle = INK + '.85)'; g.fillStyle = 'rgba(70,90,120,.8)';
  g.beginPath(); g.moveTo(-40 * s, 0); g.bezierCurveTo(-36 * s, -20 * s, 10 * s, -24 * s, 30 * s, -6 * s); g.lineTo(42 * s, -16 * s); g.lineTo(40 * s, 0); g.lineTo(44 * s, 10 * s); g.lineTo(30 * s, 2 * s); g.bezierCurveTo(10 * s, 8 * s, -30 * s, 8 * s, -40 * s, 0); g.fill(); g.stroke();
  g.beginPath(); g.arc(-30 * s, -6 * s, 1.4 * s, 0, 6.283); g.fillStyle = '#e8dab4'; g.fill(); for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(-28 * s, -18 * s); g.quadraticCurveTo(-30 * s + (i - 2) * 5 * s, -32 * s, -28 * s + (i - 2) * 8 * s, -34 * s); g.stroke(); } g.restore(); }
function leviathan(g: CanvasRenderingContext2D, x: number, y: number, k: number, t: number) { const s = k; g.save(); g.translate(x, y); g.lineWidth = Math.max(1.2, s); g.strokeStyle = INK + '.8)'; g.fillStyle = 'rgba(40,70,60,.75)';
  g.beginPath(); g.moveTo(-50 * s, 0); for (let i = 0; i <= 20; i++) { const px = -50 * s + i * 5 * s; g.lineTo(px, -Math.abs(Math.sin(i * 0.9 + t)) * 7 * s - (i > 14 ? (i - 14) * 2 * s : 0)); } g.lineTo(52 * s, 0); g.closePath(); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(48 * s, -14 * s); g.lineTo(62 * s, -22 * s); g.lineTo(58 * s, -10 * s); g.stroke(); g.restore(); }
function wind(g: CanvasRenderingContext2D, x: number, y: number, k: number, ang: number) { const s = k * 1.1; g.save(); g.translate(x, y); g.rotate(ang); g.lineWidth = Math.max(1.2, s); g.strokeStyle = INK + '.85)';
  g.fillStyle = 'rgba(220,226,236,.85)'; for (const [dx, dy, r] of [[-14, -8, 14], [-2, -14, 13], [-16, 8, 12], [-26, 0, 11]]) { g.beginPath(); g.arc(dx * s, dy * s, r * s, 0, 6.283); g.fill(); g.stroke(); }
  g.fillStyle = 'rgba(240,230,210,.95)'; g.beginPath(); g.arc(0, 0, 13 * s, 0, 6.283); g.fill(); g.stroke(); /* o rosto: olhos fechados, bochechas cheias, boca soprando */
  g.beginPath(); g.arc(-3 * s, -4 * s, 2.4 * s, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); g.beginPath(); g.arc(4 * s, -4 * s, 2.4 * s, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
  g.beginPath(); g.arc(9 * s, 3 * s, 3.4 * s, 0, 6.283); g.stroke(); g.beginPath(); g.arc(-7 * s, 4 * s, 3 * s, 0, 6.283); g.fillStyle = 'rgba(230,140,120,.5)'; g.fill();
  g.strokeStyle = INK + '.6)'; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(14 * s, 3 * s + i * 4 * s); g.bezierCurveTo(30 * s, i * 8 * s, 46 * s, i * 12 * s - 6 * s, 66 * s, i * 14 * s); g.stroke(); } g.restore(); }
function rose(g: CanvasRenderingContext2D, x: number, y: number, R: number, t: number) { g.save(); g.translate(x, y); g.lineWidth = 1.2;
  g.strokeStyle = BRASS; g.beginPath(); g.arc(0, 0, R, 0, 6.283); g.stroke(); g.beginPath(); g.arc(0, 0, R * 0.86, 0, 6.283); g.stroke();
  for (let i = 0; i < 64; i++) { const a = (i / 64) * 6.283, l = i % 8 === 0 ? 0.1 : 0.05; g.beginPath(); g.moveTo(Math.cos(a) * R * 0.86, Math.sin(a) * R * 0.86); g.lineTo(Math.cos(a) * R * (0.86 + l), Math.sin(a) * R * (0.86 + l)); g.stroke(); }
  for (let i = 0; i < 16; i++) { const a = (i / 16) * 6.283 - Math.PI / 2, L = i % 4 === 0 ? 0.82 : i % 2 === 0 ? 0.6 : 0.42, w = i % 4 === 0 ? 0.12 : 0.08;
    for (const side of [-1, 1]) { g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a + side * w) * R * 0.22, Math.sin(a + side * w) * R * 0.22); g.lineTo(Math.cos(a) * R * L, Math.sin(a) * R * L); g.closePath(); g.fillStyle = side > 0 ? (i % 4 === 0 ? '#e8d4a0' : '#b88a40') : (i % 4 === 0 ? BRASS2 : '#6a4a20'); g.fill(); g.strokeStyle = 'rgba(30,20,10,.6)'; g.stroke(); } }
  /* a engrenagem no centro (a assinatura dos tecnocratas) */ gear(g, 0, 0, R * 0.14, 10, t * 0.3, BRASS, BRASS2);
  g.font = `700 ${Math.max(10, R * 0.2)}px Cinzel, Georgia, serif`; g.fillStyle = '#f0dca0'; g.textAlign = 'center'; g.textBaseline = 'middle'; for (const [l, a] of [['N', -Math.PI / 2], ['L', 0], ['S', Math.PI / 2], ['O', Math.PI]] as const) g.fillText(l, Math.cos(a) * R * 1.12, Math.sin(a) * R * 1.12); g.restore(); }
function gear(g: CanvasRenderingContext2D, x: number, y: number, r: number, teeth: number, rot: number, c1: string, c2: string) { g.save(); g.translate(x, y); g.rotate(rot); g.beginPath();
  for (let i = 0; i < teeth * 2; i++) { const a0 = (i / (teeth * 2)) * 6.283, a1 = ((i + 1) / (teeth * 2)) * 6.283, rr = i % 2 === 0 ? r : r * 0.8; g.lineTo(Math.cos(a0) * rr, Math.sin(a0) * rr); g.lineTo(Math.cos(a1) * rr, Math.sin(a1) * rr); }
  g.closePath(); g.fillStyle = c1; g.fill(); g.strokeStyle = c2; g.lineWidth = 1; g.stroke(); g.beginPath(); g.arc(0, 0, r * 0.35, 0, 6.283); g.fillStyle = c2; g.fill(); g.restore(); }
function cartouche(g: CanvasRenderingContext2D, x: number, y: number, s: number, t: number) { g.save(); g.translate(x, y);
  /* 07/11: o tamanho segue o texto (antes o subtítulo vazava da moldura) e as engrenagens giram */
  const T1 = 'CARTA NÁUTICA DO MAR DE KARMIKA', T2 = 'levantada pela Companhia de Latão · Academia Tecnocrata de Askavik · Ano 188', f1 = `700 ${20 * s}px Cinzel, Georgia, serif`, f2 = `italic ${11.5 * s}px Georgia, serif`;
  g.font = f1; const w1 = g.measureText(T1).width; g.font = f2; const w2 = g.measureText(T2).width; const w = Math.max(w1, w2) + 70 * s, h = 70 * s;
  const gr = g.createLinearGradient(0, -h / 2, 0, h / 2); gr.addColorStop(0, '#3a2a16'); gr.addColorStop(1, '#1e150b'); g.fillStyle = gr; g.strokeStyle = BRASS; g.lineWidth = 2 * s;
  g.beginPath(); g.moveTo(-w / 2 + 20 * s, -h / 2); g.lineTo(w / 2 - 20 * s, -h / 2); g.quadraticCurveTo(w / 2, -h / 2, w / 2 + 14 * s, 0); g.quadraticCurveTo(w / 2, h / 2, w / 2 - 20 * s, h / 2); g.lineTo(-w / 2 + 20 * s, h / 2); g.quadraticCurveTo(-w / 2, h / 2, -w / 2 - 14 * s, 0); g.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + 20 * s, -h / 2); g.fill(); g.stroke();
  g.strokeStyle = BRASS2; g.lineWidth = 1; g.strokeRect(-w / 2 + 12 * s, -h / 2 + 7 * s, w - 24 * s, h - 14 * s);
  gear(g, -w / 2 - 10 * s, 0, 22 * s, 12, t * 0.5, BRASS, BRASS2); gear(g, -w / 2 - 22 * s, -24 * s, 12 * s, 8, -t * 0.9, BRASS, BRASS2);
  gear(g, w / 2 + 10 * s, 0, 22 * s, 12, -t * 0.5, BRASS, BRASS2); gear(g, w / 2 + 22 * s, 24 * s, 12 * s, 8, t * 0.9, BRASS, BRASS2);
  for (const rx of [-w / 2 + 22 * s, w / 2 - 22 * s]) for (const ry of [-h / 2 + 14 * s, h / 2 - 14 * s]) { g.beginPath(); g.arc(rx, ry, 2.6 * s, 0, 6.283); g.fillStyle = BRASS; g.fill(); } /* rebites */
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#f0dca0'; g.font = f1; g.fillText(T1, 0, -9 * s);
  g.font = f2; g.fillStyle = '#d8c090'; g.fillText(T2, 0, 15 * s); g.restore(); }
function gearsCorner(g: CanvasRenderingContext2D, x: number, y: number, k: number, t: number) { const s = Math.max(0.45, k); gear(g, x, y, 40 * s, 14, t * 0.2, 'rgba(200,150,58,.85)', BRASS2); gear(g, x + 58 * s, y - 22 * s, 24 * s, 10, -t * 0.33, 'rgba(200,150,58,.85)', BRASS2); gear(g, x + 34 * s, y + 44 * s, 18 * s, 8, -t * 0.45, 'rgba(200,150,58,.85)', BRASS2);
  g.save(); g.font = `italic ${11 * s}px Georgia, serif`; g.fillStyle = INK + '.8)'; g.textAlign = 'center'; g.fillText('escala: 100 casas', x + 10 * s, y + 80 * s); g.strokeStyle = INK + '.8)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x - 40 * s, y + 66 * s); g.lineTo(x - 40 * s + 100 * k, y + 66 * s); g.stroke(); for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(x - 40 * s + i * 25 * k, y + 62 * s); g.lineTo(x - 40 * s + i * 25 * k, y + 70 * s); g.stroke(); } g.restore(); }
