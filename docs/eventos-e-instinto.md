# Eventos vivos e Instinto de classe

Pedidos do Erling em 24/10/2026: "eventos vivos no mapa, regionais e globais" e "o instinto não pode acontecer o tempo todo: uma passiva de classe que liga e desliga, e missões, eventos e tesouros que só aparecem com ela ligada".

---

## 1. Eventos vivos (`client/src/eventos.ts`)

**Como nascem**
- O relógio de verdade divide o tempo em janelas de 20 minutos. Cada evento vive 15 minutos, e entre uma janela e outra há 5 minutos de calma.
- Em cada janela, cada região do mapa tem cerca de 60% de chance de ganhar um acontecimento. Durante um evento global, a chance sobe para 85%.
- O tipo do evento e o lugar onde ele acontece são sorteados pelo relógio. Por isso todo mundo vê o mesmo evento, no mesmo lugar, na mesma hora.
- Alguns eventos só acontecem à noite (patrulha, ritual). Outros só de dia (festa, casamento).

**Como o jogador entra**
- Quem está a menos de cerca de 380 m de um evento vê o símbolo no mapa e no minimapa, com um anel pulsando em volta.
- No lugar do evento há sempre um arauto (com um "!" sobre a cabeça) que conta a história. A conversa termina com a escolha de lado:
  - **Lado A:** em geral o lado da Luz.
  - **Lado B:** em geral o lado da Sombra. Só aparece para quem tem a alma pendendo para a Sombra ou um caminho que combina (lobisomem, bruxo, vampiro).
  - **Ficar de fora.**
- Quem aceita passa a jogar o evento:
  - os do outro lado viram inimigos;
  - os do seu lado viram aliados, que não apanham de você;
  - um painel à direita mostra os objetivos, as barras de progresso e o tempo que falta.
- Quem não aceita só vê o movimento: os dois lados brigam entre si e ninguém ataca você.

**Como termina**
- O evento acaba quando os objetivos do seu lado se cumprem ou quando os 15 minutos passam.
- No fim chega a **Resposta Kármica**: o que aconteceu, o seu lado, os objetivos, o karma ganho ou perdido, o XP e o ouro.
- A vitória dá o karma inteiro do lado escolhido. Sem vitória, o karma é proporcional à sua participação.
- O lado vencido se dispersa e há um final de festa (fogos, pétalas, luz ou sombra).

**Os regionais**

| Evento | Onde e quando | Lado A (Luz) | Lado B (Sombra) |
|---|---|---|---|
| Patrulha sob a Lua Cheia | estradas, à noite | defender a patrulha dos lobisomens (+6) | correr com a matilha, só lobisomem ou alma sombria (−7) |
| O Círculo de Invocação | vilas, à noite | derrubar os 3 pilares e os bruxos antes de a invocação fechar (+8) | proteger a invocação, só alma sombria, bruxo ou vampiro (−9) |
| A Romaria da Aurora | vilas | escoltar a procissão que purifica a vila (+7) | atacar a romaria (−8) |
| Caçadores Malditos | matas | caçar os caçadores e desarmar as armadilhas escondidas, que **exigem o Instinto ligado** (+6) | caçar os cervos com eles (−6) |
| Preparativos da Festa | vilas, de dia | levar madeira e pedra, pendurar lanternas; só o **tecnocrata** monta a máquina de música e os fogos da Academia (+4) | roubar o barril de hidromel (−3) |
| O Casamento Sem Padre | vilas, de dia | resgatar o padre dos salteadores; **paladino, mago ou elfo** podem celebrar o casamento eles mesmos (+5) | roubar a mesa de presentes (−5) |
| Vila Sitiada | vilas | defender a vila das ondas de mortos e lobos (+6) | saquear as casas no meio da confusão (−7) |

**Os globais**
- **Lua de Sangue:** na noite de lua cheia, um dia de jogo a cada 8. As patrulhas atacadas aparecem em todas as estradas.
- **Dia da Aurora:** dia santo de Auréon, também um dia a cada 8, alternando com a Lua de Sangue. As romarias atravessam as vilas.
- Quando há um global, aparece uma faixa no alto da tela.

