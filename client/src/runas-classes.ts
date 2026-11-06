/* AS RUNAS EM CADA MAGIA, EM TODAS AS CLASSES (06/11, Erling: "e as outras classes? não tem que fazer o sistema de runas alterando
   habilidades em todas as classes?").
   O compêndio de cada classe (public/dados/compendio/<kit>.json, o mesmo que a Árvore mostra) diz o que cada uma das 6 runas faz em
   cada magia ativa. Aqui o jogo LÊ esse texto e monta o efeito com as peças que o gameplay sabe aplicar (lento, congelar, queimar, eco,
   salto, marca, puxão, empurrão, prender, explosão, chão em chamas, chão que retarda, cura e recarga).
   - O Elfo tem o efeito escrito à mão (runas-elfo.ts) — esse vale primeiro.
   - As outras classes usam a leitura do texto do compêndio (aproximada: o número exato do texto vira a peça mais parecida).
   - Se o texto não tiver nada que o jogo saiba fazer, vale o efeito genérico da runa (runas-magia.ts). */
import type { RFam } from './runas-magia';
import { ELF_RUNES, type RuneFx, type ROp, type RCastOp } from './runas-elfo';
import { compOf, compActiveFor } from './passivas';
import { KITS } from './kits';

/** o kit do jogo → o arquivo do compêndio */
const COMP_OF: Record<string, string> = { human: 'human', elf: 'elf', dwarf: 'dwarf', nordic: 'nordic', tecno: 'tecno', pal: 'pal', vam: 'vam', lob: 'lob', mag: 'mag', bru: 'bru', cac: 'cac' };

const num = (t: string, re: RegExp, def: number) => { const m = re.exec(t); return m ? parseFloat(m[1].replace(',', '.')) : def; };
/** lê o texto de uma runa numa magia e devolve as peças do efeito (ou null se nada do texto vira efeito) */
export function parseRuneText(f: RFam, raw: string): RuneFx | null {
  const t = raw.toLowerCase(), hit: ROp[] = [], cast: RCastOp[] = [];
  const secs = (def: number) => Math.min(6, num(t, /(\d+(?:,\d+)?)\s*s\b/, def));
  const pct = num(t, /(\d+)\s*%/, 0);
  if (/congel/.test(t)) hit.push({ t: 'freezeN', n: /cada|acerto|vezes|acumula|seguid/.test(t) ? 4 : 2, s: Math.min(2, num(t, /congela[^.]*?(\d+(?:,\d+)?)\s*s/, 1)) });
  if (/retard|lent[oa]s?\b|lentid|devagar|grudent|escorreg|geada|n[ãa]o podem (esquivar|correr)/.test(t)) hit.push({ t: 'slow', s: secs(2) });
  if (/queim|em chamas|brasa|incendei|pega fogo|fogo negro|sangr|ferve/.test(t)) hit.push({ t: 'burn', s: secs(3) });
  if (/ch[ãa]o (fica |arde|em brasa|em chamas)|arde no ch|o mato arde|rastro de fogo|po[çc]a de fogo|chão em brasa/.test(t)) hit.push({ t: 'fireGround', r: 2, s: secs(4) });
  if (/po[çc]a|pista de gelo|ch[ãa]o (coberto de )?gelo|rio de seiva|ch[ãa]o grudento|n[ée]voa gelad|neblina/.test(t)) hit.push({ t: 'iceGround', r: 2.5, s: secs(4) });
  if (/marca|ponto fraco|cr[íi]tico|ignora (\d+% d[ae] )?(a )?(armadura|bloqueio|escudo|resist)|pelas costas/.test(t)) hit.push({ t: 'mark', s: secs(f === 'olho' ? 3 : 2) });
  if (/salta|ricochet|pula(m)? (para|pelo|de)|em leque|outros? inimigos?|mais \d+ inimigos|at[ée] \d+ inimigos|dois|tr[êe]s|quatro/.test(t) && f !== 'ampulheta') hit.push({ t: 'seek', n: Math.max(1, Math.min(4, num(t, /(\d+)\s*(?:inimigos|alvos|saltos|brasas|vezes|flechas|ramos)/, f === 'labirinto' ? 2 : 1))), mul: 0.5 });
  if (/puxa|suga|arrasta|atrai|para o (meio|centro)/.test(t)) hit.push({ t: 'pull', m: 2.5 });
  if (/empurra|joga(do)? (para )?(tr[áa]s|longe)|arremessa (o|os) inimigo/.test(t)) hit.push({ t: 'knock', m: 3 });
  if (/prende|pres[oa]s? no ch|amarra|atordo|derruba|paralis|imobiliz|pavor/.test(t)) hit.push({ t: 'root', s: Math.min(2, secs(1)) });
  if (/(morre|morrer|ao matar)[^.]*explod|explode[^.]*(morre|morrer)/.test(t)) hit.push({ t: 'deathBoom', mul: Math.min(2, Math.max(0.6, pct ? pct / 100 : 1)), r: 3 });
  else if (/explod|estour|explos[ãa]o/.test(t)) hit.push({ t: 'boom', mul: Math.min(2.5, Math.max(0.5, pct > 30 ? pct / 100 : 0.8)), r: 3, d: /depois|no fim|quando acaba|atraso/.test(t) ? 1 : 0.3 });
  if (f === 'ampulheta' && /eco|de novo|segunda|duas vezes|repete|volta pelo|outra vez|reabre|volta a/.test(t)) hit.push({ t: 'echo', d: num(t, /(\d+(?:,\d+)?)\s*s depois/, 1), mul: Math.min(0.7, pct && pct < 100 ? pct / 100 : 0.4) });
  if (/rouba|roubo de vida|devolve.*vida|bebe|sangue volta|cura voc[êe] (pelo|com o)/.test(t)) hit.push({ t: 'healHit', pct: 0.01 });
  if (/\bcura|curam\b|escudo de|regenera/.test(t)) cast.push({ t: 'heal', pct: Math.min(0.12, Math.max(0.03, pct && pct <= 30 ? pct / 100 : 0.04)) });
  if (/recarga|volta mais r[áa]pido|carga extra|\d+ cargas|cargas/.test(t) || (f === 'ampulheta' && !hit.length)) cast.push({ t: 'cdr', k: 0.8 });
  /* não mais que 4 peças: o resto do texto fica como descrição (o efeito não vira uma bola de neve) */
  if (!hit.length && f === 'labirinto') hit.push({ t: 'seek', n: Math.max(1, Math.min(3, num(t, /(\d+)/, 2))), mul: 0.45 }); /* o Labirinto é sempre forma e número: mais alvos */
  if (!hit.length && f === 'olho') hit.push({ t: 'mark', s: 2 }); /* o Olho sempre enxerga o alvo */
  if (!hit.length && f === 'fome' && /sangue|ferve|perde|come/.test(t)) hit.push({ t: 'healHit', pct: 0.01 }, { t: 'burn', s: 2 });
  const H = hit.slice(0, 4);
  if (!H.length && !cast.length) return null;
  return { txt: raw, hit: H, cast };
}

