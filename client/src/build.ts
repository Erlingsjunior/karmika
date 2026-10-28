/** Construção no mapa: modo de obra (B), peças de 1 tile com custo em materiais, fantasma de posicionamento, remoção com reembolso, salvo localmente. */
import * as THREE from 'three';
import type { Tile } from '@karmika/shared';
import type { Prop, PropKind, World } from './world';
import { ITEMS } from './inventory';
import { buildHouse, buildStyledHouse } from './houses3d';
import { buyFx, confirmBox } from './windows';
import { DECOR, DECOR_IDS, MOB_IDS, decorThumb, whereTxt } from './decor';

export interface Piece { id: PropKind; name: string; icon: string; cost: Record<string, number>; /** ouro cobrado junto com o material */ gold?: number; blocks?: boolean; rot?: boolean; tip: string }
export const PIECES: Piece[] = [
  { id: 'bfloor', name: 'Piso de tábuas', icon: '🟫', cost: { plank: 2 }, tip: 'Base da casa. Pode-se andar por cima.' },
  { id: 'bwall', name: 'Parede de toras', icon: '🧱', cost: { plank: 3, nail: 2 }, blocks: true, rot: true, tip: 'Bloqueia a passagem. R gira.' },
  { id: 'bdoor', name: 'Porta', icon: '🚪', cost: { plank: 2, nail: 2 }, rot: true, tip: 'Vão com porta aberta. R gira.' },
  { id: 'broof', name: 'Telhado', icon: '🏠', cost: { plank: 3, nail: 1 }, rot: true, tip: 'Sobre um piso ou parede. R gira.' },
  { id: 'bfence', name: 'Cerca', icon: '🪵', cost: { plank: 1 }, blocks: true, rot: true, tip: 'Cerca baixa. R gira.' },
  { id: 'torch', name: 'Tocha', icon: '🔥', cost: { stick: 2, rope: 1 }, blocks: true, tip: 'Ilumina à noite.' },
  { id: 'bench', name: 'Banco', icon: '🪑', cost: { plank: 2 }, blocks: true, tip: 'Sente e descanse (E).' },
  { id: 'campfire', name: 'Fogueira', icon: '🏕', cost: { stick: 4, stone: 2 }, blocks: true, tip: 'Assa carne e peixe (E).' },
];
export interface Built { kind: PropKind; gx: number; gy: number; v: number }
/** OBRAS INTEIRAS (28/10, Erling): uma construção completa de uma vez — paga os materiais, o canteiro aparece no chão e a obra avança
   com o trabalho do jogador (E) ou dos Braços Mecânicos da Companhia (sozinhos, enquanto você joga). Quanto maior, mais caro e mais demorado. */
