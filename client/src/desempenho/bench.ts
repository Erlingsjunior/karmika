/* /bench: AS TRÊS CENAS FIXAS (17/11, estudo de desempenho, regra 1: "nada grande entra sem medição antes e depois, na mesma cena e na mesma máquina").
   1. Praça: parado na praça de Karmika.
   2. Luta: dez inimigos em volta, modo deus, todas as magias da barra em rodízio. Depois os inimigos somem e a placa é contada de novo: o que não
      voltou ao valor de antes da luta ficou sem devolver (regra 15).
   3. Corrida: uma linha reta de Karmika para Lundr na velocidade de corrida, para medir o mundo entrando e saindo.
   Cada cena assenta 4 s e mede 30 s (/bench curto: 8 s). No fim o herói volta para onde estava e o resultado sai no registro, no console e num arquivo. */
import type * as THREE from 'three';
import { zeraQuadros, percentis, type Percentis } from './quadros';
import { conta, sobra, type Contagem } from './contagem';

export interface BenchCtx {
  renderer: THREE.WebGLRenderer; scene: THREE.Scene;
  /** posição do herói em casas do mapa */ estado: { fx: number; fy: number };
  /** casas por metro: 1 casa = casaM metros */ casaM: number;
  lugar(nome: string): { x: number; y: number } | null;
  livre(fx: number, fy: number): boolean;
  dentro(): boolean;
  /** põe um inimigo em metros do mundo, com a marca dada */ bicho(tipo: string, x: number, z: number, marca: string): void;
  tiraBichos(marca: string): void;
  /** solta a magia da casa da barra no ponto dado; devolve se saiu */ magia(casa: string, alvo: { x: number; z: number; yaw: number }): boolean;
  /** liga ou desliga o modo deus; devolve como estava */ deus(on: boolean): boolean;
  /** milissegundos de processador por parte do quadro, média do último segundo */ partes(): Record<string, number>;
  /** milissegundos de placa por quadro no último segundo, ou -1 se a placa não informa */ placa(): number;
  log(t: string, cor?: string): void;
  build: string; desenho: string;
}

interface Cena { nome: string; percentis: Percentis | null; partes: Record<string, number>; placaMs: number; inicio: Contagem; fim: Contagem; /** só na luta: o que sobrou depois de os inimigos saírem */ sobra?: ReturnType<typeof sobra>; /** magias que saíram, de quantas tentativas (uma a cada 0,55 s, em rodízio pelas dez casas da barra) */ magias?: number; tentativas?: number }
export interface Resultado { build: string; desenho: string; quando: string; tela: string; segundos: number; cenas: Cena[]; maquina?: unknown }

const MARCA = 'bench', CASAS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'], BICHOS = ['wolf', 'skeleton', 'bandit', 'wolf', 'skeleton', 'bandit', 'wolf', 'skeleton', 'bandit', 'wolf'];
type Fase = 'assenta' | 'mede' | 'esfria';

