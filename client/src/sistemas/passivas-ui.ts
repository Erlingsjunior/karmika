/* As abas PASSIVAS e COMPÊNDIO da Árvore Kármica (03/11). Mesmo desenho das abas Magias e Talentos (tree-top, ficha à direita).
   Passivas: as 25 de magia (3 níveis, abrem com a magia alvo no rank 3) e as 15 de classe (abrem por nível). Os pontos são os da Árvore.
   Compêndio: as 20 ativas da classe com a ficha e o que cada runa faz nelas — as que ainda não estão no jogo aparecem "em breve". */
import { type Comp, type CompSP, type CompCP, compOf, passRank, setPass, resetPass, activeIdOf, compActiveFor } from '../passivas';
import { runaSvg, runaIdx } from '../runas';
import { useScroll } from '../esquecimento';

interface Ctx { /** gasta um Pergaminho do Esquecimento (false = não tem) */ useScroll?(id: string): boolean; kit: string; skills: { id: string; name: string; k: string }[]; rank(id: string): number; avail(): number; lvl: number; title: string; sfx(): void; log(t: string, c?: string): void; rerender(): void; recalc(): void }
const CSS = `<style id="pvcss">
.pvw{display:grid;grid-template-columns:minmax(0,1fr) 290px;gap:16px;align-items:start}
.pvl{max-height:min(560px,calc(60vh / var(--ui,1)));overflow-y:auto;padding-right:6px}
.pvl h4{font:600 11px Cinzel,serif;letter-spacing:.14em;text-transform:uppercase;color:#e0b048;margin:12px 0 6px;padding-bottom:3px;border-bottom:1px solid #4a3a22;display:flex;justify-content:space-between}.pvl h4 small{font:italic 11px Georgia,serif;letter-spacing:0;text-transform:none;color:#8a7a5a}
.pvg{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px}
.pvc{position:relative;border:1px solid #4a3a22;background:#1a120a;padding:8px 9px 7px;cursor:pointer;border-radius:3px;transition:border-color .15s}.pvc:hover{border-color:#a08a50}.pvc.sel{border-color:#ffe08a;box-shadow:0 0 10px rgba(255,220,120,.35)}
.pvc.on{background:linear-gradient(180deg,#2a1e0e,#1a120a)}.pvc.lock{opacity:.5}
.pvc b{display:block;font:600 12.5px Cinzel,serif;color:#f0d890;line-height:1.2}.pvc i{display:block;font-style:normal;font-size:11px;color:#a89878;margin-top:2px}
.pvc .pips{display:flex;gap:3px;margin-top:5px}.pvc .pips span{flex:1;height:5px;border-radius:2px;background:#3a2e1e}.pvc .pips span.on{background:linear-gradient(90deg,#d9a24f,#ffe08a);box-shadow:0 0 5px rgba(255,210,100,.5)}
.pvc.new::after{content:'em breve';display:inline-block;margin-top:4px;font:600 8.5px Cinzel,serif;letter-spacing:.1em;color:#c9a0ff;border:1px solid #6a4a9a;padding:1px 4px;border-radius:2px}
.pvc.game::after{content:'no jogo';display:inline-block;margin-top:4px;font:600 8.5px Cinzel,serif;letter-spacing:.1em;color:#9ac87a;border:1px solid #4a6a3a;padding:1px 4px;border-radius:2px}
.tdet .pvlv div{font-size:13px;padding:4px 0;border-bottom:1px dotted rgba(125,90,44,.6);color:#a89878}.tdet .pvlv div.on{color:#ffe08a}.tdet .pvlv div b{font:600 10px Cinzel,serif;color:#d9c08a;margin-right:6px}
.tdet .pvbtn{display:flex;gap:6px;margin-top:10px}.tdet .pvbtn .inv{flex:1}.tdet .pvbtn .minus{width:44px;background:#1a1208;border:1px solid #5a4a30;color:#c8b890;cursor:pointer;font:700 15px Georgia,serif}
.tdet .rnl div{font-size:12.5px;padding:4px 0;border-bottom:1px dotted rgba(125,90,44,.5);display:flex;gap:6px;align-items:flex-start;color:#d8c8a6}.tdet .rnl svg{flex:0 0 auto;margin-top:1px}.tdet .rnl b{color:var(--c)}
.tdet.big{max-height:min(560px,calc(60vh / var(--ui,1)));overflow-y:auto}
.pvsub{display:flex;gap:6px;margin:0 0 6px}.pvsub button{background:transparent;border:1px solid #5a4630;color:#c8b890;padding:4px 10px;font:600 11px Cinzel,serif;cursor:pointer;border-radius:3px}.pvsub button.on{color:#ffe08a;border-color:#d9a24f;background:#3a2c16}
</style>`;
const RC: Record<string, string> = { lagrima: '#8ad8ff', olho: '#ffd24a', ampulheta: '#e8c890', labirinto: '#8ad07a', fome: '#ff7a3a', fresta: '#a890d8' };
const RN: Record<string, string> = { lagrima: 'Lágrima', olho: 'Olho Kármico', ampulheta: 'Ampulheta', labirinto: 'Labirinto', fome: 'Fome', fresta: 'Fresta' };
let sel: string | null = null, compSel = 1;
const cpLvlReq = (c: Comp, p: CompCP) => 3 + c.classPassives.indexOf(p) * 3;

