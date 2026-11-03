/* RUNAS NAS MAGIAS (03/11, Erling: "coloque as runas que temos no game, as runas kármicas, que podem ser colocadas em magias e mudam totalmente a
   magia… runas que são dropadas no loot… nem todas as skills recebem runas, apenas as ativas").
   As seis runas da língua de Karmika (runas.ts) caem dos monstros em quatro graus. Encaixadas numa magia ativa (1º encaixe no rank 3, 2º no rank 7),
   cada uma traduz a sua natureza para aquela magia. Regras completas e o efeito por magia: Project, claude/compendio-00-sistema.md e compendio-<classe>.md.
   Este módulo é só dados e armazenamento (sem three.js): o gameplay pergunta `fams(kit, magia)` e aplica. */
export const RFAM = ['lagrima', 'olho', 'ampulheta', 'labirinto', 'fome', 'fresta'] as const;
export type RFam = (typeof RFAM)[number];
export const RNAME: Record<RFam, string> = { lagrima: 'A Lágrima', olho: 'O Olho Kármico', ampulheta: 'A Ampulheta', labirinto: 'O Labirinto', fome: 'A Fome', fresta: 'A Fresta' };
export const RCOL: Record<RFam, number> = { lagrima: 0x8ad8ff, olho: 0xffd24a, ampulheta: 0xe8c890, labirinto: 0x8ad07a, fome: 0xff7a3a, fresta: 0xa890d8 };
export const RICON: Record<RFam, string> = { lagrima: '💧', olho: '👁', ampulheta: '⏳', labirinto: '🌀', fome: '🔥', fresta: '🌑' };
/** a natureza de cada runa numa magia (o que o jogo já faz com ela, em qualquer magia ativa) */
export const RNAT: Record<RFam, string> = {
  lagrima: 'O que escorre: os acertos gelam (lentos por 2 s) e cada lançamento cura um pouco.',
  olho: 'O que enxerga: mais chance de crítico na magia, e o crítico marca o alvo.',
  ampulheta: 'O tempo: a magia volta mais rápido e o eco se repete.',
  labirinto: 'A forma e o número: os acertos saltam para mais um inimigo; torres e autômatos saem em dobro (Viva: em triplo).',
  fome: 'O fogo e o sangue: os acertos queimam e roubam vida; o Escudo Arremessado deixa rastro de fogo e explode no fim.',
  fresta: 'O entre: muito mais dano, mas cada lançamento custa vida e deixa a marca da Fresta na alma.',
};
export const GRAUS = ['Lascada', 'Gravada', 'Viva', 'Desperta'] as const;
/** força de cada grau (o efeito base ×) */
export const GMUL = [1, 1.5, 2, 2.5];
export const runeId = (f: RFam, g: number) => `rn_${f}_${g}`;
export function parseRune(id: string): { f: RFam; g: number } | null { const m = /^rn_([a-z]+)_([0-3])$/.exec(id); if (!m || !(RFAM as readonly string[]).includes(m[1])) return null; return { f: m[1] as RFam, g: +m[2] }; }
/** os itens das runas (24: seis runas × quatro graus) — a mochila registra todos */
export function runeItems(): Record<string, { name: string; icon: string; kind: 'misc'; col: number; desc: string; tier: number; sell: number }> {
  const o: Record<string, { name: string; icon: string; kind: 'misc'; col: number; desc: string; tier: number; sell: number }> = {};
  for (const f of RFAM) for (let g = 0; g < 4; g++) o[runeId(f, g)] = { name: `Runa ${GRAUS[g]}: ${RNAME[f]}`, icon: RICON[f], kind: 'misc', col: RCOL[f], tier: g + 1, sell: [12, 45, 160, 600][g],
    desc: `${RNAT[f]}\nGrau ${GRAUS[g]} (efeito ×${GMUL[g]}). Encaixe numa magia ativa na Árvore Kármica (K): o 1º encaixe abre no rank 3 e o 2º no rank 7. Tirar custa ouro e a runa volta inteira. Três iguais viram uma do grau seguinte no Gravador de Runas. Só caem de monstros do nível 20 para cima: Lascada a partir do 20, Gravada do 35, Viva do 50 e Desperta do 100.${f === 'fresta' ? '\nA Fresta cobra: vida a cada lançamento e a marca na alma.' : ''}` };
  return o;
}
/** a runa que cai do monstro (ou null). tier = nível do bicho; elite/chefe pesa muito */
export function runeDrop(tier: number, big: boolean, boss = false): string | null {
  /* 03/11 (Erling: "caem de monstros a partir do level 20: as runas são transformações para o jogo mais avançado"): nada abaixo do 20, nem de chefe */
  if (tier < 20) return null;
  const p = boss ? 1 : big ? 0.06 + tier * 0.0012 : 0.006 + tier * 0.0002; if (Math.random() > p) return null;
  const f = RFAM[Math.floor(Math.random() * 6)]; let g = 0; const r = Math.random();
  if (boss) g = tier >= 100 && r < 0.25 ? 3 : tier >= 50 ? 2 : tier >= 35 ? 1 : 0; else if (tier >= 100 && big && r < 0.04) g = 3; else if (tier >= 50 && r < (big ? 0.3 : 0.12)) g = 2; else if (tier >= 35 && r < (big ? 0.45 : 0.18)) g = 1;
  return runeId(f, g);
}
/** encaixes que a magia tem agora pelo rank (passivas não têm: o gameplay só chama para ativas) */
export const slotsFor = (rank: number, supreme = false) => (rank >= 10 && supreme ? 3 : rank >= 7 ? 2 : rank >= 3 ? 1 : 0);
/** preço para tirar uma runa (ouro) */
export const unslotCost = (g: number) => [25, 90, 300, 1000][g];

