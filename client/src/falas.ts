/* ---------- As conversas da história amarela (24/10, regra 0: capricho surreal; regra 10: o motivo pesa)
   Cada missão amarela tem a conversa ao pegar (talk) e ao entregar (done). As respostas do jogador mexem na inclinação da
   alma — Luz (compaixão, honra, verdade) e Sombra (cobiça, crueldade, mentira) — e deixam marcas (flag) que o mundo lembra.
   {nome} vira o nome do herói. Escrever sempre na voz de quem fala: Garrick é seco e militar; Lúcia, simples e aflita;
   Thorin, anão negociante e orgulhoso; Eldrin, sábio que fala do Olho e de Marghar; Doran, armeiro de poucas palavras. ---------- */
import type { Step } from './dialog';

export const FALAS: Record<string, { talk?: Step[]; done?: Step[] }> = {
  /* ---------------- Karmika: o berço ---------------- */
  n01: {
    talk: [
      'Você acordou mesmo. Pensei que fosse dormir até o inverno.',
      'Sou Garrick. Guardo esta vila desde antes de você aprender a andar. E esta vila, {nome}, tem um problema que não dorme: ratazanas rubras.',
      'Saem do Cemitério Esquecido, ao norte da praça. Comem o grão, mordem as crianças e trazem a febre.',
      { r: [
        { t: 'Deixe comigo. Ninguém vai morder criança enquanto eu estiver aqui.', a: 'É assim que se fala. Guarde essa raiva para quando precisar.', luz: 2 },
        { t: 'E quanto a vila paga por rato morto?', a: 'Paga com teto e pão. Quem quer ouro, que vá ser mercenário em Askavik.', sombra: 1 },
        { t: 'Ratos? Eu esperava algo maior.', a: 'Todo herói começou matando rato. Os que acharam pouco, morreram de febre.' } ] },
      'Três ratazanas. Segure a espada com as duas mãos se precisar. Ninguém aqui vai rir.',
    ],
    done: [
      'Três rabos vermelhos. Nada mal para quem acordou hoje.',
      'Escute: o cemitério não estava assim antes. Os mortos de lá nunca foram silenciosos, mas os ratos nunca foram tantos.',
      { r: [
        { t: 'O que mudou no cemitério?', a: 'Se eu soubesse, não estaria mandando aprendiz. O Eldrin, do templo, sabe mais. Um dia ele vai querer falar com você.' },
        { t: 'Só quero saber o que vem depois.', a: 'Depois vem o inverno. E a Lúcia está precisando de ajuda com ele.' } ] },
    ],
  },
  n02: {
    talk: [
      'Ah, você é quem o Garrick mandou? Ele disse que você tem mão boa.',
      'Eu sou a Lúcia. Meu fogão come lenha que nem gente com fome, e o inverno aqui chega antes do que se espera.',
      'Meu marido costumava trazer, mas ele… anda pela mata. Vai voltar logo.',
      { r: [
        { t: 'Vou buscar a lenha. E se ele demorar, me avise.', a: 'Você é bom, sabia? Pouca gente pergunta.', luz: 2, flag: 'lucia_ouvida' },
        { t: 'Galhos, então. Quantos?', a: 'Seis secos. Os verdes fazem fumaça e choram no fogo.' } ] },
      'Seis galhos secos, das árvores em volta da vila. É só chegar perto e apertar E.',
    ],
    done: [
      'Seis, e bem secos! Esta noite a casa fica quente.',
      'Tome um pão. Não é muito, mas é feito com o que eu tenho.',
      'O Thorin, o mercador da praça, vive dizendo que ninguém traz couro. Talvez ele pague você em coisa melhor que pão.',
    ],
  },
  n03: {
    talk: [
      'Hum. Um humano querendo trabalho. Vocês sempre querem trabalho quando o frio aperta.',
      'Thorin, filho de Thrain, mercador e dono da única balança honesta desta vila. Sim, eu disse honesta.',
      'Couro. Cervo ou lobo. Os caçadores daqui ficaram moles e os de Askavik cobram o olho da cara.',
      { r: [
        { t: 'Trago o couro, e confio na sua balança.', a: 'Confia, é? Bom. Confiança é a moeda que não enferruja.', luz: 1 },
        { t: 'Trago, mas eu mesmo peso.', a: 'Ha! Desconfiado. Gosto disso num humano. Mas a balança é minha.', sombra: 1 },
        { t: 'Por que um anão vende tão longe das montanhas?', a: 'Porque as montanhas já têm anões demais vendendo. E porque aqui ninguém sabe o preço do ferro.' } ] },
      'Três peças. E não me traga couro rasgado de espada: esfole com a faca, como gente.',
    ],
    done: [
      'Deixe ver… couro bom. Cortado direito, até.',
      'Aqui está o pagamento. Contado na sua frente, para você não sair falando de anão por aí.',
      'O Garrick passou aqui procurando você. Disse que a estrada está ficando feia.',
    ],
  },
  n04: {
    talk: [
      'A estrada do sul é o que liga Karmika ao resto do mundo. Sem ela, a gente come rato.',
      'Os coiotes aprenderam a cercar carroça. Já perdemos dois carregamentos de sal e um menino de recados quase não voltou.',
      { r: [
        { t: 'O menino está bem?', a: 'Com a perna costurada e um medo que vai demorar a sair. Obrigado por perguntar.', luz: 2 },
        { t: 'Coiotes não vão me parar.', a: 'Não vão. Mas em bando eles cansam qualquer um. Lute de costas para uma árvore.' } ] },
      'Cinco coiotes. Eles fogem quando perdem metade do bando: não deixe fugir.',
    ],
    done: [
      'A estrada respira. As carroças vão voltar a passar.',
      'O Eldrin pediu para ver você. Ele não chama ninguém à toa.',
      { r: [
        { t: 'O que o Eldrin quer comigo?', a: 'Ele sente coisas. Diz que há almas que chegam a Karmika carregando mais do que a bagagem. Vá descobrir.' },
        { t: 'Mais um velho com recado.', a: 'Esse velho já salvou a vila duas vezes. Fale com respeito.', sombra: 1 } ] },
    ],
  },
  n05: {
    talk: [
      'Entre, entre. O templo não tem porta para quem caminha.',
      'Sou Eldrin. Leio o que a terra conta e o que os mortos deixam de contar.',
      'Você tem um olho fechado dentro de você, {nome}. Ainda não sabe disso. Um dia, Marghar vai abri-lo, e tudo o que você fez até lá vai ser pesado.',
      { r: [
        { t: 'Quem é Marghar?', a: 'O que guarda o Labirinto. Não julga, não perdoa. Vê, e guarda. E um dia, cobra.' },
        { t: 'Então até lá eu faço o que quiser?', a: 'Pode fazer. Mas o Olho não esquece só porque está fechado.', sombra: 1 },
        { t: 'Vou tentar ser alguém que mereça esse olho.', a: 'Tentar já é mais do que a maioria faz.', luz: 2 } ] },
      'Vá ao Cemitério Esquecido. Não para lutar: para sentir. Fique lá um instante e volte me contar o que sentiu.',
    ],
    done: [
      'Você voltou com a cara de quem ouviu alguém chamando sem ver quem.',
      { r: [
        { t: 'Senti que alguém ali está preso.', a: 'Sim. Há almas que não descem nem sobem. Ficam. E o que fica, apodrece.', luz: 1 },
        { t: 'Senti frio. Só isso.', a: 'O frio é como os mortos falam com quem ainda não aprendeu a ouvir.' } ] },
      'Guarde essa sensação. Ela vai voltar. Agora vá ao Doran: alma sem ferramenta não atravessa inverno.',
    ],
  },
  n06: {
    talk: [
      'Doran. Armeiro.',
      'Espada não se ganha. Se faz. E antes da espada, o machado.',
      { r: [
        { t: 'Me ensine.', a: 'Pedra, cabo, corda. Junte as pedras. O resto você descobre fazendo.', luz: 1 },
        { t: 'Não posso só comprar um?', a: 'Pode. E vai quebrar na primeira árvore, porque não sabe como foi feito.' } ] },
      'Quatro pedras. Depois abra o menu de ofícios e faça um Machado de Pedra. Me mostre.',
    ],
    done: [
      'Hm. Torto.',
      'Mas segura. É seu. Isso conta.',
      'O Garrick quer você na linha de frente. Tome uma pederneira: fogo é a primeira arma.',
    ],
  },
  n07: {
    talk: [
      'A alcateia do leste dobrou de tamanho. Lobos não fazem isso sozinhos: alguma coisa empurrou eles para cá.',
      'Seis lobos. E repare nos olhos deles: se estiverem vermelhos, volte e me conte.',
      { r: [
        { t: 'E se for alguma coisa empurrando eles, eu vou atrás.', a: 'Calma. Primeiro os lobos. Depois a gente pensa no que vem atrás.' },
        { t: 'Lobos têm filhotes. Mato só os que atacarem.', a: 'Se você conseguir separar um do outro numa briga, é melhor do que eu.', luz: 2, flag: 'lobos_poupados' },
        { t: 'Quanto mais pele, melhor. O Thorin compra.', a: 'Compra. Mas não faça da caçada uma feira.', sombra: 1 } ] },
    ],
    done: [
      'Seis a menos. A vila vai dormir.',
      { r: [
        { t: 'Alguns estavam magros demais. Estão fugindo de algo.', a: 'Foi o que pensei. Do norte não vem nada bom há tempo.', luz: 1 },
        { t: 'Lobos são lobos.', a: 'Até o dia em que não são.' } ] },
      'A Lúcia veio aqui chorando. Vá ver o que é.',
    ],
  },
  n08: {
    talk: [
      'Você… desculpe, eu não queria que me vissem assim.',
      'Meu marido foi caçar ao norte faz seis dias. Ele sempre volta em dois.',
      'Os caçadores dizem que viram luz na Igreja Abandonada. Ninguém vai lá. Dizem que os puglins tomaram tudo.',
      { r: [
        { t: 'Eu vou encontrá-lo. Vivo, se puder.', a: 'Por favor. Ele tem um lenço azul no pescoço. Fui eu que fiz.', luz: 3, flag: 'promessa_lucia' },
        { t: 'Seis dias na mata… a senhora precisa se preparar para o pior.', a: 'Eu sei. Mas eu preciso saber. Não aguento mais não saber.' },
        { t: 'E o que eu ganho indo até lá?', a: 'Eu… tenho uma poção guardada. É tudo o que tenho. Se quiser, é sua.', sombra: 2, flag: 'cobrou_lucia' } ] },
    ],
    done: [
      'Você achou? Você… achou alguma coisa?',
      { r: [
        { t: 'Achei o lenço azul na igreja. Ele lutou até o fim.', a: ['Ele… lutou. Claro que lutou. Era teimoso.', 'Obrigada por me trazer a verdade. Dói, mas é a verdade.'], luz: 2, flag: 'verdade_lucia' },
        { t: 'Não achei nada. Talvez ele ainda esteja vivo.', a: ['Então eu espero. Vou esperar na porta todas as noites.', '(Você sabe que deixou uma mulher esperando um morto.)'], sombra: 2, flag: 'mentiu_lucia' },
        { t: 'Ele está morto. Não há o que fazer.', a: 'Você… nem olhou nos meus olhos para dizer.', sombra: 1, flag: 'frio_lucia' } ] },
      'Tome a poção. Não discuta.',
    ],
  },
  n09: {
    talk: [
      'Cabos. Preciso de madeira de lei para os cabos.',
      'Dez toras. Corte com o machado que você fez.',
      { r: [
        { t: 'Corto só árvore velha. As novas ficam.', a: 'Lenhador que pensa no amanhã. Raro.', luz: 1 },
        { t: 'As maiores dão mais madeira.', a: 'Dão. E levam cem anos para crescer de novo. Faça o que achar.' } ] },
    ],
    done: [
      'Boa madeira.',
      'A Lúcia… o Garrick me contou. Você foi lá. Isso é o que faz alguém ser alguém aqui.',
      'O Eldrin está te esperando. Disse que é sobre luz no escuro.',
    ],
  },
  n10: {
    talk: [
      'As fadas maliciosas guardam um pó que brilha no escuro. Elas não nasceram más, {nome}. Ficaram assim.',
      'Esse pó é o que restou da luz delas. Preciso estudá-lo para entender o que está apodrecendo a mata.',
      { r: [
        { t: 'Se elas eram boas, dá para trazer de volta?', a: 'Talvez. É por isso que eu preciso do pó. Para saber se ainda há luz para salvar.', luz: 2 },
        { t: 'Pó que brilha deve valer um bom ouro.', a: 'Vale. E vale mais nas mãos de quem vai usá-lo para curar do que nas de quem vai vendê-lo.', sombra: 1 } ] },
      'Quatro medidas. Elas são rápidas e mordem. Não subestime coisa pequena.',
    ],
    done: [
      'Veja como brilha… e veja o escuro no meio do brilho.',
      'É o que eu temia: algo mais velho que as fadas está comendo a luz da mata. Começou pelo Guardião.',
      { r: [
        { t: 'O Guardião da Mata? Ele é a própria floresta.', a: 'Era. Se ele adoecer, a mata inteira adoece com ele.' },
        { t: 'Então vamos matar o que está doente.', a: 'Às vezes é o único remédio. Às vezes é só o mais fácil.' } ] },
      'Leve duas poções. Vai precisar.',
    ],
  },
  n11: {
    talk: [
      'Javalis no pântano, fuçando as plantações até a raiz. Mais um pedaço do mesmo problema: os bichos estão fugindo da mata.',
      { r: [
        { t: 'Matar os javalis não resolve a causa.', a: 'Não. Mas a causa não come o nosso milho. Os javalis comem. Seis.', luz: 1 },
        { t: 'Seis javalis. Vou.', a: 'Cuidado com a investida. Javali não desvia: quem desvia é você.' } ] },
    ],
    done: [
      'As plantações vão aguentar o inverno.',
      'O Thorin anda falando de um negócio arriscado. Seiva do Guardião. Ele vai querer você para isso.',
      { r: [
        { t: 'Arrancar seiva de um guardião doente parece errado.', a: 'Parece. Fale com o Thorin e decida você. Eu não sou seu pai.', luz: 1 },
        { t: 'Arriscado costuma pagar bem.', a: 'Costuma. E costuma enterrar quem pensa assim.', sombra: 1 } ] },
    ],
  },
  n12: {
    talk: [
      'Ah, você. Feche a porta. O que eu vou dizer não é para a praça.',
      'A seiva viva do Guardião da Mata. Uma medida vale mais que tudo o que vendo num ano. Os alquimistas de Askavik pagam qualquer preço.',
      'Ele está doente, eu sei. Se está morrendo, que a seiva sirva para alguma coisa.',
      { r: [
        { t: 'Trago a seiva. Mas metade do lucro vai para a vila.', a: 'Metade?! … Hmpf. Um quarto. E eu não conto a ninguém que você é mole.', luz: 2, flag: 'seiva_dividida' },
        { t: 'Trago. E quero a minha parte em ouro, não em promessa.', a: 'Agora sim, um humano que entende de negócio.', sombra: 2, flag: 'seiva_negocio' },
        { t: 'Vou buscar a seiva para o Eldrin estudar a doença.', a: 'O Eldrin, o Eldrin… está bem. Ele analisa primeiro. Depois eu vendo o que sobrar.', luz: 1 } ] },
      'Uma medida. E volte inteiro: cadáver não cobra dívida.',
    ],
    done: [
      'Seiva viva… sinta como pulsa. Ainda está viva dentro do frasco.',
      'É verdade, então: o Guardião sangra. Alguém tem que contar ao Garrick.',
    ],
  },
  n13: {
    talk: [
      'Os lenhadores voltaram da mata sem dois companheiros. O Guardião da Mata enlouqueceu: arranca árvore pela raiz e esmaga quem estiver perto.',
      'Ele protegeu esta vila antes de existir vila. Eu sei disso. Mas eu protejo quem está vivo agora.',
      { r: [
        { t: 'E se houver um jeito de curá-lo?', a: 'Se houver, você vai ver nos olhos dele quando ele cair. Decida lá. Mas não volte sem decidir.', luz: 2 },
        { t: 'Árvore velha que mata gente vira lenha.', a: 'Fale isso baixo perto do Eldrin.', sombra: 1 },
        { t: 'Vou. E vou forte.', a: 'Nível 20 no mínimo. Eu já enterrei aprendiz corajoso demais.' } ] },
    ],
    done: [
      'Acabou?',
      { r: [
        { t: 'Ele está em paz. A mata vai voltar a crescer.', a: 'Então ele descansou. Que bom que foi você.', luz: 1 },
        { t: 'Ele caiu. Era ele ou os lenhadores.', a: 'Era. E você escolheu os vivos. Ninguém aqui vai te culpar.' } ] },
      'Seu olho… {nome}, seu olho está diferente. O Eldrin vai querer ver isso.',
    ],
  },
  n14: {
    talk: [
      'O Olho se abriu em você. Eu vi no instante em que você entrou.',
      'Agora tudo o que você faz é pesado. Tudo o que você fez também. É por isso que eu preciso te contar o que sinto nas ruínas.',
      'Diabretes. Saem das ruínas como se alguém tivesse aberto uma porta lá embaixo. Eles não são daqui.',
      { r: [
        { t: 'Quem abriria essa porta?', a: 'Alguém que quer o que o Sem-Passo oferece: poder sem caminho. Há sempre quem queira.' },
        { t: 'Eu fecho a porta. Seja quem for.', a: 'Primeiro os diabretes. Cinco. Depois a porta.', luz: 1 } ] },
    ],
    done: [
      'Cinco. Mas a porta continua aberta, eu sinto.',
      'O Garrick sabe de onde eles vêm. Ninguém fala o nome em voz alta nesta vila: o Príncipe das Cinzas.',
    ],
  },
  n15: {
    talk: [
      'A Igreja Abandonada. Onde você encontrou o lenço azul.',
      'Ali reina uma coisa que se chama Príncipe das Cinzas. Foi gente um dia. Fez um pacto e virou o que é.',
      { r: [
        { t: 'Ele matou o marido da Lúcia. Vou por ele.', a: 'Então vá por ele. Raiva serve, desde que você mande nela.', luz: 1 },
        { t: 'Um príncipe deve ter um tesouro.', a: 'Tem. Cinzas. E os ossos de todo mundo que foi lá pelo tesouro.', sombra: 1 },
        { t: 'O que ele quer?', a: 'O que todo pactuado quer: mais. Mais almas, mais cinza, mais trono.' } ] },
      'Nível 24. Não discuta comigo nisso.',
    ],
    done: [
      'O Príncipe das Cinzas caiu.',
      'Karmika vai cantar isso por gerações. E eu vou ter que aprender a música, porque vão me obrigar a cantar.',
      { r: [
        { t: 'Não fiz para que cantassem.', a: 'Eu sei. É por isso que vão cantar.', luz: 2 },
        { t: 'Que cantem alto. E que paguem bem.', a: 'Ha. O Thorin vai gostar de você.', sombra: 1 } ] },
    ],
  },
  n16: {
    talk: [
      'Você chegou aqui sem saber segurar uma espada. Agora o povo para na rua quando você passa.',
      'Existe um juramento antigo. Dos que guardaram esta terra antes de nós. Eu quero tomar o seu.',
      { r: [
        { t: 'Juro proteger estas terras, venha o que vier.', a: 'Então é Caminhante do Norte. Pela palavra e pelo sangue.', luz: 3, flag: 'jurou_norte' },
        { t: 'Juro proteger o que for meu.', a: 'É um juramento menor. Mas é honesto. Caminhante do Norte, então.', sombra: 1, flag: 'jurou_si' },
        { t: 'Não juro nada. Mas fico.', a: 'Ficar já é uma forma de jurar. O título é seu mesmo assim.' } ] },
    ],
    done: [
      'Caminhante do Norte. Use o nome com cuidado: ele pesa.',
      'O que você vai ser, a Vidente de Askavik ajuda a descobrir. Quem você é, já provou aqui.',
    ],
  },
  /* ---------------- Askavik ---------------- */
  a01: {
    talk: [
      'O Olho despertou em você, e Karmika ficou pequena. Eu sabia que esse dia chegaria.',
      'Em Askavik, a cidade de pedra a nordeste, ficam as escolas de todas as ordens: a Escola de Guerra, a Forja, a Igreja Kármica, a Universidade dos Mil Mecanismos.',
      'Lá, um dia, você vai escolher o que ser. Ou vai descobrir que já tinha escolhido.',
      { r: [
        { t: 'Vou sentir falta de Karmika.', a: 'Karmika vai sentir a sua. Volte quando puder. O templo não tem porta.', luz: 1 },
        { t: 'Finalmente uma cidade de verdade.', a: 'Cidade grande, olhos grandes. Lá ninguém te conhece, e todos te medem.' } ] },
      'Siga as placas pela estrada e apresente-se ao Mestre Halvard, na Escola de Guerra.',
    ],
    done: [
      'Então você é o Caminhante que o velho Eldrin mandou. Ele escreve bem, para um sacerdote.',
      'Bem-vindo a Askavik. Aqui ninguém entra numa escola sem antes servir a cidade.',
    ],
  },
  a02: {
    talk: [
      'Askavik tem quatro portões, e nenhum caiu em trezentos anos. Sabe por quê? Porque quem mora aqui trabalha para isso.',
      'Os mortos do campo santo estão andando pela estrada de Grenivik. Esqueletos. Coisa velha que não devia estar de pé.',
      { r: [
        { t: 'Quem levanta os mortos?', a: 'Pergunta certa. Ninguém sabe. E é isso que me tira o sono.' },
        { t: 'Esqueleto não sente dor. Eu também não vou sentir.', a: 'Fanfarrão. Gosto. Leve um escudo mesmo assim.', sombra: 1 },
        { t: 'Grenivik tem famílias. Vou primeiro por elas.', a: 'Por elas, sim. Askavik é feita de gente, não de pedra.', luz: 2 } ] },
      'Vá a Grenivik, derrube dez, e leve o relatório ao Jarl Haakon, no castelo. Ele gosta de ouvir da boca de quem lutou.',
    ],
    done: [
      'O Halvard mandou você? Então fale. Sem floreio: sou jarl, não poeta.',
      { r: [
        { t: 'Dez esqueletos. Eles vinham do norte, em fila, como soldados.', a: 'Em fila… então alguém os comanda. Isso é pior do que eu pensava.', luz: 1 },
        { t: 'Foi fácil. Quero algo à altura.', a: 'Vai ter. Askavik não desperdiça braço.', sombra: 1 } ] },
    ],
  },
  a03: {
    talk: [
      'Os lobos gélidos desceram da cordilheira e cercam as caravanas no passo. Sem caravana, a cidade passa fome em dois meses.',
      'Dez lobos. E cinco garras: os sentinelas penduram nos portões. Lobo entende recado.',
      { r: [
        { t: 'E as caravanas? Alguém foi ferido?', a: 'Uma da Companhia de Latão perdeu dois cocheiros. Os tecnocratas estão furiosos.', luz: 1 },
        { t: 'Garras nos portões. Gosto do estilo.', a: 'Não é estilo. É aviso. O norte só entende aviso.' } ] },
    ],
    done: [
      'Os lobos recuaram. Vi das ameias.',
      'Agora o pior. Há algo na Clareira de Selvar que eu não digo o nome em voz alta.',
    ],
  },
  a04: {
    talk: [
      'Mandei três patrulhas para a Clareira de Selvar. Voltou um homem. Ele não fala mais. Só desenha bocas.',
      'Carniçais. E um que manda neles. Os soldados chamam de Carniceiro.',
      { r: [
        { t: 'O soldado que voltou… posso falar com ele?', a: 'Pode. Ele não vai responder. Mas talvez faça bem a ele ver alguém que vai lá.', luz: 2, flag: 'visitou_soldado' },
        { t: 'Quanto vale a cabeça do Carniceiro?', a: 'Vale o título de Escudo de Askavik. Para alguns, isso vale mais que ouro.', sombra: 1 },
        { t: 'Vou e volto.', a: 'Nível 28. Não vá antes. Não quero desenhar mais bocas.' } ] },
    ],
    done: [
      'O Jarl mandou você até mim de volta. Conte.',
      { r: [
        { t: 'O Carniceiro caiu. A clareira está limpa.', a: 'Então Askavik te deve. Escudo de Askavik: é assim que a cidade vai te chamar.', luz: 1 },
        { t: 'Havia mais carniçais do que vocês contaram. Alguém os alimenta.', a: 'Alguém os alimenta… Guarde isso. Vamos precisar dessa informação.', flag: 'carnical_alimentado' } ] },
      'Agora vá à Velha Gunnhild, na praça. Antes de qualquer escola, você precisa saber quem você é.',
    ],
  },
  p01: {
    talk: [
      'Hmm. Deixe a velha olhar para você. Mais perto.',
      'Gunnhild, guardiã das relíquias. Vi muitos caminhantes chegarem. Poucos sabiam o que queriam. Os que sabiam, mentiam.',
      'Você conhece Askavik: as escolas, a igreja, o mercado, os mestres. Falta o mais difícil: saber quem você é.',
      { r: [
        { t: 'Eu sei quem sou.', a: 'Todo mundo acha que sabe, até a Vidente abrir a boca.' },
        { t: 'Tenho medo do que a Vidente vai ver.', a: 'Medo é bom. Quem não tem medo da própria alma não olhou direito para ela.', luz: 2 },
        { t: 'Só quero o poder que vem com a escolha.', a: 'Poder vem. Mas cada caminho cobra o seu preço. Lembre-se disso quando ela falar.', sombra: 2 } ] },
      'No santuário de pedras a oeste da praça mora Hrefna, a Vidente da Deusa dos Caminhos. No nível 30, ela lê a sua alma.',
    ],
    done: [
      'A Deusa leu você, então.',
      'O que ela viu não é uma corrente. Em Karmika, quem escolhe é você. Lembre-se disso quando o caminho ficar escuro.',
    ],
  },
  /* ---------------- Luz: as Mãos da Igreja (Irmã Maela) ---------------- */
  lz1: {
    talk: [
      'Você tem cara de quem ainda não perdeu a vergonha de ajudar. Isso é raro em Askavik.',
      'Sou a Irmã Maela. Cuido dos doentes da Igreja Kármica. Marghar não cura ninguém: quem cura são as mãos. E eu estou com poucas.',
      'A febre do pântano subiu até Grenivik junto com os mortos que andam. As crianças queimam a noite toda.',
      { r: [
        { t: 'Do que a senhora precisa?', a: 'Flor-de-Campo. Seis. Com ela eu faço o chá que baixa a febre.', luz: 1 },
        { t: 'Por que a Igreja não paga um herbalista?', a: 'Porque a Igreja tem ouro para vitrais e não tem para chá. Não me faça falar mal da minha própria casa.' } ] },
    ],
    done: [
      'Flores boas, colhidas com cuidado. Você não arrancou a raiz.',
      'Esta noite, em Grenivik, alguma mãe vai dormir. Você não vai ver, mas vai ter acontecido.',
      { r: [
        { t: 'Isso basta para mim.', a: 'Então você é dos que a Igreja precisa. Tenho mais uma coisa a pedir. Mais difícil.', luz: 2 },
        { t: 'Da próxima vez, quero ser pago direito.', a: 'Justo. Da próxima vez, cobre de quem tem. Eu não tenho.' } ] },
    ],
  },
  lz2: {
    talk: [
      'Uma caravana da Companhia de Latão foi atacada pelos lobos no passo. Só um menino sobreviveu.',
      'Ele está escondido em Kaldrfoss. Não deixa ninguém chegar perto. Viu os pais morrerem e acha que todo adulto traz a morte junto.',
      { r: [
        { t: 'Vou buscá-lo. Devagar, sem espada na mão.', a: 'É assim mesmo. Fale baixo. Diga o seu nome antes de chegar perto.', luz: 2 },
        { t: 'E os lobos?', a: 'Os lobos ainda rondam. Cinco, os caçadores contaram. Primeiro eles, depois o menino.' } ] },
    ],
    done: [
      'Ele veio. Você trouxe ele.',
      'Ele não falou nada a viagem inteira, não foi? Mas segurou a sua mão. Eu vi da janela.',
    ],
  },
  /* ---------------- Sombra: a Dívida de Vesna ---------------- */
  sh1: {
    talk: [
      'Ora, ora. Os olhos de quem já fez escolhas de que não se orgulha. Eu reconheço de longe.',
      'Vesna Corvo-Negro. Empresto dinheiro a quem os santos não emprestam. E cobro de quem os santos perdoam.',
      'Um ferreiro de Hrafnhöfn me deve trinta moedas e um favor. Faz seis meses. Ele acha que eu esqueci.',
      { r: [
        { t: 'Trinta moedas não valem a viagem.', a: 'Não são as moedas, querido. É o recado. Se um não paga, nenhum paga.' },
        { t: 'Eu cobro. E quero a minha parte.', a: 'Assim que eu gosto. Metade do que ele pagar além da dívida é seu.', sombra: 2 },
        { t: 'E se ele não tiver como pagar?', a: 'Todo mundo tem como pagar. Só falta descobrir com o quê.', sombra: 1 } ] },
      'Vá a Hrafnhöfn. Como você vai lembrar a ele da dívida, é problema seu. Depois volte e me conte.',
    ],
    done: [
      'E então? Hrafnhöfn ainda tem um ferreiro, ou tem um ferreiro a menos?',
    ],
  },
  sh2: {
    talk: [
      'Notícia boa, notícia ruim. A ruim: uma carroça da Companhia de Latão tombou no passo. Os cocheiros morreram.',
      'A boa: a carga não tem dono. Ainda. Daqui a dois dias a Companhia manda gente, e aí tem.',
      { r: [
        { t: 'Saquear mortos não é o meu tipo de trabalho.', a: 'Não são mortos, são caixas. E os lobos vão saquear antes de você, se você demorar.', luz: 1 },
        { t: 'Quanto vale a carga?', a: 'Mais do que você ganha em um mês matando rato para a vila. Bem mais.', sombra: 2 },
        { t: 'E se a Companhia descobrir?', a: 'A Companhia vai descobrir que os lobos comeram tudo. Lobo come qualquer coisa, sabia?', sombra: 1 } ] },
      'Seis lobos rondam a carroça. Afaste-os, pegue as caixas, e traga para mim.',
    ],
    done: [
      'Você voltou com as mãos cheias e a cara de quem leu alguma coisa que não devia.',
    ],
  },
};

