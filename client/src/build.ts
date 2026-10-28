/** Construção no mapa: modo de obra (B), peças de 1 tile com custo em materiais, fantasma de posicionamento, remoção com reembolso, salvo localmente. */
import * as THREE from 'three';
import type { Tile } from '@karmika/shared';
import type { Prop, PropKind, World } from './world';
import { ITEMS } from './inventory';
import { buildHouse } from './houses3d';
import { floatWin, buyFx } from './windows';

export interface Piece { id: PropKind; name: string; icon: string; cost: Record<string, number>; blocks?: boolean; rot?: boolean; tip: string }
export const PIECES: Piece[] = [
  { id: 'bfloor', name: 'Piso de tábuas', icon: '🟫', cost: { plank: 2 }, tip: 'Base da casa. Pode-se andar por cima.' },
  { id: 'bwall', name: 'Parede de toras', icon: '🧱', cost: { plank: 3, nail: 2 }, blocks: true, rot: true, tip: 'Bloqueia a passagem. R gira.' },
  { id: 'bdoor', name: 'Porta', icon: '🚪', cost: { plank: 2, nail: 2 }, rot: true, tip: 'Vão com porta aberta. R gira.' },
  { id: 'broof', name: 'Telhado', icon: '🏠', cost: { plank: 3, nail: 1 }, rot: true, tip: 'Sobre um piso ou parede. R gira.' },
  { id: 'bfence', name: 'Cerca', icon: '🪵', cost: { plank: 1 }, blocks: true, rot: true, tip: 'Cerca baixa. R gira.' },
  { id: 'torch', name: 'Tocha', icon: '🔥', cost: { stick: 2, rope: 1 }, blocks: true, tip: 'Ilumina à noite.' },
  { id: 'bench', name: 'Banco', icon: '🪑', cost: { plank: 2 }, blocks: true, tip: 'Sente e descanse (E).' },
  { id: 'campfire', name: 'Fogueira', icon: '🏕', cost: { stick: 4, stone: 2 }, blocks: true, tip: 'Assa carne e peixe (E).' },
];
export interface Built { kind: PropKind; gx: number; gy: number; v: number }
/** OBRAS INTEIRAS (28/10, Erling): uma construção completa de uma vez — paga os materiais, o canteiro aparece no chão e a obra avança
   com o trabalho do jogador (E) ou dos Braços Mecânicos da Companhia (sozinhos, enquanto você joga). Quanto maior, mais caro e mais demorado. */
export interface Whole { id: string; name: string; icon: string; w: number; h: number; cost: Record<string, number>; work: number; tip: string }
export const WHOLES: Whole[] = [
  { id: 'casa_tabuas', name: 'Casa de Tábuas e Pedra', icon: '🏡', w: 5, h: 4, cost: { plank: 40, nail: 30, stone: 24, rope: 8, stick: 16 }, work: 30,
    tip: 'Casa pequena de morar: alicerce de pedra, paredes de tábua, telhado de telha. Por dentro: cama que cura, caixa de correio que guarda itens e a placa com o seu nome. A obra pede 30 turnos de trabalho (5 dias de Karmika): trabalhe nela entre uma aventura e outra, ou contrate um Ajudante de Obra na Caravana de Latão — e proteja-o com Sentinelas.' },
];

/** a foto da obra no card: a própria casa do jogo, renderizada uma vez num canvas fora da tela */
const THUMB = new Map<string, string>();
export function wholeThumb(w: Whole): string {
  const c0 = THUMB.get(w.id); if (c0) return c0;
  try { const W = 280, H = 180, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const r = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, preserveDrawingBuffer: true }); r.setSize(W, H, false);
    const sc = new THREE.Scene(); sc.add(new THREE.HemisphereLight(0xfff0d8, 0x4a3a2a, 1.6)); const sun = new THREE.DirectionalLight(0xfff4e0, 2.2); sun.position.set(8, 14, 10); sc.add(sun);
    let sd = 7; const hs = buildHouse(0, w.w * 2, w.h * 2, 0xb09068, 0x8a3a28, { windows: new THREE.MeshBasicMaterial({ color: 0xffc266 }), rnd: () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; } }); sc.add(hs.group);
    const bb = new THREE.Box3().setFromObject(hs.group), ctr = bb.getCenter(new THREE.Vector3()), sz = bb.getSize(new THREE.Vector3()), R0 = Math.max(sz.x, sz.z, sz.y) * 0.62;
    const ground = new THREE.Mesh(new THREE.CircleGeometry(R0 * 1.6, 32).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0x5a7a3a })); ground.position.set(ctr.x, bb.min.y - 0.02, ctr.z); sc.add(ground);
    const cam = new THREE.OrthographicCamera(-R0 * 1.25, R0 * 1.25, R0 * 0.8, -R0 * 0.8, 0.1, 400); cam.position.set(ctr.x + 30, ctr.y + 26, ctr.z + 30); cam.lookAt(ctr); r.render(sc, cam);
    const url = cv.toDataURL(); THUMB.set(w.id, url); r.dispose(); r.forceContextLoss(); return url; } catch { return ''; } }
