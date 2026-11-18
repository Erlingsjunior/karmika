/* PÁGINA DE TÍTULOS E MOLDURAS (dentro da janela das Inscrições de Marghar). Só desenha e repassa o clique; a regra mora em ../titulos. */
import { TITULOS, GRUPOS, MOLDURAS, DIAS_DE_MARCA, classeMoldura, cssMolduras, tituloAtivo, travado, travaResta, temTitulo, meusTitulos, escolheTitulo, temMoldura, molduraAtiva, escolheMoldura, type Titulo } from '../titulos';

/* a arte das molduras é montada em código (titulos/arte-molduras.ts) e entra na página uma vez */
{ const st = document.createElement('style'); st.id = 'molduras-css'; st.textContent = cssMolduras(); document.head.appendChild(st); }

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
/** "4 dias e 3 horas", "5 horas", "12 minutos" */
export function prazo(ms: number) { const h = ms / 36e5; if (h >= 24) { const d = Math.floor(h / 24), r = Math.floor(h - d * 24); return `${d} dia${d === 1 ? '' : 's'}${r ? ` e ${r} hora${r === 1 ? '' : 's'}` : ''}`; } if (h >= 1) { const n = Math.ceil(h); return `${n} hora${n === 1 ? '' : 's'}`; } const m = Math.max(1, Math.ceil(ms / 6e4)); return `${m} minuto${m === 1 ? '' : 's'}`; }

/** o retrato com a moldura, em qualquer tamanho (quem chama dá a classe de tamanho) */
export const retratoHtml = (src: string | null, mold: string | null | undefined, cls = '') => `<span class="${classeMoldura(mold)} ${cls}">${src ? `<img src="${src}" alt="">` : '<em>?</em>'}</span>`;

export function htmlTitulos(nome: string, retrato: string | null) {
  const at = tituloAtivo(), preso = travado(), mold = molduraAtiva();
  const meusQ = meusTitulos().filter((t) => t.id.startsWith('q:'));
  const cartao = (id: string, nm: string, como: string, marca: boolean) => { const tem = temTitulo(id), on = at?.id === id;
    return `<button class="tt-c ${tem ? 'tem' : 'off'} ${on ? 'on' : ''} ${marca ? 'marca' : ''}" ${tem && !on && !preso ? `data-tit="${esc(id)}"` : 'disabled'} title="${tem ? (on ? 'Em uso' : preso ? 'Uma marca do Olho prende o seu título agora' : 'Clique para usar') : 'Ainda não conquistado'}"><b>${marca ? '👁 ' : ''}${esc(nm)}</b><small>${esc(como)}</small>${on ? '<em>em uso</em>' : tem ? '' : '<em>ainda não</em>'}</button>`; };
  const grupo = (g: Titulo['grupo']) => { const l = TITULOS.filter((t) => t.grupo === g).sort((a, b) => Number(temTitulo(b.id)) - Number(temTitulo(a.id))); return `<h3>${GRUPOS[g]} <small>${l.filter((t) => temTitulo(t.id)).length}/${l.length}</small></h3><div class="tt-g">${l.map((t) => cartao(t.id, t.nome, t.como, !!t.marca)).join('')}</div>`; };
  return `<div class="tt-top">${retratoHtml(retrato, mold, 'tt-face')}
      <div class="tt-eu"><b>${esc(nome)}</b><i>${at ? esc(at.nome) : 'sem título'}</i>
        ${preso ? `<p class="tt-trava">👁 O Olho gravou este título em você. Ele só pode ser trocado daqui a <b>${prazo(travaResta())}</b>.</p>` : `<p>Escolha abaixo o título que aparece junto do seu nome. Os marcados com 👁 são marcas do Olho: chegam sozinhos, na hora do ato, e ficam presos por ${DIAS_DE_MARCA} dias.</p>`}
        ${at && !preso ? '<button class="tt-sem" data-tit="">Andar sem título</button>' : ''}</div></div>
    <div class="tt-rol">${meusQ.length ? `<h3>Missões e juramentos <small>${meusQ.length}</small></h3><div class="tt-g">${meusQ.map((t) => cartao(t.id, t.nome, 'Recebido numa missão ou num juramento.', false)).join('')}</div>` : ''}
      ${(Object.keys(GRUPOS) as Titulo['grupo'][]).map(grupo).join('')}
      <h3>Molduras do retrato <small>${MOLDURAS.filter((m) => temMoldura(m.id)).length}/${MOLDURAS.length}</small></h3>
      <p class="tt-nota">A moldura aparece em volta do seu rosto no quadro do grupo, no seu perfil e na sua ficha. É só aparência.</p>
      <div class="tt-m">${MOLDURAS.map((m) => { const tem = temMoldura(m.id), on = mold === m.id; return `<button class="tt-mc ${tem ? 'tem' : 'off'} ${on ? 'on' : ''}" ${tem && !on ? `data-mold="${m.id}"` : 'disabled'} title="${esc(m.como)}">${retratoHtml(retrato, m.id, 'tt-mf')}<b>${esc(m.nome)}</b><small>${on ? 'em uso' : tem ? 'clique para usar' : esc(m.como)}</small></button>`; }).join('')}</div></div>`;
}
/** trata o clique dentro da página; devolve true se mudou algo (quem chama redesenha) */
export function cliqueTitulos(alvo: HTMLElement): boolean {
  const t = alvo.closest('[data-tit]') as HTMLElement | null; if (t) return escolheTitulo(t.dataset.tit || null);
  const m = alvo.closest('[data-mold]') as HTMLElement | null; if (m) return escolheMoldura(m.dataset.mold!);
  return false;
}
