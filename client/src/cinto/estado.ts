/* o que está no cinto: qual cinto, o que há em cada espaço e a regra de cada um. Sem tela aqui. */
import { cintoDe, cabe, ENDERECOS, POR_ESPACO, SEM_CINTO, type Cinto, type Regra, type Vaga, type Macro } from './dados';

const KEY = 'karmika.cinto.v1';
export interface Espaco { id: string; n: number; regra?: Regra }
interface Mem { /** o tamanho que o cinto vestido dá */ cols: number; andares: number; nome: string; esp: (Espaco | null)[]; /** 17/11: as quatro vagas de macro (dados.ts) */ macros?: Partial<Record<Vaga, Macro>>; /** cinto guardado no formato antigo (id do item), esperando virar peça de equipamento */ legado?: string }
let mem: Mem = { cols: SEM_CINTO.cols, andares: SEM_CINTO.andares, nome: SEM_CINTO.nome, esp: Array(ENDERECOS).fill(null) };
/** já existia um cinto guardado? (não: quem chama migra o acesso rápido antigo) */
export let cintoNovo = true;
try { const r = localStorage.getItem(KEY); if (r) { const m = JSON.parse(r) as Partial<Mem> & { cinto?: string }; const velho = m.cols === undefined ? cintoDe(m.cinto) : null;
  mem = { cols: velho?.cols ?? m.cols ?? 4, andares: velho?.andares ?? m.andares ?? 1, nome: velho?.nome ?? m.nome ?? SEM_CINTO.nome, esp: Array.from({ length: ENDERECOS }, (_, i) => m.esp?.[i] ?? null), macros: m.macros, legado: velho?.id || m.legado }; cintoNovo = false; } } catch { /* */ }
const salva = () => { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch { /* */ } };
export const salvaCinto = salva;
export const cintoAtual = (): Cinto => ({ id: '', nome: mem.nome, cols: mem.cols, andares: mem.andares });
/** o cinto antigo (item) que ainda precisa virar peça; quem chama cria a peça e avisa com legadoFeito() */
export const legado = () => mem.legado ?? '';
export function legadoFeito() { delete mem.legado; salva(); }
export const espaco = (i: number) => mem.esp[i] ?? null;
export const ondeEsta = (id: string) => mem.esp.findIndex((e) => e?.id === id);
/** o primeiro espaço vazio que existe neste cinto, ou -1 */
export const primeiroVazio = () => { const c = cintoAtual(); for (let i = 0; i < ENDERECOS; i++) if (cabe(c, i) && !mem.esp[i]) return i; return -1; };
/** põe até n unidades no espaço (junta com o que já houver do mesmo item); devolve quantas entraram */
export function poe(i: number, id: string, n: number): number { const c = cintoAtual(); if (!cabe(c, i) || n <= 0) return 0; const e = mem.esp[i]; if (e && e.id !== id) return 0; const cabem = POR_ESPACO - (e?.n ?? 0), q = Math.min(cabem, n); if (q <= 0) return 0; mem.esp[i] = { id, n: (e?.n ?? 0) + q, regra: e?.regra }; salva(); return q; }
/** tira n unidades do espaço; o espaço some quando zera e não tem regra, senão fica guardado vazio (a regra espera o reabastecimento) */
export function tira(i: number, n = 1): number { const e = mem.esp[i]; if (!e) return 0; const q = Math.min(e.n, n); e.n -= q; if (e.n <= 0 && !e.regra && !vagaDe(e.id)) mem.esp[i] = null; /* o item de uma vaga de macro guarda o lugar vazio, à espera do reabastecimento */ salva(); return q; }
/** esvazia o espaço e devolve o que havia */
export function solta(i: number): Espaco | null { const e = mem.esp[i]; mem.esp[i] = null; salva(); return e; }
export function poeRegra(i: number, r: Regra | null) { const e = mem.esp[i]; if (!e) return; if (r) e.regra = r; else { delete e.regra; if (e.n <= 0) mem.esp[i] = null; } salva(); }
/** o cinto mudou de tamanho (vestiu, tirou ou trocou a peça): guarda o tamanho novo e devolve o que não cabe mais */
export function ajusta(cols: number, andares: number, nome: string): Espaco[] { if (cols === mem.cols && andares === mem.andares && nome === mem.nome) return []; mem.cols = cols; mem.andares = andares; mem.nome = nome; const c = cintoAtual(), sobrou: Espaco[] = []; for (let i = 0; i < ENDERECOS; i++) if (mem.esp[i] && !cabe(c, i)) { sobrou.push(mem.esp[i]!); mem.esp[i] = null; } salva(); return sobrou; }

/* ---------- as vagas de macro (17/11) ---------- */
export const macro = (v: Vaga): Macro | null => mem.macros?.[v] ?? null;
/** em que vaga este item está, ou null */
export const vagaDe = (id: string): Vaga | null => (Object.keys(mem.macros ?? {}) as Vaga[]).find((v) => mem.macros![v]?.item === id) ?? null;
/** põe (ou tira, com null) o item e a regra de uma vaga; o mesmo item nunca fica em duas vagas */
export function poeMacro(v: Vaga, m: Macro | null) { mem.macros ??= {}; if (m) for (const o of Object.keys(mem.macros) as Vaga[]) if (o !== v && mem.macros[o]?.item === m.item) delete mem.macros[o]; if (m) mem.macros[v] = m; else delete mem.macros[v]; salva(); }
/** as regras antigas, que ficavam presas a cada espaço do cinto: devolve-as (para virarem vagas) e apaga */
export function regrasAntigas(): { id: string; regra: Regra }[] { const L: { id: string; regra: Regra }[] = []; for (const e of mem.esp) if (e?.regra) { L.push({ id: e.id, regra: e.regra }); delete e.regra; } if (L.length) { for (let i = 0; i < ENDERECOS; i++) if (mem.esp[i] && mem.esp[i]!.n <= 0) mem.esp[i] = null; salva(); } return L; }
