# KARMIKA

MMORPG isométrico (Three.js + TypeScript) onde cada escolha volta como karma. Você nasce humano, anão ou elfo, segue um caminho (guerreiro, paladino, vampiro, tecnocrata, lobisomem, mago, bruxo, caçador de demônios), morre, reencarna e carrega as marcas da vida passada.

## Requisitos

- Node.js 20 ou mais novo
- pnpm (`npm i -g pnpm`)

## Rodar na máquina (desenvolvimento)

```bash
git clone https://github.com/Erlingsjunior/karmika.git
cd karmika
pnpm install
pnpm dev            # abre o jogo em http://localhost:5173
```

## Montar um servidor (máquina forte)

```bash
pnpm install
pnpm build          # gera client/dist
pnpm sala           # sala multijogador na porta 7777 (WebSocket + entrega o jogo)
```

- Porta padrão: **7777** (jogo e sala). Para outra porta: `node desktop/src/server.cjs 8080`.
- Os jogadores entram por `http://IP-DA-MAQUINA:7777` ou pelo botão "Jogar junto" (F4) dentro do jogo, com o convite que aparece no terminal.
- Na rede local as salas se anunciam sozinhas (UDP 7778).
- Pela internet, libere a porta 7777 (TCP) no roteador e no firewall do Windows.
- O servidor não guarda o mundo: cada jogador gera o mesmo mundo e traz o próprio save. Ele confere o convite, repassa o que cada um faz e entrega a versão nova do jogo para quem estiver desatualizado.

## App de desktop (Electron)

```bash
pnpm desktop:dev    # abre o jogo como aplicativo
pnpm desktop:dist   # gera o instalador do Windows em desktop/release
```

## Estrutura

- `client/`: o jogo (Vite + Three.js). Entrada em `client/src/main.ts`.
- `shared/`: código comum (matemática isométrica, raças, A*).
- `desktop/`: app Electron e servidor de sala (`desktop/src/server.cjs`).
- `docs/`: bíblia do mundo, sagas, eventos e regras de design.
