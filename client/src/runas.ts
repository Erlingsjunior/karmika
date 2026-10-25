/* As runas de Karmika (as mesmas da moldura da Bíblia, e outras no mesmo traço). NÃO são runas nórdicas:
   o alfabeto de Karmika nasce do Olho, da Ampulheta, da Lágrima e do Labirinto. Traço dourado, viewBox 28×28. */
export const RUNAS: { id: string; nome: string; d: string; fill?: string }[] = [
  { id: 'olho', nome: 'O Olho (losango)', d: 'M4 14 L14 7 L24 14 L14 21 Z', fill: 'M14 11 L17 14 L14 17 L11 14Z' },
  { id: 'ampulheta', nome: 'A Ampulheta', d: 'M8 3 H20 L14 14 L20 25 H8 L14 14 Z' },
  { id: 'lagrima', nome: 'A Lágrima', d: 'M14 4 C19 11 21 17 14 23 C7 17 9 11 14 4Z' },
  { id: 'ampulheta-deitada', nome: 'A Ampulheta deitada', d: 'M3 8 V20 L14 14 L25 20 V8 L14 14 Z' },
  { id: 'kk', nome: 'Os dois Ks', d: 'M5 4 V24 M5 14 L12 7 M5 14 L12 21 M23 4 V24 M23 14 L16 7 M23 14 L16 21' },
  { id: 'amendoa', nome: 'O Olho aberto', d: 'M3 14 Q14 4 25 14 Q14 24 3 14 Z', fill: 'M14 11 a3 3 0 1 0 0.01 0Z' },
  { id: 'labirinto', nome: 'O Labirinto', d: 'M14 3 A11 11 0 1 1 5.5 7.5 M14 8 A6 6 0 1 0 20 14 M14 12 V3' },
  { id: 'fio', nome: 'O Fio', d: 'M3 21 C8 21 8 7 14 7 C20 7 20 21 25 21 M14 7 V12', fill: 'M14 12 a2 2 0 1 0 0.01 0Z' },
  { id: 'fio-cortado', nome: 'O Fio cortado', d: 'M3 18 C7 18 8 9 12 9 M16 19 C20 19 21 10 25 10 M11 6 L17 22' },
  { id: 'passo', nome: 'O Passo', d: 'M9 23 C6 18 7 12 11 11 C14 10 15 15 13 19 C12 22 11 24 9 23Z M17 9 a2 2 0 1 0 0.01 0Z M20 12 a1.6 1.6 0 1 0 0.01 0Z M15 6 a1.8 1.8 0 1 0 0.01 0Z' },
  { id: 'sem-passo', nome: 'O Sem-Passo', d: 'M14 4 A10 10 0 0 1 24 14 M24 14 A10 10 0 0 1 14 24 M10 5 A10 10 0 0 0 5 18 M9 9 L19 19 M19 9 L9 19' },
  { id: 'essencia', nome: 'A Essência', d: 'M14 3 L16.5 11.5 L25 14 L16.5 16.5 L14 25 L11.5 16.5 L3 14 L11.5 11.5 Z' },
  { id: 'caminho', nome: 'O Caminho', d: 'M14 14 m-1 0 a1 1 0 1 1 2 0 a3 3 0 1 1 -6 0 a5 5 0 1 1 10 0 a7 7 0 1 1 -14 0 a9 9 0 1 1 18 0' },
  { id: 'balanca', nome: 'O Equilíbrio', d: 'M14 4 V24 M6 8 H22 M6 8 L3 15 H9 Z M22 8 L19 15 H25 Z M10 24 H18' },
  { id: 'chama', nome: 'A Chama do Olho', d: 'M14 3 C18 9 21 12 19 18 C18 22 16 24 14 24 C10 24 8 21 9 17 C10 14 12 13 12 10 C14 12 15 14 15 16 C17 13 16 8 14 3Z' },
  { id: 'porta', nome: 'A Porta do centro', d: 'M7 25 V12 Q14 2 21 12 V25 M11 25 V15 Q14 10 17 15 V25' },
];
/** a runa como SVG (traço na cor do texto: use `color` no CSS) */
export function runaSvg(i: number, w = 28) {
  const r = RUNAS[((i % RUNAS.length) + RUNAS.length) % RUNAS.length];
  return `<svg viewBox="0 0 28 28" width="${w}" height="${w}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" aria-label="${r.nome}"><path d="${r.d}"/>${r.fill ? `<path d="${r.fill}" fill="currentColor" stroke="none"/>` : ''}</svg>`;
}
