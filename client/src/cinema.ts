/** Cinemáticas de paisagem: a câmera se afasta e passeia pelo cenário enquanto um texto sobe contando a história do lugar.
 *  - Cenas de missão/chegada: obrigatórias, não dá para pular (o mundo para).
 *  - Fontes da Visão (estilo vistas do Guild Wars 2): jogue uma moeda e veja o lugar; dá XP na primeira vez. */
export interface Shot { x: number; z: number; zoom: number; az: number }
export interface Scene { id: string; title: string; sub: string; text: string[]; shots: Shot[]; sec: number; mood: 'dark' | 'bright'; skippable: boolean; /** ponto que deve ficar no centro do espaço livre (à esquerda do texto), em tiles, e altura em metros */ focus?: { x: number; y: number; h: number } }

const D = Math.PI / 180;
/** Fragmentos da Bíblia Karmika espalhados pelo mundo: cada lugar conta um pedaço da história dos deuses, dos Caminhantes,
 *  dos Príncipes Infernais e dos Essenciais. Posições em tiles (convertidas para metros por quem usa). */
export function scenes(T: number, CAT: { x: number; y: number }, ASK: { x: number; y: number; r: number }, CITY: { x: number; y: number }, poi: (name: string) => { x: number; y: number } | null) {
  const m = (x: number, y: number, zoom: number, az: number): Shot => ({ x: x * T, z: y * T, zoom, az: az * D });
  const cx = CAT.x + 6, cy = CAT.y + 9;
  const list: Scene[] = [
    { id: 'cat_arrival', title: 'A Catedral Abandonada', sub: 'Fragmento das Terras Antigas do Sul', mood: 'dark', skippable: false, sec: 58, focus: { x: cx, y: cy, h: 14 },
      shots: [m(cx, cy - 22, 74, 200), m(cx - 22, cy - 4, 82, 150), m(cx - 20, cy + 12, 88, 100), m(cx - 2, cy + 10, 92, 60), m(cx + 2, cy + 6, 96, 30), m(cx, cy + 5, 94, 45)], // começa na traseira, gira pela lateral e termina em panorâmica larga de frente (boa para foto)
      text: [
        'Antes das vilas, antes das estradas, antes mesmo de os homens aprenderem a contar os invernos, já havia o Olho.',
        'Ele não é um deus. É a lei. Vê tudo o que uma alma faz e guarda, como um rio guarda as pedras que caem nele. E acima da lei está Marghar, o Senhor dos Caminhos — que não interfere, não muda, não ouve preces. Ele só vê. E cobra. E devolve tudo o que foi plantado.',
        'Os primeiros a entender isso foram os Caminhantes: peregrinos sem nome que andaram o mundo inteiro e deixaram, em cada encruzilhada, uma pedra rúnica para que ninguém mais se perdesse. São as relíquias que ainda hoje se lembram de quem as toca.',
        'Aqui, onde os Caminhantes dormiram pela última vez, os devotos de Auréon, o Majestoso, ergueram a maior catedral do sul. Não para adorar Marghar — Marghar não tem sacerdotes —, mas para guardar um lugar onde o Olho parecia mais perto.',
        'Diziam que nas noites santas o Olho chorava aqui. A Lágrima Kármica caía sobre os justos, e onde ela caía o trigo crescia dourado em Sudrholt, Steinfoss e Sandvik.',
        'O último guardião foi o Bispo Aurélio. Era amado. Era bom. E era curioso.',
        'Aurélio começou a contar as lágrimas. Quis saber por que o Olho chorava por uns e não por outros. Desceu às criptas para ler os livros que os primeiros bispos haviam selado — livros escritos, dizem, pelos próprios Essenciais, as almas que existiam antes do primeiro ciclo e que nunca passaram pela Ampulheta.',
        'Nas páginas que ninguém deveria ler, alguém respondeu. Orrukh, o Devorador de Cinzas, o Príncipe Infernal que se alimenta das dívidas que ninguém pagou. Ele não ofereceu poder. Ofereceu justiça: "Por que deixar o Olho decidir, se você pode decidir por ele?"',
        'Aurélio aceitou. Começou a escolher quem merecia a Lágrima. E o Olho, que não aceita mãos sobre a sua lei, se fechou sobre a Catedral.',
        'Desde então o Bispo Caído reza ao contrário no fundo da terra. Cada oração dele é uma dívida, e Orrukh come as dívidas: o trigo apodrece em pé, os poços devolvem lama negra, os mortos não ficam enterrados.',
        'Nas vilas, o desespero virou crueldade. Primeiro penduraram os ladrões. Depois os que reclamavam. Depois levaram crianças ao altar, para acalmar a Catedral. Cada corpo pendurado é karma que não volta para ninguém — e Orrukh engorda.',
        'Marghar viu tudo. Marghar sempre vê. Mas Marghar não interfere. Ele espera alguém que escolha.',
        'Só um peregrino com o Olho aberto pode atravessar o portão depois que o sol morre, descer as quatro criptas e quebrar os três selos da Porta do Bispo.',
        'O que você fará quando estiver diante dele — e diante do que ele lhe oferecer — dirá mais sobre a sua alma do que qualquer oração.',
      ] },
  ];
  type V = Scene & { at: { x: number; y: number } };
  const vistas: V[] = [
    { id: 'v_cat', at: { x: cx - 8, y: cy + 34 }, title: 'Fonte da Visão — Avenida dos Anjos', sub: 'Catedral Abandonada', mood: 'dark', skippable: true, sec: 30,
      shots: [m(cx - 8, cy + 34, 22, 45), m(cx, cy + 20, 58, 45), m(cx - 14, cy + 6, 74, 95), m(cx + 12, cy + 8, 76, 10), m(cx, cy + 22, 84, 45)],
      text: ['Os anjos desta avenida foram esculpidos por quarenta pedreiros vindos de Askavik, que trabalharam vinte anos sem cobrar uma moeda. Pediram apenas que seus nomes fossem gravados por dentro da pedra, onde só o Olho pudesse ler.',
        'Cada anjo tem as mãos em prece e os olhos voltados para a porta da Catedral: foram feitos para vigiar quem entra. Na noite em que o Olho se fechou, os que estavam mais perto da porta perderam a cabeça — ninguém sabe se pela mão de Aurélio ou pelo peso do que viram.',
        'Os devotos de Auréon chamavam este caminho de "Subida da Luz". Os peregrinos o percorriam de joelhos. Hoje ninguém o percorre, e as tochas que você vê foram acesas pelos coveiros, que preferem enxergar o que sai das covas.',
        'Dizem que, se um peregrino sem pecado subir a avenida inteira à meia-noite, um dos anjos vira a cabeça para olhá-lo. Os poucos que juram ter visto isso nunca mais quiseram voltar.'] },
    { id: 'v_mau', at: { x: CAT.x + 22, y: CAT.y + 20 }, title: 'Fonte da Visão — O Mausoléu do Bispo', sub: 'Campo Santo', mood: 'dark', skippable: true, sec: 26,
      shots: [m(CAT.x + 22, CAT.y + 20, 22, 30), m(CAT.x + 29, CAT.y + 9, 46, 80), m(CAT.x + 29, CAT.y + 9, 38, 150), m(CAT.x + 26, CAT.y + 12, 52, 220)],
      text: ['O sepulcro foi erguido para Aurélio ainda vivo, como honra pelos quarenta anos de guarda. Ele nunca foi enterrado ali.',
        'A grade foi forjada depois, por ferreiros anões que exigiram ouro adiantado e foram embora antes do último prego. Ela não existe para impedir que entrem. Existe para impedir que algo saia.',
        'A cova aberta desce mais fundo que as criptas. Os caçadores da Vigília Verde, os devotos de Aravel, juram que lá embaixo há um mapa inteiro de túneis onde dormem os servos de Orrukh — e os tesouros que eles juntaram em séculos de dívidas.',
        'Os coveiros de Sudrholt deixam pão na porta do mausoléu toda lua nova. Não por piedade. Por medo de que, um dia, o que mora ali sinta fome.'] },
    { id: 'v_ask', at: { x: ASK.x + 6, y: ASK.y + 8 }, title: 'Fonte da Visão — Askavik', sub: 'A Cidade das Quatro Escolas', mood: 'bright', skippable: true, sec: 30,
      shots: [m(ASK.x + 6, ASK.y + 8, 24, 45), m(ASK.x, ASK.y - 10, 66, 100), m(ASK.x - 22, ASK.y + 10, 60, 190), m(ASK.x + 10, ASK.y, 50, 260)],
      text: ['Askavik nasceu de uma feira de sal à beira da estrada dos Caminhantes. Três relíquias apontavam para cá, e onde três relíquias apontam, os homens constroem.',
        'Quatro escolas dividem suas praças, e cada uma serve a um patrono: a Escola de Guerra jura a Odin, o Pai de Todos; a Forja guarda os segredos dos anões; a Academia Tecnológica estuda Mekhanos, o Grande Engenho; e a Igreja Majestosa canta para Auréon.',
        'Os mestres das escolas se odeiam com educação. Cada um acha que o seu caminho é o único que Marghar respeita. Marghar, como sempre, não diz nada.',
        'É aqui que todo peregrino chega quando o Olho se abre. É aqui que se faz o primeiro juramento — e quem jura a um patrono carrega os votos e as interdições dele até o fim da vida. Quebrar um juramento em Askavik é o caminho mais curto para a Ampulheta.'] },
    { id: 'v_kar', at: { x: CITY.x - 6, y: CITY.y + 8 }, title: 'Fonte da Visão — Karmika', sub: 'A Vila da Fonte', mood: 'bright', skippable: true, sec: 24,
      shots: [m(CITY.x - 6, CITY.y + 8, 20, 45), m(CITY.x, CITY.y, 44, 120), m(CITY.x + 6, CITY.y - 6, 36, 210)],
      text: ['A fonte de Karmika nunca secou, nem no inverno mais longo, nem no ano da praga.',
        'Os velhos dizem que é porque toda alma que reencarna passa por ela primeiro. Quando a areia da Ampulheta termina de escorrer, a alma volta pelo bico de cima, cai na fonte como uma gota e acorda num corpo novo, sem lembrar de nada — ou quase nada.',
        'Por isso todo recém-nascido daqui chora quando ouve água correr. E por isso os profetas visitam Karmika em silêncio: alguns procuram almas antigas que voltaram. Outros procuram almas antigas que deviam alguma coisa.',
        'A vila leva o nome do próprio karma porque foi o primeiro lugar onde alguém entendeu a lei: o que você faz, volta. Não como castigo. Como colheita.'] },
  ];
  const near = (name: string, dx: number, dy: number) => { const p = poi(name); return p ? { x: p.x + dx, y: p.y + dy } : null; };
  const add = (id: string, name: string, title: string, sub: string, mood: 'dark' | 'bright', text: string[], dx = 4, dy = 4) => { const a = near(name, dx, dy), c = poi(name); if (!a || !c) return;
    vistas.push({ id, at: a, title: `Fonte da Visão — ${title}`, sub, mood, skippable: true, sec: 26, shots: [m(a.x, a.y, 22, 45), m(c.x, c.y, 50, 100), m(c.x, c.y, 42, 190), m(c.x + 3, c.y - 3, 54, 250)], text }); };
  add('v_selvar', 'Clareira de Selvar', 'A Clareira de Selvar', 'Terra da Matilha', 'dark', ['Esta clareira é de Selvar, o Pai da Matilha, senhor da lua, da selva e da caça. Aqui não se planta e não se corta: só se caça, e só o que se vai comer.',
    'A alcateia de Ulfrik guarda o lugar há sete gerações. Quem entra sem ser chamado é presa; quem entra chamado sai com a marca, e quem recebe a marca nunca mais dorme em cama.',
    'Os lobisomens não se veem como amaldiçoados. Dizem que foram os primeiros a aceitar o que Marghar ensina: que todo ser é ao mesmo tempo caçador e caça, e que o karma de uma presa morta com respeito pesa menos que o de uma árvore derrubada por ganância.',
    'Nas noites de lua cheia, a clareira inteira uiva. Os viajantes que acampam perto ouvem, no meio dos uivos, vozes humanas chamando nomes. Às vezes, o próprio nome.']);
  add('v_aravel', 'Ruínas de Aravel', 'As Ruínas de Aravel', 'A Primeira Vigília', 'dark', ['Aravel, a Vigília Verde, nunca teve templo. Teve torres de vigia — e esta foi a primeira, erguida quando os demônios ainda andavam à luz do dia.',
    'Os caçadores de Aravel não rezam: vigiam. Juram nunca deixar um Príncipe Infernal cruzar uma estrada sem que alguém saiba. Malgrath, o Senhor dos Pactos; Vhaelor, o Demônio da Loucura; Orrukh, o Devorador de Cinzas — os três têm nomes gravados nestas pedras, junto com as datas em que foram vistos.',
    'A torre caiu numa noite que ninguém registrou, porque não sobrou ninguém para registrar. Os caçadores dizem que Vhaelor esteve aqui, e que a loucura dele derrubou as pedras de dentro para fora.',
    'Quem procura com cuidado ainda encontra flechas de prata enterradas entre as raízes. A Vigília Verde não abandona as suas armas. Só as deixa esperando por alguém que saiba usá-las.']);
  add('v_hemara', 'Cripta de Hemara', 'A Cripta de Hemara', 'Casa da Mãe Rubra', 'dark', ['Hemara é a Mãe Rubra, senhora do sangue, da sede e da noite. Os vampiros a chamam de mãe porque ela os pariu duas vezes: uma na carne, outra no Abraço.',
    'Esta cripta é o lugar mais antigo do culto. Aqui, diz a lenda, a primeira filha de Hemara bebeu de um rei moribundo e o devolveu à vida — eterno, faminto e livre da Ampulheta enquanto houvesse sangue para beber.',
    'Mas Marghar não esquece. O karma de quem não morre fica líquido para sempre, transbordando, e um dia a conta chega inteira. Os vampiros antigos sabem disso, e por isso são tão educados: estão tentando pagar devagar.',
    'Os Essenciais, dizem os textos da cripta, não tinham sangue. Tinham luz. Hemara foi a primeira a descobrir que a luz de um Essencial podia ser bebida.']);
  // ---- o mundo de fora: uma Fonte da Visão em cada região de lore ----
  add('v_jarl', 'Jarlsheim', 'Jarlsheim', 'Montanha Viking', 'bright', ['Os nórdicos chegaram pelo mar, em barcos com cabeça de dragão, quando os fiordes ainda eram gelo vivo. Fincaram o primeiro mastro aqui e chamaram a montanha de casa.',
    'Juram a Odin, o Pai de Todos, que deu um olho para ver mais longe. Por isso respeitam o Olho de Marghar sem temê-lo: entendem que ver custa caro, e que quem vê tudo carrega tudo.',
    'O Jarl de Jarlsheim não herda o trono. Ganha. A cada sete invernos, quem quiser a cadeira desce ao fiorde, luta no gelo e sobe com o sangue de alguém nas mãos — o próprio ou o do Jarl.',
    'Os guerreiros que morrem bem não voltam pela fonte de Karmika, dizem os skalds. Voltam pelo mar, numa onda, e acordam na praia sem lembrar o nome. Mas lembram como segurar um escudo.']);
  add('v_negra', 'Brasaforja', 'A Montanha Negra', 'Salões que respiram fogo', 'dark', ['Há mil gerações os anões cavam a Montanha Negra. Não procuram ouro: ouro é para os homens. Procuram o coração da montanha, onde a lava pulsa como sangue e os diamantes nascem do calor.',
    'A montanha ronca à noite e os anões chamam isso de respiração. Cada clã tem um salão, cada salão tem uma forja, e cada forja foi acesa com uma brasa trazida do salão mais antigo — o que ninguém mais sabe onde fica.',
    'Dizem que no fundo do fundo, onde a rocha fica mole, mora quem ensinou o primeiro anão a bater o martelo. Os anões não dizem o nome. Dizem só que ele não dorme, e que um dia vai cobrar o aluguel.',
    'Um diamante da Montanha Negra guarda luz por cem anos. É com eles que se acendem as tochas que nunca apagam — e é por eles que tanto anão desce e tão pouco anão volta.']);
  add('v_vampira', 'Corvoscuro', 'A Colina Vampírica', 'Escondida atrás da Montanha Negra', 'dark', ['Atrás da Montanha Negra, onde a fumaça do vulcão tapa o sol metade do dia, há uma colina que nenhum mapa antigo mostra. No alto dela, um castelo. Nele, o mais velho dos filhos de Hemara.',
    'Os aldeões de Corvoscuro não dizem o nome dele. Chamam-no de o Conde, e deixam vinho tinto na porta em toda lua nova — vinho, não sangue, porque o Conde é educado e diz que prefere pedir.',
    'A Guilda Vampírica recebe quem bate à porta à meia-noite. Oferece a eternidade em troca do Abraço. O que ela não conta é que a Ampulheta de quem não morre nunca esvazia: o karma fica líquido para sempre, e Marghar espera com paciência infinita.',
    'Há quem diga que o Conde também espera. Que ele quer morrer, uma vez, só para ver o que Marghar guardou para ele.']);
  add('v_desgraca', 'Gorvath', 'O Vale da Desgraça', 'Onde os bruxos aprendem o ofício', 'dark', ['O vale afundou numa noite. A terra cedeu como pão molhado e levou junto uma cidade inteira. O que sobrou em volta foi a lama, as árvores mortas e um silêncio que não é o dos lugares vazios.',
    'Os bruxos vieram depois, porque onde a terra foi ferida a fronteira entre os mundos fica fina. Malgrath, o Senhor dos Pactos, escuta melhor aqui. E Malgrath sempre tem uma proposta.',
    'A escola do vale ensina o mais perigoso dos ofícios: negociar. Um bruxo não pede poder, compra — com anos, com memórias, com o nome de alguém. Os bons bruxos leem o contrato inteiro. Os outros viram as árvores retorcidas do vale.',
    'Marghar não proíbe pactos. Só anota. E os velhos de Gorvath dizem que nenhum demônio escreve mais devagar do que o Olho.']);
  add('v_elfica', 'Lithendel', 'As Florestas Élficas', 'Aelvaren, a cidade nas árvores', 'bright', ['As árvores do oeste são mais velhas que os reis dos homens. Algumas têm a largura de uma vila, e no alto delas, onde a luz chega verde, os elfos construíram Aelvaren com pontes de corda e casas nos galhos.',
    'Os elfos não cortam árvore viva. Esperam que caia, e só então tiram a madeira — às vezes esperam trezentos anos. Por isso desprezam Lundr e seus lenhadores, e por isso Lundr os acha arrogantes.',
    'Elfos vivem muito, e o karma de quem vive muito pesa devagar mas pesa fundo. Os anciãos falam pouco: cada palavra que dizem é uma escolha, e eles já viram o que as escolhas fazem.',
    'Nas noites sem lua, a floresta inteira canta baixo. Os elfos dizem que é o vento. Os Caminhantes, que passaram aqui antes de todos, deixaram escrito numa relíquia: é a floresta lembrando.']);
  add('v_encantada', 'Lumenhal', 'A Floresta Encantada', 'Sob o Pináculo de Marfim', 'bright', ['A luz aqui tem cor errada. As folhas são violeta, as raízes brilham azul e os cogumelos acendem quando alguém passa. Tudo isso por causa do que está no centro: o Pináculo de Marfim.',
    'A torre dos magos sobe oitenta metros acima das copas, branca como osso, e no alto dela um canalizador puxa a energia do céu e a derrama na floresta. Os magos chamam isso de estudo. Os animais da floresta chamam de mudança.',
    'Aprender magia é passar anos lendo antes de acender uma vela. A Torre não aceita quem tem pressa. Aceita quem tem paciência para errar mil vezes — e cada erro, dizem os mestres, é uma conversa com o Olho.',
    'Lumenhal, a vila dos aprendizes, vive de vender poções que deram meio certo. Compre com cuidado: às vezes o efeito colateral é a parte boa.']);
  add('v_licantropa', 'Uivo Antigo', 'A Selva Licantropa', 'Onde a tribo dos lobos se esconde', 'dark', ['No extremo sudeste a floresta fecha tanto que o meio-dia parece crepúsculo. As árvores são altas como torres e o chão é um tapete de folhas que nunca seca. É aqui que vive a tribo.',
    'Os licantropos de Uivo Antigo descendem dos primeiros que aceitaram a marca de Selvar, o Pai da Matilha. Não se escondem por vergonha: se escondem porque os caçadores de prata ainda existem, e lembram.',
    'A tribo tem uma única lei: na lua cheia, ninguém de fora entra. Quem entra vira presa ou vira parente — e a tribo decide qual dos dois pelo cheiro do karma que você carrega.',
    'Os anciãos dizem que a selva foi plantada por Selvar com os ossos dos primeiros lobos, para que nenhum filhote nascesse longe de casa.']);
  add('v_vapor', 'Porto Caldeira', 'A Costa do Vapor e da Graxa', 'Porto Caldeira', 'bright', ['Ao sul, onde o continente encontra o mar, a costa cheira a óleo, sal e carvão. Porto Caldeira nunca dorme: os barcos remam sozinhos, movidos por caldeiras, e os guindastes de ferro descarregam sem um homem sequer.',
    'É a terra dos devotos de Mekhanos, o Arquiteto. Para eles a magia é uma engrenagem que ninguém entendeu ainda — e a Academia Tecnológica existe para entender. Robôs de latão varrem as ruas e acendem os lampiões.',
    'Os tecnocratas acham o Olho de Marghar a maior máquina já feita: mede tudo, guarda tudo, devolve tudo. Alguns passam a vida tentando construir uma cópia. Nenhum conseguiu. Os que chegaram perto pararam de dormir.',
    'Daqui saem as caravanas mecânicas que cruzam o mundo, e para cá voltam com encomendas de todas as raças. Em Porto Caldeira tudo tem preço — e, como em todo lugar, tudo também tem peso.']);
  for (const sc of [...list, ...vistas]) sc.sec = Math.round(sc.sec * 1.8); // texto mais lento, dá para ler com calma
  /* os monumentos dos caminhos: a câmera se afasta bem alto para a grandeza caber no quadro */
  const big = (id: string, name: string, title: string, sub: string, mood: 'dark' | 'bright', text: string[], dx = 5, dy = 6) => { const a = near(name, dx, dy), c = poi(name); if (!a || !c) return;
    vistas.push({ id, at: a, title: `Fonte da Visão — ${title}`, sub, mood, skippable: true, sec: 34, shots: [m(a.x, a.y, 24, 45), m(c.x, c.y - 8, 70, 100), m(c.x, c.y - 10, 92, 190), m(c.x, c.y - 6, 96, 280), m(c.x, c.y - 8, 98, 20)], text }); };
  big('v_conde', 'Castelo da Colina Vampírica', 'O Castelo do Conde', 'Colina Vampírica', 'dark', [
    'Dizem em Corvoscuro que a montanha não estava aqui quando os primeiros pastores chegaram. Que ela subiu numa noite só, empurrada de baixo, e que no alto já havia um castelo esperando, com as janelas acesas de vermelho.',
    'Vladislav III não conquistou esta pedra: foi convidado. Uma voz lhe ofereceu tempo, todo o tempo do mundo, e ele aceitou sem perguntar o preço. O preço era a sede, e a sede não envelhece.',
    'A estrada sobe em caracol porque o Conde gosta de ver quem vem. Cada volta é mais uma chance de desistir. As lanternas vermelhas não iluminam o caminho: marcam quantos já subiram e não desceram.',
    'Lá em cima, o farol da grande torre arde a noite inteira. Os vampiros dizem que é um coração. Os caçadores de Sudrholt dizem que é uma promessa. Marghar, como sempre, só vê.'], 6, 12);
  big('v_marfim', 'Pináculo de Marfim', 'O Pináculo de Marfim', 'A Lagoa das Mil Ilhas', 'bright', [
    'Ao sul de Lumenhal a terra acaba devagar, como quem não quer ir embora: primeiro em ilhas, depois em ilhotas, depois em água rasa e luz. É aqui que o fim do mundo e o fim do céu se encontram, num horizonte que ninguém alcança.',
    'Os magos ergueram o Pináculo no meio da lagoa porque aqui o horizonte não mente. Dizem que, do alto, nas manhãs claras, dá para ver a linha onde o mar vira céu, e que essa linha é a borda do labirinto de Marghar.',
    'A Ponte dos Mil Passos tem exatamente mil passos. Quem a atravessa contando, e não erra a conta, chega com a mente quieta o bastante para estudar. Quem erra volta no dia seguinte. O Arquimago Aurelian voltou onze vezes.',
    'No topo, seis chifres de marfim seguram o Cristal que não se apaga. Ele não é uma arma. É uma pergunta: o que você faria se pudesse ver tudo, como o Olho vê, e ainda assim escolher não mudar nada?'], 4, 14);
  big('v_odin', 'Fortaleza de Odin', 'A Fortaleza de Odin', 'Clã do Corvo', 'bright', [
    'O Pai de Todos deu um olho para beber da fonte do saber, e os homens do norte esculpiram a perda dele em pedra: vinte e seis metros de manto, de lança e de silêncio, olhando o vale de Jarlsheim.',
    'Os dois corvos nos ombros da estátua se chamam Pensamento e Memória. Os guerreiros juram diante deles. Diz o clã que os corvos de verdade, os de pena, vêm pousar ali sempre que alguém mente no juramento.',
    'O grande salão nunca apagou o fogo. Debaixo do telhado de turfa cabem quinhentos guerreiros e um rei. O Mestre de Armas Thorgrim conta que, nas noites de inverno, cabem também os mortos do clã, sentados nos bancos do fundo.',
    'Aqui não se pede força a Odin. Pede-se coragem para usar a que já se tem. O resto é karma.']);
  big('v_aurora', 'Abadia da Aurora', 'A Abadia da Aurora', 'Ordem de Auréon', 'bright', [
    'A Abadia acende a vela antes do sol, todas as manhãs, há quatrocentos anos. Não para chamá-lo: para mostrar a ele que alguém já estava acordado, esperando.',
    'A cúpula de ouro foi paga pelas vilas do leste, moeda por moeda, depois do inverno em que os mortos andaram. Os paladinos de Auréon ficaram entre os vivos e a noite por quarenta dias. A cúpula é o obrigado.',
    'No claustro, a fonte nunca congela. Os noviços aprendem ali a primeira lição da Ordem: proteger antes de atacar, ficar antes de vencer.'], 5, 8);
  big('v_prata', 'Bastião de Prata', 'O Bastião de Prata', 'Clã Helsing', 'dark', [
    'Seis pontas, seis vigias, um fosso que nunca seca. O Bastião de Prata foi desenhado por alguém que já tinha perdido uma fortaleza redonda para criaturas que sobem paredes.',
    'No alto da torre, a estaca de prata aponta para o céu. Os Helsing dizem que ela aponta para o lugar onde a primeira noite começou, e que um dia vão até lá.',
    'O Bastião nunca dormiu uma noite inteira. Alguém está sempre acordado, contando as horas e os nomes.'], 4, 10);
  big('v_desgraca', 'Vale da Desgraça', 'O Vale da Desgraça', 'O Vale dos Pactos', 'dark', [
    'O chão aqui afundou sob o peso dos contratos. Nove obeliscos seguram, por correntes, a rocha onde Malgrath escreveu o primeiro pacto. Se uma corrente partir, dizem, o contrato volta a ser cobrado de todos os que já o assinaram.',
    'A cabeça de pedra meio enterrada foi de um rei que tentou ler o contrato inteiro antes de assinar. Leu. Assinou mesmo assim. A estátua dele foi a primeira coisa que o vale engoliu.',
    'Os bruxos não vêm aqui pedir poder. Vêm negociar. Malgrath é justo. Quase sempre.'], 4, 10);
  big('v_uivo', 'Árvore-Mãe do Uivo', 'A Árvore-Mãe', 'Tribo do Uivo Antigo', 'dark', [
    'A Árvore-Mãe já era velha quando Selvar, o Pai da Matilha, deitou à sombra dela pela primeira vez. As raízes formam arcos onde os filhotes aprendem a caçar, e dentro do tronco fica a toca de Ulfrun, a Mãe-Alfa.',
    'Na pedra da lua, ao lado, a luz cai sempre do mesmo jeito, haja lua no céu ou não. É ali que a matilha escolhe quem recebe a marca.',
    'A tribo diz que a árvore também caça: as raízes avançam um palmo por ano. Quando chegarem ao mar, a lua vai descer para morar entre os galhos.'], 4, 10);
  return { list, vistas };
}

