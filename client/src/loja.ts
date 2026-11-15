/* Shop: a loja do jogo (dinheiro real, por Pix). Botão no menu de baixo (T) e a loja da Elowen em Askavik.
   Regra de ouro: conforto e beleza, nunca força. Premium não dá atributo; as peças com brasão são as mesmas da Tecelagem Real
   (que também vende por ouro), presas ao nível 20 e só para quem escolheu o lado.
   O Pix ainda não está ligado: nada é cobrado. No modo DEV dá para simular o pagamento aprovado. */
import { PACOTES, JOGO_BASE, precoPacote, meuPacote, setMeuPacote, montariasDePacote, somaMontarias } from './pacotes';
import { FAC, FAC_PRICE, FAC_LVL, crestURL, type Fac } from './faccoes';
import { giraCards } from './sistemas/loja3d';
import { DECOR, LAR_IDS, markShopBought } from './decor';

type Prod = { id: string; kind: 'prem' | 'fac' | 'mount' | 'eng' | 'pack'; /** pacote: a posição dele na lista */ pack?: number; /** engenhocas: os itens que chegam no correio */ items?: string[]; icon?: string; name: string; brl: number; was?: number; days?: number; slots?: ('cape' | 'shield' | 'relic')[]; tag?: string; desc: string };
const esc2 = (t: string) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const brl = (v: number) => 'R$ ' + v.toFixed(2).replace('.', ',');
export const PREM_PLANS: Prod[] = [
  /* 15/11 (Erling: "os itens mais caros do Shop serão 19,90", "Premium 30 dias 9,90"; "um item único é que não pode ser maior": os planos de
     90 dias e de 1 ano são a soma dos meses com desconto, por isso passam do teto; "desconto está muito alto, diminui": 16% e 29%). */
  { id: 'p30', kind: 'prem', name: '30 dias', brl: 9.9, days: 30, desc: 'Um mês de Bênção de Marghar.' },
  { id: 'p90', kind: 'prem', name: '90 dias', brl: 24.9, was: 29.7, days: 90, tag: 'mais escolhido', desc: 'Uma estação inteira. Economize 16%.' },
  { id: 'p365', kind: 'prem', name: '1 ano', brl: 84.9, was: 118.8, days: 365, tag: 'melhor preço', desc: 'Doze meses. Economize 29%.' },
];
export const FAC_PRODS: Prod[] = [
  { id: 'cape', kind: 'fac', name: 'Manto', brl: 5.9, slots: ['cape'], desc: 'O brasão bordado nas costas.' },
  { id: 'shield', kind: 'fac', name: 'Escudo', brl: 5.9, slots: ['shield'], desc: 'O brasão pintado na frente toda.' },
  { id: 'relic', kind: 'fac', name: 'Relíquia e sigilo', brl: 9.9, slots: ['relic'], desc: 'Acende o sigilo do seu lado aos seus pés.' },
  { id: 'all', kind: 'fac', name: 'Juramento Completo', brl: 15.9, was: 21.7, slots: ['cape', 'shield', 'relic'], tag: '−27%', desc: 'Manto, escudo e relíquia, com a aura.' },
];
/* 12/11 (Erling: "calcule o preço das engenhocas para comprar com cash e coloque na loja; os pacotes têm de valer a pena"):
   a régua é o Premium (15/11: 30 dias = R$ 9,90). Uma engenhoca é um conforto mais estreito que o Premium, então custa a metade: 15 dias R$ 4,90;
   30 dias R$ 6,90. O trio tem desconto sobre a soma. Os pacotes usam estes preços como "soma das partes". */
