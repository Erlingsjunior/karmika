/* Bolsa dos Selos (Erling, 23/10): o preço justo do Selo de Marghar (Premium) e da Lágrima do Olho muda com a economia do jogo.
   preço justo = valor de base (quanto vale um dia de Premium em ouro, pelo nível da economia)
               × (procura ÷ oferta)^0,35   (limitado a 0,55× … 2,2×)
               e misturado (40%) com a média dos últimos negócios fechados.
   - oferta: quantos selos estão à venda agora no Leilão;
   - procura: quantos foram comprados nas últimas 24 h (mais uma procura de fundo);
   - economia: o nível médio de quem joga (mais nível, mais ouro circulando, selo mais caro em ouro).
   Hoje o leilão ainda é simulado neste PC; quando o servidor do leilão existir, a mesma conta roda lá com os dados de todos. */
export const TOKENS: Record<string, { days: number; name: string; floor?: number }> = {
  seal_p30: { days: 30, name: 'Selo de Marghar · 30 dias' },
  seal_p90: { days: 90 * 0.9, name: 'Selo de Marghar · 90 dias' },
  seal_p365: { days: 365 * 0.82, name: 'Selo de Marghar · 1 ano' },
  lagrima: { days: 60, name: 'Lágrima do Olho', floor: 6000 }, /* 26/10: vale 2 selos de 30 dias (troca por 60 dias de Premium) */
};
const KEY = 'karmika.market.v1', DAY = 864e5;
type Pt = { t: number; p: number };
interface State { trades: Record<string, Pt[]>; hist: Record<string, Pt[]> }

export function createMarket(o: { econLvl(): number; supply(id: string): number }) {
  let s: State = { trades: {}, hist: {} };
  try { const v = JSON.parse(localStorage.getItem(KEY) || 'null'); if (v) s = { trades: v.trades ?? {}, hist: v.hist ?? {} }; } catch { /* */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* */ } };
  /** um dia de Premium em ouro, pelo nível da economia */
  const dayGold = () => 80 + 18 * Math.max(1, o.econLvl());
  const demand = (id: string) => 3 + (s.trades[id] ?? []).filter((x) => Date.now() - x.t < DAY).length; // 3 = procura de fundo
  function fair(id: string) {
    const T = TOKENS[id]; if (!T) return 0;
    const base = dayGold() * T.days, S = o.supply(id), D = demand(id);
    let p = base * Math.min(2.2, Math.max(0.55, Math.pow((D + 1) / (S + 1), 0.35)));
    const tr = (s.trades[id] ?? []).filter((x) => Date.now() - x.t < 3 * DAY);
    if (tr.length) { const avg = tr.reduce((a, x) => a + x.p, 0) / tr.length; p = p * 0.6 + avg * 0.4; }
    return Math.max(T.floor ?? 1, Math.round(p / 10) * 10);
  }
  function recordSale(id: string, price: number) { if (!TOKENS[id]) return; (s.trades[id] ??= []).push({ t: Date.now(), p: price }); s.trades[id] = s.trades[id].filter((x) => Date.now() - x.t < 7 * DAY).slice(-80); save(); }
  /** guarda um ponto do gráfico a cada 10 min (as últimas ~8 h) */
  function sample() { const now = Date.now(); for (const id of Object.keys(TOKENS)) { const h = (s.hist[id] ??= []); if (h.length && now - h[h.length - 1].t < 10 * 60e3) continue; h.push({ t: now, p: fair(id) }); s.hist[id] = h.slice(-48); } save(); }
  function info(id: string) { const h = s.hist[id] ?? [], f = fair(id), prev = h.length > 1 ? h[h.length - 2].p : f, last = (s.trades[id] ?? []).slice(-1)[0];
    return { fair: f, supply: o.supply(id), demand: demand(id), last: last?.p ?? null, trend: f > prev * 1.01 ? 1 : f < prev * 0.99 ? -1 : 0, hist: [...h.map((x) => x.p), f] }; }
  /** o gráfico pequeno (svg) da variação do preço justo */
  function spark(id: string, w = 160, h = 34) { const pts = info(id).hist.slice(-24); if (pts.length < 2) pts.unshift(pts[0]); const lo = Math.min(...pts), hi = Math.max(...pts), k = hi - lo || 1;
    const d = pts.map((p, i) => `${i ? 'L' : 'M'}${(i / (pts.length - 1)) * w},${h - 3 - ((p - lo) / k) * (h - 6)}`).join(' ');
    return `<svg class="mk-spark" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><path d="${d}" fill="none" stroke="#ffd27a" stroke-width="1.6"/></svg>`; }
  return { fair, info, recordSale, sample, spark, isToken: (id: string) => !!TOKENS[id] };
}
export type Market = ReturnType<typeof createMarket>;
