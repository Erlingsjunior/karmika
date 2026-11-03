# Compêndio de Karmika — o Sistema de Runas e as Árvores de 60 (03/11)

Pedido do Erling, 03/11: "a árvore de skills precisa ser mais individual, mais criativa… pelo menos 60 de cada classe, incluindo buffs e pontos passivos que aumentam as magias… coloque as runas que temos no game, as runas kármicas, que podem ser colocadas em magias e mudam totalmente a magia… runas dropadas no loot… também em espadas, escudos e armas… nem todas as skills recebem runas, apenas as ativas."

Referências: o PoE2 (as gemas de suporte mudam a magia: "mais projéteis", "explode ao matar", "vira totem"), o Diablo IV (o rank e a escolha de 1 entre 2 variações) e o Last Epoch (cada magia tem a sua própria árvore de nós que a transforma). No Karmika, quem faz esse papel são **as seis runas da nossa língua**, e a mesma runa muda cada magia de um jeito.

---

## 1. As seis runas de magia

As runas são as letras que já estão no jogo (`runas.ts`). Cada uma tem uma **natureza**. Encaixada numa magia ativa, a runa traduz essa natureza para aquela magia: a Fome no Escudo Arremessado deixa um rastro de fogo; a Fome na Torre faz a torre explodir ao acabar.

| Runa | Natureza (o que ela faz numa magia) | Cor do brilho |
|---|---|---|
| **A Lágrima** | O que escorre: água, gelo, cura e lentidão. Deixa poças, congela, cura aliados que a magia toca. | azul-claro |
| **O Olho Kármico** | O que enxerga: mira, crítico, marca e alma. A magia persegue o alvo, acerta pontos fracos, revela o escondido. Muda conforme o karma: com karma bom, vira luz; com karma mau, vira sombra. | ouro |
| **A Ampulheta** | O tempo: eco (a magia se repete 1 s depois, mais fraca), cargas a mais, recarga menor, duração maior, detonação atrasada. | areia |
| **O Labirinto** | A forma e o número: mais cópias (2 ou 3 torres, mais projéteis), ricochete, espiral, rastro que desenha o caminho. | verde-musgo |
| **A Fome** | O fogo e o sangue: queima, explode no fim, deixa o chão em chamas, rouba vida, devora cadáveres. | brasa |
| **A Fresta** | O "entre", a casa de Nufaz: atravessar, teleportar, abrir frestas que puxam inimigos e soltar ecos sombrios. É a mais forte e **cobra um preço** (vida, karma ou a marca da Fresta na alma). | cinza-violeta |

**A Fresta e o karma.** Cada magia lançada com a Fresta deixa um pouco de **Fresta na alma** (um contador escondido, que a ficha mostra como "A tua alma está…").
- Com muita Fresta, a Ordem do Fio passa a desconfiar do herói e os Desfiados vêm procurá-lo.
- Na reencarnação, a nova vida herda **Ecos do Entre**: ouve sussurros, ganha um pouco de dano sombrio e as pedras de teleporte às vezes falham com ela.
- É poder fácil com consequência, a ideia central do Karmika.

## 2. Graus da runa (o loot)

**As runas são do jogo avançado** (Erling, 03/11): elas só caem de monstros do **nível 20 para cima**, nem chefes soltam antes disso. É a virada do jogo: até o 20 você aprende a classe; dali em diante, as runas começam a transformá-la.

| Grau | Onde cai | Força do efeito |
|---|---|---|
| **Lascada** | monstros 20+ (raro), elites e chefes 20+ | efeito base |
| **Gravada** | monstros 35+, elites, baús de masmorra | efeito +50% |
| **Viva** | chefes 50+ (garantida no 1º abate do dia), masmorras 50+, elites 50+ | efeito +100% e o brilho da runa aparece na magia |
| **Desperta** | chefes de mundo 100+, elites 100+ (muito raro), eventos, a Vela | efeito +150% e **um efeito extra único** (escrito em cada magia como "Desperta:") |

- **Juntar:** 3 runas iguais do mesmo grau viram 1 do grau seguinte, na mesa do **Gravador de Runas**, em todas as cidades grandes.
- **Tirar:** tirar uma runa de uma magia ou arma no Gravador custa ouro (proporcional ao grau). A runa volta inteira, nunca se perde: errar uma escolha não pode doer para sempre (o jogo é de anos).
- Runas são negociáveis: no mercado, no leilão e no correio.

## 3. Encaixes (slots)

**Nas magias:** só nas **ativas**, as que agem no mapa (em inimigos, em aliados ou no chão). As passivas nunca recebem runa.
- 1º encaixe: abre no **rank 3** da magia.
- 2º encaixe: abre no **rank 7**.
- 3º encaixe: abre só nas **Supremas**, no rank 10.
- A mesma runa não entra duas vezes na mesma magia.

**Ressonância (duas runas diferentes na mesma magia).** O par também dá um efeito extra, igual para todas as magias:

