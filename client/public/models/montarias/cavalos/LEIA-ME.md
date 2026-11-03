# Cavalos Karmika

5 cavalos, um `.glb` por cavalo, todos no mesmo esqueleto. A lista com os tris está em `personagens.json`.

| Arquivo | Cavalo |
|---|---|
| `cavalo_orm.glb` | Cavalo de Orm |
| `cavalo_jarlsheim.glb` | Cavalo de Guerra de Jarlsheim |
| `cavalo_porto_caldeira.glb` | Cavalo de Tiro de Porto Caldeira |
| `corcel_askavik.glb` | Corcel Erudito de Askavik |
| `pesadelo_conde.glb` | Pesadelo do Conde |

## O que cada arquivo traz

- Malha, esqueleto e material em um arquivo só. A textura vem embutida (JPEG 2048).
- Só cor: metálico 0, rugosidade 0,86, sem normal map e sem transparência.
- Até 4 influências por vértice.
- Sem animação, sem câmera e sem luz. O cavalo vem na pose de repouso.

## Escala e orientação

- 1 unidade = 1 metro, com os cascos em Y = 0 e cerca de 2,00 m até as orelhas.
- Y para cima, olhando para +Z, como os personagens.
- A largura da caixa muda de cavalo para cavalo por causa de bolsas e arreios de um lado só. O corpo é simétrico e centrado em X = 0.

## Esqueleto

São 31 ossos, iguais e na mesma ordem nos cinco, então uma animação feita para um serve para todos.

- Nomes do Mixamo (24): `Hips`, `Spine`, `Spine1`, `Spine2`, `Neck`, `Head`; patas da frente `Shoulder`, `Arm`, `ForeArm`, `Hand`, `HandMiddle1` (casco); patas de trás `UpLeg`, `Leg`, `Foot`, `ToeBase`.
- Extras (7): `Neck1`, `Neck2`, `Tail`, `Tail1`, `Tail2`, `LeftEar`, `RightEar`.

O rig usa os nomes do Mixamo, mas animações humanas do Mixamo não servem no cavalo: a pose e o movimento são de bípede. O cavalo precisa de animações próprias.

O `GLTFLoader` tira os dois-pontos dos nomes: `mixamorig:Hips` vira `mixamorigHips`.

## Exemplo

```js
const { scene } = await new GLTFLoader().loadAsync('montaria/cavalos/cavalo_orm.glb');
const mixer = new THREE.AnimationMixer(scene);
```

Para vários do mesmo modelo na tela, clone com `SkeletonUtils.clone(scene)`.
