/* ---------- O ANDARILHO DE AURÉON — a estrada do Paladino (níveis 21–32), 09/11.
   Erling: "o paladino tem a Abadia como líder-mãe, mas todas as vilas têm igrejas e pessoas que precisam de ajuda; o paladino é antes de tudo
   um andarilho do bem que segue o seu rumo pelo mundo livrando-o do mal; paladinos se movimentam bastante".
   Corre ao lado de "A Luz que Guarda" (depois do voto, pa1). O Grão-Mestre Cassius manda o paladino sair da Abadia e andar: dez capelas de
   Auréon nas vilas humanas (capelas.ts), cada uma com um clérigo e um mal. Em cada uma: chegar, livrar a vila, ouvir o clérigo e escolher.
   Cada clérigo manda para a próxima capela. No fim, volta-se à Abadia. Tom (regra de ouro 5): clérigos cansados e gentis, humor seco de
   quem vive com pouco; Cassius velho, quente e grave. Pista do capítulo (sem resposta): os sinos das capelas tocam uma nota a mais que ninguém
   afinou. Toda podridão é culpa de Zerath. ---------- */
import type { QuestDef } from './quests';
import { CHAPELS } from './capelas';

const CS = 'Grão-Mestre Cassius', CH = 'O Andarilho de Auréon';
type Opt = { label: string; karma: number; flag: string; say: string; why: string };
/* na ordem da estrada (um laço que sai da Abadia pelo oeste e volta pelo leste) */
const ROUTE: [vila: string, n: number, done: string, q: string, opts: Opt[]][] = [
  ['Grenivik', 6, 'Os pais da vila voltaram para as covas. A Felícia benzeu cada uma de novo, devagar, dizendo o nome de todos. Demorou a tarde inteira.', 'Um carniçal ainda se arrasta, sem pernas, até a porta da capela. A vila olha para você.', [
    { label: 'Termina com ele depressa, sem plateia, e enterra junto dos outros.', karma: 2, flag: 'and_gren_cova', say: 'A Felícia pôs uma vela na cova nova. “Ele também foi filho de alguém.”', why: 'Misericórdia até com o que já não é gente.' },
    { label: 'Arrasta-o até a praça para que todos vejam que acabou.', karma: -1, flag: 'and_gren_praca', say: 'As crianças dormiram naquela noite. Os adultos, não: sonharam com a praça.', why: 'Você deu paz com espetáculo. O medo virou outra coisa.' },
    { label: 'Pede à Felícia que reze antes, e só então desce a espada.', karma: 3, flag: 'and_gren_reza', say: 'A Felícia rezou com a voz falhando. O carniçal parou de se arrastar no meio da reza. Ninguém sabe dizer por quê.', why: 'O paladino é a mão; a fé é a vila inteira.' } ]],
  ['Vestheim', 5, 'O cemitério está quieto. Os javalis fugiram para o pântano, e as covas foram fechadas com pedra. As mães voltaram a trazer as crianças.', 'Um porqueiro admite que deixou a cerca aberta de propósito: os javalis comiam as sobras e ele economizava ração.', [
    { label: 'Manda que ele mesmo reconstrua a cerca, de pedra, sozinho.', karma: 2, flag: 'and_vest_cerca', say: 'Ele levou nove dias. No décimo, pediu para ser coveiro auxiliar.', why: 'Justiça que conserta em vez de castigar.' },
    { label: 'Denuncia-o à vila inteira na porta da capela.', karma: 0, flag: 'and_vest_denuncia', say: 'A vila não o perdoou. Ele foi embora para Myrbakki. A Brígida ainda reza por ele.', why: 'Verdade dita. Mas a vila perdeu um homem.' },
    { label: 'Paga do próprio bolso a ração dele por um mês.', karma: 3, flag: 'and_vest_racao', say: 'O porqueiro chorou com vergonha. Nunca mais abriu a cerca.', why: 'Você tirou a razão do erro, não só o erro.' } ]],
  ['Vatnaholt', 6, 'Os salteadores do “dízimo” estão no chão ou na estrada, correndo. O Matias recolheu as moedas e não sabe de quem é cada uma.', 'Há um saco de moedas tomadas dos fiéis e ninguém lembra quanto pagou.', [
    { label: 'Divide igual entre todas as casas.', karma: 2, flag: 'and_vatn_igual', say: 'Teve quem recebeu mais do que pagou e quem recebeu menos. Ninguém reclamou alto.', why: 'Justo o bastante para a vila voltar a se olhar.' },
    { label: 'Deixa tudo para a capela consertar o telhado.', karma: 1, flag: 'and_vatn_telhado', say: 'O telhado ficou bom. Dois fiéis pararam de vir: “a capela ficou com o nosso dinheiro, igual aos ladrões”.', why: 'Boa obra, mas feita com o que não era seu.' },
    { label: 'Escuta cada família e devolve o que cada uma diz ter pago.', karma: 3, flag: 'and_vatn_escuta', say: 'Levou dois dias. Uma viúva disse um valor menor do que pagou: “a vizinha precisa mais”.', why: 'Você confiou na vila, e a vila respondeu à altura.' } ]],
  ['Skógar', 6, 'Os mortos da mata estão de novo no chão. O caçador da mão podre vai perder dois dedos, não o braço. A Clemência chama isso de milagre pequeno.', 'O caçador mordido pede para não contar à mulher que foi um morto: ela acha que ele caiu numa armadilha.', [
    { label: 'Guarda o segredo dele.', karma: 0, flag: 'and_skog_segredo', say: 'A mulher descobriu sozinha, três semanas depois. Ficou brava com os dois.', why: 'Lealdade a um, mentira a outra.' },
    { label: 'Convence-o a contar, e fica ao lado dele quando conta.', karma: 3, flag: 'and_skog_conta', say: 'Ela chorou, depois riu do medo dele. Fez sopa para você também.', why: 'A verdade dita com companhia pesa menos.' },
    { label: 'Conta você mesmo, porque a vila precisa saber dos mortos.', karma: 1, flag: 'and_skog_aviso', say: 'A vila dobrou a vigia da mata. O caçador não fala mais com você.', why: 'Certo para a vila, duro para o homem.' } ]],
  ['Myrbakki', 6, 'Os diabretes da turfa sumiram de volta no fogo. As velas do altar estão no lugar, meio derretidas. O Cosme diz que elas cheiram a enxofre agora, e que Auréon não se importa.', 'Um diabrete ferido, pequeno, se esconde atrás do altar e implora em uma língua que ninguém entende.', [
    { label: 'Leva-o até a turfa e o solta no fogo de onde veio.', karma: 2, flag: 'and_myr_solta', say: 'Ele olhou para trás uma vez antes de sumir. As velas não foram mais roubadas.', why: 'Misericórdia sem ingenuidade.' },
    { label: 'Mata-o. Demônio é demônio.', karma: -1, flag: 'and_myr_mata', say: 'O Cosme ficou em silêncio. Na semana seguinte, três diabretes voltaram, maiores.', why: 'A lei da Ordem cumprida à risca, e o fogo lembrou.' },
    { label: 'Pede ao Cosme que o mantenha preso para estudá-lo.', karma: 0, flag: 'and_myr_estuda', say: 'O diabrete aprendeu três palavras humanas. Uma delas é “Zerath”.', why: 'Curiosidade. A Abadia vai querer saber disso.' } ]],
  ['Brekkuvik', 6, 'A teia da porta foi queimada e as aranhas, mortas. Atrás da teia estavam dois fiéis presos, vivos, magros e rezando.', 'Os dois presos na teia dizem que um deles abriu a porta para as aranhas em troca de não ser comido.', [
    { label: 'Não pergunta qual dos dois. Os dois sobreviveram, basta.', karma: 2, flag: 'and_brek_basta', say: 'Um deles deixou a vila no outono. O outro acende a vela todas as noites.', why: 'Você deixou a culpa para quem a carrega.' },
    { label: 'Descobre quem foi e o entrega à vila.', karma: 0, flag: 'and_brek_entrega', say: 'A vila o expulsou. A Teresa foi atrás dele com pão.', why: 'Justiça feita; a misericórdia ficou com a clériga.' },
    { label: 'Diz aos dois que Auréon já sabe, e que isso basta.', karma: 1, flag: 'and_brek_aureon', say: 'Os dois confessaram na mesma noite, juntos, chorando.', why: 'A consciência fez o trabalho que a espada não faria.' } ]],
  ['Vindholt', 6, 'Os afogados voltaram ao mar. O último ainda bateu na porta antes de cair: três batidas, como quem pede licença.', 'A Rosana quer abrir a porta da capela para os afogados na próxima noite de vento: “eles só pedem para entrar”.', [
    { label: 'Fica de vigia com ela, a porta aberta, a espada na mão.', karma: 3, flag: 'and_vind_porta', say: 'Um afogado entrou, ajoelhou no altar e se desfez em água. Os outros não vieram mais.', why: 'Coragem para dar uma chance, prudência para não dar duas.' },
    { label: 'Proíbe. Porta fechada.', karma: 0, flag: 'and_vind_fecha', say: 'A Rosana obedeceu. Nas noites de vento, ainda se ouvem as batidas.', why: 'Seguro. E triste.' },
    { label: 'Pede à Abadia uma bênção para a água do porto.', karma: 1, flag: 'and_vind_bencao', say: 'A carta foi. A resposta demorou um mês: “Mandem o paladino de volta. Ele benze.”', why: 'Você chamou a Ordem para dividir o peso.' } ]],
  ['Dalborg', 4, 'Os jovens licantropos da cerca recuaram para a selva. Um deles ficou para trás, ferido, e o Inácio cuidou da pata dele em silêncio.', 'O jovem licantropo ferido diz que a Mãe-Alfa não mandou: eles vieram porque a vila cortou as árvores da ninhada.', [
    { label: 'Leva o jovem de volta à selva e fala com a matilha.', karma: 3, flag: 'and_dalb_matilha', say: 'A Mãe-Alfa mandou dizer: “Um paladino que entrega lobo vivo. Anotado.” A cerca não foi mais testada.', why: 'Paz entre quem não se ama. É o mais difícil.' },
    { label: 'Exige que a vila pare de cortar aquele bosque.', karma: 2, flag: 'and_dalb_bosque', say: 'A vila resmungou. O lenhador foi cortar mais longe.', why: 'O erro também era humano.' },
    { label: 'Prende o jovem e o entrega à guarda.', karma: -2, flag: 'and_dalb_prende', say: 'Na lua cheia seguinte, a cerca caiu inteira.', why: 'A lei do muro trouxe a guerra do muro.' } ]],
  ['Steinfoss', 6, 'Os ossos do eco voltaram à Garganta. O Teodoro amarrou um sino na beira: se alguém cair, o sino toca. Ninguém sabe se o sino é para os vivos ou para os outros.', 'Entre os ossos há um medalhão com o brasão da Abadia: um paladino caiu ali, faz anos, e ninguém contou.', [
    { label: 'Leva o medalhão de volta para Cassius.', karma: 2, flag: 'and_stein_medalha', say: 'Você guarda o medalhão no peito. Ele pesa mais do que deveria.', why: 'Os da Ordem voltam para casa, nem que seja em metal.' },
    { label: 'Enterra o medalhão na beira da Garganta, junto ao sino.', karma: 1, flag: 'and_stein_sino', say: 'O sino tocou uma vez naquela noite, sem vento.', why: 'Você o deixou onde ele caiu servindo.' },
    { label: 'Pergunta ao Teodoro por que ninguém contou.', karma: 0, flag: 'and_stein_pergunta', say: '“Porque ele empurrou alguém antes de cair”, diz o Teodoro, “e a Abadia prefere santos.”', why: 'Algumas verdades a Ordem não quer ouvir.' } ]],
  ['Lundr', 6, 'Os lobos que contavam os sinos estão no chão. O Anselmo tocou a última reza no horário de sempre, sozinho, e nada veio. Ele chorou de alívio no meio do sino.', 'O Anselmo quer mudar a hora da última reza para sempre, “para os lobos nunca mais aprenderem”.', [
    { label: 'Concorda: mudar a hora é sabedoria, não medo.', karma: 1, flag: 'and_lund_hora', say: 'A reza agora é sem hora certa. Os fiéis reclamam. Os lobos também.', why: 'Prudência que custa um pouco de costume.' },
    { label: 'Pede que mantenha a hora: quem muda por medo, já perdeu.', karma: 2, flag: 'and_lund_mantem', say: 'O Anselmo manteve. Pôs uma lança do lado do sino. Os fiéis trazem uma também.', why: 'A vila aprendeu a não ter medo da própria hora.' },
    { label: 'Fica três noites tocando o sino com ele.', karma: 3, flag: 'and_lund_sino', say: 'Na terceira noite, você e o Anselmo tocaram tão fora do tom que a vila inteira veio rir. Ninguém mais teve medo do sino.', why: 'Às vezes livrar do mal é só não deixar ninguém sozinho.' } ]],
];
const cleric = (v: string) => CHAPELS.find((c) => c[0] === v)!;

