/* GRITOS DE BATALHA (26/10, Erling: "toda vez que vê um elite grande ou um semichefe, seja em masmorra, no mapa ou de missão, ele fala
   algo com sentido para a sua classe e raça — isso traz proximidade com o jogador"). Uma frase ao avistar; a mesma criatura não
   arranca outra por um bom tempo. O chefe tem a sua lista, mais pesada. */
import type { KitKey } from './kits';

import { tl } from './i18n';
type Sex = 'm' | 'f';
/* 10/11: as frases moram em public/lang/<língua>.json (grito.elite.<kit>, grito.chefe.<kit>, grito.instinto.<caminho>).
   Onde a frase muda com o sexo do personagem, o texto traz {masculino|feminino}: "Fui ordenad{o|a}", "your {siervo|sierva}". */
const G = (s: string, sex: Sex) => s.replace(/\{([^{}|]*)\|([^{}|]*)\}/g, (_m, a: string, b: string) => (sex === 'f' ? b : a));
const kitKey = (kit: KitKey) => (kit === 'technocrat' ? 'tecno' : kit);
const lines = (group: 'elite' | 'chefe', kit: KitKey) => { const L = tl(`grito.${group}.${kitKey(kit)}`); return L.length ? L : tl(`grito.${group}.human`); };

const seen = new Map<string, number>(); let lastAny = 0;
/** uma frase ao avistar; null se não é hora (mesma criatura há pouco, ou falou há menos de 20 s) */
export function battleCry(kit: KitKey, sex: Sex, key: string, boss: boolean): string | null {
  const now = performance.now(); if (now - lastAny < 20000) return null; const last = seen.get(key) ?? -1e9; if (now - last < 240000) return null;
  seen.set(key, now); lastAny = now;
  const L = lines(boss ? 'chefe' : 'elite', kit); return L.length ? G(L[Math.floor(Math.random() * L.length)], sex) : null;
}

/* DICA DO INSTINTO (26/10, Erling: "quando o personagem estiver numa área onde vale a pena usar o instinto, ele diz uma frase que dá a
   dica de ligar; cada raça e cada classe tem a sua — 2 tipos já basta"). A classe fala por cima da raça quando já existe. */
const HINT_IDS = new Set(['humano', 'anao', 'elfo', 'gue', 'pal', 'cac', 'tec', 'vam', 'lob', 'mag', 'bru']);
let hintAt = -1e9; const hinted = new Set<string>();
/** a frase-dica (null = não é hora: o mesmo lugar não repete, e no máximo uma a cada 2 minutos) */
export function instinctHint(race: string, path: string | null, key: string): string | null {
  const now = performance.now(); if (now - hintAt < 120000 || hinted.has(key)) return null; hinted.add(key); hintAt = now;
  const id = path && HINT_IDS.has(path) ? path : HINT_IDS.has(race) ? race : 'humano', L = tl(`grito.instinto.${id}`); return L.length ? L[Math.floor(Math.random() * L.length)] : null;
}
