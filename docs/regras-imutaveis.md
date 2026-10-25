# KARMIKA — Regras imutáveis

Definidas pelo Erling em 20/10/2026 e ampliadas em 21/10/2026, 22/10/2026, 23/10/2026 e 24/10/2026. Nenhuma mudança de balanceamento pode quebrar estas regras.

## 0. Capricho em nível surreal (regra de ouro, 24/10/2026)
Karmika é feito para ser vendido, rodar em servidor próprio e ter jogadores do mundo todo por anos. Por isso:
- **Nada sai pela metade.** Cada prédio, missão, diálogo, arma, efeito e tela é feito como se fosse o único do jogo.
- **Atenção máxima aos detalhes:** proporção, luz, som, texto, física (não atravessar, não flutuar, não travar), legibilidade, coerência com a lore.
- **Conferir antes de entregar:** todo trabalho é visto no jogo (print/teste) antes de ser dado como pronto; o que não foi conferido é dito com todas as letras.
- **História viva:** toda missão tem diálogo ao pegar e ao entregar; os NPCs falam do mundo, das facções, do que aconteceu antes. Nenhum NPC importante é mudo ou genérico.
- **Mundo entrelaçado:** as classes, cidades e facções dependem umas das outras (comércio, encomendas, alianças, inimizades). Nada existe solto.
- **Melhor menos e perfeito do que muito e tosco.** Se não dá para fazer bem agora, fica anotado para depois, nunca mal feito.

## 1. Evoluir leva tempo e premia bem
- Karmika é **lento e hardcore**, para quem gosta de ação e de história. A ideia é ficar no jogo por anos.
- Cada nível conquistado tem que ter custado tempo e ter valido a pena.
- Equilíbrio: trabalhoso, mas **legal de jogar**. Nunca difícil só por ser difícil.

## 2. A progressão anda em frentes conjuntas
- **Antes da classe, são 3 frentes:** equipamento, nível e lore (história).
- **Depois da primeira classe, são 4:** equipamento, nível, lore e **nível de classe**.
- Nenhuma frente sozinha leva o personagem adiante.

## 3. De onde vem cada coisa
- **Missões dão o XP de verdade.**
  - **A linha amarela (história) paga cerca de 60% de todo o XP do caminho (23/10/2026).** Cada missão amarela paga 54% do XP de todos os níveis entre ela e a próxima amarela; as pontes da história somam mais ~6%. Do 1 ao 30 isso dá ~44 mil dos ~72,6 mil de XP.
  - Os outros ~40% vêm de missões azuis, Quadro, masmorras, relíquias, vistas e caça. Ninguém precisa de dezenas de azuis, mas precisa de algumas.
  - **Missões de chefe pedem o nível** (objetivo "chegar ao nível N" — Guardião da Mata 20, Príncipe das Cinzas 24, Carniceiro de Selvar 28): é aí que o jogador sai para caçar, fazer extras e masmorras antes de continuar a amarela.
  - Missões de história fora do fio principal: cerca de 70% de um nível inteiro, no nível da missão.
  - Extra de NPC: cerca de 33%.
  - Contrato do Quadro: cerca de 24%.
- **A caça (grind) dá pouco XP, mas é onde caem os equipamentos.**
  - XP de abate: 30% da base do monstro.
  - Monstro acima do seu nível: +12% por nível de diferença, até +5 níveis.
  - Monstro abaixo do seu nível: −20% por nível. A partir de 5 níveis abaixo é "cinza" e não dá XP.
  - Chance de equipamento por abate: 13% + 3% por nível do monstro, até 60%.
- **Itens são raros e valiosos.** Ficar mais forte depende deles.
- Diário com até **10 missões** ao mesmo tempo.

## 4. Curva de nível
- XP para passar do nível *n* para o *n+1*: `60 + 45·n + 6·n²`.
- A história amarela sozinha leva a ~60% do caminho; o resto exige extras, masmorras e caça.
- Primeira leva do jogo até o nível 60; expansão até o 100.

## 5. Missões sempre desafiam, e as rotas fazem sentido
- Missão ainda não aceita nasce **1 a 3 níveis acima** do nível atual do jogador.
- Os níveis das regiões crescem a partir dos **berços** (Karmika, Brasaforja, Lithendel) e das cidades, não do centro do mapa. A rota de missões de cada raça precisa ter monstros que a tornem plausível, até as academias de Askavik.
- Teto por região: o jogador fica limitado ao nível da região + 5, e aparece uma aura de penalidade.
- **A história amarela nunca some entre duas etapas.** Entre a chegada a Askavik (25) e a Vidente (30) há três missões de Askavik: Ossos em Grenivik (26), Os Lobos do Passo (27) e O Carniceiro de Selvar (28, título "Escudo de Askavik").