**Gente nova para os eventos**
- Os eventos trouxeram tipos novos de inimigo, todos usando o mesmo boneco dos NPCs, com arma e escudo:
  - soldado;
  - bruxo do círculo;
  - paladino negro;
  - templário;
  - caçador maldito;
  - cria do Conde;
  - peregrina élfica.
- Esses bonecos lutam entre si: cada um tem um adversário no outro lado.

**Ainda falta**
- Sincronizar o progresso do evento entre jogadores na mesma sala. Hoje cada um vê o mesmo evento, mas a luta é simulada na máquina de cada um.

---

## 2. Instinto de classe (`instinto.ts`, `segredos.ts`)

**A passiva**
- Liga e desliga com a tecla **F**, pelo botão debaixo do minimapa ou no menu de magias (K), num cartão no topo da árvore.
- Ligada, aparece uma aura (anel e centelhas na cor do caminho) que só você vê no seu herói.

| Quem | Nome |
|---|---|
| Humano sem classe | Instinto de Sobrevivência |
| Anão | Sentido da Pedra |
| Elfo | Elo da Floresta |
| Guerreiro | Faro de Batalha |
| Paladino | Vigília da Fé |
| Caçador de Demônios | Olho do Caçador |
| Tecnocrata | Lógica do Mundo |
| Vampiro | Sede de Sangue |
| Lobisomem | Faro da Lua |
| Mago | Visão Arcana |
| Bruxo | Sussurro do Pacto |

**Desligado**
- O corpo só acorda diante de uma ameaça de verdade:
  - um jogador 15 ou mais níveis acima chegando perto;
  - 3 ou mais jogadores do mesmo caminho se aproximando;
  - uma horda dos seus inimigos naturais.
- Cada tipo de ameaça dispara **no máximo uma vez por hora**.
- O alarme é curto: a borda da tela pisca e quem disparou o alarme fica marcado por alguns segundos.

**Ligado**
- Você vê as auras dos seus inimigos naturais e a borda da tela pulsa quando eles estão perto.
- O herói fala sozinho com calma: no máximo uma fala a cada 3 minutos e uma vez por alvo a cada 10 minutos.
- Você vê o que ninguém mais vê:
  - rastros de missão: pegadas, gotas de sangue, cheiro, sinal de máquina;
  - espíritos;
  - dispositivos perdidos;
  - os **esconderijos**: 36 tesouros espalhados pelo mundo, cada um com a sua história. Dão ouro, XP e às vezes uma peça rara.

**Missões que exigem o Instinto (objetivo `sense`)**
- Humano, nível 12: *O Sequestro de Skógar*, com Marta, a Moleira. Seguir as pegadas da Nina e dos puglins.
- Elfo, nível 6: *As Vozes da Mata*, com a Anciã Faelwen, em Lithendel. Achar o espírito da nascente e ouvi-lo.
- Anão, nível 6: *O Eco nas Galerias*, com o Mestre-Mineiro Dvalin, em Brasaforja. Seguir o eco das batidas de um mineiro soterrado.
- Guerreiro, w03 *O Desertor*: ler as pegadas de Halfdan na neve de Fjallbrún.
- Paladino, pa5 *A Penitente*: seguir as gotas de sangue de Edda até a Igreja Abandonada.
- Vampiro, va5 *Os Filhos Perdidos*: farejar o sangue dos selvagens perto da Catedral Abandonada.
- Tecnocrata, te7 *Engrenagens nos Recifes*: achar a válvula-mestra enterrada na praia de Porto Caldeira.
- Evento *Caçadores Malditos*: desarmar as armadilhas escondidas.

**Próximas ideias**
- Rastrear um lobisomem na mata (saga do lobisomem).
- Dungeons com salas secretas que só abrem com o instinto ligado.
- Espíritos que contam a Bíblia de Karmika aos poucos.
