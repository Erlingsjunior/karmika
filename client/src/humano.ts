/* ---------- A CASA DE VERDADE — Capítulo I do Humano puro (níveis 20–31), 09/11. "A Palavra Que Fica".
   Para quem recusou classe na Vidente e nasceu humano (v_hum + origem humana). O humano não tem dom: tem palavra.
   O caminho dele é POLÍTICO: erguer casa, muro e vila, fundar guilda, contratar quem o proteja (o humano não luta: paga quem lute).
   Não negocia com o lado escuro — lá ele é PRESA (quem vende aos dois lados é o anão).
   Portador: o Velho Ansgar, Ancião de Karmika, que aparece em toda obra "para atrapalhar" (regra de ouro 5: o solene com alguém reclamando).
   Base: Gunnar (construtor), Garrick (guarda), Thorin (mercador), Lúcia (aldeã), o Prefeito de Lumenhal.
   Pista do capítulo (sem resposta): a sexta runa que o pedreiro traça na pedra fundamental "porque sempre se traçou".
   Toda podridão é culpa de Zerath. Ninguém reconcilia ninguém. ---------- */
import type { QuestDef } from './quests';

export const AN = 'Velho Ansgar', GU = 'Gunnar', GA = 'Garrick', TH = 'Thorin', LU = 'Lúcia', PR = 'Prefeito Corvin Aldmar';
const CV = 'A Casa de Verdade';
const H = { origin: 'human' as const };