export function createBench(K: BenchCtx) {
  let ativo = false, cena = 0, fase: Fase = 'assenta', t = 0, relogio = 0, seg = 30, casa = 0, tMagia = 0, magias = 0, tentativas = 0, tAmostra = 0, amostras = 0, placaSoma = 0, placaN = 0;
  let volta = { fx: 0, fy: 0 }, deusAntes = false, antes: Contagem | null = null, dir = { x: 0, y: 0 }, centro = { x: 0, z: 0 };
  let somaPartes: Record<string, number> = {}; const R: Resultado = { build: '', desenho: '', quando: '', tela: '', segundos: 0, cenas: [] };
  const NOMES = ['praça de Karmika, parado', 'luta com dez inimigos e todas as magias', 'corrida de Karmika para Lundr'];

  const chaoLivre = (fx: number, fy: number) => { for (let r = 0; r < 30; r++) for (let a = 0; a < 8; a++) { const x = fx + Math.cos(a * 0.785) * r, y = fy + Math.sin(a * 0.785) * r; if (K.livre(x, y)) return { x, y }; } return { x: fx, y: fy }; };
  function prepara() {
    const k = K.lugar('karmika'); t = 0; relogio = performance.now(); fase = 'assenta'; somaPartes = {}; amostras = 0; placaSoma = 0; placaN = 0; magias = 0; tentativas = 0; tAmostra = 0;
    if (cena === 0 && k) { K.estado.fx = k.x + 0.5; K.estado.fy = k.y + 2; }
    if (cena === 1 && k) { const p = chaoLivre(k.x + 0.5, k.y + 46); K.estado.fx = p.x; K.estado.fy = p.y; centro = { x: p.x * K.casaM, z: p.y * K.casaM }; }
    if (cena === 2 && k) { const l = K.lugar('lundr') ?? { x: k.x + 100, y: k.y }; const dx = l.x - k.x, dy = l.y - k.y, m = Math.hypot(dx, dy) || 1; dir = { x: dx / m, y: dy / m }; K.estado.fx = k.x + 0.5; K.estado.fy = k.y + 2; }
    K.log(`⏱ /bench, cena ${cena + 1} de 3: ${NOMES[cena]}.`, '#9ad7ff');
  }
  function comecaMedir() {
    fase = 'mede'; t = 0; antes = conta(K.renderer, K.scene); zeraQuadros();
    if (cena === 1) for (let i = 0; i < BICHOS.length; i++) { const a = i / BICHOS.length * 6.283; K.bicho(BICHOS[i], centro.x + Math.cos(a) * 6, centro.z + Math.sin(a) * 6, MARCA); }
  }
  function fecha(sob?: ReturnType<typeof sobra>) {
    const partes: Record<string, number> = {}; for (const k in somaPartes) partes[k] = +(somaPartes[k] / Math.max(1, amostras)).toFixed(2);
    R.cenas.push({ nome: NOMES[cena], percentis: percentis(), partes, placaMs: placaN ? +(placaSoma / placaN).toFixed(2) : -1, inicio: antes!, fim: conta(K.renderer, K.scene), ...(sob ? { sobra: sob } : {}), ...(cena === 1 ? { magias, tentativas } : {}) });
    cena++; if (cena < 3) prepara(); else termina();
  }
  function termina() {
    ativo = false; K.tiraBichos(MARCA); K.deus(deusAntes); K.estado.fx = volta.fx; K.estado.fy = volta.fy;
    const txt = texto(R); for (const l of txt.split('\n')) K.log(l, '#9ad7ff'); console.log(txt);
    (window as unknown as { __bench?: Resultado }).__bench = R;
    void (async () => { try { const d = (window as unknown as { karmikaDesktop?: { gpu?(): Promise<unknown> } }).karmikaDesktop; if (d?.gpu) R.maquina = await d.gpu(); } catch { /* */ }
      try { const a = document.createElement('a'), b = new Blob([JSON.stringify(R, null, 1)], { type: 'application/json' }); a.href = URL.createObjectURL(b); a.download = `karmika-bench-${R.quando.slice(0, 16).replace(/[:T]/g, '-')}.json`; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000); } catch { /* */ } })();
  }

  return {
    get ativo() { return ativo; },
    /** /bench · /bench curto · /bench parar */
    comando(a: string[]): string {
      const q = (a[0] ?? '').toLowerCase();
      if (q === 'parar') { if (!ativo) return '⏱ O /bench não está rodando.'; ativo = false; K.tiraBichos(MARCA); K.deus(deusAntes); K.estado.fx = volta.fx; K.estado.fy = volta.fy; return '⏱ /bench interrompido. Você voltou para onde estava.'; }
      if (ativo) return '⏱ O /bench já está rodando. /bench parar interrompe.';
      if (K.dentro()) return '⏱ Saia do interior antes de rodar o /bench.';
      if (!K.lugar('karmika')) return '⏱ Não achei a vila de Karmika neste mundo.';
      seg = q === 'curto' ? 8 : Math.max(5, Math.min(120, Number(q) || 30));
      volta = { fx: K.estado.fx, fy: K.estado.fy }; deusAntes = K.deus(true); R.build = K.build; R.desenho = K.desenho; R.quando = new Date().toISOString(); R.tela = `${K.renderer.domElement.width}x${K.renderer.domElement.height}`; R.segundos = seg; R.cenas = [];
      ativo = true; cena = 0; prepara();
      return `⏱ /bench começou: três cenas de ${seg} s. Não mexa no jogo até terminar (cerca de ${Math.round(3 * (seg + 4) + 6)} s). /bench parar interrompe.`;
    },
    /** uma vez por quadro; parado, não faz nada. O tempo das cenas é o do relógio de parede (o passo do jogo tem teto de 50 ms: numa máquina
        lenta, contar pelo passo esticaria a cena) */
    tick(dt: number) {
      if (!ativo) return; { const agora = performance.now(); dt = Math.min(1, (agora - relogio) / 1000); relogio = agora; } t += dt;
      if (fase === 'assenta') { if (t >= 4) comecaMedir(); return; }
      if (fase === 'esfria') { if (t >= 6) fecha(sobra(antes!, conta(K.renderer, K.scene))); return; }
      tAmostra += dt; if (tAmostra >= 1) { tAmostra = 0; const p = K.partes(); for (const k in p) somaPartes[k] = (somaPartes[k] ?? 0) + p[k]; amostras++; const g = K.placa(); if (g >= 0) { placaSoma += g; placaN++; } }
      if (cena === 1) { tMagia -= dt; if (tMagia <= 0) { tMagia = 0.55; const a = casa / CASAS.length * 6.283 + t, x = centro.x + Math.cos(a) * 4, z = centro.z + Math.sin(a) * 4;
          tentativas++; if (K.magia(CASAS[casa], { x, z, yaw: Math.atan2(x - K.estado.fx * K.casaM, z - K.estado.fy * K.casaM) })) magias++; casa = (casa + 1) % CASAS.length; } }
      if (cena === 2) { const v = 9 / K.casaM * dt; K.estado.fx += dir.x * v; K.estado.fy += dir.y * v; }
      if (t >= seg) { if (cena === 1) { K.tiraBichos(MARCA); fase = 'esfria'; t = 0; } else fecha(); }
    },
  };
}

