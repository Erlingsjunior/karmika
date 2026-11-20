/* As pessoas que o Capítulo IV põe no mundo: a mão de cada casa (campanha.ts as coloca de pé). Só aparecem enquanto a missão delas está no diário. */
import { EV, RU, MO } from './comum';

export const CAP4_NPCS = [
  { vila: 'Austrvik', name: EV, role: 'Cônego de Austrvik · cobriu o telhado do orfanato', dx: 3, dy: -2.5, tint: 0x6a5a7a, onlyQ: 'q4pa3,q4pa9', lines: ['O rico paga, o órfão dorme seco. Onde está o mal?', 'Está no missal. Última página.', 'Eu fiz a conta três vezes.'] },
  { vila: 'Sudrholt', name: RU, role: 'Intendente do Bastião de Prata', dx: -1.5, dy: -22.5, tint: 0x5a5a4a, onlyQ: 'q4ca3,q4ca9', lines: ['Quarenta órfãos, oitenta botas. Eu sei o tamanho de cada pé.', 'A conta fecha. Eu queria que não fechasse.', 'Ninho morto não paga vigília.'] },
  { vila: 'Lumenhal', name: MO, role: 'Mestre-Arcano do Pináculo · cátedra de caligrafia', dx: 12.5, dy: 74, tint: 0x7a7ab0, onlyQ: 'q4ma3,q4ma9', lines: ['Segure a pena mais embaixo. Isso.', 'Toda cátedra recebe uma lista de erratas.', 'Vocês todos traçam igual: eu que ensinei.'] },
];
