/* MOLDURAS DE RETRATO (Erling, 16/11: "falta acrescentar sistema de moldura no rosto do jogador, para ver quando está em grupo ou nas
   páginas em que aparece o seu rosto com o seu nome"). A moldura é só aparência: não dá poder. O desenho fica no CSS (.mold .mo-<id>). */
export interface Moldura { id: string; nome: string; como: string; /** a Inscrição que libera */ feito?: string; /** jurado de qual lado */ lado?: 'fio' | 'desf'; /** pacote mínimo (índice em PACOTES) */ pacote?: number }
export const MOLDURAS: Moldura[] = [
  { id: 'madeira', nome: 'Madeira do Caminhante', como: 'Todo Caminhante começa com ela.' },
  { id: 'ferro', nome: 'Ferro', como: 'Chegue ao nível 20.', feito: 'v_l20' },
  { id: 'prata', nome: 'Prata', como: 'Chegue ao nível 40.', feito: 'v_l40' },
  { id: 'ouro', nome: 'Ouro', como: 'Chegue ao nível 60.', feito: 'v_l60' },
  { id: 'lagrima', nome: 'Lágrima', como: 'Faça o Olho transbordar num ato heroico.', feito: 'a_tear' },
  { id: 'sombra', nome: 'Sombra Longa', como: 'Chegue a alinhamento −300.', feito: 'a_dark' },
  { id: 'cacada', nome: 'Presas', como: 'Derrote 10 elites.', feito: 'l_elite10' },
  { id: 'catedral', nome: 'Vitral', como: 'Derrube o senhor da Catedral Abandonada.', feito: 'l_bishop' },
  { id: 'oficio', nome: 'Latão do Ofício', como: 'Erga 20 peças de construção.', feito: 'o_build' },
  { id: 'fio', nome: 'Ordem do Fio', como: 'Jure com a Ordem do Fio.', lado: 'fio' },
  { id: 'desf', nome: 'Desfiados', como: 'Jure com os Desfiados.', lado: 'desf' },
  { id: 'fundador', nome: 'Fundador', como: 'Tenha o Pacote Fundador.', pacote: 4 },
];
const IDS = new Set(MOLDURAS.map((m) => m.id));
/** a classe CSS da moldura (id desconhecido, vindo da rede, cai na madeira) */
export const classeMoldura = (id?: string | null) => `mold mo-${id && IDS.has(id) ? id : 'madeira'}`;
