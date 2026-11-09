/* ---------- O Prólogo das Bandeiras (09/11): entre a Chamada de Askavik (a04) e Os Caminhos (p01), níveis 28–30, para todos os povos.
   Antes de a Vidente ler a alma, o caminhante ouve as duas bandeiras. Livro XV: as duas querem salvar Karmika, e cada uma acha que a outra é o que vai acabar com ela.
   Ninguém é vilão. O Fio fala pelo Paladino Aldric (lê os nomes por dentro do escudo) e pela Mestra Ingeborg; os Desfiados, por Corvina e Lady Mirela (nunca quebrou uma lei da Casa).
   A Velha Gunnhild mostra a porta de pedra preta do Cemitério Esquecido e manda não bater (pista do Episódio II; ninguém explica).
   No fim, Halvard pergunta para onde a alma pende: a marca (lean_fio / lean_desf / lean_livre) não vale karma e não é juramento. Jurar é no 30, com a classe.
   Regra de lançamento (Notas do editor): nada aqui sugere reconciliação; a rixa é forte e os dois lados têm razão em alguma coisa. ---------- */
import type { QuestDef } from './quests';

export const HV = 'Mestre Halvard', AL = 'Paladino Aldric', IG = 'Mestra Ingeborg', CV = 'Corvina, a Desfiadora', MI = 'Lady Mirela', GU = 'Velha Gunnhild', OS = 'Cronista Ormund Salveth';
const BC = 'As Duas Bandeiras';

