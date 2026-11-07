/* a janela da ÁRVORE DE TALENTOS (aba ao lado das magias, tecla K): constelação em SVG. Clique acende (se ligado a um aceso e houver ponto),
   botão direito apaga (se não segurar outros). O painel do lado mostra o ponto e a soma de tudo. (03/11) */
import { type Talents, type TNode, type TStat, effTxt, branchesOf, classNameOf, RUNE_TALENT, GATES, ANGS, NR } from '../talentos';
import { RUNAS } from '../runas';
import { useScroll } from '../esquecimento';
/* símbolo de cada atributo, desenhado dentro do círculo */
const SYM: Record<TStat, string> = { str: '✊', dex: '➹', vit: '❤', int: '✦', hp: '❤', dmg: '⚔', crit: '✶', arm: '⛨', move: '➶', aspd: '⚡', cdr: '⟳', regen: '✚', gen: '◈', leech: '♦', heal: '✚', mp: '◆', hpow: '✚', gdef: '⛨', gdmg: '⚔' };
/* o centro é o OLHO KÁRMICO (04/11, Erling: "o símbolo do meio não é um yin-yang, é o olho karmiko") */
const EYE = '👁';
const symOf = (n: TNode) => { if (n.kind === 'start') return EYE; const ks = Object.keys(n.eff) as TStat[]; if (!ks.length) return '•'; const best = ks.reduce((a, b) => (Math.abs(n.eff[b]!) > Math.abs(n.eff[a]!) && n.eff[b]! > 0 ? b : a), ks[0]); return SYM[best]; };

/** o Olho Kármico: o símbolo de Karmika — dois K de costas um para o outro, formando o olho, com a íris no meio (o mesmo do hud.ts) */
export const kkEye = (x: number, y: number, r: number) => { const k = (r * 1.9) / 260; return `<g transform="translate(${x - 150 * k},${y - 110 * k}) scale(${k})" style="pointer-events:none"><polygon points="60,110 143,54 157,54 240,110 157,166 143,166" fill="#0b0810"/><ellipse cx="150" cy="110" rx="40" ry="40" fill="#f2b04a"/><ellipse cx="150" cy="110" rx="24" ry="24" fill="#fff0bd" opacity=".55"/><polygon points="150,88 172,110 150,132 128,110" fill="#0b0810"/><g fill="none" stroke="#d9a24f" stroke-width="16" stroke-linejoin="bevel"><path d="M144 40 L40 110 L144 180"/><path d="M40 40 L40 180"/><path d="M156 40 L260 110 L156 180"/><path d="M260 40 L260 180"/></g></g>`; };
const CSS = `<style>
.talw{position:relative;margin:2px 0 0;width:100%;background:radial-gradient(ellipse at 50% 50%,rgba(60,44,20,.35),rgba(10,6,4,.25) 70%);border-radius:6px}
.talw .tzoom{position:absolute;right:6px;top:6px;display:flex;flex-direction:column;gap:4px;z-index:3}.talw .tzoom button{width:26px;height:26px;background:rgba(20,12,6,.85);border:1px solid #5a4a30;color:#e8d8a8;font:700 14px Georgia,serif;cursor:pointer;border-radius:3px;line-height:1}.talw .tzoom button:hover{border-color:#ffe08a;color:#ffe08a}
.talw .tsvg{display:block;width:100%;height:calc(76vh / var(--ui,1));min-height:440px}
.talw .tnd{cursor:pointer}.talw .tnd.lk{cursor:not-allowed}.talw .tnd:hover>circle:not([filter]),.talw .tnd:hover>polygon{stroke:#ffe08a}
.ttip{position:absolute;pointer-events:none;min-width:180px;max-width:250px;background:rgba(12,8,16,.97);border:1px solid #c9a24a;border-left-width:2px;padding:8px 10px;font-size:12.5px;color:#d8c8a6;box-shadow:0 6px 18px rgba(0,0,0,.6);z-index:5;border-radius:2px}
.ttip b{display:block;font:700 14px Cinzel,serif;color:#ffe08a}.ttip i{display:block;font:600 9.5px Cinzel,serif;font-style:normal;letter-spacing:.1em;text-transform:uppercase;color:#a08a60;margin-bottom:3px}.ttip .ef{color:#9affb0;margin-top:4px}.ttip .tp{color:#c8b890;font-style:italic;margin-top:4px}.ttip .st{margin-top:6px;font-size:11.5px}
.tdet .th .ic.sym{font-size:24px;color:var(--c);text-shadow:0 0 8px color-mix(in srgb,var(--c) 60%,transparent);border-radius:50%}
.tdet .th .ic.sym.key{border-radius:8px}
.tdet .th small{color:#a89878;font-size:12px}
.tdet .lines.ef div{color:#9affb0}
.tdet h4{font:600 10px Cinzel,serif;letter-spacing:.12em;text-transform:uppercase;color:#a08a60;margin:12px 0 2px}
.tdet .sum{max-height:180px;overflow:auto}
.tdet .runepick{display:flex;flex-direction:column;gap:4px}.tdet .runepick button{display:grid;grid-template-columns:24px 1fr;gap:0 8px;align-items:center;text-align:left;background:rgba(30,20,10,.7);border:1px solid #5a4a30;color:#e8d8a8;padding:4px 8px;cursor:pointer;font:600 12px Cinzel,serif}.tdet .runepick button svg{grid-row:span 2;color:#ffd24a}.tdet .runepick button small{font:400 11px Georgia,serif;color:#b8a888}.tdet .runepick button.on{border-color:#ffd24a;background:rgba(80,60,20,.6)}.tdet .runepick button:disabled{opacity:.45;cursor:default}
.tdet .evo span{--c:#c9a24a}.tdet .evo span.on{color:var(--c);border-color:var(--c);text-shadow:none}
</style>`;

