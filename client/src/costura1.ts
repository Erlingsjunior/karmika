/* ---------- A COSTURA DO CAPÍTULO I (09/11, Erling: "faça as missões, vamos zerar o Capítulo I de todos").
   As cinco classes que já tinham Capítulo I (Guerreiro, Lobisomem, Vampiro, Tecnocrata) e o Bruxo ganham aqui o que faltava pela lore nova,
   sem mexer no que já existia (regra 20): cada uma é uma cadeia lateral do mesmo capítulo (níveis 22–31), aberta depois da 2ª/3ª missão da saga.
   - Guerreiro · "A Irmã do Desertor" (gb1–gb5): Brynhild Lâmina-Quieta, irmã do Halfdan, pelas vilas do gelo que obedecem ao Jarl.
   - Lobisomem · "Dente-Partido" (vg1–vg5): Varg leva o filhote de ninhada em ninhada.
   - Vampiro · "Os Lugares Que Não Existem" (vn1–vn6): tudo na casa do Conde; os três esconderijos secretos; o ataque a uma vila; contar é trair.
   - Tecnocrata · "A Oficina na Estrada" (tv1–tv6): o Doutor Anselm manda ajudar as vilas — purificar, proteger, consertar, construir — e negociar com os dois lados.
   - Bruxo · "Os Que Rezam ao Contrário" (bw1–bw5): da torre do Vale para as igrejas abandonadas e os cemitérios; nunca as vilas.
   Disciplina do mistério (Regras de Ouro): a pista do Capítulo I é a RUNA — em cada cadeia ela aparece uma vez, sem resposta; toda podridão é
   culpa de Zerath; ninguém reconcilia ninguém. Humor ao lado do solene: Vasko, Varg, Ravena e a Brynhild que não ri de nada. ---------- */
import type { QuestDef } from './quests';

const TG = 'Thorgrim Mão-de-Ferro', BY = 'Brynhild Lâmina-Quieta', JARL = 'Jarl Sigurd de Jarlsheim';
const VG = 'Varg Dente-Partido', UL = 'Ulfrun, a Mãe-Alfa';
const MI = 'Lady Mirela', VA = 'Sommelier Vasko', IN = 'Ilse Noctavar', VL = 'Conde Vladislav III';
const AN = 'Doutor Anselm Rotha', YL = 'Arquiteta Ylva', KA = 'Mestre-Forjador Kári';
const MG = 'Malgrath, Senhor dos Pactos', RV = 'Ravena Cinco-Cláusulas';

