/* O círculo rúnico de cada postura, desenhado em canvas (com cache). Saiu do main.ts (02/11). */
import * as THREE from 'three';
export const ST_ICON: Record<string, string> = { bal: '◎', atk: '⚔', tank: '🛡', heal: '✚', speed: '➶', leech: '🩸' };
export const stTex = new Map<string, THREE.CanvasTexture>();
/* 26/10 noite (Erling: "as auras estão feinhas"): círculo rúnico desenhado à mão — sem emoji no chão.
   Anel de bronze escuro por baixo, traço na cor da postura por cima, marcas de relógio, três arcos de runas
   e o símbolo do papel desenhado em vetor três vezes ao redor (o centro fica sob os pés e não se vê). */
export function stGlyph(g: CanvasRenderingContext2D, role: string, x: number, y: number, s: number, rot: number) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s / 10, s / 10); g.beginPath();
  if (role === 'atk') { g.moveTo(0, -10); g.lineTo(2.2, -6); g.lineTo(2.2, 4); g.lineTo(6, 4); g.lineTo(6, 6); g.lineTo(1.6, 6); g.lineTo(1.6, 10); g.lineTo(-1.6, 10); g.lineTo(-1.6, 6); g.lineTo(-6, 6); g.lineTo(-6, 4); g.lineTo(-2.2, 4); g.lineTo(-2.2, -6); g.closePath(); }
  else if (role === 'tank') { g.moveTo(0, -9); g.lineTo(8, -6); g.quadraticCurveTo(8, 5, 0, 10); g.quadraticCurveTo(-8, 5, -8, -6); g.closePath(); }
  else if (role === 'heal') { g.rect(-2.6, -9, 5.2, 18); g.rect(-9, -2.6, 18, 5.2); }
  else if (role === 'speed') { g.moveTo(-9, -6); g.lineTo(0, 0); g.lineTo(-9, 6); g.lineTo(-6, 0); g.closePath(); g.moveTo(-1, -6); g.lineTo(8, 0); g.lineTo(-1, 6); g.lineTo(2, 0); g.closePath(); }
  else if (role === 'leech') { g.moveTo(0, -10); g.bezierCurveTo(4, -4, 7, 0, 7, 3.5); g.arc(0, 3.5, 7, 0, Math.PI); g.bezierCurveTo(-7, 0, -4, -4, 0, -10); g.closePath(); }
  else { g.arc(0, 0, 8, 0, 6.283); g.moveTo(4, 0); g.arc(0, 0, 4, 0, 6.283); }
  g.restore(); }

