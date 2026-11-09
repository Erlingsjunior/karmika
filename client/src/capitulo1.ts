/* ---------- O CAPÍTULO I EM UMA SÓ LINHA (09/11, Erling: "as raças antigas precisam se adequar à lore nova e NÃO ramificar, senão ficam
   com mais história que as outras; pegue as melhores missões e gere uma sequência nova").
   Cada classe tem agora UMA cadeia de DEZ missões no Capítulo I (níveis 20, 21, 22, 23, 24, 26, 27, 28, 29, 31), como o Caçador, o Mago e os
   puros. As missões escolhidas vêm da saga antiga e da costura de 09/11; aqui só se refaz a ordem, o nível, quem dá a próxima e a frase que
   aponta para ela. As que ficaram de fora não entram no jogo (a regra 20 foi liberada pelo Erling nesta ordem).
   A Adega Sem Porta (vn1, vn2) fica na Colina Vampírica, região de nível 42–53: saiu do Capítulo I e espera o Capítulo III (Erling, 09/11). ---------- */
import type { QuestDef } from './quests';
import { PALADIN, VAMPIRE, TECHNO, WEREWOLF } from './sagas';
import { WARRIOR } from './quests';
import { WARLOCK_I } from './bruxo';
import { WANDERER } from './andarilho';
import { COSTURA_I } from './costura1';
import { TECHNO_II } from './indice';
import { CAP2_NEW } from './capitulo2-novas';
import { FALAS_GUERREIRO } from './guerreiro-falas';

const ALL = new Map<string, QuestDef>([...PALADIN, ...WANDERER, ...WARRIOR, ...WEREWOLF, ...VAMPIRE, ...TECHNO, ...WARLOCK_I, ...COSTURA_I, ...TECHNO_II, ...CAP2_NEW].map((d) => [d.id, d]));
const LV = [20, 21, 22, 23, 24, 26, 27, 28, 29, 31];
type Ov = { giver?: string; turnin?: string; doneAdd?: string; rep?: [string, string][]; doneLast?: string; title?: string };

function seq(ids: string[], ov: Record<string, Ov> = {}, lv: number[] = LV, chain?: string, req?: string): QuestDef[] {
  const first = ALL.get(ids[0])!, out: QuestDef[] = [];
  ids.forEach((id, i) => {
    const src = ALL.get(id); if (!src) throw new Error('capítulo I: falta ' + id);
    const o = ov[id] ?? {}; let d: QuestDef = JSON.parse(JSON.stringify(src));
    if (FALAS_GUERREIRO[id]) Object.assign(d, JSON.parse(JSON.stringify(FALAS_GUERREIRO[id])));
    if (o.rep) { let j = JSON.stringify(d); for (const [a, b] of o.rep) j = j.split(a).join(b); d = JSON.parse(j); }
    d.chain = chain ?? first.chain; d.lvl = lv[i]; d.xp = 0;
    if (i === 0) { const r = req ?? first.req; if (r) d.req = r; } else delete d.req;
    if (i === ids.length - 1) delete d.next;
    if (i < ids.length - 1) { d.next = ids[i + 1]; delete d.title; }
    if (o.giver) d.giver = o.giver; if (o.turnin) d.turnin = o.turnin;
    if (o.doneLast && d.done?.length) d.done = [...d.done.slice(0, -1), o.doneLast];
    if (o.doneAdd) d.done = [...(d.done ?? []), o.doneAdd];
    if (o.title) d.title = o.title;
    out.push(d);
  });
  /* a missão da capela (andarilho) é dada por quem recebeu a anterior; e a última fala dela aponta para quem vem depois */
  out.forEach((d, i) => { if (!/^aw\d/.test(d.id)) return; const prev = out[i - 1], nx = out[i + 1];
    if (prev && !ov[d.id]?.giver) d.giver = prev.turnin ?? prev.giver;
    if (nx && d.done && d.done.length >= 2 && !ov[d.id]?.doneLast) d.done[1] = (/^aw\d/.test(nx.id) ? `A próxima capela é a de ${nx.name.replace('A Capela de ', '')}. ${nx.turnin} espera há tempo demais.` : `Volte à Abadia da Aurora. O Grão-Mestre Cassius tem trabalho para um andarilho.`); });
  return out;
}

