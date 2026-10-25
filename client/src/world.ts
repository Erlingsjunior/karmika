import { CAMPAIGN_NPCS } from './campanha';
import type { Tile } from '@karmika/shared';

/** deslocamento das Terras dos Homens dentro do mundo grande (tiles) */
export const SH = 210;
export type PropKind = 'house' | 'temple' | 'fountain' | 'tree' | 'torch' | 'rock' | 'grave' | 'ruin' | 'tent' | 'campfire' | 'bridge' | 'chest' | 'bones' | 'bench' | 'stall' | 'church' | 'relic' | 'bfloor' | 'bwall' | 'bfence' | 'broof' | 'bdoor' | 'cwall' | 'tower' | 'ifence' | 'coffin' | 'angel' | 'obelisk' | 'saint' | 'mausoleum' | 'gfence' | 'gpillar' | 'ggate' | 'deadtree' | 'corpse' | 'deadcrop' | 'deadwell' | 'altar' | 'fogpatch' | 'tar' | 'herb' | 'noticeboard' | 'mailbox' | 'vault' | 'shopfront' | 'station' | 'castle' | 'rwall' | 'rtower' | 'gatehouse' | 'wstair' | 'landmark' | 'palisade' | 'totem' | 'quay' | 'monument';
export interface Relic { name: string; x: number; y: number }
export type Biome = 'meadow' | 'forest' | 'swamp' | 'snow' | 'ruins' | 'rock' | 'volcanic' | 'enchanted' | 'blight' | 'jungle' | 'coast';
export type EnemyType = 'puglin' | 'imp' | 'wolf' | 'frostwolf' | 'boar' | 'deer' | 'coyote' | 'rat' | 'fairy' | 'treant' | 'prince' | 'tormentor' | 'zombie' | 'ghoul' | 'bishop' | 'skeleton' | 'bat' | 'werewolf'
  /* gente (eventos vivos, 24/10): soldados, bruxos, paladinos negros, templários, caçadores, crias do Conde, peregrinos elfos */
  | 'soldier' | 'cultist' | 'darkpal' | 'templar' | 'hunter' | 'vampire' | 'pilgrim';
const T = 2; // metros por tile (igual a TILE_M)

export interface Prop {
  kind: PropKind;
  gx: number; gy: number; // canto de cima (grade)
  w: number; h: number;   // tamanho em tiles
  height: number;         // altura em metros (ver shared/src/scale.ts)
  wall: number; roof: number;
  variant?: number;       // tipo da árvore (0 carvalho, 1 seca, 2 pinheiro) / modelo da pedra / etc.
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
export interface SpawnDef { type: EnemyType; x: number; y: number; r: number; n: number; /** só existe à noite */ night?: boolean; /** nível dos bichos deste ponto (pela região) */ lvl?: number; /** nível fixo (ignora a região) */ fixLvl?: number }
/* REGIÕES: cada uma tem a sua faixa de 10 níveis. Dentro dela convivem bichos fracos e fortes (do começo ao fim da faixa);
   as missões levam o jogador de uma faixa para a próxima. As fronteiras são um diagrama de Voronoi torto (ruído), nunca um círculo. */
export interface Region { id: number; name: string; x: number; y: number; lo: number; hi: number; col: string }
export const REGIONS: Region[] = [
  /* Os níveis crescem a partir dos TRÊS NÚCLEOS onde se nasce — humanos em Karmika, anões em Brasaforja (sopé da Montanha Negra),
     elfos em Lithendel — e não do centro do mapa. Perto de cada berço e das cidades, bichos fracos; quanto mais longe, mais fortes.
     As três rotas de missão levam cada raça até Askavik, onde as academias recebem todos para escolher a classe. */
  // berço humano
  { id: 1, name: 'Vale de Karmika', x: 212 + SH, y: 210 + SH, lo: 1, hi: 10, col: '#8fd08a' },
  { id: 2, name: 'Bosques de Lundr', x: 296 + SH, y: 214 + SH, lo: 10, hi: 20, col: '#c8d870' },
  { id: 3, name: 'Terra Maldita', x: 262 + SH, y: 318 + SH, lo: 10, hi: 20, col: '#d8a070' },
  { id: 4, name: 'Charcos do Oeste', x: 92 + SH, y: 236 + SH, lo: 10, hi: 20, col: '#a0b878' },
  { id: 5, name: 'Planalto de Askavik', x: 322 + SH, y: 112 + SH, lo: 10, hi: 20, col: '#e0c070' },
  { id: 6, name: 'Cordilheira do Norte', x: 168 + SH, y: 62 + SH, lo: 20, hi: 30, col: '#b8c8e0' },
  { id: 7, name: 'Mata do Leste', x: 386 + SH, y: 244 + SH, lo: 20, hi: 30, col: '#70c8a0' },
  { id: 8, name: 'Colinas do Sul', x: 190 + SH, y: 384 + SH, lo: 20, hi: 30, col: '#e08a70' },
  // berço anão (Montanha Negra): o sopé é fácil; o coração do vulcão, não
  { id: 17, name: 'Sopé de Brasaforja', x: 556, y: 196, lo: 1, hi: 10, col: '#e0a070' },
  { id: 18, name: 'Minas de Cinzalto', x: 700, y: 186, lo: 10, hi: 20, col: '#c08a60' },
  { id: 19, name: 'Passo de Midvangr', x: 432, y: 176, lo: 10, hi: 20, col: '#c8c0a0' },
  { id: 13, name: 'Coração da Montanha Negra', x: 645, y: 100, lo: 40, hi: 50, col: '#ff8a4a' },
  // berço élfico
  { id: 20, name: 'Bosque de Lithendel', x: 84, y: 406, lo: 1, hi: 10, col: '#9ae0a0' },
  { id: 10, name: 'Florestas Élficas', x: 110, y: 300, lo: 10, hi: 20, col: '#7ad09a' },
  { id: 21, name: 'Raízes Antigas', x: 60, y: 480, lo: 20, hi: 30, col: '#6ab08a' },
  // o mundo selvagem, longe dos berços
  { id: 9, name: 'Montanha Viking', x: 190, y: 140, lo: 30, hi: 40, col: '#d8e4f0' },
  { id: 11, name: 'Costa do Vapor e da Graxa', x: 432, y: 760, lo: 20, hi: 30, col: '#e0b878' },
  { id: 22, name: 'Recifes da Graxa', x: 590, y: 770, lo: 30, hi: 40, col: '#d0a060' },
  { id: 12, name: 'Floresta Encantada', x: 152, y: 575, lo: 40, hi: 50, col: '#b89aff' },
  { id: 14, name: 'Colina Vampírica', x: 760, y: 280, lo: 50, hi: 60, col: '#e05a6a' },
  { id: 15, name: 'Vale da Desgraça', x: 752, y: 450, lo: 50, hi: 60, col: '#b07ad0' },
  { id: 16, name: 'Selva Licantropa', x: 716, y: 682, lo: 50, hi: 60, col: '#5ab05a' },
];
/** região do tile (Voronoi com ruído: bordas que serpenteiam) */
export function regionAt(x: number, y: number): Region {
  let best = REGIONS[0], bd = 1e9; const wx = Math.sin(y * 0.045) * 9 + Math.sin(x * 0.09 + y * 0.03) * 5, wy = Math.cos(x * 0.05) * 9 + Math.sin(y * 0.08 - x * 0.02) * 5;
  for (const r of REGIONS) { const d = Math.hypot(x + wx - r.x, (y + wy - r.y) * 1.05) * (r.id === 1 ? 0.92 : 1); if (d < bd) { bd = d; best = r; } }
  return best;
}
/** força relativa de cada bicho dentro da faixa da região (0 = fim fraco, 1 = fim forte) */
const RANK: Partial<Record<EnemyType, number>> = { deer: 0, rat: 0.05, coyote: 0.15, fairy: 0.25, puglin: 0.3, boar: 0.4, wolf: 0.45, imp: 0.5, zombie: 0.55, bat: 0.5, frostwolf: 0.65, ghoul: 0.7, skeleton: 0.8, werewolf: 0.95, treant: 1, prince: 1, tormentor: 1 };
export interface Bridge { ax: number; ay: number; bx: number; by: number; hA: number; hB: number; /** ponte de pedra em arco (Askavik) */ stone?: boolean; /** meia largura (m) */ half?: number; /** corcova do arco (m) */ hump?: number } // tiles
export interface World {
  map: Tile[][]; biome: Biome[][]; props: Prop[]; spawn: { x: number; y: number };
  /** a Casa dos Ofícios de Askavik (25/10): o salão de todas as profissões (oficios.ts monta o prédio e os ajudantes) */ craftHall?: { x: number; y: number; w: number; h: number; ry: number };
  pois: Poi[]; spawns: SpawnDef[]; bridges: Bridge[]; signs: Sign[]; settlements: Settlement[]; relics: Relic[]; ramparts: Rampart[]; roadPaths: { x: number; y: number }[][]; roadLinks: { a: string; b: string; i: number }[];
  /** onde cada raça nasce: humanos em Karmika, anões em Brasaforja (sopé da Montanha Negra), elfos em Lithendel (Florestas Élficas) */
  starts: Record<'human' | 'dwarf' | 'elf', { x: number; y: number; name: string }>;
}
export interface Sign { x: number; y: number; yaw: number; lines: { text: string; dir: number }[] }

/** MUNDO GRANDE (21/10/2026): 840×840 tiles. As Terras dos Homens (o mapa antigo de 420) ficam no centro, deslocadas de SH;
    as regiões de lore (Viking, Montanha Negra, Colina Vampírica, Vale da Desgraça, Élficas, Encantada, Selva Licantropa, Costa do Vapor) em volta. */
export const CATHEDRAL = { x: 262 + SH, y: 322 + SH };
export const MAP_W = 840;
export const MAP_H = 840;
/** a região original de 140×140 (Karmika e arredores) fica no centro das Terras dos Homens */
export const OFX = 140 + SH, OFY = 140 + SH;
export const CITY = { x: 70 + OFX, y: 72 + OFY };
export type SettleKind = 'village' | 'city';
export interface NpcSpec { name: string; role: string; kind: 'nordic' | 'dwarf' | 'technocrat'; x: number; y: number; radius: number; tint: number; scale: number; lines: string[]; shop?: string; /** só aparece à noite (a Corte de Vladislav) */ night?: boolean }
export interface Settlement { name: string; kind: SettleKind; x: number; y: number; radius: number; npcs: NpcSpec[] }

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
export const riverY = (x0: number) => { const x = x0 - OFX; return OFY + 84.5 + 4.2 * Math.sin(x * 0.085 + 0.7) + 2.1 * Math.sin(x * 0.19 + 2.1) + 0.8 * Math.sin(x * 0.43) + 22 * Math.sin(x * 0.021 + 1.3) * smoothstep(60, 110, Math.abs(x - 70)); };
const riverSlope = (x: number) => (riverY(x + 0.1) - riverY(x - 0.1)) / 0.2;
const riverBx = (y0: number) => { const y = y0 - OFY; return OFX + 40 + 3.5 * Math.sin(y * 0.1 + 1.0) + 1.6 * Math.sin(y * 0.27) - 18 * smoothstep(20, -60, y); };
/** rio do sul: atravessa a parte baixa do mapa grande */
const riverSy = (x0: number) => { const x = x0 - SH; return 352 + SH + 9 * Math.sin(x * 0.03 + 0.4) + 3.5 * Math.sin(x * 0.11 + 2.0); };
const riverSslope = (x: number) => (riverSy(x + 0.1) - riverSy(x - 0.1)) / 0.2;
const riverBSlope = (y: number) => (riverBx(y + 0.1) - riverBx(y - 0.1)) / 0.2;
const LAKES0 = [{ x: 18, y: 104, r: 9 }, { x: 112, y: 46, r: 8 }, { x: 84, y: 20, r: 6.5 }, { x: 102, y: 112, r: 6 }, { x: 28, y: 56, r: 5 }, { x: 42, y: 20, r: 6 }];
const LAKES = [...LAKES0.map((l) => ({ x: l.x + OFX, y: l.y + OFY, r: l.r })), ...[{ x: 60, y: 70, r: 11 }, { x: 330, y: 40, r: 9 }, { x: 338, y: 184, r: 6 }, { x: 384, y: 180, r: 12 }, { x: 70, y: 300, r: 10 }, { x: 300, y: 300, r: 8 }, { x: 150, y: 50, r: 7 }, { x: 40, y: 200, r: 8 }].map((l) => ({ x: l.x + SH, y: l.y + SH, r: l.r }))];

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
  ['Porto Caldeira', 430, 772, 'Vapor, graxa e barcos que remam sozinhos.'], ['Ferrugem', 566, 742, 'Tudo aqui enferruja, menos a vontade.'], ['Vaporeira', 302, 740, 'O apito da fábrica é o nosso galo.'],
  ['Dalborg', 640, 560, 'Última vila antes da selva. Compre tochas.'], ['Vindholt', 470, 640, 'Os ventos do mar chegam até aqui com cheiro de óleo.'],
] as [string, number, number, string][]);
export const ASKAVIK = { x: 318 + SH, y: 112 + SH, r: 52 };
/** distância assinada até a água (m); negativo = dentro d'água */
/** bordas do mundo (0 longe → 1 na beira): norte = cordilheira, sul = oceano, oeste = pântano intransponível, leste = floresta fechada */
export function edgeK(tx: number, ty: number) {
  const n = (fbm(tx * 0.05, ty * 0.05, 77) - 0.5) * 14;
  return { north: smoothstep(26, 5, ty + n), south: smoothstep(MAP_H - 22, MAP_H - 5, ty + n), west: smoothstep(24, 5, tx + n), east: smoothstep(MAP_W - 26, MAP_W - 5, tx + n) };
}
/* o canal de Askavik: nasce no lago ao norte da muralha, atravessa a cidade em curvas suaves entre cais de pedra
   e sai pelo sul até o lago de baixo. Margens retas (sem ruído): é obra de pedreiro, não de rio */
