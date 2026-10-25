import type { QuestDef } from './quests';

/* =====================================================================================================
   O CAMINHO DO NORTE (humanos, níveis 1–25) — refeito em 25/10/2026
   Erling: "cheguei no nível 24 e estou na mesma vila ainda, nada mudou. As missões precisam me levar a explorar o mapa:
   de uma cidade para outra, e outra, dar a volta por cima, depois para o lado, voltar… e por fim chegar na cidade média
   tendo descoberto muito mapa, muitas cidades e aberto muitos teleportes. Várias missões devem levar às masmorras e cavernas.
   E pelo menos umas 15 com o Instinto ligado."

   O roteiro (cada vila tem uma relíquia: tocar abre o teleporte):
     Karmika (1–9) → Lundr, a leste (10–12) → Hrafnhöfn, no planalto (13–15) → Steinfoss, na Terra Maldita (15–17)
     → Sandvik e o Mausoléu de Vindholt, ao sul (18–19) → Skógar e a Cripta de Hemara, a oeste (19–20)
     → Vestheim e o Poço do Atoleiro (20–21) → Hvítadalr e a Fenda do Cume Gelado, subindo ao norte (22)
     → Fjallbrún e Kaldrfoss, na neve (23) → Midvangr, o passo (24) → de volta ao Vale: o Túmulo dos Draugr
     e a Igreja Abandonada (24) → o juramento em Karmika (25) → Askavik, a cidade de pedra (A Chamada, 25+).
   Masmorras no caminho: Mausoléu dos Esquecidos, Toca do Covil dos Lobos, Mausoléu Maldito de Vindholt, Cripta de Hemara,
   Poço do Atoleiro, Fenda do Cume Gelado, Túmulo dos Draugr. Instinto obrigatório em 15 missões (◈ no texto).
   XP: o fio amarelo divide o XP do trecho entre as missões do mesmo nível (quests.ts), então mais missões = cada uma paga menos.
   ===================================================================================================== */

const CN = 'Caminho do Norte';
const IL = 'Sargenta Ilka', OM = 'Velho Ormur', OD = 'Irmã Odila', BR = 'Coveiro Bram', IV = 'Caçador Ivo', HU = 'Juíza Hulda', RG = 'Pastora Ragnhild', BE = 'Escaldo Bersi', UN = 'Barqueira Unn', TV = 'Guarda-Passo Torvald';
const F = { who: 'Instinto', t: 'Aperte F (ou o terceiro olho, no menu de ações) para ligar o seu Instinto. O que esta missão pede só aparece para quem está atento.' };

/** as pessoas novas que a campanha pôs no mundo (uma por vila do roteiro) — world.ts as coloca de pé */
export const CAMPAIGN_NPCS: { vila: string; name: string; role: string; dx: number; dy: number; tint: number; lines: string[] }[] = [
  { vila: 'Lundr', name: IL, role: 'Guarda-mor de Lundr', dx: 3, dy: 2.5, tint: 0x4a5a3a, lines: ['Lundr é pequena. Por isso a gente cuida dela como se fosse grande.', 'Os lobos sabem contar. Contam quantos guardas eu tenho.'] },
  { vila: 'Hrafnhöfn', name: OM, role: 'Faroleiro de Hrafnhöfn', dx: 3, dy: -2.5, tint: 0x5a6a7a, lines: ['Cinquenta anos acendendo o farol. Nunca apagou. Até agora.', 'O mar fala. O vento traduz.'] },
  { vila: 'Steinfoss', name: OD, role: 'Curandeira de Steinfoss', dx: -3, dy: 2.5, tint: 0xd8d0c0, lines: ['Febre não escolhe casa. Eu também não.', 'Lave as mãos antes de entrar. E antes de sair.'] },
  { vila: 'Sandvik', name: BR, role: 'Guardião do Campo Santo', dx: 3, dy: 3, tint: 0x3a3a3a, lines: ['Eu enterro. Alguém anda desenterrando.', 'Os mortos não reclamam. Os vivos, sim.'] },
  { vila: 'Skógar', name: IV, role: 'Caçador de Skógar', dx: -3, dy: -2.5, tint: 0x5a4a2a, lines: ['Pegada não mente. Gente mente.', 'Os charcos engolem quem anda olhando para o céu.'] },
  { vila: 'Vestheim', name: HU, role: 'Juíza de Vestheim', dx: 3, dy: 2, tint: 0x6a2a3a, lines: ['A lei de Vestheim é curta: quem rouba devolve, quem mente paga.', 'Eu julgo os vivos. O Olho julga o resto.'] },
  { vila: 'Hvítadalr', name: RG, role: 'Pastora de Hvítadalr', dx: -3, dy: 2.5, tint: 0xe0d8c8, lines: ['Conto as ovelhas toda manhã. Faltam três.', 'A neve guarda segredo, mas não guarda pegada.'] },
  { vila: 'Fjallbrún', name: BE, role: 'Escaldo de Fjallbrún', dx: 3, dy: -2, tint: 0x8a5a2a, lines: ['Toda vila tem uma canção. A desta perdeu o último verso.', 'Eu canto o que aconteceu. Você faz acontecer.'] },
  { vila: 'Kaldrfoss', name: UN, role: 'Barqueira de Kaldrfoss', dx: -2.5, dy: 3, tint: 0x3a5a7a, lines: ['A cachoeira congelou. Meu barco virou banco.', 'Quem atravessa o gelo em silêncio, atravessa duas vezes.'] },
  { vila: 'Midvangr', name: TV, role: 'Guarda-Passo de Midvangr', dx: 3, dy: 2.5, tint: 0x5a5a6a, lines: ['Ninguém passa por Midvangr sem que eu saiba o nome.', 'O passo é estreito. A história do Vale, também.'] },
];

