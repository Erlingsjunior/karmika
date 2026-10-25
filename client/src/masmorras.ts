/** Masmorras, cavernas e subsolos (Erling, 23/10: "aumentar o conteúdo do mapa sem aumentar o mapa").
 *  - Entradas espalhadas pelo mundo (bocas de caverna, alçapões, minas), marcadas no mapa.
 *  - Dentro: salas com bandos, um elite, salas laterais com baú, um portão (contador de abates, nunca "matar todos")
 *    e o salão do chefe, com mecânicas que pedem tanque, cura e dano.
 *  - Em grupo: quem é do mesmo grupo cai na MESMA cópia (os monstros têm as mesmas chaves de rede); cada um rola o seu saque. */
import * as THREE from 'three';
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
export interface DgDef {
  id: string; name: string; kind: 'grupo' | 'caverna' | 'subsolo'; lvl: [number, number] | null; theme: DgTheme; near: string; dx?: number; dy?: number;
  main: number; side: number; mobs: EnemyType[]; players: string;
  elite: { type: EnemyType; name: string; scale: number };
  boss: { type: EnemyType; name: string; scale: number; hp: number; dmg: number; mech: BossMech; hello: string; bye: string };
  uniq?: { name: string; slot: Slot; icon: string; lore: string }[];
  title?: string;
}
const MECH_GROUP = (aoe: string, col: number, heavy: string): BossMech => ({ aoe: { every: 9, r: 6.5, k: 1.3, name: aoe, col }, heavy: { every: 13, mul: 3.2, name: heavy } });
export const DUNGEONS: DgDef[] = [
  { id: 'toca', name: 'Toca das Ratazanas Rubras', kind: 'grupo', lvl: [10, 15], theme: 'toca', near: 'Cemitério Esquecido', dy: 4, main: 4, side: 2, mobs: ['rat', 'rat', 'bat'], players: 'grupo de 3',
    elite: { type: 'rat', name: 'Ratazana Alfa', scale: 1.9 },
    boss: { type: 'rat', name: 'Mãe-Ninhada', scale: 3.4, hp: 16, dmg: 2.0, mech: { ...MECH_GROUP('Guincho da Ninhada', 0xff4a3a, 'Mordida Dilacerante'), adds: { at: [0.7, 0.4], type: 'rat', n: 5, line: 'A Mãe-Ninhada guincha: os filhotes saem das paredes!' }, pools: { every: 15, n: 3, k: 0.35, name: 'Peste', col: 0x6aff4a }, enrage: 'A Mãe-Ninhada, ferida, fica ainda mais faminta.' },
      hello: 'Algo enorme se mexe no ninho. Os filhotes param de chiar.', bye: 'A Mãe-Ninhada tomba. Debaixo do cemitério, o silêncio volta.' },
    uniq: [{ name: 'Dente da Mãe-Ninhada', slot: 'weapon', icon: '🗡', lore: 'Arrancado do maior rato que Karmika já viu. Ainda cheira a peste.' }, { name: 'Capa de Couro Rubro', slot: 'cape', icon: '🧥', lore: 'Costurada com o couro da Ninhada: os ratos fogem de quem a usa.' }],
    title: 'Caçador da Ninhada' },
  { id: 'minas', name: 'Minas Afogadas', kind: 'grupo', lvl: [18, 22], theme: 'mina', near: 'Cinzalto', dx: 10, dy: -6, main: 5, side: 2, mobs: ['skeleton', 'bat', 'ghoul'], players: 'grupo de 3 a 5',
    elite: { type: 'ghoul', name: 'Mineiro Afogado', scale: 1.6 },
    boss: { type: 'tormentor', name: 'Capataz Sem Lanterna', scale: 1.7, hp: 14, dmg: 1.8, mech: { ...MECH_GROUP('Picareta Giratória', 0xffb040, 'Golpe do Capataz'), adds: { at: [0.6, 0.3], type: 'skeleton', n: 4, line: 'O Capataz bate o sino: os mineiros mortos voltam ao turno!' }, enrage: 'O Capataz apaga a última lanterna e avança no escuro.' },
      hello: 'Um sino toca no fundo da mina. Ninguém sobe com vida desde o desabamento.', bye: 'O Capataz cai. As lanternas da mina se acendem sozinhas.' },
    uniq: [{ name: 'Lanterna do Capataz', slot: 'relic', icon: '🏮', lore: 'A luz que ele perdeu. Ilumina quem não tem medo do escuro.' }, { name: 'Elmo de Mineiro Anão', slot: 'helm', icon: '⛑', lore: 'Amassado por mil desabamentos e nenhum deles venceu.' }], title: 'Desafogador das Minas' },
  { id: 'fiorde', name: 'Gruta do Fiorde', kind: 'grupo', lvl: [32, 38], theme: 'gelo', near: 'Skjoldvik', dx: -8, dy: 6, main: 5, side: 2, mobs: ['frostwolf', 'skeleton', 'frostwolf'], players: 'grupo de 3 a 5',
    elite: { type: 'frostwolf', name: 'Lobo do Gelo Eterno', scale: 1.8 },
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
    elite: { type: 'wolf', name: 'Lobo de Guarda', scale: 1.5 }, boss: { type: 'werewolf', name: 'Lobo Cinzento', scale: 1.2, hp: 5, dmg: 1.2, mech: { heavy: { every: 12, mul: 2.4, name: 'Bote do Lobo Cinzento' } }, hello: 'Olhos amarelos no escuro. Muitos.', bye: 'O Lobo Cinzento cai. A matilha some.' } },
  { id: 'cume', name: 'Fenda do Cume Gelado', kind: 'caverna', lvl: null, theme: 'gelo', near: 'Cume Gelado', dx: 5, dy: 5, main: 2, side: 1, mobs: ['frostwolf', 'frostwolf'], players: 'sozinho ou em dupla',
    elite: { type: 'frostwolf', name: 'Lobo Branco', scale: 1.5 }, boss: { type: 'frostwolf', name: 'Mãe do Gelo', scale: 2.2, hp: 6, dmg: 1.4, mech: { aoe: { every: 9, r: 5, k: 1.1, name: 'Sopro Gelado', col: 0x9ad7ff } }, hello: 'A fenda estala. O frio tem forma.', bye: 'A Mãe do Gelo se desfaz em neve.' } },
  { id: 'atoleiro', name: 'Poço do Atoleiro', kind: 'caverna', lvl: null, theme: 'mata', near: 'Atoleiro de Zerath', dx: 6, dy: -4, main: 2, side: 1, mobs: ['ghoul', 'bat'], players: 'sozinho ou em dupla',
    elite: { type: 'ghoul', name: 'Afogado do Brejo', scale: 1.4 }, boss: { type: 'ghoul', name: 'O Que Bebe o Brejo', scale: 1.9, hp: 6, dmg: 1.3, mech: { pools: { every: 10, n: 2, k: 0.35, name: 'Lodo', col: 0x7aff6a } }, hello: 'O lodo borbulha. Algo bebe o brejo de baixo para cima.', bye: 'O lodo fica parado, enfim.' } },
  { id: 'draugr', name: 'Túmulo dos Draugr', kind: 'subsolo', lvl: null, theme: 'cripta', near: 'Acampamento Draugr', dx: 5, dy: 5, main: 3, side: 1, mobs: ['skeleton', 'zombie'], players: 'sozinho ou em dupla',
    elite: { type: 'skeleton', name: 'Draugr Antigo', scale: 1.5 }, boss: { type: 'prince', name: 'Rei do Túmulo', scale: 1.4, hp: 7, dmg: 1.4, mech: { adds: { at: [0.5], type: 'skeleton', n: 3, line: 'O Rei do Túmulo chama a guarda!' } }, hello: 'Um trono de ossos. Um rei que não quer descansar.', bye: 'O Rei do Túmulo enfim descansa.' } },
  { id: 'galerias', name: 'Galerias de Brasaforja', kind: 'subsolo', lvl: [4, 8], theme: 'mina', near: 'Brasaforja', dx: -12, dy: 10, main: 2, side: 1, mobs: ['rat', 'bat'], players: 'sozinho',
    elite: { type: 'rat', name: 'Rato das Galerias', scale: 1.6 }, boss: { type: 'imp', name: 'Diabrete da Fornalha Velha', scale: 1.5, hp: 5, dmg: 1.1, mech: { aoe: { every: 11, r: 4.5, k: 1, name: 'Fagulhas', col: 0xffa040 } }, hello: 'As galerias velhas dos anões. Algo mexeu nas fornalhas apagadas.', bye: 'A fornalha velha apaga de vez.' } },
  { id: 'raizes', name: 'Raízes de Lithendel', kind: 'subsolo', lvl: [4, 8], theme: 'mata', near: 'Lithendel', dx: 12, dy: -10, main: 2, side: 1, mobs: ['rat', 'fairy'], players: 'sozinho',
    elite: { type: 'fairy', name: 'Fada das Raízes', scale: 1.5 }, boss: { type: 'treant', name: 'Raiz Doente', scale: 1.1, hp: 4, dmg: 1.0, mech: { pools: { every: 11, n: 2, k: 0.3, name: 'Seiva Podre', col: 0x9aff6a } }, hello: 'Sob as árvores mais velhas, uma raiz apodrece e se mexe.', bye: 'A Raiz Doente seca. Lá em cima, uma árvore suspira.' } },
];

