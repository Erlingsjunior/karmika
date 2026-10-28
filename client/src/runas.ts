/* As runas de Karmika. NÃO são runas nórdicas: a língua rúnica de Karmika tem seis runas (Lágrima, Olho Kármico,
   Ampulheta, Labirinto, Fome e a Fresta). Traço dourado vazado (linha dupla), viewBox 28×28. */
export const RUNAS: { id: string; nome: string; d: string; fill?: string }[] = [
  /* 28/10/2026 (Erling): a NOVA língua rúnica de Karmika — seis runas, cada uma um pilar do mundo. As cinco do Erling e a sexta,
     "A Fresta": usada em todo ritual, sem que ninguém saiba o que quer dizer (Volume I); no Volume II, a revelação. */
  { id: 'lagrima', nome: 'A Lágrima', d: 'M14 3 C17 9 21 13.5 21 18 A7 7 0 0 1 7 18 C7 13.5 11 9 14 3Z' },
  { id: 'olho', nome: 'O Olho Kármico', d: 'M4 4 V24 M24 4 V24 M12 4 L6.5 14 L12 24 M16 4 L21.5 14 L16 24 M8.5 14 Q14 9 19.5 14 Q14 19 8.5 14Z', fill: 'M14 12 a2 2 0 1 0 0.01 0Z' },
  { id: 'ampulheta', nome: 'A Ampulheta', d: 'M7 4 H21 L14 14 L21 24 H7 L14 14 Z' },
  { id: 'labirinto', nome: 'O Labirinto', d: 'M5 24 V4 H23 V23.5 H8.5 V7.5 H19.5 V20 H12 V11 H16 V16.5' },
  { id: 'fome', nome: 'A Fome', d: 'M11.5 7.2 A8.3 8.3 0 1 0 16.5 7.2 M11.5 7.2 C11 5.4 9.8 4.2 8.2 3.6 M16.5 7.2 C17 5.4 18.2 4.2 19.8 3.6' },
  { id: 'fresta', nome: 'A Fresta', d: 'M11.4 2.6 V18.8 M16.6 9.2 V25.4 M6.6 10.4 C9.2 10.4 11.4 11.8 12.8 14 C14.2 16.2 16.4 17.6 21.4 17.6' },
];
/** a runa como SVG (traço na cor do texto: use `color` no CSS) */
let RID = 0;
/** a runa como SVG, no traço dourado VAZADO das runas oficiais (linha dupla: um traço largo com o miolo recortado).
 *  A cor vem de `color` no CSS; o miolo é transparente (serve em qualquer fundo). */
export function runaSvg(i: number, w = 28) {
  const r = RUNAS[((i % RUNAS.length) + RUNAS.length) % RUNAS.length], id = 'rk' + (RID++);
  return `<svg viewBox="0 0 28 28" width="${w}" height="${w}" aria-label="${r.nome}"><mask id="${id}" maskUnits="userSpaceOnUse" x="-2" y="-2" width="32" height="32"><rect x="-2" y="-2" width="32" height="32" fill="#000"/><path d="${r.d}" fill="none" stroke="#fff" stroke-width="2.6" stroke-linejoin="miter"/><path d="${r.d}" fill="none" stroke="#000" stroke-width="0.9" stroke-linejoin="miter"/></mask><rect x="-2" y="-2" width="32" height="32" fill="currentColor" mask="url(#${id})"/>${r.fill ? `<path d="${r.fill}" fill="currentColor"/>` : ''}</svg>`;
}
/** índice da runa pelo id (lagrima, olho, ampulheta, labirinto, fome, fresta) */
export const runaIdx = (id: string) => Math.max(0, RUNAS.findIndex((q) => q.id === id));
