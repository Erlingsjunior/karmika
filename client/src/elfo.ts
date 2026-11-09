/* ---------- A COPA — Capítulo I do Elfo puro (níveis 20–31), 09/11. "O Ciclo de Aliança".
   Para quem recusou classe na Vidente e nasceu elfo (v_hum + origem élfica). Bom por natureza, e O ÚNICO PURO QUE PODE ANDAR COM KARMA NEGATIVO:
   a altivez élfica é respeitada no clã maligno; o elfo de karma negativo vira elfo negro e pode erguer cidades onde os da sombra moram.
   A sociedade élfica não vê isso como ruim — karma negativo é uma ORDEM, e ordem a mata respeita. O que ela não perdoa é TRAIR A NATUREZA
   e a ordem natural das coisas (um elfo que se faz vampiro, por exemplo).
   Portadora: Lirien Folha-Tarde, que anda entre as casas da sombra sem ser tocada (e um dia vai contar por quê: já foi vampira e voltou elfa —
   ainda NÃO conta neste capítulo). A Rainha manda o elfo como emissário às três casas da sombra: Corvoscuro (o Conde; o Vasko serve),
   o Uivo (o Varg acha elfo "magro demais para comer") e Gorvath (a Ravena oferece um pacto de cinco cláusulas; recusar é a prova).
   Pista do capítulo (sem resposta): a estrofe que a cantora da Copa nunca termina.
   Toda podridão é culpa de Zerath. Ninguém reconcilia ninguém: o elfo é emissário, não pacificador. ---------- */
import type { QuestDef } from './quests';

export const LI = 'Lirien Folha-Tarde', RA = 'Rainha Galadhwen Folha-de-Prata', FA = 'Anciã Faelwen', CA = 'Cantora Aelith', VL = 'Conde Vladislav III', VA = 'Sommelier Vasko', VG = 'Varg Dente-Partido', RV = 'Ravena Cinco-Cláusulas', OR = 'Cronista Ormund Salveth';
const CP = 'A Copa';
const E = { origin: 'elf' as const };

