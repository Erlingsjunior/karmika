/* AMIGOS, CONVERSAS E GUILDA (26/10). Uma janela quadrada com abas (regra das janelas: nunca uma "linguiça").
   - Amigos: da CONTA. Pedido por apelido ou pelo Ctrl+clique num jogador; status (no mundo como X, no menu, visto há…).
   - Conversas: por conta, funcionam no menu e no mundo; quem está fora recebe quando entrar (o servidor guarda).
   - Guilda: do PERSONAGEM. Fundar pede nível 20, a Carta Patente do Escrivão-Mor de Askavik e o Magistrado de Lumenhal.
     Membros e postos, mensagem do dia, chat da guilda, mercado só dos membros (sem taxa) e o terreno da guilda. */
import type { Hub } from './hub';
import { account, setNick } from './hub';
import { floatWin, promptBox } from './windows';

export interface GMember { k: string; name: string; rank: string; joined: number; on?: boolean; where?: string; char?: string; seen?: number }
export interface GListing { id: number; by: string; price: number; at: number; att: { item?: { id: string; n: number }; gear?: { name: string; rarity: string; icon: string; uid?: number } } }
export interface Guild { id: number; name: string; tag: string; col: string; plot: number; motd: string; created: number; members: GMember[]; market: GListing[]; log: { at: number; from?: string; sys?: number; text: string }[] }
interface Friend { id: string; nick: string; on: boolean; where?: string; char?: string; seen?: number }
interface AMail { id: number; from: string; fromId?: string; subj: string; text: string; att: { item?: { id: string; n: number }; gear?: { name: string; rarity: string } & Record<string, unknown> }[]; t: number; read?: boolean; local?: boolean }
interface Dm { from: string; fromNick: string; to: string; text: string; at: number }
const RANK_NAME: Record<string, string> = { lider: 'Líder', oficial: 'Oficial', membro: 'Membro', recruta: 'Recruta' };
const esc = (t: string) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const ago = (t?: number) => { if (!t) return 'nunca visto'; const m = Math.round((Date.now() - t) / 60000); return m < 2 ? 'agora há pouco' : m < 60 ? `há ${m} min` : m < 1440 ? `há ${Math.round(m / 60)} h` : `há ${Math.round(m / 1440)} d`; };

