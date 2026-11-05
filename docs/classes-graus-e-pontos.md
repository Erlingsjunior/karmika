# Classes em graus, níveis e pontos (atualizado em 05/11)

Decisões do Erling de 04/11 e 05/11. A regra está em `regras-imutaveis-21-esqueleto.md` (regra 22). A conta dos pontos está em `balanca-de-pontos-04-11.md`.

## Níveis
- **Nível base:** vai até **120** e dá pontos de atributo (Força, Vitalidade, Destreza, Energia).
- **Nível de classe:** cada grau vai até **120**.
  - **Hoje:** a raça (o Humano vai até 60) mais a **Classe I** até o 120, ou seja, **180 níveis de classe somados**.
  - **Classe II:** chega com o tempo, **antes da expansão**. Tem uma árvore própria, com magias melhores.
  - **Classe III (elite):** só na **expansão**, até ~350 níveis de classe somados. É nela que as magias mais poderosas aparecem ("o bicho pega forte").
  - **Força das magias por grau:** Classe I mais tranquila, Classe II melhor, Classe III a mais forte.
- **Ritmo:** a classe sobe ~2,92 vezes mais rápido que o nível base. Cada nível de classe custa o XP de um nível base dividido por 2,92.

## Pontos: um monte só
- **3 pontos por nível de classe** (mais 3 no começo), somando todas as classes da vida.
- Os mesmos pontos servem para as três abas:
  - **Habilidades:** vêm da raça, da classe e do grau.
  - **Passivas:** vêm só da raça de nascimento.
  - **Talentos:** uma árvore só para todos.
- **Para trocar a distribuição:** é preciso um Pergaminho do Esquecimento, um para cada aba (habilidades, passivas ou talentos). Quem faz são os alquimistas Mago e Bruxo.
- **O monte nunca basta:** no teto de hoje (180) são 543 pontos, contra ~1.050 para ter tudo. Escolher um caminho é largar outro.

## Árvore de talentos (geral)
- **Desenho:**
  - o **Olho Kármico** no centro, com os dois K de costas um para o outro;
  - três braços: **Ataque, Defesa e Cura**;
  - o anel dos atributos ligando um braço ao outro.
- **Tamanho:** 10 anéis, 277 pontos e 15 encaixes de runa.
- **Arcos de nível:** cada anel abre num **nível de classe**:

  | Anel | Abre no nível |
  |---|---|
  | 1–2 | 1 |
  | 3 | 10 |
  | 4 | 20 |
  | 5 | 35 |
  | 6 | 50 |
  | 7 | 70 |
  | 8 | 95 |
  | 9 | 125 |
  | 10 | 140 |
  | Pedra-chave | 160 |

  Do 5º anel para fora, também pede pontos já gastos naquele braço (8, 20, 35, 45 e 50).
- **Pontos fora das regras:** um ponto aceso num anel que ainda não abriu volta sozinho para o monte.

## Profissão da classe: +10 níveis
Cada classe ganha **+10 níveis** na sua profissão-mestre. Essa profissão abre receitas antes e dá mais chance de peça rara.

| Classe | Profissão-mestre |
|---|---|
| Anão, Guerreiro do Norte, Paladino de Auréon | Ferreiro |
| Vampiro | Cozinheiro |
| Lobisomem | Costureiro |
| Mago, Bruxo, Caçador de Demônios | Alquimista |
| **Tecnocrata** | **Engenheiro do Mundo** (a fazer, ver `programacao-05-11.md`) |
| Humano, Elfo (raças puras) | nenhuma: mantêm todos os ofícios |

## Desafio do endgame
- O Erling quer que **cada nível de diferença do monstro seja sentido**.
- Ainda faltam no mundo **monstros de nível 120 a 150**.
- O próximo passo é **simular personagens de nível alto** de cada classe e calibrar monstros, elites e masmorras por essa simulação. Está em `programacao-05-11.md`, item 3.
