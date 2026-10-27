/* ---------- Rituais de travessia, Renegados e Desgarrados (Erling, 27/10/2026) ----------
   Cada caminho tem uma natureza (karma.ts). A alma pode se afastar dela até o neutro, e ali ela sofre: é a beira do precipício
   kármico. O zero é uma parede: não se passa para o outro lado andando. No zero o Olho abre o ritual da classe:
   - quem é da luz faz o RITUAL DA QUEDA: grita, uma explosão negra apaga a luz e a alma cai para −50;
   - quem é da sombra faz o RITUAL DO RENASCIMENTO: explode em luz, o karma se limpa e a alma sobe para +50.
   Quem atravessa vira uma ABERRAÇÃO KÁRMICA: RENEGADO (da sombra para a luz: vampiros, bruxos e lobisomens renegados) ou
   DESGARRADO (da luz para a sombra: paladinos, magos, caçadores… que largaram a luz). Não ficam mais fracos por isso:
   a nova posição vira a sua casa. Ganham uma Lágrima do Olho e passam a ver as missões do seu clã, que os mesmos NPCs
   das cidades dão só para eles. O caminho de volta existe: no zero de novo, o ritual do RETORNO devolve a alma à natureza. */
import type { QuestDef } from './quests';
import type { Madness } from './karma';

export type Outcast = 'renegado' | 'desgarrado';
export const OUTCAST_NAME: Record<Outcast, string> = { renegado: 'Renegado', desgarrado: 'Desgarrado' };

/** o ritual de cada caminho: o que se faz para atravessar (difícil de propósito: no zero a alma está no fundo da fraqueza) */
const RIT: Record<string, { fall: boolean; name: string; text: string; objs: QuestDef['objs']; lvl: number }> = {
  pal: { fall: true, lvl: 34, name: 'A Queda do Paladino', text: 'A fé já não segura você. Para cair de vez, desça à Catedral Abandonada, derrube os templários que ainda guardam a estrada de Auréon e enfrente o Paladino Negro que caiu antes de você. Ele sabe o caminho.', objs: [{ kind: 'kill', type: 'templar', n: 6 }, { kind: 'kill', type: 'darkpal', n: 1 }, { kind: 'visit', poi: 'Catedral Abandonada' }] },
  mag: { fall: true, lvl: 34, name: 'A Queda do Mago', text: 'Os livros não respondem mais. Vá ao Pináculo de Marfim, deixe que a Fada Rainha leia a sua alma e quebre os selos da Grande Biblioteca com as próprias mãos.', objs: [{ kind: 'kill', type: 'fairyqueen', n: 1 }, { kind: 'visit', poi: 'Pináculo de Marfim' }, { kind: 'visit', poi: 'Grande Biblioteca' }] },
  cac: { fall: true, lvl: 34, name: 'A Queda do Caçador', text: 'Você caçou monstros até virar um. Encare os Inquisidores que vão vir atrás de você e entre no Vale da Desgraça sem a prata.', objs: [{ kind: 'kill', type: 'inquisitor', n: 3 }, { kind: 'kill', type: 'hellhound', n: 5 }, { kind: 'visit', poi: 'Vale da Desgraça' }] },
  vam: { fall: false, lvl: 34, name: 'O Renascimento do Vampiro', text: 'A sede ainda chama, mas você não responde. Volte ao Castelo da Colina Vampírica, derrube os capangas do Conde e o demônio que se banqueteia lá dentro. Só então o sangue se cala.', objs: [{ kind: 'kill', type: 'thrall', n: 6 }, { kind: 'kill', type: 'glutton', n: 1 }, { kind: 'visit', poi: 'Castelo da Colina Vampírica' }] },
  bru: { fall: false, lvl: 34, name: 'O Renascimento do Bruxo', text: 'Para sair do pacto é preciso pagar o pacto. Derrube os pactários quebrados e o Senhor do Suplício que cobra as dívidas no Vale da Desgraça.', objs: [{ kind: 'kill', type: 'pactbroken', n: 3 }, { kind: 'kill', type: 'suplicio', n: 1 }, { kind: 'visit', poi: 'Vale da Desgraça' }] },
  lob: { fall: false, lvl: 34, name: 'O Renascimento do Lobisomem', text: 'A Besta não sai sozinha. Vá à Árvore-Mãe do Uivo, derrube os lobisomens que ainda uivam por você e o Lobo-Rei que manda na alcateia.', objs: [{ kind: 'kill', type: 'werewolf', n: 6 }, { kind: 'kill', type: 'alpha', n: 1 }, { kind: 'visit', poi: 'Árvore-Mãe do Uivo' }] },
};
/** o ritual que se abre no zero: `back` = a aberração voltando para a natureza do caminho */
export function ritualFor(path: string, back: boolean): QuestDef | null {
  const r = RIT[path]; if (!r) return null; const fall = back ? !r.fall : r.fall;
  const name = back ? (fall ? 'A Volta à Sombra' : 'A Volta à Luz') + ` (${r.name.split(' do ')[1] ?? path})` : r.name;
  const text = back ? `Você atravessou uma vez e agora está no zero de novo. O caminho de volta à sua natureza é o mesmo chão, ao contrário: ${r.text.charAt(0).toLowerCase()}${r.text.slice(1)}` : r.text;
  return { id: (back ? 'ret_' : 'rit_') + path, name, lvl: r.lvl, giver: 'O Olho', turnin: 'O Olho', text: `${text}\nVocê está no fundo da fraqueza kármica: vá preparado.`, objs: r.objs, xp: 2400, gold: 0 } as QuestDef;
}
export const ritualIsFall = (path: string, back: boolean) => { const r = RIT[path]; return r ? (back ? !r.fall : r.fall) : false; };

