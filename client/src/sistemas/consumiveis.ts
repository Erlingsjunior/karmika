/* ANDAR DE CONSUMÍVEIS (F1–F8): a ordem, os fixados, desenhar e usar. Saiu do main.ts (02/11). */
import type { ConsumiveisCtx } from '../main';
import { movable, MV_GRIP } from '../windows';
import { genGear, beltSize, type Gear } from '../loot';
import { cintoAtual, cintoNovo, espaco, poe, tira, solta, ajusta, legado, legadoFeito, cintoDe, ondeEsta, primeiroVazio, salvaCinto, cabe, ehCinto, POR_ESPACO, LARGURA, ENDERECOS, NOME_REGRA, PAUSA_MACRO, VAGAS, macro, poeMacro, vagaDe, regrasAntigas, type TipoRegra, type TipoVaga, type Vaga } from '../cinto';
import { GADGETS } from '../festim';

export function createConsumiveis(K: ConsumiveisCtx) {
/* ---------- o cinto: acesso rápido (F1–F8) ----------
   16/11: o acesso rápido virou o CINTO (ver ../cinto). Cada espaço guarda até 20 unidades tiradas da mochila; o tamanho vem do cinto vestido;
   a engrenagem abre as macros (beber sozinho quando a vida, o fôlego ou a magia baixam, ou manter um efeito em batalha).
   Os espaços continuam endereçados como andar * 8 + coluna: F1–F8 no andar 1, Shift+F1–F8 no andar 2, clique no andar 3. */
const QUICK_ORDER = ['potion', 'potion_g', 'mana', 'elixir_folego', 'caldo_folego', 'tonic', 'antidote', 'stew', 'skewer', 'cooked', 'fishc', 'sausage', 'jerky', 'bread', 'apple', 'beer', 'mead'];
const quickEl = document.createElement('div'); quickEl.id = 'quick'; document.body.appendChild(quickEl);
let quickOpen = localStorage.getItem('karmika.quick') !== '0', macroOpen = false;
const qKey = (i: number) => i < 8 ? `F${i + 1}` : i < 16 ? `⇧F${i - 7}` : `${i - 15}`;
const emBatalha = () => { try { const h = K.heroPosNow(); return (K.game.enemies.list as { alive: boolean; active: boolean; state: string; pos: { x: number; z: number } }[]).some((e) => e.alive && e.active && (e.state === 'chase' || e.state === 'windup' || e.state === 'recover') && (Math.hypot(e.pos.x - h.x, e.pos.z - h.z) < 16)); } catch { return false; } };
/* quem já jogava: o que estava no acesso rápido vai para o cinto (até 20 de cada), e ele ganha um cinto do tamanho da barra que tinha */
function migra() { try {
  const linhas = Math.max(1, Math.min(3, +(localStorage.getItem('karmika.quickrows') || '1') || 1)), pinsRaw = localStorage.getItem('karmika.quickpins'), veterano = pinsRaw !== null || localStorage.getItem('karmika.quickrows') !== null;
  if (veterano) { poeCintoPeca(linhas >= 3 ? 'cinto_mestre' : linhas === 2 ? 'cinto_duplo' : 'cinto_viajante'); sincroniza(); }
  const pins: (string | null)[] = (() => { try { const a = JSON.parse(pinsRaw || 'null'); return Array.isArray(a) ? a : []; } catch { return []; } })();
  const c = cintoAtual(), postos = new Set<string>();
  const bota = (id: string, at: number) => { if (postos.has(id) || !K.ITEMS_Q(id)) return; const n = Math.min(POR_ESPACO, K.inv.count(id)); if (n <= 0 || at < 0) return; if (K.inv.take(id, n)) { poe(at, id, n); postos.add(id); } };
  pins.forEach((id, i) => { if (id && cabe(c, i)) bota(id, i); });
  for (const id of QUICK_ORDER) if (K.inv.has(id)) bota(id, primeiroVazio());
  salvaCinto(); if (veterano) setTimeout(() => K.game.logMsg(`🎒 O acesso rápido agora é o seu cinto: você recebeu um ${c.nome}. Cada espaço guarda até ${POR_ESPACO} unidades; a engrenagem abre as macros.`, '#ffe08a'), 6000);
} catch { /* */ } }
let migrou = !cintoNovo;
/** cria a peça de equipamento de um cinto de mochila (cinto_couro…) e veste */
let vestindo = false; /* enquanto a peça entra na mochila e é vestida, a mochila redesenha a barra: nesse meio-tempo ninguém mexe no tamanho do cinto */
function poeCintoPeca(itemId: string): boolean { const c = cintoDe(itemId); if (!c.id) return true; const g = genGear(1, 'normal', 'belt', c.nome); vestindo = true; try { K.inv.addGear(g); K.inv.equipGear(g.uid); } finally { vestindo = false; } return (K.inv.eq as Record<string, Gear | null>).belt?.uid === g.uid; }
/** a mochila já existe e já carregou? (a barra nasce antes dela) */
const mochilaPronta = () => { try { return typeof K.inv.count('potion') === 'number' && !!K.game.st; } catch { return false; } };
/** o cinto vestido manda no tamanho do acesso rápido: se a peça mudou, ajusta e devolve à mochila o que não cabe mais */
let cintoVisto = -2;
function sincroniza() { if (vestindo || !mochilaPronta()) return; let g: Gear | null = null; try { g = (K.inv.eq as Record<string, Gear | null>).belt ?? null; } catch { return; } const uid = g?.uid ?? -1; if (uid === cintoVisto) return; cintoVisto = uid;
  const z = beltSize(g) ?? [4, 1], sobrou = ajusta(z[0], z[1], g?.name ?? 'Sem cinto'); for (const v of sobrou) if (v.n > 0) K.inv.grant(v.id, v.n);
  if (sobrou.length) K.game.logMsg('🎒 O cinto ficou menor: o que não coube voltou para a mochila.', '#ffe08a'); }
function renderQuick() {
  if (!migrou) { if (!mochilaPronta()) return; migrou = true; migra(); }
  if (legado() && mochilaPronta()) { const id = legado(); legadoFeito(); try { poeCintoPeca(id); } catch { /* a peça fica na mochila */ } }
  sincroniza();
  const c = cintoAtual();
  const cell = (i: number) => { const e = espaco(i); if (!e) return `<div class="slot q empty" data-qs="${i}"><kbd>${qKey(i)}</kbd></div>`; const it = K.ITEMS_Q(e.id), vg = vagaDe(e.id), r = vg ? macro(vg)!.regra : null;
    return `<div class="slot q pin ${e.n ? '' : 'none'} ${r ? 'macro' : ''}" data-q="${i}" data-qs="${i}" title="${it.name}: ${it.desc} · ${e.n} de ${POR_ESPACO} no cinto${r ? ` · macro: ${NOME_REGRA[r.tipo]}${r.tipo === 'efeito' ? '' : ` ${r.abaixo}%`}` : ''} (botão direito devolve à mochila)"><kbd>${qKey(i)}</kbd><span class="ic">${it.icon}</span><b class="n">${e.n}</b>${r ? '<i class="qm">⚙</i>' : ''}</div>`; };
  quickEl.innerHTML = `<div class="qside">${MV_GRIP('l')}<div class="qbtns"><button class="qtog" title="Mostrar/esconder o cinto (F1–F8). Arraste itens da mochila para cá."><svg viewBox="0 0 10 10" width="9" height="9" aria-hidden="true"><path d="${quickOpen ? 'M1 2.5h8L5 7.5z' : 'M1 7.5h8L5 2.5z'}" fill="currentColor"/></svg></button>` + (quickOpen ? `<button class="qrows qgear ${macroOpen ? 'on' : ''}" title="Macros do cinto: beber sozinho quando a vida, o fôlego ou a magia baixarem">⚙</button></div></div><div class="qstack">${Array.from({ length: c.andares }, (_, r) => `<div class="qrow">${Array.from({ length: c.cols }, (_, j) => cell(r * LARGURA + j)).join('')}</div>`).join('')}</div><button class="qfill" title="Reabastecer o cinto com o que há na mochila (até ${POR_ESPACO} por espaço). Não dá para fazer no meio da batalha.">⟳</button>` : '</div></div>');
  if (K.game.hasOrb()) { const r = K.game.reactor(), p = Math.round(r.charge * 100), on = K.game.lamp();
    quickEl.insertAdjacentHTML('beforeend', `<span class="qgap"></span><div class="slot q qtool ${on ? 'lit' : ''}" data-lamp title="Lanterna da esfera ajudante: ${on ? 'acesa' : 'apagada'} (clique para ${on ? 'apagar' : 'acender'})"><span class="ic">🔦</span><b class="n">${on ? 'ON' : 'OFF'}</b></div>${K.kitRace() === 'tecno' ? `<div class="slot q qtool rx ${p < 15 ? 'low' : ''}" data-rx title="Reator: ${p}% · ${Math.round(r.charge * K.game.reactorCap()).toLocaleString('pt-BR')} de Energia. Clique: abrir a aba ⚛ Reator da mochila."><span class="ic">⚛</span><i class="rbar"><s style="height:${p}%"></s></i><b class="n">${p}%</b></div>` : ''}`); }
  quickEl.classList.toggle('open', quickOpen); quickEl.style.setProperty('--qr', String(quickOpen ? c.andares : 1));
  if (macroOpen) renderMacros();
}
movable(quickEl, 'quick');
quickEl.addEventListener('click', (e) => { const t = e.target as HTMLElement; if (t.closest('[data-lamp]')) { K.game.setLamp(!K.game.lamp()); K.audio.click?.(); renderQuick(); K.game.logMsg(K.game.lamp() ? '🔦 A esfera acende a lanterna.' : '🔦 Lanterna da esfera apagada.', '#cfe8ff'); return; } if (t.closest('[data-rx]')) { K.inv.openReactor(); return; } });
setInterval(() => { if (K.game.hasOrb()) renderQuick(); }, 2000); /* a carga do reator no botão */
/* arrastar da mochila para o cinto: até 20 unidades saem da mochila e ficam presas no espaço; o mesmo item nunca ocupa dois espaços */
addEventListener('karmika:quickpin', (e) => { const { id, slot } = (e as CustomEvent<{ id: string; slot: number }>).detail; const c = cintoAtual(), ja = ondeEsta(id);
  let at = ja >= 0 ? ja : slot >= 0 && cabe(c, slot) ? slot : primeiroVazio(); if (at < 0) { K.game.logMsg(`${c.nome}: só ${c.cols * c.andares} espaços. Um cinto maior carrega mais.`, '#ff9a8a'); return; }
  const ocupante = espaco(at); if (ocupante && ocupante.id !== id) { const v = solta(at); if (v && v.n > 0) K.inv.grant(v.id, v.n); }
  const quer = Math.min(POR_ESPACO - (espaco(at)?.n ?? 0), K.inv.count(id)); if (quer <= 0) { K.game.logMsg(espaco(at) ? `Este espaço já está cheio (${POR_ESPACO}).` : `Sem ${K.ITEMS_Q(id).name} na mochila.`, '#b9c6e0'); renderQuick(); return; }
  if (K.inv.take(id, quer)) { poe(at, id, quer); K.game.logMsg(`⚡ ${quer} × ${K.ITEMS_Q(id).name} no cinto (${qKey(at)})`, '#ffe08a'); } renderQuick(); });
/** usa uma unidade do espaço: ela volta um instante para a mochila e é usada de lá, pelo caminho de sempre */
function usaDoCinto(i: number, auto = false): boolean { const e = espaco(i); if (!e || e.n <= 0) return false; const antes = K.inv.count(e.id); K.inv.grant(e.id, 1); try { K.inv.use(e.id); } catch { /* */ }
  const usou = K.inv.count(e.id) <= antes; if (usou) tira(i, 1); else if (K.ITEMS_Q(e.id).kind === 'food' || auto) K.inv.take(e.id, 1); else tira(i, 1); /* pergaminho que pede confirmação: a unidade fica na mochila esperando a resposta */
  return usou; }
function useQuick(i: number) { const e = espaco(i); if (!e) { K.game.logMsg('Espaço vazio: arraste da mochila poções, comida ou pergaminhos para o cinto.', '#b9c6e0'); return; } if (e.n <= 0) { K.game.logMsg(`Acabou ${K.ITEMS_Q(e.id).name} no cinto. Reabasteça (⟳) fora da batalha.`, '#ff9a8a'); return; } usaDoCinto(i); const el = quickEl.querySelector(`[data-q="${i}"]`); el?.classList.add('on'); setTimeout(() => el?.classList.remove('on'), 180); renderQuick(); }
/** completa cada espaço com o que há na mochila */
function reabastece() { if (emBatalha()) { K.game.logMsg('No meio da batalha não dá para mexer na mochila. O cinto é o que você tem.', '#ff9a8a'); return; } let total = 0; for (let i = 0; i < ENDERECOS; i++) { const e = espaco(i); if (!e) continue; const q = Math.min(POR_ESPACO - e.n, K.inv.count(e.id)); if (q > 0 && K.inv.take(e.id, q)) { poe(i, e.id, q); total += q; } } K.game.logMsg(total ? `⟳ Cinto reabastecido: ${total} unidades saíram da mochila.` : '⟳ Nada para reabastecer: o cinto está cheio ou a mochila não tem o que ele usa.', '#ffe08a'); renderQuick(); }
quickEl.addEventListener('click', (e) => { const t = e.target as HTMLElement; if (t.closest('.qgear')) { macroOpen = !macroOpen; if (!macroOpen) macroEl.style.display = 'none'; renderQuick(); return; } if (t.closest('.qfill')) { reabastece(); return; } if (t.closest('.qtog')) { quickOpen = !quickOpen; localStorage.setItem('karmika.quick', quickOpen ? '1' : '0'); if (!quickOpen) { macroOpen = false; macroEl.style.display = 'none'; } renderQuick(); return; } const q = (t.closest('[data-q]') as HTMLElement | null)?.dataset.q; if (q !== undefined) useQuick(+q); });
quickEl.addEventListener('contextmenu', (e) => { const q = (e.target as HTMLElement).closest('[data-qs]') as HTMLElement | null; if (!q) return; e.preventDefault(); const v = solta(+q.dataset.qs!); if (v) { if (v.n > 0) K.inv.grant(v.id, v.n); K.game.logMsg(`↩ ${K.ITEMS_Q(v.id).name} voltou para a mochila.`, '#b9c6e0'); renderQuick(); } });
quickEl.addEventListener('dragover', (e) => { e.preventDefault(); });

/* ---------- vestir o cinto ---------- */
/** usar um cinto da mochila: ele vira a peça de equipamento de mesmo nome e é vestido (o cinto que estava vai para a mochila, como qualquer peça) */
function vesteCinto(id: string): boolean { if (!ehCinto(id) || !K.inv.take(id, 1)) return false; poeCintoPeca(id); sincroniza(); const c = cintoAtual(); K.game.logMsg(`🎒 ${c.nome} vestido: ${c.cols * c.andares} espaços${c.andares > 1 ? ` em ${c.andares} andares` : ''}.`, '#ffe08a'); renderQuick(); return true; }
/* trocar de cinto pela ficha ou pela mochila não passa por aqui: de tempos em tempos a barra confere a peça vestida */
setInterval(() => { try { const u = ((K.inv.eq as Record<string, Gear | null>).belt?.uid) ?? -1; if (u !== cintoVisto) renderQuick(); } catch { /* */ } }, 700);

/* ---------- macros ---------- */
const macroEl = document.createElement('div'); macroEl.id = 'qmacro'; macroEl.style.display = 'none'; document.body.appendChild(macroEl);
/** de que tipo de vaga é o item: poção de vida, alimento (toda outra comida ou bebida) ou engenhoca; null = não entra em macro */
const tipoDe = (id: string): TipoVaga | null => { if (GADGETS[id]) return 'engenhoca'; const it = K.ITEMS_Q(id) as { heal?: number; buff?: string; kind?: string; name: string }; if (it.kind !== 'food') return null; return it.heal && !it.buff && /po[çc][ãa]o/i.test(it.name) ? 'pocao' : 'alimento'; };
/** as regras que o item aceita: só cuida da vida o que cura, do fôlego o que dá fôlego, da magia o que dá magia; só mantém efeito o que tem efeito */
const regrasDe = (id: string): TipoRegra[] => { if (GADGETS[id]) return ['efeito']; const it = K.ITEMS_Q(id) as { stam?: number; mp?: number; heal?: number; buff?: string; stamT?: number; kind?: string }; const L: TipoRegra[] = []; if (it.stam) L.push('folego'); else if (it.mp) L.push('magia'); else if (it.kind === 'food') L.push('vida'); if (it.buff || it.stamT) L.push('efeito'); return L; };
const padrao = (t: TipoRegra) => (t === 'folego' ? 30 : 40);
/* as regras do formato antigo (uma por espaço) viram vagas: a primeira de cada tipo fica, o resto se apaga */
for (const a of regrasAntigas()) { const t = tipoDe(a.id); if (!t) continue; const v = VAGAS.find((q) => q.tipo === t && !macro(q.id)); if (v) poeMacro(v.id, { item: a.id, regra: a.regra }); }
/** os itens do cinto que servem numa vaga daquele tipo */
const servem = (t: TipoVaga) => { const c = cintoAtual(), L: { id: string; i: number; n: number }[] = []; for (let i = 0; i < ENDERECOS; i++) { const e = espaco(i); if (e && cabe(c, i) && tipoDe(e.id) === t) L.push({ id: e.id, i, n: e.n }); } return L; };
let macroPos: { x: number; y: number } | null = (() => { try { return JSON.parse(localStorage.getItem('karmika.ui.qmacro') || 'null'); } catch { return null; } })();
function renderMacros() { const L: string[] = [];
  for (const v of VAGAS) { const m = macro(v.id), ops = servem(v.tipo), it = m ? K.ITEMS_Q(m.item) : null, noCinto = m ? ops.find((o) => o.id === m.item) : null, regras = m ? regrasDe(m.item) : [];
    L.push(`<div class="qmr" title="${v.dica}"><span class="ic">${it?.icon ?? '·'}</span><b>${v.nome}<small>${m ? (noCinto ? `${qKey(noCinto.i)} · ${noCinto.n} de ${POR_ESPACO}` : 'acabou no cinto: reabasteça') : ops.length ? 'vaga livre' : 'nada no cinto serve aqui'}</small></b>`
      + `<select data-mv="${v.id}"><option value="">Nenhum</option>${ops.map((o) => `<option value="${o.id}" ${m?.item === o.id ? 'selected' : ''}>${K.ITEMS_Q(o.id).name}</option>`).join('')}${m && !noCinto ? `<option value="${m.item}" selected>${it!.name}</option>` : ''}</select>`
      + (m ? (regras.length > 1 ? `<select data-mt="${v.id}">${regras.map((t) => `<option value="${t}" ${m.regra.tipo === t ? 'selected' : ''}>${NOME_REGRA[t]}</option>`).join('')}</select>` : `<span class="qrg">${v.tipo === 'engenhoca' ? 'Ligar em batalha' : NOME_REGRA[m.regra.tipo]}</span>`) + (m.regra.tipo !== 'efeito' ? `<label><input type="number" data-mp="${v.id}" min="5" max="95" step="5" value="${m.regra.abaixo}"> %</label>` : '<label></label>') : '<span></span><label></label>') + '</div>'); }
  const r0 = quickEl.getBoundingClientRect();
  macroEl.innerHTML = `<h4 class="qmh" title="Arraste para mover"><span>⚙ Macros do cinto</span><small>✥ arraste</small><button data-mx>✕</button></h4><p>O cinto bebe, come e liga as engenhocas por você. São quatro vagas: escolha em cada uma um item que já está no cinto. Entre dois usos automáticos passam ${String(PAUSA_MACRO).replace('.', ',')} s.</p>${L.join('')}`;
  macroEl.style.display = 'block'; const h = macroEl.offsetHeight, w = macroEl.offsetWidth; const x = macroPos ? macroPos.x : r0.left, y = macroPos ? macroPos.y : r0.top - h - 8; macroEl.style.left = `${Math.max(8, Math.min(innerWidth - w - 8, x))}px`; macroEl.style.top = `${Math.max(8, Math.min(innerHeight - h - 8, y))}px`; }
/* 17/11 (Erling: "não consigo mover essa janela"): arrasta pelo título; a posição fica guardada */
{ let pega: { dx: number; dy: number } | null = null;
  macroEl.addEventListener('pointerdown', (e) => { const t = e.target as HTMLElement; if (!t.closest('.qmh') || t.closest('button')) return; const r = macroEl.getBoundingClientRect(); pega = { dx: e.clientX - r.left, dy: e.clientY - r.top }; macroEl.setPointerCapture(e.pointerId); e.preventDefault(); });
  macroEl.addEventListener('pointermove', (e) => { if (!pega) return; const r = macroEl.getBoundingClientRect(), x = Math.max(8, Math.min(innerWidth - r.width - 8, e.clientX - pega.dx)), y = Math.max(8, Math.min(innerHeight - r.height - 8, e.clientY - pega.dy)); macroEl.style.left = x + 'px'; macroEl.style.top = y + 'px'; macroPos = { x, y }; });
  macroEl.addEventListener('pointerup', () => { if (!pega) return; pega = null; try { localStorage.setItem('karmika.ui.qmacro', JSON.stringify(macroPos)); } catch { /* */ } }); }
addEventListener('keydown', (e) => { if (e.key === 'Escape' && macroOpen) { macroOpen = false; macroEl.style.display = 'none'; renderQuick(); e.stopImmediatePropagation(); e.preventDefault(); } }, true);
macroEl.addEventListener('click', (e) => { if ((e.target as HTMLElement).closest('[data-mx]')) { macroOpen = false; macroEl.style.display = 'none'; renderQuick(); } });
macroEl.addEventListener('change', (e) => { const t = e.target as HTMLInputElement | HTMLSelectElement;
  if (t.dataset.mv !== undefined) { const v = t.dataset.mv as Vaga, id = t.value; if (!id) poeMacro(v, null); else { const tp = regrasDe(id)[0] ?? 'vida'; poeMacro(v, { item: id, regra: macro(v)?.item === id ? macro(v)!.regra : { tipo: tp, abaixo: padrao(tp) } }); } renderQuick(); }
  else if (t.dataset.mt !== undefined) { const v = t.dataset.mt as Vaga, m = macro(v); if (m) { const tp = t.value as TipoRegra; poeMacro(v, { item: m.item, regra: { tipo: tp, abaixo: m.regra.abaixo || padrao(tp) } }); renderQuick(); } }
  else if (t.dataset.mp !== undefined) { const v = t.dataset.mp as Vaga, m = macro(v); if (m) { poeMacro(v, { item: m.item, regra: { ...m.regra, abaixo: Math.max(5, Math.min(95, Math.round(+t.value || 40))) } }); renderQuick(); } } });
/** quanto dura o efeito de um item, lido da descrição ("por 30 s", "por 5 min"); 60 s se não disser */
const duraEfeito = (id: string) => { const d = K.ITEMS_Q(id).desc, t = /dura (\d+) turno|por (\d+) turno/.exec(d); if (t) return +(t[1] ?? t[2]) * 1800; if (GADGETS[id]) return 1800; const m = /por (\d+) ?(s|min)\b/.exec(d); return m ? +m[1] * (m[2] === 'min' ? 60 : 1) : 60; };
let pausa = 0; const efeitoAte = new Map<string, number>();
/** roda a cada quadro: aplica a primeira regra que pedir uso */
function tickMacros(dt: number) { pausa -= dt; if (pausa > 0) return; const st = K.game.st as { hp: number; hpMax: number; mp: number; mpMax: number; stam: number; stamMax: number; dead?: boolean }; if (st.dead || st.hp <= 0) return;
  const agora = performance.now() / 1000; let luta: boolean | null = null;
  /* 17/11: as quatro vagas, na ordem: poção, alimento, engenhoca 1, engenhoca 2 */
  for (const v of VAGAS) { const m = macro(v.id); if (!m) continue; const i = ondeEsta(m.item), e = i >= 0 ? espaco(i) : null, r = m.regra; if (!e || e.n <= 0) continue;
    const pede = r.tipo === 'vida' ? st.hp / st.hpMax * 100 < r.abaixo : r.tipo === 'folego' ? st.stam / st.stamMax * 100 < r.abaixo : r.tipo === 'magia' ? st.mp / Math.max(1, st.mpMax) * 100 < r.abaixo : (efeitoAte.get(e.id) ?? 0) <= agora && (luta ??= emBatalha());
    if (!pede) continue; if (usaDoCinto(i, true)) { pausa = PAUSA_MACRO; if (r.tipo === 'efeito') efeitoAte.set(e.id, agora + duraEfeito(e.id)); const el = quickEl.querySelector(`[data-q="${i}"]`); el?.classList.add('on'); setTimeout(() => { renderQuick(); }, 200); if (e.n <= 0) K.game.logMsg(`⚙ Acabou ${K.ITEMS_Q(e.id).name} no cinto.`, '#ff9a8a'); return; } else if (r.tipo === 'efeito') efeitoAte.set(e.id, agora + (v.tipo === 'engenhoca' ? 120 : 5)); /* recusou (vida cheia; engenhoca já ligada): a vaga seguinte tem a vez */ } }
  return { renderQuick, useQuick, vesteCinto, tickMacros, cinto: cintoAtual };
}
