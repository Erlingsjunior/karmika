/* ANDAR DE CONSUMÍVEIS (F1–F8): a ordem, os fixados, desenhar e usar. Saiu do main.ts (02/11). */
import type { ConsumiveisCtx } from '../main';
import { movable, MV_GRIP } from '../windows';

export function createConsumiveis(K: ConsumiveisCtx) {
/* ---------- andar de consumíveis (F1–F8) ---------- */
const QUICK_ORDER = ['potion', 'potion_g', 'mana', 'tonic', 'antidote', 'stew', 'skewer', 'cooked', 'fishc', 'sausage', 'jerky', 'bread', 'apple', 'beer', 'mead'];
const quickEl = document.createElement('div'); quickEl.id = 'quick'; document.body.appendChild(quickEl);
let quickOpen = localStorage.getItem('karmika.quick') !== '0', quickIds: (string | null)[] = [];
/* F1–F8: o jogador arrasta da mochila o que quiser (pergaminhos, comida, poções); espaços sem item fixo se preenchem sozinhos */
/* 07/11 (Erling: "o menu rápido pode ser movido e ganhar mais 2 andares"): até 3 andares de 8. Andar 1: F1–F8; andar 2: Shift+F1–F8; andar 3: clique */
let quickRows = Math.max(1, Math.min(3, +(localStorage.getItem('karmika.quickrows') || '1') || 1));
const NQ = 24;
let quickPins: (string | null)[] = (() => { try { const a = JSON.parse(localStorage.getItem('karmika.quickpins') || 'null'); if (Array.isArray(a)) return Array.from({ length: NQ }, (_, i) => a[i] ?? null); } catch { /* */ } return Array(NQ).fill(null); })();
const qKey = (i: number) => i < 8 ? `F${i + 1}` : i < 16 ? `⇧F${i - 7}` : `${i - 15}`;
const saveQuickPins = () => { try { localStorage.setItem('karmika.quickpins', JSON.stringify(quickPins)); } catch { /* */ } };
function renderQuick() {
  try { const pinned = new Set(quickPins.filter(Boolean) as string[]); const auto = QUICK_ORDER.filter((id) => !pinned.has(id) && K.inv.has(id)); quickIds = quickPins.map((p, i) => i < quickRows * 8 ? p ?? auto.shift() ?? null : p); } catch { return; }
  const cell = (id: string | null, i: number) => { const pin = !!quickPins[i]; if (!id) return `<div class="slot q empty" data-qs="${i}"><kbd>${qKey(i)}</kbd></div>`; const n = K.inv.count(id), it = K.ITEMS_Q(id);
    return `<div class="slot q ${pin ? 'pin' : ''} ${n ? '' : 'none'}" data-q="${i}" data-qs="${i}" title="${it.name}: ${it.desc}${pin ? ' — fixado (botão direito solta)' : ''}"><kbd>${qKey(i)}</kbd><span class="ic">${it.icon}</span><b class="n">${n}</b></div>`; };
  quickEl.innerHTML = `<div class="qside">${MV_GRIP('l')}<button class="qtog" title="Mostrar/esconder acesso rápido (F1–F8). Arraste itens da mochila para cá."><svg viewBox="0 0 10 10" width="9" height="9" aria-hidden="true"><path d="${quickOpen ? 'M1 2.5h8L5 7.5z' : 'M1 7.5h8L5 2.5z'}" fill="currentColor"/></svg></button>` + (quickOpen ? `<button class="qrows" title="Andares do acesso rápido: ${quickRows} (clique para ${quickRows < 3 ? 'mais um' : 'voltar a 1'}). Andar 2: Shift+F1–F8 · andar 3: clique">${quickRows}</button></div><div class="qstack">${Array.from({ length: quickRows }, (_, r) => `<div class="qrow">${quickIds.slice(r * 8, r * 8 + 8).map((id, j) => cell(id, r * 8 + j)).join('')}</div>`).join('')}</div>` : '</div>');
  if (K.game.hasOrb()) { const r = K.game.reactor(), p = Math.round(r.charge * 100), on = K.game.lamp();
    quickEl.insertAdjacentHTML('beforeend', `<span class="qgap"></span><div class="slot q qtool ${on ? 'lit' : ''}" data-lamp title="Lanterna da esfera ajudante: ${on ? 'acesa' : 'apagada'} (clique para ${on ? 'apagar' : 'acender'})"><span class="ic">🔦</span><b class="n">${on ? 'ON' : 'OFF'}</b></div>${K.kitRace() === 'tecno' ? `<div class="slot q qtool rx ${p < 15 ? 'low' : ''}" data-rx title="Reator: ${p}% · ${Math.round(r.charge * K.game.reactorCap()).toLocaleString('pt-BR')} de Energia. Clique: abrir a aba ⚛ Reator da mochila."><span class="ic">⚛</span><i class="rbar"><s style="height:${p}%"></s></i><b class="n">${p}%</b></div>` : ''}`); }
  quickEl.classList.toggle('open', quickOpen); quickEl.style.setProperty('--qr', String(quickOpen ? quickRows : 1));
}
movable(quickEl, 'quick');
quickEl.addEventListener('click', (e) => { const t = e.target as HTMLElement; if (t.closest('[data-lamp]')) { K.game.setLamp(!K.game.lamp()); K.audio.click?.(); renderQuick(); K.game.logMsg(K.game.lamp() ? '🔦 A esfera acende a lanterna.' : '🔦 Lanterna da esfera apagada.', '#cfe8ff'); return; } if (t.closest('[data-rx]')) { K.inv.openReactor(); return; } });
setInterval(() => { if (K.game.hasOrb()) renderQuick(); }, 2000); /* a carga do reator no botão */
addEventListener('karmika:quickpin', (e) => { const { id, slot } = (e as CustomEvent<{ id: string; slot: number }>).detail; const k = quickPins.indexOf(id); if (k >= 0) quickPins[k] = null;
  const at = slot >= 0 ? slot : quickPins.findIndex((p, i) => i < quickRows * 8 && !p && !quickIds[i]) >= 0 ? quickPins.findIndex((p, i) => i < quickRows * 8 && !p && !quickIds[i]) : quickPins.findIndex((p, i) => i < quickRows * 8 && !p); if (at < 0) return;
  quickPins[at] = id; saveQuickPins(); renderQuick(); K.game.logMsg(`⚡ ${K.ITEMS_Q(id).name} no acesso rápido (${qKey(at)})`, '#ffe08a'); });
function useQuick(i: number) { const id = quickIds[i]; if (!id) { K.game.logMsg('Espaço vazio — arraste da mochila poções, comida ou pergaminhos para cá.', '#b9c6e0'); return; } if (!K.inv.count(id)) { K.game.logMsg(`Sem ${K.ITEMS_Q(id).name} na mochila.`, '#ff9a8a'); return; } K.inv.use(id); const el = quickEl.querySelector(`[data-q="${i}"]`); el?.classList.add('on'); setTimeout(() => el?.classList.remove('on'), 180); renderQuick(); }
quickEl.addEventListener('click', (e) => { const t = e.target as HTMLElement; if (t.closest('.qrows')) { quickRows = quickRows % 3 + 1; localStorage.setItem('karmika.quickrows', String(quickRows)); renderQuick(); return; } if (t.closest('.qtog')) { quickOpen = !quickOpen; localStorage.setItem('karmika.quick', quickOpen ? '1' : '0'); renderQuick(); return; } const q = (t.closest('[data-q]') as HTMLElement | null)?.dataset.q; if (q !== undefined) useQuick(+q); });
quickEl.addEventListener('contextmenu', (e) => { const q = (e.target as HTMLElement).closest('[data-qs]') as HTMLElement | null; if (!q) return; e.preventDefault(); const i = +q.dataset.qs!; if (quickPins[i]) { quickPins[i] = null; saveQuickPins(); renderQuick(); } });
quickEl.addEventListener('dragover', (e) => { e.preventDefault(); });
  return { renderQuick, useQuick };
}
