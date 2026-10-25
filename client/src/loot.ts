/** Equipamentos gerados: raridades, afixos e efeitos especiais. */
export type Rarity = 'normal' | 'magic' | 'rare' | 'legendary' | 'epic' | 'unique' | 'relic';
export type Slot = 'weapon' | 'armor' | 'shield' | 'helm' | 'boots' | 'ring' | 'amulet' | 'relic' | 'earring' | 'shoulders' | 'cape' | 'ring2' | 'earring2';
export type StatKey = 'dmg' | 'def' | 'hp' | 'mp' | 'crit' | 'move' | 'regen' | 'leech' | 'xp' | 'gold' | 'str' | 'dex' | 'vit' | 'int' | 'gen';
export interface Gear { /** arma de caminho (ver Only) */ only?: Only; uid: number; slot: Slot; icon: string; rarity: Rarity; name: string; base: string; ilvl: number; stats: Partial<Record<StatKey, number>>; special?: string; value: number; lore?: string; aura?: number; uniq?: string; fac?: 'fio' | 'desf'; req?: number; /** do Shop: pode ser vendido/trocado até ser vestido; ao vestir, vincula ao personagem */ shop?: boolean; bound?: boolean }

export const RARITY: Record<Rarity, { name: string; col: string; aff: [number, number]; q: number; w: number; val: number }> = {
  normal: { name: 'Normal', col: '#d0d0d0', aff: [0, 0], q: 1, w: 62, val: 3 },
  magic: { name: 'Mágico', col: '#6ab0ff', aff: [1, 2], q: 1.15, w: 26, val: 14 },
  rare: { name: 'Raro', col: '#ffd24a', aff: [3, 4], q: 1.35, w: 9, val: 45 },
  legendary: { name: 'Lendário', col: '#ff8a1c', aff: [5, 5], q: 1.7, w: 2.6, val: 170 },
  epic: { name: 'Épico', col: '#9b5de5', aff: [5, 6], q: 2.0, w: 0.7, val: 380 },
  unique: { name: 'Único', col: '#f2cf6a', aff: [0, 0], q: 2.4, w: 0.12, val: 1500 },
  relic: { name: 'Relíquia', col: '#e2452b', aff: [0, 0], q: 2.8, w: 0.02, val: 5000 },
};
export const STAT_LABEL: Record<StatKey, string> = { dmg: 'Dano', def: 'Defesa', hp: 'Vida', mp: 'Magia', crit: 'Crítico', move: 'Velocidade', regen: 'Regeneração', leech: 'Roubo de vida', gen: 'Geração de recurso', xp: 'XP', gold: 'Ouro', str: 'Força', dex: 'Destreza', vit: 'Vitalidade', int: 'Energia' };
export const STAT_FMT = (k: StatKey, v: number) => (['hp', 'mp', 'str', 'dex', 'vit', 'int', 'dmg', 'def'].includes(k) ? `+${Math.round(v)}` : k === 'regen' ? `+${v.toFixed(1)}/s` : `+${v.toFixed(v < 10 ? 1 : 0)}%`) + ' ' + STAT_LABEL[k];
export const SPECIAL: Record<string, string> = {
  burn: 'Golpes têm 20% de chance de incendiar (Ardendo).',
  echo: 'Golpes têm 15% de chance de acertar duas vezes.',
  frenzy: 'Abater um inimigo concede +2 de Fúria.',
  aegis: 'Bloqueio perfeito cura 10% da vida.',
  storm: 'Críticos liberam um raio que atinge inimigos próximos.',
  // únicos
  u_mjolnir: 'Golpes têm 25% de chance de chamar um raio que salta para até 3 inimigos.',
  u_excal: 'Seus golpes são de luz (dano sagrado). Críticos curam 3% da vida.',
  u_gungnir: 'Lança de Odin causa o dobro de dano e volta para a mão.',
  u_egide: 'Bloqueio perfeito devolve o golpe inteiro e atordoa quem estiver perto por 2 s.',
  u_fenrir: 'Abaixo de 30% de vida, a fúria do lobo desperta: +40% de dano e 10% de roubo de vida por 8 s (1 vez por minuto).',
  u_sleipnir: 'O dash não gasta fôlego e deixa um rastro de luz.',
  u_andvari: '+60% de ouro, e equipamentos raros caem 50% mais. O anel pede sempre mais.',
  t_core: 'A Energia (ou o recurso) recarrega o dobro, e o calor da caldeira cura 1% da vida por segundo em luta.',
  t_exo: 'Todo golpe recebido entra 20% mais fraco.',
  dh_silver: '+60% de dano contra mortos-vivos, demônios e criaturas da noite.',
  dh_cloak: '+12% de chance de esquiva.',
  m_staff: 'Magias causam +25% de dano e custam 20% menos.',
  m_void: 'O dano das magias volta como vida (6%).',
  w_moon: 'Abaixo de 50% de vida, a besta acorda: +30% de dano e golpes mais rápidos de recuperar.',
  u_draupnir: 'A cada 9 s, a próxima magia sai de graça.',
  // relíquias
  r_calice: 'Uma vez a cada 10 min, impede a morte e devolve metade da vida. Curas valem o dobro. Aura dourada.',
  r_livro: 'Magias causam +35% de dano, mas cada uma custa 2% da sua vida. Sombras roxas rondam o portador.',
  r_mimir: 'Críticos causam ×2,3 em vez de ×1,7. Um brilho azul acompanha o olhar.',
  r_ymir: 'Golpes e magias de gelo congelam por 1,5 s. Neve cai ao seu redor.',
  r_pena: 'O Contra-golpe da Valquíria sai sempre em Ouro, e o dash abre asas de luz.',
  r_surtr: 'Todos os golpes incendeiam; inimigos que morrem ardendo explodem em brasas.',
  r_gear: 'Todas as recargas andam 30% mais rápido. Engrenagens douradas giram em volta do portador.',
  r_hunt: 'Cada criatura das trevas abatida dá +6% de dano por 12 s (acumula 5 vezes).',
  r_lantern: 'O recurso volta o dobro e as magias ganham +15% de chance de crítico.',
  r_drac: '8% de todo o dano volta como vida; morcegos rondam o portador.',
};
/* ---- ÚNICOS: peças lendárias com nome e poder próprio. Cada caminho tem a sua cultura (nórdica, anã, tecnocrata, paladina,
   caçadora de demônios, mágica, bruxa, vampírica, licantropa). Podem cair mais de uma vez (o mundo tem muitos jogadores),
   mas a chance é muito baixa; o que é do seu caminho cai com mais frequência. ---- */