/** o resultado em frases curtas, para o registro e para colar numa conversa */
export function texto(R: Resultado): string {
  const f = (v: number) => v.toFixed(1), L = [`⏱ /bench · build ${R.build} · ${R.desenho} · tela ${R.tela} · ${R.segundos} s por cena`];
  for (const c of R.cenas) { const p = c.percentis, top = Object.entries(c.partes).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => `${k} ${f(v)}`).join(', ');
    L.push(`▸ ${c.nome}: ` + (p ? `${p.fps.toFixed(0)} por segundo · média ${f(p.media)} ms · P95 ${f(p.p95)} · P99 ${f(p.p99)} · pior ${f(p.pior)} · ${p.trancos} trancos` : 'sem quadros bastantes'));
    L.push(`   processador: ${top || '—'} · placa: ${c.placaMs >= 0 ? f(c.placaMs) + ' ms' : 'não informa'} · ${c.fim.desenhos} desenhos · ${Math.round(c.fim.triangulos / 1000)} mil triângulos · ${c.fim.materiais} materiais · ${c.fim.visiveis} objetos à vista`);
    if (c.sobra) L.push(`   depois da luta (${c.magias ?? 0} magias de ${c.tentativas ?? 0} tentativas): sobraram ${c.sobra.geometrias} geometrias, ${c.sobra.texturas} texturas, ${c.sobra.objetos} objetos e ${c.sobra.programas} programas a mais do que antes`); }
  return L.join('\n');
}