/* PALADINO — "A Luz que Guarda": a Abadia é a mãe; o paladino anda de capela em capela e volta a ela */
export const PALADIN_I = seq(['pa1', 'aw1', 'aw4', 'pa5', 'pa3', 'aw8', 'aw9', 'pa9', 'aw7', 'pa10'], {
  aw9: { doneAdd: 'Ah, e olhe o sino da capela por dentro, onde o badalo bate: tem uma runa riscada no bronze. Ninguém da Ordem lembra de ter mandado riscar. Não sei o que é. Ninguém sabe.' },
});

/* GUERREIRO — "O Guerreiro do Norte": o Clã do Corvo, o desertor Halfdan e a irmã dele, a Brynhild */
export const WARRIOR_I = seq(['w01', 'w02', 'w03', 'gb1', 'gb2', 'gb3', 'gb4', 'w08', 'gb5', 'w10'], {
  w03: { doneAdd: 'Uma guerreira perguntou por você na Fortaleza enquanto você estava fora. A irmã dele. Brynhild. Vá falar com ela.' },
  gb4: { doneAdd: 'O Thorgrim mandou chamar. Hrimgard desafiou o Clã, e ele quer você no círculo.' },
  w08: { doneAdd: 'A Brynhild espera você no salão. Ela vai devolver o escudo da mãe ao Jarl.' },
  gb5: { doneLast: 'O norte lembra quem fala pelos outros. Agora volte ao Thorgrim. Ele não está bem, e não vai dizer isso a ninguém além de você.' },
});

/* LOBISOMEM — "A Lua que Chama": a Mãe-Alfa, o Varg e as ninhadas fiéis */
export const WEREWOLF_I = seq(['la1', 'la2', 'vg1', 'vg2', 'la3', 'vg3', 'la5', 'vg4', 'vg5', 'la10'], {
  vg2: { doneAdd: 'Volte à Mãe-Alfa: ela tem um recado para os caçadores de Sudrholt.' },
  vg3: { giver: 'Ulfrun, a Mãe-Alfa', doneAdd: 'A Mãe-Alfa precisa de você no Covil. Os selvagens fizeram coisa feia em Dalborg.' },
  vg4: { giver: 'Ulfrun, a Mãe-Alfa' },
  la10: { rep: [['Corra com as duas matilhas juntas.', 'Corra com a matilha e com as ninhadas que conhecem o seu cheiro.'], ['Hoje Selvar e o Uivo Antigo correm juntos pela primeira vez em duzentos anos.', 'Hoje o Uivo Antigo e as sete ninhadas correm juntos, e todas sabem o seu cheiro.'], ['E as duas matilhas uivam juntas', 'E a matilha e as ninhadas uivam juntas']] },
});