/* ======================= GUERREIRO — A Irmã do Desertor ======================= */
const GC = 'A Irmã do Desertor';
const WARRIOR_SIS: QuestDef[] = [
  { id: 'gb1', chain: GC, name: 'Lâmina-Quieta', lvl: 22, giver: TG, turnin: BY, req: 'w03', next: 'gb2', xp: 0, gold: 240,
    text: 'Depois de Fjallbrún, uma guerreira pediu para falar com você na Fortaleza de Odin. Chama-se Brynhild. Dizem que nunca riu na vida.',
    objs: [{ kind: 'talk', npc: BY }],
    talk: ['Tem uma guerreira esperando por você no pátio. Brynhild Lâmina-Quieta. A melhor espada do clã depois da minha. Talvez antes.', 'Ela é irmã do Halfdan. Não me pergunte o que eu acho disso. Vá ouvir o que ela acha.'],
    meet: { [BY]: [
      { who: BY, t: 'Você foi a Fjallbrún. Viu o meu irmão.' },
      { who: BY, t: 'Não me diga o que fez com ele. Se eu souber, vou ter que fazer alguma coisa. E eu não quero fazer nada hoje.' },
      { who: BY, t: 'Quero outra coisa. O Halfdan carregava um escudo da nossa mãe. Ele não está com ele, nem vivo nem morto. Alguém ficou com o escudo.' } ] },
    done: ['O escudo da minha mãe tem a borda pintada de corvo. Se você vir, vai saber.', { r: [
      { t: 'Por que o escudo importa tanto?', a: 'Porque é a última coisa da nossa casa que ainda não foi vendida, perdida ou desonrada. É o que sobra.' },
      { t: 'Você está triste?', a: 'Estou com frio. É diferente. No norte, a gente confunde os dois de propósito.' } ] }] },

  { id: 'gb2', chain: GC, name: 'Os Corvos de Corvanes', lvl: 24, giver: BY, turnin: 'Chefe Ragnhild Asa-Negra', next: 'gb3', xp: 0, gold: 280,
    text: 'Em Corvanes, a vila dos corvos do Jarl, alguém trocou um escudo pintado por pão. Lobos gélidos rondam a cerca. Vá, derrube seis, e pergunte à Chefe Ragnhild.',
    objs: [{ kind: 'visit', poi: 'Corvanes' }, { kind: 'kill', type: 'frostwolf', n: 6 }],
    talk: ['Corvanes alimenta os corvos do Jarl. Os corvos sabem tudo o que acontece no gelo. A Ragnhild sabe tudo o que os corvos sabem.', 'Leve os lobos como presente. No norte, ninguém responde de mãos vazias.'],
    done: ['Um escudo pintado de corvo? Passou por aqui, sim. Um homem magro trocou por três pães e uma corda. Não disse o nome. Não precisava: tinha a cara da Brynhild, só que com medo.', 'Ele foi para o lado de Snæbú. Lá enterram os que morrem sem nome.'],
    choice: { q: 'A Chefe Ragnhild tem o pão que o homem deixou de comer, guardado “caso ele volte”. Você…', opts: [
      { label: 'Deixa o pão onde está. Ele pode voltar.', karma: 2, flag: 'gb_pao', say: 'A Ragnhild cobriu o pão com um pano. “No gelo, a gente espera os que fogem. Às vezes eles voltam.”', why: 'Você deixou uma porta aberta para quem fugiu.' },
      { label: 'Leva o pão para a Brynhild, como prova.', karma: 0, flag: 'gb_prova', say: 'A Brynhild segurou o pão duro muito tempo. Não comeu. Não jogou fora.', why: 'Prova é prova. Pesa pouco, mas pesa.' } ] } },

  { id: 'gb3', chain: GC, name: 'Snæbú, Onde Enterram Sem Nome', lvl: 26, giver: 'Chefe Ragnhild Asa-Negra', turnin: 'Chefe Thordís Meio-Enterrada', next: 'gb4', xp: 0, gold: 300, gear: 1,
    text: 'Em Snæbú, as covas dos sem-nome se abriram e os berserkers draugr andam pela neve. Derrube cinco e procure, com o Faro, o escudo pintado debaixo da neve do cemitério.',
    objs: [{ kind: 'visit', poi: 'Snæbú' }, { kind: 'kill', type: 'draugr_bers', n: 5 }, { kind: 'sense', what: 'rastro', label: 'O escudo pintado de corvo debaixo da neve', at: 'Snæbú', dx: 9, dy: 6 }],
    talk: ['Snæbú enterra quem morre sem nome. Desde o inverno passado, os sem-nome não ficam enterrados.', 'Os velhos dizem que é o Atoleiro, lá no sul. Zerath apodrece até o que está congelado.'],
    done: ['O escudo. Pintado de corvo, rachado no meio, e com uma runa riscada por dentro, onde ninguém vê quando segura.', 'A Brynhild vai querer saber da runa. Eu não sei o que é. Ninguém aqui sabe. Estava no escudo da mãe dela também? Pergunte a ela.'] },

  { id: 'gb4', chain: GC, name: 'A Runa por Dentro do Escudo', lvl: 28, giver: 'Chefe Thordís Meio-Enterrada', turnin: BY, next: 'gb5', xp: 0, gold: 340,
    text: 'Leve o escudo de volta à Brynhild, em Jarlsheim. No caminho, o Skald Bragi de Kaldheim quer cantar a história; ouça o que ele sabe da runa.',
    objs: [{ kind: 'talk', npc: 'Skald-Mor Bragi Voz-de-Vento' }],
    talk: ['Leve o escudo. E passe em Kaldheim: o Bragi canta tudo que acontece no gelo, até o que ninguém contou a ele.'],
    meet: { 'Skald-Mor Bragi Voz-de-Vento': [
      { who: 'Skald-Mor Bragi Voz-de-Vento', t: 'Uma runa por dentro de um escudo? Meu avô cantava de uma assim. Ninguém sabia quem riscava. Os escudos já vinham com ela.' },
      { who: 'Skald-Mor Bragi Voz-de-Vento', t: 'Ele dizia que era a sexta. Eu perguntei: sexta de quê? Ele ficou bravo. Até hoje não sei se ele não sabia ou não queria dizer.' } ] },
    done: [
      '(A Brynhild pega o escudo com as duas mãos. Passa o dedo na runa por dentro, devagar.)',
      'A nossa mãe dizia que essa runa protege a mão que segura. Eu achava que era história de mãe.',
      { r: [
        { t: 'O Bragi diz que é a sexta runa.', a: 'Sexta de quê? Não. Não me responda. Já tenho perguntas demais para um inverno.' },
        { t: 'Seu irmão trocou isto por pão.', a: 'Então ele estava com fome. A fome não tem honra. A gente tem. Às vezes, só às vezes, a gente divide.' } ] }] },

  { id: 'gb5', chain: GC, name: 'O Tributo do Escudo', lvl: 30, giver: BY, turnin: JARL, xp: 0, gold: 420, gear: 1, title: 'Lâmina do Gelo',
    text: 'A Brynhild vai devolver o escudo da mãe ao salão do Jarl, onde ficam as armas das casas desonradas. Antes, Ulfsbrekka pede ajuda com os lobos gélidos na cerca. Depois, leve a palavra dela ao Jarl Sigurd.',
    objs: [{ kind: 'visit', poi: 'Ulfsbrekka' }, { kind: 'kill', type: 'frostwolf', n: 6 }, { kind: 'talk', npc: JARL }],
    talk: ['Uma casa desonrada pendura o escudo no salão do Jarl até alguém da família pagar a dívida. Eu vou pagar. Não com ouro.', 'Ajude Ulfsbrekka primeiro. Eu prometi a eles. Promessa de Lâmina-Quieta não espera.'],
    meet: { [JARL]: [{ who: JARL, t: 'O escudo da casa de Halfdan. A irmã quer pendurá-lo aqui e jurar por ele.' }, { who: JARL, t: 'Fale por ela, já que ela não fala comigo desde que o irmão fugiu. Mulher teimosa. Gosto dela.' }] },
    choice: { q: 'Diante do Jarl, você fala pela Brynhild e…', opts: [
      { label: 'Pede que o escudo fique pendurado até o Halfdan voltar e pagar ele mesmo.', karma: 3, flag: 'gb_espera', say: 'O Jarl bateu na mesa. “Até ele voltar. Que seja.” A Brynhild, na porta, baixou a cabeça. Não chorou. No norte, a gente confunde frio com outras coisas.', why: 'Você deu ao desertor a chance de pagar a própria dívida.' },
      { label: 'Pede que a dívida passe para a Brynhild, para acabar logo.', karma: 1, flag: 'gb_irma', say: 'A Brynhild jurou com a mão na runa. A dívida agora é dela. Ela parece mais leve. Não sei se é bom.', why: 'Você aliviou uma casa e pôs o peso numa pessoa só.' },
      { label: 'Pede que o escudo seja queimado: casa sem honra não tem escudo.', karma: -3, flag: 'gb_queima', say: 'O Jarl queimou. A Brynhild ficou olhando o fogo até a runa sumir. Depois foi embora sem falar com ninguém.', why: 'A lei foi seca, e a família perdeu a última coisa que tinha.' } ] },
    done: ['O norte lembra quem fala pelos outros. Leve isto, e o nome que o salão vai usar para você.'] },
];

