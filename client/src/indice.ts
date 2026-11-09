/* ---------- O ÍNDICE — Capítulo II do Tecnocrata (níveis 31–42), 09/11. Depois de "O Preço do Progresso" (te1–te10, Ylva).
   O Doutor Anselm Rotha, da Irmandade do Vapor, chega a Porto Caldeira com um índice de latão que marca "quanto falta" e nunca diz para quê.
   Ele entrega ao tecnocrata o equipamento da Academia (o ajudante que voa, o escudo de favos, a sentinela, o bracelete) e cobra de cada
   peça um relatório que ninguém lê. Acha as duas bandeiras duas superstições caras; a Companhia, uma só verdade: quem não vende, não acende.
   Enterra uma lenda por dia e desenterra uma por semana, sem contar a ninguém. Pista do capítulo (sem resposta): a porta de pedra preta.
   Regra de ouro 5: o solene com alguém reclamando ao lado (a Feitora Brunna). ---------- */
import type { QuestDef } from './quests';

export const AN = 'Doutor Anselm Rotha', YL = 'Arquiteta Ylva', BR = 'Feitora Brunna';
const IC = 'O Índice';

export const TECHNO_II: QuestDef[] = [
  { id: 'ti1', chain: IC, name: 'Quanto Falta', lvl: 32, giver: AN, turnin: AN, req: 'te10', next: 'ti2', xp: 0, gold: 260, items: [['drone_cura', 1]],
    text: 'O Doutor Anselm Rotha, da Irmandade do Vapor, quer medir a pedra de teleporte mais velha de Askavik antes de lhe entregar qualquer engenhoca. Vá até a pedra, na praça, ligue o Instinto (F) diante dela e anote o que vir. Depois volte à Academia.',
    objs: [{ kind: 'visit', poi: 'Askavik' }, { kind: 'sense', what: 'dispositivo', label: 'A pedra de teleporte mais velha, medida de perto', at: 'Askavik', dx: -3, dy: 6 }],
    talk: [
      'Você é a Mestra de Rota da Ylva. Ótimo. Eu sou Rotha. Doutor Rotha, se a Ylva estiver ouvindo; Anselm, se não estiver.',
      'Isto aqui é um índice. Latão, três ponteiros, nenhum número. Ele marca quanto falta. Não pergunte para quê: eu estou medindo há onze anos e ainda não sei. É por isso que continuo medindo.',
      'Antes de a Irmandade lhe entregar qualquer coisa que voe, você vai fazer o que todo tecnocrata faz primeiro e todo mago faz nunca: olhar. Vá à pedra de teleporte mais velha de Askavik, a da praça, ligue o seu Instinto e olhe a base dela.',
      { r: [
        { t: 'O que eu devo procurar?', a: 'Se eu dissesse, você acharia. É o problema de todo relatório que a Academia recebe: o aprendiz acha o que o mestre pediu. Olhe. Depois me diga.' },
        { t: 'Isso é trabalho de mago, não de tecnocrata.', a: 'Mago reza para a pedra. Nós medimos a pedra. Parece a mesma coisa, de longe. De perto, uma das duas funciona.' },
        { t: 'E a engenhoca que voa?', a: 'Está na caixa, atrás de mim. Ela não vai a lugar nenhum. Você vai.' } ] },
      'Uma última coisa. Se a Ylva perguntar o que você está fazendo, diga que está medindo. Ela não vai perguntar mais. Ninguém pergunta.',
    ],
    done: [
      'Então. A sexta runa, na base. Gasta. E gasta do jeito errado: não por fora, onde as mãos tocam. Por dentro, como a pedra de um poço que a água empurrou por séculos.',
      'Eu medi essa pedra onze vezes em onze anos. A runa está mais funda a cada medição. Os viajantes tocam a pedra pelo lado de fora. Anote isso. Não tire conclusão. Só anote.',
      { r: [
        { t: 'O que empurra uma runa por dentro?', a: 'Não sei. E repare: eu disse “não sei” sem culpar deus nenhum. É o que separa a Irmandade do resto de Karmika.' },
        { t: 'Isso devia preocupar alguém.', a: 'Devia. Eu mandei o relatório à Academia há nove anos. Ele está numa gaveta, debaixo de outros relatórios. É onde as preocupações da Academia dormem.' },
        { t: 'Vamos à engenhoca.', a: 'Gosto de gente que anota e segue. Abra a caixa.' } ] },
      'Um Drone de Cura Automatizada. Paira no seu ombro, borrifa vapor medicinal, não fala. Dos três, a última qualidade é a que mais me custou. Chame-o de Primeiro Ajudante. Ele vai precisar de um relatório.',
    ] },

  { id: 'ti2', chain: IC, name: 'O Primeiro Ajudante', lvl: 33, giver: AN, turnin: AN, next: 'ti3', xp: 0, gold: 280, items: [['drone_cura', 1]],
    text: 'O drone precisa de prova de campo. Nos Recifes da Graxa, ao sul de Porto Caldeira, os autômatos abandonados da primeira Companhia ainda andam. Derrube oito com o drone no ombro e volte inteiro: o relatório é sobre você, não sobre eles.',
    objs: [{ kind: 'kill', type: 'automaton', n: 8 }],
    talk: [
      'Prova de campo. O drone cura 5% a cada seis segundos; num aprendiz ele dura um turno; num tecnocrata descuidado, menos. Eu quero saber qual dos dois você é.',
      'Nos Recifes da Graxa, ao sul, andam autômatos da primeira Companhia. Ninguém os desligou porque ninguém sabe onde fica o botão. Eles são de latão e têm quarenta anos: são, portanto, parentes do seu drone. Não sinta nada por isso.',
      { r: [
        { t: 'Por que a Companhia os abandonou?', a: 'Porque consertar custava mais do que fabricar. É a frase que mais matou gente em Porto Caldeira, depois de “eu acho que segura”.' },
        { t: 'O drone aguenta a prova?', a: 'O drone aguenta. A pergunta do relatório é se você aguenta ficar parado quando ele cura, em vez de correr e morrer com a vida cheia. Noventa por cento corre.' } ] },
      'Oito. Nem sete, nem nove. Quem traz nove está se exibindo, e exibição não cabe em relatório.',
    ],
    done: [
      'Oito, e você está de pé. O drone ficou no ombro o tempo todo? Não responda; eu li no ferro dele. Ficou.',
      'Relatório: aprovado. Vou pôr numa gaveta onde ninguém vai ler, porque é isso que se faz com relatórios aprovados. Os reprovados eu ponho na mesma gaveta. A diferença é o que eu sinto ao fechar.',
      { r: [
        { t: 'Esses autômatos eram gente da Companhia?', a: 'Eram ferramentas da Companhia. A Companhia chama tudo de ferramenta, inclusive a gente. É honesta nisso, ao menos.' },
        { t: 'Próxima engenhoca.', a: 'Próxima engenhoca. Mas essa a Ylva quer entregar pessoalmente, porque foi ela quem desenhou e ela não perde uma chance de dizer isso.' } ] },
    ] },

  { id: 'ti3', chain: IC, name: 'O Escudo de Favos', lvl: 35, giver: YL, turnin: AN, next: 'ti4', xp: 0, gold: 320, items: [['escudo_auto', 1]],
    text: 'A Arquiteta Ylva entrega o Escudo Automatizado: um disco de latão que gira à sua volta e, de tempos em tempos, arma uma barreira de favos que segura um golpe inteiro. Prove na Floresta Encantada, a oeste: as harpias golpeiam de cima, onde o escudo mais erra. Seis delas. Leve o relatório ao Doutor Rotha.',
    objs: [{ kind: 'kill', type: 'harpy', n: 6 }],
    talk: [
      'O Rotha mandou você. Ele mandou com a cara de quem aprovou um relatório. É a única cara que ele tem, então não significa nada.',
      'Isto é o Escudo Automatizado. Favos de energia, geometria minha, latão da Fábrica. A cada vinte e cinco segundos ele arma uma barreira que segura um golpe inteiro. Um. Não dois. Não me venha com dois.',
      { r: [
        { t: 'Por que favos?', a: 'Porque a abelha resolveu o problema antes de nós e não cobrou patente. Seis lados, nenhum desperdício. A natureza é uma engenheira que não pede desculpas. Eu também não.' },
        { t: 'O Rotha disse que a senhora desenhou.', a: 'O Rotha disse a verdade. Ele faz isso com uma frequência irritante.' },
        { t: 'Onde eu provo?', a: 'Floresta Encantada, a oeste. As harpias batem de cima, que é onde todo escudo erra. Se o meu não errar, você volta. Se errar, eu redesenho. Os dois resultados me servem.' } ] },
      'Seis harpias. E leve o relatório ao Rotha, não a mim. Eu desenho; ele mede. É a divisão de trabalho mais saudável de Porto Caldeira: nenhum de nós confia no outro.',
    ],
    done: [
      'Seis harpias, escudo inteiro, você inteiro. A Ylva vai ficar insuportável por uma semana. É o preço do progresso; ela mesma deu esse nome.',
      'Agora a parte que ninguém lhe conta na Academia: o escudo gira à sua volta porque os favos precisam de um centro. Você é o centro. Se você correr, o centro corre, e os favos chegam atrasados. Anote: tecnocrata parado é tecnocrata vivo.',
      { r: [
        { t: 'Quem mais usa esse escudo?', a: 'A Companhia vende para quem paga. A Abadia comprou dois. A Corte comprou três. Eu não entrego para nenhum dos dois; eu só meço o que volta. O que volta da Corte volta mais arranhado.', sombra: 1 },
        { t: 'E a próxima?', a: 'A próxima não é engenhoca. É gente. A Feitora Brunna tem um problema de estrada, e um problema de estrada é um problema da Irmandade.' } ] },
    ] },

  { id: 'ti4', chain: IC, name: 'O Pacto da Honestidade', lvl: 36, giver: BR, turnin: AN, next: 'ti5', xp: 0, gold: 360,
    text: 'A Companhia vende para as duas bandeiras e paga por isso com uma regra só: não vender informação, não superfaturar, não trair quem acompanha. Uma carroça para Vaporeira leva três caixas: duas para a Abadia, uma lacrada com cera vermelha. Escolte-a até o fim e decida o que faz com a terceira.',
    objs: [{ kind: 'escort', route: 'pc-vp', label: 'Porto Caldeira → Vaporeira (três caixas)' }],
    talk: [
      'Mestra de Rota. Finalmente alguém que não me pergunta quanto pesa a caixa. Pesa o que pesa.',
      'Três caixas para Vaporeira. Duas da Abadia da Aurora, peças de sino. A terceira veio da Corte de Corvoscuro, lacrada com cera vermelha, e paga três vezes o frete. Eu não abro caixa de cliente. Esse é o Pacto, e o Pacto é o que mantém esta rua sem sangue.',
      { r: [
        { t: 'O que tem na caixa vermelha?', a: 'Não sei, e é por isso que ainda tenho a Companhia. O dia em que eu souber o que tem nas caixas, eu passo a escolher quem é cliente, e a Companhia vira uma bandeira. A Companhia não é bandeira. É balança.' },
        { t: 'E se for uma arma?', a: 'Então é uma arma que paga frete. Eu levo. Quem decide se é crime é quem usa, e quem julga é o Olho. Eu sou uma feitora, não um olho.' },
        { t: 'O Rotha concorda com isso?', a: 'O Rotha mede o que eu levo e anota. Nunca disse que concordava. Nunca disse que não. É a opinião mais honesta que já recebi de um doutor.' } ] },
      'Vá com a carroça. Se alguém da estrada perguntar o que tem dentro, a resposta é “frete pago”. Em quarenta anos nunca precisei de outra.',
    ],
    done: [
      'A Brunna me contou. Três caixas, uma vermelha, e você escolheu. Ela não me disse o quê. Ela nunca diz; só anota no livro de fretes, numa coluna que ninguém lê a não ser eu.',
      'O Pacto da Honestidade é a única regra de Karmika que as duas bandeiras respeitam ao mesmo tempo, e respeitam porque ele é inútil para as duas. Pense nisso quando lhe disserem que a Irmandade não tem fé.',
    ],
    choice: { q: 'Na estrada, com a caixa vermelha ao alcance da mão, você…', opts: [
      { label: 'Levou lacrada, como manda o Pacto.', karma: 2, flag: 'tec_pacto_lacre', say: 'O frete é o frete. É a resposta de um tecnocrata e, suspeito, de um anão. Os dois são as únicas pessoas em quem a Brunna confia.', why: 'Você cumpriu a palavra da Companhia sem saber o que carregava. O Pacto é isso: a honestidade de quem não escolhe o cliente.' },
      { label: 'Abriu, olhou e lacrou de novo. Ninguém precisa saber.', karma: -2, flag: 'tec_pacto_olhou', say: 'Lacre refeito nunca fica igual. Eu vi. A Brunna também viu, e não disse nada, porque dizer custaria o cliente. Você gastou um pouco da Companhia hoje.', why: 'Saber o que vai na caixa é poder. Você pegou o poder e deixou a conta com a Companhia.' },
      { label: 'Abriu e avisou a Abadia do que a Corte mandava.', karma: 3, flag: 'tec_pacto_avisou', say: 'Então você vendeu informação. Para o lado “certo”, dirá. A Companhia não tem lado certo, e a Brunna vai riscar o seu nome do livro de fretes por um ano. Eu não a culpo. Também não culpo você.', why: 'Avisar quem podia morrer é luz. Quebrar o Pacto para isso é a sombra que a luz projeta. O Olho pesou as duas.' } ] } },

  { id: 'ti5', chain: IC, name: 'A Sentinela', lvl: 38, giver: AN, turnin: AN, next: 'ti6', xp: 0, gold: 400, items: [['sentinela', 1], ['drone_choque', 1]],
    text: 'O Doutor Rotha entrega o Robô Sentinela de Latão: plantado, fica um turno de guarda e solta descargas em quem chega perto. Os Engenhoqueiros Enlouquecidos dos Recifes roubam peças da Fábrica à noite. Plante a sentinela entre eles e derrube seis. Traga também uma peça que eles tenham roubado.',
    objs: [{ kind: 'kill', type: 'tinker', n: 6 }, { kind: 'collect', item: 'ore_i', n: 3 }],
    talk: [
      'Esta é a Sentinela. Não voa, não cura, não gira. Fica. É a engenhoca mais tecnocrata que a Academia já fez, porque faz uma coisa só e faz até o turno acabar.',
      'Nos Recifes há engenhoqueiros que a Academia expulsou. Enlouqueceram de tanto medir sem relatório; é um risco do ofício, e eu o corro todo dia. Eles roubam peças da Fábrica à noite. A Brunna quer as peças de volta. Eu quero saber por que roubam.',
      { r: [
        { t: 'Por que roubam?', a: 'Minha hipótese: porque alguém compra. Engenhoqueiro louco não come latão. Alguém come. Anote a hipótese e não a prove ainda: hipótese provada cedo vira lenda.' },
        { t: 'O senhor conheceu algum deles?', a: 'Conheci todos. Um era o meu melhor aluno. Media melhor do que eu. Parou de escrever relatório num inverno e no verão seguinte estava nos Recifes falando com as torretas. Não perguntei o que elas respondiam.' },
        { t: 'Como se planta uma sentinela?', a: 'Onde você quer que ela fique. Parece óbvio. Noventa por cento planta onde está, e não onde precisa.' } ] },
      'Seis engenhoqueiros, três peças de ferro de volta. E o Drone de Choque vai junto, de presente, porque esta missão é a primeira em que você pode morrer de verdade e eu detesto perder relatórios.',
    ],
    done: [
      'Seis. E as peças. A Brunna vai pagar por elas o que vale o ferro, nem um cobre a mais, e vai chamar isso de generosidade.',
      'Agora a parte do relatório que eu não vou entregar à Academia: as peças têm marca. Não é a da Fábrica. É um olho fechado, pequeno, no molde. Alguém fundiu isso para alguém.',
      { r: [
        { t: 'Olho fechado? Como o da porta de pedra preta?', a: '…Você viu a porta. Então já tem duas medidas do mesmo objeto que ninguém mede. Fale baixo e não conclua. Eu medi uma dessas portas em Askavik. Não tem maçaneta. Anotei exatamente isso.' },
        { t: 'Quem encomendou o olho?', a: 'Alguém de capa cinza, disse um dos loucos antes de desmaiar. Capa cinza é como descrever a chuva. Não serve. Anotei assim mesmo.' },
        { t: 'Devemos contar à Ylva?', a: 'A Ylva vai dizer que, se funciona, não para a produção para perguntar. E vai estar certa pela produção. Eu não meço produção.' } ] },
      'Zerath, dizem os sacerdotes, apodrece o ferro de dentro para fora. Deve ser isso. É o que todo mundo diz quando o ferro faz uma coisa que não devia. Eu anoto “Zerath” e um ponto de interrogação. O ponto é meu.',
    ] },

  { id: 'ti6', chain: IC, name: 'A Medida da Porta', lvl: 40, giver: AN, turnin: AN, next: 'ti7', xp: 0, gold: 420, gear: 1,
    text: 'Antes do bracelete, uma medida. Em Askavik, ao fim da escada abaixo do terceiro subsolo da Grande Biblioteca, há uma porta de pedra preta que o Doutor Rotha mediu uma vez. Vá até ela com o Instinto ligado e meça de novo. Ele quer saber se mudou.',
    objs: [{ kind: 'visit', poi: 'Askavik' }, { kind: 'sense', what: 'dispositivo', label: 'A porta de pedra preta, medida de novo', at: 'Ormund Salveth', dx: -7.5, dy: -4.5 }],
    talk: [
      'Eu lhe prometi um bracelete. Está na caixa. Antes dele, um favor que não tem nada a ver com bracelete, e por isso eu peço como favor e não como missão.',
      'Em Askavik, abaixo da Grande Biblioteca, ao fim de uma escada que os bibliotecários fingem que não existe, há uma porta de pedra preta. Eu a medi há sete anos. Altura, largura, espessura da laje, profundidade do olho esculpido. Quero as mesmas medidas hoje.',
      { r: [
        { t: 'Para saber se mudou.', a: 'Para saber se mudou. Pedra não muda em sete anos. Se não mudou, eu durmo. Se mudou, eu anoto e também durmo, porque anotar é o que eu tenho.' },
        { t: 'O que tem atrás dela?', a: 'Não sei. Não tem maçaneta, não tem fechadura, não tem dobradiça. Ou abre por dentro ou não abre. As duas hipóteses me desagradam igualmente.' },
        { t: 'O Cronista Ormund sabe dessa porta?', a: 'Sabe, e escreveu uma nota de rodapé. É o que o Ormund faz com o que o assusta: põe em letra pequena. Eu ponho em régua. Nenhum dos dois resolve.' } ] },
      'Instinto ligado, régua na mão, boca fechada. Se ouvir alguma coisa do lado de dentro, não meça a batida. Meça a porta e volte.',
    ],
    done: [
      'Então. As medidas são as mesmas. Altura, largura, laje. O olho… o olho está dois milímetros mais fundo. Você mediu certo? Não responda. Eu também medi certo há sete anos.',
      'Dois milímetros em sete anos. A runa da pedra de teleporte também afunda. São objetos diferentes, de pessoas diferentes, em lugares diferentes, com o mesmo defeito. Eu não vou dizer o que isso significa, porque não sei, e porque a última pessoa que disse acabou medindo torretas nos Recifes.',
      { r: [
        { t: 'Alguma coisa empurra de dentro.', a: 'É uma frase bonita. Anotei. Debaixo, escrevi “ou a pedra encolhe”. Eu sou pago para a segunda linha.' },
        { t: 'Vamos contar a alguém?', a: 'A quem? Ao Fio, que vai fechar mais a porta? Aos Desfiados, que vão querer abrir? As bandeiras só sabem fazer essas duas coisas com uma porta. Eu quero medir. É uma terceira opção, e ninguém a respeita.' },
        { t: 'O bracelete, Doutor.', a: 'O bracelete. Justo. Você mediu e não concluiu; merece latão no pulso.' } ] },
      'O Bracelete do Índice. Não faz nada que um relatório não faça: marca, no seu pulso, quanto falta. Você também não vai saber para quê. Bem-vindo à Irmandade.',
    ] },

  { id: 'ti7', chain: IC, name: 'Os Dois Têm Razão', lvl: 42, giver: AN, turnin: AN, xp: 0, gold: 500, gear: 2, title: 'Medidor da Irmandade', items: [['pet_robo_faisca', 1]],
    text: 'Askavik convoca os neutros: a Ordem do Fio e os Desfiados querem que a Irmandade do Vapor escolha um lado. O Doutor Rotha manda você ouvir o Paladino Aldric e Lady Mirela, e depois dizer a ele, com uma frase só, o que a Irmandade responde.',
    objs: [{ kind: 'visit', poi: 'Askavik' }, { kind: 'talk', npc: 'Paladino Aldric' }, { kind: 'talk', npc: 'Corvina, a Desfiadora' }],
    talk: [
      'Chegou a carta que chega para todo tecnocrata uma vez na vida. Askavik quer saber de que lado a Irmandade do Vapor fica. As duas bandeiras mandaram emissário. Eu mandei você, porque eu não saio de Porto Caldeira sem o índice e o índice não gosta de Askavik.',
      'Ouça o Aldric. Ouça a Corvina, que fala pela Mirela quando a Mirela está dormindo de dia, o que é sempre. Depois volte e me diga, numa frase, o que a Irmandade responde. Uma frase. Relatório de uma linha é o único que a Academia lê.',
      { r: [
        { t: 'O senhor já sabe a resposta.', a: 'Sei. Mas a resposta que eu sei é minha, e eu sou um doutor cansado. A Irmandade precisa da resposta de alguém que ainda anda.' },
        { t: 'E se eu escolher um lado?', a: 'Então você escolhe. A Irmandade não expulsa quem jura bandeira; só anota que a medida dele passa a ter um lado, e lê com desconto.' },
        { t: 'A Brynhild, do Corvo, também foi convocada.', a: 'Foi. E já respondeu: que os dois estão certos e errados ao mesmo tempo, e saiu da sala. É uma resposta de guerreiro. A nossa precisa caber numa régua.' } ] },
    ],
    meet: {
      'Paladino Aldric': [
        'O tecnocrata do Rotha. Sente-se. Não vou lhe pedir que jure; vou lhe pedir que escute, que é mais raro.',
        'A Ordem compra os seus sinos, os seus escudos, os seus relógios. Pagamos atrasado, eu sei. Mas cada peça da Academia que chega à Abadia guarda alguém que ainda respira. Os Desfiados compram as mesmas peças para abrir o que nós fechamos. Vocês vendem para os dois. Eu não peço que parem. Peço que saibam.',
        { r: [
          { t: 'A Irmandade mede. Não escolhe.', a: 'Medir também é escolher o que se olha. Mas respeito. O Rotha mediu a nossa porta uma vez e não a abriu. É mais do que muita gente da Ordem faria.', luz: 1 },
          { t: 'E se a Irmandade ficasse com o Fio?', a: 'Então a Corte compraria escudos em outro lugar, piores, e morreria mais gente do lado deles. Eu não deveria me importar. Eu me importo. É o meu defeito, dizem.' } ] },
        'Diga ao Rotha que a Ordem não vai parar de comprar, e que eu li o relatório dele sobre a pedra. Fui o único. Não entendi nada. Mas li.',
      ],
      'Corvina, a Desfiadora': [
        'Ah, o da Irmandade. A Mirela deixou recado: “diga ao doutor que a Casa paga adiantado, em ouro velho, e nunca pediu que ele escolhesse nada”. É a frase mais gentil que um vampiro já mandou para um tecnocrata.',
        'A verdade é que a gente gosta de vocês. Vocês não rezam, não julgam, não empurram ninguém para dentro do labirinto nem para fora. Vendem e medem. Se o mundo inteiro fosse a Irmandade, não haveria bandeira. Também não haveria mundo, mas isso é detalhe.',
        { r: [
          { t: 'A Irmandade mede. Não escolhe.', a: 'Então meça isto: os relógios que a Academia vende à Casa dizem quanto falta para o sol nascer. Os sinos que vende à Abadia dizem quanto falta para a missa. Vocês vendem “quanto falta” para os dois lados. O Rotha devia achar graça.', sombra: 1 },
          { t: 'E se a Irmandade ficasse com os Desfiados?', a: 'Então a Abadia compraria sinos piores e acordaria atrasada, e eu dormiria melhor. Mas não vou pedir. Pedir é coisa do Fio.' } ] },
        'Diga ao doutor que a Mirela quer encomendar um índice igual ao dele. Ele vai dizer que não. Ela vai mandar ouro velho mesmo assim.',
      ],
    },
    done: [
      'Voltou com as duas conversas na cara. O Aldric leu o meu relatório. A Corvina riu do meu índice. Os dois me conhecem melhor do que a Academia.',
      'Agora a frase. Uma. O que a Irmandade do Vapor responde a Askavik?',
    ],
    choice: { q: 'Diante do índice de latão, você escolhe a frase da Irmandade:', opts: [
      { label: '“Vendemos para os dois e medimos o que volta. É assim que Karmika fica de pé.”', karma: 2, flag: 'tec_neutro', say: 'É a minha frase. Eu não disse que era minha para ver se você chegava nela sozinho. Chegou. Isso vale mais do que o bracelete.', why: 'O neutro de verdade não se omite: sustenta a balança que os dois lados usam para brigar. É um lugar solitário, e é o seu.' },
      { label: '“A Irmandade fica com o Fio: um muro de pé vende mais do que um muro caído.”', karma: 1, flag: 'tec_lado_fio', say: 'Honesto até o cinismo. A Ylva vai gostar da conta; o Aldric vai detestar o motivo. Vou anotar que a sua medida passou a ter um lado, e ler com desconto.', why: 'Escolher o Fio pelo lucro é escolher o Fio. O Olho pesa o motivo, e o motivo era a balança, não a porta.' },
      { label: '“A Irmandade fica com os Desfiados: quem paga adiantado merece a chave.”', karma: -1, flag: 'tec_lado_desf', say: 'Também honesto. A Mirela vai mandar ouro velho e um bilhete educado. A Abadia vai comprar sino pior. Eu anotei o seu lado e o desconto é o mesmo do outro.', why: 'Escolher os Desfiados pelo ouro é escolher os Desfiados. O motivo pesou mais do que a porta, e o Olho viu.' } ] } },
];

/** o Doutor Rotha mora na Academia da Graxa, em Porto Caldeira */
export const INDICE_NPCS = [
  { vila: 'Porto Caldeira', name: AN, role: 'Doutor da Irmandade do Vapor', dx: 14, dy: -16, tint: 0x6a7a8a, kind: 'technocrat' as const, lines: ['Isto é um índice. Marca quanto falta. Não pergunte para quê.', 'Enterrei uma lenda hoje de manhã. Desenterro outra na sexta.', 'Relatório de uma linha é o único que a Academia lê.'] },
];
