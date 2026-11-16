/* o que o jogador tem de títulos e molduras, qual está em uso e a trava de 5 dias das marcas. Sem tela aqui: só regra e memória. */
import { TITULOS, tituloDe, DIAS_DE_MARCA } from './dados';
import { MOLDURAS } from './molduras';

const KEY = 'karmika.titulos.v1';
interface Mem { /** título do catálogo → quando chegou */ got: Record<string, number>; /** títulos de missão e de voto, pelo nome → quando */ livres: Record<string, number>; /** em uso: id do catálogo ou 'q:' + nome; null = sem título */ ativo: string | null; /** até quando a marca prende */ trava: number; mold: string }
let mem: Mem = { got: {}, livres: {}, ativo: null, trava: 0, mold: 'madeira' };
try { mem = { ...mem, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { /* */ }
const salva = () => { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch { /* */ } };

/** o que vem de fora: Inscrições, lado jurado, pacote e o relógio (o teste adianta o relógio) */
export interface Fontes { feito(id: string): boolean; /** quanto marca um contador das Inscrições */ conta(chave: string): number; lado(): 'fio' | 'desf' | null; pacote(): number; agora?(): number }
let F: Fontes = { feito: () => false, conta: () => 0, lado: () => null, pacote: () => -1 };
const agora = () => F.agora?.() ?? Date.now();
type Aviso = (ev: { tipo: 'ganhou' | 'marca' | 'trocou' | 'moldura'; nome: string }) => void;
const ouvintes: Aviso[] = [];
export const onTitulos = (fn: Aviso) => { ouvintes.push(fn); };
const avisa = (tipo: Parameters<Aviso>[0]['tipo'], nome: string) => { for (const fn of ouvintes) { try { fn({ tipo, nome }); } catch { /* */ } } };

const nomeDe = (id: string | null) => !id ? '' : id.startsWith('q:') ? id.slice(2) : tituloDe(id)?.nome ?? '';
const tenho = (id: string) => id.startsWith('q:') ? !!mem.livres[id.slice(2)] : !!mem.got[id];

/** liga as fontes e põe em dia o que já foi feito antes de o sistema existir (sem impor nada: o ato é antigo) */
export function ligaTitulos(f: Fontes) { F = f; let mudou = false;
  for (const t of TITULOS) if (!mem.got[t.id] && ((t.feito && f.feito(t.feito)) || (t.cont && f.conta(t.cont[0]) >= t.cont[1]) || (t.id === 'fundador' && f.pacote() >= 4))) { mem.got[t.id] = agora(); mudou = true; }
  if (mudou) salva(); }
/** ganhou um título do catálogo. A MARCA vira o título em uso e prende por 5 dias; o LIVRE só entra em uso se não havia nenhum. */
export function ganhaTitulo(id: string): boolean { const t = tituloDe(id); if (!t || (mem.got[id] && !t.marca)) return false; /* a marca repetida (trair de novo) prende de novo */ mem.got[id] = agora();
  if (t.marca) { mem.ativo = id; mem.trava = agora() + DIAS_DE_MARCA * 864e5; salva(); avisa('marca', t.nome); return true; }
  if (!mem.ativo && !travado()) mem.ativo = id; salva(); avisa('ganhou', t.nome); return true; }
/** a Inscrição foi gravada: entrega o título ligado a ela, se houver */
export function tituloDoFeito(feito: string) { for (const t of TITULOS) if (t.feito === feito) ganhaTitulo(t.id); }
/** olha os contadores das Inscrições e entrega os títulos que já foram alcançados (chamado de tempos em tempos) */
export function confereContadores() { for (const t of TITULOS) if (t.cont && !mem.got[t.id] && F.conta(t.cont[0]) >= t.cont[1]) ganhaTitulo(t.id); }
/** título dado por missão ou por voto (o nome é o da missão). Entra em uso na hora, a não ser que uma marca esteja prendendo. */
export function ganhaLivre(nome: string): boolean { if (!nome) return false; const novo = !mem.livres[nome]; if (novo) mem.livres[nome] = agora();
  if (!travado()) mem.ativo = 'q:' + nome; salva(); if (novo) avisa('ganhou', nome); return novo; }
export const travado = () => mem.trava > agora();
/** quanto falta para poder trocar (ms) */
export const travaResta = () => Math.max(0, mem.trava - agora());
/** o jogador escolhe na página de títulos; null = andar sem título. Recusa enquanto a marca prende. */
export function escolheTitulo(id: string | null): boolean { if (travado()) return false; if (id && !tenho(id)) return false; mem.ativo = id; salva(); avisa('trocou', nomeDe(id)); return true; }
export const tituloAtivo = () => { const id = mem.ativo && tenho(mem.ativo) ? mem.ativo : null; return id ? { id, nome: nomeDe(id), marca: !!tituloDe(id)?.marca } : null; };
/** todos os que o jogador tem: do catálogo e os de missão */
export const meusTitulos = () => [...TITULOS.filter((t) => mem.got[t.id]).map((t) => ({ id: t.id, nome: t.nome, quando: mem.got[t.id] })), ...Object.entries(mem.livres).map(([nome, quando]) => ({ id: 'q:' + nome, nome, quando }))];
export const temTitulo = tenho;

/* ---------- molduras ---------- */
export const temMoldura = (id: string) => { const m = MOLDURAS.find((x) => x.id === id); if (!m) return false; if (m.feito) return F.feito(m.feito); if (m.lado) return F.lado() === m.lado; if (m.pacote !== undefined) return F.pacote() >= m.pacote; return true; };
/** a moldura em uso (se o jogador perdeu o direito, por exemplo trocou de lado, volta para a madeira) */
export const molduraAtiva = () => temMoldura(mem.mold) ? mem.mold : 'madeira';
export function escolheMoldura(id: string): boolean { if (!temMoldura(id)) return false; mem.mold = id; salva(); avisa('moldura', MOLDURAS.find((m) => m.id === id)!.nome); return true; }
