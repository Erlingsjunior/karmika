import * as THREE from 'three';
import { plainGear, FAC_ICON, type Gear, type StatKey } from './loot';

/* As duas facções do Labirinto (ver docs: faccoes.md). Nenhuma é a vilã: as duas têm razão de um jeito e erram de outro.
   Aqui moram o desenho dos brasões (canvas, para texturas e ícones), as peças com o brasão e a aura de cada lado. */
export type Fac = 'fio' | 'desf';
export const FAC: Record<Fac, { name: string; short: string; motto: string; c1: string; c2: string; glow: number; hex: number }> = {
  fio: { name: 'A Ordem do Fio', short: 'Ordem do Fio', motto: 'Ninguém atravessa só', c1: '#d9b45a', c2: '#1d3566', glow: 0xffd88a, hex: 0x6a9aff },
  desf: { name: 'Os Desfiados', short: 'Desfiados', motto: 'Todo muro é uma mentira', c1: '#b8202a', c2: '#120d10', glow: 0xff3a2a, hex: 0xb8202a },
};
/** a facção de uma peça pelo nome da base */
export const facOf = (base?: string | null): Fac | null => !base ? null : /Ordem do Fio|Primeiro Fio|do Fio\b/.test(base) ? 'fio' : /Desfiad|Última Porta/.test(base) ? 'desf' : null;

