# Compêndio — Mago
> O mago passou anos na Torre dos Magos, entre livros que voam sozinhos e velas que nunca apagam. Luta de longe, ereto e calmo, e controla o campo com cinco elementos: fogo, gelo, raio, vento e arcano. O recurso é a **Mana** (orbe azul, 200 na base), que volta sozinha quando ele para de conjurar. A mecânica é a **Ressonância**: cada magia deixa no inimigo o eco do seu elemento, e um segundo elemento diferente, em até 4 s, dispara um combo (gelo + raio estilhaça; fogo + vento vira tempestade de fogo). No grupo é **dano em área e controle**: congela, puxa, prende e prepara o terreno para os outros.

**Os combos da Ressonância** (base da passiva 46):

| Par | Combo | O que faz |
|---|---|---|
| Gelo + Raio | **Estilhaço** | o gelo racha e explode em 300% num raio de 3 m; congelados levam o dobro |
| Fogo + Vento | **Tempestade de Fogo** | um redemoinho de chamas de 4 m nasce no alvo por 4 s (90%/s) |
| Fogo + Gelo | **Choque Térmico** | a pele racha: −30% de defesa por 5 s |
| Raio + Vento | **Tormenta** | atordoa 1 s e 3 raios caem em volta (120% cada) |
| Gelo + Vento | **Sopro Branco** | congela todos a 4 m do alvo por 1,5 s |
| Fogo + Raio | **Centelha** | explosão de 200% que pula para todos que estão queimando a 8 m |
| Arcano + qualquer | **Eco Arcano** | repete o último combo que esse inimigo sofreu, com 50% da força |

Cada inimigo só sofre um combo a cada 1 s. No pixel art, o eco aparece como um pequeno símbolo do elemento girando sobre a cabeça do inimigo (uma chama, um floco, uma faísca, uma espiral, uma runa azul); quando o combo dispara, os dois símbolos se chocam num clarão.

---

## Ativas

### 1. Míssil Arcano · projétil · nível 1 (no jogo, tecla 1)
Dois mísseis de luz azul saem da mão (ou da ponta do cajado) e voam até o alvo: 65% do dano da arma cada, 18 m, sem recarga, 2 de Mana. Deixa eco **arcano**.
- **Lágrima:** os mísseis viram gotas de gelo azul-claro. Cada acerto põe 1 acúmulo de Frio (5 acúmulos congelam 1 s) e o respingo retarda 15%. O míssil passa a deixar eco de **gelo** em vez de arcano.
- **Olho Kármico:** os mísseis fazem curva e perseguem o alvo, mesmo atrás de outro inimigo. Cada acerto seguido no mesmo alvo dá +5% de crítico (até +25%). Com karma bom, os mísseis são dourados e revelam invisíveis; com karma mau, são sombras que tiram 5% de defesa.
- **Ampulheta:** a cada 3º disparo, os mísseis param no ar por 1 s, giram, e disparam de novo (eco de 50%).
- **Labirinto:** 3 mísseis saem em espiral, e cada um ricocheteia 1 vez para outro inimigo.
- **Fome:** os mísseis viram brasas. Ao matar, o cadáver explode em 80% num raio de 3 m. Eco de **fogo**.
- **Fresta:** os mísseis saem de pequenas frestas atrás do alvo e ignoram bloqueio e escudos. Custa 1% da vida por disparo.
- **Desperta (Labirinto):** a cada 10 mísseis, sai um Míssil Mestre do tamanho de uma cabeça (400%), que estoura em 6 mísseis pequenos para os lados.

### 2. Escudo Arcano · defesa · nível 2 (no jogo, tecla 2)
Segure: um círculo de runas gira à sua frente e apara 70% do dano que vem de frente. Gasta 4 de Mana por segundo e 1 de Mana a cada 10 de dano aparado.
- **Lágrima:** o círculo vira um espelho de gelo. Quem bate nele fica com o braço congelado (ataca 30% mais devagar por 3 s). Ao soltar, você cura 3% da vida por segundo que segurou (até 15%).
- **Olho Kármico:** aparar no último 0,3 s antes do golpe é um aparo perfeito: um raio dourado volta no atacante (200%) e o marca (+15% de dano nele por 5 s).
- **Ampulheta:** flechas e magias aparadas ficam paradas no círculo, como insetos no âmbar. Ao soltar, todas voltam para quem atirou.
- **Labirinto:** o círculo se parte em 3 placas que giram em volta de você, protegendo também de lado e de costas, e cobrem aliados colados (2 m).
- **Fome:** o círculo arde em brasa. Quem bate pega fogo; ao soltar, o escudo explode num anel de 150% a 4 m.
- **Fresta:** os golpes aparados caem numa fresta e saem em cima de um inimigo aleatório a 10 m, com o dano inteiro. Cada golpe desviado deixa 1 marca da Fresta.
- **Desperta (Ampulheta):** segurar 3 s grava o escudo no chão: ele fica sozinho por 6 s como uma parede de runas, e você fica com as mãos livres.

