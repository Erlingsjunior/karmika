# KARMIKA

MMORPG isométrico em pixel art onde as escolhas voltam como karma. Primeiro protótipo: a Vila de Karmika com um personagem andando.

## Rodar (Git Bash)

```bash
cd /c/Users/01934_Erling/Documents/projetos/karmika
pnpm install
pnpm dev
```

Abra http://localhost:5173

## Controles

- WASD ou setas: andar (nas direções da tela)
- Clique no chão: o personagem anda até lá (busca de caminho A*)
- Roda do mouse: zoom
- 1, 2, 3: troca a raça (humano, elfo, anão) para testar a velocidade
- K: ganha karma de teste; com a barra cheia o personagem brilha

## Estrutura

- `shared/src/index.ts`: código compartilhado cliente/servidor (matemática isométrica, raças, A*)
- `client/src/world.ts`: a cidade (mapa, casas, templo, fonte, árvores, rio com ponte)
- `client/src/draw.ts`: desenho provisório com formas; depois troca por sprites de pixel art
- `client/src/main.ts`: loop do jogo, câmera, entrada, colisão

## Próximos passos

1. Sprites de pixel art (tile 64x32) no lugar das formas
2. Servidor Colyseus (autoritativo) e vários jogadores na mesma vila
3. Combate com ataques telegrafados no chão
4. Karma real: ações geram karma, morte vira reencarnação