export interface Whole { id: string; name: string; icon: string; w: number; h: number; cost: Record<string, number>; gold?: number; work: number; tip: string; /** o modelo da casa pronta (houses3d): variante e, se houver, o estilo do povo */ variant: number; style?: number; tag?: string }
export const WHOLES: Whole[] = [
  { id: 'casa_tabuas', name: 'Casa de Tábuas e Pedra', icon: '🏡', w: 5, h: 4, cost: { plank: 40, nail: 30, stone: 24, rope: 8, stick: 16 }, work: 30, variant: 2, tag: 'Casa',
    tip: 'Casa pequena de morar: alicerce de pedra, paredes de tábua, telhado de telha. Por dentro: cama que cura, caixa de correio que guarda itens e a placa com o seu nome. A obra pede 30 turnos de trabalho (5 dias de Karmika): trabalhe nela entre uma aventura e outra, ou contrate um Ajudante de Obra na Caravana de Latão — e proteja-o com Sentinelas.' },
  /* 28/10 (Erling: "aceito as 10 ideias"): o catálogo de obras inteiras, todas no estilo do jogo (os mesmos modelos das vilas),
     com a porta sempre virada para a câmera. Maior e mais rica = mais material, mais ouro e mais turnos. */
  { id: 'cabana', name: 'Cabana do Caminhante', icon: '🛖', w: 4, h: 4, variant: 0, tag: 'Casa', cost: { plank: 26, nail: 18, stone: 10, rope: 6, stick: 20 }, work: 18,
    tip: 'A primeira casa de quem está começando: tábua escura, telhado alto de sapê e um alpendre para pendurar a capa. Pequena, quente e rápida de erguer (18 turnos, 3 dias de Karmika).' },
  { id: 'sobrado', name: 'Sobrado de Dois Andares', icon: '🏘', w: 5, h: 4, variant: 1, tag: 'Casa', cost: { plank: 60, nail: 44, stone: 48, rope: 12, stick: 20 }, work: 48,
    tip: 'Pedra embaixo, enxaimel em cima e escada de fora para o andar de cima. A casa de quem já tem nome na vila (48 turnos, 8 dias).' },
  { id: 'atalaia', name: 'Atalaia de Pedra', icon: '🗼', w: 3, h: 3, variant: 3, tag: 'Torre', cost: { plank: 30, nail: 24, stone: 70, rope: 14, stick: 10 }, work: 42,
    tip: 'A torre de vigia do Caminho Humano: pedra alta, sacada de madeira e telhado pontudo. Pouco chão, muita altura (42 turnos, 7 dias).' },
  { id: 'armeiro', name: 'Casa com Loja', icon: '🏪', w: 6, h: 5, variant: 5, tag: 'Comércio', cost: { plank: 70, nail: 52, stone: 40, rope: 16, stick: 24 }, work: 60,
    tip: 'Casa em cima e balcão embaixo: toldo grande, bancada e placa na frente, para quem quer abrir o próprio comércio (60 turnos, 10 dias).' },
  { id: 'nordica', name: 'Salão Nórdico', icon: '🪓', w: 5, h: 4, variant: 0, style: 1, tag: 'Nórdico', cost: { plank: 58, nail: 30, stone: 20, rope: 14, stick: 30 }, work: 42,
    tip: 'Toras empilhadas, telhado de turfa verde e as cabeças de dragão cruzadas na cumeeira. O lar dos que juraram a Odin (42 turnos, 7 dias).' },
  { id: 'ana', name: 'Casa de Pedra Anã', icon: '⚒', w: 5, h: 4, variant: 0, style: 2, tag: 'Anão', cost: { plank: 24, nail: 30, stone: 80, rope: 8, stick: 10 }, work: 48,
    tip: 'Pedra grossa, porta de ferro e a fornalha sempre acesa. Feita para durar mil anos, do jeito de Brasaforja (48 turnos, 8 dias).' },
  { id: 'elfica', name: 'Casa Élfica', icon: '🌿', w: 5, h: 4, variant: 0, style: 3, tag: 'Elfo', cost: { plank: 50, nail: 20, stone: 20, rope: 20, stick: 40 }, work: 42,
    tip: 'Madeira clara curvada, folhas no telhado e janelas redondas. Parece que cresceu ali sozinha (42 turnos, 7 dias).' },
  { id: 'sombria', name: 'Casa Sombria', icon: '🦇', w: 5, h: 4, variant: 0, style: 4, tag: 'Sombra', cost: { plank: 44, nail: 40, stone: 50, rope: 10, stick: 16 }, work: 48,
    tip: 'Pedra escura, telhado íngreme e janelas estreitas que deixam passar pouca luz. Para vampiros, bruxos e quem prefere a noite (48 turnos, 8 dias).' },
  { id: 'tribal', name: 'Toca Tribal', icon: '🐺', w: 5, h: 4, variant: 0, style: 5, tag: 'Lobisomem', cost: { plank: 30, nail: 12, stone: 24, rope: 24, stick: 50 }, work: 36,
    tip: 'Couro, galhos trançados e ossos na entrada: a toca de quem uiva para a lua (36 turnos, 6 dias).' },
  { id: 'pacto', name: 'Casa do Pacto', icon: '🔮', w: 5, h: 4, variant: 0, style: 6, tag: 'Pacto', cost: { plank: 46, nail: 36, stone: 44, rope: 14, stick: 20 }, work: 48,
    tip: 'Pedra marcada com runas, chama roxa na porta e um círculo riscado no chão. Para quem estuda o que não se ensina na Academia (48 turnos, 8 dias).' },
];
/* cada obra tem o seu item de projeto (📜 na mochila) */
for (const w of WHOLES) if (!ITEMS['projeto_' + w.id]) ITEMS['projeto_' + w.id] = { name: 'Projeto · ' + w.name, icon: '📜', kind: 'misc', col: 0xe8d8a8, desc: `A planta de ${w.name} (${w.w}×${w.h}) com o material já separado. Use para escolher o lugar do canteiro. Depois a obra pede ${w.work} turnos de trabalho — a sua mão ou a de um Ajudante de Obra.` } as (typeof ITEMS)[string];
/* mobília e decoração (decor.ts) viram itens da mochila: usar = escolher o lugar dentro da casa ou no terreno */
for (const [k, d] of Object.entries(DECOR)) if (!ITEMS[k]) ITEMS[k] = { name: d.name, icon: d.icon, kind: 'misc', col: d.kind === 'mob' ? 0xc8a070 : 0xd8b0ff, desc: `${d.desc}\n${d.kind === 'mob' ? 'Mobília' : d.pool === 'chefe' ? 'Decoração rara (chefes)' : d.pool === 'elite' ? 'Decoração rara (elites)' : 'Decoração raríssima'} · ${whereTxt(d.where)}. Use para colocar na sua casa.` } as (typeof ITEMS)[string];
/** o modelo de uma obra pelo id (ou pelo nome, para casas antigas do servidor) */
export const wholeOf = (id?: string, name?: string) => WHOLES.find((w) => w.id === id) ?? WHOLES.find((w) => w.name === name) ?? WHOLES[0];

/* PREÇO DA OBRA (28/10, Erling): material +10% nas peças soltas e +18% nos projetos inteiros, e toda obra cobra ouro também.
   Arredonda para o inteiro mais perto (2 tábuas continuam 2); o ouro é o mão-de-obra do mestre de obras. */
