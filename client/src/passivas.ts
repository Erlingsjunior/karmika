/* AS 60 DE CADA CLASSE NO JOGO (03/11, Erling: "não vi mudanças nas árvores de skill… você criou todas mas não implementou? coloque todas").
   Os compêndios (docs/compendio → public/dados/compendio/<kit>.json, gerados por tools_compendio.py) entram na Árvore Kármica:
   - as 25 PASSIVAS DE MAGIA: 3 níveis cada, melhoram a magia que elas citam (dano, crítico, área, duração, recarga, custo, cura dela);
   - as 15 PASSIVAS DE CLASSE: 3 a 5 níveis, entram nos atributos (vida, dano, crítico, defesa, passo, regeneração, recarga…);
   - as ATIVAS do compêndio: as que já existem ganham a ficha e as runas próprias; as novas aparecem com a ficha completa e "em breve".
   Os pontos são os mesmos da Árvore (1 por nível): cada nível de passiva custa 1 e só abre com a magia alvo no rank 3.
   A leitura dos números do texto é aproximada (o texto do compêndio é a ficha; o jogo traduz para os mesmos multiplicadores das magias). */
export interface CompActive { n: number; name: string; type: string; lvl: number; key: string | null; desc: string; runes: Record<string, string>; desperta: string; sup: boolean; aura: boolean }
export interface CompSP { n: number; name: string; target: string; lv: string[]; stat: string; v: ([number, string] | null)[] }
export interface CompCP { n: number; name: string; levels: number; eff: string; stat: string; v: number[] }
export interface Comp { kit: string; title: string; intro: string; actives: CompActive[]; spellPassives: CompSP[]; classPassives: CompCP[]; combos: string[] }
export interface PMods { dmg: number; crit: number; area: number; dur: number; cdr: number; cost: number; heal: number }

