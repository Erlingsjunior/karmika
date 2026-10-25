/* Correio de Karmika: caixas de correio em cada povoado. Cartas entre jogadores com anexos (itens, equipamento, ouro)
   e cobrança na entrega — o jeito de fechar uma venda combinada no chat. Local por enquanto: enviar para si mesmo
   chega pelo corvo; para outros jogadores fica "a caminho" até o servidor multijogador existir (dá para cancelar). */
import type { Gear } from './loot';
import { RARITY } from './loot';

interface Att { item?: { id: string; n: number }; gear?: Gear; gold?: number }
export interface Letter { id: string; from: string; to: string; subj: string; text: string; att: Att[]; cod: number; t: number; read?: boolean; arrive?: number }
interface Ctx {
  me(): string; town(): string;
  st: { gold: number };
  items(): { id: string; n: number; name: string; icon: string }[];
  gear(): Gear[];
  take(id: string, n: number): boolean; add(id: string, n: number): void;
  takeGear(uid: number): Gear | null; addGear(g: Gear): boolean;
  itemName(id: string): string; itemIcon(id: string): string;
  log(t: string, c?: string): void; save(): void;
}

const esc = (t: string) => t.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const ld = <T,>(k: string, d: T): T => { try { return JSON.parse(localStorage.getItem(k) || 'null') ?? d; } catch { return d; } };
const sv = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* */ } };
const POSTAGE = 5, PER_ATT = 2, MAX_ATT = 6;

