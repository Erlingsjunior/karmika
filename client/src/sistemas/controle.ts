/* CONTROLE NO PC (10/11, Erling: "gatilho 1 segura + botões = magias, gatilho 2 segura + botões = magias, só o gatilho rápido = função").
   13/11 (Erling: "vamos usar a ideia do Tree of Savior... mapear todas as funções"; aprovou as três mudanças): o mapa completo.
   O controle aperta as teclas padrão do jogo (teclas.ts), então tudo que o teclado faz o controle faz igual.
   Alavanca esquerda anda; a direita mira ou troca de alvo.
   MAGIAS (20): segurar LT, RT, LB ou RB troca A B X Y por quatro magias cada; LT + RT juntos dão as últimas quatro.
     LT = 1 2 3 4 · RT = 5 6 7 8 · LB = 9 0 ⇧1 ⇧2 · RB = ⇧3 ⇧4 ⇧5 ⇧6 · LT+RT = ⇧7 ⇧8 ⇧9 ⇧0
   ITENS RÁPIDOS (8): setas = F1 F2 F3 F4; com LB + RB segurados, F5 F6 F7 F8.
   JANELAS: Start abre a RODA (mapa, mochila, personagem, missões, magias, feitos, ofícios, loja, compêndio, estábulo, construir, menu).
   ALVO AUTOMÁTICO: o herói mira sozinho no inimigo mais perto na direção em que anda; a alavanca direita troca de alvo.
   Sem segurar nada: A usar/falar · B dash · X golpe · Y montaria. Toque rápido no LT = modo de combate.
   Apertar a alavanca esquerda = correr/andar; a direita = instinto (segurar = trocar postura). Voltar/Select = ponteiro. */
import { mandaTecla } from './teclas';
type Tk = { k: string; shift?: boolean };
const S = (k: string): Tk => ({ k, shift: true });
const FACE: Record<string, Tk[]> = {
  '': [{ k: 'e' }, { k: ' ' }, { k: '1' }, { k: 'z' }],
  L: [{ k: '1' }, { k: '2' }, { k: '3' }, { k: '4' }],
  R: [{ k: '5' }, { k: '6' }, { k: '7' }, { k: '8' }],
  LB: [{ k: '9' }, { k: '0' }, S('1'), S('2')],
  RB: [S('3'), S('4'), S('5'), S('6')],
  LR: [S('7'), S('8'), S('9'), S('0')],
};
/* setas (12 cima · 13 baixo · 14 esquerda · 15 direita): itens rápidos; com LB + RB, os outros quatro */
const SETAS: Record<number, [string, string]> = { 12: ['F1', 'F5'], 13: ['F2', 'F6'], 14: ['F3', 'F7'], 15: ['F4', 'F8'] };
/** a roda do Start: doze entradas, a primeira em cima, no sentido do relógio */
const RODA: [string, string, string][] = [['Mapa', '🗺', 'm'], ['Mochila', '🎒', 'i'], ['Personagem', '🧍', 'c'], ['Missões', '📜', 'j'], ['Magias', '✨', 'k'], ['Feitos', '🏅', 'l'], ['Menu', '⚙', 'Escape'], ['Ofícios', '🔨', 'y'], ['Loja', '🛒', 't'], ['Compêndio', '📖', 'u'], ['Estábulo', '🐴', 'x'], ['Construir', '🧱', 'b']];
export const CONTROLE_AJUDA: [string, string][] = [
  ['Alavanca esquerda', 'andar'], ['Alavanca direita', 'mirar · com alvo automático, troca de alvo'],
  ['A · B · X · Y', 'usar/falar · dash · golpe · montaria'],
  ['LT segurado + A B X Y', 'magias 1 · 2 · 3 · 4'], ['RT segurado + A B X Y', 'magias 5 · 6 · 7 · 8'], ['LB segurado + A B X Y', 'magias 9 · 0 · ⇧1 · ⇧2'], ['RB segurado + A B X Y', 'magias ⇧3 · ⇧4 · ⇧5 · ⇧6'], ['LT + RT + A B X Y', 'magias ⇧7 · ⇧8 · ⇧9 · ⇧0'],
  ['Toque rápido no LT', 'modo de combate'], ['Toque rápido no RT', 'golpe (magia 1)'],
  ['Setas ↑ ↓ ← →', 'itens rápidos 1 · 2 · 3 · 4'], ['LB + RB + setas', 'itens rápidos 5 · 6 · 7 · 8'],
  ['Start', 'roda das janelas: a alavanca escolhe, A abre, B fecha'],
  ['Voltar (Select)', 'liga e desliga o ponteiro, para usar janelas e menus'],
  ['No ponteiro', 'alavanca esquerda move · A clica · X botão direito · B fecha · alavanca direita rola a lista · setas dão passos curtos'],
  ['Apertar a alavanca esquerda', 'correr / andar'], ['Apertar a alavanca direita', 'instinto · segurar troca a postura'],
];
/* ALVO AUTOMÁTICO: o jogo entrega os inimigos por perto já em pontos da tela (main.ts); o controle escolhe um e aponta a mira para ele */
export interface PadAlvo { id: number; x: number; y: number; d: number }
let fonteAlvos: (() => PadAlvo[]) | null = null;
export function controleAlvos(f: () => PadAlvo[]) { fonteAlvos = f; }
let auto = true; try { auto = localStorage.getItem('karmika.pad.auto') !== '0'; } catch { /* */ }
export const autoAlvo = () => auto;
export function setAutoAlvo(on: boolean) { auto = on; try { localStorage.setItem('karmika.pad.auto', on ? '1' : '0'); } catch { /* */ } if (!on) { trava = -1; marca(null); } }
let trava = -1, marcaEl: HTMLElement | null = null, stickWas = false;
function marca(a: PadAlvo | null) { if (!marcaEl) { if (!a) return; marcaEl = document.createElement('div'); marcaEl.id = 'padalvo'; marcaEl.style.cssText = 'position:fixed;left:0;top:0;z-index:29;pointer-events:none;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;border:2px solid #ffd24a;box-shadow:0 0 12px #ffb020,inset 0 0 8px rgba(255,176,32,.6);will-change:transform'; document.body.appendChild(marcaEl); }
  marcaEl.hidden = !a; if (a) marcaEl.style.transform = `translate(${a.x.toFixed(0)}px, ${a.y.toFixed(0)}px)`; }
