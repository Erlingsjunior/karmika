# Sagas 30–40: Paladino, Vampiro e Tecnocrata — e o mundo que liga os três

Proposta de 24/10/2026, a pedido do Erling: "um mundo intrínseco". **Aprovada e implantada em 24/10** ("adorei, pode implantar tudo, BEM FEITO").

> **O que já está no jogo (24/10):**
> - Diálogo em toda missão amarela (ao pegar, ao entregar e nos encontros do caminho), com respostas que mexem em Luz/Sombra e marcas que os NPCs lembram (ecos).
> - Missões de Luz (Irmã Maela) e de Sombra (Vesna Corvo-Negro); preços e falas frias conforme a inclinação.
> - Instinto (auras, borda da tela, falas sozinho), juramentos com bênção e quebra.
> - **Companhia das Caravanas de Latão** (`caravanas.ts`): carroças a vapor andando nas rotas (Askavik ⇄ Hrafnhöfn ⇄ Corvoscuro, Askavik ⇄ Austrvik, Kaldrfoss ⇄ Midvangr ⇄ Brasaforja, Porto Caldeira ⇄ Vaporeira); caravana atacada no mapa a cada 9 minutos (salvar = Luz, saquear = Sombra); escolta e resgate como objetivos de missão; loja da Companhia (Feitora Brunna, portão sul de Askavik) com preço e estoque que dependem das caravanas.
> - **As três sagas 30–40** (`sagas.ts`): Paladino pa1–pa10 (Cassius, Austrvik), Vampiro va1–va10 (Lady Mirela, Corvoscuro, só à noite), Tecnocrata te1–te10 (Ylva, Askavik). Os nomes de algumas missões mudaram na implantação: v7 virou "Banquete em Corvoscuro" (o Conde recebe na vila; a Cripta do Conde é 55–60).
> - Novos NPCs: Feitora Brunna, Lady Mirela, Mestre Orvald (Porto Caldeira), Irmão Tobias (Austrvik).
> - Correção do mundo: as estradas que saem dos portões de Askavik (para Lundr, Kaldrfoss e Hrafnhöfn) nunca eram traçadas; agora são.
Mantém o que já está decidido: os mestres (Cassius, Vladislav III, Ylva), as facções (Fio × Desfiados × neutros), a Vidente no 30, a regra 0 (capricho surreal) e a regra 10 (o motivo pesa).

---

## 1. O que muda para todas as classes: missão com diálogo

Hoje a missão tem um texto só. Passa a ter **conversa**:

| Momento | O que acontece |
|---|---|
| **Ao pegar** | 2 a 5 falas do NPC (com nome e retrato), o jogador responde em 1 a 3 opções curtas (algumas só de sabor, outras mudam karma ou recompensa). Só depois aparece o objetivo. |
| **No caminho** | NPCs do lugar comentam ("Você é quem a Ylva mandou?"); itens de missão têm texto ao serem pegos. |
| **Ao entregar** | O NPC reage ao que você fez **e a como fez** (poupou, matou, mentiu). 2 a 4 falas, e a próxima missão já nasce dessa conversa. |
| **Ecos** | Outros NPCs passam a falar do que você fez ("Dizem que você deixou o desertor ir…"). O karma e as escolhas ficam gravados e reaparecem. |

Formato no código (para escrever rápido e com qualidade):
`fala: [['Ylva', 'Você chegou na hora…'], ['você', '…'], …]`, `entrega: [...]`, `ecos: { npc: 'frase' }`.
**Regra:** nenhuma missão amarela sem diálogo de entrada e de entrega. As azuis importantes também.

### Respostas que abrem caminhos (Erling, 24/10)
As respostas nas conversas **mudam quais missões aparecem**. Quem responde com crueldade, cobiça ou mentira passa a receber propostas sombrias; quem responde com compaixão e honra recebe as luminosas.
- **Inclinação da alma:** cada resposta soma num par de medidores escondidos, **Luz** e **Sombra** (além do karma). O karma mede o que você *fez*; a inclinação mede *quem você está se tornando* pelas palavras.
- **Quem oferece o quê:**
  - Sombra alta → aparecem **os que pedem coisas sujas**: o agiota de Askavik, o contrabandista da Companhia, o bruxo que compra ossos, a cigana que vende venenos, o Desfiado que recruta.
  - Luz alta → aparecem **os que pedem socorro**: a viúva, o órfão, o peregrino, o paladino ferido, o padre que precisa de escolta.
  - No meio → o mundo oferece dos dois, e você escolhe.
