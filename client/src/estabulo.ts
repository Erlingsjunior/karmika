/* ESTÁBULO E COMPANHEIROS (Erling, 25/10): o pet ou a montaria comprada é "consumida" da mochila e passa a morar aqui.
   Na página: o bicho se mexendo, dar comida, brincar clicando nele, renomear, coleira e peitoral (pets), a coleção
   (quantos você tem de quantos existem) e trocar quem anda com você. Abre com X, pelo ícone do dock e com Ctrl+clique no pet. */
import * as THREE from 'three';
import { PETS, MOUNTS, petModel, mountModel, type PetKind } from './companions';
import { ramp } from './toon3d';

const KEY = 'karmika.stable.v1';
const TURN_S = 30 * 60;
export interface Comp { id: string; name: string; hunger: number; joy: number; gear: { coleira?: string; peitoral?: string }; got: number; fed?: number }
interface State { pets: Record<string, Comp>; mounts: Record<string, Comp>; pet: string | null; mount: string | null }
/** o que cada um come (o que está na mochila e serve) */
const FOOD: Record<string, string[]> = {
  carne: ['meat', 'cooked', 'fish', 'fishc', 'jerky', 'sausage', 'skewer'],
  graos: ['bread', 'apple', 'pao_azimo'],
  tudo: ['apple', 'bread', 'meat', 'cooked', 'fish', 'jerky'],
  montaria: ['feno', 'apple', 'bread'],
};
const GEAR: Record<string, { slot: 'coleira' | 'peitoral'; fetch?: number; range?: number; cd?: number; bite?: number }> = {
  coleira_couro: { slot: 'coleira', fetch: 0.15 },
  coleira_prata: { slot: 'coleira', fetch: 0.3, range: 0.25 },
  peitoral_couro: { slot: 'peitoral', cd: 0.2 },
  peitoral_ferro: { slot: 'peitoral', cd: 0.35, bite: 0.25 },
};
const SKILL_TXT: Record<string, [string, string]> = {
  alarido: ['Alarido', 'No combate, a cada ~18 s grita e faz quem vem para cima de você parar por 1,5 s (elites não caem nessa).'],
  mordida: ['Mordida', 'No combate, a cada ~4 s morde quem está te atacando (dano cresce com o seu nível).'],
  faro: ['Faro fino', 'Busca itens caídos até 22 m (os outros: 14 m). No combate, um guincho distrai por 1 s a cada ~25 s.'],
  fucar: ['Fuçar', 'Fora de combate, parado perto de você, a cada ~90 s fuça a terra e às vezes acha uma maçã, um pão ou umas moedas.'],
};
export interface StableCtx {
  has(id: string): boolean; count(id: string): number; take(id: string, n: number): boolean; add(id: string, n: number): void;
  itemName(id: string): string; itemIcon(id: string): string; log(t: string, c?: string): void; gold(n: number): void;
  onChange(): void; sfx?(k: 'pet' | 'eat' | 'happy' | 'swap'): void;
}
export function createStable(ctx: StableCtx) {
  let S: State = { pets: {}, mounts: {}, pet: null, mount: null };
  try { const o = JSON.parse(localStorage.getItem(KEY) || 'null'); if (o && o.pets) S = { ...S, ...o }; } catch { /* */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* */ } };
  const isPet = (id: string) => !!PETS[id], isMount = (id: string) => !!MOUNTS[id];
  /** usar o item: o bicho sai da mochila e entra no Estábulo (e já vem junto, se ninguém estava) */
  function adopt(id: string) {
    if (!isPet(id) && !isMount(id)) return false;
    const book = isPet(id) ? S.pets : S.mounts, kind = (PETS[id] ?? MOUNTS[id])!;
    if (book[id]) { ctx.log(`${kind.name}: você já tem esse no Estábulo. O item fica na mochila (venda ou dê de presente).`, '#ffb060'); return false; }
    if (!ctx.take(id, 1)) return false;
    book[id] = { id, name: kind.name, hunger: 0.2, joy: 0.5, gear: {}, got: Date.now() };
    if (isPet(id) && !S.pet) S.pet = id; if (isMount(id) && !S.mount) S.mount = id;
    save(); ctx.onChange(); ctx.sfx?.('happy');
    ctx.log(`🐾 ${kind.name} agora mora no seu Estábulo (X).${(isPet(id) ? S.pet : S.mount) === id ? ' Está com você.' : ' Troque por lá quando quiser.'}`, '#9aff9a');
    return true;
  }
  /** quem estava como item (antes do Estábulo existir) entra sozinho */
  function migrate() { for (const id of [...Object.keys(PETS), ...Object.keys(MOUNTS)]) if (ctx.has(id) && !(S.pets[id] || S.mounts[id])) adopt(id); }
  const pet = () => (S.pet ? S.pets[S.pet] ?? null : null), mount = () => (S.mount ? S.mounts[S.mount] ?? null : null);
  const gearOf = (c: Comp | null) => { const g = { fetch: 0, range: 0, cd: 0, bite: 0 }; if (!c) return g; for (const id of [c.gear.coleira, c.gear.peitoral]) { const G = id ? GEAR[id] : null; if (G) { g.fetch += G.fetch ?? 0; g.range += G.range ?? 0; g.cd += G.cd ?? 0; g.bite += G.bite ?? 0; } } return g; };
  /* fome e vínculo andam com o tempo: fome cheia em 4 turnos (2 h), vínculo cai devagar (16 turnos) */
  let hungryWarn = 0;
  function tick(dt: number) {
    for (const c of [...Object.values(S.pets), ...Object.values(S.mounts)]) { const out = c.id === S.pet || c.id === S.mount; c.hunger = Math.min(1, c.hunger + dt / (4 * TURN_S) * (out ? 1 : 0.35)); c.joy = Math.max(0, c.joy - dt / (16 * TURN_S)); }
    const p = pet(); if (p && p.hunger > 0.8 && performance.now() - hungryWarn > 300000) { hungryWarn = performance.now(); ctx.log(`🍖 ${p.name} está com fome: busca devagar e não ajuda no combate. Dê comida no Estábulo (X).`, '#ffb060'); }
    saveT -= dt; if (saveT <= 0) { saveT = 20; save(); if (open) renderStats(); }
  }
  let saveT = 20;
  /** o que o pet faz agora (main.ts usa para buscar, morder, gritar, fuçar) */
  function petStats() { const c = pet(); if (!c) return null; const k = PETS[c.id]!, g = gearOf(c), hungry = c.hunger > 0.8, fond = c.joy > 0.7;
    return { kind: k, name: c.name, skill: hungry ? null : k.skill ?? null, fetchMul: (1 + g.fetch) * (hungry ? 0.6 : 1), range: (k.skill === 'faro' ? 22 : 14) * (1 + g.range), cdMul: Math.max(0.4, 1 - g.cd - (fond ? 0.2 : 0)), biteMul: 1 + g.bite, hungry, fond }; }
  function mountStats() { const c = mount(); if (!c) return null; const k = MOUNTS[c.id]!, hungry = c.hunger > 0.8; return { kind: k, name: c.name, speedMul: hungry ? 0.75 : c.joy > 0.7 ? 1.04 : 1, hungry }; }

  /* ---------- a página ---------- */
  const el = document.createElement('div'); el.id = 'stablew'; el.className = 'modalw'; document.body.appendChild(el);
  let open = false, tab: 'pets' | 'mounts' = 'pets', sel: string | null = null;
  el.innerHTML = `<div class="pn stpn"><h2>Estábulo e Companheiros <small class="stc"></small><button data-x title="Fechar (X ou Esc)">✕</button></h2>
    <div class="sttabs"><button data-tab="pets">🐾 Pets</button><button data-tab="mounts">🐴 Montarias</button></div>
    <div class="stbody"><div class="stleft"><div class="stview"><canvas width="300" height="210"></canvas><div class="sthearts"></div><small class="sthint">clique para brincar · arraste para girar</small></div>
      <div class="stname"></div><div class="ststats"></div><div class="stacts"></div><div class="stgear"></div></div>
      <div class="stright"><h3>Coleção</h3><div class="stcoll"></div><small class="stnote">Compre com Corwin, o Domador (pets e acessórios) e com Orm, o Estalajadeiro (montarias e feno). Ao usar o item na mochila, o bicho vem morar aqui.</small></div></div></div>`;
  const cv = el.querySelector('canvas') as HTMLCanvasElement;
  let R: THREE.WebGLRenderer | null = null; const sc = new THREE.Scene(), cam = new THREE.PerspectiveCamera(32, 300 / 210, 0.1, 50);
  sc.add(new THREE.HemisphereLight(0xfff0d8, 0x3a2a20, 1.6)); const dl = new THREE.DirectionalLight(0xffe0b0, 2.2); dl.position.set(2, 4, 3); sc.add(dl);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(1.6, 32), new THREE.MeshToonMaterial({ color: 0x5a4a30, gradientMap: ramp })); floor.rotation.x = -Math.PI / 2; sc.add(floor);
  let model: { root: THREE.Group; pose: (dt: number, mv: number, t: number) => void } | null = null, modelId = '';
  let yaw = 0.6, drag = false, dragX = 0, moved = 0, hop = 0, spin = 0, runT = 0;
  function setModel(id: string) { if (modelId === id) return; if (model) sc.remove(model.root); modelId = id;
    if (PETS[id]) { const m = petModel(PETS[id]!); model = m; } else { const m = mountModel(MOUNTS[id]!); model = { root: m.root, pose: (dt, mv) => m.hz.pose({ dt, mv, idle: mv < 0.1 }) }; }
    sc.add(model.root); const box = new THREE.Box3().setFromObject(model.root), sz = box.getSize(new THREE.Vector3()), h = Math.max(sz.y, sz.z * 0.7, 0.4);
    modelH = h; cam.position.set(0, h * 1.0, h * 3.0); cam.lookAt(0, h * 0.45, 0); floor.scale.setScalar(Math.max(0.6, h * 1.1)); }
  let last = 0, modelH = 1;
  function frame(t: number) { if (!open) return; requestAnimationFrame(frame); const dt = Math.min(0.05, (t - last) / 1000 || 0.016); last = t;
    if (!R) { try { R = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, powerPreference: 'low-power' }); R.setPixelRatio(1); R.outputColorSpace = THREE.SRGBColorSpace; } catch { return; } }
    if (!model) return; hop = Math.max(0, hop - dt * 2.2); spin = Math.max(0, spin - dt * 1.4); runT = Math.max(0, runT - dt);
    model.root.position.y = Math.sin(hop * Math.PI) * 0.22 * modelH * (hop > 0 ? 1 : 0); model.root.rotation.y = yaw + spin * 6.283;
    model.pose(dt, runT > 0 ? 4 : 0, t / 1000); R.render(sc, cam); }
  cv.addEventListener('pointerdown', (e) => { drag = true; dragX = e.clientX; moved = 0; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', (e) => { if (!drag) return; const d = e.clientX - dragX; dragX = e.clientX; moved += Math.abs(d); yaw += d * 0.012; });
  cv.addEventListener('pointerup', () => { drag = false; if (moved < 6) play(); });
  /** brincar: pula, gira, corre no lugar, corações — e o vínculo sobe (de pouquinho, sem farm) */
  let playT = 0;
  function play() { const c = cur(); if (!c) return; hop = 1; if (Math.random() < 0.4) spin = 1; if (Math.random() < 0.3) runT = 1.2; hearts(3 + (Math.random() * 3 | 0));
    if (performance.now() - playT > 1500) { playT = performance.now(); c.joy = Math.min(1, c.joy + 0.04); save(); renderStats(); } ctx.sfx?.('pet'); }
  function hearts(n: number) { const box = el.querySelector('.sthearts') as HTMLElement; for (let i = 0; i < n; i++) { const h = document.createElement('i'); h.textContent = Math.random() < 0.8 ? '❤' : '✦'; h.style.left = 30 + Math.random() * 40 + '%'; h.style.animationDelay = i * 0.08 + 's'; box.appendChild(h); setTimeout(() => h.remove(), 1500); } }
  const cur = () => (sel ? (tab === 'pets' ? S.pets[sel] : S.mounts[sel]) ?? null : null);
  const bar = (k: number, c: string) => `<span class="stbar"><i style="width:${Math.round(k * 100)}%;background:${c}"></i></span>`;
  function renderStats() { const c = cur(); const st = el.querySelector('.ststats') as HTMLElement; if (!c) { st.innerHTML = ''; return; }
    const fullness = 1 - c.hunger; st.innerHTML = `<div><b>Saciedade</b>${bar(fullness, fullness < 0.2 ? '#d04a3a' : '#c8a040')}<em>${fullness < 0.2 ? 'com fome!' : Math.round(fullness * 100) + '%'}</em></div><div><b>Vínculo</b>${bar(c.joy, '#e06a9a')}<em>${c.joy > 0.7 ? 'te adora (+20% habilidade)' : Math.round(c.joy * 100) + '%'}</em></div>`; }
  function render() {
    (el.querySelectorAll('[data-tab]') as NodeListOf<HTMLElement>).forEach((b) => b.classList.toggle('on', b.dataset.tab === tab));
    const book = tab === 'pets' ? S.pets : S.mounts, all = tab === 'pets' ? Object.values(PETS) : Object.values(MOUNTS), active = tab === 'pets' ? S.pet : S.mount;
    if (!sel || !book[sel]) sel = active && book[active] ? active : Object.keys(book)[0] ?? null;
    (el.querySelector('.stc') as HTMLElement).textContent = `Pets ${Object.keys(S.pets).length}/${Object.keys(PETS).length} · Montarias ${Object.keys(S.mounts).length}/${Object.keys(MOUNTS).length}`;
    (el.querySelector('.stcoll') as HTMLElement).innerHTML = all.map((k) => { const c = book[k.id]; return c ? `<button class="stcard ${k.id === sel ? 'sel' : ''} ${k.id === active ? 'act' : ''}" data-sel="${k.id}"><i>${ctx.itemIcon(k.id)}</i><b>${c.name}</b><small>${k.id === active ? '★ com você' : k.name !== c.name ? k.name : 'no estábulo'}</small></button>`
      : `<div class="stcard none" title="${k.blurb ?? ''}"><i>?</i><b>${k.name}</b><small>${k.where ?? ''}</small></div>`; }).join('');
    const c = cur(), view = el.querySelector('.stview') as HTMLElement;
    if (!c) { view.style.display = 'none'; (el.querySelector('.stname') as HTMLElement).innerHTML = `<p class="stempty">${tab === 'pets' ? 'Nenhum pet ainda. Corwin, o Domador, tem raposa, filhote de lobo, ratinho e leitão.' : 'Nenhuma montaria ainda. Orm, o Estalajadeiro, vende cavalos.'}</p>`; (el.querySelector('.stacts') as HTMLElement).innerHTML = ''; (el.querySelector('.stgear') as HTMLElement).innerHTML = ''; renderStats(); return; }
    view.style.display = ''; setModel(c.id);
    const k = (PETS[c.id] ?? MOUNTS[c.id])!, pk = PETS[c.id] as PetKind | undefined;
    (el.querySelector('.stname') as HTMLElement).innerHTML = `<input class="stren" maxlength="20" value="${c.name.replace(/"/g, '')}" title="Renomear"><small>${k.name}${pk?.skill ? ` · <b>${SKILL_TXT[pk.skill][0]}</b>: ${SKILL_TXT[pk.skill][1]}` : MOUNTS[c.id] ? ` · +${Math.round((MOUNTS[c.id]!.speed - 1) * 100)}% de velocidade fora de combate (Z)` : ''}</small><small class="stbl">${k.blurb ?? ''}</small>`;
    renderStats();
    const foods = (FOOD[pk ? pk.eats ?? 'tudo' : 'montaria'] ?? []).filter((f) => ctx.count(f) > 0);
    (el.querySelector('.stacts') as HTMLElement).innerHTML = `${c.id === active ? '<button disabled>★ Está com você</button>' : `<button data-act="swap">${tab === 'pets' ? '🐾 Levar comigo' : '🐴 Usar esta'}</button>`}
      <button data-act="pet">${tab === 'pets' ? '🤲 Fazer carinho' : '🪮 Escovar'}</button>
      <span class="stfood">${foods.length ? foods.map((f) => `<button data-feed="${f}" title="Dar ${ctx.itemName(f)}">${ctx.itemIcon(f)} <small>${ctx.count(f)}</small></button>`).join('') : `<small>Sem comida que ${c.name} coma na mochila (${pk ? (pk.eats === 'carne' ? 'carne ou peixe' : pk.eats === 'graos' ? 'pão ou maçã' : 'carne, pão ou maçã') : 'feno, maçã ou pão'}).</small>`}</span>`;
    (el.querySelector('.stgear') as HTMLElement).innerHTML = pk ? (['coleira', 'peitoral'] as const).map((slot) => { const on = c.gear[slot], opts = Object.keys(GEAR).filter((g) => GEAR[g].slot === slot && ctx.count(g) > 0);
      return `<div class="stslot"><b>${slot === 'coleira' ? 'Coleira' : 'Peitoral'}</b>${on ? `<button data-uneq="${slot}" title="Tirar">${ctx.itemIcon(on)} ${ctx.itemName(on)} ✕</button>` : '<em>vazio</em>'}${opts.map((g) => `<button data-eq="${g}" title="Pôr">${ctx.itemIcon(g)} ${ctx.itemName(g)}</button>`).join('')}</div>`; }).join('') : '';
  }
  el.addEventListener('click', (e) => { const t = e.target as HTMLElement;
    if (t.closest('[data-x]')) { toggle(false); return; }
    const tb = t.closest('[data-tab]') as HTMLElement | null; if (tb) { tab = tb.dataset.tab as 'pets'; sel = null; render(); return; }
    const sb = t.closest('[data-sel]') as HTMLElement | null; if (sb) { sel = sb.dataset.sel!; render(); return; }
    const c = cur(); if (!c) return;
    const ab = t.closest('[data-act]') as HTMLElement | null;
    if (ab?.dataset.act === 'swap') { if (tab === 'pets') S.pet = c.id; else S.mount = c.id; save(); ctx.onChange(); ctx.sfx?.('swap'); ctx.log(`${tab === 'pets' ? '🐾' : '🐴'} ${c.name} agora anda com você.`, '#9aff9a'); render(); return; }
    if (ab?.dataset.act === 'pet') { play(); hearts(6); return; }
    const fb = t.closest('[data-feed]') as HTMLElement | null;
    if (fb) { const f = fb.dataset.feed!; if (c.hunger < 0.05) { ctx.log(`${c.name} está cheio e vira a cara.`, '#c8b898'); return; } if (!ctx.take(f, 1)) return; c.hunger = Math.max(0, c.hunger - (f === 'feno' ? 0.6 : 0.45)); c.joy = Math.min(1, c.joy + 0.03); c.fed = Date.now(); hop = 0.6; runT = 0.4; hearts(2); ctx.sfx?.('eat'); save(); render(); return; }
    const eb = t.closest('[data-eq]') as HTMLElement | null;
    if (eb) { const g = eb.dataset.eq!, slot = GEAR[g].slot; if (!ctx.take(g, 1)) return; const old = c.gear[slot]; if (old) ctx.add(old, 1); c.gear[slot] = g; save(); ctx.onChange(); ctx.sfx?.('swap'); render(); return; }
    const ub = t.closest('[data-uneq]') as HTMLElement | null;
    if (ub) { const slot = ub.dataset.uneq as 'coleira'; const old = c.gear[slot]; if (old) { ctx.add(old, 1); delete c.gear[slot]; save(); ctx.onChange(); render(); } return; } });
  el.addEventListener('change', (e) => { const t = e.target as HTMLInputElement; if (!t.classList.contains('stren')) return; const c = cur(); if (!c) return; const v = t.value.trim().slice(0, 20); if (!v) return; c.name = v; save(); ctx.onChange(); ctx.log(`✎ Agora se chama ${v}.`, '#e8dcc0'); render(); });
  el.addEventListener('keydown', (e) => e.stopPropagation());
  function toggle(on = !open, focus?: { tab: 'pets' | 'mounts'; id?: string }) { open = on; el.style.display = on ? 'flex' : 'none'; if (focus) { tab = focus.tab; sel = focus.id ?? null; } if (on) { render(); last = performance.now(); requestAnimationFrame(frame); } }
  /** clicar na coleira ou no peitoral da mochila: veste no pet que anda com você (o item sai da mochila; o que ele usava volta) */
  function wear(id: string) { const G = GEAR[id]; if (!G) return false; const c = pet(); if (!c) { ctx.log('Nenhum pet anda com você. Abra o Estábulo (X).', '#ff9a8a'); return true; }
    if (!ctx.take(id, 1)) return true; const old = c.gear[G.slot]; if (old) ctx.add(old, 1); c.gear[G.slot] = id; save(); ctx.onChange(); ctx.sfx?.('swap'); hearts(2);
    ctx.log(`🐾 ${c.name} agora usa ${ctx.itemName(id)}${old ? ` (${ctx.itemName(old)} voltou para a mochila)` : ''}.`, '#9aff9a'); if (open) render(); return true; }
  return { adopt, wear, migrate, tick, petStats, mountStats, toggle, get isOpen() { return open; }, get petId() { return S.pet && S.pets[S.pet] ? S.pet : null; }, get mountId() { return S.mount && S.mounts[S.mount] ? S.mount : null; }, owns: (id: string) => !!(S.pets[id] || S.mounts[id]), hearts };
}