export const HUMAN_I: QuestDef[] = [
  { id: 'hm1', chain: CV, ...H, name: 'A Pedra Fundamental', lvl: 20, giver: GU, turnin: GU, req: 'v_hum', next: 'hm2', xp: 0, gold: 200, items: [['potion_g', 2]],
    text: 'Quem fica humano precisa de chão. O Gunnar vai erguer com você a primeira casa de verdade em Karmika. Junte o material da fundação: seis blocos de pedra e dez tábuas. Os blocos e as tábuas se fazem na bancada, ou se compram com ele.',
    objs: [{ kind: 'collect', item: 'block', n: 6 }, { kind: 'collect', item: 'plank', n: 10 }],
    talk: [
      'Então você ficou humano. A Hrefna me contou. Disse que você olhou para os dons todos e falou “não, obrigado”. Gostei. Anão também não muda de casca por capricho.',
      'Humano sem dom precisa de duas coisas: chão e palavra. A palavra é com você. O chão é comigo. Vamos levantar uma casa.',
      { r: [
        { t: 'Uma casa? Eu queria aventura.', a: 'Aventura é o que acontece com quem não tem casa. Tenha casa primeiro. Depois a aventura tem para onde voltar.' },
        { t: 'Por onde se começa?', a: 'Pela fundação. Seis blocos, dez tábuas. Casa sem fundação é promessa sem testemunha: cai no primeiro vento.' },
        { t: 'Você vai cobrar?', a: 'O material, sim. O trabalho, não. Humano que levanta a primeira casa em Karmika ganha a mão do anão de graça. Tradição. Eu inventei agora.' } ] },
      'Ah. E se aparecer um velho na obra dando palpite, é o Ansgar. Não discuta. Ele ganha.',
    ],
    done: [
      'Seis blocos, dez tábuas. Você carregou tudo sem reclamar? Reclamou? Ótimo. Quem não reclama de pedra não está carregando direito.',
      { r: [
        { t: 'Onde vai ser a casa?', a: 'Onde a palavra couber. O Ansgar vai dizer onde. Ele sempre diz. Ele diz até onde eu ponho a minha bota.' } ] },
    ] },

  { id: 'hm2', chain: CV, ...H, name: 'O Velho na Obra', lvl: 21, giver: AN, turnin: AN, next: 'hm3', xp: 0, gold: 220,
    text: 'O Velho Ansgar, Ancião de Karmika, apareceu na obra para atrapalhar. Ele quer ver a pedra fundamental antes de qualquer tábua subir. Ligue o Instinto (F) diante da pedra e veja o que o pedreiro traçou nela.',
    objs: [{ kind: 'sense', what: 'dispositivo', label: 'A pedra fundamental da sua casa, em Karmika', at: 'Karmika', dx: -6, dy: 4 }],
    talk: [
      'Então é você o que ficou humano. Sente aqui. Não, aí não, aí é do gato. Ali.',
      'Eu sou Ansgar. Ancião de Karmika. Isso quer dizer que sou velho e que ninguém teve coragem de me tirar do banco da praça. Já fui ferreiro, juiz, coveiro e prefeito. Fui bom em dois.',
      { r: [
        { t: 'Em quais dois?', a: 'Coveiro e ferreiro. Os mortos e o ferro não discutem. Juiz e prefeito, todo mundo discute. Por isso o humano precisa de palavra: é a única coisa que não se discute depois de dada.' },
        { t: 'O senhor veio ajudar na obra?', a: 'Vim atrapalhar. Obra sem velho atrapalhando sai torta. O velho é o prumo que fala.' },
        { t: 'Por que olhar a pedra?', a: 'Porque o pedreiro traça um sinal nela. Sempre traçou. Ninguém sabe por quê. Eu quero que você veja antes de esquecer que viu.' } ] },
    ],
    done: [
      'Viu o risco? A sexta runa. A que não tem nome. O pedreiro traça na pedra fundamental de toda casa de Karmika. Pergunte a ele por quê.',
      { r: [
        { t: 'Eu perguntei. Ele disse “porque sempre se traçou”.', a: 'É a resposta de toda coisa importante em Karmika. Ninguém lembra por quê. Todo mundo lembra de fazer. Anote isso no seu coração de humano: o que se faz sem saber por quê é o que segura a casa.' },
        { t: 'O senhor sabe o que ela significa?', a: 'Eu sei que ela está debaixo de todas as casas em que eu morei. Três vidas, se você acredita na Hrefna. Eu acredito em metade do que ela diz. A metade certa.' } ] },
    ] },

  { id: 'hm3', chain: CV, ...H, name: 'O Quadro de Pedidos', lvl: 22, giver: GA, turnin: GA, next: 'hm4', xp: 0, gold: 240,
    text: 'O quadro de avisos da praça está cheio de pedidos que ninguém pega. O Garrick quer que o humano de Karmika faça disso um ofício: comece pelo mais antigo, os salteadores que roubam as carroças de farinha na estrada de Lundr. Seis deles.',
    objs: [{ kind: 'kill', type: 'bandit', n: 6 }],
    talk: [
      'O quadro da praça. Olhe. Pedido de três meses atrás: “salteadores na estrada de Lundr, farinha roubada”. Ninguém pegou. Os caçadores querem demônio, os paladinos querem fé, os magos querem livro. Farinha não interessa a ninguém.',
      'A você interessa. Humano é quem cuida do que ninguém quer cuidar. Pão, estrada, ponte, muro. Não é glória. É a cidade de pé amanhã de manhã.',
      { r: [
        { t: 'Por que eu?', a: 'Porque você ficou. Quem pega classe vai embora para a torre, para o castelo, para a selva. Quem fica, fica com o quadro.' },
        { t: 'Isso paga?', a: 'Paga pouco. Paga sempre. É o salário do humano: pouco e sempre. Os outros ganham muito uma vez e morrem.' } ] },
    ],
    done: [
      'Seis salteadores e a farinha de volta. A padeira vai fazer pão de graça para você por uma semana. Isso é fama, em Karmika.',
      { r: [
        { t: 'Eles tinham um acampamento grande demais para ladrões de farinha.', a: 'Reparou. Alguém paga para eles atrapalharem a estrada. Estrada atrapalhada é imposto que não chega. Os velhos dizem que é a podridão, que Zerath apodrece até a estrada. Eu digo que alguém ganha com isso. Os dois podem estar certos.' } ] },
    ] },

  { id: 'hm4', chain: CV, ...H, name: 'A Dívida do Thorin', lvl: 23, giver: TH, turnin: TH, next: 'hm5', xp: 0, gold: 260,
    text: 'A Lúcia deve ao Thorin um saco de prata desde o inverno, quando o marido dela adoeceu. O Thorin quer receber; a Lúcia não tem. Fale com ela e decida: o humano paga a dívida de outro, cobra, ou acha um terceiro caminho.',
    objs: [{ kind: 'talk', npc: LU }],
    talk: [
      'Eu sou mercador. Mercador vive de duas coisas: vender e receber. Vender eu sei. Receber, de gente boa, eu não sei. A Lúcia é gente boa. Ela me deve desde o inverno.',
      'Eu não vou cobrar. Se eu cobrar, sou o anão malvado da praça. Se eu não cobrar, a praça inteira aprende que dívida com o Thorin é presente. Vá você. Humano resolve essas coisas com palavra.',
      { r: [
        { t: 'Quanto ela deve?', a: 'Oitenta. Para mim é muito. Para você, que acabou de ganhar pão de graça por uma semana, é um mês de pedidos do quadro.' },
        { t: 'E se eu pagar por ela?', a: 'Aí a dívida é sua comigo. Ou dela com você. Dívida não some: muda de dono. É a primeira lição de política.' } ] },
    ],
    meet: { [LU]: [
      { who: LU, t: 'O Thorin mandou você. Eu sei. Eu devo. Eu sei. O Tomas melhorou, graças a Auréon e às poções dele. Eu sei que tenho que pagar.' },
      { who: LU, t: 'Eu tenho o tear. Faço manta. Mas manta não vende no verão. No inverno eu pago. Se ele esperar o inverno, eu pago com juros. Eu juro.' },
    ] },
    choice: { q: 'De volta ao balcão do Thorin, com a Lúcia esperando na porta. Você…', opts: [
      { label: 'Paga a dívida e pede à Lúcia que, no inverno, pague a você em mantas para os pobres.', karma: 4, flag: 'hum_divida_mantas', say: 'O Thorin recebeu. A Lúcia teceu vinte mantas no inverno e você as deu aos mendigos de Karmika. A praça inteira soube. Ninguém soube por você.', why: 'A dívida mudou de dono e de forma: virou manta para quem tinha frio.' },
      { label: 'Convence o Thorin a esperar o inverno, com a sua palavra como garantia.', karma: 3, flag: 'hum_divida_palavra', say: 'O Thorin aceitou a sua palavra. No inverno a Lúcia pagou, com juros. O Thorin disse: “A palavra do humano vale oitenta. Vou anotar.”', why: 'Você não pagou com prata. Pagou com o seu nome. É a moeda do humano.' },
      { label: 'Cobra da Lúcia: dívida é dívida.', karma: -3, flag: 'hum_divida_cobrou', say: 'A Lúcia vendeu o tear. O Thorin recebeu e não ficou feliz. A praça aprendeu que o humano novo cobra. Alguns gostaram. Os pobres, não.', why: 'Você cumpriu a regra e quebrou quem a regra devia proteger.' } ] },
    done: [
      'Resolvido. Eu não sei se do jeito certo. Eu sei que eu não tive que resolver. Isso, para um anão, é o jeito certo.',
    ] },

  { id: 'hm5', chain: CV, ...H, name: 'O Muro de Karmika', lvl: 24, giver: AN, turnin: AN, next: 'hm6', xp: 0, gold: 280, gear: 1,
    text: 'Karmika quer muro. Os lobos chegam à cerca da plantação e as carroças da noite não param mais. O Velho Ansgar pergunta o que ninguém pergunta: quem paga? Junte a pedra do primeiro trecho (vinte pedras e quatro blocos) e decida diante da praça.',
    objs: [{ kind: 'collect', item: 'stone', n: 20 }, { kind: 'collect', item: 'block', n: 4 }],
    talk: [
      'A vila quer muro. Toda vila quer muro quando um lobo aparece na cerca. Ninguém quer muro quando chega a conta.',
      'Muro é a primeira coisa política que um humano levanta. Casa é sua. Muro é de todos. E o que é de todos, ninguém paga.',
      { r: [
        { t: 'Quem deveria pagar?', a: 'Eu sei quem vai pagar. Quero ver quem você acha que deve. É diferente. A política mora nessa diferença.' },
        { t: 'Não dá para pedir à Ordem, ou aos caçadores?', a: 'Dá. Aí o muro é deles. E um dia eles vão querer entrar pelo portão que pagaram. Muro pago por outro é porta de outro.' } ] },
    ],
    choice: { q: 'Na praça, com a pedra empilhada, a vila espera. O muro vai ser pago…', opts: [
      { label: 'Por todos, cada casa conforme pode: os ricos mais, os pobres com trabalho.', karma: 4, flag: 'hum_muro_todos', say: 'Demorou dois meses. Saiu torto num canto. Ninguém deixou de ajudar. O Ansgar sentou no muro pronto e disse: “Agora é nosso.”', why: 'Você fez o muro de todos ser pago por todos, no tamanho de cada um.' },
      { label: 'Por você, com o que ganhou no quadro.', karma: 1, flag: 'hum_muro_meu', say: 'Saiu rápido e reto. A vila agradeceu. O Ansgar não. “Muro pago por um é muro de um. Um dia vão te pedir as chaves.”', why: 'Generoso. Mas você comprou um pedaço da vila sem perceber.' },
      { label: 'Pelo mercador mais rico, em troca do nome dele na pedra do portão.', karma: -2, flag: 'hum_muro_mercador', say: 'O muro tem o nome do Thorin no portão. Ele cobra pedágio das carroças desde então. Pouco. Sempre.', why: 'Você vendeu o portão da vila para não incomodar ninguém.' } ] },
    done: [
      'O muro está de pé. Você vai ver: daqui a um ano, ninguém lembra que não tinha muro. É o destino de toda obra boa: virar paisagem.',
    ] },

  { id: 'hm6', chain: CV, ...H, name: 'O Primeiro Segurança', lvl: 26, giver: GU, turnin: GU, next: 'hm7', xp: 0, gold: 300,
    text: 'A sua casa está quase pronta e alguém anda roubando material de noite. O humano não luta sozinho: contrata quem lute. Peça ao Garrick um guarda para a obra e, com ele, espere os ladrões. Quatro arqueiros salteadores rondam a obra.',
    objs: [{ kind: 'talk', npc: GA }, { kind: 'kill', type: 'bandit_arch', n: 4 }],
    talk: [
      'Sumiram doze tábuas e um saco de pregos. Não foi o gato do Ansgar: o gato do Ansgar só rouba linguiça.',
      'Você pode ficar acordado todas as noites. Ou pode contratar quem fique. Humano esperto contrata. Paga, e dorme. Dormir é a vantagem de quem paga.',
      { r: [
        { t: 'Eu sei lutar.', a: 'Sabe. E amanhã vai estar cansado na obra. Quem levanta cidade não pode passar a noite brigando com ladrão de prego.' },
        { t: 'Quanto custa um guarda?', a: 'O Garrick vai dizer. Ele cobra justo. Mas preste atenção no que ele pede além do ouro: é aí que se vê se o guarda é leal ao ouro ou à palavra.' } ] },
    ],
    meet: { [GA]: [
      { who: GA, t: 'Um guarda para a obra. Eu tenho um rapaz, o Bjorn. Ele vale vinte por semana. E um prato quente.' },
      { who: GA, t: 'O prato quente é o que importa. Guarda pago só com ouro vai embora por mais ouro. Guarda que come na sua mesa fica. É assim que o humano compra lealdade: com sopa.' },
    ] },
    done: [
      'Pegaram os ladrões. O Bjorn segurou dois, você os outros. Ele comeu três pratos na sua mesa. Vai ficar.',
      { r: [
        { t: 'Os ladrões disseram quem pagou?', a: 'Um disse que um homem de Askavik pagou para atrasar a obra. Que obra de humano parada é imposto parado. Quer saber? Eu não quero saber. Eu quero a casa de pé.' } ] },
    ] },

  { id: 'hm7', chain: CV, ...H, name: 'A Primeira Guilda', lvl: 27, giver: AN, turnin: PR, next: 'hm8', xp: 0, gold: 320,
    text: 'Casa, muro, guarda. Agora o humano precisa de gente. O Velho Ansgar manda você a Lumenhal, ao Prefeito Corvin Aldmar, que registra as guildas desde antes de Askavik ter muralha. Leve o nome da sua primeira guilda.',
    objs: [{ kind: 'visit', poi: 'Lumenhal' }, { kind: 'talk', npc: PR }],
    talk: [
      'Uma casa é sua. Um muro é da vila. Uma guilda é das pessoas que escolheram você. É a coisa mais frágil das três e a que dura mais.',
      'O Prefeito de Lumenhal registra guildas. Ele vai pedir o nome, o estandarte e uma promessa. O nome e o estandarte qualquer um inventa. A promessa vai ficar escrita. Pense nela na estrada.',
      { r: [
        { t: 'Que promessa eu faço?', a: 'Uma que você consiga cumprir velho. Promessa de jovem é grande. Promessa de velho é pequena e inteira. Faça uma de velho.' },
        { t: 'O senhor já teve guilda?', a: 'Três. Uma acabou em briga, uma em casamento, uma em enterro. A do enterro foi a mais honesta.' } ] },
    ],
    meet: { [PR]: [
      { who: PR, t: 'Uma guilda nova. Nome, estandarte e uma promessa. A promessa vai para o livro. O livro não esquece.' },
      { who: PR, t: 'O Ansgar mandou você? Ele registrou três guildas aqui. Na terceira, a promessa era “ninguém fica para trás”. Ele cumpriu. Custou caro.' },
      { who: PR, t: 'Escreva a sua. Devagar. Este é o único papel de Karmika que eu não deixo rasgar.' },
    ] },
    done: [
      'Registrada. Agora você é o fundador de alguma coisa. Os de cima vão querer saber de que lado a sua guilda fica. Em Askavik falam do Fio e dos Desfiados. Os dois querem salvar Karmika. Pense nisso antes de pendurar o estandarte.',
    ] },

  { id: 'hm8', chain: CV, ...H, name: 'Presa na Estrada', lvl: 28, giver: GA, turnin: GA, next: 'hm9', xp: 0, gold: 340, gear: 1,
    text: 'Os servos do Conde atacam humanos que viajam sozinhos pela estrada do leste. Para a sombra, o humano é presa. O Garrick quer que você escolte a carroça do correio até a curva da mata e derrube seis servos de sangue. Não negocie. Lá, humano não negocia.',
    objs: [{ kind: 'kill', type: 'thrall', n: 6 }],
    talk: [
      'Tem uma coisa que você precisa saber antes de andar sozinho para o leste: para eles, você é comida.',
      'O anão vende ferro para os dois lados. O elfo é respeitado lá, até. O humano, não. Humano é o que os servos do Conde levam na carroça de volta. Não é pessoal. É cardápio.',
      { r: [
        { t: 'E se eu tentar conversar?', a: 'Conversa com quem te vê como prato é tempero. Não negocie. Lute, ou pague quem lute. Hoje, lute.' },
        { t: 'Isso vai ser sempre assim?', a: 'Enquanto você for humano sem bandeira, sim. Com bandeira, talvez pior. Com nome, talvez melhor. É por isso que o humano precisa de nome.' } ] },
    ],
    done: [
      'Seis servos e o correio passou. Um deles sussurrou uma coisa antes de cair?',
      { r: [
        { t: '“A Casa agradece a refeição de sempre.”', a: 'Então eles conhecem a carroça. Alguém aqui vende o horário do correio. Vou descobrir quem. E você vai continuar andando acompanhado.' },
        { t: 'Ele não disse nada.', a: 'Melhor. Os que falam assustam mais. Volte para a obra. A sua casa está esperando telhado.' } ] },
    ] },

  { id: 'hm9', chain: CV, ...H, name: 'A Palavra Dada na Praça', lvl: 30, giver: AN, turnin: AN, next: 'hm10', xp: 0, gold: 360,
    text: 'O Velho Ansgar quer que o humano de Karmika diga em voz alta, diante da praça, a palavra que vai guardar para sempre. Não é juramento de deus: é promessa a gente. Converse com o Eldrin no templo antes de subir na fonte.',
    objs: [{ kind: 'talk', npc: 'Eldrin' }],
    talk: [
      'Os outros juram a deuses. O paladino a Auréon, o mago a Arquelon, o bruxo ao contrato. O humano jura à praça. À padeira, ao guarda, ao gato. É mais difícil: a praça te vê todo dia.',
      'Fale com o Eldrin primeiro. Ele vai tentar fazer você jurar ao Olho. Diga que não. Educadamente. O Eldrin é bom, só acha que tudo precisa de deus.',
      { r: [
        { t: 'O que eu prometo?', a: 'Uma coisa que você faria mesmo se ninguém estivesse olhando. Na praça, todo mundo vai estar olhando. É o teste.' },
        { t: 'E se eu quebrar a promessa?', a: 'Aí a praça lembra. A praça lembra mais que o Olho. O Olho perdoa no fim da vida. A praça não espera tanto.' } ] },
    ],
    meet: { Eldrin: [
      { who: 'Eldrin', t: 'O Ansgar vai fazer você jurar à praça. Velho teimoso. O Olho vê mais longe que a praça.' },
      { who: 'Eldrin', t: 'Mas ele tem razão numa coisa: o Olho perdoa. A praça, não. Se você quer ser cobrado de verdade, jure à praça. Eu vou estar lá. Ouvindo.' },
    ] },
    choice: { q: 'Na borda da fonte, com Karmika inteira olhando, você promete…', opts: [
      { label: '“Ninguém de Karmika passa fome enquanto eu tiver pão.”', karma: 5, flag: 'hum_palavra_pao', say: 'A padeira chorou. O Ansgar disse “pequena e inteira, boa”. Desde então, toda vez que alguém tem fome em Karmika, bate na sua porta. E você abre.', why: 'Uma promessa pequena, que custa todo dia. A palavra do humano.' },
      { label: '“Karmika vai ter muro, ponte e escola enquanto eu viver.”', karma: 2, flag: 'hum_palavra_obra', say: 'A praça aplaudiu. O Ansgar não. “Promessa de jovem. Grande. Vamos ver.” Ele anotou num papel que guarda no bolso.', why: 'Uma promessa bonita e grande. A praça vai cobrar cada tijolo.' },
      { label: '“Eu vou ser o governador desta terra.”', karma: -2, flag: 'hum_palavra_poder', say: 'Silêncio na praça. Alguém riu. O Ansgar desceu do banco e foi para casa sem falar nada. O Eldrin olhou para o Olho.', why: 'Você prometeu a si mesmo diante dos outros. A praça percebeu.' } ] },
    done: [
      'Dita está. Agora ela fica. Você vai descobrir que a palavra pesa mais que qualquer espada: a espada você guarda na bainha. A palavra fica pendurada no pescoço.',
    ] },

  { id: 'hm10', chain: CV, ...H, name: 'A Casa de Verdade', lvl: 31, giver: GU, turnin: AN, title: 'Casa de Verdade', xp: 0, gold: 420, gear: 1, items: [['potion_g', 4]],
    text: 'O telhado. O Gunnar precisa de dez tábuas e dez pregos para fechar a casa. Depois, leve a chave ao Velho Ansgar: em Karmika, a primeira casa de um humano é aberta pelo mais velho da vila.',
    objs: [{ kind: 'collect', item: 'plank', n: 10 }, { kind: 'collect', item: 'nail', n: 10 }],
    talk: [
      'Telhado. A última parte e a mais fácil, e a que mais gente erra. Quem erra o telhado erra porque achou que a casa já estava pronta.',
      'Dez tábuas, dez pregos. Depois leve a chave ao Ansgar. Ele vai abrir a porta, entrar primeiro, sentar na sua cadeira e reclamar da cadeira. É tradição. Essa ele que inventou.',
      { r: [
        { t: 'É mesmo minha, a casa?', a: 'É sua. A pedra fundamental é de Karmika. A runa debaixo dela é de ninguém. Nessa ordem.' },
        { t: 'E depois da casa?', a: 'Depois vem a vila. Humano que levanta casa acaba levantando rua. É uma doença boa. Eu peguei de um humano, aliás, há duzentos anos.' } ] },
    ],
    done: [
      '(O Ansgar abre a porta, entra primeiro, senta na sua cadeira.) Cadeira dura. Ótimo. Cadeira mole é para quem não tem nada para fazer amanhã.',
      'Agora você tem casa, muro, guarda, guilda e palavra. Os outros ganharam dons da Deusa. Você ganhou isto. Daqui a cem anos, vão lembrar dos dons dos outros nas canções. Da sua casa, vão lembrar morando nela.',
      { r: [
        { t: 'O senhor recusou a Vidente também?', a: 'Três vidas seguidas. Ela me ofereceu paladino, mago e, uma vez, por piada, lobisomem. Eu disse não três vezes. Não por coragem. Por teimosia. Teimosia é coragem que não sabe o próprio nome.' },
        { t: 'E a runa na pedra?', a: 'Continua lá. Debaixo da sua cadeira. Não sei o que segura. Sei que a casa não caiu. Por enquanto, me basta.' },
        { t: 'E as bandeiras de Askavik?', a: 'Vão te chamar. O Fio e os Desfiados. Os dois querem salvar Karmika. Lembre: nos Desfiados, você ainda é presa. Escolha sabendo disso.' } ] },
    ] },
];

/** o Portador do humano: o Velho Ansgar, no banco da praça de Karmika */
export const HUMAN_I_NPCS = [
  { vila: 'Karmika', name: AN, role: 'Ancião de Karmika', dx: -4.5, dy: 2.5, tint: 0x7a6a5a, lines: ['Obra sem velho atrapalhando sai torta.', 'Teimosia é coragem que não sabe o próprio nome.', 'Não senta aí, é do gato.'] },
];