export const WANDERER: QuestDef[] = ROUTE.map(([vila, n, doneLine, q, opts], i) => {
  const [, cl, woe, foe] = cleric(vila), prev = i === 0 ? null : cleric(ROUTE[i - 1][0]), lvl = 21 + i;
  const giver = prev ? prev[1] : CS;
  return { id: `aw${i + 1}`, chain: CH, name: `A Capela de ${vila}`, lvl, giver, turnin: cl, req: i === 0 ? 'pa1' : undefined, next: `aw${i + 2}`, xp: 0, gold: 180 + i * 20, items: i % 3 === 2 ? [['potion_g', 2]] : undefined,
    text: `${i === 0 ? 'O Grão-Mestre manda você sair da Abadia e andar. ' : ''}Vá à capela de Auréon de ${vila}, livre a vila do mal que a aflige (${n} inimigos) e fale com ${cl}. ${woe}`,
    objs: [{ kind: 'visit', poi: vila }, { kind: 'kill', type: foe, n }],
    talk: i === 0 ? [
      'Você fez o voto. Agora vem a parte que a Abadia não ensina: sair dela.',
      'Toda vila deste mundo tem uma capela, e quase toda capela tem um clérigo cansado, um mal na porta e ninguém para mandar. A Abadia é a mãe, {nome}. Mas mãe que segura o filho em casa não cria paladino.',
      { r: [
        { t: 'Para onde eu vou?', a: 'Para onde precisarem. Comece por Grenivik, ao sul. A Irmã Felícia escreve cartas que molham o papel. Cada clérigo lhe dirá a próxima.', luz: 1 },
        { t: 'E a Abadia, quem guarda?', a: 'Eu. O Aldric. As velas. A Abadia aguenta. As vilas, não.', luz: 1 },
        { t: 'Quanto tempo?', a: 'Até você parar de perguntar quanto tempo. Aí você terá entendido o que é um paladino.' } ] },
      'Ande, ajude, não pregue mais do que o necessário. E volte. Os andarilhos sempre voltam, nem que seja para sair de novo.',
    ] : [
      `Vai para ${vila}? Leve um pão. ${cl} come pouco e reza muito.`,
      `${woe}`,
      { r: [
        { t: 'Alguma recomendação?', a: 'Chegue de dia. Fale baixo. Mate só o que precisa morrer.', luz: 1 },
        { t: 'Você ouviu o sino tocar uma nota a mais?', a: 'Ouvi. Todo clérigo ouve. Ninguém afinou aquela nota. Não pergunte a mim: pergunte a quem fez o primeiro sino. Ninguém sabe quem foi.' } ] },
    ],
    choice: { q, opts },
    done: [doneLine, i < ROUTE.length - 1 ? `A próxima capela é a de ${ROUTE[i + 1][0]}. ${cleric(ROUTE[i + 1][0])[1]} espera há tempo demais.` : 'Você já andou por todas as capelas daqui. Volte à Abadia. O Grão-Mestre quer ouvir da sua boca.'] } satisfies QuestDef;
});
WANDERER.push({ id: `aw${ROUTE.length + 1}`, chain: CH, name: 'O Andarilho Volta', lvl: 32, giver: cleric(ROUTE[ROUTE.length - 1][0])[1], turnin: CS, xp: 0, gold: 600, gear: 2, title: 'Andarilho de Auréon',
  text: 'Volte à Abadia da Aurora e conte ao Grão-Mestre Cassius o que viu nas dez capelas.',
  objs: [{ kind: 'visit', poi: 'Abadia da Aurora' }, { kind: 'talk', npc: CS }],
  talk: ['Dez capelas. Você vai voltar diferente do que saiu. Todos voltam. Vá, a Abadia espera.'],
  done: [
    'Sente-se, {nome}. Não, no chão não: na cadeira. Andarilho que volta merece cadeira.',
    'Dez vilas. Dez clérigos que já não esperam sozinhos. Isso vale mais do que dez demônios no altar da Catedral.',
    { r: [
      { t: 'O sino toca uma nota a mais em todas as capelas.', a: 'Eu sei. Toca aqui também. Toca desde antes de mim, e antes do meu mestre. Um dia alguém vai descobrir quem afinou. Não serei eu.' },
      { t: 'Encontrei o medalhão de um irmão que caiu em Steinfoss.', a: '(Cassius fica muito tempo calado.) Chamava-se Bertrand. Não era santo. Era nosso. Obrigado.' },
      { t: 'Posso sair de novo?', a: 'Você já saiu. Agora só está de passagem por casa. É isso um paladino.', luz: 1 } ] },
    'Leve isto. E quando ouvir falar de uma vila sem ninguém, não espere carta minha.',
  ] });