- **A mesma situação, dois caminhos:** uma caravana caída pode virar "salve os sobreviventes" (luz) ou "o carregamento está sem dono, ninguém vai saber" (sombra). O diálogo de entrada já mostra qual porta está aberta para você.
- **As missões sombrias pagam diferente, não mais:** mais ouro rápido e itens de pacto; as luminosas dão título, reputação e aliados que aparecem para ajudar depois. Os dois lados têm graça; nenhum é o "certo para ganhar".
- **O mundo lembra:** NPCs de luz desconfiam de quem tem sombra alta (preço mais caro, falas frias, alguns recusam missão); NPCs de sombra fazem o mesmo com os luminosos. Guardas notam quem anda com sombra alta.
- **Dá para voltar:** missões de penitência (luz) e de queda (sombra) movem a inclinação de volta. A alma não é uma corrente — mas cada virada custa.
- **Liga com a Vidente e as classes:** inclinação pesa na leitura da Vidente (sombra puxa vampiro e bruxo; luz puxa paladino e caçador) e destrava missões secretas dentro de cada saga (um paladino com sombra alta recebe a proposta de trair a Ordem; um vampiro com luz alta recebe a da amizade proibida).

### Encarnar o personagem (Erling, 24/10)
O valor do jogo está em o jogador **sentir** quem é: o drama de ser lobisomem com um vampiro na mesma praça; a raiva de um paladino puro diante de um paladino negro. O jogo precisa empurrar para o roleplay sem obrigar ninguém a escrever.
- **Instinto (o corpo sente antes da cabeça):** cada classe percebe as outras pelo que é.
  - Lobisomem **fareja** vampiro a até ~30 m: a borda da tela pulsa em vermelho, o herói rosna sozinho, o pelo da nuca arrepia (efeito), e o vampiro aparece com um rastro de cheiro.
  - Vampiro **sente a luz** do paladino: perto dele, a tela perde cor e o vampiro fica desconfortável (pequeno debuff de regeneração); sente o pulso dos vivos (batimento no som quando está com sede).
  - Paladino **vê a corrupção**: quem tem Sombra alta aparece com uma névoa escura aos pés; um **paladino negro** (paladino com Sombra alta) aparece para o paladino puro com o brasão rachado e uma aura negra e dourada, e o herói puro solta uma fala de desprezo.
  - Caçador de demônios **ouve** pactos (bruxos); o bruxo sente quem tem fé. O tecnocrata **mede** tudo: vê números (energia, temperatura, batimento) onde os outros veem magia.
- **O herói fala sozinho:** frases curtas no balão, conforme classe e inclinação, ao ver um inimigo natural, ao entrar numa igreja, ao passar por um cemitério ("Esta terra não está em paz." / "Cheiro de prata… caçadores andaram por aqui.").
- **Juramentos de roleplay (opcionais):** ao entrar na classe, o jogador pode fazer pequenos votos que o jogo vigia. Paladino: "Nunca fugirei de um morto-vivo." Vampiro da Corte: "Nunca beberei de quem não consentir." Lobisomem: "Nunca deixarei um da matilha para trás." Manter o voto dá uma bênção pequena e um título; quebrar tira a bênção, mancha o nome e vira assunto dos NPCs. É a regra 10 aplicada ao jogador.
- **O nome diz quem você é:** o título, o brasão da facção e a aura da inclinação ficam visíveis sobre a cabeça. Para quem é inimigo natural, o nome aparece em outra cor (vermelho-sangue para o lobisomem ver o vampiro, por exemplo).
- **Cidades como palco:** dentro das vilas ninguém se fere (regra 15), mas os instintos continuam ligados. Vampiro e lobisomem podem dividir a praça, se encarando, sem poder lutar. Isso é drama, não combate.
- **Diálogos em personagem:** as respostas das conversas têm a voz da classe (o paladino responde como paladino, o vampiro como vampiro). Uma resposta "fora do personagem" continua possível, mas pesa na inclinação.
- **Recompensa por viver o papel:** inscrições de Marghar (conquistas) para quem mantém os votos por muito tempo, fala com o mestre em dia, defende o próprio lado nas cidades. O jogo premia quem encarna, sem punir quem só quer jogar.

---

## 2. O mundo que liga as classes

