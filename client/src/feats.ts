/** INSCRIÇÕES DE MARGHAR (conquistas).
 *  Lore: o Olho guarda tudo o que uma alma faz; mas algumas coisas ele não guarda só no karma — ele GRAVA.
 *  Os Caminhantes descobriram que, em cada relíquia, há linhas de runas que mudam sozinhas: são as Inscrições,
 *  os feitos de quem passou por ali. Elas não pesam na balança, não são luz nem sombra: são memória.
 *  Quem desencarna perde o nome, o ouro e o rosto — mas as Inscrições atravessam a Ampulheta. */
export type FeatCat = 'caminho' | 'lamina' | 'oficio' | 'alma' | 'vida';
export interface Feat { id: string; cat: FeatCat; name: string; desc: string; key: string; goal: number; xp?: number; gold?: number }
export const CATS: Record<FeatCat, { name: string; icon: string; lore: string }> = {
  caminho: { name: 'O Caminho', icon: '🧭', lore: 'Todo Caminhante começa com um passo. As relíquias lembram de quem as toca; as Fontes, de quem as olha.' },
  lamina: { name: 'A Lâmina', icon: '⚔', lore: 'Marghar não conta mortes. Conta motivos. Mas as pedras das relíquias contam os dois.' },
  oficio: { name: 'O Ofício', icon: '⚒', lore: 'O machado, a picareta, a faca e o alicate também escrevem. Mais devagar, e com mais paciência.' },
  alma: { name: 'A Alma', icon: '👁', lore: 'O que o Olho viu e cobrou. Escolhas que não se desfazem, mortes que não terminam.' },
  vida: { name: 'A Vida', icon: '🏅', lore: 'Níveis, ouro, missões: a parte da vida que os vivos medem e o Olho só observa.' },
};
const F = (cat: FeatCat, id: string, name: string, desc: string, key: string, goal: number, xp = 0.06, gold = 0): Feat => ({ cat, id, name, desc, key, goal, xp, gold });
export const FEATS: Feat[] = [
  // O Caminho (15)
  F('caminho', 'c_vil3', 'Pés na Estrada', 'Visite 3 vilas.', 'villages', 3),
  F('caminho', 'c_vil10', 'Andarilho', 'Visite 10 vilas.', 'villages', 10, 0.12),
  F('caminho', 'c_vil25', 'Caminhante de Verdade', 'Visite 25 vilas e cidades.', 'villages', 25, 0.3, 200),
  F('caminho', 'c_reg5', 'Mapa Vivo', 'Pise em 5 regiões diferentes.', 'regions', 5),
  F('caminho', 'c_reg15', 'Todos os Cantos', 'Pise em 15 regiões diferentes.', 'regions', 15, 0.3, 200),
  F('caminho', 'c_rel1', 'A Pedra Lembra', 'Toque uma relíquia dos Caminhantes.', 'relics', 1),
  F('caminho', 'c_rel10', 'Rede de Pedras', 'Conheça 10 relíquias.', 'relics', 10, 0.12),
  F('caminho', 'c_rel25', 'Véu Atravessado', 'Conheça 25 relíquias.', 'relics', 25, 0.3, 150),
  F('caminho', 'c_vis1', 'Olhos na Fonte', 'Jogue uma moeda numa Fonte da Visão.', 'vistas', 1),
  F('caminho', 'c_vis8', 'Visionário', 'Descubra 8 Fontes da Visão.', 'vistas', 8, 0.15),
  F('caminho', 'c_vis15', 'Tudo o que o Olho Viu', 'Descubra 15 Fontes da Visão.', 'vistas', 15, 0.35, 250),
  F('caminho', 'c_home', 'Lar é onde a Fonte Está', 'Escolha uma fonte-lar.', 'homes', 1),
  F('caminho', 'c_ride', 'Cavaleiro', 'Monte numa montaria.', 'rides', 1),
  F('caminho', 'c_viking', 'Nas Montanhas de Odin', 'Chegue à Montanha Viking.', 'r_Montanha Viking', 1, 0.1),
  F('caminho', 'c_vulcao', 'Calor do Coração', 'Chegue ao Coração da Montanha Negra.', 'r_Coração da Montanha Negra', 1, 0.15),
  // A Lâmina (14)
  F('lamina', 'l_1', 'Primeiro Sangue', 'Derrote o primeiro inimigo.', 'kills', 1, 0.03),
  F('lamina', 'l_100', 'Caçador', 'Derrote 100 inimigos.', 'kills', 100, 0.1),
  F('lamina', 'l_1000', 'Matador', 'Derrote 1000 inimigos.', 'kills', 1000, 0.4, 300),
  F('lamina', 'l_rat', 'Ratoeiro', 'Derrote 25 ratazanas.', 'k_rat', 25),
  F('lamina', 'l_wolf', 'Uivo Calado', 'Derrote 50 lobos.', 'k_wolves', 50, 0.1),
  F('lamina', 'l_imp', 'Exorcista', 'Derrote 50 diabretes.', 'k_imp', 50, 0.1),
  F('lamina', 'l_undead', 'Ossos ao Pó', 'Derrote 50 mortos-vivos.', 'k_undead', 50, 0.12),
  F('lamina', 'l_elite', 'Elite', 'Derrote um elite.', 'elites', 1, 0.1),
  F('lamina', 'l_elite10', 'Quebrador de Elites', 'Derrote 10 elites.', 'elites', 10, 0.3, 200),
  F('lamina', 'l_davi', 'Davi', 'Derrote um inimigo 5 níveis acima do seu.', 'k_up5', 1, 0.1),
  F('lamina', 'l_golias', 'Golias Caído', 'Derrote um inimigo 10 níveis acima do seu.', 'k_up10', 1, 0.25),
  F('lamina', 'l_wer', 'Prata e Lua', 'Derrote um lobisomem.', 'k_werewolf', 1, 0.15),
  F('lamina', 'l_crypt', 'Fundo das Criptas', 'Desça ao 4º andar da Catedral Abandonada.', 'crypt', 4, 0.15),
  F('lamina', 'l_bishop', 'Purificador', 'Derrube o senhor da Catedral Abandonada.', 'k_boss_cat', 1, 0.4, 300),
  // O Ofício (16)
  F('oficio', 'o_tree', 'Lenhador', 'Derrube uma árvore.', 'trees', 1, 0.03),
  F('oficio', 'o_tree50', 'Derrubador de Florestas', 'Derrube 50 árvores.', 'trees', 50, 0.15),
  F('oficio', 'o_rock', 'Primeira Pedra', 'Rache uma rocha inteira.', 'rocks', 1, 0.03),
  F('oficio', 'o_rock50', 'Mineiro', 'Rache 50 rochas.', 'rocks', 50, 0.15),
  F('oficio', 'o_ore', 'Veio de Ferro', 'Tire 10 minérios de ferro.', 'ore_i', 10, 0.08),
  F('oficio', 'o_silver', 'Prata da Montanha', 'Tire 5 minérios de prata.', 'ore_ag', 5, 0.12),
  F('oficio', 'o_gem', 'Luz Presa', 'Encontre uma gema bruta.', 'gem', 1, 0.12),
  F('oficio', 'o_skin', 'Esfolador', 'Esfole 10 feras.', 'skins', 10, 0.06),
  F('oficio', 'o_hidef', 'Couro Inteiro', 'Tire 5 couros finos.', 'hide_f', 5, 0.1),
  F('oficio', 'o_herb', 'Herborista', 'Colha 25 ervas.', 'herbs', 25, 0.08),
  F('oficio', 'o_marghar', 'Flor de Marghar', 'Colha uma Flor-de-Marghar.', 'herb_m', 1, 0.15),
  F('oficio', 'o_fish', 'Pescador', 'Pesque 25 peixes.', 'fish', 25, 0.08),
  F('oficio', 'o_gold', 'Salmão Dourado', 'Pesque um Salmão Dourado.', 'fish_g', 1, 0.12),
  F('oficio', 'o_craft', 'Artesão', 'Crie 10 itens.', 'crafts', 10, 0.06),
  F('oficio', 'o_build', 'Construtor', 'Erga 20 peças de construção.', 'built', 20, 0.1),
  F('oficio', 'o_tools', 'Mestre das Ferramentas', 'Tenha as 5 ferramentas de ofício de ferro ou melhor.', 'tools2', 5, 0.2, 100),
  // A Alma (11)
  F('alma', 'a_eye', 'O Olho se Abre', 'Chegue ao nível 20 e veja o Olho despertar.', 'eye', 1, 0),
  F('alma', 'a_mercy', 'Misericórdia', 'Poupe 5 inimigos rendidos.', 'spared', 5, 0.12),
  F('alma', 'a_firm', 'Mão Firme', 'Termine o que começou com 5 inimigos rendidos.', 'executed', 5, 0.12),
  F('alma', 'a_incorr', 'Incorruptível', 'Recuse 3 subornos.', 'bribe_no', 3, 0.15),
  F('alma', 'a_sold', 'Tudo Tem Preço', 'Aceite um suborno.', 'bribe_yes', 1, 0.02),
  F('alma', 'a_hunt', 'Justiça Tardia', 'Encontre quem mentiu e fugiu.', 'hunts', 1, 0.15),
  F('alma', 'a_tear', 'Lágrima', 'Faça o Olho transbordar num ato heroico.', 'heroic', 1, 0.15),
  F('alma', 'a_dark', 'Sombra Longa', 'Chegue a alinhamento −300.', 'darkness', 300, 0.1),
  F('alma', 'a_comp', 'Compêndio', 'Tenha 10 decisões gravadas no Compêndio do Karma.', 'choices', 10, 0.1),
  F('alma', 'a_die', 'Desencarnar', 'Morra pela primeira vez.', 'deaths', 1, 0.02),
  F('alma', 'a_seven', 'Sete Vidas', 'Morra 7 vezes e volte todas.', 'deaths', 7, 0.08),
  // A Vida (13)
  F('vida', 'v_l5', 'Aprendiz', 'Chegue ao nível 5.', 'level', 5, 0),
  F('vida', 'v_l10', 'Iniciado', 'Chegue ao nível 10.', 'level', 10, 0, 50),
  F('vida', 'v_l20', 'Visto pelo Olho', 'Chegue ao nível 20.', 'level', 20, 0, 150),
  F('vida', 'v_l40', 'Veterano', 'Chegue ao nível 40.', 'level', 40, 0, 400),
  F('vida', 'v_l60', 'Lenda de Karmika', 'Chegue ao nível 60.', 'level', 60, 0, 1000),
  F('vida', 'v_q10', 'Diário em Uso', 'Conclua 10 missões.', 'quests', 10, 0.08),
  F('vida', 'v_q50', 'Diário Cheio', 'Conclua 50 missões.', 'quests', 50, 0.25, 200),
  F('vida', 'v_q100', 'Cem Promessas', 'Conclua 100 missões.', 'quests', 100, 0.4, 500),
  F('vida', 'v_g1k', 'Bolso Pesado', 'Junte 1000 moedas.', 'goldmax', 1000, 0.05),
  F('vida', 'v_g10k', 'Mercador de Askavik', 'Junte 10000 moedas.', 'goldmax', 10000, 0.2),
  F('vida', 'v_bags', 'Mochila de Viajante', 'Use 3 bolsas.', 'bags', 3, 0.05),
  F('vida', 'v_pet', 'Companheiro', 'Tenha um companheiro que busca itens.', 'pets', 1, 0.05),
  F('vida', 'v_full', 'Armado até os Dentes', 'Use equipamento nos 7 espaços do corpo.', 'eqslots', 7, 0.1),
];
const KEY = 'karmika.feats.v1';
export function createFeats(ctx: { xp(frac: number): void; gold(n: number): void; toast(f: Feat): void }) {
  let st: { c: Record<string, number>; done: Record<string, number>; seen: string[] } = { c: {}, done: {}, seen: [] };
  try { st = { c: {}, done: {}, seen: [], ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { /* */ }
  let dirty = false;
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch { /* */ } dirty = false; };
  function check(key: string) {
    for (const f of FEATS) if (f.key === key && !st.done[f.id] && (st.c[key] ?? 0) >= f.goal) { st.done[f.id] = Date.now(); if (f.xp) ctx.xp(f.xp); if (f.gold) ctx.gold(f.gold); ctx.toast(f); dirty = true; }
  }
  return {
    FEATS, CATS,
    /** soma n ao contador */
    bump(key: string, n = 1) { st.c[key] = (st.c[key] ?? 0) + n; dirty = true; check(key); },
    /** guarda o maior valor já visto (nível, ouro, relíquias...) */
    max(key: string, v: number) { if (v > (st.c[key] ?? 0)) { st.c[key] = v; dirty = true; check(key); } },
    /** marca um item único de uma coleção (vila visitada, região pisada) e atualiza a contagem */
    mark(set: string, item: string, countKey: string) { const k = `${set}:${item}`; if (st.seen.includes(k)) return; st.seen.push(k); st.c[countKey] = (st.c[countKey] ?? 0) + 1; dirty = true; check(countKey); },
    count: (key: string) => st.c[key] ?? 0, isDone: (id: string) => !!st.done[id], doneCount: () => Object.keys(st.done).length,
    tick() { if (dirty) save(); },
  };
}