/* ======================= LOBISOMEM — Dente-Partido ======================= */
const LC = 'Dente-Partido';
const WOLF_VARG: QuestDef[] = [
  { id: 'vg1', chain: LC, name: 'O Segundo da Mãe', lvl: 22, giver: UL, turnin: VG, req: 'la2', next: 'vg2', xp: 0, gold: 240,
    text: 'A Mãe-Alfa manda você andar com Varg Dente-Partido, o segundo dela. Ele leva os novos de ninhada em ninhada. “Para todas saberem o seu cheiro.”',
    objs: [{ kind: 'talk', npc: VG }],
    talk: ['O Varg vai levar você pelas ninhadas. Sete delas me são fiéis. Todas precisam conhecer o seu cheiro antes da primeira lua cheia.', 'Ele vai reclamar o caminho inteiro. Ignore. É assim que ele gosta das pessoas.'],
    meet: { [VG]: [
      { who: VG, t: 'Você é o novo? Magro. Cheira a sabão. A Mãe sempre me manda os magros.' },
      { who: VG, t: 'Ninguém fica para trás. Essa é a única regra que importa. As outras a gente inventa conforme a fome.' } ] },
    done: ['Primeiro a do Rio Torto. A Bragha faz o melhor ensopado da selva e cobra com conversa. Muita conversa.', { r: [
      { t: 'Por que Dente-Partido?', a: 'Mordi uma armadilha de prata para soltar um filhote. A prata quebrou o dente. O filhote está vivo. Troca justa.', luz: 1 },
      { t: 'E se eu ficar para trás?', a: 'Eu volto. Sempre volto. É chato, mas volto.' } ] }] },

  { id: 'vg2', chain: LC, name: 'O Banquete do Rio Torto', lvl: 23, giver: VG, turnin: 'Mãe da Ninhada Bragha', next: 'vg3', xp: 0, gold: 260,
    text: 'A Ninhada do Rio Torto só recebe quem chega com comida. Seis javalis para o banquete, e depois fale com a Mãe Bragha.',
    objs: [{ kind: 'kill', type: 'boar', n: 6 }, { kind: 'visit', poi: 'Ninhada do Rio Torto' }],
    talk: ['Seis javalis. Não cinco. A Bragha conta. Uma vez levei cinco e ela me fez ouvir a história da avó dela inteira. Três luas.'],
    done: ['Seis! Varg, você aprendeu a contar. Senta, magro. Come. Não, assim não: com as mãos. Isso.', 'Diga à Mãe-Alfa que o Rio Torto está de pé e com fome. Sempre com fome.'] },

  { id: 'vg3', chain: LC, name: 'A Pedra Rachada Discute', lvl: 25, giver: 'Mãe da Ninhada Bragha', turnin: 'Pai da Ninhada Gorm', next: 'vg4', xp: 0, gold: 290,
    text: 'Na Ninhada da Pedra Rachada, dois irmãos brigam pela mesma toca e ninguém dorme. O Pai Gorm pediu alguém de fora para decidir.',
    objs: [{ kind: 'visit', poi: 'Ninhada da Pedra Rachada' }, { kind: 'talk', npc: 'Pai da Ninhada Gorm' }],
    talk: ['O Gorm tem dois filhos e uma toca. Matemática de lobo: sempre sobra um.'],
    meet: { 'Pai da Ninhada Gorm': [{ who: 'Pai da Ninhada Gorm', t: 'Os dois são meus. Os dois têm razão. Os dois mordem. Você decide, que não é pai de ninguém aqui.' }] },
    choice: { q: 'Os dois irmãos querem a mesma toca. Você decide que…', opts: [
      { label: 'Os dois cavam juntos uma toca maior.', karma: 3, flag: 'vg_juntos', say: 'Cavaram brigando a noite inteira. De manhã, dormiam um em cima do outro. O Varg riu tanto que acordou a ninhada.', why: 'Ninguém fica para trás, nem na toca.' },
      { label: 'O mais velho fica; o mais novo vai para outra ninhada.', karma: 0, flag: 'vg_velho', say: 'O mais novo foi para o Charco Fundo. Não olhou para trás. O Gorm olhou por ele.', why: 'Regra antiga, justa e fria.' },
      { label: 'Eles lutam, e o que ganhar fica.', karma: -2, flag: 'vg_luta', say: 'O mais novo ganhou com uma orelha a menos. O mais velho foi embora sozinho. Ninguém da ninhada uivou para ele.', why: 'Você resolveu como resolveria um bicho. A matilha não é só bicho.' } ] },
    done: ['Feito. A toca está em paz, mais ou menos. A Mãe-Alfa vai gostar de saber que alguém de fora decidiu sem tremer.'] },

  { id: 'vg4', chain: LC, name: 'O Charco Que Apodrece', lvl: 27, giver: 'Pai da Ninhada Gorm', turnin: 'Mãe da Ninhada Orla', next: 'vg5', xp: 0, gold: 330, gear: 1,
    text: 'No Charco Fundo, mortos de lama saem da água e os filhotes não podem beber. Derrube cinco e fale com a Mãe Orla.',
    objs: [{ kind: 'visit', poi: 'Ninhada do Charco Fundo' }, { kind: 'kill', type: 'mudzombie', n: 5 }],
    talk: ['O charco ficou podre de um mês para cá. A Orla diz que é o Atoleiro de Zerath respirando debaixo da terra. Eu digo que a Orla exagera. Mas os mortos de lama não exageram.'],
    done: ['A água está limpa de novo, por enquanto. Zerath respira devagar. Volta.', { r: [
      { t: 'O que é Zerath, de verdade?', a: 'É o nome que a gente dá ao que apodrece. Se tem outro nome, ninguém aqui quer saber.' },
      { t: 'Os filhotes podem beber?', a: 'Já estão bebendo. Filhote não espera ninguém dizer que pode.', luz: 1 } ] }] },

  { id: 'vg5', chain: LC, name: 'A Armadilha do Osso Branco', lvl: 29, giver: 'Mãe da Ninhada Orla', turnin: UL, xp: 0, gold: 420, gear: 1, title: 'Dente de Ninhada',
    text: 'Perto da Ninhada do Osso Branco há uma armadilha de prata que pegou um filhote. Ache-a com o Faro antes que pegue outro, e conte à Mãe-Alfa o que estava gravado nela.',
    objs: [{ kind: 'visit', poi: 'Ninhada do Osso Branco' }, { kind: 'sense', what: 'cheiro', label: 'A armadilha de prata escondida no capim', at: 'Ninhada do Osso Branco', dx: -10, dy: 7 }],
    talk: ['Prata. Os caçadores de Aravel deixam isso no mato como quem planta semente. O Varg já perdeu um dente para uma. Não perca o seu.'],
    done: [
      'Uma armadilha de prata, com uma runa gravada na mola. O Varg diz que toda armadilha que ele já mordeu tinha essa runa.',
      'Os caçadores também não sabem o que ela é. Ninguém sabe. Isso é o que me assusta: todo mundo usa, e ninguém sabe.',
      { r: [
        { t: 'Os caçadores marcam as armadilhas?', a: 'Não. As armadilhas já vêm marcadas. Do mesmo jeito que as bestas já nascem marcadas por dentro do osso, dizem os do Clã.' },
        { t: 'O Varg disse que eu não fiquei para trás.', a: 'É o maior elogio que ele sabe fazer. Não espere outro.', luz: 1 } ] },
      'Sete ninhadas sabem o seu cheiro. Você é da matilha, magro ou não.'] },
];

