# KayKit (Kay Lousberg) — licença CC0 (uso livre, inclusive comercial, sem crédito obrigatório)

Trazidos em 10/11/2026 na branch `teste_libs`. Só o que o Erling aprovou: objetos de cenário e armas.
Ficaram de fora: personagens chibi, árvores, pedras e a poltrona moderna (não casam com o estilo do Karmika).

| pasta | o que tem | origem |
|---|---|---|
| `masmorra/` | barris, baús, velas, camas, mesas postas, colunas, portões, grades, garrafas, moedas, estandartes, pisos e paredes de masmorra | KayKit Dungeon Remastered 1.0 |
| `halloween/` | abóboras, lápides, caixões, portão de cemitério, santuário, lanternas, velas, cercas, espantalho | KayKit Halloween Bits 1.0 |
| `mobilia/` | camas, mesas, cadeiras, estantes, tapetes, armários (interiores e housing) | KayKit Furniture Bits 1.0 |
| `taverna/` | cozinha, panelas, pratos, comida, bancadas, prateleiras (tavernas e salões comunais) | KayKit Restaurant Bits 1.0 |
| `armas/fantasia/` | espadas, machados, martelos, adagas, lança, alabarda, arcos (com e sem corda), cajados, varinha, escudos, flechas | KayKit Fantasy Weapons Bits 1.0 |
| `armas/aventureiros/` | espadas 1 e 2 mãos, machados, bestas, adaga, escudos, cajado, varinha, grimórios, aljava, canecas, bomba de fumaça | KayKit Adventurers 1.0 (só os acessórios) |
| `armas/esqueletos/` | lâmina, machado, besta, cajado, escudos e flechas dos esqueletos | KayKit Skeletons 1.0 (só os acessórios) |

## Monstros (11/11)

Os quatro esqueletos do **KayKit Skeletons 1.1** (CC0) ficam junto dos outros monstros, em `client/public/models/bestiary/`:
`Skeleton_Warrior.glb`, `Skeleton_Rogue.glb`, `Skeleton_Mage.glb`, `Skeleton_Minion.glb` (textura embutida em cada um).
Usam direto as animações do rig médio de `client/public/anim/`; o código é `client/src/libs/kk-monstro.ts`.
Do pacote só entraram esses quatro arquivos: as armas já estavam em `armas/esqueletos/` e as animações já estavam em `anim/`.

As animações (rig médio e rig grande) ficam em `client/public/anim/` — ver `client/src/libs/anim-kk.ts`.
Cada pasta tem uma única textura (atlas) compartilhada pelos modelos dela: mova os arquivos sempre juntos.
