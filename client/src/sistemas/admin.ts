/* MODO ADMINISTRADOR (12/11, Erling: "o botão do Claude só aparece para mim; eu ponho /adm e a minha senha e entro como admin, aí ligo tudo o que tenho
   hoje: modo deus, a tela do servidor, o /help com os truques de ouro e de mudança de classe. Vêm os beta testers e eles não podem ter isso, só a tela
   de bug").
   Sem admin, o jogador tem o jogo, os gestos (/dance, /beber), o /layout e o inseto de relatar bug. Com admin (/adm SENHA) voltam: os comandos de teste
   (/nivel, /gold, /classe, /ir, /travadas…), as teclas de teste (G modo deus, H dano em si, Shift+F5 a F7 troca de raça), o botão ✳ do Olho do Claude e,
   jogando numa sala, o painel do dono (F11).
   A senha NÃO está no código: aqui fica só o resumo dela (SHA-256). No computador de quem digitou, a senha fica guardada para o admin continuar ligado
   depois de recarregar; /adm sair desliga e apaga. Isto tranca o jogo para quem joga, não para quem altera o próprio programa: o que vale dinheiro ou
   afeta os outros (painel do dono, bugs, avisos) continua conferido pela SALA, que recebe a senha e confere do lado dela. */
const RESUMO = 'de51ccea6a0e2ed64af31c9531a6410a54932cb8b3dd477fd5cc24d844abecca', SAL = 'karmika:', KEY = 'karmika.adm';
/** SHA-256 em texto (a função do navegador só existe em página segura, e a sala caseira roda em http) */
export function sha256(txt: string): string { const K = new Uint32Array(64), H = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]);
  { let n = 0, c = 2; const fr = (x: number) => ((x - Math.floor(x)) * 4294967296) | 0; while (n < 64) { let p = true; for (let d = 2; d * d <= c; d++) if (c % d === 0) { p = false; break; } if (p) K[n++] = fr(Math.cbrt(c)); c++; } }
  const b = new TextEncoder().encode(txt), L = b.length, tot = (((L + 9) >> 6) + 1) << 6, m = new Uint8Array(tot); m.set(b); m[L] = 0x80; const dv = new DataView(m.buffer); dv.setUint32(tot - 4, L * 8); dv.setUint32(tot - 8, Math.floor(L / 536870912));
  const w = new Uint32Array(64), rr = (x: number, n: number) => (x >>> n) | (x << (32 - n));
  for (let o = 0; o < tot; o += 64) { for (let i = 0; i < 16; i++) w[i] = dv.getUint32(o + i * 4); for (let i = 16; i < 64; i++) { const s0 = rr(w[i - 15], 7) ^ rr(w[i - 15], 18) ^ (w[i - 15] >>> 3), s1 = rr(w[i - 2], 17) ^ rr(w[i - 2], 19) ^ (w[i - 2] >>> 10); w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0; }
    let [a, b2, c, d, e, f, g, h] = H as unknown as number[];
    for (let i = 0; i < 64; i++) { const S1 = rr(e, 6) ^ rr(e, 11) ^ rr(e, 25), ch = (e & f) ^ (~e & g), t1 = (h + S1 + ch + K[i] + w[i]) | 0, S0 = rr(a, 2) ^ rr(a, 13) ^ rr(a, 22), mj = (a & b2) ^ (a & c) ^ (b2 & c), t2 = (S0 + mj) | 0; h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b2; b2 = a; a = (t1 + t2) | 0; }
    H[0] += a; H[1] += b2; H[2] += c; H[3] += d; H[4] += e; H[5] += f; H[6] += g; H[7] += h; }
  return Array.from(H, (x) => x.toString(16).padStart(8, '0')).join(''); }
const confere = (senha: string) => sha256(SAL + senha) === RESUMO;
let adm = false; const ouvintes: ((on: boolean) => void)[] = [];
const aplica = (on: boolean) => { adm = on; try { document.body.classList.toggle('kadm', on); } catch { /* */ } for (const f of ouvintes) { try { f(on); } catch { /* */ } } };
try { const s = localStorage.getItem(KEY); if (s && confere(s)) adm = true; } catch { /* */ }
if (typeof document !== 'undefined') { const marca = () => document.body?.classList.toggle('kadm', adm); if (document.body) marca(); else addEventListener('DOMContentLoaded', marca); }
export const isAdm = () => adm;
/** a senha guardada neste computador (para mandar à sala), ou '' */
export const admSenha = (): string => { try { const s = localStorage.getItem(KEY) ?? ''; return s && confere(s) ? s : ''; } catch { return ''; } };
export const onAdm = (f: (on: boolean) => void) => { ouvintes.push(f); };
/** /adm SENHA · /adm sair. Devolve a frase para o chat */
export function admComando(a: string[]): string { const s = a.join(' ').trim();
  if (!s) return adm ? '🔑 Você está como administrador. /adm sair desliga.' : '🔑 Uso: /adm SENHA';
  if (/^(sair|off|desligar)$/i.test(s)) { try { localStorage.removeItem(KEY); } catch { /* */ } aplica(false); return '🔑 Modo administrador desligado.'; }
  if (!confere(s)) return '🔑 Senha de administrador errada.';
  try { localStorage.setItem(KEY, s); } catch { /* */ } aplica(true); return '🔑 Modo administrador LIGADO: comandos de teste (/ajuda), tecla G (modo deus), botão ✳ do Olho do Claude e, numa sala, o painel do dono (F11). /adm sair desliga.'; }