const cache = new Map<string, Comp | null>(); const wait = new Map<string, Promise<Comp | null>>();
export function compOf(kit: string): Comp | null { if (cache.has(kit)) return cache.get(kit)!; loadComp(kit); return null; }
export function loadComp(kit: string): Promise<Comp | null> {
  let p = wait.get(kit); if (p) return p;
  p = fetch(`/dados/compendio/${kit}.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null).then((c) => { cache.set(kit, c as Comp | null); onLoad.forEach((f) => f(kit)); return c as Comp | null; });
  wait.set(kit, p); return p;
}
const onLoad: ((kit: string) => void)[] = []; export const onCompLoad = (f: (kit: string) => void) => onLoad.push(f);

const KEY = 'karmika.passivas.v1';
type Store = Record<string, Record<string, number>>; // kit → n → nível
let S: Store = {}; try { S = JSON.parse(localStorage.getItem(KEY) ?? '{}') ?? {}; } catch { S = {}; }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* */ } };
export const passRank = (kit: string, n: number) => S[kit]?.[n] ?? 0;
export function setPass(kit: string, n: number, v: number) { (S[kit] ??= {})[n] = Math.max(0, v); if (!v) delete S[kit][n]; save(); modCache.clear(); }
export const passSpent = (kits: string[]) => kits.reduce((a, k) => a + Object.values(S[k] ?? {}).reduce((x, y) => x + y, 0), 0);
export function wipePass() { S = {}; save(); modCache.clear(); }
export const resetPass = (kit: string) => { delete S[kit]; save(); modCache.clear(); };

/** o número do nível i (1..3) de uma passiva de magia, em fração do multiplicador */
function spVal(p: CompSP, i: number): Partial<PMods> {
  const c = p.v[i - 1] ?? (p.v[0] ? [p.v[0][0] * i, p.v[0][1]] as [number, string] : null); const x = c ? c[0] : 0, u = c ? c[1] : '';
  const fb = { dmg: 0.03 * i }; if (!c) return fb;
  switch (p.stat) {
    case 'dmg': return u === '%' ? { dmg: Math.min(0.35, x / 100) } : fb;
    case 'crit': return u === '%' ? { crit: Math.min(0.25, x / 100) } : { crit: Math.min(0.2, 0.04 * x) };
    case 'area': return u === '%' ? { area: Math.min(0.45, x / 100) } : u === 'm' ? { area: Math.min(0.45, x * 0.12) } : fb;
    case 'dur': return u === '%' ? { dur: Math.min(0.5, x / 100) } : u === 's' ? { dur: Math.min(0.5, x * 0.12) } : fb;
    case 'cd': return u === '%' ? { cdr: Math.min(0.35, x / 100) } : u === 's' ? { cdr: Math.min(0.35, x * 0.08) } : fb;
    case 'cost': return u === '%' ? { cost: Math.min(0.35, x / 100) } : { cost: Math.min(0.35, x * 0.015) };
    case 'heal': return u === '%' ? { heal: Math.min(0.5, x / 100) } : fb;
    default: return u === '%' ? { dmg: Math.min(0.2, x / 100 * 0.25 + 0.02 * i) } : fb; /* efeito especial (lentidão, atordoar…): a magia fica um pouco mais forte */
  }
}
/** texto curto do que o jogo aplica (para a ficha) */
export function spApplied(p: CompSP, i: number) { const m = spVal(p, i), T: Record<string, string> = { dmg: 'dano', crit: 'crítico', area: 'área e alcance', dur: 'duração', cdr: 'recarga mais curta', cost: 'custo menor', heal: 'cura' };
  return Object.entries(m).map(([k, v]) => `+${Math.round((v as number) * 100)}% de ${T[k]}`).join(', '); }
const modCache = new Map<string, PMods>();
/** id da magia no jogo ↔ nome no compêndio: pela tecla ("no jogo, tecla X") ou pelo nome */
export function activeIdOf(c: Comp, kitSkills: { id: string; name: string; k: string }[], nameOrN: string | number): string | null {
  const a = typeof nameOrN === 'number' ? c.actives.find((q) => q.n === nameOrN) : c.actives.find((q) => q.name.toLowerCase() === String(nameOrN).toLowerCase()) ?? c.actives.find((q) => String(nameOrN).toLowerCase().includes(q.name.toLowerCase()) || q.name.toLowerCase().includes(String(nameOrN).toLowerCase()));
  if (!a) return null; const byKey = a.key ? kitSkills.find((s) => s.k === a.key) : null; if (byKey) return byKey.id;
  return kitSkills.find((s) => s.name.toLowerCase() === a.name.toLowerCase())?.id ?? null;
}
/** a ativa do compêndio para uma magia do jogo (pela tecla ou pelo nome) */
export function compActiveFor(c: Comp, sk: { id: string; name: string; k: string }): CompActive | null {
  return c.actives.find((a) => a.key && a.key === sk.k) ?? c.actives.find((a) => a.name.toLowerCase() === sk.name.toLowerCase()) ?? null;
}
/** somas das passivas de magia acesas para uma magia do jogo */
export function passMods(kit: string, skillId: string, kitSkills: { id: string; name: string; k: string }[]): PMods {
  const ck = kit + ':' + skillId; const hit = modCache.get(ck); if (hit) return hit;
  const out: PMods = { dmg: 0, crit: 0, area: 0, dur: 0, cdr: 0, cost: 0, heal: 0 }; const c = cache.get(kit);
  if (c) for (const p of c.spellPassives) { const r = passRank(kit, p.n); if (!r) continue; if (activeIdOf(c, kitSkills, p.target) !== skillId) continue; const m = spVal(p, r); for (const [k, v] of Object.entries(m)) out[k as keyof PMods] += v as number; }
  modCache.set(ck, out); return out;
}
/** as passivas de classe viram atributos (mesmas unidades dos talentos: % e pontos) */
export function classStats(kit: string): Record<string, number> {
  const c = cache.get(kit); const out: Record<string, number> = {}; if (!c) return out;
  for (const p of c.classPassives) { const r = passRank(kit, p.n); if (!r) continue; const e = p.eff.toLowerCase();
    const v = p.v.length ? (p.v[r - 1] ?? p.v[p.v.length - 1] * (r / p.v.length)) : 2 * r;
    const k = /vida máxima|vida max|\bvida\b.*\+|mais vida/.test(e) ? 'hp' : /crítico/.test(e) ? 'crit' : /armadura|defesa|resist/.test(e) ? 'arm' : /veloc.*golpe|ataque mais rápido|cadência/.test(e) ? 'aspd' : /velocidade|passo|anda/.test(e) ? 'move' : /recarga/.test(e) ? 'cdr' : /regenera|por segundo/.test(e) ? 'regen' : /cura/.test(e) ? 'heal' : /roubo de vida|rouba/.test(e) ? 'leech' : 'dmg';
    const val = k === 'move' ? Math.min(6, v / 2) : k === 'arm' ? Math.min(40, v * 2) : k === 'regen' ? Math.min(4, v / 4) : Math.min(k === 'crit' ? 10 : 25, v);
    out[k] = (out[k] ?? 0) + val; }
  return out;
}
