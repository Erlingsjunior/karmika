/* A festa da cidade (alinhamento kármico): os feitos que o bardo canta e as falas de cada NPC na festa. Saiu do main.ts (02/11). */
export const DEED_OF: Record<string, string> = { h01: 'limpou o cemitério das ratazanas rubras', h02: 'encheu de lenha o fogão da Lúcia antes do inverno', h03: 'trouxe couro para o mercador', h05: 'desceu no Mausoléu dos Esquecidos e voltou', h06: 'enfrentou os mortos que não dormem', h07: 'achou o que as ratazanas escondiam', h08: 'trouxe o Bento de volta da igreja velha, vivo', n01: 'limpou o cemitério das ratazanas rubras' };

export const FESTA_FALA: Record<string, string[]> = {
  Garrick: ['Quando você acordou, achei que não durava uma semana. Olha você agora.', 'Lundr vai ver o que Karmika já sabe. Não me envergonhe, ouviu?'],
  'Lúcia': ['Você trouxe o meu Bento de volta. Eu nunca vou esquecer disso.', 'Leva o lenço com você. Agora ele é seu.'],
  Bento: ['Fui eu que pedi o barril maior. Você merece.', 'Prometo que da próxima vez eu luto em vez de me esconder. Talvez.'],
  'Rosália': ['Fiz o ensopado que você gosta. Come antes que o Sven acabe.', 'A cozinha vai ficar silenciosa sem você roubando pão.'],
  Sven: ['Essa carne eu guardei para hoje. A melhor do vale!', 'Volta com histórias e eu volto com churrasco.'],
  Morwen: ['Pus uma poção a mais na sua bolsa. Não agradeça, só volte inteira.', 'As ervas da estrada são diferentes. Cuidado com as azuis.'],
  Thorin: ['Um anão não chora. É fumaça da fogueira.', 'Se achar minério bom lá fora, lembra de quem te vendeu a primeira picareta.'],
  Doran: ['A lâmina aguenta. Você também.', 'Volte para eu afiar de novo.'],
  Tessa: ['A cerveja hoje é por conta da vila!', 'Brindo a você e à estrada.'],
};
