/* ---------- CAPÍTULO IV — "O LABIRINTO" (níveis 76–98): o que as onze classes têm em comum (20/11).
   Roteiro aprovado por Erling (roteiro-capitulo-4-17-11.md e expansao-os-que-voltam-17-11.md). A espinha é a mesma para todas:
     1 Os Que Voltaram · 2, 3, 4 a podridão dentro da própria casa · 5 A Entrada · 6 Quem Governa a Ponte · 7 o espelho do Labirinto ·
     8 A Ala Três · 9 o julgamento da casa · 10 O Dia dos Prantos.
   REGRAS FIXAS (Erling, 17/11 e 20/11):
     · cada casa acha A MÃO que fez; de onde a podridão vem NÃO aparece. A culpa cai em Zerath e ninguém liga os casos das casas entre si;
     · NENHUM sinal é ligado a um dono: a nona cor, o décimo nicho, a letra antiga, a capa cinza, a caixa de música, a porta preta, a Voz do
       Sussurro, o sino do olho fechado. Aparecem; ninguém diz de quem são;
     · o homem de capa cinza nunca tem rosto nem nome, e nenhum personagem comenta que é a mesma pessoa;
     · ninguém reconcilia ninguém; o solene tem sempre alguém pequeno ao lado;
     · no Dia dos Prantos caem o Grão-Mestre Cassius (com a Lágrima à vista no pescoço, sem ninguém comentar), o Conde Vladislav III e o
       Hallvard, filho do Halfdan. Cada bandeira só vê o próprio líder cair; só o jogador viu as duas cenas. Os detalhes da queda do
       Hallvard são sempre os mesmos (a última fala, o lado do machado, a cor do céu): a canção da expansão cita cada um.
   Aqui ficam as cenas que todas as classes veem do mesmo jeito; a fala de cada casa fica no arquivo da classe. ---------- */
import { Q, m, talk, visit, sense } from '../qb';

export type Fala = Parameters<typeof Q>[6];
export type Escolha = Parameters<typeof Q>[8];
export type Objs = Parameters<typeof Q>[5];
export type Extra = Parameters<typeof Q>[9];
type Sentido = Parameters<typeof sense>[0];

/* quem já estava no mundo */
export const CS = 'Grão-Mestre Cassius', AL = 'Paladino Aldric', SO = 'Bispa Solveig';
export const IL = 'Mestra Ilsa Van Rhal', VH = 'Caçadora Vesna Helsing', PIP = 'Pip';
export const AV = 'Arquimago Aurelian Vesk', IS = 'Ísold Pena-Clara', SE = 'Arquimaga Seline', OR = 'Cronista Ormund Salveth', CO = 'Aprendiz Corin';
export const BQ = 'Táraka, o Barqueiro', ED = 'Guardiã da Ponte Edla';
/* quem o Capítulo IV põe no mundo (npcs.ts): a mão de cada casa */
export const EV = 'Cônego Evarist', RU = 'Intendente Rurik', MO = 'Mestre-Arcano Morvan';

/** o nível de cada uma das dez missões (a montagem em capitulo1.ts usa esta lista) */
export const LV4 = [76, 78, 80, 82, 84, 87, 90, 93, 96, 98];

/* ---------- 1 · OS QUE VOLTARAM (76): refugiados do Labirinto descem o rio e Velmora vira cidade ---------- */
const BQ_VOLTA = (visto: string) => [
  m(BQ, 'Trinta anos levando gente para um lado e para o outro. Este mês eu só levo para um. Nunca foi assim.'),
  m(BQ, 'Eles descem o rio calados. Pagam com o que têm. Uns pagam com um botão. Eu aceito botão.'),
  m(BQ, visto),
  m(BQ, 'Pergunte de onde vêm e todos apontam para cima do rio. Pergunte o que viram e todos olham para a ponte. Para debaixo dela.')];
export const voltaram = (id: string, giver: string, text: string, falaL: Fala, fimL: Fala, visto: string, escolha?: Escolha, extra: Extra = {}) =>
  Q(id, 'Os Que Voltaram', giver, giver, text,
    [visit('Velmora'), sense('rastro', 'A fila dos que voltaram, na cabeceira da ponte', 'Velmora', 12, -1), talk(BQ)],
    falaL, fimL, escolha, { meet: { [BQ]: BQ_VOLTA(visto) }, ...extra });

/* ---------- 5 · A ENTRADA (84): cada classe entra no Labirinto pela sua porta ---------- */
export const entrada = (id: string, nome: string, giver: string, text: string, lugar: string, oQue: Sentido, rotulo: string, dx: number, dy: number, objs: Objs, falaL: Fala, fimL: Fala, escolha?: Escolha, extra: Extra = {}) =>
  Q(id, nome, giver, giver, text, [visit(lugar), sense(oQue, rotulo, lugar, dx, dy), ...objs], falaL, fimL, escolha, extra);