### 3. Piscar · movimento · nível 3 (no jogo, tecla 3)
Marca uma linha: some num clarão azul e reaparece até 8 m à frente, deixando um eco de luz no ponto de saída. Recarga 6 s, 10 de Mana.
- **Lágrima:** o caminho fica coberto de gelo por 4 s (inimigos 40% mais lentos nele) e, onde você aparece, brota uma poça clara que cura aliados em 2% por segundo.
- **Olho Kármico:** se você mirar num inimigo, reaparece às costas dele, e a próxima magia nele é crítica.
- **Ampulheta:** 3 cargas. O eco de luz que fica para trás vira uma pequena estrela que dispara um Míssil Arcano por segundo durante 3 s.
- **Labirinto:** ao piscar, deixa 2 cópias ilusórias suas que correm para lados diferentes; os inimigos atacam as cópias por 3 s.
- **Fome:** onde você aparece há uma explosão de fogo de 120% (3 m), e onde você estava o chão fica em brasa por 3 s.
- **Fresta:** o alcance vira 20 m e atravessa paredes. Por 0,5 s você fica no Entre e nada o acerta. Custa 5% da vida e 1 marca da Fresta.
- **Desperta (Labirinto):** os ecos de luz que você deixa ficam 8 s no mapa. Piscar entre eles é instantâneo, não gasta carga nem Mana.

### 4. Bola de Fogo · área · nível 4 (no jogo, tecla 4)
Marca o chão: uma bola de fogo voa até lá e explode em 320% num raio de 3 m, queimando todos por 3 s (40% por segundo). Recarga 5 s, 20 de Mana. Eco de **fogo**.
- **Lágrima:** a bola vira fogo e gelo ao mesmo tempo (metade laranja, metade azul). Ao explodir, solta estilhaços de gelo que retardam 30%, e deixa os ecos de **fogo e gelo** juntos (o Choque Térmico dispara sozinho).
- **Olho Kármico:** a bola faz curva até o inimigo mais ferido. Acerto direto, no centro, é crítico e faz +50% de dano.
- **Ampulheta:** a bola para no ponto marcado e vira um pequeno sol por 3 s, queimando tudo a 3 m; no fim, explode com +40% de dano.
- **Labirinto:** ao explodir, solta 4 brasas que pulam pelo chão e explodem cada uma em 60%.
- **Fome:** o chão fica em chamas por 5 s, e quem morre queimando explode em 100%.
- **Fresta:** a bola não voa: sai de uma fresta em cima do alvo, na hora, e é fogo negro com bordas violeta. A queima ignora a resistência ao fogo. Custa 2% da vida e 1 marca da Fresta.
- **Desperta (Fome):** cada inimigo morto pela bola deixa uma Brasa Viva no chão. Se você pisar nela, a Bola de Fogo volta da recarga na hora.

### 5. Meditação Arcana · defesa · nível 5 (no jogo, tecla 5)
Fecha os olhos por 1,5 s, flutuando um palmo acima do chão: cura 25% da vida e devolve 30 de Mana. Depois de lutar, as próximas 3 magias são críticas. Recarga 20 s.
- **Lágrima:** a cura também alcança aliados a 6 m (15% da vida deles), e fica no lugar uma fonte de luz azul que cura 1% por segundo durante 4 s.
- **Olho Kármico:** de olhos fechados, você vê: todos os inimigos escondidos a 30 m ficam marcados por 8 s, e as críticas viram 4 em vez de 3.
- **Ampulheta:** dá para meditar andando (50% mais lento) e a recarga cai para 15 s.
- **Labirinto:** três livros abertos giram em volta de você. Cada uma das magias críticas que vêm depois também solta um Míssil Arcano grátis.
- **Fome:** em vez de curar com calma, você puxa o fogo dos inimigos: cada inimigo queimando a 8 m cura você em 5% e devolve 10 de Mana, e a queima dele acaba.
- **Fresta:** você medita dentro do Entre: some por 1,5 s (os inimigos perdem o alvo) e a cura sobe para 40%. Custa 1 marca da Fresta e, se o seu karma estiver bom, −5 de karma.
- **Desperta (Olho Kármico):** as magias críticas da meditação também ignoram 30% da resistência do alvo.

