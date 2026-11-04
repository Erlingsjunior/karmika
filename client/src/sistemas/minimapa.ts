import { INSTINCT_MARKS } from '../segredos';
/* MINIMAPA: a imagem base do mundo, o zoom, os ícones e marcadores, o mapa grande (janela) e seus cliques. Saiu do main.ts (02/11). */
import { MAP_W, groundH, WL, heightAt } from '../world';
import { TILE_M as T, isWalkable } from '@karmika/shared';
import { floatWin } from '../windows';
import * as THREE from 'three';
import { STATION_INFO } from '../stations3d';
import type { MinimapaCtx } from '../main';

export type MapHit = { x: number; y: number; r: number; name: string; sub: string; go?: string };
export function createMinimapa(K: MinimapaCtx) {
/* ---------- minimapa ---------- */
const MMS = MAP_W;
const mmBase = document.createElement('canvas'); mmBase.width = mmBase.height = MMS;
{
  const g = mmBase.getContext('2d')!; const BC: Record<string, string> = { meadow: '#5a8a3e', forest: '#2f6a34', swamp: '#53623c', snow: '#e4edf5', ruins: '#6a6a64', rock: '#7a736a', volcanic: '#2e2628', enchanted: '#5a4a8a', blight: '#4a3c46', jungle: '#1e4a22', coast: '#c8b488' };
  /* mapa com cara de carta: cor do bioma, relevo sombreado (luz do noroeste), copas mais escuras, água mais funda longe da margem */
  const HG = K.MM_HG, hw = K.mmHw, hgt = K.mmHgt;
  const hAt = (x: number, y: number) => hgt[Math.max(0, Math.min(hw - 1, Math.floor(y / HG))) * hw + Math.max(0, Math.min(hw - 1, Math.floor(x / HG)))];
  const id = g.createImageData(MMS, MMS), D = id.data, rgb = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const BCR: Record<string, number[]> = Object.fromEntries(Object.entries(BC).map(([k, v]) => [k, rgb(v)]));
  for (let y = 0; y < MMS; y++) for (let x = 0; x < MMS; x++) { const t = K.city.map[y]?.[x]; let c: number[]; let sh = 1;
    if (t === 'water') { let shore = 0; for (let k = 1; k <= 3 && !shore; k++) if (K.city.map[y - k]?.[x] !== 'water' || K.city.map[y + k]?.[x] !== 'water' || K.city.map[y]?.[x - k] !== 'water' || K.city.map[y]?.[x + k] !== 'water') shore = k; c = shore === 1 ? [70, 120, 170] : shore ? [52, 100, 156] : [38, 78, 130]; }
    else { c = t === 'road' ? [160, 134, 94] : t === 'plaza' ? [184, 166, 128] : BCR[K.city.biome[y]?.[x] ?? 'meadow'] ?? BCR.meadow; if (t === 'tree') c = c.map((v) => v * 0.72); sh = Math.max(0.6, Math.min(1.45, 1 + (hAt(x - 2, y - 2) - hAt(x + 2, y + 2)) * 0.32)); }
    const o = (y * MMS + x) * 4; D[o] = Math.min(255, c[0] * sh); D[o + 1] = Math.min(255, c[1] * sh); D[o + 2] = Math.min(255, c[2] * sh); D[o + 3] = 255; }
  g.putImageData(id, 0, 0);
  for (const p of K.city.props) { if (p.kind === 'house' || p.kind === 'temple' || p.kind === 'church' || p.kind === 'stall' || p.kind === 'tent') { g.fillStyle = p.kind === 'temple' || p.kind === 'church' ? '#a898c8' : '#7a4a32'; g.fillRect(p.gx, p.gy, p.w, p.h); } }
}
const BNAME: Record<string, string> = { meadow: 'Campos', forest: 'Floresta', swamp: 'Pântano', snow: 'Terras Geladas', ruins: 'Terras Antigas', rock: 'Garganta de Pedra', volcanic: 'Montanha Negra', enchanted: 'Floresta Encantada', blight: 'Terras Malditas', jungle: 'Selva Licantropa', coast: 'Costa do Vapor' };
const mmEl = document.getElementById('mm') as HTMLCanvasElement, mg = mmEl.getContext('2d')!;
/* círculo do minimapa redimensionável: arraste a alça ◣ (canto de baixo à esquerda); duplo clique volta ao padrão; tamanho salvo */
{ const mini = document.getElementById('mini') as HTMLElement, grip = document.createElement('div'); grip.className = 'mmgrip'; grip.title = 'Arraste para aumentar ou diminuir o minimapa (duplo clique: padrão)'; mini.appendChild(grip);
  /* 26/10 (Erling: "o minimapa pode ser um pouco maior no 1.0 padrão… e ter zoom"): padrão 210 (o antigo 170 sobe junto); a escala da interface já o acompanha */
  let D = 210; try { D = +(localStorage.getItem('karmika.minisize') || 210) || 210; if (D === 170) D = 210; } catch { /* */ }
  const set = (d: number, save = false) => { D = Math.round(Math.max(120, Math.min(Math.min(560, innerHeight * 0.75), d))); mmEl.width = mmEl.height = D; mmEl.style.width = mmEl.style.height = D + 'px'; mini.style.width = D + 8 + 'px'; { const C = D / 2 + 4; grip.style.left = C - D * 0.354 - 9 + 'px'; grip.style.top = C + D * 0.354 - 11 + 'px'; } /* na borda do círculo, a 45° em baixo à esquerda */ if (save) try { localStorage.setItem('karmika.minisize', String(D)); } catch { /* */ } };
  set(D);
  let rs: { x: number; y: number; d: number } | null = null;
  grip.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); rs = { x: e.clientX, y: e.clientY, d: D }; grip.setPointerCapture(e.pointerId); });
  grip.addEventListener('pointermove', (e) => { if (rs) set(rs.d + Math.max(rs.x - e.clientX, e.clientY - rs.y)); }); // preso no canto de cima à direita: cresce para baixo e para a esquerda
  const end = () => { if (rs) { rs = null; set(D, true); } }; grip.addEventListener('pointerup', end); grip.addEventListener('pointercancel', end);
  grip.addEventListener('dblclick', (e) => { e.stopPropagation(); set(210, true); });
  /* zoom do minimapa: botões + e − na borda e a roda do mouse em cima dele */
  const zb = document.createElement('div'); zb.className = 'mmzoom'; zb.innerHTML = '<button data-z="1" title="Aproximar o minimapa">+</button><button data-z="-1" title="Afastar o minimapa">−</button>'; mini.appendChild(zb);
  const zt = () => { zb.style.left = D / 2 + 4 + D * 0.354 - 6 + 'px'; zb.style.top = D / 2 + 4 + D * 0.354 - 30 + 'px'; }; zt(); const set0 = set; void set0;
  new ResizeObserver(zt).observe(mmEl);
  zb.addEventListener('pointerdown', (e) => e.stopPropagation());
  zb.addEventListener('click', (e) => { e.stopPropagation(); const b = (e.target as HTMLElement).closest('[data-z]') as HTMLElement | null; if (b) miniZoomBy(+b.dataset.z! > 0 ? 1.25 : 0.8); });
  /* 26/10 (Erling: "deixar ele no tamanho que a gente desejar, expandir ou mudar de lugar como fazemos com as janelas"):
     arraste o minimapa para onde quiser (duplo clique nele: volta ao canto); o tamanho continua no puxador da borda */
  const MPK = 'karmika.minipos'; let off = { x: 0, y: 0 }; try { off = JSON.parse(localStorage.getItem(MPK) || 'null') ?? off; } catch { /* */ }
  const uiK = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ui')) || 1;
  const applyPos = () => { mini.style.translate = off.x || off.y ? `${off.x / uiK()}px ${off.y / uiK()}px` : ''; };
  const keepIn = () => { const r = mini.getBoundingClientRect(); if (r.left < 0) off.x -= r.left; else if (r.right > innerWidth) off.x -= r.right - innerWidth; if (r.top < 0) off.y -= r.top; else if (r.bottom > innerHeight) off.y -= r.bottom - innerHeight; applyPos(); };
  applyPos(); setTimeout(keepIn, 500); addEventListener('resize', () => keepIn());
  let mvd: { x: number; y: number; ox: number; oy: number; moved: boolean } | null = null; mmEl.style.cursor = 'grab'; mmEl.title = 'Arraste para mudar o minimapa de lugar · roda do mouse: zoom · duplo clique: volta ao canto';
  mmEl.addEventListener('pointerdown', (e) => { if (e.button !== 0) return; e.preventDefault(); e.stopPropagation(); mvd = { x: e.clientX, y: e.clientY, ox: off.x, oy: off.y, moved: false }; mmEl.setPointerCapture(e.pointerId); mmEl.style.cursor = 'grabbing'; });
  mmEl.addEventListener('pointermove', (e) => { if (!mvd) return; const dx = e.clientX - mvd.x, dy = e.clientY - mvd.y; if (Math.hypot(dx, dy) > 4) mvd.moved = true; if (mvd.moved) { off = { x: mvd.ox + dx, y: mvd.oy + dy }; applyPos(); } });
  const mvEnd = () => { if (!mvd) return; const was = mvd.moved; mvd = null; mmEl.style.cursor = 'grab'; if (was) { keepIn(); try { localStorage.setItem(MPK, JSON.stringify(off)); } catch { /* */ } } };
  mmEl.addEventListener('pointerup', mvEnd); mmEl.addEventListener('pointercancel', mvEnd);
  mmEl.addEventListener('dblclick', (e) => { e.stopPropagation(); off = { x: 0, y: 0 }; applyPos(); try { localStorage.removeItem(MPK); } catch { /* */ } });
  mmEl.addEventListener('wheel', (e) => { e.preventDefault(); e.stopPropagation(); miniZoomBy(e.deltaY < 0 ? 1.15 : 0.87); }, { passive: false });
}
function miniZoomBy(f: number) { K.guiaSys.mmZoom = Math.max(0.5, Math.min(4, K.guiaSys.mmZoom * f)); try { localStorage.setItem('karmika.minizoom', String(K.guiaSys.mmZoom)); } catch { /* */ } K.drawMini(); }
const bmEl = document.getElementById('bm') as HTMLCanvasElement, bg = bmEl.getContext('2d')!, bigEl = document.getElementById('bigmap') as HTMLElement;
let bigOpen = false;
/** viajar pelo mapa até uma relíquia conhecida (as regras do véu: não de dentro de um prédio, não com inimigos na cola) */
function mapTravel(go: string) { if (K.inside) { K.game.logMsg('Saia para o céu aberto para atravessar o véu.', '#ff9a8a'); return; } if (K.combatMode) { const hp = K.heroPosNow(), hunted = K.game.enemies.list.some((en) => en.alive && en.active && (en.state === 'chase' || en.state === 'windup') && Math.hypot(en.pos.x - hp.x, en.pos.z - hp.z) < 16); if (hunted) { K.game.logMsg('Há inimigos atrás de você: o véu não se abre no meio da luta.', '#ff9a8a'); return; } K.setCombat(false); } if (bigOpen) toggleBigMap(); K.travelRelic(go); }
/* 27/10 (Erling: "colocar no mapa todos os pontos mais lindos do jogo… maravilhas, lugares, cidades, vilas, para abrir o mapa e ir rapidamente"):
   a lateral do mapa lista as maravilhas, cidades, vilas, masmorras, lugares e relíquias; clique centra o mapa e marca a guia; ✦ viaja pela relíquia conhecida mais perto do lugar */
