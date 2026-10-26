/* Shop: a loja do jogo (dinheiro real, por Pix). Botão no menu de baixo (T) e a loja da Elowen em Askavik.
   Regra de ouro: conforto e beleza, nunca força. Premium não dá atributo; as peças com brasão são as mesmas da Tecelagem Real
   (que também vende por ouro), presas ao nível 30 e só para quem escolheu o lado.
   O Pix ainda não está ligado: nada é cobrado. No modo DEV dá para simular o pagamento aprovado. */
import { FAC, FAC_PRICE, FAC_LVL, crestURL, type Fac } from './faccoes';

type Prod = { id: string; kind: 'prem' | 'fac'; name: string; brl: number; was?: number; days?: number; slots?: ('cape' | 'shield' | 'relic')[]; tag?: string; desc: string };
const brl = (v: number) => 'R$ ' + v.toFixed(2).replace('.', ',');
export const PREM_PLANS: Prod[] = [
  { id: 'p30', kind: 'prem', name: '30 dias', brl: 19.9, days: 30, desc: 'Um mês de Bênção de Marghar.' },
  { id: 'p90', kind: 'prem', name: '90 dias', brl: 49.9, was: 59.7, days: 90, tag: 'mais escolhido', desc: 'Uma estação inteira. Economize 16%.' },
  { id: 'p365', kind: 'prem', name: '1 ano', brl: 169.9, was: 238.8, days: 365, tag: 'melhor preço', desc: 'Doze meses. Economize 29%.' },
];
export const FAC_PRODS: Prod[] = [
  { id: 'cape', kind: 'fac', name: 'Manto', brl: 14.9, slots: ['cape'], desc: 'O brasão bordado nas costas.' },
  { id: 'shield', kind: 'fac', name: 'Escudo', brl: 14.9, slots: ['shield'], desc: 'O brasão pintado na frente toda.' },
  { id: 'relic', kind: 'fac', name: 'Relíquia e sigilo', brl: 24.9, slots: ['relic'], desc: 'Acende o sigilo do seu lado aos seus pés.' },
  { id: 'all', kind: 'fac', name: 'Juramento Completo', brl: 39.9, was: 54.7, slots: ['cape', 'shield', 'relic'], tag: '−27%', desc: 'Manto, escudo e relíquia, com a aura.' },
];
const PREM_PERKS: [string, string][] = [
  ['📜', '10 missões ao mesmo tempo no diário (free: 5)'],
  ['🎒', 'Bolsa do Caminhante de 36 espaços enquanto o plano durar'],
  ['✨', 'Bolsa Mágica: gemas, ervas raras, pó, seiva, tomos e pergaminhos'],
  ['🪵', 'Bolsa de Ofício: madeira, pedra, couro e materiais de profissão'],
  ['👜', 'Alforje de Marghar (68 espaços) liberado para compra'],
  ['🎁', 'Baú de Boas-Vindas melhorado'],
];
const NAMES: Record<Fac, Record<'cape' | 'shield' | 'relic', string>> = {
  fio: { cape: 'Manto da Ordem do Fio', shield: 'Escudo da Ordem do Fio', relic: 'Carretel do Primeiro Fio' },
  desf: { cape: 'Manto Desfiado', shield: 'Escudo dos Desfiados', relic: 'Tesoura da Última Porta' },
};
/* desenhos das peças para os cartões (traço simples, cores do lado) */
function art(f: Fac, slot: 'cape' | 'shield' | 'relic') {
  const c1 = FAC[f].c1, c2 = f === 'fio' ? '#1f3a6e' : '#16121a', crest = `<image href="${crestURL(f)}" x="34" y="30" width="32" height="40"/>`;
  if (slot === 'shield') return `<svg viewBox="0 0 100 100"><image href="${crestURL(f)}" x="18" y="4" width="64" height="80"/></svg>`;
  if (slot === 'cape') return `<svg viewBox="0 0 100 100"><path d="M32 12h36l6 8 10 66-14-6-12 7-12-7-12 7-14-6 6-61z" fill="${c2}" stroke="${c1}" stroke-width="2.4" stroke-linejoin="round"/>${f === 'desf' ? '<path d="M22 86l-2 9M34 86l1 10M46 88l-1 9M58 88l2 8M70 86l1 10M80 84l3 8" stroke="#b8202a" stroke-width="1.6"/>' : '<path d="M17 86l14 -6 12 7 12-7 12 7 14-6" fill="none" stroke="#f0c860" stroke-width="2.2"/>'}${crest}</svg>`;
  return f === 'fio'
    ? `<svg viewBox="0 0 100 100"><rect x="30" y="20" width="40" height="8" rx="2" fill="#8a6a40"/><rect x="30" y="72" width="40" height="8" rx="2" fill="#8a6a40"/><rect x="36" y="28" width="28" height="44" fill="#f0c860"/><path d="M36 34h28M36 40h28M36 46h28M36 52h28M36 58h28M36 64h28" stroke="#b8902e" stroke-width="1.2"/><path d="M64 60c10 4 16 14 12 26" fill="none" stroke="#f0c860" stroke-width="2"/><circle cx="50" cy="50" r="44" fill="none" stroke="#6a9aff" stroke-opacity=".35" stroke-width="1.5"/></svg>`
    : `<svg viewBox="0 0 100 100"><path d="M30 14l34 50M70 14L36 64" stroke="#8a8e96" stroke-width="5" stroke-linecap="round"/><circle cx="50" cy="40" r="3" fill="#3a3a42"/><circle cx="33" cy="74" r="10" fill="none" stroke="#b8202a" stroke-width="4"/><circle cx="67" cy="74" r="10" fill="none" stroke="#b8202a" stroke-width="4"/><path d="M12 30q8 10 0 22M88 30q-8 10 0 22" stroke="#d02a34" stroke-width="1.6" fill="none"/><circle cx="50" cy="50" r="44" fill="none" stroke="#b8202a" stroke-opacity=".35" stroke-width="1.5"/></svg>`;
}
const EYE = `<svg viewBox="0 0 32 32"><path d="M3 16c4-6 8.5-9 13-9s9 3 13 9c-4 6-8.5 9-13 9S7 22 3 16z" fill="#2a1a3a" stroke="#e6c46a" stroke-width="1.6"/><circle cx="16" cy="16" r="4.5" fill="#c9a0ff"/><circle cx="16" cy="16" r="1.8" fill="#140a1e"/><path d="M16 2v4M16 26v4M4 6l3 3M28 6l-3 3" stroke="#e6c46a" stroke-width="1.2"/></svg>`;