export function stanceTex(id: string, role: string, col: string, stOrigin = 'human') { const key = id.startsWith('povo') ? id + ':' + stOrigin : id; let t = stTex.get(key); if (t) return t; const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d')!; g.scale(4, 4);
  const ink = '#0b0906', C = 64, two = (fn: () => void, w: number, a = 1) => { g.globalAlpha = 0.8 * a; g.strokeStyle = ink; g.fillStyle = ink; g.lineWidth = w + 2.4; fn(); g.globalAlpha = a; g.strokeStyle = col; g.fillStyle = col; g.lineWidth = w; fn(); };
  g.lineCap = 'round'; g.lineJoin = 'round';
  two(() => { g.beginPath(); g.arc(C, C, 57, 0, 6.283); g.stroke(); }, 3.2);
  two(() => { g.beginPath(); g.arc(C, C, 50.5, 0, 6.283); g.stroke(); }, 1.1, 0.9);
  /* marcas de relógio entre os dois anéis: 24 curtas, 6 longas */
  two(() => { g.beginPath(); for (let i = 0; i < 24; i++) { const a = i / 24 * 6.283, L = i % 4 === 0 ? 5.5 : 2.6; g.moveTo(C + Math.cos(a) * 51.5, C + Math.sin(a) * 51.5); g.lineTo(C + Math.cos(a) * (51.5 + L), C + Math.sin(a) * (51.5 + L)); } g.stroke(); }, 1.2);
  /* três arcos internos, entre os símbolos: o desenho é do CAMINHO (ou do povo, para quem ainda não escolheu) — 26/10 noite */
  const motif = id.startsWith('povo') ? (stOrigin === 'dwarf' ? 'anao' : stOrigin === 'elf' ? 'elfo' : 'humano') : id.split('_')[0];
  const P = (a: number, r: number): [number, number] => [C + Math.cos(a) * r, C + Math.sin(a) * r];
  for (let k = 0; k < 3; k++) { const mid = k * 2.094 - 0.524, a0 = mid - 0.62, a1 = mid + 0.62, N = 9, at = (i: number) => a0 + 0.06 + i * (a1 - a0 - 0.12) / (N - 1);
    const arc = (r: number) => { g.beginPath(); g.arc(C, C, r, a0, a1); g.stroke(); };
    if (motif === 'humano') { two(() => arc(41), 1.6); two(() => { g.beginPath(); for (let i = 0; i < N; i++) { const h = i % 2 ? 3 : 5; g.moveTo(...P(at(i), 41)); g.lineTo(...P(at(i), 41 - h)); } g.stroke(); }, 1.1, 0.9); }
    else if (motif === 'anao') { /* corrente de losangos de ferro, angulosa como runa de forja */
      two(() => arc(40), 1); two(() => { for (let i = 0; i < N; i++) { const a = at(i); g.beginPath(); g.moveTo(...P(a, 44)); g.lineTo(...P(a + 0.045, 40)); g.lineTo(...P(a, 36)); g.lineTo(...P(a - 0.045, 40)); g.closePath(); i % 2 ? g.stroke() : g.fill(); } }, 1.1); }
    else if (motif === 'elfo') { /* ramo: uma vinha ondulada com folhinhas */
      two(() => { g.beginPath(); for (let i = 0; i <= 40; i++) { const a = a0 + (a1 - a0) * i / 40, r = 40 + Math.sin(i / 40 * Math.PI * 4) * 2.2; i ? g.lineTo(...P(a, r)) : g.moveTo(...P(a, r)); } g.stroke(); }, 1.2);
      two(() => { for (let i = 1; i < 8; i++) { const a = a0 + (a1 - a0) * i / 8, out = i % 2 ? 1 : -1, [x, y] = P(a, 40 + out * 1.5); g.save(); g.translate(x, y); g.rotate(a + (out > 0 ? 0.6 : -0.6)); g.beginPath(); g.ellipse(out * 3.2, 0, 3.2, 1.4, 0, 0, 6.283); g.fill(); g.restore(); } }, 0.6); }
    else if (motif === 'gue') { /* runas nórdicas: haste com galhos (feitas a traço, não letras de verdade) */
      two(() => arc(36), 1); two(() => { g.beginPath(); for (let i = 0; i < 7; i++) { const a = a0 + 0.1 + i * (a1 - a0 - 0.2) / 6, [x0, y0] = P(a, 45), [x1, y1] = P(a, 38), d = 0.06 * (i % 2 ? 1 : -1); g.moveTo(x0, y0); g.lineTo(x1, y1); g.moveTo(...P(a, 44)); g.lineTo(...P(a + d, 41)); if (i % 3 === 0) { g.moveTo(...P(a, 41)); g.lineTo(...P(a - d, 38.5)); } } g.stroke(); }, 1.3); }
    else if (motif === 'pal') { /* raios de sol para dentro, longos e curtos, com o arco dourado */
      two(() => arc(44), 1.4); two(() => { g.beginPath(); for (let i = 0; i < 13; i++) { const a = a0 + 0.05 + i * (a1 - a0 - 0.1) / 12, L = i % 2 ? 4 : 9; g.moveTo(...P(a, 43)); g.lineTo(...P(a, 43 - L)); } g.stroke(); }, 1.2); }
    else if (motif === 'tec') { /* engrenagem: arco com dentes quadrados e um parafuso no meio */
      two(() => { g.beginPath(); const n = 10; for (let i = 0; i < n; i++) { const b0 = a0 + i * (a1 - a0) / n, b1 = b0 + (a1 - a0) / n, bm = (b0 + b1) / 2; g.arc(C, C, 39, b0, bm - 0.03); g.lineTo(...P(bm - 0.03, 43.5)); g.arc(C, C, 43.5, bm - 0.03, b1 - 0.02); g.lineTo(...P(b1 - 0.02, 39)); } g.stroke(); }, 1.1);
      two(() => { const [x, y] = P(mid, 34); g.beginPath(); g.arc(x, y, 2.4, 0, 6.283); g.stroke(); }, 1); }
    else if (motif === 'vam') { /* espinhos para dentro e uma gota pingando no meio */
      two(() => { g.beginPath(); g.arc(C, C, 43, a0, a1); for (let i = 0; i < 8; i++) { const a = a0 + 0.06 + i * (a1 - a0 - 0.12) / 7; g.moveTo(...P(a - 0.045, 43)); g.lineTo(...P(a, 36 + (i % 2) * 3)); g.lineTo(...P(a + 0.045, 43)); } g.stroke(); }, 1.1);
      two(() => { const [x, y] = P(mid, 31); g.beginPath(); g.moveTo(x, y - 3.2); g.quadraticCurveTo(x + 2.4, y, x, y + 2); g.quadraticCurveTo(x - 2.4, y, x, y - 3.2); g.fill(); }, 0.5); }
    else if (motif === 'lob') { /* três marcas de garra, curvas, cruzando o arco */
      two(() => { for (let j = -1; j <= 1; j++) { const a = mid + j * 0.32; g.beginPath(); g.moveTo(...P(a - 0.12, 45)); g.quadraticCurveTo(...P(a + 0.02, 40), ...P(a + 0.1, 33)); g.stroke(); } }, 2);
      two(() => arc(47.5), 0.7, 0.6); }
    else if (motif === 'cac') { /* estacas de prata apontadas para dentro, entre duas linhas */
      two(() => { arc(44.5); arc(37); }, 0.9); two(() => { for (let i = 0; i < 5; i++) { const a = a0 + 0.12 + i * (a1 - a0 - 0.24) / 4; g.beginPath(); g.moveTo(...P(a - 0.03, 44)); g.lineTo(...P(a + 0.03, 44)); g.lineTo(...P(a, 37.5)); g.closePath(); g.fill(); } }, 0.6); }
    else if (motif === 'mag') { /* constelação: estrelinhas ligadas por linhas finas */
      const pts: [number, number][] = []; for (let i = 0; i < 6; i++) pts.push(P(a0 + 0.08 + i * (a1 - a0 - 0.16) / 5, 40 + (i % 2 ? -3.5 : 2.5)));
      two(() => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.stroke(); }, 0.8);
      two(() => { for (const [x, y] of pts) { g.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? 1 : 2.8, a = i * 0.785; i ? g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r) : g.moveTo(x + r, y); } g.closePath(); g.fill(); } }, 0.5); }
    else if (motif === 'bru') { /* corrente de pacto: zigue-zague com olhos fechados */
      two(() => { g.beginPath(); for (let i = 0; i <= 12; i++) { const a = a0 + i * (a1 - a0) / 12, r = i % 2 ? 37 : 44; i ? g.lineTo(...P(a, r)) : g.moveTo(...P(a, r)); } g.stroke(); }, 1.1);
      two(() => { for (const f of [-0.35, 0, 0.35]) { const [x, y] = P(mid + f, 32); g.beginPath(); g.ellipse(x, y, 2.6, 1.2, mid + f + 1.571, 0, 6.283); g.stroke(); } }, 0.8); }
  }
  /* o símbolo do papel, três vezes, sempre de pé para fora */
  for (let k = 0; k < 3; k++) { const a = k * 2.094 - 1.571 + 0.0, x = C + Math.cos(a) * 43, y = C + Math.sin(a) * 43;
    g.globalAlpha = 0.85; g.fillStyle = ink; g.beginPath(); g.arc(x, y, 9.5, 0, 6.283); g.fill();
    g.globalAlpha = 1; g.strokeStyle = col; g.lineWidth = 1.3; g.beginPath(); g.arc(x, y, 9.5, 0, 6.283); g.stroke();
    g.fillStyle = col; stGlyph(g, role, x, y, 6.6, a + 1.571); g.fill(role === 'bal' ? 'evenodd' : 'nonzero'); }
  t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.userData.keep = true; stTex.set(key, t); return t; }
