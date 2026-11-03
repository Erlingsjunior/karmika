/* TODAS AS MONTARIAS E PETS NAS LOJAS (03/11, Erling: "você ainda não colocou nas lojas todas as montarias").
   Antes só os três cavalos do Orm e os seis bichos do Corwin estavam à venda; os outros existiam no Estábulo (companions.ts) mas não tinham item
   nem preço. Aqui cada montaria e cada pet de cidade ganham item, preço e lugar na prateleira, com uma aba por terra de origem:
   - Estábulo (Orm, Gorm em Askavik, Rosa no Porto): abas Estrada, Brasaforja, Lithendel, Askavik, Porto Caldeira, Jarlsheim, Lumenhal, Corvoscuro e Uivo Antigo.
   - Domador (Corwin, Runa, Tibúrcio): os pets de cada terra, também por aba.
   Os de chefe (o pet que só um chefe solta) continuam só no chefe. */
import { ITEMS, PRICES, SHOPDEF, SHOPS, type Item } from '../inventory';
import { MOUNTS, PETS } from '../companions';

const ICON_M: Record<string, string> = { boar: '🐗', wolf: '🐺', cat: '🐅' };
const LANDS = ['Brasaforja', 'Lithendel', 'Askavik', 'Porto Caldeira', 'Jarlsheim', 'Lumenhal', 'Corvoscuro', 'Uivo Antigo'];
const isBoss = (w?: string) => !!w && /chefe|guardião/.test(w);

export function stockAllMounts() {
  /* montarias: preço pelo nível e pela velocidade (o Baio do Orm, +75%, custa 900) */
  for (const m of Object.values(MOUNTS)) {
    if (isBoss(m.where)) continue;
    const mm = m as typeof m & { body?: string; lvl?: number; horse?: { antlers?: number; horn?: number } };
    if (!ITEMS[m.id]) ITEMS[m.id] = { name: m.name, icon: mm.horse?.horn ? '🦄' : mm.horse?.antlers ? '🦌' : ICON_M[mm.body ?? ''] ?? '🐎', kind: 'misc', col: m.tint ?? 0x6a4a2e,
      desc: `Montaria (Z): +${Math.round((m.speed - 1) * 100)}% de velocidade fora de combate.${mm.lvl ? ` Aceita quem tem nível ${mm.lvl} ou mais.` : ''}${m.blurb ? '\n' + m.blurb : ''}\nUse para levar ao Estábulo (X).`, tier: (mm.lvl ?? 0) >= 40 ? 4 : (mm.lvl ?? 0) >= 20 ? 3 : 2 } as Item;
    if (PRICES[m.id] === undefined) PRICES[m.id] = Math.round((700 + (mm.lvl ?? 0) * 110 + (m.speed - 1.75) * 5000) / 50) * 50;
  }
  for (const p of Object.values(PETS)) {
    if (isBoss(p.where)) continue;
    const pp = p as typeof p & { blurb?: string; quad: string };
    if (!ITEMS[p.id]) ITEMS[p.id] = { name: p.name, icon: ({ fox: '🦊', wolf: '🐺', rat: '🐀', horse: '🐴', boar: '🐗', cat: '🐈', dog: '🐕', bestia: '🕷' } as Record<string, string>)[pp.quad] ?? '🐾', kind: 'misc', col: p.tint ?? 0x8a6a4a,
      desc: `${pp.blurb ?? 'Um companheiro que busca o que cai no chão.'}\nUse para levar ao Estábulo (X).`, tier: 2 } as Item;
    if (PRICES[p.id] === undefined) PRICES[p.id] = 400;
  }
  /* as prateleiras, por terra */
  const byLand = (src: Record<string, { id: string; where?: string }>, base: string) => {
    const tabs: { name: string; items: string[] }[] = []; const home = Object.values(src).filter((k) => k.where === base).map((k) => k.id);
    for (const L of LANDS) { const ids = Object.values(src).filter((k) => k.where === L).map((k) => k.id); if (ids.length) tabs.push({ name: L, items: ids }); }
    return { home, tabs };
  };
  { const sd = SHOPDEF.estabulo, { home, tabs } = byLand(MOUNTS, 'Orm, o Estalajadeiro'), extra = sd.items.filter((i) => !MOUNTS[i]);
    sd.tabs = [{ name: '🐴 Estrada', items: [...home, ...extra] }, ...tabs.map((t) => ({ name: t.name, items: [...t.items, 'feno'] }))]; sd.items = [...new Set(sd.tabs.flatMap((t) => t.items))]; SHOPS.estabulo = sd.items;
    sd.note = 'Montarias de todas as terras de Karmika (cada aba é a terra de onde o bicho vem). Z monta e desmonta.'; }
  { const sd = SHOPDEF.domador, { home, tabs } = byLand(PETS, 'Corwin, o Domador'), extra = sd.items.filter((i) => !PETS[i]);
    sd.tabs = [{ name: '🐾 Do Corwin', items: [...home] }, ...tabs.map((t) => ({ name: t.name, items: t.items })), { name: '🦴 Coleiras e comida', items: extra }]; sd.items = [...new Set(sd.tabs.flatMap((t) => t.items))]; SHOPS.domador = sd.items; }
}