/* as missões do clã: os mesmos NPCs das cidades, mas só quem é Renegado ou Desgarrado as vê */
const O = (id: string, outcast: Outcast, giver: string, lvl: number, name: string, text: string, objs: QuestDef['objs'], talk: string[], done: string): QuestDef =>
  ({ id, chain: outcast === 'renegado' ? 'Os Renegados' : 'Os Desgarrados', outcast, name, lvl, giver, text, objs, xp: 600 + lvl * 25, gold: 40 + lvl * 3, gear: 1, talk, done: [done] } as QuestDef);
export const OUTCAST_QUESTS: QuestDef[] = [
  O('ren01', 'renegado', 'Eldrin', 32, 'Os que voltaram', 'Há outros como você. Os Renegados se reconhecem pelo silêncio: ninguém confia neles de nenhum dos lados. Vá ao Cemitério Esquecido e enterre de novo os mortos que o seu antigo lado levantou.', [{ kind: 'kill', type: 'skeleton', n: 10 }, { kind: 'kill', type: 'necro', n: 1 }],
    ['Eu sei o que você era. O Olho também sabe.', 'Quem volta da sombra carrega a sombra no bolso por um tempo. Os Renegados se ajudam porque mais ninguém ajuda.'], 'Os mortos dormem. Um a menos no débito que você carrega.'),
  O('ren02', 'renegado', 'Morwen', 34, 'O antídoto do sangue', 'O sangue antigo ainda chama nas noites de lua. Traga presas e pó de fada: faço um tônico que cala a sede por uma estação. Os Renegados precisam dele mais do que eu.', [{ kind: 'kill', type: 'vampire', n: 6 }, { kind: 'collect', item: 'dust', n: 4 }],
    ['Senta. Não, não vou contar a ninguém o que você foi.', 'Os vampiros renegados vêm aqui às escondidas pelo tônico. Ajude a fazer mais.'], 'Aqui. Leve um frasco e deixe os outros com os Renegados da estrada.'),
  O('ren03', 'renegado', 'Garrick', 36, 'Provar na lâmina', 'A guarda não confia em quem já foi da sombra. Mostre de que lado você está agora: o Negociante de Gente leva reféns pelas estradas do sul.', [{ kind: 'kill', type: 'slaver', n: 3 }, { kind: 'kill', type: 'bandit', n: 8 }],
    ['Os soldados cospem quando você passa. Eu não. Ainda.', 'Solte os reféns que aquele negociante arrasta. Aí a gente conversa.'], 'Os reféns voltaram para casa contando de você. Isso pesa mais do que qualquer juramento.'),
  O('ren04', 'renegado', 'Orm', 38, 'A taverna dos que voltaram', 'Os Renegados se encontram nos fundos da minha estalagem. Um deles foi caçado por um Inquisidor que não acredita em arrependimento. Faça o Inquisidor desistir.', [{ kind: 'kill', type: 'inquisitor', n: 2 }],
    ['Fala baixo. Os fundos são para gente como você.', 'Um Inquisidor anda farejando a mesa deles. Ele não entende que alma pode mudar de lado.'], 'A mesa dos fundos brinda a você hoje. Bebida por minha conta.'),
  O('des01', 'desgarrado', 'Eldrin', 32, 'Os que caíram', 'Os Desgarrados não têm templo, mas têm memória. Desça ao Mausoléu do Bispo e traga o que os primeiros caídos deixaram lá embaixo.', [{ kind: 'visit', poi: 'Mausoléu do Bispo' }, { kind: 'kill', type: 'skel_arch', n: 8 }],
    ['A luz deixou você e você deixou a luz. Não precisa me explicar.', 'Os Desgarrados guardam a história dos que caíram antes. Lá embaixo há nomes que você vai querer ler.'], 'Esses nomes são seus irmãos agora. Que a queda tenha sentido.'),
  O('des02', 'desgarrado', 'Morwen', 34, 'Cinzas da antiga fé', 'Os templários perseguem quem largou a luz. Traga as insígnias deles e eu faço delas um amuleto que esconde o que você foi.', [{ kind: 'kill', type: 'templar', n: 6 }, { kind: 'collect', item: 'gem', n: 1 }],
    ['Quem largou a luz chama atenção dos dois lados.', 'Com as insígnias dos templários eu escondo a marca que a queda deixou.'], 'Pronto. Agora a marca fica debaixo da pele, e só o Olho vê.'),
  O('des03', 'desgarrado', 'Thorin', 36, 'Negócio na sombra', 'Os Desgarrados compram e vendem o que a Igreja proíbe. Um carregamento parou no Vale da Desgraça, cercado de cães do inferno. Busque.', [{ kind: 'kill', type: 'hellhound', n: 6 }, { kind: 'visit', poi: 'Vale da Desgraça' }],
    ['Negócio é negócio. Não pergunto de onde você veio.', 'Os seus novos amigos têm uma carga presa no Vale. Traga e a sua parte é generosa.'], 'Carga em dia. Os Desgarrados vão lembrar do seu nome.'),
  O('des04', 'desgarrado', 'Corwin', 38, 'A fera que escolheu você', 'Quem cai ganha olhos novos. No Covil dos Lobos há um Lobo-Rei que só respeita quem já esteve do outro lado. Vença-o e ele deixa você passar entre os dele.', [{ kind: 'kill', type: 'alpha', n: 1 }, { kind: 'kill', type: 'wolf', n: 8 }],
    ['Os bichos sentem a queda. Eles chegam mais perto de você agora.', 'O Lobo-Rei não obedece a ninguém da luz. Talvez obedeça a você.'], 'Ouviu? Os lobos uivaram o seu nome. Isso é raro.'),
];