/** escolhe o alvo: na direção (dx, dy) da tela, o mais perto vale mais */
function escolhe(L: PadAlvo[], dx: number, dy: number, cone: number): PadAlvo | null { const cx = innerWidth / 2, cy = innerHeight / 2; let best: PadAlvo | null = null, bs = 1e9;
  for (const a of L) { const vx = a.x - cx, vy = a.y - cy, m = Math.hypot(vx, vy) || 1, dot = (vx * dx + vy * dy) / m; if (dot < cone) continue; const sc = a.d * (1.7 - dot); if (sc < bs) { bs = sc; best = a; } } return best; }
/* A RODA */
let roda: HTMLElement | null = null, rodaOn = false, rodaSel = -1;
function rodaShow(on: boolean) { if (on === rodaOn) return; rodaOn = on; prime = true;
  if (!roda) { roda = document.createElement('div'); roda.id = 'padroda'; roda.style.cssText = 'position:fixed;inset:0;z-index:2147482000;display:grid;place-items:center;background:radial-gradient(circle,rgba(8,6,4,.72),rgba(8,6,4,.35) 60%,transparent 78%);pointer-events:none';
    const R = 190; roda.innerHTML = `<div style="position:relative;width:${R * 2 + 120}px;height:${R * 2 + 120}px">` + RODA.map(([n, ic], i) => { const a = i / RODA.length * Math.PI * 2 - Math.PI / 2; return `<div data-i="${i}" style="position:absolute;left:50%;top:50%;width:96px;height:78px;margin:-39px 0 0 -48px;transform:translate(${(Math.cos(a) * R).toFixed(0)}px,${(Math.sin(a) * R).toFixed(0)}px);display:grid;place-items:center;border-radius:14px;border:1px solid rgba(201,162,74,.45);background:rgba(18,14,10,.9);color:#f0e2c0;font:600 12px/1.2 Cinzel,serif;text-align:center;transition:all .12s"><span style="font-size:26px;line-height:1">${ic}</span>${n}</div>`; }).join('') + '<div id="padrodac" style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);text-align:center;color:#f2cf8a;font:700 20px Cinzel,serif;text-shadow:0 2px 8px #000"></div></div>'; document.body.appendChild(roda); }
  roda.hidden = !on; if (on) { soltaTudo(); mostra(''); marca(null); rodaSel = -1; rodaPinta(); } }
