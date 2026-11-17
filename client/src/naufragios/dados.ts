/* A COSTA DOS NAUFRÁGIOS (17/11, Erling: "Costa dos Naufrágios TEM que fazer": encher de embarcações encalhadas, quebradas e deterioradas).
   Onde ficam os cascos e de que tipo é cada um. A conta sai da casa do mapa (sem sorteio guardado): o mesmo casco está sempre no mesmo lugar,
   em todas as máquinas. Os modelos estão em modelos.ts; quem põe no mundo é index.ts. */
export type TipoCasco = 'galeao' | 'proa' | 'bote';
export interface Casco { tipo: TipoCasco; /** centro, em casas do mapa */ x: number; y: number; /** para onde aponta a proa (rad) */ giro: number; /** quanto tombou de lado (rad) */ tomba: number; /** na água rasa (meio afundado) ou na areia */ naAgua: boolean; semente: number }
/** comprimento de cada tipo, em casas do mapa (2 m cada), e a meia largura que bloqueia a passagem */
export const TAMANHO: Record<TipoCasco, { comp: number; meia: number }> = { galeao: { comp: 8, meia: 1.3 }, proa: { comp: 4, meia: 1.1 }, bote: { comp: 2.4, meia: 0.7 } };
export const REGIAO = 'Costa dos Naufrágios';
/** a grade de procura (um casco, no máximo, por quadrado deste tamanho) e o teto de cascos */
export const GRADE = 8, TETO = 90;
/** número de 0 a 1 que depende só da casa e de um sal */
export const conta = (x: number, y: number, sal: number) => { let h = (x * 374761393 + y * 668265263 + sal * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

export interface TerrenoCtx { largura: number; altura: number; piso(x: number, y: number): string | undefined; regiao(x: number, y: number): string; praia(x: number, y: number): number; chao(xm: number, zm: number): number; agua: number; T: number; /** pontos onde nascem bichos: o casco não nasce em cima */ ninhos: { x: number; y: number }[] }
/** todos os cascos da costa, sempre os mesmos */
export function acha(K: TerrenoCtx): Casco[] { const L: Casco[] = [];
  for (let gy = 0; gy < K.altura && L.length < TETO; gy += GRADE) for (let gx = 0; gx < K.largura && L.length < TETO; gx += GRADE) {
    if (K.regiao(gx + (GRADE >> 1), gy + (GRADE >> 1)) !== REGIAO) continue;
    /* dentro do quadrado, a melhor casa de areia (a mais perto da água) e a melhor casa de água rasa; a conta do quadrado escolhe entre as duas */
    let ax = -1, ay = -1, ak = 0, wx = -1, wy = -1, wk = -1e9;
    for (let y = gy; y < gy + GRADE; y++) for (let x = gx; x < gx + GRADE; x++) { const p = K.piso(x, y), d = conta(x, y, 19) * 0.2;
      if (p === 'grass') { const k = K.praia(x, y); if (k > 0.5 && k + d > ak) { ak = k + d; ax = x; ay = y; } }
      else if (p === 'water') { const h = K.chao((x + 0.5) * K.T, (y + 0.5) * K.T); if (h > K.agua - 1.4 && h + d > wk) { wk = h + d; wx = x; wy = y; } } }
    const u = conta(gx, gy, 13), naAgua = ax < 0 || (wx >= 0 && u < 0.3), x = naAgua ? wx : ax, y = naAgua ? wy : ay; if (x < 0) continue; if (conta(gx, gy, 20) > (naAgua ? 0.55 : 0.9)) continue;
    if (K.ninhos.some((q) => Math.hypot(q.x - x, q.y - y) < 4)) continue;
    const v = conta(gx, gy, 14), tipo: TipoCasco = v < 0.42 ? 'galeao' : v < 0.75 ? 'proa' : 'bote';
    L.push({ tipo, x, y, giro: conta(gx, gy, 15) * 6.283, tomba: (0.25 + conta(gx, gy, 16) * 0.45) * (conta(gx, gy, 17) < 0.5 ? -1 : 1), naAgua, semente: Math.floor(conta(gx, gy, 18) * 1e6) }); }
  return L; }
/** as casas do mapa que o casco ocupa (ninguém atravessa a madeira) */
export function casasDe(c: Casco): [number, number][] { const { comp, meia } = TAMANHO[c.tipo], s = Math.sin(c.giro), co = Math.cos(c.giro), O: [number, number][] = [], R = Math.ceil(comp / 2 + 1);
  for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) { const ao = dx * s + dy * co, la = dx * co - dy * s; if (Math.abs(ao) <= comp / 2 - 0.4 && Math.abs(la) <= meia - 0.35) O.push([c.x + dx, c.y + dy]); } return O; }
