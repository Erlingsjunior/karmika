/* ---------- A CÓPIA NÃO MENTE — Capítulo I do Mago (níveis 20–31), 09/11. "O Capítulo Proibido".
   Depois da Vidente (v_mag). O Arquimago Aurelian Vesk manda; a Portadora Ísold Pena-Clara, maga copista do Pináculo, anda junto:
   copia à mão os livros proibidos "porque a cópia não mente, o original sim". Soberba doce; a mais engraçada do Fio, de um jeito que irrita.
   O pecado da classe é a soberba (o mago olha de cima e a magia racha). Arquelon, o Escriba Arcano, passa a eternidade corrigindo a primeira palavra.
   Pista do capítulo (sem resposta): a sexta runa — Vesk ensina que ela "fecha o círculo"; ninguém sabe o que fica do lado de dentro.
   Toda podridão é culpa de Zerath. Ninguém reconcilia ninguém. ---------- */
import type { QuestDef } from './quests';

export const VK = 'Arquimago Aurelian Vesk', IS = 'Ísold Pena-Clara', SE = 'Arquimaga Seline', UL = 'Ulfrun, a Mãe-Alfa', OR = 'Cronista Ormund Salveth', CO = 'Aprendiz Corin';
const CP = 'A Cópia Não Mente';