/* VAMPIRO — "A Sede Educada": tudo na casa do Conde; os lugares que não existem; a visita às vilas; quem conta trai */
export const VAMPIRE_I = seq(['va1', 'va2', 'vn3', 'vn4', 'va5', 'vn5', 'va7', 'va9', 'vn6', 'va10'], {
  va2: { doneAdd: 'A Casa não tem vilas, {nome}. Visita as dos outros. Amanhã você aprende como.' },
  vn4: { rep: [['O segundo lugar que não existe', 'O primeiro lugar que não existe']], doneAdd: 'A senhora Mirela chama. Os filhos perdidos da Casa andam soltos, e isso é assunto de família.' },
  vn5: { giver: 'Lady Mirela', rep: [[' A senhora Mirela quer falar sobre o que acontece com quem conta.', ''], ['O terceiro lugar que não existe', 'O segundo lugar que não existe'], ['Agora você conhece os três.', 'Agora você conhece os dois que a Casa mostra aos novos. O terceiro, a Adega Sem Porta, só quando o seu sangue for mais velho.']] },
  vn6: { rep: [['Leve o título. Pese o nome.', 'O Conde vai querer ver você no alto da colina. Prepare-se.'], ['onde fica a Adega Sem Porta', 'onde fica o Mausoléu dos Que Dormem de Dia'], ['onde fica a adega', 'onde fica o mausoléu'], ['O caçador voltou à adega', 'O caçador voltou ao mausoléu'], ['A adega tinha porta naquela noite', 'O mausoléu tinha a porta aberta naquela noite'], ['de adega nenhuma', 'de mausoléu nenhum'], ['o caçador volta à adega', 'o caçador volta ao mausoléu'], ['(a Ilse apaga)', '(o Vasko tem um vinho para isso)'], ['A adega tinha porta', 'O mausoléu tinha porta']] },
});

/* TECNOCRATA — "O Preço do Progresso": a Academia, a Costa do Vapor e as vilas que a Irmandade ajuda e com quem negocia */
export const TECHNO_I_RAW = seq(['te1', 'te2', 'te3', 'tv1', 'tv2', 'tv3', 'tv4', 'tv5', 'te7', 'te10'], {
  tv1: { rep: [['Isto é um índice. Marca quanto falta.', 'Doutor Anselm Rotha, da Irmandade do Vapor. A Ylva me emprestou você, e eu devolvo com relatório. Isto é um índice. Marca quanto falta.']] },
  te3: { doneAdd: 'O Doutor Anselm Rotha, da Irmandade do Vapor, está em Porto Caldeira medindo as vilas. Ele pediu um ajudante. Vá.' },
  tv5: { doneAdd: 'A Arquiteta Ylva quer você em Porto Caldeira: o primeiro navio a vapor afundou nos recifes.' },
});

export const TECHNO_I = TECHNO_I_RAW.map((d) => (d.id === 'te10' ? { ...d, next: 'ti1' } : d));

/* BRUXO — "Cinco Cláusulas": a torre do Vale e os lugares que o mundo largou (igrejas, cemitérios, criptas), nunca as vilas */
export const WARLOCK_I1 = seq(['bx1', 'bx2', 'bw1', 'bx3', 'bw2', 'bx4', 'bw3', 'bw4', 'bx8', 'bx10'], {
  bx10: { rep: [['vendeu sono a quem caça você', 'cobrou de igrejas que ninguém visita'], ['E o Cobrador?', 'E a página do bispo?'], ['Sumiu. Os contratos que ele levou também. Um dia eles vão voltar reescritos. Quando voltarem, quero ter um bruxo que lê. Por isso o juramento.', 'A Ravena ainda não me mostrou. Diz que mostra “quando o altar estiver limpo”. Eu espero. Quero ter um bruxo que lê antes de descobrir quem escreveu primeiro. Por isso o juramento.'], ['Um dia a gente compara com a letra do Cobrador.', 'Um dia a gente compara com a letra dos Pactos Rompidos.']] },
});

/* ======================= CAPÍTULO II — "O JURAMENTO" (níveis 32–42) =======================
   Erling (09/11): "nunca perdemos missões; as que não entraram no Capítulo I são reaproveitadas e remodeladas para o II e o III". Cada classe:
   jurar a bandeira em voz alta (os Neutros arbitram), a primeira missão contra o outro lado, "onde o meu lado erra", a podridão de Zerath. */
