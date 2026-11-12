/* As abas PASSIVAS e COMPÊNDIO da Árvore Kármica (03/11). Mesmo desenho das abas Magias e Talentos (tree-top, ficha à direita).
   Passivas: as 25 de magia (3 níveis, abrem com a magia alvo no rank 3) e as 15 de classe (abrem por nível). Os pontos são os da Árvore.
   Compêndio: as 20 ativas da classe com a ficha e o que cada runa faz nelas — as que ainda não estão no jogo aparecem "em breve". */
import { type Comp, type CompSP, type CompCP, compOf, passRank, setPass, resetPass, activeIdOf, compActiveFor } from '../passivas';
import { runaSvg, runaIdx } from '../runas';
import { useScroll } from '../esquecimento';
import { KITS } from '../kits';

interface Ctx { /** gasta um Pergaminho do Esquecimento (false = não tem) */ useScroll?(id: string): boolean; /** 12/11: as habilidades de grupo (id pelo nome e pontos), para as passivas delas */ grupo?: { idOf(name: string): string | null; rank(id: string): number }; kit: string; skills: { id: string; name: string; k: string }[]; rank(id: string): number; avail(): number; lvl: number; title: string; sfx(): void; log(t: string, c?: string): void; rerender(): void; recalc(): void }
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
export function icoOf(name: string): [string, string] { const hits: { i: number; e: string }[] = []; for (const [re, e] of ICO) { const m = re.exec(name); if (m && !hits.some((h) => h.e === e)) hits.push({ i: m.index, e }); }
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
.pv3{max-height:min(640px,calc(66vh / var(--ui,1)));overflow-y:auto;padding:14px 14px 18px;border-radius:12px;border:1px solid rgba(125,90,44,.4);background:radial-gradient(ellipse at 20% 20%,rgba(90,60,140,.14),transparent 55%),radial-gradient(ellipse at 85% 80%,rgba(217,162,79,.09),transparent 55%),rgba(6,4,10,.45)}
.pv3 h3{margin:0 0 10px;display:flex;align-items:center;gap:10px;font:700 12px Cinzel,serif;letter-spacing:.16em;text-transform:uppercase;color:#ffe08a}.pv3 h3::after{content:'';flex:1;height:1px;background:linear-gradient(90deg,rgba(125,90,44,.7),transparent)}.pv3 h3 small{font:600 10px Cinzel,serif;letter-spacing:.06em;color:#a08a60;padding:1px 8px;border:1px solid rgba(125,90,44,.5);border-radius:999px}
.pv3 .pgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px;margin-bottom:18px}.pv3 .pgrid.cls{grid-template-columns:repeat(auto-fill,minmax(340px,1fr));margin-bottom:0}
.pcard{border:1px solid rgba(125,90,44,.38);border-radius:12px;background:rgba(10,7,14,.4);padding:10px 12px 12px;opacity:.9}.pcard.open{opacity:1;border-color:rgba(217,162,79,.55);background:linear-gradient(180deg,rgba(40,28,14,.5),rgba(10,7,14,.45))}
.ptriw{overflow-x:auto;padding:4px 0 2px}.ptri{position:relative;margin:0 auto}.ptri svg{position:absolute;inset:0;overflow:visible}.ptri .tcell{position:absolute}.ptri .tcell .hcell{width:100%}.ptri .hcell em{text-shadow:0 1px 3px #000,0 0 6px #000}
.pcard .gtag{font:600 8.5px Cinzel,serif;font-style:normal;letter-spacing:.1em;text-transform:uppercase;color:#8ac8ff;border:1px solid rgba(138,200,255,.5);border-radius:999px;padding:1px 6px;margin-right:4px;vertical-align:1px}.pcard.grp.open{border-color:rgba(138,200,255,.45)}
.pcard .ph{display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin-bottom:8px}.pcard .ph b{font:600 12px Cinzel,serif;letter-spacing:.04em;color:#e8d6a8}.pcard .ph small{font:italic 10.5px Georgia,serif;color:#8a7a5a;white-space:nowrap}.pcard.open .ph small{color:#9ac87a}
.pcard .prow{display:flex;align-items:flex-start;justify-content:center;gap:0}.pcard .lnk{width:26px;height:2px;margin-top:32px;background:#4a3a22;flex:0 0 auto;border-radius:1px}.pcard .lnk.on{background:linear-gradient(90deg,#d9a24f,#ffe08a);box-shadow:0 0 5px #ffd070}
.hcell{display:flex;flex-direction:column;align-items:center;width:104px}.hcell .hx{width:66px;height:66px}.hcell .hx .e1{font-size:28px}.hcell .hx .e2{right:6px;bottom:8px;font-size:14px}.hcell em{margin-top:6px;font:600 9.5px/1.2 Cinzel,serif;font-style:normal;letter-spacing:.03em;text-align:center;color:#a8987a}.hcell.on em{color:#f2deb0}.hcell.lk em{color:#8a7a5e}
.hx.lock .e1,.hx.lock .e2{filter:grayscale(.55) brightness(.9)}.hx.lock{opacity:1}.hx.sel{filter:drop-shadow(0 0 8px rgba(255,224,138,.7))}
.tdet .pvi{font-size:30px;line-height:1}.tdet .pvsteps{display:grid;gap:6px;margin:12px 0}.tdet .pvsteps div{display:grid;grid-template-columns:24px 1fr;gap:9px;align-items:start;padding:8px 10px;border:1px solid rgba(125,90,44,.35);border-radius:8px;background:rgba(0,0,0,.25);font-size:12.5px;line-height:1.4;color:#9a8a6e}
.tdet .pvsteps b{width:22px;height:22px;display:grid;place-items:center;border-radius:50%;border:1px solid #5a4a30;font:700 10px Cinzel,serif;color:#8a7a5a}.tdet .pvsteps .on{color:#f2e4c0;border-color:rgba(217,162,79,.6);background:rgba(217,162,79,.09)}.tdet .pvsteps .on b{background:radial-gradient(circle at 50% 35%,#ffe6a8,#b8862e);color:#1a1206;border-color:#ffe08a}.tdet .pvsteps .nx{color:#d8c8a6;border-style:dashed;border-color:rgba(217,162,79,.5)}
.tdet .pvreq{margin:10px 0;padding:6px 10px;border-radius:8px;font-size:12px}.tdet .pvreq.lk{color:#c8a878;background:rgba(0,0,0,.3);border:1px solid rgba(125,90,44,.4)}.tdet .pvreq.ok{color:#b8e6b0;background:rgba(143,208,138,.08);border:1px solid rgba(143,208,138,.4)}
.tdet .pvbtn .minus{border-radius:10px}
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
  const tgtId = (p: CompSP) => p.n >= 9000 ? c.grupo?.idOf(p.target) ?? null : activeIdOf(C, c.skills, p.target); const rankOf = (id: string) => id.startsWith('g_') ? c.grupo?.rank(id) ?? 0 : c.rank(id);
  /* DEPENDÊNCIAS: nas passivas de habilidade, a 2ª do grupo pede a 1ª aprendida; nas de classe, cada uma pede a anterior da mesma fileira de 3 */
  const groups = new Map<string, CompSP[]>(); for (const p of C.spellPassives) { const g = groups.get(p.target) ?? []; g.push(p); groups.set(p.target, g); }
  const spPrev = (p: CompSP) => { const g = groups.get(p.target)!, i = g.indexOf(p); return i > 0 ? g[i - 1] : null; };
  const cpPrev = (p: CompCP) => { const i = C.classPassives.indexOf(p); return i % 3 ? C.classPassives[i - 1] : null; };
  const spState = (p: CompSP) => { const id = tgtId(p), r = passRank(c.kit, p.n), pv = spPrev(p); if (!id) return { r, why: 'a habilidade alvo ainda está em breve', id }; if (rankOf(id) < 3) return { r, why: `precisa de 3 pontos em ${p.target}`, id }; if (pv && !passRank(c.kit, pv.n)) return { r, why: `aprenda antes ${pv.name}`, id }; if (r >= 3) return { r, why: 'no máximo', id }; if (c.avail() <= 0) return { r, why: 'sem pontos', id }; return { r, why: '', id }; };
  const cpState = (p: CompCP) => { const r = passRank(c.kit, p.n), need = cpLvlReq(C, p), pv = cpPrev(p); if (c.lvl < need) return { r, why: `abre no nível ${need}` }; if (pv && !passRank(c.kit, pv.n)) return { r, why: `aprenda antes ${pv.name}` }; if (r >= p.levels) return { r, why: 'no máximo' }; if (c.avail() <= 0) return { r, why: 'sem pontos' }; return { r, why: '' }; };
  /* 11/11 (Erling: "essa tela precisa melhorar"): mesmo desenho da aba Habilidades. À esquerda, cada habilidade é um CARTÃO com as passivas dela
     (hexágono maior, o nome embaixo, o caminho entre elas); as de classe vêm em fileiras de três com o nível em que abrem. À direita, a ficha da
     passiva escolhida: os níveis em degraus, o que falta para abrir e os botões de aprender e devolver. Nada de barra espremida no rodapé. */
  const firstOpen = () => { for (const ps of groups.values()) for (const p of ps) if (!spState(p).why) return 'p' + p.n; for (const p of C.classPassives) if (!cpState(p).why) return 'c' + p.n; return C.spellPassives[0] ? 'p' + C.spellPassives[0].n : null; };
  if (!sel || !(sel[0] === 'p' ? C.spellPassives.some((p) => 'p' + p.n === sel) : C.classPassives.some((p) => 'c' + p.n === sel))) sel = firstOpen();
  const hexCell = (id: string, name: string, r: number, max: number, why: string, col: string) => `<div class="hcell ${r ? 'on' : ''} ${why && !r ? 'lk' : ''}">${hexHtml(id, name, r, max, !!why, sel === id, col)}<em>${name}</em></div>`;
  let left = '';
  for (const [t, ps] of groups) { const id = tgtId(ps[0]), rk = id ? rankOf(id) : 0, open = !!id && rk >= 3; left += `<div class="pcard ${open ? 'open' : ''} ${ps[0].n >= 9000 ? 'grp' : ''}"><div class="ph"><b>${ps[0].n >= 9000 ? '<i class="gtag">grupo</i> ' : ''}${t}</b><small>${!id ? 'em breve' : open ? `rank ${rk} · aberta` : `rank ${rk} de 3 para abrir`}</small></div><div class="prow">${ps.map((p, i) => { const s = spState(p); return `${i ? `<i class="lnk ${passRank(c.kit, ps[i - 1].n) ? 'on' : ''}"></i>` : ''}${hexCell('p' + p.n, p.name, s.r, 3, s.why, '#d9a24f')}`; }).join('')}</div></div>`; }
  /* 12/11 (Erling: "sobra uma caixa embaixo à toa; se são trincas, faça com triângulos virados para cima e para baixo, invertendo e se encaixando um ao lado
     do outro, para caber tudo numa linha só"): cada fileira de três é um TRIÂNGULO; o primeiro aponta para cima, o seguinte para baixo, e eles se encaixam
     numa faixa só. Em cima ficam as pontas dos que apontam para cima e as bases dos invertidos; embaixo, o contrário. A ordem dentro do triângulo segue a
     dependência: 1ª à esquerda, 2ª na ponta, 3ª à direita. */
  let right = ''; { /* o passo entre os pontos encolhe para a faixa caber na largura da janela (de 86 a 112 px) */ const S = Math.max(86, Math.min(112, Math.floor((Math.max(700, (root.clientWidth || 1300)) - 440) / 8))), YT = 62, YB = 196, N = Math.ceil(C.classPassives.length / 3); let it = 0, ib = 0, tri = '', cells = '';
    for (let k = 0; k < N; k++) { const row = C.classPassives.slice(k * 3, k * 3 + 3), up = k % 2 === 0, P: [number, number][] = [];
      if (up) { P.push([(ib + 0.5) * S, YB], [(it + 1) * S, YT], [(ib + 1.5) * S, YB]); ib += 2; it += 1; } else { P.push([(it + 1) * S, YT], [(ib + 0.5) * S, YB], [(it + 2) * S, YT]); it += 2; ib += 1; }
      const open = c.lvl >= cpLvlReq(C, row[0]), any = row.some((p) => passRank(c.kit, p.n) > 0), gx = (P[0][0] + P[2][0]) / 2, gy = up ? YB + 78 : YT - 50;
      /* o triângulo de fundo, um pouco maior que os três pontos */ const cxm = (P[0][0] + P[1][0] + P[2][0]) / 3, cym = (P[0][1] + P[1][1] + P[2][1]) / 3, big = P.map(([x, y]) => `${(cxm + (x - cxm) * 1.62).toFixed(0)},${(cym + (y - cym) * 1.5).toFixed(0)}`).join(' ');
      tri += `<polygon points="${big}" fill="${open ? 'rgba(154,200,122,.07)' : 'rgba(10,7,14,.35)'}" stroke="${any ? 'rgba(154,200,122,.7)' : open ? 'rgba(217,162,79,.5)' : 'rgba(125,90,44,.3)'}" stroke-width="1.2" stroke-linejoin="round"/>`;
      for (let q = 1; q < row.length; q++) { const on = passRank(c.kit, row[q - 1].n) > 0; tri += `<line x1="${P[q - 1][0]}" y1="${P[q - 1][1]}" x2="${P[q][0]}" y2="${P[q][1]}" stroke="${on ? '#ffe08a' : '#4a3a22'}" stroke-width="2" ${on ? '' : 'stroke-dasharray="3 5"'}/>`; }
      tri += `<text x="${gx}" y="${gy}" text-anchor="middle" fill="${open ? '#9ac87a' : '#8a7a5a'}" font-family="Cinzel, Georgia, serif" font-size="10.5" letter-spacing="1.2">FILEIRA ${k + 1} · NÍVEIS ${row.map((p) => cpLvlReq(C, p)).join(' · ')}</text>`;
      row.forEach((p, q) => { const st = cpState(p); cells += `<div class="tcell" style="left:${P[q][0] - (S - 6) / 2}px;top:${P[q][1] - 36}px;width:${S - 6}px">${hexCell('c' + p.n, p.name, st.r, p.levels, st.why, '#9ac87a')}</div>`; }); }
    const W = (Math.max(it + 1, ib) + 0.0) * S + 8, H = YB + 96;
    right = `<div class="ptri" style="width:${W}px;height:${H}px"><svg width="${W}" height="${H}">${tri}</svg>${cells}</div>`; }
  const sp = sel?.startsWith('p') ? C.spellPassives.find((p) => 'p' + p.n === sel) : null, cp = sel?.startsWith('c') ? C.classPassives.find((p) => 'c' + p.n === sel) : null;
  let det = `<p class="tip">Escolha uma passiva à esquerda. As de habilidade abrem com 3 pontos na habilidade; as de classe, com o nível. Umas pedem outras antes.</p>`;
  const detOf = (k: string, name: string, kind: string, col: string, r: number, max: number, why: string, body: string) => { const [e1] = icoOf(name);
    return `<div class="th"><div class="ic pvi" style="--c:${col}">${e1}</div><div><b>${name}</b><small>${kind} · ${r}/${max}</small></div></div>${body}
      <div class="pvreq ${why ? 'lk' : 'ok'}">${why ? (why === 'no máximo' ? '★ no máximo' : '🔒 ' + why) : '➤ pronta para receber ponto'}</div>
      <div class="pvbtn">${r ? `<button class="minus" data-dn="${k}" title="Devolver 1 ponto">−</button>` : ''}<button class="inv ${why ? 'off' : ''}" data-up="${k}" ${why ? 'disabled' : ''}>${why ? why : r ? `+1 nível (${r + 1}/${max})` : 'Aprender (1 ponto)'}</button></div>`; };
  if (sp) { const s = spState(sp); det = detOf('p' + sp.n, sp.name, `Passiva de ${sp.target}`, '#d9a24f', s.r, 3, s.why, `<div class="pvsteps">${sp.lv.map((t, i) => `<div class="${i < s.r ? 'on' : i === s.r ? 'nx' : ''}"><b>${i + 1}</b><span>${t}</span></div>`).join('')}</div>`); }
  if (cp) { const s = cpState(cp); det = detOf('c' + cp.n, cp.name, `Passiva de classe · abre no nível ${cpLvlReq(C, cp)}`, '#9ac87a', s.r, cp.levels, s.why, `<p class="tip">${cp.eff}</p>`); }
  const defs = `<svg width="0" height="0" style="position:absolute"><defs><radialGradient id="pvg1" cx="50%" cy="35%" r="70%"><stop offset="0" stop-color="#5a3e1a"/><stop offset="1" stop-color="#1e140a"/></radialGradient><radialGradient id="pvg2" cx="50%" cy="35%" r="70%"><stop offset="0" stop-color="#8a6420"/><stop offset="1" stop-color="#2a1c0a"/></radialGradient></defs></svg>`;
  const top = `<div class="tree-top"><span class="pts ${c.avail() ? 'on' : ''}">${c.avail()} ponto${c.avail() === 1 ? '' : 's'} para gastar</span><small>o mesmo monte das Habilidades e dos Talentos · ${spentK} nas passivas</small><button data-pvreset title="Redistribuir (gasta um Pergaminho do Esquecimento de Passivas)">↺ Redistribuir</button></div>`;
  shell(root, c, top, `${defs}<div class="tree-body"><div class="pv3"><h3>Passivas de habilidade<small>${C.spellPassives.length}</small></h3><div class="pgrid">${left}</div><h3>Passivas de classe<small>${C.classPassives.length}</small></h3><div class="ptriw">${right}</div></div><div class="tdet">${det}</div></div>`, 'Clique numa passiva para ver a ficha · Esc fecha');
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
/* 11/11 (Erling: "você melhorou tudo menos o compêndio"): o Compêndio no mesmo desenho das outras abas. Em cima, a apresentação da classe num
   cartão de leitura; à esquerda, cada magia num cartão com o DESENHO dela (o mesmo da barra), o tipo, o nível, a tecla e os pontos que você já
   pôs; as combinações viram receitas (as peças em etiquetas, o resultado embaixo); à direita, a ficha em blocos e cada runa no seu cartão. */
const CPCSS = `<style id="cp3css">
.cp3{max-height:min(660px,calc(68vh / var(--ui,1)));overflow-y:auto;padding:14px 14px 18px;border-radius:12px;border:1px solid rgba(125,90,44,.4);background:radial-gradient(ellipse at 20% 20%,rgba(90,60,140,.14),transparent 55%),radial-gradient(ellipse at 85% 80%,rgba(217,162,79,.09),transparent 55%),rgba(6,4,10,.45)}
.cp3 h3{margin:16px 0 10px;display:flex;align-items:center;gap:10px;font:700 12px Cinzel,serif;letter-spacing:.16em;text-transform:uppercase;color:#ffe08a}.cp3 h3:first-child{margin-top:0}.cp3 h3::after{content:'';flex:1;height:1px;background:linear-gradient(90deg,rgba(125,90,44,.7),transparent)}.cp3 h3 small{font:600 10px Cinzel,serif;letter-spacing:.06em;color:#a08a60;padding:1px 8px;border:1px solid rgba(125,90,44,.5);border-radius:999px}
.cpintro{display:grid;grid-template-columns:auto 1fr;gap:16px;align-items:center;margin:2px 0 12px;padding:12px 16px;border:1px solid rgba(125,90,44,.45);border-radius:12px;background:linear-gradient(180deg,rgba(40,28,14,.45),rgba(10,7,14,.4))}
.cpintro .cpn{text-align:center;padding:6px 14px;border-right:1px solid rgba(125,90,44,.4)}.cpintro .cpn b{display:block;font:700 26px Cinzel,serif;color:#ffe08a;line-height:1}.cpintro .cpn small{display:block;margin-top:4px;font:600 9px Cinzel,serif;letter-spacing:.14em;text-transform:uppercase;color:#a08a60}
.cpintro p{margin:0;font-size:13px;line-height:1.55;color:#d8ccb0;column-count:2;column-gap:26px}
.cpg{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:9px}
.cpc{display:grid;grid-template-columns:48px 1fr;gap:10px;align-items:center;padding:9px 10px;border:1px solid rgba(125,90,44,.4);border-radius:12px;background:rgba(10,7,14,.42);cursor:pointer;transition:border-color .15s,transform .12s,box-shadow .15s}.cpc:hover{border-color:rgba(217,162,79,.8);transform:translateY(-1px)}
.cpc.sel{border-color:#ffe08a;box-shadow:0 0 0 2px rgba(255,224,138,.2),0 0 16px rgba(255,220,120,.35);background:linear-gradient(180deg,rgba(50,36,16,.6),rgba(12,8,14,.5))}.cpc.new{opacity:.72}
.cpc .ci{width:48px;height:48px;border-radius:12px;display:grid;place-items:center;font-size:22px;border:1px solid color-mix(in srgb,var(--c) 50%,#7d5a2c);background:radial-gradient(circle at 50% 28%,color-mix(in srgb,var(--c) 22%,#1c1424),#0b0810 82%);box-shadow:inset 0 0 10px #000}.cpc .ci svg{width:36px;height:36px;display:block}
.cpc b{display:block;font:600 12.5px/1.2 Cinzel,serif;color:#f2deb0}.cpc .cm{display:flex;flex-wrap:wrap;gap:4px;margin-top:5px}.cpc .cm span{font:600 9px Cinzel,serif;letter-spacing:.06em;text-transform:uppercase;padding:1px 6px;border-radius:999px;border:1px solid rgba(125,90,44,.5);color:#b9a888}.cpc .cm .k{border-color:rgba(217,162,79,.8);color:#ffe08a}.cpc .cm .soon{border-color:#6a4a9a;color:#c9a0ff}
.cpc .pp{display:flex;gap:1.5px;margin-top:6px}.cpc .pp i{flex:1;height:3px;border-radius:1px;background:rgba(255,255,255,.12)}.cpc .pp i.f{background:#ffd24a;box-shadow:0 0 4px #ffcf7a}
.cpcombo{padding:11px 13px;margin:0 0 8px;border:1px solid rgba(125,90,44,.4);border-radius:12px;background:rgba(10,7,14,.42)}.cpcombo b{display:block;font:700 13px Cinzel,serif;color:#ffe08a;margin-bottom:6px}.cpcombo .rc{display:flex;flex-wrap:wrap;gap:5px;align-items:center;margin-bottom:7px}.cpcombo .rc span{padding:2px 9px;border-radius:999px;border:1px solid rgba(217,162,79,.5);background:rgba(217,162,79,.08);font-size:11.5px;color:#f0dcae}.cpcombo .rc i{font-style:normal;color:#7a6a50}.cpcombo .rc em{font-style:italic;font-size:11.5px;color:#a89878}.cpcombo p{margin:0;font-size:12.5px;line-height:1.5;color:#d8ccb0}
.tdet.cpd{max-height:min(660px,calc(68vh / var(--ui,1)));overflow-y:auto}.tdet.cpd .th .ic svg{width:44px;height:44px}.tdet.cpd .cchips{display:flex;flex-wrap:wrap;gap:5px;margin:10px 0 0}.tdet.cpd .cchips span{font:600 9.5px Cinzel,serif;letter-spacing:.08em;text-transform:uppercase;padding:2px 8px;border-radius:999px;border:1px solid rgba(125,90,44,.55);color:#c8b890}.tdet.cpd .cchips .ok{border-color:rgba(143,208,138,.5);color:#b8e6b0}.tdet.cpd .cchips .soon{border-color:#6a4a9a;color:#c9a0ff}
.tdet.cpd .cdesc{margin:12px 0;display:grid;gap:6px}.tdet.cpd .cdesc p{margin:0;font-size:13px;line-height:1.5;color:#e2d6bc}.tdet.cpd .cdesc p:first-child{font-size:14px;color:#f2e6c8}
.tdet.cpd h5{margin:14px 0 8px;display:flex;align-items:center;gap:8px;font:600 10px Cinzel,serif;letter-spacing:.14em;text-transform:uppercase;color:#a89878}.tdet.cpd h5::after{content:'';flex:1;height:1px;background:linear-gradient(90deg,rgba(125,90,44,.6),transparent)}
.tdet.cpd .rcard{display:grid;grid-template-columns:30px 1fr;gap:10px;align-items:start;padding:9px 10px;margin-bottom:6px;border:1px solid color-mix(in srgb,var(--c) 35%,rgba(125,90,44,.3));border-radius:10px;background:linear-gradient(90deg,color-mix(in srgb,var(--c) 9%,transparent),rgba(0,0,0,.2))}.tdet.cpd .rcard .ri{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;border:1px solid color-mix(in srgb,var(--c) 60%,transparent);background:rgba(0,0,0,.35)}.tdet.cpd .rcard b{display:block;font:700 11.5px Cinzel,serif;letter-spacing:.04em;color:var(--c);margin-bottom:2px}.tdet.cpd .rcard span{font-size:12.5px;line-height:1.45;color:#d8ccb0}
.tdet.cpd .desp{padding:9px 11px;border:1px solid rgba(255,240,189,.5);border-radius:10px;background:rgba(255,240,189,.06);font-size:12.5px;color:#fff0bd}
@media (max-width:1100px){.cpintro p{column-count:1}}
</style>`;
export function renderCompendium(root: HTMLElement, c: Ctx) {
  const C = compOf(c.kit); if (!C) { shell(root, c, '', '<p class="tip" style="padding:30px;text-align:center">Abrindo o compêndio da classe…</p>', ''); setTimeout(c.rerender, 400); return; }
  if (!document.getElementById('cp3css')) document.head.insertAdjacentHTML('beforeend', CPCSS);
  const inGame = (a: Comp['actives'][number]) => c.skills.find((s) => (a.key && s.k === a.key) || s.name.toLowerCase() === a.name.toLowerCase());
  const artOf = (id?: string) => { if (!id) return null; for (const L of Object.values(KITS)) { const d = L?.find((q) => q.id === id); if (d) return d; } return null; };
  const glyph = (a: Comp['actives'][number]) => a.sup ? '✹' : a.aura ? '☀' : '✦';
  const card = (a: Comp['actives'][number]) => { const g = inGame(a), art = artOf(g?.id), rk = g ? c.rank(g.id) : 0;
    return `<div class="cpc ${g ? 'game' : 'new'} ${compSel === a.n ? 'sel' : ''}" data-cs="${a.n}" style="--c:${art?.c ?? (g ? '#d9a24f' : '#9a7ad0')}"><div class="ci">${art?.svg ?? glyph(a)}</div><div><b>${a.name}</b><div class="cm"><span>${a.type}</span><span>nível ${a.lvl}</span>${a.key ? `<span class="k">${a.key}</span>` : ''}${g ? '' : '<span class="soon">em breve</span>'}</div>${g ? `<div class="pp">${Array.from({ length: 10 }, (_, k) => `<i class="${k < rk ? 'f' : ''}"></i>`).join('')}</div>` : ''}</div></div>`; };
  const sec = (t: string, L: Comp['actives']) => L.length ? `<h3>${t}<small>${L.length}</small></h3><div class="cpg">${L.map(card).join('')}</div>` : '';
  const combo = (x: string) => { const t = x.replace(/\*\*/g, ''), ci = t.indexOf(':'), ai = t.indexOf('→'), name = ci > 0 ? t.slice(0, ci).trim() : 'Combinação', mid = (ai > 0 ? t.slice(ci + 1, ai) : t.slice(ci + 1)).trim(), res = ai > 0 ? t.slice(ai + 1).trim() : '';
    const wi = mid.search(/,\s*com\s/), parts = (wi > 0 ? mid.slice(0, wi) : mid).split(' + ').map((q) => q.trim()).filter(Boolean), withT = wi > 0 ? mid.slice(wi + 1).trim() : '';
    return `<div class="cpcombo"><b>${name}</b><div class="rc">${parts.map((q, i) => `${i ? '<i>+</i>' : ''}<span>${q}</span>`).join('')}${withT ? `<em>${withT}</em>` : ''}</div>${res ? `<p>${res.charAt(0).toUpperCase() + res.slice(1)}</p>` : ''}</div>`; };
  const A = C.actives.find((a) => a.n === compSel) ?? C.actives[0], g = inGame(A), art = artOf(g?.id), rkA = g ? c.rank(g.id) : 0;
  const sentences = A.desc.split(/(?<=[.!?])\s+(?=[A-ZÀ-Ú])/).filter(Boolean);
  const det = `<div class="th"><div class="ic" style="--c:${art?.c ?? (g ? '#9ac87a' : '#c9a0ff')};font-size:26px;display:grid;place-items:center">${art?.svg ?? glyph(A)}</div><div><b>${A.name}</b><small>${A.type} · nível ${A.lvl}</small></div></div>
    <div class="cchips">${A.key ? `<span>tecla ${A.key}</span>` : ''}${g ? `<span class="ok">no jogo · ${rkA}/10 pontos</span>` : '<span class="soon">em breve</span>'}${A.sup ? '<span>suprema · 3 encaixes de runa</span>' : A.aura ? '<span>bênção ou aura</span>' : ''}</div>
    <div class="cdesc">${sentences.map((t) => `<p>${t}</p>`).join('')}</div>
    <h5>O que cada runa faz nesta magia</h5>
    ${Object.entries(A.runes).map(([k, v]) => `<div class="rcard" style="--c:${RC[k]}"><div class="ri">${runaSvg(runaIdx(k), 16).replace('<svg', `<svg style="color:${RC[k]}"`)}</div><div><b>${RN[k]}</b><span>${v}</span></div></div>`).join('')}${A.desperta ? `<div class="desp">✹ <b>Desperta</b> ${A.desperta}</div>` : ''}`;
  const top = `<div class="cpintro"><div class="cpn"><b>${C.actives.filter(inGame).length}/${C.actives.length}</b><small>magias no jogo</small></div><p>${C.intro}</p></div>`;
  shell(root, c, top, `<div class="tree-body"><div class="cp3">${sec('Ativas', C.actives.filter((a) => !a.sup && !a.aura))}${sec('Bênçãos e auras', C.actives.filter((a) => a.aura))}${sec('Supremas', C.actives.filter((a) => a.sup))}${C.combos.length ? `<h3>Combinações assinatura<small>${C.combos.length}</small></h3>${C.combos.map(combo).join('')}` : ''}</div><div class="tdet cpd">${det}</div></div>`, 'Clique numa magia para ver a ficha e as runas · "em breve" ainda não está no jogo · Esc fecha');
  root.onclick = (e) => { const t = (e.target as HTMLElement).closest('[data-cs]') as HTMLElement | null; if (!t) return; e.stopPropagation(); compSel = +t.dataset.cs!; c.rerender(); };
}
/** o texto próprio de cada runa nesta magia (para a ficha da magia, na aba Magias) */
export function runeTextFor(kit: string, sk: { id: string; name: string; k: string }): Record<string, string> | null { const C = compOf(kit); if (!C) return null; return compActiveFor(C, sk)?.runes ?? null; }