export type Culture = 'nordic' | 'dwarf' | 'technocrat' | 'paladin' | 'hunter' | 'mage' | 'warlock' | 'vampire' | 'werewolf';
export const CULTURE_NAME: Record<Culture, string> = { nordic: 'Nórdica', dwarf: 'Anã', technocrat: 'Tecnocrata', paladin: 'Sacra (paladinos)', hunter: 'Caçadores de demônios', mage: 'Arcana (magos)', warlock: 'Sombria (bruxos)', vampire: 'Vampírica', werewolf: 'Licantropa' };
export interface UniqueDef { id: string; name: string; slot: Slot; icon: string; base: string; minL: number; stats: Partial<Record<StatKey, number>>; special: string; lore: string; aura?: number; c: Culture }
export const UNIQUES: UniqueDef[] = [
  // nórdica
  { c: 'nordic', id: 'mjolnir', name: 'Mjölnir, o Martelo do Trovão', slot: 'weapon', icon: '🔨', base: 'Martelo', minL: 30, stats: { dmg: 22, str: 8, crit: 6, gen: 10 }, special: 'u_mjolnir', lore: 'Forjado por anões que nunca disseram o nome. Volta sempre para quem é digno.', aura: 0x9ad0ff },
  { c: 'nordic', id: 'gungnir', name: 'Gungnir, a Lança que não erra', slot: 'weapon', icon: '🔱', base: 'Lança', minL: 28, stats: { dmg: 20, dex: 8, crit: 5 }, special: 'u_gungnir', lore: 'As runas na ponta foram gravadas por Odin com a própria lança.', aura: 0xcfe0ff },
  { c: 'nordic', id: 'fenrirhelm', name: 'Elmo de Fenrir', slot: 'helm', icon: '🐺', base: 'Elmo Nórdico', minL: 22, stats: { def: 12, str: 7, leech: 3 }, special: 'u_fenrir', lore: 'Feito do crânio de um filho do grande lobo. Às vezes ele uiva sozinho.' },
  { c: 'nordic', id: 'sleipnir', name: 'Botas de Sleipnir', slot: 'boots', icon: '🥾', base: 'Botas Peludas', minL: 18, stats: { move: 12, dex: 7, def: 6 }, special: 'u_sleipnir', lore: 'Costuradas com crina do cavalo de oito patas.' },
  { c: 'nordic', id: 'draupnir', name: 'Draupnir, o Anel que Goteja', slot: 'ring', icon: '💍', base: 'Anel de Prata', minL: 26, stats: { mp: 40, regen: 2, int: 6, gen: 12 }, special: 'u_draupnir', lore: 'A cada nove noites, goteja oito anéis iguais a ele. Nenhum deles tem o poder dele.' },
  // anã
  { c: 'dwarf', id: 'egide', name: 'Égide de Eitr', slot: 'shield', icon: '🛡️', base: 'Escudo Torre', minL: 20, stats: { def: 20, hp: 60, vit: 8 }, special: 'u_egide', lore: 'Escudo dos anões de Brasaforja, batido mil anos na bigorna. Nada que bate nele volta inteiro.' },
  { c: 'dwarf', id: 'andvari', name: 'Anel de Andvari', slot: 'ring', icon: '💍', base: 'Anel Rúnico', minL: 15, stats: { gold: 40, crit: 5, dex: 4 }, special: 'u_andvari', lore: 'O anão Andvari amaldiçoou quem o tirasse dele. Ninguém nunca o devolveu.' },
  { c: 'dwarf', id: 'brokk', name: 'Ombreiras da Forja de Brokk', slot: 'shoulders', icon: '✦', base: 'Ombreiras de Placas', minL: 24, stats: { def: 16, str: 8, hp: 50 }, special: 't_exo', lore: 'Feitas com o ferro que escorre do vulcão da Montanha Negra. Pesam como uma promessa.' },
  // tecnocrata
  { c: 'technocrat', id: 'tesla', name: 'Rifle de Arco Voltaico Mk-VII', slot: 'weapon', icon: '⚡', base: 'Rifle', minL: 26, stats: { dmg: 21, crit: 6, gen: 12 }, special: 'u_mjolnir', lore: 'Protótipo da Academia Tecnológica. Ninguém conseguiu construir o Mk-VIII.', aura: 0x6ae0ff },
  { c: 'technocrat', id: 'caldeira', name: 'Coração da Caldeira Mãe', slot: 'amulet', icon: '⚙', base: 'Engrenagem', minL: 22, stats: { mp: 50, gen: 15, int: 8 }, special: 't_core', lore: 'O primeiro motor de Porto Caldeira. Ainda gira, e ainda esquenta o peito de quem o carrega.', aura: 0xffa040 },
  { c: 'technocrat', id: 'exo', name: 'Exoesqueleto Ferrugem-Zero', slot: 'armor', icon: '🦾', base: 'Exoesqueleto', minL: 28, stats: { def: 22, hp: 70, str: 6 }, special: 't_exo', lore: 'Uma armadura que respira vapor. Ninguém sabe quem a usou primeiro.' },
  // paladino (sacra)
  { c: 'paladin', id: 'excal', name: 'Excalibur, a Lâmina do Lago', slot: 'weapon', icon: '⚔️', base: 'Espada Longa', minL: 25, stats: { dmg: 18, crit: 8, hp: 40, vit: 6 }, special: 'u_excal', lore: 'Saiu da água para a mão de um rei. Os templários da Igreja Karmika a procuram há gerações.', aura: 0xffe9a0 },
  { c: 'paladin', id: 'aurora', name: 'Martelo da Aurora', slot: 'weapon', icon: '🔨', base: 'Martelo', minL: 20, stats: { dmg: 19, vit: 6, regen: 1.5 }, special: 'u_excal', lore: 'Abençoado ao nascer do sol na Catedral de Askavik. Fere o que é morto como o dia fere a noite.', aura: 0xfff0b0 },
  { c: 'paladin', id: 'manto', name: 'Manto do Juramento', slot: 'cape', icon: '✦', base: 'Manto Sacro', minL: 18, stats: { def: 10, hp: 60, regen: 2 }, special: 'aegis', lore: 'Quem o veste jurou nunca fugir. O manto lembra o juramento por ele.' },
  // caçadores de demônios
  { c: 'hunter', id: 'besta', name: 'Besta de Prata de Van Rhal', slot: 'weapon', icon: '🏹', base: 'Besta', minL: 22, stats: { dmg: 19, dex: 9, crit: 7 }, special: 'dh_silver', lore: 'O primeiro caçador da Escola trocou a espada por esta besta na noite em que a cidade dele caiu.', aura: 0xdfe8ff },
  { c: 'hunter', id: 'capa', name: 'Capa do Último Caçador', slot: 'cape', icon: '✦', base: 'Capa do Corvo', minL: 20, stats: { dex: 10, move: 8, def: 6 }, special: 'dh_cloak', lore: 'Costurada com o couro do que ele caçou por último. Ele não voltou para buscá-la.' },
  { c: 'hunter', id: 'brincoh', name: 'Brinco de Estaca', slot: 'earring', icon: '✦', base: 'Argola Rúnica', minL: 16, stats: { crit: 6, leech: 2, dex: 5 }, special: 'dh_silver', lore: 'Uma lasca da estaca que matou o primeiro vampiro de Karmika.' },
  // magos (arcana)
  { c: 'mage', id: 'cajado', name: 'Cajado de Mil Invernos', slot: 'weapon', icon: '🪄', base: 'Cajado', minL: 24, stats: { int: 14, mp: 60, dmg: 12 }, special: 'm_staff', lore: 'Do topo do Pináculo de Marfim, alguém o deixou cair. Ninguém subiu para devolver.', aura: 0x9ad7ff },
  { c: 'mage', id: 'brincom', name: 'Brinco do Canalizador', slot: 'earring', icon: '✦', base: 'Brinco de Prata', minL: 22, stats: { mp: 40, int: 8, crit: 4 }, special: 'r_lantern', lore: 'Vibra baixinho quando passa perto da torre de 80 metros.' },
  // bruxos (sombria)
  { c: 'warlock', id: 'anelsp', name: 'Anel do Sem-Passo', slot: 'ring', icon: '💍', base: 'Anel Rúnico', minL: 22, stats: { int: 10, leech: 4, mp: 30 }, special: 'm_void', lore: 'Quem o usa sente o chão sumir debaixo dos pés. Os bruxos do Vale da Desgraça chamam isso de liberdade.', aura: 0x8a3aff },
  { c: 'warlock', id: 'capuz', name: 'Capuz das Mil Bocas', slot: 'helm', icon: '✦', base: 'Capuz', minL: 25, stats: { int: 12, mp: 50, def: 6 }, special: 'm_staff', lore: 'Sussurra de noite, e cada sussurro é um feitiço que você ainda não aprendeu.' },
  // vampiros
  { c: 'vampire', id: 'colar', name: 'Colar da Primeira Mordida', slot: 'amulet', icon: '✦', base: 'Presa', minL: 20, stats: { leech: 5, dex: 8, hp: 40 }, special: 'r_drac', lore: 'Duas presas presas num fio de prata. Ninguém sabe de quem eram. Todos sabem de quem são.', aura: 0xb01020 },
  // licantropos
  { c: 'werewolf', id: 'garras', name: 'Garras da Lua Velha', slot: 'weapon', icon: '✦', base: 'Garras', minL: 22, stats: { dmg: 20, str: 9, leech: 3 }, special: 'w_moon', lore: 'Arrancadas do alfa que fundou a tribo da Selva Licantropa. Ainda crescem.', aura: 0xc8b8a0 },
];
/* ---- RELÍQUIAS: poder que muda o jogo, efeito visual próprio; nem sempre são armas. Têm o seu espaço (Relíquia). ---- */
export const RELICS: UniqueDef[] = [
  { c: 'paladin', id: 'calice', name: 'Cálice de Marghar', slot: 'relic', icon: '🏆', base: 'Cálice', minL: 20, stats: { hp: 120, regen: 4, vit: 10 }, special: 'r_calice', lore: 'O cálice sagrado da Igreja Karmika. Quem bebe dele vê o Caminho inteiro de uma vez. Ninguém bebeu duas vezes.', aura: 0xffd24a },
  { c: 'warlock', id: 'livro', name: 'Livro Sem Passos', slot: 'relic', icon: '📕', base: 'Grimório', minL: 25, stats: { int: 20, mp: 80, dmg: 10 }, special: 'r_livro', lore: 'O livro proibido dos bruxos, escrito pelos seguidores do Sem-Passo com tinta que não seca.', aura: 0x8a3aff },
  { c: 'nordic', id: 'mimir', name: 'Olho de Mímir', slot: 'relic', icon: '👁️', base: 'Olho de pedra', minL: 30, stats: { crit: 8, xp: 25, int: 10 }, special: 'r_mimir', lore: 'Odin deu um olho para beber do poço de Mímir. Este é o outro.', aura: 0x6ab4ff },
  { c: 'nordic', id: 'ymir', name: 'Coração de Ymir', slot: 'relic', icon: '❄️', base: 'Coração de gelo', minL: 28, stats: { hp: 200, vit: 15, def: 15 }, special: 'r_ymir', lore: 'Do gigante de gelo nasceu o mundo. O coração ainda bate, devagar.', aura: 0xcfeaff },
  { c: 'nordic', id: 'pena', name: 'Pena da Valquíria', slot: 'relic', icon: '🪶', base: 'Pena', minL: 20, stats: { dex: 15, move: 10, crit: 4 }, special: 'r_pena', lore: 'Caiu das asas de quem leva os bravos para o salão. Não pesa nada, e pesa tudo.', aura: 0xfff0d0 },
  { c: 'dwarf', id: 'surtr', name: 'Brasa de Surtr', slot: 'relic', icon: '🔥', base: 'Brasa', minL: 35, stats: { dmg: 30, str: 12, gen: 15 }, special: 'r_surtr', lore: 'Achada no fundo da Montanha Negra, onde os anões cavam há mil gerações. Ainda não esfriou.', aura: 0xff6a1a },
  { c: 'technocrat', id: 'engrenagem', name: 'Engrenagem do Primeiro Relógio', slot: 'relic', icon: '⚙', base: 'Engrenagem', minL: 25, stats: { int: 12, gen: 15, move: 6 }, special: 'r_gear', lore: 'A peça que fez o primeiro relógio de Karmika contar o tempo. Desde que saiu dele, o tempo anda diferente perto de quem a carrega.', aura: 0x6ae0ff },
  { c: 'hunter', id: 'cruz', name: 'Relicário da Primeira Caçada', slot: 'relic', icon: '✝', base: 'Relicário', minL: 25, stats: { dex: 12, crit: 6, dmg: 12 }, special: 'r_hunt', lore: 'Guarda as cinzas do primeiro demônio queimado pela Escola de Caçadores. O ódio ali dentro nunca esfriou.', aura: 0xffffff },
  { c: 'mage', id: 'lanterna', name: 'Lanterna do Pináculo de Marfim', slot: 'relic', icon: '🏮', base: 'Lanterna', minL: 28, stats: { int: 18, mp: 90, crit: 5 }, special: 'r_lantern', lore: 'A luz do topo da torre de 80 metros, presa num vidro. Os magos dizem que é energia pura.', aura: 0x9ad7ff },
  { c: 'vampire', id: 'drac', name: 'Coração de Drácula', slot: 'relic', icon: '🫀', base: 'Coração', minL: 30, stats: { leech: 8, hp: 100, dex: 10 }, special: 'r_drac', lore: 'Ainda bate, escondido na Colina Vampírica atrás da Montanha Negra. Bate mais rápido quando há sangue perto.', aura: 0x9a0a1a },
  { c: 'werewolf', id: 'presa', name: 'Presa do Primeiro Uivo', slot: 'relic', icon: '🦷', base: 'Presa', minL: 26, stats: { str: 14, hp: 80, leech: 3 }, special: 'w_moon', lore: 'Do lobo que uivou para a lua antes de existir lua.', aura: 0xc8b8a0 },
];
/** cultura do herói atual (o que é do seu caminho cai com mais frequência) */
let heroCulture: Culture = 'nordic';
export function setCulture(c: Culture) { heroCulture = c; }
/** item nomeado (único ou relíquia) no nível do achado; null se nenhum existe nesse nível (aí cai um épico) */
function named(list: UniqueDef[], ilvl: number, rarity: Rarity, slot?: Slot): Gear | null {
  const pool = list.filter((u) => ilvl >= u.minL), bySlot = slot ? pool.filter((u) => u.slot === slot) : pool, base = bySlot.length ? bySlot : pool;
  const mine = base.filter((u) => u.c === heroCulture), u = pick(mine.length && Math.random() < 0.7 ? mine : base); if (!u) return null; // 70%: da sua cultura
  // únicos e relíquias ficam acima dos épicos do mesmo nível: crescem como equipamento comum e ainda ganham ×1,6
  const stats: Partial<Record<StatKey, number>> = {}, AT = ['str', 'dex', 'vit', 'int'];
  for (const [kk, v] of Object.entries(u.stats) as [StatKey, number][]) stats[kk] = Math.round((PCT.has(kk) ? v : AT.includes(kk) || kk === 'regen' ? v * (1 + ilvl * 0.03) * 1.5 : v * (1 + ilvl * 0.09) * 1.6) * 10) / 10;
  return { uid: uid++, slot: u.slot, icon: u.icon, rarity, name: u.name, base: u.base, ilvl, stats, special: u.special, lore: `${u.lore} — Cultura ${CULTURE_NAME[u.c]}.`, aura: u.aura, uniq: u.id, value: Math.round(RARITY[rarity].val * (1 + ilvl * 0.1)) };
}
const AFF: Record<StatKey, [number, number]> = { dmg: [3, 8], def: [2, 5], hp: [10, 26], mp: [8, 20], crit: [2, 5], move: [2, 5], regen: [0.3, 0.9], leech: [1, 2.5], xp: [3, 9], gold: [5, 14], gen: [4, 9], str: [1, 3], dex: [1, 3], vit: [1, 3], int: [1, 3] };
const PCT = new Set<StatKey>(['crit', 'move', 'leech', 'xp', 'gold', 'gen']);
const SLOT_AFF: Record<Slot, StatKey[]> = {
  relic: [], ring2: [], earring2: [],
  earring: ['crit', 'mp', 'int', 'dex', 'gen', 'xp', 'leech'],
  shoulders: ['def', 'hp', 'str', 'vit', 'regen'],
  cape: ['def', 'hp', 'move', 'dex', 'regen', 'gold'],
  weapon: ['dmg', 'crit', 'leech', 'str', 'dex', 'hp', 'int', 'gen'],
  armor: ['def', 'hp', 'vit', 'regen', 'str', 'mp', 'xp'],
  shield: ['def', 'hp', 'vit', 'regen', 'str', 'move'],
  helm: ['def', 'hp', 'mp', 'int', 'vit', 'crit', 'xp'],
  boots: ['move', 'dex', 'def', 'hp', 'regen', 'gold'],
  ring: ['dmg', 'crit', 'leech', 'mp', 'dex', 'int', 'gold', 'xp', 'str', 'gen'],
  amulet: ['hp', 'mp', 'regen', 'xp', 'gold', 'vit', 'int', 'crit', 'dmg', 'gen'],
};
/** armas de caminho: só quem trilha aquele caminho empunha (Caçador de Demônios, Tecnocrata) ou só a raça (anões) */
export type Only = 'cac' | 'tec' | 'dwarf';
export const ONLY_NAME: Record<Only, string> = { cac: 'Caçadores de Demônios', tec: 'Tecnocratas', dwarf: 'Anões' };
interface Base { n: string; g: 'm' | 'f'; icon: string; s?: Partial<Record<StatKey, number>>; only?: Only }
const BASES: Record<Slot, Base[]> = {
  relic: [{ n: 'Relíquia', g: 'f', icon: '🏺' }], ring2: [], earring2: [],
  earring: [{ n: 'Brinco de Osso', g: 'm', icon: '✦' }, { n: 'Brinco de Prata', g: 'm', icon: '✦' }, { n: 'Argola Rúnica', g: 'f', icon: '✦', s: { crit: 1 } }],
  shoulders: [{ n: 'Ombreiras de Couro', g: 'f', icon: '✦', s: { def: 3 } }, { n: 'Ombreiras de Pele de Lobo', g: 'f', icon: '✦', s: { def: 4, hp: 6 } }, { n: 'Ombreiras de Ferro', g: 'f', icon: '✦', s: { def: 6 } }, { n: 'Ombreiras Escamadas', g: 'f', icon: '✦', s: { def: 6, hp: 4 } }, { n: 'Ombreiras de Crânio', g: 'f', icon: '✦', s: { def: 7 } }, { n: 'Ombreiras Cravejadas', g: 'f', icon: '✦', s: { def: 8 } }, { n: 'Ombreiras de Chifres', g: 'f', icon: '✦', s: { def: 8 } }, { n: 'Ombreiras de Placas', g: 'f', icon: '✦', s: { def: 9 } }, { n: 'Ombreiras do Guardião', g: 'f', icon: '✦', s: { def: 10 } }],
  cape: [{ n: 'Capa de Lã', g: 'f', icon: '✦', s: { def: 2, regen: 0.2 } }, { n: 'Capa Curta de Viagem', g: 'f', icon: '✦', s: { def: 1, move: 3 } }, { n: 'Manto de Peles', g: 'm', icon: '✦', s: { def: 4, hp: 10 } }, { n: 'Manto de Pele de Lobo', g: 'm', icon: '✦', s: { def: 4, dex: 1 } }, { n: 'Manto de Pele de Urso', g: 'm', icon: '✦', s: { def: 6, hp: 14 } }, { n: 'Manto do Lobisomem', g: 'm', icon: '✦', s: { def: 5, str: 1 } }, { n: 'Manto das Correntes', g: 'm', icon: '✦', s: { def: 6, hp: 8 } }, { n: 'Capa Ornamentada', g: 'f', icon: '✦', s: { def: 3, regen: 0.4 } }, { n: 'Capa do Corvo', g: 'f', icon: '✦', s: { def: 3, move: 2 } }],
  weapon: [{ n: 'Adaga', g: 'f', icon: '🗡️', s: { dmg: 6, crit: 3 } }, { n: 'Espada Curta', g: 'f', icon: '🗡️', s: { dmg: 9 } }, { n: 'Espada Longa', g: 'f', icon: '⚔️', s: { dmg: 13 } }, { n: 'Machado de Guerra', g: 'm', icon: '🪓', s: { dmg: 16 } }, { n: 'Martelo', g: 'm', icon: '🔨', s: { dmg: 18 } }, { n: 'Montante', g: 'm', icon: '⚔️', s: { dmg: 22 } },
    /* 23/10: machados, arcos e as armas de caminho */
    { n: 'Machado de Mão', g: 'm', icon: '🪓', s: { dmg: 11, crit: 2 } }, { n: 'Machado Barbado', g: 'm', icon: '🪓', s: { dmg: 14 } },
    { n: 'Arco Curto', g: 'm', icon: '🏹', s: { dmg: 9, dex: 2 } }, { n: 'Arco Longo', g: 'm', icon: '🏹', s: { dmg: 13, dex: 2 } },
    { n: 'Besta de Repetição', g: 'f', icon: '🏹', s: { dmg: 12, crit: 2 }, only: 'cac' },
    { n: 'Metralhadora de Mão', g: 'f', icon: '🔫', s: { dmg: 11 }, only: 'tec' }, { n: 'Lança-Chamas de Mão', g: 'm', icon: '🔥', s: { dmg: 12 }, only: 'tec' }, { n: 'Lança-Veneno de Mão', g: 'm', icon: '☣', s: { dmg: 12 }, only: 'tec' },
    { n: 'Martelo de Guerra Anão', g: 'm', icon: '🔨', s: { dmg: 24, str: 2 }, only: 'dwarf' }, { n: 'Machado Duplo Anão', g: 'm', icon: '🪓', s: { dmg: 23, crit: 2 }, only: 'dwarf' }],
  armor: [{ n: 'Gibão de Couro', g: 'm', icon: '🥋', s: { def: 6 } }, { n: 'Túnica Nórdica', g: 'f', icon: '👘', s: { def: 5, mp: 12 } }, { n: 'Cota de Malha', g: 'f', icon: '🦺', s: { def: 11 } }, { n: 'Armadura de Placas', g: 'f', icon: '🛡️', s: { def: 16 } }],
  shield: [{ n: 'Broquel', g: 'm', icon: '🔰', s: { def: 4 } }, { n: 'Escudo Redondo', g: 'm', icon: '🛡', s: { def: 8 } }, { n: 'Escudo Nórdico', g: 'm', icon: '🛡', s: { def: 10, hp: 10 } }, { n: 'Escudo Ogival', g: 'm', icon: '🛡', s: { def: 11, hp: 6 } }, { n: 'Escudo de Pipa', g: 'm', icon: '🛡', s: { def: 12 } }, { n: 'Escudo Torre', g: 'm', icon: '🛡️', s: { def: 14 } }],
  helm: [{ n: 'Capuz', g: 'm', icon: '🧢', s: { def: 2, mp: 8 } }, { n: 'Elmo de Couro', g: 'm', icon: '⛑️', s: { def: 4 } }, { n: 'Elmo Nórdico', g: 'm', icon: '⛑️', s: { def: 6 } }, { n: 'Elmo Alado', g: 'm', icon: '🪖', s: { def: 8, hp: 10 } }],
  boots: [{ n: 'Botas de Couro', g: 'f', icon: '🥾', s: { move: 3 } }, { n: 'Botas Peludas', g: 'f', icon: '🥾', s: { move: 2, def: 3 } }, { n: 'Grevas de Ferro', g: 'f', icon: '🥾', s: { def: 6 } }],
  ring: [{ n: 'Anel de Bronze', g: 'm', icon: '💍' }, { n: 'Anel de Prata', g: 'm', icon: '💍' }, { n: 'Anel Rúnico', g: 'm', icon: '💍' }],
  amulet: [{ n: 'Amuleto de Osso', g: 'm', icon: '📿' }, { n: 'Amuleto de Âmbar', g: 'm', icon: '📿' }, { n: 'Martelo de Thor', g: 'm', icon: '📿' }],
};
const ADJ: Record<StatKey, [string, string]> = { gen: ['Impetuoso', 'Impetuosa'], dmg: ['Afiado', 'Afiada'], def: ['Reforçado', 'Reforçada'], hp: ['Vital', 'Vital'], mp: ['Arcano', 'Arcana'], crit: ['Cruel', 'Cruel'], move: ['Veloz', 'Veloz'], regen: ['Revigorante', 'Revigorante'], leech: ['Sedento', 'Sedenta'], xp: ['Sábio', 'Sábia'], gold: ['Próspero', 'Próspera'], str: ['Poderoso', 'Poderosa'], dex: ['Ágil', 'Ágil'], vit: ['Robusto', 'Robusta'], int: ['Místico', 'Mística'] };
const EPI = ['do Corvo', 'da Geada', 'de Fenrir', 'do Trovão', 'das Brasas', 'do Crepúsculo', 'da Tempestade', 'do Lobo Cinzento', 'dos Antigos', 'da Aurora'];
const LEG = ['Presa de Fenrir', 'Coração de Odin', 'Aurora Rubra', 'Juramento de Tyr', 'Fúria de Thor', 'Véu das Nornas', 'Sombra de Loki', 'Último Inverno'];
const EPIC_T = ['da Vigília Eterna', 'do Juramento Antigo', 'das Mil Batalhas', 'do Crepúsculo Vivo', 'da Aurora Partida', 'do Último Inverno', 'dos Reis Esquecidos', 'do Caminho Perdido'];
let uid = 1;
export const syncUid = (n: number) => { if (n >= uid) uid = n + 1; };
export function plainGear(slot: Slot, base: string, icon: string, stats: Partial<Record<StatKey, number>>, ilvl = 1): Gear { return { uid: uid++, slot, icon, rarity: 'normal', name: base, base, ilvl, stats, value: Math.max(2, Math.round(Object.values(stats).reduce((a, b) => a + (b ?? 0), 0))) }; }
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

