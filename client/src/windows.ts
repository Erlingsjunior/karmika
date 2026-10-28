/** Janelas flutuantes (estilo WoW): várias abertas ao mesmo tempo, arrastáveis pelo título, posição lembrada,
 *  a última clicada fica por cima. Não escurecem nem travam o jogo. */
const KEY = 'karmika.win.v1';
let pos: Record<string, { x: number; y: number; w?: number; h?: number }> = {};
try { pos = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { pos = {}; }
let zTop = 40;
export function bringFront(el: HTMLElement) { el.style.zIndex = String(++zTop); }
export function floatWin(el: HTMLElement, id: string, def: { left?: string; right?: string; top: string }) {
  el.classList.add('fw');
  const apply = () => {
    el.style.bottom = 'auto';
    const p = pos[id];
    if (p) { el.style.left = Math.max(0, Math.min(innerWidth - 120, p.x)) + 'px'; el.style.top = Math.max(0, Math.min(innerHeight - 60, p.y)) + 'px'; el.style.right = 'auto'; }
    else { el.style.left = def.left ?? 'auto'; el.style.right = def.right ?? 'auto'; el.style.top = def.top; if (!def.left) el.style.left = 'auto'; }
  };
  apply();
  /* nunca sai da tela (Erling, 25/10): a janela inteira fica dentro das bordas; se for alta demais, rola por dentro */
  const pnOf = () => el.querySelector(':scope > .pn') as HTMLElement | null;
  const fit = () => { if (el.style.display === 'none' || !el.offsetParent && getComputedStyle(el).position !== 'fixed') return; const pn = pnOf(); if (!pn) return; const z = parseFloat(getComputedStyle(pn).zoom || '1') || 1;
    let r = el.getBoundingClientRect(); if (!r.width) return; let L = r.left, T = r.top;
    if (r.width <= innerWidth) { if (L + r.width > innerWidth - 2) L = innerWidth - r.width - 2; if (L < 2) L = 2; } else L = 0;
    if (T < 2) T = 2; const maxH = innerHeight - T - 6; pn.style.maxHeight = Math.max(160, maxH) / z + 'px';
    r = el.getBoundingClientRect(); if (T + r.height > innerHeight - 4) T = Math.max(2, innerHeight - r.height - 4);
    if (Math.abs(L - r.left) > 0.5 || Math.abs(T - r.top) > 0.5) { el.style.left = L + 'px'; el.style.top = T + 'px'; el.style.right = 'auto'; } };
  const applySize = () => { const p = pos[id]; if (p?.w && p?.h) { el.classList.add('sized'); el.style.setProperty('--fw-w', p.w + 'px'); el.style.setProperty('--fw-h', p.h + 'px'); } };
  applySize(); addEventListener('resize', fit); { let q = 0; new ResizeObserver(() => { if (q) return; q = requestAnimationFrame(() => { q = 0; fit(); }); }).observe(el); } /* no quadro seguinte: sem o aviso "ResizeObserver loop" */
  /* alça de redimensionar no canto inferior direito */
  const grip = document.createElement('div'); grip.className = 'rz'; grip.title = 'Arraste para mudar o tamanho da janela (duplo clique: tamanho padrão)'; el.appendChild(grip);
  new MutationObserver(() => { if (grip.parentElement !== el || el.lastElementChild !== grip) el.appendChild(grip); }).observe(el, { childList: true });
  let rz: { x: number; y: number; w: number; h: number; z: number } | null = null;
  grip.addEventListener('pointerdown', (e) => { const pn = pnOf(); if (!pn) return; const z = parseFloat(getComputedStyle(pn).zoom || '1') || 1, r = pn.getBoundingClientRect(); rz = { x: e.clientX, y: e.clientY, w: r.width / z, h: r.height / z, z }; grip.setPointerCapture(e.pointerId); e.preventDefault(); e.stopPropagation(); bringFront(el); });
  grip.addEventListener('pointermove', (e) => { if (!rz) return; const r = el.getBoundingClientRect(); const w = Math.max(260, Math.min((innerWidth - r.left - 4) / rz.z, rz.w + (e.clientX - rz.x) / rz.z)), h = Math.max(180, Math.min((innerHeight - r.top - 6) / rz.z, rz.h + (e.clientY - rz.y) / rz.z));
    pos[id] = { ...(pos[id] ?? { x: r.left, y: r.top }), w: Math.round(w), h: Math.round(h) }; applySize(); });
  const rzEnd = () => { if (!rz) return; rz = null; try { localStorage.setItem(KEY, JSON.stringify(pos)); } catch { /* */ } fit(); };
  grip.addEventListener('pointerup', rzEnd); grip.addEventListener('pointercancel', rzEnd);
  grip.addEventListener('dblclick', (e) => { e.stopPropagation(); const p = pos[id]; if (p) { delete p.w; delete p.h; } el.classList.remove('sized'); el.style.removeProperty('--fw-w'); el.style.removeProperty('--fw-h'); try { localStorage.setItem(KEY, JSON.stringify(pos)); } catch { /* */ } fit(); });
  let drag: { dx: number; dy: number } | null = null;
  el.addEventListener('pointerdown', (e) => {
    bringFront(el);
    const t = e.target as HTMLElement; if (t.closest('.rz')) return; const h = t.closest('h2'); if (!h || t.closest('button,input,select')) return;
    const r = el.getBoundingClientRect(); drag = { dx: e.clientX - r.left, dy: e.clientY - r.top }; h.setPointerCapture(e.pointerId); e.preventDefault();
  });
  el.addEventListener('pointermove', (e) => {
    if (!drag) return; const x = e.clientX - drag.dx, y = e.clientY - drag.dy;
    el.style.left = Math.max(0, Math.min(innerWidth - 120, x)) + 'px'; el.style.top = Math.max(0, Math.min(innerHeight - 60, y)) + 'px'; el.style.right = 'auto'; fit();
  });
  const end = () => { if (!drag) return; drag = null; fit(); const r = el.getBoundingClientRect(); pos[id] = { ...pos[id], x: r.left, y: r.top }; try { localStorage.setItem(KEY, JSON.stringify(pos)); } catch { /* */ } };
  el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
  // ao abrir, vem para a frente
  let shown = false; new MutationObserver(() => { const vis = el.style.display !== 'none' && el.style.display !== ''; if (vis && !shown) { bringFront(el); requestAnimationFrame(fit); } shown = vis; }).observe(el, { attributes: true, attributeFilter: ['style'] });
}
/** confirmação dentro do jogo (sem a caixa do navegador) */
export function confirmBox(text: string, yes: string, onYes: () => void, o: { keep?: boolean; onNo?: () => void } = {}) {
  const d = document.createElement('div'); d.className = 'kconf';
  d.innerHTML = `<div class="pn"><p>${text}</p><div class="row"><button data-y>${yes}</button><button data-n>Cancelar</button></div></div>`;
  document.body.appendChild(d); bringFront(d);
  const close = () => { d.remove(); removeEventListener('keydown', key, true); };
  const no = () => { close(); o.onNo?.(); };
  const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); no(); } else if (e.key === 'Enter') { e.stopPropagation(); close(); onYes(); } };
  addEventListener('keydown', key, true);
  d.addEventListener('click', (e) => { const t = e.target as HTMLElement; if (t.closest('[data-y]')) { close(); onYes(); } else if (t.closest('[data-n]') || (t === d && !o.keep)) no(); }); /* keep: clicar fora (andando pelo mapa) não fecha um convite importante */
}
/** escolha de duas saídas (ex.: poupar ou matar um elite rendido) */
export function choiceBox(title: string, text: string, a: [string, () => void], b: [string, () => void]) {
  const d = document.createElement('div'); d.className = 'kconf kchoice';
  d.innerHTML = `<div class="pn"><h2>${title}</h2><p>${text}</p><div class="row"><button data-a>${a[0]}</button><button data-b>${b[0]}</button></div></div>`;
  document.body.appendChild(d); bringFront(d);
  d.addEventListener('click', (e) => { const t = e.target as HTMLElement; if (t.closest('[data-a]')) { d.remove(); a[1](); } else if (t.closest('[data-b]')) { d.remove(); b[1](); } });
}

