/* a janela da ÁRVORE DE TALENTOS (aba ao lado das magias, tecla K): constelação em SVG. Clique acende (se ligado a um aceso e houver ponto),
   botão direito apaga (se não segurar outros). O painel do lado mostra o ponto e a soma de tudo. (03/11) */
import { type Talents, type TNode, type TStat, effTxt, branchesOf, classNameOf, talentPoints } from '../talentos';
/* símbolo de cada atributo, desenhado dentro do círculo */
const SYM: Record<TStat, string> = { str: '✊', dex: '➹', vit: '❤', int: '✦', hp: '❤', dmg: '⚔', crit: '✶', arm: '⛨', move: '➶', aspd: '⚡', cdr: '⟳', regen: '✚', gen: '◈', leech: '♦', heal: '✚', mp: '◆' };
const symOf = (n: TNode) => { if (n.kind === 'start') return '☯'; const ks = Object.keys(n.eff) as TStat[]; if (!ks.length) return '•'; const best = ks.reduce((a, b) => (Math.abs(n.eff[b]!) > Math.abs(n.eff[a]!) && n.eff[b]! > 0 ? b : a), ks[0]); return SYM[best]; };

const CSS = `<style>
.talpn{display:flex;gap:14px;align-items:stretch}
.talpn .tsvg{flex:0 0 auto;background:radial-gradient(circle at 50% 50%,#1e1810 0%,#0e0b07 70%);border:1px solid #4a3a24;border-radius:10px}
.talpn .tnd{cursor:pointer}
.talpn .tside{width:250px;display:flex;flex-direction:column;gap:8px;font-size:12px;color:#d8c8a0}
.talpn .tside h3{margin:0;font-size:14px;color:#ffd27a}
.talpn .tside .kk{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#a08a60}
.talpn .tside .ef{color:#9affb0}
.talpn .tside .tip{color:#c8b890;font-style:italic}
.talpn .tside .sum{border-top:1px solid #4a3a24;padding-top:6px;max-height:220px;overflow:auto;line-height:1.5}
.talpn .tside button{background:#2a1e10;border:1px solid #8a6a30;color:#ffd27a;border-radius:5px;padding:5px 8px;cursor:pointer}
.talpn .tside button:disabled{opacity:.4;cursor:default}
.ttip{position:absolute;pointer-events:none;min-width:180px;max-width:250px;background:rgba(14,10,6,.96);border:1px solid #8a6a30;border-radius:8px;padding:8px 10px;font-size:12px;color:#e8dcc0;box-shadow:0 6px 18px rgba(0,0,0,.6);z-index:5}
.ttip b{display:block;color:#ffd27a;font-size:13px}.ttip i{display:block;font-style:normal;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#a08a60;margin-bottom:3px}.ttip .ef{color:#9affb0;margin-top:4px}.ttip .tp{color:#c8b890;font-style:italic;margin-top:4px}.ttip .st{margin-top:6px;font-size:11px}
.taltop{display:flex;gap:12px;align-items:center;margin:0 0 8px}
.taltop .pts{font-weight:700;color:#a08a60}.taltop .pts.on{color:#ffd24a}
.taltop small{color:#a08a60}
</style>`;

