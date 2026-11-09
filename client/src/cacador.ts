/* ---------- O SINO NO PULSO — Capítulo I do Caçador de Demônios (níveis 20–31), 09/11. "As Crianças Perdidas".
   Depois da Vidente (v_cac). A Mestra Ilsa Van Rhal manda; a Caçadora Vesna Helsing, a Portadora, anda junto e reclama.
   Honra familiar do Clã Helsing, devoção às crianças perdidas na noite, ninguém dorme. Tom (regra de ouro 5): o solene tem
   sempre alguém pequeno ao lado — aqui é a própria Vesna, ácida e engraçada de cansaço, e o pequeno Pip, o órfão de Sudrholt.
   Pista do capítulo (sem resposta, regra do Episódio II): a sexta runa gravada por dentro de toda besta que o caçador abre.
   Toda podridão que aparecer é culpa de Zerath. Ninguém reconcilia ninguém. ---------- */
import type { QuestDef } from './quests';

export const IL = 'Mestra Ilsa Van Rhal', VH = 'Caçadora Vesna Helsing', PIP = 'Pip', TB = 'Irmão Tobias';
const SP = 'O Sino no Pulso';

export const HUNTER_I: QuestDef[] = [
  { id: 'hc1', chain: SP, name: 'A Prova da Prata', lvl: 20, giver: IL, turnin: IL, req: 'v_cac', next: 'hc2', xp: 0, gold: 200, items: [['potion_g', 3]],
    text: 'A Mestra Ilsa não entrega prata a quem só passou na prova da Vidente. Volte às trilhas em volta de Sudrholt e derrube oito carniçais com a arma que o Clã lhe deu. A Caçadora Vesna Helsing vai olhar. Ela diz que não vai, mas vai.',
    objs: [{ kind: 'kill', type: 'ghoul', n: 8 }],
    talk: [
      'A Vidente mandou você. A Vidente manda muita gente. Metade volta. A outra metade a gente enterra com o sino no pulso, para tocar se acordar no caixão.',
      'Isto é o Bastião de Prata. Ninguém aqui dormiu uma noite inteira em vinte anos. Não é promessa: é escala de guarda.',
      { who: VH, t: 'Mestra, ele ainda está de pé. Já é melhor que o último. O último desmaiou quando viu o fosso.' },
      { r: [
        { t: 'O que eu preciso provar?', a: 'Que a prata não treme na sua mão. Oito carniçais, nas trilhas. A prata não se importa com o que você sente. Eu também não, por enquanto.' },
        { t: 'Quem é ela?', a: 'Vesna Helsing. Minha melhor caçadora e a pior companhia do Bastião. As duas coisas são verdade ao mesmo tempo, e você vai se acostumar com as duas.' },
        { t: 'Por que o sino no pulso?', a: 'Porque o que a gente caça às vezes volta. E às vezes quem volta é um de nós. O sino avisa os dois casos.' } ] },
      { who: VH, t: 'Oito. Conte em voz alta, se ajudar. Eu conto junto. Eu conto tudo. É o que sobra quando não se dorme.' },
    ],
    done: [
      { who: VH, t: 'Oito, sem tremer. Tremeu no sétimo, mas o sétimo era feio. Eu deixo passar.' },
      'A prata é sua. Não é presente: é dívida. Toda criança que a noite levar daqui em diante, você deve um pedaço.',
      { r: [
        { t: 'Aceito a dívida.', a: 'Todo mundo aceita no primeiro dia. A gente conversa de novo no centésimo.' },
        { t: 'E se eu não conseguir pagar?', a: 'Então você está no lugar certo. Ninguém aqui consegue. A gente paga mesmo assim.' } ] },
    ] },

  { id: 'hc2', chain: SP, name: 'A Primeira Vigília', lvl: 21, giver: VH, turnin: VH, next: 'hc3', xp: 0, gold: 220,
    text: 'A Vesna leva você para a primeira vigília no muro do Bastião. As três horas da noite têm três inimigos diferentes. Fique de pé até o fim: os morcegos descem primeiro, depois o que vem atrás deles. Dez morcegos e você terá visto a primeira hora.',
    objs: [{ kind: 'visit', poi: 'Bastião de Prata' }, { kind: 'kill', type: 'bat', n: 10 }],
    talk: [
      'Primeira vigília. Regra um: não sente. Regra dois: não sente. Regra três: se sentar, não durma. Se dormir, pelo menos ronque, para eu saber onde você está.',
      'A noite tem três horas. A primeira é dos morcegos: barulho, dente pequeno, muita asa. A segunda é de quem manda os morcegos. A terceira é a do sono, e essa é a que mata caçador.',
      { r: [
        { t: 'E a terceira hora, como se vence?', a: 'Não se vence. Se atravessa. Eu conto pedras do muro. Já contei esse muro inteiro quatrocentas vezes. Tem mil e doze. Ilsa diz que tem mil e onze. Uma de nós está mentindo.' },
        { t: 'Você nunca dorme?', a: 'Durmo de olho aberto, como os peixes. É mentira. Mas fica bonito no relatório.' },
        { t: 'Por que você virou caçadora?', a: 'Pergunta de primeira vigília. Responde na décima. Se você chegar na décima.' } ] },
    ],
    done: [
      'Primeira hora atravessada. Você não viu a segunda porque eu mandei você descer antes. A segunda hora não é para quem chegou ontem.',
      { r: [
        { t: 'O que veio na segunda hora?', a: 'Um vulto na borda da mata, olhando o muro. Ficou até amanhecer. Não atacou. Os que não atacam são os piores: estão aprendendo.' },
        { t: 'Mil e doze pedras.', a: 'Contou? Ótimo. Agora somos duas contra a Ilsa. Isso é o mais perto de uma família que você vai ter aqui.' } ] },
    ] },

  { id: 'hc3', chain: SP, name: 'O Órfão de Sudrholt', lvl: 22, giver: IL, turnin: IL, next: 'hc4', xp: 0, gold: 240,
    text: 'Uma carroça chegou ao Bastião ao amanhecer com uma criança dentro e ninguém na boleia. O menino se chama Pip e não fala do que viu. A Mestra quer que você fale com ele: o que contar a uma criança é a primeira escolha que o Clã guarda de você.',
    objs: [{ kind: 'talk', npc: PIP }],
    talk: [
      'Uma carroça. Os cavalos sabiam o caminho; o cocheiro, não. Restou o menino, debaixo da lona, segurando uma vela apagada.',
      'O nome dele é Pip. Ele não chora e não fala. Os dois são ruins. Vá até ele. Você é o mais novo aqui: ele ainda não aprendeu a ter medo de você.',
      { r: [
        { t: 'O que eu digo a ele?', a: 'É isso que eu quero ver. A Ordem da Aurora diria que os pais estão com Auréon. Os bruxos diriam o preço. Nós dizemos… depende de quem diz. Diga você.' },
        { t: 'Os pais dele?', a: 'A carroça veio da estrada do sul. Na estrada do sul tem um ninho. Você vai até lá em breve. Primeiro, o menino.' } ] },
    ],
    meet: { [PIP]: [
      { who: PIP, t: '…' },
      { who: PIP, t: 'A vela apagou sozinha. Mamãe disse que, se a vela apagar, é para ficar quieto. Eu fiquei quieto.' },
      { who: PIP, t: 'Você é caçador? Vocês acham gente? A mamãe e o papai estão na estrada. Você acha eles?' },
    ] },
    choice: { q: 'O Pip espera uma resposta. Você…', opts: [
      { label: 'Conta a verdade: a estrada do sul não devolve ninguém, e você vai fazer ela pagar.', karma: 3, flag: 'cac_pip_verdade', say: 'O Pip chorou pela primeira vez. A Ilsa diz que é o melhor sinal que ela viu em um mês. Criança que chora vive.', why: 'Você não mentiu para uma criança. Doeu nela e em você, e foi limpo.' },
      { label: 'Diz que vai procurar, e que ele pode esperar acordado com o sino.', karma: 1, flag: 'cac_pip_espera', say: 'O Pip amarrou um sino no pulso e não dorme mais. A Vesna olhou e não disse nada. Depois disse: “Então são três.”', why: 'Uma esperança que não é mentira nem verdade. O Bastião é feito disso.' },
      { label: 'Diz que os pais fugiram e o deixaram.', karma: -4, flag: 'cac_pip_mentira', say: 'O Pip parou de perguntar. A Ilsa também parou de falar com você por uns dias.', why: 'Você escolheu a mentira que machuca mais para não ter que carregar a que machuca menos.' } ] },
    done: [
      'Ele ainda segura a vela. Não tirei dele. Tem gente que precisa segurar alguma coisa apagada até poder acender outra.',
      { who: VH, t: 'Eu tinha a idade dele. Também segurava uma vela. A minha era mais feia.' },
    ] },

  { id: 'hc4', chain: SP, name: 'O Ninho da Estrada', lvl: 23, giver: VH, turnin: VH, next: 'hc5', xp: 0, gold: 260, gear: 1,
    text: 'A estrada entre Karmika e Sudrholt engole carroças. A Vesna achou o ninho: carniçais e o que os alimenta. Ligue o Instinto (F) e siga o rastro de sangue até a toca, depois limpe o que estiver lá dentro.',
    objs: [{ kind: 'sense', what: 'ninho', label: 'O ninho da estrada do sul', at: 'Sudrholt', dx: -16, dy: 12 }, { kind: 'kill', type: 'ghoul', n: 10 }],
    talk: [
      'A carroça do Pip saiu da estrada do sul. Eu andei pela estrada do sul a noite inteira. Achei três coisas: uma roda, um sapato de criança e um cheiro.',
      'O cheiro é de ninho. Ninho de carniçal fede a porão de taverna. Você vai reconhecer: é o mesmo cheiro de quando a gente abre um baú esquecido, só que o baú abre de volta.',
      { r: [
        { t: 'Os pais do Pip podem estar lá?', a: 'Podem. Se estiverem, não são mais os pais do Pip. Prepare a cabeça para isso antes da prata.' },
        { t: 'Vamos juntas?', a: 'Eu vou na frente, você vai atrás, e o Instinto vai na sua cabeça. Se eu gritar, não venha. Se eu não gritar, venha mais rápido.' } ] },
    ],
    done: [
      'Limpo. O ninho tinha uma coisa que não devia ter: um cercado. Alguém trancava os carniçais ali dentro e soltava quando passava carroça. Carniçal não faz cerca.',
      { r: [
        { t: 'Quem faz?', a: 'Gente. Com a podridão por dentro. Os velhos do Clã culpam Zerath, o Senhor do Pântano: ele apodrece até quem só passou perto. Eu culpo quem segurou o martelo.' },
        { t: 'E os pais do Pip?', a: 'Não estavam. Isso não quer dizer nada de bom. Também não quer dizer nada de ruim. Só quer dizer que a estrada ainda deve.' } ] },
    ] },

  { id: 'hc5', chain: SP, name: 'A Besta de Van Rhal', lvl: 24, giver: IL, turnin: IL, next: 'hc6', xp: 0, gold: 280,
    text: 'No salão do Bastião há uma caveira de besta pregada na parede, mais velha que o Clã. A Mestra Ilsa vai contar de onde ela veio. Antes, ela quer que você olhe a caveira com o Instinto ligado (F) e diga o que viu.',
    objs: [{ kind: 'sense', what: 'sangue', label: 'A caveira da Besta de Van Rhal, no salão', at: 'Bastião de Prata', dx: 1, dy: -2 }],
    talk: [
      'Meu avô matou essa besta com uma faca de pão. A família conta com uma espada de prata, porque espada de prata fica melhor nas canções. Era faca de pão.',
      'Ela comeu uma aldeia inteira em três noites. Na quarta, ele entrou na boca dela com a faca e saiu pelo outro lado. Os Van Rhal têm esse jeito de resolver as coisas.',
      { r: [
        { t: 'Por que ela está na parede?', a: 'Para ninguém esquecer que a noite tem tamanho. Os novatos acham que o pior é o carniçal. Aí olham para cima.' },
        { t: 'O que eu devo procurar nela?', a: 'O que todo caçador do Clã já viu e ninguém sabe explicar. Olhe com o Instinto. Por dentro do osso.' } ] },
    ],
    done: [
      'Viu. Todo mundo vê. Uma runa riscada por dentro do osso, onde nenhuma faca alcança. A sexta, a que não tem nome nos livros.',
      'Está em toda besta que a gente abre. No lobo da estrada, no carniçal do ninho, na besta do meu avô. Por dentro. Como se tivesse nascido com ela.',
      { r: [
        { t: 'Quem grava isso?', a: 'Não sei. Os velhos dizem que é a marca de Zerath. A Vesna diz que é assinatura. Eu digo que é uma runa e não quero saber mais do que isso antes de dormir. Que eu não durmo.' },
        { t: 'Alguém já perguntou à Biblioteca?', a: 'O Cronista de Askavik veio aqui uma vez, olhou a caveira, anotou num caderno e foi embora sem dizer nada. Foi a coisa mais assustadora que eu já vi um homem de caderno fazer.' },
        { t: 'Isso devia preocupar o Clã.', a: 'Preocupa. A gente pregou na parede. É o que o Clã faz com o que preocupa.' } ] },
    ] },

  { id: 'hc6', chain: SP, name: 'Pó do Sono', lvl: 26, giver: VH, turnin: VH, next: 'hc7', xp: 0, gold: 300,
    text: 'Caçador não dorme, mas às vezes precisa fazer alguém dormir: um ferido, uma criança, um caçador que viu demais. Só os bruxos fazem o Pó do Sono Sem Sonhos. Vá até a Tenda da Bruxa Grisolda, em Gorvath, e compre um. Pague. Agradeça. Não morda a língua até sangrar.',
    objs: [{ kind: 'collect', item: 'po_sono', n: 1 }],
    talk: [
      'Missão de hoje: humilhação. Você vai ao Vale da Desgraça, entra na tenda de uma bruxa e compra uma coisa dela. Com dinheiro. Educadamente.',
      'O Pip não dorme desde a carroça. Os médicos da Ordem querem rezar. Eu quero que ele durma. O Pó do Sono fecha o olho sem abrir pesadelo. Só a bruxa faz.',
      { r: [
        { t: 'Comprar de uma bruxa? Nós caçamos o que elas chamam.', a: 'Caçamos. E compramos o pó delas. As duas coisas. Isso se chama adulto.' },
        { t: 'E se ela me reconhecer?', a: 'Ela vai reconhecer. Você cheira a prata e a cansaço. Ela vai cobrar mais caro. Pague. É a parte da missão que dói.' },
        { t: 'Por que não vai você?', a: 'Porque da última vez eu fui e ela me chamou de “menina”. Eu tenho vinte e oito anos e uma besta de prata. Fui embora sem o pó. Hoje vai você.' } ] },
    ],
    done: [
      'Você voltou com o pó e com a cara de quem engoliu um limão inteiro. Ela disse alguma coisa?',
      { r: [
        { t: 'Ela me chamou de “menino”.', a: 'Somos dois. Isso fica entre nós. A Ilsa não precisa saber que a bruxa ganhou de novo.' },
        { t: 'Ela foi educada. Isso foi pior.', a: 'É sempre pior. Bruxa grosseira a gente aguenta. Bruxa educada a gente fica pensando nela de noite. Que a gente não dorme.' } ] },
      'O Pip dormiu. Oito horas. A primeira vez desde a estrada. Eu fiquei olhando ele dormir. Não conte para ninguém.',
    ] },

  { id: 'hc7', chain: SP, name: 'A Vila Que Não Existe Mais', lvl: 27, giver: VH, turnin: VH, next: 'hc8', xp: 0, gold: 320,
    text: 'Na décima vigília (ela contou), a Vesna responde à pergunta da primeira: por que virou caçadora. A vila dela ficava a sudoeste de Sudrholt e não está em mapa nenhum. Vá até onde ela ficava, ligue o Instinto (F) e procure quem ainda está lá.',
    objs: [{ kind: 'sense', what: 'espirito', label: 'Onde ficava Lysmark', at: 'Sudrholt', dx: -22, dy: 18,
      spirit: { name: 'A menina da vela', lines: ['Você é da Vesna? Ela cresceu. Ela ficou brava? Ela sempre fica brava quando está com medo.', 'A gente acendeu as velas como mandaram. Elas apagaram todas juntas. Depois o escuro entrou.', 'Diz para ela que não foi culpa dela ter se escondido. Ela era pequena. Diz que a vela dela foi a última a apagar.'] } }],
    talk: [
      'Décima vigília. Você perguntou na primeira. Eu disse que respondia na décima. Eu cumpro o que digo; é o único luxo que o Bastião deixa.',
      'Eu nasci em Lysmark. Quarenta casas. Uma noite as velas apagaram todas juntas, e o que entrou levou todo mundo menos eu. Eu estava num barril de arenque. Fedi a peixe durante um ano.',
      { r: [
        { t: 'Por que ninguém conhece Lysmark?', a: 'Porque o Conselho de Askavik tirou do mapa. Vila que some dá medo nos impostos. Melhor não ter existido.' },
        { t: 'Você quer que eu vá até lá?', a: 'Eu não volto lá desde os oito anos. Eu caço tudo que anda à noite. Não consigo andar até um campo vazio. Engraçado, não é? Ri. Eu deixo.' } ] },
    ],
    done: [
      'Tinha alguém lá. Eu sabia. Eu sempre soube. Por isso não ia.',
      { r: [
        { t: 'Ela disse que não foi culpa sua.', a: '…' },
        { t: 'Ela disse que a sua vela foi a última a apagar.', a: 'Era a mais feia. Torta, de sebo, meu pai fez. A mais feia foi a última. Faz sentido. As feias aguentam.' } ] },
      'Obrigada. Não vou dizer de novo, então guarde essa. Agora vá dormir. É mentira. Ninguém dorme. Mas vá deitar.',
    ] },

  { id: 'hc8', chain: SP, name: 'O Carniçal Batizado', lvl: 28, giver: IL, turnin: IL, next: 'hc9', xp: 0, gold: 340, gear: 1,
    text: 'Um caçador do Clã jura que viu um carniçal vivo no porão da Abadia da Aurora, em Austrvik. Vivo e rezando. Vá à Abadia, fale com o Irmão Tobias, o sineiro, e veja com os próprios olhos. Só veja. A Mestra não mandou matar.',
    objs: [{ kind: 'visit', poi: 'Abadia da Aurora' }, { kind: 'talk', npc: TB }, { kind: 'sense', what: 'espirito', label: 'O porão da Abadia', at: 'Abadia da Aurora', dx: 2, dy: 3 }],
    talk: [
      'Um dos meus voltou da Abadia branco como prata. Diz que viu um carniçal no porão, de joelhos, de túnica, rezando. E os monges servindo sopa para ele.',
      'A Ordem de Auréon acredita que todo demônio pode ser convertido. O Clã acredita que todo demônio pode ser enterrado. Essa é a nossa diferença em uma frase.',
      { r: [
        { t: 'E se for verdade?', a: 'Então é verdade. Você volta e me conta. Você não puxa a prata. Ouviu bem? Não puxa. Eu decido o que fazer com a Ordem. Você decide nada.' },
        { t: 'A Ordem e o Clã caçam juntos agora.', a: 'Caçam lobos juntos. Isso não é amizade; é horário. A Ordem acha a gente brutos. A gente acha a Ordem escoteiros. Ambos estão certos.' } ] },
    ],
    meet: { [TB]: [
      { who: TB, t: 'Um caçador. Eu sabia que vinha um. Toco o sino há trinta anos: reconheço o passo de quem vem com prata.' },
      { who: TB, t: 'Sim, ele está lá embaixo. Chamamos de Penitente. Faz dois anos que ele não morde ninguém. Reza mais do que eu. Isso me envergonha um pouco.' },
      { who: TB, t: 'A Bispa Solveig diz que é a prova de que a luz alcança tudo. O Grão-Mestre não diz nada. Quando o Grão-Mestre não diz nada, eu toco o sino mais alto.' },
    ] },
    done: [
      'Um carniçal rezando. Vivo. Num porão de monges, comendo sopa. E você não puxou a prata. Bom. Muito bom. Eu queria que você tivesse vontade de puxar.',
      { r: [
        { t: 'Eu tive.', a: 'Então você é do Clã. A vontade é da casa. A mão parada é da Mestra. Por enquanto as duas ficam assim.' },
        { t: 'Talvez a Ordem esteja certa.', a: 'Talvez. A Ordem também achava que a vila do meu avô era segura. Dois anos sem morder é bastante. Para um carniçal, é o tempo de aprender a esperar.' },
        { t: 'O que o Clã vai fazer?', a: 'Hoje, nada. O que vem depois não é conversa para quem ainda está no primeiro sino.' } ] },
      { who: VH, t: 'Escoteiros. Servem sopa para o demônio e chamam isso de vitória. Um dia eu vou lá. E não vou levar sopa.' },
    ] },

  { id: 'hc9', chain: SP, name: 'O Sino de Guarda', lvl: 30, giver: VH, turnin: VH, next: 'hc10', xp: 0, gold: 360,
    text: 'O Bastião não dorme porque não tem quem vigie por ele. A Companhia de Latão vende um Sino de Guarda que toca sozinho quando algo se aproxima. A Vesna quer um para o quarto do Pip. Compre o sino com os tecnocratas e traga, junto com outro Pó do Sono.',
    objs: [{ kind: 'collect', item: 'sino_guarda', n: 1 }, { kind: 'collect', item: 'po_sono', n: 1 }],
    talk: [
      'O Pip dorme com o pó. Mas o pó acaba, e quando ele acorda no escuro, grita. Eu fico na porta. Eu sempre fico na porta. Eu queria uma noite em que outra coisa ficasse na porta.',
      'Os tecnocratas vendem um sino de latão que toca sozinho quando alguém se aproxima. Sem reza, sem prata, sem caçador. Só latão e uma mola. É a coisa mais ofensiva que eu já vi. Compre um.',
      { r: [
        { t: 'Você vai deixar uma máquina vigiar?', a: 'Vou deixar uma máquina vigiar a porta e eu vigiar a máquina. Progresso.' },
        { t: 'E o pó, de novo?', a: 'O pó faz dormir, o sino faz acordar se precisar. Juntos, é o Sono Guardado. Os bruxos e os tecnocratas fizeram uma coisa boa juntos e nem sabem. Não conte a eles.' } ] },
    ],
    done: [
      'Pendurado. Testei três vezes. Ele tocou nas três. Na terceira era eu. Ele tocou para mim. Me senti vigiada pela primeira vez na vida. Foi horrível. Foi ótimo.',
      { who: PIP, t: 'Ele toca se o escuro entrar? Então eu posso apagar a vela?' },
      { r: [
        { t: 'Pode, Pip.', a: 'Ele apagou. Pela primeira vez desde a carroça. A Vesna saiu do quarto rápido demais. Você fingiu que não viu.' },
        { t: 'Deixe acesa. A gente apaga junto, outro dia.', a: 'Ele sorriu e deixou acesa. A Vesna diz que você é mole. Disse sorrindo.' } ] },
    ] },

  { id: 'hc10', chain: SP, name: 'O Juramento de Aravel', lvl: 31, giver: IL, turnin: IL, title: 'Sino no Pulso', xp: 0, gold: 420, gear: 1, items: [['potion_g', 4]],
    text: 'Aravel, a Vigília Verde, nunca teve templo: teve torres de vigia. Nas Ruínas de Aravel o caçador jura diante da primeira torre. Vá até lá, sobreviva à noite que o lugar ainda guarda e volte ao Bastião para receber o sino de prata no pulso.',
    objs: [{ kind: 'visit', poi: 'Ruínas de Aravel' }, { kind: 'kill', type: 'headless', n: 6 }, { kind: 'talk', npc: VH }],
    talk: [
      'Você contou as pedras, cuidou do menino, comprou da bruxa sem morder, olhou um demônio rezando e não puxou a prata. É o suficiente para jurar. Não é o suficiente para nada mais.',
      'Nas Ruínas de Aravel fica a primeira torre de vigia, de quando os demônios andavam de dia. Ali o caçador diz uma frase só. Você vai dizer sozinho. A Vesna vai estar lá para garantir que você não diga errado.',
      { r: [
        { t: 'Que frase?', a: '“Eu não durmo enquanto alguém pequeno estiver acordado no escuro.” Pronto. Agora você sabe. Saber não é jurar.' },
        { t: 'O que a torre guarda?', a: 'Os que não tiveram cabeça para jurar. Literalmente. Seis ou sete. Corte o que sobrou deles e vá até a pedra.' } ] },
    ],
    meet: { [VH]: [
      { who: VH, t: 'Você veio. Eu apostei com a Ilsa que vinha. Ela apostou que vinha também. Ninguém ganhou nada. É a aposta mais triste do Bastião.' },
      { who: VH, t: 'Diga a frase. Em voz alta. A torre não ouve, mas eu ouço, e eu sou pior.' },
      { me: 'Eu não durmo enquanto alguém pequeno estiver acordado no escuro.' },
      { who: VH, t: 'Pronto. Agora você é um problema meu para sempre. Bem-vindo à família. Ela é pequena e não dorme.' },
    ] },
    done: [
      'A Vesna disse que você não errou nenhuma palavra. A Vesna nunca diz isso. Ela deve estar doente.',
      'Estenda o pulso. O sino de prata é do Clã Helsing; se você morrer, ele volta para cá. Se você acordar no caixão, toque.',
      { r: [
        { t: 'E agora?', a: 'Agora o Clã escolhe um lado. Fala-se em bandeiras em Askavik: o Fio e os Desfiados. Os dois querem salvar Karmika. Os dois querem a nossa prata. A primeira coisa que o Fio vai pedir, você não vai gostar.' },
        { t: 'E o Penitente, na Abadia?', a: 'Ele ainda está lá. Eu ainda estou aqui. Um dia uma dessas frases vai mudar.' },
        { t: 'A runa nas bestas.', a: 'Continua lá. Em todas. Anote, como o Cronista. Ninguém sabe o que fazer com ela. Nós somos caçadores: a gente sabe esperar o que não entende.' } ] },
    ] },
];

/** as pessoas novas do capítulo: a Vesna no Bastião e o Pip (só a partir do órfão) */
export const HUNTER_I_NPCS = [
  { vila: 'Sudrholt', name: VH, role: 'Portadora do Clã Helsing', dx: 1.5, dy: -21.5, tint: 0x3a3a46, lines: ['Mil e doze pedras. A Ilsa diz mil e onze. Uma de nós mente.', 'Eu durmo de olho aberto. É mentira. Fica bonito no relatório.', 'Escoteiros. Servem sopa para o demônio.'] },
  { vila: 'Sudrholt', name: PIP, role: 'Órfão do Bastião', dx: -2.5, dy: -20.5, tint: 0x6a5a4a, onlyQ: 'hc3', lines: ['A vela apagou sozinha.', 'Você é caçador? Vocês acham gente?'] },
];
