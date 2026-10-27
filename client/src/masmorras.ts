/** Masmorras, cavernas e subsolos (Erling, 23/10: "aumentar o conteúdo do mapa sem aumentar o mapa").
 *  - Entradas espalhadas pelo mundo (bocas de caverna, alçapões, minas), marcadas no mapa.
 *  - Dentro: salas com bandos, um elite, salas laterais com baú, um portão (contador de abates, nunca "matar todos")
 *    e o salão do chefe, com mecânicas que pedem tanque, cura e dano.
 *  - Em grupo: quem é do mesmo grupo cai na MESMA cópia (os monstros têm as mesmas chaves de rede); cada um rola o seu saque. */
import * as THREE from 'three';
import { buildEntrance, flickerEntrance, type EntranceFx } from './entradas';
import { buildDungeon, type DungeonFloor, type DgTheme } from './dungeon3d';
import { lvlScale } from './enemies';
import { genGear, type Gear, type Slot } from './loot';
import type { EnemyType } from './world';

export interface BossMech {
  aoe?: { every: number; r: number; k: number; name: string; col: number };
  heavy?: { every: number; mul: number; name: string };
  adds?: { at: number[]; type: EnemyType; n: number; line: string };
  pools?: { every: number; n: number; k: number; name: string; col: number };
  enrage?: string;
}
/** as cinco dificuldades da placa: níveis a mais, vida e dano dos bichos, e o quanto o prêmio cresce */
export const DG_TIERS = [
  { id: 'normal', name: 'Normal', col: '#c8e8b0', lv: 0, hp: 1, dmg: 1, xp: 1, gold: 1, loot: 1, extra: 0, min: 'rare', uq: 0, note: 'Acompanha o seu nível.' },
  { id: 'dificil', name: 'Difícil', col: '#ffd070', lv: 4, hp: 1.25, dmg: 1.15, xp: 1.5, gold: 1.6, loot: 1.4, extra: 0, min: 'rare', uq: 0.05, note: '+4 níveis. Bichos mais duros.' },
  { id: 'desafiador', name: 'Desafiador', col: '#ff9a4a', lv: 8, hp: 1.6, dmg: 1.3, xp: 2.2, gold: 2.5, loot: 2, extra: 1, min: 'rare', uq: 0.12, note: '+8 níveis. Uma peça a mais no baú.' },
  { id: 'impossivel', name: 'Impossível', col: '#ff5a4a', lv: 14, hp: 2.2, dmg: 1.55, xp: 3.2, gold: 4, loot: 3, extra: 1, min: 'epic', uq: 0.25, note: '+14 níveis. Só épicas para cima no baú.' },
  { id: 'doido', name: 'Coisa de Doido', col: '#d070ff', lv: 22, hp: 3, dmg: 1.9, xp: 5, gold: 7, loot: 5, extra: 2, min: 'epic', uq: 0.45, note: '+22 níveis. Quem sai vivo conta história.' },
] as const;
export interface DgDef {
  id: string; name: string; kind: 'grupo' | 'caverna' | 'subsolo'; lvl: [number, number] | null; theme: DgTheme; near: string; dx?: number; dy?: number;
  main: number; side: number; mobs: EnemyType[]; players: string;
  elite: { type: EnemyType; name: string; scale: number };
  boss: { type: EnemyType; name: string; scale: number; hp: number; dmg: number; mech: BossMech; hello: string; bye: string };
  uniq?: { name: string; slot: Slot; icon: string; lore: string }[];
  title?: string;
  /** entrada fixa dentro de um prédio (as escadas da Grande Biblioteca): sem a boca no mundo, a escada já está no modelo */ fixed?: boolean;
  /** pet que o chefe pode deixar (a versão filhote dele): id do item e a chance */ pet?: { id: string; p: number };
  /** masmorra sem fundo (Túneis de Orrukh): vencido o chefe, uma escada desce para o próximo nível, mais fundo e mais forte; os chefes se revezam */
  deep?: { step: number; bosses: DgDef['boss'][]; mobs: EnemyType[][] };
}
const MECH_GROUP = (aoe: string, col: number, heavy: string): BossMech => ({ aoe: { every: 9, r: 6.5, k: 1.3, name: aoe, col }, heavy: { every: 13, mul: 3.2, name: heavy } });
export const DUNGEONS: DgDef[] = [
  /* os três subsolos da Grande Biblioteca de Askavik (25/10): as escadas I, II e III no fundo do salão (library3d.LIB_STAIRS) */
  { id: 'arq1', name: 'Arquivo dos Mapas', kind: 'subsolo', lvl: [12, 16], theme: 'arquivo', near: 'Grande Biblioteca', dx: -6.25, dy: -12.75, fixed: true, main: 3, side: 1, mobs: ['rat', 'bat', 'rat'], players: 'sozinho ou em dupla',
    elite: { type: 'rat', name: 'Roedor de Pergaminho', scale: 1.3 }, boss: { type: 'ghoul', name: 'O Copista Que Não Parou', scale: 1.2, hp: 5, dmg: 1.1, mech: { aoe: { every: 10, r: 4.5, k: 1, name: 'Tinta que Queima', col: 0x3a2a6a } }, hello: 'O primeiro subsolo: mapas de lugares que já não existem. Alguém ainda copia aqui embaixo.', bye: 'A pena cai. O copista, enfim, descansa sobre a última folha.' } },
  { id: 'arq2', name: 'Galerias Proibidas', kind: 'subsolo', lvl: [26, 30], theme: 'arquivo', near: 'Grande Biblioteca', dx: 0, dy: -13.2, fixed: true, main: 4, side: 2, mobs: ['skeleton', 'ghoul', 'bat'], players: 'grupo de 2 a 3',
    elite: { type: 'skeleton', name: 'Guardião das Chaves', scale: 1.3 }, boss: { type: 'bishop', name: 'O Bibliotecário Cego', scale: 1.1, hp: 7, dmg: 1.2, mech: { aoe: { every: 9, r: 5.5, k: 1.2, name: 'Silêncio', col: 0x6a4a9a }, heavy: { every: 13, mul: 2.8, name: 'Livro Fechado' } }, hello: 'O segundo subsolo guarda o que a cidade preferiu esquecer. As portas daqui não abrem por fora.', bye: 'O Bibliotecário Cego larga a lanterna. As galerias voltam a ser só pó.' } },
  { id: 'arq3', name: 'A Escada Sem Fim', kind: 'subsolo', lvl: [44, 50], theme: 'arquivo', near: 'Grande Biblioteca', dx: 6.25, dy: -12.75, fixed: true, main: 5, side: 2, mobs: ['ghoul', 'imp', 'skeleton'], players: 'grupo de 3 a 5',
    elite: { type: 'imp', name: 'O Que Sussurra nas Lombadas', scale: 1.4 }, boss: { type: 'prince', name: 'A Sombra do Décimo', scale: 1.05, hp: 9, dmg: 1.3, mech: { aoe: { every: 8, r: 6, k: 1.3, name: 'Olho Fechado', col: 0x9a6aff }, heavy: { every: 12, mul: 3.0, name: 'Pálpebra' } }, hello: 'O terceiro subsolo desce mais do que devia. Lá no fim, uma porta de pedra preta com um olho fechado.', bye: 'A sombra se desfaz. A porta continua fechada. Ainda.' } },
  { id: 'toca', name: 'Toca das Ratazanas Rubras', kind: 'grupo', lvl: [10, 15], theme: 'toca', near: 'Cemitério Esquecido', dy: 4, main: 4, side: 2, mobs: ['rat', 'rat', 'bat'], players: 'grupo de 3',
    elite: { type: 'rat', name: 'Ratazana Alfa', scale: 1.45 },
    boss: { type: 'rat', name: 'Mãe-Ninhada', scale: 2.5, hp: 16, dmg: 2.0, mech: { ...MECH_GROUP('Guincho da Ninhada', 0xff4a3a, 'Mordida Dilacerante'), adds: { at: [0.7, 0.4], type: 'rat', n: 5, line: 'A Mãe-Ninhada guincha: os filhotes saem das paredes!' }, pools: { every: 15, n: 3, k: 0.35, name: 'Peste', col: 0x6aff4a }, enrage: 'A Mãe-Ninhada, ferida, fica ainda mais faminta.' },
      hello: 'Algo enorme se mexe no ninho. Os filhotes param de chiar.', bye: 'A Mãe-Ninhada tomba. Debaixo do cemitério, o silêncio volta.' },
    uniq: [{ name: 'Dente da Mãe-Ninhada', slot: 'weapon', icon: '🗡', lore: 'Arrancado do maior rato que Karmika já viu. Ainda cheira a peste.' }, { name: 'Capa de Couro Rubro', slot: 'cape', icon: '🧥', lore: 'Costurada com o couro da Ninhada: os ratos fogem de quem a usa.' }],
    title: 'Caçador da Ninhada' },
  { id: 'minas', name: 'Minas Afogadas', kind: 'grupo', lvl: [18, 22], theme: 'mina', near: 'Cinzalto', dx: 10, dy: -6, main: 5, side: 2, mobs: ['skeleton', 'bat', 'ghoul'], players: 'grupo de 3 a 5',
    elite: { type: 'ghoul', name: 'Mineiro Afogado', scale: 1.6 },
    boss: { type: 'tormentor', name: 'Capataz Sem Lanterna', scale: 1.7, hp: 14, dmg: 1.8, mech: { ...MECH_GROUP('Picareta Giratória', 0xffb040, 'Golpe do Capataz'), adds: { at: [0.6, 0.3], type: 'skeleton', n: 4, line: 'O Capataz bate o sino: os mineiros mortos voltam ao turno!' }, enrage: 'O Capataz apaga a última lanterna e avança no escuro.' },
      hello: 'Um sino toca no fundo da mina. Ninguém sobe com vida desde o desabamento.', bye: 'O Capataz cai. As lanternas da mina se acendem sozinhas.' },
    uniq: [{ name: 'Lanterna do Capataz', slot: 'relic', icon: '🏮', lore: 'A luz que ele perdeu. Ilumina quem não tem medo do escuro.' }, { name: 'Elmo de Mineiro Anão', slot: 'helm', icon: '⛑', lore: 'Amassado por mil desabamentos e nenhum deles venceu.' }], title: 'Desafogador das Minas' },
  { id: 'fiorde', name: 'Gruta do Fiorde', kind: 'grupo', lvl: [32, 38], theme: 'gelo', near: 'Skjoldvik', dx: -8, dy: 6, main: 5, side: 2, mobs: ['frostwolf', 'skeleton', 'frostwolf'], players: 'grupo de 3 a 5',
    elite: { type: 'frostwolf', name: 'Lobo do Gelo Eterno', scale: 1.35 },
    boss: { type: 'prince', name: 'Jarl Afogado', scale: 1.8, hp: 15, dmg: 1.9, mech: { ...MECH_GROUP('Maré Gelada', 0x9ad7ff, 'Machado do Jarl'), adds: { at: [0.66, 0.33], type: 'skeleton', n: 4, line: 'O Jarl chama a tripulação do fundo do fiorde!' }, pools: { every: 14, n: 3, k: 0.3, name: 'Gelo Negro', col: 0x9ad7ff }, enrage: 'O Jarl ruge: o gelo racha em volta dele.' },
      hello: 'O vento para. No fundo da gruta, um barco-dragão congelado e um trono de gelo.', bye: 'O Jarl Afogado afunda no gelo. O fiorde respira.' },
    uniq: [{ name: 'Machado do Jarl Afogado', slot: 'weapon', icon: '🪓', lore: 'Ainda pinga água do fiorde, mesmo no deserto.' }], title: 'Quebra-Gelo' },
  { id: 'coracao', name: 'Coração da Montanha', kind: 'grupo', lvl: [40, 45], theme: 'magma', near: 'Brasaforja', dx: 40, dy: -60, main: 6, side: 2, mobs: ['imp', 'imp', 'prince'], players: 'grupo de 5',
    elite: { type: 'prince', name: 'Arauto da Brasa', scale: 1.5 },
    boss: { type: 'prince', name: 'Senhor do Magma', scale: 2.3, hp: 18, dmg: 2.1, mech: { ...MECH_GROUP('Erupção', 0xff6a20, 'Punho de Lava'), adds: { at: [0.75, 0.5, 0.25], type: 'imp', n: 4, line: 'A lava borbulha: diabretes nascem do magma!' }, pools: { every: 12, n: 4, k: 0.4, name: 'Lava', col: 0xff5a10 }, enrage: 'O Senhor do Magma derrete a própria armadura.' },
      hello: 'O calor dobra os ares. No coração da montanha, algo respira fogo.', bye: 'O Senhor do Magma esfria e vira pedra.' },
    uniq: [{ name: 'Coração de Magma', slot: 'amulet', icon: '🔥', lore: 'Ainda bate, devagar, como a montanha.' }], title: 'Coração Frio' },
  { id: 'conde', name: 'Cripta do Conde', kind: 'grupo', lvl: [55, 60], theme: 'cripta', near: 'Corvoscuro', dx: 12, dy: 8, main: 6, side: 3, mobs: ['bat', 'zombie', 'ghoul'], players: 'grupo de 5',
    elite: { type: 'ghoul', name: 'Mordomo do Conde', scale: 1.6 },
    boss: { type: 'prince', name: 'O Primogênito', scale: 1.9, hp: 20, dmg: 2.2, mech: { ...MECH_GROUP('Noite Sem Fim', 0xc43a3a, 'Beijo do Primogênito'), adds: { at: [0.7, 0.35], type: 'bat', n: 8, line: 'O Primogênito vira névoa: morcegos enchem a cripta!' }, enrage: 'O Primogênito tem sede, e a sede não espera.' },
      hello: 'Velas se acendem sozinhas. Uma taça de vinho espera por você.', bye: 'O Primogênito vira cinza. A taça se quebra sozinha.' },
    uniq: [{ name: 'Taça do Primogênito', slot: 'relic', icon: '🍷', lore: 'Nunca seca.' }], title: 'Matador do Primogênito' },
  { id: 'uivo', name: 'Covil do Uivo Antigo', kind: 'grupo', lvl: [55, 60], theme: 'mata', near: 'Uivo Antigo', dx: -10, dy: -10, main: 6, side: 2, mobs: ['werewolf', 'wolf', 'wolf'], players: 'grupo de 5',
    elite: { type: 'werewolf', name: 'Beta da Lua', scale: 1.4 },
    boss: { type: 'werewolf', name: 'Lobo da Lua Velha', scale: 2.4, hp: 20, dmg: 2.3, mech: { ...MECH_GROUP('Uivo da Lua', 0xd8d8ff, 'Dentes da Lua Velha'), adds: { at: [0.7, 0.4], type: 'wolf', n: 6, line: 'O Lobo da Lua Velha uiva: a matilha responde!' }, enrage: 'A lua sangra: o lobo perde o resto de razão.' },
      hello: 'Ossos de lobisomens antigos forram o chão. Algo velho dorme sob a lua de pedra.', bye: 'O Lobo da Lua Velha uiva pela última vez.' },
    uniq: [{ name: 'Presa da Lua Velha', slot: 'amulet', icon: '🌕', lore: 'Brilha nas noites de lua cheia.' }], title: 'Caçador da Lua Velha' },
  /* ======== A NOVA SAFRA (26/10): masmorras feitas para os bichos novos ======== */
  { id: 'ninho', name: 'Ninho da Aracnídea-Mãe', kind: 'grupo', lvl: [26, 32], theme: 'toca', near: 'Eikvik', dx: 14, dy: 10, main: 6, side: 3, mobs: ['spider', 'spiderling', 'spiderling', 'spider'], players: 'grupo de 3 a 5',
    elite: { type: 'spider', name: 'Tecelã Anciã', scale: 1.4 },
    boss: { type: 'broodmother', name: 'Aracnídea-Mãe', scale: 1.25, hp: 16, dmg: 1.9, mech: { ...MECH_GROUP('Tremor do Ninho', 0xff3a1a, 'Presas da Mãe'), adds: { at: [0.85, 0.7, 0.55, 0.4, 0.25, 0.1], type: 'spiderling', n: 12, line: 'As bolsas de ovos estouram: uma enxurrada de filhotes corre pelas paredes!' }, pools: { every: 13, n: 3, k: 0.35, name: 'Ácido', col: 0x9aff4a }, enrage: 'A Mãe arrasta o abdômen enorme e ruge: ninguém sai do ninho.' },
      hello: 'Fios grossos como corda cobrem o túnel. No fundo, um abdômen do tamanho de uma carroça pulsa devagar.', bye: 'A Aracnídea-Mãe encolhe as pernas. Os filhotes que restam fogem para as frestas.' },
    uniq: [{ name: 'Fiandeira da Mãe', slot: 'cape', icon: '🕸', lore: 'Tecida com o fio do ninho: nada que se prende nela escapa.' }, { name: 'Presa da Aracnídea', slot: 'weapon', icon: '🗡', lore: 'Ainda pinga veneno uma vez por dia.' }],
    title: 'Quebra-Ninhos', pet: { id: 'pet_aranha_mae', p: 0.18 } },
  { id: 'dunas', name: 'Covil do Escorpião-Rei', kind: 'grupo', lvl: [24, 30], theme: 'toca', near: 'Brekkuvik', dx: -12, dy: 10, main: 5, side: 2, mobs: ['scorpion', 'scorpion', 'coyote'], players: 'grupo de 3',
    elite: { type: 'scorpion', name: 'Ferrão Velho', scale: 1.3 },
    boss: { type: 'scorpion_king', name: 'Escorpião-Rei', scale: 1.0, hp: 14, dmg: 1.8, mech: { ...MECH_GROUP('Tempestade de Areia', 0xd8b070, 'Pinça do Rei'), adds: { at: [0.6, 0.3], type: 'scorpion', n: 3, line: 'A areia ferve: a prole do Rei brota do chão!' } },
      hello: 'A areia no chão do covil se mexe sozinha. Uma coroa de ferrões espera no escuro.', bye: 'O Escorpião-Rei tomba de costas. As pinças ainda abrem e fecham por um tempo.' },
    uniq: [{ name: 'Couraça do Rei das Dunas', slot: 'armor', icon: '🦂', lore: 'Placas de quitina mais duras que ferro, mais leves que couro.' }], title: 'Senhor das Dunas', pet: { id: 'pet_escorpiao', p: 0.18 } },
  { id: 'afogados', name: 'Poço dos Afogados', kind: 'grupo', lvl: [14, 18], theme: 'toca', near: 'Vatnaholt', dx: 10, dy: -8, main: 4, side: 2, mobs: ['drowner', 'swampsnake', 'mudzombie'], players: 'grupo de 2 a 3',
    elite: { type: 'drowner', name: 'Afogado do Brejo', scale: 1.4 },
    boss: { type: 'drowner_old', name: 'Afogador Antigo', scale: 1.3, hp: 12, dmg: 1.6, mech: { ...MECH_GROUP('A Maré', 0x6ab8d0, 'Mão do Fundo'), adds: { at: [0.6, 0.3], type: 'drowner', n: 4, line: 'A água do poço sobe: os afogados vêm junto!' }, pools: { every: 14, n: 3, k: 0.3, name: 'Lodo', col: 0x4a6a3a } },
      hello: 'O poço não tem fundo, dizem em Vatnaholt. Só tem quem caiu.', bye: 'O Afogador Antigo afunda pela última vez. A água fica parada.' },
    uniq: [{ name: 'Anel do Fundo do Poço', slot: 'ring', icon: '💍', lore: 'Alguém o perdeu aqui há cem anos. Ainda está frio.' }], title: 'O Que Voltou do Poço', pet: { id: 'pet_cobrinha', p: 0.2 } },
  { id: 'fabrica', name: 'Fábrica Afogada de Ferrugem', kind: 'grupo', lvl: [34, 40], theme: 'mina', near: 'Ferrugem', dx: 12, dy: -10, main: 6, side: 2, mobs: ['automaton', 'turret', 'tinker'], players: 'grupo de 3 a 5',
    elite: { type: 'automaton', name: 'Capataz de Latão', scale: 1.5 },
    boss: { type: 'colossus', name: 'Colosso de Ferro', scale: 1.0, hp: 16, dmg: 2.0, mech: { ...MECH_GROUP('Válvula de Escape', 0xd8e8f0, 'Martelo-Pilão'), adds: { at: [0.7, 0.4], type: 'automaton', n: 3, line: 'A linha de montagem volta a rodar: autômatos saem da esteira!' }, enrage: 'A caldeira do Colosso passa do vermelho: ele vai explodir com tudo junto.' },
      hello: 'A maré tomou a fábrica, mas as máquinas nunca pararam. No fundo, algo do tamanho de um moinho dá corda em si mesmo.', bye: 'O Colosso range, solta todo o vapor e para. Pela primeira vez em anos, silêncio.' },
    uniq: [{ name: 'Coração de Caldeira', slot: 'relic', icon: '⚙', lore: 'Ainda bate. Ninguém sabe se é vapor ou vontade.' }], title: 'Desligador de Colossos', pet: { id: 'pet_automato', p: 0.18 } },
  { id: 'jotun', name: 'Salão de Hrímnir', kind: 'grupo', lvl: [36, 42], theme: 'gelo', near: 'Hrimgard', dx: 12, dy: 10, main: 6, side: 2, mobs: ['draugr_bers', 'draugr_arch', 'frostwolf'], players: 'grupo de 3 a 5',
    elite: { type: 'draugr_bers', name: 'Campeão de Gelo', scale: 1.5 },
    boss: { type: 'jotun', name: 'Jotun Menor', scale: 1.25, hp: 16, dmg: 2.0, mech: { ...MECH_GROUP('Inverno do Salão', 0x9ad7ff, 'Clava de Gelo'), adds: { at: [0.66, 0.33], type: 'draugr_bers', n: 3, line: 'Hrímnir bate a clava: os draugr acordam no gelo!' }, pools: { every: 14, n: 3, k: 0.3, name: 'Gelo Negro', col: 0x6ab8ff } },
      hello: 'Um salão de gelo azul, alto como uma igreja. No trono, um gigante menor que os de antigamente, e mesmo assim enorme.', bye: 'Hrímnir cai sobre o trono e o gelo racha de ponta a ponta.' },
    uniq: [{ name: 'Elmo de Hrímnir', slot: 'helm', icon: '⛑', lore: 'Feito para uma cabeça três vezes maior; encolheu quando você o pegou.' }], title: 'Matador de Gigantes', pet: { id: 'pet_lobo_hrim', p: 0.18 } },
  { id: 'gula', name: 'Despensa da Fome Sem Fim', kind: 'grupo', lvl: [52, 58], theme: 'magma', near: 'Corvoscuro', dx: -14, dy: 12, main: 6, side: 3, mobs: ['hellhound', 'imp_bomb', 'succubus'], players: 'grupo de 5',
    elite: { type: 'succubus', name: 'Súcubo das Cinzas', scale: 1.3 },
    boss: { type: 'glutton', name: 'Demônio da Gula', scale: 1.4, hp: 20, dmg: 2.3, mech: { ...MECH_GROUP('Fome', 0x9aff4a, 'Mordida da Gula'), adds: { at: [0.7, 0.45, 0.2], type: 'hellhound', n: 3, line: 'A Gula assobia entre os dentes: os cães do inferno vêm comer as sobras!' }, pools: { every: 12, n: 4, k: 0.35, name: 'Bile', col: 0x8aff3a } },
      hello: 'Mesas compridas, pratos vazios e um cheiro que dá fome e medo ao mesmo tempo. No fundo, algo mastiga.', bye: 'A Gula engole o próprio último suspiro. A despensa fica, enfim, vazia.' },
    uniq: [{ name: 'Garfo da Fome', slot: 'weapon', icon: '🔱', lore: 'Quem empunha nunca se sente satisfeito. Nem com a vitória.' }], title: 'O Que Não Foi Comido', pet: { id: 'pet_caozinho_inferno', p: 0.16 } },
  /* OS TÚNEIS DE ORRUKH (26/10, Erling: "fala de uma cripta que desce, com infinitos túneis e tesouros, mas não tem nada"): a cova aberta do
     Mausoléu do Bispo. Cada nível vencido abre uma escada para um nível mais fundo — mais bichos, mais níveis, baús mais ricos — e o chefe muda. */
  { id: 'orrukh', name: 'Túneis de Orrukh', kind: 'grupo', lvl: null, theme: 'cripta', near: 'Mausoléu do Bispo', dx: 5, dy: 3, main: 7, side: 4, mobs: ['skeleton', 'skel_arch', 'ghoul', 'skull_fire'], players: 'sozinho a 5 · sem fundo',
    elite: { type: 'necro', name: 'Necromante do Campo Santo', scale: 1.2 },
    boss: { type: 'lich', name: 'Lich dos Esquecidos', scale: 1.5, hp: 10, dmg: 1.6, mech: { ...MECH_GROUP('Grito da Cova', 0x6ad0ff, 'Toque Gélido'), adds: { at: [0.6, 0.3], type: 'skull_frost', n: 3, line: 'O Lich ergue o livro: caveiras de gelo saem das paredes!' } },
      hello: 'A cova desce em espiral. Lá embaixo, túneis sem fim — e alguém que contou cada moeda que entrou aqui.', bye: 'O guardião do nível cai. Atrás dele, uma escada desce mais fundo.' },
    uniq: [{ name: 'Moeda de Orrukh', slot: 'relic', icon: '🪙', lore: 'Uma dívida que nunca foi paga. Ela pesa mais a cada nível que você desce.' }, { name: 'Lanterna dos Túneis', slot: 'relic', icon: '🏮', lore: 'Acende sozinha quando há ouro por perto.' }],
    title: 'O Que Desce', pet: { id: 'pet_caveirinha', p: 0.12 },
    deep: { step: 3, mobs: [['skeleton', 'skel_arch', 'ghoul', 'skull_fire'], ['zombie', 'ghoul', 'skull_frost', 'necro'], ['skeleton', 'skull_fire', 'skull_frost', 'imp'], ['ghoul', 'hellhound', 'skull_fire', 'pactbroken'], ['draugr_bers', 'draugr_arch', 'skull_frost', 'ghoul']],
      bosses: [{ type: 'lich', name: 'Lich dos Esquecidos', scale: 1.5, hp: 10, dmg: 1.6, mech: { ...MECH_GROUP('Grito da Cova', 0x6ad0ff, 'Toque Gélido'), adds: { at: [0.6, 0.3], type: 'skull_frost', n: 3, line: 'O Lich ergue o livro: caveiras de gelo saem das paredes!' } }, hello: 'Um trono de ossos e um livro aberto. O Lich levanta os olhos.', bye: 'O Lich se desfaz em pó. Uma escada desce mais fundo.' },
        { type: 'necro', name: 'Necromante do Campo Santo', scale: 1.5, hp: 11, dmg: 1.7, mech: { ...MECH_GROUP('Terra Aberta', 0x9a6aff, 'Cajado de Osso'), adds: { at: [0.7, 0.4], type: 'skeleton', n: 5, line: 'O Necromante abre a terra: um exército de ossos se levanta!' } }, hello: 'Velas pretas em círculo. Alguém canta o nome dos mortos.', bye: 'O Necromante cai no próprio círculo. Uma escada desce mais fundo.' },
        { type: 'glutton', name: 'Demônio da Gula', scale: 1.4, hp: 13, dmg: 1.9, mech: { ...MECH_GROUP('Fome', 0x9aff4a, 'Mordida da Gula'), pools: { every: 13, n: 3, k: 0.3, name: 'Bile', col: 0x8aff3a } }, hello: 'O túnel abre num salão de banquete. Ossos roídos até o brilho.', bye: 'A Gula engole o último suspiro. Uma escada desce mais fundo.' },
        { type: 'suplicio', name: 'Senhor do Suplício', scale: 1.3, hp: 14, dmg: 2.0, mech: { ...MECH_GROUP('Ganchos', 0xff3a1a, 'O Peso da Culpa'), enrage: 'As correntes se soltam todas de uma vez.' }, hello: 'Correntes pendem do teto. Algumas ainda balançam.', bye: 'O Senhor do Suplício cai sob as próprias correntes. Uma escada desce mais fundo.' },
        { type: 'jotun', name: 'Jotun Menor', scale: 1.2, hp: 15, dmg: 2.1, mech: { ...MECH_GROUP('Inverno', 0x9ad7ff, 'Clava de Gelo') }, hello: 'Tão fundo que a terra congela. Um gigante dorme encostado na parede.', bye: 'O gigante cai e a parede racha. Uma escada desce mais fundo.' }] } },
  /* criptas e mausoléus malditos (23/10): a entrada é um mausoléu de pedra com grade de ferro; dentro, a cripta */
  { id: 'esquecidos', name: 'Mausoléu dos Esquecidos', kind: 'subsolo', lvl: [6, 10], theme: 'cripta', near: 'Cemitério Esquecido', dx: -7, dy: -3, main: 2, side: 1, mobs: ['skeleton', 'rat'], players: 'sozinho ou em dupla',
    elite: { type: 'skeleton', name: 'Guardião do Ossuário', scale: 1.4 }, boss: { type: 'tormentor', name: 'Sacristão Sem Rosto', scale: 1.3, hp: 5, dmg: 1.1, mech: { adds: { at: [0.5], type: 'skeleton', n: 3, line: 'O Sacristão toca o sino de ossos: os esquecidos se levantam!' } }, hello: 'Nomes raspados das lápides. Alguém não quer que eles sejam lembrados.', bye: 'O Sacristão cai. Os nomes voltam às pedras.' } },
  { id: 'hemara', name: 'Cripta de Hemara', kind: 'grupo', lvl: [14, 18], theme: 'cripta', near: 'Cripta de Hemara', dx: 4, dy: 4, main: 4, side: 2, mobs: ['skeleton', 'zombie', 'bat'], players: 'grupo de 3',
    elite: { type: 'zombie', name: 'Noivo de Hemara', scale: 1.6 },
    boss: { type: 'prince', name: 'Hemara, a Que Não Descansa', scale: 1.6, hp: 13, dmg: 1.7, mech: { ...MECH_GROUP('Lamento de Hemara', 0xb07aff, 'Toque Gelado'), adds: { at: [0.66, 0.33], type: 'zombie', n: 4, line: 'Hemara chora: os convidados do casamento saem dos caixões!' }, pools: { every: 14, n: 3, k: 0.3, name: 'Lágrimas Negras', col: 0x7a4aff } },
      hello: 'Um véu de noiva sobre um caixão aberto. A noiva não está nele.', bye: 'Hemara se deita, enfim. O véu se desfaz em pó.' },
    uniq: [{ name: 'Véu de Hemara', slot: 'cape', icon: '🕸', lore: 'Leve como cinza. Quem o veste não sente frio, nem calor, nem saudade.' }], title: 'Quem Deitou Hemara' },
  { id: 'catacumbas', name: 'Catacumbas de Askavik', kind: 'grupo', lvl: [24, 28], theme: 'cripta', near: 'Cemitério de Askavik', dx: -6, dy: 8, main: 5, side: 2, mobs: ['skeleton', 'ghoul', 'zombie'], players: 'grupo de 3 a 5',
    elite: { type: 'ghoul', name: 'Comedor de Mortos', scale: 1.7 },
    boss: { type: 'tormentor', name: 'O Coveiro Real', scale: 1.9, hp: 16, dmg: 1.9, mech: { ...MECH_GROUP('Pá do Coveiro', 0xd8c890, 'Cova Aberta'), adds: { at: [0.7, 0.4], type: 'skeleton', n: 5, line: 'O Coveiro bate a pá no chão: os jarls enterrados respondem!' }, pools: { every: 13, n: 3, k: 0.35, name: 'Terra de Cova', col: 0x8a6a3a }, enrage: 'O Coveiro cava a própria cova, e quer companhia.' },
      hello: 'Embaixo de Askavik, os jarls antigos dormem em nichos. Alguém anda abrindo os nichos.', bye: 'O Coveiro Real cai na cova que cavou. Askavik dorme melhor esta noite.' },
    uniq: [{ name: 'Pá do Coveiro Real', slot: 'weapon', icon: '⚒', lore: 'Enterrou nove jarls. Desenterrou dez.' }, { name: 'Anel do Jarl Esquecido', slot: 'ring', icon: '💍', lore: 'Achado num nicho sem nome.' }], title: 'Guardião das Catacumbas' },
  { id: 'vindholt', name: 'Mausoléu Maldito de Vindholt', kind: 'caverna', lvl: null, theme: 'cripta', near: 'Vindholt', dx: 8, dy: 6, main: 3, side: 1, mobs: ['zombie', 'ghoul'], players: 'sozinho ou em dupla',
    elite: { type: 'ghoul', name: 'Herdeiro Podre', scale: 1.5 }, boss: { type: 'prince', name: 'O Barão Maldito', scale: 1.4, hp: 7, dmg: 1.5, mech: { aoe: { every: 10, r: 5, k: 1.2, name: 'Maldição da Linhagem', col: 0xc43a3a } }, hello: 'A família inteira está aqui. Ninguém da família morreu de velho.', bye: 'O Barão Maldito vira pó. A maldição da casa acaba nele.' } },
  /* cavernas abertas: menores, para um ou dois, com o nível da região */
  { id: 'garganta', name: 'Caverna da Garganta', kind: 'caverna', lvl: null, theme: 'mina', near: 'Garganta de Pedra', dx: 6, main: 2, side: 1, mobs: ['bat', 'skeleton'], players: 'sozinho ou em dupla',
    elite: { type: 'skeleton', name: 'Sentinela de Ossos', scale: 1.4 }, boss: { type: 'tormentor', name: 'O Eco da Garganta', scale: 1.3, hp: 6, dmg: 1.4, mech: { aoe: { every: 10, r: 5, k: 1.2, name: 'Grito do Eco', col: 0xc8b8ff } }, hello: 'A Garganta ecoa a sua respiração. Depois, outra respiração.', bye: 'O eco se cala.' } },
  { id: 'lobos', name: 'Toca do Covil dos Lobos', kind: 'caverna', lvl: null, theme: 'mata', near: 'Covil dos Lobos', dx: -6, dy: 3, main: 2, side: 1, mobs: ['wolf', 'wolf'], players: 'sozinho ou em dupla',
    elite: { type: 'wolf', name: 'Lobo de Guarda', scale: 1.2 }, boss: { type: 'werewolf', name: 'Lobo Cinzento', scale: 1.2, hp: 5, dmg: 1.2, mech: { heavy: { every: 12, mul: 2.4, name: 'Bote do Lobo Cinzento' } }, hello: 'Olhos amarelos no escuro. Muitos.', bye: 'O Lobo Cinzento cai. A matilha some.' } },
  { id: 'cume', name: 'Fenda do Cume Gelado', kind: 'caverna', lvl: null, theme: 'gelo', near: 'Cume Gelado', dx: 5, dy: 5, main: 2, side: 1, mobs: ['frostwolf', 'frostwolf'], players: 'sozinho ou em dupla',
    elite: { type: 'frostwolf', name: 'Lobo Branco', scale: 1.2 }, boss: { type: 'frostwolf', name: 'Mãe do Gelo', scale: 1.7, hp: 6, dmg: 1.4, mech: { aoe: { every: 9, r: 5, k: 1.1, name: 'Sopro Gelado', col: 0x9ad7ff } }, hello: 'A fenda estala. O frio tem forma.', bye: 'A Mãe do Gelo se desfaz em neve.' } },
  { id: 'atoleiro', name: 'Poço do Atoleiro', kind: 'caverna', lvl: null, theme: 'mata', near: 'Atoleiro de Zerath', dx: 6, dy: -4, main: 2, side: 1, mobs: ['ghoul', 'bat'], players: 'sozinho ou em dupla',
    elite: { type: 'ghoul', name: 'Afogado do Brejo', scale: 1.4 }, boss: { type: 'ghoul', name: 'O Que Bebe o Brejo', scale: 1.9, hp: 6, dmg: 1.3, mech: { pools: { every: 10, n: 2, k: 0.35, name: 'Lodo', col: 0x7aff6a } }, hello: 'O lodo borbulha. Algo bebe o brejo de baixo para cima.', bye: 'O lodo fica parado, enfim.' } },
  { id: 'draugr', name: 'Túmulo dos Draugr', kind: 'subsolo', lvl: null, theme: 'cripta', near: 'Acampamento Draugr', dx: 5, dy: 5, main: 3, side: 1, mobs: ['skeleton', 'zombie'], players: 'sozinho ou em dupla',
    elite: { type: 'skeleton', name: 'Draugr Antigo', scale: 1.5 }, boss: { type: 'prince', name: 'Rei do Túmulo', scale: 1.4, hp: 7, dmg: 1.4, mech: { adds: { at: [0.5], type: 'skeleton', n: 3, line: 'O Rei do Túmulo chama a guarda!' } }, hello: 'Um trono de ossos. Um rei que não quer descansar.', bye: 'O Rei do Túmulo enfim descansa.' } },
  { id: 'galerias', name: 'Galerias de Brasaforja', kind: 'subsolo', lvl: [4, 8], theme: 'mina', near: 'Brasaforja', dx: -12, dy: 10, main: 2, side: 1, mobs: ['rat', 'bat'], players: 'sozinho',
    elite: { type: 'rat', name: 'Rato das Galerias', scale: 1.25 }, boss: { type: 'imp', name: 'Diabrete da Fornalha Velha', scale: 1.5, hp: 5, dmg: 1.1, mech: { aoe: { every: 11, r: 4.5, k: 1, name: 'Fagulhas', col: 0xffa040 } }, hello: 'As galerias velhas dos anões. Algo mexeu nas fornalhas apagadas.', bye: 'A fornalha velha apaga de vez.' } },
  { id: 'raizes', name: 'Raízes de Lithendel', kind: 'subsolo', lvl: [4, 8], theme: 'mata', near: 'Lithendel', dx: 12, dy: -10, main: 2, side: 1, mobs: ['rat', 'fairy'], players: 'sozinho',
    elite: { type: 'fairy', name: 'Fada das Raízes', scale: 1.5 }, boss: { type: 'treant', name: 'Raiz Doente', scale: 1.1, hp: 4, dmg: 1.0, mech: { pools: { every: 11, n: 2, k: 0.3, name: 'Seiva Podre', col: 0x9aff6a } }, hello: 'Sob as árvores mais velhas, uma raiz apodrece e se mexe.', bye: 'A Raiz Doente seca. Lá em cima, uma árvore suspira.' } },
];

