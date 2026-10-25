/* Leilão do Quadro de Avisos: além de pedir (Pedidos), dá para colocar à venda.
   Quem anuncia deixa um depósito de 1% (volta inteiro se vender); quem compra paga o preço e recebe pelo correio.
   O vendedor recebe o ouro pelo correio, menos 3% da casa (Erling, 23/10: 5% + 7% era pesado demais).
   Selos de Marghar e Lágrimas têm preço justo em tempo real (mercado.ts: oferta × procura × economia).
   Itens do Shop podem ir ao leilão enquanto não estiverem vinculados (vincula ao vestir).
   Até o servidor existir, os outros vendedores e compradores são simulados. */
import { genGear, gearIcon, gearTip, RARITY, reqLvl, type Gear } from './loot';
import type { Att } from './mail';
import { createMarket } from './mercado';

export interface Lot { id: string; seller: string; mine?: boolean; item?: { id: string; n: number }; gear?: Gear; price: number; ends: number; sold?: boolean }
interface Ctx {
  me(): string; lvl(): number; st: { gold: number };
  items(): { id: string; n: number; name: string; icon: string; sell: number; kind: string }[]; gear(): Gear[];
  take(id: string, n: number): boolean; takeGear(uid: number): Gear | null;
  itemName(id: string): string; itemIcon(id: string): string; itemKind(id: string): string; itemValue(id: string): number;
  mail(from: string, subj: string, text: string, att: Att[]): void; log(t: string, c?: string): void; save(): void;
}
const KEY = 'karmika.auction.v1', FEE = 0.01, TAX = 0.03, H = 3600e3;
const SELLERS = ['Ragnhild', 'Torstein', 'Ylva Pés-Leves', 'Bjarki', 'Solveig', 'Hakon o Ruivo', 'Asa', 'Grimur', 'Liv', 'Eskil', 'Thyra', 'Ottar'];
const SEED_ITEMS: [string, number, number][] = [['wood', 20, 2], ['stone', 20, 1.6], ['hide', 6, 6], ['ore_i', 8, 9], ['herb_g', 6, 7], ['potion', 5, 14], ['potion_g', 3, 38], ['dust', 3, 22], ['sap', 3, 20], ['gem', 1, 120], ['meat', 10, 3], ['fish', 8, 4], ['plank', 10, 7], ['nail', 20, 2], ['lagrima', 1, 1500], ['seal_p30', 1, 31000]];
const esc = (t: string) => t.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const left = (t: number) => { const m = Math.max(0, t - Date.now()) / 60e3; return m >= 60 ? `${Math.floor(m / 60)}h${Math.round(m % 60) ? String(Math.round(m % 60)).padStart(2, '0') : ''}` : `${Math.ceil(m)} min`; };

