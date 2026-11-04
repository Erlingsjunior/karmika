/* a janela da ÁRVORE DE TALENTOS (aba ao lado das magias, tecla K): constelação em SVG. Clique acende (se ligado a um aceso e houver ponto),
   botão direito apaga (se não segurar outros). O painel do lado mostra o ponto e a soma de tudo. (03/11) */
import { type Talents, type TNode, type TStat, effTxt, branchesOf, classNameOf, talentPoints } from '../talentos';
/* símbolo de cada atributo, desenhado dentro do círculo */
const SYM: Record<TStat, string> = { str: '✊', dex: '➹', vit: '❤', int: '✦', hp: '❤', dmg: '⚔', crit: '✶', arm: '⛨', move: '➶', aspd: '⚡', cdr: '⟳', regen: '✚', gen: '◈', leech: '♦', heal: '✚', mp: '◆' };
const symOf = (n: TNode) => { if (n.kind === 'start') return '☯'; const ks = Object.keys(n.eff) as TStat[]; if (!ks.length) return '•'; const best = ks.reduce((a, b) => (Math.abs(n.eff[b]!) > Math.abs(n.eff[a]!) && n.eff[b]! > 0 ? b : a), ks[0]); return SYM[best]; };

const CSS = `<style>
.talw{position:relative;margin:2px auto 0;max-width:640px}
.talw .tzoom{position:absolute;right:6px;top:6px;display:flex;flex-direction:column;gap:4px;z-index:3}.talw .tzoom button{width:26px;height:26px;background:rgba(20,12,6,.85);border:1px solid #5a4a30;color:#e8d8a8;font:700 14px Georgia,serif;cursor:pointer;border-radius:3px;line-height:1}.talw .tzoom button:hover{border-color:#ffe08a;color:#ffe08a}
.talw .tsvg{display:block;width:100%;height:auto;max-height:calc(70vh / var(--ui,1))}
.talw .tnd{cursor:pointer}.talw .tnd:hover>circle:not([filter]),.talw .tnd:hover>polygon{stroke:#ffe08a}
.ttip{position:absolute;pointer-events:none;min-width:180px;max-width:250px;background:rgba(12,8,16,.97);border:1px solid #c9a24a;border-left-width:2px;padding:8px 10px;font-size:12.5px;color:#d8c8a6;box-shadow:0 6px 18px rgba(0,0,0,.6);z-index:5;border-radius:2px}
.ttip b{display:block;font:700 14px Cinzel,serif;color:#ffe08a}.ttip i{display:block;font:600 9.5px Cinzel,serif;font-style:normal;letter-spacing:.1em;text-transform:uppercase;color:#a08a60;margin-bottom:3px}.ttip .ef{color:#9affb0;margin-top:4px}.ttip .tp{color:#c8b890;font-style:italic;margin-top:4px}.ttip .st{margin-top:6px;font-size:11.5px}
.tdet .th .ic.sym{font-size:24px;color:var(--c);text-shadow:0 0 8px color-mix(in srgb,var(--c) 60%,transparent);border-radius:50%}
.tdet .th .ic.sym.key{border-radius:8px}
.tdet .th small{color:#a89878;font-size:12px}
.tdet .lines.ef div{color:#9affb0}
.tdet h4{font:600 10px Cinzel,serif;letter-spacing:.12em;text-transform:uppercase;color:#a08a60;margin:12px 0 2px}
.tdet .sum{max-height:180px;overflow:auto}
.tdet .evo span{--c:#c9a24a}.tdet .evo span.on{color:var(--c);border-color:var(--c);text-shadow:none}
</style>`;

/* 03/11 (Erling: "árvore de talentos pode receber zoom, olhar mais de perto"): roda do mouse aproxima no ponto do cursor, arrastar o fundo
   passeia, botões ＋ － ⤢; o zoom continua igual entre um clique e outro */