/* ---------- brasão em canvas ---------- */
/** contorno heráldico (ponta embaixo) dentro de uma caixa w×h com topo em y0 */
function heater(g: CanvasRenderingContext2D, cx: number, y0: number, w: number, h: number) {
  g.beginPath(); g.moveTo(cx - w / 2, y0); g.quadraticCurveTo(cx, y0 + h * 0.05, cx + w / 2, y0); g.lineTo(cx + w / 2, y0 + h * 0.42);
  g.quadraticCurveTo(cx + w * 0.48, y0 + h * 0.8, cx, y0 + h); g.quadraticCurveTo(cx - w * 0.48, y0 + h * 0.8, cx - w / 2, y0 + h * 0.42); g.closePath();
}
/** labirinto circular: anéis com portas desencontradas; broken = anéis partidos e deslocados (os Desfiados) */
function labyrinth(g: CanvasRenderingContext2D, cx: number, cy: number, R: number, col: string, broken: boolean) {
  g.strokeStyle = col; g.lineCap = 'round';
  for (let i = 0; i < 4; i++) {
    const r = R * (1 - i * 0.22), gap = 0.42 - i * 0.04, door = i % 2 ? Math.PI * 1.5 : Math.PI * 0.5; g.lineWidth = Math.max(2, R * 0.075);
    if (!broken) { g.beginPath(); g.arc(cx, cy, r, door + gap / 2, door + Math.PI * 2 - gap / 2); g.stroke(); continue; }
    // partido: pedaços de arco, cada um empurrado para fora e torto
    const n = 5 - (i >> 1); for (let k = 0; k < n; k++) { const a0 = door + gap / 2 + k * (Math.PI * 2 - gap) / n, a1 = a0 + (Math.PI * 2 - gap) / n - 0.22, am = (a0 + a1) / 2, push = R * (0.04 + ((k * 7 + i * 3) % 5) * 0.018);
      g.save(); g.translate(cx + Math.cos(am) * push, cy + Math.sin(am) * push); g.rotate(((k * 5 + i) % 3 - 1) * 0.07); g.beginPath(); g.arc(0, 0, r, a0, a1); g.stroke(); g.restore(); }
  }
  // paredes radiais entre os anéis
  g.lineWidth = Math.max(1.5, R * 0.06); for (let i = 0; i < 3; i++) { const a = i * 2.1 + 0.6, r0 = R * (1 - i * 0.22), r1 = R * (1 - (i + 1) * 0.22); if (broken && i === 1) continue; g.beginPath(); g.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); g.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); g.stroke(); }
}
function eye(g: CanvasRenderingContext2D, cx: number, cy: number, s: number, gold: string, iris: string) {
  g.fillStyle = gold; g.beginPath(); g.moveTo(cx - s, cy); g.quadraticCurveTo(cx, cy - s * 0.75, cx + s, cy); g.quadraticCurveTo(cx, cy + s * 0.75, cx - s, cy); g.fill();
  g.fillStyle = iris; g.beginPath(); g.arc(cx, cy, s * 0.32, 0, 7); g.fill(); g.fillStyle = gold; g.beginPath(); g.arc(cx - s * 0.1, cy - s * 0.1, s * 0.08, 0, 7); g.fill();
}
/** a boca da Fome: um poço escuro com dentes virados para dentro */
function maw(g: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  const grd = g.createRadialGradient(cx, cy, 0, cx, cy, r); grd.addColorStop(0, '#000'); grd.addColorStop(0.7, '#2a0508'); grd.addColorStop(1, '#6a0a12'); g.fillStyle = grd; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill();
  g.fillStyle = '#e8dcc8'; const n = 14; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, a2 = a + Math.PI / n, L = r * (i % 2 ? 0.42 : 0.6); g.beginPath(); g.moveTo(cx + Math.cos(a - 0.17) * r, cy + Math.sin(a - 0.17) * r); g.lineTo(cx + Math.cos(a + 0.17) * r, cy + Math.sin(a + 0.17) * r); g.lineTo(cx + Math.cos(a2 - Math.PI / n) * (r - L), cy + Math.sin(a2 - Math.PI / n) * (r - L)); g.fill(); }
  g.strokeStyle = '#b8202a'; g.lineWidth = Math.max(1.5, r * 0.08); g.beginPath(); g.arc(cx, cy, r, 0, 7); g.stroke();
}
/** desenha o brasão inteiro numa caixa (cx, y0, w, h). mode 'shield' = só o campo (para pintar um escudo de verdade) */
export function drawCrest(g: CanvasRenderingContext2D, f: Fac, cx: number, y0: number, w: number, h: number, mode: 'full' | 'shield' = 'full') {
  const cy = y0 + h * 0.43, R = w * 0.3;
  if (mode === 'full' && f === 'desf') { // as duas lâminas cruzadas atrás do escudo
    g.save(); g.lineCap = 'round'; for (const s of [-1, 1]) { g.strokeStyle = '#8a8e96'; g.lineWidth = w * 0.045; g.beginPath(); g.moveTo(cx - s * w * 0.62, y0 - h * 0.04); g.lineTo(cx + s * w * 0.5, y0 + h * 0.95); g.stroke(); g.strokeStyle = '#3a2418'; g.lineWidth = w * 0.06; g.beginPath(); g.moveTo(cx + s * w * 0.42, y0 + h * 0.84); g.lineTo(cx + s * w * 0.55, y0 + h * 1.02); g.stroke(); } g.restore();
  }
  g.save(); heater(g, cx, y0, w, h);
  const fld = g.createLinearGradient(0, y0, 0, y0 + h); if (f === 'fio') { fld.addColorStop(0, '#26457e'); fld.addColorStop(1, '#0f1d3a'); } else { fld.addColorStop(0, '#221a20'); fld.addColorStop(1, '#0a0709'); }
  g.fillStyle = fld; g.fill(); g.clip();
  if (f === 'fio') {
    labyrinth(g, cx, cy, R, '#cfd8ea', false);
    // o fio de ouro: entra pela ponta do escudo, atravessa as portas e chega ao Olho
    g.strokeStyle = '#f0c860'; g.lineWidth = Math.max(2, w * 0.022); g.lineCap = 'round'; g.lineJoin = 'round'; g.shadowColor = '#ffd88a'; g.shadowBlur = w * 0.04;
    g.beginPath(); g.moveTo(cx, y0 + h * 0.95); g.lineTo(cx, cy + R * 1.12); g.arc(cx, cy, R * 0.89, Math.PI * 0.5, Math.PI * 1.2); g.lineTo(cx + Math.cos(Math.PI * 1.2) * R * 0.67, cy + Math.sin(Math.PI * 1.2) * R * 0.67);
    g.arc(cx, cy, R * 0.67, Math.PI * 1.2, Math.PI * 1.5, false); g.lineTo(cx, cy - R * 0.45); g.arc(cx, cy, R * 0.45, Math.PI * 1.5, Math.PI * 2.4, false); g.lineTo(cx + Math.cos(Math.PI * 2.4) * R * 0.2, cy + Math.sin(Math.PI * 2.4) * R * 0.2); g.stroke(); g.shadowBlur = 0;
    eye(g, cx, cy, R * 0.26, '#f0c860', '#0f1d3a');
    // estrelinhas no campo
    g.fillStyle = '#d9b45a'; for (const [sx, sy] of [[-0.36, 0.1], [0.36, 0.1], [-0.3, 0.72], [0.3, 0.72]]) { const px = cx + sx * w, py = y0 + sy * h; g.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr = i % 2 ? w * 0.008 : w * 0.024; g.lineTo(px + Math.cos(a) * rr, py + Math.sin(a) * rr); } g.fill(); }
  } else {
    // rachaduras no campo negro
    g.strokeStyle = '#4a1a1e'; g.lineWidth = Math.max(1, w * 0.008); for (const [a, b, c2, d] of [[-0.45, 0.12, -0.12, 0.3], [0.48, 0.2, 0.2, 0.45], [-0.3, 0.88, -0.05, 0.66], [0.32, 0.9, 0.1, 0.7]]) { g.beginPath(); g.moveTo(cx + a * w, y0 + b * h); g.lineTo(cx + (a + c2) / 2 * w + w * 0.04, y0 + (b + d) / 2 * h); g.lineTo(cx + c2 * w, y0 + d * h); g.stroke(); }
    labyrinth(g, cx, cy, R, '#9a8a90', true);
    maw(g, cx, cy, R * 0.42);
    // o fio cortado: duas pontas vermelhas que não se tocam, desfiadas
    g.lineCap = 'round'; g.lineWidth = Math.max(2, w * 0.022);
    const end = (x0: number, yA: number, x1: number, yB: number) => { g.strokeStyle = '#d02a34'; g.beginPath(); g.moveTo(x0, yA); g.quadraticCurveTo((x0 + x1) / 2 + w * 0.05, (yA + yB) / 2, x1, yB); g.stroke(); g.lineWidth = Math.max(1, w * 0.007); for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(x1, yB); g.lineTo(x1 + i * w * 0.012, yB + (yB > yA ? 1 : -1) * w * 0.035); g.stroke(); } g.lineWidth = Math.max(2, w * 0.022); };
    end(cx, y0 + h * 0.97, cx - w * 0.04, cy + R * 0.98); end(cx + w * 0.2, y0 + h * 0.05, cx + w * 0.06, cy - R * 0.95);
  }
  g.restore();
  // borda
  heater(g, cx, y0, w, h); g.lineWidth = Math.max(2, w * 0.035); g.strokeStyle = f === 'fio' ? '#d9b45a' : '#a3151f'; g.stroke();
  g.lineWidth = Math.max(1, w * 0.01); g.strokeStyle = f === 'fio' ? '#f6e2a8' : '#3a0a0e'; heater(g, cx, y0 + w * 0.03, w * 0.92, h * 0.94); g.stroke();
}
const texCache = new Map<string, THREE.CanvasTexture>();
/** textura do brasão (fundo transparente). shield: preenche a caixa inteira, para o rosto de um escudo */
export function crestTexture(f: Fac, mode: 'full' | 'shield' = 'full') {
  const key = f + mode; const hit = texCache.get(key); if (hit) return hit;
  const c = document.createElement('canvas'); c.width = 256; c.height = 320; const g = c.getContext('2d')!;
  if (mode === 'shield') drawCrest(g, f, 128, 0, 256, 320, 'shield'); else drawCrest(g, f, 128, 26, 180, 236, 'full');
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; texCache.set(key, t); return t;
}
/** brasão pequeno para a interface (ícones, buffs, janelas) */
export function crestImg(f: Fac, w = 64) { const c = document.createElement('canvas'); c.width = w; c.height = Math.round(w * 1.25); drawCrest(c.getContext('2d')!, f, w / 2, w * 0.1, w * 0.7, w * 0.92, 'full'); return c.toDataURL(); }
const imgCache = new Map<Fac, string>();
export const crestURL = (f: Fac) => { let u = imgCache.get(f); if (!u) { u = crestImg(f, 64); imgCache.set(f, u); } return u; };

