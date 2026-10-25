import { G } from './genero';
import { HUMAN_ROAD, ROAD_BRIDGES, ROAD_OLD, FALA_ALIAS } from './campanha';
import { DWARF_ROAD, ELF_ROAD, RACE_CALLS, RACE_BRIDGES } from './racas';
import { questLimit, isPremium } from './premium';
import type { Step } from './dialog';
import { FALAS } from './falas';
/** Missões: cadeia de profissão (1→25) + quadro procedural infinito. Salvo em localStorage. */
import type { EnemyType } from './world';
import { ITEMS } from './inventory';
import { DEFS } from './enemies';

export type Obj =
  | { kind: 'kill'; type: EnemyType; n: number }
  | { kind: 'collect'; item: string; n: number }
  | { kind: 'talk'; npc: string }
  | { kind: 'visit'; poi: string }
  | { kind: 'craft'; recipe: string; n: number }
  | { kind: 'level'; n: number }
  /** vencer uma masmorra ou caverna até o chefe (masmorras.ts: onClear) */
  | { kind: 'dungeon'; id: string; name: string }
  | SenseObj
  /** escoltar uma caravana da Companhia de Latão até o fim da rota (caravanas.ts) */
  | { kind: 'escort'; route: string; label: string }
  /** limpar a caravana caída num ponto da rota (at = fração da estrada) */
  | { kind: 'rescue'; route: string; label: string; at: number; note?: string };
export type SenseWhat = 'rastro' | 'sangue' | 'espirito' | 'dispositivo' | 'cheiro' | 'ninho';
/** só com o Instinto de classe ligado (tecla F): seguir um rastro, achar um espírito ou um dispositivo perdido (segredos.ts).
    at/from são lugares do mapa (vila ou ponto de interesse); dx/dy deslocam em casas; from é de onde o rastro vem */
export type SenseObj = { kind: 'sense'; what: SenseWhat; label: string; at: string; dx?: number; dy?: number; from?: string; spirit?: { name: string; lines: string[] } };
export interface QuestDef { id: string; name: string; lvl: number; giver: string; turnin?: string; text: string; objs: Obj[]; xp: number; gold: number; items?: [string, number][]; gear?: number; title?: string; next?: string; chain?: string; board?: boolean;
  /** missão que precisa estar feita antes (ex.: o teste do caminho) */ req?: string;
  /** missão-ponte da história (o fio da meada): só costura uma missão amarela na outra */ bridge?: boolean;
  /** só aparece para quem tem a alma pendendo para este lado (24/10) */ lean?: 'luz' | 'sombra';
  /** só para quem nasceu humano, elfo ou anão (as missões do instinto da raça) */ origin?: 'human' | 'elf' | 'dwarf';
  /** conversa ao pegar (antes do cartão da missão) e ao entregar (antes da recompensa) — dialog.ts */ talk?: Step[]; done?: Step[];
  /** conversa ao encontrar quem a missão manda procurar (objetivo 'talk'): o encontro tem diálogo próprio */ meet?: Record<string, Step[]>;
  /** escolha kármica na entrega: o MOTIVO pesa (regra 10) */ choice?: { q: string; opts: { label: string; karma: number; say: string; why: string; /** marca que o mundo lembra */ flag?: string }[] } }

const ENEMY_NAME = (t: EnemyType) => DEFS[t]?.name ?? t;
export const objText = (o: Obj): string => o.kind === 'dungeon' ? `Vencer: ${o.name}` : o.kind === 'kill' ? `Derrotar ${o.n}× ${ENEMY_NAME(o.type)}` : o.kind === 'collect' ? `Juntar ${o.n}× ${ITEMS[o.item]?.name ?? o.item}` : o.kind === 'talk' ? `Falar com ${o.npc}` : o.kind === 'visit' ? `Chegar a ${o.poi}` : o.kind === 'craft' ? `Criar ${o.n}× ${o.recipe}` : o.kind === 'escort' ? `Escoltar a caravana: ${o.label}` : o.kind === 'rescue' ? `Salvar a caravana caída: ${o.label}` : o.kind === 'sense' ? `✧ ${o.label} (Instinto ligado)` : `Alcançar o nível ${o.n}`;

/* ---------- Caminho do Norte: de aprendiz a Guerreira do Norte (níveis 1–25) ---------- */
export const NORTH: QuestDef[] = [
  { id: 'n01', chain: 'Caminho do Norte', name: 'Primeiros passos', lvl: 1, giver: 'Garrick', text: 'As ratazanas rubras infestam o cemitério e os arredores. Prove que sabe segurar uma espada: derrube três.', objs: [{ kind: 'kill', type: 'rat', n: 3 }], xp: 40, gold: 10, next: 'n02' },
  { id: 'n02', chain: 'Caminho do Norte', name: 'Galhos para o fogo', lvl: 2, giver: 'Lúcia', text: 'O inverno chega cedo em Karmika. Junte galhos secos nas árvores ao redor da cidade (E perto de uma árvore).', objs: [{ kind: 'collect', item: 'stick', n: 6 }], xp: 50, gold: 5, items: [['bread', 2]], next: 'n03' },
  { id: 'n03', chain: 'Caminho do Norte', name: 'Couro para o mercador', lvl: 3, giver: 'Thorin', text: 'Preciso de couro de cervo ou lobo. Traga três peças e eu pago bem.', objs: [{ kind: 'collect', item: 'hide', n: 3 }], xp: 70, gold: 25, next: 'n04' },
  { id: 'n04', chain: 'Caminho do Norte', name: 'Coiotes da estrada', lvl: 4, giver: 'Garrick', text: 'Coiotes atacam viajantes nas campinas. Cace cinco.', objs: [{ kind: 'kill', type: 'coyote', n: 5 }], xp: 90, gold: 20, next: 'n05' },
  { id: 'n05', chain: 'Caminho do Norte', name: 'O Cemitério Esquecido', lvl: 5, giver: 'Eldrin', text: 'Vá ao Cemitério Esquecido e sinta o peso das almas que não descansam. Volte e me conte.', objs: [{ kind: 'visit', poi: 'Cemitério Esquecido' }], xp: 100, gold: 15, next: 'n06' },
  { id: 'n06', chain: 'Caminho do Norte', name: 'Pedra e corda', lvl: 6, giver: 'Doran', text: 'Um guerreiro que não sabe fazer um machado não merece uma espada. Colete pedras e crie um Machado de Pedra (menu I).', objs: [{ kind: 'collect', item: 'stone', n: 4 }, { kind: 'craft', recipe: 'Machado de Pedra', n: 1 }], xp: 120, gold: 20, items: [['flint', 1]], next: 'n07' },
  { id: 'n07', chain: 'Caminho do Norte', name: 'Lobos do leste', lvl: 8, giver: 'Garrick', text: 'A alcateia do leste cresceu demais. Seis lobos a menos e a cidade dorme em paz.', objs: [{ kind: 'kill', type: 'wolf', n: 6 }], xp: 180, gold: 40, next: 'n08' },
  { id: 'n08', chain: 'Caminho do Norte', name: 'O marido desaparecido', lvl: 10, giver: 'Lúcia', text: 'Meu marido foi caçar ao norte e nunca voltou. Dizem que a Igreja Abandonada guarda segredos. Procure por ele e afaste os puglins.', objs: [{ kind: 'visit', poi: 'Igreja Abandonada' }, { kind: 'kill', type: 'puglin', n: 4 }], xp: 220, gold: 30, items: [['potion', 1]], next: 'n09' },
  { id: 'n09', chain: 'Caminho do Norte', name: 'Madeira de lei', lvl: 12, giver: 'Doran', text: 'Preciso de madeira para os cabos. Derrube árvores com o machado e traga dez toras.', objs: [{ kind: 'collect', item: 'wood', n: 10 }], xp: 200, gold: 35, next: 'n10' },
  { id: 'n10', chain: 'Caminho do Norte', name: 'Pó de fada', lvl: 14, giver: 'Eldrin', text: 'As fadas maliciosas guardam um pó que brilha no escuro. Traga quatro medidas.', objs: [{ kind: 'collect', item: 'dust', n: 4 }], xp: 260, gold: 40, items: [['potion', 2]], next: 'n11' },
  { id: 'n11', chain: 'Caminho do Norte', name: 'Javalis do pântano', lvl: 16, giver: 'Garrick', text: 'Os javalis do pântano destroem as plantações. Cace seis.', objs: [{ kind: 'kill', type: 'boar', n: 6 }], xp: 320, gold: 50, next: 'n12' },
  { id: 'n12', chain: 'Caminho do Norte', name: 'Seiva do guardião', lvl: 18, giver: 'Thorin', text: 'A seiva viva do Guardião da Mata vale ouro. Consiga uma medida — se sobreviver.', objs: [{ kind: 'collect', item: 'sap', n: 1 }], xp: 380, gold: 60, next: 'n13' },
  { id: 'n13', chain: 'Caminho do Norte', name: 'O Guardião da Mata', lvl: 20, giver: 'Garrick', text: 'O Guardião da Mata enlouqueceu e ataca lenhadores. Derrube-o. Não vá verde: quem foi abaixo do nível 20 virou adubo. Cace, ajude o povo e volte forte.', objs: [{ kind: 'level', n: 20 }, { kind: 'kill', type: 'treant', n: 1 }], xp: 450, gold: 80, gear: 1, next: 'n14' },
  { id: 'n14', chain: 'Caminho do Norte', name: 'Diabretes das ruínas', lvl: 22, giver: 'Eldrin', text: 'Diabretes saíram das ruínas. Cinco deles a menos.', objs: [{ kind: 'kill', type: 'imp', n: 5 }], xp: 520, gold: 90, next: 'n15' },
  { id: 'n15', chain: 'Caminho do Norte', name: 'O Príncipe das Cinzas', lvl: 24, giver: 'Garrick', text: 'Na Igreja Abandonada reina o Príncipe das Cinzas. Nenhum aprendiz voltou de lá. Você não é mais um aprendiz, mas também não é um herói ainda: chegue ao nível 24 antes de entrar.', objs: [{ kind: 'level', n: 24 }, { kind: 'kill', type: 'prince', n: 1 }], xp: 800, gold: 150, gear: 2, next: 'n16' },
  { id: 'n16', chain: 'Caminho do Norte', name: 'Juramento do Norte', lvl: 25, giver: 'Garrick', text: 'Jure diante de mim que protegerá estas terras, venha o que vier, e receba o título de Caminhante do Norte. O que você vai ser, a Vidente de Askavik ajuda a descobrir. Quem você é, já provou aqui.', objs: [{ kind: 'level', n: 25 }, { kind: 'talk', npc: 'Garrick' }], xp: 1000, gold: 200, title: 'Caminhante do Norte', next: 'a01' },
];


/* ---------- O fio da meada: missões-ponte da história ----------
   Toda missão amarela, ao ser entregue, aponta a próxima: "vá falar com Fulano, em tal lugar". Se ainda falta nível,
   a ponte diz isso com todas as letras e manda ajudar o povo (azuis e Quadro) até lá. Dão pouco XP: só costuram a história. */
