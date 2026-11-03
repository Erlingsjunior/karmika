/* TODAS AS MONTARIAS E PETS NAS LOJAS (03/11, Erling: "você ainda não colocou nas lojas todas as montarias").
   Antes só os três cavalos do Orm e os seis bichos do Corwin estavam à venda; os outros existiam no Estábulo (companions.ts) mas não tinham item
   nem preço. Aqui cada montaria e cada pet de cidade ganham item, preço e lugar na prateleira, com uma aba por terra de origem:
   - Estábulo (Orm, Gorm em Askavik, Rosa no Porto): só os três cavalos da estrada. As outras montarias estão no Shop (loja.ts, aba Estábulo do Domador).
   - Domador (Corwin, Runa, Tibúrcio): os pets de cada terra, também por aba.
   Os de chefe (o pet que só um chefe solta) continuam só no chefe. */
import { ITEMS, PRICES, SHOPDEF, SHOPS, type Item } from '../inventory';
import { MOUNTS, PETS } from '../companions';

/** as montarias do Shop (dinheiro real): todas, menos os três cavalos do Orm e as de chefe. Regra do Shop — "conforto e beleza, nunca força":
 *  elas correm igual ao Corcel Negro do Orm (o mais rápido que se compra com ouro); o que muda é o bicho, a sela e o nível que ele pede */
export const SHOP_MOUNT_SPEED = 1.9;
export const ORM_MOUNTS = ['mount_horse', 'mount_grey', 'mount_black'];
/* 03/11 (Erling: "montarias que o chefe solta ficam no chefe E no Shop: assim quem não tem dinheiro pode jogar e dropar, mas quem tem dinheiro pode ter").
   Hoje os chefes soltam filhotes (pets); toda montaria de chefe que nascer entra aqui sozinha, com a mesma regra. */
export function shopMounts() {
  const mounts = Object.values(MOUNTS).filter((m) => !ORM_MOUNTS.includes(m.id)).map((m) => { const mm = m as typeof m & { lvl?: number }; const boss = isBoss(m.where);
    return { id: m.id, name: m.name, icon: String(ITEMS[m.id]?.icon ?? '🐎'), where: boss ? 'Montarias de chefe' : m.where ?? '', lvl: mm.lvl ?? 0, blurb: (m.blurb ?? '') + (boss ? ` Também cai do chefe: ${m.where}.` : ''), col: m.tint ?? 0x6a4a2e, kind: 'mount' as const }; });
  const pets = Object.values(PETS).filter((p) => isBoss(p.where)).map((p) => { const pp = p as typeof p & { blurb?: string };
    return { id: p.id, name: p.name, icon: String(ITEMS[p.id]?.icon ?? '🐾'), where: 'Filhotes de chefe', lvl: 0, blurb: `${pp.blurb ?? ''} Também cai do chefe: ${String(p.where).replace(/ \(.*\)$/, '')}.`.trim(), col: p.tint ?? 0x8a6a4a, kind: 'pet' as const }; });
  return [...mounts, ...pets];
}
const ICON_M: Record<string, string> = { boar: '🐗', wolf: '🐺', cat: '🐅' };
const LANDS = ['Brasaforja', 'Lithendel', 'Askavik', 'Porto Caldeira', 'Jarlsheim', 'Lumenhal', 'Corvoscuro', 'Uivo Antigo'];
const isBoss = (w?: string) => !!w && /chefe|guardião/.test(w);

