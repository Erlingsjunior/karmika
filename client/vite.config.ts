import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: { '@karmika/shared': fileURLToPath(new URL('../shared/src/index.ts', import.meta.url)) },
  },
  server: { port: 5173, open: false },
  // o jogo é um app instalado (não um site): um pacote de ~1 MB é normal, então o aviso de "chunk grande" só faz barulho
  build: { target: 'es2022', /* es2022: o main.ts espera o mundo do cache com await no topo */ chunkSizeWarningLimit: 2500, rollupOptions: { input: { main: fileURLToPath(new URL("./index.html", import.meta.url)), atelier: fileURLToPath(new URL("./atelier.html", import.meta.url)) } } },
});
