/* 06/11 (Erling: "uma aba a mais no modo construção: Guilda"): as peças que só a guilda constrói, no terreno dela.
   Cada uma pede um nível da guilda e é uma só por terreno. As de nível III a V aparecem com cadeado e "em breve":
   a casa da guilda, o castelo com muralhas e a vila ainda vão ser feitos (documento de 05/11). */
import type { PropKind } from '../world';

export interface GuildPiece { id: string; name: string; icon: string; lvl: number; cost?: Record<string, number>; gold?: number; tip: string; soon?: boolean }
export const GUILD_PIECES: GuildPiece[] = [
  { id: 'gboard', name: 'Quadro da Guilda', icon: '📋', lvl: 1, cost: { plank: 6, nail: 4 }, gold: 40, tip: 'O quadro com as missões do dia, o nível e o cofre da guilda. Qualquer membro lê (E) no terreno.' },
  { id: 'gchest', name: 'Baú da Guilda', icon: '🧰', lvl: 2, cost: { plank: 10, nail: 8, stone: 6 }, gold: 300, tip: 'O baú de todos: qualquer membro guarda, oficiais e o líder tiram. Abre com E perto dele.' },
  { id: 'gcasa', name: 'Casa da Guilda', icon: '🏰', lvl: 3, soon: true, tip: 'Sala de armas (doadas, alugadas ou vendidas aos membros), sala de profissões e a loja que só membros compram.' },
  { id: 'gcastelo', name: 'Castelo e Muralhas', icon: '🏯', lvl: 4, soon: true, tip: 'O castelo da guilda e os muros em volta do terreno.' },
  { id: 'gvila', name: 'Vila da Guilda', icon: '🏘', lvl: 5, soon: true, tip: 'Um terreno grande em volta do castelo, murado, com casas, comércios, ruas calçadas e rota de caravana. Defesa e obra só dos membros.' },
];
export const isGuildKind = (k: string): k is PropKind => k === 'gboard' || k === 'gchest';