export interface DgCtx {
  scene: THREE.Scene; T: number; city: { map: string[][]; props: { gx: number; gy: number; w: number; h: number }[]; pois: { name: string; x: number; y: number; biome: string }[]; settlements: { name: string; x: number; y: number; radius: number }[] };
  heightAt(x: number, z: number): number; regionLvl(x: number, y: number): [number, number];
  game: { st: { lvl: number; gold: number; hp: number; hpMax: number; dead: boolean }; damage(n: number, at: THREE.Vector3, from?: THREE.Vector3): void; logMsg(t: string, c?: string): void; gainXp(n: number): void;
    enemies: { list: { alive: boolean; hp: number; hpMax: number; pos: THREE.Vector3; def: { name: string; dmg: number; speed: number }; type: EnemyType; state: string }[]; spawn(type: EnemyType, x: number, z: number, o: Record<string, unknown>): unknown; clearTag(tag: string): void };
    dropLoot(x: number, z: number, y: number, id: string, n: number): void; spawnGear(x: number, z: number, y: number, ilvl: number, boost?: Record<string, number>, n?: number, rarityMin?: string, preset?: Gear[]): void; xpNeed(): number };
  particles: { spawn(x: number, y: number, z: number, o: Record<string, number>): void };
  audio: { boom(): void; chime(): void; coins(n: number): void; spell(k: 'shock' | 'fire' | 'ice' | 'arcane' | 'earth' | 'holy'): void };
  /** posição na tela de um ponto do mundo (para o nome da entrada, em letra nítida) */ project?(p: THREE.Vector3): { x: number; y: number } | null;
  heroPos(): THREE.Vector3; partySize(): number; /** nível médio do grupo (ou o seu, sozinho) */ partyLvl?(): number; say(t: string): void; fine(o: THREE.Object3D): THREE.Object3D;
  onClear?(d: DgDef, first: boolean): void;
  /** chefe e elite com kit (chefes.ts): magias, andar e roupa da história */ onKit?(e: unknown): void; onStop?(): void;
  /** desce para o próximo nível de uma masmorra sem fundo */ descend?(depth: number, tier: number): void;
}
type E = DgCtx['game']['enemies']['list'][number] & { tag?: string; own?: number; ownT?: number };