function shell(root: HTMLElement, c: Ctx, top: string, body: string, foot: string) {
  if (!document.getElementById('pvcss')) document.head.insertAdjacentHTML('beforeend', CSS);
  root.innerHTML = `<div class="pn skpn"><h2>🌳 Árvore Kármica — ${c.title} <button data-x>✕</button></h2>${top}${body}<small class="ft">${foot}</small></div>`;
  root.style.display = 'flex';
}
/* 04/11 (Erling: "hexágonos com ícones dentro — Mão de Lavrador uma mão segurando uma planta, Emboscada de Mato um olho olhando do mato —
   para cada frase um ícone diferente… mais bonito e chamativo para sentirem o carisma das passivas; umas dependem de outras; passivas de
   habilidade e de classe uma ao lado da outra na mesma tela, com símbolos e tooltips").
   O ÍCONE sai do nome: as duas primeiras palavras que têm desenho formam a dupla — o desenho grande e o pequeno no canto (✋+🌾, 👁+🌿). */
const ICO: [RegExp, string][] = [
  [/m[ãa]o|punho/i, '✋'], [/olho|vis[ãa]o|vigia|gavi[ãa]o|falc[ãa]o/i, '👁'], [/emboscad|espreit/i, '🫣'], [/mato|folha|cip[óo]|mata|vagem/i, '🌿'], [/lavrador|colheita|ceifa|trigo|semente/i, '🌾'],
  [/bra[çc]o|ombro/i, '💪'], [/t[áa]bua|madeira|freixo|cabo/i, '🪵'], [/golpe|martelo|bigorna/i, '🔨'], [/boi|aríete|aríete|cabra/i, '🐂'], [/p[ée]s?\b|p[ée] |passo|estrada|corredor/i, '🦶'],
  [/lenhador|machad|fio/i, '🪓'], [/cinto|bolsa|aljava/i, '👝'], [/p[ãa]o|mesa|taverna|paladar/i, '🍞'], [/firme|firmeza|teimos|n[ãa]o se entrega|determina/i, '🛡'], [/ponta|lan[çc]a|flecha|pena|obsidiana/i, '🏹'],
  [/arremess|mutir[ãa]o|vizinho|leal|comum|compartilh|confian/i, '🤝'], [/faro|cheiro|sopro|respira|f[ôo]lego|fole/i, '👃'], [/pele|couro|curtid/i, '🧥'], [/canela|perna/i, '🦵'], [/sorte|bobo/i, '🍀'],
  [/cachorro|c[ãa]o|animal/i, '🐕'], [/n[óo] |marinheiro|la[çc]o|corda|elo/i, '🪢'], [/bronze|ferro|im[ãa]|metal|t[êe]mpera/i, '⚙'], [/lamp|lume|brasa|forja|fornalha|calor|lava|vulc/i, '🔥'], [/voz|trov[ãa]o|grito/i, '📣'],
  [/inverno|gelo|frio/i, '❄'], [/sangue/i, '🩸'], [/eco|vida passada|muitas vidas|mem[óo]ria/i, '🌀'], [/morrer|alma/i, '💀'], [/instinto|ouvido/i, '👂'], [/faz-tudo/i, '🧰'],
  [/runa/i, 'ᚱ'], [/raiz|raízes|montanha|granito|basalto|pedra|rocha/i, '🪨'], [/barril|cerveja|chifre/i, '🍺'], [/barba/i, '🧔'], [/mineir/i, '⛏'], [/vento|nuvem|c[ée]u|furac/i, '🌪'],
  [/seiva|grud/i, '💧'], [/gato|leve/i, '🐈'], [/corda afinada|tiro|arqueira/i, '🎯'], [/fúria|furia/i, '😤'], [/recuar/i, '↩'], [/terreno|leitura/i, '🗺'], [/rastro/i, '👣'], [/esta[çc][õo]es/i, '🍂'], [/guarda|av[ôo]/i, '🛡'],
];
function icoOf(name: string): [string, string] { const hits: { i: number; e: string }[] = []; for (const [re, e] of ICO) { const m = re.exec(name); if (m && !hits.some((h) => h.e === e)) hits.push({ i: m.index, e }); }
  hits.sort((a, b) => a.i - b.i); return [hits[0]?.e ?? '✦', hits[1]?.e ?? '']; }
