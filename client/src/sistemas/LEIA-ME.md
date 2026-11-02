# Sistemas do jogo (saíram do `main.ts` em 02/11/2026)

O `main.ts` tinha 4 617 linhas e tudo dividia o mesmo escopo. Agora cada parte do jogo vive num arquivo próprio:

| Pasta | O que guarda |
|---|---|
| `sistemas/` | Comportamento: festa, masmorras, minimapa, colisão, pele do herói… São 42 arquivos, e o comentário da 1ª linha de cada um diz o que ele faz. |
| `dados/` | Tabelas puras: votos, falas da festa, NPCs, armas por classe. |
| `ui/` | Ícones SVG. |
| `fx/` | Efeitos 3D: o fantasma e o círculo das posturas. |

## Como um sistema funciona

```ts
// sistemas/festa.ts
import type { FestaCtx } from '../main';      // só o TIPO (some no build: sem import circular)
export function createFesta(K: FestaCtx) {   // K = o que o sistema usa do resto do jogo
  // ... K.npcSys, K.game, K.inside ...
  return { startFesta, festaTick, get festa() { return festa; } };
}
```

```ts
// main.ts (a raiz: monta tudo, na ordem)
export interface FestaCtx { readonly npcSys: Widen<typeof npcSys>; nightOverride: number | null; /* ... */ }
var festaSys: ReturnType<typeof createFesta>;
function mk_festaSys() { return createFesta({ get npcSys() { return npcSys; }, get nightOverride() { return nightOverride; }, set nightOverride(v) { nightOverride = v; } }); }
festaSys ??= mk_festaSys();                                                         // nasce aqui, na mesma ordem de antes
function startFesta(...a) { return (festaSys ??= mk_festaSys()).startFesta(...a); } // repasse: se chamarem antes, o sistema nasce na hora
```

- **O contrato é o `XxxCtx` no `main.ts`.** Tudo que o sistema usa de fora está listado ali; ao mexer, você vê na hora do que ele depende.
- **O contexto usa getters, não valores.** O sistema sempre lê o valor atual. Quando ele precisa mudar um valor do main, o contexto também tem um `set`.
- **O que o sistema expõe está no `return` de `createXxx`:**
  - funções ganham um repasse com o mesmo nome no `main.ts`;
  - estado mutável (`let`) é lido como `xxxSys.nome`.
- **Por que `var` + `mk_` + `??=`:** antes, as funções do `main.ts` eram içadas e podiam ser chamadas de qualquer ponto. O repasse mantém isso: se alguma função do sistema for chamada antes da linha em que ele nasce, ele nasce na hora.
- **`Widen<typeof x>`** impede que o TypeScript "estreite" o tipo pelo fluxo (por exemplo, `false` em vez de `boolean`).

## O que ainda está no `main.ts` (cerca de 2 700 linhas)

- o boot (mundo, renderer, câmera, cena, luzes);
- a criação dos núcleos (`game`, `inv`, `quests`, `npcSys`, `hub`…);
- o pós-processamento;
- `findInter` (o que o E faz perto de cada coisa);
- o laço do quadro (`frameBody`).

Esses são o esqueleto que liga os sistemas. A próxima etapa é dividir `findInter` e `frameBody` por assunto.
