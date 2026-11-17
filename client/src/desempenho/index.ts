/* DESEMPENHO (17/11): a medição que as regras do estudo de desempenho pedem. Tempo de quadro com percentis, contagem da cena e da placa, e o /bench. */
export { marcaQuadro, zeraQuadros, percentis, textoPercentis, type Percentis } from './quadros';
export { conta, sobra, type Contagem } from './contagem';
export { createBench, texto as textoBench, type BenchCtx, type Resultado } from './bench';
