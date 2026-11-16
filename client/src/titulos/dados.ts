/* TÍTULOS DO CAMINHANTE (Erling, 16/11: "falta fazer um sistema de título: nomes de título do jogador ligados às suas façanhas no jogo;
   coisas que fazem referência a derrubar uma lágrima, mudar de karma ou trair a Ordem são títulos importantes, com uma diferença: quando
   ele fizer algo em que o título chega para ele, ele não pode escolher, por 5 dias, mudar aquele título; só depois disso o título pode ser
   alterado na página de títulos dentro do jogo").
   Dois tipos:
   · LIVRE: nasce de uma Inscrição de Marghar (feats.ts), de uma missão ou de um voto. O jogador usa se quiser.
   · MARCA: o Olho grava no jogador na hora do ato (lágrima, queda, traição…). Vira o título em uso e fica preso por 5 dias. */
export interface Titulo { id: string; nome: string; /** como se ganha, escrito para o jogador */ como: string; /** a Inscrição que entrega (feats.ts) */ feito?: string; /** o Olho impõe: 5 dias sem poder trocar */ marca?: boolean; grupo: 'alma' | 'caminho' | 'lamina' | 'oficio' | 'vida' | 'casa' }
export const DIAS_DE_MARCA = 5;
const T = (grupo: Titulo['grupo'], id: string, nome: string, como: string, feito?: string, marca = false): Titulo => ({ grupo, id, nome, como, feito, marca });
export const TITULOS: Titulo[] = [
  /* marcas da alma: o que o Olho viu e não deixa esconder */
  T('alma', 'lagrima', 'Lágrima de Marghar', 'Faça o Olho transbordar num ato heroico.', 'a_tear', true),
  T('alma', 'caido', 'O Caído', 'Atravesse o zero para a sombra no Ritual da Queda.', undefined, true),
  T('alma', 'renascido', 'O Renascido', 'Atravesse o zero para a luz no Ritual do Renascimento.', undefined, true),
  T('alma', 'voltou', 'O Que Voltou', 'Volte à natureza do seu caminho depois de ter atravessado o zero.', undefined, true),
  T('alma', 'traidor_fio', 'Traidor da Ordem', 'Jurado da Ordem do Fio, caia para a sombra.', undefined, true),
  T('alma', 'traidor_desf', 'Desertor dos Desfiados', 'Jurado dos Desfiados, renasça para a luz.', undefined, true),
  T('alma', 'perjuro', 'Perjuro', 'Quebre um juramento feito diante do Olho.', undefined, true),
  T('alma', 'vendido', 'O Vendido', 'Aceite um suborno.', 'a_sold', true),
  T('alma', 'sombra_longa', 'Sombra Longa', 'Chegue a alinhamento −300.', 'a_dark', true),
  /* escolhas da alma que o jogador veste se quiser */
  T('alma', 'misericordioso', 'O Misericordioso', 'Poupe 5 inimigos rendidos.', 'a_mercy'),
  T('alma', 'mao_firme', 'Mão Firme', 'Termine o que começou com 5 inimigos rendidos.', 'a_firm'),
  T('alma', 'incorruptivel', 'Incorruptível', 'Recuse 3 subornos.', 'a_incorr'),
  T('alma', 'justica', 'Justiça Tardia', 'Encontre quem mentiu e fugiu.', 'a_hunt'),
  T('alma', 'sete_vidas', 'Sete Vidas', 'Morra 7 vezes e volte todas.', 'a_seven'),
  T('caminho', 'caminhante', 'Caminhante de Verdade', 'Visite 25 vilas e cidades.', 'c_vil25'),
  T('caminho', 'cantos', 'O Que Viu Todos os Cantos', 'Pise em 15 regiões diferentes.', 'c_reg15'),
  T('caminho', 'veu', 'Atravessador do Véu', 'Conheça 25 relíquias.', 'c_rel25'),
  T('caminho', 'visionario', 'Visionário', 'Descubra 15 Fontes da Visão.', 'c_vis15'),
  T('lamina', 'matador', 'Matador', 'Derrote 1000 inimigos.', 'l_1000'),
  T('lamina', 'elites', 'Quebrador de Elites', 'Derrote 10 elites.', 'l_elite10'),
  T('lamina', 'gigantes', 'Derrubador de Gigantes', 'Derrote um inimigo 10 níveis acima do seu.', 'l_golias'),
  T('lamina', 'prata', 'Prata e Lua', 'Derrote um lobisomem.', 'l_wer'),
  T('lamina', 'ossos', 'Ossos ao Pó', 'Derrote 50 mortos-vivos.', 'l_undead'),
  T('lamina', 'purificador', 'Purificador da Catedral', 'Derrube o senhor da Catedral Abandonada.', 'l_bishop'),
  T('oficio', 'lenhador', 'Derrubador de Florestas', 'Derrube 50 árvores.', 'o_tree50'),
  T('oficio', 'mineiro', 'Mineiro', 'Rache 50 rochas.', 'o_rock50'),
  T('oficio', 'pescador', 'Pescador', 'Pesque 25 peixes.', 'o_fish'),
  T('oficio', 'construtor', 'Construtor', 'Erga 20 peças de construção.', 'o_build'),
  T('oficio', 'ferramentas', 'Mestre das Ferramentas', 'Tenha as 5 ferramentas de ofício de ferro ou melhor.', 'o_tools'),
  T('vida', 'visto', 'Visto pelo Olho', 'Chegue ao nível 20.', 'v_l20'),
  T('vida', 'veterano', 'Veterano', 'Chegue ao nível 40.', 'v_l40'),
  T('vida', 'lenda', 'Lenda de Karmika', 'Chegue ao nível 60.', 'v_l60'),
  T('vida', 'promessas', 'Cem Promessas', 'Conclua 100 missões.', 'v_q100'),
  T('vida', 'mercador', 'Mercador de Askavik', 'Junte 10000 moedas.', 'v_g10k'),
  T('casa', 'fundador', 'Fundador', 'Tenha o Pacote Fundador.'),
];
export const GRUPOS: Record<Titulo['grupo'], string> = { alma: 'A Alma', caminho: 'O Caminho', lamina: 'A Lâmina', oficio: 'O Ofício', vida: 'A Vida', casa: 'A Casa' };
export const tituloDe = (id: string) => TITULOS.find((t) => t.id === id) ?? null;