export function rollRarity(boost: Partial<Record<Rarity, number>> = {}): Rarity {
  const ws = (Object.keys(RARITY) as Rarity[]).map((r) => [r, RARITY[r].w * (boost[r] ?? 1)] as [Rarity, number]); let t = ws.reduce((s, [, w]) => s + w, 0) * Math.random();
  for (const [r, w] of ws) { if ((t -= w) <= 0) return r; } return 'normal';
}
export function genGear(ilvl: number, rarity: Rarity = rollRarity(), slot?: Slot): Gear {
  if (rarity === 'unique' || rarity === 'relic') { const g = named(rarity === 'relic' ? RELICS : UNIQUES, ilvl, rarity, slot); if (g) return g; rarity = 'epic'; } // acabaram (ou nível baixo demais): vira épico
  if (slot === 'relic') slot = undefined;
  const sl = slot ?? pick(['weapon', 'weapon', 'armor', 'armor', 'shield', 'helm', 'boots', 'ring', 'amulet', 'earring', 'shoulders', 'cape'] as Slot[]);
  const b = pick(BASES[sl]), R = RARITY[rarity], lv = 1 + ilvl * 0.09, stats: Partial<Record<StatKey, number>> = {};
  /* porcentagens (crítico, roubo de vida, velocidade, XP, ouro) dependem só da raridade, nunca do nível do item: senão viram 30% aos 45;
     regeneração e atributos crescem devagar; dano, defesa, vida e magia crescem com o nível */
  const LV = (k: StatKey) => PCT.has(k) ? 1 : k === 'regen' || ['str', 'dex', 'vit', 'int'].includes(k) ? 1 + ilvl * 0.03 : lv;
  for (const [k, v] of Object.entries(b.s ?? {}) as [StatKey, number][]) stats[k] = Math.round(v * LV(k) * (0.9 + R.q * 0.1) * 10) / 10;
  const n = Math.round(rnd(R.aff[0], R.aff[1])), pool = [...SLOT_AFF[sl]].sort(() => Math.random() - 0.5), got: StatKey[] = [];
  for (let i = 0; i < n && i < pool.length; i++) { const k = pool[i], [lo, hi] = AFF[k], v = rnd(lo, hi) * R.q * LV(k); stats[k] = Math.round(((stats[k] ?? 0) + v) * 10) / 10; got.push(k); }
  if (rarity === 'epic') for (const k of ['str', 'dex', 'vit', 'int'] as StatKey[]) stats[k] = Math.round((stats[k] ?? 0) + 2 + ilvl * 0.1); // épico: todos os atributos
  let special: string | undefined; if (rarity === 'legendary' || rarity === 'epic') special = pick(['burn', 'echo', 'frenzy', 'aegis', 'storm']);
  const fem = b.g === 'f'; let name = b.n;
  if (rarity === 'magic') name = `${b.n} ${ADJ[got[0] ?? 'dmg'][fem ? 1 : 0]}`;
  else if (rarity === 'rare') name = `${b.n} ${pick(EPI)}`;
  else if (rarity === 'legendary') name = `${pick(LEG)}`;
  else if (rarity === 'epic') name = `${b.n} ${pick(EPIC_T)}`;
  const value = Math.max(1, Math.round(R.val * (1 + ilvl * 0.18)));
  const nStats = Object.keys(stats).length; void nStats;
  return { uid: uid++, slot: sl, icon: b.icon, rarity, name, base: b.n, ilvl, stats, special, value, ...(b.only ? { only: b.only } : {}) };
}
/** nível de uso: o que estiver escrito na peça, ou 3 abaixo do nível do item */
export const reqLvl = (g: Gear) => g.req ?? Math.max(1, g.ilvl - 3);
/** quem está olhando a dica (nível e lado do herói) — o inventário mantém atualizado */
export const tipCtx: { lvl: number; fac: string | null; can?: (o: Only) => boolean } = { lvl: 1, fac: null };
const FAC_TIP: Record<string, string> = { fio: 'A Ordem do Fio', desf: 'Os Desfiados' };
export const gearTip = (g: Gear) => `${g.bound ? '<div class="rbind">🔒 Vinculado a este personagem</div>' : g.shop ? '<div class="rbind free">🛍 Do Shop · pode ir ao Leilão enquanto não for vestido</div>' : ''}<div class="rtag" style="color:${RARITY[g.rarity].col};border-color:${RARITY[g.rarity].col}66">${RARITY[g.rarity].name.toUpperCase()}</div><b style="color:${RARITY[g.rarity].col}">${g.name}</b><br><small>${g.base} · ${RSLOT[g.slot]} · item nível ${g.ilvl}</small><br><small class="${tipCtx.lvl < reqLvl(g) ? 'reqbad' : 'reqok'}">Nível de uso: ${reqLvl(g)}${tipCtx.lvl < reqLvl(g) ? ' — você ainda não pode usar' : ''}</small>${g.only ? `<br><small class="${tipCtx.can && !tipCtx.can(g.only) ? 'reqbad' : 'reqok'}">Só para ${ONLY_NAME[g.only]}${tipCtx.can && !tipCtx.can(g.only) ? ' — não é o seu caminho' : ''}</small>` : ''}${g.fac ? `<br><small class="${tipCtx.fac !== g.fac ? 'reqbad' : 'reqok'}">Brasão: ${FAC_TIP[g.fac]}${tipCtx.fac !== g.fac ? ' — só veste quem jurou este lado' : ''}</small>` : ''}<br>${Object.entries(g.stats).map(([k, v]) => `<span class="${['str', 'dex', 'vit', 'int'].includes(k) ? 'at' : ''}">${STAT_FMT(k as StatKey, v as number)}</span>`).join('<br>')}${g.special ? `<br><i style="color:${RARITY[g.rarity].col}">✦ ${SPECIAL[g.special]}</i>` : ''}${g.lore ? `<br><small style="color:#b8a888;font-style:italic">“${g.lore}”</small>` : ''}<br><small>Vale 🪙 ${g.value}</small>`;
export const RSLOT: Record<Slot, string> = { weapon: 'Arma', armor: 'Peitoral', shield: 'Escudo', helm: 'Elmo', boots: 'Botas', ring: 'Anel I', ring2: 'Anel II', amulet: 'Colar', relic: 'Relíquia', earring: 'Brinco I', earring2: 'Brinco II', shoulders: 'Ombreiras', cape: 'Capa' };

