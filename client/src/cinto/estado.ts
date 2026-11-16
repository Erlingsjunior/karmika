/* o que está no cinto: qual cinto, o que há em cada espaço e a regra de cada um. Sem tela aqui. */
import { cintoDe, cabe, ENDERECOS, POR_ESPACO, type Cinto, type Regra } from './dados';

const KEY = 'karmika.cinto.v1';
export interface Espaco { id: string; n: number; regra?: Regra }
interface Mem { cinto: string; esp: (Espaco | null)[] }
let mem: Mem = { cinto: '', esp: Array(ENDERECOS).fill(null) };
/** já existia um cinto guardado? (não: quem chama migra o acesso rápido antigo) */
export let cintoNovo = true;
try { const r = localStorage.getItem(KEY); if (r) { const m = JSON.parse(r) as Mem; mem = { cinto: m.cinto || '', esp: Array.from({ length: ENDERECOS }, (_, i) => m.esp?.[i] ?? null) }; cintoNovo = false; } } catch { /* */ }
const salva = () => { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch { /* */ } };
export const salvaCinto = salva;
export const cintoAtual = (): Cinto => cintoDe(mem.cinto);
export const espaco = (i: number) => mem.esp[i] ?? null;
export const ondeEsta = (id: string) => mem.esp.findIndex((e) => e?.id === id);
/** o primeiro espaço vazio que existe neste cinto, ou -1 */
export const primeiroVazio = () => { const c = cintoAtual(); for (let i = 0; i < ENDERECOS; i++) if (cabe(c, i) && !mem.esp[i]) return i; return -1; };
/** põe até n unidades no espaço (junta com o que já houver do mesmo item); devolve quantas entraram */
export function poe(i: number, id: string, n: number): number { const c = cintoAtual(); if (!cabe(c, i) || n <= 0) return 0; const e = mem.esp[i]; if (e && e.id !== id) return 0; const cabem = POR_ESPACO - (e?.n ?? 0), q = Math.min(cabem, n); if (q <= 0) return 0; mem.esp[i] = { id, n: (e?.n ?? 0) + q, regra: e?.regra }; salva(); return q; }
/** tira n unidades do espaço; o espaço some quando zera e não tem regra, senão fica guardado vazio (a regra espera o reabastecimento) */
export function tira(i: number, n = 1): number { const e = mem.esp[i]; if (!e) return 0; const q = Math.min(e.n, n); e.n -= q; if (e.n <= 0 && !e.regra) mem.esp[i] = null; salva(); return q; }
/** esvazia o espaço e devolve o que havia */
export function solta(i: number): Espaco | null { const e = mem.esp[i]; mem.esp[i] = null; salva(); return e; }
export function poeRegra(i: number, r: Regra | null) { const e = mem.esp[i]; if (!e) return; if (r) e.regra = r; else { delete e.regra; if (e.n <= 0) mem.esp[i] = null; } salva(); }
/** veste um cinto (ou '' para tirar); devolve o cinto que estava e o que não coube mais */
export function veste(id: string): { antes: string; sobrou: Espaco[] } { const antes = mem.cinto; mem.cinto = id; const c = cintoAtual(), sobrou: Espaco[] = []; for (let i = 0; i < ENDERECOS; i++) if (mem.esp[i] && !cabe(c, i)) { sobrou.push(mem.esp[i]!); mem.esp[i] = null; } salva(); return { antes, sobrou }; }