export interface DgCtx {
  scene: THREE.Scene; T: number; city: { map: string[][]; props: { gx: number; gy: number; w: number; h: number }[]; pois: { name: string; x: number; y: number; biome: string }[]; settlements: { name: string; x: number; y: number; radius: number }[] };
  heightAt(x: number, z: number): number; regionLvl(x: number, y: number): [number, number];
  game: { st: { lvl: number; gold: number; hp: number; hpMax: number; dead: boolean }; damage(n: number, at: THREE.Vector3, from?: THREE.Vector3): void; logMsg(t: string, c?: string): void; gainXp(n: number): void;
    enemies: { list: { alive: boolean; hp: number; hpMax: number; pos: THREE.Vector3; def: { name: string; dmg: number; speed: number }; type: EnemyType; state: string }[]; spawn(type: EnemyType, x: number, z: number, o: Record<string, unknown>): unknown; clearTag(tag: string): void };
    spawnGear(x: number, z: number, y: number, ilvl: number, boost?: Record<string, number>, n?: number, rarityMin?: string, preset?: Gear[]): void; xpNeed(): number };
  particles: { spawn(x: number, y: number, z: number, o: Record<string, number>): void };
  audio: { boom(): void; chime(): void; coins(n: number): void; spell(k: 'shock' | 'fire' | 'ice' | 'arcane' | 'earth' | 'holy'): void };
  heroPos(): THREE.Vector3; partySize(): number; say(t: string): void; fine(o: THREE.Object3D): THREE.Object3D;
  onClear?(d: DgDef, first: boolean): void;
}
type E = DgCtx['game']['enemies']['list'][number] & { tag?: string; own?: number; ownT?: number };