const hexPts = (r: number) => Array.from({ length: 6 }, (_, i) => { const a = Math.PI / 6 + i * Math.PI / 3; return `${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`; }).join(' ');
const PVCSS = `<style id="pv2css">
.pv2{display:grid;grid-template-columns:minmax(0,2fr) minmax(0,1fr);gap:14px;max-height:min(600px,calc(64vh / var(--ui,1)));overflow:auto;padding-right:4px}
.pv2 section{background:radial-gradient(ellipse at 50% 0%,rgba(80,58,30,.28),transparent 70%),rgba(14,10,6,.55);border:1px solid #3a2c18;border-radius:4px;padding:8px 10px 10px}
.pv2 section.hab{display:grid;grid-template-columns:1fr 1fr;column-gap:14px;align-content:start}.pv2 section.hab h3{grid-column:1/-1}
.pv2 h3{margin:0 0 6px;font:700 13px Cinzel,serif;letter-spacing:.1em;text-transform:uppercase;color:#ffe08a;display:flex;justify-content:space-between;align-items:baseline}.pv2 h3 small{font:italic 11px Georgia,serif;text-transform:none;letter-spacing:0;color:#a08a60}
.pv2 .grp{display:flex;align-items:center;gap:2px;padding:3px 0;border-bottom:1px dotted rgba(125,90,44,.35)}.pv2 .grp:last-child{border:0}
.pv2 .gname{width:96px;flex:0 0 auto;font:600 10.5px Cinzel,serif;color:#c8b07a;line-height:1.15}.pv2 .gname small{display:block;font:italic 10px Georgia,serif;color:#8a7a5a}
.pv2 .lnk{width:16px;height:2px;background:#4a3a22;flex:0 0 auto}.pv2 .lnk.on{background:linear-gradient(90deg,#d9a24f,#ffe08a);box-shadow:0 0 4px #ffd070}
.pv2 .cls{display:flex;flex-wrap:wrap;gap:2px 0;align-items:center}
.hx{position:relative;width:58px;height:58px;flex:0 0 auto;cursor:pointer}.hx svg{position:absolute;inset:0;overflow:visible}
.hx .e1{position:absolute;inset:0;display:grid;place-items:center;font-size:24px;filter:drop-shadow(0 1px 2px #000)}.hx .e2{position:absolute;right:4px;bottom:6px;font-size:13px;filter:drop-shadow(0 1px 1px #000)}
.hx .rk{position:absolute;left:0;right:0;bottom:-3px;text-align:center;font:700 9px Cinzel,serif;color:#ffe08a;text-shadow:0 1px 2px #000}
.hx.lock .e1,.hx.lock .e2{filter:grayscale(1) brightness(.5)}.hx.lock{opacity:.75}
.hx.sel svg polygon.bd{stroke:#fff}
.hx:hover svg polygon.bd{stroke:#ffe08a}
.pvtip{position:fixed;pointer-events:none;z-index:99;min-width:200px;max-width:270px;background:rgba(12,8,16,.97);border:1px solid #c9a24a;border-left-width:2px;padding:8px 10px;font-size:12.5px;color:#d8c8a6;box-shadow:0 6px 18px rgba(0,0,0,.6);border-radius:2px}
.pvtip b{display:block;font:700 14px Cinzel,serif;color:#ffe08a}.pvtip i{display:block;font:600 9.5px Cinzel,serif;font-style:normal;letter-spacing:.1em;text-transform:uppercase;color:#a08a60;margin-bottom:3px}.pvtip .lv div{padding:2px 0;color:#a89878}.pvtip .lv div.on{color:#ffe08a}.pvtip .st{margin-top:6px;font-size:11.5px}
.pvbar{display:flex;align-items:center;gap:12px;margin-top:8px;padding:8px 10px;border:1px solid #4a3a22;background:#140e08;border-radius:3px;min-height:46px}.pvbar .t{flex:1;font-size:12.5px;color:#d8c8a6}.pvbar .t b{font:700 13px Cinzel,serif;color:#ffe08a;margin-right:6px}.pvbar button{background:#2a1e0e;border:1px solid #a08a50;color:#ffe08a;font:600 12px Cinzel,serif;padding:6px 12px;cursor:pointer;border-radius:3px}.pvbar button:disabled{opacity:.45;cursor:default}
</style>`;
function hexHtml(id: string, name: string, r: number, max: number, lock: boolean, sel: boolean, col: string) {
  const [e1, e2] = icoOf(name), on = r > 0, full = r >= max;
  const pips = Array.from({ length: max }, (_, i) => { const a = -Math.PI / 2 + (i - (max - 1) / 2) * 0.42; return `<circle cx="${(Math.cos(a) * 31).toFixed(1)}" cy="${(Math.sin(a) * 31).toFixed(1)}" r="2.6" fill="${i < r ? '#ffe08a' : '#3a2e1e'}" stroke="#000" stroke-width=".6"/>`; }).join('');
  return `<div class="hx ${lock && !on ? 'lock' : ''} ${sel ? 'sel' : ''}" data-pv="${id}"><svg viewBox="-29 -29 58 58">${on ? `<polygon points="${hexPts(27)}" fill="${col}" opacity=".35" filter="blur(3px)"/>` : ''}<polygon points="${hexPts(24)}" fill="${on ? 'url(#pvg' + (full ? '2' : '1') + ')' : '#1a1208'}" class="bd" stroke="${full ? '#ffe08a' : on ? col : lock ? '#4a3a22' : '#8a7040'}" stroke-width="${on ? 2.2 : 1.6}"/><polygon points="${hexPts(19.5)}" fill="none" stroke="${on ? 'rgba(255,240,200,.35)' : 'rgba(160,130,80,.18)'}" stroke-width="1"/>${pips}</svg><span class="e1">${e1}</span>${e2 ? `<span class="e2">${e2}</span>` : ''}</div>`;
}
export function renderPassives(root: HTMLElement, c: Ctx) {
  const C = compOf(c.kit); if (!C) { shell(root, c, '', '<p class="tip" style="padding:30px;text-align:center">Abrindo o compêndio…</p>', ''); setTimeout(c.rerender, 400); return; }
  if (!document.getElementById('pv2css')) document.head.insertAdjacentHTML('beforeend', PVCSS);
  const spentK = C.spellPassives.reduce((a, p) => a + passRank(c.kit, p.n), 0) + C.classPassives.reduce((a, p) => a + passRank(c.kit, p.n), 0);
  const tgtId = (p: CompSP) => activeIdOf(C, c.skills, p.target);
  /* DEPENDÊNCIAS: nas passivas de habilidade, a 2ª do grupo pede a 1ª aprendida; nas de classe, cada uma pede a anterior da mesma fileira de 3 */
  const groups = new Map<string, CompSP[]>(); for (const p of C.spellPassives) { const g = groups.get(p.target) ?? []; g.push(p); groups.set(p.target, g); }
  const spPrev = (p: CompSP) => { const g = groups.get(p.target)!, i = g.indexOf(p); return i > 0 ? g[i - 1] : null; };
  const cpPrev = (p: CompCP) => { const i = C.classPassives.indexOf(p); return i % 3 ? C.classPassives[i - 1] : null; };
  const spState = (p: CompSP) => { const id = tgtId(p), r = passRank(c.kit, p.n), pv = spPrev(p); if (!id) return { r, why: 'a habilidade alvo ainda está em breve', id }; if (c.rank(id) < 3) return { r, why: `precisa de 3 pontos em ${p.target}`, id }; if (pv && !passRank(c.kit, pv.n)) return { r, why: `aprenda antes ${pv.name}`, id }; if (r >= 3) return { r, why: 'no máximo', id }; if (c.avail() <= 0) return { r, why: 'sem pontos', id }; return { r, why: '', id }; };
  const cpState = (p: CompCP) => { const r = passRank(c.kit, p.n), need = cpLvlReq(C, p), pv = cpPrev(p); if (c.lvl < need) return { r, why: `abre no nível ${need}` }; if (pv && !passRank(c.kit, pv.n)) return { r, why: `aprenda antes ${pv.name}` }; if (r >= p.levels) return { r, why: 'no máximo' }; if (c.avail() <= 0) return { r, why: 'sem pontos' }; return { r, why: '' }; };
  let left = '';
  for (const [t, ps] of groups) { const id = tgtId(ps[0]); left += `<div class="grp"><div class="gname">${t}<small>${id ? `habilidade no rank ${c.rank(id)}` : 'em breve'}</small></div>${ps.map((p, i) => { const s = spState(p); return `${i ? `<i class="lnk ${passRank(c.kit, ps[i - 1].n) ? 'on' : ''}"></i>` : ''}${hexHtml('p' + p.n, p.name, s.r, 3, !!s.why, sel === 'p' + p.n, '#d9a24f')}`; }).join('')}</div>`; }
  let right = ''; for (let i = 0; i < C.classPassives.length; i += 3) { right += `<div class="grp cls">${C.classPassives.slice(i, i + 3).map((p, j) => { const s = cpState(p); return `${j ? `<i class="lnk ${passRank(c.kit, C.classPassives[i + j - 1].n) ? 'on' : ''}"></i>` : ''}${hexHtml('c' + p.n, p.name, s.r, p.levels, !!s.why, sel === 'c' + p.n, '#9ac87a')}`; }).join('')}</div>`; }
  const sp = sel?.startsWith('p') ? C.spellPassives.find((p) => 'p' + p.n === sel) : null, cp = sel?.startsWith('c') ? C.classPassives.find((p) => 'c' + p.n === sel) : null;
  let bar = `<div class="t"><b>${C.title}</b>Passe o mouse num hexágono para ler; clique para escolher e aprender. As de habilidade abrem com 3 pontos na habilidade; as de classe, com o nível. Umas pedem outras antes.</div>`;
  if (sp) { const s = spState(sp); bar = `<div class="t"><b>${sp.name}</b>${sp.lv[Math.max(0, s.r - 1)]} · ${s.r}/3</div>${s.r ? `<button data-dn="p${sp.n}" title="Devolver 1 ponto">−</button>` : ''}<button data-up="p${sp.n}" ${s.why ? 'disabled' : ''}>${s.why || (s.r ? `+1 nível (${s.r + 1}/3)` : 'Aprender (1 ponto)')}</button>`; }
  if (cp) { const s = cpState(cp); bar = `<div class="t"><b>${cp.name}</b>${cp.eff} · ${s.r}/${cp.levels}</div>${s.r ? `<button data-dn="c${cp.n}" title="Devolver 1 ponto">−</button>` : ''}<button data-up="c${cp.n}" ${s.why ? 'disabled' : ''}>${s.why || (s.r ? `+1 nível (${s.r + 1}/${cp.levels})` : 'Aprender (1 ponto)')}</button>`; }
  const defs = `<svg width="0" height="0" style="position:absolute"><defs><radialGradient id="pvg1" cx="50%" cy="35%" r="70%"><stop offset="0" stop-color="#5a3e1a"/><stop offset="1" stop-color="#1e140a"/></radialGradient><radialGradient id="pvg2" cx="50%" cy="35%" r="70%"><stop offset="0" stop-color="#8a6420"/><stop offset="1" stop-color="#2a1c0a"/></radialGradient></defs></svg>`;
  const top = `<div class="tree-top"><span class="pts ${c.avail() ? 'on' : ''}">${c.avail()} ponto${c.avail() === 1 ? '' : 's'} para gastar</span><small>o mesmo monte das Habilidades e dos Talentos · ${spentK} nas passivas</small><button data-pvreset title="Redistribuir (gasta um Pergaminho do Esquecimento de Passivas)">↺ Redistribuir</button></div>`;
  shell(root, c, top, `${defs}<div class="pv2"><section class="hab"><h3>Passivas de habilidade<small>${C.spellPassives.length}</small></h3>${left}</section><section><h3>Passivas de classe<small>${C.classPassives.length}</small></h3>${right}</section></div><div class="pvbar">${bar}</div>`, 'Passe o mouse para ler · clique para escolher · Esc fecha');
  /* tooltip */
  let tip = document.querySelector('.pvtip') as HTMLElement | null; if (!tip) { tip = document.createElement('div'); tip.className = 'pvtip'; tip.hidden = true; document.body.appendChild(tip); } const TP = tip;
  root.querySelectorAll<HTMLElement>('.hx').forEach((h) => { const k = h.dataset.pv!;
    h.addEventListener('mouseenter', () => { const P = k[0] === 'p' ? C.spellPassives.find((p) => 'p' + p.n === k) : null, Q = k[0] === 'c' ? C.classPassives.find((p) => 'c' + p.n === k) : null;
      if (P) { const s = spState(P); TP.innerHTML = `<i>Passiva de habilidade · ${P.target}</i><b>${P.name}</b><div class="lv">${P.lv.map((t, i) => `<div class="${i < s.r ? 'on' : ''}">${i + 1}. ${t}</div>`).join('')}</div><div class="st" style="color:${s.why ? '#a08a60' : '#9affb0'}">${s.why ? '🔒 ' + s.why : '➤ clique para aprender'}</div>`; }
      else if (Q) { const s = cpState(Q); TP.innerHTML = `<i>Passiva de classe · ${Q.levels} níveis · abre no ${cpLvlReq(C, Q)}</i><b>${Q.name}</b><div>${Q.eff}</div><div class="st" style="color:${s.why ? '#a08a60' : '#9affb0'}">${s.r}/${Q.levels} · ${s.why ? '🔒 ' + s.why : '➤ clique para aprender'}</div>`; }
      const r = h.getBoundingClientRect(); TP.hidden = false; TP.style.left = `${Math.min(innerWidth - 290, r.right + 8)}px`; TP.style.top = `${Math.max(8, r.top - 10)}px`; });
    h.addEventListener('mouseleave', () => { TP.hidden = true; }); });
  root.onclick = (e) => { const t = (e.target as HTMLElement).closest('[data-pv],[data-up],[data-dn],[data-pvreset]') as HTMLElement | null; if (!t) return; e.stopPropagation(); TP.hidden = true;
    if (t.dataset.pv) { sel = t.dataset.pv; c.rerender(); return; }
    if (t.dataset.pvreset) { if (!useScroll('esq_pas')) return; resetPass(c.kit); c.recalc(); c.log('📜 Pergaminho do Esquecimento: as passivas foram esquecidas e os pontos voltaram.', '#b9c6e0'); c.rerender(); return; }
    const up = t.dataset.up, dn = t.dataset.dn, k = up ?? dn; if (!k) return; const n = +k.slice(1), r = passRank(c.kit, n);
    if (up) { const ok = k[0] === 'p' ? !spState(C.spellPassives.find((p) => p.n === n)!).why : !cpState(C.classPassives.find((p) => p.n === n)!).why; if (!ok) return; setPass(c.kit, n, r + 1); c.sfx(); }
    else { /* devolver só se nada depender desta */ const dep = k[0] === 'p' ? C.spellPassives.some((q) => spPrev(q)?.n === n && passRank(c.kit, q.n)) : C.classPassives.some((q) => cpPrev(q)?.n === n && passRank(c.kit, q.n)); if (dep && r === 1) { c.log('Outra passiva depende desta: devolva aquela antes.', '#ffb27a'); return; } setPass(c.kit, n, r - 1); }
    c.recalc(); c.rerender(); };
}
export function renderCompendium(root: HTMLElement, c: Ctx) {
  const C = compOf(c.kit); if (!C) { shell(root, c, '', '<p class="tip" style="padding:30px;text-align:center">Abrindo o compêndio da classe…</p>', ''); setTimeout(c.rerender, 400); return; }
  const inGame = (a: Comp['actives'][number]) => c.skills.find((s) => (a.key && s.k === a.key) || s.name.toLowerCase() === a.name.toLowerCase());
  const sec = (t: string, L: Comp['actives']) => `<h4>${t}</h4><div class="pvg">${L.map((a) => { const g = inGame(a); return `<div class="pvc ${g ? 'game' : 'new'} ${compSel === a.n ? 'sel' : ''}" data-cs="${a.n}"><b>${a.name}</b><i>${a.type} · nível ${a.lvl}${a.key ? ` · tecla ${a.key}` : ''}</i></div>`; }).join('')}</div>`;
  const A = C.actives.find((a) => a.n === compSel) ?? C.actives[0], g = inGame(A);
  const det = `<div class="th"><div class="ic" style="--c:${g ? '#9ac87a' : '#c9a0ff'};font-size:22px;display:grid;place-items:center">${A.sup ? '✹' : A.aura ? '☀' : '✦'}</div><div><b>${A.name}</b><small>${A.type} · nível ${A.lvl}${A.key ? ` · tecla ${A.key}` : ''} · ${g ? `no jogo (rank ${c.rank(g.id)})` : 'em breve'}</small></div></div>
    <p class="tip">${A.desc}</p><div class="rnh" style="font:600 10px Cinzel,serif;letter-spacing:.12em;text-transform:uppercase;color:#a08a60;margin:10px 0 4px">O que cada runa faz${A.sup ? ' · 3 encaixes' : ''}</div>
    <div class="rnl">${Object.entries(A.runes).map(([k, v]) => `<div style="--c:${RC[k]}">${runaSvg(runaIdx(k), 16).replace('<svg', `<svg style="color:${RC[k]}"`)}<span><b>${RN[k]}:</b> ${v}</span></div>`).join('')}${A.desperta ? `<div style="--c:#fff0bd"><span>✹</span><span><b>Desperta ${A.desperta}</b></span></div>` : ''}</div>`;
  const top = `<div class="tree-top"><span class="pts">${C.actives.filter(inGame).length}/20 no jogo</span><small>${C.intro}</small></div>`;
  shell(root, c, top, `<div class="pvw"><div class="pvl">${sec('Ativas', C.actives.filter((a) => !a.sup && !a.aura))}${sec('Bênçãos e auras', C.actives.filter((a) => a.aura))}${sec('Supremas', C.actives.filter((a) => a.sup))}${C.combos.length ? `<h4>Combinações assinatura</h4>${C.combos.map((x) => `<p class="tip" style="font-size:12.5px;margin:4px 0">${x.replace(/\*\*/g, '')}</p>`).join('')}` : ''}</div><div class="tdet big">${det}</div></div>`, 'Clique numa magia para ver a ficha e as runas · "em breve" ainda não está no jogo · Esc fecha');
  root.onclick = (e) => { const t = (e.target as HTMLElement).closest('[data-cs]') as HTMLElement | null; if (!t) return; e.stopPropagation(); compSel = +t.dataset.cs!; c.rerender(); };
}
/** o texto próprio de cada runa nesta magia (para a ficha da magia, na aba Magias) */
export function runeTextFor(kit: string, sk: { id: string; name: string; k: string }): Record<string, string> | null { const C = compOf(kit); if (!C) return null; return compActiveFor(C, sk)?.runes ?? null; }