const WONDERS = new Set(['Fortaleza de Odin', 'Abadia da Aurora', 'Bastião de Prata', 'Vale da Desgraça', 'Árvore-Mãe do Uivo', 'Castelo da Colina Vampírica', 'Pináculo de Marfim', 'A Grande Caldeira', 'Academia da Graxa', 'Portões de Brasaforja', 'Catedral de Askavik', 'Castelo de Askavik', 'Ruínas de Aravel', 'Grande Biblioteca']);
let sideOpen = true; try { sideOpen = localStorage.getItem('karmika.mapside') !== '0'; } catch { /* */ }
function sideHtml() {
  const h0 = K.hereT(), dist = (x: number, y: number) => Math.hypot(x - h0.x, y - h0.y) * T;
  const relNear = (x: number, y: number) => { let best: { name: string; d: number } | null = null; for (const r of K.city.relics) { if (!K.knowsRelic(r.name)) continue; const d = Math.hypot(r.x - x, r.y - y); if (d < 16 && (!best || d < best.d)) best = { name: r.name, d }; } return best?.name ?? null; };
  const row = (name: string, x: number, y: number, sub: string, known = true) => { const rel = known ? relNear(x, y) : null; return `<button data-see="${x},${y}" data-nm="${name}" class="${known ? '' : 'dim'}"><b>${name}</b><small>${known ? `${sub} · ${fmtDist(dist(x, y))}` : 'ainda não visitada'}</small>${rel ? `<i data-trav="${rel}" title="Atravessar o véu até ${rel}">✦</i>` : ''}</button>`; };
  const sec = (title: string, rows: string[]) => rows.length ? `<h3>${title} <small>${rows.length}</small></h3>${rows.join('')}` : '';
  const won = K.city.pois.filter((q) => WONDERS.has(q.name)).sort((a, b) => dist(a.x, a.y) - dist(b.x, b.y)).map((q) => row(q.name, q.x, q.y, 'Maravilha', K.discovered.has(q.name)));
  const cid = K.city.settlements.filter((q) => q.kind === 'city' && K.discovered.has(q.name)).map((q) => row(q.name, q.x, q.y, 'Cidade'));
  const vil = K.city.settlements.filter((q) => q.kind !== 'city' && K.discovered.has(q.name)).sort((a, b) => dist(a.x, a.y) - dist(b.x, b.y)).map((q) => row(q.name, q.x, q.y, 'Vila'));
  let dg: string[] = []; try { dg = K.dgs.entrances.filter((e) => K.discovered.has(e.d.name)).sort((a, b) => dist(a.x, a.y) - dist(b.x, b.y)).map((e) => row(e.d.name, e.x, e.y, `Masmorra · nv ${e.lvl[0]}–${e.lvl[1]}`)); } catch { /* */ }
  const poi = K.city.pois.filter((q) => !WONDERS.has(q.name) && K.discovered.has(q.name) && !K.city.settlements.some((s2) => s2.name === q.name)).sort((a, b) => dist(a.x, a.y) - dist(b.x, b.y)).map((q) => row(q.name, q.x, q.y, 'Lugar'));
  const rel = K.city.relics.filter((r) => K.knowsRelic(r.name)).sort((a, b) => dist(a.x, a.y) - dist(b.x, b.y)).map((r) => `<button data-see="${r.x},${r.y}" data-nm="${r.name}"><b>${r.name.replace(/^Relíquia(:| de) /, '')}</b><small>Relíquia · ${fmtDist(dist(r.x, r.y))}</small><i data-trav="${r.name}" title="Atravessar o véu">✦</i></button>`);
  return `<div class="mside-h">Lugares de Karmika <button data-side title="Esconder a lista">‹</button></div><div class="mside-l">${sec('✨ Maravilhas', won)}${sec('🏰 Cidades', cid)}${sec('🏘 Vilas', vil)}${sec('🕳 Masmorras', dg)}${sec('◆ Lugares', poi)}${sec('✦ Relíquias', rel)}${won.length + cid.length + vil.length + dg.length + poi.length + rel.length ? '' : '<em>Os lugares entram aqui quando você chega perto deles.</em>'}</div>`;
}
function drawSide() { const el = bigEl.querySelector('.mside') as HTMLElement | null; if (!el) return; el.classList.toggle('closed', !sideOpen); if (sideOpen) el.innerHTML = sideHtml(); else el.innerHTML = '<button data-side class="mside-open" title="Lugares de Karmika">☰ Lugares</button>'; }
function toggleBigMap() { bigOpen = !bigOpen; bigEl.style.display = bigOpen ? 'block' : 'none'; if (bigOpen) { bigEl.dispatchEvent(new Event('karmika:open')); const h0 = K.hereT(); mapV.cx = h0.x; mapV.cy = h0.y; mapV.z = Math.max(mapV.z, 6.4); /* abre perto: lugares, níveis e região legíveis */ K.drawBig(); drawSide(); } }
setTimeout(() => floatWin(bigEl, 'map', { left: 'calc(50vw - 470px)', top: '5vh' }), 0);
{ const ms = bigEl.querySelector('.mside') as HTMLElement | null; if (ms) { ms.addEventListener('pointerdown', (e) => e.stopPropagation()); ms.addEventListener('wheel', (e) => e.stopPropagation(), { passive: true }); } } // a lista não arrasta nem dá zoom no mapa
/* janela do mapa redimensionável: arraste o canto ◢ (duplo clique volta ao padrão) ou ⛶ para maximizar; o tamanho fica salvo */
{
  const pn = bigEl.querySelector('.mappn') as HTMLElement, mv = bigEl.querySelector('.mview') as HTMLElement, grip = bigEl.querySelector('.mgrip') as HTMLElement;
  const KEY = 'karmika.mapsize', chrome = () => pn.offsetHeight - mv.offsetHeight; // título, legenda e rodapé
  const defSize = () => { const w = Math.min(940, innerWidth * 0.96); return { w, h: Math.min(w * 0.68, innerHeight - 220) }; };
  let size = defSize(), maxed: { w: number; h: number; l: string; t: string } | null = null;
  try { const s0 = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s0?.w && s0?.h) size = s0; } catch { /* */ }
  const apply = () => {
    const ch = chrome() || 150;
    size.w = Math.round(Math.max(420, Math.min(innerWidth - 8, size.w))); size.h = Math.round(Math.max(260, Math.min(innerHeight - ch - 8, size.h)));
    pn.style.width = size.w + 'px'; mv.style.height = size.h + 'px';
  };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ w: size.w, h: size.h })); } catch { /* */ } };
  // o canvas acompanha o tamanho real da janela (sem esticar): mais espaço = mais mapa à vista
  new ResizeObserver(() => { const w = Math.max(1, Math.round(mv.clientWidth)), h = Math.max(1, Math.round(mv.clientHeight)); if (bmEl.width !== w || bmEl.height !== h) { bmEl.width = w; bmEl.height = h; mapV.z = Math.max(mapV.z, mapZMin()); if (bigOpen) K.drawBig(); } }).observe(mv);
  apply();
  let rs: { x: number; y: number; w: number; h: number } | null = null;
  grip.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); maxed = null; rs = { x: e.clientX, y: e.clientY, w: size.w, h: size.h }; grip.setPointerCapture(e.pointerId); });
  grip.addEventListener('pointermove', (e) => { if (!rs) return; const r = bigEl.getBoundingClientRect(); size.w = Math.min(rs.w + e.clientX - rs.x, innerWidth - r.left - 4); size.h = Math.min(rs.h + e.clientY - rs.y, innerHeight - r.top - chrome() - 4); apply(); });
  const end = () => { if (rs) { rs = null; save(); } }; grip.addEventListener('pointerup', end); grip.addEventListener('pointercancel', end);
  grip.addEventListener('dblclick', (e) => { e.stopPropagation(); size = defSize(); apply(); save(); });
  pn.querySelector('[data-max]')!.addEventListener('click', (e) => {
    e.stopPropagation();
    pn.style.translate = ''; bigEl.style.translate = ''; // sem deslocamento extra: o botão de restaurar nunca sai da tela
    if (maxed) { size = { w: maxed.w, h: maxed.h }; bigEl.style.left = maxed.l; bigEl.style.top = maxed.t; maxed = null; }
    else { maxed = { w: size.w, h: size.h, l: bigEl.style.left, t: bigEl.style.top }; bigEl.style.left = '4px'; bigEl.style.top = '4px'; bigEl.style.right = 'auto'; size = { w: innerWidth - 8, h: innerHeight - chrome() - 12 }; }
    apply(); if (!maxed) save();
  });
  addEventListener('resize', () => { if (maxed) size = { w: innerWidth - 8, h: innerHeight - chrome() - 12 }; apply(); });
  { const h2 = pn.querySelector('h2') as HTMLElement; let dg: { x: number; y: number; l: number; t: number } | null = null; h2.style.cursor = 'grab';
    h2.addEventListener('pointerdown', (e) => { if ((e.target as HTMLElement).closest('button') || maxed) return; const r = bigEl.getBoundingClientRect(); dg = { x: e.clientX, y: e.clientY, l: r.left, t: r.top }; h2.setPointerCapture(e.pointerId); });
    h2.addEventListener('pointermove', (e) => { if (!dg) return; const z = parseFloat(getComputedStyle(bigEl).zoom || '1') || 1; bigEl.style.right = 'auto';
      bigEl.style.left = Math.max(-200, Math.min(innerWidth - 120, dg.l + e.clientX - dg.x)) / z + 'px'; bigEl.style.top = Math.max(0, Math.min(innerHeight - 50, dg.t + e.clientY - dg.y)) / z + 'px'; });
    const up = () => { dg = null; }; h2.addEventListener('pointerup', up); h2.addEventListener('pointercancel', up); }
  pn.querySelector('h2')?.addEventListener('dblclick', (e) => { if ((e.target as HTMLElement).closest('button')) return; (pn.querySelector('[data-max]') as HTMLElement).click(); }); // 2 cliques no título: maximiza / restaura
  /* se a janela salva ficou maior que a tela (ou fora dela), volta para dentro ao abrir */
  bigEl.addEventListener('karmika:open', () => { pn.style.translate = ''; if (!maxed) { size.w = Math.min(size.w, innerWidth - 8); size.h = Math.min(size.h, innerHeight - chrome() - 12); apply(); }
    const r = bigEl.getBoundingClientRect(); if (r.top < 0 || r.left < 0 || r.top > innerHeight - 60 || r.left > innerWidth - 120) { bigEl.style.left = '4px'; bigEl.style.top = '4px'; bigEl.style.right = 'auto'; } });
}
/* mapa-mundo: janela no padrão, arrastar para mover, roda para zoom, ícones por categoria, relíquia conhecida = viagem */
const mapV = { cx: 420, cy: 420, z: 6.4, layers: { town: true, poi: true, serv: true, relic: true, vista: true, npc: false } as Record<string, boolean> };
let mapHits: MapHit[] = [], mapDrag: { x: number; y: number; cx: number; cy: number; moved: boolean } | null = null;
const mview = bigEl.querySelector('.mview') as HTMLElement, mtip = bigEl.querySelector('.mtip') as HTMLElement;
const mapPx = (e: MouseEvent) => { const r = bmEl.getBoundingClientRect(); return { x: (e.clientX - r.left) * bmEl.width / r.width, y: (e.clientY - r.top) * bmEl.height / r.height }; };
const pxPerTile = () => (bmEl.height / MAP_W) * mapV.z;
/** zoom mínimo: o mapa sempre cobre a largura da moldura (nada de faixa vazia dos lados) */
const mapZMin = () => Math.max(1, bmEl.width / bmEl.height);
mview.addEventListener('wheel', (e) => { e.preventDefault(); e.stopPropagation(); const m = mapPx(e), k = pxPerTile(), wx = mapV.cx + (m.x - bmEl.width / 2) / k, wy = mapV.cy + (m.y - bmEl.height / 2) / k; mapV.z = THREE.MathUtils.clamp(mapV.z * Math.exp(-e.deltaY * 0.0015), mapZMin(), 14); const k2 = pxPerTile(); mapV.cx = wx - (m.x - bmEl.width / 2) / k2; mapV.cy = wy - (m.y - bmEl.height / 2) / k2; K.drawBig(); }, { passive: false });
mview.addEventListener('pointerdown', (e) => { if ((e.target as HTMLElement).closest('button, .mzoom')) return; /* botões de zoom não são clique no mapa */ mapDrag = { x: e.clientX, y: e.clientY, cx: mapV.cx, cy: mapV.cy, moved: false }; mview.setPointerCapture(e.pointerId); mview.classList.add('drag'); });
mview.addEventListener('pointermove', (e) => {
  if (mapDrag && e.buttons === 0) { mapDrag = null; mview.classList.remove('drag'); } // soltou o botão fora do mapa: o arrasto acaba (antes o mapa ficava "grudado" no mouse)
  if (mapDrag) { const r = bmEl.getBoundingClientRect(), sc = bmEl.width / r.width / pxPerTile(); const dx = e.clientX - mapDrag.x, dy = e.clientY - mapDrag.y; if (Math.hypot(dx, dy) > 4) mapDrag.moved = true; mapV.cx = mapDrag.cx - dx * sc; mapV.cy = mapDrag.cy - dy * sc; K.drawBig(); return; }
  const m = mapPx(e); const h = mapHits.find((q) => Math.hypot(q.x - m.x, q.y - m.y) < q.r);
  if (h) { const r = bmEl.getBoundingClientRect(); mtip.innerHTML = `${h.name}<small>${h.sub}</small>`; mtip.style.display = 'block'; mtip.style.left = (e.clientX - r.left + 14) + 'px'; mtip.style.top = (e.clientY - r.top + 10) + 'px'; mview.style.cursor = h.go ? 'pointer' : ''; } else { mtip.style.display = 'none'; mview.style.cursor = ''; }
});
let lastMapClick = -1e9;
for (const ev of ['pointercancel', 'lostpointercapture'] as const) mview.addEventListener(ev, () => { mapDrag = null; mview.classList.remove('drag'); });
mview.addEventListener('pointerup', (e) => { const d = mapDrag; mapDrag = null; mview.classList.remove('drag'); const prevClick = lastMapClick; if (d && !d.moved) lastMapClick = performance.now(); if (d && !d.moved) { const m = mapPx(e); const h = mapHits.find((q) => q.go && Math.hypot(q.x - m.x, q.y - m.y) < q.r); if (h?.go) { mapTravel(h.go); } else if (K.game.st.god && !K.inside && performance.now() - prevClick < 380) { /* modo deus: DOIS cliques num ponto do mapa e vá até lá (um clique só não teleporta mais) */ const k = pxPerTile(), W = bmEl.width, H = bmEl.height; let tx = mapV.cx + (m.x - W / 2) / k, ty = mapV.cy + (m.y - H / 2) / k; { /* nunca cai na água: procura o chão firme mais perto */ let best: [number, number] | null = null; for (let r = 0; r < 40 && !best; r++) for (let a = 0; a < Math.max(1, r * 8) && !best; a++) { const x = Math.floor(tx + Math.cos(a / Math.max(1, r * 8) * 6.283) * r), y = Math.floor(ty + Math.sin(a / Math.max(1, r * 8) * 6.283) * r), t2 = K.city.map[y]?.[x]; if (t2 && isWalkable(t2) && groundH((x + 0.5) * T, (y + 0.5) * T) > WL) best = [x + 0.5, y + 0.5]; } if (best) { tx = best[0]; ty = best[1]; } } toggleBigMap(); K.withFade(() => { K.state.fx = tx; K.state.fy = ty; K.state.path = []; K.objs.update(tx * T, ty * T, true); K.heroY = heightAt(tx * T, ty * T); K.camX = tx * T; K.camZ = ty * T; K.camY = K.heroY; K.game.logMsg(`⚡ Modo deus: você salta para ${Math.round(tx)}, ${Math.round(ty)}.`, '#ffd24a'); }); } } });
bigEl.addEventListener('click', (e) => { const t = e.target as HTMLElement; if (t.closest('[data-x]')) toggleBigMap();
  if (t.closest('[data-side]')) { sideOpen = !sideOpen; try { localStorage.setItem('karmika.mapside', sideOpen ? '1' : '0'); } catch { /* */ } drawSide(); return; }
  { const tr = (t.closest('[data-trav]') as HTMLElement | null)?.dataset.trav; if (tr) { e.stopPropagation(); mapTravel(tr); return; } }
  { const see = t.closest('[data-see]') as HTMLElement | null; if (see) { const [x, y] = see.dataset.see!.split(',').map(Number); mapV.cx = x; mapV.cy = y; mapV.z = Math.max(mapV.z, 6.4); K.guiaSys.pinT = { x, y, label: see.dataset.nm! }; K.updateBanner(); K.drawBig(); bigEl.querySelectorAll('.mside button.sel').forEach((b) => b.classList.remove('sel')); see.classList.add('sel'); return; } } const z = (t.closest('[data-z]') as HTMLElement | null)?.dataset.z; if (z !== undefined) { if (z === '0') { const h0 = K.hereT(); mapV.cx = h0.x; mapV.cy = h0.y; } else mapV.z = THREE.MathUtils.clamp(mapV.z * (z === '1' ? 1.4 : 1 / 1.4), mapZMin(), 14); K.drawBig(); } });