### A Companhia das Caravanas de Latão (tecnocratas, neutros)
- A Academia de Ylva financia a pesquisa **vendendo**: engrenagens, lanternas de éter, órgãos mecânicos para a Catedral, relógios de sangue para o Conde. Quem vende é a **Companhia das Caravanas de Latão**, com sede em Porto Caldeira e balcão em Askavik.
- **Caravanas de verdade andam pelo mapa**: carroças a vapor com escolta de NPCs, em rotas fixas (Askavik ⇄ Porto Caldeira ⇄ Vaporeira; Askavik ⇄ Brasaforja; Askavik ⇄ Abadia da Aurora; e uma rota noturna até Corvoscuro).
- Elas podem ser **atacadas** (bandidos, lobos, diabretes, Desfiados). O jogador vê no mapa um ícone de caravana em perigo e pode ir salvar.
- **Missões de caravana (para qualquer classe):** escoltar do ponto A ao B (a caravana anda, você protege); resgatar uma caravana caída e recuperar a carga; descobrir quem vendeu a rota aos bandidos.
- **Comércio real:** a carga chega e muda as lojas do destino (preço e estoque). Uma caravana perdida deixa a loja sem aquele item por um tempo. É a base de uma economia viva.

### A rede de favores
- O **Conde Vladislav** compra tecnologia da Academia (relógios de sangue, vitrais que filtram o sol). A **Igreja** também compra (órgão a vapor, sinos mecânicos, vitrais novos da Catedral). Os **paladinos** odeiam que a Academia venda para o Conde.
- O tecnocrata vive no meio: atende os dois lados e precisa escolher o que entrega, a quem, e o que conta.
- Paladino e vampiro se caçam, mas os dois **precisam** da Companhia. Isso gera missões cruzadas: o paladino é mandado para interceptar uma encomenda; o vampiro é mandado para garantir que ela chegue.

---

## 3. Paladino — "A Luz que Guarda" (Ordem de Auréon · Ordem do Fio)
Mestre: **Grão-Mestre Cassius**, na Abadia da Aurora. Guia na estrada: **Paladino Aldric**.
Tom: fé que custa caro. A luz que salva é a mesma que cega.

| # | Nv | Missão | O que se faz | Escolha (karma) |
|---|---|---|---|---|
| p1 | 30 | **O Voto da Aurora** | vigília na capela até o amanhecer; ondas de mortos-vivos tentam apagar as velas | jurar proteger "os que pedem" (+6) · "os que merecem" (+2) · "a Ordem acima de tudo" (−2) |
| p2 | 31 | **Sinos que Não Tocam** | os sinos mecânicos da Abadia (feitos pela Academia) pararam; levar a peça ao balcão da Companhia em Askavik | — (abre a ligação com o tecnocrata) |
| p3 | 32 | **A Caravana Que Cheirava a Sangue** | interceptar uma caravana de Latão rumo a Corvoscuro; dentro, encomendas para o Conde | destruir a carga (+2, a Companhia fica hostil por um tempo) · deixar seguir e avisar Cassius (+4) · confiscar e vender (−5) |
| p4 | 33 | **O Ninho do Cemitério** | Catacumbas de Askavik: o Coveiro Real abre nichos para vender ossos de jarls a um bruxo | — |
| p5 | 34 | **A Penitente** | uma mulher mordida pede ajuda antes de virar; a Ordem manda "purificar" | purificar (0) · levar à Abadia para a cura arriscada (+8, pode dar errado) · deixar fugir (−2, ela vira um eco que volta) |
| p6 | 35 | **A Catedral Precisa de Luz** | escoltar a caravana que leva o órgão a vapor e os vitrais novos para a Catedral de Askavik | — (encontro com o tecnocrata que vai instalar) |
| p7 | 36 | **O Bastião de Prata** | aliança com o Clã Helsing (caçadores): caçada conjunta aos lobisomens da estrada | — |
| p8 | 37 | **Diabos na Fornalha** | Coração da Montanha (raide): os diabretes vêm de uma fenda aberta por mineração demais | — |
| p9 | 38 | **A Carta do Conde** | o Conde Vladislav propõe trégua: "parem de caçar meus filhos, eu paro de caçar os seus" | aceitar a trégua (+3, Cassius discorda) · recusar (+1) · fingir aceitar e trair (−8, traição) |
| p10 | 40 | **O Escudo de Auréon** | defender a Abadia de um ataque dos Desfiados liderado por um Primogênito | título **Escudo da Aurora** |

---

