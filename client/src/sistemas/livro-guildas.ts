/* 06/11 (Erling: "a guilda entra sozinha na Biblioteca de Karmika, na parte de dados de guildas, com nome, dados e nível"):
   o LIVRO DE GUILDAS. Abre com o Cronista da Grande Biblioteca, com quem cuida da Biblioteca de Lumenhal e com o Prefeito.
   Mostra todas as guildas do servidor: estandarte, nome e sigla, nível, membros, fundadores e a data em que foram registradas. */
import { bannerHtml, type GFlag } from './guilda-fundacao';
import { ROMAN } from './guilda-pagina';
import { floatWin } from '../windows';

export interface BookGuild { id: number; name: string; tag: string; col: string; flag?: GFlag | null; icon?: string | null; lvl?: number; created?: number; members?: number; signed?: { name: string }[] }

const esc = (t: string) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
let el: HTMLDivElement | null = null, sort: 'lvl' | 'nome' | 'idade' = 'lvl', q = '', cur: BookGuild[] = [], online = false, mine: number | null = null;

export function openGuildBook(list: BookGuild[], isOnline: boolean, myId: number | null) {
  cur = list; online = isOnline; mine = myId;
  if (!el) { el = document.createElement('div'); el.id = 'gbook'; el.className = 'modalw'; document.body.appendChild(el); floatWin(el, 'gbook', { left: '30vw', top: '10vh' });
    el.addEventListener('click', (e) => { const t = (e.target as HTMLElement).closest('button') as HTMLElement | null; if (!t) return; if (t.dataset.x !== undefined) { el!.style.display = 'none'; return; } if (t.dataset.s) { sort = t.dataset.s as typeof sort; draw(); } });
    el.addEventListener('input', (e) => { const t = e.target as HTMLInputElement; if (t.dataset.q !== undefined) { q = t.value; draw(true); } });
    el.addEventListener('keydown', (e) => e.stopPropagation()); }
  draw();
}
/** atualiza se estiver aberto (chegou lista nova do servidor) */
export function refreshGuildBook(list: BookGuild[]) { cur = list; if (el && el.style.display !== 'none') draw(); }
function draw(keepFocus = false) {
    const L = cur.filter((g) => !q.trim() || (g.name + ' ' + g.tag).toLowerCase().includes(q.trim().toLowerCase()))
      .sort((a, b) => sort === 'nome' ? a.name.localeCompare(b.name) : sort === 'idade' ? (a.created ?? 0) - (b.created ?? 0) : (b.lvl ?? 1) - (a.lvl ?? 1) || (b.members ?? 0) - (a.members ?? 0));
    const rows = L.map((g) => `<div class="gbrow ${g.id === mine ? 'mine' : ''}">${bannerHtml(g.flag, g.icon, g.col)}<div><b>${esc(g.name)} <em>[${esc(g.tag)}]</em></b><small>${g.members ?? 0} membros · registrada em ${g.created ? new Date(g.created).toLocaleDateString('pt-BR') : '—'}${g.signed?.length ? ` · fundadores: ${g.signed.map((s) => esc(s.name)).join(', ')}` : ''}</small></div><span class="gblvl">${ROMAN[g.lvl ?? 1] ?? g.lvl}<small>nível</small></span></div>`).join('');
    el!.innerHTML = `<div class="pn sopn gbpn"><h2>📖 Livro de Guildas de Karmika<button data-x title="Fechar">✕</button></h2>
      <p class="somut">Toda guilda fundada diante do Prefeito de Lumenhal entra aqui sozinha. O nome fica escrito para sempre.</p>
      <div class="gbtools"><input data-q placeholder="Procurar por nome ou sigla" value="${esc(q)}"><span>Ordem:</span>${(['lvl', 'nome', 'idade'] as const).map((s) => `<button data-s="${s}" class="${sort === s ? 'on' : ''}">${{ lvl: 'nível', nome: 'nome', idade: 'mais antigas' }[s]}</button>`).join('')}</div>
      <div class="gblist">${!online ? '<p class="somut">O Livro fica no servidor: entre numa sala para ler as guildas de lá.</p>' : rows || `<p class="somut">${cur.length ? 'Nenhuma guilda com esse nome.' : 'Nenhuma guilda registrada ainda. A primeira pode ser a sua.'}</p>`}</div>
      <small class="somut">${cur.length} guilda${cur.length === 1 ? '' : 's'} no Livro.</small></div>`;
    el!.style.display = 'flex';
    if (keepFocus) { const i = el!.querySelector('[data-q]') as HTMLInputElement | null; if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }
}