/* ---------- 6 · QUEM GOVERNA A PONTE (87): Velmora cresceu; as duas bandeiras querem a ponte; a porta preta começa a bater por dentro ---------- */
const PORTA_BATE = { name: 'A Porta Debaixo do Pilar', lines: ['(Uma batida. Devagar. De dentro.)', '(Outra. No mesmo compasso de quem conta.)', '(Ninguém na ponte para de falar. Todos ouviram.)'] };
const ED_PONTE = [
  m(ED, 'Velmora tinha quarenta casas. Agora tem quatrocentas barracas e duas bandeiras querendo dizer quem atravessa.'),
  m(ED, 'O Fio quer um posto na cabeceira da Aurora. Os Desfiados querem outro na da Noite. Os dois me mandaram presente. Devolvi os dois.'),
  m(ED, 'E a porta debaixo do pilar começou a bater. Por dentro. Eu guardo esta ponte há trinta anos e não sei o que responder a uma porta.')];
export const ponte = (id: string, giver: string, text: string, objs: Objs, falaL: Fala, fimL: Fala, escolha: Escolha, extra: Extra = {}) =>
  Q(id, 'Quem Governa a Ponte', giver, giver, text,
    [visit('Ponte de Velmora'), ...objs, talk(ED), sense('espirito', 'A porta de pedra preta, que bate por dentro', 'Ponte de Velmora', 0, 2, PORTA_BATE)],
    falaL, fimL, escolha, { meet: { [ED]: ED_PONTE }, ...extra });

/* ---------- 7 · O ESPELHO DO LABIRINTO (90): o mesmo dia e o mesmo corredor, visto de três jeitos ---------- */
export const ESPELHO = { fio: 'A Alma Que Não Estava Pronta', desfiados: 'Quem Não Quis Sair', semLado: 'O Labirinto Sem Lado' } as const;
/** o corredor é um só: quem entra pelo Fio, pelos Desfiados ou sem bandeira encontra o mesmo dia */
export const CORREDOR = 'No segundo corredor do Labirinto, uma grade de ferro velho separa dois lados. De um lado, gente do Fio com lanternas. Do outro, Desfiados sem lanterna nenhuma. No meio, sentado no chão, alguém que não é de ninguém.';
/** a alma do meio do corredor diz o mesmo a todo mundo */
const ALMA = { name: 'A Alma do Corredor', lines: ['Eu ainda não terminei.', 'Não sei o quê. Mas não terminei.', 'Parem de gritar por cima de mim.'] };
export const espelho = (id: string, lado: keyof typeof ESPELHO, giver: string, text: string, lugar: string, dx: number, dy: number, objs: Objs, falaL: Fala, fimL: Fala, escolha: Escolha, extra: Extra = {}) =>
  Q(id, ESPELHO[lado], giver, giver, CORREDOR + ' ' + text, [visit(lugar), ...objs, sense('espirito', 'A alma sentada no meio do corredor', lugar, dx, dy, ALMA)], falaL, fimL, escolha, extra);

/* ---------- 8 · A ALA TRÊS (93): a porta preta sem maçaneta e a Voz do Sussurro. A pista da classe fica aqui, sem resposta ---------- */
/** a Voz diz a mesma coisa a todos; a última frase é a de cada classe */
const VOZ = (ultima: string) => ({ name: 'A Voz do Sussurro', lines: ['Você veio.', 'Todos vêm. Cada um pela sua porta.', 'Esta aqui não abre do seu lado.', ultima] });
export const ALA3 = 'A ala três do Labirinto termina numa porta de pedra preta, lisa, sem maçaneta, sem fechadura e sem dobradiça. Do outro lado, alguém sussurra.';
export const alaTres = (id: string, giver: string, text: string, lugar: string, dx: number, dy: number, objs: Objs, ultimaFrase: string, falaL: Fala, fimL: Fala, extra: Extra = {}) =>
  Q(id, 'A Ala Três', giver, giver, ALA3 + ' ' + text,
    [visit(lugar), ...objs, sense('espirito', 'A porta preta sem maçaneta', lugar, dx, dy, VOZ(ultimaFrase))],
    falaL, fimL, undefined, extra);