export function createMail(ctx: Ctx) {
  let inbox: Letter[] = ld('karmika.post.in', [{ id: 'w0', from: 'Correio de Karmika', to: '', subj: 'Bem-vindo ao Correio', text: 'Cada povoado tem a sua caixa de correio. Escreva para outro caminhante, anexe itens, equipamento ou ouro, e cobre na entrega quando for uma venda combinada no chat. Tudo o que chegar para você espera aqui, em qualquer caixa.', att: [], cod: 0, t: Date.now() }]);
  let outbox: Letter[] = ld('karmika.post.out', []);
  const save = () => { sv('karmika.post.in', inbox); sv('karmika.post.out', outbox); };
  let open = false, tab: 'in' | 'new' | 'out' = 'in';
  let draft: { to: string; subj: string; text: string; cod: number; gold: number; att: Att[] } = { to: '', subj: '', text: '', cod: 0, gold: 0, att: [] };
  let pickItem = '', pickN = 1, pickGear = '';
  const el = document.createElement('div'); el.id = 'mailw'; document.body.appendChild(el);

  const arrived = () => inbox.filter((l) => !l.arrive || l.arrive <= Date.now());
  const unread = () => arrived().filter((l) => !l.read).length;
  const attHtml = (a: Att) => a.item ? `<span class="ma">${ctx.itemIcon(a.item.id)} ${a.item.n}× ${esc(ctx.itemName(a.item.id))}</span>` : a.gear ? `<span class="ma" style="color:${RARITY[a.gear.rarity].col}">${esc(a.gear.name)}</span>` : a.gold ? `<span class="ma">${a.gold} 🪙</span>` : '';
  const fee = () => POSTAGE + PER_ATT * (draft.att.length + (draft.gold > 0 ? 1 : 0));

  function deliver(l: Letter) { // corvo leva a carta: para si mesmo chega em instantes; para outros, só com o servidor
    if (l.to.toLowerCase() === ctx.me().toLowerCase()) { inbox.push({ ...l, id: 'i' + Date.now() + Math.random(), arrive: Date.now() + 8000 }); return true; }
    outbox.unshift(l); return false;
  }
  function render() {
    if (!open) { el.style.display = 'none'; return; }
    const list = arrived().slice().reverse();
    const inHtml = list.length ? list.map((l) => `<div class="mletter ${l.read ? '' : 'new'}" data-mid="${l.id}"><div class="mh"><b>${esc(l.subj)}</b><small>de <b>${esc(l.from)}</b> · ${new Date(l.t).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</small></div><p>${esc(l.text)}</p>
      ${l.att.length ? `<div class="matt">${l.att.map(attHtml).join('')}</div>${l.cod ? `<small class="mcod">Cobrança na entrega: <b>${l.cod} 🪙</b> — o ouro vai para ${esc(l.from)}.</small>` : ''}<button data-mtake="${l.id}">${l.cod ? `Pagar ${l.cod} 🪙 e retirar` : 'Retirar anexos'}</button>` : `<button data-mdel="${l.id}" class="ghost">Apagar</button>`}</div>`).join('') : '<em class="emptyb">A caixa está vazia.</em>';
    const items = ctx.items(), gear = ctx.gear();
    const newHtml = `<div class="mform"><input data-mf="to" maxlength="24" placeholder="Para: nome do jogador" value="${esc(draft.to)}"><input data-mf="subj" maxlength="60" placeholder="Assunto" value="${esc(draft.subj)}">
      <textarea data-mf="text" rows="3" maxlength="500" placeholder="Escreva a carta…">${esc(draft.text)}</textarea>
      <div class="mrow"><select data-mp="item"><option value="">— anexar item da mochila —</option>${items.map((i) => `<option value="${i.id}" ${pickItem === i.id ? 'selected' : ''}>${i.icon} ${esc(i.name)} (${i.n})</option>`).join('')}</select><input data-mp="n" type="number" min="1" value="${pickN}"><button data-madd="item">Anexar</button></div>
      <div class="mrow"><select data-mp="gear"><option value="">— anexar equipamento —</option>${gear.map((g) => `<option value="${g.uid}" ${pickGear === String(g.uid) ? 'selected' : ''}>${esc(g.name)} (${RARITY[g.rarity].name})</option>`).join('')}</select><button data-madd="gear">Anexar</button></div>
      <div class="mrow"><label>Enviar ouro <input data-mf="gold" type="number" min="0" value="${draft.gold || ''}" placeholder="0"></label><label title="Quem receber paga este valor para retirar os anexos; o ouro volta para você pelo correio">Cobrar na entrega <input data-mf="cod" type="number" min="0" value="${draft.cod || ''}" placeholder="0"></label></div>
      ${draft.att.length ? `<div class="matt">${draft.att.map((a, i) => `${attHtml(a)}<i data-mrm="${i}" title="tirar">✕</i>`).join('')}</div>` : '<small class="mhint">Sem anexos.</small>'}
      <div class="mrow"><button data-msend>Selar e enviar (${fee()} 🪙)</button><small class="mhint">Selo ${POSTAGE} 🪙 + ${PER_ATT} 🪙 por anexo. Até ${MAX_ATT} anexos.</small></div></div>`;
    const outHtml = outbox.length ? outbox.map((l) => `<div class="mletter"><div class="mh"><b>${esc(l.subj)}</b><small>para <b>${esc(l.to)}</b> · a caminho</small></div>${l.att.length ? `<div class="matt">${l.att.map(attHtml).join('')}</div>` : ''}<small class="mhint">O corvo espera o servidor multijogador para chegar até outro caminhante.</small><button data-mcancel="${l.id}" class="ghost">Cancelar envio (anexos voltam)</button></div>`).join('') : '<em class="emptyb">Nada a caminho.</em>';
    el.innerHTML = `<div class="pn mailpn"><h2>📮 Correio de ${esc(ctx.town())} <button data-mx>✕</button></h2>
      <div class="btabs"><button data-mt="in" class="${tab === 'in' ? 'on' : ''}">Recebidas${unread() ? ` <i class="badge">${unread()}</i>` : ''}</button><button data-mt="new" class="${tab === 'new' ? 'on' : ''}">Escrever</button><button data-mt="out" class="${tab === 'out' ? 'on' : ''}">A caminho (${outbox.length})</button></div>
      <div class="mbody">${tab === 'in' ? inHtml : tab === 'new' ? newHtml : outHtml}</div><small class="ft">Esc fecha</small></div>`;
    el.style.display = 'flex';
    if (tab === 'in') { let ch = false; for (const l of arrived()) if (!l.read && !l.att.length) { l.read = true; ch = true; } if (ch) save(); }
  }
  const onF = (e: Event) => { const f = e.target as HTMLInputElement; const k = f.dataset?.mf, p = f.dataset?.mp;
    if (k === 'gold' || k === 'cod') { draft[k] = Math.max(0, Math.floor(+f.value || 0)); if (k === 'gold') { const b = el.querySelector('[data-msend]'); if (b) b.textContent = `Selar e enviar (${fee()} 🪙)`; } }
    else if (k === 'to' || k === 'subj' || k === 'text') draft[k] = f.value;
    if (p === 'item') pickItem = f.value; else if (p === 'n') pickN = Math.max(1, Math.floor(+f.value || 1)); else if (p === 'gear') pickGear = f.value; };
  el.addEventListener('input', onF); el.addEventListener('change', onF);
  el.addEventListener('keydown', (e) => { if ((e.target as HTMLElement).closest('input,textarea,select')) e.stopPropagation(); });
  el.addEventListener('click', (e) => { const t = e.target as HTMLElement; const d = (k: string) => (t.closest(`[data-${k}]`) as HTMLElement | null)?.getAttribute(`data-${k}`);
    if (t.closest('[data-mx]')) { api.close(); return; }
    const mt = d('mt'); if (mt) { tab = mt as typeof tab; render(); return; }
    const ad = d('madd'); if (ad) { if (draft.att.length >= MAX_ATT) { ctx.log(`📮 No máximo ${MAX_ATT} anexos por carta.`, '#ff9a8a'); return; }
      if (ad === 'item' && pickItem) { const have = ctx.items().find((i) => i.id === pickItem)?.n ?? 0, already = draft.att.filter((a) => a.item?.id === pickItem).reduce((s, a) => s + a.item!.n, 0), n = Math.min(pickN, have - already); if (n <= 0) { ctx.log('📮 Você não tem mais desse item.', '#ff9a8a'); return; } draft.att.push({ item: { id: pickItem, n } }); }
      if (ad === 'gear' && pickGear) { const g = ctx.gear().find((x) => String(x.uid) === pickGear); if (g && !draft.att.some((a) => a.gear?.uid === g.uid)) draft.att.push({ gear: g }); pickGear = ''; }
      render(); return; }
    const rm = d('mrm'); if (rm !== undefined && rm !== null) { draft.att.splice(+rm, 1); render(); return; }
    if (t.closest('[data-msend]')) {
      const to = draft.to.trim(); if (!to) { ctx.log('📮 Escreva para quem vai a carta.', '#ff9a8a'); return; }
      if (!draft.subj.trim()) draft.subj = '(sem assunto)';
      const cost = fee() + draft.gold; if (ctx.st.gold < cost) { ctx.log(`📮 Ouro insuficiente: selo e ouro somam ${cost} 🪙.`, '#ff9a8a'); return; }
      const att: Att[] = []; // tira da mochila na hora: o que está no correio não está mais com você
      for (const a of draft.att) { if (a.item) { if (ctx.take(a.item.id, a.item.n)) att.push({ item: { ...a.item } }); } else if (a.gear) { const g = ctx.takeGear(a.gear.uid); if (g) att.push({ gear: g }); } }
      ctx.st.gold -= cost; if (draft.gold > 0) att.push({ gold: draft.gold });
      const l: Letter = { id: 'o' + Date.now(), from: ctx.me(), to, subj: draft.subj.trim(), text: draft.text.trim(), att, cod: draft.att.length ? draft.cod : 0, t: Date.now() };
      const self = deliver(l); save(); ctx.save();
      ctx.log(self ? `📮 Carta selada. O corvo voa: chega na sua caixa em instantes.` : `📮 Carta para ${to} selada e entregue ao corvo (−${fee()} 🪙 de selo).`, '#ffe08a');
      draft = { to: '', subj: '', text: '', cod: 0, gold: 0, att: [] }; tab = self ? 'in' : 'out'; render(); return; }
    const tk = d('mtake'); if (tk) { const l = inbox.find((x) => x.id === tk); if (!l) return;
      if (l.cod) { if (ctx.st.gold < l.cod) { ctx.log(`📮 Faltam ${l.cod - ctx.st.gold} 🪙 para pagar a cobrança.`, '#ff9a8a'); return; } ctx.st.gold -= l.cod;
        const back: Letter = { id: 'c' + Date.now(), from: 'Correio', to: l.from, subj: `Pagamento: ${l.subj}`, text: `${ctx.me()} pagou a cobrança na entrega.`, att: [{ gold: l.cod }], cod: 0, t: Date.now() }; deliver(back); }
      const left: Att[] = [];
      for (const a of l.att) { if (a.item) ctx.add(a.item.id, a.item.n); else if (a.gold) ctx.st.gold += a.gold; else if (a.gear && !ctx.addGear(a.gear)) left.push(a); }
      l.att = left; l.cod = 0; l.read = true; save(); ctx.save();
      ctx.log(left.length ? '📮 Mochila cheia: parte dos anexos ficou na caixa.' : '📮 Anexos retirados.', left.length ? '#ff9a8a' : '#7aff9a'); render(); return; }
    const dl = d('mdel'); if (dl) { inbox = inbox.filter((x) => x.id !== dl); save(); render(); return; }
    const cc = d('mcancel'); if (cc) { const i = outbox.findIndex((x) => x.id === cc); if (i < 0) return; const l = outbox.splice(i, 1)[0];
      for (const a of l.att) { if (a.item) ctx.add(a.item.id, a.item.n); else if (a.gold) ctx.st.gold += a.gold; else if (a.gear) ctx.addGear(a.gear); }
      save(); ctx.save(); ctx.log('📮 Envio cancelado: os anexos voltaram para você (o selo não volta).', '#b9c6e0'); render(); return; }
  });
  setInterval(() => { const n = inbox.filter((l) => l.arrive && l.arrive <= Date.now() && !l.read && !(l as Letter & { told?: boolean }).told); if (n.length) { for (const l of n) (l as Letter & { told?: boolean }).told = true; save(); ctx.log(`📮 Chegou carta na sua caixa de correio${n.length > 1 ? ` (${n.length})` : ''}.`, '#ffe08a'); if (open) render(); } }, 3000);
  const api = {
    get isOpen() { return open; },
    open() { open = true; tab = 'in'; render(); },
    close() { open = false; render(); },
    get unread() { return unread(); },
    /** avisos do sistema (ex.: carta do quadro foi pega) também chegam à caixa */
    notice(from: string, subj: string, text: string) { inbox.push({ id: 'n' + Date.now() + Math.random(), from, to: ctx.me(), subj, text, att: [], cod: 0, t: Date.now() }); save(); },
  };
  return api;
}
