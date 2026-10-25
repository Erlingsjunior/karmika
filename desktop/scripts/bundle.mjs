// junta o processo principal do app (e o servidor) num arquivo só: o instalador não precisa levar node_modules
import { build } from 'esbuild';
import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
/* bibliotecas que leem o próprio package.json em tempo de execução ("../../package.json"): no app instalado esse arquivo
   não existe ao lado do pacote. Aqui o conteúdo é colado direto no código na hora de montar. */
const inlinePkg = { name: 'inline-package-json', setup(b) {
  b.onLoad({ filter: /node_modules[\\/].*\.js$/ }, (args) => {
    const src = readFileSync(args.path, 'utf8'); if (!/\(\s*['"](\.\.\/)+package\.json['"]\s*\)/.test(src)) return undefined;
    const out = src.replace(/(\w+)\(\s*['"]((?:\.\.\/)+package\.json)['"]\s*\)/g, (m, fn, rel) => { try { const j = JSON.parse(readFileSync(path.resolve(path.dirname(args.path), rel), 'utf8')); return `(${JSON.stringify({ name: j.name, version: j.version })})`; } catch { return m; } });
    return { contents: out, loader: 'js', resolveDir: path.dirname(args.path) };
  });
} };
mkdirSync('out', { recursive: true });
await build({ entryPoints: ['src/main.mjs'], outfile: 'out/main.cjs', bundle: true, platform: 'node', format: 'cjs', target: 'node22', external: ['electron', 'bufferutil', 'utf-8-validate'], logLevel: 'warning', plugins: [inlinePkg],
  // algumas bibliotecas usam import.meta.url (ESM); no pacote CJS ele vira o caminho deste arquivo
  banner: { js: "const __importMetaUrl = require('node:url').pathToFileURL(__filename).href;" }, define: { 'import.meta.url': '__importMetaUrl' } });
copyFileSync('src/preload.cjs', 'out/preload.cjs');
console.log('app montado em desktop/out');