export const BANNERS: QuestDef[] = [
  { id: 'b01', chain: BC, name: 'O Fio de Ouro', lvl: 19, giver: HV, turnin: AL, req: 'a04', next: 'b02', xp: 1, gold: 160,
    text: 'Antes de saber o que você vai ser, saiba por quem se luta nesta cidade. A Mestra Ingeborg, da Tecelagem Real do Fio, e o Paladino Aldric, emissário da Ordem, vão lhe mostrar o lado deles. Depois, prove que entendeu: os carniçais voltaram à estrada de Selvar. Oito a menos, e ninguém atravessa sozinho hoje.',
    objs: [{ kind: 'talk', npc: IG }, { kind: 'kill', type: 'ghoul', n: 8 }],
    talk: [
      'Senta. Você limpou Selvar, salvou Grenivik, o Jarl gosta de você. Ótimo. Agora a parte que ninguém ensina na Escola de Guerra.',
      'Nesta cidade tem duas tecelagens, uma de cada lado da mesma rua, e as duas donas não se cumprimentam há vinte anos. Não é briga de vizinha. É a briga mais velha de Karmika.',
      'Vá primeiro à Tecelagem Real do Fio, a oeste da praça. A Mestra Ingeborg vai lhe contar o que a Ordem do Fio guarda. Depois procure o Paladino Aldric: ele fala pela Ordem aqui, e fala demais, mas nunca mentiu para mim.',
      { r: [
        { t: 'Por que eu preciso ouvir isso antes da Vidente?', a: 'Porque a Vidente lê o que a sua alma inclina. E a sua alma vai inclinar melhor sabendo pelo que as pessoas morrem por aqui.' },
        { t: 'E o outro lado da rua?', a: 'Vai ouvir também. Eu não crio soldados cegos. Primeiro o Fio, porque o Aldric já está esperando e paladino esperando é paladino rezando alto.' },
        { t: 'Eu só quero saber lutar.', a: 'Lutar você já sabe. Agora precisa saber contra o quê. É a diferença entre um guerreiro e um cachorro grande.' } ] },
      'E leve a espada. A Ordem vai pedir que você guarde a estrada de Selvar enquanto conversa. Eles são assim: não explicam nada sem pôr você para trabalhar.',
    ],
    meet: {
      [IG]: [
        'Não encosta nos teares. Cada fio daqui foi puxado por uma mão que jurou em voz alta, e eu não aceito juramento de quem ainda não sabe o que vai jurar.',
        'Você quer saber o que a Ordem do Fio guarda. Eu mostro: olhe o brasão. Um labirinto, e um fio de ouro que vai da porta até o Olho no centro. O labirinto é o de Marghar. O fio é o nosso.',
        'O Sem-Passo tem fome, criança. Ele quer todas as almas e as quer agora. Marghar fez corredores, bifurcações, mil portas, para que a Fome demore a nos achar. Cada corredor de pé é alguém que ainda respira. É isso que guardamos.',
        { r: [
          { t: 'E quem derruba os corredores?', a: 'Os do outro lado da rua. Eles chamam de liberdade. Eu chamo pelo nome: é abrir a porta do curral e dizer ao lobo que foi gentileza.', luz: 1 },
          { t: 'Parece uma prisão bonita.', a: 'É um abrigo. Prisão é quando alguém o tranca de fora. Aqui, quem tranca é quem está dentro, e tranca para que a criança do lado não seja a primeira a ir.' },
          { t: 'Por que o fio?', a: 'Porque ninguém atravessa só. Quem entra no Labirinto com um dos nossos não sai sozinho. Nem morto. O fio é para voltar, e é para trazer.' } ] },
        'Agora vá ao Aldric. Ele vai lhe contar o que eu não conto, porque eu teço e ele enterra.',
      ],
    },
    done: [
      'Oito. Eu contei da muralha. Você luta como quem já perdeu alguém, e isso não é elogio, é observação.',
      'A Ingeborg lhe mostrou o brasão. Eu mostro o resto. Vê o meu escudo? Por dentro, gravado na madeira, tem nomes. Um embaixo do outro. São as pessoas que eu não consegui guardar.',
      'Eu leio todos, toda noite, antes de dormir. Não para sofrer. Para lembrar que a Ordem jura que ninguém atravessa só, e eles atravessaram. Alguém tem que ir junto, nem que seja depois.',
      { r: [
        { t: 'Quantos nomes?', a: 'Trinta e um. O último é de uma menina de Grenivik, no inverno passado. Eu cheguei um dia atrasado. Um dia. O Labirinto tem corredores para isso: para que um dia não seja o fim de ninguém.', luz: 1 },
        { t: 'Os Desfiados dizem que o Labirinto é uma gaiola.', a: 'E dizem com sinceridade, o que é pior. Eu já perdi noites discutindo com eles. Nenhum dos dois convence o outro. Mas eu sei o que vi: quando o muro cai, quem morre primeiro não é quem quis sair. É quem estava perto da porta.' },
        { t: 'Você acha que vai conseguir guardar todo mundo?', a: 'Não. Eu acho que vou tentar todo dia e falhar algumas vezes. É o voto. Quem promete não falhar está mentindo para Auréon na cara dele.' } ] },
      'Agora atravesse a rua. A Corvina vai lhe dizer que eu sou um carcereiro gentil. Ouça. Ela não é má. Ela só está errada, e eu rezo todo dia para que seja eu o errado, porque assim ninguém precisaria morrer para sair.',
    ] },

  { id: 'b02', chain: BC, name: 'O Fio Cortado', lvl: 19, giver: CV, turnin: MI, next: 'b03', xp: 1, gold: 160,
    text: 'Corvina, a Desfiadora, tem a outra metade da história, e Lady Mirela, da Casa Noctavar, está em Askavik para contar a parte que Corvina não conta. Depois prove que entendeu: os mortos do campo santo fecharam a estrada de Grenivik de novo. Oito esqueletos a menos, e a passagem fica aberta para quem quiser ir.',
    objs: [{ kind: 'talk', npc: MI }, { kind: 'kill', type: 'skeleton', n: 8 }],
    talk: [
      'Ah. A Ingeborg já lhe mostrou o fiozinho de ouro? Bonito, não é? Eu rasgo a barra de cada manto que saio daqui com estas mãos. Pergunte por quê.',
      'Porque todo muro é uma mentira. Olhe o nosso brasão: o labirinto partido, o fio cortado, uma boca no meio. A boca é a Fome, e sim, ela devora. Eles dizem isso como se fosse a parte ruim.',
      'Você já morreu? Vai morrer. E vai voltar, na fonte, igualzinho, e vai morrer de novo, e voltar de novo, vida após vida, dentro do mesmo labirinto. Chame isso de proteção, se quiser. Eu chamo de roda.',
      { r: [
        { t: 'E o que vocês querem, então?', a: 'Sair. Cortar o fio e derrubar o muro. A Fome é a única porta para fora da roda, a liberdade de verdade, até a de morrer de vez. Eles acham isso horrível. Eu acho horrível não ter a escolha.', sombra: 1 },
        { t: 'A Fome não pergunta quem queria sair.', a: '…Não. Não pergunta. É a única coisa que o Aldric diz que eu não consigo responder. Ainda. Mas o Labirinto também não perguntou quem queria ficar.' },
        { t: 'Vocês querem ser devorados?', a: 'Não confunda. Nem todo Desfiado é conviva. Eu não quero banquete nenhum. Eu quero a porta aberta, e cada um decide se passa. Isso é tudo.' } ] },
      'Lady Mirela, da Casa Noctavar, está na praça. Ela veio de Corvoscuro só para ver quem chega. Fale com ela. Ela diz as coisas melhor do que eu, com mais educação e menos piedade.',
    ],
    meet: {
      [MI]: [
        'Então você é quem o Aldric anda guardando. Sente-se. Não, eu não mordo. Não antes de ser apresentada.',
        'A Corvina lhe falou da roda. Eu lhe falo da Casa. A Casa Noctavar está de pé há mil anos, e está de pé por três leis que nenhum de nós quebra: não beber de quem está sob a nossa proteção, não criar cria sem o consentimento da Casa, não mentir ao Ancião. Eu jurei aos quinze anos. Nunca quebrei nenhuma.',
        'Digo isso para que você entenda uma coisa: nós temos honra. A nossa honra é não mentir para nós mesmos. Quem anda até a boca anda de olhos abertos, e não empurra quem não quer ir. O Fio chama isso de loucura. Eu chamo de respeito.',
        { r: [
          { t: 'A Ordem diz que o muro protege as crianças.', a: 'Protege. E depois decide, pela criança, quando ela está pronta. E depois pela mulher. E depois pela velha. Em mil anos, caminhante, eu nunca vi a Ordem dizer de alguém: está pronto. Nunca. Isso não é proteção. É tutela eterna com boas maneiras.', sombra: 1 },
          { t: 'E a Fome come todo mundo igual.', a: 'Come. Às claras, com dentes, de frente. Eu prefiro um inimigo que eu vejo a um abrigo que me diz o que eu posso querer.' },
          { t: 'Por que uma vampira se importa com a liberdade dos outros?', a: 'Porque eu não escolhi a mordida da primeira vez. E jurei que ninguém, sob a minha proteção, ficaria sem escolha de novo. É a quarta lei. Essa é só minha.' } ] },
        'Vá a Grenivik e abra a estrada. Os mortos do campo santo fecham a passagem toda semana, e o Jarl a guarda como se fosse dele. A estrada não é de ninguém. É de quem quer passar.',
      ],
    },
    done: [
      'Oito. E a estrada está aberta. Por hoje.',
      'Você percebeu? Nós também mandamos você matar os mortos. O Fio também. A diferença não está no que fazemos, caminhante. Está no porquê. E o Olho de Marghar, dizem, pesa só o porquê.',
      { r: [
        { t: 'Então vocês e a Ordem querem a mesma coisa.', a: 'Queremos salvar Karmika. Os dois. E cada um tem certeza de que o outro é o que vai acabar com ela. Essa é a guerra, e ela não acaba em conversa. Eu já tentei. O Aldric também.', sombra: 1 },
        { t: 'O Aldric guarda os nomes de quem perdeu.', a: '…Eu sei. Eu li a lista uma vez, quando ele estava bêbado o bastante para deixar. Trinta e um. Eu respeito o Aldric. É por isso que vou derrubar o muro dele: para que ele não precise de uma lista.' },
        { t: 'E você, quem perdeu?', a: 'Pergunta indelicada. Gosto de você. A resposta é: todo mundo, uma vez a cada vida, e eu lembro de todas as vidas. É isso que o fio de ouro faz com quem volta.' } ] },
      'Agora, uma coisa que nem a Corvina nem a Ingeborg vão lhe dizer: procure a Velha Gunnhild. Ela guarda as relíquias e guarda outra coisa, mais antiga do que as duas bandeiras. Ela não gosta de falar. Insista.',
    ] },

  { id: 'b03', chain: BC, name: 'A Porta Que Ninguém Abre', lvl: 19, giver: GU, turnin: GU, next: 'b04', xp: 1, gold: 120,
    text: 'A Velha Gunnhild quer que você veja uma coisa antes de a Vidente ler a sua alma. No Cemitério Esquecido, perto de Karmika, há uma porta de pedra preta que não tem maçaneta. Ligue o Instinto (F) diante dela, olhe, e volte. Não bata.',
    objs: [{ kind: 'visit', poi: 'Cemitério Esquecido' }, { kind: 'sense', what: 'dispositivo', label: 'A porta de pedra preta sem maçaneta', at: 'Cemitério Esquecido', dx: 6, dy: -5 }],
    talk: [
      'Mirela mandou você. Aquela sabe demais e fala de menos. Senta aí, que eu não vou gritar.',
      'Você ouviu as duas bandeiras. Uma guarda, a outra corta. As duas acham que o mundo é isso: muro e boca. Eu guardo relíquias há cinquenta anos, e relíquia ensina uma coisa: o mundo é mais velho do que as brigas dele.',
      'No Cemitério Esquecido, onde você começou, tem uma porta de pedra preta. Debaixo das lápides velhas, do lado da sombra. Você passou por ela dez vezes e nunca viu, porque ninguém vê. Ligue o Instinto diante dela.',
      { r: [
        { t: 'O que tem atrás da porta?', a: 'Não sei. Ninguém sabe. Ela não tem maçaneta, não abre por fora. Tem um olho esculpido, de pálpebras baixas. Não é o Olho de Marghar dormindo. É outra coisa.' },
        { t: 'É do Fio ou dos Desfiados?', a: 'Nem um nem outro. É mais velha que as bandeiras. Mais velha que a Ordem. Os anões de Brasaforja têm uma igual no fundo das galerias, e o Rei Thrain mandou escrever na parede: não abra. Nós não somos os que batem.' },
        { t: 'Por que me mostrar isso agora?', a: 'Porque daqui a dois dias a Vidente vai lhe dizer o que você é, e você vai passar a vida inteira olhando para uma bandeira. Quero que, antes, você olhe uma vez para o que não tem bandeira.' } ] },
      'Vá. Olhe. Não encoste. E se ouvir alguma coisa batendo do lado de dentro, volte andando, não correndo. Quem corre, volta.',
    ],
    done: [
      'Viu. Dá para ver no seu rosto. Agora você sabe de uma coisa que a Ingeborg e a Corvina não sabem, e eu peço que não conte a nenhuma das duas.',
      { r: [
        { t: 'O olho estava fechado. Parecia que fingia dormir.', a: '…É. É isso mesmo que ele parece. Anote isso em algum lugar da cabeça e deixe lá. Um dia alguém vai lhe perguntar, e não vou ser eu.' },
        { t: 'Alguma coisa bateu.', a: 'Não bateu. Você quis que batesse. É assim que ela trabalha, essa porta: ela deixa você querer. Vá tomar um caldo na Escola de Guerra e esqueça. Por enquanto.' },
        { t: 'Não vi nada de mais. Uma porta velha.', a: 'Bom. Melhor assim. Quem não vê nada, não é visto. Volte ao Halvard, criança. Ele tem uma pergunta para você, e eu tenho uma vela para acender que nunca acende.' } ] },
      'Agora vá ao Halvard. Ele tem uma pergunta. E depois a Hrefna vai ter doze. Guarde a sua para o fim: as perguntas de quem ainda não jurou são as melhores.',
    ] },

  { id: 'b04', chain: BC, name: 'A Pergunta', lvl: 19, giver: HV, turnin: HV, next: 'p01', xp: 1, gold: 140,
    text: 'Você ouviu o Fio e os Desfiados, e viu o que não tem bandeira. Antes de a Vidente ler a sua alma, o Cronista Ormund Salveth, na Grande Biblioteca, quer anotar o que você viu; ele anota tudo. Depois volte ao Mestre Halvard: ele tem uma pergunta só, e ninguém responde por você.',
    objs: [{ kind: 'talk', npc: OS }],
    talk: [
      'Voltou inteiro. A Gunnhild lhe mostrou a porta? Não me conte. Eu não quero saber, e você vai entender isso quando tiver a minha idade.',
      'Antes da minha pergunta, passe na Grande Biblioteca. O Cronista Ormund anota todo mundo que ouve as duas bandeiras antes de jurar. Diz que um dia vai escrever um livro. Diz isso há trinta anos.',
      { r: [
        { t: 'Qual é a pergunta?', a: 'Depois. Pergunta boa não se faz com pressa. Vá ao Ormund.' },
        { t: 'Por que um cronista se importa comigo?', a: 'Porque ele acha que a história de Karmika é feita por quem ainda não escolheu. Eu acho que é feita por quem segura a espada. Nós dois estamos errados, provavelmente.' } ] },
    ],
    meet: {
      [OS]: [
        'Ah, mais um antes da Vidente. Senta, senta. Tinta, pergaminho, paciência. O que você ouviu?',
        'Não, não me diga de que lado gostou mais. Isso todo mundo diz, e todo mundo erra. Me diga o que o Aldric falou do escudo e o que a Mirela falou das leis. Eu quero as palavras, não a opinião.',
        { r: [
          { t: 'Aldric lê os nomes de quem não guardou. Mirela nunca quebrou uma lei da Casa.', a: 'Vê? Você já entendeu mais do que a metade das academias. Os dois têm honra. Eles só não concordam sobre o que é justiça. Eu escrevo isso há anos e ninguém lê.' },
          { t: 'Os dois querem salvar Karmika.', a: 'Os dois. E cada um acha que o outro é a ruína. É a frase que abre o meu décimo quinto livro, e você acabou de dizê-la sem ler. Vou anotar que você disse primeiro.' },
          { t: 'Vi uma porta de pedra preta.', a: '…Fale baixo. Eu também já vi. Anotei numa nota de rodapé e nunca mais perguntei o que ela tinha a ver com as outras coisas. Faça melhor do que eu: pergunte. Um dia.' } ] },
        'Pronto, anotado. Agora vá ao Halvard. E caminhante: quando lhe derem uma missão, repare quem a dá. Pode ser um dos que eu ainda vou escrever.',
      ],
    },
    done: [
      'O Ormund anotou? Ótimo. Então agora é oficial, e eu posso perguntar.',
      'Você ouviu os dois lados. Ainda não precisa jurar nada: jurar é no trinta, com a classe, e a classe já é o lado. Mas eu quero saber, de você para mim, antes da Vidente:',
    ],
    choice: { q: 'Mestre Halvard cruza os braços: “Para onde a sua alma pende?”', opts: [
      { label: '“Para o Fio. Alguém tem que guardar a porta.”', karma: 0, flag: 'lean_fio', say: 'Então o Aldric ganhou mais uma noite de sono. Guarde a porta. Mas nunca esqueça de perguntar a quem está dentro se quer ficar.', why: 'Pender para o Fio não é jurar. É dizer em voz alta que, entre guardar e abrir, você guarda. A Vidente vai ouvir isso também.' },
      { label: '“Para os Desfiados. Ninguém me diz quando estou pronto.”', karma: 0, flag: 'lean_desf', say: 'Então a Mirela vai sorrir daquele jeito dela. Abra a porta. Mas olhe primeiro quem está perto dela, porque a Fome não olha.', why: 'Pender para os Desfiados não é jurar. É dizer em voz alta que, entre guardar e abrir, você abre. A Vidente vai ouvir isso também.' },
      { label: '“Para nenhum dos dois. Ainda.”', karma: 0, flag: 'lean_livre', say: 'A resposta mais rara e a mais honesta. Guarde-a. A Vidente vai gostar, e as duas tecelagens vão odiar você por uns anos.', why: 'Quem não pende ainda ouve. É a posição mais difícil de manter em Askavik, e a que o Olho olha com mais curiosidade.' } ] } },
];

