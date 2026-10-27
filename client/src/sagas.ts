/* ---------- As sagas 30–40 do Paladino, do Vampiro e do Tecnocrata (24/10, aprovadas pelo Erling: "pode implantar tudo, BEM FEITO").
   Três vidas que se cruzam: a Ordem de Auréon caça os filhos do Conde; a Corte do Conde compra relógios da Academia;
   a Academia vende para os dois pela Companhia das Caravanas de Latão — e cada lado manda o seu herói mexer na carga do outro.
   Toda missão tem conversa ao pegar e ao entregar; os encontros no caminho (objetivo "falar com") têm diálogo próprio.
   As respostas mexem na Luz e na Sombra; as escolhas da entrega mexem no karma e deixam marcas que o mundo lembra (ECOS).
   Vozes: Cassius é velho, quente e grave; Lady Mirela é educada como uma lâmina; Ylva fala em números e não pede desculpas;
   Brunna é comerciante sem rodeios; a Bispa Solveig desconfia de engrenagens; Aldric é sincero até doer. ---------- */
import type { QuestDef } from './quests';
import { ECOS } from './falas';

const CS = 'Grão-Mestre Cassius', MI = 'Lady Mirela', YL = 'Arquiteta Ylva', BR = 'Feitora Brunna', SO = 'Bispa Solveig', AL = 'Paladino Aldric', VL = 'Conde Vladislav III', IL = 'Mestra Ilsa Van Rhal', TB = 'Irmão Tobias', OR = 'Mestre Orvald';