/* ======================= VAMPIRO — Os Lugares Que Não Existem ======================= */
const VC = 'Os Lugares Que Não Existem';
const VAMPIRE_SECRETS: QuestDef[] = [
  { id: 'vn1', chain: VC, name: 'A Adega Sem Porta', lvl: 22, giver: VA, turnin: IN, req: 'va2', next: 'vn2', xp: 0, gold: 240,
    text: 'O Sommelier Vasko vai mostrar a você o primeiro lugar que não existe: uma adega no mato, longe de Corvoscuro, sem porta. Vá à noite. Ilse Noctavar guarda a entrada.',
    objs: [{ kind: 'visit', poi: 'A Adega Sem Porta' }, { kind: 'talk', npc: IN }],
    talk: [
      'A senhora Mirela pediu que eu lhe mostrasse a adega. Não a do castelo: a outra. A que não existe.',
      'A Casa não tem vilas. Vilas são para quem precisa de vizinho. A Casa tem o castelo e três lugares que não estão em mapa nenhum. Agora estarão no seu. Só no seu.',
      { r: [
        { t: 'E se eu contar a alguém?', a: 'Aí o lugar deixa de não existir, e você também. Não estou ameaçando. Estou servindo a informação como se serve um vinho: na temperatura certa.', sombra: 1 },
        { t: 'Por que esconder?', a: 'Porque os caçadores de Aravel leem mapas. E porque segredo bem guardado é a única parede que o sol não atravessa.' } ] },
      'Vá à noite. A Ilse não aparece de dia. Ninguém da Casa aparece de dia, aliás. É uma questão de etiqueta e de pele.'],
    meet: { [IN]: [
      { who: IN, t: 'Você não está perdido. Ninguém chega aqui perdido.' },
      { who: IN, t: 'Esta adega não tem porta porque porta é convite. Os da Casa entram pela terra. Os outros não entram.' },
      { who: IN, t: 'Jure que nunca vai contar. Não para mim: para você. Eu já sei que você vai cumprir. A Casa escolheu bem.' } ] },
    choice: { q: 'Diante da adega sem porta, você…', opts: [
      { label: 'Jura o silêncio com a mão na terra.', karma: 1, flag: 'vn_jura', say: 'A Ilse sorriu pela primeira vez. Os dentes eram pequenos. Os de quem não precisa mostrar.', why: 'Você guardou o segredo dos seus. Lealdade é a única virtude que a Casa não discute.' },
      { label: 'Pergunta o que mais a Casa esconde.', karma: 0, flag: 'vn_curioso', say: '“Tudo”, disse a Ilse. “E isso é uma resposta completa.”', why: 'Curiosidade é perdoada na Casa. Uma vez.' } ] },
    done: ['Agora você conhece um lugar que não existe. Os outros dois a Corte mostra quando quiser. Vá ao castelo: a senhora Mirela tem trabalho de verdade.'] },

  { id: 'vn2', chain: VC, name: 'Os Que Vendem Mapas', lvl: 23, giver: IN, turnin: MI, next: 'vn3', xp: 0, gold: 270,
    text: 'Salteadores andam vendendo, nas estradas, um mapa rabiscado com um X perto de Corvoscuro. Derrube oito antes que o mapa chegue a um caçador.',
    objs: [{ kind: 'kill', type: 'bandit', n: 8 }],
    talk: ['Alguém desenhou a adega num pedaço de couro e vende por três moedas. Três. Um insulto em dobro.', 'Recolha os mapas. Os portadores, a Casa não precisa recolher: só parar.'],
    done: [
      '(Mirela, no salão do castelo, queima os mapas um a um na lareira.)',
      'Três moedas. Eu teria vendido por menos, para ofender mais. Não importa. Os mapas são cinza.',
      { r: [
        { t: 'Quem desenhou o primeiro mapa?', a: 'Alguém que já esteve lá dentro. Alguém da Casa. Isso, sim, importa. Mas não hoje.' },
        { t: 'Foi preciso matar todos?', a: 'Foi preciso que ninguém mais vendesse. Como você chegou a isso é com você e com o seu karma.', sombra: 1 } ] }] },

  { id: 'vn3', chain: VC, name: 'A Noite de Vestheim', lvl: 25, giver: MI, turnin: MI, next: 'vn4', xp: 0, gold: 300,
    text: 'A Casa não tem vilas: visita as dos outros. Vá a Vestheim à noite, entre sem ser visto e prove o sangue de alguém da vila. Quem, a senhora Mirela deixa você escolher.',
    objs: [{ kind: 'visit', poi: 'Vestheim' }, { kind: 'sense', what: 'sangue', label: 'Uma janela aberta em Vestheim, depois da última reza', at: 'Vestheim', dx: 4, dy: 5 }],
    talk: [
      'Esta é a parte que os livros dos caçadores contam com gosto: a visita. Nós não atacamos vilas. Nós as visitamos sem avisar. A diferença é a educação.',
      'Vestheim tem uma capela pequena e um porqueiro que deixa os javalis revirarem as covas. Tem também uma viúva doente, um ferreiro bêbado e uma moça que sonha com a gente. Escolha com cuidado.',
      { r: [
        { t: 'E se me virem?', a: 'Então amanhã a Abadia manda um paladino. Eles andam muito. É o que fazem.' },
        { t: 'Eu posso não morder ninguém?', a: 'Pode. E pode também não comer amanhã. A sede não negocia, {nome}. Ela espera.' } ] }],
    choice: { q: 'Na janela aberta de Vestheim, depois da última reza, você escolhe…', opts: [
      { label: 'O porqueiro que deixa os javalis nas covas, e bebe pouco.', karma: 0, flag: 'vn_porqueiro', say: 'Ele acordou fraco e com a lembrança de um sonho ruim. Na manhã seguinte, fechou a cerca. A Irmã Brígida acha que foi milagre.', why: 'Você mordeu quem fazia mal, e só o bastante. A Casa chama isso de bom gosto.' },
      { label: 'A moça que sonha com a gente, e conversa antes.', karma: -2, flag: 'vn_moca', say: 'Ela abriu a janela sozinha. Amanhã vai contar a todos que foi escolhida. Ninguém vai acreditar. Até o dia em que ela sumir para ir atrás de você.', why: 'Você alimentou um sonho perigoso. A sede passa; o sonho dela, não.' },
      { label: 'Ninguém. Volta com sede.', karma: 2, flag: 'vn_sede', say: 'A Mirela olhou você chegar de mãos vazias e rosto cinza. “Hoje você aprendeu a esperar. Amanhã vai aprender o preço.”', why: 'Você escolheu a sede no lugar de uma vítima. Isso pesa a seu favor, e cobra no corpo.' } ] },
    done: ['Voltou antes do sol. É o primeiro requisito de uma boa visita.'] },

  { id: 'vn4', chain: VC, name: 'Os Que Dormem de Dia', lvl: 27, giver: MI, turnin: VA, next: 'vn5', xp: 0, gold: 340, gear: 1,
    text: 'O segundo lugar que não existe: um mausoléu velho no mato, longe de Vestheim, onde a Casa guarda os que dormem de dia. Os antigos donos, esqueletos, não aceitaram os inquilinos. Derrube oito.',
    objs: [{ kind: 'visit', poi: 'O Mausoléu dos Que Dormem de Dia' }, { kind: 'kill', type: 'skeleton', n: 8 }],
    talk: ['O mausoléu era de uma família de mercadores que ninguém lembra mais. Os ossos lembram. Eles se levantam quando a Casa entra.', 'Derrube os ossos e olhe a tampa do caixão maior. Depois conte ao Vasko. Ele tem curiosidade de enólogo.'],
    done: [
      'Uma runa na tampa do caixão? Que encantador. Eu servi um vinho com essa runa no rótulo, uma vez. O Conde mandou jogar a garrafa fora sem abrir.',
      { r: [
        { t: 'Por que o Conde jogou fora?', a: 'Não perguntei. Um sommelier que pergunta ao Conde vira adubo de vinha. Delicioso adubo, mas adubo.' },
        { t: 'Os esqueletos voltam?', a: 'Sempre voltam. São como os críticos de vinho: chatos, ossudos e sem paladar.' } ] }] },

  { id: 'vn5', chain: VC, name: 'A Capela Virada', lvl: 29, giver: VA, turnin: MI, next: 'vn6', xp: 0, gold: 380,
    text: 'O terceiro lugar que não existe: uma capela de cabeça para baixo nos pinhais além de Grenivik, onde a Casa se reúne nas noites sem lua. Os carniçais da podridão entraram. Derrube oito.',
    objs: [{ kind: 'visit', poi: 'A Capela Virada' }, { kind: 'kill', type: 'ghoul', n: 8 }],
    talk: ['A Capela Virada: os santos de cabeça para baixo, o altar no teto. A Casa se reúne ali porque é o último lugar onde um paladino procuraria um vampiro: dentro de uma igreja.', 'Carniçais entraram pela cripta. Isso é obra de Zerath: a podridão não respeita nem os nossos endereços.'],
    done: ['Limpa. Os carniçais de Zerath não leem placas de “propriedade privada”. Agora você conhece os três. A senhora Mirela quer falar sobre o que acontece com quem conta.'] },

  { id: 'vn6', chain: VC, name: 'Quem Sabe, Cala', lvl: 31, giver: MI, turnin: VL, xp: 0, gold: 480, gear: 1, title: 'Guardião dos Lugares',
    text: 'Uma cria nova contou a um caçador de Aravel onde fica a Adega Sem Porta. Ela está presa no castelo. Mirela quer que você decida, e que conte ao Conde.',
    objs: [{ kind: 'talk', npc: VL }],
    talk: [
      'Uma cria da minha linha. Três noites de idade. Contou a um caçador onde fica a adega em troca de não morrer ao sol. Ela não sabia que o caçador ia matar ela do mesmo jeito. Não matou, porque eu cheguei primeiro.',
      'Traição é traição. Mas ela tinha três noites. Você tem trinta, quarenta. Decida você. O Conde vai ouvir a sua decisão como se fosse minha.'],
    meet: { [VL]: [{ who: VL, t: 'A senhora Mirela mandou você decidir. Ela sempre faz isso quando não quer ser a culpada. Diga.' }] },
    choice: { q: 'Diante do Conde, você decide o destino da cria que contou…', opts: [
      { label: 'Ela vive, mas esquece os três lugares para sempre (a Ilse apaga).', karma: 2, flag: 'vn_esquece', say: 'A cria acordou sem saber de adega nenhuma. Chorou porque não sabia por que chorava. O Conde assentiu uma vez.', why: 'Você cortou a traição sem cortar a vida. O código da Casa aceita isso.' },
      { label: 'Ela vira isca: o caçador volta à adega, e a Casa espera por ele.', karma: -3, flag: 'vn_isca', say: 'O caçador voltou. A adega tinha porta naquela noite, só para ele. Ninguém da Casa comenta o que houve.', why: 'Você usou uma criança da noite como isca. Útil. Escuro.' },
      { label: 'Ela vai ao sol, como manda o código.', karma: -5, flag: 'vn_sol', say: 'O Conde não olhou. A Mirela olhou até o fim. Depois foi para o quarto e não saiu por três noites.', why: 'A lei foi cumprida sem pena. A Casa guarda o segredo e perde uma filha.' } ] },
    done: ['Agora você sabe o que a Casa é: três lugares que não existem e gente que cala. Leve o título. Pese o nome.'] },
];