/** fração do XP de cada trecho da história que a missão amarela paga (com as pontes, ~60% do total) */
export const STORY_SHARE = 0.5; /* 25/10: a campanha ganhou o dobro de missões; cada uma paga um pouco menos, a soma fica parecida */
export const STORY_THREAD = [...HUMAN_ROAD.map((d) => d.id), 'a01', 'a02', 'a03', 'a04', 'p01']; /* o Caminho do Norte agora viaja (campanha.ts) */
/** o fio da história de cada povo (25/10): humanos, anões e elfos têm a própria campanha do 1 ao 25 e se encontram em Askavik */
export const STORY_THREADS: Record<'human' | 'dwarf' | 'elf', string[]> = {
  human: STORY_THREAD,
  dwarf: [...DWARF_ROAD.map((d) => d.id), 'a01an', 'a02', 'a03', 'a04', 'p01'],
  elf: [...ELF_ROAD.map((d) => d.id), 'a01el', 'a02', 'a03', 'a04', 'p01'],
};
export const RACE_ROADS: QuestDef[] = [...DWARF_ROAD, ...ELF_ROAD, ...RACE_CALLS];
/** a Chamada de Askavik vale para os três povos: quem fez a do seu povo conta como quem fez 'a01' */
const DONE_ALIAS: Record<string, string[]> = { a01: ['a01an', 'a01el'] };
/** saves antigos: quem já passou de 'Os Caminhos' não recebe as missões de Askavik que entraram depois (23/10) */
const THREAD_SKIP: Record<string, string> = { a02: 'p01', a03: 'p01', a04: 'p01', ...ROAD_OLD };
const BRIDGE_TXT: Record<string, { name: string; say: string; text: string }> = {
  n02: { name: 'Alguém precisa de você', say: 'Você segura a espada direito. Mas Karmika não vive só de espada: a Lúcia está pedindo ajuda.', text: 'Garrick viu do que você é capaz. A Lúcia, a aldeã que fica perto da fonte, está preocupada com o inverno. Você faz diferença aqui: vá até ela.' },
  n03: { name: 'O mercador da praça', say: 'Obrigada, de verdade. O Thorin, o mercador, comentou que precisava de mãos firmes.', text: 'O Thorin, o mercador anão da praça, anda reclamando que ninguém traz couro. Ele paga bem, e um caminhante precisa de ouro.' },
  n04: { name: 'De volta ao guarda', say: 'Couro bom. O Garrick estava procurando você: a estrada anda perigosa.', text: 'O Garrick, o guarda ao lado do Quadro de Avisos, tem notícias da estrada. Vá ouvir.' },
  n05: { name: 'O sábio do templo', say: 'A estrada respira de novo. O Eldrin, no templo, pediu para ver você: disse que sente algo na sua alma.', text: 'Eldrin, o sábio do templo de Karmika (ao norte da praça), mandou chamar você. Ele não chama ninguém à toa.' },
  n06: { name: 'O armeiro de Karmika', say: 'As almas do cemitério se lembram de quem as visita. Agora vá ao Doran: alma sem ferramenta não atravessa o inverno.', text: 'Doran, o armeiro no leste da vila, ensina a todo aprendiz a fazer o próprio machado. Vá até a forja dele.' },
  n07: { name: 'Uma alcateia no leste', say: 'Machado bem feito. O Garrick vai querer você na linha de frente.', text: 'O Garrick precisa de alguém para a alcateia do leste.' },
  n08: { name: 'A mulher que espera', say: 'Seis lobos a menos. A Lúcia não dorme há dias: o marido dela não voltou da caçada.', text: 'A Lúcia tem um pedido que não é de inverno. É de coração. Procure-a perto da fonte.' },
  n09: { name: 'Madeira para a forja', say: 'Você trouxe notícias, e isso já é muito. O Doran está sem madeira para os cabos.', text: 'O Doran precisa de madeira de lei. Quem corta árvore aprende a ter paciência. Dica: a Igreja Abandonada não é a única coisa estranha por aqui — dizem que, à noite, a Catedral ao sul chama os corajosos.' },
  n10: { name: 'O sábio quer ver você', say: 'Cabos novos, armas firmes. O Eldrin mandou recado: precisa de algo que só se acha no escuro.', text: 'O Eldrin, no templo, está estudando as fadas maliciosas. Ele quer a sua ajuda.' },
  n11: { name: 'O pântano reclama', say: 'O pó das fadas conta coisas. O Garrick está aflito com os javalis do pântano.', text: 'O Garrick quer falar sobre o pântano e as plantações.' },
  n12: { name: 'Um negócio arriscado', say: 'As plantações agradecem. O Thorin tem um negócio que só alguém como você aguenta.', text: 'O Thorin quer seiva viva do Guardião da Mata. Escute o que ele tem a dizer antes de ir.' },
  n13: { name: 'O Guardião enlouqueceu', say: 'Seiva viva… então é verdade: o Guardião sangra. O Garrick precisa saber disso.', text: 'Leve ao Garrick a notícia do Guardião da Mata. Ele vai pedir o que ninguém mais tem coragem de fazer.' },
  n14: { name: 'Sombras nas ruínas', say: 'A mata respira. Mas o Eldrin sentiu outra coisa se mexendo: diabretes saindo das ruínas.', text: 'O Eldrin sentiu algo nas ruínas. Volte ao templo.' },
  n15: { name: 'O que mora na igreja', say: 'Os diabretes não saem sozinhos. Alguém os manda. O Garrick sabe quem.', text: 'O Garrick vai lhe contar sobre o Príncipe das Cinzas, na Igreja Abandonada.' },
  n16: { name: 'O juramento espera', say: 'O Príncipe caiu. Karmika vai cantar isso por gerações. Quando estiver pronto, volte: tenho um juramento para você.', text: 'O Garrick quer tomar o seu juramento e lhe dar um título. Ele espera você no nível certo.' },
  a01: { name: 'Tem gente precisando em outra cidade', say: 'Você já fez tudo o que podia por Karmika. Ajude o povo daqui quando quiser, mas o seu caminho é maior: o Eldrin tem uma carta para você.', text: 'Karmika ficou pequena para você. O Eldrin, no templo, tem uma carta para os mestres de Askavik, a cidade de pedra a nordeste.' },
  a02: { name: 'A primeira lição de Askavik', say: 'Karmika mandou bem. Mas aqui ninguém entra numa escola sem antes servir a cidade.', text: 'O Mestre Halvard tem um serviço para você antes de qualquer escola. Ele está na Escola de Guerra, no noroeste de Askavik.' },
  a03: { name: 'O Jarl quer ouvir', say: 'Grenivik respira. Leve a notícia ao Jarl: ele gosta de ouvir da boca de quem lutou.', text: 'O Jarl Haakon, no Castelo de Askavik (norte da cidade), quer ouvir o relatório de Grenivik.' },
  a04: { name: 'Um nome que ninguém diz', say: 'Os lobos recuaram. Agora o pior: há algo na Clareira de Selvar que o Jarl não diz o nome em voz alta.', text: 'O Jarl Haakon tem um último pedido, e é o mais perigoso.' },
  ...ROAD_BRIDGES,
  ...RACE_BRIDGES,
  p01: { name: 'A guardiã das relíquias', say: 'Garrick não exagerou: você tem o braço e a cabeça. Antes de qualquer escola, fale com a Velha Gunnhild, aqui mesmo na praça.', text: 'A Velha Gunnhild, guardiã das relíquias de Askavik, conhece quem chega à cidade. Ela vai mostrar o que falta para você descobrir o seu caminho.' },
};
/** monta a ponte entre a missão de história anterior e a próxima */
export function bridgeFor(prev: QuestDef, nx: QuestDef, plvl: number): QuestDef {
  const B = BRIDGE_TXT[nx.id] ?? { name: `Procure ${nx.giver}`, say: `${nx.giver} precisa de você.`, text: `Procure ${nx.giver}.` };
  const need = Math.max(1, nx.lvl - 2), gap = need > plvl;
  const where = gap ? ` Você já fez o que podia por agora: ajude o povo local (missões azuis) e pegue contratos no Quadro. Quando chegar ao nível ${need}, ${nx.giver} estará esperando.` : '';
  return { id: 'b_' + nx.id, bridge: true, chain: nx.chain, name: B.name, lvl: Math.max(1, nx.lvl - 2), giver: prev.turnin ?? prev.giver, turnin: nx.giver, text: B.text + where,
    objs: [...(gap ? [{ kind: 'level' as const, n: need }] : []), { kind: 'talk' as const, npc: nx.giver }], xp: Math.round(nx.xp * 0.12), gold: 0, next: nx.id, say: B.say } as QuestDef & { say: string };
}

