/* CLIQUE 1 E CLIQUE 2 (Erling, 16/11: "o clique esquerdo do mouse será para bater tanto quanto para andar, depende de como estamos; o botão
   direito será uma skill, escudo, ou o que quer que seja; na barra de magia temos slot Clique 1 e slot Clique 2").
   Cada botão do mouse aponta para uma magia que já está na barra. Aqui fica só a escolha (por classe) e o padrão; quem usa é sistemas/entrada.ts. */
/** o que este módulo precisa saber de uma magia */
interface Magia { id: string }

const KEY = (race: string) => `karmika.clique.${race}`;
/** o padrão: o esquerdo bate (o golpe básico); o direito levanta a guarda de quem tem guarda, senão usa a segunda magia da classe */
export function cliquePadrao(kit: Magia[]): [string, string] { const c1 = kit.find((s) => s.id === 'combo')?.id ?? kit[0]?.id ?? '', c2 = kit.find((s) => s.id === 'guard')?.id ?? kit.find((s) => s.id !== c1)?.id ?? c1; return [c1, c2]; }
export function cliques(race: string, kit: Magia[]): [string, string] { const pad = cliquePadrao(kit); try { const a = JSON.parse(localStorage.getItem(KEY(race)) || 'null') as string[] | null; if (Array.isArray(a)) return [kit.some((s) => s.id === a[0]) ? a[0] : pad[0], kit.some((s) => s.id === a[1]) ? a[1] : pad[1]]; } catch { /* */ } return pad; }
export function setClique(race: string, kit: Magia[], n: 1 | 2, id: string) { const c = cliques(race, kit); c[n - 1] = id; try { localStorage.setItem(KEY(race), JSON.stringify(c)); } catch { /* */ } }
/** as teclas de batalha: com um bicho em foco, Q, E e R valem pelas casas 4, 5 e 6 da barra (fora da batalha, E interage e R liga a corrida) */
export const TECLA_DE_BATALHA: Record<string, string> = { q: '4', e: '5', r: '6' };
