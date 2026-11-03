/* As abas PASSIVAS e COMPÊNDIO da Árvore Kármica (03/11). Mesmo desenho das abas Magias e Talentos (tree-top, ficha à direita).
   Passivas: as 25 de magia (3 níveis, abrem com a magia alvo no rank 3) e as 15 de classe (abrem por nível). Os pontos são os da Árvore.
   Compêndio: as 20 ativas da classe com a ficha e o que cada runa faz nelas — as que ainda não estão no jogo aparecem "em breve". */
import { type Comp, type CompSP, type CompCP, compOf, passRank, setPass, resetPass, activeIdOf, compActiveFor, spApplied } from '../passivas';
import { runaSvg, runaIdx } from '../runas';

interface Ctx { kit: string; skills: { id: string; name: string; k: string }[]; rank(id: string): number; avail(): number; lvl: number; title: string; sfx(): void; log(t: string, c?: string): void; rerender(): void; recalc(): void }
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
let sel: string | null = null, sub: 'magia' | 'classe' = 'magia', compSel = 1;
const cpLvlReq = (c: Comp, p: CompCP) => 3 + c.classPassives.indexOf(p) * 3;

function shell(root: HTMLElement, c: Ctx, top: string, body: string, foot: string) {
  if (!document.getElementById('pvcss')) document.head.insertAdjacentHTML('beforeend', CSS);
  root.innerHTML = `<div class="pn skpn"><h2>🌳 Árvore Kármica — ${c.title} <button data-x>✕</button></h2>${top}${body}<small class="ft">${foot}</small></div>`;
  root.style.display = 'flex';
}
export function renderPassives(root: HTMLElement, c: Ctx) {
  const C = compOf(c.kit); if (!C) { shell(root, c, '', '<p class="tip" style="padding:30px;text-align:center">Abrindo o compêndio da classe…</p>', ''); setTimeout(c.rerender, 400); return; }
  const spentK = C.spellPassives.reduce((a, p) => a + passRank(c.kit, p.n), 0) + C.classPassives.reduce((a, p) => a + passRank(c.kit, p.n), 0);
  const tgtId = (p: CompSP) => activeIdOf(C, c.skills, p.target);
  const spState = (p: CompSP) => { const id = tgtId(p), r = passRank(c.kit, p.n); if (!id) return { r, why: 'a magia alvo ainda está em breve', id }; if (c.rank(id) < 3) return { r, why: `precisa de 3 pontos em ${p.target}`, id }; if (r >= 3) return { r, why: 'no máximo', id }; if (c.avail() <= 0) return { r, why: 'sem pontos', id }; return { r, why: '', id }; };
  const cpState = (p: CompCP) => { const r = passRank(c.kit, p.n), need = cpLvlReq(C, p); if (c.lvl < need) return { r, why: `abre no nível ${need}` }; if (r >= p.levels) return { r, why: 'no máximo' }; if (c.avail() <= 0) return { r, why: 'sem pontos' }; return { r, why: '' }; };
  const pips = (r: number, m: number) => `<div class="pips">${Array.from({ length: m }, (_, i) => `<span class="${i < r ? 'on' : ''}"></span>`).join('')}</div>`;
  let list = '';
  if (sub === 'magia') {
    const groups = new Map<string, CompSP[]>(); for (const p of C.spellPassives) { const g = groups.get(p.target) ?? []; g.push(p); groups.set(p.target, g); }
    for (const [t, ps] of groups) { const id = tgtId(ps[0]); list += `<h4>${t}<small>${id ? `magia no rank ${c.rank(id)}` : 'magia em breve'}</small></h4><div class="pvg">${ps.map((p) => { const s = spState(p); return `<div class="pvc ${s.r ? 'on' : ''} ${!s.id ? 'lock new' : s.why && !s.r ? 'lock' : ''} ${sel === 'p' + p.n ? 'sel' : ''}" data-pv="p${p.n}"><b>${p.name}</b><i>${p.lv[Math.max(0, s.r - 1)]}</i>${pips(s.r, 3)}</div>`; }).join('')}</div>`; }
  } else list = `<h4>Passivas de classe<small>abrem com o nível</small></h4><div class="pvg">${C.classPassives.map((p) => { const s = cpState(p); return `<div class="pvc ${s.r ? 'on' : ''} ${s.why && !s.r && s.why.startsWith('abre') ? 'lock' : ''} ${sel === 'c' + p.n ? 'sel' : ''}" data-pv="c${p.n}"><b>${p.name}</b><i>${s.why.startsWith('abre') ? s.why : p.levels + ' níveis'}</i>${pips(s.r, p.levels)}</div>`; }).join('')}</div>`;
  /* a ficha */
  let det = `<div class="th"><div class="ic" style="--c:#ffe08a;font-size:24px;display:grid;place-items:center">✦</div><div><b>Passivas</b><small>${C.title}</small></div></div><p class="tip">${C.intro}</p><p class="tip">As passivas de magia melhoram uma magia só e abrem quando ela tem 3 pontos. As de classe abrem com o nível. O ponto é o mesmo da Árvore Kármica.</p>`;
  const sp = sel?.startsWith('p') ? C.spellPassives.find((p) => 'p' + p.n === sel) : null, cp = sel?.startsWith('c') ? C.classPassives.find((p) => 'c' + p.n === sel) : null;
  if (sp) { const s = spState(sp); det = `<div class="th"><div class="ic" style="--c:#d9a24f;font-size:22px;display:grid;place-items:center">✧</div><div><b>${sp.name}</b><small>Passiva de magia · ${sp.target} · ${s.r}/3</small></div></div>
      <div class="pvlv">${sp.lv.map((t, i) => `<div class="${i < s.r ? 'on' : ''}"><b>NÍVEL ${i + 1}</b>${t}</div>`).join('')}</div>
      <small class="nx">${s.id ? `No jogo: ${spApplied(sp, Math.max(1, s.r))}${s.r ? '' : ' (no nível 1)'} em ${sp.target}.` : 'A magia que ela melhora ainda não está no jogo: a passiva abre junto com ela.'}</small>
      <div class="pvbtn"><button class="inv ${s.why ? 'off' : ''}" data-up="p${sp.n}" ${s.why ? 'disabled' : ''}>${s.why || (s.r ? `+1 nível (${s.r + 1}/3)` : 'Aprender (1 ponto)')}</button>${s.r ? `<button class="minus" data-dn="p${sp.n}" title="Devolver 1 ponto">−</button>` : ''}</div>`; }
  if (cp) { const s = cpState(cp); det = `<div class="th"><div class="ic" style="--c:#9ac87a;font-size:22px;display:grid;place-items:center">❖</div><div><b>${cp.name}</b><small>Passiva de classe · ${s.r}/${cp.levels} · abre no nível ${cpLvlReq(C, cp)}</small></div></div>
      <p class="tip">${cp.eff}</p><div class="pvbtn"><button class="inv ${s.why ? 'off' : ''}" data-up="c${cp.n}" ${s.why ? 'disabled' : ''}>${s.why || (s.r ? `+1 nível (${s.r + 1}/${cp.levels})` : 'Aprender (1 ponto)')}</button>${s.r ? `<button class="minus" data-dn="c${cp.n}" title="Devolver 1 ponto">−</button>` : ''}</div>`; }
  const top = `<div class="tree-top"><span class="pts ${c.avail() ? 'on' : ''}">${c.avail()} ponto${c.avail() === 1 ? '' : 's'} para gastar</span><small>Nível ${c.lvl} · os mesmos pontos da Árvore · ${spentK} nas passivas</small><button data-pvreset title="Devolver os pontos das passivas">↺ Redistribuir</button></div>
    <div class="pvsub"><button data-sub="magia" class="${sub === 'magia' ? 'on' : ''}">Passivas de magia (25)</button><button data-sub="classe" class="${sub === 'classe' ? 'on' : ''}">Passivas de classe (15)</button></div>`;
  shell(root, c, top, `<div class="pvw"><div class="pvl">${list}</div><div class="tdet">${det}</div></div>`, 'Clique numa passiva para ver a ficha · os pontos são um monte só com as magias · Esc fecha');
  root.onclick = (e) => { const t = (e.target as HTMLElement).closest('[data-pv],[data-up],[data-dn],[data-sub],[data-pvreset]') as HTMLElement | null; if (!t) return; e.stopPropagation();
    if (t.dataset.sub) { sub = t.dataset.sub as 'magia' | 'classe'; sel = null; c.rerender(); return; }
    if (t.dataset.pv) { sel = t.dataset.pv; c.rerender(); return; }
    if (t.dataset.pvreset) { resetPass(c.kit); c.recalc(); c.log('Passivas redistribuídas.', '#b9c6e0'); c.rerender(); return; }
    const up = t.dataset.up, dn = t.dataset.dn, k = up ?? dn; if (!k) return; const n = +k.slice(1), r = passRank(c.kit, n);
    if (up) { const ok = k[0] === 'p' ? !spState(C.spellPassives.find((p) => p.n === n)!).why : !cpState(C.classPassives.find((p) => p.n === n)!).why; if (!ok) return; setPass(c.kit, n, r + 1); c.sfx(); }
    else setPass(c.kit, n, r - 1);
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
