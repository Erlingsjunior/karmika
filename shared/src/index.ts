export * from './scale';
/** Código compartilhado entre cliente e (no futuro) servidor. Sem dependências de navegador. */

export const TILE_W = 64; // largura do losango na tela
export const TILE_H = 32; // altura do losango na tela

export type Tile = 'grass' | 'road' | 'water' | 'plaza' | 'wall' | 'tree';
export type Race = 'nordic' | 'technocrat' | 'dwarf' | 'human' | 'elf';

export interface Vec { x: number; y: number }

/** Grade (coluna, linha) -> posição em tela isométrica (origem no tile 0,0). */
export function gridToIso(gx: number, gy: number): Vec {
  return { x: (gx - gy) * (TILE_W / 2), y: (gx + gy) * (TILE_H / 2) };
}

/** Posição em tela isométrica -> grade (fracionária). */
export function isoToGrid(sx: number, sy: number): Vec {
  const a = sx / (TILE_W / 2), b = sy / (TILE_H / 2);
  return { x: (a + b) / 2, y: (b - a) / 2 };
}

export const RACES: Record<Race, { label: string; speed: number; color: number }> = {
  nordic: { label: 'Nórdica', speed: 2.1, color: 0xb33a22 }, // tiles/s (1 tile = 2 m)
  technocrat: { label: 'Technocrata', speed: 2.0, color: 0x4de3ff },
  dwarf: { label: 'Anão', speed: 1.7, color: 0xc8a050 },
  human: { label: 'Humano', speed: 2.1, color: 0xe2b98a },
  elf: { label: 'Elfo', speed: 2.4, color: 0xb9e0a0 },
};

export function isWalkable(t: Tile): boolean {
  return t === 'grass' || t === 'road' || t === 'plaza';
}

/** Busca A* em grade de 4 direções. Devolve a lista de células do caminho (sem a origem) ou []. */
export function findPath(map: Tile[][], from: Vec, to: Vec): Vec[] {
  const H = map.length, W = map[0].length;
  const key = (x: number, y: number) => y * W + x;
  const inb = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H;
  if (!inb(to.x, to.y) || !isWalkable(map[to.y][to.x]) || !inb(from.x, from.y)) return [];
  // heap binário (mapa grande)
  const hp: { k: number; f: number }[] = [];
  const push = (n: { k: number; f: number }) => { hp.push(n); let i = hp.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (hp[p].f <= hp[i].f) break; [hp[p], hp[i]] = [hp[i], hp[p]]; i = p; } };
  const pop = () => { const top = hp[0], last = hp.pop()!; if (hp.length) { hp[0] = last; let i = 0; for (;;) { const l = i * 2 + 1, r = l + 1; let m = i; if (l < hp.length && hp[l].f < hp[m].f) m = l; if (r < hp.length && hp[r].f < hp[m].f) m = r; if (m === i) break; [hp[m], hp[i]] = [hp[i], hp[m]]; i = m; } } return top; };
  const came = new Map<number, number>();
  const gs = new Map<number, number>([[key(from.x, from.y), 0]]);
  const h = (x: number, y: number) => Math.abs(x - to.x) + Math.abs(y - to.y);
  push({ k: key(from.x, from.y), f: 0 });
  let guard = 0;
  while (hp.length && guard++ < 30000) {
    const c = pop(), cx = c.k % W, cy = Math.floor(c.k / W);
    if (cx === to.x && cy === to.y) {
      const out: Vec[] = [];
      let k = c.k;
      while (k !== key(from.x, from.y)) { out.push({ x: k % W, y: Math.floor(k / W) }); k = came.get(k)!; }
      return out.reverse();
    }
    const cg = gs.get(c.k)!;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cx + dx, ny = cy + dy;
      if (!inb(nx, ny) || !isWalkable(map[ny][nx])) continue;
      const ng = cg + 1, nk = key(nx, ny);
      if (ng < (gs.get(nk) ?? Infinity)) { gs.set(nk, ng); came.set(nk, c.k); push({ k: nk, f: ng + h(nx, ny) * 1.05 }); }
    }
  }
  return [];
}