export const canalX = (ty: number) => ASKAVIK.x + 14 + 4 * Math.sin((ty - ASKAVIK.y) * 0.055 + 0.6);
export const CANAL_HW = 2.0; // meia largura da água (casas)
function canalSD(tx: number, ty: number) { const dy = ty - ASKAVIK.y; if (dy < -70 || dy > 64) return 99; const sl = 4 * 0.055 * Math.cos(dy * 0.055 + 0.6); return (Math.abs(tx - canalX(ty)) / Math.sqrt(1 + sl * sl) - CANAL_HW) * T; }
export function waterSD(xm: number, zm: number): number {
  const tx = xm / T, ty = zm / T;
  { const dA = Math.max(Math.abs(tx - ASKAVIK.x), Math.abs(ty - ASKAVIK.y)) - (ASKAVIK.r + 7), cs = canalSD(tx, ty);
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
export const CONDE_ROAD = { a0: Math.PI * 1.05, turns: 2.2 };
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
  { const lg = Math.min(lagoonSD(tx, ty), moatSD(tx, ty)); if (lg < 98) { const rest = waterSD1(xm, zm); return Math.min(rest, lg); } }
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
  if (ty > OFY + 20 - 60 && ty < riverY(tx) + 3) {
    const bs = riverBSlope(ty), hwB = 0.85 + 0.25 * Math.sin(ty * 0.2);
    sd = Math.min(sd, (Math.abs((tx - riverBx(ty)) / Math.sqrt(1 + bs * bs)) - hwB) * T);
  }
  for (const l of LAKES) {
    const dd = Math.hypot(tx - l.x, ty - l.y) - (l.r + (fbm(tx * 0.3, ty * 0.3, 5) - 0.5) * 3.2);
    if (dd * T < sd) sd = dd * T;
  }
  if (centerW(tx, ty) < 0.98) sd = Math.min(sd, outerWaterSD(tx, ty));
  { // oceano ao sul (costa irregular) e alagados do pântano a oeste
    const ek = edgeK(tx, ty);
    void ek; sd = Math.min(sd, oceanSD(tx, ty));
  }
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
const OLAKES = [{ x: 742, y: 440, r: 15 }, { x: 150, y: 604, r: 17 }, { x: 702, y: 704, r: 12 }, { x: 384, y: 742, r: 10 }, { x: 92, y: 336, r: 10 }, { x: 300, y: 70, r: 11 }, { x: 560, y: 60, r: 8 }];
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
  const tx0 = ax - SH, ty0 = ay - SH, AKX = ASKAVIK.x - SH, AKY = ASKAVIK.y - SH; // coordenadas das Terras dos Homens
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
function zoneOuter(ax: number, ay: number): ZoneW {
  const X = ax + (fbm(ax * 0.014, ay * 0.014, 121) - 0.5) * 70 + (fbm(ax * 0.05, ay * 0.05, 123) - 0.5) * 18, Y = ay + (fbm(ax * 0.014 + 5, ay * 0.014 + 9, 122) - 0.5) * 70 + (fbm(ax * 0.05 + 2, ay * 0.05 + 8, 124) - 0.5) * 18;
  const E = (r: { x: number; y: number; rx: number; ry: number }, edge = 0.72) => smoothstep(1, edge, Math.hypot((X - r.x) / r.rx, (Y - r.y) / r.ry));
  const L = LORE;
  const snow = E(L.viking);
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
export function zoneW(ax: number, ay: number): ZoneW {
  { const dA = Math.max(Math.abs(ax - ASKAVIK.x), Math.abs(ay - ASKAVIK.y)) - (ASKAVIK.r + 3); // dentro da muralha de Askavik: grama de cidade
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
  if (z.snow > 0.05) h += Math.pow(z.snow, 1.4) * (2.5 + 8 * ridged(tx * 0.045, ty * 0.045, 61)) + 9 * smoothstep(34, 0, Math.hypot(tx - 211 - SH, ty - 156 - SH)) * z.snow;
  if (z.rock > 0.05) h += Math.pow(z.rock, 1.3) * (1.5 + 6 * ridged(tx * 0.06, ty * 0.06, 62));
  if (z.volcanic > 0.05) { // Montanha Negra: cristas negras e o cone que pulsa lava, com cratera no topo
    const dV = Math.hypot(tx - LORE.negra.x, ty - LORE.negra.y + 8); h += Math.pow(z.volcanic, 1.2) * (4 + 10 * ridged(tx * 0.04, ty * 0.04, 63)) + 26 * smoothstep(70, 6, dV) - 9 * smoothstep(9, 2, dV); }
  if (z.blight > 0.05) h -= z.blight * 1.6 * smoothstep(60, 0, Math.hypot(tx - LORE.desgraca.x, ty - LORE.desgraca.y)); // o Vale afunda
  if (z.blight > 0.05) h += z.blight * 7 * smoothstep(40, 0, Math.hypot(tx - LORE.vampira.x, ty - LORE.vampira.y)); // a colina do castelo
  return h;
}
export function biomeAt(tx: number, ty: number): Biome {
  const z = zoneW(tx, ty);
  let best: Biome = 'meadow', bv = -1;
  for (const k of Object.keys(z) as Biome[]) if (z[k] > bv) { bv = z[k]; best = k; }
  return best;
}

/* ---------- relevo ---------- */
const pads: { x: number; z: number; r: number; h: number }[] = [];
/* índice espacial dos platôs (vilas, tendas): groundH roda milhões de vezes, não pode varrer todos */
let padIdxN = -1; const padIdx = new Map<number, { x: number; z: number; r: number; h: number }[]>(); const PADC = 64; // metros por célula
function padsNear(xm: number, zm: number) {
  if (padIdxN !== pads.length) { padIdx.clear(); for (const p of pads) for (let cy = Math.floor((p.z - p.r) / PADC); cy <= Math.floor((p.z + p.r) / PADC); cy++) for (let cx = Math.floor((p.x - p.r) / PADC); cx <= Math.floor((p.x + p.r) / PADC); cx++) { const k = cy * 4096 + cx; (padIdx.get(k) ?? padIdx.set(k, []).get(k)!).push(p); } padIdxN = pads.length; }
  return padIdx.get(Math.floor(zm / PADC) * 4096 + Math.floor(xm / PADC)) ?? NOPADS;
}
const NOPADS: { x: number; z: number; r: number; h: number }[] = [];
let bridgesRef: Bridge[] = [];

export function groundH(xm: number, zm: number, zPre?: ZoneW, sdPre?: number): number {
  const tx = xm / T, ty = zm / T;
  const dc = Math.hypot(tx - CITY.x, ty - CITY.y);
  const flat = 1 - smoothstep(26, 36, dc);
  let h0 = 0;
  if (flat < 1) {
    const z = zPre ?? zoneW(tx, ty);
    const amp = z.snow * 1.2 + z.forest * 0.75 + z.swamp * 0.12 + z.ruins * 0.5 + z.rock * 1.2 + z.meadow * 0.45 + z.volcanic * 1.5 + z.enchanted * 0.6 + z.blight * 0.4 + z.jungle * 0.7 + z.coast * 0.15;
    h0 = ((fbm(tx * 0.07, ty * 0.07, 11) - 0.5) * 2 * amp + (fbm(tx * 0.022, ty * 0.022, 12) - 0.5) * 2.4 * (1 - z.swamp) + mountainH(tx, ty, z) + (vnoise(tx * 0.4, ty * 0.4, 3) - 0.5) * 0.22) * (1 - flat);
  }
  h0 += monuH(tx, ty);
  { const ek = edgeK(tx, ty); // bordas: cordilheira ao norte (sobe até ~22 m), fundo do oceano ao sul, lama funda a oeste
    if (ek.north > 0) h0 += ek.north * (5 + 17 * smoothstep(0.25, 1, ek.north)) * (0.75 + 0.5 * fbm(tx * 0.09, ty * 0.09, 80)) + ek.north * (vnoise(tx * 0.5, ty * 0.5, 81) - 0.5) * 2.5;
    if (ek.south > 0) h0 -= ek.south * 7; if (ek.west > 0) h0 -= ek.west * 2.5; }
  for (const p of padsNear(xm, zm)) { const d = Math.hypot(xm - p.x, zm - p.z); if (d < p.r) h0 += (p.h - h0) * smoothstep(p.r, p.r * 0.55, d); }
  const sd = sdPre ?? waterSD(xm, zm);
  if (Math.max(Math.abs(tx - ASKAVIK.x), Math.abs(ty - ASKAVIK.y)) < ASKAVIK.r + 7) return sd <= 0 ? WL - 1.6 : h0; // Askavik: cais de pedra a prumo (o canal não tem margem em rampa)
  /* margem sem "briga" com o plano da água (a tela tremia): o fundo começa 35 cm abaixo da água e a terra 14 cm acima */
  if (sd <= 0) return WL - 0.35 - 1.2 * smoothstep(0, 2.4, -sd) - 0.1 * vnoise(xm * 0.5, zm * 0.5, 2) * smoothstep(0, 1, -sd);
  const t = Math.min(1, sd / 3.4);
  const rise = smoothstep(0, 1, Math.pow(t, 0.8));
  return Math.max(WL + 0.1, WL + 0.14 + (h0 - WL - 0.14) * rise + (vnoise(xm * 0.7, zm * 0.7, 6) - 0.5) * 0.14 * (1 - t));
}
/** muralha com caminho de ronda (cidades médias): anel de raio R (casas) em volta de (cx,cy); top = altura absoluta do caminho;
 *  escadarias por dentro: lance de L casas na linha R−1, a0 = primeira casa ao longo do lado, rise = sentido em que sobe */
export interface Flight { side: number; a0: number; L: number; rise: number }
export interface Rampart { cx: number; cy: number; R: number; top: number; H: number; flights: Flight[] }
export const RAMPART_H = 6;
let rampartsRef: Rampart[] = [];
export function setRamparts(r: Rampart[]) { rampartsRef = r; }
/** a muralha cujo anel passa por esta casa (ou null) */
export function rampartAt(tx: number, ty: number): Rampart | null {
  for (const r of rampartsRef) { const dx = tx - r.cx, dy = ty - r.cy; if ((Math.abs(dx) === r.R && Math.abs(dy) <= r.R) || (Math.abs(dy) === r.R && Math.abs(dx) <= r.R)) return r; } return null; }
/** casa de escada? devolve a altura do degrau (absoluta) no ponto (m) — ou null */
export function stairDeck(xm: number, zm: number): number | null {
  const fx = xm / T, fy = zm / T, tx = Math.floor(fx), ty = Math.floor(fy);
  for (const r of rampartsRef) { if (Math.abs(tx - r.cx) > r.R || Math.abs(ty - r.cy) > r.R) continue;
    for (const f of r.flights) { const ns = f.side < 2; // lado norte/sul: o lance corre ao longo de x
      const line = ns ? r.cy + (f.side === 0 ? -(r.R - 1) : r.R - 1) : r.cx + (f.side === 2 ? -(r.R - 1) : r.R - 1);
      if ((ns ? ty : tx) !== line) continue; const a = (ns ? fx - r.cx : fy - r.cy) - f.a0; if (a < 0 || a > f.L) continue;
      const t = f.rise > 0 ? a / f.L : 1 - a / f.L; return r.top - r.H + r.H * Math.min(1, Math.max(0, t)) + 0.04; } }
  return null; }
/** é a casa mais alta de um lance (de onde se pisa no caminho de ronda)? */
export function stairTopAt(tx: number, ty: number): boolean {
  for (const r of rampartsRef) for (const f of r.flights) { const ns = f.side < 2, line = ns ? r.cy + (f.side === 0 ? -(r.R - 1) : r.R - 1) : r.cx + (f.side === 2 ? -(r.R - 1) : r.R - 1);
    const topA = f.rise > 0 ? f.a0 + f.L - 1 : f.a0; const x = ns ? r.cx + topA : line, y = ns ? line : r.cy + topA; if (x === tx && y === ty) return true; } return false; }
const BRIDGE_HALF = 1.9;
export function bridgeDeck(xm: number, zm: number): number | null {
  for (const b of bridgesRef) {
    const ax = b.ax * T, az = b.ay * T, bx = b.bx * T, bz = b.by * T;
    const dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz;
    const t = ((xm - ax) * dx + (zm - az) * dz) / L2;
    if (t < 0 || t > 1) continue;
    const px = ax + dx * t, pz = az + dz * t;
    if (Math.hypot(xm - px, zm - pz) < (b.half ?? BRIDGE_HALF)) return b.hA + (b.hB - b.hA) * t + (b.hump ? b.hump * Math.sin(Math.PI * t) : 0) + 0.12;
  }
  return null;
}
export function heightAt(xm: number, zm: number): number {
  if (rampartsRef.length) { const st = stairDeck(xm, zm); if (st !== null) return st; }
  const d = bridgeDeck(xm, zm);
  return d !== null ? d : groundH(xm, zm);
}

/** o que a geração deixa guardado fora do World (platôs das vilas): vai junto no cache do mundo */
export function worldState() { return { pads: pads.map((p) => ({ ...p })) }; }
/** restaura um mundo lido do cache: platôs, pontes e as áreas secas das vilas */
export function restoreWorldState(st: { pads: { x: number; z: number; r: number; h: number }[] }, w: World) {
  pads.length = 0; pads.push(...st.pads); padIdxN = -1; bridgesRef = w.bridges; rampartsRef = w.ramparts ?? [];
  DRY.length = 0; for (const v of VILL) DRY.push({ x: v[1], y: v[2], r: 17 });
}
/* ---------- geração do mundo ---------- */
export function buildCity(): World {
  const map: Tile[][] = [];
  const biome: Biome[][] = [];
  pads.length = 0;
  bridgesRef = []; rampartsRef = [];
  DRY.length = 0; for (const v of VILL) DRY.push({ x: v[1], y: v[2], r: 17 });
  /* grade grossa (2×2 tiles): bioma e distância da água calculados uma vez; a água fina só é refeita perto das margens.
     Os mesmos números servem depois ao traçado das estradas. */
  const CG = 2, GW = Math.ceil(MAP_W / CG), GHt = Math.ceil(MAP_H / CG), NC = GW * GHt;
  const cellZ: ZoneW[] = new Array(NC), cellSD = new Float32Array(NC), cellB: Biome[] = new Array(NC);
  for (let cy = 0; cy < GHt; cy++) for (let cx = 0; cx < GW; cx++) { const c = cy * GW + cx, tx = cx * CG + 1, ty = cy * CG + 1; const z = zoneW(tx, ty); cellZ[c] = z; cellSD[c] = waterSD(tx * T, ty * T);
    let best: Biome = 'meadow', bv = -1; for (const k of Object.keys(z) as Biome[]) if (z[k] > bv) { bv = z[k]; best = k; } cellB[c] = best; }
  for (let y = 0; y < MAP_H; y++) {
    const row: Tile[] = [], brow: Biome[] = [];
    for (let x = 0; x < MAP_W; x++) {
      const c = Math.floor(y / CG) * GW + Math.floor(x / CG), sdc = cellSD[c];
      row.push(sdc > 7 ? 'grass' : sdc < -7 ? 'water' : waterSD((x + 0.5) * T, (y + 0.5) * T) < 1.3 ? 'water' : 'grass');
      brow.push(cellB[c]);
    }
    map.push(row); biome.push(brow);
  }
  const inb = (x: number, y: number) => x >= 0 && y >= 0 && x < MAP_W && y < MAP_H;
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
        const amp = 1.9 * wig * smoothstep(20, 36, Math.hypot(px - CITY.x, py - CITY.y));
        const w = Math.sin(s * 0.33 + pts[0][0]) * amp + Math.sin(s * 0.11 + 2) * amp * 0.6;
        samples.push({ x: px + nx * w, y: py + ny * w });
      }
    }
    roadPaths.push(samples.filter((_, i) => i % 4 === 0));
    const flag = samples.map((p) => waterSD(p.x * T, p.y * T) < 4.2);
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
      let wet = false; for (let k = i; k <= j && !wet; k++) if (waterSD(samples[k].x * T, samples[k].y * T) < 0.2) wet = true;
      if (wet && Math.hypot(b.x - a.x, b.y - a.y) > 2.5 && Math.abs(riverSlopeMagnitude(a, b)) >= 0) {
        // várias rotas cruzam o rio no mesmo lugar: uma ponte só (fica a mais longa, que cobre toda a água)
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, len = Math.hypot(b.x - a.x, b.y - a.y);
        const dup = bridges.find((e) => Math.hypot((e.ax + e.bx) / 2 - mx, (e.ay + e.by) / 2 - my) < 8);
        if (!dup) bridges.push({ ax: a.x, ay: a.y, bx: b.x, by: b.y, hA: 0, hB: 0 });
        else if (len > Math.hypot(dup.bx - dup.ax, dup.by - dup.ay) + 0.5) Object.assign(dup, { ax: a.x, ay: a.y, bx: b.x, by: b.y });
      }
      i = j + 1;
    }
  };
  const riverSlopeMagnitude = (_a: { x: number; y: number }, _b: { x: number; y: number }) => 0;

  bridgesRef = bridges; // alturas das pontas: terreno cru nas pontas
  for (const b of bridges) {
    const save = bridgesRef; bridgesRef = [];
    b.hA = groundH(b.ax * T, b.ay * T); b.hB = groundH(b.bx * T, b.by * T);
    bridgesRef = save;
  }

  /* praça, fonte e cidade (o desenho antigo, deslocado para o centro do mapa) */
  const OX = 52 + OFX, OY = 54 + OFY;
  const K = (x: number, y: number) => ({ x: x + OFX, y: y + OFY });
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
  // quadro de avisos de madeira, ao lado do guarda Garrick: contratos pregados para quem passa
  decor('noticeboard', 13 + OX, 17 + OY, 1, 1, 0, 0x5a3a20, 0x4a3020);
  // barracas dos comércios da vila
  decor('stall', 25 + OX, 19 + OY, 2, 2, 0, 0x6a4a6c, 0x5a3a7a); decor('stall', 9 + OX, 9 + OY, 2, 2, 0, 0x6a4a2c, 0x5d6b3a); decor('stall', 1 + OX, 24 + OY, 2, 2, 0, 0x5a6a4a, 0x3a4a2a); decor('stall', 31 + OX, 8 + OY, 2, 2, 0, 0x7a6a5a, 0x6a5a4a); decor('stall', 7 + OX, 24 + OY, 2, 2, 0, 0x7a4a3a, 0x8a3b2e); decor('stall', 35 + OX, 23 + OY, 2, 2, 0, 0x8a5a2a, 0xd0702a); decor('stall', 28 + OX, 10 + OY, 2, 2, 0, 0x7a7a7a, 0x4e5f7a);
  if (map[26 + OY][28 + OX] === 'grass') block({ kind: 'campfire', gx: 28 + OX, gy: 26 + OY, w: 1, h: 1, height: 0.6, wall: 0x4a4a4a, roof: 0xff8a2a }); decor('stall', 24 + OX, 13 + OY, 2, 2, 0, 0x6a4a2c, 0x4e5f7a); decor('stall', 12 + OX, 19 + OY, 2, 2, 0, 0x7a5a38, 0x5d6b3a);
  const torch = (gx: number, gy: number) => { if (inb(gx, gy) && map[gy][gx] !== 'water') props.push({ kind: 'torch', gx, gy, w: 1, h: 1, height: 1.9, wall: 0x3a2a1c, roof: 0xff8a2a }); };
  [[15, 15], [20, 15], [15, 20], [20, 20], [9, 7], [15, 7], [16, 25], [19, 25]].forEach(([x, y]) => torch(x + OX, y + OY));

  /* ---------- assentamentos: Karmika (centro), vilas de madeira e Askavik (cidade média de madeira e pedra) ---------- */
  const settlements: Settlement[] = [{ name: 'Karmika', kind: 'village', x: CITY.x, y: CITY.y + 3, radius: 22, npcs: [] }];
  const nearSettle = (x: number, y: number, margin: number) => settlements.some((st) => Math.hypot(x - st.x, y - st.y) < st.radius + margin);
  const FIRST = ['Astrid', 'Bjarni', 'Dagny', 'Einar', 'Freya', 'Gudrun', 'Halvar', 'Ingvar', 'Jorunn', 'Kjell', 'Liv', 'Magnus', 'Nanna', 'Orvar', 'Ragna', 'Sten', 'Tove', 'Ulrik', 'Vigdis', 'Yngve', 'Brokk', 'Dvalin', 'Eitri', 'Nori', 'Thrain'];
  // nomes por região: nórdicos só na neve; nas terras comuns, nomes de gente comum (humanos); nas florestas, élficos
  const HUMAN = ['Aldo', 'Beatriz', 'Tomé', 'Inês', 'Duarte', 'Leonor', 'Brás', 'Catarina', 'Gaspar', 'Joana', 'Matias', 'Cecília', 'Rui', 'Helena', 'Vasco', 'Marta', 'Simão', 'Clara', 'Bento', 'Luísa', 'Estêvão', 'Teresa', 'Afonso', 'Mafalda', 'Dinis', 'Violante', 'Nuno', 'Branca', 'Lopo', 'Guiomar'];
  const ELF = ['Elyndra', 'Faelar', 'Sylwen', 'Thalion', 'Aerin', 'Caelum', 'Nimue', 'Lorien', 'Vaelis', 'Ithil', 'Serethiel', 'Aradan', 'Lúmina', 'Fenwë', 'Oriel'];
  const nameOf = (rr: () => number, cx = CITY.x, cy = CITY.y) => { const z = zoneW(cx, cy); if (z.snow > 0.5) return FIRST[Math.floor(rr() * FIRST.length)]; if (z.forest > 0.45 && rr() < 0.5) return ELF[Math.floor(rr() * ELF.length)]; return HUMAN[Math.floor(rr() * HUMAN.length)]; };
  const decorAt = (kind: PropKind, gx: number, gy: number, w: number, h: number, variant: number, wall: number, roof: number) => { if (inb(gx, gy) && inb(gx + w - 1, gy + h - 1) && map[gy][gx] !== 'water') props.push({ kind, gx, gy, w, h, height: 1, wall, roof, variant }); };
  const flatten = (cx: number, cy: number, radTiles: number) => { const h = groundH(cx * T, cy * T); pads.push({ x: cx * T, z: cy * T, r: radTiles * T, h }); };
  const clearWater = (cx: number, cy: number, rad: number) => { for (let y = cy - rad; y <= cy + rad; y++) for (let x = cx - rad; x <= cx + rad; x++) if (inb(x, y) && Math.hypot(x - cx, y - cy) <= rad && map[y][x] === 'water') map[y][x] = 'grass'; };

  /** vila de madeira: casas em torno de um poço, barracas, tochas; NPCs genéricos com comércio básico */
  /* cada povo constrói do seu jeito (Erling, 23/10: "todas as vilas são extremamente parecidas" — pense em WoW, GW2, Diablo 2):
     0 vale (casas de enxaimel) · 1 nórdico · 2 anão · 3 élfico · 4 sombrio · 5 tribal · 6 pacto · 7 vapor */
  const CULT: Record<string, number> = { Jarlsheim: 1, Skjoldvik: 1, Hrimgard: 1, Nordvik: 1, 'Fjallbrún': 1, Kaldrfoss: 1, 'Hvítadalr': 1, Bjarnholt: 1, Ulfheim: 1, 'Mýrarvik': 1, Midvangr: 1, 'Hrafnhöfn': 1,
    Brasaforja: 2, Cinzalto: 2, Lithendel: 3, Lumenhal: 3, Corvoscuro: 4, 'Uivo Antigo': 5, Gorvath: 6, Vaporeira: 7, 'Porto Caldeira': 7, Ferrugem: 7 };
  /** o marco do mestre de cada caminho (fica logo ao norte da vila, ligado por estrada) */
  const LANDMARK_AT: Record<string, number> = {}; // Corvoscuro e Lumenhal: monumentos próprios (montanha e lagoa), mais abaixo
  const LM_SIZE: Record<number, [number, number, string]> = { 1: [14, 10, 'Fortaleza de Odin'], 2: [12, 11, 'Abadia da Aurora'], 3: [12, 12, 'Bastião de Prata'], 4: [9, 9, 'Pináculo de Marfim'], 5: [13, 12, 'Castelo da Colina Vampírica'], 6: [12, 12, 'Vale da Desgraça'], 7: [11, 11, 'Grande Toca do Uivo'] };
  const landmarkDoor: Record<string, { x: number; y: number }> = {};
  const village = (name: string, cx: number, cy: number, seed: number, lore: string) => {
    const cult = CULT[name] ?? 0;
    const rr = rng(seed); const R0 = 13; clearWater(cx, cy, R0 + 2); flatten(cx, cy, R0 + 4);
    const st: Settlement = { name, kind: 'village', x: cx, y: cy, radius: R0, npcs: [] }; settlements.push(st);
    for (let y = cy - 2; y <= cy + 2; y++) for (let x = cx - 2; x <= cx + 2; x++) if (inb(x, y)) map[y][x] = 'plaza';
    for (let y = cy - R0; y <= cy + R0; y++) for (let x = cx - R0; x <= cx + R0; x++) if (inb(x, y) && map[y][x] === 'grass' && (Math.abs(x - cx) <= 1 || Math.abs(y - cy) <= 1)) map[y][x] = 'road';
    if (cult === 0 || cult === 3 || cult === 7) props.push({ kind: 'fountain', gx: cx - 1, gy: cy - 1, w: 2, h: 2, height: 0.7, wall: cult === 3 ? 0xd8d0bc : cult === 7 ? 0x8a4a3a : 0x6a5a48, roof: cult === 3 ? 0x9ae0ff : 0x6fc7ff, variant: 1 });
    else { props.push({ kind: 'campfire', gx: cx, gy: cy, w: 1, h: 1, height: 0.6, wall: 0x4a4a4a, roof: cult === 6 ? 0xb06aff : cult === 4 ? 0xff3a2a : 0xff8a2a }); // fogueira no centro (nórdicos, anões, sombrios, Uivo, pacto)
      const tv = cult === 5 ? 0 : cult === 6 ? 2 : cult === 1 || cult === 2 ? 1 : -1; if (tv >= 0) for (const [tx, ty] of [[cx - 2, cy - 2], [cx + 2, cy + 2]]) if (inb(tx, ty) && map[ty][tx] === 'plaza') { props.push({ kind: 'totem', gx: tx, gy: ty, w: 1, h: 1, height: 3, wall: 0, roof: 0, variant: tv }); } }
    const PAL: [number[], number[]][] = [[[0xb99a6b, 0xc2a679, 0xa88a60], [0x8a3b2e, 0x7a4a2a, 0x6d3a28, 0x5d6b3a]], [[0x4a3220], [0x5a6a34]], [[0x6a5e52], [0x4a423a]], [[0xe8e0cc], [0x3a7a5a]], [[0x3e3a40], [0x2a2228]], [[0x5a4030], [0x8a7440]], [[0x3a2e3a], [0x2a1a30]], [[0x8a4a3a], [0x4a4e56]]];
    const nH = 4 + Math.floor(rr() * 3) + (cult === 1 || cult === 5 ? -1 : 0), WALLS = PAL[cult][0], ROOFS = PAL[cult][1];
    const hs: { gx: number; gy: number; w: number; h: number }[] = [];
    for (let k = 0; k < nH; k++) {
      const a = ((k + 0.5) / nH) * 6.283 + (rr() - 0.5) * 0.3; const w = cult === 1 ? 6 : cult === 3 || cult === 5 ? 4 : 4 + Math.floor(rr() * 2), h = cult === 4 ? 3 : 4; // nórdicos: salões compridos; élficos e tribais: redondos
      let gx = 0, gy = 0, ok = false;
      for (const d of [7.5 + rr() * 2, 10, 12]) {
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
    if (cult === 1 || cult === 5) { // paliçada de estacas em volta (nórdicos e Uivo), aberta nas estradas
      const PR = R0 + 1; for (let k = -PR; k <= PR; k++) for (const [x, y, ns] of [[cx + k, cy - PR, false], [cx + k, cy + PR, false], [cx - PR, cy + k, true], [cx + PR, cy + k, true]] as [number, number, boolean][]) {
        if (!inb(x, y) || map[y][x] !== 'grass' || Math.abs(k) <= 2) continue; props.push({ kind: 'palisade', gx: x, gy: y, w: 1, h: 1, height: 2.8, wall: 0x5a4030, roof: 0, variant: ns ? 1 : 0 }); map[y][x] = 'wall'; } }
    { const lm = LANDMARK_AT[name]; if (lm) { const [lw, lh, lname] = LM_SIZE[lm]; let gx = cx - Math.floor(lw / 2), gy = cy - R0 - 3 - lh; // ao norte; se não couber, ao sul
        const fits = (gx0: number, gy0: number) => { for (let y = gy0 - 1; y <= gy0 + lh; y++) for (let x = gx0 - 1; x <= gx0 + lw; x++) { if (!inb(x, y)) return false; const t = map[y][x]; if (t === 'wall' || t === 'water') return false; } return true; };
        if (!fits(gx, gy)) gy = cy + R0 + 3; if (!fits(gx, gy)) { gx = cx + R0 + 3; gy = cy - Math.floor(lh / 2); }
        if (fits(gx, gy)) { flatten(gx + lw / 2, gy + lh / 2, Math.max(lw, lh) / 2 + 3); for (let i = props.length - 1; i >= 0; i--) { const q = props[i]; if (q.gx >= gx - 1 && q.gx <= gx + lw && q.gy >= gy - 1 && q.gy <= gy + lh + 2 && (q.kind === 'tree' || q.kind === 'rock' || q.kind === 'herb')) props.splice(i, 1); }
          block({ kind: 'landmark', gx, gy, w: lw, h: lh, height: 20, wall: 0, roof: 0, variant: lm });
          const dx = gx + Math.floor(lw / 2); for (let y = gy + lh; y !== cy; y += Math.sign(cy - (gy + lh)) || 1) { if (!inb(dx, y)) break; for (const ox of [0, 1]) if (map[y][dx + ox] === 'grass' || map[y][dx + ox] === 'tree') map[y][dx + ox] = 'road'; if (Math.abs(y - cy) < 2) break; }
          landmarkDoor[name] = { x: gx + lw / 2 + 1.6, y: gy + lh + 1.2 }; pois.push({ name: lname, x: gx + lw / 2, y: gy + lh + 1, biome: biomeAt(cx, cy) }); } } }
    for (const [tx, ty] of [[cx - 3, cy - 3], [cx + 3, cy + 3], [cx - 3, cy + 3], [cx + 3, cy - 3]]) if (inb(tx, ty) && map[ty][tx] !== 'water' && map[ty][tx] !== 'wall') props.push({ kind: 'torch', gx: tx, gy: ty, w: 1, h: 1, height: 1.9, wall: 0x3a2a1c, roof: 0xff8a2a });
    decorAt('bench', cx + 2, cy + 3, 1, 1, 0, 0x6a4528, 0x8a3b2e); decorAt('bench', cx - 2, cy - 3, 1, 1, 1, 0x6a4528, 0x8a3b2e);
    if (hs[0]) decorAt('chest', hs[0].gx - 1, hs[0].gy + hs[0].h - 1, 1, 1, seed % 5, 0x6a4528, 0x8a3b2e);
    pois.push({ name, x: cx, y: cy, biome: biomeAt(cx, cy) });
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
    const st: Settlement = { name, kind: 'city', x: cx, y: cy, radius: R0, npcs: [] }; settlements.push(st);
    for (let i = props.length - 1; i >= 0; i--) { const q = props[i]; if (Math.abs(q.gx - cx) <= 56 && Math.abs(q.gy - cy) <= 56) props.splice(i, 1); } // o terreno da cidade começa limpo
    for (let y = cy - 56; y <= cy + 56; y++) for (let x = cx - 56; x <= cx + 56; x++) if (inb(x, y) && map[y][x] !== 'water') map[y][x] = 'grass';
    const at = (x: number, y: number) => map[cy + y]?.[cx + x];
    const set = (x: number, y: number, t: Tile) => { if (inb(cx + x, cy + y)) map[cy + y][cx + x] = t; };
    const paint = (x: number, y: number, t: Tile = 'road') => { const q = at(x, y); if (q === 'grass' || q === 'tree' || (t === 'plaza' && q === 'road')) set(x, y, t); };
    const rect = (x0: number, y0: number, x1: number, y1: number, t: Tile = 'road') => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) paint(x, y, t); };
    const disc = (x0: number, y0: number, r: number, t: Tile, r0 = -1) => { for (let y = Math.floor(y0 - r); y <= y0 + r; y++) for (let x = Math.floor(x0 - r); x <= x0 + r; x++) { const d = Math.hypot(x - x0, y - y0); if (d <= r && d > r0) paint(x, y, t); } };
    const line = (x0: number, y0: number, x1: number, y1: number, w = 1, t: Tile = 'road') => { const L = Math.hypot(x1 - x0, y1 - y0); for (let i = 0; i <= L * 2; i++) { const k = i / (L * 2), x = x0 + (x1 - x0) * k, y = y0 + (y1 - y0) * k; for (let dy = -w; dy <= w; dy++) for (let dx = -w; dx <= w; dx++) if (Math.hypot(dx, dy) <= w + 0.3) paint(Math.round(x + dx), Math.round(y + dy), t); } };
    const lit = (x: number, y: number) => { if (at(x, y) === 'grass' || at(x, y) === 'plaza') props.push({ kind: 'torch', gx: cx + x, gy: cy + y, w: 1, h: 1, height: 2.4, wall: 0x2a2a30, roof: 0xffb050 }); };
    const tree = (x: number, y: number, round = true) => { if (at(x, y) !== 'grass') return; props.push({ kind: 'tree', gx: cx + x, gy: cy + y, w: 1, h: 1, height: 5 + rr() * 2.5, wall: 0x5b3b22, roof: round ? [0x4f8f45, 0x5a9a4a, 0x6a8a3a][Math.floor(rr() * 3)] : 0x3a6a3a, variant: 0, style: 1 }); set(x, y, 'tree'); }; // style 1 = árvore plantada (a limpeza da mata dentro da muralha não leva)
    const canal = (dy: number) => canalX(cy + dy) - cx;
    // 1) o canal e os cais de pedra (o cais é calçada: anda-se por ele)
    for (let dy = -60; dy <= 60; dy++) { const c = canal(dy); for (let dx = Math.floor(c - 5); dx <= c + 5; dx++) { const d = Math.abs(dx + 0.5 - c); if (d <= CANAL_HW) set(dx, dy, 'water'); else if (d <= CANAL_HW + 1.25 && Math.abs(dy) <= 54) set(dx, dy, 'plaza'); } }
    for (let dy = -54; dy <= 54; dy++) for (const s of [-1, 1]) { const c = canal(dy), x = Math.floor(c + s * (CANAL_HW + 0.6)); if (dy % 2 === 0) props.push({ kind: 'quay', gx: cx + x, gy: cy + dy, w: 1, h: 2, height: 1, wall: 0x8a857e, roof: 0, variant: s > 0 ? 1 : 0, ry: Math.atan2(canal(dy + 1) - canal(dy - 1), 2) }); }
    const bridgesC: { x0: number; y0: number; x1: number; y1: number; half: number; hump: number }[] = [];
    /** ponte de pedra em arco onde uma rua cruza o canal: acha o trecho de água ao longo da rua e lança a ponte de cais a cais */
    const bridgeAcross = (x0: number, y0: number, x1: number, y1: number, half: number, hump: number) => { const L = Math.hypot(x1 - x0, y1 - y0); let a = -1, b = -1;
      for (let i = 0; i <= L * 4; i++) { const k = i / (L * 4), x = x0 + (x1 - x0) * k, y = y0 + (y1 - y0) * k; if (at(Math.floor(x), Math.floor(y)) === 'water') { if (a < 0) a = k; b = k; } }
      if (a < 0) return; const pad = 2.2 / L; a = Math.max(0, a - pad); b = Math.min(1, b + pad);
      bridgesC.push({ x0: x0 + (x1 - x0) * a, y0: y0 + (y1 - y0) * a, x1: x0 + (x1 - x0) * b, y1: y0 + (y1 - y0) * b, half, hump }); };
    // 2) o coração: parque redondo, anel de rua em volta, a catedral no meio e a praça da fonte na frente dela
    disc(0, 0, 23.5, 'road', 21.2);
    block({ kind: 'temple', gx: cx - 6, gy: cy - 9, w: 13, h: 14, height: 30, wall: 0x9a968e, roof: 0x3e3a5a, variant: 20 }); pois.push({ name: 'Catedral de Askavik', x: cx, y: cy + 9, biome: 'meadow' });
    rect(-9, -12, 9, -10, 'plaza'); rect(-9, -12, -8, 8, 'plaza'); rect(8, -12, 9, 8, 'plaza'); rect(-9, 6, 9, 14, 'plaza'); // calçada em volta da catedral e a praça da fonte
    props.push({ kind: 'fountain', gx: cx - 2, gy: cy + 9, w: 4, h: 4, height: 1.4, wall: 0x9a968e, roof: 0x6fc7ff, variant: 2 });
    for (const [bx, by] of [[-6, 9], [5, 9], [-6, 13], [5, 13]]) decorAt('bench', cx + bx, cy + by, 1, 1, 0, 0x5a4a3a, 0x8a3b2e);
    line(0, -12, 0, -21.5, 0); line(0, 14, 0, 21.5, 0); line(-9, -1, -21.5, -1, 0); line(9, -1, 21.5, -1, 0); // caminhos do parque
    for (let k = 0; k < 64; k++) { const ang = k / 64 * Math.PI * 2, r = 16.5 + (k % 3) * 1.6; const x = Math.round(Math.cos(ang) * r), y = Math.round(Math.sin(ang) * r); if (Math.hypot(x + 12, y - 12) < 5) continue; tree(x, y); }
    for (let k = 0; k < 16; k++) { const ang = k / 16 * Math.PI * 2 + 0.2; lit(Math.round(Math.cos(ang) * 20.6), Math.round(Math.sin(ang) * 20.6)); decorAt('bench', cx + Math.round(Math.cos(ang + 0.1) * 12.5), cy + Math.round(Math.sin(ang + 0.1) * 12.5), 1, 1, 0, 0x5a4a3a, 0x8a3b2e); }
    // 3) avenidas dos portões (o norte entra a oeste do castelo) e a ponte grande sobre o canal
    rect(-55, -1, -22, 1); rect(9, -1, 55, 1); rect(-1, 22, 1, 55); // a avenida do leste sai da praça da catedral e cruza o canal pela Ponte Grande
    line(-18, -55, -18, -27, 1); line(-18, -27, -13, -19, 1);
    bridgeAcross(8, 0, 34, 0, 1.6, 1.1);
    /** o anel do parque também cruza o canal (duas vezes): ponte reta de cais a cais onde o arco encontra a água */
    { const RR = 22.4; let inW = false, a0 = 0; for (let i = 0; i <= 720; i++) { const ang = i / 720 * Math.PI * 2, x = Math.cos(ang) * RR, y = Math.sin(ang) * RR, w = at(Math.floor(x), Math.floor(y)) === 'water';
        if (w && !inW) { a0 = ang; inW = true; } else if (!w && inW) { inW = false; const p0 = a0 - 0.1, p1 = ang + 0.1; bridgesC.push({ x0: Math.cos(p0) * RR, y0: Math.sin(p0) * RR, x1: Math.cos(p1) * RR, y1: Math.sin(p1) * RR, half: 1.2, hump: 0.8 }); } } }
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
    for (const k of [-47, 47]) { rect(-47, k, 47, k); rect(k, -47, k, 47); }
    bridgeAcross(0, -47, 30, -47, 1.0, 0.9); bridgeAcross(0, 47, 30, 47, 1.0, 0.9);
    // 7) a Praça do Mercado e a Rua do Comércio (lado oeste): casas de comércio dos dois lados, de frente para a rua
    rect(-43, -5, -31, 5, 'plaza'); props.push({ kind: 'shopfront', gx: cx - 38, gy: cy - 1, w: 2, h: 2, height: 3, wall: 0x3a2050, roof: 0xd9b45a, variant: 0 });
    for (const [x, y] of [[-43, -5], [-31, -5], [-43, 5], [-31, 5]]) lit(x, y);
    const shops: { x: number; y: number; rot: number; v: number; key: string }[] = [];
    const shopAt = (gx: number, gy: number, w: number, h: number, rot: number, v: number, key: string) => { for (let y = gy; y < gy + h; y++) for (let x = gx; x < gx + w; x++) { const q = at(x, y); if (q !== 'grass' && q !== 'tree') return; } block({ kind: 'house', gx: cx + gx, gy: cy + gy, w, h, height: 3.6, wall: [0xc2a679, 0xb0a898, 0x9a9a96, 0xa89078][shops.length % 4], roof: [0x6d3a28, 0x4e5f7a, 0x5a5a6a, 0x7a4a2a][shops.length % 4], variant: v, rot }); shops.push({ x: gx, y: gy, rot, v, key }); };
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
        for (let d = 0; d <= best + 1; d++) { const x = rot === 1 ? gx + ww + d : rot === 3 ? gx - 1 - d : mid, y = rot === 0 ? gy + hh + d : rot === 2 ? gy - 1 - d : mid; if (at(x, y) === 'grass') set(x, y, 'road'); else break; }
        if (nH % 4 === 0) { const tx = gx + (rot === 1 ? -1 : ww), ty = gy + (rot === 0 ? -1 : hh); tree(tx, ty); }
      }
      // pracinhas: um poço e árvores nos terrenos que sobraram grandes
      for (let k = 0; k < 40; k++) { const x = -50 + Math.floor(rr() * 100), y = -50 + Math.floor(rr() * 100); if (Math.hypot(x, y) < 26) continue; let ok = true; for (let dy = -2; dy <= 2 && ok; dy++) for (let dx = -2; dx <= 2 && ok; dx++) if (at(x + dx, y + dy) !== 'grass') ok = false; if (!ok) continue;
        disc(x, y, 1.6, 'plaza'); decorAt('bench', cx + x + 1, cy + y, 1, 1, 0, 0x5a4a3a, 0x8a3b2e); tree(x - 2, y - 2); tree(x + 2, y + 2); lit(x - 2, y + 2); }
    }
    // 10) lampiões ao longo das avenidas
    for (let k = -52; k <= 52; k += 6) { if (Math.abs(k) < 24) continue; lit(k, -2); lit(k, 2); lit(-2, k); lit(2, k); }
    for (const b of bridgesC) bridges.push({ ax: cx + b.x0 + 0.5, ay: cy + b.y0 + 0.5, bx: cx + b.x1 + 0.5, by: cy + b.y1 + 0.5, hA: 0, hB: 0, stone: true, half: b.half * T, hump: b.hump });
    const shopNpc = (key: string) => { const sh = shops.find((q) => q.key === key); if (!sh) return null; const w = sh.rot % 2 ? 4 : 4; void w; const fx = sh.rot === 1 ? sh.x + 4.9 : sh.x + 1.5, fy = sh.rot === 1 ? sh.y + 2.5 : sh.y + 4.9; return { x: cx + fx, y: cy + fy }; };
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

  // vilas de madeira espalhadas pelo mundo exterior e a cidade média a nordeste
  for (const [i, [nm, vx, vy, lore]] of VILL.entries()) village(nm, vx, vy, 100 + i * 17, lore);
  city('Askavik', ASKAVIK.x, ASKAVIK.y);
  /* ESTRADAS = ROTAS DE COMÉRCIO. Não saem todas de Karmika: um tronco liga Askavik às vilas grandes, ramais às pequenas,
     trilhas aos lugares de luta. Cada trecho é traçado por A* sobre o terreno (morro, mata, pântano e neve custam caro;
     água custa muito — a rota cruza o rio onde ele é estreito, numa ponte só) e prefere seguir a estrada que já existe,
     então as rotas se juntam como estradas de verdade em vez de correr paralelas. */
  const cellH = new Float32Array(NC), cellBase = new Float32Array(NC), cellWater = new Uint8Array(NC);
  for (let cy = 0; cy < GHt; cy++) for (let cx = 0; cx < GW; cx++) { const c = cy * GW + cx, tx = cx * CG + 1, ty = cy * CG + 1;
    const z = cellZ[c], sd = cellSD[c]; cellH[c] = groundH(tx * T, ty * T, z, sd); cellWater[c] = sd < 1.3 ? 1 : 0;
    cellBase[c] = 1 + z.forest * 0.7 + z.swamp * 2.2 + z.snow * 1.6 + z.rock * 1.0 + z.ruins * 0.3 + z.volcanic * 2.2 + z.enchanted * 0.6 + z.blight * 0.6 + z.jungle * 1.8 + z.coast * 0.2 + (sd < 5 ? 1.6 : 0) + (edgeK(tx, ty).north > 0.3 ? 6 : 0); }
  /** já existe ponte perto? então não se abre outra travessia ao lado: a rota usa a ponte que existe (ou cruza longe) */
  const nearBridge = (x: number, y: number) => bridges.some((b) => Math.hypot((b.ax + b.bx) / 2 - x, (b.ay + b.by) / 2 - y) < 14);
  const tileAt = (cx: number, cy: number) => map[Math.min(MAP_H - 1, cy * CG + 1)]?.[Math.min(MAP_W - 1, cx * CG + 1)];
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
        const ax2 = nx * CG + 1 - ASKAVIK.x, ay2 = ny * CG + 1 - ASKAVIK.y, inAsk = Math.abs(ax2) <= ASKAVIK.r + 5 && Math.abs(ay2) <= ASKAVIK.r + 5 && Math.abs(ay2) > 3 && !(ay2 > 0 && Math.abs(ax2) <= 3) && !(ay2 < 0 && Math.abs(ax2 + 18) <= 3); // a muralha de Askavik: as estradas chegam pelos 4 portões do meio
        const step = (inAsk ? 90 : 0) + (dx && dy ? 1.414 : 1) * (onRoad ? 0.32 : cellBase[nc]) + Math.abs(cellH[nc] - cellH[c]) * 4.5 + (cellWater[nc] && !onRoad ? 26 + (nearBridge(nx * CG + 1, ny * CG + 1) ? 600 : 0) : 0) + (wall && !onRoad ? 40 : 0);
        const ng = gs[c] + step; if (ng < gs[nc]) { gs[nc] = ng; from[nc] = c; push(nc, ng + Math.hypot(nx - gxC, ny - gyC) * 0.34); } } }
    if (from[g0] < 0 && s0 !== g0) return null;
    const out: [number, number][] = []; for (let c = g0; c >= 0; c = from[c]) { out.push([(c % GW) * CG + 1, Math.floor(c / GW) * CG + 1]); if (c === s0) break; }
    return out.reverse();
  };
  // suaviza a escada da grade: simplifica e arredonda (Chaikin) — curvas que seguem o terreno
  const smoothPath = (p: [number, number][]) => { let q = p.filter((_, i) => i % 3 === 0 || i === p.length - 1); for (let it = 0; it < 3; it++) { const o: [number, number][] = [q[0]]; for (let i = 0; i < q.length - 1; i++) { const [ax, ay] = q[i], [bx, by] = q[i + 1]; o.push([ax * 0.75 + bx * 0.25, ay * 0.75 + by * 0.25], [ax * 0.25 + bx * 0.75, ay * 0.25 + by * 0.75]); } o.push(q[q.length - 1]); q = o; } return q; };
  const PLACE: Record<string, [number, number]> = { Karmika: [CITY.x, CITY.y + 3] }; for (const v of VILL) PLACE[v[0]] = [v[1], v[2]]; PLACE.Askavik = [ASKAVIK.x, ASKAVIK.y]; /* 24/10: sem isto as estradas de Askavik (tronco do comércio) nunca eram traçadas: a cidade ficava sem estrada saindo dos portões */
  const gateOf = (tx: number, ty: number): [number, number] => { const gs2: [number, number][] = [[ASKAVIK.x - 18, ASKAVIK.y - 54], [ASKAVIK.x, ASKAVIK.y + 54], [ASKAVIK.x - 54, ASKAVIK.y], [ASKAVIK.x + 54, ASKAVIK.y]]; gs2.sort((a, b) => Math.hypot(a[0] - tx, a[1] - ty) - Math.hypot(b[0] - tx, b[1] - ty)); return gs2[0]; };
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
  bridgesRef = bridges; for (const b of bridges) { if (b.hA === 0 && b.hB === 0) { const save = bridgesRef; bridgesRef = []; b.hA = groundH(b.ax * T, b.ay * T); b.hB = groundH(b.bx * T, b.by * T); bridgesRef = save; } }

  /* relíquias dos caminhantes: pedras rúnicas perto de cada assentamento e em lugares ermos — viagem rápida entre as conhecidas */
  const relics: Relic[] = [];
  /* as relíquias são postas mais abaixo, depois das muralhas (para ficarem na saída dos portões, à beira da estrada) */

  /* pontos de interesse: acampamentos, covis, cemitério, ruínas */
  const safe = (x: number, y: number, minSd = 9) => {
    for (let rr = 0; rr < 30; rr++) for (let a = 0; a < 16; a++) {
      const px = x + Math.cos((a / 16) * 6.283) * rr, py = y + Math.sin((a / 16) * 6.283) * rr;
      if (inb(Math.floor(px), Math.floor(py)) && px > 6 && py > 6 && px < MAP_W - 6 && py < MAP_H - 6 && waterSD(px * T, py * T) > minSd) return { x: Math.round(px), y: Math.round(py) };
    }
    return { x, y };
  };
  const free = (x: number, y: number) => inb(x, y) && map[y][x] === 'grass';
  const addTent = (cx: number, cy: number, col: number) => { if (free(cx, cy) && free(cx + 1, cy + 1) && free(cx + 1, cy) && free(cx, cy + 1)) { block({ kind: 'tent', gx: cx, gy: cy, w: 2, h: 2, height: 2.4, wall: col, roof: 0x2a1c12 }); pads.push({ x: (cx + 1) * T, z: (cy + 1) * T, r: 4.2, h: groundH((cx + 1) * T, (cy + 1) * T) }); } };
  const addFire = (cx: number, cy: number) => { if (free(cx, cy)) block({ kind: 'campfire', gx: cx, gy: cy, w: 1, h: 1, height: 0.6, wall: 0x4a4a4a, roof: 0xff8a2a }); };
  const addRock = (cx: number, cy: number, big = false, variant = Math.floor(r() * 4)) => {
    const w = big ? 2 : 1;
    for (let dy = 0; dy < w; dy++) for (let dx = 0; dx < w; dx++) if (!free(cx + dx, cy + dy)) return;
    block({ kind: 'rock', gx: cx, gy: cy, w, h: w, height: big ? 2.6 + r() * 1.4 : 1.1 + r() * 0.8, wall: 0x6b6a68, roof: 0, variant });
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
  const cDraugr = camp('Acampamento Draugr', K(66, 120), 'ruins', 4, 0x4a4a52);
  const cWolf = camp('Covil dos Lobos', K(120, 62), 'forest', 2, 0x5a3a28);
  const cSwamp = camp('Atoleiro de Zerath', K(22, 66), 'swamp', 3, 0x4a5a3a);
  const cIce = camp('Cume Gelado', K(70, 16), 'snow', 3, 0x8a96aa);
  const cRock = camp('Garganta de Pedra', K(120, 120), 'rock', 2, 0x5a5048);
  // clareira do Torturador de Bestas (elite): no meio da floresta, a leste
  { const c = safe(25 + OFX, 100 + OFY, 14); /* longe da igreja: na mata do sudoeste, depois do lago */ pois.push({ name: 'Clareira dos Gritos', x: c.x, y: c.y, biome: 'forest' });
    for (let k = 0; k < 10; k++) addBones(c.x + Math.round((r() - 0.5) * 10), c.y + Math.round((r() - 0.5) * 8));
    addFire(c.x + 2, c.y + 1);
    spawns.push({ type: 'tormentor', x: c.x, y: c.y, r: 1, n: 1 }, { type: 'imp', x: c.x, y: c.y, r: 6, n: 3 }); }
  // cemitério e ruínas
  const gy0 = safe(48 + OFX, 118 + OFY);
  pois.push({ name: 'Cemitério Esquecido', x: gy0.x, y: gy0.y, biome: 'ruins' });
  for (let k = 0; k < 8; k++) addBones(gy0.x + Math.round((r() - 0.5) * 16), gy0.y + Math.round((r() - 0.5) * 12));
  for (let k = 0; k < 26; k++) addGrave(gy0.x + Math.round((r() - 0.5) * 14), gy0.y + Math.round((r() - 0.5) * 10));
  // cemitério e igreja abandonada perto da cidade (leste)
  const ch0 = safe(92 + OFX, 43 + OFY, 16); // no campo aberto ao norte da vila, longe do rio: o cemitério fica ao sul da nave
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
    st.npcs.push({ name: 'Lady Morwen', role: 'Senhora do Sangue', kind: 'nordic', x: v.x, y: v.y + 1.5, radius: 1.2, tint: 0x7a5a8a, scale: 1.0, lines: ['Hemara nunca obrigou ninguém. Ela espera. Eu também.', 'A mordida é um caminho: sede, noite eterna, força que não envelhece — e caçadores de Aravel no seu encalço até o fim das vidas.', 'Volte com o seu próprio sangue provado: nível 30. Então conversaremos sobre a primeira noite.'] });
    spawns.push({ type: 'rat', x: v.x - 5, y: v.y + 4, r: 4, n: 3 }); }
  // Primeiro lugar licantropo: a Clareira de Selvar (floresta do leste)
  { const v = safe(396 + SH, 262 + SH, 10); const st: Settlement = { name: 'Clareira de Selvar', kind: 'village', x: v.x, y: v.y, radius: 7, npcs: [] }; settlements.push(st);
    for (let y = v.y - 4; y <= v.y + 4; y++) for (let x = v.x - 4; x <= v.x + 4; x++) if (inb(x, y) && map[y][x] === 'tree') { map[y][x] = 'grass'; const i = props.findIndex((p) => p.kind === 'tree' && p.gx === x && p.gy === y); if (i >= 0) props.splice(i, 1); }
    if (free(v.x, v.y)) block({ kind: 'campfire', gx: v.x, gy: v.y, w: 1, h: 1, height: 0.6, wall: 0x4a4a4a, roof: 0xff8a2a });
    for (const [tx, ty] of [[v.x - 4, v.y - 3], [v.x + 3, v.y - 3], [v.x + 3, v.y + 2]]) if (free(tx, ty) && free(tx + 1, ty + 1) && free(tx + 1, ty) && free(tx, ty + 1)) block({ kind: 'tent', gx: tx, gy: ty, w: 2, h: 2, height: 2.4, wall: 0x5a4a3a, roof: 0x3a2a1a });
    for (let k = 0; k < 7; k++) addBones(v.x - 6 + Math.round(r() * 12), v.y - 6 + Math.round(r() * 12));
    pois.push({ name: 'Clareira de Selvar', x: v.x, y: v.y, biome: 'forest' });
    st.npcs.push({ name: 'Ulfrik', role: 'Alfa da Matilha', kind: 'nordic', x: v.x - 1.5, y: v.y + 1.5, radius: 1.5, tint: 0x6a6a72, scale: 1.1, lines: ['A alcateia protege quem está dentro até a morte. Quem está fora é presa ou aliado. Escolha.', 'Selvar corre nas noites de lua. Quem recebe a marca corre junto — e nunca mais dorme em cama.', 'Prove que sobrevive à floresta sozinho: nível 30. Depois a matilha decide se você é lobo.'] });
    spawns.push({ type: 'wolf', x: v.x + 6, y: v.y + 6, r: 5, n: 4 }); }
  // Catedral Abandonada (sul, terras antigas): 3 criptas descendo até o santuário do Sacerdote Maldito
  const cat = safe(CATHEDRAL.x, CATHEDRAL.y, 12);
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
    const solid = (kind: PropKind, gx: number, gy: number, w: number, h: number, height: number, variant: number) => { for (let y = gy; y < gy + h; y++) for (let x = gx; x < gx + w; x++) if (!inb(x, y) || map[y][x] !== 'grass') return false; props.push({ kind, gx, gy, w, h, height, wall: 0x6a6660, roof: 0x3a3640, variant }); for (let y = gy; y < gy + h; y++) for (let x = gx; x < gx + w; x++) map[y][x] = 'wall'; return true; };
    const inCat = (gx: number, gy: number) => gx >= cat.x - 5 && gx <= cat.x + 17 && gy >= cat.y - 3 && gy <= cat.y + 28;
    const aisle = (gx: number) => Math.abs(gx - (cat.x + 6)) <= 2; // avenida central do portão até a escadaria fica livre
    for (let k = 0; k < 340; k++) { const gx = x0 + 2 + Math.floor(rg() * (x1 - x0 - 4)), gy = y0 + 2 + Math.floor(rg() * (y1 - y0 - 4)); if (inCat(gx, gy) || (aisle(gx) && gy > cat.y + 20)) continue; const v = rg();
      if (v < 0.42) addGrave(gx, gy);
      else if (v < 0.54 && free(gx, gy)) { props.push({ kind: 'coffin', gx, gy, w: 1, h: 1, height: 0.6, wall: 0x3a2a1c, roof: 0x2a1a10, variant: Math.floor(rg() * 3) }); map[gy][gx] = 'wall'; }
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
    { const mx = cat.x + 26, my = cat.y + 6; for (let y = my - 6; y <= my + 11; y++) for (let x = mx - 6; x <= mx + 11; x++) if (inb(x, y) && map[y][x] === 'wall') { const pi = props.findIndex((q) => q.gx === x && q.gy === y && q.kind !== 'church' && q.kind !== 'tower'); if (pi >= 0 && ['grave', 'coffin', 'bones', 'angel', 'obelisk', 'saint', 'deadtree', 'mausoleum', 'corpse'].includes(props[pi].kind)) { const q = props.splice(pi, 1)[0]; for (let yy = q.gy; yy < q.gy + q.h; yy++) for (let xx = q.gx; xx < q.gx + q.w; xx++) if (inb(xx, yy)) map[yy][xx] = 'grass'; } }
      for (let y = my - 6; y <= my + 11; y++) for (let x = mx - 6; x <= mx + 11; x++) if (inb(x, y) && map[y][x] === 'wall' && !props.some((q) => q.gx <= x && x < q.gx + q.w && q.gy <= y && y < q.gy + q.h)) map[y][x] = 'grass';
      solid('mausoleum', mx, my, 6, 6, 7, 1); pois.push({ name: 'Mausoléu do Bispo', x: mx + 3, y: my + 7, biome: 'ruins' });
      for (const [ax, ay] of [[mx - 2, my + 7], [mx + 7, my + 7], [mx - 2, my - 2], [mx + 7, my - 2]]) solid('angel', ax, ay, 1, 1, 0.5, 2);
      const fx0 = mx - 5, fx1 = mx + 10, fy0 = my - 5, fy1 = my + 10;
      for (let x = fx0; x <= fx1; x++) for (const y of [fy0, fy1]) { if (y === fy1 && Math.abs(x - (mx + 2.5)) < 2) continue; if ((x - fx0) % 5 === 0) solid('gpillar', x, y, 1, 1, 6, 0); else solid('gfence', x, y, 1, 1, 4.6, 0); }
      for (let y = fy0 + 1; y < fy1; y++) for (const x of [fx0, fx1]) { if ((y - fy0) % 5 === 0) solid('gpillar', x, y, 1, 1, 6, 0); else solid('gfence', x, y, 1, 1, 4.6, 1); }
      spawns.push({ type: 'skeleton', x: mx + 3, y: my + 8, r: 3, n: 3 }); }
    // À NOITE o campo santo acorda: mortos, carniçais, morcegos e esqueletos saem das covas
    for (let k = 0; k < 10; k++) spawns.push({ type: (['skeleton', 'zombie', 'ghoul', 'bat', 'skeleton'] as EnemyType[])[k % 5], x: x0 + 6 + Math.floor(rg() * (x1 - x0 - 12)), y: y0 + 6 + Math.floor(rg() * (y1 - y0 - 12)), r: 5, n: 3, night: true });
    // tochas e lamparinas: pilares do portão, avenida dos anjos, mausoléu e trilhas — sem elas a noite aqui é cega
    const torchAt = (gx: number, gy: number) => { if (inb(gx, gy) && (map[gy][gx] === 'grass' || map[gy][gx] === 'road')) props.push({ kind: 'torch', gx, gy, w: 1, h: 1, height: 2.2, wall: 0x3a2a1c, roof: 0xff8a2a }); };
    for (let gy = y1 - 2; gy > cat.y + 27; gy -= 4) { torchAt(cat.x + 6 - 2, gy); torchAt(cat.x + 6 + 2, gy); }
    for (let k = 0; k < 46; k++) torchAt(x0 + 3 + Math.floor(rg() * (x1 - x0 - 6)), y0 + 3 + Math.floor(rg() * (y1 - y0 - 6)));
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
    const fi = props.findIndex((q) => q.kind === 'fountain' && Math.abs(q.gx + 1 - cx) < 2 && Math.abs(q.gy + 1 - cy) < 2); if (fi >= 0) { const f = props[fi]; props.splice(fi, 1); props.push({ kind: 'deadwell', gx: f.gx, gy: f.gy, w: 2, h: 2, height: 1, wall: 0, roof: 0, variant: 0 }); }
    const freeRect = (gx: number, gy: number, w: number, h: number) => { for (let y = gy - 1; y < gy + h + 1; y++) for (let x = gx - 1; x < gx + w + 1; x++) if (!inb(x, y) || map[y][x] !== 'grass') return false; return true; };
    for (let k = 0; k < 10; k++) { const a = rc() * 6.283, d = 14 + rc() * 5, gx = Math.round(cx + Math.cos(a) * d) - 1, gy = Math.round(cy + Math.sin(a) * d) - 1; if (freeRect(gx, gy, 3, 3)) block({ kind: 'house', gx, gy, w: 3, h: 3, height: 2.4, wall: [0x6a5a48, 0x5a4c3e, 0x74644e][k % 3], roof: [0x3a3430, 0x4a3a2e, 0x2e2a28][k % 3], variant: [0, 2, 1][k % 3] }); }
    for (let k = 0; k < 2; k++) { const a = rc() * 6.283, gx = Math.round(cx + Math.cos(a) * 7), gy = Math.round(cy + Math.sin(a) * 7); if (freeRect(gx, gy, 2, 2)) decorAt('stall', gx, gy, 2, 2, 0, 0x4a3a2a, 0x3a3430); }
    for (let f = 0; f < 3; f++) { const a = rc() * 6.283, d = 19 + rc() * 5, fx = Math.round(cx + Math.cos(a) * d), fy = Math.round(cy + Math.sin(a) * d); for (let y = fy; y < fy + 3; y++) for (let x = fx; x < fx + 5; x++) if (free(x, y)) props.push({ kind: 'deadcrop', gx: x, gy: y, w: 1, h: 1, height: 0.5, wall: 0, roof: 0, variant: 0 }); }
    for (let k = 0; k < 12; k++) { const a = rc() * 6.283, d = 9 + rc() * 14, gx = Math.round(cx + Math.cos(a) * d), gy = Math.round(cy + Math.sin(a) * d); if (free(gx, gy)) { props.push({ kind: 'deadtree', gx, gy, w: 1, h: 1, height: 4.5 + rc() * 3, wall: 0, roof: 0, variant: k < 5 ? 1 : 0 }); map[gy][gx] = 'wall'; } }
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
  spawns.push({ type: 'rat', x: ch0.x + 3, y: ch0.y + 8, r: 7, n: 4 }, { type: 'puglin', x: ch0.x + 4, y: ch0.y + 9, r: 6, n: 2 }, { type: 'fairy', x: ch0.x + 1, y: ch0.y + 6, r: 6, n: 2 }, { type: 'prince', x: ch0.x + 2, y: ch0.y - 3, r: 1, n: 1, fixLvl: 24 }); /* o Príncipe guarda a nave pelo lado norte, longe do cemitério dos aprendizes: é o chefe da missão de nível 24 */
  const ru = safe(92 + OFX, 126 + OFY);
  pois.push({ name: 'Ruínas de Aravel', x: ru.x, y: ru.y, biome: 'ruins' });
  for (let k = 0; k < 8; k++) addBones(ru.x + Math.round((r() - 0.5) * 18), ru.y + Math.round((r() - 0.5) * 12));
  for (let k = 0; k < 9; k++) addRuin(ru.x + Math.round((r() - 0.5) * 16), ru.y + Math.round((r() - 0.5) * 10), 1 + Math.floor(r() * 3), 1);

  /* trilhas: dos lugares de luta e de mistério até a estrada mais próxima (juntam-se à rede, não fazem estrelas) */
  { const near = (x: number, y: number) => { let best: [number, number] = PLACE.Karmika, bd = 1e9; for (const [, q] of Object.entries(PLACE)) { const d = Math.hypot(q[0] - x, q[1] - y); if (d < bd) { bd = d; best = q; } } return best; };
    for (const nm of ['Cume Gelado', 'Atoleiro de Zerath', 'Covil dos Lobos', 'Clareira dos Gritos', 'Igreja Abandonada', 'Cemitério Esquecido', 'Acampamento Draugr', 'Ruínas de Aravel', 'Garganta de Pedra', 'Catedral Abandonada', 'Cripta de Hemara', 'Clareira de Selvar']) {
      const p = pois.find((q) => q.name === nm); if (!p) continue; route([p.x, p.y + 3], near(p.x, p.y), 0.85); } }
  bridgesRef = bridges; for (const b of bridges) { if (b.hA === 0 && b.hB === 0) { const save = bridgesRef; bridgesRef = []; b.hA = groundH(b.ax * T, b.ay * T); b.hB = groundH(b.bx * T, b.by * T); bridgesRef = save; } }
  /* tochas ao longo das estradas perto da vila: uma de cada lado, alternadas */
  for (const rp of roadPaths) for (let i = 6; i < rp.length - 2; i += 7) { const q = rp[i], d = Math.hypot(q.x - CITY.x, q.y - CITY.y); if (d < 16 || d > 42) continue; const nx = rp[i + 1].y - rp[i - 1].y, ny = -(rp[i + 1].x - rp[i - 1].x), L = Math.hypot(nx, ny) || 1, sd2 = (i / 7) % 2 ? 2.2 : -2.2; torch(Math.round(q.x + nx / L * sd2), Math.round(q.y + ny / L * sd2)); }
  /* árvores, pedras e vegetação por bioma */
  const dens: Record<Biome, number> = { meadow: 0.04, forest: 0.3, swamp: 0.1, snow: 0.1, ruins: 0.05, rock: 0.02, volcanic: 0.02, enchanted: 0.26, blight: 0.07, jungle: 0.5, coast: 0.015 };
  for (let y = 1; y < MAP_H - 1; y++) for (let x = 1; x < MAP_W - 1; x++) {
    if (map[y][x] !== 'grass') continue;
    const bm = biome[y][x];
    const cluster = 0.35 + 1.3 * fbm(x * 0.12, y * 0.12, 21);
    if (r() > dens[bm] * cluster) continue;
    if (Math.hypot(x - CITY.x, y - CITY.y - 3) < 12) continue; // praça e arredores livres
    if (nearSettle(x, y, 0)) continue;
    let near = false;
    for (let dy = -1; dy <= 1 && !near; dy++) for (let dx = -1; dx <= 1; dx++) { const tt = map[y + dy][x + dx]; if (tt !== 'grass' && tt !== 'tree') { near = true; break; } }
    if (near) continue;
    if (bm !== 'forest' && (map[y][x - 1] === 'tree' || map[y - 1][x] === 'tree')) continue; // fora da floresta, árvores espaçadas
    if (waterSD((x + 0.5) * T, (y + 0.5) * T) < 3.0) continue; // margens ficam para juncos e pedras
    const v = r();
    const kind = bm === 'volcanic' || bm === 'blight' ? 1 : bm === 'jungle' || bm === 'enchanted' || bm === 'coast' ? (v < 0.85 ? 0 : 2) : bm === 'snow' ? 2 : bm === 'swamp' ? (v < 0.7 ? 1 : 0) : bm === 'ruins' ? (v < 0.75 ? 1 : 0) : bm === 'forest' ? (v < 0.55 ? 2 : v < 0.8 ? 0 : 1) : bm === 'rock' ? (v < 0.6 ? 1 : 2) : (v < 0.8 ? 0 : v < 0.9 ? 2 : 1);
    const pine = kind === 2;
    props.push({ kind: 'tree', gx: x, gy: y, w: 1, h: 1, height: (pine ? 6 + r() * 4 : 4.5 + r() * 3) * (bm === 'jungle' ? 1.5 : bm === 'enchanted' ? 1.3 : 1), wall: bm === 'enchanted' ? 0x6a5a7a : bm === 'blight' ? 0x2a2026 : 0x5b3b22, roof: bm === 'enchanted' ? (r() < 0.5 ? 0x8a5ad0 : 0x5ab0c8) : bm === 'jungle' ? (r() < 0.5 ? 0x1f4a24 : 0x2a5a26) : bm === 'blight' ? 0x4a3a4a : r() < 0.5 ? 0x3f7a3a : 0x4f8f45, variant: kind }); map[y][x] = 'tree'; // o tronco bloqueia (colisão circular), a copa não
  }
  // floresta fechada no leste e cordilheira rochosa no norte: a borda nunca é uma linha
  for (let y = 1; y < MAP_H - 1; y++) for (let x = 1; x < MAP_W - 1; x++) {
    if (map[y][x] !== 'grass' || nearSettle(x, y, 0)) continue;
    const ek = edgeK(x, y);
    if (ek.east > 0.35 && r() < ek.east * 0.95) { const pine = r() < 0.5; props.push({ kind: 'tree', gx: x, gy: y, w: 1, h: 1, height: pine ? 7 + r() * 4 : 5 + r() * 3, wall: 0x4b2f1c, roof: r() < 0.5 ? 0x2f6a2e : 0x3f7a3a, variant: pine ? 2 : 0 }); map[y][x] = 'tree'; continue; }
    if (ek.north > 0.4 && r() < ek.north * 0.35) { props.push({ kind: 'rock', gx: x, gy: y, w: 1, h: 1, height: 1 + r() * 2.5 * ek.north, wall: 0x6b6a68, roof: 0, variant: Math.floor(r() * 4) }); map[y][x] = 'wall'; }
  }
  const rockDens: Record<Biome, number> = { meadow: 0.004, forest: 0.012, swamp: 0.006, snow: 0.02, ruins: 0.02, rock: 0.07, volcanic: 0.06, enchanted: 0.006, blight: 0.02, jungle: 0.008, coast: 0.01 };
  for (let y = 2; y < MAP_H - 2; y++) for (let x = 2; x < MAP_W - 2; x++) {
    if (map[y][x] !== 'grass') continue;
    if (r() > rockDens[biome[y][x]]) continue;
    if (Math.hypot(x - CITY.x, y - CITY.y - 3) < 14) continue;
    if (nearSettle(x, y, 2)) continue;
    if (waterSD((x + 0.5) * T, (y + 0.5) * T) < 2.5) continue;
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
  for (let gy = 7; gy < MAP_H - 6; gy += 9) for (let gx = 7; gx < MAP_W - 6; gx += 9) {
    const px = gx + Math.round((rs() - 0.5) * 6), py = gy + Math.round((rs() - 0.5) * 6);
    const dc = Math.hypot(px - CITY.x, py - CITY.y);
    if (dc < 24 || !inb(px, py)) continue;
    if (centerW(px, py) < 0.5 && (gx + gy) % 2) continue; // fora das Terras dos Homens: grupos mais espaçados (mundo mais selvagem e menos lotado)
    let c: { x: number; y: number } | null = null; // tile seco mais perto (barato: olha a grade, não o campo de distância)
    for (let rr = 0; rr <= 4 && !c; rr++) for (let k = 0; k < 8 && !c; k++) { const qx = px + Math.round(Math.cos(k * 0.785) * rr), qy = py + Math.round(Math.sin(k * 0.785) * rr); if (map[qy]?.[qx] === 'grass') c = { x: qx, y: qy }; }
    if (!c || nearSettle(c.x, c.y, 10)) continue;
    const bm = biome[c.y][c.x], tb = TBL[bm];
    const n = 2 + Math.floor(rs() * 3);
    const t1 = dc < 50 ? EASY[Math.floor(rs() * EASY.length)] : tb[Math.floor(rs() * tb.length)];
    sp(t1, c, 7, n);
    if (rs() < 0.55) sp(dc < 50 ? EASY[Math.floor(rs() * EASY.length)] : tb[Math.floor(rs() * tb.length)], { x: c.x + 3, y: c.y - 2 }, 6, 1 + Math.floor(rs() * 2));
  }

  /* placas: nas pontas e cruzamentos das estradas, apontando para o lugar mais próximo e para Karmika */
  const signs: Sign[] = [];
  const nearPoi = (x: number, y: number) => { let best: Poi | null = null, bd = 30; for (const p of pois) { const d = Math.hypot(p.x - x, p.y - y); if (d < bd) { bd = d; best = p; } } return best; };
  const cityP = { x: CITY.x, y: CITY.y + 3 };
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
      void cityP;
      const poi = nearPoi(x, y); if (poi && Math.hypot(poi.x - sx, poi.y - sy) > 4) lines.push({ text: poi.name, dir: Math.atan2(poi.x - sx, poi.y - sy) });
      else if (end) { const far = pts[i === 0 ? pts.length - 1 : 0]; lines.push({ text: 'Estrada', dir: Math.atan2(far[0] - sx, far[1] - sy) }); }
      signs.push({ x: sx, y: sy, yaw: Math.atan2(ax, ay), lines }); map[sy][sx] = 'wall';
    }
  }

  // muralhas das cidades médias: anel de pedra de 6 m com caminho de ronda por cima, torres de vigia (o caminho passa pelo mirante),
  // um portão com pórtico e torres de flanco em cada estrada que cruza o anel (e pelo menos um por lado), escadarias por dentro
  const ramparts: Rampart[] = [];
  for (const st of settlements) {
    if (st.kind !== 'city') continue;
    const R = st.radius + 3, cx = st.x, cy = st.y, H = RAMPART_H;
    const onSide = (side: number, k: number): [number, number] => side === 0 ? [cx + k, cy - R] : side === 1 ? [cx + k, cy + R] : side === 2 ? [cx - R, cy + k] : [cx + R, cy + k];
    const OUT: [number, number][] = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    const clearAt = (x: number, y: number) => { for (let i = props.length - 1; i >= 0; i--) { const q = props[i]; if (q.gx === x && q.gy === y && (q.kind === 'tree' || q.kind === 'rock' || q.kind === 'grave' || q.kind === 'herb' || q.kind === 'bones')) props.splice(i, 1); } };
    // A) todo lado tem portão: se nenhuma estrada cruza, abre uma no meio do lado (e liga até a primeira rua de dentro)
    for (let side = 0; side < 4; side++) {
      let has = false; for (let k = -R + 1; k < R; k++) { const [x, y] = onSide(side, k); if (inb(x, y) && map[y][x] === 'road') { has = true; break; } } if (has) continue;
      const [ox, oy] = OUT[side];
      for (const k of [-1, 0, 1]) { const [gx, gy] = onSide(side, k);
        for (let d = 0; d >= -R + 1; d--) { const x = gx + ox * d, y = gy + oy * d; if (!inb(x, y)) break; const t = map[y][x]; if (d < 0 && (t === 'road' || t === 'plaza')) break; if (t === 'water' || (t === 'wall' && d < 0)) break; clearAt(x, y); map[y][x] = 'road'; } // para dentro, até a primeira rua
        for (let d = 1; d <= 9; d++) { const x = gx + ox * d, y = gy + oy * d; if (!inb(x, y)) break; const t = map[y][x]; if (t === 'water') break; if (t === 'road' && d > 2) break; clearAt(x, y); map[y][x] = 'road'; } } // e para fora
    }
    // dentro da muralha não há mata nem neve: grama de cidade (as árvores do parque ficam, são as de copa redonda, variant 0)
    for (let y = cy - R + 1; y < cy + R; y++) for (let x = cx - R + 1; x < cx + R; x++) { if (!inb(x, y)) continue; if (biome[y][x] !== 'meadow') biome[y][x] = 'meadow'; }
    for (const q of props) if (q.kind === 'tree' && q.style !== 1 && Math.abs(q.gx - cx) < R && Math.abs(q.gy - cy) < R && map[q.gy]?.[q.gx] === 'tree') map[q.gy][q.gx] = 'grass';
    for (let i = props.length - 1; i >= 0; i--) { const q = props[i]; if ((q.kind === 'tree' || q.kind === 'rock') && Math.abs(q.gx - cx) < R && Math.abs(q.gy - cy) < R && !(q.kind === 'tree' && q.style === 1)) props.splice(i, 1); }
    // B) o anel
    const seen = new Set<string>();
    for (let side = 0; side < 4; side++) for (let k = -R; k <= R; k++) {
      const [x, y] = onSide(side, k), key = x + ',' + y; if (seen.has(key) || !inb(x, y)) continue; seen.add(key);
      const t = map[y][x]; if (t === 'road' || t === 'plaza' || t === 'water') continue; // portão / água
      clearAt(x, y); const corner = Math.abs(k) === R, mid = !corner && k % 14 === 0 && k !== 0;
      props.push({ kind: corner || mid ? 'rtower' : 'rwall', gx: x, gy: y, w: 1, h: 1, height: H, wall: 0x7a7672, roof: 0x34445e, variant: side + (corner ? 4 : 0) }); map[y][x] = 'wall';
    }
    // C) portões: cada trecho de estrada no anel vira um pórtico; as casas vizinhas viram as torres de flanco (salientes para fora)
    for (let side = 0; side < 4; side++) { const [ox, oy] = OUT[side]; let run: number[] = [];
      const flush = () => { if (!run.length) return; const k0 = run[0], k1 = run[run.length - 1], [x0, y0] = onSide(side, k0), ns = side < 2;
        props.push({ kind: 'gatehouse', gx: x0, gy: y0, w: ns ? run.length : 1, h: ns ? 1 : run.length, height: H, wall: 0x8a857e, roof: 0x34445e, variant: side });
        for (const kk of [k0 - 1, k0 - 2, k1 + 1, k1 + 2]) { const [fx, fy] = onSide(side, kk); for (let i = props.length - 1; i >= 0; i--) { const q = props[i]; if (q.gx === fx && q.gy === fy && (q.kind === 'rwall' || q.kind === 'rtower') && Math.abs(kk - (kk < k0 ? k0 : k1)) === 1) q.kind = 'rwall'; }
          if (inb(fx + ox, fy + oy) && map[fy + oy][fx + ox] !== 'water') { clearAt(fx + ox, fy + oy); map[fy + oy][fx + ox] = 'wall'; } }
        run = []; };
      for (let k = -R + 1; k <= R - 1; k++) { const [x, y] = onSide(side, k); if (inb(x, y) && map[y][x] === 'road') run.push(k); else flush(); } flush(); }
    // D) escadarias por dentro: dois lances por lado, longe dos portões, subindo em sentidos opostos
    const flights: Flight[] = [];
    for (let side = 0; side < 4; side++) { const [ox, oy] = OUT[side], L = 5;
      for (const [kc, rise] of [[-Math.round(R * 0.55), 1], [Math.round(R * 0.55), -1]] as [number, number][]) {
        let a0 = kc - (rise > 0 ? 0 : L - 1); let ok = false;
        for (let shift = 0; shift < 12 && !ok; shift++) { const s0 = a0 + (shift % 2 ? -1 : 1) * Math.ceil(shift / 2); ok = true;
          for (let i = -1; i <= L; i++) { const [rx, ry] = onSide(side, s0 + i), x = rx - ox, y = ry - oy, t = map[y]?.[x];
            if (i >= 0 && i < L && (t !== 'grass' && t !== 'road')) { ok = false; break; } if (map[ry]?.[rx] !== 'wall') { ok = false; break; } }
          if (ok) a0 = s0; }
        if (!ok) continue;
        for (let i = 0; i < L; i++) { const [rx, ry] = onSide(side, a0 + i), x = rx - ox, y = ry - oy; clearAt(x, y); map[y][x] = 'road'; }
        const [bx, by] = onSide(side, a0); props.push({ kind: 'wstair', gx: bx - ox, gy: by - oy, w: side < 2 ? L : 1, h: side < 2 ? 1 : L, height: H, wall: 0x8a857e, roof: 0, variant: side * 2 + (rise > 0 ? 1 : 0) });
        flights.push({ side, a0, L, rise }); } }
    ramparts.push({ cx, cy, R, top: groundH(cx * T, cy * T) + H, H, flights });
    // do lado de fora dos portões: estábulo (tenda + cerca), barracas e um mendigo encostado na muralha
    const seg: [number, number][] = []; for (let side = 0; side < 4; side++) for (let k = -R; k <= R; k++) seg.push(onSide(side, k));
    const isRd = (x: number, y: number) => inb(x, y) && map[y][x] === 'road';
    const gates = [...new Set(seg.map(([x, y]) => x + ',' + y))].map((k) => k.split(',').map(Number) as [number, number]).filter(([x, y]) => isRd(x, y) && (Math.abs(x - cx) === R || Math.abs(y - cy) === R) && (Math.abs(y - cy) === R ? isRd(x - 1, y) && isRd(x + 1, y) : isRd(x, y - 1) && isRd(x, y + 1))); // só o meio de cada portão
    const rg = rng(st.x * 7 + st.y);
    for (const [gx, gy] of gates) {
      const ox = Math.sign(gx - cx) * (Math.abs(gx - cx) === R ? 1 : 0), oy = Math.sign(gy - cy) * (Math.abs(gy - cy) === R ? 1 : 0);
      const px = -oy, py = ox; // ao lado do portão, do lado de fora
      const sx = gx + ox * 3 + px * 4, sy = gy + oy * 3 + py * 4;
      if (inb(sx, sy) && inb(sx + 1, sy + 1) && map[sy][sx] === 'grass' && map[sy + 1]?.[sx + 1] === 'grass') { props.push({ kind: 'tent', gx: sx, gy: sy, w: 2, h: 2, height: 2.6, wall: 0x8a6a40, roof: 0x6a4a2a }); map[sy][sx] = map[sy][sx + 1] = map[sy + 1][sx] = map[sy + 1][sx + 1] = 'wall'; for (let k = 0; k < 3; k++) { const fx = sx + 2 + k * (px ? 0 : 1) + (px ? px * 0 : 0), fy = sy + 2 + (px ? k : 0); if (inb(fx, fy) && map[fy][fx] === 'grass') { props.push({ kind: 'bfence', gx: fx, gy: fy, w: 1, h: 1, height: 1, wall: 0x6a4a2a, roof: 0, variant: px ? 1 : 0 }); map[fy][fx] = 'wall'; } } }
      const bx = gx + ox * 2 - px * 3, by = gy + oy * 2 - py * 3;
      if (inb(bx, by) && map[by][bx] === 'grass') { props.push({ kind: 'stall', gx: bx, gy: by, w: 2, h: 2, height: 2.2, wall: 0x6a4a2c, roof: [0x7a3a2a, 0x3a5a7a, 0x6a6a2a][Math.floor(rg() * 3)], variant: 0 }); map[by][bx] = 'wall'; if (inb(bx + 1, by + 1)) { map[by][bx + 1] = map[by + 1][bx] = map[by + 1][bx + 1] = 'wall'; } }
      const mx = gx + ox * 3.4 + px * 3.8 + 0.5, my = gy + oy * 3.4 + py * 3.8 + 0.5; // fora da torre de flanco
      st.npcs.push({ name: ['Pedinte Ake', 'Mendigo Olvar', 'Velha Gudrun', 'Cego Hemming'][Math.floor(rg() * 4)], role: 'Mendigo', kind: 'nordic', x: mx, y: my, radius: 0.6, tint: 0x5a4a3a, scale: 0.9, lines: ['Uma moeda, viajante? A muralha é fria à noite.', 'Já fui guarda desta torre. Hoje a torre me olha de cima.', `Dizem que o Olho vê tudo. Então ele me vê aqui, encostado em ${st.name}.`] });
    }
  }
  /* os monumentos dos caminhos, com o entorno de cada um */
  {
    const clearArea = (x0: number, y0: number, r: number) => { for (let i = props.length - 1; i >= 0; i--) { const q = props[i]; if (Math.hypot(q.gx - x0, q.gy - y0) < r && (q.kind === 'tree' || q.kind === 'rock' || q.kind === 'herb' || q.kind === 'bones' || q.kind === 'grave')) props.splice(i, 1); } };
    const rnd = rng(9090);
    { /* O CASTELO DO CONDE: montanha negra, estrada em caracol, árvores mortas, covas, névoa, estacas e lanternas vermelhas */
      const c = MONU.conde; clearArea(c.x, c.y, c.R + 4);
      for (let y = c.y - c.R; y <= c.y + c.R; y++) for (let x = c.x - c.R; x <= c.x + c.R; x++) if (inb(x, y) && Math.hypot(x - c.x, y - c.y) < c.R && map[y][x] !== 'water') map[y][x] = 'grass';
      const pts: [number, number][] = []; const a0 = CONDE_ROAD.a0, turns = CONDE_ROAD.turns; // sai do lado de Corvoscuro (oeste) e sobe em caracol até a frente do castelo (sul)
      for (let i = 0; i <= 160; i++) { const t = i / 160, ang = a0 + t * turns * Math.PI * 2, r = (c.R + 3) - t * (c.R + 3 - (c.top - 1.2)); pts.push([c.x + Math.cos(ang) * r, c.y + Math.sin(ang) * r]); }
      const endA = a0 + turns * Math.PI * 2; road(pts, 1.25, 0);
      // da vila até o pé da montanha
      { const v = settlements.find((q) => q.name === 'Corvoscuro'); if (v) road([[v.x + 3, v.y], [pts[0][0], pts[0][1]]], 1.1, 0.4); }
      for (let i = 4; i < pts.length; i += 7) { const [x, y] = pts[i], a = Math.atan2(y - c.y, x - c.x); const ox = Math.round(x + Math.cos(a) * 2.2), oy = Math.round(y + Math.sin(a) * 2.2); if (inb(ox, oy) && map[oy][ox] === 'grass') props.push({ kind: 'torch', gx: ox, gy: oy, w: 1, h: 1, height: 2.2, wall: 0x1a1a20, roof: 0xff2a2a }); }
      const W = 22, H = 20, gx = c.x - Math.floor(W / 2), gy = c.y - Math.floor(H / 2) - 1; block({ kind: 'monument', gx, gy, w: W, h: H, height: 60, wall: 0x3a3438, roof: 0x2a1e24, variant: 1 });
      landmarkDoor['Corvoscuro'] = { x: gx + W / 2 + 1.6, y: gy + H + 1.4 };
      for (let y = gy + H; y <= c.y + c.top; y++) for (let x = c.x - 2; x <= c.x + 2; x++) if (inb(x, y) && map[y][x] === 'grass') map[y][x] = 'road'; void endA;
      pois.push({ name: 'Castelo da Colina Vampírica', x: c.x, y: gy + H + 2, biome: 'blight' });
      for (let k = 0; k < 150; k++) { const a = rnd() * 6.283, r = c.top + 2 + rnd() * (c.R + 6 - c.top), x = Math.round(c.x + Math.cos(a) * r), y = Math.round(c.y + Math.sin(a) * r); if (!inb(x, y) || map[y][x] !== 'grass') continue;
        const q = rnd(); if (q < 0.55) { props.push({ kind: 'tree', gx: x, gy: y, w: 1, h: 1, height: 4 + rnd() * 4, wall: 0x2a2226, roof: 0x3a2a30, variant: 1 }); map[y][x] = 'tree'; }
        else if (q < 0.75) props.push({ kind: 'grave', gx: x, gy: y, w: 1, h: 1, height: 1.2, wall: 0x5a565a, roof: 0, variant: Math.floor(rnd() * 3) });
        else if (q < 0.88) props.push({ kind: 'fogpatch', gx: x, gy: y, w: 1, h: 1, height: 1, wall: 0x3a2a40, roof: 0x8a2a3a, variant: 0 });
        else props.push({ kind: 'bones', gx: x, gy: y, w: 1, h: 1, height: 0.4, wall: 0xd8d0b8, roof: 0, variant: Math.floor(rnd() * 3) }); }
    }
    { /* O PINÁCULO DE MARFIM: a torre na ilha do meio da lagoa; a Ponte dos Mil Passos até a margem; ilhotas com árvores de flor branca, cristais e lanternas */
      const m = MONU.marfim; clearArea(m.x, m.y, m.R + 4);
      for (let y = m.y - m.R - 2; y <= m.y + m.R + 2; y++) for (let x = m.x - m.R - 2; x <= m.x + m.R + 2; x++) if (inb(x, y)) map[y][x] = waterSD(x * T + T / 2, y * T + T / 2) < 0 ? 'water' : 'grass';
      const W = 12, H = 12, gx = m.x - 6, gy = m.y - 6; block({ kind: 'monument', gx, gy, w: W, h: H, height: 90, wall: 0xe8e0cc, roof: 0xd8c070, variant: 2 });
      for (let y = m.y - m.isle; y <= m.y + m.isle; y++) for (let x = m.x - m.isle; x <= m.x + m.isle; x++) if (inb(x, y) && map[y][x] === 'grass' && Math.hypot(x - m.x, y - m.y) < m.isle - 1.5) map[y][x] = 'plaza';
      landmarkDoor['Lumenhal'] = { x: m.x + 1.6, y: gy + H + 1.4 };
      pois.push({ name: 'Pináculo de Marfim', x: m.x, y: gy + H + 2, biome: 'enchanted' });
      // a ponte longa: da margem norte (onde chega a estrada de Lumenhal) até a ilha
      const shoreY = m.y - m.R - 1.5; { const b = { ax: m.x + 0.5, ay: shoreY, bx: m.x + 0.5, by: m.y - m.isle + 0.8, hA: 0, hB: 0, stone: true, half: 2.2, hump: 1.6 }; b.hA = groundH(b.ax * T, b.ay * T); b.hB = groundH(b.bx * T, b.by * T); bridges.push(b); }
      for (let y = Math.floor(shoreY) - 6; y <= Math.floor(shoreY) + 1; y++) for (const ox of [-1, 0, 1]) if (inb(m.x + ox, y) && map[y][m.x + ox] === 'grass') map[y][m.x + ox] = 'road';
      { const v = settlements.find((q) => q.name === 'Lumenhal'); if (v) road([[v.x, v.y + 3], [m.x + 0.5, shoreY - 5]], 1.1, 0.3); }
      // pontes de pedra até as duas ilhotas grandes (leste e oeste)
      for (const [ix, iy, ir] of m.islets.slice(0, 2)) { const dir = Math.sign(ix); const b = { ax: m.x + dir * (m.isle - 0.6) + 0.5, ay: m.y + iy * 0.35 + 0.5, bx: m.x + ix - dir * (ir - 0.8) + 0.5, by: m.y + iy + 0.5, hA: 0, hB: 0, stone: true, half: 1.4, hump: 1.0 }; b.hA = groundH(b.ax * T, b.ay * T); b.hB = groundH(b.bx * T, b.by * T); bridges.push(b); }
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
    { const o = MONU.odin, s0 = site('Jarlsheim', o.x, o.y - 1, 22, 18, 3, 'Fortaleza de Odin', 'snow', o.R + 2); const pts = spiral(o.x, o.y, o.R, o.top, Math.PI * 0.5, 0.8); if (s0.vv) road([[s0.vv.x, s0.vv.y - 3], pts[0]], 1.1, 0.3);
      scatter(o.x, o.y, o.top + 2, o.R + 5, 50, (x, y, k) => { if (k % 3 === 0) props.push({ kind: 'totem', gx: x, gy: y, w: 1, h: 1, height: 2.6, wall: 0, roof: 0, variant: 1 }); else { props.push({ kind: 'tree', gx: x, gy: y, w: 1, h: 1, height: 5 + rnd() * 3, wall: 0x4a3220, roof: 0x2a4a3a, variant: 2 }); map[y][x] = 'tree'; } }); }
    { const o = MONU.aurora, s0 = site('Austrvik', o.x, o.y - 1, 20, 18, 4, 'Abadia da Aurora', 'meadow', o.R + 2); const pts = spiral(o.x, o.y, o.R, o.top, Math.PI * 0.5, 0.6); if (s0.vv) road([[s0.vv.x, s0.vv.y - 3], pts[0]], 1.1, 0.3);
      scatter(o.x, o.y, o.top + 1, o.R + 4, 46, (x, y, k) => { if (k % 4 === 0) props.push({ kind: 'angel', gx: x, gy: y, w: 1, h: 1, height: 2.6, wall: 0xe8e0cc, roof: 0xd8b860, variant: 0 }); else { props.push({ kind: 'tree', gx: x, gy: y, w: 1, h: 1, height: 5 + rnd() * 2, wall: 0x6a4a2a, roof: 0xf8e8a0, variant: 0, style: 2 }); map[y][x] = 'tree'; } }); }
    { const o = MONU.prata, s0 = site('Sudrholt', o.x, o.y, 20, 20, 5, 'Bastião de Prata', 'ruins', o.moat + 4);
      for (let yy = o.y - 20; yy <= o.y + 20; yy++) for (let xx = o.x - 20; xx <= o.x + 20; xx++) if (inb(xx, yy) && map[yy][xx] !== 'wall' && moatSD(xx + 0.5, yy + 0.5) < 0) map[yy][xx] = 'water';
      { const b = { ax: o.x + 0.5, ay: o.y + o.moat - o.moatW - 1.2, bx: o.x + 0.5, by: o.y + o.moat + o.moatW + 1.6, hA: 0, hB: 0, stone: true, half: 2.0, hump: 0.6 }; b.hA = groundH(b.ax * T, b.ay * T); b.hB = groundH(b.bx * T, b.by * T); bridges.push(b); }
      for (let yy = o.y + 10; yy <= o.y + o.moat + 5; yy++) for (const ox of [-1, 0, 1]) if (inb(o.x + ox, yy) && map[yy][o.x + ox] === 'grass') map[yy][o.x + ox] = 'road';
      if (s0.vv) road([[s0.vv.x, s0.vv.y - 3], [o.x + 0.5, o.y + o.moat + 5]], 1.1, 0.3);
      scatter(o.x, o.y, o.moat + 3, o.moat + 10, 28, (x, y, k) => { props.push(k % 3 ? { kind: 'grave', gx: x, gy: y, w: 1, h: 1, height: 1.2, wall: 0x9a9aa0, roof: 0, variant: Math.floor(rnd() * 3) } : { kind: 'torch', gx: x, gy: y, w: 1, h: 1, height: 2.4, wall: 0x8a8e94, roof: 0xd8e8ff }); }); }
    { const o = MONU.desgraca, s0 = site('Gorvath', o.x, o.y, 20, 20, 6, 'Vale da Desgraça', 'blight', o.R + 2); const pts: [number, number][] = [[o.x + 0.5, o.y + o.R + 6], [o.x + 0.5, o.y + 11]]; road(pts, 1.25, 0); /* entra pela brecha do sul da crista */ if (s0.vv) road([[s0.vv.x, s0.vv.y - 3], pts[0]], 1.1, 0.3);
      scatter(o.x, o.y, o.top, o.R + 6, 70, (x, y, k) => { const q = k % 5; if (q === 0) props.push({ kind: 'totem', gx: x, gy: y, w: 1, h: 1, height: 3.6, wall: 0, roof: 0, variant: 2 }); else if (q === 1) props.push({ kind: 'fogpatch', gx: x, gy: y, w: 1, h: 1, height: 1, wall: 0x3a2a4a, roof: 0x9a5ad0, variant: 0 }); else if (q === 2) props.push({ kind: 'bones', gx: x, gy: y, w: 1, h: 1, height: 0.4, wall: 0xd8d0b8, roof: 0, variant: Math.floor(rnd() * 3) }); else { props.push({ kind: 'tree', gx: x, gy: y, w: 1, h: 1, height: 4 + rnd() * 4, wall: 0x2a2226, roof: 0x3a2a40, variant: 1 }); map[y][x] = 'tree'; } }); }
    { const o = MONU.uivo, s0 = site('Uivo Antigo', o.x, o.y, 18, 18, 7, 'Árvore-Mãe do Uivo', 'jungle', 16); if (s0.vv) road([[s0.vv.x, s0.vv.y - 3], [o.x + 0.5, s0.gy + 18 + 2]], 1.1, 0.3);
      scatter(o.x, o.y, 11, 20, 40, (x, y, k) => { if (k % 3 === 0) props.push({ kind: 'totem', gx: x, gy: y, w: 1, h: 1, height: 3.8, wall: 0, roof: 0, variant: 0 }); else { props.push({ kind: 'tree', gx: x, gy: y, w: 1, h: 1, height: 6 + rnd() * 3, wall: 0x4a3220, roof: 0x2a4a2a, variant: 0 }); map[y][x] = 'tree'; } }); }
  }
  /* relíquias dos caminhantes (pedras de viagem): só onde se precisa ir — na saída de cada cidade e vila, à beira da estrada,
     nos acampamentos e covis (pontos de caça e de missão) e no coração de cada região de caça. Nunca no meio do nada:
     a pedra fica do lado de uma estrada ou de um ponto conhecido, e duas pedras não ficam a menos de 22 casas uma da outra. */
  {
    const okT = (x: number, y: number) => inb(x, y) && map[y][x] === 'grass' && map[y + 1]?.[x] === 'grass' && map[y]?.[x + 1] === 'grass' && !props.some((q) => q.gx === x && q.gy === y);
    const nearRoad = (x: number, y: number, r: number) => { for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (map[y + dy]?.[x + dx] === 'road') return true; return false; };
    const place = (name: string, x0: number, y0: number, wantRoad: boolean, minGap = 22) => {
      if (relics.some((q) => Math.hypot(q.x - x0, q.y - y0) < minGap)) return false;
      for (let r = 1; r < 14; r++) for (let k = 0; k < r * 8; k++) { const a = (k / (r * 8)) * 6.283, x = Math.round(x0 + Math.cos(a) * r), y = Math.round(y0 + Math.sin(a) * r);
        if (!okT(x, y) || (wantRoad && !nearRoad(x, y, 2)) || nearRoad(x, y, 0)) continue;
        if (settlements.some((t) => t.kind === 'city' && Math.abs(t.x - x) <= t.radius + 4 && Math.abs(t.y - y) <= t.radius + 4)) continue; // fora da muralha
        block({ kind: 'relic', gx: x, gy: y, w: 1, h: 1, height: 2.6, wall: 0x6a6a72, roof: 0x4a9aff }); relics.push({ name, x, y }); return true; }
      return false; };
    /** a saída de um assentamento: o primeiro trecho de estrada logo fora dele (de preferência ao sul, de frente para a câmera) */
    const exitOf = (t: Settlement): [number, number] => { const R = t.kind === 'city' ? t.radius + 3 : t.radius; let best: [number, number] | null = null, bs = 1e9;
      for (let dy = -R - 4; dy <= R + 4; dy++) for (let dx = -R - 4; dx <= R + 4; dx++) { const x = t.x + dx, y = t.y + dy, d = Math.max(Math.abs(dx), Math.abs(dy)); if (d < R + 2 || d > R + 4 || map[y]?.[x] !== 'road') continue; const sc = -dy * 2 + Math.abs(dx) * 0.2; if (sc < bs) { bs = sc; best = [x, y]; } }
      return best ?? [t.x, t.y + R + 3]; };
    const kar = settlements.find((t) => t.name === 'Karmika'); if (kar) { const [x, y] = exitOf(kar); place('Relíquia de Karmika', x, y, true, 0); }
    for (const t of settlements) if (t.name !== 'Karmika') { const [x, y] = exitOf(t); place(`Relíquia de ${t.name}`, x, y, true, 14); }
    for (const pn of ['Acampamento Draugr', 'Covil dos Lobos', 'Atoleiro de Zerath', 'Cume Gelado', 'Garganta de Pedra', 'Cemitério Esquecido', 'Igreja Abandonada', 'Clareira dos Gritos']) { const q = pois.find((v) => v.name === pn); if (q) place(`Relíquia: ${pn}`, q.x, q.y + 5, false); }
    for (const rg of REGIONS) place(`Relíquia: ${rg.name}`, Math.round(rg.x), Math.round(rg.y), true) || place(`Relíquia: ${rg.name}`, Math.round(rg.x), Math.round(rg.y), false);
  }
  /* ervas (herborismo): não bloqueiam o caminho; gerador próprio para não mexer no resto do mundo.
     0 Folha-de-Prata (campos e matas) · 1 Cogumelo-Lamparina (pântano e mata fechada) · 2 Raiz-Sangue (pântano, ruínas, rocha) · 3 Flor-de-Marghar (rara, perto das relíquias) */
  { const rh = rng(31337); const HD: Record<Biome, number> = { meadow: 0.014, forest: 0.016, swamp: 0.022, snow: 0.004, ruins: 0.012, rock: 0.008, volcanic: 0.003, enchanted: 0.03, blight: 0.012, jungle: 0.02, coast: 0.006 };
    for (let y = 2; y < MAP_H - 2; y++) for (let x = 2; x < MAP_W - 2; x++) {
      const v = rh(), w = rh(); if (map[y][x] !== 'grass') continue; const bm = biome[y][x];
      const nearRelic = relics.some((q) => Math.abs(q.x - x) < 9 && Math.abs(q.y - y) < 9);
      if (v > HD[bm] * (nearRelic ? 2.5 : 0.3)) continue; // soltas são raras (achado): o grosso nasce em canteiros, logo abaixo if (nearSettle(x, y, 1)) continue;
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
    for (let y = 2; y < MAP_H - 2; y++) for (let x = 2; x < MAP_W - 2; x++) if (wet(x, y) && rj() < 0.012) patch(x, y, 4, 3 + Math.floor(rj() * 4), 2.2, wet);
    // canteiros de flores e de folha-de-prata pelos prados e matas (poucos e cheios)
    const PB: Partial<Record<Biome, number>> = { meadow: 0.0016, forest: 0.0007, enchanted: 0.003, coast: 0.0006, jungle: 0.0008 };
    for (let y = 2; y < MAP_H - 2; y++) for (let x = 2; x < MAP_W - 2; x++) { const pb = PB[biome[y][x]]; if (!pb || map[y][x] !== 'grass' || rj() > pb) continue; patch(x, y, rj() < 0.65 ? 5 : 0, 4 + Math.floor(rj() * 5), 1.8, isGrass); }
    // em volta de cada povoado, dois ou três canteiros perto da estrada (quem começa acha logo o que colher)
    for (const t of settlements) { const n = 2 + Math.floor(rj() * 2); for (let k = 0; k < n; k++) { const a = rj() * 6.283, d = t.radius + 5 + rj() * 10; patch(Math.round(t.x + Math.cos(a) * d), Math.round(t.y + Math.sin(a) * d), k === 0 ? 0 : 5, 5 + Math.floor(rj() * 4), 1.8, isGrass); } }
  }
  for (const sp of spawns) { const rg = regionAt(sp.x, sp.y), k = RANK[sp.type] ?? 0.5; sp.lvl = sp.fixLvl ?? Math.max(rg.lo, Math.min(rg.hi, Math.round(rg.lo + k * (rg.hi - rg.lo)))); }
  { /* mestres dos caminhos (a Vidente de Askavik manda o jogador até eles no nível 30) */
    const M: [string, string, string, 'nordic' | 'dwarf' | 'technocrat', number, string[]][] = [
      ['Jarlsheim', 'Thorgrim Mão-de-Ferro', 'Mestre de Armas do Clã do Corvo', 'nordic', 0x6a4a3a, ['A Fortaleza de Odin não recebe turistas. Recebe guerreiros.', 'Mostre-me as mãos. Calo de machado não se finge.']],
      ['Austrvik', 'Grão-Mestre Cassius', 'Grão-Mestre da Ordem de Auréon', 'nordic', 0xe8d8a8, ['A Abadia da Aurora acende a vela antes do sol. Sempre antes.', 'Auréon não pede que você seja puro. Pede que você fique.']],
      ['Sudrholt', 'Mestra Ilsa Van Rhal', 'Líder do Clã Helsing', 'nordic', 0x4a4a52, ['Prata, estaca e paciência. O resto se aprende sangrando.', 'O Bastião de Prata nunca dormiu uma noite inteira.']],
      ['Corvoscuro', 'Conde Vladislav III', 'Senhor da Colina Vampírica', 'nordic', 0x5a1a22, ['Entre. Ou não. A porta sempre esteve aberta para quem tem sede.', 'O tempo é o único tesouro. Eu tenho de sobra.']],
      ['Uivo Antigo', 'Ulfrun, a Mãe-Alfa', 'Mãe-Alfa do Uivo Antigo', 'nordic', 0x7a6a50, ['A matilha sentiu o seu cheiro três vilas atrás.', 'A lua não pergunta se você quer. Ela chama.']],
      ['Lumenhal', 'Arquimago Aurelian Vesk', 'Arquimago do Pináculo de Marfim', 'technocrat', 0x8a9ad8, ['O Pináculo vê longe. Viu você chegando.', 'Magia é paciência com fórmula.']],
      ['Gorvath', 'Malgrath, Senhor dos Pactos', 'Senhor dos Pactos do Vale', 'nordic', 0x3a2a4a, ['Todo poder tem preço. O meu é justo. Quase sempre.', 'Leia o contrato. Ninguém lê o contrato.']],
    ];
    for (const [vn, nm, role, kind, tint, lines] of M) { const t = settlements.find((q) => q.name === vn), ld = landmarkDoor[vn]; if (t) t.npcs.push({ name: nm, role, kind, x: ld ? ld.x : t.x - 4.5, y: ld ? ld.y : t.y + 1.5, radius: 2, tint, scale: 1.05, lines }); }
    /* a Companhia das Caravanas de Latão e a Corte (24/10): quem liga paladino, vampiro e tecnocrata */
    { const ex = (vn: string, n: NpcSpec) => { const t = settlements.find((q) => q.name === vn); if (t) t.npcs.push(n); };
      ex('Askavik', { name: 'Feitora Brunna', role: 'Companhia das Caravanas de Latão', kind: 'technocrat', x: ASKAVIK.x + 3.5, y: ASKAVIK.y + 59, radius: 1.5, tint: 0x8a3a24, scale: 1.0, shop: 'latao', lines: ['A Companhia leva qualquer coisa a qualquer lugar. O preço é o caminho.', 'As carroças saem daqui e do portão leste. Escolta boa vale ouro.', 'Engrenagem para a Catedral, relógio para o Conde. Não me pergunte o que eu acho disso.'] });
      ex('Corvoscuro', { name: 'Lady Mirela', role: 'Emissária da Corte de Vladislav', kind: 'nordic', x: 724 + 3, y: 262 + 2.5, radius: 1.2, tint: 0x6a1424, scale: 1.0, night: true, lines: ['A Corte recebe à meia-noite. Nem antes, nem depois.', 'O Conde não sobe a colina para ninguém. Quem sobe é quem merece.', 'Sede é natural. Falta de modos, não.'] });
      ex('Porto Caldeira', { name: 'Mestre Orvald', role: 'Mestre-Caravaneiro da Companhia', kind: 'dwarf', x: 430 + 2.5, y: 772 - 2, radius: 1.5, tint: 0x7a4a2a, scale: 1.0, lines: ['Cada carroça que sai deste porto leva o nome da Companhia. E o meu.', 'Vapor, graxa e contas certas. O resto é conversa.'] });
      /* as missões do instinto da raça (24/10) */
      ex('Skógar', { name: 'Marta, a Moleira', role: 'Moleira de Skógar', kind: 'nordic', x: 128 + SH + 2.5, y: 262 + SH - 2, radius: 1.5, tint: 0x9a7a5a, scale: 0.95, lines: ['O moinho não para. Nem quando o coração para.', 'A minha Nina conhece cada pedra desta mata.'] });
      ex('Lithendel', { name: 'Anciã Faelwen', role: 'Anciã de Lithendel', kind: 'nordic', x: 84 - 2.5, y: 404 + 2, radius: 1.2, tint: 0x5a8a6a, scale: 1.0, lines: ['As árvores daqui eram velhas quando os reis dos homens eram crianças.', 'A mata fala. Pouca gente escuta.'] });
      ex('Brasaforja', { name: 'Mestre-Forjador Brokki', role: 'Mestre da Forja de Elite', kind: 'dwarf', x: 560 - 3.5, y: 186 + 2.5, radius: 1.2, tint: 0x8a3a1a, scale: 1.05, lines: ['Ferro qualquer um bate. Presa de alfa, só eu.', 'Me traga o que os bichos grandes deixam, e eu te faço o que nenhuma loja vende.'] });
      ex('Brasaforja', { name: 'Mestre-Mineiro Dvalin', role: 'Mestre das Galerias', kind: 'dwarf', x: 560 + 3, y: 186 + 2.5, radius: 1.5, tint: 0x6a4a2a, scale: 1.0, lines: ['Pedra boa canta quando você bate. Pedra ruim chora.', 'Meu avô dizia: escute a montanha antes de cavar nela.'] });
      ex('Austrvik', { name: 'Irmão Tobias', role: 'Sineiro da Abadia da Aurora', kind: 'nordic', x: 392 + SH - 2, y: 292 + SH + 2.5, radius: 1.5, tint: 0xd8c89a, scale: 0.95, lines: ['Os sinos da Abadia eram de bronze. Agora são de engrenagem. Funcionam melhor, quando funcionam.', 'Toco antes do sol. Sempre antes.'] }); }
    /* a campanha que viaja (25/10): uma pessoa nova em cada vila do roteiro do Caminho do Norte (campanha.ts) */
    for (const c of CAMPAIGN_NPCS) { const t = settlements.find((q) => q.name === c.vila); if (t) t.npcs.push({ name: c.name, role: c.role, kind: 'nordic', x: t.x + c.dx, y: t.y + c.dy, radius: 1.5, tint: c.tint, scale: 1.0, lines: c.lines }); }
    const ak = settlements.find((q) => q.kind === 'city'); if (ak) { /* Hrefna e o santuário da Deusa dos Caminhos: pedras de pé em roda, no lado oeste da praça */
      const hx = ak.x - 12, hy = ak.y + 12; ak.npcs.push({ name: 'Hrefna', role: 'Vidente dos Caminhos', kind: 'nordic', x: hx + 0.5, y: hy + 0.5, radius: 2.5, tint: 0x6a4a8a, scale: 1.0, lines: ['A Deusa dos Caminhos não escolhe por ninguém. Mas ela vê.', 'Volte quando o seu caminho pesar. No nível 30 eu leio você.'] });
      for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2 + 0.3, gx = Math.round(hx + Math.cos(a) * 3.2), gy = Math.round(hy + Math.sin(a) * 3.2); if (inb(gx, gy) && map[gy][gx] !== 'water') props.push({ kind: 'obelisk', gx, gy, w: 1, h: 1, height: 2.2, wall: 0x6a6a78, roof: 0x9b6ad0, variant: k % 3 }); }
      pois.push({ name: 'Santuário dos Caminhos', x: hx, y: hy, biome: 'meadow' }); } }
  const hubX = (t: Settlement) => t.kind === 'city' ? t.x - 37 : t.x; // na cidade, o centro de serviços é a Praça do Mercado (o centro é a catedral)
  { /* caixa de correio em cada povoado: no primeiro chão livre perto do centro */
    const taken = new Set<number>(); for (const p of props) for (let y = p.gy - 1; y <= p.gy + p.h; y++) for (let x = p.gx - 1; x <= p.gx + p.w; x++) taken.add(y * 100000 + x);
    for (const t of settlements) { let ok = false;
      for (let r = 2; r <= 9 && !ok; r++) for (let a = 0; a < 16 && !ok; a++) { const gx = Math.round(hubX(t) + Math.cos(a * 0.3927 + 0.6) * r), gy = Math.round(t.y + Math.sin(a * 0.3927 + 0.6) * r);
        if (!inb(gx, gy) || taken.has(gy * 100000 + gx) || !['grass', 'plaza', 'dirt'].includes(map[gy][gx] as string)) continue;
        props.push({ kind: 'mailbox', gx, gy, w: 1, h: 1, height: 1.6, wall: 0x3a3f46, roof: 0x8a6a3a, variant: 0 }); taken.add(gy * 100000 + gx); ok = true; }
      /* o Baú do Caminhante: ao lado do correio, o mesmo baú em todo povoado */
      let okv = false; for (let r = 2; r <= 9 && !okv; r++) for (let a = 0; a < 16 && !okv; a++) { const ang = (a % 2 ? 1 : -1) * Math.ceil(a / 2) * 0.3927 + 0.6 + Math.PI, gx = Math.round(hubX(t) + Math.cos(ang) * r), gy = Math.round(t.y + Math.sin(ang) * r); /* do outro lado do centro, de frente para o correio */
        if (!inb(gx, gy) || taken.has(gy * 100000 + gx) || !['grass', 'plaza', 'dirt'].includes(map[gy][gx] as string)) continue;
        props.push({ kind: 'vault', gx, gy, w: 1, h: 1, height: 1.2, wall: 0x4a3020, roof: 0xb08a40, variant: 0 }); for (let y = gy - 1; y <= gy + 1; y++) for (let x = gx - 1; x <= gx + 1; x++) taken.add(y * 100000 + x); okv = true; } }
    /* pontos de trabalho (bancada de corte, forja, curtidor, laboratório, cozinha): um de cada em todo povoado, em volta da praça, de frente para o centro */
    for (const t of settlements) { const placed: number[] = [];
      for (let v = 0; v < 5; v++) { let ok = false;
        for (let r = 6; r <= 16 && !ok; r++) for (let a = 0; a < 24 && !ok; a++) { const ang = a * 0.2618 + v * 1.2566 + 0.3, gx = Math.round(hubX(t) + Math.cos(ang) * r) - 1, gy = Math.round(t.y + Math.sin(ang) * r) - 1;
          let free = true; for (let y = gy - 1; y <= gy + 2 && free; y++) for (let x = gx - 1; x <= gx + 2 && free; x++) if (!inb(x, y) || taken.has(y * 100000 + x) || !['grass', 'plaza', 'dirt'].includes(map[y][x] as string)) free = false;
          if (!free) continue;
          const cx = gx + 1, cy = gy + 1; props.push({ kind: 'station', gx, gy, w: 2, h: 2, height: 2.6, wall: 0x6a4a2a, roof: 0x6a4a2a, variant: v, ry: Math.atan2(hubX(t) - cx, t.y - cy) });
          for (let y = gy - 1; y <= gy + 2; y++) for (let x = gx - 1; x <= gx + 2; x++) taken.add(y * 100000 + x); placed.push(v); ok = true; } } } }
  /* a Casa dos Ofícios: num lugar livre perto da Praça do Mercado de Askavik, um salão aberto de 14×10 com as cinco bancadas lá dentro */
  let craftHall: { x: number; y: number; w: number; h: number; ry: number } | undefined;
  { const ak = settlements.find((q) => q.kind === 'city'); if (ak) { const cx0 = hubX(ak), cy0 = ak.y;
      const SOFT = new Set(['tree', 'rock', 'herb', 'bush', 'flower', 'grass', 'stump', 'bones', 'bench', 'barrel', 'crate', 'lamp', 'torch']); /* árvore e pedra solta saem para o salão entrar */
      const busy = new Set<number>(); for (const p of props) { if (SOFT.has(p.kind as string)) continue; for (let y = p.gy - 1; y <= p.gy + p.h; y++) for (let x = p.gx - 1; x <= p.gx + p.w; x++) busy.add(y * 100000 + x); }
      const okT = (x: number, y: number) => inb(x, y) && !busy.has(y * 100000 + x) && ['grass', 'plaza', 'dirt', 'road', 'tree'].includes(map[y][x] as string);
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
        for (let y = gy; y < gy + H; y++) for (let x = gx; x < gx + W; x++) map[y][x] = 'plaza' as never; /* (tile 'tree' também vira piso) */
        /* as cinco bancadas de verdade (as mesmas das vilas: funcionam para craft), em fileira, de frente para o corredor */
        for (let v = 0; v < 5; v++) { const sx = gx + 0.5 + v * 2.3, sy = v % 2 ? gy + 5 : gy + 1; props.push({ kind: 'station', gx: Math.round(sx), gy: sy, w: 2, h: 2, height: 2.6, wall: 0x6a4a2a, roof: 0x6a4a2a, variant: v, ry: v % 2 ? Math.PI : 0 }); }
        pois.push({ name: 'Casa dos Ofícios', x: gx + W / 2, y: gy + H + 1, biome: 'meadow' });
        break search; } } }
  { /* elites longe das vilas: nenhum elite nasce a menos de 30 blocos de um povoado (45 dos berços), a não ser os de lugar marcado (nível fixo) */
    const CRADLE = new Set(['Karmika', 'Brasaforja', 'Lithendel']), ELT = new Set<EnemyType>(['prince', 'tormentor', 'treant', 'werewolf']);
    for (let i = spawns.length - 1; i >= 0; i--) { const sp = spawns[i]; if (!ELT.has(sp.type) || sp.fixLvl) continue;
      if (settlements.some((t) => Math.hypot(t.x - sp.x, t.y - sp.y) < (CRADLE.has(t.name) ? 45 : 30))) spawns.splice(i, 1); } }
  const stOf = (nm: string) => { const st = settlements.find((q) => q.name === nm)!; return { x: st.x + 0.5, y: st.y + 3.5, name: nm }; };
  rampartsRef = ramparts;
  return { map, biome, props, craftHall, spawn: { x: 69.5 + OFX, y: 75.5 + OFY }, pois, spawns, bridges, signs, settlements, relics, ramparts, roadPaths, roadLinks, starts: { human: { x: 69.5 + OFX, y: 75.5 + OFY, name: 'Karmika' }, dwarf: stOf('Brasaforja'), elf: stOf('Lithendel') } };
}
/** veio de minério de uma rocha (fixo pela posição): 0 nenhum, 1 ferro, 2 prata */
export function veinOf(p: { gx: number; gy: number; w: number }) { const h = Math.abs(Math.sin(p.gx * 127.1 + p.gy * 311.7) * 43758.5453) % 1; return h < (p.w > 1 ? 0.07 : 0.035) ? 2 : h < (p.w > 1 ? 0.3 : 0.16) ? 1 : 0; }