/* ---- ícones desenhados (em vez de emoji): traço na cor da raridade, um desenho por tipo de peça ---- */
const P: Record<string, string> = {
  sword: '<path d="M22 4l6 0 0 6-12 12-4-4z" fill="currentColor" fill-opacity=".25"/><path d="M22 4h6v6L16 22l-4-4z M10 18l4 4 M7 21l4 4 M5 27l3-3"/><path d="M8 17l7 7" stroke-width="2.4"/>',
  dagger: '<path d="M20 6l5 1-1 5-9 9-4-4z" fill="currentColor" fill-opacity=".25"/><path d="M20 6l5 1-1 5-9 9-4-4z M9 18l5 5 M7 25l4-4"/>',
  greatsword: '<path d="M24 2h6v6L14 24l-6-6z" fill="currentColor" fill-opacity=".25"/><path d="M24 2h6v6L14 24l-6-6z M6 16l10 10 M4 28l5-5"/>',
  axe: '<path d="M8 28L22 8" stroke-width="2.4"/><path d="M16 6c4-4 12-2 12 4-4 0-8 2-9 6z" fill="currentColor" fill-opacity=".3"/><path d="M16 6c4-4 12-2 12 4-4 0-8 2-9 6z"/>',
  hammer: '<path d="M8 28L20 12" stroke-width="2.4"/><path d="M14 6l10-2 4 8-10 4z" fill="currentColor" fill-opacity=".3"/><path d="M14 6l10-2 4 8-10 4z"/>',
  spear: '<path d="M4 28L24 8" stroke-width="2.2"/><path d="M22 4l6 0 0 6-4 2-4-4z" fill="currentColor" fill-opacity=".35"/><path d="M22 4l6 0 0 6-4 2-4-4z M17 11l4 4"/>',
  rifle: '<path d="M3 18h18l6-4h2v4l-4 3H14l-3 6H7l2-6H3z" fill="currentColor" fill-opacity=".25"/><path d="M3 18h18l6-4h2v4l-4 3H14l-3 6H7l2-6H3z M9 15h8"/>',
  bow: '<path d="M10 3c10 4 14 12 12 26" stroke-width="2.2"/><path d="M10 3l12 26" stroke-width="1"/><path d="M4 22L26 8 M22 7l5 0-1 5"/>',
  gun: '<path d="M3 13h20v-3h6v8h-6l-2 2h-6l-2 8H8l2-8H3z" fill="currentColor" fill-opacity=".25"/><path d="M3 13h20v-3h6v8h-6l-2 2h-6l-2 8H8l2-8H3z M23 12h6 M23 15h6"/>',
  flamer: '<path d="M3 16h14l4-3h3v8h-3l-4-3H11l-2 7H6l2-7H3z" fill="currentColor" fill-opacity=".25"/><path d="M3 16h14l4-3h3v8h-3l-4-3H11l-2 7H6l2-7H3z"/><path d="M26 14c3 1 4 3 3 5 2-1 2-4 0-6z" fill="currentColor"/>',
  staff: '<path d="M8 28L20 10" stroke-width="2.2"/><circle cx="23" cy="7" r="4" fill="currentColor" fill-opacity=".35"/><circle cx="23" cy="7" r="4"/><path d="M23 1v2 M29 7h-2 M27 3l-1 1"/>',
  crossbow: '<path d="M6 26L22 10" stroke-width="2.2"/><path d="M12 6c8 0 14 6 14 14" /><path d="M12 6l14 14" stroke-dasharray="2 2"/><path d="M20 8l4 4" stroke-width="2.4"/>',
  shield: '<circle cx="16" cy="16" r="11" fill="currentColor" fill-opacity=".2"/><circle cx="16" cy="16" r="11"/><circle cx="16" cy="16" r="3" fill="currentColor"/><path d="M16 5v8 M16 19v8 M5 16h8 M19 16h8" opacity=".6"/>',
  heater: '<path d="M6 5c7-2 13-2 20 0v8c0 7-4 12-10 15C10 25 6 20 6 13z" fill="currentColor" fill-opacity=".22"/><path d="M6 5c7-2 13-2 20 0v8c0 7-4 12-10 15C10 25 6 20 6 13z M16 4v24 M7 12h18"/>',
  tower: '<path d="M8 4h16v14c0 6-4 9-8 10-4-1-8-4-8-10z" fill="currentColor" fill-opacity=".2"/><path d="M8 4h16v14c0 6-4 9-8 10-4-1-8-4-8-10z M16 8v16 M11 13h10"/>',
  helm: '<path d="M6 19c0-8 4-13 10-13s10 5 10 13v3H6z" fill="currentColor" fill-opacity=".22"/><path d="M6 19c0-8 4-13 10-13s10 5 10 13v3H6z M16 6v16 M6 16h20 M6 8c-2-2-3-4-2-6 M26 8c2-2 3-4 2-6"/>',
  hood: '<path d="M8 26c0-10 3-20 8-20s8 10 8 20" fill="currentColor" fill-opacity=".22"/><path d="M8 26c0-10 3-20 8-20s8 10 8 20 M11 22c1-5 3-8 5-8s4 3 5 8"/>',
  winghelm: '<path d="M8 20c0-7 3-12 8-12s8 5 8 12v3H8z" fill="currentColor" fill-opacity=".22"/><path d="M8 20c0-7 3-12 8-12s8 5 8 12v3H8z M16 8v15 M8 14C4 12 2 8 2 5c3 1 6 4 6 6 M24 14c4-2 6-6 6-9-3 1-6 4-6 6"/>',
  chest: '<path d="M8 6l4-2h8l4 2 3 6-3 2v12H8V14l-3-2z" fill="currentColor" fill-opacity=".22"/><path d="M8 6l4-2h8l4 2 3 6-3 2v12H8V14l-3-2z M12 4c0 3 2 5 4 5s4-2 4-5 M16 9v17 M9 18h14"/>',
  mail: '<path d="M8 6l4-2h8l4 2 3 6-3 2v12H8V14l-3-2z" fill="currentColor" fill-opacity=".22"/><path d="M8 6l4-2h8l4 2 3 6-3 2v12H8V14l-3-2z"/><path d="M10 12h12 M10 16h12 M10 20h12 M10 24h12" stroke-dasharray="2 1.5" opacity=".8"/>',
  plate: '<path d="M7 7l5-3h8l5 3 2 6-3 2v11c-3 2-6 3-8 3s-5-1-8-3V15l-3-2z" fill="currentColor" fill-opacity=".25"/><path d="M7 7l5-3h8l5 3 2 6-3 2v11c-3 2-6 3-8 3s-5-1-8-3V15l-3-2z M16 7v21 M9 14c4 2 10 2 14 0"/>',
  tunic: '<path d="M10 4h12l5 8-4 2-1 14H10L9 14l-4-2z" fill="currentColor" fill-opacity=".22"/><path d="M10 4h12l5 8-4 2-1 14H10L9 14l-4-2z M13 4l3 5 3-5 M10 18h12"/>',
  boots: '<path d="M9 4h8v14l9 4v5H7l1-9z" fill="currentColor" fill-opacity=".22"/><path d="M9 4h8v14l9 4v5H7l1-9z M9 9h8 M7 23h19"/>',
  ring: '<circle cx="16" cy="19" r="8" fill="none"/><circle cx="16" cy="19" r="5.5" opacity=".5"/><path d="M12 9l4-5 4 5-4 3z" fill="currentColor" fill-opacity=".5"/><path d="M12 9l4-5 4 5-4 3z"/>',
  earring: '<path d="M14 3c3 0 4 2 4 4s-2 3-2 5"/><path d="M16 12l5 8-5 9-5-9z" fill="currentColor" fill-opacity=".35"/><path d="M16 12l5 8-5 9-5-9z"/>',
  amulet: '<path d="M6 4c0 8 4 12 10 13 6-1 10-5 10-13" fill="none"/><path d="M16 17l5 5-5 7-5-7z" fill="currentColor" fill-opacity=".35"/><path d="M16 17l5 5-5 7-5-7z"/>',
  shoulders: '<path d="M3 16c0-6 4-9 9-9v8c-4 0-7 2-9 5z M29 16c0-6-4-9-9-9v8c4 0 7 2 9 5z" fill="currentColor" fill-opacity=".25"/><path d="M3 16c0-6 4-9 9-9v8c-4 0-7 2-9 5z M29 16c0-6-4-9-9-9v8c4 0 7 2 9 5z M12 11h8"/>',
  cape: '<path d="M11 4h10l3 4 3 20-6-3-5 3-5-3-6 3 3-20z" fill="currentColor" fill-opacity=".22"/><path d="M11 4h10l3 4 3 20-6-3-5 3-5-3-6 3 3-20z"/><circle cx="16" cy="7" r="2" fill="currentColor"/>',
  chalice: '<path d="M8 4h16c0 8-3 12-8 12S8 12 8 4z" fill="currentColor" fill-opacity=".3"/><path d="M8 4h16c0 8-3 12-8 12S8 12 8 4z M16 16v8 M10 28h12 M12 24h8"/>',
  book: '<path d="M6 5h14l6 3v20H12l-6-3z" fill="currentColor" fill-opacity=".25"/><path d="M6 5h14l6 3v20H12l-6-3z M12 8v20 M16 14l4 4-4 4-4-4z"/>',
  eye: '<path d="M2 16c4-6 9-9 14-9s10 3 14 9c-4 6-9 9-14 9S6 22 2 16z" fill="currentColor" fill-opacity=".22"/><path d="M2 16c4-6 9-9 14-9s10 3 14 9c-4 6-9 9-14 9S6 22 2 16z"/><circle cx="16" cy="16" r="5" fill="currentColor"/>',
  heart: '<path d="M16 27C6 20 3 14 6 9c3-4 8-3 10 1 2-4 7-5 10-1 3 5 0 11-10 18z" fill="currentColor" fill-opacity=".3"/><path d="M16 27C6 20 3 14 6 9c3-4 8-3 10 1 2-4 7-5 10-1 3 5 0 11-10 18z M16 10v8 M12 14h8" opacity=".9"/>',
  feather: '<path d="M26 4C14 6 7 14 6 26c6-1 16-6 20-22z" fill="currentColor" fill-opacity=".25"/><path d="M26 4C14 6 7 14 6 26c6-1 16-6 20-22z M4 28L20 12 M12 14l3 3 M10 18l3 3"/>',
  ember: '<path d="M16 3c3 6 9 9 9 16a9 9 0 01-18 0c0-4 2-6 4-8 0 3 1 5 3 5 0-5 1-9 2-13z" fill="currentColor" fill-opacity=".35"/><path d="M16 3c3 6 9 9 9 16a9 9 0 01-18 0c0-4 2-6 4-8 0 3 1 5 3 5 0-5 1-9 2-13z"/>',
  gear: '<circle cx="16" cy="16" r="6" fill="currentColor" fill-opacity=".3"/><path d="M16 3v5 M16 24v5 M3 16h5 M24 16h5 M7 7l3.5 3.5 M21.5 21.5L25 25 M25 7l-3.5 3.5 M10.5 21.5L7 25"/><circle cx="16" cy="16" r="10"/><circle cx="16" cy="16" r="3"/>',
  skull: '<path d="M7 15c0-6 4-10 9-10s9 4 9 10c0 3-1 5-3 6v4H10v-4c-2-1-3-3-3-6z" fill="currentColor" fill-opacity=".22"/><path d="M7 15c0-6 4-10 9-10s9 4 9 10c0 3-1 5-3 6v4H10v-4c-2-1-3-3-3-6z"/><circle cx="12" cy="15" r="2.5" fill="currentColor"/><circle cx="20" cy="15" r="2.5" fill="currentColor"/><path d="M14 25v3 M18 25v3"/>',
  cross: '<path d="M13 3h6v8h8v6h-8v12h-6V17H5v-6h8z" fill="currentColor" fill-opacity=".3"/><path d="M13 3h6v8h8v6h-8v12h-6V17H5v-6h8z"/>',
  fang: '<path d="M8 5c4 0 8 2 8 6 0-4 4-6 8-6-1 9-4 18-8 22-4-4-7-13-8-22z" fill="currentColor" fill-opacity=".3"/><path d="M8 5c4 0 8 2 8 6 0-4 4-6 8-6-1 9-4 18-8 22-4-4-7-13-8-22z"/>',
  claw: '<path d="M6 26C6 16 10 8 14 4M12 27c0-9 4-16 8-20M18 28c0-7 3-13 8-17" stroke-width="2.4"/>',
};
const KEY_BY_BASE: [RegExp, string][] = [[/Lança-Chamas|Lança-Veneno/, 'flamer'], [/Adaga|Faca/, 'dagger'], [/Montante/, 'greatsword'], [/Espada|Lâmina/, 'sword'], [/Machado/, 'axe'], [/Martelo|Maça/, 'hammer'], [/Lança/, 'spear'], [/Rifle|Canhão|Pistola/, 'rifle'], [/Cajado|Bastão/, 'staff'], [/Besta/, 'crossbow'], [/Arco/, 'bow'], [/Metralhadora/, 'gun'], [/Garra/, 'claw'],
  [/Torre/, 'tower'], [/Ogival|Pipa/, 'heater'], [/Capuz/, 'hood'], [/Alado/, 'winghelm'], [/Cota/, 'mail'], [/Placas|Exoesqueleto/, 'plate'], [/Túnica|Manto Sacro|Batina/, 'tunic'], [/Cálice/, 'chalice'], [/Grimório|Livro/, 'book'], [/Olho/, 'eye'], [/Coração/, 'heart'], [/Pena/, 'feather'], [/Brasa/, 'ember'], [/Engrenagem/, 'gear'], [/Crânio|Caveira/, 'skull'], [/Cruz|Relicário|Sudário/, 'cross'], [/Presa|Dente/, 'fang']];