/* ======================= O PALADINO — "A Luz que Guarda" ======================= */
const PC = 'A Luz que Guarda';
export const PALADIN: QuestDef[] = [
  { id: 'pa1', chain: PC, name: 'O Voto da Aurora', lvl: 30, giver: CS, req: 'v_pal', next: 'pa2', xp: 0, gold: 220, items: [['potion_g', 3]],
    text: 'Vigília na Abadia da Aurora até o amanhecer. Os mortos sobem a colina para apagar as velas: dez deles não podem chegar à capela.',
    objs: [{ kind: 'visit', poi: 'Abadia da Aurora' }, { kind: 'kill', type: 'zombie', n: 10 }],
    talk: [
      'Então a Vidente mandou mais um. Sente-se, {nome}. Joelho no chão não é humilhação aqui; é descanso.',
      'Passar na prova do Aldric faz de você alguém que sabe segurar um escudo. Não faz de você um paladino. O voto faz.',
      'Esta noite você guarda a capela até o sol nascer. Os mortos sobem a colina sempre que alguém jura. Eles odeiam promessas.',
      { r: [
        { t: 'Que subam. Eles não passam por mim.', a: 'Bom. Mas lembre: você não está ali para matar mortos. Está ali para que as velas fiquem acesas.', luz: 1 },
        { t: 'Por que os mortos odeiam promessas?', a: 'Porque morreram com as delas pela metade. Uma promessa cumprida é tudo o que eles não tiveram.', luz: 1 },
        { t: 'E se eu não aguentar até o amanhecer?', a: 'Então você vai descobrir que ninguém aguenta sozinho. É a primeira lição da Ordem.' } ] },
      'Dez deles. Depois, volte aqui e diga o seu voto em voz alta. Auréon ouve melhor de manhã.',
    ],
    done: [
      'O sol nasceu e as velas continuam acesas. Você está sujo de terra de cova e cheira a cera. É assim que todo paladino começa.',
      'Agora o voto. Não existe voto certo. Existe o voto que você vai conseguir carregar por mil manhãs.',
    ],
    choice: { q: 'Com a mão sobre a chama da vela, você jura proteger…', opts: [
      { label: '“…os que pedem. Qualquer um que pedir.”', karma: 6, flag: 'pal_voto_pedem', say: 'Qualquer um. Até quem não merece. É o voto mais pesado da Ordem, e o mais antigo.', why: 'Proteger sem perguntar quem merece é a forma mais pura de luz. Também é a mais cara.' },
      { label: '“…os que merecem.”', karma: 2, flag: 'pal_voto_merecem', say: 'Então você vai ter que julgar. Julgue devagar, criança. A espada é rápida demais.', why: 'Proteger quem merece ainda é proteger. Mas quem decide o merecimento carrega um peso que a luz não divide.' },
      { label: '“…a Ordem, acima de tudo.”', karma: -2, flag: 'pal_voto_ordem', say: '…A Ordem agradece. Eu, menos. Ordens erram, {nome}. Pessoas também. Mas pessoas pedem desculpas.', why: 'Lealdade a uma instituição não é crime. Mas você jurou por paredes, não por gente.' } ] } },

  { id: 'pa2', chain: PC, name: 'Sinos que Não Tocam', lvl: 31, giver: CS, next: 'pa3', xp: 0, gold: 230,
    text: 'Os sinos mecânicos da Abadia pararam. O Irmão Tobias, o sineiro, sabe qual peça quebrou. Leve o recado dele à Feitora Brunna, no balcão da Companhia de Latão, fora do portão sul de Askavik.',
    objs: [{ kind: 'talk', npc: TB }, { kind: 'talk', npc: BR }],
    talk: [
      'Ouviu o silêncio hoje de manhã? A Abadia acorda Austrvik há trezentos anos. Hoje não acordou ninguém.',
      'Os sinos eram de bronze. Há dez anos, a Academia de Askavik trocou tudo por engrenagens. Tocam sozinhos, na hora certa, sem um velho subindo a torre no gelo.',
      'Funcionam melhor. Quando funcionam.',
      { r: [
        { t: 'Por que a Ordem compra de tecnocratas?', a: 'Porque o Irmão Tobias tem setenta anos e uma torre de cento e vinte degraus. Fé não sobe escada no lugar dele.', luz: 1 },
        { t: 'Engrenagem em igreja… isso não ofende Auréon?', a: 'Auréon fez o ferro, o fogo e a mão que os junta. O que ofende é sino parado.' } ] },
      'Fale com o Tobias, aqui na vila. Ele vai dizer o que quebrou. Depois leve à Companhia: eles trazem a peça.',
    ],
    meet: {
      [TB]: [
        'Ah! O novo irmão. Ou irmã? Os meus olhos já não separam muito bem.',
        'Foi a roda de escape. Uma pecinha deste tamanho. Sem ela, o martelo não sabe quando bater.',
        'Eu subi, olhei, e chorei um pouco. Não pela peça. Pelo silêncio. Trezentos anos, {nome}.',
        { r: [
          { t: 'Eu trago a peça, irmão. A Abadia vai tocar de novo.', a: 'Que Auréon te pague em manhãs claras.', luz: 1 },
          { t: 'Você não quer voltar a tocar com a corda, como antes?', a: 'Quero. Mas os meus joelhos não querem. A gente envelhece e aceita ajuda de quem não gosta.' } ] },
        'Diga à Companhia: roda de escape, modelo sete da Academia. Eles vão entender.',
      ],
      [BR]: [
        'Roda de escape, modelo sete. Para a Abadia, não é? A Ordem está pagando com atraso de novo.',
        'Não me olhe assim. A Companhia leva qualquer coisa a qualquer lugar. O preço é o caminho, e o caminho não reza.',
        'Mando a peça na próxima carroça para Austrvik. Mas fique sabendo, paladino: a mesma Academia que faz o seu sino faz relógios para o Conde de Corvoscuro.',
        { r: [
          { t: 'Vocês vendem para vampiros?', a: 'Vendemos para quem paga. A Ordem paga atrasado. O Conde paga adiantado, em ouro velho.', luz: 1 },
          { t: 'Isso não é da minha conta. Só preciso da peça.', a: 'Gosto de gente prática. Você vai longe. Ou vai cedo.' },
          { t: 'E quanto o Conde paga por um aviso sobre a Ordem?', a: '…Isso eu não ouvi. E você também não disse.', sombra: 2 } ] },
      ],
    },
    done: [
      'Ouviu? Não, não ouviu, porque ainda não chegou. Mas vai chegar. O Tobias já subiu a torre para esperar.',
      'Então a Companhia vende para o Conde. Eu sabia. Todo mundo sabia. Ninguém disse em voz alta.',
      { r: [
        { t: 'Vamos impedir?', a: 'Vamos. Mas não do jeito que você pensa.', luz: 1 },
        { t: 'Talvez seja melhor deixar. Comércio é comércio.', a: 'Comércio é comércio até a encomenda ser um relógio que avisa a um vampiro quando o sol vai nascer.' } ] },
    ] },

  { id: 'pa3', chain: PC, name: 'A Caravana Que Cheirava a Sangue', lvl: 32, giver: CS, next: 'pa4', xp: 0, gold: 260,
    text: 'Uma carroça da Companhia foi parada na rota noturna de Corvoscuro, depois de Hrafnhöfn. Os carniçais do Conde guardam a carga até a Corte mandar buscar. Chegue antes.',
    objs: [{ kind: 'rescue', route: 'ak-cv', label: 'rota noturna de Corvoscuro', at: 0.62, note: 'Debaixo da lona, seis caixas lacradas com cera vermelha. Numa delas, um relógio de latão sem ponteiros: em vez das horas, ele marca quanto falta para o sol nascer. Endereçado: “Ao Conde, com os cumprimentos da Academia.”' }],
    talk: [
      'Tenho um nome e um caminho. O nome é Corvoscuro; o caminho é a rota noturna que sai de Askavik e passa por Hrafnhöfn.',
      'Uma carroça da Companhia levava encomendas para a Corte do Conde. Os carniçais pararam a carroça no caminho, mas não para roubar. Para guardar.',
      'Quero saber o que a Academia vende para o Conde. E quero que você decida o que fazer com isso, porque eu já sou velho demais para decidir sem raiva.',
      { r: [
        { t: 'E se for só mercadoria comum?', a: 'Então você volta e me diz que eu sou um velho desconfiado. Vou gostar de ouvir.' },
        { t: 'Se for coisa do Conde, eu queimo tudo.', a: 'Queimar é fácil. Veja primeiro. A luz que não olha é só fogo.', luz: 1 },
        { t: 'O que a Ordem me dá se a carga valer alguma coisa?', a: 'A Ordem dá pão, armadura e um túmulo com o seu nome. O resto, Auréon decide.', sombra: 1 } ] },
    ],
    done: [
      'Um relógio que conta quanto falta para o sol nascer. Para quem dorme de dia, é o objeto mais precioso do mundo.',
      'A Academia sabe exatamente para quem vende. E a Companhia leva.',
    ],
    choice: { q: 'O relógio e as outras caixas estão com você. Você…', opts: [
      { label: 'Destrói a carga ali mesmo, na estrada.', karma: 2, flag: 'pal_queimou_carga', say: 'Está feito. A Companhia vai ficar furiosa conosco por um tempo. Eu durmo bem com isso.', why: 'Você negou ao Conde uma arma sem ferir ninguém. Mas destruiu o trabalho de gente que só carrega caixas.' },
      { label: 'Deixa a carroça seguir e traz o aviso a Cassius.', karma: 4, flag: 'pal_avisou', say: 'Você deixou o mundo como estava e trouxe a verdade para casa. Isso é mais difícil do que queimar.', why: 'Você escolheu saber em vez de punir. A verdade nas mãos certas pesa mais que uma fogueira.' },
      { label: 'Confisca a carga e vende o relógio em Hrafnhöfn.', karma: -5, flag: 'pal_vendeu_relogio', say: '…Vendeu. Para quem, {nome}? Quem compra um relógio desses em Hrafnhöfn? Eu vou rezar para você não descobrir.', why: 'Você tirou a arma de um vampiro e a vendeu ao primeiro que pagou. Ganhou ouro; a luz perdeu um pouco de você.' } ] } },

  { id: 'pa4', chain: PC, name: 'O Ninho do Cemitério', lvl: 33, giver: CS, turnin: SO, next: 'pa5', xp: 0, gold: 280, gear: 1,
    text: 'As Catacumbas de Askavik estão sendo abertas por dentro: alguém vende ossos de jarls a um bruxo. Desça, limpe os corredores e leve o relato à Bispa Solveig, na Igreja Kármica de Askavik.',
    objs: [{ kind: 'visit', poi: 'Catacumbas de Askavik' }, { kind: 'kill', type: 'skeleton', n: 10 }, { kind: 'kill', type: 'ghoul', n: 4 }],
    talk: [
      'Os ossos de um jarl valem mais que um cavalo, sabia? Os bruxos de Gorvath pagam por eles: um rei morto ainda tem poder.',
      'Alguém em Askavik está abrindo os nichos das Catacumbas e vendendo os mortos aos pedaços. E os mortos não gostam.',
      { r: [
        { t: 'Quem faria isso com os próprios antepassados?', a: 'Alguém com fome. Ou alguém com dívida. Em Askavik, os dois têm o mesmo cheiro.', luz: 1 },
        { t: 'Um osso por um cavalo… é bastante ouro.', a: 'É. E um dia alguém vai vender os seus. Pense nisso antes de pensar no ouro.', sombra: 1 } ] },
      'Desça às Catacumbas, perto do cemitério da cidade. Ponha os mortos para dormir de novo. E conte tudo à Bispa Solveig: as Catacumbas são dela.',
    ],
    done: [
      'Então é verdade. Os nichos dos jarls abertos com pá, e os mortos andando pelos corredores como quem procura o que perdeu.',
      'O Olho vê o que se faz quando ninguém olha, paladino. E alguém aqui embaixo achou que ninguém olhava.',
      { r: [
        { t: 'Achei marcas de pá de coveiro. Alguém de dentro.', a: 'O Coveiro Real. Eu temia isso. Ele tem uma filha doente e uma dívida com a agiota da praça. A pobreza não desculpa, mas explica.', luz: 1 },
        { t: 'Quem fez isso merece a forca.', a: 'Talvez. Mas antes da forca, a pergunta: por quê? Cassius ensinou você a perguntar, espero.' } ] },
    ] },

  { id: 'pa5', chain: PC, name: 'A Penitente', lvl: 34, giver: CS, next: 'pa6', xp: 0, gold: 300,
    text: 'Edda, uma mulher mordida por um vampiro, fugiu sangrando e se escondeu perto da Igreja Abandonada. Os morcegos da Corte já a encontraram. Ligue a Vigília da Fé (F): as gotas de sangue dela só aparecem para quem vela. A Ordem manda "purificar". Vá, e decida com o seu voto.',
    objs: [{ kind: 'kill', type: 'bat', n: 8 }, { kind: 'sense', what: 'sangue', label: 'Seguir as gotas de sangue de Edda', at: 'Igreja Abandonada', dx: 6, dy: 9, from: 'Cemitério Esquecido' }],
    talk: [
      'Esta é a parte da Ordem que ninguém canta.',
      'Uma mulher chamada Edda foi mordida há três noites. Ela ainda é ela. Por pouco tempo. Pediu ajuda à Abadia por uma carta escrita com a mão tremendo.',
      'A regra da Ordem é clara: quem foi mordido e ainda não virou deve ser "purificado" antes. É o termo bonito. Você sabe o que significa.',
      { r: [
        { t: 'Existe cura?', a: 'Existe uma tentativa. Água da aurora, três dias de jejum, e reza. Funciona uma vez em cada três. Nas outras duas, ela vira dentro da Abadia.', luz: 1 },
        { t: 'A regra é a regra. Eu faço o que precisa ser feito.', a: 'Então faça olhando nos olhos dela. É o mínimo.' },
        { t: 'E se ela quiser virar? Não é escolha dela?', a: '…Você pergunta o que eu não ouso perguntar. Talvez seja. Talvez por isso a regra exista: para ninguém precisar perguntar.' } ] },
      'Ela está na Igreja Abandonada. Os morcegos da Corte rondam: o vampiro que a mordeu quer a cria de volta.',
    ],
    done: [
      'Você voltou com a lama da igreja velha nas botas e um silêncio nos olhos. Conte.',
    ],
    choice: { q: 'Edda, de joelhos entre os bancos podres, pede: “Me ajuda. Do jeito que você achar certo.” Você…', opts: [
      { label: 'Purifica Edda, como a Ordem manda, olhando nos olhos dela.', karma: 0, flag: 'pal_purificou', say: 'Você seguiu a regra e não fugiu do olhar. Eu já fiz isso doze vezes. Nenhuma ficou mais fácil.', why: 'Era a lei, e ela pediu ajuda. A morte dada com respeito não é crueldade. Também não é luz.' },
      { label: 'Leva Edda à Abadia para a cura arriscada.', karma: 8, flag: 'pal_curou', say: 'Ela está na cela da aurora, rezando. Uma em três, {nome}. Se ela virar lá dentro, a culpa é minha também. Eu aceito.', why: 'Você arriscou a si mesmo e à Ordem por uma chance para alguém que pediu ajuda. É exatamente isso que o voto significa.' },
      { label: 'Deixa Edda fugir para a noite.', karma: -2, flag: 'pal_deixou_fugir', say: '…Ela vai virar. E vai lembrar de você. Torça para que seja com gratidão.', why: 'Você não quis matar e não quis arriscar. Deu a ela a liberdade, e ao mundo um vampiro a mais.' } ] } },

  { id: 'pa6', chain: PC, name: 'A Catedral Precisa de Luz', lvl: 35, giver: CS, turnin: SO, next: 'pa7', xp: 0, gold: 320, items: [['potion_g', 3]],
    text: 'A Companhia leva o novo órgão a vapor e os vitrais da Catedral de Askavik pela estrada de Austrvik. Os mortos que os Desfiados erguem rondam o caminho. Escolte a caravana desde Austrvik até a Catedral e entregue à Bispa Solveig.',
    objs: [{ kind: 'escort', route: 'au-ak', label: 'o órgão da Catedral (Austrvik → Askavik)' }],
    talk: [
      'A Catedral de Askavik vai ganhar um órgão novo. A vapor. Com quarenta tubos de latão e um fole que respira sozinho.',
      'A Bispa Solveig odeia a ideia. Mas os fiéis vão ouvir de longe, e ouvir de longe faz gente entrar.',
      'Os Desfiados também sabem disso. Eles não querem uma Catedral cheia. Vão tentar parar a carroça na estrada.',
      { r: [
        { t: 'Ninguém para essa carroça. Nem morto, nem vivo.', a: 'Esse é o paladino que eu queria ver.', luz: 1 },
        { t: 'Escoltar mercadoria não é serviço de mercenário?', a: 'É. A diferença é o que tem dentro da caixa. Hoje tem música para quem nunca ouviu música.' } ] },
      'A carroça sai daqui de Austrvik, ao pé da Abadia. Fique perto dela: sem escolta o cocheiro não anda. E não deixe ela tombar.',
    ],
    done: [
      'Inteiro. Quarenta tubos e nenhum amassado. Confesso que torci para chegar quebrado.',
      'Uma tecnocrata da Academia vem instalar. Vai mexer na minha Catedral com chave inglesa enquanto eu rezo. O mundo muda, paladino, e ninguém pede licença.',
      { r: [
        { t: 'Vai ser bonito, Bispa. A senhora vai ver.', a: 'Vou ouvir. Ver eu já vi coisa demais.', luz: 1 },
        { t: 'Fique de olho na tecnocrata.', a: 'Fico de olho em todo mundo. É o meu ofício e o do Olho.' } ] },
    ] },

  { id: 'pa7', chain: PC, name: 'O Bastião de Prata', lvl: 36, giver: CS, turnin: IL, next: 'pa8', xp: 0, gold: 340, gear: 1,
    text: 'A Ordem e o Clã Helsing não caçam juntos há vinte anos. Os lobisomens da estrada mudaram isso. Encontre a Mestra Ilsa Van Rhal em Sudrholt e cace com os caçadores.',
    objs: [{ kind: 'talk', npc: IL }, { kind: 'kill', type: 'werewolf', n: 6 }],
    talk: [
      'Vinte anos atrás, um paladino e um caçador brigaram por um prisioneiro. O paladino queria julgar; o caçador queria matar. O prisioneiro fugiu enquanto os dois discutiam.',
      'Desde então, a Ordem e o Clã Helsing não caçam juntos. Eu era o paladino.',
      { r: [
        { t: 'E quem tinha razão?', a: 'O prisioneiro. Ele fugiu.', luz: 1 },
        { t: 'Você ainda guarda rancor?', a: 'Guardo vergonha. É diferente. O rancor pesa no outro; a vergonha pesa em mim.' } ] },
      'Os lobisomens da estrada estão matando viajantes demais. A Mestra Ilsa aceitou caçar conosco. Vá até Sudrholt e mostre que um paladino sabe ouvir.',
    ],
    meet: {
      [IL]: [
        'Um paladino em Sudrholt. Da última vez, um dos seus deixou um monstro fugir porque queria fazer um julgamento.',
        'Aqui a regra é simples: prata, estaca e paciência. Ninguém discursa na caçada.',
        { r: [
          { t: 'Vim aprender, Mestra. E caçar.', a: 'Aprender. Hm. O Cassius mandou bem desta vez.', luz: 1 },
          { t: 'A Ordem não precisa de aulas do Clã.', a: 'Então volte para a sua capela. Os lobos agradecem.' },
          { t: 'Se pagarem bem, eu caço do jeito que vocês quiserem.', a: 'Pagamos com prata. Na ponta da flecha, quase sempre.', sombra: 1 } ] },
        'Seis lobisomens rondam a estrada. Não deixe nenhum morder você. Se morder, a conversa muda de assunto.',
      ],
    },
    done: [
      'Seis. Você não discursou nem uma vez. Estou impressionada.',
      'Diga ao Cassius que o Bastião de Prata caça com a Ordem de novo. E diga que eu não esqueci. Mas que está perdoado.',
    ] },

  { id: 'pa8', chain: PC, name: 'Diabos na Fornalha', lvl: 37, giver: CS, next: 'pa9', xp: 0, gold: 360, items: [['potion_g', 3]],
    text: 'Diabretes saem do Coração da Montanha, perto de Brasaforja: os anões cavaram fundo demais e abriram uma fenda. Afaste-os da entrada antes que desçam até as vilas.',
    objs: [{ kind: 'visit', poi: 'Coração da Montanha' }, { kind: 'kill', type: 'imp', n: 12 }],
    talk: [
      'Os anões de Brasaforja cavaram mais fundo do que deviam. Diamante leva à ganância, e ganância cava até achar o que não devia.',
      'Abriram uma fenda. De lá sobem diabretes, e onde diabrete passa, o fogo pega sozinho.',
      { r: [
        { t: 'Vou fechar a fenda.', a: 'A fenda é coisa para um exército, mais tarde. Hoje, só segure a porta.', luz: 1 },
        { t: 'A culpa é dos anões. Eles que resolvam.', a: 'A culpa é deles; o fogo vai ser de todo mundo. Paladino não escolhe quem salva pela culpa.' } ] },
      'Vá até a entrada do Coração da Montanha e empurre os diabretes de volta. Doze deles. Não entre fundo: lá embaixo é outra guerra.',
    ],
    done: [
      'Cheiro de enxofre. Você trouxe a montanha nas roupas.',
      'Por enquanto a porta está segura. Um dia a Ordem vai ter que descer. Talvez você esteja lá.',
    ] },

  { id: 'pa9', chain: PC, name: 'A Carta do Conde', lvl: 38, giver: CS, next: 'pa10', xp: 0, gold: 380,
    text: 'O Conde Vladislav mandou dizer que quer conversar. Lady Mirela, a emissária da Corte, espera um paladino em Corvoscuro, à noite. Vá, ouça, e traga a carta.',
    objs: [{ kind: 'talk', npc: MI }],
    talk: [
      'Chegou um corvo esta manhã. Um corvo de verdade, com um bilhete na pata, lacrado com cera vermelha.',
      '"O Conde Vladislav deseja tratar de paz com a Ordem de Auréon. A emissária receberá um paladino em Corvoscuro, depois do pôr do sol."',
      'Paz. Com o Conde. Trezentos anos de guerra e ele manda um bilhete.',
      { r: [
        { t: 'Pode ser uma armadilha.', a: 'Pode. Tudo pode. Mas se for verdade e eu não mandar ninguém, a guerra continua por orgulho meu.', luz: 1 },
        { t: 'Paz com quem bebe sangue? Nunca.', a: 'Eu disse a mesma coisa há quarenta anos. Hoje tenho quarenta anos de enterros a mais.' },
        { t: 'Vou e volto com a cabeça da emissária.', a: 'Vai e volta com a carta, {nome}. Cabeças não negociam.', sombra: 1 } ] },
      'Vá a Corvoscuro. À noite. Ouça Lady Mirela e traga a carta lacrada. A resposta, decidimos aqui.',
    ],
    meet: {
      [MI]: [
        'Um paladino. Pontual, ainda por cima. A Ordem melhorou.',
        'Não precisa apertar o cabo da espada, querido. Esta é uma vila de vivos; aqui ninguém se fere. Nem você, nem eu.',
        'O Conde está cansado. Trezentos anos caçando e sendo caçado cansam até quem não envelhece. A proposta é simples: vocês param de caçar os filhos dele, ele para de caçar os seus.',
        { r: [
          { t: 'E os que vocês já mataram?', a: 'E os que vocês já queimaram? A conta é longa dos dois lados. A trégua não apaga a conta. Só para de somar.', luz: 1 },
          { t: 'Por que agora?', a: 'Porque os Desfiados estão erguendo mortos que não obedecem a ninguém. Nem ao Conde. Há coisas piores do que vampiros na estrada, paladino.' },
          { t: 'Quanto a Corte pagaria a um paladino que levasse a carta… e esquecesse algumas coisas?', a: 'Hm. Interessante. Guarde essa pergunta. Um dia eu respondo.', sombra: 2, flag: 'pal_ofereceu_mirela' } ] },
        'A carta. Lacre intacto, por favor. O Conde sabe quando alguém lê o que não devia.',
      ],
    },
    done: [
      'A carta. O lacre está inteiro. Obrigado.',
      '"Parem de caçar os meus filhos e eu paro de caçar os seus." Simples assim. E assinado com sangue, como sempre.',
      'Eu não vou decidir sozinho. A Ordem vai decidir. Mas a minha voz vai ser a sua, {nome}. Diga.',
    ],
    choice: { q: 'Cassius espera a sua resposta à trégua do Conde. Você diz…', opts: [
      { label: '“Aceite a trégua. Os Desfiados são o perigo agora.”', karma: 3, flag: 'pal_tregua', say: 'Eu discordo. E vou levar a sua voz ao Conselho mesmo assim. Talvez você seja mais sábio do que eu fui.', why: 'Você escolheu parar uma guerra mesmo contra o seu mestre. Paz feita com o inimigo é a mais difícil.' },
      { label: '“Recuse. Não negociamos com quem bebe sangue.”', karma: 1, flag: 'pal_recusou', say: 'É o que eu diria aos trinta anos. Não sei se é o que eu diria hoje. Mas a voz é sua.', why: 'Você foi fiel ao que a Ordem sempre foi. Fidelidade conta. Mas a guerra também.' },
      { label: '“Finja aceitar. Quando baixarem a guarda, atacamos.”', karma: -8, flag: 'pal_traiu', say: '…Você quer que a Ordem de Auréon minta com a mão sobre o escudo. Saia daqui antes que eu esqueça que te ensinei.', why: 'Uma trégua falsa é a pior das traições: usa a esperança do outro como arma. A luz não mente nem para vampiros.' } ] } },

  { id: 'pa10', chain: PC, name: 'O Escudo de Auréon', lvl: 40, giver: CS, xp: 0, gold: 500, gear: 2, title: 'Escudo da Aurora',
    text: 'Os Desfiados atacam a Abadia com um exército de mortos erguidos. Esta é a noite em que a Ordem descobre se você é um escudo ou um nome bonito. Segure a colina e volte para o juramento final.',
    objs: [{ kind: 'level', n: 40 }, { kind: 'kill', type: 'skeleton', n: 12 }, { kind: 'kill', type: 'zombie', n: 10 }, { kind: 'kill', type: 'ghoul', n: 6 }, { kind: 'talk', npc: CS }],
    talk: [
      'Chegou a noite que eu esperava desde que te vi pela primeira vez.',
      'Os Desfiados ergueram um exército de mortos e mandaram contra a Abadia. Querem apagar a vela que nunca se apagou. Querem que o mundo veja a luz cair.',
      'Eu estou velho para a primeira fila. Você não está.',
      { r: [
        { t: 'A vela não se apaga enquanto eu estiver de pé.', a: 'Então fique de pé. É tudo o que Auréon pede.', luz: 2 },
        { t: 'E se eu cair?', a: 'Então outro levanta o seu escudo. Ninguém atravessa só, lembra? Nem na morte.', luz: 1 },
        { t: 'Depois desta noite, eu quero o comando da Abadia.', a: 'Depois desta noite, se você ainda quiser comandar em vez de proteger, conversamos. Duvido que queira.', sombra: 1 } ] },
      'Segure a colina. Mortos, ossos, carniçais. E quando acabar, volte aqui. Tenho uma coisa para você.',
    ],
    done: [
      'A vela continua acesa. Olhe lá fora: o sol nascendo em cima de uma colina de ossos quebrados.',
      'Este escudo era meu. Antes, do meu mestre. Antes, de alguém cujo nome a Abadia esqueceu e Auréon não.',
      { me: 'É pesado.' },
      'É. Fica mais leve a cada pessoa que você protege. Nunca fica leve de verdade. Bem-vindo, Escudo da Aurora.',
    ] },
];