function rodaPinta() { if (!roda) return; roda.querySelectorAll<HTMLElement>('[data-i]').forEach((e, i) => { const on = i === rodaSel; e.style.borderColor = on ? '#ffd24a' : 'rgba(201,162,74,.45)'; e.style.background = on ? 'rgba(90,62,18,.96)' : 'rgba(18,14,10,.9)'; e.style.boxShadow = on ? '0 0 22px rgba(255,190,80,.8)' : 'none'; e.style.scale = on ? '1.18' : '1'; });
  roda.querySelector('#padrodac')!.innerHTML = rodaSel < 0 ? 'Janelas<br><small style="font:400 12px sans-serif;color:#cdbf9c">alavanca escolhe · A abre · B fecha</small>' : RODA[rodaSel][0]; }
function rodaTick(gp: Gamepad, b: (i: number) => boolean) {
  if (prime) { prime = false; for (let i = 0; i < 16; i++) prev[i] = b(i); }
  const lx = gp.axes[0] ?? 0, ly = gp.axes[1] ?? 0, lm = Math.hypot(lx, ly), rx = gp.axes[2] ?? 0, ry = gp.axes[3] ?? 0, rm = Math.hypot(rx, ry), x = lm >= rm ? lx : rx, y = lm >= rm ? ly : ry;
  if (Math.max(lm, rm) > 0.5) { const a = Math.atan2(y, x) + Math.PI / 2, n = RODA.length, i = ((Math.round(a / (Math.PI * 2) * n) % n) + n) % n; if (i !== rodaSel) { rodaSel = i; rodaPinta(); } }
  for (const [i, d] of [[14, -1], [15, 1], [12, -1], [13, 1]] as [number, number][]) { const p = b(i); if (p && !prev[i]) { rodaSel = ((Math.max(0, rodaSel) + d) % RODA.length + RODA.length) % RODA.length; rodaPinta(); } prev[i] = p; }
  const a = b(0); if (a && !prev[0] && rodaSel >= 0) { const k = RODA[rodaSel][2]; rodaShow(false); mandaTecla('keydown', k); mandaTecla('keyup', k); prev[0] = true; return; } prev[0] = a;
  for (const i of [1, 9]) { const p = b(i); if (p && !prev[i]) { rodaShow(false); prev[i] = true; return; } prev[i] = p; }
}
let nome = '';
export const controleNome = () => nome;
const held = new Map<number, Tk>(), dirs = { w: false, a: false, s: false, d: false };
const prev: boolean[] = []; let ltT = 0, rtT = 0, ltUsed = false, rtUsed = false, ltWas = false, rtWas = false, aimX = 0, aimY = -1, lastAim = 0;
const solta = (i: number) => { const h = held.get(i); if (h) { mandaTecla('keyup', h.k, { shiftKey: h.shift }); held.delete(i); } };
const aperta = (i: number, t: Tk) => { solta(i); held.set(i, t); mandaTecla('keydown', t.k, { shiftKey: t.shift }); };
function dir(k: 'w' | 'a' | 's' | 'd', on: boolean) { if (dirs[k] === on) return; dirs[k] = on; mandaTecla(on ? 'keydown' : 'keyup', k); }
function soltaTudo() { for (const i of [...held.keys()]) solta(i); dir('w', false); dir('a', false); dir('s', false); dir('d', false); prev.length = 0; ltWas = rtWas = false; }
/* 11/11 (Erling: "controle nos menus"): O PONTEIRO. Com janela, menu ou tela de início abertos (ou apertando Voltar/Select), a alavanca esquerda
   move um ponteiro na tela; A clica onde ele está, X dá o botão direito, B fecha (Esc), a alavanca direita rola a lista debaixo dele.
   Enquanto o ponteiro está ligado o herói não anda e as magias não saem. */
