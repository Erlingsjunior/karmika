/* Construtor compacto das missões de capítulo (09/11): menos repetição de chave, mesmas regras (fala ao pegar e ao entregar, escolha com
   karma e marca no mundo). O nível, a ordem (next), o pedido (req) e o título são postos depois, na montagem (capitulo1.ts). */
import type { QuestDef, Obj } from './quests';

export type R = { r: { t: string; a: string; luz?: number; sombra?: number }[] };
export const r = (...p: [string, string][]): R => ({ r: p.map(([t, a]) => ({ t, a })) });
type Step = string | R | { who: string; t: string };
/** [rótulo, karma, o que acontece, por quê] */
export type Opt = [string, number, string, string];

export function Q(id: string, name: string, giver: string, turnin: string, text: string, objs: Obj[], talk: Step[], done: Step[],
  choice?: [string, ...Opt[]], extra: Partial<QuestDef> = {}): QuestDef {
  const d = { id, chain: '', name, lvl: 0, giver, turnin, xp: 0, gold: 0, text, objs, talk, done, ...extra } as QuestDef;
  if (choice) { const [q, ...opts] = choice; (d as QuestDef & { choice: unknown }).choice = { q, opts: opts.map(([label, karma, say, why], i) => ({ label, karma, say, why, flag: `${id}_${i}` })) }; }
  return d;
}
export const talk = (npc: string): Obj => ({ kind: 'talk', npc });
export const visit = (poi: string): Obj => ({ kind: 'visit', poi });
export const kill = (type: string, n: number): Obj => ({ kind: 'kill', type: type as never, n });
export const sense = (what: 'rastro' | 'sangue' | 'espirito' | 'dispositivo' | 'cheiro' | 'ninho', label: string, at: string, dx: number, dy: number, spirit?: { name: string; lines: string[] }): Obj =>
  ({ kind: 'sense', what, label, at, dx, dy, ...(spirit ? { spirit } : {}) } as Obj);
export const collect = (item: string, n: number): Obj => ({ kind: 'collect', item, n });
export const m = (who: string, t: string) => ({ who, t });
