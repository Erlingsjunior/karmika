/* ---------- CINCO CLÁUSULAS — Capítulo I do Bruxo (níveis 20–31), 09/11. "A Cláusula".
   Depois da Vidente (v_bru). Malgrath, Senhor dos Pactos, empresta o poder e cobra juros; a Portadora Ravena Cinco-Cláusulas,
   bruxa jovem de Gorvath, só assina pactos de cinco cláusulas ("o resto é vaidade") e lê letra miúda melhor que o próprio Malgrath.
   O bruxo paga com a própria sombra, nunca com a dos outros. Compra dos inimigos e vende a quem o caça: negócio é negócio.
   Tom (regra de ouro 5): Malgrath solene e paciente; Ravena seca, impaciente e engraçada sem querer.
   Pista do capítulo (sem resposta): a sexta runa no rodapé de todo pacto de Malgrath — nem ele sabe quem pôs a primeira.
   Toda podridão é culpa de Zerath. Ninguém reconcilia ninguém. ---------- */
import type { QuestDef } from './quests';

export const MG = 'Malgrath, Senhor dos Pactos', RV = 'Ravena Cinco-Cláusulas', GR = 'Bruxa Grisolda', SE = 'Arquimaga Seline', VK = 'Caçador Viktor Helsing';
const CC = 'Cinco Cláusulas';