/* loucura kármica (guerreiro e tecnocrata): o realinhamento e as missões de cada loucura (só quem está nela as vê) */
const REAL: Record<Madness, { name: string; text: string; objs: QuestDef['objs'] }> = {
  berserker: { name: 'Realinhamento do Berserker', text: 'Para o sangue esfriar é preciso largar a lâmina por um tempo. Colha ervas com as mãos, ouça o Sábio do Templo e suba à Fortaleza de Odin para pedir perdão aos que você matou sem precisar.', objs: [{ kind: 'collect', item: 'herb_g', n: 6 }, { kind: 'talk', npc: 'Eldrin' }, { kind: 'visit', poi: 'Fortaleza de Odin' }] },
  ermitao: { name: 'Realinhamento do Ermitão', text: 'Odin não quer um guerreiro escondido na roça. Pegue a lâmina de novo: os lobos gélidos e o Troll das Pedras cercam Bjarnholt.', objs: [{ kind: 'kill', type: 'frostwolf', n: 6 }, { kind: 'kill', type: 'troll', n: 1 }, { kind: 'visit', poi: 'Fortaleza de Odin' }] },
  louco: { name: 'Realinhamento do Cientista Louco', text: 'As suas criaturas andam soltas. Derrube os engenhoqueiros que enlouqueceram como você e leve as anotações à Grande Biblioteca, onde a ciência ainda tem limites.', objs: [{ kind: 'kill', type: 'tinker', n: 4 }, { kind: 'kill', type: 'automaton', n: 4 }, { kind: 'visit', poi: 'Grande Biblioteca' }] },
  academico: { name: 'Realinhamento do Acadêmico', text: 'Os cadernos não protegem ninguém. Volte ao campo: as torretas da Ferrugem atiram em quem passa, e só um tecnocrata sabe desligá-las.', objs: [{ kind: 'kill', type: 'turret', n: 4 }, { kind: 'kill', type: 'automaton', n: 6 }, { kind: 'visit', poi: 'Ferrugem' }] },
};
export function realignFor(m: Madness): QuestDef { const r = REAL[m]; return { id: 'real_' + m, name: r.name, lvl: 30, giver: 'O Olho', turnin: 'O Olho', text: r.text + '\nCumprido o realinhamento, a alma volta ao meio (0).', objs: r.objs, xp: 2000, gold: 0 } as QuestDef; }
const M = (id: string, madness: Madness, giver: string, lvl: number, name: string, text: string, objs: QuestDef['objs'], talk: string[], done: string): QuestDef =>
  ({ id, chain: 'Loucura kármica', madness, name, lvl, giver, text, objs, xp: 500 + lvl * 20, gold: 30 + lvl * 3, talk, done: [done] } as QuestDef);
