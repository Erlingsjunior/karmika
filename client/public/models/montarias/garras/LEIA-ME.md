# Montarias com garras

Lobo da Lua e Tigre-Dentes-de-Sabre, um `.glb` por montaria, os dois no mesmo esqueleto. A lista com os tris está em `personagens.json`.

| Arquivo | Montaria |
|---|---|
| `tigre_sabre.glb` | Tigre-Dentes-de-Sabre |
| `lobo_lua.glb` | Lobo da Lua |

## O que cada arquivo traz

- Malha, esqueleto e material em um arquivo só. A textura vem embutida (JPEG 2048).
- Só cor: metálico 0, rugosidade 0,86, sem normal map e sem transparência.
- Até 4 influências por vértice.
- Sem animação, sem câmera e sem luz. A montaria vem na pose de repouso.

## Escala e orientação

- 1 unidade = 1 metro, com as patas em Y = 0, garupa a 1,30 m e cerca de 1,39 m no ponto mais alto.
- Y para cima, olhando para +Z, como os personagens e os cavalos.

## Esqueleto

São 32 ossos, iguais e na mesma ordem nos dois, então uma animação feita para um serve para o outro.

Os nomes são os mesmos dos cavalos, mais `Tail3`, mas as posições são diferentes: uma animação de cavalo não serve aqui. `HandMiddle1` e `ToeBase` são os dedos das patas.

Animações humanas do Mixamo também não servem: a pose e o movimento são de bípede.

O `GLTFLoader` tira os dois-pontos dos nomes: `mixamorig:Hips` vira `mixamorigHips`.

## Exemplo

```js
const { scene } = await new GLTFLoader().loadAsync('montaria/garras/tigre_sabre.glb');
const mixer = new THREE.AnimationMixer(scene);
```

Para vários do mesmo modelo na tela, clone com `SkeletonUtils.clone(scene)`.
