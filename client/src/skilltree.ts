/** Árvore Kármica de magias: 1 ponto por nível, caminhos que abrem magias, até 10 pontos por magia (Bronze 3, Prata 6, Ouro 10).
 *  Cada ponto deixa a magia mais forte, longa e larga; a cada 5 pontos ela sobe de "tier" e muda a apresentação. */
import type { KitKey } from './kits';
type Race = KitKey;
import { KITS, type SkillDef, type SkillId, resOf, keyOf } from './kits';

export const MAX_RANK = 10, PER_LEVEL = 1, REQ_RANK = 2; // 1 ponto por nível; ranque 10 no máximo (limitado também pelo nível)
export interface Node { id: SkillId; col: number; row: number; req: [SkillId, number][] }
/** caminhos por personagem: coluna = profundidade; req = pais e pontos mínimos neles */
export const TREES: Partial<Record<Race, Node[]>> = {
  nordic: [ // quatro escolas em linhas: Lâmina, Escudo, Runas do Inverno, Valhalla
    { id: 'combo', col: 0, row: 1.5, req: [] },
    { id: 'bash', col: 1, row: 0, req: [['combo', 1]] }, { id: 'guard', col: 1, row: 1, req: [['combo', 1]] },
    { id: 'hamstring', col: 2, row: 0, req: [['bash', REQ_RANK]] }, { id: 'kick', col: 2, row: 1, req: [['guard', REQ_RANK]] }, { id: 'slam', col: 2, row: 2, req: [['bash', REQ_RANK]] }, { id: 'heal', col: 2, row: 3, req: [['guard', REQ_RANK]] },
    { id: 'hatchet', col: 3, row: 0, req: [['hamstring', REQ_RANK]] }, { id: 'shieldwall', col: 3, row: 1, req: [['kick', REQ_RANK]] }, { id: 'winter', col: 3, row: 2, req: [['slam', REQ_RANK]] }, { id: 'warcry', col: 3, row: 3, req: [['heal', REQ_RANK]] },
    { id: 'valkyrie', col: 4, row: 1, req: [['shieldwall', REQ_RANK]] }, { id: 'thunder', col: 4, row: 2, req: [['winter', REQ_RANK]] }, { id: 'spear', col: 4, row: 3, req: [['warcry', REQ_RANK]] },
    { id: 'whirl', col: 5, row: 0, req: [['hatchet', REQ_RANK]] }, { id: 'mark', col: 5, row: 3, req: [['spear', REQ_RANK]] },
    { id: 'fenrir', col: 6, row: 1.5, req: [['whirl', 5], ['mark', 5]] },
  ],
  human: [ // três escolas em linhas: Armas do Povo, Defesa, Comunidade; no fim, a Teimosia Humana
    { id: 'combo', col: 0, row: 1, req: [] },
    { id: 'bash', col: 1, row: 0, req: [['combo', 1]] }, { id: 'guard', col: 1, row: 1, req: [['combo', 1]] }, { id: 'heal', col: 1, row: 2, req: [['combo', 1]] },
    { id: 'hatchet', col: 2, row: 0, req: [['bash', REQ_RANK]] }, { id: 'kick', col: 2, row: 1, req: [['guard', REQ_RANK]] }, { id: 'warcry', col: 2, row: 2, req: [['heal', REQ_RANK]] },
    { id: 'hamstring', col: 3, row: 0, req: [['hatchet', REQ_RANK]] }, { id: 'shieldwall', col: 3, row: 1, req: [['kick', REQ_RANK]] }, { id: 'spear', col: 3, row: 2, req: [['warcry', REQ_RANK]] },
    { id: 'whirl', col: 4, row: 0, req: [['hamstring', REQ_RANK]] }, { id: 'valkyrie', col: 4, row: 1, req: [['shieldwall', REQ_RANK]] }, { id: 'mark', col: 4, row: 2, req: [['spear', REQ_RANK]] },
    { id: 'fenrir', col: 5, row: 1, req: [['whirl', 5], ['mark', 5]] },
  ],
  dwarf: [
    { id: 'combo', col: 0, row: 1, req: [] },
    { id: 'guard', col: 1, row: 0, req: [['combo', 1]] }, { id: 'bash', col: 1, row: 2, req: [['combo', 1]] },
    { id: 'heal', col: 2, row: 0, req: [['guard', REQ_RANK]] }, { id: 'slam', col: 2, row: 2, req: [['bash', REQ_RANK]] },
    { id: 'stonerune', col: 3, row: 0, req: [['heal', REQ_RANK]] }, { id: 'hammerthrow', col: 3, row: 2, req: [['slam', REQ_RANK]] },
    { id: 'mountain', col: 4, row: 0, req: [['stonerune', REQ_RANK]] }, { id: 'forge', col: 4, row: 2, req: [['hammerthrow', REQ_RANK]] },
    { id: 'avatar', col: 5, row: 1, req: [['mountain', 5], ['forge', 5]] },
  ],
  pal: [ // Paladino: Vingança (dano sagrado), Bastião (escudo), Graça (cura e luz); no fim, as Asas da Vingança
    { id: 'combo', col: 0, row: 1, req: [] },
    { id: 'bash', col: 1, row: 0, req: [['combo', 1]] }, { id: 'guard', col: 1, row: 1, req: [['combo', 1]] }, { id: 'heal', col: 1, row: 2, req: [['combo', 1]] },
    { id: 'smite', col: 2, row: 0, req: [['bash', REQ_RANK]] }, { id: 'kick', col: 2, row: 1, req: [['guard', REQ_RANK]] }, { id: 'consecrate', col: 2, row: 2, req: [['heal', REQ_RANK]] },
    { id: 'mark', col: 3, row: 0, req: [['smite', REQ_RANK]] }, { id: 'shieldwall', col: 3, row: 1, req: [['kick', REQ_RANK]] }, { id: 'warcry', col: 3, row: 2, req: [['consecrate', REQ_RANK]] },
    { id: 'valkyrie', col: 4, row: 1, req: [['shieldwall', REQ_RANK]] },
    { id: 'avenging', col: 5, row: 1, req: [['mark', 5], ['valkyrie', 5], ['warcry', 5]] },
  ],
  vam: [ // Vampiro: Lâmina (velocidade), Sangue (roubo de vida), Noite (morcegos); no fim, a Forma do Conde
    { id: 'combo', col: 0, row: 1, req: [] },
    { id: 'bash', col: 1, row: 0, req: [['combo', 1]] }, { id: 'drain', col: 1, row: 1, req: [['combo', 1]] }, { id: 'guard', col: 1, row: 2, req: [['combo', 1]] },
    { id: 'hamstring', col: 2, row: 0, req: [['bash', REQ_RANK]] }, { id: 'bloodnova', col: 2, row: 1, req: [['drain', REQ_RANK]] }, { id: 'batswarm', col: 2, row: 2, req: [['guard', REQ_RANK]] },
    { id: 'whirl', col: 3, row: 0, req: [['hamstring', REQ_RANK]] }, { id: 'mark', col: 3, row: 1, req: [['bloodnova', REQ_RANK]] }, { id: 'valkyrie', col: 3, row: 2, req: [['batswarm', REQ_RANK]] },
    { id: 'nightform', col: 4, row: 1, req: [['whirl', 5], ['mark', 5], ['valkyrie', 5]] },
  ],
  lob: [ // Lobisomem: Garra (dano), Pele (tanque), Lua (uivo e cura); no fim, a Forma da Besta
    { id: 'combo', col: 0, row: 1, req: [] },
    { id: 'rend', col: 1, row: 0, req: [['combo', 1]] }, { id: 'guard', col: 1, row: 1, req: [['combo', 1]] }, { id: 'howl', col: 1, row: 2, req: [['combo', 1]] },
    { id: 'hamstring', col: 2, row: 0, req: [['rend', REQ_RANK]] }, { id: 'bash', col: 2, row: 1, req: [['guard', REQ_RANK]] }, { id: 'heal', col: 2, row: 2, req: [['howl', REQ_RANK]] },
    { id: 'whirl', col: 3, row: 0, req: [['hamstring', REQ_RANK]] }, { id: 'kick', col: 3, row: 1, req: [['bash', REQ_RANK]] }, { id: 'mark', col: 3, row: 2, req: [['heal', REQ_RANK]] },
    { id: 'fenrir', col: 4, row: 1, req: [['whirl', 5], ['kick', 5], ['mark', 5]] },
  ],
  tecno: [ // Tecnocrata formado: Engenharia de Campo (choque), Suporte (drone, minas), Química (fogo e ácido); no fim, o exoesqueleto
    { id: 'combo', col: 0, row: 1, req: [] },
    { id: 'thunder', col: 1, row: 0, req: [['combo', 1]] }, { id: 'guard', col: 1, row: 1, req: [['combo', 1]] }, { id: 'shocktrap', col: 1, row: 2, req: [['combo', 1]] },
    { id: 'kick', col: 2, row: 0, req: [['thunder', REQ_RANK]] }, { id: 'medic', col: 2, row: 1, req: [['guard', REQ_RANK]] }, { id: 'flame', col: 2, row: 2, req: [['shocktrap', REQ_RANK]] },
    { id: 'mark', col: 3, row: 0, req: [['kick', REQ_RANK]] }, { id: 'railgun', col: 3, row: 1, req: [['medic', REQ_RANK]] }, { id: 'poison', col: 3, row: 2, req: [['flame', REQ_RANK]] },
    { id: 'mech', col: 4, row: 1, req: [['railgun', 5], ['mark', 5], ['poison', 5]] },
  ],
  technocrat: [
    { id: 'combo', col: 0, row: 1, req: [] },
    { id: 'guard', col: 1, row: 0, req: [['combo', 1]] }, { id: 'slam', col: 1, row: 2, req: [['combo', 1]] },
    { id: 'heal', col: 2, row: 0, req: [['guard', REQ_RANK]] }, { id: 'bash', col: 2, row: 2, req: [['slam', REQ_RANK]] },
    { id: 'shocktrap', col: 3, row: 0, req: [['heal', REQ_RANK]] }, { id: 'flame', col: 3, row: 2, req: [['bash', REQ_RANK]] },
    { id: 'railgun', col: 4, row: 0, req: [['shocktrap', REQ_RANK]] }, { id: 'poison', col: 4, row: 2, req: [['flame', REQ_RANK]] },
    { id: 'mech', col: 5, row: 1, req: [['railgun', 5], ['poison', 5]] },
  ],
};
/** ficha base de cada magia (valores no ponto 0): dano = multiplicador do golpe básico (~12), alcance/área em metros, tempos em s */
export interface Stat { dmg?: number; hits?: number; range?: number; area?: number; dur?: number; cast?: number; cd?: number; note?: string }
export const STATS: Record<string, Stat> = {
  'nordic:combo': { dmg: 1, hits: 4, range: 2.2, cast: 0.3, note: 'Emboscada após dash: +50%. Cada acerto dá 1 de Fúria.' },
  'nordic:guard': { dmg: 0.6, range: 7, area: 2, cd: 2.4, note: 'Segurando: bloqueia à frente. Contra-golpe (3) após bloquear: ×2,2.' },
  'nordic:bash': { dmg: 1.3, hits: 2, range: 7.5, area: 2, cd: 2.4, note: 'Corre cortando e termina com escudada que derruba.' },
  'nordic:slam': { dmg: 2.4, range: 11, area: 3.4, dur: 4, cd: 3.2, note: 'Estalactites retardam 4 s. Fúria: +30% por ponto.' },
  'nordic:heal': { dmg: 0, cast: 0.5, cd: 1.6, note: 'Cura 35 + 10 por Fúria; com Fúria, 3 críticos garantidos.' },
  'nordic:warcry': { dmg: 0, area: 6, dur: 8, cd: 14, note: '+25% de dano para você por 8 s.' },
  'nordic:spear': { dmg: 2.2, range: 14, cast: 0.44, cd: 7, note: 'Atravessa todos na linha; derruba.' },
  'nordic:whirl': { dmg: 1.3, hits: 4, area: 3.4, dur: 1.7, cd: 9, note: '4 cortes em círculo; o último derruba.' },
  'nordic:mark': { dmg: 1.5, range: 10, dur: 6, cd: 10, note: 'Alvo marcado recebe +50% e devolve 25% do dano como vida.' },
  'nordic:kick': { dmg: 0.75, range: 2.15, cast: 0.43, cd: 6, note: 'Atordoa 0,8 s e empurra; interrompe golpes e magias em preparo. Prata: derruba 1,5 s; Ouro: arco largo.' },
  'nordic:hamstring': { dmg: 1.15, range: 2.7, cast: 0.55, dur: 4, cd: 7, note: 'Arco baixo à frente; deixa lento. Bronze: sangra 3 s; Prata: lentidão ×1,5; Ouro: derruba quem já estava lento.' },
  'nordic:hatchet': { dmg: 1.35, range: 11, cast: 0.59, cd: 5, note: 'Bronze: ricocheteia 1×; Prata: duas machadinhas; Ouro: atravessa e volta para a mão.' },
  'nordic:shieldwall': { dmg: 0.6, area: 2, dur: 4, cast: 0.7, cd: 14, note: 'Barra golpes e magias vindos da frente e impede a passagem. Prata: mais larga e devolve 50%; Ouro: cura 2%/s atrás dela.' },
  'nordic:winter': { dmg: 0.95, range: 5.5, cast: 0.83, dur: 3, cd: 8, note: 'Cone gelado: lentidão. Bronze: neve no chão; Prata: congela 1 s; Ouro: congela 2 s e estilhaça.' },
  'nordic:thunder': { dmg: 0.7, hits: 3, dur: 10, cast: 0.5, cd: 12, note: 'Os próximos golpes eletrificam. Bronze: 4 cargas; Prata: o raio salta; Ouro: raio em área ao invocar.' },
  'nordic:valkyrie': { dmg: 1.6, hits: 2, area: 3.3, dur: 1.5, cd: 10, note: 'Se atingida na postura, anula o golpe e gira cortando em volta. Prata: atordoa; Ouro: devolve 50% do golpe.' },
  'nordic:fenrir': { dmg: 2, dur: 10, cd: 45, note: 'Forma lupina: dano ×2, +30% velocidade, 15% roubo de vida.' },
  'dwarf:combo': { dmg: 1.1, hits: 4, range: 2.2, cast: 0.3, note: 'Marteladas pesadas; cada acerto dá 1 de Fúria.' },
  'dwarf:guard': { dmg: 0.6, range: 6, area: 2.2, cd: 2.4, note: 'Muralha: bloqueia à frente; contra-golpe ×2,2.' },
  'dwarf:bash': { dmg: 1.4, hits: 2, range: 7, area: 2.2, cd: 2.4, note: 'Ombrada que atropela e derruba.' },
  'dwarf:slam': { dmg: 2.4, range: 10, area: 3.6, dur: 5, cd: 3.2, note: 'Abre um buraco de lava: queima 5 s. Fúria: +30% por ponto.' },
  'dwarf:heal': { dmg: 0, cast: 0.55, cd: 2.6, note: 'Cura 28% da vida + 8 por Fúria; com Fúria, 3 críticos.' },
  'dwarf:hammerthrow': { dmg: 1.6, hits: 2, range: 9, cast: 0.44, cd: 6, note: 'Bumerangue: acerta na ida e na volta.' },
  'dwarf:stonerune': { dmg: 0.5, area: 3.5, dur: 6, cd: 12, note: 'Zona rúnica: inimigos dentro ficam lentos e tomam dano contínuo.' },
  'dwarf:forge': { dmg: 1.2, dur: 8, cd: 16, note: 'Golpes incendeiam por 8 s; +20% de dano.' },
  'dwarf:mountain': { dmg: 1.6, hits: 4, range: 6, area: 1.4, cast: 0.7, cd: 12, note: '4 pilares de pedra em linha; derrubam.' },
  'dwarf:avatar': { dmg: 2, dur: 10, cd: 45, note: 'Avatar: dano ×2, +30% tamanho, +20% defesa.' },
  'technocrat:combo': { dmg: 0.8, hits: 3, range: 12, cast: 0.2, note: 'Rajada de 3 pulsos; cada acerto dá 1 de Carga.' },
  'technocrat:guard': { dmg: 0, area: 2.5, dur: 3, cd: 2.4, note: 'Campo de força: absorve dano enquanto segura.' },
  'technocrat:slam': { dmg: 2.2, range: 11, area: 3, cd: 3.2, note: 'Granada: explosão que queima. Carga: +30% por ponto.' },
  'technocrat:bash': { dmg: 1.2, hits: 6, range: 12, area: 3.5, cd: 2.4, note: 'Chuva de mísseis do drone sobre a área marcada.' },
  'technocrat:heal': { dmg: 0.5, area: 7, dur: 10, cd: 2.6, note: 'Torre lança-chamas que atira sozinha por 10 s.' },
  'technocrat:flame': { dmg: 0.4, hits: 30, range: 6, area: 1.2, dur: 4.5, cd: 6, note: 'Jato contínuo que incendeia; mire com o mouse.' },
  'technocrat:shocktrap': { dmg: 0.4, area: 2, dur: 60, cd: 8, note: 'Até 4 armadilhas; paralisam quem pisar.' },
  'technocrat:poison': { dmg: 0.3, area: 2.8, dur: 7, cd: 9, note: 'Poça de veneno: corrói e retarda por 7 s.' },
  'technocrat:railgun': { dmg: 4, range: 18, area: 1.2, cast: 1, cd: 9, note: 'Disparo que atravessa tudo na linha.' },
  'technocrat:mech': { dmg: 2, dur: 12, cd: 50, note: 'Mecha: dano ×2, +40% defesa, Rajadas de 5 tiros.' },
};
for (const [k, v] of Object.entries(STATS)) if (k.startsWith('nordic:')) STATS['human:' + k.slice(7)] = { ...v, note: v.note?.replace(/Fúria/g, 'Determinação') };
/* fichas das magias novas (25/10) e das que os kits formados emprestam */
Object.assign(STATS, {
  'x:smite': { dmg: 2.2, range: 11, area: 2.6, cast: 0.45, cd: 7, note: 'Coluna de luz na área marcada. Mortos-vivos, demônios e lobisomens: atordoados e dano sagrado.' },
  'x:consecrate': { dmg: 0.42, hits: 12, area: 3.6, dur: 6, cd: 14, note: 'Fere quem estiver dentro a cada 0,5 s; você cura 1,5% da vida por pulso dentro do círculo.' },
  'x:avenging': { dmg: 1.8, dur: 12, cd: 50, note: 'Asas de luz: dano ×1,8, +25% de defesa, 8% de roubo de vida.' },
  'x:drain': { dmg: 0.4, hits: 8, range: 7, dur: 2, cd: 8, note: 'Fio de sangue por 2 s: o dano volta como vida.' },
  'x:batswarm': { dmg: 0.3, hits: 12, area: 3, range: 11, dur: 5, cd: 12, note: 'Morcegos mordem e deixam lento; metade do dano volta como vida.' },
  'x:bloodnova': { dmg: 1.8, area: 4.5, cast: 0.35, cd: 10, note: 'Explosão em volta; cura 30% do dano causado.' },
  'x:nightform': { dmg: 1.8, dur: 12, cd: 50, note: 'Forma do Conde: dano ×1,8, +40% de velocidade, 25% de roubo de vida.' },
  'x:howl': { dmg: 0, area: 9, dur: 2, cd: 16, note: 'Medo: paralisa 2 s quem estiver perto; +20% de dano por 8 s.' },
  'x:rend': { dmg: 0.8, hits: 3, range: 2.6, cd: 6, note: 'Três garras; o último golpe sangra por 4 s.' },
  'x:aegis': { dmg: 0, dur: 8, cd: 16, note: 'Cúpula que absorve até 30% da vida; ao quebrar, explode em luz e atordoa em 3 m.' },
  'x:shieldthrow': { dmg: 1.3, hits: 3, range: 10, cd: 7, note: 'O escudo ricocheteia em até 3 inimigos, atordoa cada um e volta.' },
  'x:conversion': { dmg: 2.6, area: 2.8, range: 9, cast: 0.7, cd: 16, note: 'Martelo de luz. Morto-vivo/demônio <35%: purificado. Gente <40%: converte e foge.' },
  'x:clot': { dmg: 1.2, range: 8, dur: 3, cd: 11, note: 'Guarda 3 s de golpes no sangue do alvo; estoura com 60% do que ele levou e sangra 4 s.' },
  'x:venomclaw': { dmg: 0.6, hits: 4, range: 2.6, cd: 7, note: 'Quatro rasgos rápidos; cada um envenena por 4 s.' },
  'x:bite': { dmg: 1.7, range: 2.4, cd: 6, note: 'Mordida: sangra 4 s; metade do dano volta como vida.' },
  'x:pounce': { dmg: 1.9, area: 2.6, range: 11, cd: 9, note: 'Salto: derruba no pouso; o alvo principal leva o dobro.' },
  'x:packhowl': { dmg: 1.3, dur: 12, cd: 40, note: 'Dois lobos espirituais por 12 s; +30% dano, +20% velocidade, +15% defesa.' },
  'x:gunturret': { dmg: 0.32, range: 14, dur: 16, cd: 18, note: 'Tripé com metralhadora: rajadas de 5 balas na presa mais próxima.' },
  'x:teslatower': { dmg: 0.7, hits: 4, range: 9, dur: 14, cd: 20, note: 'Arco que salta em até 4 inimigos a cada 1,2 s e deixa lento.' },
  'x:bubble': { dmg: 0, dur: 8, cd: 16, note: 'Seis escudos girando bebem até 35% da vida; a esfera não ataca enquanto defende.' },
  'x:mortar': { dmg: 1.5, area: 2.2, range: 26, dur: 15, cd: 24, note: 'Granadas em arco alto de 6 a 26 m; cada uma derruba.' },
  'tecno:medic': { dmg: 0, dur: 10, cd: 18, note: 'Drone médico: cura 40% da vida em 10 s e apaga queimaduras.' },
});
for (const kk of ['tecno', 'pal', 'vam', 'lob'] as const) for (const sk of KITS[kk] ?? []) { const key = `${kk}:${sk.id}`; if (STATS[key]) continue; STATS[key] = STATS['x:' + sk.id] ?? STATS[`technocrat:${sk.id}`] ?? STATS[`nordic:${sk.id}`] ?? {}; }

