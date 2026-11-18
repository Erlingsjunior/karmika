/* PACOTES DO JOGO (Erling, 15/11: "coloca os pacotes dentro do Shop do jogo também; uma pessoa pode comprar o jogo normal e depois
   decidir fazer um upgrade para algum pacote… faça uma conta inteligente: se ela comprar o Pacote III e depois o Fundador, não dá para
   descontar o drone nem essas coisas, porque ela não está devolvendo esses itens; tem que descontar o que ela estará usando, o valor do
   jogo base por exemplo").
   A CONTA DO UPGRADE: quem já tem o jogo (por qualquer pacote) paga o pacote novo MENOS o valor do jogo base. Engenhocas e
   montarias do pacote antigo foram usados e não voltam, por isso não entram no desconto; o pacote novo entrega tudo de novo.
   Só existe upgrade para cima. Preços aprovados em 16/11 (documento pacotes-sem-premium-16-11). */
export const JOGO_BASE = 19.9;
export interface Pacote { id: string; apelido: string; nome: string; brl: number; /** o que vem escrito no cartão */ itens: string[]; /** o que chega no correio: item → quantos */ correio: Record<string, number>; /** montarias à escolha, resgatadas no Estábulo do Domador */ montarias: number }
export const PACOTES: Pacote[] = [
  /* 16/11 (Erling: "tirei o Premium do jogo, não temos mais Premium"): os pacotes não levam mais dias de Premium nem selos; os benefícios que
     eram do Premium chegam para todo jogador no Presente de Marghar. Conteúdo e preços aprovados em 16/11. */
  { id: 'base', apelido: 'O Caminhante', nome: 'Jogo Base', brl: 19.9, itens: ['O jogo completo, seu para sempre'], correio: {}, montarias: 0 },
  { id: 'p1', apelido: 'O Viajante', nome: 'Pacote I', brl: 24.9, itens: ['O jogo completo', 'Drone de Cura por 15 dias', 'Robô de Defesa por 15 dias'], correio: { drone_cura_d15: 1, escudo_auto_d15: 1 }, montarias: 0 },
  { id: 'p2', apelido: 'O Veterano', nome: 'Pacote II', brl: 29.9, itens: ['O jogo completo', 'Drone de Cura por 15 dias', 'Robô de Defesa por 15 dias', 'Bracelete de Choque por 15 dias'], correio: { drone_cura_d15: 1, escudo_auto_d15: 1, pulseira_choque_d15: 1 }, montarias: 0 },
  { id: 'p3', apelido: 'O Campeão', nome: 'Pacote III', brl: 49.9, itens: ['O jogo completo', 'Drone de Cura por 30 dias', 'Robô de Defesa por 30 dias', 'Bracelete de Choque por 30 dias', '1 montaria à sua escolha'], correio: { drone_cura_d30: 1, escudo_auto_d30: 1, pulseira_choque_d30: 1 }, montarias: 1 },
  { id: 'fundador', apelido: 'A Lenda', nome: 'Pacote Fundador', brl: 289.9, itens: ['O jogo completo', '2 de cada engenhoca, por 30 dias', '3 montarias, uma por raça', 'Aura, roupas, título e moldura de Fundador', 'Caixa com livro impresso, artbook impresso, mapa do jogo impresso em A2, trilha sonora e o jogo em pendrive'], correio: { drone_cura_d30: 2, escudo_auto_d30: 2, pulseira_choque_d30: 2 }, montarias: 3 },
];
const r2 = (n: number) => Math.round(n * 100) / 100;
/** quanto custa o pacote `alvo` para quem tem o pacote `tenho` (-1 = ainda não tem o jogo); null = não existe essa compra (igual ou para baixo) */
export function precoPacote(tenho: number, alvo: number): { brl: number; cheio: number; desconto: number; upgrade: boolean } | null {
  const P = PACOTES[alvo]; if (!P || alvo <= tenho) return null;
  const desconto = tenho >= 0 ? JOGO_BASE : 0;
  return { brl: r2(P.brl - desconto), cheio: P.brl, desconto, upgrade: tenho >= 0 };
}
/* o que a conta tem: por enquanto fica nesta máquina (o servidor e o Pix decidem depois) */
const KEY = 'karmika.pacote', KEYM = 'karmika.pacote.montarias';
/** quem joga pelo aplicativo instalado já comprou o jogo; pelo navegador é o teste, sem pacote nenhum */
const instalado = () => { try { return !!(globalThis as unknown as { karmikaDesktop?: unknown }).karmikaDesktop; } catch { return false; } };
export function meuPacote(): number { try { const v = localStorage.getItem(KEY); if (v !== null && v !== '') { const n = +v; if (Number.isInteger(n) && n >= -1 && n < PACOTES.length) return n; } } catch { /* */ } return instalado() ? 0 : -1; }
export function setMeuPacote(i: number) { try { localStorage.setItem(KEY, String(i)); } catch { /* */ } }
export function montariasDePacote(): number { try { return Math.max(0, Math.floor(+(localStorage.getItem(KEYM) || 0)) || 0); } catch { return 0; } }
export function somaMontarias(n: number) { try { localStorage.setItem(KEYM, String(Math.max(0, montariasDePacote() + n))); } catch { /* */ } }