| Par | Ressonância |
|---|---|
| Lágrima + Fome | **Vapor:** onde o fogo encontra a água sobe uma névoa que cega (inimigos erram 30%). |
| Lágrima + Ampulheta | **Geada lenta:** a lentidão dura o dobro. |
| Lágrima + Labirinto | **Corrente:** as poças se ligam e a cura salta para até 3 aliados. |
| Lágrima + Olho | **Lágrima clara:** a cura também tira 1 maldição ou veneno. |
| Lágrima + Fresta | **Água parada:** quem fica na poça é puxado devagar para o centro. |
| Fome + Labirinto | **Rastro de fogo:** tudo que a magia percorre fica em chamas por 3 s. |
| Fome + Ampulheta | **Pavio:** a explosão final atrasa 1,5 s e fica 60% maior. |
| Fome + Olho | **Faro de sangue:** críticos da magia roubam vida em dobro. |
| Fome + Fresta | **Boca do Entre:** ao matar, o inimigo é devorado pela fresta e cura você em 5%. |
| Olho + Ampulheta | **Previsão:** o primeiro golpe da magia depois de 4 s sem usá-la é crítico garantido. |
| Olho + Labirinto | **Caçada:** os projéteis e as cópias extras procuram alvos diferentes. |
| Olho + Fresta | **Olhar do Entre:** a magia acerta inimigos invisíveis e atrás de paredes finas. |
| Ampulheta + Labirinto | **Eco múltiplo:** o eco da Ampulheta também ganha as cópias do Labirinto. |
| Ampulheta + Fresta | **Volta:** 1 s depois de lançar, você pode voltar ao ponto onde lançou (aperte de novo). |
| Labirinto + Fresta | **Portas:** as cópias da magia saem de frestas em volta do alvo, não de você. |

## 4. Runas nas armas, escudos e armaduras

A mesma runa do loot também entra no equipamento, nos **engastes**: comum 0, mágico 1, raro 2, lendário 3. Cada lugar dá um efeito diferente (os números são do grau Lascada; os outros graus seguem a mesma regra de +50%, +100% e +150%):

| Runa | Na arma | No escudo | Na armadura |
|---|---|---|---|
| Lágrima | golpes retardam 10% por 2 s | bloquear cura 2% da vida | +8% de cura recebida |
| Olho Kármico | +4% de chance de crítico | bloqueio perfeito marca o atacante (+15% de dano nele) | vê armadilhas e inimigos escondidos a 8 m |
| Ampulheta | +5% de velocidade de golpe | a guarda se recupera 20% mais rápido | −5% de recarga das magias |
| Labirinto | 10% de chance de o golpe acertar um 2º inimigo perto | o bloqueio devolve 15% do dano em quem está perto | +1 alvo nas magias em cadeia |
| Fome | +3% de roubo de vida e queima leve | bloquear incendeia o atacante | +6% de dano com a vida abaixo de 50% |
| Fresta | +12% de dano sombrio e 1 marca de Fresta a cada 50 golpes | 8% de chance de o golpe atravessar você (você some 0,3 s) | +10% de dano, −5% de vida máxima |

A **runa Desperta** num equipamento lendário acende o padrão rúnico na peça (o brilho aparece no modelo 3D).

## 5. A árvore de 60 de cada classe

As 10 a 17 magias de hoje continuam, com o mesmo nome e a mesma tecla, e viram a espinha da árvore. Em volta delas entram as novas. Cada classe tem, no total, **60 habilidades**:

| Tipo | Quantas | Recebe runa? | O que é |
|---|---|---|---|
| **Ativas** | 16 | sim | golpes, áreas, projéteis, torres e invocações, movimento, defesa ativa |
| **Bênçãos e auras** | 2 | sim (agem em aliados) | buffs de grupo ou do herói, com tempo |
| **Supremas** | 2 | sim, com 3 encaixes | a transformação e a magia final da classe (abrem nos níveis 40 e 60) |
| **Passivas de magia** | 25 | não | melhoram uma magia específica, em 3 níveis (ex.: "Fio de Navalha — Golpe Firme: +5/10/15% de crítico no Golpe Firme") |
| **Passivas de classe** | 15 | não | o recurso, a mecânica da classe, a defesa e a vida, em 3 a 5 níveis |

**Pontos:** as ativas e as supremas continuam com ranks de 1 a 10 (1 ponto por nível, como hoje). As passivas custam 1 ponto por nível e abrem quando a magia que elas melhoram chega ao rank 3. Os **talentos** (a constelação) continuam separados, com pontos próprios.

**Mais pontos para caber tudo:** com 60 habilidades, 1 ponto por nível não chega. A proposta:
- **1 ponto por nível** e **+1 a cada 5 níveis** (Marco). No nível 100, são 120 pontos.
- As passivas de magia ficam baratas (1 ponto por nível, máximo 3).
- Ninguém completa a árvore antes da Ascensão. **Escolher é o jogo.**

## 6. Os compêndios por classe

Cada classe tem o seu arquivo: `compendio-<classe>.md`. Neles estão as 60 habilidades e o efeito de cada uma das 6 runas em cada ativa.
- Puras: Humano, Anão, Elfo.
- Caminhos: Guerreiro do Norte, Paladino, Tecnocrata, Vampiro, Lobisomem, Mago, Bruxo, Caçador de Demônios.
