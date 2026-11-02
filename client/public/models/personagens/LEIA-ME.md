# Personagens Karmika: rig Humanos

22 personagens, um `.glb` por personagem. A lista com classe, sexo, nível e tris está em `personagens.json`.

## O que cada arquivo traz

- Malha, esqueleto e material em um arquivo só. A textura vem embutida (JPEG 2048), não há caminho externo para carregar.
- Só cor: metálico 0, rugosidade 0,86, sem normal map e sem transparência. `doubleSided` ligado por causa de capas e panos.
- Até 4 influências por vértice.
- Sem animação, sem câmera e sem luz. O personagem vem na pose de repouso do rig.

## Escala e orientação

- 1 unidade = 1 metro. Altura de 1,80, com os pés em Y = 0. Y para cima, olhando para +Z.
- `guerreiro_h_lvl03`: 1,80 até o topo do elmo; as asas chegam a 1,91. Use a altura do osso, não a caixa da malha.
- `guerreiro_h_lvl02` e `guerreiro_m_lvl02` passam do chão em cerca de 1 cm.

## Animação

Todos usam o mesmo esqueleto Mixamo de 65 ossos, com nomes e ordem idênticos. Uma animação feita para um serve para todos.

O `GLTFLoader` tira os dois-pontos dos nomes: `mixamorig:Hips` vira `mixamorigHips`. Se a animação vier de outro arquivo, confira se as tracks usam o mesmo nome.

## Exemplo

```js
const { scene } = await new GLTFLoader().loadAsync('personagens/paladino_m.glb');
const mixer = new THREE.AnimationMixer(scene);
```

Para vários do mesmo modelo na tela, clone com `SkeletonUtils.clone(scene)`. Um `scene.clone()` comum quebra a skin.

## Nomes

`classe_sexo` ou `classe_sexo_lvlNN`, com `h` para homem e `m` para mulher. Exemplos: `vampiro_h`, `guerreiro_m_lvl03`.

## Anões e elfos (02/11/2026)

12 arquivos novos: `anao_{h,m}_lvl0{1,2,3}.glb` e `elfo_{h,m}_lvl0{1,2,3}.glb`. Mesmo esqueleto Mixamo de 65 ossos.
Alturas: anão 1,30 m; elfo 2,10 m (pés em Y = 0). O jogo encaixa pelo quadril do rig e, no elfo, aplica 2,10/1,80 de altura extra.
No jogo: nível 1 até 19 = `lvl01`, 20 a 39 = `lvl02`, 40+ = `lvl03`; depois de um Caminho concluído entra o modelo da classe.