let ptr: HTMLElement | null = null, ptrOn = false, ptrManual = false, px = 0, py = 0, ptrHover = 0, ptrDown: Element | null = null;
const uiAberta = () => { const m = document.getElementById('menu'), i = document.getElementById('inicio'); return !!(m && m.classList.contains('open')) || !!(i && i.style.display !== 'none' && getComputedStyle(i).display !== 'none') || !!document.querySelector('.kconf') || !!document.getElementById('create') && document.getElementById('create')!.style.display === 'grid'; };
let prime = false; /* ao trocar de modo, os botões que já estavam apertados não contam como aperto novo (o Start que abriu o menu não pode fechá-lo no quadro seguinte) */
function ptrShow(on: boolean) { if (on === ptrOn) return; ptrOn = on; prime = true;
  if (!ptr) { ptr = document.createElement('div'); ptr.id = 'padptr'; ptr.style.cssText = 'position:fixed;left:0;top:0;z-index:2147483000;pointer-events:none;width:26px;height:26px;margin:-3px 0 0 -3px;will-change:transform';
    ptr.innerHTML = '<svg viewBox="0 0 26 26" width="26" height="26"><path d="M3 2l17 8-7 2.6L10.4 20z" fill="#ffe08a" stroke="#1a1208" stroke-width="1.6" stroke-linejoin="round"/></svg>'; document.body.appendChild(ptr); px = innerWidth / 2; py = innerHeight / 2; }
  ptr.hidden = !on; if (on) { soltaTudo(); mostra(''); px = Math.max(8, Math.min(innerWidth - 8, px)); py = Math.max(8, Math.min(innerHeight - 8, py)); } }
const alvo = () => document.elementFromPoint(px, py);
function mouse(type: string, el: Element | null, button = 0) { if (!el) return; const init = { clientX: px, clientY: py, bubbles: true, cancelable: true, button, buttons: type.endsWith('down') ? 1 : 0, view: window };
  el.dispatchEvent(type.startsWith('pointer') ? new PointerEvent(type, { ...init, pointerId: 1, pointerType: 'mouse', isPrimary: true }) : new MouseEvent(type, init)); }