### 6. Raio em Cadeia · projétil · nível 6 (no jogo, tecla 6)
Um raio sai da mão e salta de inimigo em inimigo: 180% no primeiro e −15% a cada salto, até 4 saltos (Bronze: 5). Recarga 3 s, 15 de Mana. Eco de **raio**.
- **Lágrima:** cada salto deixa uma poça de água eletrificada por 3 s: quem está nela leva 30% por segundo e fica 20% mais lento.
- **Olho Kármico:** o raio salta primeiro para os marcados e para quem tem menos vida, e não perde dano ao saltar para um marcado.
- **Ampulheta:** depois do último salto, o raio faz o caminho de volta até você (eco de 50%), e cada inimigo que ele cruza na volta devolve 2 de Mana.
- **Labirinto:** saem dois raios, um para cada lado, e cada um ganha +3 saltos.
- **Fome:** cada salto queima e rouba 1% da vida para você; o último alvo da cadeia explode em 150%.
- **Fresta:** o raio também salta através de frestas, até 25 m e atrás de paredes. Custa 3% da vida.
- **Desperta (Labirinto):** quando o raio fica sem alvos, vira uma bola de raio que gira no ar por 4 s e salta em qualquer inimigo que chegar perto.

### 7. Nevasca · área · nível 7 (no jogo, tecla 7)
Marca o chão: por 6 s cai uma nevasca de 6 m que fere 60% por segundo e deixa todos 35% mais lentos dentro dela. Recarga 15 s, 35 de Mana. Eco de **gelo**.
- **Lágrima:** aliados dentro da nevasca ganham um escudo de gelo de 8% da vida; inimigos que ficam 4 s seguidos dentro congelam por 1,5 s.
- **Olho Kármico:** um olho de gelo se abre nas nuvens: as pedras de granizo maiores caem direto nos marcados, com +20% de crítico.
- **Ampulheta:** a nevasca dura 10 s e, no fim, todo o gelo acumulado cai de uma vez num estalo de 250%.
- **Labirinto:** em vez de uma, caem 2 nevascas de 4 m, ou (se você marcar em você mesmo) uma nevasca menor que anda com você.
- **Fome:** vira Nevasca de Cinza: neve e brasa caem juntas, conta como **fogo e gelo** ao mesmo tempo, e queima quem está dentro.
- **Fresta:** o centro da nevasca abre uma fresta que puxa os inimigos para o meio, 1 m por segundo. Custa 5% da vida e 1 marca da Fresta.
- **Desperta (Ampulheta):** congelados dentro da nevasca não acordam com dano: cada golpe neles só racha mais o gelo (+10% de dano por golpe, até +50%), até o gelo derreter sozinho.

### 8. Anel de Gelo · controle · nível 8 (no jogo, tecla 8)
Um anel de gelo explode em volta de você: 120% e congela por 2 s todos a 5 m. Recarga 12 s, 25 de Mana. Eco de **gelo**.
- **Lágrima:** o chão vira uma pista de gelo por 6 s: os inimigos escorregam e não conseguem parar onde querem; aliados em cima dela curam 2% por segundo.
- **Olho Kármico:** os congelados ficam marcados, e o primeiro golpe que quebra o gelo de cada um é crítico garantido.
- **Ampulheta:** o anel explode duas vezes: a segunda 1 s depois, maior (8 m).
- **Labirinto:** o anel vira 3 ondas que crescem uma após a outra (3, 6 e 9 m).
- **Fome:** quando o gelo derrete, os congelados soltam vapor fervendo e explodem em 150%.
- **Fresta:** o anel congela também o tempo: flechas e magias inimigas dentro dele param no ar e se desfazem. Custa 4% da vida.
- **Desperta (Labirinto):** do anel crescem paredes de cristal que formam um pequeno labirinto por 5 s: os inimigos ficam presos nos corredores e você atira por cima.

### 9. Meteoro · área · nível 24 (no jogo, tecla 9)
Marca o chão: depois de 1 s, um meteoro cai do céu. 550% num raio de 4 m, derruba por 1 s e deixa o chão em brasa por 4 s. Recarga 20 s, 50 de Mana. Eco de **fogo**.
- **Lágrima:** vira um cometa de gelo com cauda azul: congela 2 s em vez de derrubar e deixa uma cratera de gelo que retarda 50%. Eco de **gelo**.
- **Olho Kármico:** durante a queda, o meteoro segue o alvo marcado; acerto no centro dobra o dano.
- **Ampulheta:** depois do grande, caem mais 3 pequenos (100% cada) ao longo de 2 s, nos pontos onde os inimigos fugiram.
- **Labirinto:** caem 3 meteoros em triângulo, cada um com 60% do dano.
- **Fome:** a cratera vira um lago de lava por 6 s (80% por segundo), e no fim a lava explode de novo em 200%.
- **Fresta:** o meteoro sai de uma fresta aberta no céu, sem espera, e é rocha do Entre: deixa um rasgo no chão que puxa os inimigos e os cala (não podem lançar magias) por 2 s. Custa 8% da vida e 2 marcas da Fresta.
- **Desperta (Labirinto):** no impacto, o meteoro se parte em 8 pedras em chamas que rolam para fora e explodem cada uma em 80%.