export function stockAllMounts() {
  /* montarias: preço pelo nível e pela velocidade (o Baio do Orm, +75%, custa 900) */
  for (const m of Object.values(MOUNTS)) {
    if (!ORM_MOUNTS.includes(m.id)) m.speed = Math.min(m.speed, SHOP_MOUNT_SPEED);
    const mm = m as typeof m & { body?: string; lvl?: number; horse?: { antlers?: number; horn?: number } };
    /* 03/11 (Erling: "a montaria anda mais devagar que a pé? ou é 90% a mais?"): o texto diz quantas vezes mais rápido que A PÉ
       (a pé o herói anda a 80% do passo de base; montado, o passo de base × a velocidade da montaria) */
    const xF = (m.speed / 0.8).toFixed(1).replace('.', ',');
    if (ITEMS[m.id]) ITEMS[m.id].desc = ITEMS[m.id].desc.replace(/^Montaria \(Z\): \+\d+% de velocidade fora de combate\./, `Montaria (Z): fora de combate, anda ${xF}× mais rápido que a pé.`);
    if (!ITEMS[m.id]) ITEMS[m.id] = { name: m.name, icon: mm.horse?.horn ? '🦄' : mm.horse?.antlers ? '🦌' : ICON_M[mm.body ?? ''] ?? '🐎', kind: 'misc', col: m.tint ?? 0x6a4a2e,
      desc: `Montaria (Z): fora de combate, anda ${xF}× mais rápido que a pé.${mm.lvl ? ` Aceita quem tem nível ${mm.lvl} ou mais.` : ''}${m.blurb ? '\n' + m.blurb : ''}${ORM_MOUNTS.includes(m.id) ? '' : '\nDo Shop: aparência rara, corre igual ao Corcel Negro.'}\nUse para levar ao Estábulo (X).`, tier: (mm.lvl ?? 0) >= 40 ? 4 : (mm.lvl ?? 0) >= 20 ? 3 : 2 } as Item;
    if (PRICES[m.id] === undefined) PRICES[m.id] = Math.round((700 + (mm.lvl ?? 0) * 110 + (m.speed - 1.75) * 5000) / 50) * 50;
  }
  for (const p of Object.values(PETS)) {
    const pp = p as typeof p & { blurb?: string; quad: string };
    if (!ITEMS[p.id]) ITEMS[p.id] = { name: p.name, icon: ({ fox: '🦊', wolf: '🐺', rat: '🐀', horse: '🐴', boar: '🐗', cat: '🐈', dog: '🐕', bestia: '🕷' } as Record<string, string>)[pp.quad] ?? '🐾', kind: 'misc', col: p.tint ?? 0x8a6a4a,
      desc: `${pp.blurb ?? 'Um companheiro que busca o que cai no chão.'}${isBoss(p.where) ? `\nFilhote de chefe: cai do ${String(p.where).replace(/ \(.*\)$/, '')} e também está no Shop (T).` : ''}\nUse para levar ao Estábulo (X).`, tier: isBoss(p.where) ? 4 : 2 } as Item;
    if (PRICES[p.id] === undefined && !isBoss(p.where)) PRICES[p.id] = 400; /* o de chefe não se compra com ouro: cai do chefe ou vem do Shop */
  }
  /* as prateleiras, por terra */
  const byLand = (src: Record<string, { id: string; where?: string }>, base: string) => {
    const tabs: { name: string; items: string[] }[] = []; const home = Object.values(src).filter((k) => k.where === base && !isBoss(k.where)).map((k) => k.id);
    for (const L of LANDS) { const ids = Object.values(src).filter((k) => k.where === L).map((k) => k.id); if (ids.length) tabs.push({ name: L, items: ids }); }
    return { home, tabs };
  };
  /* 03/11 (Erling: "quando eu falo de loja não estou falando do estábulo, estou falando do Shop, pagamento em dinheiro — somente cosméticos
     valiosos. Deixe 3 cavalos na loja in-game, o restante no Shop; o nome: Estábulo do Domador"): o Orm fica só com os três cavalos da estrada */
  { const sd = SHOPDEF.estabulo; delete sd.tabs; sd.items = ['mount_horse', 'mount_grey', 'mount_black', 'feno', 'apple']; SHOPS.estabulo = sd.items; sd.note = 'Montarias: Z para montar e desmontar. As montarias das outras terras estão no Shop (T), no Estábulo do Domador.'; }
  { const sd = SHOPDEF.domador, { home, tabs } = byLand(PETS, 'Corwin, o Domador'), extra = sd.items.filter((i) => !PETS[i]);
    sd.tabs = [{ name: '🐾 Do Corwin', items: [...home] }, ...tabs.map((t) => ({ name: t.name, items: t.items })), { name: '🦴 Coleiras e comida', items: extra }]; sd.items = [...new Set(sd.tabs.flatMap((t) => t.items))]; SHOPS.domador = sd.items; }
}
