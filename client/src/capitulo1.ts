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
import { HUNTER_II, MAGE_II, HUMAN_II, DWARF_II, ELF_II } from './capitulo2b';
import { PALADIN_III_NEW, WARRIOR_III, WEREWOLF_III, VAMPIRE_III, TECHNO_III_NEW, WARLOCK_III, HUNTER_III, MAGE_III, HUMAN_III, DWARF_III, ELF_III, VELMORA_RECON } from './capitulo3';
import { HUNTER_I } from './cacador';
import { MAGE_I } from './mago';
import { HUMAN_I } from './humano';
import { DWARF_I } from './anao';
import { ELF_I } from './elfo';

const ALL = new Map<string, QuestDef>([...PALADIN, ...WANDERER, ...WARRIOR, ...WEREWOLF, ...VAMPIRE, ...TECHNO, ...WARLOCK_I, ...COSTURA_I, ...TECHNO_II, ...CAP2_NEW,
  ...HUNTER_II, ...MAGE_II, ...HUMAN_II, ...DWARF_II, ...ELF_II,
  ...PALADIN_III_NEW, ...WARRIOR_III, ...WEREWOLF_III, ...VAMPIRE_III, ...TECHNO_III_NEW, ...WARLOCK_III, ...HUNTER_III, ...MAGE_III, ...HUMAN_III, ...DWARF_III, ...ELF_III, ...VELMORA_RECON].map((d) => [d.id, d]));
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
    if (!d.gold) d.gold = Math.round(lv[i] * 14); /* as missões novas (qb.ts) nascem sem ouro */
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

/* Capítulo II do Caçador, do Mago e dos três puros (09/11, capitulo2b.ts): o Capítulo I deles vive nos próprios arquivos */
export const HUNTER_II2 = seq(HUNTER_II.map((d) => d.id), {
  cj2: { doneAdd: 'O Pip quer falar com alguém sobre a vila dele. A Vesna não consegue. Ela vai pedir a você.' },
  cj3: { doneAdd: 'A Mestra Ilsa chama. Os nossos querem queimar uma casa em Skógar.' },
  cj4: { doneAdd: 'A Vesna espera você em Sudrholt. Os carniçais farejaram as crianças.' },
  cj5: { doneAdd: 'A Mestra Ilsa quer ver você. É sobre um dos nossos. Ela não disse mais nada.' },
  cj7: { doneAdd: 'A Vesna voltou de Grenivik com uma cara que eu não conheço. Vá até ela.' },
  cj8: { doneAdd: 'A Mestra Ilsa quer você em Askavik. A Mesa do Fio vai se reunir.' },
}, LV2, 'Escoteiros', 'hc10');
export const MAGE_II2 = seq(MAGE_II.map((d) => d.id), {
  mj1: { doneAdd: 'A Ísold quer você na Sala Que Ninguém Lê. Um livro começou a morder.' },
  mj2: { doneAdd: 'O Vesk quer você na Mesa do Fio. Vá. Eu vou junto, para rir.' },
  mj3: { doneAdd: 'A Arquimaga Seline pediu alguém discreto. Eu disse que você ri baixo. Vá a ela.' },
  mj4: { doneAdd: 'A Ísold achou frases na pele dos carniçais de Grenivik. Ela está feliz demais com isso. Vá ver.' },
  mj5: { doneAdd: 'O Cronista Ormund chama você a Askavik. Achou uma escada numa nota de rodapé.' },
  mj6: { doneAdd: 'O Vesk tem uma carta para a Seline. Ele está com vergonha dela. Vá a ele.' },
  mj7: { doneAdd: 'A Ísold está preocupada. O Corin sumiu. Ela nunca fica preocupada.' },
  mj9: { doneAdd: 'O Vesk quer você. Tem uma pena nova esperando.' },
}, LV2, 'O Mago Ri', 'mg10');
export const HUMAN_II2 = seq(HUMAN_II.map((d) => d.id), {
  hk3: { doneAdd: 'Agora preciso de você em Corvoscuro. Não faça essa cara.' },
  hk4: { doneAdd: 'O Garrick quer ensinar a vigia da vila. Ele precisa de alguém que não corra.' },
  hk5: { doneAdd: 'O Velho Ansgar quer você. Coisa feia em Vestheim.' },
  hk7: { doneAdd: 'O Gunnar quer erguer uma rua para os que vieram de Grenivik. Vá até ele.' },
  hk8: { doneAdd: 'O Ansgar tem uma conversa para você ter com o Prefeito. Eu não queria estar no seu lugar.' },
}, LV2, 'A Bandeira do Comum', 'hm10');
export const DWARF_II2 = seq(DWARF_II.map((d) => d.id), {
  dk2: { doneAdd: 'O Rei Thrain mandou chamar. O bilhete dele sumiu. Isso nunca aconteceu.' },
  dk3: { doneAdd: 'O Kári precisa de alguém na forja amanhã. Dois fiscais. Duas bandeiras. Uma forja.' },
  dk4: { doneAdd: 'A Dagny está com o bigode em pé. Tem lâmina rachada com o nosso carimbo.' },
  dk5: { doneAdd: 'A Velha Sigrun quer você em Cinzalto. A lama está subindo.' },
  dk6: { doneAdd: 'A Dagny quer você em Askavik, ouvindo as Tecelagens. Como pessoa, não como montanha.' },
  dk7: { doneAdd: 'O Thane precisa de alguém na estrada: o Vasko vem comprar, e uns caçadores sem Bastião estão esperando por ele.' },
  dk8: { doneAdd: 'A Dagny e o Borin estão brigando de novo. Vá antes que quebrem a mesa.' },
}, LV2, 'O Lado da Montanha', 'fb10');
export const ELF_II2 = seq(ELF_II.map((d) => d.id), {
  ek1: { doneAdd: 'A Anciã Faelwen quer ensinar a você a Palavra da Mata.' },
  ek2: { doneAdd: 'A Lirien quer mandar você a Morthil. Não se assuste com a altivez de lá.' },
  ek3: { doneAdd: 'E a Vaelith pediu ajuda: Morthil quer crescer. Volte lá quando puder.' },
  ek4: { doneAdd: 'A Faelwen chama. Um jovem da Copa foi pedir a mordida.' },
  ek5: { doneAdd: 'A Lirien sentiu as raízes de Grenivik. Ela quer você lá.' },
  ek6: { doneAdd: 'A Cantora Aelith cantou uma linha nova. Ela está com medo. Vá a ela.' },
  ek7: { doneAdd: 'A Rainha quer um emissário para as duas mesas de Askavik.' },
  ek8: { doneAdd: 'A Senhora Vaelith mandou chamar. Ela tem um presente para a Lirien.' },
  ek9: { doneAdd: 'A Rainha espera você. Ela tem uma folha de prata trançada.' },
}, LV2, 'A Aliança', 'lf10');

