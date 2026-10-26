/* Dicas de passar o mouse (Erling, 26/10: "o tooltip está muito pequeno e o meu texto do jogo está em 115%").
   A dica nativa do navegador (atributo title) não obedece ao Tamanho do texto nem à escala da interface: fica minúscula em telas grandes.
   Aqui todo `title` vira a nossa dica, no estilo do jogo, e acompanha os dois ajustes (a regra #tt entra no applyTextScale). */
export function installTitleTips() {
  const tt = document.createElement('div'); tt.id = 'tt'; document.body.appendChild(tt);
  let cur: HTMLElement | null = null;
  const place = (x: number, y: number) => { const w = tt.offsetWidth, h = tt.offsetHeight; tt.style.left = Math.max(6, Math.min(innerWidth - w - 6, x + 14)) + 'px'; tt.style.top = Math.max(6, y + 18 + h > innerHeight ? y - h - 10 : y + 18) + 'px'; };
  const hide = () => { cur = null; tt.style.display = 'none'; };
  document.addEventListener('mouseover', (e) => {
    const t = (e.target as Element | null)?.closest?.('[title],[data-tt]') as HTMLElement | null;
    if (!t || t instanceof SVGElement) { hide(); return; }
    if (t.hasAttribute('title')) { const v = t.getAttribute('title') || ''; t.removeAttribute('title'); if (v) t.dataset.tt = v; }
    const txt = t.dataset.tt; if (!txt || (e.target as HTMLElement).closest('[data-g]')) { hide(); return; } /* itens da mochila já têm a dica própria */
    cur = t; tt.textContent = txt; tt.style.display = 'block'; place(e.clientX, e.clientY);
  }, true);
  document.addEventListener('mousemove', (e) => { if (cur) { if (!cur.isConnected) { hide(); return; } place(e.clientX, e.clientY); } }, { passive: true });
  document.addEventListener('mousedown', hide, true); addEventListener('blur', hide);
}
