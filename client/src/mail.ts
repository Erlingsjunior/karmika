/* Correio de Karmika: caixas de correio em cada povoado. Cartas entre jogadores com anexos (itens, equipamento, ouro)
   e cobrança na entrega — o jeito de fechar uma venda combinada no chat. Local por enquanto: enviar para si mesmo
   chega pelo corvo; para outros jogadores fica "a caminho" até o servidor multijogador existir (dá para cancelar). */
import type { Gear } from './loot';
import { RARITY } from './loot';

export interface Att { item?: { id: string; n: number }; gear?: Gear; gold?: number }
export interface Letter { id: string; from: string; to: string; subj: string; text: string; att: Att[]; cod: number; t: number; read?: boolean; arrive?: number }
interface Ctx {
  me(): string; town(): string;
  st: { gold: number };
  items(): { id: string; n: number; name: string; icon: string }[];
  gear(): Gear[];
  take(id: string, n: number): boolean; add(id: string, n: number): boolean;
  takeGear(uid: number): Gear | null; addGear(g: Gear): boolean;
  itemName(id: string): string; itemIcon(id: string): string;
  log(t: string, c?: string): void; save(): void;
  /** jogar junto: manda a carta pelo servidor da sala (true = foi) */
  post?(l: Letter): boolean;
}

const esc = (t: string) => t.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const ld = <T,>(k: string, d: T): T => { try { return JSON.parse(localStorage.getItem(k) || 'null') ?? d; } catch { return d; } };
const sv = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* */ } };
const POSTAGE = 5, PER_ATT = 2, MAX_ATT = 6;