bigEl.addEventListener('change', (e) => { const t = e.target as HTMLInputElement; if (t.dataset.l) { mapV.layers[t.dataset.l] = t.checked; K.drawBig(); } });
/* 26/10 (Erling: "de que adianta dar zoom se o minimapa não mostra as coisas da cidade: pontos de interesse, missões para entregar,
   lugares de cortar madeira…"): com zoom, o minimapa ganha os ícones do mapa grande — ofícios, lojas, correio, cofre, quadro, missões
   nos NPCs, masmorras, ervas e pedras, baús e o alvo da missão */
function miniIcons(ctx: CanvasRenderingContext2D, X: (x: number) => number, Y: (y: number) => number, S: number, D: number) {
  const h0 = K.hereT(), R = D / 2 / S + 2; const near = (x: number, y: number) => Math.abs(x - h0.x) < R && Math.abs(y - h0.y) < R;
  const sz = Math.max(5, Math.min(9, 3.2 * S));
  const ic = (g: string, x0: number, y0: number, ring: string, big = 1) => { if (!near(x0, y0)) return; const x = X(x0), y = Y(y0), r = sz * big; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fillStyle = 'rgba(16,12,6,.85)'; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = ring; ctx.stroke(); ctx.font = `${r * 1.25}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.fillText(g, x, y + 0.5); };
  const SICON: Record<string, string> = { armeiro: '⚔', armaduras: '🛡', mercador: '⚖', mercador_cidade: '⚖', pocoes: '⚗', cervejaria: '🍺', churrasco: '🍖', charcutaria: '🥓', cozinha: '🍲', padaria: '🍞', peixaria: '🐟', ervas: '🌿', joalheiro: '💎', alfaiate: '🧵', ferreiro: '⚒', estalagem: '🛏', estabulo: '🐴', shop: '🛍' };
  for (const p of K.city.props) {
    if (!near(p.gx, p.gy)) continue;
    if (p.kind === 'station') { const si = STATION_INFO[p.variant ?? 0]; if (si) ic(si.icon, p.gx + p.w / 2, p.gy + p.h / 2, '#e0c070'); }
    else if (p.kind === 'mailbox') ic('📮', p.gx + 0.5, p.gy + 0.5, '#a0d8a0');
    else if (p.kind === 'vault') ic('🏦', p.gx + p.w / 2, p.gy + p.h / 2, '#a0d8a0');
    else if (p.kind === 'noticeboard') ic('📋', p.gx + 0.5, p.gy + 0.5, '#a0d8a0');
    else if (p.kind === 'library') ic('📚', p.gx + p.w / 2, p.gy + p.h / 2, '#a0d8a0');
    else if (p.kind === 'herb' && !(p as { gone?: boolean }).gone) ic('🌿', p.gx + 0.5, p.gy + 0.5, '#7ad07a', 0.75);
    else if (p.kind === 'rock' && (p.variant ?? 0) >= 2 && !(p as { gone?: boolean }).gone) ic('⛏', p.gx + 0.5, p.gy + 0.5, '#c0b0a0', 0.75);
    else if (p.kind === 'chest' && !(p as { gone?: boolean }).gone) ic('📦', p.gx + 0.5, p.gy + 0.5, '#ffd24a', 0.8);
  }
  for (const n of K.npcSys.npcs) { if (!n.hero.root.visible) continue; const x0 = n.pos.x / T, y0 = n.pos.z / T; if (!near(x0, y0)) continue;
    const key = K.SHOP_BY_NAME.get(n.def.name); const qm = n.el.dataset.qm;
    if (qm) { const done = qm.startsWith('done'), meet = qm === 'meet'; const x = X(x0), y = Y(y0); ctx.font = `bold ${sz * 2.2}px Georgia, serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 3; ctx.strokeStyle = '#000'; ctx.strokeText(meet ? '👤' : done ? '!' : '?', x, y - sz); ctx.fillStyle = qm.endsWith('story') ? '#ffe08a' : qm.endsWith('board') ? '#c0c8d0' : '#9ad0ff'; ctx.fillText(meet ? '👤' : done ? '!' : '?', x, y - sz); }
    else if (key) ic(SICON[key] ?? '🪙', x0, y0, '#e0c070', 0.85);
  }
  try { for (const en of K.dgs.entrances) ic('🕳', en.x, en.y, '#c080ff'); } catch { /* ainda sem masmorras */ }
  for (const st of K.city.settlements) if (st.radius >= 10) { const x0 = st.x, y0 = st.y; if (near(x0, y0)) { const x = X(x0), y = Y(y0); ctx.font = `bold ${Math.max(9, sz * 1.5)}px Cinzel, Georgia, serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.lineWidth = 3; ctx.strokeStyle = '#000'; ctx.strokeText(st.name, x, y - sz * 2.2); ctx.fillStyle = '#ffe08a'; ctx.fillText(st.name, x, y - sz * 2.2); } }
}
function markers(ctx: CanvasRenderingContext2D, X: (x: number) => number, Y: (y: number) => number, sc: number, lab: boolean) {
  for (const p of K.city.pois) { const x = X(p.x), y = Y(p.y); ctx.fillStyle = '#ffe08a'; ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y - 4 * sc); ctx.lineTo(x + 3 * sc, y); ctx.lineTo(x, y + 4 * sc); ctx.lineTo(x - 3 * sc, y); ctx.closePath(); ctx.fill(); ctx.stroke(); if (lab) { ctx.font = '600 11px Georgia'; ctx.fillStyle = '#fff3c8'; ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.strokeText(p.name, x + 7, y + 4); ctx.fillText(p.name, x + 7, y + 4); } }
  for (const em of K.eventos.mapMarks(K.hereT())) { const x = X(em.x), y = Y(em.y), pr = 0.5 + 0.5 * Math.sin(performance.now() / 260); ctx.strokeStyle = em.color; ctx.globalAlpha = 0.35 + pr * 0.35; ctx.lineWidth = 1.5 * sc; ctx.beginPath(); ctx.arc(x, y, Math.max(6 * sc, Math.abs(X(em.x + em.r) - x)), 0, 6.283); ctx.stroke(); ctx.globalAlpha = 1; ctx.fillStyle = 'rgba(16,12,6,.9)'; ctx.beginPath(); ctx.arc(x, y, 5.5 * sc, 0, 6.283); ctx.fill(); ctx.strokeStyle = em.color; ctx.lineWidth = (em.mine ? 2 : 1.2) * sc; ctx.stroke(); ctx.font = `${7 * sc}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.fillText(em.icon, x, y + 0.5); }
  for (const e of K.game.enemies.list) if (e.alive && e.active) { ctx.fillStyle = (e as typeof e & { ally?: boolean }).ally ? '#7aff9a' : (e as typeof e & { tag?: string }).tag?.startsWith('ev:') && e.def.aggro < 0.5 ? '#e0c890' : e.type === 'prince' ? '#c08aff' : e.def.passive ? '#e0d08a' : '#ff4a3a'; ctx.beginPath(); ctx.arc(X(e.pos.x / T), Y(e.pos.z / T), (e.type === 'prince' ? 3.4 : 1.8) * sc, 0, 6.283); ctx.fill(); }
  /* 04/11 (Erling: "liguei o olho do instinto mas nada aparece no mapa"): o que o Instinto revelou pisca no minimapa — esconderijos (✦) e o fim dos rastros das missões */
  for (const m of INSTINCT_MARKS) { const x = X(m.x), y = Y(m.y), pr = 0.5 + 0.5 * Math.sin(performance.now() / 220); ctx.save(); ctx.globalAlpha = 0.55 + 0.45 * pr; ctx.fillStyle = m.col; ctx.strokeStyle = '#1a1208'; ctx.lineWidth = 1.2; ctx.font = `bold ${Math.round(11 * sc)}px Georgia, serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.strokeText('✦', x, y); ctx.fillText('✦', x, y); ctx.globalAlpha = 0.35 * pr; ctx.beginPath(); ctx.arc(x, y, (5 + 4 * pr) * sc, 0, 6.283); ctx.strokeStyle = m.col; ctx.stroke(); ctx.restore(); }
  for (const n of K.npcSys.npcs) { ctx.fillStyle = '#7ad0ff'; ctx.beginPath(); ctx.arc(X(n.pos.x / T), Y(n.pos.z / T), 2 * sc, 0, 6.283); ctx.fill(); }
  for (const v of K.CINE.vistas) { const seen = K.vistaSeen.has(v.id); ctx.fillStyle = seen ? '#ffe08a' : '#a08a50'; ctx.strokeStyle = '#1a1208'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(X(v.at.x), Y(v.at.y), 3.6 * sc, 2.2 * sc, 0, 0, 6.283); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#1a1208'; ctx.beginPath(); ctx.arc(X(v.at.x), Y(v.at.y), 1.1 * sc, 0, 6.283); ctx.fill(); }
  for (const rl of K.city.relics) if (K.knowsRelic(rl.name)) { ctx.fillStyle = '#8ad0ff'; ctx.beginPath(); ctx.moveTo(X(rl.x), Y(rl.y) - 4 * sc); ctx.lineTo(X(rl.x) + 3 * sc, Y(rl.y)); ctx.lineTo(X(rl.x), Y(rl.y) + 4 * sc); ctx.lineTo(X(rl.x) - 3 * sc, Y(rl.y)); ctx.closePath(); ctx.fill(); }
  if (K.guiaSys.guideT) { const x = X(K.guiaSys.guideT.x), y = Y(K.guiaSys.guideT.y), pr = 4 * sc + 2 * sc * Math.abs(Math.sin(performance.now() / 300)); ctx.strokeStyle = K.guiaSys.guideCol; ctx.lineWidth = 1.6 * sc; ctx.beginPath(); ctx.arc(x, y, pr, 0, 6.283); ctx.stroke(); ctx.fillStyle = K.guiaSys.guideCol; ctx.beginPath(); ctx.arc(x, y, 1.6 * sc, 0, 6.283); ctx.fill(); if (lab) { ctx.font = '600 11px Cinzel, serif'; ctx.fillStyle = K.guiaSys.guideCol; ctx.fillText(K.guiaSys.guideT.label, x + 8, y - 8); } }
}
/** distâncias em metros do jogo (1 quadrado = 2 m; heroína 1,7 m) */
const fmtDist = (m: number) => `${Math.round(m)} m`;
  return { mmBase, toggleBigMap, mapV, get bigOpen() { return bigOpen; }, fmtDist, mmEl, mg, MMS, markers, miniIcons, bmEl, bg, mapZMin, pxPerTile, bigEl, BNAME, get mapHits() { return mapHits; }, set mapHits(v: typeof mapHits) { mapHits = v; } };
}