/* ======================= CAPÍTULO III — "A GUERRA FRIA" (níveis 44–76), as onze classes (capitulo3.ts) =======================
   As que sobraram dos Capítulos I e II voltam aqui: pa6, pa8 e aw10 no Paladino; te5, te6 e tv6 no Tecnocrata (Erling: nunca perdemos missões). */
/* 09/11: o Capítulo III abre em Velmora (o reconhecimento, uma missão a mais para TODAS as classes: onze no III, iguais para todos) */
const LV3 = [44, 45, 47, 50, 53, 56, 60, 64, 68, 72, 76];
const ids = (a: QuestDef[], vel: string) => [vel, ...a.map((d) => d.id)];
export const PALADIN_III = seq(['vel_pa', 'pk1', 'pk2', 'pa6', 'pk3', 'pa8', 'pk4', 'aw10', 'pk6', 'pk5', 'pk7'], {
  vel_pa: { doneAdd: 'Agora, um pedido estranho: suba a Colina Vampírica ao meio-dia.' },
  pk1: { doneAdd: 'A Corte vai responder. Hoje à noite, aposto. Fique na Abadia.' },
  pk2: { doneAdd: 'E a vida segue: o órgão novo da Catedral sai de Austrvik amanhã, e os Desfiados sabem. Escolte.' },
  pa6: { rep: [['Os mortos que os Desfiados erguem rondam o caminho.', 'Os mortos que a podridão de Zerath levanta rondam o caminho, e os Desfiados não têm pressa nenhuma em afastá-los.']], doneAdd: 'Antes de ir: as velas que a Abadia comprou queimam azul no altar. As que mandaram para cá também. Fique: preciso de você para isso.' },
  pk3: { doneAdd: 'Volte ao Grão-Mestre. Brasaforja pediu ajuda: a montanha está soltando diabretes.' },
  pa8: { rep: [['"poi":"Coração da Montanha"', '"poi":"Brasaforja"']], doneAdd: 'E agora o pior: a Ordem prendeu um bruxo, e eu quero que ele seja ouvido pelos dele antes de ser julgado.' },
  pk4: { doneAdd: 'A capela de Lundr pediu socorro: os lobos aprenderam a hora da reza. Vá.' },
  aw10: { doneLast: 'O Paladino Aldric está aqui em Lundr procurando você. Está com a cara de quem quer arrancar alguma coisa de alguém.' },
  pk6: { doneAdd: 'Volte ao Grão-Mestre. O Fio quer o Clã do Corvo na Mesa, e o norte só fala por duelo.' },
  pk5: { doneAdd: 'A Mesa Partida vai se reunir em Askavik. Eu vou. Você vai comigo.' },
}, LV3, 'A Vigília Dobrada', 'aw11');
export const WARRIOR_III2 = seq(ids(WARRIOR_III, 'vel_gu'), {
  vel_gu: { doneAdd: 'Abri o círculo do rochedo. As duas bandeiras querem o Clã.' },
  gk3: { doneAdd: 'Um rapaz com o machado do meu irmão apareceu em Fjallbrún. Vá você. Eu não vou.' },
  gk4: { doneAdd: 'A Brynhild quer você em Jarlsheim. O skald anda cantando o que não aconteceu.' },
  gk5: { doneAdd: 'A estação acabou. O Clã tem que dizer a quem empresta a lâmina. Suba ao rochedo.' },
  gk7: { doneAdd: 'Leve a moeda ao Jarl. Eu espero aqui.' },
}, LV3, 'A Balança do Corvo', 'gc5');
export const WEREWOLF_III2 = seq(ids(WEREWOLF_III, 'vel_lo'), {
  vel_lo: { doneAdd: 'Eu não dormi. Tem prata na Selva.' },
  lk2: { doneAdd: 'O Varg quer falar com você. É sobre carne. Com o Varg, é sempre sobre carne.' },
  lk4: { doneAdd: 'A Mãe-Alfa precisa de você na Ninhada do Charco Fundo. Os jovens estão comendo errado.' },
  lk7: { doneAdd: 'O Varg tem uma ideia. Isso é perigoso. Vá ouvir antes que ele faça.' },
  lk8: { doneAdd: 'A Mãe-Alfa vai à Mesa Partida. Antes, as sete ninhadas uivam juntas. Venha.' },
}, LV3, 'O Faro', 'lj5');
export const VAMPIRE_III2 = seq(ids(VAMPIRE_III, 'vel_va'), {
  vel_va: { doneAdd: 'E um paladino entrou no castelo ao meio-dia. Nós vamos responder.' },
  vk1: { doneAdd: 'O Conde quer falar com você. É sobre um relógio. Ele está de muito mau humor, que nele parece educação.' },
  vk2: { doneAdd: 'O Vasko ouviu uma história de relógios. Ele está com medo, o que nele parece entusiasmo.' },
  vk3: { doneAdd: 'A senhora Mirela chama. Os caçadores querem cortar o nosso sangue em Brasaforja.' },
  vk5: { doneAdd: 'O Conde quer você. Uma cria fugiu para a Abadia. Para rezar.' },
  vk6: { doneAdd: 'O Vasko precisa de você no mausoléu. Alguém contou.' },
  vk7: { doneAdd: 'A senhora Mirela quer você em Hrafnhöfn. Três crias foram à estrada.' },
  vk8: { doneAdd: 'O Conde vai à Mesa Partida e quer levar uma cria de confiança. Ele está olhando para você.' },
}, LV3, 'A Noite da Abadia', 'vj4');
export const TECHNO_III = seq(['vel_te', 'tk1', 'te5', 'tk2', 'tk3', 'te6', 'tk4', 'tv6', 'tk5', 'tk6', 'tk7'], {
  vel_te: { doneAdd: 'A Arquiteta Ylva chama. A Brunna abriu uma caixa de música, e não gostou do que tocou.' },
  tk1: { doneAdd: 'E tem mais uma coisa, que não pode esperar: uma caravana nossa caiu no Passo de Midvangr.' },
  te5: { doneAdd: 'Agora as caixas de música. Temos que recolher todas, antes que alguém aperte o botão errado.' },
  tk2: { doneAdd: 'O Doutor Anselm quer você em Porto Caldeira. Achou alguma coisa nos arquivos e não quer dizer por carta.' },
  tk3: { doneAdd: 'A Ylva quer ver você. As duas bandeiras estão fazendo encomendas grandes demais ao mesmo tempo.' },
  te6: { doneAdd: 'A Brunna seguiu a última caixa de música até Hrafnhöfn. Vá com ela.' },
  tk4: { doneAdd: 'O Doutor Anselm mediu as vilas de novo depois das caixas. Ele está com cara de número ruim.' },
  tv6: { rep: [['Leve o índice das vilas à Arquiteta Ylva, na Academia. O Doutor quer que ela veja quanto caiu.', 'O Doutor Anselm mediu de novo as vilas da Costa do Vapor depois das caixas de música. Leve o índice à Arquiteta Ylva, na Academia: ele quer que ela veja quanto caiu.'],
    ['Quatro vilas. A água, o sino, a roda, a ponte. O índice caiu onze pontos. Nunca caiu tanto num mês.', 'As vilas da Costa, medidas de novo depois das caixas. O índice caiu onze pontos. Nunca caiu tanto num mês.'],
    ['A Ylva vai perguntar quanto custou. Diga a verdade: pouco. Ela vai ficar desconfiada. Bom.', 'A Ylva vai perguntar se a culpa é nossa. Diga a verdade: não sei. Ela vai ficar desconfiada. Bom.'],
    ['Onze pontos. Com sino, roda e ponte. O Anselm sempre foi sentimental com vila pequena.', 'Onze pontos. Desde as caixas. O Anselm sempre foi sentimental com vila pequena. Desta vez eu também estou.'],
    ['A Academia vai fingir que foi ideia dela. É assim que se ganha na Academia: deixando ganhar.', 'A Academia vai jurar de novo, em voz alta, que não vende arma escondida. Desta vez vai ter que ser verdade.'],
    ['Os carimbos das engrenagens têm uma runa.', 'A Brunna achou uma capa cinza desenhada no fundo das caixas.'],
    ['Têm. Sempre tiveram. O primeiro molde já veio com ela. Ninguém da Academia lembra de ter desenhado.', 'Eu vi. Não é nossa. A Academia não assina com roupa. Quem assina com roupa quer ser lembrado pela roupa, e não pelo rosto.']] },
  tk5: { doneAdd: 'O Anselm está montando uma sentinela para a Mesa Partida. Ajude ele, antes que ele ponha um índice nela.' },
  tk6: { doneAdd: 'A Ylva vai à Mesa e quer você ao lado da sentinela.' },
}, LV3, 'A Caixa Que Era Arma', 'ti7');
export const WARLOCK_III2 = seq(ids(WARLOCK_III, 'vel_bx'), {
  vel_bx: { doneAdd: 'A Torre vai queimar os nossos pactos. Eu tenho um plano com três sílabas.' },
  bk2: { doneAdd: 'O Malgrath chama. Isso não acontece. Vá.' },
  bk3: { doneAdd: 'A Ravena quer você. A Corte veio pagar uma dívida, e ela quer cobrar de quem escreveu.' },
  bk4: { doneAdd: 'A Bruxa Grisolda tem uma entrega para a Torre. Ela precisa de escolta e não vai pedir duas vezes.' },
  bk5: { doneAdd: 'A Ravena tem uma coisa feia para desfazer na Igreja Abandonada.' },
  bk8: { doneAdd: 'O Malgrath vai à Mesa Partida. Duzentos anos. Ele quer você junto.' },
  bk9: { doneAdd: 'A Ravena espera você em Askavik. Leve o acordo.' },
}, LV3, 'A Última Sílaba', 'bj5');
export const HUNTER_III2 = seq(ids(HUNTER_III, 'vel_ca'), {
  vel_ca: { doneAdd: 'Agora vou armar a Selva com gaiolas. Prender, não matar.' },
  ck1: { doneAdd: 'Alguém soltou os filhotes de noite. A Vesna quer saber por que ninguém atirou.' },
  ck2: { doneAdd: 'A Mestra Ilsa quer atrasar a remessa de sangue de Brasaforja. Uma noite. Vá com ela.' },
  ck3: { doneAdd: 'A Vesna quer conhecer a Sangradora. Vá junto. Segure a Vesna.' },
  ck4: { doneAdd: 'A Mestra Ilsa quer você em Grenivik. O ninho de lá não morre.' },
  ck6: { doneAdd: 'A Vesna precisa de pó do sono para o Pip. Ela não aguenta a Grisolda. Você aguenta.' },
  ck7: { doneAdd: 'A Mestra Ilsa achou uma gaiola que não é nossa, com um filhote dentro.' },
}, LV3, 'O Capitão do Ninho', 'cj10');
export const MAGE_III2 = seq(ids(MAGE_III, 'vel_ma'), {
  vel_ma: { doneAdd: 'Agora quero queimar as cópias dos pactos que circulam na Torre.' },
  mk1: { doneAdd: 'A Ísold quer comparar a letra dos grimórios. Ela parou de rir. Vá.' },
  mk2: { doneAdd: 'A Arquimaga Seline quer que você ouça o Corin. A Torre quer expulsá-lo.' },
  mk3: { doneAdd: 'O Vesk quer você. Um Cobrador anda levando aprendizes.' },
  mk5: { doneAdd: 'A Ísold e a Ravena compararam a letra. A Ísold quer você.' },
  mk6: { doneAdd: 'A Seline precisa de alguém para uma entrega no Vale. É sobre chá. Não ria.' },
  mk7: { doneAdd: 'O Vesk está olhando o Farol de Lumenhal pela janela há uma hora. Vá ver o que ele vê.' },
}, LV3, 'A Ata', 'mj10');
export const HUMAN_III2 = seq(ids(HUMAN_III, 'vel_hu'), {
  vel_hu: { doneAdd: 'Achei uma terra sem dono. E vou pedir a você uma coisa grande.' },
  hx1: { doneAdd: 'O Gunnar já está a caminho com corda e madeira. Vá ajudar.' },
  hx2: { doneAdd: 'O Velho Ansgar quer falar com você sobre quem manda na vila. Não é você.' },
  hx4: { doneAdd: 'O Garrick quer contratar guarda para a vila nova. Vá com ele à estrada.' },
  hx5: { doneAdd: 'O Velho Ansgar recebeu um convite de Corvoscuro com o seu nome. Ele está pálido.' },
  hx7: { doneAdd: 'O Ansgar quer fazer uma guilda. Uma guilda do Comum. Vá a Karmika.' },
}, LV3, 'A Vila Que Você Fez', 'hk10');
export const DWARF_III2 = seq(ids(DWARF_III, 'vel_an'), {
  vel_an: { doneAdd: 'Vou abrir o Mercado das Duas Bandeiras. Preciso de quem segure o balcão.' },
  ax1: { doneAdd: 'Dois espiões querem saber o que o outro comprou. Os dois educados. Venha.' },
  ax2: { doneAdd: 'A Sangradora Ásta quer você do lado dos doadores. Ouça eles.' },
  ax3: { doneAdd: 'A Dagny quer ir ao Bastião “conversar”. Com o martelo. Vá antes dela.' },
  ax4: { doneAdd: 'O Kári achou um molde que ele não lembra de ter feito. Ele está pálido. Anão pálido é coisa rara.' },
  ax6: { doneAdd: 'A Velha Sigrun chama de Cinzalto. A lama subiu de novo.' },
  ax7: { doneAdd: 'O Thane quer fazer uma mesa nova para a Mesa Partida. De ferro.' },
  ax8: { doneAdd: 'A Dagny vai levar a mesa a Askavik. Vá com ela. Leve uma lança: harpia gosta de ferro brilhante.' },
}, LV3, 'Ferro Para os Dois', 'dk10');
export const ELF_III2 = seq(ids(ELF_III, 'vel_el'), {
  vel_el: { doneAdd: 'E agora quero fazer de você o embaixador da Copa.' },
  ex1: { doneAdd: 'A Lirien quer você. Uma carta nossa voltou com uma cláusula que não escrevemos.' },
  ex2: { doneAdd: 'A Senhora Vaelith soube da cláusula. Ela quer ir ao Bastião. Vá com ela.' },
  ex3: { doneAdd: 'A Lirien interceptou outra carta dobrada. Vá a ela.' },
  ex4: { doneAdd: 'A Anciã Faelwen chama. A água de Lithendel adoeceu.' },
  ex5: { doneAdd: 'A Rainha quer ouvir você. O jovem que foi a Corvoscuro voltou.' },
  ex6: { doneAdd: 'A Senhora Vaelith quer uma ponte de raiz para Morthil. Ela pediu você.' },
  ex7: { doneAdd: 'A Cantora Aelith quer cantar na Mesa Partida. Vá com ela à Rainha.' },
  ex8: { doneAdd: 'A Rainha vai mandar você mediar a Mesa Partida.' },
}, LV3, 'A Embaixada', 'ek10');

