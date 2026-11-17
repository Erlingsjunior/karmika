/* A FLORA MIÚDA DE KARMIKA (17/11, Erling: "fauna, flora tem que fazer"). O mundo já tinha capim, flores de campina, juncos e ervas de colher.
   Aqui entra o que faltava para cada paisagem ter a sua cara: samambaias na mata, cogumelos no pântano, nenúfares na água parada,
   arbustos de gelo na neve, galhos secos nas terras mortas, folhas largas na selva, flores que brilham na Floresta Encantada.
   É só cenário: não se colhe e não tem colisão. Cada planta nasce sempre no mesmo lugar (a conta sai da casa do mapa, sem sorteio guardado). */
import type { Biome } from '../world';

export type Especie = 'samambaia' | 'cogumelo' | 'nenufar' | 'arbusto_gelo' | 'galho_seco' | 'folha_larga' | 'flor_luz' | 'flor_miuda' | 'concha';
/** em cada paisagem: a planta e de quantas em quantas casas, na média, nasce uma */
export const FLORA_DE: Record<Biome, [Especie, number][]> = {
  meadow: [['flor_miuda', 9], ['samambaia', 40]],
  forest: [['samambaia', 7], ['cogumelo', 22], ['flor_miuda', 30]],
  swamp: [['cogumelo', 9], ['samambaia', 16]],
  snow: [['arbusto_gelo', 12]],
  ruins: [['galho_seco', 14], ['flor_miuda', 40]],
  rock: [['galho_seco', 16]],
  volcanic: [['galho_seco', 10]],
  enchanted: [['flor_luz', 6], ['cogumelo', 14], ['samambaia', 14]],
  blight: [['galho_seco', 7], ['cogumelo', 30]],
  jungle: [['folha_larga', 6], ['samambaia', 9], ['flor_miuda', 26]],
  coast: [['concha', 14], ['flor_miuda', 30]],
};
/** na água rasa e parada destas paisagens nasce nenúfar, de quantas em quantas casas */
export const NENUFAR_EM: Partial<Record<Biome, number>> = { swamp: 5, forest: 9, meadow: 12, enchanted: 6, jungle: 7 };
/** cores possíveis de cada espécie (a conta da casa escolhe uma) */
export const CORES: Record<Especie, number[]> = {
  samambaia: [0x3f8a45, 0x2f7038, 0x58a050], cogumelo: [0xc0452e, 0xd8b060, 0x8a5a9a, 0xe8e0d0], nenufar: [0x3f8a55, 0x4a9a60],
  arbusto_gelo: [0xdcecf8, 0xb8d4ec], galho_seco: [0x4a3a2c, 0x5a4a3a, 0x2c2420], folha_larga: [0x2f8a40, 0x3fa050, 0x268048],
  flor_luz: [0x9a7aff, 0x5ae0ff, 0xff8ae0, 0xfff08a], flor_miuda: [0xffe070, 0xffffff, 0xff9ac0, 0xb09aff, 0xff7050], concha: [0xf0e0d0, 0xe8c0b0, 0xd0d8e8],
};
/** quantas de cada espécie cabem em volta de quem joga, e o raio (em casas) */
export const MAXIMO = 240, RAIO = 24;
