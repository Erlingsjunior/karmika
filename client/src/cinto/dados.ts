/* O CINTO (Erling, 16/11: "vamos criar um slot novo, cinto; o cinto pode ter 4 espaços, ou 6, ou 8; depois de 8 pode ter 6 de dois andares,
   totalizando 12; não é mais o jogador que define a altura da barra de acesso rápido e sim o cinto que ele estará usando; um slot do cinto
   cabem 20 poções acumuladas").
   O acesso rápido passa a ser o que está preso no cinto: cada espaço guarda até 20 unidades de um item, tiradas da mochila. */
export interface Cinto { id: string; nome: string; /** espaços por andar */ cols: number; andares: number }
/** quem anda sem cinto prende 4 coisas na roupa */
export const SEM_CINTO: Cinto = { id: '', nome: 'Sem cinto', cols: 4, andares: 1 };
export const CINTOS: Cinto[] = [
  { id: 'cinto_couro', nome: 'Cinto de Couro', cols: 6, andares: 1 },
  { id: 'cinto_viajante', nome: 'Cinto do Viajante', cols: 8, andares: 1 },
  { id: 'cinto_duplo', nome: 'Cinto Duplo', cols: 6, andares: 2 },
  { id: 'cinto_mestre', nome: 'Cinto de Mestre', cols: 6, andares: 3 },
];
export const cintoDe = (id: string | null | undefined): Cinto => CINTOS.find((c) => c.id === id) ?? SEM_CINTO;
export const ehCinto = (id: string) => CINTOS.some((c) => c.id === id);
/** quanto cabe em cada espaço */
export const POR_ESPACO = 20;
/** o cinto maior possível tem 3 andares de 8: os espaços são endereçados como andar * 8 + coluna */
export const LARGURA = 8, ENDERECOS = 24;
export const espacos = (c: Cinto) => c.cols * c.andares;
/** este endereço existe no cinto? */
export const cabe = (c: Cinto, i: number) => i >= 0 && i < ENDERECOS && i % LARGURA < c.cols && Math.floor(i / LARGURA) < c.andares;

/* MACROS (Erling: "onde hoje é o botão que aumenta as camadas será uma engrenagem onde definimos as macros das poções: quando chegar em X de
   vida usa a poção, quando acabar o efeito do buff usa outra comida, quando a stamina chegar em tanto usa outra; itens não se repetem"). */
export type TipoRegra = 'vida' | 'folego' | 'magia' | 'efeito';
export interface Regra { tipo: TipoRegra; /** vida, fôlego ou magia abaixo desta porcentagem (não vale para 'efeito') */ abaixo: number }
export const NOME_REGRA: Record<TipoRegra, string> = { vida: 'Vida abaixo de', folego: 'Fôlego abaixo de', magia: 'Magia abaixo de', efeito: 'Manter o efeito em batalha' };
/** tempo mínimo entre dois usos automáticos (s): o cinto não se esvazia num susto */
export const PAUSA_MACRO = 1.5;