export const WARLOCK_I: QuestDef[] = [
  { id: 'bx1', chain: CC, name: 'O Primeiro Pacto', lvl: 20, giver: MG, turnin: MG, req: 'v_bru', next: 'bx2', xp: 0, gold: 200, items: [['antidote', 3]],
    text: 'Malgrath oferece o primeiro pacto: vinte cláusulas, letra miúda, tinta que ainda não secou. Antes de assinar, ele manda você mostrar o contrato à Ravena Cinco-Cláusulas, que mora na tenda ao lado e não assina nada que não caiba numa mão.',
    objs: [{ kind: 'talk', npc: RV }],
    talk: [
      'O bruxo não tem magia própria. Pega emprestado. Eu empresto. E cobro juros: é o que separa um patrono de um ladrão. O ladrão não avisa.',
      'Aqui está o seu primeiro pacto. Vinte cláusulas. Leia. Ninguém lê. Por isso eu sempre ganho.',
      { r: [
        { t: 'Vinte cláusulas para um aprendiz?', a: 'Dezenove são para mim. Uma é para você. Encontre a sua e você terá aprendido a primeira lição do Vale.' },
        { t: 'E se eu não assinar?', a: 'Então você volta para a estrada com o que tem: nada. A Vidente não manda ninguém aqui por engano. Manda quem já assinou alguma coisa sem ler.' },
        { t: 'O que é isso no rodapé?', a: 'A sexta runa. Está no rodapé de todo pacto meu. Eu a ponho porque o meu mestre punha. Ele punha porque o mestre dele punha. Não pergunte quem pôs a primeira. Eu já perguntei. O silêncio cobrou juros.' } ] },
      'Mostre à Ravena antes de assinar. Ela vai cortar. Ela sempre corta. Eu finjo que me ofendo. É um acordo antigo nosso.',
    ],
    meet: { [RV]: [
      { who: RV, t: 'Vinte. Ele deu vinte para você. Que carinho. Para mim deu trinta e dois.' },
      { who: RV, t: '(Ela pega uma pena e risca. Risca. Risca. Quinze cláusulas somem em menos de um minuto.)' },
      { who: RV, t: 'Pronto. Cinco. Poder, preço, prazo, saída, e a que ele chama de “cortesia”, que é onde ele esconde o juro. Deixei essa porque sem ela ele não assina. O resto era vaidade.' },
      { who: RV, t: 'Leve de volta. Ele vai fazer cara de ofendido. É teatro. Ele gosta de quem corta.' },
    ] },
    choice: { q: 'Com o pacto de cinco cláusulas na mão, diante de Malgrath, você…', opts: [
      { label: 'Assina as cinco da Ravena, depois de ler cada uma em voz alta.', karma: 3, flag: 'bru_cinco', say: 'Malgrath sorriu como quem perdeu de propósito. “Cinco. Lidas. Que desperdício de juros.” A Ravena, na porta, bateu palma uma vez.', why: 'Você leu antes de assinar. No Vale, isso é quase virtude.' },
      { label: 'Assina as vinte originais, para mostrar respeito ao patrono.', karma: -2, flag: 'bru_vinte', say: 'Malgrath guardou o contrato numa gaveta funda. “Respeito. Que bonito. Vai sair caro.” A Ravena não falou com você por três dias.', why: 'Você assinou o que não leu para agradar a quem cobra.' },
      { label: 'Assina as cinco e devolve as vinte com um erro de cálculo marcado.', karma: 1, flag: 'bru_corrigiu', say: 'Malgrath olhou o erro por muito tempo. “A cláusula doze cobrava duas vezes. Ninguém viu em trezentos anos.” Ele riu. Ninguém nunca viu Malgrath rir.', why: 'Você leu o que ninguém lia. O patrono anotou o seu nome numa lista que não é a de devedores.' } ] },
    done: [
      'O primeiro pacto está feito. A partir de hoje, cada feitiço seu tem preço, e o preço vem do seu lado da mesa. Nunca do lado dos outros. Essa é a única regra que eu mesmo não negocio.',
    ] },

  { id: 'bx2', chain: CC, name: 'Letra Miúda', lvl: 21, giver: RV, turnin: RV, next: 'bx3', xp: 0, gold: 220,
    text: 'No Vale andam os Pactos Rompidos: gente que assinou sem ler e agora é só a dívida, de pé. Eles atacam qualquer um que cheire a tinta. A Ravena quer que você veja o que acontece com quem não lê. Derrube seis.',
    objs: [{ kind: 'kill', type: 'pactbroken', n: 6 }],
    talk: [
      'Lição dois. Lá fora, no lamaçal, andam uns que assinaram sem ler. O Malgrath não cobrou deles: o próprio pacto cobrou. Sobrou isso: um corpo segurando uma dívida.',
      'Não sinta pena. Sinta raiva. Pena não ensina; raiva lê o contrato inteiro da próxima vez.',
      { r: [
        { t: 'Eles eram bruxos?', a: 'Eram gente. Fazendeiro, mercador, um poeta que queria rimar melhor. O pacto não escolhe profissão. Escolhe pressa.' },
        { t: 'Isso pode acontecer comigo?', a: 'Com cinco cláusulas? Não. Com vinte? Já teria acontecido. Por isso eu corto.' },
        { t: 'Por que você só assina cinco?', a: 'Porque cabe numa mão. Se não cabe numa mão, é para esconder alguma coisa. Até hoje a regra não falhou.' } ] },
    ],
    done: [
      'Seis. Um deles ainda segurava a pena. Morreu sem soltar. É assim que o Vale lembra quem você foi: pelo que você não largou.',
      { r: [
        { t: 'Quem fez o pacto deles?', a: 'Não foi o Malgrath. A letra é outra. Mais bonita. Os velhos dizem que é a podridão escrevendo, que Zerath imita a letra dos patronos. Eu digo que alguém escreve bonito demais para ser lama.' },
        { t: 'Eu li tudo, desta vez.', a: 'Leu o quê? Eles não tinham contrato na mão. Ah. Você leu a lição. Boa.' } ] },
    ] },

  { id: 'bx3', chain: CC, name: 'A Oferenda', lvl: 22, giver: RV, turnin: MG, next: 'bx4', xp: 0, gold: 240,
    text: 'O pacto de verdade pede uma oferenda: um Coração de Demônio, que só os caçadores do Clã Helsing arrancam, e um Chifre de Sangue, que só os guerreiros do Norte enchem. Compre dos inimigos. Pague o preço deles. Entregue a Malgrath.',
    objs: [{ kind: 'collect', item: 'coracao_demonio', n: 1 }, { kind: 'collect', item: 'chifre_sangue', n: 1 }],
    talk: [
      'Oferenda. O Malgrath não quer sangue seu: quer prova de que você sabe fazer negócio com quem odeia você.',
      'O Coração de Demônio vende no Arsenal do Bastião de Prata, em Sudrholt. Os caçadores arrancam e vendem para nós, e depois caçam a gente. O Chifre de Sangue vende no Salão do Hidromel, em Jarlsheim. Os nórdicos acham a gente covarde e cobram dobrado.',
      { r: [
        { t: 'Os caçadores vendem para os bruxos?', a: 'Vendem. Não espalhe. Eles têm uma regra: “não conte que a gente vende para o Vale”. É a regra mais cumprida do Bastião. Igual à da Torre.' },
        { t: 'E se me reconhecerem?', a: 'Vão. Bruxo cheira a tinta e a fumaça. Pague sem pechinchar. Pechinchar com inimigo é dar a ele uma conversa. Ele não merece.' } ] },
    ],
    done: [
      'Um coração que ainda pulsa e um chifre que ainda está morno. Comprado de quem mataria você amanhã. Isto é o Vale inteiro numa mesa.',
      { r: [
        { t: 'O caçador me olhou como se fosse me matar.', a: 'E vendeu mesmo assim. Repare: ele também tem contrato. Só não escreve.' },
        { t: 'O que se faz com a oferenda?', a: 'Eu guardo. Um dia você vai precisar de um favor grande, e eu vou lembrar que você soube comprar de quem odeia. Não esqueço quem sabe fazer negócio.' } ] },
    ] },

  { id: 'bx4', chain: CC, name: 'A Sombra Própria', lvl: 23, giver: MG, turnin: MG, next: 'bx5', xp: 0, gold: 260, gear: 1,
    text: 'Há um culto no Vale que paga os pactos com a sombra dos outros: amarram aldeões e oferecem o escuro deles no lugar do próprio. Malgrath odeia isso mais do que odeia paladinos. Derrube oito cultistas.',
    objs: [{ kind: 'kill', type: 'cultist', n: 8 }],
    talk: [
      'O bruxo paga com a própria sombra. É por isso que os velhos do Vale andam curvados: carregam menos escuro do que nasceram. Isso é honesto.',
      'Os cultistas descobriram um atalho: pagam com a sombra dos outros. Amarram um lenhador, oferecem o escuro dele, e saem ricos de poder e leves de culpa. Eu não vendo para eles. Eles roubam o meu balcão.',
      { r: [
        { t: 'O senhor vai deixar o seu aprendiz resolver?', a: 'Vou. Patrono que resolve tudo não tem aprendiz: tem plateia.' },
        { t: 'A Ordem da Aurora diria que todo bruxo é igual a eles.', a: 'A Ordem diz muitas coisas. Uma delas está certa: alguns bruxos são piores que os demônios. A Ordem só erra quando acha que somos todos.' } ] },
    ],
    choice: { q: 'No altar do culto, um aldeão amarrado. O último cultista oferece metade do poder roubado em troca da vida. Você…', opts: [
      { label: 'Solta o aldeão e manda o cultista ao julgamento de Malgrath.', karma: 4, flag: 'bru_soltou', say: 'Malgrath julgou o cultista. A sentença foi um contrato de cinco cláusulas, todas a favor do aldeão. A Ravena redigiu.', why: 'Você devolveu a sombra a quem ela pertencia e deixou o preço com quem quis fugir dele.' },
      { label: 'Acaba com o cultista e solta o aldeão.', karma: 1, flag: 'bru_matou_culto', say: 'Rápido. O aldeão correu sem olhar para trás. Malgrath disse: “Eu teria cobrado mais. Mas você tem pressa. Ainda.”', why: 'Justo, mas sem contrato. No Vale, até a justiça deveria ter recibo.' },
      { label: 'Aceita a metade do poder.', karma: -6, flag: 'bru_sombra_alheia', say: 'O poder entrou. Pesou pouco. Isso é o que assusta: pesou pouco. A Ravena rasgou o pacto que tinha feito com você e jogou no fogo.', why: 'Você pagou com a sombra de outro. É a única regra que Malgrath não negocia.' } ] },
    done: [
      'O culto acabou. O Vale ficou um pouco mais escuro hoje: cada um com o seu próprio escuro, como deve ser.',
    ] },

  { id: 'bx5', chain: CC, name: 'Cinzas dos Mortos', lvl: 24, giver: GR, turnin: GR, next: 'bx6', xp: 0, gold: 280,
    text: 'A Bruxa Grisolda faz as Cinzas dos Mortos e os magos do Pináculo compram, envergonhados. Leve a encomenda até a Arquimaga Seline, em Lumenhal, e receba o pagamento. Não faça a reverência. Eles detestam quando bruxo faz reverência.',
    objs: [{ kind: 'visit', poi: 'Pináculo de Marfim' }, { kind: 'talk', npc: SE }],
    talk: [
      'As penas de marfim encomendaram cinzas de novo. Eles compram de mim e rezam contra mim. Eu vendo para eles e rio deles. É o casamento mais estável de Karmika.',
      'Leve até a Seline. Ela vai contar as moedas duas vezes e olhar para a porta, para ver se ninguém viu. Deixe ela contar. Saia sem pressa. Pressa parece culpa.',
      { r: [
        { t: 'Por que os magos precisam das nossas cinzas?', a: 'Porque cinza de morto acalma livro. Os deles são muito agitados. Eles leem demais e dormem de menos.' },
        { t: 'Isso não é ajudar o inimigo?', a: 'É vender ao inimigo. A diferença é o dinheiro no bolso. Vá, pena de corvo.' } ] },
    ],
    meet: { [SE]: [
      { who: SE, t: 'Um bruxo. No Pináculo. Feche a porta. Não, abra. Fechada parece pior.' },
      { who: SE, t: '(Ela conta as moedas. Conta de novo. Olha para a porta.)' },
      { who: SE, t: 'Diga à Grisolda que as cinzas da última vez fizeram um aprendiz dormir dois dias. Diga que foi ótimo. Não diga que eu disse ótimo.' },
    ] },
    done: [
      'Ela contou duas vezes? Contou. Olhou para a porta? Olhou. Pagou o preço inteiro? Pagou. Os magos são o povo mais previsível do mundo. É por isso que gosto deles.',
    ] },

  { id: 'bx6', chain: CC, name: 'Pó do Sono Para o Caçador', lvl: 26, giver: RV, turnin: RV, next: 'bx7', xp: 0, gold: 300,
    text: 'O Bastião de Prata encomendou Pó do Sono Sem Sonhos para um órfão que não dorme. A Ravena manda você entregar pessoalmente ao Caçador Viktor Helsing, no arsenal de Sudrholt. Vender a quem te caça é a lição mais difícil do Vale.',
    objs: [{ kind: 'visit', poi: 'Sudrholt' }, { kind: 'talk', npc: VK }],
    talk: [
      'Encomenda do Bastião. Os caçadores querem pó do sono para uma criança. Para uma criança, entendeu? Eles caçam a gente e compram da gente para fazer criança dormir.',
      'Você vai entrar em Sudrholt, debaixo dos muros do Bastião, com um saco de pó de bruxo. Vai entregar ao Viktor. Vai receber. Vai sair andando. Não correndo. Andando.',
      { r: [
        { t: 'Eles vão me matar lá dentro.', a: 'Não. Eles têm uma criança que não dorme. Gente com criança que não dorme não mata o vendedor do sono. Isso também é contrato.' },
        { t: 'Por que você não vai?', a: 'Porque a última vez a caçadora de lá me chamou de menina. Eu tenho vinte e seis anos e cinco cláusulas. Fui embora sem entregar. Hoje vai você.' } ] },
    ],
    meet: { [VK]: [
      { who: VK, t: 'Bruxo no Bastião. A prata na parede está zumbindo. Ela não gosta de você. Eu também não.' },
      { who: VK, t: '(Ele pega o saco, cheira, pesa na mão.)' },
      { who: VK, t: 'É para o Pip. Ele não dorme desde a estrada. Diga à sua patroa que o pagamento está certo. E diga que, se o menino tiver um pesadelo, eu vou até o Vale buscar o troco.' },
    ] },
    done: [
      'Saiu andando? Ótimo. Eles vão dizer no Bastião que um bruxo entrou e saiu sem tremer. Isso vale mais que o pagamento. Vale reputação. Reputação é juro que o mundo paga sozinho.',
      { r: [
        { t: 'Ele ameaçou buscar o troco.', a: 'Todo cliente ameaça. Os honestos ameaçam na cara. Os outros mandam o Cobrador. Falando nele…' } ] },
    ] },

  { id: 'bx7', chain: CC, name: 'O Cobrador', lvl: 27, giver: MG, turnin: MG, next: 'bx8', xp: 0, gold: 320,
    text: 'Alguém anda cobrando dívidas em nome de Malgrath, e Malgrath não mandou ninguém. Ligue o Instinto (F) e siga o rastro do Cobrador pelo Vale. Descubra o que ele leva das casas.',
    objs: [{ kind: 'sense', what: 'rastro', label: 'O rastro do falso Cobrador, pelo Vale', at: 'Gorvath', dx: 14, dy: 10, from: 'Gorvath' }, { kind: 'kill', type: 'succubus', n: 4 }],
    talk: [
      'Três famílias do Vale pagaram dívida esta semana. Ao Cobrador. Eu não tenho Cobrador. Quem cobra em meu nome rouba duas vezes: a família e a minha palavra.',
      'Siga o rastro. Ele anda com súcubos para assustar quem não paga. Elas são caras. Quem paga súcubo tem dinheiro de outro lugar.',
      { r: [
        { t: 'O senhor tem inimigos?', a: 'Tenho clientes insatisfeitos. É a mesma coisa com contrato.' },
        { t: 'E se for alguém da Ravena?', a: 'A Ravena cobraria com cinco cláusulas e recibo. Esse aí não deixa recibo. É o que mais me ofende.' } ] },
    ],
    done: [
      'Súcubos mortas e o rastro some no lamaçal, perto do Atoleiro. Ele não levava ouro das casas. Levava os contratos. Os papéis assinados.',
      { r: [
        { t: 'Para que alguém quer contratos alheios?', a: 'Para reescrever. Um contrato na mão de outro vira outro contrato. Eu passei a vida escrevendo. Agora tenho medo de quem lê.' },
        { t: 'É a podridão? Zerath?', a: 'É o que o Vale vai dizer. “O Senhor do Pântano levou os papéis.” Fica bonito. Eu vou dizer também. E vou trancar a minha gaveta.' } ] },
    ] },

  { id: 'bx8', chain: CC, name: 'A Dívida de Gorvath', lvl: 28, giver: RV, turnin: RV, next: 'bx9', xp: 0, gold: 340, gear: 1,
    text: 'Uma família de Gorvath tem uma dívida antiga, de antes da Ravena nascer: o filho mais novo, prometido ao pacto pelo avô. O prazo vence amanhã. As cobras do lamaçal cercam a casa desde ontem. Limpe o caminho e decida, com a Ravena, o que fazer com o contrato.',
    objs: [{ kind: 'kill', type: 'swampsnake', n: 6 }],
    talk: [
      'Um contrato velho. Trinta e quatro cláusulas. A décima nona diz que o neto mais novo pertence ao pacto quando fizer doze anos. Ele fez doze ontem.',
      'Não foi o Malgrath. Foi o patrono antes dele. O Malgrath herdou a dívida como se herda uma casa com goteira.',
      { r: [
        { t: 'Contratos assim se cumprem?', a: 'Se ninguém fizer nada, se cumprem sozinhos. O papel não precisa de ajuda. Precisa de alguém que leia a cláusula trinta e quatro.' },
        { t: 'O que diz a trinta e quatro?', a: 'Ninguém leu. Por isso estou aqui. Limpe as cobras e eu leio com você.' } ] },
    ],
    choice: { q: 'A cláusula trinta e quatro diz: “a dívida pode ser paga por quem a ler inteira em voz alta, com a própria sombra”. Você…', opts: [
      { label: 'Lê o contrato inteiro em voz alta e paga com a sua sombra.', karma: 5, flag: 'bru_pagou_menino', say: 'Você leu trinta e quatro cláusulas em voz alta. Ao fim, sua sombra ficou mais curta um palmo. O menino dormiu em casa. A Ravena não disse nada. Depois disse: “Idiota.” Com carinho.', why: 'Você pagou com o seu escuro a dívida de uma criança que não assinou nada.' },
      { label: 'Encontra uma brecha na cláusula vinte e anula o contrato.', karma: 2, flag: 'bru_brecha', say: 'A cláusula vinte tinha uma vírgula no lugar errado. O contrato caiu. A família chorou. O Malgrath, ao saber, disse: “Eu escrevi essa vírgula. Sabia que um dia alguém acharia.”', why: 'Leitura de bruxo: ninguém pagou, ninguém perdeu. Só o papel.' },
      { label: 'Deixa o contrato se cumprir. Negócio é negócio.', karma: -6, flag: 'bru_deixou_menino', say: 'Amanheceu e o menino não estava mais na cama. A Ravena rasgou o seu nome da lista dela. A família nunca mais abriu a porta para um bruxo.', why: 'Você chamou de negócio o que era preguiça de ler.' } ] },
    done: [
      'Contratos velhos são como cobra de pântano: dormem anos e mordem no dia certo. Agora você sabe por que eu corto.',
    ] },

  { id: 'bx9', chain: CC, name: 'Pouco Comprometidos', lvl: 30, giver: RV, turnin: RV, next: 'bx10', xp: 0, gold: 360,
    text: 'A Ravena precisa conhecer de perto os dois clientes mais difíceis dos Desfiados: a Casa do Conde, em Corvoscuro, e a matilha do Uivo Antigo. Leve a ela o que viu nos dois lugares. Um dia alguém vai ter que escrever um contrato entre eles, e vai ser ela.',
    objs: [{ kind: 'visit', poi: 'Corvoscuro' }, { kind: 'visit', poi: 'Uivo Antigo' }],
    talk: [
      'Vampiro e lobisomem. Os dois maiores clientes da sombra. E as duas maiores crianças de Karmika. Brigam há séculos pelo mesmo pedaço de noite e nunca assinaram nada.',
      'Vá a Corvoscuro e ao Uivo Antigo. Olhe como eles vivem. Quem manda, quem obedece, o que cada um quer e nunca diz. Eu quero o rascunho de um contrato que nenhum dos dois vai querer assinar.',
      { r: [
        { t: 'Por que um contrato entre eles?', a: 'Porque um dia vão precisar de trégua. Vai durar uma lua. Vão quebrar. E eu vou cobrar dos dois. Contrato quebrado também é renda.' },
        { t: 'Você acha os dois crianças?', a: 'O vampiro faz birra educada. O lobo faz birra com os dentes. Os dois querem a mesma coisa: que o outro peça desculpas primeiro. Ninguém vai pedir.' } ] },
    ],
    done: [
      'Conte. O Conde serviu vinho e não perguntou o seu nome? Típico. Os lobos rosnaram e depois dividiram a carne? Típico também. Pouco comprometidos. Os dois.',
      { r: [
        { t: 'Os dois querem salvar Karmika, do jeito deles.', a: 'Todo mundo quer salvar Karmika. Em Askavik já tem duas bandeiras inteiras querendo. A pergunta de contrato é sempre a mesma: quem paga?' },
        { t: 'Você vai escrever a trégua?', a: 'Já escrevi. Cinco cláusulas. A quinta diz que quem quebrar paga a mim. Eles vão quebrar. Eu vou cobrar. É o único jeito de os dois concordarem em alguma coisa.' } ] },
    ] },

  { id: 'bx10', chain: CC, name: 'O Juramento de Malgrath', lvl: 31, giver: MG, turnin: MG, title: 'Cinco Cláusulas', xp: 0, gold: 420, gear: 1, items: [['antidote', 4]],
    text: 'O bruxo jura lendo em voz alta o contrato inteiro do Vale, o mais velho, diante de Malgrath. Antes, os cães do inferno que guardam o arquivo precisam estar quietos: derrube cinco. Depois, leia com a Ravena ao seu lado.',
    objs: [{ kind: 'kill', type: 'hellhound', n: 5 }, { kind: 'talk', npc: RV }],
    talk: [
      'Você cortou um pacto, comprou do inimigo, pagou com a própria sombra, vendeu sono a quem caça você e leu uma cláusula que ninguém lia. É o suficiente para jurar.',
      'O juramento do Vale não é uma frase: é a leitura do contrato mais velho, em voz alta, inteiro. Trezentas linhas. Ninguém chega ao fim. A Ravena chegou. Ela vai ler com você.',
      { r: [
        { t: 'O que acontece se eu errar uma linha?', a: 'Nada. O contrato não pune erro. Pune pressa. Leia devagar.' },
        { t: 'E o Cobrador?', a: 'Sumiu. Os contratos que ele levou também. Um dia eles vão voltar reescritos. Quando voltarem, quero ter um bruxo que lê. Por isso o juramento.' },
        { t: 'O que diz a última linha?', a: 'Eu não sei. Eu nunca cheguei. A Ravena chegou e não me conta. É a única dívida que eu tenho com ela.' } ] },
    ],
    meet: { [RV]: [
      { who: RV, t: 'Trezentas linhas. Eu leio as pares, você lê as ímpares. Se você pular uma, eu volto do começo. Já fiz isso com o Malgrath. Ele chorou.' },
      { me: '(Vocês leem. A tinta é velha. Na linha cento e doze, a letra muda: fica bonita demais. Na última linha, só a sexta runa, sozinha.)' },
      { who: RV, t: 'Viu? A última linha não é uma linha. É a runa. Não conte ao Malgrath. Ele acha que tem uma frase lá. Ele precisa achar isso para dormir.' },
      { who: RV, t: 'E a linha cento e doze, a da letra bonita… anote. Eu anotei. Um dia a gente compara com a letra do Cobrador.' },
    ] },
    done: [
      'A Ravena disse que você não pulou nenhuma linha. Ela nunca diz isso. Talvez esteja doente. Talvez você seja bom. As duas coisas são preocupantes.',
      'Você é bruxo do Vale. A partir de hoje, cada pacto seu tem cinco cláusulas e um rodapé com a sexta runa. Em Askavik já se fala de bandeiras: o Fio e os Desfiados. Os dois querem salvar Karmika. Os dois vão querer contratar você. Cobre caro dos dois.',
      { r: [
        { t: 'O que diz a última linha, Malgrath?', a: 'Uma frase muito bonita. A Ravena sabe. Eu prefiro não saber. É o luxo de quem já leu demais.' },
        { t: 'E a letra bonita da linha cento e doze?', a: 'Podridão. Zerath imitando a letra dos antigos. É o que eu digo. Repare que eu digo isso trancando a gaveta.' } ] },
    ] },
];

/** a Portadora junto de Malgrath, em Gorvath */
export const WARLOCK_I_NPCS = [
  { vila: 'Gorvath', name: RV, role: 'Portadora do Vale · Cinco Cláusulas', dx: 4, dy: -16.5, tint: 0x4a2a5a, lines: ['Cinco cláusulas. O resto é vaidade.', 'Se não cabe numa mão, é para esconder alguma coisa.', 'Vampiro e lobo são duas crianças brigando pelo mesmo pedaço de noite.'] },
];
