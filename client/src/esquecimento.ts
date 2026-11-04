/* PERGAMINHOS DO ESQUECIMENTO (04/11, Erling: "para zerar as skills e redistribuir é necessário comprar um scroll do esquecimento — um para cada
   tipo: habilidades, passivas, talentos. Feitos pelo herbalista/alquimista, mas na classe mago ou bruxo, que têm nível extra de alquimia").
   Redistribuir gasta o pergaminho do tipo; sem ele, o botão explica onde arrumar. */
export type ScrollId = 'esq_hab' | 'esq_pas' | 'esq_tal';
export const SCROLL_NAME: Record<ScrollId, string> = { esq_hab: 'Pergaminho do Esquecimento das Habilidades', esq_pas: 'Pergaminho do Esquecimento das Passivas', esq_tal: 'Pergaminho do Esquecimento dos Talentos' };
let inv: { has(id: string, n?: number): boolean; take(id: string, n?: number): boolean } | null = null, log: ((t: string, c?: string) => void) | null = null;
export function bindScrolls(i: typeof inv, l: typeof log) { inv = i; log = l; }
/** gasta um pergaminho; false (e avisa) se não tiver */
export function useScroll(id: ScrollId): boolean {
  if (inv?.take(id, 1)) return true;
  log?.(`📜 Para redistribuir é preciso um ${SCROLL_NAME[id]}. Magos e bruxos alquimistas fazem; a Tenda da Bruxa e a alquimista vendem.`, '#ffb27a'); return false;
}
