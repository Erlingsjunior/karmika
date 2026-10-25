import { potionPulse } from './celebrate';
import { isPremium, GIFT_BAG } from './premium';
import { floatWin, confirmBox } from './windows';
import { TOOLS, TOOL_SLOTS, TIER_NAME, isTool, toolDesc, type ToolSlot } from './tools';
import { facSet, myFac, setMyFac, FAC, FAC_LVL, FAC_ILVL, FAC_PRICE, type Fac } from './faccoes';
import { reqLvl, tipCtx, genGear, gearTip, gearIcon, plainGear, syncUid, rollRarity, RARITY, RSLOT, STAT_LABEL, SPECIAL, type Gear, type Slot, type StatKey } from './loot';

export type ItemKind = 'res' | 'food' | 'tool' | 'weapon' | 'armor' | 'shield' | 'misc';
export interface Item { name: string; icon: string; kind: ItemKind; col: number; desc: string; heal?: number; mp?: number; buff?: string; atk?: number; def?: number; tier?: number; sell?: number }
export const ITEMS: Record<string, Item> = {
  stick: { name: 'Galho', icon: '🥢', kind: 'res', col: 0x8a6a3a, desc: 'Gravetos secos. Servem para ferramentas e fogueira.', sell: 1 },
  wood: { name: 'Madeira', icon: '🪵', kind: 'res', col: 0x7a5532, desc: 'Troncos cortados.', sell: 2 },
  stone: { name: 'Pedra', icon: '🪨', kind: 'res', col: 0x8a8a88, desc: 'Pedra comum.', sell: 1 },
  flint: { name: 'Pederneira', icon: '✨', kind: 'misc', col: 0xd0d0d8, desc: 'Gera faíscas. Necessária para acender fogueiras.', sell: 4 },
  rope: { name: 'Corda', icon: '🧵', kind: 'res', col: 0xc9b07a, desc: 'Corda trançada.', sell: 3 },
  meat: { name: 'Carne crua', icon: '🥩', kind: 'food', col: 0xc23a3a, desc: 'Cozinhe numa fogueira. Crua cura pouco.', heal: 6, sell: 3 },
  cooked: { name: 'Carne assada', icon: '🍖', kind: 'food', col: 0x9a5a2a, desc: 'Cura bastante.', heal: 45, sell: 6 },
  fish: { name: 'Peixe cru', icon: '🐟', kind: 'food', col: 0x7ab0d0, desc: 'Cozinhe numa fogueira.', heal: 5, sell: 3 },
  fishc: { name: 'Peixe assado', icon: '🍣', kind: 'food', col: 0xd09a5a, desc: 'Cura bastante.', heal: 38, sell: 5 },
  bread: { name: 'Pão', icon: '🍞', kind: 'food', col: 0xd0a060, desc: 'Cura um pouco.', heal: 20, sell: 2 },
  lagrima: { name: 'Lágrima do Olho', icon: '💧', kind: 'misc', col: 0x9ad7ff, tier: 5, sell: 1500, desc: 'Marghar se emocionou. Guarde para a morte: no Limiar ela paga a volta da alma sem penalidade nenhuma. Ou use para trocar por 7 dias de Premium, venda ao mercador (1.500 ouro) ou a outro jogador pelo correio e pelo Quadro.' },
  seal_p30: { name: 'Selo de Marghar · 30 dias', icon: '✦', kind: 'misc', col: 0xc9a0ff, desc: 'Comprado no Shop. Use para ativar 30 dias de Premium (Bênção de Marghar), ou venda a outro jogador no Quadro de Avisos ou pelo correio. O mercador não compra.' },
  seal_p90: { name: 'Selo de Marghar · 90 dias', icon: '✦', kind: 'misc', col: 0xc9a0ff, desc: 'Comprado no Shop. Use para ativar 90 dias de Premium, ou venda a outro jogador. O mercador não compra.' },
  seal_p365: { name: 'Selo de Marghar · 1 ano', icon: '✦', kind: 'misc', col: 0xc9a0ff, desc: 'Comprado no Shop. Use para ativar 1 ano de Premium, ou venda a outro jogador. O mercador não compra.' },
  scroll_return: { name: 'Pergaminho do Regresso', icon: '📜', kind: 'misc', col: 0x8f7bff, desc: 'Dádiva da Deusa dos Caminhos. Lido, abre um caminho à sua frente que leva à sua fonte-lar. Some ao ser lido — magos e bruxos sabem escrevê-los.', sell: 6 },
  seal_1: { name: 'Selo do Carrasco', icon: '🜏', kind: 'misc', col: 0xb3202f, desc: 'Primeiro selo da Porta do Bispo, arrancado do Carrasco das Criptas.', sell: 0 },
  seal_2: { name: 'Selo do Príncipe Ósseo', icon: '🜏', kind: 'misc', col: 0xb3202f, desc: 'Segundo selo da Porta do Bispo.', sell: 0 },
  seal_3: { name: 'Selo do Guardião', icon: '🜏', kind: 'misc', col: 0xb3202f, desc: 'Terceiro selo da Porta do Bispo.', sell: 0 },
  tome: { name: 'Tomo Kármico', icon: '📖', kind: 'misc', col: 0xffd24a, desc: 'Lido, concede 5 pontos de magia à Árvore Kármica (K).', sell: 120 },
  potion: { name: 'Poção de vida', icon: '🧪', kind: 'food', col: 0xff4a5a, desc: 'Cura 60 de vida.', heal: 60, sell: 8 },
  apple: { name: 'Maçã silvestre', icon: '🍎', kind: 'food', col: 0xd04a3a, desc: 'Cura um pouco.', heal: 12, sell: 1 },
  hide: { name: 'Couro', icon: '🟫', kind: 'res', col: 0x8a5a3a, desc: 'Pele de animal. Vira armadura.', sell: 6 },
  claw: { name: 'Garra', icon: '🦴', kind: 'res', col: 0xe0d8c0, desc: 'Garra de criatura.', sell: 8 },
  dust: { name: 'Pó de fada', icon: '💫', kind: 'res', col: 0xff9ad8, desc: 'Brilha suavemente.', sell: 12 },
  sap: { name: 'Seiva viva', icon: '🍯', kind: 'res', col: 0xd0a030, desc: 'Seiva do Guardião da Mata.', sell: 15 },
  // ferramentas de ofício (espaços próprios na ficha do personagem)
  axe_s: { name: 'Machado de Pedra', icon: '🪓', kind: 'tool', col: 0x8a8a88, desc: '', tier: 1, sell: 6 },
  axe_i: { name: 'Machado de Ferro', icon: '🪓', kind: 'tool', col: 0xc8ccd4, desc: '', tier: 2, sell: 14 },
  axe_st: { name: 'Machado de Aço do Lenhador', icon: '🪓', kind: 'tool', col: 0xdde3ec, desc: '', tier: 3, sell: 50 },
  axe_dw: { name: 'Machado Rúnico dos Anões', icon: '🪓', kind: 'tool', col: 0xc9a24a, desc: 'Forjado na Montanha Negra. Corta carvalho como quem corta pão.', tier: 4, sell: 160 },
  pick_s: { name: 'Picareta de Pedra', icon: '⛏', kind: 'tool', col: 0x8a8a88, desc: '', tier: 1, sell: 6 },
  pick_i: { name: 'Picareta de Ferro', icon: '⛏', kind: 'tool', col: 0xc8ccd4, desc: 'Já arranca minério de ferro dos veios.', tier: 2, sell: 16 },
  pick_st: { name: 'Picareta de Aço', icon: '⛏', kind: 'tool', col: 0xdde3ec, desc: 'Alcança os veios de prata.', tier: 3, sell: 55 },
  pick_dw: { name: 'Picareta Rúnica dos Anões', icon: '⛏', kind: 'tool', col: 0xc9a24a, desc: 'Os anões dizem que a pedra conversa com ela.', tier: 4, sell: 170 },
  knife_f: { name: 'Faca de Sílex', icon: '🔪', kind: 'tool', col: 0x5a5a62, desc: 'Lasca de pedra presa num cabo. Esfola mal, mas esfola.', tier: 1, sell: 2 },
  knife_i: { name: 'Faca de Caça de Ferro', icon: '🔪', kind: 'tool', col: 0xc8ccd4, desc: '', tier: 2, sell: 12 },
  knife_st: { name: 'Faca de Esfolar de Aço', icon: '🔪', kind: 'tool', col: 0xdde3ec, desc: 'Tira o couro inteiro, sem rasgo: rende couro fino.', tier: 3, sell: 45 },
  knife_ag: { name: 'Faca de Prata dos Caçadores', icon: '🔪', kind: 'tool', col: 0xe8eef6, desc: 'Da Escola de Caçadores. Só a prata corta o couro de um lobisomem.', tier: 4, sell: 140 },
  shears_c: { name: 'Alicate de Cobre', icon: '✂', kind: 'tool', col: 0xb87a4a, desc: '', tier: 1, sell: 5 },
  shears_i: { name: 'Alicate de Ferro do Herborista', icon: '✂', kind: 'tool', col: 0xc8ccd4, desc: 'Corta a Raiz-Sangue sem fazê-la secar.', tier: 2, sell: 18 },
  shears_ag: { name: 'Alicate de Prata', icon: '✂', kind: 'tool', col: 0xe8eef6, desc: 'Prata não fere o que é sagrado: colhe a Flor-de-Marghar.', tier: 3, sell: 60 },
  rod: { name: 'Vara de pesca', icon: '🎣', kind: 'tool', col: 0x8a6a3a, desc: '', tier: 1, sell: 5 },
  rod_ash: { name: 'Vara de Freixo', icon: '🎣', kind: 'tool', col: 0xb8925a, desc: 'Flexível e sensível: sente a mordida antes.', tier: 2, sell: 20 },
  rod_rune: { name: 'Vara Rúnica', icon: '🎣', kind: 'tool', col: 0x8a7aff, desc: 'Os peixes dourados sobem até ela.', tier: 3, sell: 70 },
  // achados de ofício
  ore_i: { name: 'Minério de Ferro', icon: '🟤', kind: 'res', col: 0x8a5a4a, desc: 'Pedra pesada com veios de ferro. Ferreiros pagam bem.', sell: 6 },
  ore_ag: { name: 'Minério de Prata', icon: '⚪', kind: 'res', col: 0xdde3ec, desc: 'Prata bruta. Caçadores de vampiros a disputam.', sell: 18 },
  gem: { name: 'Gema bruta', icon: '💎', kind: 'res', col: 0x7ad0ff, desc: 'Uma pedra que guarda luz. Joalheiros e magos a querem.', sell: 40 },
  hide_f: { name: 'Couro fino', icon: '🟧', kind: 'res', col: 0xb0703a, desc: 'Pele tirada inteira, sem rasgo. Vale o triplo.', sell: 18 },
  hide_w: { name: 'Couro de lobisomem', icon: '🟪', kind: 'res', col: 0x4a3a4a, desc: 'Grosso como casca. Só a prata o tira do corpo.', sell: 60 },
  herb_g: { name: 'Folha-de-Prata', icon: '🌿', kind: 'res', col: 0x9ad0a0, desc: 'Erva comum dos campos. Base de quase toda poção.', sell: 2 },
  herb_s: { name: 'Cogumelo-Lamparina', icon: '🍄', kind: 'res', col: 0xd0a04a, desc: 'Brilha fraco no escuro do pântano e da mata.', sell: 4 },
  herb_r: { name: 'Raiz-Sangue', icon: '🥀', kind: 'res', col: 0xa02a3a, desc: 'Raiz vermelha que seca se for arrancada com metal ruim.', sell: 9 },
  herb_j: { name: 'Junco-do-Rio', icon: '🌾', kind: 'res', col: 0xb8b070, desc: 'Cresce na beira da água. Trançado vira corda; a seiva acalma o veneno.', sell: 2 },
  herb_f: { name: 'Flor-de-Campo', icon: '🌼', kind: 'res', col: 0xf0c050, desc: 'Pétalas dos prados. O alquimista tira delas um bálsamo; o tônico fica mais forte.', sell: 2 },
  herb_m: { name: 'Flor-de-Marghar', icon: '💠', kind: 'res', col: 0x7ab0ff, desc: 'Floresce onde alguém fez uma escolha difícil. Só a prata a colhe.', sell: 30 },
  fish_g: { name: 'Salmão Dourado', icon: '🐠', kind: 'food', col: 0xffc04a, desc: 'Raro. Cura muito, mesmo cru.', heal: 60, sell: 25 },
  // alquimia
  potion_g: { name: 'Poção maior', icon: '🧪', kind: 'food', col: 0xff2a4a, desc: 'Cura 140 de vida.', heal: 140, sell: 20 },
  mana: { name: 'Poção de magia', icon: '🔮', kind: 'food', col: 0x5a8aff, desc: 'Restaura 80 de magia.', mp: 80, sell: 14 },
  tonic: { name: 'Tônico de vigor', icon: '🫙', kind: 'food', col: 0x8ad07a, desc: 'Regenera vida por 30 s.', heal: 20, buff: 'regen', sell: 12 },
  antidote: { name: 'Antídoto', icon: '🌿', kind: 'food', col: 0x6ab05a, desc: 'Cura veneno e queimaduras.', heal: 10, buff: 'cleanse', sell: 8 },
  // cervejaria e cozinha
  beer: { name: 'Cerveja de Karmika', icon: '🍺', kind: 'food', col: 0xd8a040, desc: 'Coragem líquida: +10% de dano por 60 s.', heal: 15, buff: 'courage', sell: 5 },
  mead: { name: 'Hidromel', icon: '🍯', kind: 'food', col: 0xe0b040, desc: '+15% de dano e +10% de velocidade por 60 s.', heal: 25, buff: 'mead', sell: 9 },
  skewer: { name: 'Espetinho de javali', icon: '🍢', kind: 'food', col: 0xb05a2a, desc: 'Cura 70 de vida.', heal: 70, sell: 8 },
  stew: { name: 'Ensopado de caça', icon: '🍲', kind: 'food', col: 0xa0603a, desc: 'Cura 90 e regenera por 20 s.', heal: 90, buff: 'regen', sell: 12 },
  sausage: { name: 'Linguiça defumada', icon: '🌭', kind: 'food', col: 0xa04a3a, desc: 'Cura 40. Dura para sempre.', heal: 40, sell: 7 },
  jerky: { name: 'Carne seca', icon: '🥓', kind: 'food', col: 0x8a4a3a, desc: 'Cura 30. Leve e durável.', heal: 30, sell: 5 },
  // construção
  plank: { name: 'Tábua', icon: '🟨', kind: 'res', col: 0xb08a5a, desc: 'Madeira aparelhada para construir.', sell: 3 },
  nail: { name: 'Pregos', icon: '🔩', kind: 'res', col: 0x9a9aa0, desc: 'Um punhado de pregos de ferro.', sell: 2 },
  block: { name: 'Bloco de pedra', icon: '🧱', kind: 'res', col: 0x8a8a88, desc: 'Pedra aparelhada para fundações.', sell: 4 },
  // bolsas
  bag_s: { name: 'Bolsa de couro', icon: '👝', kind: 'misc', col: 0x8a5a3a, desc: 'Bolsa com 8 espaços. Equipa-se sozinha na mochila.', tier: 1 },
  bag_m: { name: 'Bolsa grande', icon: '🧳', kind: 'misc', col: 0x6a4a3a, desc: 'Bolsa com 12 espaços. Equipa-se sozinha na mochila.', tier: 2 },
  bag_l: { name: 'Alforje de viajante', icon: '🎒', kind: 'misc', col: 0x5a3a2a, desc: 'Bolsa com 24 espaços. Só se vende nas cidades maiores.', tier: 3 },
  bag_mg: { name: 'Alforje de Marghar', icon: '🎒', kind: 'misc', col: 0x3a2a4a, desc: 'Bolsa Premium com 68 espaços, costurada com fio do manto de Marghar. Sem o Premium ativo ela fica lacrada.', tier: 5 },
  bag_xl: { name: 'Baú de costas anão', icon: '📦', kind: 'misc', col: 0x4a3a2a, desc: 'Bolsa com 36 espaços, obra dos anões. Só nas grandes cidades.', tier: 4 },
  // companheiros
  pet_fox: { name: 'Raposa Ruiva', icon: '🦊', kind: 'misc', col: 0xd0702a, desc: 'Companheira que corre atrás dos itens caídos e traz para você.', tier: 1 },
  pet_pup: { name: 'Filhote de Lobo', icon: '🐺', kind: 'misc', col: 0x8a8a8a, desc: 'Fiel e rápido. Busca itens caídos.', tier: 1 },
  mount_horse: { name: 'Cavalo Baio', icon: '🐴', kind: 'misc', col: 0x6a4a2e, desc: 'Montaria (Z): +75% de velocidade fora de combate.', tier: 1 },
  mount_black: { name: 'Corcel Negro', icon: '🐎', kind: 'misc', col: 0x1a1612, desc: 'Montaria (Z): +90% de velocidade fora de combate.', tier: 2 },
};
for (const id of Object.keys(TOOLS)) if (ITEMS[id]) ITEMS[id].desc = (ITEMS[id].desc ? ITEMS[id].desc + ' ' : '') + toolDesc(id);
export const PRICES: Record<string, number> = { axe_i: 60, axe_s: 30, axe_st: 220, pick_s: 30, pick_i: 70, pick_st: 240, knife_f: 12, knife_i: 55, knife_st: 200, shears_c: 25, shears_i: 80, rod_ash: 90, potion: 15, bread: 4, rope: 6, flint: 8, rod: 25, bag_s: 60, bag_m: 180, bag_l: 520, bag_xl: 1400, potion_g: 40, mana: 28, tonic: 24, antidote: 16, beer: 8, mead: 16, skewer: 14, stew: 22, sausage: 12, jerky: 9, cooked: 10, fishc: 9, plank: 6, nail: 4, block: 8, wood: 5, stone: 3, pet_fox: 350, bag_mg: 2400, pet_pup: 500, mount_horse: 900, mount_black: 2200, scroll_return: 30 };
export interface ShopDef { title: string; items: string[]; fac?: Fac; gear?: Slot[]; buys?: Record<string, number>; note?: string }
export const SHOPDEF: Record<string, ShopDef> = {
  armeiro: { title: 'Doran, o Armeiro', items: ['axe_i', 'pick_i', 'knife_i', 'potion'], buys: { ore_i: 1.5, ore_ag: 1.3 }, gear: ['weapon', 'weapon', 'weapon', 'shield', 'shield'], note: 'Espadas, machados, martelos e escudos. Aço do Norte.' },
  armaduras: { title: 'Maren, a Armadureira', items: [], gear: ['armor', 'armor', 'helm', 'helm', 'boots', 'boots'], buys: { hide: 1.6 }, note: 'Couro, cota e placas. Paga bem por couro.' },
  mercador: { title: 'Thorin, o Mercador', items: ['potion', 'bread', 'rope', 'flint', 'axe_s', 'pick_s', 'knife_f', 'shears_c', 'rod', 'bag_s', 'bag_m', 'scroll_return'], note: 'Um pouco de tudo. Bolsas para quem junta demais.' },
  mercador_cidade: { title: 'Ivar, Grande Mercador', items: ['potion', 'potion_g', 'mana', 'bread', 'rope', 'flint', 'axe_i', 'pick_st', 'shears_i', 'rod_ash', 'bag_s', 'bag_m', 'bag_l', 'bag_mg', 'scroll_return'], buys: { gem: 1.4, ore_ag: 1.4 }, note: 'Regra do comércio: quanto maior a cidade, melhores as bolsas e os itens. Aqui vai até o alforje de 24.' },
  pocoes: { title: 'Morwen, a Alquimista', items: ['potion', 'potion_g', 'mana', 'tonic', 'antidote', 'shears_c', 'shears_i'], buys: { dust: 1.5, sap: 1.5, herb_g: 1.6, herb_s: 1.6, herb_j: 1.5, herb_f: 1.6, herb_r: 1.6, herb_m: 1.5 }, note: 'Poções e tônicos. Compra ervas, pó de fada e seiva — e vende alicates para quem colhe.' },
  cervejaria: { title: 'Tessa, a Cervejeira', items: ['beer', 'mead', 'bread'], buys: { apple: 1.5 }, note: 'Cerveja e hidromel: coragem em caneca.' },
  churrasco: { title: 'Sven, o Churrasqueiro', items: ['skewer', 'cooked', 'fishc'], buys: { meat: 1.4, fish: 1.4 }, note: 'Carne no espeto, sempre quente.' },
  charcutaria: { title: 'Bruno, o Charcuteiro', items: ['sausage', 'jerky'], buys: { meat: 2.0, hide: 1.2 }, note: 'Paga o dobro por carne crua.' },
  cozinha: { title: 'Rosália, a Cozinheira', items: ['stew', 'cooked', 'fishc', 'bread'], buys: { meat: 1.3, fish: 1.3, apple: 1.3 }, note: 'Ensopado de caça da casa.' },
  lenhador: { title: 'Tomás, o Lenhador', items: ['axe_s', 'axe_i', 'axe_st', 'wood'], buys: { wood: 1.5, stick: 1.5 }, note: 'Machados e madeira. Paga bem por toras.' },
  cacador: { title: 'Kaela, a Caçadora', items: ['knife_f', 'knife_i', 'knife_st', 'rod', 'rod_ash', 'jerky', 'potion'], buys: { hide: 1.4, hide_f: 1.4, hide_w: 1.3, claw: 1.5, meat: 1.2 }, note: 'Couro, garras e carne: a floresta paga.' },
  construtor: { title: 'Gunnar, o Construtor', items: ['plank', 'nail', 'block', 'rope'], buys: { wood: 1.3, stone: 1.5 }, note: 'Materiais para construir a sua casa.' },
  domador: { title: 'Corwin, o Domador', items: ['pet_fox', 'pet_pup'], note: 'Companheiros que buscam o que cai no chão.' },
  tec_fio: { title: 'Tecelagem Real do Fio', items: [], fac: 'fio', note: 'Feito à mão pelas tecelãs da Ordem, com o fio que nunca se corta. Ninguém mais sabe tecer isto. Só para quem jurou o Fio.' },
  tec_desf: { title: 'Tecelagem dos Desfiados', items: [], fac: 'desf', note: 'Pano negro rasgado de propósito, ferro que não enferruja. Feito na oficina dos Desfiados e em nenhum outro lugar. Só para quem cortou o fio.' },
  latao: { title: 'Companhia das Caravanas de Latão', items: ['potion_g', 'mana', 'tonic', 'antidote', 'rope', 'scroll_return', 'bag_l'], buys: { ore_i: 1.3, gem: 1.3 }, note: 'Mercadoria do porto, trazida pelas caravanas de latão.' },
  estabulo: { title: 'Orm, o Estalajadeiro', items: ['mount_horse', 'mount_black'], note: 'Montarias: Z para montar e desmontar.' },
};
export const SHOPS: Record<string, string[]> = Object.fromEntries(Object.entries(SHOPDEF).map(([k, v]) => [k, v.items]));
export const RECIPES: { id: string; out: string; n: number; need: [string, number][]; keep?: string[]; label?: string }[] = [
  { id: 'axe', out: 'axe_s', n: 1, need: [['stick', 3], ['stone', 2], ['rope', 1]] },
  { id: 'pick', out: 'pick_s', n: 1, need: [['stick', 3], ['stone', 3], ['rope', 1]] },
  { id: 'knife', out: 'knife_f', n: 1, need: [['stick', 1], ['stone', 1], ['rope', 1]] },
  { id: 'rod', out: 'rod', n: 1, need: [['stick', 2], ['rope', 1]] },
  { id: 'fire', out: 'fire', n: 1, need: [['stick', 4], ['stone', 2]], keep: ['flint'], label: 'Fogueira' },
];
/** equipamentos antigos (saves v1) viram itens Normais */
const LEGACY: Record<string, { slot: Slot; base: string; icon: string; stats: Partial<Record<StatKey, number>> }> = {
  sword_i: { slot: 'weapon', base: 'Espada de Ferro', icon: '🗡️', stats: { dmg: 7 } }, sword_s: { slot: 'weapon', base: 'Espada de Aço', icon: '⚔️', stats: { dmg: 14 } },
  armor_l: { slot: 'armor', base: 'Armadura de Couro', icon: '🥋', stats: { def: 7 } }, armor_m: { slot: 'armor', base: 'Cota de Malha', icon: '🛡️', stats: { def: 14 } },
  shield_w: { slot: 'shield', base: 'Escudo de Madeira', icon: '🔰', stats: { def: 5 } }, shield_i: { slot: 'shield', base: 'Escudo de Ferro', icon: '🛡', stats: { def: 10 } },
};
export type Attr = 'str' | 'dex' | 'vit' | 'int';
export const ATTRS: { k: Attr; lab: string; tip: string }[] = [
  { k: 'str', lab: 'Força', tip: '+2% de dano por ponto' }, { k: 'dex', lab: 'Destreza', tip: '+0,4% de crítico e +0,3% de velocidade por ponto' },
  { k: 'vit', lab: 'Vitalidade', tip: '+5 de vida, defesa e regeneração por ponto' }, { k: 'int', lab: 'Energia', tip: '+4 de magia por ponto' },
];
const SLOTS: Slot[] = ['helm', 'earring', 'earring2', 'amulet', 'shoulders', 'cape', 'armor', 'weapon', 'shield', 'ring', 'ring2', 'boots', 'relic'];

