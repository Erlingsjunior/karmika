/* 11/11 (Erling: "as runas têm que brilhar aleatoriamente, não um lado inteiro e o outro lado inteiro, e sim uma de cada vez,
   igual o background da landing page").
   A moldura das janelas (index.html, "pele das janelas") desenha a coluna de runas como fundo repetido; aqui só acendemos UMA runa
   por vez, numa janela aberta sorteada, pondo um brilho por cima do lugar exato dela. O brilho some sozinho. Nada disso segura estado. */
const GLYPH = [
  "<path d='M4 14 L14 7 L24 14 L14 21 Z'/><path d='M14 11 L17 14 L14 17 L11 14Z' fill='%23ffe6a8'/>",
  "<path d='M8 36 H20 L14 48 L20 60 H8 L14 48 Z'/>",
  "<path d='M14 72 C18 78 19 83 14 86 C9 83 10 78 14 72Z'/>",
];
/* a peça que se repete tem 84 px de altura (viewBox de 96); cada runa é recortada numa janela de 32 de altura do mesmo desenho */
const TOP = [0, 32, 63], TILE = 84, K = TILE / 96, FIRST = 26, INSET = 8, X = 11;
const url = (i: number) => `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 ${TOP[i]} 28 32' fill='none' stroke='%23ffe6a8' stroke-width='1.6' stroke-linejoin='round'>${GLYPH[i]}</svg>")`;
const SEL = '.pn, #dlg .dp, #menu .panel';

export function startRunasMoldura() {
  const tick = () => {
    if (document.hidden) return;
    const open = Array.from(document.querySelectorAll<HTMLElement>(SEL)).filter((p) => p.offsetParent !== null && p.clientHeight > 150);
    if (!open.length) return;
    const p = open[(Math.random() * open.length) | 0], inner = p.clientHeight - INSET * 2 - FIRST, n = Math.floor((inner - 20) / (TILE / 3));
    if (n < 1) return;
    const k = (Math.random() * n) | 0, g = k % 3, y = INSET + FIRST + Math.floor(k / 3) * TILE + TOP[g] * K;
    const el = document.createElement('span'); el.className = 'wkglint'; el.style.backgroundImage = url(g);
    el.style.top = `calc(${y.toFixed(1)}px + var(--sy, 0px))`;
    if (Math.random() < 0.5) el.style.left = `calc(${X}px + var(--sx, 0px))`; else el.style.right = `calc(${X}px - var(--sx, 0px))`;
    p.appendChild(el); el.addEventListener('animationend', () => el.remove()); setTimeout(() => el.remove(), 3000);
  };
  setInterval(tick, 583);
}