## 6. Combate lento, pesado e lido
- **Ritmo:** golpes e magias do herói duram 65% a mais (TEMPO 1,65).
- **Os inimigos telegrafam:** o preparo do golpe é 75% mais longo e o intervalo entre golpes 60% maior.
- **Mundo menos povoado:** cerca de 45% menos bichos por grupo. Cada luta pesa.
- **Inimigos resistentes:**
  - Bichos ágeis esquivam, armados aparam, grandes bloqueiam.
  - Quanto mais acima do seu nível, mais evitam.
  - Destreza fura a esquiva; força fura bloqueio e aparo.
- **Magias inimigas marcam o chão:** o círculo cresce e explode, e dá tempo de sair. Magias de projétil (bola de fogo) voam visíveis da mão de quem conjura até o círculo.
- **Reações animadas, cada uma com som próprio:**
  - Esquiva (destreza, até 35%): passo lateral.
  - Aparo (lâmina, de frente, força, até 20%): faísca; o inimigo fica atordoado e abre o contra-ataque.
  - Bloqueio (defesa ou escudo, até 30%): o escudo empurra e o corpo firma.
  - Bloqueio perfeito: guarda erguida a menos de 0,5 s do golpe.
- **Som:** corte de lâmina em carne não é metal contra metal. O metal fica só para o aparo.
- Monstro 5+ níveis acima tem **caveira** e selo vermelho. Monstro de missão tem **anel dourado** no chão.

## 7. Dano: somar, não multiplicar
- **O nível dá +5% por nível ao golpe base e só metade disso (+2,5%) ao dano da arma.** Senão nível × arma × Força explodem no fim do jogo.
- **Os outros bônus somam num balde único:** Força, buffs, marca e emboscada. Só o ranque da magia e o crítico (×1,7) multiplicam.
- **Atributos rendem cada vez menos:**
  - Força: 100% até 20 pontos, 60% até 60 pontos, 30% depois.
- **Equipamento (desde 21/10/2026):**
  - Crítico, roubo de vida, velocidade, XP e ouro dependem só da raridade, nunca do nível do item.
  - Regeneração e atributos crescem devagar com o nível do item (+3% por nível).
  - Dano, defesa, vida e magia crescem com o nível do item.
  - Crítico máximo: 50%.
- **Monstros depois do nível 20:** vida e golpe crescem mais rápido por nível (a curva fica mais forte quanto mais alto o nível da região). Até o nível 20 nada muda.
- **Simulação de referência (nível 45, pontos equilibrados, magias no ranque 10):**
  - Sem equipamento: perde para monstros do nível 45.
  - Com raro: lobo 45 em ~10 s; carniçal 45 meio a meio.
  - Com lendário: lobo 45 em ~6 s; carniçal 45 em ~20 s; lobisomem 45 em ~50 s e arriscado.
  - Com lendário + relíquias: lobisomem 45 vence quase sempre; elite 47 continua precisando de grupo ou de muita técnica.
- **Casca dura:**
  - **Armadura** (percentual): 6% + carapaça do bicho + 2,5% por nível que ele tem acima de você, até 60%.
  - **Absorção** (fixa): pontos tirados de cada golpe, maior em bichos encouraçados e de nível alto.
- **Tipos de dano:** corte, impacto, perfuração, fogo, gelo, sagrado. Exemplos:
  - Esqueleto resiste a corte e sofre com impacto.
  - Demônio resiste a fogo e sofre com sagrado.
  - Árvore viva sofre com fogo e com machado.
  - Lobisomem resiste a tudo, menos ao sagrado.
- **Postura:** elites e chefes têm uma barra de guarda (amarela).
  - Enquanto ela está cheia, o dano entra pela metade.
  - Golpes pesados, aparos e bloqueios perfeitos a quebram.
  - Quebrada, o elite cambaleia ~3 s e toma dano cheio; ela volta em 8 s.
- **Meta de duração:**

| Alvo | Duração |
|---|---|
| Normal do seu nível | 10–12 golpes (~15–20 s) |
| Normal 3 níveis acima | ~30 s, perigoso |
| Elite | 45–60 s |
| Chefe | 3–5 min |