const KEY_BY_SLOT: Record<Slot, string> = { weapon: 'sword', armor: 'chest', shield: 'shield', helm: 'helm', boots: 'boots', ring: 'ring', ring2: 'ring', amulet: 'amulet', relic: 'chalice', earring: 'earring', earring2: 'earring', shoulders: 'shoulders', cape: 'cape' };
const svgOf = (k: string, col = 'currentColor') => `<svg class="gico" viewBox="0 0 32 32" fill="none" stroke="${col}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="color:${col}">${P[k] ?? P.sword}</svg>`;
/** ícone desenhado de uma peça (ou de um espaço vazio) */
/** brasões das facções (preenchido por faccoes.ts): peças com brasão mostram o brasão como ícone */
export const FAC_ICON: Record<string, string> = {};
export function gearIcon(g: Gear | null, slot?: Slot): string {
  if (!g) return svgOf(KEY_BY_SLOT[slot ?? 'weapon'], '#6a5a40');
  if (g.fac && FAC_ICON[g.fac]) return `<img class="gico fac" src="${FAC_ICON[g.fac]}" alt="" draggable="false">`;
  const byBase = KEY_BY_BASE.find(([re]) => re.test(g.base) || (!!g.uniq && re.test(g.name)))?.[1];
  const k = g.slot === 'relic' || g.slot === 'weapon' || g.slot === 'helm' || g.slot === 'armor' || g.slot === 'shield' ? byBase ?? KEY_BY_SLOT[g.slot] : KEY_BY_SLOT[g.slot];
  return svgOf(k, RARITY[g.rarity].col);
}
