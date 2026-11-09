/* ---------- A PEDRA FUNDAMENTAL — Capítulo I do Anão puro (níveis 20–31), 09/11. "Fio de Bigode".
   Para quem recusou classe na Vidente e nasceu anão (v_hum + origem anã). Caos que não é bagunça: promessa de anão é fio de bigode.
   O anão puro é QUEM NEGOCIA COM OS DOIS LADOS: vende ferro ao Fio e aos Desfiados pelo mesmo preço, porque fio de bigode não tem lado.
   Odeia a sujeira debaixo do tapete, mas negócio é negócio e palavra é palavra.
   Portadora: a Mestra-de-Obras Dagny Pé-de-Chumbo, que recruta para a Grande Obra de Brasaforja (a muralha) e mede promessa com fita métrica.
   Tom: cômico-bruto, gente que xinga a pedra e cumpre tudo. O pequeno é o Pequeno Dori.
   Pista do capítulo (sem resposta): a porta das galerias de baixo e o bilhete do Rei Thrain; a sexta runa no lintel.
   Toda podridão é culpa de Zerath. Ninguém reconcilia ninguém. ---------- */
import type { QuestDef } from './quests';

export const DG = 'Mestra-de-Obras Dagny Pé-de-Chumbo', BO = 'Thane Borin Barba-Longa', SG = 'Velha Sigrun', KA = 'Mestre-Forjador Kári', VA = 'Sommelier Vasko', TR = 'Rei Thrain Coroa-de-Ferro', GT = 'Capataz Grimm Unha-Torta', DO = 'Pequeno Dori';
const FB = 'A Pedra Fundamental';
const D = { origin: 'dwarf' as const };

