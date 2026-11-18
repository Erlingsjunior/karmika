/* ACESSO PELO NAVEGADOR (12/11, Erling: "joga online sem instalar; de graça até o nível 10; e uma versão com link fechado com senha para amigos e
   testadores jogarem direto, sem o bloqueio do nível 10").
   Quando o jogo roda num site (não no aplicativo, nem no computador de quem desenvolve) há dois modos:
     · VISITANTE: o jogo inteiro até o nível 10. Dali em diante a experiência para de contar e o jogo avisa.
     · CONVIDADO: quem abriu o link com o convite (?convite=CÓDIGO) ou digitou /convite CÓDIGO joga sem limite. Fica guardado neste navegador.
   O código do convite NÃO está no programa: só o resumo dele (SHA-256), como a senha do administrador. O administrador (/adm) também joga sem limite.
   Isto é uma trava de quem joga, não de quem altera o programa; a conta com e-mail e a compra entram quando o servidor de contas existir. */
import { isAdm, sha256 } from './admin';
const RESUMO = '8debec5ef1fb7b6b251322f96b43607dd965b0d75ebc0fb2c4fbdbf824042049', SAL = 'karmika-convite:', KEY = 'karmika.convite';
export const NIVEL_TESTE = 10;
const confere = (c: string) => sha256(SAL + c.trim().toLowerCase()) === RESUMO;
const desk = typeof window !== 'undefined' && !!(window as unknown as { karmikaDesktop?: unknown }).karmikaDesktop;
const q = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();
/** rodando num site de verdade (ou forçado com ?web=1, para testar no computador de quem desenvolve) */
export const ehWeb = !desk && typeof location !== 'undefined' && (q.get('web') === '1' || !/^(localhost|127\.|192\.168\.|10\.|\[?::1)/.test(location.hostname));
let convidado = false;
try { const c = q.get('convite'); if (c && confere(c)) { localStorage.setItem(KEY, c.trim().toLowerCase()); q.delete('convite'); history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : '') + location.hash); } /* o código some da barra de endereço */
  const s = localStorage.getItem(KEY); convidado = !!s && confere(s); } catch { /* */ }
/** o teste gratuito está valendo para este jogador */
export const emTeste = () => ehWeb && !convidado && !isAdm();
/** /convite CÓDIGO (devolve a frase para o chat) */
export function conviteComando(a: string[]): string { const c = a.join(' ').trim(); if (!ehWeb) return '✉ O convite só vale na versão do navegador. Aqui o jogo já é completo.';
  if (!c) return convidado ? '✉ Você entrou com convite: jogo completo, sem limite de nível.' : `✉ Você está no teste gratuito (até o nível ${NIVEL_TESTE}). Se tem um convite: /convite CÓDIGO`;
  if (!confere(c)) return '✉ Esse convite não confere.'; try { localStorage.setItem(KEY, c.toLowerCase()); } catch { /* */ } convidado = true; return '✉ Convite aceito: jogo completo, sem limite de nível. Bem-vindo, testador.'; }
let avisou = 0;
/** chamado quando a experiência seria dada: devolve true se o teste gratuito segurou (nível 10 alcançado) */
export function seguraXp(lvl: number, log: (t: string, c?: string) => void): boolean { if (!emTeste() || lvl < NIVEL_TESTE) return false;
  const now = Date.now(); if (now - avisou > 90000) { avisou = now; log(`✦ Fim do teste gratuito: você chegou ao nível ${NIVEL_TESTE}. O mundo continua aberto para andar, mas a experiência parou de contar. O jogo completo e os pacotes estão em karmikaonline.com. Se tem um convite: /convite CÓDIGO`, '#ffd27a'); }
  return true; }
