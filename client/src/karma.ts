/* ---------- O karma de Karmika (Erling, 27/10/2026) ----------
   Luz e sombra são POSIÇÕES, não bem e mal. Todo mundo nasce neutro (0); só o elfo nasce pendendo à luz (+35).
   - ALINHAMENTO: de −1000 a +1000. É o que o mundo lê (NPCs, guardas, inquisidor, eventos, o Olho).
   - Cada caminho tem a sua NATUREZA: ao entrar nele a alma vai direto para lá (vampiro −400, paladino +400…).
   - FRAQUEZA KÁRMICA: só perto do zero (a beira do precipício). "Baixar" não é diminuir o número: para quem é da sombra,
     piorar é subir em direção à luz; para quem é da luz, descer em direção à sombra. O zero é uma parede: só se atravessa
     pelo ritual da classe (rituais.ts), e quem atravessa vira Renegado ou Desgarrado sem ficar mais fraco.
     Castigo no balde da situação (regra 01): até −20% de dano feito e +15% de dano recebido, inteiro no zero.
   - Sem caminho (humano, anão, elfo) e o neutro não têm fraqueza kármica.
   - KARMA ACUMULADO (luz e sombra) sobe sem teto a vida inteira e é escrito na vida passada ao desencarnar. ---------- */
export const KMAX = 1000;
export const NATURE: Record<string, number> = { vam: -400, bru: -400, lob: -350, pal: 400, mag: 400, cac: 350, gue: 150, tec: 150 };
export const PATH_NAME: Record<string, string> = { vam: 'vampiro', bru: 'bruxo', lob: 'lobisomem', pal: 'paladino', mag: 'mago', cac: 'caçador de demônios', gue: 'guerreiro do Norte', tec: 'tecnocrata' };

/** faixas do alinhamento (para textos e para quem precisa de um rótulo) */
export function bandOf(a: number): { id: 'trevas' | 'sombrio' | 'neutro' | 'luminoso' | 'radiante'; name: string } {
  return a >= 500 ? { id: 'radiante', name: 'Luz radiante' } : a >= 100 ? { id: 'luminoso', name: 'Luminoso' } : a > -100 ? { id: 'neutro', name: 'Neutro' } : a > -500 ? { id: 'sombrio', name: 'Sombrio' } : { id: 'trevas', name: 'Trevas' };
}
/** lado do alinhamento: 1 luz, −1 sombra, 0 neutro (|a| < 100) */
export const sideOf = (a: number) => (a >= 100 ? 1 : a <= -100 ? -1 : 0);

/** o lado da casa da alma: a natureza do caminho, ou o contrário para quem atravessou (Renegado/Desgarrado) */
export const homeSide = (path: string | null, outcast: boolean) => { const c = path ? NATURE[path] ?? 0 : 0; return c ? Math.sign(c) * (outcast ? -1 : 1) : 0; };
/** a beira do precipício (27/10, Erling): a fraqueza só cresce perto do ZERO. Quem é da natureza começa a sofrer na metade
   do caminho até o neutro; a aberração (que atravessou e recomeçou em ±50) sofre abaixo de 50. No zero: fraqueza inteira.
   Estar do lado "invertido" NÃO enfraquece: a nova posição vira a casa. */
export function strainOf(a: number, path: string | null, outcast = false): number {
  const c = path ? NATURE[path] ?? 0 : 0; if (!c) return 0;
  const s = homeSide(path, outcast), R = outcast ? 50 : Math.abs(c) / 2, f = s * a;
  return Math.max(0, Math.min(1, 1 - f / R));
}
/** o castigo da fraqueza kármica (entra no balde da situação) */
export const strainMod = (k: number) => ({ dmg: -0.2 * k, taken: 0.15 * k });
