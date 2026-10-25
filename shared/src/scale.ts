/**
 * REGRA DE ESCALA DO KARMIKA
 * 1 unidade do mundo = 1 metro. Um tile do mapa = TILE_M metros.
 * Todo objeto (modelo 3D, prop, cenário) deve usar estas medidas.
 * Quem modelar um objeto novo confere aqui o tamanho antes de exportar.
 */
export const TILE_M = 2;

export const SCALE = {
  /** altura total em metros, da sola do pé ao topo da cabeça */
  human: { height: 1.75, width: 1 },
  elf: { height: 1.95, width: 0.9 },
  dwarf: { height: 1.35, width: 1.3 },

  door: { width: 1.0, height: 2.1 },
  window: { width: 0.9, height: 1.1, sill: 1.1 },
  floor: 3.0, // pé-direito de um andar
  roof: { height: 1.8, overhang: 0.4 },

  tree: { min: 5, max: 9, trunkRadius: 0.25 },
  torch: { height: 1.9 }, // braseiro de chão (tocha em poste)
  fountain: { radius: 2.2, height: 0.9 },
  temple: { wall: 7, roof: 4 },
  well: { radius: 0.8, height: 1.0 },
} as const;

/** Conversões entre grade (tiles) e metros. */
export const tileToM = (t: number) => t * TILE_M;
export const mToTile = (m: number) => m / TILE_M;