### 10. Selo Arcano · controle · nível 10 (no jogo, tecla ⇧1)
Grava um selo de runas no inimigo mais perto: por 6 s ele recebe +50% de dano, e cada golpe seu nele devolve 1% do dano em vida. Recarga 12 s, 15 de Mana. Eco de **arcano**.
- **Lágrima:** o selo pinga luz azul: aliados que batem no selado também se curam com 1% do dano.
- **Olho Kármico:** se o selado morrer, o selo pula para o inimigo mais perto com o tempo cheio.
- **Ampulheta:** o selo guarda o dano que o alvo levou e, no fim dos 6 s, estoura 30% desse dano de uma vez.
- **Labirinto:** o selo é gravado em até 3 inimigos ao mesmo tempo, com +30% de dano em cada.
- **Fome:** vira um selo de sangue: rouba 3% em vez de 1%, e o cadáver do selado explode em 150%.
- **Fresta:** o selo prende a alma: o selado não consegue se afastar mais de 8 m do ponto onde foi selado (é puxado de volta por um fio violeta). Custa 1 marca da Fresta e, se o alvo for outro jogador, −2 de karma.
- **Desperta (Olho Kármico):** o selo mostra os elementos que o alvo já sofreu. Cada elemento diferente que você usa nele dá +10% de dano acumulado (até +50% com os cinco).

### 11. Cone de Gelo · área · nível 12 (no jogo, tecla ⇧2)
Marca um cone: sopra na palma aberta e um vento gelado varre 8 m à frente (90°), com 200% e lentidão de 40% por 3 s. Recarga 8 s, 20 de Mana. Eco de **gelo e vento**.
- **Lágrima:** vira um jato de água gelada que empurra 3 m e deixa os alvos molhados por 4 s: o próximo raio neles faz +40%, e o próximo gelo congela na hora.
- **Olho Kármico:** o cone vira uma lança fina (14 m e 30°), com +25% de crítico.
- **Ampulheta:** dá para segurar o sopro até 3 s; ele cresce 30% de dano por segundo.
- **Labirinto:** saem 3 cones (frente e as duas diagonais), ou, se você girar, um sopro de 360° com 70% do dano.
- **Fome:** o vento leva cristais de sal e gelo que cortam: os alvos sangram 3 s. Quem morre vira estátua de gelo e explode 1 s depois.
- **Fresta:** o vento sai de uma fresta atrás dos inimigos e os empurra até você, em fila. Custa 3% da vida.
- **Desperta (Lágrima):** os atingidos ficam com uma crosta de gelo nas costas: o próximo raio neles dispara o Estilhaço sem precisar de eco.

### 12. Runa de Choque · torre · nível 14 (no jogo, tecla ⇧3)
Marca o chão: grava uma runa que brilha fraquinha; quem pisar fica preso e eletrocutado por 2 s (60% por segundo). Até 4 runas. Recarga 4 s, 15 de Mana. Eco de **raio**.
- **Lágrima:** a runa leva gelo junto: quem pisa congela 2 s e o chão em volta fica escorregadio. Eco de **gelo e raio** (Estilhaço garantido).
- **Olho Kármico:** as runas ficam invisíveis para monstros e jogadores, e quem pisa leva um crítico.
- **Ampulheta:** a runa pulsa sozinha a cada 2 s (3 pulsos), mesmo sem ninguém pisar, prendendo quem estiver a 2 m.
- **Labirinto:** até 8 runas, e runas a até 6 m se ligam com fios de raio: quem cruza o fio leva 50% e fica lento.
- **Fome:** a runa não prende: explode em 200% e deixa o chão em chamas por 3 s.
- **Fresta:** quem pisa é jogado para outra runa sua, à sua escolha (ou a mais longe). Custa 1 marca da Fresta por runa gravada.
- **Desperta (Labirinto):** 4 runas que formam um quadrado fecham entre elas uma gaiola de raio por 4 s: ninguém entra nem sai.

### 13. Lufada · projétil · nível 9
Uma lâmina de vento quase transparente, com um brilho branco na borda, corta 14 m em linha reta e atravessa todos: 160% e empurra 2 m. Recarga 4 s, 12 de Mana. Eco de **vento**.
- **Lágrima:** o ar fica úmido: a lâmina deixa uma névoa fria no caminho por 3 s (lentidão de 25%) e conta como **gelo e vento**.
- **Olho Kármico:** a lâmina corta a armadura: −15% de defesa por 4 s nos atingidos, e crítico garantido em quem está no ar ou derrubado.
- **Ampulheta:** vira um bumerangue: para no fim e volta até você, cortando de novo.
- **Labirinto:** saem 5 lâminas em leque, ou (segurando) uma lâmina que gira em espiral em volta de você.
- **Fome:** a lâmina leva brasas: conta como **fogo e vento** e acende uma Tempestade de Fogo pequena (metade do tamanho) no primeiro alvo.
- **Fresta:** a lâmina corta o próprio mundo: deixa um risco violeta no ar por 3 s que corta quem atravessar (100%). Custa 3% da vida.
- **Desperta (Ampulheta):** a lâmina pode voltar até 3 vezes, e cada volta ganha +25% de dano.