/* ---------- o sigilo no chão (a aura de quem carrega a relíquia do lado) ---------- */
export function sigilTexture(f: Fac) {
  const key = 'sig' + f; const hit = texCache.get(key); if (hit) return hit;
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d')!, C = 128;
  const col = f === 'fio' ? '#f0c860' : '#e0303a', soft = f === 'fio' ? 'rgba(106,154,255,.55)' : 'rgba(90,10,18,.7)';
  const halo = g.createRadialGradient(C, C, 40, C, C, 126); halo.addColorStop(0, 'rgba(0,0,0,0)'); halo.addColorStop(0.75, soft); halo.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = halo; g.fillRect(0, 0, 256, 256);
  g.shadowColor = col; g.shadowBlur = 10; labyrinth(g, C, C, 100, col, f === 'desf');
  if (f === 'fio') { eye(g, C, C, 26, col, 'rgba(0,0,0,0)'); g.strokeStyle = col; g.lineWidth = 3; g.beginPath(); g.arc(C, C, 118, 0, 7); g.stroke(); }
  else { g.strokeStyle = col; g.lineWidth = 3; for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283; g.beginPath(); g.moveTo(C + Math.cos(a) * 14, C + Math.sin(a) * 14); g.lineTo(C + Math.cos(a + 0.18) * 30, C + Math.sin(a + 0.18) * 30); g.stroke(); } }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; texCache.set(key, t); return t;
}

