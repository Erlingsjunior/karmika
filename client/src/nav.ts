/* ---------- Navegação do clique (Erling, 23/10: "trava nas coisas, fica correndo parado, anda de forma quadrada").
   Antes: A* de 4 direções nas casas inteiras do mapa, que não via bancos, barracas, troncos nem floresta, e o herói seguia o centro
   de cada casa (zigue-zague). Agora:
   1. grade de meia casa, 8 direções (sem cortar quina), testando o MESMO corpo que o movimento usa (sonda);
   2. destino impossível (clicou numa casa, num tronco, na água funda) vira o ponto livre mais perto do clique;
   3. se não há caminho, vai até o ponto alcançável mais perto do destino, em vez de não fazer nada;
   4. o caminho é "puxado como corda": só sobram as quinas que importam, e ele termina no ponto exato do clique;
   5. quem segue o caminho corta curvas que ficaram livres e, se travar (bicho, porta), recalcula — e desiste em vez de correr parado. */

export type Probe = (x: number, y: number) => boolean;
export interface NavOpts { /** custo extra por casa (água, floresta, estrada); 1 = normal */ cost?: (x: number, y: number) => number; maxNodes?: number }
const S = 0.5; // passo da grade, em casas do mapa
const OFF = 32768;
const key = (ix: number, iy: number) => (iy + OFF) * 65536 + (ix + OFF);

/** linha reta livre entre dois pontos (amostrada a cada 0,15 casa) */
export function lineFree(probe: Probe, ax: number, ay: number, bx: number, by: number) {
  const d = Math.hypot(bx - ax, by - ay), n = Math.max(1, Math.ceil(d / 0.15));
  for (let i = 1; i <= n; i++) { const k = i / n; if (!probe(ax + (bx - ax) * k, ay + (by - ay) * k)) return false; }
  return true;
}

/** ponto livre mais perto de (x, y), procurando em anéis até r casas; null se não houver */
export function nearestFree(probe: Probe, x: number, y: number, r = 4): { x: number; y: number } | null {
  if (probe(x, y)) return { x, y };
  for (let ring = 1; ring <= Math.ceil(r / S); ring++) {
    let best: { x: number; y: number } | null = null, bd = Infinity;
    for (let j = -ring; j <= ring; j++) for (let i = -ring; i <= ring; i++) { if (Math.max(Math.abs(i), Math.abs(j)) !== ring) continue;
      const px = x + i * S, py = y + j * S; if (!probe(px, py)) continue; const d = Math.hypot(i, j); if (d < bd) { bd = d; best = { x: px, y: py }; } }
    if (best) return best;
  }
  return null;
}

/** caminho de (fx, fy) até (tx, ty) em casas do mapa (coordenadas contínuas). Devolve os pontos a seguir, sem a origem. */
export function navPath(probe: Probe, fx: number, fy: number, tx: number, ty: number, o: NavOpts = {}): { x: number; y: number }[] {
  const goal = nearestFree(probe, tx, ty) ?? { x: tx, y: ty };
  if (!probe(fx, fy)) { // o herói está encostado/espremido num objeto: sai primeiro para o ponto livre mais perto
    const s0 = nearestFree(probe, fx, fy, 2); if (!s0) return [goal]; const rest = navPath(probe, s0.x, s0.y, tx, ty, o); return [s0, ...rest]; }
  if (lineFree(probe, fx, fy, goal.x, goal.y)) return [goal]; // reto: nem precisa de busca
  const sx = Math.floor(fx / S), sy = Math.floor(fy / S), gx = Math.floor(goal.x / S), gy = Math.floor(goal.y / S);
  const cx = (i: number) => (i + 0.5) * S;
  const open: { k: number; f: number }[] = [];
  const push = (n: { k: number; f: number }) => { open.push(n); let i = open.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (open[p].f <= open[i].f) break; [open[p], open[i]] = [open[i], open[p]]; i = p; } };
  const pop = () => { const top = open[0], last = open.pop()!; if (open.length) { open[0] = last; let i = 0; for (;;) { const l = i * 2 + 1, r = l + 1; let m = i; if (l < open.length && open[l].f < open[m].f) m = l; if (r < open.length && open[r].f < open[m].f) m = r; if (m === i) break; [open[m], open[i]] = [open[i], open[m]]; i = m; } } return top; };
  const passC = new Map<number, boolean>(); const pass = (ix: number, iy: number) => { const k = key(ix, iy); let v = passC.get(k); if (v === undefined) { v = probe(cx(ix), cx(iy)); passC.set(k, v); } return v; };
  const h = (ix: number, iy: number) => { const dx = Math.abs(ix - gx), dy = Math.abs(iy - gy); return (Math.max(dx, dy) + 0.4142 * Math.min(dx, dy)) * S; };
  const g = new Map<number, number>(), came = new Map<number, number>(), sk = key(sx, sy), gk = key(gx, gy);
  g.set(sk, 0); push({ k: sk, f: h(sx, sy) });
  let bestK = sk, bestH = h(sx, sy), n = 0; const maxN = o.maxNodes ?? 40000;
  const DIRS: [number, number, number][] = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.4142], [1, -1, 1.4142], [-1, 1, 1.4142], [-1, -1, 1.4142]];
  let found = false;
  while (open.length && n++ < maxN) {
    const c = pop(); if (c.k === gk) { found = true; break; }
    const ix = (c.k % 65536) - OFF, iy = Math.floor(c.k / 65536) - OFF, cg = g.get(c.k)!;
    if (c.f - h(ix, iy) > cg + 1e-6) continue; // entrada velha do heap
    const hh = h(ix, iy); if (hh < bestH) { bestH = hh; bestK = c.k; }
    for (const [dx, dy, w] of DIRS) { const nx = ix + dx, ny = iy + dy; if (!pass(nx, ny)) continue;
      if (dx && dy && (!pass(ix + dx, iy) || !pass(ix, iy + dy))) continue; // não corta quina
      const ng = cg + w * S * (o.cost ? o.cost(cx(nx), cx(ny)) : 1), nk = key(nx, ny);
      if (ng < (g.get(nk) ?? Infinity)) { g.set(nk, ng); came.set(nk, c.k); push({ k: nk, f: ng + h(nx, ny) }); } }
  }
  const endK = found ? gk : bestK; if (endK === sk) return [];
  const cells: { x: number; y: number }[] = []; for (let k = endK; k !== sk; k = came.get(k)!) cells.push({ x: cx((k % 65536) - OFF), y: cx(Math.floor(k / 65536) - OFF) });
  cells.reverse(); if (found) cells[cells.length - 1] = goal; // termina no ponto exato do clique
  // puxa a corda: de cada ponto, pula para o mais distante que ainda se vê em linha reta
  const out: { x: number; y: number }[] = []; let ax = fx, ay = fy, i = 0;
  while (i < cells.length) { let j = cells.length - 1; while (j > i && !lineFree(probe, ax, ay, cells[j].x, cells[j].y)) j--; out.push(cells[j]); ax = cells[j].x; ay = cells[j].y; i = j + 1; }
  return out;
}