const PIECE_GOLD: Record<string, number> = { bfloor: 4, bwall: 8, bdoor: 10, broof: 8, bfence: 3, torch: 4, bench: 6, campfire: 5 };
for (const p of PIECES) { for (const k of Object.keys(p.cost)) p.cost[k] = Math.max(p.cost[k], Math.round(p.cost[k] * 1.1)); p.gold = PIECE_GOLD[p.id] ?? 5; }
/* 28/10 (Erling: "pode colocar 100k numa casa com loja; casas menores mais baratas, maiores mais caras"): casa é patrimônio, não item de vitrine */
const WHOLE_GOLD: Record<string, number> = { cabana: 8000, casa_tabuas: 15000, tribal: 12000, nordica: 28000, elfica: 28000, atalaia: 35000, sobrado: 45000, ana: 50000, sombria: 50000, pacto: 50000, armeiro: 100000 };
for (const w of WHOLES) { for (const k of Object.keys(w.cost)) w.cost[k] = Math.ceil(w.cost[k] * 1.18); w.gold = WHOLE_GOLD[w.id] ?? 500; }
/** a foto da obra no card: a própria casa do jogo, renderizada uma vez num canvas fora da tela */
const THUMB = new Map<string, string>();
export function wholeThumb(w: Whole): string {
  const c0 = THUMB.get(w.id); if (c0) return c0;
  try { const W = 280, H = 180, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const r = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, preserveDrawingBuffer: true }); r.setSize(W, H, false);
    const sc = new THREE.Scene(); sc.add(new THREE.HemisphereLight(0xfff0d8, 0x4a3a2a, 1.6)); const sun = new THREE.DirectionalLight(0xfff4e0, 2.2); sun.position.set(8, 14, 10); sc.add(sun);
    let sd = 7; const hs = (w.style ? buildStyledHouse : (_s: number, v: number, a: number, b2: number, c1: number, c2: number, cx: Parameters<typeof buildHouse>[5]) => buildHouse(v, a, b2, c1, c2, cx))(w.style ?? 0, w.variant, w.w * 2, w.h * 2, 0xb09068, 0x8a3a28, { windows: new THREE.MeshBasicMaterial({ color: 0xffc266 }), rnd: () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; } }); sc.add(hs.group);
    const bb = new THREE.Box3().setFromObject(hs.group), ctr = bb.getCenter(new THREE.Vector3()), sz = bb.getSize(new THREE.Vector3()), R0 = Math.max(sz.x, sz.z, sz.y) * 0.62;
    const ground = new THREE.Mesh(new THREE.CircleGeometry(R0 * 1.6, 32).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0x5a7a3a })); ground.position.set(ctr.x, bb.min.y - 0.02, ctr.z); sc.add(ground);
    const cam = new THREE.OrthographicCamera(-R0 * 1.25, R0 * 1.25, R0 * 0.8, -R0 * 0.8, 0.1, 400); cam.position.set(ctr.x + 30, ctr.y + 26, ctr.z + 30); cam.lookAt(ctr); r.render(sc, cam);
    const url = cv.toDataURL(); THUMB.set(w.id, url); r.dispose(); r.forceContextLoss(); return url; } catch { return ''; } }