### 14. Redemoinho · controle · nível 16
Um ciclone de 4 m nasce no ponto marcado e anda devagar para a frente por 5 s: puxa os inimigos para o centro, levanta-os no ar por 1 s e fere 70% por segundo. Recarga 14 s, 30 de Mana. Eco de **vento**.
- **Lágrima:** vira uma tromba d'água: molha os inimigos (como no Cone de Gelo) e cura em 3% por segundo os aliados que passam nele.
- **Olho Kármico:** o redemoinho persegue o alvo marcado em vez de andar reto.
- **Ampulheta:** o redemoinho fica parado onde nasceu e cresce 20% por segundo, até 8 m.
- **Labirinto:** nascem 3 redemoinhos pequenos que dançam em volta de você, empurrando quem chega perto.
- **Fome:** pega fogo e vira uma Coluna de Fogo, que conta como **fogo e vento**: cada inimigo dentro dispara a Tempestade de Fogo.
- **Fresta:** no fim, o redemoinho se fecha numa fresta e cospe todos que estavam dentro no ponto que você escolher (até 15 m). Custa 5% da vida.
- **Desperta (Labirinto):** no fim, os 3 redemoinhos se juntam num só, gigante, que joga todos para o alto por 2 s.

### 15. Grimório Errante · invocação · nível 18
Um livro da Torre dos Magos sai voando da sua bolsa e flutua ao seu lado por 20 s, folheando sozinho: a cada 2 s, ele lança de novo a última magia de elemento que você usou, com 40% do dano. Recarga 25 s, 40 de Mana.
- **Lágrima:** o livro lê o capítulo das águas: a cada página virada, cura em 3% o aliado mais ferido.
- **Olho Kármico:** o livro lê os inimigos: marca sempre o mais forte e escreve as fraquezas dele no ar (+10% de dano de todos no marcado).
- **Ampulheta:** o livro dura 35 s e lança as suas duas últimas magias, alternando.
- **Labirinto:** saem 3 livros, e cada um copia uma magia diferente (as três últimas).
- **Fome:** as páginas ardem: quando o tempo acaba, o livro se queima numa explosão de páginas em chamas de 300% (4 m).
- **Fresta:** o livro é de capa preta, escrito no Entre: copia com 80% do dano, mas cada cópia sussurra na sua alma e deixa 1 marca da Fresta.
- **Desperta (Labirinto):** os 3 livros leem em coro: a cada 10 s, soltam juntos o combo de Ressonância que você mais usou na luta, de graça, no maior grupo de inimigos.

### 16. Farol Arcano · torre · nível 22
Você finca no chão um pequeno pináculo de cristal, uma miniatura da Torre dos Magos, que dura 15 s: atira raios arcanos de 80% a cada 1 s em quem estiver a 12 m e devolve 2 de Mana por segundo a você, se estiver perto. Recarga 20 s, 35 de Mana. Eco de **arcano**.
- **Lágrima:** o farol é de gelo: os tiros retardam 20%, e aliados a 6 m curam 1,5% por segundo.
- **Olho Kármico:** um olho se abre no topo: o farol mostra invisíveis a 12 m, e você ganha +15% de crítico enquanto estiver no alcance dele.
- **Ampulheta:** o farol guarda a energia dos tiros e, quando acaba, solta tudo num raio só de 500% no inimigo mais forte.
- **Labirinto:** você coloca 2 faróis (3 com a runa Viva ou Desperta), ligados por fios de luz que ferem 60% quem passar entre eles.
- **Fome:** o farol é de brasa: os tiros são de fogo e, quando acaba, ele explode e deixa o chão em chamas por 4 s.
- **Fresta:** você pode trocar de lugar com o farol a qualquer hora (aperte de novo). Custa 2% da vida por troca.
- **Desperta (Ampulheta):** toda magia que você lança a até 12 m do farol é repetida por ele 1 s depois, com 50% do dano.

## Bênçãos e auras

