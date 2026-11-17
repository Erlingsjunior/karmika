/* OS DESPOJOS (17/11, Erling: "quando morremos de verdade, a morte que nos leva ao Limiar, dropamos tudo o que temos; o que está no baú não
   dropamos; se tivermos a Lágrima recuperamos tudo; se a morte for PvP, cada item tem 30% de chance de cair: joga os dados e vemos o que cai;
   até o Olho abrir estamos protegidos de perda de itens").
   Este arquivo só guarda os dados e joga os dados. Quem tira e devolve os itens é o inventário; quem desenha o monte no chão é
   sistemas/despojos-mundo.ts; quem decide a hora é sistemas/lar-e-morte.ts. */
import { d } from '../dados-rpg';
import type { Gear, Slot } from '../loot';

/** o que saiu do personagem: mochila (id → quantos), peças guardadas e peças vestidas */
export interface Pacote { bag: Record<string, number>; gear: Gear[]; eq: Partial<Record<Slot, Gear>> }
/** o monte no chão: onde caiu (em casas do mapa), de quem, quando, e se foi morte por outro jogador */
export interface Despojo { x: number; y: number; nome: string; em: number; pvp: boolean; pacote: Pacote }

/** chance de cada item cair numa morte por outro jogador: d100, cai com 30 ou menos */
export const CHANCE_PVP = 30;
/** itens que nunca caem: a Lágrima (é ela que paga a volta) e o que é da conta, não do personagem */
export const NUNCA_CAI = new Set(['lagrima', 'presente_marghar', 'seal_p30', 'seal_p90', 'seal_p365']);

const CHAVE = 'karmika.despojos.v1';
export const vazio = (p: Pacote) => !Object.keys(p.bag).length && !p.gear.length && !Object.keys(p.eq).length;
export const quantos = (p: Pacote) => Object.values(p.bag).reduce((a, b) => a + b, 0) + p.gear.length + Object.keys(p.eq).length;
export function carrega(): Despojo[] { try { const L = JSON.parse(localStorage.getItem(CHAVE) || '[]') as Despojo[]; return Array.isArray(L) ? L.filter((q) => q && q.pacote && !vazio(q.pacote)) : []; } catch { return []; } }
export function guarda(L: Despojo[]) { try { localStorage.setItem(CHAVE, JSON.stringify(L)); } catch { /* sem espaço: o monte fica só nesta sessão */ } }

/** Quem decide se um item cai. Morte comum: tudo cai. Morte por jogador: um d100 por item, e a lista do que os dados disseram. */
export function juiz(pvp: boolean) { const rolagens: { nome: string; dado: number; cai: boolean }[] = [];
  return { cai(nome: string) { if (!pvp) return true; const dado = d(100), cai = dado <= CHANCE_PVP; rolagens.push({ nome, dado, cai }); return cai; }, rolagens }; }

/* o golpe de outro jogador avisa aqui um instante antes de ferir: se a morte vier nesse mesmo instante, foi morte por jogador */
let golpePvp = 0;
export const marcaGolpePvp = () => { golpePvp = performance.now(); };
export const foiPvp = () => performance.now() - golpePvp < 250;