export function createBuild(ctx: { /** o id do projeto da obra em andamento */ siteId?(): string | null; /** quantos desse item há na mochila */ count?(id: string): number; /** colocar mobília/decoração da mochila */ placeDecor?(id: string): void; /** o chão já é de outro jogador (casas no servidor) */ taken?(gx: number, gy: number, w: number, h: number): string | null; snd?(k: 'coins' | 'error'): void; gold?(): number; payGold?(n: number): void; /** desistir da obra (o canteiro se desfaz, o material se perde) */ quitWhole?(): void; /** obra inteira paga: o main.ts monta o canteiro */ onWhole?(w: Whole, gx: number, gy: number): void; /** já existe uma obra/casa do jogador? */ wholeBusy?(): boolean; /** Obra Automatizada (festim.ts): multiplica os materiais */ costK?(): number; /** terreno de guilda (26/10): 'mine' = o meu (a obra vai para o servidor), 'other' = de outra guilda (não se mexe) */ guildZone?(gx: number, gy: number): 'mine' | 'other' | null; onGuildBuild?(b: Built, del: boolean): void; world: World; scene: THREE.Scene; objs: { addProp(p: Prop): void; removeProp(p: Prop): void }; has(id: string, n: number): boolean; take(id: string, n: number): boolean; add(id: string, n: number): boolean; log(t: string, c?: string): void; heightAt(x: number, z: number): number; canBuildAt(gx: number, gy: number): boolean }) {
  const SAVE = 'karmika.build.v1';
  let on = false, sel = 0, rot = 0, whole = -1, bare = false; // whole >= 0: escolheu uma obra inteira; bare: veio do projeto da mochila (sem abrir a janela)
  /* 28/10 (Erling: "quando clico para colocar a casa você me abre a loja e não consigo enxergar a tela"): marcar o lugar a partir do 📜 da mochila mostra só uma faixa pequena no alto */
  const bar = document.createElement('div'); bar.id = 'buildbar'; bar.style.display = 'none'; document.body.appendChild(bar);
  bar.addEventListener('click', (e) => { if ((e.target as HTMLElement).closest('[data-cancel]')) { whole = -1; bare = false; toggle(false); } });
  const built: { b: Built; prop: Prop }[] = [], remote: { b: Built; prop: Prop }[] = [];
  /* 28/10 (Erling: "o menu tem que ser no estilo menu abaixo, como estava antes com as peças, para a gente ir vendo e fazendo —
     estilo modo construção; coloco o mouse em cima e abre um tooltip explicando tudo"): a construção é uma barra encaixada
     embaixo da tela, com abas (Peças · Casas · Mobília · Decoração), cards pequenos e um balão com a ficha completa no hover. */
  const el = document.createElement('div'); el.id = 'build'; el.className = 'bdock'; el.style.display = 'none'; document.body.appendChild(el);
  const tip = document.createElement('div'); tip.id = 'btip'; tip.style.display = 'none'; document.body.appendChild(tip);
  let tab: 'pecas' | 'casas' | 'mob' | 'deco' = 'pecas';
  const ghost = new THREE.Mesh(new THREE.BoxGeometry(2, 0.4, 2), new THREE.MeshBasicMaterial({ color: 0x7aff9a, transparent: true, opacity: 0.35, depthWrite: false })); ghost.visible = false; ctx.scene.add(ghost);
  const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.5, 6), new THREE.MeshBasicMaterial({ color: 0xffe08a })); arrow.rotation.x = Math.PI / 2; ghost.add(arrow);
  const fmt = (n: number) => n.toLocaleString('pt-BR');
  const costRows = (c: Record<string, number>, gold?: number) => Object.entries(c).map(([k, n]) => `<li class="${ctx.has(k, n) ? 'y' : 'n'}"><span>${ITEMS[k]?.icon ?? ''}</span>${ITEMS[k]?.name ?? k}<b>${fmt(n)}</b></li>`).join('') + (gold ? `<li class="${(ctx.gold?.() ?? 0) >= gold ? 'y' : 'n'}"><span>🪙</span>Ouro<b>${fmt(gold)}</b></li>` : '');
  const owned = (id: string) => ctx.count?.(id) ?? 0;
  function tipHtml(k: string): string { const [t, id] = k.split(':');
    if (t === 'p') { const p = PIECES[+id]; return `<h4>${p.icon} ${p.name}</h4><p>${p.tip}</p><ul>${costRows(p.cost, p.gold)}</ul><em>Clique para escolher · clique no chão para colocar · botão direito remove · R gira</em>`; }
    if (t === 'w') { const w = WHOLES[+id], have = owned('projeto_' + w.id), cur = ctx.siteId?.() === w.id;
      return `<img src="${wholeThumb(w)}" alt=""><h4>${w.icon} ${w.name}</h4><div class="tm"><span>${w.tag ?? ''}</span><span>${w.w}×${w.h}</span><span>⏳ ${w.work} turnos · ${w.work / 6} ${w.work / 6 === 1 ? 'dia' : 'dias'}</span></div><p>${w.tip}</p><ul>${costRows(w.cost, w.gold)}</ul><em>${cur ? 'Esta é a sua obra em andamento · clique para desistir dela' : have ? `Você tem o projeto (${have}) · clique para escolher o lugar` : ctx.wholeBusy?.() ? 'Uma obra por vez: termine (ou desista d)a atual antes' : 'Clique para comprar o projeto (o material e o ouro saem na hora)'}</em>`; }
    const d = DECOR[id]; if (!d) return ''; const n = owned(id);
    return `<img src="${decorThumb(id)}" alt=""><h4>${d.icon} ${d.name}</h4><div class="tm"><span>${d.kind === 'mob' ? 'Mobília' : d.pool === 'chefe' ? 'Rara · chefes' : d.pool === 'elite' ? 'Rara · elites' : 'Raríssima · mundo'}</span><span>${whereTxt(d.where)}</span>${n ? `<span>na mochila: ${n}</span>` : ''}</div><p>${d.desc}</p>${d.kind === 'mob' ? `<ul>${costRows(d.plank ? { plank: d.plank } : {}, d.gold)}</ul>` : ''}<em>${n ? 'Clique para colocar (dentro da sua casa ou no seu terreno) · R gira · botão direito cancela' : d.kind === 'mob' ? 'Clique para comprar (vai para a mochila)' : 'Ainda não encontrada. Decorações só caem — e muito raramente.'}</em>`; }
  function render() {
    if (!on || (bare && whole >= 0)) { el.style.display = 'none'; tip.style.display = 'none'; if (on && bare && whole >= 0) { bar.innerHTML = `📜 Escolhendo o lugar de <b>${WHOLES[whole].name}</b> · o contorno verde mostra onde cabe · clique no chão para marcar o canteiro <button data-cancel>Cancelar</button>`; bar.style.display = 'block'; } else bar.style.display = 'none'; return; }
    bar.style.display = 'none';
    const sc0 = (el.querySelector('.bstrip') as HTMLElement | null)?.scrollLeft ?? 0;
    const card = (key: string, thumb: string, name: string, sub: string, cls = '') => `<button class="bc ${cls}" data-k="${key}">${thumb}<b>${name}</b><small>${sub}</small></button>`;
    let items = '';
    if (tab === 'pecas') items = PIECES.map((p, i) => card('p:' + i, `<span class="bi">${p.icon}</span>`, p.name, `🪙 ${p.gold ?? 0}`, i === sel && whole < 0 ? 'on' : '')).join('');
    else if (tab === 'casas') items = WHOLES.map((w, i) => card('w:' + i, `<img src="${wholeThumb(w)}" alt="">`, w.name, `${owned('projeto_' + w.id) ? '📜 ' : ''}🪙 ${fmt(w.gold ?? 0)}`, (i === whole ? 'on' : '') + (ctx.siteId?.() === w.id ? ' cur' : ''))).join('');
    else if (tab === 'mob') items = MOB_IDS.map((k) => card('d:' + k, `<img src="${decorThumb(k)}" alt="">`, DECOR[k].name, owned(k) ? `🎒 ${owned(k)}` : `🪙 ${fmt(DECOR[k].gold ?? 0)}`, owned(k) ? 'have' : '')).join('');
    else { const L = DECOR_IDS.filter((k) => DECOR[k].kind === 'deco'); items = L.map((k) => owned(k) ? card('d:' + k, `<img src="${decorThumb(k)}" alt="">`, DECOR[k].name, `🎒 ${owned(k)}`, 'have') : card('d:' + k, '<span class="bi q">?</span>', '???', DECOR[k].pool === 'chefe' ? 'chefes' : DECOR[k].pool === 'elite' ? 'elites' : 'mundo', 'lock')).join(''); }
    const nDeco = DECOR_IDS.filter((k) => DECOR[k].kind === 'deco' && owned(k)).length;
    el.innerHTML = `<div class="btabs">${([['pecas', '🧱 Peças'], ['casas', '🏡 Casas'], ['mob', '🪑 Mobília'], ['deco', `✨ Decoração ${nDeco}/${DECOR_IDS.length - MOB_IDS.length}`]] as const).map(([k, l]) => `<button data-tab="${k}" class="${tab === k ? 'on' : ''}">${l}</button>`).join('')}<span class="bh">${tab === 'pecas' ? 'Clique no chão para colocar · botão direito remove · R gira' : tab === 'casas' ? 'Passe o mouse para ver a ficha · clique para comprar o projeto ou marcar o lugar' : 'Passe o mouse para ver · clique para comprar ou colocar'}</span><button class="bx" data-x title="Fechar (B)">✕</button></div><div class="bstrip">${items}</div>`;
    el.style.display = 'block'; (el.querySelector('.bstrip') as HTMLElement).scrollLeft = sc0;
  }
  el.addEventListener('wheel', (e) => { const st = el.querySelector('.bstrip') as HTMLElement | null; if (st && Math.abs(e.deltaY) > Math.abs(e.deltaX)) { st.scrollLeft += e.deltaY; e.preventDefault(); } }, { passive: false });
  el.addEventListener('mouseover', (e) => { const c = (e.target as HTMLElement).closest('[data-k]') as HTMLElement | null; if (!c) return; tip.innerHTML = tipHtml(c.dataset.k!); tip.style.display = 'block'; const r = c.getBoundingClientRect(), z = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ui')) || 1, tw = tip.offsetWidth * z, th = tip.offsetHeight * z;
    tip.style.left = Math.max(6, Math.min(innerWidth - tw - 6, r.left + r.width / 2 - tw / 2)) / z + 'px'; tip.style.top = Math.max(6, r.top - th - 10) / z + 'px'; });
  el.addEventListener('mouseout', (e) => { const c = (e.target as HTMLElement).closest('[data-k]'); if (c && !c.contains(e.relatedTarget as Node)) tip.style.display = 'none'; });
  const buyWhole = (w: Whole, b: HTMLElement) => { for (const [k, n] of Object.entries(w.cost)) if (!ctx.has(k, n)) { ctx.log(`Faltam materiais para o projeto: ${ITEMS[k]?.name ?? k} ×${n}.`, '#ff9a8a'); ctx.snd?.('error'); return; } if ((ctx.gold?.() ?? 0) < (w.gold ?? 0)) { ctx.log(`Falta ouro: o projeto custa ${fmt(w.gold ?? 0)} 🪙 além do material.`, '#ff9a8a'); ctx.snd?.('error'); return; }
    confirmBox(`Comprar o projeto <b>${w.name}</b>?<br><small>Sai agora da mochila: ${Object.entries(w.cost).map(([k, n]) => `${ITEMS[k]?.icon ?? ''}${n}`).join(' ')} e 🪙 ${fmt(w.gold ?? 0)}.</small>`, '📜 Comprar', () => {
      for (const [k, n] of Object.entries(w.cost)) ctx.take(k, n); if (!ctx.add('projeto_' + w.id, 1)) { for (const [k, n] of Object.entries(w.cost)) ctx.add(k, n); ctx.log('🎒 Mochila cheia: o projeto não coube e o material voltou para você. Libere um espaço e compre de novo.', '#ff9a8a'); ctx.snd?.('error'); return; }
      ctx.payGold?.(w.gold ?? 0); buyFx(b, '📜'); ctx.snd?.('coins'); ctx.log(`📜 Projeto comprado: ${w.name}. Clique de novo no card (ou use o 📜 na mochila) para escolher o lugar.`, '#ffe08a'); render(); }); };
  const buyMob = (k: string, b: HTMLElement) => { const d = DECOR[k], g0 = d.gold ?? 0, pl = d.plank ?? 0; if ((ctx.gold?.() ?? 0) < g0) { ctx.log(`Falta ouro: ${d.name} custa ${fmt(g0)} 🪙.`, '#ff9a8a'); ctx.snd?.('error'); return; } if (pl && !ctx.has('plank', pl)) { ctx.log(`Faltam tábuas: ${d.name} pede ${pl}.`, '#ff9a8a'); ctx.snd?.('error'); return; }
    if (pl) ctx.take('plank', pl); if (!ctx.add(k, 1)) { if (pl) ctx.add('plank', pl); ctx.log('🎒 Mochila cheia.', '#ff9a8a'); ctx.snd?.('error'); return; } ctx.payGold?.(g0); buyFx(b, d.icon); ctx.snd?.('coins'); ctx.log(`${d.icon} ${d.name} na mochila. Clique de novo para colocar.`, '#ffe08a'); render(); };
  el.addEventListener('click', (e) => { const b = (e.target as HTMLElement).closest('button') as HTMLElement | null; if (!b) return;
    if (b.hasAttribute('data-x')) { toggle(false); return; } if (b.dataset.tab) { tab = b.dataset.tab as typeof tab; tip.style.display = 'none'; render(); return; }
    const k = b.dataset.k; if (!k) return; const [t, id] = k.split(':');
    if (t === 'p') { sel = +id; whole = -1; render(); return; }
    if (t === 'w') { const w = WHOLES[+id]; if (ctx.siteId?.() === w.id) { ctx.quitWhole?.(); render(); return; } if (owned('projeto_' + w.id)) { if (ctx.wholeBusy?.()) { ctx.log('🏗 Você já tem uma obra ou casa. Uma de cada vez, por enquanto.', '#ff9a8a'); return; } whole = +id; render(); ctx.log(`📜 Escolha o lugar de ${w.name}: o contorno verde mostra onde cabe.`, '#ffe08a'); return; } if (ctx.wholeBusy?.()) { ctx.log('🏗 Uma obra por vez: termine (ou desista d)a atual antes de comprar outra.', '#ff9a8a'); return; } buyWhole(w, b); return; }
    if (t === 'd') { const d = DECOR[id]; if (!d) return; if (owned(id)) { tip.style.display = 'none'; ctx.placeDecor?.(id); return; } if (d.kind === 'mob') buyMob(id, b); else ctx.log('✨ Essa decoração ainda não é sua. Decorações só caem — de chefes, de elites e, raríssimo, de qualquer bicho do mundo.', '#c8b890'); } });
  const tileOf = (gx: number, gy: number): Tile | undefined => ctx.world.map[gy]?.[gx];
  const pieceAt = (gx: number, gy: number) => built.find((x) => x.b.gx === gx && x.b.gy === gy) ?? remote.find((x) => x.b.gx === gx && x.b.gy === gy);
  const canPlace = (p: Piece, gx: number, gy: number) => {
    const t = tileOf(gx, gy); if (!t) return false; const gz = ctx.guildZone?.(gx, gy) ?? null; if (gz === 'other') return false; if (!gz && !ctx.canBuildAt(gx, gy)) return false;
    const here = pieceAt(gx, gy);
    if (p.id === 'broof') return !!here && (here.b.kind === 'bfloor' || here.b.kind === 'bwall' || here.b.kind === 'bdoor');
    if (here) return false;
    return t === 'grass';
  };
  /** cabe a obra inteira aqui? (canto de cima à esquerda em gx,gy; toda a pegada em grama livre, longe de vilas e lugares) */
  const canWhole = (w: Whole, gx: number, gy: number) => { for (let y = gy - 1; y <= gy + w.h; y++) for (let x = gx - 1; x <= gx + w.w; x++) { const t = tileOf(x, y); const edge = y < gy || y >= gy + w.h || x < gx || x >= gx + w.w; if (!t || (!edge && t !== 'grass') || (edge && t === 'wall') || pieceAt(x, y)) return false; if (!edge && !ctx.canBuildAt(x, y)) return false; } if (ctx.taken?.(gx, gy, w.w, w.h)) return false; return !(ctx.wholeBusy?.() ?? false); };
  function placeWhole(gx: number, gy: number) { const w = WHOLES[whole]; if (!canWhole(w, gx, gy)) { ctx.log(ctx.wholeBusy?.() ? 'Você já tem uma obra ou casa. Uma de cada vez, por enquanto.' : (ctx.taken?.(gx, gy, w.w, w.h) ? `Esse chão já é de ${ctx.taken(gx, gy, w.w, w.h)}.` : 'A obra não cabe aqui: precisa de grama livre em volta, longe de vilas e lugares.'), '#ff9a8a'); return; }
    if (!ctx.has('projeto_' + w.id, 1)) { ctx.log('Você precisa do projeto na mochila (compre no B → Obras inteiras).', '#ff9a8a'); return; }
    ctx.take('projeto_' + w.id, 1); whole = -1; bare = false; ctx.onWhole?.(w, gx, gy); toggle(false); }
  function place(gx: number, gy: number) {
    const p = PIECES[sel]; if (!canPlace(p, gx, gy)) { ctx.log('Não dá para construir aqui.', '#ff9a8a'); return; }
    const K = ctx.costK?.() ?? 1, cost = Object.fromEntries(Object.entries(p.cost).map(([k, n]) => [k, Math.max(K < 1 ? 0 : 1, Math.ceil(n * K))])) as Record<string, number>;
    for (const [k, n] of Object.entries(cost)) if (n > 0 && !ctx.has(k, n)) { ctx.log(`Faltam materiais: ${ITEMS[k]?.name ?? k} ×${n}. Gunnar vende.`, '#ff9a8a'); return; }
    const g0 = p.gold ?? 0; if (g0 && (ctx.gold?.() ?? 0) < g0) { ctx.log(`Falta ouro: ${p.name} custa ${g0} 🪙 de mão de obra.`, '#ff9a8a'); ctx.snd?.('error'); return; }
    for (const [k, n] of Object.entries(cost)) if (n > 0) ctx.take(k, n); if (g0) ctx.payGold?.(g0);
    const b: Built = { kind: p.id, gx, gy, v: p.rot ? rot : 0 };
    if (ctx.guildZone?.(gx, gy) === 'mine' && ctx.onGuildBuild) { ctx.onGuildBuild(b, false); ctx.log(`🔨 ${p.name}: obra da guilda (todos veem).`, '#ffe08a'); render(); return; }
    addBuilt(b); save(); ctx.log(`🔨 ${p.name} construído.`, '#ffe08a'); render();
  }
  function addBuilt(b: Built) {
    const prop: Prop = { kind: b.kind, gx: b.gx, gy: b.gy, w: 1, h: 1, height: b.kind === 'torch' ? 1.9 : b.kind === 'campfire' ? 0.6 : 1, wall: b.kind === 'torch' ? 0x3a2a1c : 0x8a6a40, roof: b.kind === 'torch' || b.kind === 'campfire' ? 0xff8a2a : 0x6d3a28, variant: b.v };
    const pc = PIECES.find((x) => x.id === b.kind);
    if (b.kind === 'broof') { const under = pieceAt(b.gx, b.gy); if (under) { ctx.objs.removeProp(under.prop); built.splice(built.indexOf(under), 1); const roofed: Prop = { ...under.prop }; ctx.objs.addProp(roofed); built.push({ b: under.b, prop: roofed }); } }
    ctx.objs.addProp(prop); built.push({ b, prop });
    if (pc?.blocks) ctx.world.map[b.gy][b.gx] = 'wall';
  }
  function remove(gx: number, gy: number) {
    const rz = ctx.guildZone?.(gx, gy) ?? null; if (rz === 'other') { ctx.log('Esse terreno é de outra guilda.', '#ff9a8a'); return; }
    if (rz === 'mine') { const rx = [...remote].reverse().find((y) => y.b.gx === gx && y.b.gy === gy); if (rx) { ctx.onGuildBuild?.(rx.b, true); const pc = PIECES.find((q) => q.id === rx.b.kind); if (pc) for (const [k, n] of Object.entries(pc.cost)) { const back = Math.floor(n / 2); if (back) ctx.add(k, back); } ctx.log(`${pc?.name ?? 'Peça'} removida da obra da guilda (metade dos materiais de volta).`, '#e8dcc0'); } return; }
    const x = built.find((y) => y.b.gx === gx && y.b.gy === gy); if (!x) return;
    // remove o de cima primeiro (telhado), depois o piso
    const all = built.filter((y) => y.b.gx === gx && y.b.gy === gy); const top = all.find((y) => y.b.kind === 'broof') ?? all[0];
    ctx.objs.removeProp(top.prop); built.splice(built.indexOf(top), 1);
    const pc = PIECES.find((p) => p.id === top.b.kind);
    if (pc) for (const [k, n] of Object.entries(pc.cost)) { const back = Math.floor(n / 2); if (back) ctx.add(k, back); }
    if (!built.some((y) => y.b.gx === gx && y.b.gy === gy && PIECES.find((p) => p.id === y.b.kind)?.blocks)) ctx.world.map[gy][gx] = 'grass';
    save(); ctx.log(`${pc?.name ?? 'Peça'} removida (metade dos materiais de volta).`, '#e8dcc0'); render();
  }
  /** as obras das guildas (vêm do servidor): troca tudo de uma vez */
  function setRemote(list: Built[]) {
    for (const x of remote) { ctx.objs.removeProp(x.prop); if (PIECES.find((p) => p.id === x.b.kind)?.blocks && !built.some((y) => y.b.gx === x.b.gx && y.b.gy === x.b.gy)) ctx.world.map[x.b.gy][x.b.gx] = 'grass'; } remote.length = 0;
    for (const b of list) { const t = tileOf(b.gx, b.gy); if (t !== 'grass' && t !== 'wall' && b.kind !== 'broof') continue;
      const prop: Prop = { kind: b.kind, gx: b.gx, gy: b.gy, w: 1, h: 1, height: b.kind === 'torch' ? 1.9 : b.kind === 'campfire' ? 0.6 : 1, wall: b.kind === 'torch' ? 0x3a2a1c : 0x8a6a40, roof: b.kind === 'torch' || b.kind === 'campfire' ? 0xff8a2a : 0x6d3a28, variant: b.v };
      if (b.kind === 'broof') { const i = remote.findIndex((y) => y.b.gx === b.gx && y.b.gy === b.gy && y.b.kind !== 'broof'); if (i >= 0) { ctx.objs.removeProp(remote[i].prop); const ro: Prop = { ...remote[i].prop }; ctx.objs.addProp(ro); remote[i] = { b: remote[i].b, prop: ro }; } }
      ctx.objs.addProp(prop); remote.push({ b, prop }); if (PIECES.find((p) => p.id === b.kind)?.blocks) ctx.world.map[b.gy][b.gx] = 'wall'; }
  }
  function save() { try { localStorage.setItem(SAVE, JSON.stringify(built.map((x) => x.b))); } catch { /* */ } }
  function load() { try { const list = JSON.parse(localStorage.getItem(SAVE) || '[]') as Built[]; for (const b of list) if (tileOf(b.gx, b.gy) === 'grass' || b.kind === 'broof') addBuilt(b); } catch { /* */ } }
  function toggle(force?: boolean) { on = force ?? !on; if (!on) bare = false; ghost.visible = on; render(); if (on && !bare) ctx.log('🔨 Modo de obra: escolha a peça embaixo, clique no chão para colocar. B sai.', '#ffe08a'); }
  function update(mx: number, mz: number) {
    if (!on) return; const gx = Math.floor(mx / 2), gy = Math.floor(mz / 2), p = PIECES[sel];
    if (whole >= 0) { const w = WHOLES[whole], x0 = gx - Math.floor(w.w / 2), y0 = gy - Math.floor(w.h / 2); ghost.scale.set(w.w, 6, w.h); ghost.position.set((x0 + w.w / 2) * 2, ctx.heightAt((gx + 0.5) * 2, (gy + 0.5) * 2) + 1.2, (y0 + w.h / 2) * 2); ghost.rotation.y = 0; arrow.visible = false; (ghost.material as THREE.MeshBasicMaterial).color.setHex(canWhole(w, x0, y0) ? 0x7aff9a : 0xff6a5a); return; }
    ghost.scale.set(1, 1, 1);
    ghost.position.set((gx + 0.5) * 2, ctx.heightAt((gx + 0.5) * 2, (gy + 0.5) * 2) + 0.2, (gy + 0.5) * 2); ghost.rotation.y = p.rot ? rot * Math.PI / 2 : 0;
    (ghost.material as THREE.MeshBasicMaterial).color.setHex(canPlace(p, gx, gy) ? 0x7aff9a : 0xff6a5a); arrow.visible = !!p.rot; arrow.position.set(0, 0.3, -0.9);
  }
  function click(mx: number, mz: number, button: number) { if (!on) return false; const gx = Math.floor(mx / 2), gy = Math.floor(mz / 2); if (whole >= 0) { if (button !== 2) { const w = WHOLES[whole]; placeWhole(gx - Math.floor(w.w / 2), gy - Math.floor(w.h / 2)); } else if (bare) { whole = -1; bare = false; toggle(false); } return true; } if (button === 2) remove(gx, gy); else place(gx, gy); return true; }
  function rotate() { rot = (rot + 1) % 4; }
  function reset() { for (const x of built) ctx.objs.removeProp(x.prop); built.length = 0; save(); }
  /** usar o projeto da mochila: liga o modo de obra já com a obra escolhida, para marcar o lugar */
  function placeProject(id: string) { const i = WHOLES.findIndex((w) => 'projeto_' + w.id === id); if (i < 0) return false; whole = i; bare = true; toggle(true); ctx.log(`📜 Escolha o lugar de ${WHOLES[i].name}: o contorno verde mostra onde cabe. Clique para marcar o canteiro.`, '#ffe08a'); return true; }
  return { toggle, update, click, rotate, load, reset, setRemote, placeProject, get on() { return on; }, built };
}