/* ======================= O VAMPIRO — "A Sede Educada" ======================= */
const VC = 'A Sede Educada';
export const VAMPIRE: QuestDef[] = [
  { id: 'va1', chain: VC, name: 'O Convite de Cera Vermelha', lvl: 30, giver: MI, req: 'v_vam', next: 'va2', xp: 0, gold: 220, items: [['potion_g', 3]],
    text: 'A noite de Corvoscuro precisa saber que você pertence a ela. Oito morcegos da colina obedecem a quem tem o sangue do Conde. Prove, e volte para dizer por que aceitou.',
    objs: [{ kind: 'kill', type: 'bat', n: 8 }],
    talk: [
      'Você veio. Os vivos costumam hesitar na porta. Você só hesitou um pouco. Bom sinal.',
      'O Conde não sobe a colina para receber filhos novos. Quem sobe são os que merecem, e merecer leva tempo. Até lá, você me tem. Lady Mirela, emissária da Corte.',
      'A primeira lição: a noite não é sua. Você é da noite. Os morcegos da colina sabem disso antes de você.',
      { r: [
        { t: 'Estou pronto para aprender, senhora.', a: 'Educação. Que alívio. Os últimos três chegaram mordendo os móveis.' },
        { t: 'Não vim para aprender. Vim para ter poder.', a: 'Todos vêm para isso. Alguns ficam para outra coisa. Vamos ver qual é você.', sombra: 1 },
        { t: 'Ainda posso voltar atrás?', a: 'Voltar, não. Mas pode escolher como seguir. É mais do que a maioria dos vivos tem.', luz: 1 } ] },
      'Oito morcegos. Eles vão sentir o seu sangue e vir. Não fuja deles: fugir é coisa de presa.',
    ],
    done: [
      'Eles vieram a você e caíram. A colina reconhece o seu cheiro agora.',
      'Falta uma coisa. A Corte anota o motivo de cada filho. O Conde lê todos, um por um, nas noites longas.',
    ],
    choice: { q: 'Lady Mirela molha a pena no tinteiro: “Por que você aceitou a mordida?”', opts: [
      { label: '“Por poder. Para nunca mais ser fraco.”', karma: -3, flag: 'vam_poder', say: 'Honesto. O poder é um bom motivo para começar e um péssimo motivo para continuar. Anotado.', why: 'Querer força não é crime. Querer só força transforma tudo o que existe em presa.' },
      { label: '“Por alguém que amo, que já foi mordido.”', karma: 2, flag: 'vam_amor', say: 'Ah. Para não deixar alguém sozinho na noite eterna. Esse é o motivo mais antigo da Corte. O do próprio Conde, dizem.', why: 'Você atravessou uma porta sem volta para não abandonar alguém. O motivo pesa a favor, mesmo que a porta pese contra.' },
      { label: '“Por vingança. Tenho uma conta a cobrar.”', karma: -1, flag: 'vam_vinganca', say: 'Vingança é paciente. Nós também. Combina. Só cuidado: a conta sempre sai maior do que a dívida.', why: 'A vingança tem um motivo, e motivos contam. Mas ela costuma cobrar de quem não devia nada.' } ] } },

  { id: 'va2', chain: VC, name: 'A Primeira Sede', lvl: 31, giver: MI, next: 'va3', xp: 0, gold: 230,
    text: 'A sede chegou. A Corte tem regras: bebe-se de bichos, de quem consente, de quem tentou matar você. Nunca de inocentes. Cace javalis e lobos para aprender a beber sem matar gente.',
    objs: [{ kind: 'kill', type: 'boar', n: 5 }, { kind: 'kill', type: 'wolf', n: 5 }],
    talk: [
      'Você está pálido. E está olhando para o meu pescoço há três frases. É a sede.',
      'A sede é natural. Falta de modos, não. A Corte de Vladislav tem quatro regras, e a primeira é a mais velha: nunca de inocentes.',
      'Bichos. Quem consente. Quem tentou matar você. É daí que se bebe. O resto é ser um carniçal com roupa bonita.',
      { r: [
        { t: 'E se a sede for maior que a regra?', a: 'Então você aguenta. A sede cresce, dói, e passa. Os que não aguentaram estão na estrada, com os carniçais.', luz: 1 },
        { t: 'Regras são para quem tem medo.', a: 'Regras são para quem quer durar mil anos sem que a Ordem bata na porta. Mas faça como quiser. Uma vez.', sombra: 1 },
        { t: 'Como se bebe de alguém que consente?', a: 'Pedindo. Com educação. Você se surpreenderia com quantos vivos dizem sim.' } ] },
      'Javalis e lobos dos bosques. Cinco de cada. Aprenda a beber sem precisar matar alguém que tem nome.',
    ],
    done: [
      'Sangue de javali. Grosso, quente, e com gosto de lama. Nenhum filho do Conde gosta. Todos começam assim.',
      'Mas me diga a verdade, {nome}. A Corte sabe quando um filho mente, porque a sede deixa marca nos olhos.',
    ],
    choice: { q: 'Lady Mirela olha nos seus olhos: “Na noite passada, quando a sede apertou… o que você fez?”', opts: [
      { label: '“Aguentei. Doeu, e eu aguentei.”', karma: 4, flag: 'vam_aguentou', say: 'Então você vai durar. Os que aguentam a primeira sede aguentam quase tudo.', why: 'Você teve a força para machucar e escolheu sentir dor no lugar de causar. É o primeiro passo de qualquer luz, até na noite.' },
      { label: '“Bebi de alguém que deixou. Um viajante, por uma moeda.”', karma: 2, flag: 'vam_consentiu', say: 'Pediu, pagou e ele disse sim. Isso é a Corte. Isso é civilização.', why: 'Você matou a sede respeitando a vontade do outro. Não é pureza, mas é honra.' },
      { label: '“Bebi de um pastor que dormia no campo. Até o fim.”', karma: -10, flag: 'vam_matou_inocente', say: '…Então você quebrou a primeira regra na primeira noite. A Corte vai anotar isso também. E a Ordem vai saber o caminho até você.', why: 'Um inocente dormindo, sem chance de dizer não. É o ato que transforma alguém em monstro. O Olho guardou.' } ] } },

  { id: 'va3', chain: VC, name: 'Encomenda de Latão', lvl: 32, giver: MI, next: 'va4', xp: 0, gold: 260,
    text: 'O Conde encomendou à Academia um relógio de sangue. A Companhia de Latão traz pela rota noturna. Fale com a Feitora Brunna, fora do portão sul de Askavik, e escolte a carroça desde o portão leste até Corvoscuro.',
    objs: [{ kind: 'talk', npc: BR }, { kind: 'escort', route: 'ak-cv', label: 'a encomenda do Conde (rota noturna de Corvoscuro)' }],
    talk: [
      'O Conde encomendou um presente para si mesmo. Um relógio que não marca as horas: marca quanto falta para o sol nascer.',
      'Quem dorme de dia, querido, morre por um erro de cálculo. Literalmente.',
      'Quem faz o relógio é a Academia de Askavik. Quem traz é a Companhia de Latão. E quem protege a carroça, desta vez, é você.',
      { r: [
        { t: 'Os paladinos vão tentar interceptar.', a: 'Vão. Já tentaram uma vez. Desta vez a carroça tem um de nós junto.' },
        { t: 'Por que a Academia vende para nós?', a: 'Porque pagamos adiantado, em ouro de trezentos anos. Ciência é cara.' } ] },
      'Fale com a Feitora Brunna, no balcão da Companhia, do lado de fora do portão sul de Askavik. A carroça sai do portão leste.',
    ],
    meet: {
      [BR]: [
        'Você é da Corte, não é? A pele não mente. E está de dia: deve estar ardendo.',
        'A carroça do Conde sai do portão leste. Rota noturna: Askavik, Hrafnhöfn, Corvoscuro. Cocheira boa, caldeira nova, dois guardas.',
        'Da última vez, um paladino parou a carroça no meio do caminho. Não sei o que ele fez com a carga. A Companhia ainda está fazendo as contas.',
        { r: [
          { t: 'Desta vez ninguém para nada.', a: 'É o que eu gosto de ouvir. Do lado de quem paga.' },
          { t: 'Não gosto de servir de escolta para mercadoria.', a: 'Ninguém gosta. Mas todo mundo come.' } ] },
      ],
    },
    done: [
      'O relógio chegou. Intacto. O Conde vai dormir tranquilo pela primeira vez em uma década.',
      'Me diga só uma coisa, {nome}. A caixa estava lacrada quando chegou?',
    ],
    choice: { q: 'A caixa do relógio veio lacrada com cera vermelha. No caminho, você…', opts: [
      { label: 'Protegeu a caixa até o fim, sem tocar no lacre.', karma: 1, flag: 'vam_leal', say: 'Lacre inteiro. A Corte confia em você um pouco mais esta noite.', why: 'Cumprir o que prometeu, mesmo podendo bisbilhotar, é a base de qualquer confiança.' },
      { label: 'Abriu a caixa para ver o que a Academia vende ao Conde.', karma: -1, flag: 'vam_espiou', say: '…E o que você viu? Ah. As engrenagens têm a marca da Ordem por dentro. A Academia vende para os dois lados. Guarde isso. Para mim.', why: 'Curiosidade não é maldade. Mas você quebrou um lacre que prometeu proteger.' } ] } },

  { id: 'va4', chain: VC, name: 'O Sol Filtrado', lvl: 33, giver: MI, turnin: MI, next: 'va5', xp: 0, gold: 280,
    text: 'O Conde quer vitrais que filtram o sol para o castelo. A Arquiteta Ylva, na Academia da Graxa de Porto Caldeira, sabe fazer, mas cobra caro. Vá ouvir o preço.',
    objs: [{ kind: 'talk', npc: YL }],
    talk: [
      'O Conde tem um sonho. É pequeno e é antigo: ver um pôr do sol sem morrer.',
      'A Academia diz que consegue fazer um vidro que filtra a parte do sol que nos queima. Vitrais. Para a sala do trono.',
      'A Arquiteta Ylva vai pedir algo em troca. Ela sempre pede. Descubra o quê.',
      { r: [
        { t: 'O Conde quer ver o sol… isso é bonito.', a: 'É. Não conte a ele que eu disse.', luz: 1 },
        { t: 'E se o preço for alto demais?', a: 'Então você negocia. Você tem a língua de um vivo ainda. Use enquanto tem.' } ] },
    ],
    meet: {
      [YL]: [
        'Vitrais que filtram a radiação solar no espectro que destrói tecido vampírico. Sim, consigo. Não, não é magia.',
        'O meu preço é ciência: uma amostra de sangue vampírico. Fresco. Quero entender por que vocês não envelhecem.',
        { r: [
          { t: 'Você quer fazer o quê com o nosso sangue?', a: 'Entender. Talvez curar a doença do Thorgrim do Corvo. Talvez fazer coisa pior. Ciência não promete nada.', luz: 1 },
          { t: 'Eu posso conseguir o sangue de outro vampiro. Mais fácil.', a: 'Origem não me interessa. Pureza, sim.', sombra: 1 },
          { t: 'E se eu oferecer outra coisa? Um segredo da Corte.', a: 'Hm. Segredos também são dados. Converse com a sua emissária e volte com uma resposta.' } ] },
      ],
    },
    done: [
      'Uma amostra de sangue. É claro. A Academia sempre quer o que não se vende.',
      'Decida você. Eu só preciso dos vitrais.',
    ],
    choice: { q: 'Para pagar os vitrais do Conde, você…', opts: [
      { label: 'Dá o próprio sangue à Academia.', karma: 0, flag: 'vam_sangue_proprio', say: 'O seu próprio sangue nas mãos de uma tecnocrata. Corajoso. Ou tolo. O Conde vai gostar dos dois.', why: 'Você pagou com o que era seu. Não feriu ninguém, mas também não sabe o que a Academia fará com isso.' },
      { label: 'Rouba o sangue de um vampiro selvagem preso nas masmorras da Corte.', karma: -4, flag: 'vam_roubou_sangue', say: 'Discreto e eficiente. O pobre selvagem não vai reclamar. Nem tem mais voz.', why: 'Você pagou com o corpo de alguém que não podia dizer não. Que ele fosse um monstro não muda o que você fez.' },
      { label: 'Negocia: troca o sangue por um segredo da Corte, sem valor real.', karma: 2, flag: 'vam_negociou', say: 'Uma meia-verdade bem contada vale mais que um frasco. Você vai longe na Corte, {nome}.', why: 'Você encontrou um caminho sem sangue nenhum. A esperteza que não fere ninguém pesa a favor.' } ] } },

  { id: 'va5', chain: VC, name: 'Os Filhos Perdidos', lvl: 34, giver: MI, next: 'va6', xp: 0, gold: 300, gear: 1,
    text: 'Vampiros que quebraram as regras viraram selvagens e matam vilas inteiras. Eles se escondem perto da Catedral Abandonada: ligue a Sede de Sangue (F) e siga o cheiro. São filhos do Conde. Decida o que fazer com eles.',
    objs: [{ kind: 'sense', what: 'cheiro', label: 'Farejar o sangue dos filhos perdidos', at: 'Catedral Abandonada', dx: -8, dy: 10 }, { kind: 'kill', type: 'ghoul', n: 10 }],
    talk: [
      'Lembra da primeira regra? Nunca de inocentes. Alguns esqueceram.',
      'Quem quebra a regra muitas vezes perde a razão. Vira bicho. Mata por matar, bebe até a última gota, dorme em cova rasa. A Ordem chama de carniçal; nós chamamos de filho perdido.',
      'Eles estão em algum lugar perto da Catedral Abandonada. Ligue a Sede de Sangue (F): sangue derramado à toa tem um cheiro que só nós sentimos. Siga e você acha a toca.',
      'Se a Ordem os encontrar primeiro, vai dizer que é assim que todos nós somos.',
      { r: [
        { t: 'Eles podem voltar a ser quem eram?', a: 'Alguns. Poucos. Com tempo, jejum e a vontade do Conde. A maioria não.', luz: 1 },
        { t: 'Então eles são só bichos. Vou limpar.', a: 'São bichos que já foram gente. Limpe, se precisar. Mas olhe no rosto deles antes.' } ] },
    ],
    done: [
      'Você voltou com cheiro de cova e cinza. Sente-se. Conte o que fez com os nossos.',
    ],
    choice: { q: 'Na Catedral, os carniçais caem. O último, ainda com um anel de casamento no dedo, se ajoelha. Você…', opts: [
      { label: 'Acaba com ele. Não há volta para quem caiu tanto.', karma: 3, flag: 'vam_matou_filhos', say: 'Fez o que a Ordem faria. Rápido e limpo. Às vezes é misericórdia.', why: 'Você parou alguém que matava vilas inteiras, e fez sem crueldade. Pesa a favor de quem foi salvo.' },
      { label: 'Traz ele de volta à Corte, acorrentado, para tentar a cura.', karma: 5, flag: 'vam_trouxe', say: 'Um filho perdido de volta à mesa. O Conde vai lembrar disso por um século. E eu também.', why: 'Você deu uma chance a quem já não tinha nenhuma. É mais difícil e mais perigoso que matar.' } ] } },

  { id: 'va6', chain: VC, name: 'O Paladino na Estrada', lvl: 35, giver: MI, next: 'va7', xp: 0, gold: 320,
    text: 'O Paladino Aldric está perguntando por você em Askavik. Sabe o que você é. A cidade é terra de paz: ninguém se fere lá dentro. Vá ouvir o que ele quer. Depois conte à Corte.',
    objs: [{ kind: 'talk', npc: AL }],
    talk: [
      'Um paladino está perguntando o seu nome nas tavernas de Askavik. Aldric. Jovem, sincero, perigoso como só os sinceros são.',
      'Ele sabe o que você é. E pediu para conversar, não para lutar. Isso é raro.',
      { r: [
        { t: 'Vou ouvir o que ele quer.', a: 'Ouça. E lembre-se de que ele também está ouvindo você.' },
        { t: 'Vou acabar com ele antes que ele acabe comigo.', a: 'Dentro de Askavik? Ninguém fere ninguém lá. E fora… ele não está sozinho. Nunca estão.', sombra: 1 } ] },
      'Vá a Askavik. Ele fica na Capela, perto da praça.',
    ],
    meet: {
      [AL]: [
        { me: 'Você queria falar comigo, paladino.' },
        'Queria. Eu sinto o que você é desde que entrou na cidade. A luz arde quando você chega perto, não arde?',
        'Eu não vim caçar. Vim perguntar uma coisa que nenhum paladino pergunta: quem você era antes da mordida?',
        { r: [
          { t: 'Alguém como você. Que queria proteger os outros.', a: '…Então ainda pode querer. A mordida tirou o sol, não tirou o resto.', luz: 2, flag: 'vam_amizade_aldric' },
          { t: 'Isso não é da sua conta.', a: 'É justo. Mas a pergunta fica. Pense nela numa noite comprida.' },
          { t: 'Alguém fraco. Agora não sou mais.', a: 'Força nunca foi o contrário de fraqueza. O contrário de fraqueza é coragem. Você ainda vai descobrir a diferença.', sombra: 1 } ] },
        'Se um dia a sede for maior que você, me procure. Eu não vou te julgar antes de ouvir. É tudo o que posso prometer.',
      ],
    },
    done: [
      'Então você conversou com um paladino e voltou com o coração ainda batendo. Ou quase.',
      'A Corte quer saber o que aconteceu. Toda a verdade, por favor.',
    ],
    choice: { q: 'Lady Mirela pergunta: “O que você fez com o paladino?”', opts: [
      { label: '“Conversei. E deixei ele ir. Ele é diferente dos outros.”', karma: 4, flag: 'vam_poupou_aldric', say: 'Uma amizade proibida. Ah, as melhores histórias da Corte começam assim. E terminam mal. Cuide-se.', why: 'Você escolheu ouvir o inimigo em vez de ferir. Pontes entre a noite e o dia são raras e pesam a favor.' },
      { label: '“Ameacei. Ele vai pensar duas vezes antes de procurar a Corte.”', karma: 0, flag: 'vam_ameacou_aldric', say: 'Uma ameaça bem feita salva mais vidas do que uma espada. Às vezes.', why: 'Você não feriu ninguém, mas trocou uma mão estendida por medo.' },
      { label: '“Esperei ele sair da cidade e bebi dele. Quase até o fim.”', karma: -8, flag: 'vam_bebeu_aldric', say: '…Ele sobreviveu? Ótimo para ele. Péssimo para nós. A Ordem inteira vai saber o seu nome amanhã.', why: 'Ele ofereceu conversa e você respondeu com os dentes. Atacar quem veio em paz é das sombras mais fundas.' } ] } },

  { id: 'va7', chain: VC, name: 'Banquete em Corvoscuro', lvl: 36, giver: MI, next: 'va8', xp: 0, gold: 340,
    text: 'O Conde dá um banquete em Corvoscuro para os filhos da Corte. Você foi convidado. Alguém na mesa trouxe veneno para a taça do Conde. Fale com Vladislav à mesa e afaste os morcegos do envenenador.',
    objs: [{ kind: 'talk', npc: VL }, { kind: 'kill', type: 'bat', n: 10 }],
    talk: [
      'Você foi convidado para o banquete da Corte. É uma honra, e é uma prova. Todo banquete da Corte é as duas coisas.',
      'Um dos convidados trouxe veneno de prata para a taça do Conde. Não sabemos quem. O Conde sabe que você não sabe. Por isso confia em você.',
      { r: [
        { t: 'Vou ficar ao lado do Conde a noite inteira.', a: 'Ao lado não. Atrás. Quem está ao lado é o primeiro suspeito.' },
        { t: 'E se eu descobrir e ficar calado? O que eu ganho?', a: 'Ganha o trono de quem envenenou. Ou a cova dele. Depende de quem descobrir antes.', sombra: 1 } ] },
    ],
    meet: {
      [VL]: [
        'Ah, o filho novo de Mirela. Sente-se. Não à minha direita: ali senta quem vai me matar esta noite.',
        'Não se assuste. Eu sei quem é. Sei desde que ele chegou. Quero ver se você também percebe.',
        'Trezentos anos, {nome}, e a única coisa que eu ainda não aprendi é como não ser traído.',
        { r: [
          { t: 'Por que não o denuncia, senhor?', a: 'Porque eu quero saber quem mais está com ele. Os morcegos dele vão sair voando para avisar os outros. Derrube-os.', luz: 1 },
          { t: 'E se fosse eu à sua direita?', a: 'Seria a sua primeira e última refeição na Corte. Coma o pão, criança.', sombra: 1 } ] },
        'Vá lá fora. Os morcegos do traidor vão subir quando ele perceber que eu sei. Dez deles. Nenhum chega ao destino.',
      ],
    },
    done: [
      'Os morcegos caíram, e o traidor ficou sem mensageiros. Agora ele está sozinho na mesa, suando sangue.',
      'O Conde deixou a decisão para você. Ele gosta de ver o que os filhos fazem com poder pequeno.',
    ],
    choice: { q: 'O traidor está na mesa, sem saída. Você…', opts: [
      { label: 'Denuncia em voz alta, diante de todos, e deixa a Corte julgar.', karma: 2, flag: 'vam_denunciou', say: 'Diante de todos. Sem veneno, sem faca no escuro. O Conde sorriu. Ele não sorri há uns vinte anos.', why: 'Você escolheu a justiça aberta à vingança escondida. Até na noite, isso pesa a favor.' },
      { label: 'Chantageia o traidor em segredo: agora ele te deve tudo.', karma: -4, flag: 'vam_chantagem', say: 'Um devedor dentro da Corte. Útil. Perigoso. Muito Corte.', why: 'Você transformou um crime em moeda. Guardou um assassino perto do Conde para lucrar com ele.' },
      { label: 'Troca as taças e deixa o traidor beber o próprio veneno.', karma: -2, flag: 'vam_trocou_tacas', say: 'Poético. O Conde aplaudiu. Eu também. Mas lave as mãos: prata deixa marca.', why: 'Era um assassino, e morreu pela arma que trouxe. Mas você foi juiz e carrasco sozinho.' } ] } },

  { id: 'va8', chain: VC, name: 'Sangue de Hemara', lvl: 37, giver: MI, next: 'va9', xp: 0, gold: 360, gear: 1,
    text: 'Na Cripta de Hemara dorme a noiva morta que guardava um véu que acalma a sede. O véu está lá embaixo, entre os mortos que ela não deixa descansar. Traga notícias do véu.',
    objs: [{ kind: 'visit', poi: 'Cripta de Hemara' }, { kind: 'kill', type: 'skeleton', n: 10 }, { kind: 'kill', type: 'zombie', n: 6 }],
    talk: [
      'Conhece a história de Hemara? Uma noiva mordida na noite do casamento. Ela nunca bebeu de ninguém. Morreu de sede, de propósito, para não ferir o noivo.',
      'O véu dela ficou na cripta. Dizem que quem veste não sente sede por uma noite inteira.',
      { r: [
        { t: 'Ela escolheu morrer para não ferir ninguém…', a: 'Escolheu. A Corte acha uma tolice. Eu acho a coisa mais bonita que um de nós já fez.', luz: 2 },
        { t: 'Um véu que tira a sede vale uma fortuna.', a: 'Vale. Mas quem vende o véu de Hemara não volta inteiro da cripta. Os mortos de lá são ciumentos.', sombra: 1 } ] },
      'Desça à Cripta de Hemara. Afaste os mortos. Veja se o véu ainda está lá.',
    ],
    done: [
      'O véu existe. Você viu. Dobrado sobre o caixão, branco como no dia do casamento.',
      'Deixou lá? Ou trouxe? Não precisa dizer. A sede nos seus olhos responde.',
      { r: [
        { t: 'Deixei com ela. Era dela.', a: 'Era. Ainda é. Hemara deve estar sorrindo, se é que os mortos sorriem.', luz: 2, flag: 'vam_veu_deixado' },
        { t: 'Ainda não decidi.', a: 'O véu espera. Hemara esperou a vida inteira; pode esperar mais um pouco.' } ] },
    ] },

  { id: 'va9', chain: VC, name: 'A Trégua', lvl: 38, giver: MI, next: 'va10', xp: 0, gold: 380,
    text: 'O Conde escreveu uma carta de trégua à Ordem de Auréon. Alguém da Corte precisa entregá-la nas mãos do Grão-Mestre Cassius, na Abadia de Austrvik. Você.',
    objs: [{ kind: 'talk', npc: CS }],
    talk: [
      'O Conde está propondo paz à Ordem. Não ria. Eu também ri, por uma semana.',
      'Os Desfiados estão erguendo mortos que não obedecem a ninguém. Nem a nós. O Conde acha que os paladinos são o menor dos males. Eu acho que ele está velho. Talvez as duas coisas.',
      'A carta precisa chegar à mão do Grão-Mestre Cassius, em Austrvik. Com o lacre inteiro. De dia, na terra deles. Boa sorte.',
      { r: [
        { t: 'Vou levar. Se for para parar a guerra, eu levo.', a: 'Você me surpreende de novo. Talvez seja por isso que eu te escolhi.', luz: 2 },
        { t: 'E se eu abrir a carta no caminho e mudar o que ela diz?', a: 'Então a guerra vai continuar, e vai ser culpa sua. A Corte vai saber. A Ordem também.', sombra: 1 } ] },
    ],
    meet: {
      [CS]: [
        '…Uma cria da Corte, na Abadia, de dia. Você está queimando. Sente-se na sombra da coluna, ao menos.',
        'Aldric me falou de um filho do Conde que conversou com ele na cidade. Era você?',
        'A carta. Ah. "Parem de caçar meus filhos e eu paro de caçar os seus." Ele sempre escreveu bonito.',
        { r: [
          { t: 'O Conde está sendo sincero, Grão-Mestre.', a: 'Talvez. Mas você está. Isso eu vejo. Vou levar a carta ao Conselho.', luz: 2 },
          { t: 'Eu só entrego cartas. A decisão é sua.', a: 'Sábio. E covarde. Os dois juntos, como quase todo mundo.' },
          { t: 'Se a Ordem recusar, a Corte vai lembrar de quem recusou.', a: 'A Ordem lembra há trezentos anos. Ameaças não mudam a memória, só a deixam mais comprida.', sombra: 1 } ] },
        'Volte para a sua emissária. Diga que a carta chegou inteira. E diga que um velho paladino agradece a quem a trouxe.',
      ],
    },
    done: [
      'Ele leu. Ele agradeceu. Um Grão-Mestre agradecendo a um filho do Conde. Isto vai para os livros da Corte.',
      'Seja qual for a resposta da Ordem, você fez a parte mais difícil: entrou na casa do inimigo e saiu sem sangue de ninguém.',
    ],
    choice: { q: 'Lady Mirela pergunta: “A carta chegou como saiu?”', opts: [
      { label: '“Inteira. Eu não toquei no lacre.”', karma: 3, flag: 'vam_tregua', say: 'Então a paz tem uma chance. Pequena. Mas é a primeira em três séculos.', why: 'Você foi a ponte entre dois inimigos e não roubou nada no caminho. Um mensageiro fiel muda o mundo.' },
      { label: '“Abri e acrescentei uma ameaça, para eles levarem a sério.”', karma: -3, flag: 'vam_ameacou_carta', say: '…Você acrescentou. Ótimo. Agora a carta de paz parece uma carta de guerra. Bom trabalho.', why: 'Você colocou o seu orgulho dentro de uma carta de paz. Uma ameaça escondida envenena qualquer trégua.' },
      { label: '“Rasguei no caminho. A Corte não precisa de paz com assassinos.”', karma: -5, flag: 'vam_rasgou_carta', say: 'Então você mentiu ao Conde e à Ordem de uma vez. Talento. Terrível, mas talento.', why: 'Você decidiu sozinho que a guerra devia continuar e mentiu para os dois lados. Muitas vidas pesam nisso.' } ] } },

  { id: 'va10', chain: VC, name: 'A Subida ao Castelo', lvl: 40, giver: MI, turnin: VL, xp: 0, gold: 500, gear: 2, title: 'Sangue da Corte',
    text: 'O Conde convida você a subir a colina. A estrada até o castelo é guardada por carniçais que não respeitam ninguém. Chegue ao portão do Castelo da Colina Vampírica e volte para receber o nome da Corte das mãos do Conde.',
    objs: [{ kind: 'level', n: 40 }, { kind: 'kill', type: 'ghoul', n: 8 }, { kind: 'visit', poi: 'Castelo da Colina Vampírica' }, { kind: 'talk', npc: VL }],
    talk: [
      'Chegou a noite. O Conde vai receber você no alto da colina. Nem todos os filhos sobem. A maioria nunca vê o castelo de perto.',
      'O caminho é perigoso. Os carniçais da colina não reconhecem ninguém. Nem o próprio Conde, às vezes.',
      { r: [
        { t: 'Estou pronto, Lady Mirela. Obrigado por tudo.', a: 'Agradecer a uma vampira… você ainda tem os modos de um vivo. Não perca isso lá em cima.', luz: 1 },
        { t: 'Lá de cima eu vou poder olhar a Corte inteira.', a: 'Vai. E ela vai olhar para você. Cuidado com o que vai mostrar.', sombra: 1 } ] },
      'Suba, chegue ao portão e volte ao Conde. Ele estará esperando, aqui embaixo, na vila. Ele não sobe a colina para ninguém, lembra?',
    ],
    done: [
      'Você subiu a colina e voltou. O portão do meu castelo ainda guarda a marca das suas mãos. Bom.',
      'Trezentos anos, e a cada século eu dou o nome da Corte a pouquíssimos. Você não é o mais forte. Não é o mais esperto. Mas é dos poucos que ainda sabem dizer "obrigado".',
      { me: 'O que significa o nome da Corte, senhor?' },
      'Significa que a noite é sua, agora. E que você responde por ela. Bem-vindo, Sangue da Corte.',
    ] },
];