/* ======================= TECNOCRATA — A Oficina na Estrada ======================= */
const TC = 'A Oficina na Estrada';
const TECHNO_VILLAGES: QuestDef[] = [
  { id: 'tv1', chain: TC, name: 'Água Que Não Mata', lvl: 22, giver: AN, turnin: 'Irmão Cosme', req: 'te2', next: 'tv2', xp: 0, gold: 240, items: [['potion_g', 2]],
    text: 'O Doutor Anselm mede “quanto falta” em cada vila. Myrbakki marca alto: a turfa apodrece a água. Derrube cinco fungos andarilhos do charco, junte três Juncos-do-Rio para o filtro e entregue ao Irmão Cosme, da capela.',
    objs: [{ kind: 'visit', poi: 'Myrbakki' }, { kind: 'kill', type: 'fungus', n: 5 }, { kind: 'collect', item: 'herb_j', n: 3 }],
    talk: [
      'Isto é um índice. Marca quanto falta. Não me pergunte quanto falta para quê: a Academia também não sabe, e paga do mesmo jeito.',
      'A Academia fica na cidade grande e a Costa do Vapor vende máquina. Eu fico na estrada. Uma vila com água podre não compra máquina nenhuma. Primeiro a água.',
      { r: [
        { t: 'Por que um tecnocrata ajuda vila pobre?', a: 'Porque vila que bebe água limpa vira cliente. E porque o índice cai. Eu gosto quando o índice cai.', luz: 1 },
        { t: 'E se a vila não pagar?', a: 'Então paga depois. Negócio não é só moeda: é quem lembra de você.' } ] }],
    done: ['Juncos no filtro, fungos no fogo. A água ainda tem gosto de turfa, mas não mata. O Doutor vai querer o número.', 'Diga a ele que Auréon agradece. Ele vai fazer cara de quem não acredita. Agradeça mesmo assim.'] },

  { id: 'tv2', chain: TC, name: 'O Sino de Guarda de Skógar', lvl: 24, giver: 'Irmão Cosme', turnin: 'Irmã Clemência', next: 'tv3', xp: 0, gold: 280,
    text: 'Skógar precisa de proteção: mortos saem da mata. Derrube seis e instale o Sino de Guarda da Irmandade na capela — ele toca sozinho quando um morto passa da cerca.',
    objs: [{ kind: 'visit', poi: 'Skógar' }, { kind: 'kill', type: 'zombie', n: 6 }],
    talk: ['A Clemência escreveu pedindo um paladino. O Doutor mandou um sino. Os dois servem. Um deles não dorme.'],
    choice: { q: 'O Sino de Guarda pode tocar só para a capela ou para a vila inteira (custa mais caro à Irmandade). Você…', opts: [
      { label: 'Liga o sino à vila inteira e anota a diferença na sua conta.', karma: 3, flag: 'tv_sino_vila', say: 'O sino tocou na primeira noite e a vila inteira acordou a tempo. A Clemência rezou pela Irmandade. A Irmandade cobrou de você.', why: 'Você pagou para proteger quem não podia pagar.' },
      { label: 'Liga só à capela, como estava no pedido.', karma: 0, flag: 'tv_sino_capela', say: 'A capela ficou segura. Duas casas da beira, não. Ninguém morreu desta vez.', why: 'Você cumpriu o contrato à letra. Nada além.' } ] },
    done: ['O sino da Irmandade ao lado do sino de Auréon. Um toca para rezar, o outro para correr. Amém e obrigada.'] },

  { id: 'tv3', chain: TC, name: 'A Roda do Moinho', lvl: 26, giver: 'Irmã Clemência', turnin: 'Irmão Matias', next: 'tv4', xp: 0, gold: 310, gear: 1,
    text: 'Em Vatnaholt, a roda do moinho quebrou e a vila mói o trigo à mão. Leve quatro Minérios de Ferro e seis Madeiras para o conserto, e fale com o Irmão Matias.',
    objs: [{ kind: 'visit', poi: 'Vatnaholt' }, { kind: 'collect', item: 'ore_i', n: 4 }, { kind: 'collect', item: 'wood', n: 6 }],
    talk: ['O Matias me escreveu que os salteadores do “dízimo” foram embora, mas levaram o eixo da roda. Por maldade. Salteador tem dessas.'],
    done: ['A roda gira! Os eixos novos têm um carimbo de engrenagem com uma runa pequena dentro. O ferreiro diz que é da Irmandade. A Irmandade diz que é do ferreiro. Ninguém sabe quem pôs primeiro.', 'Leve o meu obrigado à próxima vila. Brekkuvik precisa de uma ponte.'] },

  { id: 'tv4', chain: TC, name: 'Uma Ponte para Brekkuvik', lvl: 27, giver: 'Irmão Matias', turnin: 'Irmã Teresa', next: 'tv5', xp: 0, gold: 330,
    text: 'Brekkuvik ficou isolada: a ponte velha caiu e as aranhas tomaram a margem. Derrube cinco aranhas e leve oito Madeiras e duas Cordas para a ponte nova.',
    objs: [{ kind: 'visit', poi: 'Brekkuvik' }, { kind: 'kill', type: 'spider', n: 5 }, { kind: 'collect', item: 'wood', n: 8 }, { kind: 'collect', item: 'rope', n: 2 }],
    talk: ['Construir é o que a Irmandade faz melhor depois de cobrar. Desta vez, o Doutor disse para não cobrar. Achei estranho. Obedeci.'],
    done: ['Uma ponte! Com corrimão e tudo. As crianças já atravessaram doze vezes cada uma. A Teresa vai pôr o nome da Irmandade na cabeceira. O Doutor vai fingir que não liga.'] },

  { id: 'tv5', chain: TC, name: 'Negócio É Negócio', lvl: 29, giver: 'Irmã Teresa', turnin: AN, next: 'tv6', xp: 0, gold: 380,
    text: 'O Doutor quer vender os filtros da Irmandade para os dois lados: ao Mestre-Forjador Kári (que forja para o Fio) e ao Sommelier Vasko (que serve a Casa do Conde). Fale com os dois e feche o mesmo preço.',
    objs: [{ kind: 'talk', npc: KA }, { kind: 'talk', npc: VA }],
    talk: ['O Doutor diz que a Irmandade não tem lado; tem preço. Eu digo que isso é um lado. Ele diz que eu não entendo de economia. Talvez.'],
    meet: {
      [KA]: [{ who: KA, t: 'Filtros? Para a forja? A água do Fio é benta, rapaz. Benta e cheia de lodo. Quanto?' }, { who: KA, t: 'O mesmo preço que vai cobrar do vampiro? Então eu pago. Odeio pagar menos que vampiro.' }],
      [VA]: [{ who: VA, t: 'Um filtro. Para o vinho? Que ofensa. Para a água dos criados? Que gentileza. Quanto?' }, { who: VA, t: 'O mesmo preço do anão do Fio? Ah, a Irmandade e a sua neutralidade de latão. Fechado. Mas eu quero o recibo em papel bonito.' }] },
    choice: { q: 'O Vasko oferece o dobro se o filtro dele vier com uma “gaveta” para guardar segredos. Você…', opts: [
      { label: 'Recusa: o mesmo filtro, o mesmo preço, para os dois.', karma: 3, flag: 'tv_mesmo', say: 'O Vasko sorriu como quem perde de propósito. “Neutralidade cansa, não cansa?” O Doutor anotou alguma coisa no índice e o número caiu.', why: 'Você vendeu para os dois sem vender nenhum dos dois.' },
      { label: 'Aceita a gaveta e não conta ao Kári.', karma: -3, flag: 'tv_gaveta', say: 'O ouro era bom. A gaveta, discreta. O Doutor viu o número do índice subir e não disse nada por um dia inteiro.', why: 'Você vendeu informação junto com latão. A Irmandade chama isso de “o outro negócio”.' } ] },
    done: ['Os dois lados, o mesmo preço. Ou não. O índice diz qual. Eu não preciso perguntar.'] },

  { id: 'tv6', chain: TC, name: 'O Índice das Vilas', lvl: 31, giver: AN, turnin: YL, xp: 0, gold: 480, gear: 1, title: 'Mão da Oficina',
    text: 'Leve o índice das vilas à Arquiteta Ylva, na Academia. O Doutor quer que ela veja quanto caiu.',
    objs: [{ kind: 'talk', npc: YL }],
    talk: ['Quatro vilas. A água, o sino, a roda, a ponte. O índice caiu onze pontos. Nunca caiu tanto num mês.', 'A Ylva vai perguntar quanto custou. Diga a verdade: pouco. Ela vai ficar desconfiada. Bom.'],
    meet: { [YL]: [{ who: YL, t: 'Onze pontos. Com sino, roda e ponte. O Anselm sempre foi sentimental com vila pequena.' }] },
    done: ['A Academia vai fingir que foi ideia dela. É assim que se ganha na Academia: deixando ganhar.', { r: [
      { t: 'O que o índice mede, afinal?', a: 'Quanto falta. Para quê, o Anselm jura que não sabe. Eu acho que ele sabe e tem medo do número.' },
      { t: 'Os carimbos das engrenagens têm uma runa.', a: 'Têm. Sempre tiveram. O primeiro molde já veio com ela. Ninguém da Academia lembra de ter desenhado.' } ] }] },
];

