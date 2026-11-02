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
  const draw = () => { const price = festaPrice(plan), chk = (on: boolean) => on ? '☑' : '☐';
    const card = (k: string) => { const f = FEASTS[k]; return `<div style="display:grid;grid-template-columns:28px 1fr;gap:8px;padding:7px;border:1px solid #5a4630;border-radius:4px;background:rgba(20,14,10,.6)"><span style="font-size:22px">${f.icon}</span><div><b style="color:#ffd890">${f.name}</b> <small style="color:#c8a060">· ${f.price} 🪙</small><div style="font-size:12px;color:#c8b890;margin:2px 0">${f.desc}</div><small style="color:#9ad79a">${feastEff(f)} · 15 min</small></div></div>`; };
    const tog = (k: string, list: string[]) => `<button data-fk="${k}" style="text-align:left;padding:5px 7px;font:12px Georgia;color:${list.includes(k) ? '#ffe0a0' : '#a89878'};background:${list.includes(k) ? 'rgba(90,60,20,.7)' : 'rgba(20,14,10,.8)'};border:1px solid #5a4630;border-radius:3px">${chk(list.includes(k))} ${FEASTS[k].icon} ${FEASTS[k].name}</button>`;
    const meats = Object.keys(FEASTS).filter((k) => FEASTS[k].slot === 'meal'), brews = Object.keys(FEASTS).filter((k) => FEASTS[k].slot === 'brew');
    const sc0 = (dwarfEl.querySelector('.pn') as HTMLElement | null)?.scrollTop ?? 0; queueMicrotask(() => { const pn = dwarfEl.querySelector('.pn') as HTMLElement | null; if (pn) pn.scrollTop = sc0; }); /* 28/10 (Erling: "cada item que marco a modal se mexe e volta"): redesenhar não volta a rolagem para o topo */
    dwarfEl.innerHTML = `<div class="pn relpn" style="width:min(560px,94vw);height:min(640px,78vh);overflow:auto"><h2>🎉 Festa dos anões · ${route} <button data-x>✕</button></h2>
      <div class="rtabs"><button data-back>‹ Voltar à prateleira</button></div>
      ${tab === 'mesa' ? `<p style="color:#c8b890;font-size:13px;margin:4px 0 8px">Um prato e uma bebida fazem efeito ao mesmo tempo, por 15 minutos. O novo troca o velho.</p><div style="display:grid;gap:6px">${[...meats, ...brews].map(card).join('')}</div><div style="margin-top:10px;text-align:center"><button data-shop style="padding:8px 18px;font:600 13px Cinzel;color:#1a1008;background:#e0b048;border:0;border-radius:3px">Comprar na carroça</button></div>`
      : !places.length ? `<p style="color:#ff9a8a">Os anões só levam a festa para a sua cidade-lar (toque numa fonte para fazer dela o seu lar) ou para o salão da sua guilda.</p>`
      : `<p style="color:#c8b890;font-size:13px;margin:4px 0">Você paga, acerta o tempo e o cardápio, e eles armam a festa na praça: bandeirinhas, churrasco, barris e, se quiser, os músicos. Ela começa quando você chegar lá.</p>
      <h3 style="margin:8px 0 4px;color:#e0b048;font:600 12px Cinzel;letter-spacing:.1em">ONDE</h3><div style="display:flex;gap:6px;flex-wrap:wrap">${places.map(([v, l, gd]) => `<button data-where="${v}" data-guild="${gd ? 1 : 0}" style="padding:6px 9px;font:12px Georgia;color:${plan.where === v && plan.guild === gd ? '#ffe0a0' : '#a89878'};background:${plan.where === v && plan.guild === gd ? 'rgba(90,60,20,.7)' : 'rgba(20,14,10,.8)'};border:1px solid #5a4630;border-radius:3px">${l}</button>`).join('')}</div>
      <h3 style="margin:10px 0 4px;color:#e0b048;font:600 12px Cinzel;letter-spacing:.1em">QUANTO TEMPO</h3><div style="display:flex;gap:6px">${[5, 10, 20, 30].map((m) => `<button data-min="${m}" style="padding:6px 12px;font:12px Georgia;color:${plan.min === m ? '#ffe0a0' : '#a89878'};background:${plan.min === m ? 'rgba(90,60,20,.7)' : 'rgba(20,14,10,.8)'};border:1px solid #5a4630;border-radius:3px">${m} min</button>`).join('')}<button data-music style="padding:6px 12px;font:12px Georgia;color:${plan.music ? '#ffe0a0' : '#a89878'};background:${plan.music ? 'rgba(90,60,20,.7)' : 'rgba(20,14,10,.8)'};border:1px solid #5a4630;border-radius:3px">${chk(plan.music)} 🎶 Bardo, tambor e flauta</button></div>
      ${plan.music ? `<h3 style="margin:10px 0 4px;color:#e0b048;font:600 12px Cinzel;letter-spacing:.1em">REPERTÓRIO DOS BARDOS <small style="color:#a89878;font:11px Georgia;letter-spacing:0">(${plan.songs.length} na lista · tocam em ordem)</small></h3><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:5px">${SONGS.map((sg) => { const on = plan.songs.includes(sg.id), si = STYLE_INFO[sg.style]; return `<button data-song="${sg.id}" style="text-align:left;padding:5px 7px;font:12px Georgia;color:${on ? '#ffe0a0' : '#a89878'};background:${on ? 'rgba(90,60,20,.7)' : 'rgba(20,14,10,.8)'};border:1px solid #5a4630;border-radius:3px">${chk(on)} ${si.icon} ${sg.title} <small style="color:${si.col}">· ${si.name}</small></button>`; }).join('')}</div>` : ''}
      <h3 style="margin:10px 0 4px;color:#e0b048;font:600 12px Cinzel;letter-spacing:.1em">CARNES NA BRASA</h3><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:5px">${meats.map((k) => tog(k, plan.meats)).join('')}</div>
      <h3 style="margin:10px 0 4px;color:#e0b048;font:600 12px Cinzel;letter-spacing:.1em">CERVEJAS E VINHOS</h3><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:5px">${brews.map((k) => tog(k, plan.brews)).join('')}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;gap:10px"><span style="color:#ffd890">Total: <b>${price.toLocaleString('pt-BR')} 🪙</b> <small style="color:#a89878">(você tem ${K.game.st.gold.toLocaleString('pt-BR')})</small></span>
      <button data-hire style="padding:8px 18px;font:600 13px Cinzel;color:#1a1008;background:${festaPending || K.festaSys.festa ? '#6a5a40' : '#e0b048'};border:0;border-radius:3px" ${festaPending || K.festaSys.festa ? 'disabled' : ''}>${festaPending ? 'Já há uma festa marcada' : 'Contratar a festa'}</button></div>`}
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
  return { openDwarfCart, latoK, prepLatao, festaPendTick, dwarfEl };
}
