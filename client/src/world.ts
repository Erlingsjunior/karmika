import { pickSpecies, type Species } from './flora3d';
import { pickPlant, WATER_PLANTS, type Plant } from './plantas3d';
import { CAMPAIGN_NPCS } from './campanha';
import { DUNGEONS } from './masmorras';
import { LIB_FOOT, PREF_MAYOR } from './predios-dados';
import type { Tile } from '@karmika/shared';
/** os nomes dos lugares de ofício: na cidade são casas de verdade; na vila, coisa simples (Erling, 25/10) */
export const STATION_NAMES = {
  city: ['Marcenaria', 'Forja', 'Curtume e Alfaiataria', 'Apotecário', 'Escola de Cozinha', 'Casa de Tecnologia'],
  village: ['Barracão de Corte', 'Forja ao Ar Livre', 'Mesa do Curtidor', 'Apotecário', 'Cozinha dos Fundos', 'Oficina de Latão'],
} as const;

/** deslocamento das Terras dos Homens dentro do mundo grande (tiles) */
export const SH = 210;
/** Porto Caldeira, a Cidade da Graxa (27/10): a bacia do porto, escavada da praça até o mar, com cais de pedra a prumo */
/** Porto Caldeira: centro, raio, as duas bacias (relativas ao centro: x0..x1 e a cabeceira y0; a água vai até o mar) e a ilha do Farol */
const PORTO_L = { x: 432, y: 800, r: 30, basins: [{ x0: 8, x1: 22, y0: 12 }, { x0: -22, x1: -15, y0: 18 }], farol: { x: 474, y: 834, r: 3.4 } };

/** pedras da prancha 58 (01/11): musgosa, laje, menir, seixos, bola de musgo com samambaias, pico cinza, obsidiana azul, arenito laranja, veio de cobre, gelo, lisa escura e vulcânica rachada */
export type RockStyle = 'mossy' | 'slab' | 'menhir' | 'pebbles' | 'mossball' | 'peak' | 'obsidian' | 'sandstone' | 'copper' | 'ice' | 'darkSmooth' | 'volcanic';
export type PropKind = 'house' | 'gboard' | 'gchest' | 'temple' | 'fountain' | 'tree' | 'torch' | 'rock' | 'grave' | 'ruin' | 'tent' | 'campfire' | 'bridge' | 'chest' | 'bones' | 'bench' | 'stall' | 'church' | 'relic' | 'bfloor' | 'bwall' | 'bfence' | 'broof' | 'bdoor' | 'cwall' | 'tower' | 'ifence' | 'coffin' | 'angel' | 'obelisk' | 'saint' | 'mausoleum' | 'gfence' | 'gpillar' | 'ggate' | 'deadtree' | 'corpse' | 'deadcrop' | 'deadwell' | 'altar' | 'fogpatch' | 'tar' | 'herb' | 'noticeboard' | 'mailbox' | 'vault' | 'shopfront' | 'station' | 'castle' | 'rwall' | 'rtower' | 'gatehouse' | 'wstair' | 'landmark' | 'palisade' | 'totem' | 'quay' | 'monument' | 'vgate' | 'lowwall' | 'library' | 'dock' | 'boat' | 'chimney' | 'crane' | 'portico' | 'rack' | 'plant' | 'vprop';
export interface Relic { name: string; x: number; y: number }
export type Biome = 'meadow' | 'forest' | 'swamp' | 'snow' | 'ruins' | 'rock' | 'volcanic' | 'enchanted' | 'blight' | 'jungle' | 'coast';
export type EnemyType = 'puglin' | 'imp' | 'wolf' | 'frostwolf' | 'boar' | 'deer' | 'coyote' | 'rat' | 'fairy' | 'treant' | 'prince' | 'tormentor' | 'zombie' | 'ghoul' | 'bishop' | 'skeleton' | 'bat' | 'werewolf'
  /* gente (eventos vivos, 24/10): soldados, bruxos, paladinos negros, templários, caçadores, crias do Conde, peregrinos elfos */
  | 'soldier' | 'cultist' | 'darkpal' | 'templar' | 'hunter' | 'vampire' | 'pilgrim'
  /* 26/10: salteadores dos acampamentos de bandidos à beira das estradas */
  | 'bandit' | 'bandit_arch' | 'bandit_chief'
  /* 26/10: a nova safra (bestas3d + chefes): mortos, demônios, mata e pântano, norte, tecnologia, gente, água e areia */
  | 'skull_fire' | 'skull_frost' | 'skel_arch' | 'headless' | 'necro' | 'lich'
  | 'imp_bomb' | 'succubus' | 'hellhound' | 'glutton' | 'pactbroken' | 'suplicio'
  | 'spider' | 'spiderling' | 'broodmother' | 'bear' | 'cavebear' | 'swampsnake' | 'giantsnake' | 'mudzombie' | 'fungus' | 'fairyqueen' | 'ent'
  | 'draugr_arch' | 'draugr_bers' | 'troll' | 'harpy' | 'jotun' | 'alpha'
  | 'automaton' | 'turret' | 'tinker' | 'colossus'
  | 'elfscout' | 'inquisitor' | 'slaver' | 'thrall'
  | 'drowner' | 'drowner_old' | 'scorpion' | 'scorpion_king'
  /* 02/11 (Erling): os lugares novos do mapa vazio — sereias canibais nos lagos, goblins nas matas, espíritos nas grutas e o Gênio do oásis */
  | 'siren' | 'siren_queen' | 'goblin' | 'goblin_shaman' | 'goblin_chief' | 'spirit' | 'spirit_lord' | 'djinn';
const T = 2; // metros por tile (igual a TILE_M)

export interface Prop {
  kind: PropKind;
  gx: number; gy: number; // canto de cima (grade)
  w: number; h: number;   // tamanho em tiles
  height: number;         // altura em metros (ver shared/src/scale.ts)
  /** árvore: espécie das pranchas do Herik (flora3d.ts), escolhida pelo bioma; sem ela, a árvore antiga */ sp?: Species;
  /** planta decorativa (plantas3d.ts), pelo bioma */ plant?: Plant;
  /** rocha: estilo da prancha 58 pelo bioma (world3d) */ rs?: RockStyle;
  wall: number; roof: number;
  /** texto escrito na peça (o nome da vila no pórtico) */ label?: string;
  /** muro baixo do adro de um edifício monumental (urbanismo 27/10) */ adro?: boolean;
  /** ângulo (rad, no mundo) do lado em que a água está — a roda do moinho da marcenaria fica virada para lá */ wdir?: number;
  /** peças que seguem um traçado (muros, cercas, pórticos): centro exato dentro da casa (m, a partir do canto), comprimento (m) e quanto desmoronou (0–1) */ ox?: number; oz?: number; len?: number; broken?: number;
  variant?: number;       // tipo da árvore (0 carvalho, 1 seca, 2 pinheiro) / modelo da pedra / etc.
  /** loja (casa com balcão): chave do comércio — escolhe o interior próprio (alquimista, mercador, domador, oficina, estábulo) */
  shop?: string;
  /** giro (radianos) para peças que olham para algum lugar (pontos de trabalho olham para o centro da vila) */
  ry?: number;
  /** estilo de construção da cultura (casas das vilas): 1 nórdico · 2 anão · 3 élfico · 4 sombrio · 5 tribal · 6 pacto · 7 vapor */
  style?: number;
  /** quartos de volta (casas, templos, marcos): 0 frente para +z (sul) · 1 para +x (leste) · 2 para −z (norte) · 3 para −x (oeste).
   *  w/h já são a pegada no mundo; o modelo é feito no próprio eixo (largura = w se rot par, h se ímpar) e girado */
  rot?: number;
}
/** ponto local do modelo (m, origem no canto do modelo sem giro) → ponto no mundo (m) */
export function rotLocal(p: { gx: number; gy: number; w: number; h: number; rot?: number }, lx: number, lz: number): { x: number; z: number; ry: number } {
  const k = (p.rot ?? 0) & 3, Wm = p.w * T, Dm = p.h * T, Wl = k % 2 ? Dm : Wm, Dl = k % 2 ? Wm : Dm, a = k * Math.PI / 2, c = Math.cos(a), sn = Math.sin(a);
  const x = lx - Wl / 2, z = lz - Dl / 2; return { x: p.gx * T + Wm / 2 + x * c + z * sn, z: p.gy * T + Dm / 2 - x * sn + z * c, ry: a };
}
/** tamanho do modelo no próprio eixo (m) */
export const localDims = (p: { w: number; h: number; rot?: number }) => ((p.rot ?? 0) & 1 ? { W: p.h * T, D: p.w * T } : { W: p.w * T, D: p.h * T });
export interface Poi { name: string; x: number; y: number; biome: Biome }
export interface SpawnDef { type: EnemyType; x: number; y: number; r: number; n: number; /** só existe à noite */ night?: boolean; /** nível dos bichos deste ponto (pela região) */ lvl?: number; /** nível fixo (ignora a região) */ fixLvl?: number; /** dono de lugar marcado: não é retirado por estar perto de vila */ keep?: boolean }
/* REGIÕES: cada uma tem a sua faixa de 10 níveis. Dentro dela convivem bichos fracos e fortes (do começo ao fim da faixa);
   as missões levam o jogador de uma faixa para a próxima. As fronteiras são um diagrama de Voronoi torto (ruído), nunca um círculo. */
export interface Region { id: number; name: string; x: number; y: number; lo: number; hi: number; col: string }
const REGIONS_L: Region[] = [
  /* Os níveis crescem a partir dos TRÊS NÚCLEOS onde se nasce — humanos em Karmika, anões em Brasaforja (sopé da Montanha Negra),
     elfos em Lithendel — e não do centro do mapa. Perto de cada berço e das cidades, bichos fracos; quanto mais longe, mais fortes.
     As três rotas de missão levam cada raça até Askavik, onde as academias recebem todos para escolher a classe. */
  // berço humano
  { id: 1, name: 'Vale de Karmika', x: 212 + SH, y: 210 + SH, lo: 1, hi: 7, col: '#8fd08a' },
  { id: 2, name: 'Bosques de Lundr', x: 296 + SH, y: 214 + SH, lo: 7, hi: 13, col: '#c8d870' },
  { id: 3, name: 'Terra Maldita', x: 262 + SH, y: 318 + SH, lo: 7, hi: 13, col: '#d8a070' },
  { id: 4, name: 'Charcos do Oeste', x: 92 + SH, y: 236 + SH, lo: 7, hi: 13, col: '#a0b878' },
  { id: 5, name: 'Planalto de Askavik', x: 322 + SH, y: 112 + SH, lo: 7, hi: 13, col: '#e0c070' },
  { id: 6, name: 'Cordilheira do Norte', x: 168 + SH, y: 62 + SH, lo: 13, hi: 20, col: '#b8c8e0' },
  { id: 7, name: 'Mata do Leste', x: 386 + SH, y: 244 + SH, lo: 13, hi: 20, col: '#70c8a0' },
  { id: 8, name: 'Colinas do Sul', x: 190 + SH, y: 384 + SH, lo: 13, hi: 20, col: '#e08a70' },
  // berço anão (Montanha Negra): o sopé é fácil; o coração do vulcão, não
  { id: 17, name: 'Sopé de Brasaforja', x: 556, y: 196, lo: 1, hi: 7, col: '#e0a070' },
  { id: 18, name: 'Minas de Cinzalto', x: 700, y: 186, lo: 7, hi: 13, col: '#c08a60' },
  { id: 19, name: 'Passo de Midvangr', x: 432, y: 176, lo: 7, hi: 13, col: '#c8c0a0' },
  { id: 13, name: 'Coração da Montanha Negra', x: 645, y: 100, lo: 31, hi: 42, col: '#ff8a4a' },
  // berço élfico
  { id: 20, name: 'Bosque de Lithendel', x: 84, y: 406, lo: 1, hi: 7, col: '#9ae0a0' },
  { id: 10, name: 'Florestas Élficas', x: 110, y: 300, lo: 7, hi: 13, col: '#7ad09a' },
  { id: 21, name: 'Raízes Antigas', x: 60, y: 480, lo: 13, hi: 20, col: '#6ab08a' },
  // o mundo selvagem, longe dos berços
  { id: 9, name: 'Montanha Viking', x: 190, y: 140, lo: 20, hi: 31, col: '#d8e4f0' },
  { id: 11, name: 'Costa do Vapor e da Graxa', x: 432, y: 760, lo: 13, hi: 20, col: '#e0b878' },
  { id: 22, name: 'Recifes da Graxa', x: 590, y: 770, lo: 20, hi: 31, col: '#d0a060' },
  { id: 12, name: 'Floresta Encantada', x: 152, y: 575, lo: 31, hi: 42, col: '#b89aff' },
  { id: 14, name: 'Colina Vampírica', x: 760, y: 280, lo: 42, hi: 53, col: '#e05a6a' },
  { id: 15, name: 'Vale da Desgraça', x: 752, y: 450, lo: 42, hi: 53, col: '#b07ad0' },
  { id: 16, name: 'Selva Licantropa', x: 716, y: 682, lo: 42, hi: 53, col: '#5ab05a' },
  /* 07/11 (Erling: "faltam monstros de nível 120 a 150 para quem está no topo"): AS BORDAS DO MUNDO. Longe dos três berços, nas pontas do
     mapa, a faixa sobe do 60 ao 150. O nível base para no 120: do 120 ao 150 é para grupo e para quem tem a Classe II */
  { id: 23, name: 'Picos de Jotunheim', x: 346, y: 52, lo: 53, hi: 76, col: '#c8e0ff' }, /* 07/11: saiu do vulcão; agora é a serra de gelo nórdica ao norte, entre Hrimgard e Midvangr */
  { id: 24, name: 'Pântano do Fim', x: 35, y: 690, lo: 53, hi: 76, col: '#6a8a5a' },
  { id: 25, name: 'Desfiladeiro dos Lamentos', x: 828, y: 330, lo: 76, hi: 98, col: '#9a8ab8' },
  { id: 26, name: 'Costa dos Naufrágios', x: 210, y: 822, lo: 76, hi: 98, col: '#7aa8b8' },
  { id: 27, name: 'Ermos de Sheitã', x: 828, y: 560, lo: 98, hi: 125, col: '#c05a3a' },
];
/** região do tile (Voronoi com ruído: bordas que serpenteiam) */
function regionAt_L(x: number, y: number): Region {
  let best = REGIONS_L[0], bd = 1e9; const wx = Math.sin(y * 0.045) * 9 + Math.sin(x * 0.09 + y * 0.03) * 5, wy = Math.cos(x * 0.05) * 9 + Math.sin(y * 0.08 - x * 0.02) * 5;
  for (const r of REGIONS_L) { const d = Math.hypot(x + wx - r.x, (y + wy - r.y) * 1.05) * (r.id === 1 ? 0.92 : 1); if (d < bd) { bd = d; best = r; } }
  return best;
}
/** força relativa de cada bicho dentro da faixa da região (0 = fim fraco, 1 = fim forte) */
const RANK: Partial<Record<EnemyType, number>> = { deer: 0, rat: 0.05, coyote: 0.15, fairy: 0.25, puglin: 0.3, boar: 0.4, wolf: 0.45, imp: 0.5, zombie: 0.55, bat: 0.5, frostwolf: 0.65, ghoul: 0.7, skeleton: 0.8, werewolf: 0.95, treant: 1, prince: 1, tormentor: 1,
  /* a safra nova: dentro da faixa da região, do mais fraco ao mais forte; elites sempre no topo */
  spiderling: 0.05, drowner: 0.35, swampsnake: 0.4, mudzombie: 0.45, spider: 0.5, skel_arch: 0.55, bear: 0.6, scorpion: 0.55, harpy: 0.6, fungus: 0.6, skull_fire: 0.6, skull_frost: 0.65, automaton: 0.6, turret: 0.55, tinker: 0.7,
  hellhound: 0.65, imp_bomb: 0.6, draugr_arch: 0.6, draugr_bers: 0.75, elfscout: 0.7, slaver: 0.5, thrall: 0.6, inquisitor: 0.8, troll: 0.85, succubus: 0.8, pactbroken: 0.85,
  siren: 0.6, goblin: 0.25, goblin_shaman: 0.45, spirit: 0.55, siren_queen: 1, goblin_chief: 1, spirit_lord: 1, djinn: 1,
  alpha: 1, necro: 1, headless: 1, cavebear: 1, giantsnake: 1, drowner_old: 1, scorpion_king: 1, glutton: 1, suplicio: 1, jotun: 1, colossus: 1, ent: 1, fairyqueen: 1, broodmother: 1, lich: 1 };
export interface Bridge { ax: number; ay: number; bx: number; by: number; hA: number; hB: number; /** ponte de pedra em arco (Askavik) */ stone?: boolean; /** meia largura (m) */ half?: number; /** corcova do arco (m) */ hump?: number; /** 03/11: encaixe de pedra (bifurcação) — a borda em casas [x,y,...], as bocas e a altura de cada boca; (ax,ay) = junção, hA = altura nela */ poly?: number[]; ends?: number[] } // tiles
export interface World {
  map: Tile[][]; biome: Biome[][]; props: Prop[]; spawn: { x: number; y: number };
  /** o Quartel de Karmika (01/11): pátio de treino murado depois da igreja, com os bonecos de palha (posições em tiles, centro do boneco) */ quartel: { x: number; y: number; dummies: { x: number; y: number }[] };
  /** 02/11: o lugar de cada entrada de calabouço (id → casa), decidido aqui para a pedra rúnica nascer ao lado e para as regras de distância valerem no mundo todo */ dgSpots: Record<string, { x: number; y: number }>;
  /** a Casa dos Ofícios de Askavik (25/10): o salão de todas as profissões (oficios.ts monta o prédio e os ajudantes) */ craftHall?: { x: number; y: number; w: number; h: number; ry: number };
  pois: Poi[]; spawns: SpawnDef[]; bridges: Bridge[]; signs: Sign[]; settlements: Settlement[]; relics: Relic[]; ramparts: Rampart[]; /** acampamentos de salteadores e as torres de vigia (26/10) */ bandits: { name: string; x: number; y: number; road: [string, string]; tower: { x: number; y: number; sgt: string } | null }[]; roadPaths: { x: number; y: number }[][]; roadLinks: { a: string; b: string; i: number }[];
  /** onde cada raça nasce: humanos em Karmika, anões em Brasaforja (sopé da Montanha Negra), elfos em Lithendel (Florestas Élficas) */
  starts: Record<'human' | 'dwarf' | 'elf', { x: number; y: number; name: string }>;
  /** 07/11: os cais dos navios da Companhia de Latão — no continente (vila/cidade) e nas ilhas (desembarque). x,y = onde o herói fica; sx,sy = o navio; ang = a proa */
  docks?: Dock[];
  /** 07/11: os faróis dos portos (um diferente em cada um) — x,y = a base da torre; style = o desenho; old = já existe o modelo (o Farol Tecnocrático) */
  lights?: { name: string; port: string; x: number; y: number; style: 'nordico' | 'gotico' | 'pacto' | 'vapor'; old?: boolean }[];
}
export interface Dock { id: string; name: string; x: number; y: number; sx: number; sy: number; ang: number; isle?: number }
export interface Sign { x: number; y: number; yaw: number; lines: { text: string; dir: number }[] }

/** MUNDO GRANDE (21/10/2026): 840×840 tiles. As Terras dos Homens (o mapa antigo de 420) ficam no centro, deslocadas de SH;
    as regiões de lore (Viking, Montanha Negra, Colina Vampírica, Vale da Desgraça, Élficas, Encantada, Selva Licantropa, Costa do Vapor) em volta. */
const CATHEDRAL_L = { x: 262 + SH, y: 322 + SH };
const MAP_W_L = 840;
const MAP_H_L = 840;
/** a região original de 140×140 (Karmika e arredores) fica no centro das Terras dos Homens */
const OFX_L = 140 + SH, OFY_L = 140 + SH;
const CITY_L = { x: 70 + OFX_L, y: 72 + OFY_L };
export type SettleKind = 'village' | 'city';
export interface NpcSpec { name: string; role: string; kind: 'nordic' | 'dwarf' | 'technocrat'; x: number; y: number; radius: number; tint: number; scale: number; lines: string[]; shop?: string; /** só aparece à noite (a Corte de Vladislav) */ night?: boolean; /** só aparece com esta missão no diário */ onlyQ?: string }
export interface Settlement { name: string; kind: SettleKind; x: number; y: number; radius: number; npcs: NpcSpec[]; /** 07/11: povo da vila (estilo das casas e do chão): 1 nórdico · 2 anão · 3 élfico · 4 sombrio · 5 tribal · 6 pacto · 7 vapor */ cult?: number }

/* ---------- ruído determinístico ---------- */
export const hash = (x: number, y: number, s = 0) => {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1274126177)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
}
export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const smoothstep = (e0: number, e1: number, x: number) => { const t = clamp01((x - e0) / (e1 - e0)); return t * t * (3 - 2 * t); };
export function vnoise(x: number, y: number, s = 0) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export const fbm = (x: number, y: number, s = 0) => vnoise(x, y, s) * 0.6 + vnoise(x * 2.1, y * 2.1, s + 7) * 0.28 + vnoise(x * 4.3, y * 4.3, s + 13) * 0.12;

/* ---------- rios e lagos (coordenadas em tiles; sd em metros) ---------- */
export const riverY = (x0: number) => { const x = x0 - OFX_L; return OFY_L + 84.5 + 4.2 * Math.sin(x * 0.085 + 0.7) + 2.1 * Math.sin(x * 0.19 + 2.1) + 0.8 * Math.sin(x * 0.43) + 22 * Math.sin(x * 0.021 + 1.3) * smoothstep(60, 110, Math.abs(x - 70)); };
const riverSlope = (x: number) => (riverY(x + 0.1) - riverY(x - 0.1)) / 0.2;
const riverBx = (y0: number) => { const y = y0 - OFY_L; return OFX_L + 40 + 3.5 * Math.sin(y * 0.1 + 1.0) + 1.6 * Math.sin(y * 0.27) - 18 * smoothstep(20, -60, y); };
/** rio do sul: atravessa a parte baixa do mapa grande */
const riverSy = (x0: number) => { const x = x0 - SH; return 352 + SH + 9 * Math.sin(x * 0.03 + 0.4) + 3.5 * Math.sin(x * 0.11 + 2.0); };
const riverSslope = (x: number) => (riverSy(x + 0.1) - riverSy(x - 0.1)) / 0.2;
const riverBSlope = (y: number) => (riverBx(y + 0.1) - riverBx(y - 0.1)) / 0.2;
const LAKES0 = [{ x: 18, y: 104, r: 9 }, { x: 112, y: 46, r: 8 }, { x: 84, y: 20, r: 6.5 }, { x: 102, y: 112, r: 6 }, { x: 28, y: 56, r: 5 }, { x: 42, y: 20, r: 6 }];
const LAKES = [...LAKES0.map((l) => ({ x: l.x + OFX_L, y: l.y + OFY_L, r: l.r })), ...[{ x: 60, y: 70, r: 11 }, { x: 330, y: 40, r: 9 }, { x: 338, y: 184, r: 6 }, { x: 384, y: 180, r: 12 }, { x: 70, y: 300, r: 10 }, { x: 300, y: 300, r: 8 }, { x: 150, y: 50, r: 7 }, { x: 40, y: 200, r: 8 }].map((l) => ({ x: l.x + SH, y: l.y + SH, r: l.r }))];

/** zonas secas (assentamentos): a água é empurrada para fora delas */
const DRY: { x: number; y: number; r: number }[] = [];
/** posições dos assentamentos (tiles) — também usadas para secar o terreno antes de gerar o mapa */
export const VILL: [string, number, number, string][] = ([
  ['Fjallbrún', 200, 48, 'Nossas ovelhas pastam na beira da neve.'], ['Vestheim', 62, 215, 'Entre o pântano e o rio. Cuidado com os javalis.'], ['Eikvik', 372, 232, 'A floresta nos dá madeira e nos tira filhos.'],
  ['Sudrholt', 214, 372, 'As Terras Antigas começam ali, depois das pedras.'], ['Myrbakki', 96, 334, 'Terra úmida, gente dura.'], ['Steinfoss', 336, 352, 'A Garganta ecoa à noite. Ninguém sabe o quê.'],
  ['Hvítadalr', 72, 96, 'Vale branco, inverno longo.'], ['Lundr', 300, 192, 'Do nosso bosque saem as melhores tábuas.'],
  // segunda leva de vilas (ligadas ao assentamento mais próximo)
  ['Nordvik', 40, 40, 'No fim do mundo o vento fala.'], ['Bjarnholt', 120, 28, 'Ursos já vieram até a cerca. Duas vezes.'], ['Kaldrfoss', 262, 30, 'A cachoeira congela em outubro e canta em abril.'], ['Ulfheim', 392, 42, 'Lobos ao norte, lobos ao sul. Criamos cães.'],
  ['Mýrarvik', 28, 132, 'Pântano dá turfa, e turfa dá fogo.'], ['Grenivik', 150, 118, 'Pinheiros altos, gente baixa, piada velha.'], ['Hrafnhöfn', 402, 150, 'Os corvos chegam antes das notícias.'], ['Vatnaholt', 30, 282, 'Peixe no almoço, peixe no jantar.'],
  ['Skógar', 128, 262, 'A mata aqui tem dono, e não somos nós.'], ['Austrvik', 392, 292, 'De Askavik vem o sal; daqui vai a madeira.'], ['Brekkuvik', 162, 388, 'Nas colinas do sul o inverno é curto.'], ['Sandvik', 300, 390, 'Areia nas botas, ruínas no horizonte.'],
] as [string, number, number, string][]).map(([n, x, y, l]) => [n, x + SH, y + SH, l] as [string, number, number, string]).concat([
  // mundo de fora (coordenadas absolutas): vilas de cada região de lore e as vilas humanas entre elas
  ['Jarlsheim', 152, 128, 'Aqui o Jarl manda, e Odin olha por cima do ombro dele.'], ['Skjoldvik', 96, 206, 'Os barcos-dragão dormem no fiorde até o degelo.'], ['Hrimgard', 292, 96, 'A neve aqui não derrete. Ela só muda de lugar.'],
  ['Midvangr', 420, 168, 'O passo entre as duas montanhas. Quem cruza, paga pedágio ao vento.'],
  ['Brasaforja', 560, 186, 'A montanha ronca à noite. Os anões dizem que é ela respirando.'], ['Cinzalto', 700, 176, 'Diamantes nas paredes, fuligem nos pulmões.'],
  ['Corvoscuro', 724, 262, 'Fechem as janelas ao anoitecer. E não convidem ninguém a entrar.'],
  ['Gorvath', 770, 470, 'No Vale, até o trigo nasce de cabeça baixa.'],
  ['Lithendel', 84, 404, 'As árvores aqui são mais velhas que os reis dos homens.'],
  ['Lumenhal', 226, 604, 'De noite, o Pináculo acende e as corujas param de cantar.'],
  ['Uivo Antigo', 690, 640, 'Na lua cheia, não saia. Na lua nova, não volte.'],
  ['Porto Caldeira', PORTO_L.x, PORTO_L.y, 'Vapor, graxa e barcos que remam sozinhos.'], ['Ferrugem', 566, 742, 'Tudo aqui enferruja, menos a vontade.'], ['Vaporeira', 302, 740, 'O apito da fábrica é o nosso galo.'],
  ['Dalborg', 640, 560, 'Última vila antes da selva. Compre tochas.'], ['Vindholt', 470, 640, 'Os ventos do mar chegam até aqui com cheiro de óleo.'],
] as [string, number, number, string][]);
const ASKAVIK_L = { x: 318 + SH, y: 112 + SH, r: 52 };
function harborSD(tx: number, ty: number): number { let best = 99; for (const b of PORTO_L.basins) { const cxb = PORTO_L.x + (b.x0 + b.x1 + 1) / 2, hw = (b.x1 - b.x0 + 1) / 2; const dx = Math.abs(tx - cxb) - hw, dy = PORTO_L.y + b.y0 - ty; if (dx > 8 || dy > 8) continue; best = Math.min(best, Math.max(dx, dy) * T); } return best; }
/** distância assinada até a água (m); negativo = dentro d'água */
/** bordas do mundo (0 longe → 1 na beira): norte = cordilheira, sul = oceano, oeste = pântano intransponível, leste = floresta fechada */
function edgeK_L(tx: number, ty: number) {
  const n = (fbm(tx * 0.05, ty * 0.05, 77) - 0.5) * 14;
  return { north: smoothstep(26, 5, ty + n), south: smoothstep(MAP_H_L - 22, MAP_H_L - 5, ty + n), west: smoothstep(24, 5, tx + n), east: smoothstep(MAP_W_L - 26, MAP_W_L - 5, tx + n) };
}
/* o canal de Askavik: nasce no lago ao norte da muralha, atravessa a cidade em curvas suaves entre cais de pedra
   e sai pelo sul até o lago de baixo. Margens retas (sem ruído): é obra de pedreiro, não de rio */
const canalX_L = (ty: number) => ASKAVIK_L.x + 14 + 4 * Math.sin((ty - ASKAVIK_L.y) * 0.055 + 0.6);
export const CANAL_HW = 2.0; // meia largura da água (casas)
/** meia-largura do rio de Askavik por linha: canal de pedra na cidade; ao norte afina até a nascente (dy −84), ao sul segue até o lago (dy 84) */
export const canalHW = (dy: number) => dy < -60 ? Math.max(0.3, CANAL_HW * (1 - (-60 - dy) / 24) + 0.3) : CANAL_HW;
function canalSD(tx: number, ty: number) { const dy = ty - ASKAVIK_L.y; if (dy < -84 || dy > 84) return 99; const sl = 4 * 0.055 * Math.cos(dy * 0.055 + 0.6); return (Math.abs(tx - canalX_L(ty)) / Math.sqrt(1 + sl * sl) - canalHW(dy)) * T; }
function waterSD_L(xm: number, zm: number): number {
  const tx = xm / T, ty = zm / T;
  { const dA = Math.max(Math.abs(tx - ASKAVIK_L.x), Math.abs(ty - ASKAVIK_L.y)) - (ASKAVIK_L.r + 7), cs = canalSD(tx, ty);
    if (dA < 0) return cs; // dentro da cidade: só o canal
    if (dA < 5) return Math.min(cs, waterSD0(xm, zm) * (dA / 5) + 8 * (1 - dA / 5));
    return Math.min(cs, waterSD0(xm, zm)); }
}
/* ---------- os monumentos dos caminhos (Erling, 23/10: "MONUMENTAIS — beleza, fascínio, um lugar tirado de um livro") ----------
   conde: o castelo do Conde Vladislav no topo de uma montanha negra, com a estrada em caracol subindo entre árvores mortas;
   marfim: o Pináculo de Marfim no meio de uma lagoa rasa cheia de ilhas, ao sul de Lumenhal, ligado à margem pela Ponte dos Mil Passos */
export const MONU = {
  conde: { x: 762, y: 250, R: 34, H: 44, top: 12.5 },
  odin: { x: 152, y: 97, R: 25, H: 15, top: 13.5 },      // promontório de pedra ao norte de Jarlsheim
  aurora: { x: 602, y: 471, R: 23, H: 8, top: 12.5 },    // colina da aurora ao norte de Austrvik
  prata: { x: 424, y: 551, moat: 17.2, moatW: 2.6 },     // o forte estrelado com fosso, ao norte de Sudrholt
  desgraca: { x: 770, y: 441, R: 23, H: 0, top: 13, rim: 7 },  // o vale: chão no nível do mundo, cercado por uma crista de rocha (afundar enchia de água)
  uivo: { x: 690, y: 609 },                              // a árvore-mãe da matilha, ao norte do Uivo Antigo
  marfim: { x: 232, y: 672, R: 44, isle: 11, islets: [[24, -6, 4.2], [-24, -4, 4.4], [16, 18, 3.6], [-16, 20, 3.8], [30, 12, 3.2], [-31, 14, 3.0], [8, 30, 3.4], [-9, -27, 2.8], [28, -22, 3.0], [-27, -22, 3.2]] as [number, number, number][] },
};
/** altura extra do terreno nos monumentos (m) */
/** a estrada em caracol do Conde: sai do pé (raio R+3, ângulo a0) e dá 2,2 voltas até o platô */
export const CONDE_ROAD = { a0: Math.PI * 1.05, turns: 2.725 }; /* 27/10: 2,725 voltas terminam no SUL (frente do castelo); com 2,2 o caracol acabava no norte, debaixo do castelo, e a porta ficava ilhada */
/** a estrada é um terraço cortado na encosta: a altura dela só sobe, sem a inclinação de lado */
function condeTerrace(tx: number, ty: number): { w: number; h: number } | null {
  const c = MONU.conde, dx = tx - c.x, dy = ty - c.y, d = Math.hypot(dx, dy); if (d > c.R + 6 || d < c.top - 2) return null;
  const phi = Math.atan2(dy, dx), r0 = c.R + 3, r1 = c.top - 1.2; let best: { w: number; h: number } | null = null;
  const base = (r: number) => r <= c.top ? 1 : r >= c.R ? 0 : Math.pow(0.5 + 0.5 * Math.cos(Math.PI * (r - c.top) / (c.R - c.top)), 1.15);
  let th = ((phi - CONDE_ROAD.a0) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
  for (let k = 0; k <= Math.ceil(CONDE_ROAD.turns) + 1; k++, th += Math.PI * 2) { const t = th / (CONDE_ROAD.turns * Math.PI * 2); if (t > 1) break; const rt = r0 - t * (r0 - r1), e = Math.abs(d - rt);
    if (e < 3.4) { const w = 1 - smoothstep(1.8, 3.4, e); if (!best || w > best.w) best = { w, h: c.H * base(rt) }; } }
  return best;
}
function monuH(tx: number, ty: number): number {
  let h = 0;
  { const c = MONU.desgraca, d = Math.hypot(tx - c.x, ty - c.y); if (d > c.top && d < c.R + 4) h += c.rim * Math.pow(Math.sin(Math.PI * (d - c.top) / (c.R + 4 - c.top)), 1.4) * (0.75 + 0.5 * ridged(tx * 0.1, ty * 0.1, 93)) * (Math.abs(Math.atan2(ty - c.y, tx - c.x) - Math.PI / 2) < 0.35 ? 0.15 : 1); } // a crista, aberta ao sul (a entrada)
  for (const c of [MONU.conde, MONU.odin, MONU.aurora]) { const d = Math.hypot(tx - c.x, ty - c.y); if (d >= c.R) continue;
    if (d <= c.top) { h += c.H; continue; }
    const k = (d - c.top) / (c.R - c.top), base = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * k), 1.15);
    let hh = c.H * base + (ridged(tx * 0.09, ty * 0.09, 91) - 0.5) * Math.min(7, Math.abs(c.H) * 0.4) * Math.sin(Math.PI * k); // encosta rochosa, com cristas
    if (c === MONU.conde) { const tr = condeTerrace(tx, ty); if (tr) hh = hh + (tr.h - hh) * tr.w; }
    h += hh; }
  return h;
}
/** a lagoa do Pináculo: água rasa, ilha grande no meio e ilhotas em volta (negativo = água) */
function lagoonSD(tx: number, ty: number): number {
  const m = MONU.marfim, dx = tx - m.x, dy = ty - m.y, d = Math.hypot(dx, dy); if (d > m.R + 4) return 99;
  let isl = (m.isle - d) * T; for (const [ix, iy, ir] of m.islets) isl = Math.max(isl, (ir - Math.hypot(dx - ix, dy - iy)) * T);
  isl = Math.max(isl, (fbm(tx * 0.13, ty * 0.13, 777) - 0.64) * 30 * smoothstep(m.R - 2, m.R - 10, d) * smoothstep(m.isle + 3, m.isle + 8, d)); // ilhotas soltas
  return Math.max((d - m.R) * T, isl);
}
/** o fosso do Bastião de Prata: anel de água em volta do forte */
function moatSD(tx: number, ty: number): number { const p = MONU.prata, d = Math.hypot(tx - p.x, ty - p.y); if (Math.abs(d - p.moat) > 6) return 99; return (Math.abs(d - p.moat) - p.moatW) * T; }
function waterSD0(xm: number, zm: number): number {
  const tx = xm / T, ty = zm / T;
  { const di = Math.hypot(tx - PORTO_L.farol.x, ty - PORTO_L.farol.y); if (di < 7) return Math.max(waterSD1(xm, zm), (PORTO_L.farol.r + 0.25 * Math.sin(Math.atan2(ty - PORTO_L.farol.y, tx - PORTO_L.farol.x) * 5) - di) * T); } // a ilha de pedras do Farol: terra no meio do mar
  { const lg = Math.min(lagoonSD(tx, ty), moatSD(tx, ty), harborSD(tx, ty)); if (lg < 98) { const rest = waterSD1(xm, zm); return Math.min(rest, lg); } }
  return waterSD1(xm, zm);
}
function waterSD1(xm: number, zm: number): number {
  const tx = xm / T, ty = zm / T;
  let dryK = 0; for (const d of DRY) { const dd = Math.hypot(tx - d.x, ty - d.y); if (dd < d.r) dryK = Math.max(dryK, smoothstep(d.r, d.r * 0.6, dd)); }
  if (dryK >= 1) return 8;
  const hw = 1.25 + 0.5 * Math.sin(tx * 0.16 + 3) + 0.25 * Math.sin(tx * 0.05);
  const sl = riverSlope(tx);
  let sd = (Math.abs((ty - riverY(tx)) / Math.sqrt(1 + sl * sl)) - hw) * T;
  { const ss = riverSslope(tx), hwS = 1.4 + 0.4 * Math.sin(tx * 0.09); sd = Math.min(sd, (Math.abs((ty - riverSy(tx)) / Math.sqrt(1 + ss * ss)) - hwS) * T); }
  if (ty > OFY_L + 20 - 60 && ty < riverY(tx) + 3) {
    const bs = riverBSlope(ty), hwB = 0.85 + 0.25 * Math.sin(ty * 0.2);
    sd = Math.min(sd, (Math.abs((tx - riverBx(ty)) / Math.sqrt(1 + bs * bs)) - hwB) * T);
  }
  for (const l of LAKES) {
    const dd = Math.hypot(tx - l.x, ty - l.y) - (l.r + (fbm(tx * 0.3, ty * 0.3, 5) - 0.5) * 3.2);
    if (dd * T < sd) sd = dd * T;
  }
  if (centerW(tx, ty) < 0.98) sd = Math.min(sd, outerWaterSD(tx, ty));
  sd = Math.min(sd, oceanSD(tx, ty)); // oceano ao sul (costa irregular) e alagados do pântano a oeste
  const out = sd + (fbm(tx * 0.45, ty * 0.45, 9) - 0.5) * 2.2;
  return out * (1 - dryK) + 8 * dryK;
}
export const WL = -1.2; // nível da água (m)
/* ---------- o mar em volta do continente, fiordes no noroeste (Viking) e rios/lagos do mundo de fora ---------- */
function oceanSD(tx: number, ty: number): number {
  const u = (tx - 420) / 222, v = (ty - 420) / 222, nn = (fbm(tx * 0.02, ty * 0.02, 141) - 0.5) * 0.34 + (fbm(tx * 0.07, ty * 0.07, 142) - 0.5) * 0.08;
  let R = 1.84 + nn; if (v < -1.25 && u > -0.55) R += 0.5; // o norte-centro e o nordeste terminam em montanha, não em mar
  const d = Math.pow(Math.pow(Math.abs(u), 3) + Math.pow(Math.abs(v), 3), 1 / 3);
  let sd = (R - d) * 222 * T;
  // fiordes: braços de mar entrando na Montanha Viking
  for (const f of FJORDS) sd = Math.min(sd, (segD(tx + (fbm(tx * 0.08, ty * 0.08, 143) - 0.5) * 10, ty, f) - 3.2) * T);
  return sd;
}
const FJORDS: [number, number][][] = [[[8, 150], [60, 160], [104, 140]], [[8, 236], [52, 226], [88, 238]], [[60, 8], [96, 50], [120, 70]]];
/** rios do mundo de fora: descem das montanhas para os lagos e o mar (meia-largura em tiles) */
const ORIVERS: { p: [number, number][]; w: number }[] = [
  { p: [[236, 150], [196, 196], [150, 222], [104, 262], [56, 280], [6, 290]], w: 1.4 }, // da Montanha Viking para o mar do oeste, cortando as Élficas
  { p: [[610, 196], [652, 262], [690, 330], [722, 396], [740, 432]], w: 1.2 }, // da Montanha Negra ao lago do Vale da Desgraça
  { p: [[142, 300], [130, 380], [158, 470], [150, 560], [148, 598]], w: 1.0 }, // das Élficas ao lago da Floresta Encantada
  { p: [[740, 450], [760, 530], [730, 610], [700, 690], [690, 790], [700, 840]], w: 1.5 }, // do Vale, pela Selva Licantropa, até o mar
];
/* ---------- LUGARES NOVOS NO MAPA VAZIO (02/11, Erling: "temos muito espaço não aproveitado no mapa; faça lugares seguindo as regras") ----------
   Cada um foi escolhido numa varredura do mundo (o ponto mais longe de tudo) e respeita as regras dos lugares marcados:
   ≥ 30 casas além do raio de qualquer povoado, ≥ 40 de outro lugar/calabouço, ≥ 56 entre si, sem estrada nem rio por cima.
   - sereias: clareira com lago e as Sereias Canibais (escondidas na água; saem quando você chega perto), a rainha no meio do lago;
   - goblins: acampamento na mata (barracas, fogueira, ossos, totens) com o chefe;
   - grutas: a boca de uma caverna (calabouço, masmorras.ts) com espíritos malignos rondando à noite;
   - oásis: o lago no meio da areia, cercado de palmeiras e verde — e o Gênio da Ilusão escondido na água. */
export interface WildPlace { name: string; kind: 'sereias' | 'goblins' | 'gruta' | 'oasis'; x: number; y: number; /** raio do lago (casas) */ lake?: number; /** raio sem árvore sorteada */ clear: number }
const WILD_L: WildPlace[] = [
  { name: 'Lago das Sereias de Prata', kind: 'sereias', x: 84, y: 624, lake: 7, clear: 16 },
  { name: 'Lago da Névoa Doce', kind: 'sereias', x: 476, y: 96, lake: 6, clear: 14 },
  { name: 'Lagoa do Canto Afogado', kind: 'sereias', x: 132, y: 496, lake: 6, clear: 14 },
  { name: 'Lagoa das Fauces', kind: 'sereias', x: 788, y: 580, lake: 7, clear: 16 },
  { name: 'Mata dos Goblins Ladrões', kind: 'goblins', x: 164, y: 448, clear: 10 },
  { name: 'Toca dos Goblins de Musgo', kind: 'goblins', x: 152, y: 300, clear: 10 },
  { name: 'Aldeia Goblin da Selva', kind: 'goblins', x: 772, y: 704, clear: 11 },
  { name: 'Covil Goblin do Passo', kind: 'goblins', x: 384, y: 52, clear: 10 },
  { name: 'Bosque dos Goblins Afogadiços', kind: 'goblins', x: 196, y: 784, clear: 10 },
  { name: 'Gruta das Cinzas que Choram', kind: 'gruta', x: 680, y: 52, clear: 8 },
  { name: 'Caverna dos Lamentos', kind: 'gruta', x: 704, y: 388, clear: 8 },
  { name: 'Gruta do Sopro Gelado', kind: 'gruta', x: 296, y: 176, clear: 8 },
  { name: 'Caverna das Vozes', kind: 'gruta', x: 52, y: 672, clear: 8 },
  { name: 'Gruta dos Sussurros', kind: 'gruta', x: 788, y: 364, clear: 8 },
  { name: 'Oásis da Miragem', kind: 'oasis', x: 424, y: 704, lake: 6, clear: 13 },
];
const OLAKES = [{ x: 742, y: 440, r: 15 }, { x: 150, y: 604, r: 17 }, { x: 702, y: 704, r: 12 }, { x: 384, y: 742, r: 10 }, { x: 92, y: 336, r: 10 }, { x: 300, y: 70, r: 11 }, { x: 560, y: 60, r: 8 }, ...WILD_L.filter((w) => w.lake).map((w) => ({ x: w.x, y: w.y, r: w.lake! }))];
export function outerWaterSD(tx: number, ty: number): number {
  let sd = 1e9; for (const r of ORIVERS) sd = Math.min(sd, (segD(tx + (fbm(tx * 0.06, ty * 0.06, 151) - 0.5) * 9, ty + (fbm(tx * 0.06 + 4, ty * 0.06, 152) - 0.5) * 9, r.p) - r.w) * T);
  for (const l of OLAKES) sd = Math.min(sd, (Math.hypot(tx - l.x, ty - l.y) - l.r - (fbm(tx * 0.3, ty * 0.3, 153) - 0.5) * 3.4) * T);
  return sd;
}

/* ---------- biomas ---------- */
export interface ZoneW { meadow: number; forest: number; swamp: number; snow: number; ruins: number; rock: number; volcanic: number; enchanted: number; blight: number; jungle: number; coast: number }
/* GEOGRAFIA (cartografia antes do código): a cordilheira nevada ocupa o norte e desce num esporão até o Cume Gelado;
   os charcos ocupam o oeste e avançam até o Atoleiro de Zerath; a mata fechada cobre o leste (Covil, Lundr, Eikvik), com o
   Planalto de Askavik aberto no nordeste; as Terras Antigas (ruínas) e a Garganta de Pedra ficam ao sul, antes da costa.
   Todas as bordas são deformadas por ruído largo (domain warp) — nenhuma fronteira é círculo nem reta. */
const SPUR: [number, number][] = [[190, 84], [198, 108], [205, 132], [211, 156]]; // espinhaço que desce da cordilheira até o Cume Gelado
const segD = (x: number, y: number, pts: [number, number][]) => { let d = 1e9; for (let i = 0; i < pts.length - 1; i++) { const [ax, ay] = pts[i], [bx, by] = pts[i + 1], dx = bx - ax, dy = by - ay, t = clamp01(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)); d = Math.min(d, Math.hypot(x - ax - dx * t, y - ay - dy * t)); } return d; };
const blob = (x: number, y: number, cx: number, cy: number, r: number, soft = 0.45) => smoothstep(r, r * soft, Math.hypot(x - cx, y - cy));
function zoneCenter(ax: number, ay: number): ZoneW {
  const tx0 = ax - SH, ty0 = ay - SH, AKX = ASKAVIK_L.x - SH, AKY = ASKAVIK_L.y - SH; // coordenadas das Terras dos Homens
  const wx = (fbm(tx0 * 0.016, ty0 * 0.016, 101) - 0.5) * 48, wy = (fbm(tx0 * 0.016 + 9.3, ty0 * 0.016 + 4.1, 102) - 0.5) * 48;
  const X = tx0 + wx + (fbm(tx0 * 0.05, ty0 * 0.05, 103) - 0.5) * 22, Y = ty0 + wy + (fbm(tx0 * 0.05 + 3, ty0 * 0.05 + 7, 104) - 0.5) * 22, n = (fbm(tx0 * 0.06, ty0 * 0.06, 3) - 0.5) * 14;
  const dA = Math.hypot(X - AKX, Y - AKY), plateau = smoothstep(74, 48, dA) * smoothstep(40, 62, Math.hypot(tx0 - AKX, ty0 - AKY)) + smoothstep(62, 40, Math.hypot(tx0 - AKX, ty0 - AKY)); // o planalto de Askavik é aberto
  // norte: cordilheira
  const edgeN = 98 + 15 * Math.sin(X * 0.021 + 1.1) + 9 * Math.sin(X * 0.057 + 0.3);
  let snow = smoothstep(edgeN + 10, edgeN - 10, Y + n * 0.6) * (1 - plateau);
  snow = Math.max(snow, smoothstep(5, -7, segD(tx0 + wx * 0.25, ty0 + wy * 0.25, SPUR) - 10 - n * 0.6));
  // oeste: charcos (e o Atoleiro de Zerath, um braço de pântano que chega quase à vila)
  const edgeW = 126 + 14 * Math.sin(Y * 0.03 + 0.7) + 8 * Math.sin(Y * 0.083);
  let swamp = smoothstep(edgeW + 12, edgeW - 10, X) * smoothstep(edgeN + 6, edgeN + 30, Y);
  swamp = Math.max(swamp, blob(tx0 + wx * 0.7 + (fbm(tx0 * 0.08, ty0 * 0.08, 105) - 0.5) * 20, ty0 + wy * 0.7 + (fbm(tx0 * 0.08 + 5, ty0 * 0.08, 106) - 0.5) * 20, 158, 204, 30, 0.35)) * (1 - snow);
  // sul: Terras Antigas (ruínas) e a rocha da Garganta, até as colinas da costa
  const edgeS = 242 + 12 * Math.sin(X * 0.031 + 2) + 8 * Math.sin(X * 0.09);
  const south = smoothstep(edgeS - 8, edgeS + 8, Y) * smoothstep(132, 152, X) * smoothstep(372, 350, X) * smoothstep(396, 372, Y) * (1 - swamp);
  const rockK = Math.max(blob(X, Y, 262, 262, 30), blob(X, Y, 332, 340, 26), smoothstep(0.6, 0.74, fbm(tx0 * 0.024, ty0 * 0.024, 51)));
  const rock = Math.max(south * rockK, snow > 0.5 ? 0 : smoothstep(0.7, 0.82, fbm(tx0 * 0.03, ty0 * 0.03, 52)) * 0.7 * (1 - swamp)); // afloramentos soltos pelo mundo
  const ruins = south * (1 - rockK);
  // leste: mata fechada; cinturão de pinheiros ao pé da cordilheira; matas soltas e a mata de Skógar ao sudoeste
  const edgeE = 246 + 16 * Math.sin(Y * 0.025) + 10 * Math.sin(Y * 0.071 + 1);
  let forest = smoothstep(edgeE - 12, edgeE + 12, X) * (1 - plateau * 0.85);
  forest = Math.max(forest, smoothstep(edgeN + 30, edgeN + 12, Y) * smoothstep(edgeN - 2, edgeN + 10, Y) * 0.85 * (1 - plateau));
  forest = Math.max(forest, smoothstep(0.6, 0.74, fbm(tx0 * 0.028, ty0 * 0.028, 41)) * 0.9, blob(X, Y, 150, 250, 30) * 0.95);
  forest *= (1 - snow) * (1 - swamp * 0.9) * (1 - south * 0.9);
  const sum = snow + swamp + forest + ruins + rock;
  const meadow = Math.max(0.0001, 1 - clamp01(sum));
  const tot = meadow + sum;
  return { meadow: meadow / tot, forest: forest / tot, swamp: swamp / tot, snow: snow / tot, ruins: ruins / tot, rock: rock / tot, volcanic: 0, enchanted: 0, blight: 0, jungle: 0, coast: 0 };
}
/* O MUNDO DE FORA (coordenadas absolutas, 840×840): oito regiões de lore em volta das Terras dos Homens.
   Elipses deformadas por ruído largo — as bordas serpenteiam e se misturam com o que há entre elas (campos, matas, colinas). */
export const LORE = {
  viking: { x: 190, y: 140, rx: 215, ry: 165 }, negra: { x: 645, y: 118, rx: 185, ry: 140 }, vampira: { x: 752, y: 282, rx: 96, ry: 88 },
  desgraca: { x: 748, y: 440, rx: 104, ry: 118 }, elfica: { x: 104, y: 372, rx: 128, ry: 150 }, encantada: { x: 152, y: 575, rx: 152, ry: 118 },
  licantropa: { x: 716, y: 682, rx: 150, ry: 138 }, vapor: { x: 432, y: 772, rx: 220, ry: 90 },
};
/** peso das Terras dos Homens (1 no centro, 0 fora): um quadrado de cantos arredondados e borda deformada */
export function centerW(ax: number, ay: number) {
  const u = (ax - 420) / 222 + (fbm(ax * 0.012, ay * 0.012, 111) - 0.5) * 0.26, v = (ay - 420) / 222 + (fbm(ax * 0.012 + 7, ay * 0.012 + 3, 112) - 0.5) * 0.26;
  return smoothstep(1.08, 0.9, Math.pow(Math.pow(Math.abs(u), 4) + Math.pow(Math.abs(v), 4), 0.25));
}
/* 07/11 (Erling: "os Picos de Jotunheim são nórdicos: no gelo, na serra entre Hrimgard e o Passo de Midvangr, até o mar"): uma CORDILHEIRA de
   gelo que desce da costa norte até a Cordilheira do Norte, separando o gelo viking do verde de Midvangr. Tem passos (gargantas) onde as
   estradas cruzam e onde há vila, para nenhuma estrada ficar presa. Devolve 0..1 (1 = espinha da serra) */
const JOT_PL: [number, number][] = [[352, -6], [342, 38], [350, 92], [364, 148], [378, 214]];
const JOT_GAP: [number, number][] = [[292, 96], [420, 168], [392, 42], [402, 150], [372, 232]];
const segDj = (px: number, py: number, ax: number, ay: number, bx: number, by: number) => { const dx = bx - ax, dy = by - ay, t = clamp01(((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)); return Math.hypot(px - ax - dx * t, py - ay - dy * t); };
export function jotunRidge(ax: number, ay: number): number {
  if (ax < 280 || ax > 440 || ay > 250) return 0;
  const wx = ax + (fbm(ax * 0.03, ay * 0.03, 171) - 0.5) * 22; let d = 1e9; for (let i = 0; i < JOT_PL.length - 1; i++) d = Math.min(d, segDj(wx, ay, ...JOT_PL[i], ...JOT_PL[i + 1]));
  let r = smoothstep(26, 10, d);
  /* gargantas: estrada de Kaldrfoss e de Hrimgard para Midvangr, e as vilas perto da serra */
  r *= smoothstep(6, 14, segDj(ax, ay, 262, 30, 420, 168)) * smoothstep(6, 14, segDj(ax, ay, 292, 96, 420, 168));
  for (const [gx, gy] of JOT_GAP) r *= smoothstep(16, 30, Math.hypot(ax - gx, ay - gy));
  return r; }
function zoneOuter(ax: number, ay: number): ZoneW {
  const X = ax + (fbm(ax * 0.014, ay * 0.014, 121) - 0.5) * 70 + (fbm(ax * 0.05, ay * 0.05, 123) - 0.5) * 18, Y = ay + (fbm(ax * 0.014 + 5, ay * 0.014 + 9, 122) - 0.5) * 70 + (fbm(ax * 0.05 + 2, ay * 0.05 + 8, 124) - 0.5) * 18;
  const E = (r: { x: number; y: number; rx: number; ry: number }, edge = 0.72) => smoothstep(1, edge, Math.hypot((X - r.x) / r.rx, (Y - r.y) / r.ry));
  const L = LORE;
  const snow = Math.max(E(L.viking), jotunRidge(ax, ay));
  const volcanic = E(L.negra) * (1 - snow);
  const blight = Math.max(E(L.vampira, 0.6), E(L.desgraca)) * (1 - volcanic);
  const enchanted = E(L.encantada) * (1 - snow);
  const jungle = E(L.licantropa) * (1 - blight);
  const coast = E(L.vapor, 0.6) * (1 - jungle) * (1 - enchanted);
  const forest = Math.max(E(L.elfica) * 0.95, smoothstep(0.6, 0.74, fbm(ax * 0.026, ay * 0.026, 131)) * 0.8) * (1 - snow) * (1 - volcanic) * (1 - blight) * (1 - enchanted) * (1 - jungle) * (1 - coast * 0.8);
  const rock = smoothstep(0.66, 0.8, fbm(ax * 0.03, ay * 0.03, 132)) * 0.7 * (1 - snow) * (1 - jungle) * (1 - enchanted);
  const sum = snow + volcanic + blight + enchanted + jungle + coast + forest + rock;
  const meadow = Math.max(0.0001, 1 - clamp01(sum)), tot = meadow + sum;
  return { meadow: meadow / tot, forest: forest / tot, swamp: 0, snow: snow / tot, ruins: 0, rock: rock / tot, volcanic: volcanic / tot, enchanted: enchanted / tot, blight: blight / tot, jungle: jungle / tot, coast: coast / tot };
}
function zoneW_L(ax: number, ay: number): ZoneW {
  { const dA = Math.max(Math.abs(ax - ASKAVIK_L.x), Math.abs(ay - ASKAVIK_L.y)) - (ASKAVIK_L.r + 3); // dentro da muralha de Askavik: grama de cidade
    if (dA < 2) { const k = dA < -1 ? 1 : (2 - dA) / 3; const base = k >= 1 ? null : zoneW0(ax, ay), out = {} as ZoneW;
      for (const key of ['snow', 'forest', 'swamp', 'ruins', 'rock', 'meadow', 'volcanic', 'enchanted', 'blight', 'jungle', 'coast'] as (keyof ZoneW)[]) out[key] = (key === 'meadow' ? k : 0) + (base ? base[key] * (1 - k) : 0);
      return out; } }
  return zoneW0(ax, ay);
}
function zoneW0(ax: number, ay: number): ZoneW {
  const cw = centerW(ax, ay);
  if (cw > 0.999) return zoneCenter(ax, ay);
  const o = zoneOuter(ax, ay); if (cw < 0.001) return o;
  const c = zoneCenter(ax, ay), out = {} as ZoneW;
  for (const k of Object.keys(o) as (keyof ZoneW)[]) out[k] = c[k] * cw + o[k] * (1 - cw);
  return out;
}
/** relevo das montanhas (m): cordilheira, esporão até o pico do Cume Gelado, maciço da Garganta e colinas */
const ridged = (x: number, y: number, s: number) => 1 - Math.abs(2 * fbm(x, y, s) - 1);
export function mountainH(tx: number, ty: number, z: ZoneW): number {
  let h = 0;
  if (z.snow > 0.05) { /* o Cume Gelado (01/11, Erling: "não gosto dessa subida"): em vez de um cone liso, o pico sobe em patamares de rocha —
       degraus largos com uma rampa suave entre eles, e uma crista de ruído para a encosta não ser lisa */
    const dC = Math.hypot(tx - 211 - SH, ty - 156 - SH), sC = smoothstep(34, 0, dC), steps = 4, q = sC * steps, fl = Math.floor(q), fr = q - fl, tread = smoothstep(0.35, 0.65, fr);
    const terr = (fl + tread) / steps; h += Math.pow(z.snow, 1.4) * (2.5 + 8 * ridged(tx * 0.045, ty * 0.045, 61)) + 9 * (0.55 * sC + 0.45 * terr) * z.snow + 0.6 * ridged(tx * 0.2, ty * 0.2, 64) * sC * z.snow; }
  { const jr = jotunRidge(tx, ty); if (jr > 0.01) h += Math.pow(jr, 1.3) * (7 + 16 * ridged(tx * 0.07, ty * 0.07, 172)); } /* os Picos de Jotunheim: espinha alta e serrilhada */
  if (z.rock > 0.05) h += Math.pow(z.rock, 1.3) * (1.5 + 6 * ridged(tx * 0.06, ty * 0.06, 62));
  if (z.volcanic > 0.05) { // Montanha Negra: cristas negras e o cone que pulsa lava, com cratera no topo
    const dV = Math.hypot(tx - LORE.negra.x, ty - LORE.negra.y + 8); h += Math.pow(z.volcanic, 1.2) * (4 + 10 * ridged(tx * 0.04, ty * 0.04, 63)) + 26 * smoothstep(70, 6, dV) - 9 * smoothstep(9, 2, dV); }
  if (z.blight > 0.05) h -= z.blight * 1.6 * smoothstep(60, 0, Math.hypot(tx - LORE.desgraca.x, ty - LORE.desgraca.y)); // o Vale afunda
  if (z.blight > 0.05) h += z.blight * 7 * smoothstep(40, 0, Math.hypot(tx - LORE.vampira.x, ty - LORE.vampira.y)); // a colina do castelo
  return h;
}
function biomeAt_L(tx: number, ty: number): Biome {
  const z = zoneW_L(tx, ty);
  let best: Biome = 'meadow', bv = -1;
  for (const k of Object.keys(z) as Biome[]) if (z[k] > bv) { bv = z[k]; best = k; }
  return best;
}

/* ---------- relevo ---------- */
const pads: { x: number; z: number; r: number; h: number }[] = [];
/* índice espacial dos platôs (vilas, tendas): groundH_L roda milhões de vezes, não pode varrer todos */
let padIdxN = -1; const padIdx = new Map<number, { x: number; z: number; r: number; h: number }[]>(); const PADC = 64; // metros por célula
function padsNear(xm: number, zm: number) {
  if (padIdxN !== pads.length) { padIdx.clear(); for (const p of pads) for (let cy = Math.floor((p.z - p.r) / PADC); cy <= Math.floor((p.z + p.r) / PADC); cy++) for (let cx = Math.floor((p.x - p.r) / PADC); cx <= Math.floor((p.x + p.r) / PADC); cx++) { const k = cy * 4096 + cx; (padIdx.get(k) ?? padIdx.set(k, []).get(k)!).push(p); } padIdxN = pads.length; }
  return padIdx.get(Math.floor(zm / PADC) * 4096 + Math.floor(xm / PADC)) ?? NOPADS;
}
const NOPADS: { x: number; z: number; r: number; h: number }[] = [];
let bridgesRef: Bridge[] = [];

function groundH_L(xm: number, zm: number, zPre?: ZoneW, sdPre?: number): number {
  const tx = xm / T, ty = zm / T;
  const dc = Math.hypot(tx - CITY_L.x, ty - CITY_L.y);
  const flat = 1 - smoothstep(26, 36, dc);
  let h0 = 0;
  if (flat < 1) {
    const z = zPre ?? zoneW_L(tx, ty);
    const amp = z.snow * 1.2 + z.forest * 0.75 + z.swamp * 0.12 + z.ruins * 0.5 + z.rock * 1.2 + z.meadow * 0.45 + z.volcanic * 1.5 + z.enchanted * 0.6 + z.blight * 0.4 + z.jungle * 0.7 + z.coast * 0.15;
    h0 = ((fbm(tx * 0.07, ty * 0.07, 11) - 0.5) * 2 * amp + (fbm(tx * 0.022, ty * 0.022, 12) - 0.5) * 2.4 * (1 - z.swamp) + mountainH(tx, ty, z) + (vnoise(tx * 0.4, ty * 0.4, 3) - 0.5) * 0.22) * (1 - flat);
  }
  h0 += monuH(tx, ty);
  { const ek = edgeK_L(tx, ty); // bordas: cordilheira ao norte (sobe até ~22 m), fundo do oceano ao sul, lama funda a oeste
    if (ek.north > 0) h0 += ek.north * (5 + 17 * smoothstep(0.25, 1, ek.north)) * (0.75 + 0.5 * fbm(tx * 0.09, ty * 0.09, 80)) + ek.north * (vnoise(tx * 0.5, ty * 0.5, 81) - 0.5) * 2.5;
    if (ek.south > 0) h0 -= ek.south * 7; if (ek.west > 0) h0 -= ek.west * 2.5; }
  for (const p of padsNear(xm, zm)) { const d = Math.hypot(xm - p.x, zm - p.z); if (d < p.r) h0 += (p.h - h0) * smoothstep(p.r, p.r * 0.55, d); }
  const sd = sdPre ?? waterSD_L(xm, zm);
  if (Math.max(Math.abs(tx - ASKAVIK_L.x), Math.abs(ty - ASKAVIK_L.y)) < ASKAVIK_L.r + 7) return sd <= 0 ? WL - 1.6 : h0; // Askavik: cais de pedra a prumo (o canal não tem margem em rampa)
  if (Math.hypot(tx - PORTO_L.farol.x, ty - PORTO_L.farol.y) < 8) return sd <= 0 ? WL - 1.6 : WL + 1.2 + Math.min(1.6, sd * 0.9); // a ilha do Farol: pedra que sobe do mar, a prumo
  if (Math.abs(tx - PORTO_L.x) < PORTO_L.r + 6 && Math.abs(ty - PORTO_L.y) < PORTO_L.r + 6) return sd <= 0 ? WL - 1.6 : Math.max(h0, WL + 0.3); // Porto Caldeira: a bacia tem cais a prumo e a cidade nunca afunda no mar
  /* margem sem "briga" com o plano da água (a tela tremia): o fundo começa 35 cm abaixo da água e a terra 14 cm acima */
  if (sd <= 0) return WL - 0.35 - 1.2 * smoothstep(0, 2.4, -sd) - 0.1 * vnoise(xm * 0.5, zm * 0.5, 2) * smoothstep(0, 1, -sd);
  const t = Math.min(1, sd / 3.4);
  const rise = smoothstep(0, 1, Math.pow(t, 0.8));
  return Math.max(WL + 0.1, WL + 0.14 + (h0 - WL - 0.14) * rise + (vnoise(xm * 0.7, zm * 0.7, 6) - 0.5) * 0.14 * (1 - t));
}
/** muralha com caminho de ronda (cidades médias): anel de raio R (casas) em volta de (cx,cy); top = altura absoluta do caminho;
 *  escadarias por dentro: lance de L casas na linha R−1, a0 = primeira casa ao longo do lado, rise = sentido em que sobe */
/** escadaria da muralha: casas do lance, da mais baixa para a mais alta; axis = eixo ao longo do qual sobe; dir = +1 sobe no sentido +eixo */
export interface Flight { tiles: [number, number][]; axis: 'x' | 'y'; dir: 1 | -1 }
/** muralha orgânica (27/10, regra 19): o conjunto de casas do anel (chave ty*4096+tx), a altura do caminho de ronda e as escadarias */
export interface Rampart { cx: number; cy: number; R: number; top: number; H: number; flights: Flight[]; /** chaves ty*4096+tx (array: sobrevive ao cache JSON do mundo) */ tiles: number[]; /** altura do caminho de ronda casa a casa (paralelo a `tiles`): as peças seguem o terreno, o herói também */ tops?: number[]; /** 07/11: está nas coordenadas do MUNDO (as locais não têm) */ wd?: 1 }
const rampSets = new WeakMap<Rampart, Set<number>>();
const rampSet = (r: Rampart) => { let s = rampSets.get(r); if (!s) { s = new Set(r.tiles); rampSets.set(r, s); } return s; };
export const RAMPART_H = 6;
let rampartsRef: Rampart[] = [];
function setRamparts_L(r: Rampart[]) { rampartsRef = r; }
/** a muralha cujo anel passa por esta casa (ou null) */
function rampartAt_L(tx: number, ty: number): Rampart | null {
  const k = ty * 4096 + tx; for (const r of rampartsRef) if (rampSet(r).has(k)) return r; return null; }
const rampTops = new WeakMap<Rampart, Map<number, number>>();
/** altura do caminho de ronda nesta casa (a peça do muro está em groundH_L da casa + H; um valor só para o anel inteiro deixava o herói no ar) */
function rampartTop_L(r: Rampart, tx: number, ty: number): number {
  if (!r.tops) return r.top; let m = rampTops.get(r); if (!m) { m = new Map(); r.tiles.forEach((k, i) => m!.set(k, r.tops![i])); rampTops.set(r, m); } return m.get(ty * 4096 + tx) ?? r.top; }
/** casa de escada? devolve a altura do degrau (absoluta) no ponto (m) — ou null */
function stairDeck_L(xm: number, zm: number): number | null {
  const fx = xm / T, fy = zm / T, tx = Math.floor(fx), ty = Math.floor(fy);
  for (const r of rampartsRef) { if (Math.abs(tx - r.cx) > r.R + 8 || Math.abs(ty - r.cy) > r.R + 8) continue;
    for (const f of r.flights) { const i = f.tiles.findIndex(([x, y]) => x === tx && y === ty); if (i < 0) continue; const L = f.tiles.length;
      const along = f.axis === 'x' ? fx - tx : fy - ty; const t = (i + (f.dir > 0 ? along : 1 - along)) / L; return r.top - r.H + r.H * Math.min(1, Math.max(0, t)) + 0.04; } }
  return null; }
/** é a casa mais alta de um lance (de onde se pisa no caminho de ronda)? */
function stairTopAt_L(tx: number, ty: number): boolean {
  for (const r of rampartsRef) for (const f of r.flights) { const [x, y] = f.tiles[f.tiles.length - 1]; if (x === tx && y === ty) return true; } return false; }
const BRIDGE_HALF = 1.9;
/* índice de células (64 m) das pontes — bridgeDeck_L roda em todo heightAt_L (por vértice do terreno e por entidade por quadro);
   varrer as ~200 pontes a cada chamada era a parte mais cara da função. O índice refaz sozinho quando a lista muda. */
let bridgeIdxOf: Bridge[] | null = null, bridgeIdxN = -1; const bridgeIdx = new Map<number, Bridge[]>();
function bridgesNear(xm: number, zm: number): Bridge[] {
  if (bridgeIdxOf !== bridgesRef || bridgeIdxN !== bridgesRef.length) { bridgeIdx.clear(); bridgeIdxOf = bridgesRef; bridgeIdxN = bridgesRef.length;
    for (const b of bridgesRef) { let x0 = Math.min(b.ax, b.bx) * T - 6, x1 = Math.max(b.ax, b.bx) * T + 6, z0 = Math.min(b.ay, b.by) * T - 6, z1 = Math.max(b.ay, b.by) * T + 6;
      if (b.poly) for (let i = 0; i < b.poly.length; i += 2) { x0 = Math.min(x0, b.poly[i] * T - 2); x1 = Math.max(x1, b.poly[i] * T + 2); z0 = Math.min(z0, b.poly[i + 1] * T - 2); z1 = Math.max(z1, b.poly[i + 1] * T + 2); }
      for (let cy = Math.floor(z0 / PADC); cy <= Math.floor(z1 / PADC); cy++) for (let cx = Math.floor(x0 / PADC); cx <= Math.floor(x1 / PADC); cx++) { const k = cy * 4096 + cx; (bridgeIdx.get(k) ?? bridgeIdx.set(k, []).get(k)!).push(b); } } }
  return bridgeIdx.get(Math.floor(zm / PADC) * 4096 + Math.floor(xm / PADC)) ?? EMPTY_BR;
}
const EMPTY_BR: Bridge[] = [];
/** dentro do polígono (casas)? */
export function inPoly(poly: number[], x: number, y: number): boolean { let c = false; for (let i = 0, j = poly.length - 2; i < poly.length; j = i, i += 2) { const xi = poly[i], yi = poly[i + 1], xj = poly[j], yj = poly[j + 1]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; }
/** altura do tabuleiro do encaixe num ponto (casas): cada boca puxa a altura da junção para a sua, pesada pela proximidade do eixo */
function forkH_L(b: Bridge, x: number, y: number): number { const E = b.ends!; let ws = 0, hs = 0;
  for (let i = 0; i < E.length; i += 3) { const dx = E[i] - b.ax, dy = E[i + 1] - b.ay, L2 = dx * dx + dy * dy || 1; const t = Math.max(0, Math.min(1, ((x - b.ax) * dx + (y - b.ay) * dy) / L2)); const d = Math.hypot(b.ax + dx * t - x, b.ay + dy * t - y); const w = 1 / (d * d + 0.3); ws += w; hs += w * (b.hA + (E[i + 2] - b.hA) * t); }
  return ws ? hs / ws : b.hA; }
function bridgeDeck_L(xm: number, zm: number): number | null {
  for (const b of bridgesNear(xm, zm)) {
    if (b.poly) { if (inPoly(b.poly, xm / T, zm / T)) return forkH_L(b, xm / T, zm / T) + 0.12; continue; }
    const ax = b.ax * T, az = b.ay * T, bx = b.bx * T, bz = b.by * T;
    const dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz;
    const t = ((xm - ax) * dx + (zm - az) * dz) / L2;
    if (t < 0 || t > 1) continue;
    const px = ax + dx * t, pz = az + dz * t;
    if (Math.hypot(xm - px, zm - pz) < (b.half ?? BRIDGE_HALF)) return b.hA + (b.hB - b.hA) * t + (b.hump ? b.hump * Math.sin(Math.PI * t) : 0) + 0.12;
  }
  return null;
}
function heightAt_L(xm: number, zm: number): number {
  if (rampartsRef.length) { const st = stairDeck_L(xm, zm); if (st !== null) return st; }
  const d = bridgeDeck_L(xm, zm);
  return d !== null ? d : groundH_L(xm, zm);
}

/** o que a geração deixa guardado fora do World (platôs das vilas): vai junto no cache do mundo */
function worldState_L() { return { pads: pads.map((p) => ({ ...p })) }; }
/** restaura um mundo lido do cache: platôs, pontes e as áreas secas das vilas */
function restoreWorldState_L(st: { pads: { x: number; z: number; r: number; h: number }[] }, w: World) {
  pads.length = 0; pads.push(...st.pads); padIdxN = -1; bridgesRef = w.bridges; rampartsRef = w.ramparts ?? [];
  DRY.length = 0; for (const v of VILL) DRY.push({ x: v[1], y: v[2], r: 17 });
}
/* ---------- geração do mundo ---------- */
const SOFT_KINDS = ['tree', 'rock', 'herb', 'bush', 'flower', 'grass', 'stump', 'bones', 'bench', 'barrel', 'crate', 'lamp', 'torch', 'fogpatch'] as const; /* o que sai do caminho quando um prédio precisa do lugar (bush/flower/grass/stump/barrel/crate/lamp são nomes antigos mantidos por segurança) */
function buildCity_L(): World {
  const map: Tile[][] = [];
  const biome: Biome[][] = [];
  pads.length = 0;
  bridgesRef = []; rampartsRef = [];
  DRY.length = 0; for (const v of VILL) DRY.push({ x: v[1], y: v[2], r: 17 });
  /* grade grossa (2×2 tiles): bioma e distância da água calculados uma vez; a água fina só é refeita perto das margens.
     Os mesmos números servem depois ao traçado das estradas. */
  const CG = 2, GW = Math.ceil(MAP_W_L / CG), GHt = Math.ceil(MAP_H_L / CG), NC = GW * GHt;
  const cellZ: ZoneW[] = new Array(NC), cellSD = new Float32Array(NC), cellB: Biome[] = new Array(NC);
  for (let cy = 0; cy < GHt; cy++) for (let cx = 0; cx < GW; cx++) { const c = cy * GW + cx, tx = cx * CG + 1, ty = cy * CG + 1; const z = zoneW_L(tx, ty); cellZ[c] = z; cellSD[c] = waterSD_L(tx * T, ty * T);
    let best: Biome = 'meadow', bv = -1; for (const k of Object.keys(z) as Biome[]) if (z[k] > bv) { bv = z[k]; best = k; } cellB[c] = best; }
  for (let y = 0; y < MAP_H_L; y++) {
    const row: Tile[] = [], brow: Biome[] = [];
    for (let x = 0; x < MAP_W_L; x++) {
      const c = Math.floor(y / CG) * GW + Math.floor(x / CG), sdc = cellSD[c];
      row.push(sdc > 7 ? 'grass' : sdc < -7 ? 'water' : waterSD_L((x + 0.5) * T, (y + 0.5) * T) < 1.3 ? 'water' : 'grass');
      brow.push(cellB[c]);
    }
    map.push(row); biome.push(brow);
  }
  const inb = (x: number, y: number) => x >= 0 && y >= 0 && x < MAP_W_L && y < MAP_H_L;
  const props: Prop[] = [];
  const bridges: Bridge[] = [];
  const spawns: SpawnDef[] = [];
  const pois: Poi[] = [];
  const r = rng(7);

  /* estradas: polilinhas com ondulação orgânica; atravessar água gera ponte */
  const roads: [number, number][][] = []; const roadPaths: { x: number; y: number }[][] = []; /** que trecho liga que vilas (as caravanas da Companhia andam por eles) */ const roadLinks: { a: string; b: string; i: number }[] = [];
  const road = (pts: [number, number][], width = 1.05, wig = 1) => {
    roads.push(pts);
    const samples: { x: number; y: number }[] = [];
    let s = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
      const L = Math.hypot(x1 - x0, y1 - y0), nx = -(y1 - y0) / L, ny = (x1 - x0) / L;
      for (let d = 0; d < L; d += 0.5, s += 0.5) {
        const px = x0 + ((x1 - x0) * d) / L, py = y0 + ((y1 - y0) * d) / L;
        const amp = 1.9 * wig * smoothstep(20, 36, Math.hypot(px - CITY_L.x, py - CITY_L.y));
        const w = Math.sin(s * 0.33 + pts[0][0]) * amp + Math.sin(s * 0.11 + 2) * amp * 0.6;
        samples.push({ x: px + nx * w, y: py + ny * w });
      }
    }
    roadPaths.push(samples.filter((_, i) => i % 4 === 0));
    const flag = samples.map((p) => waterSD_L(p.x * T, p.y * T) < 4.2);
    for (let i = 0; i < samples.length; i++) {
      const p = samples[i];
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
        const tx = Math.floor(p.x) + dx, ty = Math.floor(p.y) + dy;
        if (!inb(tx, ty) || Math.hypot(tx + 0.5 - p.x, ty + 0.5 - p.y) > width) continue;
        if (map[ty][tx] === 'water' && !flag[i]) continue;
        map[ty][tx] = 'road';
      }
    }
    // pontes: trechos contínuos sobre/ao lado da água
    let i = 0;
    while (i < samples.length) {
      if (!flag[i]) { i++; continue; }
      let j = i; while (j + 1 < samples.length && flag[j + 1]) j++;
      const a = samples[Math.max(0, i - 3)], b = samples[Math.min(samples.length - 1, j + 3)];
      // só vira ponte se a estrada realmente ATRAVESSA a água (andar pela margem não é ponte)
      let wet = false; for (let k = i; k <= j && !wet; k++) if (waterSD_L(samples[k].x * T, samples[k].y * T) < 0.2) wet = true;
      if (wet && Math.hypot(b.x - a.x, b.y - a.y) > 2.5) {
        // várias rotas cruzam o rio no mesmo lugar: uma ponte só (fica a mais longa, que cobre toda a água)
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, len = Math.hypot(b.x - a.x, b.y - a.y);
        const dup = bridges.find((e) => Math.hypot((e.ax + e.bx) / 2 - mx, (e.ay + e.by) / 2 - my) < 8);
        if (!dup) bridges.push({ ax: a.x, ay: a.y, bx: b.x, by: b.y, hA: 0, hB: 0 });
        else if (len > Math.hypot(dup.bx - dup.ax, dup.by - dup.ay) + 0.5) { Object.assign(dup, { ax: a.x, ay: a.y, bx: b.x, by: b.y }); bridgeIdxN = -1; /* a ponte mudou de lugar: refaz o índice */ }
      }
      i = j + 1;
    }
  };

  bridgesRef = bridges; // alturas das pontas: terreno cru nas pontas
  for (const b of bridges) {
    const save = bridgesRef; bridgesRef = [];
    b.hA = groundH_L(b.ax * T, b.ay * T); b.hB = groundH_L(b.bx * T, b.by * T);
    bridgesRef = save;
  }

  /* praça, fonte e cidade (o desenho antigo, deslocado para o centro do mapa) */
  const OX = 52 + OFX_L, OY = 54 + OFY_L;
  const K = (x: number, y: number) => ({ x: x + OFX_L, y: y + OFY_L });
  for (let y = 15; y <= 20; y++) for (let x = 15; x <= 20; x++) map[y + OY][x + OX] = 'plaza';
  for (let x = 17; x <= 18; x++) for (let y = 0; y < 36; y++) if (map[y + OY][x + OX] !== 'water') map[y + OY][x + OX] = 'road';
  for (let y = 17; y <= 18; y++) for (let x = 0; x < 36; x++) if (map[y + OY][x + OX] !== 'water') map[y + OY][x + OX] = 'road';
  for (let y = 15; y <= 20; y++) for (let x = 15; x <= 20; x++) map[y + OY][x + OX] = 'plaza';

  const block = (p: Prop) => {
    props.push(p);
    for (let y = p.gy; y < p.gy + p.h; y++) for (let x = p.gx; x < p.gx + p.w; x++) if (inb(x, y)) map[y][x] = 'wall';
  };
  props.push({ kind: 'fountain', gx: 17 + OX, gy: 17 + OY, w: 2, h: 2, height: 0.9, wall: 0x6f7480, roof: 0x6fc7ff });
  block({ kind: 'temple', gx: 10 + OX, gy: 3 + OY, w: 5, h: 4, height: 7, wall: 0x6a5f8a, roof: 0x8f7bff });
  const houses: [number, number, number, number, number, number, number][] = [
    [4, 8, 5, 4, 3.0, 0xb99a6b, 0x8a3b2e], [22, 6, 6, 5, 3.0, 0xc2a679, 0x7a4a2a],
    [4, 20, 5, 4, 3.0, 0xa88a60, 0x6d3a28], [22, 21, 6, 4, 3.0, 0xb99a6b, 0x4e5f7a],
    [4, 13, 4, 4, 3.0, 0xc2a679, 0x8a3b2e], [29, 13, 5, 4, 3.0, 0xa88a60, 0x5d6b3a],
    [11, 22, 5, 4, 3.0, 0xb99a6b, 0x7a4a2a], [29, 21, 5, 4, 3.0, 0xc2a679, 0x6d3a28],
  ];
  const HV = [1, 4, 2, 0, 3, 5, 2, 1];
  houses.forEach(([gx, gy, w, h, height, wall, roof], i) => block({ kind: 'house', gx: gx + OX, gy: gy + OY, w, h, height, wall, roof, variant: HV[i] }));
  const decor = (kind: PropKind, gx: number, gy: number, w: number, h: number, variant: number, wall = 0x6a4528, roof = 0x8a3b2e) => { if (inb(gx, gy) && inb(gx + w - 1, gy + h - 1) && map[gy][gx] !== 'water') props.push({ kind, gx, gy, w, h, height: 1, wall, roof, variant }); };
  // baús nos cantos das casas
  houses.forEach(([gx, gy, w, h], i) => { decor('chest', gx - 1 + OX, gy + h - 1 + OY, 1, 1, i); if (i % 2 === 0) decor('chest', gx + w + OX, gy + OY, 1, 1, i + 3); });
  // praça: bancos e barracas de mercado
  for (const [bx, by, v] of [[14, 15, 0], [21, 15, 0], [14, 20, 0], [21, 20, 0], [16, 14, 1], [19, 14, 1], [16, 21, 1], [19, 21, 1]] as [number, number, number][]) decor('bench', bx + OX, by + OY, 1, 1, v);
  decor('stall', 12 + OX, 12 + OY, 2, 2, 0, 0x7a5a38, 0x8a3b2e);
  /* o quadro de avisos do Vale saiu daqui (04/11): ficava no meio da rua das carroças. Agora todas as cidades e vilas ganham o seu,
     no centro mas fora da rua (ver "QUADRO DE AVISOS" mais abaixo) */
  // barracas dos comércios da vila
  decor('stall', 25 + OX, 19 + OY, 2, 2, 0, 0x6a4a6c, 0x5a3a7a); decor('stall', 9 + OX, 9 + OY, 2, 2, 0, 0x6a4a2c, 0x5d6b3a); decor('stall', 1 + OX, 24 + OY, 2, 2, 0, 0x5a6a4a, 0x3a4a2a); decor('stall', 31 + OX, 8 + OY, 2, 2, 0, 0x7a6a5a, 0x6a5a4a); decor('stall', 7 + OX, 24 + OY, 2, 2, 0, 0x7a4a3a, 0x8a3b2e); decor('stall', 35 + OX, 23 + OY, 2, 2, 0, 0x8a5a2a, 0xd0702a); decor('stall', 28 + OX, 10 + OY, 2, 2, 0, 0x7a7a7a, 0x4e5f7a);
  if (map[26 + OY][28 + OX] === 'grass') block({ kind: 'campfire', gx: 28 + OX, gy: 26 + OY, w: 1, h: 1, height: 0.6, wall: 0x4a4a4a, roof: 0xff8a2a }); decor('stall', 24 + OX, 13 + OY, 2, 2, 0, 0x6a4a2c, 0x4e5f7a); decor('stall', 12 + OX, 19 + OY, 2, 2, 0, 0x7a5a38, 0x5d6b3a);
  const torch = (gx: number, gy: number) => { if (inb(gx, gy) && map[gy][gx] !== 'water') props.push({ kind: 'torch', gx, gy, w: 1, h: 1, height: 1.9, wall: 0x3a2a1c, roof: 0xff8a2a }); };
  /* 09/11 (Erling, foto da praça): os postes saem do meio da praça e vão para as beiradas, dois de cada lado, fora da rua */
  [[12, 15], [12, 20], [23, 15], [23, 20], [9, 7], [15, 7], [16, 25], [19, 25], [10, 21]].forEach(([x, y]) => torch(x + OX, y + OY)); /* 09/11: + um poste entre as casas do sudoeste, onde ficava o boneco */
  /* 08/11 (Erling: "todas as vilas com atrativos e decoração"; Karmika é a vila de nascimento dos humanos): canteiros de flores em volta da fonte e
     junto das casas, postes de lampião nas esquinas da praça, barris, caixas, feno e carrinhos de mão ao lado das barracas, mais bancos */
  { const okD = (x: number, y: number) => inb(x, y) && (map[y][x] === 'grass' || map[y][x] === 'plaza') && !props.some((q) => q.gx <= x && q.gx + q.w > x && q.gy <= y && q.gy + q.h > y);
    const fl = (x: number, y: number) => { if (okD(x, y)) props.push({ kind: 'herb', gx: x, gy: y, w: 1, h: 1, height: 0.5, wall: 0, roof: 0, variant: 4 }); };
    const vpK = (v: number, x: number, y: number, ry = 0) => { if (okD(x, y)) props.push({ kind: 'vprop', gx: x, gy: y, w: 1, h: 1, height: 1, wall: 0, roof: 0, variant: v, ry }); };
    for (let k = 0; k < 14; k++) { const a = k / 14 * 6.283; fl(Math.round(18 + OX + Math.cos(a) * 4.2), Math.round(18 + OY + Math.sin(a) * 4.2)); }
    houses.forEach(([gx, gy, w, h], i) => { fl(gx + OX - 1, gy + OY + h); fl(gx + OX + w, gy + OY + h); if (i % 2) fl(gx + OX + Math.floor(w / 2), gy + OY + h + 1); });
    for (const [x, y] of [[11, 11], [24, 11], [11, 23], [24, 23], [6, 17], [30, 17], [17, 5], [17, 28]]) vpK(4, x + OX, y + OY);
    for (const st of props.filter((q) => q.kind === 'stall' && Math.abs(q.gx - 18 - OX) < 22 && Math.abs(q.gy - 18 - OY) < 22)) { vpK([0, 1, 6, 7][(st.gx + st.gy) % 4], st.gx + st.w, st.gy + st.h - 1, ((st.gx * 7) % 10) * 0.6); vpK([1, 0][(st.gx) % 2], st.gx - 1, st.gy, ((st.gy * 3) % 10) * 0.6); }
    for (const [x, y, v] of [[13, 17, 1], [22, 17, 1], [18, 13, 0], [18, 22, 0]] as [number, number, number][]) if (okD(x + OX, y + OY)) decor('bench', x + OX, y + OY, 1, 1, v); }
  /* ---- o Quartel de Karmika (Erling, 01/11: "uma zona de treinamento um pouco depois da igreja, um quartel com um quintal com pelo menos 4 bonecos"):
     prédio de pedra logo a oeste da igreja, pátio calçado e murado com portão para o sul, quatro bonecos de palha em fila,
     estantes de armas encostadas no prédio, baú, bancos e tochas no portão. O boneco que ficava escondido atrás da casa veio para cá. ---- */
  const QX = -5 + OX, QY = 9 + OY; // canto noroeste do terreno (8 × 7 tiles), a sudoeste da praça, de frente para a câmera (01/11: atrás da igreja ficava escondido); o prédio ocupa 4 × 3 no canto
  for (let y = 0; y < 7; y++) for (let x = 0; x < 8; x++) if (inb(QX + x, QY + y) && map[QY + y][QX + x] !== 'water') map[QY + y][QX + x] = 'plaza';
  block({ kind: 'house', gx: QX, gy: QY, w: 4, h: 3, height: 4.4, wall: 0x8a8276, roof: 0x4e5f7a, variant: 3 });
  const qwall = (ax: number, ay: number, bx: number, by: number) => { const mx = (ax + bx) / 2, my = (ay + by) / 2, gx = Math.floor(mx), gy = Math.floor(my); if (!inb(gx, gy)) return;
    props.push({ kind: 'lowwall', gx, gy, w: 1, h: 1, height: 0.9, wall: 0, roof: 0, variant: 20, ry: Math.atan2(-(by - ay), bx - ax), ox: (mx - gx) * T, oz: (my - gy) * T, len: Math.hypot(bx - ax, by - ay) * T + 0.12, broken: 0 }); };
  qwall(QX + 4, QY, QX + 8, QY); qwall(QX + 8, QY, QX + 8, QY + 7); qwall(QX, QY + 3, QX, QY + 7); qwall(QX, QY + 7, QX + 3, QY + 7); qwall(QX + 5, QY + 7, QX + 8, QY + 7); // portão: vão de 2 tiles no muro sul
  torch(QX + 2, QY + 7); torch(QX + 5, QY + 7);
  /* 05/11 (Erling: "os bonecos e a grade de armas estão no meio do caminho"): tudo para o lado oeste do pátio, fora da estrada de terra */ decor('rack', QX + 3, QY + 3, 1, 1, 0); decor('rack', QX + 4, QY + 3, 1, 1, 1); /* uma casa de folga do prédio do quartel: estante colada nele o empurrava para o portão */ decor('chest', QX + 7, QY + 2, 1, 1, 2);
  decor('bench', QX + 1, QY + 6, 1, 1, 0); decor('bench', QX + 6, QY + 6, 1, 1, 0);
  /* props da prancha 59 na cidade de Karmika: poço, lanternas nas esquinas da praça, placa na saída sul, barris e caixotes junto de quatro casas, feno perto do estábulo */
  for (const [v, x, y] of [[2, 22, 16], [4, 14, 14], [4, 21, 21], [5, 17, 27], [0, 9, 11], [1, 28, 11], [1, 9, 23], [0, 28, 24], [6, 27, 25]] as [number, number, number][]) { const gx = x + OX, gy = y + OY; if (inb(gx, gy) && (map[gy][gx] === 'grass' || map[gy][gx] === 'plaza' || (v === 5 && map[gy][gx] === 'road')) && !props.some((q) => q.gx === gx && q.gy === gy)) props.push({ kind: 'vprop', gx, gy, w: 1, h: 1, height: 1, wall: 0, roof: 0, variant: v }); }
  const quartel = { x: QX + 4, y: QY + 5, dummies: [[1.6, 4.2], [1.6, 5.9], [4.4, 5.3], [4.3, 6.7]].map(([x, y]) => ({ x: QX + x, y: QY + y })) }; pois.push({ name: 'Quartel de Karmika', x: QX + 4, y: QY + 7, biome: 'meadow' });

  /* ---------- assentamentos: Karmika (centro), vilas de madeira e Askavik (cidade média de madeira e pedra) ---------- */
  const settlements: Settlement[] = [{ name: 'Karmika', kind: 'village', x: CITY_L.x, y: CITY_L.y + 3, radius: 22, npcs: [] }];
  const nearSettle = (x: number, y: number, margin: number) => settlements.some((st) => Math.hypot(x - st.x, y - st.y) < st.radius + margin);
  const FIRST = ['Astrid', 'Bjarni', 'Dagny', 'Einar', 'Freya', 'Gudrun', 'Halvar', 'Ingvar', 'Jorunn', 'Kjell', 'Liv', 'Magnus', 'Nanna', 'Orvar', 'Ragna', 'Sten', 'Tove', 'Ulrik', 'Vigdis', 'Yngve', 'Brokk', 'Dvalin', 'Eitri', 'Nori', 'Thrain'];
  // nomes por região: nórdicos só na neve; nas terras comuns, nomes de gente comum (humanos); nas florestas, élficos
  const HUMAN = ['Aldo', 'Beatriz', 'Tomé', 'Inês', 'Duarte', 'Leonor', 'Brás', 'Catarina', 'Gaspar', 'Joana', 'Matias', 'Cecília', 'Rui', 'Helena', 'Vasco', 'Marta', 'Simão', 'Clara', 'Bento', 'Luísa', 'Estêvão', 'Teresa', 'Afonso', 'Mafalda', 'Dinis', 'Violante', 'Nuno', 'Branca', 'Lopo', 'Guiomar'];
  const ELF = ['Elyndra', 'Faelar', 'Sylwen', 'Thalion', 'Aerin', 'Caelum', 'Nimue', 'Lorien', 'Vaelis', 'Ithil', 'Serethiel', 'Aradan', 'Lúmina', 'Fenwë', 'Oriel'];
  const nameOf = (rr: () => number, cx = CITY_L.x, cy = CITY_L.y) => { const z = zoneW_L(cx, cy); if (z.snow > 0.5) return FIRST[Math.floor(rr() * FIRST.length)]; if (z.forest > 0.45 && rr() < 0.5) return ELF[Math.floor(rr() * ELF.length)]; return HUMAN[Math.floor(rr() * HUMAN.length)]; };
  const decorAt = (kind: PropKind, gx: number, gy: number, w: number, h: number, variant: number, wall: number, roof: number) => { if (inb(gx, gy) && inb(gx + w - 1, gy + h - 1) && map[gy][gx] !== 'water') props.push({ kind, gx, gy, w, h, height: 1, wall, roof, variant }); };
  const flatten = (cx: number, cy: number, radTiles: number) => { const h = groundH_L(cx * T, cy * T); pads.push({ x: cx * T, z: cy * T, r: radTiles * T, h }); };
  const clearWater = (cx: number, cy: number, rad: number) => { for (let y = cy - rad; y <= cy + rad; y++) for (let x = cx - rad; x <= cx + rad; x++) if (inb(x, y) && Math.hypot(x - cx, y - cy) <= rad && map[y][x] === 'water') map[y][x] = 'grass'; };

  /** vila de madeira: casas em torno de um poço, barracas, tochas; NPCs genéricos com comércio básico */
  /* cada povo constrói do seu jeito (Erling, 23/10: "todas as vilas são extremamente parecidas" — pense em WoW, GW2, Diablo 2):
     0 vale (casas de enxaimel) · 1 nórdico · 2 anão · 3 élfico · 4 sombrio · 5 tribal · 6 pacto · 7 vapor */
  const CULT: Record<string, number> = { Jarlsheim: 1, Skjoldvik: 1, Hrimgard: 1, Nordvik: 1, 'Fjallbrún': 1, Kaldrfoss: 1, 'Hvítadalr': 1, Bjarnholt: 1, Ulfheim: 1, 'Mýrarvik': 1, Midvangr: 1, 'Hrafnhöfn': 1,
    Brasaforja: 2, Cinzalto: 2, Lithendel: 3, Lumenhal: 3, Corvoscuro: 4, 'Uivo Antigo': 5, Gorvath: 6, Vaporeira: 7, 'Porto Caldeira': 7, Ferrugem: 7 };
  /** o marco do mestre de cada caminho (fica logo ao norte da vila, ligado por estrada) */
  /* (os monumentos de cada região moram em monuments3d/world mais abaixo; o antigo mapa LANDMARK_AT ficava sempre vazio e foi removido) */
  const landmarkDoor: Record<string, { x: number; y: number }> = {};
  /* 08/11 BRASAFORJA, a primeira cidade dos anões (Erling: "a cidade dos anões está muito menor que Karmika; aumentar, puxar para fora, MUITO mais
     elementos, mais NPCs, mais gente morando, lojas; piso bem colocado, madeira sob as lojas e recorte de madeira em volta; anões cuidam das suas cidades,
     nada de ruína; poço à vista; primeira cidade dos anões tem que ser bonita").
     Planta: praça de laje maciça em volta da fonte e da fogueira; a Rua das Forjas ao norte (lojas viradas para a praça) e a Rua do Cobre a oeste;
     anel de casas de tijolo e vigas; quatro saídas (norte = o Grande Salão); tablados de madeira sob as lojas; postes, barris, caixas, feno,
     carrinhos, bigornas e bancos por toda parte; o povo anão trabalhando e morando. O muro de pedra e os portões vêm da passada geral de muros. */
  const brasaforja = (st: Settlement, rr: () => number, lore: string) => {
    const cx = st.x, cy = st.y, R0 = 19; st.radius = R0; clearWater(cx, cy, R0 + 4); flatten(cx, cy, R0 + 6);
    for (let i = props.length - 1; i >= 0; i--) { const q = props[i]; if (Math.hypot(q.gx - cx, q.gy - cy) < R0 + 6 && q.kind !== 'fountain') props.splice(i, 1); } /* o terreno começa limpo */
    const inTown = (x: number, y: number) => { const dx = x - cx, dy = y - cy, a = Math.atan2(dy, dx); return Math.hypot(dx, dy * 1.12) < 16.5 + 1.4 * Math.sin(a * 3 + 0.8) + 0.9 * Math.sin(a * 7 + 2.3); };
    /* o piso: laje de pedra inteira, sem remendo de terra (o chão de cultura dos anões pinta a laje assentada por cima) */
    for (let y = cy - 20; y <= cy + 20; y++) for (let x = cx - 20; x <= cx + 20; x++) if (inb(x, y) && inTown(x, y) && map[y][x] !== 'water') map[y][x] = 'plaza';
    /* quatro saídas: ramais de estrada para fora (viram portões no muro); ao norte, a avenida do Grande Salão */
    for (const [ux, uy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as [number, number][]) for (let d = 1; d <= R0 + 10; d++) for (const o of [-1, 0, 1]) { const x = cx + ux * d + uy * o, y = cy + uy * d + ux * o; if (!inb(x, y) || map[y][x] === 'water' || map[y][x] === 'wall') continue; if (!inTown(x, y) || map[y][x] !== 'plaza') map[y][x] = 'road'; }
    props.push({ kind: 'fountain', gx: cx - 1, gy: cy - 1, w: 2, h: 2, height: 0.7, wall: 0x6a5e52, roof: 0xff9a40, variant: 1 });
    props.push({ kind: 'campfire', gx: cx - 3, gy: cy + 3, w: 1, h: 1, height: 0.6, wall: 0x4a4a4a, roof: 0xff8a2a });
    const W2 = [0x8a5a44, 0x7a5240, 0x6a5e52], R2 = [0x4a423a, 0x3e3a36, 0x55504a];
    const free = (gx: number, gy: number, w: number, h: number) => { if ((gx - 1 <= cx + 1 && gx + w >= cx - 1) || (gy - 1 <= cy + 1 && gy + h >= cy - 1)) return false; /* 08/11 (Erling: "essa casa está atrapalhando a entrada"): nada em cima dos eixos das quatro saídas */ for (let y = gy - 1; y <= gy + h; y++) for (let x = gx - 1; x <= gx + w; x++) { if (!inb(x, y)) return false; const t = map[y][x]; if (t === 'wall' || t === 'water') return false; if (!(y < gy || y >= gy + h || x < gx || x >= gx + w) && t === 'road') return false; } return !props.some((q) => q.kind !== 'bfloor' && q.gx < gx + w + 1 && q.gx + q.w > gx - 1 && q.gy < gy + h + 1 && q.gy + q.h > gy - 1); };
    let nh = 0; const house = (gx: number, gy: number, w: number, h: number, rot: number, variant: number, shop?: string) => { if (!free(gx, gy, w, h)) return false;
      block({ kind: 'house', gx, gy, w, h, height: 3.2, wall: W2[nh % 3], roof: R2[nh % 3], variant, rot, style: 2, ...(shop ? { shop } : {}) }); nh++;
      /* tablado de madeira na frente das lojas e recorte de madeira em volta (bfloor é o assoalho de tábuas) */
      if (shop) { const fx = rot === 1 ? gx + w : gx, fy = rot === 1 ? gy : gy + h, fw = rot === 1 ? 2 : w, fh = rot === 1 ? h : 2; for (let y = fy; y < fy + fh; y++) for (let x = fx; x < fx + fw; x++) if (inb(x, y) && map[y][x] === 'plaza') props.push({ kind: 'bfloor', gx: x, gy: y, w: 1, h: 1, height: 0.1, wall: 0x6a4a2c, roof: 0, variant: 2 }); }
      return true; };
    /* a Rua das Forjas (norte da praça, fachadas para o sul) e a Rua do Cobre (oeste, fachadas para o leste): as lojas */
    const SHOPS: [number, number, number, number, number, number, string][] = [[cx - 17, cy - 11, 5, 4, 0, 5, 'armeiro'], [cx - 11, cy - 11, 4, 4, 0, 2, 'armaduras'], [cx - 6, cy - 11, 4, 4, 0, 1, 'mercador'], [cx + 3, cy - 11, 8, 5, 0, 4, 'cervejaria'], [cx - 15, cy - 6, 4, 4, 1, 1, 'pocoes'], [cx - 15, cy + 3, 4, 5, 1, 2, 'honra_anao']];
    for (const [gx, gy, w, h, rot, v, key] of SHOPS) house(gx, gy, w, h, rot, v, key);
    /* o anel de casas (moradias): duas fileiras, mais apertadas que as outras vilas — anão mora junto */
    const ring: [number, number, number, number, number][] = [[cx + 12, cy - 6, 5, 4, 1], [cx + 12, cy + 3, 4, 4, 1], [cx + 12, cy + 7, 5, 4, 0], [cx + 5, cy + 8, 4, 4, 0], [cx + 3, cy + 9, 5, 4, 0], [cx - 8, cy + 8, 4, 4, 0], [cx - 14, cy + 7, 5, 4, 0], [cx - 22, cy - 12, 4, 4, 1], [cx + 12, cy - 11, 4, 4, 0], [cx + 16, cy - 7, 4, 4, 1], [cx + 16, cy + 3, 4, 5, 1], [cx - 20, cy - 7, 4, 4, 1], [cx - 20, cy + 3, 4, 4, 1], [cx + 3, cy + 15, 5, 4, 0], [cx - 7, cy + 13, 4, 4, 0], [cx + 9, cy + 13, 4, 4, 0]];
    ring.forEach(([gx, gy, w, h, rot], k) => house(gx, gy, w, h, rot, [0, 2, 1, 3, 2, 0][k % 6]));
    /* decoração: o que diz "aqui se vive e se trabalha" */
    const vp = (variant: number, x: number, y: number, ry = 0) => { if (inb(x, y) && (map[y][x] === 'plaza' || map[y][x] === 'grass') && !props.some((q) => q.gx <= x && q.gx + q.w > x && q.gy <= y && q.gy + q.h > y)) props.push({ kind: 'vprop', gx: x, gy: y, w: 1, h: 1, height: 1, wall: 0, roof: 0, variant, ry }); };
    vp(2, cx + 5, cy + 4); /* o poço, à vista, na praça */
    for (const [x, y] of [[cx - 5, cy - 5], [cx + 4, cy - 5], [cx - 5, cy + 5], [cx + 4, cy + 6], [cx - 10, cy - 7], [cx + 1, cy - 7], [cx + 8, cy - 7], [cx - 11, cy - 1], [cx - 11, cy + 4], [cx + 8, cy + 10], [cx - 4, cy + 11], [cx - 11, cy + 10], [cx + 13, cy + 4], [cx + 8, cy - 2]]) vp(4, x, y);
    for (const [x, y] of [[cx - 13, cy - 6], [cx - 7, cy - 6], [cx + 3, cy - 6], [cx + 9, cy - 6], [cx - 10, cy + 6], [cx + 10, cy + 6], [cx - 12, cy + 2], [cx + 13, cy - 7]]) vp([0, 1, 7, 9, 6, 0, 1, 8][(x + y) % 8], x, y, rr() * 6.283);
    for (const [x, y] of [[cx + 6, cy - 3], [cx - 6, cy + 1], [cx + 3, cy + 7], [cx - 3, cy - 7], [cx + 10, cy + 2], [cx - 12, cy - 9]]) vp(0, x, y, rr() * 6.283);
    for (const [x, y] of [[cx - 7, cy - 1], [cx + 7, cy + 1], [cx - 2, cy + 7]]) vp(9, x, y, rr() * 6.283); /* bigornas no toco: cidade de forjadores */
    vp(5, cx + 1, cy + R0 - 2); vp(5, cx + R0 - 3, cy + 1); vp(5, cx - R0 + 2, cy - 1);
    for (const [x, y, v] of [[cx + 2, cy + 3, 0], [cx - 3, cy - 3, 1], [cx + 3, cy - 3, 0], [cx - 4, cy + 2, 1], [cx + 7, cy + 5, 0], [cx - 8, cy + 4, 1]] as [number, number, number][]) decorAt('bench', x, y, 1, 1, v, 0x6a4528, 0x4a423a);
    for (const [tx, ty] of [[cx - 3, cy - 3], [cx + 3, cy + 3], [cx - 3, cy + 3], [cx + 3, cy - 3], [cx, cy - 9], [cx - 9, cy], [cx, cy + 9], [cx + 9, cy]]) if (inb(tx, ty) && map[ty][tx] === 'plaza' && !props.some((q) => q.gx === tx && q.gy === ty)) props.push({ kind: 'torch', gx: tx, gy: ty, w: 1, h: 1, height: 2.0, wall: 0x3a2a1c, roof: 0xff8a2a });
    decorAt('chest', cx + 15, cy + 6, 1, 1, 2, 0x6a4528, 0x8a3b2e);
    pois.push({ name: st.name, x: cx, y: cy, biome: biomeAt_L(cx, cy) });
    /* o povo: anões de verdade (o modelo vestido), cada um no seu canto */
    const D = (name: string, role: string, x: number, y: number, radius: number, tint: number, lines: string[], shop?: string) => st.npcs.push({ name, role, kind: 'dwarf', x, y, radius, tint, scale: 0.98, lines, ...(shop ? { shop } : {}) });
    D('Armeiro Grimnir Punho-de-Aço', 'Armeiro de Brasaforja', cx - 14.5, cy - 6.2, 1.2, 0x6a3a2a, ['Machado anão não quebra. Quem quebra é o braço de quem segura errado.', 'Aço da Montanha Negra, cabo de carvalho do Sopé. Não existe melhor.'], 'armeiro');
    D('Armadureira Sigrún Couraça', 'Armaduras de Brasaforja', cx - 9, cy - 6.2, 1.2, 0x4a4a5a, ['Placa boa é a que você esquece que está vestindo.', 'Couro para quem corre, aço para quem fica.'], 'armaduras');
    D('Mercadora Dísa Bolso-Fundo', 'Mercadora de Brasaforja', cx - 4, cy - 6.2, 1.2, 0xb08a40, ['Pão, corda, tocha e poção. O que a montanha não dá, eu trago de carroça.', 'Preço justo. Anão não rouba anão. Humano… a gente conversa.'], 'mercador');
    D('Taverneiro Orik Barril-Cheio', 'A Bigorna Molhada', cx + 7, cy - 5.2, 1.4, 0x8a3a3a, ['Cerveja preta, hidromel e a sopa que o Rei elogiou. Senta.', 'Quem bebe duas, canta. Quem bebe quatro, dorme no estábulo.'], 'cervejaria');
    D('Alquimista Vígdís Caldeirão', 'Poções de Brasaforja', cx - 10.4, cy - 4, 1.2, 0x3a6a4a, ['Poção vermelha fecha ferida. Poção azul acende a Brasa. Não misture.', 'Musgo da caverna, cinza do vulcão. A montanha é a minha despensa.'], 'pocoes');
    D('Thrúd Marca-de-Ferro', 'Guardiã da Honra Kármica', cx - 10.4, cy + 5.5, 1.2, 0xc0a040, ['Honra não se compra com ouro. Ganha-se fazendo o que precisa ser feito.', 'Traga a sua honra e eu mostro o que os anões guardam para quem merece.'], 'honra_anao');
    D('Mineiro Bofur Pó-de-Pedra', 'Mineiro', cx + 6, cy + 3, 2.5, 0x5a4a3a, ['Hoje a veia cantou. Amanhã ela cobra.', 'Pedra boa é pesada. Pedra ruim é mais pesada ainda.']);
    D('Mineira Hildr Veia-Funda', 'Mineira', cx - 4, cy + 6, 2.5, 0x6a4a3a, ['Lá embaixo não tem dia nem noite. Só o martelo e a respiração.', 'Encontrei prata ontem. O Thane já sabe. Todo mundo já sabe.']);
    D('Aprendiz Snorri Fagulha', 'Aprendiz de Forja', cx - 7, cy - 3, 2.5, 0x8a5a2a, ['O Mestre Brokki disse que eu queimo mais carvão do que ferro. Ele tem razão.', 'Um dia eu forjo um martelo digno do Rei. Um dia.']);
    D('Cervejeira Gudrún Espuma', 'Cervejeira', cx + 9, cy - 3, 2, 0xa06a3a, ['A cevada da encosta dá a melhor espuma do continente. Pergunta para qualquer um.', 'Cerveja quente é crime. Em Brasaforja a gente leva isso a sério.']);
    D('Anciã Frída Canta-Pedra', 'Guardiã das Histórias', cx + 2, cy + 5, 1.5, 0x8a8a9a, [lore, 'Antes do Grande Salão havia só a caverna. Antes da caverna, só o fogo.', 'Os humanos chamam de Montanha Negra. Nós chamamos de Mãe.']);
    D('Pequeno Dori', 'Criança de Brasaforja', cx + 4, cy + 1, 3, 0xd0a060, ['Quando eu crescer vou ser forjador que nem o Brokki!', 'Você já viu o Rei? Ele tem uma barba até o chão!']);
    D('Carregador Nori Costas-Largas', 'Carregador', cx - 2, cy - 4, 3, 0x6a5a4a, ['Caixa vai, caixa vem. A carroça dos anões não espera ninguém.', 'Esse barril pesa como um anão bêbado. Ou seja, muito.']);
    D('Guarda Hreidmar Olho-de-Ferro', 'Guarda da Praça', cx + 3, cy - 1.5, 2, 0x5a6a8a, ['Na praça, arma guardada. Isso vale para você também.', 'Brasaforja não cai. Nunca caiu. Não vai ser hoje.']);
  };
  /* 08/11 LITHENDEL, a vila dos elfos (Erling: "ver cada vila de começo de perto e corrigir o que estiver feio"). A Árvore-Mãe viva no meio,
     com plataformas e lanternas; clareira de pedra musgosa em volta; casas redondas de madeira clara com telhado de folhas em anéis ao redor;
     a Fonte da Visão, canteiros de flores por toda parte, lanternas, bancos; elfos morando e trabalhando. Sem muro: a floresta é o muro. */
  const lithendel = (st: Settlement, rr: () => number, lore: string) => {
    const cx = st.x, cy = st.y, R0 = 16; st.radius = R0; clearWater(cx, cy, R0 + 3); flatten(cx, cy, R0 + 4);
    for (let i = props.length - 1; i >= 0; i--) { const q = props[i]; if (Math.hypot(q.gx - cx, q.gy - cy) < R0 + 4 && q.kind !== 'fountain') props.splice(i, 1); }
    /* a clareira: laje musgosa no centro e caminhos em estrela até as casas; o resto fica capim (a cultura élfica pinta o chão) */
    const inClear = (x: number, y: number) => { const a = Math.atan2(y - cy, x - cx); return Math.hypot(x - cx, y - cy) < 7.5 + 1.2 * Math.sin(a * 5 + 1); };
    for (let y = cy - 9; y <= cy + 9; y++) for (let x = cx - 9; x <= cx + 9; x++) if (inb(x, y) && inClear(x, y) && map[y][x] !== 'water') map[y][x] = 'plaza';
    for (let y = cy - R0 - 2; y <= cy + R0 + 2; y++) for (let x = cx - R0 - 2; x <= cx + R0 + 2; x++) if (inb(x, y) && map[y][x] === 'tree' && Math.hypot(x - cx, y - cy) < R0) map[y][x] = 'grass';
    for (const [ux, uy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as [number, number][]) for (let d = 1; d <= R0 + 8; d++) for (const o of [0]) { const x = cx + ux * d + uy * o, y = cy + uy * d + ux * o; if (!inb(x, y) || map[y][x] === 'water' || map[y][x] === 'wall') continue; if (map[y][x] !== 'plaza') map[y][x] = 'road'; }
    /* a Árvore-Mãe */
    block({ kind: 'monument', gx: cx - 4, gy: cy - 4, w: 9, h: 9, height: 36, wall: 0, roof: 0, variant: 11 });
    for (let y = cy - 4; y <= cy + 4; y++) for (let x = cx - 4; x <= cx + 4; x++) if (inb(x, y) && Math.hypot(x - cx, y - cy) > 2.6) map[y][x] = 'plaza'; /* só o tronco bloqueia; a Passagem da Raiz fica ao sul */
    /* 09/11 (Erling: "uma corrente de água que vem de cima, desce pelo meio da cidade com passarelas bonitas, alimenta a árvore e segue para o outro lado"):
       o Riacho da Árvore-Mãe — nasce ao norte, desce em curva pelo lado leste do tronco (um olho d'água junto das raízes) e sai ao sul */
    const brookX = (y: number) => cx + 4.5 + 1.5 * Math.sin((y - cy) * 0.4);
    for (let y = cy - R0 - 8; y <= cy + R0 + 8; y++) { const bx = brookX(y), wide = Math.abs(y - cy) < 3 ? 2 : 1; for (let x = Math.floor(bx) - (wide - 1); x <= Math.floor(bx) + 1; x++) if (inb(x, y) && Math.hypot(x - cx, y - cy) > 2.6) map[y][x] = 'water'; }
    for (const by of [cy, cy - 7, cy + 7]) bridges.push({ ax: Math.floor(brookX(by)) - 2 + 0.5, ay: by + 0.5, bx: Math.floor(brookX(by)) + 3 + 0.5, by: by + 0.5, hA: 0, hB: 0, half: 1.3, hump: 0.35 }); /* as passarelas */
    for (const by of [cy - 7, cy + 7]) for (let x = Math.floor(brookX(by)) - 3; x <= Math.floor(brookX(by)) + 4; x++) if (inb(x, by) && map[by][x] !== 'water' && map[by][x] !== 'wall') map[by][x] = 'plaza';
    props.push({ kind: 'fountain', gx: cx - 7, gy: cy + 4, w: 2, h: 2, height: 0.7, wall: 0x8a9a80, roof: 0x9ad8ff, variant: 1 });
    const free = (gx: number, gy: number, w: number, h: number) => { if ((gx - 1 <= cx && gx + w >= cx) || (gy - 1 <= cy && gy + h >= cy)) return false; for (let y = gy - 1; y <= gy + h; y++) for (let x = gx - 1; x <= gx + w; x++) { if (!inb(x, y)) return false; const t = map[y][x]; if (t === 'wall' || t === 'water') return false; } return !props.some((q) => q.kind !== 'herb' && q.gx < gx + w + 1 && q.gx + q.w > gx - 1 && q.gy < gy + h + 1 && q.gy + q.h > gy - 1); };
    let nh = 0; const house = (gx: number, gy: number, w: number, h: number, rot: number, variant: number, shop?: string) => { if (!free(gx, gy, w, h)) return false; block({ kind: 'house', gx, gy, w, h, height: 3.2, wall: 0xd8cfb0, roof: [0x6fa66a, 0xa8c060, 0x5a9a6a][nh % 3], variant, rot, style: 3, ...(shop ? { shop } : {}) }); nh++; return true; };
    /* as casas em anel (redondas: w = h); as lojas viradas para a clareira */
    const H: [number, number, number, number, number, string?][] = [[cx - 14, cy - 11, 4, 4, 0, 'armeiro'], [cx - 8, cy - 11, 4, 4, 0, 'mercador'], [cx + 13, cy - 5, 4, 4, 1, 'pocoes'], [cx + 8, cy - 11, 5, 5, 0, 'taverna'], [cx - 13, cy - 4, 4, 4, 1], [cx - 13, cy + 3, 4, 4, 1], [cx + 13, cy + 2, 4, 4, 1], [cx + 9, cy + 7, 4, 4, 0], [cx - 9, cy + 9, 4, 4, 0], [cx - 3, cy + 11, 4, 4, 0], [cx + 3, cy + 11, 4, 4, 0], [cx + 9, cy + 9, 4, 4, 0], [cx - 16, cy - 9, 4, 4, 1], [cx + 15, cy - 9, 4, 4, 1], [cx - 15, cy + 9, 4, 4, 1], [cx + 15, cy + 8, 4, 4, 1]];
    H.forEach(([gx, gy, w, h, rot, shop], k) => house(gx, gy, w, h, rot, shop === 'taverna' ? 4 : [0, 1, 2][k % 3], shop));
    /* canteiros de flores, lanternas e bancos */
    const flowerAt = (x: number, y: number) => { if (inb(x, y) && (map[y][x] === 'grass' || map[y][x] === 'plaza') && !props.some((q) => q.gx <= x && q.gx + q.w > x && q.gy <= y && q.gy + q.h > y)) props.push({ kind: 'herb', gx: x, gy: y, w: 1, h: 1, height: 0.5, wall: 0, roof: 0, variant: 4 }); };
    for (let k = 0; k < 28; k++) { const a = k / 28 * 6.283, r = 8.5 + (k % 3) * 0.8; flowerAt(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r)); }
    for (let k = 0; k < 20; k++) { const a = rr() * 6.283, r = 10 + rr() * 6; flowerAt(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r)); }
    for (const [x, y] of [[cx - 5, cy - 5], [cx + 5, cy - 5], [cx - 5, cy + 5], [cx + 7, cy + 7], [cx - 10, cy - 7], [cx + 8, cy - 7], [cx - 10, cy + 6], [cx + 1, cy - 8], [cx - 8, cy + 1], [cx + 8, cy + 1], [cx + 1, cy + 8]]) if (inb(x, y) && map[y][x] !== 'wall' && !props.some((q) => q.gx <= x && q.gx + q.w > x && q.gy <= y && q.gy + q.h > y)) props.push({ kind: 'torch', gx: x, gy: y, w: 1, h: 1, height: 2.0, wall: 0x9a7a52, roof: 0x9ad8ff });
    for (const [x, y, v] of [[cx + 3, cy + 2, 0], [cx - 4, cy - 2, 1], [cx - 2, cy + 4, 0], [cx + 2, cy - 4, 1]] as [number, number, number][]) decorAt('bench', x, y, 1, 1, v, 0x9a7a52, 0x8a9a80);
    vpAt(0, cx - 7, cy + 3); vpAt(1, cx + 7, cy - 2); vpAt(6, cx - 8, cy - 4); vpAt(7, cx + 6, cy + 9);
    vpAt(5, cx + 1, cy + R0 - 1); vpAt(5, cx + R0 - 2, cy + 1); vpAt(5, cx - R0 + 1, cy - 1);
    pois.push({ name: st.name, x: cx, y: cy, biome: biomeAt_L(cx, cy) });
    const E = (name: string, role: string, x: number, y: number, radius: number, tint: number, lines: string[], shop?: string) => st.npcs.push({ name, role, kind: 'nordic', x, y, radius, tint, scale: 1.02, lines, ...(shop ? { shop } : {}) });
    E('Arqueira Lindoriel', 'Arcos de Lithendel · élfica', cx - 11.5, cy - 6.2, 1.2, 0x5a8a5a, ['Um arco de teixo dura mais que quem o puxa.', 'Flecha que erra ensina. A segunda não erra.'], 'armeiro');
    E('Mercador Thalion', 'Mercador de Lithendel · élfico', cx - 5.5, cy - 6.2, 1.2, 0x8a9a60, ['Pão de bolota, corda de vime, lamparinas de seiva. O que a floresta dá.', 'Ouro é frio. Mas aceito.'], 'mercador');
    E('Herborista Nimloth', 'Ervas de Lithendel · élfica', cx + 11.6, cy - 2.5, 1.2, 0x4a7a6a, ['Orvalho da manhã, casca de bétula, flor da lua. Nada que a terra não devolva.', 'Poção verde para o fôlego. Poção azul para a mente.'], 'pocoes');
    E('Taverneira Elenwë', 'A Folha Dourada · élfica', cx + 10.5, cy - 5.2, 1.4, 0xa0a050, ['Hidromel de flor de tília e pão quente. Sente-se sob as folhas.', 'Aqui ninguém levanta a voz. As árvores escutam.'], 'cervejaria');
    E('Guardiã Sílwen', 'Guardiã da Árvore-Mãe · élfica', cx + 2.5, cy - 3.5, 1.5, 0x3a6a4a, ['A Árvore-Mãe tem mil anos. As plataformas, trezentos. Pise devagar.', 'À noite as lanternas acendem sozinhas. Ninguém sabe quem as acende.']);
    E('Jardineiro Caranthir', 'Jardineiro de Lithendel · élfico', cx - 6, cy + 3, 2.5, 0x6a9a5a, ['Cada flor daqui foi plantada por alguém que já não está. Eu só rego.', 'Não pise nos canteiros. Eles lembram.']);
    E('Aprendiz Míriel', 'Aprendiz de Arqueira · élfica', cx + 6, cy + 1, 2.5, 0x7a9a7a, ['Acertei a maçã hoje. Da terceira vez, mas acertei.', 'A Lindoriel diz que o segredo é respirar. Eu esqueço de respirar.']);
    E('Cantor Eärendil', 'Cantor de Lithendel · élfico', cx - 2, cy + 6, 2, 0x9ab0c0, [lore, 'As canções mais antigas não têm palavras. Só o vento sabe cantá-las.']);
    E('Pequena Lúthien', 'Criança élfica', cx + 3, cy + 6, 3, 0xd0c0a0, ['Você viu o cervo branco? Ele passou aqui ontem!', 'Quando eu crescer vou subir até o topo da Árvore-Mãe.']);
    E('Aerin', 'Jovem Caçadora de Lithendel · élfica', cx - 3, cy + 4.5, 1.5, 0x6a8a5a, ['Pés leves, flecha certa. É assim que se começa.', 'Os javalis andam perto demais da clareira. Alguém precisa lembrá-los do medo.']); /* 09/11: a primeira missão do Caminho da Mata (e01) é dela */
    E('Vigia Galdor', 'Vigia de Lithendel · élfico', cx - 1, cy - 9, 2.5, 0x4a6a5a, ['Os esqueletos do Campo Santo não sobem até aqui. Mas tentam.', 'Floresta quieta demais é floresta com alguma coisa dentro.']);
  };
  const vpAt = (variant: number, x: number, y: number, ry = 0) => { if (inb(x, y) && (map[y][x] === 'plaza' || map[y][x] === 'grass') && !props.some((q) => q.gx <= x && q.gx + q.w > x && q.gy <= y && q.gy + q.h > y)) props.push({ kind: 'vprop', gx: x, gy: y, w: 1, h: 1, height: 1, wall: 0, roof: 0, variant, ry }); };
  const village = (name: string, cx: number, cy: number, seed: number, lore: string) => {
    const cult = CULT[name] ?? 0;
    const rr = rng(seed); const R0 = 13; clearWater(cx, cy, R0 + 2); flatten(cx, cy, R0 + 4);
    const st: Settlement = { name, kind: 'village', x: cx, y: cy, radius: R0, npcs: [], cult }; settlements.push(st);
    if (name === 'Brasaforja') { brasaforja(st, rr, lore); return st; } /* 08/11: a cidade dos anões tem planta própria (abaixo) */
    if (name === 'Lithendel') { lithendel(st, rr, lore); return st; } /* 08/11: a vila dos elfos também */
    for (let y = cy - 2; y <= cy + 2; y++) for (let x = cx - 2; x <= cx + 2; x++) if (inb(x, y)) map[y][x] = 'plaza';
    for (let y = cy - R0; y <= cy + R0; y++) for (let x = cx - R0; x <= cx + R0; x++) if (inb(x, y) && map[y][x] === 'grass' && (Math.abs(x - cx) <= 1 || Math.abs(y - cy) <= 1)) map[y][x] = 'road';
    /* 25/10: toda vila tem a sua fonte no centro da praça — o marco da vila e a sua Fonte da Visão; os povos do fogo mantêm a fogueira ao lado */
    props.push({ kind: 'fountain', gx: cx - 1, gy: cy - 1, w: 2, h: 2, height: 0.7, wall: cult === 3 ? 0xd8d0bc : cult === 7 ? 0x8a4a3a : cult === 2 ? 0x6a5e52 : cult === 4 || cult === 6 ? 0x3e3a40 : cult === 1 ? 0x7a746a : cult === 5 ? 0x6a5a48 : 0x6a5a48, roof: cult === 3 ? 0x9ae0ff : cult === 4 ? 0x5a8ab0 : cult === 6 ? 0x8a6ac8 : 0x6fc7ff, variant: 1 });
    if (!(cult === 0 || cult === 3 || cult === 7)) { props.push({ kind: 'campfire', gx: cx - 2, gy: cy + 2, w: 1, h: 1, height: 0.6, wall: 0x4a4a4a, roof: cult === 6 ? 0xb06aff : cult === 4 ? 0xff3a2a : 0xff8a2a }); // fogueira no centro (nórdicos, anões, sombrios, Uivo, pacto)
      /* 02/11 (Erling: "que torres são essas com um negócio no meio?"): os dois totens de pedra colados na fonte da praça saíram — a fonte é o marco da vila, sozinha */ }
    const PAL: [number[], number[]][] = [[[0xb99a6b, 0xc2a679, 0xa88a60], [0x8a3b2e, 0x7a4a2a, 0x6d3a28, 0x5d6b3a]], [[0x4a3220], [0x5a6a34]], [[0x6a5e52], [0x4a423a]], [[0xe8e0cc], [0x3a7a5a]], [[0x3e3a40], [0x2a2228]], [[0x5a4030], [0x8a7440]], [[0x3a2e3a], [0x2a1a30]], [[0x8a4a3a], [0x4a4e56]]];
    const nH = 6 + Math.floor(rr() * 3) + (cult === 1 || cult === 5 ? -1 : 0), WALLS = PAL[cult][0], ROOFS = PAL[cult][1]; /* 08/11 (Erling: "mais gente morando"): 6–8 casas por vila (eram 4–6) */
    const hs: { gx: number; gy: number; w: number; h: number }[] = [];
    for (let k = 0; k < nH; k++) {
      const a = ((k + 0.5) / nH) * 6.283 + (rr() - 0.5) * 0.3; const w = cult === 1 ? 6 : cult === 3 || cult === 5 ? 4 : 4 + Math.floor(rr() * 2), h = cult === 4 ? 3 : 4; // nórdicos: salões compridos; élficos e tribais: redondos
      let gx = 0, gy = 0, ok = false;
      for (const d of [7.5 + rr() * 2, 10, 12, 14]) {
        gx = Math.round(cx + Math.cos(a) * d) - Math.floor(w / 2); gy = Math.round(cy + Math.sin(a) * d) - 2; ok = true;
        for (let y = gy - 1; y < gy + h + 1 && ok; y++) for (let x = gx - 1; x < gx + w + 1; x++) { if (!inb(x, y)) { ok = false; break; } const tt = map[y][x], edge = y < gy || y >= gy + h || x < gx || x >= gx + w; if (tt !== 'grass' && !(edge && tt === 'road')) { ok = false; break; } }
        if (ok) break;
      }
      if (!ok) continue;
      block({ kind: 'house', gx, gy, w, h, height: 3, wall: WALLS[k % WALLS.length], roof: ROOFS[k % ROOFS.length], variant: [0, 2, 1, 0, 2, 4][k % 6], ...(cult ? { style: cult } : {}) }); hs.push({ gx, gy, w, h });
      // caminho da porta até a praça
      const dx = gx + Math.floor(w / 2), dy = gy + h; for (let y = dy; y !== cy; y += Math.sign(cy - dy)) if (inb(dx, y) && map[y][dx] === 'grass') map[y][dx] = 'road';
    }
    decorAt('stall', cx + 3, cy - 4, 2, 2, 0, 0x7a5a38, 0x8a3b2e); decorAt('stall', cx - 5, cy + 3, 2, 2, 0, 0x6a4a2c, 0x5d6b3a);
    /* props da prancha 59 (01/11), poucos por vila: um poço numa esquina da praça, um poste de lanterna junto da barraca, uma placa na saída,
       e ao lado de metade das casas um barril, caixotes, feno, cocho ou carroça de mão (quem passa lê que ali se vive) */
    const vp = (variant: number, x: number, y: number, ry = 0) => { if (inb(x, y) && (map[y][x] === 'grass' || map[y][x] === 'plaza' || (variant === 5 && map[y][x] === 'road')) && !props.some((q) => q.gx === x && q.gy === y)) props.push({ kind: 'vprop', gx: x, gy: y, w: 1, h: 1, height: 1, wall: 0, roof: 0, variant, ry }); };
    vp(2, cx + 3, cy + 3); vp(4, cx + 5, cy - 4); vp(5, cx + 1, cy + R0 - 1); vp(4, cx - 6, cy + 2);
    /* 08/11 (Erling: "todas as vilas com atrativos e decoração; postes, barris, caixas, feno, carroças de mão, bigornas"): cada casa ganha algo ao lado
       (antes era metade), e a praça ganha mais quatro postes, uma carroça de mão e feno */
    hs.forEach((hh, i) => { vp([0, 1, 6, 8, 7, 0, 1, 9][i % 8], hh.gx + hh.w, hh.gy + hh.h - 1, rr() * 6.283); if (rr() < 0.5) vp([1, 0, 6][i % 3], hh.gx - 1, hh.gy + hh.h - 1, rr() * 6.283); });
    vp(4, cx - 5, cy - 4); vp(4, cx + 5, cy + 4); vp(4, cx - 5, cy + 5); vp(7, cx + 6, cy - 1, rr() * 6.283); vp(6, cx - 6, cy - 1, rr() * 6.283); vp(0, cx + 4, cy + 5, rr() * 6.283);
    decorAt('bench', cx - 2, cy + 3, 1, 1, 0, 0x6a4528, 0x8a3b2e); decorAt('bench', cx + 2, cy - 3, 1, 1, 1, 0x6a4528, 0x8a3b2e);
    if (cult === 1 || cult === 5) { // paliçada de estacas em volta (nórdicos e Uivo), aberta nas estradas — 08/11: anel ORGÂNICO (regra imutável), não um quadrado
      const PR = R0 + 1.5, ph1 = rr() * 6.283, ph2 = rr() * 6.283, seen = new Set<number>();
      for (let i = 0; i < 360; i++) { const a = i / 360 * 6.283, r = PR + 1.3 * Math.sin(a * 3 + ph1) + 0.8 * Math.sin(a * 5 + ph2); const x = Math.round(cx + Math.cos(a) * r), y = Math.round(cy + Math.sin(a) * r), key = y * 100000 + x; if (seen.has(key)) continue; seen.add(key);
        if (!inb(x, y) || map[y][x] !== 'grass') continue; let nearRoad = false; for (let yy = y - 1; yy <= y + 1 && !nearRoad; yy++) for (let xx = x - 1; xx <= x + 1 && !nearRoad; xx++) if (map[yy]?.[xx] === 'road' || map[yy]?.[xx] === 'plaza') nearRoad = true; if (nearRoad) continue;
        const ns = Math.abs(Math.cos(a)) > Math.abs(Math.sin(a)); props.push({ kind: 'palisade', gx: x, gy: y, w: 1, h: 1, height: 2.8, wall: 0x5a4030, roof: 0, variant: ns ? 1 : 0 }); map[y][x] = 'wall'; } }
    for (const [tx, ty] of [[cx - 3, cy - 3], [cx + 3, cy + 3], [cx - 3, cy + 3], [cx + 3, cy - 3]]) if (inb(tx, ty) && map[ty][tx] !== 'water' && map[ty][tx] !== 'wall') props.push({ kind: 'torch', gx: tx, gy: ty, w: 1, h: 1, height: 1.9, wall: 0x3a2a1c, roof: 0xff8a2a });
    decorAt('bench', cx + 2, cy + 3, 1, 1, 0, 0x6a4528, 0x8a3b2e); decorAt('bench', cx - 2, cy - 3, 1, 1, 1, 0x6a4528, 0x8a3b2e);
    if (hs[0]) decorAt('chest', hs[0].gx - 1, hs[0].gy + hs[0].h - 1, 1, 1, seed % 5, 0x6a4528, 0x8a3b2e);
    pois.push({ name, x: cx, y: cy, biome: biomeAt_L(cx, cy) });
    const n1 = nameOf(rr, cx, cy), n2 = nameOf(rr, cx, cy), n3 = nameOf(rr, cx, cy);
    st.npcs.push(
      { name: n1, role: `Guarda de ${name}`, kind: 'nordic', x: cx + 2.5, y: cy - 2.5, radius: 3, tint: 0x6a7a9a, scale: 1.0, lines: [`Bem-vindo a ${name}. ${lore}`, 'Fique na estrada à noite. O mato é dos lobos.', 'Karmika fica para o centro. Askavik, a cidade grande, ao nordeste — siga as placas.'] },
      { name: n2 + (n2 === n1 ? ' II' : ''), role: 'Mercador', kind: rr() < 0.4 ? 'dwarf' : 'nordic', x: cx + 4, y: cy - 2.5, radius: 1.5, tint: 0xb08a40, scale: 1.0, lines: ['Pão, poção e corda. O básico de quem viaja.', 'Os grandes mercados estão em Askavik. Aqui é o que a terra dá.'], shop: 'mercador' },
      { name: n3 + (n3 === n1 || n3 === n2 ? ' a Jovem' : ''), role: 'Aldeã', kind: 'nordic', x: cx - 3, y: cy + 3.5, radius: 3, tint: 0xc08a8a, scale: 0.92, lines: [lore, 'Dizem que os caminhantes deixaram relíquias pelo mundo. Quem as encontra viaja como o vento.'] },
    );
    return st;
  };

  /** Askavik, a Cidade das Escolas — planta de urbanista (Erling, 23/10): o canal de pedra corta a cidade de norte a sul com
   *  pontes em arco; a catedral no meio da praça central, dentro de um parque; avenidas saindo dos quatro portões; bulevares
   *  em diagonal até os quatro bairros do saber (cada academia com a sua praça); a Rua do Comércio com casas de comércio de
   *  verdade em volta da Praça do Mercado; o castelo do Jarl no alto do norte; casas viradas para as ruas, becos até a porta. */
  const city = (name: string, cx: number, cy: number) => {
    const rr = rng(4242); const R0 = 52; clearWater(cx, cy, 80); flatten(cx, cy, 82);
    const st: Settlement = { name, kind: 'city', x: cx, y: cy, radius: R0, npcs: [], cult: CULT[name] ?? 0 }; settlements.push(st);
    const inLot = (x: number, y: number) => { const a = Math.atan2(y - cy, x - cx); return Math.hypot(x - cx, y - cy) < 57 + 6 * Math.sin(a * 3 + 0.7) + 4 * Math.sin(a * 5 + 2.1); }; /* regra 19: o terreno limpo da cidade tem contorno irregular, não quadrado */
    for (let i = props.length - 1; i >= 0; i--) { const q = props[i]; if (inLot(q.gx, q.gy)) props.splice(i, 1); } // o terreno da cidade começa limpo
    for (let y = cy - 66; y <= cy + 66; y++) for (let x = cx - 66; x <= cx + 66; x++) if (inb(x, y) && inLot(x, y) && map[y][x] !== 'water') map[y][x] = 'grass';
    const at = (x: number, y: number) => map[cy + y]?.[cx + x];
    const set = (x: number, y: number, t: Tile) => { if (inb(cx + x, cy + y)) map[cy + y][cx + x] = t; };
    const paint = (x: number, y: number, t: Tile = 'road') => { const q = at(x, y); if (q === 'grass' || q === 'tree' || (t === 'plaza' && q === 'road')) set(x, y, t); };
    const rect = (x0: number, y0: number, x1: number, y1: number, t: Tile = 'road') => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) paint(x, y, t); };
    const disc = (x0: number, y0: number, r: number, t: Tile, r0 = -1) => { for (let y = Math.floor(y0 - r); y <= y0 + r; y++) for (let x = Math.floor(x0 - r); x <= x0 + r; x++) { const d = Math.hypot(x - x0, y - y0); if (d <= r && d > r0) paint(x, y, t); } };
    const line = (x0: number, y0: number, x1: number, y1: number, w = 1, t: Tile = 'road') => { const L = Math.hypot(x1 - x0, y1 - y0); for (let i = 0; i <= L * 2; i++) { const k = i / (L * 2), x = x0 + (x1 - x0) * k, y = y0 + (y1 - y0) * k; for (let dy = -w; dy <= w; dy++) for (let dx = -w; dx <= w; dx++) if (Math.hypot(dx, dy) <= w + 0.3) paint(Math.round(x + dx), Math.round(y + dy), t); } };
    const lit = (x: number, y: number) => { if (at(x, y) === 'grass' || at(x, y) === 'plaza') props.push({ kind: 'torch', gx: cx + x, gy: cy + y, w: 1, h: 1, height: 2.4, wall: 0x2a2a30, roof: 0xffb050 }); };
    const tree = (x: number, y: number, round = true) => { if (at(x, y) !== 'grass') return; props.push({ kind: 'tree', sp: round ? (rr() < 0.75 ? 'oak' : 'birchYellow') : 'pineRed', gx: cx + x, gy: cy + y, w: 1, h: 1, height: 5 + rr() * 2.5, wall: 0x5b3b22, roof: round ? [0x4f8f45, 0x5a9a4a, 0x6a8a3a][Math.floor(rr() * 3)] : 0x3a6a3a, variant: 0, style: 1 }); set(x, y, 'tree'); }; // style 1 = árvore plantada (a limpeza da mata dentro da muralha não leva)
    const canal = (dy: number) => canalX_L(cy + dy) - cx;
    // 1) o canal e os cais de pedra (o cais é calçada: anda-se por ele)
    for (let dy = -60; dy <= 60; dy++) { const c = canal(dy); for (let dx = Math.floor(c - 5); dx <= c + 5; dx++) { const d = Math.abs(dx + 0.5 - c); if (d <= CANAL_HW) set(dx, dy, 'water'); else if (d <= CANAL_HW + 1.25 && Math.abs(dy) <= 54) set(dx, dy, 'plaza'); } }
    /* 27/10 (Erling: "nenhum rio acaba reto assim"): o canal continua como rio fora da cidade — ao sul até o lago, ao norte afinando até a nascente (o relevo acompanha: canalSD) */
    { let wet = 0; for (let dy = 61; dy <= 84; dy++) { const c = canal(dy), hw = canalHW(dy); let already = true; for (let dx = Math.floor(c - hw - 1); dx <= c + hw + 1; dx++) if (Math.abs(dx + 0.5 - c) <= hw) { if (at(dx, dy) !== 'water') { already = false; set(dx, dy, 'water'); } } wet = already ? wet + 1 : 0; if (wet >= 3) break; }
      for (let dy = -61; dy >= -84; dy--) { const c = canal(dy), hw = canalHW(dy); for (let dx = Math.floor(c - hw - 1); dx <= c + hw + 1; dx++) if (Math.abs(dx + 0.5 - c) <= hw) set(dx, dy, 'water'); } }
    for (let dy = -54; dy <= 54; dy++) for (const s of [-1, 1]) { const c = canal(dy), x = Math.floor(c + s * (CANAL_HW + 0.6)); if (dy % 2 === 0) props.push({ kind: 'quay', gx: cx + x, gy: cy + dy, w: 1, h: 2, height: 1, wall: 0x8a857e, roof: 0, variant: s > 0 ? 1 : 0, ry: Math.atan2(canal(dy + 1) - canal(dy - 1), 2) }); }
    const bridgesC: { x0: number; y0: number; x1: number; y1: number; half: number; hump: number }[] = [];
    /** ponte de pedra em arco onde uma rua cruza o canal: acha o trecho de água ao longo da rua e lança a ponte de cais a cais */
    const bridgeAcross = (x0: number, y0: number, x1: number, y1: number, half: number, hump: number) => { const L = Math.hypot(x1 - x0, y1 - y0); let a = -1, b = -1;
      for (let i = 0; i <= L * 4; i++) { const k = i / (L * 4), x = x0 + (x1 - x0) * k, y = y0 + (y1 - y0) * k; if (at(Math.floor(x), Math.floor(y)) === 'water') { if (a < 0) a = k; b = k; } }
      if (a < 0) return;
      /* 27/10 (Erling: "ainda estou caindo das pontes"): a ponta da ponte fica SEMPRE em terra firme (cais), nunca dentro d'água — senão a
         altura da ponta vinha do fundo do canal e o tabuleiro afundava. E nunca duas pontes uma por cima da outra. */
      const dry = (k: number) => { const x = x0 + (x1 - x0) * k, y = y0 + (y1 - y0) * k; for (const [ox, oy] of [[0, 0], [0.6, 0], [-0.6, 0], [0, 0.6], [0, -0.6]]) { const q = at(Math.floor(x + ox), Math.floor(y + oy)); if (q === 'water' || q === undefined) return false; } return true; };
      const step = 0.25 / L; a -= 1.2 / L; b += 1.2 / L; while (a > -6 / L && !dry(a)) a -= step; while (b < 1 + 6 / L && !dry(b)) b += step; if (!dry(a) || !dry(b)) return;
      const nb = { x0: x0 + (x1 - x0) * a, y0: y0 + (y1 - y0) * a, x1: x0 + (x1 - x0) * b, y1: y0 + (y1 - y0) * b, half, hump };
      const segD = (px: number, py: number, q: typeof nb) => { const dx = q.x1 - q.x0, dy = q.y1 - q.y0, l2 = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((px - q.x0) * dx + (py - q.y0) * dy) / l2)); return Math.hypot(px - q.x0 - dx * t, py - q.y0 - dy * t); };
      for (const q of bridgesC) { let close = false; for (let i = 0; i <= 8 && !close; i++) { const k = i / 8; if (segD(nb.x0 + (nb.x1 - nb.x0) * k, nb.y0 + (nb.y1 - nb.y0) * k, q) < (q.half + half) / 2 + 1.2) close = true; } if (close) return; }
      bridgesC.push(nb); };
    // 2) o coração: parque redondo, anel de rua em volta, a catedral no meio e a praça da fonte na frente dela
    disc(0, 0, 23.5, 'road', 21.2);
    block({ kind: 'temple', gx: cx - 6, gy: cy - 9, w: 13, h: 14, height: 30, wall: 0x9a968e, roof: 0x3e3a5a, variant: 20 }); pois.push({ name: 'Catedral de Askavik', x: cx, y: cy + 9, biome: 'meadow' });
    rect(-9, -12, 9, -10, 'plaza'); rect(-9, -12, -8, 8, 'plaza'); rect(8, -12, 9, 8, 'plaza'); rect(-9, 6, 9, 14, 'plaza'); // calçada em volta da catedral e a praça da fonte
    props.push({ kind: 'fountain', gx: cx - 2, gy: cy + 9, w: 4, h: 4, height: 1.4, wall: 0x9a968e, roof: 0x6fc7ff, variant: 2 });
    for (const [bx, by] of [[-6, 9], [5, 9], [-6, 13], [5, 13]]) decorAt('bench', cx + bx, cy + by, 1, 1, 0, 0x5a4a3a, 0x8a3b2e);
    /* 27/10 (referência do Erling: adro de catedral com jardim oval, fonte e balaustrada): o jardim oval ao sul da praça da fonte, canteiros, sebes e bancos */
    for (let y = 15; y <= 21; y++) for (let x = -11; x <= 11; x++) { const e = Math.hypot(x / 11, (y - 18) / 3.5); if (e <= 1 && e > 0.72) set(x, y, 'grass'); else if (e <= 0.72) set(x, y, 'plaza'); }
    for (let k = 0; k < 14; k++) { const a = k / 14 * 6.283, x = Math.round(Math.cos(a) * 9.6), y = Math.round(18 + Math.sin(a) * 3.1); if (k % 2 === 0) tree(x, y); else decorAt('bench', cx + x, cy + y, 1, 1, 0, 0x5a4a3a, 0x8a3b2e); }
    props.push({ kind: 'fountain', gx: cx - 1, gy: cy + 17, w: 2, h: 2, height: 1.2, wall: 0x9a968e, roof: 0x6fc7ff, variant: 1 });
    line(0, -12, 0, -21.5, 0); line(0, 14, 0, 21.5, 0); line(-9, -1, -21.5, -1, 0); line(9, -1, 21.5, -1, 0); // caminhos do parque
    for (let k = 0; k < 64; k++) { const ang = k / 64 * Math.PI * 2, r = 16.5 + (k % 3) * 1.6; const x = Math.round(Math.cos(ang) * r), y = Math.round(Math.sin(ang) * r); if (Math.hypot(x + 12, y - 12) < 5) continue; tree(x, y); }
    for (let k = 0; k < 16; k++) { const ang = k / 16 * Math.PI * 2 + 0.2; lit(Math.round(Math.cos(ang) * 20.6), Math.round(Math.sin(ang) * 20.6)); decorAt('bench', cx + Math.round(Math.cos(ang + 0.1) * 12.5), cy + Math.round(Math.sin(ang + 0.1) * 12.5), 1, 1, 0, 0x5a4a3a, 0x8a3b2e); }
    // 3) avenidas dos portões (o norte entra a oeste do castelo) e a ponte grande sobre o canal
    /* regra 19 (27/10): avenidas largas (5 casas) que serpenteiam em vez de régua; a do leste sai da praça da catedral e cruza o canal pela Ponte Grande */
    line(-22, 0, -36, -3, 2); line(-36, -3, -58, 2, 2); line(9, 0, 24, 0, 2); line(24, 0, 40, 3, 2); line(40, 3, 58, -1, 2); line(0, 22, -3, 38, 2); line(-3, 38, 2, 58, 2);
    line(-18, -55, -18, -27, 1); line(-18, -27, -13, -19, 1);
    bridgeAcross(8, 0, 34, 0, 1.6, 1.1);
    /** o anel do parque também cruza o canal (duas vezes): ponte reta de cais a cais onde o arco encontra a água */
    { const RR = 22.4; let inW = false, a0 = 0; for (let i = 0; i <= 720; i++) { const ang = i / 720 * Math.PI * 2, x = Math.cos(ang) * RR, y = Math.sin(ang) * RR, w = at(Math.floor(x), Math.floor(y)) === 'water';
        if (w && !inW) { a0 = ang; inW = true; } else if (!w && inW) { inW = false; const p0 = a0 - 0.12, p1 = ang + 0.12; bridgeAcross(Math.cos(p0) * RR, Math.sin(p0) * RR, Math.cos(p1) * RR, Math.sin(p1) * RR, 1.2, 0.8); } } } /* 27/10: pela mesma função (ponta seca, sem ponte cruzando ponte) */
    // 4) o castelo do Jarl, no alto, com a Praça do Jarl e a avenida até o parque
    block({ kind: 'castle', gx: cx - 8, gy: cy - 52, w: 16, h: 14, height: 22, wall: 0x8a8478, roof: 0x34445e, variant: 0 }); pois.push({ name: 'Castelo de Askavik', x: cx, y: cy - 36, biome: 'meadow' });
    rect(-9, -38, 8, -33, 'plaza'); rect(-1, -33, 1, -22); for (const s of [-1, 1]) for (let y = -37; y <= -26; y += 4) lit(s * 3, y);
    // 5) os quatro bairros do saber: academia + praça + bulevar em diagonal até o parque
    const ACAD: [string, number, number, number, number, number, number, number][] = [ // nome, gx, gy, w, h, rot, variant, cor
      ['Escola de Guerra', -41, -40, 13, 12, 0, 10, 0x7a7068], ['Forja de Askavik', 28, -40, 13, 12, 0, 11, 0x7a5a3a],
      ['Igreja Kármica', -41, 24, 12, 13, 1, 13, 0xb8b0c0], ['Universidade dos Mil Mecanismos', 26, 22, 15, 13, 0, 12, 0x9aa0a6]]; // a câmera olha do sudeste: toda fachada vira para o sul (rot 0) ou para o leste (rot 1)
    for (const [nm, gx, gy, w, h, rot, v, wall] of ACAD) {
      block({ kind: 'temple', gx: cx + gx, gy: cy + gy, w, h, height: 18, wall, roof: 0x8f7bff, variant: v, rot });
      const mx = gx + Math.floor(w / 2), my = gy + Math.floor(h / 2), ex = Math.sign(gx + w / 2) * 15.5, ey = Math.sign(gy + h / 2) * 15.5;
      if (rot === 0) { const py0 = gy + h, py1 = gy + h + 5; rect(gx - 1, py0, gx + w, py1, 'plaza'); for (const x of [gx, gx + w - 1]) { lit(x, py1); tree(x - 1, py0 + 1); } pois.push({ name: nm, x: cx + mx, y: cy + py1, biome: 'meadow' });
        if (gy < 0) { line(mx, py1, ex, ey, 1); bridgeAcross(mx, py1, ex, ey, 1.6, 1.0); } else { line(gx - 1, py0 + 2, gx - 1, gy - 1, 1); line(gx - 1, gy - 1, ex, ey, 1); bridgeAcross(gx - 1, gy - 1, ex, ey, 1.6, 1.0); bridgeAcross(gx - 1, py0 + 2, gx - 1, gy - 1, 1.6, 1.0); } }
      else { const px0 = gx + w, px1 = gx + w + 5; rect(px0, gy - 1, px1, gy + h, 'plaza'); for (const y of [gy, gy + h - 1]) { lit(px1, y); tree(px0 + 1, y - 1); } pois.push({ name: nm, x: cx + px1, y: cy + my, biome: 'meadow' }); line(px1, my, ex, ey, 1); }
    }
    // 6) a rua de ronda por dentro e duas pontes de pedestres no canal
    /* 27/10: a rua de ronda deixou de ser um quadrado: contorna a cidade por dentro acompanhando o traçado orgânico da muralha */
    { const ph = [1.3, 2.9, 0.4]; const rAt = (a: number) => { const c = Math.abs(Math.cos(a)), sn = Math.abs(Math.sin(a)); return 44 / Math.pow(Math.pow(c, 5) + Math.pow(sn, 5), 0.2) * (1 + 0.05 * Math.sin(a * 2 + ph[0]) + 0.04 * Math.sin(a * 3 + ph[1]) + 0.03 * Math.sin(a * 5 + ph[2])); };
      let px = 0, py = 0; for (let i = 0; i <= 360; i++) { const a = i / 360 * 6.283, r = rAt(a), x = Math.cos(a) * r, y = Math.sin(a) * r; if (i) line(px, py, x, y, 1); px = x; py = y; }
      for (const sgn of [-1, 1]) { const a = sgn * Math.PI / 2; const r = rAt(a); bridgeAcross(-6, Math.sin(a) * r, 36, Math.sin(a) * r, 1.0, 0.9); } }
    // os distritos (27/10, referência do mapa de Ventobravo): nomes no mapa
    for (const [nm, x, y] of [['Praça da Catedral', 0, 16], ['Distrito das Escolas', -34, -30], ['Distrito dos Mecanismos', 32, 30], ['Cidade Velha', -34, 36], ['Distrito Comercial', -37, 0], ['Cais do Canal', 20, -20], ['Bairro do Jarl', 0, -42]] as [string, number, number][]) pois.push({ name: nm, x: cx + x, y: cy + y, biome: 'meadow' });
    // 7) a Praça do Mercado e a Rua do Comércio (lado oeste): casas de comércio dos dois lados, de frente para a rua
    rect(-43, -5, -31, 5, 'plaza'); props.push({ kind: 'shopfront', gx: cx - 38, gy: cy - 1, w: 2, h: 2, height: 3, wall: 0x3a2050, roof: 0xd9b45a, variant: 0 });
    for (const [x, y] of [[-43, -5], [-31, -5], [-43, 5], [-31, 5]]) lit(x, y);
    const shops: { x: number; y: number; rot: number; v: number; key: string }[] = [];
    const shopAt = (gx0: number, gy0: number, w: number, h: number, rot: number, v: number, key: string) => { /* 02/11: procura o lugar livre mais perto (ver Askavik) */
      const fits = (gx: number, gy: number) => { for (let y = gy; y < gy + h; y++) for (let x = gx; x < gx + w; x++) { const q = at(x, y); if (q !== 'grass' && q !== 'tree') return false; } return true; };
      let gx = gx0, gy = gy0, ok = fits(gx, gy);
      for (let rr = 1; rr <= 7 && !ok; rr++) for (let dy = -rr; dy <= rr && !ok; dy++) for (let dx = -rr; dx <= rr && !ok; dx++) { if (Math.max(Math.abs(dx), Math.abs(dy)) !== rr) continue; if (fits(gx0 + dx, gy0 + dy)) { gx = gx0 + dx; gy = gy0 + dy; ok = true; } }
      if (!ok) return; block({ kind: 'house', gx: cx + gx, gy: cy + gy, w, h, height: 3.6, wall: [0xc2a679, 0xb0a898, 0x9a9a96, 0xa89078][shops.length % 4], roof: [0x6d3a28, 0x4e5f7a, 0x5a5a6a, 0x7a4a2a][shops.length % 4], variant: v, rot, shop: key }); shops.push({ x: gx, y: gy, rot, v, key }); };
    rect(-44, -5, -44, 12, 'plaza'); rect(-44, 6, -31, 8, 'plaza'); // a calçada das lojas do lado oeste e o passeio do sul (com árvores)
    for (let x = -42; x <= -32; x += 3) tree(x, 9);
    // todas as fachadas viradas para a câmera (sul ou leste): a fileira do norte olha a praça, a coluna do oeste olha a praça
    shopAt(-42, -10, 4, 4, 0, 5, 'armeiro'); shopAt(-37, -10, 4, 4, 0, 5, 'armaduras'); shopAt(-32, -10, 4, 4, 0, 4, 'taverna');
    shopAt(-48, -4, 4, 4, 1, 1, 'pocoes'); shopAt(-48, 1, 4, 4, 1, 2, 'mercador_cidade'); shopAt(-48, 6, 4, 4, 1, 1, 'domador');
    shopAt(-28, -6, 4, 4, 0, 1, 'tec_fio'); shopAt(-26, 3, 4, 4, 1, 4, 'tec_desf'); shopAt(-53, -6, 5, 4, 0, 2, 'estabulo');
    // 8) o cemitério (junto da Igreja Kármica, no canto sudoeste)
    { for (let k = 0; k < 34; k++) { const tx = -53 + Math.floor(rr() * 10), ty = 40 + Math.floor(rr() * 12); if (at(tx, ty) === 'grass') props.push({ kind: 'grave', gx: cx + tx, gy: cy + ty, w: 1, h: 1, height: 1.2, wall: 0x7a7a78, roof: 0, variant: Math.floor(rr() * 3) }); }
      for (let k = 0; k < 6; k++) tree(-54 + k * 2, 38, false); pois.push({ name: 'Cemitério de Askavik', x: cx - 48, y: cy + 46, biome: 'ruins' }); }
    // 9) os bairros de moradia: casas viradas para a rua mais perto, becos até a porta, pracinhas com árvore
    { const WALLS = [0x9a9a96, 0x8a8680, 0xb0a898, 0xc2a679, 0xa89078, 0xd0c0a0], ROOFS = [0x4e5f7a, 0x5a5a6a, 0x6d3a28, 0x4a4a52, 0x7a4a2a, 0x3a4a3a];
      const free = (x0: number, y0: number, w: number, h: number) => { for (let y = y0 - 1; y <= y0 + h; y++) for (let x = x0 - 1; x <= x0 + w; x++) { const q = at(x, y), edge = y < y0 || y >= y0 + h || x < x0 || x >= x0 + w; if (Math.abs(x) > 53 || Math.abs(y) > 53) return false; if (q !== 'grass' && !(edge && (q === 'road' || q === 'plaza' || q === 'tree'))) return false; } return Math.hypot(x0 + w / 2, y0 + h / 2) > 26; };
      const roadDist = (x0: number, y0: number, w: number, h: number, side: number) => { for (let d = 1; d <= 4; d++) { let hit = 0, n = 0; for (let i = 0; i < (side % 2 ? h : w); i++) { const x = side === 1 ? x0 + w - 1 + d : side === 3 ? x0 - d : x0 + i, y = side === 0 ? y0 + h - 1 + d : side === 2 ? y0 - d : y0 + i; n++; const q = at(x, y); if (q === 'road' || q === 'plaza') hit++; } if (hit >= Math.min(2, n)) return d; } return 99; };
      let nH = 0;
      for (let pass = 0; pass < 2; pass++) for (let gy = -53; gy <= 50; gy += 1) for (let gx = -53; gx <= 50; gx += 1) {
        if (rr() > (pass ? 0.5 : 0.22)) continue; const w = 4 + Math.floor(rr() * 2), h = 4; if (!free(gx, gy, w, h)) continue;
        let best = 99, rot = 0; for (let sd = 0; sd < 2; sd++) { const dd = roadDist(gx, gy, w, h, sd); if (dd < best) { best = dd; rot = sd; } } // só fachadas para o sul (0) ou o leste (1): a câmera não gira, o fundo das casas não pode ser a cara da rua
        if (best > 3 && pass === 0) continue;
        const east = gx > canal(gy) + 2, styleQ = east ? (gy < 0 ? 2 : 7) : 0; const ww = rot % 2 ? h : w, hh = rot % 2 ? w : h; if (!free(gx, gy, ww, hh)) continue;
        block({ kind: 'house', gx: cx + gx, gy: cy + gy, w: ww, h: hh, height: 3.4, wall: styleQ === 2 ? 0x6a5e52 : styleQ === 7 ? 0x8a4a3a : WALLS[nH % 6], roof: styleQ === 2 ? 0x4a423a : styleQ === 7 ? 0x4a4e56 : ROOFS[nH % 6], variant: [1, 2, 0, 3, 1, 2, 0, 1][nH % 8], rot, ...(styleQ && rr() < 0.7 ? { style: styleQ } : {}) }); nH++;
        // o beco da porta até a rua
        const mid = rot % 2 ? gy + Math.floor(hh / 2) : gx + Math.floor(ww / 2);
        if (best <= 4) for (let d = 0; d <= best + 1; d++) { const x = rot === 1 ? gx + ww + d : rot === 3 ? gx - 1 - d : mid, y = rot === 0 ? gy + hh + d : rot === 2 ? gy - 1 - d : mid; if (at(x, y) === 'grass') set(x, y, 'road'); else break; } /* 27/10: sem rua perto (best=99) o beco virava uma estrada de 100 casas até o fim do mundo (Erling: "montes de caminhos inúteis") */
        if (nH % 4 === 0) { const tx = gx + (rot === 1 ? -1 : ww), ty = gy + (rot === 0 ? -1 : hh); tree(tx, ty); }
      }
      // pracinhas: um poço e árvores nos terrenos que sobraram grandes
      for (let k = 0; k < 40; k++) { const x = -50 + Math.floor(rr() * 100), y = -50 + Math.floor(rr() * 100); if (Math.hypot(x, y) < 26) continue; let ok = true; for (let dy = -2; dy <= 2 && ok; dy++) for (let dx = -2; dx <= 2 && ok; dx++) if (at(x + dx, y + dy) !== 'grass') ok = false; if (!ok) continue;
        disc(x, y, 1.6, 'plaza'); decorAt('bench', cx + x + 1, cy + y, 1, 1, 0, 0x5a4a3a, 0x8a3b2e); tree(x - 2, y - 2); tree(x + 2, y + 2); lit(x - 2, y + 2); }
    }
    // 10) lampiões ao longo das avenidas
    for (let k = -52; k <= 52; k += 6) { if (Math.abs(k) < 24) continue; lit(k, -2); lit(k, 2); lit(-2, k); lit(2, k); }
    for (const b of bridgesC) bridges.push({ ax: cx + b.x0 + 0.5, ay: cy + b.y0 + 0.5, bx: cx + b.x1 + 0.5, by: cy + b.y1 + 0.5, hA: 0, hB: 0, stone: true, half: b.half * T, hump: b.hump });
    const shopNpc = (key: string) => { const sh = shops.find((q) => q.key === key); if (!sh) return null; const fx = sh.rot === 1 ? sh.x + 4.9 : sh.x + 1.5, fy = sh.rot === 1 ? sh.y + 2.5 : sh.y + 4.9; return { x: cx + fx, y: cy + fy }; };
    // NPCs da cidade
    const SN = (key: string, fx: number, fy: number) => shopNpc(key) ?? { x: fx, y: fy };
    const P = (name: string, role: string, kind: 'nordic' | 'dwarf' | 'technocrat', x: number, y: number, tint: number, lines: string[], shop?: string) => st.npcs.push({ name, role, kind, x, y, radius: 2, tint, scale: 1.0, lines, shop });
    P('Mestre Halvard', 'Mestre da Escola de Guerra', 'nordic', cx - 36, cy - 26, 0x8a3a2a, ['Então você é a aprendiz de Karmika. Garrick escreveu sobre você.', 'No nível 100 um guerreiro escolhe o que será: Berserker, Guardião, Skald ou Caçadora. Até lá, treine.', 'A Escola de Guerra forma Chefes de Guerra. Volte quando o Olho tiver visto o bastante.']);
    P('Mestre Brokk', 'Mestre da Forja', 'dwarf', cx + 33, cy - 26, 0x7a5a3a, ['A forja de Askavik não dorme. Nem eu.', 'Um Thane nasce do martelo e do hidromel. Da ordem, cada um decide.']);
    P('Arquiteta Ylva', 'Reitora da Academia', 'technocrat', cx + 31, cy + 37.5, 0x5a8ab0, ['Pólvora, vapor e esferas. A Academia faz o impossível virar engrenagem.', 'Um Engenheiro-Chefe escolhe dois caminhos no nível 100. Escolha com a cabeça, não com o coração.']);
    P('Bispa Solveig', 'Bispa da Igreja Kármica', 'nordic', cx - 26.5, cy + 28, 0x8a7a9a, ['O Olho vê o que você faz quando ninguém olha.', 'A Igreja acolhe quem carrega karma de luz. Os templários nascem aqui.']);
    P('Guarda Eirik', 'Capitão da Guarda', 'nordic', cx + 3, cy - 35, 0x6a7a9a, [`Bem-vindo a ${name}. Aqui a lei é de pedra, como as muralhas.`, 'Ladrões vão para a masmorra. Hereges, para a Bispa.']);
    P('Mercador Ivar', 'Grande Mercador', 'dwarf', SN('mercador_cidade', cx - 35, cy + 6).x, SN('mercador_cidade', cx - 35, cy + 6).y, 0xb08a40, ['O maior mercado deste lado do rio. O que procura?', 'Bolsas, poções, corda, ferramentas. Tudo tem.'], 'mercador_cidade');
    P('Sigrún', 'Armadureira-Mestra', 'nordic', SN('armaduras', cx - 35, cy - 6).x, SN('armaduras', cx - 35, cy - 6).y, 0x9a8a7a, ['Armaduras de placas. Nada de couro de coelho.', 'Quem derrubou o Torturador de Bestas tem desconto. Brincadeira — ninguém tem.'], 'armaduras');
    P('Torvald', 'Armeiro-Mestre', 'dwarf', SN('armeiro', cx - 40, cy - 6).x, SN('armeiro', cx - 40, cy - 6).y, 0x7a4a2a, ['Aço de Nidavellir, dobrado cem vezes.', 'Doran de Karmika foi meu aprendiz. Bom rapaz, martelo pesado.'], 'armeiro');
    P('Alquimista Hulda', 'Alquimista-Mestra', 'technocrat', SN('pocoes', cx - 40, cy + 6).x, SN('pocoes', cx - 40, cy + 6).y, 0x7a5aa0, ['Poções maiores, elixires, antídotos. Morwen manda saudações.'], 'pocoes');
    P('Estalajadeiro Gorm', 'Haras de Askavik', 'dwarf', SN('estabulo', cx - 50, cy + 2).x, SN('estabulo', cx - 50, cy + 2).y, 0x6a4a2e, ['Corcéis de guerra. Se o seu baio aguentou a estrada, aguenta um negro.'], 'estabulo');
    P('Paladino Aldric', 'Paladino de Auréon', 'nordic', cx - 4, cy + 7.6, 0xd9c08a, ['Auréon não pede pureza. Pede que haja sempre alguém entre o mal e o indefeso.', 'O Caminho do Paladino começa aqui, na Capela: um juramento, um escudo e a luz celeste nas mãos. Abre no nível 30 — volte quando tiver provado que protege antes de atacar.', 'Vampiros e licantropos também têm seus caminhos. Marghar vê todos do mesmo jeito. Eu não.']);
    P('Domadora Runa', 'Domadora-Mestra', 'nordic', SN('domador', cx - 30, cy + 6).x, SN('domador', cx - 30, cy + 6).y, 0xd0702a, ['Raposas, lobos, falcões. Um dia, ursos.'], 'domador');
    // as duas tecelagens reais, frente a frente no lado oeste da praça: a cidade é neutra, as lojas não
    P('Mestra Ingeborg', 'Tecelagem Real do Fio', 'nordic', SN('tec_fio', cx - 26, cy - 2).x, SN('tec_fio', cx - 26, cy - 2).y, 0x2a4a8a, ['Cada fio daqui foi puxado por uma mão que já levou alguém de volta para casa.', 'Ninguém atravessa só. Nem você, nem quem você protege.'], 'tec_fio');
    P('Corvina, a Desfiadora', 'Tecelagem dos Desfiados', 'nordic', SN('tec_desf', cx - 26, cy + 2).x, SN('tec_desf', cx - 26, cy + 2).y, 0x6a0e14, ['Rasgo a barra de cada manto com as minhas mãos. Um fio solto é uma escolha.', 'Não vendo a quem ainda tem medo da porta.'], 'tec_desf');
    st.npcs.push({ name: 'Elowen', role: 'Shop', kind: 'nordic', x: cx - 37, y: cy + 1.9, radius: 2, tint: 0x5a3a7a, scale: 0.98, lines: ['Bem-vindo ao Shop! Premium e os brasões dos dois lados, tudo aqui.', 'Nada do que eu vendo deixa alguém mais forte do que o outro: só mais bonito.'] });
    P('Jarl Haakon', 'Jarl de Askavik', 'nordic', cx - 2.5, cy - 35, 0x2a3a7a, ['Askavik tem quatro portões e nenhum foi tomado. Ainda.', 'Do alto do castelo eu vejo o canal inteiro. E quem passa nele.']);
    /* Luz e Sombra (24/10): quem só procura você conforme a alma pende */
    P('Vesna Corvo-Negro', 'Agiota de Askavik', 'nordic', cx - 33.5, cy + 4.5, 0x2a1a2a, ['Tudo em Askavik tem preço, querido. Até a lealdade. Principalmente a lealdade.', 'Não empresto a quem tem cara de santo. Santo não paga juros.', 'Volte quando estiver com fome de verdade.']);
    P('Irmã Maela', 'Enfermeira da Igreja Kármica', 'nordic', cx - 26.5, cy + 31, 0xd8d0c0, ['Os doentes não escolhem a hora. Eu também não.', 'Se tiver mãos livres, a Igreja tem gente precisando delas.', 'Marghar não cura ninguém. Quem cura são as mãos.']);
    P('Velha Gunnhild', 'Guardiã das Relíquias', 'nordic', cx + 3.5, cy + 15.5, 0x8a8aa0, ['Os caminhantes deixaram relíquias pelo mundo. Toque uma, e ela lembra de você.', 'Entre relíquias conhecidas se viaja num piscar. Procure pedras com runas azuis.']);
    return st;
  };

  /** Porto Caldeira, a Cidade da Graxa (Erling, 27/10: "a cidade da graxa tem que melhorar muito"; cada caminho se transforma na SUA cidade):
   *  cidade média steampunk na costa sul. A bacia do porto entra do mar até a Praça da Caldeira; cais de pedra dos dois lados com
   *  armazéns, guindastes e vapores atracados; a Grande Caldeira no meio da praça; a Academia da Graxa (onde se vira tecnocrata) a oeste,
   *  a Fábrica da Companhia de Latão com as chaminés a leste; a Avenida do Vapor até o portão norte; a Rua das Válvulas com as lojas;
   *  bairros de casas de tijolo e ferro; lampiões a gás; muralha de pedra (ramparts) com o portão do mar aberto pela bacia. */
  const portCity = (name: string, cx: number, cy: number, lore: string) => {
    /* PORTO_L CALDEIRA (refeita 27/10, regra 19): a cidade dos tecnocratas abraça a costa. A Praça da Caldeira no meio; a Avenida do Vapor
       sobe ao portão norte e a Avenida do Cais desce à Praça do Cais, na beira do mar. Dois portos: a Bacia dos Cargueiros a leste
       (cais de pedra, guindastes trabalhando, navios maiores do que casas) e a Enseada dos Botes a oeste (píeres de madeira, barcos
       pequenos). A Academia da Graxa a oeste, a Fábrica da Companhia a nordeste, as lojas na Rua das Válvulas. Ruas largas (4 casas),
       casas afastadas; o Farol Tecnocrático na ilha de pedras ao largo. A muralha (orgânica, só do lado da terra) é feita depois. */
    const rr = rng(7272); const R0 = PORTO_L.r;
    pads.push({ x: cx * T, z: cy * T, r: (R0 + 9) * T, h: WL + 2.1 }); // a cidade é um platô baixo e plano, pouco acima do mar
    const st: Settlement = { name, kind: 'city', x: cx, y: cy, radius: R0, npcs: [], cult: CULT[name] ?? 0 }; settlements.push(st);
    for (let i = props.length - 1; i >= 0; i--) { const q = props[i]; if (Math.abs(q.gx - cx) <= R0 + 8 && Math.abs(q.gy - cy) <= R0 + 8) props.splice(i, 1); }
    for (let y = cy - R0 - 8; y <= cy + R0 + 8; y++) for (let x = cx - R0 - 8; x <= cx + R0 + 8; x++) if (inb(x, y) && map[y][x] !== 'water') map[y][x] = 'grass';
    const at = (x: number, y: number) => map[cy + y]?.[cx + x];
    const set = (x: number, y: number, t: Tile) => { if (inb(cx + x, cy + y)) map[cy + y][cx + x] = t; };
    const paint = (x: number, y: number, t: Tile = 'road') => { const q = at(x, y); if (q === 'grass' || q === 'tree' || (t === 'plaza' && q === 'road')) set(x, y, t); };
    const rect = (x0: number, y0: number, x1: number, y1: number, t: Tile = 'road') => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) paint(x, y, t); };
    const disc = (x0: number, y0: number, r: number, t: Tile, r0 = -1) => { for (let y = Math.floor(y0 - r); y <= y0 + r; y++) for (let x = Math.floor(x0 - r); x <= x0 + r; x++) { const d = Math.hypot(x - x0, y - y0); if (d <= r && d > r0) paint(x, y, t); } };
    const lit = (x: number, y: number) => { if (at(x, y) === 'grass' || at(x, y) === 'plaza') props.push({ kind: 'torch', gx: cx + x, gy: cy + y, w: 1, h: 1, height: 2.6, wall: 0x2a2d34, roof: 0xffc070 }); };
    const P = (kind: PropKind, x: number, y: number, w: number, h: number, extra: Partial<Prop> = {}) => props.push({ kind, gx: cx + x, gy: cy + y, w, h, height: 3, wall: 0x6a3a2a, roof: 0x3a3d44, ...extra });
    const B = (kind: PropKind, x: number, y: number, w: number, h: number, extra: Partial<Prop> = {}) => block({ kind, gx: cx + x, gy: cy + y, w, h, height: 3.4, wall: 0x6a3a2a, roof: 0x3a3d44, ...extra });
    /* 1) OS DOIS PORTOS. A Bacia dos Cargueiros: água de x 8..22, da cabeceira (y 12) até o mar; cais de pedra de 3 casas dos dois lados e na cabeceira.
       A Enseada dos Botes: água de x −22..−15, de y 18 até o mar; cais estreito e píeres de madeira. (o relevo acompanha: harborSD) */
    const CB = PORTO_L.basins[0], CV = PORTO_L.basins[1]; // {x0,x1,y0} relativos
    for (const bz of [CB, CV]) for (let y = bz.y0; y <= R0 + 14; y++) for (let x = bz.x0; x <= bz.x1; x++) set(x, y, 'water');
    rect(CB.x0 - 3, CB.y0 - 3, CB.x1 + 3, CB.y0 - 1, 'plaza'); for (let y = CB.y0; y <= R0 + 1; y++) { rect(CB.x0 - 3, y, CB.x0 - 1, y, 'plaza'); rect(CB.x1 + 1, y, CB.x1 + 3, y, 'plaza'); }
    for (let y = CB.y0; y < R0; y += 2) { P('dock', CB.x0 - 2, y, 1, 2, { variant: 0 }); P('dock', CB.x1 + 1, y, 1, 2, { variant: 1 }); } for (let x = CB.x0; x <= CB.x1; x += 2) P('dock', x, CB.y0 - 1, 1, 1, { variant: 1 });
    P('crane', CB.x0 - 3, CB.y0 + 3, 1, 1, { variant: 0 }); P('crane', CB.x1 + 3, CB.y0 + 9, 1, 1, { variant: 1 }); P('crane', CB.x0 - 3, CB.y0 + 15, 1, 1, { variant: 2 }); P('crane', CB.x1 + 3, CB.y0 + 1, 1, 1, { variant: 1 });
    P('boat', CB.x0 + 1, CB.y0 + 2, 5, 12, { variant: 3 }); P('boat', CB.x0 + 8, CB.y0 + 10, 5, 12, { variant: 4 }); P('boat', -40, 24, 12, 5, { variant: 3 }); // três cargueiros: dois atracados, um chegando pelo mar a oeste
    rect(CV.x0 - 2, CV.y0 - 2, CV.x1 + 2, CV.y0 - 1, 'plaza'); for (let y = CV.y0; y <= R0 + 1; y++) { rect(CV.x0 - 2, y, CV.x0 - 1, y, 'plaza'); rect(CV.x1 + 1, y, CV.x1 + 2, y, 'plaza'); }
    P('dock', CV.x0, CV.y0 + 3, 4, 1, { variant: 2 }); P('dock', CV.x1 - 3, CV.y0 + 8, 4, 1, { variant: 2 }); P('dock', CV.x0, CV.y0 + 13, 5, 1, { variant: 2 }); // píeres de madeira
    P('boat', CV.x0 + 1, CV.y0 + 1, 4, 2, { variant: 0 }); P('boat', CV.x0 + 3, CV.y0 + 5, 4, 2, { variant: 1 }); P('boat', CV.x0, CV.y0 + 10, 4, 2, { variant: 2 }); P('boat', CV.x0 + 2, CV.y0 + 16, 4, 2, { variant: 0 }); P('boat', CV.x0 + 1, CV.y0 + 22, 4, 2, { variant: 1 });
    /* 2) a Praça da Caldeira com a Grande Caldeira no meio; a Avenida do Vapor (4 casas) até o portão norte; a Avenida do Cais até a Praça do Cais; a Rua Leste e a Rua Oeste */
    disc(0, -4, 9.5, 'plaza'); block({ kind: 'monument', gx: cx - 3, gy: cy - 8, w: 7, h: 6, height: 16, wall: 0, roof: 0, variant: 8 }); pois.push({ name: 'A Grande Caldeira', x: cx, y: cy - 1, biome: 'coast' });
    rect(-2, -R0 - 8, 1, -13); rect(-2, 5, 1, 20); rect(10, -7, R0 + 8, -4); rect(-R0 - 8, 2, -10, 5);
    rect(-12, 20, 6, 25, 'plaza'); // a Praça do Cais, de frente para o mar, entre os dois portos
    for (const [bx, byy] of [[-7, 2], [6, 2], [-8, -10], [7, -10], [-9, 22], [3, 22]]) decorAt('bench', cx + bx, cy + byy, 1, 1, 0, 0x3a3d44, 0x8a3b2e);
    decorAt('fountain', cx - 3, cy + 22, 2, 2, 1, 0x6a6a70, 0x3a8ab0); // a fonte do cais (água do mar bombeada a vapor)
    /* 3) a Academia da Graxa (a universidade das engrenagens, virada para a praça) e o seu pórtico e adro */
    block({ kind: 'temple', gx: cx - 27, gy: cy - 14, w: 15, h: 13, height: 18, wall: 0x6a4a3a, roof: 0x8f7bff, variant: 12, rot: 1 });
    rect(-12, -16, -8, 0, 'plaza'); for (const y of [-15, -1]) lit(-10, y); props.push({ kind: 'portico', gx: cx - 12, gy: cy - 11, w: 3, h: 7, height: 9, wall: 0, roof: 0, variant: 0, rot: 1 });
    pois.push({ name: 'Academia da Graxa', x: cx - 8, y: cy - 7, biome: 'coast' }); landmarkDoor[name] = { x: cx - 7.5, y: cy - 7.5 };
    rect(-28, -18, -12, -16); rect(-28, 0, -12, 1); // as ruas que contornam a Academia (ligam à Rua Oeste)
    /* 4) a Fábrica da Companhia de Latão: o galpão, o pátio e três chaminés; a garagem ao lado; a rua da fábrica */
    B('house', 12, -24, 9, 5, { height: 4.4, wall: 0x7a4a3a, roof: 0x3a3d44, variant: 2, style: 7, rot: 0 }); rect(11, -19, 27, -17, 'plaza'); pois.push({ name: 'Fábrica da Companhia de Latão', x: cx + 16, y: cy - 18, biome: 'coast' });
    P('chimney', 13, -27, 1, 1, { variant: 0 }); P('chimney', 16, -27, 1, 1, { variant: 0 }); P('chimney', 19, -27, 1, 1, { variant: 0 });
    B('house', 23, -24, 5, 4, { height: 3.4, wall: 0x5a4a3a, roof: 0x4a4e56, variant: 1, style: 7, rot: 0 }); P('chimney', 28, -26, 1, 1, { variant: 1 });
    rect(10, -16, 28, -13); rect(10, -13, 13, -7); // a Rua da Fábrica e a descida até a Rua Leste
    /* 5) a Rua das Válvulas: as lojas, de frente para a avenida (oeste olha para o leste) e para a rua das lojas (sul) */
    const shops: { x: number; y: number; rot: number; key: string }[] = [];
    /* 02/11: 5 das 8 lojas de Askavik e 5 das 7 do Porto não eram construídas (o lugar marcado já tinha rua/muro) e o lojista ficava
       sem loja. Agora a loja procura o lugar livre mais perto do marcado (até 7 casas), sem nunca sentar em cima de rua ou praça. */
    const shopAt = (gx0: number, gy0: number, rot: number, v: number, key: string) => { const ww = 4, hh = 4;
      const fits = (gx: number, gy: number) => { for (let y = gy - 1; y <= gy + hh; y++) for (let x = gx - 1; x <= gx + ww; x++) { const q = at(x, y); const inner = x >= gx && x < gx + ww && y >= gy && y < gy + hh; if (inner ? q !== 'grass' && q !== 'tree' : q !== 'grass' && q !== 'road' && q !== 'plaza' && q !== 'tree') return false; } return true; };
      let gx = gx0, gy = gy0, ok = fits(gx, gy);
      for (let rr = 1; rr <= 7 && !ok; rr++) for (let dy = -rr; dy <= rr && !ok; dy++) for (let dx = -rr; dx <= rr && !ok; dx++) { if (Math.max(Math.abs(dx), Math.abs(dy)) !== rr) continue; if (fits(gx0 + dx, gy0 + dy)) { gx = gx0 + dx; gy = gy0 + dy; ok = true; } }
      if (!ok) return;
      block({ kind: 'house', gx: cx + gx, gy: cy + gy, w: ww, h: hh, height: 3.6, wall: [0x7a4a3a, 0x8a5a3a, 0x6a5a4a][shops.length % 3], roof: [0x3a3d44, 0x4a4e56, 0x5a3a2a][shops.length % 3], variant: v, rot, style: 7, shop: key }); shops.push({ x: gx, y: gy, rot, key });
      if (rot === 1) rect(gx + ww, gy, gx + ww, gy + hh - 1, 'plaza'); else rect(gx, gy + hh, gx + ww - 1, gy + hh, 'plaza'); };
    shopAt(-8, -31, 1, 4, 'taverna'); shopAt(-8, -25, 1, 1, 'pocoes'); shopAt(-8, -19, 1, 2, 'mercador_cidade');
    rect(3, -26, 24, -23); shopAt(4, -32, 0, 5, 'armeiro'); shopAt(10, -32, 0, 5, 'armaduras'); shopAt(16, -32, 0, 1, 'domador');
    rect(-28, -24, -3, -21); shopAt(-16, -30, 0, 2, 'estabulo');
    props.push({ kind: 'shopfront', gx: cx - 8, gy: cy - 14, w: 2, h: 2, height: 3, wall: 0x3a2d34, roof: 0xc8963a, variant: 0 });
    /* 6) armazéns da Companhia junto à bacia e as casas dos pescadores junto à enseada */
    for (const y of [CB.y0 - 9, CB.y0 - 3]) { B('house', CB.x0 - 2, y, 9, 4, { height: 3.8, wall: 0x6a4a3a, roof: 0x3a3d44, variant: 2, style: 7, rot: 0 }); }
    for (const y of [CB.y0 + 1, CB.y0 + 8]) { B('house', CB.x1 + 5, y, 6, 4, { height: 3.6, wall: 0x7a4a3a, roof: 0x4a4e56, variant: 2, style: 7, rot: 1 }); rect(CB.x1 + 4, y, CB.x1 + 4, y + 3, 'plaza'); }
    rect(CB.x1 + 4, CB.y0 - 4, CB.x1 + 11, CB.y0 - 1); rect(CB.x1 + 11, CB.y0 - 4, CB.x1 + 11, R0 - 2); // a rua dos armazéns
    for (const [x, y] of [[CV.x0 - 8, CV.y0 - 2], [CV.x0 - 9, CV.y0 + 5], [CV.x1 + 4, CV.y0 - 7]]) B('house', x, y, 4, 4, { height: 3.0, wall: [0x8a7a5a, 0x7a6a5a, 0x6a5a4a][(x + y) & 1], roof: [0x4a4e56, 0x5a3a2a][(x + y) & 1], variant: 1, style: 7, rot: 0 });
    /* 08/11 (Erling: "piso bem colocado"): dentro da muralha do Porto as ruas são calçadas (laje), não terra batida; só a estrada que sai da cidade continua de terra */
    for (let y = -R0 - 2; y <= R0 + 2; y++) for (let x = -R0 - 2; x <= R0 + 2; x++) if (at(x, y) === 'road' && Math.hypot(x, y) < R0 + 1) set(x, y, 'plaza');
    rect(CV.x0 - 6, CV.y0 - 4, CV.x1 + 4, CV.y0 - 3); rect(-14, 6, -11, 20); // a rua da enseada e a ligação com a Praça do Cais
    /* 7) os bairros: casas de tijolo e ferro viradas para a rua mais perto, com 2 casas de folga entre si (regra 19: ruas largas, nada apertado) */
    { const WALLS = [0x7a4a3a, 0x8a5a4a, 0x6a5a52, 0x5a4a44, 0x8a6a4a], ROOFS = [0x3a3d44, 0x4a4e56, 0x5a3a2a, 0x3a3a3a, 0x4a3a30];
      const free = (x0: number, y0: number, w: number, h: number) => { for (let y = y0 - 2; y <= y0 + h + 1; y++) for (let x = x0 - 2; x <= x0 + w + 1; x++) { const q = at(x, y), edge = y < y0 || y >= y0 + h || x < x0 || x >= x0 + w; if (Math.hypot(x, y) > R0 + 1) return false; if (q !== 'grass' && !(edge && (q === 'road' || q === 'plaza'))) return false; } return true; };
      const roadDist = (x0: number, y0: number, w: number, h: number, side: number) => { for (let d = 1; d <= 4; d++) { let hit = 0, n = 0; for (let i = 0; i < (side % 2 ? h : w); i++) { const x = side === 1 ? x0 + w - 1 + d : x0 + i, y = side === 0 ? y0 + h - 1 + d : y0 + i; n++; const q = at(x, y); if (q === 'road' || q === 'plaza') hit++; } if (hit >= Math.min(2, n)) return d; } return 99; };
      let nH = 0;
      for (let pass = 0; pass < 2; pass++) for (let gy = -R0 + 1; gy <= R0 - 5; gy += 1) for (let gx = -R0 + 1; gx <= R0 - 5; gx += 1) {
        if (rr() > (pass ? 0.4 : 0.18)) continue; const w = 4 + Math.floor(rr() * 2), h = 4; if (!free(gx, gy, w, h)) continue;
        let best = 99, rot = 0; for (let sd = 0; sd < 2; sd++) { const dd = roadDist(gx, gy, w, h, sd); if (dd < best) { best = dd; rot = sd; } }
        if (best > 3 && pass === 0) continue; const ww = rot % 2 ? h : w, hh = rot % 2 ? w : h; if (!free(gx, gy, ww, hh)) continue;
        block({ kind: 'house', gx: cx + gx, gy: cy + gy, w: ww, h: hh, height: 3.2 + rr() * 0.6, wall: WALLS[nH % 5], roof: ROOFS[(nH * 2 + 1) % 5], variant: [1, 2, 0, 3, 1, 2, 0, 1][nH % 8], rot, style: 7 }); nH++;
        const mid = rot % 2 ? gy + Math.floor(hh / 2) : gx + Math.floor(ww / 2);
        if (best <= 4) for (let d = 0; d <= best + 1; d++) { const x = rot === 1 ? gx + ww + d : mid, y = rot === 0 ? gy + hh + d : mid; if (at(x, y) === 'grass') set(x, y, 'road'); else break; }
        if (nH % 4 === 0) P('chimney', gx + (rot ? ww : 0) - 1, gy - 1, 1, 1, { variant: 1 });
      }
    }
    /* 8) lampiões a gás nas avenidas, no cais e na praça; a ilha do Farol */
    for (let k = -R0 - 6; k <= -12; k += 5) { lit(k, -8); lit(k, -3); } for (let k = 12; k <= R0 + 6; k += 5) { lit(k, -8); lit(k, -3); } for (let k = -R0 - 6; k <= -14; k += 5) { lit(-3, k); lit(2, k); } for (let k = 6; k <= 19; k += 4) { lit(-3, k); lit(2, k); }
    for (let k = 0; k < 10; k++) { const ang = k / 10 * Math.PI * 2 + 0.3; lit(Math.round(Math.cos(ang) * 10.5), Math.round(-4 + Math.sin(ang) * 10.5)); } for (let x = -11; x <= 6; x += 4) lit(x, 26);
    { const fx = PORTO_L.farol.x - cx, fy = PORTO_L.farol.y - cy; for (let y = fy - 4; y <= fy + 4; y++) for (let x = fx - 4; x <= fx + 4; x++) { const d = Math.hypot(x + 0.5 - fx, y + 0.5 - fy); if (d <= PORTO_L.farol.r - 1.4) set(x, y, 'grass'); else if (d <= PORTO_L.farol.r + 0.2 && inb(cx + x, cy + y)) { set(x, y, 'grass'); if (rr() < 0.7) props.push({ kind: 'rock', gx: cx + x, gy: cy + y, w: 1, h: 1, height: 1.2 + rr(), wall: 0x5a5a58, roof: 0, variant: Math.floor(rr() * 3) }); } } // a ilha: pedras em volta, saindo do mar
      block({ kind: 'monument', gx: PORTO_L.farol.x - 2, gy: PORTO_L.farol.y - 2, w: 5, h: 5, height: 26, wall: 0, roof: 0, variant: 10 }); pois.push({ name: 'Farol Tecnocrático', x: PORTO_L.farol.x, y: PORTO_L.farol.y + 3, biome: 'coast' }); }
    pois.push({ name, x: cx, y: cy, biome: 'coast' });
    /* 9) a gente da cidade */
    const shopNpc = (key: string, fx: number, fy: number) => { const sh = shops.find((q) => q.key === key); if (!sh) return { x: cx + fx, y: cy + fy }; return { x: cx + (sh.rot === 1 ? sh.x + 4.9 : sh.x + 1.5), y: cy + (sh.rot === 1 ? sh.y + 1.5 : sh.y + 4.9) }; };
    const N = (nm: string, role: string, kind: 'nordic' | 'dwarf' | 'technocrat', x: number, y: number, tint: number, lines: string[], shop?: string) => st.npcs.push({ name: nm, role, kind, x, y, radius: 2, tint, scale: 1.0, lines, shop });
    N('Arquiteta Ylva', 'Reitora da Academia da Graxa', 'technocrat', cx - 7.5, cy - 7.5, 0x5a8ab0, ['Pólvora, vapor e esferas. A Academia faz o impossível virar engrenagem.', 'Quem quer ser tecnocrata vem a Porto Caldeira. Askavik tem livros; nós temos a graxa.', 'O Farol foi o primeiro projeto da Academia. Ainda é o melhor.']);
    N('Aprendiz Teodora', 'Aluna da Academia da Graxa', 'technocrat', cx - 10.5, cy - 13, 0x7a9ab0, ['A reitora diz que todo acidente é um experimento mal anotado.', 'Ontem a caldeira do laboratório apitou sozinha. Ninguém mexeu. Ninguém confessa.']);
    N('Aprendiz Nuno', 'Aluno da Academia da Graxa', 'technocrat', cx - 10.5, cy - 2, 0x6a8aa0, ['Quatro anos de óleo nas mãos. Minha mãe queria um padre.', 'A Fábrica paga melhor que a Academia. Mas a Academia tem a reitora.']);
    N('Capitão Baltazar', 'Capitão do Porto', 'nordic', cx + CB.x0 - 1.5, cy + CB.y0 - 2.5, 0x2a3a4a, [`Bem-vindo a ${name}. ${lore}`, 'Cargueiro grande entra pela bacia; bote entra pela enseada. Quem confunde, afunda.', 'O Farol pisca a cada três fôlegos. Conte, e saberá se está vivo.']);
    N('Estivador Brás', 'Estivador da Bacia', 'dwarf', cx + CB.x0 - 2.5, cy + CB.y0 + 9.5, 0x6a5a3a, ['Carvão azul vai para o norte. Peças vêm do norte. O resto é peso.', 'O guindaste número dois range. Não é saudade: é ferrugem.']);
    N('Estivadora Marta', 'Estivadora da Bacia', 'nordic', cx + CB.x1 + 2.5, cy + CB.y0 + 6.5, 0x8a6a4a, ['Dez caixas por hora. Onze quando o Baltazar olha.', 'Já vi um robô cair na água. Afundou com a mão levantada, como quem pede licença.']);
    N('Pescador Anselmo', 'Pescador da Enseada', 'nordic', cx + CV.x1 + 1.5, cy + CV.y0 + 2.5, 0x5a6a5a, ['Os cargueiros assustam o peixe. Os botes trazem ele de volta.', 'De noite o Farol vira a luz. De dia, vira a sombra. Eu pesco nas duas.']);
    N('Foguista Elói', 'Foguista da Grande Caldeira', 'dwarf', cx + 4.5, cy - 0.5, 0x5a3a2a, ['A Grande Caldeira não apaga desde que a cidade existe. Nem no dia do incêndio.', 'Cada chaminé desta cidade é um tubo que sai daqui de baixo.']);
    N('Feitora Brunna', 'Feitora da Fábrica da Companhia', 'dwarf', cx + 16.5, cy - 18.5, 0x7a4a2a, ['A Fábrica não para. A Companhia não perdoa.', 'Engenhoca de turno sai daqui. Mk I, Mk II, Mk III. O resto é imitação de Ferrugem.']);
    N('Taverneira Josefa', 'A Válvula', 'nordic', shopNpc('taverna', -1, -29).x, shopNpc('taverna', -1, -29).y, 0x8a3a3a, ['A Válvula abre quando a Fábrica fecha. Ou seja, nunca fecha.', 'Cerveja de Brasaforja e rum do porto. O vinho é de Corvoscuro, e eu não pergunto.'], 'taverna');
    N('Boticária Celeste', 'Botica da Graxa', 'technocrat', shopNpc('pocoes', -1, -23).x, shopNpc('pocoes', -1, -23).y, 0x7a5aa0, ['Poções destiladas a vapor. Mais puras, dizem. Mais caras, eu digo.'], 'pocoes');
    N('Mercador Zacarias', 'Grande Mercador do Porto', 'dwarf', shopNpc('mercador_cidade', -1, -17).x, shopNpc('mercador_cidade', -1, -17).y, 0xb08a40, ['Tudo o que chega de barco passa por mim. Tudo o que sai, também.', 'Bolsas, corda, ferramentas. E segredos, se pagar em prata.'], 'mercador_cidade');
    N('Armeiro Gaspar', 'Armeiro do Porto', 'dwarf', shopNpc('armeiro', 6, -27).x, shopNpc('armeiro', 6, -27).y, 0x7a4a2a, ['Lâmina de aço de Brasaforja, cabo de latão daqui. O melhor dos dois povos.'], 'armeiro');
    N('Armadureira Inês', 'Armaduras do Porto', 'nordic', shopNpc('armaduras', 12, -27).x, shopNpc('armaduras', 12, -27).y, 0x9a8a7a, ['Placas rebitadas. Pesam, mas param.'], 'armaduras');
    N('Domador Tibúrcio', 'Domador do Porto', 'nordic', shopNpc('domador', 18, -27).x, shopNpc('domador', 18, -27).y, 0xd0702a, ['Gaivotas, cães de cais e um macaco que roubei de um vapor.'], 'domador');
    N('Estalajadeira Rosa', 'Estalagem do Porto', 'dwarf', shopNpc('estabulo', -14, -25).x, shopNpc('estabulo', -14, -25).y, 0x6a4a2e, ['Cavalos aqui comem sal com o capim. Ficam teimosos.'], 'estabulo');
    N('Guarda Vitorino', 'Guarda do Porto', 'nordic', cx + 2.5, cy - 30, 0x6a7a9a, [`Aqui a lei é a Companhia, e a Companhia sou eu das oito às seis.`, 'Ladrão de carvão vai para a caldeira. Brincadeira. Vai para a masmorra.']);
    N('Faroleira Dinorá', 'Guardiã do Farol Tecnocrático', 'technocrat', cx - 1.5, cy + 23.5, 0x4a7a9a, ['O Farol é da Academia, mas a luz é de quem está no mar.', 'Três voltas por minuto. Quando falha uma, eu já estou no bote.']);
    st.npcs.push({ name: 'Elowen do Porto', role: 'Shop', kind: 'nordic', x: cx - 7, y: cy - 14.5, radius: 2, tint: 0x5a3a7a, scale: 0.98, lines: ['Bem-vindo ao Shop! Premium e os brasões dos dois lados, tudo aqui.', 'Nada do que eu vendo muda a sua força. Muda a sua cara.'] });
    return st;
  };
  // vilas de madeira espalhadas pelo mundo exterior e a cidade média a nordeste
  for (const [i, [nm, vx, vy, lore]] of VILL.entries()) { if (nm === 'Porto Caldeira') portCity(nm, vx, vy, lore); else village(nm, vx, vy, 100 + i * 17, lore); }
  city('Askavik', ASKAVIK_L.x, ASKAVIK_L.y);
  /* ESTRADAS = ROTAS DE COMÉRCIO. Não saem todas de Karmika: um tronco liga Askavik às vilas grandes, ramais às pequenas,
     trilhas aos lugares de luta. Cada trecho é traçado por A* sobre o terreno (morro, mata, pântano e neve custam caro;
     água custa muito — a rota cruza o rio onde ele é estreito, numa ponte só) e prefere seguir a estrada que já existe,
     então as rotas se juntam como estradas de verdade em vez de correr paralelas. */
  const cellH = new Float32Array(NC), cellBase = new Float32Array(NC), cellWater = new Uint8Array(NC);
  for (let cy = 0; cy < GHt; cy++) for (let cx = 0; cx < GW; cx++) { const c = cy * GW + cx, tx = cx * CG + 1, ty = cy * CG + 1;
    const z = cellZ[c], sd = cellSD[c]; cellH[c] = groundH_L(tx * T, ty * T, z, sd); cellWater[c] = sd < 1.3 ? 1 : 0;
    cellBase[c] = 1 + z.forest * 0.7 + z.swamp * 2.2 + z.snow * 1.6 + z.rock * 1.0 + z.ruins * 0.3 + z.volcanic * 2.2 + z.enchanted * 0.6 + z.blight * 0.6 + z.jungle * 1.8 + z.coast * 0.2 + (sd < 5 ? 1.6 : 0) + (edgeK_L(tx, ty).north > 0.3 ? 6 : 0); }
  /** já existe ponte perto? então não se abre outra travessia ao lado: a rota usa a ponte que existe (ou cruza longe) */
  const nearBridge = (x: number, y: number) => bridges.some((b) => Math.hypot((b.ax + b.bx) / 2 - x, (b.ay + b.by) / 2 - y) < 14);
  const tileAt = (cx: number, cy: number) => map[Math.min(MAP_H_L - 1, cy * CG + 1)]?.[Math.min(MAP_W_L - 1, cx * CG + 1)];
  const astar = (sx: number, sy: number, gx: number, gy: number): [number, number][] | null => {
    const s0 = Math.floor(sy / CG) * GW + Math.floor(sx / CG), g0 = Math.floor(gy / CG) * GW + Math.floor(gx / CG);
    const gs = new Float32Array(NC).fill(1e9), from = new Int32Array(NC).fill(-1), closed = new Uint8Array(NC);
    const heap: number[] = [], hf: number[] = []; const gxC = g0 % GW, gyC = Math.floor(g0 / GW);
    const push = (c: number, f: number) => { heap.push(c); hf.push(f); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (hf[p] <= hf[i]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; [hf[p], hf[i]] = [hf[i], hf[p]]; i = p; } };
    const pop = () => { const top = heap[0], lc = heap.pop()!, lf = hf.pop()!; if (heap.length) { heap[0] = lc; hf[0] = lf; let i = 0; for (;;) { const l = i * 2 + 1, r2 = l + 1; let m = i; if (l < heap.length && hf[l] < hf[m]) m = l; if (r2 < heap.length && hf[r2] < hf[m]) m = r2; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; [hf[m], hf[i]] = [hf[i], hf[m]]; i = m; } } return top; };
    gs[s0] = 0; push(s0, 0);
    while (heap.length) { const c = pop(); if (c === g0) break; if (closed[c]) continue; closed[c] = 1; const cx = c % GW, cy = Math.floor(c / GW);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; const nx = cx + dx, ny = cy + dy; if (nx < 1 || ny < 1 || nx >= GW - 1 || ny >= GHt - 1) continue; const nc = ny * GW + nx; if (closed[nc]) continue;
        const t = tileAt(nx, ny), onRoad = t === 'road' || t === 'plaza', wall = t === 'wall' || t === 'tree';
        const ax2 = nx * CG + 1 - ASKAVIK_L.x, ay2 = ny * CG + 1 - ASKAVIK_L.y, inAsk = Math.abs(ax2) <= ASKAVIK_L.r + 5 && Math.abs(ay2) <= ASKAVIK_L.r + 5 && Math.abs(ay2) > 3 && !(ay2 > 0 && Math.abs(ax2) <= 3) && !(ay2 < 0 && Math.abs(ax2 + 18) <= 3); // a muralha de Askavik: as estradas chegam pelos 4 portões do meio
        const step = (inAsk ? 90 : 0) + (dx && dy ? 1.414 : 1) * (onRoad ? 0.32 : cellBase[nc]) + Math.abs(cellH[nc] - cellH[c]) * 4.5 + (cellWater[nc] && !onRoad ? 26 + (nearBridge(nx * CG + 1, ny * CG + 1) ? 600 : 0) : 0) + (wall && !onRoad ? 40 : 0);
        const ng = gs[c] + step; if (ng < gs[nc]) { gs[nc] = ng; from[nc] = c; push(nc, ng + Math.hypot(nx - gxC, ny - gyC) * 0.34); } } }
    if (from[g0] < 0 && s0 !== g0) return null;
    const out: [number, number][] = []; for (let c = g0; c >= 0; c = from[c]) { out.push([(c % GW) * CG + 1, Math.floor(c / GW) * CG + 1]); if (c === s0) break; }
    return out.reverse();
  };
  // suaviza a escada da grade: simplifica e arredonda (Chaikin) — curvas que seguem o terreno
  const smoothPath = (p: [number, number][]) => { let q = p.filter((_, i) => i % 3 === 0 || i === p.length - 1); for (let it = 0; it < 3; it++) { const o: [number, number][] = [q[0]]; for (let i = 0; i < q.length - 1; i++) { const [ax, ay] = q[i], [bx, by] = q[i + 1]; o.push([ax * 0.75 + bx * 0.25, ay * 0.75 + by * 0.25], [ax * 0.25 + bx * 0.75, ay * 0.25 + by * 0.75]); } o.push(q[q.length - 1]); q = o; } return q; };
  const PLACE: Record<string, [number, number]> = { Karmika: [CITY_L.x, CITY_L.y + 3] }; for (const v of VILL) PLACE[v[0]] = [v[1], v[2]]; PLACE.Askavik = [ASKAVIK_L.x, ASKAVIK_L.y]; /* 24/10: sem isto as estradas de Askavik (tronco do comércio) nunca eram traçadas: a cidade ficava sem estrada saindo dos portões */
  const gateOf = (tx: number, ty: number): [number, number] => { const gs2: [number, number][] = [[ASKAVIK_L.x - 18, ASKAVIK_L.y - 54], [ASKAVIK_L.x, ASKAVIK_L.y + 54], [ASKAVIK_L.x - 54, ASKAVIK_L.y], [ASKAVIK_L.x + 54, ASKAVIK_L.y]]; gs2.sort((a, b) => Math.hypot(a[0] - tx, a[1] - ty) - Math.hypot(b[0] - tx, b[1] - ty)); return gs2[0]; };
  const route = (a: string | [number, number], b: string | [number, number], width = 1.25) => {
    let A = typeof a === 'string' ? PLACE[a] : a, B = typeof b === 'string' ? PLACE[b] : b; if (!A || !B) return;
    if (a === 'Askavik') A = gateOf(B[0], B[1]); if (b === 'Askavik') B = gateOf(A[0], A[1]);
    const p = astar(A[0], A[1], B[0], B[1]); if (p && p.length > 2) { road(smoothPath(p), width, 0.25); if (typeof a === 'string' && typeof b === 'string') roadLinks.push({ a, b, i: roadPaths.length - 1 }); }
  };
  // tronco do comércio (largo): Askavik ↔ vilas grandes, e o anel que contorna o mundo
  for (const [a, b] of [['Askavik', 'Lundr'], ['Lundr', 'Karmika'], ['Karmika', 'Vestheim'], ['Karmika', 'Sudrholt'], ['Askavik', 'Kaldrfoss'], ['Kaldrfoss', 'Fjallbrún'], ['Askavik', 'Hrafnhöfn'], ['Lundr', 'Eikvik'], ['Eikvik', 'Austrvik'], ['Austrvik', 'Steinfoss'], ['Steinfoss', 'Sandvik'], ['Sandvik', 'Sudrholt'], ['Sudrholt', 'Brekkuvik'], ['Brekkuvik', 'Myrbakki'], ['Myrbakki', 'Vatnaholt'], ['Vatnaholt', 'Vestheim'], ['Vestheim', 'Mýrarvik'], ['Mýrarvik', 'Hvítadalr'], ['Hvítadalr', 'Grenivik'], ['Grenivik', 'Fjallbrún']] as [string, string][]) route(a, b, 1.3);
  // ramais (estreitos): vilas pequenas e atalhos
  // o mundo de fora: tronco até as regiões de lore, ligando as vilas delas entre si
  for (const [a, b] of [['Nordvik', 'Jarlsheim'], ['Jarlsheim', 'Skjoldvik'], ['Jarlsheim', 'Hrimgard'], ['Hrimgard', 'Fjallbrún'], ['Kaldrfoss', 'Midvangr'], ['Midvangr', 'Brasaforja'], ['Ulfheim', 'Brasaforja'], ['Brasaforja', 'Cinzalto'], ['Cinzalto', 'Corvoscuro'], ['Hrafnhöfn', 'Corvoscuro'], ['Corvoscuro', 'Gorvath'], ['Austrvik', 'Gorvath'], ['Austrvik', 'Dalborg'], ['Dalborg', 'Uivo Antigo'], ['Steinfoss', 'Dalborg'], ['Sandvik', 'Ferrugem'], ['Ferrugem', 'Porto Caldeira'], ['Sudrholt', 'Vindholt'], ['Vindholt', 'Porto Caldeira'], ['Brekkuvik', 'Vaporeira'], ['Vaporeira', 'Porto Caldeira'], ['Myrbakki', 'Lumenhal'], ['Vatnaholt', 'Lumenhal'], ['Vestheim', 'Lithendel'], ['Mýrarvik', 'Skjoldvik'], ['Lithendel', 'Skjoldvik']] as [string, string][]) route(a, b, 1.2);
  for (const [a, b] of [['Grenivik', 'Karmika'], ['Hvítadalr', 'Nordvik'], ['Hvítadalr', 'Bjarnholt'], ['Bjarnholt', 'Fjallbrún'], ['Kaldrfoss', 'Ulfheim'], ['Ulfheim', 'Hrafnhöfn'], ['Skógar', 'Vestheim'], ['Skógar', 'Karmika']] as [string, string][]) route(a, b, 1.0);
  bridgesRef = bridges; for (const b of bridges) { if (b.hA === 0 && b.hB === 0) { const save = bridgesRef; bridgesRef = []; b.hA = groundH_L(b.ax * T, b.ay * T); b.hB = groundH_L(b.bx * T, b.by * T); bridgesRef = save; } b.hA = Math.max(b.hA, WL + 0.15); b.hB = Math.max(b.hB, WL + 0.15); } /* tabuleiro nunca abaixo da água */
  /* 25/10 (Erling: "a estrada da vila não tem uma ponte em curva de pedra bonita para atravessar?"): toda travessia curta de estrada vira
     ponte de pedra em arco; só as muito longas continuam de madeira (com cobertura) */
  for (const b of bridges) { if (b.stone) continue; const L = Math.hypot(b.bx - b.ax, b.by - b.ay); if (L * T > 26) continue; b.stone = true; b.half = 2.1; b.hump = Math.min(1.7, 0.45 + L * T * 0.055); }
  /* 25/10 (Erling: "vilas têm proteção: entrada com pórtico de madeira bruta e o nome escrito, muros de meia altura improvisados, soldados
     nas entradas segurando os bichos"): depois que as estradas existem, cada vila ganha um anel de muro baixo com aberturas onde as estradas
     entram; em cada abertura, um pórtico com o nome e um guarda */
  { const GN = ['Bjorn', 'Halla', 'Torsten', 'Edda', 'Arne', 'Sigrid', 'Leif', 'Runa', 'Gorm', 'Asta', 'Knut', 'Thyra', 'Ivar', 'Brenna', 'Ulf', 'Dagny'];
    /* 25/10 (Erling: "nada de círculo nem quadrado: é uma ocupação — um muro orgânico que acompanha a vila a alguns metros dos limites; vila é
       pobre, então musgo, partes quebradas e trechos faltando são normais e bem-vindos; vilas menores usam cerca de madeira; muro contínuo de
       pedras assentadas com lodo, cinza"). O contorno sai da própria ocupação: em cada direção, até onde vão as casas, as barracas e a praça,
       mais uma folga; depois é suavizado e ganha um pouco de irregularidade. */
    const OCC = new Set<PropKind>(['house', 'stall', 'fountain', 'campfire', 'totem', 'tent', 'chest', 'noticeboard', 'mailbox', 'temple', 'bench', 'torch']);
    for (const [si, st] of settlements.entries()) { if (st.kind !== 'village') continue; const cult = CULT[st.name] ?? 0, cx = st.x, cy = st.y, pal = cult === 1 || cult === 5;
      const NB = 48, far = new Array<number>(NB).fill(0), bin = (x: number, y: number) => ((Math.round(Math.atan2(y - cy, x - cx) / (Math.PI * 2) * NB) % NB) + NB) % NB;
      const mark = (x: number, y: number) => { const d = Math.hypot(x - cx, y - cy); if (d > st.radius + 9) return; const b = bin(x, y); far[b] = Math.max(far[b], d); };
      let nHouse = 0;
      for (const q of props) { if (!OCC.has(q.kind)) continue; const qx = q.gx + q.w / 2, qy = q.gy + q.h / 2; if (Math.hypot(qx - cx, qy - cy) > st.radius + 8) continue; if (q.kind === 'house') nHouse++;
        for (const [ax, ay] of [[q.gx, q.gy], [q.gx + q.w, q.gy], [q.gx, q.gy + q.h], [q.gx + q.w, q.gy + q.h], [qx, qy]]) mark(ax, ay); }
      for (let y = cy - 4; y <= cy + 4; y++) for (let x = cx - 4; x <= cx + 4; x++) if (inb(x, y) && map[y][x] === 'plaza') mark(x, y);
      /* direções vazias pegam o vizinho; depois suaviza duas vezes e põe a folga */
      for (let k = 0; k < NB; k++) if (far[k] < 5) far[k] = 0; for (let it = 0; it < NB; it++) for (let k = 0; k < NB; k++) if (!far[k]) { const a = far[(k + NB - 1) % NB], b = far[(k + 1) % NB]; if (a || b) far[k] = Math.max(a, b) * 0.96; }
      for (let k = 0; k < NB; k++) if (!far[k]) far[k] = 8;
      let rad = far.slice(); for (let it = 0; it < 3; it++) rad = rad.map((v, k) => (rad[(k + NB - 1) % NB] + v * 2 + rad[(k + 1) % NB]) / 4);
      const hs = (k: number) => { const v = Math.sin(k * 12.9898 + si * 78.233) * 43758.5453; return v - Math.floor(v); };
      const pts = rad.map((v, k) => { const a = k / NB * Math.PI * 2, r0 = Math.max(7, v + 3.2 + (hs(k) - 0.5) * 1.4); return { x: cx + Math.cos(a) * r0, y: cy + Math.sin(a) * r0 }; });
      /* amostras ao longo do contorno: onde há estrada, abre o portão */
      const samp: { x: number; y: number; ux: number; uy: number; road: boolean }[] = [];
      for (let k = 0; k < NB; k++) { const A = pts[k], B = pts[(k + 1) % NB], L = Math.hypot(B.x - A.x, B.y - A.y), n = Math.max(1, Math.ceil(L / 0.5)), ux = (B.x - A.x) / (L || 1), uy = (B.y - A.y) / (L || 1);
        for (let s = 0; s < n; s++) { const x = A.x + (B.x - A.x) * s / n, y = A.y + (B.y - A.y) * s / n, tx = Math.floor(x), ty = Math.floor(y); samp.push({ x, y, ux, uy, road: inb(tx, ty) && (map[ty][tx] === 'road' || map[ty][tx] === 'plaza') }); } }
      const gates: { x: number; y: number; ux: number; uy: number; w: number }[] = []; const gateAt = new Uint8Array(samp.length);
      { let i0 = -1; const S = samp.length; let start = 0; while (start < S && samp[start].road) start++; // começa fora de uma estrada
        for (let j = 0; j <= S; j++) { const i = (start + j) % S, on = j < S && samp[i].road; if (on && i0 < 0) i0 = j; if (!on && i0 >= 0) { const len = j - i0; if (len <= 16) { const mid = samp[(start + i0 + Math.floor(len / 2)) % S], dd = Math.hypot(mid.x - cx, mid.y - cy) || 1, ox2 = Math.floor(mid.x + (mid.x - cx) / dd * 3), oy2 = Math.floor(mid.y + (mid.y - cy) / dd * 3);
            /* só é portão se a estrada continua lá fora (trilha de porta de casa não conta) e se não há outro portão perto */
            if (inb(ox2, oy2) && map[oy2][ox2] === 'road' && !gates.some((q) => Math.hypot(q.x - mid.x, q.y - mid.y) < 9)) gates.push({ x: mid.x, y: mid.y, ux: mid.ux, uy: mid.uy, w: len * 0.5 }); }
          for (let q = i0 - 3; q < j + 3; q++) gateAt[((start + q) % S + S) % S] = 1; i0 = -1; } } }
      /* o muro (ou a cerca): pedaços de ~2,4 m seguindo o contorno, sem emenda; alguns faltando, outros desmoronados */
      const fence = pal || st.name === 'Karmika' ? -1 : cult === 2 ? 0 : nHouse <= 4 || cult === 4 || cult === 6 ? 1 : 0; /* 08/11 (Erling: "anão é pedra, ferro e forja — murinho de madeira tosco não"): vila anã sempre com muro baixo de pedra, inteiro */ // paliçada já existe · cerca de madeira · muro de pedra · Karmika tem a muralha (02/11: os muros de pedrão saem)
      if (fence >= 0) { const STEPS = 5; for (let i = 0; i + STEPS <= samp.length; i += STEPS) { let blocked = false; for (let q = i; q <= i + STEPS && !blocked; q++) if (gateAt[q % samp.length] || samp[q % samp.length].road) blocked = true; if (blocked) continue;
          const A = samp[i], B = samp[(i + STEPS) % samp.length], mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2, L = Math.hypot(B.x - A.x, B.y - A.y), hv = hs(i * 3.7 + 1);
          if (L < 0.2) continue; if (cult !== 2 && hv < (fence ? 0.08 : 0.13)) continue; // trecho que caiu de vez
          const gx = Math.floor(mx), gy = Math.floor(my); if (!inb(gx, gy) || map[gy][gx] === 'water' || map[gy][gx] === 'wall') continue;
          for (let k = props.length - 1; k >= 0; k--) { const q = props[k]; if ((q.kind === 'tree' || q.kind === 'rock' || q.kind === 'herb' || q.kind === 'bones') && Math.hypot(q.gx + 0.5 - mx, q.gy + 0.5 - my) < 1.3) props.splice(k, 1); }
          props.push({ kind: 'lowwall', gx, gy, w: 1, h: 1, height: 0.9, wall: 0, roof: 0, variant: fence ? 13 : 20 + cult, ry: Math.atan2(-(B.y - A.y), B.x - A.x), ox: (mx - gx) * T, oz: (my - gy) * T, len: L * T + 0.12, broken: cult !== 2 && hv < 0.32 ? 0.35 + hv : 0 });
          /* o muro baixo não trava mais tiles inteiros: o main.ts colide com o segmento de verdade (regra: nunca travar onde se vê espaço) */ } }
      /* 08/11 (Erling: "colocar luminosidade nas estradas próximas às vilas, todas elas"): postes de lampião ao longo das estradas que saem
         da vila, do muro até ~28 m fora, um a cada ~8 m, alternando o lado */
      { const lamps: [number, number][] = []; const R1 = st.radius + 2, R2 = st.radius + 15;
        for (let y = cy - R2; y <= cy + R2; y++) for (let x = cx - R2; x <= cx + R2; x++) { if (!inb(x, y) || map[y][x] !== 'road') continue; const d = Math.hypot(x - cx, y - cy); if (d < R1 || d > R2) continue;
          if (lamps.some(([lx, ly]) => Math.hypot(lx - x, ly - y) < 4)) continue; const side = lamps.length % 2 ? 1 : -1;
          const cand: [number, number][] = Math.abs(x - cx) > Math.abs(y - cy) ? [[x, y + side], [x, y - side]] : [[x + side, y], [x - side, y]];
          for (const [tx, ty] of cand) { if (!inb(tx, ty) || map[ty][tx] !== 'grass' || props.some((q) => q.gx === tx && q.gy === ty)) continue; props.push({ kind: 'torch', gx: tx, gy: ty, w: 1, h: 1, height: 2.0, wall: 0x3a2a1c, roof: 0xffb050 }); lamps.push([x, y]); break; } } }
      /* 08/11 (Erling: "bonecos de treino em toda vila"): dois bonecos de palha num canto de grama da vila. 09/11: nunca na praça nem ao lado da
         fonte (Erling: "boneco de treino no meio da praça já tínhamos tirado"); ficam a 8–13 tiles do centro, só em grama. Karmika não ganha nenhum: tem o Quartel */
      if (st.name !== 'Karmika') { let put = 0; for (let r0 = 8; r0 <= 13 && put < 2; r0++) for (let a = 0; a < 12 && put < 2; a++) { const ang = a / 12 * Math.PI * 2 + 0.3, x = Math.round(cx + Math.cos(ang) * r0), y = Math.round(cy + Math.sin(ang) * r0);
          if (!inb(x, y) || map[y][x] !== 'grass' || [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([ox, oy]) => inb(x + ox, y + oy) && (map[y + oy][x + ox] === 'plaza' || map[y + oy][x + ox] === 'road')) || props.some((q) => q.gx <= x && q.gx + q.w > x && q.gy <= y && q.gy + q.h > y) || quartel.dummies.some((d) => Math.hypot(d.x - x - 0.5, d.y - y - 0.5) < 1.6)) continue;
          quartel.dummies.push({ x: x + 0.5, y: y + 0.5 }); put++; } }
      /* pórtico com o nome e um guarda em cada entrada (até 3 guardas por vila) */
      gates.forEach((gt, gi) => { const gx = Math.floor(gt.x), gy = Math.floor(gt.y); props.push({ kind: 'vgate', gx, gy, w: 1, h: 1, height: 4.4, wall: 0, roof: 0, variant: cult, ry: Math.atan2(-gt.uy, gt.ux), ox: (gt.x - gx) * T, oz: (gt.y - gy) * T, len: Math.max(5, gt.w * T + 1.2), label: st.name });
        if (gi < 3) { const nx = -gt.uy, ny = gt.ux, toC = Math.sign((cx - gt.x) * nx + (cy - gt.y) * ny) || 1, side = gi % 2 ? -1 : 1, ox = gt.x + gt.ux * side * (gt.w / 2 + 1.6) + nx * toC * 0.9, oy = gt.y + gt.uy * side * (gt.w / 2 + 1.6) + ny * toC * 0.9;
          st.npcs.push({ name: GN[(si * 3 + gi) % GN.length], role: `Guarda do portão de ${st.name}`, kind: 'nordic', x: ox, y: oy, radius: 0.5, tint: 0x5a6a8a, scale: 1.0, lines: [`Bem-vindo a ${st.name}. Bicho não passa deste portão enquanto eu estiver de pé.`, 'Fique na estrada. O mato é dos lobos, e a estrada é nossa.', 'Viu alguma coisa estranha lá fora? Avise a guarda, não banque o herói sozinho.', 'O muro tem buraco, eu sei. Pedra custa, e quem conserta somos nós.'] }); } });
    } }
  /* 25/10 (Erling: "andar pelos caminhos é mais seguro: cercas de madeira, vigilância e pequenos fortes de vigia com soldados; perto da
     cidade grande as estradas ficam todas de pedra, com muros médios de pedra e defesas; nos lugares distantes, menos pedra, cercas de
     madeira e soldados mais simples"). O calçamento é pintado no chão (chunks3d: paveAt); aqui ficam as cercas, os muros e os fortes. */
  { const big = settlements.filter((q) => q.kind === 'city'), vil = settlements.filter((q) => q.kind === 'village');
    const tierAt = (x: number, y: number) => { let d = 1e9; for (const c of big) d = Math.min(d, Math.hypot(x - c.x, y - c.y) - 50); return d < 30 ? 2 : d < 110 ? 1 : 0; }; // 2 pedra · 1 misto · 0 ermo
    const nearVillage = (x: number, y: number) => vil.some((v) => Math.hypot(x - v.x, y - v.y) < v.radius + 5) || big.some((c) => Math.hypot(x - c.x, y - c.y) < 58);
    const SN = ['Halvar', 'Gudrun', 'Eskil', 'Ylva', 'Orm', 'Ragna', 'Sten', 'Hild', 'Tove', 'Brand', 'Sigvald', 'Ingeborg'];
    let posts = 0;
    roadPaths.forEach((path, pi) => { let run = 0, runOn = false, sinceFort = 40 + (pi * 37) % 60;
      for (let i = 1; i < path.length - 1; i++) { const p = path[i], q0 = path[i - 1], q1 = path[i + 1]; const dx = q1.x - q0.x, dy = q1.y - q0.y, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
        if (nearVillage(p.x, p.y)) { runOn = false; continue; }
        const tier = tierAt(p.x, p.y), h = ((Math.floor(p.x) * 73856093) ^ (Math.floor(p.y) * 19349663)) >>> 0;
        if (--run <= 0) { runOn = (h % 100) < (tier === 2 ? 85 : tier === 1 ? 45 : 18); run = 4 + (h % 6); }
        if (runOn) for (const sd of [-1, 1]) { /* um pedaço contínuo do ponto até o próximo, ao lado da estrada (sem emendas nem blocos soltos) */
          const ax = p.x + nx * sd * 2.6, ay = p.y + ny * sd * 2.6, bx = q1.x + nx * sd * 2.6, by = q1.y + ny * sd * 2.6, mx = (ax + bx) / 2, my = (ay + by) / 2, gx = Math.floor(mx), gy = Math.floor(my), SL = Math.hypot(bx - ax, by - ay);
          if (!inb(gx, gy) || map[gy][gx] !== 'grass' || SL < 0.3) continue;
          { /* as duas pontas também têm de estar em capim: nas junções de estradas uma ponta caía em cima da rua lateral */ const ex = Math.floor(ax), ey = Math.floor(ay), fx2 = Math.floor(bx), fy2 = Math.floor(by); if (!inb(ex, ey) || !inb(fx2, fy2) || map[ey][ex] !== 'grass' || map[fy2][fx2] !== 'grass') continue; }
          if (props.some((o) => o.gx === gx && o.gy === gy && o.kind !== 'tree' && o.kind !== 'rock' && o.kind !== 'herb')) continue;
          for (let k = props.length - 1; k >= 0; k--) { const o = props[k]; if (Math.hypot(o.gx + 0.5 - mx, o.gy + 0.5 - my) < 1.4 && (o.kind === 'tree' || o.kind === 'rock' || o.kind === 'herb')) props.splice(k, 1); }
          const hb = ((h >>> 3) % 100) / 100; if (tier < 2 && hb < 0.1) continue; // um vão aqui e ali
          props.push({ kind: 'lowwall', gx, gy, w: 1, h: 1, height: 0.9, wall: 0, roof: 0, variant: tier === 2 ? 20 : 13, ry: Math.atan2(-(by - ay), bx - ax), ox: (mx - gx) * T, oz: (my - gy) * T, len: SL * T + 0.1, broken: tier === 0 ? 0.3 + hb * 0.6 : tier === 1 && hb < 0.3 ? 0.4 : 0 }); }
        /* forte de vigia à beira da estrada: torre de pedra (perto da cidade) ou posto de madeira (no ermo), com dois soldados */
        if (--sinceFort <= 0 && posts < 40) { const sd = (h & 1) ? 1 : -1, fx = Math.round(p.x + nx * sd * 6), fy = Math.round(p.y + ny * sd * 6);
          let ok = true; for (let y = fy - 2; y <= fy + 2 && ok; y++) for (let x = fx - 2; x <= fx + 2; x++) { if (!inb(x, y) || map[y][x] !== 'grass') { ok = false; break; } const g = groundH_L((x + 0.5) * T, (y + 0.5) * T); if (g >= 10.5 || g <= WL - 2.4) { ok = false; break; } } /* 27/10: posto só onde dá para pisar (grama alta demais ilha os vigias) */
          if (ok) { sinceFort = 70 + (h % 40); posts++;
            for (let k = props.length - 1; k >= 0; k--) { const o = props[k]; if (Math.abs(o.gx - fx) <= 2 && Math.abs(o.gy - fy) <= 2 && (o.kind === 'tree' || o.kind === 'rock' || o.kind === 'herb')) props.splice(k, 1); }
            if (tier >= 1) { props.push({ kind: 'tower', gx: fx, gy: fy, w: 1, h: 1, height: tier === 2 ? 9 : 6.5, wall: 0x6e6a66, roof: tier === 2 ? 0x34445e : 0x5a3a28 }); map[fy][fx] = 'wall'; }
            else { props.push({ kind: 'tent', gx: fx - 1, gy: fy - 1, w: 2, h: 2, height: 2.4, wall: 0x7a6040, roof: 0x5a4028 }); for (let y = fy - 1; y <= fy; y++) for (let x = fx - 1; x <= fx; x++) map[y][x] = 'wall'; }
            props.push({ kind: 'campfire', gx: fx - sd * 0, gy: fy + 2, w: 1, h: 1, height: 0.6, wall: 0x4a4a4a, roof: 0xff8a2a });
            const home = vil.reduce((b, v) => Math.hypot(v.x - fx, v.y - fy) < Math.hypot(b.x - fx, b.y - fy) ? v : b, vil[0]);
            if (home) for (let k = 0; k < 2; k++) home.npcs.push({ name: SN[(posts * 2 + k) % SN.length], role: tier === 2 ? 'Soldado do Forte de Vigia' : tier === 1 ? 'Sentinela da Estrada' : 'Vigia do Posto', kind: 'nordic', x: fx + (k ? 1.6 : -1.6), y: fy + 2.2, radius: 1.2, tint: tier === 2 ? 0x4a5a7a : 0x6a5a3a, scale: 1.0,
              lines: tier === 2 ? ['A estrada é do rei até onde a vista alcança. Daqui para lá, é da sorte.', 'Quem anda na estrada anda com a guarda. Quem entra no mato, anda sozinho.', 'Temos cartazes de procurados no forte. Quem trouxer um deles vivo ganha bem.'] : tier === 1 ? ['Fique na estrada e na luz. É o melhor conselho que eu tenho de graça.', 'Os lobos não chegam na cerca. Os bandidos, às vezes, sim.', 'Se vir fumaça no mato, é bandido assando o que roubou. Avise a gente.'] : ['Aqui é o fim do mundo dos homens. Daqui para frente, a cerca acaba.', 'Somos dois e uma fogueira. Não é muito, mas assusta bicho.', 'Se quiser ganhar umas moedas, a gente precisa de alguém que ache o que fugiu para o mato.'] }); } } } }); }

  /* relíquias dos caminhantes: pedras rúnicas perto de cada assentamento e em lugares ermos — viagem rápida entre as conhecidas */
  const dgSpots: Record<string, { x: number; y: number }> = {};
  const relics: Relic[] = [];
  /* as relíquias são postas mais abaixo, depois das muralhas (para ficarem na saída dos portões, à beira da estrada) */

  /* pontos de interesse: acampamentos, covis, cemitério, ruínas */
  const safe = (x: number, y: number, minSd = 9) => {
    for (let rr = 0; rr < 30; rr++) for (let a = 0; a < 16; a++) {
      const px = x + Math.cos((a / 16) * 6.283) * rr, py = y + Math.sin((a / 16) * 6.283) * rr;
      if (inb(Math.floor(px), Math.floor(py)) && px > 6 && py > 6 && px < MAP_W_L - 6 && py < MAP_H_L - 6 && waterSD_L(px * T, py * T) > minSd) return { x: Math.round(px), y: Math.round(py) };
    }
    return { x, y };
  };
  const free = (x: number, y: number) => inb(x, y) && map[y][x] === 'grass';
  const addTent = (cx: number, cy: number, col: number) => { if (free(cx, cy) && free(cx + 1, cy + 1) && free(cx + 1, cy) && free(cx, cy + 1)) { block({ kind: 'tent', gx: cx, gy: cy, w: 2, h: 2, height: 2.4, wall: col, roof: 0x2a1c12 }); pads.push({ x: (cx + 1) * T, z: (cy + 1) * T, r: 4.2, h: groundH_L((cx + 1) * T, (cy + 1) * T) }); } };
  const addFire = (cx: number, cy: number) => { if (free(cx, cy)) block({ kind: 'campfire', gx: cx, gy: cy, w: 1, h: 1, height: 0.6, wall: 0x4a4a4a, roof: 0xff8a2a }); };
  const addRock = (cx: number, cy: number, big = false, variant = Math.floor(r() * 4)) => {
    const w = big ? 2 : 1;
    for (let dy = 0; dy < w; dy++) for (let dx = 0; dx < w; dx++) if (!free(cx + dx, cy + dy)) return;
    const bm = biome[cy]?.[cx] ?? 'meadow', q = r(); // estilo pela prancha 58, conforme o bioma
    const RS: Record<Biome, RockStyle[]> = { meadow: ['mossy', 'mossy', 'pebbles', 'slab'], forest: ['mossy', 'mossball', 'mossy', 'pebbles'], swamp: ['darkSmooth', 'mossball', 'darkSmooth', 'slab'], snow: ['ice', 'ice', 'peak', 'slab'], ruins: ['menhir', 'slab', 'mossy', 'pebbles'], rock: ['peak', 'peak', 'slab', 'copper'], volcanic: ['volcanic', 'volcanic', 'copper', 'obsidian'], enchanted: ['mossball', 'mossball', 'mossy', 'menhir'], blight: ['obsidian', 'obsidian', 'darkSmooth', 'menhir'], jungle: ['mossball', 'mossy', 'darkSmooth', 'pebbles'], coast: ['sandstone', 'sandstone', 'pebbles', 'slab'] };
    const rs = RS[bm][Math.floor(q * 4)];
    props.push({ kind: 'rock', rs, gx: cx, gy: cy, w, h: w, height: (rs === 'peak' || rs === 'menhir' ? 1.5 : rs === 'slab' || rs === 'pebbles' ? 0.5 : 1) * (big ? 2.6 + r() * 1.4 : 1.1 + r() * 0.8), wall: 0x6b6a68, roof: 0, variant }); /* 27/10: pedra não tranca o tile inteiro; só o miolo dela é sólido (SOLID_R no main) */
  };
  const addBones = (cx: number, cy: number, v = Math.floor(r() * 3)) => { if (free(cx, cy)) props.push({ kind: 'bones', gx: cx, gy: cy, w: 1, h: 1, height: 0.4, wall: 0xd8d0b8, roof: 0, variant: v }); };
  const addGrave = (cx: number, cy: number) => { if (free(cx, cy)) props.push({ kind: 'grave', gx: cx, gy: cy, w: 1, h: 1, height: 1.2, wall: 0x7a7a78, roof: 0, variant: Math.floor(r() * 3) }); };
  const addRuin = (cx: number, cy: number, w: number, h: number) => { for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) if (!free(cx + dx, cy + dy)) return; block({ kind: 'ruin', gx: cx, gy: cy, w, h, height: 2.5 + r() * 2, wall: 0x6a6860, roof: 0, variant: Math.floor(r() * 4) }); };

  const camp = (name: string, c0: { x: number; y: number }, biomeName: Biome, tents: number, col: number) => {
    const c = safe(c0.x, c0.y);
    pois.push({ name, x: c.x, y: c.y, biome: biomeName });
    addFire(c.x, c.y);
    for (let k = 0; k < tents; k++) { const a = (k / tents) * 6.283 + 0.5; addTent(Math.round(c.x + Math.cos(a) * 4) - 1, Math.round(c.y + Math.sin(a) * 4) - 1, col); }
    for (let k = 0; k < 4; k++) addBones(Math.round(c.x + (r() - 0.5) * 14), Math.round(c.y + (r() - 0.5) * 14));
    addBones(c.x + 2, c.y + 2, 2);
    for (let k = 0; k < 6; k++) addRock(Math.round(c.x + (r() - 0.5) * 16), Math.round(c.y + (r() - 0.5) * 16), r() < 0.3);
    return c;
  };
  /* 26/10 (Erling: "diversos acampamentos de bandidos e torres de vigia depois de pontes, com soldados que dão missões de caçar bandidos;
     ruas mais seguras que o mato"): nas estradas mais longas, um acampamento de salteadores escondido a uns 9 tiles da estrada,
     na metade do caminho; e, mais perto da vila, uma torre de vigia com um sargento e uma tocha */
  const BANDIT_ROADS: [string, string][] = [['Lundr', 'Karmika'], ['Karmika', 'Vestheim'], ['Karmika', 'Sudrholt'], ['Askavik', 'Lundr'], ['Vatnaholt', 'Lumenhal'], ['Myrbakki', 'Lumenhal'], ['Lundr', 'Eikvik'], ['Askavik', 'Hrafnhöfn'], ['Kaldrfoss', 'Midvangr'], ['Sudrholt', 'Vindholt']];
  const bandits: { name: string; x: number; y: number; road: [string, string]; tower: { x: number; y: number; sgt: string } | null }[] = [];
  { const SGT = ['Sargento Halvar', 'Sargenta Brynja', 'Sargento Eirik', 'Sargenta Solveig', 'Sargento Gunnar', 'Sargenta Astrid', 'Sargento Ragnvald', 'Sargenta Hild', 'Sargento Torvald', 'Sargenta Yrsa'];
    const CAMPN = ['Toca dos Salteadores', 'Acampamento da Forquilha', 'Covil do Machado Torto', 'Clareira dos Ladrões', 'Barraca do Cão Velho', 'Esconderijo da Pedra Rachada', 'Acampamento do Corvo Manco', 'Vau dos Saqueadores', 'Toca do Passo Frio', 'Acampamento da Vindima Roubada'];
    BANDIT_ROADS.forEach(([a, b], bi) => {
      const l = roadLinks.find((q) => (q.a === a && q.b === b) || (q.a === b && q.b === a)); if (!l) return; const path = roadPaths[l.i]; if (!path || path.length < 50) return;
      const mid = path[Math.floor(path.length * 0.5)], ahead = path[Math.min(path.length - 1, Math.floor(path.length * 0.5) + 6)];
      const dx = ahead.x - mid.x, dy = ahead.y - mid.y, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L; /* perpendicular à estrada */
      let c: { x: number; y: number } | null = null;
      for (const side of [1, -1]) for (const dist of [9, 11, 13, 7]) { const x = Math.round(mid.x + nx * dist * side), y = Math.round(mid.y + ny * dist * side); if (free(x, y) && waterSD_L(x * T, y * T) > 3 && !settlements.some((st) => Math.hypot(st.x - x, st.y - y) < st.radius + 14)) { c = { x, y }; break; } if (c) break; }
      if (!c) return;
      const name = CAMPN[bi % CAMPN.length]; camp(name, c, 'forest', 3, 0x5a4a30); addFire(c.x + 3, c.y - 2);
      if (free(c.x - 3, c.y + 2)) block({ kind: 'chest', gx: c.x - 3, gy: c.y + 2, w: 1, h: 1, height: 0.6, wall: 0x5a3a1a, roof: 0xd9a441 });
      spawns.push({ type: 'bandit', x: c.x, y: c.y, r: 5, n: 4, fixLvl: 5 + bi }, { type: 'bandit_arch', x: c.x + 2, y: c.y - 2, r: 4, n: 2, fixLvl: 5 + bi }, { type: 'bandit_chief', x: c.x, y: c.y + 1, r: 1, n: 1, fixLvl: 7 + bi });
      /* a torre: no quarto do caminho mais perto da vila de origem (a), encostada na estrada */
      const q = path[Math.floor(path.length * (l.a === a ? 0.22 : 0.78))], q2 = path[Math.min(path.length - 1, Math.floor(path.length * (l.a === a ? 0.22 : 0.78)) + 4)];
      const ddx = q2.x - q.x, ddy = q2.y - q.y, LL = Math.hypot(ddx, ddy) || 1, tnx = -ddy / LL, tny = ddx / LL; let tw: { x: number; y: number } | null = null;
      for (const side of [1, -1]) for (const dist of [3, 4, 5]) { const x = Math.round(q.x + tnx * dist * side), y = Math.round(q.y + tny * dist * side); if (free(x, y) && free(x + 1, y) && free(x, y + 1) && free(x + 1, y + 1) && waterSD_L(x * T, y * T) > 2) { tw = { x, y }; break; } if (tw) break; }
      let tower: typeof bandits[number]['tower'] = null;
      if (tw) { block({ kind: 'tower', gx: tw.x, gy: tw.y, w: 2, h: 2, height: 7, wall: 0x6e6a66, roof: 0x5a3a28 }); if (free(tw.x + 2, tw.y + 2)) props.push({ kind: 'torch', gx: tw.x + 2, gy: tw.y + 2, w: 1, h: 1, height: 2.2, wall: 0x5a3a1a, roof: 0xff9a3a });
        const sgt = SGT[bi % SGT.length]; tower = { x: tw.x + 2.5, y: tw.y - 0.5, sgt };
        const home = settlements.find((st) => st.name === a) ?? settlements[0];
        home.npcs.push({ name: sgt, role: `Vigia da estrada · ${a} → ${b}`, kind: 'nordic', x: tw.x + 2.5, y: tw.y - 0.5, radius: 1.5, tint: 0x5a6a8a, scale: 1.02, lines: [`Daqui vejo a estrada até ${b}. O que não vejo é o que se esconde no mato.`, `A ${name} fica a meio caminho, fora da estrada. Quem anda pelo mato perto de lá, não volta inteiro.`, 'A patrulha sai da cidade e volta. Entre uma e outra, a estrada é sua.'] }); }
      bandits.push({ name, x: c.x, y: c.y, road: [a, b], tower }); }); }
  const cDraugr = camp('Acampamento Draugr', K(10, 160), 'ruins', 4, 0x4a4a52); /* 02/11 (Erling: "calabouço na saída da cidade"): o acampamento (e o Túmulo dos Draugr) saem da porta de Karmika para o sudeste */
  const cWolf = camp('Covil dos Lobos', K(120, 62), 'forest', 2, 0x5a3a28);
  const cSwamp = camp('Atoleiro de Zerath', K(22, 66), 'swamp', 3, 0x4a5a3a);
  const cIce = camp('Cume Gelado', K(70, 16), 'snow', 3, 0x8a96aa);
  const cRock = camp('Garganta de Pedra', K(120, 120), 'rock', 2, 0x5a5048);
  // clareira do Torturador de Bestas (elite): no meio da floresta, a leste
  { const c = safe(-8 + OFX_L, 92 + OFY_L, 14); /* 02/11: mais a oeste — antes ficava colada na Toca, no Mausoléu e na muralha */ pois.push({ name: 'Clareira dos Gritos', x: c.x, y: c.y, biome: 'forest' });
    for (let k = 0; k < 10; k++) addBones(c.x + Math.round((r() - 0.5) * 10), c.y + Math.round((r() - 0.5) * 8));
    addFire(c.x + 2, c.y + 1);
    spawns.push({ type: 'tormentor', x: c.x, y: c.y, r: 1, n: 1, keep: true }, { type: 'imp', x: c.x, y: c.y, r: 6, n: 3 }); }
  // cemitério e ruínas
  const gy0 = safe(48 + OFX_L, 118 + OFY_L);
  pois.push({ name: 'Cemitério Esquecido', x: gy0.x, y: gy0.y, biome: 'ruins' });
  for (let k = 0; k < 8; k++) addBones(gy0.x + Math.round((r() - 0.5) * 16), gy0.y + Math.round((r() - 0.5) * 12));
  for (let k = 0; k < 26; k++) addGrave(gy0.x + Math.round((r() - 0.5) * 14), gy0.y + Math.round((r() - 0.5) * 10));
  // cemitério e igreja abandonada perto da cidade (leste)
  const ch0 = safe(132 + OFX_L, 55 + OFY_L, 12); // 02/11 (Erling): a igreja ficava colada na muralha de Karmika; agora a sudeste, depois do lago, com o cemitério ao sul da nave
  for (let y = ch0.y - 2; y <= ch0.y + 13; y++) for (let x = ch0.x - 6; x <= ch0.x + 13; x++) if (inb(x, y) && map[y][x] === 'tree') { map[y][x] = 'grass'; const i = props.findIndex((p) => p.kind === 'tree' && p.gx === x && p.gy === y); if (i >= 0) props.splice(i, 1); }
  if (free(ch0.x, ch0.y)) block({ kind: 'church', gx: ch0.x, gy: ch0.y, w: 5, h: 4, height: 7, wall: 0x6d6a64, roof: 0x4a3a34, variant: 1 });
  pois.push({ name: 'Igreja Abandonada', x: ch0.x + 2, y: ch0.y + 2, biome: 'ruins' });
  // Primeiro lugar vampírico: a Cripta de Hemara (oeste, entre pântano e terras antigas)
  { const v = safe(112 + SH, 300 + SH, 10); const st: Settlement = { name: 'Cripta de Hemara', kind: 'village', x: v.x, y: v.y, radius: 7, npcs: [] }; settlements.push(st);
    for (let y = v.y - 8; y <= v.y + 8; y++) for (let x = v.x - 8; x <= v.x + 8; x++) if (inb(x, y) && map[y][x] === 'tree') { map[y][x] = 'grass'; const i = props.findIndex((p) => p.kind === 'tree' && p.gx === x && p.gy === y); if (i >= 0) props.splice(i, 1); }
    if (free(v.x, v.y - 3) && free(v.x + 4, v.y)) block({ kind: 'church', gx: v.x - 2, gy: v.y - 4, w: 5, h: 4, height: 6, wall: 0x4a3a4a, roof: 0x2a1a2a, variant: 1 });
    for (let k = 0; k < 14; k++) addGrave(v.x - 7 + Math.round(r() * 14), v.y + 1 + Math.round(r() * 6)); for (let k = 0; k < 6; k++) addBones(v.x - 7 + Math.round(r() * 14), v.y - 7 + Math.round(r() * 14));
    for (const [tx, ty] of [[v.x - 3, v.y + 1], [v.x + 3, v.y + 1]]) if (free(tx, ty)) props.push({ kind: 'torch', gx: tx, gy: ty, w: 1, h: 1, height: 1.9, wall: 0x3a2a1c, roof: 0xff8a2a });
    pois.push({ name: 'Cripta de Hemara', x: v.x, y: v.y, biome: 'ruins' });
    { /* 02/11 (Erling: TODA cidade tem fonte): a Fonte de Hemara, de pedra escura e água rubra, na frente da cripta */ const fx = v.x + 4, fy = v.y + 3; if (free(fx, fy) && free(fx + 1, fy) && free(fx, fy + 1) && free(fx + 1, fy + 1)) props.push({ kind: 'fountain', gx: fx, gy: fy, w: 2, h: 2, height: 0.7, wall: 0x3a2e3a, roof: 0x8a2a3a, variant: 1 }); }
    st.npcs.push({ name: 'Lady Morwen', role: 'Senhora do Sangue', kind: 'nordic', x: v.x, y: v.y + 1.5, radius: 1.2, tint: 0x7a5a8a, scale: 1.0, lines: ['Hemara nunca obrigou ninguém. Ela espera. Eu também.', 'A mordida é um caminho: sede, noite eterna, força que não envelhece — e caçadores de Aravel no seu encalço até o fim das vidas.', 'Volte com o seu próprio sangue provado: nível 30. Então conversaremos sobre a primeira noite.'] });
    spawns.push({ type: 'rat', x: v.x - 5, y: v.y + 4, r: 4, n: 3 }); }
  // Primeiro lugar licantropo: a Clareira de Selvar (floresta do leste)
  { const v = safe(396 + SH + 36, 262 + SH + 4, 10); /* 27/10: a clareira ficava debaixo da colina da Abadia da Aurora */ const st: Settlement = { name: 'Clareira de Selvar', kind: 'village', x: v.x, y: v.y, radius: 7, npcs: [] }; settlements.push(st);
    for (let y = v.y - 4; y <= v.y + 4; y++) for (let x = v.x - 4; x <= v.x + 4; x++) if (inb(x, y) && map[y][x] === 'tree') { map[y][x] = 'grass'; const i = props.findIndex((p) => p.kind === 'tree' && p.gx === x && p.gy === y); if (i >= 0) props.splice(i, 1); }
    if (free(v.x, v.y)) block({ kind: 'campfire', gx: v.x, gy: v.y, w: 1, h: 1, height: 0.6, wall: 0x4a4a4a, roof: 0xff8a2a });
    for (const [tx, ty] of [[v.x - 4, v.y - 3], [v.x + 3, v.y - 3], [v.x + 3, v.y + 2]]) if (free(tx, ty) && free(tx + 1, ty + 1) && free(tx + 1, ty) && free(tx, ty + 1)) block({ kind: 'tent', gx: tx, gy: ty, w: 2, h: 2, height: 2.4, wall: 0x5a4a3a, roof: 0x3a2a1a });
    for (let k = 0; k < 7; k++) addBones(v.x - 6 + Math.round(r() * 12), v.y - 6 + Math.round(r() * 12));
    pois.push({ name: 'Clareira de Selvar', x: v.x, y: v.y, biome: 'forest' });
    { /* 02/11 (Erling: TODA cidade tem fonte): a fonte da clareira — pedra bruta com musgo, água da mata */ const fx = v.x - 2, fy = v.y + 3; if (free(fx, fy) && free(fx + 1, fy) && free(fx, fy + 1) && free(fx + 1, fy + 1)) props.push({ kind: 'fountain', gx: fx, gy: fy, w: 2, h: 2, height: 0.7, wall: 0x5a6a48, roof: 0x4a9a7a, variant: 1 }); }
    st.npcs.push({ name: 'Ulfrik', role: 'Alfa da Matilha', kind: 'nordic', x: v.x - 1.5, y: v.y + 1.5, radius: 1.5, tint: 0x6a6a72, scale: 1.1, lines: ['A alcateia protege quem está dentro até a morte. Quem está fora é presa ou aliado. Escolha.', 'Selvar corre nas noites de lua. Quem recebe a marca corre junto — e nunca mais dorme em cama.', 'Prove que sobrevive à floresta sozinho: nível 30. Depois a matilha decide se você é lobo.'] });
    spawns.push({ type: 'wolf', x: v.x + 6, y: v.y + 6, r: 5, n: 4 }); }
  /* 26/10 (Erling: "todas as vilas têm que estar ligadas por estradas e pontes"): a Cripta de Hemara e a Clareira de Selvar ganham a sua estrada */
  for (const [nm, to] of [['Cripta de Hemara', 'Myrbakki'], ['Clareira de Selvar', 'Austrvik']] as [string, string][]) { const st = settlements.find((q) => q.name === nm); if (st) { PLACE[nm] = [st.x, st.y + 2]; route(nm, to, 1.05); } }
  /* 02/11: os lugares novos do mapa vazio (WILD_L, lá em cima): clareira, enfeites, bichos e o dono do lugar */
  for (const w of WILD_L) { const c = { x: w.x, y: w.y }, rw = rng(w.x * 131 + w.y * 7 + 5), L = w.lake ?? 0;
    const at = (d0: number, d1: number) => { const a = rw() * 6.283, d = d0 + rw() * (d1 - d0); return [Math.round(c.x + Math.cos(a) * d), Math.round(c.y + Math.sin(a) * d)] as const; };
    for (let y = c.y - w.clear; y <= c.y + w.clear; y++) for (let x = c.x - w.clear; x <= c.x + w.clear; x++) if (inb(x, y) && map[y][x] === 'tree' && Math.hypot(x - c.x, y - c.y) <= w.clear) { map[y][x] = 'grass'; const i = props.findIndex((p) => p.kind === 'tree' && p.gx === x && p.gy === y); if (i >= 0) props.splice(i, 1); }
    pois.push({ name: w.name, x: c.x, y: c.y, biome: biomeAt_L(c.x, c.y) });
    if (w.kind === 'sereias') { /* pedras de sentar na margem (é dali que elas cantam) e os ossos roídos de quem chegou perto */
      for (let k = 0; k < 6; k++) { const a = (k / 6) * 6.283 + rw() * 0.5, d = L + 1.5 + rw() * 1.5; addRock(Math.round(c.x + Math.cos(a) * d), Math.round(c.y + Math.sin(a) * d), k % 3 === 0); }
      for (let k = 0; k < 12; k++) { const [x, y] = at(L + 1.5, L + 6); addBones(x, y); }
      spawns.push({ type: 'siren', x: c.x, y: c.y, r: L, n: 4, keep: true }, { type: 'siren_queen', x: c.x, y: c.y, r: 1, n: 1, keep: true });
    } else if (w.kind === 'goblins') { /* barracas de couro remendado, fogueira, totens de caveira (tochas) e o lixo dos saques */
      for (const [ox, oy] of [[-5, -4], [3, -5], [4, 2], [-6, 2]]) addTent(c.x + ox, c.y + oy, 0x5a6a2a);
      addFire(c.x, c.y);
      for (let k = 0; k < 9; k++) { const [x, y] = at(2, 8); addBones(x, y); }
      for (let k = 0; k < 4; k++) { const [x, y] = at(5, 7); if (free(x, y)) props.push({ kind: 'torch', gx: x, gy: y, w: 1, h: 1, height: 1.8, wall: 0x3a2a1c, roof: 0x9aff5a }); }
      spawns.push({ type: 'goblin', x: c.x, y: c.y, r: 7, n: 6, keep: true }, { type: 'goblin_shaman', x: c.x, y: c.y, r: 5, n: 2, keep: true }, { type: 'goblin_chief', x: c.x, y: c.y, r: 1, n: 1, keep: true });
    } else if (w.kind === 'gruta') { /* pedras em volta da boca, ossos e duas lápides sem nome; os espíritos rondam à noite (a entrada é um calabouço) */
      for (let k = 0; k < 6; k++) { const [x, y] = at(3, 7); addRock(x, y, k < 2); }
      for (let k = 0; k < 7; k++) { const [x, y] = at(2, 8); addBones(x, y); }
      for (let k = 0; k < 2; k++) { const [x, y] = at(4, 7); addGrave(x, y); }
      spawns.push({ type: 'spirit', x: c.x, y: c.y, r: 8, n: 4, night: true });
    } else { /* o oásis: palmeiras em anel, verde na margem — e, mais longe, os ossos de quem bebeu a areia */
      for (let k = 0; k < 20; k++) { const a = (k / 20) * 6.283 + rw() * 0.25, d = L + 2 + rw() * 3, x = Math.round(c.x + Math.cos(a) * d), y = Math.round(c.y + Math.sin(a) * d);
        if (free(x, y) && map[y][x - 1] !== 'tree' && map[y - 1]?.[x] !== 'tree') { props.push({ kind: 'tree', sp: 'palm', gx: x, gy: y, w: 1, h: 1, height: 5.5 + rw() * 3, wall: 0x6a4a2a, roof: 0x3f8a3a, variant: 0 }); map[y][x] = 'tree'; } }
      for (let k = 0; k < 16; k++) { const [x, y] = at(L + 1, L + 6); if (free(x, y)) props.push({ kind: 'plant', plant: pickPlant('jungle', rw()), gx: x, gy: y, w: 1, h: 1, height: 0.6, wall: 0, roof: 0, variant: Math.floor(rw() * 3) }); }
      for (let k = 0; k < 10; k++) { const [x, y] = at(L + 7, L + 12); addBones(x, y); }
      for (let k = 0; k < 4; k++) { const [x, y] = at(L + 8, L + 12); addRock(x, y, k === 0); }
      spawns.push({ type: 'djinn', x: c.x, y: c.y, r: 1, n: 1, keep: true }, { type: 'scorpion', x: c.x, y: c.y, r: 14, n: 4 });
    } }
  // Catedral Abandonada (sul, terras antigas): 3 criptas descendo até o santuário do Sacerdote Maldito
  const cat = safe(CATHEDRAL_L.x, CATHEDRAL_L.y, 12);
  for (let y = cat.y - 10; y <= cat.y + 22; y++) for (let x = cat.x - 10; x <= cat.x + 18; x++) if (inb(x, y) && map[y][x] === 'tree') { map[y][x] = 'grass'; const i = props.findIndex((p) => p.kind === 'tree' && p.gx === x && p.gy === y); if (i >= 0) props.splice(i, 1); }
  // a Catedral é gigantesca: 26×38 m, 24 m de altura, torres nos cantos, adro de pedra e escadaria
  for (let y = cat.y - 2; y <= cat.y + 26; y++) for (let x = cat.x - 4; x <= cat.x + 16; x++) if (inb(x, y) && (map[y][x] === 'grass' || map[y][x] === 'tree')) { if (map[y][x] === 'tree') { const i = props.findIndex((p) => p.kind === 'tree' && p.gx === x && p.gy === y); if (i >= 0) props.splice(i, 1); } map[y][x] = y >= cat.y + 19 && y <= cat.y + 26 && x >= cat.x && x <= cat.x + 12 ? 'plaza' : 'grass'; }
  block({ kind: 'church', gx: cat.x, gy: cat.y, w: 13, h: 19, height: 24, wall: 0x8a8680, roof: 0x4a4258, variant: 2 });
  for (const [tx, ty] of [[cat.x - 1, cat.y - 1], [cat.x + 13, cat.y - 1], [cat.x - 1, cat.y + 18], [cat.x + 13, cat.y + 18]]) if (inb(tx, ty) && map[ty][tx] !== 'wall') { props.push({ kind: 'tower', gx: tx, gy: ty, w: 1, h: 1, height: 20, wall: 0x4e4a46, roof: 0x2e2630 }); map[ty][tx] = 'wall'; }
  pois.push({ name: 'Catedral Abandonada', x: cat.x + 6, y: cat.y + 9, biome: 'ruins' });
  // terreno da Catedral: cemitério enorme com sepulcros, caixões, ossadas, poças de pântano, cercado por grade de ferro retorcida com aberturas
  { const x0 = cat.x - 28, x1 = cat.x + 40, y0 = cat.y - 16, y1 = cat.y + 46;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (inb(x, y) && map[y][x] === 'tree') { map[y][x] = 'grass'; const i = props.findIndex((p) => p.kind === 'tree' && p.gx === x && p.gy === y); if (i >= 0) props.splice(i, 1); }
    const rg = rng(77);
    for (let k = 0; k < 9; k++) { const px = x0 + 4 + Math.floor(rg() * (x1 - x0 - 8)), py = y0 + 4 + Math.floor(rg() * (y1 - y0 - 8)), rad = 2 + Math.floor(rg() * 2); if (Math.abs(px - (cat.x + 6)) < 12 && py > cat.y - 4 && py < cat.y + 30) continue; for (let y = py - rad; y <= py + rad; y++) for (let x = px - rad; x <= px + rad; x++) if (inb(x, y) && Math.hypot(x - px, y - py) <= rad + (rg() - 0.5) && map[y][x] === 'grass') map[y][x] = 'water'; }
    // 300% mais: túmulos, caixões, ossadas, anjos, santos, obeliscos, mausoléus e árvores mortas — o campo santo inteiro
    const solid = (kind: PropKind, gx: number, gy: number, w: number, h: number, height: number, variant: number) => { for (let y = gy; y < gy + h; y++) for (let x = gx; x < gx + w; x++) if (!inb(x, y) || map[y][x] !== 'grass') return false; props.push({ kind, gx, gy, w, h, height, wall: 0x6a6660, roof: 0x3a3640, variant }); /* só o mausoléu tranca o tile; anjo/santo/obelisco/árvore morta barram só o miolo (SOLID_R no main) — regra 12 */ if (kind === 'mausoleum') for (let y = gy; y < gy + h; y++) for (let x = gx; x < gx + w; x++) map[y][x] = 'wall'; return true; };
    const inCat = (gx: number, gy: number) => gx >= cat.x - 5 && gx <= cat.x + 17 && gy >= cat.y - 3 && gy <= cat.y + 28;
    const aisle = (gx: number) => Math.abs(gx - (cat.x + 6)) <= 2; // avenida central do portão até a escadaria fica livre
    for (let k = 0; k < 340; k++) { const gx = x0 + 2 + Math.floor(rg() * (x1 - x0 - 4)), gy = y0 + 2 + Math.floor(rg() * (y1 - y0 - 4)); if (inCat(gx, gy) || (aisle(gx) && gy > cat.y + 20)) continue; const v = rg();
      if (v < 0.42) addGrave(gx, gy);
      else if (v < 0.54 && free(gx, gy)) { props.push({ kind: 'coffin', gx, gy, w: 1, h: 1, height: 0.6, wall: 0x3a2a1c, roof: 0x2a1a10, variant: Math.floor(rg() * 3) }); }
      else if (v < 0.66) addBones(gx, gy);
      else if (v < 0.74) solid('angel', gx, gy, 1, 1, rg(), rg() < 0.15 ? 2 : rg() < 0.5 ? 1 : 0);
      else if (v < 0.8) solid('obelisk', gx, gy, 1, 1, 1, Math.floor(rg() * 3));
      else if (v < 0.84) solid('saint', gx, gy, 1, 1, rg(), 0);
      else if (v < 0.89) solid('mausoleum', gx, gy, 2, 2, 3.2 + rg() * 1.5, 0);
      else if (v < 0.95) solid('deadtree', gx, gy, 1, 1, 4.5 + rg() * 3, rg() < 0.25 ? 1 : 0);
      else if (free(gx, gy)) props.push({ kind: 'corpse', gx, gy, w: 1, h: 1, height: 0.3, wall: 0, roof: 0, variant: 0 }); }
    // avenida dos anjos: pares de anjos guardiões do portão até a escadaria
    for (let gy = y1 - 3; gy > cat.y + 27; gy -= 3) for (const s2 of [-3, 3]) solid('angel', cat.x + 6 + s2, gy, 1, 1, s2 < 0 ? 0.25 : 0.75, 2);
    // O MAUSOLÉU: grande sepulcro do Bispo (com a cova para as profundezas) cercado por sua própria grade gigante
    { const mx = cat.x + 26, my = cat.y + 6; const GONE_M = new Set(['grave', 'coffin', 'bones', 'angel', 'obelisk', 'saint', 'deadtree', 'mausoleum', 'corpse']); /* limpa o terreno do mausoléu (pelos props, não pelo mapa: estátuas já não marcam 'wall') */
      for (let pi = props.length - 1; pi >= 0; pi--) { const q = props[pi]; if (!GONE_M.has(q.kind) || q.gx < mx - 6 || q.gx > mx + 11 || q.gy < my - 6 || q.gy > my + 11) continue; props.splice(pi, 1); for (let yy = q.gy; yy < q.gy + q.h; yy++) for (let xx = q.gx; xx < q.gx + q.w; xx++) if (inb(xx, yy) && map[yy][xx] === 'wall') map[yy][xx] = 'grass'; }
      for (let y = my - 6; y <= my + 11; y++) for (let x = mx - 6; x <= mx + 11; x++) if (inb(x, y) && map[y][x] === 'wall' && !props.some((q) => q.gx <= x && x < q.gx + q.w && q.gy <= y && y < q.gy + q.h)) map[y][x] = 'grass';
      solid('mausoleum', mx, my, 6, 6, 7, 1); pois.push({ name: 'Mausoléu do Bispo', x: mx + 3, y: my + 7, biome: 'ruins' });
      for (const [ax, ay] of [[mx - 2, my + 7], [mx + 7, my + 7], [mx - 2, my - 2], [mx + 7, my - 2]]) solid('angel', ax, ay, 1, 1, 0.5, 2);
      const fx0 = mx - 5, fx1 = mx + 10, fy0 = my - 5, fy1 = my + 10;
      for (let x = fx0; x <= fx1; x++) for (const y of [fy0, fy1]) { if (y === fy1 && Math.abs(x - (mx + 2.5)) < 2) continue; if ((x - fx0) % 5 === 0) solid('gpillar', x, y, 1, 1, 6, 0); else solid('gfence', x, y, 1, 1, 4.6, 0); }
      for (let y = fy0 + 1; y < fy1; y++) for (const x of [fx0, fx1]) { if ((y - fy0) % 5 === 0) solid('gpillar', x, y, 1, 1, 6, 0); else solid('gfence', x, y, 1, 1, 4.6, 1); }
      spawns.push({ type: 'skeleton', x: mx + 3, y: my + 8, r: 3, n: 3 });
      { /* 02/11 (Erling): a boca dos Túneis de Orrukh fica DENTRO do cemitério, ao lado do mausoléu (masmorras.ts: near 'Mausoléu do Bispo' dx 5 dy 1, spot) — clareira reservada */
        const px = mx + 8, py = my + 8, SOFT_G = new Set(['grave', 'bones', 'coffin', 'angel', 'obelisk', 'saint', 'deadtree', 'corpse', 'torch', 'tree', 'rock', 'herb']);
        for (let i = props.length - 1; i >= 0; i--) { const q = props[i]; if (SOFT_G.has(q.kind) && Math.abs(q.gx - px) <= 2 && Math.abs(q.gy - py) <= 2) { props.splice(i, 1); if (map[q.gy]?.[q.gx] === 'wall' || map[q.gy]?.[q.gx] === 'tree') map[q.gy][q.gx] = 'grass'; } } } }
    // À NOITE o campo santo acorda: mortos, carniçais, morcegos e esqueletos saem das covas
    for (let k = 0; k < 10; k++) spawns.push({ type: (['skeleton', 'zombie', 'ghoul', 'bat', 'skeleton'] as EnemyType[])[k % 5], x: x0 + 6 + Math.floor(rg() * (x1 - x0 - 12)), y: y0 + 6 + Math.floor(rg() * (y1 - y0 - 12)), r: 5, n: 3, night: true });
    // tochas e lamparinas: pilares do portão, avenida dos anjos, mausoléu e trilhas — sem elas a noite aqui é cega
    const torchAt = (gx: number, gy: number) => { if (inb(gx, gy) && (map[gy][gx] === 'grass' || map[gy][gx] === 'road')) props.push({ kind: 'torch', gx, gy, w: 1, h: 1, height: 2.2, wall: 0x3a2a1c, roof: 0xff8a2a }); };
    for (let gy = y1 - 2; gy > cat.y + 27; gy -= 4) { torchAt(cat.x + 6 - 2, gy); torchAt(cat.x + 6 + 2, gy); }
    for (let gy = y0 + 4; gy <= y1 - 4; gy += 9) for (let gx = x0 + 4; gx <= x1 - 4; gx += 9) torchAt(gx, gy); /* em grade, não espalhadas a esmo (Erling: 'aleatoriedade que deu errado') */
    for (const [tx, ty] of [[cat.x + 21, cat.y + 2], [cat.x + 36, cat.y + 2], [cat.x + 21, cat.y + 17], [cat.x + 36, cat.y + 17], [cat.x + 27, cat.y + 17], [cat.x + 31, cat.y + 17]]) torchAt(tx, ty);
    // névoa rasteira pelo cemitério inteiro
    // (névoa rasteira removida: escurecia a região e pesava)
    for (let k = 0; k < 6; k++) { const gx = x0 + 3 + Math.floor(rg() * (x1 - x0 - 6)), gy = y0 + 3 + Math.floor(rg() * (y1 - y0 - 6)); if (free(gx, gy)) { props.push({ kind: 'tree', gx, gy, w: 1, h: 1, height: 5 + rg() * 3, wall: 0x2a1a10, roof: 0x3a3a2a, variant: 1 }); map[gy][gx] = 'tree'; } }
    const fence: [number, number, number][] = []; // x, y, variant (0 = E-O, 1 = N-S)
    for (let x = x0; x <= x1; x++) { fence.push([x, y0, 0], [x, y1, 0]); } for (let y = y0; y <= y1; y++) { fence.push([x0, y, 1], [x1, y, 1]); }
    for (const [fx, fy, v] of fence) { if (!inb(fx, fy) || map[fy][fx] !== 'grass') continue; const along = v ? fy - y0 : fx - x0; if (along % 21 >= 9 && along % 21 <= 10) continue; /* brechas onde a grade cedeu */ if (v === 0 && fy === y1 && Math.abs(fx - (cat.x + 6)) <= 2) continue; /* portão da frente */ const pil = along % 7 === 0; props.push({ kind: pil ? 'gpillar' : 'gfence', gx: fx, gy: fy, w: 1, h: 1, height: pil ? 6 : 4.6, wall: 0x2a2a30, roof: 0, variant: v }); map[fy][fx] = 'wall'; }
    props.push({ kind: 'ggate', gx: cat.x + 4, gy: y1, w: 5, h: 1, height: 8.5, wall: 0, roof: 0, variant: 0 });
    // rio negro e fétido cortando o campo santo de oeste a leste (e todas as poças viram piche)
    { let ry = y0 + 12 + Math.floor(rg() * 6); for (let x = x0 - 20; x <= x1 + 24; x++) { ry += Math.round((rg() - 0.5) * 1.6 + Math.sin(x * 0.12) * 0.6); ry = Math.max(y0 + 4, Math.min(cat.y - 6, ry)); for (let w = -1; w <= 1; w++) { const yy = ry + w; if (inb(x, yy) && (map[yy][x] === 'grass' || map[yy][x] === 'tree' || map[yy][x] === 'road')) { if (map[yy][x] === 'tree') { const pi = props.findIndex((q) => q.kind === 'tree' && q.gx === x && q.gy === yy); if (pi >= 0) props.splice(pi, 1); } map[yy][x] = 'water'; } } } }
    for (let y = y0 - 22; y <= y1 + 22; y++) for (let x = x0 - 22; x <= x1 + 26; x++) if (inb(x, y) && map[y][x] === 'water') props.push({ kind: 'tar', gx: x, gy: y, w: 1, h: 1, height: 0, wall: 0, roof: 0, variant: 0 });
    spawns.push({ type: 'skeleton', x: x0 + 12, y: y1 - 10, r: 6, n: 4 }, { type: 'skeleton', x: x1 - 10, y: y0 + 24, r: 6, n: 4 }, { type: 'bat', x: cat.x + 6, y: cat.y - 8, r: 9, n: 5 }, { type: 'bat', x: x0 + 10, y: y0 + 10, r: 8, n: 4 });
    { const dx = x0 - 14, dy = y0 + 20; pois.push({ name: 'Covil dos Lobisomens', x: dx, y: dy, biome: 'forest' }); for (let k = 0; k < 10; k++) addBones(dx - 4 + Math.round(rg() * 8), dy - 4 + Math.round(rg() * 8)); for (let k = 0; k < 4; k++) { const tx = dx - 5 + Math.round(rg() * 10), ty = dy - 5 + Math.round(rg() * 10); if (inb(tx, ty) && map[ty][tx] === 'grass') { props.push({ kind: 'deadtree', gx: tx, gy: ty, w: 1, h: 1, height: 5 + rg() * 2, wall: 0, roof: 0, variant: 1 }); map[ty][tx] = 'wall'; } } spawns.push({ type: 'werewolf', x: dx, y: dy, r: 5, n: 3 }); }
    for (let k = 0; k < 5; k++) spawns.push({ type: 'zombie', x: x0 + 8 + Math.floor(rg() * (x1 - x0 - 16)), y: y0 + 8 + Math.floor(rg() * (y1 - y0 - 16)), r: 5, n: 3 }); spawns.push({ type: 'ghoul', x: cat.x + 24, y: cat.y + 36, r: 5, n: 2 }, { type: 'ghoul', x: cat.x - 16, y: cat.y + 2, r: 5, n: 2 }); }
  /* VILAS DE KARMA NEGATIVO perto da Catedral: névoa, gente doente e deprimida, trigo morto, árvores retorcidas com enforcados,
     corpos pelo chão, poço seco, altar de sacrifício; mais casebres e barracas abandonadas */
  for (const nm of ['Sudrholt', 'Steinfoss', 'Sandvik']) {
    const st = settlements.find((q) => q.name === nm); if (!st) continue; const rc = rng(nm.length * 991 + 7), cx = st.x, cy = st.y;
    /* 02/11 (Erling: "TODAS as cidades têm fonte" — é onde se salva e onde o vídeo da cidade acontece): a fonte fica; o poço seco vai para o lado */
    { const fi = props.findIndex((q) => q.kind === 'fountain' && Math.abs(q.gx + 1 - cx) < 2 && Math.abs(q.gy + 1 - cy) < 2); if (fi >= 0) { const f = props[fi]; f.wall = 0x4a4440; f.roof = 0x3a6a7a; /* fonte escura, água turva */ for (const [ox, oy] of [[4, -3], [-5, -3], [4, 3], [-5, 3]]) { const gx = f.gx + ox, gy = f.gy + oy; let ok = true; for (let y = gy; y < gy + 2 && ok; y++) for (let x = gx; x < gx + 2; x++) if (!inb(x, y) || (map[y][x] !== 'grass' && map[y][x] !== 'plaza') || props.some((q) => q.gx <= x && x < q.gx + q.w && q.gy <= y && y < q.gy + q.h)) { ok = false; break; } if (ok) { props.push({ kind: 'deadwell', gx, gy, w: 2, h: 2, height: 1, wall: 0, roof: 0, variant: 0 }); break; } } } }
    const freeRect = (gx: number, gy: number, w: number, h: number) => { for (let y = gy - 1; y < gy + h + 1; y++) for (let x = gx - 1; x < gx + w + 1; x++) if (!inb(x, y) || map[y][x] !== 'grass') return false; return true; };
    for (let k = 0; k < 10; k++) { const a = rc() * 6.283, d = 14 + rc() * 5, gx = Math.round(cx + Math.cos(a) * d) - 1, gy = Math.round(cy + Math.sin(a) * d) - 1; if (freeRect(gx, gy, 3, 3)) block({ kind: 'house', gx, gy, w: 3, h: 3, height: 2.4, wall: [0x6a5a48, 0x5a4c3e, 0x74644e][k % 3], roof: [0x3a3430, 0x4a3a2e, 0x2e2a28][k % 3], variant: [0, 2, 1][k % 3] }); }
    for (let k = 0; k < 2; k++) { const a = rc() * 6.283, gx = Math.round(cx + Math.cos(a) * 7), gy = Math.round(cy + Math.sin(a) * 7); if (freeRect(gx, gy, 2, 2)) decorAt('stall', gx, gy, 2, 2, 0, 0x4a3a2a, 0x3a3430); }
    for (let f = 0; f < 3; f++) { const a = rc() * 6.283, d = 19 + rc() * 5, fx = Math.round(cx + Math.cos(a) * d), fy = Math.round(cy + Math.sin(a) * d); for (let y = fy; y < fy + 3; y++) for (let x = fx; x < fx + 5; x++) if (free(x, y)) props.push({ kind: 'deadcrop', gx: x, gy: y, w: 1, h: 1, height: 0.5, wall: 0, roof: 0, variant: 0 }); }
    for (let k = 0; k < 12; k++) { const a = rc() * 6.283, d = 9 + rc() * 14, gx = Math.round(cx + Math.cos(a) * d), gy = Math.round(cy + Math.sin(a) * d); if (free(gx, gy)) { props.push({ kind: 'deadtree', gx, gy, w: 1, h: 1, height: 4.5 + rc() * 3, wall: 0, roof: 0, variant: k < 5 ? 1 : 0 }); } }
    for (let k = 0; k < 9; k++) { const a = rc() * 6.283, d = 3 + rc() * 9, gx = Math.round(cx + Math.cos(a) * d), gy = Math.round(cy + Math.sin(a) * d); if (inb(gx, gy) && (map[gy][gx] === 'grass' || map[gy][gx] === 'road')) props.push({ kind: 'corpse', gx, gy, w: 1, h: 1, height: 0.3, wall: 0, roof: 0, variant: 0 }); }
    { const a = rc() * 6.283, gx = Math.round(cx + Math.cos(a) * 12), gy = Math.round(cy + Math.sin(a) * 12); if (free(gx, gy)) { props.push({ kind: 'altar', gx, gy, w: 1, h: 1, height: 1, wall: 0, roof: 0, variant: 0 }); map[gy][gx] = 'wall'; } }
    for (let k = 0; k < 8; k++) addGrave(cx + Math.round((rc() - 0.5) * 30), cy + Math.round((rc() - 0.5) * 30));
    for (let k = 0; k < 10; k++) { const a = rc() * 6.283, d = 5 + rc() * 13, gx = Math.round(cx + Math.cos(a) * d), gy = Math.round(cy + Math.sin(a) * d); if (inb(gx, gy) && (map[gy][gx] === 'grass' || map[gy][gx] === 'road')) props.push({ kind: 'torch', gx, gy, w: 1, h: 1, height: 2.0, wall: 0x3a2a1c, roof: 0xff8a2a }); }
    spawns.push({ type: 'zombie', x: cx + 10, y: cy - 8, r: 7, n: 3, night: true }, { type: 'bat', x: cx - 6, y: cy + 10, r: 8, n: 3, night: true });
    spawns.push({ type: 'rat', x: cx + 6, y: cy + 6, r: 6, n: 4 }, { type: 'zombie', x: cx - 16, y: cy + 4, r: 6, n: 2 }, { type: 'skeleton', x: cx + 4, y: cy - 18, r: 6, n: 2 });
    // a gente: doente, faminta, sem esperança — o karma da Catedral pesa sobre eles
    const g0 = st.npcs.find((q) => q.role.startsWith('Guarda')), a0 = st.npcs.find((q) => q.role === 'Aldeã'), m0 = st.npcs.find((q) => q.role === 'Mercador');
    if (g0) { g0.role = `Guarda de ${nm}`; g0.tint = 0x5a5a62; g0.lines = [`${nm}... ainda se chama assim, mas já não é uma vila. É uma fila de covas esperando dono.`, 'Desde que o Olho da Catedral se fechou, o trigo apodrece em pé e o poço só devolve lama preta.', 'Não ande à noite. Os que enterramos não ficam enterrados.']; }
    if (a0) { a0.role = 'Aldeã doente'; a0.tint = 0x8a8a7a; a0.lines = ['*tosse* ... a febre levou meu marido e meus dois meninos. Agora é a minha vez, eu sei.', 'Há três luas penduramos os ladrões nas árvores. Depois, os que reclamavam. Depois... já nem lembro por quê.', 'Dizem que um peregrino com o Olho aberto pode purificar a Catedral. Eu não acredito em mais nada.']; }
    if (m0) { m0.lines = ['Vendo o pouco que sobrou. Pão mofado é melhor que nenhum pão.', 'Ninguém mais passa por aqui. As caravanas desviam pela estrada velha.']; m0.tint = 0x7a6a50; }
    st.npcs.push(
      { name: nameOf(rc, cx, cy), role: 'Coveiro', kind: 'nordic', x: cx - 5, y: cy - 4, radius: 2, tint: 0x4a4a4a, scale: 1.0, lines: ['Cavo do nascer ao pôr do sol. Nunca falta trabalho, só falta terra.', 'Os corpos de ontem estão mais leves que os de semana passada. A fome come primeiro por dentro.', 'Se for descer às covas do cemitério da Catedral, leve tochas. E não aceite nada que os mortos oferecerem.'] },
      { name: nameOf(rc, cx, cy), role: 'Mãe enlutada', kind: 'nordic', x: cx + 4, y: cy + 5, radius: 1.5, tint: 0x6a5a6a, scale: 0.92, lines: ['Minha filha foi levada para o altar. Disseram que era para acalmar a Catedral.', 'Não acalmou nada. Só me deixou sem ela.'] },
      { name: nameOf(rc, cx, cy), role: 'Pregador louco', kind: 'nordic', x: cx + 1, y: cy - 6, radius: 3, tint: 0x6a3a3a, scale: 1.0, lines: ['O BISPO NÃO MORREU! Ele reza ao contrário lá embaixo, e cada oração dele é uma praga aqui em cima!', 'Arrependam-se! O karma desta terra está podre até a raiz!', 'Só um Olho aberto vê o caminho até o trono negro.'] },
    );
  }
  for (let k = 0; k < 16; k++) addGrave(cat.x - 10 + Math.round(r() * 8), cat.y + Math.round(r() * 18)); for (let k = 0; k < 16; k++) addGrave(cat.x + 15 + Math.round(r() * 6), cat.y + Math.round(r() * 18));
  for (let k = 0; k < 6; k++) addBones(cat.x - 6 + Math.round(r() * 20), cat.y - 6 + Math.round(r() * 24));
  for (let k = 0; k < 8; k++) { const gx = cat.x - 8 + Math.round(r() * 24), gy = cat.y - 8 + Math.round(r() * 26); if (free(gx, gy) && free(gx + 1, gy) && free(gx, gy + 1) && free(gx + 1, gy + 1)) block({ kind: 'ruin', gx, gy, w: 2, h: 2, height: 1.2 + r() * 1.6, wall: 0x5a5650, roof: 0, variant: Math.floor(r() * 3) }); }
  for (const [tx, ty] of [[cat.x - 2, cat.y + 20], [cat.x + 14, cat.y + 20], [cat.x - 2, cat.y + 25], [cat.x + 14, cat.y + 25]]) if (inb(tx, ty) && map[ty][tx] === 'grass') props.push({ kind: 'torch', gx: tx, gy: ty, w: 1, h: 1, height: 2.2, wall: 0x3a2a1c, roof: 0xff8a2a });
  spawns.push({ type: 'imp', x: cat.x + 6, y: cat.y + 30, r: 6, n: 4 }, { type: 'rat', x: cat.x - 8, y: cat.y + 6, r: 5, n: 4 }, { type: 'imp', x: cat.x + 20, y: cat.y + 8, r: 5, n: 3 });
  for (let k = 0; k < 34; k++) addGrave(ch0.x - 4 + Math.round(r() * 16), ch0.y + 5 + Math.round(r() * 7));
  for (let k = 0; k < 6; k++) addBones(ch0.x - 3 + Math.round(r() * 14), ch0.y + 5 + Math.round(r() * 7));
  spawns.push({ type: 'rat', x: ch0.x + 3, y: ch0.y + 8, r: 7, n: 4 }, { type: 'puglin', x: ch0.x + 4, y: ch0.y + 9, r: 6, n: 2 }, { type: 'fairy', x: ch0.x + 1, y: ch0.y + 6, r: 6, n: 2 }, { type: 'prince', x: ch0.x + 2, y: ch0.y - 3, r: 1, n: 1, fixLvl: 16 }); /* o Príncipe guarda a nave pelo lado norte, longe do cemitério dos aprendizes: é o chefe da missão de nível 24 */
  const ru = safe(92 + OFX_L, 126 + OFY_L);
  pois.push({ name: 'Ruínas de Aravel', x: ru.x, y: ru.y, biome: 'ruins' });
  for (let k = 0; k < 8; k++) addBones(ru.x + Math.round((r() - 0.5) * 18), ru.y + Math.round((r() - 0.5) * 12));
  for (let k = 0; k < 9; k++) addRuin(ru.x + Math.round((r() - 0.5) * 16), ru.y + Math.round((r() - 0.5) * 10), 1 + Math.floor(r() * 3), 1);
  { /* o salão caído da Primeira Vigília (26/10): marco próprio no meio das ruínas, as ruínas pequenas em volta cedem o lugar */
    const lw = 13, lh = 13, gx = ru.x - 6, gy = ru.y - 6; for (let i = props.length - 1; i >= 0; i--) { const q = props[i]; if (q.gx + q.w > gx - 1 && q.gx < gx + lw + 1 && q.gy + q.h > gy - 1 && q.gy < gy + lh + 1 && (q.kind === 'ruin' || q.kind === 'tree' || q.kind === 'rock' || q.kind === 'bones' || q.kind === 'herb')) props.splice(i, 1); }
    for (let y = gy - 1; y <= gy + lh; y++) for (let x = gx - 1; x <= gx + lw; x++) if (inb(x, y) && map[y][x] !== 'water' && map[y][x] !== 'road') map[y][x] = 'grass';
    props.push({ kind: 'landmark', gx, gy, w: lw, h: lh, height: 12, wall: 0, roof: 0, variant: 8 }); for (let y = gy + 1; y < gy + lh - 1; y++) for (let x = gx + 1; x < gx + lw - 1; x++) if (inb(x, y) && Math.hypot(x - gx - lw / 2, y - gy - lh / 2) > lw / 2 - 1.5 && Math.abs(x - gx - lw / 2) > 2.2) map[y][x] = 'wall' as never; for (let y = gy + 5; y <= gy + 7; y++) for (let x = gx + 5; x <= gx + 7; x++) map[y][x] = 'wall' as never; /* o dais é sólido */ flatten(gx + lw / 2, gy + lh / 2, lw / 2 + 2); /* a colunata bloqueia, o meio (brecha e portão) fica livre */ }

  /* trilhas: dos lugares de luta e de mistério até a estrada mais próxima (juntam-se à rede, não fazem estrelas) */
  { const near = (x: number, y: number) => { let best: [number, number] = PLACE.Karmika, bd = 1e9; for (const [, q] of Object.entries(PLACE)) { const d = Math.hypot(q[0] - x, q[1] - y); if (d < bd) { bd = d; best = q; } } return best; };
    for (const nm of ['Cume Gelado', 'Atoleiro de Zerath', 'Covil dos Lobos', 'Clareira dos Gritos', 'Igreja Abandonada', 'Cemitério Esquecido', 'Acampamento Draugr', 'Ruínas de Aravel', 'Garganta de Pedra', 'Catedral Abandonada', 'Cripta de Hemara', 'Clareira de Selvar']) {
      const p = pois.find((q) => q.name === nm); if (!p) continue; route([p.x, p.y + 3], near(p.x, p.y), 0.85); } }
  bridgesRef = bridges; for (const b of bridges) { if (b.hA === 0 && b.hB === 0) { const save = bridgesRef; bridgesRef = []; b.hA = groundH_L(b.ax * T, b.ay * T); b.hB = groundH_L(b.bx * T, b.by * T); bridgesRef = save; } b.hA = Math.max(b.hA, WL + 0.15); b.hB = Math.max(b.hB, WL + 0.15); } /* tabuleiro nunca abaixo da água */
  /* tochas ao longo das estradas perto da vila: uma de cada lado, alternadas */
  for (const rp of roadPaths) for (let i = 6; i < rp.length - 2; i += 7) { const q = rp[i], d = Math.hypot(q.x - CITY_L.x, q.y - CITY_L.y); if (d < 16 || d > 42) continue; const nx = rp[i + 1].y - rp[i - 1].y, ny = -(rp[i + 1].x - rp[i - 1].x), L = Math.hypot(nx, ny) || 1, sd2 = (i / 7) % 2 ? 2.2 : -2.2; torch(Math.round(q.x + nx / L * sd2), Math.round(q.y + ny / L * sd2)); }
  /* árvores, pedras e vegetação por bioma */
  /* 27/10 (Erling: "não precisa ser tão fechada; clareiras, espaços, não um monte de mato que não conseguimos sequer ver o jogo"):
     mata e selva mais abertas, e CLAREIRAS de verdade: onde o ruído largo passa do limiar, não nasce árvore (bolsões de 10–30 casas) */
  /* 01/11 (Erling): florestas densas com 25% menos árvores e sem árvore encostada na outra; e pelo menos duas clareiras de luta por região de mata */
  const dens: Record<Biome, number> = { meadow: 0.04, forest: 0.165, swamp: 0.09, snow: 0.09, ruins: 0.05, rock: 0.02, volcanic: 0.02, enchanted: 0.15, blight: 0.06, jungle: 0.225, coast: 0.015 };
  const DENSE = new Set<Biome>(['forest', 'enchanted', 'jungle']);
  const arenas: { x: number; y: number; r: number }[] = []; for (const rg of REGIONS_L) { const cx = Math.round(rg.x), cy = Math.round(rg.y); if (!DENSE.has(biomeAt_L(cx, cy))) continue; const rr = rng(rg.id * 977 + 5); for (const [ox, oy] of [[-1, -0.6], [1, 0.7]]) { const ax = Math.round(cx + ox * (12 + rr() * 10)), ay = Math.round(cy + oy * (10 + rr() * 8)); if (inb(ax, ay) && map[ay]?.[ax] !== 'water') arenas.push({ x: ax, y: ay, r: 7 + Math.floor(rr() * 3) }); } }
  const inArena = (x: number, y: number) => arenas.some((a) => Math.hypot(a.x - x, a.y - y) < a.r);
  const clearing = (x: number, y: number) => inArena(x, y) || fbm(x * 0.045, y * 0.045, 58) > 0.62 || fbm(x * 0.02, y * 0.02, 59) > 0.66;
  /* tiles já ocupados por lápides, ossadas, tochas, corpos, névoa… (props que não marcam o mapa): árvore não nasce em cima deles */
  const occupied = new Set<number>(); for (const p of props) for (let yy = p.gy; yy < p.gy + p.h; yy++) for (let xx = p.gx; xx < p.gx + p.w; xx++) occupied.add(yy * 100000 + xx);
  for (let y = 1; y < MAP_H_L - 1; y++) for (let x = 1; x < MAP_W_L - 1; x++) {
    if (map[y][x] !== 'grass' || occupied.has(y * 100000 + x)) continue;
    const bm = biome[y][x];
    const cluster = 0.35 + 1.3 * fbm(x * 0.12, y * 0.12, 21);
    if (r() > dens[bm] * cluster) continue;
    if ((bm === 'forest' || bm === 'jungle' || bm === 'enchanted') && clearing(x, y)) continue;
    if (WILD_L.some((w) => Math.hypot(w.x - x, w.y - y) < w.clear)) continue; /* 02/11: as clareiras dos lugares novos */
    if (Math.hypot(x - CITY_L.x, y - CITY_L.y - 3) < 12) continue; // praça e arredores livres
    if (nearSettle(x, y, 0)) continue;
    let near = false;
    for (let dy = -1; dy <= 1 && !near; dy++) for (let dx = -1; dx <= 1; dx++) { const tt = map[y + dy][x + dx]; if (tt !== 'grass' && tt !== 'tree') { near = true; break; } }
    if (near) continue;
    if (map[y][x - 1] === 'tree' || map[y - 1][x] === 'tree') continue; // árvores nunca encostadas (01/11); a densidade vem do sorteio
    if (waterSD_L((x + 0.5) * T, (y + 0.5) * T) < 3.0) continue; // margens ficam para juncos e pedras
    const v = r();
    const kind = bm === 'volcanic' || bm === 'blight' ? 1 : bm === 'jungle' || bm === 'enchanted' || bm === 'coast' ? (v < 0.85 ? 0 : 2) : bm === 'snow' ? 2 : bm === 'swamp' ? (v < 0.7 ? 1 : 0) : bm === 'ruins' ? (v < 0.75 ? 1 : 0) : bm === 'forest' ? (v < 0.55 ? 2 : v < 0.8 ? 0 : 1) : bm === 'rock' ? (v < 0.6 ? 1 : 2) : (v < 0.8 ? 0 : v < 0.9 ? 2 : 1);
    const pine = kind === 2;
    props.push({ kind: 'tree', sp: pickSpecies(bm, r()), gx: x, gy: y, w: 1, h: 1, height: (pine ? 6 + r() * 4 : 4.5 + r() * 3) * (bm === 'jungle' ? 1.5 : bm === 'enchanted' ? 1.3 : 1), wall: bm === 'enchanted' ? 0x6a5a7a : bm === 'blight' ? 0x2a2026 : 0x5b3b22, roof: bm === 'enchanted' ? (r() < 0.5 ? 0x8a5ad0 : 0x5ab0c8) : bm === 'jungle' ? (r() < 0.5 ? 0x1f4a24 : 0x2a5a26) : bm === 'blight' ? 0x4a3a4a : r() < 0.5 ? 0x3f7a3a : 0x4f8f45, variant: kind }); map[y][x] = 'tree'; // o tronco bloqueia (colisão circular), a copa não
  }
  // floresta fechada no leste e cordilheira rochosa no norte: a borda nunca é uma linha
  for (let y = 1; y < MAP_H_L - 1; y++) for (let x = 1; x < MAP_W_L - 1; x++) {
    if (map[y][x] !== 'grass' || nearSettle(x, y, 0)) continue;
    const ek = edgeK_L(x, y);
    if (ek.east > 0.35 && r() < ek.east * 0.72 && !clearing(x, y) && map[y][x - 1] !== 'tree' && map[y - 1][x] !== 'tree') { const pine = r() < 0.5; props.push({ kind: 'tree', sp: pickSpecies('forest', r()), gx: x, gy: y, w: 1, h: 1, height: pine ? 7 + r() * 4 : 5 + r() * 3, wall: 0x4b2f1c, roof: r() < 0.5 ? 0x2f6a2e : 0x3f7a3a, variant: pine ? 2 : 0 }); map[y][x] = 'tree'; continue; }
    if (ek.north > 0.4 && r() < ek.north * 0.35) { props.push({ kind: 'rock', gx: x, gy: y, w: 1, h: 1, height: 1 + r() * 2.5 * ek.north, wall: 0x6b6a68, roof: 0, variant: Math.floor(r() * 4) }); }
  }
  const rockDens: Record<Biome, number> = { meadow: 0.004, forest: 0.012, swamp: 0.006, snow: 0.02, ruins: 0.02, rock: 0.07, volcanic: 0.06, enchanted: 0.006, blight: 0.02, jungle: 0.008, coast: 0.01 };
  for (let y = 2; y < MAP_H_L - 2; y++) for (let x = 2; x < MAP_W_L - 2; x++) {
    if (map[y][x] !== 'grass') continue;
    if (r() > rockDens[biome[y][x]]) continue;
    if (Math.hypot(x - CITY_L.x, y - CITY_L.y - 3) < 14) continue;
    if (nearSettle(x, y, 3)) continue;
    if (waterSD_L((x + 0.5) * T, (y + 0.5) * T) < 2.5) continue;
    { /* pedra não encosta em casa nem em estrada (vizinhança livre) */ let near = false; for (let dy = -1; dy <= 1 && !near; dy++) for (let dx = -1; dx <= 1; dx++) { const tt = map[y + dy]?.[x + dx]; if (tt && tt !== 'grass' && tt !== 'tree') { near = true; break; } } if (near) continue; }
    addRock(x, y, r() < 0.25);
  }

  /* quem mora onde */
  const sp = (type: EnemyType, c: { x: number; y: number }, rr: number, n: number) => spawns.push({ type, x: c.x, y: c.y, r: rr, n });
  sp('imp', cDraugr, 9, 5); sp('puglin', cDraugr, 11, 5); sp('imp', gy0, 8, 4); sp('puglin', gy0, 9, 4);
  sp('wolf', cWolf, 11, 7); sp('puglin', cWolf, 9, 4); sp('boar', cSwamp, 10, 5); sp('puglin', cSwamp, 9, 6); sp('imp', cSwamp, 6, 2);
  sp('frostwolf', cIce, 10, 7); sp('imp', cIce, 6, 3);
  sp('imp', cRock, 9, 6); sp('wolf', cRock, 9, 4);
  sp('puglin', K(54, 82), 8, 4); sp('puglin', K(88, 64), 8, 4); sp('wolf', K(52, 60), 8, 3);
  sp('deer', K(52, 52), 12, 6); sp('deer', K(92, 98), 10, 5); sp('boar', K(46, 96), 8, 4); sp('deer', K(100, 84), 8, 4);
  sp('boar', K(98, 44), 8, 4); sp('wolf', K(110, 92), 8, 4);

  /* mais bichos: grade de grupos pelo mapa inteiro, tipos por bioma e dificuldade por distância da cidade */
  const rs = rng(99);
  const TBL: Record<Biome, EnemyType[]> = {
    meadow: ['rat', 'coyote', 'puglin', 'deer', 'boar', 'fairy', 'wolf'], forest: ['wolf', 'coyote', 'boar', 'treant', 'fairy', 'puglin', 'deer', 'fairy'],
    swamp: ['boar', 'rat', 'puglin', 'imp', 'fairy', 'rat'], snow: ['frostwolf', 'imp', 'rat', 'frostwolf'], ruins: ['imp', 'puglin', 'rat', 'coyote', 'imp'], rock: ['imp', 'wolf', 'coyote', 'imp'],
    volcanic: ['imp', 'imp', 'skeleton', 'ghoul'], enchanted: ['fairy', 'treant', 'fairy', 'wolf'], blight: ['zombie', 'ghoul', 'skeleton', 'bat', 'imp'], jungle: ['werewolf', 'wolf', 'boar', 'frostwolf'], coast: ['rat', 'coyote', 'puglin', 'boar'],
  };
  const EASY: EnemyType[] = ['rat', 'coyote', 'puglin', 'deer', 'fairy', 'boar'];
  /* FAUNA DE CADA TERRITÓRIO (26/10, Erling: "cada território com seu tipo de monstro, e os mais terríveis nas áreas mais difíceis").
     Mais da metade dos grupos vem desta lista; o resto do bioma. O nível sai da faixa da região (RANK), então o mesmo bicho é
     manso no berço e cruel no fim do mundo. */
  const FAUNA: Record<number, EnemyType[]> = {
    1: ['rat', 'coyote', 'puglin', 'fairy', 'boar', 'spiderling'], 17: ['rat', 'puglin', 'coyote', 'boar', 'imp', 'spiderling'], 20: ['fairy', 'deer', 'spiderling', 'rat', 'coyote'],
    2: ['wolf', 'boar', 'bear', 'spider', 'spiderling', 'skel_arch'], 3: ['skeleton', 'skel_arch', 'zombie', 'mudzombie', 'skull_fire', 'imp', 'hellhound'], 4: ['swampsnake', 'mudzombie', 'spider', 'rat', 'imp', 'boar'],
    5: ['coyote', 'boar', 'wolf', 'bear', 'slaver', 'spider'], 18: ['imp', 'skeleton', 'skull_fire', 'spider', 'automaton', 'rat'], 19: ['wolf', 'frostwolf', 'bear', 'skel_arch', 'spider'], 10: ['fairy', 'treant', 'spider', 'elfscout', 'wolf', 'fungus'],
    6: ['frostwolf', 'troll', 'harpy', 'skull_frost', 'bear'], 7: ['spider', 'fungus', 'bear', 'elfscout', 'wolf', 'swampsnake'], 8: ['scorpion', 'coyote', 'harpy', 'slaver', 'skel_arch', 'hellhound'], 21: ['treant', 'fungus', 'spider', 'elfscout', 'swampsnake'],
    11: ['automaton', 'turret', 'tinker', 'scorpion', 'rat'], 9: ['draugr_arch', 'draugr_bers', 'frostwolf', 'troll', 'harpy', 'skull_frost'], 22: ['automaton', 'tinker', 'scorpion', 'turret', 'drowner'],
    12: ['fairy', 'fungus', 'spider', 'harpy', 'elfscout', 'treant'], 13: ['imp_bomb', 'skull_fire', 'hellhound', 'pactbroken', 'imp'],
    14: ['bat', 'thrall', 'succubus', 'vampire', 'skull_frost'], 15: ['pactbroken', 'succubus', 'hellhound', 'imp_bomb', 'cultist'], 16: ['werewolf', 'swampsnake', 'spider', 'wolf', 'boar'],
    /* 07/11: as bordas do mundo (60 → 150) */
    23: ['frostwolf', 'troll', 'draugr_bers', 'draugr_arch', 'harpy', 'skull_frost'], 24: ['drowner', 'swampsnake', 'mudzombie', 'spider', 'fungus', 'troll'],
    25: ['spirit', 'pactbroken', 'succubus', 'hellhound', 'skull_fire', 'thrall'], 26: ['siren', 'drowner', 'goblin_shaman', 'goblin', 'skel_arch', 'scorpion'],
    27: ['pactbroken', 'succubus', 'imp_bomb', 'hellhound', 'cultist', 'inquisitor'], 28: ['troll', 'draugr_bers', 'inquisitor', 'pactbroken', 'skull_fire', 'hellhound'],
  };
  for (let gy = 7; gy < MAP_H_L - 6; gy += 9) for (let gx = 7; gx < MAP_W_L - 6; gx += 9) {
    const px = gx + Math.round((rs() - 0.5) * 6), py = gy + Math.round((rs() - 0.5) * 6);
    const dc = Math.hypot(px - CITY_L.x, py - CITY_L.y);
    if (dc < 24 || !inb(px, py)) continue;
    if (centerW(px, py) < 0.5 && (gx + gy) % 2) continue; // fora das Terras dos Homens: grupos mais espaçados (mundo mais selvagem e menos lotado)
    let c: { x: number; y: number } | null = null; // tile seco mais perto (barato: olha a grade, não o campo de distância)
    for (let rr = 0; rr <= 4 && !c; rr++) for (let k = 0; k < 8 && !c; k++) { const qx = px + Math.round(Math.cos(k * 0.785) * rr), qy = py + Math.round(Math.sin(k * 0.785) * rr); if (map[qy]?.[qx] === 'grass') c = { x: qx, y: qy }; }
    if (!c || nearSettle(c.x, c.y, 10)) continue;
    const bm = biome[c.y][c.x], tb = TBL[bm];
    const n = 2 + Math.floor(rs() * 3);
    const rgn = regionAt_L(c.x, c.y), fa = FAUNA[rgn.id], faK = rgn.lo >= 60 ? 0.92 : 0.6 /* 07/11: nas bordas do mundo quase só a fauna própria (nada de ratazana nível 140) */, pick = () => dc < 50 ? EASY[Math.floor(rs() * EASY.length)] : fa && rs() < faK ? fa[Math.floor(rs() * fa.length)] : tb[Math.floor(rs() * tb.length)];
    let t1 = pick(); if ((bm === 'coast' || bm === 'rock') && [8, 11, 22, 3].includes(regionAt_L(c.x, c.y).id) && rs() < 0.35) t1 = 'scorpion'; /* areia e pedra seca do sul: escorpiões enterrados */
    sp(t1, c, 7, ['turret', 'troll'].includes(t1) ? 1 : n);
    if (rs() < 0.55) sp(pick(), { x: c.x + 3, y: c.y - 2 }, 6, 1 + Math.floor(rs() * 2));
  }

  /* AFOGADORES NAS MARGENS (26/10): onde a água encosta na grama, longe das vilas, um ou dois esperam submersos — de dia e de noite.
     Nas regiões do fim do mundo, o Afogador Antigo. Serpentes do brejo dividem as margens dos charcos. */
  { const rw = rng(4242); let nD = 0;
    for (let gy = 10; gy < MAP_H_L - 10 && nD < 70; gy += 11) for (let gx = 10; gx < MAP_W_L - 10 && nD < 70; gx += 11) { const x = gx + Math.round((rw() - 0.5) * 8), y = gy + Math.round((rw() - 0.5) * 8); if (!inb(x, y) || map[y][x] !== 'grass') continue;
      const sd = waterSD_L((x + 0.5) * T, (y + 0.5) * T); if (sd < 1.2 || sd > 3.6) continue; if (nearSettle(x, y, 12) || Math.hypot(x - CITY_L.x, y - CITY_L.y) < 30) continue; if (rw() > 0.55) continue;
      const rg = regionAt_L(x, y); nD++; sp(rg.lo >= 30 && rw() < 0.3 ? 'drowner_old' : (rg.id === 4 || biome[y][x] === 'swamp') && rw() < 0.45 ? 'swampsnake' : 'drowner', { x, y }, 3, rg.lo >= 30 ? 1 : 1 + Math.floor(rw() * 2)); } }
  /* placas: nas pontas e cruzamentos das estradas, apontando para o lugar mais próximo e para Karmika */
  const signs: Sign[] = [];
  const nearPoi = (x: number, y: number) => { let best: Poi | null = null, bd = 30; for (const p of pois) { const d = Math.hypot(p.x - x, p.y - y); if (d < bd) { bd = d; best = p; } } return best; };
  for (const pts of roads) {
    for (const [i, [x, y]] of pts.entries()) {
      const end = i === 0 || i === pts.length - 1; if (!end && i % 55 !== 27) continue; // as estradas agora são caminhos tile a tile: placa só nas pontas e a cada ~55 tiles
      if (signs.some((q) => Math.hypot(q.x - x, q.y - y) < 20)) continue; // nunca duas placas perto
      if (nearSettle(x, y, 4)) continue; // dentro das vilas não
      const prev = pts[Math.max(0, i - 1)], next = pts[Math.min(pts.length - 1, i + 1)];
      const ax = next[0] - prev[0], ay = next[1] - prev[1], al = Math.hypot(ax, ay) || 1; const px = -ay / al, py = ax / al; // perpendicular: placa ao lado da estrada
      const sx = Math.round(x + px * 1.6), sy = Math.round(y + py * 1.6); if (!inb(sx, sy) || map[sy][sx] !== 'grass') continue;
      const ns = [...settlements].sort((a, b) => Math.hypot(a.x - sx, a.y - sy) - Math.hypot(b.x - sx, b.y - sy)).slice(0, 2);
      const lines: { text: string; dir: number }[] = ns.map((st) => ({ text: st.name, dir: Math.atan2(st.x - sx, st.y - sy) }));
      const poi = nearPoi(x, y); if (poi && Math.hypot(poi.x - sx, poi.y - sy) > 4) lines.push({ text: poi.name, dir: Math.atan2(poi.x - sx, poi.y - sy) });
      else if (end) { const far = pts[i === 0 ? pts.length - 1 : 0]; lines.push({ text: 'Estrada', dir: Math.atan2(far[0] - sx, far[1] - sy) }); }
      signs.push({ x: sx, y: sy, yaw: Math.atan2(ax, ay), lines }); map[sy][sx] = 'wall';
    }
  }

  // MURALHAS ORGÂNICAS DAS CIDADES (27/10, regra 19: "a cidade se espalha pelo terreno; nada de quadrado"): o anel é um contorno
  // irregular (quadrado arredondado × ruído suave) que PARA na água (a costa fica aberta: cais, nunca muro de frente para o mar),
  // com torres variadas (redondas, quadradas, abertas) em espaços desiguais, portões grandes onde as estradas de verdade cruzam
  // e escadarias por dentro nos trechos retos. Casas que caíram em cima do muro somem; dentro não há mata.
  const ramparts: Rampart[] = [];
  for (const st of settlements) {
    const kitS = st.name === 'Karmika'; /* 01/11: Karmika ganha a muralha da prancha 53 (pedra + paliçada de madeira, torres enxaimel, portão com ponte), mais baixa */
    if (st.kind !== 'city' && !kitS) continue;
    const cx = st.x, cy = st.y, H = kitS ? 3.4 : RAMPART_H, Rb = st.radius + (kitS ? 9 : 4), /* Karmika (Erling, 01/11): muro a ~10 m da vila, não mais; quem constrói fica a ≥10 m do muro (canBuildAt) */ rw = rng(st.x * 3 + st.y * 5 + 11);
    const ph = [rw() * 6.283, rw() * 6.283, rw() * 6.283];
    /* 02/11 (Erling: "recue um pouco a entrada da cidade e faça um caminho depois da ponte"): onde uma estrada chega ao anel atravessando
       água (ponte), o muro recua 6 casas para dentro naquele ângulo — a ponte fica fora, a estrada segue até o portão recuado */
    const dips: number[] = []; if (kitS) for (const pts of roads) for (let s0 = 0; s0 + 1 < pts.length; s0++) { const [ax, ay] = pts[s0], [bx, by] = pts[s0 + 1], L = Math.hypot(bx - ax, by - ay) || 1; /* 03/11: amostra o segmento inteiro (os vértices da estrada ficam longe do anel) */
      for (let t = 0; t <= L; t += 0.5) { const px = Math.round(ax + (bx - ax) * t / L), py = Math.round(ay + (by - ay) * t / L), d = Math.hypot(px - cx, py - cy); if (Math.abs(d - Rb) > 2) continue; let wet = false;
        for (let yy = py - 6; yy <= py + 6 && !wet; yy++) for (let xx = px - 6; xx <= px + 6; xx++) if (map[yy]?.[xx] === 'water') { wet = true; break; } if (!wet) continue; const a = Math.atan2(py - cy, px - cx); if (!dips.some((q) => Math.abs(Math.atan2(Math.sin(q - a), Math.cos(q - a))) < 0.5)) dips.push(a); } }
    const dipAt = (a: number) => { let k = 0; for (const q of dips) { const da = Math.abs(Math.atan2(Math.sin(q - a), Math.cos(q - a))); const w = 0.5; if (da < w) k = Math.max(k, 1 - Math.pow(da / w, 2)); } return -7.5 * k; }; /* 03/11 (Erling: "afasta o muro da ponte uns 15 metros para frente"): agora o muro AVANÇA 7,5 casas onde a estrada atravessa o rio — a ponte fica dentro, com espaço para vê-la, e a entrada dupla depois dela */
    const radAt = (a: number) => { const c = Math.abs(Math.cos(a)), sn = Math.abs(Math.sin(a)); const sq = 1 / Math.pow(Math.pow(c, 5) + Math.pow(sn, 5), 0.2); const nz = 0.07 * Math.sin(a * 2 + ph[0]) + 0.06 * Math.sin(a * 3 + ph[1]) + 0.045 * Math.sin(a * 5 + ph[2]) + 0.03 * Math.sin(a * 7 + ph[0] * 2); return kitS ? Math.min(Rb + 3, Math.max(Rb * sq * (1 + nz), Rb - 1)) - dipAt(a) : Rb * sq * (1 + nz); }; /* Karmika: raio quase constante (vila redonda, muro a ~10 m dela) */
    const insideWall = (x: number, y: number) => { const dx = x - cx, dy = y - cy; return Math.hypot(dx, dy) < radAt(Math.atan2(dy, dx)) - 0.5; };
    const clearAt = (x: number, y: number) => { for (let i = props.length - 1; i >= 0; i--) { const q = props[i]; if (q.gx === x && q.gy === y && (q.kind === 'tree' || q.kind === 'rock' || q.kind === 'grave' || q.kind === 'herb' || q.kind === 'bones' || q.kind === 'deadtree')) props.splice(i, 1); } };
    // 1) o anel rasterizado: casas em ordem, sem repetição
    const ring: [number, number][] = []; const seenK = new Set<number>();
    for (let i = 0; i < 2400; i++) { const a = i / 2400 * 6.283, r = radAt(a), x = Math.round(cx + Math.cos(a) * r), y = Math.round(cy + Math.sin(a) * r), k = y * 4096 + x; if (seenK.has(k) || !inb(x, y)) continue;
      if (ring.length >= 2) { const p2 = ring[ring.length - 2]; if (Math.abs(p2[0] - x) <= 1 && Math.abs(p2[1] - y) <= 1) { const p1 = ring.pop()!; seenK.delete(p1[1] * 4096 + p1[0]); } } /* anel fino: a casa do canto que sobra sai */
      seenK.add(k); ring.push([x, y]); }
    const N = ring.length; if (!N) { console.warn('muralha: anel vazio em', st.name, cx, cy, Rb); continue; }
    const nearWater = (x: number, y: number, d: number) => { for (let yy = y - d; yy <= y + d; yy++) for (let xx = x - d; xx <= x + d; xx++) if (map[yy]?.[xx] === 'water') return true; return false; };
    const wallOk = ring.map(([x, y]) => !nearWater(x, y, kitS ? 0 : 2)); // onde a costa chega, o muro para
    const waterGate = new Set<number>(); const spans: [number, number][] = []; /* [primeiro, último] índice de cada trecho sobre a água */ if (kitS) { /* 01/11 (Erling: "precisa conectar os muros"): um rio que cruza o anel ganha um portão d'água — o muro continua por cima, em arcos */
      /* o anel é circular: um trecho de água que passa pelo índice 0 (leste) é tratado como um só (antes ficava sem muro e sem arcos) */
      let start = 0; while (start < N && !wallOk[start]) start++; if (start < N) {
        let i = start; let seen = 0; while (seen < N) { const ii = i % N; if (wallOk[ii]) { i++; seen++; continue; } let j = i; while (j - i < N && !wallOk[j % N]) j++; const len = j - i; if (len <= 14) { for (let k = i; k < j; k++) { waterGate.add(k % N); wallOk[k % N] = true; } spans.push([i % N, (j - 1) % N]); } seen += len; i = j; } } }
    // 2) casas dentro do anel: grama de cidade, sem mata nem pedra; casas e barracas em cima do muro somem
    for (let y = cy - Rb - 12; y <= cy + Rb + 12; y++) for (let x = cx - Rb - 12; x <= cx + Rb + 12; x++) { if (!inb(x, y) || !insideWall(x, y)) continue; if (biome[y][x] !== 'meadow' && biome[y][x] !== 'coast') biome[y][x] = 'meadow'; if (map[y][x] === 'tree') map[y][x] = 'grass'; }
    for (let i = props.length - 1; i >= 0; i--) { const q = props[i]; if ((q.kind === 'tree' || q.kind === 'rock') && insideWall(q.gx, q.gy) && !(q.kind === 'tree' && q.style === 1)) props.splice(i, 1); }
    for (let i = props.length - 1; i >= 0; i--) { const q = props[i]; if (q.kind !== 'house' && q.kind !== 'stall' && q.kind !== 'tent' && q.kind !== 'shopfront' && q.kind !== 'tower' && q.kind !== 'lowwall' && q.kind !== 'palisade') continue;
      let hit = false; for (let y = q.gy - 1; y <= q.gy + q.h && !hit; y++) for (let x = q.gx - 1; x <= q.gx + q.w && !hit; x++) if (seenK.has(y * 4096 + x)) hit = true; if (!hit) continue;
      props.splice(i, 1); for (let y = q.gy; y < q.gy + q.h; y++) for (let x = q.gx; x < q.gx + q.w; x++) if (inb(x, y) && map[y][x] === 'wall') map[y][x] = 'grass'; }
    // 3) portões: onde uma estrada de verdade (entre povoados) cruza o anel; no máximo 4, bem separados; vão de 5 casas (portão grande)
    const gateIdx: number[] = [];
    const nearestIdx = (x: number, y: number) => { let bi = -1, bd = 9; for (let i = 0; i < N; i++) { const d = Math.hypot(ring[i][0] - x, ring[i][1] - y); if (d < bd) { bd = d; bi = i; } } return bi; };
    const cand: { i: number; far: number }[] = [];
    for (const pts of roads) { for (let s0 = 0; s0 + 1 < pts.length; s0++) { const [ax, ay] = pts[s0], [bx, by] = pts[s0 + 1]; const L = Math.hypot(bx - ax, by - ay); let prev = insideWall(ax, ay);
        for (let t = 0; t <= L; t += 0.5) { const x = ax + (bx - ax) * t / L, y = ay + (by - ay) * t / L; const ins = insideWall(x, y); if (ins !== prev) { const i = nearestIdx(Math.round(x), Math.round(y)); if (i >= 0 && wallOk[i]) { const far = Math.max(Math.hypot(pts[0][0] - cx, pts[0][1] - cy), Math.hypot(pts[pts.length - 1][0] - cx, pts[pts.length - 1][1] - cy)); cand.push({ i, far }); } } prev = ins; } } }
    cand.sort((p, q) => q.far - p.far);
    for (const c of cand) { if (gateIdx.length >= 4) break; if (gateIdx.some((g) => Math.min(Math.abs(g - c.i), N - Math.abs(g - c.i)) < (kitS ? 7 : 16))) continue; gateIdx.push(c.i); } /* 03/11: em Karmika duas estradas juntas = entrada dupla (dois portões lado a lado), não um portão e um buraco */
    // onde a estrada cruza o anel num vão de água (o rio de Askavik), a passagem fica aberta; mas toda cidade tem pelo menos 2 portões de pedra
    for (let tries = 0; gateIdx.length < 2 && tries < 16; tries++) { const a = tries / 16 * 6.283 - Math.PI / 2; const i = nearestIdx(Math.round(cx + Math.cos(a) * radAt(a)), Math.round(cy + Math.sin(a) * radAt(a))); if (i < 0 || !wallOk[i]) continue; if ([-3, -2, -1, 1, 2, 3].some((d) => !wallOk[((i + d) % N + N) % N])) continue; if (gateIdx.some((g) => Math.min(Math.abs(g - i), N - Math.abs(g - i)) < N / 4)) continue; gateIdx.push(i); }
    const isGate = new Map<number, number>(); // índice → centro do portão
    for (const g of gateIdx) for (let d = -2; d <= 2; d++) isGate.set(((g + d) % N + N) % N, g);
    /* REGRA DE OURO (Erling, 27/10): TODA estrada que sai da cidade tem passagem aberta no muro. Qualquer rua que cruza o anel e não ganhou
       portão vira uma abertura (vão de 3 casas sem muro, com torre de guarda ao lado); nenhuma estrada morre numa parede. */
    const opening = new Set<number>();
    { const isRd = (i: number) => { const [x, y] = ring[i]; const t = map[y]?.[x]; if (t === 'road' || t === 'plaza') return true; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (map[y + dy]?.[x + dx] === 'road' && map[y - dy]?.[x - dx] === 'road') return true; return false; };
      let i = 0; while (i < N) { if (!wallOk[i] || isGate.has(i) || !isRd(i)) { i++; continue; } let j = i; while (j + 1 < N && isRd(j + 1)) j++; const c = Math.floor((i + j) / 2);
        /* 04/11 (Erling: "arco de entrada faltando, tá feia essa entrada e apertada"): a abertura vira PORTÃO de verdade — arco de pedra,
           5 casas (a estrada passa pelas 3 do meio, as colunas nas pontas) — e não um vão de 3 casas com uma torre do lado. Só fica vão aberto
           quando não cabe o portão (muro curto ou água perto). */
        if (![...isGate.keys()].some((g) => Math.min(Math.abs(g - c), N - Math.abs(g - c)) < 5)) {
          if ([-2, -1, 0, 1, 2].every((d) => wallOk[((c + d) % N + N) % N] && !waterGate.has(((c + d) % N + N) % N))) { gateIdx.push(c); for (let d = -2; d <= 2; d++) isGate.set(((c + d) % N + N) % N, c); }
          else for (let d = -1; d <= 1; d++) opening.add(((c + d) % N + N) % N); }
        i = j + 1; } }
    const tiles = new Set<number>(); const flights: Flight[] = [];
    const tangent = (i: number) => { const a = ring[((i - 3) % N + N) % N], b = ring[(i + 3) % N]; let tx = b[0] - a[0], ty = b[1] - a[1]; const L = Math.hypot(tx, ty) || 1; tx /= L; ty /= L; const ri = ring[((i % N) + N) % N], ox = ri[0] - cx, oy = ri[1] - cy; if (ty * ox - tx * oy < 0) { tx = -tx; ty = -ty; } /* fora = tangente girada −90° */ return [tx, ty]; };
    const outRy = (i: number) => { const [tx, ty] = tangent(i); return Math.atan2(-(ty), tx); }; // +x local = tangente; −z local = fora
    // 4) torres em espaços desiguais (11 a 17 casas), longe dos portões; estilos alternando sem repetir o vizinho
    const towerAt = new Map<number, number>(); let lastStyle = -1;
    { let i = Math.floor(rw() * 8); while (i < N) { if (wallOk[i] && !isGate.has(i) && !opening.has(i) && ![1, 2, 3, 4].some((d) => isGate.has((i + d) % N) || isGate.has(((i - d) % N + N) % N) || opening.has((i + d) % N) || opening.has(((i - d) % N + N) % N))) { let style = Math.floor(rw() * 4); if (style === lastStyle) style = (style + 1) % 4; lastStyle = style; towerAt.set(i, style); } i += 11 + Math.floor(rw() * 7); } }
    const nearGate = (i: number) => [...isGate.keys()].some((g) => Math.min(Math.abs(g - i), N - Math.abs(g - i)) <= 4) || [...opening].some((o) => Math.min(Math.abs(o - i), N - Math.abs(o - i)) <= 2); /* 02/11 (Erling): torre colada no portão repetia a torre do portão e estreitava a passagem das carroças */
    for (let i = 0; i < N; i++) { const i0 = ((i - 1) % N + N) % N, i1 = (i + 1) % N; if (wallOk[i] && (!wallOk[i0] || !wallOk[i1]) && !nearGate(i)) towerAt.set(i, 8); } // ponta do muro na água: torre redonda de guarda
    for (let i = 0; i < N; i++) { const i0 = ((i - 1) % N + N) % N, i1 = (i + 1) % N; if (!opening.has(i) && wallOk[i] && !isGate.has(i) && (opening.has(i0) || opening.has(i1)) && ![...isGate.keys()].some((g) => Math.min(Math.abs(g - i), N - Math.abs(g - i)) <= 4)) towerAt.set(i, 2); } // torre aberta de guarda ao lado de cada abertura
    /* 02/11 (Erling: "excesso de repetição de torres"): nunca duas torres a menos de 6 casas uma da outra, e ponta de muro curta (< 4 casas) não ganha torre */
    { const keys = [...towerAt.keys()].sort((a, b) => a - b); for (const i of keys) { if (!towerAt.has(i)) continue; let run = 0; for (let d = 0; d < 4; d++) if (wallOk[(i + d) % N]) run++; let runB = 0; for (let d = 0; d < 4; d++) if (wallOk[((i - d) % N + N) % N]) runB++; if (towerAt.get(i) === 8 && run < 4 && runB < 4) { towerAt.delete(i); continue; }
        for (let d = 1; d <= 6; d++) { const j = (i + d) % N; if (towerAt.has(j) && !isGate.has(j)) towerAt.delete(j); } } }
    // 5) as peças
    for (let i = 0; i < N; i++) { const [x, y] = ring[i]; if (!wallOk[i]) continue; const t = map[y][x]; if (t === 'water' && !waterGate.has(i)) continue;
      if (waterGate.has(i)) { /* 02/11 (Erling: "duas colunas com um arco de pedras em baixo"): o trecho sobre o rio é UMA peça — duas colunas nas margens, arco de pedra, o muro passa por cima */
        const sp = spans.find(([s0]) => s0 === i); if (!sp) continue; const a0 = ring[(sp[0] - 1 + N) % N], b0 = ring[(sp[1] + 1) % N]; const mx = (a0[0] + b0[0]) / 2 + 0.5, my = (a0[1] + b0[1]) / 2 + 0.5;
        props.push({ kind: 'rwall', gx: Math.floor(mx), gy: Math.floor(my), w: 1, h: 1, height: H, wall: 0x7a7672, roof: 0x34445e, variant: 24, ry: Math.atan2(-(b0[1] - a0[1]), b0[0] - a0[0]), ox: (mx - Math.floor(mx)) * T, oz: (my - Math.floor(my)) * T, len: Math.hypot(b0[0] - a0[0], b0[1] - a0[1]) * T }); continue; }
      const gc = isGate.get(i); if (gc !== undefined) { if (gc === i) { const ry = outRy(i); props.push({ kind: 'gatehouse', gx: x, gy: y, w: 1, h: 1, height: kitS ? H : H + 1.5, wall: 0x8a857e, roof: [0x34445e, 0x5a3a28, 0x3a4a3a][gateIdx.indexOf(gc) % 3], variant: kitS ? 20 : 0, ry, len: 5 }); }
        // sob o arco a estrada passa (3 casas do meio); as 2 de cada lado são corpo do portão
        const d = Math.min(Math.abs(i - gc), N - Math.abs(i - gc)); clearAt(x, y); if (d <= 1) { if (t !== 'road' && t !== 'plaza') map[y][x] = 'road'; } else map[y][x] = 'wall'; tiles.add(y * 4096 + x); continue; }
      if (opening.has(i)) { clearAt(x, y); if (t !== 'road' && t !== 'plaza') map[y][x] = 'road'; continue; } // abertura da estrada: sem muro (as torres de guarda ficam nas casas vizinhas do anel)
      clearAt(x, y); map[y][x] = 'wall'; tiles.add(y * 4096 + x);
      const ts = towerAt.get(i); const ry = outRy(i);
      if (ts !== undefined) { const v = kitS ? 20 : ts === 8 ? 8 : [8, 9, 10, 12][ts]; props.push({ kind: 'rtower', gx: x, gy: y, w: 1, h: 1, height: H, wall: 0x7a7672, roof: [0x34445e, 0x5a3a28, 0x3a4a3a, 0x4a4a52][Math.floor(rw() * 4)], variant: v, ry, len: v === 12 ? 0 : 2.4 + rw() * 2.6 }); }
      const nx = ring[(i + 1) % N]; const len = wallOk[(i + 1) % N] ? Math.hypot(nx[0] - x, nx[1] - y) * T : T;
      props.push({ kind: 'rwall', gx: x, gy: y, w: 1, h: 1, height: H, wall: 0x7a7672, roof: 0x34445e, variant: (kitS ? 20 : 0) + Math.floor(rw() * 3), ry, len }); }
    /* 03/11 (Erling: "não esqueça de fechar os lados do muro"): o portão é reto e o anel faz curva — entre a coluna do portão e o primeiro
       trecho do muro ficava um vão. Uma peça de muro liga a ponta do portão ao centro da casa vizinha do anel, dos dois lados. */
    if (kitS) for (const gc of gateIdx) { const [gx0, gy0] = ring[gc], ry = outRy(gc), dx = Math.cos(ry), dy = -Math.sin(ry), half = 5 / 2, c0 = { x: gx0 + 0.5, y: gy0 + 0.5 };
      for (const sgn of [-1, 1]) { const j = ((gc + sgn * 3) % N + N) % N; if (!wallOk[j] || isGate.has(j) || opening.has(j)) continue; const nc = { x: ring[j][0] + 0.5, y: ring[j][1] + 0.5 };
        const e1 = { x: c0.x + dx * half, y: c0.y + dy * half }, e2 = { x: c0.x - dx * half, y: c0.y - dy * half }; const E = Math.hypot(e1.x - nc.x, e1.y - nc.y) < Math.hypot(e2.x - nc.x, e2.y - nc.y) ? e1 : e2;
        const D = Math.hypot(E.x - nc.x, E.y - nc.y); if (D < 0.35) continue;
        const a0 = sgn > 0 ? E : nc, b0 = sgn > 0 ? nc : E, mx = (a0.x + b0.x) / 2, my = (a0.y + b0.y) / 2;
        props.push({ kind: 'rwall', gx: Math.floor(mx), gy: Math.floor(my), w: 1, h: 1, height: H, wall: 0x7a7672, roof: 0x34445e, variant: 20 + Math.floor(rw() * 3), ry: Math.atan2(-(b0.y - a0.y), b0.x - a0.x), ox: (mx - Math.floor(mx)) * T, oz: (my - Math.floor(my)) * T, len: D * T + 0.4 });
        for (let t = 0; t <= 1.001; t += 0.25) { const x = Math.floor(E.x + (nc.x - E.x) * t), y = Math.floor(E.y + (nc.y - E.y) * t); if (!inb(x, y) || Math.hypot(x + 0.5 - c0.x, y + 0.5 - c0.y) < 2.1 || map[y][x] === 'water') continue; clearAt(x, y); map[y][x] = 'wall'; tiles.add(y * 4096 + x); } } }
    // 6) a estrada de cada portão continua para dentro até a primeira rua e para fora até a estrada
    for (const g of gateIdx) { const [gx0, gy0] = ring[g], [tx, ty] = tangent(g); const ox = ty, oy = -tx; /* fora */
      for (const sgn of [-1, 1]) for (let d = 1; d <= (sgn > 0 ? 20 : 24); d++) { /* 02/11: para dentro até achar uma rua de verdade (até 24 casas), para fora até a estrada (20) */ const x = Math.round(gx0 + ox * d * sgn), y = Math.round(gy0 + oy * d * sgn); if (!inb(x, y)) break; const t = map[y][x]; if (t === 'water') break; if (d > 2 && (t === 'road' || t === 'plaza')) break; if (t === 'wall' && !tiles.has(y * 4096 + x)) break; clearAt(x, y); map[y][x] = 'road'; for (const [px2, py2] of [[Math.round(x + tx), Math.round(y + ty)], [Math.round(x - tx), Math.round(y - ty)]]) if (inb(px2, py2) && (map[py2][px2] === 'grass' || map[py2][px2] === 'tree')) { clearAt(px2, py2); map[py2][px2] = 'road'; } } }
    /* 03/11 (Erling: "ponte em Y com duas saídas embaixo e uma em cima, bem mais larga e bonita"): em Karmika, a ponte que chega na entrada dupla
       vira um Y de pedra — o tronco largo sai da vila e, passando a água, se abre em dois braços, um para cada portão */
    if (kitS && gateIdx.length >= 2) for (const br of [...bridges]) { const dA = Math.hypot(br.ax - cx, br.ay - cy), dB = Math.hypot(br.bx - cx, br.by - cy); if (Math.max(dA, dB) > Rb + 10) continue;
      const top = dA < dB ? { x: br.ax, y: br.ay } : { x: br.bx, y: br.by }, bot = dA < dB ? { x: br.bx, y: br.by } : { x: br.ax, y: br.ay };
      const gs = gateIdx.map((g) => ({ x: ring[g][0] + 0.5, y: ring[g][1] + 0.5 })).filter((g) => Math.hypot(g.x - bot.x, g.y - bot.y) < 16).sort((p, q) => Math.hypot(p.x - bot.x, p.y - bot.y) - Math.hypot(q.x - bot.x, q.y - bot.y)).slice(0, 2);
      if (gs.length < 2) continue;
      const F = { x: top.x + (bot.x - top.x) * 0.62, y: top.y + (bot.y - top.y) * 0.62 }, up = groundH_L(top.x * T, top.y * T), hF = Math.max(up, groundH_L(bot.x * T, bot.y * T)) + 0.35;
      const i0 = bridges.indexOf(br); bridges.splice(i0, 1);
      const save = bridgesRef; bridgesRef = [];
      bridges.push({ ax: top.x, ay: top.y, bx: F.x, by: F.y, hA: up, hB: hF, stone: true, half: 2.9, hump: 1.1 });
      /* 03/11 (Erling: "tira o cruzamento das pontes, faça um modelo de encaixe novo com duas entradas que se ligam à ponte do rio"): no lugar
         de dois braços que se cruzavam, UMA peça — o largo de pedra que sai da ponte e se abre até as duas bocas, com o parapeito só por fora
         e um V em volta da torre entre os portões */
      { const u0x = (F.x - top.x) / (Math.hypot(F.x - top.x, F.y - top.y) || 1), u0y = (F.y - top.y) / (Math.hypot(F.x - top.x, F.y - top.y) || 1), n0 = { x: -u0y, y: u0x };
        const h0 = 2.9 / T, w = 2.5 / T;
        const legs = gs.map((g) => { const L = Math.hypot(g.x - F.x, g.y - F.y) || 1, ux = (g.x - F.x) / L, uy = (g.y - F.y) / L, k = Math.max(2.5, L - 5.6) /* 05/11 (Erling: "a ponte não precisa esticar até a entrada"): o largo acaba na altura da torre, não nos portões */; const E = { x: F.x + ux * k, y: F.y + uy * k }; return { E, u: { x: ux, y: uy }, n: { x: -uy, y: ux }, side: ux * n0.x + uy * n0.y, g }; }).sort((p, q) => q.side - p.side);
        const [A, B] = legs; const P = (o: { x: number; y: number }, n: { x: number; y: number }, k: number) => ({ x: o.x + n.x * k, y: o.y + n.y * k });
        /* o vértice do V: onde a borda de dentro de A (−nA) encontra a de dentro de B (+nB) */
        const pa = P(F, A.n, -w), pb = P(F, B.n, w), den = A.u.x * B.u.y - A.u.y * B.u.x; let V = { x: (A.E.x + B.E.x) / 2, y: (A.E.y + B.E.y) / 2 };
        if (Math.abs(den) > 1e-3) { const t = ((pb.x - pa.x) * B.u.y - (pb.y - pa.y) * B.u.x) / den; if (t > 0.3) { const kA = Math.hypot(A.E.x - F.x, A.E.y - F.y); V = { x: pa.x + A.u.x * Math.min(t, kA), y: pa.y + A.u.y * Math.min(t, kA) }; } }
        const pts = [P(F, n0, h0), P(A.E, A.n, w), P(A.E, A.n, -w), V, P(B.E, B.n, w), P(B.E, B.n, -w), P(F, n0, -h0)];
        const hE = (e: { x: number; y: number }) => Math.max(WL + 0.15, groundH_L(e.x * T, e.y * T));
        bridges.push({ ax: F.x, ay: F.y, bx: (A.E.x + B.E.x) / 2, by: (A.E.y + B.E.y) / 2, hA: hF, hB: hF, stone: true, half: 2.9, hump: 0, poly: pts.flatMap((q) => [q.x, q.y]), ends: [A.E.x, A.E.y, hE(A.E), B.E.x, B.E.y, hE(B.E)] });
        const poly = pts.flatMap((q) => [q.x, q.y]); const bx0 = Math.floor(Math.min(...pts.map((q) => q.x))), bx1 = Math.ceil(Math.max(...pts.map((q) => q.x))), by0 = Math.floor(Math.min(...pts.map((q) => q.y))), by1 = Math.ceil(Math.max(...pts.map((q) => q.y)));
        for (let y = by0; y <= by1; y++) for (let x = bx0; x <= bx1; x++) if (inb(x, y) && inPoly(poly, x + 0.5, y + 0.5) && (map[y][x] === 'grass' || map[y][x] === 'tree')) { clearAt(x, y); map[y][x] = 'road'; }
        /* nada de tocha, banco ou placa em cima do largo */
        for (let k = props.length - 1; k >= 0; k--) { const q = props[k]; if (['torch', 'bench', 'sign', 'barrel', 'crate', 'flowers', 'bush', 'rock', 'vprop', 'lamppost'].includes(q.kind) && inPoly(poly, q.gx + 0.5, q.gy + 0.5)) props.splice(k, 1); }
        for (const L0 of legs) { const g = L0.g, E2 = L0.E, LL = Math.hypot(g.x - E2.x, g.y - E2.y) || 0.01;
          for (let t = 0; t <= LL; t += 0.5) { const x = Math.floor(E2.x + (g.x - E2.x) * t / LL), y = Math.floor(E2.y + (g.y - E2.y) * t / LL);
            for (const [dx, dy] of [[0, 0], [1, 0], [0, 1]]) if (inb(x + dx, y + dy) && (map[y + dy][x + dx] === 'grass' || map[y + dy][x + dx] === 'tree')) map[y + dy][x + dx] = 'road'; } } }
      bridgesRef = save; bridgeIdxN = -1; break; }
    // 7) escadarias por dentro: trechos retos (6 casas na mesma linha) longe dos portões, até 4 por cidade
    { let n = 0; for (let i = 0; i < N && n < 4; i++) { const run: number[] = []; for (let d = 0; d < 6; d++) { const j = (i + d) % N; if (!wallOk[j] || isGate.has(j) || towerAt.has(j)) break; run.push(j); } if (run.length < 6) continue;
        const xs = run.map((j) => ring[j][0]), ys = run.map((j) => ring[j][1]); const sameY = ys.every((v) => v === ys[0]), sameX = xs.every((v) => v === xs[0]); if (!sameY && !sameX) continue;
        const [tx, ty] = tangent(i + 3); const ox = ty, oy = -tx; const inner: [number, number][] = run.map((j) => [Math.round(ring[j][0] - ox), Math.round(ring[j][1] - oy)] as [number, number]);
        if (!inner.every(([x, y]) => inb(x, y) && (map[y][x] === 'grass' || map[y][x] === 'road') && !tiles.has(y * 4096 + x))) continue;
        if (flights.some((f) => Math.hypot(f.tiles[0][0] - inner[0][0], f.tiles[0][1] - inner[0][1]) < 24)) continue;
        const axis: 'x' | 'y' = sameY ? 'x' : 'y'; const L = 5; const rise = rw() < 0.5 ? 1 : -1; const picked = rise > 0 ? inner.slice(0, L) : inner.slice(1, L + 1).reverse(); // da mais baixa para a mais alta
        const first = picked[0], last = picked[picked.length - 1]; const dir: 1 | -1 = (axis === 'x' ? last[0] - first[0] : last[1] - first[1]) > 0 ? 1 : -1;
        for (const [x, y] of picked) { clearAt(x, y); map[y][x] = 'road'; }
        const side = Math.abs(ox) > Math.abs(oy) ? (ox > 0 ? 3 : 2) : (oy > 0 ? 1 : 0); const minx = Math.min(...picked.map((q) => q[0])), miny = Math.min(...picked.map((q) => q[1]));
        props.push({ kind: 'wstair', gx: minx, gy: miny, w: axis === 'x' ? L : 1, h: axis === 'x' ? 1 : L, height: H, wall: 0x8a857e, roof: 0, variant: side * 2 + (dir > 0 ? 1 : 0) });
        flights.push({ tiles: picked, axis, dir }); n++; i += 12; } }
    /* 01/11 (Erling: "não consigo passar entre a torre e a placa"): placa de estrada colada no muro sai (o tile dela volta a ser grama) */
    for (let i = signs.length - 1; i >= 0; i--) { const sg = signs[i]; let near = false; for (let dy = -2; dy <= 2 && !near; dy++) for (let dx = -2; dx <= 2; dx++) if (tiles.has((sg.y + dy) * 4096 + sg.x + dx)) { near = true; break; } if (near) { if (map[sg.y][sg.x] === 'wall') map[sg.y][sg.x] = 'grass'; signs.splice(i, 1); } }
    { const tl = [...tiles]; ramparts.push({ cx, cy, R: Rb + 6, top: groundH_L(cx * T, cy * T) + H, H, flights, tiles: tl, tops: tl.map((k) => groundH_L(((k % 4096) + 0.5) * T, (Math.floor(k / 4096) + 0.5) * T) + H) }); }
    // 8) do lado de fora: dois assentamentos pequenos e distantes (regra 19: nada de fila de tendas nem mendigo com missão)
    for (let k = 0; k < 2; k++) { const a = rw() * 6.283; let hx = 0, hy = 0, ok = false; for (let tries = 0; tries < 30 && !ok; tries++) { const r = Rb + 16 + rw() * 10, aa = a + (tries * 0.7); hx = Math.round(cx + Math.cos(aa) * r); hy = Math.round(cy + Math.sin(aa) * r); ok = inb(hx, hy) && !nearWater(hx, hy, 3) && !insideWall(hx, hy) && map[hy][hx] === 'grass'; }
      if (!ok) continue; const nh = 2 + Math.floor(rw() * 2); for (let q = 0; q < nh; q++) { const ang = q / nh * 6.283 + rw(), d = 4 + rw() * 3, gx = Math.round(hx + Math.cos(ang) * d) - 2, gy = Math.round(hy + Math.sin(ang) * d) - 2, w = 3 + Math.floor(rw() * 2), h = 3; let free2 = true; for (let y = gy - 1; y <= gy + h && free2; y++) for (let x = gx - 1; x <= gx + w && free2; x++) if (!inb(x, y) || map[y][x] !== 'grass') free2 = false; if (!free2) continue;
        for (let y = gy - 1; y <= gy + h; y++) for (let x = gx - 1; x <= gx + w; x++) clearAt(x, y); block({ kind: 'house', gx, gy, w, h, height: 2.8, wall: [0x8a7a5a, 0x7a6a4a, 0x9a8a6a][q % 3], roof: [0x5a4a3a, 0x3a4a3a, 0x6a3a2a][q % 3], variant: q % 3, rot: Math.floor(rw() * 2) }); }
      if (map[hy]?.[hx] === 'grass') { props.push({ kind: 'campfire', gx: hx, gy: hy, w: 1, h: 1, height: 0.5, wall: 0x3a2a1a, roof: 0xff9a40 }); map[hy][hx] = 'wall'; }
      st.npcs.push({ name: ['Lavrador Ambrósio', 'Pescadora Nídia', 'Velho Cosme', 'Leiteira Dalva'][k * 2 % 4], role: 'Morador dos arredores', kind: 'nordic', x: hx + 1.5, y: hy + 1.5, radius: 1.6, tint: 0x6a5a3a, scale: 0.98, lines: ['Aqui fora a cidade é só um barulho ao longe. Gosto assim.', `Quando o portão fecha, a gente fica deste lado. E tudo bem.`] }); }
  }
  /* os monumentos dos caminhos, com o entorno de cada um */
  {
    const clearArea = (x0: number, y0: number, r: number) => { for (let i = props.length - 1; i >= 0; i--) { const q = props[i]; if (Math.hypot(q.gx - x0, q.gy - y0) < r && (q.kind === 'tree' || q.kind === 'rock' || q.kind === 'herb' || q.kind === 'bones' || q.kind === 'grave')) props.splice(i, 1); } };
    const rnd = rng(9090);
    { /* O CASTELO DO CONDE: montanha negra, estrada em caracol, árvores mortas, covas, névoa, estacas e lanternas vermelhas */
      const c = MONU.conde; clearArea(c.x, c.y, c.R + 4);
      for (let y = c.y - c.R; y <= c.y + c.R; y++) for (let x = c.x - c.R; x <= c.x + c.R; x++) if (inb(x, y) && Math.hypot(x - c.x, y - c.y) < c.R && map[y][x] !== 'water') map[y][x] = 'grass';
      const pts: [number, number][] = []; const a0 = CONDE_ROAD.a0, turns = CONDE_ROAD.turns; // sai do lado de Corvoscuro (oeste) e sobe em caracol até a frente do castelo (sul)
      for (let i = 0; i <= 160; i++) { const t = i / 160, ang = a0 + t * turns * Math.PI * 2, r = (c.R + 3) - t * (c.R + 3 - 15); pts.push([c.x + Math.cos(ang) * r, c.y + Math.sin(ang) * r]); } /* raio final 15: passa livre dos cantos do castelo (22×20) */
      road(pts, 1.25, 0);
      // da vila até o pé da montanha
      { const v = settlements.find((q) => q.name === 'Corvoscuro'); if (v) road([[v.x + 3, v.y], [pts[0][0], pts[0][1]]], 1.1, 0.4); }
      for (let i = 4; i < pts.length; i += 7) { const [x, y] = pts[i], a = Math.atan2(y - c.y, x - c.x); const ox = Math.round(x + Math.cos(a) * 2.2), oy = Math.round(y + Math.sin(a) * 2.2); if (inb(ox, oy) && map[oy][ox] === 'grass') props.push({ kind: 'torch', gx: ox, gy: oy, w: 1, h: 1, height: 2.2, wall: 0x1a1a20, roof: 0xff2a2a }); }
      const W = 22, H = 20, gx = c.x - Math.floor(W / 2), gy = c.y - Math.floor(H / 2) - 1; block({ kind: 'monument', gx, gy, w: W, h: H, height: 60, wall: 0x3a3438, roof: 0x2a1e24, variant: 1 });
      landmarkDoor['Corvoscuro'] = { x: gx + W / 2 + 1.6, y: gy + H + 1.4 };
      for (let y = gy + H; y <= c.y + 16; y++) for (let x = c.x - 2; x <= c.x + 2; x++) if (inb(x, y) && map[y][x] === 'grass') map[y][x] = 'road';
      pois.push({ name: 'Castelo da Colina Vampírica', x: c.x, y: gy + H + 2, biome: 'blight' });
      for (let k = 0; k < 150; k++) { const a = rnd() * 6.283, r = c.top + 2 + rnd() * (c.R + 6 - c.top), x = Math.round(c.x + Math.cos(a) * r), y = Math.round(c.y + Math.sin(a) * r); if (!inb(x, y) || map[y][x] !== 'grass') continue;
        const q = rnd(); if (q < 0.55) { props.push({ kind: 'tree', gx: x, gy: y, w: 1, h: 1, height: 4 + rnd() * 4, wall: 0x2a2226, roof: 0x3a2a30, variant: 1 }); map[y][x] = 'tree'; }
        else if (q < 0.75) props.push({ kind: 'grave', gx: x, gy: y, w: 1, h: 1, height: 1.2, wall: 0x5a565a, roof: 0, variant: Math.floor(rnd() * 3) });
        else if (q < 0.88) props.push({ kind: 'fogpatch', gx: x, gy: y, w: 1, h: 1, height: 1, wall: 0x3a2a40, roof: 0x8a2a3a, variant: 0 });
        else props.push({ kind: 'bones', gx: x, gy: y, w: 1, h: 1, height: 0.4, wall: 0xd8d0b8, roof: 0, variant: Math.floor(rnd() * 3) }); }
    }
    { /* O PINÁCULO DE MARFIM: a torre na ilha do meio da lagoa; a Ponte dos Mil Passos até a margem; ilhotas com árvores de flor branca, cristais e lanternas */
      const m = MONU.marfim; clearArea(m.x, m.y, m.R + 4);
      for (let y = m.y - m.R - 2; y <= m.y + m.R + 2; y++) for (let x = m.x - m.R - 2; x <= m.x + m.R + 2; x++) if (inb(x, y)) map[y][x] = waterSD_L(x * T + T / 2, y * T + T / 2) < 0 ? 'water' : 'grass';
      const W = 12, H = 12, gx = m.x - 6, gy = m.y - 6; block({ kind: 'monument', gx, gy, w: W, h: H, height: 90, wall: 0xe8e0cc, roof: 0xd8c070, variant: 2 });
      for (let y = m.y - m.isle; y <= m.y + m.isle; y++) for (let x = m.x - m.isle; x <= m.x + m.isle; x++) if (inb(x, y) && map[y][x] === 'grass' && Math.hypot(x - m.x, y - m.y) < m.isle - 1.5) map[y][x] = 'plaza';
      landmarkDoor['Lumenhal'] = { x: m.x + 1.6, y: gy + H + 1.4 };
      pois.push({ name: 'Pináculo de Marfim', x: m.x, y: gy + H + 2, biome: 'enchanted' });
      // a ponte longa: da margem norte (onde chega a estrada de Lumenhal) até a ilha
      const shoreY = m.y - m.R - 1.5; { const b = { ax: m.x + 0.5, ay: shoreY, bx: m.x + 0.5, by: m.y - m.isle + 0.8, hA: 0, hB: 0, stone: true, half: 2.2, hump: 1.6 }; b.hA = groundH_L(b.ax * T, b.ay * T); b.hB = groundH_L(b.bx * T, b.by * T); bridges.push(b); }
      for (let y = Math.floor(shoreY) - 6; y <= Math.floor(shoreY) + 1; y++) for (const ox of [-1, 0, 1]) if (inb(m.x + ox, y) && map[y][m.x + ox] === 'grass') map[y][m.x + ox] = 'road';
      { const v = settlements.find((q) => q.name === 'Lumenhal'); if (v) road([[v.x, v.y + 3], [m.x + 0.5, shoreY - 5]], 1.1, 0.3); }
      // pontes de pedra até as duas ilhotas grandes (leste e oeste)
      for (const [ix, iy, ir] of m.islets.slice(0, 2)) { const dir = Math.sign(ix); const b = { ax: m.x + dir * (m.isle - 0.6) + 0.5, ay: m.y + iy * 0.35 + 0.5, bx: m.x + ix - dir * (ir - 0.8) + 0.5, by: m.y + iy + 0.5, hA: 0, hB: 0, stone: true, half: 1.4, hump: 1.0 }; b.hA = groundH_L(b.ax * T, b.ay * T); b.hB = groundH_L(b.bx * T, b.by * T); bridges.push(b); }
      // árvores de flor branca nas ilhotas, cristais e lanternas
      for (const [ix, iy, ir] of m.islets) { const n = Math.round(ir * 1.6); for (let k = 0; k < n; k++) { const a = rnd() * 6.283, r = rnd() * (ir - 1.2), x = Math.round(m.x + ix + Math.cos(a) * r), y = Math.round(m.y + iy + Math.sin(a) * r); if (!inb(x, y) || map[y][x] !== 'grass') continue;
          if (k === 0) props.push({ kind: 'totem', gx: x, gy: y, w: 1, h: 1, height: 2.4, wall: 0, roof: 0, variant: 3 }); else { props.push({ kind: 'tree', gx: x, gy: y, w: 1, h: 1, height: 4 + rnd() * 3, wall: 0xd8d0c0, roof: [0xf4dce8, 0xffeef4, 0xe8d0f0][Math.floor(rnd() * 3)], variant: 0, style: 2 }); map[y][x] = 'tree'; } } }
      for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2, x = Math.round(m.x + Math.cos(a) * (m.isle - 1.2)), y = Math.round(m.y + Math.sin(a) * (m.isle - 1.2)); if (inb(x, y) && (map[y][x] === 'plaza' || map[y][x] === 'grass') && Math.abs(x - m.x) > 1) props.push({ kind: 'torch', gx: x, gy: y, w: 1, h: 1, height: 2.6, wall: 0xd8c070, roof: 0x9ad8ff }); }
    }
    /** os outros cinco: a vila, o centro do monumento, o tamanho, o modelo, o nome e o entorno */
    const spiral = (cx0: number, cy0: number, R: number, top: number, a0: number, turns: number) => { const pts: [number, number][] = []; for (let i = 0; i <= 90; i++) { const t = i / 90, ang = a0 + t * turns * Math.PI * 2, r = (R + 2) - t * (R + 2 - (top - 1)); pts.push([cx0 + Math.cos(ang) * r, cy0 + Math.sin(ang) * r]); } road(pts, 1.25, 0); return pts; };
    const site = (vill: string, x: number, y: number, W: number, H: number, v: number, name: string, biome: Biome, clearR: number) => {
      clearR = Math.ceil(clearR); clearArea(x, y, clearR); for (let yy = y - clearR; yy <= y + clearR; yy++) for (let xx = x - clearR; xx <= x + clearR; xx++) if (inb(xx, yy) && Math.hypot(xx - x, yy - y) < clearR && (map[yy][xx] === 'tree' || map[yy][xx] === 'wall') && !props.some((q) => xx >= q.gx && xx < q.gx + q.w && yy >= q.gy && yy < q.gy + q.h)) map[yy][xx] = 'grass';
      const gx = x - Math.floor(W / 2), gy = y - Math.floor(H / 2); block({ kind: 'monument', gx, gy, w: W, h: H, height: 40, wall: 0, roof: 0, variant: v });
      landmarkDoor[vill] = { x: gx + W / 2 + 1.6, y: gy + H + 1.6 }; pois.push({ name, x: x, y: gy + H + 2, biome });
      for (let yy = gy + H; yy <= gy + H + 3; yy++) for (let xx = x - 2; xx <= x + 2; xx++) if (inb(xx, yy) && map[yy][xx] === 'grass') map[yy][xx] = 'plaza';
      const vv = settlements.find((q) => q.name === vill); return { gx, gy, vv };
    };
    const scatter = (x: number, y: number, r0: number, r1: number, n: number, put: (x: number, y: number, k: number) => void) => { for (let k = 0; k < n; k++) { const a = rnd() * 6.283, r = r0 + rnd() * (r1 - r0), px = Math.round(x + Math.cos(a) * r), py = Math.round(y + Math.sin(a) * r); if (inb(px, py) && map[py][px] === 'grass') put(px, py, k); } };
    /** 27/10: o caracol terminava no alto, longe da praça do monumento, e a praça ficava ilhada (ninguém chegava ao mestre de armas). Agora a estrada contorna o prédio e desce até a frente */
    const toPlaza = (pts: [number, number][], s0: { gx: number; gy: number }, W: number, H: number, cx0: number) => { const e = pts[pts.length - 1], rx = s0.gx + W + 1.5, py = s0.gy + H + 2; road([e, [rx, e[1]], [rx, py], [cx0 + 0.5, py]], 1.25, 0); };
    /** 27/10 (Erling: "aqui em cima não consigo andar, tô travado em tudo" / "precisa de uma passagem direta"): o alto do monte vira pátio calçado inteiro, e uma subida reta liga a vila à praça (o caracol fica como passeio) */
    const plateau = (o: { x: number; y: number; top: number }, s0: { gy: number; vv?: Settlement }, H: number) => { for (let yy = Math.floor(o.y - o.top); yy <= o.y + o.top; yy++) for (let xx = Math.floor(o.x - o.top); xx <= o.x + o.top; xx++) if (inb(xx, yy) && Math.hypot(xx + 0.5 - o.x, yy + 0.5 - o.y) < o.top - 0.6 && map[yy][xx] === 'grass') map[yy][xx] = 'plaza';
      if (s0.vv) road([[s0.vv.x + 0.5, s0.vv.y - 3], [o.x + 0.5, s0.gy + H + 3]], 1.25, 0); };
    { const o = MONU.odin, s0 = site('Jarlsheim', o.x, o.y - 1, 22, 18, 3, 'Fortaleza de Odin', 'snow', o.R + 2); const pts = spiral(o.x, o.y, o.R, o.top, Math.PI * 0.5, 0.8); toPlaza(pts, s0, 22, 18, o.x); plateau(o, s0, 18); if (s0.vv) road([[s0.vv.x, s0.vv.y - 3], pts[0]], 1.1, 0.3);
      scatter(o.x, o.y, o.top + 2, o.R + 5, 50, (x, y, k) => { if (k % 3 === 0) props.push({ kind: 'totem', gx: x, gy: y, w: 1, h: 1, height: 2.6, wall: 0, roof: 0, variant: 1 }); else { props.push({ kind: 'tree', gx: x, gy: y, w: 1, h: 1, height: 5 + rnd() * 3, wall: 0x4a3220, roof: 0x2a4a3a, variant: 2 }); map[y][x] = 'tree'; } }); }
    { const o = MONU.aurora, s0 = site('Austrvik', o.x, o.y - 1, 20, 18, 4, 'Abadia da Aurora', 'meadow', o.R + 2); const pts = spiral(o.x, o.y, o.R, o.top, Math.PI * 0.5, 0.6); toPlaza(pts, s0, 20, 18, o.x); plateau(o, s0, 18); if (s0.vv) road([[s0.vv.x, s0.vv.y - 3], pts[0]], 1.1, 0.3);
      scatter(o.x, o.y, o.top + 1, o.R + 4, 46, (x, y, k) => { if (k % 4 === 0) props.push({ kind: 'angel', gx: x, gy: y, w: 1, h: 1, height: 2.6, wall: 0xe8e0cc, roof: 0xd8b860, variant: 0 }); else { props.push({ kind: 'tree', gx: x, gy: y, w: 1, h: 1, height: 5 + rnd() * 2, wall: 0x6a4a2a, roof: 0xf8e8a0, variant: 0, style: 2 }); map[y][x] = 'tree'; } }); }
    { const o = MONU.prata, s0 = site('Sudrholt', o.x, o.y, 20, 20, 5, 'Bastião de Prata', 'ruins', o.moat + 4);
      for (let yy = o.y - 20; yy <= o.y + 20; yy++) for (let xx = o.x - 20; xx <= o.x + 20; xx++) if (inb(xx, yy) && map[yy][xx] !== 'wall' && moatSD(xx + 0.5, yy + 0.5) < 0) map[yy][xx] = 'water';
      { const b = { ax: o.x + 0.5, ay: o.y + o.moat - o.moatW - 1.2, bx: o.x + 0.5, by: o.y + o.moat + o.moatW + 1.6, hA: 0, hB: 0, stone: true, half: 2.0, hump: 0.6 }; b.hA = groundH_L(b.ax * T, b.ay * T); b.hB = groundH_L(b.bx * T, b.by * T); bridges.push(b); }
      for (let yy = o.y + 10; yy <= o.y + o.moat + 5; yy++) for (const ox of [-1, 0, 1]) if (inb(o.x + ox, yy) && map[yy][o.x + ox] === 'grass') map[yy][o.x + ox] = 'road';
      if (s0.vv) road([[s0.vv.x, s0.vv.y - 3], [o.x + 0.5, o.y + o.moat + 5]], 1.1, 0.3);
      scatter(o.x, o.y, o.moat + 3, o.moat + 10, 28, (x, y, k) => { props.push(k % 3 ? { kind: 'grave', gx: x, gy: y, w: 1, h: 1, height: 1.2, wall: 0x9a9aa0, roof: 0, variant: Math.floor(rnd() * 3) } : { kind: 'torch', gx: x, gy: y, w: 1, h: 1, height: 2.4, wall: 0x8a8e94, roof: 0xd8e8ff }); }); }
    { const o = MONU.desgraca, s0 = site('Gorvath', o.x, o.y, 20, 20, 6, 'Vale da Desgraça', 'blight', o.R + 2); const pts: [number, number][] = [[o.x + 0.5, o.y + o.R + 6], [o.x + 0.5, o.y + 11]]; road(pts, 1.25, 0); /* entra pela brecha do sul da crista */ if (s0.vv) road([[s0.vv.x, s0.vv.y - 3], pts[0]], 1.1, 0.3);
      scatter(o.x, o.y, o.top, o.R + 6, 70, (x, y, k) => { const q = k % 5; if (q === 0) props.push({ kind: 'totem', gx: x, gy: y, w: 1, h: 1, height: 3.6, wall: 0, roof: 0, variant: 2 }); else if (q === 1) props.push({ kind: 'fogpatch', gx: x, gy: y, w: 1, h: 1, height: 1, wall: 0x3a2a4a, roof: 0x9a5ad0, variant: 0 }); else if (q === 2) props.push({ kind: 'bones', gx: x, gy: y, w: 1, h: 1, height: 0.4, wall: 0xd8d0b8, roof: 0, variant: Math.floor(rnd() * 3) }); else { props.push({ kind: 'tree', gx: x, gy: y, w: 1, h: 1, height: 4 + rnd() * 4, wall: 0x2a2226, roof: 0x3a2a40, variant: 1 }); map[y][x] = 'tree'; } }); }
    /* 27/10: os Portões de Brasaforja, a maravilha dos anões: a face da Montanha Negra escavada logo ao norte da vila, com o Grande Salão por dentro (salao3d.ts) */
    { const bf = settlements.find((q) => q.name === 'Brasaforja'); if (bf) { const gx = bf.x - 8, gy = bf.y - 13 - 3 - 12, W = 16, H = 12, hb = groundH_L(bf.x * T, bf.y * T);
        pads.push({ x: (gx + W / 2) * T, z: (gy + H + 1) * T, r: 13 * T, h: hb }); pads.push({ x: (gx + W / 2) * T, z: (gy + H * 0.78) * T, r: 7 * T, h: hb }); /* 08/11 (Erling: "não estou subindo a escada, o relevo está me engolindo"): a escadaria e o patamar ficam na altura da vila */ clearArea(gx + W / 2, gy + H / 2, 18); /* só o pátio e a frente ficam na altura da vila: atrás, a montanha sobe e engole o portão (Erling: "ele deveria entrar na montanha") */
        for (let yy = gy - 3; yy <= bf.y - 12; yy++) for (let xx = gx - 4; xx <= gx + W + 4; xx++) if (inb(xx, yy) && map[yy][xx] !== 'water') map[yy][xx] = 'grass';
        for (let i = props.length - 1; i >= 0; i--) { const q = props[i]; if (q.gx >= gx - 4 && q.gx <= gx + W + 4 && q.gy >= gy - 3 && q.gy <= bf.y - 12) props.splice(i, 1); }
        block({ kind: 'monument', gx, gy, w: W, h: H, height: 30, wall: 0, roof: 0, variant: 9 });
        /* 08/11 (Erling: "não consigo passar aqui, trava"): o bloco de 16 tiles era mais largo que a fachada — as laterais da frente voltam a ser chão livre */
        for (let yy = gy + 5; yy <= gy + H - 1; yy++) for (const xx of [gx, gx + 1, gx + 2, gx + W - 3, gx + W - 2, gx + W - 1]) if (inb(xx, yy)) map[yy][xx] = 'grass';
        for (let yy = gy + 8; yy <= gy + H - 1; yy++) for (let xx = gx + 3; xx <= gx + W - 4; xx++) if (inb(xx, yy)) map[yy][xx] = 'plaza'; /* a escadaria e o patamar se sobem: dá para encostar na porta */
        for (let yy = gy + H; yy <= gy + H + 3; yy++) for (let xx = gx + 3; xx <= gx + W - 4; xx++) if (inb(xx, yy)) map[yy][xx] = 'plaza';
        for (let yy = gy + H + 4; yy <= bf.y - 2; yy++) for (const ox of [-1, 0, 1]) if (inb(bf.x + ox, yy) && map[yy][bf.x + ox] !== 'wall') map[yy][bf.x + ox] = 'road';
        landmarkDoor['Brasaforja'] = { x: gx + W / 2 + 1.6, y: gy + H + 1.6 }; pois.push({ name: 'Portões de Brasaforja', x: gx + W / 2, y: gy + H + 2, biome: 'volcanic' });
        for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) { const xx = bf.x + sx * 3, yy = gy + H + 5 + k * 3; if (inb(xx, yy) && map[yy][xx] === 'grass') props.push({ kind: 'torch', gx: xx, gy: yy, w: 1, h: 1, height: 2.2, wall: 0x3a2a1c, roof: 0xff8a3a }); } } }
    /* 27/10: a Montanha Negra inteira é alta demais para pisar fora de estrada; a masmorra do Coração e a relíquia da cratera ficavam ilhadas (quem chegava pela relíquia não andava). Estrada de Brasaforja até a boca do Coração e caracol até a cratera */
    { const vx = LORE.negra.x, vy = LORE.negra.y - 8, bf = settlements.find((q) => q.name === 'Brasaforja'); const mouth: [number, number] = [599.5, 130.5];
      if (bf) road([[bf.x + 4, bf.y - 2], [578, 168], [590, 148], mouth], 1.25, 0.2);
      const a0 = Math.atan2(mouth[1] - vy, mouth[0] - vx), r0 = Math.hypot(mouth[0] - vx, mouth[1] - vy), pts: [number, number][] = [];
      for (let i = 0; i <= 120; i++) { const t = i / 120, ang = a0 + t * Math.PI * 2 * 1.1, r = r0 - t * (r0 - 8); pts.push([vx + Math.cos(ang) * r, vy + Math.sin(ang) * r]); }
      pts.push([645.5, 103.5]); road(pts, 1.25, 0);
      /* pátio de estrada na cratera (a relíquia precisa de um bolsão de grama com estrada ao lado: 645–646 × 100–101 fica de fora) e na boca da masmorra */
      for (let y = 96; y <= 106; y++) for (let x = 640; x <= 651; x++) if (inb(x, y) && Math.hypot(x - 645.5, y - 101.5) < 5 && map[y][x] === 'grass' && !(x >= 645 && x <= 646 && y >= 100 && y <= 101)) map[y][x] = 'road';
      for (let y = 122; y <= 131; y++) for (let x = 596; x <= 605; x++) if (inb(x, y) && Math.hypot(x - 600.5, y - 126.5) < 4.5 && map[y][x] === 'grass') map[y][x] = 'plaza'; }
    { const o = MONU.uivo, s0 = site('Uivo Antigo', o.x, o.y, 18, 18, 7, 'Árvore-Mãe do Uivo', 'jungle', 16); if (s0.vv) road([[s0.vv.x, s0.vv.y - 3], [o.x + 0.5, s0.gy + 18 + 2]], 1.1, 0.3);
      /* 27/10 (Erling: "não consigo me aproximar da árvore"): só o tronco é sólido (colisão no main); o resto do terreno da árvore é chão */
      for (let yy = s0.gy; yy < s0.gy + 18; yy++) for (let xx = s0.gx; xx < s0.gx + 18; xx++) if (inb(xx, yy) && map[yy][xx] === 'wall') map[yy][xx] = 'grass';
      scatter(o.x, o.y, 11, 20, 40, (x, y, k) => { if (k % 3 === 0) props.push({ kind: 'totem', gx: x, gy: y, w: 1, h: 1, height: 3.8, wall: 0, roof: 0, variant: 0 }); else { props.push({ kind: 'tree', gx: x, gy: y, w: 1, h: 1, height: 6 + rnd() * 3, wall: 0x4a3220, roof: 0x2a4a2a, variant: 0 }); map[y][x] = 'tree'; } }); }
  }
  /* relíquias dos caminhantes (pedras de viagem): só onde se precisa ir — na saída de cada cidade e vila, à beira da estrada,
     nos acampamentos e covis (pontos de caça e de missão) e no coração de cada região de caça. Nunca no meio do nada:
     a pedra fica do lado de uma estrada ou de um ponto conhecido, e duas pedras não ficam a menos de 22 casas uma da outra. */
  {
    const okT = (x: number, y: number) => inb(x, y) && map[y][x] === 'grass' && map[y + 1]?.[x] === 'grass' && map[y]?.[x + 1] === 'grass' && !props.some((q) => q.gx === x && q.gy === y);
    const nearRoad = (x: number, y: number, r: number) => { for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (map[y + dy]?.[x + dx] === 'road') return true; return false; };
    const place = (name: string, x0: number, y0: number, wantRoad: boolean, minGap = 22) => {
      /* 01/11 (Erling: "pedra muito próxima uma da outra não pode"): a folga mínima (≥30 casas = 60 m) vale para o LUGAR ESCOLHIDO, não só para o alvo */
      minGap = minGap === 24 ? 24 : Math.max(minGap, 38); /* 02/11 (Erling): folga entre pedras +25% (30 → 38 casas); 24 = pedra de calabouço/lugar marcado, que precisa ficar perto dele */ if (relics.some((q) => Math.hypot(q.x - x0, q.y - y0) < minGap * 0.5)) return false;
      { /* 02/11 (Erling: "3 pedras dentro da mesma cidade?"): teto por povoado — cidade grande 3, cidade pequena 2, vila 1 */
        const st2 = settlements.find((t) => Math.hypot(t.x - x0, t.y - y0) < t.radius + 10); if (st2) { const cap = st2.kind === 'city' ? (st2.radius >= 30 ? 3 : 2) : st2.name === 'Karmika' ? 2 : 1; const have = relics.filter((q) => Math.hypot(q.x - st2.x, q.y - st2.y) < st2.radius + 10).length; if (have >= cap) return false; } }
      for (let r = 1; r < (wantRoad ? 14 : 26); r++) for (let k = 0; k < r * 8; k++) { const a = (k / (r * 8)) * 6.283, x = Math.round(x0 + Math.cos(a) * r), y = Math.round(y0 + Math.sin(a) * r); if (relics.some((q) => Math.hypot(q.x - x, q.y - y) < minGap)) continue; /* 27/10: sem estrada por perto, procura mais longe (a Colina Vampírica ficava sem pedra) */
        if (!okT(x, y) || (wantRoad && !nearRoad(x, y, 2)) || nearRoad(x, y, 0)) continue;
        if (settlements.some((t) => t.kind === 'city' && Math.abs(t.x - x) <= t.radius + 4 && Math.abs(t.y - y) <= t.radius + 4)) continue; // fora da muralha
        /* pedra escondida atrás de árvore NÃO PODE (Erling, 01/11): limpa árvores, pedras e ervas num raio de 3 casas em volta */
        for (let i = props.length - 1; i >= 0; i--) { const q = props[i]; if ((q.kind === 'tree' || q.kind === 'rock' || q.kind === 'herb' || q.kind === 'plant' || q.kind === 'bones') && Math.hypot(q.gx - x, q.gy - y) <= 3.2) { if (q.kind === 'tree' && map[q.gy]?.[q.gx] === 'tree') map[q.gy][q.gx] = 'grass'; props.splice(i, 1); } }
        block({ kind: 'relic', gx: x, gy: y, w: 1, h: 1, height: 2.6, wall: 0x6a6a72, roof: 0x4a9aff }); relics.push({ name, x, y }); return true; } /* a pedra rúnica (prancha 34) em todo lugar; os portais da prancha 33 (portais3d.ts) ficam guardados, sem uso (Erling, 01/11) */
      return false; };
    /** a saída de um assentamento: o primeiro trecho de estrada logo fora dele (de preferência ao sul, de frente para a câmera) */
    const exitOf = (t: Settlement): [number, number] => { const R = t.kind === 'city' ? t.radius + 3 : t.radius; let best: [number, number] | null = null, bs = 1e9;
      for (let dy = -R - 4; dy <= R + 4; dy++) for (let dx = -R - 4; dx <= R + 4; dx++) { const x = t.x + dx, y = t.y + dy, d = Math.max(Math.abs(dx), Math.abs(dy)); if (d < R + 2 || d > R + 4 || map[y]?.[x] !== 'road') continue; const sc = -dy * 2 + Math.abs(dx) * 0.2; if (sc < bs) { bs = sc; best = [x, y]; } }
      return best ?? [t.x, t.y + R + 3]; };
    const kar = settlements.find((t) => t.name === 'Karmika'); if (kar) { const [x, y] = exitOf(kar); place('Relíquia de Karmika', x, y, true, 0); }
    for (const t of settlements) if (t.name !== 'Karmika') { const [x, y] = exitOf(t); place(`Relíquia de ${t.name}`, x, y, true, 14); }
    for (const pn of ['Acampamento Draugr', 'Covil dos Lobos', 'Atoleiro de Zerath', 'Cume Gelado', 'Garganta de Pedra', 'Cemitério Esquecido', 'Igreja Abandonada', 'Clareira dos Gritos']) { const q = pois.find((v) => v.name === pn); if (q && !relics.some((r) => Math.hypot(r.x - q.x, r.y - q.y) < 40)) place(`Relíquia: ${pn}`, q.x, q.y + 5, false, 24); }
    /* 02/11 (Erling: "construções importantes sem pedra de regresso próxima"): uma pedra perto de cada calabouço/lugar marcado que ainda não tem */
    /* 02/11 (Erling: "calabouços nunca próximos uns dos outros, nunca ao lado de vilas, espalhar pelo mapa"): o lugar de cada entrada é decidido AQUI.
       Regras: 5×5 livre (sem prédio, água, muro), ≥ 30 casas além do raio do povoado mais perto (Karmika: 36 — fora da muralha e do campo dela),
       ≥ 40 casas (80 m) de qualquer outra entrada; a busca parte do lugar marcado (near + dx,dy) e abre em espiral até 60 casas.
       `spot` = lugar exato reservado pelo mundo (Túneis de Orrukh, dentro do cemitério). A pedra rúnica nasce a 6 casas da boca. */
    { const occ = new Set<number>(); for (const q of props) if (q.kind !== 'tree' && q.kind !== 'herb' && q.kind !== 'plant' && q.kind !== 'rock' && q.kind !== 'bones' && q.kind !== 'grave') for (let y = q.gy - 1; y <= q.gy + q.h; y++) for (let x = q.gx - 1; x <= q.gx + q.w; x++) occ.add(y * 100000 + x);
      const placed: { x: number; y: number }[] = [];
      /* relax = 1 (03/11): a Toca do Covil dos Lobos não achava lugar e sumia do mapa ("calabouço sem lugar"). Na segunda busca o miolo
         aceita qualquer chão firme (mata, terra, pedra), a distância de outra entrada cai para 28 casas e a busca vai a 120 casas */
      const okSpot = (x: number, y: number, relax = 0) => { for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const t = map[y + dy]?.[x + dx]; if (!t || t === 'water' || t === 'wall') return false; const core = Math.abs(dx) <= 1 && Math.abs(dy) <= 1; if (core && ((relax ? false : t !== 'grass') || occ.has((y + dy) * 100000 + x + dx))) return false; }
        if (settlements.some((t) => Math.hypot(t.x - x, t.y - y) < t.radius + (t.name === 'Karmika' ? 36 : 30))) return false; if (placed.some((q) => Math.hypot(q.x - x, q.y - y) < (relax ? 28 : 40))) return false; return true; };
      for (const d of DUNGEONS) { if (d.fixed) continue; const t = pois.find((v) => v.name === d.near) ?? settlements.find((v) => v.name === d.near); if (!t) continue; const bx = Math.round(t.x + (d.dx ?? 0)), by = Math.round(t.y + (d.dy ?? 6));
        let at: { x: number; y: number } | null = d.spot ? { x: bx, y: by } : null;
        for (let relax = 0; relax <= 1 && !at; relax++) for (let rr = 0; rr <= (relax ? 120 : 60) && !at; rr++) for (let k = 0; k < Math.max(1, rr * 8) && !at; k++) { const a = (k / Math.max(1, rr * 8)) * 6.283, x = Math.round(bx + Math.cos(a) * rr), y = Math.round(by + Math.sin(a) * rr); if (inb(x, y) && okSpot(x, y, relax)) at = { x, y }; }
        if (!at) { console.warn('calabouço sem lugar:', d.name); continue; } dgSpots[d.id] = at; placed.push(at); for (let y = at.y - 2; y <= at.y + 2; y++) for (let x = at.x - 2; x <= at.x + 2; x++) occ.add(y * 100000 + x);
        /* a árvore/pedra que estava no lugar sai; a casa vira capim */ for (let i = props.length - 1; i >= 0; i--) { const q = props[i]; if ((q.kind === 'tree' || q.kind === 'rock' || q.kind === 'herb' || q.kind === 'plant' || q.kind === 'bones' || q.kind === 'grave') && Math.abs(q.gx - at.x) <= 2 && Math.abs(q.gy - at.y) <= 2) props.splice(i, 1); } for (let y = at.y - 2; y <= at.y + 2; y++) for (let x = at.x - 2; x <= at.x + 2; x++) if (map[y]?.[x] === 'tree') map[y][x] = 'grass';
        if (!relics.some((r) => Math.hypot(r.x - at!.x, r.y - at!.y) < 60)) place(`Relíquia: ${d.name}`, at.x, at.y + 6, false, 24); } } /* uma pedra de regresso perto de cada calabouço */
    /* 07/11 (Erling: "há um exagero de pedras de teleporte, corte 50%, deixe nos pontos importantes, cidades e vilas"): os lugares soltos só ganham pedra se não houver outra a 60 casas */
    for (const w of WILD_L) if (w.kind !== 'gruta' && !relics.some((r) => Math.hypot(r.x - w.x, r.y - w.y) < 90)) place(`Relíquia: ${w.name}`, w.x, w.y + (w.lake ?? 0) + 6, false, 24); /* 02/11: pedra de regresso perto de cada lugar novo (as grutas ganham a do calabouço) */
    for (const pn of ['Mausoléu do Bispo', 'Catedral Abandonada', 'Ruínas de Aravel', 'Cripta de Hemara', 'Fortaleza de Odin', 'Clareira dos Gritos']) { const q = pois.find((v) => v.name === pn) ?? settlements.find((v) => v.name === pn); if (q && !relics.some((r) => Math.hypot(r.x - q.x, r.y - q.y) < 24)) place(`Relíquia: ${pn}`, q.x, q.y + 6, false, 24); }
    for (const rg of REGIONS_L) { const edge = rg.id >= 23 ? 48 / Math.max(1, Math.hypot(420 - rg.x, 420 - rg.y)) : 0 /* 07/11: as regiões das bordas têm o centro na beira do mapa; a pedra entra 48 casas para dentro */; const rx = rg.name === 'Colina Vampírica' ? 764 : Math.round(rg.x + (420 - rg.x) * edge), ry = rg.name === 'Colina Vampírica' ? 270 : Math.round(rg.y + (420 - rg.y) * edge); if (rg.id !== 1 && relics.some((r) => regionAt_L(r.x, r.y) === rg)) continue; /* 07/11: a pedra da região só onde não há outra perto (toda região continua com pelo menos uma) */ /* 27/10: a pedra da Colina fica na frente do castelo (perto demais da de Corvoscuro no sopé) */ place(`Relíquia: ${rg.name}`, rx, ry, true) || place(`Relíquia: ${rg.name}`, rx, ry, false); }
  }
  /* ervas (herborismo): não bloqueiam o caminho; gerador próprio para não mexer no resto do mundo.
     0 Folha-de-Prata (campos e matas) · 1 Cogumelo-Lamparina (pântano e mata fechada) · 2 Raiz-Sangue (pântano, ruínas, rocha) · 3 Flor-de-Marghar (rara, perto das relíquias) */
  { const rh = rng(31337); const HD: Record<Biome, number> = { meadow: 0.014, forest: 0.016, swamp: 0.022, snow: 0.004, ruins: 0.012, rock: 0.008, volcanic: 0.003, enchanted: 0.03, blight: 0.012, jungle: 0.02, coast: 0.006 };
    for (let y = 2; y < MAP_H_L - 2; y++) for (let x = 2; x < MAP_W_L - 2; x++) {
      const v = rh(), w = rh(); if (map[y][x] !== 'grass') continue; const bm = biome[y][x];
      const nearRelic = relics.some((q) => Math.abs(q.x - x) < 9 && Math.abs(q.y - y) < 9);
      if (v > HD[bm] * (nearRelic ? 2.5 : 0.3)) continue; // soltas são raras (achado): o grosso nasce em canteiros, logo abaixo
      if (nearSettle(x, y, 1)) continue;
      let kind = bm === 'swamp' ? (w < 0.45 ? 1 : w < 0.8 ? 2 : 0) : bm === 'forest' ? (w < 0.6 ? 0 : w < 0.9 ? 1 : 2) : bm === 'ruins' || bm === 'rock' ? (w < 0.55 ? 2 : 0) : 0;
      if (rh() < (nearRelic ? 0.2 : 0.025)) kind = 3;
      props.push({ kind: 'herb', gx: x, gy: y, w: 1, h: 1, height: 0.5, wall: 0, roof: 0, variant: kind });
    }
    /* flores e juncos nascem em canteiros: manchas aglomeradas de uma espécie (e uma cor só), nunca pontinhos soltos espalhados */
    const herbAt = new Set(props.filter((q) => q.kind === 'herb').map((q) => q.gy * 100000 + q.gx));
    const rj = rng(4242);
    const patch = (cx: number, cy: number, variant: number, n: number, spread: number, ok: (x: number, y: number) => boolean) => { const tone = Math.floor(rj() * 4);
      for (let k = 0, tries = 0; k < n && tries < n * 6; tries++) { const a = rj() * 6.283, d = Math.sqrt(rj()) * spread, x = Math.round(cx + Math.cos(a) * d), y = Math.round(cy + Math.sin(a) * d);
        if (!inb(x, y) || herbAt.has(y * 100000 + x) || !ok(x, y)) continue; props.push({ kind: 'herb', gx: x, gy: y, w: 1, h: 1, height: variant === 4 ? 1.1 : 0.5, wall: 0, roof: 0, variant, ry: tone }); herbAt.add(y * 100000 + x); k++; } };
    const isGrass = (x: number, y: number) => map[y][x] === 'grass' && !nearSettle(x, y, 1);
    const wet = (x: number, y: number) => map[y][x] === 'grass' && (map[y - 1]?.[x] === 'water' || map[y + 1]?.[x] === 'water' || map[y][x - 1] === 'water' || map[y][x + 1] === 'water') && !nearSettle(x, y, 1);
    // juncos: touceiras na beira de rios e lagos
    for (let y = 2; y < MAP_H_L - 2; y++) for (let x = 2; x < MAP_W_L - 2; x++) if (wet(x, y) && rj() < 0.012) patch(x, y, 4, 3 + Math.floor(rj() * 4), 2.2, wet);
    // canteiros de flores e de folha-de-prata pelos prados e matas (poucos e cheios)
    const PB: Partial<Record<Biome, number>> = { meadow: 0.0016, forest: 0.0007, enchanted: 0.003, coast: 0.0006, jungle: 0.0008 };
    for (let y = 2; y < MAP_H_L - 2; y++) for (let x = 2; x < MAP_W_L - 2; x++) { const pb = PB[biome[y][x]]; if (!pb || map[y][x] !== 'grass' || rj() > pb) continue; patch(x, y, rj() < 0.65 ? 5 : 0, 4 + Math.floor(rj() * 5), 1.8, isGrass); }
    // em volta de cada povoado, dois ou três canteiros perto da estrada (quem começa acha logo o que colher)
    for (const t of settlements) { const n = 2 + Math.floor(rj() * 2); for (let k = 0; k < n; k++) { const a = rj() * 6.283, d = t.radius + 5 + rj() * 10; patch(Math.round(t.x + Math.cos(a) * d), Math.round(t.y + Math.sin(a) * d), k === 0 ? 0 : 5, 5 + Math.floor(rj() * 4), 1.8, isGrass); } }
  }
  /* plantas de cenário (pranchas 56/57, 01/11): canteiros pequenos de UMA espécie por bioma, poucos (Erling: "cuidado com as quantidades");
     nenúfares só na água rasa junto à margem. Não bloqueiam e não se colhem. */
  { const rp = rng(5151); const taken = new Set(props.filter((q) => q.kind === 'herb' || q.kind === 'plant').map((q) => q.gy * 100000 + q.gx));
    const PD: Record<Biome, number> = { meadow: 0.0014, forest: 0.0022, swamp: 0.0024, snow: 0.0008, ruins: 0.0014, rock: 0.0012, volcanic: 0.0006, enchanted: 0.0026, blight: 0.0014, jungle: 0.0026, coast: 0.0012 };
    const okG = (x: number, y: number) => inb(x, y) && map[y][x] === 'grass' && !taken.has(y * 100000 + x) && !nearSettle(x, y, 1);
    for (let y = 2; y < MAP_H_L - 2; y++) for (let x = 2; x < MAP_W_L - 2; x++) {
      if (map[y][x] !== 'grass' || rp() > PD[biome[y][x]]) continue; const pl = pickPlant(biome[y][x], rp()), n = 2 + Math.floor(rp() * 3);
      for (let k = 0, tries = 0; k < n && tries < n * 5; tries++) { const a = rp() * 6.283, d = Math.sqrt(rp()) * 1.6, px = Math.round(x + Math.cos(a) * d), py = Math.round(y + Math.sin(a) * d); if (!okG(px, py)) continue; props.push({ kind: 'plant', plant: pl, gx: px, gy: py, w: 1, h: 1, height: 0.6, wall: 0, roof: 0, variant: Math.floor(rp() * 3) }); taken.add(py * 100000 + px); k++; }
    }
    for (let y = 2; y < MAP_H_L - 2; y++) for (let x = 2; x < MAP_W_L - 2; x++) { const wp = WATER_PLANTS[biome[y][x]]; if (!wp || map[y][x] !== 'water' || rp() > 0.004) continue;
      if (!(map[y - 1][x] === 'grass' || map[y + 1][x] === 'grass' || map[y][x - 1] === 'grass' || map[y][x + 1] === 'grass')) continue;
      if (waterSD_L((x + 0.5) * T, (y + 0.5) * T) > -0.05) continue; /* a faixa 'water' inclui 1,3 m de margem acima d'água: ali o nenúfar ficava enterrado no barranco */
      props.push({ kind: 'plant', plant: wp, gx: x, gy: y, w: 1, h: 1, height: 0.1, wall: 0, roof: 0, variant: Math.floor(rp() * 3) }); }
  }
  for (const sp of spawns) { const rg = regionAt_L(sp.x, sp.y), k = RANK[sp.type] ?? 0.5; sp.lvl = sp.fixLvl ?? Math.max(rg.lo, Math.min(rg.hi, Math.round(rg.lo + k * (rg.hi - rg.lo)))); }
  { /* mestres dos caminhos (a Vidente de Askavik manda o jogador até eles no nível 20) */
    const M: [string, string, string, 'nordic' | 'dwarf' | 'technocrat', number, string[]][] = [
      ['Jarlsheim', 'Thorgrim Mão-de-Ferro', 'Mestre de Armas do Clã do Corvo', 'nordic', 0x6a4a3a, ['A Fortaleza de Odin não recebe turistas. Recebe guerreiros.', 'Mostre-me as mãos. Calo de machado não se finge.', 'A sexta runa? Está na pedra de Odin desde antes do meu avô. Guerreiro não pergunta à pedra o que ela quer dizer.']],
      ['Austrvik', 'Grão-Mestre Cassius', 'Grão-Mestre da Ordem de Auréon', 'nordic', 0xe8d8a8, ['A Abadia da Aurora acende a vela antes do sol. Sempre antes.', 'Auréon não pede que você seja puro. Pede que você fique.', 'A sexta runa é da liturgia, e liturgia não se discute. Traçamos no batismo e na ordenação. Sempre traçamos.']],
      ['Sudrholt', 'Mestra Ilsa Van Rhal', 'Líder do Clã Helsing', 'nordic', 0x4a4a52, ['Prata, estaca e paciência. O resto se aprende sangrando.', 'O Bastião de Prata nunca dormiu uma noite inteira.', 'A runa sem nome? Está gravada em toda besta do Bastião. Se eu soubesse o que ela faz, não teria dormido nem as três horas.']],
      ['Corvoscuro', 'Conde Vladislav III', 'Senhor da Colina Vampírica', 'nordic', 0x5a1a22, ['Entre. Ou não. A porta sempre esteve aberta para quem tem sede.', 'O tempo é o único tesouro. Eu tenho de sobra.', 'A sexta runa está no selo da Casa há mil anos. Mil anos não erram, caminhante. Ou erram devagar demais para que eu note.']],
      ['Uivo Antigo', 'Ulfrun, a Mãe-Alfa', 'Mãe-Alfa do Uivo Antigo', 'nordic', 0x7a6a50, ['A matilha sentiu o seu cheiro três vilas atrás.', 'A lua não pergunta se você quer. Ela chama.', 'Runa? A matilha não lê. A matilha fareja. E aquela sexta não tem cheiro nenhum. Isso eu não gosto.']],
      ['Lumenhal', 'Arquimago Aurelian Vesk', 'Arquimago do Pináculo de Marfim', 'technocrat', 0x8a9ad8, ['O Pináculo vê longe. Viu você chegando.', 'Magia é paciência com fórmula.', 'A sexta runa é o fecho do círculo. Todo círculo precisa de um fecho. O que ela significa? Significa que o círculo fecha. Próxima pergunta.']],
      ['Gorvath', 'Malgrath, Senhor dos Pactos', 'Senhor dos Pactos do Vale', 'nordic', 0x3a2a4a, ['Todo poder tem preço. O meu é justo. Quase sempre.', 'Leia o contrato. Ninguém lê o contrato.', 'A sexta runa está no rodapé de todo pacto meu. Não fui eu quem a pôs lá. Isso devia preocupar você mais do que me preocupa.']],
    ];
    for (const [vn, nm, role, kind, tint, lines] of M) { const t = settlements.find((q) => q.name === vn), ld = landmarkDoor[vn]; if (t) t.npcs.push({ name: nm, role, kind, x: ld ? ld.x : t.x - 4.5, y: ld ? ld.y : t.y + 1.5, radius: 2, tint, scale: 1.05, lines }); }
    /* a Companhia das Caravanas de Latão e a Corte (24/10): quem liga paladino, vampiro e tecnocrata */
    { const ex = (vn: string, n: NpcSpec) => { const t = settlements.find((q) => q.name === vn); if (t) t.npcs.push(n); };
      ex('Askavik', { name: 'Feitora Brunna', role: 'Companhia das Caravanas de Latão', kind: 'technocrat', x: ASKAVIK_L.x + 3.5, y: ASKAVIK_L.y + 59, radius: 1.5, tint: 0x8a3a24, scale: 1.0, shop: 'latao', lines: ['A Companhia leva qualquer coisa a qualquer lugar. O preço é o caminho.', 'As carroças saem daqui e do portão leste. Escolta boa vale ouro.', 'Engrenagem para a Catedral, relógio para o Conde. Não me pergunte o que eu acho disso.'] });
      ex('Corvoscuro', { name: 'Lady Mirela', role: 'Herdeira da Casa Noctavar', kind: 'nordic', x: 724 + 3, y: 262 + 2.5, radius: 1.2, tint: 0x6a1424, scale: 1.0, night: true, lines: ['A Corte recebe à meia-noite. Nem antes, nem depois.', 'O Conde não sobe a colina para ninguém. Quem sobe é quem merece.', 'Sede é natural. Falta de modos, não.'] });
      ex('Porto Caldeira', { name: 'Mestre Orvald', role: 'Mestre-Caravaneiro da Companhia', kind: 'dwarf', x: PORTO_L.x + 11.5, y: PORTO_L.y + 9.5, radius: 1.5, tint: 0x7a4a2a, scale: 1.0, lines: ['Cada carroça que sai deste porto leva o nome da Companhia. E o meu.', 'Vapor, graxa e contas certas. O resto é conversa.'] });
      /* as missões do instinto da raça (24/10) */
      ex('Skógar', { name: 'Marta, a Moleira', role: 'Moleira de Skógar', kind: 'nordic', x: 128 + SH + 2.5, y: 262 + SH - 2, radius: 1.5, tint: 0x9a7a5a, scale: 0.95, lines: ['O moinho não para. Nem quando o coração para.', 'A minha Nina conhece cada pedra desta mata.'] });
      ex('Askavik', { name: 'Marechal Heloísa Brandão', role: 'Guardiã da Honra Kármica', kind: 'nordic', x: ASKAVIK_L.x - 36, y: ASKAVIK_L.y + 10, radius: 1.0, tint: 0xc0a040, scale: 1.02, lines: ['Na capital a honra pesa mais que o ouro. Aqui ela compra o que o ouro não alcança.', 'Cada peça desta mesa veio de alguém que fez o que precisava ser feito.'], shop: 'honra_humano' });
      ex('Porto Caldeira', { name: 'Intendente Cassius Volt', role: 'Guardião da Honra Kármica', kind: 'technocrat', x: PORTO_L.x - 8, y: PORTO_L.y + 6, radius: 1.0, tint: 0xc0a040, scale: 1.0, lines: ['A Companhia mede tudo em latão. Eu meço em honra. Dá mais trabalho e vale mais.', 'Traga feitos, não moedas.'], shop: 'honra_humano' });
      ex('Lithendel', { name: 'Sílvathir Lúmenar', role: 'Guardião do Juramento · Honra Kármica', kind: 'nordic', x: 84 + 3.5, y: 404 + 3, radius: 1.0, tint: 0x9ad8a0, scale: 1.02, lines: ['O Juramento não se vende. O que está nesta mesa é devolvido a quem o honrou.', 'Honra Kármica é o que fica quando o ouro acaba.'], shop: 'honra_elfo' });
      ex('Lithendel', { name: 'Anciã Faelwen', role: 'Anciã de Lithendel', kind: 'nordic', x: 84 - 2.5, y: 404 + 2, radius: 1.2, tint: 0x5a8a6a, scale: 1.0, lines: ['As árvores daqui eram velhas quando os reis dos homens eram crianças.', 'A mata fala. Pouca gente escuta.'] });
      ex('Brasaforja', { name: 'Mestre-Forjador Brokki', role: 'Mestre da Forja de Elite', kind: 'dwarf', x: 560 - 3.5, y: 186 + 2.5, radius: 1.2, tint: 0x8a3a1a, scale: 1.05, lines: ['Ferro qualquer um bate. Presa de alfa, só eu.', 'Me traga o que os bichos grandes deixam, e eu te faço o que nenhuma loja vende.'] });
      ex('Brasaforja', { name: 'Mestre-Mineiro Dvalin', role: 'Mestre das Galerias', kind: 'dwarf', x: 560 + 3, y: 186 + 2.5, radius: 1.5, tint: 0x6a4a2a, scale: 1.0, lines: ['Pedra boa canta quando você bate. Pedra ruim chora.', 'Meu avô dizia: escute a montanha antes de cavar nela.'] });
      /* 02/11: o Cameleiro de Vindholt — a missão do Gênio do oásis (quests.ts, "O Gênio do Lago") */
      ex('Vindholt', { name: 'Yusuf, o Cameleiro', role: 'Guia das Caravanas do Deserto', kind: 'nordic', x: 470 + 3.5, y: 640 - 2, radius: 1.5, tint: 0xc8a060, scale: 1.0, lines: ['Três caravanas foram ao Oásis da Miragem. Voltaram dois camelos e nenhum homem.', 'No deserto, a água que chama você pelo nome não é água.'] });
      ex('Austrvik', { name: 'Irmão Tobias', role: 'Sineiro da Abadia da Aurora', kind: 'nordic', x: 392 + SH - 2, y: 292 + SH + 2.5, radius: 1.5, tint: 0xd8c89a, scale: 0.95, lines: ['Os sinos da Abadia eram de bronze. Agora são de engrenagem. Funcionam melhor, quando funcionam.', 'Toco antes do sol. Sempre antes.'] }); }
    /* a campanha que viaja (25/10): uma pessoa nova em cada vila do roteiro do Caminho do Norte (campanha.ts) */
    const ak = settlements.find((q) => q.name === 'Askavik'); if (ak) { /* Hrefna e o santuário da Deusa dos Caminhos: pedras de pé em roda, no lado oeste da praça */
      const hx = ak.x - 12, hy = ak.y + 12; ak.npcs.push({ name: 'Hrefna', role: 'Vidente dos Caminhos', kind: 'nordic', x: hx + 0.5, y: hy + 0.5, radius: 2.5, tint: 0x6a4a8a, scale: 1.0, lines: ['A Deusa dos Caminhos não escolhe por ninguém. Mas ela vê.', 'Volte quando o seu caminho pesar. No nível 30 eu leio você.', 'São dez velas. Nove eu acendo toda noite. A décima… quando eu lembrar de quem é, eu conto.'] });
      for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2 + 0.3, gx = Math.round(hx + Math.cos(a) * 3.2), gy = Math.round(hy + Math.sin(a) * 3.2); if (inb(gx, gy) && map[gy][gx] !== 'water') props.push({ kind: 'obelisk', gx, gy, w: 1, h: 1, height: 2.2, wall: 0x6a6a78, roof: 0x9b6ad0, variant: k % 3 }); }
      pois.push({ name: 'Santuário dos Caminhos', x: hx, y: hy, biome: 'meadow' }); } }
  const hubX = (t: Settlement) => t.name === 'Askavik' ? t.x - 37 : t.x; // na cidade, o centro de serviços é a Praça do Mercado (o centro é a catedral)
  { /* caixa de correio em cada povoado: no primeiro chão livre perto do centro */
    const taken = new Set<number>(); for (const p of props) for (let y = p.gy - 1; y <= p.gy + p.h; y++) for (let x = p.gx - 1; x <= p.gx + p.w; x++) taken.add(y * 100000 + x);
    for (const t of settlements) { let ok = false;
      for (let r = 2; r <= 9 && !ok; r++) for (let a = 0; a < 16 && !ok; a++) { const gx = Math.round(hubX(t) + Math.cos(a * 0.3927 + 0.6) * r), gy = Math.round(t.y + Math.sin(a * 0.3927 + 0.6) * r);
        if (!inb(gx, gy) || taken.has(gy * 100000 + gx) || !(map[gy][gx] === 'grass' || map[gy][gx] === 'plaza')) continue;
        props.push({ kind: 'mailbox', gx, gy, w: 1, h: 1, height: 1.6, wall: 0x3a3f46, roof: 0x8a6a3a, variant: 0 }); taken.add(gy * 100000 + gx); ok = true; }
      /* o Baú do Caminhante: ao lado do correio, o mesmo baú em todo povoado */
      let okv = false; for (let r = 2; r <= 9 && !okv; r++) for (let a = 0; a < 16 && !okv; a++) { const ang = (a % 2 ? 1 : -1) * Math.ceil(a / 2) * 0.3927 + 0.6 + Math.PI, gx = Math.round(hubX(t) + Math.cos(ang) * r), gy = Math.round(t.y + Math.sin(ang) * r); /* do outro lado do centro, de frente para o correio */
        if (!inb(gx, gy) || taken.has(gy * 100000 + gx) || !(map[gy][gx] === 'grass' || map[gy][gx] === 'plaza')) continue;
        props.push({ kind: 'vault', gx, gy, w: 1, h: 1, height: 1.2, wall: 0x4a3020, roof: 0xb08a40, variant: 0 }); for (let y = gy - 1; y <= gy + 1; y++) for (let x = gx - 1; x <= gx + 1; x++) taken.add(y * 100000 + x); okv = true; } }
    /* lugares de ofício (25/10, Erling: "como eu vou evoluir minhas coisas se a cidade simplesmente não tem?"): TODO povoado tem os cinco.
       Na cidade (Askavik, Karmika) são casas de verdade (Marcenaria, Forja, Curtume, Apotecário, Escola de Cozinha) e mais a Casa de Tecnologia;
       na vila é coisa simples (barracão de corte, forja ao ar livre, mesa do curtidor, apotecário pequeno, a cozinha dos fundos da taverna).
       As vilas de vapor (Porto Caldeira, Ferrugem, Vaporeira) têm também a Oficina de Latão. Árvore e pedra solta cedem o lugar. */
    const SOFTK = new Set<string>(SOFT_KINDS);
    const hard = new Set<number>(); for (const p of props) { if (SOFTK.has(p.kind as string)) continue; for (let y = p.gy - 1; y <= p.gy + p.h; y++) for (let x = p.gx - 1; x <= p.gx + p.w; x++) hard.add(y * 100000 + x); }
    for (const p of props) if (p.kind === 'vgate' || p.kind === 'gatehouse') { const R = Math.ceil(((p.len ?? 6) / T) / 2) + 2; for (let y = p.gy - R; y <= p.gy + R; y++) for (let x = p.gx - R; x <= p.gx + R; x++) hard.add(y * 100000 + x); } /* pórtico da vila: nada encosta nele */
    const TECH = new Set(['Porto Caldeira', 'Ferrugem', 'Vaporeira']);
    for (const t of settlements) { if (t.radius < 10) continue; /* cripta e clareira não são povoado */
      const city = t.kind === 'city' || t.name === 'Karmika', names = city ? STATION_NAMES.city : STATION_NAMES.village;
      const vs = t.name === 'Askavik' ? [5] : (city || TECH.has(t.name)) ? [0, 1, 2, 3, 4, 5] : [0, 1, 2, 3, 4]; /* Askavik já tem as cinco na Casa dos Ofícios */
      let S = city ? 3 : 2; const tav = !city ? props.find((p) => p.kind === 'house' && p.variant === 4 && Math.hypot(p.gx - t.x, p.gy - t.y) < t.radius + 4) : undefined;
      const fits = (gx: number, gy: number, soft: boolean) => { for (let y = gy - 1; y <= gy + S; y++) for (let x = gx - 1; x <= gx + S; x++) { if (!inb(x, y) || hard.has(y * 100000 + x)) return false; const m = map[y][x] as string; if (!['grass', 'plaza', 'dirt'].includes(m) && !(soft && m === 'tree')) return false; } return true; };
      const put = (v: number, gx: number, gy: number, ry: number) => {
        for (let i = props.length - 1; i >= 0; i--) { const p = props[i]; if (SOFTK.has(p.kind as string) && p.gx + p.w > gx - 1 && p.gx < gx + S + 1 && p.gy + p.h > gy - 1 && p.gy < gy + S + 1) props.splice(i, 1); }
        for (let y = gy; y < gy + S; y++) for (let x = gx; x < gx + S; x++) if (map[y][x] === 'tree') map[y][x] = 'grass';
        props.push({ kind: 'station', gx, gy, w: S, h: S, height: S === 3 ? 4.4 : 2.6, wall: 0x6a4a2a, roof: 0x6a4a2a, variant: v, ry, label: names[v] });
        for (let y = gy - 1; y <= gy + S; y++) for (let x = gx - 1; x <= gx + S; x++) { hard.add(y * 100000 + x); taken.add(y * 100000 + x); } };
      for (const v of vs) { let ok = false; S = city || v === 3 ? 3 : 2;
        if (v === 0) { /* MARCENARIA À BEIRA DO RIACHO (Erling 26/10): a roda d'água move as serras — procura um lugar com água a 2–3 casas do lado e vira a roda para ela */
          let best: { gx: number; gy: number; ry: number; wdir: number; d: number } | null = null;
          for (let r = city ? 8 : 5; r <= (city ? 44 : 26); r++) for (let a = 0; a < 48; a++) { const ang = a * 0.1309, gx = Math.round(hubX(t) + Math.cos(ang) * r) - (S >> 1), gy = Math.round(t.y + Math.sin(ang) * r) - (S >> 1);
            if (t.kind === 'city' && Math.hypot(gx - t.x, gy - t.y) > t.radius - 8) continue; if (!fits(gx, gy, true)) continue;
            const cx = gx + S / 2, cy = gy + S / 2; let wd = 99, wx = 0, wy = 0; for (let y = gy - 4; y <= gy + S + 3; y++) for (let x = gx - 4; x <= gx + S + 3; x++) { if (!inb(x, y) || map[y][x] !== 'water') continue; const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy); if (d < wd) { wd = d; wx = x + 0.5; wy = y + 0.5; } }
            if (wd > S / 2 + 3.2) continue; const ry = Math.atan2(hubX(t) - cx, t.y - cy);
            { let door = true; for (const k of [1, 2]) { const fx = Math.floor(cx + Math.sin(ry) * (S / 2 + k)), fy = Math.floor(cy + Math.cos(ry) * (S / 2 + k)); if (!inb(fx, fy) || !['grass', 'plaza', 'dirt', 'road'].includes(map[fy][fx] as string)) door = false; } if (!door) continue; }
            const score = wd + r * 0.08; if (!best || score < best.d) best = { gx, gy, ry, wdir: Math.atan2(wx - cx, wy - cy), d: score }; }
          if (best) { put(0, best.gx, best.gy, best.ry); props[props.length - 1].wdir = best.wdir; ok = true; } } /* o apotecário da vila também é casinha: farmácia pequena com antessala (Erling, 25/10) */
        if (v === 4 && tav) { /* a cozinha simples fica nos fundos da taverna: do lado de lá da casa, olhando a porta dos fundos */
          const hx = tav.gx + tav.w / 2, hy = tav.gy + tav.h / 2, bx = hx - hubX(t), by = hy - t.y, bl = Math.hypot(bx, by) || 1;
          for (let d = 0; d <= 3 && !ok; d++) for (let k = -2; k <= 2 && !ok; k++) { const ox = bx / bl, oy = by / bl, gx = Math.round(hx + ox * (tav.w / 2 + 1.6 + d) - oy * k) - 1, gy = Math.round(hy + oy * (tav.h / 2 + 1.6 + d) + ox * k) - 1;
            if (fits(gx, gy, true)) { put(4, gx, gy, Math.atan2(hx - gx - 1, hy - gy - 1)); ok = true; } } }
        for (let pass = 0; pass < 2 && !ok; pass++) for (let r = city ? 8 : 6; r <= (city ? 40 : 22) && !ok; r++) for (let a = 0; a < 32 && !ok; a++) { const ang = a * 0.19635 + v * 1.0472 + 0.3, gx = Math.round(hubX(t) + Math.cos(ang) * r) - (S >> 1), gy = Math.round(t.y + Math.sin(ang) * r) - (S >> 1);
          if (t.kind === 'city' && Math.hypot(gx - t.x, gy - t.y) > t.radius - 8) continue;
          if (!fits(gx, gy, pass === 1)) continue;
          const cx = gx + S / 2, cy = gy + S / 2, ry = Math.atan2(hubX(t) - cx, t.y - cy);
          { let door = true; for (const k of [1, 2]) { const fx = Math.floor(cx + Math.sin(ry) * (S / 2 + k)), fy = Math.floor(cy + Math.cos(ry) * (S / 2 + k)); if (!inb(fx, fy) || !['grass', 'plaza', 'dirt', 'road'].includes(map[fy][fx] as string)) door = false; } if (!door) continue; } /* a frente aberta dá para chão, nunca para o rio */
          put(v, gx, gy, ry); ok = true; } } } }
  /* AS BIBLIOTECAS (25/10): a Grande Biblioteca de Askavik (imensa, perto de onde o cronista sempre esteve) e a de Lumenhal (simples, linda).
     Casas comuns cedem o lugar (nunca templo, castelo, escola ou loja com nome); árvore e pedra solta saem. O chão de dentro vira praça. */
  const libs: { gx: number; gy: number; w: number; h: number; v: number; name: string }[] = [];
  { const SOFT = new Set<string>([...SOFT_KINDS, 'mailbox']);
    const want: [string, number, string, number, number, number][] = [['Askavik', 0, 'Grande Biblioteca de Askavik', -22, 22, 10], ['Lumenhal', 1, 'Biblioteca de Lumenhal', 0, 4, 2], ['Lumenhal', 2, 'Prefeitura de Lumenhal', 2, -14, 4]]; /* 06/11: a Prefeitura (salão do Prefeito e do Livro de Guildas) */
    for (const [vila, v, name, ox, oy, maxH] of want) { const t = settlements.find((q) => q.name === vila); if (!t) continue; const W = LIB_FOOT[v].w, H = LIB_FOOT[v].h;
      const busyB = new Set<number>(); for (const p of props) { if (SOFT.has(p.kind as string)) continue; for (let y = p.gy - 1; y <= p.gy + p.h; y++) for (let x = p.gx - 1; x <= p.gx + p.w; x++) busyB.add(y * 100000 + x); }
      const okT = (x: number, y: number) => inb(x, y) && !busyB.has(y * 100000 + x) && (['grass', 'plaza', 'road', 'tree'] as Tile[]).includes(map[y][x]);
      search: for (let r = 0; r <= 60; r++) for (let a = 0; a < Math.max(1, r * 6); a++) { const gx = Math.round(t.x + ox + Math.cos(a / Math.max(1, r * 6) * 6.283) * r) - (W >> 1), gy = Math.round(t.y + oy + Math.sin(a / Math.max(1, r * 6) * 6.283) * r) - (H >> 1);
        if (t.kind === 'city' && Math.hypot(gx + W / 2 - t.x, gy + H / 2 - t.y) > t.radius - 12) continue;
        const over = props.filter((p) => p.kind === 'house' && !p.shop && (p.variant ?? 0) < 4 && p.gx + p.w > gx - 1 && p.gx < gx + W + 1 && p.gy + p.h > gy - 1 && p.gy < gy + H + 1);
        if (over.length > maxH) continue;
        for (const p of over) for (let y = p.gy - 1; y <= p.gy + p.h; y++) for (let x = p.gx - 1; x <= p.gx + p.w; x++) busyB.delete(y * 100000 + x);
        const underH = (x: number, y: number) => over.some((p) => x >= p.gx && x < p.gx + p.w && y >= p.gy && y < p.gy + p.h); /* o chão da casa que cede vira praça */
        let ok = true; for (let y = gy; y < gy + H && ok; y++) for (let x = gx; x < gx + W && ok; x++) if (!okT(x, y) && !(underH(x, y) && !busyB.has(y * 100000 + x))) ok = false;
        if (!ok) { for (const p of over) for (let y = p.gy - 1; y <= p.gy + p.h; y++) for (let x = p.gx - 1; x <= p.gx + p.w; x++) busyB.add(y * 100000 + x); continue; }
        for (const p of over) { const i = props.indexOf(p); if (i >= 0) props.splice(i, 1); }
        for (let i = props.length - 1; i >= 0; i--) { const p = props[i]; if (SOFT.has(p.kind as string) && p.gx + p.w > gx - 1 && p.gx < gx + W + 1 && p.gy + p.h > gy - 1 && p.gy < gy + H + 1) props.splice(i, 1); }
        for (let y = gy; y < gy + H; y++) for (let x = gx; x < gx + W; x++) map[y][x] = 'plaza';
        props.push({ kind: 'library', gx, gy, w: W, h: H, height: v === 2 ? 16 : v ? 9 : 22, wall: 0xd8d0c0, roof: 0x5a9a86, variant: v, ry: 0, label: name });
        libs.push({ gx, gy, w: W, h: H, v, name }); pois.push({ name: v === 2 ? 'Prefeitura' : v ? name : 'Grande Biblioteca', x: gx + W / 2, y: gy + H + 1, biome: 'meadow' });
        break search; } } }
  const libAt = (v: number) => libs.find((q) => q.v === v);
  /* URBANISMO (27/10, Erling: "não podemos ter casas e construções perto de monumentos; cada monumento tem que ter seu espaço reservado,
     sua praça cercada e mais distanciamento"). Regra real de urbanismo: RECUO obrigatório (setback) e ADRO — a praça cívica em volta do
     edifício monumental, murada e com entradas. Todo edifício grande da cidade (biblioteca, catedral, academia, templo grande, estação)
     ganha um recuo de 3 a 5 tiles (diferente em cada lado, cantos chanfrados: nada de quadrado) sem casa, barraca ou tenda; o adro é
     calçado com borda irregular e cercado por um muro baixo com vãos no meio de cada lado e onde passa rua. Maravilhas e marcos no
     ermo (monumento, landmark) só ganham o recuo: nada de calçada nem muro no meio da mata (regra 19: clareiras nunca são quadradas). */
  { const URB = new Set<string>(['library', 'church', 'temple', 'station', 'castle']), WILD_L = new Set<string>(['monument', 'landmark']), GONE = new Set<string>(['house', 'stall', 'tent', 'tree', 'herb', 'rock', 'bones', 'grave', 'campfire', 'deadtree', 'lowwall']);
    const ru = rng(2710);
    const big = props.filter((p) => (URB.has(p.kind) || WILD_L.has(p.kind)) && p.w * p.h >= 40);
    for (const m of big) { const wild = WILD_L.has(m.kind); const sb = wild ? [4, 4, 4, 4] : [3, 4, 5, 3].map((v) => v + Math.floor(ru() * 2)); // recuo norte, leste, sul, oeste
      const x0 = m.gx - sb[3], y0 = m.gy - sb[0], x1 = m.gx + m.w + sb[1], y1 = m.gy + m.h + sb[2], ch = wild ? 0 : 2 + Math.floor(ru() * 2); // chanfro dos cantos
      const inAdro = (x: number, y: number) => x >= x0 && x < x1 && y >= y0 && y < y1 && (Math.min(x - x0, x1 - 1 - x) + Math.min(y - y0, y1 - 1 - y) >= ch);
      for (let i = props.length - 1; i >= 0; i--) { const p = props[i]; if (p === m || !GONE.has(p.kind)) continue; if (p.kind === 'house' && p.shop) continue; /* 08/11: loja com placa não sai do lugar por adro de prédio grande */ if (wild && (p.kind === 'tree' || p.kind === 'rock' || p.kind === 'herb' || p.kind === 'bones' || p.kind === 'grave' || p.kind === 'deadtree' || p.kind === 'lowwall')) continue;
        let hit = false; for (let y = p.gy - 1; y <= p.gy + p.h && !hit; y++) for (let x = p.gx - 1; x <= p.gx + p.w && !hit; x++) if (inAdro(x, y)) hit = true; if (!hit) continue;
        props.splice(i, 1); for (let y = p.gy; y < p.gy + p.h; y++) for (let x = p.gx; x < p.gx + p.w; x++) if (inb(x, y) && map[y][x] === 'wall' && !big.some((q) => x >= q.gx && x < q.gx + q.w && y >= q.gy && y < q.gy + q.h)) map[y][x] = wild ? 'grass' : 'plaza'; }
      if (wild) continue;
      const under = (x: number, y: number) => props.some((q) => x >= q.gx && x < q.gx + q.w && y >= q.gy && y < q.gy + q.h);
      for (let y = y0 - 2; y < y1 + 2; y++) for (let x = x0 - 2; x < x1 + 2; x++) { if (!inb(x, y)) continue; const t = map[y][x]; const inside = inAdro(x, y), fringe = !inside && ru() < 0.35; /* borda esfarrapada: a calçada avança um pouco na terra, sem linha reta */
        if ((inside || fringe) && (t === 'grass' || t === 'tree' || (t === 'wall' && !under(x, y)))) map[y][x] = 'plaza'; } /* 'wall' órfão = casa que a biblioteca engoliu sem limpar o chão */
      /* o muro do adro: segmentos de ~2,5 tiles pelo contorno chanfrado, vão de 3 tiles no meio de cada lado e onde há rua */
      const seg = (ax: number, ay: number, bx: number, by: number) => { const mx = (ax + bx) / 2, my = (ay + by) / 2, gx = Math.floor(mx), gy = Math.floor(my); if (!inb(gx, gy)) return; const L = Math.hypot(bx - ax, by - ay);
        for (let t = 0; t <= 1; t += 0.25) { const qx = Math.floor(ax + (bx - ax) * t), qy = Math.floor(ay + (by - ay) * t); const tt = map[qy]?.[qx]; if (tt !== 'plaza') return; }
        props.push({ kind: 'lowwall', gx, gy, w: 1, h: 1, height: 0.9, wall: 0, roof: 0, variant: 10, ry: Math.atan2(-(by - ay), bx - ax), ox: (mx - gx) * T, oz: (my - gy) * T, len: L * T + 0.1, broken: 0, adro: true }); };
      const side = (ax: number, ay: number, bx: number, by: number, gap: boolean) => { const L = Math.hypot(bx - ax, by - ay), n = Math.max(1, Math.round(L / 2.5)), g0 = Math.floor(n / 2); for (let i = 0; i < n; i++) { if (gap && (i === g0 || (n >= 6 && i === g0 - 1))) continue; const t0 = i / n, t1 = (i + 1) / n; seg(ax + (bx - ax) * t0, ay + (by - ay) * t0, ax + (bx - ax) * t1, ay + (by - ay) * t1); } };
      const ox = x0 + 0.3, oy = y0 + 0.3, ex = x1 - 0.3, ey = y1 - 0.3, c = ch; // polígono chanfrado: 8 lados
      const P: [number, number][] = [[ox + c, oy], [ex - c, oy], [ex, oy + c], [ex, ey - c], [ex - c, ey], [ox + c, ey], [ox, ey - c], [ox, oy + c]];
      for (let i = 0; i < 8; i++) { const [ax, ay] = P[i], [bx, by] = P[(i + 1) % 8]; side(ax, ay, bx, by, i % 2 === 0); } } }
  { /* cada um em chão livre de verdade (nada de gente em cima de telhado): procura em espiral o primeiro tile andável fora de qualquer construção */
    const occ = new Set<number>(); for (const p of props) for (let y = p.gy - 1; y <= p.gy + p.h; y++) for (let x = p.gx - 1; x <= p.gx + p.w; x++) occ.add(y * 100000 + x);
    const freeAt = (x0: number, y0: number) => { for (let r = 0; r < 14; r++) for (let a = 0; a < Math.max(1, r * 8); a++) { const x = Math.round(x0 + Math.cos((a / Math.max(1, r * 8)) * 6.283) * r), y = Math.round(y0 + Math.sin((a / Math.max(1, r * 8)) * 6.283) * r);
      if (inb(x, y) && !occ.has(y * 100000 + x) && (['grass', 'plaza', 'road'] as Tile[]).includes(map[y][x])) return { x: x + 0.5, y: y + 0.5 }; } return { x: x0, y: y0 }; };
    for (const c of CAMPAIGN_NPCS) { const po = settlements.find((q) => q.name === c.vila) ? null : pois.find((q) => q.name === c.vila); const t = settlements.find((q) => q.name === c.vila) ?? (po ? settlements.slice().sort((a2, b2) => Math.hypot(a2.x - po.x, a2.y - po.y) - Math.hypot(b2.x - po.x, b2.y - po.y))[0] : undefined); if (!t) continue; const base = po ?? t; /* quem mora num lugar (a igreja), não numa vila */ const L0 = c.name.includes('Ormund') ? libAt(0) : undefined, LP = c.name === 'Prefeito Corvin Aldmar' ? libAt(2) : undefined; const at = L0 ? { x: L0.gx + L0.w / 2, y: L0.gy + L0.h / 2 + 1.5 } /* o cronista dentro da Grande Biblioteca, no balcão diante da rotunda */ : LP ? { x: LP.gx + LP.w / 2 + PREF_MAYOR[0] / 2, y: LP.gy + LP.h / 2 + PREF_MAYOR[1] / 2 } /* 06/11: o Prefeito no salão de atendimento, diante da mesa */ : freeAt(base.x + c.dx, base.y + c.dy); occ.add(Math.floor(at.y) * 100000 + Math.floor(at.x)); t.npcs.push({ name: c.name, role: c.role, kind: c.kind ?? 'nordic', x: at.x, y: at.y, radius: c.kind === 'dwarf' ? 1.5 : po ? 0.4 : 1.2, tint: c.tint, scale: 1.0, lines: c.lines, onlyQ: c.onlyQ }); }
    /* as casas das necessidades de classe (25/10): Adega do Conde, Sangria dos anões, incensos dos magos e da bruxa, orvalho élfico — em chão livre */
    for (const [vila, dx, dy, n] of ([
      ['Uivo Antigo', 3, 2.5, { name: 'Curtidora Rhagna', role: 'Toca das Curtidoras de Selvar', kind: 'nordic', radius: 1.2, tint: 0x5a4030, scale: 1.05, shop: 'toca_selvar', lines: ['Terra de toca e gordura de fera. O mago esqueceu que tem pés.', 'Um mago aqui, de manto limpo? A matilha vai rir a semana inteira.', 'Unguento bom cheira mal. Esse cheira muito mal.'] }],
      ['Austrvik', 3, 2.5, { name: 'Irmã Odila', role: 'Capela da Abadia da Aurora', kind: 'nordic', radius: 1.2, tint: 0xe8d080, scale: 1.0, shop: 'abadia_aurora', lines: ['Cada frasco é benzido por um paladino em jejum.', 'Os magos vêm, compram e saem sem rezar. Auréon perdoa.', 'A água não cura o orgulho. Só ajuda.'] }],
      ['Sudrholt', 3, 2.5, { name: 'Caçador Viktor Helsing', role: 'Arsenal do Bastião de Prata', kind: 'nordic', radius: 1.2, tint: 0xb8bcc8, scale: 1.0, shop: 'bastiao_prata', lines: ['Coração de demônio apodrece em uma hora. Menos o nosso.', 'Vendo para bruxo, sim. Prefiro saber onde ele está.', 'Não durmo há três dias. Quer comprar ou só olhar?'] }],
      ['Jarlsheim', 3, 2.5, { name: 'Skald Hrolf', role: 'Salão do Hidromel de Jarlsheim', kind: 'nordic', radius: 1.2, tint: 0x8a5a30, scale: 1.05, shop: 'salao_hidromel', lines: ['O chifre se enche no campo, nunca na taverna.', 'Bruxo comprando sangue de guerreiro... o mundo está torto.', 'Beba, mas não deste. Este é de Odin.'] }],
      ['Corvoscuro', -3.5, 2.5, { name: 'Sommelier Vasko', role: 'Adega do Conde', kind: 'nordic', radius: 1.2, tint: 0x3a0a14, scale: 1.0, shop: 'adega_conde', lines: ['Um lobo na minha adega. Que dia raro.', 'Curada desde antes da Ruptura. Não pergunte de quem.', 'Pague e coma lá fora, por favor. O cheiro de cachorro molhado gruda nas cortinas.'] }],
      ['Brasaforja', 0, 4.5, { name: 'Sangradora Hulda', role: 'Casa de Sangria dos Anões', kind: 'dwarf', radius: 1.2, tint: 0x7a1a24, scale: 0.95, shop: 'sangria_anao', lines: ['Sangue doado, pago e apurado no frio. Ninguém morre aqui.', 'Os tecnocratas levam quase tudo para as tais injeções.', 'Vampiro do bem? Já vi de tudo nesta montanha.'] }],
      ['Lumenhal', 3.0, 2.5, { name: 'Arquimaga Seline', role: 'Sala dos Incensos do Pináculo', kind: 'nordic', radius: 1.2, tint: 0x3a4a9a, scale: 1.0, shop: 'magos_lumen', lines: ['A areia guardou a luz das estrelas. Não espirre perto dela.', 'Os guerreiros do Norte vêm aqui quando o sangue não esfria mais.', 'Cinzas? Compro da bruxa. Não gosto, mas compro.'] }],
      ['Gorvath', 3.0, 2.5, { name: 'Bruxa Grisolda', role: 'Tenda da Bruxa de Gorvath', kind: 'nordic', radius: 1.2, tint: 0x3a2a3a, scale: 0.95, night: false, shop: 'bruxa_gorvath', lines: ['Cada pitada de cinza tem um nome. Eu sei todos.', 'O guerreiro louco não sabe que precisa de mim até começar a ouvir os mortos.', 'A areia dos magos brilha demais. Mas sem ela o incenso não fecha.'] }],
      /* 26/10: estábulos e domadores de cada cidade (montarias e pets do lugar) */
      ['Brasaforja', -4, 3, { name: 'Domadora Brunna Cascalho', role: 'Baias de Brasaforja', kind: 'dwarf', radius: 1.2, tint: 0x6a3a1a, scale: 0.95, shop: 'baias_brasa', lines: ['Pônei não é cavalo pequeno. É cavalo teimoso.', 'O javali de guerra só obedece quem dá a primeira maçã.', 'Montanha boa se sobe devagar. Ou de javali.'] }],
      ['Lithendel', -3, 2.5, { name: 'Guardiã Elaria', role: 'Clareira dos Cervos de Lithendel', kind: 'nordic', civil: 'elf', radius: 1.2, tint: 0x3a6a4a, scale: 1.0, shop: 'baias_lithen', lines: ['Não vendemos o cervo. Ele escolhe. Nós só cobramos a sela.', 'Fale baixo perto dele.', 'A raposa prateada vai sumir com seus anéis. É o charme dela.'] }],
      ['Askavik', -6, 30, { name: 'Estribeiro Aldric', role: 'Estrebaria Real de Askavik', kind: 'nordic', radius: 1.2, tint: 0x2a3a7a, scale: 1.05, shop: 'estrebaria_real', lines: ['Os cavalos do rei comem melhor que muito cavaleiro.', 'O corcel templário não recua. Nem quando deveria.', 'Crina de ouro não é tinta. Pergunte ao palafrém.'] }],
      ['Jarlsheim', -3.5, 2.5, { name: 'Domador Sigvald', role: 'Baias de Jarlsheim', kind: 'nordic', radius: 1.2, tint: 0x3a4a6a, scale: 1.1, shop: 'baias_jarl', lines: ['O alce entende runas. Eu não.', 'O lobo das neves morde. Por isso é bom.', 'No gelo, o cavalo escorrega. O alce não.'] }],
      ['Porto Caldeira', 12, -5.5, { name: 'Mecânica Odette', role: 'Garagem da Companhia de Latão', kind: 'technocrat', radius: 1.2, tint: 0x5a1e14, scale: 1.0, shop: 'baias_latao', lines: ['Não come, não cansa. Mas pede óleo como quem pede amor.', 'A aranha de latão foi um acidente. Um acidente lindo.', 'Se chiar na subida, é saudade da fábrica.'] }],
      ['Lumenhal', -3, 2.5, { name: 'Jardineira Ysmé', role: 'Jardim do Pináculo', kind: 'nordic', civil: 'elf', radius: 1.2, tint: 0x6a4aaa, scale: 1.0, shop: 'baias_lumen', lines: ['O unicórnio vê o que você fez com os bichos. Todos.', 'A fadinha ficou porque gostou do jardim. Talvez goste de você.', 'O chifre brilha perto de magia. E perto de mentira.'] }],
      ['Corvoscuro', 3.5, 3, { name: 'Cocheiro Mortimer', role: 'Cocheira do Conde', kind: 'nordic', civil: 'human', radius: 1.2, tint: 0x4a0a14, scale: 1.0, shop: 'baias_conde', lines: ['O Pesadelo não pisa em terra santa. Nem eu.', 'A crina queima sem consumir. Não toque. Ou toque, e aprenda.', 'Os cavalos normais fogem dele. Os inteligentes também.'] }],
      ['Uivo Antigo', -3, 2.5, { name: 'Domadora Kaia Garra-Lua', role: 'Covil dos Domadores do Uivo', kind: 'nordic', radius: 1.2, tint: 0x3a2a1a, scale: 1.05, shop: 'baias_uivo', lines: ['O lobo da lua corre mais de noite. Como nós.', 'O tigre ronrona como trovão. Não confunda com fome.', 'A pantera filhote escolhe o dono pelo cheiro de coragem.'] }],
      ['Lithendel', 3.0, 2.5, { name: 'Irmã Ithilwen', role: 'O Orvalho de Lithendel', kind: 'nordic', radius: 1.2, tint: 0x5a8a6a, scale: 1.0, shop: 'orvalho_elfo', lines: ['Uma gota por árvore, por manhã. Nem uma a mais.', 'Os anões pagam bem. Os paladinos agradecem depois, sem saber a quem.', 'Lágrima Santa não se vende a quem chora por raiva.'] }],
    ] as [string, number, number, Omit<NpcSpec, 'x' | 'y'>][])) { const t = settlements.find((q) => q.name === vila); if (!t) continue; const at = freeAt(t.x + dx, t.y + dy); occ.add(Math.floor(at.y) * 100000 + Math.floor(at.x)); t.npcs.push({ ...n, x: at.x, y: at.y } as NpcSpec); } }
  /* a Casa dos Ofícios: num lugar livre perto da Praça do Mercado de Askavik, um salão aberto de 14×10 com as cinco bancadas lá dentro */
  let craftHall: { x: number; y: number; w: number; h: number; ry: number } | undefined;
  { const ak = settlements.find((q) => q.name === 'Askavik'); if (ak) { const cx0 = hubX(ak), cy0 = ak.y;
      const SOFT = new Set<string>(SOFT_KINDS.filter((k) => k !== 'fogpatch')); /* árvore e pedra solta saem para o salão entrar */
      const busy = new Set<number>(); for (const p of props) { if (SOFT.has(p.kind as string)) continue; for (let y = p.gy - 1; y <= p.gy + p.h; y++) for (let x = p.gx - 1; x <= p.gx + p.w; x++) busy.add(y * 100000 + x); }
      const okT = (x: number, y: number) => inb(x, y) && !busy.has(y * 100000 + x) && (['grass', 'plaza', 'road', 'tree'] as Tile[]).includes(map[y][x]);
      search: for (const [W2, H2] of [[12, 8], [11, 7], [10, 7]]) for (let r = 4; r <= 60; r++) for (let a = 0; a < 48; a++) { const W = W2, H = H2, gx = Math.round(cx0 + Math.cos(a * 0.1309) * r) - (W >> 1), gy = Math.round(cy0 + Math.sin(a * 0.1309) * r) - (H >> 1); let ok = true;
        if (Math.hypot(gx + W / 2 - ak.x, gy + H / 2 - ak.y) > ak.radius - 9) continue; /* dentro das muralhas */
        /* dentro da cidade não sobra campo: até duas casas comuns cedem o lugar (nunca igreja, castelo, escola ou loja com nome) */
        const over = props.filter((p) => p.kind === 'house' && p.gx + p.w > gx && p.gx < gx + W && p.gy + p.h > gy && p.gy < gy + H);
        if (over.length > 2) continue;
        for (const p of over) for (let y = p.gy - 1; y <= p.gy + p.h; y++) for (let x = p.gx - 1; x <= p.gx + p.w; x++) busy.delete(y * 100000 + x);
        for (let y = gy; y < gy + H && ok; y++) for (let x = gx; x < gx + W && ok; x++) if (!okT(x, y)) ok = false;
        if (!ok) { for (const p of over) for (let y = p.gy - 1; y <= p.gy + p.h; y++) for (let x = p.gx - 1; x <= p.gx + p.w; x++) busy.add(y * 100000 + x); continue; } craftHall = { x: gx, y: gy, w: W, h: H, ry: 0 };
        for (const p of over) { const i = props.indexOf(p); if (i >= 0) props.splice(i, 1); }
        for (let i = props.length - 1; i >= 0; i--) { const p = props[i]; if (SOFT.has(p.kind as string) && p.gx + p.w > gx - 1 && p.gx < gx + W + 1 && p.gy + p.h > gy - 1 && p.gy < gy + H + 1) props.splice(i, 1); }
        for (let y = gy; y < gy + H; y++) for (let x = gx; x < gx + W; x++) map[y][x] = 'plaza'; /* (tile 'tree' também vira piso) */
        /* as cinco bancadas de verdade (as mesmas das vilas: funcionam para craft), em fileira, de frente para o corredor */
        for (let v = 0; v < 5; v++) { const sx = gx + 0.5 + v * 2.3, sy = v % 2 ? gy + 5 : gy + 1; props.push({ kind: 'station', gx: Math.round(sx), gy: sy, w: 2, h: 2, height: 2.6, wall: 0x6a4a2a, roof: 0x6a4a2a, variant: v, ry: v % 2 ? Math.PI : 0 }); }
        pois.push({ name: 'Casa dos Ofícios', x: gx + W / 2, y: gy + H + 1, biome: 'meadow' });
        break search; } } }
  /* ELITES E CHEFES DO MUNDO: cada lugar marcado tem o seu dono, no nível do lugar */
  { const at = (nm: string, dx = 0, dy = 0) => { const q = pois.find((v) => v.name === nm) ?? settlements.find((v) => v.name === nm); return q ? { x: Math.round(q.x + dx), y: Math.round(q.y + dy) } : null; };
    const put = (type: EnemyType, nm: string, dx: number, dy: number, night = false) => { const c = at(nm, dx, dy); if (c) { const rg = regionAt_L(c.x, c.y); spawns.push({ type, x: c.x, y: c.y, r: 1, n: 1, lvl: rg.hi, keep: true, ...(night ? { night: true } : {}) }); } };
    put('alpha', 'Covil dos Lobos', 3, 3); put('necro', 'Cemitério Esquecido', -4, 6, true); put('skel_arch', 'Cemitério Esquecido', 4, 4); put('headless', 'Catedral Abandonada', -12, 18, true);
    put('cavebear', 'Hrimgard', 14, 12); put('troll', 'Bjarnholt', -12, 9); put('jotun', 'Fortaleza de Odin', 20, 16); put('harpy', 'Hvítadalr', 11, -10);
    put('fairyqueen', 'Lumenhal', 20, -16); put('ent', 'Pináculo de Marfim', -16, -14); put('giantsnake', 'Árvore-Mãe do Uivo', 10, 8); put('scorpion_king', 'Ferrugem', 16, 14);
    put('colossus', 'Ferrugem', -18, -10); put('glutton', 'Castelo da Colina Vampírica', -10, 14); put('suplicio', 'Vale da Desgraça', 0, 10); put('drowner_old', 'Vatnaholt', -9, 7); put('inquisitor', 'Steinfoss', 6, -6); put('inquisitor', 'Grenivik', -5, 6); }
  { /* elites longe das vilas: nenhum elite nasce a menos de 30 blocos de um povoado (45 dos berços), a não ser os de lugar marcado (nível fixo) */
    const CRADLE = new Set(['Karmika', 'Brasaforja', 'Lithendel']), ELT = new Set<EnemyType>(['prince', 'tormentor', 'treant', 'werewolf']);
    for (let i = spawns.length - 1; i >= 0; i--) { const sp = spawns[i]; if (!ELT.has(sp.type) || sp.fixLvl || sp.keep) continue; /* 26/10: o dono do lugar marcado (o Torturador na Clareira dos Gritos) nunca some — antes ele era apagado por estar perto de Karmika e a missão ficava impossível */
      if (settlements.some((t) => Math.hypot(t.x - sp.x, t.y - sp.y) < (CRADLE.has(t.name) ? 45 : 30))) spawns.splice(i, 1); } }
  const stOf = (nm: string) => { const st = settlements.find((q) => q.name === nm)!; return { x: st.x + 0.5, y: st.y + 3.5, name: nm }; };
  rampartsRef = ramparts;
  { /* LIMPEZA DO MAPA (25/10): tochas nunca dentro de prédio, na água, coladas umas nas outras ou em fila torta;
       bancos e enfeites pequenos nunca em cima de construção */
    const SMALL = new Set(['torch', 'bench', 'barrel', 'crate', 'sign', 'herb', 'bones', 'corpse', 'grave', 'fogpatch', 'tar']);
    const BIG = new Set(['library', 'house', 'temple', 'church', 'tower', 'stall', 'station', 'shopfront', 'gatehouse', 'monument', 'landmark', 'fountain', 'vault', 'tent', 'relic', 'obelisk', 'wstair', 'vgate', 'ggate', 'palisade', 'lowwall']);
    const occ = new Set<number>(); for (const p of props) if (BIG.has(p.kind)) for (let y = p.gy; y < p.gy + (p.h || 1); y++) for (let x = p.gx; x < p.gx + (p.w || 1); x++) occ.add(y * 100000 + x);
    const torches: { gx: number; gy: number }[] = [], smallAt = new Set<number>(); let cut = 0;
    const keep = props.filter((p) => { if (!SMALL.has(p.kind)) return true; const k = p.gy * 100000 + p.gx;
      if (occ.has(k) || map[p.gy]?.[p.gx] === 'water' || map[p.gy]?.[p.gx] === 'wall') { cut++; return false; }
      if (p.kind === 'torch') { if (torches.some((t) => Math.hypot(t.gx - p.gx, t.gy - p.gy) < 3.6)) { cut++; return false; } torches.push(p); }
      else if (smallAt.has(k)) { cut++; return false; }
      smallAt.add(k); return true; });
    if (cut) { props.length = 0; props.push(...keep); } }
  /* ESTRADA É ESTRADA ATÉ O FIM (26/10, Erling: "carroça de anão e de vapor só andam na estrada; quem garante a segurança no meio do mato?").
     Depois de tudo plantado (vilas, matas, marcos), refaz o leito de cada estrada: o que virou grama ou árvore volta a ser estrada, a árvore
     e a pedra em cima saem, e onde a estrada passa sobre água sem ponte, ponte. As caravanas andam exatamente sobre esse leito. */
  { const on = new Set<number>(); for (const rp of roadPaths) for (let i = 0; i < rp.length; i++) { const a = rp[i], b = rp[Math.min(rp.length - 1, i + 1)];
      for (let k = 0; k <= 4; k++) { const x = a.x + (b.x - a.x) * k / 4, y = a.y + (b.y - a.y) * k / 4; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const tx = Math.floor(x) + dx, ty = Math.floor(y) + dy; if (inb(tx, ty) && Math.hypot(tx + 0.5 - x, ty + 0.5 - y) <= 1.05) on.add(ty * 100000 + tx); } } }
    const LOOSE = new Set<string>(['tree', 'rock', 'herb', 'bush', 'flower', 'stump', 'bones', 'deadtree', 'fogpatch', 'grass']); /* o que a estrada atropela (sem banco/tocha: esses ficam à beira) */
    for (let i = props.length - 1; i >= 0; i--) { const p = props[i]; if (LOOSE.has(p.kind as string) && on.has(p.gy * 100000 + p.gx)) props.splice(i, 1); }
    for (const k of on) { const x = k % 100000, y = Math.floor(k / 100000), t = map[y][x] as string; if (t === 'grass' || t === 'tree') map[y][x] = 'road'; }
    /* cerca/muro baixo cujo segmento cruza o leito (trilhas e estradas tardias passavam por dentro da cerca da vila sem portão) sai;
       estaca de paliçada e tenda cujo tile virou estrada também (a estrada era pintada por cima e a estaca ficava sem colisão) */
    const onRoad = (x: number, y: number) => on.has(Math.floor(y) * 100000 + Math.floor(x)) || map[Math.floor(y)]?.[Math.floor(x)] === 'road';
    for (let i = props.length - 1; i >= 0; i--) { const p = props[i];
      if (p.kind === 'lowwall') { const cx = p.gx + (p.ox ?? T) / T, cy = p.gy + (p.oz ?? T) / T, L = (p.len ?? 2.95) / T, ry = p.ry ?? 0, ux = Math.cos(ry), uy = -Math.sin(ry); let cross = false;
        for (let k = -2; k <= 2 && !cross; k++) if (onRoad(cx + ux * L * k / 4, cy + uy * L * k / 4)) cross = true; if (cross) props.splice(i, 1); }
      else if ((p.kind === 'palisade' || p.kind === 'tent') && map[p.gy]?.[p.gx] === 'road') props.splice(i, 1); }
    for (const rp of roadPaths) { let i = 0; while (i < rp.length) { const wet = (q: { x: number; y: number }) => map[Math.floor(q.y)]?.[Math.floor(q.x)] === 'water'; if (!wet(rp[i])) { i++; continue; } let j = i; while (j + 1 < rp.length && wet(rp[j + 1])) j++;
        const a = rp[Math.max(0, i - 2)], b = rp[Math.min(rp.length - 1, j + 2)], mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        if (!bridges.some((e) => { const L = Math.hypot(e.bx - e.ax, e.by - e.ay) || 1, t2 = Math.max(0, Math.min(1, ((mx - e.ax) * (e.bx - e.ax) + (my - e.ay) * (e.by - e.ay)) / (L * L))); return Math.hypot(e.ax + (e.bx - e.ax) * t2 - mx, e.ay + (e.by - e.ay) * t2 - my) < 3; })) {
          const nb: Bridge = { ax: a.x, ay: a.y, bx: b.x, by: b.y, hA: 0, hB: 0 }; const save = bridgesRef; bridgesRef = []; nb.hA = groundH_L(a.x * T, a.y * T); nb.hB = groundH_L(b.x * T, b.y * T); bridgesRef = save; bridges.push(nb); }
        i = j + 1; } } }
  /* CASA É CASA (28/10, Erling: "estou entrando na casa porque não tem parede do lado que não dá para ver"). Passes posteriores
     (o leito das estradas, adros) abriam chão andável dentro de 18 casas. Casa nunca fica em cima de estrada: a casa que caiu
     sobre o leito anda para o terreno livre mais perto (até 6 tiles); se não houver, sai — a estrada fica aberta. O resto da
     pegada volta a ser parede. */
  { const SOFT = new Set<string>(['tree', 'rock', 'herb', 'bush', 'flower', 'stump', 'bones', 'deadtree', 'fogpatch', 'grass', 'torch']);
    const hard = props.filter((q) => !SOFT.has(q.kind as string));
    const fp = (q: Prop, f: (x: number, y: number) => boolean) => { for (let y = q.gy; y < q.gy + q.h; y++) for (let x = q.gx; x < q.gx + q.w; x++) if (!f(x, y)) return false; return true; };
    const overlap = (q: Prop, gx: number, gy: number) => hard.some((o) => o !== q && o.gx < gx + q.w + 1 && o.gx + o.w + 1 > gx && o.gy < gy + q.h + 1 && o.gy + o.h + 1 > gy);
    let moved = 0, gone = 0;
    for (let i = props.length - 1; i >= 0; i--) { const q = props[i]; if (q.kind !== 'house') continue;
      const onRoad = !fp(q, (x, y) => (map[y]?.[x] as string) !== 'road'); if (onRoad && q.shop && q.style === 2) { fp(q, (x, y) => { map[y][x] = 'wall' as never; return true; }); continue; } /* 08/11: em Brasaforja (praça de laje inteira) a loja com placa vence a estrada que a cortou — quem anda contorna pela laje */ if (!onRoad) { fp(q, (x, y) => { if (map[y]?.[x] === 'grass') map[y][x] = 'wall' as never; return true; }); continue; }
      let best: [number, number] | null = null;
      for (let r = 1; r <= 6 && !best; r++) for (let dy = -r; dy <= r && !best; dy++) for (let dx = -r; dx <= r && !best; dx++) { if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue; const gx = q.gx + dx, gy = q.gy + dy;
        let ok = true; for (let y = gy - 1; y <= gy + q.h && ok; y++) for (let x = gx - 1; x <= gx + q.w && ok; x++) { const t = map[y]?.[x] as string; const inside = x >= gx && x < gx + q.w && y >= gy && y < gy + q.h;
          if (inside ? !(t === 'grass' || (t === 'wall' && x >= q.gx && x < q.gx + q.w && y >= q.gy && y < q.gy + q.h)) : t === 'water') ok = false; }
        if (ok && !overlap(q, gx, gy)) best = [gx, gy]; }
      fp(q, (x, y) => { if (map[y]?.[x] === 'wall') map[y][x] = 'grass'; return true; });
      if (best) { q.gx = best[0]; q.gy = best[1]; fp(q, (x, y) => { map[y][x] = 'wall' as never; return true; }); moved++;
        for (let k = props.length - 1; k >= 0; k--) { const o = props[k]; if (SOFT.has(o.kind as string) && o.gx >= q.gx && o.gx < q.gx + q.w && o.gy >= q.gy && o.gy < q.gy + q.h) { props.splice(k, 1); if (k < i) i--; } } }
      else { props.splice(i, 1); gone++; } }
    if (moved || gone) console.info(`[mundo] casas sobre a estrada: ${moved} mudaram de lugar, ${gone} saíram`); }
  /* 03/11 (Erling: "alinhe essas lojas deixando-as um pouco mais longe da pedra de teleporte"): barraca colada numa pedra rúnica (menos de
     4 casas) ou em cima de uma casa sai dali — vai para o lugar livre mais perto, de preferência na mesma linha de outra barraca vizinha */
  { const LOW = new Set(['tree', 'plant', 'rock', 'grass', 'flowers', 'herb', 'bush', 'bones', 'deadtree']);
    const occ = new Set<number>(); const mark = (q: Prop, v: boolean) => { for (let y = q.gy; y < q.gy + q.h; y++) for (let x = q.gx; x < q.gx + q.w; x++) { if (v) occ.add(y * 4096 + x); else occ.delete(y * 4096 + x); } };
    for (const q of props) if (!LOW.has(q.kind)) mark(q, true);
    const nearRelic = (x: number, y: number, w: number, h: number) => relics.some((r) => Math.hypot(r.x - (x + w / 2 - 0.5), r.y - (y + h / 2 - 0.5)) < 4.2);
    const okAt = (x: number, y: number, w: number, h: number) => { for (let yy = y - 1; yy <= y + h; yy++) for (let xx = x - 1; xx <= x + w; xx++) { if (!inb(xx, yy)) return false; const t = map[yy][xx]; const inside = xx >= x && xx < x + w && yy >= y && yy < y + h; if (inside && !(t === 'grass' || t === 'plaza')) return false; if (t === 'wall' || t === 'water') return false; if (occ.has(yy * 4096 + xx)) return false; } return !nearRelic(x, y, w, h); };
    const onHouse = (q: Prop) => { for (let y = q.gy; y < q.gy + q.h; y++) for (let x = q.gx; x < q.gx + q.w; x++) if (inb(x, y) && map[y][x] === 'wall') return true; return props.some((o) => o !== q && o.kind === 'house' && q.gx < o.gx + o.w && q.gx + q.w > o.gx && q.gy < o.gy + o.h && q.gy + q.h > o.gy); };
    for (const q of props) { if (q.kind !== 'stall') continue; if (!nearRelic(q.gx, q.gy, q.w, q.h) && !onHouse(q)) continue;
      mark(q, false); const mates = props.filter((o) => o !== q && o.kind === 'stall' && Math.hypot(o.gx - q.gx, o.gy - q.gy) < 14);
      let best: [number, number] | null = null, bs = 1e9;
      for (let r = 1; r <= 10; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue; const x = q.gx + dx, y = q.gy + dy; if (!okAt(x, y, q.w, q.h)) continue;
        const align = mates.some((o) => o.gy === y || o.gx === x) ? -3 : 0; const sc = Math.hypot(dx, dy) + align; if (sc < bs) { bs = sc; best = [x, y]; } }
      if (best) { q.gx = best[0]; q.gy = best[1]; } mark(q, true); }
    /* 03/11 (Erling: "mude a posição dele segundo a imagem"): o poço da praça de Karmika sai de perto da pedra e vai para o gramado entre as
       duas ruas, ao norte (o lugar livre mais perto de lá) */
    { const kr = relics.find((r) => r.name === 'Relíquia: Vale de Karmika'); const well = kr && props.find((q) => q.kind === 'vprop' && q.variant === 2 && Math.hypot(q.gx - kr.x, q.gy - kr.y) < 4);
      if (kr && well) { mark(well, false); const tx = kr.x - 3, ty = kr.y - 2; let best: [number, number] | null = null; for (let r = 0; r <= 4 && !best; r++) for (let dy = -r; dy <= r && !best; dy++) for (let dx = -r; dx <= r && !best; dx++) if (Math.max(Math.abs(dx), Math.abs(dy)) === r && okAt(tx + dx, ty + dy, 1, 1)) best = [tx + dx, ty + dy]; if (best) { well.gx = best[0]; well.gy = best[1]; } mark(well, true); } }
    /* 03/11 (Erling: "troque todas as tochas por essas lamparinas… e essa especificamente mude mais para o lado, para não ficar na linha da vendinha
       que está em cima"): o poste com lanterna da prancha 59 vira tocha (o mundo 3D troca toda tocha pelo poste com lampião aceso), e poste colado
       numa barraca (a 2 casas ou menos) vai para o lado, para o lugar livre mais perto — de preferência na mesma linha, longe das barracas */
    for (const q of props) if (q.kind === 'vprop' && q.variant === 4) { (q as { kind: string }).kind = 'torch'; q.variant = 0; }
    const stalls = props.filter((o) => o.kind === 'stall' || o.kind === 'noticeboard' || o.kind === 'mailbox');
    const nearStall = (x: number, y: number) => stalls.some((o) => x >= o.gx - 3 && x < o.gx + o.w + 3 && y >= o.gy - 3 && y < o.gy + o.h + 3);
    /* a câmera olha de +x+z: "para o lado direito da tela" é +gx/−gy — o poste sai para lá, para o gramado aberto (Erling desenhou a seta) */
    for (const q of props) { if (q.kind !== 'torch' || !nearStall(q.gx, q.gy)) continue; mark(q, false); let best: [number, number] | null = null, bs = 1e9;
      for (let dy = -6; dy <= 6; dy++) for (let dx = -6; dx <= 6; dx++) { const x = q.gx + dx, y = q.gy + dy; if ((!dx && !dy) || !okAt(x, y, 1, 1) || nearStall(x, y)) continue; const sc = Math.hypot(dx, dy) - (dx - dy) * 0.35; if (sc < bs) { bs = sc; best = [x, y]; } }
      if (best) { q.gx = best[0]; q.gy = best[1]; } mark(q, true); }
    /* 03/11 (Erling: "arrume o banco"): o poste com lampião é largo; banco colado nele (a 1 casa) dá um passo para longe, se houver lugar */
    for (const t of props) { if (t.kind !== 'torch') continue; for (const q of props) { if (q.kind !== 'bench' || Math.max(Math.abs(q.gx - t.gx), Math.abs(q.gy - t.gy)) > 1) continue;
      const sx = Math.sign(q.gx - t.gx), sy = Math.sign(q.gy - t.gy); mark(q, false); for (const [ax, ay] of [[sx, sy], [sx, 0], [0, sy]] as [number, number][]) { if (!ax && !ay) continue; if (okAt(q.gx + ax, q.gy + ay, 1, 1) || ['grass', 'plaza', 'road'].includes(String(map[q.gy + ay]?.[q.gx + ax])) && !occ.has((q.gy + ay) * 4096 + q.gx + ax)) { q.gx += ax; q.gy += ay; break; } } mark(q, true); } }
  }
  /* QUADRO DE AVISOS EM TODA CIDADE E VILA (04/11, Erling: "a placa mural de missões da cidade, e de todas as cidades, pode ficar no
     centro, num lugar que não atrapalhe as carroças — elas não deveriam atravessar a placa"): o quadro vai para a grama, na beira da praça
     ou da rua, o mais perto do centro que der, com folga de uma casa de tudo o que já está construído e virado para a rua. */
  { const occ = new Set<number>(); const key = (x: number, y: number) => y * 4096 + x;
    for (const q of props) for (let y = q.gy; y < q.gy + q.h; y++) for (let x = q.gx; x < q.gx + q.w; x++) occ.add(key(x, y));
    const street = (x: number, y: number) => inb(x, y) && (map[y][x] === 'road' || map[y][x] === 'plaza');
    const centers: { x: number; y: number; r: number }[] = [{ x: CITY_L.x, y: CITY_L.y, r: 16 }];
    for (const st of settlements) { const nh = props.filter((q) => q.kind === 'house' && Math.hypot(q.gx - st.x, q.gy - st.y) < st.radius + 4).length; if (nh < 3) continue; if (Math.hypot(st.x - CITY_L.x, st.y - CITY_L.y) < 20) continue; centers.push({ x: st.x, y: st.y, r: st.radius + 4 }); }
    for (const c of centers) { let best: { x: number; y: number; d: number; dir: number } | null = null;
      for (let y = Math.round(c.y - c.r); y <= c.y + c.r; y++) for (let x = Math.round(c.x - c.r); x <= c.x + c.r; x++) {
        if (!inb(x, y) || map[y][x] !== 'grass') continue; const d = Math.hypot(x - c.x, y - c.y); if (d > c.r || (best && d >= best.d)) continue;
        let free = true; for (let yy = y - 1; yy <= y + 1 && free; yy++) for (let xx = x - 1; xx <= x + 1; xx++) if (occ.has(key(xx, yy)) || (inb(xx, yy) && (map[yy][xx] === 'water' || map[yy][xx] === 'wall'))) { free = false; break; }
        if (!free) continue;
        /* de frente para a rua (um vizinho é rua ou praça), mas sem rua dos dois lados (seria um canteiro no meio do caminho) */
        const dirs: [number, number, number][] = [[0, 1, 0], [1, 0, 1], [0, -1, 2], [-1, 0, 3]]; const face = dirs.filter(([dx, dy]) => street(x + dx, y + dy)); if (!face.length || face.length > 2) continue;
        if (street(x - face[0][0], y - face[0][1])) continue;
        /* 08/11 (Erling: "a placa está virada para um lado que não se vê bem; vira ela para a visão do jogador"): a câmera olha de sudeste — o quadro sempre olha para o sul ou para o leste (o lado da rua, se der; senão, o lado que se vê) */
        const vis = face.find(([, , d2]) => d2 === 0 || d2 === 1); best = { x, y, d, dir: vis ? vis[2] : face[0][2] === 2 ? 0 : 1 }; }
      if (!best) continue; props.push({ kind: 'noticeboard', gx: best.x, gy: best.y, w: 1, h: 1, height: 1, wall: 0x5a3a20, roof: 0x4a3020, variant: best.dir }); occ.add(key(best.x, best.y)); } }
  return { map, biome, props, craftHall, quartel, dgSpots, spawn: { x: 69.5 + OFX_L, y: 75.5 + OFY_L }, pois, spawns, bridges, signs, settlements, relics, ramparts, roadPaths, roadLinks, bandits, starts: { human: { x: 69.5 + OFX_L, y: 75.5 + OFY_L, name: 'Karmika' }, dwarf: stOf('Brasaforja'), elf: stOf('Lithendel') } };
}
/** veio de minério de uma rocha (fixo pela posição): 0 nenhum, 1 ferro, 2 prata */
function veinOf_L(p: { gx: number; gy: number; w: number }) { const h = Math.abs(Math.sin(p.gx * 127.1 + p.gy * 311.7) * 43758.5453) % 1; return h < (p.w > 1 ? 0.07 : 0.035) ? 2 : h < (p.w > 1 ? 0.3 : 0.16) ? 1 : 0; }

/* =====================================================================================================================
   O MUNDO COM MAR (07/11/2026, Erling: "o quadrado do mapa pode aumentar; este continente é o centro do mundo; tirando o zoom
   aparecem ilhas dos dois lados, inóspitas, com os monstros mais fortes; depois virão outros continentes").
   O continente continua sendo gerado do jeito de sempre, nas coordenadas LOCAIS (0..840). O mundo agora é um quadrado maior, com
   o continente no meio (deslocado de DXW casas) e o oceano em volta, com quatro arquipélagos. Tudo o que sai daqui para o resto do
   jogo já vem nas coordenadas do MUNDO; as funções abaixo traduzem de um para o outro. Para crescer de novo, basta aumentar DXW
   (e o save converte sozinho em main.ts).
   ===================================================================================================================== */
export const DXW = 380;
const DM = DXW * T;
export const MAP_W = MAP_W_L + 2 * DXW, MAP_H = MAP_H_L + 2 * DXW;
const inCont = (tx: number, ty: number) => tx >= DXW && ty >= DXW && tx < DXW + MAP_W_L && ty < DXW + MAP_H_L;
const shP = <P extends { x: number; y: number }>(p: P): P => ({ ...p, x: p.x + DXW, y: p.y + DXW });
export const OFX = OFX_L + DXW, OFY = OFY_L + DXW;
export const CITY = shP(CITY_L), CATHEDRAL = shP(CATHEDRAL_L), ASKAVIK = shP(ASKAVIK_L);
export const PORTO = { ...PORTO_L, x: PORTO_L.x + DXW, y: PORTO_L.y + DXW, farol: shP(PORTO_L.farol) };
export const WILD = WILD_L.map((w) => shP(w));

/** os arquipélagos (coordenadas do mundo). Sem cidades: ilhas inóspitas, com os bichos mais fortes de Karmika. Cada uma tem relevo e clima próprios:
    a oeste o frio e a noite, a leste o latão e o fogo. */
export interface Isle { /** 07/11: península presa ao continente (sem navio) */ pen?: boolean; id: number; name: string; biome: Biome; lo: number; hi: number; col: string; peak: number; blobs: { x: number; y: number; r: number }[]; fauna: EnemyType[]; boss: EnemyType[] }
/* 07/11 (Erling: "as ilhas estão idênticas — tem que ser ORGÂNICO: umas mais perto, outras mais longe, formatos e tamanhos diferentes,
   ilhotas em volta das maiores, arquipélagos"). Cada ilha nasce de uma ESPINHA torta (crescente, gancho, cadeia, maciço), com a largura
   variando ao longo dela, e uma nuvem de ilhotas irregulares em volta — cada uma com a sua semente. */
function isleBlobs(seed: number, cx: number, cy: number, o: { len: number; ang: number; bend: number; wide: number; n: number; islets: number; spread: number }) {
  const R = rng(seed), B: { x: number; y: number; r: number }[] = [], dx = Math.cos(o.ang), dy = Math.sin(o.ang);
  for (let i = 0; i < o.n; i++) { const t = o.n === 1 ? 0.5 : i / (o.n - 1), along = (t - 0.5) * o.len, side = Math.sin(Math.PI * t) * o.bend + (R() - 0.5) * o.wide * 0.5;
    const r = o.wide * (0.45 + 0.75 * Math.sin(Math.PI * (0.15 + 0.7 * t))) * (0.65 + 0.7 * R());
    B.push({ x: Math.round(cx + dx * along - dy * side), y: Math.round(cy + dy * along + dx * side), r: Math.max(5, Math.round(r)) }); }
  for (let k = 0; k < o.islets; k++) { const base = B[Math.floor(R() * B.length)], a = R() * 6.283, d = base.r + 6 + R() * o.spread;
    B.push({ x: Math.round(base.x + Math.cos(a) * d), y: Math.round(base.y + Math.sin(a) * d), r: Math.round(3 + R() * R() * 17) }); }
  return B;
}
export const ISLES: Isle[] = [
  /* longe, a noroeste: uma ilha grande em gancho, escura, com poucas ilhotas */
  { id: 41, name: 'Ilha da Noite Eterna', biome: 'blight', lo: 130, hi: 150, col: '#8a2a4a', peak: 26,
    blobs: isleBlobs(4101, 118, 290, { len: 190, ang: 1.15, bend: 42, wide: 42, n: 11, islets: 5, spread: 30 }),
    fauna: ['ghoul', 'bat', 'succubus', 'pactbroken', 'werewolf', 'thrall'], boss: ['lich', 'headless'] },
  /* perto, a sudoeste: um arquipélago comprido, cadeia de ilhas médias e muitas ilhotas, como contas soltas */
  { id: 42, name: 'Arquipélago do Gelo Eterno', biome: 'snow', lo: 120, hi: 140, col: '#c8e8ff', peak: 34,
    blobs: isleBlobs(4202, 190, 1060, { len: 230, ang: 0.55, bend: -28, wide: 32, n: 8, islets: 14, spread: 34 }),
    fauna: ['frostwolf', 'troll', 'draugr_bers', 'draugr_arch', 'skull_frost', 'harpy'], boss: ['jotun', 'cavebear'] },
  /* no meio do caminho, a leste: pequena, rochosa, retorcida, cercada de rochedos */
  { id: 43, name: 'Ilha de Latão Perdida', biome: 'rock', lo: 125, hi: 145, col: '#d0a060', peak: 22,
    blobs: isleBlobs(4303, 1268, 560, { len: 120, ang: -0.4, bend: 18, wide: 34, n: 7, islets: 10, spread: 22 }),
    fauna: ['automaton', 'turret', 'tinker', 'scorpion', 'skel_arch', 'harpy'], boss: ['colossus', 'scorpion_king'] },
  /* a mais longe de todas, a sudeste: um maciço vulcânico largo, em crescente, com cones soltos em volta */
  { id: 44, name: 'Ilhas de Cinza de Surtr', biome: 'volcanic', lo: 135, hi: 150, col: '#ff6a2a', peak: 40,
    blobs: isleBlobs(4404, 1352, 1240, { len: 170, ang: 2.4, bend: 46, wide: 46, n: 10, islets: 8, spread: 40 }),
    fauna: ['hellhound', 'skull_fire', 'imp_bomb', 'inquisitor', 'pactbroken', 'troll'], boss: ['glutton', 'suplicio'] },
  /* 07/11 (Erling: "uma península no fim, coroada pelo Trono de Cinzas, uma região inóspita e vulcânica"): sai da costa norte, entre o
     Passo de Midvangr e o Coração da Montanha Negra, e entra no mar do norte. Presa ao continente: chega-se a pé, sem navio. A ponta é o trono */
  { id: 45, pen: true, name: 'Trono de Cinzas', biome: 'volcanic', lo: 125, hi: 150, col: '#ff5a2a', peak: 34,
    blobs: isleBlobs(4505, 902, 338, { len: 250, ang: Math.PI / 2 + 0.1, bend: 22, wide: 32, n: 12, islets: 5, spread: 20 }),
    fauna: ['hellhound', 'skull_fire', 'imp_bomb', 'pactbroken', 'troll', 'inquisitor'], boss: ['suplicio', 'glutton'] },
];
const PEN = ISLES.find((I) => I.pen)!;
/** distância com sinal para dentro da península (sem as outras ilhas: é chamado muitas vezes na costa norte) */
function penSD(tx: number, ty: number) { if (ty > DXW + 150 || Math.abs(tx - 902) > 220) return -99; let acc = -1e9; const wx = tx + (fbm(tx * 0.022, ty * 0.022, 960) - 0.5) * 26, wy = ty + (fbm(tx * 0.022 + 7, ty * 0.022, 961) - 0.5) * 26;
  for (const b of PEN.blobs) { const dx = wx - b.x, dy = wy - b.y; if (Math.abs(dx) > b.r * 2 + 30 || Math.abs(dy) > b.r * 2 + 30) continue; const wob = (fbm(tx * 0.06 + PEN.id, ty * 0.06, 900 + PEN.id) - 0.5) * 0.7; const d = b.r * (1 + wob) - Math.hypot(dx, dy);
    const k = 7, h = Math.max(0, Math.min(1, 0.5 + 0.5 * (d - acc) / k)); acc = acc < -1e8 ? d : d * h + acc * (1 - h) + k * h * (1 - h); }
  return acc; }
/** ilhotas soltas no mar (sem região, sem bicho): pedras e coqueiros — o mar não é vazio */
const ISLETS_FREE: { x: number; y: number; r: number }[] = ((() => { const R = rng(4506), L: { x: number; y: number; r: number }[] = [];
  for (let k = 0; k < 60 && L.length < 26; k++) { const x = 40 + R() * 1480, y = 40 + R() * 1480; const inC = x > DXW - 50 && x < DXW + MAP_W_L + 50 && y > DXW - 50 && y < DXW + MAP_H_L + 50; if (inC) continue; L.push({ x: Math.round(x), y: Math.round(y), r: Math.round(3 + R() * R() * 9) }); } return L; })());
const FREE_ISLE: Isle = { id: 0, name: 'Ilhota', biome: 'rock', lo: 0, hi: 0, col: '#888', peak: 5, blobs: ISLETS_FREE, fauna: [], boss: [] };
/** quanto se está dentro de uma ilha (casas até a costa; negativo = mar) e qual ilha */
function isleAt(tx: number, ty: number): { sd: number; isle: Isle | null } {
  /* costa orgânica: as coordenadas são entortadas por ruído (domain warp) e os pedaços da ilha se fundem suavemente (união macia), com baías e pontas */
  const wx = tx + (fbm(tx * 0.022, ty * 0.022, 960) - 0.5) * 26, wy = ty + (fbm(tx * 0.022 + 7, ty * 0.022, 961) - 0.5) * 26;
  let best = -1e9, bi: Isle | null = null;
  for (const I of [...ISLES, FREE_ISLE]) { let acc = -1e9; for (const b of I.blobs) { const dx = wx - b.x, dy = wy - b.y; if (Math.abs(dx) > b.r * 2 + 30 || Math.abs(dy) > b.r * 2 + 30) continue;
      const wob = (fbm(tx * 0.06 + I.id, ty * 0.06, 900 + I.id) - 0.5) * 0.7 + (fbm(tx * 0.19, ty * 0.19, 910 + I.id) - 0.5) * 0.22; const d = b.r * (1 + wob) - Math.hypot(dx, dy);
      const k = 7; const h = Math.max(0, Math.min(1, 0.5 + 0.5 * (d - acc) / k)); acc = acc < -1e8 ? d : d * h + acc * (1 - h) + k * h * (1 - h); }
    if (acc > best) { best = acc; bi = I; } }
  return { sd: best, isle: best > -40 ? bi : null };
}
/** o chão fora do continente: fundo do mar, praia, e o relevo de cada ilha (cada uma com o seu pico) */
/* 07/11: o chão aplainado das vilas e cidades das ilhas (vai no cache do mundo) */
let islePads: { x: number; y: number; r: number; h: number }[] = [];
function outerGround(tx: number, ty: number): number { const h0 = outerGround0(tx, ty); if (!islePads.length) return h0; let h = h0;
  for (const p of islePads) { const d = Math.hypot(tx - p.x, ty - p.y); if (d < p.r + 8) h += (p.h - h) * smoothstep(p.r + 8, p.r, d); } return h; }
function outerGround0(tx: number, ty: number): number {
  const { sd, isle } = isleAt(tx, ty);
  if (!isle || sd < 0) return WL - Math.min(9, 2.2 + Math.max(0, -sd) * 0.35) + (fbm(tx * 0.05, ty * 0.05, 930) - 0.5) * 1.2;
  const coast = smoothstep(0, 6, sd), inner = smoothstep(4, 40, sd);
  const ridge = 1 - Math.abs(2 * fbm(tx * 0.035 + isle.id, ty * 0.035, 940 + isle.id) - 1);
  return WL + 0.35 + coast * 1.4 + inner * (isle.peak * (0.35 + 0.65 * ridge * ridge)) + (fbm(tx * 0.12, ty * 0.12, 950) - 0.5) * 1.6 * coast;
}
/* 07/11 (Erling: "precisa ser orgânico"): o continente não pode terminar numa linha reta no mar. Perto da borda do quadrado antigo, uma
   costa de ruído come a terra (de 10 a 40 casas, mudando ao longo da costa): falésias na cordilheira do norte, praias e baías no resto.
   O porto de Porto Caldeira (e o farol) ficam como estão. */
let protPts: number[] = []; /* vilas, cidades e lugares: a costa nova nunca come o chão deles (vai no cache do mundo, em worldState) */
function coastK(tx: number, ty: number): number {
  const lx = tx - DXW, ly = ty - DXW, W1 = MAP_W_L - 1, H1 = MAP_H_L - 1, RC = 150;
  /* distância para dentro de um retângulo de cantos bem redondos (raio 150): nada de quina reta no mar */
  const qx = Math.max(RC - lx, lx - (W1 - RC), 0), qy = Math.max(RC - ly, ly - (H1 - RC), 0); const e = qx > 0 && qy > 0 ? RC - Math.hypot(qx, qy) : Math.min(lx, ly, W1 - lx, H1 - ly);
  if (e > 130) return 0;
  if (Math.hypot(lx - PORTO_L.x, ly - PORTO_L.y) < 95) return 0;
  if (ly < 150) { const ps = penSD(tx, ty); if (ps > 6) return 0; } /* 07/11: a raiz da península não vira mar */
  const t = 6 + Math.max(0, fbm(tx * 0.0045, ty * 0.0045, 970) - 0.28) * 190 + (fbm(tx * 0.025, ty * 0.025, 972) - 0.5) * 38 + (fbm(tx * 0.08, ty * 0.08, 971) - 0.5) * 9;
  let k = smoothstep(t + 3, t - 3, e); if (k <= 0) return 0;
  for (let i = 0; i < protPts.length; i += 3) { const d = Math.hypot(tx - protPts[i], ty - protPts[i + 1]) + (fbm(tx * 0.06, ty * 0.06, 973) - 0.5) * 30, r = protPts[i + 2]; if (d < r + 40) k *= smoothstep(r + 4, r + 40, d); } /* o chão protegido também tem borda torta (nada de círculo) */
  return k;
}
const SEABED = WL - 4.5;
export function heightAt(xm: number, zm: number): number { const tx = xm / T, ty = zm / T; if (!inCont(tx, ty)) return outerGround(tx, ty); const k = coastK(tx, ty), h = heightAt_L(xm - DM, zm - DM); return k > 0 ? h * (1 - k) + Math.min(h, SEABED) * k : h; }
export function groundH(xm: number, zm: number, zPre?: ZoneW, sdPre?: number): number { const tx = xm / T, ty = zm / T; if (!inCont(tx, ty)) return outerGround(tx, ty); const k = coastK(tx, ty), h = groundH_L(xm - DM, zm - DM, zPre, sdPre); return k > 0 ? h * (1 - k) + Math.min(h, SEABED) * k : h; }
export function waterSD(xm: number, zm: number): number { const tx = xm / T, ty = zm / T; if (!inCont(tx, ty)) return isleAt(tx, ty).sd * T; const k = coastK(tx, ty), w0 = waterSD_L(xm - DM, zm - DM); return k > 0 ? Math.min(w0, (0.5 - k) * 12 * T) : w0; }
const ZEMPTY = (): ZoneW => ({ meadow: 0, forest: 0, swamp: 0, snow: 0, ruins: 0, rock: 0, volcanic: 0, enchanted: 0, blight: 0, jungle: 0, coast: 0 });
export function zoneW(ax: number, ay: number): ZoneW { if (inCont(ax, ay)) { const z0 = zoneW_L(ax - DXW, ay - DXW); const ps = ay < DXW + 150 ? penSD(ax, ay) : -99; if (ps > 0) { const k = smoothstep(0, 14, ps), o = {} as ZoneW; for (const key of Object.keys(z0) as (keyof ZoneW)[]) o[key] = z0[key] * (1 - k); o.volcanic += k; return o; } return z0; } const z = ZEMPTY(), I = isleAt(ax, ay); if (I.isle && I.sd > 2) z[I.isle.biome] = 1; else z.coast = 1; return z; }
export function biomeAt(tx: number, ty: number): Biome { if (inCont(tx, ty)) { if (ty < DXW + 150 && penSD(tx, ty) > 4) return 'volcanic'; return coastK(tx, ty) > 0.35 ? 'coast' : biomeAt_L(tx - DXW, ty - DXW); } const I = isleAt(tx, ty); return I.isle && I.sd > 3 ? I.isle.biome : 'coast'; }
export function edgeK(tx: number, ty: number) { return inCont(tx, ty) ? edgeK_L(tx - DXW, ty - DXW) : { north: 0, south: 0, west: 0, east: 0 }; }
export const canalX = (ty: number) => canalX_L(ty - DXW) + DXW;
/** as regiões: as do continente (no mundo) e uma por arquipélago; o mar aberto é "Mar de Karmika" */
const SEA: Region = { id: 40, name: 'Mar de Karmika', x: -999, y: -999, lo: 120, hi: 150, col: '#3a6a9a' };
export const REGIONS: Region[] = [...REGIONS_L.map((r) => ({ ...r, x: r.x + DXW, y: r.y + DXW })), ...ISLES.map((I) => ({ id: I.id, name: I.name, x: I.blobs[0].x, y: I.blobs[0].y, lo: I.lo, hi: I.hi, col: I.col }))];
const REG_BY_ID = new Map(REGIONS.map((r) => [r.id, r]));
/** 07/11: em que terra está o ponto — 0 = continente (com a península), ou o id da ilha. As pedras rúnicas só ligam a mesma terra */
export function landOf(x: number, y: number): number { if (inCont(x, y)) return 0; const I = isleAt(x, y).isle; return !I || I.pen ? 0 : I.id; }
export function regionAt(x: number, y: number): Region { if (inCont(x, y)) { if (y < DXW + 150 && penSD(x, y) > 0) return REG_BY_ID.get(PEN.id)!; return REG_BY_ID.get(regionAt_L(x - DXW, y - DXW).id)!; } const I = isleAt(x, y); return I.isle && I.isle.id && I.sd > -12 ? REG_BY_ID.get(I.isle.id)! : SEA; }
/* as peças que voltam do resto do jogo (muralhas, pontes) chegam nas coordenadas do mundo: aqui voltam para as locais */
const unRampart = (r: Rampart): Rampart => ({ ...r, wd: undefined, cx: r.cx - DXW, cy: r.cy - DXW, tiles: r.tiles.map((k) => k - DXW * 4096 - DXW), flights: r.flights.map((f) => ({ ...f, tiles: f.tiles.map(([a, b]) => [a - DXW, b - DXW] as [number, number]) })) });
const shRampart = (r: Rampart): Rampart => ({ ...r, wd: 1, cx: r.cx + DXW, cy: r.cy + DXW, tiles: r.tiles.map((k) => k + DXW * 4096 + DXW), flights: r.flights.map((f) => ({ ...f, tiles: f.tiles.map(([a, b]) => [a + DXW, b + DXW] as [number, number]) })) });
const shBridge = (b: Bridge, k: number): Bridge => ({ ...b, ax: b.ax + k, ay: b.ay + k, bx: b.bx + k, by: b.by + k, poly: b.poly?.map((v) => v + k), ends: b.ends?.map((v, i) => (i % 3 === 2 ? v : v + k)) });
const ramCache = new WeakMap<Rampart, Rampart>();
const loc = (r: Rampart) => { let o = ramCache.get(r); if (!o) { o = unRampart(r); ramCache.set(r, o); } return o; };
export function setRamparts(r: Rampart[]) { setRamparts_L(r.map((q) => (q.wd ? unRampart(q) : q))); }
export function rampartAt(tx: number, ty: number): Rampart | null { return rampartAt_L(tx - DXW, ty - DXW); }
/** a muralha que chega pode ser a local (veio de rampartAt) ou a do mundo (veio do World): as duas funcionam */
export function rampartTop(r: Rampart, tx: number, ty: number): number { return rampartTop_L(r.wd ? loc(r) : r, tx - DXW, ty - DXW); }
export function stairDeck(xm: number, zm: number): number | null { return stairDeck_L(xm - DM, zm - DM); }
export function stairTopAt(tx: number, ty: number): boolean { return stairTopAt_L(tx - DXW, ty - DXW); }
export function bridgeDeck(xm: number, zm: number): number | null { return bridgeDeck_L(xm - DM, zm - DM); }
export function forkH(b: Bridge, x: number, y: number): number { return forkH_L(shBridge(b, -DXW), x - DXW, y - DXW); }
export function veinOf(p: { gx: number; gy: number; w: number }) { return veinOf_L({ ...p, gx: p.gx - DXW, gy: p.gy - DXW }); }
export function worldState() { return { ...worldState_L(), prot: protPts, ipads: islePads }; }
export function restoreWorldState(st: ReturnType<typeof worldState_L> & { prot?: number[]; ipads?: typeof islePads }, w: World) { protPts = st.prot ?? []; islePads = st.ipads ?? []; restoreWorldState_L(st, { ...w, bridges: w.bridges.map((b) => shBridge(b, -DXW)), ramparts: (w.ramparts ?? []).map((q) => (q.wd ? unRampart(q) : q)) }); }
/** o mundo inteiro: o continente (gerado como sempre) no meio do mar, e os arquipélagos em volta */
export function buildCity(): World {
  const w = buildCity_L(), N = MAP_W, D = DXW;
  protPts = [...w.settlements.flatMap((q) => [q.x + D, q.y + D, q.radius + 4]), ...w.pois.flatMap((q) => [q.x + D, q.y + D, 6]), ...Object.values(w.dgSpots).flatMap((q) => [q.x + D, q.y + D, 6])];
  const map: Tile[][] = new Array(N), biome: Biome[][] = new Array(N);
  for (let y = 0; y < N; y++) { const mr: Tile[] = new Array(N), br: Biome[] = new Array(N); const ly = y - D, inY = ly >= 0 && ly < MAP_H_L;
    for (let x = 0; x < N; x++) { const lx = x - D; if (inY && lx >= 0 && lx < MAP_W_L) { const k = coastK(x + 0.5, y + 0.5); if (k > 0.5) { mr[x] = 'water'; br[x] = 'coast'; } else { mr[x] = w.map[ly][lx]; br[x] = k > 0.35 ? 'coast' : w.biome[ly][lx]; } continue; }
      const I = isleAt(x + 0.5, y + 0.5); if (I.isle && I.sd > 0.6) { mr[x] = 'grass'; br[x] = I.sd > 3 && I.isle.id ? I.isle.biome : I.isle.id ? 'coast' : 'rock'; } else { mr[x] = 'water'; br[x] = 'coast'; } }
    map[y] = mr; biome[y] = br; }
  const sxy = <P extends { x: number; y: number }>(p: P) => ({ ...p, x: p.x + D, y: p.y + D });
  const props: Prop[] = w.props.map((p) => ({ ...p, gx: p.gx + D, gy: p.gy + D })).filter((p) => coastK(p.gx + p.w / 2, p.gy + p.h / 2) < 0.4); /* o que ficou no mar comido pela costa sai */
  const spawns: SpawnDef[] = w.spawns.map(sxy).filter((q) => coastK(q.x, q.y) < 0.3);
  /* os arquipélagos: mato, pedra e árvores pelo clima de cada ilha; bichos fortes espalhados, e os chefes no alto */
  const R = rng(4242);
  for (const I of ISLES) { const b0 = I.blobs[0];
    for (let k = 0; k < 900; k++) { const b = I.blobs[Math.floor(R() * I.blobs.length)], a = R() * 6.283, d = Math.sqrt(R()) * b.r * 0.95, gx = Math.round(b.x + Math.cos(a) * d), gy = Math.round(b.y + Math.sin(a) * d);
      const isl = isleAt(gx + 0.5, gy + 0.5); if (isl.isle !== I || isl.sd < 3 || map[gy]?.[gx] !== 'grass') continue;
      const tree = R() < (I.biome === 'volcanic' ? 0.18 : I.biome === 'rock' ? 0.25 : 0.55);
      const h = groundH((gx + 0.5) * T, (gy + 0.5) * T); if (h > WL + I.peak * 0.8) continue;
      props.push(tree ? { kind: 'tree', gx, gy, w: 1, h: 1, height: 5 + R() * 4, wall: 0, roof: 0, variant: I.biome === 'snow' ? 2 : I.biome === 'blight' || I.biome === 'volcanic' ? 1 : Math.floor(R() * 3) } as Prop
        : { kind: 'rock', gx, gy, w: 1, h: 1, height: 1 + R() * 2, wall: 0, roof: 0, variant: Math.floor(R() * 4) } as Prop);
      map[gy][gx] = tree ? 'tree' : map[gy][gx]; }
    for (let k = 0; k < 26; k++) { const b = I.blobs[k % I.blobs.length], a = R() * 6.283, d = Math.sqrt(R()) * b.r * 0.8, x = Math.round(b.x + Math.cos(a) * d), y = Math.round(b.y + Math.sin(a) * d);
      if (isleAt(x, y).isle !== I || isleAt(x, y).sd < 4 || map[y]?.[x] !== 'grass') continue; const lvl = Math.round(I.lo + R() * (I.hi - I.lo));
      spawns.push({ type: I.fauna[Math.floor(R() * I.fauna.length)], x, y, r: 6, n: 2 + Math.floor(R() * 3), lvl, keep: true }); }
    I.boss.forEach((bt, i) => { const a = i * 2.4 + 0.6, x = Math.round(b0.x + Math.cos(a) * b0.r * 0.3), y = Math.round(b0.y + Math.sin(a) * b0.r * 0.3); spawns.push({ type: bt, x, y, r: 3, n: 1, fixLvl: I.hi, keep: true }); }); }
  const relics: Relic[] = w.relics.map(sxy);
  /* 07/11 (Erling: "as ilhas precisam ser relativamente grandes, ter vilas e pelo menos uma cidade média cada; pedras de teleporte dentro
     da ilha para ligar os pontos da própria ilha, 3 ou 4"): cada ilha ganha uma cidade média no ponto mais alto do miolo e vilas longe dela,
     no estilo do povo que vive lá. Cada uma tem a sua pedra rúnica, e o cais tem outra. As pedras de uma ilha só levam para a mesma ilha */
  const settlements = w.settlements.map((st) => ({ ...sxy(st), npcs: st.npcs.map(sxy) })), pois = w.pois.map(sxy);
  islePads = [];
  const ISLE_TOWNS: Record<number, { style: number; kind: NpcSpec['kind']; tint: number; city: string; vil: string[]; lore: string; walls: number[]; roofs: number[] }> = {
    41: { style: 4, kind: 'nordic', tint: 0x6a2a3a, city: 'Velaterna', vil: ['Lápide Rubra', 'Brejo das Velas'], lore: 'Aqui a noite nunca acaba, e as velas nunca se apagam.', walls: [0x3e3a40, 0x4a4048], roofs: [0x2a2228, 0x4a1a2a] },
    42: { style: 1, kind: 'nordic', tint: 0x7a8aa8, city: 'Frostheim', vil: ['Ísvik', 'Kaldnes'], lore: 'O gelo guarda o que o mundo esqueceu.', walls: [0x5a4030, 0x4a3220], roofs: [0x5a6a74, 0x6a7a84] },
    43: { style: 7, kind: 'technocrat', tint: 0xb08a40, city: 'Porto Engrenagem', vil: ['Forja Velha'], lore: 'A Companhia de Latão perdeu esta ilha uma vez. Não vai perder de novo.', walls: [0x8a4a3a, 0x6a5040], roofs: [0x3a3a3a, 0x8a6a30] },
    44: { style: 2, kind: 'dwarf', tint: 0x8a4a2a, city: 'Muspelheim', vil: ['Brasa Negra', 'Cinzeiro'], lore: 'O fogo de Surtr ainda dorme debaixo dos nossos pés.', walls: [0x4a423a, 0x3a3430], roofs: [0x6a2a1a, 0x4a3a30] },
  };
  const isleTiles = (I: Isle, x: number, y: number) => { const q = isleAt(x + 0.5, y + 0.5); return q.isle === I ? q.sd : -99; };
  const RT = rng(7071);
  for (const I of ISLES) { const TW = ISLE_TOWNS[I.id]; if (!TW) continue;
    let xs0 = 1e9, xs1 = -1e9, ys0 = 1e9, ys1 = -1e9; for (const b of I.blobs) { xs0 = Math.min(xs0, b.x - b.r); xs1 = Math.max(xs1, b.x + b.r); ys0 = Math.min(ys0, b.y - b.r); ys1 = Math.max(ys1, b.y + b.r); }
    const cand: { x: number; y: number; sd: number }[] = []; for (let y = ys0; y <= ys1; y += 3) for (let x = xs0; x <= xs1; x += 3) { const sd = isleTiles(I, x, y); if (sd > 10) cand.push({ x, y, sd }); }
    if (!cand.length) continue; cand.sort((a, b) => b.sd - a.sd);
    const spots: { x: number; y: number; R: number; city: boolean; name: string }[] = [];
    { const c = cand[0]; spots.push({ x: c.x, y: c.y, R: Math.min(18, Math.max(12, Math.floor(c.sd) - 4)), city: true, name: TW.city }); }
    for (const nm of TW.vil) { const c = cand.filter((q) => q.sd >= 13 && spots.every((o) => Math.hypot(q.x - o.x, q.y - o.y) > 38)).sort((a, b) => Math.min(...spots.map((o) => Math.hypot(b.x - o.x, b.y - o.y))) - Math.min(...spots.map((o) => Math.hypot(a.x - o.x, a.y - o.y))))[0]; if (c) spots.push({ x: c.x, y: c.y, R: 11, city: false, name: nm }); }
    for (const sp of spots) { const { x: cx, y: cy, R } = sp;
      islePads.push({ x: cx, y: cy, r: R + 3, h: Math.max(WL + 1.4, outerGround0(cx, cy)) });
      for (let i = props.length - 1; i >= 0; i--) { const q = props[i]; if (Math.hypot(q.gx - cx, q.gy - cy) < R + 3) props.splice(i, 1); }
      for (let y = cy - R - 3; y <= cy + R + 3; y++) for (let x = cx - R - 3; x <= cx + R + 3; x++) if (map[y]?.[x] === 'tree' || (map[y]?.[x] && map[y][x] !== 'water' && Math.hypot(x - cx, y - cy) < R + 3)) map[y][x] = 'grass';
      for (let i = spawns.length - 1; i >= 0; i--) if (Math.hypot(spawns[i].x - cx, spawns[i].y - cy) < R + 14) spawns.splice(i, 1);
      for (let y = cy - 2; y <= cy + 2; y++) for (let x = cx - 2; x <= cx + 2; x++) map[y][x] = 'plaza';
      for (let k = -R; k <= R; k++) for (const [x, y] of [[cx + k, cy], [cx, cy + k]]) if (map[y]?.[x] === 'grass') map[y][x] = 'road';
      props.push({ kind: 'fountain', gx: cx - 1, gy: cy - 1, w: 2, h: 2, height: 0.7, wall: TW.walls[0], roof: 0x6fc7ff });
      const putB = (p: Prop) => { for (let y = p.gy - 1; y < p.gy + p.h + 1; y++) for (let x = p.gx - 1; x < p.gx + p.w + 1; x++) { const t2 = map[y]?.[x]; const edge = y < p.gy || y >= p.gy + p.h || x < p.gx || x >= p.gx + p.w; if (!t2 || (t2 !== 'grass' && !(edge && t2 === 'road')) || isleTiles(I, x, y) < 3) return false; }
        props.push(p); for (let y = p.gy; y < p.gy + p.h; y++) for (let x = p.gx; x < p.gx + p.w; x++) map[y][x] = 'wall'; return true; };
      const rings = sp.city ? [[R * 0.42, 7], [R * 0.75, 11]] : [[R * 0.65, 5]];
      let hn = 0; for (const [rad, n] of rings) for (let k = 0; k < n; k++) { const a = ((k + 0.5) / n) * 6.283 + (RT() - 0.5) * 0.35 + rad, w2 = TW.style === 1 ? 6 : 4 + Math.floor(RT() * 2), h2 = 4;
        for (const d of [rad, rad + 1.5, rad - 1.5]) { const gx = Math.round(cx + Math.cos(a) * d) - Math.floor(w2 / 2), gy = Math.round(cy + Math.sin(a) * d) - 2;
          if (putB({ kind: 'house', gx, gy, w: w2, h: h2, height: 3, wall: TW.walls[hn % TW.walls.length], roof: TW.roofs[hn % TW.roofs.length], variant: [0, 2, 1, 0, 2, 4][hn % 6], style: TW.style })) { hn++;
            const dx = gx + Math.floor(w2 / 2), dy = gy + h2; for (let y = dy; y !== cy && Math.abs(y - dy) < R; y += Math.sign(cy - dy)) if (map[y]?.[dx] === 'grass') map[y][dx] = 'road'; break; } } }
      if (sp.city) putB({ kind: 'temple', gx: cx - 2, gy: cy - R + 1, w: 5, h: 4, height: 7, wall: TW.walls[0], roof: TW.roofs[1] ?? TW.roofs[0] });
      for (const [tx, ty] of [[cx - 3, cy - 3], [cx + 3, cy + 3], [cx - 3, cy + 3], [cx + 3, cy - 3]]) if (map[ty]?.[tx] === 'grass' || map[ty]?.[tx] === 'road') props.push({ kind: 'torch', gx: tx, gy: ty, w: 1, h: 1, height: 1.9, wall: 0x3a3a3a, roof: 0xff9a3a });
      for (const [tx, ty, v] of [[cx + 3, cy - 5, 0], [cx - 5, cy + 3, 1]]) if (map[ty]?.[tx] === 'grass' && map[ty + 1]?.[tx + 1] === 'grass') props.push({ kind: 'stall', gx: tx, gy: ty, w: 2, h: 2, height: 1, wall: 0x6a4a2c, roof: v ? 0x5d6b3a : 0x8a3b2e, variant: v });
      /* a pedra rúnica da vila, num canto da praça */
      { let ok = false; for (const [ox, oy] of [[4, -4], [-4, -4], [4, 4], [-4, 4], [6, 0], [0, 6]]) { const x = cx + ox, y = cy + oy; if (map[y]?.[x] === 'grass' || map[y]?.[x] === 'road') { props.push({ kind: 'relic', gx: x, gy: y, w: 1, h: 1, height: 2.6, wall: 0x6a6a72, roof: 0x4a9aff }); map[y][x] = 'wall'; relics.push({ name: `Pedra de ${sp.name}`, x, y }); ok = true; break; } } void ok; }
      const g = (n: number) => ['Hroald', 'Sigrun', 'Vaela', 'Brann', 'Ilsa', 'Corvin', 'Thora', 'Kael', 'Mirela', 'Dorn'][(n + I.id) % 10];
      const st: Settlement = { name: sp.name, kind: sp.city ? 'city' : 'village', x: cx, y: cy, radius: R, cult: TW.style, npcs: [
        { name: g(hn), role: `Guarda de ${sp.name}`, kind: TW.kind, x: cx + 2.5, y: cy - 2.5, radius: 3, tint: TW.tint, scale: 1, lines: [`${sp.name}, na ${I.name}. ${TW.lore}`, 'Aqui o monstro mais fraco derruba um herói de Karmika. Não saia da estrada sem o seu grupo.', 'As pedras rúnicas daqui só levam para outros cantos desta ilha. Para o continente, só de navio.'] },
        { name: g(hn + 3), role: 'Mercador', kind: TW.kind === 'technocrat' ? 'technocrat' : 'dwarf', x: cx + 4, y: cy + 2.5, radius: 1.5, tint: 0xb08a40, scale: 1, lines: ['Tudo aqui chega de navio. Por isso custa o que custa.', 'Os comboios da Companhia de Latão e as barcaças dos anões passam por aqui de tempos em tempos.'] },
        ...(sp.city ? [{ name: g(hn + 6), role: 'Capitão do Porto', kind: 'technocrat' as const, x: cx - 3, y: cy + 3.5, radius: 3, tint: 0x8a6a30, scale: 1, lines: ['Os navios da Companhia de Latão saem do cais da ilha. A volta já vem paga na passagem.', `Esta é ${sp.name}, a maior cidade da ${I.name}.`] }] : []) ] };
      settlements.push(st); pois.push({ name: sp.name, x: cx, y: cy, biome: I.biome }); } }

  /* 07/11 (Erling: "só o serviço de barcos dos tecnocratas, em 4 regiões costeiras mais a cidade dos tecnocratas, vende a passagem — 10 mil
     de ouro — e embarcações gigantes levam os jogadores"): o cais fica no mar FUNDO mais perto da vila; o herói espera na terra firme ao lado */
  const docks: Dock[] = [];
  const deep = (x: number, y: number) => map[y]?.[x] === 'water' && heightAt((x + 0.5) * T, (y + 0.5) * T) < WL - 3.5;
  const landAt = (x: number, y: number) => { const t2 = map[y]?.[x]; return !!t2 && t2 !== 'water' && t2 !== 'wall' && t2 !== 'tree'; };
  const dockFrom = (id: string, name: string, cx: number, cy: number, R0: number, isle?: number) => { let best = 1e9, sx = 0, sy = 0;
    for (let y = cy - R0; y <= cy + R0; y += 2) for (let x = cx - R0; x <= cx + R0; x += 2) if (deep(x, y)) { let ok = true; for (const [ax, ay] of [[6, 0], [-6, 0], [0, 6], [0, -6]]) if (!deep(x + ax, y + ay)) { ok = false; break; } if (!ok) continue; const d = Math.hypot(x - cx, y - cy); if (d < best) { best = d; sx = x; sy = y; } }
    if (best > 1e8) return; const ux = (cx - sx) / best, uy = (cy - sy) / best; let lx = sx, ly = sy; for (let k = 0; k < best; k++) { const x = Math.round(sx + ux * k), y = Math.round(sy + uy * k); if (landAt(x, y)) { lx = x; ly = y; break; } }
    const shipX = sx - ux * 8, shipY = sy - uy * 8; /* ancorado de lado, longe da praia (o casco tem 34 m) */ docks.push({ id, name, x: lx, y: ly, sx: Math.round(shipX), sy: Math.round(shipY), ang: Math.atan2(-ux, -uy), isle }); };
  for (const [nm, r0] of [['Porto Caldeira', 70], ['Skjoldvik', 70], ['Corvoscuro', 70], ['Gorvath', 70], ['Ferrugem', 70]] as const) { const st = w.settlements.find((q) => q.name === nm); if (st) dockFrom('c:' + nm, nm, st.x + D, st.y + D, r0); }
  /* nas ilhas: o desembarque na costa virada para o continente */
  for (const I of ISLES) { if (I.pen) continue; const b = I.blobs.reduce((a, q) => (q.r > a.r ? q : a)); const cx = DXW + MAP_W_L / 2, cy = DXW + MAP_H_L / 2, dd = Math.hypot(cx - b.x, cy - b.y), ux = (cx - b.x) / dd, uy = (cy - b.y) / dd;
    let lx = b.x, ly = b.y; for (let k = 0; k < 220; k++) { const x = Math.round(b.x + ux * k), y = Math.round(b.y + uy * k); if (map[y]?.[x] === 'water') break; lx = x; ly = y; }
    dockFrom('i:' + I.id, I.name, lx, ly, 40, I.id); const dk = docks[docks.length - 1]; if (dk?.isle === I.id) { let x = dk.x, y = dk.y; for (let k = 0; k < 60 && !landAt(x, y); k++) { x = Math.round(dk.x - ux * k); y = Math.round(dk.y - uy * k); } dk.x = x; dk.y = y;
      /* a pedra rúnica do cais (07/11): quem desembarca já tem como voltar para lá de qualquer ponto da ilha */
      for (let k = 2; k < 14; k++) { const rx = Math.round(dk.x - ux * -k), ry = Math.round(dk.y - uy * -k); if (map[ry]?.[rx] === 'grass' && isleAt(rx + 0.5, ry + 0.5).sd > 4) { props.push({ kind: 'relic', gx: rx, gy: ry, w: 1, h: 1, height: 2.6, wall: 0x6a6a72, roof: 0x4a9aff }); map[ry][rx] = 'wall'; relics.push({ name: `Cais da ${I.name.replace(/^(Ilha|Ilhas|Arquipélago) (de |do |da )?/, '')}`, x: rx, y: ry }); break; } } } }
  /* 07/11 (Erling: "todos os lugares que têm porto ganham um farol diferente, com Fonte da Visão contando a viagem; faróis lindos na beirada
     iluminando o horizonte"): o farol fica na ponta de terra mais exposta ao mar perto do cais */
  const lights: NonNullable<World['lights']> = [{ name: 'Farol Tecnocrático', port: 'Porto Caldeira', x: PORTO.farol.x, y: PORTO.farol.y, style: 'vapor', old: true }];
  const STY: Record<string, 'nordico' | 'gotico' | 'pacto' | 'vapor'> = { Skjoldvik: 'nordico', Corvoscuro: 'gotico', Gorvath: 'pacto', Ferrugem: 'vapor' };
  for (const d of docks) { if (d.isle || d.name === 'Porto Caldeira') continue; let best = -1e9, bx = d.x, by = d.y;
    for (let y = d.y - 26; y <= d.y + 26; y++) for (let x = d.x - 26; x <= d.x + 26; x++) { if (!landAt(x, y) || map[y][x] === 'road' || heightAt((x + 0.5) * T, (y + 0.5) * T) < WL + 0.9) continue; let wn = 0, n = 0; for (let yy = -4; yy <= 4; yy += 2) for (let xx = -4; xx <= 4; xx += 2) { n++; if (map[y + yy]?.[x + xx] === 'water') wn++; }
      let nearProp = false; for (let yy = -2; yy <= 2 && !nearProp; yy++) for (let xx = -2; xx <= 2; xx++) if (map[y + yy]?.[x + xx] === 'wall' || map[y + yy]?.[x + xx] === 'tree') { nearProp = true; break; }
      const sc = wn / n - Math.hypot(x - d.x, y - d.y) * 0.004 - (nearProp ? 1 : 0) - (wn / n > 0.62 ? 1 : 0); if (sc > best) { best = sc; bx = x; by = y; } }
    const nm = `Farol de ${d.name}`; lights.push({ name: nm, port: d.name, x: bx, y: by, style: STY[d.name] ?? 'nordico' }); }
  const lightPois: Poi[] = lights.filter((l) => !l.old).map((l) => ({ name: l.name, x: l.x, y: l.y, biome: 'coast' as Biome }));
  return { ...w, docks, lights, map, biome, props, spawns, relics, spawn: sxy(w.spawn), quartel: { ...sxy(w.quartel), dummies: w.quartel.dummies.map(sxy) },
    dgSpots: Object.fromEntries(Object.entries(w.dgSpots).map(([k, v]) => [k, sxy(v)])), craftHall: w.craftHall ? sxy(w.craftHall) : undefined,
    pois: [...pois, ...ISLES.map((I) => ({ name: I.name, x: I.blobs[0].x, y: I.blobs[0].y, biome: I.biome })), ...lightPois], bridges: w.bridges.map((b) => shBridge(b, D)), signs: w.signs.map(sxy),
    settlements, ramparts: w.ramparts.map(shRampart),
    bandits: w.bandits.map((b) => ({ ...sxy(b), tower: b.tower ? sxy(b.tower) : null })), roadPaths: w.roadPaths.map((r) => r.map(sxy)),
    starts: { human: sxy(w.starts.human), dwarf: sxy(w.starts.dwarf), elf: sxy(w.starts.elf) } };
}
