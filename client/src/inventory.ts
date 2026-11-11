import { honor, honorPrice, spendHonor, honorRank } from './sistemas/honra';
import { runeItems } from './runas-magia';
import { heroHand, heroAcc, monCD, monAcc, heroCD, needOf, critFaces, fmtDice } from './dados-rpg';
import { REACTOR_PARTS, type ReactorPart, loadParts, saveParts, partsFull, reactorSvg } from './reator';
import { potionPulse } from './celebrate';
import { FEASTS, feastEff, FEAST_MIN, GADGETS } from './festim';
import { isPremium, GIFT_BAG } from './premium';
import { floatWin, buyFx, confirmBox } from './windows';
import { TOOLS, TOOL_SLOTS, TIER_NAME, isTool, toolDesc, type ToolSlot } from './tools';
import { facSet, myFac, setMyFac, FAC, FAC_LVL, FAC_ILVL, FAC_PRICE, type Fac } from './faccoes';
import { reqLvl, tipCtx, genGear, gearTip, gearIcon, gearEmoji, plainGear, syncUid, rollRarity, RARITY, RSLOT, STAT_LABEL, SPECIAL, type Gear, type Slot, type StatKey } from './loot';

export type ItemKind = 'res' | 'food' | 'tool' | 'weapon' | 'armor' | 'shield' | 'misc';
export interface Item { name: string; icon: string; kind: ItemKind; col: number; desc: string; /** item de missão: não se vende, não se dá, não vai ao leilão nem ao correio; destruir abandona a missão */ quest?: string; heal?: number; mp?: number; buff?: string; atk?: number; def?: number; tier?: number; sell?: number }
const ITEMS0: Record<string, Item> = {
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
  lagrima: { name: 'Lágrima do Olho', icon: '💧', kind: 'misc', col: 0x9ad7ff, tier: 5, sell: 6000, desc: 'Marghar se emocionou. Guarde para a morte: no Limiar ela paga a volta da alma sem penalidade nenhuma. Ou use para trocar por 60 dias de Premium, venda ao mercador (6.000 ouro) ou a outro jogador pelo correio e pelo Quadro.' },
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
  /* materiais de elite (25/10): só caem de bichos elite; o Mestre-Forjador de Brasaforja transforma em peças lendárias */
  el_hide: { name: 'Couro de Elite', icon: '🟫', kind: 'res', col: 0x7a4a2a, desc: 'Couro grosso de um bicho que mandava na matilha. Não rasga, não fura, não esquece.', sell: 120 },
  el_fang: { name: 'Presa Alfa', icon: '🦷', kind: 'res', col: 0xf0e8d0, desc: 'A presa de quem comandava os outros. Ainda corta.', sell: 110 },
  el_horn: { name: 'Chifre Ancestral', icon: '🦌', kind: 'res', col: 0xc8a878, desc: 'Galhada ou presa de bicho velho de mata velha. Dura como ferro rúnico.', sell: 120 },
  el_hoof: { name: 'Casco de Ferro', icon: '🐾', kind: 'res', col: 0x5a5a5a, desc: 'Casco que pisou pedra a vida inteira. Os anões fazem bota disso.', sell: 100 },
  el_heart: { name: 'Cerne Vivo', icon: '🪵', kind: 'res', col: 0x6a8a3a, desc: 'O coração de madeira de um Guardião da Mata. Ainda pulsa, devagar.', sell: 160 },
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
  reator_1: { name: 'Núcleo de Reator Mk I', icon: '⚛', kind: 'misc', col: 0x8af0ff, desc: 'A bateria do reator pessoal do tecnocrata. Use para trocar: o reator enche com 50.000 de Energia, que só gasta com as magias. Ferreiros fazem (fluido do alquimista + cristal dos magos), ou monte uma na aba ⚛ Reator da mochila.', sell: 90 },
  reator_2: { name: 'Núcleo de Reator Mk II', icon: '⚛', kind: 'misc', col: 0xb0f8ff, desc: 'Bateria moderna, da segunda classe da Academia: 120.000 de Energia. Só serve em reator de Engenheiro.', sell: 240 },
  casco_reator: { name: 'Casco de Reator', icon: '⚙', kind: 'res', col: 0xa8823a, desc: 'Casco de latão e aço com as bobinas enroladas. Feito pelo ferreiro.', sell: 40 },
  fluido_vital: { name: 'Fluido Vital', icon: '🧪', kind: 'res', col: 0x7affd0, desc: 'O líquido que esfria o núcleo. Destilado pelo alquimista.', sell: 30 },
  cristal_arcano: { name: 'Cristal Arcano', icon: '💠', kind: 'res', col: 0x9a8aff, desc: 'Cristal carregado pelos magos do Pináculo de Marfim. Sem ele o núcleo não acende.', sell: 45 },
  charc_sec: { name: 'Charcutaria Secular', icon: '🍖', kind: 'food', col: 0x8a2a2a, desc: 'Carne humana curada nas adegas de Corvoscuro por séculos. Para o lobisomem, sacia toda a fome e dá força por 10 min, sem vítima. Os vampiros vendem rindo.', heal: 30, buff: 'carne_h', sell: 60 },
  inj_s: { name: 'Injeção Automática de Sangue', icon: '💉', kind: 'food', col: 0xc02a3a, desc: 'Seringa de latão dos tecnocratas, com Sangria Concentrada dos anões. Para o vampiro, mata a sede de sangue por inteiro, sem vítima.', heal: 30, buff: 'inj_s', sell: 55 },
  sangria_c: { name: 'Sangria Concentrada', icon: '🩸', kind: 'res', col: 0x9a1a2a, desc: 'Sangue doado nas casas de sangria dos anões, apurado no frio da montanha. Os tecnocratas fazem as Injeções com ela.', sell: 35 },
  incenso_m: { name: 'Kit de Incensos de Mortificação', icon: '🕯', kind: 'food', col: 0xd8c8ff, desc: 'Incensos de purificação e mortificação. O guerreiro do Norte faz o ritual de calmaria: condolências a Odin, o corpo castigado (−12% de vida) e a Fúria cai muito. Feito por magos e bruxos — cada um precisa do que só o outro faz.', heal: 0, buff: 'ritual', sell: 45 },
  esq_hab: { name: 'Pergaminho do Esquecimento das Habilidades', icon: '📜', kind: 'res', col: 0xc8b0ff, desc: 'Lido em voz alta, apaga o que você aprendeu das habilidades: os pontos voltam para gastar de novo.', sell: 60 },
  esq_pas: { name: 'Pergaminho do Esquecimento das Passivas', icon: '📜', kind: 'res', col: 0xb0d8ff, desc: 'Apaga as passivas aprendidas: os pontos voltam para gastar de novo.', sell: 60 },
  esq_tal: { name: 'Pergaminho do Esquecimento dos Talentos', icon: '📜', kind: 'res', col: 0xffe0a0, desc: 'Apaga a Árvore de Talentos (e solta as runas dos encaixes): os pontos voltam.', sell: 60 },
  areia_astral: { name: 'Areia da Iluminação Astral', icon: '✨', kind: 'res', col: 0xbfd8ff, desc: 'Areia que guardou a luz das estrelas no Pináculo de Marfim. Só os magos de Lumenhal a fazem.', sell: 30 },
  cinzas_mortos: { name: 'Cinzas dos Mortos', icon: '⚱', kind: 'res', col: 0x6a6070, desc: 'Cinzas de cremação recolhidas pelos bruxos do Círculo, com o nome de cada um sussurrado. Só os bruxos as fazem.', sell: 30 },
  pao_azimo: { name: 'Pão Ázimo', icon: '🫓', kind: 'misc', col: 0xf0e0b0, desc: 'Pão sem fermento dos cozinheiros humanos, feito com o Trigo sem Fermento dos tecnocratas. Com o Vinho Santo, é o Jejum e Oração do paladino: a Dúvida cai muito.', sell: 25 },
  vinho_santo: { name: 'Vinho Santo dos Anões', icon: '🍷', kind: 'misc', col: 0x8a1a3a, desc: 'O lendário vinho dos anões, que só fecha com a Gota de Lágrima Santa dos elfos. Com o Pão Ázimo, é o Jejum e Oração do paladino.', sell: 40 },
  semente_mod: { name: 'Semente de Trigo Alterada', icon: '🌱', kind: 'res', col: 0x8ae0a0, desc: 'Semente mexida pelos tecnocratas na estufa de latão: o trigo que nascer dela nunca fermenta. Só as mãos élficas a fazem brotar.', sell: 20 },
  trigo_sf: { name: 'Trigo sem Fermento', icon: '🌾', kind: 'res', col: 0xe8d080, desc: 'Trigo raro: a semente é dos tecnocratas, o cultivo é dos elfos, e ele não fermenta nunca. Os cozinheiros humanos fazem o Pão Ázimo com ele.', sell: 18 },
  gota_santa: { name: 'Gota de Lágrima Santa', icon: '💧', kind: 'res', col: 0xbfe8ff, desc: 'Orvalho das árvores mais velhas de Lithendel, recolhido pelas anciãs élficas. Sem ela, o vinho dos anões não fica santo.', sell: 30 },
  unguento_terra: { name: 'Unguento da Terra', icon: '🫙', kind: 'misc', col: 0x6a5030, desc: 'Gordura de fera e terra de toca, batidos pelas curtidoras do Uivo Antigo. Com a Água Benta, é o Ritual do Aterramento do mago.', sell: 30 },
  agua_benta: { name: 'Água Benta de Auréon', icon: '💧', kind: 'misc', col: 0xfff0b0, desc: 'Água da Abadia da Aurora, benzida por paladinos. Com o Unguento da Terra, é o Ritual do Aterramento do mago.', sell: 30 },
  coracao_demonio: { name: 'Coração de Demônio', icon: '🫀', kind: 'misc', col: 0x8a1a3a, desc: 'Só os caçadores do Clã Helsing sabem arrancar o coração sem que ele apodreça. Com o Chifre de Sangue, é a Oferenda do Pacto do bruxo.', sell: 45 },
  chifre_sangue: { name: 'Chifre de Sangue', icon: '📯', kind: 'misc', col: 0xb04a2a, desc: 'A taça de chifre cheia do sangue de uma batalha honrada. Só os guerreiros do Norte a enchem. Com o Coração de Demônio, é a Oferenda do Pacto do bruxo.', sell: 40 },
  po_sono: { name: 'Pó do Sono Sem Sonhos', icon: '🌫', kind: 'misc', col: 0x8a7aa8, desc: 'Pó dos bruxos que fecha os olhos sem abrir os sonhos. Com o Sino de Guarda, é o Sono Guardado do caçador.', sell: 35 },
  sino_guarda: { name: 'Sino de Guarda', icon: '🔔', kind: 'misc', col: 0xc8a050, desc: 'Sino de latão dos tecnocratas, que toca sozinho se algo se aproxima. Com o Pó do Sono, é o Sono Guardado do caçador.', sell: 35 },
  blood_d: { name: 'Sangue Diluído', icon: '🩸', kind: 'food', col: 0xb3202f, desc: 'Sangue de cervo cortado com água benta fraca e ervas. O vampiro aguenta o sol por 5 min (a queimadura vem 8× mais devagar) e a pele começa a fechar.', heal: 40, buff: 'sunveil', sell: 10 },
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
  escritura_casa: { name: 'Escritura da Casa', icon: '📃', kind: 'misc', col: 0xf0e0b0, desc: 'O documento de propriedade da sua casa, com o selo do Cartório de Karmika. Guarde com carinho e cuidado: quem tem a escritura é o dono. Use para ver o contrato.' },
  projeto_casa_tabuas: { name: 'Projeto · Casa de Tábuas e Pedra', icon: '📜', kind: 'misc', col: 0xe8d8a8, desc: 'A planta da casa com o material já separado (40 tábuas, 30 pregos, 24 pedras, 8 cordas, 16 galhos). Use para escolher o lugar do canteiro. Depois a obra pede 30 turnos de trabalho — a sua mão ou a de um Ajudante de Obra.' },
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
  /* 09/11 (Erling): a moça da ponte de Karmika. A flor se compra do Thorin; o cartão é lembrança que se guarda (não se vende) */
  flor_laco: { name: 'Flor com Laço', icon: '💐', kind: 'misc', col: 0xf08aa0, desc: 'Uma flor-de-campo com um laço de fita. Para dar a alguém que precisa.', sell: 2 },
  cartao_ines: { name: 'Cartão de Agradecimento de Inês', icon: '💌', kind: 'misc', col: 0xf0d8e0, desc: '“Para quem parou na ponte quando ninguém mais parava. — Inês.” Letra miúda, papel que cheira a flor. Guarde.', sell: 0 },
  carta_patente: { name: 'Carta Patente', icon: '📜', kind: 'misc', col: 0xe8d8a8, quest: 'gu1', desc: '◆ Item de missão (O Peso de um Estandarte). Lacrada pelo Escrivão-Mor de Askavik: leve ao Magistrado de Lumenhal para registrar a sua guilda. Não se vende nem se dá; destruir abandona a missão.' },
  carta_garrick: { name: 'Carta de Garrick', icon: '✉', kind: 'misc', col: 0xe8dcc0, quest: 'h09', desc: '◆ Item de missão (A carta para Lundr). Lacrada com o selo da guarda de Karmika, para a Sargenta Ilka, em Lundr. Não se vende nem se dá; destruir abandona a missão.' },
  lenco_bento: { name: 'Lenço de Bento', icon: '🧣', kind: 'misc', col: 0xc84a5a, quest: 'h08', desc: '◆ Item de missão (O marido desaparecido). A Lúcia bordou para ele: mostre ao Bento para ele confiar em você. Não se vende nem se dá; destruir abandona a missão.' },
  pet_cat: { name: 'Gatinho Malhado', icon: '🐱', kind: 'misc', col: 0xd8883a, desc: 'Macio e curioso. No combate, chia e faz o inimigo parar. Use para levar ao Estábulo (X).', tier: 1 },
  pet_cat_b: { name: 'Gata Preta', icon: '🐈‍⬛', kind: 'misc', col: 0x26222a, desc: 'Faro fino no escuro: acha itens longe. Use para levar ao Estábulo (X).', tier: 1 },
  pet_rat: { name: 'Ratinho de Porão', icon: '🐀', kind: 'misc', col: 0x8a7a6a, desc: 'Faro fino: busca itens caídos bem mais longe. Use para levar ao Estábulo (X).', tier: 1 },
  pet_piglet: { name: 'Leitão Malhado', icon: '🐖', kind: 'misc', col: 0xd8a890, desc: 'Fuça a terra quando você descansa e às vezes traz uma coisinha. Use para levar ao Estábulo (X).', tier: 1 },
  mount_grey: { name: 'Cavalo Ruço', icon: '🐴', kind: 'misc', col: 0x9a968e, desc: 'Montaria (Z): +80% de velocidade fora de combate. Use para levar ao Estábulo (X).', tier: 1 },
  coleira_couro: { name: 'Coleira de Couro', icon: '🟤', kind: 'misc', col: 0x8a5a2a, desc: 'Clique para vestir no pet que anda com você (ou no Estábulo, X): +15% de velocidade ao buscar itens.', sell: 12 },
  coleira_prata: { name: 'Coleira de Prata', icon: '⚪', kind: 'misc', col: 0xc8ccd4, desc: 'Clique para vestir no pet que anda com você (ou no Estábulo, X): +30% de velocidade ao buscar e +25% de alcance da habilidade.', sell: 60 },
  peitoral_couro: { name: 'Peitoral de Couro', icon: '🛡', kind: 'misc', col: 0x6a4a2a, desc: 'Clique para vestir no pet que anda com você (ou no Estábulo, X): a habilidade de combate volta 20% mais rápido.', sell: 20 },
  peitoral_ferro: { name: 'Peitoral de Ferro', icon: '🛡', kind: 'misc', col: 0x8a8e96, desc: 'Clique para vestir no pet que anda com você (ou no Estábulo, X): a habilidade volta 35% mais rápido e a mordida dói +25%.', sell: 80 },
  feno: { name: 'Fardo de Feno', icon: '🌾', kind: 'misc', col: 0xd8c060, desc: 'Comida de montaria (Estábulo, X). Também vale maçã e pão.', sell: 1 },
  mount_horse: { name: 'Cavalo Baio', icon: '🐴', kind: 'misc', col: 0x6a4a2e, desc: 'Montaria (Z): +75% de velocidade fora de combate.', tier: 1 },
  mount_black: { name: 'Corcel Negro', icon: '🐎', kind: 'misc', col: 0x1a1612, desc: 'Montaria (Z): +90% de velocidade fora de combate.', tier: 2 },
};
/* A ESCRITURA É UM ITEM ÚNICO DINÂMICO (28/10, Erling): um só tipo de item que "recebe" cada casa. O id é escritura_<número>; o
   nome e os dados vêm do registro de escrituras (preenchido pela casa e pelo servidor). Qualquer casa nova (2 andares, capela,
   toca…) usa o mesmo item, sem trabalho novo. ITEMS responde por qualquer escritura_* mesmo antes do registro chegar. */
