/* TRAVA DE DESEMPENHO (17/11). Roda antes do build (npm run build) e sozinha (npm run desempenho).
   É uma CATRACA: conta, no código de verdade, o que as regras de claude/estudo-sobre-desempenho-karmika.md proíbem, e compara com a contagem
   guardada em scripts/desempenho-base.json. Nenhuma contagem pode SUBIR. Quando uma desce (o código melhorou), rode com --grava para a base
   acompanhar, e ela não volta mais.
   O que ela NÃO faz: medir quadros por segundo. Isso é o /bench, dentro do jogo, na máquina de quem joga. */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url)), raiz = join(here, '..'), src = join(raiz, 'src'), BASE = join(here, 'desempenho-base.json');
const le = (p) => { try { return readFileSync(p, 'utf8'); } catch { return ''; } };
const todos = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? todos(p) : /\.ts$/.test(f) ? [p] : []; });
const conta = (txt, re) => (txt.match(re) ?? []).length;
const COMBATE = ['gameplay.ts', 'enemies.ts', 'sistemas/vfx.ts', 'eventos.ts'].map((f) => le(join(src, f))).join('\n');
const TUDO = todos(src).map((p) => [relative(src, p), le(p)]);
const laco = (() => { const g = le(join(src, 'gameplay.ts')), i = g.indexOf('    update(dt: number'); return i < 0 ? '' : g.slice(i); })();

/** [regra do estudo, o que conta, contagem] */
const M = {
  'regra 4 · objetos criados dentro do laço do combate (gameplay.ts, update)': conta(laco, /new THREE\.(Vector[234]|Matrix4|Quaternion|Color|Box3|Sphere)\(/g),
  'regra 4 · .clone() dentro do laço do combate (gameplay.ts, update)': conta(laco, /\.clone\(\)/g),
  'regra 7 · geometrias criadas nos arquivos de combate': conta(COMBATE, /new THREE\.\w*Geometry\(/g),
  'regra 7 · materiais criados nos arquivos de combate': conta(COMBATE, /new THREE\.\w*Material\(/g),
  'regra 8 · material clonado nos arquivos de combate': conta(COMBATE, /(\w*Mat\w*|material)\.clone\(\)/g),
  'regra 9 · luzes pontuais criadas no jogo inteiro': TUDO.reduce((a, [, t]) => a + conta(t, /new THREE\.(PointLight|SpotLight)\(/g), 0),
  'regra 3 · tarefas por relógio fora do medidor (setInterval sem tarefa)': TUDO.reduce((a, [, t]) => a + conta(t, /setInterval\((?!\s*tarefa\()/g), 0),
  'regra 12 · malhas soltas na fauna de cenário': conta(le(join(src, 'fauna/index.ts')) + le(join(src, 'fauna/modelos.ts')), /new THREE\.Mesh\(/g),
  'regra 16 · desfoques de fundo na interface (index.html)': conta(le(join(raiz, 'index.html')), /backdrop-filter:\s*blur/g),
  'regra 18 · opções do Chromium ligadas no aplicativo': conta(le(join(raiz, '..', 'desktop', 'src', 'main.mjs')), /appendSwitch\(/g),
  'regra 19 · bibliotecas de que o jogo depende': Object.keys(JSON.parse(le(join(raiz, 'package.json')) || '{}').dependencies ?? {}).length,
};

if (process.argv.includes('--grava') || !existsSync(BASE)) { writeFileSync(BASE, JSON.stringify(M, null, 2) + '\n'); console.log(`✓ desempenho: base gravada com ${Object.keys(M).length} contagens`); process.exit(0); }
const B = JSON.parse(le(BASE)), pior = [], melhor = [];
for (const [k, v] of Object.entries(M)) { const b = B[k]; if (b === undefined) { pior.push(`${k}: contagem nova (${v}) que a base não conhece; rode com --grava`); continue; } if (v > b) pior.push(`${k}: era ${b}, agora ${v} (+${v - b})`); else if (v < b) melhor.push(`${k}: ${b} → ${v}`); }
if (pior.length) { console.error(`\n✗ DESEMPENHO: ${pior.length} contagem(ns) pioraram (regras em claude/estudo-sobre-desempenho-karmika.md):\n` + pior.map((f) => '  · ' + f).join('\n') + '\n\nSe a piora foi decidida com o Erling, rode: node scripts/desempenho.mjs --grava\n'); process.exit(1); }
console.log(`✓ desempenho: ${Object.keys(M).length} contagens conferidas, nenhuma piorou` + (melhor.length ? ` · ${melhor.length} melhoraram (rode com --grava para travar): ${melhor.join(' · ')}` : ''));