export const MADNESS_QUESTS: QuestDef[] = [
  M('ber01', 'berserker', 'Garrick', 30, 'Sangue além da conta', 'Você não para. Então pelo menos mate o que ameaça a vila: lobos e javalis, muitos.', [{ kind: 'kill', type: 'wolf', n: 12 }, { kind: 'kill', type: 'boar', n: 8 }], ['Os seus olhos estão vermelhos de novo.', 'Se vai matar, mate o que nos ataca. Não me faça arrepender.'], 'Chega. Por hoje, chega. Vá lavar essas mãos.'),
  M('ber02', 'berserker', 'Thorin', 32, 'A arena dos salteadores', 'Os acampamentos das estradas pagam a quem derruba o chefe deles. Você vai de qualquer jeito, não vai?', [{ kind: 'kill', type: 'bandit_chief', n: 2 }, { kind: 'kill', type: 'bandit', n: 10 }], ['Dizem que você entrou num acampamento sozinho e saiu rindo.', 'Tem gente que paga por isso. Eu fico com a minha parte.'], 'Os soldados já perguntam por você. Cuidado: tem quem ache que você é o próximo bandido.'),
  M('erm01', 'ermitao', 'Lúcia', 30, 'Terra e silêncio', 'Você largou a espada e pegou a enxada. A vila agradece: lenha e ervas para o inverno.', [{ kind: 'collect', item: 'wood', n: 10 }, { kind: 'collect', item: 'herb_g', n: 6 }], ['Nunca pensei que veria você colhendo ervas.', 'Não pergunto nada. Só traga lenha e erva para o inverno.'], 'A vila vai ter um inverno quente graças a você.'),
  M('erm02', 'ermitao', 'Gunnar', 32, 'A cabana do ermitão', 'Quem não luta constrói. Faça pregos e tábuas: a casa dos velhos do vale precisa de telhado novo.', [{ kind: 'craft', recipe: 'Pregos', n: 3 }, { kind: 'collect', item: 'plank', n: 8 }], ['Mãos de guerreiro, cabeça de ermitão.', 'Martelo também é arma. Contra a goteira.'], 'Telhado novo. Os velhos querem saber o seu nome.'),
  M('lou01', 'louco', 'Morwen', 30, 'Cobaias do lodo', 'Para o seu experimento você quer corpos que ainda se mexem. Os zumbis do lodo servem. Eu não quero saber para quê.', [{ kind: 'kill', type: 'mudzombie', n: 6 }, { kind: 'collect', item: 'dust', n: 4 }], ['Esse brilho no seu olho me dá medo.', 'Leve o que precisa e não volte aqui com nada vivo dentro do frasco.'], 'Eu vi o que você fez com aquilo. Por favor, pare enquanto dá.'),
  M('lou02', 'louco', 'Corwin', 32, 'A criatura de latão', 'Você quer montar a sua própria fera de latão. Peças só se arrancam dos autômatos que andam sozinhos, e seiva viva para a junta.', [{ kind: 'kill', type: 'automaton', n: 5 }, { kind: 'collect', item: 'sap', n: 3 }], ['Bicho a gente cria com carinho, não com parafuso.', 'Pegue as peças. Mas a culpa do que nascer disso é sua.'], 'Isso ainda respira? Não me conte.'),
  M('aca01', 'academico', 'Eldrin', 30, 'O catálogo dos lugares', 'Você só quer catalogar. Então catalogue: a Grande Biblioteca, o Pináculo de Marfim e o Cemitério Esquecido, com medida e data.', [{ kind: 'visit', poi: 'Grande Biblioteca' }, { kind: 'visit', poi: 'Pináculo de Marfim' }, { kind: 'visit', poi: 'Cemitério Esquecido' }], ['Você anda com um caderno e mais nada.', 'Os lugares antigos merecem um catálogo. Só não esqueça de comer.'], 'Catálogo impecável. Faltou só você viver um pouco.'),
  M('aca02', 'academico', 'Eldrin', 32, 'Negócio de gabinete', 'Os achados do seu gabinete valem ouro na estrada. Leve uma gema à Caravana de Gaspar e negocie.', [{ kind: 'collect', item: 'gem', n: 1 }, { kind: 'talk', npc: 'Caravana de Gaspar' }], ['Você virou mercador de gabinete.', 'Gaspar compra o que a academia cataloga. Vá.'], 'Bom negócio. Mas quando foi a última vez que você lutou?'),
];
