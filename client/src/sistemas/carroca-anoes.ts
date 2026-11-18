/* A CARROÇA DOS ANÕES: comerciar a mesa de Brasaforja ou contratar uma festa; a festa pendente; o estoque e o preço da Companhia de Latão. Saiu do main.ts (02/11). */
import { type FestaOpts } from './festa';
import { SHOPDEF } from '../inventory';
import { DEFAULT_SETLIST, SONGS, STYLE_INFO } from '../festa-musica';
import { festaPrice, FEASTS, feastEff } from '../festim';
import { buyFxLast } from '../windows';
import type { CarrocaAnoesCtx } from '../main';

export function createCarrocaAnoes(K: CarrocaAnoesCtx) {
/* ---------- a carroça dos anões (27/10): comerciar a mesa de Brasaforja ou contratar uma festa ---------- */
const dwarfEl = document.createElement('div'); dwarfEl.className = 'modalw'; dwarfEl.id = 'dwarfcart'; document.body.appendChild(dwarfEl);
let festaPending: { st: string; opts: FestaOpts; at: number } | null = (() => { try { return JSON.parse(localStorage.getItem('karmika.festa.pend') || 'null'); } catch { return null; } })();
const savePend = () => { try { if (festaPending) localStorage.setItem('karmika.festa.pend', JSON.stringify(festaPending)); else localStorage.removeItem('karmika.festa.pend'); } catch { /* */ } };
function openDwarfCart(route: string) {
  /* 28/10 (Erling: "modal enorme, pega a tela inteira"): a carroça anã abre a prateleira de cards com tooltip, igual à Caravana de Latão
     (abas Mesa, Adega, Peças, Viagem); o botão 🎉 Festas abre o painel de contratar festa */
  SHOPDEF.anoes_carav.extra = { label: '🎉 Contratar uma festa', act: () => { K.inv.closeShop(); openDwarfFesta(route); } };
  K.inv.openShop('anoes_carav', `Carroça dos anões · ${route}`);
}
function openDwarfFesta(route: string) {
  const homeSt = K.settleAt(K.larSys.home.x, K.larSys.home.y, 8)?.name ?? null, places: [string, string, boolean][] = [];
  if (homeSt) places.push([homeSt, `${homeSt} (a sua cidade-lar)`, false]); if (K.myGuild) places.push(['Lumenhal', `Salão da guilda ${K.myGuild.name} (Lumenhal)`, true]);
  const plan = { where: places[0]?.[0] ?? '', guild: places[0]?.[2] ?? false, min: 10, music: true, songs: [...DEFAULT_SETLIST], meats: ['costela', 'picanha'], brews: ['cerveja_forte', 'cerveja_amanteigada'] };
  let tab: 'mesa' | 'festa' = 'festa';
  /* 11/11 (Erling: "coloca ao lado uma praça, e tudo que eu vou adicionando vai aparecendo na praça modelo dentro da modal; assim eu escolho como
     fica a festa"): a praça desenhada de cima, em perspectiva de jogo. Fonte, postes e bandeirinhas sempre; o palco e os três músicos se há música;
     uma brasa para cada carne e um barril para cada bebida escolhida; mais gente e mais lanternas quanto mais longa a festa. */
  const praca = () => { const W = 380, H = 330, cx = W / 2, cy = 178, iso = (x: number, y: number) => [cx + (x - y) * 0.9, cy + (x + y) * 0.45] as const;
    const posts = [[-95, -95], [95, -95], [95, 95], [-95, 95]].map(([x, y]) => iso(x, y)), cols = ['#b8302a', '#e0b048', '#3a7ad0', '#3aa05a', '#8a4ad0', '#e8e0d0'];
    const flags = (a: readonly [number, number], b: readonly [number, number]) => Array.from({ length: 9 }, (_, i) => { const t = (i + 0.5) / 9, x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t - 46 + Math.sin(t * Math.PI) * 9; return `<path d="M${x - 4} ${y} h8 l-4 9z" fill="${cols[i % 6]}"/>`; }).join('');
    const person = (x: number, y: number, c: string, k = 1) => `<g transform="translate(${x} ${y}) scale(${k})"><ellipse cx="0" cy="1" rx="6" ry="2.4" fill="rgba(0,0,0,.4)"/><path d="M-4 0 v-11 q4 -4 8 0 v11z" fill="${c}"/><circle cx="0" cy="-15" r="3.6" fill="#e0b890"/></g>`;
    const n = plan.min <= 5 ? 5 : plan.min <= 10 ? 8 : plan.min <= 20 ? 12 : 16, ppl = Array.from({ length: n }, (_, i) => { const a = i / n * 6.283 + 0.4, r = 46 + (i % 3) * 13, [x, y] = iso(Math.cos(a) * r, Math.sin(a) * r); return { x, y, c: ['#6a3a2a', '#3a5a6a', '#6a5a2a', '#5a2a4a', '#2a5a3a'][i % 5] }; }).sort((p, q) => p.y - q.y);
    const meats = plan.meats.map((k, i) => { const [x, y] = iso(-70 + i * 30, 118); return `<g transform="translate(${x} ${y})"><ellipse cx="0" cy="3" rx="13" ry="5" fill="rgba(0,0,0,.4)"/><rect x="-11" y="-6" width="22" height="8" rx="2" fill="#3a3028" stroke="#1a1410"/><path d="M-9 -6 h18" stroke="#ff7a2a" stroke-width="2.4"/><text x="0" y="-9" font-size="15" text-anchor="middle">${FEASTS[k].icon}</text></g>`; }).join('');
    const brews = plan.brews.map((k, i) => { const [x, y] = iso(118, -70 + i * 30); return `<g transform="translate(${x} ${y})"><ellipse cx="0" cy="4" rx="10" ry="4" fill="rgba(0,0,0,.4)"/><path d="M-8 -14 q8 -4 16 0 v16 q-8 4 -16 0z" fill="#7a4a22" stroke="#2a1808"/><path d="M-8 -8 q8 4 16 0 M-8 -2 q8 4 16 0" stroke="#c9a24a" fill="none"/><text x="0" y="-17" font-size="14" text-anchor="middle">${FEASTS[k].icon}</text></g>`; }).join('');
    const [sx, sy] = iso(-20, -128), lant = Math.min(8, Math.round(plan.min / 4) + 1);
    return `<div class="fpraca"><b>A praça de ${plan.where || 'sua cidade'}</b><svg viewBox="0 0 ${W} ${H}">
      <defs><radialGradient id="fpG" cx="50%" cy="50%" r="60%"><stop offset="0" stop-color="#6a5038"/><stop offset="1" stop-color="#241a14"/></radialGradient></defs>
      <path d="M${iso(-135, -135).join(' ')} L${iso(135, -135).join(' ')} L${iso(135, 135).join(' ')} L${iso(-135, 135).join(' ')}Z" fill="url(#fpG)" stroke="#7d5a2c"/>
      ${plan.music ? `<g transform="translate(${sx} ${sy})"><path d="M-58 8 l58 -28 l58 28 l-58 28z" fill="#8a4a2a" stroke="#2a1808"/><path d="M-58 8 v9 l58 28 v-9z M58 8 v9 l-58 28 v-9z" fill="#5a2e18"/><path d="M-56 -34 l56 -26 l56 26 l-56 26z" fill="#c9342a"/><path d="M-28 -47 l56 26 M0 -60 l56 26 M-56 -34 l56 26" stroke="#ffe0a0" stroke-width="5" opacity=".85"/><path d="M-56 -34 v40 M56 -34 v40" stroke="#3a2412" stroke-width="3"/>${person(-22, 6, '#6a2a6a')}${person(0, 14, '#2a5a3a')}${person(22, 6, '#7a5a2a')}<text x="0" y="-66" font-size="15" text-anchor="middle" fill="#9ad7ff">♪ ♫ ♪</text></g>` : ''}
      ${posts.map((q, i) => flags(q, posts[(i + 1) % 4])).join('')}${posts.map((q) => flags(q, [cx, cy + 4])).join('')}
      ${posts.map(([x, y]) => `<path d="M${x} ${y} v-48" stroke="#2a1c10" stroke-width="3"/><circle cx="${x}" cy="${y - 50}" r="4" fill="#ffe0a0"/>`).join('')}
      ${Array.from({ length: lant }, (_, i) => { const a = i / lant * 6.283, [x, y] = iso(Math.cos(a) * 118, Math.sin(a) * 118); return `<circle cx="${x}" cy="${y - 8}" r="9" fill="#ffb84a" opacity=".16"/><circle cx="${x}" cy="${y - 8}" r="3" fill="#ffd890"/>`; }).join('')}
      <g transform="translate(${cx} ${cy})"><ellipse cx="0" cy="6" rx="30" ry="13" fill="rgba(0,0,0,.45)"/><ellipse cx="0" cy="0" rx="27" ry="12" fill="#8a8a8a" stroke="#3a3a3a"/><ellipse cx="0" cy="-2" rx="20" ry="8.5" fill="#4a8ab8"/><path d="M-4 -2 v-24 q4 -6 8 0 v24z" fill="#b8c0c0" stroke="#4a4a4a"/></g>
      ${meats}${brews}${ppl.map((q) => person(q.x, q.y, q.c)).join('')}
    </svg><small>${n} convidados · ${plan.music ? 'palco e 3 músicos' : 'sem música'} · ${plan.meats.length} brasa${plan.meats.length === 1 ? '' : 's'} · ${plan.brews.length} barri${plan.brews.length === 1 ? 'l' : 's'} · ${plan.min} min</small></div>`; };

  const draw = () => { const price = festaPrice(plan), chk = (on: boolean) => on ? '☑' : '☐';
    const card = (k: string) => { const f = FEASTS[k]; return `<div style="display:grid;grid-template-columns:28px 1fr;gap:8px;padding:7px;border:1px solid #5a4630;border-radius:4px;background:rgba(20,14,10,.6)"><span style="font-size:22px">${f.icon}</span><div><b style="color:#ffd890">${f.name}</b> <small style="color:#c8a060">· ${f.price} 🪙</small><div style="font-size:12px;color:#c8b890;margin:2px 0">${f.desc}</div><small style="color:#9ad79a">${feastEff(f)} · 15 min</small></div></div>`; };
    const tog = (k: string, list: string[]) => `<button data-fk="${k}" style="text-align:left;padding:5px 7px;font:12px Georgia;color:${list.includes(k) ? '#ffe0a0' : '#a89878'};background:${list.includes(k) ? 'rgba(90,60,20,.7)' : 'rgba(20,14,10,.8)'};border:1px solid #5a4630;border-radius:3px">${chk(list.includes(k))} ${FEASTS[k].icon} ${FEASTS[k].name}</button>`;
    const meats = Object.keys(FEASTS).filter((k) => FEASTS[k].slot === 'meal'), brews = Object.keys(FEASTS).filter((k) => FEASTS[k].slot === 'brew');
    const sc0 = (dwarfEl.querySelector('.pn') as HTMLElement | null)?.scrollTop ?? 0; queueMicrotask(() => { const pn = dwarfEl.querySelector('.pn') as HTMLElement | null; if (pn) pn.scrollTop = sc0; }); /* 28/10 (Erling: "cada item que marco a modal se mexe e volta"): redesenhar não volta a rolagem para o topo */
    dwarfEl.innerHTML = `<div class="pn relpn ${tab === 'festa' && places.length ? 'festa2' : ''}" style="width:min(${tab === 'festa' && places.length ? 1010 : 560}px,96vw);height:min(660px,82vh);overflow:auto"><h2>🎉 Festa dos anões · ${route} <button data-x>✕</button></h2>
      <div class="rtabs"><button data-back>‹ Voltar à prateleira</button></div>
      ${tab === 'mesa' ? `<p style="color:#c8b890;font-size:13px;margin:4px 0 8px">Um prato e uma bebida fazem efeito ao mesmo tempo, por 15 minutos. O novo troca o velho.</p><div style="display:grid;gap:6px">${[...meats, ...brews].map(card).join('')}</div><div style="margin-top:10px;text-align:center"><button data-shop style="padding:8px 18px;font:600 13px Cinzel;color:#1a1008;background:#e0b048;border:0;border-radius:3px">Comprar na carroça</button></div>`
      : !places.length ? `<p style="color:#ff9a8a">Os anões só levam a festa para a sua cidade-lar (toque numa fonte para fazer dela o seu lar) ou para o salão da sua guilda.</p>`
      : `<div class="fgrid"><div class="fopts"><p style="color:#c8b890;font-size:13px;margin:4px 0">Você paga, acerta o tempo e o cardápio, e eles armam a festa na praça: bandeirinhas, churrasco, barris e, se quiser, os músicos. Ela começa quando você chegar lá.</p>
      <h3 style="margin:8px 0 4px;color:#e0b048;font:600 12px Cinzel;letter-spacing:.1em">ONDE</h3><div style="display:flex;gap:6px;flex-wrap:wrap">${places.map(([v, l, gd]) => `<button data-where="${v}" data-guild="${gd ? 1 : 0}" style="padding:6px 9px;font:12px Georgia;color:${plan.where === v && plan.guild === gd ? '#ffe0a0' : '#a89878'};background:${plan.where === v && plan.guild === gd ? 'rgba(90,60,20,.7)' : 'rgba(20,14,10,.8)'};border:1px solid #5a4630;border-radius:3px">${l}</button>`).join('')}</div>
      <h3 style="margin:10px 0 4px;color:#e0b048;font:600 12px Cinzel;letter-spacing:.1em">QUANTO TEMPO</h3><div style="display:flex;gap:6px">${[5, 10, 20, 30].map((m) => `<button data-min="${m}" style="padding:6px 12px;font:12px Georgia;color:${plan.min === m ? '#ffe0a0' : '#a89878'};background:${plan.min === m ? 'rgba(90,60,20,.7)' : 'rgba(20,14,10,.8)'};border:1px solid #5a4630;border-radius:3px">${m} min</button>`).join('')}<button data-music style="padding:6px 12px;font:12px Georgia;color:${plan.music ? '#ffe0a0' : '#a89878'};background:${plan.music ? 'rgba(90,60,20,.7)' : 'rgba(20,14,10,.8)'};border:1px solid #5a4630;border-radius:3px">${chk(plan.music)} 🎶 Bardo, tambor e flauta</button></div>
      ${plan.music ? `<h3 style="margin:10px 0 4px;color:#e0b048;font:600 12px Cinzel;letter-spacing:.1em">REPERTÓRIO DOS BARDOS <small style="color:#a89878;font:11px Georgia;letter-spacing:0">(${plan.songs.length} na lista · tocam em ordem)</small></h3><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:5px">${SONGS.map((sg) => { const on = plan.songs.includes(sg.id), si = STYLE_INFO[sg.style]; return `<button data-song="${sg.id}" style="text-align:left;padding:5px 7px;font:12px Georgia;color:${on ? '#ffe0a0' : '#a89878'};background:${on ? 'rgba(90,60,20,.7)' : 'rgba(20,14,10,.8)'};border:1px solid #5a4630;border-radius:3px">${chk(on)} ${si.icon} ${sg.title} <small style="color:${si.col}">· ${si.name}</small></button>`; }).join('')}</div>` : ''}
      <h3 style="margin:10px 0 4px;color:#e0b048;font:600 12px Cinzel;letter-spacing:.1em">CARNES NA BRASA</h3><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:5px">${meats.map((k) => tog(k, plan.meats)).join('')}</div>
      <h3 style="margin:10px 0 4px;color:#e0b048;font:600 12px Cinzel;letter-spacing:.1em">CERVEJAS E VINHOS</h3><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:5px">${brews.map((k) => tog(k, plan.brews)).join('')}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;gap:10px"><span style="color:#ffd890">Total: <b>${price.toLocaleString('pt-BR')} 🪙</b> <small style="color:#a89878">(você tem ${K.game.st.gold.toLocaleString('pt-BR')})</small></span>
      <button data-hire style="padding:8px 18px;font:600 13px Cinzel;color:#1a1008;background:${festaPending || K.festaSys.festa ? '#6a5a40' : '#e0b048'};border:0;border-radius:3px" ${festaPending || K.festaSys.festa ? 'disabled' : ''}>${festaPending ? 'Já há uma festa marcada' : 'Contratar a festa'}</button></div></div>${praca()}</div>`}
    </div>`; };
  dwarfEl.onclick = (e) => { const t = e.target as HTMLElement, b = t.closest('button') as HTMLElement | null; if (t === dwarfEl || b?.dataset.x !== undefined && b?.hasAttribute('data-x')) { dwarfEl.style.display = 'none'; return; } if (!b) return; K.audio.click?.();
    if (b.hasAttribute('data-back')) { dwarfEl.style.display = 'none'; openDwarfCart(route); return; }
    if (b.dataset.tab) tab = b.dataset.tab as typeof tab;
    else if (b.hasAttribute('data-shop')) { dwarfEl.style.display = 'none'; K.inv.openShop('anoes_carav', `Carroça dos anões · ${route}`); return; }
    else if (b.dataset.where) { plan.where = b.dataset.where; plan.guild = b.dataset.guild === '1'; }
    else if (b.dataset.min) plan.min = +b.dataset.min;
    else if (b.hasAttribute('data-music')) plan.music = !plan.music;
    else if (b.dataset.song) { const k = b.dataset.song, i = plan.songs.indexOf(k); if (i >= 0) { if (plan.songs.length > 1) plan.songs.splice(i, 1); } else plan.songs.push(k); }
    else if (b.dataset.fk) { const k = b.dataset.fk, L = FEASTS[k].slot === 'meal' ? plan.meats : plan.brews, i = L.indexOf(k); if (i >= 0) L.splice(i, 1); else L.push(k); }
    else if (b.hasAttribute('data-hire')) { const price = festaPrice(plan); if (K.game.st.gold < price) { K.game.logMsg(`🪙 A festa custa ${price.toLocaleString('pt-BR')} de ouro. Falta dinheiro.`, '#ff9a8a'); return; }
      buyFxLast('🎉'); K.audio.coins(5); K.game.st.gold -= price; festaPending = { st: plan.where, opts: { min: plan.min, music: plan.music, songs: [...plan.songs], meats: [...plan.meats], brews: [...plan.brews], guild: plan.guild }, at: Date.now() + 60000 }; savePend();
      K.game.logMsg(`🍺 Festa contratada para ${plan.guild ? 'o salão da guilda, em ' : ''}${plan.where}: ${plan.min} min. Os anões vão na frente armar tudo; a festa começa quando você chegar lá (daqui a pelo menos 1 minuto).`, '#ffe08a'); dwarfEl.style.display = 'none'; return; }
    draw(); };
  draw(); dwarfEl.style.display = 'flex'; }
/** a festa contratada começa quando você chega à praça (os anões precisam de 1 min para armar) */
function festaPendTick() { if (!festaPending || K.festaSys.festa || K.inside) return; if (Date.now() < festaPending.at) return; if (K.hereSettle()?.name !== festaPending.st) return; const p = festaPending; festaPending = null; savePend(); K.startFesta(p.st, p.opts); }
function prepLatao() { const s = K.caravans.stock(); SHOPDEF.latao.items = s.extra ? [...K.LATAO_BASE, ...K.LATAO_PORTO] : K.LATAO_BASE; SHOPDEF.latao.note = s.note; K.game.logMsg(`⚙ Feitora Brunna: “${s.note}”`, '#e0b048'); }
function latoK() { let k = K.caravans.stock().k; if (K.hasMark('pal_queimou_carga')) k *= 1.2; if (K.hasMark('saqueou_caravana')) k *= 1.1; if (K.hasMark('tec_denunciou_vesna') || K.hasMark('pal_avisou')) k *= 0.93; return k; }
  (window as unknown as { __festaUI?: unknown }).__festaUI = (r = 'teste') => openDwarfFesta(r); /* teste */
  return { openDwarfCart, latoK, prepLatao, festaPendTick, dwarfEl };
}
