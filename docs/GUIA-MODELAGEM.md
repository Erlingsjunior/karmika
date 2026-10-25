# KARMIKA — Guia para o modelador 3D

O jogo é 3D renderizado em baixa resolução (efeito pixel art). Você entrega **modelos 3D simples**; o jogo cuida da pixelização, luz, sombra, neblina e brilho.

## Formato de entrega
- **GLB** (glTF binário, `.glb`). Exportar do Blender: File > Export > glTF 2.0 > Format: *glTF Binary*, marcar *+Y Up*, *Apply Modifiers*, e *Animation* quando houver.
- Um arquivo por asset. Nome em minúsculas: `tree_pine_01.glb`, `torch_01.glb`, `hero_human.glb`.

## Escala (REGRA — ver `shared/src/scale.ts`)
1 unidade = **1 metro**. Origem (0,0,0) = **centro dos pés / base do objeto**. Frente do objeto aponta para **+Z**.

| Asset | Medida |
|---|---|
| Porta | 1,1 × 2,4 m (mundo de raças altas) |
| Janela | 0,9 × 1,1 m, peitoril a 1,1 m |
| Casa pequena | 6 × 6 m, 1 andar (3 m) + telhado 1,8 m |
| Casa média | 8 × 6 m, 2 andares (6 m) + telhado 1,8 m |
| Árvore | 5–9 m, raio do tronco 0,25 m |
| Arbusto | 0,6–1,2 m |
| Tocha de poste | 1,9 m |
| Fonte | raio 2,2 m, altura 0,9 m (coluna central opcional até 2 m) |

### Alturas dos personagens (modelo base = `typ`; o jogo varia dentro da faixa)
| Espécie | Faixa | Modelo base |
|---|---|---|
| Humano | 1,75–2,00 m | 1,80 |
| Elfo | 1,90–2,25 m | 2,05 |
| Anão | 1,40–1,60 m | 1,50 |
| Vampiro | ~1,90 m | 1,90 |
| Lobisomem | ~2,20 m | 2,20 |
| Technocrata | 1,80–1,90 m | 1,85 |
| Mech / robô de batalha | 2,80–3,00 m | 2,90 |
| Robô grande / tanque | 3,5 m+ | 4,00 |
| Mago | 1,90–2,00 m | 1,95 |

Modele sempre na altura base; esticar dentro da faixa é feito no jogo. Valores oficiais em `shared/src/scale.ts` (`HEIGHT_RANGE`).

## Estilo e orçamento
- **Low poly facetado** (flat shading), formas claras, silhueta forte. Nada de detalhe fino: a tela é ~3x mais pixelada.
- Triângulos: arbusto ≤ 300 · tocha ≤ 300 · árvore ≤ 800 · fonte ≤ 1.500 · casa ≤ 2.500 · personagem ≤ 2.500.
- Texturas: **opcionais**, pequenas (64–256 px, estilo pintado à mão), sem filtro suave. Pode usar só cor por vértice/material.
- **Sem luz nem sombra assadas.** O jogo ilumina tudo. Materiais PBR simples (baseColor; roughness alta).
- Partes que brilham (janelas, chama): material separado chamado `emissive_*`.
- Árvores/arbustos: tronco e copa em materiais separados (`trunk`, `leaves`) para o vento balançar a copa.
- Pontos de luz: um objeto vazio chamado `light_point` onde fica a chama/lanterna.

## Personagem inicial
- Esqueleto humanoide simples (≤ 25 ossos), T-pose ou A-pose, pés no chão em y=0.
- Animações **com estes nomes exatos**, em loop, 30 fps: `Idle` (respirar, 2–3 s), `Walk` (1 ciclo), `Run` (1 ciclo).
- Sem root motion (o personagem não se desloca no clipe; o jogo move).
- Peças separadas por material: `skin`, `cloth`, `metal`, para tingir por raça/karma depois.
- Depois: `Attack`, `Hit`, `Die`.

## Primeira leva (pedido)
1. Árvores (2–3 variações: pinheiro, carvalho, morta)
2. Arbustos (2 variações)
3. Tocha de poste (+ `light_point`)
4. Fonte da praça
5. Casa pequena e casa média (porta e janelas `emissive_*`)
6. Personagem humano com Idle / Walk / Run

## Como testamos
Colocamos o `.glb` em `client/public/models/` e carregamos no jogo (GLTFLoader). Se o arquivo faltar, o jogo usa o modelo provisório atual, então dá para ir entregando um por vez.
