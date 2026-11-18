/* TEMPO DE QUADRO E PERCENTIS (17/11, estudo de desempenho, regra 2: "conta o pior, não a média").
   Guarda o intervalo real entre um quadro e o seguinte (o que o jogador sente: processador, placa e espera juntos) numa roda de 8.192 quadros.
   Marcar um quadro não cria objeto nenhum; a ordenação só acontece quando alguém pede o relatório. */
const N = 8192, roda = new Float32Array(N), ordem = new Float32Array(N);
let n = 0, i = 0, anterior = 0;

export interface Percentis { quadros: number; media: number; p50: number; p95: number; p99: number; pior: number; fps: number; /** quadros acima de 16,7 ms (abaixo de 60 por segundo) */ lentos: number; /** quadros acima de 50 ms (o tranco que se vê) */ trancos: number }

/** chamado uma vez por quadro desenhado, com o relógio do quadro */
export function marcaQuadro(agora: number) {
  if (anterior) { const d = agora - anterior; if (d < 2000) { roda[i] = d; i = (i + 1) % N; if (n < N) n++; } /* janela escondida ou jogo parado não é quadro lento */ }
  anterior = agora;
}
export function zeraQuadros() { n = 0; i = 0; }

export function percentis(): Percentis | null {
  if (n < 30) return null;
  ordem.set(roda.subarray(0, n)); const o = ordem.subarray(0, n); o.sort();
  let soma = 0, lentos = 0, trancos = 0; for (let k = 0; k < n; k++) { const v = o[k]; soma += v; if (v > 16.7) lentos++; if (v > 50) trancos++; }
  const em = (q: number) => o[Math.min(n - 1, Math.floor(q * n))], media = soma / n;
  return { quadros: n, media, p50: em(0.5), p95: em(0.95), p99: em(0.99), pior: o[n - 1], fps: 1000 / media, lentos, trancos };
}

export function textoPercentis(p: Percentis | null = percentis()): string {
  if (!p) return '📊 Tempo de quadro: ainda sem quadros bastantes para medir.';
  const f = (v: number) => v.toFixed(1);
  return `📊 Tempo de quadro (${p.quadros} quadros): média ${f(p.media)} ms (${p.fps.toFixed(0)} por segundo) · metade abaixo de ${f(p.p50)} · P95 ${f(p.p95)} · P99 ${f(p.p99)} · pior ${f(p.pior)} ms · ${p.lentos} acima de 16,7 ms · ${p.trancos} trancos acima de 50 ms`;
}