export interface DeedMeta { id: string; house: string; owner: string; place?: string; gx?: number; gy?: number; w?: number; h?: number; since?: number }
const DEEDK = 'karmika.deeds.v1';
export const DEEDS: Record<string, DeedMeta> = (() => { try { return JSON.parse(localStorage.getItem(DEEDK) || '{}'); } catch { return {}; } })();
const deedItem = (m?: DeedMeta): Item => ({ name: m ? `Escritura · ${m.house}` : 'Escritura de Casa', icon: '📃', kind: 'misc', col: 0xf0e0b0, desc: m ? `O documento de propriedade da ${m.house}${m.place ? `, em ${m.place}` : ''}, com o selo do Cartório de Karmika. Dono registrado: ${m.owner}. Quem tem a escritura pode tomar posse: use para abrir o contrato.` : 'O documento de propriedade de uma casa, com o selo do Cartório de Karmika. Use para abrir o contrato.' });
export function registerDeed(m: DeedMeta) { DEEDS[m.id] = { ...DEEDS[m.id], ...m }; try { localStorage.setItem(DEEDK, JSON.stringify(DEEDS)); } catch { /* */ } ITEMS0['escritura_' + m.id] = deedItem(DEEDS[m.id]); }
export const deedIdOf = (itemId: string) => /^escritura_([a-z0-9]{6,16})$/.test(itemId) ? itemId.slice(10) : null;
/** 09/11 (Erling): a Bolsa do Caminhante (Premium) usa uma mochila dourada, não uma caixa de presente */
export const PREMIUM_BAG_ICON = '<svg class="bgprem" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><defs><linearGradient id="bgpg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe9a8"/><stop offset="1" stop-color="#b8862e"/></linearGradient></defs><path d="M8 7V5.5a4 4 0 0 1 8 0V7" fill="none" stroke="#6a4a1a" stroke-width="1.6" stroke-linecap="round"/><rect x="4" y="7" width="16" height="14" rx="4" fill="url(#bgpg)" stroke="#6a4a1a" stroke-width="1.2"/><rect x="7" y="13" width="10" height="6" rx="1.5" fill="#8a5a22" stroke="#5a3a12" stroke-width="1"/><rect x="10.5" y="13" width="3" height="2.2" rx="0.6" fill="#ffe9a8"/><path d="M19.5 2.2l.7 1.6 1.6.7-1.6.7-.7 1.6-.7-1.6-1.6-.7 1.6-.7z" fill="#fff3c6"/></svg>';
export const ITEMS: Record<string, Item> = new Proxy(ITEMS0, { get(t, k) { if (typeof k === 'string' && !(k in t)) { const d = deedIdOf(k); if (d) t[k] = deedItem(DEEDS[d]); } return (t as Record<string | symbol, Item>)[k as string]; } });
for (const id of Object.keys(TOOLS)) if (ITEMS[id]) ITEMS[id].desc = (ITEMS[id].desc ? ITEMS[id].desc + ' ' : '') + toolDesc(id);
export const PRICES: Record<string, number> = { flor_laco: 12, esq_hab: 240, esq_pas: 240, esq_tal: 240, axe_i: 60, axe_s: 30, axe_st: 220, pick_s: 30, pick_i: 70, pick_st: 240, knife_f: 12, knife_i: 55, knife_st: 200, shears_c: 25, shears_i: 80, rod_ash: 90, potion: 15, blood_d: 22, semente_mod: 30, unguento_terra: 80, agua_benta: 80, coracao_demonio: 120, chifre_sangue: 110, po_sono: 90, sino_guarda: 95, pao_azimo: 70, vinho_santo: 110, trigo_sf: 45, gota_santa: 70, incenso_m: 150, areia_astral: 65, cinzas_mortos: 65, charc_sec: 190, inj_s: 170, sangria_c: 75, reator_1: 280, reator_2: 760, cristal_arcano: 120, fluido_vital: 70, bread: 4, rope: 6, flint: 8, rod: 25, bag_s: 60, bag_m: 180, bag_l: 520, bag_xl: 1400, potion_g: 40, mana: 28, tonic: 24, antidote: 16, beer: 8, mead: 16, skewer: 14, stew: 22, sausage: 12, jerky: 9, cooked: 10, fishc: 9, plank: 6, nail: 4, block: 8, wood: 5, stone: 3, pet_fox: 350, meat: 6, apple: 3, pet_rat: 180, pet_cat: 300, pet_cat_b: 420, pet_piglet: 260, mount_grey: 1100, coleira_couro: 40, coleira_prata: 220, peitoral_couro: 70, peitoral_ferro: 300, feno: 4, bag_mg: 2400, pet_pup: 500, mount_horse: 900, mount_black: 2200, scroll_return: 30 };
export interface ShopDef { title: string; items: string[]; fac?: Fac; gear?: Slot[]; /** 08/11: loja de Honra Kármica — peças épicas pagas em honra (sistemas/honra.ts) */ honor?: boolean; /** 09/11: loja da Copa — troca ALINHAMENTO (karma, para mais ou para menos) por peças fortes: o preço é um custo em |karma| que puxa a alma de volta ao centro */ karma?: boolean; buys?: Record<string, number>; note?: string; /** abas da prateleira (27/10): cada aba lista os seus itens; sem abas, tudo junto */ tabs?: { name: string; items: string[] }[]; /** botão extra ao lado das abas (ex.: a carroça anã contrata festas) */ extra?: { label: string; act: () => void } }
export const SHOPDEF: Record<string, ShopDef> = {
  armeiro: { title: 'Doran, o Armeiro', items: ['axe_i', 'pick_i', 'knife_i', 'potion'], buys: { ore_i: 1.5, ore_ag: 1.3 }, gear: ['weapon', 'weapon', 'weapon', 'shield', 'shield'], note: 'Espadas, machados, martelos e escudos. Aço do Norte.' },
  armaduras: { title: 'Maren, a Armadureira', items: [], gear: ['armor', 'armor', 'helm', 'helm', 'boots', 'boots'], buys: { hide: 1.6 }, note: 'Couro, cota e placas. Paga bem por couro.' },
  mercador: { title: 'Thorin, o Mercador', items: ['potion', 'bread', 'flor_laco', 'rope', 'flint', 'axe_s', 'pick_s', 'knife_f', 'shears_c', 'rod', 'bag_s', 'bag_m', 'scroll_return'], note: 'Um pouco de tudo. Bolsas para quem junta demais.' },
  mercador_cidade: { title: 'Ivar, Grande Mercador', items: ['potion', 'potion_g', 'mana', 'bread', 'rope', 'flint', 'axe_i', 'pick_st', 'shears_i', 'rod_ash', 'bag_s', 'bag_m', 'bag_l', 'bag_mg', 'scroll_return'], buys: { gem: 1.4, ore_ag: 1.4 }, note: 'Regra do comércio: quanto maior a cidade, melhores as bolsas e os itens. Aqui vai até o alforje de 24.' },
  pocoes: { title: 'Morwen, a Alquimista', items: ['potion', 'potion_g', 'mana', 'tonic', 'antidote', 'blood_d', 'shears_c', 'shears_i'], buys: { dust: 1.5, sap: 1.5, herb_g: 1.6, herb_s: 1.6, herb_j: 1.5, herb_f: 1.6, herb_r: 1.6, herb_m: 1.5 }, note: 'Poções e tônicos. Compra ervas, pó de fada e seiva — e vende alicates para quem colhe.' },
  cervejaria: { title: 'Tessa, a Cervejeira', items: ['beer', 'mead', 'bread'], buys: { apple: 1.5 }, note: 'Cerveja e hidromel: coragem em caneca.' },
  churrasco: { title: 'Sven, o Churrasqueiro', items: ['skewer', 'cooked', 'fishc'], buys: { meat: 1.4, fish: 1.4 }, note: 'Carne no espeto, sempre quente.' },
  charcutaria: { title: 'Bruno, o Charcuteiro', items: ['sausage', 'jerky'], buys: { meat: 2.0, hide: 1.2 }, note: 'Paga o dobro por carne crua.' },
  cozinha: { title: 'Rosália, a Cozinheira', items: ['stew', 'cooked', 'fishc', 'bread', 'pao_azimo'], buys: { meat: 1.3, fish: 1.3, apple: 1.3 }, note: 'Ensopado de caça da casa.' },
  lenhador: { title: 'Tomás, o Lenhador', items: ['axe_s', 'axe_i', 'axe_st', 'wood'], buys: { wood: 1.5, stick: 1.5 }, note: 'Machados e madeira. Paga bem por toras.' },
  cacador: { title: 'Kaela, a Caçadora', items: ['knife_f', 'knife_i', 'knife_st', 'rod', 'rod_ash', 'jerky', 'potion'], buys: { hide: 1.4, hide_f: 1.4, hide_w: 1.3, claw: 1.5, meat: 1.2 }, note: 'Couro, garras e carne: a floresta paga.' },
  construtor: { title: 'Gunnar, o Construtor', items: ['plank', 'nail', 'block', 'rope'], buys: { wood: 1.3, stone: 1.5 }, note: 'Materiais para construir a sua casa.' },
  domador: { title: 'Corwin, o Domador', items: ['pet_cat', 'pet_cat_b', 'pet_fox', 'pet_pup', 'pet_rat', 'pet_piglet', 'coleira_couro', 'coleira_prata', 'peitoral_couro', 'peitoral_ferro', 'meat', 'apple'], note: 'Companheiros que buscam o que cai no chão.' },
  tec_fio: { title: 'Tecelagem Real do Fio', items: [], fac: 'fio', note: 'Feito à mão pelas tecelãs da Ordem, com o fio que nunca se corta. Ninguém mais sabe tecer isto. Só para quem jurou o Fio.' },
  tec_desf: { title: 'Tecelagem dos Desfiados', items: [], fac: 'desf', note: 'Pano negro rasgado de propósito, ferro que não enferruja. Feito na oficina dos Desfiados e em nenhum outro lugar. Só para quem cortou o fio.' },
  latao: { title: 'Companhia das Caravanas de Latão', items: ['reator_1', 'reator_2', 'cristal_arcano', 'inj_s', 'semente_mod', 'sino_guarda', 'potion_g', 'mana', 'tonic', 'antidote', 'rope', 'scroll_return', 'bag_l'], buys: { ore_i: 1.3, gem: 1.3 }, note: 'Mercadoria do porto, trazida pelas caravanas de latão.' },
  adega_conde: { title: 'Adega do Conde, em Corvoscuro', items: ['charc_sec', 'blood_d'], note: 'Carne curada por séculos e sangue cortado. Os vampiros servem o lobo com um sorriso de canto.' },
  sangria_anao: { title: 'Casa de Sangria dos Anões', items: ['sangria_c', 'vinho_santo', 'jerky'], buys: { gota_santa: 1.6 }, note: 'Sangue doado e apurado no frio. Os tecnocratas compram para as Injeções.' },
  magos_lumen: { title: 'Sala dos Incensos do Pináculo', items: ['incenso_m', 'areia_astral', 'cristal_arcano', 'mana'], buys: { cinzas_mortos: 1.6 }, note: 'Os magos vendem a Areia Astral e os Kits de Incenso. As Cinzas eles precisam comprar dos bruxos.' },
  bruxa_gorvath: { title: 'Tenda da Bruxa de Gorvath', items: ['incenso_m', 'cinzas_mortos', 'po_sono', 'antidote', 'esq_hab', 'esq_pas', 'esq_tal'], buys: { areia_astral: 1.6 }, note: 'A bruxa vende as Cinzas dos Mortos e os Kits de Incenso. A Areia ela tem que comprar dos magos, e odeia isso.' },
  orvalho_elfo: { title: 'O Orvalho de Lithendel', items: ['gota_santa', 'trigo_sf', 'herb_m'], buys: { semente_mod: 1.6 }, note: 'As anciãs recolhem a Lágrima Santa antes do sol. Os anões compram quase toda para o vinho.' },
  toca_selvar: { title: 'Toca das Curtidoras de Selvar', items: ['unguento_terra', 'hide', 'jerky'], note: 'O mago que vem aqui comprar terra de toca faz uma cara que vale o preço.' },
  abadia_aurora: { title: 'Capela da Abadia da Aurora', items: ['agua_benta', 'bread'], note: 'Água benzida pelos paladinos. Os magos compram calados.' },
  bastiao_prata: { title: 'Arsenal do Bastião de Prata', items: ['coracao_demonio', 'antidote'], note: 'Corações arrancados pelos caçadores do Clã Helsing. Os bruxos pagam bem e ninguém pergunta para quê.' },
  salao_hidromel: { title: 'Salão do Hidromel de Jarlsheim', items: ['chifre_sangue', 'mead', 'beer'], note: 'O chifre se enche no campo de batalha. Aqui só se vende o que já foi enchido.' },
  /* 08/11 as lojas de HONRA KÁRMICA (sistemas/honra.ts): peças épicas do nível de quem compra, pagas em honra */
  honra_humano: { title: 'Comendador Aldric Vozalta — Honra Kármica', items: [], honor: true, gear: ['weapon', 'armor', 'helm', 'shield', 'boots', 'ring', 'amulet', 'cape'], note: 'Honra não se compra com ouro. Cada peça aqui foi paga com feitos — missões, elites, masmorras. Traga a sua.' },
  honra_anao: { title: 'Thrúd Marca-de-Ferro — Honra Kármica', items: [], honor: true, gear: ['weapon', 'armor', 'helm', 'shield', 'boots', 'ring', 'amulet', 'cape'], note: 'Os anões guardam o melhor aço para quem merece. Honra Kármica é a única moeda que esta banca aceita.' },
  alma_copa: { title: 'Sacerdotisa Ithilwen — A Balança da Copa', items: [], karma: true, gear: ['weapon', 'armor', 'helm', 'boots', 'ring', 'amulet', 'cape', 'shield'], note: 'Aqui não se paga com ouro nem com honra: paga-se com o peso da alma. Cada peça leva um pedaço do seu karma — da luz ou da sombra, tanto faz — e devolve a balança ao centro. Quem está no meio nada tem para dar.' },
  honra_elfo: { title: 'Sílvathir Lúmenar — Honra Kármica', items: [], honor: true, gear: ['weapon', 'armor', 'helm', 'shield', 'boots', 'ring', 'amulet', 'cape'], note: 'O Juramento não se vende. O que está nesta mesa é devolvido a quem o honrou.' },
  estabulo: { title: 'Orm, o Estalajadeiro', items: ['mount_horse', 'mount_grey', 'mount_black', 'feno', 'apple'], note: 'Montarias: Z para montar e desmontar.' },
};
/* a mesa dos anões (festim.ts, 27/10): carnes, cervejas e vinhos viram itens de comer e beber; as carroças dos anões vendem isso */
for (const [k, f] of Object.entries(FEASTS)) { ITEMS[k] = { name: f.name, icon: f.icon, kind: 'food', col: f.slot === 'meal' ? 0xb05a2a : 0xd8a040, desc: `${f.desc}\n${f.slot === 'meal' ? 'Prato' : 'Bebida'} · ${FEAST_MIN} min: ${feastEff(f)}. Um prato e uma bebida por vez.`, heal: f.slot === 'meal' ? 40 : 12, buff: 'feast:' + k, sell: Math.round(f.price / 3) } as Item; PRICES[k] = f.price; }
/* 03/11: as runas kármicas que caem no loot e se encaixam nas magias (runas-magia.ts) */
for (const [k, r] of Object.entries(runeItems())) ITEMS[k] = r as Item;
for (const [k, g] of Object.entries(GADGETS)) { ITEMS[k] = { name: g.name, icon: g.icon, kind: g.kind, col: g.col, desc: g.desc, tier: 3, sell: Math.round(g.price / 3) } as Item; PRICES[k] = g.price; }
SHOPDEF.latao.items = ['sentinela', 'sentinela_2', 'sentinela_3', 'ajudante_obra', 'ajudante_obra_2', 'ajudante_obra_3', 'drone_cura', 'drone_cura_2', 'drone_cura_3', 'drone_choque', 'drone_choque_2', 'drone_choque_3', 'escudo_auto', 'escudo_auto_2', 'escudo_auto_3', 'obra_auto', 'reacao_azul', 'reacao_amarela', 'reacao_vermelha', 'carvao_azul', 'carvao_amarelo', 'carvao_vermelho', 'pet_cao_latao', 'pet_robo_faisca', ...SHOPDEF.latao.items];
SHOPDEF.latao.tabs = [{ name: '🤖 Engenhocas', items: ['sentinela', 'sentinela_2', 'sentinela_3', 'ajudante_obra', 'ajudante_obra_2', 'ajudante_obra_3', 'drone_cura', 'drone_cura_2', 'drone_cura_3', 'drone_choque', 'drone_choque_2', 'drone_choque_3', 'escudo_auto', 'escudo_auto_2', 'escudo_auto_3', 'obra_auto'] }, { name: '🧪 Reações e carvão', items: ['reacao_azul', 'reacao_amarela', 'reacao_vermelha', 'carvao_azul', 'carvao_amarelo', 'carvao_vermelho'] }, { name: '🐕 Companheiros', items: ['pet_cao_latao', 'pet_robo_faisca'] }, { name: '📦 Mercadoria', items: ['reator_1', 'reator_2', 'cristal_arcano', 'inj_s', 'semente_mod', 'sino_guarda', 'potion_g', 'mana', 'tonic', 'antidote', 'rope', 'scroll_return', 'bag_l'] }];
SHOPDEF.anoes_carav = { title: 'Carroça dos Anões de Brasaforja', items: [...Object.keys(FEASTS), 'porca_perfeita', 'parafuso_inexp', 'engrenagem_diam', 'bag_l', 'scroll_return', 'rope'], tabs: [{ name: '🍖 Mesa', items: Object.keys(FEASTS).filter((k) => FEASTS[k].slot === 'meal') }, { name: '🍺 Adega', items: Object.keys(FEASTS).filter((k) => FEASTS[k].slot === 'brew') }, { name: '⚙ Peças', items: ['porca_perfeita', 'parafuso_inexp', 'engrenagem_diam'] }, { name: '🎒 Viagem', items: ['bag_l', 'scroll_return', 'rope'] }], buys: { meat: 1.4, hide: 1.2, ore_i: 1.2 }, note: 'Carne na brasa, cerveja e vinho de Brasaforja. Para festa, é só contratar.' };
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
/** família de armas que pode ir uma em cada mão (ou com escudo): bestas de mão e armas de fogo de uma mão */
/* 03/11 (Erling: "armas de uma mão podem ser usadas uma em cada mão: duas espadas, uma maça e uma espada, duas pistolas, duas bestas de
   repetição"): família da arma para o par — corpo a corpo com corpo a corpo, arma de fogo com arma de fogo, besta com besta; arma de duas mãos não faz par */
export { TWO_HANDED } from './loot'; /* moveu para loot.ts (a dica do item diz Uma mão / Duas mãos) */
import { TWO_HANDED } from './loot';
export const dualFam = (b?: string | null) => !b || TWO_HANDED.test(b) || /Escudo|Broquel|Pavês/.test(b) ? null : /Besta/.test(b) ? 'xb' : /Pistola|Escopeta|Revólver/.test(b) ? 'gun' : /Garras/.test(b) ? null : 'mel';
const SLOTS: Slot[] = ['helm', 'earring', 'earring2', 'amulet', 'shoulders', 'cape', 'armor', 'weapon', 'shield', 'ring', 'ring2', 'boots', 'relic'];