export function createSocial(ctx: {
  hub: Hub; char(): string; lvl(): number; gold(): number; payGold(n: number): boolean; log(t: string, c?: string): void;
  items(): { id: string; n: number; name: string; icon: string }[]; gear(): { uid: number; name: string; rarity: string; icon: string; ilvl: number }[];
  takeItem(id: string, n: number): boolean; takeGear(uid: number): unknown; itemName(id: string): string; itemIcon(id: string): string; rarityCol(r: string): string;
  ask(title: string, text: string, yes: string, cb: (ok: boolean) => void): void; chars(): { i: number; name: string; lvl: number; active: boolean }[]; toChar(i: number, l: { from: string; subj: string; text: string; att: unknown[] }): boolean; plotText(plot: number): string; markPlot(plot: number): void; hasCarta(): boolean; useCarta(): void; seedHall(plot: number): { kind: string; gx: number; gy: number; v: number }[];
  onWorld?(list: { id: number; name: string; tag: string; col: string; plot: number; build: { kind: string; gx: number; gy: number; v: number }[] }[]): void; onGuild?(g: Guild | null): void;
}) {
  const H = ctx.hub;
  let me: { id: string; nick: string } | null = null, friends: Friend[] = [], reqIn: { id: string; nick: string }[] = [], reqOut: { id: string; nick: string }[] = [];
  let guild: Guild | null = null, open = false, tab: 'amigos' | 'conversa' | 'correio' | 'guilda' = 'amigos', gtab: 'membros' | 'chat' | 'mercado' | 'terreno' = 'chat', talk = '', founding = false, unread = 0;
  const DMK = 'karmika.coop.dm'; let dms: Dm[] = (() => { try { return JSON.parse(localStorage.getItem(DMK) || '[]'); } catch { return []; } })();
  const saveDm = () => { try { localStorage.setItem(DMK, JSON.stringify(dms.slice(-400))); } catch { /* */ } };
  const el = document.createElement('div'); el.id = 'socw'; el.className = 'modalw'; document.body.appendChild(el); setTimeout(() => floatWin(el, 'social', { left: '26vw', top: '8vh' }), 0);
  const badge = () => document.dispatchEvent(new CustomEvent('karmika:social', { detail: { unread, req: reqIn.length } }));

  H.on('a:me', (m) => { me = { id: m.id as string, nick: m.nick as string }; setNick(me.nick); render(); });
  H.on('a:friends', (m) => { friends = m.list as Friend[]; reqIn = m.reqIn as typeof reqIn; reqOut = m.reqOut as typeof reqOut; badge(); render(); });
  H.on('a:freq', (m) => { const f = m.from as { id: string; nick: string }; ctx.ask('👥 Pedido de amizade', `${f.nick} quer ser seu amigo. A amizade é do jogador: vale para todos os seus personagens.`, 'Aceitar', (ok) => H.send({ t: 'a:fans', id: f.id, ok })); });
  H.on('a:sys', (m) => ctx.log(`👥 ${m.text}`, '#c8d8f0'));
  H.on('a:deny', (m) => ctx.log(`👥 ${m.why}`, '#ff9a8a'));
  H.on('a:dm', (m) => { const d = m as unknown as Dm; dms.push(d); saveDm(); if (d.from !== me?.id) { ctx.log(`✉ ${d.fromNick}: ${d.text}`, '#b8a8ff'); if (!(open && tab === 'conversa' && talk === d.from)) { unread++; badge(); } } render(); });
  H.on('g:info', (m) => { guild = (m.g as Guild) ?? null; ctx.onGuild?.(guild); render(); });
  H.on('g:world', (m) => ctx.onWorld?.(m.list as never));
  H.on('g:chat', (m) => { const L = m as unknown as Guild['log'][number]; if (guild) guild.log.push(L); ctx.log(L.sys ? `⚑ ${L.text}` : `⚑ [${guild?.tag ?? 'G'}] ${L.from}: ${L.text}`, guild?.col ?? '#e0c070'); if (open && tab === 'guilda') render(); });
  H.on('g:inv', (m) => ctx.ask(`⚑ Convite de guilda`, `${m.from} convida você para a guilda ${m.name} [${m.tag}]. A guilda é deste personagem.`, 'Entrar', (ok) => H.send({ t: 'g:ans', ok })));
  H.on('g:fail', (m) => { ctx.log(`⚑ ${m.why}`, '#ff9a8a'); founding = true; render(); });
  H.on('g:ok', () => { founding = false; ctx.useCarta(); ctx.log('⚑ A guilda foi registrada pelo Magistrado. O estandarte já está de pé no seu terreno.', '#ffe08a'); tab = 'guilda'; gtab = 'terreno'; render(); });
  H.on('hub:state', () => render());
  /* 26/10 (Erling: "a aba Correio: recebemos por lá os itens que compramos fora do jogo, já no servidor, e decidimos para qual personagem
     enviar; mandamos e recebemos cartas"). É o correio da CONTA (no servidor); a caixa de correio de cada personagem continua no mundo */
  let amail: AMail[] = [], mopen = 0, mcompose = false;
  /* o INVENTÁRIO DA CONTA (fora do mundo e fora do servidor): o que se compra no Shop pelo menu cai aqui, guardado nesta máquina.
     Daqui vai para a caixa de correio de qualquer personagem seu, ou para um amigo (esse precisa do servidor) */
  const BOXK = 'karmika.acc.box'; let box: AMail[] = (() => { try { return JSON.parse(localStorage.getItem(BOXK) || '[]'); } catch { return []; } })();
  const saveBox = () => { try { localStorage.setItem(BOXK, JSON.stringify(box)); } catch { /* */ } };
  const allMail = () => [...box.map((x) => ({ ...x, local: true })), ...amail];
  H.on('a:mail', (m) => { amail = (m.list as AMail[]) ?? []; if (m.fresh) ctx.log('📮 Chegou algo no Correio da conta (F9 → Correio).', '#ffe08a'); render(); });
  function mailHtml() {
    const chars = ctx.chars();
    if (mcompose && off()) mcompose = false;
    if (mcompose) return `<div class="somail"><h4>Nova carta para um amigo</h4><select data-v="mto">${friends.map((f) => `<option value="${f.id}">${esc(f.nick)}</option>`).join('')}</select>
      <input data-v="msubj" placeholder="Assunto" maxlength="80"><textarea data-v="mtext" rows="7" maxlength="1500" placeholder="Escreva a sua carta…"></textarea>
      <div class="sorow"><button data-a="msend">✉ Enviar</button><button data-a="mback" class="ghost">Voltar</button></div>${friends.length ? '' : '<p class="somut">Cartas da conta vão para amigos: peça amizade na aba Amigos.</p>'}</div>`;
    const L = allMail().sort((a, b) => b.t - a.t), cur = L.find((x) => x.id === mopen) ?? L[0];
    if (cur && !cur.read) { cur.read = true; if (cur.local) { const b = box.find((x) => x.id === cur.id); if (b) { b.read = true; saveBox(); } } else H.send({ t: 'a:mread', id: cur.id }); }
    const attH = (a: AMail['att'][number]) => a.item ? `${ctx.itemIcon(a.item.id)} ${esc(ctx.itemName(a.item.id))}${a.item.n > 1 ? ` ×${a.item.n}` : ''}` : a.gear ? `<span style="color:${ctx.rarityCol(a.gear.rarity)}">${esc(a.gear.name)}</span>` : '?';
    return `<div class="somailw"><div class="somlist">${off() ? '<p class="somut">Sem servidor: só o inventário da conta (compras pelo menu). Cartas e envios a amigos pedem o servidor.</p>' : '<button data-a="mnew" class="sonew">✎ Escrever carta</button>'}${L.length ? L.map((x) => `<div class="somi ${x === cur ? 'on' : ''} ${x.read ? '' : 'new'}" data-mopen="${x.id}"><b>${esc(x.subj)}</b><small>${esc(x.from)} · ${ago(x.t)}${x.att.length ? ' · 📦' : ''}</small></div>`).join('') : '<p class="somut">Nada por aqui ainda.</p>'}</div>
      <div class="somread">${cur ? `<h4>${esc(cur.subj)}</h4><small>de <b>${esc(cur.from)}</b> · ${ago(cur.t)}</small><p>${esc(cur.text).replace(/\n/g, '<br>')}</p>
        ${cur.att.length ? `<div class="somatt"><h4>Anexos</h4>${cur.att.map((a) => `<div>${attH(a)}</div>`).join('')}<small>Mandar para a caixa de correio de um personagem seu:</small><div class="sorow">${chars.length ? chars.map((c) => `<button data-mto="${c.i}" data-mid="${cur.id}">${esc(c.name)} <em>nv ${c.lvl}</em></button>`).join('') : '<p class="somut">Crie um personagem primeiro.</p>'}</div>
          <small>…ou de presente para um amigo:</small><div class="sorow">${off() ? '<span class="somut">precisa do servidor</span>' : friends.length ? friends.map((f) => `<button data-mfr="${f.id}" data-mid="${cur.id}" class="ghost">🎁 ${esc(f.nick)}</button>`).join('') : '<span class="somut">nenhum amigo ainda</span>'}</div></div>` : ''}
        <div class="sorow">${cur.fromId ? `<button data-a="mreply" data-rto="${cur.fromId}" class="ghost">↩ Responder</button>` : ''}${cur.att.length ? '' : `<button data-mdel="${cur.id}" class="ghost">🗑 Apagar</button>`}</div>` : ''}</div></div>`;
  }

  const off = () => H.state !== 'on';
  function friendsHtml() {
    if (off()) return `<p class="somut">Sem servidor. Os amigos e as conversas moram no servidor: escolha um em <b>Encontrar servidor</b> (ou entre numa sala) e eles aparecem aqui, mesmo antes de entrar no mundo.</p>`;
    const row = (f: Friend) => `<div class="sofr ${f.on ? 'on' : ''}"><i></i><div><b>${esc(f.nick)}</b><small>${f.on ? (f.where === 'mundo' ? `no mundo${f.char ? ` como ${esc(f.char)}` : ''}` : `no menu${f.char ? ` · ${esc(f.char)}` : ''}`) : `fora · visto ${ago(f.seen)}`}</small></div><button data-dm="${f.id}">✉ Conversar</button><button data-fdel="${f.id}" class="ghost" title="Desfazer amizade">✕</button></div>`;
    return `<div class="sohd">Você é <b>${esc(me?.nick ?? account().nick)}</b> <button class="ghost" data-a="nick">mudar apelido</button><small>A amizade é do jogador: vale para todos os seus personagens.</small></div>
      <div class="soadd"><input data-v="nick" placeholder="Apelido do jogador" maxlength="20"><button data-a="add">＋ Pedir amizade</button></div>
      ${reqIn.length ? `<h4>Pedidos para você</h4>${reqIn.map((r) => `<div class="sofr req"><i></i><div><b>${esc(r.nick)}</b><small>quer ser seu amigo</small></div><button data-fok="${r.id}">Aceitar</button><button data-fno="${r.id}" class="ghost">Recusar</button></div>`).join('')}` : ''}
      <h4>Amigos · ${friends.filter((f) => f.on).length} de ${friends.length} conectados</h4>${friends.length ? [...friends].sort((a, b) => +b.on - +a.on || a.nick.localeCompare(b.nick)).map(row).join('') : '<p class="somut">Ninguém ainda. Peça pelo apelido aqui em cima, ou segure Ctrl e clique num jogador no mundo.</p>'}
      ${reqOut.length ? `<h4>Esperando resposta</h4>${reqOut.map((r) => `<div class="sofr"><i></i><div><b>${esc(r.nick)}</b><small>pedido enviado</small></div><button data-fdel="${r.id}" class="ghost">Cancelar</button></div>`).join('')}` : ''}`;
  }
  function talkHtml() {
    if (off()) return friendsHtml();
    if (!talk && friends.length) talk = friends[0].id;
    const f = friends.find((x) => x.id === talk); const th = dms.filter((d) => (d.from === talk && d.to === me?.id) || (d.to === talk && d.from === me?.id));
    return `<div class="sotalk"><div class="solist">${friends.map((x) => `<button data-dm="${x.id}" class="${x.id === talk ? 'on' : ''}"><i class="${x.on ? 'on' : ''}"></i>${esc(x.nick)}</button>`).join('') || '<p class="somut">Sem amigos ainda.</p>'}</div>
      <div class="sochat">${f ? `<div class="sohd"><b>${esc(f.nick)}</b><small>${f.on ? (f.where === 'mundo' ? 'no mundo' : 'no menu') : 'fora: recebe quando entrar'}</small></div><div class="solog">${th.map((d) => `<p class="${d.from === me?.id ? 'me' : ''}"><small>${new Date(d.at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</small>${esc(d.text)}</p>`).join('') || '<p class="somut">Nenhuma mensagem ainda.</p>'}</div>
      <div class="soin"><input data-v="dm" placeholder="Escreva e tecle Enter" maxlength="500"><button data-a="dmsend">Enviar</button></div>` : '<p class="somut">Escolha um amigo.</p>'}</div></div>`;
  }
  function guildHtml() {
    if (off()) return `<p class="somut">A guilda mora no servidor. Entre numa sala (ou escolha um servidor) para ver a sua.</p>`;
    if (!guild) {
      if (founding) return `<div class="sofound"><h4>Registrar a guilda</h4><p>O Magistrado abre o livro de registros de Lumenhal. Custa <b>500 de ouro</b> de taxa e a <b>Carta Patente</b>.</p>
        <label>Nome da guilda<input data-v="gname" maxlength="28" placeholder="Ex.: Os Filhos do Vale"></label><label>Sigla (2 a 4 letras)<input data-v="gtag" maxlength="4" placeholder="FDV"></label>
        <label>Cor do estandarte<input data-v="gcol" type="color" value="#b8924a"></label><div class="sorow"><button data-a="gfound" class="gold">⚑ Registrar a guilda</button><button data-a="gcancel" class="ghost">Agora não</button></div></div>`;
      return `<div class="sofound"><h4>Você ainda não tem guilda</h4><p>Entre numa guilda pelo convite de um líder ou oficial, ou funde a sua:</p>
        <ol><li>Chegue ao <b>nível 20</b> ${ctx.lvl() >= 20 ? '✔' : `(você está no ${ctx.lvl()})`}.</li><li>Fale com o <b>Escrivão-Mor Aldric</b>, em Askavik: a missão <i>O Peso de um Estandarte</i> dá a <b>Carta Patente</b> ${ctx.hasCarta() ? '✔' : ''}.</li>
        <li>Leve a carta ao <b>Magistrado Corvin Aldmar</b>, em Lumenhal, a cidade média.</li><li>Pague a taxa de <b>500 de ouro</b>, escolha o nome, a sigla e a cor. O terreno da guilda nasce perto de Lumenhal, com o salão já de pé.</li></ol></div>`;
    }
    const myR = guild.members.find((m) => m.name.toLowerCase() === ctx.char().toLowerCase())?.rank ?? 'recruta', rk = ['recruta', 'membro', 'oficial', 'lider'].indexOf(myR);
    const head = `<div class="soghd" style="--gc:${guild.col}"><span class="sogban"></span><div><b>${esc(guild.name)} <em>[${esc(guild.tag)}]</em></b><small>${guild.members.length} membros · você é ${RANK_NAME[myR]}</small></div></div>
      <div class="somotd">${esc(guild.motd || '')}${rk >= 2 ? ` <button class="ghost" data-a="motd">editar</button>` : ''}</div>
      <div class="sostab">${(['chat', 'membros', 'mercado', 'terreno'] as const).map((t) => `<button data-gt="${t}" class="${gtab === t ? 'on' : ''}">${{ chat: '💬 Chat', membros: '👥 Membros', mercado: '⚖ Mercado', terreno: '🏰 Terreno' }[t]}</button>`).join('')}</div>`;
    let body = '';
    if (gtab === 'chat') body = `<div class="solog g">${guild.log.slice(-60).map((L) => L.sys ? `<p class="sys">${esc(L.text)}</p>` : `<p><b>${esc(L.from ?? '')}</b> ${esc(L.text)}</p>`).join('')}</div><div class="soin"><input data-v="gchat" placeholder="Fale com a guilda (Enter) · no chat do jogo: /g texto" maxlength="300"><button data-a="gsend">Enviar</button></div>`;
    if (gtab === 'membros') body = [...guild.members].sort((a, b) => ['lider', 'oficial', 'membro', 'recruta'].indexOf(a.rank) - ['lider', 'oficial', 'membro', 'recruta'].indexOf(b.rank) || a.name.localeCompare(b.name)).map((m) => {
      const mine = m.name.toLowerCase() === ctx.char().toLowerCase(), r = ['recruta', 'membro', 'oficial', 'lider'].indexOf(m.rank);
      return `<div class="sofr ${m.on ? 'on' : ''}"><i></i><div><b>${esc(m.name)}</b><small>${RANK_NAME[m.rank]} · ${m.on ? (m.where === 'mundo' ? 'no mundo' : 'no menu') : `fora · ${ago(m.seen)}`}</small></div>${!mine && rk === 3 ? `<select data-rank="${esc(m.name)}">${['recruta', 'membro', 'oficial', 'lider'].map((x) => `<option value="${x}" ${x === m.rank ? 'selected' : ''}>${RANK_NAME[x]}</option>`).join('')}</select>` : ''}${!mine && rk >= 2 && r < rk ? `<button data-kick="${esc(m.name)}" class="ghost">Remover</button>` : ''}</div>`; }).join('')
      + `<p class="somut">Para convidar: segure Ctrl e clique num jogador no mundo → <b>Convidar para a guilda</b>. Recrutas viram membros quando um oficial decide.</p><button class="ghost" data-a="gleave">Sair da guilda</button>`;
    if (gtab === 'mercado') {
      const its = ctx.items(), gs = ctx.gear();
      body = `<p class="somut">Só os membros veem e compram. Sem taxa: o ouro vai inteiro para quem vendeu, pelo correio; o item chega para quem comprou, pelo correio.</p>
        ${guild.market.length ? guild.market.map((o) => { const nm = o.att.item ? `${ctx.itemIcon(o.att.item.id)} ${o.att.item.n}× ${esc(ctx.itemName(o.att.item.id))}` : `<span style="color:${ctx.rarityCol(o.att.gear!.rarity)}">${o.att.gear!.icon} ${esc(o.att.gear!.name)}</span>`; const mineO = o.by.toLowerCase() === ctx.char().toLowerCase();
          return `<div class="somk"><div>${nm}<small>de ${esc(o.by)}</small></div><b>${o.price} 🪙</b>${mineO || rk === 3 ? `<button data-mkdel="${o.id}" class="ghost">Retirar</button>` : `<button data-mkbuy="${o.id}" data-p="${o.price}">Comprar</button>`}</div>`; }).join('') : '<p class="somut">Nada à venda ainda.</p>'}
        ${rk >= 1 ? `<h4>Vender</h4><div class="sorow"><select data-v="mkwhat"><option value="">Escolha da mochila…</option>${its.map((i) => `<option value="i:${i.id}">${i.icon} ${esc(i.name)} (${i.n})</option>`).join('')}${gs.map((g) => `<option value="g:${g.uid}">${g.icon} ${esc(g.name)}</option>`).join('')}</select><input data-v="mkn" type="number" min="1" value="1" title="quantidade"><input data-v="mkp" type="number" min="1" placeholder="preço"><button data-a="mkadd">Pôr à venda</button></div>` : '<p class="somut">Recrutas ainda não vendem.</p>'}`;
    }
    if (gtab === 'terreno') body = `<p>O terreno da <b>${esc(guild.name)}</b> fica ${esc(ctx.plotText(guild.plot))}. Lá estão o salão, o estandarte e o balcão do mercado.</p>
      <p class="somut">Membros e oficiais constroem dentro do terreno com o <b>Modo de obra (B)</b>: as peças ficam no servidor e todos veem. Fora do terreno a obra é só sua, como sempre.</p><button data-a="plot">📍 Marcar o terreno no mapa</button>`;
    return head + `<div class="sogbody">${body}</div>`;
  }
  function render() {
    if (!open) { el.style.display = 'none'; return; }
    const tabs = (['amigos', 'conversa', 'correio', 'guilda'] as const).map((t) => `<button data-tab="${t}" class="${tab === t ? 'on' : ''}">${{ amigos: `👥 Amigos${reqIn.length ? ` <em>${reqIn.length}</em>` : ''}`, conversa: `💬 Conversas${unread ? ` <em>${unread}</em>` : ''}`, correio: `📮 Correio${allMail().filter((x) => !x.read || x.att.length).length ? ` <em>${allMail().filter((x) => !x.read || x.att.length).length}</em>` : ''}`, guilda: `⚑ Guilda${guild ? ` [${esc(guild.tag)}]` : ''}` }[t]}</button>`).join('');
    const st = H.state === 'on' ? '<span class="soon">● conectado</span>' : H.state === 'connecting' ? '<span class="sowait">● conectando…</span>' : '<span class="sooff">● sem servidor</span>';
    el.innerHTML = `<div class="pn sopn"><h2>Amigos e Guilda ${st}<button data-x title="Fechar">✕</button></h2><div class="altabs">${tabs}</div><div class="sobody">${tab === 'amigos' ? friendsHtml() : tab === 'conversa' ? talkHtml() : tab === 'correio' ? mailHtml() : guildHtml()}</div></div>`;
    el.style.display = 'flex'; const lg = el.querySelector('.solog') as HTMLElement | null; if (lg) lg.scrollTop = lg.scrollHeight;
  }
  const val = (k: string) => (el.querySelector(`[data-v="${k}"]`) as HTMLInputElement | null)?.value ?? '';
  function act(t: HTMLElement) {
    const d = t.dataset;
    if (t.closest('[data-x]')) { toggle(false); return; }
    if (d.tab) { tab = d.tab as typeof tab; if (tab === 'conversa') { unread = 0; badge(); } render(); return; }
    if (d.gt) { gtab = d.gt as typeof gtab; render(); return; }
    if (d.mopen) { mopen = +d.mopen; render(); return; }
    const take = (L: AMail & { local?: boolean }, del = false) => { if (L.local) { box = box.filter((x) => x.id !== L.id); saveBox(); render(); } else H.send({ t: 'a:mtake', id: L.id, del }); };
    if (d.mdel) { const L = allMail().find((x) => x.id === +d.mdel!); if (L) take(L, true); return; }
    if (d.mto) { const L = allMail().find((x) => x.id === +d.mid!); const c = ctx.chars().find((q) => q.i === +d.mto!); if (!L || !c) return;
      if (ctx.toChar(c.i, { from: L.from, subj: L.subj, text: L.text, att: L.att })) { take(L); ctx.log(`📮 ${L.subj}: mandado para a caixa de correio de ${c.name}.`, '#ffe08a'); } return; }
    if (d.mfr) { const L = allMail().find((x) => x.id === +d.mid!); const f = friends.find((q) => q.id === d.mfr); if (!L || !f || off()) return;
      ctx.ask('🎁 Presente', `Mandar <b>${esc(L.subj)}</b> para ${esc(f.nick)}? Chega no Correio da conta dele, e ele escolhe o personagem.`, 'Mandar', (ok) => { if (!ok) return; H.send({ t: 'a:msend', to: f.id, subj: L.subj, text: `${me?.nick ?? 'Um amigo'} mandou de presente:\n\n${L.text}`, att: L.att }); take(L); }); return; }
    if (d.a === 'mnew') { mcompose = true; render(); return; }
    if (d.a === 'mback') { mcompose = false; render(); return; }
    if (d.a === 'mreply') { mcompose = true; render(); const sel = el.querySelector('[data-v="mto"]') as HTMLSelectElement | null; if (sel) sel.value = d.rto!; return; }
    if (d.a === 'msend') { const to = val('mto'), text = (el.querySelector('[data-v="mtext"]') as HTMLTextAreaElement | null)?.value ?? ''; if (!to || !text.trim()) return; H.send({ t: 'a:msend', to, subj: val('msubj'), text }); mcompose = false; render(); return; }
    if (d.dm) { tab = 'conversa'; talk = d.dm; unread = 0; badge(); render(); setTimeout(() => (el.querySelector('[data-v="dm"]') as HTMLInputElement | null)?.focus(), 0); return; }
    if (d.fdel) { H.send({ t: 'a:fdel', id: d.fdel }); return; }
    if (d.fok) { H.send({ t: 'a:fans', id: d.fok, ok: true }); return; }
    if (d.fno) { H.send({ t: 'a:fans', id: d.fno, ok: false }); return; }
    if (d.kick) { ctx.ask('⚑ Remover da guilda', `Remover ${d.kick} da guilda?`, 'Remover', (ok) => { if (ok) H.send({ t: 'g:kick', char: d.kick }); }); return; }
    if (d.mkdel) { H.send({ t: 'g:mk:del', id: +d.mkdel }); return; }
    if (d.mkbuy) { const p = +d.p!; if (!ctx.payGold(p)) { ctx.log(`⚖ Falta ouro: ${p} 🪙.`, '#ff9a8a'); return; } H.send({ t: 'g:mk:buy', id: +d.mkbuy, paid: p }); ctx.log(`⚖ Compra feita: ${p} 🪙. O item chega pelo correio.`, '#ffe08a'); return; }
    switch (d.a) {
      case 'add': { const n = val('nick').trim(); if (n) H.send({ t: 'a:freq', nick: n }); break; }
      case 'nick': { promptBox('Seu apelido de jogador (vale para todos os personagens):', me?.nick ?? '', (n) => { if (n) H.send({ t: 'a:nick', nick: n }); }, 24); break; }
      case 'dmsend': sendDm(); break;
      case 'gsend': sendG(); break;
      case 'motd': { promptBox('Mensagem do dia da guilda:', guild?.motd ?? '', (tx) => H.send({ t: 'g:motd', text: tx }), 200); break; }
      case 'gleave': ctx.ask('⚑ Sair da guilda', `Sair da ${guild?.name}? Se você for o último, a guilda acaba.`, 'Sair', (ok) => { if (ok) H.send({ t: 'g:leave' }); }); break;
      case 'plot': if (guild) ctx.markPlot(guild.plot); break;
      case 'gcancel': founding = false; render(); break;
      case 'gfound': { const name = val('gname').trim(), tag = val('gtag').trim(), col = val('gcol');
        if (ctx.lvl() < 20) { ctx.log('⚑ É preciso nível 20 para fundar uma guilda.', '#ff9a8a'); break; } if (!ctx.hasCarta()) { ctx.log('⚑ Falta a Carta Patente do Escrivão-Mor de Askavik.', '#ff9a8a'); break; }
        if (ctx.gold() < 500) { ctx.log('⚑ A taxa do registro é 500 de ouro.', '#ff9a8a'); break; } if (name.length < 3 || tag.length < 2) { ctx.log('⚑ O nome precisa de 3 letras e a sigla de 2 a 4.', '#ff9a8a'); break; }
        if (!ctx.payGold(500)) break; founding = false; H.send({ t: 'g:create', name, tag, col, seed: [] }); break; }
      case 'mkadd': { const w = val('mkwhat'), p = Math.floor(+val('mkp')), n = Math.max(1, Math.floor(+val('mkn') || 1)); if (!w || !(p > 0)) { ctx.log('⚖ Escolha o item e o preço.', '#ff9a8a'); break; }
        if (w.startsWith('i:')) { const id = w.slice(2); if (!ctx.takeItem(id, n)) { ctx.log('⚖ Você não tem tudo isso.', '#ff9a8a'); break; } H.send({ t: 'g:mk:add', att: { item: { id, n } }, price: p }); }
        else { const g = ctx.takeGear(+w.slice(2)); if (!g) break; H.send({ t: 'g:mk:add', att: { gear: g }, price: p }); }
        ctx.log('⚖ Oferta posta no mercado da guilda.', '#ffe08a'); break; }
    }
  }
  function sendDm() { const tx = val('dm').trim(); if (!tx || !talk) return; H.send({ t: 'a:dm', to: talk, text: tx }); (el.querySelector('[data-v="dm"]') as HTMLInputElement).value = ''; }
  function sendG() { const tx = val('gchat').trim(); if (!tx) return; H.send({ t: 'g:chat', text: tx }); (el.querySelector('[data-v="gchat"]') as HTMLInputElement).value = ''; }
  el.addEventListener('click', (e) => { const t = (e.target as HTMLElement).closest('button,[data-dm]') as HTMLElement | null; if (t) act(t); });
  el.addEventListener('change', (e) => { const t = e.target as HTMLSelectElement; if (t.dataset.rank) H.send({ t: 'g:rank', char: t.dataset.rank, rank: t.value }); });
  el.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key !== 'Enter') return; const t = e.target as HTMLElement; if (t.dataset.v === 'dm') sendDm(); else if (t.dataset.v === 'gchat') sendG(); else if (t.dataset.v === 'nick') act(el.querySelector('[data-a="add"]') as HTMLElement); });
  /* 26/10 (Erling: "um menu do lado esquerdo — encontrar servidor etc. — e do lado direito o nosso chat fora dos servers, a guilda e o chat
     dela, para chamar a galera antes mesmo de entrar"): no menu inicial a janela fica presa à direita, sempre aberta */
  /* 26/10 (Erling: "a modal de amigos e guilda presa na lateral pode ser solta"): no menu ela abre sozinha uma vez, mas é a janela
     de sempre — arrasta, fecha e reabre pelo botão do menu */
  let docked = false, openBefore = false;
  function dock(on: boolean) { if (on === docked) return; docked = on; if (on) { openBefore = open; open = false; } else open = openBefore; render(); } /* no menu ela não abre sozinha (cobria os botões): abre pelo botão Amigos e Guilda */
  function toggle(on = !open, t?: typeof tab) { open = on; if (t) tab = t; if (open && tab === 'conversa') { unread = 0; badge(); } render(); }
  return {
    /** compra feita pelo menu: cai no inventário da conta */
    toBox(l: { from: string; subj: string; text: string; att: unknown[] }) { box.push({ id: -Date.now() - Math.floor(Math.random() * 1000), from: l.from, subj: l.subj, text: l.text, att: l.att as AMail['att'], t: Date.now() }); saveBox(); render(); },
    toggle, dock, get isOpen() { return open; }, get online() { return H.state === 'on'; }, get guild() { return guild; }, get unread() { return unread; },
    /** Ctrl+clique num jogador */ friendChar(name: string) { if (off()) { ctx.log('👥 Sem servidor: amizades moram no servidor.', '#ff9a8a'); return; } H.send({ t: 'a:freq', char: name }); },
    inviteGuild(name: string) { if (!guild) { ctx.log('⚑ Você não tem guilda.', '#ff9a8a'); return; } H.send({ t: 'g:inv', char: name }); },
    /** o Magistrado abre o livro de registros */ startFounding() { founding = true; toggle(true, 'guilda'); },
    guildChat(text: string) { if (!guild) { ctx.log('⚑ Você não tem guilda.', '#ff9a8a'); return; } H.send({ t: 'g:chat', text }); },
  };
}
export type Social = ReturnType<typeof createSocial>;