### 17. Clareza · aura · nível 15
Um círculo de letras antigas gira sob os seus pés e de todos os aliados a 15 m por 45 s: +30% de recuperação de recurso (Mana, Fúria, Sede…) e −10% de recarga nas magias. Recarga 60 s, 30 de Mana.
- **Lágrima:** a aura também cura 1% da vida por segundo, e cada aliado deixa pegadas de luz azul.
- **Olho Kármico:** aliados ganham +8% de crítico e veem inimigos escondidos a 10 m. Com karma bom, a aura é dourada (+5% de cura recebida); com karma mau, é cinza (+5% de dano).
- **Ampulheta:** a aura dura 90 s, e a redução de recarga sobe para −15%.
- **Labirinto:** a aura não fica presa a você: cada aliado carrega o seu próprio círculo, e onde dois círculos se tocam o efeito dobra.
- **Fome:** os golpes dos aliados deixam uma queima leve (20% por segundo, 2 s) e contam como eco de **fogo** para a sua Ressonância.
- **Fresta:** cada aliado pode piscar 5 m uma vez a cada 8 s (tecla de esquiva). Custa 1 marca da Fresta para você a cada vez que a aura é lançada, mais 1 por aliado tocado.
- **Desperta (Lágrima):** quem cair a menos de 10% da vida dentro da aura é envolvido por gelo por 2 s (não leva dano), uma vez a cada 60 s por aliado.

### 18. Manto dos Elementos · bênção · nível 20
Você ergue o cajado e veste você e até 4 aliados a 12 m com o elemento da sua última magia, por 20 s: os golpes deles deixam esse eco no inimigo (e disparam a sua Ressonância) e fazem +15% de dano desse elemento. Recarga 30 s, 30 de Mana.
- **Lágrima:** o manto de gelo também dá escudo de 10% da vida a cada aliado.
- **Olho Kármico:** o primeiro golpe de cada aliado em cada inimigo é crítico.
- **Ampulheta:** o manto troca sozinho de elemento a cada 5 s (fogo, gelo, raio, vento), e quem o veste vira uma fábrica de combos.
- **Labirinto:** o manto pega os seus dois últimos elementos, e cada golpe dos aliados deixa os dois ecos.
- **Fome:** cada combo disparado por um aliado cura esse aliado em 3%.
- **Fresta:** o manto é do Entre: os golpes dos aliados também deixam eco **arcano** (Eco Arcano em todo golpe), mas cada aliado perde 1% da vida por segundo e você ganha 1 marca da Fresta.
- **Desperta (Labirinto):** você também veste o manto, e cada combo que um aliado dispara devolve 5 de Mana a você.

## Supremas

### 19. Avatar Arcano · nível 40 (no jogo, tecla 0)
Transformação de 12 s: o corpo vira luz azul, flutua, as runas giram em volta e os livros abertos voam em órbita. Dano ×1,8, +20% de defesa, mísseis triplos. Recarga 90 s, 80 de Mana.
- **Lágrima:** o Avatar vira gelo vivo: cada passo deixa uma trilha congelada, e a cada 2 s um floco gigante cai em você e cura 5% (e os aliados a 5 m).
- **Olho Kármico:** um terceiro olho se abre na testa: todas as magias fazem curva até os alvos, e cada crítico estica o Avatar em 0,5 s (até +6 s).
- **Ampulheta:** quando o Avatar acaba, você ganha mais 6 s de "eco": uma sombra azul sua repete tudo o que você lançou nos 12 s, com 40% do dano.
- **Labirinto:** duas cópias de luz suas aparecem dos lados e lançam junto cada magia, com 35% do dano.
- **Fome:** o Avatar arde em chamas brancas: tudo a 4 m queima, e cada inimigo morto acrescenta 1 s (até +8 s).
- **Fresta:** o Avatar fica com metade do corpo no Entre: 30% de chance de os golpes atravessarem você, e as magias ignoram paredes finas. Custa 15% da vida ao começar e 3 marcas da Fresta.
- **Desperta (Ampulheta):** no último segundo, o Avatar implode numa Singularidade Arcana: puxa tudo a 10 m e explode em 800%.

### 20. Grande Convergência · nível 60
O mago fica parado, ereto, de cajado erguido, e abre sobre o campo o Olho da Tempestade: um círculo de 10 m por 8 s onde os cinco elementos giram como as fatias de um relógio. A cada segundo, um elemento cai em todos dentro (150%), em ordem (fogo, gelo, raio, vento, arcano), disparando todos os combos da Ressonância. No fim, um pilar de luz desce do céu: 800%. Recarga 120 s, 100 de Mana. Você não pode andar enquanto ela dura (pode lançar outras magias).
- **Lágrima:** dentro do Olho, aliados curam 4% por segundo, e o gelo congela cada inimigo por 1 s quando ele passa.
- **Olho Kármico:** o pilar final cai no inimigo mais forte e é crítico garantido. Com karma bom, é um pilar dourado que cura os aliados em 30%; com karma mau, um pilar negro que tira 20% da defesa por 10 s.
- **Ampulheta:** o Olho dura 12 s, e os elementos caem duas vezes por segundo.
- **Labirinto:** abrem-se 2 Olhos menores (7 m) em pontos diferentes, girando em sentidos opostos.
- **Fome:** o fogo cai três vezes por volta, e cada inimigo que morre dentro do Olho faz o pilar final crescer 10%.
- **Fresta:** o centro do Olho é uma fresta aberta: puxa tudo para o meio e os combos ganham +50%. Custa 20% da vida, 5 marcas da Fresta e, enquanto a fresta estiver aberta, os Desfiados a 50 m sentem você.
- **Desperta (Fresta):** depois do pilar, o Olho não se apaga: fica mais 6 s como uma tempestade pequena que segue você, e a sua próxima Grande Convergência tem a recarga pela metade. (O preço da Fresta continua.)