export interface Scale { dmg: number; range: number; area: number; dur: number; cost: number; tier: number; rank: number }
export const scaleOf = (rank: number): Scale => ({ rank, dmg: 1 + 0.04 * rank, range: 1 + 0.04 * rank, area: 1 + 0.04 * rank, dur: 1 + 0.05 * rank, cost: Math.max(0.8, 1 - 0.02 * rank), tier: rank >= 10 ? 3 : rank >= 6 ? 2 : rank >= 3 ? 1 : 0 }); // estágios: Bronze (3), Prata (6), Ouro (10)
export const TIER_NAMES = ['Iniciante', 'Bronze', 'Prata', 'Ouro'];
export const TIER_ICON = ['', 'I', 'II', '✦'];

export function createSkillTree(race: () => Race, lvl: () => number, log: (t: string, c?: string) => void, title?: () => string) {
  const SAVE = 'karmika.tree.v2';
  let ranks: Record<string, number> = {}, bonus = 0, migrated: string[] = [];
  try { const s = JSON.parse(localStorage.getItem(SAVE) || 'null'); if (s) { ranks = s.ranks ?? {}; bonus = s.bonus ?? 0; migrated = s.migrated ?? []; }
    else { const o = JSON.parse(localStorage.getItem('karmika.tree.v1') || 'null'); if (o) { bonus = Math.round((o.bonus ?? 0) / 3); migrated = o.migrated ?? []; for (const [k, v] of Object.entries(o.ranks ?? {}) as [string, number][]) if (v > 0) ranks[k] = 1; } } // árvore antiga (3 pontos/nível): cada magia aprendida fica com 1 ponto; o resto volta para redistribuir
  } catch { /* */ }
  const save = () => { try { localStorage.setItem(SAVE, JSON.stringify({ ranks, bonus, migrated })); } catch { /* */ } };
  const key = (r: Race, id: string) => `${r}:${id}`;
  const rank = (id: string, r = race()) => ranks[key(r, id)] ?? 0;
  const spent = (r = race()) => (TREES[r] ?? []).reduce((a, n) => a + rank(n.id, r), 0);
  const total = () => 2 + lvl() * PER_LEVEL + bonus; // 3 no nível 1 (as três magias básicas), depois 1 por nível
  const available = () => Math.max(0, total() - spent());
  const node = (id: string, r = race()) => (TREES[r] ?? []).find((n) => n.id === id);
  const def = (id: string, r = race()) => (KITS[r] ?? []).find((s) => s.id === id) as SkillDef | undefined;
  /* teto por magia: 1 + nível/8 (regra 8) — mas um ponto ganho NUNCA fica preso. Se as magias que já abriram não comportam
     todos os pontos do nível, o teto sobe o bastante para caber (ex.: nível 2, três magias abertas, 4 pontos → teto 2). */
  const cap = () => { const open = (TREES[race()] ?? []).filter((n) => (def(n.id)?.lvl ?? 1) <= lvl() || rank(n.id) > 0).length || 1; return Math.min(MAX_RANK, Math.max(1 + Math.floor(lvl() / 8), Math.ceil(total() / open))); };
  /** por que não dá para investir (null = pode) */
  function blocked(id: string): string | null {
    const n = node(id); if (!n) return 'desconhecida';
    { const dl = def(id)?.lvl ?? 1; if (lvl() < dl && !rank(id)) return `abre no nível ${dl}`; }
    if (available() <= 0) return 'sem pontos';
    if (rank(id) >= cap()) return rank(id) >= MAX_RANK ? `no máximo (${MAX_RANK})` : `máximo no seu nível: ${cap()}`;
    for (const [p, k0] of n.req) { const k = Math.min(k0, cap()); if (rank(p) < k) return `precisa de ${k} ponto${k > 1 ? 's' : ''} em ${def(p)?.name ?? p}`; } // o pré-requisito nunca pede mais do que o teto do seu nível (senão nada abre antes do nível 8)
    return null;
  }
  function invest(id: string): boolean {
    const why = blocked(id); if (why) { log(`Não dá: ${why}.`, '#ff9a8a'); return false; }
    const k = key(race(), id); const before = scaleOf(ranks[k] ?? 0).tier; ranks[k] = (ranks[k] ?? 0) + 1; save();
    const d = def(id)!, after = scaleOf(ranks[k]).tier;
    if (ranks[k] === 1) log(`✨ ${d.name} aprendida! Tecla [${keyOf(race(), d.id)}].`, '#ffe08a');
    else if (after > before) log(`✦ ${d.name} evoluiu: ${TIER_NAMES[after]} — nova apresentação, mais dano e alcance.`, '#ffe08a');
    else log(`+1 em ${d.name} (${ranks[k]}/${MAX_RANK}).`, '#b9c6e0');
    return true;
  }
  /** itens que dão pontos (Tomo Kármico) */
  function addBonus(n: number) { bonus += n; save(); log(`📖 +${n} pontos de magia. Abra a árvore (K).`, '#ffe08a'); }
  /** jogador antigo: magias que já estavam abertas por nível entram com 1 ponto (uma vez por personagem) */
  function migrate() {
    const r = race(); if (migrated.includes(r)) return; migrated.push(r);
    for (const s of KITS[r] ?? []) if (lvl() >= s.lvl && !ranks[key(r, s.id)]) ranks[key(r, s.id)] = 1;
    if (!ranks[key(r, 'combo')]) ranks[key(r, 'combo')] = 1; save();
  }
  function reset() { for (const n of TREES[race()] ?? []) delete ranks[key(race(), n.id)]; ranks[key(race(), 'combo')] = 1; save(); log('Árvore redistribuída.', '#b9c6e0'); }
  /** reencarnação: a árvore inteira volta (todas as raças) e todos os pontos ficam livres para redistribuir */
  function wipe() { ranks = {}; migrated = Object.keys(TREES); for (const r of migrated) ranks[key(r as Race, 'combo')] = 1; save(); log('✦ A Árvore Kármica voltou inteira: todos os pontos estão livres (K).', '#ffe08a'); }
  const scale = (id: string) => scaleOf(rank(id));
  const has = (id: string) => rank(id) > 0;
  /** ficha completa da magia no ponto atual */
  function sheet(id: string): string[] {
    const s = STATS[key(race(), id)] ?? {}, d = def(id), sc = scale(id), L = lvl(), base = 12 * (1 + 0.05 * (L - 1));
    const out: string[] = [];
    if (s.dmg) out.push(`⚔ Dano: ${Math.round(base * s.dmg * sc.dmg)}${s.hits ? ` × ${s.hits} acertos` : ''} <i>(×${(s.dmg * sc.dmg).toFixed(2)} do golpe básico)</i>`);
    if (s.range) out.push(`➤ Alcance: ${(s.range * sc.range).toFixed(1)} m`);
    if (s.area) out.push(`◎ Área: ${(s.area * sc.area).toFixed(1)} m de raio`);
    if (s.dur) out.push(`⏳ Duração: ${(s.dur * sc.dur).toFixed(1)} s`);
    if (s.cast) out.push(`✋ Preparo: ${s.cast} s`);
    if (s.cd) out.push(`↻ Recarga: ${s.cd} s`);
    if (d?.cost) out.push(`💧 Custo: ${Math.round(d.cost * sc.cost)} de ${resOf(race()).name}`);
    if (s.note) out.push(`📝 ${s.note}`);
    return out;
  }
  function render(el: HTMLElement, sel: string | null, onSel: (id: string) => void, onInvest: (id: string) => void) {
    const r = race(), nodes = TREES[r] ?? [], d = def(sel ?? 'combo') ?? null, selId = d?.id ?? 'combo';
    const cols = Math.max(...nodes.map((n) => n.col)) + 1, W = cols > 6 ? 104 : 118, H = 96, rows = Math.ceil(Math.max(...nodes.map((n) => n.row)) + 1);
    const cx = (n: Node) => n.col * W + 44, cy = (n: Node) => n.row * H + 40;
    const lines = nodes.flatMap((n) => n.req.map(([p]) => { const pn = node(p)!; const on = rank(n.id) > 0; return `<line x1="${cx(pn) + 22}" y1="${cy(pn)}" x2="${cx(n) - 22}" y2="${cy(n)}" stroke="${on ? '#ffd24a' : rank(p) >= (n.req.find((q) => q[0] === p)![1]) ? '#a08a50' : '#4a3a28'}" stroke-width="${on ? 3 : 2}" ${on ? '' : 'stroke-dasharray="4 4"'}/>`; }));
    const html = nodes.map((n) => { const s = def(n.id)!, rk = rank(n.id), sc = scaleOf(rk), why = blocked(n.id); return `<div class="tn ${rk ? 'on' : ''} ${n.id === selId ? 'sel' : ''} ${!rk && !why ? 'can' : ''}" style="left:${cx(n) - 22}px;top:${cy(n) - 22}px;--c:${s.c}" data-n="${n.id}" title="${s.name}"><div class="ic">${s.svg}</div><b>${rk}/${MAX_RANK}</b>${sc.tier ? `<i class="tier">${TIER_ICON[sc.tier]}</i>` : ''}<kbd>${s.k}</kbd></div>`; }).join('');
    const sc = scale(selId), why = blocked(selId), rk = rank(selId);
    const next = rk < 3 ? 3 : rk < 6 ? 6 : 10;
    el.innerHTML = `<div class="pn skpn"><h2>🌳 Árvore Kármica — ${title ? title() : r === 'human' ? 'Humano' : r === 'nordic' ? 'Guerreira Nórdica' : r === 'dwarf' ? 'Anão' : 'Tecnocrata'} <button data-x>✕</button></h2>
      <div class="tree-top"><span class="pts ${available() ? 'on' : ''}">${available()} ponto${available() === 1 ? '' : 's'} para gastar</span><small>Nível ${lvl()} · 1 ponto por nível · máx. ${cap()} por magia agora · ${spent()} gastos</small><button data-reset title="Redistribuir todos os pontos">↺ Redistribuir</button></div>
      <div class="tree-body"><div class="treew"><div class="tree" style="width:${cols * W}px;height:${rows * H}px"><svg width="${cols * W}" height="${rows * H}">${lines.join('')}</svg>${html}</div></div>
      <div class="tdet">${d ? `<div class="th"><div class="ic" style="--c:${d.c}">${d.svg}</div><div><b>${d.name}</b><small>Tecla [${keyOf(race(), d.id)}] · ${rk ? `${rk}/${MAX_RANK} · ${TIER_NAMES[sc.tier]}` : 'não aprendida'}</small></div></div>
        <p class="tip">${d.tip}</p>
        <div class="lines">${sheet(selId).map((l) => `<div>${l}</div>`).join('')}</div>
        <div class="evo">${[1, 2, 3].map((t) => `<span class="${sc.tier >= t ? 'on' : ''}">${TIER_ICON[t]} ${TIER_NAMES[t]} <i>${[0, 3, 6, 10][t]} pts</i></span>`).join('')}</div>
        <small class="nx">${rk >= MAX_RANK ? 'Magia no máximo.' : `Próxima evolução visual em ${next} ponto${next > 1 ? 's' : ''}. Cada ponto: +4% de dano (somado), +4% alcance e área, +5% duração, −2% custo.`}</small>
        <button class="inv ${why ? 'off' : ''}" data-inv="${selId}" ${why ? 'disabled' : ''}>${why ? why : rk ? `+1 ponto em ${d.name}` : `Aprender ${d.name} (1 ponto)`}</button>` : ''}</div></div>
      <small class="ft">Clique numa magia para ver a ficha · Esc fecha</small></div>`;
    el.onclick = (e) => { const t = e.target as HTMLElement; const n = t.closest('[data-n]') as HTMLElement | null; if (n) { onSel(n.dataset.n!); return; } const b = t.closest('[data-inv]') as HTMLElement | null; if (b && !b.hasAttribute('disabled')) { onInvest(b.dataset.inv!); return; } if (t.closest('[data-reset]')) { if (confirm('Redistribuir todos os pontos desta personagem?')) { reset(); onSel(selId); } } };
  }
  return { rank, scale, has, wipe, available, spent, blocked, invest, addBonus, migrate, reset, sheet, render, def };
}
