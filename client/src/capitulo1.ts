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

const ALL = new Map<string, QuestDef>([...PALADIN, ...WANDERER, ...WARRIOR, ...WEREWOLF, ...VAMPIRE, ...TECHNO, ...WARLOCK_I, ...COSTURA_I].map((d) => [d.id, d]));
const LV = [20, 21, 22, 23, 24, 26, 27, 28, 29, 31];
type Ov = { giver?: string; turnin?: string; doneAdd?: string; rep?: [string, string][]; doneLast?: string };

function seq(ids: string[], ov: Record<string, Ov> = {}): QuestDef[] {
  const first = ALL.get(ids[0])!, out: QuestDef[] = [];
  ids.forEach((id, i) => {
    const src = ALL.get(id); if (!src) throw new Error('capítulo I: falta ' + id);
    const o = ov[id] ?? {}; let d: QuestDef = JSON.parse(JSON.stringify(src));
    if (o.rep) { let j = JSON.stringify(d); for (const [a, b] of o.rep) j = j.split(a).join(b); d = JSON.parse(j); }
    d.chain = first.chain; d.lvl = LV[i]; d.xp = 0;
    if (i === 0) d.req = first.req; else delete d.req;
    if (i < ids.length - 1) { d.next = ids[i + 1]; delete d.title; }
    if (o.giver) d.giver = o.giver; if (o.turnin) d.turnin = o.turnin;
    if (o.doneLast && d.done?.length) d.done = [...d.done.slice(0, -1), o.doneLast];
    if (o.doneAdd) d.done = [...(d.done ?? []), o.doneAdd];
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
  vn5: { giver: 'Lady Mirela', rep: [['O terceiro lugar que não existe', 'O segundo lugar que não existe'], ['Agora você conhece os três.', 'Agora você conhece os dois que a Casa mostra aos novos. O terceiro, a Adega Sem Porta, só quando o seu sangue for mais velho.']] },
  vn6: { rep: [['onde fica a Adega Sem Porta', 'onde fica o Mausoléu dos Que Dormem de Dia'], ['onde fica a adega', 'onde fica o mausoléu'], ['O caçador voltou à adega', 'O caçador voltou ao mausoléu'], ['A adega tinha porta naquela noite', 'O mausoléu tinha a porta aberta naquela noite'], ['de adega nenhuma', 'de mausoléu nenhum'], ['o caçador volta à adega', 'o caçador volta ao mausoléu'], ['(a Ilse apaga)', '(o Vasko tem um vinho para isso)'], ['A adega tinha porta', 'O mausoléu tinha porta']] },
});

/* TECNOCRATA — "O Preço do Progresso": a Academia, a Costa do Vapor e as vilas que a Irmandade ajuda e com quem negocia */
export const TECHNO_I = seq(['te1', 'te2', 'te3', 'tv1', 'tv2', 'tv3', 'tv4', 'tv5', 'te7', 'te10'], {
  te3: { doneAdd: 'O Doutor Anselm Rotha, da Irmandade do Vapor, está em Porto Caldeira medindo as vilas. Ele pediu um ajudante. Vá.' },
  tv5: { doneAdd: 'A Arquiteta Ylva quer você em Porto Caldeira: o primeiro navio a vapor afundou nos recifes.' },
});

/* BRUXO — "Cinco Cláusulas": a torre do Vale e os lugares que o mundo largou (igrejas, cemitérios, criptas), nunca as vilas */
export const WARLOCK_I1 = seq(['bx1', 'bx2', 'bw1', 'bx3', 'bw2', 'bx4', 'bw3', 'bw4', 'bx8', 'bx10'], {});

/** as ids que o Capítulo I novo substitui (as cadeias antigas e as costuras de 09/11, menos as que ficaram) */
const KEEP = new Set([...PALADIN_I, ...WARRIOR_I, ...WEREWOLF_I, ...VAMPIRE_I, ...TECHNO_I, ...WARLOCK_I1].map((d) => d.id));
export const CHAPTER_I = [...PALADIN_I, ...WARRIOR_I, ...WEREWOLF_I, ...VAMPIRE_I, ...TECHNO_I, ...WARLOCK_I1];
/** filtra uma lista antiga: tira as missões do Capítulo I antigo (pa*, aw*, w01–w10, la*, va*, te1–te10, bx*, e as costuras) */
export const notOldChapterI = (d: QuestDef) => !/^(pa\d+|aw\d+|w\d\d|la\d+|va\d+|te\d+|bx\d+|gb\d+|vg\d+|vn\d+|tv\d+|bw\d+)$/.test(d.id);
void KEEP;