/* ======================= BRUXO — Os Que Rezam ao Contrário ======================= */
const BC = 'Os Que Rezam ao Contrário';
const WARLOCK_CHURCHES: QuestDef[] = [
  { id: 'bw1', chain: BC, name: 'A Igreja Abandonada', lvl: 22, giver: RV, turnin: RV, req: 'bx2', next: 'bw2', xp: 0, gold: 240,
    text: 'A Ravena não visita vilas: elas fecham as janelas. Ela visita o que as vilas largaram. Na Igreja Abandonada, cultistas rezam ao contrário e assinam pactos sem patrono. Derrube cinco.',
    objs: [{ kind: 'visit', poi: 'Igreja Abandonada' }, { kind: 'kill', type: 'cultist', n: 5 }],
    talk: [
      'A torre é do Malgrath. O resto do mundo, quando não está habitado, é meu. Igreja velha, cemitério, cripta: lugar que ninguém quer e todo mundo teme. Ótimo para negócio.',
      'Na Igreja Abandonada tem uns amadores rezando ao contrário. Rezar ao contrário não faz pacto, faz dor de cabeça. E rouba cliente.',
      { r: [
        { t: 'Por que não as vilas?', a: 'Porque vila tem padre, guarda e velha fofoqueira. Igreja abandonada só tem eco. Eco não denuncia ninguém.', sombra: 1 },
        { t: 'Cultistas são concorrência?', a: 'São vandalismo. Concorrência sabe ler.' } ] }],
    done: ['Cinco a menos. Os papéis deles eram pactos sem patrono, assinados com sangue de galinha. Pobre galinha.'] },

  { id: 'bw2', chain: BC, name: 'O Devedor do Cemitério', lvl: 24, giver: RV, turnin: RV, next: 'bw3', xp: 0, gold: 280,
    text: 'No Cemitério Esquecido, a alma de um devedor de Malgrath não descansa: a dívida passou para a filha. Derrube oito esqueletos e ache a alma com o Instinto.',
    objs: [{ kind: 'visit', poi: 'Cemitério Esquecido' }, { kind: 'kill', type: 'skeleton', n: 8 }, { kind: 'sense', what: 'espirito', label: 'A alma do devedor, entre as covas', at: 'Cemitério Esquecido', dx: 5, dy: -4, spirit: { name: 'Alma de Osric, o Devedor', lines: ['Eu assinei vinte cláusulas. Vinte. Não li nenhuma.', 'A dívida passou para a minha filha. Diga ao Senhor dos Pactos que eu pago. Não sei com quê. Mas pago.'] } }],
    talk: ['Um tal de Osric assinou vinte cláusulas e morreu sem pagar. A cláusula dezessete passa a dívida para a família. É uma cláusula feia. Não fui eu que escrevi.'],
    choice: { q: 'A alma de Osric quer que a dívida da filha acabe. A Ravena pode cortar a cláusula dezessete, mas alguém tem que pagar. Você…', opts: [
      { label: 'Paga com a sua própria sombra (um pedaço dela).', karma: 3, flag: 'bw_sombra', say: 'A Ravena riscou a cláusula. Sua sombra ficou mais curta ao meio-dia. Osric deitou e não levantou mais.', why: 'O bruxo paga com a própria sombra, nunca com a dos outros. Você pagou.' },
      { label: 'Deixa a dívida com a filha: contrato é contrato.', karma: -3, flag: 'bw_contrato', say: 'Osric continuou de pé entre as covas. A Ravena guardou o contrato sem riscar nada. Pela primeira vez, ela não fez piada.', why: 'A letra foi cumprida. A alma também ficou presa a ela.' } ] },
    done: ['Ninguém lê. Nunca. É por isso que eu existo.'] },

  { id: 'bw3', chain: BC, name: 'Negócio na Cripta de Hemara', lvl: 26, giver: RV, turnin: RV, next: 'bw4', xp: 0, gold: 310, gear: 1,
    text: 'A Cripta de Hemara é dos vampiros, mas os morcegos dela roubam as velas negras da Ravena. Derrube oito morcegos e deixe na cripta o recado: “cinco cláusulas, ou nada”.',
    objs: [{ kind: 'visit', poi: 'Cripta de Hemara' }, { kind: 'kill', type: 'bat', n: 8 }],
    talk: ['Vampiro e lobo são crianças, eu já disse. Vampiro é criança rica. Rouba vela e manda morcego para não sujar a mão.', 'Vá lá, espante os morcegos e deixe o recado. Se a Casa quiser vela, compra. Cinco cláusulas, ou nada.'],
    done: ['Voltou sem mordida. A Casa entendeu o recado ou está escrevendo a resposta. Com eles, as duas coisas levam um século.'] },

  { id: 'bw4', chain: BC, name: 'O Mausoléu do Bispo', lvl: 28, giver: RV, turnin: RV, next: 'bw5', xp: 0, gold: 350,
    text: 'No Mausoléu do Bispo, três cavaleiros sem cabeça guardam um livro de orações que um bispo usou para escrever um pacto escondido. Derrube os três e traga a página.',
    objs: [{ kind: 'visit', poi: 'Mausoléu do Bispo' }, { kind: 'kill', type: 'headless', n: 3 }],
    talk: ['Um bispo de verdade assinou um pacto com Malgrath e escondeu no livro de orações. Igreja é cheia de surpresa. Quero a página: é a melhor prova de que todo mundo assina.'],
    done: [
      '(A Ravena lê a página em voz alta. Ri. Para de rir.)',
      'Cinco cláusulas. O bispo escreveu cinco. Como eu. E no rodapé, a runa. A mesma do rodapé de todo pacto do Malgrath.',
      { r: [
        { t: 'Quem escreveu primeiro, você ou o bispo?', a: 'O bispo. Duzentos anos antes de mim. Não gosto disso. Não gosto nada disso.' },
        { t: 'O que é a runa?', a: 'Já perguntei ao Malgrath. O silêncio dele cobrou juros. Não pergunte você também.' } ] }] },

  { id: 'bw5', chain: BC, name: 'A Catedral ao Contrário', lvl: 30, giver: RV, turnin: MG, xp: 0, gold: 460, gear: 1, title: 'Cobrador de Igrejas',
    text: 'Na Catedral Abandonada, os mortos da podridão sobem as criptas. A Ravena quer o altar limpo para fechar ali o pacto do capítulo. Derrube dez mortos-vivos e leve a página do bispo ao Malgrath.',
    objs: [{ kind: 'visit', poi: 'Catedral Abandonada' }, { kind: 'kill', type: 'zombie', n: 10 }, { kind: 'talk', npc: MG }],
    talk: ['Zerath apodrece as criptas da Catedral. Até o que eu não vendi ele estraga. Limpe. Depois leve a página ao Malgrath e veja a cara dele.'],
    meet: { [MG]: [
      { who: MG, t: 'A página do bispo. Cinco cláusulas e a runa.' },
      { who: MG, t: '(Malgrath fica em silêncio por muito tempo. Depois guarda a página numa gaveta funda, sem ler o resto.)' },
      { who: MG, t: 'Diga à Ravena que cinco cláusulas não foram invenção dela. Ela vai ficar furiosa. Eu vou gostar.' } ] },
    done: ['Igreja, cemitério, cripta, mausoléu, catedral. Você cobrou de cada lugar que o mundo esqueceu. Leve o título: é o único que não tem juros.'] },
];

export const COSTURA_I: QuestDef[] = [...WARRIOR_SIS, ...WOLF_VARG, ...VAMPIRE_SECRETS, ...TECHNO_VILLAGES, ...WARLOCK_CHURCHES];
export const COSTURA_I_NPCS = [
  { vila: 'Jarlsheim', name: BY, role: 'Lâmina-Quieta · Portadora do Clã do Corvo', dx: 3.5, dy: 3, tint: 0x5a6a8a, lines: ['Eu não rio. Não é tristeza. É economia.', 'Os dois corvos de Odin voam juntos. Quem segue um só se perde.', 'Meu irmão fugiu. Eu fiquei. Os dois estamos pagando.'] },
];