function ptrTick(gp: Gamepad, dt: number, b: (i: number) => boolean) {
  if (prime) { prime = false; for (let i = 0; i < 16; i++) prev[i] = b(i); }
  const lx = gp.axes[0] ?? 0, ly = gp.axes[1] ?? 0, lm = Math.hypot(lx, ly); if (lm > 0.18) { const sp = 1250 * lm * lm * dt; px = Math.max(2, Math.min(innerWidth - 2, px + lx / lm * sp)); py = Math.max(2, Math.min(innerHeight - 2, py + ly / lm * sp)); }
  for (const [i, dx, dy] of [[12, 0, -1], [13, 0, 1], [14, -1, 0], [15, 1, 0]] as [number, number, number][]) { const p = b(i); if (p && !prev[i]) { px = Math.max(2, Math.min(innerWidth - 2, px + dx * 36)); py = Math.max(2, Math.min(innerHeight - 2, py + dy * 36)); } prev[i] = p; }
  ptr!.style.transform = `translate(${px.toFixed(0)}px, ${py.toFixed(0)}px)`;
  const now = performance.now(); if (now - ptrHover > 40) { ptrHover = now; const el = alvo(); mouse('pointermove', el); mouse('mousemove', el); if (el !== ptrDown && !b(0)) { mouse('mouseover', el); } }
  const ry = gp.axes[3] ?? 0; if (Math.abs(ry) > 0.25) { let el = alvo() as HTMLElement | null; while (el && !(el.scrollHeight > el.clientHeight + 4 && /auto|scroll/.test(getComputedStyle(el).overflowY))) el = el.parentElement; if (el) el.scrollTop += ry * 900 * dt; else alvo()?.dispatchEvent(new WheelEvent('wheel', { deltaY: ry * 60, clientX: px, clientY: py, bubbles: true, cancelable: true })); }
  const a = b(0); if (a && !prev[0]) { ptrDown = alvo(); mouse('pointerdown', ptrDown); mouse('mousedown', ptrDown); (ptrDown as HTMLElement | null)?.focus?.(); }
  else if (!a && prev[0]) { const up = alvo(); mouse('pointerup', up); mouse('mouseup', up); if (up && up === ptrDown) (up as HTMLElement).click ? (up as HTMLElement).click() : mouse('click', up); ptrDown = null; } prev[0] = a;
  const x = b(2); if (x && !prev[2]) { const el = alvo(); mouse('pointerdown', el, 2); mouse('mousedown', el, 2); mouse('pointerup', el, 2); mouse('mouseup', el, 2); mouse('contextmenu', el, 2); } prev[2] = x;
  const bb = b(1); if (bb && !prev[1]) { mandaTecla('keydown', 'Escape'); mandaTecla('keyup', 'Escape'); if (ptrManual && !uiAberta()) { ptrManual = false; } } prev[1] = bb;
  const stt = b(9); if (stt && !prev[9]) { mandaTecla('keydown', 'Escape'); mandaTecla('keyup', 'Escape'); } prev[9] = stt;
}
let ptrLast = 0;
let hint: HTMLElement | null = null;
function mostra(mod: string) {
  if (!hint) { hint = document.createElement('div'); hint.id = 'padhint'; hint.style.cssText = 'position:fixed;left:50%;bottom:132px;transform:translateX(-50%);z-index:30;pointer-events:none;background:rgba(18,14,10,.82);border:1px solid #6b5a3a;border-radius:6px;padding:4px 10px;color:#f0e2c0;font:12px/1.4 monospace;white-space:nowrap'; document.body.appendChild(hint); }
  if (!mod) { hint.hidden = true; return; }
  hint.hidden = false; if (mod === 'IT') { hint.textContent = '↑ = F5   ↓ = F6   ← = F7   → = F8'; return; }
  const f = FACE[mod]; hint.textContent = ['A', 'B', 'X', 'Y'].map((b, i) => `${b} = ${f[i].shift ? '⇧' : ''}${f[i].k}`).join('   ');
}
function tick() {
  requestAnimationFrame(tick);
  let gp: Gamepad | null = null; try { for (const g of navigator.getGamepads?.() ?? []) if (g && g.connected && g.mapping === 'standard') { gp = g; break; } } catch { /* */ }
  if (!gp) { if (nome) { nome = ''; soltaTudo(); mostra(''); marca(null); rodaShow(false); ptrManual = false; ptrShow(false); } return; }
  if (!nome) { nome = gp.id.replace(/\s*\(.*\)\s*$/, '').slice(0, 40) || 'Controle'; dispatchEvent(new CustomEvent('karmika:controle', { detail: nome })); }
  if (!document.hasFocus()) { soltaTudo(); return; }
  const ae = document.activeElement as HTMLElement | null; if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA')) { soltaTudo(); return; }
  const now = performance.now(), b = (i: number) => !!gp!.buttons[i] && (gp!.buttons[i].pressed || gp!.buttons[i].value > 0.35);
  /* ponteiro: Voltar/Select liga e desliga; janela aberta liga sozinho */
  { const sel = b(8); if (sel && !prev[8]) ptrManual = !ptrManual; prev[8] = sel; const want = ptrManual || uiAberta(); if (want !== ptrOn) ptrShow(want);
    const dtp = Math.min(0.05, (now - ptrLast) / 1000); ptrLast = now; if (ptrOn) { if (rodaOn) rodaShow(false); marca(null); ptrTick(gp, dtp, b); return; }
    if (rodaOn) { rodaTick(gp, b); return; }
    if (prime) { prime = false; for (let i = 0; i < 16; i++) prev[i] = b(i); ltWas = b(6); rtWas = b(7); ltUsed = rtUsed = true; return; } }
  /* andar */
  const lx = gp.axes[0] ?? 0, ly = gp.axes[1] ?? 0, lm = Math.hypot(lx, ly);
  { const on = lm > 0.35, ux = on ? lx / lm : 0, uy = on ? ly / lm : 0; dir('a', ux < -0.38); dir('d', ux > 0.38); dir('w', uy < -0.38); dir('s', uy > 0.38); }
  /* mirar: a alavanca direita manda; sem ela, a mira vai para onde o herói anda */
  const rx = gp.axes[2] ?? 0, ry = gp.axes[3] ?? 0, rm = Math.hypot(rx, ry);
  let moved = false; if (rm > 0.3) { aimX = rx / rm; aimY = ry / rm; moved = true; } else if (lm > 0.35) { aimX = lx / lm; aimY = ly / lm; moved = true; }
  /* alvo automático: mantém o alvo travado enquanto ele estiver por perto; a alavanca direita escolhe outro na direção dela; sem alvo, pega o mais perto na direção em que o herói anda */
  let alvoA: PadAlvo | null = null;
  if (auto && fonteAlvos) { const L = fonteAlvos(); if (L.length) { const stick = rm > 0.55; if (stick && !stickWas) { const n = escolhe(L.filter((a) => a.id !== trava), rx / rm, ry / rm, 0.2) ?? escolhe(L, rx / rm, ry / rm, 0.2); if (n) trava = n.id; } stickWas = stick;
      alvoA = L.find((a) => a.id === trava) ?? null; if (!alvoA) { alvoA = escolhe(L, aimX, aimY, -0.2) ?? escolhe(L, aimX, aimY, -2); trava = alvoA ? alvoA.id : -1; } } else { trava = -1; stickWas = false; } }
  marca(alvoA);
  if (alvoA) { if (now - lastAim > 33) { lastAim = now; (document.querySelector('canvas') ?? window).dispatchEvent(new PointerEvent('pointermove', { clientX: alvoA.x, clientY: alvoA.y, bubbles: true })); } }
  else if (moved && now - lastAim > 33) { lastAim = now; const R = Math.min(innerWidth, innerHeight) * 0.3; (document.querySelector('canvas') ?? window).dispatchEvent(new PointerEvent('pointermove', { clientX: innerWidth / 2 + aimX * R, clientY: innerHeight / 2 + aimY * R * 0.8, bubbles: true })); }
  /* gatilhos */
  const lt = b(6), rt = b(7), lb = b(4), rb = b(5), itens = lb && rb && !lt && !rt, mod = lt && rt ? 'LR' : lt ? 'L' : rt ? 'R' : itens ? '' : lb ? 'LB' : rb ? 'RB' : '';
  if (lt && !ltWas) { ltT = now; ltUsed = false; } if (rt && !rtWas) { rtT = now; rtUsed = false; }
  if (lt && rt) { ltUsed = rtUsed = true; }
  if (!lt && ltWas && !ltUsed && now - ltT < 280) { mandaTecla('keydown', 'Tab'); mandaTecla('keyup', 'Tab'); }
  if (!rt && rtWas && !rtUsed && now - rtT < 280) { mandaTecla('keydown', '1'); setTimeout(() => mandaTecla('keyup', '1'), 60); }
  ltWas = lt; rtWas = rt; mostra(itens ? 'IT' : mod);
  /* A B X Y */
  for (let i = 0; i < 4; i++) { const p = b(i); if (p && !prev[i]) { if (lt) ltUsed = true; if (rt) rtUsed = true; aperta(i, FACE[mod][i]); } else if (!p && prev[i]) solta(i); prev[i] = p; }
  /* setas: itens rápidos */
  for (const i of [12, 13, 14, 15]) { const p = b(i); if (p && !prev[i]) aperta(i, { k: SETAS[i][itens ? 1 : 0] }); else if (!p && prev[i]) solta(i); prev[i] = p; }
  /* Start: a roda das janelas */
  { const p = b(9); if (p && !prev[9]) { prev[9] = true; rodaShow(true); return; } prev[9] = p; }
  /* alavancas apertadas: esquerda corre/anda; direita instinto (toque) ou postura (segurar) */
  { const p = b(10); if (p && !prev[10]) aperta(10, { k: 'r' }); else if (!p && prev[10]) solta(10); prev[10] = p; }
  { const p = b(11); if (p && !prev[11]) { r3T = now; r3Long = false; } else if (p && !r3Long && now - r3T > 380) { r3Long = true; mandaTecla('keydown', 'v'); mandaTecla('keyup', 'v'); } else if (!p && prev[11] && !r3Long) { mandaTecla('keydown', 'f'); mandaTecla('keyup', 'f'); } prev[11] = p; }
}
let r3T = 0, r3Long = false;
requestAnimationFrame(tick);
addEventListener('blur', soltaTudo);