## Passivas de magia

| # | Passiva | Melhora | Nível 1 | Nível 2 | Nível 3 |
|---|---|---|---|---|---|
| 21 | Dedos Rápidos | Míssil Arcano | +10% de velocidade de disparo | +20% | +30%, e o 3º míssil seguido no mesmo alvo é crítico |
| 22 | Mira de Bibliotecário | Míssil Arcano | +5% de crítico | +10% | +15%, e os críticos devolvem 2 de Mana |
| 23 | Círculo Firme | Escudo Arcano | apara 75% do dano | 80% | 85%, e o custo de Mana por segundo cai pela metade |
| 24 | Passo de Luz | Piscar | +2 m de alcance | +4 m | +6 m, e você ganha 15% de velocidade por 2 s depois de piscar |
| 25 | Eco que Fica | Piscar | o eco de luz dura 1 s e dispara 1 Míssil | 2 s e 2 Mísseis | 3 s e 3 Mísseis |
| 26 | Pavio Curto | Bola de Fogo | −0,5 s de recarga | −1 s | −1,5 s, e o raio da explosão cresce 1 m |
| 27 | Brasa Teimosa | Bola de Fogo | a queima dura +1 s | +2 s | +3 s, e a queima se espalha para quem encostar no queimado |
| 28 | Silêncio Interior | Meditação Arcana | cura +5% | +10% | +15%, e a meditação não pode ser interrompida |
| 29 | Página Virada | Meditação Arcana | −2 s de recarga | −4 s | −6 s, e você ganha 1 crítico a mais (4) |
| 30 | Fio Condutor | Raio em Cadeia | +1 salto | +2 saltos | +3 saltos, e o raio não perde dano nos 2 primeiros saltos |
| 31 | Céu Carregado | Raio em Cadeia | +10% de dano | +20% | +30%, e 15% de chance de atordoar 0,5 s cada alvo |
| 32 | Frio que Morde | Nevasca | lentidão +10% | +15% | +20%, e a nevasca congela 1 s quem entra pela primeira vez |
| 33 | Inverno Largo | Nevasca | raio +10% | +20% | +30%, e dura +2 s |
| 34 | Coração de Gelo | Anel de Gelo | congela +0,3 s | +0,6 s | +1 s, e o anel deixa os congelados marcados com eco de gelo |
| 35 | Anel Duplo | Anel de Gelo | −1 s de recarga | −2 s | −3 s, e 2 cargas |
| 36 | Céu que Cai | Meteoro | +10% de dano | +20% | +30%, e o tempo de queda cai para 0,6 s |
| 37 | Cratera Funda | Meteoro | o chão em brasa dura +1 s | +2 s | +3 s, e quem sai da cratera fica derrubado mais 0,5 s |
| 38 | Tinta Indelével | Selo Arcano | o selo dura +1 s | +2 s | +3 s, e o dano extra sobe para +60% |
| 39 | Sopro Largo | Cone de Gelo | cone +10° e +1 m | +20° e +2 m | +30° e +3 m, e empurra 1 m |
| 40 | Mão Gelada | Cone de Gelo | −1 s de recarga | −2 s | −3 s, e os alvos ficam molhados por 2 s |
| 41 | Gravura Funda | Runa de Choque | +1 runa no chão (5) | +2 (6) | +3 (7), e a prisão dura +0,5 s |
| 42 | Vento Cortante | Lufada | +10% de dano | +20% | +30%, e empurra +1 m |
| 43 | Olho do Furacão | Redemoinho | dura +1 s | +2 s | +3 s, e puxa com 30% mais força |
| 44 | Encadernação Firme | Grimório Errante | o livro dura +3 s | +6 s | +9 s, e copia com 50% do dano em vez de 40% |
| 45 | Cristal Polido | Farol Arcano | +10% de alcance e dano | +20% | +30%, e o farol devolve 3 de Mana por segundo em vez de 2 |

## Passivas de classe

