# Montarias de casco

Cervo Élfico de Lithendel, Carneiro da Montanha de Brasaforja e Javali de Guerra de Ulfheim, um `.glb` por montaria. A lista com os tris está em `personagens.json`.

| Arquivo | Montaria | Ponto mais alto |
|---|---|---:|
| `cervo_lithendel.glb` | Cervo Élfico de Lithendel | 2,39 m (galhada) |
| `carneiro_brasaforja.glb` | Carneiro da Montanha de Brasaforja | 1,75 m (chifres) |
| `javali_ulfheim.glb` | Javali de Guerra de Ulfheim | 1,69 m (crina) |

## O que cada arquivo traz

- Malha, esqueleto e material em um arquivo só. A textura vem embutida (JPEG 2048).
- Só cor: metálico 0, rugosidade 0,86, sem normal map e sem transparência.
- Até 4 influências por vértice.
- Sem animação, sem câmera e sem luz. A montaria vem na pose de repouso.

## Escala e orientação

- 1 unidade = 1 metro, com as patas em Y = 0 e a garupa a cerca de 1,30 m, como o lobo e o tigre.
- Y para cima, olhando para +Z, como os personagens e as outras montarias.

## Esqueleto

Cada montaria tem o próprio esqueleto, porque as proporções são muito diferentes: **uma animação feita para uma não serve para as outras**.

Os três têm os mesmos 32 ossos, com os mesmos nomes de `montaria/garras`. `HandMiddle1` e `ToeBase` são os cascos. O código que procura ossos por nome pode ser o mesmo, mas as posições e os movimentos não se transferem.

Galhada, chifres e presas seguem só o osso `Head`, então não dobram.

Animações humanas do Mixamo também não servem: a pose e o movimento são de bípede.

O `GLTFLoader` tira os dois-pontos dos nomes: `mixamorig:Hips` vira `mixamorigHips`.

## Exemplo

```js
const { scene } = await new GLTFLoader().loadAsync('montaria/casco/cervo_lithendel.glb');
const mixer = new THREE.AnimationMixer(scene);
```

Para vários do mesmo modelo na tela, clone com `SkeletonUtils.clone(scene)`.
