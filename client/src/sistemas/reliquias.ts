/* RELÍQUIAS DOS CAMINHANTES: tocar, a janela das relíquias (mapa das conhecidas, vilas, masmorras, lugares, Ormund) e a viagem rápida. Saiu do main.ts (02/11). */
import { landOf } from '../world';
import { TILE_M as T } from '@karmika/shared';
import { heightAt } from '../world';
import type { ReliquiasCtx } from '../main';

export function createReliquias(K: ReliquiasCtx) {
const relicEl = document.createElement('div'); relicEl.id = 'relics'; document.body.appendChild(relicEl); let relicOpen = false;
function touchRelic(name: string) {
  if (K.knowsRelic(name)) { openRelics(name); return; }
  K.relicsKnown.add(name); localStorage.setItem('karmika.relics.v1', JSON.stringify([...K.relicsKnown]));
  K.hero.act('cast'); if (K.profile?.eye) K.addKarma(4); { const xp = Math.round(K.game.xpNeed() * 0.06); K.game.gainXp(xp); K.game.logMsg(`✦ Relíquia marcada: ${name} (+${xp} XP). Agora ela lembra de você.`, '#8ad0ff'); }
  for (let i = 0; i < 40; i++) K.particles.spawn(K.heroPos.x + (Math.random() - 0.5), 0.3, K.heroPos.z + (Math.random() - 0.5), { vy: 1.5 + Math.random() * 3, life: 1.2, s0: 0.5, s1: 0.05, c0: 0xbfe6ff, c1: 0x4a9aff, a: 1, drag: 1 });
  K.game.logMsg(`✦ ${name} lembra de você. (${K.relicsKnown.size} relíquia${K.relicsKnown.size > 1 ? 's' : ''} conhecida${K.relicsKnown.size > 1 ? 's' : ''})`, '#8ad0ff');
  if (K.relicsKnown.size === 1) K.game.logMsg('Encontre outra relíquia para viajar entre elas.', '#b9c6e0');
}
const relicNameAt = (gx: number, gy: number) => K.city.relics.find((r) => r.x === gx && r.y === gy)?.name ?? null;
/* lugares que você já descobriu (chegou perto): cidades, vilas, masmorras e lugares — a lista rápida das Relíquias usa isto */
const discovered = new Set<string>((() => { try { return JSON.parse(localStorage.getItem('karmika.descobertos.v1') || '[]') as string[]; } catch { return []; } })());
setInterval(() => { if (K.inside) return; const hx = K.state.fx, hy = K.state.fy; let ch = false; const see = (n: string, x: number, y: number, r: number) => { if (!discovered.has(n) && Math.hypot(x - hx, y - hy) < r) { discovered.add(n); ch = true; } };
  for (const st of K.city.settlements) see(st.name, st.x, st.y, st.radius + 10); for (const p of K.city.pois) see(p.name, p.x, p.y, 14); try { for (const e of K.dgs.entrances) see(e.d.name, e.x, e.y, 14); } catch { /* */ }
  if (ch) try { localStorage.setItem('karmika.descobertos.v1', JSON.stringify([...discovered])); } catch { /* */ } }, 1000);
let relTab: 'rel' | 'vil' | 'dg' | 'poi' | 'orm' = 'rel', relZoom = 1, relCx = 0.5, relCy = 0.5, relSel: { x: number; y: number; name: string } | null = null;
function openRelics(from: string) {
  const here = K.city.relics.find((r) => r.name === from), land = here ? landOf(here.x, here.y) : 0, others = K.city.relics.filter((r) => K.knowsRelic(r.name) && r.name !== from && landOf(r.x, r.y) === land); /* 07/11: as pedras de uma ilha só levam para a mesma ilha; as do continente não levam para as ilhas */
  relicOpen = true; relZoom = 1; relCx = 0.5; relCy = 0.5; relSel = null;
  const S = 520;
  const places = () => { const h0 = K.hereT(), dist = (x: number, y: number) => Math.hypot(x - h0.x, y - h0.y) * T;
    const vil = K.city.settlements.filter((q) => discovered.has(q.name)).map((q) => ({ name: q.name, x: q.x, y: q.y, sub: q.kind === 'city' ? 'Cidade' : 'Vila', d: dist(q.x, q.y) }));
    let dg: { name: string; x: number; y: number; sub: string; d: number }[] = []; try { dg = K.dgs.entrances.filter((e) => discovered.has(e.d.name)).map((e) => ({ name: e.d.name, x: e.x, y: e.y, sub: `${e.d.kind === 'grupo' ? 'Masmorra de grupo' : 'Caverna'} · Nv ${e.lvl[0]}–${e.lvl[1]}`, d: dist(e.x, e.y) })); } catch { /* */ }
    const poi = K.city.pois.filter((q) => discovered.has(q.name)).map((q) => ({ name: q.name, x: q.x, y: q.y, sub: 'Lugar', d: dist(q.x, q.y) }));
    return { vil: vil.sort((a, b) => a.d - b.d), dg: dg.sort((a, b) => a.d - b.d), poi: poi.sort((a, b) => a.d - b.d) }; };
  const listHtml = () => { const P = places();
    const tabs = `<div class="rtabs">${([['rel', `Relíquias (${others.length})`], ['vil', `Cidades e vilas (${P.vil.length})`], ['dg', `Masmorras (${P.dg.length})`], ['poi', `Lugares (${P.poi.length})`], ['orm', `Caderno de Ormund (${K.ormund.count()}/${K.ormund.total()})`]] as const).map(([k, l]) => `<button data-rt="${k}" class="${relTab === k ? 'on' : ''}">${l}</button>`).join('')}</div>`;
    const body = relTab === 'orm' ? (() => { const f = new Set(K.ormund.found()); const E = K.ormund.entries(); return `<em>Notas e páginas soltas do cronista Ormund Salveth, espalhadas pelo mundo no lugar de que falam. ${K.ormund.count()} de ${E.length} achadas.</em>` + E.map((q, i) => f.has(q.id) ? `<button data-orm="${q.id}"><b>${q.book}</b><small>${q.src}</small></button>` : `<button disabled><b>— ${i + 1} —</b><small>ainda não achada</small></button>`).join(''); })() : relTab === 'rel' ? (others.length ? others.map((r) => `<button data-go="${r.name}"><b>${r.name}</b><small>${K.fmtDist(Math.hypot(r.x - K.hereT().x, r.y - K.hereT().y) * T)} · viajar</small></button>`).join('') : '<em>Toque outra relíquia pelo mundo para viajar até ela.</em>')
      : (() => { const L = P[relTab]; return L.length ? L.map((q) => `<button data-see="${q.x},${q.y}" data-nm="${q.name}" class="${relSel?.name === q.name ? 'sel' : ''}"><b>${q.name}</b><small>${q.sub} · ${K.fmtDist(q.d)}</small><i data-pin="${q.x},${q.y}" data-nm="${q.name}" title="Marcar no mapa e seguir a guia">🧭</i></button>`).join('') : '<em>Nenhum ainda. Os lugares entram aqui quando você chega perto deles.</em>'; })();
    return tabs + `<div class="rl">${body}</div>`; };
  relicEl.innerHTML = `<div class="pn relpn"><h2>✦ Relíquias dos Caminhantes <button data-x>✕</button></h2><small>Você está em <b>${from}</b>. ${others.length ? 'Clique numa relíquia dourada no mapa (ou na lista) para viajar.' : 'Nenhuma outra relíquia conhecida ainda — as cinzentas no mapa ainda não foram tocadas.'}</small>
    <div class="rmapw"><canvas class="rmap" width="${S}" height="${S}"></canvas><div class="rzoom"><button data-z="1" title="Aproximar (roda do mouse)">+</button><button data-z="-1" title="Afastar">−</button><button data-z="0" title="Mapa inteiro">⤢</button></div></div>
    <div class="rlist">${listHtml()}</div><small class="ft">Roda do mouse: zoom · arraste: mover o mapa · Esc fecha</small></div>`;
  relicEl.style.display = 'flex';
  const cv = relicEl.querySelector('canvas.rmap') as HTMLCanvasElement, g = cv.getContext('2d')!;
  /* mundo (casas do mapa) → tela, com zoom em volta do centro (relCx, relCy em 0–1) */
  const view = () => { const vw = 1 / relZoom; relCx = Math.min(1 - vw / 2, Math.max(vw / 2, relCx)); relCy = Math.min(1 - vw / 2, Math.max(vw / 2, relCy)); return { x0: relCx - vw / 2, y0: relCy - vw / 2, vw }; };
  const toS = (gx: number, gy: number) => { const v = view(); return { x: (gx / K.MMS - v.x0) / v.vw * S, y: (gy / K.MMS - v.y0) / v.vw * S }; };
  const draw = () => { const v = view();
    g.imageSmoothingEnabled = false; g.clearRect(0, 0, S, S); g.drawImage(K.mmBase, v.x0 * K.mmBase.width, v.y0 * K.mmBase.height, v.vw * K.mmBase.width, v.vw * K.mmBase.height, 0, 0, S, S);
    g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(0, 0, S, S);
    const P = places(), fs = Math.round(9 + relZoom * 1.5);
    const mark = (x: number, y: number, col: string, r: number, label: string | null, shape: 'c' | 'd' | 's' = 'c') => { const p = toS(x, y); if (p.x < -20 || p.y < -20 || p.x > S + 20 || p.y > S + 20) return; g.beginPath(); if (shape === 'd') { g.moveTo(p.x, p.y - r); g.lineTo(p.x + r, p.y); g.lineTo(p.x, p.y + r); g.lineTo(p.x - r, p.y); g.closePath(); } else if (shape === 's') g.rect(p.x - r, p.y - r, r * 2, r * 2); else g.arc(p.x, p.y, r, 0, 6.283); g.fillStyle = col; g.fill(); g.lineWidth = 1.5; g.strokeStyle = '#000'; g.stroke();
      if (label && (relZoom >= 2 || shape === 'c')) { g.font = `600 ${fs}px Cinzel, serif`; g.textAlign = 'center'; g.lineWidth = 3; g.strokeStyle = 'rgba(0,0,0,.85)'; g.strokeText(label, p.x, p.y - r - 4); g.fillStyle = '#ffe9a0'; g.fillText(label, p.x, p.y - r - 4); } };
    for (const q of P.poi) mark(q.x, q.y, '#c8b890', 3 + relZoom * 0.5, relZoom >= 2 ? q.name : null, 's');
    for (const q of P.dg) mark(q.x, q.y, '#d06a5a', 4 + relZoom * 0.5, relZoom >= 2 ? q.name : null, 'd');
    for (const q of P.vil) mark(q.x, q.y, '#9ad0ff', 4 + relZoom * 0.6, relZoom >= 1.5 ? q.name : null, 's');
    for (const r of K.city.relics) { const known = K.knowsRelic(r.name), hereR = r.name === from; mark(r.x, r.y, hereR ? '#fff0bd' : known ? '#ffd24a' : '#6a6a72', (hereR ? 7 : 5) + relZoom * 0.5, known ? r.name : null); }
    if (relSel) { const p = toS(relSel.x, relSel.y), pr = 10 + 3 * Math.sin(performance.now() / 200); g.beginPath(); g.arc(p.x, p.y, pr, 0, 6.283); g.lineWidth = 2.5; g.strokeStyle = '#fff'; g.stroke(); }
    const h0 = K.hereT(), hp = toS(h0.x, h0.y); g.beginPath(); g.arc(hp.x, hp.y, 4, 0, 6.283); g.fillStyle = '#ff6a4a'; g.fill(); g.strokeStyle = '#000'; g.lineWidth = 1.2; g.stroke(); };
  draw(); const anim = setInterval(() => { if (!relicOpen) { clearInterval(anim); return; } if (relSel) draw(); }, 60);
  const zoomAt = (dz: number, mx = S / 2, my = S / 2) => { const v = view(), wx = v.x0 + mx / S * v.vw, wy = v.y0 + my / S * v.vw; relZoom = dz === 0 ? 1 : Math.min(6, Math.max(1, relZoom * (dz > 0 ? 1.5 : 1 / 1.5))); const nv = 1 / relZoom; relCx = wx - (mx / S - 0.5) * nv; relCy = wy - (my / S - 0.5) * nv; if (dz === 0) { relCx = relCy = 0.5; } draw(); };
  if (here && others.length === 0) { relCx = here.x / K.MMS; relCy = here.y / K.MMS; }
  cv.addEventListener('wheel', (e) => { e.preventDefault(); const rc = cv.getBoundingClientRect(); zoomAt(e.deltaY < 0 ? 1 : -1, (e.clientX - rc.left) * S / rc.width, (e.clientY - rc.top) * S / rc.height); }, { passive: false });
  let drag: { x: number; y: number; moved: boolean } | null = null;
  cv.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, moved: false }; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', (e) => { if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true; if (!drag.moved) return; const rc = cv.getBoundingClientRect(), vw = 1 / relZoom; relCx -= dx / rc.width * vw; relCy -= dy / rc.height * vw; drag.x = e.clientX; drag.y = e.clientY; draw(); });
  cv.addEventListener('pointerup', (e) => { const d0 = drag; drag = null; if (!d0 || d0.moved) return; const rc = cv.getBoundingClientRect(), mx = (e.clientX - rc.left) * (S / rc.width), my = (e.clientY - rc.top) * (S / rc.height);
    let best: typeof others[number] | null = null, bd = 16; for (const r of others) { const p = toS(r.x, r.y), d = Math.hypot(p.x - mx, p.y - my); if (d < bd) { bd = d; best = r; } }
    if (best) travelRelic(best.name); else { const un = K.city.relics.find((r) => { const p = toS(r.x, r.y); return !K.knowsRelic(r.name) && Math.hypot(p.x - mx, p.y - my) < 12; }); if (un) K.game.logMsg('Relíquia ainda não tocada: vá até ela a pé uma vez para que ela lembre de você.', '#b9c6e0'); } });
  relicEl.onclick = (e) => { const t = e.target as HTMLElement; const z = (t.closest('[data-z]') as HTMLElement | null)?.dataset.z; if (z !== undefined) { e.stopPropagation(); zoomAt(+z); return; }
    const om = (t.closest('[data-orm]') as HTMLElement | null)?.dataset.orm; if (om) { e.stopPropagation(); const q = K.ormund.entries().find((x) => x.id === om); if (q) K.ormund.read(q); return; }
    const rt = (t.closest('[data-rt]') as HTMLElement | null)?.dataset.rt; if (rt) { e.stopPropagation(); relTab = rt as typeof relTab; relicEl.querySelector('.rlist')!.innerHTML = listHtml(); return; }
    const pin = t.closest('[data-pin]') as HTMLElement | null; if (pin) { e.stopPropagation(); const [x, y] = pin.dataset.pin!.split(',').map(Number); K.pinT = { x, y, label: pin.dataset.nm! }; K.updateBanner(); closeRelics(); K.game.logMsg(`🧭 Guia marcada: ${pin.dataset.nm}.`, '#c8d2e8'); return; }
    const see = t.closest('[data-see]') as HTMLElement | null; if (see) { e.stopPropagation(); const [x, y] = see.dataset.see!.split(',').map(Number); relSel = { x, y, name: see.dataset.nm! }; relZoom = Math.max(relZoom, 3); relCx = x / K.MMS; relCy = y / K.MMS; draw(); relicEl.querySelector('.rlist')!.innerHTML = listHtml(); } };
}
function travelRelic(go: string) { const r = K.city.relics.find((q) => q.name === go); if (!r) return;
  if (landOf(r.x, r.y) !== landOf(K.state.fx, K.state.fy)) { K.game.logMsg(landOf(K.state.fx, K.state.fy) ? '✦ As pedras desta ilha só levam a outros cantos da ilha. Para o continente, só de navio.' : '✦ O véu não atravessa o mar: às ilhas só se chega de navio (Companhia de Latão).', '#ffb070'); return; }
  closeRelics();
  K.withFade(() => { K.state.fx = r.x + 0.5; K.state.fy = r.y + 2.2; K.state.path = []; K.objs.update(K.state.fx * T, K.state.fy * T, true); K.heroY = heightAt(K.state.fx * T, K.state.fy * T); K.camX = K.state.fx * T; K.camZ = K.state.fy * T; K.camY = K.heroY; K.game.logMsg(`✦ Você atravessa o véu até ${go}.`, '#8ad0ff'); for (let i = 0; i < 40; i++) K.particles.spawn(K.state.fx * T, 0.5, K.state.fy * T, { vx: (Math.random() - 0.5) * 3, vy: Math.random() * 3, vz: (Math.random() - 0.5) * 3, life: 1, s0: 0.3, s1: 0.05, c0: 0xffffff, c1: 0x4a9aff, a: 1 }); });
}
function closeRelics() { relicOpen = false; relicEl.style.display = 'none'; }
relicEl.addEventListener('click', (e) => { const t = e.target as HTMLElement; if (t.closest('[data-x]') || t === relicEl) { closeRelics(); return; } const go = (t.closest('[data-go]') as HTMLElement | null)?.dataset.go; if (go) travelRelic(go); });
  return { touchRelic, travelRelic, discovered, get relicOpen() { return relicOpen; }, closeRelics, openRelics, relicNameAt };
}