export function createMasmorras(ctx: DgCtx) {
  const T = ctx.T;
  /* ---------- entradas no mundo ---------- */
  const busy = new Set<string>(); for (const p of ctx.city.props) for (let y = p.gy - 1; y <= p.gy + p.h; y++) for (let x = p.gx - 1; x <= p.gx + p.w; x++) busy.add(x + ',' + y);
  const target = (nm: string) => ctx.city.pois.find((p) => p.name === nm) ?? ctx.city.settlements.find((s) => s.name === nm) ?? null;
  const spotOk = (x: number, y: number, loose = false) => { for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const t = ctx.city.map[y + dy]?.[x + dx], core = Math.abs(dx) <= 1 && Math.abs(dy) <= 1; if (core ? t !== 'grass' && t !== 'road' && t !== 'plaza' : !t || t === 'water' || t === 'wall') return false; if ((!loose || core) && busy.has(x + dx + ',' + (y + dy))) return false; }
    return !ctx.city.settlements.some((s) => Math.hypot(s.x - x, s.y - y) < s.radius + 2); };
  const entrances: { d: DgDef; x: number; y: number; lvl: [number, number]; root: THREE.Group }[] = [];
  for (const d of DUNGEONS) {
    const t0 = target(d.near); if (!t0) continue; const bx = Math.round(t0.x + (d.dx ?? 0)), by = Math.round(t0.y + (d.dy ?? 6)); let at: { x: number; y: number } | null = null;
    for (let r = 0; r < 48 && !at; r++) for (let a = 0; a < 24 && !at; a++) { const x = Math.round(bx + Math.cos((a / 24) * 6.283) * r), y = Math.round(by + Math.sin((a / 24) * 6.283) * r); if (spotOk(x, y)) at = { x, y }; }
    for (let r = 1; r < 44 && !at; r++) for (let a = 0; a < r * 8 && !at; a++) { const x = Math.round(bx + Math.cos((a / (r * 8)) * 6.283) * r), y = Math.round(by + Math.sin((a / (r * 8)) * 6.283) * r); if (spotOk(x, y, true)) at = { x, y }; } // 2ª passada: aceita árvores e cercas em volta
    if (!at) continue; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) busy.add(at.x + dx + ',' + (at.y + dy));
    const lvl: [number, number] = d.lvl ?? (() => { const [lo, hi] = ctx.regionLvl(at!.x, at!.y); const m = Math.round((lo + hi) / 2); return [Math.max(1, m - 2), m + 2]; })();
    const root = mouth(d, at.x * T, at.y * T); entrances.push({ d, x: at.x, y: at.y, lvl, root });
    ctx.city.pois.push({ name: d.name, x: at.x, y: at.y + 1, biome: 'rock' });
  }
  /** a boca da masmorra: rochas em arco e um buraco escuro (caverna), um alçapão de pedra (subsolo) ou vigas de mina */
  function mouth(d: DgDef, x: number, z: number) {
    const g = new THREE.Group(), y = ctx.heightAt(x, z); g.position.set(x, y, z); ctx.scene.add(g);
    const rock = new THREE.MeshToonMaterial({ color: d.theme === 'gelo' ? 0x8aa8c0 : d.theme === 'magma' ? 0x3a2e2e : 0x5a5650 });
    const dark = new THREE.MeshBasicMaterial({ color: 0x050307 });
    const add = (geo: THREE.BufferGeometry, m: THREE.Material, px: number, py: number, pz: number) => { const k = new THREE.Mesh(geo, m); k.position.set(px, py, pz); k.castShadow = true; g.add(k); return k; };
    if (d.theme === 'cripta') { // mausoléu maldito: pedra escura, frontão, porta com grade de ferro entreaberta, velas e uma luz vermelha lá dentro
      const st = new THREE.MeshToonMaterial({ color: 0x9a96a2, emissive: 0x0c0a10 }), stD = new THREE.MeshToonMaterial({ color: 0x6e6a78, emissive: 0x08060c }), iron = new THREE.MeshToonMaterial({ color: 0x2a2a30 });
      const big = d.kind === 'grupo' ? 1.35 : 1;
      add(new THREE.BoxGeometry(5.2 * big, 0.4, 4.4 * big), stD, 0, 0.2, -0.6); // plinto
      add(new THREE.BoxGeometry(4.2 * big, 3.2 * big, 3.4 * big), st, 0, 0.4 + 1.6 * big, -0.9);
      const roofS = new THREE.Shape(); roofS.moveTo(-2.5 * big, 0); roofS.lineTo(0, 1.5 * big); roofS.lineTo(2.5 * big, 0); roofS.closePath();
      const rg = new THREE.ExtrudeGeometry(roofS, { depth: 3.8 * big, bevelEnabled: false }); rg.translate(0, 0, -1.9 * big); const rf = add(rg, stD, 0, 0.4 + 3.2 * big, -0.9);
      void rf; add(new THREE.BoxGeometry(5.0 * big, 0.25, 0.4), stD, 0, 0.4 + 3.2 * big, 0.85 * big); // cornija
      for (const sx of [-1, 1]) { add(new THREE.CylinderGeometry(0.22, 0.26, 3.0 * big, 8), st, sx * 1.6 * big, 0.4 + 1.5 * big, 0.95 * big); add(new THREE.BoxGeometry(0.6, 0.25, 0.6), stD, sx * 1.6 * big, 0.4 + 3.05 * big, 0.95 * big); }
      add(new THREE.BoxGeometry(1.6 * big, 2.3 * big, 0.1), dark, 0, 0.4 + 1.15 * big, 0.82 * big); // a porta: escuro
      for (let i = 0; i < 6; i++) { const bar = add(new THREE.CylinderGeometry(0.03, 0.03, 2.2 * big, 5), iron, -0.65 * big + i * 0.26 * big, 0.4 + 1.1 * big, 0.95 * big + (i < 3 ? 0.25 : 0)); bar.rotation.y = 0; } // grade, metade aberta
      const skull = add(new THREE.SphereGeometry(0.22, 8, 6), new THREE.MeshToonMaterial({ color: 0xd8d0b8 }), 0, 0.4 + 2.75 * big, 0.88 * big); skull.scale.set(1, 0.9, 0.7);
      const red = new THREE.PointLight(0xff3a2a, 6, 7, 1.6); red.position.set(0, 1.2, 0.3); g.add(red);
      for (let k = 0; k < 6; k++) { const cx = (k - 2.5) * 0.45, cz = 1.7 + (k % 2) * 0.25; add(new THREE.CylinderGeometry(0.05, 0.05, 0.25 + (k % 3) * 0.12, 6), new THREE.MeshToonMaterial({ color: 0xe8e0c8 }), cx, 0.55, cz); add(new THREE.ConeGeometry(0.04, 0.1, 5), new THREE.MeshBasicMaterial({ color: 0xffc060 }), cx, 0.78 + (k % 3) * 0.06, cz); }
      for (const sx of [-1, 1]) { const ob = add(new THREE.ConeGeometry(0.35, 2.4, 4), stD, sx * 3.6 * big, 1.2, 0.6); ob.rotation.z = sx * 0.12; } // obeliscos tortos
    } else if (d.kind === 'subsolo') {
      add(new THREE.BoxGeometry(3.2, 0.3, 3.2), rock, 0, 0.15, 0); add(new THREE.BoxGeometry(2.2, 0.32, 2.2), dark, 0, 0.17, 0);
      for (let i = 0; i < 4; i++) add(new THREE.BoxGeometry(2.0, 0.18, 0.45), rock, 0, 0.05 - i * 0.18, -0.6 + i * 0.4).visible = i === 0;
      const slab = add(new THREE.BoxGeometry(2.3, 0.2, 1.4), rock, 1.6, 0.5, -0.4); slab.rotation.z = 0.5;
      for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.4, 1.2, 0.3), rock, s * 1.9, 0.6, 1.4);
    } else {
      for (let i = 0; i < 7; i++) { const a = Math.PI * (i / 6), r = 2.2; const s = 0.9 + (i % 3) * 0.25; const k = add(new THREE.DodecahedronGeometry(s, 0), rock, Math.cos(a) * r, 0.4 + Math.sin(a) * r * 0.9, -0.3); k.rotation.set(i, i * 2, i); }
      add(new THREE.CircleGeometry(1.9, 18, 0, Math.PI), dark, 0, 0.05, -0.05).scale.y = 1.25;
      const back = add(new THREE.DodecahedronGeometry(2.6, 0), rock, 0, 1.2, -1.6); back.scale.set(1.3, 0.9, 0.8);
      if (d.theme === 'mina') { const wm = new THREE.MeshToonMaterial({ color: 0x5a3a22 }); for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.25, 2.6, 0.25), wm, s * 1.5, 1.3, 0.2); add(new THREE.BoxGeometry(3.4, 0.3, 0.3), wm, 0, 2.6, 0.2); }
    }
    for (const s of [-1, 1]) { const tx = s * 2.6, tz = 1.0; add(new THREE.CylinderGeometry(0.06, 0.08, 1.7, 6), new THREE.MeshToonMaterial({ color: 0x3a2414 }), tx, 0.85, tz);
      add(new THREE.ConeGeometry(0.16, 0.42, 6), new THREE.MeshBasicMaterial({ color: d.kind === 'grupo' ? 0xff4a3a : 0xffb040 }), tx, 1.85, tz); }
    // placa: nome e níveis
    const c = document.createElement('canvas'); c.width = 256; c.height = 64; const q = c.getContext('2d')!; q.fillStyle = 'rgba(14,10,6,.85)'; q.fillRect(0, 0, 256, 64); q.strokeStyle = d.kind === 'grupo' ? '#ff6a5a' : '#c9a24a'; q.lineWidth = 3; q.strokeRect(2, 2, 252, 60);
    q.fillStyle = '#ffe08a'; q.font = 'bold 18px Georgia'; q.textAlign = 'center'; q.fillText(d.name.length > 26 ? d.name.slice(0, 25) + '…' : d.name, 128, 27); q.fillStyle = d.kind === 'grupo' ? '#ff9a8a' : '#b9c6e0'; q.font = '14px Georgia';
    q.fillText(`${d.kind === 'grupo' ? '⚔ Masmorra' : d.kind === 'subsolo' ? 'Subsolo' : 'Caverna'} · ${d.players}`, 128, 50);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false })); sp.renderOrder = 20; /* a placa nunca some atrás do telhado */ sp.scale.set(4, 1, 1); if (d.theme === 'cripta') sp.position.set(0, 2.9, 2.8); else sp.position.set(0, 4.2, 0.6); /* na cripta, a placa fica à frente da porta, na altura dos olhos */ g.add(sp);
    ctx.fine(sp); return g;
  }

  /* ---------- a corrida (uma masmorra por vez) ---------- */
  const HUD = document.createElement('div'); HUD.id = 'dghud'; document.body.appendChild(HUD);
  type Pool = { x: number; z: number; r: number; t: number; m: THREE.Mesh; dmg: number };
  let run: null | { d: DgDef; int: DungeonFloor; O: { x: number; z: number }; pre: string; lvl: [number, number]; kills: number; need: number; total: number; boss: E | null; bossHp: number;
    phase: number; aoeT: number; heavyT: number; poolT: number; enraged: boolean; pools: Pool[]; opened: Set<number>; done: boolean; dead: Set<string> } = null;
  const rr = (s: number) => () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const hashS = (s: string) => { let h = 7; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) % 2147483647; return h || 1; };
  function build(d: DgDef) { return buildDungeon({ seed: hashS(d.id), theme: d.theme, main: d.main, side: d.side, boss: d.kind === 'grupo' ? 11 : 8 }); }
  /** começa: monta os bandos com chaves de rede determinísticas (o grupo vê os mesmos bichos) */
  function start(e: (typeof entrances)[number], int: DungeonFloor, O: { x: number; z: number }, inst: string) {
    const d = e.d, r = rr(hashS(d.id + 'mobs')), n = Math.max(1, ctx.partySize()), pre = `dg:${d.id}:${inst}`;
    ctx.game.enemies.clearTag('dg');
    const [lo, hi] = e.lvl; let total = 0, boss: E | null = null;
    const S = (type: EnemyType, x: number, z: number, L: number, o: Record<string, unknown> = {}) => { const k = lvlScale(type, L); return ctx.game.enemies.spawn(type, O.x + x, O.z + z, { tag: 'dg', lvl: L, hpMul: k.hp * (o.hpX as number ?? 1), dmgMul: k.dmg * (o.dmgX as number ?? 1), aggro: 13, leash: 999, net: pre, ...o }) as E; };
    const main = int.rooms.filter((q) => q.kind === 'pack' || q.kind === 'elite');
    int.rooms.forEach((rm) => {
      const step = Math.max(0, main.indexOf(rm)), L = Math.round(lo + (hi - lo) * Math.min(1, step / Math.max(1, main.length - 1)));
      const at = () => ({ x: rm.x + (r() - 0.5) * (rm.w - 4), z: rm.z + (r() - 0.5) * (rm.d - 4) });
      if (rm.kind === 'pack') { const k = 3 + (r() < 0.5 ? 1 : 0) + (n >= 4 ? 1 : 0); for (let i = 0; i < k; i++) { const p = at(); S(d.mobs[Math.floor(r() * d.mobs.length)], p.x, p.z, L, { hpX: 0.8 + 0.2 * Math.min(n, 5) }); total++; } }
      else if (rm.kind === 'elite') { S(d.elite.type, rm.x, rm.z, hi, { name: d.elite.name, scale: d.elite.scale, hpX: 3.2 * (0.6 + 0.2 * Math.min(n, 5)), dmgX: 1.35 }); total++; for (let i = 0; i < 2; i++) { const p = at(); S(d.mobs[Math.floor(r() * d.mobs.length)], p.x, p.z, L); total++; } }
      else if (rm.kind === 'side') { for (let i = 0; i < 2; i++) { const p = at(); S(d.mobs[Math.floor(r() * d.mobs.length)], p.x, p.z, L); total++; } }
      else if (rm.kind === 'boss') { const b = d.boss, sizeK = d.kind === 'grupo' ? 0.45 + 0.3 * (Math.min(n, 5) - 1) : 0.7 + 0.3 * (Math.min(n, 3) - 1); boss = S(b.type, rm.x, rm.z - 2, hi + 1, { name: b.name, scale: b.scale, hpX: b.hp * sizeK, dmgX: b.dmg * (n >= 3 || d.kind !== 'grupo' ? 1 : 0.85), aggro: 11 }); }
    });
    const need = Math.ceil(total * (d.kind === 'grupo' ? 0.7 : 0.6));
    run = { d, int, O, pre, lvl: e.lvl, kills: 0, need, total, boss, bossHp: 1, phase: 0, aoeT: 6, heavyT: 9, poolT: 8, enraged: false, pools: [], opened: new Set(), done: false, dead: new Set() };
    ctx.game.logMsg(`⚔ ${d.name} (nível ${e.lvl[0]}–${e.lvl[1]}, ${d.players}). Derrube ${need} criaturas para abrir o portão do chefe.`, '#ff9a8a');
    hud();
  }
  function stop() { if (!run) return; for (const p of run.pools) ctx.scene.remove(p.m); ctx.game.enemies.clearTag('dg'); ctx.game.enemies.clearTag('dg-add'); run = null; HUD.style.display = 'none'; }
  function hud() {
    if (!run) { HUD.style.display = 'none'; return; } const R = run, b = R.boss, open = !!R.int.gate?.opened;
    HUD.style.display = 'block';
    HUD.innerHTML = `<b>${R.d.name}</b><small>nível ${R.lvl[0]}–${R.lvl[1]} · ${R.d.players}</small>` +
      (R.done ? `<div class="dg-done">✦ Vencida. O baú do chefe é seu.</div>` : open ? (b ? `<div class="dg-boss"><span>${b.def.name}</span><i style="width:${Math.max(0, (b.hp / b.hpMax) * 100).toFixed(1)}%"></i></div>` : '') :
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
    ctx.game.spawnGear(b.pos.x, b.pos.z, y, ilvl, { rare: 6, legendary: 4, epic: 2 }, d.kind === 'grupo' ? 3 : 2, 'rare');
    const uq = d.uniq?.length && (first || Math.random() < (d.kind === 'grupo' ? 0.3 : 0)) ? d.uniq[Math.floor(Math.random() * d.uniq.length)] : null;
    if (uq) { const g = genGear(ilvl, 'epic', uq.slot); g.name = uq.name; g.icon = uq.icon; g.rarity = 'unique'; (g as Gear & { lore?: string }).lore = uq.lore; for (const k of Object.keys(g.stats) as (keyof Gear['stats'])[]) g.stats[k] = Math.round((g.stats[k] ?? 0) * 1.25 * 10) / 10; ctx.game.spawnGear(b.pos.x + 1, b.pos.z, y, ilvl, {}, 1, 'unique', [g]); ctx.game.logMsg(`✦ Peça única: ${uq.name}!`, '#f2cf6a'); }
    const bonus = Math.round(ctx.game.xpNeed() * (d.kind === 'grupo' ? (first ? 0.6 : 0.25) : (first ? 0.3 : 0.1))); if (bonus > 0) ctx.game.gainXp(bonus);
    ctx.game.st.gold += (d.kind === 'grupo' ? 40 : 15) * Math.max(1, Math.round(R.lvl[1] / 5)); ctx.audio.coins(3);
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
  function update(dt: number) {
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