export function renderTalents(el: HTMLElement, T: Talents, kit: string, lvl: number, sel: { id: string | null }, rerender: () => void) {
  const nodes = T.nodes(), L = T.lit(), B = branchesOf(kit), W = 600, H = 560;
  /* a constelação ocupa a tela inteira, com margem para os nomes dos braços */
  const xs = nodes.map((n) => n.x), ys = nodes.map((n) => n.y), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const S = Math.min((W - 110) / (x1 - x0), (H - 90) / (y1 - y0)), ox = W / 2 - ((x0 + x1) / 2) * S, oy = H / 2 - ((y0 + y1) / 2) * S + 6;
  const X = (n: TNode) => ox + n.x * S, Y = (n: TNode) => oy + n.y * S;
  const col = (n: TNode) => n.branch >= 0 && n.branch < 3 ? B[n.branch].col : '#e8dcc0';
  const seen = new Set<string>(); let lines = '';
  for (const n of nodes) for (const l of n.links) { const k = [n.id, l].sort().join('|'); if (seen.has(k)) continue; seen.add(k); const m = T.byId(l)!; const on = L.has(n.id) && L.has(m.id), half = L.has(n.id) || L.has(m.id);
    lines += `<line x1="${X(n)}" y1="${Y(n)}" x2="${X(m)}" y2="${Y(m)}" stroke="${on ? '#ffd24a' : half ? '#8a7040' : '#3a2e1e'}" stroke-width="${on ? 3.2 : 2}"${on ? '' : ' stroke-dasharray="3 4"'}/>`; }
  let dots = '';
  for (const n of nodes) { const on = L.has(n.id), can = T.canTake(n.id), r = n.kind === 'key' ? 19 : n.kind === 'notable' ? 15 : n.kind === 'start' ? 17 : 10, c = col(n), isSel = sel.id === n.id;
    const shape = n.kind === 'key' ? `<polygon points="${[0, 1, 2, 3, 4, 5].map((i) => `${X(n) + Math.cos(i * Math.PI / 3 + Math.PI / 6) * r},${Y(n) + Math.sin(i * Math.PI / 3 + Math.PI / 6) * r}`).join(' ')}"` : `<circle cx="${X(n)}" cy="${Y(n)}" r="${r}"`;
    dots += `<g class="tnd" data-t="${n.id}">${on ? `<circle cx="${X(n)}" cy="${Y(n)}" r="${r + 5}" fill="${c}" opacity=".55" filter="url(#tglow)"/>` : can ? `<circle cx="${X(n)}" cy="${Y(n)}" r="${r + 3}" fill="none" stroke="${c}" stroke-width="1" opacity=".55"><animate attributeName="r" values="${r + 2};${r + 6};${r + 2}" dur="1.8s" repeatCount="indefinite"/><animate attributeName="opacity" values=".6;.1;.6" dur="1.8s" repeatCount="indefinite"/></circle>` : ''}${shape} fill="${on ? c : can ? '#3a2a14' : '#1a140c'}" stroke="${isSel ? '#ffffff' : on ? '#fff4c8' : can ? c : '#5a4a30'}" stroke-width="${isSel ? 3 : n.kind === 'small' ? 1.6 : 2.4}"/>${n.kind === 'notable' ? `<circle cx="${X(n)}" cy="${Y(n)}" r="${r - 5}" fill="none" stroke="${on ? '#2a1a08' : c}" stroke-width="1.4" opacity=".8"/>` : ''}<text x="${X(n)}" y="${Y(n) + (n.kind === 'small' ? 3.5 : n.kind === 'key' ? 6 : 5)}" text-anchor="middle" font-size="${n.kind === 'small' ? 9 : n.kind === 'key' ? 17 : 14}" fill="${on ? '#1a1006' : can ? c : '#8a7a5a'}" style="pointer-events:none">${symOf(n)}</text></g>`; }
  /* os nomes dos braços, fora da ponta */
  let stars = ''; { let sd = kit.length * 97 + 13; const rnd = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; }; for (let i = 0; i < 90; i++) stars += `<circle cx="${rnd() * W}" cy="${rnd() * H}" r="${rnd() < 0.15 ? 1.4 : 0.7}" fill="#fff2d0" opacity="${0.15 + rnd() * 0.35}"/>`; }
  let labels = ''; for (let bi = 0; bi < 3; bi++) { const k = nodes.find((n) => n.id === `b${bi}k`)!; const L2 = Math.hypot(k.x, k.y) || 1, lx = Math.max(60, Math.min(W - 60, ox + (k.x / L2) * (L2 + 0.95) * S)), ly = Math.max(16, Math.min(H - 8, oy + (k.y / L2) * (L2 + 0.95) * S + 4)); labels += `<text x="${lx}" y="${ly}" fill="${B[bi].col}" font-size="12" font-weight="700" text-anchor="middle">${B[bi].name}</text>`; }
  const sn = sel.id ? T.byId(sel.id) : null, sum = T.stats();
  const side = `<div class="tside">${sn ? `<div class="kk">${sn.kind === 'key' ? 'Pedra-chave' : sn.kind === 'notable' ? 'Notável' : sn.kind === 'start' ? 'Origem' : 'Ponto'}${sn.branch >= 0 && sn.branch < 3 ? ' · ' + B[sn.branch].name : sn.branch === 3 ? ' · Anel dos Atributos' : ''}</div><h3>${sn.name}</h3>${Object.keys(sn.eff).length ? `<div class="ef">${effTxt(sn.eff)}</div>` : '<div class="tip">O coração da árvore: daqui saem os três braços.</div>'}${sn.tip ? `<div class="tip">${sn.tip}</div>` : ''}
      <div>${L.has(sn.id) ? `<button data-drop ${T.canDrop(sn.id) ? '' : 'disabled title="Segura outros pontos acesos"'}>Apagar (devolve 1 ponto)</button>` : `<button data-take ${T.canTake(sn.id) ? '' : 'disabled'}>${T.avail() ? 'Acender (1 ponto)' : 'Sem pontos'}</button>`}</div>` : '<div class="tip">Clique num ponto ligado a um aceso para acendê-lo; botão direito apaga. Os três braços seguem os papéis da classe — o mesmo das posturas —, e o anel liga um braço ao outro.</div>'}
      <div class="sum"><div class="kk">Tudo o que está aceso</div>${Object.keys(sum).length ? effTxt(sum).split(' · ').map((x) => `<div>${x}</div>`).join('') : '<div class="tip">nada ainda</div>'}</div></div>`;
  el.innerHTML = `${CSS}<div class="pn skpn"><h2>✧ Árvore de Talentos — ${classNameOf(kit)} <button data-x>✕</button></h2>
    <div class="taltop"><span class="pts ${T.avail() ? 'on' : ''}">${T.avail()} ponto${T.avail() === 1 ? '' : 's'} de talento</span><small>Nível ${lvl} · 1 ponto a cada 2 níveis e +1 a cada 10 (${talentPoints(lvl)} no total) · ${T.spent()} gastos</small><button data-treset>↺ Redistribuir</button></div>
    <div class="talpn"><div class="twrap" style="position:relative"><svg class="tsvg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs><filter id="tglow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter></defs>${stars}${lines}${dots}${labels}</svg><div class="ttip" hidden></div></div>${side}</div></div>`;
  el.style.display = 'flex';
  const tip = el.querySelector('.ttip') as HTMLElement, wrap = el.querySelector('.twrap') as HTMLElement;
  el.querySelectorAll<SVGGElement>('[data-t]').forEach((g) => { const n = T.byId(g.dataset.t!)!;
    g.addEventListener('mouseenter', () => { const on = L.has(n.id), can = T.canTake(n.id); const kind = n.kind === 'key' ? 'Pedra-chave' : n.kind === 'notable' ? 'Notável' : n.kind === 'start' ? 'Origem' : 'Ponto';
      tip.innerHTML = `<i>${kind}${n.branch >= 0 && n.branch < 3 ? ' · ' + B[n.branch].name : n.branch === 3 ? ' · Anel dos Atributos' : ''}</i><b>${n.name}</b>${Object.keys(n.eff).length ? `<div class="ef">${effTxt(n.eff).split(' · ').join('<br>')}</div>` : ''}${n.tip ? `<div class="tp">${n.tip}</div>` : ''}<div class="st" style="color:${on ? '#ffd24a' : can ? '#9affb0' : '#a08a60'}">${on ? '✔ aceso · botão direito apaga' : can ? '➤ clique para acender (1 ponto)' : T.avail() ? 'ligue a um ponto aceso primeiro' : 'sem pontos de talento'}</div>`;
      tip.hidden = false; const x = X(n), y = Y(n); tip.style.left = `${Math.min(W - 250, x + 18)}px`; tip.style.top = `${Math.max(4, Math.min(H - 140, y - 20))}px`; });
    g.addEventListener('mouseleave', () => { tip.hidden = true; }); void wrap;
    g.addEventListener('click', (e) => { e.stopPropagation(); const id = g.dataset.t!; if (sel.id === id && T.canTake(id)) T.take(id); else if (T.canTake(id) && sel.id !== id) { sel.id = id; T.take(id); } else sel.id = id; rerender(); });
    g.addEventListener('contextmenu', (e) => { e.preventDefault(); e.stopPropagation(); const id = g.dataset.t!; sel.id = id; T.drop(id); rerender(); }); });
  el.querySelector('[data-take]')?.addEventListener('click', (e) => { e.stopPropagation(); if (sel.id) T.take(sel.id); rerender(); });
  el.querySelector('[data-drop]')?.addEventListener('click', (e) => { e.stopPropagation(); if (sel.id) T.drop(sel.id); rerender(); });
  el.querySelector('[data-treset]')?.addEventListener('click', (e) => { e.stopPropagation(); T.reset(); sel.id = null; rerender(); });
}