## 4. Vampiro — "A Sede Educada" (Corte de Vladislav · Desfiados)
Mestre: **Conde Vladislav III**, no castelo da Colina Vampírica.
Tom: elegância e fome. Quem bebe tem regras, e quebrar as regras é o pior pecado da Corte.
**Problema de rota a resolver:** a Colina Vampírica é região 50–60. Proposta: o vampiro de 30 não vai ao castelo; é **recebido por um emissário** (Lady Mirela) em **Corvoscuro à noite**, e só sobe ao castelo no 40, como prêmio.

| # | Nv | Missão | O que se faz | Escolha (karma) |
|---|---|---|---|---|
| v1 | 30 | **O Convite de Cera Vermelha** | carta selada leva a Corvoscuro à meia-noite; Lady Mirela oferece a mordida | aceitar por poder (−3) · por amor a alguém que já foi mordido (+2) · por vingança (−1) |
| v2 | 31 | **A Primeira Sede** | a sede chega; caçar sem matar (beber de bichos, de quem consente, de bandidos) | matar um inocente para saciar (−10) · aguentar (barra de sede cresce, +4) |
| v3 | 32 | **Encomenda de Latão** | buscar no balcão da Companhia o relógio de sangue do Conde e escoltar a caravana noturna | proteger até o fim (+1) · abrir a caixa e espiar (−1, descobre um segredo) |
| v4 | 33 | **O Sol Filtrado** | levar à Academia o pedido de vitrais que filtram o sol; Ylva quer em troca uma amostra de sangue vampírico | entregar sangue próprio (0) · roubar sangue de outro vampiro (−4) · negociar outra coisa (+2) |
| v5 | 34 | **Os Filhos Perdidos** | caçar vampiros "selvagens" que quebraram as regras da Corte e matam vilas | matar (+3) · trazer de volta à Corte (+5) |
| v6 | 35 | **O Paladino na Estrada** | Aldric intercepta a sua caravana | lutar (0) · conversar e deixar ir (+4, abre uma amizade proibida) · matar e beber (−8) |
| v7 | 36 | **Banquete na Cripta do Conde** | servir no banquete da Corte; um convidado é veneno | — |
| v8 | 37 | **Sangue de Hemara** | a noiva morta da Cripta de Hemara guarda um véu que cura a sede | — |
| v9 | 38 | **A Trégua** | levar a carta de trégua do Conde até Cassius (o lado espelho do p9) | — |
| v10 | 40 | **A Subida ao Castelo** | primeira subida ao castelo da Colina; Vladislav recebe o filho | título **Sangue da Corte** |

---

## 5. Tecnocrata — "O Preço do Progresso" (Academia · neutro verdadeiro)
Mestra: **Arquiteta Ylva**, Universidade dos Mil Mecanismos (Askavik); depois Porto Caldeira.
Tom: ciência no meio da crendice. Tudo tem preço, e o tecnocrata é quem cobra e quem paga.

| # | Nv | Missão | O que se faz | Escolha (karma) |
|---|---|---|---|---|
| t1 | 30 | **A Matrícula** | montar a primeira torreta na oficina e defender a Universidade de um teste de campo | — |
| t2 | 31 | **Latão e Estrada** | primeira escolta de caravana Askavik → Porto Caldeira | — |
| t3 | 32 | **O Órgão da Catedral** | instalar o órgão a vapor e os novos sinos na Catedral de Askavik; o Bispo desconfia | instalar um "ouvido" escondido para a Academia (−3) · fazer honesto (+3) |
| t4 | 33 | **Relógio de Sangue** | entregar ao Conde (via Lady Mirela, em Corvoscuro) o relógio de sangue | entregar (0) · sabotar o relógio a pedido dos paladinos (−2 com o Conde, +2 com a Ordem) |
| t5 | 34 | **Caravana Caída** | resgatar a caravana atacada no Passo de Midvangr; descobrir que foi traição interna | denunciar o traidor (+3) · chantagear (−4) |
| t6 | 35 | **O Neutro Verdadeiro** | missão de alinhamento (pendente da lore): Ylva manda recusar a encomenda dos dois lados por uma semana para provar que a Academia não tem dono | recusar os dois (+5) · atender só um (−2) |
| t7 | 36 | **Engrenagens nos Recifes** | Recifes da Graxa: recuperar peças de um navio a vapor afundado | — |
| t8 | 37 | **O Autômato do Bispo** | a Igreja quer um guardião mecânico para a Catedral; a Academia pede em troca acesso aos arquivos proibidos | — |
| t9 | 38 | **Sabotagem** | alguém está explodindo as caravanas: são os Desfiados ou a Ordem? | — |
| t10 | 40 | **A Grande Rota** | inaugurar a rota de caravanas Askavik ⇄ Porto Caldeira com escolta própria | título **Mestre de Rota**; destrava comércio próprio |

