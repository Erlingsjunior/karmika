import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
/* a versão que aparece no rodapé do jogo: data do build + commit (para saber na hora se o build está atualizado) */
const gitHash = (() => { try { return execSync('git rev-parse --short HEAD').toString().trim(); } catch { return 'sem-git'; } })();
const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
/* assinatura do gerador do mundo (world.ts + campanha.ts) calculada no build: antes o texto dos dois arquivos (~310 KB) ia inteiro para o pacote só para ser hasheado no navegador */
const worldSig = (() => { const src = ['./src/world.ts', './src/campanha.ts'].map((f) => readFileSync(fileURLToPath(new URL(f, import.meta.url)), 'utf8')).join(''); let h = 2166136261; for (let i = 0; i < src.length; i++) { h ^= src.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36) + ':' + src.length; })();

export default defineConfig({
  define: { __BUILD_ID__: JSON.stringify(`${stamp} · ${gitHash}`), __WORLD_SIG__: JSON.stringify(worldSig) },
  resolve: {
    /* 03/11 (WebGPU com resguardo de WebGL): o three.js vem das FONTES (three/src), numa cópia só — assim o renderizador WebGPU
       (three/webgpu, carregado só quando é usado) e o WebGL dividem as mesmas classes (Mesh, Material, Texture…) */
    alias: [
      { find: '@karmika/shared', replacement: fileURLToPath(new URL('../shared/src/index.ts', import.meta.url)) },
      { find: /^three$/, replacement: fileURLToPath(new URL('./src/gpu/three-shim.js', import.meta.url)) },
      { find: /^three\/webgpu$/, replacement: 'three/src/Three.WebGPU.js' },
      { find: /^three\/tsl$/, replacement: 'three/src/Three.WebGPU.js' },
    ],
  },
  server: { port: 5173, open: false },
  // o jogo é um app instalado (não um site): um pacote de ~1 MB é normal, então o aviso de "chunk grande" só faz barulho
  build: { target: 'es2022', /* es2022: o main.ts espera o mundo do cache com await no topo */ chunkSizeWarningLimit: 2500, rollupOptions: { input: { main: fileURLToPath(new URL("./index.html", import.meta.url)), atelier: fileURLToPath(new URL("./atelier.html", import.meta.url)) } } },
});