/* ---------- Missões paralelas dos habitantes ---------- */
/* ---------- O Guerreiro do Norte (níveis 30–40): depois do teste do Thorgrim, a vida de quem escolheu a espada. Cada missão amarela termina numa escolha ---------- */
const TG = 'Thorgrim Mão-de-Ferro';
export const WARRIOR: QuestDef[] = [
  { id: 'w01', chain: 'O Guerreiro do Norte', name: 'O Juramento do Corvo', lvl: 30, giver: TG, req: 'v_gue', text: 'Passar no teste não faz de ninguém um guerreiro do Clã do Corvo. O juramento faz. Antes dele, mostre que suas mãos não tremem: oito Lobos Gélidos rondam Hrimgard. Volte e jure diante da pedra de Odin.', objs: [{ kind: 'kill', type: 'frostwolf', n: 8 }], xp: 4800, gold: 220, items: [['potion_g', 3]], next: 'w02',
    choice: { q: 'Diante da pedra de Odin, com a mão na lâmina, você jura…', opts: [
      { label: '“…pelos que não podem lutar.”', karma: 8, say: 'Então a sua espada é um muro. É o juramento mais pesado de carregar.', why: 'Você ganhou uma espada e a deu de presente aos fracos antes mesmo de usá-la. Marghar guarda isso.' },
      { label: '“…pelo Clã do Corvo e por Odin.”', karma: 4, say: 'O clã acolhe quem o protege. Bem-vindo, irmão de escudo.', why: 'Lealdade a quem te recebeu é uma virtude. Ela pesa menos que a lealdade aos indefesos, mas pesa.' },
      { label: '“…pela minha própria glória.”', karma: -3, say: 'Honesto, ao menos. Odin respeita a franqueza. Eu, menos.', why: 'Você não mentiu, e isso conta. Mas quem jura por si mesmo carrega a espada só para si.' } ] } },
  { id: 'w02', chain: 'O Guerreiro do Norte', name: 'O Fiorde de Skjoldvik', lvl: 31, giver: TG, text: 'Os barcos-dragão de Skjoldvik não saem do fiorde: uma alcateia faminta desceu das montanhas e cerca o cais. Vá até lá e limpe a margem.', objs: [{ kind: 'visit', poi: 'Skjoldvik' }, { kind: 'kill', type: 'wolf', n: 10 }], xp: 5100, gold: 240, next: 'w03' },
  { id: 'w03', chain: 'O Guerreiro do Norte', name: 'O Desertor', lvl: 32, giver: TG, text: 'Halfdan, um dos nossos, largou o posto e fugiu para Fjallbrún. A lei do clã é clara: desertor responde com a vida. Encontre-o. A neve de Fjallbrún esconde pegadas de quem não quer ser achado: ligue o seu Faro de Batalha (F) e leia o rastro dele. Os esqueletos que rondam o caminho não vão facilitar.', objs: [{ kind: 'visit', poi: 'Fjallbrún' }, { kind: 'sense', what: 'rastro', label: 'Seguir as pegadas de Halfdan na neve', at: 'Fjallbrún', dx: 20, dy: -14 }, { kind: 'kill', type: 'skeleton', n: 6 }], xp: 5400, gold: 260, next: 'w04',
    choice: { q: 'Halfdan está ajoelhado. Ele fugiu porque a família morria de fome enquanto ele guardava a muralha. Você…', opts: [
      { label: 'Leva Halfdan de volta para ser julgado pelo clã.', karma: 3, say: 'A lei é a lei. Você fez o que um guerreiro faz. O clã vai ouvir a história dele.', why: 'Você respeitou a lei sem tirar a voz dele. Justiça que escuta é justiça que pesa a favor.' },
      { label: 'Deixa Halfdan ir e diz ao clã que não o encontrou.', karma: 5, say: '…Não o encontrou. Entendo. Algumas vezes não encontrar é o mais difícil.', why: 'Você mentiu ao seu mestre, e mentira pesa. Mas mentiu para salvar uma família. O motivo pesa mais que o ato.' },
      { label: 'Cumpre a lei ali mesmo.', karma: -6, say: 'Está feito. Não me olhe assim. A lei é a lei.', why: 'A lei mandava, mas você não perguntou o porquê. Uma espada que não pergunta é só uma espada.' } ] } },
  { id: 'w04', chain: 'O Guerreiro do Norte', name: 'Ferro para a Fortaleza', lvl: 33, giver: TG, text: 'O inverno quebra lâminas. A forja da Fortaleza precisa de minério de ferro: doze pedras boas. E não roube de ninguém para isso.', objs: [{ kind: 'collect', item: 'ore_i', n: 12 }], xp: 5600, gold: 280, gear: 1, next: 'w05' },
  { id: 'w05', chain: 'O Guerreiro do Norte', name: 'Os Mortos que Andam', lvl: 34, giver: TG, text: 'Os túmulos do norte estão se abrindo. Dizem que é o Sem-Passo chamando. Doze mortos-vivos a menos, e talvez os vivos durmam.', objs: [{ kind: 'kill', type: 'zombie', n: 12 }], xp: 5900, gold: 300, items: [['potion_g', 3]], next: 'w06' },
  { id: 'w06', chain: 'O Guerreiro do Norte', name: 'O Emissário do Fio', lvl: 35, giver: TG, turnin: 'Paladino Aldric', text: 'Um emissário da Ordem do Fio quer o Clã do Corvo guardando os corredores do Labirinto. Eu não falo com quem fala bonito. Vá a Askavik e ouça o Paladino Aldric por mim. E responda por nós.', objs: [{ kind: 'visit', poi: 'Askavik' }, { kind: 'talk', npc: 'Paladino Aldric' }], xp: 6300, gold: 320, next: 'w07',
    choice: { q: 'Aldric pede: “Guardem os corredores conosco. Ninguém atravessa só.” Em nome do clã, você responde…', opts: [
      { label: '“O Corvo guarda os corredores ao seu lado.”', karma: 5, say: 'Então o fio fica mais forte. Obrigado, guerreiro.', why: 'Você uniu o clã a quem protege os que ainda não estão prontos. Proteger pesa a favor.' },
      { label: '“O Norte não se ajoelha a ordem nenhuma.”', karma: 0, say: 'Orgulho também é um muro. Que ele não caia sobre vocês.', why: 'Recusar não é crime. O Olho só anota que vocês escolheram andar sozinhos.' },
      { label: '“Antes, quero ouvir o que dizem os Desfiados.”', karma: 2, say: 'Ouvir os dois lados é raro. Perigoso, mas raro.', why: 'Quem escuta antes de jurar mostra respeito pela própria palavra.' } ] } },
  { id: 'w07', chain: 'O Guerreiro do Norte', name: 'O Covil dos Lobisomens', lvl: 36, giver: TG, text: 'Os lobisomens saíram do covil e caçam nas estradas. Seis deles. A lâmina tem que estar afiada e a cabeça fria: eles não morrem fácil.', objs: [{ kind: 'visit', poi: 'Covil dos Lobisomens' }, { kind: 'kill', type: 'werewolf', n: 6 }], xp: 6600, gold: 340, gear: 1, next: 'w08' },
  { id: 'w08', chain: 'O Guerreiro do Norte', name: 'O Duelo de Hrimgard', lvl: 37, giver: TG, text: 'Sigurd, o Ruivo, campeão de Hrimgard, desafiou o meu aprendiz. Vá a Hrimgard, derrube os Lobos Gélidos que guardam o círculo e encare o duelo.', objs: [{ kind: 'visit', poi: 'Hrimgard' }, { kind: 'kill', type: 'frostwolf', n: 6 }], xp: 7000, gold: 360, next: 'w09',
    choice: { q: 'No meio do duelo, Sigurd escorrega no gelo e fica exposto. Você…', opts: [
      { label: 'Espera ele se levantar.', karma: 6, say: 'Sigurd se levantou, e perdeu de pé. Ele mesmo contou a história em todas as tavernas.', why: 'Vencer um homem caído não é vencer. Você esperou, e a vitória foi inteira.' },
      { label: 'Aproveita e vence ali mesmo.', karma: -5, say: 'Ganhou. Ninguém vai cantar essa vitória.', why: 'Era um duelo, não uma guerra. Você trocou a honra por um minuto de vantagem.' },
      { label: 'Abaixa a espada e encerra o duelo empatado.', karma: 3, say: 'Empate. Hrimgard não entendeu, mas Sigurd entendeu.', why: 'Você escolheu não ferir quando podia. Prudência também é força.' } ] } },
  { id: 'w09', chain: 'O Guerreiro do Norte', name: 'A Tempestade de Fjallbrún', lvl: 38, giver: TG, text: 'A tempestade trouxe tudo de uma vez: lobos gélidos e lobisomens descendo juntos para Fjallbrún. A vila só tem velhos e crianças. Vá.', objs: [{ kind: 'kill', type: 'frostwolf', n: 10 }, { kind: 'kill', type: 'werewolf', n: 4 }], xp: 7400, gold: 380, items: [['potion_g', 4]], next: 'w10' },
  { id: 'w10', chain: 'O Guerreiro do Norte', name: 'Valhalla Espera', lvl: 40, giver: TG, text: 'Estou velho, e a doença me come por dentro. Um guerreiro do Corvo não morre na cama. Quero morrer lutando. Encontre-me na Fortaleza depois de limpar o caminho: oito carniçais rondam a estrada.', objs: [{ kind: 'kill', type: 'ghoul', n: 8 }, { kind: 'talk', npc: TG }], xp: 8000, gold: 500, gear: 2, title: 'Guerreiro do Corvo',
    choice: { q: 'Thorgrim pede uma última luta. Você…', opts: [
      { label: 'Luta ao lado dele contra a horda, até o fim dele.', karma: 10, say: '(Thorgrim cai sorrindo, com a espada na mão. As valquírias vêm buscá-lo.)', why: 'Você deu ao seu mestre o que ele pediu, e ficou do lado dele até o fim. Não existe gesto mais leal.' },
      { label: 'Recusa e o leva aos curandeiros, contra a vontade dele.', karma: -4, say: 'Você me roubou Valhalla, criança. Mas… obrigado por querer que eu viva.', why: 'Você amou o seu mestre, e isso pesa a favor. Mas decidiu por ele o que só ele podia decidir.' },
      { label: 'Aceita o duelo final e dá a ele a morte honrosa.', karma: 6, say: '(Um golpe limpo. Thorgrim abaixa a cabeça antes de cair.) “Bom golpe.”', why: 'Foi o mais difícil, e você não fugiu. A morte pedida e dada com respeito não pesa contra quem a dá.' } ] } },
];
export const SIDE: QuestDef[] = [
  /* ---------- Luz e Sombra (24/10): missões que só aparecem para quem a alma pende para um lado ---------- */
  { id: 'lz1', chain: 'As Mãos da Igreja', name: 'Remédio para Grenivik', lvl: 24, lean: 'luz', giver: 'Irmã Maela', text: 'A febre do pântano chegou a Grenivik com os mortos que andam. Seis Flores-de-Campo e eu faço o chá que baixa a febre. As crianças primeiro.', objs: [{ kind: 'collect', item: 'herb_f', n: 6 }], xp: 1, gold: 60, items: [['potion_g', 2]], next: 'lz2' },
  { id: 'lz2', chain: 'As Mãos da Igreja', name: 'O Órfão do Passo', lvl: 26, lean: 'luz', giver: 'Irmã Maela', text: 'Um menino sobreviveu ao ataque dos lobos gélidos a uma caravana no passo. Ele está escondido em Kaldrfoss e não confia em ninguém. Vá até lá, afaste os lobos e traga-o para cá.', objs: [{ kind: 'visit', poi: 'Kaldrfoss' }, { kind: 'kill', type: 'frostwolf', n: 5 }, { kind: 'talk', npc: 'Irmã Maela' }], xp: 1, gold: 40, title: 'Mãos da Igreja',
    choice: { q: 'O menino agarra a sua mão e pergunta se pode ficar com você.', opts: [
      { label: 'Deixa ele na Igreja, com a Irmã Maela, e promete visitar.', karma: 4, say: 'Ele vai contar os dias até você voltar. Volte.', why: 'Você deu ao menino um lar e uma promessa. Promessas a crianças pesam o dobro.' },
      { label: 'Diz que não é lugar para ele, e vai embora.', karma: 0, say: 'Ele não chorou. Isso foi pior.', why: 'Era verdade: a estrada não é lugar para uma criança. Mas havia jeitos mais gentis de dizer.' },
      { label: 'Leva ele como aprendiz.', karma: 2, say: 'Que Marghar guarde vocês dois na estrada.', why: 'Você assumiu uma vida que não é sua. Isso é coragem, e é peso.' } ] } },
  { id: 'sh1', chain: 'A Dívida de Vesna', name: 'A Cobrança', lvl: 22, lean: 'sombra', giver: 'Vesna Corvo-Negro', text: 'Um ferreiro de Hrafnhöfn me deve trinta moedas e um favor. Vá até lá e lembre a ele de quem é a dívida. Como você vai lembrar é problema seu.', objs: [{ kind: 'visit', poi: 'Hrafnhöfn' }, { kind: 'talk', npc: 'Vesna Corvo-Negro' }], xp: 1, gold: 140, next: 'sh2',
    choice: { q: 'O ferreiro tem três filhos e uma forja fria. Você…', opts: [
      { label: 'Tira o martelo dele: sem martelo, ele aprende.', karma: -6, flag: 'ferreiro_martelo', say: 'Hm. Eficiente. Ele vai pagar em dobro, nem que seja com a filha trabalhando para mim.', why: 'Você tirou o pão de quatro bocas por trinta moedas. A sombra tem preço barato e conta cara.' },
      { label: 'Paga a dívida do próprio bolso e mente que cobrou.', karma: 3, flag: 'mentiu_vesna', say: 'Trinta moedas… certas. Estranho. Ele nunca pagou nada em dia.', why: 'Você mentiu para a agiota e salvou uma família. A mentira pesa; o motivo pesa mais.' },
      { label: 'Ameaça, mas dá mais um mês de prazo.', karma: -1, say: 'Um mês. Se não pagar, quem vai cobrar é você, de novo.', why: 'Você assustou um homem já assustado. Não foi crueldade; também não foi bondade.' } ] } },
  { id: 'sh2', chain: 'A Dívida de Vesna', name: 'Carga Sem Dono', lvl: 26, lean: 'sombra', giver: 'Vesna Corvo-Negro', text: 'Uma carroça da Companhia de Latão tombou no passo e os cocheiros morreram. A carga não tem dono. Afaste os lobos, pegue as caixas e traga para mim antes que a Companhia mande alguém.', objs: [{ kind: 'kill', type: 'frostwolf', n: 6 }, { kind: 'talk', npc: 'Vesna Corvo-Negro' }], xp: 1, gold: 260, gear: 1,
    choice: { q: 'Entre as caixas há uma carta: "Para a família de Ivo, cocheiro. Se eu não voltar." Você…', opts: [
      { label: 'Entrega tudo à Vesna, carta junto.', karma: -5, say: 'Cartas não valem nada. Caixas valem. Boa garota, bom garoto.', why: 'Você vendeu a última palavra de um morto. A Vesna pagou bem.' },
      { label: 'Entrega as caixas, mas leva a carta à família de Ivo.', karma: 1, say: 'Hm? Faltou alguma coisa? … Não importa.', why: 'Você roubou dos mortos, mas devolveu a voz de um deles. A alma registra os dois.' },
      { label: 'Devolve tudo à Companhia de Latão.', karma: 5, say: 'Você me fez perder dinheiro. Isso é raro. E perigoso.', why: 'Você escolheu a honra diante de quem paga. A Vesna não esquece; o Olho também não.' } ] } },
  /* Askavik, níveis 26–28 (23/10): a história amarela não pode sumir entre a chegada à cidade e a Vidente */
  { id: 'a02', chain: 'A Chamada de Askavik', name: 'Ossos em Grenivik', lvl: 26, giver: 'Mestre Halvard', turnin: 'Jarl Haakon', req: 'a01', next: 'a03', text: 'Em Askavik ninguém entra numa escola sem antes servir a cidade. Os mortos do campo santo estão andando pela estrada de Grenivik, na Cordilheira do Norte. Vá até Grenivik, derrube dez esqueletos e leve o relatório ao Jarl Haakon, no castelo.', objs: [{ kind: 'visit', poi: 'Grenivik' }, { kind: 'kill', type: 'skeleton', n: 10 }, { kind: 'talk', npc: 'Jarl Haakon' }], xp: 1, gold: 140 },
  { id: 'a03', chain: 'A Chamada de Askavik', name: 'Os Lobos do Passo', lvl: 27, giver: 'Jarl Haakon', turnin: 'Jarl Haakon', next: 'a04', text: 'Grenivik respira, mas o passo não. Lobos gélidos descem da cordilheira e cercam as caravanas. Dez a menos, e cinco garras para os sentinelas pendurarem nos portões: lobo entende recado.', objs: [{ kind: 'kill', type: 'frostwolf', n: 10 }, { kind: 'collect', item: 'claw', n: 5 }], xp: 1, gold: 160, items: [['potion', 2]] },
  { id: 'a04', chain: 'A Chamada de Askavik', name: 'O Carniceiro de Selvar', lvl: 28, giver: 'Jarl Haakon', turnin: 'Mestre Halvard', next: 'p01', text: 'Na Clareira de Selvar, na Mata do Leste, os carniçais têm um senhor. Mandei três patrulhas; voltou um homem, e ele não fala mais. Não vá antes do nível 28. Limpe a clareira, doze carniçais, e conte ao Mestre Halvard o que viu. Depois disso, Askavik é sua casa.', objs: [{ kind: 'level', n: 28 }, { kind: 'visit', poi: 'Clareira de Selvar' }, { kind: 'kill', type: 'ghoul', n: 12 }], xp: 1, gold: 260, gear: 2, title: 'Escudo de Askavik' },
  { id: 'p01', chain: 'Os Caminhos', name: 'Os Caminhos', lvl: 28, giver: 'Velha Gunnhild', turnin: 'Hrefna', req: 'a01', text: 'Você já conhece Askavik: as escolas, a igreja, o mercado e os mestres. Falta o mais difícil: saber quem você é. No santuário de pedras a oeste da praça mora Hrefna, a Vidente da Deusa dos Caminhos. Quando chegar ao nível 30, ela lerá a sua alma. O que ela vir não é uma corrente: em Karmika, quem escolhe é você.', objs: [{ kind: 'level', n: 30 }, { kind: 'talk', npc: 'Hrefna' }], xp: 1500, gold: 120 },
  { id: 'a01', chain: 'A Chamada de Askavik', name: 'A Chamada de Askavik', lvl: 25, giver: 'Eldrin', turnin: 'Mestre Halvard', req: 'h30', next: 'a02', text: 'O Olho despertou em você — Karmika já não tem o que lhe ensinar. Em Askavik, a cidade de pedra a nordeste, ficam as escolas de todas as ordens. Siga as placas pela estrada e apresente-se ao Mestre Halvard, na Escola de Guerra. Lá se escolhe o que se será.', objs: [{ kind: 'visit', poi: 'Askavik' }, { kind: 'talk', npc: 'Mestre Halvard' }], xp: 900, gold: 250, gear: 1 },
  { id: 'c01', chain: 'A Catedral Abandonada', name: 'A Prisioneira da Catedral', lvl: 12, giver: 'Irmã Ysolde', turnin: 'Irmã Ysolde', text: 'Eu era freira desta casa quando o Bispo abriu as portas para Gorvak. Minha alma ficou acorrentada à pedra — não desço, não subo, não durmo. Limpe a nave dos mortos que ele ergueu, arranque os três selos dos seus carrascos nas criptas, abra a Porta e dê fim ao Bispo Caído. Só então estas correntes se partem.', objs: [{ kind: 'kill', type: 'zombie', n: 20 }, { kind: 'collect', item: 'seal_1', n: 1 }, { kind: 'collect', item: 'seal_2', n: 1 }, { kind: 'collect', item: 'seal_3', n: 1 }, { kind: 'kill', type: 'bishop', n: 1 }], xp: 3200, gold: 320, items: [['tome', 2]], gear: 2, title: 'Purificador da Catedral' },
  { id: 'o01', chain: 'Cavalos de Orm', name: 'O Torturador de Bestas', lvl: 6, giver: 'Orm', text: 'Um demônio se instalou na Clareira dos Gritos, no meio da floresta a leste, e tortura os animais que captura — meus cavalos entre eles. Enquanto ele viver, nenhum cavalo sai deste estábulo. Mate-o e eu lhe vendo o melhor baio que tenho.', objs: [{ kind: 'visit', poi: 'Clareira dos Gritos' }, { kind: 'kill', type: 'tormentor', n: 1 }], xp: 600, gold: 150, gear: 1, title: 'Libertador de Bestas' },
];
/* ---------- Quadro de missões: geração procedural infinita por nível ---------- */
const HUNT: [EnemyType, number][] = [['rat', 1], ['coyote', 1], ['deer', 1], ['puglin', 1], ['fairy', 2], ['wolf', 2], ['boar', 2], ['frostwolf', 3], ['imp', 4], ['treant', 5], ['prince', 8]];
const GATHER: [string, number][] = [['stick', 1], ['stone', 1], ['apple', 1], ['hide', 2], ['meat', 2], ['wood', 3], ['claw', 3], ['fish', 3], ['dust', 4], ['sap', 8]];
const NPCS = ['Garrick', 'Thorin', 'Eldrin', 'Doran', 'Lúcia'];
const ADJ = ['Urgente', 'Recompensa', 'Pedido', 'Contrato', 'Caçada', 'Encomenda', 'Chamado', 'Aviso'];
export function genBoard(lvl: number, seed: number): QuestDef {
  let s = seed * 9301 + 49297; const R = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const kind = R(); const id = `b${seed}`; const npc = NPCS[Math.floor(R() * NPCS.length)], adj = ADJ[Math.floor(R() * ADJ.length)];
  const scale = 1 + lvl * 0.12;
  if (kind < 0.5) {
    const pool = HUNT.filter(([, l]) => l <= Math.max(1, lvl / 2.5) + 1); const [type, el] = pool[Math.floor(R() * pool.length)]; const n = Math.max(1, Math.round((3 + R() * 5) / Math.max(1, el * 0.6)));
    return { id, board: true, name: `${adj}: ${ENEMY_NAME(type)}`, lvl, giver: npc, text: `${npc} paga pela cabeça de ${n} ${ENEMY_NAME(type)}.`, objs: [{ kind: 'kill', type, n }], xp: Math.round((20 + n * 12 * el) * scale), gold: Math.round((6 + n * 3 * el) * scale) };
  }
  if (kind < 0.85) {
    const pool = GATHER.filter(([, l]) => l <= Math.max(1, lvl / 3) + 1); const [item, el] = pool[Math.floor(R() * pool.length)]; const n = Math.max(1, Math.round((3 + R() * 6) / Math.max(1, el * 0.7)));
    return { id, board: true, name: `${adj}: ${ITEMS[item]?.name ?? item}`, lvl, giver: npc, text: `${npc} precisa de ${n}× ${ITEMS[item]?.name ?? item}.`, objs: [{ kind: 'collect', item, n }], xp: Math.round((18 + n * 8 * el) * scale), gold: Math.round((5 + n * 2 * el) * scale) };
  }
  if (kind < 0.94) return vengeance(lvl, id, npc, R, scale);
  const pois = ['Cemitério Esquecido', 'Igreja Abandonada']; const poi = pois[Math.floor(R() * pois.length)];
  return { id, board: true, name: `${adj}: ${poi}`, lvl, giver: npc, turnin: npc, text: `${npc} quer notícias de ${poi}. Vá até lá e volte.`, objs: [{ kind: 'visit', poi }], xp: Math.round(40 * scale), gold: Math.round(15 * scale) };
}