/** pontes do Prólogo (quem entregou → quem chama) */
export const BANNER_BRIDGES: Record<string, { name: string; say: string; text: string }> = {
  b01: { name: 'As duas tecelagens', say: 'Selvar está limpa e o Jarl está satisfeito. Agora a parte que a Escola de Guerra não ensina: venha falar comigo sobre as duas bandeiras.', text: 'O Mestre Halvard quer lhe contar da briga mais velha de Askavik antes de a Vidente ler a sua alma. Ele está na Escola de Guerra, no noroeste da cidade.' },
  b02: { name: 'O outro lado da rua', say: 'Você ouviu o Fio. Agora atravesse a rua: a Corvina, na Tecelagem dos Desfiados, tem a outra metade. Ouça. Ela não é má. Ela só está errada.', text: 'Corvina, a Desfiadora, na Tecelagem dos Desfiados (oeste da praça de Askavik, em frente à do Fio), quer lhe contar por que rasga a barra de cada manto.' },
  b03: { name: 'A guardiã que não gosta de falar', say: 'Agora procure a Velha Gunnhild, na praça. Ela guarda uma coisa mais antiga do que as duas bandeiras, e não gosta de falar disso. Insista.', text: 'A Velha Gunnhild, guardiã das relíquias de Askavik, quer lhe mostrar uma coisa antes da Vidente. Ela está na praça.' },
  b04: { name: 'A pergunta do Halvard', say: 'Volte ao Halvard. Ele tem uma pergunta para você, e ninguém responde por você.', text: 'O Mestre Halvard, na Escola de Guerra, tem uma pergunta só para fazer antes de a Vidente ler a sua alma.' },
};
