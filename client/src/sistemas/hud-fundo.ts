/* O FUNDO DO HUD ATÉ AS PONTAS (17/11, Erling: "integrar mais a barra de menu ao jogo, levando esse fundo escuro até as pontas, cobrindo os
   botões; não quero linhas retas na descida, quero algo fluido que esmaece com transparência, mas continuando a moldura de engrenagem").
   Duas asas desenhadas atrás do HUD: saem baixas da ponta da tela, correm por trás do menu e das bolsas e sobem numa curva até a linha
   dourada da barra, atrás dos orbes. A borda de cima leva a linha dourada e os dentes de engrenagem; tudo esmaece para as pontas. */
const NS = 'http://www.w3.org/2000/svg';
export function ligaHudFundo() {
  const svg = document.createElementNS(NS, 'svg'); svg.id = 'hudfundo'; svg.setAttribute('aria-hidden', 'true'); document.body.appendChild(svg);
  let chave = '';
  function desenha() { const painel = document.getElementById('panel'), hp = document.getElementById('hp'), mp = document.getElementById('mp'); if (!painel || !hp || !mp) return;
    const p = painel.getBoundingClientRect(), a = hp.getBoundingClientRect(), b = mp.getBoundingClientRect(); if (!p.width || !a.width) { svg.style.display = 'none'; chave = ''; return; }
    const W = innerWidth, folga = 30, H = Math.round(innerHeight - p.top + folga), k = [W, H, Math.round(a.left), Math.round(b.right)].join(); if (k === chave) return; chave = k;
    svg.style.display = 'block'; svg.setAttribute('width', String(W)); svg.setAttribute('height', String(H)); svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const yT = folga + 1.5, yB = H - 56, xa = a.left + a.width / 2, xb = b.left + b.width / 2, la = a.left, rb = b.right;
    /* a borda de cima de cada asa: baixa na ponta, um trecho quase reto por trás dos botões e a subida em S até a linha da barra */
    const esq = `M0,${yB + 12} C${la * 0.45},${yB + 12} ${la - 210},${yB + 6} ${la - 130},${yB - 8} C${la - 60},${yB - 22} ${la - 46},${yT + 4} ${la + 26},${yT} L${xa},${yT}`;
    const dir = `M${W},${yB + 12} C${W - (W - rb) * 0.45},${yB + 12} ${rb + 210},${yB + 6} ${rb + 130},${yB - 8} C${rb + 60},${yB - 22} ${rb + 46},${yT + 4} ${rb - 26},${yT} L${xb},${yT}`;
    svg.innerHTML = `<defs>
      <linearGradient id="hfv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1e12" stop-opacity=".82"/><stop offset=".35" stop-color="#150e08" stop-opacity=".9"/><stop offset="1" stop-color="#0c0805" stop-opacity=".96"/></linearGradient>
      <linearGradient id="hfe" gradientUnits="userSpaceOnUse" x1="0" x2="${la}" y1="0" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".3" stop-color="#fff" stop-opacity=".85"/><stop offset="1" stop-color="#fff"/></linearGradient>
      <linearGradient id="hfd" gradientUnits="userSpaceOnUse" x1="${W}" x2="${rb}" y1="0" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".3" stop-color="#fff" stop-opacity=".85"/><stop offset="1" stop-color="#fff"/></linearGradient>
      <mask id="hme"><rect x="0" y="0" width="${xa}" height="${H}" fill="url(#hfe)"/></mask><mask id="hmd"><rect x="${xb}" y="0" width="${W - xb}" height="${H}" fill="url(#hfd)"/></mask>
      <filter id="hfb" x="-5%" y="-40%" width="110%" height="180%"><feGaussianBlur stdDeviation="7"/></filter>
    </defs>
    <g mask="url(#hme)"><path d="${esq} L${xa},${H} L0,${H} Z" fill="#0a0704" opacity=".55" filter="url(#hfb)" transform="translate(0,-5)"/><path d="${esq} L${xa},${H} L0,${H} Z" fill="url(#hfv)"/>
      <path d="${esq}" fill="none" stroke="#6e5424" stroke-width="7" stroke-dasharray="5 6" transform="translate(0,3.5)" opacity=".8"/><path d="${esq}" fill="none" stroke="#0c0805" stroke-width="2" transform="translate(0,8)" opacity=".7"/><path d="${esq}" fill="none" stroke="#c9a24a" stroke-width="2.6"/><path d="${esq}" fill="none" stroke="#ffe9a8" stroke-width=".8" transform="translate(0,-1)" opacity=".6"/></g>
    <g mask="url(#hmd)"><path d="${dir} L${xb},${H} L${W},${H} Z" fill="#0a0704" opacity=".55" filter="url(#hfb)" transform="translate(0,-5)"/><path d="${dir} L${xb},${H} L${W},${H} Z" fill="url(#hfv)"/>
      <path d="${dir}" fill="none" stroke="#6e5424" stroke-width="7" stroke-dasharray="5 6" transform="translate(0,3.5)" opacity=".8"/><path d="${dir}" fill="none" stroke="#0c0805" stroke-width="2" transform="translate(0,8)" opacity=".7"/><path d="${dir}" fill="none" stroke="#c9a24a" stroke-width="2.6"/><path d="${dir}" fill="none" stroke="#ffe9a8" stroke-width=".8" transform="translate(0,-1)" opacity=".6"/></g>`; }
  addEventListener('resize', () => requestAnimationFrame(desenha)); setInterval(desenha, 700); desenha();
}
