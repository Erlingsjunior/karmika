/* 08/11 HONRA KÁRMICA (Erling: "em cada cidade média e nas vilas de começo, NPCs que vendem itens fortes com pontos de honra; a gente vai fazendo
   missões e subindo a honra, e usa esses pontos para comprar itens poderosos de honra").
   A honra é uma moeda que não cai do bolso de ninguém: ganha-se fazendo o que precisa ser feito — missões entregues, elites e chefes derrubados,
   masmorras limpas, eventos vencidos. Gasta-se nos Guardiães da Honra: Comendador Aldric Vozalta (Karmika), Thrúd Marca-de-Ferro (Brasaforja),
   Sílvathir Lúmenar (Lithendel) e, mais tarde, nas cidades médias. A loja de honra vende peças ÉPICAS do nível de quem compra (nunca abaixo
   de rara), com preço em honra por espaço do corpo. */
const KEY = 'karmika.honra.v1';
let s: { pts: number; total: number } = { pts: 0, total: 0 };
try { const j = JSON.parse(localStorage.getItem(KEY) || 'null'); if (j && typeof j.pts === 'number') s = { pts: j.pts, total: j.total ?? j.pts }; } catch { /* */ }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* */ } };

let logFn: ((t: string, c?: string) => void) | null = null;
export const honorLog = (f: (t: string, c?: string) => void) => { logFn = f; };
export const honor = () => s.pts;
export const honorTotal = () => s.total;
/** patente pela honra acumulada na vida toda */
export const honorRank = () => { const t = s.total; return t >= 2000 ? 'Lenda da Honra' : t >= 900 ? 'Campeão' : t >= 400 ? 'Guardião' : t >= 150 ? 'Honrado' : t >= 40 ? 'Promissor' : 'Sem nome'; };
export function addHonor(n: number, why: string) { if (n <= 0) return; s.pts += n; s.total += n; save(); logFn?.(`🏅 +${n} Honra Kármica (${why}) — ${s.pts} no total`, '#ffd27a'); }
export function spendHonor(n: number): boolean { if (s.pts < n) return false; s.pts -= n; save(); return true; }
/** quanto vale cada feito */
export const HONOR_FOR = { quest: (lvl: number) => 4 + Math.round(lvl / 5), elite: 3, boss: 12, dungeon: 15, event: 10, raid: 40 };
/** o preço em honra de uma peça épica, por espaço do corpo */
export const HONOR_PRICE: Record<string, number> = { weapon: 90, shield: 70, armor: 80, helm: 60, boots: 50, gloves: 50, belt: 45, cape: 55, ring: 40, earring: 40, amulet: 60, relic: 75 };
export const honorPrice = (slot: string) => HONOR_PRICE[slot] ?? 60;