/* ---------- TODAS as janelas se arrastam (Erling, 23/10) ----------
   Qualquer painel do jogo (.pn, o menu, o diálogo de NPC) se arrasta pelo título (h2) ou cabeçalho. As janelas que já usam
   floatWin continuam com o arrasto delas. O deslocamento vai na propriedade CSS `translate` do painel (não briga com as animações
   de `transform`) e é dividido pelo "Tamanho da interface", porque o painel tem zoom. Fica salvo por janela; duplo clique no título
   devolve ao lugar padrão. */
const FREE_KEY = 'karmika.win.free';
let free: Record<string, { x: number; y: number }> = {};
try { free = JSON.parse(localStorage.getItem(FREE_KEY) || '{}'); } catch { free = {}; }
const uiK = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ui')) || 1;
const SKIP = '#create, #inicio, #limiar, #soul, #chat, #dlg, .fw, #boot, #awaken, #bigmap'; // o mapa grande tem o próprio arrasto e o botão de maximizar
function keyOf(p: HTMLElement) { const host = p.id ? p : (p.parentElement?.closest('[id]') as HTMLElement | null); const h = p.querySelector('h2'); return (host?.id || 'win') + (p.id ? '' : ':' + (p.className.split(' ')[0] || 'pn')) + (host?.id ? '' : ':' + (h?.textContent || '').trim().slice(0, 18)); }
function zoomOf(p: HTMLElement) { const z = parseFloat(getComputedStyle(p).zoom || '1'); return z > 0 ? z : 1; }
function applyFree(p: HTMLElement, k: string) { const o = free[k]; const z = zoomOf(p) || uiK(); p.style.translate = o ? `${o.x / z}px ${o.y / z}px` : ''; }
export function dragAll() {
  let d: { p: HTMLElement; k: string; x: number; y: number; ox: number; oy: number } | null = null;
  addEventListener('pointerdown', (e) => {
    const t = e.target as HTMLElement; if (!t || t.closest('button, input, select, textarea, a, [data-drag], .rz, [draggable="true"]')) return;
    const head = t.closest('h2, .ph, .pn-head') as HTMLElement | null; if (!head) return;
    const p = head.closest('.pn, .panel') as HTMLElement | null; if (!p || p.closest(SKIP)) return;
    const k = keyOf(p), o = free[k] ?? { x: 0, y: 0 }; d = { p, k, x: e.clientX, y: e.clientY, ox: o.x, oy: o.y }; p.classList.add('dragging'); e.preventDefault();
    const host = p.closest('.modalw, .kconf, #menu, [id]') as HTMLElement | null; if (host) bringFront(host);
  }, true);
  addEventListener('pointermove', (e) => { if (!d) return; free[d.k] = { x: d.ox + e.clientX - d.x, y: d.oy + e.clientY - d.y }; applyFree(d.p, d.k); });
  let dragEnd = 0; addEventListener('click', (e) => { if (performance.now() - dragEnd < 250) { e.stopPropagation(); e.preventDefault(); } }, true); // soltar o arrasto não conta como clique (não fecha a janela)
  addEventListener('pointerup', () => { if (!d) return; const { p, k } = d; d = null; p.classList.remove('dragging'); dragEnd = performance.now();
    const r = p.getBoundingClientRect(), o = free[k]; if (o) { /* a janela inteira dentro da tela */ if (r.width <= innerWidth) { if (r.left < 0) o.x -= r.left; else if (r.right > innerWidth) o.x -= r.right - innerWidth; } if (r.height <= innerHeight) { if (r.top < 0) o.y -= r.top; else if (r.bottom > innerHeight) o.y -= r.bottom - innerHeight; } else if (r.top < 0) o.y -= r.top; applyFree(p, k); }
    try { localStorage.setItem(FREE_KEY, JSON.stringify(free)); } catch { /* */ } });
  addEventListener('dblclick', (e) => { const t = e.target as HTMLElement; const head = t?.closest('h2, .ph, .pn-head'); const p = head?.closest('.pn, .panel') as HTMLElement | null; if (!p || p.closest(SKIP)) return;
    const k = keyOf(p); delete free[k]; applyFree(p, k); try { localStorage.setItem(FREE_KEY, JSON.stringify(free)); } catch { /* */ } });
  /* janelas que reaparecem (ou são recriadas) voltam ao lugar salvo */
  setInterval(() => { for (const p of Array.from(document.querySelectorAll<HTMLElement>('.pn, #menu .panel'))) { if (p.closest(SKIP) || !p.offsetParent) continue; const k = keyOf(p); if (free[k] && !p.style.translate) applyFree(p, k); } }, 400);
}
/** 28/10 (Erling): toda compra tem retorno — o botão afunda e volta, sobe um brilho dourado de faíscas e moedas */
export function buyFx(target: Element | null, label = '') {
  if (!target) return; const r = target.getBoundingClientRect(); if (!r.width) return; const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  (target as HTMLElement).animate?.([{ transform: 'scale(1)' }, { transform: 'scale(.88)', filter: 'brightness(1.6)' }, { transform: 'scale(1.06)', filter: 'brightness(1.3)' }, { transform: 'scale(1)' }], { duration: 320, easing: 'ease-out' });
  const box = document.createElement('div'); box.className = 'buyfx'; box.style.left = cx + 'px'; box.style.top = cy + 'px'; document.body.appendChild(box);
  const ring = document.createElement('i'); ring.className = 'ring'; box.appendChild(ring);
  for (let k = 0; k < 12; k++) { const s = document.createElement('i'); s.className = k % 3 ? 'sp' : 'cn'; s.textContent = k % 3 ? '✦' : '🪙'; const a = (k / 12) * Math.PI * 2 + Math.random() * 0.4, d = 34 + Math.random() * 26;
    s.style.setProperty('--dx', Math.cos(a) * d + 'px'); s.style.setProperty('--dy', Math.sin(a) * d - 16 + 'px'); s.style.animationDelay = Math.random() * 60 + 'ms'; box.appendChild(s); }
  if (label) { const t = document.createElement('b'); t.textContent = label; box.appendChild(t); }
  setTimeout(() => box.remove(), 1000);
}
/* o último botão clicado: compras feitas longe do clique (leilão, estábulo, festa) brilham nele */
let lastHit: Element | null = null; addEventListener('pointerdown', (e) => { lastHit = (e.target as Element)?.closest?.('button,[data-buy],.it,.card') ?? (e.target as Element); }, true);
export function buyFxLast(label = '') { buyFx(lastHit, label); }