/* ---------- as peças com o brasão ---------- */
interface FacDef { slot: 'cape' | 'shield' | 'relic'; base: string; stats: Partial<Record<StatKey, number>>; lore: string; aura?: number }
export const FAC_GEAR: Record<Fac, FacDef[]> = {
  fio: [
    { slot: 'cape', base: 'Manto da Ordem do Fio', stats: { def: 7, hp: 28, regen: 0.5 }, lore: 'Lã azul-noite tecida pelas guardiãs do Labirinto. A barra de ouro é um fio só, sem nó e sem ponta: quem o veste promete nunca cortá-lo.' },
    { slot: 'shield', base: 'Escudo da Ordem do Fio', stats: { def: 13, hp: 20, vit: 2 }, lore: 'O labirinto e o fio pintados sobre carvalho. Os guardiões o erguem na frente de quem ainda não sabe se defender. Ninguém atravessa só.' },
    { slot: 'relic', base: 'Carretel do Primeiro Fio', stats: { hp: 90, vit: 8, regen: 2.5, def: 8 }, lore: 'Dizem que daqui saiu o primeiro fio que levou uma alma de volta para casa. Nunca acaba, por mais que se puxe. Pesa mais a cada alma que se perde.', aura: 0xffd88a },
  ],
  desf: [
    { slot: 'cape', base: 'Manto Desfiado', stats: { def: 4, move: 5, dex: 2, crit: 2 }, lore: 'Pano negro de barra rasgada de propósito: cada fio solto é um laço que o dono escolheu cortar. Não se remenda um manto desfiado.' },
    { slot: 'shield', base: 'Escudo dos Desfiados', stats: { def: 10, str: 2, leech: 2 }, lore: 'Negro e rachado como os muros que querem derrubar. Na boca pintada no meio, os Desfiados não veem um monstro: veem uma porta.' },
    { slot: 'relic', base: 'Tesoura da Última Porta', stats: { dmg: 22, crit: 6, leech: 3 }, lore: 'Duas lâminas de ferro negro que nunca enferrujam. Cortaram o primeiro fio. Quem a carrega não mente para si mesmo: sabe exatamente para onde está indo.', aura: 0xff3a2a },
  ],
};
/* ---------- o lado do jogador ---------- */
/** as peças só existem para quem já escolheu um lado (nível 30); antes disso, nem à venda aparecem */
export const FAC_LVL = 30;
/** os atributos ficam presos ao nível 30: no começo ajudam, com o tempo viram mais beleza do que luta */
export const FAC_ILVL = 30;
/** preço na Tecelagem Real (ouro). Âncora: o Selo de Marghar vale ~30.000 (10 h de caça no nível 30) */
export const FAC_PRICE: Record<'cape' | 'shield' | 'relic', number> = { cape: 18000, shield: 24000, relic: 45000 };
const FK = 'karmika.fac.v1'; let mine: Fac | null = null; try { const v = localStorage.getItem(FK); mine = v === 'fio' || v === 'desf' ? v : null; } catch { /* */ }
const subs: ((f: Fac | null) => void)[] = [];
export const myFac = () => mine;
export function setMyFac(f: Fac | null) { mine = f; try { if (f) localStorage.setItem(FK, f); else localStorage.removeItem(FK); } catch { /* */ } for (const fn of subs) fn(f); }
export const onFac = (fn: (f: Fac | null) => void) => { subs.push(fn); };
/** gera a peça com o brasão no nível pedido (Única; a relíquia é Relíquia) */
export function facGear(f: Fac, slot: FacDef['slot'], ilvl: number): Gear {
  const d = FAC_GEAR[f].find((q) => q.slot === slot)!, stats: Partial<Record<StatKey, number>> = {}, PCTK = ['crit', 'move', 'leech', 'xp', 'gold', 'gen'], AT = ['str', 'dex', 'vit', 'int'];
  for (const [k, v] of Object.entries(d.stats) as [StatKey, number][]) stats[k] = Math.round((PCTK.includes(k) ? v : AT.includes(k) || k === 'regen' ? v * (1 + ilvl * 0.03) : v * (1 + ilvl * 0.09)) * 10) / 10;
  const g = plainGear(slot, d.base, slot === 'shield' ? '🛡' : slot === 'cape' ? '✦' : '🏺', stats, ilvl);
  g.rarity = slot === 'relic' ? 'relic' : 'unique'; g.lore = `${d.lore} — ${FAC[f].name}: “${FAC[f].motto}”.`; g.aura = d.aura; g.fac = f; g.req = FAC_LVL; g.uniq = `${f}_${slot}`; g.value = Math.round(FAC_PRICE[slot] / 5); // devolver ao mercador rende pouco: é peça de nobreza, não de revenda
  return g;
}
export const facSet = (f: Fac, ilvl: number) => (['cape', 'shield', 'relic'] as const).map((s) => facGear(f, s, ilvl));

if (typeof document !== 'undefined') { FAC_ICON.fio = crestURL('fio'); FAC_ICON.desf = crestURL('desf'); }