export const ELF_I: QuestDef[] = [
  { id: 'lf1', chain: CP, ...E, name: 'A Folha Que Não Cai', lvl: 20, giver: FA, turnin: RA, req: 'v_hum', next: 'lf2', xp: 0, gold: 200, items: [['potion_g', 2]],
    text: 'Você ficou elfo, e a Anciã Faelwen diz que a Rainha tem um trabalho para quem fica: ser a voz da Copa onde a Copa não entra. Suba à Árvore-Mãe e apresente-se à Rainha Galadhwen.',
    objs: [{ kind: 'talk', npc: RA }],
    talk: [
      'Ficou. A mata ouviu. Ela gosta de quem fica; tem raiz demais para entender quem vai embora.',
      'A Rainha precisa de alguém que fale pela Copa nas casas da sombra. Não para fazer paz: a paz é coisa grande demais para uma folha só. Para ser ouvido. Elfo é ouvido lá onde ninguém mais é.',
      { r: [
        { t: 'Por que um elfo é ouvido na sombra?', a: 'Porque somos altivos e não pedimos nada. A sombra respeita quem não pede. E porque um elfo pode carregar karma escuro sem trair a mata. Isso eles sabem.' },
        { t: 'Karma escuro não é trair a mata?', a: 'Não. Karma escuro é uma ordem, como o inverno. Trair a mata é outra coisa: é virar o que a natureza não fez. Um elfo que se deixa morder, por exemplo. Isso a Copa não perdoa. O resto, a Copa entende.' } ] },
    ],
    meet: { [RA]: [
      { who: RA, t: 'A folha que ficou. Aproxime-se. Sente o vento? Vem do norte, e traz cinza. Karmika está cansada.' },
      { who: RA, t: 'As duas bandeiras de Askavik dizem que vão salvar Karmika. O Fio de um jeito, os Desfiados de outro. A Copa não escolhe bandeira: a Copa escuta as duas e lembra.' },
      { who: RA, t: 'Você vai às três casas da sombra como a minha voz. Não leva presente. Não leva espada. Leva a Lirien Folha-Tarde, que conhece o caminho melhor do que qualquer mapa. Ela tem os motivos dela. Não pergunte.' },
    ] },
    done: [
      'A Rainha falou e você ouviu. Isto é raro: a maioria ouve a Rainha e escuta outra coisa. Vá encontrar a Lirien. Ela está sempre perto da cantora, esperando uma estrofe que não vem.',
    ] },

  { id: 'lf2', chain: CP, ...E, name: 'A Estrofe Que Falta', lvl: 21, giver: LI, turnin: LI, next: 'lf3', xp: 0, gold: 220,
    text: 'A Lirien Folha-Tarde não parte sem ouvir a Cantora Aelith. Ouça a canção da Copa com ela. A cantora sempre para no mesmo verso.',
    objs: [{ kind: 'talk', npc: CA }],
    talk: [
      'Você é a voz nova da Rainha. Eu sou Lirien. Antes de descer à sombra, eu ouço a canção. Toda vez. É um costume. Os costumes são o que a gente tem quando não tem certeza.',
      'A Aelith canta a Canção da Copa: como a Árvore-Mãe nasceu, como os elfos subiram, como a mata aprendeu a lembrar. São doze estrofes. Ela canta onze.',
      { r: [
        { t: 'Por que onze?', a: 'Ninguém sabe a décima segunda. A mãe dela não sabia. A avó também não. A canção para no meio de um verso, e todo mundo finge que acabou.' },
        { t: 'Você sabe?', a: 'Eu já soube, uma vez. Em outra vida, talvez. Agora não lembro. É a única coisa que eu gostaria de lembrar e não lembro.' },
        { t: 'Por que você me acompanha?', a: 'Porque eu ando entre as casas da sombra sem ser tocada. Um dia eu conto por quê. Não hoje. Hoje tem canção.' } ] },
    ],
    meet: { [CA]: [
      { who: CA, t: '“…e a Copa abriu os braços ao céu, e o céu desceu de joelhos, e na raiz mais funda, onde a luz não alcança, havia…”' },
      { who: CA, t: '(Ela para. Fecha os olhos. Abre. Sorri como quem pede desculpa a si mesma.)' },
      { who: CA, t: 'Desculpe. A canção acaba aí. Sempre acabou. Às vezes eu sinto a próxima palavra na língua. Ela tem gosto de pedra fria. Depois some.' },
    ] },
    done: [
      '“Havia…” Sempre “havia”. Seiscentos anos de “havia”. Anote isso, voz da Rainha. Não tente adivinhar. Os que tentaram adivinhar a estrofe não cantaram mais.',
      { r: [
        { t: 'Isso é uma ameaça?', a: 'É uma observação. Os elfos não ameaçam. Observamos em voz alta, e o mundo se ajusta.' },
        { t: 'O Cronista de Askavik conhece a canção?', a: 'Ele tem uma cópia com onze estrofes e meia. A meia é o “havia”. Ele anotou na margem: “a canção não acaba; ela para”. Ele tem razão. Isso me irrita.' } ] },
    ] },

  { id: 'lf3', chain: CP, ...E, name: 'Corvoscuro ao Anoitecer', lvl: 22, giver: LI, turnin: VL, next: 'lf4', xp: 0, gold: 240,
    text: 'A primeira casa da sombra é a do Conde Vladislav III, em Corvoscuro. Chegue ao anoitecer, como os convidados chegam, e jante com o Conde. O Sommelier Vasko serve. Não aceite a segunda taça.',
    objs: [{ kind: 'visit', poi: 'Corvoscuro' }, { kind: 'talk', npc: VA }, { kind: 'talk', npc: VL }],
    talk: [
      'Corvoscuro. A Casa Noctavar. Eles vão nos receber com cortesia perfeita, porque a Rainha mandou. A cortesia deles é uma lâmina embainhada: bonita, e sempre lá.',
      'Regras. Uma: aceite a primeira taça. Recusar ofende. Duas: não aceite a segunda. Aceitar convida. Três: se o Vasko sorrir com o canto da boca, alguém vai ser servido lá fora, e não somos nós.',
      { r: [
        { t: 'Por que eles respeitam os elfos?', a: 'Porque nós não temos medo e não temos fome. Os dois sentimentos que eles mais conhecem nos outros. Sem eles, ficam curiosos. Curiosidade de vampiro é quase respeito.' },
        { t: 'Você já esteve aqui antes?', a: 'Já. Muitas vezes. Uma vez de um jeito que não conto. Vamos.' } ] },
    ],
    meet: {
      [VA]: [
        { who: VA, t: 'A voz da Copa! E a senhora Lirien, que nunca envelhece um dia nesta casa. Entrem. A primeira taça é de cortesia; a segunda é de amizade; a terceira, ninguém lembra.' },
        { who: VA, t: '(Ele serve. O vinho é escuro e cheira a ameixa e ferro.) Ah, e o lobo que veio ontem jantou lá fora. A Casa tem princípios. E uma varanda.' },
      ],
      [VL]: [
        { who: VL, t: 'Entre. Ou não. A Casa é paciente. A Rainha da Copa manda uma folha nova. Ela sempre manda as melhores; nunca as mesmas duas vezes.' },
        { who: VL, t: 'Diga à sua Rainha que a Casa Noctavar quer salvar Karmika tanto quanto o Fio. Só que nós sabemos o preço, e eles fingem que não existe. Diga também que o Conde lembra de quando a canção da Copa tinha doze estrofes. Não diga mais nada. Eu não digo mais nada.' },
      ] },
    choice: { q: 'O Vasko enche a segunda taça, sem perguntar, e fica esperando. Você…', opts: [
      { label: 'Recusa com um aceno, como a Lirien ensinou.', karma: 2, flag: 'elf_recusou_taca', say: 'O Vasko recolheu a taça com um sorriso de quem perdeu uma aposta divertida. O Conde anotou o seu nome num livro. A Lirien não disse nada; o silêncio dela era aprovação.', why: 'Você foi cortês sem ser comprado. A altivez élfica, inteira.' },
      { label: 'Aceita a segunda taça, por curiosidade.', karma: -2, flag: 'elf_segunda_taca', say: 'O vinho desceu frio. O Conde sorriu de verdade pela primeira vez. A Lirien te olhou como quem conta os passos até um penhasco. “Não faça a terceira.”', why: 'Você aceitou a amizade da Casa. Não é traição. É um primeiro passo, e a Casa conta passos.' },
      { label: 'Pergunta ao Conde sobre a décima segunda estrofe.', karma: 0, flag: 'elf_perguntou_estrofe', say: 'O Conde riu baixo. “Pergunte à sua Rainha por que ela parou de cantar.” Depois mudou de assunto e não voltou a ele.', why: 'Você usou a cortesia para pescar um segredo. A Casa respeitou a ousadia. E fechou a porta.' } ] },
    done: [
      'O Conde lembra das doze estrofes. Claro que lembra. Ele tem setecentos anos e uma adega com memória melhor que a minha. Não vou pensar nisso agora. A próxima casa fede a pelo molhado.',
    ] },

  { id: 'lf4', chain: CP, ...E, name: 'O Uivo', lvl: 23, giver: LI, turnin: VG, next: 'lf5', xp: 0, gold: 260,
    text: 'A segunda casa é a matilha do Uivo Antigo. O Varg Dente-Partido, segundo da Mãe-Alfa, quer saber por que a Rainha manda alguém "magro demais para comer". Atravesse a Selva Licantropa, derrube os lobisomens jovens que testam quem chega, e fale com ele.',
    objs: [{ kind: 'visit', poi: 'Uivo Antigo' }, { kind: 'kill', type: 'werewolf', n: 4 }, { kind: 'talk', npc: VG }],
    talk: [
      'O Uivo. Os jovens vão testar você na trilha. Não é ataque: é cumprimento. Lobo cumprimenta com o dente. Responda do mesmo jeito, sem matar o que não precisa morrer.',
      'O Varg é o segundo da Ulfrun. Perdeu um filhote para a prata do Clã Helsing e quebrou o próprio dente mordendo a gaiola. Ele não deixa ninguém para trás. Nem o inimigo caído. Lembre disso se ele parecer bruto. Ele é bruto. Também é isso.',
      { r: [
        { t: 'Ele odeia os vampiros?', a: 'Com todo o corpo. E senta à mesma mesa quando a Mãe-Alfa manda. É a coisa mais disciplinada que eu já vi um animal fazer. Não diga “animal” para ele.' },
        { t: 'E os elfos?', a: 'Ele acha a gente magro demais para comer e bonito demais para confiar. Dos lobos, é o elogio mais alto.' } ] },
    ],
    meet: { [VG]: [
      { who: VG, t: 'Então essa é a voz da Rainha. Magro. Magro demais para comer. A Rainha manda gente que não alimenta ninguém. Esperto.' },
      { who: VG, t: 'Você derrubou os meus jovens e não matou nenhum. Eu vi. Eles vão contar isso a noite inteira, uivando, para ninguém dormir. Obrigado.' },
      { who: VG, t: 'Diga à sua Rainha: a matilha quer Karmika viva. A Corvina diz que o Fio vai trancar tudo numa gaiola de regras. Eu sei o que é gaiola. Mas diga também que eu não sento à mesa do Conde se o Vasko servir. Ele serve sorrindo. Eu mordo sorrindo.' },
    ] },
    done: [
      '“Mordo sorrindo.” Ele gosta de você. Do jeito dele. A última casa é a pior, porque é a mais educada.',
    ] },

  { id: 'lf5', chain: CP, ...E, name: 'Gorvath', lvl: 24, giver: LI, turnin: RV, next: 'lf6', xp: 0, gold: 280, gear: 1,
    text: 'A terceira casa é o Vale da Desgraça. A Ravena Cinco-Cláusulas vai oferecer um pacto à voz da Copa. Cinco cláusulas, honesto, bom negócio. Recusar é a prova que a Rainha quer. Chegue ao Vale vivo: as súcubos rondam a estrada.',
    objs: [{ kind: 'kill', type: 'succubus', n: 4 }, { kind: 'talk', npc: RV }],
    talk: [
      'Gorvath. A Ravena é a mais honesta das três casas. É por isso que é a mais perigosa. Ela vai oferecer um pacto bom. Muito bom. Cinco cláusulas, tudo lido em voz alta. Você vai querer aceitar.',
      'Não aceite. Não porque é mau. Porque a voz da Copa não pode dever nada a ninguém. Uma folha que deve cai antes do outono.',
      { r: [
        { t: 'E se o pacto for justo?', a: 'Ele vai ser justo. É esse o teste. Recusar um pacto ruim qualquer um recusa. Recusar um bom é o que a Rainha quer ver.' },
        { t: 'A Ravena sabe que é um teste?', a: 'Sabe. Ela vai oferecer mesmo assim, porque quer ver também. As duas querem a mesma coisa de você. É quase bonito.' } ] },
    ],
    meet: { [RV]: [
      { who: RV, t: 'A voz da Copa. Sente. Cinco cláusulas, lidas em voz alta. Um: você ganha a língua das três casas. Dois: o preço é uma lembrança que você escolhe. Três: prazo de uma lua. Quatro: saída quando quiser. Cinco: cortesia, que é onde eu escondo o juro.' },
      { who: RV, t: 'É bom. Eu sei que é bom. Eu escrevi. Assina?' },
    ] },
    choice: { q: 'O pacto da Ravena está na mesa, honesto e bom. Você…', opts: [
      { label: 'Recusa com respeito: a voz da Copa não deve a ninguém.', karma: 3, flag: 'elf_recusou_pacto', say: 'A Ravena dobrou o pacto em cinco e guardou no bolso. “Ótimo. Eu teria rasgado a sua carta de emissário se você assinasse.” A Lirien sorriu pela primeira vez no dia.', why: 'Você recusou um bem para não dever. A prova que a Rainha queria.' },
      { label: 'Assina, com a sua própria lembrança como preço.', karma: -3, flag: 'elf_assinou_ravena', say: 'Você escolheu esquecer o rosto de quem te ensinou a andar na mata. A Ravena cumpriu as cinco cláusulas. A Lirien ficou dois dias sem falar com você. Não é traição à natureza. É uma dívida. A Copa vai saber.', why: 'Não traiu a mata: pagou com o que era seu. Mas a voz da Rainha agora deve ao Vale.' },
      { label: 'Propõe um pacto ao contrário: a Ravena deve uma resposta à Copa.', karma: 1, flag: 'elf_pacto_inverso', say: 'A Ravena riu alto, o que ninguém em Gorvath lembra de ter ouvido. “Uma cláusula. Eu devo à Copa uma resposta verdadeira, uma vez.” Ela assinou. Um dia a Copa vai cobrar.', why: 'Você virou a mesa sem quebrar nada. Altivez élfica de manual.' } ] },
    done: [
      'Três casas. Três portas. Nenhuma fechada, nenhuma aberta demais. A Rainha vai gostar. Agora, antes de voltar, eu preciso que você veja uma coisa no caminho. Não é missão da Rainha. É minha.',
    ] },

  { id: 'lf6', chain: CP, ...E, name: 'O Riacho Que Desce', lvl: 26, giver: LI, turnin: LI, next: 'lf7', xp: 0, gold: 300,
    text: 'A Lirien quer mostrar o riacho que desce da Árvore-Mãe até a mata baixa. A água está com gosto de ferro. Ligue o Instinto (F) na nascente e siga o rastro até o que suja a água. Depois limpe o que estiver ali.',
    objs: [{ kind: 'sense', what: 'rastro', label: 'O riacho da Árvore-Mãe, gosto de ferro', at: 'Lithendel', dx: 10, dy: 8, from: 'Lithendel' }, { kind: 'kill', type: 'spider', n: 8 }],
    talk: [
      'A água do riacho da Árvore-Mãe nunca teve gosto. Esta semana tem gosto de ferro. Ninguém na Copa notou, porque ninguém na Copa bebe do riacho baixo. Eu bebo. Eu desço.',
      { r: [
        { t: 'O que pode ser?', a: 'Os velhos vão dizer que é a podridão, que Zerath sobe pelos riachos. Pode ser. Vamos ver antes de culpar um deus.' },
        { t: 'Por que não contar à Rainha?', a: 'Porque a Rainha vai mandar alguém. Eu quero que seja você. Você ainda olha a mata como se ela fosse nova. É o olhar certo para achar sujeira.' } ] },
    ],
    done: [
      'Um ninho de aranhas na curva do riacho, e no meio dele, ferro velho. Um elmo. Antigo, de um tipo que ninguém forja há trezentos anos. Com a sexta runa no queixo, gravada por dentro.',
      { r: [
        { t: 'De quem era?', a: 'De ninguém que esteja vivo. Isso é o que eu sei. O resto é a podridão de sempre, e Zerath leva a culpa, como sempre. Eu vou guardar o elmo. Não conte à Rainha. Ainda.' },
        { t: 'Por que esconder da Rainha?', a: 'Porque ela parou de cantar a décima segunda estrofe muito antes de a Aelith nascer. Quero entender por quê, antes de entregar mais uma coisa que ela vai calar.' } ] },
    ] },

  { id: 'lf7', chain: CP, ...E, name: 'A Ordem e a Sombra', lvl: 27, giver: FA, turnin: FA, next: 'lf8', xp: 0, gold: 320,
    text: 'A Anciã Faelwen quer ensinar a diferença entre karma escuro e traição à natureza, antes que a voz da Copa a esqueça. Um elfo de karma negativo veio pedir abrigo na mata baixa, e um elfo que aceitou a mordida veio pedir perdão. Fale com os dois e decida, com a Anciã, quem a Copa recebe.',
    objs: [{ kind: 'talk', npc: FA }],
    talk: [
      'Hoje vieram dois à mata baixa. O primeiro carrega karma escuro: roubou de quem roubava, mentiu a quem mentia, e foi cruel com os cruéis. A sombra o reconhece. O segundo deixou-se morder em Corvoscuro, por amor, e agora tem fome de sangue e olhos de brasa.',
      'A Copa recebe um. O outro vai embora. Qual?',
      { r: [
        { t: 'O de karma escuro é pior: fez mal de verdade.', a: 'Fez. E o mal que fez é uma ordem que a mata entende: o lobo também mata. O outro fez uma coisa que a mata não entende: deixou de ser o que era. A mata perdoa o lobo. Não perdoa a árvore que vira pedra.' },
        { t: 'O mordido fez por amor.', a: 'Fez. E o amor não muda o que ele é agora. A Copa não pune o amor. A Copa só não pode abrigar o que deixou de ser natural. Ele vai ser recebido pela Casa do Conde. Lá ele vai ser feliz, talvez. Aqui, não.' } ] },
    ],
    choice: { q: 'A Anciã espera a sua palavra, como voz da Rainha. A Copa recebe…', opts: [
      { label: 'O elfo de karma escuro; o mordido segue para Corvoscuro, com uma carta sua.', karma: 2, flag: 'elf_ordem_natural', say: 'A Anciã assentiu. O mordido partiu chorando, com a sua carta para a Lady Mirela. A Lirien ficou olhando a estrada muito tempo depois que ele sumiu.', why: 'Você seguiu a lei da mata: a sombra é ordem; trair a natureza, não.' },
      { label: 'Os dois. A Copa pode mudar.', karma: 0, flag: 'elf_recebeu_os_dois', say: 'A Anciã ficou em silêncio um dia inteiro. Depois deixou os dois ficarem, um em cada ponta da mata baixa. A Rainha soube. Não disse nada. Por enquanto.', why: 'Você desafiou a lei por compaixão. A mata vai lembrar das duas coisas.' },
      { label: 'Nenhum dos dois.', karma: -2, flag: 'elf_recusou_ambos', say: 'Os dois foram embora. O de karma escuro para Corvoscuro também. A Anciã disse: “Duas folhas a menos não é a mesma coisa que uma árvore mais forte.”', why: 'Você confundiu altivez com dureza.' } ] },
    done: [
      'A ordem e a sombra. Guarde essa conversa. Um dia, quem vai pedir abrigo é alguém que você ama. Lembre de qual era a lei, e de quanto ela pesou.',
    ] },

  { id: 'lf8', chain: CP, ...E, name: 'A Carta à Copa', lvl: 28, giver: LI, turnin: OR, next: 'lf9', xp: 0, gold: 340,
    text: 'A Lirien quer comparar a canção da Copa com a cópia da Grande Biblioteca de Askavik. Leve ao Cronista Ormund Salveth a pergunta dela: em que ano a canção perdeu a décima segunda estrofe?',
    objs: [{ kind: 'visit', poi: 'Askavik' }, { kind: 'talk', npc: OR }],
    talk: [
      'O Ormund não conta nada, mas anota tudo. Às vezes, se você fizer a pergunta certa, ele lê em voz alta uma anotação e finge que não leu. Pergunte o ano. Só o ano.',
    ],
    meet: { [OR]: [
      { who: OR, t: 'A pergunta da Folha-Tarde. Ela sempre pergunta datas. É o jeito dela de não perguntar o resto.' },
      { who: OR, t: '(Ele abre um caderno de capa verde, folheia, para numa página com uma folha seca prensada.)' },
      { who: OR, t: '“Ano do Quarto Inverno: a Copa canta onze estrofes e meia. Na mesma semana, a Rainha manda selar a raiz mais funda da Árvore-Mãe. Ninguém pergunta por quê.” Essa letra é minha. Eu não lembro de ter escrito. Anote que eu disse isso.' },
    ] },
    done: [
      'Selar a raiz. A mesma semana. Diga à Lirien. Ela vai ficar em silêncio. Deixe ficar.',
    ] },

  { id: 'lf9', chain: CP, ...E, name: 'A Raiz Selada', lvl: 30, giver: OR, turnin: LI, next: 'lf10', xp: 0, gold: 360, gear: 1,
    text: 'De volta a Lithendel, a Lirien quer ver o selo da raiz mais funda, a Passagem da Raiz debaixo da Árvore-Mãe. Ligue o Instinto (F) diante do selo. Os fungos que crescem ali não gostam de visita.',
    objs: [{ kind: 'kill', type: 'fungus', n: 8 }, { kind: 'sense', what: 'espirito', label: 'O selo da raiz mais funda', at: 'Lithendel', dx: -2, dy: 4,
      spirit: { name: 'Uma voz na raiz', lines: ['…havia uma porta. Havia uma porta, e a Copa cantou para ela fechar.', 'Não abra. A canção acabou porque a porta fechou. Se a canção acabar de cantar, a porta abre.', '…ou era o contrário? Eu não lembro. Eu era uma folha. Folha não lembra.'] } }],
    talk: [
      'Diga à Folha-Tarde que o selo da raiz é feito de canção, não de pedra. Ela vai entender. Eu não entendo. Eu anoto.',
    ],
    done: [
      '“A canção acabou porque a porta fechou. Se a canção acabar de cantar, a porta abre.” Ou o contrário.',
      { r: [
        { t: 'Que porta?', a: 'Não sei. Não quero saber hoje. Eu já vi portas pretas em lugares onde não devia haver porta nenhuma. Não pergunte onde. Não hoje.' },
        { t: 'A Rainha sabe.', a: 'A Rainha sabe que selou. Não sei se sabe o quê. As rainhas às vezes guardam o que não entendem, como a gente guarda uma folha seca num livro.' },
        { t: 'Vamos contar à Rainha?', a: 'Vamos contar que achamos podridão na raiz e que Zerath sobe pelos riachos. É o que todo mundo diz. Ela vai acreditar. Eu vou guardar o resto. E você também.' } ] },
    ] },

  { id: 'lf10', chain: CP, ...E, name: 'O Ciclo de Aliança', lvl: 31, giver: LI, turnin: RA, title: 'Voz da Copa', xp: 0, gold: 420, gear: 1, items: [['potion_g', 4]],
    text: 'A voz da Copa presta conta à Rainha das três casas da sombra. Antes, a Cantora Aelith quer cantar para você a canção inteira, até onde ela vai. Depois suba à Árvore-Mãe e jure o Ciclo de Aliança diante da Rainha Galadhwen.',
    objs: [{ kind: 'talk', npc: CA }, { kind: 'talk', npc: RA }],
    talk: [
      'Você jantou com o Conde, foi mordido de brincadeira pelos jovens do Varg, recusou o pacto mais honesto do Vale, aprendeu a lei da mata e viu o selo da raiz. Chega. Hoje você jura.',
      'O juramento élfico chama Ciclo de Aliança: você promete andar entre todos sem pertencer a nenhum, e voltar sempre para a mata. É simples. Quebrar é mais simples ainda. Eu sei. Um dia eu conto.',
      { r: [
        { t: 'Você quebrou o ciclo?', a: 'Quebrei. E voltei. Não hoje. Hoje é o seu dia, não a minha história.' },
        { t: 'E as bandeiras?', a: 'Você pode escolher qualquer uma. Ir aos Desfiados não quebra o ciclo. Ser mordido quebra. Lembre a diferença. É a única lei élfica que importa.' } ] },
    ],
    meet: {
      [CA]: [
        { who: CA, t: '“…e na raiz mais funda, onde a luz não alcança, havia…”' },
        { who: CA, t: '(Dessa vez ela não para. Abre a boca para a próxima palavra. Nenhum som sai. Ela fecha os olhos, sorri, e começa a canção do início.)' },
        { who: CA, t: 'Desculpe. Eu quase. Eu quase. Ela tinha gosto de pedra fria.' },
      ],
      [RA]: [
        { who: RA, t: 'A folha voltou das três casas da sombra. Inteira, e sem dever a ninguém. Diga o que viu.' },
        { me: 'O Conde quer Karmika viva, e lembra das doze estrofes. O Varg quer Karmika viva, e não senta com o Vasko. A Ravena quer Karmika viva, e cobra de todos.' },
        { who: RA, t: 'Todos querem Karmika viva. Do jeito deles. Do nosso também. Jure.' },
        { me: 'Ando entre todos sem pertencer a nenhum. Volto sempre à mata. Não traio o que a natureza fez de mim.' },
        { who: RA, t: 'Então é a voz da Copa. E ouviu a cantora parar de novo, eu sei. Não me pergunte por quê. Há perguntas que a Copa responde cantando. Essa ainda não.' },
      ] },
    done: [
      'A voz da Copa. O título é seu. Agora a mata conhece o seu passo, e as três casas da sombra conhecem a sua cara. As duas coisas vão salvar a sua vida e complicá-la. Bem-vinda, folha. Bem-vindo.',
    ] },
];

/** a Portadora, a cantora e o Varg (Portador da matilha, fixo no Uivo) */
export const ELF_I_NPCS = [
  { vila: 'Lithendel', name: LI, role: 'Portadora da Copa · Folha-Tarde', dx: 3, dy: 3, tint: 0x3a5a4a, lines: ['Eu ando entre as casas da sombra sem ser tocada. Um dia eu conto por quê.', 'Ir aos Desfiados não quebra o ciclo. Ser mordido quebra.', 'A canção não acaba. Ela para.'] },
  { vila: 'Lithendel', name: CA, role: 'Cantora da Copa', dx: 5, dy: 3.5, tint: 0x8a9a6a, lines: ['“…e na raiz mais funda, onde a luz não alcança, havia…”', 'A próxima palavra tem gosto de pedra fria.'] },
  { vila: 'Uivo Antigo', name: VG, role: 'Segundo da Mãe-Alfa · Portador da Matilha', dx: 3, dy: -2.5, tint: 0x5a4a3a, lines: ['Ninguém fica para trás. Nem o inimigo caído.', 'Elfo é magro demais para comer.', 'Eu sei o que é gaiola.'] },
];