export function createMasmorras(ctx: DgCtx) {
  const T = ctx.T;
  const efx: { x: number; z: number; fx: EntranceFx; el: HTMLElement; y: number }[] = []; /* (no topo: as entradas são montadas logo abaixo) */
  /* ---------- entradas no mundo ---------- */
  const busy = new Set<string>(); for (const p of ctx.city.props) for (let y = p.gy - 1; y <= p.gy + p.h; y++) for (let x = p.gx - 1; x <= p.gx + p.w; x++) busy.add(x + ',' + y);
  const target = (nm: string) => ctx.city.pois.find((p) => p.name === nm) ?? ctx.city.settlements.find((s) => s.name === nm) ?? null;
  const spotOk = (x: number, y: number, loose = false) => { for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const t = ctx.city.map[y + dy]?.[x + dx], core = Math.abs(dx) <= 1 && Math.abs(dy) <= 1; if (core ? t !== 'grass' && t !== 'road' && t !== 'plaza' : !t || t === 'water' || t === 'wall') return false; if ((!loose || core) && busy.has(x + dx + ',' + (y + dy))) return false; }
    return !ctx.city.settlements.some((s) => Math.hypot(s.x - x, s.y - y) < s.radius + 2); };
  const entrances: { d: DgDef; x: number; y: number; lvl: [number, number]; root: THREE.Group; sign?: { x: number; z: number } }[] = [];
  /** a dificuldade escolhida na placa (Erling, 25/10): a masmorra acompanha o seu nível, mas você pode pedir mais — e o prêmio cresce junto */
  for (const d of DUNGEONS) {
    if (d.fixed) { const t1 = target(d.near); if (!t1) continue; const fx0 = t1.x + (d.dx ?? 0), fy0 = t1.y + (d.dy ?? 0); const root = mouthFixed(d, fx0 * T, fy0 * T); entrances.push({ d, x: Math.floor(fx0), y: Math.floor(fy0), lvl: d.lvl ?? [1, 5], root }); continue; }
    const t0 = target(d.near); if (!t0) continue; const bx = Math.round(t0.x + (d.dx ?? 0)), by = Math.round(t0.y + (d.dy ?? 6)); let at: { x: number; y: number } | null = null;
    for (let r = 0; r < 48 && !at; r++) for (let a = 0; a < 24 && !at; a++) { const x = Math.round(bx + Math.cos((a / 24) * 6.283) * r), y = Math.round(by + Math.sin((a / 24) * 6.283) * r); if (spotOk(x, y)) at = { x, y }; }
    for (let r = 1; r < 44 && !at; r++) for (let a = 0; a < r * 8 && !at; a++) { const x = Math.round(bx + Math.cos((a / (r * 8)) * 6.283) * r), y = Math.round(by + Math.sin((a / (r * 8)) * 6.283) * r); if (spotOk(x, y, true)) at = { x, y }; } // 2ª passada: aceita árvores e cercas em volta
    if (!at) continue; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) busy.add(at.x + dx + ',' + (at.y + dy));
    const lvl: [number, number] = d.lvl ?? (() => { const [lo, hi] = ctx.regionLvl(at!.x, at!.y); const m = Math.round((lo + hi) / 2); return [Math.max(1, m - 2), m + 2]; })();
    const root = mouth(d, at.x * T, at.y * T); const big = d.kind === 'grupo' ? 1.3 : 1, lx = -3.9 * big - 0.4, lz = 3.6 * big, ca = Math.cos(Math.PI / 4), sa = Math.sin(Math.PI / 4); /* a placa entalhada (entradas.ts), girada com a boca */
    entrances.push({ d, x: at.x, y: at.y, lvl, root, sign: { x: at.x * T + lx * ca + lz * sa, z: at.y * T - lx * sa + lz * ca } });
    ctx.city.pois.push({ name: d.name, x: at.x, y: at.y + 1, biome: 'rock' });
  }
  /** a escada já está no prédio: só o nome flutuando e a luz (a boca não é montada no mundo) */
  function mouthFixed(d: DgDef, x: number, z: number) { const { g, fx } = buildEntrance({ name: d.name, kind: d.kind, theme: d.theme === 'arquivo' ? 'cripta' : d.theme, players: d.players, scaled: true }, ctx.fine); const root = new THREE.Group(); root.position.set(x, ctx.heightAt(x, z), z); ctx.scene.add(root); void g;
    const el = document.createElement('div'); el.className = 'dgname'; el.innerHTML = `<b>${d.name}</b><small>Subsolo da Grande Biblioteca · ${d.players} · níveis ${d.lvl?.[0]}–${d.lvl?.[1]}</small>`; document.body.appendChild(el); efx.push({ x, z, fx, el, y: root.position.y + 0.9 }); return root; }
  /** a boca da masmorra: rochas em arco e um buraco escuro (caverna), um alçapão de pedra (subsolo) ou vigas de mina */
  /** a entrada no mundo (entradas.ts): escadaria que desce, luz, placa entalhada e o que o tema pede */
  function mouth(d: DgDef, x: number, z: number) {
    const { g, fx } = buildEntrance({ name: d.name, kind: d.kind, theme: d.theme, players: d.players, scaled: true }, ctx.fine);
    g.position.set(x, ctx.heightAt(x, z), z); g.rotation.y = Math.PI / 4; /* de frente para a câmera (que olha de 45°): a escada desce para dentro da tela */ ctx.scene.add(g);
    const el = document.createElement('div'); el.className = 'dgname' + (d.kind === 'grupo' ? ' grp' : ''); el.innerHTML = `<b>${d.name}</b><small>${d.kind === 'grupo' ? '⚔ Masmorra' : d.kind === 'subsolo' ? 'Subsolo' : 'Caverna'} · ${d.players} · acompanha o seu nível</small>`; document.body.appendChild(el);
    efx.push({ x, z, fx, el, y: g.position.y }); return g;
  }

  /* ---------- a corrida (uma masmorra por vez) ---------- */
  const HUD = document.createElement('div'); HUD.id = 'dghud'; document.body.appendChild(HUD);
  type Pool = { x: number; z: number; r: number; t: number; m: THREE.Mesh; dmg: number };
  let run: null | { tier: (typeof DG_TIERS)[number]; d: DgDef; int: DungeonFloor; O: { x: number; z: number }; pre: string; lvl: [number, number]; kills: number; need: number; total: number; boss: E | null; bossHp: number;
    phase: number; aoeT: number; heavyT: number; poolT: number; enraged: boolean; pools: Pool[]; opened: Set<number>; done: boolean; dead: Set<string>; depth: number; ti: number } = null;
  const rr = (s: number) => () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const hashS = (s: string) => { let h = 7; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) % 2147483647; return h || 1; };
  function build(d: DgDef, depth = 0) { return buildDungeon({ seed: hashS(d.id + (depth ? ':' + depth : '')), theme: d.theme, main: Math.min(12, d.main + Math.floor(depth / 2)), side: Math.min(6, d.side + Math.floor(depth / 3)), boss: d.kind === 'grupo' ? 11 : 8 }); }
  /** começa: monta os bandos com chaves de rede determinísticas (o grupo vê os mesmos bichos) */
  function start(e: (typeof entrances)[number], int: DungeonFloor, O: { x: number; z: number }, inst: string, tier = 0, depth = 0) {
    const TI = DG_TIERS[Math.max(0, Math.min(DG_TIERS.length - 1, tier))];
    const d0 = e.d, d: DgDef = d0.deep && depth ? { ...d0, mobs: d0.deep.mobs[depth % d0.deep.mobs.length], boss: d0.deep.bosses[depth % d0.deep.bosses.length] } : d0; e = { ...e, d };
    const  r = rr(hashS(d.id + 'mobs' + depth)), n = Math.max(1, ctx.partySize()), pre = `dg:${d.id}:${inst}:${depth}`;
    ctx.game.enemies.clearTag('dg');
    /* a masmorra acompanha quem entra (Erling, 25/10): sozinho, ela pega o seu nível; em grupo, a média do grupo */
    const avg = Math.max(1, Math.round(ctx.partyLvl?.() ?? ctx.game.st.lvl)), dLv = d.deep ? depth * d.deep.step : 0, lo = Math.max(1, avg - 1 + TI.lv + dLv), hi = avg + 2 + TI.lv + dLv; /* cada nível dos Túneis: +3 níveis */ e = { ...e, lvl: [lo, hi] };
    let total = 0, boss: E | null = null;
    const S = (type: EnemyType, x: number, z: number, L: number, o: Record<string, unknown> = {}) => { const k = lvlScale(type, L); return ctx.game.enemies.spawn(type, O.x + x, O.z + z, { tag: 'dg', lvl: L, hpMul: k.hp * TI.hp * (o.hpX as number ?? 1), dmgMul: k.dmg * TI.dmg * (o.dmgX as number ?? 1), aggro: 13, leash: 999, net: pre, ...o }) as E; };
    const main = int.rooms.filter((q) => q.kind === 'pack' || q.kind === 'elite');
    int.rooms.forEach((rm) => {
      const step = Math.max(0, main.indexOf(rm)), L = Math.round(lo + (hi - lo) * Math.min(1, step / Math.max(1, main.length - 1)));
      const at = () => ({ x: rm.x + (r() - 0.5) * (rm.w - 4), z: rm.z + (r() - 0.5) * (rm.d - 4) });
      if (rm.kind === 'pack') { const k = 3 + (r() < 0.5 ? 1 : 0) + (n >= 4 ? 1 : 0); for (let i = 0; i < k; i++) { const p = at(); S(d.mobs[Math.floor(r() * d.mobs.length)], p.x, p.z, L, { hpX: 0.8 + 0.2 * Math.min(n, 5) }); total++; } }
      else if (rm.kind === 'elite') { ctx.onKit?.(S(d.elite.type, rm.x, rm.z, hi, { name: d.elite.name, scale: d.elite.scale, hpX: 3.2 * (0.6 + 0.2 * Math.min(n, 5)), dmgX: 1.35 })); total++; for (let i = 0; i < 2; i++) { const p = at(); S(d.mobs[Math.floor(r() * d.mobs.length)], p.x, p.z, L); total++; } }
      else if (rm.kind === 'side') { for (let i = 0; i < 2; i++) { const p = at(); S(d.mobs[Math.floor(r() * d.mobs.length)], p.x, p.z, L); total++; } }
      else if (rm.kind === 'boss') { const b = d.boss, sizeK = d.kind === 'grupo' ? 0.45 + 0.3 * (Math.min(n, 5) - 1) : 0.7 + 0.3 * (Math.min(n, 3) - 1); boss = S(b.type, rm.x, rm.z - 2, hi + 1, { name: b.name, scale: b.scale, hpX: b.hp * sizeK, dmgX: b.dmg * (n >= 3 || d.kind !== 'grupo' ? 1 : 0.85), aggro: 11 }); ctx.onKit?.(boss); }
    });
    const need = Math.ceil(total * (d.kind === 'grupo' ? 0.7 : 0.6));
    run = { tier: TI, d, int, O, pre, lvl: e.lvl, kills: 0, need, total, boss, bossHp: 1, phase: 0, aoeT: 6, heavyT: 9, poolT: 8, enraged: false, pools: [], opened: new Set(), done: false, dead: new Set(), depth, ti: tier };
    ctx.game.logMsg(`⚔ ${d.name}${d.deep ? ` · Nível ${depth + 1} da descida` : ''} · ${TI.name} (nível ${e.lvl[0]}–${e.lvl[1]}, ${d.players}). Derrube ${need} criaturas para abrir o portão do chefe.`, '#ff9a8a');
    if (d.deep) { const best = +(localStorage.getItem('karmika.dg.fundo.' + d.id) || 0); if (depth + 1 > best) try { localStorage.setItem('karmika.dg.fundo.' + d.id, String(depth + 1)); } catch { /* */ } }
    hud();
  }
  function stop() { ctx.onStop?.(); if (!run) return; for (const p of run.pools) ctx.scene.remove(p.m); ctx.game.enemies.clearTag('dg'); ctx.game.enemies.clearTag('dg-add'); run = null; HUD.style.display = 'none'; }
  function hud() {
    if (!run) { HUD.style.display = 'none'; return; } const R = run, b = R.boss, open = !!R.int.gate?.opened;
    HUD.style.display = 'block';
    HUD.innerHTML = `<b>${R.d.name}${R.d.deep ? ` · nível ${R.depth + 1}` : ''}</b><small style="color:${R.tier.col}">${R.tier.name}</small><small>nível ${R.lvl[0]}–${R.lvl[1]} · ${R.d.players}</small>` +
      (R.done ? `<div class="dg-done">✦ Vencida. O baú do chefe é seu.${R.d.deep ? ' Uma escada desce mais fundo (E perto do trono).' : ''}</div>` : open ? (b ? `<div class="dg-boss"><span>${b.def.name}</span><i style="width:${Math.max(0, (b.hp / b.hpMax) * 100).toFixed(1)}%"></i></div>` : '') :
        `<div class="dg-gate">🗝 Portão do chefe: <b>${Math.min(R.kills, R.need)}</b> / ${R.need}</div>`);
  }
  /** um bicho da masmorra caiu (meu golpe ou do grupo) */
  function onKill(e: E) {
    if (!run || e.tag !== 'dg') return; const R = run;
    if (e === R.boss) { victory(); return; }
    R.kills++; if (!R.int.gate?.opened && R.kills >= R.need) { R.int.gate?.open(); ctx.audio.boom(); ctx.game.logMsg(`🗝 O portão do chefe se abre: ${R.d.boss.name} espera no fundo.`, '#ffd27a'); ctx.say(R.d.boss.hello); }
    hud();
  }
  function victory() {
    if (!run || run.done) return; const R = run; R.done = true; const d = R.d, b = R.boss!;
    const key = 'karmika.dg.' + d.id, first = !localStorage.getItem(key); try { localStorage.setItem(key, String((+(localStorage.getItem(key) || 0)) + 1)); } catch { /* */ }
    ctx.say(d.boss.bye); ctx.audio.boom(); ctx.audio.chime();
    for (let i = 0; i < 120; i++) { const a = Math.random() * 6.283, s = 2 + Math.random() * 6; ctx.particles.spawn(b.pos.x, 1 + Math.random() * 2, b.pos.z, { vx: Math.cos(a) * s, vy: Math.random() * 6, vz: Math.sin(a) * s, life: 1.4, s0: 0.3, s1: 0.04, c0: 0xfff0b0, c1: 0xff8a3a, a: 1, drag: 1.5 }); }
    /* o saque é de cada um: equipamentos bons e, às vezes, a peça única da masmorra */
    const ilvl = R.lvl[1] + 1, y = ctx.heightAt(b.pos.x, b.pos.z);
    ctx.game.spawnGear(b.pos.x, b.pos.z, y, ilvl, { rare: 6 * R.tier.loot, legendary: 4 * R.tier.loot, epic: 2 * R.tier.loot }, (d.kind === 'grupo' ? 3 : 2) + R.tier.extra, R.tier.min);
    const uq = d.uniq?.length && (first || Math.random() < (d.kind === 'grupo' ? 0.3 : 0) + R.tier.uq) ? d.uniq[Math.floor(Math.random() * d.uniq.length)] : null;
    if (uq) { const g = genGear(ilvl, 'epic', uq.slot); g.name = uq.name; g.icon = uq.icon; g.rarity = 'unique'; (g as Gear & { lore?: string }).lore = uq.lore; for (const k of Object.keys(g.stats) as (keyof Gear['stats'])[]) g.stats[k] = Math.round((g.stats[k] ?? 0) * 1.25 * 10) / 10; ctx.game.spawnGear(b.pos.x + 1, b.pos.z, y, ilvl, {}, 1, 'unique', [g]); ctx.game.logMsg(`✦ Peça única: ${uq.name}!`, '#f2cf6a'); }
    const bonus = Math.round(ctx.game.xpNeed() * (d.kind === 'grupo' ? (first ? 0.6 : 0.25) : (first ? 0.3 : 0.1)) * R.tier.xp); if (bonus > 0) ctx.game.gainXp(bonus);
    ctx.game.st.gold += Math.round((d.kind === 'grupo' ? 40 : 15) * Math.max(1, Math.round(R.lvl[1] / 5)) * R.tier.gold); if (R.tier.lv) ctx.game.logMsg(`✦ ${R.tier.name}: prêmio ×${R.tier.gold}`, R.tier.col); ctx.audio.coins(3);
    if (d.pet && Math.random() < d.pet.p * (1 + 0.5 * R.ti) + (first ? 0.1 : 0)) { ctx.game.dropLoot(b.pos.x - 1, b.pos.z, y, d.pet.id, 1); ctx.game.logMsg('🐾 Algo pequeno e vivo saiu de perto do chefe e ficou olhando para você…', '#ffd27a'); }
    if (d.deep) { const extra = Math.round(30 * (R.depth + 1) * Math.max(1, R.lvl[1] / 6)); ctx.game.st.gold += extra; ctx.game.logMsg(`🪙 Tesouro do nível ${R.depth + 1}: +${extra} de ouro. A escada para o nível ${R.depth + 2} está aberta.`, '#ffe08a');
      if (R.depth >= 2) ctx.game.spawnGear(b.pos.x - 1.5, b.pos.z + 1, y, ilvl + R.depth, { legendary: 4 + R.depth, epic: 2 + R.depth * 0.5 }, 1 + Math.floor(R.depth / 3), 'rare'); }
    ctx.onClear?.(d, first); hud();
  }
  /* ---------- chefe: telegrafa, chama ajuda, joga poças, enfurece ---------- */
  const v3 = new THREE.Vector3();
  function ring(x: number, z: number, R0: number, col: number, dur: number, then: () => void) {
    const m = new THREE.Mesh(new THREE.RingGeometry(R0 - 0.25, R0, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending }));
    const f = new THREE.Mesh(new THREE.CircleGeometry(R0, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.12, depthWrite: false, blending: THREE.AdditiveBlending }));
    m.position.set(x, 0.07, z); f.position.set(x, 0.06, z); ctx.scene.add(ctx.fine(m)); ctx.scene.add(ctx.fine(f)); let t = 0; const t0 = performance.now();
    const tick = () => { t = (performance.now() - t0) / 1000; const k = Math.min(1, t / dur); f.scale.setScalar(Math.max(0.05, k)); (f.material as THREE.MeshBasicMaterial).opacity = 0.12 + 0.3 * k;
      if (k < 1) requestAnimationFrame(tick); else { ctx.scene.remove(m); ctx.scene.remove(f); then(); } }; tick();
  }
  let flickT = 0;
  function update(dt: number) {
    flickT += dt; { const hp = ctx.heroPos(); for (const e of efx) { const near = Math.abs(e.x - hp.x) < 45 && Math.abs(e.z - hp.z) < 45; if (near) flickerEntrance(e.fx, flickT);
      /* o nome em letra nítida sobre a entrada, quando você chega perto (some dentro da masmorra) */
      const dd = Math.hypot(e.x - hp.x, e.z - hp.z), sp = !run && dd < 22 && ctx.project ? ctx.project(new THREE.Vector3(e.x, e.y + 4.6, e.z)) : null;
      if (sp) { e.el.style.display = 'block'; e.el.style.left = sp.x + 'px'; e.el.style.top = sp.y + 'px'; e.el.style.opacity = String(Math.min(1, (22 - dd) / 6)); } else if (e.el.style.display !== 'none') e.el.style.display = 'none'; } }
    if (!run) return; const R = run, b = R.boss; if (!b || R.done) return;
    if (!b.alive) { if (!R.done && b.hp <= 0) victory(); return; }
    const hp = ctx.heroPos(), dist = Math.hypot(hp.x - b.pos.x, hp.z - b.pos.z), engaged = b.state !== 'idle' && b.state !== 'return' && dist < 30;
    if (Math.abs(b.hp / b.hpMax - R.bossHp) > 0.004) { R.bossHp = b.hp / b.hpMax; hud(); }
    if (!engaged) return;
    const M = R.d.boss.mech, frac = b.hp / b.hpMax, mine = !(b.own && performance.now() - (b.ownT ?? 0) < 1500); // mine = o chefe está atrás de mim
    if (M.adds && R.phase < M.adds.at.length && frac < M.adds.at[R.phase]) { const ph = R.phase++; ctx.say(M.adds.line); ctx.audio.spell('shock');
      for (let i = 0; i < M.adds.n; i++) { const a = (i / M.adds.n) * 6.283, x = b.pos.x + Math.cos(a) * 6, z = b.pos.z + Math.sin(a) * 6; const k = lvlScale(M.adds.type, R.lvl[1]); ctx.game.enemies.spawn(M.adds.type, x, z, { tag: 'dg-add', lvl: R.lvl[1], hpMul: k.hp * 0.7, dmgMul: k.dmg * 0.8, aggro: 30, leash: 999, net: `${R.pre}a${ph}` });
        for (let j = 0; j < 14; j++) ctx.particles.spawn(x, 0.3, z, { vx: (Math.random() - 0.5) * 3, vy: 1 + Math.random() * 3, vz: (Math.random() - 0.5) * 3, life: 0.8, s0: 0.25, s1: 0.04, c0: 0x8a6a5a, c1: 0x2a1a10, a: 1 }); } }
    if (M.enrage && !R.enraged && frac < 0.2) { R.enraged = true; b.def.dmg = Math.round(b.def.dmg * 1.3); b.def.speed *= 1.2; ctx.say(M.enrage); }
    if (M.aoe) { R.aoeT -= dt; if (R.aoeT <= 0) { R.aoeT = M.aoe.every * (R.enraged ? 0.75 : 1); const cx = b.pos.x, cz = b.pos.z, A = M.aoe; ctx.say(`${b.def.name}: ${A.name}! Saia do círculo!`);
        ring(cx, cz, A.r, A.col, 1.7, () => { const h = ctx.heroPos(); if (!ctx.game.st.dead && Math.hypot(h.x - cx, h.z - cz) < A.r) ctx.game.damage(Math.round(b.def.dmg * A.k), h, v3.set(cx, 0, cz)); ctx.audio.spell('shock');
          for (let i = 0; i < 40; i++) { const a = Math.random() * 6.283, rr2 = Math.random() * A.r; ctx.particles.spawn(cx + Math.cos(a) * rr2, 0.2, cz + Math.sin(a) * rr2, { vy: 2 + Math.random() * 3, life: 0.8, s0: 0.3, s1: 0.05, c0: 0xffffff, c1: A.col, a: 1 }); } }); } }
    if (M.heavy && mine) { R.heavyT -= dt; if (R.heavyT <= 0 && dist < 8) { R.heavyT = M.heavy.every; const H = M.heavy; ctx.say(`${b.def.name} prepara ${H.name} em você! Bloqueie (segure a Guarda), ou um escudo e cura!`);
        ring(hp.x, hp.z, 2.2, 0xff2010, 1.4, () => { const h = ctx.heroPos(); if (!ctx.game.st.dead && Math.hypot(h.x - b.pos.x, h.z - b.pos.z) < 7.5) ctx.game.damage(Math.round(b.def.dmg * H.mul), h, b.pos.clone()); ctx.audio.boom(); }); } }
    if (M.pools) { R.poolT -= dt; if (R.poolT <= 0) { R.poolT = M.pools.every; const P0 = M.pools; for (let i = 0; i < P0.n; i++) { const a = Math.random() * 6.283, rr2 = 2 + Math.random() * 7, x = (i === 0 ? hp.x : b.pos.x + Math.cos(a) * rr2), z = (i === 0 ? hp.z : b.pos.z + Math.sin(a) * rr2);
        const m = new THREE.Mesh(new THREE.CircleGeometry(1.8, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: P0.col, transparent: true, opacity: 0, depthWrite: false })); m.position.set(x, 0.05, z); ctx.scene.add(ctx.fine(m)); R.pools.push({ x, z, r: 1.8, t: 0, m, dmg: Math.max(1, Math.round(b.def.dmg * P0.k)) }); }
        ctx.game.logMsg(`☣ ${P0.name} no chão: não fique em cima!`, '#9aff8a'); } }
    for (let i = R.pools.length - 1; i >= 0; i--) { const p = R.pools[i]; p.t += dt; const mt = p.m.material as THREE.MeshBasicMaterial; mt.opacity = p.t < 1.2 ? 0.25 * p.t / 1.2 : p.t > 13 ? Math.max(0, 0.55 * (14 - p.t)) : 0.55;
      if (p.t >= 1.2 && Math.floor(p.t) !== Math.floor(p.t - dt) && !ctx.game.st.dead && Math.hypot(hp.x - p.x, hp.z - p.z) < p.r) ctx.game.damage(p.dmg, hp, v3.set(p.x, 0, p.z));
      if (Math.random() < dt * 6) ctx.particles.spawn(p.x + (Math.random() - 0.5) * 3, 0.1, p.z + (Math.random() - 0.5) * 3, { vy: 0.8, life: 0.8, s0: 0.15, s1: 0.03, c0: mt.color.getHex(), c1: 0x101010, a: 0.8 });
      if (p.t > 14) { ctx.scene.remove(p.m); R.pools.splice(i, 1); } }
  }
  /** o que dá para fazer perto (lá dentro): baús, o portão */
  function interactions(hx: number, hz: number, add: (d: number, r: number, label: string, act: () => void) => void) {
    if (!run) return; const R = run;
    R.int.chests.forEach((c, i) => { const x = R.O.x + c.x, z = R.O.z + c.z, dd = Math.hypot(hx - x, hz - z); if (dd > 4 || R.opened.has(i)) return;
      add(dd, 2.8, 'E — Abrir o baú', () => { R.opened.add(i); ctx.audio.coins(2); const g = 8 + Math.floor(Math.random() * 12) * Math.max(1, Math.round(R.lvl[1] / 6)); ctx.game.st.gold += g; ctx.game.logMsg(`📦 Baú: ${g} de ouro.`, '#ffe08a');
        if (Math.random() < 0.8) ctx.game.spawnGear(x, z, 0, R.lvl[1], { rare: 3, legendary: 1 }, 1, 'magic');
        for (let k = 0; k < 30; k++) ctx.particles.spawn(x, 0.8, z, { vx: (Math.random() - 0.5) * 3, vy: 2 + Math.random() * 3, vz: (Math.random() - 0.5) * 3, life: 0.9, s0: 0.2, s1: 0.03, c0: 0xffe08a, c1: 0xb8924a, a: 1, drag: 1.5 }); }); });
    if (R.done && R.d.deep) { const bm = R.int.rooms.find((q) => q.kind === 'boss'); if (bm) { const x = R.O.x + bm.x, z = R.O.z + bm.z - 4, dd = Math.hypot(hx - x, hz - z); if (dd < 7) add(dd, 6, `⬇ E — Descer ao nível ${R.depth + 2} dos Túneis (+${R.d.deep.step} níveis)`, () => ctx.descend?.(R.depth + 1, R.ti)); } }
    const gt = R.int.gate; if (gt && !gt.opened) { const x = R.O.x + gt.x, z = R.O.z + gt.z, dd = Math.hypot(hx - x, hz - z); if (dd < 4.5) add(dd, 3, `🗝 Portão do chefe — faltam ${Math.max(0, R.need - R.kills)} criaturas`, () => hud()); }
  }
  /** chegou alguém do grupo: quem já está dentro conta o que já caiu e o portão */
  function snapshot() { if (!run) return null; return { id: run.d.id, kills: run.kills, gate: !!run.int.gate?.opened, dead: ctx.game.enemies.list.filter((e) => (e as E).tag === 'dg' && !e.alive).map((e) => (e as unknown as { net?: string }).net).filter(Boolean) as string[] }; }
  function applySnapshot(s: { id: string; kills: number; gate: boolean; dead: string[] }) {
    if (!run || run.d.id !== s.id) return; run.kills = Math.max(run.kills, s.kills); if (s.gate && !run.int.gate?.opened) run.int.gate?.open();
    const dead = new Set(s.dead); for (const e of ctx.game.enemies.list) { const n = (e as unknown as { net?: string }).net; if ((e as E).tag === 'dg' && n && dead.has(n) && e.alive) { e.alive = false; e.hp = 0; e.state = 'dead'; } } hud();
  }
  return { entrances, start, stop, update, onKill, interactions, snapshot, applySnapshot, build, get run() { return run; } };
}
