/* TRAVAS DE ARQUÉTIPO (11/11, ideia do Erling). Cada habilidade aprendida tem 2 runas de pedra ao lado; o jogador tira uma runa e encaixa
   numa trava (Tanque, Dano ou Healer). Em grupo, a habilidade vai para quem é daquele arquétipo; segurando Ctrl a trava é ignorada.
   Uma habilidade cabe em no máximo DUAS travas diferentes (tem só duas runas). Este arquivo guarda a montagem e desenha o painel;
   o efeito em grupo (para quem a magia vai) ainda NÃO está ligado: depende dos papéis do grupo. Ver claude/equilibrio-e-grupo-11-11.md. */
import { GRUPO_SKILLS } from '../grupo-habilidades';
export type Arq = 'tank' | 'dps' | 'heal';
export const ARQS: { id: Arq; name: string; hint: string; svg: string }[] = [
  { id: 'tank', name: 'Tanque', hint: 'vai para quem segura o inimigo', svg: '<svg viewBox="0 0 24 24"><path d="M12 2l8 3v6c0 5-3.4 9-8 11-4.6-2-8-6-8-11V5z" fill="currentColor"/></svg>' },
  { id: 'dps', name: 'Dano', hint: 'vai para quem bate', svg: '<svg viewBox="0 0 24 24"><path d="M3 3l3 0 9 9-3 3-9-9zM21 3l-3 0-9 9 3 3 9-9zM5 16l3 3-3 2-2-2zM19 16l-3 3 3 2 2-2z" fill="currentColor"/></svg>' },
  { id: 'heal', name: 'Healer', hint: 'vai para quem cura', svg: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path d="M10.5 6h3v4.5H18v3h-4.5V18h-3v-4.5H6v-3h4.5z" fill="currentColor"/></svg>' },
];
/** o símbolo gravado na runa diz o tipo da habilidade */
const TIPOS = {
  cura: { name: 'Cura', svg: '<path d="M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7z"/>' },
  defesa: { name: 'Defesa', svg: '<path d="M12 2l8 3v6c0 5-3.4 9-8 11-4.6-2-8-6-8-11V5z"/>' },
  veloc: { name: 'Velocidade', svg: '<path d="M3 13c4-1 6-4 7-9 2 4 2 7 1 10h6c2 0 4 2 4 5H7c-3 0-4-3-4-6z"/>' },
  olho: { name: 'Visão', svg: '<path d="M2 12c3-5 6-7 10-7s7 2 10 7c-3 5-6 7-10 7s-7-2-10-7zm10-3a3 3 0 100 6 3 3 0 000-6z" fill-rule="evenodd"/>' },
  chama: { name: 'Purificação', svg: '<path d="M12 2c1 4 5 6 5 11a5 5 0 01-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-4-1-6 1-10z"/>' },
  forca: { name: 'Força', svg: '<path d="M4 20v-3c0-4 2-6 5-6l1-6c.3-2 4-2 4 0l-1 5c4 0 7 2 7 6v4z"/>' },
} as const;
type Tipo = keyof typeof TIPOS;
/* 11/11 (Erling: "não são todas as habilidades que vão para o lock; magias que eu bato, eu corro, eu faço as coisas não podem ser para uso do grupo.
   Habilidades de uso de grupo vão para o lock. Precisa separar isso bem separado"): só as habilidades DE GRUPO têm runas. A lista é explícita, por id,
   e não adivinhada pelo texto. Golpes, investidas, esquivas, marcas e transformações ficam de fora: são do próprio jogador. */
const GRUPO: Record<string, Tipo> = {
  sapheal: 'cura', medic: 'cura', bonfire: 'cura', drain: 'cura',
  aegis: 'defesa', bubble: 'defesa', shieldwall: 'defesa', ancestorbark: 'defesa',
  lithsong: 'forca', gunturret: 'forca', teslatower: 'forca', mortar: 'forca', companion: 'forca', packhowl: 'forca', hellhound: 'forca', wisp: 'olho',
};
/** a cura própria ('heal') só é de grupo nas classes com potencial de cura; nas outras é um gole, um pão, uma ferida fechada: é de quem bebe */
const CURA_DE_GRUPO = new Set(['pal', 'mag', 'bru']);
/** tipo da habilidade de grupo (chave "classe:id"), ou null se ela é só do próprio jogador */
/** as 66 habilidades de grupo (sistemas/grupo-magias.ts) entram aqui: o quadro delas, as aprendidas e o clique */
let extra: { papel(): string; skills(): { k: string; name: string; svg: string; c: string }[]; click(t: HTMLElement, again: () => void): boolean; nodes(rows: number, W: number, H: number, NS: number): { html: string; lines: string; rows: number }; detail(): string | null; clearSel(): void } | null = null;
/** os quadrados das magias de grupo dentro da árvore de habilidades, a ficha da que está selecionada, e a limpeza da seleção */
export const travasNodes = (rows: number, W: number, H: number, NS: number) => extra?.nodes(rows, W, H, NS) ?? { html: '', lines: '', rows: 0 };
export const travasDetail = () => extra?.detail() ?? null;
export const travasClearSel = () => extra?.clearSel();
export function setTravasExtra(e: typeof extra) { extra = e; }
export function tipoGrupo(k: string): Tipo | null { const [kit, id] = k.split(':'); if (kit === 'g') return (GRUPO_SKILLS.find((q) => q.id === id)?.tipo as Tipo | undefined) ?? null; if (id === 'heal') return CURA_DE_GRUPO.has(kit) ? 'cura' : null; return GRUPO[id] ?? null; }
const KEY = 'karmika.travas.v1';
let data: Record<string, Arq[]> = (() => { try { return JSON.parse(localStorage.getItem(KEY) || '{}') as Record<string, Arq[]>; } catch { return {}; } })();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* sem armazenamento: vale só nesta sessão */ } };
export const travasOf = (k: string): Arq[] => data[k] ?? [];
/** encaixa a runa; devolve o motivo se não der */
export function travaAdd(k: string, a: Arq): string | null {
  const cur = travasOf(k); if (cur.includes(a)) return 'essa habilidade já está nessa trava'; if (cur.length >= 2) return 'as duas runas dessa habilidade já estão em uso';
  data[k] = [...cur, a]; save(); return null;
}
export function travaDel(k: string, a: Arq) { const cur = travasOf(k).filter((q) => q !== a); if (cur.length) data[k] = cur; else delete data[k]; save(); }
const stone = (tp: Tipo) => `<svg viewBox="0 0 24 24">${TIPOS[tp].svg}</svg>`;
/** as 2 runas ao lado da habilidade na árvore: livre = dá para arrastar; usada = apagada, com a inicial da trava */
export function runasDoNo(k: string): string {
  const tp = tipoGrupo(k); if (!tp) return ''; const cur = travasOf(k);
  return `<span class="rn2">${[0, 1].map((i) => cur[i] ? `<i class="rn used" title="Runa na trava ${ARQS.find((q) => q.id === cur[i])!.name}">${stone(tp)}</i>` : `<i class="rn" draggable="true" data-rune="${k}" title="Runa de ${TIPOS[tp].name}: arraste para uma trava (Tanque, Dano ou Healer)">${stone(tp)}</i>`).join('')}</span>`;
}
/** o painel das três travas; cada trava cresce conforme recebe runas */
export function travasHtml(all: { k: string; name: string; svg: string; c: string }[], selK: string | null): string {
  const skills = [...all, ...(extra?.skills() ?? [])].filter((q) => tipoGrupo(q.k)), by = new Map(skills.map((s) => [s.k, s]));
  return `<div class="locks"><div class="lkh"><b>Travas de grupo</b><small>Só as <b>habilidades de grupo</b> (cura, proteção, bênção, torres e invocações) têm runas de pedra; golpes e movimentos são seus e não entram aqui. Arraste a runa para um arquétipo: em grupo, a habilidade vai para quem tem esse papel. Duas runas por habilidade. <kbd>Ctrl</kbd> ao lançar escolhe o alvo à mão.${skills.length ? '' : ' <i>Você ainda não aprendeu nenhuma habilidade de grupo: a primeira abre no nível 25, na fileira de baixo da árvore.</i>'}</small>${extra?.papel() ?? ''}</div>
    <div class="lkrow">${ARQS.map((a) => { const inside = Object.keys(data).filter((k) => data[k].includes(a.id) && by.has(k));
      return `<div class="arqlock" data-arq="${a.id}"><div class="lkt"><span class="lki">${a.svg}</span><b>${a.name}</b><small>${a.hint}</small><em>${inside.length}</em></div>
        <div class="lkr">${inside.map((k) => { const s = by.get(k)!, tp = tipoGrupo(k)!; return `<button class="lrune" data-unrune="${k}|${a.id}" style="--c:${s.c}" title="${s.name} (${TIPOS[tp].name}). Clique para tirar da trava."><span class="lic">${s.svg}</span><i class="rn">${stone(tp)}</i><em>${s.name}</em></button>`; }).join('')}${selK && by.has(selK) && !travasOf(selK).includes(a.id) && travasOf(selK).length < 2 ? `<button class="ladd" data-addrune="${selK}|${a.id}" title="Encaixar aqui a habilidade selecionada">+ ${by.get(selK)!.name}</button>` : inside.length ? '' : '<span class="lempty">solte uma runa aqui</span>'}</div></div>`; }).join('')}</div></div>`;
}
/** liga arrastar, soltar e clicar do painel; `again` redesenha a janela */
export function travasBind(el: HTMLElement, again: () => void, warn: (m: string) => void) {
  el.ondragstart = (e) => { const r = (e.target as HTMLElement).closest?.('[data-rune]') as HTMLElement | null; if (!r || !e.dataTransfer) return; e.dataTransfer.setData('text/plain', r.dataset.rune!); e.dataTransfer.effectAllowed = 'move'; el.classList.add('rdrag'); };
  el.ondragend = () => { el.classList.remove('rdrag'); el.querySelectorAll('.arqlock.over').forEach((q) => q.classList.remove('over')); };
  el.ondragover = (e) => { const lk = (e.target as HTMLElement).closest?.('.arqlock') as HTMLElement | null; el.querySelectorAll('.arqlock.over').forEach((q) => { if (q !== lk) q.classList.remove('over'); }); if (!lk) return; e.preventDefault(); lk.classList.add('over'); };
  el.ondrop = (e) => { const lk = (e.target as HTMLElement).closest?.('.arqlock') as HTMLElement | null, k = e.dataTransfer?.getData('text/plain'); el.classList.remove('rdrag'); if (!lk || !k) return; e.preventDefault(); const why = travaAdd(k, lk.dataset.arq as Arq); if (why) warn(why); again(); };
}
/** clique dentro do painel: devolve true se tratou */
export function travasClick(t: HTMLElement, again: () => void, warn: (m: string) => void): boolean {
  if (extra?.click(t, again)) return true;
  const un = t.closest('[data-unrune]') as HTMLElement | null; if (un) { const [k, a] = un.dataset.unrune!.split('|'); travaDel(k, a as Arq); again(); return true; }
  const ad = t.closest('[data-addrune]') as HTMLElement | null; if (ad) { const [k, a] = ad.dataset.addrune!.split('|'); const why = travaAdd(k, a as Arq); if (why) warn(why); again(); return true; }
  return false;
}
