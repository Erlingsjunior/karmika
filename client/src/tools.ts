/** Ferramentas de ofício: cada uma tem o seu espaço próprio (não ocupa a mão da arma nem a mochila).
 *  Quanto melhor a ferramenta, melhor o trabalho:
 *  - power: quanto cada golpe avança (árvore, rocha, pele, erva)
 *  - yield: multiplicador do que se colhe
 *  - luck: chance de achados raros (minério, couro fino, peixe dourado, erva rara)
 *  - tier: certas coisas só cedem a ferramentas boas (veio de prata, Flor-de-Marghar, couro de lobisomem)
 *  O metal da ferramenta aparece na mão do herói quando ele trabalha. */
export type ToolSlot = 'axe' | 'pick' | 'knife' | 'shears' | 'rod';
export interface ToolDef { slot: ToolSlot; tier: number; power: number; yield: number; luck: number; base: string; tint: number; glow?: number }

export const TOOL_SLOTS: { k: ToolSlot; lab: string; icon: string; job: string }[] = [
  { k: 'axe', lab: 'Machado', icon: '🪓', job: 'Lenhador: corta árvores' },
  { k: 'pick', lab: 'Picareta', icon: '⛏', job: 'Mineiro: quebra rochas e veios' },
  { k: 'knife', lab: 'Faca de caça', icon: '🔪', job: 'Esfolador: tira o couro e a carne das feras abatidas' },
  { k: 'shears', lab: 'Alicate', icon: '✂', job: 'Herborista: colhe ervas sem matar a raiz' },
  { k: 'rod', lab: 'Vara', icon: '🎣', job: 'Pescador: pesca em rios e lagos' },
];

const STONE = 0x8d8a84, IRON = 0x8a929e, STEEL = 0xdde3ec, DWARF = 0xc9a24a, SILVER = 0xe8eef6;
export const TOOLS: Record<string, ToolDef> = {
  axe_s: { slot: 'axe', tier: 1, power: 1, yield: 1, luck: 0, base: 'Machado de Lenhador', tint: STONE },
  axe_i: { slot: 'axe', tier: 2, power: 1.5, yield: 1.25, luck: 0.05, base: 'Machado de Lenhador', tint: IRON },
  axe_st: { slot: 'axe', tier: 3, power: 2.2, yield: 1.5, luck: 0.1, base: 'Machado de Lenhador', tint: STEEL },
  axe_dw: { slot: 'axe', tier: 4, power: 3, yield: 1.8, luck: 0.18, base: 'Machado de Lenhador', tint: DWARF, glow: 0xffa040 },
  pick_s: { slot: 'pick', tier: 1, power: 1, yield: 1, luck: 0, base: 'Picareta', tint: STONE },
  pick_i: { slot: 'pick', tier: 2, power: 1.5, yield: 1.25, luck: 0.06, base: 'Picareta', tint: IRON },
  pick_st: { slot: 'pick', tier: 3, power: 2.2, yield: 1.5, luck: 0.12, base: 'Picareta', tint: STEEL },
  pick_dw: { slot: 'pick', tier: 4, power: 3, yield: 1.8, luck: 0.2, base: 'Picareta', tint: DWARF, glow: 0xffa040 },
  knife_f: { slot: 'knife', tier: 1, power: 1, yield: 1, luck: 0, base: 'Faca de Caça', tint: 0x5a5a62 },
  knife_i: { slot: 'knife', tier: 2, power: 1.5, yield: 1.3, luck: 0.12, base: 'Faca de Caça', tint: IRON },
  knife_st: { slot: 'knife', tier: 3, power: 2.2, yield: 1.6, luck: 0.25, base: 'Faca de Caça', tint: STEEL },
  knife_ag: { slot: 'knife', tier: 4, power: 2.6, yield: 1.8, luck: 0.35, base: 'Faca de Caça', tint: SILVER, glow: 0x9ad7ff },
  shears_c: { slot: 'shears', tier: 1, power: 1, yield: 1, luck: 0, base: 'Alicate de Ervas', tint: 0xb87a4a },
  shears_i: { slot: 'shears', tier: 2, power: 1.5, yield: 1.3, luck: 0.1, base: 'Alicate de Ervas', tint: IRON },
  shears_ag: { slot: 'shears', tier: 3, power: 2.2, yield: 1.6, luck: 0.2, base: 'Alicate de Ervas', tint: SILVER, glow: 0x9ad7ff },
  rod: { slot: 'rod', tier: 1, power: 1, yield: 1, luck: 0, base: 'Vara de Pesca', tint: 0x7a5a30 },
  rod_ash: { slot: 'rod', tier: 2, power: 1.5, yield: 1.3, luck: 0.08, base: 'Vara de Pesca', tint: 0xb8925a },
  rod_rune: { slot: 'rod', tier: 3, power: 2.2, yield: 1.6, luck: 0.18, base: 'Vara de Pesca', tint: 0x3a2a4a, glow: 0x8a7aff },
};
export const TIER_NAME = ['', 'rústica', 'de ferro', 'de mestre', 'lendária'];
export const isTool = (id: string) => !!TOOLS[id];
/** texto do que a ferramenta faz, para a descrição do item */
export function toolDesc(id: string) {
  const t = TOOLS[id]; if (!t) return '';
  const job = TOOL_SLOTS.find((s) => s.k === t.slot)!.job;
  return `${job}. Nível ${t.tier} · trabalho ×${t.power.toFixed(1)} · colheita ×${t.yield.toFixed(2)}${t.luck ? ` · achados raros ${Math.round(t.luck * 100)}%` : ''}.`;
}
