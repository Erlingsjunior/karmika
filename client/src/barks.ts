/* Falas soltas dos NPCs (Erling, 25/10: "eles podem falar mais, e falar coisas diferentes dependendo das situações, mas não vamos exagerar").
   De vez em quando (uma fala a cada 8–16 s na região, nunca duas ao mesmo tempo) um NPC por perto comenta o que está acontecendo:
   a hora, o frio, a Lua de Sangue, a sua briga, o seu sangue no chão, o seu karma, o seu caminho, o seu pet, o ofício dele.
   {nome} = o herói · {pet} = o nome do pet. A situação mais específica ganha da genérica. */
import { tl, tp } from './i18n';
/* as falas moram em public/lang/<língua>.json, chaves bark.<situação> (i18n.ts) */
const BARK_KEYS = ['manha', 'dia', 'noite', 'frio', 'calor', 'lua', 'aurora', 'combate', 'ferido', 'montado', 'pet', 'novato', 'veterano', 'luz', 'sombra', 'vam', 'lob', 'mag', 'bru', 'pal', 'cac', 'tecno', 'gue', 'rep_alta', 'rep_baixa', 'despedida', 'festa', 'volta', 'r_guarda', 'r_ferreiro', 'r_taverna', 'r_mercador', 'r_fe'];
export const BARKS: Record<string, string[]> = Object.fromEntries(BARK_KEYS.map((k) => [k, tl('bark.' + k)]));
/** o papel do NPC vira uma etiqueta de ofício */
export function roleTag(role: string) { const r = role.toLowerCase();
  if (/guarda|sargento|patrulha|sentinela/.test(r)) return 'r_guarda'; if (/ferreir|armeir|forja/.test(r)) return 'r_ferreiro';
  if (/cozinh|taverna|estalaj|cervej|churrasq/.test(r)) return 'r_taverna'; if (/mercad|comerci|vended|loj|domador|joalh/.test(r)) return 'r_mercador';
  if (/sacerd|templo|frei|irmã|abad|monge|vidente/.test(r)) return 'r_fe'; return ''; }

/* 10/11 (Erling: "os NPCs precisam conversar e falar bem ou mal da gente"): fofoca. De vez em quando dois moradores parados perto um do outro
   conversam sobre o herói enquanto ele passa (a 4–20 m): um puxa o assunto, o outro responde. O tom segue o karma (luz, neutro, sombra)
   e, quando há, o último feito que correu a vila (FAMA): matou um chefe, defendeu a vila, matou um inocente. */
export const FAMA: { deeds: { txt: string; good: boolean; at: number }[]; push(txt: string, good: boolean): void } = {
  deeds: [], push(txt, good) { this.deeds.push({ txt, good, at: performance.now() }); if (this.deeds.length > 8) this.deeds.shift(); },
};
export const GOSSIP: Record<'luz' | 'neutro' | 'sombra', [string, string][]> = { luz: tp('fofoca.luz'), neutro: tp('fofoca.neutro'), sombra: tp('fofoca.sombra') };
export const GOSSIP_DEED: { good: [string, string][]; bad: [string, string][] } = { good: tp('fofoca.feito.bom'), bad: tp('fofoca.feito.mau') };
export const GUARD_CRY = tl('guarda.grito');