/* ======================= O TECNOCRATA — "O Preço do Progresso" ======================= */
const TC = 'O Preço do Progresso';
export const TECHNO: QuestDef[] = [
  { id: 'te1', chain: TC, name: 'A Matrícula', lvl: 30, giver: YL, req: 'v_tec', next: 'te2', xp: 0, gold: 220, items: [['potion_g', 3]],
    text: 'O teste de campo da Academia: seis diabretes de laboratório escaparam do porão (um aluno abriu a jaula errada). Recapture-os à força e traga minério de ferro para a sua primeira torreta.',
    objs: [{ kind: 'kill', type: 'imp', n: 6 }, { kind: 'collect', item: 'ore_i', n: 6 }],
    talk: [
      'Você forjou os pregos. Parabéns: agora sabe fazer o que qualquer ferreiro de aldeia faz. Bem-vindo à Academia.',
      'Aqui a primeira lição é a mais chata: tudo tem preço. A pólvora, o vapor, a engrenagem. E a Academia paga as contas vendendo.',
      'A segunda lição é mais divertida. Um aluno abriu a jaula errada no porão. Seis diabretes de laboratório estão soltos por aí, pondo fogo em palheiros.',
      { r: [
        { t: 'Diabretes de laboratório? A Academia cria demônios?', a: 'A Academia ESTUDA demônios. Criar, só a natureza cria. Nós só mantemos em jaula. Mal, aparentemente.' },
        { t: 'E o aluno que abriu a jaula?', a: 'Está limpando o porão com uma escova de dente. Ciência também é castigo.' },
        { t: 'Quanto a Academia paga por isso?', a: 'A Academia paga em conhecimento. E em ouro, um pouco, para quem insiste.', sombra: 1 } ] },
      'Seis diabretes. E seis pedras de minério de ferro: a sua primeira torreta vai ser feita com o que você mesmo trouxer.',
    ],
    done: [
      'Seis diabretes e seis pedras de ferro. Rápido. O meu último aluno levou um mês.',
      'Agora você é tecnocrata de verdade. Não porque sabe montar uma torreta, mas porque já entendeu que tudo isso custa alguma coisa a alguém.',
      { r: [
        { t: 'Custa a quem?', a: 'Aos que não estão na sala quando a gente decide. Sempre. Lembre-se deles.', luz: 1 },
        { t: 'Enquanto não custar a mim, tudo bem.', a: 'Vai custar. Um dia. Mas aprecio a franqueza.', sombra: 1 } ] },
    ] },

  { id: 'te2', chain: TC, name: 'Latão e Estrada', lvl: 31, giver: YL, next: 'te3', xp: 0, gold: 240,
    text: 'A Companhia das Caravanas de Latão é o braço comercial da Academia. Apresente-se à Feitora Brunna, fora do portão sul, e faça a sua primeira escolta: Askavik → Hrafnhöfn, saindo do portão leste.',
    objs: [{ kind: 'talk', npc: BR }, { kind: 'escort', route: 'ak-hr', label: 'Askavik → Hrafnhöfn' }],
    talk: [
      'A Academia não vive de ciência. Vive de vender ciência. Quem vende é a Companhia das Caravanas de Latão.',
      'Carroças a vapor, caldeira de latão, rodas de carvalho. Levam peças para a Catedral, ferramentas para os anões, relógios para o Conde. Sim, para o Conde.',
      { r: [
        { t: 'Vender para vampiros não incomoda você?', a: 'Me incomoda vender para quem não paga. O Conde paga. A Ordem demora. A ciência não pode esperar a fé.', luz: 1 },
        { t: 'Quanto mais clientes, melhor.', a: 'Exato. Você vai se dar bem com a Brunna.' } ] },
      'Fale com a Brunna, no balcão do portão sul. Ela vai te dar a primeira escolta: Askavik até Hrafnhöfn. Fique perto da carroça. Sem escolta o cocheiro não anda.',
    ],
    meet: {
      [BR]: [
        'A aluna nova da Ylva. Ou aluno. A Academia manda gente de jaleco para a estrada e se surpreende quando volta mordida.',
        'Escolta simples: Askavik até Hrafnhöfn. A carroça sai do portão leste. Lobos no caminho, nada que a sua engenhoca não resolva.',
        { r: [
          { t: 'A carroça chega inteira. Pode contar.', a: 'Conto com tudo. É o meu ofício.' },
          { t: 'Por que a Companhia não contrata guardas de verdade?', a: 'Contrata. Eles estão ali, a pé, um de cada lado. Mas lobo não respeita guarda: respeita fogo. E você tem fogo.' } ] },
      ],
    },
    done: [
      'A Brunna mandou dizer que você é "aceitável". Vindo dela, é quase uma medalha.',
      'Agora você conhece a estrada. A estrada também conhece você. Isso vai ser útil.',
    ] },

  { id: 'te3', chain: TC, name: 'O Órgão da Catedral', lvl: 32, giver: YL, next: 'te4', xp: 0, gold: 260,
    text: 'O órgão a vapor e os sinos novos da Catedral de Askavik precisam de instalação. A Bispa Solveig não confia em engrenagens. Vá à Catedral e fale com ela.',
    objs: [{ kind: 'visit', poi: 'Catedral de Askavik' }, { kind: 'talk', npc: SO }],
    talk: [
      'A Catedral de Askavik comprou um órgão a vapor. Quarenta tubos, um fole que respira sozinho. Uma obra-prima. Minha, aliás.',
      'A Bispa Solveig odeia. Odeia a mim, odeia a Academia e odeia o vapor. Mas os fiéis vão ouvir de longe, e ela sabe contar.',
      'Quero que você instale. E quero outra coisa, mais delicada.',
      { r: [
        { t: 'Que coisa?', a: 'Um "ouvido". Um tubo pequeno, escondido no fole, que leva os sons da Catedral até a Academia. Saber o que a Igreja planeja vale mais do que qualquer encomenda.' },
        { t: 'Se for coisa errada, eu não faço.', a: 'Eu ainda nem disse o que é. Mas aprecio quem tem limites. Poucos aqui têm.', luz: 1 } ] },
      'Instale o órgão. Quanto ao "ouvido"… decida você. Eu não vou perguntar duas vezes.',
    ],
    meet: {
      [SO]: [
        'A aprendiz da Ylva. Veio pôr engrenagem na casa do Olho. Entre. Não toque no altar.',
        'Quarenta tubos de latão. Os fiéis vão chorar, dizem. Eu vou chorar também, mas por outro motivo.',
        'Diga-me, tecnocrata. A Academia vende a mesma coisa para o Conde de Corvoscuro? Relógios, vidros, engrenagens?',
        { r: [
          { t: 'Vende, Bispa. É verdade.', a: 'Obrigada pela verdade. É mais do que a sua mestra me deu em dez anos.', luz: 2, flag: 'tec_verdade_bispa' },
          { t: 'Não sei de nada disso. Só vim instalar.', a: 'Ninguém nunca sabe de nada. É impressionante quanta ignorância cabe numa academia.' },
          { t: 'Isso é segredo da Academia.', a: 'Então a Academia tem segredos com o Conde e não com a Igreja. Anotado, pelo Olho e por mim.', sombra: 1 } ] },
        'Instale. E que o Olho veja o que você coloca dentro do meu órgão.',
      ],
    },
    done: [
      'Ouvi daqui. Quarenta tubos, e a cidade inteira parou na praça. Eu disse que era uma obra-prima.',
      'Agora me diga, só entre nós: o "ouvido" está lá?',
    ],
    choice: { q: 'Dentro do fole do órgão, você…', opts: [
      { label: 'Instalou só o órgão. Honesto, como prometeu à Bispa.', karma: 3, flag: 'tec_honesto', say: 'Sem ouvido. Hm. Vou fingir que não estou decepcionada. A Bispa vai confiar em você, e isso também é um recurso.', why: 'Você teve a chance de espionar quem confiou a casa a você e não espionou. Confiança respeitada pesa a favor.' },
      { label: 'Escondeu o "ouvido" no fole, como a Academia pediu.', karma: -3, flag: 'tec_ouvido', say: 'Perfeito. A partir de hoje, a Academia escuta as rezas da Catedral. E os planos. Sobretudo os planos.', why: 'Você usou a confiança de uma casa de fé para espionar. O Olho viu o tubo escondido.' } ] } },

  { id: 'te4', chain: TC, name: 'Relógio de Sangue', lvl: 33, giver: YL, next: 'te5', xp: 0, gold: 280,
    text: 'O Conde quer um segundo relógio de sangue. Lady Mirela, a emissária da Corte, recebe em Corvoscuro, só à noite. Os paladinos pediram em segredo que você sabote o mecanismo. Leve o relógio e decida.',
    objs: [{ kind: 'talk', npc: MI }],
    talk: [
      'Outro relógio de sangue para o Conde. O primeiro… teve problemas no transporte. Um paladino, imagino.',
      'Desta vez você entrega pessoalmente, a Lady Mirela, em Corvoscuro. Só à noite: a Corte não recebe de dia, por motivos óbvios.',
      'E… recebi um bilhete da Ordem. Pedem que o relógio "atrase vinte minutos". Vinte minutos, para quem dorme de dia, é a diferença entre acordar e queimar.',
      { r: [
        { t: 'Isso é assassinato.', a: 'É. Com engrenagem, mas é. Fico feliz que você chame as coisas pelo nome.', luz: 2 },
        { t: 'Quanto a Ordem paga pelos vinte minutos?', a: 'Nada. Eles pedem em nome da luz. A luz é péssima cliente.', sombra: 1 },
        { t: 'E você? O que você quer que eu faça?', a: 'Eu quero que a Academia continue vendendo para os dois lados. Decida sem me envolver.' } ] },
    ],
    meet: {
      [MI]: [
        'A Academia mandou alguém de verdade desta vez. Não um carroceiro. Que honra.',
        'O relógio, por favor. O Conde não dorme direito desde que o primeiro sumiu na estrada.',
        { r: [
          { t: 'Aqui está. Funciona perfeitamente, senhora.', a: 'Perfeitamente. Gosto dessa palavra. Vou cobrar por ela.' },
          { t: 'Antes, uma pergunta: quanto o Conde pagaria por saber quem pediu para sabotar?', a: 'Ah. Muito. E a resposta valeria uma guerra. Pense bem antes de vender.', sombra: 1 } ] },
      ],
    },
    done: [
      'Voltou de Corvoscuro com o pescoço intacto. Eu tinha apostado que sim. Ganhei uma moeda do Brokk.',
      'E o relógio? Não me conte se não quiser. A Academia sobrevive a não saber.',
    ],
    choice: { q: 'O relógio que você entregou ao Conde…', opts: [
      { label: 'Funciona perfeitamente. Você não sabotou.', karma: 0, flag: 'tec_entregou', say: 'Neutro. Como a Academia. O Conde vai continuar comprando, a Ordem vai continuar reclamando. Equilíbrio.', why: 'Você não feriu ninguém e não tomou lado. O Olho anota que você é fiel ao trato.' },
      { label: 'Atrasa vinte minutos, como a Ordem pediu.', karma: -2, flag: 'tec_sabotou', say: 'Vinte minutos. Algum vampiro vai queimar numa manhã. Talvez um que merecia. Talvez não. Você nunca vai saber.', why: 'Você matou à distância, com uma engrenagem, alguém que nunca viu. A Ordem agradece; o Olho pesa.' } ] } },

  { id: 'te5', chain: TC, name: 'Caravana Caída', lvl: 34, giver: YL, next: 'te6', xp: 0, gold: 300, gear: 1,
    text: 'Uma caravana da Companhia caiu no Passo de Midvangr, entre Kaldrfoss e Brasaforja. Os lobos do passo e diabretes cercam os destroços. Limpe e examine: a Brunna acha que foi traição.',
    objs: [{ kind: 'rescue', route: 'kf-bf', label: 'Passo de Midvangr', at: 0.42, note: 'No livro de bordo, a letra da cocheira: “Rota e horário passados por um tal de V., em Askavik, por trinta moedas.” Embaixo, o lacre de um anel com um corvo. Vesna Corvo-Negro, a agiota da praça.' }],
    talk: [
      'Uma caravana caiu no Passo de Midvangr. Peças de caldeira para Brasaforja, três cocheiros. Dois voltaram.',
      'A Brunna diz que os lobos estavam esperando no ponto exato, na hora exata. Lobos não leem horários.',
      { r: [
        { t: 'Alguém vendeu a rota.', a: 'É o que eu acho. Vá ao passo, limpe a área e examine os destroços. O livro de bordo diz tudo, se ainda estiver inteiro.' },
        { t: 'E o terceiro cocheiro?', a: 'Chama-se Ivo. Não voltou. Se achar alguma coisa dele, traga para a família.', luz: 1 } ] },
    ],
    done: [
      'Vesna Corvo-Negro. A agiota da praça vendendo horários de caravana a quem paga. Lobos não leem, mas quem solta os lobos lê.',
      'A Companhia pode resolver de dois jeitos. O jeito certo e o jeito lucrativo. Você achou a prova: você decide.',
    ],
    choice: { q: 'Com o livro de bordo na mão, você…', opts: [
      { label: 'Entrega a prova à Guarda de Askavik.', karma: 3, flag: 'tec_denunciou_vesna', say: 'O Capitão Eirik prendeu a Vesna esta manhã. A Companhia perdeu uma informante e ganhou estradas mais seguras.', why: 'Você escolheu a lei e a segurança de quem anda nas estradas. Justiça pública pesa a favor.' },
      { label: 'Chantageia a Vesna: o silêncio custa uma parte do lucro dela.', karma: -4, flag: 'tec_chantagem_vesna', say: 'Uma sócia nova, hm? A Vesna paga bem e esquece pouco. Cuidado com as costas.', why: 'Você transformou a morte do Ivo em renda. As estradas continuam vendidas, agora com você no meio.' } ] } },

  { id: 'te6', chain: TC, name: 'O Neutro Verdadeiro', lvl: 35, giver: YL, next: 'te7', xp: 0, gold: 320,
    text: 'A Academia precisa provar que não tem dono. Lady Mirela (Corvoscuro, à noite) e a Bispa Solveig (Askavik) vão fazer encomendas grandes. Ouça as duas. Depois decida se a Academia recusa as duas, ou escolhe um lado.',
    objs: [{ kind: 'talk', npc: MI }, { kind: 'talk', npc: SO }],
    talk: [
      'Os dois lados querem a Academia só para si. A Igreja quer um guardião mecânico para a Catedral; a Corte quer vidros para o castelo inteiro.',
      'Se atendermos só um, viramos arma. Se atendermos os dois, viramos traidores para os dois. A Academia sempre foi neutra. Neutra de verdade.',
      'Quero que você ouça as duas encomendas e depois me diga o que fazer. Desta vez a decisão não é minha: é sua, e eu assino embaixo.',
      { r: [
        { t: 'Neutro de verdade é recusar os dois.', a: 'Pode ser. E perder metade do dinheiro da Academia. A neutralidade é cara.', luz: 1 },
        { t: 'Neutro é vender para quem paga mais.', a: 'Isso é comércio, não neutralidade. Mas muita gente confunde.' } ] },
    ],
    meet: {
      [MI]: [
        'A Academia mandou você de novo. Gosto de rostos conhecidos.',
        'A encomenda: vitrais filtrantes para o castelo inteiro. Duzentas janelas. O Conde quer ver o pôr do sol de todas elas.',
        'Pagamos o triplo. E pedimos uma coisa pequena: que a Academia não venda nada à Ordem por um ano.',
        { r: [
          { t: 'A Academia não tem dono, senhora.', a: 'Todo mundo tem dono, querido. Alguns só ainda não sabem o nome.' },
          { t: 'Vou levar a proposta.', a: 'Leve. E leve isto também: a Corte lembra de quem diz sim.' } ] },
      ],
      [SO]: [
        'Um guardião mecânico para a Catedral. Bronze, vapor, e uma espada que não cansa. Os Desfiados entraram na cripta duas vezes este ano.',
        'Em troca, a Igreja abre à Academia os arquivos proibidos. Os livros que nem eu leio.',
        'Uma condição: a Academia para de vender ao Conde. Para sempre.',
        { r: [
          { t: 'A Academia não escolhe lados, Bispa.', a: 'Todo mundo escolhe. Quem diz que não escolhe já escolheu o lado de quem paga mais.' },
          { t: 'Vou levar a proposta.', a: 'Leve. O Olho vai junto.' } ] },
      ],
    },
    done: [
      'Duas encomendas, duas condições, a mesma condição: "pare de vender ao outro". Eles se parecem mais do que imaginam.',
      'E então, {nome}? O que a Academia faz?',
    ],
    choice: { q: 'Em nome da Academia, você responde às duas encomendas…', opts: [
      { label: 'Recusa as duas: a Academia não tem dono.', karma: 5, flag: 'tec_neutro', say: 'Neutro de verdade. Perdemos o triplo do ouro e um arquivo inteiro. E ganhamos a única coisa que não se compra: ninguém manda em nós.', why: 'Você recusou riqueza dos dois lados para não virar a arma de ninguém. Neutralidade sincera é rara e pesa a favor.' },
      { label: 'Aceita a Igreja: o guardião e os arquivos proibidos.', karma: -2, flag: 'tec_lado_igreja', say: 'Os arquivos proibidos… está bem. A Corte não vai gostar. E a Corte não esquece.', why: 'Você escolheu um lado por conhecimento. A Academia virou arma da Igreja contra a noite.' },
      { label: 'Aceita a Corte: o triplo do ouro.', karma: -2, flag: 'tec_lado_corte', say: 'O triplo. A Academia vai ter o melhor laboratório do mundo. E a Bispa vai pregar contra nós todo domingo.', why: 'Você escolheu um lado por ouro. A Academia virou arma da Corte contra a luz.' } ] } },

  { id: 'te7', chain: TC, name: 'Engrenagens nos Recifes', lvl: 36, giver: YL, turnin: OR, next: 'te8', xp: 0, gold: 340, gear: 1,
    text: 'O primeiro navio a vapor da Companhia afundou nos Recifes da Graxa com a caldeira-protótipo. O Mestre Orvald, em Porto Caldeira, quer as peças de volta, sobretudo a válvula-mestra, que a maré enterrou na praia: ligue a Lógica do Mundo (F) para achá-la. Os afogados de lá não querem devolver.',
    objs: [{ kind: 'visit', poi: 'Porto Caldeira' }, { kind: 'kill', type: 'skeleton', n: 10 }, { kind: 'sense', what: 'dispositivo', label: 'Achar a válvula-mestra da caldeira na areia', at: 'Porto Caldeira', dx: 16, dy: 12 }, { kind: 'talk', npc: OR }],
    talk: [
      'O Mestre Orvald, em Porto Caldeira, construiu o primeiro navio a vapor. Funcionou por três dias. No quarto, achou um recife.',
      'A caldeira-protótipo está no fundo, entre os afogados. Sim, os afogados andam. A Costa do Vapor tem mortos teimosos.',
      { r: [
        { t: 'E a tripulação?', a: 'Nadou. Quase toda. Orvald perdeu o navio e um sobrinho. Não toque no assunto do sobrinho.', luz: 1 },
        { t: 'A caldeira vale quanto?', a: 'Vale dez anos de pesquisa. Não está à venda.', sombra: 1 } ] },
      'A peça que importa é a válvula-mestra: pequena, de latão, enterrada em algum lugar da praia. Ligue a Lógica do Mundo (F): o latão ainda guarda calor e campo, e os seus instrumentos acham o que o olho não acha.',
      'Vá até Porto Caldeira, no extremo sul. Limpe os afogados da praia e fale com o Orvald. Ele é anão: não espere abraço.',
    ],
    done: [
      'As peças. As minhas peças. Cheias de craca, mas inteiras. Dez anos, aluno da Ylva. Dez.',
      'Meu sobrinho dizia que o vapor ia unir o mundo. Talvez una. Talvez afunde. Mas agora, ao menos, a gente tenta de novo.',
      { r: [
        { t: 'Ele tinha razão, mestre. O vapor vai unir o mundo.', a: '…Diga isso à Ylva. Ela vai rir. Eu não.', luz: 2 },
        { t: 'A Academia agradece pela devolução.', a: 'A Academia não agradece nada. Agradeça você, e eu acredito.' } ] },
    ] },

  { id: 'te8', chain: TC, name: 'O Autômato do Bispo', lvl: 37, giver: YL, turnin: SO, next: 'te9', xp: 0, gold: 360,
    text: 'Mesmo depois de tudo, a Catedral ainda precisa de um guardião contra os Desfiados. Junte o ferro para o autômato e leve a proposta final à Bispa Solveig.',
    objs: [{ kind: 'collect', item: 'ore_i', n: 10 }],
    talk: [
      'A Bispa voltou a pedir o guardião mecânico. Os Desfiados entraram de novo na cripta. Desta vez levaram uma criança do coro.',
      'Você decidiu o que a Academia faz com os lados. Agora é outra pergunta: ajudar uma igreja atacada é tomar lado, ou só ser decente?',
      { r: [
        { t: 'Proteger uma criança não é tomar lado.', a: 'Concordo. Por isso vou fazer o autômato. Sem condição nenhuma.', luz: 2 },
        { t: 'Só se ela abrir os arquivos proibidos.', a: 'Você aprende rápido o preço das coisas. Rápido demais, talvez.', sombra: 1 } ] },
      'Dez pedras de ferro. O resto da máquina eu faço. A entrega, você faz.',
    ],
    done: [
      'Um guardião de bronze na porta da cripta. Os fiéis tocam no braço dele ao passar, como se fosse santo.',
      'A Ylva mandou dizer que não quer nada em troca. Ninguém nunca me deu nada sem pedir em troca. Não sei o que fazer com isso.',
    ],
    choice: { q: 'A Bispa estende a chave dos arquivos proibidos: “Leve. Não como pagamento. Como confiança.” Você…', opts: [
      { label: 'Recusa a chave. O autômato foi presente.', karma: 2, flag: 'tec_recusou_arquivos', say: 'Recusou. Então era mesmo presente. O Olho viu, tecnocrata. Eu também.', why: 'Você deixou um gesto bom ser só bom, sem cobrar depois. É raro e pesa a favor.' },
      { label: 'Aceita a chave para a Academia.', karma: -1, flag: 'tec_arquivos', say: 'Confiança, então. Espero que ela não vire arma nas mãos da sua mestra.', why: 'Você aceitou o que foi dado livremente. Não é crime, mas um presente que vira troca perde um pouco da luz.' } ] } },

  { id: 'te9', chain: TC, name: 'Sabotagem', lvl: 38, giver: YL, next: 'te10', xp: 0, gold: 380,
    text: 'Alguém está explodindo caravanas da Companhia na Grande Rota (Askavik → Austrvik). Os Desfiados, a Ordem ou alguém de dentro? Vá ao ponto da última explosão, limpe os saqueadores e examine os destroços.',
    objs: [{ kind: 'rescue', route: 'ak-au', label: 'a Grande Rota', at: 0.55, note: 'Entre a lona queimada, um pavio de pólvora da própria Academia, cortado na medida certa. E um bilhete: “Sem estradas, sem vendas ao Conde. Sem vendas ao Conde, sem relógios. — Um amigo da Ordem que não usa escudo.” Alguém de dentro da Academia, a mando de um paladino.' }],
    talk: [
      'Três caravanas explodiram na Grande Rota em um mês. Pólvora, fogo, nenhum sobrevivente na última.',
      'A Brunna culpa os Desfiados. A Ordem culpa a Corte. A Corte culpa a Ordem. Eu culpo a pólvora, que pelo menos é honesta.',
      { r: [
        { t: 'Vou descobrir quem foi.', a: 'Ótimo. E quando descobrir, me conte antes de contar a todos. Às vezes a verdade precisa de um minuto para respirar.' },
        { t: 'Talvez alguém de dentro da Academia.', a: '…Você pensa como eu. É desagradável. Vá ver.', luz: 1 } ] },
    ],
    done: [
      'Pavio da Academia. Um de nós. Eu desconfiava; agora sei.',
      '"Um amigo da Ordem que não usa escudo." Um aluno que acredita que, sem estradas, o Conde não compra relógios. Pela luz, explodiu três cocheiros.',
    ],
    choice: { q: 'Você sabe quem foi: um aluno da Academia, de boa fé e mãos sujas. Você…', opts: [
      { label: 'Conta tudo a Ylva e à Ordem: o aluno responde, a Ordem também.', karma: 3, flag: 'tec_expos_sabotagem', say: 'Verdade inteira, para todos. A Ordem vai se envergonhar, o aluno vai ser julgado e as estradas vão ficar mais seguras.', why: 'Você não escondeu culpado de nenhum lado. A verdade dita a todos é a base da paz.' },
      { label: 'Culpa os Desfiados em público para proteger a Academia.', karma: -5, flag: 'tec_culpou_desfiados', say: 'Os Desfiados levam a culpa, a Academia fica limpa. E o aluno… vai fazer de novo. Eles sempre fazem.', why: 'Você mentiu para salvar a reputação da Academia, e o verdadeiro culpado continua livre para explodir outras carroças.' },
      { label: 'Resolve em silêncio: expulsa o aluno, sem contar a ninguém.', karma: 1, flag: 'tec_silencio', say: 'Discreto. A Academia agradece. A Ordem nunca vai saber o que um amigo dela fez.', why: 'Você parou o crime sem guerra entre os lados. Mas três cocheiros morreram, e as famílias nunca vão saber por quê.' } ] } },

  { id: 'te10', chain: TC, name: 'A Grande Rota', lvl: 40, giver: YL, xp: 0, gold: 500, gear: 2, title: 'Mestre de Rota',
    text: 'A Grande Rota, Askavik → Austrvik, vai ser inaugurada com escolta própria. A caravana leva carga para os dois lados: a Abadia e a Corte. Leve-a até o fim. A primeira rota com o seu nome.',
    objs: [{ kind: 'level', n: 40 }, { kind: 'escort', route: 'ak-au', label: 'A Grande Rota (Askavik → Austrvik)' }, { kind: 'talk', npc: YL }],
    talk: [
      'A Grande Rota. Askavik até Austrvik, passando por Lundr e Eikvik. A estrada mais longa da Companhia.',
      'A primeira caravana leva carga para todo mundo: sinos para a Abadia, vidros para o Conde, ferramentas para os anões, remédio para os vilarejos. Neutra. Como tem que ser.',
      'E vai com a sua escolta. Com o seu nome no livro de bordo.',
      { r: [
        { t: 'Vou levar até o fim, Ylva. Para todo mundo.', a: 'É exatamente isso que eu queria ouvir. Para todo mundo.', luz: 2 },
        { t: 'E o lucro da rota?', a: 'Dez por cento para quem inaugura. Eu sei, eu sei: você já tinha feito a conta.', sombra: 1 } ] },
      'A carroça sai do portão sul. Não deixe ela tombar. Desta vez o mundo inteiro está olhando.',
    ],
    done: [
      'Chegou. A Grande Rota está aberta. O Orvald mandou um barril de cerveja anã. A Brunna sorriu, o que é preocupante.',
      'Quando você entrou aqui, eu disse que tudo tem preço. Continua sendo verdade. Mas agora você sabe escolher quem paga.',
      { me: 'E o que eu sou agora?' },
      'Agora você é Mestre de Rota. As estradas vão ter o seu nome. Tente merecer cada curva.',
    ] },
];