export type Deliv = { seal?: string; fac?: Fac; slot?: 'cape' | 'shield' | 'relic' };
export function createLoja(ctx: {
  isPremium: () => boolean; fac: () => Fac | null; lvl: () => number; until: () => number;
  owns: (uniq: string) => boolean; addDays: (d: number) => void; deliver: (subj: string, text: string, att: Deliv[]) => void; log: (t: string, c?: string) => void; dev: boolean;
}) {
  const el = document.createElement('div'); el.id = 'lojaw'; document.body.appendChild(el);
  let open = false, tab: 'prem' | 'fac' = 'prem', cart: Prod | null = null, paid = false, side: Fac = 'fio', sideSet = false;
  const until = ctx.until;
  function premCard() {
    const left = Math.ceil((until() - Date.now()) / 864e5), on = ctx.isPremium();
    return `<div class="lj-hero prem"><div class="lj-eye">${EYE}</div><div><h3>Bênção de Marghar</h3><p>O Premium deixa o dia a dia mais leve. <b>Nunca dá força:</b> nada de dano, vida, XP ou drop a mais. Um jogador free com o mesmo tempo de jogo luta de igual para igual.</p>
      <p class="lj-on">${on ? `✦ Ativa${left > 0 ? ` · ${left} dia${left > 1 ? 's' : ''} restantes` : ''}. ` : ''}O Premium é da <b>conta</b>: vale para todos os seus personagens, e a compra ativa na hora (os dias somam). Dá para comprar até pelo menu, sem entrar num servidor.</p></div></div>
      <ul class="lj-perks">${PREM_PERKS.map(([i, t]) => `<li><span>${i}</span>${t}</li>`).join('')}</ul>
      <div class="lj-plans">${PREM_PLANS.map((p) => `<button class="lj-plan ${p.tag ? 'hot' : ''}" data-buy="${p.id}">${p.tag ? `<em>${p.tag}</em>` : ''}<b>${p.name}</b><span class="lj-price">${brl(p.brl)}</span>${p.was ? `<s>${brl(p.was)}</s>` : '<span class="lj-ph">&nbsp;</span>'}<small>${p.desc}</small><small class="lj-pm">${brl(p.brl / (p.days! / 30))} por mês</small></button>`).join('')}</div>
      <small class="lj-note">Ao acabar, nada se perde: as bolsas Premium ficam lacradas com tudo dentro. Também dá para ativar com o Selo de Marghar comprado por ouro no balcão.</small>`;
  }
  function facCard() {
    const mine = ctx.fac(), lv = ctx.lvl(); if (!sideSet) side = mine ?? 'fio';
    const f = side, F = FAC[f], can = mine === f && lv >= FAC_LVL;
    const warn = can ? '' : `<p class="lj-warnf">${mine && mine !== f ? `Você jurou ${FAC[mine].name}.` : !mine ? `Você ainda não escolheu um lado${lv < FAC_LVL ? ` (a escolha vem no nível ${FAC_LVL})` : ''}.` : `Você está no nível ${lv}.`} Pode comprar, guardar ou vender estas peças, mas <b>só veste quem jurou ${F.name}, a partir do nível ${FAC_LVL}</b>.</p>`;
    return `<div class="lj-side"><button data-side="fio" class="${f === 'fio' ? 'on fio' : ''}"><img src="${crestURL('fio')}" alt="">${FAC.fio.name}${mine === 'fio' ? ' <small>seu lado</small>' : ''}</button><button data-side="desf" class="${f === 'desf' ? 'on desf' : ''}"><img src="${crestURL('desf')}" alt="">${FAC.desf.name}${mine === 'desf' ? ' <small>seu lado</small>' : ''}</button></div>
      <div class="lj-hero ${f}"><img class="lj-crest" src="${crestURL(f)}" alt=""><div><h3>${F.name}</h3><p class="lj-motto">“${F.motto}”</p><p>As mesmas peças da ${f === 'fio' ? 'Tecelagem Real do Fio' : 'Tecelagem dos Desfiados'}, em Askavik. Nenhum jogador consegue fabricar. Os atributos ficam no nível ${FAC_LVL}: com o tempo viram mais nobreza do que luta. A compra chega na sua caixa de correio.</p>${warn}</div></div>
      <div class="lj-items">${FAC_PRODS.map((p) => { const own = p.slots!.every((sl) => ctx.owns(`${f}_${sl}`)), gold = p.slots!.reduce((a, sl) => a + FAC_PRICE[sl], 0);
        return `<div class="lj-item ${f} ${p.id === 'all' ? 'bundle' : ''}">${p.tag ? `<em>${p.tag}</em>` : ''}<div class="lj-art">${p.id === 'all' ? `<div class="lj-trio">${p.slots!.map((sl) => art(f, sl)).join('')}</div>` : art(f, p.slots![0])}</div>
          <span class="lj-rar ${p.slots!.length === 1 && p.slots![0] === 'relic' ? 'relic' : 'unique'}">${p.id === 'all' ? 'ÚNICO + RELÍQUIA' : p.slots![0] === 'relic' ? 'RELÍQUIA' : 'ÚNICO'} · nível ${FAC_LVL}</span>
          <b>${p.id === 'all' ? p.name : NAMES[f][p.slots![0]]}</b><small>${p.desc}</small>
          <div class="lj-buy"><span class="lj-price">${brl(p.brl)}</span>${p.was ? `<s>${brl(p.was)}</s>` : ''}<button data-buy="${p.id}">Comprar</button>${own ? '<i>✓ você já tem</i>' : ''}</div>
          <small class="lj-gold">ou 🪙 ${gold.toLocaleString('pt-BR')} na tecelagem</small></div>`; }).join('')}</div>`;
  }
  /** fase de testes (devs e beta testers): enquanto o Pix não está ligado, toda compra sai de graça para dar para testar o Premium e os brasões.
      Quando o Pix ligar, é só trocar para false. */
  const BETA_FREE = true;
  function checkout() {
    if (!cart) return '';
    const f = side, what = cart.kind === 'prem' ? `${cart.name} de Premium` : cart.id === 'all' ? `${cart.name} · ${FAC[f].short}` : NAMES[f][cart.slots![0]];
    return `<div class="lj-co"><div class="lj-copn"><h3>${paid ? '✦ Pagamento aprovado' : 'Pagar com Pix'}</h3>
      ${paid ? `<p>${cart.kind === 'prem' ? `${what} ativado na sua conta: vale para todos os seus personagens.` : `${what} já é seu. Chega na caixa de correio do personagem ativo em instantes: retire em qualquer povoado.`}</p><button data-co-ok>Fechar</button>`
      : `<div class="lj-sum"><span>${what}</span><b>${brl(cart.brl)}</b></div><div class="lj-qr"><svg viewBox="0 0 21 21" shape-rendering="crispEdges">${qr()}</svg><small>QR Code Pix</small></div>
        <p class="lj-warn">${BETA_FREE ? 'Fase de testes: o Pix ainda não está ligado e <b>nada é cobrado</b>. Clique em <b>Receber grátis</b> para testar a compra de verdade (chega no correio).' : 'O pagamento por Pix liga junto com o servidor. Por enquanto <b>nada é cobrado</b> e este QR Code não paga nada.'}</p>
        <div class="lj-cobtn"><button data-co-x>Voltar</button>${BETA_FREE ? '<button data-co-sim class="gold">✦ Receber grátis (teste)</button>' : ctx.dev ? '<button data-co-sim class="dev">Simular pagamento aprovado (DEV)</button>' : ''}</div>`}</div></div>`;
  }
  /* um QR desenhado de enfeite (não é um código válido) */
  function qr() { let s = ''; const on = (x: number, y: number) => ((x * 7 + y * 13 + x * y) % 5) < 2; const fin = (x: number, y: number) => `<path d="M${x} ${y}h7v7h-7z M${x + 1} ${y + 1}v5h5v-5z" fill="#140e08" fill-rule="evenodd"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3" fill="#140e08"/>`;
    for (let y = 0; y < 21; y++) for (let x = 0; x < 21; x++) { const inF = (x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12); if (!inF && on(x, y)) s += `<rect x="${x}" y="${y}" width="1" height="1" fill="#140e08"/>`; }
    return `<rect width="21" height="21" fill="#f3ead6"/>${s}${fin(0, 0)}${fin(14, 0)}${fin(0, 14)}`; }
  function render() {
    if (!open) { el.style.display = 'none'; return; }
    el.innerHTML = `<div class="pn ljpn"><h2><span class="lj-t">${EYE}Shop</span><small>conforto e beleza, nunca força · pagamento por Pix</small><button data-lx>✕</button></h2>
      <nav class="lj-tabs"><button data-tab="prem" class="${tab === 'prem' ? 'on' : ''}">✦ Plano Premium</button><button data-tab="fac" class="${tab === 'fac' ? 'on' : ''}">⚑ Brasões das Facções</button><button disabled title="Em breve: aparências por cultura, montarias e mascotes cosméticos">Aparências <small>em breve</small></button></nav>
      <div class="lj-body">${tab === 'prem' ? premCard() : facCard()}</div>${checkout()}</div>`;
    el.style.display = 'flex';
  }
  function approve() {
    if (!cart) return;
    /* 26/10 (Erling: "o Premium é para o jogador e não para o personagem: se ele comprar, compra para todos"): ativa direto na conta da máquina */
    if (cart.kind === 'prem') { ctx.addDays(cart.days!); ctx.log(`✦ Premium ativo na sua conta: +${cart.name}. Vale para todos os seus personagens.`, '#c9a0ff'); }
    else { const f = side; ctx.deliver(cart.id === 'all' ? `${cart.name} · ${FAC[f].name}` : NAMES[f][cart.slots![0]], `As peças com o brasão de ${FAC[f].name}, como saíram da tecelagem. “${FAC[f].motto}.” Só veste quem jurou este lado, a partir do nível ${FAC_LVL}; qualquer um pode guardar ou vender.`, cart.slots!.map((sl) => ({ fac: f, slot: sl })));
      ctx.log(`📮 ${cart.slots!.length > 1 ? 'As peças' : 'A peça'} de ${FAC[f].name} a caminho da sua caixa de correio.`, f === 'fio' ? '#d9b45a' : '#e0303a'); }
    paid = true; render();
  }
  el.addEventListener('click', (e) => { const t = e.target as HTMLElement;
    if (t.closest('[data-lx]') || t === el) { api.close(); return; }
    const tb = (t.closest('[data-tab]') as HTMLElement | null)?.dataset.tab; if (tb) { tab = tb as 'prem' | 'fac'; render(); return; }
    const sd = (t.closest('[data-side]') as HTMLElement | null)?.dataset.side; if (sd) { side = sd as Fac; sideSet = true; render(); return; }
    const b = (t.closest('[data-buy]') as HTMLElement | null)?.dataset.buy; if (b) { cart = [...PREM_PLANS, ...FAC_PRODS].find((p) => p.id === b) ?? null; paid = false; render(); return; }
    if (t.closest('[data-co-x]') || t.closest('[data-co-ok]')) { cart = null; paid = false; render(); return; }
    if (t.closest('[data-co-sim]')) approve(); });
  const api = {
    get isOpen() { return open; },
    toggle(which?: 'prem' | 'fac') { if (which) tab = which; open = which ? true : !open; cart = null; paid = false; sideSet = false; render(); },
    close() { open = false; cart = null; render(); }, refresh() { if (open) render(); },
  };
  return api;
}
