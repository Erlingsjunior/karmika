/* Tabelas dos NPCs: alma (caminho/inclinação), loja de cada um, forja de elite, materiais de elite e as armas de cada classe. Saiu do main.ts (02/11). */
import type { Slot } from '../loot';
import type { EnemyType } from '../world';
export const CLASS_WEAPONS: Partial<Record<string, { re: RegExp; msg: string; noShield?: string }>> = {
  vam: { re: /Florete|Espada de Duelo|Adaga/, msg: 'Vampiros lutam de florete ou de adaga.', noShield: 'Vampiros lutam sem escudo: a mão livre equilibra a estocada.' },
  lob: { re: /Porrete|Maça|Garras|Alabarda/, msg: 'Licantropos lutam de porrete ou de garras.', noShield: 'Licantropos não carregam escudo.' },
  cac: { re: /Besta|Kunai|Adaga/, msg: 'Caçadores de demônios usam bestas, kunais e adagas.', noShield: 'Caçadores só levam escudo com a besta de mão (ou uma besta de mão em cada mão). Com a besta de repetição, o kunai e a adaga, a outra mão fica livre.' },
};

export const NPC_SOUL: Record<string, { path?: string; lean?: 'luz' | 'sombra' }> = { 'Margit Corvo-Negro': { lean: 'sombra' }, 'Irmã Maela': { lean: 'luz' }, Eldrin: { lean: 'luz' }, 'Paladino Aldric': { path: 'pal', lean: 'luz' }, 'Arquiteta Ylva': { path: 'tec' }, 'Thorgrim Mão-de-Ferro': { path: 'gue' }, 'Hrefna': { lean: 'luz' }, 'Irmã Ysolde': { lean: 'luz' }, 'Grão-Mestre Cassius': { path: 'pal', lean: 'luz' }, 'Bispa Solveig': { lean: 'luz' }, 'Irmão Tobias': { lean: 'luz' }, 'Lady Mirela': { path: 'vam' }, 'Conde Vladislav III': { path: 'vam', lean: 'sombra' }, 'Mestra Ilsa Van Rhal': { path: 'cac', lean: 'luz' }, 'Malgrath, Senhor dos Pactos': { path: 'bru', lean: 'sombra' }, 'Ulfrun, a Mãe-Alfa': { path: 'lob' } };

export const SHOP_OF: Record<string, string> = { 'Comendador Aldric Vozalta': 'honra_humano', 'Vendedora Gunnhild Trança-de-Ferro': 'armeiro', 'Vendedor Bombur Pança-Larga': 'cervejaria', 'Vendedora Eir Pó-de-Gema': 'pocoes', Doran: 'armeiro', Thorin: 'mercador', Maren: 'armaduras', Morwen: 'pocoes', Tessa: 'cervejaria', Sven: 'churrasco', Bruno: 'charcutaria', Rosália: 'cozinha', Tomás: 'lenhador', Kaela: 'cacador', Gunnar: 'construtor', Corwin: 'domador', Orm: 'estabulo' };

export const ELITE_FORGE: { id: string; label: string; slot: Slot; need: [string, number][]; gold: number; say: string }[] = [
  { id: 'w', label: 'Lâmina Presa-Alfa', slot: 'weapon', need: [['el_fang', 4], ['el_hide', 1], ['ore_i', 6]], gold: 300, say: 'Presa no fio, couro no cabo. Corta como mordida.' },
  { id: 'a', label: 'Peitoral de Couro de Elite', slot: 'armor', need: [['el_hide', 5], ['el_hoof', 2], ['ore_i', 6]], gold: 350, say: 'Couro de quem mandava na matilha. Agora manda em você: protege.' },
  { id: 'h', label: 'Elmo da Galhada Ancestral', slot: 'helm', need: [['el_horn', 3], ['el_hide', 1], ['ore_i', 4]], gold: 250, say: 'Quem vê esse elmo na mata pensa duas vezes.' },
  { id: 'b', label: 'Botas de Casco de Ferro', slot: 'boots', need: [['el_hoof', 4], ['el_hide', 1]], gold: 200, say: 'Pisam pedra, gelo e lama como se fosse tapete.' },
  { id: 's', label: 'Escudo de Cerne Vivo', slot: 'shield', need: [['el_heart', 2], ['el_hide', 2], ['plank', 4]], gold: 300, say: 'Madeira que ainda pulsa. Fecha a rachadura sozinha.' },
  { id: 'm', label: 'Amuleto da Presa', slot: 'amulet', need: [['el_fang', 3], ['gem', 1]], gold: 250, say: 'Três presas e uma gema. Dizem que o dono ouve a matilha de longe.' },
];

export const ELITE_MATS: Partial<Record<EnemyType, [string, string]>> = { wolf: ['el_fang', 'el_hide'], frostwolf: ['el_fang', 'el_hide'], coyote: ['el_fang', 'el_hide'], werewolf: ['el_hide', 'el_fang'], boar: ['el_horn', 'el_hide'], deer: ['el_horn', 'el_hoof'], treant: ['el_heart', 'el_horn'], rat: ['el_fang', 'el_hide'], bat: ['el_fang', 'el_hoof'] };