export function createMail(ctx: Ctx) {
  const WELCOME = (nm: string): Letter[] => { const t = Date.now(); return [
    { id: 'w1', from: 'KARMIKA', to: nm, subj: 'Bem-vindo ao mundo de Karmika', t: t - 2, att: [], cod: 0, text: `${nm},\n\nCada escolha importa. Você já fez a sua: veio ao mundo de Karmika.\n\nAqui ninguém nasce herói. Você começa como gente comum, numa vila pequena, e o que vai ser depende do que fizer: das guildas em que entrar, das academias onde estudar, de quem salvar e de quem deixar para trás. Cada ato pesa no seu karma, e o karma não esquece.\n\nNem a morte é o fim. Quem cai desencarna e volta, e a alma traz as marcas da vida anterior. Profetas reconhecem almas antigas. Inimigos também.\n\nKARMIKA é uma história madura, sem lado bom e sem lado mau, feita para quem joga há décadas e para quem está começando agora. É uma aventura para anos, e para ser vivida junto: escreva cartas, forme grupos, prenda avisos no quadro da praça, faça amigos e rivais. O mundo é feito pelos caminhantes.\n\nQue o Olho veja os seus passos.\n\nCom carinho,\nquem faz KARMIKA` },
    { id: 'w2', from: 'Correio de Karmika', to: nm, subj: 'Como funciona o correio', t: t - 1, att: [], cod: 0, text: `Toda vila e cidade tem uma caixa de correio de ferro, com um corvo no topo. Quando o envelope dourado brilha em cima dela, tem carta esperando por você.\n\nO que dá para fazer:\n• Escrever para qualquer caminhante pelo nome.\n• Anexar itens, equipamentos e ouro (até 6 anexos).\n• Cobrar na entrega: quem recebe paga para retirar os anexos. É o jeito seguro de fechar uma venda combinada no chat.\n\nTudo o que você compra no Shop ou no Leilão do quadro da praça também chega aqui. O selo custa 5 moedas, mais 2 por anexo.` },
    { id: 'w3', from: 'Garrick, Guarda da Cidade', to: nm, subj: 'Um baú espera por você', t, att: [], cod: 0, text: `Caminhante,\n\nOs que chegaram antes de você deixaram presentes para a sua jornada no seu Baú do Caminhante, perto do centro da vila: poções, pão, um Pergaminho do Regresso, uma arma e roupas para a estrada. Abra o baú e pegue o que quiser.\n\nÉ o mesmo baú em toda vila e cidade de Karmika: o que você guardar aqui, retira em Askavik ou em qualquer outro povoado.\n\nDepois, venha falar comigo perto da fonte. Tenho trabalho para você.\n\n— Garrick` },
  ]; };
  let inbox: Letter[] = ld('karmika.post.in', WELCOME(ctx.me()));
  if (!inbox.some((l) => l.id === 'w1')) { inbox = [...inbox.filter((l) => l.id !== 'w0'), ...WELCOME(ctx.me())]; sv('karmika.post.in', inbox); } // quem já jogava recebe as cartas novas
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
    if (ctx.post?.(l)) return 'net';
    outbox.unshift(l); return false;
  }
  let sel: string | null = null;
  const when = (t: number) => { const d = new Date(t), now = new Date(); return d.toDateString() === now.toDateString() ? d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }); };
  const initial = (n: string) => esc((n.trim()[0] || '?').toUpperCase());
  const hue = (n: string) => { let h = 0; for (const c of n) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
  function render() {
    if (!open) { el.style.display = 'none'; return; }
    const list = tab === 'out' ? outbox : arrived().slice().reverse();
    if (tab !== 'new' && (!sel || !list.some((l) => l.id === sel))) sel = list[0]?.id ?? null;
    const cur = list.find((l) => l.id === sel) ?? null;
    if (cur && tab === 'in' && !cur.read && !cur.att.length) { cur.read = true; save(); }
    const rows = list.length ? list.map((l) => { const who = tab === 'out' ? l.to : l.from, snip = l.text.replace(/\s+/g, ' ').slice(0, 70);
      return `<div class="mrow2 ${l.id === sel && tab !== 'new' ? 'sel' : ''} ${tab === 'in' && !l.read ? 'unread' : ''}" data-msel="${l.id}"><i class="mav" style="background:hsl(${hue(who)} 35% 32%)">${initial(who)}</i><div class="mrt"><div class="mr1"><b>${esc(who)}</b><time>${tab === 'out' ? 'a caminho' : when(l.t)}</time></div><div class="mr2">${l.att.length ? '<span class="clip" title="com anexos">📎</span>' : ''}${l.cod ? '<span class="clip" title="cobrança na entrega">🪙</span>' : ''}<span>${esc(l.subj)}</span></div><div class="mr3">${esc(snip)}</div></div></div>`; }).join('')
      : `<em class="mempty">${tab === 'out' ? 'Nada a caminho.' : 'Nenhuma carta.'}</em>`;
    const items = ctx.items(), gear = ctx.gear();
    const compose = `<div class="mread"><div class="mrh"><h3>Nova carta</h3><small>De ${esc(ctx.me())} · ${esc(ctx.town())}</small></div><div class="mform">
      <label class="mfl">Para<input data-mf="to" maxlength="24" placeholder="nome do jogador" value="${esc(draft.to)}"></label><label class="mfl">Assunto<input data-mf="subj" maxlength="60" placeholder="assunto" value="${esc(draft.subj)}"></label>
      <textarea data-mf="text" rows="6" maxlength="500" placeholder="Escreva a carta…">${esc(draft.text)}</textarea>
      <div class="mrow"><select data-mp="item"><option value="">📎 anexar item da mochila</option>${items.map((i) => `<option value="${i.id}" ${pickItem === i.id ? 'selected' : ''}>${i.icon} ${esc(i.name)} (${i.n})</option>`).join('')}</select><input data-mp="n" type="number" min="1" value="${pickN}"><button data-madd="item">Anexar</button></div>
      <div class="mrow"><select data-mp="gear"><option value="">📎 anexar equipamento</option>${gear.map((g) => `<option value="${g.uid}" ${pickGear === String(g.uid) ? 'selected' : ''}>${esc(g.name)} (${RARITY[g.rarity].name})</option>`).join('')}</select><button data-madd="gear">Anexar</button></div>
      <div class="mrow"><label>Enviar ouro <input data-mf="gold" type="number" min="0" value="${draft.gold || ''}" placeholder="0"></label><label title="Quem receber paga este valor para retirar os anexos; o ouro volta para você pelo correio">Cobrar na entrega <input data-mf="cod" type="number" min="0" value="${draft.cod || ''}" placeholder="0"></label></div>
      ${draft.att.length ? `<div class="matt">${draft.att.map((a, i) => `${attHtml(a)}<i data-mrm="${i}" title="tirar">✕</i>`).join('')}</div>` : '<small class="mhint">Sem anexos.</small>'}
      <div class="mrow msendrow"><button data-msend>Selar e enviar · ${fee()} 🪙</button><small class="mhint">Selo ${POSTAGE} 🪙 + ${PER_ATT} 🪙 por anexo · até ${MAX_ATT} anexos</small></div></div></div>`;
    const reader = !cur ? `<div class="mread mnone"><span>📮</span><small>Selecione uma carta</small></div>`
      : `<div class="mread"><div class="mrh"><h3>${esc(cur.subj)}</h3><div class="mfrom"><i class="mav big" style="background:hsl(${hue(tab === 'out' ? cur.to : cur.from)} 35% 32%)">${initial(tab === 'out' ? cur.to : cur.from)}</i><div><b>${esc(cur.from)}</b><small>para ${esc(cur.to || ctx.me())} · ${new Date(cur.t).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</small></div></div></div>
        <div class="mtext">${esc(cur.text).replace(/\n/g, '<br>') || '<em>(sem texto)</em>'}</div>
        ${cur.att.length ? `<div class="mattbox"><small>${cur.att.length} anexo${cur.att.length > 1 ? 's' : ''}</small><div class="matt">${cur.att.map(attHtml).join('')}</div>${cur.cod ? `<small class="mcod">Cobrança na entrega: <b>${cur.cod} 🪙</b> — o ouro vai para ${esc(cur.from)}.</small>` : ''}</div>` : ''}
        <div class="mact">${tab === 'out' ? `<small class="mhint">O corvo espera o servidor multijogador para chegar até outro caminhante.</small><button data-mcancel="${cur.id}" class="ghost">Cancelar envio</button>`
          : `${cur.att.length ? `<button data-mtake="${cur.id}">${cur.cod ? `Pagar ${cur.cod} 🪙 e retirar` : 'Retirar anexos'}</button>` : ''}<button data-mreply="${cur.id}" class="ghost">↩ Responder</button>${cur.att.length ? '' : `<button data-mdel="${cur.id}" class="ghost">🗑 Apagar</button>`}`}</div></div>`;
    el.innerHTML = `<div class="pn mailpn gm"><h2>📮 Correio de ${esc(ctx.town())} <button data-mx>✕</button></h2>
      <div class="mgrid"><nav class="mfold"><button class="mcompose" data-mt="new">✎ Escrever</button>
        <button data-mt="in" class="${tab === 'in' ? 'on' : ''}">📥 Recebidas${unread() ? `<i class="badge">${unread()}</i>` : ''}</button>
        <button data-mt="out" class="${tab === 'out' ? 'on' : ''}">🕊 A caminho${outbox.length ? `<i class="cnt">${outbox.length}</i>` : ''}</button>
        <small class="mgold">🪙 ${ctx.st.gold}</small></nav>
        <div class="mlist">${tab === 'new' ? `<div class="mlisth">Recebidas</div>${arrived().slice().reverse().map((l) => `<div class="mrow2 ${!l.read ? 'unread' : ''}" data-mopen="${l.id}"><i class="mav" style="background:hsl(${hue(l.from)} 35% 32%)">${initial(l.from)}</i><div class="mrt"><div class="mr1"><b>${esc(l.from)}</b><time>${when(l.t)}</time></div><div class="mr2"><span>${esc(l.subj)}</span></div></div></div>`).join('')}` : `<div class="mlisth">${tab === 'out' ? 'A caminho' : 'Recebidas'}</div>${rows}`}</div>
        ${tab === 'new' ? compose : reader}</div><small class="ft">Esc fecha</small></div>`;
    el.style.display = 'flex';
  }
  const onF = (e: Event) => { const f = e.target as HTMLInputElement; const k = f.dataset?.mf, p = f.dataset?.mp;
    if (k === 'gold' || k === 'cod') { draft[k] = Math.max(0, Math.floor(+f.value || 0)); if (k === 'gold') { const b = el.querySelector('[data-msend]'); if (b) b.textContent = `Selar e enviar · ${fee()} 🪙`; } }
    else if (k === 'to' || k === 'subj' || k === 'text') draft[k] = f.value;
    if (p === 'item') pickItem = f.value; else if (p === 'n') pickN = Math.max(1, Math.floor(+f.value || 1)); else if (p === 'gear') pickGear = f.value; };
  el.addEventListener('input', onF); el.addEventListener('change', onF);
  el.addEventListener('keydown', (e) => { if ((e.target as HTMLElement).closest('input,textarea,select')) e.stopPropagation(); });
  el.addEventListener('click', (e) => { const t = e.target as HTMLElement; const d = (k: string) => (t.closest(`[data-${k}]`) as HTMLElement | null)?.getAttribute(`data-${k}`);
    if (t.closest('[data-mx]')) { api.close(); return; }
    const mt = d('mt'); if (mt) { tab = mt as typeof tab; render(); return; }
    const ms = d('msel'); if (ms) { sel = ms; render(); return; }
    const mo = d('mopen'); if (mo) { tab = 'in'; sel = mo; render(); return; }
    const rp = d('mreply'); if (rp) { const l = inbox.find((x) => x.id === rp); if (l) { draft.to = l.from; draft.subj = /^re:/i.test(l.subj) ? l.subj : `Re: ${l.subj}`; } tab = 'new'; render(); return; }
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
      ctx.log(self === true ? `📮 Carta selada. O corvo voa: chega na sua caixa em instantes.` : self === 'net' ? `📮 Carta para ${to} entregue ao corvo da sala (−${fee()} 🪙 de selo).` : `📮 Carta para ${to} selada. Sem sala aberta ela fica "a caminho": entre numa sala para o corvo voar.`, '#ffe08a');
      draft = { to: '', subj: '', text: '', cod: 0, gold: 0, att: [] }; tab = self === true ? 'in' : self === 'net' ? 'in' : 'out'; render(); return; }
    const tk = d('mtake'); if (tk) { const l = inbox.find((x) => x.id === tk); if (!l) return;
      if (l.cod) { if (ctx.st.gold < l.cod) { ctx.log(`📮 Faltam ${l.cod - ctx.st.gold} 🪙 para pagar a cobrança.`, '#ff9a8a'); return; } ctx.st.gold -= l.cod;
        const back: Letter = { id: 'c' + Date.now(), from: 'Correio', to: l.from, subj: `Pagamento: ${l.subj}`, text: `${ctx.me()} pagou a cobrança na entrega.`, att: [{ gold: l.cod }], cod: 0, t: Date.now() }; deliver(back); }
      const left: Att[] = [];
      for (const a of l.att) { if (a.item) { if (!ctx.add(a.item.id, a.item.n)) left.push(a); } else if (a.gold) ctx.st.gold += a.gold; else if (a.gear && !ctx.addGear(a.gear)) left.push(a); } // mochila cheia: o anexo fica na carta, nada se perde
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
    /** personagem novo: a caixa começa com as três cartas de boas-vindas */
    welcome(nm: string) { inbox = WELCOME(nm); outbox = []; save(); if (open) render(); },
    /** avisos do sistema (ex.: carta do quadro foi pega) também chegam à caixa */
    notice(from: string, subj: string, text: string) { inbox.push({ id: 'n' + Date.now() + Math.random(), from, to: ctx.me(), subj, text, att: [], cod: 0, t: Date.now() }); save(); },
    /** entrega do sistema com anexos (compras do Shop, leilão): chega na caixa em instantes */
    send(from: string, subj: string, text: string, att: Att[], delay = 4000) { inbox.push({ id: 's' + Date.now() + Math.random(), from, to: ctx.me(), subj, text, att, cod: 0, t: Date.now(), arrive: Date.now() + delay }); save(); if (open) render(); },
    refresh() { if (open) render(); },
    /** carta de outro jogador (ou do quadro de pedidos) chegou pela sala */
    receive(l: Letter) { if (inbox.some((x) => x.id === l.id)) return; inbox.push({ ...l, to: ctx.me(), arrive: Date.now() + 1500 }); save(); if (open) render(); },
    /** escrever já endereçado (menu do jogador) */
    compose(to: string) { draft = { to, subj: '', text: '', cod: 0, gold: 0, att: [] }; open = true; tab = 'new'; render(); },
    /** cartas que ficaram "a caminho" sem sala: voam assim que entrar numa */
    flush() { if (!ctx.post) return; for (let i = outbox.length - 1; i >= 0; i--) if (ctx.post(outbox[i])) outbox.splice(i, 1); save(); if (open) render(); },
  };
  return api;
}