/* ======================= os ecos das sagas: o mundo lembra ======================= */
Object.assign(ECOS, {
  pal_voto_pedem: { [AL]: 'Os noviços falam do seu voto. "Os que pedem." O Cassius chorou quando ouviu, sabia? Ele nega.' },
  pal_voto_ordem: { [AL]: 'Você jurou pela Ordem. Eu entendo. Mas a Ordem são pessoas, {nome}. Não esqueça.' },
  pal_queimou_carga: { [BR]: 'Você é o paladino que queimou a nossa carroça na estrada. A Companhia anota tudo. O seu preço aqui subiu.', [YL]: 'Um paladino queimou um relógio meu na estrada. Três meses de trabalho. Foi você? Hm.' },
  pal_vendeu_relogio: { 'Vesna Corvo-Negro': 'Um relógio de sangue apareceu em Hrafnhöfn. Quem vendeu tem gosto bom para negócios. Venha me ver.', [CS]: 'Ainda penso no relógio que você vendeu. Peço a Auréon que tenha caído em mãos boas. Duvido.' },
  pal_curou: { [TB]: 'A moça da cela da aurora… a Edda. Ela tocou o sino comigo hoje de manhã. Deu certo, irmão. Deu certo.' },
  pal_deixou_fugir: { [MI]: 'Uma cria nova chegou à Corte dizendo que um paladino a deixou fugir. Ela fala de você com carinho. Curioso.' },
  pal_tregua: { [AL]: 'Você votou pela trégua com o Conde. Metade da Ordem te chama de traidor. A outra metade tem esperança. Eu estou na segunda.' },
  pal_traiu: { [AL]: 'Fingir a paz para atacar? Eu fui seu guia na prova. Não sei mais quem você é.', [CS]: '…' },
  vam_matou_inocente: { [AL]: 'Um pastor apareceu sem sangue no campo de Corvoscuro. Eu sei que foi alguém da Corte. Sei que foi você?' },
  vam_amizade_aldric: { [AL]: 'Pensei na sua resposta. "Alguém que queria proteger os outros." Volte a falar comigo quando quiser. A capela fica aberta à noite.' },
  vam_poupou_aldric: { [CS]: 'O Aldric me contou de um vampiro que conversou e o deixou ir. Trezentos anos de guerra e é assim que a paz começa: com uma conversa.' },
  vam_bebeu_aldric: { [CS]: 'O Aldric está na enfermaria, branco como cera. Ele ainda diz que quer conversar com você. Eu não diria.' },
  vam_trouxe: { [VL]: 'O filho perdido que você trouxe já fala de novo. Pede perdão a cada hora. Eu deixo.' },
  vam_tregua: { [VL]: 'A carta chegou inteira. O Grão-Mestre respondeu com uma vela acesa. É mais do que eu esperava.' },
  tec_honesto: { [SO]: 'O órgão toca bonito. E é só um órgão, não é? Obrigada por isso.' },
  tec_ouvido: { [SO]: 'Às vezes o órgão sussurra quando ninguém está tocando. Engraçado, não acha, tecnocrata?' },
  tec_sabotou: { [MI]: 'Um dos nossos queimou ao amanhecer. O relógio dele atrasava vinte minutos. Que coincidência, não é?' },
  tec_denunciou_vesna: { 'Guarda Eirik': 'A agiota está na masmorra por sua causa. As estradas agradecem.', [BR]: 'As caravanas rodam mais tranquilas desde que a Vesna caiu. A Companhia tem memória boa.' },
  tec_chantagem_vesna: { 'Vesna Corvo-Negro': 'Minha sócia preferida. O seu quinhão está no cofre. Não pergunte de onde veio.' },
  tec_neutro: { [MI]: 'A Academia recusou o triplo do ouro. Admito: fiquei impressionada.', [SO]: 'A Academia recusou os arquivos e o Conde. Talvez Ylva tenha alma, afinal.' },
  tec_lado_corte: { [SO]: 'A Academia escolheu o Conde. Não pise mais na minha Catedral com essas botas.' },
  tec_lado_igreja: { [MI]: 'A Academia escolheu a Igreja. A Corte vai comprar vidros em outro lugar. E vai lembrar.' },
});