/* 03/11 (Erling: "árvore de talentos pode receber zoom, olhar mais de perto"): roda do mouse aproxima no ponto do cursor, arrastar o fundo
   passeia, botões ＋ － ⤢; o zoom continua igual entre um clique e outro */
const VZ = { z: 1, cx: 380, cy: 320 };
const vbOf = (W: number, H: number) => { const w = W / VZ.z, h = H / VZ.z; VZ.cx = Math.max(-W * 0.25, Math.min(W * 1.25, VZ.cx)); VZ.cy = Math.max(-H * 0.25, Math.min(H * 1.25, VZ.cy)); /* arrastar livre, com limite folgado */ return `${(VZ.cx - w / 2).toFixed(1)} ${(VZ.cy - h / 2).toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`; };
export function renderTalents(el: HTMLElement, T: Talents, kit: string, lvl: number, sel: { id: string | null }, rerender: () => void) {
  let sealSeen = 1; try { sealSeen = +(localStorage.getItem('karmika.talSeal') || '1') || 1; } catch { /* */ }
  const nodes = T.nodes(), L = T.lit(), B = branchesOf(kit), W = 760, H = 640; const vb = () => vbOf(W, H);
  /* a constelação ocupa a tela inteira, com margem para os nomes dos braços */
  const xs = nodes.map((n) => n.x), ys = nodes.map((n) => n.y), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  /* 04/11 (Erling: "não está centralizado e não consigo puxar para cima"): o Olho fica no centro da tela e o círculo inteiro (até o último arco) cabe, com folga para os nomes dos braços */
  void x0; void x1; void y0; void y1; const Rm = Math.max(...GATES.map((g) => g.r), ...nodes.map((n) => Math.hypot(n.x, n.y) + 0.6));
  const S = (Math.min(W, H) / 2 - 34) / Rm, ox = W / 2, oy = H / 2;
  const X = (n: TNode) => ox + n.x * S, Y = (n: TNode) => oy + n.y * S;
  const col = (n: TNode) => n.branch >= 0 && n.branch < 3 ? B[n.branch].col : '#e8dcc0';
  const seen = new Set<string>(); let lines = '';
  for (const n of nodes) for (const l of n.links) { const k = [n.id, l].sort().join('|'); if (seen.has(k)) continue; seen.add(k); const m = T.byId(l)!; const on = L.has(n.id) && L.has(m.id), half = L.has(n.id) || L.has(m.id);
    /* 04/11 (Erling: "a linha de ligação mais fina, quase dourada, com uma luz branca que vai percorrendo de um ponto ao outro") */
    const len = Math.hypot(X(m) - X(n), Y(m) - Y(n)), dur = (1.4 + len / 90).toFixed(2);
    lines += `<line x1="${X(n)}" y1="${Y(n)}" x2="${X(m)}" y2="${Y(m)}" stroke="${on ? '#e8c870' : half ? '#7a6438' : '#3a2e1e'}" stroke-width="${on ? 1 : 0.7}" vector-effect="non-scaling-stroke"${on ? '' : ' stroke-dasharray="2 4"'}/>`; /* 05/11 (Erling: "linhas menos espessas"): finas e do mesmo traço em qualquer zoom */
    if (on) lines += `<line x1="${X(n)}" y1="${Y(n)}" x2="${X(m)}" y2="${Y(m)}" stroke="#fffaf0" stroke-width="1.1" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-dasharray="5 ${Math.max(20, len).toFixed(0)}" opacity=".9"><animate attributeName="stroke-dashoffset" from="${(len + 5).toFixed(0)}" to="0" dur="${dur}s" repeatCount="indefinite"/></line>`; }
  /* fundo: as órbitas (anéis) bem fracas, e os PORTÕES como um arco tracejado em cada braço, com o cadeado e os pontos que pedem */
  let orbits = ''; if (kit === 'geral') { const cx = ox, cy = oy; void NR; /* os anéis em si não têm mais círculo: só os arcos de nível */
    /* 04/11 (Erling: "uma linha circular elegante separando, sem tanto texto: um cadeado com o nível do lado e o jogador entende") */
    for (const G of GATES) { const R = G.r * S, open = T.lvl() >= G.lvl, la = ANGS[0] + Math.PI / 3, lx = cx + Math.cos(la) * R, ly = cy + Math.sin(la) * R;
      orbits += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#d9a24f" stroke-opacity="${open ? 0.5 : 0.38}" stroke-width="${open ? 0.8 : 0.7}" vector-effect="non-scaling-stroke"${open ? '' : ' stroke-dasharray="2 5"'}/>`;
      /* cadeado mínimo (04/11, Erling: "minimalista, mais transparente; brilha e quebra o lacre quando chegamos no level") */
      if (!open) orbits += `<g transform="translate(${lx.toFixed(1)},${ly.toFixed(1)})" opacity=".5"><title>Abre no nível de classe ${G.lvl}</title><path d="M-9.5 -1.2v-2a2.3 2.3 0 0 1 4.6 0v2" fill="none" stroke="#e8c870" stroke-width="1"/><rect x="-10.6" y="-1.4" width="6.8" height="5" rx="1" fill="#e8c870"/><text x="-1.6" y="3.4" font-size="8" fill="#e8c870" letter-spacing=".04em">classe ${G.lvl}</text></g>`; /* 05/11 (Erling: "estou dando pontos de level 10 e ainda não sou level 10"): o arco é do nível de CLASSE, não do nível base — escrito no cadeado */
      else if (G.lvl > sealSeen && G.lvl <= T.lvl()) orbits += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#fff4c8" stroke-width="2.4" opacity="0"><animate attributeName="opacity" values="0;.95;0" dur="1.8s" begin="0.15s" fill="freeze"/><animate attributeName="stroke-width" values="2.4;7;0.5" dur="1.8s" begin="0.15s" fill="freeze"/></circle><g transform="translate(${lx.toFixed(1)},${ly.toFixed(1)})"><g opacity="0"><animate attributeName="opacity" values="1;1;0" dur="1.6s" fill="freeze"/><path d="M-9 -2l-4 -4M-6 -3l0 -6M-3 -2l4 -4" stroke="#fff4c8" stroke-width="1.2"><animateTransform attributeName="transform" type="scale" values="0.6;1.8" dur="1.2s" fill="freeze"/></path><rect x="-10.6" y="-1.4" width="6.8" height="5" rx="1" fill="#fff4c8"><animateTransform attributeName="transform" type="translate" values="0 0;-6 9" dur="1.4s" fill="freeze"/></rect></g></g>`; }
    try { const m = Math.max(sealSeen, T.lvl()); if (m !== sealSeen) localStorage.setItem('karmika.talSeal', String(m)); } catch { /* */ } }
  let dots = '';
  const RS = T.runes();
  for (const n of nodes) { const on = L.has(n.id), can = T.canTake(n.id), r = n.rad ? n.rad * S : n.kind === 'key' ? 19 : n.kind === 'notable' ? 15 : n.kind === 'start' ? 17 : 10, c = col(n), isSel = sel.id === n.id, gate = T.gateLeft(n.id) || T.lvlLeft(n.id);
    if (n.kind === 'socket') { /* encaixe de runa: losango; com runa, o desenho dela dentro */ const rid = RS[n.id], ri = RUNAS.findIndex((q) => q.id === rid), cx = X(n), cy = Y(n), s2 = r * 1.15;
      dots += `<g class="tnd" data-t="${n.id}"${gate && !on ? ' opacity=".42"' : ''}>${on ? `<circle cx="${cx}" cy="${cy}" r="${r + 5}" fill="${c}" opacity=".45" filter="url(#tglow)"/>` : ''}<polygon points="${cx},${cy - s2} ${cx + s2},${cy} ${cx},${cy + s2} ${cx - s2},${cy}" fill="${on ? '#2a1e0c' : '#140e08'}" stroke="${isSel ? '#fff' : on ? '#ffd24a' : can ? c : '#5a4a30'}" stroke-width="${on ? 2.4 : 1.6}"${gate ? ' opacity=".45"' : ''}/>${ri >= 0 ? `<g transform="translate(${cx - r * 0.8},${cy - r * 0.8}) scale(${(r * 1.6) / 28})"><path d="${RUNAS[ri].d}" fill="none" stroke="#ffd24a" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/></g>` : `<circle cx="${cx}" cy="${cy}" r="${r * 0.28}" fill="none" stroke="${on ? '#ffd24a' : '#6a5a3a'}" stroke-width="1.2" stroke-dasharray="2 2"/>`}</g>`; continue; }
    const shape = n.kind === 'key' ? `<polygon points="${[0, 1, 2, 3, 4, 5].map((i) => `${X(n) + Math.cos(i * Math.PI / 3 + Math.PI / 6) * r},${Y(n) + Math.sin(i * Math.PI / 3 + Math.PI / 6) * r}`).join(' ')}"` : `<circle cx="${X(n)}" cy="${Y(n)}" r="${r}"`;
    dots += `<g class="tnd${gate && !on ? ' lk' : ''}" data-t="${n.id}"${gate && !on ? ' opacity=".32"' : ''}>${on ? `<circle cx="${X(n)}" cy="${Y(n)}" r="${r + 5}" fill="${c}" opacity=".55" filter="url(#tglow)"/>` : can ? `<circle cx="${X(n)}" cy="${Y(n)}" r="${r + 3}" fill="none" stroke="${c}" stroke-width="1" opacity=".55"><animate attributeName="r" values="${r + 2};${r + 6};${r + 2}" dur="1.8s" repeatCount="indefinite"/><animate attributeName="opacity" values=".6;.1;.6" dur="1.8s" repeatCount="indefinite"/></circle>` : ''}${shape} fill="${on ? c : can ? '#3a2a14' : '#1a140c'}" stroke="${isSel ? '#ffffff' : on ? '#fff4c8' : can ? c : '#5a4a30'}" stroke-width="${isSel ? 3 : n.kind === 'small' ? 1.6 : 2.4}"/>${n.kind === 'notable' ? `<circle cx="${X(n)}" cy="${Y(n)}" r="${r - 5}" fill="none" stroke="${on ? '#2a1a08' : c}" stroke-width="1.4" opacity=".8"/>` : ''}${n.kind === 'start' ? kkEye(X(n), Y(n), r) : `<text x="${X(n)}" y="${Y(n) + (n.kind === 'small' ? 3.5 : n.kind === 'key' ? 6 : 5)}" text-anchor="middle" font-size="${n.kind === 'small' ? 9 : n.kind === 'key' ? 17 : 14}" fill="${on ? '#1a1006' : can ? c : '#8a7a5a'}" style="pointer-events:none">${symOf(n)}</text>`}</g>`; }
  /* os nomes dos braços, fora da ponta */
  let stars = ''; { let sd = kit.length * 97 + 13; const rnd = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; }; for (let i = 0; i < 90; i++) stars += `<circle cx="${rnd() * W}" cy="${rnd() * H}" r="${rnd() < 0.15 ? 1.4 : 0.7}" fill="#fff2d0" opacity="${0.15 + rnd() * 0.35}"/>`; }
  /* 04/11 (Erling: "Cura, Defesa e Ataque escritos fora do círculo, sem pegar em cima dos talentos"): o nome fica além do último arco, na direção do braço */
  let labels = ''; { const Rmax = Math.max(...GATES.map((g) => g.r), ...nodes.map((n) => Math.hypot(n.x, n.y))) * S + 16;
    for (let bi = 0; bi < 3; bi++) { const a = ANGS[bi], lx = ox + Math.cos(a) * Rmax, ly = oy + Math.sin(a) * Rmax + (Math.sin(a) < 0 ? -2 : 12), anc = Math.cos(a) > 0.3 ? 'start' : Math.cos(a) < -0.3 ? 'end' : 'middle';
      labels += `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" fill="${B[bi].col}" font-size="13" font-weight="700" letter-spacing=".12em" text-anchor="${anc}" style="font-family:Cinzel,serif;text-transform:uppercase">${B[bi].name}</text>`; } }
  const sn = sel.id ? T.byId(sel.id) : null, sum = T.stats();
  const kindOf = (n: TNode) => n.kind === 'socket' ? 'Encaixe de runa' : n.kind === 'key' ? 'Pedra-chave' : n.kind === 'notable' ? 'Notável' : n.kind === 'start' ? 'Origem' : 'Ponto';
  const whereOf = (n: TNode) => n.branch >= 0 && n.branch < 3 ? B[n.branch].name : n.branch === 3 ? 'Anel dos Atributos' : classNameOf(kit);
  /* quanto de cada braço já está aceso — no lugar das evoluções da magia */
  const prog = [0, 1, 2].map((bi) => { const ns = nodes.filter((n) => n.branch === bi); return `<span class="${ns.some((n) => L.has(n.id)) ? 'on' : ''}" style="--c:${B[bi].col}">${B[bi].name} <i>${ns.filter((n) => L.has(n.id)).length}/${ns.length}</i></span>`; }).join('');
  const sumL = Object.keys(sum).length ? effTxt(sum).split(' · ').map((x) => `<div>${x}</div>`).join('') : '<div><i>nada aceso ainda</i></div>';
  let det: string;
  if (sn) { const on = L.has(sn.id), can = T.canTake(sn.id), dropOk = T.canDrop(sn.id);
    const gl = T.gateLeft(sn.id), bn = sn.branch >= 0 && sn.branch < 3 ? B[sn.branch].name : '';
    const ll = T.lvlLeft(sn.id); const why = on ? (dropOk ? '' : 'Segura outros pontos acesos') : ll ? `Abre no nível de classe ${sn.lvl} (faltam ${ll})` : gl ? `Faltam ${gl} pontos em ${bn} (portão)` : !T.avail() ? 'Sem pontos de talento' : can ? '' : 'Ligue a um ponto aceso primeiro';
    det = `<div class="th"><div class="ic sym ${sn.kind === 'key' ? 'key' : ''}" style="--c:${col(sn)}">${symOf(sn)}</div><div><b>${sn.name}</b><small>${kindOf(sn)} · ${whereOf(sn)} · ${on ? 'aceso' : 'apagado'}</small></div></div>
      ${sn.tip ? `<p class="tip">${sn.tip}</p>` : Object.keys(sn.eff).length ? '' : '<p class="tip">O coração da árvore: daqui saem os três braços.</p>'}
      ${Object.keys(sn.eff).length ? `<div class="lines ef">${effTxt(sn.eff).split(' · ').map((x) => `<div>${x}</div>`).join('')}</div>` : ''}
      ${sn.kind === 'socket' ? `<h4>Runa Kármica no encaixe</h4><div class="runepick">${RUNAS.map((r2) => { const RT = RUNE_TALENT[r2.id]; const cur = T.runes()[sn.id] === r2.id; return `<button class="${cur ? 'on' : ''}" data-rune="${r2.id}" ${on ? '' : 'disabled'} title="${RT?.txt ?? ''}"><svg viewBox="0 0 28 28" width="22" height="22"><path d="${r2.d}" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/></svg><span>${r2.nome}</span><small>${RT?.txt ?? ''}</small></button>`; }).join('')}${T.runes()[sn.id] && on ? '<button data-rune="">Tirar a runa</button>' : ''}</div>${on ? '' : '<small class="nx">Acenda o encaixe para pôr uma runa.</small>'}` : ''}
      <div class="evo">${prog}</div>
      <small class="nx">${sn.kind === 'socket' ? 'Encaixe: a runa reforça os pontos acesos ligados a ele.' : sn.kind === 'key' ? 'Pedra-chave: muda uma regra do personagem. Leia o preço antes de acender.' : sn.kind === 'notable' ? 'Notável: o ponto forte do braço.' : 'Cada ponto aceso abre os vizinhos ligados a ele.'}</small>
      ${on ? `<button class="inv ${why ? 'off' : ''}" data-drop ${why ? 'disabled' : ''}>${why || 'Apagar (devolve 1 ponto)'}</button>` : `<button class="inv ${why ? 'off' : ''}" data-take ${why ? 'disabled' : ''}>${why || `Acender ${sn.name} (1 ponto)`}</button>`}`;
  } else det = `<div class="th"><div class="ic sym" style="--c:#ffe08a">${EYE}</div><div><b>Olho Kármico</b><small>Árvore de Talentos · a mesma para todas as raças e classes</small></div></div>
      <p class="tip">Clique num ponto ligado a um aceso para acendê-lo; botão direito apaga. A mesma árvore para todas as raças e classes, e ela continua subindo com você: ataque, defesa e cura, e o anel dos atributos liga um braço ao outro.</p>
      <div class="evo">${prog}</div>`;
  det += `<h4>Tudo o que está aceso</h4><div class="lines sum">${sumL}</div>`;
  el.innerHTML = `${CSS}<div class="pn skpn"><h2>🌳 Árvore Kármica — ${kit === 'geral' ? 'Talentos' : classNameOf(kit)} <button data-x>✕</button></h2>
    <div class="tree-top"><span class="pts ${T.avail() ? 'on' : ''}">${T.avail()} ponto${T.avail() === 1 ? '' : 's'} para gastar</span><small><b style="color:#c9a0ff">Seu nível de classe: ${lvl}</b> (os arcos abrem por ele, não pelo nível base) · 3 pontos por nível de classe, o mesmo monte das Habilidades e Passivas · ${T.spent()} nos talentos</small><button data-treset title="Redistribuir (gasta um Pergaminho do Esquecimento dos Talentos)">↺ Redistribuir</button></div>
    <div class="tree-body"><div class="treew"><div class="talw"><div class="tzoom"><button data-tz="1" title="Aproximar (roda do mouse)">＋</button><button data-tz="-1" title="Afastar">－</button><button data-tz="0" title="Ver a árvore inteira">⤢</button></div><svg class="tsvg" viewBox="${vb()}"><defs><filter id="tglow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter></defs>${stars}${orbits}${lines}${dots}${labels}</svg><div class="ttip" hidden></div></div></div>
    <div class="tdet">${det}</div></div>
    <small class="ft">Clique num ponto para ver a ficha e acender · botão direito apaga · Esc fecha</small></div>`;
  el.style.display = 'flex';
  const tip = el.querySelector('.ttip') as HTMLElement, wrap = el.querySelector('.talw') as HTMLElement;
  { const svg = el.querySelector('.tsvg') as SVGSVGElement; const apply = () => svg.setAttribute('viewBox', vb());
    const toSvg = (cx: number, cy: number) => { const r = svg.getBoundingClientRect(), [x0, y0, w, h] = vb().split(' ').map(Number); return [x0 + ((cx - r.left) / r.width) * w, y0 + ((cy - r.top) / r.height) * h]; };
    const zoomAt = (f: number, cx?: number, cy?: number) => { const nz = Math.max(0.7, Math.min(3.5, VZ.z * f)); if (cx !== undefined && cy !== undefined) { const [px, py] = toSvg(cx, cy); VZ.cx = px + (VZ.cx - px) * (VZ.z / nz); VZ.cy = py + (VZ.cy - py) * (VZ.z / nz); } VZ.z = nz; apply(); tip.hidden = true; };
    svg.addEventListener('wheel', (e) => { e.preventDefault(); zoomAt(e.deltaY < 0 ? 1.18 : 1 / 1.18, e.clientX, e.clientY); }, { passive: false });
    let drag: { x: number; y: number } | null = null;
    svg.addEventListener('pointerdown', (e) => { if ((e.target as Element).closest('[data-t]')) return; drag = { x: e.clientX, y: e.clientY }; svg.setPointerCapture(e.pointerId); svg.style.cursor = 'grabbing'; });
    svg.addEventListener('pointermove', (e) => { if (!drag) return; const r = svg.getBoundingClientRect(), k = W / VZ.z / r.width; VZ.cx -= (e.clientX - drag.x) * k; VZ.cy -= (e.clientY - drag.y) * k; drag = { x: e.clientX, y: e.clientY }; apply(); });
    svg.addEventListener('pointerup', () => { drag = null; svg.style.cursor = ''; });
    svg.style.cursor = 'grab';
    el.querySelectorAll<HTMLButtonElement>('[data-tz]').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); const d = +b.dataset.tz!; if (!d) { VZ.z = 1; VZ.cx = W / 2; VZ.cy = H / 2; apply(); } else zoomAt(d > 0 ? 1.35 : 1 / 1.35); })); }
  el.querySelectorAll<SVGGElement>('[data-t]').forEach((g) => { const n = T.byId(g.dataset.t!)!;
    g.addEventListener('mouseenter', () => { const on = L.has(n.id), can = T.canTake(n.id); const kind = n.kind === 'socket' ? 'Encaixe de runa' : n.kind === 'key' ? 'Pedra-chave' : n.kind === 'notable' ? 'Notável' : n.kind === 'start' ? 'Origem' : 'Ponto';
      tip.innerHTML = `<i>${kind}${n.branch >= 0 && n.branch < 3 ? ' · ' + B[n.branch].name : n.branch === 3 ? ' · Anel dos Atributos' : ''}</i><b>${n.name}</b>${Object.keys(n.eff).length ? `<div class="ef">${effTxt(n.eff).split(' · ').join('<br>')}</div>` : ''}${n.tip ? `<div class="tp">${n.tip}</div>` : ''}<div class="st" style="color:${on ? '#ffd24a' : can ? '#9affb0' : '#a08a60'}">${on ? '✔ aceso · botão direito apaga' : can ? '➤ clique para acender (1 ponto)' : T.gateLeft(n.id) ? `🔒 faltam ${T.gateLeft(n.id)} pontos neste braço` : T.avail() ? 'ligue a um ponto aceso primeiro' : 'sem pontos de talento'}</div>`;
      tip.hidden = false; const gr = g.getBoundingClientRect(), wr = wrap.getBoundingClientRect(), sc = wr.width / (wrap.offsetWidth || 1), x = (gr.right - wr.left) / sc, y = (gr.top - wr.top) / sc; tip.style.left = `${x + 250 > wrap.offsetWidth ? Math.max(0, (gr.left - wr.left) / sc - 256) : x + 6}px`; tip.style.top = `${Math.max(4, Math.min(wrap.offsetHeight - 150, y - 10))}px`; });
    g.addEventListener('mouseleave', () => { tip.hidden = true; }); 
    g.addEventListener('click', (e) => { e.stopPropagation(); const id = g.dataset.t!; if (sel.id === id && T.canTake(id)) T.take(id); else if (T.canTake(id) && sel.id !== id) { sel.id = id; T.take(id); } else sel.id = id; rerender(); });
    g.addEventListener('contextmenu', (e) => { e.preventDefault(); e.stopPropagation(); const id = g.dataset.t!; sel.id = id; T.drop(id); rerender(); }); });
  el.querySelector('[data-take]')?.addEventListener('click', (e) => { e.stopPropagation(); if (sel.id) T.take(sel.id); rerender(); });
  el.querySelector('[data-drop]')?.addEventListener('click', (e) => { e.stopPropagation(); if (sel.id) T.drop(sel.id); rerender(); });
  el.querySelectorAll<HTMLButtonElement>('[data-rune]').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); if (sel.id) T.setRune(sel.id, b.dataset.rune || null); rerender(); }));
  el.querySelector('[data-treset]')?.addEventListener('click', (e) => { e.stopPropagation(); if (!useScroll('esq_tal')) return; T.reset(); sel.id = null; rerender(); });
}