interface St {
  res?: { name: string; mode: 'regen' | 'fight' }; gen: number; auras?: number[];
  hp: number; hpMax: number; mp: number; mpMax: number; gold: number; lvl: number; xp: number; kills: number;
  atk: number; def: number; dmgFlat: number; crit: number; leech: number; regen: number; move: number; xpMul: number; goldMul: number;
  points: number; attrs: Record<Attr, number>; sp: Set<string>; recalc: (() => void) | null;
  /** prato e bebida da mesa dos anões (festim.ts): id e quando acaba (ms) */ feast?: { meal?: { id: string; until: number }; brew?: { id: string; until: number } }; stamMax?: number;
}
interface GameLike { st: St; logMsg(t: string, c?: string): void; drinkBuff?(id: string): void; snd?(k: 'coins' | 'error' | 'pickup' | 'click' | 'swap'): void }

/** 28/10 (Erling): itens empilham até 99; material de construção, de forja, mágico ou de qualquer ofício empilha até 10.000 num espaço só */
export const STACK = 99, MAT_STACK = 10000;
/** 28/10 (Erling): no máximo 6 bolsas equipadas além da mochila, seja qual for o tamanho de cada uma */
export const MAX_BAGS = 6;
/** Bolsa de Ofício: materiais de coleta e construção sem limite de espaço · Bolsa Mágica: reagentes e escritos arcanos sem limite */
export const CRAFT_BAG = new Set(['stick', 'wood', 'stone', 'rope', 'plank', 'nail', 'block', 'hide', 'claw', 'ore_i', 'ore_ag', 'hide_f', 'hide_w', 'herb_g', 'herb_s', 'herb_r', 'herb_j', 'herb_f']);
export const MAGIC_BAG = new Set(['gem', 'herb_m', 'dust', 'sap', 'tome', 'scroll_return', 'seal_1', 'seal_2', 'seal_3', 'flint']);
/* Bolsa de Ofício e Bolsa Mágica são do Premium: sem ele, o que estava nelas aparece na mochila comum (nada some) */
export const stackOf = (id: string) => (CRAFT_BAG.has(id) || MAGIC_BAG.has(id) || ITEMS[id]?.kind === 'res') ? MAT_STACK : STACK;
const freeBag = (id: string) => isPremium() && (CRAFT_BAG.has(id) || MAGIC_BAG.has(id));
export const BAGS: Record<string, number> = { bag_s: 8, bag_m: 12, bag_l: 24, bag_xl: 36, bag_mg: 68 };
/** bolsas que só funcionam com o Premium ativo (sem ele ficam lacradas: não contam espaço) */
export const PREMIUM_BAGS = new Set(['bag_mg']);
export function createInventory(game: GameLike, hooks: { /** 29/10: a aba ⚛ Reator (só para o tecnocrata) */ reactor?(): { on: boolean; charge: number; cap: number }; fuse?(): void; placeFire(): boolean; raceLabel(): string; karma(): number; /** 09/11: gasta alinhamento (puxa o karma para o centro em |n|) */ spendKarma?(n: number): boolean; xpNeed(): number; onCraft?(name: string): void; /** destruiu o item de uma missão: a missão é abandonada */ questItemLost?(quest: string, item: string): void; /** a lista do alinhamento kármico (tela do personagem) */ alignHtml?(): string; /** usar/vestir: animação e som (main.ts) */ feel?(kind: string, id: string): void; portrait?(): string | null; soul?(): [string, string][]; title?(): string; onUse?(id: string): boolean; onGear?(): void; onBag?(): void; /** bônus de XP fora do equipamento (bênção do voto) */ xpBonus?(): number; /** multiplicador de preço desta loja para este herói */ priceK?(shop: string): number; /** 06/11: quanto a loja paga a mais por este item vindo deste herói (o tecnocrata vende engenhocas à Caravana de Latão pelo dobro) */ sellK?(shop: string, id: string): number; /** arma de caminho: devolve o motivo se este herói não pode empunhar */ canWear?(g: Gear): string | null; /** 03/11: a soma da árvore de talentos (talentos.ts) */ talents?(): Partial<Record<string, number>> }) {
  let alOpen = false, dsOpen = false; /* a coluna do alinhamento kármico na tela do personagem */
  const bag: Record<string, number> = { potion: 2, bread: 3, flint: 1, rope: 2 };
  let gearBag: Gear[] = [];
  const tools: Record<ToolSlot, string | null> = { axe: null, pick: null, knife: null, shears: null, rod: null };
  const eqG: Record<Slot, Gear | null> = { weapon: null, armor: null, shield: null, helm: null, boots: null, ring: null, ring2: null, amulet: null, relic: null, earring: null, earring2: null, shoulders: null, cape: null };
  let stock: Gear[] = [];
  const accClosed = new Set<string>((() => { try { return JSON.parse(localStorage.getItem('karmika.acc') || '["craft"]') as string[]; } catch { return ['craft']; } })());
  /** o que a loja aberta paga por um item: o preço de venda × o gosto da loja (buys) × o ofício do herói (sellK) */
  const sellPrice = (id: string) => Math.round((ITEMS[id]?.sell ?? 0) * (shop && SHOPDEF[shop]?.buys?.[id] ? SHOPDEF[shop].buys![id] : 1) * (shop ? hooks.sellK?.(shop, id) ?? 1 : 1));
  let open = false, charOpen = false, shop: string | null = null, shopTitle: string | null = null, shopTab = 0, bagTab: 'bag' | 'reator' = 'bag', fusing = false;
  const bags: string[] = []; // bolsas extras equipadas (ids de BAGS), até 4
  /* Bolsa de Ofício (60 espaços) e Bolsa Mágica (30): grandes, mas com fim. O que passar do limite ocupa a mochila comum */
  const CRAFT_CAP = 60, MAGIC_CAP = 30;
  const slotsOf = (id: string) => freeBag(id) ? 0 : Math.ceil((bag[id] ?? 0) / stackOf(id));
    const stacksIn = (set: Set<string>) => [...set].reduce((a, k) => a + Math.ceil((bag[k] ?? 0) / stackOf(k)), 0);
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
  const vaultUsed = () => vault.gear.length + Object.entries(vault.items).reduce((a, [k, n]) => a + Math.ceil(n / stackOf(k)), 0);
  const vsave = () => { try { localStorage.setItem(VKEY, JSON.stringify(vault)); } catch { /* */ } };
  function deposit(ref: string, quiet = false): boolean {
    const [k, a, b] = ref.split(':');
    if (k === 'g') { const i = gearBag.findIndex((g) => g.uid === +a); if (i < 0) return false; if (vaultUsed() + 1 > vaultCap()) { if (!quiet) game.logMsg('📦 O baú está cheio.', '#ff9a8a'); return false; } vault.gear.push(gearBag.splice(i, 1)[0]); }
    else { const id = a, n = Math.min(+b || 1, bag[id] ?? 0); if (n <= 0) return false; const cur = vault.items[id] ?? 0, extra = Math.ceil((cur + n) / stackOf(id)) - Math.ceil(cur / stackOf(id)); if (vaultUsed() + extra > vaultCap()) { if (!quiet) game.logMsg('📦 O baú está cheio.', '#ff9a8a'); return false; }
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
  /* 02/11: a arma da outra mão (segunda besta de mão, pistola ou escopeta no espaço do escudo) conta pela metade — o tiro dela já dobra os disparos */
  const total = () => { const t: Partial<Record<StatKey, number>> = {}; for (const [sl, g] of Object.entries(eqG)) if (g) { const k0 = sl === 'shield' && g.slot === 'weapon' ? 0.5 : 1; for (const [k, v] of Object.entries(g.stats) as [StatKey, number][]) t[k] = (t[k] ?? 0) + v * k0; } return t; };

  function recalc() {
    const t = total(), A = st.attrs, TL = hooks.talents?.() ?? {}, b = (k: Attr) => A[k] + (t[k] ?? 0) + (TL[k] ?? 0);
    const keepHp = st.hpMax > 0 ? st.hp / st.hpMax : 1, keepMp = st.mpMax > 0 ? st.mp / st.mpMax : 1;
    st.hpMax = Math.round(100 + 12 * (st.lvl - 1) + 8 * Math.max(0, st.lvl - 40) + 5 * b('vit') + (t.hp ?? 0)); /* 07/11 equilíbrio: do 40 em diante, +8 de vida por nível (o dano dos bichos cresce mais rápido lá em cima) */
    st.mpMax = st.res?.mode === 'fight' ? Math.round(100 + (t.mp ?? 0) * 0.4) : Math.round(100 + 6 * (st.lvl - 1) + 4 * b('int') + (t.mp ?? 0)); // recurso de luta: teto fixo, o que cresce é a geração
    st.gen = (t.gen ?? 0) / 100;
    st.hp = Math.min(st.hpMax, Math.max(1, Math.round(st.hpMax * keepHp))); st.mp = Math.min(st.mpMax, Math.round(st.mpMax * keepMp));
    const axe = tools.axe ? TOOLS[tools.axe].tier * 1.2 : 0; // sem arma, o machado de ofício ainda bate
    { const S = b('str'), eff = S <= 20 ? S : S <= 60 ? 20 + (S - 20) * 0.6 : 44 + (S - 60) * 0.3; st.atk = 1 + 0.02 * eff; } /* Força rende cada vez menos (retorno decrescente) */ st.dmgFlat = (t.dmg ?? 0) + (eqG.weapon ? 0 : axe);
    st.crit = Math.min(0.5, 0.12 + 0.004 * b('dex') + (t.crit ?? 0) / 100);
    let mvRaw = (t.move ?? 0) / 100 + 0.0012 * b('dex'); /* 07/11: a soma crua (itens + Destreza + talentos) passa pela curva lá embaixo */
    const armor = (t.def ?? 0) + 0.6 * b('vit'); st.def = Math.min(0.7, armor / (armor + 70 + 8 * st.lvl));
    st.regen = 0.35 + (t.regen ?? 0) + 0.04 * b('vit');
    /* a árvore de talentos (03/11) */
    st.hpMax = Math.round(st.hpMax * (1 + (TL.hp ?? 0) / 100)); if (st.res?.mode !== 'fight') st.mpMax += Math.round(TL.mp ?? 0); st.hp = Math.min(st.hp, st.hpMax); st.mp = Math.min(st.mp, st.mpMax);
    st.atk *= 1 + (TL.dmg ?? 0) / 100; st.crit = Math.min(0.6, st.crit + (TL.crit ?? 0) / 100); mvRaw += (TL.move ?? 0) / 100;
    /* 07/11 (Erling: "muitos talentos e itens de velocidade, estou super veloz no nível 10"): a velocidade cresce com retorno decrescente e
       nunca passa de +40% (somando itens, Destreza e talentos). +10% cru ≈ +9%; +30% ≈ +21%; +60% ≈ +31%; +100% ≈ +37%. Velocidade negativa vale cheia */
    st.move = 1 + (mvRaw > 0 ? 0.4 * (1 - Math.exp(-mvRaw / 0.4)) : mvRaw); st.gen += (TL.gen ?? 0) / 100;
    if (TL.arm) { const ar = armor + TL.arm; st.def = Math.max(0, Math.min(0.75, ar / (Math.max(1, ar) + 70 + 8 * st.lvl))); }
    st.regen += TL.regen ?? 0; { const a = (TL.aspd ?? 0) / 100; (st as St & { aspd?: number }).aspd = a > 0 ? 0.35 * (1 - Math.exp(-a / 0.35)) : a; } /* 07/11: velocidade de golpe também com teto (+35%) */ (st as St & { cdr?: number }).cdr = (TL.cdr ?? 0) / 100; (st as St & { tHeal?: number }).tHeal = (TL.heal ?? 0) / 100; { const S2 = st as St & { hpow?: number; gdef?: number; gdmg?: number }; S2.hpow = (TL.hpow ?? 0) / 100; S2.gdef = Math.min(20, TL.gdef ?? 0) / 100; S2.gdmg = Math.min(20, TL.gdmg ?? 0) / 100; } /* 07/11: cura que você faz e auras de grupo */
    st.leech = (t.leech ?? 0) / 100 + (TL.leech ?? 0) / 100; st.xpMul = 1 + (t.xp ?? 0) / 100 + (hooks.xpBonus?.() ?? 0); st.goldMul = 1 + (t.gold ?? 0) / 100 + (Object.values(eqG).some((g) => g?.special === 'u_andvari') ? 0.6 : 0);
    st.auras = SLOTS.map((sl) => eqG[sl]).filter((g): g is Gear => !!g?.aura).sort((a, b) => (b.rarity === 'relic' ? 1 : 0) - (a.rarity === 'relic' ? 1 : 0)).map((g) => g.aura!);
    st.sp = new Set(Object.values(eqG).map((g) => g?.special).filter(Boolean) as string[]);
    { /* a mesa dos anões: prato e bebida ativos (15 min) */ const now = Date.now(); let hp = 0, stam = 0;
      for (const sl of ['meal', 'brew'] as const) { const e = st.feast?.[sl]; if (!e || e.until < now) continue; const f = FEASTS[e.id]; if (!f) continue; hp += f.hp ?? 0; stam += f.stam ?? 0; st.atk += f.dmg ?? 0; st.crit = Math.min(0.5, st.crit + (f.crit ?? 0)); st.move += f.move ?? 0; st.def = Math.max(0, Math.min(0.72, st.def + (f.def ?? 0))); st.regen += f.regen ?? 0; }
      /* a Aura de Alegria da festa (28/10): +10% de tudo por 1 turno */ if (((st as St & { joy?: number }).joy ?? 0) > now) { hp += 0.1; stam += 0.1; st.atk *= 1.1; st.crit = Math.min(0.5, st.crit * 1.1); st.move *= 1.1; st.def = Math.min(0.72, st.def * 1.1); st.regen *= 1.1; st.xpMul += 0.1; st.goldMul += 0.1; }
      if (hp) { st.hpMax = Math.round(st.hpMax * (1 + hp)); st.hp = Math.min(st.hp, st.hpMax); } (st as St & { feastStam?: number }).feastStam = stam; }
    hooks.onGear?.();
  }
  const hitRange = () => { const lp = 0.05 * (st.lvl - 1), m = st.atk, H = heroHand(st.lvl), fl = st.dmgFlat * (1 + 0.5 * lp); /* 07/11: mínimo e máximo dos dados da mão (mesma conta do combate) */ return [Math.max(1, Math.round((H.dice.length + H.bonus + fl) * m)), Math.round((H.dice.reduce((a, b) => a + b, 0) + H.bonus + fl) * m)]; };
  /* 07/11 (Erling: "do lado de Combate, uma ficha menor explicando isso dentro do conceito RPG: quantos dados e de quê, e os dados têm que
     bater com os valores do jogo"). A ficha de mesa traduz em dados EXATAMENTE as contas que o combate faz hoje (gameplay.ts):
     golpe = sorteio uniforme entre o mínimo e o máximo (= 1dN + K), crítico/esquiva/bloqueio = d100 contra a chance, defesa = redução */
  function diceSheet(lo: number, hi: number) {
    const lp = 0.05 * (st.lvl - 1), dex = st.attrs?.dex ?? 0, L = st.lvl, br = (v: number | string) => String(v).replace('.', ','), pc = (v: number) => Math.round(v * 100);
    const H = heroHand(L), acc = heroAcc(L, dex), cdSame = monCD(L, false, 0), need = needOf(cdSame, acc, 2, 12), needAg = needOf(monCD(L, true, 0), acc, 2, 12);
    const cF = critFaces(st.crit), critM = st.sp.has('r_mimir') ? 2.3 : 1.7, hcd = heroCD(L, dex, st.sp.has('dh_cloak')), mNeed = needOf(hcd, monAcc(L), 2, 8), bF = critFaces(Math.min(0.3, 0.03 + st.def * 0.5)), def = Math.max(-0.3, Math.min(0.75, st.def));
    const flat = Math.round(st.dmgFlat * (1 + 0.5 * lp)), bonus = Math.round(H.bonus);
    const card = (ic: string, t: string, dd: string, sub: string) => `<div class="dcard"><i>${ic}</i><div><span>${t}</span><small>${sub}</small></div><b>${dd}</b></div>`;
    const t = total(), face = (f: number) => f >= 20 ? '20' : `${f}–20`;
    return `<div class="pn alside dside"><h3>🎲 Ficha de Mesa</h3>
      <p class="alsd">Toda luta é rolagem de dados. Esta ficha mostra os dados que o jogo rola agora para o seu personagem — e serve para jogar KARMIKA numa mesa de verdade.</p>
      <div class="dlegend"><b>Como ler os dados</b><span><em>d20</em> = dado de 20 lados. <em>2d4</em> = dois dados de 4 lados somados. <em>+9</em> = some 9 ao que saiu.</span><span>Para acertar, role <em>d20 + Acerto</em>: se chegar na <em>CD</em> (a Defesa do alvo), acertou. <em>20</em> natural é sempre acerto crítico; <em>1</em> natural é sempre erro crítico.</span></div>
      <div class="dhead"><div><small>Vida</small><b>${st.hpMax}</b></div><div><small>Acerto</small><b>+${Math.round(acc)}</b></div><div><small>Sua CD</small><b>${Math.round(hcd)}</b></div><div><small>Crítico</small><b>${face(21 - cF)}</b></div></div>
      <h4>⚔ Quando você ataca <em>na ordem</em></h4>
      ${card('①', 'Rolagem de ataque', `d20 + ${Math.round(acc)}`, `contra um bicho do seu nível (CD ${Math.round(cdSame)}) você acerta tirando <b>${need}+</b>; bicho ágil: ${needAg}+. Cada 2,5 níveis que ele tiver acima de você: +1. Acerto = 8 + nível ÷ 2,5 + Destreza ÷ 12`)}
      ${card('②', 'Dano', `${fmtDice(H.dice)} + ${bonus}${flat ? ` + ${flat}` : ''}`, `${lo} a ${hi} depois do ataque ×${br(st.atk.toFixed(2))}${flat ? ` · +${flat} é a arma` : ''}. A cada faixa de nível a mão ganha dados (nv 10: +1d8 · nv 20: +1d12 · nv 40: +1d20). Magias rolam o golpe × a força delas e o grau soma +1d4/+1d8/+1d12/+1d20`)}
      ${card('③', 'Crítico', `${face(21 - cF)} no d20`, `o dano vira ×${br(critM)} (${Math.round(lo * critM)} a ${Math.round(hi * critM)}). Cada 5% de crítico abre mais uma face`)}
      ${card('④', 'Erro crítico', '1 no d20', 'sempre erra e você fica aberto por um instante: o próximo golpe do bicho não pode ser esquivado')}
      ${card('⑤', 'Armadura do alvo', '−6% a −60%', 'sobe 2,5% por nível que ele tiver acima de você; cada bicho ainda absorve alguns pontos por golpe')}
      <h4>🛡 Quando você é atacado <em>na ordem</em></h4>
      ${card('①', 'O bicho rola contra a sua CD', `CD ${Math.round(hcd)}`, `um bicho do seu nível precisa de <b>${mNeed}+</b> no d20 para te acertar (1 natural dele sempre erra). Sua CD = 10 + nível ÷ 2,5 + Destreza ÷ 4${st.sp.has('dh_cloak') ? ' + 2 da capa' : ''}`)}
      ${card('②', 'Bloqueio', `${face(21 - bF)} no d20`, 'um segundo d20: bloqueou, leva só 45% do golpe')}
      ${card('③', 'Defesa', `−${pc(def)}%`, 'o que passa perde essa parte · teto 75%')}
      <h4>📜 Para jogar na mesa</h4>
      <ul class="dmesa"><li>Dados: <b>1d20</b> e <b>${fmtDice(H.dice)}</b>.</li><li>Atributos: Força ${st.attrs.str + Math.round(t.str ?? 0)} · Destreza ${st.attrs.dex + Math.round(t.dex ?? 0)} · Vitalidade ${st.attrs.vit + Math.round(t.vit ?? 0)} · Energia ${st.attrs.int + Math.round(t.int ?? 0)}.</li><li>Os monstros usam a mesma regra: CD, dados de ataque e dados de vida estão no bestiário.</li></ul>
    </div>`;
  }
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
    const before = count(id); try { use0(id, it); } finally { if (count(id) < before) hooks.feel?.(it.kind === 'food' ? (/🧪|🍺|🍯|🔮|🫙|🩸|💉|🍷|🥛/.test(it.icon) || it.mp ? 'drink' : 'eat') : 'use', id); else if (isTool(id) && tools && Object.values(tools).includes(id)) hooks.feel?.('tool', id); }
  }
  function use0(id: string, it: Item) {
    if (it.kind === 'food') { if (it.mp) { if (st.mp >= st.mpMax) { game.logMsg('Sua magia já está cheia.'); return; } take(id); st.mp = Math.min(st.mp + it.mp, st.mpMax); game.logMsg(`${it.icon} +${it.mp} magia`, '#9ad7ff'); potionPulse('mp'); } else { if (st.hp >= st.hpMax && !it.buff) { game.logMsg('Sua vida já está cheia.'); return; } take(id); st.hp = Math.min(st.hpMax, st.hp + (it.heal ?? 10)); if ((it.heal ?? 10) > 0) game.logMsg(`${it.icon} +${it.heal ?? 10} vida`, '#7aff9a'); if (/potion|tonic/.test(id)) potionPulse(it.buff ? 'buff' : 'hp'); } if (it.buff) game.drinkBuff?.(it.buff); }
    else if (isTool(id)) equipTool(id);
    else if (!hooks.onUse?.(id)) game.logMsg(it.desc);
  }
  /** preço na prateleira: peças de facção têm preço da Tecelagem Real */
  /** preço de compra: o comerciante cobra conforme a alma de quem compra (Luz e Sombra, 24/10) */
  const pk = () => (shop && hooks.priceK ? hooks.priceK(shop) : 1);
  const buyP = (i: string) => Math.max(1, Math.round(PRICES[i] * pk()));
  const shopPrice = (g: Gear) => Math.round((g.fac ? FAC_PRICE[g.slot as 'cape' | 'shield' | 'relic'] : Math.max(6, g.value * 3)) * pk());
  const isHonorShop = () => !!(shop && SHOPDEF[shop]?.honor);
  const isKarmaShop = () => !!(shop && SHOPDEF[shop]?.karma); const karmaPrice = (slot: string) => Math.round(honorPrice(slot) * 0.5);
  /** onde a peça entra: anéis e brincos têm dois espaços (o vazio primeiro) */
  /* 02/11 (Erling): besta de mão com escudo ou uma em cada mão; pistola e escopeta de cano duplo com escudo, ou duas (pistolas, escopetas ou uma de cada).
     A segunda arma vai para o espaço do escudo (mão esquerda) quando a da mão direita é da mesma família e esse espaço está livre */
  const slotFor = (g: Gear): Slot => g.slot === 'weapon' && dualFam(g.base) && eqG.weapon && dualFam(eqG.weapon.base) === dualFam(g.base) && !eqG.shield ? 'shield' : g.slot === 'ring' ? (!eqG.ring ? 'ring' : !eqG.ring2 ? 'ring2' : 'ring') : g.slot === 'earring' ? (!eqG.earring ? 'earring' : !eqG.earring2 ? 'earring2' : 'earring') : g.slot;
  function equip(uid: number) {
    const i = gearBag.findIndex((g) => g.uid === uid); if (i < 0) return;
    if (wView !== wsets.act && (gearBag[i].slot === 'weapon' || gearBag[i].slot === 'shield')) { if (!usable(gearBag[i])) { game.logMsg(`Você ainda não pode usar ${gearBag[i].name}.`, '#ff9a8a'); return; } assignToView(gearBag[i]); return; }
    { const g0 = gearBag[i]; if (st.lvl < reqLvl(g0)) { game.logMsg(`Você precisa do nível ${reqLvl(g0)} para usar ${g0.name}.`, '#ff9a8a'); game.snd?.('error'); return; } { const why = hooks.canWear?.(g0); if (why) { game.logMsg(why, '#ff9a8a'); game.snd?.('error'); return; } } if (g0.fac && myFac() !== g0.fac) { game.logMsg(`⚑ Só quem jurou ${FAC[g0.fac].name} pode vestir este brasão. Os lados se escolhem no nível ${FAC_LVL}.`, '#ff9a8a'); game.snd?.('error'); return; } }
    const g = gearBag.splice(i, 1)[0], tg = slotFor(g), old = eqG[tg]; eqG[tg] = g; if (old) gearBag.push(old); hooks.feel?.('equip', String(g.slot));
    { const off = eqG.shield; if (tg === 'weapon' && off && off.slot === 'weapon' && dualFam(off.base) !== dualFam(g.base)) { eqG.shield = null; gearBag.push(off); game.logMsg(`${off.name} voltou para a bolsa: não combina com ${g.name} na outra mão.`, '#c8c0b0'); } }
    if (tg === 'shield' && g.slot === 'weapon') game.logMsg(`✦ ${g.name} na mão esquerda: uma arma em cada mão.`, '#ffe08a');
    if ((g.shop || g.fac) && !g.bound) { g.bound = true; game.logMsg(`🔒 ${g.name} agora está vinculado a você (não vai mais ao Leilão).`, '#b9c6e0'); }
    game.logMsg(`Equipou ${g.name}`, RARITY[g.rarity].col); recalc(); render(); save(); swapFx(tg, !!old);
  }
  const usable = (g: Gear) => st.lvl >= reqLvl(g) && !hooks.canWear?.(g) && !(g.fac && myFac() !== g.fac);
  function setMode(): 'dual' | 'shield' | 'two' | 'one' { const w = eqG.weapon, o = eqG.shield; if (o && o.slot === 'weapon') return 'dual'; if (o) return 'shield'; if (w && TWO_HANDED.test(w.base)) return 'two'; return 'one'; }
  /* 07/11 (Erling: "tem que ser conjunto 1, 2 e 3; Ctrl+roda só muda de um conjunto para o outro; clicando eu vejo os espaços de cada conjunto
     para pôr itens diferentes; os espaços são só mão 1 e mão 2, não conjuntos completos"). Cada conjunto guarda duas peças (mão 1, mão 2) por uid.
     O conjunto em uso está nas mãos (eqG.weapon/eqG.shield); os outros ficam na bolsa, reservados. */
  type WSet = { w: number | null; o: number | null };
  const SETK2 = 'karmika.wsets.v2';
  let wsets: { sets: WSet[]; act: number } = (() => { try { const v = JSON.parse(localStorage.getItem(SETK2) || 'null'); if (v && Array.isArray(v.sets) && v.sets.length === 3) return v; } catch { /* */ } const sets: WSet[] = [{ w: null, o: null }, { w: null, o: null }, { w: null, o: null }]; /* vinda do jeito antigo (dual/escudo/duas mãos): cada jeito lembrado vira um conjunto */
    try { const m = JSON.parse(localStorage.getItem('karmika.wsets.v1') || '{}') as Record<string, number[]>; let k = 1; for (const key of ['dual', 'shield', 'two']) { const u = m[key]; if (!u?.length || k > 2) continue; sets[k] = { w: u[0] ?? null, o: u[1] ?? null }; k++; } } catch { /* */ }
    return { sets, act: 0 }; })();
  let wView = wsets.act;
  const saveSets = () => { try { localStorage.setItem(SETK2, JSON.stringify(wsets)); } catch { /* */ } };
  const byUid = (u: number | null) => u == null ? null : gearBag.find((g) => g.uid === u) ?? [eqG.weapon, eqG.shield].find((g) => g?.uid === u) ?? null;
  /** o conjunto em uso sempre espelha o que está nas mãos */
  const syncAct = () => { const a = wsets.sets[wsets.act]; a.w = eqG.weapon?.uid ?? null; a.o = eqG.shield?.uid ?? null; };
  /** a peça de uma mão do conjunto mostrado na ficha (o em uso = as mãos; os outros = da bolsa) */
  function setHand(sl: 'weapon' | 'shield'): Gear | null { if (wView === wsets.act) return eqG[sl]; const z = wsets.sets[wView]; return byUid(sl === 'weapon' ? z.w : z.o); }
  /** pôr uma peça da bolsa num conjunto que não está em uso */
  function assignToView(g: Gear) { const z = wsets.sets[wView]; for (const q of wsets.sets) { if (q.w === g.uid) q.w = null; if (q.o === g.uid) q.o = null; }
    const w = byUid(z.w); if (g.slot === 'shield') { if (w && TWO_HANDED.test(w.base)) z.w = null; z.o = g.uid; }
    else if (TWO_HANDED.test(g.base)) { z.w = g.uid; z.o = null; }
    else if (w && !z.o && dualFam(w.base) && dualFam(w.base) === dualFam(g.base)) z.o = g.uid; else z.w = g.uid;
    { const o = byUid(z.o), w2 = byUid(z.w); if (o && o.slot === 'weapon' && (!w2 || dualFam(o.base) !== dualFam(w2.base))) z.o = null; }
    saveSets(); game.logMsg(`⚔ ${g.name} no conjunto ${['I', 'II', 'III'][wView]}.`, '#ffe08a'); render(); }
  function cycleWeapons(dir = 1) {
    syncAct(); const filled = (i: number) => !!(byUid(wsets.sets[i].w) || byUid(wsets.sets[i].o));
    let nx = wsets.act; for (let k = 1; k <= 3; k++) { const c = (wsets.act + dir * k + 9) % 3; if (filled(c)) { nx = c; break; } }
    if (nx === wsets.act) { game.logMsg('⚔ Só um conjunto montado. Abra o personagem (C) e clique em II ou III para montar os conjuntos II e III.', '#c8b890'); return; }
    useSet(nx); }
  /** põe nas mãos o conjunto pedido (botão "usar" da ficha e Ctrl + roda) */
  function useSet(nx: number) {
    syncAct(); if (nx === wsets.act) return;
    const want = wsets.sets[nx], gw = byUid(want.w), go = byUid(want.o);
    for (const g of [gw, go]) if (g && !usable(g)) { game.logMsg(`⚔ Você ainda não pode usar ${g.name}.`, '#ff9a8a'); return; }
    for (const sl of ['weapon', 'shield'] as const) { const g = eqG[sl]; if (g) { eqG[sl] = null; gearBag.push(g); } }
    for (const [sl, g] of [['weapon', gw], ['shield', go]] as const) if (g) { const j = gearBag.indexOf(g); if (j >= 0) gearBag.splice(j, 1); eqG[sl] = g; }
    if (wView === wsets.act) wView = nx; wsets.act = nx; saveSets();
    game.logMsg(`⚔ Conjunto ${['I', 'II', 'III'][nx]}: ${[gw, go].filter(Boolean).map((g) => g!.name).join(' + ') || 'mãos vazias'}`, '#ffe08a'); hooks.feel?.('equip', 'weapon'); recalc(); render(); save(); swapFx('weapon', true); }
  /** troca visível (25/10): a peça some do espaço por meio segundo e volta brilhando, com som de troca */
  function swapFx(slot: Slot, had: boolean) {
    game.snd?.('swap');
    const el = ch.querySelector(`.eqs.${slot}`) as HTMLElement | null; if (!el) return;
    el.classList.remove('swapin'); el.classList.add('swapout'); void el.offsetWidth;
    setTimeout(() => { const e2 = ch.querySelector(`.eqs.${slot}`) as HTMLElement | null; if (!e2) return; e2.classList.remove('swapout'); void e2.offsetWidth; e2.classList.add('swapin'); setTimeout(() => e2.classList.remove('swapin'), 650); }, 500);
    void had;
  }
  function unequip(slot: Slot) { if (wView !== wsets.act && (slot === 'weapon' || slot === 'shield')) { const z = wsets.sets[wView]; if (slot === 'weapon') z.w = null; else z.o = null; saveSets(); render(); return; } const g = eqG[slot]; if (!g) return; eqG[slot] = null; gearBag.push(g); if (slot === 'weapon' && eqG.shield?.slot === 'weapon') { eqG.weapon = eqG.shield; eqG.shield = null; } /* sem a da direita, a da esquerda passa para a mão boa */ recalc(); render(); save(); }
  function craft(rid: string) {
    const r = RECIPES.find((x) => x.id === rid)!; if (!r.need.every(([i, n]) => has(i, n)) || !(r.keep ?? []).every((k) => has(k))) { game.logMsg('Faltam materiais.', '#ff9a8a'); return; }
    if (r.out === 'fire') { if (!hooks.placeFire()) return; for (const [i, n] of r.need) take(i, n); game.logMsg('🔥 Fogueira acesa!', '#ffb060'); close(); return; }
    for (const [i, n] of r.need) take(i, n); add(r.out, r.n); game.logMsg(`Você criou ${ITEMS[r.out].name}`, '#ffe08a'); hooks.onCraft?.(ITEMS[r.out].name);
  }
  /* 11/11 (Erling: "ponto dado quando passamos de nível pode ser retirado enquanto não for salvo: não é dar o ponto e perder ele, é dar o ponto e salvar depois"):
     o + põe o ponto na hora (os números já mudam, para você ver o efeito), mas ele fica PENDENTE: dá para tirar com o − até apertar Salvar. */
  const PENDK = 'karmika.attr.pend'; let pend: Partial<Record<Attr, number>> = (() => { try { return JSON.parse(localStorage.getItem(PENDK) || '{}'); } catch { return {}; } })();
  const pendSave = () => { try { localStorage.setItem(PENDK, JSON.stringify(pend)); } catch { /* */ } }, pendN = () => Object.values(pend).reduce((a: number, b) => a + (b ?? 0), 0);
  function spend(k: Attr) { if (st.points <= 0) return; st.points--; st.attrs[k]++; pend[k] = (pend[k] ?? 0) + 1; pendSave(); recalc(); render(); save(); }
  function unspend(k: Attr) { if (!(pend[k] ?? 0)) return; pend[k]!--; st.points++; st.attrs[k]--; pendSave(); recalc(); render(); save(); }
  function pendConfirm() { const n = pendN(); if (!n) return; pend = {}; pendSave(); game.logMsg(`✔ ${n} ponto${n === 1 ? '' : 's'} de atributo salvo${n === 1 ? '' : 's'}.`, '#ffe08a'); render(); }
  function pendUndo() { for (const a of ATTRS) { const n = pend[a.k] ?? 0; if (n) { st.points += n; st.attrs[a.k] -= n; } } pend = {}; pendSave(); recalc(); render(); save(); }

  const bar = (v: number, m: number, c: string) => `<div class="bar"><i style="width:${Math.max(0, Math.min(100, v / m * 100))}%;background:${c}"></i></div>`;
  // (resumo de status dos itens: hoje mostrado só no tooltip)
  const cell = (g: Gear, attrs: string) => { const bad = st.lvl < reqLvl(g) || (!!g.fac && myFac() !== g.fac) || !!hooks.canWear?.(g); /* 02/11: arma que a classe não usa também fica vermelha */ return `<div class="it gi gi2 r-${g.rarity} ${bad ? 'noreq' : ''}" draggable="true" data-drag="g:${g.uid}" ${attrs} style="--rc:${RARITY[g.rarity].col}"><span>${gearEmoji(g)}</span><i class="rgem"></i><b style="color:${bad ? '#ff4a4a' : RARITY[g.rarity].col}" title="nível de uso">${reqLvl(g)}</b><small style="color:${RARITY[g.rarity].col}">${g.name}</small></div>`; };
  /** a aba ⚛ Reator: o cilindro cortado no meio e os seis encaixes em volta */
  function reactorTab() { const R = hooks.reactor!(), P = loadParts(), filled = REACTOR_PARTS.filter((q) => (P[q.id] ?? 0) >= q.n).length;
    const slot = (q: ReactorPart) => { const have = P[q.id] ?? 0, inBag = bag[q.id] ?? 0, it = ITEMS[q.id], ok = have >= q.n;
      return `<button class="rslot ${ok ? 'ok' : inBag >= q.n - have ? 'can' : ''}" data-rslot="${q.id}" title="${it?.name ?? q.id}: ${it?.desc ?? ''}"><span class="ic">${it?.icon ?? '?'}</span><b>${q.label}</b><small>${it?.name ?? q.id}</small><i>${ok ? '✔ encaixado' : `${have}/${q.n} · mochila: ${inBag}`}</i></button>`; };
    return `<div class="rtab"><div class="rcol">${REACTOR_PARTS.slice(0, 3).map(slot).join('')}</div><div class="rmid">${reactorSvg(R.charge, fusing, filled)}<div class="rinfo"><b>${Math.round(R.charge * R.cap).toLocaleString('pt-BR')}</b> / ${R.cap.toLocaleString('pt-BR')} de Energia</div></div><div class="rcol">${REACTOR_PARTS.slice(3).map(slot).join('')}</div>
      <p class="rhint">Clique num encaixe para pôr a peça da mochila. Com os seis cheios, as peças se fundem no cilindro e o reator volta à carga máxima. A Energia só gasta com as magias — o Núcleo de Reator pronto (Companhia de Latão) também enche.</p></div>`; }
  /* 07/11 (Erling: "mudar as bolsas de ordem para não ficar espaços vazios; e do lado de fora uma fileira com o desenho de cada bolsa;
     clicar numa bolsa abre só ela embaixo da tela, para deixar uma aberta e ir vendo o que pego; a premium aparece, mas apagada se o Premium acabar") */
  const spF = (id: string) => sellPrice(id);
  const tagF = (v: number) => shop && v > 0 ? `<i class="ptag">🪙${v}</i>` : '';
  /* 07/11 (Erling: "um botão de configuração das bolsas: transparência, que bolsa recebe o quê, a ordem dos itens; e trocar as bolsas de lugar") */
  type BagCat = 'equip' | 'consumo' | 'material' | 'missao' | 'outros';
  const CATS: { k: BagCat; n: string; ic: string }[] = [{ k: 'equip', n: 'Equipamentos', ic: '⚔' }, { k: 'consumo', n: 'Comida e poções', ic: '🍖' }, { k: 'material', n: 'Materiais', ic: '🪵' }, { k: 'missao', n: 'Itens de missão', ic: '📜' }, { k: 'outros', n: 'O resto', ic: '✦' }];
  interface BagCfg { op: number; sort: 'tipo' | 'nome' | 'valor'; route: Record<string, BagCat[]>; order: string[] }
  let bagCfg: BagCfg = (() => { const d: BagCfg = { op: 1, sort: 'tipo', route: {}, order: [] }; try { return { ...d, ...JSON.parse(localStorage.getItem('karmika.bagcfg') || '{}') }; } catch { return d; } })();
  const saveCfg = () => { try { localStorage.setItem('karmika.bagcfg', JSON.stringify(bagCfg)); } catch { /* */ } };
  const catOf = (ref: string): BagCat => { if (ref.startsWith('g:')) return 'equip'; const it = ITEMS[ref.slice(2)]; if (!it) return 'outros'; if (it.quest) return 'missao'; if (it.kind === 'food') return 'consumo'; if (it.kind === 'res' || CRAFT_BAG.has(ref.slice(2)) || MAGIC_BAG.has(ref.slice(2))) return 'material'; return 'outros'; };
  /** as células da mochila, na ordem: equipamentos, depois pilhas, depois o excesso das bolsas de ofício */
  function cellsNow(): string[] {
    const order = ['relic', 'unique', 'epic', 'legendary', 'rare', 'magic', 'normal'];
    const sorted = [...gearBag].sort((a, b) => bagCfg.sort === 'nome' ? a.name.localeCompare(b.name) : bagCfg.sort === 'valor' ? (b.value ?? 0) - (a.value ?? 0) : order.indexOf(a.rarity) - order.indexOf(b.rarity) || b.ilvl - a.ilvl);
    // células: equipamentos primeiro, depois pilhas de até 99 (material: 10.000)
    const sp = spF;
    const tag = tagF;
    const cells: string[] = sorted.map((g) => cell(g, `data-g="b:${g.uid}" data-eq="${g.uid}"`).replace('</div>', `${tag(g.value)}</div>`));
    for (const i of Object.keys(bag).filter((k) => bag[k] > 0 && !freeBag(k)).sort((a, b) => bagCfg.sort === 'nome' ? (ITEMS[a]?.name ?? a).localeCompare(ITEMS[b]?.name ?? b) : bagCfg.sort === 'valor' ? spF(b) - spF(a) : (ITEMS[a]?.kind ?? '').localeCompare(ITEMS[b]?.kind ?? '') || a.localeCompare(b))) { let left = bag[i]; while (left > 0) { const n = Math.min(stackOf(i), left); left -= n; cells.push(`<div class="it ${ITEMS[i]?.kind ?? ''} ${ITEMS[i]?.quest ? 'qitem' : ''} c-${catOf('i:' + i)}" draggable="true" data-drag="i:${i}:${n}" data-use="${i}" title="${ITEMS[i]?.name}: ${ITEMS[i]?.desc}${shop ? (sp(i) > 0 ? ` — vende por ${sp(i)} cada (clique: 1 · Ctrl: 50 · Shift: tudo)` : ' — este comerciante não compra') : ''}"><span>${ITEMS[i]?.icon}</span><b>${n}</b><small>${ITEMS[i]?.name}</small>${tag(sp(i))}</div>`); } }
    { const ov = overflow(); for (let q = 0; q < ov; q++) cells.push(`<div class="it ovf" title="Excesso das Bolsas de Ofício/Mágica: o material que não coube nelas ocupa este espaço da mochila. Venda, use ou guarde no baú para liberar.">📦</div>`); }
    return cells;
  }
  interface BagG { key: string; name: string; icon: string; n: number; on: boolean; why?: string }
  /** as bolsas na ordem da tela: a mochila primeiro, depois as maiores (sem buraco entre bolsas de tamanhos diferentes). Apagadas = Premium acabou */
  function bagGroups(): BagG[] {
    const ext: BagG[] = [{ key: 'gift', name: 'Bolsa do Caminhante (Premium)', icon: PREMIUM_BAG_ICON, n: GIFT_BAG, on: isPremium(), why: 'O Premium acabou: a Bolsa do Caminhante volta quando ele voltar.' },
      ...bags.map((b, i) => ({ key: `x${i}:${b}`, name: ITEMS[b]?.name ?? b, icon: ITEMS[b]?.icon ?? '👝', n: BAGS[b] ?? 0, on: !PREMIUM_BAGS.has(b) || isPremium(), why: PREMIUM_BAGS.has(b) ? 'Bolsa Premium: fica apagada enquanto o Premium estiver desligado.' : undefined }))];
    ext.sort((a, b) => Number(b.on) - Number(a.on) || b.n - a.n);
    if (bagCfg.order.length) { const ix = (k: string) => { const i = bagCfg.order.indexOf(k); return i < 0 ? 999 : i; }; const all = [{ key: 'b0', name: 'Mochila', icon: '🎒', n: 16, on: true } as BagG, ...ext].sort((a, b) => ix(a.key) - ix(b.key)); return all; } /* a ordem que o jogador arrastou na fileira */
    return [{ key: 'b0', name: 'Mochila', icon: '🎒', n: 16, on: true }, ...ext];
  }
  /** as células de cada bolsa ligada */
  /* 07/11 (Erling: "passar itens de uma bolsa para outra"): arrastar um item para uma bolsa o PRENDE nela (pilha ou peça); o resto enche na ordem */
  let pins: Record<string, string> = (() => { try { return JSON.parse(localStorage.getItem('karmika.bagpin') || '{}'); } catch { return {}; } })();
  const savePins = () => { try { localStorage.setItem('karmika.bagpin', JSON.stringify(pins)); } catch { /* */ } };
  const refKey = (c: string) => { const m = /data-drag="([ig]):([^:"]+)/.exec(c); return m ? `${m[1]}:${m[2]}` : null; };
  function bagCells(): Map<string, string[]> {
    const cells = cellsNow(), G = bagGroups().filter((g) => g.on), M = new Map<string, string[]>(G.map((g) => [g.key, []])), rest: string[] = [];
    const routed = (k: string | null) => { if (!k) return undefined; const c = catOf(k); return G.find((g) => (bagCfg.route[g.key] ?? []).includes(c))?.key; }; /* a bolsa que recebe esta categoria */
    for (const c of cells) { const k = refKey(c), pk = (k ? pins[k] : undefined) ?? routed(k), L = pk ? M.get(pk) : undefined, g = pk ? G.find((x) => x.key === pk) : undefined; if (L && g && L.length < g.n) L.push(c); else rest.push(c); }
    for (const g of G) { const L = M.get(g.key)!; while (L.length < g.n && rest.length) L.push(rest.shift()!); }
    return M;
  }
  const specialList = () => isPremium() ? [{ key: 'craft', name: 'Bolsa de Ofício', icon: '🧰', set: CRAFT_BAG, cap: CRAFT_CAP }, { key: 'magic', name: 'Bolsa Mágica', icon: '🔮', set: MAGIC_BAG, cap: MAGIC_CAP }] : [];
  const specialCells = (set: Set<string>) => [...set].filter((k) => (bag[k] ?? 0) > 0).map((i) => `<div class="it ${ITEMS[i]?.kind ?? ''}" draggable="true" data-drag="i:${i}:${bag[i]}" data-use="${i}" title="${ITEMS[i]?.name}: ${ITEMS[i]?.desc}"><span>${ITEMS[i]?.icon}</span><b>${bag[i]}</b><small>${ITEMS[i]?.name}</small>${tagF(spF(i))}</div>`);
  /* a fileira de bolsas (embaixo, à direita do orbe) e a bolsa aberta sozinha */
  const bagBarEl = document.createElement('div'); bagBarEl.id = 'bagbar'; document.body.appendChild(bagBarEl);
  const mini = document.createElement('div'); mini.id = 'bagmini'; document.body.appendChild(mini);
  /* 07/11 (Erling: "menor uns 40%, a fileira do tamanho do acesso rápido e que eu possa mover; clicando abre uma de cada vez, com Ctrl várias") */
  let openBags: string[] = (() => { try { return JSON.parse(localStorage.getItem('karmika.bagmini2') || '[]'); } catch { return []; } })();
  const saveOpen = () => { try { localStorage.setItem('karmika.bagmini2', JSON.stringify(openBags)); } catch { /* */ } };
  const toggleBag = (k: string, multi: boolean) => { const on = openBags.includes(k); openBags = multi ? (on ? openBags.filter((x) => x !== k) : [...openBags, k]) : (on && openBags.length === 1 ? [] : [k]); saveOpen(); render(); };
  /** onde a fileira está: arrastada pelo jogador (guardado) ou, sem isso, colada à direita do orbe do recurso */
  let barPos: { l: number; b: number } | null = (() => { try { return JSON.parse(localStorage.getItem('karmika.bagbarpos') || 'null'); } catch { return null; } })();
  const uiK = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ui')) || 1;
  let bagPos: Record<string, { l: number; b: number }> = (() => { try { return JSON.parse(localStorage.getItem('karmika.bagpos') || '{}'); } catch { return {}; } })();
  let scaleC: { ui: number; w: number; h: number; kx: number; x0: number; y0: number } | null = null; /* 07/11: a escala medida uma vez (não a cada 2 s: medir força o navegador a recalcular a página) */
  const placeBar = () => { const ui = uiK(), bw = bagBarEl.offsetWidth * ui, bh = bagBarEl.offsetHeight * ui; let L: number, B: number;
    if (barPos) { L = barPos.l; B = barPos.b; } else { const o = document.getElementById('mp')?.getBoundingClientRect(); if (!o || !o.width) return; L = Math.round(o.right + 14); B = Math.round(innerHeight - o.bottom + 4); if (L + bw > innerWidth - 8) { L = Math.round(innerWidth - bw - 10); B = Math.round(innerHeight - o.top + 8); } }
    L = Math.max(4, Math.min(innerWidth - bw - 4, L)); B = Math.max(2, Math.min(innerHeight - bh - 4, B));
    bagBarEl.style.left = L + 'px'; bagBarEl.style.bottom = B + 'px';
    /* 07/11 (Erling: "devia abrir para cima e não para o lado"): as bolsas abertas se empilham para CIMA a partir da fileira, alinhadas
       pela direita; quando a pilha chega no alto da tela, começa outra coluna à esquerda */
    const ps = Array.from(mini.querySelectorAll<HTMLElement>('.pn.bm')); let right = Math.min(innerWidth - 4, L + bw), y = B + bh + 6, colW = 0, n = 0;
    /* a escala real das coordenadas (a interface tem zoom/escala): mede uma vez, colocando a primeira bolsa em 0 e em 100 */
    let kx = ui, x0 = 0, y0 = 0; if (scaleC && scaleC.ui === ui && scaleC.w === innerWidth && scaleC.h === innerHeight) ({ kx, x0, y0 } = scaleC); else if (ps[0]) { ps[0].style.transition = 'none'; const p = ps[0]; p.style.left = '0px'; p.style.bottom = '0px'; const a = p.getBoundingClientRect(); p.style.left = '100px'; const b2 = p.getBoundingClientRect(); kx = (b2.left - a.left) / 100 || ui; x0 = a.left; y0 = innerHeight - a.bottom; scaleC = { ui, w: innerWidth, h: innerHeight, kx, x0, y0 }; }
    for (const p of ps) { const rr = p.getBoundingClientRect(), w = rr.width, h = rr.height;
      { const fp = bagPos[p.dataset.bmk!]; if (fp) { const x = Math.max(0, Math.min(innerWidth - w, fp.l)), yy = Math.max(0, Math.min(innerHeight - h, fp.b)); p.style.left = (x - x0) / kx + 'px'; p.style.bottom = (yy - y0) / kx + 'px'; continue; } }
      if (n && y + h > innerHeight - 6) { right -= colW + 6; y = B + bh + 6; colW = 0; n = 0; }
      const x = Math.max(4, right - w), yy = Math.max(2, Math.min(innerHeight - h - 4, y)); p.style.left = (x - x0) / kx + 'px'; p.style.bottom = (yy - y0) / kx + 'px'; y = yy + h + 6; colW = Math.max(colW, w); n++; } };
  addEventListener('resize', () => requestAnimationFrame(placeBar)); setInterval(placeBar, 2000);
  function renderBar(M: Map<string, string[]>) {
    const G = bagGroups(), free = Math.max(0, MAX_BAGS - bags.length), cur = (k: string) => openBags.includes(k) ? 'cur' : '';
    bagBarEl.innerHTML = '<i class="bbgrip" title="Arraste para mover a fileira de bolsas · clique duplo: volta para o lugar de sempre">⋮</i>' + G.map((g) => { const u = M.get(g.key)?.length ?? 0; return `<button data-bb="${g.key}" draggable="true" class="${g.on ? '' : 'off'} ${cur(g.key)} ${g.on && u >= g.n ? 'full' : ''}" title="${g.name}${g.on ? ` — ${u}/${g.n} · clique: abrir · Ctrl+clique: abrir junto com as outras` : ` — ${g.why ?? 'desligada'}`}"><span>${g.icon}</span><i>${g.on ? `${u}/${g.n}` : '✦'}</i></button>`; }).join('')
      + specialList().map((q) => `<button data-bb="${q.key}" class="spec ${cur(q.key)}" title="${q.name} — ${stacksIn(q.set)}/${q.cap} · clique: abrir · Ctrl+clique: abrir junto"><span>${q.icon}</span><i>${stacksIn(q.set)}/${q.cap}</i></button>`).join('')
      + Array.from({ length: free }, () => '<button class="slot" disabled title="Lugar livre para bolsa: pegue uma bolsa e ela se equipa sozinha"><span>＋</span></button>').join('')
      + '<button data-bbcfg title="Configurar as bolsas: transparência, o que cada uma recebe e a ordem dos itens" class="cfg"><span>⚙</span></button><button data-bball title="Abrir a mochila inteira (I)" class="all"><span>🗂</span><i>I</i></button>';
  }
  /** o tamanho de cada bolsa aberta, quando o jogador estica pelo canto */
  let bagSize: Record<string, { w: number; h: number }> = (() => { try { return JSON.parse(localStorage.getItem('karmika.bagsize') || '{}'); } catch { return {}; } })();
  mini.addEventListener('pointerup', () => { let ch = false; mini.querySelectorAll<HTMLElement>('.pn.bm').forEach((p) => { const k = p.dataset.bmk!, w = Math.round(p.offsetWidth), h = Math.round(p.offsetHeight), o = bagSize[k];
    if (p.style.width || p.style.height) { if (!o || Math.abs(o.w - w) > 2 || Math.abs(o.h - h) > 2) { bagSize[k] = { w, h }; p.classList.add('sized'); ch = true; } } }); if (ch) { try { localStorage.setItem('karmika.bagsize', JSON.stringify(bagSize)); } catch { /* */ } placeBar(); } });
  /* 07/11 (Erling: "deixar a bolsa aberta onde eu quiser; a posição fica lembrada mesmo fechando ou saindo do jogo; pode ter uma grade invisível"):
     arrastar pelo título solta a bolsa no lugar, encaixando numa grade invisível de 12 px. Clique duplo no título devolve à pilha e ao tamanho certo */
  const GRID = 12;
  mini.addEventListener('pointerdown', (e) => { const t = e.target as HTMLElement; if (t.closest('button')) return; const h = t.closest('.pn.bm h2') as HTMLElement | null, p = h?.parentElement as HTMLElement | null; if (!p) return; e.preventDefault(); e.stopPropagation();
    const k = p.dataset.bmk!, r0 = p.getBoundingClientRect(), dx = e.clientX - r0.left, dy = r0.bottom - e.clientY; p.classList.add('dragging');
    const mv = (ev: PointerEvent) => { const r = p.getBoundingClientRect(); let l = ev.clientX - dx, b = innerHeight - ev.clientY - dy; l = Math.round(l / GRID) * GRID; b = Math.round(b / GRID) * GRID;
      l = Math.max(0, Math.min(innerWidth - r.width, l)); b = Math.max(0, Math.min(innerHeight - r.height, b)); bagPos[k] = { l, b }; placeBar(); };
    const up = () => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); p.classList.remove('dragging'); try { localStorage.setItem('karmika.bagpos', JSON.stringify(bagPos)); } catch { /* */ } };
    addEventListener('pointermove', mv); addEventListener('pointerup', up); });
  mini.addEventListener('dblclick', (e) => { const h = (e.target as HTMLElement).closest('.pn.bm h2'), p = h?.parentElement as HTMLElement | null; if (!p) return; delete bagSize[p.dataset.bmk!]; delete bagPos[p.dataset.bmk!]; try { localStorage.setItem('karmika.bagpos', JSON.stringify(bagPos)); } catch { /* */ } try { localStorage.setItem('karmika.bagsize', JSON.stringify(bagSize)); } catch { /* */ } render(); }); /* clique duplo no título: volta ao tamanho certo */
  /* 07/11 (Erling: "se eu redimensiono a bolsa, redimensiona os quadrados dos slots"): a bolsa esticada pelo canto recalcula colunas e
     o tamanho de cada casa para encher a janela, sem sobrar fundo vazio */
  const fitCells = (p: HTMLElement) => { const gr = p.querySelector<HTMLElement>('.grid'); if (!gr) return;
    if (!p.classList.contains('sized') && !p.style.width && !p.style.height) { gr.style.gridTemplateColumns = ''; gr.style.removeProperty('--cs'); gr.classList.remove('fit'); return; }
    const n = gr.children.length, hh = (p.querySelector('h2') as HTMLElement | null)?.offsetHeight ?? 18, W = p.clientWidth - 12, H = p.clientHeight - hh - 12, G = 3; if (!n || W < 20 || H < 20) return;
    let best = 0, bc = 1; for (let c = 1; c <= n; c++) { const r = Math.ceil(n / c), sz = Math.min((W - (c - 1) * G) / c, (H - (r - 1) * G) / r); if (sz > best) { best = sz; bc = c; } }
    const sz = Math.max(20, Math.min(72, Math.floor(best))); gr.style.gridTemplateColumns = `repeat(${bc}, ${sz}px)`; gr.style.setProperty('--cs', sz + 'px'); gr.classList.add('fit'); };
  const cellRO = new ResizeObserver((es) => { for (const e of es) fitCells(e.target as HTMLElement); });
  function renderMini(M: Map<string, string[]>) {
    const SP = specialList(), G = bagGroups(); openBags = openBags.filter((k) => SP.some((q) => q.key === k) || G.some((g) => g.key === k && g.on));
    if (!openBags.length || open) { mini.style.display = 'none'; return; }
    mini.innerHTML = openBags.map((k) => { const sp = SP.find((q) => q.key === k), g = G.find((q) => q.key === k);
      const cells = sp ? specialCells(sp.set) : M.get(k) ?? [], n = sp ? Math.max(6, Math.ceil(cells.length / 6) * 6) : g!.n;
      const empties = Array.from({ length: Math.max(0, n - cells.length) }, () => '<div class="it empty"></div>').join('');
      const sz = bagSize[k]; const st2 = sz ? ` style="width:${sz.w}px;height:${sz.h}px"` : '';
      return `<div class="pn bm ${sz ? 'sized' : ''}" data-bmk="${k}"${st2}><h2><span>${sp ? sp.icon : g!.icon}</span>${sp ? sp.name : g!.name}<small>${sp ? `${stacksIn(sp.set)}/${sp.cap}` : `${cells.length}/${g!.n}`}</small><button data-mx="${k}" title="Fechar esta bolsa">✕</button></h2><div class="grid g6 ${n > 32 ? 'tall' : ''}" ${sp ? '' : `data-bagkey="${k}"`}>${cells.join('')}${empties}</div></div>`; }).join('');
    mini.style.display = 'block'; cellRO.disconnect(); mini.querySelectorAll<HTMLElement>('.pn.bm').forEach((p) => { fitCells(p); cellRO.observe(p); }); requestAnimationFrame(placeBar);
  }
  /* a janelinha de configuração das bolsas (⚙ na fileira) */
  const cfgEl = document.createElement('div'); cfgEl.id = 'bagcfg'; cfgEl.className = 'pn'; document.body.appendChild(cfgEl); let cfgOpen = false;
  function renderCfg() {
    if (!cfgOpen) { cfgEl.style.display = 'none'; return; }
    const G = bagGroups().filter((g) => g.on);
    cfgEl.innerHTML = `<h2>⚙ Bolsas<button data-cfgx title="Fechar">✕</button></h2>
      <label class="bcrow"><span>Transparência das bolsas abertas</span><input type="range" min="30" max="100" step="5" value="${Math.round(bagCfg.op * 100)}" data-cfgop><b>${Math.round(bagCfg.op * 100)}%</b></label>
      <label class="bcrow"><span>Ordem dos itens</span><select data-cfgsort><option value="tipo" ${bagCfg.sort === 'tipo' ? 'selected' : ''}>por tipo e raridade</option><option value="nome" ${bagCfg.sort === 'nome' ? 'selected' : ''}>por nome</option><option value="valor" ${bagCfg.sort === 'valor' ? 'selected' : ''}>por valor (o mais caro primeiro)</option></select></label>
      <h3>O que cada bolsa recebe</h3><small class="bchint">Marque as categorias: o que for pego vai primeiro para essa bolsa (se tiver espaço). Item arrastado para uma bolsa fica preso nela.</small>
      <div class="bcroutes">${G.map((g) => `<div class="bcr"><b>${g.icon} ${g.name}</b><span>${CATS.map((c) => `<button data-rt="${g.key}|${c.k}" class="${(bagCfg.route[g.key] ?? []).includes(c.k) ? 'on' : ''}" title="${c.n}">${c.ic}</button>`).join('')}</span></div>`).join('')}</div>
      <small class="bchint">Para trocar as bolsas de lugar, arraste os botões na fileira.</small>
      <div class="sorow"><button data-cfgreset class="ghost">Restaurar o padrão</button></div>`;
    cfgEl.style.display = 'block'; const r = bagBarEl.getBoundingClientRect(); cfgEl.style.left = Math.max(6, Math.min(innerWidth - cfgEl.offsetWidth - 6, r.right - cfgEl.offsetWidth)) + 'px'; cfgEl.style.bottom = (innerHeight - r.top + 8) + 'px';
  }
  cfgEl.addEventListener('click', (e) => { const t = e.target as HTMLElement;
    if (t.closest('[data-cfgx]')) { cfgOpen = false; renderCfg(); return; }
    if (t.closest('[data-cfgreset]')) { bagCfg = { op: 1, sort: 'tipo', route: {}, order: [] }; pins = {}; savePins(); saveCfg(); render(); return; }
    const rt = (t.closest('[data-rt]') as HTMLElement | null)?.dataset.rt; if (rt) { const [k, c] = rt.split('|') as [string, BagCat]; const on = (bagCfg.route[k] ?? []).includes(c); /* uma categoria vai para uma bolsa só */ for (const kk of Object.keys(bagCfg.route)) { bagCfg.route[kk] = bagCfg.route[kk].filter((x) => x !== c); if (!bagCfg.route[kk].length) delete bagCfg.route[kk]; } if (!on) bagCfg.route[k] = [...(bagCfg.route[k] ?? []), c]; saveCfg(); render(); } });
  cfgEl.addEventListener('input', (e) => { const t = e.target as HTMLInputElement; if (t.dataset.cfgop !== undefined) { bagCfg.op = +t.value / 100; (t.nextElementSibling as HTMLElement).textContent = t.value + '%'; mini.style.setProperty('--bmop', String(bagCfg.op)); saveCfg(); } });
  cfgEl.addEventListener('change', (e) => { const t = e.target as HTMLSelectElement; if (t.dataset.cfgsort !== undefined) { bagCfg.sort = t.value as BagCfg['sort']; saveCfg(); render(); } });
  mini.style.setProperty('--bmop', String(bagCfg.op));
  /* trocar as bolsas de lugar: arrastar um botão da fileira para cima de outro */
  let barDrag: string | null = null;
  bagBarEl.addEventListener('dragstart', (e) => { const b = (e.target as HTMLElement).closest('[data-bb]') as HTMLElement | null; if (!b) return; barDrag = b.dataset.bb!; e.dataTransfer?.setData('text/plain', 'bag'); e.stopPropagation(); });
  bagBarEl.addEventListener('dragover', (e) => { if (barDrag && (e.target as HTMLElement).closest('[data-bb]')) e.preventDefault(); });
  bagBarEl.addEventListener('drop', (e) => { const b = (e.target as HTMLElement).closest('[data-bb]') as HTMLElement | null; if (!barDrag || !b) return; e.preventDefault(); e.stopPropagation(); const to = b.dataset.bb!, cur = bagGroups().map((g) => g.key); const from = barDrag; barDrag = null; if (from === to) return;
    const L = cur.filter((k) => k !== from); L.splice(L.indexOf(to) + (cur.indexOf(from) < cur.indexOf(to) ? 1 : 0), 0, from); bagCfg.order = L; saveCfg(); render(); });
  bagBarEl.addEventListener('dragend', () => { barDrag = null; });
  bagBarEl.addEventListener('click', (e) => { const t = e.target as HTMLElement; if (t.closest('[data-bbcfg]')) { cfgOpen = !cfgOpen; renderCfg(); return; } if (t.closest('[data-bball]')) { open = !open; if (!open) { shop = null; vaultOpen = false; } render(); return; }
    const b = t.closest('[data-bb]') as HTMLElement | null; if (!b) return; if (b.classList.contains('off')) { game.logMsg(`✦ ${b.title.split(' — ')[1] ?? 'Bolsa desligada.'}`, '#c9a0ff'); return; } toggleBag(b.dataset.bb!, e.ctrlKey || e.metaKey); });
  /* arrastar a fileira pela alça ⋮ (fica guardado); clique duplo na alça devolve ao lugar de sempre */
  bagBarEl.addEventListener('pointerdown', (e) => { if (e.button !== 0) return; if (!(e.target as HTMLElement).closest('.bbgrip')) return; e.preventDefault(); const r = bagBarEl.getBoundingClientRect(), dx = e.clientX - r.left, dy = r.bottom - e.clientY;
    const mv = (ev: PointerEvent) => { barPos = { l: Math.round(ev.clientX - dx), b: Math.round(innerHeight - ev.clientY - dy) }; placeBar(); };
    const up = () => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); try { localStorage.setItem('karmika.bagbarpos', JSON.stringify(barPos)); } catch { /* */ } };
    addEventListener('pointermove', mv); addEventListener('pointerup', up); });
  bagBarEl.addEventListener('dblclick', (e) => { if (!(e.target as HTMLElement).closest('.bbgrip')) return; barPos = null; try { localStorage.removeItem('karmika.bagbarpos'); } catch { /* */ } placeBar(); });
  function render() {
    tipCtx.lvl = st.lvl; tipCtx.fac = myFac(); tipCtx.why = hooks.canWear;
    tip.style.display = 'none'; hooks.onBag?.();
    if (open) {
      const cells = cellsNow(), sp = spF, tag = tagF; void cells;
      const sec = (key: string, head: string, count: string, body: string, extra = '') => `<section class="acc ${accClosed.has(key) ? 'closed' : ''} ${extra}"><h3 data-acct="${key}"><i class="car">▾</i>${head}<small>${count}</small></h3><div class="accb">${body}</div></section>`;
      const special = (title: string, ic: string, set: Set<string>, hint: string, cap = 0) => { const ids = [...set].filter((k) => (bag[k] ?? 0) > 0); return sec(title, `${ic} ${title}`, `${stacksIn(set)}/${cap} espaços`, `<div class="grid g6 sc" title="${hint}">${ids.map((i) => `<div class="it ${ITEMS[i]?.kind ?? ''}" draggable="true" data-drag="i:${i}:${bag[i]}" data-use="${i}" title="${ITEMS[i]?.name}: ${ITEMS[i]?.desc}${shop ? (sp(i) > 0 ? ` — vende por ${sp(i)} cada (clique: 1 · Ctrl: 50 · Shift: tudo)` : ' — este comerciante não compra') : ''}"><span>${ITEMS[i]?.icon}</span><b>${bag[i]}</b><small>${ITEMS[i]?.name}</small>${tag(sp(i))}</div>`).join('') || '<em class="emptyb">vazia</em>'}</div>`, 'spec'); };
      const cap = capacity(), used = cells.length;
      const groups = bagGroups().filter((g) => g.on), BM = bagCells();
      /* 07/11: duas colunas montadas aqui (a mais baixa recebe a próxima bolsa) — com colunas de CSS as bolsas de baixo sumiam para o lado */
      const SEC: { h: number; html: string }[] = groups.map((gp) => { const mine = BM.get(gp.key) ?? []; const empties = Array.from({ length: gp.n - mine.length }, () => '<div class="it empty"></div>').join(''); return { h: (accClosed.has(`bag:${gp.key.replace(/^x\d+:/, '')}`) ? 0 : Math.min(4, Math.ceil(gp.n / 6))) + 0.8, html: sec(`bag:${gp.key.replace(/^x\d+:/, '')}`, `${gp.icon} ${gp.name}`, `${mine.length}/${gp.n}`, `<div class="grid g6 sc" data-bagkey="${gp.key}">${mine.join('')}${empties}</div>`) }; });
      if (isPremium()) for (const [t, ic, set, hint, capN] of [['Bolsa de Ofício', '🧰', CRAFT_BAG, `pedra, madeira, couro e material de construção — ${CRAFT_CAP} espaços (Premium); o que passar vai para a mochila`, CRAFT_CAP], ['Bolsa Mágica', '🔮', MAGIC_BAG, `reagentes, tomos, selos e pergaminhos — ${MAGIC_CAP} espaços (Premium); o que passar vai para a mochila`, MAGIC_CAP]] as const) SEC.push({ h: (accClosed.has(t) ? 0 : Math.min(4, Math.max(1, Math.ceil([...set].filter((q) => (bag[q] ?? 0) > 0).length / 6)))) + 0.8, html: special(t, ic, set, hint, capN) });
      /* 11/11 (Erling: "cabem 2 mochilas por linha e três por coluna, com as premium vindo primeiro e acima delas as de ofício, para não precisar rolar tudo
         para ver um ofício"): grade de 2 colunas, lida linha a linha. Ordem: bolsas de ofício (Ofício e Mágica), depois a premium, depois as outras. */
      const nG = groups.length, oficio = SEC.slice(nG), prem = SEC.slice(0, nG).filter((_, i) => /premium/i.test(groups[i].name)), resto = SEC.slice(0, nG).filter((_, i) => !/premium/i.test(groups[i].name));
      const bagsHtml = [...oficio, ...prem, ...resto].map((q) => q.html).join('');
      el.innerHTML = `<div class="pn bagpn"><h2>Mochila <span class="cap ${used >= cap ? 'full' : ''}"><span class="capm" title="Espaços usados"><i style="width:${Math.min(100, used / Math.max(1, cap) * 100)}%"></i><b>${used}/${cap}</b></span><span class="goldp" title="Ouro">🪙 ${st.gold}</span>${shop ? '<button class="sellall" data-sellall2 title="Vende todos os recursos e tralhas (poções, comida, ferramentas e equipamentos ficam)">💰 vender tralha</button>' : ''}<span class="trash" data-trash title="Arraste um item para cá (ou para fora das janelas) para destruí-lo">🗑 destruir</span></span><button data-x>✕</button></h2>
        ${hooks.reactor?.().on && !shop ? `<div class="btabs2"><button data-btab="bag" class="${bagTab === 'bag' ? 'on' : ''}">🎒 Mochila</button><button data-btab="reator" class="${bagTab === 'reator' ? 'on' : ''}">⚛ Reator</button></div>` : ''}
        ${bagTab === 'reator' && hooks.reactor?.().on && !shop ? reactorTab() : `<div class="bagsx bg2">${bagsHtml}
        <button class="profgo" data-profgo>⚒ Criar e ofícios ficam em <b>Profissões</b> (Y)</button></div>`}
        <small class="ft">${bags.length < MAX_BAGS ? `${MAX_BAGS - bags.length} de ${MAX_BAGS} lugares para bolsas livres · ` : ''}clique no título da bolsa: abrir/fechar · arraste: equipar, vender, 🗑 destruir</small></div>`;
      el.style.display = 'flex';
    } else el.style.display = 'none';
    { const M = bagCells(); renderBar(M); renderMini(M); renderCfg(); }
    if (charOpen) {
      const t = total(), [lo, hi] = hitRange(), TLr = (hooks.talents?.() ?? {}) as Partial<Record<string, number>>;
      /* boneco com espaços pequenos em volta; uma linha leve, quase etérea, liga cada espaço ao lugar do corpo onde a peça vai */
      /* 09/11 (Erling: "os espaços entre os itens e os títulos estão se atropelando"): 66 px entre um espaço e o próximo (o nome cabe embaixo) */
      const W = 620, H = 408, DX = 215, DY = 24, DW = 190, DH = 300; /* 11/11 (Erling: "no 115% não tem por que eu ter scroll; ferramentas mais próximas do char, a relíquia lá em cima no quadro"): a relíquia virou um medalhão no canto do quadro do boneco e as cinco ferramentas, cinco espaços redondos logo abaixo dele. A faixa "Ferramentas de ofício" saiu: a ficha inteira cabe sem rolar */
      const POS: Record<Slot, [number, number, number, number]> = { // [x, y do espaço, alvo x, alvo y no boneco (0–1)]
/* 11/11 (Erling: "podemos aumentar os quadros de equipamentos; já que temos linhas que apontam onde ele vai, não é necessário que fiquem perfeitamente alinhados"): espaços de 60 px, em zigue-zague */
        helm: [146, 38, 0.5, 0.11], earring: [62, 100, 0.42, 0.16], amulet: [146, 162, 0.5, 0.24], shoulders: [62, 224, 0.31, 0.29], armor: [146, 286, 0.5, 0.38], weapon: [62, 348, 0.22, 0.56],
        cape: [474, 38, 0.68, 0.3], earring2: [558, 100, 0.58, 0.16], shield: [474, 162, 0.78, 0.52], ring: [558, 224, 0.75, 0.6], ring2: [474, 286, 0.25, 0.61], boots: [558, 348, 0.56, 0.95], relic: [DX + DW - 4, DY + 6, 0.5, 0.45] };
      const eqV = (sl: Slot) => sl === 'weapon' || sl === 'shield' ? setHand(sl) : eqG[sl], viewOther = wView !== wsets.act;
      const lines = (SLOTS as Slot[]).filter((s) => s !== 'relic').map((s: Slot) => { const [x, y, fx, fy] = POS[s], g = eqV(s), tx = DX + fx * DW, ty = DY + fy * DH, sx = s === 'relic' ? x : x < W / 2 ? x + 31 : x - 31, sy = s === 'relic' ? y - 25 : y, col = g ? RARITY[g.rarity].col : '#e8d6a0';
        const mx = s === 'relic' ? sx : (sx + tx) / 2; return `<path d="M${sx} ${sy} C${mx} ${s === 'relic' ? (sy + ty) / 2 : sy} ${mx} ${s === 'relic' ? (sy + ty) / 2 : ty} ${tx} ${ty}" stroke="${col}" stroke-opacity="${g ? 0.42 : 0.14}" stroke-width="${g ? 1.2 : 0.8}" fill="none" ${g ? '' : 'stroke-dasharray="2 4"'}/><circle cx="${tx}" cy="${ty}" r="${g ? 2.6 : 1.8}" fill="${col}" fill-opacity="${g ? 0.75 : 0.25}" filter="url(#eqglow)"/>`; }).join('');
      const slot = (s: Slot) => { const g = eqV(s), [x, y] = POS[s], vo = viewOther && (s === 'weapon' || s === 'shield'); return `<div class="eqs ${g ? 'on' : ''} ${s} ${vo ? 'wview' : ''}" style="left:${x - (s === 'relic' ? 23 : 30)}px;top:${y - (s === 'relic' ? 23 : 30)}px;${g ? `--rc:${RARITY[g.rarity].col}` : ''}" ${g ? (vo ? `data-g="g:${g.uid}" data-un="${s}" title="Conjunto ${['I', 'II', 'III'][wView]} — clique para tirar do conjunto"` : `draggable="true" data-drag="e:${s}" data-g="e:${s}" data-un="${s}"`) : `title="${RSLOT[s]} — vazio. Arraste uma peça para cá."`}>${g ? `<span class="gem">${gearEmoji(g)}</span><b class="ilv">${g.ilvl}</b>` : gearIcon(null, s)}<small>${g ? (g.name.length > 14 ? g.name.slice(0, 13) + '…' : g.name) : RSLOT[s]}</small></div>`; }; /* 07/11 (Erling: "não vejo os ícones trocando"): o espaço mostra o desenho da peça (como na mochila), o nível dela e o nome */
      const row = (l: string, v: string) => `<div class="stt"><span>${l}</span><b>${v}</b></div>`;
      const pic = hooks.portrait?.() ?? null;
      ch.innerHTML = `<div class="charwrap"><div class="pn charpn"><h2>${hooks.title?.() || hooks.raceLabel()} <span class="lv">Nível ${st.lvl}</span><span class="wsets" title="Conjuntos de armas (mão 1 e mão 2). Clique num número para ver e montar aquele conjunto; Ctrl + roda do mouse troca o conjunto em uso.">⚔${[0, 1, 2].map((k) => `<button class="wsb ${k === wView ? 'view' : ''} ${k === wsets.act ? 'act' : ''}" data-wsv="${k}">${['I', 'II', 'III'][k]}</button>`).join('<i></i>')}${viewOther ? `<button class="wsuse" data-wsuse>usar</button>` : ''}</span><span class="sidebtns">${hooks.alignHtml ? `<button class="alx ${alOpen ? 'on' : ''}" data-alx title="Os seus pontos de karma com cada vila, cidade, região e facção por onde você passou"><i>🏘</i><span>Alinhamento</span><b>${alOpen ? '◂' : '▸'}</b></button>` : ''}<button class="alx ${dsOpen ? 'on' : ''}" data-dsx title="Os dados por trás de cada número de Combate — a ficha para jogar KARMIKA na mesa"><i>🎲</i><span>Ficha de mesa</span><b>${dsOpen ? '◂' : '▸'}</b></button></span><button data-x>✕</button></h2>
        <div class="paper2" style="width:${W}px;height:${H}px"><svg class="eqlines" width="${W}" height="${H}"><defs><filter id="eqglow"><feGaussianBlur stdDeviation="1.6"/></filter></defs>${lines}</svg>
          <div class="doll" style="position:absolute;left:${DX}px;top:${DY}px;width:${DW}px;height:${DH}px">${pic ? `<img src="${pic}" alt="">` : ''}<div class="pw">⚔ Poder ${power()}</div></div>
          ${SLOTS.map(slot).join('')}
          <div class="tslots" style="left:${DX + DW / 2}px;top:${DY + DH + 14}px">${TOOL_SLOTS.map((s) => { const id = tools[s.k], d = id ? TOOLS[id] : null; return `<div class="tsl t${d?.tier ?? 0} ${id ? '' : 'empty'}" ${id ? `data-tun="${s.k}" title="${ITEMS[id].name}: ${ITEMS[id].desc} (clique: guardar na mochila)"` : `title="${s.lab} — ${s.job}. Arraste uma ferramenta para cá."`}><span>${id ? ITEMS[id].icon : s.icon}</span>${d ? `<b>${'★'.repeat(d.tier)}</b>` : ''}</div>`; }).join('')}</div>
          <button class="helmtog ${localStorage.getItem('karmika.showHelm') === '0' ? 'off' : ''}" data-helm style="left:${POS.helm[0] + 24}px;top:${POS.helm[1] - 40}px" title="Mostrar ou esconder o elmo no personagem (o rosto fica à mostra; os atributos continuam valendo)">${localStorage.getItem('karmika.showHelm') === '0' ? '🙈' : '👁'}</button>
        </div>
        <div class="cols">
          <div class="col"><h3>Atributos <span class="pts ${st.points ? 'on' : ''}">${st.points} ponto${st.points === 1 ? '' : 's'}</span></h3>${pendN() ? `<div class="pendbar"><span>${pendN()} por salvar</span><button data-pundo title="Devolve os pontos que ainda não foram salvos">Desfazer</button><button class="ok" data-pok title="Grava os pontos: depois disso não dá mais para tirar">Salvar</button></div>` : ''}
          ${ATTRS.map((a) => { /* 05/11 (Erling: "recebo pontos de Força nos talentos e não vejo no personagem"): o + mostra equipamento E talentos (e passivas de classe); o detalhe fica na dica */ const ge = Math.round(t[a.k] ?? 0), ta = Math.round(TLr[a.k] ?? 0), ex = ge + ta; return `<div class="at" title="${a.tip}${ex ? ` · base ${st.attrs[a.k]}${ge ? ` + equipamento ${ge}` : ''}${ta ? ` + talentos ${ta}` : ''} = ${st.attrs[a.k] + ex}` : ''}"><span>${a.lab}</span><b class="${pend[a.k] ? 'pnd' : ''}">${st.attrs[a.k]}${pend[a.k] ? `<u>+${pend[a.k]}</u>` : ''}${ex ? ` <i>+${ex}</i>` : ''}</b>${pend[a.k] ? `<button class="mn" data-pm="${a.k}" title="Tirar um ponto ainda não salvo">−</button>` : '<button class="mn" disabled>−</button>'}${st.points > 0 ? `<button data-pt="${a.k}">+</button>` : '<button disabled>+</button>'}</div>`; }).join('')}
          ${bar(st.xp, hooks.xpNeed(), '#3a7ac0')}<small>XP ${st.xp}/${hooks.xpNeed()} · ${st.kills} abates</small>${hooks.soul ? `<h3 class="soulh">Alma</h3>${hooks.soul().map(([a, b]) => `<div class="stt soulr"><span>${a}</span><b>${b}</b></div>`).join('')}` : ''}</div>
          <div class="col"><h3>Combate</h3>
          ${row('Vida', `${Math.round(st.hp)}/${st.hpMax}`)}${row(st.res?.name ?? 'Magia', `${Math.round(st.mp)}/${st.mpMax}`)}${st.gen ? row(`Geração de ${st.res?.name ?? 'magia'}`, `+${Math.round(st.gen * 100)}%`) : ''}${row('Dano por golpe', `${lo}–${hi}`)}${row('Crítico', `${Math.round(st.crit * 100)}%`)}${row('Defesa', `${Math.round(st.def * 100)}%`)}${row('Velocidade', `+${Math.round((st.move - 1) * 100)}%`)}${row('Regeneração', `${st.regen.toFixed(1)}/s`)}${st.leech ? row('Roubo de vida', `${(st.leech * 100).toFixed(1)}%`) : ''}${st.xpMul > 1 ? row('XP', `+${Math.round((st.xpMul - 1) * 100)}%`) : ''}${st.goldMul > 1 ? row('Ouro', `+${Math.round((st.goldMul - 1) * 100)}%`) : ''}
          ${row('Karma', String(Math.round(hooks.karma())))}${row('Ouro', `🪙 ${st.gold}`)}${row('Honra Kármica', `🏅 ${honor()} · ${honorRank()}`)}</div>
        </div><small class="ft">C: fechar · I: mochila · arraste da mochila para o boneco para equipar · clique ou arraste para a mochila para desequipar</small></div>${dsOpen ? diceSheet(lo, hi) : ''}${alOpen && hooks.alignHtml ? `<div class="pn alside"><h3>Alinhamento Kármico</h3><p class="alsd">Os lugares por onde você passou como caminhante e o quanto a sua alma combina com cada um.</p>${hooks.alignHtml()}</div>` : ''}</div>`;
      ch.style.display = 'flex';
    } else ch.style.display = 'none';
    if (shop) {
      const price = shopPrice;
      const sd = SHOPDEF[shop] ?? { title: shop, items: [] };
      const shelf = [...(sd.gear || sd.fac ? stock.map((g) => `<div class="it gi shelf ${(sd.honor ? honor() >= honorPrice(g.slot) : sd.karma ? Math.abs(hooks.karma()) >= karmaPrice(g.slot) : st.gold >= price(g)) ? '' : 'poor'}" data-gbuy="${g.uid}" data-g="s:${g.uid}" style="border-color:${RARITY[g.rarity].col};box-shadow:inset 0 0 10px ${RARITY[g.rarity].col}44"><span>${gearIcon(g)}</span><b style="color:${RARITY[g.rarity].col}">${g.ilvl}</b><small style="color:${RARITY[g.rarity].col}">${g.name}</small><i class="ptag">${sd.honor ? `🏅${honorPrice(g.slot)}` : `🪙${price(g)}`}</i></div>`) : []),
        ...(sd.tabs ? (sd.tabs[Math.min(shopTab, sd.tabs.length - 1)]?.items ?? []) : SHOPS[shop]).map((i) => `<div class="it shelf ${st.gold >= buyP(i) ? '' : 'poor'}" data-buy="${i}" title="${ITEMS[i].name}: ${ITEMS[i].desc}"><span>${ITEMS[i].icon}</span><small>${ITEMS[i].name}</small><i class="ptag">🪙${buyP(i)}</i></div>`)];
      sh.innerHTML = `<div class="pn shoppn"><h2>${shopTitle ?? sd.title} <span class="gold">${sd.honor ? `🏅 ${honor()} · ${honorRank()}` : sd.karma ? `☯ karma ${Math.round(hooks.karma())}` : `🪙 ${st.gold}`}</span><button data-x2>✕</button></h2>${sd.note ? `<small class="note">${sd.note}</small>` : ''}
        ${sd.tabs ? `<div class="stabs">${sd.tabs.map((t, i) => `<button class="${i === Math.min(shopTab, sd.tabs!.length - 1) ? 'on' : ''}" data-stab="${i}">${t.name}</button>`).join('')}${sd.extra ? `<button class="sx" data-sextra>${sd.extra.label}</button>` : ''}</div>` : '<h3>Prateleira</h3>'}<div class="grid g5">${shelf.join('')}</div>
        <small class="ft">clique na prateleira: comprar · clique na sua mochila: vender (Ctrl: 50 · Shift: tudo) · arraste da mochila para cá: vender</small></div>`;
      sh.style.display = 'flex';
    } else sh.style.display = 'none';
    if (vaultOpen) {
      const vc: string[] = [...vault.gear].map((g) => cell(g, `data-g="v:${g.uid}" data-vout="vg:${g.uid}"`));
      for (const i of Object.keys(vault.items).sort((a, b) => (ITEMS[a]?.kind ?? '').localeCompare(ITEMS[b]?.kind ?? '') || a.localeCompare(b))) { let left = vault.items[i]; while (left > 0) { const n = Math.min(stackOf(i), left); left -= n; vc.push(`<div class="it ${ITEMS[i]?.kind ?? ''}" data-vout="vi:${i}" title="${ITEMS[i]?.name ?? i}: ${ITEMS[i]?.desc ?? ''}"><span>${ITEMS[i]?.icon ?? '•'}</span><b>${n}</b><small>${ITEMS[i]?.name ?? i}</small></div>`); } }
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
  const showTip = (e: MouseEvent) => { tipCtx.lvl = st.lvl; tipCtx.fac = myFac(); tipCtx.why = hooks.canWear;
    const t = (e.target as HTMLElement).closest('[data-g]') as HTMLElement | null;
    if (!t) { tip.style.display = 'none'; tip2.style.display = 'none'; lastTipEv = null; return; }
    const g = findG(t.dataset.g!); if (!g) { tip.style.display = 'none'; return; }
    const isEq = t.dataset.g!.startsWith('e:'), other = isEq ? null : eqG[g.slot];
    tip.innerHTML = gearTip(g) + (e.shiftKey && other ? cmp(g, false) : !isEq ? `<hr><small style="color:#a89878">${other ? 'Shift: comparar com o equipado' : 'Nada equipado nesse espaço'}</small>` : ''); tip.style.display = 'block'; tip.style.borderColor = RARITY[g.rarity].col;
    const w = tip.offsetWidth, h = tip.offsetHeight; let x = Math.min(innerWidth - w - 8, e.clientX + 16); const y = Math.max(8, Math.min(innerHeight - h - 8, e.clientY + 12));
    if (e.shiftKey && other) { tip2.innerHTML = `<span class="eqh">Equipado</span>` + gearTip(other); tip2.style.display = 'block'; tip2.style.borderColor = RARITY[other.rarity].col; const w2 = tip2.offsetWidth; if (x + w + w2 + 8 > innerWidth) x = Math.max(8, e.clientX - 16 - w - w2 - 6); tip2.style.left = x + w + 6 + 'px'; tip2.style.top = y + 'px'; } else tip2.style.display = 'none';
    tip.style.left = x + 'px'; tip.style.top = y + 'px'; lastTipEv = e; lastTipT = t;
  };
  ch.addEventListener('click', (e) => { if ((e.target as HTMLElement).closest('[data-alx]')) { e.stopPropagation(); alOpen = !alOpen; if (alOpen) dsOpen = false; render(); return; } if ((e.target as HTMLElement).closest('[data-dsx]')) { e.stopPropagation(); dsOpen = !dsOpen; if (dsOpen) alOpen = false; render(); return; } });
  ch.addEventListener('click', (e) => { { const tg = e.target as HTMLElement, b = tg.closest('[data-wsv]') as HTMLElement | null; if (b) { e.stopPropagation(); syncAct(); wView = +b.dataset.wsv!; render(); return; } if (tg.closest('[data-wsuse]')) { e.stopPropagation(); useSet(wView); return; } } if (!(e.target as HTMLElement).closest('[data-helm]')) return; e.stopPropagation(); const show = localStorage.getItem('karmika.showHelm') === '0'; localStorage.setItem('karmika.showHelm', show ? '1' : '0'); game.logMsg(show ? '⛑ Elmo à mostra.' : '⛑ Elmo escondido: o rosto fica sempre à mostra (os atributos continuam valendo).', '#b9c6e0'); hooks.onGear?.(); render(); });
  el.addEventListener('mousemove', showTip); mini.addEventListener('mousemove', showTip); mini.addEventListener('mouseleave', () => { tip.style.display = 'none'; tip2.style.display = 'none'; });
  mini.addEventListener('click', (e) => { const x = (e.target as HTMLElement).closest('[data-mx]') as HTMLElement | null; if (x) { toggleBag(x.dataset.mx!, true); return; } onPanelClick(e); }); sh.addEventListener('mousemove', showTip); ch.addEventListener('mousemove', showTip);
  for (const kk of ['keydown', 'keyup'] as const) addEventListener(kk, (ev) => { if (ev.key === 'Shift' && lastTipEv && lastTipT && lastTipT.isConnected && tip.style.display === 'block') lastTipT.dispatchEvent(new MouseEvent('mousemove', { clientX: lastTipEv.clientX, clientY: lastTipEv.clientY, shiftKey: kk === 'keydown', bubbles: true })); });
  el.addEventListener('mouseleave', () => { tip.style.display = 'none'; tip2.style.display = 'none'; }); sh.addEventListener('mouseleave', () => { tip.style.display = 'none'; }); ch.addEventListener('mouseleave', () => { tip.style.display = 'none'; });

  const onPanelClick = (e: MouseEvent) => {
    const t = (e.target as HTMLElement).closest('[data-use],[data-cr],[data-un],[data-x],[data-eq],[data-pt],[data-pm],[data-pok],[data-pundo],[data-tun]') as HTMLElement | null; if (!t) return;
    if (t.dataset.tun) { unequipTool(t.dataset.tun as ToolSlot); return; }
    if (vaultOpen && el.contains(t) && (t.dataset.use || t.dataset.eq)) { // baú aberto: clicar na mochila guarda
      if (t.dataset.eq) deposit(`g:${t.dataset.eq}`); else { const id = t.dataset.use!, drag = (t.dataset.drag ?? '').split(':'), n = e.ctrlKey ? 1 : +(drag[2] || bag[id] || 1); deposit(`i:${id}:${n}`); }
      return;
    }
    if (shop && el.contains(t) && (t.dataset.use || t.dataset.eq)) { // loja aberta: clicar na mochila vende
      if (t.dataset.eq) sellRef(`g:${t.dataset.eq}`); else { const id = t.dataset.use!; const n = e.shiftKey ? (bag[id] ?? 0) : e.ctrlKey ? Math.min(50, bag[id] ?? 0) : 1; sellRef(`i:${id}:${n}`); }
      return;
    }
        if ('x' in t.dataset) { if (ch.contains(t)) charOpen = false; else open = false; render(); } else if (t.dataset.pt) spend(t.dataset.pt as Attr); else if (t.dataset.pm) unspend(t.dataset.pm as Attr); else if ('pok' in t.dataset) pendConfirm(); else if ('pundo' in t.dataset) pendUndo(); else if (t.dataset.eq) equip(+t.dataset.eq); else if (t.dataset.use) use(t.dataset.use); else if (t.dataset.cr) craft(t.dataset.cr); else if (t.dataset.un) unequip(t.dataset.un as Slot);
  };
  el.addEventListener('click', (e) => { { const tb = (e.target as HTMLElement).closest('[data-btab]') as HTMLElement | null; if (tb) { bagTab = tb.dataset.btab as typeof bagTab; render(); return; }
      const rs = (e.target as HTMLElement).closest('[data-rslot]') as HTMLElement | null; if (rs && !fusing) { const q = REACTOR_PARTS.find((x) => x.id === rs.dataset.rslot)!, P = loadParts(), need = q.n - (P[q.id] ?? 0);
        if (need <= 0) return; const n = Math.min(need, bag[q.id] ?? 0); if (!n) { game.logMsg(`⚛ Falta ${ITEMS[q.id]?.name ?? q.id} na mochila (precisa de ${need}).`, '#ff9a8a'); return; }
        take(q.id, n); P[q.id] = (P[q.id] ?? 0) + n; saveParts(P); game.logMsg(`⚛ ${ITEMS[q.id]?.icon ?? ''} ${ITEMS[q.id]?.name ?? q.id} no encaixe (${P[q.id]}/${q.n}).`, '#8af0ff');
        if (partsFull(P)) { fusing = true; render(); setTimeout(() => { saveParts({}); fusing = false; hooks.fuse?.(); render(); }, 2600); } else render(); return; } }
    const acc = (e.target as HTMLElement).closest('[data-acct]') as HTMLElement | null; if (acc) { const k2 = acc.dataset.acct!; if (accClosed.has(k2)) accClosed.delete(k2); else accClosed.add(k2); try { localStorage.setItem('karmika.acc', JSON.stringify([...accClosed])); } catch { /* */ } render(); return; } if ((e.target as HTMLElement).closest('[data-sellall2]')) { sellJunk(); return; } onPanelClick(e); }); ch.addEventListener('click', onPanelClick);
  function sellJunk() { const ids = Object.keys(bag).filter((i) => (ITEMS[i]?.sell ?? 0) > 0 && !BAGS[i] && (ITEMS[i].kind === 'res' || (ITEMS[i].kind === 'misc' && !ITEMS[i].tier))); let tot = 0, cnt = 0; for (const i of ids) { const n = bag[i] ?? 0; const pr = sellPrice(i); if (n > 0 && take(i, n)) { tot += pr * n; cnt += n; } } if (cnt) { st.gold += tot; game.logMsg(`💰 Vendeu tudo: ${cnt} itens por ${tot} 🪙 (total ${st.gold}).`, '#ffd24a'); game.snd?.('coins'); render(); save(); } }
  vt.addEventListener('mousemove', showTip); vt.addEventListener('mouseleave', () => { tip.style.display = 'none'; });
  vt.addEventListener('click', (e) => { const t = e.target as HTMLElement;
    if (t.closest('[data-vx]')) { vaultOpen = false; render(); return; }
    if (t.closest('[data-vres]')) { let n = 0; for (const id of Object.keys(bag)) if (ITEMS[id]?.kind === 'res' && deposit(`i:${id}:${bag[id]}`, true)) n++; render(); save(); game.logMsg(n ? `📦 ${n} tipo${n > 1 ? 's' : ''} de recurso guardado${n > 1 ? 's' : ''} no baú.` : 'Nada de recurso para guardar.', '#ffe08a'); return; }
    if (t.closest('[data-vgear]')) { let n = 0; for (const g of [...gearBag]) if (deposit(`g:${g.uid}`, true)) n++; render(); save(); game.logMsg(n ? `📦 ${n} equipamento${n > 1 ? 's' : ''} guardado${n > 1 ? 's' : ''} no baú.` : 'Nenhum equipamento na mochila.', '#ffe08a'); return; }
    const o = (t.closest('[data-vout]') as HTMLElement | null)?.dataset.vout; if (o) withdraw(o); });
  sh.addEventListener('click', (e) => {
    const t = (e.target as HTMLElement).closest('[data-buy],[data-sell],[data-x2],[data-gbuy],[data-gsell],[data-stab],[data-sextra]') as HTMLElement | null; if (!t) return;
    if (t.dataset.stab !== undefined) { shopTab = +t.dataset.stab; render(); return; }
    if (t.hasAttribute('data-sextra')) { const sd = shop ? SHOPDEF[shop] : null; sd?.extra?.act(); return; }
    if ('x2' in t.dataset) { shop = null; render(); return; }
    if (t.dataset.buy) { const i = t.dataset.buy; if (PREMIUM_BAGS.has(i) && !isPremium()) { game.logMsg(`✦ ${ITEMS[i].name} é exclusivo do Premium.`, '#c9a0ff'); game.snd?.('error'); return; } if (st.gold < buyP(i)) { game.logMsg(`Ouro insuficiente: ${ITEMS[i].name} custa ${buyP(i)} 🪙 e você tem ${st.gold}.`, '#ff9a8a'); game.snd?.('error'); return; } if (!BAGS[i] && !canAdd(i, 1)) { game.logMsg('🎒 Mochila cheia! Venda ou use algo antes, ou compre uma bolsa maior.', '#ff9a8a'); game.snd?.('error'); return; } buyFx(t, '+1 ' + ITEMS[i].icon); st.gold -= buyP(i); add(i, 1, true); game.logMsg(`🛒 Comprou ${ITEMS[i].icon} ${ITEMS[i].name} por ${buyP(i)} 🪙 (restam ${st.gold}).`, '#ffd24a'); game.snd?.('coins'); game.snd?.('pickup'); }
    const priceOf = (i: string) => sellPrice(i);
    if (t.dataset.sell) { const i = t.dataset.sell; const n = e.shiftKey ? (bag[i] ?? 0) : e.ctrlKey ? Math.min(50, bag[i] ?? 0) : 1; const pr = priceOf(i); if (n > 0 && take(i, n)) { st.gold += pr * n; game.logMsg(`💰 Vendeu ${n}× ${ITEMS[i].icon} ${ITEMS[i].name} por ${pr * n} 🪙 (total ${st.gold}).`, '#ffd24a'); game.snd?.('coins'); render(); save(); } }
    if (t.closest('[data-sellall]')) { const ids = Object.keys(bag).filter((i) => (ITEMS[i]?.sell ?? 0) > 0 && !BAGS[i] && (ITEMS[i].kind === 'res' || (ITEMS[i].kind === 'misc' && !ITEMS[i].tier))); /* recursos e tralha; poções, comida, ferramentas, pets e montarias ficam */ let tot = 0, cnt = 0; for (const i of ids) { const n = bag[i] ?? 0; const pr = priceOf(i); if (n > 0 && take(i, n)) { tot += pr * n; cnt += n; } } if (cnt) { st.gold += tot; game.logMsg(`💰 Vendeu tudo: ${cnt} itens por ${tot} 🪙 (total ${st.gold}).`, '#ffd24a'); game.snd?.('coins'); render(); save(); } }
    if (t.dataset.gbuy) { const g = stock.find((x) => x.uid === +t.dataset.gbuy!); if (!g) return; if (isKarmaShop()) { const kp = karmaPrice(g.slot); if (Math.abs(hooks.karma()) < kp) { game.logMsg(`A balança não aceita: ${g.name} pede ${kp} de alinhamento (luz ou sombra) e a sua alma pesa ${Math.round(hooks.karma())}.`, '#ff9a8a'); game.snd?.('error'); return; } if (!canAddGear()) { game.logMsg('A bolsa de equipamentos está cheia.', '#ff9a8a'); return; } if (!hooks.spendKarma?.(kp)) return; stock.splice(stock.indexOf(g), 1); gearBag.push(g); game.logMsg(`☯ ${g.name}: a Sacerdotisa tomou ${kp} do seu alinhamento e a balança pendeu para o centro.`, '#bfe8ff'); save(); render(); return; } if (isHonorShop()) { const hp = honorPrice(g.slot); if (honor() < hp) { game.logMsg(`Honra insuficiente: ${g.name} custa ${hp} 🏅 e você tem ${honor()}. Honra se ganha em missões, elites, masmorras e eventos.`, '#ff9a8a'); game.snd?.('error'); return; } if (!canAddGear()) { game.logMsg('A bolsa de equipamentos está cheia.', '#ff9a8a'); return; } spendHonor(hp); stock.splice(stock.indexOf(g), 1); gearBag.push(g); game.logMsg(`🏅 ${g.name} comprado com ${hp} de Honra Kármica.`, '#ffd27a'); save(); render(); return; } const p = shopPrice(g); if (st.gold < p) { game.logMsg(`Ouro insuficiente: ${g.name} custa ${p} 🪙 e você tem ${st.gold}.`, '#ff9a8a'); game.snd?.('error'); return; } if (!canAddGear()) { game.logMsg('🎒 Sem espaço para equipamentos na mochila.', '#ff9a8a'); game.snd?.('error'); return; } buyFx(t, '+1 ' + g.icon); st.gold -= p; stock = stock.filter((x) => x !== g); addGear(g); game.logMsg(`🛒 Comprou ${g.icon} ${g.name} por ${p} 🪙 (restam ${st.gold}).`, '#ffd24a'); game.snd?.('coins'); }
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
      else { bag[a] = Math.max(0, (bag[a] ?? 0) - (+b || 0)); if (bag[a] <= 0) delete bag[a]; recalc(); if (ITEMS[a]?.quest && !bag[a]) hooks.questItemLost?.(ITEMS[a].quest!, a); }
      game.logMsg(`🗑 Destruiu ${nm}`, '#d0907a'); game.snd?.('click'); render(); save();
    });
  }
  function sellRef(ref: string) {
    { const id0 = ref.split(':')[1]; if (ref.startsWith('b:') || ref.startsWith('i:')) { const it0 = ITEMS[id0]; if (it0?.quest) { game.logMsg(`◆ ${it0.name} é item de missão: não se vende. Se não quiser mais, destrua (a missão é abandonada).`, '#ffb060'); game.snd?.('error'); return; } } }
    const [k, a, b] = ref.split(':');
    if (k === 'g') { const i = gearBag.findIndex((x) => x.uid === +a); if (i < 0) return; const g = gearBag.splice(i, 1)[0]; st.gold += g.value; game.logMsg(`💰 Vendeu ${g.icon} ${g.name} por ${g.value} 🪙 (total ${st.gold}).`, '#ffd24a'); }
    else if (k === 'i') { const pr = sellPrice(a); if (pr <= 0) { game.logMsg('Ninguém compra isso aqui.', '#ff9a8a'); return; } const n = Math.min(+b || 1, bag[a] ?? 0); if (!take(a, n)) return; st.gold += pr * n; game.logMsg(`💰 Vendeu ${n}× ${ITEMS[a].icon} ${ITEMS[a].name} por ${pr * n} 🪙 (total ${st.gold}).`, '#ffd24a'); }
    else return;
    game.snd?.('coins'); render(); save();
  }
  for (const box of [el, ch, mini]) box.addEventListener('dragstart', (e) => { const t = (e.target as HTMLElement).closest('[data-drag]') as HTMLElement | null; if (!t) return; dragRef = t.dataset.drag!; dropped = false; e.dataTransfer?.setData('text/plain', dragRef); if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'; t.classList.add('dragging'); tip.style.display = 'none'; });
  const targetOf = (e: DragEvent): string | null => { const t = e.target as HTMLElement; if (t.closest('[data-trash]')) return 'trash'; if (t.closest('#quick')) return 'quick'; if (sh.contains(t) && shop) return 'shop'; if (ch.contains(t) && charOpen) return 'char'; if ((el.contains(t) && open) || mini.contains(t)) return 'bag'; if (t.closest('.pn,#bar,#chat,#dlg')) return null; return 'out'; };
  const okFor = (tg: string | null, ref: string) => (tg === 'quick' && ref.startsWith('i:') && !isTool(ref.split(':')[1])) || tg === 'trash' || tg === 'out' || (tg === 'char' && (ref.startsWith('g:') || (ref.startsWith('i:') && isTool(ref.split(':')[1])))) || (tg === 'bag' && (ref.startsWith('e:') || ref.startsWith('i:') || ref.startsWith('g:'))) || (tg === 'shop' && !ref.startsWith('e:'));
  addEventListener('dragover', (e) => { if (!dragRef) return; const tg = targetOf(e); if (okFor(tg, dragRef)) { e.preventDefault(); if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'; } document.querySelectorAll('.dropok').forEach((x) => x.classList.remove('dropok')); const hl = tg === 'trash' ? (e.target as HTMLElement).closest('[data-trash]') : tg === 'char' ? ch.querySelector('.pn') : tg === 'bag' ? el.querySelector('.pn') : tg === 'shop' ? sh.querySelector('.pn') : tg === 'quick' ? ((e.target as HTMLElement).closest('.slot.q') ?? document.getElementById('quick')) : null; if (hl && okFor(tg, dragRef)) hl.classList.add('dropok'); });
  addEventListener('drop', (e) => { if (!dragRef) return; e.preventDefault(); const tg = targetOf(e), ref = dragRef; dropped = true; dragRef = null; document.querySelectorAll('.dropok').forEach((x) => x.classList.remove('dropok'));
    { const bk = ((e.target as HTMLElement).closest?.('[data-bagkey]') as HTMLElement | null)?.dataset.bagkey; if (bk && (ref.startsWith('i:') || ref.startsWith('g:'))) { const [a, b] = ref.split(':'); pins[`${a}:${b}`] = bk; savePins(); render(); return; } } /* 07/11: soltar numa bolsa prende o item nela */
    if (!okFor(tg, ref)) return;
    if (tg === 'quick') { const sl = (e.target as HTMLElement).closest('[data-qs]') as HTMLElement | null; dispatchEvent(new CustomEvent('karmika:quickpin', { detail: { id: ref.split(':')[1], slot: sl ? +sl.dataset.qs! : -1 } })); return; }
    if (tg === 'char') { if (ref.startsWith('i:')) equipTool(ref.split(':')[1]); else equip(+ref.split(':')[1]); } else if (tg === 'bag') { if (ref.startsWith('e:')) unequip(ref.split(':')[1] as Slot); } else if (tg === 'shop') sellRef(ref); else destroy(ref); });
  addEventListener('dragend', () => { dragRef = null; void dropped; document.querySelectorAll('.dragging,.dropok').forEach((x) => x.classList.remove('dragging', 'dropok')); });
  function close() { open = false; charOpen = false; render(); }

  const SAVE = 'karmika.save.v2', OLD = 'karmika.save.v1';
  function save() { syncAct(); saveSets(); try { localStorage.setItem(SAVE, JSON.stringify({ bag, bags, tools, gear: gearBag, eqG, attrs: st.attrs, points: st.points, gold: st.gold, lvl: st.lvl, xp: st.xp, kills: st.kills })); } catch { /* sem storage */ } }
  function load() {
    try {
      let s = JSON.parse(localStorage.getItem(SAVE) || 'null'); const old = !s; if (!s) s = JSON.parse(localStorage.getItem(OLD) || 'null'); if (!s) return;
      for (const k of Object.keys(bag)) delete bag[k]; Object.assign(bag, s.bag);
      for (const k of ['obra_auto_2', 'obra_auto_3']) if (bag[k]) { bag.obra_auto = (bag.obra_auto ?? 0) + bag[k]; delete bag[k]; } /* 28/10: o contrato tem um nível só */
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
    /** comando de teste (/tabuas, /prego…): põe direto na mochila, sem olhar espaço */
    grant(id: string, n: number) { bag[id] = (bag[id] ?? 0) + n; recalc(); render(); save(); },
    bag, eq: eqG, gearBag, tools, equipTool, unequip, cycleWeapons, setMode,
    /** a ferramenta no espaço (ou null): id e números */
    tool(sl: ToolSlot) { const id = tools[sl]; return id ? { id, ...TOOLS[id], name: ITEMS[id].name } : null; },
    /** 02/11: motivo de a classe atual não vestir a peça (null = serve) */
    whyNot: (g: Gear) => hooks.canWear?.(g) || null,
    /** teste (/equipar): tira e apaga todo o equipamento vestido e o da mochila */ wipeGear() { gearBag.length = 0; for (const k of Object.keys(eqG) as Slot[]) eqG[k] = null; recalc(); render(); },
    has, count, add, addGear, equipGear: equip, take, save, recalc, use, craft,
    get isOpen() { return open || charOpen || !!shop || vaultOpen; },
    /** abre o Baú do Caminhante junto com a mochila */
    openVault() { open = true; shop = null; vaultOpen = true; render(); },
    /** guarda direto no baú (kit de começo de jornada) */
    vaultPut(items: [string, number][], gear: Gear[]) { for (const [id, n] of items) vault.items[id] = (vault.items[id] ?? 0) + n; for (const g of gear) vault.gear.push(g); vsave(); render(); },
    get vaultOpen() { return vaultOpen; }, vault,
    closeShop() { shop = null; open = false; vaultOpen = false; render(); },
    toggle() { open = !open; if (!open) { shop = null; vaultOpen = false; } render(); },
    /** abre a mochila já na aba do Reator (botão ⚛ ao lado do acesso rápido) */
    openReactor() { open = true; bagTab = 'reator'; render(); },
    toggleChar() { charOpen = !charOpen; render(); },
    canAdd, canAddGear, capacity, usedSlots, bagCount: () => bags.length,
    openShop(id: string, title?: string) {
      open = true; shop = id; vaultOpen = false; shopTitle = title ?? null; shopTab = 0; // a mochila abre junto com a loja (arrasta para vender)
      const sd = SHOPDEF[id]; if (sd?.fac) stock = facSet(sd.fac, FAC_ILVL); else if (sd?.honor && sd.gear) { stock = sd.gear.map((sl, i) => genGear(Math.max(1, st.lvl + 1 + (i % 2)), i % 4 === 3 ? 'legendary' : 'epic', sl)); } else if (sd?.karma && sd.gear) { stock = sd.gear.map((sl, i) => genGear(Math.max(1, st.lvl + 2), i % 3 === 2 ? 'legendary' : 'epic', sl)); } else if (sd?.gear) { stock = sd.gear.map((s, i) => genGear(Math.max(1, st.lvl + (i % 3)), rollRarity({ rare: 0.5, legendary: 0.04, epic: 0, unique: 0, relic: 0 }), s));
        /* 29/10 (Erling): "o armeiro da cidade não tem metralhadora nem pistola para vender" — todo armeiro passa a ter a prateleira de latão dos tecnocratas */
        if (id === 'armeiro') for (const [i, b] of ['Pistola de Latão', 'Escopeta de Cano Duplo', 'Metralhadora de Mão', 'Lança-Chamas de Mão', 'Lança-Veneno de Mão'].entries()) stock.push(genGear(Math.max(1, st.lvl + (i % 2)), rollRarity({ rare: 0.5, legendary: 0.04, epic: 0, unique: 0, relic: 0 }), 'weapon', b)); }
      else stock = [];
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