/* ======================= as missões do instinto da raça (24/10) =======================
   Cada raça aprende a ligar o seu Instinto (F) numa história curta, antes do nível 30: o humano rastreia um sequestro,
   o elfo conversa com um espírito da mata, o anão escuta a montanha. Depois disso, o mundo inteiro tem segredos esperando. */
export const RACE_INSTINCT: QuestDef[] = [
  { id: 'hu1', chain: 'Instinto de Sobrevivência', name: 'O Sequestro de Skógar', lvl: 12, origin: 'human', giver: 'Marta, a Moleira', xp: 0, gold: 90, items: [['potion', 3]],
    text: 'Nina, a filha da moleira de Skógar, sumiu na mata ao entardecer. Na lama há pegadas pequenas e outras, tortas, de puglin. Ligue o seu Instinto de Sobrevivência (F) e siga o rastro antes que a chuva apague.',
    objs: [{ kind: 'sense', what: 'rastro', label: 'Seguir as pegadas de Nina e dos puglins', at: 'Skógar', dx: 24, dy: 16 }, { kind: 'kill', type: 'puglin', n: 6 }, { kind: 'talk', npc: 'Marta, a Moleira' }],
    talk: [
      'Por favor. Por favor, você tem cara de quem sabe andar na mata.',
      'A minha Nina foi buscar amora ao entardecer e não voltou. Achei a cesta virada perto do moinho, e na lama… pegadas dela. E outras. Tortas. De puglin.',
      'Os homens da vila dizem que puglin não leva criança. Que eu estou nervosa. Eu sei o que eu vi.',
      { r: [
        { t: 'Eu acredito na senhora. Vou achar a Nina.', a: 'Que o Olho te guie. Ela tem uma fita vermelha no cabelo.', luz: 2 },
        { t: 'Pegadas na lama somem rápido. Como vou seguir?', a: 'Dizem que quem tem medo de verdade enxerga melhor. Feche os olhos, respire, e deixe o corpo ver por você.' },
        { t: 'Quanto a senhora paga?', a: 'Tudo o que eu tenho. Que é quase nada. Mas é tudo.', sombra: 1 } ] },
      { who: 'Instinto', t: 'Aperte F para ligar o seu Instinto de Sobrevivência. O rastro só aparece para quem está atento.' },
    ],
    done: [
      'NINA! Ai, minha filha, minha filha…',
      { who: 'Nina', t: 'Mãe, não briga com o puglin pequeno. Ele me dava água escondido dos outros.' },
      'O que aconteceu lá, viajante? Me conte tudo.',
    ],
    choice: { q: 'No acampamento, o puglin menor se encolheu atrás da Nina, que o protegia. Você…', opts: [
      { label: 'Deixou o pequeno fugir para a mata.', karma: 4, flag: 'hu_puglin_poupado', say: 'Uma criança pediu por ele, e você ouviu. Skógar não vai esquecer o seu nome.', why: 'Você ouviu uma criança e poupou quem a protegeu, mesmo sendo do outro lado. Misericórdia escolhida pesa a favor.' },
      { label: 'Acabou com todos. Puglin é puglin.', karma: -3, flag: 'hu_puglin_morto', say: 'A Nina chorou o caminho todo. Mas está viva. Obrigada.', why: 'Você salvou a menina, e isso pesa a favor. Mas matou quem ela pediu para poupar.' } ] } },

  { id: 'el1', chain: 'Elo da Floresta', name: 'As Vozes da Mata', lvl: 6, origin: 'elf', giver: 'Anciã Faelwen', xp: 0, gold: 50, items: [['potion', 2]],
    text: 'A nascente de Lithendel ficou amarga e as fadas enlouqueceram. O espírito da nascente só fala com quem liga o Elo da Floresta (F). Ache-o, ouça o que ele diz e acalme as fadas.',
    objs: [{ kind: 'sense', what: 'espirito', label: 'Encontrar o espírito da nascente', at: 'Lithendel', dx: -20, dy: 14, spirit: { name: 'Espírito da Nascente', lines: ['Você me vê. Faz tanto tempo que ninguém me vê…', 'Alguém jogou ferro de forja na minha água. O ferro grita, e as fadas enlouquecem com o grito.', 'Tire as fadas do grito, criança da folha. O resto, o tempo lava.'] } }, { kind: 'kill', type: 'fairy', n: 6 }, { kind: 'talk', npc: 'Anciã Faelwen' }],
    talk: [
      'Você ouviu também, não ouviu? Aquele silêncio no meio do canto das árvores.',
      'A nascente de Lithendel ficou amarga. As fadas, que dançavam nela, agora mordem quem passa.',
      'Os espíritos da mata não falam com orelhas. Falam com o Elo, o fio que todo elfo tem com a floresta, mesmo os que esqueceram.',
      { r: [
        { t: 'Me ensine a ouvir, Anciã.', a: 'Não se ensina. Se lembra. Feche os olhos, ligue o Elo, e ande até onde a mata fica mais fria.', luz: 1 },
        { t: 'Espíritos? Eu achava que era história de criança.', a: 'Todas as histórias de criança são verdade. Só que pela metade.' } ] },
      { who: 'Instinto', t: 'Aperte F para ligar o Elo da Floresta. Espíritos, rastros e segredos só aparecem com ele ligado.' },
    ],
    done: [
      'As fadas voltaram a dançar. E você está com o olhar de quem conversou com alguém que ninguém vê.',
      'Ferro de forja na nascente… alguém de fora. Vou mandar os guardiões vigiar a trilha dos anões.',
      { r: [
        { t: 'Não culpe os anões sem prova, Anciã.', a: 'Sábio. A pressa é o pior dos venenos. Vou procurar prova antes de culpa.', luz: 2 },
        { t: 'Anão é tudo igual. Foram eles.', a: 'Talvez. Mas a mata não gosta de quem odeia por atacado.', sombra: 1 } ] },
    ] },

  { id: 'an1', chain: 'Sentido da Pedra', name: 'O Eco nas Galerias', lvl: 6, origin: 'dwarf', giver: 'Mestre-Mineiro Dvalin', xp: 0, gold: 50, items: [['potion', 2]],
    text: 'Um mineiro jovem, Kili, ficou preso depois de um desmoronamento perto de Brasaforja. Ele bate na rocha para pedir socorro, mas só quem tem o Sentido da Pedra ligado (F) escuta o eco. Siga as batidas, afaste as ratazanas e volte.',
    objs: [{ kind: 'sense', what: 'rastro', label: 'Seguir o eco das batidas na rocha', at: 'Brasaforja', dx: 18, dy: -16 }, { kind: 'kill', type: 'rat', n: 6 }, { kind: 'talk', npc: 'Mestre-Mineiro Dvalin' }],
    talk: [
      'Desmoronou o poço velho, ao norte. O Kili estava lá embaixo. Dezesseis anos, barba nenhuma, coragem demais.',
      'Os velhos dizem que ele morreu. Eu digo que um anão soterrado bate na pedra até o último fôlego. E a pedra repete.',
      { r: [
        { t: 'Eu escuto a pedra, mestre. Vou achar o Kili.', a: 'Isso. Não com o ouvido: com o Sentido da Pedra. Todo anão tem. A maioria esquece de usar.', luz: 1 },
        { t: 'E se ele já estiver morto?', a: 'Então você traz o martelo dele. A família merece o martelo.' } ] },
      { who: 'Instinto', t: 'Aperte F para ligar o Sentido da Pedra. Ecos, veios e coisas perdidas debaixo da terra aparecem para você.' },
    ],
    done: [
      'O Kili está vivo. Magro, sujo, chorando de raiva por ter chorado. Vivo.',
      'Você escutou a montanha. Isso não se ensina numa forja. Brasaforja te deve uma.',
    ] },
];