/* ---------- 10 · O DIA DOS PRANTOS (98): a batalha na Ponte de Velmora ---------- */
/** os sinais do dia, iguais para todos, na ordem em que acontecem */
export const PRANTOS = 'Cartas com a letra antiga chegaram aos dois lados na mesma manhã, chamando cada um para a Ponte de Velmora. Ninguém mandou. Todos foram.';
/** o céu do Dia dos Prantos (a canção cita) */
export const CEU = 'O céu estava cor de estanho, sem sol e sem chuva.';
/** a queda do Hallvard, sempre com os mesmos detalhes (a canção da expansão cita cada um) */
export const QUEDA_HALLVARD = 'No meio da ponte, entre as duas bandeiras, estava o Hallvard, filho do Halfdan, com o machado do pai. Não era de lado nenhum: estava no muro, como tinha prometido. Ele caiu de joelhos primeiro. O machado caiu do lado esquerdo, o da Margem da Noite, e ficou de pé, cravado na madeira. A última coisa que ele disse foi: “Digam ao meu pai que o telhado ficou pronto.”';
/** a queda do Cassius: a Lágrima fica à vista e ninguém comenta */
export const QUEDA_CASSIUS = 'Na cabeceira da Aurora, o Grão-Mestre Cassius caiu sentado, de costas para o pilar, como quem descansa. O elmo rolou. No pescoço dele, por fora da cota, um cordão com uma gota de vidro. Ninguém viu de onde veio o golpe.';
/** a queda do Vladislav */
export const QUEDA_VLADISLAV = 'Na cabeceira da Noite, o Conde Vladislav III caiu de pé: ficou um instante inteiro parado, ajeitou o punho da camisa, e só então desceu. Tantos milênios, e nem assim caiu com pressa. Ninguém viu de onde veio o golpe.';
/** a fuga: o homem de capa cinza visto por todos ao mesmo tempo, pela primeira vez; a lanterna do Táraka acende e apaga (a pista do Capítulo V) */
export const FUGA = 'Então um homem de capa cinza atravessou a ponte correndo, por entre as duas bandeiras. Pela primeira vez, todos viram ao mesmo tempo. Ninguém viu o rosto. Todos pararam, como quem tenta lembrar de onde conhece alguém. Ele desceu pela escada do pilar do meio. A lanterna do Táraka acendeu sozinha, e apagou.';
/** o que se vê quando ele cai, no fundo (a última masmorra) */
export const DESMANCHE = 'Lá embaixo, depois da porta de pedra preta, ele não caiu como gente cai. A capa ficou no chão, vazia. O que estava dentro dela se desfez em fios cinzentos, finos como cabelo, e os fios subiram pela escada, passaram por cima da ponte e entraram nas pessoas: num soldado, numa criança, num barqueiro, em você. Ninguém sentiu nada. Todo mundo olhou para o lado, como quem ouve o próprio nome.';
/** os sinos calam e o sino do olho fechado abre o olho */
export const SINAIS = 'Um pulso de caixa de música passou pela ponte, de uma cabeceira à outra, e os sinos de Velmora calaram todos de uma vez. Na torre, o sino do olho fechado abriu o olho.';
const CENA = 'O Dia dos Prantos';
/** o que o jogador viu, na ordem em que viu: a queda do próprio lado primeiro. Só ele viu as duas cabeceiras */
export const cenaPrantos = (lado: 'fio' | 'desfiados' | 'semLado') => {
  const c = m(CENA, QUEDA_CASSIUS + (lado === 'fio' ? '' : ' Do seu lado da ponte, ninguém mais viu.')), v = m(CENA, QUEDA_VLADISLAV + (lado === 'desfiados' ? '' : ' Do seu lado da ponte, ninguém mais viu.')), h = m(CENA, QUEDA_HALLVARD);
  const quedas = lado === 'fio' ? [c, h, v] : lado === 'desfiados' ? [v, h, c] : [h, c, v];
  return [m(CENA, CEU + ' ' + SINAIS), ...quedas, m(CENA, FUGA), m(CENA, DESMANCHE)]; };
const BQ_PRANTOS = [
  m(BQ, 'Eu não levei ninguém hoje. Hoje todo mundo veio a pé.'),
  m(BQ, 'O sino da torre abriu o olho. Eu vi. Tem um olho no bronze, e estava fechado desde que penduraram.'),
  m(BQ, 'A minha lanterna acendeu sem eu riscar. Trinta anos e ela nunca fez isso. Depois apagou. Não me pergunte. Eu só levo gente.')];
/** a batalha da ponte. Os bichos próprios do evento e a última masmorra entram pela etapa final (masmorras.ts); os objetivos ficam só aqui */
export const prantos = (id: string, giver: string, turnin: string, text: string, objs: Objs, falaL: Fala, fimL: Fala, escolha: Escolha, extra: Extra = {}) =>
  Q(id, 'O Dia dos Prantos', giver, turnin, PRANTOS + ' ' + text,
    [visit('Ponte de Velmora'), ...objs, sense('espirito', 'A porta de pedra preta, aberta', 'Ponte de Velmora', 0, 2, { name: 'O Que Ficou no Chão', lines: ['(Uma capa cinza, dobrada sozinha, no primeiro degrau.)', '(Dentro dela, nada.)'] }), talk(BQ)],
    falaL, fimL, escolha, { meet: { [BQ]: BQ_PRANTOS }, ...extra });
