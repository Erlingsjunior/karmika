/* Profissões de Karmika: cada coleta alimenta um ofício.
   Lenhador → Marceneiro · Minerador → Ferreiro · Esfolador → Costureiro · Herbalista → Alquimista · Pescador → Cozinheiro.
   Sobe com o uso (nível 1–100). Ofício alto abre receitas melhores e dá chance de peças mágicas e raras. */
import { genGear, type Gear, type Slot, type Rarity } from './loot';

export type ProfId = 'sobrevivencia' | 'lenhador' | 'marceneiro' | 'minerador' | 'ferreiro' | 'esfolador' | 'costureiro' | 'herbalista' | 'alquimista' | 'pescador' | 'cozinheiro';
interface Prof { id: ProfId; name: string; ic: string; kind: 'coleta' | 'oficio' | 'base'; pair?: ProfId; desc: string }
export const PROFS: Prof[] = [
  { id: 'sobrevivencia', name: 'Sobrevivência', ic: '🔥', kind: 'base', desc: 'O que todo caminhante sabe fazer com galhos, pedras e corda: as primeiras ferramentas e a fogueira.' },
  { id: 'lenhador', name: 'Lenhador', ic: '🪓', kind: 'coleta', pair: 'marceneiro', desc: 'Corta árvores. Quanto mais corta, mais madeira tira de cada tronco e mais acha seiva viva.' },
  { id: 'marceneiro', name: 'Marceneiro', ic: '🪚', kind: 'oficio', pair: 'lenhador', desc: 'Aparelha a madeira: tábuas, varas, escudos e cabos.' },
  { id: 'minerador', name: 'Minerador', ic: '⛏', kind: 'coleta', pair: 'ferreiro', desc: 'Quebra rochas e veios. Lapida blocos para construção.' },
  { id: 'ferreiro', name: 'Ferreiro', ic: '⚒', kind: 'oficio', pair: 'minerador', desc: 'Funde o minério: pregos, ferramentas de ferro e aço, armas e armaduras.' },
  { id: 'esfolador', name: 'Esfolador', ic: '🔪', kind: 'coleta', pair: 'costureiro', desc: 'Tira o couro das caças. Esfolador bom tira couro fino inteiro.' },
  { id: 'costureiro', name: 'Costureiro', ic: '🧵', kind: 'oficio', pair: 'esfolador', desc: 'Curte e costura o couro: cordas, bolsas, capas e ombreiras.' },
  { id: 'herbalista', name: 'Herbalista', ic: '🌿', kind: 'coleta', pair: 'alquimista', desc: 'Colhe ervas com o alicate, ajoelhado, sem ferir a raiz.' },
  { id: 'alquimista', name: 'Alquimista', ic: '⚗', kind: 'oficio', pair: 'herbalista', desc: 'Destila as ervas: poções de vida e de magia, tônicos e antídotos.' },
  { id: 'pescador', name: 'Pescador', ic: '🎣', kind: 'coleta', pair: 'cozinheiro', desc: 'Pesca nos rios, lagos e no mar. A paciência rende peixes raros.' },
  { id: 'cozinheiro', name: 'Cozinheiro', ic: '🍲', kind: 'oficio', pair: 'pescador', desc: 'Assa, defuma e cozinha: comida que cura e dura na estrada.' },
];
interface Recipe { id: string; prof: ProfId; lvl: number; need: [string, number][]; keep?: string[]; out?: [string, number]; gear?: Slot; label?: string; inv?: string }
export const RECIPES2: Recipe[] = [
  // sobrevivência: as receitas antigas da mochila (a fogueira usa a regra de lugar da mochila)
  { id: 'axe', prof: 'sobrevivencia', lvl: 1, need: [['stick', 3], ['stone', 2], ['rope', 1]], out: ['axe_s', 1], inv: 'axe' },
  { id: 'pick', prof: 'sobrevivencia', lvl: 1, need: [['stick', 3], ['stone', 3], ['rope', 1]], out: ['pick_s', 1], inv: 'pick' },
  { id: 'knife', prof: 'sobrevivencia', lvl: 1, need: [['stick', 1], ['stone', 1], ['rope', 1]], out: ['knife_f', 1], inv: 'knife' },
  { id: 'rod', prof: 'sobrevivencia', lvl: 1, need: [['stick', 2], ['rope', 1]], out: ['rod', 1], inv: 'rod' },
  { id: 'rope_j', prof: 'sobrevivencia', lvl: 1, need: [['herb_j', 3]], out: ['rope', 1], label: 'Trançar corda de junco' },
  { id: 'fire', prof: 'sobrevivencia', lvl: 1, need: [['stick', 4], ['stone', 2]], keep: ['flint'], label: 'Fogueira', inv: 'fire' },
  // marceneiro
  { id: 'plank', prof: 'marceneiro', lvl: 1, need: [['wood', 3]], out: ['plank', 1] },
  { id: 'stick', prof: 'marceneiro', lvl: 1, need: [['wood', 1]], out: ['stick', 3], label: 'Galhos aparados' },
  { id: 'rod_ash', prof: 'marceneiro', lvl: 15, need: [['plank', 2], ['rope', 2], ['sap', 1]], out: ['rod_ash', 1] },
  { id: 'wshield', prof: 'marceneiro', lvl: 10, need: [['plank', 5], ['nail', 2], ['hide', 1]], gear: 'shield', label: 'Escudo de Madeira' },
  // minerador e ferreiro
  { id: 'block', prof: 'minerador', lvl: 1, need: [['stone', 4]], out: ['block', 1], label: 'Lapidar bloco de pedra' },
  { id: 'casco_reator', prof: 'ferreiro', lvl: 25, need: [['ore_i', 5], ['ore_ag', 2], ['nail', 6]], out: ['casco_reator', 1], label: 'Casco de Reator' },
  { id: 'reator_1', prof: 'ferreiro', lvl: 30, need: [['casco_reator', 1], ['fluido_vital', 1], ['cristal_arcano', 1]], out: ['reator_1', 1], label: 'Núcleo de Reator Mk I (precisa do alquimista e dos magos)' },
  { id: 'nail', prof: 'ferreiro', lvl: 1, need: [['ore_i', 1]], out: ['nail', 3] },
  { id: 'knife_i', prof: 'ferreiro', lvl: 6, need: [['ore_i', 2], ['plank', 1]], out: ['knife_i', 1] },
  { id: 'axe_i', prof: 'ferreiro', lvl: 10, need: [['ore_i', 4], ['plank', 1], ['hide', 1]], out: ['axe_i', 1] },
  { id: 'pick_i', prof: 'ferreiro', lvl: 10, need: [['ore_i', 4], ['plank', 1], ['hide', 1]], out: ['pick_i', 1] },
  { id: 'shears_i', prof: 'ferreiro', lvl: 12, need: [['ore_i', 3], ['plank', 1]], out: ['shears_i', 1] },
  { id: 'weapon', prof: 'ferreiro', lvl: 15, need: [['ore_i', 6], ['plank', 1], ['hide', 1]], gear: 'weapon', label: 'Forjar arma' },
  { id: 'helm', prof: 'ferreiro', lvl: 18, need: [['ore_i', 5], ['hide', 1]], gear: 'helm', label: 'Forjar elmo' },
  { id: 'armor', prof: 'ferreiro', lvl: 22, need: [['ore_i', 9], ['hide', 3]], gear: 'armor', label: 'Forjar peitoral' },
  { id: 'axe_st', prof: 'ferreiro', lvl: 30, need: [['ore_i', 10], ['ore_ag', 2], ['plank', 2]], out: ['axe_st', 1] },
  { id: 'pick_st', prof: 'ferreiro', lvl: 30, need: [['ore_i', 10], ['ore_ag', 2], ['plank', 2]], out: ['pick_st', 1] },
  // costureiro
  { id: 'rope', prof: 'costureiro', lvl: 1, need: [['hide', 1]], out: ['rope', 2], label: 'Trançar corda de couro' },
  { id: 'bag_s', prof: 'costureiro', lvl: 5, need: [['hide', 4], ['rope', 2]], out: ['bag_s', 1] },
  { id: 'cape', prof: 'costureiro', lvl: 10, need: [['hide', 6], ['rope', 2]], gear: 'cape', label: 'Costurar capa' },
  { id: 'shoulders', prof: 'costureiro', lvl: 14, need: [['hide', 5], ['hide_f', 1], ['rope', 2]], gear: 'shoulders', label: 'Ombreiras' },
  { id: 'bag_m', prof: 'costureiro', lvl: 15, need: [['hide_f', 4], ['rope', 3]], out: ['bag_m', 1] },
  { id: 'boots', prof: 'costureiro', lvl: 18, need: [['hide_f', 3], ['hide', 2]], gear: 'boots', label: 'Botas de couro' },
  { id: 'bag_l', prof: 'costureiro', lvl: 30, need: [['hide_f', 8], ['hide', 6], ['rope', 4]], out: ['bag_l', 1] },
  // alquimista
  { id: 'fluido_vital', prof: 'alquimista', lvl: 20, need: [['herb_m', 2], ['herb_f', 2], ['dust', 2]], out: ['fluido_vital', 1], label: 'Fluido Vital (para o Núcleo de Reator)' },
  { id: 'inj_s', prof: 'alquimista', lvl: 22, need: [['sangria_c', 2], ['ore_ag', 1], ['herb_g', 1]], out: ['inj_s', 2], label: 'Injeção Automática de Sangue (Sangria dos anões + latão)' },
  { id: 'incenso_m', prof: 'alquimista', lvl: 15, need: [['areia_astral', 1], ['cinzas_mortos', 1], ['herb_m', 2], ['sap', 1]], out: ['incenso_m', 1], label: 'Kit de Incensos de Mortificação (Areia dos magos + Cinzas dos bruxos)' },
  { id: 'pao_azimo', prof: 'cozinheiro', lvl: 12, need: [['trigo_sf', 2], ['herb_g', 1]], out: ['pao_azimo', 2], label: 'Pão Ázimo (Trigo sem Fermento dos tecnocratas)' },
  { id: 'vinho_santo', prof: 'cozinheiro', lvl: 25, need: [['gota_santa', 1], ['apple', 4], ['mead', 1]], out: ['vinho_santo', 1], label: 'Vinho Santo (receita dos anões; Gota de Lágrima Santa dos elfos)' },
  { id: 'potion', prof: 'alquimista', lvl: 1, need: [['herb_g', 2], ['apple', 1]], out: ['potion', 1] },
  { id: 'antidote', prof: 'alquimista', lvl: 5, need: [['herb_g', 1], ['herb_s', 1]], out: ['antidote', 1] },
  { id: 'antidote_j', prof: 'alquimista', lvl: 3, need: [['herb_j', 2], ['herb_g', 1]], out: ['antidote', 1], label: 'Antídoto de junco' },
  { id: 'potion_f', prof: 'alquimista', lvl: 6, need: [['herb_f', 3], ['herb_g', 1]], out: ['potion', 2], label: 'Poção de flores (2)' },
  { id: 'tonic', prof: 'alquimista', lvl: 10, need: [['herb_s', 2], ['herb_g', 1], ['herb_f', 1]], out: ['tonic', 1] },
  { id: 'mana', prof: 'alquimista', lvl: 12, need: [['herb_s', 2], ['dust', 1]], out: ['mana', 1] },
  { id: 'potion_g', prof: 'alquimista', lvl: 20, need: [['herb_r', 2], ['herb_g', 2]], out: ['potion_g', 1] },
  // cozinheiro
  { id: 'cooked', prof: 'cozinheiro', lvl: 1, need: [['meat', 1]], out: ['cooked', 1] },
  { id: 'fishc', prof: 'cozinheiro', lvl: 1, need: [['fish', 1]], out: ['fishc', 1] },
  { id: 'jerky', prof: 'cozinheiro', lvl: 5, need: [['meat', 2]], out: ['jerky', 2] },
  { id: 'sausage', prof: 'cozinheiro', lvl: 10, need: [['meat', 3], ['rope', 1]], out: ['sausage', 3] },
  { id: 'skewer', prof: 'cozinheiro', lvl: 15, need: [['meat', 2], ['apple', 1]], out: ['skewer', 1] },
  { id: 'stew', prof: 'cozinheiro', lvl: 20, need: [['meat', 2], ['fish', 1], ['herb_g', 1]], out: ['stew', 1] },
];
const need = (l: number) => 20 + l * 12;
/** ofícios que só se fazem no ponto de trabalho certo (as vilas e cidades têm um de cada) */
export const STATION_OF: Partial<Record<ProfId, { name: string; icon: string }>> = { marceneiro: { name: 'Bancada de Corte', icon: '🪚' }, ferreiro: { name: 'Forja', icon: '⚒' }, costureiro: { name: 'Mesa do Curtidor', icon: '🧵' }, alquimista: { name: 'Laboratório', icon: '⚗' }, cozinheiro: { name: 'Cozinha', icon: '🍲' } };
interface Ctx { /** trabalho na bancada: barra em volta do ícone, som e animação; step(k) faz a peça k e diz se deu */ craftJob?(j: { prof: string; name: string; icon: string; times: number; step(k: number): boolean; can(): boolean }): void; onLevel?(id: string, name: string, icon: string, lvl: number): void; /** o herói está no ponto de trabalho deste ofício? */ atStation?(prof: string): boolean; /** efeito na bancada quando algo fica pronto */ craftFx?(prof: string): void;
  has(id: string, n?: number): boolean; count(id: string): number; take(id: string, n: number): boolean; add(id: string, n: number): void; addGear(g: Gear): boolean;
  invCraft(id: string): void; itemName(id: string): string; itemIcon(id: string): string; heroLvl(): number;
  log(t: string, c?: string): void; onCraft?(name: string): void;
}
export function createProfessions(ctx: Ctx) {
  const lv: Record<string, { l: number; x: number }> = (() => { try { return JSON.parse(localStorage.getItem('karmika.prof.v1') || '{}'); } catch { return {}; } })();
  for (const p of PROFS) lv[p.id] ??= { l: 1, x: 0 };
  const save = () => { try { localStorage.setItem('karmika.prof.v1', JSON.stringify(lv)); } catch { /* */ } };
  let open = false, sel: ProfId = 'sobrevivencia';
  const el = document.createElement('div'); el.id = 'profw'; document.body.appendChild(el);
  function gain(id: ProfId, n: number) { const p = lv[id]; if (!p || p.l >= 100) return; p.x += n; let up = false; while (p.x >= need(p.l) && p.l < 100) { p.x -= need(p.l); p.l++; up = true; }
    if (up) { const P = PROFS.find((q) => q.id === id)!; ctx.log(`✦ ${P.name} subiu para o nível ${p.l}`, '#ffe08a'); ctx.onLevel?.(id, P.name, P.ic, p.l); } save(); if (open) render(); }
  const ready = (r: Recipe) => lv[r.prof].l >= r.lvl && r.need.every(([i, n]) => ctx.has(i, n)) && (r.keep ?? []).every((k) => ctx.has(k));
  function rarityFor(l: number): Rarity { const x = Math.random(); return x < l / 400 ? 'rare' : x < l / 90 ? 'magic' : 'normal'; }
  /** faz UMA peça; devolve false se não deu (e já avisou o motivo) */
  function one(r: Recipe, first: boolean): boolean {
    if (lv[r.prof].l < r.lvl) { ctx.log(`Precisa de ${PROFS.find((p) => p.id === r.prof)!.name} nível ${r.lvl}.`, '#ff9a8a'); return false; }
    { const S = STATION_OF[r.prof]; if (S && ctx.atStation && !ctx.atStation(r.prof)) { ctx.log(`${S.icon} Isso se faz na ${S.name}. Toda vila e cidade tem uma, em volta da praça.`, '#ff9a8a'); return false; } }
    if (!ready(r)) { if (first) ctx.log('Faltam materiais.', '#ff9a8a'); return false; }
    if (r.inv) { ctx.invCraft(r.inv); gain(r.prof, 4); if (r.inv === 'fire') api.close(); return r.inv !== 'fire'; }
    for (const [i, n] of r.need) ctx.take(i, n);
    if (r.gear) { const L = lv[r.prof].l, g = genGear(Math.max(2, Math.min(ctx.heroLvl() + 2, Math.round(L * 0.6) + 2)), rarityFor(L), r.gear); if (!ctx.addGear(g)) { for (const [i, n] of r.need) ctx.add(i, n); ctx.log('🎒 Sem espaço para equipamento.', '#ff9a8a'); return false; } ctx.log(`⚒ Você fez ${g.name}`, '#ffe08a'); ctx.onCraft?.(g.name); }
    else if (r.out) { ctx.add(r.out[0], r.out[1]); ctx.log(`⚒ Você fez ${r.out[1] > 1 ? r.out[1] + '× ' : ''}${ctx.itemName(r.out[0])}`, '#ffe08a'); ctx.onCraft?.(ctx.itemName(r.out[0])); }
    gain(r.prof, 5 + Math.round(r.lvl * 0.6)); ctx.craftFx?.(r.prof);
    return true;
  }
  /** fazer N peças: com a bancada, vira um trabalho com tempo, som e animação (ctx.craftJob); sem ela, sai na hora */
  function craft(r: Recipe, times = 1) {
    const nm = r.label ?? (r.out ? ctx.itemName(r.out[0]) : r.id), ic = r.out ? ctx.itemIcon(r.out[0]) : r.gear ? '⚒' : '🔥';
    if (ctx.craftJob && !r.inv) {
      /* confere antes de começar (sem gastar nada): nível, bancada e materiais */
      if (lv[r.prof].l < r.lvl) { ctx.log(`Precisa de ${PROFS.find((p) => p.id === r.prof)!.name} nível ${r.lvl}.`, '#ff9a8a'); return; }
      { const S = STATION_OF[r.prof]; if (S && ctx.atStation && !ctx.atStation(r.prof)) { ctx.log(`${S.icon} Isso se faz na ${S.name}. Toda vila e cidade tem uma, em volta da praça.`, '#ff9a8a'); return; } }
      if (!ready(r)) { ctx.log('Faltam materiais.', '#ff9a8a'); return; }
      ctx.craftJob({ prof: r.prof, name: nm, icon: ic, times, step: (k) => { const ok = one(r, k === 0); render(); return ok; }, can: () => ready(r) && (!ctx.atStation || !STATION_OF[r.prof] || ctx.atStation(r.prof)) });
      return;
    }
    for (let k = 0; k < times; k++) if (!one(r, k === 0)) break;
    render();
  }
  function render() {
    if (!open) { el.style.display = 'none'; return; }
    const P = PROFS.find((p) => p.id === sel)!, L = lv[sel], rs = RECIPES2.filter((r) => r.prof === sel).sort((a, b) => a.lvl - b.lvl);
    const pairs: ProfId[][] = [['sobrevivencia'], ['lenhador', 'marceneiro'], ['minerador', 'ferreiro'], ['esfolador', 'costureiro'], ['herbalista', 'alquimista'], ['pescador', 'cozinheiro']];
    const nav = pairs.map((g) => `<div class="pfpair">${g.map((id) => { const p = PROFS.find((q) => q.id === id)!; return `<button data-pf="${id}" class="${id === sel ? 'on' : ''}"><span>${p.ic}</span><b>${p.name}</b><small>${lv[id].l}</small></button>`; }).join('<i class="pfarr">→</i>')}</div>`).join('');
    const pair = P.pair ? PROFS.find((q) => q.id === P.pair)! : null;
    const list = rs.length ? rs.map((r) => { const ok = ready(r), lock = L.l < r.lvl, nm = r.label ?? (r.out ? ctx.itemName(r.out[0]) : r.id), ic = r.out ? ctx.itemIcon(r.out[0]) : r.gear ? '⚒' : '🔥';
      return `<div class="pfr ${ok ? 'ok' : ''} ${lock ? 'lock' : ''}"><span class="pic">${ic}</span><div><b>${nm}${r.out && r.out[1] > 1 ? ` ×${r.out[1]}` : ''}</b>${lock ? `<small class="n">nível ${r.lvl}</small>` : ''}<small>${r.need.map(([i, n]) => `<span class="${ctx.has(i, n) ? 'y' : 'n'}">${ctx.itemName(i)} ${ctx.count(i)}/${n}</span>`).join(' · ')}${(r.keep ?? []).map((k) => ` · <span class="${ctx.has(k) ? 'y' : 'n'}">${ctx.itemName(k)} (ferramenta)</span>`).join('')}${r.gear ? ' · <em>peça aleatória; ofício alto dá mágicas e raras</em>' : ''}</small></div>${lock ? '' : `<button data-pc="${r.id}" ${ok ? '' : 'disabled'}>Fazer</button>${r.inv !== 'fire' && !r.gear ? `<button data-pc5="${r.id}" ${ok ? '' : 'disabled'}>×5</button>` : ''}`}</div>`; }).join('')
      : `<em class="emptyb">${P.name} é coleta: sobe trabalhando no mundo${pair ? ` e abastece o ${pair.name}` : ''}.</em>`;
    el.innerHTML = `<div class="pn profpn"><h2>⚒ Profissões <button data-px>✕</button></h2><div class="pfwrap"><nav class="pfnav">${nav}</nav>
      <div class="pfmain"><div class="pfhead"><span class="big">${P.ic}</span><div><b>${P.name}</b> <small>${P.kind === 'coleta' ? 'coleta' : P.kind === 'oficio' ? 'ofício' : 'básico'} · nível ${L.l}/100</small><div class="pfbar"><i style="width:${Math.round(L.x / need(L.l) * 100)}%"></i></div><small>${P.desc}${pair ? ` ${P.kind === 'coleta' ? 'Abastece' : 'Usa o que vem do'} <a data-pf="${pair.id}">${pair.name}</a>.` : ''}</small></div></div>
      ${(() => { const S = STATION_OF[sel]; if (!S) return ''; const here = !ctx.atStation || ctx.atStation(sel); return `<div class="pfst ${here ? 'here' : 'away'}">${S.icon} ${here ? `Você está na <b>${S.name}</b>: mãos à obra.` : `Só se faz na <b>${S.name}</b>. Toda vila e cidade tem uma, em volta da praça.`}</div>`; })()}
      <div class="pflist ${STATION_OF[sel] && ctx.atStation && !ctx.atStation(sel) ? 'away' : ''}">${list}</div></div></div><small class="ft">Y abre e fecha · Esc fecha</small></div>`;
    el.style.display = 'flex';
  }
  el.addEventListener('click', (e) => { const t = e.target as HTMLElement;
    if (t.closest('[data-px]')) { api.close(); return; }
    const pf = (t.closest('[data-pf]') as HTMLElement | null)?.dataset.pf; if (pf) { sel = pf as ProfId; render(); return; }
    const pc = (t.closest('[data-pc]') as HTMLElement | null)?.dataset.pc; if (pc) { const r = RECIPES2.find((x) => x.id === pc); if (r) craft(r); return; }
    const p5 = (t.closest('[data-pc5]') as HTMLElement | null)?.dataset.pc5; if (p5) { const r = RECIPES2.find((x) => x.id === p5); if (r) craft(r, 5); return; } });
  const api = {
    get isOpen() { return open; }, toggle() { open = !open; render(); }, openAt(prof: ProfId) { sel = prof; open = true; render(); }, close() { open = false; render(); }, refresh() { if (open) render(); },
    gain, level: (id: ProfId) => lv[id]?.l ?? 1,
  };
  return api;
}