const KEY = 'karmika.runas.v1';
type Store = Record<string, string[]>;
let S: Store = {}; try { S = JSON.parse(localStorage.getItem(KEY) ?? '{}') ?? {}; } catch { S = {}; }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* */ } };
const k2 = (kit: string, id: string) => kit + ':' + id;
/** as runas encaixadas numa magia (ids de item; '' = encaixe vazio) */
export const runesOf = (kit: string, id: string): string[] => S[k2(kit, id)] ?? [];
export function setRune(kit: string, id: string, slot: number, rune: string) { const a = [...(S[k2(kit, id)] ?? [])]; while (a.length <= slot) a.push(''); a[slot] = rune; S[k2(kit, id)] = a; save(); cache.delete(k2(kit, id)); }
/** apaga tudo (personagem novo) */
export function wipeRunes() { S = {}; save(); cache.clear(); }
const cache = new Map<string, Partial<Record<RFam, number>>>();
/** o que a magia tem: família → força (GMUL do grau). Vazio = sem runa */
export function fams(kit: string, id: string | null | undefined): Partial<Record<RFam, number>> {
  if (!id) return {}; const k = k2(kit, id); let c = cache.get(k); if (c) return c; c = {};
  for (const r of S[k] ?? []) { const p = r ? parseRune(r) : null; if (p) c[p.f] = Math.max(c[p.f] ?? 0, GMUL[p.g]); }
  cache.set(k, c); return c;
}
/** a marca da Fresta na alma (contador): sobe a cada magia lançada com a Fresta; a ficha e as facções leem */
const FK = 'karmika.fresta.v1';
export function frestaMark(n = 1) { let v = 0; try { v = +(localStorage.getItem(FK) ?? 0) || 0; v += n; localStorage.setItem(FK, String(v)); } catch { /* */ } return v; }
export function frestaSoul(): number { try { return +(localStorage.getItem(FK) ?? 0) || 0; } catch { return 0; } }
export function frestaText(v = frestaSoul()): string { return v < 20 ? 'limpa' : v < 120 ? 'com um fio de cinza' : v < 400 ? 'rachada pela Fresta' : 'aberta para o entre'; }
