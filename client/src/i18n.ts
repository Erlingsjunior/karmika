/* 10/11 (Erling: "todas as frases dentro do jogo recebem os dados de um arquivo com toda a história, itens e falas do jogo; quando mudamos
   a língua muda o arquivo de referência e não precisamos mexer no código. JSON chave e valor: as chaves vão no código").

   COMO FUNCIONA
   - O texto mora em client/public/lang/<língua>.json (pt, en, es, lv). Cada linha é "chave": "frase" (ou uma lista de frases).
   - No código só vai a chave:  t('ataque.inicio', { lider: 'Lobo', vila: 'Karmika' })  →  a frase da língua escolhida, com {lider} e {vila} trocados.
     Aceita {nome} e ${nome}. O que não vier em `vars` fica como está (as falas dos NPCs trocam {nome} depois).
   - tl('bark.manha') devolve a lista inteira (falas sorteadas).
   - Plural: se vars.n === 1 e existir "chave#1", usa essa (ex.: "lvlup.atributos#1": "{n} atributo").
   - Falta a chave na língua escolhida? Usa a do português. Falta no português também? Mostra a própria chave (fácil de achar o que falta).
   - A língua vem de ?lang=en na URL, depois do que a pessoa escolheu (localStorage karmika.lang, o mesmo da landing), depois do navegador.
   - Os arquivos carregam antes do jogo começar (await no topo do módulo), então t() já responde na primeira linha de quem importa.
   Trocar uma frase ou traduzir o jogo = editar o JSON. Não precisa recompilar nada. */
export type Lang = 'pt' | 'en' | 'es' | 'lv';
export const LANGS: { id: Lang; name: string }[] = [{ id: 'pt', name: 'Português' }, { id: 'en', name: 'English' }, { id: 'es', name: 'Español' }, { id: 'lv', name: 'Latviešu' }];
type Val = string | string[] | [string, string][];
type Dict = Record<string, Val>;

function pick(): Lang {
  const ok = (v: string | null | undefined): Lang | null => { const s = (v || '').slice(0, 2).toLowerCase(); return LANGS.some((l) => l.id === s) ? (s as Lang) : null; };
  try { const q = ok(new URLSearchParams(location.search).get('lang')); if (q) { try { localStorage.setItem('karmika.lang', q); } catch { /* */ } return q; } } catch { /* */ }
  try { const s = ok(localStorage.getItem('karmika.lang')); if (s) return s; } catch { /* */ }
  try { return ok(navigator.language) ?? 'pt'; } catch { return 'pt'; }
}
export const LANG: Lang = pick();
declare const __BUILD_ID__: string;
const VER = typeof __BUILD_ID__ !== 'undefined' ? __BUILD_ID__ : String(Date.now());
async function load(l: Lang): Promise<Dict> {
  try { const r = await fetch(`/lang/${l}.json?v=${VER}`); return r.ok ? ((await r.json()) as Dict) : {}; } catch { return {}; }
}
const PT: Dict = await load('pt');
const CUR: Dict = LANG === 'pt' ? PT : await load(LANG);
if (typeof document !== 'undefined') document.documentElement.lang = LANG === 'pt' ? 'pt-BR' : LANG;
const missing = new Set<string>();

function raw(key: string, n?: number): Val | undefined {
  if (n === 1) { const one = CUR[key + '#1'] ?? PT[key + '#1']; if (one !== undefined) return one; }
  const v = CUR[key] ?? PT[key];
  if (v === undefined && !missing.has(key)) { missing.add(key); console.warn('[i18n] falta a chave', key); }
  return v;
}
function fill(s: string, vars?: Record<string, string | number>) {
  return vars ? s.replace(/\$?\{(\w+)\}/g, (m, k: string) => (vars[k] !== undefined ? String(vars[k]) : m)) : s;
}
/** a frase da chave na língua escolhida, com as variáveis trocadas */
export function t(key: string, vars?: Record<string, string | number>): string {
  const v = raw(key, typeof vars?.n === 'number' ? vars.n : undefined);
  if (v === undefined) return key;
  return fill(Array.isArray(v) ? String(v[Math.floor(Math.random() * v.length)]) : v, vars);
}
/** a lista de frases da chave (falas sorteadas) */
export function tl(key: string): string[] { const v = raw(key); return Array.isArray(v) ? (v as string[]) : v === undefined ? [] : [v]; }
/** a lista de pares da chave (conversas: um fala, o outro responde) */
export function tp(key: string): [string, string][] { const v = raw(key); return Array.isArray(v) ? (v as [string, string][]) : []; }
/** troca a língua e recarrega o jogo */
export function setLang(l: Lang) { try { localStorage.setItem('karmika.lang', l); } catch { /* */ } const u = new URL(location.href); u.searchParams.delete('lang'); location.replace(u.toString()); }
/** (teste) chaves pedidas que não existem em nenhum arquivo */
(globalThis as unknown as { __i18nMissing?: () => string[] }).__i18nMissing = () => [...missing];