export const ENG_PRODS: Prod[] = [
  { id: 'drone_cura_d15', kind: 'eng', icon: '🛸', items: ['drone_cura_d15'], name: 'Drone de Cura · 15 dias', brl: 4.9, days: 15, desc: 'Paira no ombro e borrifa vapor medicinal: vida de volta a cada poucos segundos.' },
  { id: 'drone_cura_d30', kind: 'eng', icon: '🛸', items: ['drone_cura_d30'], name: 'Drone de Cura · 30 dias', brl: 6.9, was: 9.8, days: 30, desc: 'O mesmo drone, com corda para o mês inteiro.' },
  { id: 'escudo_auto_d15', kind: 'eng', icon: '🛡', items: ['escudo_auto_d15'], name: 'Robô de Defesa · 15 dias', brl: 4.9, days: 15, desc: 'O Escudo Automatizado: um disco de latão gira à sua volta e segura um golpe inteiro de tempos em tempos.' },
  { id: 'escudo_auto_d30', kind: 'eng', icon: '🛡', items: ['escudo_auto_d30'], name: 'Robô de Defesa · 30 dias', brl: 6.9, was: 9.8, days: 30, desc: 'O mesmo escudo, com corda para o mês inteiro.' },
  { id: 'pulseira_choque_d15', kind: 'eng', icon: '📿', items: ['pulseira_choque_d15'], name: 'Bracelete de Choque · 15 dias', brl: 4.9, days: 15, desc: 'A Pulseira de Choque: quem te acerta de perto leva a descarga de volta e trava por um instante.' },
  { id: 'pulseira_choque_d30', kind: 'eng', icon: '📿', items: ['pulseira_choque_d30'], name: 'Bracelete de Choque · 30 dias', brl: 6.9, was: 9.8, days: 30, desc: 'O mesmo bracelete, com corda para o mês inteiro.' },
  { id: 'trio_d15', kind: 'eng', icon: '🧰', items: ['drone_cura_d15', 'escudo_auto_d15', 'pulseira_choque_d15'], name: 'Trio da Companhia · 15 dias', brl: 11.9, was: 14.7, days: 15, tag: '−19%', desc: 'Drone, robô de defesa e bracelete, os três por 15 dias.' },
  { id: 'trio_d30', kind: 'eng', icon: '🧰', items: ['drone_cura_d30', 'escudo_auto_d30', 'pulseira_choque_d30'], name: 'Trio da Companhia · 30 dias', brl: 16.9, was: 20.7, days: 30, tag: 'melhor preço', desc: 'Drone, robô de defesa e bracelete, os três por 30 dias.' },
];
/* 12/11 (Erling: "não esqueça da aba Utilidades no Shop, para as ajudas de jogo que não são pay-to-win"): só o que poupa tempo e viagem, nunca força.
   Tudo aqui também se compra com ouro dentro do jogo; os preços seguem a mesma régua do Premium (30 dias = R$ 9,90). */
