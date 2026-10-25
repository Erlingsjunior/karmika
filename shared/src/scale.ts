/**
 * REGRA DE ESCALA DO KARMIKA
 * 1 unidade do mundo = 1 metro. Um tile do mapa = TILE_M metros.
 * Todo objeto (modelo 3D, prop, cenário) deve usar estas medidas.
 * Quem modelar um objeto novo confere aqui o tamanho antes de exportar.
 */
export const TILE_M = 2;

export const SCALE = {
  /** altura total em metros, da sola do pé ao topo da cabeça */
  human: { height: 1.8, width: 1 },
  elf: { height: 2.0, width: 0.9 },
  dwarf: { height: 1.5, width: 1.3 },

  door: { width: 1.1, height: 2.4 },
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

/** Faixas de altura (m) por espécie: o jogador/NPC sorteia dentro da faixa. `typ` = modelo base. */
export const HEIGHT_RANGE = {
  human: { min: 1.75, max: 2.0, typ: 1.8 },
  elf: { min: 1.9, max: 2.25, typ: 2.05 },
  dwarf: { min: 1.4, max: 1.6, typ: 1.5 },
  vampire: { min: 1.8, max: 1.95, typ: 1.9 },
  werewolf: { min: 2.1, max: 2.3, typ: 2.2 }, // em forma de lobisomem
  technocrat: { min: 1.8, max: 1.9, typ: 1.85 },
  mech: { min: 2.8, max: 3.0, typ: 2.9 }, // robô de combate do technocrata
  mechHeavy: { min: 3.5, max: 5.0, typ: 4.0 }, // robôs grandes e tanques
  mage: { min: 1.9, max: 2.0, typ: 1.95 },
} as const;
