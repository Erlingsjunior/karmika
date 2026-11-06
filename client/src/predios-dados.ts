/* Medidas dos prédios grandes que o gerador do mundo (world.ts) precisa saber sem carregar o 3D (06/11).
   A Prefeitura de Lumenhal: pegada em tiles (2 m), paredes sólidas em metros locais [x0, z0, x1, z1] (a porta aberta no meio da frente)
   e onde o Prefeito fica (metros locais, diante da mesa). O desenho está em prefeitura3d.ts. */
export const PREF_SIZE = { w: 13, h: 10 };
export const PREF_WALLS: [number, number, number, number][] = [[-12, -9.5, 12, -9.5], [-12, -9.5, -12, 7.5], [12, -9.5, 12, 7.5], [-12, 7.5, -2, 7.5], [2, 7.5, 12, 7.5]];
export const PREF_MAYOR: [number, number] = [0, -4.6];
/** pegada (tiles) das bibliotecas por variante: 0 Grande Biblioteca, 1 Biblioteca de Lumenhal, 2 Prefeitura */
export const LIB_FOOT: Record<number, { w: number; h: number }> = { 0: { w: 18, h: 14 }, 1: { w: 11, h: 9 }, 2: PREF_SIZE };
