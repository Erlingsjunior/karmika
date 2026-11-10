# Landing page — karmikaonline.com

Site estático (HTML + CSS + JS, sem build) publicado pela Vercel no projeto **karmika-online** (Root Directory = `landing`).
Fica fora do jogo: o `pnpm-workspace.yaml` não inclui esta pasta, então `pnpm build` e `pnpm desktop:dist` não a tocam.

- `index.html`, `style.css`, `main.js` — a página (rolagem com GSAP ScrollTrigger + Lenis, em `vendor/`).
- `img/` — capturas do jogo, retratos das classes (renderizados dos modelos do Herik) e arte do artbook.
- `api/beta.js` — recebe a inscrição de beta tester e grava um JSON por pessoa no Vercel Blob (loja privada `karmika-beta`).
  Para ver os inscritos: painel da Vercel → Storage → karmika-beta → pasta `beta/`.

Testar local: `cd landing && python -m http.server 8080` (o formulário só grava na Vercel).