/* ---- contratos de vingança (24/10): alguém da cidade perdeu um dos seus e paga pelo sangue. A caça é simples; o peso está na entrega,
   quando quem pagou pergunta o que não tem resposta. O Olho julga o que você diz, não o que você matou. ---- */
const VENG_POOL: [EnemyType, number][] = [['wolf', 2], ['boar', 2], ['coyote', 1], ['frostwolf', 3], ['imp', 4], ['puglin', 1]];
const VENG_PL: Partial<Record<EnemyType, string>> = { wolf: 'Lobos', boar: 'Javalis', coyote: 'Coiotes', frostwolf: 'Lobos Gélidos', imp: 'Diabretes', puglin: 'Puglins' };
function vengeance(lvl: number, id: string, npc: string, R: () => number, scale: number): QuestDef {
  const pool = VENG_POOL.filter(([, l]) => l <= Math.max(1, lvl / 2.5) + 1); const [type, el] = pool[Math.floor(R() * pool.length)];
  const n = Math.max(2, Math.round((4 + R() * 4) / Math.max(1, el * 0.6))), en = VENG_PL[type] ?? ENEMY_NAME(type), fem = npc === 'Lúcia', ele = fem ? 'ela' : 'ele', dele = fem ? 'dela' : 'dele';
  const T = [
    { name: 'Sangue na estrada', text: `${npc} não chora mais; já chorou tudo. “${en} mataram meu irmão na estrada do leste. Não quero justiça. Quero sangue: ${n} deles, e eu pago.”`,
      q: `${npc} conta as provas com as mãos tremendo. “Ele estava entre esses? Diga que estava.”` },
    { name: 'A conta do rebanho', text: `“O meu filho foi atrás do rebanho e voltou carregado. ${en}. ${n} deles, pelo menos. Quero ouvir que doeu.” ${npc} põe a bolsa no balcão sem olhar para você.`,
      q: `${npc} pergunta, baixo: “Eles sofreram? Diga que sofreram.”` },
    { name: 'O que a noite levou', text: `“Foi de noite, perto do poço velho. ${en}. ${npc === 'Lúcia' ? 'Meu companheiro' : 'A minha companheira'} gritou e ninguém saiu de casa. Eu também não saí.” ${npc} pede ${n} mortes. Paga por cada uma.`,
      q: `${npc} olha as provas e não pega o ouro de volta. “Isso apaga o que eu não fiz naquela noite?”` },
  ];
  const t = T[Math.floor(R() * T.length)];
  return { id, board: true, name: `Vingança: ${t.name}`, lvl, giver: npc, turnin: npc, text: t.text, objs: [{ kind: 'kill', type, n }], xp: Math.round((30 + n * 14 * el) * scale), gold: Math.round((10 + n * 4 * el) * scale),
    choice: { q: t.q, opts: [
      { label: '“Está feito. Mas vingança não devolve ninguém. Cuide dos que ficaram.”', karma: 2, say: `${npc} demora a responder. Depois guarda a bolsa e diz que vai visitar a família ${dele} amanhã.`, why: 'Você entregou o que foi pago e devolveu o luto ao lugar dele.', flag: 'veng_consolou' },
      { label: '“Sim. Foi como você queria.”', karma: 0, say: `${npc} respira fundo. Pela primeira vez em semanas, ${ele} dorme a noite inteira.`, why: 'Uma resposta piedosa a quem estava quebrado. O Olho anota, mas não pesa.' },
      { label: '“Pague o dobro e eu volto para acabar com a toca inteira.”', karma: -3, say: `${npc} paga. A fome ${dele} agora é sua, e você gostou do gosto.`, why: 'Você vendeu o ódio de outra pessoa por ouro e ainda pediu mais.', flag: 'veng_lucro' },
    ] } };
}

export interface QState { active: Record<string, { prog: number[]; def?: QuestDef; from?: string }>; done: string[]; boardSeed: number; title: string }

/** Missão azul (extra) gerada por NPC a partir do ofício dele; depois de feita, outra aparece com nova semente */
const ROLE_Q: [RegExp, { kind: 'kill' | 'collect' | 'visit'; pool: string[]; text: string[] }][] = [
  [/cozinh|churras|charcut|estalaj/i, { kind: 'collect', pool: ['meat', 'fish', 'apple', 'bread'], text: ['A panela não espera: traga-me {n} {it}.', 'Os fregueses reclamam. {n} {it} e eu paro de ouvir.'] }],
  [/lenhad|construtor|carpint/i, { kind: 'collect', pool: ['wood', 'stick', 'stone'], text: ['Falta {it}. {n}, se puder, antes da chuva.', 'Tem obra parada por {n} {it}.'] }],
  [/alquim|sábi|cervej|domad/i, { kind: 'collect', pool: ['dust', 'sap', 'apple', 'hide'], text: ['Preciso de {n} {it} para o que estou preparando. Não pergunte.', '{n} {it}. Pago bem e não faço perguntas.'] }],
  [/guard|caçad|alfa|paladin|armeir|armadur|ferreir|mercador/i, { kind: 'kill', pool: ['wolf', 'boar', 'coyote', 'imp', 'puglin', 'rat'], text: ['{n} {it} andam perto demais. Resolva.', 'Quem derrubar {n} {it} come de graça aqui por uma semana.'] }],
  [/aldeã|aldeão|mendig|pedinte|velh|ceg/i, { kind: 'visit', pool: ['Cemitério Esquecido', 'Igreja Abandonada', 'Catedral Abandonada', 'Clareira dos Gritos'], text: ['Ninguém mais passa por {it}. Vá ver se ainda está lá e volte para me contar.', 'Dizem coisas de {it}. Olhe com os seus olhos.'] }],
];
export function genNpcQuest(npc: string, role: string, lvl: number, seed: number, times = 0): QuestDef {
  let s = seed * 7919 + 104729; const R = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const rq = ROLE_Q.find(([re]) => re.test(role)) ?? ROLE_Q[ROLE_Q.length - 1];
  const g = rq[1]; const id = `q${seed}-${npc}`, scale = 1 + lvl * 0.1;
  /* cada vez que o mesmo NPC pede de novo, pede MUITO mais (e paga só um pouco mais): não dá para virar fonte infinita de XP */
  const more = 1 + times * 1.2, payK = 1 + times * 0.35, again = times ? ` (${times + 1}ª vez: agora ele quer bem mais)` : '';
  const tx = g.text[Math.floor(R() * g.text.length)];
  if (g.kind === 'kill') { const type = g.pool[Math.floor(R() * g.pool.length)] as EnemyType, n0 = 3 + Math.floor(R() * 5), n = Math.round(n0 * more); return { id, name: `${role}: ${ENEMY_NAME(type)}`, lvl, giver: npc, text: tx.replace('{n}', String(n)).replace('{it}', ENEMY_NAME(type)) + again, objs: [{ kind: 'kill', type, n }], xp: Math.round((30 + n0 * 14) * scale * payK), gold: Math.round((8 + n0 * 4) * scale * payK) }; }
  if (g.kind === 'collect') { const item = g.pool[Math.floor(R() * g.pool.length)], n0 = 3 + Math.floor(R() * 6), n = Math.round(n0 * more); return { id, name: `${role}: ${ITEMS[item]?.name ?? item}`, lvl, giver: npc, text: tx.replace('{n}', String(n)).replace('{it}', ITEMS[item]?.name ?? item) + again, objs: [{ kind: 'collect', item, n }], xp: Math.round((26 + n0 * 9) * scale * payK), gold: Math.round((6 + n0 * 3) * scale * payK) }; }
  const poi = g.pool[Math.floor(R() * g.pool.length)];
  return { id, name: `${role}: ${poi}`, lvl, giver: npc, turnin: npc, text: tx.replace('{it}', poi), objs: [{ kind: 'visit', poi }], xp: Math.round(45 * scale), gold: Math.round(16 * scale) };
}
/** cor de cada tipo de missão: amarela = história principal, azul = secundária (NPC), verde = repetição (quadro, contratos) */
export const STORY_CHAINS = new Set(['Caminho do Norte', 'Caminho da Forja', 'Caminho da Mata', 'A Chamada de Askavik', 'Os Caminhos', 'O Guerreiro do Norte', 'A Catedral Abandonada']);
export type QuestCat = 'story' | 'side' | 'rep';
/** o caminho de classe (Hrefna → mestre → saga da classe) é história principal: amarela */
export const questCat = (d: { board?: boolean; chain?: string }): QuestCat => d.board ? 'rep' : d.chain && (STORY_CHAINS.has(d.chain) || d.chain.startsWith('O Caminho')) ? 'story' : 'side';
export const CAT_INFO: Record<QuestCat, { name: string; col: string }> = { story: { name: 'História', col: '#ffd24a' }, side: { name: 'Secundária', col: '#6ab4ff' }, rep: { name: 'Repetição', col: '#7aff7a' } };
const CAT_ORDER: QuestCat[] = ['story', 'side', 'rep'];