---

## 6. Adensar o mapa (mais o que fazer no mesmo espaço)
Sem aumentar o mapa agora, encher o caminho:
- **Pontos de evento** a cada ~40 casas de estrada: acampamento de bandidos, carroça tombada, altar de beira de estrada, ponte quebrada, poço envenenado, caçador ferido (missões azuis que nascem do lugar).
- **Caravanas** andando nas estradas (seção 2).
- **Masmorras pequenas** entre as grandes (1 andar, 10 minutos), uma por região e faixa de nível.
- **Elites com nome** e rotas próprias (aparecem no mapa quando avistados).
- **Colecionáveis de lore**: páginas do livro de Ormund Salveth espalhadas, que montam a Bíblia dentro do jogo.

## 7. A escala do jogo
- **Primeira parte:** até o **nível 120 da primeira classe** (qualquer uma). As sagas de 30–40 acima são o primeiro trecho; seguem 40–60, 60–80… no mesmo formato.
- **Segunda parte (depois):** **Classe II** de cada caminho, mapa 3× maior, **o centro de Karmika** (a grande cidade que ninguém acessa no começo), novas classes (druida, ladino), primeiras cidades grandes.

## 8. Ordem sugerida de construção
1. Sistema de diálogo (entrada, entrega, ecos) e reescrever as amarelas 1–30 com diálogo.
2. Caravanas andando + missões de escolta e resgate.
3. Saga do Paladino (30–40).
4. Saga do Tecnocrata (30–40) e a missão de alinhamento.
5. Saga do Vampiro (30–40) com Corvoscuro à noite.
6. Pontos de evento nas estradas.

---

## 9. Lobisomem — "A Lua que Chama" (Uivo Antigo · Desfiados) — implantada em 24/10
Mestra: **Ulfrun, a Mãe-Alfa**, na tribo do Uivo Antigo. Tom: matilha, fome e lealdade. O **Faro da Lua** (Instinto, tecla F) é o coração da saga.

| # | Nv | Missão | O que se faz | Escolha (karma) |
|---|---|---|---|---|
| la1 | 30 | **O Primeiro Uivo** | caçar 4 cervos e 4 javalis com a matilha | servir os filhotes primeiro (+4) · comer primeiro (−1) · deixar parte para a mata (+2) |
| la2 | 31 | **O Filhote Perdido** | farejar (Faro da Lua) o rastro do filhote Bran perto de Dalborg; afastar lobos selvagens | — |
| la3 | 32 | **Prata na Estrada** | conversar com a Mestra Ilsa no Bastião de Prata sobre as armadilhas | passar reto pelo caçador (+3) · assustar (−2) · matar (−8) |
| la4 | 33 | **O Cheiro do Conde** | farejar crias do Conde na mata perto do Covil; derrubar os morcegos-vigia | — |
| la5 | 34 | **A Fome** | o Covil dos selvagens que mataram a família do moleiro | matar (+2) · levar para a cura (+5) · deixar fugir (−4) |
| la6 | 35 | **O Caçador Ferido** | seguir o sangue (Faro da Lua) de um caçador Helsing caído na ravina | carregar até o Bastião (+6) · deixar água (+2) · a fome fala mais alto (−10) |
| la7 | 36 | **O Alfa de Selvar** | caçar na neve e convencer Ulfrik a unir as matilhas | — |
| la8 | 37 | **A Noite Sem Lua** | defender a Árvore-Mãe dos carniçais na lua nova | — |
| la9 | 38 | **Sangue Velho** | ouvir a proposta de Lady Mirela (caçar paladinos em troca de terra) | aconselhar recusa (+3) · aconselhar aceitar (−3) · mentir à alfa (−5) |
| la10 | 40 | **O Uivo Antigo** | a Lua de Sangue: deter 6 selvagens antes da Árvore-Mãe | título **Filho da Lua** |

Ecos: Ilsa, Ulfrik, Aldric e a própria Ulfrun lembram do que o lobo fez. Para o lobisomem, matar cervo não quebra o Voto do Sangue Limpo (caçar para comer é a lei da matilha).