const cache = new Map<string, RuneFx | null>();
/** o efeito próprio da runa nesta magia (Elfo à mão; as outras, lidas do compêndio), ou null: vale o genérico */
export function runeFxOf(kit: string, id: string | null | undefined, f: RFam): RuneFx | null {
  if (!id || id === 'guard') return null;
  if (kit === 'elf') { const e = ELF_RUNES[id]?.[f]; if (e) return e; }
  const ck = COMP_OF[kit]; if (!ck) return null;
  const key = kit + ':' + id + ':' + f; if (cache.has(key)) return cache.get(key)!;
  const C = compOf(ck); if (!C) return null; /* o compêndio ainda está chegando: vale o genérico até lá (sem guardar) */
  const sk = (KITS[kit as keyof typeof KITS] ?? []).find((s) => s.id === id); const a = sk ? compActiveFor(C, sk) : null; const txt = a?.runes?.[f];
  const fx = txt ? parseRuneText(f, txt) : null; cache.set(key, fx); return fx;
}
/** o que o jogo aplica, em poucas palavras (aparece embaixo do texto da runa no encaixe) */
export function runeAppliedText(kit: string, id: string, f: RFam): string | null {
  const fx = runeFxOf(kit, id, f); if (!fx) return null;
  const W: Record<string, string> = { slow: 'deixa lento', freezeN: 'congela', burn: 'queima', echo: 'eco do golpe', seek: 'salta para outros', mark: 'marca o ponto fraco', pull: 'puxa', knock: 'empurra', root: 'prende', boom: 'explode', deathBoom: 'explode ao morrer', fireGround: 'chão em chamas', iceGround: 'chão que retarda', healHit: 'rouba vida', heal: 'cura ao lançar', cdr: 'recarga menor' };
  const L = [...new Set([...(fx.hit ?? []), ...(fx.cast ?? [])].map((o) => W[o.t]).filter(Boolean))]; return L.length ? L.join(' · ') : null;
}
export { type RuneFx, type ROp };
