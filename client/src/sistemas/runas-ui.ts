/* Os ENCAIXES DE RUNA na ficha da magia (Árvore Kármica, K). 03/11. Clique num encaixe vazio: aparecem as runas da mochila; clique numa
   runa: encaixa. Clique na runa encaixada: tira (custa ouro, a runa volta inteira para a mochila). Regras: runas-magia.ts. */
import { RFAM, RNAME, RNAT, RCOL, RICON, GRAUS, GMUL, parseRune, runesOf, setRune, slotsFor, unslotCost, frestaSoul, frestaText } from '../runas-magia';
import { runaSvg, runaIdx } from '../runas';

interface Ctx { id: string; kit: string; rank: number; inv: { bag: Record<string, number>; take(id: string, n?: number): boolean; grant(id: string, n: number): void }; game: { st: { gold: number }; logMsg(t: string, c?: string): void }; sfx(): void; rerender(): void }
const CSS = `<style id="rncss">
.tdet .rnh{display:block;font:600 10px Cinzel,serif;letter-spacing:.12em;text-transform:uppercase;color:#a08a60;margin:12px 0 6px}.tdet .rnh small{display:block;margin-top:2px;font:11px Georgia,serif;letter-spacing:0;text-transform:none;color:#8a7a5a}
.tdet .rns{display:flex;gap:8px;margin-bottom:6px}
.tdet .rn{flex:1;min-width:0;display:flex;gap:8px;align-items:center;border:1px dashed #5a4a30;background:rgba(0,0,0,.25);padding:6px 8px;cursor:pointer;border-radius:2px;color:#a89878;font-size:12px;text-align:left}
.tdet .rn:hover{border-color:#ffe08a;color:#ffe08a}.tdet .rn.lock{cursor:default;opacity:.5}.tdet .rn.lock:hover{border-color:#5a4a30;color:#a89878}
.tdet .rn.on{border-style:solid;border-color:var(--c);color:#e8dcc0;background:radial-gradient(circle at 20% 50%,color-mix(in srgb,var(--c) 22%,transparent),rgba(0,0,0,.3) 70%);box-shadow:0 0 10px color-mix(in srgb,var(--c) 35%,transparent)}
.tdet .rn svg{flex:0 0 auto;color:var(--c,#8a7a5a);filter:drop-shadow(0 0 4px color-mix(in srgb,var(--c,#000) 70%,transparent))}
.tdet .rn b{display:block;font:700 12px Cinzel,serif;color:var(--c)}.tdet .rn i{font-style:normal;font-size:10.5px;color:#a89878}
.tdet .rnp{border:1px solid #5a4a30;background:rgba(0,0,0,.35);padding:6px;margin-bottom:6px;max-height:170px;overflow:auto}
.tdet .rnp button{display:flex;width:100%;gap:8px;align-items:center;background:transparent;border:0;border-bottom:1px dotted rgba(125,90,44,.5);color:#d8c8a6;padding:4px;cursor:pointer;text-align:left;font-size:12px}.tdet .rnp button:hover{background:rgba(255,224,138,.08)}
.tdet .rnp button b{color:var(--c);font:700 12px Cinzel,serif}.tdet .rnp .none{font-size:12px;color:#a89878;font-style:italic;padding:4px}
.tdet .rnfx{font-size:12px;color:#c8b890;line-height:1.45;margin-bottom:4px}.tdet .rnfx div{padding:2px 0}.tdet .rnfx b{color:var(--c)}
.tdet .rnsoul{font-size:11px;color:#a890d8;font-style:italic}
</style>`;
const hex = (n: number) => '#' + n.toString(16).padStart(6, '0');
let picking: number | null = null, pickFor = '';

