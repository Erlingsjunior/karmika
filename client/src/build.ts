/** Construção no mapa: modo de obra (B), peças de 1 tile com custo em materiais, fantasma de posicionamento, remoção com reembolso, salvo localmente. */
import * as THREE from 'three';
import type { Tile } from '@karmika/shared';
import type { Prop, PropKind, World } from './world';
import { ITEMS } from './inventory';

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

export function createBuild(ctx: { /** Obra Automatizada (festim.ts): multiplica os materiais */ costK?(): number; /** terreno de guilda (26/10): 'mine' = o meu (a obra vai para o servidor), 'other' = de outra guilda (não se mexe) */ guildZone?(gx: number, gy: number): 'mine' | 'other' | null; onGuildBuild?(b: Built, del: boolean): void; world: World; scene: THREE.Scene; objs: { addProp(p: Prop): void; removeProp(p: Prop): void }; has(id: string, n: number): boolean; take(id: string, n: number): boolean; add(id: string, n: number): boolean; log(t: string, c?: string): void; heightAt(x: number, z: number): number; canBuildAt(gx: number, gy: number): boolean }) {
  const SAVE = 'karmika.build.v1';
  let on = false, sel = 0, rot = 0;
  const built: { b: Built; prop: Prop }[] = [], remote: { b: Built; prop: Prop }[] = [];
  const el = document.createElement('div'); el.id = 'build'; document.body.appendChild(el);
  const ghost = new THREE.Mesh(new THREE.BoxGeometry(2, 0.4, 2), new THREE.MeshBasicMaterial({ color: 0x7aff9a, transparent: true, opacity: 0.35, depthWrite: false })); ghost.visible = false; ctx.scene.add(ghost);
  const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.5, 6), new THREE.MeshBasicMaterial({ color: 0xffe08a })); arrow.rotation.x = Math.PI / 2; ghost.add(arrow);
  const costTxt = (c: Record<string, number>) => Object.entries(c).map(([k, n]) => `<span class="${ctx.has(k, n) ? 'y' : 'n'}">${ITEMS[k]?.icon ?? ''} ${n}</span>`).join(' ');
  function render() {
    if (!on) { el.style.display = 'none'; return; }
    el.innerHTML = `<div class="bp"><h4>🔨 Modo de obra <small>B sai · clique: colocar · botão direito: remover · R: girar</small></h4><div class="pcs">${PIECES.map((p, i) => `<button class="${i === sel ? 'on' : ''}" data-i="${i}" title="${p.tip}"><span>${p.icon}</span><b>${p.name}</b><small>${costTxt(p.cost)}</small></button>`).join('')}</div></div>`;
    el.style.display = 'block';
  }
  el.addEventListener('click', (e) => { const b = (e.target as HTMLElement).closest('button') as HTMLElement | null; if (b) { sel = +b.dataset.i!; render(); } });
  const tileOf = (gx: number, gy: number): Tile | undefined => ctx.world.map[gy]?.[gx];
  const pieceAt = (gx: number, gy: number) => built.find((x) => x.b.gx === gx && x.b.gy === gy) ?? remote.find((x) => x.b.gx === gx && x.b.gy === gy);
  const canPlace = (p: Piece, gx: number, gy: number) => {
    const t = tileOf(gx, gy); if (!t) return false; const gz = ctx.guildZone?.(gx, gy) ?? null; if (gz === 'other') return false; if (!gz && !ctx.canBuildAt(gx, gy)) return false;
    const here = pieceAt(gx, gy);
    if (p.id === 'broof') return !!here && (here.b.kind === 'bfloor' || here.b.kind === 'bwall' || here.b.kind === 'bdoor');
    if (here) return false;
    return t === 'grass';
  };
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
    ghost.position.set((gx + 0.5) * 2, ctx.heightAt((gx + 0.5) * 2, (gy + 0.5) * 2) + 0.2, (gy + 0.5) * 2); ghost.rotation.y = p.rot ? rot * Math.PI / 2 : 0;
    (ghost.material as THREE.MeshBasicMaterial).color.setHex(canPlace(p, gx, gy) ? 0x7aff9a : 0xff6a5a); arrow.visible = !!p.rot; arrow.position.set(0, 0.3, -0.9);
  }
  function click(mx: number, mz: number, button: number) { if (!on) return false; const gx = Math.floor(mx / 2), gy = Math.floor(mz / 2); if (button === 2) remove(gx, gy); else place(gx, gy); return true; }
  function rotate() { rot = (rot + 1) % 4; }
  function reset() { for (const x of built) ctx.objs.removeProp(x.prop); built.length = 0; save(); }
  return { toggle, update, click, rotate, load, reset, setRemote, get on() { return on; }, built };
}