| # | Passiva | Níveis | Efeito por nível |
|---|---|---|---|
| 46 | Ressonância | 5 | Liga os combos de elementos (tabela no topo). Por nível: combos fazem +0/10/20/30/40% de dano, e a janela para o segundo elemento cresce de 4 s para 4/4,5/5/5,5/6 s |
| 47 | Poço Profundo | 5 | +20/40/60/80/100 de Mana máxima |
| 48 | Fonte Calma | 5 | a Mana volta +8/16/24/32/40% mais rápido; começa a voltar 1,5/1,3/1,1/0,9/0,7 s depois da última magia |
| 49 | Postura do Erudito | 3 | parado (sem andar) por 1 s: +4/8/12% de dano e +5/10/15% de resistência a interrupção. O corpo fica ereto, as vestes flutuam de leve |
| 50 | Cinco Lâmpadas | 5 | cada elemento diferente que você usou nos últimos 8 s dá +2/3/4/5/6% de dano (até 5 elementos) |
| 51 | Leitura Apressada | 3 | −4/8/12% de tempo de lançamento em todas as magias |
| 52 | Pele de Pergaminho | 5 | +3/6/9/12/15% de resistência a magia, e +2/4/6/8/10% de vida máxima |
| 53 | Distância Segura | 3 | com nenhum inimigo a menos de 6 m: +5/10/15% de dano; com um inimigo colado, Piscar recarrega 10/20/30% mais rápido |
| 54 | Mestre do Campo | 5 | lentidão, congelamento, prisão e empurrões que você causa duram +6/12/18/24/30% |
| 55 | Eco Duradouro | 3 | os ecos de elemento ficam 1/2/3 s a mais no inimigo, e o nível 3 deixa guardar 2 ecos diferentes ao mesmo tempo (um combo triplo dispara os dois combos) |
| 56 | Catalisador | 5 | cada combo de Ressonância devolve 3/5/7/9/12 de Mana e reduz a recarga da magia que o disparou em 0,2/0,4/0,6/0,8/1 s |
| 57 | Juramento da Torre | 3 | uma vez a cada 120/100/80 s, um golpe que mataria você o deixa com 1 de vida e o envolve num globo de runas por 2 s. Os livros da Torre caem abertos a seus pés |
| 58 | Mente Única (pedra-chave) | 3 | só uma pedra-chave ativa. Você escolhe um elemento no mestre da Torre: magias desse elemento fazem +25/32/40% de dano; magias de outros elementos não podem ser lançadas, e a Ressonância passa a disparar quando o mesmo elemento acerta 3 vezes (o combo "puro" daquele elemento) |
| 59 | Égide de Mana (pedra-chave) | 3 | só uma pedra-chave ativa. O dano que você leva sai da Mana antes da vida, a 1 de Mana para cada 1,5/1,7/2 de dano. A Mana volta 30% mais devagar. No pixel art, uma bolha azul fina pisca a cada golpe |
| 60 | Sobrecarga (pedra-chave) | 3 | só uma pedra-chave ativa. Quando a Mana acaba, as magias passam a custar vida (1 de vida para cada 1 de Mana) e fazem +15/22/30% de dano enquanto você estiver sem Mana. Os olhos e as mãos brilham em vermelho e azul, com faíscas soltas |

## Combinações assinatura

- **Estilhaçador:** Nevasca + Lágrima + Ampulheta (Geada lenta) + Raio em Cadeia + Olho + Labirinto (Caçada) + Coração de Gelo + Fio Condutor → a nevasca congela o grupo inteiro, e um único Raio em Cadeia salta por todos e estilhaça cada estátua de gelo, numa chuva de cacos azuis e faíscas.
- **Senhor da Tempestade de Fogo:** Redemoinho + Fome + Labirinto (Rastro de fogo) + Bola de Fogo + Fome + Ampulheta (Pavio) + Ressonância 5 + Catalisador → três redemoinhos em chamas dançam em volta do mago, cada Bola de Fogo neles vira uma Tempestade de Fogo, e o chão todo arde; a Mana volta a cada combo.
- **Biblioteca Viva:** Grimório Errante + Labirinto + Ampulheta (Eco múltiplo) + Farol Arcano + Labirinto + Ampulheta + Encadernação Firme + Postura do Erudito → o mago fica parado como um professor no púlpito, três livros e três faróis lançam tudo de novo, e ele quase não precisa apertar nada.
- **Muralha de Mana:** Escudo Arcano + Ampulheta + Lágrima (Geada lenta) + Égide de Mana + Poço Profundo + Fonte Calma → o mago vira um tanque de longe: apanha na Mana, devolve as flechas paradas no âmbar e grava paredes de runas no chão para o grupo.
- **Mente do Inverno:** Mente Única (gelo) + Cone de Gelo + Lágrima + Olho + Anel de Gelo + Ampulheta + Labirinto (Eco múltiplo) + Mestre do Campo → só gelo, mas tanto gelo que nada se mexe: anéis triplos que repetem, e o combo puro de gelo congela o mapa.
- **Último Sopro:** Sobrecarga + Grande Convergência + Fresta + Fome (Boca do Entre) + Juramento da Torre → sem Mana, pagando com a vida, o mago abre a fresta no meio do Olho da Tempestade; cada inimigo devorado devolve um pouco de vida, e a Torre segura o último golpe. Poder enorme, alma marcada.