export function createQuests(ctx: { /** para onde a alma pende (missões de Luz e de Sombra) */ lean?(): 'luz' | 'sombra' | null; origin?(): 'human' | 'elf' | 'dwarf'; roleOf?(npc: string): string | null; st: { lvl: number; xp: number; gold: number }; count(item: string): number; take(item: string, n: number): boolean; add(item: string, n: number): void; gainXp(n: number): void; xpNeedAt?(l: number): number; gear(n: number, lvl: number): void; log(t: string, c?: string): void; onTitle(t: string): void; chainQuests: QuestDef[]; karma?(dk: number): void; me?(): string; onDone?(d: QuestDef): void; auction?: { html(): string; click(t: HTMLElement): boolean; input(f: HTMLInputElement): string; tipOf(id: string): string; readonly count: number };
  /** jogar junto: o quadro de pedidos é o da sala (dos jogadores de verdade) */
  room?: { on(): boolean; posts(): { id: number; by: string; item: string; n: number; gold: number }[]; add(item: string, n: number, gold: number): void; fill(id: number, item: string, n: number): void; cancel(id: number): void } }) {
  let onDoneCb: ((d: QuestDef) => void) | null = null;
  /** cartão extra no topo do diário (o evento vivo em que você entrou ou que está seguindo) */
  let extraTop: (() => string) | null = null;
  const SAVE = 'karmika.quests.v1';
  const q: QState = { active: {}, done: [], boardSeed: 1, title: '' };
  /** quantas vezes cada NPC já teve pedido atendido: depois de 5, ele só negocia (não pede mais) */
  const NPC_Q_MAX = 5, npcTimes: Record<string, number> = {}; try { Object.assign(npcTimes, JSON.parse(localStorage.getItem('karmika.npcqn.v1') || '{}')); } catch { /* */ }
  const npcSeeds: Record<string, number> = {}; try { Object.assign(npcSeeds, JSON.parse(localStorage.getItem('karmika.npcq.v1') || '{}')); } catch { /* */ }
  let tracked: string | null = null;
  /* REGRA IMUTÁVEL — missão é o que mais faz evoluir (Erling, 23/10: "a linha amarela precisa pegar uns 60% do XP"):
     a história amarela (o fio, STORY_THREAD) paga STORY_SHARE de TODO o XP entre ela e a próxima amarela — somadas às pontes (+12%),
     dão ~60% do caminho; os outros ~40% vêm de azuis, Quadro, masmorras, relíquias e caça. As missões de chefe ainda pedem o nível
     (objetivo 'nível N'): é aí que o jogador sai para caçar e fazer extras antes de continuar.
     Fora do fio: história ≈ 70% de um nível, extra de NPC ≈ 33%, contrato do Quadro ≈ 24%. */
  const storyXp = (() => { const out: Record<string, number> = {}; const N = ctx.xpNeedAt; if (!N) return out;
    for (const TH of Object.values(STORY_THREADS)) { const th = TH.map((id) => ctx.chainQuests.find((d) => d.id === id)).filter((d): d is QuestDef => !!d && !d.objs.some((o) => o.kind === 'level' && o.n >= 30));
    for (let i = 0; i < th.length;) { const L = th[i].lvl; let j = i; while (j < th.length && th[j].lvl === L) j++; // as amarelas do mesmo nível dividem o trecho
      const L2 = j < th.length ? th[j].lvl : 30; let sum = 0; for (let l = L; l < Math.max(L + 1, L2); l++) sum += N(l);
      for (let k = i; k < j; k++) out[th[k].id] = Math.round(sum * STORY_SHARE / (j - i)); i = j; } }
    return out; })();
  const fix = (d: QuestDef) => { if (ctx.xpNeedAt) d.xp = storyXp[d.id] ?? Math.round(ctx.xpNeedAt(Math.max(1, d.lvl)) * (d.chain ? 0.7 : d.board ? 0.24 : 0.33)); return d; };
  /* REGRA IMUTÁVEL — missão ainda não aceita nasce 1 a 3 níveis acima do jogador, para ser difícil */
  const above = (seed: number) => Math.max(1, ctx.st.lvl) + 1 + (Math.abs(seed) % 3);
  const defs = new Map<string, QuestDef>(); for (const d of ctx.chainQuests) { const f = FALAS[d.id] ?? FALAS[FALA_ALIAS[d.id] ?? '']; if (f) { if (f.talk && !d.talk) d.talk = f.talk; if (f.done && !d.done) d.done = f.done; } defs.set(d.id, fix(d)); }
  /* 22/10/2026: os NPCs da primeira vila ganharam nomes não nórdicos; saves antigos guardam missões com os nomes velhos */
  const RENAMED: Record<string, string> = { Ragnar: 'Garrick', Bjorn: 'Doran', Sigrid: 'Lúcia', Helga: 'Maren', 'Vígdis': 'Morwen', Brynja: 'Tessa', Ulf: 'Bruno', Ingrid: 'Rosália', Haldor: 'Tomás', Astrid: 'Kaela', Finn: 'Corwin' };
  const reName = (t: string) => t.replace(/[A-Za-zÀ-ú]+/g, (w) => RENAMED[w] ?? w);
  try { const raw = localStorage.getItem(SAVE); if (raw && /Ragnar|Bjorn|Brynja|Vígdis|Sigrid|Helga|Ingrid|Haldor|Astrid|\bUlf\b|\bFinn\b/.test(raw)) localStorage.setItem(SAVE, reName(raw)); } catch { /* */ }
  try { const s = JSON.parse(localStorage.getItem(SAVE) || 'null'); if (s) { Object.assign(q, s); for (const [id, a] of Object.entries(q.active)) if (a.def) defs.set(id, a.def); } } catch { /* sem save */ }
  /* 25/10: o Caminho do Norte velho (n01–n16, tudo em Karmika) virou a campanha que viaja (h01–h30). Missões velhas em andamento saem do diário; o fio oferece a nova no lugar */
  for (const id of Object.keys(q.active)) if (/^(b_)?n\d\d$/.test(id)) delete q.active[id];
  setTimeout(() => { try { ensureThread(); } catch { /* */ } }, 1500); /* quem carregou um save antigo recebe na hora o próximo passo do fio */
  const save = () => { try { localStorage.setItem(SAVE, JSON.stringify(q)); } catch { /* */ } };
  for (const id of Object.keys(q.active)) if (!defs.get(id)) delete q.active[id]; // missão de save antigo que não existe mais
  const def = (id: string) => defs.get(id)!;
  const isDone = (id: string) => q.done.includes(id) || (DONE_ALIAS[id]?.some((a) => q.done.includes(a)) ?? false);
  const thread = () => STORY_THREADS[ctx.origin?.() ?? 'human'] ?? STORY_THREAD;
  const prog = (id: string) => q.active[id]?.prog ?? [];
  setTimeout(() => ensureThread(), 1500); // save antigo parado no meio da história: a ponte aparece
  function objProg(d: QuestDef, i: number) { const o = d.objs[i]; if (o.kind === 'collect') return Math.min(o.n, ctx.count(o.item)); if (o.kind === 'level') return ctx.st.lvl >= o.n ? 1 : 0; return prog(d.id)[i] ?? 0; }
  function objNeed(o: Obj) { return o.kind === 'kill' || o.kind === 'collect' || o.kind === 'craft' ? o.n : 1; }
  const complete = (d: QuestDef) => d.objs.every((o, i) => objProg(d, i) >= objNeed(o));
  /** missões que este NPC pode oferecer agora */
  function offers(npc: string): QuestDef[] {
    const out: QuestDef[] = [];
    if (!(ctx.chainQuests.some((d) => d.giver === npc && !isDone(d.id))) && ctx.roleOf?.(npc) && !Object.values(q.active).some((a) => a.def && a.def.giver === npc && !a.def.board)) { const role = ctx.roleOf(npc)!; const sd = npcSeeds[npc] ?? (npcSeeds[npc] = [...(npc + role)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 9000, 7) + 100); const times = npcTimes[npc] ?? 0; if (times < NPC_Q_MAX) { const d = fix(genNpcQuest(npc, role, above(sd), sd, times)); if (!isDone(d.id)) { defs.set(d.id, d); out.push(d); } } }
    for (const d of ctx.chainQuests) { if (d.giver !== npc || isDone(d.id) || q.active[d.id]) continue; const prevs = ctx.chainQuests.filter((p) => p.next === d.id && (!p.origin || p.origin === ctx.origin?.())).map((p) => p.id); if (prevs.length && !prevs.some((prevId) => isDone(prevId) || (THREAD_SKIP[prevId] && isDone(THREAD_SKIP[prevId])))) continue; if (THREAD_SKIP[d.id] && isDone(THREAD_SKIP[d.id])) continue; if (d.req && !isDone(d.req)) continue; if (d.lean && ctx.lean?.() !== d.lean) continue; if (d.origin && ctx.origin?.() !== d.origin) continue; if (ctx.st.lvl < Math.max(1, d.lvl - 2)) continue; out.push(d); }
    return out;
  }
  function turnins(npc: string): QuestDef[] { return Object.keys(q.active).map(def).filter((d) => !!d && (d.turnin ?? d.giver) === npc && complete(d)); }
  let onAcceptCb: ((d: QuestDef) => void) | null = null;
  function accept(d: QuestDef, from?: string) { if (from && (q.active[d.id] || q.done.includes(d.id))) return; if (!q.active[d.id] && Object.keys(q.active).length >= questLimit() && d.giver !== 'O Olho' && !d.bridge) { ctx.log(`Diário cheio: até ${questLimit()} missões ao mesmo tempo${isPremium() ? '' : ' (Premium: 10)'}. Entregue ou abandone uma.`, '#ff9a8a'); return; } q.active[d.id] = { prog: d.objs.map(() => 0), def: from || d.board || d.bridge || d.id.startsWith('q') || d.id.startsWith('v') ? d : undefined, ...(from ? { from } : {}) }; defs.set(d.id, d);
    if (!d.bridge && q.active['b_' + d.id]) { delete q.active['b_' + d.id]; q.done.push('b_' + d.id); } // pegou a missão direto: a ponte já cumpriu o papel
    ctx.log(d.bridge ? `🧵 História: ${d.name}` : from ? `📜 Missão de ${from} aceita: ${d.name}` : `📜 Missão aceita: ${d.name}`, '#ffe08a'); save(); render(); if (!from && !d.bridge) onAcceptCb?.(d); }
  /** o fio da história nunca some: se a próxima missão amarela não está no diário, entra a ponte que leva até ela */
  function ensureThread(fromTurnIn?: QuestDef) {
    const TH = thread(); const T = TH.find((id) => !isDone(id) && !(THREAD_SKIP[id] && isDone(THREAD_SKIP[id]))); if (!T) return; const i = TH.indexOf(T); if (i === 0 || q.active[T] || q.active['b_' + T]) return;
    const passed = (id: string) => isDone(id) || (!!THREAD_SKIP[id] && isDone(THREAD_SKIP[id]));
    const prev = def(TH.slice(0, i).reverse().find((id) => passed(id)) ?? TH[i - 1]), nx = def(T); if (!prev || !nx || !passed(prev.id)) return;
    const b = bridgeFor(prev, nx, ctx.st.lvl); if (isDone(b.id)) return; /* ponte já entregue: a missão está com quem a dá (o “?” na cabeça dela). Antes a ponte voltava ao diário e a entrega se repetia sem fim (25/10) */
    accept(b); if (fromTurnIn) setTimeout(() => ctx.log(`${b.giver}: “${(b as QuestDef & { say?: string }).say ?? ''}”`, '#f4e6b8'), 400);
  }
  function turnIn(d: QuestDef) {
    if (d.id.startsWith('q') && npcSeeds[d.giver] !== undefined) { npcTimes[d.giver] = (npcTimes[d.giver] ?? 0) + 1; try { localStorage.setItem('karmika.npcqn.v1', JSON.stringify(npcTimes)); } catch { /* */ } if (npcTimes[d.giver] >= NPC_Q_MAX) setTimeout(() => ctx.log(`${d.giver}: “Já me ajudou o bastante. Daqui pra frente, só negócio.”`, '#c8b890'), 600); npcSeeds[d.giver] += 7; try { localStorage.setItem('karmika.npcq.v1', JSON.stringify(npcSeeds)); } catch { /* */ } }
    for (const o of d.objs) if (o.kind === 'collect') ctx.take(o.item, o.n);
    delete q.active[d.id]; q.done.push(d.id);
    ctx.st.gold += Math.round(d.gold * 0.6); ctx.gainXp(d.xp); for (const [it, n] of d.items ?? []) ctx.add(it, n); if (d.gear) ctx.gear(d.gear, d.lvl);
    if (d.title) { q.title = d.title; ctx.onTitle(d.title); }
    ctx.onDone?.(d); onDoneCb?.(d);
    ctx.log(`✅ Missão concluída: ${d.name} (+${d.xp} XP, +${Math.round(d.gold * 0.6)} ouro)`, '#7aff9a'); save(); render();
    /* a próxima missão NÃO entra sozinha: quem dá a missão precisa contar do que se trata (o diálogo reabre com a oferta). Só o Olho, que não tem boca, entrega direto */
    if (d.next && !q.active[d.next] && !isDone(d.next)) { const nx = def(d.next); if (nx && nx.giver === 'O Olho' && nx.giver === (d.turnin ?? d.giver) && ctx.st.lvl >= Math.max(1, nx.lvl - 2) && (!nx.req || isDone(nx.req))) accept(nx); }
    ensureThread(d);
  }
  function onKill(type: EnemyType) { let ch = false; for (const [id, a] of Object.entries(q.active)) { const d = def(id); d.objs.forEach((o, i) => { if (o.kind === 'kill' && o.type === type && a.prog[i] < o.n) { a.prog[i]++; ch = true; if (a.prog[i] === o.n) ctx.log(`📜 ${d.name}: ${objText(o)} ✔`, '#ffe08a'); } }); } if (ch) { save(); render(); } }
  function onTalk(npc: string) { let ch = false; for (const [id, a] of Object.entries(q.active)) { const d = def(id); d.objs.forEach((o, i) => { if (o.kind === 'talk' && o.npc === npc && a.prog[i] < 1) { a.prog[i] = 1; ch = true; } }); } if (ch) { save(); render(); } }
  function onVisit(poi: string) { let ch = false; for (const [id, a] of Object.entries(q.active)) { const d = def(id); d.objs.forEach((o, i) => { if (o.kind === 'visit' && o.poi === poi && a.prog[i] < 1) { a.prog[i] = 1; ch = true; ctx.log(`📜 ${d.name}: chegou a ${poi} ✔`, '#ffe08a'); } }); } if (ch) { save(); render(); } }
  /** achou o que o instinto mostrava (id = 'missão:objetivo') */
  function onSense(id: string) { const [qid, oi] = id.split(':'); const a = q.active[qid]; if (!a) return; const d = def(qid), i = +oi; if (d?.objs[i]?.kind === 'sense' && a.prog[i] < 1) { a.prog[i] = 1; ctx.log(`📜 ${d.name}: ${objText(d.objs[i])} ✔`, '#ffe08a'); save(); render(); } }
  function onCaravan(kind: 'escort' | 'rescue', route: string) { let ch = false; for (const [id, a] of Object.entries(q.active)) { const d = def(id); d.objs.forEach((o, i) => { if (o.kind === kind && o.route === route && a.prog[i] < 1) { a.prog[i] = 1; ch = true; ctx.log(`📜 ${d.name}: ${objText(o)} ✔`, '#ffe08a'); } }); } if (ch) { save(); render(); } }
  function onDungeon(id: string) { let ch = false; for (const [qid, a] of Object.entries(q.active)) { const d = def(qid); d?.objs.forEach((o, i) => { if (o.kind === 'dungeon' && o.id === id && a.prog[i] < 1) { a.prog[i] = 1; ch = true; ctx.log(`📜 ${d.name}: ${objText(o)} ✔`, '#ffe08a'); } }); } if (ch) { save(); render(); } }
  function onCraft(recipeName: string) { let ch = false; for (const [id, a] of Object.entries(q.active)) { const d = def(id); d.objs.forEach((o, i) => { if (o.kind === 'craft' && o.recipe === recipeName && a.prog[i] < o.n) { a.prog[i]++; ch = true; } }); } if (ch) { save(); render(); } }
  /** quadro: 3 missões do nível atual; aceitar uma gera outra */
  function board(): QuestDef[] { const out: QuestDef[] = []; for (let i = 0; i < 3; i++) out.push(fix(genBoard(above(q.boardSeed + i), q.boardSeed + i))); return out; }
  const boardActive = () => Object.entries(q.active).filter(([id, a]) => a.def?.board || id.startsWith('b')).map(([id]) => def(id));
  function acceptBoard(d: QuestDef) { if (Object.keys(q.active).length >= questLimit()) { ctx.log(`Diário cheio: até ${questLimit()} missões ao mesmo tempo${isPremium() ? '' : ' (Premium: 10)'}.`, '#ff9a8a'); return; } q.boardSeed += 1; accept(d); }
  const el = document.createElement('div'); el.id = 'quests'; document.body.appendChild(el);
  // posição ajustável: arraste pelo título; fica salva
  try { const p = JSON.parse(localStorage.getItem('karmika.ui.quests') || 'null'); if (p) { el.style.left = p.x + 'px'; el.style.top = p.y + 'px'; } } catch { /* */ }
  let dragQ: { dx: number; dy: number } | null = null;
  el.addEventListener('pointerdown', (e) => { const h = (e.target as HTMLElement).closest('h4'); if (!h) return; const r = el.getBoundingClientRect(); dragQ = { dx: e.clientX - r.left, dy: e.clientY - r.top }; el.setPointerCapture(e.pointerId); e.preventDefault(); });
  el.addEventListener('pointermove', (e) => { if (!dragQ) return; const x = Math.max(0, Math.min(innerWidth - 120, e.clientX - dragQ.dx)), y = Math.max(0, Math.min(innerHeight - 60, e.clientY - dragQ.dy)); el.style.left = x + 'px'; el.style.top = y + 'px'; });
  el.addEventListener('pointerup', () => { if (!dragQ) return; dragQ = null; const r = el.getBoundingClientRect(); try { localStorage.setItem('karmika.ui.quests', JSON.stringify({ x: r.left, y: r.top })); } catch { /* */ } });
  const logEl = document.createElement('div'); logEl.id = 'qlog'; document.body.appendChild(logEl);
  let focusId: string | null = null; // missão aberta em destaque no diário (clique na seta ↗ do card)
  let logOpen = false, boardOpen = false, boardTab: 'c' | 'l' | 'p' | 'a' | 'm' | 'g' = 'c';
  /* ---- cartas de próprio punho: o jogador escreve, lacra e prega no quadro. O contato fica lacrado até alguém pegar a carta;
     pegar = aceitar o contrato, e o autor é avisado pelo correio. (local por enquanto; o servidor sincroniza entre jogadores) ---- */
  type LKind = 'kill' | 'revenge' | 'party' | 'buy' | 'love' | 'other';
  interface Letter { id: string; by: string; kind: LKind; title: string; body: string; target?: string; /** o Olho viu: o alvo matou quem escreveu */ seen?: boolean; reward: number; contact: string; mine?: boolean; takenBy?: string; t: number }
  interface Mail { t: number; text: string; read?: boolean }
  const LK: Record<LKind, { name: string; ic: string; seal: string; post: number; take: number; hint: string }> = {
    kill: { name: 'Sentença de Morte', ic: '☠', seal: '#5a0e0e', post: -8, take: -10, hint: 'Pedir a morte de alguém pesa no karma de quem pede e de quem aceita.' },
    revenge: { name: 'Contrato de Vingança', ic: '⚖', seal: '#4a1840', post: -3, take: -4, hint: 'Alguém atravessou o seu caminho e você paga para que ele caia (não para que desencarne de vez). Se foi ele quem matou você, o Olho já viu: o peso é bem menor.' },
    party: { name: 'Chamado de Grupo', ic: '⚔', seal: '#7a5a1a', post: 0, take: 2, hint: 'Ajuda em missão, chefe ou masmorra.' },
    buy: { name: 'Proposta de Compra', ic: '🪙', seal: '#6a5a2a', post: 0, take: 0, hint: 'Compro ou vendo um item; o acerto é feito direto entre vocês.' },
    love: { name: 'Correio Elegante', ic: '✉', seal: '#6a1a24', post: 0, take: 1, hint: 'Uma carta para quem quiser responder. Discreta e com lacre de cera.' },
    other: { name: 'Carta', ic: '📜', seal: '#3a3a4a', post: 0, take: 0, hint: 'Qualquer outro assunto.' },
  };
  const kTake = (l: { kind: LKind; seen?: boolean }) => l.kind === 'revenge' && l.seen ? -1 : LK[l.kind].take;
  const esc = (t: string) => G(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
  const ld = <T,>(k: string, d: T): T => { try { const v = JSON.parse(localStorage.getItem(k) || 'null'); return v ?? d; } catch { return d; } };
  const sv = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* */ } };
  const SEED_LETTERS: Letter[] = [
    { id: 's1', by: 'Tessa', kind: 'party', title: 'Procuro escudo para o Príncipe das Cinzas', body: 'Sou curandeira e não aguento os golpes dele sozinha. Divido o tesouro em partes iguais.', reward: 0, contact: 'Tessa — na Igreja Abandonada ao anoitecer, ou /w Tessa', t: 0 },
    { id: 's2', by: 'Ulfgar', kind: 'kill', title: 'A cabeça de Hakon, o Traidor', body: 'Hakon vendeu minha caravana aos draugr. Quero que ele desencarne. O Olho que me julgue.', target: 'Hakon', reward: 900, contact: 'Ulfgar — taverna de Askavik, mesa do fundo', t: 0 },
    { id: 's5', by: 'Ingrid', kind: 'revenge', title: 'Varg me deixou para os corvos', body: 'Caçávamos juntos na Floresta Sombria. Quando o lobo-alfa veio, Varg fugiu com a carne e me deixou para trás. Não quero que ele desencarne: quero que caia uma vez, e saiba por quê.', target: 'Varg', reward: 300, contact: 'Ingrid — junto ao poço da praça, de manhã', t: 0 },
    { id: 's3', by: 'Gunnar', kind: 'buy', title: 'Compro Garras da Lua Velha', body: 'Pago bem e sem perguntas. Também aceito troca por um épico de anão.', reward: 4000, contact: 'Gunnar — forja de Vestheim', t: 0 },
    { id: 's4', by: 'Sólveig', kind: 'love', title: 'Para quem também olha as estrelas da fonte', body: 'Toda noite sento no banco da praça. Se você também gosta do silêncio da fonte, venha conversar.', reward: 0, contact: 'Sólveig — banco da praça de Karmika, à noite', t: 0 },
  ];
  /* quem matou você fora de um duelo fica guardado: o Olho viu, e a vingança contra essa pessoa pesa menos */
  interface Grudge { name: string; t: number }
  let grudges: Grudge[] = ld('karmika.grudge.v1', []);
  const seenBy = (nm: string) => grudges.some((g) => g.name.toLowerCase() === nm.trim().toLowerCase());
  const kPost = (kd: LKind, tgt: string) => kd === 'revenge' && seenBy(tgt) ? 0 : LK[kd].post;
  let letters: Letter[] = ld('karmika.letters.v1', SEED_LETTERS), taken: Letter[] = ld('karmika.taken.v1', []), mail: Mail[] = ld('karmika.mail.v1', []);
  for (const sl of SEED_LETTERS) if (!letters.some((l) => l.id === sl.id) && !taken.some((l) => l.id === sl.id) && sl.id === 's5') letters.push(sl); // cartas novas chegam a quem já tinha o quadro
  const saveL = () => { sv('karmika.letters.v1', letters); sv('karmika.taken.v1', taken); sv('karmika.mail.v1', mail); };
  let draft = { kind: 'party' as LKind, title: '', body: '', target: '', reward: 0, contact: '' }, writing = false, confirmTake: string | null = null;
  const unread = () => mail.filter((m) => !m.read).length;
  function letterCard(l: Letter, mode: 'board' | 'taken') {
    const k = LK[l.kind], mine = l.mine, open = mode === 'taken';
    const act = mode === 'taken' ? '' : mine ? (l.takenBy ? `<small class="lt-ok">✔ Pega por ${esc(l.takenBy)}</small>` : `<button data-ldel="${l.id}">Retirar</button>`) : `<button data-ltake="${l.id}" class="${confirmTake === l.id ? 'warn' : ''}">${confirmTake === l.id ? `Confirmar${kTake(l) ? ` (karma ${kTake(l) > 0 ? '+' : ''}${kTake(l)})` : ''}` : 'Pegar a carta'}</button>`;
    return `<div class="letter k-${l.kind}"><i class="seal" style="background:${k.seal}">${k.ic}</i>${act}<em class="lk">${k.name}${l.target ? ` · alvo: <b>${esc(l.target)}</b>` : ''}${l.seen ? ' · <span class="seen">👁 o Olho viu: o alvo matou quem escreveu</span>' : ''}</em><b class="lt">${esc(l.title)}</b><p>${esc(l.body)}</p><span class="sig">— ${mine ? 'Você' : esc(l.by)}</span>${l.reward ? `<small class="rw">Oferece ${l.reward} 🪙 <span>(acerto direto entre vocês)</span></small>` : ''}${open || mine ? `<small class="ct">📍 ${esc(l.contact)}</small>` : '<small class="ct lock">🔒 Contato lacrado — só quem pegar a carta pode ver</small>'}</div>`;
  }
  const lhint = () => { const k = LK[draft.kind], pk = kPost(draft.kind, draft.target); return `${k.hint}${draft.kind === 'revenge' && grudges.length ? ` Quem já matou você: ${grudges.slice(-4).map((g) => `<b>${esc(g.name)}</b>`).join(', ')}.` : ''}${pk ? ` Pregar esta carta: karma ${pk}.` : draft.kind === 'revenge' && draft.target.trim() ? ' <b class="seen">O Olho viu o que essa pessoa fez: pregar não pesa.</b>' : ''}`; };
  function lettersHtml() {

    const form = writing ? `<div class="lform"><div class="lrow"><select data-lf="kind">${(Object.keys(LK) as LKind[]).map((x) => `<option value="${x}" ${x === draft.kind ? 'selected' : ''}>${LK[x].ic} ${LK[x].name}</option>`).join('')}</select>${draft.kind === 'kill' || draft.kind === 'revenge' ? `<input data-lf="target" maxlength="24" list="lgrudge" placeholder="Nome do alvo" value="${esc(draft.target)}"><datalist id="lgrudge">${grudges.map((g) => `<option value="${esc(g.name)}">matou você em ${new Date(g.t).toLocaleDateString('pt-BR')}</option>`).join('')}</datalist>` : ''}<input data-lf="reward" type="number" min="0" max="999999" title="Recompensa oferecida (ouro)" value="${draft.reward || ''}" placeholder="Ouro"></div>
      <small class="lhint">${lhint()}</small>
      <input data-lf="title" maxlength="60" placeholder="Título da carta" value="${esc(draft.title)}">
      <textarea data-lf="body" maxlength="400" rows="4" placeholder="Escreva de próprio punho…">${esc(draft.body)}</textarea>
      <input data-lf="contact" maxlength="80" placeholder="Como te encontrar (fica lacrado até alguém pegar a carta)" value="${esc(draft.contact)}">
      <div class="lrow"><button data-lsend>Lacrar e pregar no quadro (2 🪙)</button><button data-lcancel class="ghost">Cancelar</button></div></div>` : `<button data-lwrite class="lwrite">✒ Escrever uma carta</button>`;
    const others = letters.filter((l) => !l.mine && !l.takenBy), mine = letters.filter((l) => l.mine);
    return `<small>Cartas de próprio punho pregadas no quadro. O contato de quem escreveu fica lacrado: pegar a carta é aceitar o contrato, e o autor fica sabendo.</small>${form}
      ${mine.length ? `<h3 class="bh">Suas cartas <small>${mine.length}</small></h3>${mine.map((l) => letterCard(l, 'board')).join('')}` : ''}
      ${taken.length ? `<h3 class="bh">Cartas que você pegou <small>${taken.length}</small></h3>${taken.map((l) => letterCard(l, 'taken')).join('')}` : ''}
      <h3 class="bh">No quadro <small>${others.length}</small></h3>${others.length ? others.map((l) => letterCard(l, 'board')).join('') : '<em class="emptyb">Nenhuma carta pregada.</em>'}`;
  }
  function mailHtml() {
    const h = `<small>Avisos do quadro sobre as suas cartas. Para escrever a um jogador pelo nome e enviar itens ou ouro, use a 📮 Caixa de Correio da cidade.</small>${mail.length ? [...mail].reverse().map((m) => `<div class="rc mail ${m.read ? '' : 'new'}"><small>${new Date(m.t).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</small>${m.text}</div>`).join('') : '<em class="emptyb">Nenhuma mensagem.</em>'}`;
    let ch = false; for (const m of mail) if (!m.read) { m.read = true; ch = true; } if (ch) saveL();
    return h;
  }
  /* sem servidor ainda: outros caminhantes (simulados) pegam as suas cartas de vez em quando, para o fluxo do correio funcionar */
  const WALKERS = ['Eirik', 'Kaela', 'Haldis', 'Torvald', 'Rosália', 'Kolbeinn', 'Ragna', 'Sigurd', 'Yrsa', 'Doran'];
  setInterval(() => { let ch = false; for (const l of letters) if (l.mine && !l.takenBy && Date.now() - l.t > 45000 && Math.random() < 0.2) { l.takenBy = WALKERS[Math.floor(Math.random() * WALKERS.length)]; mail.push({ t: Date.now(), text: `📨 Sua carta <b>“${esc(l.title)}”</b> (${LK[l.kind].name}) foi pega por <b>${l.takenBy}</b>. O contrato foi aceito: agora ${l.takenBy} tem o seu contato. <span class="sim">(simulação local até o servidor)</span>` }); ctx.log(`📨 Sua carta “${l.title}” foi pega por ${l.takenBy}. Veja o Correio no quadro.`, '#ffe08a'); ch = true; } if (ch) { saveL(); if (boardOpen) render(); } }, 15000);
  /* pedidos de jogadores no quadro (local por enquanto; o servidor sincroniza depois) */
  interface Post { by: string; item: string; n: number; gold: number; mine?: boolean; rid?: number }
  const POSTABLE = ['wood', 'stone', 'hide', 'meat', 'fish', 'claw', 'dust', 'sap', 'apple', 'plank', 'nail', 'potion'];
  const loadPosts = (): Post[] => { try { return JSON.parse(localStorage.getItem('karmika.posts.v1') || 'null') ?? [{ by: 'Tessa', item: 'apple', n: 8, gold: 30 }, { by: 'Gunnar', item: 'plank', n: 6, gold: 45 }]; } catch { return []; } };
  const savePosts = (p: Post[]) => { try { localStorage.setItem('karmika.posts.v1', JSON.stringify(p)); } catch { /* */ } };
  function render() {
    const ids = Object.keys(q.active);
    if (tracked && !q.active[tracked]) tracked = null; if (!tracked && ids.length) tracked = ids[0];
    { // cards agrupados por cor (história, secundárias, repetição), com um respiro entre os grupos
      const sorted = [...ids].sort((a, b) => CAT_ORDER.indexOf(questCat(def(a))) - CAT_ORDER.indexOf(questCat(def(b))));
      let prev: QuestCat | null = null;
      const xt = extraTop?.() ?? '';
      el.innerHTML = ids.length || xt ? `<h4>Missões <small>${ids.length}/${questLimit()} · J</small><small class="mv">⠿ arraste</small></h4>` + xt + sorted.map((id) => { const d = def(id), ok = complete(d), c = questCat(d), gap = prev !== null && prev !== c; prev = c;
        return `<div class="q c-${c} ${gap ? 'gap' : ''} ${ok ? 'ok' : ''} ${id === tracked ? 'track' : ''}" data-id="${id}"><a class="qopen" data-open="${id}" title="Abrir no diário (J)">↗</a><b>${d.name}</b><span class="qx">${q.active[id].from ? `<u class="qfrom">missão de ${q.active[id].from}</u> · ` : ''}${d.giver}${d.chain ? ' · ' + d.chain : ''} · Nv ${d.lvl}</span>${d.objs.map((o, i) => `<i>${objText(o)} <em>${objProg(d, i)}/${objNeed(o)}</em></i>`).join('')}${ok ? `<i class="go">→ Entregar a ${d.turnin ?? d.giver}</i>` : ''}${id === tracked ? '<i class="dir"></i>' : ''}</div>`; }).join('') : '';
    }
    if (boardOpen) {
      const bs = board();
      const roomOn = !!ctx.room?.on(), me = (ctx.me?.() ?? '').toLowerCase();
      const posts: Post[] = roomOn ? ctx.room!.posts().map((p) => ({ by: p.by, item: p.item, n: p.n, gold: p.gold, rid: p.id, mine: p.by.toLowerCase() === me })) : loadPosts();
      const guilds = [['Igreja Kármica', 'Procura-se: 12 Pó de Fada para o óleo dos votos. Fale com Eldrin.'], ['Academia Tecnológica', 'Contrato aberto: mapas das ruínas do sul. Recompensa em peças.'], ['Escola de Guerra', 'Torneio mensal de Askavik: inscrições com o Mestre Halvard.'], ['Guildas de jogadores', 'Chegam com o servidor: cada guilda terá seu quadro aqui, com missões para membros e para a cidade.']];
      logEl.innerHTML = `<div class="pn boardpn"><h2>📋 Quadro da Praça <button data-x>✕</button></h2>
        <div class="btabs"><button data-bt="c" class="${boardTab === 'c' ? 'on' : ''}">Contratos</button><button data-bt="l" class="${boardTab === 'l' ? 'on' : ''}">Cartas (${letters.filter((l) => !l.mine && !l.takenBy).length})</button><button data-bt="p" class="${boardTab === 'p' ? 'on' : ''}">Pedidos (${posts.length})</button>${ctx.auction ? `<button data-bt="a" class="${boardTab === 'a' ? 'on' : ''}">Leilão (${ctx.auction.count})</button>` : ''}<button data-bt="m" class="${boardTab === 'm' ? 'on' : ''}">Correio${unread() ? ` <i class="badge">${unread()}</i>` : ''}</button><button data-bt="g" class="${boardTab === 'g' ? 'on' : ''}">Guildas</button></div>
        ${boardTab === 'c' ? `<small>Contratos dos habitantes. Contratos contam no mesmo diário das outras missões (${questLimit()} ao mesmo tempo${isPremium() ? ', Premium' : '; Premium: 10'}). Novos aparecem sempre. <span style="color:#7aff7a">Verdes: recorrentes.</span></small>${(() => { const mine = boardActive(); return `<h3 class="bh">Seus contratos <small>diário ${Object.keys(q.active).length}/${questLimit()}</small></h3>${mine.length ? mine.map((d) => `<div class="rc took"><b>📌 ${d.name}</b> <small>Nv ${d.lvl} · ${d.giver}</small><small>${d.objs.map((o, i) => `${objText(o)} ${objProg(d, i)}/${objNeed(o)}`).join(' · ')}</small>${complete(d) ? `<small class="y">Pronto — entregue a ${d.turnin ?? d.giver}</small>` : ''}</div>`).join('') : '<em class="emptyb">Nenhum contrato aceito.</em>'}<h3 class="bh">Avisos pregados</h3>${bs.map((d, i) => `<div class="rc ok"><button data-acc="${i}" ${Object.keys(q.active).length >= questLimit() ? 'disabled' : ''}>Aceitar</button><b>${d.name}</b> <small>Nv ${d.lvl} · ${d.giver}</small><small>${d.text}</small><small>Recompensa: ${d.xp} XP · ${d.gold} 🪙</small></div>`).join('')}`; })()}` : ''}
        ${boardTab === 'p' ? `<small>Pedidos de jogadores: quem cumprir recebe o ouro depositado. Você pode publicar o seu (o ouro fica guardado no quadro até alguém cumprir ou você retirar).</small>
          <div class="postf"><select data-pi>${POSTABLE.map((id) => `<option value="${id}">${ITEMS[id]?.name ?? id}</option>`).join('')}</select><input data-pn type="number" min="1" max="99" value="5" title="quantidade"><input data-pg type="number" min="1" max="99999" value="40" title="ouro"><button data-post>Publicar pedido</button></div>
          ${roomOn ? '<small style="color:#9ad0ff">Quadro da sala: pedidos de jogadores de verdade. Itens e ouro viajam pelo correio.</small>' : ''}
          ${posts.length ? posts.map((p, i) => { const k = p.rid !== undefined ? 'r' + p.rid : String(i); return `<div class="rc ${p.mine ? 'mine' : 'ok'}"><b>${p.mine ? 'Você' : p.by}</b> procura <b>${p.n}× ${ITEMS[p.item]?.name ?? p.item}</b> <small>paga ${p.gold} 🪙</small>${p.mine ? `<button data-pdel="${k}">Retirar</button>` : ctx.count(p.item) >= p.n ? `<button data-pfill="${k}">Entregar</button>` : `<small>você tem ${ctx.count(p.item)}</small>`}</div>`; }).join('') : '<em>Nenhum pedido ainda. Publique o primeiro.</em>'}` : ''}
        ${boardTab === 'l' ? lettersHtml() : ''}${boardTab === 'm' ? mailHtml() : ''}${boardTab === 'a' && ctx.auction ? `<div class="auction">${ctx.auction.html()}</div>` : ''}
        ${boardTab === 'g' ? guilds.map(([g, t]) => `<div class="rc"><b>${g}</b><small>${t}</small></div>`).join('') : ''}
        <small class="ft">Esc fecha</small></div>`;
      logEl.style.display = 'flex'; return;
    }
    if (logOpen) {
      if (focusId && !q.active[focusId]) focusId = null;
      if (!focusId) focusId = (tracked && q.active[tracked] ? tracked : null) ?? (ids[0] ?? null);
      const fd = focusId ? def(focusId) : null;
      const focusHtml = fd ? (() => { const c = questCat(fd), ci = CAT_INFO[c], chainList = fd.chain ? ctx.chainQuests.filter((x) => x.chain === fd.chain) : [];
        return `<div class="qfocus c-${c}"><div class="qf-h"><span class="qcat" style="color:${ci.col};border-color:${ci.col}">${ci.name}</span><b>${fd.name}</b><small>Nv ${fd.lvl}${fd.chain ? ' · ' + fd.chain : fd.board ? ' · Quadro' : ''}</small></div>
          <div class="qf-talk"><div class="qf-who">${fd.giver} disse:</div><p>“${fd.text}”</p>${fd.turnin && fd.turnin !== fd.giver ? `<div class="qf-to">Quando terminar, procure <b>${fd.turnin}</b>.</div>` : ''}</div>
          <div class="qf-obj"><h4>Objetivos</h4>${fd.objs.map((o, i) => { const pr = objProg(fd, i), nd = objNeed(o); return `<div class="${pr >= nd ? 'done' : ''}"><span>${pr >= nd ? '✔' : '◇'} ${objText(o)}</span><em>${pr}/${nd}</em></div>`; }).join('')}${complete(fd) ? `<div class="go">→ Pronto: entregue a ${fd.turnin ?? fd.giver}</div>` : ''}</div>
          <div class="qf-rw"><h4>Recompensa</h4>${fd.xp} XP · ${fd.gold} 🪙${fd.items ? ' · ' + fd.items.map(([it, n]) => `${n}× ${ITEMS[it]?.name}`).join(', ') : ''}${fd.gear ? ` · ${fd.gear} equipamento${fd.gear > 1 ? 's' : ''}` : ''}${fd.title ? ' · Título: <b>' + fd.title + '</b>' : ''}${fd.choice ? '<div class="qf-ch">⚖ Esta missão termina com uma escolha. O Olho vai julgar o motivo.</div>' : ''}</div>
          ${chainList.length > 1 ? `<div class="qf-chain"><h4>${fd.chain} <small>${chainList.filter((x) => isDone(x.id)).length}/${chainList.length}</small></h4><div class="qf-chips">${chainList.map((x, i) => `<span class="${isDone(x.id) ? 'd' : x.id === fd.id ? 'cur' : ''}" title="${x.name} · Nv ${x.lvl}">${i + 1}</span>`).join('')}</div></div>` : ''}
          <div class="qf-b"><button data-qtrack="${fd.id}">${tracked === fd.id ? '✔ Guiando até ela' : '🧭 Guiar até ela'}</button><button data-qfx>Ver todas</button></div></div>`; })() : '';
      const act = [...ids].sort((a, b) => CAT_ORDER.indexOf(questCat(def(a))) - CAT_ORDER.indexOf(questCat(def(b))));
      let pc: QuestCat | null = null;
      const actHtml = act.map((id) => { const d = def(id), c = questCat(d), head = pc !== c ? `<h4 class="qgrp" style="color:${CAT_INFO[c].col}">${CAT_INFO[c].name}</h4>` : ''; pc = c; return `${head}<div class="rc qrc c-${c} ${id === focusId ? 'sel' : ''}" data-qf="${id}"><b>${d.name}</b> <small>Nv ${d.lvl} · ${d.giver}${d.chain ? ' · ' + d.chain : ' · Quadro'}</small><small>${d.objs.map((o, i) => `${objText(o)} ${objProg(d, i)}/${objNeed(o)}`).join(' · ')}</small></div>`; }).join('');
      // histórias: uma linha por corrente, com barra de progresso e a próxima missão (nada de lista comprida)
      const chains = [...new Set(ctx.chainQuests.map((d) => d.chain ?? 'Outras'))].map((cn) => { const L = ctx.chainQuests.filter((d) => (d.chain ?? 'Outras') === cn), dn = L.filter((d) => isDone(d.id)).length, nx = L.find((d) => !isDone(d.id));
        const c = questCat(L[0]); return `<div class="ql-ch c-${c}"><div><b>${cn}</b><small>${dn}/${L.length}</small></div><i><u style="width:${(dn / L.length * 100).toFixed(0)}%"></u></i><em>${nx ? (q.active[nx.id] ? '▶ ' : '· próxima: ') + nx.name + ` · Nv ${nx.lvl}` : '✔ completa'}</em></div>`; }).join('');
      logEl.innerHTML = `<div class="pn qlogpn"><h2>Diário de Missões <small>${ids.length}/${questLimit()} ativas · ${q.done.length} concluídas${q.title ? ` · título: <b>${q.title}</b>` : ''}</small><button data-x>✕</button></h2>
        <div class="ql-body"><div class="ql-list"><h3>Ativas</h3>${actHtml || '<em>Nenhuma. Fale com os habitantes (E) ou veja o Quadro.</em>'}<h3 class="ql-sep">Histórias</h3>${chains}</div>
        <div class="ql-detail">${focusHtml || '<div class="ql-empty">Escolha uma missão à esquerda para ver a conversa, os objetivos e a recompensa.</div>'}</div></div></div>`;
      logEl.style.display = 'flex';
    } else logEl.style.display = 'none';
  }
  el.addEventListener('click', (e) => { const o = (e.target as HTMLElement).closest('[data-open]') as HTMLElement | null; if (o) { e.stopPropagation(); focusId = o.dataset.open!; logOpen = true; boardOpen = false; render(); return; } const t = (e.target as HTMLElement).closest('[data-id]') as HTMLElement | null; if (t) { tracked = t.dataset.id!; render(); } });
  const onDraft = (e: Event) => { const f = e.target as HTMLInputElement; const k = f.dataset?.lf as keyof typeof draft | undefined; if (!k) return; if (k === 'reward') draft.reward = +f.value || 0; else if (k === 'kind') { draft.kind = f.value as LKind; render(); } else if (k === 'target') { draft.target = f.value; const h = logEl.querySelector('.lhint'); if (h) h.innerHTML = lhint(); } else (draft as Record<string, unknown>)[k] = f.value; };
  logEl.addEventListener('input', onDraft); logEl.addEventListener('change', onDraft);
  /* leilão: campos e dica dos equipamentos à venda */
  const onAuc = (e: Event) => { if (!ctx.auction || boardTab !== 'a') return; const f = e.target as HTMLInputElement; const r = ctx.auction.input(f);
    if (r === 'hard' || (r === 'soft' && e.type === 'input')) { const pos = f.selectionStart ?? f.value.length; render(); if (r === 'soft') { const n = logEl.querySelector('[data-aq]') as HTMLInputElement | null; if (n) { n.focus(); n.setSelectionRange(pos, pos); } } } };
  logEl.addEventListener('input', onAuc); logEl.addEventListener('change', (e) => { if ((e.target as HTMLElement).dataset?.aq === undefined) onAuc(e); });
  const atip = document.createElement('div'); atip.id = 'atip'; document.body.appendChild(atip);
  logEl.addEventListener('mousemove', (e) => { const t = (e.target as HTMLElement).closest('[data-atip]') as HTMLElement | null; const h = t && ctx.auction ? ctx.auction.tipOf(t.dataset.atip!) : '';
    if (!h) { atip.style.display = 'none'; return; } atip.innerHTML = h; atip.style.display = 'block'; atip.style.left = Math.min(innerWidth - 290, e.clientX + 16) + 'px'; atip.style.top = Math.min(innerHeight - atip.offsetHeight - 8, e.clientY + 12) + 'px'; });
  logEl.addEventListener('mouseleave', () => { atip.style.display = 'none'; });
  logEl.addEventListener('keydown', (e) => { if ((e.target as HTMLElement).closest('input,textarea,select')) e.stopPropagation(); });
  logEl.addEventListener('click', (e) => { const t = e.target as HTMLElement; if (t.closest('[data-x]')) { logOpen = false; boardOpen = false; focusId = null; render(); return; }
    if (logOpen) { const qf = (t.closest('[data-qf]') as HTMLElement | null)?.dataset.qf; if (qf) { focusId = qf; render(); logEl.querySelector('.qfocus')?.scrollIntoView({ block: 'nearest' }); return; }
      const qt = (t.closest('[data-qtrack]') as HTMLElement | null)?.dataset.qtrack; if (qt) { tracked = qt; render(); return; } if (t.closest('[data-qfx]')) { focusId = null; render(); return; } }
    const bt = (t.closest('[data-bt]') as HTMLElement | null)?.dataset.bt; if (bt) { boardTab = bt as typeof boardTab; confirmTake = null; render(); return; }
    if (boardTab === 'a' && ctx.auction && ctx.auction.click(t)) { atip.style.display = 'none'; render(); return; }
    if (t.closest('[data-lwrite]')) { writing = true; if (!draft.contact) draft.contact = `${ctx.me?.() ?? 'Caminhante'} — `; render(); return; }
    if (t.closest('[data-lcancel]')) { writing = false; render(); return; }
    if (t.closest('[data-lsend]')) {
      if (draft.title.trim().length < 3 || draft.body.trim().length < 5) { ctx.log('✒ Escreva um título e o texto da carta.', '#ff9a8a'); return; }
      if ((draft.kind === 'kill' || draft.kind === 'revenge') && !draft.target.trim()) { ctx.log(`✒ ${draft.kind === 'kill' ? 'Uma sentença de morte' : 'Um contrato de vingança'} precisa do nome do alvo.`, '#ff9a8a'); return; }
      if (ctx.st.gold < 2) { ctx.log('Sem ouro para papel e lacre (2 🪙).', '#ff9a8a'); return; }
      const tg = draft.target.trim(), pk = kPost(draft.kind, tg), seen = draft.kind === 'revenge' && seenBy(tg);
      ctx.st.gold -= 2; if (pk) { ctx.karma?.(pk); ctx.log(draft.kind === 'kill' ? `👁 Você pediu a morte de ${tg}. Marghar guarda. Karma ${pk}.` : `👁 Você pagou para ver ${tg} cair. O Olho anota quem pede. Karma ${pk}.`, '#c46a6a'); }
      else if (seen) ctx.log(`👁 ${tg} matou você e o Olho viu. Cobrar essa conta não pesa no seu karma.`, '#d9a0d0');
      letters.unshift({ id: 'm' + Date.now(), by: ctx.me?.() ?? 'Você', kind: draft.kind, title: draft.title.trim(), body: draft.body.trim(), target: draft.kind === 'kill' || draft.kind === 'revenge' ? tg : undefined, seen: seen || undefined, reward: Math.max(0, Math.floor(draft.reward || 0)), contact: draft.contact.trim() || (ctx.me?.() ?? 'Caminhante'), mine: true, t: Date.now() });
      ctx.log(`📜 Carta pregada no quadro: “${draft.title.trim()}”. Você será avisado quando alguém a pegar.`, '#ffe08a');
      draft = { kind: draft.kind, title: '', body: '', target: '', reward: 0, contact: draft.contact }; writing = false; saveL(); render(); return; }
    const ldl = (t.closest('[data-ldel]') as HTMLElement | null)?.dataset.ldel; if (ldl) { letters = letters.filter((l) => l.id !== ldl); saveL(); ctx.log('Você arrancou a sua carta do quadro.', '#b9c6e0'); render(); return; }
    const lt = (t.closest('[data-ltake]') as HTMLElement | null)?.dataset.ltake; if (lt) { const l = letters.find((x) => x.id === lt); if (!l) return;
      if (confirmTake !== lt) { confirmTake = lt; render(); return; } confirmTake = null;
      l.takenBy = ctx.me?.() ?? 'Você'; taken.unshift({ ...l }); letters = letters.filter((x) => x.id !== lt);
      const tk = kTake(l); if (tk) ctx.karma?.(tk);
      ctx.log(`📜 Você pegou a carta de ${l.by}: “${l.title}”. O contato foi revelado e ${l.by} foi avisado.${tk ? ` Karma ${tk > 0 ? '+' : ''}${tk}.` : ''}`, l.kind === 'kill' || l.kind === 'revenge' ? '#c46a6a' : '#ffe08a'); saveL(); render(); return; }
    if (t.closest('[data-post]')) { const item = (logEl.querySelector('[data-pi]') as HTMLSelectElement).value, n = Math.max(1, +(logEl.querySelector('[data-pn]') as HTMLInputElement).value || 1), gold = Math.max(1, +(logEl.querySelector('[data-pg]') as HTMLInputElement).value || 1); if (ctx.st.gold < gold) { ctx.log('Ouro insuficiente para deixar no quadro.', '#ff9a8a'); return; } ctx.st.gold -= gold;
      if (ctx.room?.on()) { ctx.room.add(item, n, gold); ctx.log(`📋 Pedido publicado no quadro da sala: ${n}× ${ITEMS[item]?.name ?? item} por ${gold} 🪙 (o ouro fica guardado até alguém entregar).`, '#ffe08a'); return; }
      const ps = loadPosts(); ps.unshift({ by: 'Você', item, n, gold, mine: true }); savePosts(ps); ctx.log(`📋 Pedido publicado: ${n}× ${ITEMS[item]?.name ?? item} por ${gold} 🪙 (ouro guardado no quadro).`, '#ffe08a'); render(); return; }
    const pd = (t.closest('[data-pdel]') as HTMLElement | null)?.dataset.pdel; if (pd?.startsWith('r') && ctx.room) { ctx.room.cancel(+pd.slice(1)); ctx.log('📋 Pedido retirado: o ouro volta pelo correio.', '#b9c6e0'); return; } if (pd !== undefined) { const ps = loadPosts(); const p = ps.splice(+pd, 1)[0]; if (p?.mine) ctx.st.gold += p.gold; savePosts(ps); ctx.log('Pedido retirado; o ouro voltou.', '#b9c6e0'); render(); return; }
    const pf = (t.closest('[data-pfill]') as HTMLElement | null)?.dataset.pfill;
    if (pf?.startsWith('r') && ctx.room) { const p = ctx.room.posts().find((x) => x.id === +pf.slice(1)); if (p && ctx.take(p.item, p.n)) { ctx.room.fill(p.id, p.item, p.n); ctx.log(`📋 Você entregou ${p.n}× ${ITEMS[p.item]?.name ?? p.item} a ${p.by}: o ouro chega pelo correio.`, '#ffd24a'); ctx.gainXp(Math.round(p.gold * 0.5)); } render(); return; }
    if (pf !== undefined) { const ps = loadPosts(); const p = ps[+pf]; if (p && ctx.take(p.item, p.n)) { ctx.st.gold += p.gold; ps.splice(+pf, 1); savePosts(ps); ctx.log(`📋 Pedido de ${p.by} cumprido: +${p.gold} 🪙`, '#ffd24a'); ctx.gainXp(Math.round(p.gold * 1.5)); } render(); return; } const a = t.closest('[data-acc]') as HTMLElement | null; if (a && !(a as HTMLButtonElement).disabled) { const bs = board(); acceptBoard(bs[+a.dataset.acc!]); render(); } });
  render();
  /** missão que um companheiro de grupo pegou: 'have' = já tenho, 'done' = já fiz, 'later' = ainda não cheguei nessa parte da história, 'ok' = posso pegar */
  function shareState(d: QuestDef): 'have' | 'done' | 'later' | 'ok' { if (q.active[d.id]) return 'have'; if (q.done.includes(d.id)) return 'done'; if (d.chain && !offers(d.giver).some((x) => x.id === d.id)) return 'later'; return 'ok'; }
  /** alguém matou você fora de duelo: o Olho guarda o nome (até 12, o mais recente por último) */
  function grudge(name: string) { if (!name) return; grudges = grudges.filter((g) => g.name.toLowerCase() !== name.toLowerCase()); grudges.push({ name, t: Date.now() }); grudges = grudges.slice(-12); sv('karmika.grudge.v1', grudges); }
  return { grudge, shareState, setExtraTop(f: () => string) { extraTop = f; }, setOnDone(f: (d: QuestDef) => void) { onDoneCb = f; }, setOnAccept(f: (d: QuestDef) => void) { onAcceptCb = f; }, def, q, offers, turnins, accept, turnIn, onKill, onTalk, onVisit, onCraft, onDungeon, onCaravan, onSense, board, acceptBoard, complete, render, get isOpen() { return logOpen || boardOpen; }, toggleLog() { logOpen = !logOpen; boardOpen = false; if (!logOpen) focusId = null; render(); }, openLog(id?: string) { focusId = id ?? null; logOpen = true; boardOpen = false; render(); }, openBoard() { boardOpen = true; logOpen = false; render(); }, closeAll() { logOpen = false; boardOpen = false; render(); }, get title() { return q.title; }, get tracked() { return tracked ? def(tracked) : null; }, objProg, objNeed: (d: QuestDef, i: number) => objNeed(d.objs[i]), firstOpen(d: QuestDef) { return d.objs.findIndex((o, i) => objProg(d, i) < objNeed(o)); }, refreshBoard() { if (boardOpen) render(); }, reset() { q.active = {}; q.done = []; q.boardSeed = 1; q.title = ''; save(); render(); },
    /** reencarnação: esquece as missões do caminho de classe para poder refazê-las */
    forget(f: (id: string) => boolean) { for (const id of Object.keys(q.active)) if (f(id)) delete q.active[id]; q.done = q.done.filter((id) => !f(id)); save(); render(); },
    /** marca como feita sem entregar (testes do beta) */ markDone(id: string) { delete q.active[id]; if (!q.done.includes(id)) q.done.push(id); save(); render(); } };
}