## 8. Magias
- **1 ponto de magia por nível**, mais pontos extras raros de tomos e missões.
- **Ranque máximo 10** por magia, limitado também por 1 + nível ÷ 8.
- Cada ranque dá +4% de dano somado, além de área, duração e alcance.
- Estágios visuais: Bronze (3), Prata (6), Ouro (10).
- Muitas magias para muitos níveis: a Guerreira Nórdica tem **27 até o nível 60**.

## 9. Profissões também levam tempo
- Cortar lenha (30 machadadas por árvore), quebrar pedra (19 a 45 pancadas), esfolar ajoelhado com a faca, colher ervas com o alicate, pescar, fazer tábuas na bancada para construir.
- Cada ferramenta tem seu espaço; quanto melhor a ferramenta, mais rende e mais achados raros. Algumas coisas só cedem a ferramentas boas.
- As profissões evoluem com o uso e são parte do motivo de ficar no jogo.

## 10. Escolhas com contexto: o MOTIVO pesa, não só o ato
- O desfecho do mundo pode ser o mesmo (a vila é sempre salva), mas o **karma** de quem escolheu muda conforme **por que** escolheu.
- Toda escolha é válida, e toda escolha pesa. Depois de decidir, **o Olho julga** numa janela que explica o porquê do karma.
- Vale para:
  - todos os elites e chefes que se rendem;
  - todas as missões amarelas (história);
  - parte das azuis;
  - personagens marcantes.
- **O Olho dorme até o nível 20.**
  - Antes disso, as escolhas são guardadas em silêncio no Compêndio.
  - Ao abrir, o Olho conta a história do karma no letreiro de Marghar e cobra tudo o que guardou.
- Modelo da rendição (elites e chefes, exceto o chefe final de cada saga):

| Súplica | Poupar | Matar / expurgar |
|---|---|---|
| **Suborno** ("posso lhe dar tesouros inimagináveis") | é vender a própria nobreza: karma −12, mas ganha o tesouro | +8 |
| **Arrependimento** ("me ajude a trilhar o caminho de Marghar") | é fé no outro. Se era verdade: +15 e ele repara o mal. Se era mentira: −6 pela ingenuidade, e ele ataca e foge | +3 ("você nunca saberá se dizia a verdade") |
| **Ameaça** ("minha maldição cairá sobre você por sete vidas") | por medo: −5 (covardia), ganha um tomo | +6, e a maldição pode voltar em outra encarnação |

- Marghar não julga. Ele vê, e guarda. Mas ele cobra… Ele se lembra.
- Deus dos caminhos: **Marghar**. O adversário é o **Sem-Passo**.
- **Próximo passo combinado:** a escala do karma vai crescer (escolhas grandes de ±80 a ±100) e a morte vai virar o karma em areia na Ampulheta.

## 11. Mobilidade acima da física (regra de ouro, 22/10/2026)
- **Ninguém trava em lugar nenhum:** becos finos, passagem entre cadeiras e bancos, espaço entre casas, florestas densas, bancos de praça, bancos dentro de igrejas.
- Paredes, água funda, mar e alta montanha bloqueiam. **Móveis e objetos pequenos** (bancos, cadeiras, tochas, lápides, baús, barracas, troncos de árvore) bloqueiam só o miolo.
- Objetos grandes (fonte, casas, bancadas de trabalho, tendas) **nunca** se atravessam, nem espremendo.
- O herói desliza pelas quinas: se o caminho direto bate, ele tenta por um eixo e depois contorna o canto.
- Se mesmo assim ficar preso empurrando por um instante, ele se espreme e passa pelo objeto pequeno.
- Todo povoado é validado: nenhum pedaço de chão andável pode ficar fechado, sem acesso a partir do centro.

## 12. Nunca perder o herói de vista (22/10/2026)
- Quando uma casa, templo ou barraca fica entre a câmera e o herói, ele aparece como uma **silhueta azulada** por cima do prédio.
- NPCs não ganham silhueta, a não ser quando o herói está perto deles: aí aparecem também, para dar para conversar.