const LV2 = [32, 33, 34, 35, 36, 37, 38, 39, 40, 42];
const CS = 'Grão-Mestre Cassius';
export const PALADIN_II = seq(['pj1', 'aw2', 'pa2', 'aw3', 'pa4', 'aw5', 'pa7', 'pj2', 'aw6', 'aw11'], {
  aw2: { giver: CS }, aw5: { giver: CS },
  aw6: { doneLast: 'Agora volte à Abadia. O Grão-Mestre quer ouvir da sua boca o que você viu nas capelas.' },
  aw11: { rep: [['O sino toca uma nota a mais em todas as capelas.', 'Vi uma runa riscada por dentro do sino de Steinfoss.'], ['Eu sei. Toca aqui também. Por dentro', 'Eu sei. Tem aqui também. Por dentro'], ['o que viu nas dez capelas', 'o que viu nas capelas'], ['Dez capelas. Você vai voltar diferente', 'Todas essas capelas. Você vai voltar diferente'], ['Dez vilas. Dez clérigos que já não esperam sozinhos.', 'Tantas vilas. Tantos clérigos que já não esperam sozinhos.']] },
  pa7: { doneAdd: 'O Paladino Aldric procura você. Aconteceu uma coisa feia em Grenivik, e foi um dos nossos.' },
}, LV2, 'O Juramento da Aurora', 'pa10');
export const WARRIOR_II = seq(['gc1', 'w04', 'w06', 'gc2', 'w05', 'w07', 'gc3', 'w09', 'gc4', 'gc5'], {
  gc2: { giver: 'Brynhild Lâmina-Quieta', rep: [['O Thorgrim resmungou e aprovou.', 'A Brynhild resmungou e aprovou.']] },
  w06: { doneAdd: 'A Corvina, dos Desfiados, também mandou chamar o Clã. Agora ouça o outro lado.' },
  w07: { doneAdd: 'Uma briga na praça de Askavik pediu um corvo para arbitrar. Vamos.' },
  gc3: { doneAdd: 'Fjallbrún pediu socorro: a tempestade desceu sobre a vila.' },
  w09: { doneAdd: 'Quando o vento parar, vou levar você ao rochedo dos corvos.' },
}, LV2, 'Os Dois Corvos', 'w10');
export const WEREWOLF_II = seq(['lj1', 'la4', 'la7', 'la6', 'la8', 'la9', 'lj2', 'lj3', 'lj4', 'lj5'], {
  lj1: { doneAdd: 'Volte à Mãe-Alfa. E, por favor, conte você a história. Se o Varg contar, a Corvina vira um dragão.' },
  la7: { doneAdd: 'A Mãe-Alfa chama. Um caçador caiu numa ravina, e a matilha sentiu o cheiro.' },
  lj2: { doneAdd: 'Volte à Mãe-Alfa. Uma lua de trégua com a Casa, e um dos nossos já fez besteira em Lundr.' },
  lj3: { doneAdd: 'O Varg sentiu um cheiro estranho em Grenivik. Ele quer que você fareje junto.' },
}, LV2, 'A Ninhada Jura', 'la10');
export const VAMPIRE_II = seq(['vj1', 'vn1', 'vn2', 'va3', 'va4', 'va6', 'va8', 'vj2', 'vj3', 'vj4'], {
  vj1: { doneAdd: 'O Vasko quer mostrar a você o terceiro lugar que não existe. O seu sangue já é velho o bastante.' },
  vn1: { rep: [['o primeiro lugar que não existe', 'o terceiro lugar que não existe'], ['Agora você conhece um lugar que não existe. Os outros dois a Corte mostra quando quiser.', 'Agora você conhece os três lugares que não existem.']] },
  vj4: { title: 'Barra Rasgada' },
}, LV2, 'A Barra Rasgada', 'va10');
export const TECHNO_II2 = seq(['ti1', 'ti2', 'te4', 'ti3', 'ti4', 'te8', 'ti5', 'te9', 'ti6', 'ti7'], {
  ti2: { doneAdd: 'A Arquiteta Ylva tem uma encomenda delicada da Corte. Passe na Academia.' },
  ti1: { rep: [['Você é a Mestra de Rota da Ylva. Ótimo. Eu sou Rotha. Doutor Rotha, se a Ylva estiver ouvindo; Anselm, se não estiver.', 'Mestre de Rota, agora. Ótimo. Para você continua sendo Anselm; Doutor Rotha só se a Ylva estiver ouvindo.'], ['Isto aqui é um índice. Latão, três ponteiros, nenhum número. Ele marca quanto falta. Não pergunte para quê: eu estou medindo há onze anos e ainda não sei. É por isso que continuo medindo.', 'O índice você já conhece. Latão, três ponteiros, nenhum número. Onze anos medindo, e ainda não sei para quê. É por isso que continuo.']] },
  ti3: { rep: [['O Rotha mandou você. Ele mandou com a cara de quem aprovou um relatório. É a única cara que ele tem, então não significa nada.', 'O Rotha aprovou o relatório do drone. Ele aprova com a mesma cara com que reprova, então não significa nada.']] },
  te8: { rep: [['Você decidiu o que a Academia faz com os lados. Agora é outra pergunta', 'Você levou a caixa vermelha da Brunna e decidiu o que fazer com ela. Agora é outra pergunta']], doneAdd: 'O Doutor Anselm quer testar uma sentinela nova. Volte a ele.' },
  ti4: { doneAdd: 'A Arquiteta Ylva quer fechar o autômato da Catedral. Passe na Academia.' },
  ti5: { doneAdd: 'A Arquiteta Ylva chama: alguém está explodindo caravanas na Grande Rota.' },
  te9: { doneAdd: 'O Doutor Anselm quer medir uma porta. Ele não disse qual.' },
}, LV2, undefined, 'te10');
export const WARLOCK_II = seq(['bj1', 'bx9', 'bj2', 'bx5', 'bx6', 'bx7', 'bj3', 'bj4', 'bw5', 'bj5'], {
  bx6: { doneAdd: 'O Malgrath quer falar com você sobre isso.' },
  bj1: { doneAdd: 'A Ravena quer que você conheça de perto os dois clientes mais difíceis dos Desfiados.' },
  bj2: { doneAdd: 'A Bruxa Grisolda tem uma encomenda para o Pináculo. Ela não gosta de ir lá.' },
  bx5: { doneAdd: 'A Ravena precisa de um entregador para o Bastião de Prata. Sim, para os caçadores.' },
  bx7: { doneAdd: 'A Ravena tem uma coisa feia para resolver em Lundr. É de um dos nossos.' },
  bj3: { doneAdd: 'A Ravena quer ler a letra dos pactos que os carniçais de Grenivik carregam.' },
  bw5: { rep: [['Leve o título: é o único que não tem juros.', 'Agora a Ravena tem uma cobrança grande a fazer. Vá com ela.']] },
}, LV2, 'O Contrato da Trégua', 'bx10');

/* o fim do Capítulo I aponta para o começo do II */
for (const [a, b] of [[PALADIN_I, PALADIN_II], [WARRIOR_I, WARRIOR_II], [WEREWOLF_I, WEREWOLF_II], [VAMPIRE_I, VAMPIRE_II], [WARLOCK_I1, WARLOCK_II]] as const) a[a.length - 1].next = b[0].id;
export const CHAPTER_I = [...PALADIN_I, ...WARRIOR_I, ...WEREWOLF_I, ...VAMPIRE_I, ...TECHNO_I, ...WARLOCK_I1, ...PALADIN_II, ...WARRIOR_II, ...WEREWOLF_II, ...VAMPIRE_II, ...TECHNO_II2, ...WARLOCK_II];
/** tira das listas antigas as missões que agora vêm montadas aqui (Capítulos I e II); as que sobram (pa6, pa8, aw10, te5, te6, tv6) esperam o Capítulo III */
export const notOldChapterI = (d: QuestDef) => !/^(pa\d+|aw\d+|w\d\d|la\d+|va\d+|te\d+|ti\d+|bx\d+|gb\d+|vg\d+|vn\d+|tv\d+|bw\d+)$/.test(d.id);
