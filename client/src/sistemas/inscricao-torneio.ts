/* 12/11 (Erling: "precisa de um lugar e um NPC que recebe as inscrições para as competições: eles clicam no cara, colocam o nome, o nome da guilda,
   escolhem a sua guilda da lista de guildas ativas no servidor; somente a diretoria pode fazer isso; e por esse NPC recebemos as inscrições"):
   a INSCRIÇÃO NO CAMPEONATO DE GUILDAS, com o Arauto dos Torneios, dentro da Estalagem de Karmika. A janela mostra as guildas do servidor,
   confere se quem inscreve é da diretoria (líder ou oficial) e se a guilda é de nível 3; quem decide de verdade é o servidor. */
import { floatWin } from '../windows';
import type { BookGuild } from './livro-guildas';

export interface InscView { gid: number; guilda: string; tag: string; nivel: number; por: string; at: number }
export interface InscCtx { online: boolean; char: string; guild: { id: number; name: string; lvl?: number; members: { name: string; rank: string }[] } | null; world: BookGuild[]; list: InscView[]; send(m: { t: string; gid: number; resp: string; contato: string }): void; log(t: string, c?: string): void }

const esc = (t: string) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const NIVEL_MIN = 3;
let el: HTMLDivElement | null = null, cur: InscCtx | null = null, resp = '', contato = '', gid = 0;

export function openInsc(o: InscCtx) {
  cur = o; gid = o.guild?.id ?? o.world[0]?.id ?? 0;
  if (!el) { el = document.createElement('div'); el.id = 'ginsc'; el.className = 'modalw'; document.body.appendChild(el); floatWin(el, 'ginsc', { left: '32vw', top: '9vh' });
    el.addEventListener('click', (e) => { const t = (e.target as HTMLElement).closest('button') as HTMLElement | null; if (!t) return; if (t.dataset.x !== undefined) { el!.style.display = 'none'; return; } if (t.dataset.go !== undefined) enviar(); });
    el.addEventListener('input', (e) => { const t = e.target as HTMLInputElement | HTMLSelectElement; if (t.dataset.f === 'resp') resp = t.value; else if (t.dataset.f === 'contato') contato = t.value; else if (t.dataset.f === 'gid') { gid = Number(t.value); draw(); } });
    el.addEventListener('keydown', (e) => e.stopPropagation()); }
  draw();
}
/** chegou a lista nova do servidor (ou a guilda mudou): redesenha se a janela estiver aberta */
export function refreshInsc(o: Partial<InscCtx>) { if (!cur) return; cur = { ...cur, ...o }; if (el && el.style.display !== 'none') draw(); }
export function closeInsc() { if (el) el.style.display = 'none'; }

/** o que falta para esta pessoa inscrever a guilda escolhida (vazio = pode) */
function falta(): string {
  const o = cur!; if (!o.online) return 'As inscrições ficam no servidor: entre numa sala para inscrever a guilda.';
  if (!o.world.length) return 'Ainda não há nenhuma guilda registrada neste servidor.';
  if (!o.guild) return 'Você não faz parte de nenhuma guilda. Só a diretoria de uma guilda faz a inscrição.';
  if (gid !== o.guild.id) return `Você só pode inscrever a guilda da qual é diretoria: a ${o.guild.name}.`;
  const eu = o.guild.members.find((m) => m.name.toLowerCase() === o.char.toLowerCase());
  if (!eu || (eu.rank !== 'lider' && eu.rank !== 'oficial')) return 'Só a diretoria da guilda (líder ou oficial) pode fazer a inscrição.';
  if ((o.guild.lvl ?? 1) < NIVEL_MIN) return `A guilda precisa ser de nível ${NIVEL_MIN} para entrar nas Classificatórias. A ${o.guild.name} está no nível ${o.guild.lvl ?? 1}.`;
  if (o.list.some((x) => x.gid === gid)) return `A ${o.guild.name} já está inscrita.`;
  return '';
}
function enviar() { const o = cur!, f = falta(); if (f) { o.log(`🏆 ${f}`, '#ff9a8a'); return; } if (resp.trim().length < 3) { o.log('🏆 Escreva o seu nome para a inscrição.', '#ff9a8a'); return; } o.send({ t: 'g:insc', gid, resp: resp.trim(), contato: contato.trim() }); }

function draw() {
  const o = cur!, f = falta(), inscritas = new Set(o.list.map((x) => x.gid));
  const opts = o.world.slice().sort((a, b) => a.name.localeCompare(b.name)).map((g) => `<option value="${g.id}" ${g.id === gid ? 'selected' : ''}>${esc(g.name)} [${esc(g.tag)}] · nível ${g.lvl ?? 1}${inscritas.has(g.id) ? ' · inscrita' : ''}</option>`).join('');
  const rows = o.list.slice().sort((a, b) => a.at - b.at).map((x, i) => `<div class="gbrow ${x.gid === o.guild?.id ? 'mine' : ''}"><div><b>${i + 1}. ${esc(x.guilda)} <em>[${esc(x.tag)}]</em></b><small>inscrita por ${esc(x.por)} em ${new Date(x.at).toLocaleDateString('pt-BR')}</small></div><span class="gblvl">${x.nivel}<small>nível</small></span></div>`).join('');
  const inp = 'width:100%;box-sizing:border-box;margin:4px 0 10px;padding:8px 10px;border-radius:8px;border:1px solid rgba(217,165,74,.4);background:rgba(0,0,0,.35);color:inherit;font:inherit';
  el!.innerHTML = `<div class="pn sopn gbpn"><h2>🏆 Campeonato de Guildas: inscrição<button data-x title="Fechar">✕</button></h2>
    <p class="somut">O Arauto anota a guilda para as <b>Classificatórias</b>. Entram guildas de nível ${NIVEL_MIN} ou mais, e só a diretoria (líder ou oficial) inscreve.</p>
    <label>O seu nome<input data-f="resp" maxlength="60" placeholder="Quem responde pela inscrição" value="${esc(resp)}" style="${inp}"></label>
    <label>O seu personagem<input value="${esc(o.char)}" disabled style="${inp};opacity:.7"></label>
    <label>A sua guilda, entre as guildas ativas no servidor<select data-f="gid" style="${inp}" ${o.world.length ? '' : 'disabled'}>${opts || '<option>Nenhuma guilda registrada</option>'}</select></label>
    <label>Contato (WhatsApp ou e-mail, opcional)<input data-f="contato" maxlength="80" placeholder="Para avisarmos das datas" value="${esc(contato)}" style="${inp}"></label>
    ${f ? `<p class="somut" style="color:#ff9a8a">${esc(f)}</p>` : '<p class="somut" style="color:#9be29b">Tudo certo: a guilda pode ser inscrita.</p>'}
    <div class="gbtools"><button data-go class="${f ? '' : 'on'}" ${f ? 'disabled' : ''}>Inscrever a guilda</button></div>
    <h3 style="margin:14px 0 6px">Guildas inscritas neste reino: ${o.list.length}</h3>
    <div class="gblist">${rows || '<p class="somut">Nenhuma ainda. A primeira pode ser a sua.</p>'}</div></div>`;
  el!.style.display = 'flex';
}