## 13. Cinemáticas: avisar, marcar, carregar, centralizar (22/10/2026)
- Nenhuma cena obrigatória dispara do nada. Uma **Marca do Destino** (círculo dourado com o Olho e um feixe de luz) fica no chão onde a história começa.
- Ao chegar perto (~30 m), o jogo **avisa** que pisar na marca inicia a cena e que o mundo para enquanto ela é contada.
- Pisar na marca abre uma **tela de carregamento** ("Preparando a cena"): o cenário de todos os planos é montado com a tela preta, e só então o filme começa. O jogo nunca trava no meio da cena.
- **Toda** cena centraliza o que importa no espaço livre ao lado do texto: o ponto de foco da cena, ou o alvo de cada plano. A câmera mede onde ele aparece na tela e se corrige sozinha.
- O jogador pode pular com Esc depois que o texto inteiro passou.

## 14. Portões de masmorra nunca dependem de "matar todos" (22/10/2026)
- Onde os mortos voltam, o portão é um **contador**, não a lista de vivos.
- Catedral: o **Vasilhame do Sacrifício** de cada andar enche com o sangue de quem cai ali (zumbi 3 L, diabrete 2 L, carniçal 6 L, elite 30 L). Andares pedem 111 + 166 + 222 + 167 = **666 litros**.
- A taça cheia abre a escada em espiral; a do andar 4 completa os 666 e, com os três selos, abre a Porta do Bispo.
- Enquanto a taça não enche, os mortos se reerguem longe do jogador, para o sangue nunca faltar. O progresso fica salvo.

## 15. PvP: facção contra facção, karma para quem trai o próprio lado (22/10/2026)
- **Facções diferentes se atacam livremente** fora das vilas, sem custo de karma. Ninguém é obrigado a lutar.
- **Mesma facção (ou quem ainda não jurou lado) não se fere.** Só quem **liga o "PvP da facção"** (F4) pode ferir alguém do próprio lado: o nome fica vermelho e cada vítima nova custa **−3 de karma**; matar custa **−15**.
- Revidar quem atacou primeiro nunca custa karma.
- Companheiros de grupo não se ferem. **Vilas são chão sagrado:** ninguém se fere lá dentro.
- **Duelo** combinado: vale em qualquer lugar e ninguém morre (perde quem chega a 10% da vida).

## 16. Nomes com sentido (22/10/2026)
- **Nomes nórdicos só para anões, para a cidade viking e para NPCs vikings/nórdicos.**
- NPCs **importantes** têm nomes de aventura, marcantes (estilo WoW): Garrick, Doran, Morwen, Kaela, Corwin, Eldrin. Nada de nomes toscos.
- Aldeões comuns podem ter nomes normais (Lúcia, Tessa, Bruno, Rosália, Tomás).
- Na primeira vila: Ragnar → **Garrick** (guarda), Bjorn → **Doran** (armeiro), Vígdis → **Morwen** (alquimista), Astrid → **Kaela** (caçadora), Finn → **Corwin** (domador), Helga → **Maren**, Sigrid → **Lúcia**, Brynja → **Tessa**, Ulf → **Bruno**, Ingrid → **Rosália**, Haldor → **Tomás**. Os anões (Thorin, Olaf, Sven, Gunnar, Orm) mantêm os nomes.

## 17. Morrer não é desastre: o Fio da Vida e as três voltas (23/10/2026)
- **Fio da Vida:** 3 fôlegos. Cada morte gasta um e é só uma queda (volta na fonte do lar). Um fôlego volta a cada dia real. Abaixo do nível 10 o Fio não se desgasta.
- **Sem fôlego, a alma desencarna** e escolhe (ao escolher, o Fio volta a 3):
  1. **Mesmo corpo:** fica tudo, com uma **Dívida Kármica** de 2 níveis de XP. Metade do XP ganho paga a dívida até zerar.
  2. **Reencarnar:** escolhe raça e aparência de novo. Mantém nome, **nível base**, mochila, ouro, cofre, missões, karma e Lágrimas. Volta **sem classe e sem facção** e refaz o caminho com Hrefna. Magias e atributos voltam para redistribuir.
  3. **Lágrima do Olho:** volta sem penalidade, no lugar sagrado da classe (o mestre do caminho).
- **Eco da vida passada:** reencarnar e escolher a mesma classe dá **4× XP de classe** até o nível de classe antigo (cerca de 25% do tempo). Depois o bônus para.
- O karma, as Lágrimas e a dívida são da alma e atravessam as vidas. As vidas passadas aparecem no perfil.
- Cada ato heroico que faz o Olho transbordar deixa uma Lágrima (guarda até 3).
- A ideia: reencarnar é divertido. "Sou eu, o Fulano. Você não era anão? Era, agora sou elfo."