/** overlay: barras de cinema, título e texto que sobe devagar */
export function playOverlay(sc: Scene, onSkip: (() => void) | null) {
  const d = document.createElement('div'); d.className = 'cine';
  d.innerHTML = `<div class="bar top"></div><div class="bar bot"></div><div class="ttl"><h1>${sc.title}</h1><h3>${sc.sub}</h3></div>
    <div class="crawl"><div class="inner" style="animation-duration:${sc.sec}s">${sc.text.map((p) => `<p>${p}</p>`).join('')}</div></div>
    ${sc.skippable && onSkip ? '<button class="skip">Esc · pular</button>' : '<small class="noskip">cena da história</small>'}`;
  document.body.appendChild(d); requestAnimationFrame(() => d.classList.add('on'));
  const skip = d.querySelector('.skip'); if (skip && onSkip && sc.skippable) skip.addEventListener('click', onSkip);
  return { close() { d.classList.remove('on'); d.classList.add('off'); setTimeout(() => d.remove(), 900); },
    /** o texto inteiro já passou: agora dá para pular com Esc */
    allowSkip() { if (d.querySelector('.skip') || !onSkip) return; const ns = d.querySelector('.noskip'); const b = document.createElement('button'); b.className = 'skip'; b.textContent = 'Esc · pular'; b.addEventListener('click', onSkip); if (ns) ns.replaceWith(b); else d.appendChild(b); } };
}