/* ---------- Ecos: o mundo lembra. Quando o herói carrega uma marca, estes NPCs falam disso (uma vez, ao abrir a conversa) ---------- */
export const ECOS: Record<string, Record<string, string>> = {
  lucia_ouvida: { 'Lúcia': 'Ninguém nesta vila pergunta como eu estou. Você perguntou. Eu não esqueci.' },
  verdade_lucia: { 'Lúcia': 'Enterrei o lenço azul no jardim, debaixo da macieira. Obrigada por não me deixar esperando.', Garrick: 'A Lúcia está mais em paz. Você fez o mais difícil, que foi contar.' },
  mentiu_lucia: { 'Lúcia': 'Toda noite eu deixo a vela acesa na janela. Ele vai ver a luz e vai voltar. Não vai?', Garrick: 'A Lúcia ainda espera na porta, toda noite. Você sabe alguma coisa que ela não sabe?', Eldrin: 'Uma mentira gentil continua sendo uma mentira, {nome}. O Olho guardou.' },
  cobrou_lucia: { Thorin: 'Ouvi dizer que você cobrou da viúva para procurar o marido dela. Até eu teria vergonha. Até eu.', Garrick: 'Cobrou da Lúcia, foi? Aqui a gente ajuda de graça. Lembre-se disso.' },
  frio_lucia: { 'Lúcia': 'Você podia ter olhado nos meus olhos. Era só isso.' },
  lobos_poupados: { Garrick: 'Os caçadores viram filhotes de lobo perto da trilha do leste. Disseram que alguém deixou eles viverem. Foi você?' },
  seiva_dividida: { Thorin: 'Um quarto do lucro da seiva foi para o celeiro da vila. Não conte a ninguém que um anão fez caridade.' },
  seiva_negocio: { Eldrin: 'O Thorin ficou mais rico e a mata, mais doente. Você ajudou um dos dois.', Thorin: 'Sócio! Os alquimistas de Askavik ainda perguntam por mais seiva. Pense nisso.' },
  jurou_norte: { Garrick: 'Caminhante do Norte. O povo fala o seu nome com respeito. Não me faça me arrepender.' },
  jurou_si: { Garrick: 'Você jurou proteger o que é seu. Espero que um dia Karmika seja sua.' },
  visitou_soldado: { 'Mestre Halvard': 'O soldado que voltou da clareira desenhou uma coisa nova ontem: um escudo. Acho que foi por sua causa.' },
  ferreiro_martelo: { 'Irmã Maela': 'Um ferreiro de Hrafnhöfn veio pedir pão na Igreja. Disse que alguém levou o martelo dele. Você sabe quem foi?' },
  voto_quebrado: { Eldrin: 'Você jurou. Ninguém pediu, e você jurou. É por isso que pesa tanto quando quebra.', Garrick: 'Dizem que você quebrou um voto. Aqui no norte, isso se carrega até o túmulo.', 'Vesna Corvo-Negro': 'Ouvi dizer que você quebrou um voto. Bem-vindo ao mundo real, querido.' },
  carnical_alimentado: { 'Jarl Haakon': 'Mandei olhos descobrirem quem alimenta os carniçais de Selvar. Ainda nada. Mas você estava certo, e eu não esqueço quem está certo.' },
};
/** quem fica frio com quem tem a alma pendendo para o outro lado (fala de abertura, às vezes) */
export const FRIO: Record<'luz' | 'sombra', { quem: string[]; falas: string[] }> = {
  sombra: { quem: ['Eldrin', 'Lúcia', 'Garrick', 'Irmã Ysolde', 'Paladino Aldric', 'Mestre Halvard'], falas: ['Hm. Você mudou, {nome}. Não sei se gosto do que estou vendo.', 'Fale rápido. Tenho mais o que fazer.', 'Os seus olhos estão mais frios do que da última vez.'] },
  luz: { quem: ['Thorin', 'Velha Gunnhild'], falas: ['Ah, o santinho. Veio comprar ou rezar?', 'Gente boa demais não dura muito por aqui, {nome}. Cuidado.'] },
};
