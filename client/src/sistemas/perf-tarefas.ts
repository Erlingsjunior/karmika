/* TAREFAS PERIÓDICAS (11/11, Erling: "o jogo trava a cada 5 ou 8 segundos" e o /travadas não acusava nada). O que roda por relógio (salvar a mochila,
   varrer a cena no Moderno, conferir a pele…) acontece FORA da conta por parte do quadro. Aqui cada uma é cronometrada: o /travadas mostra a mais cara,
   e cada travada diz qual tarefa caiu naquele quadro. */
const T: Record<string, { n: number; sum: number; max: number }> = {};
let recent: string[] = [];
/** embrulha a função de um setInterval e mede quanto ela leva */
export function tarefa<A extends unknown[]>(name: string, fn: (...a: A) => void) {
  return (...a: A) => { const t = performance.now(); try { fn(...a); } finally { const d = performance.now() - t, q = (T[name] ??= { n: 0, sum: 0, max: 0 }); q.n++; q.sum += d; if (d > q.max) q.max = d; if (d >= 3) recent.push(`${name} ${d.toFixed(0)}`); } };
}
/** as tarefas pesadas (3 ms ou mais) que rodaram desde o quadro anterior */
export function tarefasDoQuadro() { const r = recent.join(', '); recent = []; return r; }
export function tarefasReport() {
  const e = Object.entries(T).sort((a, b) => b[1].max - a[1].max).filter(([, v]) => v.max >= 1);
  return e.length ? e.map(([k, v]) => `${k}: pior ${v.max.toFixed(0)} ms, média ${(v.sum / v.n).toFixed(1)} ms`).join(' · ') : 'todas abaixo de 1 ms';
}