export const DWARF_I: QuestDef[] = [
  { id: 'fb1', chain: FB, ...D, name: 'A Grande Obra', lvl: 20, giver: BO, turnin: DG, req: 'v_hum', next: 'fb2', xp: 0, gold: 200, items: [['potion_g', 2]],
    text: 'O Thane Borin tem um trabalho para quem ficou anão: a Grande Obra de Brasaforja, a muralha que vai abraçar a montanha inteira. Quem manda na obra é a Mestra-de-Obras Dagny Pé-de-Chumbo. Apresente-se a ela. Leve a barba penteada.',
    objs: [{ kind: 'talk', npc: DG }],
    talk: [
      'Ficou anão. Bom. Anão não troca de casca. A Hrefna me disse que você olhou o dom de mago e fez cara de quem comeu cogumelo estragado. Gostei.',
      'Brasaforja está levantando a Grande Obra: uma muralha que vai do Portão de Baixo até o Pico do Carvão. Trezentos anos de projeto. Doze de obra. Faltam cento e oitenta e oito.',
      { r: [
        { t: 'Cento e oitenta e oito anos?', a: 'É anão. É rápido. Os humanos levam isso para decidir onde põem o banheiro.' },
        { t: 'Quem é a Dagny?', a: 'A melhor mestra-de-obras de Brasaforja e a pior pessoa para se dever um tijolo. Ela mede tudo. Tudo. Mediu a minha barba no meu casamento. Estava dois dedos torta.' } ] },
    ],
    meet: { [DG]: [
      { who: DG, t: 'Você é o do Borin? Fique reto. Mais. Mais. Tá. Um metro e trinta e dois. Pode ser.' },
      { who: DG, t: 'Na minha obra tem três regras. Um: pedra é pedra, não é travesseiro. Dois: quem promete, entrega. Três: quem esconde sujeira debaixo do tapete, vira tapete.' },
      { who: DG, t: 'Não ri. A terceira é literal. Temos um tapete na entrada da obra. Chama-se Bodvar. Era capataz.' },
    ] },
    done: [
      'Bem-vindo à Grande Obra. Amanhã, às quatro. Se chegar às quatro e um, eu anoto. Se chegar às três e cinquenta e nove, eu anoto também: pressa é falta de respeito com a pedra.',
    ] },

  { id: 'fb2', chain: FB, ...D, name: 'Pedra Que Não Mente', lvl: 21, giver: DG, turnin: DG, next: 'fb3', xp: 0, gold: 220,
    text: 'A Dagny quer ver se você sabe escolher pedra. Traga vinte pedras e oito blocos aparelhados para o trecho do Portão de Baixo. Ela vai medir cada um com a fita. Cada um.',
    objs: [{ kind: 'collect', item: 'stone', n: 20 }, { kind: 'collect', item: 'block', n: 8 }],
    talk: [
      'Pedra não mente. Pedreiro mente. Por isso eu meço a pedra e não pergunto nada ao pedreiro.',
      'Vinte pedras, oito blocos. Bloco com quina torta eu devolvo na sua cabeça. Com carinho. Com força, mas com carinho.',
      { r: [
        { t: 'Como se escolhe pedra boa?', a: 'Bate nela. Se cantar, é boa. Se resmungar, é ruim. Se ficar quieta, cuidado: pedra quieta está escondendo alguma coisa.' },
        { t: 'Você mede tudo mesmo?', a: 'Medi a altura do Rei uma vez. Ele mandou me prender. Eu medi a cela. Era dois palmos menor do que no projeto. Me soltaram e prenderam o arquiteto.' } ] },
    ],
    done: [
      '(Ela mede. Bloco por bloco. Assobia. Mede de novo.) Sete bons. Um com a quina um fio torta. Fio, não dedo. Vou aceitar. Anoto, mas aceito.',
      { r: [
        { t: 'Um fio só?', a: 'Um fio de bigode. A medida mais importante do mundo. Promessa de anão é desse tamanho: um fio. E não estica.' } ] },
    ] },

  { id: 'fb3', chain: FB, ...D, name: 'Sujeira Debaixo do Tapete', lvl: 22, giver: DG, turnin: DG, next: 'fb4', xp: 0, gold: 240, gear: 1,
    text: 'A Dagny desconfia do trecho do Capataz Grimm Unha-Torta: os números batem bonito demais. Ligue o Instinto (F) nas galerias do trecho dele, ache o que ele escondeu e limpe as aranhas que vieram junto. Depois, decida com a Dagny.',
    objs: [{ kind: 'sense', what: 'rastro', label: 'O desabamento escondido no trecho do Grimm', at: 'Brasaforja', dx: -9, dy: 6 }, { kind: 'kill', type: 'spider', n: 8 }, { kind: 'talk', npc: GT }],
    talk: [
      'O trecho do Grimm. Doze metros por semana. Nenhum acidente. Nenhuma pedra perdida. Nenhum atraso.',
      'Nenhum. Em doze anos de obra, nenhum trecho de Brasaforja teve nenhum. Número bonito demais é sujeira com laço.',
      { r: [
        { t: 'O que você acha que é?', a: 'Acho que ele perdeu uma galeria e varreu para debaixo do tapete. Se eu estiver errada, peço desculpas. Medidas. Com fita.' },
        { t: 'E se tiver gente lá embaixo?', a: 'Então corra. A conversa sobre o tapete fica para depois.' } ] },
    ],
    meet: { [GT]: [
      { who: GT, t: 'Você achou. Eu sabia que a Pé-de-Chumbo ia mandar alguém. Desabou faz um mês. Ninguém morreu. Quase. O Snorri ficou preso dois dias.' },
      { who: GT, t: 'Se eu conto, perco o trecho. Se perco o trecho, perco a família no Conselho. Você é anão. Você entende. Ou fica quieto, ou eu vou ser tapete.' },
    ] },
    choice: { q: 'O Grimm espera. A Dagny também. Você…', opts: [
      { label: 'Conta tudo à Dagny, e pede que o Grimm conserte o trecho com as próprias mãos.', karma: 4, flag: 'ana_grimm_conserta', say: 'A Dagny ouviu, mediu o desabamento e disse ao Grimm: “Três meses. Você e uma pá. Depois conversamos sobre tapete.” Ele consertou. Ficou reto.', why: 'Você não escondeu e não esmagou. Fio de bigode: a verdade e o conserto, no mesmo fio.' },
      { label: 'Conta tudo à Dagny e deixa a regra três correr.', karma: 1, flag: 'ana_grimm_tapete', say: 'A Dagny cumpriu a regra três. Brasaforja ganhou um tapete novo na entrada. Os capatazes nunca mais esconderam um tijolo. Também nunca mais falaram com você.', why: 'A regra foi cumprida inteira. Ninguém mais esconde. Ninguém mais confia.' },
      { label: 'Fica quieto em troca de um favor do Grimm.', karma: -4, flag: 'ana_grimm_calou', say: 'O trecho do Grimm continuou bonito demais. Seis meses depois, desabou de novo. Dessa vez, com gente. A Dagny descobriu quem sabia.', why: 'Você varreu para debaixo do tapete. O tapete cobra.' } ] },
    done: [
      'Pronto. Sujeira à vista. É feio, mas é limpo. É a contradição favorita dos anões.',
      { r: [
        { t: 'O Grimm disse que a pedra daquela galeria estava podre por dentro.', a: 'Podre? Pedra não apodrece. Os velhos vão dizer que foi Zerath, que até a montanha apodrece quando ele passa perto. Eu vou medir a pedra. Se estiver podre mesmo, eu peço desculpas ao Grimm. Com fita.' } ] },
    ] },

  { id: 'fb4', chain: FB, ...D, name: 'A Promessa do Bigode', lvl: 23, giver: DG, turnin: DG, next: 'fb5', xp: 0, gold: 260,
    text: 'Quem trabalha na Grande Obra promete uma coisa à Dagny, e ela mede a promessa com a fita métrica. Literalmente. Decida o tamanho da sua.',
    objs: [{ kind: 'talk', npc: 'Pequeno Dori' }],
    talk: [
      'Promessa de anão. Você vai prometer uma coisa à obra. Eu vou medir. Se for grande demais, eu corto. Se for pequena demais, eu rio. Se for do tamanho certo, eu anoto e você nunca mais esquece.',
      'Antes, fale com o Pequeno Dori. Toda promessa da obra tem uma testemunha criança. Criança cobra mais que Conselho.',
      { r: [
        { t: 'Por que uma criança?', a: 'Porque o Dori vai estar vivo quando a muralha terminar, e nós não. Ele vai cobrar dos nossos netos. É a única testemunha que dura o tempo da obra.' },
        { t: 'Como se mede uma promessa?', a: 'Com fita. Você diz. Eu estico a fita do tamanho da sua voz. Se a voz tremer, a fita encolhe. Funciona. Não pergunte como.' } ] },
    ],
    meet: { [DO]: [
      { who: DO, t: 'Você vai prometer? Eu vou lembrar! Eu lembro de tudo! Eu lembro que o Mestre Brokki queimou a barba na festa de inverno!' },
      { who: DO, t: 'Promete uma coisa boa. A última pessoa prometeu “nunca mais comer cogumelo da galeria três” e comeu no mesmo dia. Eu contei pra todo mundo.' },
    ] },
    choice: { q: 'A Dagny estica a fita. Você promete…', opts: [
      { label: '“Eu vou pôr uma pedra por dia na muralha, enquanto tiver mãos.”', karma: 4, flag: 'ana_promessa_pedra', say: 'A fita esticou certinho. A Dagny anotou. O Dori gritou “uma por dia!” e desde então grita isso toda manhã quando você passa.', why: 'Pequena, inteira, para sempre. Fio de bigode.' },
      { label: '“Eu vou terminar a Grande Obra.”', karma: 0, flag: 'ana_promessa_grande', say: 'A fita foi até a parede e voltou. A Dagny riu. “Faltam cento e oitenta e oito anos. Corto para um trecho.” Você prometeu um trecho.', why: 'Grande demais. A Dagny cortou para caber na vida.' },
      { label: '“Eu prometo aparecer quando der.”', karma: -3, flag: 'ana_promessa_vaga', say: 'A fita não esticou. A Dagny guardou a fita, sem anotar. O Dori disse “isso não é promessa” e foi contar para todo mundo.', why: 'Promessa que não se mede não é promessa. É conversa.' } ] },
    done: [
      'Medida e anotada. Agora você é da Obra. A Obra lembra mais que o Dori. Não muito mais.',
    ] },

  { id: 'fb5', chain: FB, ...D, name: 'Ferro Para o Fio', lvl: 24, giver: DG, turnin: KA, next: 'fb6', xp: 0, gold: 280,
    text: 'A Obra se paga vendendo ferro. A primeira encomenda é do Mestre-Forjador Kári, em Askavik, para a forja que trabalha para o Fio. Leve dez minérios de ferro e receba o preço justo. Nem um a mais.',
    objs: [{ kind: 'collect', item: 'ore_i', n: 10 }, { kind: 'visit', poi: 'Askavik' }, { kind: 'talk', npc: KA }],
    talk: [
      'Muralha não se paga com promessa. Se paga com ferro. Brasaforja vende ferro para quem paga. E vende pelo mesmo preço para todo mundo. Todo mundo.',
      'O Kári, em Askavik, faz espada para os paladinos e os caçadores, o pessoal do Fio. Leve dez minérios. O preço é este. Escrevi na sua mão. Não lave a mão até voltar.',
      { r: [
        { t: 'E se ele quiser pagar mais, por ser do Fio?', a: 'Recuse. Quem paga mais quer comprar mais do que ferro. Quer comprar lado. Anão não vende lado.' },
        { t: 'O Fio e os Desfiados estão brigando. A gente não escolhe?', a: 'A gente escolhe: escolhe vender pelo mesmo preço. É a escolha mais difícil de todas. Todo mundo vai te odiar um pouco. Ninguém vai te odiar muito.' } ] },
    ],
    meet: { [KA]: [
      { who: KA, t: 'Ferro de Brasaforja. Bom. Quanto? Esse preço? Escrito na mão? É coisa da Pé-de-Chumbo.' },
      { who: KA, t: 'O Grão-Mestre Cassius mandou eu oferecer o dobro a quem prometesse vender só para o Fio. Eu já sei a resposta. Mas ele mandou perguntar.' },
      { who: KA, t: 'Não? Claro que não. Fio de bigode. Toma. O preço da mão. Diga à Dagny que eu tentei.' },
    ] },
    done: [
      'Ele ofereceu o dobro e você recusou? Bom. Vamos ver se você recusa o dobro do outro lado também. Dizem que lá eles oferecem o triplo, e com vinho.',
    ] },

  { id: 'fb6', chain: FB, ...D, name: 'Ferro Para a Noite', lvl: 26, giver: DG, turnin: VA, next: 'fb7', xp: 0, gold: 300,
    text: 'A segunda encomenda é da Casa do Conde: grades novas para a adega de Corvoscuro. Leve dez minérios de ferro ao Sommelier Vasko, na Adega do Conde, e cobre o mesmo preço que o Kári pagou. O mesmo. Com a mesma cara.',
    objs: [{ kind: 'collect', item: 'ore_i', n: 10 }, { kind: 'visit', poi: 'Corvoscuro' }, { kind: 'talk', npc: VA }],
    talk: [
      'A Casa do Conde quer ferro. Para grade de adega, dizem. Pode ser verdade. Vampiro guarda muito vinho. E muita coisa que não é vinho.',
      'O preço é o mesmo da mão de ontem. Se o Vasko oferecer o triplo, você diz não. Se oferecer vinho, você diz não. Se oferecer um título, você ri e diz não.',
      { r: [
        { t: 'Vender ferro para vampiro não é ajudar a sombra?', a: 'É vender para a sombra. A sombra compra de alguém. Melhor de quem não mente no peso. E um dia, quando o Fio precisar de alguém que entre em Corvoscuro sem ser mordido, vão lembrar de quem vende ferro honesto lá.' },
        { t: 'E se me morderem?', a: 'Anão é amargo. Tem gosto de pedra. Eles sabem. Ninguém morde anão. É a única vantagem de ter sangue de minério.' } ] },
    ],
    meet: { [VA]: [
      { who: VA, t: 'Ah! O ferro de Brasaforja! Entre, entre. Não, não por aí, aí é a adega dos bons. Por aqui. Aqui é a dos ótimos.' },
      { who: VA, t: 'Dez minérios. O preço? Ah, que preço modesto. A Casa pode pagar o triplo. A Casa quer pagar o triplo. A Casa gosta de amigos que pesam bem.' },
      { who: VA, t: 'Não? O mesmo preço que o Kári? Que coisa deliciosamente anã. Tome. E leve uma garrafa. Não é pagamento: é admiração. Não, você recusa a garrafa também. Claro. Que tédio honrado.' },
    ] },
    choice: { q: 'Saindo da adega, o Vasko corre atrás com uma última oferta: o triplo, se você contar quem mais compra ferro de Brasaforja. Você…', opts: [
      { label: 'Recusa. Quem compra de Brasaforja é segredo de Brasaforja.', karma: 4, flag: 'ana_vasko_recusou', say: 'O Vasko suspirou como quem perdeu uma aposta consigo mesmo. “O Conde vai gostar disso. Ele odeia gente que vende informação. Só compra dela.”', why: 'Ferro pelo mesmo preço e nenhum nome. O Pacto da Honestidade dos anões, inteiro.' },
      { label: 'Recusa o triplo, mas aceita a garrafa para não ofender.', karma: 1, flag: 'ana_vasko_garrafa', say: 'O vinho era ótimo. A Dagny cheirou a garrafa e disse: “Corvoscuro. Safra das grades.” Não disse mais nada. Não precisava.', why: 'Um presente pequeno. Os presentes pequenos são onde os lados começam.' },
      { label: 'Aceita o triplo e conta do Kári.', karma: -5, flag: 'ana_vasko_vendeu', say: 'O ouro pesou bem. Uma semana depois, a forja do Kári foi visitada à noite. Nada roubado. Só medido. A Dagny soube quem contou.', why: 'Você vendeu um nome junto com o ferro. Anão não vende lado. Você vendeu.' } ] },
    done: [
      'Mesma mão, mesmo preço, dois lados. Você acaba de fazer a coisa mais anã que existe. Agora os dois lados vão desconfiar de você exatamente igual. É a definição de honestidade em Karmika.',
    ] },

  { id: 'fb7', chain: FB, ...D, name: 'As Galerias de Baixo', lvl: 27, giver: SG, turnin: SG, next: 'fb8', xp: 0, gold: 320, gear: 1,
    text: 'Os esqueletos estão subindo das galerias de baixo, as que o pai do Rei Thrain mandou fechar. A Velha Sigrun, guardiã das runas, quer que você desça até a porta, derrube os que subiram e olhe o lintel com o Instinto (F).',
    objs: [{ kind: 'kill', type: 'skeleton', n: 8 }, { kind: 'sense', what: 'dispositivo', label: 'A porta das galerias de baixo, no pé da muralha velha', at: 'Brasaforja', dx: 6, dy: -6 }],
    talk: [
      'As runas não gritam. Chegue perto. Mais. Agora ouça: os mortos estão subindo da galeria de baixo.',
      'A porta está fechada há sessenta anos. O pai do Thrain mandou fechar e o Thrain mantém fechada. Os mortos não precisam de porta, eles atravessam a fresta. Desça, derrube os que subiram, e olhe o lintel. Só olhe.',
      { r: [
        { t: 'O que tem do outro lado?', a: 'Galerias. Muitas. E um lugar que os mineiros velhos chamavam de Labirinto e os novos chamam de lenda. Eu chamo de “não é da sua conta, ainda”.' },
        { t: 'Por que fechar uma mina?', a: 'O pai do Thrain desceu, voltou, e fechou. Nunca disse por quê. Morreu sem dizer. Anão que guarda segredo até a morte guarda coisa grande.' } ] },
    ],
    done: [
      'Viu o lintel? A sexta runa. Gravada na pedra, mas de dentro para fora. Como se alguém do lado de lá tivesse gravado.',
      { r: [
        { t: 'Alguém do lado de lá?', a: 'Eu disse “como se”. Não disse “alguém”. Velha não diz o que não sabe. Velha diz “como se” e vai dormir mal.' },
        { t: 'O Rei sabe?', a: 'O Rei sabe que a porta está fechada. É o que ele quer saber. Se você quiser saber mais, vai ter que perguntar a ele. E ele não responde perguntas. Ele responde bilhetes.' } ] },
    ] },

  { id: 'fb8', chain: FB, ...D, name: 'O Bilhete do Rei', lvl: 28, giver: SG, turnin: DG, next: 'fb9', xp: 0, gold: 340,
    text: 'A Velha Sigrun manda você ao Grande Salão, ao Rei Thrain Coroa-de-Ferro, contar o que viu no lintel. O Rei não responde perguntas: responde bilhetes. Leve o que ele escrever à Dagny.',
    objs: [{ kind: 'talk', npc: TR }],
    talk: [
      'Vá ao Rei. Conte do lintel. Ele vai ouvir sem mexer a barba. Depois vai escrever um bilhete. O Thrain escreve bilhete para tudo. Escreveu um para a rainha no casamento. Dizia “sim”.',
    ],
    meet: { [TR]: [
      { who: TR, t: 'Aproxime-se. A montanha ouve tudo o que se diz debaixo dela.' },
      { who: TR, t: '(Ele ouve. Não mexe a barba. Pega um pedaço de pergaminho, escreve três palavras, dobra duas vezes e entrega.)' },
      { who: TR, t: 'Para a Pé-de-Chumbo. Não abra. Ela vai abrir e ler em voz alta, porque é assim que ela é. Aí você vai saber.' },
    ] },
    done: [
      '(A Dagny abre o bilhete e lê em voz alta:) “Muralha primeiro. Porta nunca.”',
      { r: [
        { t: 'Só isso?', a: 'Só isso. Três palavras. Igual ao pai dele. O pai deixou um bilhete na porta quando fechou. Dizia: “Ainda não.” Ninguém sabe o que o “ainda” quer dizer. Eu meço o “ainda” todo dia. Ele não diminui.' },
        { t: 'Vamos obedecer?', a: 'Muralha primeiro: obedeço com gosto. Porta nunca: obedeço com fita na mão. Se um dia o “nunca” encolher um fio, eu vou saber.' } ] },
    ] },

  { id: 'fb9', chain: FB, ...D, name: 'A Muralha Sobe', lvl: 30, giver: DG, turnin: DG, next: 'fb10', xp: 0, gold: 360, gear: 1,
    text: 'As caveiras de fogo que vazam da montanha atacam o trecho novo à noite. Defenda a obra: derrube oito caveiras de fogo e traga seis blocos para fechar o trecho do Portão de Baixo antes do inverno.',
    objs: [{ kind: 'kill', type: 'skull_fire', n: 8 }, { kind: 'collect', item: 'block', n: 6 }],
    talk: [
      'A montanha está cuspindo caveira de fogo. Toda vez que a gente sobe um trecho, ela cospe. Os velhos dizem que a montanha não gosta de ser abraçada.',
      'Eu digo que montanha não gosta de nada: montanha é pedra. Quem cospe é o que está debaixo dela. Derrube as caveiras, traga os blocos, e vamos fechar o trecho antes da neve.',
      { r: [
        { t: 'A porta das galerias tem a ver com isso?', a: 'Tem a ver com o “porta nunca”. Eu não abro. Eu levanto muro em volta. Se alguma coisa sair, vai dar de cara com a minha muralha. Medida.' },
        { t: 'E o Dori?', a: 'O Dori está contando os blocos. Ele já disse que faltam seis. Ele está certo. Ele sempre está certo. É insuportável.' } ] },
    ],
    done: [
      'Trecho fechado. Quatro metros e um fio. O fio é meu: eu mesma pus. Toda muralha tem um fio da mestra. É assinatura.',
    ] },

  { id: 'fb10', chain: FB, ...D, name: 'Fio de Bigode', lvl: 31, giver: DG, turnin: BO, title: 'Pedra Fundamental', xp: 0, gold: 420, gear: 1, items: [['potion_g', 4]],
    text: 'A Dagny põe o seu nome na pedra do trecho do Portão de Baixo. O anão jura não a um deus, mas à obra e à palavra. Depois, leve a fita métrica dela ao Thane Borin: é o sinal de que você já é de Brasaforja.',
    objs: [{ kind: 'talk', npc: DO }],
    talk: [
      'Você trouxe pedra que canta, achou a sujeira debaixo do tapete, prometeu do tamanho certo, vendeu ferro aos dois lados pelo mesmo preço e desceu até a porta que ninguém abre. É o suficiente.',
      'O juramento do anão não é para deus nenhum. É para a obra. Você vai dizer em voz alta, na frente do Dori, porque o Dori vai cobrar. Depois leve a minha fita ao Borin. Eu nunca empresto a fita. Ele vai entender.',
      { r: [
        { t: 'O que eu digo?', a: '“Promessa de anão é fio de bigode: não estica, não arrebenta, não tem lado.” E depois não fala mais nada, porque anão que fala depois de jurar estraga o juramento.' },
        { t: 'E as bandeiras de Askavik?', a: 'O Fio quer o nosso ferro e os Desfiados também. Os dois querem salvar Karmika. A gente vende para os dois pelo mesmo preço. Um dia vão nos pedir para escolher. Nesse dia, eu meço a pergunta antes de responder.' } ] },
    ],
    meet: { [DO]: [
      { who: DO, t: 'Vai jurar? Fala alto! Eu vou lembrar pra sempre! Pra sempre é muito tempo, eu sou criança!' },
      { me: 'Promessa de anão é fio de bigode: não estica, não arrebenta, não tem lado.' },
      { who: DO, t: 'Você não falou nada depois! Igual a Mestra Dagny! Eu vou contar pra todo mundo!' },
    ] },
    done: [
      'A fita da Pé-de-Chumbo. Ela nunca empresta. Nunca. Então você é de Brasaforja. Bem-vindo, de verdade agora.',
      { r: [
        { t: 'O que eu faço agora?', a: 'Uma pedra por dia. Ferro pelo mesmo preço. Barba penteada. E se alguém um dia mandar abrir a porta das galerias, você vem me contar antes de tocar na maçaneta.' },
        { t: 'A porta tem maçaneta?', a: 'Não sei. Nunca chegaram perto o bastante para ver. Ninguém quer saber se a porta tem maçaneta. É a pergunta mais anã que existe: a que ninguém faz.' } ] },
    ] },
];

/** a Portadora no Portão de Brasaforja e o Capataz Grimm (só durante fb3) */
export const DWARF_I_NPCS = [
  { vila: 'Brasaforja', name: DG, role: 'Mestra-de-Obras da Grande Obra', dx: 1.5, dy: -4.5, tint: 0x6a4a2a, kind: 'dwarf' as const, lines: ['Um metro e trinta e dois. Pode ser.', 'Pedra não mente. Pedreiro mente.', 'Quem esconde sujeira debaixo do tapete vira tapete. Literal.'] },
  { vila: 'Brasaforja', name: GT, role: 'Capataz do Portão de Baixo', dx: -7, dy: 5, tint: 0x4a3a2a, kind: 'dwarf' as const, onlyQ: 'fb3', lines: ['Doze metros por semana. Nenhum acidente.', 'Eu não escondo nada. Quase nada.'] },
];