export function createBuild(ctx: { snd?(k: 'coins' | 'error'): void; /** desistir da obra (o canteiro se desfaz, o material se perde) */ quitWhole?(): void; /** obra inteira paga: o main.ts monta o canteiro */ onWhole?(w: Whole, gx: number, gy: number): void; /** já existe uma obra/casa do jogador? */ wholeBusy?(): boolean; /** Obra Automatizada (festim.ts): multiplica os materiais */ costK?(): number; /** terreno de guilda (26/10): 'mine' = o meu (a obra vai para o servidor), 'other' = de outra guilda (não se mexe) */ guildZone?(gx: number, gy: number): 'mine' | 'other' | null; onGuildBuild?(b: Built, del: boolean): void; world: World; scene: THREE.Scene; objs: { addProp(p: Prop): void; removeProp(p: Prop): void }; has(id: string, n: number): boolean; take(id: string, n: number): boolean; add(id: string, n: number): boolean; log(t: string, c?: string): void; heightAt(x: number, z: number): number; canBuildAt(gx: number, gy: number): boolean }) {
  const SAVE = 'karmika.build.v1';
  let on = false, sel = 0, rot = 0, whole = -1; // whole >= 0: escolheu uma obra inteira
  const built: { b: Built; prop: Prop }[] = [], remote: { b: Built; prop: Prop }[] = [];
  const el = document.createElement('div'); el.id = 'build'; el.className = 'modalw'; document.body.appendChild(el); setTimeout(() => floatWin(el, 'build', { left: 'calc(50vw - 330px)', top: '46vh' }), 0); /* 28/10: janela padrão do jogo (arrastar, redimensionar, escala e texto das Configurações) */
  let tab: 'pecas' | 'obras' = 'pecas';
  const ghost = new THREE.Mesh(new THREE.BoxGeometry(2, 0.4, 2), new THREE.MeshBasicMaterial({ color: 0x7aff9a, transparent: true, opacity: 0.35, depthWrite: false })); ghost.visible = false; ctx.scene.add(ghost);
  const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.5, 6), new THREE.MeshBasicMaterial({ color: 0xffe08a })); arrow.rotation.x = Math.PI / 2; ghost.add(arrow);
  function render() {
    if (!on) { el.style.display = 'none'; return; }
    const small = (c: Record<string, number>) => Object.entries(c).map(([k, n]) => `<i class="${ctx.has(k, n) ? 'y' : 'n'}" title="${ITEMS[k]?.name ?? k}">${ITEMS[k]?.icon ?? ''}${n}</i>`).join('');
    const site = ctx.wholeBusy?.() ?? false;
    const W0 = whole >= 0 ? WHOLES[whole] : null;
    const body = tab === 'pecas'
      ? `<p class="bhint">Clique no chão para colocar · botão direito remove · R gira · B fecha</p><div class="pcs2">${PIECES.map((p, i) => `<button class="${i === sel && whole < 0 ? 'on' : ''}" data-i="${i}" title="${p.name} — ${p.tip}"><span>${p.icon}</span><b>${p.name}</b><em>${small(p.cost)}</em></button>`).join('')}</div>`
      : `<p class="bhint">Compre o projeto (o material sai da mochila). Depois use o 📜 projeto na mochila para escolher o lugar.</p><div class="wcards">${WHOLES.map((w, i) => `<div class="wcard"><img src="${wholeThumb(w)}" alt=""><div class="wi"><b>${w.icon} ${w.name}</b><small>${w.w}×${w.h} · ${w.work} turnos de obra (${w.work / 6} dias)</small><em>${small(w.cost)}</em><p>${w.tip}</p>
        ${site ? `<button data-quit>✖ Desistir da obra atual</button>` : `<button data-buyw="${i}">Comprar o projeto</button>`}</div></div>`).join('')}</div>`;
    el.innerHTML = `<div class="pn bpn"><h2>🔨 Construção <button data-x title="Fechar (B)">✕</button></h2>${W0 ? `<p class="bplace">📜 Escolhendo o lugar de <b>${W0.name}</b>: o contorno verde mostra onde cabe. Clique no chão para marcar o canteiro.</p>` : ''}
      <div class="altabs"><button data-tab="pecas" class="${tab === 'pecas' ? 'on' : ''}">Peças</button><button data-tab="obras" class="${tab === 'obras' ? 'on' : ''}">Obras inteiras</button></div><div class="bbody">${body}</div></div>`;
    el.style.display = 'flex';
  }
  el.addEventListener('click', (e) => { const b = (e.target as HTMLElement).closest('button') as HTMLElement | null; if (!b) return;
    if (b.hasAttribute('data-x')) { toggle(false); return; } if (b.dataset.tab) { tab = b.dataset.tab as typeof tab; render(); return; }
    if (b.dataset.buyw !== undefined) { const w = WHOLES[+b.dataset.buyw]; for (const [k, n] of Object.entries(w.cost)) if (!ctx.has(k, n)) { ctx.log(`Faltam materiais para o projeto: ${ITEMS[k]?.name ?? k} ×${n}.`, '#ff9a8a'); return; } for (const [k, n] of Object.entries(w.cost)) ctx.take(k, n); if (!ctx.add('projeto_' + w.id, 1)) { for (const [k, n] of Object.entries(w.cost)) ctx.add(k, n); ctx.log('🎒 Mochila cheia: o projeto não coube e o material voltou para você. Libere um espaço e compre de novo.', '#ff9a8a'); ctx.snd?.('error'); return; } buyFx(b, '📜'); ctx.snd?.('coins'); ctx.log(`📜 Projeto comprado: ${w.name}. Está na mochila — use-o para escolher o lugar da obra.`, '#ffe08a'); render(); return; }
    if (b.hasAttribute('data-quit')) { ctx.quitWhole?.(); render(); return; }
    sel = +b.dataset.i!; whole = -1; render(); });
  const tileOf = (gx: number, gy: number): Tile | undefined => ctx.world.map[gy]?.[gx];
  const pieceAt = (gx: number, gy: number) => built.find((x) => x.b.gx === gx && x.b.gy === gy) ?? remote.find((x) => x.b.gx === gx && x.b.gy === gy);
  const canPlace = (p: Piece, gx: number, gy: number) => {
    const t = tileOf(gx, gy); if (!t) return false; const gz = ctx.guildZone?.(gx, gy) ?? null; if (gz === 'other') return false; if (!gz && !ctx.canBuildAt(gx, gy)) return false;
    const here = pieceAt(gx, gy);
    if (p.id === 'broof') return !!here && (here.b.kind === 'bfloor' || here.b.kind === 'bwall' || here.b.kind === 'bdoor');
    if (here) return false;
    return t === 'grass';
  };
  /** cabe a obra inteira aqui? (canto de cima à esquerda em gx,gy; toda a pegada em grama livre, longe de vilas e lugares) */
  const canWhole = (w: Whole, gx: number, gy: number) => { for (let y = gy - 1; y <= gy + w.h; y++) for (let x = gx - 1; x <= gx + w.w; x++) { const t = tileOf(x, y); const edge = y < gy || y >= gy + w.h || x < gx || x >= gx + w.w; if (!t || (!edge && t !== 'grass') || (edge && t === 'wall') || pieceAt(x, y)) return false; if (!edge && !ctx.canBuildAt(x, y)) return false; } return !(ctx.wholeBusy?.() ?? false); };
  function placeWhole(gx: number, gy: number) { const w = WHOLES[whole]; if (!canWhole(w, gx, gy)) { ctx.log(ctx.wholeBusy?.() ? 'Você já tem uma obra ou casa. Uma de cada vez, por enquanto.' : 'A obra não cabe aqui: precisa de grama livre em volta, longe de vilas e lugares.', '#ff9a8a'); return; }
    if (!ctx.has('projeto_' + w.id, 1)) { ctx.log('Você precisa do projeto na mochila (compre no B → Obras inteiras).', '#ff9a8a'); return; }
    ctx.take('projeto_' + w.id, 1); whole = -1; ctx.onWhole?.(w, gx, gy); toggle(false); }
  function place(gx: number, gy: number) {
    const p = PIECES[sel]; if (!canPlace(p, gx, gy)) { ctx.log('Não dá para construir aqui.', '#ff9a8a'); return; }
    const K = ctx.costK?.() ?? 1, cost = Object.fromEntries(Object.entries(p.cost).map(([k, n]) => [k, Math.max(K < 1 ? 0 : 1, Math.ceil(n * K))])) as Record<string, number>;
    for (const [k, n] of Object.entries(cost)) if (n > 0 && !ctx.has(k, n)) { ctx.log(`Faltam materiais: ${ITEMS[k]?.name ?? k} ×${n}. Gunnar vende.`, '#ff9a8a'); return; }
    for (const [k, n] of Object.entries(cost)) if (n > 0) ctx.take(k, n);
    const b: Built = { kind: p.id, gx, gy, v: p.rot ? rot : 0 };
    if (ctx.guildZone?.(gx, gy) === 'mine' && ctx.onGuildBuild) { ctx.onGuildBuild(b, false); ctx.log(`🔨 ${p.name}: obra da guilda (todos veem).`, '#ffe08a'); render(); return; }
    addBuilt(b); save(); ctx.log(`🔨 ${p.name} construído.`, '#ffe08a'); render();
  }
  function addBuilt(b: Built) {
    const prop: Prop = { kind: b.kind, gx: b.gx, gy: b.gy, w: 1, h: 1, height: b.kind === 'torch' ? 1.9 : b.kind === 'campfire' ? 0.6 : 1, wall: b.kind === 'torch' ? 0x3a2a1c : 0x8a6a40, roof: b.kind === 'torch' || b.kind === 'campfire' ? 0xff8a2a : 0x6d3a28, variant: b.v };
    const pc = PIECES.find((x) => x.id === b.kind);
    if (b.kind === 'broof') { const under = pieceAt(b.gx, b.gy); if (under) { ctx.objs.removeProp(under.prop); built.splice(built.indexOf(under), 1); const roofed: Prop = { ...under.prop }; ctx.objs.addProp(roofed); built.push({ b: under.b, prop: roofed }); } }
    ctx.objs.addProp(prop); built.push({ b, prop });
    if (pc?.blocks) ctx.world.map[b.gy][b.gx] = 'wall';
  }
  function remove(gx: number, gy: number) {
    const rz = ctx.guildZone?.(gx, gy) ?? null; if (rz === 'other') { ctx.log('Esse terreno é de outra guilda.', '#ff9a8a'); return; }
    if (rz === 'mine') { const rx = [...remote].reverse().find((y) => y.b.gx === gx && y.b.gy === gy); if (rx) { ctx.onGuildBuild?.(rx.b, true); const pc = PIECES.find((q) => q.id === rx.b.kind); if (pc) for (const [k, n] of Object.entries(pc.cost)) { const back = Math.floor(n / 2); if (back) ctx.add(k, back); } ctx.log(`${pc?.name ?? 'Peça'} removida da obra da guilda (metade dos materiais de volta).`, '#e8dcc0'); } return; }
    const x = built.find((y) => y.b.gx === gx && y.b.gy === gy); if (!x) return;
    // remove o de cima primeiro (telhado), depois o piso
    const all = built.filter((y) => y.b.gx === gx && y.b.gy === gy); const top = all.find((y) => y.b.kind === 'broof') ?? all[0];
    ctx.objs.removeProp(top.prop); built.splice(built.indexOf(top), 1);
    const pc = PIECES.find((p) => p.id === top.b.kind);
    if (pc) for (const [k, n] of Object.entries(pc.cost)) { const back = Math.floor(n / 2); if (back) ctx.add(k, back); }
    if (!built.some((y) => y.b.gx === gx && y.b.gy === gy && PIECES.find((p) => p.id === y.b.kind)?.blocks)) ctx.world.map[gy][gx] = 'grass';
    save(); ctx.log(`${pc?.name ?? 'Peça'} removida (metade dos materiais de volta).`, '#e8dcc0'); render();
  }
  /** as obras das guildas (vêm do servidor): troca tudo de uma vez */
  function setRemote(list: Built[]) {
    for (const x of remote) { ctx.objs.removeProp(x.prop); if (PIECES.find((p) => p.id === x.b.kind)?.blocks && !built.some((y) => y.b.gx === x.b.gx && y.b.gy === x.b.gy)) ctx.world.map[x.b.gy][x.b.gx] = 'grass'; } remote.length = 0;
    for (const b of list) { const t = tileOf(b.gx, b.gy); if (t !== 'grass' && t !== 'wall' && b.kind !== 'broof') continue;
      const prop: Prop = { kind: b.kind, gx: b.gx, gy: b.gy, w: 1, h: 1, height: b.kind === 'torch' ? 1.9 : b.kind === 'campfire' ? 0.6 : 1, wall: b.kind === 'torch' ? 0x3a2a1c : 0x8a6a40, roof: b.kind === 'torch' || b.kind === 'campfire' ? 0xff8a2a : 0x6d3a28, variant: b.v };
      if (b.kind === 'broof') { const i = remote.findIndex((y) => y.b.gx === b.gx && y.b.gy === b.gy && y.b.kind !== 'broof'); if (i >= 0) { ctx.objs.removeProp(remote[i].prop); const ro: Prop = { ...remote[i].prop }; ctx.objs.addProp(ro); remote[i] = { b: remote[i].b, prop: ro }; } }
      ctx.objs.addProp(prop); remote.push({ b, prop }); if (PIECES.find((p) => p.id === b.kind)?.blocks) ctx.world.map[b.gy][b.gx] = 'wall'; }
  }
  function save() { try { localStorage.setItem(SAVE, JSON.stringify(built.map((x) => x.b))); } catch { /* */ } }
  function load() { try { const list = JSON.parse(localStorage.getItem(SAVE) || '[]') as Built[]; for (const b of list) if (tileOf(b.gx, b.gy) === 'grass' || b.kind === 'broof') addBuilt(b); } catch { /* */ } }
  function toggle(force?: boolean) { on = force ?? !on; ghost.visible = on; render(); if (on) ctx.log('🔨 Modo de obra: escolha a peça embaixo, clique no chão para colocar. B sai.', '#ffe08a'); }
  function update(mx: number, mz: number) {
    if (!on) return; const gx = Math.floor(mx / 2), gy = Math.floor(mz / 2), p = PIECES[sel];
    if (whole >= 0) { const w = WHOLES[whole], x0 = gx - Math.floor(w.w / 2), y0 = gy - Math.floor(w.h / 2); ghost.scale.set(w.w, 6, w.h); ghost.position.set((x0 + w.w / 2) * 2, ctx.heightAt((gx + 0.5) * 2, (gy + 0.5) * 2) + 1.2, (y0 + w.h / 2) * 2); ghost.rotation.y = 0; arrow.visible = false; (ghost.material as THREE.MeshBasicMaterial).color.setHex(canWhole(w, x0, y0) ? 0x7aff9a : 0xff6a5a); return; }
    ghost.scale.set(1, 1, 1);
    ghost.position.set((gx + 0.5) * 2, ctx.heightAt((gx + 0.5) * 2, (gy + 0.5) * 2) + 0.2, (gy + 0.5) * 2); ghost.rotation.y = p.rot ? rot * Math.PI / 2 : 0;
    (ghost.material as THREE.MeshBasicMaterial).color.setHex(canPlace(p, gx, gy) ? 0x7aff9a : 0xff6a5a); arrow.visible = !!p.rot; arrow.position.set(0, 0.3, -0.9);
  }
  function click(mx: number, mz: number, button: number) { if (!on) return false; const gx = Math.floor(mx / 2), gy = Math.floor(mz / 2); if (whole >= 0) { if (button !== 2) { const w = WHOLES[whole]; placeWhole(gx - Math.floor(w.w / 2), gy - Math.floor(w.h / 2)); } return true; } if (button === 2) remove(gx, gy); else place(gx, gy); return true; }
  function rotate() { rot = (rot + 1) % 4; }
  function reset() { for (const x of built) ctx.objs.removeProp(x.prop); built.length = 0; save(); }
  /** usar o projeto da mochila: liga o modo de obra já com a obra escolhida, para marcar o lugar */
  function placeProject(id: string) { const i = WHOLES.findIndex((w) => 'projeto_' + w.id === id); if (i < 0) return false; whole = i; toggle(true); ctx.log(`📜 Escolha o lugar de ${WHOLES[i].name}: o contorno verde mostra onde cabe. Clique para marcar o canteiro.`, '#ffe08a'); return true; }
  return { toggle, update, click, rotate, load, reset, setRemote, placeProject, get on() { return on; }, built };
}