export const HUMAN_ROAD: QuestDef[] = [
  /* ---------------- Ato I · O Vale de Karmika (1–9) ---------------- */
  { id: 'h01', chain: CN, name: 'Primeiros passos', lvl: 1, giver: 'Garrick', xp: 1, gold: 10, next: 'h02',
    text: 'As ratazanas rubras infestam o cemitério e os arredores. Prove que sabe segurar uma espada: derrube três.',
    objs: [{ kind: 'kill', type: 'rat', n: 3 }],
    talk: ['Você é a recém-chegada? Não precisa responder: dá para ver pela bota limpa.', 'Karmika é um vale bom. Mas o vale tem dente. Começa pequeno: ratazanas rubras no cemitério, gordas de tanto comer o que não devem.',
      { r: [{ t: 'Três ratazanas. Considere feito.', a: 'Gostei. Volte inteira.' }, { t: 'Ratos? Eu vim para coisa maior.', a: 'Todo mundo vem. Começa pelos ratos mesmo.' }] }] },
  { id: 'h02', chain: CN, name: 'Galhos para o fogo', lvl: 2, giver: 'Lúcia', xp: 1, gold: 5, items: [['bread', 2]], next: 'h03',
    text: 'O inverno chega cedo em Karmika. Junte galhos secos nas árvores ao redor da vila (E perto de uma árvore).',
    objs: [{ kind: 'collect', item: 'stick', n: 5 }],
    talk: ['Ai, que bom que alguém parou. Meu fogão come galho como criança come pão.', 'Cinco galhos secos, das árvores em volta da vila. Eu te pago com pão quente, que é o que eu tenho.'] },
  { id: 'h03', chain: CN, name: 'Couro para o mercador', lvl: 3, giver: 'Thorin', xp: 1, gold: 25, next: 'h04',
    text: 'Thorin precisa de couro de cervo ou lobo. Traga três peças.',
    objs: [{ kind: 'collect', item: 'hide', n: 3 }],
    talk: ['Anão não pede favor. Anão faz negócio.', 'Três couros, de cervo ou de lobo. Esfole com cuidado, que couro rasgado vale metade.'] },
  { id: 'h04', chain: CN, name: 'Coiotes da estrada', lvl: 4, giver: 'Garrick', xp: 1, gold: 20, next: 'h05',
    text: 'Coiotes atacam quem anda pelas campinas. Cace cinco.',
    objs: [{ kind: 'kill', type: 'coyote', n: 5 }],
    talk: ['A carroça do leiteiro voltou sem leite e sem leiteiro. Ele está bem. O cavalo, nem tanto.', 'Coiotes. Cinco a menos e a estrada respira.'] },
  { id: 'h05', chain: CN, name: 'A alma que chora no cemitério', lvl: 5, giver: 'Eldrin', xp: 1, gold: 15, next: 'h06',
    text: '◈ Vá ao Cemitério Esquecido. Há uma alma que chora entre os túmulos e só quem tem o Instinto ligado consegue vê-la. Escute o que ela tem a dizer.',
    objs: [{ kind: 'visit', poi: 'Cemitério Esquecido' }, { kind: 'sense', what: 'espirito', label: 'Achar e ouvir a alma que chora', at: 'Cemitério Esquecido', dx: 3, dy: 2, spirit: { name: 'Alma de Hedda', lines: ['Você… me vê? Ninguém me vê faz tanto tempo.', 'Eu era a sineira do vale. Morri no inverno da fome, e me enterraram sem nome.', 'Debaixo do cemitério tem uma porta. Lá embaixo os ossos não dormem. Diga ao velho do templo.'] } }],
    talk: ['Sente-se. Não, não precisa. Fique de pé, que quem está de pé escuta melhor.', 'Todo vivo tem um instinto. Uns chamam de medo. Eu chamo de atenção.', 'No Cemitério Esquecido alguém chora à noite. Os aldeões juram que é o vento. Eu não juro nada.', F] },
  { id: 'h06', chain: CN, name: 'Pedra e corda', lvl: 6, giver: 'Doran', xp: 1, gold: 20, items: [['flint', 1]], next: 'h07',
    text: 'Um caminhante que não sabe fazer o próprio machado não atravessa o inverno. Colete pedras e crie um Machado de Pedra (menu I).',
    objs: [{ kind: 'collect', item: 'stone', n: 4 }, { kind: 'craft', recipe: 'Machado de Pedra', n: 1 }],
    talk: ['Eldrin mandou você? Então você vai descer onde não tem loja. Leve ferramenta.', 'Quatro pedras, um galho, uma corda. O resto é paciência.'] },
  { id: 'h07', chain: CN, name: 'Os ossos que não dormem', lvl: 7, giver: 'Eldrin', xp: 1, gold: 40, gear: 1, next: 'h08',
    text: 'A alma de Hedda falou de uma porta debaixo do Cemitério Esquecido. É o Mausoléu dos Esquecidos. Desça, chegue ao fundo e cale o Sacristão Sem Rosto.',
    objs: [{ kind: 'dungeon', id: 'esquecidos', name: 'Mausoléu dos Esquecidos' }],
    talk: ['Hedda. A sineira. Eu tocava sino com ela quando era menino. Então ela ficou.', 'O Mausoléu dos Esquecidos foi lacrado antes de eu nascer. Se os ossos estão de pé lá embaixo, alguém os levantou.', 'Desça. A entrada fica no cemitério, entre os túmulos mais velhos. E volte para me contar.'] },
  { id: 'h08', chain: CN, name: 'O marido desaparecido', lvl: 9, giver: 'Lúcia', xp: 1, gold: 30, items: [['potion', 1]], next: 'h09',
    text: '◈ O marido de Lúcia foi caçar ao norte e não voltou. Ligue o Instinto, siga as pegadas dele desde a vila até a Igreja Abandonada e afaste os puglins que rondam o lugar.',
    objs: [{ kind: 'sense', what: 'rastro', label: 'Seguir as pegadas do marido de Lúcia', at: 'Igreja Abandonada', dx: -3, dy: 4, from: 'Karmika' }, { kind: 'kill', type: 'puglin', n: 4 }],
    talk: ['Você desceu no mausoléu e voltou. Então você é a pessoa certa.', 'O Bento foi caçar ao norte faz cinco dias. Ele sempre volta em dois.', 'A chuva parou ontem. As pegadas ainda devem estar lá, se alguém souber olhar.', F],
    done: ['Ele… estava vivo? Estava vivo.', 'Machucado, escondido na igreja velha, com medo dos puglins. Ele contou que você chegou como se já soubesse onde ele estava.'],
    choice: { q: 'Bento pede que ninguém saiba que ele se escondeu em vez de lutar.', opts: [
      { label: 'Guardar o segredo dele', karma: 3, say: 'Obrigada. Ele vai carregar isso sozinho, e já é peso que chega.', why: 'Proteger a honra de quem errou por medo é misericórdia.' },
      { label: 'Contar na vila como foi', karma: -1, say: 'Você tem razão de não mentir… mas ele não vai sair de casa por um mês.', why: 'A verdade é boa. A verdade que humilha à toa, nem tanto.' }] } },

  /* ---------------- Ato II · Para o leste: Lundr e o planalto (10–15) ---------------- */
  { id: 'h09', chain: CN, name: 'A carta para Lundr', lvl: 10, giver: 'Garrick', turnin: IL, xp: 1, gold: 20, next: 'h10',
    text: 'Garrick tem uma carta para a Sargenta Ilka, em Lundr, a vila do bosque a leste de Karmika. Siga a estrada para o leste. Ao chegar, toque a relíquia da vila: ela abre o caminho de volta (teleporte).',
    objs: [{ kind: 'visit', poi: 'Lundr' }, { kind: 'talk', npc: IL }],
    talk: ['Você cresceu rápido. Karmika ficou pequena para você, e isso é um elogio.', 'Lundr pediu ajuda. Os lobos do bosque estão mais ousados, e a Ilka não tem gente.', 'Leve esta carta. E abra os olhos na estrada: é a primeira vez que você sai do vale.'],
    meet: { [IL]: ['Uma carta do Garrick? Ele só escreve quando o assunto é sério.', '“Mando a melhor que eu tenho.” Hm. Vamos ver se ele exagerou.'] } },
  { id: 'h10', chain: CN, name: 'O cheiro do covil', lvl: 11, giver: IL, xp: 1, gold: 30, next: 'h11',
    text: '◈ Os lobos de Lundr têm uma toca e ninguém sabe onde. Derrube seis lobos no bosque e, com o Instinto ligado, siga o cheiro forte deles até o Covil dos Lobos.',
    objs: [{ kind: 'kill', type: 'wolf', n: 6 }, { kind: 'sense', what: 'cheiro', label: 'Farejar o caminho até a toca dos lobos', at: 'Covil dos Lobos', dx: 2, dy: -3, from: 'Lundr' }],
    talk: ['Seis ovelhas na semana. Um menino mordido. Os lobos não estão com fome: estão sendo mandados.', 'Mate os que encontrar. E descubra de onde eles vêm. Dizem que o caminho até a toca cheira a carne velha.', F] },
  { id: 'h11', chain: CN, name: 'A Toca do Covil dos Lobos', lvl: 12, giver: IL, xp: 1, gold: 45, gear: 1, next: 'h12',
    text: 'Você achou a toca. Lá dentro manda o Lobo Cinzento. Entre na Toca do Covil dos Lobos, chegue ao fundo e acabe com quem comanda a matilha.',
    objs: [{ kind: 'dungeon', id: 'lobos', name: 'Toca do Covil dos Lobos' }],
    talk: ['Uma toca debaixo da terra, com cheiro de gente e de bicho ao mesmo tempo… isso não é lobo comum.', 'Entre e acabe com isso. Lundr fica devendo a você.'] },
  { id: 'h12', chain: CN, name: 'O farol que apagou', lvl: 13, giver: IL, turnin: OM, xp: 1, gold: 25, next: 'h13',
    text: 'O farol de Hrafnhöfn, no Planalto de Askavik, está apagado há três noites. Os pescadores pediram ajuda a Lundr. Vá até Hrafnhöfn (nordeste, passando perto de Askavik) e fale com o Velho Ormur.',
    objs: [{ kind: 'visit', poi: 'Hrafnhöfn' }, { kind: 'talk', npc: OM }],
    talk: ['Agora que a matilha caiu, chegou outro pedido. De Hrafnhöfn, lá no planalto.', 'Você vai passar perto de Askavik, a cidade de pedra. Olhe de longe. Ainda não é a sua hora lá.'],
    meet: { [OM]: ['Você veio de Lundr? Então a Ilka ainda me ouve.', 'Cinquenta anos acendendo aquele farol. Três noites apagado. Três barcos que não voltaram.'] } },
  { id: 'h13', chain: CN, name: 'Sangue na rede', lvl: 14, giver: OM, xp: 1, gold: 35, next: 'h14',
    text: '◈ Alguma coisa arrasta as ovelhas e as redes dos pescadores para longe da vila. Ligue o Instinto e siga as gotas de sangue até o bando de javalis enlouquecidos. Derrube cinco.',
    objs: [{ kind: 'sense', what: 'sangue', label: 'Seguir o sangue das ovelhas arrastadas', at: 'Hrafnhöfn', dx: 18, dy: 10 }, { kind: 'kill', type: 'boar', n: 5 }],
    talk: ['Antes do farol, um problema de terra firme: estão arrastando as minhas ovelhas.', 'Deixam um rastro de sangue que a chuva não lava. Siga.', F] },
  { id: 'h14', chain: CN, name: 'A lente do farol', lvl: 15, giver: OM, xp: 1, gold: 40, items: [['potion', 2]], next: 'h15',
    text: '◈ Alguém roubou a lente do farol e a enterrou nas pedras da costa. Com o Instinto ligado, procure o brilho da peça perdida.',
    objs: [{ kind: 'sense', what: 'dispositivo', label: 'Achar a lente do farol enterrada', at: 'Hrafnhöfn', dx: -12, dy: 14 }],
    talk: ['O farol não apagou sozinho. A lente sumiu. Lente de cristal anão, vale mais que a minha casa.', 'Quem roubou não conseguiu vender. Enterrou. Lente boa brilha até debaixo da terra, para quem sabe ver.', F],
    done: ['É ela. Ainda quente do sol.', 'Esta noite o farol acende de novo. E os barcos voltam para casa.'] },
  { id: 'h15', chain: CN, name: 'A febre de Steinfoss', lvl: 15, giver: OM, turnin: OD, xp: 1, gold: 25, next: 'h16',
    text: 'O ladrão da lente era de Steinfoss, na Terra Maldita, ao sul. Ele fugiu de lá porque a vila está doente. Vá até Steinfoss e procure a Irmã Odila, a curandeira.',
    objs: [{ kind: 'visit', poi: 'Steinfoss' }, { kind: 'talk', npc: OD }],
    talk: ['O ladrão era um moço de Steinfoss. Roubou para comprar remédio. A febre lá está matando gente.', 'Eu não vou atrás dele. Mas alguém devia ir atrás da febre.'],
    meet: { [OD]: ['Não chegue perto sem lavar as mãos. Isso. Agora sim.', 'Hrafnhöfn mandou você? Então o rapaz chegou lá. Ele queria ajudar a mãe.'] } },

  /* ---------------- Ato III · A Terra Maldita e o sul (16–19) ---------------- */
  { id: 'h16', chain: CN, name: 'Flor-de-Campo para a febre', lvl: 16, giver: OD, xp: 1, gold: 40, next: 'h17',
    text: 'A febre de Steinfoss vem dos mortos que andam pela estrada. Derrube seis mortos-vivos e traga cinco Flores-de-Campo dos canteiros perto das vilas: Irmã Odila faz o chá.',
    objs: [{ kind: 'kill', type: 'zombie', n: 6 }, { kind: 'collect', item: 'herb_f', n: 5 }],
    talk: ['A febre não vem do ar. Vem dos mortos que andam pela estrada à noite. Eles tocam a água do poço.', 'Mate os que encontrar. E me traga Flor-de-Campo: cinco. Com ela eu faço o chá que baixa a febre.'] },
  { id: 'h17', chain: CN, name: 'A freira da catedral', lvl: 17, giver: OD, xp: 1, gold: 45, next: 'h18',
    text: '◈ Os mortos vêm da Catedral Abandonada, ao sul de Karmika. Vá até lá e, com o Instinto ligado, procure a alma da freira que dizem viver presa na nave. Ela sabe quem acordou os mortos.',
    objs: [{ kind: 'visit', poi: 'Catedral Abandonada' }, { kind: 'sense', what: 'espirito', label: 'Encontrar a freira presa na catedral', at: 'Catedral Abandonada', dx: 4, dy: 3, spirit: { name: 'Irmã Ysolde', lines: ['Você me vê. Então ainda há esperança nesta terra.', 'O Bispo Caído abriu as portas para Gorvak. Os mortos que andam até Steinfoss são o rebanho dele.', 'Eu não posso sair daqui. Mas você pode descer. Um dia. Quando estiver forte.'] } }],
    talk: ['As crianças falam de uma moça de branco na catedral. Crianças veem o que a gente esqueceu de ver.', 'Vá. Leve o Instinto aceso. E não desça mais do que a nave: lá embaixo é coisa para depois.', F],
    done: ['Ysolde… eu rezei por ela a vida inteira sem saber o nome.', 'Um dia você desce e liberta essa mulher. Hoje, você já trouxe a verdade.'] },
  { id: 'h18', chain: CN, name: 'Os túmulos abertos de Sandvik', lvl: 18, giver: OD, turnin: BR, xp: 1, gold: 40, next: 'h19',
    text: '◈ Em Sandvik, a sudoeste de Steinfoss, alguém desenterra os mortos à noite. Vá até lá, derrube seis esqueletos e, com o Instinto ligado, siga o rastro dos ladrões de túmulo. Depois fale com o Coveiro Bram.',
    objs: [{ kind: 'visit', poi: 'Sandvik' }, { kind: 'kill', type: 'skeleton', n: 6 }, { kind: 'sense', what: 'rastro', label: 'Seguir as pegadas dos ladrões de túmulo', at: 'Sandvik', dx: -10, dy: 16 }, { kind: 'talk', npc: BR }],
    talk: ['O Bram, de Sandvik, mandou recado: os túmulos estão abertos de manhã. Alguém cava à noite.', 'Morto que sai da cova é morto que alguém chamou. Descubra quem.', F],
    meet: { [BR]: ['Você seguiu as pegadas? Então viu. Eram de gente, não de bicho.', 'Uma família de Vindholt. Passando fome. Vendem os anéis dos mortos.'] },
    choice: { q: 'Os ladrões de túmulo são uma família faminta de Vindholt. O que fazer com eles?', opts: [
      { label: 'Pagar a dívida deles e mandá-los para casa', karma: 6, say: 'Você deu o seu ouro para quem roubava os meus mortos… Que o Olho te pague em dobro.', why: 'Quem rouba por fome rouba menos do que a fome rouba dele.' },
      { label: 'Entregá-los à justiça', karma: 1, say: 'A lei é a lei. Eles vão trabalhar até pagar.', why: 'A lei protege os mortos. Mas o Olho anota que você não olhou a fome.' },
      { label: 'Ficar com os anéis', karma: -8, say: '…Você ficou com os anéis? Saia do meu campo santo.', why: 'Roubar dos mortos e dos famintos ao mesmo tempo. Poucos conseguem.', flag: 'aneis_dos_mortos' }] } },
  { id: 'h19', chain: CN, name: 'O Mausoléu Maldito de Vindholt', lvl: 19, giver: BR, xp: 1, gold: 55, gear: 1, next: 'h20',
    text: 'Os mortos de Sandvik estão sendo chamados de dentro do Mausoléu Maldito de Vindholt, ao sul. Lá mora o Barão Maldito. Desça e acabe com a maldição da linhagem dele.',
    objs: [{ kind: 'dungeon', id: 'vindholt', name: 'Mausoléu Maldito de Vindholt' }],
    talk: ['A família contou outra coisa: os túmulos abrem sozinhos quando a lua passa por cima do mausoléu de Vindholt.', 'O Barão de Vindholt foi enterrado com a família inteira. E não gostou.'] },

  /* ---------------- Ato IV · Os charcos do oeste (19–21) ---------------- */
  { id: 'h20', chain: CN, name: 'Notícias dos charcos', lvl: 19, giver: BR, turnin: IV, xp: 1, gold: 25, next: 'h21',
    text: 'Um caçador de Skógar, nos charcos a oeste de Karmika, mandou pedir alguém que já tenha descido em cripta. É você. Atravesse para o oeste e fale com o Caçador Ivo.',
    objs: [{ kind: 'visit', poi: 'Skógar' }, { kind: 'talk', npc: IV }],
    talk: ['O Barão caiu. Sandvik dorme. Você virou assunto nas vilas.', 'Chegou um recado de Skógar, do outro lado do vale. Eles têm uma cripta também. E uma noiva que não descansa.'],
    meet: { [IV]: ['Você é a que limpou o mausoléu de Vindholt? Pensei que fosse mais alta.', 'Aqui nos charcos tem uma cripta velha. Hemara. Toda noite alguém escuta ela chorar.'] } },
  { id: 'h21', chain: CN, name: 'A noiva que não descansa', lvl: 20, giver: IV, xp: 1, gold: 60, gear: 1, next: 'h22',
    text: '◈ Com o Instinto ligado, encontre o espírito do Noivo de Hemara perto da cripta e ouça o que ele tem a dizer. Depois desça na Cripta de Hemara e dê descanso a ela.',
    objs: [{ kind: 'sense', what: 'espirito', label: 'Ouvir o espírito do noivo de Hemara', at: 'Cripta de Hemara', dx: -4, dy: 3, spirit: { name: 'Noivo de Hemara', lines: ['Eu prometi voltar antes do casamento. Voltei tarde. Morto.', 'Ela me esperou na cripta e virou outra coisa.', 'Não a odeie. Liberte.'] } }, { kind: 'dungeon', id: 'hemara', name: 'Cripta de Hemara' }],
    talk: ['Hemara era a noiva mais bonita dos charcos. Morreu esperando o noivo. Os dois estão aí até hoje, de um jeito ou de outro.', 'Dizem que o noivo vaga do lado de fora, e que só quem está atento consegue ouvir.', F],
    choice: { q: 'Hemara cai, e o espírito do noivo aparece para buscá-la. Ele pede o véu dela.', opts: [
      { label: 'Devolver o véu ao noivo', karma: 5, say: 'Os dois foram embora juntos. A cripta ficou em silêncio pela primeira vez em cem anos.', why: 'Você deu a um amor o fim que ele merecia.' },
      { label: 'Ficar com o véu (ele é valioso)', karma: -4, say: 'O noivo olhou para você e não disse nada. Ainda vaga lá fora.', why: 'Um véu bonito vale mais que um descanso? O Olho anotou o preço.' }] } },
  { id: 'h22', chain: CN, name: 'O cheiro de pólvora no pântano', lvl: 20, giver: IV, turnin: HU, xp: 1, gold: 40, next: 'h23',
    text: '◈ Contrabandistas atravessam os charcos com pólvora roubada da Academia. Vá até Vestheim, mais a oeste, derrube seis diabretes que guardam a trilha e, com o Instinto ligado, fareje a pólvora até o Atoleiro de Zerath. Depois conte à Juíza Hulda.',
    objs: [{ kind: 'visit', poi: 'Vestheim' }, { kind: 'kill', type: 'imp', n: 6 }, { kind: 'sense', what: 'cheiro', label: 'Farejar a pólvora dos contrabandistas', at: 'Atoleiro de Zerath', dx: 2, dy: 2, from: 'Vestheim' }, { kind: 'talk', npc: HU }],
    talk: ['Tem gente atravessando o charco à noite com caixas pesadas. E diabretes guardando a trilha. Diabrete não guarda nada de graça.', 'A Juíza Hulda, em Vestheim, paga por notícia certa.', F],
    meet: { [HU]: ['Pólvora da Academia no meu pântano. E diabretes de guarda. Isso tem dono.', 'O rastro termina no Atoleiro? Então eles usam o poço velho.'] } },
  { id: 'h23', chain: CN, name: 'O Poço do Atoleiro', lvl: 21, giver: HU, xp: 1, gold: 60, gear: 1, next: 'h24',
    text: 'Os contrabandistas guardam a pólvora no fundo do Poço do Atoleiro. Desça, chegue ao fundo e acabe com quem comanda a toca.',
    objs: [{ kind: 'dungeon', id: 'atoleiro', name: 'Poço do Atoleiro' }],
    talk: ['O poço velho do Atoleiro. Tem uma escada de pedra lá dentro, e o que mora no fundo não é contrabandista.', 'Desça. A lei de Vestheim vai até onde você for.'] },

  /* ---------------- Ato V · Subindo para a neve (22–24) ---------------- */
  { id: 'h24', chain: CN, name: 'As ovelhas de Hvítadalr', lvl: 22, giver: HU, turnin: RG, xp: 1, gold: 45, next: 'h25',
    text: '◈ No norte gelado, em Hvítadalr, as ovelhas da Pastora Ragnhild somem na neve. Suba até lá, derrube seis lobos gélidos e, com o Instinto ligado, siga as pegadas na neve até onde as ovelhas foram levadas.',
    objs: [{ kind: 'visit', poi: 'Hvítadalr' }, { kind: 'kill', type: 'frostwolf', n: 6 }, { kind: 'sense', what: 'rastro', label: 'Seguir as pegadas na neve', at: 'Hvítadalr', dx: 14, dy: 12 }, { kind: 'talk', npc: RG }],
    talk: ['A pólvora era para explodir a ponte de Hvítadalr. Por quê, ainda não sei.', 'A Ragnhild, a pastora de lá, escreveu dizendo que as ovelhas somem e os lobos não comem. Coisa estranha. Suba.', F],
    meet: { [RG]: ['As pegadas iam para o leste, para o Cume Gelado. E as ovelhas não estavam mortas.', 'Estavam dormindo na neve. Em volta de uma fenda.'] } },
  { id: 'h25', chain: CN, name: 'A fenda que respira', lvl: 22, giver: RG, xp: 1, gold: 65, gear: 1, next: 'h26',
    text: '◈ No Cume Gelado há uma fenda que solta um vapor gelado e faz os bichos dormirem. Com o Instinto ligado, encontre o espírito que guarda a entrada. Depois desça na Fenda do Cume Gelado.',
    objs: [{ kind: 'sense', what: 'espirito', label: 'Falar com o guardião da fenda', at: 'Cume Gelado', dx: -3, dy: 4, spirit: { name: 'Guardião do Gelo', lines: ['Quem desce aqui desce para sempre, dizem. Mentira. Desce quem pode.', 'Lá embaixo alguém canta uma canção sem fim. É a canção que faz dormir.', 'Cale a canção. Mas não cale o cantor antes de ouvir o último verso.'] } }, { kind: 'dungeon', id: 'cume', name: 'Fenda do Cume Gelado' }],
    talk: ['Eu não desço naquela fenda. Ninguém desce.', 'Mas você não é ninguém, é?', F] },
  { id: 'h26', chain: CN, name: 'O último verso', lvl: 23, giver: RG, turnin: BE, xp: 1, gold: 50, next: 'h27',
    text: '◈ A canção da fenda era a canção perdida de Fjallbrún. Leve a notícia ao Escaldo Bersi, mais ao norte, e, com o Instinto ligado, ache a pedra rúnica enterrada onde estava gravado o último verso. Derrube os lobos gélidos que rondam a vila.',
    objs: [{ kind: 'visit', poi: 'Fjallbrún' }, { kind: 'kill', type: 'frostwolf', n: 6 }, { kind: 'sense', what: 'dispositivo', label: 'Achar a pedra rúnica do último verso', at: 'Fjallbrún', dx: 10, dy: -8 }, { kind: 'talk', npc: BE }],
    talk: ['A canção da fenda… eu conheço. É de Fjallbrún. O escaldo de lá passou a vida procurando o último verso.', 'Vá contar a ele. E procure a pedra: quem grava canção em pedra não quer que ela morra.', F],
    meet: { [BE]: ['Você ouviu a canção. Inteira?', 'A pedra! Eu cavei este vale inteiro e não vi. Você viu porque o seu corpo viu antes de você.'] } },
  { id: 'h27', chain: CN, name: 'O gelo de Kaldrfoss', lvl: 23, giver: BE, turnin: UN, xp: 1, gold: 55, items: [['potion', 2]], next: 'h28',
    text: '◈ Um viajante ferido saiu de Fjallbrún para Kaldrfoss e não chegou. Vá para o leste, até a cachoeira congelada de Kaldrfoss. Com o Instinto ligado, siga o sangue dele na neve, derrube oito lobos gélidos e fale com a Barqueira Unn.',
    objs: [{ kind: 'sense', what: 'sangue', label: 'Seguir o sangue do viajante na neve', at: 'Kaldrfoss', dx: -12, dy: 8, from: 'Fjallbrún' }, { kind: 'kill', type: 'frostwolf', n: 8 }, { kind: 'talk', npc: UN }],
    talk: ['O verso diz: “quem atravessa o gelo em silêncio, atravessa duas vezes”. Um viajante saiu daqui ontem, ferido, para Kaldrfoss.', 'Ele carregava um recado para o passo de Midvangr. Ache-o.', F],
    meet: { [UN]: ['Ele chegou. Desmaiado, mas chegou. Disse que você vinha.', 'O recado é para o Torvald, em Midvangr. E não é bom.'] },
    choice: { q: 'O viajante ferido confessa: é um desertor da guarda de Midvangr.', opts: [
      { label: 'Levá-lo de volta para responder', karma: 2, say: 'Ele vai, mas vai de cabeça erguida. Melhor que fugir para sempre.', why: 'Responder pelo que fez é o começo do perdão.' },
      { label: 'Deixá-lo ir embora em paz', karma: 3, say: 'Ele chorou. Disse que não ia esquecer seu nome.', why: 'Às vezes quem foge já pagou demais.' },
      { label: 'Cobrar pelo silêncio', karma: -6, say: 'Ele pagou com o que tinha. E você aceitou.', why: 'Vender silêncio a um homem ferido. O Olho vê.' }] } },
  { id: 'h28', chain: CN, name: 'O nome do Draugr', lvl: 24, giver: TV, xp: 1, gold: 70, gear: 2, next: 'h29',
    text: '◈ O recado de Kaldrfoss fala dos Draugr: mortos de guerra que acordaram no Vale de Karmika, perto do Acampamento Draugr. Volte ao vale. Com o Instinto ligado, encontre o espírito do Draugr que ainda lembra o próprio nome. Depois desça no Túmulo dos Draugr.',
    objs: [{ kind: 'visit', poi: 'Midvangr' }, { kind: 'sense', what: 'espirito', label: 'Ouvir o Draugr que lembra o nome', at: 'Acampamento Draugr', dx: 3, dy: -2, spirit: { name: 'Draugr Ulfar', lines: ['Ulfar. Meu nome é Ulfar. Eu guardava este vale quando ele ainda não tinha nome.', 'Algo embaixo da Igreja Abandonada nos chama de volta. Um príncipe de cinzas.', 'Acabe com o túmulo. E depois com ele.'] } }, { kind: 'dungeon', id: 'draugr', name: 'Túmulo dos Draugr' }],
    talk: ['Midvangr guarda o passo há trezentos anos. E o passo guarda a história do vale.', 'O recado é claro: os Draugr do seu vale acordaram. Você vai ter que voltar para casa.', 'Antes, ouça um deles. Dizem que um Draugr ainda lembra o próprio nome.', F] },
  { id: 'h29', chain: CN, name: 'O Príncipe das Cinzas', lvl: 24, giver: 'Garrick', xp: 1, gold: 150, gear: 2, next: 'h30',
    text: '◈ Ulfar falou de um príncipe de cinzas embaixo da Igreja Abandonada. Com o Instinto ligado, siga o cheiro de enxofre desde as Ruínas de Aravel até a igreja e derrube o Príncipe das Cinzas. Não vá antes do nível 24.',
    objs: [{ kind: 'level', n: 24 }, { kind: 'sense', what: 'cheiro', label: 'Seguir o cheiro de enxofre até o Príncipe', at: 'Igreja Abandonada', dx: 2, dy: 3, from: 'Ruínas de Aravel' }, { kind: 'kill', type: 'prince', n: 1 }],
    talk: ['Você voltou. E voltou outra pessoa. Dá para ver pelo jeito de parar.', 'Eu ouvi os Draugr. Ouvi o nome. O Príncipe das Cinzas mora debaixo da Igreja Abandonada, onde você achou o Bento tanto tempo atrás.', 'Ele não é bicho. Ele pensa. Leve o Instinto aceso: o cheiro dele chega antes dele.', F] },
  { id: 'h30', chain: CN, name: 'Juramento do Norte', lvl: 25, giver: 'Garrick', xp: 1, gold: 200, title: 'Caminhante do Norte', next: 'a01',
    text: 'Você atravessou o vale de ponta a ponta: Lundr, o planalto, a Terra Maldita, os charcos, a neve e o passo. Jure diante de Garrick que vai proteger estas terras e receba o título de Caminhante do Norte.',
    objs: [{ kind: 'level', n: 25 }, { kind: 'talk', npc: 'Garrick' }],
    talk: ['Lundr. Hrafnhöfn. Steinfoss, Sandvik, Skógar, Vestheim. A neve, o passo. Todo mundo fala de você.', 'Quando chegou aqui, você tinha bota limpa. Olha a bota agora.', 'Jure. E depois vá para Askavik. Lá dizem o que você pode ser. Quem você é, você já provou aqui.'],
    done: ['Então está jurado.', 'Caminhante do Norte. Que o Olho te veja sempre de pé.'] },
];