/* cada fim de capítulo aponta para o começo do seguinte (e diz quem chama) */
const link = (a: QuestDef[], b: QuestDef[], line?: string) => { const last = a[a.length - 1]; last.next = b[0].id; if (line && last.done) last.done = [...last.done, line]; };
for (const [a, b] of [[PALADIN_I, PALADIN_II], [WARRIOR_I, WARRIOR_II], [WEREWOLF_I, WEREWOLF_II], [VAMPIRE_I, VAMPIRE_II], [WARLOCK_I1, WARLOCK_II]] as const) link(a, b);
link(HUNTER_I, HUNTER_II2); link(MAGE_I, MAGE_II2); link(HUMAN_I, HUMAN_II2);
link(DWARF_I, DWARF_II2, 'A Dagny quer você no Conselho dos Bigodes. Brasaforja vai escolher bandeira. Ou não.');
link(ELF_I, ELF_II2, 'A Lirien espera você. A Copa não pede bandeira a ninguém, e é por isso que você vai ter que escolher a sua.');
link(PALADIN_II, PALADIN_III, 'O Grão-Mestre quer saber de uma vila que não está nos mapas da Abadia. Os peregrinos voltam de lá calados.');
link(WARRIOR_II, WARRIOR_III2, 'A Brynhild chama. Os corvos de Odin estão voando em círculo sobre uma vila do sul.');
link(WEREWOLF_II, WEREWOLF_III2, 'O Varg voltou do rio assustado. Diz que achou uma água que não tem cheiro.');
link(VAMPIRE_II, VAMPIRE_III2, 'A senhora Mirela quer saber de uma vila que deixa as janelas abertas para nós.');
link(TECHNO_II2, TECHNO_III, 'O índice cai quando o vento vem do leste. Do leste só tem uma vila que não está no mapa.');
link(WARLOCK_II, WARLOCK_III2, 'A Ravena achou uma linha paga no livro mais velho do Malgrath. Sem devedor. Ela odeia isso.');
link(HUNTER_II2, HUNTER_III2, 'A Mestra Ilsa ouviu de uma vila onde as crianças dormem a noite inteira, a uma noite do Conde.');
link(MAGE_II2, MAGE_III2, 'O Vesk leu uma nota do Ormund sobre uma ponte que não está em mapa nenhum. Ele está irritado. Vá.');
link(HUMAN_II2, HUMAN_III2, 'O Ansgar ouviu dos tropeiros de uma vila sem senhor e sem imposto. Ele quer aprender com ela.');
link(DWARF_II2, DWARF_III2, 'A Dagny achou no livro de Brasaforja uma encomenda de grampos para uma ponte que nenhum anão conhece.');
link(ELF_II2, ELF_III2, 'A Cantora Aelith cantou uma linha sobre uma ponte. A Rainha quer saber que ponte é essa.');
export const CHAPTER_I = [...PALADIN_I, ...WARRIOR_I, ...WEREWOLF_I, ...VAMPIRE_I, ...TECHNO_I, ...WARLOCK_I1, ...PALADIN_II, ...WARRIOR_II, ...WEREWOLF_II, ...VAMPIRE_II, ...TECHNO_II2, ...WARLOCK_II,
  ...HUNTER_II2, ...MAGE_II2, ...HUMAN_II2, ...DWARF_II2, ...ELF_II2,
  ...PALADIN_III, ...WARRIOR_III2, ...WEREWOLF_III2, ...VAMPIRE_III2, ...TECHNO_III, ...WARLOCK_III2, ...HUNTER_III2, ...MAGE_III2, ...HUMAN_III2, ...DWARF_III2, ...ELF_III2];
/** tira das listas antigas as missões que agora vêm montadas aqui (Capítulos I, II e III; pa6, pa8, aw10, te5, te6 e tv6 entraram no III) */
export const notOldChapterI = (d: QuestDef) => !/^(pa\d+|aw\d+|w\d\d|la\d+|va\d+|te\d+|ti\d+|bx\d+|gb\d+|vg\d+|vn\d+|tv\d+|bw\d+)$/.test(d.id);