export const UTIL_PRODS: (Prod & { qtd?: Record<string, number> })[] = [
  { id: 'u_regresso', kind: 'eng', icon: '📜', qtd: { scroll_return: 20 }, name: '20 Pergaminhos do Regresso', brl: 1.9, desc: 'Lido, abre um caminho de volta à sua fonte-lar. Vinte viagens poupadas (no jogo, cada um custa 250 de ouro).' },
  { id: 'u_alforje', kind: 'eng', icon: '🎒', qtd: { bag_l: 1 }, name: 'Alforje de Viajante', brl: 2.9, desc: 'Uma bolsa de 24 espaços, a mesma das cidades maiores.' },
  { id: 'u_obra', kind: 'eng', icon: '🦾', qtd: { obra_auto: 1, ajudante_obra_3: 2 }, name: 'Canteiro Automatizado', brl: 4.9, was: 6.7, tag: 'para quem constrói', desc: 'O Contrato de Obra e dois Ajudantes de Obra Mk III: a casa sobe enquanto você joga.' },
  { id: 'u_viagem', kind: 'eng', icon: '🧭', qtd: { scroll_return: 5, bag_l: 1, rope: 5, tonic: 5 }, name: 'Kit do Viajante', brl: 3.9, was: 4.9, tag: '−20%', desc: 'Cinco Pergaminhos do Regresso, um Alforje, cordas e tônicos para a estrada.' },
];
/* 13/11: LAR & LAREIRA, "tudo que você gosta, da tábua ao tapete". Mobília e enfeite de casa; cada peça também se compra com ouro e tábuas no jogo (B → Mobília) */
export const LAR_PRODS: (Prod & { qtd?: Record<string, number> })[] = LAR_IDS.map((k) => ({ id: k, kind: 'eng' as const, icon: DECOR[k].icon, qtd: { [k]: 1 }, name: DECOR[k].name, brl: DECOR[k].brl!, desc: DECOR[k].desc }));
const PREM_PERKS: [string, string][] = [
  ['📜', '8 missões ao mesmo tempo no diário'],
  ['🎒', 'Bolsa do Caminhante de 36 espaços'],
  ['✨', 'Bolsa Mágica de 60 espaços: gemas, ervas raras, pó, seiva, tomos e pergaminhos'],
  ['🪵', 'Bolsa de Ofício de 60 espaços: madeira, pedra, couro e materiais de profissão'],
  ['👜', 'Alforje de Marghar (68 espaços) liberado para compra'],
  ['🏦', 'Baú das cidades com 120 espaços'],
  ['👁', 'A runa do Olho girando ao seu lado'],
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

export type ShopMount = { id: string; name: string; icon: string; where: string; lvl: number; blurb: string; col: number; kind?: 'mount' | 'pet' };
/** 03/11: preço das montarias do Shop pelo nível que o bicho pede (são aparências: todas correm igual ao Corcel Negro do Orm) */
/* 15/11 (Erling: "montaria paga até 19,90"): o teto do Shop é R$ 19,90 */
export const mountBRL = (lvl: number) => (lvl >= 45 ? 19.9 : lvl >= 30 ? 15.9 : lvl >= 15 ? 11.9 : 7.9);
export type Deliv = { seal?: string; /** quantos (padrão 1) */ n?: number; fac?: Fac; slot?: 'cape' | 'shield' | 'relic' };
export function createLoja(ctx: {
  isPremium: () => boolean; fac: () => Fac | null; lvl: () => number; until: () => number;
  owns: (uniq: string) => boolean; mounts: () => ShopMount[]; pets: () => (ShopMount & { boss?: boolean })[]; preview: (m: ShopMount, price: string, buy: () => void) => void; thumb: (id: string, cb: (url: string) => void) => void; chars: () => { i: number; name: string; lvl: number; active: boolean }[]; inMenu: () => boolean; deliver: (subj: string, text: string, att: Deliv[], to: number) => void; log: (t: string, c?: string) => void; dev: boolean;
}) {
  const el = document.createElement('div'); el.id = 'lojaw'; document.body.appendChild(el);
  let recip: number | null = null; let open = false, tab: 'pac' | 'prem' | 'fac' | 'mont' | 'pets' | 'eng' | 'util' | 'lar' = 'prem', cart: Prod | null = null, paid = false, side: Fac = 'fio', sideSet = false;
  /* 15/11 (Erling: "vamos tirar o sistema de Premium; todos os benefícios são livres para todos"): a aba não vende mais nada. Ela conta o que
     a Bênção dá e como recebê-la (o Presente de Marghar chega no correio de todo personagem). */
  function premCard() {
    const on = ctx.isPremium();
    return `<div class="lj-hero prem"><div class="lj-eye">${EYE}</div><div><h3>Bênção de Marghar</h3><p>A Bênção é <b>de todos os Caminhantes, de graça e para sempre</b>. Não existe mais plano pago: o conforto do dia a dia é igual para todo mundo.</p>
      <p class="lj-on">${on ? '✦ A Bênção está ativa na sua conta.' : 'Todo personagem recebe o <b>Presente de Marghar</b> no correio. Retire em qualquer povoado e use o item: a Bênção vale para a conta inteira e não acaba.'}</p></div></div>
      <ul class="lj-perks">${PREM_PERKS.map(([i, t]) => `<li><span>${i}</span>${t}</li>`).join('')}</ul>
      <small class="lj-note">Nada aqui dá força: dano, vida, XP e drop são iguais para todos.</small>`;
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
  /* 03/11 (Erling): "o nome: Estábulo do Domador" — as montarias raras das terras de Karmika, por Pix. Só aparência: correm igual ao melhor cavalo de ouro */
  const mountProd = (m: ShopMount & { boss?: boolean }): Prod => ({ id: m.id, kind: 'mount', name: m.name, brl: m.kind === 'pet' ? (m.boss ? 5.9 : 3.9) : mountBRL(m.lvl), desc: m.blurb });
  /* 03/11 (Erling): "a janela não precisa aumentar, a modal fica igual: diminuir os cards e colocar um olho no card que abre a montaria em 3D" */
  function mountCard(pets = false) {
    const L: (ShopMount & { boss?: boolean })[] = pets ? ctx.pets() : ctx.mounts(), lands = [...new Set(L.map((m) => m.where))], hx = (n: number) => '#' + n.toString(16).padStart(6, '0');
    return `${pets ? `<div class="lj-hero mont lj-mhero"><div class="lj-eye">🐾</div><div><h3>Pets</h3><p>Os companheiros que andam com você e buscam o que cai no chão. Os <b>filhotes de chefe</b> também caem do chefe: quem joga e derruba ganha igual a quem compra. Chegam no correio. Clique no 👁 para ver o bicho de perto.</p></div></div>` : `<div class="lj-hero mont lj-mhero"><div class="lj-eye">🐎</div><div><h3>Estábulo do Domador</h3><p>As montarias raras de cada terra de Karmika. <b>Nunca dão força:</b> correm igual ao Corcel Negro do Orm (2,4× mais rápido que a pé), que qualquer um compra com ouro. Chegam no correio. Clique no 👁 para ver o bicho de perto.</p></div></div>`}
      <div class="lj-mscroll">${lands.map((w) => `<h4 class="lj-land">${w}</h4><div class="lj-mgrid">${L.filter((m) => m.where === w).map((m) => { const p = mountProd(m);
        return `<div class="lj-mc" title="${esc2(m.blurb)}"><button class="lj-eyeb" data-view="${m.id}" title="Ver em 3D">👁</button><div class="lj-mart" data-view="${m.id}" style="background:radial-gradient(circle at 50% 38%, ${hx(m.col)}99, #1a120a 70%);box-shadow:0 0 14px ${hx(m.col)}44"><img data-th="${m.id}" alt="" hidden><span>${m.icon}</span></div>
          <span class="lj-rar">${m.kind === 'pet' ? (m.boss ? 'FILHOTE DE CHEFE' : 'PET') : 'MONTARIA'}${m.lvl ? ` · nv ${m.lvl}` : ''}</span><b>${m.name}</b><div class="lj-mbuy"><span>${brl(p.brl)}</span><button data-buy="${m.id}">Comprar</button></div></div>`; }).join('')}</div>`).join('')}</div>`;
  }
  /* 13/11 (Erling: "cards estão diferentes, precisa deixar todos parecidos de tamanho e permitir uma modal de ver o item com o olho"):
     engenhocas, utilidades e Lar & Lareira usam o MESMO cartão do Estábulo: quadro do objeto girando, olho para ver de perto, rótulo, nome, preço e Comprar */
  type P3 = Prod & { qtd?: Record<string, number> };
  const p3all = (): P3[] => [...ENG_PRODS, ...UTIL_PRODS, ...LAR_PRODS];
  const p3rar = (p: P3) => DECOR[p.id] ? (DECOR[p.id].wall ? 'PARA A PAREDE' : 'MOBÍLIA') : ENG_PRODS.includes(p) ? 'ENGENHOCA' : 'UTILIDADE';
  const p3card = (p: P3) => `<div class="lj-mc lj-p3 ${p.tag ? 'hot' : ''}" title="${esc2(p.desc)}">${p.tag ? `<em class="lj-p3tag">${p.tag}</em>` : ''}<button class="lj-eyeb" data-ver="${p.id}" title="Ver de perto">👁</button><div class="lj-mart lj-p3art" data-ver="${p.id}"><canvas class="lj-g3" data-g3="${p.id}" width="336" height="240" aria-hidden="true"></canvas></div>
    <span class="lj-rar">${p3rar(p)}</span><b>${p.name}</b><div class="lj-mbuy"><span>${brl(p.brl)}${p.was ? ` <s>${brl(p.was)}</s>` : ''}</span><button data-buy="${p.id}">Comprar</button></div></div>`;
  const p3grid = (L: P3[]) => `<div class="lj-mgrid">${L.map(p3card).join('')}</div>`;
  let ver: string | null = null;
  function verModal() { const p = ver ? p3all().find((q) => q.id === ver) : null; if (!p) return '';
    return `<div class="lj-ver" data-verx><div class="lj-verbox"><button class="lj-verx" data-verx title="Fechar">✕</button><canvas class="lj-g3 lj-verg" data-g3="${p.id}" width="672" height="480" aria-hidden="true"></canvas><span class="lj-rar">${p3rar(p)}</span><h3>${p.name}</h3><p>${p.desc}</p>${DECOR[p.id] ? `<small>No jogo (B → Mobília): 🪙 ${DECOR[p.id].gold ?? 0}${DECOR[p.id].plank ? ` e ${DECOR[p.id].plank} tábuas` : ''}</small>` : ''}<div class="lj-mbuy"><span>${brl(p.brl)}${p.was ? ` <s>${brl(p.was)}</s>` : ''}</span><button data-buy="${p.id}">Comprar</button></div></div></div>`; }
  function engCard() {
    return `<div class="lj-hero mont lj-mhero"><div class="lj-eye">⚙</div><div><h3>Engenhocas da Companhia de Latão</h3><p>As <b>mesmas</b> engenhocas que a Caravana de Latão vende por ouro a cada turno, só que com corda para <b>15 ou 30 dias</b> (Mk II). Quem junta ouro tem igual: o Shop só poupa a ida e a volta até a caravana. Chegam no correio; o relógio só começa quando você usa. Um de cada tipo por vez.</p></div></div>
      <div class="lj-mscroll">${p3grid(ENG_PRODS)}</div>`;
  }
  function larCard() {
    return `<div class="lj-hero mont lj-mhero"><div class="lj-eye">🏡</div><div><h3>Lar & Lareira</h3><p>Tudo que você gosta, <b>da tábua ao tapete</b>. Mobília e enfeite para a sua casa: nada aqui dá força, e cada peça também se compra com ouro e tábuas dentro do jogo (B → Mobília). Chegam no correio; use a peça na mochila para escolher o lugar.</p></div></div>
      <div class="lj-mscroll">${['Móveis', 'Luz e fogo', 'Adega e masmorra', 'Cozinha e mesa', 'Paredes', 'Sombrio'].map((G) => { const L = LAR_PRODS.filter((p) => (DECOR[p.id].grp ?? (DECOR[p.id].wall ? 'Paredes' : /abajur/.test(p.id) ? 'Luz e fogo' : 'Móveis')) === G); return L.length ? `<h4 class="lj-land">${G} · ${L.length}</h4>${p3grid(L)}` : ''; }).join('')}</div>`;
  }
  /* 15/11: os pacotes do jogo dentro do Shop, com upgrade (a conta mora em pacotes.ts) */
  const packProd = (i: number): Prod | null => { const q = precoPacote(meuPacote(), i), P = PACOTES[i]; return q ? { id: 'pack:' + P.id, kind: 'pack', pack: i, name: P.nome, brl: q.brl, was: q.upgrade ? q.cheio : undefined, desc: P.itens.join(' · ') } : null; };
  function pacCard() {
    const tenho = meuPacote(), mc = montariasDePacote();
    return `<div class="lj-hero mont"><div class="lj-eye">🎁</div><div><h3>Pacotes de KARMIKA</h3><p>${tenho < 0 ? 'O jogo completo e, se quiser, um pacote com Premium, engenhocas e montaria. <b>Nada aqui dá força.</b>' : `Você tem o <b>${PACOTES[tenho].nome}</b>. Dá para subir de pacote quando quiser: como o jogo já é seu, o pacote novo sai <b>${brl(JOGO_BASE)} mais barato</b> (o valor do jogo base).`} Premium, engenhocas e montarias chegam inteiros a cada pacote; o que já foi usado de um pacote anterior não entra na conta.</p>${mc > 0 ? `<p class="lj-on">🐎 Você tem <b>${mc} montaria${mc > 1 ? 's' : ''} de pacote</b> para escolher no Estábulo do Domador.</p>` : ''}</div></div>
      <div class="lj-plans lj-pacs">${PACOTES.map((P, i) => { const q = precoPacote(tenho, i), meu = i === tenho, menor = i < tenho;
        return `<div class="lj-plan lj-pac ${i === 4 ? 'hot' : ''} ${meu ? 'meu' : ''} ${menor ? 'menor' : ''}"${q ? ` data-buy="pack:${P.id}"` : ''}>${meu ? '<em>✓ o seu</em>' : i === 4 ? '<em>edição de colecionador</em>' : ''}<small class="lj-pm">${P.apelido}</small><b>${P.nome}</b>
          <span class="lj-price">${q ? brl(q.brl) : brl(P.brl)}</span>${q?.upgrade ? `<s>${brl(q.cheio)}</s>` : '<span class="lj-ph">&nbsp;</span>'}
          <ul>${P.itens.map((t) => `<li>${t}</li>`).join('')}</ul>
          ${q ? `<button data-buy="pack:${P.id}">${q.upgrade ? 'Fazer upgrade' : 'Comprar'}</button>` : `<i>${meu ? 'É o pacote que você tem' : 'Já está dentro do seu pacote'}</i>`}</div>`; }).join('')}</div>
      <small class="lj-note">O Pacote Fundador traz a caixa com livro impresso, artbook impresso, mapa em A2 e o jogo em pendrive, enviada para o seu endereço. A aura, as roupas e o título de Fundador são entregues na sua conta.</small>`;
  }
  function utilCard() {
    return `<div class="lj-hero mont lj-mhero"><div class="lj-eye">🧭</div><div><h3>Utilidades</h3><p>Ajudas de viagem e de obra. <b>Nada aqui dá força:</b> é tudo coisa que também se compra com ouro dentro do jogo; o Shop só poupa a caminhada. Chegam no correio.</p></div></div>
      <div class="lj-mscroll">${p3grid(UTIL_PRODS)}</div>`;
  }
  /** fase de testes (devs e beta testers): enquanto o Pix não está ligado, toda compra sai de graça para dar para testar o Premium e os brasões.
      Quando o Pix ligar, é só trocar para false. */
  const BETA_FREE = true;
  function checkout() {
    if (!cart) return '';
    const resgate = cart.kind === 'mount' && cart.id.startsWith('mount_') && montariasDePacote() > 0; const f = side, what = cart.kind === 'pack' ? (cart.was ? `Upgrade para o ${cart.name}` : cart.name) : cart.kind === 'eng' ? cart.name : cart.kind === 'mount' ? `${cart.name} (montaria)` : cart.kind === 'prem' ? `Selo de Marghar · ${cart.name} de Premium` : cart.id === 'all' ? `${cart.name} · ${FAC[f].short}` : NAMES[f][cart.slots![0]];
    return `<div class="lj-co"><div class="lj-copn"><h3>${paid ? '✦ Pagamento aprovado' : 'Pagar com Pix'}</h3>
      ${paid && ctx.inMenu() ? `<p>${what} já é seu. Está no <b>inventário da conta</b> (Amigos e Guilda → 📮 Correio): escolha lá para qual personagem mandar, ou dê de presente a um amigo.</p><button data-co-ok>Fechar</button>` : paid ? `<p>${what} já é seu. Chega na caixa de correio de <b>${esc2(ctx.chars().find((c) => c.i === (recip ?? -1))?.name ?? ctx.chars().find((c) => c.active)?.name ?? 'seu personagem')}</b>: retire em qualquer povoado.${cart.kind === 'prem' ? ' Use o selo para ativar o Premium da conta, guarde, ou venda a outro jogador.' : ''}</p><button data-co-ok>Fechar</button>`
      : `<div class="lj-sum"><span>${what}</span><b>${resgate ? 'incluída no seu pacote' : brl(cart.brl)}</b></div>${cart.kind === 'pack' && cart.was ? `<p class="lj-warn">${brl(cart.was)} do pacote menos ${brl(JOGO_BASE)} do jogo que você já tem.</p>` : ''}${ctx.inMenu() ? '<p class="lj-warn">Comprando pelo menu: a compra vai para o <b>inventário da conta</b> (Amigos e Guilda → 📮 Correio). De lá você manda para qualquer personagem seu, ou de presente para um amigo.</p>' : ''}<div class="lj-qr"><svg viewBox="0 0 21 21" shape-rendering="crispEdges">${qr()}</svg><small>QR Code Pix</small></div>
        <p class="lj-warn">${BETA_FREE ? 'Fase de testes: o Pix ainda não está ligado e <b>nada é cobrado</b>. Clique em <b>Receber grátis</b> para testar a compra de verdade (chega no correio).' : 'O pagamento por Pix liga junto com o servidor. Por enquanto <b>nada é cobrado</b> e este QR Code não paga nada.'}</p>
        <div class="lj-cobtn"><button data-co-x>Voltar</button>${BETA_FREE ? '<button data-co-sim class="gold">✦ Receber grátis (teste)</button>' : ctx.dev ? '<button data-co-sim class="dev">Simular pagamento aprovado (DEV)</button>' : ''}</div>`}</div></div>`;
  }
  /* um QR desenhado de enfeite (não é um código válido) */
  function qr() { let s = ''; const on = (x: number, y: number) => ((x * 7 + y * 13 + x * y) % 5) < 2; const fin = (x: number, y: number) => `<path d="M${x} ${y}h7v7h-7z M${x + 1} ${y + 1}v5h5v-5z" fill="#140e08" fill-rule="evenodd"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3" fill="#140e08"/>`;
    for (let y = 0; y < 21; y++) for (let x = 0; x < 21; x++) { const inF = (x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12); if (!inF && on(x, y)) s += `<rect x="${x}" y="${y}" width="1" height="1" fill="#140e08"/>`; }
    return `<rect width="21" height="21" fill="#f3ead6"/>${s}${fin(0, 0)}${fin(14, 0)}${fin(0, 14)}`; }
  let lastTab = '';
  function render() {
    if (!open) { el.style.display = 'none'; return; }
    /* a rolagem fica onde estava quando a aba é a mesma (comprar, voltar, trocar de lado) */
    const sc = tab === lastTab ? (el.querySelector('.lj-body') as HTMLElement | null)?.scrollTop ?? 0 : 0, sc2 = tab === lastTab ? (el.querySelector('.lj-mscroll') as HTMLElement | null)?.scrollTop ?? 0 : 0; lastTab = tab;
    el.innerHTML = `<div class="pn ljpn ${tab === 'mont' || tab === 'pets' ? 'mont' : ''}"><h2><span class="lj-t">${EYE}Shop</span><small>conforto e beleza, nunca força · pagamento por Pix</small><button data-lx>✕</button></h2>
      <nav class="lj-tabs"><button data-tab="pac" class="${tab === 'pac' ? 'on' : ''}">🎁 Pacotes</button><button data-tab="prem" class="${tab === 'prem' ? 'on' : ''}">✦ Bênção de Marghar</button><button data-tab="fac" class="${tab === 'fac' ? 'on' : ''}">⚑ Brasões das Facções</button><button data-tab="mont" class="${tab === 'mont' ? 'on' : ''}">🐎 Estábulo do Domador</button><button data-tab="pets" class="${tab === 'pets' ? 'on' : ''}">🐾 Pets</button><button data-tab="eng" class="${tab === 'eng' ? 'on' : ''}">⚙ Engenhocas</button><button data-tab="util" class="${tab === 'util' ? 'on' : ''}">🧭 Utilidades</button><button data-tab="lar" class="${tab === 'lar' ? 'on' : ''}">🏡 Lar & Lareira</button><button disabled title="Em breve: aparências por cultura e mascotes cosméticos">Aparências <small>em breve</small></button></nav>
      <div class="lj-body">${tab === 'pac' ? pacCard() : tab === 'prem' ? premCard() : tab === 'eng' ? engCard() : tab === 'util' ? utilCard() : tab === 'lar' ? larCard() : tab === 'mont' ? mountCard() : tab === 'pets' ? mountCard(true) : facCard()}</div>${checkout()}${verModal()}</div>`;
    el.style.display = 'flex'; { const b = el.querySelector('.lj-body') as HTMLElement | null; if (b && sc) b.scrollTop = sc; const m = el.querySelector('.lj-mscroll') as HTMLElement | null; if (m && sc2) m.scrollTop = sc2; }
    giraCards(el); /* 13/11: engenhocas e utilidades giram em 3D nos cartões */
    if (tab === 'mont' || tab === 'pets') el.querySelectorAll<HTMLImageElement>('img[data-th]').forEach((im) => ctx.thumb(im.dataset.th!, (u) => { im.src = u; im.hidden = false; (im.nextElementSibling as HTMLElement | null)?.remove(); }));
  }
  function approve() {
    if (!cart) return;
    /* 26/10 (Erling): o Premium vem como Selo de Marghar no correio do personagem que o jogador escolher; ele usa, guarda ou vende
       (e o ouro da venda fica com esse personagem). As peças com brasão também vão para quem ele escolher */
    const to = recip ?? ctx.chars().find((c) => c.active)?.i ?? 0, toName = ctx.chars().find((c) => c.i === to)?.name ?? 'você';
    if (cart.kind === 'pack') { const P = PACOTES[cart.pack!], att = Object.entries(P.correio).map(([id, n]) => ({ seal: id, n }));
      if (att.length) ctx.deliver(`${P.nome} · ${P.apelido}`, `Obrigado por fazer parte de KARMIKA! Aqui está o que vem no ${P.nome}: ${P.itens.slice(1).join(', ')}. Os selos somam dias de Premium quando usados; o relógio de cada engenhoca só começa a contar quando você usar.${P.montarias ? ` ${P.montarias > 1 ? 'As suas montarias' : 'A sua montaria'} de pacote: escolha no Shop, em Estábulo do Domador.` : ''}`, att, to);
      setMeuPacote(cart.pack!); if (P.montarias) somaMontarias(P.montarias);
      ctx.log(`🎁 ${P.nome}: ${att.length ? (ctx.inMenu() ? 'tudo no inventário da conta (Correio).' : `tudo a caminho da caixa de correio de ${toName}.`) : 'o jogo é seu.'}`, '#e0b048'); }
    else if (cart.kind === 'eng') { const c = cart as Prod & { qtd?: Record<string, number> }; if (DECOR[c.id]) markShopBought(c.id); ctx.deliver(c.qtd ? `${c.name} · Utilidades` : `${c.name} · Companhia de Latão`, c.qtd ? `Obrigado pela compra! ${c.desc}` : `Obrigado pela compra! ${c.desc} O relógio só começa a contar quando você usar a engenhoca.`, c.qtd ? Object.entries(c.qtd).map(([id, n]) => ({ seal: id, n })) : c.items!.map((id) => ({ seal: id })), to); ctx.log(ctx.inMenu() ? `📮 ${c.name} no inventário da conta (Correio).` : `📮 ${c.name} a caminho da caixa de correio de ${toName}.`, '#e0b048'); }
    else if (cart.kind === 'mount') { const c = cart; if (c.id.startsWith('mount_') && montariasDePacote() > 0) somaMontarias(-1); ctx.deliver(`${c.name} · Estábulo do Domador`, `Obrigado pela compra! ${c.name} chegou${c.id.startsWith('mount_') ? ' com sela e manta' : ''}. Use o item para levar ao Estábulo (X) e monte com Z. ${c.desc}`, [{ seal: c.id }], to); ctx.log(ctx.inMenu() ? `📮 ${c.name} no inventário da conta (Correio).` : `📮 ${c.name} a caminho da caixa de correio de ${toName}.`, '#e0b048'); }
    else if (cart.kind === 'prem') { const id = `seal_p${cart.days}`; ctx.deliver(`Selo de Marghar · ${cart.name}`, `Obrigado pela compra! Este selo guarda ${cart.name} de Premium. Use-o quando quiser (os dias somam e valem para a conta inteira, todos os seus personagens) ou venda a outro jogador no Quadro de Avisos ou pelo correio.`, [{ seal: id }], to); ctx.log(ctx.inMenu() ? `📮 Selo de Marghar (${cart.name}) no inventário da conta (Correio).` : `📮 Selo de Marghar (${cart.name}) a caminho da caixa de correio de ${toName}.`, '#c9a0ff'); }
    else { const f = side; ctx.deliver(cart.id === 'all' ? `${cart.name} · ${FAC[f].name}` : NAMES[f][cart.slots![0]], `As peças com o brasão de ${FAC[f].name}, como saíram da tecelagem. “${FAC[f].motto}.” Só veste quem jurou este lado, a partir do nível ${FAC_LVL}; qualquer um pode guardar ou vender.`, cart.slots!.map((sl) => ({ fac: f, slot: sl })), to);
      ctx.log(`📮 ${cart.slots!.length > 1 ? 'As peças' : 'A peça'} de ${FAC[f].name} a caminho da caixa de correio de ${toName}.`, f === 'fio' ? '#d9b45a' : '#e0303a'); }
    paid = true; render();
  }
  el.addEventListener('click', (e) => { const t = e.target as HTMLElement;
    if (t.closest('[data-lx]') || t === el) { api.close(); return; }
    const tb = (t.closest('[data-tab]') as HTMLElement | null)?.dataset.tab; if (tb) { tab = tb as 'pac' | 'prem' | 'fac' | 'mont' | 'pets' | 'eng' | 'util' | 'lar'; ver = null; render(); return; }
    const sd = (t.closest('[data-side]') as HTMLElement | null)?.dataset.side; if (sd) { side = sd as Fac; sideSet = true; render(); return; }
    if (t.closest('.lj-verbox') && !t.closest('[data-verx]') && !t.closest('[data-buy]')) return; if (t.closest('[data-verx]')) { ver = null; render(); return; }
    const vr = (t.closest('[data-ver]') as HTMLElement | null)?.dataset.ver; if (vr) { ver = vr; render(); return; }
    const vw = (t.closest('[data-view]') as HTMLElement | null)?.dataset.view; if (vw) { const m = [...ctx.mounts(), ...ctx.pets()].find((q) => q.id === vw); if (m) { const p = mountProd(m); ctx.preview(m, brl(p.brl), () => { cart = p; paid = false; render(); }); } return; }
    const b = (t.closest('[data-buy]') as HTMLElement | null)?.dataset.buy; if (b) { cart = b.startsWith('pack:') ? packProd(PACOTES.findIndex((q) => 'pack:' + q.id === b)) : [...PREM_PLANS, ...FAC_PRODS, ...ENG_PRODS, ...UTIL_PRODS, ...LAR_PRODS, ...ctx.mounts().map(mountProd), ...ctx.pets().map(mountProd)].find((p) => p.id === b) ?? null; paid = false; ver = null; render(); return; }
    const tp = (t.closest('[data-to]') as HTMLElement | null)?.dataset.to; if (tp !== undefined) { recip = +tp; render(); return; }
    if (t.closest('[data-co-x]') || t.closest('[data-co-ok]')) { cart = null; paid = false; render(); return; }
    if (t.closest('[data-co-sim]')) approve(); });
  const api = {
    get isOpen() { return open; },
    toggle(which?: 'prem' | 'fac' | 'pac') { if (which) tab = which; open = which ? true : !open; cart = null; paid = false; sideSet = false; render(); },
    close() { open = false; cart = null; render(); }, refresh() { if (open) render(); },
  };
  return api;
}