/** as pontes (o “fio da meada”): para onde ir depois de cada missão, com o nome da vila e a direção */
export const ROAD_BRIDGES: Record<string, { name: string; say: string; text: string }> = {
  h02: { name: 'Alguém precisa de você', say: 'Você segura a espada direito. A Lúcia, perto da fonte, está pedindo ajuda.', text: 'A Lúcia, a aldeã que fica perto da fonte de Karmika, precisa de uma mão.' },
  h03: { name: 'O mercador da praça', say: 'Obrigada. O Thorin, o mercador, falou que precisava de mãos firmes.', text: 'O Thorin, mercador anão da praça, procura quem traga couro.' },
  h04: { name: 'De volta ao guarda', say: 'Couro bom. O Garrick estava procurando você.', text: 'O Garrick, ao lado do Quadro de Avisos, tem notícias da estrada.' },
  h05: { name: 'O sábio do templo', say: 'A estrada respira. O Eldrin pediu para ver você: disse que sente algo na sua alma.', text: 'Eldrin, o sábio do templo de Karmika, mandou chamar você.' },
  h06: { name: 'Ferramenta antes de descer', say: 'Antes de descer debaixo do cemitério, passe no Doran: ninguém desce sem ferramenta.', text: 'O Doran, armeiro de Karmika, ensina a fazer o próprio machado.' },
  h07: { name: 'De volta ao templo', say: 'Machado feito. O Eldrin espera você para falar da porta debaixo do cemitério.', text: 'Volte ao Eldrin, no templo.' },
  h08: { name: 'A mulher que espera', say: 'Os ossos dormem de novo. A Lúcia não dorme há dias: o marido não voltou.', text: 'A Lúcia tem um pedido que não é de inverno. É de coração.' },
  h09: { name: 'Uma carta para o leste', say: 'O Bento está em casa. O Garrick quer você: chegou um pedido de longe.', text: 'O Garrick tem uma carta para Lundr, a vila do bosque a leste. É a primeira vez que você sai do vale.' },
  h10: { name: 'A guarda-mor de Lundr', say: 'A Ilka está esperando você na praça de Lundr.', text: 'A Sargenta Ilka, de Lundr, tem trabalho para você.' },
  h11: { name: 'A toca achada', say: 'Você achou a toca. A Ilka quer você lá dentro.', text: 'Fale com a Ilka sobre a Toca do Covil dos Lobos.' },
  h12: { name: 'Um pedido do planalto', say: 'Lundr deve a você. E Hrafnhöfn, lá no planalto, precisa de você.', text: 'A Ilka recebeu um pedido de Hrafnhöfn, no Planalto de Askavik, a nordeste.' },
  h13: { name: 'O faroleiro', say: 'O Velho Ormur tem mais a pedir.', text: 'O Velho Ormur, faroleiro de Hrafnhöfn, precisa de ajuda em terra firme.' },
  h14: { name: 'A lente perdida', say: 'O Ormur quer falar do farol.', text: 'Volte ao Ormur: o farol continua apagado.' },
  h15: { name: 'Para a Terra Maldita', say: 'O farol acendeu. Mas o ladrão da lente fugiu de uma vila doente, ao sul.', text: 'O Ormur quer que alguém vá a Steinfoss, na Terra Maldita, ao sul.' },
  h16: { name: 'A curandeira', say: 'A Irmã Odila tem uma receita e pouca gente para ajudar.', text: 'Fale com a Irmã Odila, em Steinfoss.' },
  h17: { name: 'De onde vêm os mortos', say: 'A febre baixou. A Odila quer saber de onde vêm os mortos.', text: 'A Irmã Odila tem uma suspeita sobre a Catedral Abandonada.' },
  h18: { name: 'Um recado de Sandvik', say: 'A Odila recebeu um recado de Sandvik, a sudoeste.', text: 'A Irmã Odila tem um recado do Coveiro Bram, de Sandvik.' },
  h19: { name: 'O mausoléu do barão', say: 'O Bram sabe de onde os mortos são chamados.', text: 'Fale com o Coveiro Bram sobre o Mausoléu de Vindholt.' },
  h20: { name: 'Para os charcos do oeste', say: 'Sandvik dorme. Um caçador de Skógar, a oeste, pediu ajuda.', text: 'O Bram tem um recado do Caçador Ivo, de Skógar, nos charcos a oeste de Karmika.' },
  h21: { name: 'O caçador de Skógar', say: 'O Ivo quer falar da cripta.', text: 'Fale com o Caçador Ivo, em Skógar.' },
  h22: { name: 'Caixas no pântano', say: 'Hemara descansa. O Ivo viu caixas atravessando o pântano.', text: 'O Ivo viu contrabandistas nos charcos. Vestheim, mais a oeste, quer saber.' },
  h23: { name: 'A juíza de Vestheim', say: 'A Juíza Hulda sabe onde guardam a pólvora.', text: 'Fale com a Juíza Hulda, em Vestheim.' },
  h24: { name: 'Para o norte gelado', say: 'O poço está limpo. A pólvora era para Hvítadalr, no norte.', text: 'A Juíza Hulda manda você subir até Hvítadalr, no norte gelado.' },
  h25: { name: 'A pastora', say: 'A Ragnhild quer falar da fenda.', text: 'Fale com a Pastora Ragnhild, em Hvítadalr.' },
  h26: { name: 'A canção perdida', say: 'A canção da fenda é de Fjallbrún, mais ao norte.', text: 'A Ragnhild manda você contar ao Escaldo Bersi, em Fjallbrún.' },
  h27: { name: 'O verso diz para ir ao leste', say: 'O Bersi tem um último pedido.', text: 'Fale com o Escaldo Bersi sobre o viajante ferido.' },
  h28: { name: 'O passo de Midvangr', say: 'O recado é para o Torvald, em Midvangr, o passo ao norte.', text: 'A Barqueira Unn manda você levar o recado ao Guarda-Passo Torvald, em Midvangr.' },
  h29: { name: 'De volta para casa', say: 'Você precisa voltar ao vale. O Garrick tem que ouvir isso.', text: 'Volte a Karmika e conte tudo ao Garrick.' },
  h30: { name: 'O juramento espera', say: 'O Príncipe caiu. Quando estiver pronto, volte: tenho um juramento para você.', text: 'O Garrick quer tomar o seu juramento e lhe dar um título.' },
  a01: { name: 'Askavik chama', say: 'Você atravessou o vale inteiro. O Eldrin tem uma carta para os mestres de Askavik.', text: 'O Eldrin, no templo de Karmika, tem uma carta para os mestres de Askavik, a cidade de pedra a nordeste.' },
};
/** saves antigos: quem já fez a parte velha do vale (n01–n08) não refaz; a viagem (h09 em diante) começa para todos,
    mesmo quem já está no nível 24 — foi exatamente o que faltou (Erling, 25/10) */
export const ROAD_OLD: Record<string, string> = { h01: 'n01', h02: 'n02', h03: 'n03', h04: 'n04', h05: 'n05', h06: 'n06', h07: 'n07', h08: 'n08' };
/** falas antigas (falas.ts) que servem para as missões novas do vale */
export const FALA_ALIAS: Record<string, string> = { h01: 'n01', h02: 'n02', h03: 'n03', h04: 'n04', h06: 'n06' };