const VZ = { z: 1, cx: 300, cy: 280 };
const vbOf = (W: number, H: number) => { const w = W / VZ.z, h = H / VZ.z; VZ.cx = Math.max(w / 2, Math.min(W - w / 2, VZ.cx)); VZ.cy = Math.max(h / 2, Math.min(H - h / 2, VZ.cy)); return `${(VZ.cx - w / 2).toFixed(1)} ${(VZ.cy - h / 2).toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`; };
export function renderTalents(el: HTMLElement, T: Talents, kit: string, lvl: number, sel: { id: string | null }, rerender: () => void) {
  const nodes = T.nodes(), L = T.lit(), B = branchesOf(kit), W = 600, H = 560; const vb = () => vbOf(W, H);
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
  const kindOf = (n: TNode) => n.kind === 'key' ? 'Pedra-chave' : n.kind === 'notable' ? 'Notável' : n.kind === 'start' ? 'Origem' : 'Ponto';
  const whereOf = (n: TNode) => n.branch >= 0 && n.branch < 3 ? B[n.branch].name : n.branch === 3 ? 'Anel dos Atributos' : classNameOf(kit);
  /* quanto de cada braço já está aceso — no lugar das evoluções da magia */
  const prog = [0, 1, 2].map((bi) => { const ns = nodes.filter((n) => n.branch === bi); return `<span class="${ns.some((n) => L.has(n.id)) ? 'on' : ''}" style="--c:${B[bi].col}">${B[bi].name} <i>${ns.filter((n) => L.has(n.id)).length}/${ns.length}</i></span>`; }).join('');
  const sumL = Object.keys(sum).length ? effTxt(sum).split(' · ').map((x) => `<div>${x}</div>`).join('') : '<div><i>nada aceso ainda</i></div>';
  let det: string;
  if (sn) { const on = L.has(sn.id), can = T.canTake(sn.id), dropOk = T.canDrop(sn.id);
    const why = on ? (dropOk ? '' : 'Segura outros pontos acesos') : !T.avail() ? 'Sem pontos de talento' : can ? '' : 'Ligue a um ponto aceso primeiro';
    det = `<div class="th"><div class="ic sym ${sn.kind === 'key' ? 'key' : ''}" style="--c:${col(sn)}">${symOf(sn)}</div><div><b>${sn.name}</b><small>${kindOf(sn)} · ${whereOf(sn)} · ${on ? 'aceso' : 'apagado'}</small></div></div>
      ${sn.tip ? `<p class="tip">${sn.tip}</p>` : Object.keys(sn.eff).length ? '' : '<p class="tip">O coração da árvore: daqui saem os três braços.</p>'}
      ${Object.keys(sn.eff).length ? `<div class="lines ef">${effTxt(sn.eff).split(' · ').map((x) => `<div>${x}</div>`).join('')}</div>` : ''}
      <div class="evo">${prog}</div>
      <small class="nx">${sn.kind === 'key' ? 'Pedra-chave: muda uma regra da classe. Leia o preço antes de acender.' : sn.kind === 'notable' ? 'Notável: o ponto forte do braço.' : 'Cada ponto aceso abre os vizinhos ligados a ele.'}</small>
      ${on ? `<button class="inv ${why ? 'off' : ''}" data-drop ${why ? 'disabled' : ''}>${why || 'Apagar (devolve 1 ponto)'}</button>` : `<button class="inv ${why ? 'off' : ''}" data-take ${why ? 'disabled' : ''}>${why || `Acender ${sn.name} (1 ponto)`}</button>`}`;
  } else det = `<div class="th"><div class="ic sym" style="--c:#ffe08a">☯</div><div><b>${classNameOf(kit)}</b><small>Árvore de Talentos</small></div></div>
      <p class="tip">Clique num ponto ligado a um aceso para acendê-lo; botão direito apaga. Os três braços seguem os papéis da classe — os mesmos das posturas —, e o anel liga um braço ao outro.</p>
      <div class="evo">${prog}</div>`;
  det += `<h4>Tudo o que está aceso</h4><div class="lines sum">${sumL}</div>`;
  el.innerHTML = `${CSS}<div class="pn skpn"><h2>🌳 Árvore Kármica — ${classNameOf(kit)} <button data-x>✕</button></h2>
    <div class="tree-top"><span class="pts ${T.avail() ? 'on' : ''}">${T.avail()} ponto${T.avail() === 1 ? '' : 's'} para gastar</span><small>Nível de classe ${lvl} · 3 pontos por nível de classe · ${talentPoints(lvl)} no total · ${T.spent()} gastos</small><button data-treset title="Apagar tudo e devolver os pontos">↺ Redistribuir</button></div>
    <div class="tree-body"><div class="treew"><div class="talw"><div class="tzoom"><button data-tz="1" title="Aproximar (roda do mouse)">＋</button><button data-tz="-1" title="Afastar">－</button><button data-tz="0" title="Ver a árvore inteira">⤢</button></div><svg class="tsvg" viewBox="${vb()}"><defs><filter id="tglow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter></defs>${stars}${lines}${dots}${labels}</svg><div class="ttip" hidden></div></div></div>
    <div class="tdet">${det}</div></div>
    <small class="ft">Clique num ponto para ver a ficha e acender · botão direito apaga · Esc fecha</small></div>`;
  el.style.display = 'flex';
  const tip = el.querySelector('.ttip') as HTMLElement, wrap = el.querySelector('.talw') as HTMLElement;
  { const svg = el.querySelector('.tsvg') as SVGSVGElement; const apply = () => svg.setAttribute('viewBox', vb());
    const toSvg = (cx: number, cy: number) => { const r = svg.getBoundingClientRect(), [x0, y0, w, h] = vb().split(' ').map(Number); return [x0 + ((cx - r.left) / r.width) * w, y0 + ((cy - r.top) / r.height) * h]; };
    const zoomAt = (f: number, cx?: number, cy?: number) => { const nz = Math.max(1, Math.min(3.5, VZ.z * f)); if (cx !== undefined && cy !== undefined) { const [px, py] = toSvg(cx, cy); VZ.cx = px + (VZ.cx - px) * (VZ.z / nz); VZ.cy = py + (VZ.cy - py) * (VZ.z / nz); } VZ.z = nz; apply(); tip.hidden = true; };
    svg.addEventListener('wheel', (e) => { e.preventDefault(); zoomAt(e.deltaY < 0 ? 1.18 : 1 / 1.18, e.clientX, e.clientY); }, { passive: false });
    let drag: { x: number; y: number } | null = null;
    svg.addEventListener('pointerdown', (e) => { if ((e.target as Element).closest('[data-t]') || VZ.z <= 1) return; drag = { x: e.clientX, y: e.clientY }; svg.setPointerCapture(e.pointerId); svg.style.cursor = 'grabbing'; });
    svg.addEventListener('pointermove', (e) => { if (!drag) return; const r = svg.getBoundingClientRect(), k = W / VZ.z / r.width; VZ.cx -= (e.clientX - drag.x) * k; VZ.cy -= (e.clientY - drag.y) * k; drag = { x: e.clientX, y: e.clientY }; apply(); });
    svg.addEventListener('pointerup', () => { drag = null; svg.style.cursor = ''; });
    svg.style.cursor = VZ.z > 1 ? 'grab' : '';
    el.querySelectorAll<HTMLButtonElement>('[data-tz]').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); const d = +b.dataset.tz!; if (!d) { VZ.z = 1; apply(); } else zoomAt(d > 0 ? 1.35 : 1 / 1.35); svg.style.cursor = VZ.z > 1 ? 'grab' : ''; })); }
  el.querySelectorAll<SVGGElement>('[data-t]').forEach((g) => { const n = T.byId(g.dataset.t!)!;
    g.addEventListener('mouseenter', () => { const on = L.has(n.id), can = T.canTake(n.id); const kind = n.kind === 'key' ? 'Pedra-chave' : n.kind === 'notable' ? 'Notável' : n.kind === 'start' ? 'Origem' : 'Ponto';
      tip.innerHTML = `<i>${kind}${n.branch >= 0 && n.branch < 3 ? ' · ' + B[n.branch].name : n.branch === 3 ? ' · Anel dos Atributos' : ''}</i><b>${n.name}</b>${Object.keys(n.eff).length ? `<div class="ef">${effTxt(n.eff).split(' · ').join('<br>')}</div>` : ''}${n.tip ? `<div class="tp">${n.tip}</div>` : ''}<div class="st" style="color:${on ? '#ffd24a' : can ? '#9affb0' : '#a08a60'}">${on ? '✔ aceso · botão direito apaga' : can ? '➤ clique para acender (1 ponto)' : T.avail() ? 'ligue a um ponto aceso primeiro' : 'sem pontos de talento'}</div>`;
      tip.hidden = false; const gr = g.getBoundingClientRect(), wr = wrap.getBoundingClientRect(), sc = wr.width / (wrap.offsetWidth || 1), x = (gr.right - wr.left) / sc, y = (gr.top - wr.top) / sc; tip.style.left = `${x + 250 > wrap.offsetWidth ? Math.max(0, (gr.left - wr.left) / sc - 256) : x + 6}px`; tip.style.top = `${Math.max(4, Math.min(wrap.offsetHeight - 150, y - 10))}px`; });
    g.addEventListener('mouseleave', () => { tip.hidden = true; }); 
    g.addEventListener('click', (e) => { e.stopPropagation(); const id = g.dataset.t!; if (sel.id === id && T.canTake(id)) T.take(id); else if (T.canTake(id) && sel.id !== id) { sel.id = id; T.take(id); } else sel.id = id; rerender(); });
    g.addEventListener('contextmenu', (e) => { e.preventDefault(); e.stopPropagation(); const id = g.dataset.t!; sel.id = id; T.drop(id); rerender(); }); });
  el.querySelector('[data-take]')?.addEventListener('click', (e) => { e.stopPropagation(); if (sel.id) T.take(sel.id); rerender(); });
  el.querySelector('[data-drop]')?.addEventListener('click', (e) => { e.stopPropagation(); if (sel.id) T.drop(sel.id); rerender(); });
  el.querySelector('[data-treset]')?.addEventListener('click', (e) => { e.stopPropagation(); T.reset(); sel.id = null; rerender(); });
}