/* ======================= O LOBISOMEM — "A Lua que Chama" (Uivo Antigo · Desfiados) =======================
   Mestra: Ulfrun, a Mãe-Alfa, na tribo do Uivo Antigo (Selva Licantropa). Tom: matilha, fome e lealdade. A lua não pergunta se você
   quer; ela chama. O lobisomem vive entre três inimigos: os caçadores de prata do Clã Helsing, as crias do Conde e a própria fome.
   O Faro da Lua (o Instinto do lobisomem, tecla F) é a alma desta saga: a matilha caça pelo nariz. */
const UL = 'Ulfrun, a Mãe-Alfa', UK = 'Ulfrik', LC = 'A Lua que Chama';
export const WEREWOLF: QuestDef[] = [
  { id: 'la1', chain: LC, name: 'O Primeiro Uivo', lvl: 30, giver: UL, req: 'v_lob', next: 'la2', xp: 0, gold: 220, items: [['potion_g', 3]],
    text: 'A primeira caçada com a matilha. Quatro cervos e quatro javalis: o que se mata, se come, e o que se come, se divide.',
    objs: [{ kind: 'kill', type: 'deer', n: 4 }, { kind: 'kill', type: 'boar', n: 4 }],
    talk: [
      'Você ainda cheira a gente. A casa, a pão, a sabão. Isso passa.',
      'A primeira lei da matilha não é sobre lua nem sobre dente. É sobre fome: o que se mata, se come. O que se come, se divide. Quem mata por matar não é lobo. É doença.',
      { r: [
        { t: 'Vou caçar só o que a matilha precisa.', a: 'Então você já entendeu metade. A outra metade a lua ensina.', luz: 1 },
        { t: 'E se eu quiser caçar mais?', a: 'Então você vai descobrir por que os carniçais andam sozinhos.', sombra: 1 },
        { t: 'Eu nunca comi carne crua.', a: 'Vai comer. E vai gostar. É isso que assusta.' } ] },
      'Quatro cervos, quatro javalis. Os filhotes esperam na Árvore-Mãe.',
    ],
    done: [
      'Sangue no queixo e nos dedos. Os filhotes já sentiram o cheiro e estão rodando a árvore.',
      'Agora a parte que conta. A matilha olha o que você faz com a caça.',
    ],
    choice: { q: 'A carne está no chão, os filhotes esperam e a sua fome ruge. Você…', opts: [
      { label: 'Serve os filhotes primeiro e come por último.', karma: 4, flag: 'lob_filhotes', say: 'Por último. Como uma mãe-alfa. A matilha viu, e não vai esquecer.', why: 'Você teve fome e alimentou os mais fracos antes. É a lealdade mais antiga que existe.' },
      { label: 'Come primeiro. Quem caçou, come.', karma: -1, flag: 'lob_primeiro', say: 'Justo, pela lei das feras. Pela nossa, menos. Os filhotes vão lembrar.', why: 'Não houve crueldade, só fome. Mas a matilha mede quem você é pelo que você divide.' },
      { label: 'Deixa uma parte para os corvos e para a mata.', karma: 2, flag: 'lob_mata', say: 'A mata devolve o que recebe. Selvar fazia assim. Faz tempo que ninguém faz.', why: 'Você devolveu à terra uma parte do que tirou dela. Respeito pelo que alimenta pesa a favor.' } ] } },

  { id: 'la2', chain: LC, name: 'O Filhote Perdido', lvl: 31, giver: UL, next: 'la3', xp: 0, gold: 230,
    text: 'Bran, um filhote de três luas, fugiu de medo da primeira transformação e se perdeu perto de Dalborg. Ligue o Faro da Lua (F) e siga o cheiro dele antes que os lobos selvagens o achem.',
    objs: [{ kind: 'sense', what: 'cheiro', label: 'Farejar o rastro do filhote Bran', at: 'Dalborg', dx: -18, dy: -16 }, { kind: 'kill', type: 'wolf', n: 6 }],
    talk: [
      'Bran sumiu. Três luas de vida, e a primeira virada veio forte demais. Ele correu de si mesmo.',
      'Lobo de verdade não acha filhote com os olhos. Acha com o nariz. Feche os olhos, solte o Faro da Lua, e o mundo inteiro vira cheiro.',
      { r: [
        { t: 'Eu acho o Bran. Ninguém fica para trás.', a: 'Isso é o que a matilha quer ouvir. E o que a lua quer ver.', luz: 2 },
        { t: 'Um filhote que foge da lua não merece a matilha.', a: 'Você também fugiu um dia. Todos fugimos. A diferença é quem veio buscar.', sombra: 1 } ] },
      { who: 'Instinto', t: 'Aperte F para ligar o Faro da Lua. O cheiro do Bran só aparece para quem fareja.' },
    ],
    done: [
      { who: 'Bran', t: 'Eu… eu mordi a mão da minha mãe quando virei. Eu não queria.' },
      'Ninguém quer, pequeno. Ninguém quer na primeira vez. Volta para a árvore. Ninguém aqui vai morder você.',
      'Você trouxe um filhote de volta, {nome}. Na matilha isso vale mais do que dez cabeças de caçador.',
    ] },

  { id: 'la3', chain: LC, name: 'Prata na Estrada', lvl: 32, giver: UL, next: 'la4', xp: 0, gold: 260,
    text: 'O Clã Helsing espalhou armadilhas de prata nas trilhas da matilha. A Mãe-Alfa quer que alguém vá a Sudrholt falar com a Mestra Ilsa Van Rhal. Falar. Por enquanto.',
    objs: [{ kind: 'talk', npc: IL }],
    talk: [
      'Dois dos nossos perderam a pata em armadilhas de prata esta lua. O Clã Helsing está caçando na nossa mata.',
      'Os jovens querem descer a Sudrholt de noite e acabar com o Bastião. Eu quero outra coisa: quero saber por quê.',
      { r: [
        { t: 'Vou conversar com eles. Guerra é o último recurso.', a: 'Você fala como a velha que eu sou. Vá. E não morda ninguém, por favor.', luz: 1 },
        { t: 'Conversar com caçador de prata? Eles só entendem dente.', a: 'Talvez. Mas se você for de dente, vá sozinho. A matilha não vai atrás de vingança.', sombra: 1 } ] },
    ],
    meet: {
      [IL]: [
        'Um lobisomem no Bastião de Prata. De dia, desarmado, de cabeça erguida. Ou você é louco ou é corajoso. Os dois morrem cedo.',
        'As armadilhas? São para o que matou a família do moleiro de Dalborg. Pegadas de lobo grande, de pé. Era um de vocês.',
        { r: [
          { t: 'Não foi da matilha da Ulfrun. Eu juro pela lua.', a: 'Jura pela lua… Vou acreditar até a próxima lua cheia. Se eu achar o culpado, ele é meu.', luz: 2, flag: 'lob_jurou_ilsa' },
          { t: 'Tirem as armadilhas ou a matilha desce até aqui.', a: 'Então desçam. O Bastião nunca dormiu uma noite inteira, e não vai começar agora.', sombra: 2 },
          { t: 'E se o culpado for um selvagem, sem matilha? Nós podemos achar antes.', a: 'Um lobisomem caçando outro… Isso eu pagaria para ver. Tragam a cabeça e eu recolho a prata.', luz: 1, flag: 'lob_acordo_ilsa' } ] },
      ],
    },
    done: [
      'A caçadora acha que foi um de nós. Talvez tenha razão. Há selvagens na mata, gente que a lua quebrou e ninguém foi buscar.',
      'Diga, {nome}. O que você prometeu lá em cima?',
    ],
    choice: { q: 'Voltando do Bastião, um caçador de prata sozinho cruza o seu caminho na trilha. Você…', opts: [
      { label: 'Passa reto. Hoje é dia de trégua.', karma: 3, flag: 'lob_tregua', say: 'Passou reto. Os caçadores vão contar isso no Bastião. É assim que a paz começa: com alguém passando reto.', why: 'Você teve o inimigo sozinho na sua frente e manteve a palavra dada. Isso pesa a favor.' },
      { label: 'Assusta o caçador e quebra a besta dele.', karma: -2, flag: 'lob_assustou', say: 'Sem sangue, pelo menos. Mas o Bastião vai ouvir que um lobo rosnou depois de conversar.', why: 'Você não feriu ninguém, mas trocou a palavra por medo.' },
      { label: 'Ataca. Um caçador a menos.', karma: -8, flag: 'lob_matou_cacador', say: '…Você manchou a trégua no mesmo dia. A prata vai cair na nossa mata como chuva.', why: 'Você matou quem não te atacou, logo depois de conversar em paz. A traição pesa duas vezes.' } ] } },

  { id: 'la4', chain: LC, name: 'O Cheiro do Conde', lvl: 33, giver: UL, next: 'la5', xp: 0, gold: 280,
    text: 'Crias do Conde caçam na mata da matilha à noite. Ligue o Faro da Lua (F) perto do Covil dos Lobisomens e siga o cheiro de sangue velho até elas. Depois derrube os morcegos que vigiam a trilha.',
    objs: [{ kind: 'sense', what: 'cheiro', label: 'Farejar o sangue velho das crias do Conde', at: 'Covil dos Lobisomens', dx: 16, dy: -12 }, { kind: 'kill', type: 'bat', n: 10 }],
    talk: [
      'Sangue velho. Terra de cova. Perfume de sala fechada. Você sente? Eu sinto desde ontem.',
      'Crias do Conde caçando na nossa mata. O Conde e eu temos um acordo de trezentos anos: a colina é dele, a mata é nossa. Alguém está quebrando o acordo.',
      { r: [
        { t: 'Vou achar quem quebrou e trazer o nome.', a: 'O nome. Não a cabeça. Uma cabeça de cria é guerra com o Conde.', luz: 1 },
        { t: 'Sanguessuga na nossa mata morre. Simples.', a: 'Simples demais. O mundo nunca é simples quando o Conde está no meio.', sombra: 1 } ] },
    ],
    done: [
      'Os morcegos caíram e o cheiro leva até Corvoscuro. Até a Corte. Alguém lá dentro mandou as crias.',
      'Vou mandar um corvo a Lady Mirela. Ela vai fingir surpresa. Ela é boa nisso.',
    ] },

  { id: 'la5', chain: LC, name: 'A Fome', lvl: 34, giver: UL, next: 'la6', xp: 0, gold: 300, gear: 1,
    text: 'Os selvagens do Covil, lobisomens que a lua quebrou e ninguém foi buscar, mataram a família do moleiro de Dalborg. Quatro deles. Vá ao Covil e decida o que a matilha faz com os seus quebrados.',
    objs: [{ kind: 'visit', poi: 'Covil dos Lobisomens' }, { kind: 'kill', type: 'werewolf', n: 4 }],
    talk: [
      'A caçadora tinha razão. Foram selvagens. Gente que virou na primeira lua e ninguém foi buscar. Viveram anos sozinhos, só com a fome.',
      'Eles já não falam. Mas às vezes, no meio do uivo, dá para ouvir um nome. O nome que eles tinham antes.',
      { r: [
        { t: 'Se der para trazer algum de volta, eu trago.', a: 'Talvez um. Talvez nenhum. Mas tente. Foi assim que eu trouxe você.', luz: 2 },
        { t: 'Matilha que deixa selvagem solto merece a prata.', a: 'Talvez. Por isso você vai consertar.' } ] },
    ],
    done: ['O Covil está quieto. Quieto demais. Conte.'],
    choice: { q: 'O último selvagem, ferido, uiva um nome: "Hilda… Hilda…". Você…', opts: [
      { label: 'Acaba com ele, rápido, e leva a notícia à Ilsa.', karma: 2, flag: 'lob_selvagem_morto', say: 'Rápido e limpo. A caçadora vai recolher a prata. E o Hilda dele, seja quem for, vai dormir em paz.', why: 'Você parou quem matava inocentes, sem crueldade, e cumpriu o acordo com os caçadores.' },
      { label: 'Leva ele preso à Árvore-Mãe, para tentar trazê-lo de volta.', karma: 5, flag: 'lob_selvagem_salvo', say: 'Ele dorme acorrentado na raiz mais grossa. Talvez lembre de quem é Hilda. Talvez não. Você deu a chance.', why: 'Você deu ao quebrado a chance que alguém deu a você. É a misericórdia mais difícil, porque é perigosa.' },
      { label: 'Deixa ele fugir. Ele é da matilha, aconteça o que acontecer.', karma: -4, flag: 'lob_selvagem_solto', say: '…Ele vai matar de novo, {nome}. E desta vez a prata vem com razão.', why: 'Lealdade cega a quem mata inocentes é cumplicidade. A matilha não é desculpa para tudo.' } ] } },

  { id: 'la6', chain: LC, name: 'O Caçador Ferido', lvl: 35, giver: UL, next: 'la7', xp: 0, gold: 320,
    text: 'Um caçador do Clã Helsing caiu numa ravina perto da Clareira de Selvar e sangra há uma noite. A matilha sentiu o cheiro. Ligue o Faro da Lua (F), siga o sangue e decida o que fazer com ele.',
    objs: [{ kind: 'sense', what: 'sangue', label: 'Seguir o sangue do caçador ferido', at: 'Clareira de Selvar', dx: -16, dy: 14 }],
    talk: [
      'Sangue de gente na mata. E prata junto. Um caçador do Bastião caiu na ravina, perto de Selvar. Está sangrando desde ontem.',
      'Os jovens querem ir lá jantar. Eu quero que você vá primeiro.',
      { r: [
        { t: 'Vou ajudar o caçador. A trégua vale nos dois sentidos.', a: 'Vale. Mas lembre: ele vai acordar e ver um lobo. Cuidado com o que ele faz com o medo.', luz: 1 },
        { t: 'Um caçador a menos é um filhote a mais vivo.', a: 'Pode ser. Ou pode ser a guerra que eu passei a vida evitando.', sombra: 1 } ] },
      { who: 'Instinto', t: 'O Faro da Lua (F) mostra o rastro de sangue. Sem ele, a ravina é só uma ravina.' },
    ],
    done: ['Você voltou. Com cheiro de prata e de sangue. Conte o que fez.'],
    choice: { q: 'O caçador, pálido, aponta a besta para você com a mão tremendo. Ele não tem forças para atirar. Você…', opts: [
      { label: 'Carrega ele nas costas até o Bastião de Prata.', karma: 6, flag: 'lob_carregou_cacador', say: 'Um lobisomem batendo no portão do Bastião com um caçador nas costas. A Ilsa vai contar essa história até morrer.', why: 'Você salvou quem veio para te caçar. Não existe gesto que pese mais a favor.' },
      { label: 'Deixa água, a besta dele, e vai embora.', karma: 2, flag: 'lob_deixou_agua', say: 'Água e a arma. Se ele sobreviver, vai saber quem deixou. Se não, a mata decide.', why: 'Você não matou nem abandonou de todo. Uma bondade com distância ainda é bondade.' },
      { label: 'A fome fala mais alto.', karma: -10, flag: 'lob_comeu_cacador', say: '…A trégua acabou, {nome}. Acabou na sua boca.', why: 'Você matou um homem indefeso para saciar a fome. É exatamente o que os caçadores dizem que somos.' } ] } },

  { id: 'la7', chain: LC, name: 'O Alfa de Selvar', lvl: 36, giver: UL, turnin: UK, next: 'la8', xp: 0, gold: 340, gear: 1,
    text: 'Ulfrik, o alfa da Clareira de Selvar, nunca se curvou ao Uivo Antigo. A Mãe-Alfa quer as duas matilhas juntas antes da próxima lua de sangue. Prove o seu valor na neve (oito lobos gélidos) e fale com Ulfrik.',
    objs: [{ kind: 'kill', type: 'frostwolf', n: 8 }, { kind: 'talk', npc: UK }],
    talk: [
      'Ulfrik guarda Selvar há sete gerações de lobos. Ele não me odeia. Ele só não precisa de mim.',
      'A Lua de Sangue está vindo, e as patrulhas da estrada vão cair sobre qualquer lobo que encontrarem. Duas matilhas separadas são duas presas. Juntas, são uma muralha.',
      { r: [
        { t: 'Vou convencer o Ulfrik. Com respeito.', a: 'Respeito ele entende. Mas antes, mostre que caça como ele: na neve.', luz: 1 },
        { t: 'Se ele não vier por bem, vem por mal.', a: 'Ulfrik é mais velho que os seus avós. "Por mal" é como ele gosta.', sombra: 1 } ] },
    ],
    meet: {
      [UK]: [
        'O filhote da Ulfrun. Cheiro de neve nas patas e de gelo na barba. Você caçou bem.',
        'Ela quer as matilhas juntas. Sempre quis. E sempre quis que Selvar uivasse primeiro para o Uivo Antigo.',
        { r: [
          { t: 'Ninguém uiva primeiro. As duas uivam juntas.', a: '…Juntas. Faz duzentos anos que ninguém diz isso. Selvar vai pensar.', luz: 2, flag: 'lob_juntas' },
          { t: 'Desafio você. Quem vencer decide.', a: 'Hah! Assim que se fala. Mas eu não luto com filhote. Volte com a lua cheia na pele.', sombra: 1 },
          { t: 'O que Selvar quer em troca?', a: 'A Árvore-Mãe aberta para os nossos filhotes. E a cabeça de quem traiu o acordo com o Conde.', flag: 'lob_troca_ulfrik' } ] },
      ],
    },
    done: [
      'Selvar vai uivar com a gente. Não para a gente: com a gente. Você conseguiu o que eu não consegui em cem anos.',
    ] },

  { id: 'la8', chain: LC, name: 'A Noite Sem Lua', lvl: 37, giver: UL, next: 'la9', xp: 0, gold: 360, items: [['potion_g', 3]],
    text: 'Na lua nova os lobisomens ficam fracos, e os carniçais da Terra Maldita sabem disso. Eles cercam a mata da matilha toda lua nova. Desta vez, a matilha espera por eles.',
    objs: [{ kind: 'kill', type: 'ghoul', n: 10 }],
    talk: [
      'Lua nova. A noite em que somos só gente com garras curtas. Os carniçais sabem disso e vêm.',
      'Hoje não precisamos de lobo. Precisamos de gente que luta como lobo, mesmo sem a lua.',
      { r: [
        { t: 'Lua cheia ou nova, eu protejo os filhotes.', a: 'Então fique na raiz grande. É por lá que eles entram.', luz: 1 },
        { t: 'Sem a lua eu não sou nada.', a: 'Mentira. Sem a lua você é você. Era isso que a gente precisava hoje.' } ] },
    ],
    done: ['Dez carniçais a menos e nenhum filhote ferido. Na lua nova. Isso vai para as canções da Árvore-Mãe.'] },

  { id: 'la9', chain: LC, name: 'Sangue Velho', lvl: 38, giver: UL, next: 'la10', xp: 0, gold: 380,
    text: 'Lady Mirela, a emissária da Corte, mandou chamar um lobo da Ulfrun em Corvoscuro, à noite. Os vampiros querem algo da matilha. Vá ouvir. E não morda.',
    objs: [{ kind: 'talk', npc: MI }],
    talk: [
      'A Corte quer conversar com a matilha. É a segunda vez em trezentos anos. A primeira acabou em guerra.',
      'Lady Mirela recebe à noite, em Corvoscuro. Vá. Ouça. Não prometa nada que a lua não possa cumprir.',
      { r: [
        { t: 'Vou ouvir e trazer tudo à matilha.', a: 'É tudo o que eu peço.', luz: 1 },
        { t: 'Vampiro não merece conversa.', a: 'Nem lobo, segundo eles. E aqui estamos.' } ] },
    ],
    meet: {
      [MI]: [
        'Um lobo na minha praça. Fique à vontade, querido. Mas não sacuda o pelo perto das cortinas.',
        'Sejamos breves. A Ordem de Auréon está velha e cansada. Se a matilha caçar os paladinos que andam na sua mata, a Corte dá à Ulfrun o que ela quiser: a colina leste, prata de volta, o nome de quem mandou as crias.',
        { r: [
          { t: 'A matilha não é cachorro de ninguém.', a: 'Ah. Orgulho de lobo. Esperava por isso. Anote: a proposta fica de pé até a lua de sangue.', luz: 2, flag: 'lob_recusou_corte' },
          { t: 'Qual paladino? Diga o nome e eu caço.', a: 'O jovem. Aldric. Sincero demais, perigoso demais. Traga o escudo dele e conversamos sobre a colina.', sombra: 3, flag: 'lob_aceitou_corte' },
          { t: 'E quem mandou as crias caçar na nossa mata?', a: 'Um primo do Conde que achava que trezentos anos de acordo eram tempo demais. Já não acha nada. A Corte limpa a própria casa.', flag: 'lob_soube_crias' } ] },
      ],
    },
    done: ['O que a sanguessuga queria, {nome}? Diga tudo, mesmo o que você não gostou de ouvir.'],
    choice: { q: 'Diante da Mãe-Alfa, sobre a proposta da Corte, você…', opts: [
      { label: 'Conta tudo e aconselha recusar.', karma: 3, flag: 'lob_conselho_recusa', say: 'Recusar. Sim. A matilha não morde a mando de ninguém. Obrigada pela verdade inteira.', why: 'Você foi leal e honesto com quem te criou, e não aceitou caçar inocentes por terra.' },
      { label: 'Conta tudo e aconselha aceitar: a colina vale o risco.', karma: -3, flag: 'lob_conselho_aceita', say: '…A colina. Por um paladino. Eu vou pensar, {nome}. Mas não gostei de ouvir isso da sua boca.', why: 'Você foi honesto, e isso conta. Mas aconselhou trocar uma vida por terra.' },
      { label: 'Esconde a proposta e diz que a Corte só queria ameaçar.', karma: -5, flag: 'mentiu_ulfrun', say: 'Só ameaça? Hm. A sua voz tremeu na palavra "só". Eu vou descobrir, filhote. Sempre descubro.', why: 'Você mentiu para a sua alfa sobre algo que mexe com a vida da matilha inteira.' } ] } },

  { id: 'la10', chain: LC, name: 'O Uivo Antigo', lvl: 40, giver: UL, xp: 0, gold: 500, gear: 2, title: 'Filho da Lua',
    text: 'A Lua de Sangue chega e todas as patrulhas descem para a mata. Corra com as duas matilhas juntas. Seis lobisomens selvagens, enlouquecidos pela lua, avançam sobre a Árvore-Mãe: pare-os, e volte para o uivo que dá o nome.',
    objs: [{ kind: 'level', n: 40 }, { kind: 'kill', type: 'werewolf', n: 6 }, { kind: 'talk', npc: UL }],
    talk: [
      'Hoje a lua sangra. Hoje Selvar e o Uivo Antigo correm juntos pela primeira vez em duzentos anos. E você corre na frente.',
      'Os selvagens enlouquecem na lua de sangue. Eles vêm para a Árvore-Mãe, onde os filhotes dormem.',
      { r: [
        { t: 'Ninguém chega na árvore. Ninguém.', a: 'Então corra. E uive quando acabar. A lua vai ouvir.', luz: 2 },
        { t: 'Depois desta noite, quero o lugar de alfa.', a: 'Depois desta noite, se você ainda quiser mandar em vez de proteger, conversamos. Eu duvido que queira.', sombra: 1 } ] },
    ],
    done: [
      'A árvore está de pé. Os filhotes dormem. E as duas matilhas uivam juntas, olhe… olhe o céu.',
      'Um lobo ganha um nome quando a matilha inteira uiva para ele. Hoje uivaram para você.',
      { me: '(Você uiva. E a mata inteira responde.)' },
      'Bem-vindo, Filho da Lua.',
    ] },
];
Object.assign(ECOS, {
  lob_filhotes: { [UL]: 'Os filhotes brigam para caçar ao seu lado. Você comeu por último e eles viram.' },
  lob_jurou_ilsa: { [IL]: 'Um lobo jurou pela lua aqui no Bastião. Até agora, a lua está cumprindo.' },
  lob_matou_cacador: { [IL]: 'Você conversou comigo de dia e matou um dos meus na mesma tarde. Nunca mais pise no Bastião.', [UL]: 'A prata voltou para a mata. Por sua causa.' },
  lob_carregou_cacador: { [IL]: 'O Gerold ainda conta como um lobisomem o trouxe nas costas. Ninguém acreditava. Agora eu acredito.' },
  lob_comeu_cacador: { [IL]: 'Achamos a besta do Gerold na ravina. E as marcas. Vamos nos ver de novo, lobo.' },
  lob_selvagem_salvo: { [UL]: 'O selvagem que você trouxe disse uma palavra hoje. "Hilda". Era a filha dele.' },
  lob_juntas: { [UK]: 'Juntas. Ainda acho estranho dizer isso. Mas soa certo.' },
  lob_aceitou_corte: { [AL]: 'Disseram que um lobo anda perguntando pelo meu escudo. Se for você, venha conversar antes de morder.' },
  mentiu_ulfrun: { [UL]: 'Eu descobri, {nome}. A Corte queria a cabeça do jovem paladino. Por que você escondeu isso de mim?' },
});
