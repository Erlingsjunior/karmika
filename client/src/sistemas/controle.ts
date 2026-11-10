/* CONTROLE NO PC (10/11, Erling: "gatilho 1 segura + botões = magias, gatilho 2 segura + botões = magias, só o gatilho rápido = função").
   O controle aperta as teclas padrão do jogo (teclas.ts), então tudo que o teclado faz o controle faz igual.
   Alavanca esquerda anda; a direita mira (sem ela, a mira segue para onde o herói anda).
   LT segurado: A B X Y = magias 1 2 3 4 · RT segurado: A B X Y = magias 5 6 7 8 · LT + RT: A B X Y = magias 9 0 e ⇧1 ⇧2.
   Toque rápido no LT = modo de combate · toque rápido no RT = golpe (magia 1).
   Sem gatilho: A usar/falar · B dash · X golpe · Y montaria · LB/RB poções 1 e 2 · setas: mapa, mochila, missões, personagem. */
import { mandaTecla } from './teclas';
type Tk = { k: string; shift?: boolean };
const FACE: Record<string, Tk[]> = {
  '': [{ k: 'e' }, { k: ' ' }, { k: '1' }, { k: 'z' }],
  L: [{ k: '1' }, { k: '2' }, { k: '3' }, { k: '4' }],
  R: [{ k: '5' }, { k: '6' }, { k: '7' }, { k: '8' }],
  LR: [{ k: '9' }, { k: '0' }, { k: '1', shift: true }, { k: '2', shift: true }],
};
/* botões fora A B X Y (índices do padrão dos navegadores): 4 LB · 5 RB · 8 voltar · 9 start · 10 L3 · 11 R3 · 12-15 setas */
const OUTROS: Record<number, Tk> = { 4: { k: 'F1' }, 5: { k: 'F2' }, 8: { k: 'k' }, 9: { k: 'Escape' }, 10: { k: 'r' }, 11: { k: 'f' }, 12: { k: 'm' }, 13: { k: 'c' }, 14: { k: 'i' }, 15: { k: 'j' } };
export const CONTROLE_AJUDA: [string, string][] = [
  ['Alavanca esquerda', 'andar'], ['Alavanca direita', 'mirar'],
  ['A · B · X · Y', 'usar/falar · dash · golpe · montaria'],
  ['LT segurado + A B X Y', 'magias 1 · 2 · 3 · 4'], ['RT segurado + A B X Y', 'magias 5 · 6 · 7 · 8'], ['LT + RT + A B X Y', 'magias 9 · 0 · ⇧1 · ⇧2'],
  ['Toque rápido no LT', 'modo de combate'], ['Toque rápido no RT', 'golpe (magia 1)'],
  ['LB · RB', 'poções 1 e 2'], ['Setas ↑ ↓ ← →', 'mapa · personagem · mochila · missões'],
  ['Start · Voltar', 'menu · magias'], ['Apertar as alavancas', 'correr/andar · instinto'],
];
let nome = '';
export const controleNome = () => nome;
const held = new Map<number, Tk>(), dirs = { w: false, a: false, s: false, d: false };
const prev: boolean[] = []; let ltT = 0, rtT = 0, ltUsed = false, rtUsed = false, ltWas = false, rtWas = false, aimX = 0, aimY = -1, lastAim = 0;
const solta = (i: number) => { const h = held.get(i); if (h) { mandaTecla('keyup', h.k, { shiftKey: h.shift }); held.delete(i); } };
const aperta = (i: number, t: Tk) => { solta(i); held.set(i, t); mandaTecla('keydown', t.k, { shiftKey: t.shift }); };
function dir(k: 'w' | 'a' | 's' | 'd', on: boolean) { if (dirs[k] === on) return; dirs[k] = on; mandaTecla(on ? 'keydown' : 'keyup', k); }
function soltaTudo() { for (const i of [...held.keys()]) solta(i); dir('w', false); dir('a', false); dir('s', false); dir('d', false); prev.length = 0; ltWas = rtWas = false; }
let hint: HTMLElement | null = null;
function mostra(mod: string) {
  if (!hint) { hint = document.createElement('div'); hint.id = 'padhint'; hint.style.cssText = 'position:fixed;left:50%;bottom:132px;transform:translateX(-50%);z-index:30;pointer-events:none;background:rgba(18,14,10,.82);border:1px solid #6b5a3a;border-radius:6px;padding:4px 10px;color:#f0e2c0;font:12px/1.4 monospace;white-space:nowrap'; document.body.appendChild(hint); }
  if (!mod) { hint.hidden = true; return; }
  const f = FACE[mod]; hint.hidden = false; hint.textContent = ['A', 'B', 'X', 'Y'].map((b, i) => `${b} = ${f[i].shift ? '⇧' : ''}${f[i].k}`).join('   ');
}
function tick() {
  requestAnimationFrame(tick);
  let gp: Gamepad | null = null; try { for (const g of navigator.getGamepads?.() ?? []) if (g && g.connected && g.mapping === 'standard') { gp = g; break; } } catch { /* */ }
  if (!gp) { if (nome) { nome = ''; soltaTudo(); mostra(''); } return; }
  if (!nome) { nome = gp.id.replace(/\s*\(.*\)\s*$/, '').slice(0, 40) || 'Controle'; dispatchEvent(new CustomEvent('karmika:controle', { detail: nome })); }
  if (!document.hasFocus()) { soltaTudo(); return; }
  const ae = document.activeElement as HTMLElement | null; if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA')) { soltaTudo(); return; }
  const now = performance.now(), b = (i: number) => !!gp!.buttons[i] && (gp!.buttons[i].pressed || gp!.buttons[i].value > 0.35);
  /* andar */
  const lx = gp.axes[0] ?? 0, ly = gp.axes[1] ?? 0, lm = Math.hypot(lx, ly);
  { const on = lm > 0.35, ux = on ? lx / lm : 0, uy = on ? ly / lm : 0; dir('a', ux < -0.38); dir('d', ux > 0.38); dir('w', uy < -0.38); dir('s', uy > 0.38); }
  /* mirar: a alavanca direita manda; sem ela, a mira vai para onde o herói anda */
  const rx = gp.axes[2] ?? 0, ry = gp.axes[3] ?? 0, rm = Math.hypot(rx, ry);
  let moved = false; if (rm > 0.3) { aimX = rx / rm; aimY = ry / rm; moved = true; } else if (lm > 0.35) { aimX = lx / lm; aimY = ly / lm; moved = true; }
  if (moved && now - lastAim > 33) { lastAim = now; const R = Math.min(innerWidth, innerHeight) * 0.3; (document.querySelector('canvas') ?? window).dispatchEvent(new PointerEvent('pointermove', { clientX: innerWidth / 2 + aimX * R, clientY: innerHeight / 2 + aimY * R * 0.8, bubbles: true })); }
  /* gatilhos */
  const lt = b(6), rt = b(7), mod = (lt ? 'L' : '') + (rt ? 'R' : '');
  if (lt && !ltWas) { ltT = now; ltUsed = false; } if (rt && !rtWas) { rtT = now; rtUsed = false; }
  if (lt && rt) { ltUsed = rtUsed = true; }
  if (!lt && ltWas && !ltUsed && now - ltT < 280) { mandaTecla('keydown', 'Tab'); mandaTecla('keyup', 'Tab'); }
  if (!rt && rtWas && !rtUsed && now - rtT < 280) { mandaTecla('keydown', '1'); setTimeout(() => mandaTecla('keyup', '1'), 60); }
  ltWas = lt; rtWas = rt; mostra(mod);
  /* A B X Y */
  for (let i = 0; i < 4; i++) { const p = b(i); if (p && !prev[i]) { if (lt) ltUsed = true; if (rt) rtUsed = true; aperta(i, FACE[mod][i]); } else if (!p && prev[i]) solta(i); prev[i] = p; }
  for (const i of [4, 5, 8, 9, 10, 11, 12, 13, 14, 15]) { const p = b(i); if (p && !prev[i]) aperta(i, OUTROS[i]); else if (!p && prev[i]) solta(i); prev[i] = p; }
}
requestAnimationFrame(tick);
addEventListener('blur', soltaTudo);