export const MAGE_I: QuestDef[] = [
  { id: 'mg1', chain: CP, name: 'O Círculo e o Fecho', lvl: 20, giver: VK, turnin: VK, req: 'v_mag', next: 'mg2', xp: 0, gold: 200, items: [['mana', 3]],
    text: 'O Arquimago Vesk ensina a primeira coisa que todo mago traça: o círculo de seis runas. Vá ao Pináculo de Marfim, ligue o Instinto (F) diante do círculo gravado no chão do saguão e diga ao Arquimago qual runa não tem nome.',
    objs: [{ kind: 'visit', poi: 'Pináculo de Marfim' }, { kind: 'sense', what: 'espirito', label: 'O círculo de seis runas no saguão do Pináculo', at: 'Pináculo de Marfim', dx: 1, dy: -2 }],
    talk: [
      'A Vidente mandou você. Ela sempre manda os que leem rápido demais. Sente-se. Aqui se lê devagar.',
      'Todo feitiço é um círculo. Cinco runas abrem: fogo, água, pedra, ar, vida. A sexta fecha. Sem ela, o feitiço vaza, e o que vaza de um feitiço nunca volta pelo mesmo caminho.',
      { r: [
        { t: 'Qual é o nome da sexta?', a: 'Não tem. Os livros mais velhos deixam o espaço em branco. Os mais novos também. É a única coisa em que os livros velhos e os novos concordam.' },
        { t: 'O que fica do lado de dentro, quando ela fecha?', a: 'Boa pergunta. Faça de novo daqui a vinte anos. Eu faço desde os doze.' },
        { t: 'Magia é só isso? Círculos?', a: 'Magia é paciência com fórmula. O resto é fogo bonito, e fogo bonito queima o mago primeiro.' } ] },
    ],
    done: [
      'Viu. A sexta não brilha como as outras. Ela fica escura e, se você olhar muito tempo, parece que está olhando de volta. Isso é normal. Não é normal. Os dois.',
      { r: [
        { t: 'Ela parece gasta. Por dentro.', a: 'Você reparou. Os tecnocratas dizem a mesma coisa das pedras de teleporte. Eu não gosto de concordar com tecnocrata, então vou fingir que não ouvi.' },
        { t: 'Por que ninguém deu nome a ela?', a: 'Porque nome é poder, e ninguém quis o poder de fechar. Abrir é mais divertido.' } ] },
      'Amanhã você conhece a Ísold. Ela vai rir de você. Ela ri de todo mundo. Deixe. O riso dela é a parte mais barata do que ela sabe.',
    ] },

  { id: 'mg2', chain: CP, name: 'A Sala Que Ninguém Lê', lvl: 21, giver: IS, turnin: IS, next: 'mg3', xp: 0, gold: 220,
    text: 'A Ísold Pena-Clara cuida da Sala dos Proibidos, no alto do Pináculo. As fadas da Floresta Encantada roubam páginas soltas pela janela e as espalham pela mata. Derrube oito delas e traga de volta o que levaram.',
    objs: [{ kind: 'kill', type: 'fairy', n: 8 }],
    talk: [
      'O novo! Que gracinha. O Arquimago disse que você lê rápido. Isso aqui é a Sala dos Proibidos: ninguém lê nada aqui. Eu copio. É diferente.',
      'Eu copio à mão os livros que a Torre não deixa ler. Porque a cópia não mente. O original, sim. O original foi escrito por alguém com pressa, ou com raiva, ou com dívida. A cópia foi escrita por mim, que só tenho sono.',
      { r: [
        { t: 'Se ninguém pode ler, para que copiar?', a: 'Para quando alguém puder. Os livros duram mais que as proibições. É a única aposta segura do Pináculo.' },
        { t: 'E as fadas?', a: 'Entram pela janela e levam as páginas. Acham bonito o papel. São fadas: acham bonito tudo o que não é delas. Igual a um caçador olhando um mago.' },
        { t: 'Você ri de todo mundo?', a: 'Só de quem merece. É muita gente, eu sei. Não é culpa minha.' } ] },
    ],
    done: [
      'Oito fadas e quatorze páginas. Uma delas é uma receita de pudim. Os proibidos também comem.',
      { r: [
        { t: 'Por que proibir uma receita de pudim?', a: 'Porque estava no mesmo livro que um feitiço de ressurreição. A Torre proíbe livros, não páginas. É mais fácil. Proibir é sempre mais fácil que ler.' },
        { t: 'Posso ler alguma?', a: 'Pode olhar. Ler é outra coisa. Você vai aprender a diferença quando uma delas olhar de volta.' } ] },
    ] },

  { id: 'mg3', chain: CP, name: 'A Sílaba Errada', lvl: 22, giver: IS, turnin: IS, next: 'mg4', xp: 0, gold: 240,
    text: 'Copiando um grimório antigo, a Ísold achou uma sílaba trocada no fim de uma palavra de poder. Um erro de escriba? Ou alguém mudou? Leve o grimório à estante de cópias no Pináculo, ligue o Instinto (F) e compare com a cópia mais velha.',
    objs: [{ kind: 'sense', what: 'dispositivo', label: 'A estante das cópias velhas, no alto do Pináculo', at: 'Pináculo de Marfim', dx: -2, dy: -3 }],
    talk: [
      'Olhe isto. Grimório de Vathros, terceira edição. Palavra de chama, última sílaba: “-ren”. Na minha cópia de quarenta anos atrás, é “-rem”. Uma letra.',
      'Uma letra, num feitiço de chama, é a diferença entre acender uma vela e acender o mago. Eu acendi uma vela. Sorte minha que eu desconfio de tudo.',
      { r: [
        { t: 'Erro de quem copiou?', a: 'Eu copio. Eu não erro. Isso é soberba, eu sei. A soberba é o pecado do mago. Mas eu tenho razão, o que torna a soberba muito mais confortável.' },
        { t: 'Alguém trocou de propósito?', a: 'Shhh. Isso não se diz alto no Pináculo. A gente diz: “a podridão chegou aos livros”. Os velhos culpam Zerath, o do Pântano: ele apodrece até tinta. É uma frase muito útil.' } ] },
    ],
    done: [
      'Na cópia velha é “-rem”. Na de vinte anos, também. Na de dez, “-ren”. Alguém, há dez anos, corrigiu um livro que não estava errado.',
      { r: [
        { t: 'Quem corrige os livros aqui?', a: 'A Torre. É a função dela. A Torre corrige os livros como Arquelon corrige a primeira palavra: para sempre. O problema é quando a correção está errada.' },
        { t: 'Isso é podridão?', a: 'É o que eu vou escrever no relatório. “Podridão.” Zerath leva a culpa. Ele tem as costas largas. Eu durmo melhor assim.' },
        { t: 'Vamos contar ao Arquimago?', a: 'Já contei. Ele disse: “Anote.” Os sábios dizem “anote” quando não querem saber. Eu anotei.' } ] },
    ] },

  { id: 'mg4', chain: CP, name: 'Cinzas da Bruxa', lvl: 23, giver: SE, turnin: SE, next: 'mg5', xp: 0, gold: 260,
    text: 'Os incensos do Pináculo precisam das Cinzas dos Mortos, e só os bruxos as fazem. A Arquimaga Seline manda você a Gorvath comprar duas da Bruxa Grisolda. Pague. Agradeça. Não corrija a gramática dela.',
    objs: [{ kind: 'collect', item: 'cinzas_mortos', n: 2 }],
    talk: [
      'Os incensos acabaram. Sem incenso, os aprendizes leem o que não devem e sonham o que não podem. Preciso de Cinzas dos Mortos. Só os bruxos fazem.',
      'Você vai ao Vale da Desgraça. Vai entrar na tenda de uma bruxa chamada Grisolda. Vai comprar duas. Vai pagar o preço que ela disser, que vai ser alto, porque ela vai ver o marfim na sua capa.',
      { r: [
        { t: 'Os magos dependem dos bruxos?', a: 'Dependem. Não espalhe. A Torre tem duas regras: “não leia o proibido” e “não conte que a gente compra do Vale”. A segunda é a mais seguida.' },
        { t: 'Por que eu?', a: 'Porque eu fui da última vez e ela me ofereceu um chá. Eu tomei. Fiquei três dias falando em rimas. A Ísold anotou tudo.' } ] },
    ],
    done: [
      'Duas. Inteiras. E você não está rimando. Ela foi gentil?',
      { r: [
        { t: 'Ela me chamou de “pena de marfim”.', a: 'Ela chama todo mago assim. É elogio, no Vale. Lá, quem escreve é suspeito; quem escreve bonito é suspeito duas vezes.' },
        { t: 'Ela disse que os magos compram da sombra e rezam contra ela.', a: 'Ela disse isso? Ela tem razão. Isso não sai desta sala.' } ] },
    ] },

  { id: 'mg5', chain: CP, name: 'O Aterramento', lvl: 24, giver: VK, turnin: VK, next: 'mg6', xp: 0, gold: 280,
    text: 'Magia forte demais sobe para a cabeça. O antídoto antigo é terra de toca: terra de onde dorme um bicho velho. A melhor é a do Uivo Antigo, e quem dá é a Mãe-Alfa Ulfrun. Vá à Selva Licantropa e peça. Peça. Mago não manda em lobo.',
    objs: [{ kind: 'visit', poi: 'Uivo Antigo' }, { kind: 'talk', npc: UL }],
    talk: [
      'A Ísold me contou que você leu uma página que olhou de volta. Não se preocupe: é normal. Se preocupe: a cabeça sobe. O mago que não aterra vira o feitiço que lança.',
      'Terra de toca. A mais velha é a do Uivo Antigo, onde a matilha dorme há mil anos. A Mãe-Alfa Ulfrun é dona dela.',
      { r: [
        { t: 'Um mago pedindo favor a um lobisomem?', a: 'Um mago pedindo favor à terra. O lobisomem é só quem segura a pá. Lembre disso quando ela rir de você.' },
        { t: 'E se ela recusar?', a: 'Ela não vai recusar. Ela vai cobrar. Lobo cobra em humilhação. Pague em humilhação: é a moeda mais barata que você tem.' } ] },
    ],
    meet: { [UL]: [
      { who: UL, t: 'Um mago. Na minha selva. Com cheiro de livro e de vela. Você veio pedir terra.' },
      { who: UL, t: 'Os magos vêm a cada vinte anos pedir terra de toca. Sempre com a mesma cara de quem desceu de uma torre. Ajoelhe. Pegue com a mão. Sem pá: a pá é para quem tem medo da terra.' },
      { me: '(Você se ajoelha e cava com as mãos. A matilha assiste. Alguém ri. Alguém uiva de rir.)' },
      { who: UL, t: 'Pronto. Agora você cheira a lobo. Os seus amigos de marfim vão torcer o nariz. Isso é o aterramento: descobrir que você também tem nariz.' },
    ] },
    done: [
      'Você cheira a toca. Ótimo. Espalhe um punhado no seu círculo de estudo e a cabeça fica onde deve: no pescoço.',
      { r: [
        { t: 'Ela me fez cavar com as mãos.', a: 'Ela fez o mesmo comigo, há quarenta anos. Eu reclamei. Ela me fez cavar mais. É a magia mais antiga que existe: a de calar a boca.' },
        { t: 'Os lobos riram.', a: 'Riram. E você não lançou nada neles. Esse é o teste de verdade. A terra era desculpa.' } ] },
    ] },

  { id: 'mg6', chain: CP, name: 'A Soberba', lvl: 26, giver: VK, turnin: VK, next: 'mg7', xp: 0, gold: 300, gear: 1,
    text: 'Os diabretes da Floresta Encantada farejam a soberba e atacam quem anda com o nariz para cima. O Arquimago quer que você os enfrente sem pressa: oito diabretes, e depois responda uma pergunta.',
    objs: [{ kind: 'kill', type: 'imp', n: 8 }],
    talk: [
      'A magia racha quando o mago olha de cima. Não é metáfora. O círculo é desenhado no chão; quem olha o chão de muito alto não vê onde a linha quebra.',
      'Os diabretes da mata adoram mago soberbo. Pulam no pescoço de quem acha que já sabe. Oito. Volte e eu pergunto uma coisa.',
      { r: [
        { t: 'Eu não sou soberbo.', a: 'Disse a primeira frase de todo mago soberbo. Vá.' },
        { t: 'O senhor é soberbo?', a: 'Sou. Por isso dou aula. É o único lugar onde a soberba ajuda alguém.' } ] },
    ],
    choice: { q: 'Na volta, um aprendiz da Torre tropeça e derruba os seus livros na lama. Ele pede desculpas, vermelho. Você…', opts: [
      { label: 'Ajuda a juntar os livros e limpa o dele primeiro.', karma: 4, flag: 'mag_humilde', say: 'O aprendiz contou à Ísold. A Ísold riu, depois parou de rir. “Que coisa feia, ser gentil. Vou ter que copiar isso.”', why: 'Você se abaixou para o chão. É lá que o círculo é desenhado.' },
      { label: 'Junta os seus e segue, sem dizer nada.', karma: 0, flag: 'mag_calado', say: 'Nada aconteceu. É o que acontece quando ninguém olha para baixo.', why: 'Nem soberbo nem gentil. O mundo esqueceu em uma hora.' },
      { label: 'Corrige a postura dele e manda copiar os livros sujos à mão.', karma: -3, flag: 'mag_soberbo', say: 'O aprendiz copiou tudo, chorando. O Arquimago viu. Não disse nada. Seu próximo círculo rachou na sexta runa.', why: 'Você olhou de cima. A magia ouviu.' } ] },
    done: [
      'Oito diabretes. Agora a pergunta: qual deles você subestimou?',
      { r: [
        { t: 'O primeiro.', a: 'Todos subestimam o primeiro. É por isso que o primeiro sempre morde mais forte.' },
        { t: 'Nenhum.', a: 'Então você subestimou a pergunta. Bem-vindo à Torre.' } ] },
    ] },

  { id: 'mg7', chain: CP, name: 'O Aprendiz Que Chegou Longe Demais', lvl: 27, giver: IS, turnin: IS, next: 'mg8', xp: 0, gold: 320,
    text: 'O Aprendiz Corin leu uma página da Sala dos Proibidos e abriu um círculo sem a sexta runa no meio da Floresta Encantada. O que vazou está andando pela mata. Feche o vazamento: derrube os entes que acordaram e encontre o garoto.',
    objs: [{ kind: 'kill', type: 'treant', n: 5 }, { kind: 'talk', npc: CO }],
    talk: [
      'Lembra das páginas que as fadas roubaram? Uma não voltou. O Corin achou. O Corin tem quinze anos, uma vela e nenhum juízo.',
      'Ele traçou um círculo de cinco runas. Sem a sexta. Abriu e não fechou. As árvores da mata estão andando. Não de um jeito bonito.',
      { r: [
        { t: 'O que acontece com ele?', a: 'Depende de você. A Torre manda entregar para o Conselho. O Conselho expulsa. Expulsos do Pináculo vão para o Vale. Lá, o Malgrath recebe todos de braços abertos. Os braços dele são longos.' },
        { t: 'É culpa sua. A página estava na sua sala.', a: 'É. Eu sei. Eu ri disso por um minuto inteiro antes de chorar. Agora vá.' } ] },
    ],
    meet: { [CO]: [
      { who: CO, t: 'Eu só queria ver o que a sexta fazia! Se eu não pusesse a sexta, eu ia ver o que ela segura! E vi. Eu vi. Eu não quero dizer o que eu vi.' },
      { who: CO, t: 'Não me entregue ao Conselho. Por favor. Eles mandam a gente para o Vale. Eu não quero ser bruxo. Eu quero copiar livros, como a Ísold.' },
    ] },
    choice: { q: 'O Corin espera, encolhido entre as raízes. Você…', opts: [
      { label: 'Leva o Corin à Ísold e não conta ao Conselho.', karma: 3, flag: 'mag_corin_isold', say: 'A Ísold fez o garoto copiar o mesmo livro dez vezes. “Dez cópias. Até a mão aprender o que a cabeça não aprendeu.” Ele agradeceu chorando.', why: 'Você escolheu a lição em vez do castigo. A Torre não saberia distinguir.' },
      { label: 'Entrega o Corin ao Conselho, como manda a regra.', karma: 0, flag: 'mag_corin_conselho', say: 'O Conselho expulsou o Corin. Duas semanas depois, um viajante viu um garoto magro descendo para o Vale da Desgraça.', why: 'A regra foi cumprida. A regra não pergunta para onde vão os expulsos.' },
      { label: 'Pergunta o que ele viu dentro do círculo, em troca do silêncio.', karma: -3, flag: 'mag_corin_preco', say: 'O Corin contou. Você não entendeu metade. A outra metade você não consegue esquecer. Ele nunca mais falou com você.', why: 'Você cobrou de uma criança assustada o que ela tinha de pior para dar.' } ] },
    done: [
      'O vazamento fechou. As árvores voltaram a ser só árvores, com o mau humor normal das árvores.',
      { r: [
        { t: 'O que ele viu?', a: 'Não sei. Não perguntei. Se ele quiser contar, vai contar para o papel. Os livros aguentam o que a gente não aguenta.' },
        { t: 'Você vai trancar melhor a sala?', a: 'Vou trancar a janela. A sala nunca teve tranca. Tranca chama ladrão. Janela chama fada. Eu prefiro fada.' } ] },
    ] },

  { id: 'mg8', chain: CP, name: 'A Carta a Askavik', lvl: 28, giver: IS, turnin: OR, next: 'mg9', xp: 0, gold: 340,
    text: 'A Ísold quer comparar a sílaba errada com a cópia mais velha do mundo: a da Grande Biblioteca de Askavik. Leve a carta dela ao Cronista Ormund Salveth e espere a resposta. Ele demora. Ele sempre demora.',
    objs: [{ kind: 'visit', poi: 'Askavik' }, { kind: 'talk', npc: OR }],
    talk: [
      'Uma carta. Para o Cronista de Askavik. Ele tem a cópia mais velha do Grimório de Vathros, a que veio antes da Torre existir.',
      'Ele vai ler a carta, olhar para você, ler de novo e não dizer nada por um tempo. Não se assuste. É o jeito dele de rir.',
      { r: [
        { t: 'Você confia nele?', a: 'Eu confio em quem copia. Ele copia há mais tempo que eu. Isso é quase amor, no nosso ofício.' },
        { t: 'Ele vai contar à Torre?', a: 'Ele não conta nada a ninguém. É o homem mais calado do mundo, e escreve tudo. É assustador, se você pensar demais.' } ] },
    ],
    meet: { [OR]: [
      { who: OR, t: 'Uma carta da Pena-Clara. Ela escreve com tinta azul quando está preocupada.' },
      { who: OR, t: '(Ele lê. Lê de novo. Olha para você. Abre uma gaveta, tira um livro de capa gasta e procura a página sem precisar procurar.)' },
      { who: OR, t: '“-rem.” Na minha cópia é “-rem”. E na margem, em letra que não é minha, alguém traçou a sexta runa. Só ela. Ao lado da palavra.' },
      { who: OR, t: 'Diga à Pena-Clara que eu anotei. Diga também que a letra da margem é mais velha que a Biblioteca. Não diga mais nada. Eu não sei mais nada. Ainda.' },
    ] },
    done: [
      'Ele anotou. Claro que anotou. Ele anota tudo. Um dia alguém vai ler as anotações do Ormund e o mundo vai ter que pedir desculpas a muita gente.',
    ] },

  { id: 'mg9', chain: CP, name: 'O Arquivo de Cima', lvl: 30, giver: OR, turnin: IS, next: 'mg10', xp: 0, gold: 360,
    text: 'De volta ao Pináculo, a Ísold quer ver o arquivo de cima, onde a Torre guarda os livros já corrigidos. Ninguém entra lá sem o Conselho. Entre mesmo assim: ligue o Instinto (F) diante da porta do arquivo e leia o que a tinta nova esconde.',
    objs: [{ kind: 'visit', poi: 'Pináculo de Marfim' }, { kind: 'sense', what: 'espirito', label: 'A porta do arquivo de cima, no último andar', at: 'Pináculo de Marfim', dx: 2, dy: -4,
      spirit: { name: 'Um escriba antigo', lines: ['Você também veio corrigir? Não. Você veio ler. Faz tempo que ninguém vem ler.', 'Eu corrigi trezentas palavras. Me mandavam a lista. Eu nunca soube quem escrevia a lista. A letra era bonita.', 'Na última palavra eu parei. Não lembro por quê. Lembro de uma porta preta. Depois não lembro de mais nada.'] } }],
    talk: [
      'Diga à Pena-Clara que o arquivo de cima tem trezentas palavras corrigidas com a mesma tinta. A mesma tinta, em cem anos. Ninguém faz tinta durar cem anos. Diga isso a ela e deixe ela concluir. Eu não concluo. Eu anoto.',
    ],
    done: [
      'Uma lista. Alguém mandava uma lista. Com letra bonita. E um escriba que lembra de uma porta preta e mais nada.',
      { r: [
        { t: 'Quem escreve a lista?', a: 'Se eu soubesse, ria. Eu não estou rindo. Repare: é a primeira vez que você me vê sem rir. Aproveite. Não se repete.' },
        { t: 'Vamos contar ao Arquimago?', a: 'Vamos dizer que é podridão. Que Zerath chegou aos livros. Ele vai dizer “anote”. E vai dormir. Um de nós precisa dormir, e não vou ser eu.' },
        { t: 'Que porta preta?', a: 'Não sei. Anote. Viu? Já estou falando igual ao Ormund. É contagioso.' } ] },
    ] },

  { id: 'mg10', chain: CP, name: 'O Juramento de Arquelon', lvl: 31, giver: VK, turnin: VK, title: 'Cópia Que Não Mente', xp: 0, gold: 420, gear: 1, items: [['mana', 4]],
    text: 'O mago jura a Arquelon, o Escriba Arcano, copiando uma palavra de poder diante do círculo do Pináculo. Antes, a mata precisa estar quieta: derrube os sete entes que ainda andam desde o vazamento do Corin. Depois, copie a palavra com a Ísold olhando.',
    objs: [{ kind: 'kill', type: 'treant', n: 7 }, { kind: 'talk', npc: IS }],
    talk: [
      'Você leu devagar, cavou com as mãos, abaixou para o chão e voltou de Askavik com uma resposta pior que a pergunta. É o suficiente para jurar.',
      'O juramento de Arquelon não é uma frase. É uma cópia. Você copia uma palavra de poder, letra por letra, sem errar e sem corrigir. Arquelon passa a eternidade corrigindo a primeira palavra. O mago passa a vida tentando não precisar.',
      { r: [
        { t: 'Que palavra?', a: 'A Ísold escolhe. Ela sempre escolhe a mais difícil e diz que escolheu ao acaso. É mentira. É carinho.' },
        { t: 'E o arquivo de cima?', a: 'A Ísold me contou. Eu disse “anote”. Ela me olhou como se eu tivesse cem anos. Eu tenho sessenta e dois. Anote.' } ] },
    ],
    meet: { [IS]: [
      { who: IS, t: 'Sente. Pena, tinta, folha. A palavra é “vathrem”. Com M. Se você puser N, eu rio até o fim da sua vida.' },
      { me: '(Você copia, letra por letra. A sexta runa do círculo escurece por um instante, como se olhasse.)' },
      { who: IS, t: 'Com M. Perfeito. Odeio isso. Agora você é um de nós. Bem-vindo à única ordem do mundo que tem mais livros que segredos. Por pouco.' },
    ] },
    done: [
      'A Ísold disse que você não errou nenhuma letra. Ela nunca diz isso. Deve estar com febre.',
      'Arquelon aceita a sua cópia. Agora você é mago do Pináculo. Vai ter que escolher uma bandeira, como todos. Em Askavik já se fala no Fio e nos Desfiados. Os dois querem salvar Karmika. A Torre quer que você escolha o Fio. A Ísold quer que você escolha rindo.',
      { r: [
        { t: 'E a sexta runa?', a: 'Continua fechando. Continua sem nome. Continua olhando. Anote.' },
        { t: 'E a lista de letra bonita?', a: 'A Torre diz que é podridão. Eu digo que é podridão. Repare como eu digo isso olhando para a janela.' } ] },
    ] },
];

/** as pessoas novas do capítulo: a Ísold junto do Arquimago e o Corin (só enquanto mg7 está no diário) */
export const MAGE_I_NPCS = [
  { vila: 'Lumenhal', name: IS, role: 'Portadora do Pináculo · Copista', dx: 9.5, dy: 75, tint: 0x6a7ad8, lines: ['A cópia não mente. O original, sim.', 'Eu só rio de quem merece. É muita gente.', 'Proibir é sempre mais fácil que ler.'] },
  { vila: 'Lumenhal', name: CO, role: 'Aprendiz do Pináculo', dx: 14, dy: 40, tint: 0x8a8ab8, onlyQ: 'mg7,mj8,mk3', lines: ['Eu só queria ver o que a sexta fazia.', 'Não me entregue ao Conselho.'] },
];