export function runeSlots(root: HTMLElement, c: Ctx) {
  const det = root.querySelector('.tdet'); if (!det) return;
  if (pickFor !== c.kit + c.id) { picking = null; pickFor = c.kit + c.id; }
  if (!document.getElementById('rncss')) document.head.insertAdjacentHTML('beforeend', CSS);
  const n = slotsFor(c.rank), cur = runesOf(c.kit, c.id);
  const slot = (i: number) => {
    const need = i === 0 ? 3 : 7;
    if (i >= n) return `<button class="rn lock" disabled>${runaSvg(0, 22).replace('<svg', '<svg style="opacity:.25"')}<span><b style="color:#8a7a5a">Encaixe ${i + 1}</b><i>abre no rank ${need}</i></span></button>`;
    const r = cur[i] ? parseRune(cur[i]) : null;
    if (!r) return `<button class="rn" data-rslot="${i}">${runaSvg(0, 22).replace('<svg', '<svg style="opacity:.35"')}<span><b style="color:#d9c08a">+ Encaixar runa</b><i>${picking === i ? 'escolha abaixo' : 'clique para escolher'}</i></span></button>`;
    return `<button class="rn on" data-rout="${i}" style="--c:${hex(RCOL[r.f])}" title="Tirar a runa (${unslotCost(r.g)} 🪙, ela volta para a mochila)">${runaSvg(runaIdx(r.f), 22)}<span><b>${RNAME[r.f]}</b><i>${GRAUS[r.g]} · ×${GMUL[r.g]} · tirar: ${unslotCost(r.g)} 🪙</i></span></button>`;
  };
  const used = new Set(cur.filter(Boolean).map((x) => parseRune(x)?.f));
  let pick = '';
  if (picking !== null && picking < n) {
    const have = Object.keys(c.inv.bag).filter((k) => parseRune(k) && c.inv.bag[k] > 0).sort((a, b) => RFAM.indexOf(parseRune(a)!.f) - RFAM.indexOf(parseRune(b)!.f) || parseRune(b)!.g - parseRune(a)!.g);
    pick = `<div class="rnp">${have.length ? have.map((k) => { const r = parseRune(k)!, dup = used.has(r.f); return `<button data-rin="${k}" ${dup ? 'disabled style="opacity:.4"' : ''} style="--c:${hex(RCOL[r.f])}">${runaSvg(runaIdx(r.f), 18).replace('<svg', `<svg style="color:${hex(RCOL[r.f])}"`)}<span><b>${RNAME[r.f]}</b> ${GRAUS[r.g]} ×${c.inv.bag[k]}${dup ? ' — já está nesta magia' : ''}</span></button>`; }).join('') : '<div class="none">Nenhuma runa na mochila. As runas são do jogo avançado: só caem de monstros do nível 20 para cima, e muito mais de elites e chefes.</div>'}</div>`;
  }
  const fx = cur.map((x) => (x ? parseRune(x) : null)).filter((r): r is NonNullable<ReturnType<typeof parseRune>> => !!r).map((r) => `<div style="--c:${hex(RCOL[r.f])}"><b>${RICON[r.f]} ${RNAME[r.f]}:</b> ${RNAT[r.f]}</div>`).join('');
  const box = document.createElement('div'); box.className = 'rnbox';
  box.innerHTML = `<div class="rnh">Runas kármicas <small>1º encaixe no rank 3 · 2º no rank 7</small></div><div class="rns">${slot(0)}${slot(1)}</div>${pick}${fx ? `<div class="rnfx">${fx}</div>` : ''}${cur.some((x) => x && parseRune(x)?.f === 'fresta') ? `<div class="rnsoul">A tua alma está ${frestaText(frestaSoul())}.</div>` : ''}`;
  const btn = det.querySelector('.inv'); if (btn) det.insertBefore(box, btn); else det.appendChild(box);
  box.addEventListener('click', (e) => { e.stopPropagation(); const t = (e.target as HTMLElement).closest('button') as HTMLButtonElement | null; if (!t || t.disabled) return;
    if (t.dataset.rslot) { const i = +t.dataset.rslot; picking = picking === i ? null : i; c.rerender(); return; }
    if (t.dataset.rin && picking !== null) { const k = t.dataset.rin; if (!c.inv.take(k, 1)) return; setRune(c.kit, c.id, picking, k); const r = parseRune(k)!; c.game.logMsg(`ᛟ ${RNAME[r.f]} (${GRAUS[r.g]}) encaixada.`, hex(RCOL[r.f])); picking = null; c.sfx(); c.rerender(); return; }
    if (t.dataset.rout) { const i = +t.dataset.rout, k = cur[i], r = k ? parseRune(k) : null; if (!r) return; const cost = unslotCost(r.g); if (c.game.st.gold < cost) { c.game.logMsg(`Falta ouro para tirar a runa: ${cost} 🪙.`, '#ff9a8a'); return; }
      c.game.st.gold -= cost; setRune(c.kit, c.id, i, ''); c.inv.grant(k, 1); c.game.logMsg(`ᛟ ${RNAME[r.f]} voltou para a mochila (−${cost} 🪙).`, '#d9c08a'); c.rerender(); } });
}
