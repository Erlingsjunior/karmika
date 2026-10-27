import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
/* a versão que aparece no rodapé do jogo: data do build + commit (para saber na hora se o build está atualizado) */
const gitHash = (() => { try { return execSync('git rev-parse --short HEAD').toString().trim(); } catch { return 'sem-git'; } })();
const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');

export default defineConfig({
  define: { __BUILD_ID__: JSON.stringify(`${stamp} · ${gitHash}`) },
  resolve: {
    alias: { '@karmika/shared': fileURLToPath(new URL('../shared/src/index.ts', import.meta.url)) },
  },
  server: { port: 5173, open: false },
  // o jogo é um app instalado (não um site): um pacote de ~1 MB é normal, então o aviso de "chunk grande" só faz barulho
  build: { target: 'es2022', /* es2022: o main.ts espera o mundo do cache com await no topo */ chunkSizeWarningLimit: 2500, rollupOptions: { input: { main: fileURLToPath(new URL("./index.html", import.meta.url)), atelier: fileURLToPath(new URL("./atelier.html", import.meta.url)) } } },
});