interface St {
  res?: { name: string; mode: 'regen' | 'fight' }; gen: number; auras?: number[];
  hp: number; hpMax: number; mp: number; mpMax: number; gold: number; lvl: number; xp: number; kills: number;
  atk: number; def: number; dmgFlat: number; crit: number; leech: number; regen: number; move: number; xpMul: number; goldMul: number;
  points: number; attrs: Record<Attr, number>; sp: Set<string>; recalc: (() => void) | null;
}
interface GameLike { st: St; logMsg(t: string, c?: string): void; drinkBuff?(id: string): void; snd?(k: 'coins' | 'error' | 'pickup' | 'click'): void }

export const STACK = 20;
/** até 7 bolsas além da mochila (8 a 128 espaços cada, conforme o nível, os lugares e o comércio entre jogadores) */
export const MAX_BAGS = 7;
/** Bolsa de Ofício: materiais de coleta e construção sem limite de espaço · Bolsa Mágica: reagentes e escritos arcanos sem limite */
export const CRAFT_BAG = new Set(['stick', 'wood', 'stone', 'rope', 'plank', 'nail', 'block', 'hide', 'claw', 'ore_i', 'ore_ag', 'hide_f', 'hide_w', 'herb_g', 'herb_s', 'herb_r', 'herb_j', 'herb_f']);
export const MAGIC_BAG = new Set(['gem', 'herb_m', 'dust', 'sap', 'tome', 'scroll_return', 'seal_1', 'seal_2', 'seal_3', 'flint']);
/* Bolsa de Ofício e Bolsa Mágica são do Premium: sem ele, o que estava nelas aparece na mochila comum (nada some) */
const freeBag = (id: string) => isPremium() && (CRAFT_BAG.has(id) || MAGIC_BAG.has(id));
export const BAGS: Record<string, number> = { bag_s: 8, bag_m: 12, bag_l: 24, bag_xl: 36, bag_mg: 68 };
/** bolsas que só funcionam com o Premium ativo (sem ele ficam lacradas: não contam espaço) */
export const PREMIUM_BAGS = new Set(['bag_mg']);
export function createInventory(game: GameLike, hooks: { placeFire(): boolean; raceLabel(): string; karma(): number; xpNeed(): number; onCraft?(name: string): void; portrait?(): string | null; soul?(): [string, string][]; title?(): string; onUse?(id: string): boolean; onGear?(): void; onBag?(): void; /** bônus de XP fora do equipamento (bênção do voto) */ xpBonus?(): number; /** multiplicador de preço desta loja para este herói */ priceK?(shop: string): number; /** arma de caminho: devolve o motivo se este herói não pode empunhar */ canWear?(g: Gear): string | null }) {
  const bag: Record<string, number> = { potion: 2, bread: 3, flint: 1, rope: 2 };
  let gearBag: Gear[] = [];
  const tools: Record<ToolSlot, string | null> = { axe: null, pick: null, knife: null, shears: null, rod: null };
  const eqG: Record<Slot, Gear | null> = { weapon: null, armor: null, shield: null, helm: null, boots: null, ring: null, ring2: null, amulet: null, relic: null, earring: null, earring2: null, shoulders: null, cape: null };
  let stock: Gear[] = [];
  const accClosed = new Set<string>((() => { try { return JSON.parse(localStorage.getItem('karmika.acc') || '["craft"]') as string[]; } catch { return ['craft']; } })());
  let open = false, charOpen = false, shop: string | null = null, shopTitle: string | null = null;
  const bags: string[] = []; // bolsas extras equipadas (ids de BAGS), até 4
  /* Bolsa de Ofício (60 espaços) e Bolsa Mágica (30): grandes, mas com fim. O que passar do limite ocupa a mochila comum */
  const CRAFT_CAP = 60, MAGIC_CAP = 30;
  const slotsOf = (id: string) => freeBag(id) ? 0 : Math.ceil((bag[id] ?? 0) / STACK);
  const stacksIn = (set: Set<string>) => [...set].reduce((a, k) => a + Math.ceil((bag[k] ?? 0) / STACK), 0);
  const overflow = () => isPremium() ? Math.max(0, stacksIn(CRAFT_BAG) - CRAFT_CAP) + Math.max(0, stacksIn(MAGIC_BAG) - MAGIC_CAP) : 0;
  const usedSlots = () => gearBag.length + Object.keys(bag).reduce((a, k) => a + slotsOf(k), 0) + overflow();
  const capacity = () => 16 + (isPremium() ? GIFT_BAG : 0) + bags.reduce((a, b) => a + (PREMIUM_BAGS.has(b) && !isPremium() ? 0 : BAGS[b] ?? 0), 0);
  const canAdd = (id: string, n = 1) => { const cur = bag[id] ?? 0; bag[id] = cur + n; const ok = usedSlots() <= capacity(); if (cur) bag[id] = cur; else delete bag[id]; return ok; };
  const canAddGear = () => usedSlots() + 1 <= capacity();
  const el = document.createElement('div'); el.id = 'inv'; document.body.appendChild(el);
  const ch = document.createElement('div'); ch.id = 'char'; document.body.appendChild(ch);
  const sh = document.createElement('div'); sh.id = 'shop'; document.body.appendChild(sh);
  /* Baú do Caminhante: um só baú, aberto em qualquer povoado (vila, cidade pequena, média ou grande) */
  const VKEY = 'karmika.vault.v1';
  const vault: { items: Record<string, number>; gear: Gear[] } = (() => { try { const v = JSON.parse(localStorage.getItem(VKEY) || 'null'); if (v && v.items && v.gear) return v; } catch { /* */ } return { items: {}, gear: [] }; })();
  let vaultOpen = false;
  const vt = document.createElement('div'); vt.id = 'vault'; document.body.appendChild(vt);
  const VAULT_FREE = 60, VAULT_PREM = 60;
  const vaultCap = () => VAULT_FREE + (isPremium() ? VAULT_PREM : 0);
  const vaultUsed = () => vault.gear.length + Object.values(vault.items).reduce((a, n) => a + Math.ceil(n / STACK), 0);
  const vsave = () => { try { localStorage.setItem(VKEY, JSON.stringify(vault)); } catch { /* */ } };
  function deposit(ref: string, quiet = false): boolean {
    const [k, a, b] = ref.split(':');
    if (k === 'g') { const i = gearBag.findIndex((g) => g.uid === +a); if (i < 0) return false; if (vaultUsed() + 1 > vaultCap()) { if (!quiet) game.logMsg('📦 O baú está cheio.', '#ff9a8a'); return false; } vault.gear.push(gearBag.splice(i, 1)[0]); }
    else { const id = a, n = Math.min(+b || 1, bag[id] ?? 0); if (n <= 0) return false; const cur = vault.items[id] ?? 0, extra = Math.ceil((cur + n) / STACK) - Math.ceil(cur / STACK); if (vaultUsed() + extra > vaultCap()) { if (!quiet) game.logMsg('📦 O baú está cheio.', '#ff9a8a'); return false; }
      bag[id] -= n; if (bag[id] <= 0) delete bag[id]; vault.items[id] = cur + n; }
    vsave(); recalc(); if (!quiet) { render(); save(); } return true;
  }
  function withdraw(ref: string) {
    const [k, a] = ref.split(':');
    if (k === 'vg') { const i = vault.gear.findIndex((g) => g.uid === +a); if (i < 0) return; if (!canAddGear()) { game.logMsg('🎒 Sem espaço na mochila.', '#ff9a8a'); return; } gearBag.push(vault.gear.splice(i, 1)[0]); }
    else { const id = a, n = vault.items[id] ?? 0; if (n <= 0) return; let moved = n; while (moved > 0 && !canAdd(id, moved)) moved--; if (moved <= 0) { game.logMsg('🎒 Sem espaço na mochila.', '#ff9a8a'); return; } bag[id] = (bag[id] ?? 0) + moved; vault.items[id] = n - moved; if (vault.items[id] <= 0) delete vault.items[id]; }
    vsave(); recalc(); render(); save();
  }
  const tip = document.createElement('div'); tip.id = 'tip'; document.body.appendChild(tip);
  floatWin(ch, 'char', { left: '3vw', top: '7vh' }); floatWin(el, 'inv', { right: '3vw', top: '7vh' }); floatWin(sh, 'shop', { left: '3vw', top: '7vh' }); floatWin(vt, 'vault', { left: '3vw', top: '7vh' });
  const has = (id: string, n = 1) => (bag[id] ?? 0) >= n;
  const count = (id: string) => bag[id] ?? 0;
  const st = game.st;
  const total = () => { const t: Partial<Record<StatKey, number>> = {}; for (const g of Object.values(eqG)) if (g) for (const [k, v] of Object.entries(g.stats) as [StatKey, number][]) t[k] = (t[k] ?? 0) + v; return t; };

  function recalc() {
    const t = total(), A = st.attrs, b = (k: Attr) => A[k] + (t[k] ?? 0);
    const keepHp = st.hpMax > 0 ? st.hp / st.hpMax : 1, keepMp = st.mpMax > 0 ? st.mp / st.mpMax : 1;
    st.hpMax = Math.round(100 + 12 * (st.lvl - 1) + 5 * b('vit') + (t.hp ?? 0));
    st.mpMax = st.res?.mode === 'fight' ? Math.round(100 + (t.mp ?? 0) * 0.4) : Math.round(100 + 6 * (st.lvl - 1) + 4 * b('int') + (t.mp ?? 0)); // recurso de luta: teto fixo, o que cresce é a geração
    st.gen = (t.gen ?? 0) / 100;
    st.hp = Math.min(st.hpMax, Math.max(1, Math.round(st.hpMax * keepHp))); st.mp = Math.min(st.mpMax, Math.round(st.mpMax * keepMp));
    const axe = tools.axe ? TOOLS[tools.axe].tier * 1.2 : 0; // sem arma, o machado de ofício ainda bate
    { const S = b('str'), eff = S <= 20 ? S : S <= 60 ? 20 + (S - 20) * 0.6 : 44 + (S - 60) * 0.3; st.atk = 1 + 0.02 * eff; } /* Força rende cada vez menos (retorno decrescente) */ st.dmgFlat = (t.dmg ?? 0) + (eqG.weapon ? 0 : axe);
    st.crit = Math.min(0.5, 0.12 + 0.004 * b('dex') + (t.crit ?? 0) / 100);
    st.move = 1 + (t.move ?? 0) / 100 + 0.003 * b('dex');
    const armor = (t.def ?? 0) + 0.6 * b('vit'); st.def = Math.min(0.7, armor / (armor + 70 + 8 * st.lvl));
    st.regen = 0.35 + (t.regen ?? 0) + 0.04 * b('vit');
    st.leech = (t.leech ?? 0) / 100; st.xpMul = 1 + (t.xp ?? 0) / 100 + (hooks.xpBonus?.() ?? 0); st.goldMul = 1 + (t.gold ?? 0) / 100 + (Object.values(eqG).some((g) => g?.special === 'u_andvari') ? 0.6 : 0);
    st.auras = SLOTS.map((sl) => eqG[sl]).filter((g): g is Gear => !!g?.aura).sort((a, b) => (b.rarity === 'relic' ? 1 : 0) - (a.rarity === 'relic' ? 1 : 0)).map((g) => g.aura!);
    st.sp = new Set(Object.values(eqG).map((g) => g?.special).filter(Boolean) as string[]);
    hooks.onGear?.();
  }
  const hitRange = () => { const lp = 0.05 * (st.lvl - 1), m = st.atk; /* mesma conta do combate: nível cheio no golpe base, metade no dano da arma */ return [Math.round((9 * (1 + lp) + st.dmgFlat * (1 + 0.5 * lp)) * m), Math.round((15 * (1 + lp) + st.dmgFlat * (1 + 0.5 * lp)) * m)]; };
  const power = () => { const [a, z] = hitRange(); return Math.round(((a + z) / 2) * (1 + st.crit * 0.8) * 4 + (st.hpMax / (1 - st.def)) * 0.5); };

  /** coloca a ferramenta no espaço dela; a que estava lá volta para a mochila */
  function equipTool(id: string, quiet = false) {
    const d = TOOLS[id]; if (!d) return false; const old = tools[d.slot];
    if ((bag[id] ?? 0) > 0) { bag[id]--; if (bag[id] <= 0) delete bag[id]; }
    tools[d.slot] = id; if (old) bag[old] = (bag[old] ?? 0) + 1;
    if (!quiet) game.logMsg(`${ITEMS[id].icon} ${ITEMS[id].name} no espaço de ${TOOL_SLOTS.find((s) => s.k === d.slot)!.lab.toLowerCase()} (${TIER_NAME[d.tier]})`, '#ffe08a');
    recalc(); render(); save(); return true;
  }
  function unequipTool(sl: ToolSlot) { const id = tools[sl]; if (!id) return; if (!canAdd(id, 1)) { game.logMsg('🎒 Mochila cheia.', '#ff9a8a'); return; } tools[sl] = null; bag[id] = (bag[id] ?? 0) + 1; recalc(); render(); save(); }
  function add(id: string, n = 1, quiet = false): boolean {
    if (isTool(id)) { const d = TOOLS[id], cur = tools[d.slot]; if (!cur || TOOLS[cur].tier < d.tier) { bag[id] = (bag[id] ?? 0) + 1; equipTool(id, quiet); if (n > 1) bag[id] = (bag[id] ?? 0) + n - 1; render(); save(); return true; } }
    if (BAGS[id]) { if (bags.length >= MAX_BAGS) { game.logMsg(`Você já usa ${MAX_BAGS} bolsas.`, '#ff9a8a'); return false; } bags.push(id); game.logMsg(`👝 ${ITEMS[id].name} equipada: +${BAGS[id]} espaços`, '#ffe08a'); render(); save(); return true; }
    if (!canAdd(id, n)) return false;
    bag[id] = (bag[id] ?? 0) + n; if (!quiet) game.logMsg(`+${n} ${ITEMS[id]?.icon ?? ''} ${ITEMS[id]?.name ?? id}`, '#e8dcc0'); recalc(); render(); save(); return true;
  }
  function addGear(g: Gear): boolean { if (!canAddGear()) return false; gearBag.push(g); game.logMsg(`${g.icon} ${g.name} (${RARITY[g.rarity].name})`, RARITY[g.rarity].col); render(); save(); return true; }
  function take(id: string, n = 1) { if (!has(id, n)) return false; bag[id] -= n; if (bag[id] <= 0) delete bag[id]; recalc(); render(); save(); return true; }
  function use(id: string) {
    const it = ITEMS[id]; if (!it || !has(id)) return;
    if (it.kind === 'food') { if (it.mp) { if (st.mp >= st.mpMax) { game.logMsg('Sua magia já está cheia.'); return; } take(id); st.mp = Math.min(st.mp + it.mp, st.mpMax); game.logMsg(`${it.icon} +${it.mp} magia`, '#9ad7ff'); potionPulse('mp'); } else { if (st.hp >= st.hpMax && !it.buff) { game.logMsg('Sua vida já está cheia.'); return; } take(id); st.hp = Math.min(st.hpMax, st.hp + (it.heal ?? 10)); game.logMsg(`${it.icon} +${it.heal} vida`, '#7aff9a'); if (/potion|tonic/.test(id)) potionPulse(it.buff ? 'buff' : 'hp'); } if (it.buff) game.drinkBuff?.(it.buff); }
    else if (isTool(id)) equipTool(id);
    else if (!hooks.onUse?.(id)) game.logMsg(it.desc);
  }
  /** preço na prateleira: peças de facção têm preço da Tecelagem Real */
  /** preço de compra: o comerciante cobra conforme a alma de quem compra (Luz e Sombra, 24/10) */
  const pk = () => (shop && hooks.priceK ? hooks.priceK(shop) : 1);
  const buyP = (i: string) => Math.max(1, Math.round(PRICES[i] * pk()));
  const shopPrice = (g: Gear) => Math.round((g.fac ? FAC_PRICE[g.slot as 'cape' | 'shield' | 'relic'] : Math.max(6, g.value * 3)) * pk());
  /** onde a peça entra: anéis e brincos têm dois espaços (o vazio primeiro) */
  const slotFor = (g: Gear): Slot => g.slot === 'ring' ? (!eqG.ring ? 'ring' : !eqG.ring2 ? 'ring2' : 'ring') : g.slot === 'earring' ? (!eqG.earring ? 'earring' : !eqG.earring2 ? 'earring2' : 'earring') : g.slot;
  function equip(uid: number) {
    const i = gearBag.findIndex((g) => g.uid === uid); if (i < 0) return;
    { const g0 = gearBag[i]; if (st.lvl < reqLvl(g0)) { game.logMsg(`Você precisa do nível ${reqLvl(g0)} para usar ${g0.name}.`, '#ff9a8a'); game.snd?.('error'); return; } { const why = hooks.canWear?.(g0); if (why) { game.logMsg(why, '#ff9a8a'); game.snd?.('error'); return; } } if (g0.fac && myFac() !== g0.fac) { game.logMsg(`⚑ Só quem jurou ${FAC[g0.fac].name} pode vestir este brasão. Os lados se escolhem no nível ${FAC_LVL}.`, '#ff9a8a'); game.snd?.('error'); return; } }
    const g = gearBag.splice(i, 1)[0], tg = slotFor(g), old = eqG[tg]; eqG[tg] = g; if (old) gearBag.push(old);
    if ((g.shop || g.fac) && !g.bound) { g.bound = true; game.logMsg(`🔒 ${g.name} agora está vinculado a você (não vai mais ao Leilão).`, '#b9c6e0'); }
    game.logMsg(`Equipou ${g.name}`, RARITY[g.rarity].col); recalc(); render(); save();
  }
  function unequip(slot: Slot) { const g = eqG[slot]; if (!g) return; eqG[slot] = null; gearBag.push(g); recalc(); render(); save(); }
  function craft(rid: string) {
    const r = RECIPES.find((x) => x.id === rid)!; if (!r.need.every(([i, n]) => has(i, n)) || !(r.keep ?? []).every((k) => has(k))) { game.logMsg('Faltam materiais.', '#ff9a8a'); return; }
    if (r.out === 'fire') { if (!hooks.placeFire()) return; for (const [i, n] of r.need) take(i, n); game.logMsg('🔥 Fogueira acesa!', '#ffb060'); close(); return; }
    for (const [i, n] of r.need) take(i, n); add(r.out, r.n); game.logMsg(`Você criou ${ITEMS[r.out].name}`, '#ffe08a'); hooks.onCraft?.(ITEMS[r.out].name);
  }
  function spend(k: Attr) { if (st.points <= 0) return; st.points--; st.attrs[k]++; recalc(); game.logMsg(`+1 ${ATTRS.find((a) => a.k === k)!.lab}`, '#ffe08a'); render(); save(); }

  const bar = (v: number, m: number, c: string) => `<div class="bar"><i style="width:${Math.max(0, Math.min(100, v / m * 100))}%;background:${c}"></i></div>`;
  // (resumo de status dos itens: hoje mostrado só no tooltip)
  const cell = (g: Gear, attrs: string) => { const bad = st.lvl < reqLvl(g) || (!!g.fac && myFac() !== g.fac); return `<div class="it gi ${bad ? 'noreq' : ''}" draggable="true" data-drag="g:${g.uid}" ${attrs} style="border-color:${RARITY[g.rarity].col};box-shadow:inset 0 0 10px ${bad ? '#c0202a66' : RARITY[g.rarity].col + '44'}"><span>${gearIcon(g)}</span><b style="color:${bad ? '#ff4a4a' : RARITY[g.rarity].col}" title="nível de uso">${reqLvl(g)}</b><small style="color:${RARITY[g.rarity].col}">${g.name}</small></div>`; };
  function render() {
    tipCtx.lvl = st.lvl; tipCtx.fac = myFac();
    tip.style.display = 'none'; hooks.onBag?.();
    if (open) {
      const order = ['relic', 'unique', 'epic', 'legendary', 'rare', 'magic', 'normal'];
      const sorted = [...gearBag].sort((a, b) => order.indexOf(a.rarity) - order.indexOf(b.rarity) || b.ilvl - a.ilvl);
      // células: equipamentos primeiro, depois pilhas de até 20
      const sp = (id: string) => Math.round((ITEMS[id]?.sell ?? 0) * (shop && SHOPDEF[shop]?.buys?.[id] ? SHOPDEF[shop].buys![id] : 1));
      const tag = (v: number) => shop && v > 0 ? `<i class="ptag">🪙${v}</i>` : '';
      const cells: string[] = sorted.map((g) => cell(g, `data-g="b:${g.uid}" data-eq="${g.uid}"`).replace('</div>', `${tag(g.value)}</div>`));
      for (const i of Object.keys(bag).filter((k) => bag[k] > 0 && !freeBag(k)).sort((a, b) => (ITEMS[a]?.kind ?? '').localeCompare(ITEMS[b]?.kind ?? '') || a.localeCompare(b))) { let left = bag[i]; while (left > 0) { const n = Math.min(STACK, left); left -= n; cells.push(`<div class="it ${ITEMS[i]?.kind ?? ''}" draggable="true" data-drag="i:${i}:${n}" data-use="${i}" title="${ITEMS[i]?.name}: ${ITEMS[i]?.desc}${shop ? (sp(i) > 0 ? ` — vende por ${sp(i)} cada (clique: 1 · Ctrl: 50 · Shift: tudo)` : ' — este comerciante não compra') : ''}"><span>${ITEMS[i]?.icon}</span><b>${n}</b><small>${ITEMS[i]?.name}</small>${tag(sp(i))}</div>`); } }
      const sec = (key: string, head: string, count: string, body: string, extra = '') => `<section class="acc ${accClosed.has(key) ? 'closed' : ''} ${extra}"><h3 data-acct="${key}"><i class="car">▾</i>${head}<small>${count}</small></h3><div class="accb">${body}</div></section>`;
      const special = (title: string, ic: string, set: Set<string>, hint: string, cap = 0) => { const ids = [...set].filter((k) => (bag[k] ?? 0) > 0); return sec(title, `${ic} ${title}`, `${stacksIn(set)}/${cap} espaços`, `<div class="grid g6 sc" title="${hint}">${ids.map((i) => `<div class="it ${ITEMS[i]?.kind ?? ''}" draggable="true" data-drag="i:${i}:${bag[i]}" data-use="${i}" title="${ITEMS[i]?.name}: ${ITEMS[i]?.desc}${shop ? (sp(i) > 0 ? ` — vende por ${sp(i)} cada (clique: 1 · Ctrl: 50 · Shift: tudo)` : ' — este comerciante não compra') : ''}"><span>${ITEMS[i]?.icon}</span><b>${bag[i]}</b><small>${ITEMS[i]?.name}</small>${tag(sp(i))}</div>`).join('') || '<em class="emptyb">vazia</em>'}</div>`, 'spec'); };
      const cap = capacity(), used = cells.length;
      const groups: { name: string; n: number }[] = [{ name: 'Mochila', n: 16 }, ...(isPremium() ? [{ name: '✦ Bolsa do Caminhante (Premium)', n: GIFT_BAG }] : []), ...bags.filter((b) => !PREMIUM_BAGS.has(b) || isPremium()).map((b) => ({ name: ITEMS[b].name, n: BAGS[b] }))];
      let k = 0;
      const bagsHtml = groups.map((gp, gi) => { const mine = cells.slice(k, k + gp.n); k += gp.n; const empties = Array.from({ length: gp.n - mine.length }, () => '<div class="it empty"></div>').join(''); return sec(`b${gi}`, gp.name, `${mine.length}/${gp.n}`, `<div class="grid g6 sc">${mine.join('')}${empties}</div>`); }).join('');
      el.innerHTML = `<div class="pn bagpn"><h2>Mochila <span class="cap ${used >= cap ? 'full' : ''}">${used}/${cap} espaços · 🪙 ${st.gold}${shop ? '<button class="sellall" data-sellall2 title="Vende todos os recursos e tralhas (poções, comida, ferramentas e equipamentos ficam)">💰 vender tralha</button>' : ''}<span class="trash" data-trash title="Arraste um item para cá (ou para fora das janelas) para destruí-lo">🗑 destruir</span></span><button data-x>✕</button></h2>
        <div class="bagsx">${bagsHtml}${isPremium() ? special('Bolsa de Ofício', '🧰', CRAFT_BAG, `pedra, madeira, couro e material de construção — ${CRAFT_CAP} espaços (Premium); o que passar vai para a mochila`, CRAFT_CAP) + special('Bolsa Mágica', '🔮', MAGIC_BAG, `reagentes, tomos, selos e pergaminhos — ${MAGIC_CAP} espaços (Premium); o que passar vai para a mochila`, MAGIC_CAP) : ''}
        <button class="profgo" data-profgo>⚒ Criar e ofícios ficam em <b>Profissões</b> (Y)</button></div>
        <small class="ft">${bags.length < MAX_BAGS ? `${MAX_BAGS - bags.length} de ${MAX_BAGS} lugares para bolsas livres · ` : ''}clique no título da bolsa: abrir/fechar · arraste: equipar, vender, 🗑 destruir</small></div>`;
      el.style.display = 'flex';
    } else el.style.display = 'none';
    if (charOpen) {
      const t = total(), [lo, hi] = hitRange();
      /* boneco com espaços pequenos em volta; uma linha leve, quase etérea, liga cada espaço ao lugar do corpo onde a peça vai */
      const W = 620, H = 380, DX = 215, DY = 10, DW = 190, DH = 290;
      const POS: Record<Slot, [number, number, number, number]> = { // [x, y do espaço, alvo x, alvo y no boneco (0–1)]
        helm: [60, 34, 0.5, 0.11], earring: [60, 92, 0.42, 0.16], amulet: [60, 150, 0.5, 0.24], shoulders: [60, 208, 0.31, 0.29], armor: [60, 266, 0.5, 0.38], weapon: [60, 324, 0.22, 0.56],
        cape: [560, 34, 0.68, 0.3], earring2: [560, 92, 0.58, 0.16], shield: [560, 150, 0.78, 0.52], ring: [560, 208, 0.75, 0.6], ring2: [560, 266, 0.25, 0.61], boots: [560, 324, 0.56, 0.95], relic: [310, 346, 0.5, 0.45] };
      const lines = SLOTS.map((s) => { const [x, y, fx, fy] = POS[s], g = eqG[s], tx = DX + fx * DW, ty = DY + fy * DH, sx = s === 'relic' ? x : x < W / 2 ? x + 25 : x - 25, sy = s === 'relic' ? y - 25 : y, col = g ? RARITY[g.rarity].col : '#e8d6a0';
        const mx = s === 'relic' ? sx : (sx + tx) / 2; return `<path d="M${sx} ${sy} C${mx} ${s === 'relic' ? (sy + ty) / 2 : sy} ${mx} ${s === 'relic' ? (sy + ty) / 2 : ty} ${tx} ${ty}" stroke="${col}" stroke-opacity="${g ? 0.42 : 0.14}" stroke-width="${g ? 1.2 : 0.8}" fill="none" ${g ? '' : 'stroke-dasharray="2 4"'}/><circle cx="${tx}" cy="${ty}" r="${g ? 2.6 : 1.8}" fill="${col}" fill-opacity="${g ? 0.75 : 0.25}" filter="url(#eqglow)"/>`; }).join('');
      const slot = (s: Slot) => { const g = eqG[s], [x, y] = POS[s]; return `<div class="eqs ${g ? 'on' : ''} ${s}" style="left:${x - 24}px;top:${y - 24}px;${g ? `--rc:${RARITY[g.rarity].col}` : ''}" ${g ? `draggable="true" data-drag="e:${s}" data-g="e:${s}" data-un="${s}"` : `title="${RSLOT[s]} — vazio. Arraste uma peça para cá."`}>${gearIcon(g, s)}<small>${RSLOT[s]}</small></div>`; };
      const row = (l: string, v: string) => `<div class="stt"><span>${l}</span><b>${v}</b></div>`;
      const pic = hooks.portrait?.() ?? null;
      ch.innerHTML = `<div class="pn charpn"><h2>${hooks.title?.() || hooks.raceLabel()} <span class="lv">Nível ${st.lvl}</span><button data-x>✕</button></h2>
        <div class="paper2" style="width:${W}px;height:${H}px"><svg class="eqlines" width="${W}" height="${H}"><defs><filter id="eqglow"><feGaussianBlur stdDeviation="1.6"/></filter></defs>${lines}</svg>
          <div class="doll" style="position:absolute;left:${DX}px;top:${DY}px;width:${DW}px;height:${DH}px">${pic ? `<img src="${pic}" alt="">` : ''}<div class="pw">⚔ Poder ${power()}</div></div>
          ${SLOTS.map(slot).join('')}
          <button class="helmtog ${localStorage.getItem('karmika.showHelm') === '0' ? 'off' : ''}" data-helm style="left:${POS.helm[0] + 30}px;top:${POS.helm[1] - 22}px" title="Mostrar ou esconder o elmo no personagem (o rosto fica à mostra; os atributos continuam valendo)">${localStorage.getItem('karmika.showHelm') === '0' ? '🙈' : '👁'}</button>
        </div>
        <div class="tools"><h3>Ferramentas de ofício</h3><div class="trow">${TOOL_SLOTS.map((s) => { const id = tools[s.k], d = id ? TOOLS[id] : null; return `<div class="tl t${d?.tier ?? 0} ${id ? '' : 'empty'}" ${id ? `data-tun="${s.k}" title="${ITEMS[id].name}: ${ITEMS[id].desc} (clique: guardar na mochila)"` : `title="${s.lab} — ${s.job}. Arraste uma ferramenta para cá."`}><span class="ic">${id ? ITEMS[id].icon : s.icon}</span><small>${id ? ITEMS[id].name : s.lab}</small>${d ? `<b>${'★'.repeat(d.tier)}</b>` : '<em>vazio</em>'}</div>`; }).join('')}</div></div>
        <div class="cols">
          <div class="col"><h3>Atributos <span class="pts ${st.points ? 'on' : ''}">${st.points} ponto${st.points === 1 ? '' : 's'}</span></h3>
          ${ATTRS.map((a) => `<div class="at" title="${a.tip}"><span>${a.lab}</span><b>${st.attrs[a.k]}${t[a.k] ? ` <i>+${Math.round(t[a.k]!)}</i>` : ''}</b>${st.points > 0 ? `<button data-pt="${a.k}">+</button>` : '<button disabled>+</button>'}</div>`).join('')}
          ${bar(st.xp, hooks.xpNeed(), '#3a7ac0')}<small>XP ${st.xp}/${hooks.xpNeed()} · ${st.kills} abates</small>${hooks.soul ? `<h3 class="soulh">Alma</h3>${hooks.soul().map(([a, b]) => `<div class="stt soulr"><span>${a}</span><b>${b}</b></div>`).join('')}` : ''}</div>
          <div class="col"><h3>Combate</h3>
          ${row('Vida', `${Math.round(st.hp)}/${st.hpMax}`)}${row(st.res?.name ?? 'Magia', `${Math.round(st.mp)}/${st.mpMax}`)}${st.gen ? row(`Geração de ${st.res?.name ?? 'magia'}`, `+${Math.round(st.gen * 100)}%`) : ''}${row('Dano por golpe', `${lo}–${hi}`)}${row('Crítico', `${Math.round(st.crit * 100)}%`)}${row('Defesa', `${Math.round(st.def * 100)}%`)}${row('Velocidade', `+${Math.round((st.move - 1) * 100)}%`)}${row('Regeneração', `${st.regen.toFixed(1)}/s`)}${st.leech ? row('Roubo de vida', `${(st.leech * 100).toFixed(1)}%`) : ''}${st.xpMul > 1 ? row('XP', `+${Math.round((st.xpMul - 1) * 100)}%`) : ''}${st.goldMul > 1 ? row('Ouro', `+${Math.round((st.goldMul - 1) * 100)}%`) : ''}
          ${row('Karma', String(Math.round(hooks.karma())))}${row('Ouro', `🪙 ${st.gold}`)}</div>
        </div><small class="ft">C: fechar · I: mochila · arraste da mochila para o boneco para equipar · clique ou arraste para a mochila para desequipar</small></div>`;
      ch.style.display = 'flex';
    } else ch.style.display = 'none';
    if (shop) {
      const price = shopPrice;
      const sd = SHOPDEF[shop] ?? { title: shop, items: [] };
      const shelf = [...(sd.gear || sd.fac ? stock.map((g) => `<div class="it gi shelf ${st.gold >= price(g) ? '' : 'poor'}" data-gbuy="${g.uid}" data-g="s:${g.uid}" style="border-color:${RARITY[g.rarity].col};box-shadow:inset 0 0 10px ${RARITY[g.rarity].col}44"><span>${gearIcon(g)}</span><b style="color:${RARITY[g.rarity].col}">${g.ilvl}</b><small style="color:${RARITY[g.rarity].col}">${g.name}</small><i class="ptag">🪙${price(g)}</i></div>`) : []),
        ...SHOPS[shop].map((i) => `<div class="it shelf ${st.gold >= buyP(i) ? '' : 'poor'}" data-buy="${i}" title="${ITEMS[i].name}: ${ITEMS[i].desc}"><span>${ITEMS[i].icon}</span><small>${ITEMS[i].name}</small><i class="ptag">🪙${buyP(i)}</i></div>`)];
      sh.innerHTML = `<div class="pn shoppn"><h2>${shopTitle ?? sd.title} <span class="gold">🪙 ${st.gold}</span><button data-x2>✕</button></h2>${sd.note ? `<small class="note">${sd.note}</small>` : ''}
        <h3>Prateleira</h3><div class="grid g5">${shelf.join('')}</div>
        <small class="ft">clique na prateleira: comprar · clique na sua mochila: vender (Ctrl: 50 · Shift: tudo) · arraste da mochila para cá: vender</small></div>`;
      sh.style.display = 'flex';
    } else sh.style.display = 'none';
    if (vaultOpen) {
      const vc: string[] = [...vault.gear].map((g) => cell(g, `data-g="v:${g.uid}" data-vout="vg:${g.uid}"`));
      for (const i of Object.keys(vault.items).sort((a, b) => (ITEMS[a]?.kind ?? '').localeCompare(ITEMS[b]?.kind ?? '') || a.localeCompare(b))) { let left = vault.items[i]; while (left > 0) { const n = Math.min(STACK, left); left -= n; vc.push(`<div class="it ${ITEMS[i]?.kind ?? ''}" data-vout="vi:${i}" title="${ITEMS[i]?.name ?? i}: ${ITEMS[i]?.desc ?? ''}"><span>${ITEMS[i]?.icon ?? '•'}</span><b>${n}</b><small>${ITEMS[i]?.name ?? i}</small></div>`); } }
      const cap = vaultCap(), used = vaultUsed(), empt = Math.max(0, cap - vc.length);
      vt.innerHTML = `<div class="pn shoppn vaultpn"><h2>📦 Baú do Caminhante <span class="cap ${used >= cap ? 'full' : ''}">${used}/${cap}</span><button data-vx>✕</button></h2>
        <small class="note">O mesmo baú em toda vila e cidade de Karmika: o que você guarda aqui, retira em qualquer outro lugar.${isPremium() ? ' ✦ Premium: +' + VAULT_PREM + ' espaços.' : ` Premium: +${VAULT_PREM} espaços.`}</small>
        <div class="vbtns"><button data-vres>⇣ Guardar recursos</button><button data-vgear>⇣ Guardar equipamentos</button></div>
        <div class="grid g6 sc vgrid">${vc.join('')}${'<div class="it empty"></div>'.repeat(Math.min(empt, Math.max(12, 36 - vc.length)))}</div>
        <small class="ft">clique na mochila: guardar (Ctrl: só 1) · clique no baú: retirar</small></div>`;
      vt.style.display = 'flex';
    } else vt.style.display = 'none';
  }

  /* tooltip de equipamento com comparação ao item equipado no mesmo espaço */
  const findG = (ref: string): Gear | undefined => { const [k, v] = ref.split(':'); return k === 'b' ? gearBag.find((g) => g.uid === +v) : k === 'e' ? eqG[v as Slot] ?? undefined : k === 'v' ? vault.gear.find((g) => g.uid === +v) : stock.find((g) => g.uid === +v); };
  function cmp(g: Gear, equipped: boolean) {
    const o = equipped ? null : eqG[g.slot]; if (!o) return equipped ? '' : '<hr><small>Nada equipado nesse espaço</small>';
    const keys = new Set([...Object.keys(g.stats), ...Object.keys(o.stats)]) as Set<StatKey>;
    const lines = [...keys].map((k) => { const d = (g.stats[k] ?? 0) - (o.stats[k] ?? 0); if (Math.abs(d) < 0.05) return ''; const up = d > 0; return `<span style="color:${up ? '#7aff9a' : '#ff8a7a'}">${up ? '▲' : '▼'} ${STAT_LABEL[k]} ${up ? '+' : ''}${Math.abs(d) < 10 ? d.toFixed(1) : Math.round(d)}</span>`; }).filter(Boolean);
    return `<hr><small>Comparado a <b style="color:${RARITY[o.rarity].col}">${o.name}</b>:</small><br>${lines.join('<br>') || '<small>igual</small>'}`;
  }
  const tip2 = document.createElement('div'); tip2.id = 'tip2'; document.body.appendChild(tip2); let lastTipEv: MouseEvent | null = null, lastTipT: HTMLElement | null = null;
  const showTip = (e: MouseEvent) => { tipCtx.lvl = st.lvl; tipCtx.fac = myFac();
    const t = (e.target as HTMLElement).closest('[data-g]') as HTMLElement | null;
    if (!t) { tip.style.display = 'none'; tip2.style.display = 'none'; lastTipEv = null; return; }
    const g = findG(t.dataset.g!); if (!g) { tip.style.display = 'none'; return; }
    const isEq = t.dataset.g!.startsWith('e:'), other = isEq ? null : eqG[g.slot];
    tip.innerHTML = gearTip(g) + (e.shiftKey && other ? cmp(g, false) : !isEq ? `<hr><small style="color:#a89878">${other ? 'Shift: comparar com o equipado' : 'Nada equipado nesse espaço'}</small>` : ''); tip.style.display = 'block'; tip.style.borderColor = RARITY[g.rarity].col;
    const w = tip.offsetWidth, h = tip.offsetHeight; let x = Math.min(innerWidth - w - 8, e.clientX + 16); const y = Math.max(8, Math.min(innerHeight - h - 8, e.clientY + 12));
    if (e.shiftKey && other) { tip2.innerHTML = `<span class="eqh">Equipado</span>` + gearTip(other); tip2.style.display = 'block'; tip2.style.borderColor = RARITY[other.rarity].col; const w2 = tip2.offsetWidth; if (x + w + w2 + 8 > innerWidth) x = Math.max(8, e.clientX - 16 - w - w2 - 6); tip2.style.left = x + w + 6 + 'px'; tip2.style.top = y + 'px'; } else tip2.style.display = 'none';
    tip.style.left = x + 'px'; tip.style.top = y + 'px'; lastTipEv = e; lastTipT = t;
  };
  ch.addEventListener('click', (e) => { if (!(e.target as HTMLElement).closest('[data-helm]')) return; e.stopPropagation(); const show = localStorage.getItem('karmika.showHelm') === '0'; localStorage.setItem('karmika.showHelm', show ? '1' : '0'); game.logMsg(show ? '⛑ Elmo à mostra.' : '⛑ Elmo escondido: o rosto fica sempre à mostra (os atributos continuam valendo).', '#b9c6e0'); hooks.onGear?.(); render(); });
  el.addEventListener('mousemove', showTip); sh.addEventListener('mousemove', showTip); ch.addEventListener('mousemove', showTip);
  for (const kk of ['keydown', 'keyup'] as const) addEventListener(kk, (ev) => { if (ev.key === 'Shift' && lastTipEv && lastTipT && lastTipT.isConnected && tip.style.display === 'block') lastTipT.dispatchEvent(new MouseEvent('mousemove', { clientX: lastTipEv.clientX, clientY: lastTipEv.clientY, shiftKey: kk === 'keydown', bubbles: true })); });
  el.addEventListener('mouseleave', () => { tip.style.display = 'none'; tip2.style.display = 'none'; }); sh.addEventListener('mouseleave', () => { tip.style.display = 'none'; }); ch.addEventListener('mouseleave', () => { tip.style.display = 'none'; });

  const onPanelClick = (e: MouseEvent) => {
    const t = (e.target as HTMLElement).closest('[data-use],[data-cr],[data-un],[data-x],[data-eq],[data-pt],[data-tun]') as HTMLElement | null; if (!t) return;
    if (t.dataset.tun) { unequipTool(t.dataset.tun as ToolSlot); return; }
    if (vaultOpen && el.contains(t) && (t.dataset.use || t.dataset.eq)) { // baú aberto: clicar na mochila guarda
      if (t.dataset.eq) deposit(`g:${t.dataset.eq}`); else { const id = t.dataset.use!, drag = (t.dataset.drag ?? '').split(':'), n = e.ctrlKey ? 1 : +(drag[2] || bag[id] || 1); deposit(`i:${id}:${n}`); }
      return;
    }
    if (shop && el.contains(t) && (t.dataset.use || t.dataset.eq)) { // loja aberta: clicar na mochila vende
      if (t.dataset.eq) sellRef(`g:${t.dataset.eq}`); else { const id = t.dataset.use!; const n = e.shiftKey ? (bag[id] ?? 0) : e.ctrlKey ? Math.min(50, bag[id] ?? 0) : 1; sellRef(`i:${id}:${n}`); }
      return;
    }
        if ('x' in t.dataset) { if (ch.contains(t)) charOpen = false; else open = false; render(); } else if (t.dataset.pt) spend(t.dataset.pt as Attr); else if (t.dataset.eq) equip(+t.dataset.eq); else if (t.dataset.use) use(t.dataset.use); else if (t.dataset.cr) craft(t.dataset.cr); else if (t.dataset.un) unequip(t.dataset.un as Slot);
  };
  el.addEventListener('click', (e) => { const acc = (e.target as HTMLElement).closest('[data-acct]') as HTMLElement | null; if (acc) { const k2 = acc.dataset.acct!; if (accClosed.has(k2)) accClosed.delete(k2); else accClosed.add(k2); try { localStorage.setItem('karmika.acc', JSON.stringify([...accClosed])); } catch { /* */ } render(); return; } if ((e.target as HTMLElement).closest('[data-sellall2]')) { sellJunk(); return; } onPanelClick(e); }); ch.addEventListener('click', onPanelClick);
  function sellJunk() { const ids = Object.keys(bag).filter((i) => (ITEMS[i]?.sell ?? 0) > 0 && !BAGS[i] && (ITEMS[i].kind === 'res' || (ITEMS[i].kind === 'misc' && !ITEMS[i].tier))); let tot = 0, cnt = 0; for (const i of ids) { const n = bag[i] ?? 0; const pr = Math.round((ITEMS[i].sell ?? 0) * (shop && SHOPDEF[shop]?.buys?.[i] ? SHOPDEF[shop].buys![i] : 1)); if (n > 0 && take(i, n)) { tot += pr * n; cnt += n; } } if (cnt) { st.gold += tot; game.logMsg(`💰 Vendeu tudo: ${cnt} itens por ${tot} 🪙 (total ${st.gold}).`, '#ffd24a'); game.snd?.('coins'); render(); save(); } }
  vt.addEventListener('mousemove', showTip); vt.addEventListener('mouseleave', () => { tip.style.display = 'none'; });
  vt.addEventListener('click', (e) => { const t = e.target as HTMLElement;
    if (t.closest('[data-vx]')) { vaultOpen = false; render(); return; }
    if (t.closest('[data-vres]')) { let n = 0; for (const id of Object.keys(bag)) if (ITEMS[id]?.kind === 'res' && deposit(`i:${id}:${bag[id]}`, true)) n++; render(); save(); game.logMsg(n ? `📦 ${n} tipo${n > 1 ? 's' : ''} de recurso guardado${n > 1 ? 's' : ''} no baú.` : 'Nada de recurso para guardar.', '#ffe08a'); return; }
    if (t.closest('[data-vgear]')) { let n = 0; for (const g of [...gearBag]) if (deposit(`g:${g.uid}`, true)) n++; render(); save(); game.logMsg(n ? `📦 ${n} equipamento${n > 1 ? 's' : ''} guardado${n > 1 ? 's' : ''} no baú.` : 'Nenhum equipamento na mochila.', '#ffe08a'); return; }
    const o = (t.closest('[data-vout]') as HTMLElement | null)?.dataset.vout; if (o) withdraw(o); });
  sh.addEventListener('click', (e) => {
    const t = (e.target as HTMLElement).closest('[data-buy],[data-sell],[data-x2],[data-gbuy],[data-gsell]') as HTMLElement | null; if (!t) return;
    if ('x2' in t.dataset) { shop = null; render(); return; }
    if (t.dataset.buy) { const i = t.dataset.buy; if (PREMIUM_BAGS.has(i) && !isPremium()) { game.logMsg(`✦ ${ITEMS[i].name} é exclusivo do Premium.`, '#c9a0ff'); game.snd?.('error'); return; } if (st.gold < buyP(i)) { game.logMsg(`Ouro insuficiente: ${ITEMS[i].name} custa ${buyP(i)} 🪙 e você tem ${st.gold}.`, '#ff9a8a'); game.snd?.('error'); return; } if (!BAGS[i] && !canAdd(i, 1)) { game.logMsg('🎒 Mochila cheia! Venda ou use algo antes, ou compre uma bolsa maior.', '#ff9a8a'); game.snd?.('error'); return; } st.gold -= buyP(i); add(i, 1, true); game.logMsg(`🛒 Comprou ${ITEMS[i].icon} ${ITEMS[i].name} por ${buyP(i)} 🪙 (restam ${st.gold}).`, '#ffd24a'); game.snd?.('coins'); }
    const priceOf = (i: string) => Math.round((ITEMS[i].sell ?? 0) * (shop && SHOPDEF[shop]?.buys?.[i] ? SHOPDEF[shop].buys![i] : 1));
    if (t.dataset.sell) { const i = t.dataset.sell; const n = e.shiftKey ? (bag[i] ?? 0) : e.ctrlKey ? Math.min(50, bag[i] ?? 0) : 1; const pr = priceOf(i); if (n > 0 && take(i, n)) { st.gold += pr * n; game.logMsg(`💰 Vendeu ${n}× ${ITEMS[i].icon} ${ITEMS[i].name} por ${pr * n} 🪙 (total ${st.gold}).`, '#ffd24a'); game.snd?.('coins'); render(); save(); } }
    if (t.closest('[data-sellall]')) { const ids = Object.keys(bag).filter((i) => (ITEMS[i]?.sell ?? 0) > 0 && !BAGS[i] && (ITEMS[i].kind === 'res' || (ITEMS[i].kind === 'misc' && !ITEMS[i].tier))); /* recursos e tralha; poções, comida, ferramentas, pets e montarias ficam */ let tot = 0, cnt = 0; for (const i of ids) { const n = bag[i] ?? 0; const pr = priceOf(i); if (n > 0 && take(i, n)) { tot += pr * n; cnt += n; } } if (cnt) { st.gold += tot; game.logMsg(`💰 Vendeu tudo: ${cnt} itens por ${tot} 🪙 (total ${st.gold}).`, '#ffd24a'); game.snd?.('coins'); render(); save(); } }
    if (t.dataset.gbuy) { const g = stock.find((x) => x.uid === +t.dataset.gbuy!); if (!g) return; const p = shopPrice(g); if (st.gold < p) { game.logMsg(`Ouro insuficiente: ${g.name} custa ${p} 🪙 e você tem ${st.gold}.`, '#ff9a8a'); game.snd?.('error'); return; } if (!canAddGear()) { game.logMsg('🎒 Sem espaço para equipamentos na mochila.', '#ff9a8a'); game.snd?.('error'); return; } st.gold -= p; stock = stock.filter((x) => x !== g); addGear(g); game.logMsg(`🛒 Comprou ${g.icon} ${g.name} por ${p} 🪙 (restam ${st.gold}).`, '#ffd24a'); game.snd?.('coins'); }
    if (t.dataset.gsell) { const i = gearBag.findIndex((x) => x.uid === +t.dataset.gsell!); if (i < 0) return; const g = gearBag.splice(i, 1)[0]; st.gold += g.value; game.logMsg(`💰 Vendeu ${g.icon} ${g.name} por ${g.value} 🪙 (total ${st.gold}).`, '#ffd24a'); game.snd?.('coins'); render(); save(); }
  });
  /* arrastar e soltar: mochila → boneco (equipa), boneco → mochila (desequipa), qualquer um → loja (vende),
     → lixeira ou para fora das janelas (destrói, com confirmação) */
  let dragRef: string | null = null, dropped = false;
  const nameOf = (ref: string) => { const [k, a, b] = ref.split(':'); if (k === 'g') { const g = gearBag.find((x) => x.uid === +a); return g ? `${g.icon} ${g.name}` : ''; } if (k === 'e') { const g = eqG[a as Slot]; return g ? `${g.icon} ${g.name}` : ''; } return `${b}× ${ITEMS[a]?.icon ?? ''} ${ITEMS[a]?.name ?? a}`; };
  function destroy(ref: string) {
    const nm = nameOf(ref); if (!nm) return;
    confirmBox(`Destruir <b>${nm}</b>?<br><small>Não dá para desfazer.</small>`, '🗑 Destruir', () => {
      const [k, a, b] = ref.split(':');
      if (k === 'g') { const i = gearBag.findIndex((x) => x.uid === +a); if (i >= 0) gearBag.splice(i, 1); }
      else if (k === 'e') { eqG[a as Slot] = null; recalc(); }
      else { bag[a] = Math.max(0, (bag[a] ?? 0) - (+b || 0)); if (bag[a] <= 0) delete bag[a]; recalc(); }
      game.logMsg(`🗑 Destruiu ${nm}`, '#d0907a'); game.snd?.('click'); render(); save();
    });
  }
  function sellRef(ref: string) {
    const [k, a, b] = ref.split(':');
    if (k === 'g') { const i = gearBag.findIndex((x) => x.uid === +a); if (i < 0) return; const g = gearBag.splice(i, 1)[0]; st.gold += g.value; game.logMsg(`💰 Vendeu ${g.icon} ${g.name} por ${g.value} 🪙 (total ${st.gold}).`, '#ffd24a'); }
    else if (k === 'i') { const pr = Math.round((ITEMS[a]?.sell ?? 0) * (shop && SHOPDEF[shop]?.buys?.[a] ? SHOPDEF[shop].buys![a] : 1)); if (pr <= 0) { game.logMsg('Ninguém compra isso aqui.', '#ff9a8a'); return; } const n = Math.min(+b || 1, bag[a] ?? 0); if (!take(a, n)) return; st.gold += pr * n; game.logMsg(`💰 Vendeu ${n}× ${ITEMS[a].icon} ${ITEMS[a].name} por ${pr * n} 🪙 (total ${st.gold}).`, '#ffd24a'); }
    else return;
    game.snd?.('coins'); render(); save();
  }
  for (const box of [el, ch]) box.addEventListener('dragstart', (e) => { const t = (e.target as HTMLElement).closest('[data-drag]') as HTMLElement | null; if (!t) return; dragRef = t.dataset.drag!; dropped = false; e.dataTransfer?.setData('text/plain', dragRef); if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'; t.classList.add('dragging'); tip.style.display = 'none'; });
  const targetOf = (e: DragEvent): string | null => { const t = e.target as HTMLElement; if (t.closest('[data-trash]')) return 'trash'; if (t.closest('#quick')) return 'quick'; if (sh.contains(t) && shop) return 'shop'; if (ch.contains(t) && charOpen) return 'char'; if (el.contains(t) && open) return 'bag'; if (t.closest('.pn,#bar,#chat,#dlg')) return null; return 'out'; };
  const okFor = (tg: string | null, ref: string) => (tg === 'quick' && ref.startsWith('i:') && !isTool(ref.split(':')[1])) || tg === 'trash' || tg === 'out' || (tg === 'char' && (ref.startsWith('g:') || (ref.startsWith('i:') && isTool(ref.split(':')[1])))) || (tg === 'bag' && ref.startsWith('e:')) || (tg === 'shop' && !ref.startsWith('e:'));
  addEventListener('dragover', (e) => { if (!dragRef) return; const tg = targetOf(e); if (okFor(tg, dragRef)) { e.preventDefault(); if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'; } document.querySelectorAll('.dropok').forEach((x) => x.classList.remove('dropok')); const hl = tg === 'trash' ? (e.target as HTMLElement).closest('[data-trash]') : tg === 'char' ? ch.querySelector('.pn') : tg === 'bag' ? el.querySelector('.pn') : tg === 'shop' ? sh.querySelector('.pn') : tg === 'quick' ? ((e.target as HTMLElement).closest('.slot.q') ?? document.getElementById('quick')) : null; if (hl && okFor(tg, dragRef)) hl.classList.add('dropok'); });
  addEventListener('drop', (e) => { if (!dragRef) return; e.preventDefault(); const tg = targetOf(e), ref = dragRef; dropped = true; dragRef = null; document.querySelectorAll('.dropok').forEach((x) => x.classList.remove('dropok'));
    if (!okFor(tg, ref)) return;
    if (tg === 'quick') { const sl = (e.target as HTMLElement).closest('[data-qs]') as HTMLElement | null; dispatchEvent(new CustomEvent('karmika:quickpin', { detail: { id: ref.split(':')[1], slot: sl ? +sl.dataset.qs! : -1 } })); return; }
    if (tg === 'char') { if (ref.startsWith('i:')) equipTool(ref.split(':')[1]); else equip(+ref.split(':')[1]); } else if (tg === 'bag') unequip(ref.split(':')[1] as Slot); else if (tg === 'shop') sellRef(ref); else destroy(ref); });
  addEventListener('dragend', () => { dragRef = null; void dropped; document.querySelectorAll('.dragging,.dropok').forEach((x) => x.classList.remove('dragging', 'dropok')); });
  function close() { open = false; charOpen = false; render(); }

  const SAVE = 'karmika.save.v2', OLD = 'karmika.save.v1';
  function save() { try { localStorage.setItem(SAVE, JSON.stringify({ bag, bags, tools, gear: gearBag, eqG, attrs: st.attrs, points: st.points, gold: st.gold, lvl: st.lvl, xp: st.xp, kills: st.kills })); } catch { /* sem storage */ } }
  function load() {
    try {
      let s = JSON.parse(localStorage.getItem(SAVE) || 'null'); const old = !s; if (!s) s = JSON.parse(localStorage.getItem(OLD) || 'null'); if (!s) return;
      for (const k of Object.keys(bag)) delete bag[k]; Object.assign(bag, s.bag);
      gearBag = (s.gear ?? []) as Gear[]; for (const sl of SLOTS) eqG[sl] = s.eqG?.[sl] ?? null; bags.length = 0; for (const b of (s.bags ?? []) as string[]) if (BAGS[b]) bags.push(b);
      if (old) { // migra equipamentos antigos
        const conv = (id: string) => { const l = LEGACY[id]; return l ? plainGear(l.slot, l.base, l.icon, l.stats) : null; };
        for (const id of Object.keys(bag)) if (LEGACY[id]) { for (let i = 0; i < bag[id]; i++) gearBag.push(conv(id)!); delete bag[id]; }
        for (const id of Object.values(s.eq ?? {}) as (string | null)[]) if (id && LEGACY[id]) { const g = conv(id)!; if (!eqG[g.slot]) eqG[g.slot] = g; else gearBag.push(g); }
      }
      for (const sl of Object.keys(tools) as ToolSlot[]) tools[sl] = s.tools?.[sl] && TOOLS[s.tools[sl]] ? s.tools[sl] : null;
      let mx = 0; for (const g of [...gearBag, ...Object.values(eqG), ...vault.gear]) if (g) mx = Math.max(mx, g.uid); syncUid(mx);
      st.attrs = { str: 0, dex: 0, vit: 0, int: 0, ...(s.attrs ?? {}) }; st.points = s.points ?? 0;
      Object.assign(st, { gold: s.gold ?? 0, lvl: s.lvl ?? 1, xp: s.xp ?? 0, kills: s.kills ?? 0 });
      // personagens antigos ganham os pontos de atributo dos níveis já conquistados
      if (old) st.points = (st.lvl - 1) * 3;
    } catch { /* save inválido */ }
  }
  load();
  // ferramentas que ainda estão soltas na mochila (saves antigos) vão para os seus espaços; ninguém sai sem uma faca no cinto
  for (const id of Object.keys(bag)) if (isTool(id)) { const d = TOOLS[id], cur = tools[d.slot]; if (!cur || TOOLS[cur].tier < d.tier) equipTool(id, true); }
  if (!tools.knife) tools.knife = 'knife_f';
  st.recalc = recalc; st.hpMax = 0; st.mpMax = 0; recalc(); st.hp = st.hpMax; st.mp = st.mpMax; render();
  return {
    bag, eq: eqG, gearBag, tools, equipTool, unequip,
    /** a ferramenta no espaço (ou null): id e números */
    tool(sl: ToolSlot) { const id = tools[sl]; return id ? { id, ...TOOLS[id], name: ITEMS[id].name } : null; },
    has, count, add, addGear, equipGear: equip, take, save, recalc, use, craft,
    get isOpen() { return open || charOpen || !!shop || vaultOpen; },
    /** abre o Baú do Caminhante junto com a mochila */
    openVault() { open = true; shop = null; vaultOpen = true; render(); },
    /** guarda direto no baú (kit de começo de jornada) */
    vaultPut(items: [string, number][], gear: Gear[]) { for (const [id, n] of items) vault.items[id] = (vault.items[id] ?? 0) + n; for (const g of gear) vault.gear.push(g); vsave(); render(); },
    get vaultOpen() { return vaultOpen; }, vault,
    toggle() { open = !open; if (!open) { shop = null; vaultOpen = false; } render(); },
    toggleChar() { charOpen = !charOpen; render(); },
    canAdd, canAddGear, capacity, usedSlots, bagCount: () => bags.length,
    openShop(id: string, title?: string) {
      open = true; shop = id; vaultOpen = false; shopTitle = title ?? null; // a mochila abre junto com a loja (arrasta para vender)
      const sd = SHOPDEF[id]; if (sd?.fac) stock = facSet(sd.fac, FAC_ILVL); else if (sd?.gear) stock = sd.gear.map((s, i) => genGear(Math.max(1, st.lvl + (i % 3)), rollRarity({ rare: 0.5, legendary: 0.04, epic: 0, unique: 0, relic: 0 }), s)); else stock = [];
      render();
    },
    closeAll() { open = false; charOpen = false; shop = null; vaultOpen = false; render(); },
    /** personagem novo: limpa tudo e começa do zero */
    /** reencarnação: os atributos voltam como pontos para distribuir de novo */
    respec() { const A = st.attrs as Record<string, number>; let n = 0; for (const k of Object.keys(A)) { n += A[k]; A[k] = 0; } st.points += n; recalc(); render(); save(); return n; },
    reset() { for (const k of Object.keys(bag)) delete bag[k]; Object.assign(bag, { bread: 2 }); for (const sl of Object.keys(tools) as ToolSlot[]) tools[sl] = null; tools.knife = 'knife_f'; bags.length = 0; gearBag.length = 0; vault.items = {}; vault.gear = []; vsave(); /* o lado é do personagem: começar de novo é começar sem juramento */ setMyFac(null); for (const sl of SLOTS) eqG[sl] = null; st.attrs = { str: 0, dex: 0, vit: 0, int: 0 }; st.points = 0; st.gold = 0; st.lvl = 1; st.xp = 0; st.kills = 0; st.hpMax = 0; st.mpMax = 0; recalc(); st.hp = st.hpMax; st.mp = st.mpMax; save(); render(); },
    refresh() { if (open || shop) render(); },
    sp: SPECIAL,
  };
}
