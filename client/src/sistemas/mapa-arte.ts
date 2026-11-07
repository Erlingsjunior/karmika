/* A CARTA NÁUTICA (07/11, Erling: "a tela inteira preenchida com o azul do mar, como os mapas antigos: monstros marinhos, rosa dos ventos,
   seres mitológicos soprando nas bordas, e desenhos tecnocráticos — quem faz a cartografia são os tecnocratas steampunk"; "a água toda lisa,
   sem camadas, redemoinhos, tempestades e mudança de cor fica sem graça").
   Tudo aqui é desenhado com tinta de nanquim clara e latão sobre o mar, nas coordenadas do MUNDO (casas): cresce e diminui com o zoom e some
   quando se aproxima demais (a carta é a visão de longe). O mar fora do quadrado do mundo continua com a mesma trama. */
/* 07/11: os bichos do mar saíram (Erling: ficaram feios); ficam tempestades, pedras e redemoinhos. A moldura de cobre é presa à tela */

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
  g.restore();
}
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

/* 07/11 (Erling: "uma moldura de canos de cobre com engrenagens em volta de todo o mapa; o banner nasce dentro dela; a moldura não sofre
   zoom nem nada, está sempre lá emoldurando; a rosa dos ventos no canto inferior direito, também fixa"). Desenhada por último, presa à tela */
const CU = ['#5a2a12', '#b8642e', '#f0a868', '#c87038', '#6a3216'];
function pipe(g: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, r: number) { const hz = y0 === y1, gr = hz ? g.createLinearGradient(0, y0 - r, 0, y0 + r) : g.createLinearGradient(x0 - r, 0, x0 + r, 0);
  CU.forEach((c, i) => gr.addColorStop(i / (CU.length - 1), c)); g.fillStyle = gr; if (hz) g.fillRect(Math.min(x0, x1), y0 - r, Math.abs(x1 - x0), r * 2); else g.fillRect(x0 - r, Math.min(y0, y1), r * 2, Math.abs(y1 - y0)); }
function flange(g: CanvasRenderingContext2D, x: number, y: number, r: number, hz: boolean) { const w = r * 0.9, h = r * 2.9; g.save(); g.translate(x, y); if (!hz) g.rotate(Math.PI / 2);
  const gr = g.createLinearGradient(0, -h / 2, 0, h / 2); gr.addColorStop(0, '#4a2210'); gr.addColorStop(0.45, '#e09a5a'); gr.addColorStop(1, '#4a2210'); g.fillStyle = gr; g.fillRect(-w / 2, -h / 2, w, h);
  g.fillStyle = '#2a1408'; for (const yy of [-h / 2 + 3, h / 2 - 3]) { g.beginPath(); g.arc(0, yy, 1.4, 0, 6.283); g.fill(); } g.restore(); }
export function drawMapFrame(g: CanvasRenderingContext2D, W: number, H: number, t: number) {
  const R = 7, M = 11; g.save();
  /* sombra para dentro, a carta parece afundada na moldura */
  const sh = 26; for (const [x0, y0, x1, y1, w, h] of [[0, M, 0, M + sh, W, sh], [0, H - M, 0, H - M - sh, W, sh], [M, 0, M + sh, 0, sh, H], [W - M, 0, W - M - sh, 0, sh, H]] as const) {
    const gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, 'rgba(0,0,0,.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(Math.min(x0, x1, W - w), Math.min(y0, y1), w, h); }
  /* faixa escura atrás dos canos, até a borda */
  g.fillStyle = '#140c06'; g.fillRect(0, 0, W, M - 3); g.fillRect(0, H - M + 3, W, M); g.fillRect(0, 0, M - 3, H); g.fillRect(W - M + 3, 0, M, H);
  /* dois canos paralelos em cada lado: um grosso de cobre e um fino de latão por dentro */
  pipe(g, 0, M, W, M, R); pipe(g, 0, H - M, W, H - M, R); pipe(g, M, 0, M, H, R); pipe(g, W - M, 0, W - M, H, R);
  const r2 = 2.6, I = M + R + 3; g.globalAlpha = 0.9; pipe(g, I, I, W - I, I, r2); pipe(g, I, H - I, W - I, H - I, r2); pipe(g, I, I, I, H - I, r2); pipe(g, W - I, I, W - I, H - I, r2); g.globalAlpha = 1;
  /* juntas com parafusos ao longo dos canos */
  const step = 140; for (let x = 90; x < W - 80; x += step) { flange(g, x, M, R, true); flange(g, x + 40, H - M, R, true); }
  for (let y = 90; y < H - 80; y += step) { flange(g, M, y, R, false); flange(g, W - M, y + 50, R, false); }
  /* válvulas e manômetros pelo caminho */
  for (const [x, y] of [[W * 0.25, H - M], [W * 0.75, M], [M, H * 0.6], [W - M, H * 0.35]] as const) { g.fillStyle = '#2a1408'; g.beginPath(); g.arc(x, y, 9, 0, 6.283); g.fill(); g.fillStyle = '#e8dcc0'; g.beginPath(); g.arc(x, y, 7, 0, 6.283); g.fill();
    g.strokeStyle = '#b8642e'; g.lineWidth = 2; g.stroke(); const a = -2.2 + Math.sin(t * 0.9 + x) * 0.5 + 1.6; g.strokeStyle = '#8a1a10'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 5.5, y + Math.sin(a) * 5.5); g.stroke(); }
  /* engrenagens nos quatro cantos, girando engatadas */
  for (const [cx, cy, d] of [[M, M, 1], [W - M, M, -1], [M, H - M, -1], [W - M, H - M, 1]] as const) { gear(g, cx, cy, 24, 14, t * 0.35 * d, '#c87038', '#5a2a12'); gear(g, cx + (cx < W / 2 ? 34 : -34), cy + (cy < H / 2 ? 14 : -14), 13, 9, -t * 0.65 * d + 0.2, BRASS, BRASS2);
    g.fillStyle = '#2a1408'; g.beginPath(); g.arc(cx, cy, 6, 0, 6.283); g.fill(); g.fillStyle = '#e09a5a'; g.beginPath(); g.arc(cx, cy, 3, 0, 6.283); g.fill(); }
  /* o banner nasce no cano de cima, centralizado */
  const sc = Math.min(1, Math.max(0.62, W / 1000)); cartouche(g, W / 2, M + 30 * sc, sc, t);
  /* a rosa dos ventos presa no canto de baixo à direita */
  const rr = Math.min(58, Math.max(36, Math.min(W, H) * 0.075)); g.fillStyle = 'rgba(10,16,30,.55)'; g.beginPath(); g.arc(W - M - rr - 30, H - M - rr - 32, rr + 12, 0, 6.283); g.fill(); rose(g, W - M - rr - 30, H - M - rr - 32, rr, t);
  g.restore(); }