export function createAuction(ctx: Ctx) {
  let lots: Lot[] = (() => { try { return JSON.parse(localStorage.getItem(KEY) || '[]') as Lot[]; } catch { return []; } })();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(lots)); } catch { /* */ } };
  let view: 'buy' | 'sell' | 'mine' = 'buy', cat: 'all' | 'gear' | 'res' | 'use' = 'all', q = '';
  let pick = '', pickN = 1, price = 0, dur = 24;
  const market = createMarket({ econLvl: () => ctx.lvl(), supply: (id) => lots.filter((l) => l.item?.id === id).reduce((a, l) => a + l.item!.n, 0) });
  const valueOf = (l: Lot) => l.gear ? l.gear.value : market.isToken(l.item!.id) ? market.fair(l.item!.id) * l.item!.n : ctx.itemValue(l.item!.id) * l.item!.n;
  const fairTag = (l: Lot) => { if (!l.item || !market.isToken(l.item.id)) return ''; const f = market.fair(l.item.id) * l.item.n, k = l.price / f;
    return `<span class="mk-pill ${k < 0.92 ? 'cheap' : k > 1.12 ? 'dear' : ''}">justo agora: ${f.toLocaleString('pt-BR')} 🪙${k < 0.92 ? ' · barato' : k > 1.12 ? ' · caro' : ''}</span>`; };
  function marketBox(id: string, n: number) { const I = market.info(id); const arrow = I.trend > 0 ? '▲' : I.trend < 0 ? '▼' : '■';
    return `<div class="mk-box"><div class="mk-h"><b>Bolsa dos Selos</b><span class="mk-tr ${I.trend > 0 ? 'up' : I.trend < 0 ? 'dn' : ''}">${arrow}</span></div>
      <div class="mk-row"><div><small>preço justo agora</small><b>${(I.fair * n).toLocaleString('pt-BR')} 🪙</b>${n > 1 ? `<small>${I.fair.toLocaleString('pt-BR')} cada</small>` : ''}</div>${market.spark(id)}</div>
      <small class="mk-why">À venda agora: <b>${I.supply}</b> · comprados nas últimas 24 h: <b>${I.demand - 3}</b>${I.last ? ` · último negócio: <b>${I.last.toLocaleString('pt-BR')} 🪙</b>` : ''}. O preço sobe quando a procura passa a oferta e desce quando sobra selo no quadro; o nível da economia também conta.</small>
      <button class="mk-use" data-afair="${I.fair * n}">Usar o preço justo</button></div>`; }
  /* vendedores simulados: o quadro sempre tem uns 14 lotes de outros caminhantes */
  function stock() {
    const now = Date.now(); let ch = false;
    for (const l of lots) if (!l.mine && l.ends < now) { l.sold = true; ch = true; }
    lots = lots.filter((l) => l.mine || !l.sold);
    const others = lots.filter((l) => !l.mine).length;
    for (let i = others; i < 14; i++) { const who = SELLERS[Math.floor(Math.random() * SELLERS.length)], ends = now + (2 + Math.random() * 46) * H;
      if (Math.random() < 0.42) { const lv = Math.max(1, ctx.lvl() + Math.round(Math.random() * 6 - 2)), g = genGear(lv, Math.random() < 0.18 ? 'rare' : Math.random() < 0.55 ? 'magic' : 'normal'); lots.push({ id: 'a' + now + i + Math.random(), seller: who, gear: g, price: Math.max(10, Math.round(g.value * (1.3 + Math.random() * 1.4))), ends }); }
      else { const [id, n, v] = SEED_ITEMS[Math.floor(Math.random() * (ctx.lvl() >= 20 ? SEED_ITEMS.length : SEED_ITEMS.length - 2))], tok = market.isToken(id), k = tok ? 1 : Math.max(1, Math.round(n * (0.5 + Math.random()))); lots.push({ id: 'a' + now + i + Math.random(), seller: who, item: { id, n: k }, price: tok ? Math.round(market.fair(id) * (0.88 + Math.random() * 0.5)) : Math.max(2, Math.round(v * k * (0.9 + Math.random() * 0.6))), ends }); }
      ch = true; }
    if (ch) save();
  }
  /* compradores simulados: lote seu com preço justo acaba vendendo; caro demais, expira e volta pelo correio */
  function tick() {
    const now = Date.now(); let ch = false;
    for (const l of lots.filter((x) => x.mine && !x.sold)) {
      const ratio = l.price / Math.max(1, valueOf(l)), p = ratio <= 1.2 ? 0.25 : ratio <= 2 ? 0.08 : ratio <= 3.5 ? 0.02 : 0;
      if (Math.random() < p) { l.sold = true; ch = true; const dep = Math.max(1, Math.round(l.price * FEE)), net = Math.round(l.price * (1 - TAX)) + dep, who = SELLERS[Math.floor(Math.random() * SELLERS.length)]; if (l.item && market.isToken(l.item.id)) market.recordSale(l.item.id, l.price / l.item.n);
        ctx.mail('Leilão de Karmika', `Vendido: ${l.gear ? l.gear.name : `${l.item!.n}× ${ctx.itemName(l.item!.id)}`}`, `${who} comprou o seu lote por ${l.price} 🪙. A casa fica com ${Math.round(TAX * 100)}% e o depósito de ${dep} 🪙 volta junto: segue o ouro.`, [{ gold: net }]);
        ctx.log(`⚖ Leilão: ${who} comprou o seu lote. ${net} 🪙 a caminho do correio.`, '#ffd24a'); }
      else if (l.ends < now) { l.sold = true; ch = true; ctx.mail('Leilão de Karmika', `Não vendido: ${l.gear ? l.gear.name : ctx.itemName(l.item!.id)}`, 'O prazo acabou e ninguém comprou. O item volta para você (o depósito de 1% fica com a casa).', [l.gear ? { gear: l.gear } : { item: l.item! }]); }
    }
    if (ch) { lots = lots.filter((l) => !(l.mine && l.sold)); save(); }
  }
  setInterval(() => { tick(); market.sample(); }, 20000);
  const catOf = (l: Lot) => l.gear ? 'gear' : (['food', 'misc'].includes(ctx.itemKind(l.item!.id)) ? 'use' : 'res');
  const thumb = (l: Lot) => l.gear ? `<span class="aic" style="border-color:${RARITY[l.gear.rarity].col}">${gearIcon(l.gear)}</span>` : `<span class="aic">${ctx.itemIcon(l.item!.id)}<i>${l.item!.n}</i></span>`;
  const title = (l: Lot) => l.gear ? `<b style="color:${RARITY[l.gear.rarity].col}">${esc(l.gear.name)}</b><small><span class="arar" style="color:${RARITY[l.gear.rarity].col}">${RARITY[l.gear.rarity].name.toUpperCase()}</span> · <span class="${ctx.lvl() < reqLvl(l.gear) ? 'reqbad' : ''}">nível de uso ${reqLvl(l.gear)}</span></small>` : `<b>${l.item!.n}× ${esc(ctx.itemName(l.item!.id))}</b><small>${(l.price / l.item!.n).toFixed(l.price / l.item!.n < 10 ? 1 : 0)} 🪙 cada</small>`;
  function html() {
    stock();
    const tabs = `<div class="atabs"><button data-av="buy" class="${view === 'buy' ? 'on' : ''}">Comprar</button><button data-av="sell" class="${view === 'sell' ? 'on' : ''}">Vender</button><button data-av="mine" class="${view === 'mine' ? 'on' : ''}">Meus lotes (${lots.filter((l) => l.mine).length})</button></div>`;
    if (view === 'buy') {
      const list = lots.filter((l) => !l.mine && (cat === 'all' || catOf(l) === cat) && (!q || (l.gear ? l.gear.name : ctx.itemName(l.item!.id)).toLowerCase().includes(q.toLowerCase()))).sort((a, b) => a.ends - b.ends);
      return `${tabs}<div class="afil"><input data-aq placeholder="buscar…" value="${esc(q)}">${(['all', 'gear', 'res', 'use'] as const).map((c) => `<button data-ac="${c}" class="${cat === c ? 'on' : ''}">${{ all: 'Tudo', gear: 'Equipamento', res: 'Recursos', use: 'Consumíveis' }[c]}</button>`).join('')}</div>
        <div class="alist">${list.length ? list.map((l) => `<div class="alot" ${l.gear ? `data-atip="${l.id}"` : ''}>${thumb(l)}<div class="ainfo">${title(l)}<small class="aby">${esc(l.seller)} · termina em ${left(l.ends)}</small>${fairTag(l)}</div><div class="abuy"><b>${l.price.toLocaleString('pt-BR')} 🪙</b><button data-abuy="${l.id}" ${ctx.st.gold < l.price ? 'disabled' : ''}>Comprar</button></div></div>`).join('') : '<em class="emptyb">Nada à venda nessa busca.</em>'}</div>
        <small class="ahint">O que você compra chega pelo correio. Você tem 🪙 ${ctx.st.gold.toLocaleString('pt-BR')}.</small>`;
    }
    if (view === 'sell') {
      const its = ctx.items().filter((i) => i.id !== 'gold'), gs = ctx.gear().filter((g) => !(g as Gear & { bound?: boolean }).bound); // vinculados não vão ao leilão
      const sel = pick.startsWith('g:') ? gs.find((g) => `g:${g.uid}` === pick) : null, si = pick.startsWith('i:') ? its.find((i) => `i:${i.id}` === pick) : null;
      const tok = si && market.isToken(si.id), base = sel ? sel.value : si ? (tok ? market.fair(si.id) : si.sell) * Math.min(pickN, si.n) : 0; if (!price && base) price = tok ? base : Math.max(2, Math.round(base * 1.5));
      return `${tabs}<div class="asell"><label>O que vender<select data-ap><option value="">— escolha da mochila —</option><optgroup label="Equipamentos">${gs.map((g) => `<option value="g:${g.uid}" ${pick === `g:${g.uid}` ? 'selected' : ''}>${esc(g.name)} · ${RARITY[g.rarity].name}</option>`).join('')}</optgroup><optgroup label="Itens">${its.map((i) => `<option value="i:${i.id}" ${pick === `i:${i.id}` ? 'selected' : ''}>${i.icon} ${esc(i.name)} (${i.n})</option>`).join('')}</optgroup></select></label>
        ${si ? `<label>Quantidade<input data-apn type="number" min="1" max="${si.n}" value="${Math.min(pickN, si.n)}"></label>` : ''}
        <label>Preço total (🪙)<input data-app type="number" min="1" value="${price || ''}" placeholder="0"></label>
        <label>Duração<select data-ad>${[12, 24, 48].map((h) => `<option value="${h}" ${dur === h ? 'selected' : ''}>${h} horas</option>`).join('')}</select></label>
        ${sel ? `<div class="aprev">${gearTip(sel)}</div>` : ''}${tok ? marketBox(si!.id, Math.min(pickN, si!.n)) : ''}
        <div class="afee">${base && !tok ? `<small>O mercador pagaria ${base.toLocaleString('pt-BR')} 🪙.</small>` : ''}<small>Depósito (${Math.round(FEE * 100)}%): <b>${Math.max(1, Math.round((price || 0) * FEE))} 🪙</b>, volta inteiro se vender. Na venda, a casa fica com só ${Math.round(TAX * 100)}%.</small></div>
        <button class="apost" data-apost ${!pick || !price ? 'disabled' : ''}>Pregar no quadro</button></div>`;
    }
    const mine = lots.filter((l) => l.mine);
    return `${tabs}<div class="alist">${mine.length ? mine.map((l) => `<div class="alot mine">${thumb(l)}<div class="ainfo">${title(l)}<small class="aby">termina em ${left(l.ends)} · o mercador pagaria ${valueOf(l)} 🪙</small></div><div class="abuy"><b>${l.price.toLocaleString('pt-BR')} 🪙</b><button data-acancel="${l.id}" class="ghost">Retirar</button></div></div>`).join('') : '<em class="emptyb">Você não tem nada à venda. Use a aba Vender.</em>'}</div>
      <small class="ahint">Preço justo vende rápido; caro demais pode expirar. O que não vender volta pelo correio.</small>`;
  }
  /** devolve true se tratou o clique */
  function click(t: HTMLElement): boolean {
    const d = (k: string) => (t.closest(`[data-${k}]`) as HTMLElement | null)?.getAttribute(`data-${k}`);
    const av = d('av'); if (av) { view = av as typeof view; return true; }
    const ac = d('ac'); if (ac) { cat = ac as typeof cat; return true; }
    const ab = d('abuy'); if (ab) { const l = lots.find((x) => x.id === ab); if (!l) return true; if (ctx.st.gold < l.price) { ctx.log('Ouro insuficiente.', '#ff9a8a'); return true; }
      ctx.st.gold -= l.price; lots = lots.filter((x) => x !== l); save(); ctx.save(); if (l.item && market.isToken(l.item.id)) market.recordSale(l.item.id, l.price / l.item.n);
      ctx.mail('Leilão de Karmika', `Compra: ${l.gear ? l.gear.name : `${l.item!.n}× ${ctx.itemName(l.item!.id)}`}`, `Você arrematou o lote de ${l.seller} por ${l.price} 🪙. Retire o anexo em qualquer caixa de correio.`, [l.gear ? { gear: l.gear } : { item: l.item! }]);
      ctx.log(`⚖ Comprou por ${l.price} 🪙. Chega pelo correio em instantes.`, '#ffd24a'); return true; }
    { const fp = d('afair'); if (fp) { price = +fp; return true; } }
    if (t.closest('[data-apost]')) { if (!pick || price <= 0) return true; const fee = Math.max(1, Math.round(price * FEE)); if (ctx.st.gold < fee) { ctx.log(`Faltam ${fee - ctx.st.gold} 🪙 para o depósito.`, '#ff9a8a'); return true; }
      let lot: Lot | null = null;
      if (pick.startsWith('g:')) { const g = ctx.takeGear(+pick.slice(2)); if (g) lot = { id: 'm' + Date.now(), seller: ctx.me(), mine: true, gear: g, price, ends: Date.now() + dur * H }; }
      else { const id = pick.slice(2), have = ctx.items().find((i) => i.id === id)?.n ?? 0, n = Math.min(pickN, have); if (n > 0 && ctx.take(id, n)) lot = { id: 'm' + Date.now(), seller: ctx.me(), mine: true, item: { id, n }, price, ends: Date.now() + dur * H }; }
      if (!lot) return true; ctx.st.gold -= fee; lots.push(lot); save(); ctx.save(); pick = ''; pickN = 1; price = 0; view = 'mine';
      ctx.log(`⚖ Lote pregado no quadro por ${lot.price} 🪙 (depósito de ${fee} 🪙, volta se vender).`, '#ffe08a'); return true; }
    const cc = d('acancel'); if (cc) { const l = lots.find((x) => x.id === cc); if (!l) return true; lots = lots.filter((x) => x !== l); save();
      ctx.mail('Leilão de Karmika', `Retirado: ${l.gear ? l.gear.name : ctx.itemName(l.item!.id)}`, 'Você tirou o lote do quadro. Aqui está ele de volta.', [l.gear ? { gear: l.gear } : { item: l.item! }]); ctx.log('⚖ Lote retirado: volta pelo correio.', '#b9c6e0'); return true; }
    return false;
  }
  function input(f: HTMLInputElement) {
    if (f.dataset.aq !== undefined) { q = f.value; return 'soft'; }
    if (f.dataset.ap !== undefined) { pick = f.value; pickN = 1; price = 0; return 'hard'; }
    if (f.dataset.apn !== undefined) { pickN = Math.max(1, Math.floor(+f.value || 1)); return 'none'; }
    if (f.dataset.app !== undefined) { price = Math.max(0, Math.floor(+f.value || 0)); const b = f.closest('.asell')?.querySelector('.afee b'); if (b) b.textContent = `${Math.max(1, Math.round(price * FEE))} 🪙`; const pb = f.closest('.asell')?.querySelector('[data-apost]') as HTMLButtonElement | null; if (pb) pb.disabled = !pick || !price; return 'none'; }
    if (f.dataset.ad !== undefined) { dur = +f.value || 24; return 'none'; }
    return 'none';
  }
  const tipOf = (id: string) => { const l = lots.find((x) => x.id === id); return l?.gear ? gearTip(l.gear) : ''; };
  return { html, click, input, tipOf, get count() { stock(); return lots.filter((l) => !l.mine).length; } };
}
