/* LETREIRO RÚNICO DO ALTO e EVENTOS MUNDIAIS: lugar, clima, turno, nível da região, elite próxima; o contador e o painel dos eventos globais; as marcas de missão sobre os NPCs. Saiu do main.ts (02/11). */
import { globalNow, globalList, G_FX, globalNext } from '../eventos';
import { floatWin } from '../windows';
import { questCat } from '../quests';
import { regionAt, zoneW, CATHEDRAL, CITY } from '../world';
import { DEFS } from '../enemies';
import { TILE_M as T } from '@karmika/shared';
import * as THREE from 'three';
import { SHOP_OF } from '../dados/npcs-dados';
import type { LetreiroCtx } from '../main';

export type GevH = { id: string; start: number; kills: number; evs: number };
export function createLetreiro(K: LetreiroCtx) {
/* ---------- letreiro rúnico do alto: lugar, clima, hora/turno, nível da região, elite próxima, cidade ---------- */
const bannerEl = document.createElement('div'); bannerEl.id = 'banner'; document.body.appendChild(bannerEl);
/* ---------- EVENTOS MUNDIAIS (25/10): contador embaixo do minimapa, chip na barra e o painel para rever tudo depois do anúncio ---------- */
function fmtLeft(ms: number) { const m = Math.max(0, Math.ceil(ms / 60000)); return m >= 60 ? `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}` : `${m} min`; }
function fmtClock(ms: number) { const s2 = Math.max(0, Math.floor(ms / 1000)), h = Math.floor(s2 / 3600), m = Math.floor((s2 % 3600) / 60), sec = s2 % 60; return h ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`; }
const GEV_HIST = 'karmika.gevhist.v1';
const gevHist = (): GevH[] => { try { return JSON.parse(localStorage.getItem(GEV_HIST) || '[]'); } catch { return []; } };
function gevNote(f: (h: GevH) => void) { let g: ReturnType<typeof globalNow> = null; try { g = globalNow(); } catch { /* */ } if (!g) return; const L = gevHist(); let h = L.find((q) => q.id === g!.id && Math.abs(q.start - (g!.end - (g!.id === 'lua' ? 80 : 90) * 60000)) < 60000);
  if (!h) { h = { id: g.id, start: g.end - (g.id === 'lua' ? 80 : 90) * 60000, kills: 0, evs: 0 }; L.unshift(h); } f(h); try { localStorage.setItem(GEV_HIST, JSON.stringify(L.slice(0, 12))); } catch { /* */ } }
const gevChip = document.createElement('button'); gevChip.id = 'gevt'; gevChip.title = 'Eventos mundiais: o que está acontecendo, o que vem e o que já passou';
setTimeout(() => document.getElementById('mini')?.appendChild(gevChip), 0);
gevChip.addEventListener('click', () => openGev());
const gevEl = document.createElement('div'); gevEl.id = 'gevwin'; gevEl.className = 'pn gevpn'; gevEl.style.display = 'none'; document.body.appendChild(gevEl);
setTimeout(() => floatWin(gevEl, 'gev', { right: '210px', top: '70px' }), 0);
let gevOpen = false;
function openGev(on = !gevOpen) { gevOpen = on; gevEl.style.display = on ? 'block' : 'none'; if (on) renderGev(); }
gevEl.addEventListener('click', (e) => { const t = e.target as HTMLElement; if (t.closest('[data-x]')) { openGev(false); return; } const b = t.closest('[data-evk]') as HTMLElement | null; if (b) { K.eventos.track(b.dataset.evk!); K.pinT = null; K.game.logMsg('🧭 Evento seguido: a bússola aponta para lá.', '#ffb060'); renderGev(); } });
const fmtWhen = (ms: number) => { const d = new Date(ms), now = new Date(), same = d.toDateString() === now.toDateString(), tm = new Date(now.getTime() + 864e5).toDateString() === d.toDateString(); return `${same ? 'hoje' : tm ? 'amanhã' : d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' })} às ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
function renderGev() {
  const L = globalList(), now = Date.now(), H = gevHist();
  const cur = L.now, side = cur ? K.globalSideText(cur.id) : '';
  const near = (() => { try { return K.eventos.nearby(K.hereT(), 900); } catch { return []; } })();
  const card = cur ? `<div class="gv-now" style="--gc:${cur.color}"><div class="gv-ic">${cur.icon}</div><div><b>${cur.name}</b><span class="gv-cd">termina em ${fmtClock(cur.end - now)}</span><p>${cur.text}</p>${side ? `<p class="gv-side">✦ Para você: ${side}</p>` : ''}<div class="gv-fx"><b class="gv-fxh">O que ${cur.id === 'lua' ? 'a Lua de Sangue' : 'o Dia da Aurora'} causa no mundo</b>${(G_FX[cur.id as 'lua'] ?? []).map((f) => `<div><i>${f.icon}</i>${f.t}</div>`).join('')}</div><p class="gv-note">O céu pesa na chegada e depois fica leve para jogar. Dentro de um evento que você aceitou, a ${cur.id === 'lua' ? 'lua' : 'luz'} volta com tudo.</p></div></div>`
    : `<div class="gv-now none"><div class="gv-ic">☾</div><div><b>Nenhum evento mundial agora</b><p>O mundo respira. ${L.next[0] ? `O próximo é ${L.next[0].icon} ${L.next[0].name}, ${fmtWhen(L.next[0].start)} (em ${fmtLeft(L.next[0].start - now)}).` : ''}</p></div></div>`;
  const nearH = near.length ? near.slice(0, 6).map((q) => `<div class="gv-row"><span style="color:${q.color}">${q.icon} ${q.name}</span><small>Nv ${q.lvl} · ${K.fmtDist(q.d)} · ${q.joined ? 'você está nele' : `termina em ${fmtLeft(q.left * 1000)}`}</small>${q.joined ? '' : `<button data-evk="${q.key}">Seguir</button>`}</div>`).join('') : '<p class="gv-empty">Nada acontecendo por perto agora.</p>';
  const hist = (id: string, st: number) => H.find((q) => q.id === id && Math.abs(q.start - st) < 120000);
  const pastH = L.past.map((q) => { const h = hist(q.id, q.start); return `<div class="gv-row past"><span>${q.icon} ${q.name}</span><small>${fmtWhen(q.start)}${h ? ` · você estava lá: ${h.kills} abates, ${h.evs} evento(s)` : ' · você não estava'}</small></div>`; }).join('');
  const nextH = L.next.map((q) => `<div class="gv-row"><span style="color:${q.color}">${q.icon} ${q.name}</span><small>${fmtWhen(q.start)} · em ${fmtLeft(q.start - now)}</small></div>`).join('');
  gevEl.innerHTML = `<h2>Eventos mundiais<button data-x title="Fechar">✕</button></h2>${card}<h3>Acontecendo perto de você</h3>${nearH}<h3>Próximos</h3>${nextH}<h3>Já aconteceram</h3>${pastH}<small class="ft">Os eventos mundiais andam ~1h26 mais cedo a cada dia: em uma semana passam por todas as horas.</small>`;
}
let gevT = 0;
function updateGevChip(dt: number) { gevT -= dt; if (gevT > 0) return; gevT = 1;
  let g: ReturnType<typeof globalNow> = null, nx: ReturnType<typeof globalNext> = null; try { g = globalNow(); nx = g ? null : globalNext(); } catch { /* */ }
  gevChip.className = g ? 'on ' + g.id : 'off';
  gevChip.innerHTML = g ? `<i>${g.icon}</i><span><b>${g.name}</b><em>${fmtClock(g.end - Date.now())}</em></span>` : nx ? `<i>${nx.icon}</i><span><b>${nx.name}</b><em>em ${fmtLeft(nx.start - Date.now())}</em></span>` : '';
  gevChip.style.display = g || nx ? '' : 'none'; if (g) gevChip.style.setProperty('--gc', g.color);
  if (gevOpen) renderGev(); }

let bannerT = 0, qmT = 0;
/** marcadores de missão sobre os NPCs: ? = tem missão, ! = missão pronta para entregar; amarelo história, verde recorrente (quadro), azul extra */
function updateQuestMarks() {
  for (const n of K.npcSys.npcs) { if (!n.hero.root.visible) continue; const nm = n.def.name; let ti: ReturnType<typeof K.quests.turnins> = [], of: ReturnType<typeof K.quests.offers> = []; try { ti = K.quests.turnins(nm); of = K.quests.offers(nm); } catch (err) { console.warn('marca de missão', nm, err); } /* um NPC com problema não apaga as marcas dos outros */
    /* quem uma missão manda procurar (objetivo 'falar com'): o sinal de pessoa da missão em cima da cabeça (Erling, 25/10) */
    const meetQ = Object.keys(K.quests.q.active).map((id) => K.quests.def(id)).find((q2) => !!q2 && q2.objs.some((o, i) => o.kind === 'talk' && o.npc === nm && K.quests.objProg(q2, i) < 1));
    if (meetQ && !ti.length) { const qm0 = n.el.querySelector('.qm') as HTMLElement | null; if (qm0) { n.el.dataset.qm = 'meet'; qm0.textContent = '👤'; qm0.title = `Missão: ${meetQ.name}`; } continue; }
    const d = ti[0] ?? of[0]; const cat = d ? ({ story: 'story', side: 'side', rep: 'board' } as const)[questCat(d)] : nm === 'Garrick' ? 'board' : null;
    const qm = n.el.querySelector('.qm') as HTMLElement | null; if (!qm) continue;
    if (!cat) { delete n.el.dataset.qm; continue; }
    n.el.dataset.qm = (ti.length ? 'done' : 'offer') + '-' + cat; qm.textContent = ti.length ? '!' : '?'; }
}
function regionInfo() {
  const h0 = K.hereT(); let elite: { name: string; d: number; alive: boolean } | null = null; const rg = regionAt(h0.x, h0.y);
  for (const sp of K.city.spawns) { const d = Math.hypot(sp.x - h0.x, sp.y - h0.y); const def = DEFS[sp.type]; if (!def) continue; if ((sp.type === 'prince' || sp.type === 'tormentor' || sp.type === 'treant') && d < 110 && regionAt(sp.x, sp.y) === rg && (!elite || d < elite.d)) elite = { name: def.name, d: d * T, alive: K.game.enemies.list.some((e) => e.type === sp.type && e.alive && Math.hypot(e.home.x / T - sp.x, e.home.y / T - sp.y) < sp.r + 1) }; }
  return { lvl: rg.lo, lo: rg.lo, hi: rg.hi, region: rg.name, elite };
}
function temperature() {
  const h0 = K.hereT(), z = zoneW(Math.floor(h0.x), Math.floor(h0.y)), hr = K.gameHour();
  const base = -6 * z.snow + 19 * z.meadow + 15 * z.forest + 23 * z.swamp + 12 * z.rock + 16 * z.ruins + 34 * z.volcanic + 14 * z.enchanted + 11 * z.blight + 27 * z.jungle + 22 * z.coast;
  const dayK = Math.cos((hr - 14) / 24 * 6.283) * 5; // mais quente às 14h, mais frio às 2h
  return Math.round(base + dayK + Math.sin(Date.now() / 600000) * 1.5);
}
function turnIndex(h = K.gameHour()) { const i = K.TURNS.findIndex(([h0]) => h >= h0 && h < h0 + 4); return i < 0 ? 6 : i + 1; }
function dayIndex() { return Math.floor((Date.now() - 1792000000000) / K.DAY_REAL_MS) + 1; }
/** quanto a maldição da Catedral pesa aqui (0 longe → 1 no campo santo); some quando a Catedral é purificada */
function curseK() { if (localStorage.getItem('karmika.crypt.done') === '1') return 0; const d = Math.hypot(K.hereT().x - (CATHEDRAL.x + 6), K.hereT().y - (CATHEDRAL.y + 20)); return THREE.MathUtils.clamp((105 - d) / 45, 0, 1); }
let curseNow = 0;
function karmaMood(ri: { lvl: number; elite: { alive: boolean } | null }, night: number) {
  if (curseK() > 0.3) return ['Maldita', '#ff7a6a'];
  if (ri.elite?.alive && ri.lvl > K.game.st.lvl) return ['Sombria', '#ff9a8a'];
  if (ri.lvl > K.game.st.lvl + 3) return ['Inquieta', '#ffd24a'];
  if (night > 0.6) return ['Vigília', '#b9c6e0'];
  return ['Serena', '#8fd08a'];
}
function updateBanner() {
  if (bannerEl.matches(':hover') && bannerEl.innerHTML) return; // não reconstrói enquanto o mouse está no menu
  const h0 = K.hereT(), hr = K.gameHour(), hh = Math.floor(hr), mm = Math.floor((hr - hh) * 60), temp = temperature();
  const st = K.city.settlements.find((q) => Math.hypot(h0.x - q.x, h0.y - q.y) < q.radius + 6) ?? (Math.hypot(h0.x - CITY.x, h0.y - CITY.y) < 28 ? K.city.settlements[0] : undefined);
  const ri = regionInfo(), [mood, moodC] = karmaMood(ri, K.state.night);
  const nearHome = st && st.name === K.larSys.home.name;
  const shops = st ? K.npcSys.npcs.filter((q) => (K.SHOP_BY_NAME.has(q.def.name) || SHOP_OF[q.def.name]) && Math.hypot(q.pos.x / T - st.x, q.pos.z / T - st.y) < st.radius + 8) : [];
  const places = st ? K.city.pois.filter((p) => Math.hypot(p.x - st.x, p.y - st.y) < st.radius + 8 && p.name !== st.name) : [];
  const tav = st ? K.city.props.find((p) => p.kind === 'house' && p.variant === 4 && Math.hypot(p.gx - st.x, p.gy - st.y) < st.radius + 8) : null;
  const eliteSp = ri.elite ? K.city.spawns.find((sp) => DEFS[sp.type]?.name === ri.elite!.name && Math.hypot(sp.x - h0.x, sp.y - h0.y) * T < ri.elite!.d + 1) : null;
  const parts = [
    `<b class="pl">${K.zoneName()}</b>`,
    (() => { const sc = K.obras.siteCenter(); if (!sc) return ''; const p = Math.max(0, Math.min(1, sc.done / sc.need)), C = 2 * Math.PI * 6; return `<span class="obr" title="Obra: ${K.obras.home?.name ?? ''} · ${sc.done.toFixed(1).replace('.', ',')} de ${sc.need} turnos${sc.robots ? ` · ${sc.robots} Ajudante(s) trabalhando` : ''}${K.obras.working ? ' · você está trabalhando' : ''}"><svg viewBox="0 0 16 16" width="15" height="15"><circle cx="8" cy="8" r="6" fill="none" stroke="#3a2c16" stroke-width="3"/><circle cx="8" cy="8" r="6" fill="none" stroke="#ffd24a" stroke-width="3" stroke-dasharray="${(C * p).toFixed(2)} ${C.toFixed(2)}" transform="rotate(-90 8 8)"/></svg> 🏗 ${Math.round(p * 100)}%${sc.robots ? ` · 🦾${sc.robots}` : ''}</span>`; })(),
    `<span title="Temperatura">${temp < 2 ? '❄' : temp > 24 ? '☀' : '🌤'} ${temp}°C</span>`,
    `<span title="Dia e turno de Karmika (6 turnos de 4 h; 1 turno = 30 min reais)">Dia ${dayIndex()} · Turno ${turnIndex()}/6 ${K.turnName()} · ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}</span>`,
    `<span title="Situação kármica da região" style="color:${moodC}">◈ ${mood}</span>`,
    (() => { let g: ReturnType<typeof globalNow> = null; try { g = globalNow(); } catch { /* */ } return g ? `<a class="gevb" data-gev style="color:${g.color}" title="Evento mundial: clique para ver o que está acontecendo">${g.icon} ${g.name} · ${fmtLeft(g.end - Date.now())}</a>` : ''; })(),
    `<span title="${ri.region}: os bichos daqui vão do nível ${ri.lo} ao ${ri.hi}" class="${ri.lo > K.game.st.lvl + 3 ? 'danger' : ''}">⚔ ${ri.region} · Nv ${ri.lo}–${ri.hi}${ri.lo > K.game.st.lvl + 3 ? ' · perigo' : ''}</span>`,
    ri.elite ? `<a class="elite" data-pin="elite" title="Clique para ir até a elite"><i class="${ri.elite.alive ? 'on' : ''}"></i>${ri.elite.name} · ${K.fmtDist(ri.elite.d)}${ri.elite.alive ? '' : ' (caído)'}</a>` : '',
    st ? `<span class="dd" title="Assentamento">${st.kind === 'city' ? '🏰 Cidade' : '🏘 Vila'}${nearHome ? ' · ⛲ lar' : ''}${(() => { const t = K.align.tier('vila', st.name); return ` · <a data-align style="color:${t.col}" title="Alinhamento Kármico com ${st.name} (clique para ver todos)">${t.name}</a>`; })()}<div class="menu">${shops.map((q) => `<a data-pin="npc:${q.def.name}">🪙 ${q.def.name} <small>${q.def.role}</small></a>`).join('')}${tav ? `<a data-pin="tav">🍺 Taverna</a>` : ''}${places.map((p) => `<a data-pin="poi:${p.name}">📍 ${p.name}</a>`).join('')}${!shops.length && !tav && !places.length ? '<a>nada por aqui</a>' : ''}</div></span>` : '',
  ].filter(Boolean);
  const loc = K.pinT ? `<div class="loc"><span>🔍 Indo para <b>${K.pinT.label}</b> · ${K.fmtDist(Math.hypot(K.pinT.x - K.state.fx, K.pinT.y - K.state.fy) * T)}</span><a data-pin="clear" title="Parar de guiar">✕</a></div>` : K.quests.tracked && K.guideT ? `<div class="loc"><span>🔍 Missão: <b>${K.guideT.label}</b> · ${K.fmtDist(Math.hypot(K.guideT.x - K.state.fx, K.guideT.y - K.state.fy) * T)}</span></div>` : '';
  bannerEl.innerHTML = `<div class="bn">${parts.join('<em>◆</em>')}</div>${loc}`;
  bannerEl.dataset.eliteName = ri.elite?.name ?? ''; bannerEl.dataset.eliteX = eliteSp ? String(eliteSp.x) : ''; bannerEl.dataset.eliteY = eliteSp ? String(eliteSp.y) : ''; bannerEl.dataset.tavX = tav ? String(tav.gx + tav.w / 2) : ''; bannerEl.dataset.tavY = tav ? String(tav.gy + tav.h + 1) : '';
}
bannerEl.addEventListener('click', (e) => {
  if ((e.target as HTMLElement).closest('[data-gev]')) { openGev(); return; }
  if ((e.target as HTMLElement).closest('[data-align]')) { K.align.toggle(true); return; }
  const a = (e.target as HTMLElement).closest('[data-pin]') as HTMLElement | null; if (!a) return; const k = a.dataset.pin!;
  if (k === 'clear') { K.setPin(null); return; }
  if (k === 'elite') { if (bannerEl.dataset.eliteX) K.setPin({ x: +bannerEl.dataset.eliteX, y: +bannerEl.dataset.eliteY!, label: bannerEl.dataset.eliteName || 'Elite' }); return; }
  if (k === 'tav') { if (bannerEl.dataset.tavX) K.setPin({ x: +bannerEl.dataset.tavX, y: +bannerEl.dataset.tavY!, label: 'Taverna' }); return; }
  if (k.startsWith('npc:')) { const n = K.npcSys.npcs.find((q) => q.def.name === k.slice(4)); if (n) K.setPin({ x: n.pos.x / T, y: n.pos.z / T, label: n.def.name }); return; }
  if (k.startsWith('poi:')) { const p = K.city.pois.find((q) => q.name === k.slice(4)); if (p) K.setPin({ x: p.x, y: p.y, label: p.name }); }
});
  return { temperature, gevNote, dayIndex, updateBanner, get bannerT() { return bannerT; }, set bannerT(v: typeof bannerT) { bannerT = v; }, updateGevChip, get qmT() { return qmT; }, set qmT(v: typeof qmT) { qmT = v; }, updateQuestMarks, get curseNow() { return curseNow; }, set curseNow(v: typeof curseNow) { curseNow = v; }, curseK };
}
